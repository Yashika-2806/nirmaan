
const express = require('express');
const router = express.Router();
const { protect } = require('../../core/auth/middleware');
const {
    getResumes,
    getResume,
    createResume,
    updateResume,
    deleteResume,
    generateResume,
    analyzeResume,
    regenerateSummary
} = require('./controller');

// Protect all routes
router.use(protect);

router.route('/generate').post(generateResume);
router.route('/analyze').post(analyzeResume);
router.route('/regenerate-summary').post(regenerateSummary);

router
    .route('/')
    .get(getResumes)
    .post(createResume);

router
    .route('/:id')
    .get(getResume)
    .put(updateResume)
    .delete(deleteResume);

module.exports = router;
