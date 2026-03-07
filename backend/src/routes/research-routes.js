const express = require('express');
const router = express.Router();
const geminiService = require('../core/ai/gemini-service');
const { protect } = require('../core/auth/middleware');

const VALID_TYPES = ['literature-review', 'methodology', 'citations'];

router.post('/:type', protect, async (req, res) => {
    try {
        const { type } = req.params;
        const { topic } = req.body;

        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid research type. Must be: literature-review, methodology, or citations' });
        }
        if (!topic || !topic.trim()) {
            return res.status(400).json({ success: false, message: 'Topic is required' });
        }

        const result = await geminiService.generateResearch({ topic: topic.trim(), type });

        if (result.error) {
            return res.status(503).json({ success: false, message: result.error });
        }

        return res.json({ success: true, data: result });
    } catch (error) {
        console.error('[ResearchRoutes] Error:', error);
        return res.status(500).json({ success: false, message: 'Research generation failed' });
    }
});

module.exports = router;
