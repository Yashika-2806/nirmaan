const buildSkillGapPrompt = ({ targetRole, readinessScore, currentSkillProfile, requiredSkillProfile, context }) => `You are Career Twin's analysis brain for Career GPS.

Goal: Analyze skill gaps for a learner targeting ${targetRole}.
Current readiness score: ${readinessScore}/100.

Current Skill Profile:
${JSON.stringify(currentSkillProfile, null, 2)}

Required Skill Profile:
${JSON.stringify(requiredSkillProfile, null, 2)}

Additional Context:
${JSON.stringify(context, null, 2)}

Return STRICT JSON (no markdown):
{
  "requiredSkillProfile": [{ "skill": "DSA Skill", "value": 0 }],
  "gapAnalysis": [{ "skill": "DSA Skill", "current": 0, "required": 0, "gap": 0 }],
  "recommendations": ["Actionable recommendation"]
}

Rules:
- Keep values in range 0-100
- Gap must be max(required - current, 0)
- Focus on practical employability skills for ${targetRole}`;

const buildRoadmapPrompt = ({ targetRole, gapAnalysis, readinessScore }) => `You are a career navigator that builds weekly execution roadmaps.

Target Role: ${targetRole}
Career Readiness Score: ${readinessScore}
Gap Analysis:
${JSON.stringify(gapAnalysis, null, 2)}

Return STRICT JSON (no markdown):
{
  "timelineStages": [
    {
      "key": "dsa_fundamentals",
      "title": "DSA Fundamentals",
      "description": "...",
      "requiredTaskCompletions": 3,
      "order": 1
    }
  ],
  "tasks": [
    {
      "weekNumber": 1,
      "title": "Solve 10 array and string problems",
      "description": "...",
      "category": "dsa",
      "targetCount": 10,
      "xpReward": 40,
      "linkedStageKey": "dsa_fundamentals"
    }
  ]
}

Rules:
- Generate exactly 4 to 8 weeks of tasks
- Tasks must be measurable and action-oriented
- Keep categories to: dsa, project, interview, resume, communication, research, networking
- Build stages in realistic sequence from fundamentals to target job readiness`;

const buildMissionsPrompt = ({ targetRole, gapAnalysis }) => `You generate daily missions for Career GPS.

Target Role: ${targetRole}
Top Gaps:
${JSON.stringify(gapAnalysis.slice(0, 4), null, 2)}

Return STRICT JSON (no markdown):
{
  "missions": [
    {
      "title": "Solve 2 DSA problems",
      "category": "dsa",
      "targetCount": 2,
      "xpReward": 15,
      "readinessImpact": 2
    }
  ]
}

Rules:
- Return exactly 3 missions
- Missions should be doable in one day
- Align each mission with the biggest skill gaps`;

module.exports = {
    buildSkillGapPrompt,
    buildRoadmapPrompt,
    buildMissionsPrompt,
};
