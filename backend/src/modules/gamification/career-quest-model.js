const mongoose = require('mongoose');

const questTaskSchema = new mongoose.Schema({
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    target: { type: Number, required: true, min: 1 },
    current: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
}, { _id: false });

const questRewardSchema = new mongoose.Schema({
    xp: { type: Number, default: 200, min: 0 },
    credits: { type: Number, default: 100, min: 0 },
    badgeKey: { type: String, default: 'career_achiever' },
    badgeTitle: { type: String, default: 'Career Achiever' },
}, { _id: false });

const careerQuestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    weekStart: {
        type: Date,
        required: true,
    },
    weekEnd: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'claimed', 'expired'],
        default: 'active',
        index: true,
    },
    tasks: {
        type: [questTaskSchema],
        default: () => [],
    },
    reward: {
        type: questRewardSchema,
        default: () => ({}),
    },
    completedAt: Date,
    claimedAt: Date,
}, {
    timestamps: true,
});

careerQuestSchema.index({ userId: 1, weekStart: 1 }, { unique: true });
careerQuestSchema.index({ weekStart: 1, status: 1 });

module.exports = mongoose.model('CareerQuest', careerQuestSchema);
