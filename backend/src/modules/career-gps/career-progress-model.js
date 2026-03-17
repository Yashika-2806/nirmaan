const mongoose = require('mongoose');

const readinessHistorySchema = new mongoose.Schema({
    score: { type: Number, min: 0, max: 100, required: true },
    source: { type: String, default: 'career-twin' },
    at: { type: Date, default: Date.now },
}, { _id: false });

const eventSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['task_completed', 'mission_completed', 'stage_unlocked', 'stage_completed'],
        required: true,
    },
    title: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    at: { type: Date, default: Date.now },
}, { _id: false });

const careerProgressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        roadmapId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CareerRoadmap',
            required: true,
        },
        completedTasks: { type: Number, default: 0, min: 0 },
        totalTasks: { type: Number, default: 0, min: 0 },
        progressPercent: { type: Number, default: 0, min: 0, max: 100 },
        totalXpEarned: { type: Number, default: 0, min: 0 },
        readinessHistory: { type: [readinessHistorySchema], default: [] },
        timelineEvents: { type: [eventSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CareerProgress', careerProgressSchema);
