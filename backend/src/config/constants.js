module.exports = {
    // User Roles
    ROLES: {
        USER: 'user',
        ADMIN: 'admin',
    },

    // Subscription Tiers
    SUBSCRIPTION_TIERS: {
        FREE: 'free',
        PRO: 'pro',
        ENTERPRISE: 'enterprise',
    },

    // AI Providers
    AI_PROVIDERS: {
        GEMINI: 'gemini',
        OPENAI: 'openai',
    },

    // AI Key Status
    AI_KEY_STATUS: {
        ACTIVE: 'active',
        DISABLED: 'disabled',
        QUOTA_EXCEEDED: 'quota_exceeded',
    },

    // Modules
    MODULES: {
        DSA: 'dsa',
        RESUME: 'resume',
        INTERVIEW: 'interview',
        ROADMAP: 'roadmap',
        RESEARCH: 'research',
        PDF: 'pdf',
        SKILL_MARKETPLACE: 'skill-marketplace',
        CAREER_TWIN: 'career-twin',
        CAREER_GRAPH: 'career-graph',
        OPPORTUNITY_RADAR: 'opportunity-radar',
        REVERSE_INTERVIEW: 'reverse-interview',
    },

    // Interview Rounds
    INTERVIEW_ROUNDS: {
        TECHNICAL: 'technical',
        BEHAVIORAL: 'behavioral',
        SYSTEM_DESIGN: 'system-design',
        CODING: 'coding',
    },

    // DSA Difficulty
    DSA_DIFFICULTY: {
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard',
    },

    // Marketplace Status
    MARKETPLACE_STATUS: {
        OPEN: 'open',
        MATCHED: 'matched',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
    },

    // Default Limits
    LIMITS: {
        FREE_TIER: {
            DSA_PROBLEMS_PER_DAY: 5,
            INTERVIEW_SESSIONS_PER_MONTH: 3,
            RESUME_VERSIONS: 2,
            PDF_UPLOADS_PER_MONTH: 5,
        },
        PRO_TIER: {
            DSA_PROBLEMS_PER_DAY: 50,
            INTERVIEW_SESSIONS_PER_MONTH: 30,
            RESUME_VERSIONS: 10,
            PDF_UPLOADS_PER_MONTH: 50,
        },
        ENTERPRISE_TIER: {
            DSA_PROBLEMS_PER_DAY: -1, // unlimited
            INTERVIEW_SESSIONS_PER_MONTH: -1,
            RESUME_VERSIONS: -1,
            PDF_UPLOADS_PER_MONTH: -1,
        },
    },

    // AI Token Limits (per key)
    AI_TOKEN_LIMITS: {
        DAILY_TOKENS: 1000000,
        REQUESTS_PER_MINUTE: 60,
    },

    // Error Codes
    ERROR_CODES: {
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
        AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
        NOT_FOUND: 'NOT_FOUND',
        QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
        AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
        DATABASE_ERROR: 'DATABASE_ERROR',
        INTERNAL_ERROR: 'INTERNAL_ERROR',
    },
};
