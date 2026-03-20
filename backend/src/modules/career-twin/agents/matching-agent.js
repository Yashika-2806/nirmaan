const geminiService = require('../../../core/ai/gemini-service');
const { buildMatchingPrompt } = require('../prompts');

class MatchingAgent {
    heuristicMatch(profile, jobs) {
        const profileSkills = new Set((profile.skills || []).map((s) => String(s.name || '').toLowerCase()));

        return jobs.map((job) => {
            const required = (job.requiredSkills || []).map((s) => String(s).toLowerCase());
            const overlap = required.filter((s) => profileSkills.has(s));
            const fitScore = required.length ? Math.round((overlap.length / required.length) * 100) : 55;
            const resumeFitScore = Math.max(40, Math.min(100, fitScore + 5));
            const interviewProbability = Math.max(20, Math.min(95, Math.round((fitScore * 0.75) + 15)));
            const fitCategory = fitScore >= 75 ? 'strong_fit' : fitScore >= 50 ? 'moderate_fit' : 'stretch';

            return {
                jobRef: job.externalId,
                fitScore,
                interviewProbability,
                fitCategory,
                missingSkills: required.filter((s) => !profileSkills.has(s)).slice(0, 8),
                reasoning: [
                    `Skill overlap: ${overlap.length}/${required.length || 1}`,
                    `Role level based on inferred profile maturity`,
                ],
                resumeFitScore,
            };
        }).sort((a, b) => b.fitScore - a.fitScore);
    }

    async rankJobs({ profile, jobs }) {
        const model = geminiService.getModel('general');
        if (!model || jobs.length === 0) {
            return this.heuristicMatch(profile, jobs);
        }

        try {
            const prompt = buildMatchingPrompt({
                profileSummary: {
                    headline: profile.summary?.headline,
                    preferredRoles: profile.summary?.preferredRoles,
                    skills: (profile.skills || []).slice(0, 40),
                    projects: (profile.projects || []).slice(0, 8),
                },
                jobs: jobs.map((job) => ({
                    jobRef: job.externalId,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    workMode: job.workMode,
                    requiredSkills: job.requiredSkills,
                    tags: job.tags,
                })).slice(0, 25),
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const parsed = geminiService.safeParseJSONObject(response.text());
            const rawResults = Array.isArray(parsed.results) ? parsed.results : [];

            if (!rawResults.length) {
                return this.heuristicMatch(profile, jobs);
            }

            return rawResults.map((item) => ({
                jobRef: String(item.jobRef || ''),
                fitScore: Math.max(0, Math.min(100, Number(item.fitScore || 0))),
                interviewProbability: Math.max(0, Math.min(100, Number(item.interviewProbability || 0))),
                fitCategory: ['strong_fit', 'moderate_fit', 'stretch'].includes(item.fitCategory) ? item.fitCategory : 'moderate_fit',
                missingSkills: Array.isArray(item.missingSkills) ? item.missingSkills.slice(0, 10) : [],
                reasoning: Array.isArray(item.reasoning) ? item.reasoning.slice(0, 4) : [],
                resumeFitScore: Math.max(0, Math.min(100, Number(item.resumeFitScore || 0))),
            })).sort((a, b) => b.fitScore - a.fitScore);
        } catch (error) {
            return this.heuristicMatch(profile, jobs);
        }
    }
}

module.exports = new MatchingAgent();
