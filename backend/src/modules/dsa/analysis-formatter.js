const aiService = require('../../services/ai/aiService');

/**
 * Structured DSA Solution Analysis Formatter
 * Generates interview-ready analysis with proper structure:
 * - Approach Summary
 * - Correctness Evaluation
 * - Time and Space Complexity
 * - What's Good
 * - What's Missing/Improvement Points
 * - Optimized Solution
 * - Interview-Ready Final Answer
 */
class DSAAnalysisFormatter {
    /**
     * Generate structured analysis for a DSA solution
     * @param {string} problemTitle - Title of the problem
     * @param {string} problemDescription - Full problem statement
     * @param {string} userCode - User's code solution
     * @param {string} language - Programming language
     * @param {number} timeoutMs - Request timeout
     * @returns {Promise<object>} - Structured analysis object
     */
    async analyzeSolution(problemTitle, problemDescription, userCode, language, timeoutMs = 30000) {
        console.log(`[DSAAnalysisFormatter] Analyzing "${problemTitle}" in ${language}...`);

        const prompt = this._buildAnalysisPrompt(problemTitle, problemDescription, userCode, language);

        try {
            const rawResponse = await aiService.generate(prompt, null, timeoutMs);
            console.log('[DSAAnalysisFormatter] ✅ Analysis generated, parsing response...');

            // Parse the structured response
            const analysis = this._parseAnalysisResponse(rawResponse);
            return analysis;
        } catch (error) {
            console.error('[DSAAnalysisFormatter] Analysis failed:', error.message);
            throw new Error(`DSA analysis failed: ${error.message}`);
        }
    }

    /**
     * Build the AI prompt for structured analysis
     * Uses JSON output format for easy parsing
     */
    _buildAnalysisPrompt(problemTitle, problemDescription, userCode, language) {
        return `You are a Senior Technical Interviewer at Google/Meta/Amazon evaluating a candidate's DSA solution.

PROBLEM:
Title: "${problemTitle}"
Description: ${problemDescription}

CANDIDATE'S CODE (${language}):
\`\`\`${language}
${userCode}
\`\`\`

TASK: Provide a structured technical analysis in JSON format (NO markdown, NO backticks).

ANALYSIS MUST INCLUDE:
1. "approachSummary": What approach did the candidate take? (2-3 sentences, plain language)
2. "correctness": Is the solution correct? "Correct", "Mostly Correct with Minor Issues", "Incorrect Logic", or "Incomplete"
3. "correctnessDetails": Specific feedback on correctness (2-3 sentences)
4. "timeComplexity": User's solution complexity (e.g., "O(n²)") with explanation
5. "spaceComplexity": User's solution complexity (e.g., "O(1)" or "O(n)") with explanation
6. "strengths": Array of 2-3 things the candidate did well
7. "improvements": Array of 2-3 specific improvements needed
8. "optimalSolution": The most optimal approach with complexity (2-3 sentences)
9. "optimalTimeComplexity": Optimal time complexity (e.g., "O(n log n)")
10. "optimalSpaceComplexity": Optimal space complexity
11. "edgeCases": Array of important edge cases to consider (3-4 items)
12. "interviewTip": One actionable tip for interview success
13. "rating": Your assessment: "Strong", "Good", "Fair", or "Needs Work"

OUTPUT RULES (CRITICAL):
- Return ONLY valid JSON, no markdown, no explanation text
- Use double quotes for all strings
- Ensure all arrays are properly formatted
- No code blocks or backticks in the JSON
- Be specific and actionable (not generic praise)
- Evaluate honestly but constructively
- Format complexity like "O(n)" not "O(n )"

Return the JSON object with all fields:`;
    }

