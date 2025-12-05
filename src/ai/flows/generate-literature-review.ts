'use server';
/**
 * @fileOverview A flow for generating a literature review from a list of research papers.
 *
 * - generateLiteratureReview - A function that generates a literature review.
 * - GenerateLiteratureReviewInput - The input type for the generateLiteratureReview function.
 * - GenerateLiteratureReviewOutput - The return type for the generateLiteratureReview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PaperSchema = z.object({
  title: z.string().describe('The title of the paper.'),
  abstract: z.string().describe('The abstract of the paper.'),
});

const GenerateLiteratureReviewInputSchema = z.object({
  papers: z.array(PaperSchema).describe('An array of papers to include in the literature review.'),
});
export type GenerateLiteratureReviewInput = z.infer<typeof GenerateLiteratureReviewInputSchema>;

const GenerateLiteratureReviewOutputSchema = z.object({
  literatureReview: z.string().describe('The generated literature review in markdown format.'),
});
export type GenerateLiteratureReviewOutput = z.infer<typeof GenerateLiteratureReviewOutputSchema>;

export async function generateLiteratureReview(input: GenerateLiteratureReviewInput): Promise<GenerateLiteratureReviewOutput> {
  return generateLiteratureReviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLiteratureReviewPrompt',
  input: {schema: GenerateLiteratureReviewInputSchema},
  output: {schema: GenerateLiteratureReviewOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are a research assistant with expertise in academic writing, tasked with creating a literature review from a given set of research papers.

Your response must be in Markdown format and structured as follows:

# Literature Review

## Introduction
- Briefly introduce the overarching topic and its significance.
- State the purpose of this literature review.

## Thematic Analysis
- Synthesize and group the provided papers by common themes, methodologies, or findings.
- For each theme, create a subheading (e.g., ### Theme 1: [Name of Theme]).
- Discuss the papers within each theme, highlighting their contributions and how they relate to one another.

## Conclusion and Future Directions
- Summarize the key insights and trends identified from the papers.
- Briefly mention any gaps in the literature and suggest potential areas for future research based on the analysis.

Here are the papers (Title and Abstract) to use for the review:
{{#each papers}}
---
Title: {{{title}}}
Abstract: {{{abstract}}}
---
{{/each}}
`,
});

const generateLiteratureReviewFlow = ai.defineFlow(
  {
    name: 'generateLiteratureReviewFlow',
    inputSchema: GenerateLiteratureReviewInputSchema,
    outputSchema: GenerateLiteratureReviewOutputSchema,
  },
  async input => {
    if (input.papers.length === 0) {
      return { literatureReview: '' };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
