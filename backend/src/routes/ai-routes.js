const express = require('express');
const router = express.Router();
const geminiService = require('../core/ai/gemini-service');
const { protect } = require('../core/auth/middleware');

/**
 * @desc Get AI feedback on a user's DSA problem-solving approach
 * @route POST /api/ai/review
 * @access Private
 */
// router.post('/review', protect, async (req, res) => {
router.post('/review', protect, async (req, res) => {
    // router.post('/review', async (req, res) => {
    try {
        const { questionTitle, userAnswer, currentQuestion } = req.body;

        if (!questionTitle || !userAnswer || !currentQuestion) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const feedback = await geminiService.generateFeedback(questionTitle, userAnswer, currentQuestion);

        res.status(200).json({
            success: true,
            feedback: feedback
        });

    } catch (error) {
        console.error('AI Review Error:', error);
        res.status(500).json({
            success: false,
            error: 'AI service unavailable'
        });
    }
});

module.exports = router;
