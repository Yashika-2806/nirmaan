const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/database');
const config = require('./config/env');
const logger = require('./core/utils/logger');
const { errorHandler } = require('./core/middleware/error');
const { apiLimiter } = require('./core/middleware/rate-limit');
const routes = require('./routes');
const { startCareerTwinScheduler } = require('./modules/career-twin/scheduler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);

// Security middleware
app.use(helmet());
app.use(hpp());
app.use(mongoSanitize());
app.use(compression());

// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        if (config.frontendUrls.includes('*') || config.frontendUrls.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server with async initialization
const PORT = config.port;

(async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`🚀 Career OS API running on port ${PORT}`);
            logger.info(`📝 Environment: ${config.nodeEnv}`);
            logger.info(`🌐 Frontend URLs: ${config.frontendUrls.join(', ')}`);
            startCareerTwinScheduler();
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = app;
