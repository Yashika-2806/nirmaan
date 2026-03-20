const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    externalId: { type: String, trim: true, index: true },
    source: { type: String, required: true, trim: true, index: true },
    sourceUrl: { type: String, default: '' },
    applyUrl: { type: String, default: '' },
    company: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    location: { type: String, default: '' },
    workMode: { type: String, enum: ['remote', 'hybrid', 'onsite', 'unknown'], default: 'unknown' },
    employmentType: { type: String, default: 'full-time' },
    description: { type: String, default: '' },
    requiredSkills: { type: [String], default: [] },
    niceToHaveSkills: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    compensationText: { type: String, default: '' },
    department: { type: String, default: '' },
    seniority: { type: String, default: '' },
    compensation: {
        raw: { type: String, default: '' },
        min: { type: Number, default: null },
        max: { type: Number, default: null },
        currency: { type: String, default: '' },
        interval: { type: String, default: '' },
        annualizedUsdMin: { type: Number, default: null },
        annualizedUsdMax: { type: Number, default: null },
    },
    postedAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    metadata: {
        providerPayloadHash: { type: String, default: '' },
        confidence: { type: Number, min: 0, max: 1, default: 0.6 },
        canonicalApplyUrl: { type: String, default: '' },
        fingerprint: { type: String, default: '' },
        qualityScore: { type: Number, min: 0, max: 100, default: 0 },
        qualityFlags: { type: [String], default: [] },
        lastQualityCheckAt: { type: Date },
    },
}, { timestamps: true });

JobSchema.index({ company: 1, title: 1, location: 1 }, { unique: true });

module.exports = mongoose.model('CareerTwinJob', JobSchema);
