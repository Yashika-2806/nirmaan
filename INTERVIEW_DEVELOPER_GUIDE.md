# Interview Platform - Developer Integration Guide

This guide explains how to integrate the interview platform into your application and customize it.

## Table of Contents
1. [Installation](#installation)
2. [Component Integration](#component-integration)
3. [API Integration](#api-integration)
4. [Customization](#customization)
5. [Extending Features](#extending-features)

---

## Installation

### Backend Setup

The backend is already configured. Key components:

```
backend/src/modules/interview/
├── execution-routes-v2.js      # Code execution endpoints
├── routes.js                    # Session management endpoints
├── proctor-routes.js            # Proctoring endpoints
├── models/
│   ├── interview-question-model.js
│   ├── test-case-model.js
│   └── execution-result-model.js
├── ai-test-case-generator.js    # AI-powered test generation
└── service.js                   # Business logic
```

### Frontend Components

Pre-built components available:

```
frontend/src/components/interview/
├── interview-ai-lab-page-v2.tsx        # Main IDE component
├── interview-problems-page.tsx          # Problem browser
├── test-cases-panel.tsx                 # Test case viewer
├── ai-interview-feedback.tsx            # AI feedback display
├── proctored-interview-shell.tsx        # Proctoring wrapper
└── submission-modals.tsx                # Result display
```

---

## Component Integration

### 1. Embed the Interview IDE

**Simple Integration:**

```tsx
import InterviewAiLabPageV2 from '@/components/interview/interview-ai-lab-page-v2';

export default function MyPage() {
  const problemData = {
    id: 'problem-123',
    title: 'Two Sum',
    description: 'Find two numbers that add up to target',
    difficulty: 'Easy',
    category: 'Array',
    functionSignature: 'function twoSum(nums, target)',
    starterCode: {
      python: 'def twoSum(nums, target):\n    pass',
      javascript: 'function twoSum(nums, target) {\n\n}'
    }
  };

  return (
    <InterviewAiLabPageV2
      questionId="problem-123"
      question={problemData}
      sessionId="session-456"
    />
  );
}
```

### 2. Embed Problem Browser

**Simple Integration:**

```tsx
import InterviewProblemsPage from '@/components/interview/interview-problems-page';

export default function ProblemsPage() {
  return <InterviewProblemsPage />;
}
```

### 3. Custom Interview Page

**With Custom Navigation:**

```tsx
'use client';

import { useState } from 'react';
import InterviewAiLabPageV2 from '@/components/interview/interview-ai-lab-page-v2';
import { ChevronLeft } from 'lucide-react';

export default function CustomInterviewPage() {
  const [selectedProblem, setSelectedProblem] = useState(null);

  const handleProblemSelect = (problemId, problemData) => {
    setSelectedProblem({ id: problemId, data: problemData });
  };

  if (!selectedProblem) {
    return (
      <div>
        {/* Your custom problem list */}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 p-4 border-b">
        <button
          onClick={() => setSelectedProblem(null)}
          className="flex items-center gap-2"
        >
          <ChevronLeft />
          Back
        </button>
        <h1>{selectedProblem.data.title}</h1>
      </div>
      
      <InterviewAiLabPageV2
        questionId={selectedProblem.id}
        question={selectedProblem.data}
      />
    </div>
  );
}
```

---

## API Integration

### 1. Authentication

All endpoints require authentication:

```typescript
import api from '@/lib/axios';

// Automatic token handling (already configured in axios instance)
const response = await api.get('/interview/problems');
```

### 2. Code Execution

**Run Code (Sync):**

```typescript
import InterviewExecutionService from '@/services/interviewExecutionService';

const result = await InterviewExecutionService.runCode(
  sourceCode,
  'python',
  questionId,
  false  // false = sync
);

console.log(result.verdict);      // 'Accepted', 'Wrong Answer', etc.
console.log(result.summary);      // { totalTests, passedTests, failedTests }
console.log(result.testCases);    // Array of test results
```

**Submit Code (Sync):**

```typescript
const result = await InterviewExecutionService.submitCode(
  sourceCode,
  'python',
  questionId,
  sessionId,
  false  // false = sync
);

if (result.verdict === 'Accepted') {
  console.log('🎉 All tests passed!');
} else {
  console.log(`❌ ${result.verdict}`);
}
```

### 3. Problem Management

**Get All Problems:**

```typescript
const response = await api.get(
  '/interview/problems?difficulty=Easy&category=Array&page=1&limit=20'
);

console.log(response.data.data.problems);
console.log(response.data.data.pagination);
```

**Search Problems:**

```typescript
const response = await api.get(
  '/interview/problems/search?q=two&difficulty=Easy'
);

console.log(response.data.data.results);
```

**Get Problem Details:**

```typescript
const response = await api.get(`/interview/problems/${problemId}`);

const problem = response.data.data;
console.log(problem.title);
console.log(problem.description);
console.log(problem.examples);
console.log(problem.starterCode);
```

### 4. Test Cases

**Get Test Cases:**

```typescript
const response = await api.get(`/interview/test-cases/${questionId}`);

console.log(response.data.data.testCases);
```

**Generate Test Cases (AI):**

```typescript
const response = await api.post('/interview/generate-test-cases', {
  questionId,
  count: 10,
  includeEdgeCases: true
});

console.log(response.data.data.testCases);
```

### 5. Execution History

**Get User Attempts:**

```typescript
const response = await api.get(`/interview/attempts/${questionId}`);

console.log(response.data.data.attempts);
// Shows: _id, type, verdict, language, summary, createdAt
```

---

## Customization

### 1. Custom Styling

**Theme Customization:**

```tsx
// Create a wrapper component
import InterviewAiLabPageV2 from '@/components/interview/interview-ai-lab-page-v2';

export default function ThemedIDE({ theme = 'dark' }) {
  return (
    <div className={`interview-ide interview-ide--${theme}`}>
      <style>{`
        .interview-ide--light {
          --bg-primary: #ffffff;
          --text-primary: #000000;
        }
        .interview-ide--dark {
          --bg-primary: #1e293b;
          --text-primary: #ffffff;
        }
      `}</style>
      <InterviewAiLabPageV2 />
    </div>
  );
}
```

### 2. Custom Verdict Messages

**Extend verdict handling:**

```typescript
const VERDICT_MESSAGES = {
  'Accepted': '✅ Perfect solution!',
  'Wrong Answer': '❌ Output doesn\'t match. Try debugging.',
  'Time Limit Exceeded': '⏱️ Optimize your algorithm.',
  // Add more...
};

const message = VERDICT_MESSAGES[verdict];
```

### 3. Custom Execution Options

**Add execution parameters:**

```typescript
const runWithOptions = async (code, language, questionId, options = {}) => {
  return InterviewExecutionService.runCode(
    code,
    language,
    questionId,
    options.async || false
  );
};
```

---

## Extending Features

### 1. Add More Problems

**Seed Custom Problems:**

```javascript
// backend/scripts/seed-custom-problems.js
const InterviewQuestion = require('../src/modules/interview/models/interview-question-model');

const customProblems = [
  {
    title: 'Your Custom Problem',
    description: 'Problem description...',
    difficulty: 'Easy',
    category: 'Custom',
    // ... other fields
  }
];

InterviewQuestion.insertMany(customProblems);
```

### 2. Add Plagiarism Detection

**Extend submission handler:**

```typescript
// After successful submission
const checkPlagiarism = async (submissionId, code) => {
  const response = await api.post('/interview/plagiarism-check', {
    submissionId,
    code
  });
  
  return response.data.data.similarity;
};
```

### 3. Add Analytics

**Track user progress:**

```typescript
import api from '@/lib/axios';

const getAnalytics = async (userId) => {
  const response = await api.get(`/interview/analytics/${userId}`);
  
  return {
    totalSolved: response.data.data.totalSolved,
    successRate: response.data.data.successRate,
    averageTime: response.data.data.averageTime,
    categoryStats: response.data.data.categoryStats
  };
};
```

### 4. Add Real-time Collaboration

**Stream execution results:**

```typescript
// WebSocket integration
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('execution:result', (result) => {
  console.log('Execution completed:', result);
  // Update UI in real-time
});
```

### 5. Add Hints System

**Problem with hints:**

```typescript
const getProblemWithHints = async (problemId) => {
  const response = await api.get(`/interview/problems/${problemId}`);
  
  return {
    ...response.data.data,
    hints: [
      'Hint 1: Consider using a hash table',
      'Hint 2: What data structure could help here?',
      'Hint 3: Think about time complexity'
    ]
  };
};
```

---

## Advanced Patterns

### 1. Session Management

```typescript
// Create interview session
const startSession = async (sessionData) => {
  const response = await api.post('/interview/start', sessionData);
  return response.data.data;
};

// Submit answer
const evaluateAnswer = async (sessionId, questionId, answer) => {
  const response = await api.post('/interview/evaluate', {
    sessionId,
    questionId,
    answer
  });
  return response.data.data;
};

// Complete session
const completeSession = async (sessionId) => {
  const response = await api.post('/interview/complete', { sessionId });
  return response.data.data;
};
```

### 2. Proctored Interview

```tsx
import ProctoredInterviewShell from '@/components/interview/proctored-interview-shell';

export default function ProctoredPage() {
  return (
    <ProctoredInterviewShell
      problemId="..."
      onViolation={(violation) => {
        console.log('Violation detected:', violation);
      }}
      onTimeUp={() => {
        console.log('Time is up!');
      }}
    />
  );
}
```

### 3. Performance Optimization

```typescript
// Memoize problem data
import { useMemo } from 'react';

export default function OptimizedIDE() {
  const memoizedProblem = useMemo(
    () => fetchProblem(problemId),
    [problemId]
  );

  return <InterviewAiLabPageV2 question={memoizedProblem} />;
}
```

---

## Error Handling

**Best Practices:**

```typescript
async function robustCodeExecution(code, language, questionId) {
  try {
    const result = await InterviewExecutionService.runCode(
      code,
      language,
      questionId
    );
    
    if (result.verdict === 'Execution Error') {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    if (error.response?.status === 401) {
      // Handle auth error
      redirectToLogin();
    } else if (error.response?.status === 404) {
      // Problem not found
      showErrorMessage('Problem not found');
    } else {
      // Generic error
      console.error('Execution failed:', error.message);
      showErrorMessage(error.message);
    }
    
    throw error;
  }
}
```

---

## Performance Tuning

### 1. Code Splitting

```typescript
// Load IDE components on demand
const InterviewIDE = dynamic(
  () => import('@/components/interview/interview-ai-lab-page-v2'),
  { ssr: false, loading: () => <LoadingSpinner /> }
);
```

### 2. Result Caching

```typescript
// Cache test case results
import { useCallback } from 'react';

const useTestCaseCache = () => {
  const cacheRef = useRef(new Map());
  
  const getOrFetch = useCallback(async (questionId) => {
    if (!cacheRef.current.has(questionId)) {
      const testCases = await InterviewExecutionService.getTestCases(questionId);
      cacheRef.current.set(questionId, testCases);
    }
    return cacheRef.current.get(questionId);
  }, []);
  
  return { getOrFetch };
};
```

---

## Testing

### Unit Tests

```javascript
// test/interview.test.js
describe('Interview Execution', () => {
  it('should accept correct solution', async () => {
    const result = await InterviewExecutionService.runCode(
      correctCode,
      'python',
      problemId
    );
    
    expect(result.verdict).toBe('Accepted');
  });
  
  it('should detect wrong answer', async () => {
    const result = await InterviewExecutionService.runCode(
      wrongCode,
      'python',
      problemId
    );
    
    expect(result.verdict).toBe('Wrong Answer');
  });
});
```

---

## Deployment

### Production Checklist

- [ ] Configure environment variables
- [ ] Set up MongoDB backup
- [ ] Configure Redis persistence
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Configure CORS
- [ ] Set up monitoring/logging
- [ ] Load test the platform
- [ ] Security audit
- [ ] Backup test data

---

## Support & Resources

- **Documentation:** [INTERVIEW_COMPLETE_GUIDE.md](./INTERVIEW_COMPLETE_GUIDE.md)
- **Quick Start:** [INTERVIEW_QUICK_START.md](./INTERVIEW_QUICK_START.md)
- **Backend Source:** [backend/src/modules/interview/](./backend/src/modules/interview/)
- **Frontend Components:** [frontend/src/components/interview/](./frontend/src/components/interview/)

---

## Contributing

To add new features:

1. Create a feature branch
2. Update backend routes
3. Create/update frontend components
4. Add tests
5. Update documentation
6. Create pull request

---

**Happy Building! 🚀**
