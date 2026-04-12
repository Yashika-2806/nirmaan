const dsaService = require('./service');
const ApiResponse = require('../../core/utils/response');
const { asyncHandler } = require('../../core/middleware/error');

class DSAController {
    // Explain problem
    explainProblem = asyncHandler(async (req, res) => {
        const { problemStatement } = req.body;
        const result = await dsaService.explainProblem(problemStatement, req.user.userId);

        ApiResponse.success(res, result, 'Problem explanation generated');
    });

    // Get solution approach
    getSolutionApproach = asyncHandler(async (req, res) => {
        const { problemStatement } = req.body;
        const result = await dsaService.getSolutionApproach(problemStatement, req.user.userId);

        ApiResponse.success(res, result, 'Solution approach generated');
    });

    // Submit solution (legacy endpoint)
    submitSolution = asyncHandler(async (req, res) => {
        const result = await dsaService.submitSolution(req.user.userId, req.body);

        ApiResponse.success(res, result, 'Solution analyzed successfully');
    });

    // Get user analytics
    getUserAnalytics = asyncHandler(async (req, res) => {
        const analytics = await dsaService.getUserAnalytics(req.user.userId);

        ApiResponse.success(res, analytics, 'Analytics retrieved successfully');
    });

    // Get follow-up questions
    getFollowUpQuestions = asyncHandler(async (req, res) => {
        const { problemStatement, difficulty } = req.body;
        const result = await dsaService.getFollowUpQuestions(
            problemStatement,
            difficulty,
            req.user.userId
        );

        ApiResponse.success(res, result, 'Follow-up questions generated');
    });

    // New: Analyze solution with structured interview-ready feedback
    analyzeSolution = asyncHandler(async (req, res) => {
        const { problemTitle, problemDescription, code, language } = req.body;
        const result = await dsaService.analyzeSolutionStructured(
            problemTitle,
            problemDescription,
            code,
            language,
            req.user.userId
        );

        ApiResponse.success(res, result, 'Solution analysis completed');
    });
}

module.exports = new DSAController();
