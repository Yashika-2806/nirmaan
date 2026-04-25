const geminiService = require('../../core/ai/gemini-service');
const logger = require('../../core/utils/logger');
const TestCaseModel = require('./models/test-case-model');

class AITestCaseGenerator {
    /**
     * Generate test cases for a DSA problem
     * @param {object} question - The question object with problem statement
     * @param {object} options - Generation options
     * @returns {array} Generated test cases
     */
    async generateTestCases(question, options = {}) {
        try {
            const {
                count = 5, // Number of test cases to generate
                includeEdgeCases = true,
                difficultySplit = true, // Mix easy/medium/hard
                language = 'python',
            } = options;

            if (!question || !question.question) {
                throw new Error('Question statement is required');
            }

            logger.info(`Generating ${count} test cases for question: ${question._id}`);

            // Build prompt for Gemini
            const prompt = this._buildGenerationPrompt(question, count, language, includeEdgeCases);

            // Call Gemini API
            const response = await geminiService.generateContent(prompt);
            const content = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Parse response
            const testCases = this._parseGeneratedTestCases(content, language);

            if (testCases.length === 0) {
                throw new Error('Failed to parse generated test cases');
            }

            logger.info(`Successfully generated ${testCases.length} test cases`);
            return testCases;
        } catch (error) {
            logger.error('AI test case generation error:', error.message);
            throw error;
        }
    }

    /**
     * Save generated test cases to database
     */
    async saveGeneratedTestCases(questionId, testCases, isVisible = false) {
        try {
            const docs = testCases.map((tc, idx) => ({
                questionId,
                title: tc.title || `Test Case ${idx + 1}`,
                input: tc.input,
                expected: tc.expected,
                explanation: tc.explanation || '',
                isVisible, // Hidden by default
                category: tc.category || 'normal',
                difficulty: tc.difficulty || 'medium',
                generatedBy: 'ai',
                aiModel: 'gemini-1.5-pro',
            }));

            const savedDocs = await TestCaseModel.insertMany(docs);
            logger.info(`Saved ${savedDocs.length} test cases to database`);
            return savedDocs;
        } catch (error) {
            logger.error('Error saving test cases:', error.message);
            throw error;
        }
    }

    /**
     * Build generation prompt for Gemini
     */
    _buildGenerationPrompt(question, count, language, includeEdgeCases) {
        return `You are an expert at creating comprehensive test cases for competitive programming problems.

PROBLEM STATEMENT:
${question.question}

DIFFICULTY: ${question.difficulty || 'medium'}
LANGUAGE: ${language}

Your task: Generate exactly ${count} test cases for this problem. Include:
${includeEdgeCases ? `
- ${Math.ceil(count * 0.4)} normal/basic test cases
- ${Math.ceil(count * 0.3)} edge cases (boundary values, empty inputs, single elements)
- ${Math.ceil(count * 0.2)} corner cases (special scenarios mentioned in problem)
- ${Math.ceil(count * 0.1)} stress test cases (larger inputs if applicable)
` : `- ${count} diverse test cases covering different aspects of the problem`}

FORMAT YOUR RESPONSE AS VALID JSON ARRAY (no markdown, no code blocks):
[
    {
        "title": "Test Case Title",
        "input": "input value(s) as string",
        "expected": "expected output as string",
        "explanation": "Why this test case matters",
        "category": "normal|edge_case|boundary|corner_case|stress_test",
        "difficulty": "easy|medium|hard"
    },
    ...
]

IMPORTANT RULES:
1. Return ONLY valid JSON array, no other text
2. Input/expected must be strings (format exactly as program receives/outputs)
3. Multiple input lines should be separated by \\n
4. Each test case should be self-contained and independent
5. Ensure outputs exactly match what the code should print
6. Include test cases that would fail incorrect solutions
7. For ${language}, format input/output exactly as the program would receive/print

Generate exactly ${count} test cases now:`;
    }

    /**
     * Parse AI-generated test cases from JSON response
     */
    _parseGeneratedTestCases(content, language) {
        try {
            // Remove markdown code blocks if present
            let json = content.trim();
            if (json.startsWith('```json')) {
                json = json.slice(7); // Remove ```json
            }
            if (json.startsWith('```')) {
                json = json.slice(3); // Remove ```
            }
            if (json.endsWith('```')) {
                json = json.slice(0, -3); // Remove trailing ```
            }

            json = json.trim();

            // Parse JSON
            const parsed = JSON.parse(json);

            if (!Array.isArray(parsed)) {
                throw new Error('Response is not an array');
            }

            // Validate and normalize test cases
            return parsed.map((tc, idx) => {
                if (!tc.input || !tc.expected) {
                    throw new Error(`Test case ${idx} missing input or expected output`);
                }

                return {
                    title: tc.title || `Test Case ${idx + 1}`,
                    input: String(tc.input),
                    expected: String(tc.expected),
                    explanation: tc.explanation || '',
                    category: tc.category || 'normal',
                    difficulty: tc.difficulty || 'medium',
                };
            });
        } catch (error) {
            logger.error('Failed to parse AI response:', error.message);
            logger.debug('Response content:', content.substring(0, 500));
            throw new Error(`Failed to parse test cases: ${error.message}`);
        }
    }

    /**
     * Generate sample test cases based on examples in problem statement
     */
    async extractExampleTestCases(questionStatement, expectedCount = 3) {
        try {
            const prompt = `Extract all example test cases from this problem statement.
For each example, provide input and expected output.

PROBLEM:
${questionStatement}

Return a JSON array with format:
[
    {
        "title": "Example 1",
        "input": "input string",
        "expected": "output string",
        "explanation": "Why this example"
    }
]

Extract and return ONLY valid JSON array, no other text:`;

            const response = await geminiService.generateContent(prompt);
            const content = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const testCases = this._parseGeneratedTestCases(content, 'python');

            return testCases.slice(0, expectedCount);
        } catch (error) {
            logger.warn('Failed to extract example test cases:', error.message);
            return [];
        }
    }

    /**
     * Improve test cases for better coverage
     */
    async improveTestCases(questionId, existingTestCases, targetImprovement = 'edge_cases') {
        try {
            const prompt = `You are improving test cases for a competitive programming problem.

EXISTING TEST CASES:
${existingTestCases.map((tc, i) => `${i + 1}. Input: ${tc.input}\n   Expected: ${tc.expected}`).join('\n')}

IMPROVEMENT FOCUS: ${targetImprovement}

Generate additional test cases focused on ${targetImprovement} that would:
- Catch common mistakes
- Test boundary conditions
- Prevent TLE/MLE
- Expose incorrect assumptions

Return a JSON array with the same format as before.`;

            const response = await geminiService.generateContent(prompt);
            const content = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return this._parseGeneratedTestCases(content, 'python');
        } catch (error) {
            logger.warn('Failed to improve test cases:', error.message);
            return [];
        }
    }
}

module.exports = new AITestCaseGenerator();
