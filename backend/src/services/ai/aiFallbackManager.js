const { executeWithRetry } = require('./retryHandler');

const GEMINI_MODEL_CHAIN = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
];

class AIFallbackManager {
    constructor(primaryClient, providerName, geminiClient, claudeClient = null) {
        this.primaryClient = primaryClient;
        this.providerName = providerName; // 'cloudflare' or 'gemini'
        this.geminiClient = geminiClient;
        this.claudeClient = claudeClient;
    }

    /**
     * Tries models in the fallback chain one by one.
     * Includes retries for each model on applicable errors.
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

        // 2. Try Gemini Chain
        if (this.geminiClient) {
            for (const modelName of GEMINI_MODEL_CHAIN) {
                try {
                    if (modelName !== GEMINI_MODEL_CHAIN[0] || this.providerName === 'cloudflare') {
                        console.log(`[AI] Switched to ${modelName}`);
                    }
                    
                    const result = await executeWithRetry(
                        () => this.geminiClient.generateContent(prompt, modelName, timeoutMs),
                        `Model ${modelName}`
                    );
                    
                    return result;
                } catch (error) {
                    lastError = error;
                    
                    if (error.message && (error.message.toLowerCase().includes('api key not valid') || error.message.toLowerCase().includes('invalid api key'))) {
                        console.warn(`[AI] Invalid Gemini API Key detected. Breaking Gemini chain.`);
                        break; 
                    }
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
