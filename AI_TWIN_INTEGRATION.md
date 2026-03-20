# AI Twin / Career Twin Integration Guide

## 1. Multi-Agent System Design

### Agent Topology

- Orchestrator Agent: `backend/src/modules/career-twin/service.js`
- Profile Agent: `backend/src/modules/career-twin/agents/profile-agent.js`
- Research Agent: `backend/src/modules/career-twin/agents/research-agent.js`
- Matching Agent: `backend/src/modules/career-twin/agents/matching-agent.js`
- Resume Agent: `backend/src/modules/career-twin/agents/resume-agent.js`
- Apply Agent: `backend/src/modules/career-twin/agents/apply-agent.js`
- Tracking Agent: `backend/src/modules/career-twin/agents/tracking-agent.js`
- Learning Agent: `backend/src/modules/career-twin/agents/learning-agent.js`

### Data Flow

1. Resume upload -> Profile Agent extracts structured profile + skills graph.
2. Research Agent ingests safe structured jobs (company pages/API feeds) and deduplicates.
3. Matching Agent ranks jobs with fit score, interview probability, and fit category.
4. Resume Agent generates tailored ATS content for selected jobs.
5. Apply Agent prepares role-specific answers and creates draft/applied records.
6. Tracking Agent keeps status timeline and event logs.
7. Learning Agent updates role/skill weights from outcomes (shortlist/reject/offer).

## 2. Database Design (MongoDB)

### Existing collections used

- `users` (existing)
- `resumes` (existing)

### New collections added

- `careertwinprofiles`: structured user profile + skills graph + learning signals
- `careertwinjobs`: normalized jobs from safe sources
- `careertwinapplications`: user-job applications, tailored resume metadata, scores
- `careertwinapplicationevents`: timeline/audit events per application

### Core schema mapping

- users -> account, auth, subscription
- resumes -> source resume artifacts
- skills -> embedded in `careertwinprofiles.skills` + `careertwinprofiles.skillsGraph`
- jobs -> `careertwinjobs`
- applications -> `careertwinapplications`
- application_events -> `careertwinapplicationevents`

## 3. API Endpoints

Base: `/api/career-twin`

- `POST /resume/upload-text` -> parse pasted resume text and rebuild profile
- `POST /resume/upload-file` -> parse PDF resume and rebuild profile
- `POST /jobs/sync` -> ingest structured jobs from safe feed
- `GET /recommendations` -> ranked recommendations with smart metrics
- `POST /resume/tailor` -> generate tailored ATS resume payload for job
- `POST /apply/:jobId` -> assisted or user-approved apply flow
- `GET /applications` -> tracker data + kanban + events + skill gaps + AI suggestions
- `GET /applications/:userId` -> same, self-access protected
- `PATCH /applications/:applicationId/status` -> status transitions + learning refresh
- `GET /dashboard` -> combined recommendations + tracker snapshot

## 4. Frontend Integration

### New service

- `frontend/src/services/careerTwinService.ts`

### New pages

- `frontend/src/app/(dashboard)/career-twin/page.tsx` (AI Twin dashboard)
- `frontend/src/app/(dashboard)/career-twin/recommendations/page.tsx`
- `frontend/src/app/(dashboard)/career-twin/tracker/page.tsx` (kanban)

### UX blocks included

- Recommended Jobs
- Applications summary + tracker link
- AI Suggestions
- Skill Gaps
- Filters (query/location/work mode)
- Progress indicators and status tags

## 5. Safe sourcing policy

Research Agent is intentionally constrained to safe structured data ingestion.

- Allowed: company careers feeds/APIs/structured listings
- Disallowed by design: risky scraping bots and platform-rule violations

## 6. Production hardening checklist

1. Add authenticated job feed adapters (Greenhouse, Lever, Workday APIs).
2. Add job dedupe by semantic fingerprint + URL canonicalization.
3. Add background workers for periodic job sync and learning updates.
4. Add vector search for skill-job semantic matching.
5. Add analytics events for recommendation CTR and application conversion.
6. Add fine-grained permissions for admin feed ingestion.

## 7. Quick start in this repo

1. Start backend and frontend as usual.
2. Open `/career-twin`.
3. Upload resume text/PDF.
4. Review recommendations.
5. Run assisted apply or user-approved apply.
6. Track transitions in `/career-twin/tracker`.
7. Update outcomes to trigger Learning Agent feedback loops.

## 8. Provider adapters + scheduler

### Safe provider adapters implemented

- Greenhouse boards API adapter
- Lever postings API adapter
- Workday JSON feed adapter

Mapper enhancements implemented:

- Department inference
- Seniority inference
- Compensation normalization (currency/range/interval + annualized USD estimate)
- Canonical URL normalization for duplicate suppression
- Fingerprint-based duplicate suppression

Quality checks added during ingestion:

- Missing/short title detection
- Missing company detection
- Missing apply URL detection
- Short description detection
- Missing skills detection
- Stale posting detection

Each ingested job now stores `metadata.qualityScore` and `metadata.qualityFlags`.

Files:

- `backend/src/modules/career-twin/providers/job-source-adapters.js`
- `backend/src/modules/career-twin/sync-manager.js`
- `backend/src/modules/career-twin/scheduler.js`
- `backend/src/modules/career-twin/job-sync-log-model.js`

### Required env configuration (optional but recommended)

- `CAREER_TWIN_GREENHOUSE_BOARDS=board1,board2`
- `CAREER_TWIN_LEVER_COMPANIES=companyA,companyB`
- `CAREER_TWIN_WORKDAY_FEEDS=https://example.com/jobs.json,https://example.org/feed.json`

### Scheduler behavior

- Every 30 minutes: enqueue configured sources from env
- Every 5 minutes: process due queue items
- Retry policy: 1m -> 5m -> 15m for failed sync tasks

Per-source interval enforcement:

- Persisted source configs include `syncIntervalMinutes`
- Scheduler enqueue step respects interval windows per source
- Queue guard prevents duplicate queued/running jobs for same source

Auto-disable policy:

- Sources track `failureStreak`
- If failures reach threshold (`CAREER_TWIN_AUTO_DISABLE_FAILURE_STREAK`, default 3), source is auto-disabled
- Auto-disable runs only when `autoDisableEnabled=true` and `autoDisableBypass=false`
- Admin can re-enable source and reset streak via source config update

## 9. Analytics API

Added endpoint:

- `GET /api/career-twin/analytics/funnel?lookbackDays=30`

Returns:

- stage conversion counts and drop-offs
- fit-category conversion rates (strong_fit/moderate_fit/stretch)
- summary totals (applications, shortlisted, interviews, offers, rejections)

Admin sync ops endpoints:

- `POST /api/career-twin/admin/sync/trigger`
- `POST /api/career-twin/admin/sync/queue`
- `POST /api/career-twin/admin/sync/run`
- `GET /api/career-twin/admin/sync/status`

Admin source config endpoints:

- `GET /api/career-twin/admin/sources`
- `POST /api/career-twin/admin/sources`
- `PATCH /api/career-twin/admin/sources/:sourceId`
- `DELETE /api/career-twin/admin/sources/:sourceId`
- `POST /api/career-twin/admin/sources/:sourceId/queue`
- `POST /api/career-twin/admin/sources/:sourceId/recover`

Frontend admin manager:

- `/career-twin/analytics` includes source CRUD + queue controls for admin users.
- Source health badges (healthy/warning/critical) and active alerts are displayed for admins.
- Manual override toggle and auto-disable toggle are available per source.
- Recover action is available per source: re-enables source, clears auto-disable reason, resets failure streak, and queues an immediate sync.
