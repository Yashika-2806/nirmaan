const ACTIVITY_RULES = {
    dsa_problem_solved: {
        sourceModule: 'dsa',
        xp: 10,
        credits: 5,
        stats: { dsaProblemsSolved: 1 },
        meaningful: true,
    },
    mock_interview_completed: {
        sourceModule: 'interview',
        xp: 25,
        credits: 15,
        stats: { mockInterviewsCompleted: 1 },
        meaningful: true,
    },
    resume_improved: {
        sourceModule: 'resume',
        xp: 15,
        credits: 10,
        stats: { resumesImproved: 1 },
        meaningful: true,
    },
    skill_marketplace_helped: {
        sourceModule: 'skill-marketplace',
        xp: 30,
        credits: 50,
        stats: { skillSessionsTaught: 1, skillMarketplaceContributions: 1 },
        meaningful: true,
    },
    pdf_exam_session_completed: {
        sourceModule: 'pdf',
        xp: 20,
        credits: 12,
        stats: { pdfPracticeSessions: 1 },
        meaningful: true,
    },
    research_task_completed: {
        sourceModule: 'research',
        xp: 12,
        credits: 8,
        stats: { researchTasksCompleted: 1 },
        meaningful: true,
    },
    roadmap_milestone_completed: {
        sourceModule: 'roadmap',
        xp: 18,
        credits: 10,
        stats: { roadmapMilestonesCompleted: 1 },
        meaningful: true,
    },
    career_twin_session_completed: {
        sourceModule: 'career-twin',
        xp: 14,
        credits: 8,
        stats: { careerTwinSessions: 1 },
        meaningful: true,
    },
    quest_reward_claimed: {
        sourceModule: 'gamification',
        xp: 0,
        credits: 0,
        stats: { questsCompleted: 1 },
        meaningful: false,
    },
};

const LEVEL_TITLES = [
    { min: 50, title: 'Career Master' },
    { min: 20, title: 'Career Ready' },
    { min: 10, title: 'Skilled' },
    { min: 5, title: 'Learner' },
    { min: 1, title: 'Beginner' },
];

const BADGE_DEFINITIONS = [
    {
        key: 'dsa_starter',
        title: 'DSA Starter',
        description: 'Solved 25 DSA problems',
        milestone: '25 DSA problems solved',
        icon: 'code',
        color: '#22d3ee',
        check: (profile) => profile.stats.dsaProblemsSolved >= 25,
    },
    {
        key: 'interview_warrior',
        title: 'Interview Warrior',
        description: 'Completed 10 mock interviews',
        milestone: '10 mock interviews completed',
        icon: 'message-square',
        color: '#a78bfa',
        check: (profile) => profile.stats.mockInterviewsCompleted >= 10,
    },
    {
        key: 'resume_expert',
        title: 'Resume Expert',
        description: 'Improved resume 3 times',
        milestone: '3 resume improvements',
        icon: 'file-text',
        color: '#34d399',
        check: (profile) => profile.stats.resumesImproved >= 3,
    },
    {
        key: 'skill_mentor',
        title: 'Skill Mentor',
        description: 'Taught 5 skill sessions',
        milestone: '5 skill sessions taught',
        icon: 'users',
        color: '#f59e0b',
        check: (profile) => profile.stats.skillSessionsTaught >= 5,
    },
    {
        key: 'consistency_master',
        title: 'Consistency Master',
        description: 'Maintained a 30 day career streak',
        milestone: '30 day streak',
        icon: 'flame',
        color: '#ef4444',
        check: (profile) => profile.streakLongest >= 30,
    },
];

const WEEKLY_QUEST_TEMPLATE = {
    tasks: [
        { key: 'dsa_problems', label: 'Solve DSA problems', target: 10 },
        { key: 'mock_interviews', label: 'Complete mock interviews', target: 2 },
        { key: 'resume_improvements', label: 'Improve resume once', target: 1 },
    ],
    reward: {
        xp: 200,
        credits: 100,
        badgeKey: 'career_achiever',
        badgeTitle: 'Career Achiever',
    },
};

const QUEST_ACTIVITY_PROGRESS = {
    dsa_problem_solved: { taskKey: 'dsa_problems', increment: 1 },
    mock_interview_completed: { taskKey: 'mock_interviews', increment: 1 },
    resume_improved: { taskKey: 'resume_improvements', increment: 1 },
};

function calculateLevel(totalXp) {
    const level = Math.max(1, Math.floor(totalXp / 100) + 1);
    const currentLevelFloor = (level - 1) * 100;
    const nextLevelAt = level * 100;
    const xpInCurrentLevel = totalXp - currentLevelFloor;

    return {
        level,
        xpInCurrentLevel,
        xpForNextLevel: nextLevelAt - currentLevelFloor,
    };
}

function getLevelTitle(level) {
    const matched = LEVEL_TITLES.find((item) => level >= item.min);
    return matched ? matched.title : 'Beginner';
}

module.exports = {
    ACTIVITY_RULES,
    BADGE_DEFINITIONS,
    WEEKLY_QUEST_TEMPLATE,
    QUEST_ACTIVITY_PROGRESS,
    calculateLevel,
    getLevelTitle,
};
