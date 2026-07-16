# Nirmaan (Career OS) — Complete Technical Documentation & Workflow Guide

---

## 1. Project Overview

### Purpose of the Project
**Nirmaan (Career OS)** is an outcome-driven career accelerator and technical interview preparation platform. It is designed to bridge the gap between academic learning and industry placement by offering a structured, AI-assisted environment where students and job candidates can practice Coding (DSA), build resumes, undergo simulated multi-turn mock interviews, generate personalized roadmaps, and engage in community-driven peer tutoring.

### Main Problem It Solves
Traditional platforms offer isolated tools (e.g., LeetCode for coding, standard editors for resumes, and static forms for mock interviews). Nirmaan solves this by uniting all these pillars into a single, cohesive ecosystem. Furthermore, it addresses:
1. **The Feedback Gap**: Providing immediate, detailed, and structured feedback (time/space complexity, edge cases, trade-offs, and behavioral score Rubrics) rather than just a simple pass/fail indicator.
2. **Plagiarism & Cheating**: Detecting cheating patterns (tabs, full-screen violations, rapid pasting) and computing character-level code similarity (plagiarism check) against recent submissions.
3. **Outcome Signal Learning**: Adjusting recommended roles and skills based on real-world interview outcomes (offers, rejections, shortlists).

### Key Features
*   **Production-Grade Practice IDE**: Monaco-based code editor with multi-language execution (via Docker sandbox or Judge0 API) and test suite runners.
*   **Proctored Interview Simulator**: AI-driven mock interviewer ("Alex") running multi-turn chat sessions with webcam-based proctoring, window blur tracking, and automatic plagiarism checks.
*   **Intelligent Profile Scraper & Resume Tailor**: Automated scraper that extracts skills, repositories, and scores from GitHub, LeetCode, and Codeforces to build a unified profile and generate customized resume summaries.
*   **Adaptive Learning Roadmaps**: AI-generated roadmaps with milestone completion tracking.
*   **Skill Exchange Community**: Point-based community marketplace where users can request help, teach others to earn credits, or schedule sessions with an AI mentor.
*   **Gamified Career Journey**: XP milestones, badge achievements (e.g., *DSA Starter*, *Interview Warrior*), weekly quests, and college-wide leaderboards.

### High-Level Architecture
Nirmaan uses a classic split architecture with proxy gateways:
*   **Frontend**: Next.js App Router (TypeScript, Tailwind CSS, Zustand state) serving as both the UI layer and an API proxy.
*   **Backend**: Node.js + Express.js API server running business modules and scheduling background crawlers.
*   **Message/Task Queue**: Bull Queue backed by Redis for asynchronous, out-of-process code execution.
*   **Sandbox**: Docker engine executing untrusted user code inside temporary, time-and-memory-capped containers.
*   **Database**: MongoDB (Mongoose) storing users, sessions, proctoring events, and jobs.

```
       [ Client Browser ]
               │ (Next.js client-side requests)
               ▼
   [ Next.js API Proxy Gateway ] (Next.js server-side rewrites)
               │
               ▼
     [ Express API Server ] ◄──► [ MongoDB (Mongoose) ]
         │           │
         ▼           ▼
  [ Bull Queue ]  [ AI Fallback Manager ] ◄──► [ Gemini / Claude / Llama ]
         │
   (Redis Backed)
         │
         ▼
  [ Docker Sandbox / Judge0 ]
```

---

## 2. Tech Stack

### Frontend
*   **Next.js (v14+) & React**: Chosen for server-side prefetching, App Router layout encapsulation, and performance.
*   **Zustand**: Lightweight state manager used for global auth persistence (`auth-storage` in local storage) to avoid React Context re-renders.
*   **Tailwind CSS**: Enables unified styling tokens, responsive layouts, and consistent dark mode colors (cyber blue `#00D9FF` branding).
*   **Monaco Editor**: Powering the DSA IDE with syntax highlighting, autocomplete, and event interception.
*   **Lucide React**: For uniform vector iconography.
*   **Axios**: Configured with request interceptors to inject JWTs and response interceptors to handle silent refresh tokens (`/auth/refresh`).

