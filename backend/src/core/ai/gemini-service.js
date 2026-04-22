
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const { safeParseAIJson } = require('../utils/safeJsonParser');

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
     * Get the appropriate model for a specific feature.
     * Always returns a facade that routes through the AI fallback chain
     * (Gemini → Claude), even if no Gemini key is configured.
     * @param {string} feature - The feature identifier (dsa, interview, resume, etc.)
     */
    getModel(feature = 'general') {
        const key = this.keys[feature] || this.keys.general;

        if (!key) {
            console.warn(`[GeminiService] No Gemini API key for feature: ${feature}. Will use Claude fallback if configured.`);
        }

        const aiService = require('../../services/ai/aiService');

        // Return a facade that mimics the SDK model interface.
        // This ensures ALL code routes through the robust AI fallback manager
        // (Gemini key rotation → Claude paid fallback).
        // If no Gemini key exists, aiService will skip Gemini and go straight to Claude.
        return {
            generateContent: async (prompt, options = {}) => {
                const timeoutMs = options.timeoutMs || 120000;  // Default to 120s for heavy operations
                const text = await aiService.generate(prompt, key, timeoutMs);
                return {
                    response: {
                        text: () => text
                    }
                };
            }
        };
    }

    /**
     * Generates strict, professional feedback for DSA answers.
     * Uses GEMINI_KEY_1 (DSA Microservice)
     */
    async generateFeedback(questionTitle, userResponse, contextQuestion) {
        console.log(`[GeminiService] Generating feedback for "${questionTitle}"...`);

        const model = this.getModel('dsa');

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
            console.error("[GeminiService] AI Feedback Error (all providers failed):", error.message || error);

            // Log full error to file for debugging
            try {
                const logPath = path.join(process.cwd(), 'ai-errors.log');
                const logEntry = `[${new Date().toISOString()}] ERROR: ${error.message}\nSTACK: ${error.stack}\n---\n`;
                fs.writeFileSync(logPath, logEntry, { flag: 'a' });
            } catch (e) {
                // Logging failure is non-critical
            }

            const errorMsg = error.toString();

            if (errorMsg.includes('candidate') || errorMsg.includes('safety')) {
                return "Safety Filter: Your response triggered a safety filter. Please try rephrasing.";
            }

            return `AI Service Error: Unable to generate feedback. Please try again shortly.`;
        }

    }

    /**
     * Generates a structured Resume JSON from aggregated raw profile data.
     * Use GEMINI_KEY_3 (Resume Service)
     */
    async generateResumeContent(aggregatedText) {
        console.log(`[GeminiService] Generating resume from profile data...`);
        const model = this.getModel('resume');

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

            const result = await model.generateContent(prompt, { timeoutMs: 90000 });
            const response = await result.response;
            let text = response.text();

            console.log(`[GeminiService] Raw resume AI response length: ${text.length} chars`);

            const parsed = safeParseAIJson(text, 'object');
            if (parsed.ok) {
                console.log("[GeminiService] Resume JSON generated successfully.");
                return parsed.data;
            } else {
                console.error("[GeminiService] Failed to parse resume JSON:", parsed.error);
                console.error("[GeminiService] Raw response preview:", text.substring(0, 300));
                return { error: "AI returned a non-JSON response. Please try again." };
            }

        } catch (error) {
            console.error("[GeminiService] AI Resume Error (all providers failed):", error.message || error);
            return { error: "AI Service Error: " + (error.message || String(error)) };
        }
    }

    /**
     * Analyzes a resume JSON and returns ATS score + improvements.
     * Uses GEMINI_KEY_3 (Resume Service)
     */
    async analyzeResume(resumeData, jobDescription = '') {
        console.log(`[GeminiService] Analyzing resume for ATS score...`);
        const model = this.getModel('resume');

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

            const parsed = safeParseAIJson(text, 'object');
            if (parsed.ok) {
                return parsed.data;
            } else {
                console.error("[GeminiService] Failed to parse ATS JSON:", parsed.error);
                return { atsScore: 0, improvements: ["AI returned an unreadable response. Please try again."], error: parsed.error };
            }
        } catch (error) {
            console.error("[GeminiService] AI ATS Analysis Error (all providers failed):", error.message || error);
            return { atsScore: 0, improvements: ["AI Service Error: " + (error.message || String(error))], error: error.message };
        }
    }

    /**
     * Regenerates just the professional summary for a resume.
     * Uses GEMINI_KEY_3 (Resume Service)
     */
    async regenerateSummary(resumeData) {
        console.log(`[GeminiService] Regenerating professional summary...`);
        const model = this.getModel('resume');

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
            console.error("[GeminiService] AI Summary Error (all providers failed):", error.message || error);
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
            const isCodingRound = round === 'technical';

            // ─── Build the coding fields instruction with a concrete example ──────────────
            const codingInstruction = isCodingRound ? `

═══════════════════════════════════════════════════════════════
CODING QUESTION REQUIREMENTS (MANDATORY for technical round)
═══════════════════════════════════════════════════════════════

For EVERY question in a technical round, you MUST include these extra fields:

  "isCodingQuestion": true   (true if code must be written, false for pure conceptual)
  "functionSignature": Python function signature string.
  "starterCode": A Python code string that:
      1. Defines the function stub with "pass" as body
      2. Adds 3 PRINT statements at the bottom that call the function with sample inputs
      3. Must be executable as-is and produce exactly 3 lines of printed output
  "sampleTestCases": Array of 3 objects { "input": "...", "expected": "..." }
      - "input"    → human-readable description of the test input
      - "expected" → the EXACT string printed to stdout when the correct solution runs

══════════════════
CONCRETE EXAMPLE:
══════════════════
Question: "Given an array of integers and a target, return indices of the two numbers that add up to the target."

Correct JSON fields for this question:

  "isCodingQuestion": true,
  "functionSignature": "def two_sum(nums: list, target: int) -> list:",
  "starterCode": "def two_sum(nums, target):\\n    # Write your solution here\\n    pass\\n\\n# Sample test cases\\nprint(two_sum([2, 7, 11, 15], 9))\\nprint(two_sum([3, 2, 4], 6))\\nprint(two_sum([3, 3], 6))",
  "sampleTestCases": [
    { "input": "nums=[2,7,11,15], target=9",  "expected": "[0, 1]" },
    { "input": "nums=[3,2,4], target=6",       "expected": "[1, 2]" },
    { "input": "nums=[3,3], target=6",         "expected": "[0, 1]" }
  ]

RULES for "expected" values (what Python's print() outputs):
  • Function returns a list  → use Python list format: "[0, 1]"  (with square brackets and spaces after commas)
  • Function returns an int  → just the integer string: "42"
  • Function returns a bool  → "True" or "False"  (capital first letter, Python style)
  • Function returns a str   → just the string, no quotes: "hello"
  • Function returns None    → "None"

RULES for "starterCode":
  • Use \\n to represent newlines inside the JSON string (double-escaped)
  • Use \\t for indentation if needed (double-escaped)
  • The 3 print() calls MUST match the 3 sampleTestCases in the same order
  • Example for a function returning bool: print(is_palindrome("racecar")) → expected: "True"
  • Example for a function returning int:  print(max_depth(root))         → expected: "3"

For system-design or purely conceptual questions set "isCodingQuestion": false
and OMIT functionSignature, starterCode, sampleTestCases entirely.
═══════════════════════════════════════════════════════════════
` : '';

            const prompt = `You are a senior technical interviewer at ${company} with deep knowledge of how ${company} conducts their hiring process.

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
4. For technical: ALL coding questions must have starterCode + sampleTestCases.
5. For behavioral: use ${company}'s known behavioral competencies.
6. For system-design: reference real systems similar to what ${company} builds at scale.
7. Each question should have a clear "what they are testing" hint.
${codingInstruction}
Return STRICT JSON array (no markdown fences, no backticks, no explanation text):
[
  {
    "id": 1,
    "question": "Full question text",
    "hint": "What the interviewer is testing in 1 sentence",
    "difficulty": "easy",
    "category": "Arrays"${isCodingRound ? `,
    "isCodingQuestion": true,
    "functionSignature": "def solution_name(param: type) -> return_type:",
    "starterCode": "def solution_name(param):\\n    # Write your solution here\\n    pass\\n\\n# Sample test cases\\nprint(solution_name(input1))\\nprint(solution_name(input2))\\nprint(solution_name(input3))",
    "sampleTestCases": [
      { "input": "human readable input 1", "expected": "exact printed output 1" },
      { "input": "human readable input 2", "expected": "exact printed output 2" },
      { "input": "edge case input",        "expected": "exact printed output 3" }
    ]` : ''}
  }
]`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            const parsed = safeParseAIJson(text, 'array');
            if (!parsed.ok) {
                console.error('[GeminiService] Failed to parse interview questions JSON:', parsed.error);
                return { error: 'AI returned an unreadable response. Please try again.' };
            }

            let questions = parsed.data;
            console.log(`[GeminiService] Parsed ${questions.length} questions. Fields on Q1:`, Object.keys(questions[0] || {}));

            // ─── Guaranteed fallback: enrich any coding question missing sampleTestCases ──
            if (isCodingRound) {
                const missing = questions.filter(
                    (q) => q.isCodingQuestion !== false && (!q.sampleTestCases || q.sampleTestCases.length === 0)
                );
                console.log(`[GeminiService] ${missing.length}/${questions.length} questions need test case enrichment.`);

                if (missing.length > 0) {
                    // Enrich sequentially to avoid rate-limiting (fallback AI calls)
                    const enriched = [];
                    for (const q of questions) {
                        if (q.isCodingQuestion === false || (q.sampleTestCases && q.sampleTestCases.length > 0)) {
                            enriched.push(q);
                        } else {
                            try {
                                const extra = await this._generateTestCasesForQuestion(q.question, model);
                                enriched.push({ ...q, ...extra });
                            } catch (err) {
                                console.warn(`[GeminiService] Enrichment failed for: ${String(q.question).substring(0, 50)}`, err.message);
                                enriched.push(q);
                            }
                            // Small delay between calls to avoid rate-limit bursts
                            await new Promise((r) => setTimeout(r, 300));
                        }
                    }
                    questions = enriched;
                    const afterEnrich = questions.filter((q) => q.sampleTestCases && q.sampleTestCases.length > 0).length;
                    console.log(`[GeminiService] After enrichment: ${afterEnrich}/${questions.length} questions have test cases.`);
                }
            }

            return { questions };
        } catch (error) {
            console.error('[GeminiService] AI Interview Questions Error (all providers failed):', error.message || error);
            return { error: 'AI service error: ' + (error.message || String(error)) };
        }
    }

    /**
     * Targeted fallback: generate sampleTestCases + starterCode for a single question.
     * Called when the main generation loop omits these fields.
     */
    async _generateTestCasesForQuestion(questionText, model) {
        const fallbackModel = model || this.getModel('interview');
        if (!fallbackModel) return {};

        const prompt = `You are a Python coding expert.

PROBLEM: "${String(questionText).substring(0, 500)}"

Generate a Python function stub and 3 concrete test cases for this problem.

CRITICAL RULES:
1. starterCode must define the function with "pass" body, then call print() 3 times with real sample inputs
2. sampleTestCases[i].expected must EXACTLY match what Python prints for that call when solved correctly
3. Return ONLY valid JSON, no markdown, no explanation

Return this EXACT JSON structure:
{
  "isCodingQuestion": true,
  "functionSignature": "def fn_name(param: type) -> return_type:",
  "starterCode": "def fn_name(param):\\n    # Write your solution here\\n    pass\\n\\nprint(fn_name(sample_input_1))\\nprint(fn_name(sample_input_2))\\nprint(fn_name(sample_input_3))",
  "sampleTestCases": [
    { "input": "readable description of sample_input_1", "expected": "exact_printed_output_1" },
    { "input": "readable description of sample_input_2", "expected": "exact_printed_output_2" },
    { "input": "edge case description",                  "expected": "exact_printed_output_3" }
  ]
}

Example – for "Two Sum":
{
  "isCodingQuestion": true,
  "functionSignature": "def two_sum(nums: list, target: int) -> list:",
  "starterCode": "def two_sum(nums, target):\\n    # Write your solution here\\n    pass\\n\\nprint(two_sum([2, 7, 11, 15], 9))\\nprint(two_sum([3, 2, 4], 6))\\nprint(two_sum([3, 3], 6))",
  "sampleTestCases": [
    { "input": "nums=[2,7,11,15], target=9", "expected": "[0, 1]" },
    { "input": "nums=[3,2,4], target=6",     "expected": "[1, 2]" },
    { "input": "nums=[3,3], target=6",       "expected": "[0, 1]" }
  ]
}`;

        try {
            const result = await fallbackModel.generateContent(prompt);
            const response = await result.response;
            const parsed = safeParseAIJson(response.text(), 'object');
            if (parsed.ok && parsed.data.sampleTestCases?.length > 0) {
                console.log(`[GeminiService] Fallback enrichment succeeded. starterCode length: ${parsed.data.starterCode?.length || 0}`);
                return parsed.data;
            }
            console.warn('[GeminiService] Fallback enrichment: AI returned invalid/empty data.');
            return {};
        } catch (err) {
            console.error('[GeminiService] Fallback enrichment call failed:', err.message);
            return {};
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
            let text = response.text();

            const parsed = safeParseAIJson(text, 'object');
            if (parsed.ok) {
                console.log(`[GeminiService] Answer evaluated. Score: ${parsed.data.score}`);
                return parsed.data;
            } else {
                console.error("[GeminiService] Failed to parse evaluation JSON:", parsed.error);
                return { error: "AI returned an unreadable response. Please try again." };
            }
        } catch (error) {
            console.error("[GeminiService] AI Evaluate Answer Error (all providers failed):", error.message || error);
            return { error: "AI service error: " + (error.message || String(error)) };
        }
    }

    /**
     * Generate a personalised career roadmap.
     * Returns { title, summary, milestones[], totalSkills[], keyInsights[] }
     */
    async generateRoadmap({ currentRole, targetGoal, timelineMonths, skills = [], experience = '' }) {
        const model = this.getModel('roadmap');
        try {
            const prompt = `You are an expert career coach and technical mentor.

Generate a detailed, actionable career roadmap for this person:

Current Role: "${currentRole}"
Target Goal: "${targetGoal}"
Timeline: ${timelineMonths} months
Current Skills: ${skills.length > 0 ? skills.join(', ') : 'Not specified'}
Experience Notes: ${experience || 'Not specified'}

Return ONLY valid JSON (no markdown fences), structured exactly like this:
{
  "title": "Engaging roadmap title (max 10 words)",
  "summary": "2-3 sentence overview of the path and key focus areas",
  "milestones": [
    {
      "title": "Milestone title",
      "description": "What will be learned and built in this phase",
      "skills": ["Skill 1", "Skill 2", "Skill 3"],
      "resources": [
        { "title": "Resource name", "type": "course|book|article|project|practice", "url": "" }
      ],
      "duration": "Month X-Y",
      "weeklyHours": 10,
      "deliverable": "Concrete project or outcome to complete this milestone"
    }
  ],
  "totalSkills": ["All unique skills across roadmap"],
  "keyInsights": [
    "Key insight or tip 1",
    "Key insight or tip 2",
    "Key insight or tip 3"
  ]
}

Rules:
- Create ${Math.max(4, Math.round(timelineMonths / 2))} milestones that span the full ${timelineMonths} months
- Each milestone must build on the previous one logically
- Skills should be specific technologies, tools, or concepts (not vague)
- Resources should be realistic and helpful; use empty string for URL when unsure
- Weekly hours should be realistic (5-20 range)
- The roadmap should be industry-realistic for ${new Date().getFullYear()}
- Focus on practical, job-market-relevant skills`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            const parsed = safeParseAIJson(text, 'object');
            if (parsed.ok) {
                console.log(`[GeminiService] Roadmap generated: ${parsed.data.milestones?.length} milestones for "${targetGoal}"`);
                return parsed.data;
            } else {
                console.error('[GeminiService] Failed to parse roadmap JSON:', parsed.error);
                return { error: 'AI returned an unreadable response. Please try again.' };
            }
        } catch (error) {
            console.error('[GeminiService] AI Roadmap Error (all providers failed):', error.message || error);
            return { error: 'AI Service Error: ' + (error.message || String(error)) };
        }
    }

    /**
     * Generates a multiple-choice quiz from PDF text.
     * Uses GEMINI_KEY_5 (Skills/General)
     */
    async generatePDFQuiz(pdfText, numQuestions = 10, difficulty = 'mixed') {
        console.log(`[GeminiService] Generating PDF quiz (${numQuestions} questions, difficulty: ${difficulty})...`);
        const model = this.getModel('skills');
        if (!model) return { error: 'AI unavailable' };

        try {
                        const buildPrompt = (strictMode = false) => `You are a senior exam-setter and subject-matter expert creating a high-quality exam-style MCQ set.

DOCUMENT CONTENT (first 15000 chars):
${pdfText.substring(0, 15000)}

Task:
- First deeply analyze the content and identify the key concepts, mechanisms, and relationships.
- Then create exactly ${numQuestions} exam-level multiple-choice questions strictly based on the content.

Rules:
- Every question MUST be answerable from the document and test conceptual understanding, not surface wording.
- Prefer application/analysis style questions (scenario, inference, comparison, cause-effect) over list-memorization.
- Avoid shallow stems like: "which is listed", "which is not listed", "Day 1/Day 2", or section-label trivia.
- Use clean, natural exam language as used in school/college exams.
- Each question must have exactly 4 options labeled A, B, C, D.
- Only one option is correct.
- Distractors (wrong options) must be plausible and close to the concept, not random nonsense.
- Required difficulty level: ${difficulty}. If "mixed", produce a balanced easy/medium/hard distribution.
- Include a "difficulty" field per question: "easy" | "medium" | "hard".
- Include "feedback": 1-3 lines explaining the core concept behind the correct answer.
- Include "optionReasons" with A/B/C/D reasons:
    - For the correct option: explain exactly why it is correct based on concept/evidence.
    - For each incorrect option: explain exactly why it is incorrect (what misconception it reflects).
    - Reasons must be specific and logical, not generic lines like "conflicts with document context".
    - Each reason should be at least one complete sentence.
${strictMode ? '- STRICT QUALITY MODE: Regenerate mentally until all questions are deep, concept-driven, and explanation quality is high.' : ''}

Return ONLY valid JSON array (no markdown, no backticks):
[
  {
    "id": 1,
        "question": "Conceptual exam question text here?",
        "difficulty": "medium",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
        "optionReasons": {
            "A": "Reason for option A",
            "B": "Reason for option B",
            "C": "Reason for option C",
            "D": "Reason for option D"
        },
    "correctAnswer": "A",
    "feedback": "Concept-level explanation of why the correct answer is right."
  }
]`;

            const extractJSONArrayString = (input) => {
                const text = String(input || '').trim();
                const start = text.indexOf('[');
                if (start < 0) return null;

                let depth = 0;
                let inString = false;
                let escaped = false;

                for (let i = start; i < text.length; i += 1) {
                    const ch = text[i];

                    if (inString) {
                        if (escaped) {
                            escaped = false;
                        } else if (ch === '\\') {
                            escaped = true;
                        } else if (ch === '"') {
                            inString = false;
                        }
                        continue;
                    }

                    if (ch === '"') {
                        inString = true;
                        continue;
                    }

                    if (ch === '[') depth += 1;
                    if (ch === ']') {
                        depth -= 1;
                        if (depth === 0) {
                            return text.slice(start, i + 1);
                        }
                    }
                }

                return null;
            };

            const parseQuestions = (rawText) => {
                let text = String(rawText || '').trim();
                text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

                try {
                    return JSON.parse(text);
                } catch (_) {
                    // Fall through to tolerant extraction.
                }

                const extracted = extractJSONArrayString(text);
                if (extracted) {
                    return JSON.parse(extracted);
                }

                throw new Error('Failed to parse quiz JSON from model output');
            };

            const normalizeQuestions = (questions) => {
                return (questions || []).map((q, i) => {
                    const options = q?.options || {};
                    const correctAnswer = q?.correctAnswer;
                    const baseFeedback = (q?.feedback || '').trim();
                    const optionReasons = q?.optionReasons || {};

                    const normalizedReasons = {
                        A: (optionReasons.A || '').trim(),
                        B: (optionReasons.B || '').trim(),
                        C: (optionReasons.C || '').trim(),
                        D: (optionReasons.D || '').trim(),
                    };

                    ['A', 'B', 'C', 'D'].forEach((key) => {
                        if (!normalizedReasons[key]) {
                            normalizedReasons[key] = key === correctAnswer
                                ? `Option ${key} is correct because it matches the key concept tested in the question. ${baseFeedback || ''}`.trim()
                                : `Option ${key} is incorrect because it does not satisfy the concept asked in the question, while option ${correctAnswer} does.`;
                        }
                    });

                    return {
                        id: Number(q?.id) || i + 1,
                        question: q?.question,
                        difficulty: q?.difficulty || 'medium',
                        options,
                        optionReasons: normalizedReasons,
                        correctAnswer,
                        feedback: baseFeedback || 'The correct option aligns with the concept explained in the source material.',
                    };
                });
            };

            const hasLowQualityQuestions = (questions) => {
                if (!Array.isArray(questions) || questions.length === 0) return true;

                const shallowStemRegex = /(day\s*\d|which\s+of\s+(these|the following)\s+is\s+not\s+listed|not\s+listed|true\s*\/\s*false)/i;
                const weakReasonRegex = /(conflicts with document context|right answer for this mcq|re-check why|supported by the text\.?$)/i;

                const shallowCount = questions.filter(q => shallowStemRegex.test(String(q?.question || ''))).length;

                let weakReasonCount = 0;
                questions.forEach((q) => {
                    const reasons = q?.optionReasons || {};
                    ['A', 'B', 'C', 'D'].forEach((key) => {
                        const reason = String(reasons[key] || '').trim();
                        if (!reason || reason.length < 30 || weakReasonRegex.test(reason)) {
                            weakReasonCount += 1;
                        }
                    });
                });

                return shallowCount > Math.floor(questions.length * 0.2) || weakReasonCount > 0;
            };

            const first = await model.generateContent(buildPrompt(false));
            const firstResponse = await first.response;
            let questions = parseQuestions(firstResponse.text());

            if (hasLowQualityQuestions(questions)) {
                console.warn('[GeminiService] Detected shallow/weak quiz output. Retrying with strict quality mode...');
                const second = await model.generateContent(buildPrompt(true));
                const secondResponse = await second.response;
                questions = parseQuestions(secondResponse.text());
            }

            const normalized = normalizeQuestions(questions);
            console.log(`[GeminiService] Generated ${normalized.length} PDF quiz questions.`);
            return { questions: normalized };
        } catch (error) {
            console.error('[GeminiService] AI PDF Quiz Error (all providers failed):', error.message || error);
            return { error: 'AI Service Error: ' + error.message };
        }
    }

    /**
     * Generates assertion-reason questions from PDF text.
     * Uses GEMINI_KEY_5 (Skills/General)
     */
    async generateAssertionReasonQuestions(pdfText, numQuestions = 8, difficulty = 'mixed') {
        console.log(`[GeminiService] Generating assertion-reason questions (${numQuestions}, difficulty: ${difficulty})...`);
        const model = this.getModel('skills');
        if (!model) return { error: 'AI unavailable' };

        try {
            const prompt = `You are a senior exam-setter creating Assertion-Reason questions from the document below.

DOCUMENT CONTENT (first 15000 chars):
${pdfText.substring(0, 15000)}

Create exactly ${numQuestions} assertion-reason questions based strictly on document concepts.

Question format (Indian exam style):
- Assertion (A): statement
- Reason (R): statement

Options are fixed as:
A: Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.
B: Both Assertion and Reason are true, but Reason is not the correct explanation of Assertion.
C: Assertion is true, but Reason is false.
D: Assertion is false, but Reason is true.

Rules:
- Required difficulty: ${difficulty}. If mixed, balance easy/medium/hard.
- Questions must be conceptual, exam-like, and derived from source content.
- Avoid trivial section/day label questions.
- Provide logical, student-friendly explanations.
- For each option A/B/C/D, provide why that option is correct/incorrect for this question.

Return ONLY valid JSON array:
[
  {
    "id": 1,
    "difficulty": "medium",
    "assertion": "Assertion statement",
    "reason": "Reason statement",
    "correctAnswer": "A",
    "optionReasons": {
      "A": "Why A is correct or not correct in this specific case.",
      "B": "Why B is correct or not correct in this specific case.",
      "C": "Why C is correct or not correct in this specific case.",
      "D": "Why D is correct or not correct in this specific case."
    },
    "feedback": "Conceptual explanation in 2-4 lines."
  }
]`;

            const extractJSONArrayString = (input) => {
                const text = String(input || '').trim();
                const start = text.indexOf('[');
                if (start < 0) return null;

                let depth = 0;
                let inString = false;
                let escaped = false;

                for (let i = start; i < text.length; i += 1) {
                    const ch = text[i];

                    if (inString) {
                        if (escaped) escaped = false;
                        else if (ch === '\\') escaped = true;
                        else if (ch === '"') inString = false;
                        continue;
                    }

                    if (ch === '"') {
                        inString = true;
                        continue;
                    }

                    if (ch === '[') depth += 1;
                    if (ch === ']') {
                        depth -= 1;
                        if (depth === 0) return text.slice(start, i + 1);
                    }
                }

                return null;
            };

            const parseQuestions = (rawText) => {
                let text = String(rawText || '').trim();
                text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

                try {
                    return JSON.parse(text);
                } catch (_) {
                    // Continue with tolerant extraction.
                }

                const extracted = extractJSONArrayString(text);
                if (extracted) return JSON.parse(extracted);
                throw new Error('Failed to parse assertion-reason JSON from model output');
            };

            const optionMeaning = {
                A: 'Both Assertion and Reason are true, and Reason correctly explains Assertion.',
                B: 'Both Assertion and Reason are true, but Reason does not correctly explain Assertion.',
                C: 'Assertion is true, but Reason is false.',
                D: 'Assertion is false, but Reason is true.',
            };

            const normalize = (questions) => {
                return (questions || []).map((q, idx) => {
                    const correctAnswer = ['A', 'B', 'C', 'D'].includes(q?.correctAnswer) ? q.correctAnswer : 'A';
                    const reasons = q?.optionReasons || {};
                    const normalizedReasons = {
                        A: (reasons.A || '').trim(),
                        B: (reasons.B || '').trim(),
                        C: (reasons.C || '').trim(),
                        D: (reasons.D || '').trim(),
                    };

                    ['A', 'B', 'C', 'D'].forEach((key) => {
                        if (!normalizedReasons[key]) {
                            normalizedReasons[key] = key === correctAnswer
                                ? `Option ${key} is correct in this question. ${optionMeaning[key]}`
                                : `Option ${key} is not correct here because the truth/explanation relation does not match this option.`;
                        }
                    });

                    return {
                        id: Number(q?.id) || idx + 1,
                        difficulty: q?.difficulty || 'medium',
                        assertion: q?.assertion || 'Assertion text unavailable.',
                        reason: q?.reason || 'Reason text unavailable.',
                        correctAnswer,
                        optionReasons: normalizedReasons,
                        feedback: (q?.feedback || '').trim() || 'Review the truth values and whether the reason actually explains the assertion.',
                    };
                });
            };

            const result = await model.generateContent(prompt, { timeoutMs: 120000 });
            const response = await result.response;
            const parsed = parseQuestions(response.text());
            const normalized = normalize(parsed);
            console.log(`[GeminiService] Generated ${normalized.length} assertion-reason questions.`);
            return { questions: normalized };
        } catch (error) {
            console.error('[GeminiService] AI Assertion-Reason Error (all providers failed):', error.message || error);
            return { error: 'AI Service Error: ' + error.message };
        }
    }

    /**
     * Generates marked exam questions from PDF text.
     * Each question has a mark value and an expected answer.
     * Uses GEMINI_KEY_5 (Skills/General)
     */
    async generateMarkedQuestions(pdfText, numQuestions = 6, markDistribution = {}, difficulty = 'mixed') {
        console.log(`[GeminiService] Generating marked exam questions (${numQuestions}, difficulty: ${difficulty})...`);
        const model = this.getModel('skills');
        if (!model) return { error: 'AI unavailable' };

        const normalizedDistribution = {
            2: Number(markDistribution?.['2'] || markDistribution?.[2] || 0),
            3: Number(markDistribution?.['3'] || markDistribution?.[3] || 0),
            5: Number(markDistribution?.['5'] || markDistribution?.[5] || 0),
            8: Number(markDistribution?.['8'] || markDistribution?.[8] || 0),
            10: Number(markDistribution?.['10'] || markDistribution?.[10] || 0),
        };

        const requestedTotal = Object.values(normalizedDistribution).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
        const distributionInstruction = requestedTotal > 0
            ? `Use this exact mark distribution as closely as possible (sum should be ${numQuestions}): ${JSON.stringify(normalizedDistribution)}.`
            : 'Use a balanced spread of marks (2, 3, 5, 8, 10) suitable for the chosen difficulty.';

        try {
            const prompt = `You are an experienced examiner creating a structured exam paper from the following document.

DOCUMENT CONTENT (first 15000 chars):
${pdfText.substring(0, 15000)}

Create exactly ${numQuestions} exam questions based strictly on the document content.

Rules:
- Questions must vary in marks: use values like 2, 3, 5, 8, or 10 marks
- Required difficulty level: ${difficulty}
- If difficulty is "mixed", include a blend of easy/medium/hard
- If difficulty is "easy" or "medium" or "hard", keep all questions aligned to that level
- ${distributionInstruction}
- Short questions (2-3 marks): factual recall, definitions, short explanations
- Medium questions (5 marks): analysis, comparisons, application
- Long questions (8-10 marks): detailed explanations, in-depth analysis, discussion
- Each question must have a model answer showing what a student should write
- The model answer should be proportional to the marks
- Include "focusPoints" as 3-6 concise HINTS about what to cover
- IMPORTANT: focusPoints must be non-revealing guidance, not direct answers
- Do NOT include exact final facts, exact values, exact definitions, or copy-ready answer lines in focusPoints
- Each focus point should start with guidance verbs like: "Define", "Explain", "Mention", "Contrast", "Relate", "Give one example of"
- Keep focusPoints short and coaching-style

Return ONLY valid JSON array (no markdown, no backticks):
[
  {
    "id": 1,
    "question": "Full question text here?",
    "marks": 5,
        "difficulty": "medium",
    "topic": "Topic/concept being tested",
        "focusPoints": ["Define the core concept in your own words", "Mention the key mechanism involved", "Give one example from the document context"],
    "expectedAnswer": "A detailed model answer showing exactly what a student needs to write to get full marks. Include key points that must be mentioned."
  }
]`;

            const result = await model.generateContent(prompt, { timeoutMs: 120000 });
            const response = await result.response;
            let text = response.text().trim();
            if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '');
            if (text.startsWith('```')) text = text.replace(/```/g, '');
            const questions = JSON.parse(text);
            console.log(`[GeminiService] Generated ${questions.length} marked exam questions.`);
            return { questions };
        } catch (error) {
            console.error('[GeminiService] AI Marked Questions Error (all providers failed):', error.message || error);
            return { error: 'AI Service Error: ' + error.message };
        }
    }

    /**
     * Grades a student's answer against an expected answer for a given mark.
     * Returns a score + detailed feedback.
     * Uses GEMINI_KEY_5 (Skills/General)
     */
    async gradeStudentAnswer({ question, marks, expectedAnswer, studentAnswer }) {
        console.log(`[GeminiService] Grading student answer for question (${marks} marks)...`);
        const model = this.getModel('skills');
        if (!model) return { error: 'AI unavailable' };

        try {
            const prompt = `You are a strict but fair examiner grading a student's answer.

QUESTION: "${question}"
TOTAL MARKS: ${marks}
MODEL ANSWER: "${expectedAnswer}"
STUDENT'S ANSWER: "${studentAnswer}"

Grade the student's answer by comparing it to the model answer.

Rules:
- Award marks proportionally based on how many key points from the model answer the student covered
- A completely correct and complete answer gets full marks (${marks})
- A blank or completely wrong answer gets 0
- Be strict but fair — partial credit for partial coverage
- Provide specific, actionable feedback mentioning what was good and what was missing

Return ONLY valid JSON (no markdown, no backticks):
{
  "score": <integer 0 to ${marks}>,
  "percentage": <integer 0-100>,
  "verdict": "Excellent" | "Good" | "Partial" | "Poor" | "No Attempt",
  "feedback": "Detailed feedback explaining the score. Mention specific points the student got right, points they missed, and how they could improve. 3-5 sentences.",
  "keyPointsCovered": ["Key point 1 the student covered", "Key point 2 covered"],
  "keyPointsMissed": ["Key point 1 that was missing", "Key point 2 missing"]
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();
            if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '');
            if (text.startsWith('```')) text = text.replace(/```/g, '');
            const grading = JSON.parse(text);
            console.log(`[GeminiService] Answer graded: ${grading.score}/${marks}`);
            return grading;
        } catch (error) {
            console.error('[GeminiService] AI Grade Answer Error (all providers failed):', error.message || error);
            return { error: 'AI Service Error: ' + error.message };
        }
    }

    /**
     * Generate research content: literature-review, methodology, or citations.
     * Returns { content, citations? }
     */
    async generateResearch({ topic, type }) {
        const model = this.getModel('general');
        if (!model) return { error: 'AI unavailable' };

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
            const result = await model.generateContent(prompt, { timeoutMs: 120000 });
            const response = await result.response;
            const text = response.text().trim();

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

            console.log(`[GeminiService] Research (${type}) generated for "${topic}"`);
            return { content, citations };
        } catch (error) {
            console.error('[GeminiService] AI Research Error (all providers failed):', error.message || error);
            return { error: 'AI Service Error: ' + error.message };
        }
    }

    /**
     * Detects technical skills from combined profile sources.
     * Returns { skills: string[] } or { error }.
     */
    async detectSkillsForMarketplace(rawText) {
        const model = this.getModel('skills');
        if (!model) return { error: 'AI unavailable' };

        try {
            const prompt = `You are a technical profile analyzer.

Analyze the input and extract the candidate's most relevant technical skills.

INPUT DATA:
${String(rawText || '').substring(0, 28000)}

Rules:
- Focus on concrete technical skills only (languages, frameworks, tools, core concepts).
- Prefer skills with explicit evidence in the input.
- Remove duplicates.
- Return at most 25 skills.

Return ONLY valid JSON (no markdown):
{
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();
            if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '');
            if (text.startsWith('```')) text = text.replace(/```/g, '');
            const parsed = JSON.parse(text);

            const skills = Array.isArray(parsed.skills)
                ? [...new Set(parsed.skills.map(s => String(s).trim()).filter(Boolean))].slice(0, 25)
                : [];

            return { skills };
        } catch (error) {
            console.error('[GeminiService] AI Detect Skills Error (all providers failed):', error.message || error);
            return { error: 'AI Service Error: ' + error.message };
        }
    }

        /**
         * Generates a tutor-style AI mentor response with direct teaching and guided follow-up.
         */
        async generateAIMentorResponse({ learnSkill, currentLevel = 'beginner', goal = '', userQuestion = '' }) {
        const model = this.getModel('skills');
        if (!model) return { error: 'AI unavailable' };

        try {
                        const prompt = `You are an AI tutor having a 1-to-1 study conversation with a student.

Learner wants to study: ${learnSkill}
Current level: ${currentLevel}
Goal: ${goal || 'Become interview-ready'}
Student question: ${userQuestion || 'Explain this skill from the beginning and help me get started.'}

Create a practical tutor response that helps the student understand the topic right now.
Your answer must:
- explain the concept in simple language,
- answer the student's question directly,
- include likely questions the student may ask next,
- include follow-up questions that the AI should ask the student,
- include one short practice task.

Return ONLY valid JSON (no markdown):
{
  "mentorType": "ai",
    "directAnswer": "2-5 sentence direct explanation for the student",
    "conceptBreakdown": ["Short learning point 1", "Short learning point 2"],
    "likelyUserQuestions": ["Question the student may ask", "Question the student may ask"],
    "aiFollowUpQuestions": ["Question the AI should ask the student", "Question the AI should ask the student"],
    "practiceTask": "One small exercise or prompt",
    "encouragement": "One short encouraging line"
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();
            if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '');
            if (text.startsWith('```')) text = text.replace(/```/g, '');
            const parsed = JSON.parse(text);

            return {
                mentorType: 'ai',
                directAnswer: String(parsed.directAnswer || '').trim(),
                conceptBreakdown: Array.isArray(parsed.conceptBreakdown) ? parsed.conceptBreakdown : [],
                likelyUserQuestions: Array.isArray(parsed.likelyUserQuestions) ? parsed.likelyUserQuestions : [],
                aiFollowUpQuestions: Array.isArray(parsed.aiFollowUpQuestions) ? parsed.aiFollowUpQuestions : [],
                practiceTask: String(parsed.practiceTask || '').trim(),
                encouragement: String(parsed.encouragement || '').trim(),
            };
        } catch (error) {
            console.error('[GeminiService] AI Mentor Error (all providers failed):', error.message || error);
            return { error: 'AI Service Error: ' + error.message };
        }
    }

    async generateAIMentorPlan(args) {
        return this.generateAIMentorResponse(args);
    }

    /**
     * Check if an interview answer appears to be copied from the internet.
     * Returns { isPlagiarized, confidence, reason }
     */
    async checkAnswerOriginality({ question, answer }) {
        const model = this.getModel('interview');
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
            console.error('[GeminiService] AI Plagiarism Check Error (all providers failed):', error.message || error);
            return { isPlagiarized: false, confidence: 'low', reason: 'Check failed' };
        }
    }

    safeParseJSONObject(text) {
        const raw = String(text || '').trim();
        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleaned);
        } catch (_) {
            const start = cleaned.indexOf('{');
            const end = cleaned.lastIndexOf('}');
            if (start >= 0 && end > start) {
                return JSON.parse(cleaned.slice(start, end + 1));
            }
            throw new Error('Unable to parse JSON object from model output');
        }
    }


    async generateCareerTwinProfile({ name = 'Student', role = 'learner' } = {}) {
        const model = this.getModel('general');
        if (!model) return { error: 'AI unavailable' };

        try {
            const prompt = `You are an expert career coach creating a concise digital twin profile.

User name: ${name}
User role: ${role}

Return ONLY valid JSON:
{
  "personality": "...",
  "workStyle": "...",
  "strengths": ["...", "...", "..."],
  "growthAreas": ["...", "...", "..."]
}

Rules:
- Keep it realistic for an early-career learner
- Each array must have 3 short actionable items`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const parsed = this.safeParseJSONObject(response.text());

            return {
                personality: String(parsed.personality || 'Analytical and growth-oriented'),
                workStyle: String(parsed.workStyle || 'Hands-on learner with iterative improvement'),
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : ['Problem solving', 'Curiosity', 'Consistency'],
                growthAreas: Array.isArray(parsed.growthAreas) ? parsed.growthAreas.slice(0, 5) : ['Communication', 'Project depth', 'Interview confidence'],
            };
        } catch (error) {
            console.error('[GeminiService] AI Career Twin Profile Error:', error.message || error);
            return {
                personality: 'Analytical and growth-oriented',
                workStyle: 'Hands-on learner with iterative improvement',
                strengths: ['Problem solving', 'Curiosity', 'Consistency'],
                growthAreas: ['Communication', 'Project depth', 'Interview confidence'],
            };
        }
    }

    async simulateCareerTwinScenario({ scenario, name = 'Student' }) {
        const model = this.getModel('general');
        if (!model) return { error: 'AI unavailable' };

        try {
            const prompt = `You are simulating a career decision for ${name}.

Scenario: ${scenario}

Return ONLY valid JSON:
{
  "scenario": "...",
  "outcome": "4-7 sentence realistic prediction with risks and upside",
  "recommendation": "3-5 sentence practical action plan"
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const parsed = this.safeParseJSONObject(response.text());

            return {
                scenario: String(parsed.scenario || scenario),
                outcome: String(parsed.outcome || 'Outcome could improve with focused skill building and consistent execution.'),
                recommendation: String(parsed.recommendation || 'Break the goal into weekly milestones, track progress, and iterate based on feedback.'),
            };
        } catch (error) {
            console.error('[GeminiService] AI Career Twin Simulation Error:', error.message || error);
            return {
                scenario,
                outcome: 'This scenario can work, but results depend on consistency, project quality, and interview practice.',
                recommendation: 'Set a 4-week execution plan, complete measurable tasks weekly, and review outcomes every Sunday.',
            };
        }
    }
}

module.exports = new GeminiService();
