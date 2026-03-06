
const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

async function testAuth() {
    try {
        console.log('1. Attempting Register...');
        const randomEmail = `test${Date.now()}@example.com`;

        // Try Registration
        let authResponse;
        try {
            const regRes = await axios.post(`${API_URL}/auth/register`, {
                name: 'Test User',
                email: randomEmail,
                password: 'Password123!'
            });
            console.log('Register Success:', regRes.status);
            authResponse = regRes.data;
        } catch (e) {
            console.log('Register failed (maybe exists), trying login...', e.response?.data?.message);
            // If register fails, try login (though using random email so unlikely to exist)
            // Just fall through
        }

        if (!authResponse) {
            console.log('Register failed fatal.');
            return;
        }

        console.log('Auth Response Structure:', JSON.stringify(authResponse, null, 2));

        // Extract token based on frontend expectation
        // Frontend expects: response.data.data.tokens.accessToken
        let token;
        try {
            token = authResponse.data.tokens.accessToken;
            console.log('Extracted Token:', token ? token.substring(0, 20) + '...' : 'NULL');
        } catch (e) {
            console.error('Failed to extract token with frontend path (data.data.tokens.accessToken)');
        }

        if (!token) {
            // Try flat ?
            token = authResponse.token; // Legacy
        }

        if (!token) {
            console.error('No token found');
            return;
        }

        console.log('2. Accessing Protected Route (/api/resume)...');
        try {
            const resumeRes = await axios.get(`${API_URL}/resume`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Resume Access Status:', resumeRes.status);
            console.log('Resume Data works!');
        } catch (e) {
            console.error('Resume Access Failed:', e.response?.status, e.response?.data);
        }

    } catch (error) {
        console.error('Fatal Error:', error.message);
    }
}

testAuth();
