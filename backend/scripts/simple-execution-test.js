/**
 * Simple execution test - verify the platform works with stdin-based problems
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || '9f3c2a7e8b1d4c6f9a2e7d8c3b1a6f5e9d2c4b7a8e1f6c3d';

const TEST_TOKEN = jwt.sign(
    { userId: '507f1f77bcf86cd799439011', role: 'user' },
    JWT_SECRET,
    { expiresIn: '24h' }
);

async function apiCall(method, endpoint, data = null) {
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
}

async function test() {
    try {
        console.log('✅ API Endpoint Test\n');

        // Fetch problems
        const problems = await apiCall('GET', '/interview/problems');
        console.log(`Found ${problems.data.problems.length} problems`);

        // Get first problem
        const problem = problems.data.problems[0];
        console.log(`Problem: ${problem.title}`);

        // Test execution with simple stdin-based code
        const simpleCode = `
# Read input
line = input().strip()
numbers = list(map(int, line.split()))
print(sum(numbers))
        `;

        console.log('\n📤 Running execution...');
        const result = await apiCall('POST', '/interview/run', {
            sourceCode: simpleCode,
            language: 'python',
            questionId: problem._id,
            async: false
        });

        console.log('✅ Execution successful!');
        console.log('  Verdict:', result.data.verdict);
        console.log('  Test cases passed:', result.data.summary.passedTests);
        console.log('  Total tests:', result.data.summary.totalTests);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
    }
}

test();
