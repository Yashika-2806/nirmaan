require('dotenv').config();
const mongoose = require('mongoose');
const AIKey = require('../src/core/ai-key-manager/model');
const Encryption = require('../src/core/utils/encryption');
const { MODULES, AI_PROVIDERS } = require('../src/config/constants');
const logger = require('../src/core/utils/logger');

const seedAIKeys = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Connected to MongoDB');

        // Clear existing keys (optional - comment out in production)
        // await AIKey.deleteMany({});
        // logger.info('Cleared existing AI keys');

        // Get keys from environment
        const keys = [];
        let keyIndex = 1;

        while (process.env[`GEMINI_KEY_${keyIndex}`]) {
            keys.push(process.env[`GEMINI_KEY_${keyIndex}`]);
            keyIndex++;
        }

        if (keys.length === 0) {
            logger.warn('No AI keys found in environment variables');
            process.exit(0);
        }

        // Seed keys
        const allModules = Object.values(MODULES);

        for (let i = 0; i < keys.length; i++) {
            const encryptedKey = Encryption.encrypt(keys[i]);

            await AIKey.create({
                keyName: `Gemini Key ${i + 1}`,
                apiKey: encryptedKey,
                provider: AI_PROVIDERS.GEMINI,
                assignedModules: allModules,
                limits: {
                    dailyTokenLimit: 1000000,
                    requestsPerMinute: 60,
                },
                priority: i === 0 ? 10 : 5, // First key gets highest priority
                metadata: {
                    description: `Auto-seeded Gemini API key ${i + 1}`,
                },
            });

            logger.info(`✅ Seeded: Gemini Key ${i + 1}`);
        }

        logger.info(`🎉 Successfully seeded ${keys.length} AI keys`);
        process.exit(0);
    } catch (error) {
        logger.error('Error seeding AI keys:', error);
        process.exit(1);
    }
};

seedAIKeys();
