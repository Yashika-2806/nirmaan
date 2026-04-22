# TWIN AI - Quick Reference Guide

## 🚀 START HERE

### Setup (2 minutes)
```bash
# Linux/Mac
chmod +x setup.sh && ./setup.sh

# Windows
setup.bat
```

Then go to: **http://localhost:3000**

---

## 📡 API ENDPOINTS AT A GLANCE

### Run Code (Sample Tests)
```bash
curl -X POST http://localhost:5000/api/interview/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sourceCode": "print(\"hello\")",
    "language": "python",
    "questionId": "507f1f77bcf86cd799439011"
  }'
```

### Submit Code (All Tests)
```bash
curl -X POST http://localhost:5000/api/interview/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sourceCode": "print(\"hello\")",
    "language": "python",
    "questionId": "507f1f77bcf86cd799439011"
  }'
```

### Generate Test Cases
```bash
curl -X POST http://localhost:5000/api/interview/generate-test-cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "questionId": "507f1f77bcf86cd799439011",
    "count": 10,
    "includeEdgeCases": true
  }'
```

---

## 🧪 RESPONSE EXAMPLES

### Successful Run Response
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
        "passed": true
      },
      {
        "id": 2,
        "input": "0",
        "expected": "1",
        "output": "1",
        "passed": true
      }
    ],
    "summary": {
      "totalTests": 2,
      "passedTests": 2,
      "failedTests": 0
    }
  }
}
```

### Failed Run Response
```json
{
  "success": true,
  "data": {
    "executionId": "507f1f77bcf86cd799439013",
    "verdict": "Wrong Answer",
    "testCases": [
      {
        "id": 1,
        "input": "5",
        "expected": "120",
        "output": "24",
        "passed": false
      }
    ],
    "summary": {
      "totalTests": 1,
      "passedTests": 0,
      "failedTests": 1
    }
  }
}
```

### Compilation Error
```json
{
  "success": true,
  "data": {
    "executionId": "507f1f77bcf86cd799439014",
    "verdict": "Compilation Error",
    "testCases": [],
    "summary": {
      "totalTests": 0,
      "passedTests": 0,
      "failedTests": 0
    }
  }
}
```

---

## 🎯 COMMON TASKS

### 1. Create a New Problem

**Backend:**
```javascript
// POST /api/interview/questions
const question = {
  title: "Two Sum",
  description: "Given array, find two numbers that add to target",
  difficulty: "easy",
  category: "array",
  examples: [{
    input: "[2,7,11,15], 9",
    output: "[0,1]"
  }]
};
```

### 2. Add Test Cases

**Option A: Manual**
```javascript
// POST /api/interview/test-cases/create
const testCase = {
  questionId: "507f...",
  title: "Basic Example",
  input: "[2,7,11,15]\n9",
  expected: "[0,1]",
  isVisible: true,
  difficulty: "easy"
};
```

**Option B: AI Generation**
```bash
POST /api/interview/generate-test-cases
Body: {
  questionId: "507f...",
  count: 10,
  includeEdgeCases: true
}
```

### 3. Execute User Code

```typescript
// Frontend
import interviewExecutionService from '@/services/interviewExecutionService';

const result = await interviewExecutionService.runCode(
  sourceCode,
  'python',
  questionId
);

console.log(`Verdict: ${result.verdict}`);
console.log(`Passed: ${result.summary.passedTests}/${result.summary.totalTests}`);
```

### 4. Handle Async Execution

```typescript
// Request async execution
const { jobId } = await interviewExecutionService.runCode(
  code, language, questionId, 
  true  // async flag
);

// Poll for result
const result = await interviewExecutionService.pollJobUntilComplete(jobId);
```

---

## 📊 DATABASE QUERIES

### Get All Test Cases for Question
```javascript
db.test_cases.find({ questionId: ObjectId("507f...") })
```

### Get User Executions
```javascript
db.execution_results.find({ userId: ObjectId("507f...") })
  .sort({ createdAt: -1 })
  .limit(10)
```

### Get Problem Stats
```javascript
db.interview_questions.aggregate([
  {
    $lookup: {
      from: "execution_results",
      localField: "_id",
      foreignField: "questionId",
      as: "submissions"
    }
  },
  {
    $project: {
      title: 1,
      difficulty: 1,
      totalSubmissions: { $size: "$submissions" },
      acceptanceRate: {
        $divide: [
          { $size: { $filter: {
            input: "$submissions",
            as: "sub",
            cond: { $eq: ["$$sub.verdict", "Accepted"] }
          }}},
          { $size: "$submissions" }
        ]
      }
    }
  }
])
```

---

## 🔧 ENVIRONMENT VARIABLES

### Required (for functionality)
```env
GEMINI_API_KEY=sk-xxxx          # AI test case generation
MONGODB_URI=mongodb://...       # Database
REDIS_HOST=redis                # Job queue
```

### Optional (fallback)
```env
JUDGE0_API_KEY=xxxx             # Code execution fallback
```

### Security
```env
JWT_SECRET=change_in_production
JWT_EXPIRE=7d
```

---

## 🐳 DOCKER COMMANDS

### Check Status
```bash
docker-compose ps                          # List containers
docker-compose logs -f backend             # Backend logs
docker exec nirmaan-backend npm run seed:questions  # Seed data
```

### Manage Services
```bash
docker-compose up -d               # Start all
docker-compose down                # Stop all
docker-compose restart backend     # Restart backend
docker-compose logs -f --tail=100  # Last 100 lines
```

### Direct Execution
```bash
docker exec nirmaan-backend bash
docker exec nirmaan-mongodb mongosh -u admin -p password
```

---

## 📈 MONITORING

### Check Service Health
```bash
# API Health
curl http://localhost:5000/api/health

