const GeminiClient = require('./geminiClient');
const AIFallbackManager = require('./aiFallbackManager');
const ClaudeClient = require('./claudeClient');

class AIService {
    constructor() {
        this.client = null;
        this.fallbackManager = null;
        this._lastApiKey = null;
    }

    _ensureInitialized(apiKey) {
        // Re-initialize if API key changed or first call
        if (!this.fallbackManager || (apiKey && apiKey !== this._lastApiKey)) {
            const keyToUse = apiKey || process.env.GEMINI_KEY_1 || process.env.GEMINI_KEY_6 || process.env.GEMINI_API_KEY;
            
            // Create Gemini client (may have null key - fallback manager handles this)
            const geminiClient = new GeminiClient(keyToUse);

            // Initialize Claude as reliable paid fallback
            const claudeKey = process.env.CLAUDE_API_KEY;
            const claudeClient = claudeKey ? new ClaudeClient(claudeKey) : null;

            if (claudeKey) {
                console.log('[AIService] ✅ Claude fallback configured with API key');
            } else {
                console.warn('[AIService] ⚠️ CLAUDE_API_KEY not set in environment. Fallback to Claude will not be available.');
            }

            // Initialize Cloudflare Client if API key is in environment
            const cloudflareKey = process.env.CLOUDFLARE_API_KEY;
            const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
            const CloudflareClient = require('./cloudflareClient');
            
            let primaryClient;
            let providerName = 'gemini';

            if (cloudflareKey && cloudflareAccountId) {
                primaryClient = new CloudflareClient(cloudflareKey, cloudflareAccountId);
                providerName = 'cloudflare';
                console.log('[AIService] Using Cloudflare as primary provider');
            } else {
                primaryClient = geminiClient;
                if (keyToUse) {
                    console.log('[AIService] Using Gemini as primary provider (key detected)');
                } else {
                    console.log('[AIService] No Gemini key configured - will rely on Claude fallback');
                }
            }

            this.fallbackManager = new AIFallbackManager(primaryClient, providerName, geminiClient, claudeClient);
            this._lastApiKey = apiKey;
        }
    }

    /**
     * Generate content with full fallback and retry logic.
     * Priority: Gemini (with key rotation) → Claude (paid fallback)
     * 
     * @param {string} prompt - The prompt to send to the AI
     * @param {string} apiKey - Optional specific API key, otherwise uses env variables
     * @param {number} timeoutMs - Timeout in milliseconds (default 30s)
     * @returns {Promise<string>} - AI-generated content
     * @throws {Error} - If all providers fail
     */
    async generate(prompt, apiKey = null, timeoutMs = 30000) {
        this._ensureInitialized(apiKey);

        try {
            const result = await this.fallbackManager.generateWithFallback(prompt, timeoutMs);
            console.log('[AIService] ✅ Response generated successfully from fallback chain');
            return result;
        } catch (error) {
            console.error('[AIService] ❌ All providers exhausted. Final error:', error.message);
            throw error;
        }
    }
}

// Export a singleton instance
module.exports = new AIService();
