const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    learnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    skill: {
        type: String,
        required: true,
        trim: true,
    },
    time: {
        type: Date,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
        min: 15,
        max: 240,
    },
    meetingLink: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled',
    },
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SkillRequest',
        default: null,
    },
    isAIMentorSession: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

sessionSchema.index({ mentorId: 1, time: -1 });
sessionSchema.index({ learnerId: 1, time: -1 });
sessionSchema.index({ status: 1, time: -1 });

module.exports = mongoose.model('SkillSession', sessionSchema);
