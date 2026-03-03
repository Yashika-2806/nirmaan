const jwt = require('jsonwebtoken');
const User = require('./model');
const config = require('../../config/env');
const { AppError } = require('../middleware/error');
const { ERROR_CODES } = require('../../config/constants');

class AuthService {
    // Generate JWT tokens
    generateTokens(userId) {
        const accessToken = jwt.sign(
            { userId },
            config.jwt.secret,
            { expiresIn: config.jwt.expire }
        );

        const refreshToken = jwt.sign(
            { userId },
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpire }
        );

        return { accessToken, refreshToken };
    }

    // Register new user
    async register(userData) {
        const { email, password, name } = userData;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('Email already registered', 409, ERROR_CODES.VALIDATION_ERROR);
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name,
        });

        // Generate tokens
        const tokens = this.generateTokens(user._id);

        // Save refresh token
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return {
            user,
            tokens,
        };
    }

    // Login user
    async login(email, password) {
        // Find user with password
        const user = await User.findOne({ email }).select('+password');

        if (!user || !user.isActive) {
            throw new AppError('Invalid credentials', 401, ERROR_CODES.AUTHENTICATION_ERROR);
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401, ERROR_CODES.AUTHENTICATION_ERROR);
        }

        // Generate tokens
        const tokens = this.generateTokens(user._id);

        // Save refresh token
        user.refreshToken = tokens.refreshToken;
        await user.save();

        // Remove password from response
        user.password = undefined;

        return {
            user,
            tokens,
        };
    }

    // Refresh access token
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

            const user = await User.findById(decoded.userId);
            if (!user || user.refreshToken !== refreshToken) {
                throw new AppError('Invalid refresh token', 401, ERROR_CODES.AUTHENTICATION_ERROR);
            }

            const tokens = this.generateTokens(user._id);

            user.refreshToken = tokens.refreshToken;
            await user.save();

            return tokens;
        } catch (error) {
            throw new AppError('Invalid refresh token', 401, ERROR_CODES.AUTHENTICATION_ERROR);
        }
    }

    // Logout user
    async logout(userId) {
        await User.findByIdAndUpdate(userId, { refreshToken: null });
    }

    // Get user by ID
    async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
        }
        return user;
    }

    // Update user profile
    async updateProfile(userId, updates) {
        const allowedUpdates = ['name', 'profile', 'preferences'];
        const filteredUpdates = {};

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            userId,
            filteredUpdates,
            { new: true, runValidators: true }
        );

        if (!user) {
            throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
        }

        return user;
    }
}

module.exports = new AuthService();
