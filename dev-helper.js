#!/usr/bin/env node

/**
 * Career OS - Development Helper Script
 * Run with: node dev-helper.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
    log('\n' + '='.repeat(60), 'cyan');
    log(`  ${text}`, 'bright');
    log('='.repeat(60), 'cyan');
}

function checkFile(filePath, description) {
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    const color = exists ? 'green' : 'red';
    log(`${status} ${description}`, color);
    return exists;
}

function checkEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        log(`❌ ${filePath} not found`, 'red');
        return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const required = [
        'MONGODB_URI',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'ENCRYPTION_KEY',
        'GEMINI_KEY_1',
    ];

    const missing = required.filter(key => !content.includes(`${key}=`) || content.includes(`${key}=your-`));

    if (missing.length > 0) {
        log(`⚠️  Missing or not configured: ${missing.join(', ')}`, 'yellow');
        return false;
    }

    log('✅ All required environment variables configured', 'green');
    return true;
}

function displayProjectStatus() {
    header('Career OS - Project Status');

    log('\n📂 Project Structure:', 'bright');
    checkFile('backend/package.json', 'Backend package.json');
    checkFile('backend/src/server.js', 'Backend server');
    checkFile('backend/src/core/ai-key-manager/manager.js', 'AI Key Manager');
    checkFile('backend/src/modules/dsa/service.js', 'DSA Module');
    checkFile('frontend/package.json', 'Frontend package.json');
    checkFile('frontend/src/app/page.tsx', 'Frontend landing page');

    log('\n🔐 Environment Configuration:', 'bright');
    const backendEnv = checkEnvFile('backend/.env');
    const frontendEnv = checkFile('frontend/.env.local', 'Frontend .env.local');

    log('\n📚 Documentation:', 'bright');
    checkFile('ARCHITECTURE.md', 'Architecture documentation');
    checkFile('QUICKSTART.md', 'Quick start guide');
    checkFile('DEPLOYMENT.md', 'Deployment guide');
    checkFile('NEXT_STEPS.md', 'Development roadmap');

    log('\n📦 Dependencies:', 'bright');
    const backendModules = fs.existsSync('backend/node_modules');
    const frontendModules = fs.existsSync('frontend/node_modules');

    checkFile('backend/node_modules', 'Backend dependencies installed');
    checkFile('frontend/node_modules', 'Frontend dependencies installed');

    log('\n🎯 Next Steps:', 'bright');

    if (!backendEnv) {
        log('1. Configure backend/.env file', 'yellow');
        log('   - Copy backend/.env.example to backend/.env', 'yellow');
        log('   - Add MongoDB URI, JWT secrets, and Gemini API keys', 'yellow');
    }

    if (!backendModules) {
        log('2. Install backend dependencies: cd backend && npm install', 'yellow');
    }

    if (!frontendModules) {
        log('3. Install frontend dependencies: cd frontend && npm install', 'yellow');
    }

    if (backendEnv && backendModules && frontendModules) {
        log('✅ All setup complete! Ready to run:', 'green');
        log('   Backend:  cd backend && npm run dev', 'cyan');
        log('   Frontend: cd frontend && npm run dev', 'cyan');
    }

    log('\n📖 Documentation:', 'bright');
    log('   Start here: INDEX.md', 'cyan');
    log('   Quick setup: QUICKSTART.md', 'cyan');
    log('   Build guide: NEXT_STEPS.md', 'cyan');

    log('');
}

function generateSecrets() {
    header('Generate Secrets');

    const crypto = require('crypto');

    log('\nCopy these to your backend/.env file:\n', 'bright');
    log(`JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`, 'green');
    log(`JWT_REFRESH_SECRET=${crypto.randomBytes(32).toString('hex')}`, 'green');
    log(`ENCRYPTION_KEY=${crypto.randomBytes(16).toString('hex')}`, 'green');
    log('');
}

function showModuleTemplate() {
    header('Create New Module Template');

    log('\nTo create a new module, run:', 'bright');
    log('  node dev-helper.js create-module <module-name>\n', 'cyan');
    log('Example:', 'bright');
    log('  node dev-helper.js create-module resume\n', 'cyan');
}

function createModule(moduleName) {
    if (!moduleName) {
        log('❌ Please provide a module name', 'red');
        log('Usage: node dev-helper.js create-module <module-name>', 'yellow');
        return;
    }

    header(`Creating Module: ${moduleName}`);

    const modulePath = path.join('backend', 'src', 'modules', moduleName);

    if (fs.existsSync(modulePath)) {
        log(`❌ Module ${moduleName} already exists!`, 'red');
        return;
    }

    // Create directory
    fs.mkdirSync(modulePath, { recursive: true });
    log(`✅ Created directory: ${modulePath}`, 'green');

    // Create files
    const files = ['model.js', 'service.js', 'controller.js', 'routes.js', 'ai-wrapper.js'];

    files.forEach(file => {
        const filePath = path.join(modulePath, file);
        fs.writeFileSync(filePath, `// ${moduleName} ${file}\n// TODO: Implement ${moduleName} module\n`);
        log(`✅ Created: ${file}`, 'green');
    });

    log('\n📝 Next steps:', 'bright');
    log(`1. Implement files in: ${modulePath}`, 'cyan');
    log(`2. Register routes in: backend/src/routes/index.js`, 'cyan');
    log(`3. Create frontend page in: frontend/src/app/(dashboard)/dashboard/${moduleName}/`, 'cyan');
    log('\n💡 Tip: Copy DSA module structure as reference!', 'yellow');
}

function showHelp() {
    header('Career OS - Development Helper');

    log('\nAvailable commands:\n', 'bright');
    log('  node dev-helper.js status          - Show project status', 'cyan');
    log('  node dev-helper.js secrets         - Generate JWT secrets', 'cyan');
    log('  node dev-helper.js create-module <name> - Create new module', 'cyan');
    log('  node dev-helper.js help            - Show this help', 'cyan');
    log('');
}

// Main
const command = process.argv[2];

switch (command) {
    case 'status':
        displayProjectStatus();
        break;
    case 'secrets':
        generateSecrets();
        break;
    case 'create-module':
        createModule(process.argv[3]);
        break;
    case 'help':
        showHelp();
        break;
    default:
        displayProjectStatus();
        log('\n💡 Run "node dev-helper.js help" for more commands\n', 'yellow');
}
