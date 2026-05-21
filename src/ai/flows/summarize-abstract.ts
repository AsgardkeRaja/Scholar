'use server';

/**
 * @fileOverview A flow for summarizing research paper abstracts.
 *
 * - summarizeAbstract - A function that summarizes the abstract of a research paper.
 * - SummarizeAbstractInput - The input type for the summarizeAbstract function.
 * - SummarizeAbstractOutput - The return type for the summarizeAbstract function.
 */

import { ai, withRetry } from '@/ai/genkit';
import { groqSummarize } from '@/ai/groq';
import { z } from 'genkit';

const SummarizeAbstractInputSchema = z.object({
  abstract: z
    .string()
    .describe('The abstract of the research paper to be summarized.'),
  model: z
    .enum(['gemini', 'groq'])
    .optional()
    .default('gemini')
    .describe('The AI model to use for summarization.'),
});
export type SummarizeAbstractInput = z.infer<typeof SummarizeAbstractInputSchema>;

const SummarizeAbstractOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the research paper abstract.'),
});
export type SummarizeAbstractOutput = z.infer<typeof SummarizeAbstractOutputSchema>;

export async function summarizeAbstract(input: SummarizeAbstractInput): Promise<SummarizeAbstractOutput> {
  if (input.model === 'groq') {
    // Use Groq SDK directly for Llama 3.3 70B
    return withRetry(async () => {
      return groqSummarize(input.abstract);
    }, 3, 2000);
  }
  // Default: use Gemini via Genkit
  return summarizeAbstractFlow({ abstract: input.abstract, model: 'gemini' });
}

const summarizeAbstractPrompt = ai.definePrompt({
  name: 'summarizeAbstractPrompt',
  input: { schema: z.object({ abstract: z.string() }) },
  output: { schema: SummarizeAbstractOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are a world-class scientific research analyst. Produce a high-quality, publication-ready summary of the following research paper abstract.

CRITICAL RULES:
- ALWAYS include specific quantitative data mentioned in the abstract: exact percentages, accuracy scores, F1 scores, p-values, sample sizes, speedup factors, error rates, confidence intervals, or any numerical results
- Never say vague things like "improved accuracy" or "significant improvement" — instead say exactly how much (e.g., "achieved 94.3% accuracy, a 12.5% improvement over the baseline")
- If the abstract mentions multiple metrics, include ALL of them
- Open with the research problem or objective
- State the methodology/approach concisely
- Present key findings WITH their exact numbers
- Mention implications or contributions
- Write 3-5 flowing sentences in formal academic language
- Do NOT use bullet points, headings, or markdown

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
      const { output } = await summarizeAbstractPrompt({ abstract: input.abstract });
      return output!;
    }, 3, 2000);
    return result;
  }
);
