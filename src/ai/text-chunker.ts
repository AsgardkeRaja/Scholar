/**
 * @fileOverview Token-aware text chunker using LangChain's RecursiveCharacterTextSplitter.
 *
 * Splits text into chunks where each chunk is guaranteed to be ≤ maxTokens
 * when measured by the BPE token counter from token-utils.ts.
 * Uses semantic separators (paragraphs → sentences → words) to preserve
 * meaning boundaries in academic text.
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { countTokens } from './token-utils';

/**
 * Splits text into token-bounded chunks using recursive semantic splitting.
 *
 * @param text - The input text to split.
 * @param maxTokens - Maximum tokens per chunk (measured via countTokens).
 * @returns Array of text chunks, each ≤ maxTokens.
 */
export async function chunkText(text: string, maxTokens: number): Promise<string[]> {
    const textTokens = countTokens(text);

    // If the text already fits, return it as a single chunk
    if (textTokens <= maxTokens) {
        return [text];
    }

    // Calculate overlap: 10% of chunk size or 200 tokens, whichever is smaller
    const chunkOverlap = Math.min(200, Math.floor(maxTokens * 0.1));

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: maxTokens,
        chunkOverlap: chunkOverlap,
        separators: ['\n\n', '\n', '. ', ', ', ' ', ''],
        // Use token-based length function for accurate measurement
        lengthFunction: (text: string) => countTokens(text),
    });

    const docs = await splitter.createDocuments([text]);
    const chunks = docs.map(doc => doc.pageContent);

    console.log(
        `[TextChunker] Split ${textTokens} tokens into ${chunks.length} chunks ` +
        `(max ${maxTokens} tokens/chunk, ${chunkOverlap} token overlap)`
    );

    return chunks;
}

/**
 * Splits an array of paper objects into batches where each batch's total
 * token count (across all papers' text) fits within the given budget.
 *
 * @param papers - Array of objects with text content to batch.
 * @param textExtractor - Function to extract the text from each paper.
 * @param maxTokensPerBatch - Maximum total tokens allowed per batch.
 * @returns Array of batches, where each batch is an array of { originalIndex, paper } pairs.
 */
export function batchByTokenBudget<T>(
    papers: T[],
    textExtractor: (paper: T) => string,
    maxTokensPerBatch: number
): { originalIndex: number; item: T }[][] {
    const batches: { originalIndex: number; item: T }[][] = [];
    let currentBatch: { originalIndex: number; item: T }[] = [];
    let currentBatchTokens = 0;

    for (let i = 0; i < papers.length; i++) {
        const text = textExtractor(papers[i]);
        const paperTokens = countTokens(text);

        // If a single paper exceeds the budget, it gets its own batch
        // (it will be chunked at the request level later)
        if (paperTokens > maxTokensPerBatch) {
            // Flush current batch if non-empty
            if (currentBatch.length > 0) {
                batches.push(currentBatch);
                currentBatch = [];
                currentBatchTokens = 0;
            }
            batches.push([{ originalIndex: i, item: papers[i] }]);
            continue;
        }

        // Would adding this paper exceed the budget?
        if (currentBatchTokens + paperTokens > maxTokensPerBatch) {
            // Flush current batch
            batches.push(currentBatch);
            currentBatch = [];
            currentBatchTokens = 0;
        }

        currentBatch.push({ originalIndex: i, item: papers[i] });
        currentBatchTokens += paperTokens;
    }

    // Don't forget the last batch
    if (currentBatch.length > 0) {
        batches.push(currentBatch);
    }

    console.log(
        `[TextChunker] Batched ${papers.length} papers into ${batches.length} batches ` +
        `(max ${maxTokensPerBatch} tokens/batch)`
    );

    return batches;
}
