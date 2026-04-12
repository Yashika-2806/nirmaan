const { executeWithRetry } = require('./retryHandler');
const GeminiClient = require('./geminiClient');

// Models confirmed available via the List Models API (April 2026).
// Ordered by quality. gemini-2.5-flash is the best free-tier model.
const GEMINI_MODEL_CHAIN = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
];

// Claude model to use as paid fallback
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

class AIFallbackManager {
    constructor(primaryClient, providerName, geminiClient, claudeClient = null) {
        this.primaryClient = primaryClient;
        this.providerName = providerName; // 'cloudflare' or 'gemini'
        this.geminiClient = geminiClient;
        this.claudeClient = claudeClient;

        // Collect all spare Gemini keys for cross-key rate-limit evasion
        this.spareGeminiKeys = [];
        const keyNames = ['GEMINI_KEY_1','GEMINI_KEY_2','GEMINI_KEY_3','GEMINI_KEY_4','GEMINI_KEY_5','GEMINI_KEY_6'];
        for (const k of keyNames) {
            const v = process.env[k];
            if (v) this.spareGeminiKeys.push(v);
        }
    }

    /**
     * Determines if an error should trigger immediate Claude fallback
     * (as opposed to trying the next Gemini model/key).
     */
    _isClaudeFallbackError(error) {
        const msg = (error.message || '').toLowerCase();
        return (
            msg.includes('429') || msg.includes('rate limit') || msg.includes('quota') ||
            msg.includes('api key not valid') || msg.includes('invalid api key') ||
            msg.includes('404') || msg.includes('not found') || msg.includes('not supported') ||
            msg.includes('timeout') || msg.includes('timed out') ||
            msg.includes('malformed') || msg.includes('parse') ||
            msg.includes('network') || msg.includes('econnreset') || msg.includes('fetch') ||
            msg.includes('overloaded') || msg.includes('503') || msg.includes('service unavailable') ||
            msg.includes('unsupported model')
        );
    }

    /**
     * Tries models in the fallback chain one by one.
     * On 429 for a model, also rotates through spare keys before giving up.
     * Falls back to Claude if all Gemini models fail.
     */
    async generateWithFallback(prompt, timeoutMs = 120000) {
        let lastError = null;
        let geminiAttempted = false;

        // 1. Try Cloudflare first if it's the primary provider
        if (this.providerName === 'cloudflare' && this.primaryClient) {
            try {
                console.log(`[AI] Using primary provider: Cloudflare (@cf/meta/llama-3-8b-instruct)`);
                const result = await executeWithRetry(
                    () => this.primaryClient.generateContent(prompt, '@cf/meta/llama-3-8b-instruct', timeoutMs),
                    `Model Cloudflare Llama 3 8B`
                );
                return result;
            } catch (error) {
                lastError = error;
                console.warn(`[AI] Cloudflare failed. Falling back to Gemini... Reason: ${error.message}`);
            }
        }

        // 2. Skip Gemini entirely if no keys are configured
        const hasGeminiKeys = this.spareGeminiKeys.length > 0;
        if (!hasGeminiKeys) {
            console.warn('[AI] No Gemini API keys configured. Skipping Gemini.');
        }

        // 3. Try each model in the Gemini chain.
        //    For each model, also try rotating through spare API keys on 429.
        //    If ALL keys are rate-limited on the first model, skip remaining models
        //    (same keys will be rate-limited on other models too).
        if (hasGeminiKeys) {
            let allKeysRateLimited = false;

            for (const modelName of GEMINI_MODEL_CHAIN) {
                // If all keys were rate-limited on a previous model, skip — same keys won't work
                if (allKeysRateLimited) {
                    break;
                }

                // Build a list of clients to try: primary client first, then spare keys
                const clientsToTry = [this.geminiClient];
                for (const key of this.spareGeminiKeys) {
                    clientsToTry.push(new GeminiClient(key));
                }

                let rateLimitedCount = 0;

                for (let ci = 0; ci < clientsToTry.length; ci++) {
                    const client = clientsToTry[ci];
                    try {
                        geminiAttempted = true;
                        if (modelName !== GEMINI_MODEL_CHAIN[0] || this.providerName === 'cloudflare' || ci > 0) {
                            // Only log first and last key attempts to reduce noise
                            if (ci === 0 || ci === clientsToTry.length - 1) {
                                console.log(`[AI] Trying ${modelName} (key slot ${ci + 1}/${clientsToTry.length})`);
                            }
                        }

                        const result = await client.generateContent(prompt, modelName, timeoutMs);

                        // Validate that we got a non-empty response
                        if (!result || (typeof result === 'string' && result.trim().length === 0)) {
                            throw new Error('Gemini returned empty response');
                        }

                        if (modelName !== GEMINI_MODEL_CHAIN[0] || ci > 0) {
                            console.log(`[AI] ✅ Gemini success with ${modelName} (key slot ${ci + 1})`);
                        }
                        return result;

                    } catch (error) {
                        lastError = error;
                        const msg = (error.message || '').toLowerCase();

                        // Invalid key — stop trying this model entirely
                        if (msg.includes('api key not valid') || msg.includes('invalid api key')) {
                            console.warn(`[AI] Invalid API key for ${modelName}. Skipping.`);
                            break;
                        }

                        // Model not found (404) — skip to next model entirely
                        if (msg.includes('404') || msg.includes('not found') || msg.includes('not supported')) {
                            console.warn(`[AI] ${modelName} not available (404). Skipping.`);
                            break;
                        }

                        // Rate limit (429) — try next key
                        if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
                            rateLimitedCount++;
                            if (ci < clientsToTry.length - 1) {
                                continue; // try next key silently
                            } else {
                                console.warn(`[AI] ${modelName} rate-limited on all ${rateLimitedCount} keys.`);
                                if (rateLimitedCount >= clientsToTry.length) {
                                    allKeysRateLimited = true; // Skip remaining models
                                }
                                break;
                            }
                        }

                        // Other error — move to next model
                        console.warn(`[AI] ${modelName} failed: ${error.message?.substring(0, 120)}`);
                        break;
                    }
                }
            }
        }

        // 4. Try Claude as reliable paid fallback
        if (this.claudeClient) {
            try {
                if (geminiAttempted) {
                    console.log(`[AI] Gemini failed, switching to Claude (${CLAUDE_MODEL})`);
                } else {
                    console.log(`[AI] Using Claude directly (${CLAUDE_MODEL})`);
                }

                const result = await this.claudeClient.generateContent(prompt, CLAUDE_MODEL, timeoutMs);

                // Validate non-empty
                if (!result || (typeof result === 'string' && result.trim().length === 0)) {
                    throw new Error('Claude returned empty response');
                }

                console.log(`[AI] ✅ Claude success`);
                return result;
            } catch (error) {
                lastError = error;
                const safeMessage = error.message ? error.message.replace(/sk-ant-api[\w-]+/g, '[REDACTED_API_KEY]') : 'Unknown error';
                console.warn(`[AI] Claude also failed. Reason: ${safeMessage}`);
            }
        } else {
            console.warn(`[AI] Claude skipped because CLAUDE_API_KEY is missing from environment.`);
        }
        
        throw new Error(`All AI providers failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
    }
}

module.exports = AIFallbackManager;
