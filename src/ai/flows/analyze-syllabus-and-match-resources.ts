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
 * Analyzes a syllabus (from a URL or text) and finds free learning resources to supplement it.
 * This function uses a three-step AI agent process:
 * 1. Syllabus Analyst: Fetches content from a URL and extracts the core topics.
 * 2. Free Resource Researcher: Finds high-quality free materials for the specified exam.
 * 3. Study Plan Architect: Synthesizes the information, identifies gaps, and builds a structured study plan.
 */
export async function analyzeSyllabusAndMatchResources(
  input: z.infer<typeof syllabusAnalysisInputSchema>
): Promise<z.infer<typeof studyPathOutputSchema>> {
  try {
    const { examType, originalUrl, syllabusText, testDate } = input;

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
        You are a Study Plan Architect. Your task is to create a supplementary study plan.
        You have been given a list of topics from a user's paid resource and a list of high-quality free resources.
        
        Your Goal: Compare the paid resource topics with the free resources. Create a weekly study plan using ONLY the free resources that fill gaps or offer a deeper dive than the paid resource likely does.

        ${timelinePrompt}

        For each module in your plan, the 'description' MUST explain why this free resource is a necessary supplement. 
        For example: 'While the paid site covers the basics, this Khan Academy video provides a deep-dive required for the new exam format.' or 'This official guide covers a niche topic often missed by third-party resources.'

        Format your final output as a clean JSON array of weekly study modules.
        Each object in the array must have a 'week' property and a 'modules' array.
        Each study object in the 'modules' array must have 'topic', 'description', and 'link'.
        Only output the final JSON array.

        Paid Resource Topics:
        ${paidResourceTopics}

        Available Free Resources:
        ${freeResourceText}
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
