'use server';

/**
 * @fileOverview A flow for summarizing research paper abstracts.
 *
 * - summarizeAbstract - A function that summarizes the abstract of a research paper.
 * - SummarizeAbstractInput - The input type for the summarizeAbstract function.
 * - SummarizeAbstractOutput - The return type for the summarizeAbstract function.
 */

import { ai, withRetry } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeAbstractInputSchema = z.object({
  abstract: z
    .string()
    .describe('The abstract of the research paper to be summarized.'),
});
export type SummarizeAbstractInput = z.infer<typeof SummarizeAbstractInputSchema>;

const SummarizeAbstractOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the research paper abstract.'),
});
export type SummarizeAbstractOutput = z.infer<typeof SummarizeAbstractOutputSchema>;

export async function summarizeAbstract(input: SummarizeAbstractInput): Promise<SummarizeAbstractOutput> {
  return summarizeAbstractFlow(input);
}

const summarizeAbstractPrompt = ai.definePrompt({
  name: 'summarizeAbstractPrompt',
  input: { schema: SummarizeAbstractInputSchema },
  output: { schema: SummarizeAbstractOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert scientific summarizer.  Please provide a concise summary of the following research paper abstract:

Abstract: {{{abstract}}}`,
});

const summarizeAbstractFlow = ai.defineFlow(
  {
    name: 'summarizeAbstractFlow',
    inputSchema: SummarizeAbstractInputSchema,
    outputSchema: SummarizeAbstractOutputSchema,
  },
  async input => {
    const result = await withRetry(async () => {
      const { output } = await summarizeAbstractPrompt(input);
      return output!;
    }, 3, 2000);
    return result;
  }
);
