# Setting Up Google Gemini AI

To enable the AI Job Interviewer and DSA Feedback features, you need a Google Gemini API Key.

## 1. Get your API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click the **"Create API key"** button.
4. Choose **"Create API key in new project"** (or use an existing project).
5. Copy the key string (it starts with `AIza...`).

## 2. Configure Backend
1. Open the file `backend/.env`.
2. Find the line `GEMINI_KEY_1=...` (or add it if missing).
3. Paste your key:

```env
GEMINI_KEY_1=AIzaSy...YourActualKeyHere
```

4. Save the file.
5. Restart your backend server (if it doesn't auto-restart).

## 3. Verify
- Go to the DSA Dashboard.
- Open a problem.
- Click the "Check" (Circle) icon on a question.
- Enter an answer and submit.
- The AI should now respond with feedback!
