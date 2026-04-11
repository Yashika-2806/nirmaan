const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiClient {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn('[AI] Warning: No API key provided to GeminiClient');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }
    
    async generateContent(prompt, modelName, timeoutMs = 8000) {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                const error = new Error(`AI request timed out after ${timeoutMs}ms`);
                error.name = 'TimeoutError';
                reject(error);
            }, timeoutMs);
        });

        const requestPromise = model.generateContent(prompt);
        
        const result = await Promise.race([requestPromise, timeoutPromise]);
        const response = await result.response;
        return response.text();
    }
}

module.exports = GeminiClient;
