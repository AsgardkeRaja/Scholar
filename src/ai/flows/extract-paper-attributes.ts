'use server';

import { ai, withRetry } from '@/ai/genkit';
import { z } from 'genkit';

const PaperInputSchema = z.object({
    title: z.string(),
    abstract: z.string(),
});

const ExtractAttributesInputSchema = z.object({
    papers: z.array(PaperInputSchema),
    attributes: z.array(z.string()).describe('List of attributes to extract, e.g., ["Methods", "Results", "Limitations"]'),
});

export type ExtractAttributesInput = z.infer<typeof ExtractAttributesInputSchema>;

// We'll define a flexible output schema where keys are paper indices and values are objects with attribute keys
const ExtractedDataSchema = z.object({
    results: z.array(z.object({
        paperIndex: z.number(),
        attributes: z.record(z.string(), z.string()),
    })),
});

export type ExtractAttributesOutput = z.infer<typeof ExtractedDataSchema>;

const prompt = ai.definePrompt({
    name: 'extractPaperAttributesPrompt',
    input: { schema: ExtractAttributesInputSchema },
    output: { schema: ExtractedDataSchema },
    model: 'googleai/gemini-2.5-flash',
    prompt: `
    You are an expert research assistant. Your task is to extract specific information from a list of research papers based on requested attributes.
    
    For each paper provided, analyze the title and abstract to extract the following attributes: {{attributes}}.
    
    If an attribute cannot be explicitly found, infer it if possible, or state "Not specified".
    Keep the extracted text concise and relevant.
    
    Papers:
    {{#each papers}}
    ---
    Paper Index: {{@index}}
    Title: {{title}}
    Abstract: {{abstract}}
    ---
    {{/each}}
  `,
});

export const extractPaperAttributesFlow = ai.defineFlow(
    {
        name: 'extractPaperAttributesFlow',
        inputSchema: ExtractAttributesInputSchema,
        outputSchema: ExtractedDataSchema,
    },
    async (input) => {
        // Use retry logic to handle API overload
        const result = await withRetry(async () => {
            const { output } = await prompt(input);
            return output!;
        }, 3, 2000); // 3 retries, starting with 2 second delay

        return result;
    }
);
