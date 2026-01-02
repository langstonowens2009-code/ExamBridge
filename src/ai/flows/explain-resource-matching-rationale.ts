'use server';
/**
 * @fileOverview Explains the rationale behind a resource match.
 *
 * - explainResourceMatchingRationale - A function that takes a topic and a resource and explains why they match.
 * - ExplainResourceMatchingRationaleInput - The input type for the explainResourceMatchingRationale function.
 * - ExplainResourceMatchingRationaleOutput - The return type for the explainResourceMatchingRationale function.
 */

import {ai} from '@/ai/init';
import {
  ExplainResourceMatchingRationaleInputSchema,
  ExplainResourceMatchingRationaleOutputSchema,
  type ExplainResourceMatchingRationaleInput,
  type ExplainResourceMatchingRationaleOutput,
} from '@/ai/schemas/study-path';

export async function explainResourceMatchingRationale(
  input: ExplainResourceMatchingRationaleInput
): Promise<ExplainResourceMatchingRationaleOutput> {
  return explainResourceMatchingRationaleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainResourceMatchingRationalePrompt',
  input: {schema: ExplainResourceMatchingRationaleInputSchema},
  output: {schema: ExplainResourceMatchingRationaleOutputSchema},
  prompt: `You are an expert at explaining why a free resource is a good substitute for content found in paid educational resources.

  Given the following topic from a paid resource:
  {{topic}}

  And the following free resource link:
  {{resourceLink}}

  Explain in one sentence why this free resource is a good substitute for the topic in the paid resource. Focus on the specific educational content of the free resource.`,
});

const explainResourceMatchingRationaleFlow = ai.defineFlow(
  {
    name: 'explainResourceMatchingRationaleFlow',
    inputSchema: ExplainResourceMatchingRationaleInputSchema,
    outputSchema: ExplainResourceMatchingRationaleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