# Database
docker exec nirmaan-mongodb mongosh -u admin -p password \
  --eval "db.adminCommand('ping')"

# Redis
docker exec nirmaan-redis redis-cli ping

# Docker
docker stats
```

### View Metrics
```bash
# Execution stats
db.execution_results.aggregate([
  { $group: {
    _id: "$verdict",
    count: { $sum: 1 }
  }}
])

# Popular questions
db.execution_results.aggregate([
  { $group: {
    _id: "$questionId",
    attempts: { $sum: 1 }
  }},
  { $sort: { attempts: -1 } }
])
```

---

## 🚨 ERROR CODES

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify JWT token |
| 404 | Not Found | Check resource ID |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Check logs |
| 503 | Unavailable | Docker/Redis down |

---

## ⚡ PERFORMANCE TIPS

1. **Use Async Execution** for heavy loads
   ```json
   { "async": true }
   ```

2. **Cache Test Cases**
   ```bash
   GET /api/interview/test-cases/:id
   # Response cached in Redis for 1 hour
   ```

3. **Batch Submissions** with job queue
   - Single request queues job
   - Poll for completion asynchronously

4. **Optimize Docker**
   - Pre-pull images: `docker pull python:3.11-slim`
   - Use resource limits to prevent overload

---

## 🔐 SECURITY CHECKLIST

- ✅ Change `JWT_SECRET` in production
- ✅ Use HTTPS in production
- ✅ Enable rate limiting (enabled by default)
- ✅ Use strong MongoDB passwords
- ✅ Run Docker with isolation (default)
- ✅ Keep API keys in environment variables
- ✅ Use MongoDB user authentication
- ✅ Enable CORS properly for frontend domain

---

## 📱 FRONTEND INTEGRATION

### Import Service
```typescript
import interviewExecutionService from '@/services/interviewExecutionService';
```

### Run Code
```typescript
try {
  const result = await interviewExecutionService.runCode(
    sourceCode,
    language,
    questionId
  );
  
  // Handle result
  if (interviewExecutionService.isPassed(result.verdict)) {
    console.log('✅ Sample tests passed!');
  } else {
    console.log('❌ Tests failed');
    console.log(result.testCases);
  }
} catch (error) {
  console.error('Execution failed:', error.message);
}
```

### Display Results
```typescript
{result.testCases.map(tc => (
  <div key={tc.id}>
    <p>Test {tc.id}: {tc.passed ? '✅' : '❌'}</p>
    <p>Input: {tc.input}</p>
    <p>Expected: {tc.expected}</p>
    <p>Got: {tc.output}</p>
  </div>
))}
```

---

## 🔄 API FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Monaco)                      │
│                  ├─ Write Code                          │
│                  ├─ Select Language                     │
│                  └─ Click Run/Submit                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────┐
        │ /run or /submit API    │
        └────────────┬───────────┘
                     │
        ┌────────────▼─────────────┐
        │ Validation + Auth        │
        │ • JWT token              │
        │ • Input validation       │
        │ • Rate limits            │
        └────────────┬─────────────┘
                     │
        ┌────────────▼──────────────┐
        │ Fetch Test Cases          │
        │ • Sample (run)            │
        │ • All (submit)            │
        └────────────┬──────────────┘
                     │
        ┌────────────▼──────────────────────┐
        │ Execute Code                      │
        │ • Docker Sandbox (primary)        │
        │ • Judge0 (fallback)               │
        └────────────┬──────────────────────┘
                     │
        ┌────────────▼──────────────┐
        │ Compare Results           │
        │ • Output vs Expected      │
        │ • Calculate Verdict       │
        └────────────┬──────────────┘
                     │
        ┌────────────▼──────────────┐
        │ Save Execution Result     │
        │ • MongoDB storage         │
        │ • User history            │
        └────────────┬──────────────┘
                     │
        ┌────────────▼──────────────┐
        │ Return Response           │
        │ • Verdict                 │
        │ • Test results            │
        │ • Timing info             │
        └────────────┬──────────────┘
                     │
                     ↓
        ┌────────────────────────┐
        │ Frontend Display        │
        │ • Show results          │
        │ • Highlight failures    │
        │ • Offer AI feedback     │
        └────────────────────────┘
```

---

## 💡 TIPS & TRICKS

### Seed Questions Locally
```bash
docker exec nirmaan-backend npm run seed:questions
```

### Test API Directly
```bash
# Export token
export TOKEN="your_jwt_token"

# Test endpoint
curl -X POST http://localhost:5000/api/interview/run \
  -H "Authorization: Bearer $TOKEN" \
  -d @request.json
```

### Debug Execution
```bash
# Get execution result with code
curl http://localhost:5000/api/interview/execution/507f... \
  -H "Authorization: Bearer $TOKEN"
```

### View Queue Status
```bash
# Check pending jobs
docker exec nirmaan-redis redis-cli
> llen bull:code-execution:1:wait
> lrange bull:code-execution:1:wait 0 10
```

---

## 📚 ADDITIONAL RESOURCES

- [Full Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [API Documentation](./IMPLEMENTATION_GUIDE.md#api-documentation)
- [Database Schema](./IMPLEMENTATION_GUIDE.md#database-schema)
- [Troubleshooting](./IMPLEMENTATION_GUIDE.md#troubleshooting)

---

**Happy coding! 🚀**
