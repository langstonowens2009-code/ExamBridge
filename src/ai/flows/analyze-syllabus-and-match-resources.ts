'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { WeeklyStudyPathModuleSchema } from '@/ai/schemas/study-path';
import syllabusData from '@/lib/syllabusData.json';
import { db } from '@/lib/firebaseAdmin'; // Import the admin DB instance

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

// Type assertion for the imported JSON
type SyllabusData = {
    [key: string]: {
        name: string;
        description: string;
        sections: any[];
    };
};

const localSyllabusData = syllabusData as SyllabusData;

/**
 * Acts as a Strategic Personal Tutor. It analyzes a syllabus (from a local JSON file first),
 * considers user goals, and builds a supplementary study plan using resources from a Firestore database.
 */
export async function analyzeSyllabusAndMatchResources(
  input: z.infer<typeof formInputSchema>
): Promise<z.infer<typeof studyPathOutputSchema>> {
  try {
    const { examType, originalUrl, syllabusText, testDate, customInstructions } = input;

    let syllabusContent: string;
    let planSourceNote = '';

    // Step 1: Prioritize local syllabus data
    const selectedSyllabus = localSyllabusData[examType];

    if (selectedSyllabus) {
        console.log(`Found '${examType}' in local syllabus data. Using it as the primary blueprint.`);
        syllabusContent = JSON.stringify(selectedSyllabus, null, 2);
        planSourceNote = `This plan is structured based on the standard curriculum for the ${selectedSyllabus.name}.`;
    } else {
        // This block will now primarily handle AP classes or other types not in the main JSON
        console.log(`'${examType}' not found in local data. Using it as a topic keyword.`);
        planSourceNote = `This plan is structured based on a custom search for the '${examType}' exam.`;
        syllabusContent = `The user wants to create a study plan for the exam: '${examType}'. Please structure a 4-week study plan for this exam.`;
    }

    // Step 2: Fetch relevant resources from Firestore
    console.log(`Querying Firestore for resources with category matching: ${examType}`);
    const resourcesSnapshot = await db.collection('resources').where('category', '==', examType).get();
    const availableResources = resourcesSnapshot.docs.map(doc => doc.data());
    
    let resourcesContext: string;
    if (availableResources.length > 0) {
        console.log(`Found ${availableResources.length} resources in Firestore.`);
        resourcesContext = `
            Here is a list of available, high-quality, free study resources from our database.
            You MUST use these resources to build the study plan. For each module you create, you MUST provide a direct link to one of these resources.
            
            Available Resources:
            ${JSON.stringify(availableResources, null, 2)}
        `;
    } else {
        console.log(`No resources found in Firestore for category: ${examType}. The AI will have to find its own.`);
        resourcesContext = `
            No pre-vetted resources were found in our database for this topic. You will need to find appropriate free resources on the web to build the study plan.
            For each module you create, find and provide a direct link to a high-quality, free resource.
        `;
    }

    // Create a timeline prompt if a test date is provided.
    let timelinePrompt = `Create a study plan organized by week. A standard plan is 4 weeks, but adjust if the user's test date suggests a different timeline.`;
    if (testDate) {
      const today = new Date();
      const timeDiff = testDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const weeksLeft = Math.floor(daysLeft / 7);
      timelinePrompt = `The user's test is on ${testDate.toLocaleDateString()}. They have ${daysLeft} days (${weeksLeft} full weeks) to prepare. Create a weekly study plan that fits this timeline.`;
    }

    // Step 3: The "Study Plan Architect" - Synthesize and build the plan.
    const architectResult = await ai.generate({
      model: 'gemini-1.5-pro-latest',
      // REMOVED `tools` property to prevent web search
      prompt: `
        You are a Strategic Personal Tutor. Your task is to create a personalized, weekly study plan using the provided resources.

        Your Process:
        1.  **Analyze the Curriculum:** Review the provided syllabus structure. This is your primary blueprint.
        2.  **Use Provided Resources:** Build the study plan using ONLY the list of available resources provided below. This is a strict requirement.
        3.  **Adhere to User Instructions:** Carefully follow the user's custom instructions.
        4.  **Synthesize the Plan:** Construct the weekly study plan. Each module in your plan must have a clear topic, a direct link to a resource from the provided list, and a description explaining WHY this resource is a good fit.
        
        ${timelinePrompt}

        **Final Output Instructions:**
        - Format your final output as a clean JSON array of weekly study modules.
        - Each object in the array must have a 'week' property and a 'modules' array.
        - Each module object must have 'topic', 'description', and 'link'.
        - Prepend the following note to the 'description' of the very FIRST module in your plan: "${planSourceNote}"
        - Only output the final JSON array. Do not include any other text or markdown.

        HERE IS THE CURRICULUM:
        ${syllabusContent}

        HERE ARE THE ONLY RESOURCES YOU ARE ALLOWED TO USE:
        ${resourcesContext}

        User's Custom Instructions:
        ${customInstructions || 'No custom instructions provided. Focus on creating a balanced, comprehensive plan using the given resources.'}
      `,
      output: {
        schema: studyPathOutputSchema,
      },
      // Add a timeout to this specific generate call
      config: {
        requestOptions: {
            timeout: 50000 // 50 seconds
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
    // Check if the error is a timeout error
    if (error instanceof Error && (error.message.includes('DEADLINE_EXCEEDED') || error.message.includes('timeout'))) {
        return fallbackResult;
    }
    return fallbackResult;
  }
}
