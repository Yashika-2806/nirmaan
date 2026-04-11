const { executeWithRetry } = require('./retryHandler');

const MODEL_CHAIN = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
];

class AIFallbackManager {
    constructor(geminiClient, claudeClient = null) {
        this.client = geminiClient;
        this.claudeClient = claudeClient;
    }

    /**
     * Tries models in the fallback chain one by one.
     * Includes retries for each model on applicable errors.
     */
    async generateWithFallback(prompt, timeoutMs = 30000) {
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
                
                // If it's a hard error like invalid API key, break loop but still try Claude
                if (error.message && (error.message.toLowerCase().includes('api key not valid') || error.message.toLowerCase().includes('invalid api key'))) {
                    console.warn(`[AI] Invalid Gemini API Key detected. Breaking Gemini chain.`);
                    break; 
                }
            }
        }

        // Try Claude if provided
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
                // Safely log reason without exposing secret keys:
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
