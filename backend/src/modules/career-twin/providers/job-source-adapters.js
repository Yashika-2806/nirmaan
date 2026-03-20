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

async function loadJobsForSource(sourceType, sourceKey) {
    if (sourceType === 'greenhouse') return fetchGreenhouseBoard(sourceKey);
    if (sourceType === 'lever') return fetchLeverCompany(sourceKey);
    if (sourceType === 'workday') return fetchWorkdayFeed(sourceKey);
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
};
