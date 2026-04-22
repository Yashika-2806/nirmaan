# TWIN AI - Production-Grade Interview Preparation IDE

> Transform your coding interview preparation with an LeetCode-like IDE, AI-powered feedback, and automated test case generation.

## 🎯 What's New in This Version?

### ✅ FULLY IMPLEMENTED FEATURES

1. **Real-Time Code Execution**
   - Docker sandbox for secure, isolated execution
   - Support for Python, Java, C++, JavaScript, Go, Rust, C
   - Timeout protection (prevent infinite loops)
   - Memory limits (prevent memory abuse)

2. **Comprehensive Test Case System**
   - Sample test cases (visible to users)
   - Hidden test cases (for final submission judging)
   - AI-powered test case generation
   - Edge case and corner case detection

3. **Two Execution Modes**
   - **Run**: Execute against sample test cases (immediate feedback)
   - **Submit**: Execute against all hidden test cases (final judgment)

4. **Asynchronous Job Queue**
   - Bull queue backed by Redis
   - Handle multiple concurrent submissions
   - Job status polling with `/job/:jobId` endpoint
   - Automatic retry on failures

5. **AI Integration**
   - Gemini API for test case generation
   - Claude API for code feedback (extensible)
   - Automatic analysis of strengths and improvements

6. **Complete Backend API**
   - REST endpoints for all operations
   - Comprehensive error handling
   - Input validation with Joi
   - Detailed execution results

7. **Production Infrastructure**
   - Docker Compose for full stack
   - MongoDB for data persistence
   - Redis for caching and job queue
   - Nginx-ready configuration

## 📋 QUICK START

### Minimum Requirements
- Docker Desktop (required for sandbox)
- API Keys: Gemini (for test generation)

### One-Line Setup

**macOS/Linux:**
```bash
chmod +x setup.sh && ./setup.sh
```

**Windows:**
```batch
setup.bat
```

Then access: **http://localhost:3000**

## 🏗️ ARCHITECTURE

```
User Browser
    ↓
Next.js Frontend (Monaco Editor)
    ↓
Express.js Backend API
    ├─→ Docker Sandbox (Python, Java, C++, JS...)
    ├─→ Redis Queue (Bull Job Queue)
    ├─→ MongoDB (Data Persistence)
    ├─→ Gemini AI (Test Generation)
    └─→ Judge0 API (Fallback)
```

## 🚀 MAIN FEATURES

### 1. Code Execution Engine

- **Secure Isolation**: Each run executes in a fresh Docker container
- **Resource Limits**: CPU, memory, and time constraints enforced
- **Multiple Languages**: 7+ languages supported out-of-box
- **Instant Feedback**: Complete results in < 5 seconds

### 2. Test Case System

```json
{
  "testCases": [
    {
      "id": 1,
      "title": "Basic Example",
      "input": "5",
      "expected": "120",
      "isVisible": true,      // Sample (shown to user)
      "category": "normal",
      "difficulty": "easy"
    },
    {
      "id": 2,
      "title": "Edge Case",
      "input": "0",
      "expected": "1",
      "isVisible": false,     // Hidden (used for judging)
      "category": "edge_case"
    }
  ]
}
```

### 3. Execution Flow

#### Run (Sample Testing)
```
User Code
  ↓
Run Button
  ↓
Docker Execution (Sample Test Cases)
  ↓
Compare Output vs Expected
  ↓
Display Results (Passed/Failed)
```

#### Submit (Final Judging)
```
User Code
  ↓
Submit Button
  ↓
Queue Job (Redis Bull)
  ↓
Docker Execution (All Test Cases - Sample + Hidden)
  ↓
Calculate Verdict
  ↓
Store Result
  ↓
AI Analysis (Optional)
  ↓
Display Verdict
```

### 4. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/interview/run` | POST | Execute on sample test cases |
| `/api/interview/submit` | POST | Execute on all test cases |
| `/api/interview/test-cases/:id` | GET | Fetch test cases |
| `/api/interview/generate-test-cases` | POST | Generate via AI |
| `/api/interview/execution/:id` | GET | Get execution result |
| `/api/interview/job/:jobId` | GET | Get job status |
| `/api/interview/attempts/:id` | GET | User's previous attempts |

## 📊 VERDICT CODES

| Code | Status | Meaning |
|------|--------|---------|
| ✅ Accepted | PASS | All tests passed |
| ⚠️ Partial Accept | PASS | Some tests passed |
| ❌ Wrong Answer | FAIL | Output mismatch |
| 🔴 Runtime Error | FAIL | Code crashed |
| 🔴 Compilation Error | FAIL | Code didn't compile |
| ⏱️ Time Limit Exceeded | FAIL | Too slow |
| 💾 Memory Limit Exceeded | FAIL | Too much memory |
| ❌ Execution Error | FAIL | Unknown error |

## 🔧 CONFIGURATION

### Environment Variables (`.env`)

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://admin:password@mongodb:27017/nirmaan

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# AI
GEMINI_API_KEY=your_gemini_key_here

