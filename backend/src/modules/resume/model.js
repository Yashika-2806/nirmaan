
const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    version: {
        type: Number,
        default: 1
    },
    name: {
        type: String,
        required: [true, 'Please add a name for your resume'],
        trim: true
    },
    content: {
        personal: {
            fullName: String,
            email: String,
            phone: String,
            age: String,
            location: String,
            linkedin: String,
            website: String,
            photoUrl: String,
            summary: String
        },
        experience: [{
            role: String,
            company: String,
            location: String,
            startDate: String,
            endDate: String,
            current: Boolean,
            description: String
        }],
        education: [{
            school: String,
            degree: String,
            fieldOfStudy: String,
            startDate: String,
            endDate: String,
            grade: String,
            year: String
        }],
        projects: [{
            name: String,
            description: String,
            technologies: [String],
            link: String
        }],
        skills: [String],
        certifications: [{
            name: String,
            issuer: String,
            date: String
        }],
        codingProfiles: {
            leetcode: {
                rating: Number,
                solved: Number,
                easy: Number,
                medium: Number,
                hard: Number
            },
            codechef: {
                rating: Number,
                stars: String,
                highestRating: Number
            },
            codeforces: {
                rating: Number,
                rank: String,
                maxRating: Number
            },
            hackerrank: {
                badges: [String],
                stars: Number
            },
            geeksforgeeks: {
                score: Number,
                problemsSolved: Number
            }
        },
        achievements: [String]
    },
    analysis: {
        atsScore: {
            type: Number,
            default: 0
        },
        improvements: [String],
        keywordMatch: {
            type: Map,
            of: Number
        },
        impactMetrics: [String]
    },
    targetJobs: [String],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries per user
ResumeSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Resume', ResumeSchema);
