# Nirmaan Platform

Nirmaan is a modular, AI-enabled career development platform that combines learning, interview preparation, resume support, analytics, and an intelligent Career Twin workflow.

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [End-to-End Request and Data Flow](#end-to-end-request-and-data-flow)
4. [Career Orchestration Workflow](#career-orchestration-workflow)
5. [Data Model](#data-model)
6. [Scheduler and Reliability Pipeline](#scheduler-and-reliability-pipeline)
7. [Repository Structure](#repository-structure)

## Overview

The platform is split into:

- `frontend/`: Next.js application and client-side services
- `backend/`: Express API, domain modules, AI integrations, and persistence
- `images/`: Architecture and workflow diagrams used in this README

Core capability domains include:

- Career Twin
- DSA practice and interview tooling
- Gamification and growth analytics
- Skill marketplace

## System Architecture

This diagram shows the top-level architecture from users to frontend, API gateway, backend modules, and integrations.

<img src="images/System%20Architecture%20Diagram%20-%20visual%20selection.png" alt="System Architecture Diagram" width="560" />

## End-to-End Request and Data Flow

This flow visualizes how user actions move through frontend services, API proxying, backend middleware, business services, optional AI calls, persistence, and response formatting.

<img src="images/End-to-End%20Data%20Pipeline%20Diagram%20-%20visual%20selection.png" alt="End-to-End Data Pipeline Diagram" width="1500" />

## Career Orchestration Workflow

This workflow describes the multi-agent orchestration lifecycle used for job ingestion, matching, resume tailoring, application drafting, tracking, and feedback loops.

<img src="images/Career%20Orchestration%20Workflow.png" alt="Career Orchestration Workflow" width="620" />

### Workflow Stages

1. Resume parsing and skills graph generation
2. Job ingestion, normalization, and deduplication
3. Fit score and skill-gap detection
4. Tailored resume generation
5. Application drafting and submission
6. Status tracking timeline and Kanban progression
7. Role and skill weight updates
8. Feedback loop for continuous improvement

## Data Model

The ER diagram captures domain-level data relationships across core user data, Career Twin, gamification, marketplace, and analytics.

<img src="images/Database%20ER-Diagram.png" alt="Database ER Diagram" width="560" />

## Scheduler and Reliability Pipeline

This diagram explains the reliability-oriented scheduler pipeline for source enqueueing, validation, persistence, retry, failure handling, and admin recovery.

<img src="images/Scheduler%20%26%20Reliability%20Pipeline%20Diagram.png" alt="Scheduler and Reliability Pipeline Diagram" width="700" />

### Reliability Features

- Batch queue processing
- Normalization and validation
- Deduplication and quality scoring
- Failure streak monitoring
- Retry with backoff
- Auto-disable unhealthy sources
- Admin override and recovery controls

## Repository Structure

```text
nirmaan/
├─ backend/
│  ├─ src/
│  │  ├─ core/
│  │  ├─ modules/
│  │  └─ routes/
│  └─ scripts/
├─ frontend/
│  └─ src/
│     ├─ app/
│     ├─ components/
│     ├─ services/
│     └─ store/
└─ images/
```

## Notes

- Keep all architecture diagrams under `images/` and update this README when diagrams change.
- Use URL-encoded paths in markdown image references for names that contain spaces.
