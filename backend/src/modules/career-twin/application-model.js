const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CareerTwinJob',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['draft', 'applied', 'shortlisted', 'interview', 'rejected', 'offer', 'withdrawn'],
        default: 'draft',
        index: true,
    },
    matchScore: { type: Number, min: 0, max: 100, default: 0 },
    interviewProbability: { type: Number, min: 0, max: 100, default: 0 },
    fitCategory: { type: String, enum: ['strong_fit', 'moderate_fit', 'stretch'], default: 'moderate_fit' },
    missingSkills: { type: [String], default: [] },
    tailoredResume: {
        summary: { type: String, default: '' },
        bullets: { type: [String], default: [] },
        atsKeywords: { type: [String], default: [] },
        resumeFitScore: { type: Number, min: 0, max: 100, default: 0 },
    },
    applyMode: { type: String, enum: ['assisted', 'user_approved', 'manual'], default: 'assisted' },
    preparedAnswers: {
        whyThisRole: { type: String, default: '' },
        whyYou: { type: String, default: '' },
        impactStory: { type: String, default: '' },
    },
    timeline: {
        appliedAt: { type: Date },
        lastUpdatedAt: { type: Date, default: Date.now },
    },
    notes: { type: String, default: '' },
}, { timestamps: true });

ApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('CareerTwinApplication', ApplicationSchema);
