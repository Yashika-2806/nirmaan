const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
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

const userGamificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    totalXp: {
        type: Number,
        default: 0,
        min: 0,
    },
    level: {
        type: Number,
        default: 1,
        min: 1,
    },
    levelTitle: {
        type: String,
        default: 'Beginner',
    },
    xpInCurrentLevel: {
        type: Number,
        default: 0,
        min: 0,
    },
    xpForNextLevel: {
        type: Number,
        default: 100,
        min: 1,
    },
    streakCurrent: {
        type: Number,
        default: 0,
        min: 0,
    },
    streakLongest: {
        type: Number,
        default: 0,
        min: 0,
    },
    lastActiveDate: {
        type: Date,
        default: null,
    },
    badgesEarnedCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    readinessScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    stats: {
        type: statsSchema,
        default: () => ({}),
    },
}, {
    timestamps: true,
});

userGamificationSchema.index({ totalXp: -1 });
userGamificationSchema.index({ level: -1, totalXp: -1 });

module.exports = mongoose.model('UserGamification', userGamificationSchema);