# Judge0 (Optional fallback)
JUDGE0_API_KEY=your_judge0_key
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com

# Security
JWT_SECRET=change_me_in_production
```

## 📦 SUPPORTED LANGUAGES

```python
"python",      # Python 3.11
"java",        # OpenJDK 17
"cpp",         # GCC 12
"javascript",  # Node.js 18
"c",           # GCC 12
"go",          # Go 1.21
"rust",        # Rust 1.70
```

## 🎓 TYPICAL USAGE

### For Students
1. ✅ Log in to interview prep platform
2. ✅ Select a DSA problem (Two Sum, Reverse String, etc.)
3. ✅ Write solution in Monaco editor
4. ✅ Click "Run" to test on sample cases
5. ✅ Click "Submit" for final judging
6. ✅ Get AI feedback and analysis

### For Instructors
1. ✅ Create problems with descriptions
2. ✅ Auto-generate test cases via AI
3. ✅ Review student submissions
4. ✅ Track progress and weak areas

## 🔐 SECURITY FEATURES

- ✅ **Isolated Containers**: No access to host system
- ✅ **No Network**: Containers run with `--network=none`
- ✅ **Resource Limits**: CPU, memory, PID limits enforced
- ✅ **Timeout Protection**: 5-60 second execution limits
- ✅ **Input Validation**: Joi schema validation on all endpoints
- ✅ **Authentication**: JWT-based user auth required
- ✅ **Rate Limiting**: DDoS protection on API

## 📈 PERFORMANCE

| Operation | Time | Notes |
|-----------|------|-------|
| Run (Sample) | 0.5-2s | Immediate feedback |
| Submit | 2-10s | All test cases |
| Test Generation | 3-5s | AI powered |
| Async Job | 1-60s | Configurable timeout |

## 🐛 DEBUGGING

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker logs nirmaan-backend -f

# Search logs
docker logs nirmaan-backend 2>&1 | grep "error\|execution"
```

### Test Locally
```bash
# Start single service
docker-compose up mongodb redis

# Run backend locally
cd backend && npm run dev

# Run frontend locally
cd frontend && npm run dev
```

## 📚 DOCUMENTATION

For detailed documentation:
- **Setup Guide**: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- **API Reference**: See section "API Documentation" in IMPLEMENTATION_GUIDE.md
- **Database Schema**: See section "Database Schema" in IMPLEMENTATION_GUIDE.md
- **Architecture**: See "Architecture Overview" in IMPLEMENTATION_GUIDE.md

## 🆚 FEATURES COMPARISON

| Feature | Our IDE | LeetCode | HackerRank |
|---------|---------|----------|-----------|
| Real-time Execution | ✅ | ✅ | ✅ |
| Multi-Language | ✅ (7) | ✅ (20+) | ✅ (20+) |
| Test Case Generation | ✅ AI | ❌ | ❌ |
| AI Feedback | ✅ | ❌ | ❌ |
| Async Job Queue | ✅ | ✅ | ✅ |
| Docker Sandbox | ✅ | ✅ | ? |
| Open Source | ✅ | ❌ | ❌ |
| Self-Hosted | ✅ | ❌ | ❌ |

## 🚢 DEPLOYMENT

### Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Kubernetes (Production)
```bash
kubectl apply -f k8s/
```

### Cloud (AWS/GCP/Azure)
- Dockerize: `docker build -t myregistry/nirmaan-backend:v1 .`
- Push: `docker push myregistry/nirmaan-backend:v1`
- Deploy: Use ECS, Cloud Run, or AKS

## 🤝 CONTRIBUTING

To add features or fix issues:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 LICENSE

MIT License - Feel free to use for commercial projects

## 🎯 NEXT STEPS

1. **Run Setup**
   ```bash
   ./setup.sh  # or setup.bat on Windows
   ```

2. **Access Dashboard**
   ```
   http://localhost:3000
   ```

3. **Create Interview Session**
   - Select company (Google, Amazon, etc.)
   - Choose difficulty (Easy, Medium, Hard)
   - Get 5 random DSA problems

4. **Solve Problems**
   - Write code in editor
   - Click "Run" for sample testing
   - Click "Submit" for final judging

5. **Get Feedback**
   - AI analyzes your solution
   - Shows strengths and improvements
   - Tracks your progress

## 🆘 TROUBLESHOOTING

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

### Docker Not Running
```bash
# Start Docker Desktop (macOS/Windows)
# or
sudo systemctl start docker  # Linux
```

### Test Cases Not Generating
```bash
# Check API key
echo $GEMINI_API_KEY

# Manually seed
docker exec nirmaan-backend npm run seed:questions
```

### Memory Issues
```bash
# Increase Docker memory to 4GB+
# Docker Desktop → Preferences → Resources → Memory
```

## 📞 SUPPORT

- **Documentation**: See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- **Issues**: Check Troubleshooting section
- **Logs**: `docker-compose logs -f`

---

**Built with ❤️ for interview prep warriors**

[⬆ Back to top](#twin-ai---production-grade-interview-preparation-ide)
