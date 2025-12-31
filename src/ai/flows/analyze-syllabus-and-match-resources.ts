'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { WeeklyStudyPathModuleSchema } from '@/ai/schemas/study-path';
import { googleSearch, browse } from '@genkit-ai/google-genai';

const syllabusAnalysisInputSchema = z.object({
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

/**
 * Analyzes a syllabus (from a URL or text) and finds free learning resources to supplement it,
 * acting as a Strategic Personal Tutor based on user's custom instructions.
 * This function uses a three-step AI agent process:
 * 1. Syllabus Analyst: Fetches content from a URL and extracts the core topics.
 * 2. Free Resource Researcher: Finds high-quality free materials for the specified exam.
 * 3. Study Plan Architect: Synthesizes the information, prioritizes based on custom goals, and builds a structured study plan.
 */
export async function analyzeSyllabusAndMatchResources(
  input: z.infer<typeof syllabusAnalysisInputSchema>
): Promise<z.infer<typeof studyPathOutputSchema>> {
  try {
    const { examType, originalUrl, syllabusText, testDate, customInstructions } = input;

    let paidResourceTopics = '';
    if (originalUrl) {
      console.log(`Analyzing URL: ${originalUrl}`);
      // Step 1: The "Syllabus Analyst" - Scrape and understand the paid resource.
      const analysisResult = await ai.generate({
        model: 'gemini-1.5-flash',
        tools: [browse],
        prompt: `
          You are a Syllabus Analyst. Your job is to extract the key topics and teaching points from the provided URL.
          Fetch the content of this URL: ${originalUrl}
          Summarize the main educational topics it covers in a simple list.
        `,
      });
      paidResourceTopics = analysisResult.text;
    } else if (syllabusText) {
      paidResourceTopics = syllabusText;
    } else {
      throw new Error("Either a URL or syllabus text must be provided.");
    }
    
    console.log(`Extracted Topics: ${paidResourceTopics}`);

    // Step 2: The "Free Resource Researcher" - Find authoritative free resources.
    const searchResult = await ai.generate({
        model: 'gemini-pro',
        tools: [googleSearch],
        prompt: `
          You are a Free Resource Researcher. Your goal is to find the best free, high-authority study materials for the ${examType} exam for the year 2025.
          Focus exclusively on resources from official sources like Khan Academy, College Board, or official exam PDF guides.
          Provide a list of topics and the links to the best free resources you find.
        `
    });
    const freeResourceText = searchResult.text;
    console.log(`Found Free Resources: ${freeResourceText}`);


    let timelinePrompt = '';
    if (testDate) {
      const today = new Date();
      const timeDiff = testDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      timelinePrompt = `The user's test is on ${testDate.toLocaleDateString()}. They have ${daysLeft} days to prepare. Create a study plan organized by week.`;
    } else {
      timelinePrompt = `Create a study plan organized by week.`;
    }

    // Step 3: The "Study Plan Architect" - Synthesize, find gaps, and build the plan.
    const architectResult = await ai.generate({
      model: 'gemini-1.5-flash',
      prompt: `
        You are a Strategic Personal Tutor. Your task is to create a supplementary study plan that adheres to the user's specific goals.

        Your Chain-of-Thought Process:
        Step A: Analyze the curriculum from the user's paid resource.
        Step B: Carefully evaluate the user's custom instructions. This is your highest priority. If they have a specific request (e.g., 'focus on Math,' 'find harder questions'), you MUST tailor the plan to that, rather than giving a general overview.
        Step C: Compare the paid resource topics with the high-quality free resources you have found.
        Step D: Synthesize a plan. Create a weekly study plan using ONLY the free resources that fill gaps, offer a deeper dive, or directly address the user's custom instructions.
        
        ${timelinePrompt}

        For each module in your plan, the 'description' MUST explicitly reference the user's goal. For example: 'Since you requested more focus on Algebra, this advanced video from Khan Academy fills a gap left by your paid resource.' or 'To meet your goal of finding harder questions, this official practice exam provides challenging problems.'

        Format your final output as a clean JSON array of weekly study modules.
        Each object in the array must have a 'week' property and a 'modules' array.
        Each study object in the 'modules' array must have 'topic', 'description', and 'link'.
        Only output the final JSON array.

        Paid Resource Topics:
        ${paidResourceTopics}

        Available Free Resources:
        ${freeResourceText}

        User's Custom Instructions:
        ${customInstructions || 'No custom instructions provided. Focus on general supplementation.'}
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
