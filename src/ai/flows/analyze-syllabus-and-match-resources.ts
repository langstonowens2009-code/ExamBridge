'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { WeeklyStudyPathModuleSchema } from '@/ai/schemas/study-path';
import syllabusData from '@/lib/syllabusData.json';
import { db } from '@/lib/firebaseAdmin'; 
import { googleSearch, browse } from '@genkit-ai/google-genai';


const formInputSchema = z.object({
  examType: z.string(),
  originalUrl: z.string().url().optional(),
  syllabusText: z.string().optional(),
  testDate: z.date().optional(),
  customInstructions: z.string().optional(),
  userId: z.string().optional(), // Added to fetch user-specific stats
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
 * Acts as an Adaptive Learning Tutor. It analyzes a syllabus, checks for user-specific
 * weaknesses from a `userStats` collection, and uses a `resources` database to build a
 * personalized study plan. If no user stats are found, it creates a standard plan.
 */
export async function analyzeSyllabusAndMatchResources(
  input: z.infer<typeof formInputSchema>
): Promise<z.infer<typeof studyPathOutputSchema>> {
  try {
    const { examType, syllabusText, testDate, customInstructions, userId } = input;

    let syllabusContent: string;
    let planSourceNote = '';

    // Step 1: Define the curriculum blueprint.
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

    // Step 2: Fetch the mandatory high-quality resources from the database.
    console.log(`Querying Firestore for resources with category matching: ${examType}`);
    const resourcesSnapshot = await db.collection('resources').where('category', '==', examType).get();
    const availableResources = resourcesSnapshot.docs.map(doc => doc.data());
    
    if (availableResources.length === 0) {
        console.error(`No resources found for category '${examType}'. Cannot generate a plan.`);
         return [{
            week: 'Week 1',
            modules: [{
                topic: 'No Resources Found',
                description: `We could not find any study materials for the category '${examType}'. Please check the category or add resources to the database.`,
                link: '#'
            }]
        }];
    }
    console.log(`Found ${availableResources.length} resources in Firestore.`);
    const resourcesContext = `
        HERE ARE THE ONLY RESOURCES YOU ARE ALLOWED TO USE. YOU MUST USE THESE:
        ${JSON.stringify(availableResources, null, 2)}
    `;

    // Step 3: (Adaptive Logic) Fetch user's stats if available.
    let userStatsContext = "No user-specific data provided. Generate a standard, balanced study plan.";
    if (userId) {
        console.log(`Fetching stats for user: ${userId}`);
        const userStatsRef = db.collection('userStats').doc(userId);
        const userStatsDoc = await userStatsRef.get();

        if (userStatsDoc.exists) {
            const stats = userStatsDoc.data();
            console.log("Found user stats:", stats);
            userStatsContext = `
                This is an adaptive plan. The user's stats are:
                - Weak Topics: ${JSON.stringify(stats?.weakTopics || ['None specified'])}
                - Current Mastery Level: ${stats?.masteryLevel || 'Not specified'}
                
                Your primary goal is to create a plan that HEAVILY prioritizes their weak topics. Dedicate more time and modules to these areas.
            `;
        } else {
            console.log(`No stats document found for user ${userId}. Generating a standard plan.`);
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
      prompt: `
        You are an expert Adaptive Learning Tutor. Your task is to create a personalized, weekly study plan.

        Your Process:
        1.  **Analyze the Curriculum:** Review the provided syllabus structure. This is your primary blueprint.
        2.  **Use Provided Resources ONLY:** Build the study plan using ONLY the list of available database resources provided below. This is a strict requirement. Do not search the web or use any external knowledge for links.
        3.  **Adapt to the User:** Review the user's stats. If they have weak topics, build the plan to focus heavily on those areas. If not, create a balanced plan.
        4.  **Adhere to User Instructions:** Carefully follow the user's custom instructions.
        5.  **Synthesize the Plan:** Construct the weekly study plan. Each module must have a topic, a direct link to one of the provided resources, and a description.

        ${timelinePrompt}

        **Final Output Instructions:**
        - Format your final output as a clean JSON array of weekly study modules.
        - Each object in the array must have a 'week' property and a 'modules' array.
        - Each module object must have 'topic', 'description', and 'link'.
        - Prepend the following note to the 'description' of the very FIRST module in your plan: "${planSourceNote}"
        - Only output the final JSON array. Do not include any other text or markdown.

        ---
        HERE IS THE CURRICULUM BLUEPRINT:
        ${syllabusContent}
        ---
        HERE IS THE USER'S ADAPTIVE LEARNING PROFILE:
        ${userStatsContext}
        ---
        HERE ARE THE ONLY RESOURCES YOU ARE ALLOWED TO USE:
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
