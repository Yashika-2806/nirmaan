const mongoose = require('mongoose');

const pointsLedgerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    points: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        enum: ['teaching-session', 'helping-others', 'request-completed', 'review-given'],
        required: true,
    },
    referenceType: {
        type: String,
        enum: ['session', 'request', 'review'],
        required: true,
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

pointsLedgerSchema.index({ userId: 1, createdAt: -1 });
pointsLedgerSchema.index({ referenceType: 1, referenceId: 1, userId: 1 });

module.exports = mongoose.model('SkillPointsLedger', pointsLedgerSchema);
