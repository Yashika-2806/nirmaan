#!/usr/bin/env node

/**
 * Interview Platform - Setup Diagnostic & Auto-Start Guide
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Interview Platform - Diagnostic Check');
console.log('═══════════════════════════════════════════════════════════════\n');

function checkCommand(cmd, name) {
    try {
        execSync(`${cmd} --version`, { stdio: 'ignore' });
        console.log(`✅ ${name} - INSTALLED`);
        return true;
    } catch (e) {
        console.log(`❌ ${name} - NOT INSTALLED`);
        return false;
    }
}

function checkService(url, name) {
    try {
        const http = require('http');
        return new Promise((resolve) => {
            const req = http.get(url, () => {
                console.log(`✅ ${name} - RUNNING`);
                resolve(true);
            });
            req.on('error', () => {
                console.log(`❌ ${name} - NOT RUNNING`);
                resolve(false);
            });
            req.setTimeout(2000, () => {
                req.destroy();
                console.log(`❌ ${name} - NOT RUNNING (timeout)`);
                resolve(false);
            });
        });
    } catch (e) {
        console.log(`❌ ${name} - ERROR CHECKING`);
        return Promise.resolve(false);
    }
}

async function runChecks() {
    console.log('PREREQUISITES:\n');
    const nodeOk = checkCommand('node', 'Node.js');
    const npmOk = checkCommand('npm', 'npm');
    const dockerOk = checkCommand('docker', 'Docker');
    const dockerComposeOk = checkCommand('docker-compose', 'Docker Compose');

    console.log('\n\nREQUIRED SERVICES:\n');
    const mongoRunning = await checkService('http://localhost:27017', 'MongoDB (27017)');
    const redisRunning = await checkService('http://localhost:6379', 'Redis (6379)');
    const backendRunning = await checkService('http://localhost:5000/api/health', 'Backend (5000)');

    console.log('\n' + '═══════════════════════════════════════════════════════════════');
    console.log('  DIAGNOSIS\n');

    const allReady = nodeOk && npmOk && backendRunning && mongoRunning;

    if (!dockerOk || !dockerComposeOk) {
        console.log('⚠️  Docker is not installed or not accessible.');
        console.log('   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop\n');
    }

    if (!backendRunning) {
        console.log('❌ Backend is NOT running');
        console.log('   The test script needs the backend to be running on http://localhost:5000\n');
    }

    if (!mongoRunning) {
        console.log('❌ MongoDB is NOT running');
        console.log('   You need MongoDB running for the backend to work.\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('NEXT STEPS:\n');

    if (!dockerOk || !dockerComposeOk) {
        console.log('1. Install Docker Desktop from:');
        console.log('   https://www.docker.com/products/docker-desktop\n');
    }

    console.log('2. Start Docker Desktop (if you just installed it)\n');

    if (!backendRunning) {
        console.log('3. Start all services with:');
        console.log('   cd C:\\Users\\Rudra\\OneDrive\\Desktop\\Nirmaan');
        console.log('   docker-compose up -d\n');

        console.log('4. Wait ~30 seconds for services to start, then verify:');
        console.log('   docker-compose ps\n');

        console.log('5. Seed the interview problems:');
        console.log('   cd backend');
        console.log('   npm install');
        console.log('   node scripts/seed-interview-problems.js\n');

        console.log('6. Run the test suite:');
        console.log('   node scripts/test-interview-platform.js\n');
    } else {
        console.log('All services are running! You can now run the tests:\n');
        console.log('   cd backend');
        console.log('   node scripts/test-interview-platform.js\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    if (allReady) {
        console.log('✅ System is READY to run tests!\n');
        return 0;
    } else {
        console.log('⚠️  Some components need to be set up. Follow the steps above.\n');
        return 1;
    }
}

runChecks().then(code => process.exit(code)).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
