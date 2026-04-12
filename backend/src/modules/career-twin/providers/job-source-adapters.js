const axios = require('axios');
const logger = require('../../../core/utils/logger');
const {
    detectDepartment,
    detectSeniority,
    normalizeCompensationText,
} = require('../job-normalization');

const toSkillTokens = (text = '') => {
    const known = [
        'javascript', 'typescript', 'node.js', 'react', 'mongodb', 'postgresql', 'sql',
        'python', 'java', 'c++', 'aws', 'docker', 'kubernetes', 'data structures',
        'algorithms', 'system design', 'rest', 'graphql', 'redis', 'microservices',
    ];

    const lower = String(text).toLowerCase();
    return known.filter((skill) => lower.includes(skill));
};

const trimHtml = (html = '') => String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

async function fetchGreenhouseBoard(boardToken) {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
    const { data } = await axios.get(url, { timeout: 15000 });
    const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

    return jobs.map((item) => {
        const description = trimHtml(item.content || '');
        const location = item.location?.name || 'Unknown';
        const compensationText = String(item.metadata?.find?.((m) => /salary|compensation|ctc/i.test(m?.name || ''))?.value || '');
        return {
            externalId: `greenhouse:${boardToken}:${item.id}`,
            sourceUrl: item.absolute_url || '',
            applyUrl: item.absolute_url || '',
            company: item.company_name || boardToken,
            title: item.title || 'Role',
            location,
            workMode: /remote/i.test(location) ? 'remote' : 'unknown',
            employmentType: 'full-time',
            description,
            requiredSkills: toSkillTokens(description),
            tags: ['greenhouse', boardToken],
            postedAt: item.updated_at || item.first_published,
            compensationText,
            department: detectDepartment(`${item.title} ${description}`),
            seniority: detectSeniority(item.title, description),
            compensation: normalizeCompensationText(compensationText),
        };
    });
}

