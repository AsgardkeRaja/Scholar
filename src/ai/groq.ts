/**
 * @fileOverview Groq SDK client with TPM-aware rate limiting, token-based
 * chunking, and automatic retry with exponential backoff.
 *
 * All requests are routed through the Bottleneck rate limiter to stay
 * within the 12,000 TPM budget. Large texts are automatically chunked
 * and results merged transparently.
 */

import Groq from 'groq-sdk';
import {
    countTokens,
    estimateRequestTokens,
    calculateSafeInputBudget,
    DEFAULT_OUTPUT_RESERVATION,
    EXTRACT_OUTPUT_RESERVATION,
    type ChatMessage,
} from './token-utils';
import { chunkText, batchByTokenBudget } from './text-chunker';
import { scheduleGroqRequest } from './rate-limiter';

// ─── Groq Client Singleton ──────────────────────────────────────────────────

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
    if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey || apiKey === 'your-groq-api-key-here') {
            throw new Error('GROQ_API_KEY is not configured. Please add your Groq API key to the .env file.');
        }
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

// ─── Retry Logic ─────────────────────────────────────────────────────────────

/**
 * Enhanced retry handler for Groq API errors.
 * Handles 413 (payload too large), 429/TPM (rate limit), and 503 (overloaded).
 */
async function executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 2000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const errorMessage = error?.message || '';
            const statusCode = error?.status || error?.statusCode;

            const isRetryable =
                statusCode === 429 ||
                statusCode === 503 ||
                statusCode === 413 ||
                errorMessage.includes('429') ||
                errorMessage.includes('503') ||
                errorMessage.includes('413') ||
                errorMessage.includes('rate_limit') ||
                errorMessage.includes('tokens per minute') ||
                errorMessage.includes('TPM') ||
                errorMessage.includes('overloaded') ||
                errorMessage.includes('Request too large');

            if (!isRetryable || attempt === maxRetries) {
                throw error;
            }

            // For TPM/rate-limit errors, wait longer (reservoir refill is 60s)
            const isTPMError = errorMessage.includes('tokens per minute') || errorMessage.includes('TPM');
            const baseDelay = isTPMError
                ? Math.max(initialDelay, 15000) // Wait at least 15s for TPM errors
                : initialDelay;

            const delay = baseDelay * Math.pow(2, attempt);
            const jitter = Math.random() * 2000;

            console.warn(
                `[Groq] Request failed (${statusCode || 'unknown'}), ` +
                `retrying in ${Math.round(delay + jitter)}ms ` +
                `(attempt ${attempt + 1}/${maxRetries}): ${errorMessage.substring(0, 150)}`
            );

            await new Promise(resolve => setTimeout(resolve, delay + jitter));
        }
    }

    throw lastError;
}

// ─── System Prompts ──────────────────────────────────────────────────────────

const SUMMARIZE_SYSTEM_PROMPT = `You are a world-class scientific research analyst. Produce a high-quality, publication-ready summary of a research paper abstract.

CRITICAL RULES:
- ALWAYS include specific quantitative data from the abstract: exact percentages, accuracy scores, F1 scores, p-values, sample sizes, speedup factors, error rates, or any numerical results
- NEVER use vague phrases like "improved accuracy" or "significant improvement" — state the EXACT numbers (e.g., "achieved 94.3% accuracy, representing a 12.5% improvement over the baseline")
- If the abstract mentions multiple metrics or benchmarks, include ALL of them
- Open with the research problem or objective
- State the methodology/approach concisely
- Present key findings WITH their exact numbers
- Mention implications or contributions to the field
- Write 3-5 flowing sentences in formal academic language
- Do NOT use bullet points, headings, or markdown formatting
- Do NOT start with "This paper..." or "The authors..." — vary your opening

Return ONLY the summary paragraph, nothing else.`;

