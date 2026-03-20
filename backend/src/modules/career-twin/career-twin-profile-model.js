const mongoose = require('mongoose');

const SkillNodeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    level: { type: Number, min: 0, max: 100, default: 0 },
    source: { type: String, enum: ['resume', 'project', 'assessment', 'manual'], default: 'resume' },
    years: { type: Number, min: 0, default: 0 },
}, { _id: false });

const SkillsGraphEdgeSchema = new mongoose.Schema({
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    relation: { type: String, enum: ['used_with', 'prerequisite_of', 'related_to'], default: 'related_to' },
    weight: { type: Number, min: 0, max: 1, default: 0.5 },
}, { _id: false });

const CareerTwinProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    activeResumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
    },
    summary: {
        headline: { type: String, default: '' },
        preferredRoles: { type: [String], default: [] },
        preferredLocations: { type: [String], default: [] },
        workMode: { type: String, enum: ['remote', 'hybrid', 'onsite', 'any'], default: 'any' },
        strengths: { type: [String], default: [] },
    },
    projects: {
        type: [{
            name: { type: String, default: '' },
            summary: { type: String, default: '' },
            technologies: { type: [String], default: [] },
            impact: { type: String, default: '' },
        }],
        default: [],
    },
    experiences: {
        type: [{
            role: { type: String, default: '' },
            company: { type: String, default: '' },
            durationMonths: { type: Number, min: 0, default: 0 },
            highlights: { type: [String], default: [] },
        }],
        default: [],
    },
    skills: { type: [SkillNodeSchema], default: [] },
    skillsGraph: {
        nodes: { type: [SkillNodeSchema], default: [] },
        edges: { type: [SkillsGraphEdgeSchema], default: [] },
    },
    learningSignals: {
        totalApplications: { type: Number, min: 0, default: 0 },
        shortlisted: { type: Number, min: 0, default: 0 },
        rejected: { type: Number, min: 0, default: 0 },
        offered: { type: Number, min: 0, default: 0 },
        roleOutcomeWeights: {
            type: Map,
            of: Number,
            default: {},
        },
        skillOutcomeWeights: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    parsedFrom: {
        sourceType: { type: String, enum: ['upload', 'existing_resume', 'manual'], default: 'existing_resume' },
        filename: { type: String, default: '' },
        parsedAt: { type: Date, default: Date.now },
    },
}, { timestamps: true });

module.exports = mongoose.model('CareerTwinProfile', CareerTwinProfileSchema);
