'use server';
/**
 * @fileOverview A flow for generating embeddings for a list of documents.
 *
 * - generateEmbeddings - A function that generates embeddings for a list of documents.
 * - GenerateEmbeddingsInput - The input type for the generateEmbeddings function.
 * - GenerateEmbeddingsOutput - The return type for the generateEmbeddings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEmbeddingsInputSchema = z.object({
  documents: z.array(z.string()).describe('A list of documents to generate embeddings for.'),
});
export type GenerateEmbeddingsInput = z.infer<typeof GenerateEmbeddingsInputSchema>;

const GenerateEmbeddingsOutputSchema = z.array(z.array(z.number())).describe('A list of embeddings, one for each document.');
export type GenerateEmbeddingsOutput = z.infer<typeof GenerateEmbeddingsOutputSchema>;

export async function generateEmbeddings(input: GenerateEmbeddingsInput): Promise<GenerateEmbeddingsOutput> {
  return generateEmbeddingsFlow(input);
}

const generateEmbeddingsFlow = ai.defineFlow(
  {
    name: 'generateEmbeddingsFlow',
    inputSchema: GenerateEmbeddingsInputSchema,
    outputSchema: GenerateEmbeddingsOutputSchema,
  },
  async ({documents}) => {
    const {embeddings} = await ai.embed({
      embedder: 'googleai/embedding-004',
      content: documents,
    });
    return embeddings.map(e => e.value);
  }
);
