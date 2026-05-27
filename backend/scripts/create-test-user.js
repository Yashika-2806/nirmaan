/**
 * Create test user for login testing
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/core/auth/model');

async function createTestUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/nirmaan?authSource=admin');
        console.log('✅ Connected to MongoDB');

        // Check if test user exists
        let user = await User.findOne({ email: 'test@example.com' });
        
        if (user) {
            console.log('✅ Test user already exists');
            console.log(`   Email: ${user.email}`);
            console.log(`   Name: ${user.name}`);
        } else {
            // Create test user
            user = await User.create({
                email: 'test@example.com',
                password: 'Test@123456',
                name: 'Test User',
                role: 'user',
                isActive: true
            });
            
            console.log('✅ Test user created successfully!');
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: Test@123456`);
            console.log(`   Name: ${user.name}`);
        }

        console.log('\n🎯 Login Credentials:');
        console.log('   Email: test@example.com');
        console.log('   Password: Test@123456');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createTestUser();
