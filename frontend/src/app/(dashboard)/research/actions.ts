'use server';

const RESEARCH_PROMPTS: Record<string, (topic: string) => string> = {
    'literature-review': (topic) => `You are an expert academic researcher and technical writer.

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

---CITATIONS---
["Author, A. (Year). Title of Work. Journal/Publisher.", "Author, B. (Year). Another Work. Conference."]
(Provide 6-8 realistic APA citations in the JSON array above)`,

    'methodology': (topic) => `You are an expert research methodologist.

For the research topic: "${topic}"

Provide a comprehensive research methodology guide:

## Research Design Options
Describe 3-4 suitable research designs (experimental, case study, survey, mixed-methods). Explain when each is appropriate.

## Data Collection Methods
Explain primary methods (interviews, surveys, experiments) and secondary methods (literature, datasets, APIs).

## Quantitative Approaches
Describe statistical and quantitative techniques: hypothesis testing, regression, benchmarking. Include tools.

## Qualitative Approaches
Explain qualitative methods: thematic analysis, grounded theory, case studies. Include tools like NVivo.

## Validation & Reliability
Explain validity, reliability, reproducibility: cross-validation, peer review, ablation studies.

## Ethical Considerations
Highlight data privacy, bias, consent, responsible AI, reproducibility.

## Recommended Tools & Frameworks
List specific tools, software, libraries, and platforms relevant to this topic.

## Step-by-Step Research Plan
Provide a concrete 6-step research plan.`,

    'citations': (topic) => `You are an expert academic citation generator.

For the research topic: "${topic}"

Generate 12 realistic, well-formatted academic citations covering:
- Foundational papers and textbooks (3-4 citations)
- Recent journal articles (3-4 citations)
- Conference proceedings (2-3 citations)
- Online resources or datasets (2-3 citations)

## Citation Summary
Brief paragraph explaining the citation landscape for this topic.

## Formatted Citations (APA Style)
List all 12 citations in APA 7th edition format, numbered.

## BibTeX Format
Provide the same citations in BibTeX format for LaTeX users.

---CITATIONS---
["Full APA citation 1", "Full APA citation 2", "Full APA citation 3", "Full APA citation 4", "Full APA citation 5", "Full APA citation 6", "Full APA citation 7", "Full APA citation 8", "Full APA citation 9", "Full APA citation 10", "Full APA citation 11", "Full APA citation 12"]`,
};

async function callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_KEY_1 || process.env.GEMINI_KEY_4 || process.env.GEMINI_RESEARCH_KEY;
    if (!apiKey) throw new Error('Gemini API key not configured. Add GEMINI_KEY_1 to frontend .env.local');

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function runResearch(topic: string, type: string): Promise<{ content: string; citations: string[] }> {
    const validTypes = ['literature-review', 'methodology', 'citations'];
    if (!validTypes.includes(type)) throw new Error('Invalid research type');
    if (!topic.trim()) throw new Error('Topic is required');

    const promptFn = RESEARCH_PROMPTS[type];
    const text = await callGemini(promptFn(topic.trim()));

    let content = text;
    let citations: string[] = [];

    if (text.includes('---CITATIONS---')) {
        const parts = text.split('---CITATIONS---');
        content = parts[0].trim();
        try {
            citations = JSON.parse(parts[1].trim());
        } catch {
            // citations parsing failed, leave empty
        }
    }

    return { content, citations };
}
