const mongoose = require('mongoose');
const logger = require('../core/utils/logger');

const connectDB = async () => {
    try {
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(process.env.MONGODB_URI, options);

        logger.info(`MongoDB Connected: ${mongoose.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

    } catch (error) {
        logger.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
