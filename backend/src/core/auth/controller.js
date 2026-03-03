const authService = require('./service');
const ApiResponse = require('../utils/response');
const { asyncHandler } = require('../middleware/error');

class AuthController {
    // Register new user
    register = asyncHandler(async (req, res) => {
        const result = await authService.register(req.body);

        ApiResponse.created(res, result, 'User registered successfully');
    });

    // Login user
    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const result = await authService.login(email, password);

        ApiResponse.success(res, result, 'Login successful');
    });

    // Refresh access token
    refreshToken = asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshToken(refreshToken);

        ApiResponse.success(res, tokens, 'Token refreshed successfully');
    });

    // Logout user
    logout = asyncHandler(async (req, res) => {
        await authService.logout(req.user.userId);

        ApiResponse.success(res, null, 'Logout successful');
    });

    // Get current user
    me = asyncHandler(async (req, res) => {
        const user = await authService.getUserById(req.user.userId);

        ApiResponse.success(res, { user }, 'User retrieved successfully');
    });

    // Update profile
    updateProfile = asyncHandler(async (req, res) => {
        const user = await authService.updateProfile(req.user.userId, req.body);

        ApiResponse.success(res, { user }, 'Profile updated successfully');
    });
}

module.exports = new AuthController();
