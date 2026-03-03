const mongoose = require('mongoose');

const aiUsageLogSchema = new mongoose.Schema({
    keyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AIKey',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    module: {
        type: String,
        required: true,
    },
    endpoint: {
        type: String,
        required: true,
    },
    tokensUsed: {
        type: Number,
        default: 0,
    },
    responseTime: {
        type: Number, // milliseconds
    },
    success: {
        type: Boolean,
        default: true,
    },
    error: {
        code: String,
        message: String,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        expires: 7776000, // 90 days TTL
    },
}, {
    timestamps: false,
});

// Indexes
aiUsageLogSchema.index({ keyId: 1, timestamp: -1 });
aiUsageLogSchema.index({ userId: 1, timestamp: -1 });
aiUsageLogSchema.index({ module: 1, timestamp: -1 });
aiUsageLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // TTL index

module.exports = mongoose.model('AIUsageLog', aiUsageLogSchema);
