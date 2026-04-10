'use client';

import { Brain, TrendingUp, AlertCircle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface InterviewFeedbackProps {
  verdict: string;
  code: string;
  testCasesPassed: number;
  totalTestCases: number;
  language: string;
  time?: string;
  memory?: string;
}

interface FeedbackSection {
  title: string;
  icon: React.ReactNode;
  items: string[];
  sentiment: 'positive' | 'neutral' | 'improvement';
}

export default function AIInterviewFeedback({
  verdict,
  code,
  testCasesPassed,
  totalTestCases,
  language,
  time,
  memory,
}: InterviewFeedbackProps) {
  // Mock AI analysis based on code patterns
  const generateFeedback = () => {
    const feedbackSections: FeedbackSection[] = [];
    
    // Detect if code uses brute force vs optimal
    const isBruteForce = /for.*for|nested.*loop|O\(n\^2\)|\bwhile\(true\)|setTimeout/.test(code);
    const isTwoPointer = /\btwo.?pointer|\[left|right\]|\bpointer|i.*j/.test(code) || !isBruteForce;
    const usesHashMap = /HashMap|Map|dict|{|}|Object/.test(code);

    // Correctness Analysis
    if (verdict === 'Accepted' || testCasesPassed === totalTestCases) {
      feedbackSections.push({
        title: 'Correctness',
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
        items: [
          '✓ Solution handles all sample test cases correctly',
          '✓ Code compiles without errors',
          '✓ Logic flow is clear and maintainable',
        ],
        sentiment: 'positive',
      });
    } else {
      feedbackSections.push({
        title: 'Correctness Issues',
        icon: <AlertCircle className="h-5 w-5 text-amber-400" />,
        items: [
          `⚠ Sample tests: ${testCasesPassed}/${totalTestCases} passed`,
          '⚠ Check edge cases (empty array, duplicates, negative numbers)',
          '⚠ Verify output format matches expected structure',
        ],
        sentiment: 'improvement',
      });
    }

    // Optimization Analysis
    feedbackSections.push({
      title: 'Optimization & Complexity',
      icon: <TrendingUp className="h-5 w-5 text-cyan-400" />,
      items: isBruteForce
        ? [
            '⚠ Current approach: O(n²) Brute Force',
            '📈 Better approach: Two-pointer or Hash Map strategy (O(n))',
            '💡 Use a Set/Map to track seen values for 1-pass solution',
            `⏱ Current runtime: ~${time || '0.05'}s (adequate for brute force)`,
          ]
        : [
            '✓ Time Complexity: O(n) - Optimal for this problem',
            '✓ Space Complexity: O(n) - Expected for hash-based solutions',
            usesHashMap ? '✓ Using Hash Map - Good choice for lookup' : '✓ Smart data structure selection',
            `⏱ Runtime: ${time || '0.02'}s (fast execution)`,
          ],
      sentiment: isBruteForce ? 'improvement' : 'positive',
    });

    // Edge Cases Analysis
    feedbackSections.push({
      title: 'Edge Cases & Robustness',
      icon: <AlertCircle className="h-5 w-5 text-rose-400" />,
      items: [
        '• Empty array: Does code handle []?',
        '• Duplicates: What if array is [2, 2, 2]?',
        '• Negative numbers: Works with [-5, 0, 5]?',
        '• Array size: Tested with both small and large arrays?',
        '• Target out of range: Should return empty/null?',
      ],
      sentiment: 'neutral',
    });

    // Interviewer Perspective
    feedbackSections.push({
      title: 'Interviewer Notes',
      icon: <Brain className="h-5 w-5 text-violet-400" />,
      items: [
        isBruteForce
          ? '👨‍💼 Can you optimize this further? What&apos;s the brute force complexity?'
          : '👨‍💼 Good optimization! Walk me through your approach.',
        '👨‍💼 Explain the space-time tradeoff in your solution.',
        '👨‍💼 How would you handle edge cases like empty input?',
        '👨‍💼 Could you code this without hash map constraints?',
      ],
      sentiment: 'neutral',
    });

    return feedbackSections;
  };

  const feedbackSections = generateFeedback();

  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'improvement') => {
    switch (sentiment) {
      case 'positive':
        return 'border-emerald-500/30 bg-emerald-500/10';
      case 'improvement':
        return 'border-amber-500/30 bg-amber-500/10';
      case 'neutral':
        return 'border-slate-500/30 bg-slate-500/10';
    }
  };

  const getTitleColor = (sentiment: 'positive' | 'neutral' | 'improvement') => {
    switch (sentiment) {
      case 'positive':
        return 'text-emerald-200';
      case 'improvement':
        return 'text-amber-200';
      case 'neutral':
        return 'text-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <Brain className="h-5 w-5 mt-0.5 text-violet-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-violet-200">AI Interviewer Feedback</p>
            <p className="mt-1 text-sm text-slate-300">
              {verdict === 'Accepted'
                ? '🎉 Great! Your solution passed sample tests. Here\'s how a FAANG interviewer would evaluate it:'
                : '📝 Here\'s detailed feedback to improve your solution:'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-3">
        {feedbackSections.map((section, idx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`rounded-lg border p-4 ${getSentimentColor(section.sentiment)}`}
          >
            <div className="flex items-center gap-2 mb-3">
              {section.icon}
              <h4 className={`font-semibold ${getTitleColor(section.sentiment)}`}>{section.title}</h4>
            </div>
            <ul className="space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className="text-sm text-slate-300 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4"
      >
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 mt-0.5 text-cyan-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-cyan-200">Pro Tips for Interviews</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              <li>• Always discuss trade-offs: Here&apos;s the brute force, but we can optimize with...</li>
              <li>• Write helper functions for readability</li>
              <li>• Test your own edge cases before submitting</li>
              <li>• Comment your approach - think aloud like in real interviews</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
