const mongoose = require('mongoose');
const { AI_PROVIDERS, AI_KEY_STATUS, MODULES } = require('../../config/constants');

const aiKeySchema = new mongoose.Schema({
    keyName: {
        type: String,
        required: true,
        unique: true,
    },
    apiKey: {
        type: String,
        required: true,
    },
    provider: {
        type: String,
        enum: Object.values(AI_PROVIDERS),
        default: AI_PROVIDERS.GEMINI,
    },
    status: {
        type: String,
        enum: Object.values(AI_KEY_STATUS),
        default: AI_KEY_STATUS.ACTIVE,
    },
    assignedModules: [{
        type: String,
        enum: Object.values(MODULES),
    }],
    usage: {
        totalTokens: {
            type: Number,
            default: 0,
        },
        dailyTokens: {
            type: Number,
            default: 0,
        },
        lastReset: {
            type: Date,
            default: Date.now,
        },
        requestCount: {
            type: Number,
            default: 0,
        },
        requestsThisMinute: {
            type: Number,
            default: 0,
        },
        minuteResetTime: {
            type: Date,
            default: Date.now,
        },
    },
    limits: {
        dailyTokenLimit: {
            type: Number,
            default: 1000000,
        },
        requestsPerMinute: {
            type: Number,
            default: 60,
        },
    },
    priority: {
        type: Number,
        default: 1,
        min: 1,
        max: 10,
    },
    metadata: {
        description: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        lastUsed: Date,
        errorCount: {
            type: Number,
            default: 0,
        },
    },
}, {
    timestamps: true,
});

// Indexes
aiKeySchema.index({ status: 1, assignedModules: 1 });
aiKeySchema.index({ priority: -1 });
aiKeySchema.index({ 'usage.dailyTokens': 1 });

module.exports = mongoose.model('AIKey', aiKeySchema);
