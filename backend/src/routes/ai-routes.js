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

const axios = require('axios');

/**
 * @desc Generate speech audio from text using Sarvam AI
 * @route POST /api/ai/tts
 * @access Private
 */
router.post('/tts', protect, async (req, res) => {
    try {
        const { text, language } = req.body;

        if (!text || !language) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const apiKey = process.env.SARVAM_API_KEY;
        if (!apiKey) {
            return res.status(400).json({ 
                success: false, 
                error: 'Sarvam API key is not configured on the server.' 
            });
        }

        // Map language
        let targetLanguageCode = 'hi-IN';
        let speaker = 'anushka'; // or 'shubh' for male
        
        if (language === 'hi') {
            targetLanguageCode = 'hi-IN';
            speaker = 'anushka';
        } else if (language === 'hinglish') {
            targetLanguageCode = 'hi-IN'; // bulbul:v3 supports Hinglish code-switching in hi-IN
            speaker = 'shubh';
        } else {
            targetLanguageCode = 'en-IN';
            speaker = 'anushka';
        }

        const response = await axios.post('https://api.sarvam.ai/text-to-speech', {
            text: text,
            target_language_code: targetLanguageCode,
            speaker: speaker,
            model: 'bulbul:v3'
        }, {
            headers: {
                'api-subscription-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.audios && response.data.audios[0]) {
            return res.status(200).json({
                success: true,
                audioBase64: response.data.audios[0]
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'Invalid response from Sarvam AI speech service'
            });
        }

    } catch (error) {
        console.error('[AI TTS] Error generating speech:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || 'Failed to generate speech using Sarvam AI'
        });
    }
});

module.exports = router;
