const GeminiClient = require('./geminiClient');
const AIFallbackManager = require('./aiFallbackManager');

class AIService {
    constructor() {
        this.client = null;
        this.fallbackManager = null;
    }

    _ensureInitialized(apiKey) {
        if (!this.fallbackManager || apiKey) {
            const keyToUse = apiKey || process.env.GEMINI_KEY_1 || process.env.GEMINI_KEY_6 || process.env.GEMINI_API_KEY;
            this.client = new GeminiClient(keyToUse);
            this.fallbackManager = new AIFallbackManager(this.client);
        }
    }

    /**
     * Generate content with full fallback and retry logic.
     * @param {string} prompt - The prompt to send to the AI
     * @param {string} apiKey - Optional specific API key, otherwise uses env variables
     * @param {number} timeoutMs - Timeout in milliseconds (default 5-10s)
     */
    async generate(prompt, apiKey = null, timeoutMs = 8000) {
        this._ensureInitialized(apiKey);

        try {
            const result = await this.fallbackManager.generateWithFallback(prompt, timeoutMs);
            return result;
        } catch (error) {
            console.log(`[AI] Fallback response used`);
            
            // Clean Error Handling: No raw error exposure, no stack trace
            const fallbackResponse = {
                success: false,
                message: "AI temporarily unavailable",
                fallback: true,
                explanation: "The AI models are currently experiencing high demand or service disruptions. Please try again in a few moments."
            };
            
            // Return JSON stringified fallback response to degrade gracefully
            return JSON.stringify(fallbackResponse);
        }
    }
}

// Export a singleton instance
module.exports = new AIService();
