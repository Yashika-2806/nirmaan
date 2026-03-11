const mongoose = require('mongoose');

const careerBadgeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    badgeKey: {
        type: String,
        required: true,
        trim: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    icon: {
        type: String,
        default: 'medal',
    },
    color: {
        type: String,
        default: '#00D9FF',
    },
    milestone: {
        type: String,
        default: '',
    },
    earnedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

careerBadgeSchema.index({ userId: 1, earnedAt: -1 });
careerBadgeSchema.index({ userId: 1, badgeKey: 1 }, { unique: true });

module.exports = mongoose.model('CareerBadge', careerBadgeSchema);