### Backend
*   **Node.js & Express.js**: Asynchronous event-driven API runtime allowing high concurrent processing for SSE (Server-Sent Events) streams.
*   **Mongoose (MongoDB)**: NoSQL document store matching the dynamic data payloads of AI responses (e.g. nested resume JSON, complex violation arrays).
*   **Bull Queue & Redis**: For robust background code execution jobs and state caching.
*   **Dockerode**: Docker API client enabling the Express server to spawn sandboxed containers on the host machine.
*   **Multer**: Handling multi-part form data uploads for PDF resumes and audio WAV/WEBM voice interviews.
*   **pdf-parse**: Client-free PDF text extractor.
*   **Cheerio**: Light HTML scraper for parsing LinkedIn/Codeforces profiles.
*   **Joi**: Strict schema validation middleware sanitizing all inbound payloads before routing.

### AI & Integrations
*   **Google Gemini SDK**: Default provider utilizing `gemini-1.5-flash` for high-throughput tasks (audio transcription, chat turns) and `gemini-2.5-flash` for complex synthesis.
*   **Anthropic Claude SDK**: Reliable paid fallback model (`claude-3-5-sonnet-latest`) for literature reviews and heavy code quality analysis.
*   **Cloudflare Workers AI**: Secondary fallback running `@cf/meta/llama-3-8b-instruct`.
*   **Judge0 API**: Remote cloud compiler fallback used when Docker is not configured or offline.

---

## 3. Folder Structure

### Workspace Structure
```
Nirmaan/
├── backend/                  # Express.js REST API
│   ├── src/                  # Source folder
│   │   ├── config/           # Database, environment variables, constants
│   │   ├── core/             # Base services: auth, key manager, sandbox, middleware
│   │   ├── modules/          # Core features: dsa, interview, resume, gamification, etc.
│   │   └── server.js         # Express app entry point
│   ├── Dockerfile            # Production build container for backend
│   └── package.json          # Node dependencies
├── frontend/                 # Next.js App Router project
│   ├── src/
│   │   ├── app/              # Folder-based pages, layouts, and API proxies
│   │   ├── components/       # Reusable UI widgets (DSA editor, webcam widget, proctor HUD)
│   │   ├── hooks/            # Custom React hooks (useProctor, useTheme)
│   │   ├── lib/              # Client-side helpers (Axios config, analytics tracker)
│   │   └── store/            # Zustand auth storage
│   ├── Dockerfile            # Production build container for frontend
│   └── tailwind.config.ts    # Styling system tokens
└── docker-compose.yml        # Orchestrates MongoDB, Redis, Backend, and Frontend
```

---

## 4. Application Startup Flow

```
User visits Nirmaan (http://localhost:3500)
       ↓
Next.js Frontend initializes
       ↓
Zustand checks LocalStorage for accessToken and user details
       ↓
[Authenticated?]
 ├── Yes ──► Redirect to /dashboard (Prefetching next routes)
 └── No  ──► Render Landing Page / Login Form
       ↓
User triggers an action (e.g., solves DSA problem, starts interview)
       ↓
Axios client sends Request to /api/...
       ↓
Next.js Rewrite proxy intercepts -> forwards to Express Backend (http://localhost:5000/api)
       ↓
Express executes Middlewares: Security (Helmet/CORS) -> Rate Limiter -> Protect JWT -> Schema Validator (Joi)
       ↓
[Valid request?]
 ├── No  ──► Global Error Handler -> return formatted JSON error response
 └── Yes ──► Execute Controller -> Invoke Service Layer
       ↓
Service interacts with MongoDB (via Mongoose) and/or spawns AI prompt request
       ↓
[If AI query fails?] -> Rotate Gemini keys (1 to 6) -> Fallback to Claude / Llama -> Parse JSON cleanly
       ↓
Controller returns unified JSON response
       ↓
Next.js Proxy passes response to UI
       ↓
Zustand / local state updates -> UI re-renders with animations
```

---

## 5. Complete Request Lifecycle

Here is the step-by-step route lifecycle for key modules:

