const GeminiClient = require('./geminiClient');
const AIFallbackManager = require('./aiFallbackManager');

const ClaudeClient = require('./claudeClient');

class AIService {
    constructor() {
        this.client = null;
        this.fallbackManager = null;
    }

    _ensureInitialized(apiKey) {
        if (!this.fallbackManager || apiKey) {
            const keyToUse = apiKey || process.env.GEMINI_KEY_1 || process.env.GEMINI_KEY_6 || process.env.GEMINI_API_KEY;
            const geminiClient = new GeminiClient(keyToUse);

            // Initialize Claude as final fallback if API key is in environment
            const claudeKey = process.env.CLAUDE_API_KEY;
            const claudeClient = claudeKey ? new ClaudeClient(claudeKey) : null;

            // Initialize Cloudflare Client if API key is in environment
            const cloudflareKey = process.env.CLOUDFLARE_API_KEY;
            const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
            const CloudflareClient = require('./cloudflareClient');
            
            let primaryClient;
            let providerName = 'gemini';

            if (cloudflareKey && cloudflareAccountId) {
                primaryClient = new CloudflareClient(cloudflareKey, cloudflareAccountId);
                providerName = 'cloudflare';
            } else {
                primaryClient = geminiClient;
            }

            this.fallbackManager = new AIFallbackManager(primaryClient, providerName, geminiClient, claudeClient);
        }
    }

    /**
     * Generate content with full fallback and retry logic.
     * @param {string} prompt - The prompt to send to the AI
     * @param {string} apiKey - Optional specific API key, otherwise uses env variables
     * @param {number} timeoutMs - Timeout in milliseconds (default 5-10s)
     */
    async generate(prompt, apiKey = null, timeoutMs = 30000) {
        this._ensureInitialized(apiKey);

        try {
            const result = await this.fallbackManager.generateWithFallback(prompt, timeoutMs);
            return result;
        } catch (error) {
            console.log(`[AI] Fallback response used`);
            
            // Return clean Markdown instead of naked JSON so it renders nicely in the UI
            return "⚠️ **AI Service Temporarily Unavailable**\n\nThe AI models are currently experiencing high demand or service disruptions. \n\n*Please try again in a few moments.*";
        }
    }
}

// Export a singleton instance
module.exports = new AIService();
