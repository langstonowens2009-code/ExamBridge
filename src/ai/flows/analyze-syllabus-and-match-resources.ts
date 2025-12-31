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

function getSiteName(url: string): string {
    try {
        const hostname = new URL(url).hostname;
        const parts = hostname.replace(/^www\./, '').split('.');
        // Return the second-to-last part, which is usually the main domain name
        return parts.length > 1 ? parts[parts.length - 2] : parts[0];
    } catch (e) {
        return 'the provided site';
    }
}

/**
 * Acts as a Strategic Personal Tutor. It analyzes a syllabus (from URL or text), 
 * considers user goals, and builds a supplementary study plan using free resources.
 * If the URL is unscrapable, it uses a fallback strategy to infer the curriculum.
 */
export async function analyzeSyllabusAndMatchResources(
  input: z.infer<typeof syllabusAnalysisInputSchema>
): Promise<z.infer<typeof studyPathOutputSchema>> {
  try {
    const { examType, originalUrl, syllabusText, testDate, customInstructions } = input;

    let paidResourceTopics = '';
    let fallbackNote = '';
    const siteName = originalUrl ? getSiteName(originalUrl) : '';

    if (customInstructions && originalUrl) {
      console.log("Custom instructions provided, will prioritize them.");
    }
    
    // Step 1: Analyze the provided resource (URL or text)
    if (originalUrl) {
        try {
            console.log(`Analyzing URL: ${originalUrl}`);
            // The "Syllabus Analyst" - Scrape and understand the paid resource.
            const analysisResult = await ai.generate({
                model: 'gemini-1.5-flash',
                tools: [browse],
                prompt: `You are a Syllabus Analyst. Fetch the content of this URL: ${originalUrl}. Summarize the main educational topics it covers in a simple list. Identify its teaching style and unique benefits.`,
            });
            paidResourceTopics = analysisResult.text;
            if (!paidResourceTopics.trim()) throw new Error("Scraping returned empty content.");
        } catch (scrapeError) {
            console.warn(`Scraping failed for ${originalUrl}. Initiating fallback.`, scrapeError);
            
            // If there are specific instructions, we can ignore the link and focus on those.
            if (customInstructions) {
                paidResourceTopics = `PRIORITY: The user has provided custom instructions to focus on specific areas. The original URL failed to load. Base the plan primarily on the user's request for the ${examType} exam.`;
                fallbackNote = `Note: I couldn't scan that specific page, but I've built this plan to focus on your specific goals for the ${examType} exam.`;
            } else {
                // Fallback Step: The "Curriculum Detective" - Infer content from search.
                console.log(`Performing fallback search for: ${siteName} ${examType} curriculum and features`);
                const fallbackSearch = await ai.generate({
                    model: 'gemini-1.5-flash',
                    tools: [googleSearch],
                    prompt: `You are a Curriculum Detective. A user wants to know what the paid resource '${siteName}' covers for the '${examType}' exam. Perform a targeted search for '${siteName} ${examType} curriculum and features'. Based on the search results, create a concise, summarized list of the likely topics and features this paid resource offers.`,
                });
                paidResourceTopics = fallbackSearch.text;
                fallbackNote = `Note: I couldn't scan that specific page, so I built this plan based on ${siteName}’s general curriculum and your goals.`;
            }
        }
    } else if (syllabusText) {
        paidResourceTopics = syllabusText;
    } else {
        throw new Error("Either a URL or syllabus text must be provided.");
    }
    
    console.log(`Extracted/Inferred Topics: ${paidResourceTopics}`);

    // Step 2: The "Free Resource Researcher" - Find authoritative free resources.
    const searchResult = await ai.generate({
        model: 'gemini-pro',
        tools: [googleSearch],
        prompt: `You are a Free Resource Researcher. Find the best free, high-authority study materials for the ${examType} exam for the year 2025. Focus on official sources like Khan Academy, College Board, or official exam PDF guides. Provide a list of topics and links.`,
    });
    const freeResourceText = searchResult.text;
    console.log(`Found Free Resources: ${freeResourceText}`);

    // Create a timeline prompt if a test date is provided.
    let timelinePrompt = `Create a study plan organized by week.`;
    if (testDate) {
      const today = new Date();
      const timeDiff = testDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      timelinePrompt = `The user's test is on ${testDate.toLocaleDateString()}. They have ${daysLeft} days to prepare. Create a weekly study plan.`;
    }

    // Step 3: The "Study Plan Architect" - Synthesize, find gaps, and build the plan.
    const architectResult = await ai.generate({
      model: 'gemini-1.5-flash',
      prompt: `
        You are a Strategic Personal Tutor. Create a supplementary study plan that adheres to the user's specific goals.

        Your Chain-of-Thought Process:
        Step A: Analyze the curriculum from the user's resource (paid or inferred).
        Step B: Carefully evaluate the user's custom instructions. This is your HIGHEST priority. If they have a specific request (e.g., 'focus on Math,' 'find harder questions'), you MUST tailor the plan to that.
        Step C: Compare the resource topics with the high-quality free materials you have found.
        Step D: Synthesize a plan. Create a weekly study plan using ONLY the free resources that fill gaps, offer a deeper dive, or directly address the user's custom instructions.
        
        ${timelinePrompt}

        For each module in your plan, the 'description' MUST explicitly reference the user's goal or the gap it fills. For example: 'Since you requested more focus on Algebra, this advanced video fills a gap left by your primary resource.'
        
        ${fallbackNote ? `IMPORTANT: Prepend the following note to the description of the very FIRST module in your plan: "${fallbackNote}"` : ''}

        Format your final output as a clean JSON array of weekly study modules.
        Each object in the array must have a 'week' property and a 'modules' array.
        Each study object in the 'modules' array must have 'topic', 'description', and 'link'.
        Only output the final JSON array.

        User's Resource Topics:
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
