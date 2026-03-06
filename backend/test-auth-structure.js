
const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

async function testAuth() {
    try {
        const randomEmail = `test${Date.now()}@example.com`;

        // Try Registration
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test User',
            email: randomEmail,
            password: 'Password123!'
        });

        console.log('Register Response Keys:', Object.keys(regRes.data));
        if (regRes.data.data) {
            console.log('Register Response.data Keys:', Object.keys(regRes.data.data));
            if (regRes.data.data.tokens) {
                console.log('Register Response.data.data.tokens Keys:', Object.keys(regRes.data.data.tokens));
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAuth();
