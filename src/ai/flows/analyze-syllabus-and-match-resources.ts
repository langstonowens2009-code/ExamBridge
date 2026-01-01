
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { WeeklyStudyPathModuleSchema } from '@/ai/schemas/study-path';
import syllabusData from '@/lib/syllabusData.json';

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
        topic: 'AI Generation Failed',
        description: 'The AI tutor took too long to respond or an unexpected error occurred. This can happen during peak hours. Please try generating the plan again.',
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
 * Acts as an Expert AI Tutor that generates a study plan from its internal knowledge.
 * It does not use web search or external databases to ensure speed and reliability.
 */
export async function analyzeSyllabusAndMatchResources(
  input: z.infer<typeof formInputSchema>
): Promise<z.infer<typeof studyPathOutputSchema>> {
  try {
    const { examType, syllabusText, testDate, customInstructions } = input;

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
        syllabusContent = `The user wants to create a study plan for the exam or topic: '${examType}'. Please structure a 4-week study plan based on the typical curriculum for this topic.`;
    }

    // Step 2: Determine the timeline for the study plan.
    let timelinePrompt = `Create a study plan organized by week. A standard plan is 4 weeks, but adjust if the user's test date suggests a different timeline.`;
    if (testDate) {
      const today = new Date();
      const timeDiff = testDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const weeksLeft = Math.floor(daysLeft / 7);
      timelinePrompt = `The user's test is on ${testDate.toLocaleDateString()}. They have ${daysLeft} days (~${weeksLeft} full weeks) to prepare. Create a weekly study plan that fits this timeline.`;
    }

    // Step 3: Synthesize and build the plan using internal knowledge.
    const architectResult = await ai.generate({
      model: 'gemini-1.5-pro-latest',
      prompt: `
        You are an Expert AP & SAT Tutor with 20+ years of experience. Your task is to create a professional, personalized, weekly study roadmap based on your deep internal knowledge.

        **DO NOT USE EXTERNAL LINKS OR SEARCH THE WEB.**

        Your Process:
        1.  **Analyze the Curriculum:** Review the provided syllabus or topic. This is your primary blueprint.
        2.  **Generate Core Concepts:** For each topic, use your expertise to outline the most critical concepts, formulas, and vocabulary.
        3.  **Identify Common Pitfalls:** Warn the user about common mistakes or misunderstandings for each topic.
        4.  **Create Actionable Study Tasks:** Instead of providing links, generate specific 'Self-Study Activities'. These should be concrete tasks the user can perform.
            -   Good Example: 'For cellular respiration, draw and label the stages of glycolysis and the Krebs cycle. Then, write a one-paragraph summary of the electron transport chain's purpose.'
            -   Bad Example: 'Study cellular respiration.'
        5.  **Suggest Search Terms:** For the 'link' field, provide a placeholder of '#'. In the 'description', guide the user on what to search for on trusted platforms.
            -   Example Description: "...To practice this, search for 'AP Biology Unit 3 practice questions' on the Official College Board AP Classroom website or Khan Academy."

        ${timelinePrompt}

        **Final Output Instructions:**
        - Format your final output as a clean JSON array of weekly study modules.
        - Each module must have 'topic', 'description', and 'link'.
        - The 'link' field MUST be '#'.
        - The 'description' for each module should include the concepts, pitfalls, and a self-study activity.
        - Prepend the following note to the 'description' of the very FIRST module: "${planSourceNote}"
        - Only output the final JSON array.

        ---
        HERE IS THE CURRICULUM BLUEPRINT:
        ${syllabusContent}
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

  } catch (error: any) {
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
