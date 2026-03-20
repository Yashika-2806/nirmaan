const geminiService = require('../../../core/ai/gemini-service');
const { buildLearningPrompt } = require('../prompts');

class LearningAgent {
    applyWeightUpdates(mapObj, updates = []) {
        const map = new Map(Object.entries(mapObj || {}));
        updates.forEach((update) => {
            const key = String(update.key || '').trim();
            if (!key) return;
            const current = Number(map.get(key) || 0);
            const delta = Math.max(-1, Math.min(1, Number(update.delta || 0)));
            map.set(key, Math.max(-3, Math.min(3, current + delta)));
        });
        return Object.fromEntries(map.entries());
    }

    heuristicLearning(recentOutcomes = []) {
        const roleUpdates = [];
        const skillUpdates = [];

        recentOutcomes.forEach((outcome) => {
            const roleKey = String(outcome.role || '').trim();
            const delta = outcome.status === 'shortlisted' || outcome.status === 'offer' ? 0.35 : outcome.status === 'rejected' ? -0.2 : 0;
            if (roleKey && delta) {
                roleUpdates.push({ key: roleKey, delta });
            }

            (outcome.missingSkills || []).slice(0, 5).forEach((skill) => {
                skillUpdates.push({ key: skill, delta: -0.1 });
            });

            (outcome.matchedSkills || []).slice(0, 5).forEach((skill) => {
                if (outcome.status === 'shortlisted' || outcome.status === 'offer') {
                    skillUpdates.push({ key: skill, delta: 0.15 });
                }
            });
        });

        return {
            roleWeightUpdates: roleUpdates,
            skillWeightUpdates: skillUpdates,
            insights: ['Updated role and skill priors from recent outcomes.'],
        };
    }

    async learn({ profileSignals, recentOutcomes }) {
        const model = geminiService.getModel('general');
        if (!model) {
            return this.heuristicLearning(recentOutcomes);
        }

        try {
            const prompt = buildLearningPrompt({ profileSignals, recentOutcomes });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const parsed = geminiService.safeParseJSONObject(response.text());

            return {
                roleWeightUpdates: Array.isArray(parsed.roleWeightUpdates) ? parsed.roleWeightUpdates : [],
                skillWeightUpdates: Array.isArray(parsed.skillWeightUpdates) ? parsed.skillWeightUpdates : [],
                insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 8) : [],
            };
        } catch (error) {
            return this.heuristicLearning(recentOutcomes);
        }
    }
}

module.exports = new LearningAgent();
