'use server';

import { ai, withRetry } from '@/ai/genkit';
import { groqExtractAttributes } from '@/ai/groq';
import { z } from 'genkit';

const PaperInputSchema = z.object({
    title: z.string(),
    abstract: z.string(),
});

const ExtractAttributesInputSchema = z.object({
    papers: z.array(PaperInputSchema),
    attributes: z.array(z.string()).describe('List of attributes to extract, e.g., ["Methods", "Results", "Limitations"]'),
    model: z
        .enum(['gemini', 'groq'])
        .optional()
        .default('gemini')
        .describe('The AI model to use for extraction.'),
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
    input: { schema: z.object({ papers: z.array(PaperInputSchema), attributes: z.array(z.string()) }) },
    output: { schema: ExtractedDataSchema },
    model: 'googleai/gemini-2.5-flash',
    prompt: `
    You are a senior research analyst specializing in systematic literature reviews. Extract specific information from research papers with high precision and academic rigor. You will receive either a full paper text or an abstract — analyze ALL available text thoroughly.

    CRITICAL RULES — YOU MUST FOLLOW THESE:
    - Read the ENTIRE provided text carefully, not just the first few sentences
    - ALWAYS extract exact numbers, percentages, scores, and metrics when present anywhere in the text
    - For "Accuracy": Report exact values with dataset/benchmark names (e.g., "94.3% accuracy on CIFAR-10"). If exact numbers aren't stated, describe the comparative performance (e.g., "Outperformed BERT by a statistically significant margin on all 3 benchmarks tested")
    - For "Results" / "Key Findings": Include ALL numerical results — percentages, F1 scores, BLEU scores, AUC, precision, recall, speedup factors, p-values, effect sizes. If no exact numbers, describe the qualitative outcomes in detail
    - For "Methods Used": Name specific algorithms, models, architectures, frameworks, and tools (e.g., "Transformer-based encoder with multi-head attention, trained using AdamW optimizer with learning rate 3e-5")
    - For "Dataset Used": Include dataset names, sizes, domains, and splits when available
    - For "Output": Describe the exact deliverable — model, system, framework, tool, or artifact produced
    - For "Abstract Summary": Write a rich 3-4 sentence synthesis covering objective, method, key results, and contribution
    - For "Limitations": Include both explicitly stated AND reasonably inferred limitations based on the methodology described
    - For "Research Gap": Identify what was missing or insufficient in prior work that motivated this study
    - For "Contribution": Describe what is novel — new method, new dataset, new insight, or improved performance
    - For "Future Work": Quote or paraphrase the authors' stated next steps, or infer logical extensions
    - NEVER respond with just "Not specified" or "Not quantified" — always provide a substantive answer by making reasonable inferences from the context. For example, if accuracy numbers aren't given but the paper claims state-of-the-art performance, say "Claims state-of-the-art performance on [benchmark], though specific numerical values are not reported in the available text"
    - Provide 2-3 detailed sentences per attribute

    Extract the following attributes for each paper: {{attributes}}.
    
    Papers:
    {{#each papers}}
    ---
    Paper Index: {{@index}}
    Title: {{title}}
    Full Text: {{abstract}}
    ---
    {{/each}}
  `,
});

export async function extractPaperAttributes(input: ExtractAttributesInput): Promise<ExtractAttributesOutput> {
    if (input.model === 'groq') {
        // Use Groq SDK directly for Llama 3.3 70B
        return withRetry(async () => {
            return groqExtractAttributes(input.papers, input.attributes);
        }, 3, 2000);
    }
    // Default: use Gemini via Genkit
    return extractPaperAttributesFlow(input);
}

export const extractPaperAttributesFlow = ai.defineFlow(
    {
        name: 'extractPaperAttributesFlow',
        inputSchema: ExtractAttributesInputSchema,
        outputSchema: ExtractedDataSchema,
    },
    async (input) => {
        // Use retry logic to handle API overload
        const result = await withRetry(async () => {
            const { output } = await prompt({ papers: input.papers, attributes: input.attributes });
            return output!;
        }, 3, 2000); // 3 retries, starting with 2 second delay

        return result;
    }
);