const MERGE_SUMMARIES_SYSTEM_PROMPT = `You are a world-class scientific research analyst. You will receive multiple partial summaries of different sections of the same research paper. Merge them into a single cohesive, publication-ready summary paragraph.

CRITICAL RULES:
- Combine all partial summaries into one flowing paragraph
- Remove any redundant or repeated information
- Preserve ALL specific quantitative data and numbers
- Maintain formal academic language
- Write 3-5 sentences total
- Do NOT use bullet points, headings, or markdown formatting

Return ONLY the merged summary paragraph, nothing else.`;

const EXTRACT_SYSTEM_PROMPT = `You are a senior research analyst specializing in systematic literature reviews. Extract specific attributes from research papers with high precision and academic rigor. You will receive either full paper text or an abstract — analyze ALL available text thoroughly.

CRITICAL RULES — YOU MUST FOLLOW THESE:
- Read the ENTIRE provided text carefully, not just the first few sentences
- ALWAYS extract exact numbers, percentages, scores, and metrics when they appear anywhere in the text
- For "Accuracy": Report exact values with benchmark names (e.g., "94.3% accuracy on CIFAR-10"). If exact numbers aren't stated, describe comparative performance in detail
- For "Results" / "Key Findings": Include ALL numerical results — percentages, F1 scores, BLEU scores, AUC, precision, recall, speedup factors, p-values, confidence intervals
- For "Methods Used": Name specific algorithms, models, architectures, and frameworks with details (e.g., "Transformer encoder with multi-head attention" not just "deep learning")
- For "Dataset Used": Include dataset names, sizes, and domains when available
- For "Output": Describe the exact deliverable — model, system, framework, or artifact produced
- For "Abstract Summary": Write a rich 3-4 sentence synthesis covering objective, method, key results, and contribution
- For "Limitations": Include both explicitly stated AND reasonably inferred limitations
- For "Research Gap": Identify what was missing in prior work that motivated this study
- For "Future Work": Quote or paraphrase the authors' stated next steps, or infer logical extensions
- NEVER respond with just "Not specified" or "Not quantified" — always provide a substantive answer. If exact numbers aren't available, make reasonable inferences from context (e.g., "Claims state-of-the-art performance on [benchmark], though specific values are not reported in the available text")
- Provide 2-3 detailed sentences per attribute

You MUST respond with valid JSON only, no additional text or explanation.`;

// Cache system prompt token counts to avoid re-counting
const _systemPromptTokenCache: Map<string, number> = new Map();
function getSystemPromptTokens(prompt: string): number {
    if (!_systemPromptTokenCache.has(prompt)) {
        _systemPromptTokenCache.set(prompt, countTokens(prompt));
    }
    return _systemPromptTokenCache.get(prompt)!;
}

// ─── Summarization ───────────────────────────────────────────────────────────

