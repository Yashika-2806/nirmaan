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

    async generateContent(prompt, modelName = 'claude-3-haiku-20240307', timeoutMs = 8000) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                const error = new Error(`Claude AI request timed out after ${timeoutMs}ms`);
                error.name = 'TimeoutError';
                reject(error);
            }, timeoutMs);
        });

        // Map the string prompt to Anthropic's messages format
        const requestPromise = this.anthropic.messages.create({
            model: modelName,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        }).then(response => {
            // Anthropic returns an array of content blocks
            return response.content[0].text;
        });

        return await Promise.race([requestPromise, timeoutPromise]);
    }
}

module.exports = ClaudeClient;
