
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

/**
 * Service to interact with Google Gemini AI
 * Manages multiple API keys for different microservices/features
 * Optimized for robustness and strict/professional feedback.
 */
class GeminiService {
    constructor() {
        console.log("Initializing Gemini Service...");

        // Define keys with mapping
        this.keys = {
            dsa: process.env.GEMINI_KEY_1,
            interview: process.env.GEMINI_KEY_2,
            resume: process.env.GEMINI_KEY_3,
            roadmap: process.env.GEMINI_KEY_4,
            skills: process.env.GEMINI_KEY_5,
            general: process.env.GEMINI_KEY_6 || process.env.GEMINI_KEY_1
        };

        // Check DSA Key specifically since it's critical for current task
        if (!this.keys.dsa) {
            console.error("❌ CRITICAL: GEMINI_KEY_1 is missing in environment variables.");
        } else {
            console.log("✅ DSA API Key Loaded Successfully");
        }

        this.models = {};
    }

    /**
     * Get the appropriate model for a specific feature
     * @param {string} feature - The feature identifier (dsa, interview, resume, etc.)
     */
    getModel(feature = 'general') {
        const key = this.keys[feature] || this.keys.general;

        if (!key) {
            console.warn(`[GeminiService] No API key found for feature: ${feature}`);
            return null; // Will trigger fallback error handled in caller
        }

        if (!this.models[feature]) {
            try {
                const genAI = new GoogleGenerativeAI(key);
                // Using 'gemini-2.5-flash' as per available models for this key/region (2026)
                this.models[feature] = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                console.log(`[GeminiService] Model initialized for feature: ${feature} (gemini-2.5-flash)`);
            } catch (error) {
                console.error(`[GeminiService] Failed to initialize model for feature ${feature}:`, error);
                return null;
            }
        }

        return this.models[feature];
    }

