
const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

async function testAuth() {
    try {
        console.log('1. Attempting Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@career-os.com',
            password: 'Admin@123456'
        });

        console.log('Login Status:', loginRes.status);
        const token = loginRes.data.token; // Adjust based on actual response structure
        // Verify response structure
        if (!token) {
            console.error('No token in response:', loginRes.data);
            return;
        }
        console.log('Token received length:', token.length);

        console.log('2. Accessing Protected Route (/api/resume)...');
        const resumeRes = await axios.get(`${API_URL}/resume`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Resume Access Status:', resumeRes.status);
        console.log('Resume Data:', resumeRes.data);

    } catch (error) {
        console.error('Error:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testAuth();
