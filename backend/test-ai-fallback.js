/**
 * AI Provider Fallback Test Suite
 * Tests the Gemini → Claude fallback chain across all scenarios.
 * 
 * Run: node test-ai-fallback.js
 */
require('dotenv').config();

const AIFallbackManager = require('./src/services/ai/aiFallbackManager');
const GeminiClient = require('./src/services/ai/geminiClient');
const ClaudeClient = require('./src/services/ai/claudeClient');

// ─── Test Helpers ──────────────────────────────────────────────────────────────
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        testsPassed++;
    } else {
        console.error(`  ❌ FAIL: ${testName}`);
        testsFailed++;
    }
}

// ─── Mock Clients ──────────────────────────────────────────────────────────────
class MockGeminiClient {
    constructor(behavior = 'success') {
        this.behavior = behavior;
    }
    async generateContent(prompt, modelName, timeoutMs) {
        switch (this.behavior) {
            case 'success':
                return 'Gemini response: test successful';
            case 'rate-limit':
                throw new Error('429 Resource has been exhausted (e.g. check quota)');
            case 'timeout':
                const err = new Error('AI request timed out after 30000ms');
                err.name = 'TimeoutError';
                throw err;
            case 'malformed':
                return '```json\n{broken json'; // malformed response
            case 'quota':
                throw new Error('Quota exceeded for this API key');
            case 'not-found':
                throw new Error('404 models/gemini-2.5-flash is not found');
            case 'invalid-key':
                throw new Error('API key not valid. Please pass a valid API key');
            case 'network':
                throw new Error('network error: ECONNRESET');
            case 'empty':
                return '';
            default:
                throw new Error('Unknown mock behavior');
        }
    }
}