### A. Code Runner (`POST /api/interview/run`)
1.  **Frontend component**: `test-cases-panel.tsx` calls `interviewExecutionService.runCode(code, lang, questionId, false)`.
2.  **HTTP Request**: `POST /api/interview/run` with body `{ sourceCode, language, questionId, async: false }`.
3.  **Backend route**: `execution-routes-v2.js` matches `/run`.
4.  **Middleware**: `protect` checks JWT -> `apiLimiter` checks rate limits -> `validate(runSchema)` sanitizes the request.
5.  **Controller**: Handler checks if `async` is true. If false, executes synchronously.
6.  **Service layer**: Spawns code execution. It checks `DockerSandboxExecutor.isAvailable()`.
    *   *If Docker is available*: Spawns container using language config (`python`, `node:18-alpine`, `gcc`), writes code + `stdin.txt` to a unique temp directory on the host, mounts it inside the container, executes, and parses stdout/stderr.
    *   *If Docker is offline*: Falls back to `Judge0Service.executeCode()` which hits the cloud endpoint.
7.  **Database query**: Fetches visible test cases via `TestCaseModel.getVisibleTestCases(questionId)`. Saves execution record to `ExecutionResultModel`.
8.  **Response formatting**: Controller formats output via `ApiResponse.success(res, result)`.
9.  **JSON response**: `{ success: true, data: { verdict: 'Accepted', testCases: [...] } }`.
10. **Frontend rendering**: Monaco IDE shows test validation ticks and outputs in stdout panels.

### B. Interview Evaluation (`POST /api/interview/session/evaluate`)
1.  **Frontend component**: `proctored-interview-shell.tsx` triggers final submit.
2.  **HTTP Request**: `POST /api/interview/session/evaluate` containing `{ jobTitle, conversationHistory }`.
3.  **Backend route**: `routes.js` matches `/interview/session/evaluate`.
4.  **Middleware**: `protect` JWT validation -> `aiLimiter` rate checking.
5.  **Controller**: `controller.evaluateInterviewSession` maps history.
6.  **Service layer**: `careerTwinService.evaluateInterviewSession` invokes `interviewAgent.evaluate({ jobTitle, history })`.
7.  **AI model call**: Directs prompt containing user answer history to `geminiService.getModel('interview')` requesting structured JSON schema.
8.  **Output Parsing**: Sanitizes markdown markdown-fences via `geminiService.safeParseJSONObject()` to extract score, verdict, strengths, improvements, and next steps.
9.  **JSON response**: `{ success: true, overallScore: 82, verdict: 'Good', strengths: [...], improvements: [...] }`.
10. **Frontend rendering**: Displays cinematic Final Score Modal overlay with rating grade.

---

## 6. Backend Workflow

