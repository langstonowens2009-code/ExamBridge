'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { WeeklyStudyPathModuleSchema } from '@/ai/schemas/study-path';
import { googleSearch, browse } from '@genkit-ai/google-genai';
import syllabusData from '@/lib/syllabusData.json';

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
 * considers user goals, and builds a supplementary study plan using free resources.
 * If the exam type is not in the local data, it uses a fallback strategy to search online.
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

        // If a URL is provided, use it for supplementary context only.
        if (originalUrl) {
            try {
                const analysisResult = await ai.generate({
                    model: 'gemini-1.5-flash',
                    tools: [browse],
                    prompt: `A user is studying for the ${examType}. Their primary curriculum is attached. The user has also provided this URL: ${originalUrl}. Briefly analyze the URL to see if it provides any specific details (like a course schedule, specific problem sets, or a unique teaching focus) that might supplement the main curriculum. Summarize your findings in a few sentences.`,
                });
                const supplementaryContext = analysisResult.text;
                syllabusContent += `\n\nSupplementary Context from URL: ${supplementaryContext}`;
                planSourceNote += ` I have also incorporated supplementary details from the provided URL.`;
            } catch (scrapeError) {
                console.warn(`Could not scrape supplementary URL ${originalUrl}. Proceeding with local data only.`);
                planSourceNote += ` I was unable to access the supplementary URL provided, so the plan is based on the standard curriculum.`;
            }
        }
    } else {
        console.log(`'${examType}' not found in local data. Using fallback online search.`);
        planSourceNote = `Since a standard curriculum for '${examType}' was not pre-configured, I have built this plan based on a dynamic web search for the best resources.`;
        
        // Fallback: Use the original logic if exam type is not in our JSON
        const fallbackSearch = await ai.generate({
            model: 'gemini-1.5-flash',
            tools: [googleSearch],
            prompt: `You are a Curriculum Detective. A user wants to study for the '${examType}' exam. Perform a targeted search for a typical syllabus, curriculum, and table of contents for the '${examType}'. Based on the search results, create a concise, summarized list of the likely topics and core concepts.`,
        });
        syllabusContent = fallbackSearch.text;
    }
    
    console.log(`Syllabus Content for AI: ${syllabusContent}`);

    // Create a timeline prompt if a test date is provided.
    let timelinePrompt = `Create a study plan organized by week. A standard plan is 4 weeks, but adjust if the user's test date suggests a different timeline.`;
    if (testDate) {
      const today = new Date();
      const timeDiff = testDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const weeksLeft = Math.floor(daysLeft / 7);
      timelinePrompt = `The user's test is on ${testDate.toLocaleDateString()}. They have ${daysLeft} days (${weeksLeft} full weeks) to prepare. Create a weekly study plan that fits this timeline.`;
    }

    // Step 2: The "Study Plan Architect" - Synthesize and build the plan.
    const architectResult = await ai.generate({
      model: 'gemini-1.5-flash',
      tools: [googleSearch],
      prompt: `
        You are a Strategic Personal Tutor. Your task is to create a personalized, weekly study plan.

        Your Chain-of-Thought Process:
        1.  **Analyze the Curriculum:** Review the provided syllabus structure. This is your primary blueprint. If it's in JSON format, adhere strictly to its hierarchy and topics.
        2.  **Prioritize User Instructions:** Carefully evaluate the user's custom instructions. This is your HIGHEST priority. If they have a specific request (e.g., 'focus on Math,' 'find video lectures'), you MUST tailor the plan to that.
        3.  **Find Free Resources:** For each topic in the curriculum, perform targeted Google searches to find the BEST FREE, high-authority study materials (e.g., official guides, university lectures, Khan Academy, practice sites).
        4.  **Synthesize the Plan:** Construct the weekly study plan. Each module in your plan must have a clear topic, a direct link to a free resource, and a description explaining WHY this resource is a good fit, explicitly referencing the user's goals or the curriculum.
        
        ${timelinePrompt}

        **Final Output Instructions:**
        - Format your final output as a clean JSON array of weekly study modules.
        - Each object in the array must have a 'week' property and a 'modules' array.
        - Each module object must have 'topic', 'description', and 'link'.
        - Prepend the following note to the 'description' of the very FIRST module in your plan: "${planSourceNote}"
        - Only output the final JSON array. Do not include any other text or markdown.

        HERE IS THE CURRICULUM:
        ${syllabusContent}

        User's Custom Instructions:
        ${customInstructions || 'No custom instructions provided. Focus on creating a balanced, comprehensive plan.'}
      `,
      output: {
        schema: studyPathOutputSchema,
      },
    });

    const structuredOutput = architectResult.output;
    
    if (!structuredOutput || structuredOutput.length === 0) {
        console.error("Architect AI failed to produce structured output.");
        return fallbackResult;
    }

    return structuredOutput;

  } catch (error) {
    console.error("Error in analyzeSyllabusAndMatchResources flow:", error);
    return fallbackResult;
  }
}
