const geminiService = require('../../../core/ai/gemini-service');
const { buildProfileParsePrompt } = require('../prompts');

class ProfileAgent {
    parseFallback({ resumeText = '', preferences = {} }) {
        const words = String(resumeText).toLowerCase();
        const seedSkills = ['javascript', 'typescript', 'node.js', 'react', 'mongodb', 'python', 'sql', 'aws'];
        const skills = seedSkills
            .filter((skill) => words.includes(skill.replace('.', '')) || words.includes(skill))
            .map((name) => ({ name, level: 55, years: 1, source: 'resume' }));

        return {
            headline: preferences?.headline || 'Early-career software engineer',
            preferredRoles: preferences?.preferredRoles || ['Software Engineer Intern'],
            preferredLocations: preferences?.preferredLocations || ['Remote'],
            workMode: preferences?.workMode || 'any',
            strengths: ['Problem solving', 'Learning agility', 'Execution'],
            skills,
            projects: [],
            experiences: [],
        };
    }

    buildSkillGraph(skills = []) {
        const nodes = skills.map((s) => ({
            name: s.name,
            level: Math.max(0, Math.min(100, Number(s.level || 0))),
            source: s.source || 'resume',
            years: Math.max(0, Number(s.years || 0)),
        }));

        const edges = [];
        for (let i = 0; i < nodes.length - 1; i += 1) {
            edges.push({
                from: nodes[i].name,
                to: nodes[i + 1].name,
                relation: 'related_to',
                weight: 0.4,
            });
        }

        return { nodes, edges };
    }

    async parseResume({ resumeText, preferences }) {
        const model = geminiService.getModel('resume');
        if (!model) {
            const fallback = this.parseFallback({ resumeText, preferences });
            return { ...fallback, skillsGraph: this.buildSkillGraph(fallback.skills) };
        }

        try {
            const prompt = buildProfileParsePrompt({ resumeText, preferences });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const parsed = geminiService.safeParseJSONObject(response.text());

            const payload = {
                headline: String(parsed.headline || ''),
                preferredRoles: Array.isArray(parsed.preferredRoles) ? parsed.preferredRoles.slice(0, 8) : [],
                preferredLocations: Array.isArray(parsed.preferredLocations) ? parsed.preferredLocations.slice(0, 8) : [],
                workMode: ['remote', 'hybrid', 'onsite', 'any'].includes(parsed.workMode) ? parsed.workMode : 'any',
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 8) : [],
                skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 50) : [],
                projects: Array.isArray(parsed.projects) ? parsed.projects.slice(0, 20) : [],
                experiences: Array.isArray(parsed.experiences) ? parsed.experiences.slice(0, 20) : [],
            };

            return { ...payload, skillsGraph: this.buildSkillGraph(payload.skills) };
        } catch (error) {
            const fallback = this.parseFallback({ resumeText, preferences });
            return { ...fallback, skillsGraph: this.buildSkillGraph(fallback.skills) };
        }
    }
}

module.exports = new ProfileAgent();
