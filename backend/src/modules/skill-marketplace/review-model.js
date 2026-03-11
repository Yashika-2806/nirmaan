const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SkillSession',
        required: true,
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    revieweeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    feedback: {
        type: String,
        required: true,
        maxlength: 1000,
    },
}, {
    timestamps: true,
});

reviewSchema.index({ sessionId: 1, reviewerId: 1 }, { unique: true });
reviewSchema.index({ revieweeId: 1, createdAt: -1 });

module.exports = mongoose.model('SkillReview', reviewSchema);
