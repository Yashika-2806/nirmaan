const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema({
    rank: { type: Number, required: true, min: 1 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    institution: { type: String, default: '' },
    score: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    dsaSolved: { type: Number, default: 0 },
    skillContributions: { type: Number, default: 0 },
}, { _id: false });

const leaderboardSchema = new mongoose.Schema({
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    scope: {
        type: String,
        enum: ['global', 'college'],
        required: true,
    },
    metric: {
        type: String,
        enum: ['xp', 'dsa', 'skill'],
        required: true,
    },
    contextKey: {
        type: String,
        default: 'all',
    },
    entries: {
        type: [leaderboardEntrySchema],
        default: () => [],
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

leaderboardSchema.index({ weekStart: 1, scope: 1, metric: 1, contextKey: 1 }, { unique: true });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
