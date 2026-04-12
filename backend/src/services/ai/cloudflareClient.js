const axios = require('axios');

class CloudflareClient {
    constructor(apiKey, accountId) {
        if (!apiKey) {
            console.warn('[AI] Warning: No API key provided to CloudflareClient');
        }
        if (!accountId) {
            console.warn('[AI] Warning: No Account ID provided to CloudflareClient');
        }
        this.apiKey = apiKey;
        this.accountId = accountId;
    }

    async generateContent(prompt, modelName = '@cf/meta/llama-3-8b-instruct', timeoutMs = 30000) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                const error = new Error(`Cloudflare AI request timed out after ${timeoutMs}ms`);
                error.name = 'TimeoutError';
                reject(error);
            }, timeoutMs);
        });

        const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${modelName}`;

        const requestPromise = axios.post(url, {
            messages: [{ role: 'user', content: prompt }]
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (response.data && response.data.result && response.data.result.response) {
                return response.data.result.response;
            } else {
                throw new Error('Invalid format from Cloudflare AI: ' + JSON.stringify(response.data));
            }
        }).catch(error => {
            let msg = error.message;
            if (error.response && error.response.data && error.response.data.errors) {
                msg = JSON.stringify(error.response.data.errors);
            }
            throw new Error(`Cloudflare API error: ${msg}`);
        });

        return await Promise.race([requestPromise, timeoutPromise]);
    }
}

module.exports = CloudflareClient;
