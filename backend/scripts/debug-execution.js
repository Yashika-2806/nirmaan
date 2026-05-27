/**
 * Debug script to see exact error from execution endpoint
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

async function debug() {
    try {
        // First, fetch a problem
        console.log('📥 Fetching problems...');
        const problemsRes = await axios.get(`${API_URL}/interview/problems`, {
            headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
        });

        if (!problemsRes.data.data || problemsRes.data.data.problems.length === 0) {
            throw new Error('No problems found');
        }

        const problem = problemsRes.data.data.problems[0];
        console.log(`✅ Found problem: ${problem.title} (ID: ${problem._id})`);

        // Now try execution
        const payload = {
            sourceCode: `
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
            `,
            language: 'python',
            questionId: problem._id,
            async: false
        };

        console.log('\n📤 Sending execution request...');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const execRes = await axios.post(`${API_URL}/interview/run`, payload, {
            headers: { 
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ Execution succeeded!');
        console.log('Response:', JSON.stringify(execRes.data, null, 2));
    } catch (error) {
        console.error('\n❌ Error occurred');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

debug();