    /**
     * Generates strict, professional feedback for DSA answers.
     * Uses GEMINI_KEY_1 (DSA Microservice)
     */
    async generateFeedback(questionTitle, userResponse, contextQuestion) {
        console.log(`[GeminiService] Generating feedback for "${questionTitle}"...`);

        const model = this.getModel('dsa');

        if (!model) {
            console.error("[GeminiService] Model creation failed for DSA - Missing Key.");
            return "Configuration Error: AI Service Key (GEMINI_KEY_1) is missing from backend. Please ask the administrator to check server logs.";
        }

        try {
            // Enhanced Prompt for Professionalism and Accuracy
            const prompt = `
            ROLE: You are a Senior Technical Interviewer at a top-tier tech company (e.g., Google, Meta). 
            Your goal is to evaluate a candidate's response to a Data Structures and Algorithms (DSA) interview question.

            CONTEXT:
            - Problem: "${questionTitle}"
            - Interview Question: "${contextQuestion}"
            - Candidate's Answer: "${userResponse}"

            TASK:
            1. Analyze the candidate's answer for accuracy, clarity, and depth.
            2. Determine if the logic is correct.
            3. Identify any missing edge cases or potential optimizations.

            OUTPUT STRUCTURE (Strictly follow these 4 sections):
            1. **Validation:** Briefly acknowledge the user's approach. Is it correct? Partially correct?
            2. **Analysis:** Deep dive into why it works or fails. Mention logic gaps or edge cases.
            3. **Alternatives:** Suggest the optimal approach (e.g. Hash Map for Two Sum).
            4. **Complexity Comparison:** Compare Time/Space complexity of User's approach vs Optimal approach. Use Big O notation.

            OUTPUT GUIDELINES:
            - **Tone:** Professional, encouraging, but technically rigorous. Like a senior mentor.
            - **Format:** Use clear paragraphs. Use **bold** for key terms.
            - Do NOT say "As an AI..." or "Here is your feedback:". Start directly with "Validation: ...".
            
            FEEDBACK:
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log("[GeminiService] Feedback generated successfully.");
            return text;

        } catch (error) {
            console.error("Gemini AI API Error:", error);

            // Log full error to file for debugging
            try {
                const logPath = path.join(process.cwd(), 'gemini-errors.log');
                const logEntry = `[${new Date().toISOString()}] ERROR: ${error.message}\nSTACK: ${error.stack}\n---\n`;
                fs.writeFileSync(logPath, logEntry, { flag: 'a' });
            } catch (e) {
                console.error("Failed to write to gemini-errors.log", e);
            }

            // Detailed Error Mapping
            const errorMsg = error.toString();

            if (errorMsg.includes('API key not valid')) {
                return "Authentication Error: The configured AI API Key is invalid. Please check backend settings.";
            }

            if (errorMsg.includes('429')) {
                return "Service Busy: I'm currently handling too many requests. Please try again in 30 seconds.";
            }

            if (errorMsg.includes('User location is not supported')) {
                return "Region Error: AI Service is currently unavailable in this server region.";
            }

            if (errorMsg.includes('quota')) {
                return "Quota Exceeded: The AI service has reached its usage limit for today.";
            }

            if (errorMsg.includes('candidate')) {
                return "Safety Filter: Your response triggered a safety filter. Please try rephrasing.";
            }

            return `Connection Error: ${error.message || "Unknown error"}. Please check gemini-errors.log for details.`;
        }

    }

    /**
     * Generates a structured Resume JSON from aggregated raw profile data.
     * Use GEMINI_KEY_3 (Resume Service)
     */
    async generateResumeContent(aggregatedText) {
        console.log(`[GeminiService] Generating resume from profile data...`);
        const model = this.getModel('resume'); // Use resume key

        if (!model) {
            return { error: "Configuration Error: AI Service Key (GEMINI_KEY_3) is missing." };
        }

        try {
            const prompt = `
            You are a senior FAANG technical recruiter + professional resume writer with 15+ years of experience.

            Your task is to transform the raw developer data below into a POWERFUL, ATS-optimized, impact-driven resume for a Software Development Engineer / AI Engineer position.

            INPUT DATA:
            ${aggregatedText.substring(0, 40000)}

            ═══════════════════════════════════════════════════════════════════════
            ⚠️  ABSOLUTE RULE #0 — NO HALLUCINATION (READ FIRST, MOST IMPORTANT):
            ═══════════════════════════════════════════════════════════════════════
            You MUST ONLY use information that is EXPLICITLY present in the INPUT DATA above.
            - DO NOT infer, guess, assume, fabricate, or "fill in" any details.
            - DO NOT add fake metrics (e.g., "10K users", "40% faster") unless the number appears in the input.
            - DO NOT add fake technologies, degrees, companies, or dates not found in the input.
            - If a field (e.g., education school name, GPA, certification) is NOT in the input data, set it to "Not Found" or leave the array empty.
            - If LinkedIn sections returned "[LinkedIn requires login]" or are empty — treat that section as having NO data. Do NOT guess content.
            - Prefer writing nothing over writing something invented.
            ═══════════════════════════════════════════════════════════════════════

            ═══════════════════════════════════════════════════════════════════════
            STRICT RULES - FOLLOW EXACTLY:
            ═══════════════════════════════════════════════════════════════════════

            1. REMOVE WEAK PHRASES COMPLETELY:
               ❌ "Highly motivated"
               ❌ "Aspiring"
               ❌ "Eager to"
               ❌ "Possessing"
               ❌ "Seeking opportunity"
               ❌ "Passionate about"
               ❌ "Enthusiastic"
               ❌ "Hard-working"
               
            2. USE STRONG ACTION VERBS:
               ✅ Engineered, Architected, Built, Developed, Designed
               ✅ Optimized, Scaled, Automated, Implemented, Integrated
               ✅ Reduced, Increased, Improved, Enhanced, Accelerated
               ✅ Led, Collaborated, Deployed, Migrated, Refactored

            3. EVERY BULLET POINT MUST INCLUDE:
               - Strong action verb at the start
               - Specific technology/framework used (only what is actually in the data)
               - Technical depth (architecture, algorithms, design patterns)
               - Measurable impact ONLY if a real number or metric appears in the input data — DO NOT invent numbers

            4. PROJECT DESCRIPTIONS:
               - Start with strong action verb
               - Explain WHAT was built and WHY it matters (based ONLY on data found in GitHub repo descriptions/topics/READMEs)
               - Include tech stack naturally in the description (only real languages/tools from GitHub data)
               - DO NOT fabricate metrics — only use numbers that appear in repo data or descriptions
               - Focus on technical challenges solved
               - 2-3 bullet points per project based on actual repo data

            5. PROFESSIONAL SUMMARY:
               - 3-4 lines maximum
               - Start with years of experience or current role/status
               - Highlight strongest technical skills (3-5 key technologies)
               - Mention GitHub portfolio size and quality
               - Include specialization (Full-Stack, AI/ML, Backend, etc.)
               - NO weak phrases - make it powerful and direct

            6. COMPETITIVE PROGRAMMING:
               - DO NOT show weak ratings like "Rated 0" or "0 problems solved"
               - Only include platforms with actual activity
               - Reframe as "Active problem solver on LeetCode" instead of showing 0 stats
               - If no significant stats, write: "Actively practicing Data Structures & Algorithms"

            7. SKILLS SECTION:
               - Extract ALL technologies from GitHub repos
               - Organize into categories: Languages, Frameworks/Libraries, Tools/Platforms, Concepts
               - List 20-30 skills minimum
               - Include: Programming languages, frameworks, databases, cloud platforms, dev tools
               - Extract from: repo languages, descriptions, topics, README files

            8. WORK EXPERIENCE:
               - Use strong action verbs for each bullet point
               - Quantify achievements (e.g., "Developed 15+ features", "Reduced build time by 30%")
               - Mention technologies used
               - Focus on impact and results
               - If no formal experience, infer from GitHub activity or omit

            9. EDUCATION:
               - Include ONLY degree, field, university, and graduation year that are EXPLICITLY found in the input data.
               - Add GPA only if it appears in the data.
               - List relevant coursework only if courses are mentioned in GitHub/LinkedIn profile data.
               - If education data is NOT found in input, set school to "Please fill in manually", degree to "Please fill in manually", year to "", grade to "", coursework to "".
               - DO NOT infer or guess the school name, degree type, or graduation year.

            10. ACHIEVEMENTS & CERTIFICATIONS (CRITICAL — HIGH PRIORITY):
                - The input may contain a section "USER-PROVIDED ACHIEVEMENTS & CERTIFICATIONS" with hackathon wins, certifications, honors, awards, etc.
                - Extract EVERY item from that section individually into the "achievements" array and "certifications" array.
                - For certifications (items with an issuer like Udemy, AWS, Google, Coursera), put them in "certifications" with name/issuer/date.
                - For awards, hackathons, honors, recognitions — put them in "achievements".
                - If no user-provided achievements section exists, only include verifiable facts found in GitHub data (e.g., repo count, stars).
                - Do NOT fabricate any achievements or certifications not present in the input.

            11. FORMATTING & QUALITY:
                - Professional, ATS-friendly language
                - No repetition across sections
                - Concise but impressive
                - Clean, structured format
                - DO NOT invent fake metrics - use "N/A" or omit if data unavailable

            ═══════════════════════════════════════════════════════════════════════
            OUTPUT FORMAT - STRICT JSON (NO MARKDOWN, NO BACKTICKS):
            ═══════════════════════════════════════════════════════════════════════

            {
                "personal": {
                    "fullName": "Full Name",
                    "email": "email@example.com",
                    "phone": "+1234567890",
                    "location": "City, Country",
                    "linkedin": "LinkedIn URL",
                    "github": "GitHub URL",
                    "portfolio": "Portfolio URL if available",
                    "summary": "Software Engineer with 2+ years of experience building scalable web applications using React, Node.js, and Python. Contributed to 20+ open-source repositories with 500+ GitHub stars. Specialized in full-stack development, AI/ML integration, and cloud architecture on AWS."
                },
                "skills": {
                    "languages": ["<EXTRACT from GitHub repo languages and README files — e.g. Python, JavaScript>"],
                    "frameworks": ["<EXTRACT from GitHub repo descriptions, topics, README — e.g. React.js, Flask>"],
                    "tools": ["<EXTRACT from GitHub repo topics/descriptions — e.g. Git, Docker, MongoDB>"],
                    "concepts": ["<EXTRACT from GitHub topics/descriptions — e.g. RESTful APIs, Machine Learning>"]
                },
                "experience": [
                    {
                        "role": "<job title from input data — leave array EMPTY [] if no work experience found>",
                        "company": "<company name from input data>",
                        "location": "<location from input data>",
                        "startDate": "<start date from input data>",
                        "endDate": "<end date from input data>",
                        "bullets": [
                            "<bullet based ONLY on real responsibilities found in input — strong action verb + real tech used>"
                        ]
                    }
                ],
                "projects": [
                    {
                        "name": "<REAL repo name from GitHub data>",
                        "link": "<REAL repo URL from GitHub data>",
                        "bullets": [
                            "<bullet based ONLY on the actual repo description, topics, and README from GitHub API>",
                            "<second bullet — real tech stack and what this repo actually does>"
                        ],
                        "techStack": ["<REAL languages/topics from this specific GitHub repo>"]
                    }
                ],
                "education": [
                    {
                        "school": "<school name from input — write 'Please fill in manually' if NOT found>",
                        "degree": "<degree from input — write 'Please fill in manually' if NOT found>",
                        "fieldOfStudy": "<field from input — write 'Please fill in manually' if NOT found>",
                        "year": "<graduation year from input — leave empty if NOT found>",
                        "grade": "<GPA/CGPA from input — leave empty if NOT found>",
                        "coursework": "<only if courses explicitly mentioned in input — otherwise leave empty>"
                    }
                ],
                "certifications": [
                    {
                        "name": "<certification name from USER-PROVIDED ACHIEVEMENTS section — leave array EMPTY [] if none found>",
                        "issuer": "<issuer from USER-PROVIDED ACHIEVEMENTS section>",
                        "date": "<date from USER-PROVIDED ACHIEVEMENTS section>"
                    }
                ],
                "competitiveProgramming": "<build from REAL LeetCode solved count and Codeforces rating from input — write 'Actively practicing Data Structures & Algorithms' if no stats found>",
                "achievements": [
                    "<REAL achievement from USER-PROVIDED ACHIEVEMENTS section or verifiable GitHub fact — leave array EMPTY [] if nothing found>"
                ]
            }

            ═══════════════════════════════════════════════════════════════════════
            QUALITY CHECKLIST - VERIFY BEFORE RETURNING:
            ═══════════════════════════════════════════════════════════════════════

            ✅ Summary is 3-4 lines, powerful, NO weak phrases
            ✅ Every bullet point starts with strong action verb
            ✅ NO fabricated metrics — numbers only from actual input data
            ✅ Skills section built from actual GitHub languages/topics/descriptions
            ✅ Projects use only real tech stack from GitHub data
            ✅ NO "Rated 0" or weak competitive programming stats shown
            ✅ NO repetition across sections
            ✅ Professional, ATS-friendly language throughout
            ✅ Clean JSON structure with no markdown formatting
            ✅ Education fields are "Please fill in manually" if not found in input data
            ✅ Achievements array contains only verifiable facts from input (real GitHub stats, real LinkedIn items if visible)
            ✅ NO hallucinated school names, company names, degrees, certifications, or awards
            ✅ All dates in consistent format (e.g., "Jan 2023")

            ═══════════════════════════════════════════════════════════════════════
            REMEMBER: This is a FAANG-level resume. Make every word count. Focus on IMPACT, not fluff.
            ═══════════════════════════════════════════════════════════════════════
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Clean up markdown if present
            if (text.startsWith('```json')) {
                text = text.replace(/```json/g, '').replace(/```/g, '');
            }

            try {
                const json = JSON.parse(text);
                console.log("[GeminiService] Resume JSON generated successfully.");
                return json;
            } catch (e) {
                console.error("[GeminiService] Failed to parse JSON response:", text);
                return { error: "Failed to parse AI response. Please try again." };
            }

        } catch (error) {
            console.error("Gemini AI API Error (Resume):", error);
            return { error: "AI Service Error: " + error.message };
        }
    }

