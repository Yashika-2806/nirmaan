const aiKeyService = require('./service');
const ApiResponse = require('../utils/response');
const { asyncHandler } = require('../middleware/error');

class AIKeyController {
    // Add new AI key
    addKey = asyncHandler(async (req, res) => {
        const key = await aiKeyService.addKey(req.body, req.user.userId);
        ApiResponse.created(res, { key }, 'AI key added successfully');
    });

    // Get all keys
    getAllKeys = asyncHandler(async (req, res) => {
        const keys = await aiKeyService.getAllKeys();
        ApiResponse.success(res, { keys, count: keys.length }, 'Keys retrieved successfully');
    });

    // Get key by ID
    getKeyById = asyncHandler(async (req, res) => {
        const key = await aiKeyService.getKeyById(req.params.id);
        ApiResponse.success(res, { key }, 'Key retrieved successfully');
    });

    // Update key
    updateKey = asyncHandler(async (req, res) => {
        const key = await aiKeyService.updateKey(req.params.id, req.body);
        ApiResponse.success(res, { key }, 'Key updated successfully');
    });

    // Toggle key status
    toggleStatus = asyncHandler(async (req, res) => {
        const key = await aiKeyService.toggleKeyStatus(req.params.id);
        ApiResponse.success(res, { key }, 'Key status updated successfully');
    });

    // Delete key
    deleteKey = asyncHandler(async (req, res) => {
        await aiKeyService.deleteKey(req.params.id);
        ApiResponse.success(res, null, 'Key deleted successfully');
    });

    // Get usage statistics
    getUsageStats = asyncHandler(async (req, res) => {
        const stats = await aiKeyService.getUsageStats(req.query);
        ApiResponse.success(res, { stats }, 'Usage statistics retrieved successfully');
    });

    // Get usage by module
    getUsageByModule = asyncHandler(async (req, res) => {
        const stats = await aiKeyService.getUsageByModule();
        ApiResponse.success(res, { stats }, 'Module usage retrieved successfully');
    });

    // Get key performance
    getKeyPerformance = asyncHandler(async (req, res) => {
        const performance = await aiKeyService.getKeyPerformance();
        ApiResponse.success(res, { performance }, 'Key performance retrieved successfully');
    });
}

module.exports = new AIKeyController();
