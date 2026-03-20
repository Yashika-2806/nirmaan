const geminiService = require('../../../core/ai/gemini-service');
const { buildApplyAnswersPrompt } = require('../prompts');

class ApplyAgent {
    fallback(profile, job) {
        const topSkills = (profile.skills || []).slice(0, 5).map((s) => s.name).filter(Boolean).join(', ');
        return {
            whyThisRole: `This ${job.title} role matches my current trajectory and lets me contribute to ${job.company}'s product impact while growing in a high-learning environment.`,
            whyYou: `I bring hands-on execution with ${topSkills || 'full-stack engineering fundamentals'} and a track record of shipping practical project outcomes.`,
            impactStory: 'In recent projects, I identified bottlenecks, delivered structured improvements, and iterated using feedback to improve performance and reliability.',
        };
    }

    async prepareAnswers({ profile, job }) {
        const model = geminiService.getModel('general');
        if (!model) {
            return this.fallback(profile, job);
        }

        try {
            const prompt = buildApplyAnswersPrompt({ profile, job });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const parsed = geminiService.safeParseJSONObject(response.text());

            return {
                whyThisRole: String(parsed.whyThisRole || ''),
                whyYou: String(parsed.whyYou || ''),
                impactStory: String(parsed.impactStory || ''),
            };
        } catch (error) {
            return this.fallback(profile, job);
        }
    }
}

module.exports = new ApplyAgent();
