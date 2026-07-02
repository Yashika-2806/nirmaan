const Anthropic = require('@anthropic-ai/sdk');

class ClaudeClient {
    constructor(apiKey) {
        if (!apiKey || apiKey.trim() === '') {
            const msg = '[ClaudeClient] ❌ ERROR: No API key provided. Claude will not be available as fallback.';
            console.error(msg);
            throw new Error(msg);
        }

        if (!apiKey.startsWith('sk-ant-')) {
            console.warn('[ClaudeClient] ⚠️ WARNING: API key does not start with "sk-ant-". This may not be a valid Anthropic key.');
        }

        this.apiKey = apiKey;
        this.anthropic = new Anthropic({
            apiKey: apiKey,
            timeout: 130000, // 130 seconds - allows for 120s operation timeout + buffer
            maxRetries: 2,   // Retry up to 2 times on transient failures
        });
        console.log('[ClaudeClient] ✅ Initialized with valid API key');
    }

    /**
     * Generate content using Claude.
     * @param {string} prompt - The user prompt
     * @param {string} modelName - Claude model to use (default: claude-3-5-sonnet-latest)
     * @param {number} timeoutMs - Timeout in milliseconds (default 30000)
     * @returns {Promise<string>} - AI-generated response text
     * @throws {Error} - If request fails or times out
     */
    async generateContent(prompt, modelName = 'claude-3-5-sonnet-latest', timeoutMs = 30000) {
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('[ClaudeClient] Invalid prompt: must be a non-empty string');
        }

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                const error = new Error(`Claude API request timed out after ${timeoutMs}ms`);
                error.name = 'TimeoutError';
                error.code = 'TIMEOUT';
                reject(error);
            }, timeoutMs);
        });

        // Estimate max_tokens based on prompt length
        // Long prompts (DSA analysis, code review) need more output tokens
        const promptLength = (prompt || '').length;
        let maxTokens = 4096; // Default generous limit
        if (promptLength > 5000) {
            maxTokens = 8192; // Extended for detailed code analysis
        }
        if (promptLength > 10000) {
            maxTokens = 8192; // Cap at 8192 for API compatibility
        }

        try {
            // Map the string prompt to Anthropic's messages format
            const requestPromise = this.anthropic.messages.create({
                model: modelName,
                max_tokens: maxTokens,
                messages: [{ role: 'user', content: prompt }]
            }).then(response => {
                // Anthropic returns an array of content blocks
                if (!response.content || response.content.length === 0) {
                    throw new Error('[ClaudeClient] Empty response from Claude API');
                }
                const text = response.content[0].text;
                if (!text || text.trim() === '') {
                    throw new Error('[ClaudeClient] Claude returned empty text');
                }
                return text;
            }).catch(error => {
                // Add context to Anthropic SDK errors
                const msg = error.message || String(error);
                if (msg.includes('401') || msg.includes('invalid API key')) {
                    throw new Error(`[ClaudeClient] Invalid or expired API key: ${msg}`);
                }
                if (msg.includes('429') || msg.includes('rate limit')) {
                    throw new Error(`[ClaudeClient] Rate limited by Claude API: ${msg}`);
                }
                if (msg.includes('overloaded') || msg.includes('503')) {
                    throw new Error(`[ClaudeClient] Claude API overloaded: ${msg}`);
                }
                throw new Error(`[ClaudeClient] API Error: ${msg}`);
            });

            return await Promise.race([requestPromise, timeoutPromise]);
        } catch (error) {
            console.error('[ClaudeClient] Request failed:', error.message);
            throw error;
        }
    }
}

module.exports = ClaudeClient;
