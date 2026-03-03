const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const config = require('./config/env');
const logger = require('./core/utils/logger');
const { errorHandler } = require('./core/middleware/error');
const { apiLimiter } = require('./core/middleware/rate-limit');
const routes = require('./routes');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.frontendUrl,
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

// Start server
const PORT = config.port;

app.listen(PORT, () => {
    logger.info(`🚀 Career OS API running on port ${PORT}`);
    logger.info(`📝 Environment: ${config.nodeEnv}`);
    logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);
});

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
