const geminiService = require('../../../core/ai/gemini-service');

/**
 * InterviewAgent — multi-turn AI mock interview session manager.
 *
 * Follows the same singleton-class pattern as all other Career Twin agents.
 * Uses GEMINI_KEY_2 (interview key) via geminiService.getModel('interview').
 */
class InterviewAgent {
    /**
     * Build the system persona prompt injected at the top of every session.
     */
    _buildSystemPersona(jobTitle) {
        return `You are Alex, a senior technical interviewer at a top-tier tech company.
You are conducting a mock interview for a ${jobTitle} position.
Your style: professional, encouraging, technically rigorous.
Rules:
- Ask ONE question at a time.
- After the candidate responds, provide 1-2 sentences of feedback (what was good / what was missing), then ask the NEXT question.
- Keep each response to 3-5 sentences maximum.
- Do NOT say "As an AI" or mention being a language model.
- Vary question types: technical, behavioral, situational, system design.`;
    }

    /**
     * Generate the opening question for a new interview session.
     * @param {object} params
     * @param {string} params.jobTitle
     * @param {string[]} [params.skills] - top skills from user profile
     * @returns {Promise<{ question: string, hint: string }>}
     */
    async startSession({ jobTitle, skills = [] }) {
        const model = geminiService.getModel('interview');

        const skillsText = skills.length > 0
            ? `The candidate's top skills are: ${skills.slice(0, 6).join(', ')}.`
            : '';

        const openingPrompt = `${this._buildSystemPersona(jobTitle)}

${skillsText}

Start the interview NOW. Introduce yourself briefly (1 sentence) and ask a strong opening question for a ${jobTitle} interview.
Do NOT list multiple questions. Ask only ONE question.`;

        if (!model) {
            return {
                question: `Hi! I'm Alex, your interviewer today. Let's start with a classic: Can you walk me through your background and what excites you most about the ${jobTitle} role?`,
                hint: 'Opening question',
            };
        }

        try {
            const result = await model.generateContent(openingPrompt);
            const text = result.response.text().trim();
            return { question: text, hint: 'Opening question' };
        } catch (error) {
            return {
                question: `Hi! I'm Alex. Let's start — can you walk me through your background and what draws you to the ${jobTitle} role?`,
                hint: 'Opening question (fallback)',
            };
        }
    }