export async function groqSummarize(abstract: string): Promise<{ summary: string }> {
    const client = getGroqClient();

    const systemTokens = getSystemPromptTokens(SUMMARIZE_SYSTEM_PROMPT);
    const userPrefix = 'Summarize the following research paper abstract into a concise, insightful paragraph:\n\n"""';
    const userSuffix = '"""';
    const prefixTokens = countTokens(userPrefix + userSuffix);

    const safeBudget = calculateSafeInputBudget(DEFAULT_OUTPUT_RESERVATION, systemTokens + prefixTokens);
    const abstractTokens = countTokens(abstract);

    console.log(
        `[Groq] Summarize: abstract=${abstractTokens} tokens, budget=${safeBudget} tokens`
    );

    // If abstract fits within budget, send directly
    if (abstractTokens <= safeBudget) {
        return executeWithRetry(async () => {
            const messages: ChatMessage[] = [
                { role: 'system', content: SUMMARIZE_SYSTEM_PROMPT },
                { role: 'user', content: `${userPrefix}${abstract}${userSuffix}` },
            ];
            const estimatedTokens = estimateRequestTokens(messages) + DEFAULT_OUTPUT_RESERVATION;

            return scheduleGroqRequest(async () => {
                const completion = await client.chat.completions.create({
                    messages,
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.1,
                    max_tokens: DEFAULT_OUTPUT_RESERVATION,
                    top_p: 0.9,
                });
                const summary = completion.choices[0]?.message?.content || 'Could not generate summary.';
                return { summary };
            }, estimatedTokens);
        });
    }

    // Abstract is too large — chunk and summarize each chunk
    console.log(`[Groq] Abstract exceeds budget, chunking...`);
    const chunks = await chunkText(abstract, safeBudget);

    const partialSummaries: string[] = [];
    for (const chunk of chunks) {
        const result = await executeWithRetry(async () => {
            const messages: ChatMessage[] = [
                { role: 'system', content: SUMMARIZE_SYSTEM_PROMPT },
                { role: 'user', content: `${userPrefix}${chunk}${userSuffix}` },
            ];
            const estimatedTokens = estimateRequestTokens(messages) + DEFAULT_OUTPUT_RESERVATION;

            return scheduleGroqRequest(async () => {
                const completion = await client.chat.completions.create({
                    messages,
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.1,
                    max_tokens: DEFAULT_OUTPUT_RESERVATION,
                    top_p: 0.9,
                });
                return completion.choices[0]?.message?.content || '';
            }, estimatedTokens);
        });
        if (result) partialSummaries.push(result);
    }

    // If only one chunk produced a summary, return it directly
    if (partialSummaries.length === 1) {
        return { summary: partialSummaries[0] };
    }

    // Merge partial summaries with a second LLM pass
    console.log(`[Groq] Merging ${partialSummaries.length} partial summaries...`);
    const mergedResult = await executeWithRetry(async () => {
        const mergeUserContent = `Merge the following ${partialSummaries.length} partial summaries into a single cohesive summary:\n\n${partialSummaries.map((s, i) => `--- Part ${i + 1} ---\n${s}`).join('\n\n')}`;
        const messages: ChatMessage[] = [
            { role: 'system', content: MERGE_SUMMARIES_SYSTEM_PROMPT },
            { role: 'user', content: mergeUserContent },
        ];
        const estimatedTokens = estimateRequestTokens(messages) + DEFAULT_OUTPUT_RESERVATION;

        return scheduleGroqRequest(async () => {
            const completion = await client.chat.completions.create({
                messages,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.1,
                max_tokens: DEFAULT_OUTPUT_RESERVATION,
                top_p: 0.9,
            });
            return completion.choices[0]?.message?.content || partialSummaries.join(' ');
        }, estimatedTokens);
    });

    return { summary: mergedResult };
}

// ─── Attribute Extraction ────────────────────────────────────────────────────

