
const axios = require('axios');
const geminiService = require('../../core/ai/gemini-service');

// Rotate user agents to avoid bot detection
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

class ProfileScraperService {

    constructor() {
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        };
    }

    getLinkedInHeaders() {
        const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        return {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        };
    }

    // Fetch a single LinkedIn page and extract all useful visible text + JSON-LD
    async fetchLinkedInPage(url, label) {
        try {
            const cheerio = require('cheerio');
            const resp = await axios.get(url, {
                headers: this.getLinkedInHeaders(),
                timeout: 12000,
                maxRedirects: 5,
                validateStatus: s => s < 500,
            });
            const html = resp.data || '';
            const $ = cheerio.load(html);

            const isGated = html.includes('authwall') || html.includes('join/') ||
                $('body').text().includes('Join to see') || $('body').text().includes('Sign in to view');

            let result = `\n=== ${label} (${url}) ===\n`;

            if (isGated) {
                result += `[GATED — LinkedIn requires login. NO DATA AVAILABLE for this section. Do NOT guess or infer content from this section.]\n`;
                return result;
            }

            // JSON-LD (most reliable when available)
            $('script[type="application/ld+json"]').each((_, el) => {
                try {
                    const parsed = JSON.parse($(el).html() || '{}');
                    const str = JSON.stringify(parsed);
                    if (str.length > 10) result += `JSON-LD: ${str.substring(0, 5000)}\n`;
                } catch {}
            });

            // All visible text on the page (Gemini parses it)
            const bodyText = $('main, #main-content, .scaffold-layout__main, body')
                .first().text()
                .replace(/\s{3,}/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            result += bodyText.substring(0, 6000);
            return result;
        } catch (err) {
            return `\n=== ${label} (${url}) — fetch failed: ${err.message} ===\n`;
        }
    }

    // --- Helper: Extract Username from URL ---
    extractUsername(url) { // Removed platform arg to be more generic, handled inside scanners
        if (!url) return null;
        try {
            // Remove trailing slash
            let cleanUrl = url.replace(/\/$/, '');
            // Remove query params
            cleanUrl = cleanUrl.split('?')[0];

            const parts = cleanUrl.split('/');
            return parts[parts.length - 1];
        } catch (e) {
            return null;
        }
    }

    async fetchGithubData(url) {
        if (!url) return '';
        const username = this.extractUsername(url);
        if (!username) return `GitHub URL provided but invalid: ${url}`;

        try {
            console.log(`[Scraper] Fetching GitHub API for: ${username}`);

            // GitHub API requires User-Agent
            const profileReq = await axios.get(`https://api.github.com/users/${username}`, { headers: this.headers });
            const profile = profileReq.data;

            // Fetch more repos for comprehensive data (top 10 instead of 5)
            const reposReq = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, { headers: this.headers });
            const repos = reposReq.data;

            let dataStr = `
            --- GITHUB PROFILE ---
            Username: ${username}
            Name: ${profile.name || username}
            Bio: ${profile.bio || 'N/A'}
            Public Repos: ${profile.public_repos}
            Followers: ${profile.followers}
            Following: ${profile.following}
            Company: ${profile.company || 'N/A'}
            Location: ${profile.location || 'N/A'}
            Blog/Website: ${profile.blog || 'N/A'}
            Twitter: ${profile.twitter_username || 'N/A'}
            Hireable: ${profile.hireable || 'N/A'}
            Created: ${profile.created_at}
            
            --- TOP REPOSITORIES (${repos.length}) ---
            `;

            if (Array.isArray(repos)) {
                for (const repo of repos) {
                    dataStr += `
                    Repository: ${repo.name}
                    Description: ${repo.description || 'No description provided'}
                    Language: ${repo.language || 'N/A'}
                    Stars: ${repo.stargazers_count}
                    Forks: ${repo.forks_count}
                    Watchers: ${repo.watchers_count}
                    Topics: ${repo.topics ? repo.topics.join(', ') : 'N/A'}
                    Created: ${repo.created_at}
                    Updated: ${repo.updated_at}
                    URL: ${repo.html_url}
                    Homepage: ${repo.homepage || 'N/A'}
                    Size: ${repo.size} KB
                    Open Issues: ${repo.open_issues_count}
                    Default Branch: ${repo.default_branch}
                    ---
                    `;
                }
            }

            return dataStr;
        } catch (error) {
            console.error(`[Scraper] GitHub Fetch Failed for ${username}:`, error.message);
            // Fallback: try scraping HTML if API fails (rate limit)
            return `GitHub API Failed: ${error.message}. Note: Rate limit may be exceeded. Try again later or use GitHub token.`;
        }
    }

    async fetchLeetCodeData(url) {
        if (!url) return '';
        let username = this.extractUsername(url);

        // Handle /u/username format specifically
        if (url.includes('/u/')) {
            const parts = url.split('/u/');
            if (parts.length > 1) {
                username = parts[1].split('/')[0];
            }
        }

        if (!username) return `LeetCode URL invalid: ${url}`;

        try {
            console.log(`[Scraper] Fetching LeetCode API for: ${username}`);

            const query = `
                query getUserProfile($username: String!) {
                    matchedUser(username: $username) {
                        username
                        profile {
                            realName
                            aboutMe
                            school
                            countryName
                            skillTags
                        }
                        submitStats: submitStatsGlobal {
                            acSubmissionNum {
                                difficulty
                                count
                                submissions
                            }
                        }
                    }
                }
            `;

            const response = await axios.post('https://leetcode.com/graphql', {
                query,
                variables: { username }
            }, {
                headers: {
                    ...this.headers,
                    'Content-Type': 'application/json',
                    'Referer': 'https://leetcode.com' // Important for LeetCode
                }
            });

            if (response.data.errors) {
                console.error('LeetCode GraphQL Errors:', response.data.errors);
                return `LeetCode Error: ${response.data.errors[0].message}`;
            }

            const data = response.data.data.matchedUser;
            if (!data) return 'LeetCode User Not Found';

            const stats = data.submitStats.acSubmissionNum;
            const total = stats.find(s => s.difficulty === 'All')?.count || 0;
            const easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
            const medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
            const hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;

            return `
            --- LEETCODE PROFILE ---
            Username: ${data.username}
            Real Name: ${data.profile.realName || 'N/A'}
            About: ${data.profile.aboutMe || 'N/A'}
            Skills: ${data.profile.skillTags.join(', ')}
            
            SOLVED PROBLEMS:
            Total: ${total}
            Easy: ${easy}
            Medium: ${medium}
            Hard: ${hard}
            `;
        } catch (error) {
            console.error(`[Scraper] LeetCode Fetch Failed for ${username}:`, error.message);
            return `LeetCode Fetch Failed: ${error.message}`;
        }
    }

    async fetchCodeforcesData(url) {
        if (!url) return '';
        const username = this.extractUsername(url); // Handle is last part
        if (!username) return `Codeforces URL invalid: ${url}`;

        try {
            console.log(`[Scraper] Fetching Codeforces API for: ${username}`);
            const response = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`, { headers: this.headers });

            if (response.data.status !== 'OK') {
                return `Codeforces Error: ${response.data.comment}`;
            }

            const info = response.data.result[0];

            return `
            --- CODEFORCES PROFILE ---
            Handle: ${info.handle}
            Rank: ${info.rank || 'Unrated'} (Max: ${info.maxRank})
            Rating: ${info.rating || 0} (Max: ${info.maxRating})
            City: ${info.city || 'N/A'}
            Organization: ${info.organization || 'N/A'}
            `;

        } catch (error) {
            console.error(`[Scraper] Codeforces Fetch Failed for ${username}:`, error.message);
            return `Codeforces Fetch Failed: ${error.message}`;
        }
    }

    async fetchCodeChefData(url) {
        if (!url) return '';
        try {
            const username = this.extractUsername(url); // usually /users/username
            console.log(`[Scraper] Fetching CodeChef HTML for: ${username}`);
            // CodeChef is tricky without API. 
            // We will try scraping the specific profile page
            const response = await axios.get(url, { headers: this.headers });

            // Naive parsing or just dumping text for Gemini
            // Since Gemini is good at parsing unstructured text, dumping body text is better than nothing
            // We truncate to avoid token limits
            const text = response.data ? response.data.substring(0, 40000) : '';
            return `\n--- CODECHEF SOURCE HTML (Extract Stats) ---\n` + text;
        } catch (err) {
            return `CodeChef Fetch Failed: ${err.message}`;
        }
    }

    async fetchHackerRankData(url) {
        if (!url) return '';
        const username = this.extractUsername(url);
        if (!username) return `HackerRank URL invalid: ${url}`;

        try {
            console.log(`[Scraper] Fetching HackerRank data for: ${username}`);
            // HackerRank doesn't have a public API, so we'll scrape the profile page
            const response = await axios.get(url, { headers: this.headers });
            const text = response.data ? response.data.substring(0, 40000) : '';
            return `\n--- HACKERRANK PROFILE (Extract Stats) ---\n` + text;
        } catch (err) {
            return `HackerRank Fetch Failed: ${err.message}`;
        }
    }

    async fetchGeeksforGeeksData(url) {
        if (!url) return '';
        const username = this.extractUsername(url);
        if (!username) return `GeeksforGeeks URL invalid: ${url}`;

        try {
            console.log(`[Scraper] Fetching GeeksforGeeks data for: ${username}`);
            // GeeksforGeeks doesn't have a public API either
            const response = await axios.get(url, { headers: this.headers });
            const text = response.data ? response.data.substring(0, 40000) : '';
            return `\n--- GEEKSFORGEEKS PROFILE (Extract Stats) ---\n` + text;
        } catch (err) {
            return `GeeksforGeeks Fetch Failed: ${err.message}`;
        }
    }

    async fetchLinkedInData(url) {
        if (!url) return '';

        // Normalize URL: strip trailing slash / query params
        const baseUrl = url.replace(/\/$/, '').split('?')[0];
        console.log(`[Scraper] Fetching LinkedIn profile + sub-pages: ${baseUrl}`);

        // Fetch the main profile + all detail sub-pages in parallel
        const pages = await Promise.all([
            this.fetchLinkedInPage(baseUrl, 'LinkedIn Main Profile'),
            this.fetchLinkedInPage(`${baseUrl}/details/honors/`,         'LinkedIn Honors & Awards'),
            this.fetchLinkedInPage(`${baseUrl}/details/certifications/`, 'LinkedIn Certifications'),
            this.fetchLinkedInPage(`${baseUrl}/details/experience/`,     'LinkedIn Experience Details'),
            this.fetchLinkedInPage(`${baseUrl}/details/education/`,      'LinkedIn Education Details'),
            this.fetchLinkedInPage(`${baseUrl}/details/skills/`,         'LinkedIn Skills'),
            this.fetchLinkedInPage(`${baseUrl}/details/activities/`,     'LinkedIn Posts & Activities'),
        ]);

        const combined = pages.join('\n\n');
        console.log(`[Scraper] LinkedIn total extracted: ${combined.length} chars`);

        return `\n===== LINKEDIN PROFILE DATA (EXTRACT ALL ACHIEVEMENTS, HONORS, AWARDS, CERTIFICATIONS, EXPERIENCE, POSTS, ACTIVITIES) =====\n${combined}\n===== END LINKEDIN DATA =====\n`;
    }

    /**
     * Main Orchestrator
     */
    async generateResumeFromProfiles(inputData) {
        console.log("Starting Intelligent Profile Scraping...");

        const {
            fullName, email, phone, age, location,
            githubUrl, leetcodeUrl, codeforcesUrl,
            portfolioUrl,
            linkedinAchievements
        } = inputData;

        let aggregatedText = `
        USER PROVIDED DETAILS:
        Name: ${fullName}
        Email: ${email}
        Phone: ${phone}
        Age: ${age || 'Not provided'}
        Location: ${location}
        Portfolio URL: ${portfolioUrl || 'Not provided'}
        `;

        // If user pasted their achievements manually, include them prominently
        if (linkedinAchievements && linkedinAchievements.trim().length > 10) {
            aggregatedText += `

        ===== USER-PROVIDED ACHIEVEMENTS & CERTIFICATIONS (MANUALLY ENTERED — VERY HIGH ACCURACY) =====
        The user has directly provided the following achievements, certifications, hackathon wins, honors,
        and awards. Extract EACH item individually into the achievements and certifications arrays.
        Do NOT skip any item listed here. These are 100% verified facts.

        ${linkedinAchievements.trim()}

        ===== END USER-PROVIDED ACHIEVEMENTS =====
        `;
        }

        // Parallel fetching — only platforms with working public APIs
        const promises = [];

        if (githubUrl)       promises.push(this.fetchGithubData(githubUrl));
        if (leetcodeUrl)     promises.push(this.fetchLeetCodeData(leetcodeUrl));
        if (codeforcesUrl)   promises.push(this.fetchCodeforcesData(codeforcesUrl));

        const results = await Promise.all(promises);
        aggregatedText += '\n\n' + results.join('\n\n');

        console.log('Sending structured data to Gemini for Synthesis...');
        const resumeJson = await geminiService.generateResumeContent(aggregatedText);

        return resumeJson;
    }
}

module.exports = new ProfileScraperService();
