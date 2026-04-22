const interviewService = require('./service');
const ApiResponse = require('../../core/utils/response');

const interviewController = {
    async startSession(req, res, next) {
        try {
            const { company, role, round, experienceLevel, count } = req.body;
            const session = await interviewService.startSession({
                userId: req.user.userId,
                company,
                role,
                round: round || 'technical',
                experienceLevel: experienceLevel || 'mid',
                count: count || 8,
            });
            return ApiResponse.created(res, session.toObject(), 'Interview session started');
        } catch (err) {
            next(err);
        }
    },

    async evaluateAnswer(req, res, next) {
        try {
            const { sessionId, questionIndex, answer } = req.body;
            const result = await interviewService.evaluateAnswer({
                sessionId,
                userId: req.user.userId,
                questionIndex,
                answer,
            });
            return ApiResponse.success(res, result, 'Answer evaluated');
        } catch (err) {
            next(err);
        }
    },

    async completeSession(req, res, next) {
        try {
            const { sessionId, durationSeconds } = req.body;
            const session = await interviewService.completeSession({
                sessionId,
                userId: req.user.userId,
                durationSeconds,
            });
            return ApiResponse.success(res, session, 'Session completed');
        } catch (err) {
            next(err);
        }
    },

    async getSessions(req, res, next) {
        try {
            const sessions = await interviewService.getSessions(req.user.userId);
            return ApiResponse.success(res, sessions, 'Sessions fetched');
        } catch (err) {
            next(err);
        }
    },

    async getSession(req, res, next) {
        try {
            const session = await interviewService.getSession(req.params.id, req.user.userId);
            return ApiResponse.success(res, session, 'Session fetched');
        } catch (err) {
            next(err);
        }
    },

    async deleteSession(req, res, next) {
        try {
            await interviewService.deleteSession(req.params.id, req.user.userId);
            return ApiResponse.success(res, null, 'Session deleted');
        } catch (err) {
            next(err);
        }
    },

    async checkPlagiarism(req, res, next) {
        try {
            const { question, answer } = req.body;
            const geminiService = require('../../core/ai/gemini-service');
            const result = await geminiService.checkAnswerOriginality({ question, answer });
            return ApiResponse.success(res, result, 'Plagiarism check complete');
        } catch (err) {
            next(err);
        }
    },

    /**
     * Evaluate submitted code using AI and return rich, verdict-specific feedback.
     * POST /api/interview/evaluate-code
     */
    async evaluateCode(req, res, next) {
        try {
            const { code, language, verdict, errorOutput, question, testResults, executionTime, memory } = req.body;
            const geminiService = require('../../core/ai/gemini-service');

            const passedCount = (testResults || []).filter(t => t.passed).length;
            const totalCount = (testResults || []).length;

            // Build a focused prompt based on what actually happened
            let verdictContext = '';
            if (verdict === 'Compilation Error') {
                verdictContext = `The code FAILED to compile. Compile error:\n${errorOutput}`;
            } else if (verdict === 'Runtime Error') {
                verdictContext = `The code compiled but crashed at runtime. Runtime error:\n${errorOutput}`;
            } else if (verdict === 'Wrong Answer') {
                const failedCases = (testResults || []).filter(t => !t.passed);
                const caseSummary = failedCases.slice(0, 3).map(t =>
                    `  Input: ${t.input} | Expected: ${t.expected} | Got: ${t.got}`
                ).join('\n');
                verdictContext = `The code ran successfully but produced WRONG OUTPUT.\nFailed test cases:\n${caseSummary}`;
            } else if (verdict === 'Accepted') {
                verdictContext = `The code ran correctly and passed ${passedCount}/${totalCount} test cases.${executionTime && executionTime !== '--' ? ` Runtime: ${executionTime}s.` : ''}${memory && memory !== '--' ? ` Memory: ${memory}.` : ''}`;
            } else {
                verdictContext = `Verdict: ${verdict}. ${errorOutput || ''}`;
            }

            const prompt = `You are an expert FAANG-level technical interviewer evaluating a candidate's code submission during a coding interview.

PROBLEM: ${question || 'A coding interview problem (no problem statement provided).'}
LANGUAGE: ${language}
VERDICT: ${verdict}

EXECUTION RESULT:
${verdictContext}

SUBMITTED CODE:
\`\`\`${language}
${code.substring(0, 8000)}
\`\`\`

Your task is to produce a structured, actionable code review as a senior interviewer would. Be specific — reference exact lines, variable names, and the actual error message when available.

Return STRICT JSON (no markdown, no backticks, no explanation outside JSON):
{
  "verdict": "${verdict}",
  "overallAssessment": "2-3 sentence overall assessment of the submission quality",
  "errorAnalysis": ${verdict !== 'Accepted' ? '"Specific, line-by-line explanation of what caused the error and how to fix it. Reference the actual error message."' : '"null — code is correct"'},
  "fix": ${verdict !== 'Accepted' ? '"Concrete corrected code snippet or pseudocode showing the fix"' : 'null'},
  "strengths": ["What is good about this code — even if it has errors"],
  "improvements": ["Specific, actionable improvements even for accepted code"],
  "timeComplexity": "Big-O time complexity of this solution (e.g. O(n))",
  "spaceComplexity": "Big-O space complexity (e.g. O(n))",
  "optimalApproach": "1-2 sentence description of the optimal approach for this problem (e.g. using a hash map for O(n) lookup)",
  "interviewerFollowUp": "One natural follow-up question a real interviewer would ask next",
  "score": <integer 0-100 based on correctness, efficiency, and code quality>
}`;

            const model = geminiService.getModel('interview');
            const result = await model.generateContent(prompt, { timeoutMs: 45000 });
            const text = result.response.text();

            const { safeParseAIJson } = require('../../core/utils/safeJsonParser');
            const parsed = safeParseAIJson(text, 'object');

            if (parsed.ok) {
                return ApiResponse.success(res, parsed.data, 'Code evaluated');
            } else {
                // Fallback: return a minimal structured response
                return ApiResponse.success(res, {
                    verdict,
                    overallAssessment: verdict === 'Accepted'
                        ? 'Your solution passed the test cases. Review the complexity analysis for optimization opportunities.'
                        : `Your code returned a ${verdict}. Review the error carefully and fix the logic.`,
                    errorAnalysis: errorOutput || null,
                    fix: null,
                    strengths: ['Code was submitted for evaluation'],
                    improvements: ['Review error output carefully', 'Test edge cases manually'],
                    timeComplexity: 'Unknown',
                    spaceComplexity: 'Unknown',
                    optimalApproach: 'Use a hash map for O(n) time complexity.',
                    interviewerFollowUp: 'Walk me through your approach step by step.',
                    score: verdict === 'Accepted' ? 70 : 30,
                }, 'Code evaluated (fallback)');
            }
        } catch (err) {
            next(err);
        }
    },
};

module.exports = interviewController;
