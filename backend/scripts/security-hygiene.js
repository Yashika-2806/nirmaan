const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..', '..');
const backendRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(repoRoot, 'frontend');

const IGNORE_DIRS = new Set([
    'node_modules',
    '.git',
    '.next',
    'out',
    'uploads',
    'logs',
]);

const SECRET_PATTERNS = [
    { label: 'Mongo URI with credentials', regex: /mongodb(\+srv)?:\/\/[^\s:@]+:[^\s@]+@/i },
    { label: 'Google API key', regex: /AIza[0-9A-Za-z\-_]{35}/ },
    { label: 'JWT secret assignment', regex: /JWT_(REFRESH_)?SECRET\s*=\s*[^\s#]{20,}/i },
    { label: 'Generic password assignment', regex: /(PASSWORD|PASS|PWD)\s*=\s*[^\s#]{8,}/i },
    { label: 'Admin credential assignment', regex: /ADMIN_(EMAIL|PASSWORD)\s*=\s*[^\s#]+/i },
];

function walkFiles(dir, acc = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (IGNORE_DIRS.has(entry.name)) {
            continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            walkFiles(fullPath, acc);
            continue;
        }

        acc.push(fullPath);
    }

    return acc;
}

function shouldSkipFile(filePath) {
    const basename = path.basename(filePath).toLowerCase();
    if (basename.endsWith('.png') || basename.endsWith('.jpg') || basename.endsWith('.jpeg') || basename.endsWith('.gif') || basename.endsWith('.pdf')) {
        return true;
    }
    if (basename.endsWith('.lock')) {
        return true;
    }
    if (basename.includes('.env.example') || basename.includes('.env.secure.example')) {
        return true;
    }
    return false;
}

function collectFindings() {
    const findings = [];
    const files = walkFiles(repoRoot);

    for (const filePath of files) {
        if (shouldSkipFile(filePath)) {
            continue;
        }

        let content;
        try {
            content = fs.readFileSync(filePath, 'utf8');
        } catch {
            continue;
        }

        const relative = path.relative(repoRoot, filePath).replace(/\\/g, '/');

        for (const pattern of SECRET_PATTERNS) {
            if (pattern.regex.test(content)) {
                findings.push({
                    file: relative,
                    label: pattern.label,
                });
            }
        }
    }

    return findings;
}

function ensureEnvIgnored() {
    const checks = [
        { file: path.join(backendRoot, '.gitignore'), expected: '.env' },
        { file: path.join(frontendRoot, '.gitignore'), expected: '.env*.local' },
    ];

    const results = [];

    for (const check of checks) {
        try {
            const content = fs.readFileSync(check.file, 'utf8');
            results.push({ file: check.file, ok: content.includes(check.expected), expected: check.expected });
        } catch {
            results.push({ file: check.file, ok: false, expected: check.expected });
        }
    }

    return results;
}

function generateSecret(length = 48) {
    return crypto.randomBytes(length).toString('hex');
}

function printReport(findings, ignoreChecks) {
    console.log('\\n=== Nirmaan Secret Hygiene Report ===\\n');

    if (findings.length === 0) {
        console.log('No obvious hardcoded secrets were detected in scanned files.');
    } else {
        console.log(`Detected ${findings.length} potential secret exposures:`);
        findings.slice(0, 20).forEach((item, index) => {
            console.log(`${index + 1}. [${item.label}] ${item.file}`);
        });
        if (findings.length > 20) {
            console.log(`...and ${findings.length - 20} more findings.`);
        }
    }

    console.log('\\nGitignore checks:');
    for (const check of ignoreChecks) {
        const relative = path.relative(repoRoot, check.file).replace(/\\/g, '/');
        const status = check.ok ? 'OK' : 'MISSING';
        console.log(`- ${relative}: ${status} (expected pattern: ${check.expected})`);
    }

    console.log('\\nRecommended secret rotations (generate fresh values):');
    console.log(`- JWT_SECRET=${generateSecret(32)}`);
    console.log(`- JWT_REFRESH_SECRET=${generateSecret(32)}`);
    console.log(`- ENCRYPTION_KEY=${generateSecret(16).slice(0, 32)}`);

    console.log('\\nAction checklist:');
    console.log('1. Rotate all exposed credentials in cloud dashboards immediately.');
    console.log('2. Replace local .env values using backend/.env.secure.example and frontend/.env.example.');
    console.log('3. Never commit real secrets; keep only placeholder templates in git.');
}

function main() {
    const findings = collectFindings();
    const ignoreChecks = ensureEnvIgnored();

    printReport(findings, ignoreChecks);

    if (findings.length > 0) {
        process.exitCode = 1;
    }
}

main();
