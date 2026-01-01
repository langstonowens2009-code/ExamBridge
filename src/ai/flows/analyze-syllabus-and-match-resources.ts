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
 * Acts as a Strategic Personal Tutor. It analyzes a syllabus,
 * checks a Firestore database for resources first, and if none are found,
 * falls back to searching the web to build a supplementary study plan.
 */
export async function analyzeSyllabusAndMatchResources(
  input: z.infer<typeof formInputSchema>
): Promise<z.infer<typeof studyPathOutputSchema>> {
  try {
    const { examType, originalUrl, syllabusText, testDate, customInstructions } = input;

    let syllabusContent: string;
    let planSourceNote = '';

    // Step 1: Prioritize local syllabus data or create a simple topic prompt.
    const selectedSyllabus = localSyllabusData[examType];

    if (selectedSyllabus) {
        console.log(`Found '${examType}' in local syllabus data. Using it as the primary blueprint.`);
        syllabusContent = JSON.stringify(selectedSyllabus, null, 2);
        planSourceNote = `This plan is structured based on the standard curriculum for the ${selectedSyllabus.name}.`;
    } else if (syllabusText) {
        console.log(`Using user-provided syllabus text for '${examType}'.`);
        syllabusContent = syllabusText;
        planSourceNote = `This plan is structured based on the syllabus you provided for '${examType}'.`;
    } else {
        planSourceNote = `This plan is structured for the topic: '${examType}'.`;
        syllabusContent = `The user wants to create a study plan for the exam or topic: '${examType}'. Please structure a 4-week study plan.`;
    }


    // Step 2 (Hybrid): Check Firestore for resources first.
    console.log(`Querying Firestore for resources with category matching: ${examType}`);
    const resourcesSnapshot = await db.collection('resources').where('category', '==', examType).get();
    const availableResources = resourcesSnapshot.docs.map(doc => doc.data());
    
    let resourcesContext: string;
    let toolsToUse: any[] = [];
    let promptInstructions: string;

    if (availableResources.length > 0) {
        console.log(`Found ${availableResources.length} resources in Firestore. Using database-first approach.`);
        resourcesContext = `
            HERE ARE THE ONLY RESOURCES YOU ARE ALLOWED TO USE:
            ${JSON.stringify(availableResources, null, 2)}
        `;
        promptInstructions = `
        Your Process:
        1.  **Analyze the Curriculum:** Review the provided syllabus structure. This is your primary blueprint.
        2.  **Use Provided Resources:** Build the study plan using ONLY the list of available resources provided below. This is a strict requirement. Do not search the web or use any external tools.
        3.  **Adhere to User Instructions:** Carefully follow the user's custom instructions.
        4.  **Synthesize the Plan:** Construct the weekly study plan. Each module in your plan must have a clear topic, a direct link to a resource, and a description explaining WHY this resource is a good fit.
        `;
    } else {
        console.log(`No resources found for '${examType}' in Firestore. Falling back to web search.`);
        resourcesContext = `No pre-vetted resources were found in our database for this topic.`;
        toolsToUse = [googleSearch, browse];
        promptInstructions = `
        Your Process:
        1.  **Analyze the Curriculum:** Review the provided syllabus structure.
        2.  **Find Resources Online:** You must find 3-5 high-quality, free study websites to build the study plan. Use your search tools for this.
        3.  **Adhere to User Instructions:** Carefully follow the user's custom instructions.
        4.  **Synthesize the Plan:** Construct the weekly study plan. For each module you create, you must provide a direct link to a high-quality, free resource. This is a critical requirement.
        `;
    }

    // Create a timeline prompt if a test date is provided.
    let timelinePrompt = `Create a study plan organized by week. A standard plan is 4 weeks, but adjust if the user's test date suggests a different timeline.`;
    if (testDate) {
      const today = new Date();
      const timeDiff = testDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const weeksLeft = Math.floor(daysLeft / 7);
      timelinePrompt = `The user's test is on ${testDate.toLocaleDateString()}. They have ${daysLeft} days (~${weeksLeft} full weeks) to prepare. Create a weekly study plan that fits this timeline.`;
    }

    // Step 3: The "Study Plan Architect" - Synthesize and build the plan.
    const architectResult = await ai.generate({
      model: 'gemini-1.5-pro-latest',
      tools: toolsToUse,
      prompt: `
        You are a Strategic Personal Tutor. Your task is to create a personalized, weekly study plan.
        
        ${promptInstructions}
        
        ${timelinePrompt}

        **Final Output Instructions:**
        - Format your final output as a clean JSON array of weekly study modules.
        - Each object in the array must have a 'week' property and a 'modules' array.
        - Each module object must have 'topic', 'description', and 'link'.
        - If provided with database resources, use those first. If not, use your search tool to find 3-5 high-quality free study websites for this exam.
        - Prepend the following note to the 'description' of the very FIRST module in your plan: "${planSourceNote}"
        - Only output the final JSON array. Do not include any other text or markdown.

        HERE IS THE CURRICULUM BLUEPRINT:
        ${syllabusContent}

        ${resourcesContext}

        User's Custom Instructions:
        ${customInstructions || 'No custom instructions provided. Focus on creating a balanced, comprehensive plan.'}
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