    /**
     * Multi-turn interview chat. Sends full history to Gemini for context-aware response.
     * @param {object} params
     * @param {string} params.jobTitle
     * @param {Array<{role: 'user'|'interviewer', message: string}>} params.history
     * @param {string} params.userMessage - the latest candidate response
     * @returns {Promise<{ text: string, turnCount: number }>}
     */
    async chat({ jobTitle, history = [], userMessage }) {
        const model = geminiService.getModel('interview');

        // Build a flattened conversation string for Gemini context
        const conversationLog = history.map((turn) => {
            const speaker = turn.role === 'user' ? 'Candidate' : 'Interviewer (Alex)';
            return `${speaker}: ${turn.message}`;
        }).join('\n\n');

        const prompt = `${this._buildSystemPersona(jobTitle)}

--- CONVERSATION SO FAR ---
${conversationLog || '[Interview just started]'}

--- LATEST CANDIDATE RESPONSE ---
Candidate: ${userMessage}

--- YOUR TASK ---
Respond as Interviewer Alex. Give brief feedback on the candidate's answer (1-2 sentences), then ask the next interview question. Remember: ONE question only, 3-5 sentences total.

Interviewer (Alex):`;

        if (!model) {
            return {
                text: `That's an interesting perspective! Let me ask you a follow-up: Tell me about a technically challenging project you've worked on recently and how you approached the problem.`,
                turnCount: history.length + 1,
            };
        }

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            return {
                text,
                turnCount: history.length + 1,
            };
        } catch (error) {
            if (error.status === 429 || String(error.message).includes('429')) {
                return {
                    text: `Great response! We've covered a lot of ground today. As a final question: What's one thing you'd want to improve about yourself as an engineer, and how are you working on it?`,
                    turnCount: history.length + 1,
                    rateLimited: true,
                };
            }
            throw error;
        }
    }

    /**
     * Evaluate the complete interview session and produce structured feedback.
     * @param {object} params
     * @param {string} params.jobTitle
     * @param {Array<{role: 'user'|'interviewer', message: string}>} params.history
     * @returns {Promise<InterviewEvaluation>}
     */
    async evaluate({ jobTitle, history = [] }) {
        const model = geminiService.getModel('interview');

        const candidateAnswers = history
            .filter((t) => t.role === 'user')
            .map((t, i) => `Q${i + 1}: ${t.message}`)
            .join('\n\n');

        if (!candidateAnswers) {
            return this._fallbackEvaluation(jobTitle);
        }

        const prompt = `You are an expert career coach evaluating a mock interview for a ${jobTitle} role.

CANDIDATE ANSWERS:
${candidateAnswers}

Evaluate the candidate's overall interview performance. Return ONLY valid JSON (no markdown, no backticks):
{
  "overallScore": <integer 0-100>,
  "verdict": "Excellent" | "Good" | "Average" | "Needs Work",
  "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "improvements": ["Specific gap 1", "Specific gap 2", "Specific gap 3"],
  "starMoments": ["Best answer or moment from the interview"],
  "nextSteps": ["Actionable tip 1", "Actionable tip 2"]
}`;

        if (!model) {
            return this._fallbackEvaluation(jobTitle);
        }

        try {
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(text);
            return {
                overallScore: Number(parsed.overallScore) || 60,
                verdict: parsed.verdict || 'Average',
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : [],
                improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 4) : [],
                starMoments: Array.isArray(parsed.starMoments) ? parsed.starMoments.slice(0, 3) : [],
                nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.slice(0, 3) : [],
            };
        } catch (error) {
            return this._fallbackEvaluation(jobTitle);
        }
    }

    /**
     * Transcribe audio using Gemini's native audio understanding.
     * Accepts a Buffer with raw audio bytes and a mime type.
     * @param {Buffer} audioBuffer
     * @param {string} mimeType - e.g. 'audio/webm', 'audio/wav'
     * @returns {Promise<{ text: string, success: boolean }>}
     */
    async transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
        const model = geminiService.getModel('interview');

        if (!model || !audioBuffer || audioBuffer.length === 0) {
            return { text: '', success: false };
        }

        const base64Audio = audioBuffer.toString('base64');

        // Use Gemini's multimodal capability to transcribe audio
        const prompt = [
            {
                inlineData: {
                    mimeType,
                    data: base64Audio,
                },
            },
            'Transcribe the speech in this audio file. Return ONLY the transcribed text with no commentary, labels, or punctuation formatting. If no speech is detected, return an empty string.',
        ];

        try {
            // Direct Gemini SDK call for multimodal (the facade in gemini-service only supports text)
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const apiKey = process.env.GEMINI_KEY_2 || process.env.GEMINI_KEY_1;
            if (!apiKey) return { text: '', success: false };

            const genAI = new GoogleGenerativeAI(apiKey);
            const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await geminiModel.generateContent(prompt);
            const text = result.response.text().trim();
            return { text, success: !!text };
        } catch (error) {
            return { text: '', success: false };
        }
    }

    _fallbackEvaluation(jobTitle) {
        return {
            overallScore: 65,
            verdict: 'Good',
            strengths: [
                'Completed the full interview session',
                `Showed interest in the ${jobTitle} role`,
                'Communicated responses clearly',
            ],
            improvements: [
                'Quantify achievements with specific metrics',
                'Use the STAR method for behavioral questions',
                'Prepare examples of technical problem-solving',
            ],
            starMoments: ['Engaged consistently throughout the session'],
            nextSteps: [
                'Practice answering questions with specific data points',
                'Research the company before your real interview',
            ],
        };
    }
}

module.exports = new InterviewAgent();
