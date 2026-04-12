const express = require('express');
const router = express.Router();
const geminiService = require('../core/ai/gemini-service');
const { protect } = require('../core/auth/middleware');

/**
 * @desc Get AI feedback on a user's DSA problem-solving approach
 * @route POST /api/ai/review
 * @access Private
 */
router.post('/review', protect, async (req, res) => {
    try {
        const { questionTitle, userAnswer, currentQuestion } = req.body;

        if (!questionTitle || !userAnswer || !currentQuestion) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        try {
            const feedback = await geminiService.generateFeedback(questionTitle, userAnswer, currentQuestion);

            // Check if feedback is an error string from the service
            if (typeof feedback === 'string' && feedback.startsWith('AI Service Error:')) {
                console.error('[AI Review] Service returned error:', feedback);
                return res.status(503).json({
                    success: false,
                    error: feedback
                });
            }

            res.status(200).json({
                success: true,
                feedback: feedback
            });
        } catch (serviceError) {
            console.error('[AI Review] Service error:', serviceError.message);
            return res.status(503).json({
                success: false,
                error: `AI Service Error: ${serviceError.message || 'Unable to generate feedback. Please try again shortly.'}`
            });
        }

    } catch (error) {
        console.error('[AI Review] Unexpected error:', error.message || error);
        res.status(500).json({
            success: false,
            error: 'AI service encountered an unexpected error. Please try again.'
        });
    }
});

module.exports = router;
