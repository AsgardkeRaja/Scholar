/**
 * @fileOverview Bottleneck-based TPM-aware rate limiter for Groq API requests.
 *
 * Manages a token "reservoir" that refills every 60 seconds, ensuring
 * cumulative token throughput never exceeds the Groq TPM limit.
 * All Groq API calls should be routed through scheduleGroqRequest().
 */

import Bottleneck from 'bottleneck';
import { SAFE_TPM_BUDGET } from './token-utils';

// ─── Singleton Limiter ───────────────────────────────────────────────────────

const tokenLimiter = new Bottleneck({
    // Reservoir: token budget that gets consumed per request
    reservoir: SAFE_TPM_BUDGET,

    // Refill the reservoir every 60 seconds (TPM window)
    reservoirRefreshInterval: 60 * 1000,

    // Refill amount = full budget
    reservoirRefreshAmount: SAFE_TPM_BUDGET,
});

const concurrencyLimiter = new Bottleneck({
    // Max concurrent requests — sequential to prevent burst
    maxConcurrent: 1,

    // Minimum time between requests (ms) — prevents rapid-fire
    minTime: 500,
});

// ─── Event Logging ───────────────────────────────────────────────────────────

tokenLimiter.on('error', (error) => {
    console.error('[RateLimiter] TokenLimiter error:', error);
});

tokenLimiter.on('depleted', () => {
    console.warn(
        '[RateLimiter] Token reservoir depleted. Requests will queue until refill ' +
        '(up to 60 seconds).'
    );
});

concurrencyLimiter.on('error', (error) => {
    console.error('[RateLimiter] ConcurrencyLimiter error:', error);
});

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Schedules a Groq API request through the TPM-aware rate limiter.
 *
 * The request will be queued if the token reservoir doesn't have enough
 * budget, and will automatically execute once the reservoir refills.
 *
 * @param fn - Async function that performs the actual Groq API call.
 * @param estimatedTokens - Estimated total tokens (input + output) for this request.
 * @returns The result of the API call.
 */
export async function scheduleGroqRequest<T>(
    fn: () => Promise<T>,
    estimatedTokens: number
): Promise<T> {
    // Clamp token weight to at least 1 (Bottleneck requires weight >= 1)
    const weight = Math.max(1, Math.ceil(estimatedTokens));

    console.log(
        `[RateLimiter] Scheduling request (estimated ${estimatedTokens} tokens, ` +
        `weight: ${weight}, reservoir: ${await getRemainingBudget()})`
    );

    return tokenLimiter.schedule({ weight }, async () => {
        console.log(`[RateLimiter] Executing request (weight: ${weight})`);
        return concurrencyLimiter.schedule(fn);
    });
}

/**
 * Returns the current remaining token budget in the reservoir.
 * Useful for debugging and monitoring.
 */
export async function getRemainingBudget(): Promise<number> {
    const counts = await tokenLimiter.currentReservoir();
    return counts ?? SAFE_TPM_BUDGET;
}

