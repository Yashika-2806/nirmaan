require('dotenv').config();

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseFrontendUrls = () => {
    const raw = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000';
    return raw
        .split(',')
        .map(url => url.trim())
        .filter(Boolean);
};

const config = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: toPositiveInt(process.env.PORT, 5000),
    frontendUrl: parseFrontendUrls()[0],
    frontendUrls: parseFrontendUrls(),
    trustProxy: process.env.TRUST_PROXY === 'true',

    // Database
    mongoUri: process.env.MONGODB_URI,

    // Redis
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: toPositiveInt(process.env.REDIS_PORT, 6379),
        password: process.env.REDIS_PASSWORD || undefined,
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET,
        expire: process.env.JWT_EXPIRE || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
    },

    // Security
    bcryptRounds: toPositiveInt(process.env.BCRYPT_ROUNDS, 12),
    encryptionKey: process.env.ENCRYPTION_KEY,

    // Rate Limiting
    rateLimit: {
        windowMs: toPositiveInt(process.env.RATE_LIMIT_WINDOW, 15) * 60 * 1000,
        max: toPositiveInt(process.env.RATE_LIMIT_MAX, 100),
        authMax: toPositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 10),
        aiMax: toPositiveInt(process.env.AI_RATE_LIMIT_MAX, 20),
    },

    // File Upload
    upload: {
        maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
        path: process.env.UPLOAD_PATH || './uploads',
    },

    // Admin
    admin: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
    },

    // Judge0 API (Code Execution)
    judge0: {
        apiKey: process.env.JUDGE0_API_KEY,
        apiHost: process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com',
        baseUrl: process.env.JUDGE0_API_BASE_URL || 'https://judge0-ce.p.rapidapi.com',
    },
};

// Validate required environment variables
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

if (config.nodeEnv === 'production') {
    if (config.frontendUrls.includes('*')) {
        throw new Error('FRONTEND_URLS cannot include wildcard (*) in production');
    }
    if ((config.jwt.secret || '').length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    if ((config.jwt.refreshSecret || '').length < 32) {
        throw new Error('JWT_REFRESH_SECRET must be at least 32 characters in production');
    }
    if ((config.encryptionKey || '').length < 32) {
        throw new Error('ENCRYPTION_KEY must be at least 32 characters in production');
    }
}

module.exports = config;
