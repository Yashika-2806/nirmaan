const mongoose = require('mongoose');

const ALLOWED_TARGET_ROLES = [
    'Software Engineer',
    'Data Scientist',
    'Product Manager',
    'MBA Consultant',
    'Investment Analyst',
    'Marketing Manager',
    'Startup Founder',
];

const careerGoalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        targetRole: {
            type: String,
            required: true,
            trim: true,
            enum: ALLOWED_TARGET_ROLES,
        },
        status: {
            type: String,
            enum: ['active', 'archived'],
            default: 'active',
        },
        source: {
            type: String,
            enum: ['manual', 'ai'],
            default: 'manual',
        },
        notes: {
            type: String,
            default: '',
            maxlength: 500,
        },
    },
    { timestamps: true }
);

careerGoalSchema.index({ userId: 1, status: 1 });

module.exports = {
    CareerGoal: mongoose.model('CareerGoal', careerGoalSchema),
    ALLOWED_TARGET_ROLES,
};
