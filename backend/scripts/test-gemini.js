
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const key = process.env.GEMINI_KEY_1;
    if (!key) {
        console.error("No API Key found in env!");
        return;
    }

    console.log("Using Key ending in:", key.slice(-4));

    try {
        const genAI = new GoogleGenerativeAI(key);
        // Access the model manager to list models
        // Note: SDK structure might differ, checking documentation
        // The SDK doesn't always expose listModels directly on the main class in older versions,
        // but in newer ones it might not either. 
        // Actually, for 'latest' SDK, we can usually just try to generate content.

        // But the error message suggested calling ListModels. 
        // We can do this via REST if the SDK doesn't support it easily.

        // Let's try to just hit the API with a fetch first for listing models.
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log("--- Available Models ---");
        if (data.models) {
            data.models.forEach(m => {
                console.log(`Name: ${m.name}`);
                console.log(`Methods: ${m.supportedGenerationMethods}`);
                console.log("---");
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
