'use server';

/**
 * @fileOverview A flow to suggest similar papers based on a user's search query and the content of results.
 *
 * - suggestSimilarPapers - A function that handles the suggestion of similar papers.
 * - SuggestSimilarPapersInput - The input type for the suggestSimilarPapers function.
 * - SuggestSimilarPapersOutput - The return type for the suggestSimilarPapers function.
 */

import { ai, withRetry } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestSimilarPapersInputSchema = z.object({
  searchQuery: z.string().describe('The user\u2019s original search query.'),
  searchResults: z.array(
    z.object({
      title: z.string().describe('The title of the paper.'),
      abstract: z.string().describe('The abstract of the paper.'),
    })
  ).describe('The list of search results to find similar papers from.'),
  numSuggestions: z.number().describe('The number of similar papers to suggest.'),
});
export type SuggestSimilarPapersInput = z.infer<typeof SuggestSimilarPapersInputSchema>;

const SuggestSimilarPapersOutputSchema = z.array(
  z.object({
    title: z.string().describe('The title of the suggested paper.'),
    abstract: z.string().describe('The abstract of the suggested paper.'),
  })
).describe('A list of similar papers suggested based on the search query and results.');
export type SuggestSimilarPapersOutput = z.infer<typeof SuggestSimilarPapersOutputSchema>;

export async function suggestSimilarPapers(input: SuggestSimilarPapersInput): Promise<SuggestSimilarPapersOutput> {
  return suggestSimilarPapersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSimilarPapersPrompt',
  input: { schema: SuggestSimilarPapersInputSchema },
  output: { schema: SuggestSimilarPapersOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert research assistant. Given a user's search query and a list of search results, suggest {{numSuggestions}} similar papers from the provided search results that the user may find helpful, but which they have not already seen.

User Search Query: {{{searchQuery}}}

Search Results:
{{#each searchResults}}
Title: {{{title}}}
Abstract: {{{abstract}}}
{{/each}}

Suggest similar papers in the following JSON format:

`,
});

const suggestSimilarPapersFlow = ai.defineFlow(
  {
    name: 'suggestSimilarPapersFlow',
    inputSchema: SuggestSimilarPapersInputSchema,
    outputSchema: SuggestSimilarPapersOutputSchema,
  },
  async input => {
    const result = await withRetry(async () => {
      const { output } = await prompt(input);
      return output!;
    }, 3, 2000);
    return result;
  }
);
