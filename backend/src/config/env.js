require('dotenv').config();

const config = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Database
    mongoUri: process.env.MONGODB_URI,

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET,
        expire: process.env.JWT_EXPIRE || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
    },

    // Security
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    encryptionKey: process.env.ENCRYPTION_KEY,

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) * 60 * 1000 || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
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

module.exports = config;
