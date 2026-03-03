const mongoose = require('mongoose');
const { DSA_DIFFICULTY } = require('../../config/constants');

const dsaProblemSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    problemId: {
        type: String,
        required: true,
    },
    title: String,
    difficulty: {
        type: String,
        enum: Object.values(DSA_DIFFICULTY),
    },
    topics: [String],
    attempts: [{
        code: String,
        language: String,
        analysis: {
            correctness: String,
            complexity: Object,
            feedback: String,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }],
    solved: {
        type: Boolean,
        default: false,
    },
    solvedAt: Date,
    timeSpent: Number, // in seconds
    hintsUsed: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

dsaProblemSchema.index({ userId: 1, problemId: 1 });
dsaProblemSchema.index({ userId: 1, solved: 1 });

module.exports = mongoose.model('DSAProblem', dsaProblemSchema);
