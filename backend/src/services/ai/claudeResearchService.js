const ClaudeClient = require('./claudeClient');

/**
 * Dedicated Claude service for heavy research operations.
 * Bypasses Gemini entirely - uses Claude directly as primary provider.
 * Perfect for long-form content generation (literature reviews, research guides).
 */
class ClaudeResearchService {
    constructor() {
        const apiKey = process.env.CLAUDE_API_KEY;
        if (!apiKey) {
            console.warn('[ClaudeResearchService] ⚠️ CLAUDE_API_KEY not configured');
            this.client = null;
        } else {
            try {
                this.client = new ClaudeClient(apiKey);
                console.log('[ClaudeResearchService] ✅ Initialized with Claude API');
            } catch (error) {
                console.error('[ClaudeResearchService] Error initializing Claude:', error.message);
                this.client = null;
            }
        }
    }

    /**
     * Generate research content: literature-review, methodology, or citations.
     * Uses Claude directly - no Gemini fallback.
     * @param {string} topic - Research topic
     * @param {string} type - Type of research (literature-review, methodology, citations)
     * @returns {Promise<{content: string, citations: string[]}>}
     */
    async generateResearch({ topic, type }) {
        if (!this.client) {
            return { error: 'Claude API not configured' };
        }

        const prompts = {
            'literature-review': `You are an expert academic researcher and technical writer.

Conduct a comprehensive literature review on the following topic:
"${topic}"

Structure your response exactly as follows (use these exact headings):

## Overview
Provide a 2-3 paragraph overview of the field, its significance, and current state.

## Key Themes & Research Areas
List and explain 4-6 major themes or research areas within this topic. For each theme, provide 2-3 sentences of explanation.

## Seminal Works & Key Concepts
Describe the foundational concepts, theories, and influential ideas in this field. Reference key conceptual frameworks.

## Recent Developments (${new Date().getFullYear() - 2}–${new Date().getFullYear()})
Highlight the most recent advances, emerging trends, and cutting-edge research directions.

## Research Gaps & Open Problems
Identify 3-5 open questions or under-explored areas that represent opportunities for future research.

## Conclusion
Summarize the state of the field in 2-3 sentences.

Also provide a JSON block at the very end (after "---CITATIONS---") in this exact format, with 6-8 realistic citations:
---CITATIONS---
["Author, A. (Year). Title of Work. Journal/Publisher.", "Author, B. (Year). Another Work. Conference.", ...]`,

            'methodology': `You are an expert research methodologist.

For the research topic: "${topic}"

Provide a comprehensive research methodology guide structured as follows:

## Research Design Options
Describe 3-4 suitable research designs (e.g., experimental, case study, survey, mixed-methods) for this topic. Explain when each is appropriate.

## Data Collection Methods
Explain the most relevant data collection strategies: primary methods (interviews, surveys, experiments, observations) and secondary methods (literature, datasets, APIs).

## Quantitative Approaches
Describe appropriate statistical and quantitative techniques: hypothesis testing, regression analysis, performance benchmarking, etc. Include tools and frameworks.

## Qualitative Approaches
Explain qualitative methods: thematic analysis, grounded theory, case studies. Include tools like NVivo, Atlas.ti where relevant.

## Validation & Reliability
Explain how to ensure validity, reliability, and reproducibility: cross-validation, peer review, dataset splits, ablation studies.

## Ethical Considerations
Highlight ethical concerns: data privacy, bias, consent, reproducibility crisis, responsible AI.

## Recommended Tools & Frameworks
List specific tools, software, libraries, and platforms relevant to researching this topic.

## Step-by-Step Research Plan
Provide a concrete 6-step research plan a student or researcher could follow.`,

            'citations': `You are an expert academic citation generator.

For the research topic: "${topic}"

Generate 12 realistic, well-formatted academic citations covering:
- Foundational papers and textbooks (3-4 citations)
- Recent journal articles (3-4 citations)  
- Conference proceedings (2-3 citations)
- Online resources, documentation, or datasets (2-3 citations)

Return your response in TWO parts:

## Citation Summary
Brief paragraph explaining the citation landscape for this topic and why these sources are valuable.

## Formatted Citations (APA Style)
List all 12 citations in APA 7th edition format, numbered.

## BibTeX Format
Provide the same citations in BibTeX format for LaTeX users.

---CITATIONS---
["Full APA citation 1", "Full APA citation 2", ...]
(Place the JSON array after ---CITATIONS--- for programmatic extraction)`,
        };

        const prompt = prompts[type] || prompts['literature-review'];

        try {
            console.log(`[ClaudeResearchService] Generating ${type} for "${topic}"...`);
            const text = await this.client.generateContent(prompt, 'claude-3-5-sonnet-latest', 120000);

            // Extract citations JSON if present
            let content = text;
            let citations = [];
            if (text.includes('---CITATIONS---')) {
                const parts = text.split('---CITATIONS---');
                content = parts[0].trim();
                try {
                    const citationText = parts[1].trim();
                    citations = JSON.parse(citationText);
                } catch {
                    // Citations extraction failed — leave as empty array
                }
            }

            console.log(`[ClaudeResearchService] ✅ Research (${type}) generated successfully`);
            return { content, citations };
        } catch (error) {
            console.error('[ClaudeResearchService] Error:', error.message || error);
            return { error: 'Research generation failed: ' + (error.message || 'Unknown error') };
        }
    }
}

// Export singleton
module.exports = new ClaudeResearchService();
