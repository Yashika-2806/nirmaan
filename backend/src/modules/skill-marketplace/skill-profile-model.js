const mongoose = require('mongoose');

const skillItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'beginner',
    },
}, { _id: false });

const availabilitySlotSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true,
    },
    startTime: {
        type: String,
        required: true,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be HH:mm'],
    },
    endTime: {
        type: String,
        required: true,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTime must be HH:mm'],
    },
    timezone: {
        type: String,
        default: 'UTC',
    },
}, { _id: false });

const skillProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    teachSkills: {
        type: [skillItemSchema],
        default: [],
    },
    learnSkills: {
        type: [skillItemSchema],
        default: [],
    },
    experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'beginner',
    },
    availability: {
        type: [availabilitySlotSchema],
        default: [],
    },
    aiDetectedSkills: {
        type: [String],
        default: [],
    },
    ratingAverage: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    ratingCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    points: {
        type: Number,
        default: 0,
        min: 0,
    },
    premiumUnlocked: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

skillProfileSchema.index({ userId: 1 }, { unique: true });
skillProfileSchema.index({ 'teachSkills.name': 1 });
skillProfileSchema.index({ 'learnSkills.name': 1 });
skillProfileSchema.index({ points: -1 });

module.exports = mongoose.model('SkillProfile', skillProfileSchema);