async function fetchLeverCompany(company) {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`;
    const { data } = await axios.get(url, { timeout: 15000 });
    const jobs = Array.isArray(data) ? data : [];

    return jobs.map((item) => {
        const desc = trimHtml(item?.descriptionPlain || item?.description || '');
        const categories = item?.categories || {};
        const location = categories.location || 'Unknown';
        const compensationText = String(item?.salaryRange || item?.salaryDescription || '');

        return {
            externalId: `lever:${company}:${item.id}`,
            sourceUrl: item.hostedUrl || '',
            applyUrl: item.applyUrl || item.hostedUrl || '',
            company: company,
            title: item.text || 'Role',
            location,
            workMode: /remote/i.test(location) ? 'remote' : 'unknown',
            employmentType: categories.commitment || 'full-time',
            description: desc,
            requiredSkills: toSkillTokens(desc),
            tags: ['lever', company],
            postedAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            compensationText,
            department: detectDepartment(`${item.text || ''} ${categories.team || ''} ${desc}`),
            seniority: detectSeniority(item.text, desc),
            compensation: normalizeCompensationText(compensationText),
        };
    });
}

function extractWorkdayJobs(payload) {
    if (Array.isArray(payload?.jobPostings)) return payload.jobPostings;
    if (Array.isArray(payload?.jobs)) return payload.jobs;
    if (Array.isArray(payload?.positions)) return payload.positions;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

async function fetchWorkdayFeed(feedUrl) {
    const { data } = await axios.get(feedUrl, { timeout: 18000 });
    const jobs = extractWorkdayJobs(data);

    return jobs.map((item, index) => {
        const description = trimHtml(item.description || item.jobDescription || item.details || '');
        const company = item.company || item.companyName || 'Workday Partner';
        const title = item.title || item.jobTitle || 'Role';
        const location = item.location || item.locationName || 'Unknown';
        const jobId = item.id || item.jobId || `${Date.now()}-${index}`;
        const compensationText = String(item.compensation || item.salary || item.payRange || '');

        return {
            externalId: `workday:${jobId}`,
            sourceUrl: item.url || item.jobUrl || feedUrl,
            applyUrl: item.applyUrl || item.url || item.jobUrl || feedUrl,
            company,
            title,
            location,
            workMode: /remote/i.test(location) ? 'remote' : 'unknown',
            employmentType: item.timeType || item.employmentType || 'full-time',
            description,
            requiredSkills: toSkillTokens(description),
            tags: ['workday'],
            postedAt: item.postedAt || item.postedDate,
            compensationText,
            department: detectDepartment(`${title} ${item.department || ''} ${description}`),
            seniority: detectSeniority(title, description),
            compensation: normalizeCompensationText(compensationText),
        };
    });
}

/**
 * Agent: Fetch jobs from JSearch RapidAPI based on query
 * Returns live job results from LinkedIn, Indeed, and other platforms
 */
async function fetchJSearchJobs(query, location = '', page = 1, numPages = 1) {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
        logger.warn('[JSearch] RAPIDAPI_KEY not configured; skipping JSearch fetch');
        return [];
    }

    try {
        const params = {
            query: `${query} developer`,
            page: String(page),
            num_pages: String(numPages),
        };

        if (location) {
            params.location = location;
        }

        const options = {
            method: 'GET',
            url: 'https://jsearch.p.rapidapi.com/search',
            params,
            headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
            },
            timeout: 15000,
        };

        logger.info(`[JSearch] Fetching jobs for query="${query}", location="${location}"`);
        const { data } = await axios.request(options);
        const rawJobs = Array.isArray(data?.data) ? data.data : [];

        const jobs = rawJobs.map((item, index) => {
            const description = String(item.job_description || '').substring(0, 2000);
            const location = item.job_location || item.job_city || 'Unknown';
            const company = item.employer_name || item.employer_logo || 'Unknown';
            const title = item.job_title || 'Position';
            const compensationText = `${item.job_salary_currency || 'USD'} ${item.job_salary_min || 'N/A'} - ${item.job_salary_max || 'N/A'}`;

            return {
                externalId: `jsearch:${item.job_id || `${Date.now()}-${index}`}`,
                sourceUrl: item.job_google_link || item.job_apply_link || '',
                applyUrl: item.job_apply_link || item.job_google_link || '',
                company,
                title,
                location,
                workMode: item.job_is_remote ? 'remote' : 'unknown',
                employmentType: item.job_employment_type || 'full-time',
                description,
                requiredSkills: toSkillTokens(description),
                niceToHaveSkills: [],
                tags: ['jsearch', 'live', 'linkedin-indeed'],
                postedAt: item.job_posted_at_datetime_utc ? new Date(item.job_posted_at_datetime_utc) : new Date(),
                expiresAt: item.job_offer_expiration_datetime_utc ? new Date(item.job_offer_expiration_datetime_utc) : null,
                compensationText,
                department: detectDepartment(`${title} ${description}`),
                seniority: detectSeniority(title, description),
                compensation: item.job_salary_min && item.job_salary_max ? {
                    min: item.job_salary_min,
                    max: item.job_salary_max,
                    currency: item.job_salary_currency || 'USD',
                } : {},
            };
        });

        logger.info(`[JSearch] Successfully fetched ${jobs.length} jobs`);
        return jobs;
    } catch (error) {
        if (error.response?.status === 429) {
            logger.warn('[JSearch] Rate limit reached (429). Using fallback or cached jobs.');
            return [];
        }
        logger.error(`[JSearch] Error fetching jobs: ${error.message}`);
        throw error;
    }
}

async function loadJobsForSource(sourceType, sourceKey) {
    if (sourceType === 'greenhouse') return fetchGreenhouseBoard(sourceKey);
    if (sourceType === 'lever') return fetchLeverCompany(sourceKey);
    if (sourceType === 'workday') return fetchWorkdayFeed(sourceKey);
    if (sourceType === 'jsearch') {
        // sourceKey format: "query|location|page|numPages" or just "query"
        const [query, location = '', page = '1', numPages = '1'] = sourceKey.split('|');
        return fetchJSearchJobs(query, location, parseInt(page), parseInt(numPages));
    }
    throw new Error(`Unsupported source type: ${sourceType}`);
}

function getConfiguredSourcesFromEnv() {
    const greenhouseBoards = String(process.env.CAREER_TWIN_GREENHOUSE_BOARDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((board) => ({ sourceType: 'greenhouse', sourceKey: board }));

    const leverCompanies = String(process.env.CAREER_TWIN_LEVER_COMPANIES || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((company) => ({ sourceType: 'lever', sourceKey: company }));

    const workdayFeeds = String(process.env.CAREER_TWIN_WORKDAY_FEEDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((url) => ({ sourceType: 'workday', sourceKey: url }));

    const sources = [...greenhouseBoards, ...leverCompanies, ...workdayFeeds];
    logger.info(`Career Twin source config loaded: ${sources.length} sources`);
    return sources;
}

module.exports = {
    loadJobsForSource,
    getConfiguredSourcesFromEnv,
    fetchJSearchJobs,
};
