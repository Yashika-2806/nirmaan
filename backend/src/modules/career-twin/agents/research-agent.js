const crypto = require('crypto');
const CareerTwinJob = require('../job-model');
const { canonicalizeUrl, makeFingerprint } = require('../job-normalization');

class ResearchAgent {
    buildQueryFilter({ query = '', location = '', workMode = '' } = {}) {
        const filter = { isActive: true };
        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { company: { $regex: query, $options: 'i' } },
                { tags: { $elemMatch: { $regex: query, $options: 'i' } } },
            ];
        }
        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }
        if (workMode) {
            filter.workMode = workMode;
        }
        return filter;
    }

    computeQuality({ title, company, description, applyUrl, requiredSkills, postedAt }) {
        let score = 100;
        const flags = [];

        if (!title || String(title).trim().length < 4) {
            score -= 25;
            flags.push('missing_or_short_title');
        }
        if (!company || String(company).trim().length < 2) {
            score -= 20;
            flags.push('missing_company');
        }
        if (!applyUrl) {
            score -= 25;
            flags.push('missing_apply_url');
        }
        if (!description || String(description).trim().length < 120) {
            score -= 20;
            flags.push('short_description');
        }
        if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
            score -= 10;
            flags.push('missing_skills');
        }

        if (postedAt) {
            const daysOld = Math.floor((Date.now() - new Date(postedAt).getTime()) / (24 * 60 * 60 * 1000));
            if (daysOld > 90) {
                score -= 15;
                flags.push('stale_posting');
            }
        }

        return {
            qualityScore: Math.max(0, Math.min(100, score)),
            qualityFlags: flags,
            lastQualityCheckAt: new Date(),
        };
    }

    async ingestStructuredJobs({ jobs = [], source = 'manual_feed' }) {
        const normalized = jobs.map((job) => {
            const canonicalApplyUrl = canonicalizeUrl(job.applyUrl || job.sourceUrl || '');
            const company = String(job.company || '').trim();
            const title = String(job.title || '').trim();
            const location = String(job.location || 'Unknown');
            const description = String(job.description || '');
            const fingerprint = makeFingerprint({ company, title, location, description, canonicalApplyUrl });
            const quality = this.computeQuality({
                title,
                company,
                description,
                applyUrl: job.applyUrl || '',
                requiredSkills: job.requiredSkills,
                postedAt: job.postedAt,
            });

            return {
                externalId: String(job.externalId || crypto.createHash('sha1').update(`${company}-${title}-${location}`).digest('hex')),
                source,
                sourceUrl: String(job.sourceUrl || ''),
                applyUrl: String(job.applyUrl || ''),
                company,
                title,
                location,
                workMode: ['remote', 'hybrid', 'onsite', 'unknown'].includes(job.workMode) ? job.workMode : 'unknown',
                employmentType: String(job.employmentType || 'full-time'),
                description,
                requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills.slice(0, 30) : [],
                niceToHaveSkills: Array.isArray(job.niceToHaveSkills) ? job.niceToHaveSkills.slice(0, 20) : [],
                tags: Array.isArray(job.tags) ? job.tags.slice(0, 20) : [],
                compensationText: String(job.compensationText || ''),
                compensation: job.compensation || {},
                department: String(job.department || ''),
                seniority: String(job.seniority || ''),
                postedAt: job.postedAt ? new Date(job.postedAt) : new Date(),
                expiresAt: job.expiresAt ? new Date(job.expiresAt) : null,
                isActive: true,
                metadata: {
                    providerPayloadHash: crypto.createHash('sha1').update(JSON.stringify(job)).digest('hex'),
                    confidence: 0.75,
                    canonicalApplyUrl,
                    fingerprint,
                    qualityScore: quality.qualityScore,
                    qualityFlags: quality.qualityFlags,
                    lastQualityCheckAt: quality.lastQualityCheckAt,
                },
            };
        }).filter((job) => job.company && job.title);

        const uniqueMap = new Map();
        normalized.forEach((job) => {
            uniqueMap.set(job.metadata.fingerprint, job);
        });
        const dedupedJobs = [...uniqueMap.values()];

        const writes = dedupedJobs.map((job) => ({
            updateOne: {
                filter: {
                    $or: [
                        { externalId: job.externalId },
                        { 'metadata.fingerprint': job.metadata.fingerprint },
                        ...(job.metadata.canonicalApplyUrl
                            ? [{ 'metadata.canonicalApplyUrl': job.metadata.canonicalApplyUrl }]
                            : []),
                    ],
                },
                update: { $set: job },
                upsert: true,
            },
        }));

        if (writes.length) {
            await CareerTwinJob.bulkWrite(writes, { ordered: false });
        }

        return { imported: writes.length, deduplicated: normalized.length - dedupedJobs.length };
    }

    async queryJobs({ query = '', location = '', workMode = '', limit = 40, offset = 0 }) {
        const filter = this.buildQueryFilter({ query, location, workMode });
        const normalizedLimit = Math.min(Math.max(1, Number(limit || 40)), 100);
        const normalizedOffset = Math.max(0, Number(offset || 0));

        const jobs = await CareerTwinJob.find(filter)
            .sort({ postedAt: -1 })
            .skip(normalizedOffset)
            .limit(normalizedLimit)
            .lean();
        return jobs;
    }

    async countJobs({ query = '', location = '', workMode = '' }) {
        const filter = this.buildQueryFilter({ query, location, workMode });
        return CareerTwinJob.countDocuments(filter);
    }
}

module.exports = new ResearchAgent();
