# 🤖 AI Twin Feature - Complete Implementation Guide

## Overview

The **AI Twin** feature is a comprehensive career coaching system that leverages Gemini AI and JSearch RapidAPI to provide intelligent job recommendations, tailored resumes, and mock interview practice.

### Three Core AI Agents

1. **Profile Agent** - Parses resume with Gemini to extract skills
2. **Research Agent** - Fetches jobs from JSearch RapidAPI and ranks by fit
3. **Interview Agent** - Generates mock interview questions and evaluates responses

---

## 🔑 Environment Setup

Add these to your `.env` file:

```bash
# Gemini AI Integration
GEMINI_API_KEY=AIzaSyArqPAzy43U7dJWpGGHpfYeYLWclThB9p8

# JSearch RapidAPI (for live job fetching)
RAPIDAPI_KEY=c0a727a712msh685855083870896p11b8f7jsn4e99d557da75
RAPIDAPI_HOST=jsearch.p.rapidapi.com

# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/nirmaan_prod

# Server Port
PORT=3000

# JWT
JWT_SECRET=your_jwt_secret_here

# Node Environment
NODE_ENV=development
```

---

## 🎯 Core Features

### 1. Resume Upload & Skill Extraction

**Endpoint:** `POST /career-twin/resume/upload-file`

Uploads PDF resume and extracts skills using Gemini AI.

#### Request:
```bash
curl -X POST http://localhost:3000/career-twin/resume/upload-file \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@resume.pdf"
```

#### Response:
```json
{
  "success": true,
  "profile": {
    "_id": "6789abcd",
    "userId": "6789abcd",
    "summary": {
      "headline": "Full-Stack Software Engineer",
      "preferredRoles": ["Software Engineer", "Backend Engineer"],
      "preferredLocations": ["Bengaluru", "Remote"],
      "strengths": ["Problem Solving", "System Design", "Leadership"]
    },
    "skills": [
      { "name": "JavaScript", "level": 90, "years": 3 },
      { "name": "Node.js", "level": 85, "years": 2 },
      { "name": "React", "level": 80, "years": 2 },
      { "name": "MongoDB", "level": 75, "years": 2 }
    ]
  }
}
```

---

### 2. Job Search Based on Profile Skills

**Endpoint:** `GET /career-twin/jobs/search-for-me`

Automatically fetches jobs matching user's resume skills using JSearch RapidAPI.

#### Request:
```bash
curl -X GET http://localhost:3000/career-twin/jobs/search-for-me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response:
```json
{
  "success": true,
  "message": "Found 8 jobs ranked by Fit Score based on your skills: JavaScript Node.js React MongoDB PostgreSQL",
  "jobs": [
    {
      "externalId": "jsearch:abc123",
      "title": "Senior Node.js Backend Engineer",
      "company": "TechCorp",
      "location": "Bengaluru, India",
      "workMode": "remote",
      "description": "We're looking for a Senior Backend Engineer...",
      "requiredSkills": ["Node.js", "JavaScript", "MongoDB", "AWS"],
      "fitScore": 95,
      "matchedSkills": ["Node.js", "JavaScript", "MongoDB"],
      "applyUrl": "https://example.com/apply"
    }
  ],
  "userSkills": ["JavaScript", "Node.js", "React", "MongoDB"]
}
```

---

### 3. Mock Interview Practice

#### 3A. Generate Single Interview Response

**Endpoint:** `POST /career-twin/interview/generate`

Generates mock interview question and evaluates user response.

#### Request:
```bash
curl -X POST http://localhost:3000/career-twin/interview/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userResponse": "I approached it by first breaking down the problem into smaller components, then implemented each module independently.",
    "jobTitle": "Senior Software Engineer"
  }'
```

#### Response:
```json
{
  "success": true,
  "interviewer": {
    "text": "That's a solid approach! Breaking down complex problems is crucial. Can you walk me through how you handle debugging when you encounter a critical production issue with no clear error message?",
    "jobTitle": "Senior Software Engineer",
    "userResponse": "I approached it by...",
    "timestamp": "2026-04-12T10:30:00Z",
    "feedbackPoints": [
      "Clear communication of technical concepts",
      "Problem-solving approach",
      "Real-world application of knowledge"
    ]
  }
}
```

#### 3B. Multi-Turn Interview Chat

**Endpoint:** `POST /career-twin/interview/chat`

Maintains conversation history for realistic interview practice.

#### Request:
```bash
curl -X POST http://localhost:3000/career-twin/interview/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userResponse": "I would use caching with Redis to optimize performance.",
    "jobTitle": "Full-Stack Engineer",
    "conversationHistory": [
      {
        "role": "interviewer",
        "message": "Tell me about your experience with performance optimization."
      },
      {
        "role": "user",
        "message": "In my last project, we optimized database queries..."
      }
    ]
  }'
