const Anthropic = require('@anthropic-ai/sdk');

class ClaudeClient {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn('[AI] Warning: No API key provided to ClaudeClient');
        }
        this.anthropic = new Anthropic({
            apiKey: apiKey || '',
        });
    }

    /**
     * Generate content using Claude.
     * @param {string} prompt - The user prompt
     * @param {string} modelName - Claude model to use
     * @param {number} timeoutMs - Timeout in milliseconds (default 30000 for production safety)
     */
    async generateContent(prompt, modelName = 'claude-sonnet-4-20250514', timeoutMs = 30000) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                const error = new Error(`Claude AI request timed out after ${timeoutMs}ms`);
                error.name = 'TimeoutError';
                reject(error);
            }, timeoutMs);
        });

        // Estimate max_tokens based on prompt length and use case
        // Long prompts (resume, structured JSON) need more output tokens
        const promptLength = (prompt || '').length;
        let maxTokens = 4096; // Default generous limit
        if (promptLength > 10000) {
            maxTokens = 8192; // Large prompts like resume generation
        }

        // Map the string prompt to Anthropic's messages format
        const requestPromise = this.anthropic.messages.create({
            model: modelName,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }]
        }).then(response => {
            // Anthropic returns an array of content blocks
            return response.content[0].text;
        });

        return await Promise.race([requestPromise, timeoutPromise]);
    }
}

module.exports = ClaudeClient;
