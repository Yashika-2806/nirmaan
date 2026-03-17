const mongoose = require('mongoose');

const factorSchema = new mongoose.Schema({
    label: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    weight: { type: Number, required: true, min: 0, max: 1 },
}, { _id: false });

const careerProbabilitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        goalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CareerGoal',
            required: true,
        },
        roadmapId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CareerRoadmap',
            required: true,
        },
        startupCompany: { type: Number, default: 0, min: 0, max: 100 },
        midSizeTechCompany: { type: Number, default: 0, min: 0, max: 100 },
        topTechCompany: { type: Number, default: 0, min: 0, max: 100 },
        factors: [factorSchema],
        modelVersion: { type: String, default: 'probability-v1' },
        lastComputedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CareerProbability', careerProbabilitySchema);
