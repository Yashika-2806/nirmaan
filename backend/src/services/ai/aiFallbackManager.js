const { executeWithRetry } = require('./retryHandler');

const MODEL_CHAIN = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
];

class AIFallbackManager {
    constructor(geminiClient) {
        this.client = geminiClient;
    }

    /**
     * Tries models in the fallback chain one by one.
     * Includes retries for each model on applicable errors.
     */
    async generateWithFallback(prompt, timeoutMs = 8000) {
        let lastError = null;

        for (const modelName of MODEL_CHAIN) {
            try {
                if (modelName !== MODEL_CHAIN[0]) {
                    console.log(`[AI] Switched to ${modelName}`);
                }
                
                // Execute with retry for each model
                const result = await executeWithRetry(
                    () => this.client.generateContent(prompt, modelName, timeoutMs),
                    `Model ${modelName}`
                );
                
                return result;
            } catch (error) {
                lastError = error;
                
                // If it's a hard error like invalid API key, stop completely
                if (error.message && (error.message.toLowerCase().includes('api key not valid') || error.message.toLowerCase().includes('invalid api key'))) {
                    console.warn(`[AI] Invalid API Key detected. Stopping fallback chain.`);
                    throw error; // Let the caller handle it (or return fallback response)
                }
            }
        }
        
        throw new Error(`All AI models in the fallback chain failed. Last error: ${lastError.message}`);
    }
}

module.exports = AIFallbackManager;