    /**
     * Parse the structured analysis response from Claude/Gemini
     * Attempts to extract JSON from various formats
     */
    _parseAnalysisResponse(rawResponse) {
        try {
            // Try direct JSON parse
            const analysis = JSON.parse(rawResponse);
            console.log('[DSAAnalysisFormatter] ✅ Successfully parsed analysis JSON');
            return this._validateAnalysisObject(analysis);
        } catch (e) {
            console.log('[DSAAnalysisFormatter] Direct JSON parse failed, attempting extraction...');
            
            // Try to extract JSON from markdown code blocks
            let jsonString = rawResponse;
            
            // Remove markdown code block if present
            const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonString = jsonMatch[1];
                console.log('[DSAAnalysisFormatter] Extracted JSON from markdown code block');
            }
            
            // Try parse again
            try {
                const analysis = JSON.parse(jsonString);
                console.log('[DSAAnalysisFormatter] ✅ Successfully parsed extracted JSON');
                return this._validateAnalysisObject(analysis);
            } catch (parseError) {
                console.error('[DSAAnalysisFormatter] ❌ Failed to parse JSON:', parseError.message);
                console.error('[DSAAnalysisFormatter] Raw response preview:', rawResponse.substring(0, 200));
                
                // Fallback: return raw response wrapped in standard object
                return this._createFallbackAnalysis(rawResponse);
            }
        }
    }

    /**
     * Validate and sanitize the analysis object
     */
    _validateAnalysisObject(analysis) {
        const required = [
            'approachSummary',
            'correctness',
            'correctnessDetails',
            'timeComplexity',
            'spaceComplexity',
            'strengths',
            'improvements',
            'optimalSolution',
            'optimalTimeComplexity',
            'optimalSpaceComplexity',
            'edgeCases',
            'interviewTip',
            'rating'
        ];

        // Ensure all required fields exist
        for (const field of required) {
            if (!(field in analysis)) {
                console.warn(`[DSAAnalysisFormatter] ⚠️ Missing field: ${field}`);
                analysis[field] = analysis[field] || this._getDefaultValue(field);
            }
        }

        // Ensure arrays are arrays
        if (!Array.isArray(analysis.strengths)) {
            analysis.strengths = typeof analysis.strengths === 'string' ? [analysis.strengths] : [];
        }
        if (!Array.isArray(analysis.improvements)) {
            analysis.improvements = typeof analysis.improvements === 'string' ? [analysis.improvements] : [];
        }
        if (!Array.isArray(analysis.edgeCases)) {
            analysis.edgeCases = typeof analysis.edgeCases === 'string' ? [analysis.edgeCases] : [];
        }

        return analysis;
    }

    /**
     * Create a fallback analysis object when parsing fails
     */
    _createFallbackAnalysis(rawResponse) {
        console.warn('[DSAAnalysisFormatter] Using fallback analysis structure with raw response');
        
        return {
            approachSummary: 'Analysis generated with fallback formatting.',
            correctness: this._detectCorrectness(rawResponse) ? 'Mostly Correct with Minor Issues' : 'Needs Review',
            correctnessDetails: rawResponse.substring(0, 300) + '...',
            timeComplexity: 'Analysis pending',
            spaceComplexity: 'Analysis pending',
            strengths: ['Solution structure is readable'],
            improvements: ['Review complexity analysis', 'Consider edge cases'],
            optimalSolution: 'Request analysis again for optimal solution',
            optimalTimeComplexity: 'Pending',
            optimalSpaceComplexity: 'Pending',
            edgeCases: ['Empty input', 'Single element', 'Large dataset'],
            interviewTip: 'Always analyze your solution\'s time and space complexity before submitting.',
            rating: 'Fair',
            rawFeedback: rawResponse
        };
    }

    /**
     * Try to detect if solution is correct from raw response
     */
    _detectCorrectness(text) {
        const lowerText = text.toLowerCase();
        const positiveIndicators = ['correct', 'valid', 'works', 'optimal', 'efficient'];
        const negativeIndicators = ['incorrect', 'fails', 'wrong', 'issue', 'bug', 'missing'];

        const positiveCount = positiveIndicators.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeIndicators.filter(word => lowerText.includes(word)).length;

        return positiveCount >= negativeCount;
    }

    /**
     * Get default value for analysis fields
     */
    _getDefaultValue(field) {
        const defaults = {
            approachSummary: 'Analysis pending',
            correctness: 'Pending Review',
            correctnessDetails: 'Unable to analyze at this time',
            timeComplexity: 'O(?) - Pending analysis',
            spaceComplexity: 'O(?) - Pending analysis',
            strengths: ['Please resubmit for fresh analysis'],
            improvements: ['Analysis framework pending initialization'],
            optimalSolution: 'Optimal approach pending',
            optimalTimeComplexity: 'Pending',
            optimalSpaceComplexity: 'Pending',
            edgeCases: ['Pending analysis'],
            interviewTip: 'Always explain your approach and complexity to the interviewer.',
            rating: 'Pending'
        };
        return defaults[field] || null;
    }

    /**
     * Format analysis for display (converts to readable markdown-style text)
     */
    formatForDisplay(analysis) {
        return `
## Approach
${analysis.approachSummary}

## Correctness: ${analysis.correctness}
${analysis.correctnessDetails}

## Complexity Analysis
- **Time:** ${analysis.timeComplexity}
- **Space:** ${analysis.spaceComplexity}

## What You Did Well ✅
${analysis.strengths.map(s => `- ${s}`).join('\n')}

## Areas for Improvement 📝
${analysis.improvements.map(i => `- ${i}`).join('\n')}

## Optimal Solution
${analysis.optimalSolution}
- **Time:** ${analysis.optimalTimeComplexity}
- **Space:** ${analysis.optimalSpaceComplexity}

## Edge Cases to Consider
${analysis.edgeCases.map(e => `- ${e}`).join('\n')}

## Interview Tips 💡
${analysis.interviewTip}

## Overall Rating: ${analysis.rating}
`;
    }
}

module.exports = new DSAAnalysisFormatter();
