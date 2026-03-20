const crypto = require('crypto');

function canonicalizeUrl(url = '') {
    try {
        const u = new URL(String(url || '').trim());
        u.hash = '';

        // Remove noisy tracking params.
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gh_src'].forEach((param) => {
            u.searchParams.delete(param);
        });

        // Sort params for deterministic canonical representation.
        const sorted = [...u.searchParams.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        u.search = '';
        sorted.forEach(([k, v]) => u.searchParams.append(k, v));

        return u.toString().replace(/\/$/, '');
    } catch (_) {
        return String(url || '').trim();
    }
}

function normalizeText(value = '') {
    return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function makeFingerprint({ company = '', title = '', location = '', description = '', canonicalApplyUrl = '' }) {
    const key = [
        normalizeText(company),
        normalizeText(title),
        normalizeText(location),
        normalizeText(description).slice(0, 280),
        normalizeText(canonicalApplyUrl),
    ].join('|');

    return crypto.createHash('sha1').update(key).digest('hex');
}

function detectSeniority(title = '', description = '') {
    const s = `${String(title)} ${String(description)}`.toLowerCase();
    if (/intern|internship/.test(s)) return 'intern';
    if (/entry|graduate|junior|jr\b/.test(s)) return 'entry';
    if (/senior|sr\b/.test(s)) return 'senior';
    if (/staff|principal|lead/.test(s)) return 'lead';
    if (/manager|director|head/.test(s)) return 'management';
    return 'mid';
}

function detectDepartment(text = '') {
    const s = String(text || '').toLowerCase();
    if (/data|ml|machine learning|ai\b/.test(s)) return 'Data/AI';
    if (/frontend|react|ui/.test(s)) return 'Frontend';
    if (/backend|api|node|java|golang|microservice/.test(s)) return 'Backend';
    if (/full\s*stack/.test(s)) return 'Full Stack';
    if (/product/.test(s)) return 'Product';
    if (/design/.test(s)) return 'Design';
    if (/security/.test(s)) return 'Security';
    return 'Engineering';
}

function normalizeCompensationText(text = '') {
    const raw = String(text || '');
    if (!raw.trim()) {
        return {
            raw: '',
            min: null,
            max: null,
            currency: '',
            interval: '',
            annualizedUsdMin: null,
            annualizedUsdMax: null,
        };
    }

    const normalized = raw.replace(/,/g, '');
    const rangeMatch = normalized.match(/(\$|usd|inr|₹|eur|€)?\s?(\d+(?:\.\d+)?)\s?[-to]{1,3}\s?(\d+(?:\.\d+)?)/i);
    const singleMatch = normalized.match(/(\$|usd|inr|₹|eur|€)?\s?(\d+(?:\.\d+)?)/i);
    const currencyToken = (rangeMatch?.[1] || singleMatch?.[1] || '').toLowerCase();

    const currency = currencyToken.includes('$') || currencyToken.includes('usd')
        ? 'USD'
        : currencyToken.includes('₹') || currencyToken.includes('inr')
            ? 'INR'
            : currencyToken.includes('€') || currencyToken.includes('eur')
                ? 'EUR'
                : '';

    let min = rangeMatch ? Number(rangeMatch[2]) : singleMatch ? Number(singleMatch[2]) : null;
    let max = rangeMatch ? Number(rangeMatch[3]) : min;

    if (min !== null && min < 1000 && /k\b/i.test(normalized)) min *= 1000;
    if (max !== null && max < 1000 && /k\b/i.test(normalized)) max *= 1000;

    const interval = /hour/i.test(normalized)
        ? 'hourly'
        : /month/i.test(normalized)
            ? 'monthly'
            : /year|annum|pa|per annum/i.test(normalized)
                ? 'yearly'
                : '';

    const toUsd = (amount) => {
        if (amount === null || Number.isNaN(amount)) return null;
        if (currency === 'USD' || !currency) return amount;
        if (currency === 'INR') return Math.round(amount / 83);
        if (currency === 'EUR') return Math.round(amount * 1.08);
        return amount;
    };

    const annualize = (amount) => {
        if (amount === null) return null;
        if (!interval || interval === 'yearly') return amount;
        if (interval === 'monthly') return amount * 12;
        if (interval === 'hourly') return amount * 40 * 52;
        return amount;
    };

    const annualizedUsdMin = toUsd(annualize(min));
    const annualizedUsdMax = toUsd(annualize(max));

    return {
        raw,
        min,
        max,
        currency,
        interval,
        annualizedUsdMin,
        annualizedUsdMax,
    };
}

module.exports = {
    canonicalizeUrl,
    makeFingerprint,
    detectSeniority,
    detectDepartment,
    normalizeCompensationText,
};
