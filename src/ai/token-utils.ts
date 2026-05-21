/**
 * @fileOverview Token estimation utilities for Groq API rate-limit management.
 *
 * Uses gpt-tokenizer (cl100k_base BPE encoding) as a close approximation
 * for LLaMA-family tokenizers. A 1.15x safety multiplier is applied to all
 * estimates to account for encoding discrepancies.
 */

import { encode } from 'gpt-tokenizer';

// ─── Model Constants ─────────────────────────────────────────────────────────

/** Conservative per-request input token limit (model supports 128K but TPM is 12K). */
export const MODEL_CONTEXT_LIMIT = 8192;

/** Output token reservation for summarization requests. */
export const DEFAULT_OUTPUT_RESERVATION = 1024;

/** Output token reservation for attribute extraction requests (larger JSON output). */
export const EXTRACT_OUTPUT_RESERVATION = 4096;

/** Groq's tokens-per-minute limit for the free tier. */
export const TPM_LIMIT = 12_000;

/** Safe TPM budget with a 2K buffer to avoid edge-case overflows. */
export const SAFE_TPM_BUDGET = 10_000;

/**
 * Safety multiplier to account for BPE↔SentencePiece tokenizer discrepancies.
 * cl100k_base tends to under-count relative to LLaMA's tokenizer by ~5-15%.
 */
const SAFETY_MULTIPLIER = 1.15;

/** Per-message overhead tokens (role markers, separators, etc.). */
const PER_MESSAGE_OVERHEAD = 4;

// ─── Public API ──────────────────────────────────────────────────────────────

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Counts the number of BPE tokens in a text string, applying the safety multiplier.
 */
export function countTokens(text: string): number {
    if (!text) return 0;
    const rawCount = encode(text).length;
    return Math.ceil(rawCount * SAFETY_MULTIPLIER);
}

/**
 * Estimates the total token cost of a chat completion request.
 * Accounts for per-message overhead (role, formatting tokens).
 */
export function estimateRequestTokens(messages: ChatMessage[]): number {
    let total = 0;
    for (const msg of messages) {
        total += countTokens(msg.content) + PER_MESSAGE_OVERHEAD;
    }
    // Add 2 tokens for the priming/reply preamble
    total += 2;
    return total;
}

/**
 * Calculates the maximum number of input tokens that can safely fit in a
 * single request, given the model context limit and desired output reservation.
 *
 * @param outputReservation - Tokens reserved for the model's response.
 * @param systemPromptTokens - Tokens consumed by the system prompt.
 * @returns Maximum tokens available for user content.
 */
export function calculateSafeInputBudget(
    outputReservation: number = DEFAULT_OUTPUT_RESERVATION,
    systemPromptTokens: number = 0
): number {
    return MODEL_CONTEXT_LIMIT - outputReservation - systemPromptTokens - PER_MESSAGE_OVERHEAD * 2 - 2;
}
