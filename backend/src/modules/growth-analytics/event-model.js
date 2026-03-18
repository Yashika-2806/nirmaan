const mongoose = require('mongoose');

const growthEventSchema = new mongoose.Schema(
    {
        event: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        source: {
            type: String,
            trim: true,
            maxlength: 120,
            default: 'unknown',
        },
        props: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        sessionId: {
            type: String,
            trim: true,
            maxlength: 120,
            default: null,
        },
        occurredAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

growthEventSchema.index({ event: 1, createdAt: -1 });
growthEventSchema.index({ source: 1, createdAt: -1 });
growthEventSchema.index({ userId: 1, createdAt: -1 });
growthEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 120 });

module.exports = mongoose.model('GrowthEvent', growthEventSchema);