class MockClaudeClient {
    constructor(behavior = 'success') {
        this.behavior = behavior;
    }
    async generateContent(prompt, modelName, timeoutMs) {
        switch (this.behavior) {
            case 'success':
                return 'Claude response: test successful';
            case 'fail':
                throw new Error('Claude API error: internal server error');
            default:
                throw new Error('Unknown mock behavior');
        }
    }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
async function runTests() {
    console.log('\n════════════════════════════════════════════════');
    console.log('   AI PROVIDER FALLBACK TEST SUITE');
    console.log('════════════════════════════════════════════════\n');

    // Test 1: Gemini succeeds → use Gemini
    console.log('Test 1: Gemini succeeds → use Gemini');
    {
        const gemini = new MockGeminiClient('success');
        const claude = new MockClaudeClient('success');
        const manager = new AIFallbackManager(gemini, 'gemini', gemini, claude);
        // Simulate having at least one Gemini key so the chain is attempted
        manager.spareGeminiKeys = ['fake-key'];
        const result = await manager.generateWithFallback('test', 5000);
        assert(result.includes('Gemini'), 'Returns Gemini response');
    }

    // Test 2: Gemini rate-limited → Claude answers
    console.log('\nTest 2: Gemini rate-limited (429) → Claude fallback');
    {
        const gemini = new MockGeminiClient('rate-limit');
        const claude = new MockClaudeClient('success');
        const manager = new AIFallbackManager(gemini, 'gemini', gemini, claude);
        manager.spareGeminiKeys = [];
        const result = await manager.generateWithFallback('test', 5000);
        assert(result.includes('Claude'), 'Returns Claude response on 429');
    }

    // Test 3: Gemini times out → Claude answers
    console.log('\nTest 3: Gemini timeout → Claude fallback');
    {
        const gemini = new MockGeminiClient('timeout');
        const claude = new MockClaudeClient('success');
        const manager = new AIFallbackManager(gemini, 'gemini', gemini, claude);
        manager.spareGeminiKeys = [];
        const result = await manager.generateWithFallback('test', 5000);
        assert(result.includes('Claude'), 'Returns Claude response on timeout');
    }

    // Test 4: Gemini quota exceeded → Claude answers
    console.log('\nTest 4: Gemini quota exceeded → Claude fallback');
    {
        const gemini = new MockGeminiClient('quota');
        const claude = new MockClaudeClient('success');
        const manager = new AIFallbackManager(gemini, 'gemini', gemini, claude);
        manager.spareGeminiKeys = [];
        const result = await manager.generateWithFallback('test', 5000);
        assert(result.includes('Claude'), 'Returns Claude response on quota');
    }

    // Test 5: Gemini model not found → Claude answers
    console.log('\nTest 5: Gemini 404 model not found → Claude fallback');
    {
        const gemini = new MockGeminiClient('not-found');
        const claude = new MockClaudeClient('success');
        const manager = new AIFallbackManager(gemini, 'gemini', gemini, claude);
        manager.spareGeminiKeys = [];
        const result = await manager.generateWithFallback('test', 5000);
        assert(result.includes('Claude'), 'Returns Claude response on 404');
    }

    // Test 6: Gemini invalid key → Claude answers
    console.log('\nTest 6: Gemini invalid API key → Claude fallback');
    {
        const gemini = new MockGeminiClient('invalid-key');
        const claude = new MockClaudeClient('success');
        const manager = new AIFallbackManager(gemini, 'gemini', gemini, claude);
        manager.spareGeminiKeys = [];
        const result = await manager.generateWithFallback('test', 5000);
        assert(result.includes('Claude'), 'Returns Claude response on invalid key');
    }

    // Test 7: Gemini network error → Claude answers
    console.log('\nTest 7: Gemini network error → Claude fallback');
    {
        const gemini = new MockGeminiClient('network');
        const claude = new MockClaudeClient('success');
        const manager = new AIFallbackManager(gemini, 'gemini', gemini, claude);
        manager.spareGeminiKeys = [];
        const result = await manager.generateWithFallback('test', 5000);
        assert(result.includes('Claude'), 'Returns Claude response on network error');
    }

    // Test 8: Gemini empty response → Claude answers
    console.log('\nTest 8: Gemini empty response → Claude fallback');
    {
        const gemini = new MockGeminiClient('empty');
        const claude = new MockClaudeClient('success');
        const manager = new AIFallbackManager(gemini, 'gemini', gemini, claude);
        manager.spareGeminiKeys = [];
        const result = await manager.generateWithFallback('test', 5000);
        assert(result.includes('Claude'), 'Returns Claude response on empty Gemini response');
    }

    // Test 9: Both providers fail → throws error
    console.log('\nTest 9: Both providers fail → throws error');
    {
        const gemini = new MockGeminiClient('rate-limit');
        const claude = new MockClaudeClient('fail');
        const manager = new AIFallbackManager(gemini, 'gemini', gemini, claude);
        manager.spareGeminiKeys = [];
        try {
            await manager.generateWithFallback('test', 5000);
            assert(false, 'Should have thrown');
        } catch (error) {
            assert(error.message.includes('All AI providers failed'), 'Throws proper error when both fail');
        }
    }

    // Test 10: No Gemini keys, Claude only → Claude answers directly
    console.log('\nTest 10: No Gemini keys → Claude answers directly');
    {
        const gemini = new MockGeminiClient('invalid-key');
        const claude = new MockClaudeClient('success');
        const manager = new AIFallbackManager(gemini, 'gemini', gemini, claude);
        manager.spareGeminiKeys = []; // No keys
        const result = await manager.generateWithFallback('test', 5000);
        assert(result.includes('Claude'), 'Claude answers when Gemini has no keys');
    }

    // Test 11: Structured JSON via Claude fallback
    console.log('\nTest 11: Structured JSON output via Claude');
    {
        const gemini = new MockGeminiClient('rate-limit');
        const claudeJson = {
            generateContent: async () => JSON.stringify({ personal: { fullName: 'Test User' }, skills: { languages: ['JavaScript'] } })
        };
        const manager = new AIFallbackManager(gemini, 'gemini', gemini, claudeJson);
        manager.spareGeminiKeys = [];
        const result = await manager.generateWithFallback('Generate JSON resume', 5000);
        const parsed = JSON.parse(result);
        assert(parsed.personal && parsed.personal.fullName === 'Test User', 'Claude returns parseable JSON for resume');
    }

    // Test 12: Claude client configuration
    console.log('\nTest 12: Claude client configuration checks');
    {
        const client = new ClaudeClient('test-key');
        assert(client.anthropic !== null, 'Claude client initializes with API key');
        
        // Check that dynamic max_tokens works
        const shortPrompt = 'Short prompt';
        const longPrompt = 'x'.repeat(15000);
        // We can't call generateContent without a real key, but we can verify the client exists
        assert(typeof client.generateContent === 'function', 'Claude client has generateContent method');
    }

    // ─── Summary ───────────────────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════════════');
    console.log(`   RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('════════════════════════════════════════════════\n');

    if (testsFailed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test suite crashed:', err);
    process.exit(1);
});
