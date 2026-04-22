# TWIN AI - Interview Preparation IDE
## Complete Implementation Guide

### TABLE OF CONTENTS

1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Setup Instructions](#setup-instructions)
4. [Configuration](#configuration)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Development](#development)

---

## ARCHITECTURE OVERVIEW

This is a **production-grade, distributed coding IDE** with the following architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
│                    React + Monaco Editor                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ API Routes   │  │ Auth         │  │ Job Queue        │  │
│  │ /run         │  │ Middleware   │  │ (Bull + Redis)   │  │
│  │ /submit      │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                     │
│  ┌────────────────────────────┐  ┌─────────────────────┐  │
│  │ Execution Engine            │  │ AI Services         │  │
│  │ ├─ Docker Sandbox           │  │ ├─ Gemini (Test Gen)│  │
│  │ ├─ Judge0 (Fallback)        │  │ ├─ Claude (Feedback)│  │
│  │ └─ Timeout/Memory Control   │  │ └─ Analysis         │  │
│  └────────────────────────────┘  └─────────────────────┘  │
│                     │
└─────────┬───────────┬───────────────────────────────────────┘
          │           │
      ┌───▼──────┐    │
      │  MongoDB │    │
      │  (Data)  │    │
      └──────────┘    │
                      │
                  ┌───▼──────────────┐    ┌────────────────┐
                  │ Docker Daemon    │    │ Redis (Cache)  │
                  │ (Sandbox Exec)   │    │ (Job Queue)    │
                  └──────────────────┘    └────────────────┘
```

### Key Components

- **Frontend**: Next.js with Monaco Editor for code editing
- **Backend**: Express.js with comprehensive validation
- **Execution**: Docker containers for secure isolation + Judge0 fallback
- **Database**: MongoDB for persistent storage
- **Cache**: Redis for job queue and caching
- **AI**: Gemini API for test case generation and feedback

---

## SYSTEM COMPONENTS

### 1. Backend Services

#### API Routes (`execution-routes-v2.js`)
- `POST /api/interview/run` - Execute code with sample test cases
- `POST /api/interview/submit` - Execute code with all test cases
- `POST /api/interview/generate-test-cases` - Generate test cases via AI
- `GET /api/interview/test-cases/:questionId` - Get test cases
- `GET /api/interview/execution/:executionId` - Get execution result
- `GET /api/interview/job/:jobId` - Get job status
- `GET /api/interview/attempts/:questionId` - Get user attempts

#### Models
- **TestCaseModel**: Stores test cases (sample + hidden)
- **ExecutionResultModel**: Tracks code executions
- **InterviewQuestionModel**: Problem statements and metadata

#### Execution Services
- **DockerSandboxExecutor** (`docker-sandbox.js`): Isolated Docker execution
- **Judge0Service** (`judge0-service.js`): Remote execution fallback
- **ExecutionQueue** (`execution-queue.js`): Job queue with Bull

#### AI Services
- **AITestCaseGenerator**: Generates test cases using Gemini API

### 2. Frontend Components

#### Services
- `interviewExecutionService.ts`: API wrapper for execution endpoints
  - `runCode()` - Submit code for sample testing
  - `submitCode()` - Submit code for final judging
  - `getTestCases()` - Fetch test cases
  - `generateTestCases()` - Generate new test cases
  - `pollJobUntilComplete()` - Poll async job results

#### Components
- `interview-ai-lab-page.tsx`: Main IDE interface
  - Monaco editor
  - Test case display
  - Result visualization
  - AI feedback integration

### 3. Infrastructure

- **MongoDB**: Persistent data storage
- **Redis**: Job queue + session cache
- **Docker**: Sandboxed code execution
- **Docker Compose**: Full stack orchestration

---

## SETUP INSTRUCTIONS

### Prerequisites

1. **Docker & Docker Compose** (required for sandbox execution)
   - Download: https://www.docker.com/products/docker-desktop

2. **API Keys** (optional for fallback)
   - Judge0 API: https://rapidapi.com/judge0-official/api/judge0-ce
   - Gemini API: https://ai.google.dev/

3. **Node.js** (for development)
   - v18+ required

### Quick Start

#### Option 1: Automated Setup (Recommended)

**On Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**On Windows:**
```batch
setup.bat
```

This will:
1. ✅ Verify Docker installation
2. ✅ Create environment configuration
3. ✅ Build Docker images
4. ✅ Start all services (MongoDB, Redis, Backend, Frontend)
5. ✅ Run health checks
6. ✅ Initialize database with sample data

#### Option 2: Manual Setup

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install && cd ..

# 2. Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Start Docker services
docker-compose up -d

# 4. Wait for services to be ready
sleep 10

# 5. Seed database with sample questions
docker exec nirmaan-backend npm run seed:questions
```

### Verify Installation

```bash
# Check all services are running
docker-compose ps

# Check MongoDB
docker exec nirmaan-mongodb mongosh -u admin -p password --eval "db.adminCommand('ping')"

# Check Redis
docker exec nirmaan-redis redis-cli ping

# Check Backend health
curl http://localhost:5000/api/health

# Access Frontend
open http://localhost:3000
```

---

## CONFIGURATION

### Environment Variables

#### Backend (`.env`)

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://admin:password@mongodb:27017/nirmaan?authSource=admin

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Code Execution
JUDGE0_API_KEY=your_judge0_key        # Optional, for fallback
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com

# AI Services
GEMINI_API_KEY=your_gemini_key        # Required for test case generation
ANTHROPIC_API_KEY=your_claude_key     # Optional

# Security
JWT_SECRET=change_this_in_production
JWT_EXPIRE=7d
FRONTEND_URLS=http://localhost:3000

# Docker
DOCKER_SOCKET=/var/run/docker.sock
```

#### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ENVIRONMENT=production
```

### Docker Configuration

#### Available Languages

The Docker sandbox supports:
- Python (3.11)
- Java (OpenJDK 17)
- C++ (GCC 12)
- JavaScript (Node.js 18)
- C (GCC 12)
- Go (1.21)
- Rust (1.70)

To add more languages, update `docker-sandbox.js`:

```javascript
this.images = {
    python: 'python:3.11-slim',
    java: 'openjdk:17-slim',
    // Add more...
};
```

#### Sandbox Limits

Configure in `docker-sandbox.js`:

```javascript
const timeLimit = options.timeLimit || 5; // seconds
const memoryLimit = options.memoryLimit || 128; // MB
```

---

## API DOCUMENTATION

### 1. Run Code (Sample Test Cases)

**Endpoint:** `POST /api/interview/run`

**Request Body:**
```json
{
  "sourceCode": "def solution():\n    print('hello')",
  "language": "python",
  "questionId": "507f1f77bcf86cd799439011",
  "async": false
}
```

**Response (Sync):**
```json
{
  "success": true,
  "data": {
    "executionId": "507f1f77bcf86cd799439012",
    "verdict": "Accepted",
    "testCases": [
      {
        "id": 1,
        "input": "5",
        "expected": "120",
        "output": "120",
        "passed": true,
        "error": null
      }
    ],
    "summary": {
      "totalTests": 1,
      "passedTests": 1,
      "failedTests": 0
    }
  }
}
```

**Response (Async):**
```json
{
  "success": true,
  "data": {
    "jobId": "code-execution-1234567890",
    "status": "queued",
    "message": "Code execution queued. Check status with the jobId."
  }
}
```

### 2. Submit Code (All Test Cases)

**Endpoint:** `POST /api/interview/submit`

**Request Body:**
```json
{
  "sourceCode": "def solution(n):\n    return n * (n + 1) // 2",
  "language": "python",
  "questionId": "507f1f77bcf86cd799439011",
  "sessionId": "507f1f77bcf86cd799439013",
  "async": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "507f1f77bcf86cd799439014",
    "verdict": "Accepted",
    "testCases": [...],
    "summary": {
      "totalTests": 10,
      "passedTests": 10,
      "failedTests": 0
    },
    "message": "✅ All test cases passed! Excellent solution."
  }
}
```

### 3. Generate Test Cases

**Endpoint:** `POST /api/interview/generate-test-cases`

**Request Body:**
```json
{
  "questionId": "507f1f77bcf86cd799439011",
  "count": 10,
  "includeEdgeCases": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 10,
    "testCases": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "title": "Test Case 1",
        "input": "5",
        "expected": "120",
        "explanation": "Factorial of 5",
        "isVisible": true,
        "difficulty": "easy"
      }
    ],
    "message": "Generated and saved 10 test cases"
  }
}
```

### 4. Get Test Cases

**Endpoint:** `GET /api/interview/test-cases/:questionId`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "testCases": [...]
  }
}
```

### 5. Get Execution Result

**Endpoint:** `GET /api/interview/execution/:executionId`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "type": "submit",
    "verdict": "Accepted",
    "language": "python",
    "testCases": [...],
    "summary": {
      "totalTests": 10,
      "passedTests": 10,
      "failedTests": 0
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 6. Get Job Status

**Endpoint:** `GET /api/interview/job/:jobId`

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "code-execution-1234567890",
    "state": "completed",
    "progress": 100,
    "result": {...}
  }
}
```

