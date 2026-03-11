const mongoose = require('mongoose');

const statsDeltaSchema = new mongoose.Schema({
    dsaProblemsSolved: { type: Number, default: 0 },
    mockInterviewsCompleted: { type: Number, default: 0 },
    resumesImproved: { type: Number, default: 0 },
    skillSessionsTaught: { type: Number, default: 0 },
    skillMarketplaceContributions: { type: Number, default: 0 },
    pdfPracticeSessions: { type: Number, default: 0 },
    researchTasksCompleted: { type: Number, default: 0 },
    roadmapMilestonesCompleted: { type: Number, default: 0 },
    careerTwinSessions: { type: Number, default: 0 },
    questsCompleted: { type: Number, default: 0 },
}, { _id: false });

const xpHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    activityType: {
        type: String,
        required: true,
        trim: true,
    },
    sourceModule: {
        type: String,
        required: true,
        trim: true,
    },
    xpDelta: {
        type: Number,
        default: 0,
    },
    creditsDelta: {
        type: Number,
        default: 0,
    },
    streakDelta: {
        type: Number,
        default: 0,
    },
    totalXpAfter: {
        type: Number,
        default: 0,
    },
    levelAfter: {
        type: Number,
        default: 1,
    },
    statsDelta: {
        type: statsDeltaSchema,
        default: () => ({}),
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

xpHistorySchema.index({ userId: 1, createdAt: -1 });
xpHistorySchema.index({ activityType: 1, createdAt: -1 });

module.exports = mongoose.model('XPHistory', xpHistorySchema);
