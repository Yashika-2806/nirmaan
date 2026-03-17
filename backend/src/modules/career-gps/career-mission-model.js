const mongoose = require('mongoose');

const missionItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: {
        type: String,
        enum: ['dsa', 'project', 'interview', 'resume', 'communication', 'networking'],
        required: true,
    },
    targetCount: { type: Number, default: 1, min: 1 },
    currentCount: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    xpReward: { type: Number, default: 15, min: 0 },
    readinessImpact: { type: Number, default: 1, min: 0, max: 20 },
}, { timestamps: true });

const careerMissionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        roadmapId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CareerRoadmap',
            required: true,
        },
        missionDate: {
            type: Date,
            required: true,
            index: true,
        },
        items: [missionItemSchema],
        status: {
            type: String,
            enum: ['active', 'completed'],
            default: 'active',
        },
        source: {
            type: String,
            enum: ['ai', 'fallback'],
            default: 'ai',
        },
    },
    { timestamps: true }
);

careerMissionSchema.index({ userId: 1, missionDate: -1 }, { unique: true });

module.exports = mongoose.model('CareerMission', careerMissionSchema);
