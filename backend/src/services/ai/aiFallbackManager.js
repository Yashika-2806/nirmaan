const { executeWithRetry } = require('./retryHandler');
const GeminiClient = require('./geminiClient');

// These are the models confirmed available via the List Models API (April 2026).
// Ordered by quality. gemini-2.5-flash is the best free-tier model.
const GEMINI_MODEL_CHAIN = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
];

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
     * Tries models in the fallback chain one by one.
     * On 429 for a model, also rotates through spare keys before giving up.
     */
    async generateWithFallback(prompt, timeoutMs = 30000) {
        let lastError = null;

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

        // 2. Try each model in the Gemini chain.
        //    For each model, also try rotating through spare API keys on 429.
        for (const modelName of GEMINI_MODEL_CHAIN) {
            // Build a list of clients to try: primary client first, then spare keys
            const clientsToTry = [this.geminiClient];
            for (const key of this.spareGeminiKeys) {
                // Only add spare clients that differ from the primary
                clientsToTry.push(new GeminiClient(key));
            }

            for (let ci = 0; ci < clientsToTry.length; ci++) {
                const client = clientsToTry[ci];
                try {
                    if (modelName !== GEMINI_MODEL_CHAIN[0] || this.providerName === 'cloudflare' || ci > 0) {
                        console.log(`[AI] Trying ${modelName} (key slot ${ci + 1}/${clientsToTry.length})`);
                    }

                    const result = await client.generateContent(prompt, modelName, timeoutMs);
                    if (modelName !== GEMINI_MODEL_CHAIN[0] || ci > 0) {
                        console.log(`[AI] ✅ Success with ${modelName} (key slot ${ci + 1})`);
                    }
                    return result;

                } catch (error) {
                    lastError = error;
                    const msg = (error.message || '').toLowerCase();

                    // Invalid key — stop trying this model entirely
                    if (msg.includes('api key not valid') || msg.includes('invalid api key')) {
                        console.warn(`[AI] Invalid API key for ${modelName}. Skipping remaining keys for this model.`);
                        break;
                    }

                    // Model not found (404) — skip to next model entirely, don't waste keys
                    if (msg.includes('404') || msg.includes('not found') || msg.includes('not supported')) {
                        console.warn(`[AI] ${modelName} returned 404 (model not available). Skipping.`);
                        break;
                    }

                    // Rate limit (429) — try next key
                    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
                        if (ci < clientsToTry.length - 1) {
                            console.warn(`[AI] ${modelName} rate-limited (key ${ci + 1}). Rotating to next key...`);
                            continue; // try next key
                        } else {
                            console.warn(`[AI] ${modelName} rate-limited on all keys. Moving to next model.`);
                            break;
                        }
                    }

                    // Other error — move to next model
                    console.warn(`[AI] ${modelName} failed: ${error.message?.substring(0, 100)}`);
                    break;
                }
            }
        }

        // 3. Try Claude if provided
        if (this.claudeClient) {
            try {
                console.log(`[AI] Switched to claude-3-haiku-20240307 (Anthropic)`);
                const result = await executeWithRetry(
                    () => this.claudeClient.generateContent(prompt, 'claude-3-haiku-20240307', timeoutMs),
                    `Model Claude 3 Haiku`
                );
                return result;
            } catch (error) {
                lastError = error;
                const safeMessage = error.message ? error.message.replace(/sk-ant-api[\w-]+/g, '[REDACTED_API_KEY]') : 'Unknown error';
                console.warn(`[AI] Claude also failed. Reason: ${safeMessage}`);
            }
        } else {
            console.warn(`[AI] Claude skipped because CLAUDE_API_KEY is missing from environment.`);
        }
        
        throw new Error(`All AI models in the fallback chain failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
    }
}

module.exports = AIFallbackManager;