```

#### Response:
```json
{
  "success": true,
  "interviewer": {
    "text": "Good point about Redis. I see you're thinking about multi-layer caching. How do you handle cache invalidation?",
    "jobTitle": "Full-Stack Engineer"
  },
  "conversationHistory": [
    { "role": "interviewer", "message": "Tell me about..." },
    { "role": "user", "message": "In my last project..." },
    { "role": "interviewer", "message": "Great, I see..." },
    { "role": "user", "message": "I would use caching..." },
    { "role": "interviewer", "message": "Good point about Redis..." }
  ]
}
```

---

### 4. Job Recommendations with Fit Scoring

**Endpoint:** `GET /career-twin/recommendations`

Gets personalized job recommendations ranked by fit.

#### Request:
```bash
curl -X GET "http://localhost:3000/career-twin/recommendations?query=Backend&location=Bengaluru&limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response:
```json
{
  "success": true,
  "profile": {
    "headline": "Full-Stack Software Engineer",
    "preferredRoles": ["Software Engineer"],
    "strengths": ["System Design", "Problem Solving"],
    "topSkills": ["JavaScript", "Node.js", "React"]
  },
  "metrics": {
    "totalJobs": 45,
    "strongFitCount": 12,
    "averageMatchScore": 76
  },
  "recommendations": [
    {
      "jobId": "507f1f77bcf86cd799439011",
      "title": "Backend Engineer",
      "company": "Google",
      "fitScore": 92,
      "fitCategory": "strong_fit",
      "missingSkills": ["Kubernetes"],
      "interviewProbability": 85
    }
  ]
}
```

---

### 5. Application Tracking & Analytics

**Endpoint:** `GET /career-twin/applications`

Track all job applications with status history.

#### Response:
```json
{
  "success": true,
  "applications": [
    {
      "_id": "6789abcd",
      "jobId": "507f1f77bcf86cd799439011",
      "status": "applied",
      "matchScore": 92,
      "fitCategory": "strong_fit",
      "timeline": {
        "createdAt": "2026-04-10T10:00:00Z",
        "appliedAt": "2026-04-10T10:05:00Z"
      },
      "note": "Great opportunity!"
    }
  ],
  "kanban": {
    "draft": 2,
    "applied": 8,
    "shortlisted": 3,
    "interview": 1,
    "offer": 0
  },
  "skillGaps": [
    {
      "skill": "Kubernetes",
      "demandCount": 5,
      "suggestion": "Build one proof project..."
    }
  ]
}
```

---

## 📋 API Reference

### Resume Management
- `POST /career-twin/resume/upload-file` - Upload PDF and extract skills
- `POST /career-twin/resume/upload-text` - Upload resume as text

### Job Search
- `GET /career-twin/jobs/search-for-me` - AI-powered search based on profile
- `GET /career-twin/jobs/search` - Search with filters
- `GET /career-twin/jobs/:jobId` - Get job details
- `GET /career-twin/recommendations` - Get ranked recommendations

### Interview Practice
- `POST /career-twin/interview/generate` - Generate single response
- `POST /career-twin/interview/chat` - Multi-turn conversation
- `POST /career-twin/interview/voice` - Voice input (placeholder)

### Application Management
- `GET /career-twin/applications` - Track all applications
- `PATCH /career-twin/applications/:applicationId/status` - Update status
- `POST /career-twin/apply/:jobId` - Apply to job

### Analytics & Dashboard
- `GET /career-twin/dashboard` - Full dashboard view
- `GET /career-twin/analytics/funnel` - Conversion analytics

### Admin (JSearch Integration)
- `POST /admin/sync/queue` - Queue job sync from source
  ```bash
  # Example: Search jobs for "React Developer" in remote mode
  curl -X POST http://localhost:3000/career-twin/admin/sync/queue \
    -H "Authorization: Bearer ADMIN_JWT" \
    -H "Content-Type: application/json" \
    -d '{
      "sourceType": "jsearch",
      "sourceKey": "React Developer|Remote"
    }'
  ```

---

## 🔧 Integration with Frontend

### 1. Update Frontend Service

