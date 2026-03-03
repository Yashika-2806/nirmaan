const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, SUBSCRIPTION_TIERS } = require('../../config/constants');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 8,
        select: false,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER,
    },
    profile: {
        avatar: String,
        bio: String,
        currentRole: String,
        targetRole: String,
        experience: Number,
        skills: [String],
        education: {
            degree: String,
            institution: String,
            year: Number,
        },
    },
    subscription: {
        tier: {
            type: String,
            enum: Object.values(SUBSCRIPTION_TIERS),
            default: SUBSCRIPTION_TIERS.FREE,
        },
        validUntil: Date,
        features: [String],
    },
    preferences: {
        learningStyle: {
            type: String,
            enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
            default: 'visual',
        },
        weeklyGoal: {
            type: Number,
            default: 5,
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: false },
        },
    },
    refreshToken: String,
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.tier': 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.refreshToken;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
