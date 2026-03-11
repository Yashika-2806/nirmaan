const mongoose = require('mongoose');

const userCreditsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    balance: {
        type: Number,
        default: 0,
        min: 0,
    },
    lifetimeEarned: {
        type: Number,
        default: 0,
        min: 0,
    },
    lifetimeSpent: {
        type: Number,
        default: 0,
        min: 0,
    },
    lastUpdatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('UserCredits', userCreditsSchema);
