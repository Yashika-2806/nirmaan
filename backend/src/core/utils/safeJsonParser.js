/**
 * Centralized safe JSON parser for AI responses.
 *
 * AI models (Gemini, Claude, etc.) frequently wrap valid JSON in markdown
 * code fences, leading/trailing explanatory text, or trailing commas.
 * This utility robustly extracts the first valid JSON object or array
 * from such messy output.
 */

/**
 * Attempts to extract and parse a JSON object or array from a raw AI
 * response string.  Handles:
 *   - Triple-backtick code fences (```json ... ```, ``` ... ```)
 *   - Leading/trailing prose around the JSON payload
 *   - Trailing commas before closing braces/brackets
 *   - Single-quoted strings (replaced with double)
 *   - Control characters inside strings
 *
 * @param {string} raw   – The raw text returned by the AI.
 * @param {'object'|'array'} [expect='object'] – Whether to look for a
 *   top-level JSON object ({…}) or array ([…]).
 * @returns {{ ok: true, data: any } | { ok: false, error: string }}
 */
function safeParseAIJson(raw, expect = 'object') {
    if (raw === null || raw === undefined) {
        return { ok: false, error: 'AI returned an empty response.' };
    }

    let text = String(raw).trim();

    if (text.length === 0) {
        return { ok: false, error: 'AI returned an empty response.' };
    }

    // 1. Strip markdown code fences
    //    Handles ```json, ```JSON, ``` with or without language tag
    text = text.replace(/^```(?:json|JSON|js|JS)?\s*\n?/m, '');
    text = text.replace(/\n?\s*```\s*$/m, '');
    text = text.trim();

    // 2. Find the outermost matching bracket pair (balanced)
    const openChar = expect === 'array' ? '[' : '{';
    const closeChar = expect === 'array' ? ']' : '}';

    const startIdx = text.indexOf(openChar);
    if (startIdx === -1) {
        return { ok: false, error: `No JSON ${expect} found in AI response.` };
    }

    // Walk forward to find the matching close bracket, respecting nesting + strings
    let depth = 0;
    let inString = false;
    let escaped = false;
    let endIdx = -1;

    for (let i = startIdx; i < text.length; i++) {
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

        if (ch === openChar) depth++;
        if (ch === closeChar) {
            depth--;
            if (depth === 0) {
                endIdx = i;
                break;
            }
        }
    }

    if (endIdx === -1) {
        return { ok: false, error: 'Unbalanced JSON brackets in AI response.' };
    }

    let jsonStr = text.substring(startIdx, endIdx + 1);

    // 3. Fix common AI quirks: trailing commas before } or ]
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

    // 4. Try parsing
    try {
        const data = JSON.parse(jsonStr);
        return { ok: true, data };
    } catch (firstErr) {
        // 5. Second attempt: strip control characters (except \n, \t)
        const cleaned = jsonStr.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
        try {
            const data = JSON.parse(cleaned);
            return { ok: true, data };
        } catch (secondErr) {
            return {
                ok: false,
                error: `JSON parse failed: ${firstErr.message}. First 200 chars: ${jsonStr.substring(0, 200)}`
            };
        }
    }
}

module.exports = { safeParseAIJson };