```typescript
// src/services/careerTwinService.ts

// Add new interfaces
export interface JobSearchResult {
  message: string;
  jobs: Array<{
    externalId: string;
    title: string;
    company: string;
    fitScore: number;
    applyUrl: string;
  }>;
  userSkills: string[];
}

export interface InterviewResponse {
  text: string;
  jobTitle: string;
  feedbackPoints: string[];
}

// Add new methods
export async function searchJobsForMe(): Promise<JobSearchResult> {
  return axiosInstance.get('/career-twin/jobs/search-for-me');
}

export async function generateInterviewResponse(
  userResponse: string,
  jobTitle?: string
): Promise<InterviewResponse> {
  return axiosInstance.post('/career-twin/interview/generate', {
    userResponse,
    jobTitle,
  });
}

export async function interviewChat(
  userResponse: string,
  jobTitle?: string,
  conversationHistory?: any[]
) {
  return axiosInstance.post('/career-twin/interview/chat', {
    userResponse,
    jobTitle,
    conversationHistory,
  });
}
```

### 2. Frontend Pages Example

```typescript
// src/app/(dashboard)/career-twin/interview/page.tsx

'use client';
import { useState } from 'react';
import { careerTwinService } from '@/services';

export default function InterviewPage() {
  const [conversation, setConversation] = useState<any[]>([]);
  const [userInput, setUserInput] = useState('');
  const [jobTitle, setJobTitle] = useState('Software Engineer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await careerTwinService.interviewChat(
        userInput,
        jobTitle,
        conversation
      );

      setConversation(response.conversationHistory);
      setUserInput('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mock Interview Practice</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Job Title</label>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="mb-6 bg-gray-100 p-6 rounded-lg max-h-96 overflow-y-auto">
        {conversation.map((msg, idx) => (
          <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div
              className={`inline-block px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-black'
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your response..."
          className="flex-1 px-4 py-2 border rounded-lg"
          rows={4}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

---

## 🚀 Deployment Checklist

- [x] Gemini API key configured
- [x] RapidAPI key configured
- [x] MongoDB connection verified
- [x] JWT authentication enabled
- [x] Rate limiting configured
- [x] Error handling implemented
- [x] Logging setup
- [ ] Frontend components created
- [ ] End-to-end testing completed
- [ ] Production environment variables set

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           Frontend (Next.js + React)            │
│  - Resume Upload UI                             │
│  - Job Search & Recommendations                 │
│  - Mock Interview Chat                          │
│  - Application Tracker Dashboard                │
└──────────────┬──────────────────────────────────┘
               │ API Calls
┌──────────────▼──────────────────────────────────┐
│          Express API Gateway                    │
│  - Authentication (JWT)                         │
│  - Rate Limiting                                │
│  - Input Validation                             │
└──────────────┬──────────────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────────┐
│ Gemini │ │JSearch │ │ MongoDB    │
│ AI API │ │RapidAPI│ │ Database   │
└────────┘ └────────┘ └────────────┘
```

---

## 🐛 Troubleshooting

### Issue: "RAPIDAPI_KEY not configured"
**Solution:** Add `RAPIDAPI_KEY` to `.env` file

### Issue: "No skills found in profile"
**Solution:** User must upload resume first using `/resume/upload-file`

### Issue: "Google rate limit (429)"
**Solution:** System automatically falls back to mock responses. Wait 60 seconds before retrying.

### Issue: Interview generates generic responses
**Solution:** Ensure `GEMINI_API_KEY` is valid and has sufficient quota

---

## 📝 Notes

- Resume parsing uses Gemini for accurate skill extraction
- Job matching algorithm considers skill overlap and career preferences
- Interview responses are contextual based on job title
- All APIs require JWT authentication
- Rate limits: 10 requests/minute for interview, 5 requests/minute for job search

---

## 🎓 Example: Complete User Flow

```
1. User signs up & logs in
2. User uploads resume (PDF)
   → Resume parsed with Gemini
   → Profile created with extracted skills
3. User clicks "Find Jobs for Me"
   → System queries JSearch RapidAPI with extracted skills
   → Jobs ranked by fit score
   → Displayed to user
4. User clicks on job → Views details & can apply
5. User wants interview prep
   → Starts mock interview chat
   → Provides answers to questions
   → Gets AI feedback
6. User tracks applications in dashboard
   → Sees analytics & skill gaps
   → Gets AI suggestions
```

---

**Happy coding! 🚀**