export async function groqExtractAttributes(
    papers: { title: string; abstract: string }[],
    attributes: string[]
): Promise<{ results: { paperIndex: number; attributes: Record<string, string> }[] }> {
    const client = getGroqClient();

    const systemTokens = getSystemPromptTokens(EXTRACT_SYSTEM_PROMPT);
    // Estimate tokens for the user prompt template (without paper content)
    const userTemplateTokens = countTokens(
        `Carefully analyze the following research papers and extract these attributes for each: ${attributes.join(', ')}\n\nPapers to analyze:\n\nRespond with ONLY a JSON object in this exact format:\n{"results": [{"paperIndex": 0, "attributes": {"${attributes[0]}": "detailed extracted value", ...}}, ...]}\n\nImportant: Use the exact attribute names provided (${attributes.join(', ')}) as keys in the attributes object.`
    );

    const safeBudget = calculateSafeInputBudget(EXTRACT_OUTPUT_RESERVATION, systemTokens + userTemplateTokens);

    console.log(
        `[Groq] Extract: ${papers.length} papers, ${attributes.length} attributes, budget=${safeBudget} tokens`
    );

    // Batch papers by token budget
    const batches = batchByTokenBudget(
        papers,
        (p) => `---\nTitle: ${p.title}\nAbstract: ${p.abstract}\n---`,
        safeBudget
    );

    const allResults: { paperIndex: number; attributes: Record<string, string> }[] = [];

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
        const batch = batches[batchIdx];
        console.log(
            `[Groq] Processing batch ${batchIdx + 1}/${batches.length} ` +
            `(${batch.length} papers)`
        );

        // Check if any single paper in this batch needs chunking
        // (i.e., it was too large to fit with other papers)
        if (batch.length === 1) {
            const { originalIndex, item: paper } = batch[0];
            const paperText = `---\nTitle: ${paper.title}\nAbstract: ${paper.abstract}\n---`;
            const paperTokens = countTokens(paperText);

            if (paperTokens > safeBudget) {
                // This single paper is too large — chunk its text
                console.log(
                    `[Groq] Paper ${originalIndex} exceeds budget (${paperTokens} tokens), chunking...`
                );
                const chunks = await chunkText(paper.abstract, safeBudget - countTokens(`---\nTitle: ${paper.title}\n---`));
                const chunkResults: Record<string, string> = {};

                for (const chunk of chunks) {
                    const result = await executeSingleBatchExtraction(
                        client,
                        [{ title: paper.title, abstract: chunk }],
                        attributes,
                        systemTokens,
                        userTemplateTokens
                    );
                    // Merge chunk attributes — later chunks may provide more info
                    if (result[0]) {
                        for (const [key, value] of Object.entries(result[0].attributes)) {
                            if (!chunkResults[key] || chunkResults[key].length < value.length) {
                                chunkResults[key] = value;
                            }
                        }
                    }
                }

                allResults.push({ paperIndex: originalIndex, attributes: chunkResults });
                continue;
            }
        }

        // Normal batch processing
        const batchPapers = batch.map(b => b.item);
        const batchResults = await executeSingleBatchExtraction(
            client,
            batchPapers,
            attributes,
            systemTokens,
            userTemplateTokens
        );

        // Remap paper indices back to original indices
        for (let i = 0; i < batchResults.length; i++) {
            const originalIndex = batch[batchResults[i].paperIndex]?.originalIndex ?? batch[i]?.originalIndex ?? i;
            allResults.push({
                paperIndex: originalIndex,
                attributes: batchResults[i].attributes,
            });
        }
    }

    return { results: allResults };
}

/**
 * Executes a single batch extraction request via the rate limiter.
 */
async function executeSingleBatchExtraction(
    client: Groq,
    papers: { title: string; abstract: string }[],
    attributes: string[],
    systemTokens: number,
    userTemplateTokens: number
): Promise<{ paperIndex: number; attributes: Record<string, string> }[]> {
    return executeWithRetry(async () => {
        const papersText = papers
            .map((p, i) => `---\nPaper Index: ${i}\nTitle: ${p.title}\nAbstract: ${p.abstract}\n---`)
            .join('\n');

        const userContent = `Carefully analyze the following research papers and extract these attributes for each: ${attributes.join(', ')}\n\nPapers to analyze:\n${papersText}\n\nRespond with ONLY a JSON object in this exact format:\n{"results": [{"paperIndex": 0, "attributes": {"${attributes[0]}": "detailed extracted value", ...}}, ...]}\n\nImportant: Use the exact attribute names provided (${attributes.join(', ')}) as keys in the attributes object.`;

        const messages: ChatMessage[] = [
            { role: 'system', content: EXTRACT_SYSTEM_PROMPT },
            { role: 'user', content: userContent },
        ];
        const estimatedTokens = estimateRequestTokens(messages) + EXTRACT_OUTPUT_RESERVATION;

        return scheduleGroqRequest(async () => {
            const completion = await client.chat.completions.create({
                messages,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.1,
                max_tokens: EXTRACT_OUTPUT_RESERVATION,
                top_p: 0.9,
                response_format: { type: 'json_object' },
            });

            const content = completion.choices[0]?.message?.content || '{"results": []}';
            try {
                const parsed = JSON.parse(content);
                return parsed.results || [];
            } catch {
                console.error('[Groq] Failed to parse extraction response:', content.substring(0, 200));
                return [];
            }
        }, estimatedTokens);
    });
}
