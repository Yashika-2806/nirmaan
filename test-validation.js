const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://nirmaan.gladsw.cloud/api/interview/start', {
      company: 'Google',
      role: 'SDE',
      round: 'technical',
      experienceLevel: 'mid',
      count: 5
    }, {
      headers: {
        'Authorization': 'Bearer test'
      }
    });
    console.log(res.data);
  } catch (err) {
    console.log(err.response ? err.response.data : err.message);
  }
}
test();