### Verdict Codes

| Verdict | Meaning |
|---------|---------|
| `Accepted` | All test cases passed |
| `Partial Accept` | Some test cases passed |
| `Wrong Answer` | Output mismatch |
| `Runtime Error` | Code crashed during execution |
| `Compilation Error` | Code failed to compile |
| `Time Limit Exceeded` | Execution took too long |
| `Memory Limit Exceeded` | Used too much memory |
| `Execution Error` | Unexpected error |

---

## DATABASE SCHEMA

### TestCase Collection

```javascript
{
  _id: ObjectId,
  questionId: ObjectId,      // Reference to question
  title: String,             // "Test Case 1"
  isVisible: Boolean,        // true = sample, false = hidden
  difficulty: String,        // easy, medium, hard, extreme
  input: String,             // Test input
  expected: String,          // Expected output
  explanation: String,       // Why this test case
  category: String,          // normal, edge_case, boundary, etc
  constraints: {
    timeLimit: Number,       // seconds
    memoryLimit: Number      // MB
  },
  generatedBy: String,       // manual, ai, seed
  aiModel: String,           // gemini-1.5-pro, etc
  executionHistory: [{       // Last 5 runs
    userId: ObjectId,
    passed: Boolean,
    executionTime: Number,
    memory: Number,
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### ExecutionResult Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // Who submitted
  questionId: ObjectId,      // Which problem
  sessionId: ObjectId,       // Interview session
  type: String,              // run or submit
  sourceCode: String,        // User's code
  language: String,          // python, java, cpp, etc
  verdict: String,           // Accepted, Wrong Answer, etc
  stdout: String,            // Program output
  stderr: String,            // Runtime errors
  compileOutput: String,     // Compilation errors
  executionTime: Number,     // milliseconds
  memory: Number,            // KB
  testCases: [{              // Results for each test
    id: Number,
    input: String,
    expected: String,
    output: String,
    passed: Boolean,
    error: String,
    time: Number,
    memory: Number
  }],
  summary: {
    totalTests: Number,
    passedTests: Number,
    failedTests: Number
  },
  executionEngine: String,   // docker or judge0
  containerId: String,       // Docker container ID
  aiFeedback: {              // AI analysis
    score: Number,
    strengths: [String],
    improvements: [String],
    timeComplexity: String,
    spaceComplexity: String,
    followUpQuestions: [String],
    generatedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### InterviewQuestion Collection

```javascript
{
  _id: ObjectId,
  title: String,             // "Two Sum"
  description: String,       // Problem statement
  difficulty: String,        // easy, medium, hard
  category: String,          // array, string, tree, etc
  tags: [String],            // Search tags
  functionSignature: String, // Function to implement
  constraints: String,       // Constraints description
  examples: [{               // Sample I/O
    input: String,
    output: String,
    explanation: String
  }],
  solutions: [{              // Reference solutions
    title: String,
    approach: String,
    timeComplexity: String,
    spaceComplexity: String,
    code: String,
    language: String
  }],
  companies: [String],       // Google, Amazon, etc
  frequencyScore: Number,    // Interview frequency
  stats: {
    totalAttempts: Number,
    totalSubmissions: Number,
    acceptanceRate: Number,
    averageTime: Number      // seconds
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## DEPLOYMENT

### Development

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Access at http://localhost:3000
```

### Production with Docker

```bash
# Build and run
docker-compose -f docker-compose.yml up -d

# Check logs
docker-compose logs -f backend

# Scale execution workers (if using Kubernetes)
kubectl scale deployment backend --replicas=3
```

### Environment Setup

1. **Update `.env` with production values:**
   ```bash
   NODE_ENV=production
   JWT_SECRET=$(openssl rand -hex 32)
   JUDGE0_API_KEY=your_production_key
   GEMINI_API_KEY=your_production_key
   ```

2. **Enable SSL/TLS:**
   ```bash
   # Configure nginx or cloudflare in front of Docker containers
   ```

3. **Setup monitoring:**
   ```bash
   # Add Sentry, DataDog, or similar for error tracking
   ```

### Scaling Considerations

- **Execution Queue**: Redis queue scales to thousands of jobs
- **Database**: MongoDB replica set for high availability
- **API**: Horizontal scaling with load balancer
- **Docker**: Use Docker Swarm or Kubernetes for container orchestration

---

## TROUBLESHOOTING

### Common Issues

#### 1. Docker Daemon Not Running

```bash
# macOS/Windows: Start Docker Desktop from Applications

# Linux: Start Docker service
sudo systemctl start docker
```

#### 2. Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

#### 3. MongoDB Connection Failure

```bash
# Check MongoDB logs
docker logs nirmaan-mongodb

# Verify credentials in .env
# Default: admin / password

# Restart MongoDB
docker restart nirmaan-mongodb
```

#### 4. Test Cases Not Generating

```bash
# Verify Gemini API key
echo $GEMINI_API_KEY

# Check backend logs
docker logs nirmaan-backend | grep -i gemini

# Try manual seed
docker exec nirmaan-backend npm run seed:questions
```

#### 5. Code Execution Timeout

```bash
# Increase timeout in docker-sandbox.js
const timeLimit = 30; // increase from 5

# Rebuild backend
docker-compose build backend
```

#### 6. Out of Memory

```bash
# Check Docker memory limits
docker stats

# Increase Docker memory allocation
# In Docker Desktop: Preferences → Resources → Memory (increase to 4GB+)

# Or set memory limit for containers
# In docker-compose.yml:
#   services:
#     backend:
#       deploy:
#         resources:
#           limits:
#             memory: 2G
```

### Debugging

Enable verbose logging:

```bash
# Backend
NODE_DEBUG=* npm start

# Check specific module logs
docker logs nirmaan-backend | grep -i "execution\|docker\|judge0"
```

---

## DEVELOPMENT

### Project Structure

```
Nirmaan/
├── backend/
│   ├── src/
│   │   ├── server.js                    # Entry point
│   │   ├── core/
│   │   │   ├── code-executor/
│   │   │   │   ├── docker-sandbox.js   # Docker execution
│   │   │   │   ├── judge0-service.js   # Judge0 fallback
│   │   │   │   └── execution-queue.js  # Job queue
│   │   │   ├── ai/
│   │   │   │   └── gemini-service.js   # AI integration
│   │   │   └── utils/
│   │   ├── modules/
│   │   │   └── interview/
│   │   │       ├── execution-routes-v2.js  # API routes
│   │   │       ├── ai-test-case-generator.js
│   │   │       └── models/
│   │   │           ├── test-case-model.js
│   │   │           ├── execution-result-model.js
│   │   │           └── interview-question-model.js
│   │   └── routes/
│   ├── scripts/
│   │   └── seed-questions.js            # Database seed
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   └── interview/
│   │   │       └── interview-ai-lab-page.tsx  # Main IDE
│   │   └── services/
│   │       └── interviewExecutionService.ts   # API client
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── setup.sh
├── setup.bat
└── README.md
```

### Code Style

- **Backend**: Node.js ES6+ with async/await
- **Frontend**: TypeScript with React best practices
- Use Prettier for formatting
- ESLint for linting

### Testing

```bash
# Backend tests
npm test

# Frontend tests
npm run test:frontend

# Integration tests
npm run test:integration
```

### Adding New Languages

1. **Update docker-sandbox.js:**
   ```javascript
   this.images = {
       // ...
       ruby: 'ruby:3.2-alpine',
   };
   
   getLanguageConfig(language) {
       const configs = {
           // ...
           ruby: {
               entrypoint: ['ruby', 'solution.rb'],
               workingDir: '/app',
               filename: 'solution.rb',
           },
       };
   }
   ```

2. **Update API validation** in `execution-routes-v2.js`:
   ```javascript
   language: Joi.string().required().lowercase().valid(
       'python', 'java', 'cpp', 'javascript', 'c', 'go', 'rust', 'ruby'
   ),
   ```

3. **Update AI prompt** in `ai-test-case-generator.js` with Ruby examples

4. **Pull Docker image:**
   ```bash
   docker pull ruby:3.2-alpine
   ```

---

## SUPPORT

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Review [API Documentation](#api-documentation)
3. Check [Troubleshooting](#troubleshooting) section
4. Review backend error responses

---

## NEXT STEPS

1. ✅ Copy `.env` values from `.env.example`
2. ✅ Run `setup.sh` or `setup.bat`
3. ✅ Access frontend at `http://localhost:3000`
4. ✅ Create interview session to start solving problems
5. ✅ Monitor execution with `docker-compose logs`

---

**Happy coding! 🚀**
