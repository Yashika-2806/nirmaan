const mongoose = require('mongoose');

/**
 * Interview Question Model
 * Stores DSA and interview questions with metadata
 */
const InterviewQuestionSchema = new mongoose.Schema({
    // Basic info
    title: {
        type: String,
        required: true,
        unique: true,
        index: true,
        maxlength: 500,
    },

    description: {
        type: String,
        required: true,
        maxlength: 10000,
    },

    // Problem details
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
        index: true,
    },

    category: {
        type: String,
        enum: [
            'array',
            'string',
            'linked-list',
            'tree',
            'graph',
            'dynamic-programming',
            'backtracking',
            'sorting',
            'searching',
            'hash-table',
            'heap',
            'greedy',
            'math',
            'bit-manipulation',
            'sliding-window',
            'two-pointers',
            'design',
            'other',
        ],
        index: true,
    },

    tags: [String],

    // Constraints and function signature
    functionSignature: {
        type: String,
        optional: true,
        description: 'For questions with specific function signature',
    },

    constraints: {
        type: String,
        optional: true,
        maxlength: 1000,
    },

    // Examples
    examples: [{
        input: String,
        output: String,
        explanation: String,
    }],

    // Solution info
    solutions: [{
        title: String,
        approach: String,
        timeComplexity: String,
        spaceComplexity: String,
        code: String,
        language: String,
    }],

    // Metadata
    companies: [String], // Google, Amazon, etc.
    frequencyScore: {
        type: Number,
        default: 0,
        description: 'How frequently asked in interviews',
    },

    // Status
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },

    // Tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    stats: {
        totalAttempts: {
            type: Number,
            default: 0,
        },
        totalSubmissions: {
            type: Number,
            default: 0,
        },
        acceptanceRate: {
            type: Number,
            default: 0,
        },
        averageTime: {
            type: Number,
            default: 0,
            description: 'Average time to solve in seconds',
        },
    },

    timestamps: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
    collection: 'interview_questions',
});

// Indexes
InterviewQuestionSchema.index({ category: 1, difficulty: 1 });
InterviewQuestionSchema.index({ companies: 1 });
InterviewQuestionSchema.index({ tags: 1 });

// Methods
InterviewQuestionSchema.methods.toBasic = function() {
    return {
        _id: this._id,
        title: this.title,
        description: this.description,
        difficulty: this.difficulty,
        category: this.category,
        tags: this.tags,
    };
};

InterviewQuestionSchema.methods.toFull = function() {
    return {
        _id: this._id,
        title: this.title,
        description: this.description,
        difficulty: this.difficulty,
        category: this.category,
        tags: this.tags,
        functionSignature: this.functionSignature,
        constraints: this.constraints,
        examples: this.examples,
        companies: this.companies,
        stats: this.stats,
    };
};

module.exports = mongoose.model('InterviewQuestion', InterviewQuestionSchema);
