const mongoose = require('mongoose');

/**
 * TestCase Schema for Interview DSA Problems
 * Each problem can have multiple test cases (sample + hidden)
 */
const TestCaseSchema = new mongoose.Schema({
    // Reference to question
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewQuestion',
        required: true,
        index: true,
    },

    // Test case metadata
    title: {
        type: String,
        required: true,
        example: 'Test Case 1: Basic input',
    },

    // Test case visibility
    isVisible: {
        type: Boolean,
        default: true, // true = sample (visible), false = hidden
        index: true,
    },

    // Difficulty/category
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'extreme'],
        default: 'medium',
    },

    // Input and output
    input: {
        type: String,
        required: true,
        maxlength: 10000,
        description: 'Test case input (stdin)',
    },

    expected: {
        type: String,
        required: true,
        maxlength: 10000,
        description: 'Expected output',
    },

    // Optional explanation
    explanation: {
        type: String,
        optional: true,
        maxlength: 5000,
        description: 'Why this test case matters / what it tests',
    },

    // Test case categorization
    category: {
        type: String,
        enum: ['normal', 'edge_case', 'boundary', 'corner_case', 'stress_test', 'special'],
        default: 'normal',
    },

    // Performance constraints (for this specific test)
    constraints: {
        timeLimit: {
            type: Number,
            default: 5,
            description: 'Time limit in seconds',
        },
        memoryLimit: {
            type: Number,
            default: 128,
            description: 'Memory limit in MB',
        },
    },

    // Auto-generation metadata
    generatedBy: {
        type: String,
        enum: ['manual', 'ai', 'seed'],
        default: 'manual',
    },

    aiModel: {
        type: String,
        optional: true,
        description: 'Which AI model generated this (e.g., "gemini-1.5-pro")',
    },

    // Test execution history (last 5 runs)
    executionHistory: [{
        userId: mongoose.Schema.Types.ObjectId,
        passed: Boolean,
        executionTime: Number,
        memory: Number,
        timestamp: { type: Date, default: Date.now },
    }],

    // Timestamps
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
    collection: 'test_cases',
});

// Indexes
TestCaseSchema.index({ questionId: 1, isVisible: 1 });
TestCaseSchema.index({ questionId: 1, createdAt: -1 });
TestCaseSchema.index({ category: 1, difficulty: 1 });

// Methods
TestCaseSchema.methods.toPublic = function() {
    return {
        _id: this._id,
        title: this.title,
        input: this.input,
        expected: this.expected,
        explanation: this.explanation,
        isVisible: this.isVisible,
        difficulty: this.difficulty,
    };
};

TestCaseSchema.statics.getVisibleTestCases = async function(questionId) {
    return this.find({ questionId, isVisible: true });
};

TestCaseSchema.statics.getAllTestCases = async function(questionId) {
    return this.find({ questionId });
};

module.exports = mongoose.model('TestCase', TestCaseSchema);
