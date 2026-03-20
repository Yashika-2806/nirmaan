const geminiService = require('../../../core/ai/gemini-service');
const { buildTailoredResumePrompt } = require('../prompts');

class ResumeAgent {
    fallback(profile, job) {
        const topSkills = (profile.skills || []).slice(0, 6).map((s) => s.name).filter(Boolean);
        const bullets = (profile.projects || []).slice(0, 3).map((p) => `Built ${p.name || 'project'} using ${(p.technologies || []).slice(0, 3).join(', ') || 'modern tools'} to deliver ${p.impact || 'measurable outcomes'}.`);

        return {
            summary: `${profile.summary?.headline || 'Software engineering candidate'} aligned for ${job.title} at ${job.company}.`,
            bullets: bullets.length ? bullets : ['Built production-focused projects and delivered iterative improvements across the stack.'],
            atsKeywords: [...new Set([...(job.requiredSkills || []).slice(0, 10), ...topSkills])],
            resumeFitScore: 65,
            projectOrder: (profile.projects || []).map((p) => p.name).filter(Boolean),
        };
    }

    async generateTailoredResume({ profile, job }) {
        const model = geminiService.getModel('resume');
        if (!model) {
            return this.fallback(profile, job);
        }

        try {
            const prompt = buildTailoredResumePrompt({ profile, job });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const parsed = geminiService.safeParseJSONObject(response.text());

            return {
                summary: String(parsed.summary || ''),
                bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 8) : [],
                atsKeywords: Array.isArray(parsed.atsKeywords) ? parsed.atsKeywords.slice(0, 20) : [],
                resumeFitScore: Math.max(0, Math.min(100, Number(parsed.resumeFitScore || 0))),
                projectOrder: Array.isArray(parsed.projectOrder) ? parsed.projectOrder.slice(0, 12) : [],
            };
        } catch (error) {
            return this.fallback(profile, job);
        }
    }
}

module.exports = new ResumeAgent();
