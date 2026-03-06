const axios = require('axios');

async function test() {
    // LeetCode GraphQL
    try {
        const r = await axios.post('https://leetcode.com/graphql', {
            query: `query { matchedUser(username: "neal_wu") { username submitStats: submitStatsGlobal { acSubmissionNum { difficulty count } } } }`
        }, { headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' }, timeout: 8000 });
        const u = r.data.data.matchedUser;
        const total = u.submitStats.acSubmissionNum.find(s => s.difficulty === 'All')?.count;
        console.log(`LeetCode ✅  user=${u.username}  solved=${total}`);
    } catch (e) { console.log(`LeetCode ❌  ${e.message}`); }

    // Codeforces
    try {
        const r = await axios.get('https://codeforces.com/api/user.info?handles=tourist', { timeout: 8000 });
        const i = r.data.result[0];
        console.log(`Codeforces ✅  handle=${i.handle}  rating=${i.rating}  rank=${i.rank}`);
    } catch (e) { console.log(`Codeforces ❌  ${e.message}`); }

    // GitHub (already known to work)
    try {
        const r = await axios.get('https://api.github.com/users/torvalds', { headers: { 'User-Agent': 'test' }, timeout: 8000 });
        console.log(`GitHub ✅  user=${r.data.login}  repos=${r.data.public_repos}`);
    } catch (e) { console.log(`GitHub ❌  ${e.message}`); }
}

test();
