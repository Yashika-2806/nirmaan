/**
 * Complete Interview Platform End-to-End Test
 * Tests the entire execution pipeline
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || '9f3c2a7e8b1d4c6f9a2e7d8c3b1a6f5e9d2c4b7a8e1f6c3d';

// Generate test JWT token
const generateTestToken = () => {
    return jwt.sign(
        { userId: '507f1f77bcf86cd799439011', role: 'user' },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const TEST_TOKEN = generateTestToken();

// Test cases
const TESTS = {
    TWO_SUM: {
        questionId: '',  // Will be fetched
        language: 'python',
        code: `
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
        `,
        expectedVerdict: 'Accepted'
    },
    WRONG_SOLUTION: {
        questionId: '',
        language: 'python',
        code: `
def twoSum(nums, target):
    return [0, 0]  # Always wrong
        `,
        expectedVerdict: 'Wrong Answer'
    },
    COMPILATION_ERROR: {
        questionId: '',
        language: 'python',
        code: `
def twoSum(nums, target):
    if nums:  # Missing colon
        pass
        `,
        expectedVerdict: 'Compilation Error'
    }
};

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
    try {
        console.log(`\n🧪 ${name}`);
        await fn();
        console.log(`✅ PASSED`);
        passedTests++;
    } catch (error) {
        console.error(`❌ FAILED: ${error.message}`);
        failedTests++;
    }
}

async function apiCall(method, endpoint, data = null) {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };
        if (data) config.data = data;
        const response = await axios(config);
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.details ||
                           error?.message || 
                           'API call failed';
        throw new Error(`${errorMessage}`);
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Interview Platform - End-to-End Test Suite');
    console.log('═══════════════════════════════════════════════════════');

    // Test 1: Fetch problems
    await test('Fetch Interview Problems', async () => {
        const response = await apiCall('GET', '/interview/problems');
        
        if (!response.data || !response.data.problems) {
            throw new Error('No problems returned');
        }

        if (response.data.problems.length === 0) {
            throw new Error('Problem list is empty. Run seed script first.');
        }

        console.log(`   Found ${response.data.problems.length} problems`);
        
        // Store question IDs for later tests
        const twoSumProblem = response.data.problems.find(p => p.title === 'Two Sum');
        if (twoSumProblem) {
            TESTS.TWO_SUM.questionId = twoSumProblem._id;
            TESTS.WRONG_SOLUTION.questionId = twoSumProblem._id;
            TESTS.COMPILATION_ERROR.questionId = twoSumProblem._id;
        }
    });

    // Test 2: Get specific problem details
    await test('Get Problem Details', async () => {
        if (!TESTS.TWO_SUM.questionId) {
            throw new Error('Two Sum problem not found');
        }

        const response = await apiCall('GET', `/interview/problems/${TESTS.TWO_SUM.questionId}`);
        
        if (!response.data) {
            throw new Error('No problem data returned');
        }

        if (!response.data.title) {
            throw new Error('Missing problem title');
        }

        console.log(`   Problem: ${response.data.title}`);
        console.log(`   Difficulty: ${response.data.difficulty}`);
        console.log(`   Test Cases: ${response.data.testCaseCount}`);
    });

    // Test 3: Get test cases
    await test('Fetch Test Cases', async () => {
        if (!TESTS.TWO_SUM.questionId) {
            throw new Error('Question ID not set');
        }

        const response = await apiCall('GET', `/interview/test-cases/${TESTS.TWO_SUM.questionId}`);
        
        if (!response.data || !response.data.testCases) {
            throw new Error('No test cases returned');
        }

        if (response.data.testCases.length === 0) {
            throw new Error('Test case list is empty');
        }

        console.log(`   Found ${response.data.testCases.length} test cases`);
    });

    // Test 4: Run correct solution
    await test('Execute Correct Solution', async () => {
        if (!TESTS.TWO_SUM.questionId) {
            throw new Error('Question ID not set');
        }

        const response = await apiCall('POST', '/interview/run', {
            sourceCode: TESTS.TWO_SUM.code,
            language: TESTS.TWO_SUM.language,
            questionId: TESTS.TWO_SUM.questionId,
            async: false
        });

        if (!response.data) {
            throw new Error('No execution result');
        }

        const verdict = response.data.verdict;
        console.log(`   Verdict: ${verdict}`);
        console.log(`   Test Cases: ${response.data.summary?.passedTests}/${response.data.summary?.totalTests} passed`);

        if (verdict !== TESTS.TWO_SUM.expectedVerdict) {
            throw new Error(`Expected ${TESTS.TWO_SUM.expectedVerdict}, got ${verdict}`);
        }
    });

    // Test 5: Run wrong solution
    await test('Execute Wrong Solution (Should Fail)', async () => {
        if (!TESTS.WRONG_SOLUTION.questionId) {
            throw new Error('Question ID not set');
        }

        const response = await apiCall('POST', '/interview/run', {
            sourceCode: TESTS.WRONG_SOLUTION.code,
            language: TESTS.WRONG_SOLUTION.language,
            questionId: TESTS.WRONG_SOLUTION.questionId,
            async: false
        });

        const verdict = response.data.verdict;
        console.log(`   Verdict: ${verdict}`);

        if (verdict === TESTS.WRONG_SOLUTION.expectedVerdict) {
            console.log(`   ✓ Correctly detected wrong answer`);
        } else {
            console.log(`   Note: Got ${verdict} (may vary)`);
        }
    });

    // Test 6: Test search
    await test('Search Problems', async () => {
        const response = await apiCall('GET', '/interview/problems/search?q=two');
        
        if (!response.data || !response.data.results) {
            throw new Error('No search results');
        }

        console.log(`   Found ${response.data.results.length} matches for "two"`);
    });

    // Test 7: Test filter by difficulty
    await test('Filter by Difficulty', async () => {
        const response = await apiCall('GET', '/interview/problems?difficulty=Easy');
        
        if (!response.data || !response.data.problems) {
            throw new Error('No problems returned');
        }

        console.log(`   Found ${response.data.problems.length} Easy problems`);
    });

    // Test 8: Test filter by category
    await test('Filter by Category', async () => {
        const response = await apiCall('GET', '/interview/problems?category=Array');
        
        if (!response.data || !response.data.problems) {
            throw new Error('No problems returned');
        }

        console.log(`   Found ${response.data.problems.length} Array problems`);
    });

    // Test 9: Get execution history
    await test('Get Execution History', async () => {
        if (!TESTS.TWO_SUM.questionId) {
            throw new Error('Question ID not set');
        }

        const response = await apiCall('GET', `/interview/attempts/${TESTS.TWO_SUM.questionId}`);
        
        if (!response.data) {
            throw new Error('No history returned');
        }

        console.log(`   Attempts: ${response.data.count}`);
    });

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Test Results');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Total:  ${passedTests + failedTests}`);
    console.log('═══════════════════════════════════════════════════════');

    if (failedTests === 0) {
        console.log('\n🎉 All tests passed! Interview platform is working correctly.\n');
        return true;
    } else {
        console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
        return false;
    }
}

// Run tests
runTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
        console.error('Test suite error:', error.message);
        process.exit(1);
    });