    /**
     * Analyzes a resume JSON and returns ATS score + improvements.
     * Uses GEMINI_KEY_3 (Resume Service)
     */
    async analyzeResume(resumeData, jobDescription = '') {
        console.log(`[GeminiService] Analyzing resume for ATS score...`);
        const model = this.getModel('resume');

        if (!model) {
            return { atsScore: 0, improvements: ["Configuration Error: AI Service Key (GEMINI_KEY_3) is missing."] };
        }

        try {
            const prompt = `
You are an expert ATS (Applicant Tracking System) and HR recruiter with 15+ years of experience.

Analyze the following resume and provide:
1. An ATS Score (0-100) based on: keyword richness, formatting quality, impact metrics, action verbs, completeness, and professionalism.
2. A list of specific improvement suggestions.

RESUME DATA:
${JSON.stringify(resumeData, null, 2).substring(0, 15000)}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}` : ''}

Return STRICT JSON (no markdown, no backticks):
{
  "atsScore": <number 0-100>,
  "improvements": [
    "Specific improvement suggestion 1",
    "Specific improvement suggestion 2",
    "Specific improvement suggestion 3",
    "Specific improvement suggestion 4",
    "Specific improvement suggestion 5"
  ],
  "strengths": [
    "What is already strong about this resume"
  ]
}
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '');
            if (text.startsWith('```')) text = text.replace(/```/g, '');

            try {
                return JSON.parse(text.trim());
            } catch (e) {
                return { atsScore: 72, improvements: ["Could not parse AI response. Please try again."] };
            }
        } catch (error) {
            console.error("Gemini AI API Error (Analyze Resume):", error);
            return { atsScore: 0, improvements: ["AI Service Error: " + error.message] };
        }
    }

    /**
     * Regenerates just the professional summary for a resume.
     * Uses GEMINI_KEY_3 (Resume Service)
     */
    async regenerateSummary(resumeData) {
        console.log(`[GeminiService] Regenerating professional summary...`);
        const model = this.getModel('resume');

        if (!model) return "Configuration Error: AI Service Key (GEMINI_KEY_3) is missing.";

        try {
            const prompt = `
You are a FAANG-level technical recruiter and professional resume writer.

Based on the following resume data, write a powerful, ATS-optimized professional summary.

RULES:
- Exactly 3-4 lines
- Start with current status (e.g., "Computer Science student", "Software Engineer with X years")  
- Mention 3-5 strongest technical skills
- Include notable metrics or achievements if available
- NO weak phrases: no "passionate about", "eager to", "seeking opportunity", "highly motivated"
- Strong, direct, professional tone

RESUME DATA:
Name: ${resumeData.personal?.fullName || ''}
Skills: ${JSON.stringify(resumeData.skills || {})}
Projects: ${JSON.stringify((resumeData.projects || []).slice(0, 3))}
Experience: ${JSON.stringify((resumeData.experience || []).slice(0, 2))}
Competitive Programming: ${resumeData.competitiveProgramming || ''}

Return ONLY the summary text (no JSON, no explanation, no quotes):
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error("Gemini AI API Error (Regenerate Summary):", error);
            return "Error regenerating summary: " + error.message;
        }
    }

    /**
     * Generates tailored interview questions for a company/role/round.
     * Uses GEMINI_KEY_2 (Interview Service)
     */
    async generateInterviewQuestions({ company, role, round, experienceLevel = 'mid', count = 8 }) {
        console.log(`[GeminiService] Generating ${count} ${round} questions for ${role} at ${company}...`);
        const model = this.getModel('interview');

        if (!model) {
            return { error: "Configuration Error: AI Service Key (GEMINI_KEY_2) is missing." };
        }

        const roundDescriptions = {
            technical: 'Data structures, algorithms, coding problems, language internals, debugging, system fundamentals',
            behavioral: 'Past experiences, STAR-format stories, teamwork, leadership, conflict resolution, growth mindset',
            'system-design': 'Architectural decisions, scalability, database design, API design, trade-offs, real-world system scaling',
            hr: 'Culture fit, career goals, salary expectations, work style, company knowledge',
        };

        const levelDescriptions = {
            fresher: 'entry-level, 0-1 years experience or final year student',
            mid: 'mid-level, 2-4 years experience',
            senior: 'senior, 5+ years experience',
        };

        try {
            const prompt = `
You are a senior technical interviewer at ${company} with deep knowledge of how ${company} conducts their hiring process.

Generate exactly ${count} interview questions for a ${role} position at ${company}.

INTERVIEW DETAILS:
- Company: ${company}
- Role: ${role}
- Round Type: ${round} (${roundDescriptions[round] || round})
- Candidate Level: ${experienceLevel} (${levelDescriptions[experienceLevel] || experienceLevel})

REQUIREMENTS:
1. Questions must be tailored to ${company}'s actual interview style and culture.
2. Questions must be appropriate for ${round} round.
3. Vary difficulty: 2 easy warm-up, ${count - 4} medium core questions, 2 challenging.
4. For technical: include coding/algorithmic thinking questions relevant to ${company}.
5. For behavioral: use ${company}'s known behavioral competencies.
6. For system-design: reference real systems similar to what ${company} builds at scale.
7. Each question should have a clear "what they are testing" hint.

Return STRICT JSON array (no markdown, no backticks, no explanation):
[
  {
    "id": 1,
    "question": "The full question text",
    "hint": "What the interviewer is testing / what a good answer covers in 1 sentence",
    "difficulty": "easy|medium|hard",
    "category": "sub-category (e.g. Arrays, Leadership, API Design)"
  }
]
`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '');
            if (text.startsWith('```')) text = text.replace(/```/g, '');

            const questions = JSON.parse(text);
            console.log(`[GeminiService] Generated ${questions.length} interview questions.`);
            return { questions };
        } catch (error) {
            console.error("Gemini AI API Error (Generate Questions):", error);
            return { error: "AI Service Error: " + error.message };
        }
    }

    /**
     * Evaluates a candidate's answer to an interview question.
     * Uses GEMINI_KEY_2 (Interview Service)
     */
    async evaluateInterviewAnswer({ company, role, round, question, hint, answer, experienceLevel = 'mid' }) {
        console.log(`[GeminiService] Evaluating interview answer for "${question.substring(0, 50)}..."`);
        const model = this.getModel('interview');

        if (!model) {
            return { error: "Configuration Error: AI Service Key (GEMINI_KEY_2) is missing." };
        }

        try {
            const prompt = `
You are a senior interviewer at ${company} evaluating a candidate for a ${role} position (${experienceLevel}-level).

QUESTION: "${question}"
${hint ? `WHAT IS BEING TESTED: ${hint}` : ''}
CANDIDATE'S ANSWER: "${answer}"
ROUND TYPE: ${round}

Evaluate this answer with professional rigor. Be honest but constructive.

Return STRICT JSON (no markdown, no backticks):
{
  "score": <integer 0-100>,
  "verdict": "Strong" | "Good" | "Average" | "Needs Improvement" | "Insufficient",
  "strengths": ["What the candidate did well (2-3 specific points)"],
  "improvements": ["Specific gap or missed point (2-3 items)"],
  "idealAnswer": "A concise model answer (3-6 sentences) covering the key points an ${experienceLevel}-level candidate should mention",
  "followUpQuestion": "One natural follow-up question an interviewer would ask based on this answer",
  "tip": "One actionable tip to improve this specific type of answer in future"
}
`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '');
            if (text.startsWith('```')) text = text.replace(/```/g, '');

            const evaluation = JSON.parse(text);
            console.log(`[GeminiService] Answer evaluated. Score: ${evaluation.score}`);
            return evaluation;
        } catch (error) {
            console.error("Gemini AI API Error (Evaluate Answer):", error);
            return { error: "AI Service Error: " + error.message };
        }
    }

    /**
     * Check if an interview answer appears to be copied from the internet.
     * Returns { isPlagiarized, confidence, reason }
     */
    async checkAnswerOriginality({ question, answer }) {
        const model = this.getModel('interview');
        if (!model) return { isPlagiarized: false, confidence: 'low', reason: 'AI unavailable' };
        try {
            const prompt = `You are a plagiarism detection expert for technical interviews.
Analyze the answer below and determine if it appears to have been COPIED from an internet source (Wikipedia, documentation, tutorials, Stack Overflow, blogs) rather than written genuinely by the candidate.

Question: "${question}"
Answer: "${answer}"

Signs of plagiarism / internet copying:
- Encyclopedic, overly formal or textbook-like language
- Perfect structure (numbered lists, headers) atypical of spontaneous writing
- Third-person or passive voice throughout
- Verbatim definitions or phrasing matching common docs/wikis
- No personal experience, no first-person voice, no concrete examples
- Suspiciously polished grammar inconsistent with a test environment

Return ONLY valid JSON, no markdown:
{
  "isPlagiarized": true or false,
  "confidence": "low" | "medium" | "high",
  "reason": "One short sentence explaining your decision (max 15 words)"
}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();
            if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '');
            if (text.startsWith('```')) text = text.replace(/```/g, '');
            const parsed = JSON.parse(text);
            console.log(`[GeminiService] Plagiarism check: isPlagiarized=${parsed.isPlagiarized}, confidence=${parsed.confidence}`);
            return parsed;
        } catch (error) {
            console.error('Gemini AI API Error (Plagiarism Check):', error);
            return { isPlagiarized: false, confidence: 'low', reason: 'Check failed' };
        }
    }
}

module.exports = new GeminiService();
