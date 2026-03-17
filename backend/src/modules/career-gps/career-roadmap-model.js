const mongoose = require('mongoose');

const skillProfileItemSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    value: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const gapItemSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    current: { type: Number, required: true, min: 0, max: 100 },
    required: { type: Number, required: true, min: 0, max: 100 },
    gap: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const roadmapTaskSchema = new mongoose.Schema({
    weekNumber: { type: Number, required: true, min: 1 },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
        type: String,
        enum: ['dsa', 'project', 'interview', 'resume', 'communication', 'research', 'networking'],
        default: 'dsa',
    },
    targetCount: { type: Number, default: 1, min: 1 },
    currentCount: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    xpReward: { type: Number, default: 20, min: 0 },
    linkedStageKey: { type: String, default: '' },
}, { timestamps: true });

const timelineStageSchema = new mongoose.Schema({
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    requiredTaskCompletions: { type: Number, default: 1, min: 1 },
    unlocked: { type: Boolean, default: false },
    unlockedAt: { type: Date, default: null },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    order: { type: Number, default: 1 },
}, { _id: false });

const careerRoadmapSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        goalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CareerGoal',
            required: true,
            index: true,
        },
        targetRole: { type: String, required: true },
        careerReadinessScore: { type: Number, required: true, min: 0, max: 100 },
        currentSkillProfile: [skillProfileItemSchema],
        requiredSkillProfile: [skillProfileItemSchema],
        gapAnalysis: [gapItemSchema],
        timelineStages: [timelineStageSchema],
        tasks: [roadmapTaskSchema],
        recommendations: [String],
        status: {
            type: String,
            enum: ['active', 'completed', 'archived'],
            default: 'active',
        },
        aiVersion: { type: String, default: 'career-gps-v1' },
        cacheExpiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 1000 * 60 * 60 * 12),
            index: true,
        },
    },
    { timestamps: true }
);

careerRoadmapSchema.index({ userId: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model('CareerRoadmap', careerRoadmapSchema);