### Express Initialization
Set up in [server.js](file:///c:/Users/Rudra/OneDrive/Desktop/Nirmaan/backend/src/server.js). It disables the `X-Powered-By` header, sets proxy trust, and mounts middleware in this exact order:
1.  `helmet()`: HTTP security headers.
2.  `hpp()`: Prevents HTTP Parameter Pollution.
3.  `mongoSanitize()`: Strips key names starting with `$` or `.` to block MongoDB Query Injection.
4.  `compression()`: Gzip payloads.
5.  `cors(...)`: Restricted origins matching `config.frontendUrls` with credential support.
6.  `express.json({ limit: '10mb' })` & `urlencoded`: Body parsing.
7.  `apiLimiter`: Rate limiter applied to `/api/`.
8.  `requestLogger`: Custom middleware logging methods, paths, IPs, and user agents to `winston`.
9.  `routes`: Mounted at `/api`.
10. `404 handler`: Returns JSON Route Not Found.
11. `errorHandler`: Global error handling middleware.

### Database Connection
Handled in [database.js](file:///c:/Users/Rudra/OneDrive/Desktop/Nirmaan/backend/src/config/database.js). Connects via `mongoose.connect` with robust connection options:
*   `maxPoolSize: 10` (keeps connection pool at 10 to handle concurrency).
*   `serverSelectionTimeoutMS: 5000`.
*   Monitors events: `error`, `disconnected`, `reconnected` to ensure automatic recovery.

---

## 7. Frontend Workflow

### Page Routing
Nirmaan uses Next.js App Router structure:
*   `app/page.tsx`: Marketing landing page.
*   `app/(auth)/login/` & `register/`: Entry forms.
*   `app/(dashboard)/layout.tsx`: Collapsible header nav displaying user profiles and prefetching links.
*   `app/(dashboard)/dashboard/page.tsx`: Student stats home dashboard.
*   `app/(dashboard)/interview/page.tsx`: Renders proctored IDE shells.
*   `app/(dashboard)/career-twin/`: AI Twin matching, recommendations, Kanban tracking, and simulation chat rooms.

### State & Context
Authentication credentials, tokens, and active user details are kept inside Zustand's persisted state (`useAuthStore` in [auth.ts](file:///c:/Users/Rudra/OneDrive/Desktop/Nirmaan/frontend/src/store/auth.ts)). When page initializations or API requests fail with a `401 Unauthorized`, Axios interceptors verify if a `refreshToken` exists in local storage. If present, it attempts a silent token renewal (`/auth/refresh`) and retries the original request, preventing session drops during long mock interviews.

---

## 8. Database Workflow

```
   [ User ] 1 ─── 1 [ UserGamification ]
      │ 1
      ├─────── N ─── [ UserResume ]
      ├─────── N ─── [ UserRoadmap ]
      ├─────── N ─── [ PDFSession ]
      ├─────── N ─── [ PointsLedger ]
      └─────── N ─── [ ProctorSession ] 1 ─── N [ SubmissionHash ]
```

### Key Schemas & Collections
1.  **User (`users`)**: Stores credentials, hashed passwords, subscription details (`free`, `pro`, `enterprise`), and preferences.
2.  **ProctorSession (`proctor_sessions`)**: Stores camera status, active violations (timestamped entries of visibility switches, tab focus blurs, fullscreen escapes), submission code hashes, and final grading indices.
3.  **CareerTwinProfile (`career_twin_profiles`)**: Stores profile summaries, skill nodes, projects, and experiences extracted from parsed resumes. Contains weight signals updated dynamically based on job application results.
4.  **CareerTwinJob (`career_twin_jobs`)**: Aggregated job postings with company profiles, required skill sets, and deduplicated quality scores.

---

## 9. Authentication Workflow

1.  **Register/Login**: In [service.js](file:///c:/Users/Rudra/OneDrive/Desktop/Nirmaan/backend/src/core/auth/service.js), passwords are encrypted using `bcryptjs` with 12 salt rounds. 
2.  **Token Generation**: Generates double JWTs:
    *   `accessToken`: Expires in 15 minutes.
    *   `refreshToken`: Expires in 7 days (saved to User record).
3.  **Route Protection**: In [middleware.js](file:///c:/Users/Rudra/OneDrive/Desktop/Nirmaan/backend/src/core/auth/middleware.js), checks for standard `Authorization: Bearer <token>` headers.
    *   *SSE Fallback*: For Server-Sent Events requests, checks query parameters `req.query.token` since EventSource cannot set headers, allowing GET streams safely.
4.  **Authorization**: Role check helper `restrictTo('admin')` validates user privileges. `checkSubscription('pro', 'enterprise')` protects premium feature layers.

---

## 10. AI Workflow & Fallbacks

Nirmaan implements a robust multi-key, multi-model AI orchestration pipeline to bypass rate limits and guarantee service availability.

```
                  [ Inbound AI Request ]
                            │
                            ▼
            [ Cloudflare Workers AI Llama ] (Optional Primary)
                            │
             ┌──────────────┴──────────────┐
          Success                       Failure
             │                             │
             ▼                             ▼
      [ Return Output ]            [ Gemini API Key 1 ]
                                           │
                            ┌──────────────┴──────────────┐
                         Success                       429 Rate Limit
                            │                             │
                            ▼                             ▼
                     [ Return Output ]             [ Try Key 2...6 ]
                                                          │
                                            ┌─────────────┴─────────────┐
                                         Success                     Failure (All keys limited)
                                            │                           │
                                            ▼                           ▼
                                     [ Return Output ]           [ Claude API Fallback ]
                                                                        │
                                                         ┌──────────────┴──────────────┐
                                                      Success                       Failure
                                                         │                             │
                                                         ▼                             ▼
                                                  [ Return Output ]            [ Throw Consolidated ]
                                                                                   [   Error JSON   ]
```

### Key Rotation & Evasion
Implemented in [aiFallbackManager.js](file:///c:/Users/Rudra/OneDrive/Desktop/Nirmaan/backend/src/services/ai/aiFallbackManager.js). If a Gemini model hits a `429 Rate Limit` or `Quota Exceeded` error:
1.  Rotates through keys `GEMINI_KEY_1` to `GEMINI_KEY_6`.
2.  If all keys fail for `gemini-2.5-flash`, switches to the next model in the chain: `gemini-2.0-flash` then `gemini-2.0-flash-lite`.
3.  If the entire Gemini model chain is exhausted, fails back to Anthropic Claude (`claude-3-5-sonnet-latest`).

### AI Output Extraction
1.  **Markdown stripping**: Removes code fences like ` ```json ` using regular expressions.
2.  **Bracket tracking**: Finds the balanced outermost braces `{...}` or brackets `[...]` to discard trailing commentary.
3.  **Comma fixing**: Normalizes trailing commas (e.g. `[1, 2,]` becomes `[1, 2]`) which cause standard `JSON.parse` to crash.
4.  **Control Character Escape**: Converts raw literal newlines `\n` in text properties to escaped strings.

---

## 11. Business Logic

### A. Career Twin Outcome-Signal Learning
*   **Input**: Completed job application outcomes (e.g., job title, status: shortlisted/offered/rejected).
*   **Processing**: When status patches are completed:
    *   *Offer/Shortlisted*: Increments the candidate's preferred role and matched skill priors by `+0.35` and `+0.15` respectively, representing increased competency signals.
    *   *Rejection*: Decrements the role priority by `-0.2`, adjusting career alignment.
    *   *Missing Skills*: Reduces priors for missing skills by `-0.1` to highlight development gaps.
*   **Output**: Dynamically adjusted skill and role weight maps showing updated career readiness.

### B. Proctoring & Threat Detection
*   **Input**: User event signals (webcam faces, window focus, keyboard keydown).
*   **Algorithms**:
    *   *Webcam Face Detection*: Employs face-mesh trackers in the browser. Tracks face occurrences. If 0 (face missing) or > 1 (multiple faces), pushes alert events.
    *   *Paste Penalty*: Keydown listener traps clipboard events. If a code insertion exceeds 50 characters, records a `copy_paste` violation. If exceeds 200 characters, upgrades it to `rapid_paste` (high severity).
    *   *Plagiarism check*: Computes character-level Code Similarity. Integrates a combination score: **60% Jaccard Similarity** (token overlap check) + **40% Normalized Levenshtein Distance** (character edit distance calculation capped at first 2000 chars to avoid memory exhaustion). If similarity score exceeds **70%**, triggers plagiarism alerts.

---

## 12. Data Flow Diagram

```
[User UI Dashboard] ───► (Click Problems) ───► [Next.js Route]
         ▲                                          │
         │ (HTTP Response)                          ▼
         │                                   [Axios Client]
         │                                          │ (Auth Header Bearer Token)
         │                                          ▼
         │                                    [Express Router]
         │                                          │
         │                                          ▼
         │                                    [protect Middleware] (Verify JWT)
         │                                          │
         │                                          ▼
         │                                    [validation Middleware] (Joi check)
         │                                          │
         │                                          ▼
         │                                    [dsaController]
         │                                          │
         │                                          ▼
         ├──────────────────────────────────── [dsaService] (Database search)
         │                                          │
         │                                          ▼
         │ (Gemini API prompt check)          [geminiService]
         │                                          │
         ├──────────────────────────────────── [aiService] (Fallback fallback check)
         │                                          │
         ▼                                          ▼
 [Formatted UI response] ◄──────────────────── [Return parsed JSON]
```

---

## 13. Middleware Execution Order

For every request received by the Express API, the execution sequence proceeds as follows:

```
[Inbound Client Request]
          │
          ▼
   1. Helmet Security Headers (nosniff, X-Frame-Options)
          │
          ▼
   2. HPP Parameter Protection
          │
          ▼
   3. Mongo Sanitize (Strips $ and . query params)
          │
          ▼
   4. Compression (Gzip payload rendering)
          │
          ▼
   5. CORS Origin Check (Verifies config.frontendUrls)
          │
          ▼
   6. Express body-parser limit (10MB body check)
          │
          ▼
   7. apiLimiter (Rate check based on User ID or IP)
          │
          ▼
   8. winston requestLogger (Path, method, IP logged)
          │
          ▼
   9. protect JWT Middleware (Token extraction and decode)
          │
          ▼
  10. restrictTo / checkSubscription (Role and pricing tier check)
          │
          ▼
  11. Joi validation Middleware (validate schema and sanitize body)
          │
          ▼
  12. Route Controller (Run code implementation logic)
          │
          ▼
  13. errorHandler Global Catch (Formats CastError, Validation, JWT errors)
```

---

## 14. Error Handling Workflow

```
                        [ Exception / Error Caught ]
                                     │
                                     ▼
                            [ Operational Error? ]
                              ├── Yes ──► Send Custom AppError JSON Payload
                              └── No   ──► Log Stack Trace to Winston File Logger
                                                │
                                                ▼
                                    [ Inspect Error Type ]
                                                │
       ┌──────────────────────┬─────────────────┴────────────────────┐
       ▼                      ▼                                      ▼
[ Mongoose ValidationError ] [ Mongoose CastError ]        [ JWT WebTokenError ]
       │                      │                                      │
       ▼                      ▼                                      ▼
400 Validation Fail    404 Resource Not Found             401 Invalid Token
```

---

## 15. Security Workflow

1.  **JWT Integrity**: Access tokens are signed using high-entropy secrets and kept in memory or transient storage. Refresh tokens are kept in DB and mapped with secure cookies or HTTPS headers.
2.  **CORS & Origins**: Strictly enforces origin parameters. Wildcards `*` are rejected during production compilation to prevent cross-origin exploits.
3.  **Rate Limiting**: Three limit levels block DDoS: general limits (100 req / 15 min), auth limits (10 failed logins / 15 min), and AI limits (20 runs / 1 min).
4.  **Sandbox Isolation**: Coder compiler execution runs inside rootless, read-only Docker containers with CPU quotas (`DOCKER_CPU_QUOTA=50000`) and low memory caps (128MB) to protect the host server from malicious scripts.

---

## 16. Performance Optimizations

*   **Server-Sent Events (SSE)**: Replaces polling for long executions. Statuses are pushed in real time, saving HTTP overhead.
*   **Database Indexing**: Heavy database indexes on `userId`, `createdAt`, `subscription.tier`, and `externalId` keep queries fast.
*   **Job Queue (Bull & Redis)**: Code executions are moved off the main thread into worker queues, preventing thread blocking during heavy compilations.

---

## 17. Deployment Workflow

```
[Developer Git Push] ──► [Docker Image Build] ──► [Docker Compose Run]
                                                           │
                                                           ├─► MongoDB (27017)
                                                           ├─► Redis Server (6379)
                                                           ├─► Backend API (5000)
                                                           └─► Next.js UI (3000)
```

### Production Setup
1.  **Docker Compiling**: Next.js uses multi-stage builds. Production compiling runs `npm run build` using webpack tree-shaking.
2.  **Reverse Proxy**: In production, Nginx sits in front, listening on port 80/443, routing `/api/*` requests to port 5000 and all other traffic to port 3000. It also enforces TLS configurations.

---

## 18. Sequence Diagram: Active Proctoring Lifecycle

```
Candidate               Browser Screen          Next.js Proxy            Express API
    │                        │                        │                       │
    │─── 1. Start Exam ─────►│                        │                       │
    │                        │─── 2. POST /start ────►│                       │
    │                        │                        │─── 3. Register ──────►│
    │                        │◄── 4. Session ID ──────│◄─── 5. Save Model ────│
    │◄── 6. Request Media ───│                        │                       │
    │                        │                                                │
    │─── 7. Switch Tab ─────►│                                                │
    │                        │─── 8. POST /violation ────────────────────────►│
    │                        │                                                │
    │◄── 9. Warn Overlay ────│                                                │
    │                        │                                                │
    │─── 10. Heartbeat ─────►│─── 11. POST /heartbeat ───────────────────────►│
    │                        │                                                │
    │─── 12. Submit Code ───►│─── 13. POST /finish ──────────────────────────►│
    │                        │                                                │ (Plagiarism check)
    │                        │                                                │ (Compute score)
    │◄── 14. Final Score ────│◄── 15. Scoring JSON ◄──────────────────────────│
```

---

## 19. End-to-End Execution Trace: DSA Submission Run

1.  **User Trigger**: User clicks the "Submit Code" button in `interview-ai-lab-page-v2.tsx`.
2.  **Component Action**: `onSubmitCode` is called. It tokenizes the code and calculates a SHA-256 hash.
3.  **Frontend API Call**: Calls `interviewExecutionService.submitCode(...)` which sends a request via Axios:
    `POST /api/interview/submit` with JSON body `{ sourceCode, language, questionId, sessionId, async: true }`.
4.  **Gateway Routing**: Next.js rewrite rules forward the request to the Express backend.
5.  **Express Router**: Matches route `/submit` in `execution-routes-v2.js`.
6.  **Auth & Rate Verification**: `protect` decodes the JWT, and `apiLimiter` checks rate limits.
7.  **Job Enqueue**: The controller calls `ExecutionQueue.queueSubmit(...)` to add the submission job to the Bull queue.
8.  **Job Enqueue Response**: Immediately returns a `jobId` to the client.
9.  **SSE Connection**: The frontend opens an EventSource stream at `/api/interview/execution-stream/:jobId`.
10. **SSE Hook**: `execution-stream-routes.js` receives the GET request, sets `text/event-stream` headers, and begins polling the job status.
11. **Job Worker Execution**: The Bull queue worker picks up the job. It verifies `DockerSandboxExecutor.isAvailable()`.
12. **Sandbox Compilation**:
    *   Creates a temp folder: `temp/code-<unique-id>`.
    *   Writes code to `solution.py` and input parameters to `stdin.txt`.
    *   Spawns container: `docker run --network none --memory 128m --cpus 0.5 -v /temp/code-id:/app python:3.11-slim python3 /app/solution.py`.
13. **Result Collection**: The worker reads container exit codes, stdout, and stderr, parses the test case metrics, deletes the temp folder, and saves results to `ExecutionResultModel`.
14. **SSE Status Update**: The SSE route polls the completed state and sends a `completed` message with the final scores.
15. **UI Rendering**: The frontend closes the EventSource connection and displays test runs, code verdicts, and gamification badge unlocks.

---

## 20. Source Code Mapping

| File Path | Class/Function Name | Purpose | Next Connection |
| :--- | :--- | :--- | :--- |
| `backend/src/server.js` | Express Server Setup | Server startup, mounting routes & middlewares | `routes/index.js` |
| `backend/src/routes/index.js` | Route Index | Maps path prefixes to module routers | Module routes (e.g., `/proctor`, `/interview`) |
| `backend/src/core/auth/middleware.js` | `protect` | Decodes JWTs and extracts user credentials | Downstream controllers |
| `backend/src/core/code-executor/execution-queue.js` | `ExecutionQueue` | Manages background Bull jobs backed by Redis | `docker-sandbox.js` / `judge0-service.js` |
| `backend/src/core/code-executor/docker-sandbox.js` | `DockerSandboxExecutor` | Spawns sandboxed Docker containers for compilation | Host filesystem temp folder |
| `backend/src/services/ai/aiService.js` | `AIService` | Entry point for fallback-protected LLM generation | `aiFallbackManager.js` |
| `backend/src/services/ai/aiFallbackManager.js` | `AIFallbackManager` | Handles key rotation and Claude/Llama fallbacks | SDK clients |
| `backend/src/modules/resume/profile-scraper.js` | `ProfileScraperService` | Scrapes external developer profiles | `gemini-service.js` |
| `frontend/src/store/auth.ts` | `useAuthStore` | Zustand global store for user sessions | `lib/axios.ts` |
| `frontend/src/hooks/useProctor.ts` | `useProctor` | Tracks blur, fullscreen, and video/audio states | `/api/proctor/*` backend endpoints |

---

## 21. Internal Logic Explanations

### 1. `AIFallbackManager.generateWithFallback(prompt, timeoutMs)`
*   **Why it exists**: Guarantees AI features work even under high traffic, transient network failures, or API rate limits.
*   **Approach**: Iterative fallback chain with key rotation and backoff. Try Cloudflare (if enabled) -> Gemini (with key rotation) -> Claude.
*   **Input**: `prompt` (string), `timeoutMs` (number).
*   **Output**: Parsed text response (string).
*   **Calls**:
    *   *Called by*: `AIService.generate()`.
    *   *Calls*: `GeminiClient.generateContent()`, `ClaudeClient.generateContent()`, `CloudflareClient.generateContent()`, and `executeWithRetry()`.

### 2. `ProctorSession.computeScore(testCasePct, timeTakenSeconds, aiCodeScore)`
*   **Why it exists**: Computes a single weighted placement readiness score based on performance and integrity.
*   **Approach**:
    $$\text{Final Score} = (\text{Test Case \%} \times 0.70) + (\text{Time Score} \times 0.10) + (\text{AI Code Quality} \times 0.10) - \text{Violation Penalty}$$
    *   `Time Score` calculates how much time was left over from the limit.
    *   `Violation Penalty` deducts points for infractions (e.g., `-10` for copy/paste, `-5` for tab switches) up to a maximum penalty of 10 points.
*   **Input**: `testCasePct` (number), `timeTakenSeconds` (number), `aiCodeScore` (number).
*   **Output**: `{ testCaseScore, timeScore, codeQualityScore, violationPenalty, finalScore, grade }`.
*   **Calls**:
    *   *Called by*: Finish proctor route (`POST /proctor/finish`).

### 3. `_checkPlagiarism(questionId, rawCode, canonicalHash, currentSessionId, userId)`
*   **Why it exists**: Prevents code sharing and copy-pasting.
*   **Approach**:
    *   First, does a fast SHA-256 hash match against recent submissions.
    *   If no exact match, runs a fuzzy comparison: **60% Jaccard Similarity** (token overlap check) + **40% Normalized Levenshtein Distance** (character edit distance calculation).
    *   A similarity score above **70%** flags the submission.
*   **Input**: `questionId`, `rawCode`, `canonicalHash`, `currentSessionId`, `userId`.
*   **Output**: `{ codeHash, similarity, flagged }`.
*   **Calls**:
    *   *Called by*: Finish proctor route (`POST /proctor/finish`).

---

## 22. Overall Workflow Summary

```
   [ candidate ]
        │
        ├─► 1. Registers / Logs In ──► [ Zustand auth store ] ──► [ MongoDB ]
        │
        ├─► 2. Uploads Resume PDF ──► [ pdf-parse ] ──► [ Gemini parse ] ──► [ Career Twin Profile ]
        │
        ├─► 3. Initiates Job Search ──► [ Research Agent ] ──► [ Normalizer ] ──► [ Job Matches ]
        │
        ├─► 4. Takes Mock Interview ──► [ Proctor Setup ] ──► [ Video / Audio / Fullscreen check ]
        │                                                                │
        │       ┌────────────────────────────────────────────────────────┘
        │       ▼
        ├─► 5. active Mock Interview IDE ──► [ Monaco Editor ] ──► [ Event Visibility blur checks ]
        │                                                                │
        │       ┌────────────────────────────────────────────────────────┘
        │       ▼
        ├─► 6. Code Execution Runs ──► [ Bull Queue ] ──► [ Docker Sandbox / Judge0 ]
        │                                                        │
        │       ┌────────────────────────────────────────────────┘
        │       ▼
        ├─► 7. Code Submission ──► [ Plagiarism fuzzy comparisons ] ──► [ Proctor Scoring ]
        │                                                                      │
        │       ┌──────────────────────────────────────────────────────────────┘
        │       ▼
        └─► 8. Gamification Unlocks ──► [ Rules engine ] ──► [ XP updates & Badges ] ──► [ Leaderboard ]
```
