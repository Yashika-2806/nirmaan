const mongoose = require('mongoose');

const skillRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    skill: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000,
    },
    preferredTime: {
        type: String,
        required: true,
    },
    rewardType: {
        type: String,
        enum: ['skill-exchange', 'points'],
        required: true,
    },
    status: {
        type: String,
        enum: ['open', 'matched', 'completed', 'cancelled'],
        default: 'open',
    },
    helperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});

skillRequestSchema.index({ status: 1, createdAt: -1 });
skillRequestSchema.index({ skill: 1, status: 1 });
skillRequestSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SkillRequest', skillRequestSchema);
