const buildProfileParsePrompt = ({ resumeText, preferences }) => `You are the Profile Agent for a career platform.
Extract structured JSON from the resume text and user preferences.
Return ONLY JSON.

Resume Text:
${resumeText.slice(0, 25000)}

Preferences:
${JSON.stringify(preferences || {}, null, 2)}

Output schema:
{
  "headline": "",
  "preferredRoles": [""],
  "preferredLocations": [""],
  "workMode": "remote|hybrid|onsite|any",
  "strengths": [""],
  "skills": [{"name":"","level":0,"years":0,"source":"resume"}],
  "projects": [{"name":"","summary":"","technologies":[""],"impact":""}],
  "experiences": [{"role":"","company":"","durationMonths":0,"highlights":[""]}]
}`;

const buildMatchingPrompt = ({ profileSummary, jobs }) => `You are the Matching Agent.
Given candidate profile and jobs, return ranking with fit score and interview probability.
Return ONLY JSON.

Candidate:
${JSON.stringify(profileSummary, null, 2)}

Jobs:
${JSON.stringify(jobs, null, 2)}

Output schema:
{
  "results": [
    {
      "jobRef": "<job external id>",
      "fitScore": 0,
      "interviewProbability": 0,
      "fitCategory": "strong_fit|moderate_fit|stretch",
      "missingSkills": [""],
      "reasoning": [""],
      "resumeFitScore": 0
    }
  ]
}`;

const buildTailoredResumePrompt = ({ profile, job }) => `You are the Resume Agent.
Generate ATS-oriented tailored content for this role using ONLY profile facts.
Return ONLY JSON.

Profile:
${JSON.stringify(profile, null, 2)}

Job:
${JSON.stringify(job, null, 2)}

Output schema:
{
  "summary": "",
  "bullets": ["", "", ""],
  "atsKeywords": [""],
  "resumeFitScore": 0,
  "projectOrder": ["projectName"]
}`;

const buildApplyAnswersPrompt = ({ profile, job }) => `You are the Apply Agent.
Generate concise, specific application answers.
Return ONLY JSON.

Profile:
${JSON.stringify(profile, null, 2)}

Job:
${JSON.stringify(job, null, 2)}

Output schema:
{
  "whyThisRole": "",
  "whyYou": "",
  "impactStory": ""
}`;

const buildLearningPrompt = ({ profileSignals, recentOutcomes }) => `You are the Learning Agent.
Infer weight updates for role and skill signals from outcomes.
Return ONLY JSON.

Current Signals:
${JSON.stringify(profileSignals, null, 2)}

Recent Outcomes:
${JSON.stringify(recentOutcomes, null, 2)}

Output schema:
{
  "roleWeightUpdates": [{"key":"","delta":0}],
  "skillWeightUpdates": [{"key":"","delta":0}],
  "insights": [""]
}`;

module.exports = {
  buildProfileParsePrompt,
  buildMatchingPrompt,
  buildTailoredResumePrompt,
  buildApplyAnswersPrompt,
  buildLearningPrompt,
};
