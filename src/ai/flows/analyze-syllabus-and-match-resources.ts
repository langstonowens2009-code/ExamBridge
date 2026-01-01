
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { WeeklyStudyPathModuleSchema } from '@/ai/schemas/study-path';
import syllabusData from '@/lib/syllabusData.json';
import { db } from '@/lib/firebaseAdmin'; // Use the server-side admin SDK
import { googleSearch, browse } from '@genkit-ai/google-genai';

const formInputSchema = z.object({
  examType: z.string(),
  originalUrl: z.string().url().optional(),
  syllabusText: z.string().optional(),
  testDate: z.date().optional(),
  customInstructions: z.string().optional(),
  userId: z.string().optional(),
});

const studyPathOutputSchema = z.array(WeeklyStudyPathModuleSchema);

const fallbackResult = [{
    week: 'Week 1',
    modules: [{
        topic: 'Search Timed Out',
        description: 'The AI search took too long to complete. This can happen during peak hours. Please try generating the plan again.',
        link: '#'
    }]
}];

type SyllabusData = {
    [key: string]: {
        name: string;
        description: string;
        sections: any[];
    };
};

const localSyllabusData = syllabusData as SyllabusData;

/**
 * Acts as an Adaptive Learning Tutor with a Hybrid Search model.
 * 1. It first queries a local Firestore `resources` database.
 * 2. If high-quality, pre-vetted resources are found, it uses them exclusively.
 * 3. If no resources are found, it falls back to a web search.
 * 4. It also checks for user-specific stats to adapt the plan.
 */
export async function analyzeSyllabusAndMatchResources(
  input: z.infer<typeof formInputSchema>
): Promise<z.infer<typeof studyPathOutputSchema>> {
  try {
    const { examType, syllabusText, testDate, customInstructions, userId } = input;

    // Step 1: Define the curriculum blueprint.
    let syllabusContent: string;
    let planSourceNote = '';
    const selectedSyllabus = localSyllabusData[examType];
    if (selectedSyllabus) {
        syllabusContent = JSON.stringify(selectedSyllabus, null, 2);
        planSourceNote = `This plan is structured based on the standard curriculum for the ${selectedSyllabus.name}.`;
    } else if (syllabusText) {
        syllabusContent = syllabusText;
        planSourceNote = `This plan is structured based on the syllabus you provided for '${examType}'.`;
    } else {
        planSourceNote = `This plan is structured for the topic: '${examType}'.`;
        syllabusContent = `The user wants to create a study plan for the exam or topic: '${examType}'. Please structure a 4-week study plan.`;
    }

    // Step 2 (HYBRID LOGIC): Query Firestore first.
    console.log(`Querying Firestore for resources with category matching: ${examType}`);
    const resourcesSnapshot = await db.collection('resources').where('category', '==', examType).get();
    const availableResources = resourcesSnapshot.docs.map(doc => doc.data());
    
    let resourcesContext = '';
    let searchTools = []; // By default, no search tools.
    
    if (availableResources.length > 0) {
        console.log(`Found ${availableResources.length} resources in Firestore. Using database-first approach.`);
        resourcesContext = `
            HERE IS YOUR LIBRARY OF EXPERT-VETTED RESOURCES. USE THESE *ONLY*:
            ${JSON.stringify(availableResources, null, 2)}
        `;
        // Web search is disabled when we have database results.
    } else {
        console.log(`No resources found in Firestore for '${examType}'. Falling back to web search.`);
        resourcesContext = `You did not find any resources in the internal database. Use your search tool to find 3-5 high-quality, free study websites for this exam.`;
        searchTools = [googleSearch, browse]; // Enable search tools as a fallback.
    }

    // Step 3: (Adaptive Logic) Fetch user's stats if available.
    let userStatsContext = "No user-specific data provided. Generate a standard, balanced study plan.";
    if (userId) {
        const userStatsRef = db.collection('userStats').doc(userId);
        const userStatsDoc = await userStatsRef.get();
        if (userStatsDoc.exists) {
            const stats = userStatsDoc.data();
            userStatsContext = `
                This is an adaptive plan. The user's stats are:
                - Weak Topics: ${JSON.stringify(stats?.weakTopics || ['None specified'])}
                - Current Mastery Level: ${stats?.masteryLevel || 'Not specified'}
                Your primary goal is to create a plan that HEAVILY prioritizes their weak topics. Dedicate more time and modules to these areas.
            `;
        }
    }

    // Step 4: Determine the timeline for the study plan.
    let timelinePrompt = `Create a study plan organized by week. A standard plan is 4 weeks, but adjust if the user's test date suggests a different timeline.`;
    if (testDate) {
      const today = new Date();
      const timeDiff = testDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const weeksLeft = Math.floor(daysLeft / 7);
      timelinePrompt = `The user's test is on ${testDate.toLocaleDateString()}. They have ${daysLeft} days (~${weeksLeft} full weeks) to prepare. Create a weekly study plan that fits this timeline.`;
    }

    // Step 5: Synthesize and build the plan.
    const architectResult = await ai.generate({
      model: 'gemini-1.5-pro-latest',
      tools: searchTools,
      prompt: `
        You are an expert Strategic Personal Tutor. Your task is to create a professional, personalized, weekly study roadmap.

        Your Process:
        1.  **Analyze the Curriculum:** Review the provided syllabus structure. This is your primary blueprint.
        2.  **Check Your Library:** You have been provided with a library of expert-vetted resources. If this library is not empty, you MUST use links from it to build the study plan.
        3.  **Use Search as a Fallback:** If your resource library is empty for this topic, and ONLY in that case, use your search tools to find 3-5 high-quality, free educational websites.
        4.  **Force Variety:** Do not use the same link for every module. A professional roadmap includes a mix of resource types. Assign a variety of videos, practice sets, and guides from the provided list.
        5.  **Adapt to the User:** Review the user's stats. If they have weak topics, build the plan to focus heavily on those areas.
        6.  **Follow Instructions:** Adhere to the user's timeline and custom instructions.

        ${timelinePrompt}

        **Final Output Instructions:**
        - Format your final output as a clean JSON array of weekly study modules.
        - Each module must have 'topic', 'description', and 'link'.
        - Prepend the following note to the 'description' of the very FIRST module: "${planSourceNote}"
        - Only output the final JSON array.

        ---
        HERE IS THE CURRICULUM BLUEPRINT:
        ${syllabusContent}
        ---
        HERE IS THE USER'S ADAPTIVE LEARNING PROFILE:
        ${userStatsContext}
        ---
        HERE ARE YOUR AVAILABLE RESOURCES (MAY BE EMPTY):
        ${resourcesContext}
        ---
        USER'S CUSTOM INSTRUCTIONS:
        ${customInstructions || 'No custom instructions provided.'}
      `,
      output: {
        schema: studyPathOutputSchema,
      },
      config: {
        requestOptions: {
            timeout: 55000 // 55 seconds
        }
      }
    });

    const structuredOutput = architectResult.output;
    
    if (!structuredOutput || structuredOutput.length === 0) {
        console.error("Architect AI failed to produce structured output.");
        return fallbackResult;
    }

    return structuredOutput;

  } catch (error) {
    console.error("Error in analyzeSyllabusAndMatchResources flow:", error);
    if (error instanceof Error && (error.message.includes('DEADLINE_EXCEEDED') || error.message.includes('timeout'))) {
        return fallbackResult;
    }
    return [{
        week: 'Week 1',
        modules: [{
            topic: 'Error Generating Plan',
            description: 'An unexpected error occurred while creating your study plan. Please try again.',
            link: '#'
        }]
    }];
  }
}
