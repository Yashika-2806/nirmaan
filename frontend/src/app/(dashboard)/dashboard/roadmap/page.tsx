'use client';

import { useState, useEffect } from 'react';
import {
    Map, Target, Calendar, Zap, Loader2, ChevronLeft, Plus, Trash2,
    CheckCircle, Circle, BookOpen, Code, FileText, Layers, Star,
    TrendingUp, Brain, X, ChevronRight, Clock, Award, Lightbulb,
    ExternalLink, BarChart2, HelpCircle, GraduationCap, Briefcase, Globe
} from 'lucide-react';
import { roadmapService, Roadmap } from '@/services/roadmapService';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const resourceIcon = (type: string) => {
    switch (type) {
        case 'course': return <Layers className="w-5 h-5 text-purple-400" />;
        case 'book': return <BookOpen className="w-5 h-5 text-blue-400" />;
        case 'project': return <Code className="w-5 h-5 text-green-400" />;
        case 'practice': return <Target className="w-5 h-5 text-yellow-400" />;
        default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
};

const progressColor = (pct: number) =>
    pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-[#00D9FF]' : pct >= 25 ? 'bg-yellow-500' : 'bg-gray-600';

/** Parse a milestone duration string like "Month 1-1.5" → number of weeks */
function parseDurationToWeeks(duration: string): number {
    const rangeMatch = duration.match(/Month\s*([\d.]+)\s*[-–]\s*([\d.]+)/i);
    if (rangeMatch) {
        const start = parseFloat(rangeMatch[1]);
        const end = parseFloat(rangeMatch[2]);
        return Math.max(1, Math.round((end - start) * 4.33));
    }
    const weekMatch = duration.match(/(\d+)\s*week/i);
    if (weekMatch) return parseInt(weekMatch[1]);
    const monthMatch = duration.match(/(\d+)\s*month/i);
    if (monthMatch) return Math.min(parseInt(monthMatch[1]) * 4, 12);
    return 4;
}

/** Distribute skills evenly across weeks */
function getWeekSkills(skills: string[], weekIdx: number, numWeeks: number): string[] {
    if (skills.length === 0) return [];
    const perWeek = Math.ceil(skills.length / numWeeks);
    return skills.slice(weekIdx * perWeek, (weekIdx + 1) * perWeek);
}

/** Quiz questions bank */
const QUIZ_QUESTIONS: Array<{ q: string; options: string[]; answer: number }> = [
    { q: 'What does "Big O Notation" represent?', options: ['Best case complexity', 'Worst case complexity', 'Average case complexity', 'Space complexity only'], answer: 1 },
    { q: 'Which data structure uses LIFO (Last In, First Out)?', options: ['Queue', 'Stack', 'Array', 'Linked List'], answer: 1 },
    { q: 'What is a key benefit of version control (Git)?', options: ['Faster code execution', 'Track changes and collaborate', 'Auto-fix bugs', 'Deploy to cloud'], answer: 1 },
    { q: 'What does API stand for?', options: ['Automated Program Interface', 'Application Programming Interface', 'Applied Process Integration', 'Adaptive Program Iteration'], answer: 1 },
    { q: 'Which cloud provider offers EC2, S3, and Lambda services?', options: ['Google Cloud', 'Azure', 'AWS', 'Cloudflare'], answer: 2 },
    { q: 'What is the time complexity of binary search?', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], answer: 2 },
    { q: 'In OOP, what is encapsulation?', options: ['Inheriting from a parent class', 'Bundling data and methods together', 'Overriding a method', 'Creating multiple instances'], answer: 1 },
    { q: 'Which HTTP method is typically used to update a resource?', options: ['GET', 'POST', 'PUT', 'DELETE'], answer: 2 },
];

/** Get 5 quiz questions for a completed milestone */
function getQuizForSkills(_skills: string[]) {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
}

/** Curated paid course recommendations based on role/goal */
function getCourseRecommendations(role: string, goal: string) {
    const lower = (goal + ' ' + role).toLowerCase();
    if (lower.includes('machine learning') || lower.includes('ml') || lower.includes('ai') || lower.includes('data science')) {
        return [
            { title: 'Machine Learning Specialization', platform: 'Coursera (Andrew Ng)', url: 'https://www.coursera.org/specializations/machine-learning-introduction', price: '$49/mo', rating: 5 },
            { title: 'Deep Learning Specialization', platform: 'Coursera (deeplearning.ai)', url: 'https://www.coursera.org/specializations/deep-learning', price: '$49/mo', rating: 5 },
            { title: 'Machine Learning A-Z', platform: 'Udemy', url: 'https://www.udemy.com/course/machinelearning/', price: '~$15', rating: 4 },
            { title: 'Complete Data Science Bootcamp', platform: 'Udemy', url: 'https://www.udemy.com/course/the-data-science-course-complete-data-science-bootcamp/', price: '~$15', rating: 5 },
        ];
    }
    if (lower.includes('full stack') || lower.includes('frontend') || lower.includes('backend') || lower.includes('web')) {
        return [
            { title: 'The Web Developer Bootcamp', platform: 'Udemy (Colt Steele)', url: 'https://www.udemy.com/course/the-web-developer-bootcamp/', price: '~$15', rating: 5 },
            { title: 'Full-Stack Web Development with React', platform: 'Coursera (HKUST)', url: 'https://www.coursera.org/specializations/full-stack-react', price: '$49/mo', rating: 4 },
            { title: 'NodeJS - The Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/nodejs-the-complete-guide/', price: '~$15', rating: 5 },
            { title: 'React - The Complete Guide', platform: 'Udemy (Maximilian)', url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', price: '~$15', rating: 5 },
        ];
    }
    if (lower.includes('cloud') || lower.includes('aws') || lower.includes('devops') || lower.includes('kubernetes')) {
        return [
            { title: 'AWS Certified Solutions Architect', platform: 'Udemy (Stephane Maarek)', url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/', price: '~$15', rating: 5 },
            { title: 'Docker and Kubernetes: The Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/', price: '~$15', rating: 5 },
            { title: 'Google Cloud Professional Data Engineer', platform: 'Coursera', url: 'https://www.coursera.org/professional-certificates/gcp-data-engineering', price: '$49/mo', rating: 4 },
            { title: 'Linux Foundation Kubernetes (CKA)', platform: 'Linux Foundation', url: 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/', price: '$395', rating: 5 },
        ];
    }
    if (lower.includes('android') || lower.includes('ios') || lower.includes('mobile') || lower.includes('flutter')) {
        return [
            { title: 'Flutter & Dart - The Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/learn-flutter-dart-to-build-ios-android-apps/', price: '~$15', rating: 5 },
            { title: 'The Complete Android Developer Course', platform: 'Udemy', url: 'https://www.udemy.com/course/the-complete-android-oreo-developer-course/', price: '~$15', rating: 4 },
            { title: 'iOS & Swift - The Complete iOS App Development Bootcamp', platform: 'Udemy (Angela Yu)', url: 'https://www.udemy.com/course/ios-13-app-development-bootcamp/', price: '~$15', rating: 5 },
        ];
    }
    // Default (SWE / FAANG / general)
    return [
        { title: 'Grokking the Coding Interview Patterns', platform: 'Educative.io', url: 'https://www.educative.io/courses/grokking-coding-interview-patterns-java', price: '$49/mo', rating: 5 },
        { title: 'Master the Coding Interview: DSA', platform: 'Udemy (ZTM)', url: 'https://www.udemy.com/course/master-the-coding-interview-data-structures-algorithms/', price: '~$15', rating: 5 },
        { title: 'System Design Interview – Insider\'s Guide', platform: 'Educative.io', url: 'https://www.educative.io/courses/grokking-the-system-design-interview', price: '$49/mo', rating: 5 },
        { title: 'CS50: Intro to Computer Science', platform: 'edX (Harvard)', url: 'https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science', price: 'Free / $149 cert', rating: 5 },
    ];
}

/** Curated internship links based on role/goal */
function getInternshipLinks(role: string, goal: string) {
    const lower = (goal + ' ' + role).toLowerCase();
    const base = [
        { title: 'Software Engineering Internships', platform: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=software+engineer+intern', type: 'Job Board' },
        { title: 'Tech Internships', platform: 'Internshala', url: 'https://internshala.com/internships/computer-science-internship', type: 'Job Board' },
        { title: 'Software Engineer Intern', platform: 'Wellfound (AngelList)', url: 'https://wellfound.com/jobs?role=software-engineer&jobType=intern', type: 'Startup' },
        { title: 'Google STEP Internship', platform: 'Google Careers', url: 'https://careers.google.com/jobs/results/?category=ENGINEERING&employment_type=INTERN', type: 'Big Tech' },
        { title: 'Microsoft Explore Internship', platform: 'Microsoft Careers', url: 'https://careers.microsoft.com/us/en/job/internship', type: 'Big Tech' },
        { title: 'Amazon SDE Internship', platform: 'Amazon Jobs', url: 'https://www.amazon.jobs/en/job_categories/software-development?country=IN&employment_type%5B%5D=INTERN', type: 'Big Tech' },
        { title: 'Meta Software Engineering Intern', platform: 'Meta Careers', url: 'https://www.metacareers.com/jobs?offices[0]=India&roles[0]=Software%20Engineer%20Internship', type: 'Big Tech' },
        { title: 'Tech Internship Listings', platform: 'Unstop', url: 'https://unstop.com/internships/software-developer', type: 'Job Board' },
    ];
    if (lower.includes('data') || lower.includes('ml') || lower.includes('ai')) {
        return [
            { title: 'Data Science / ML Internships', platform: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=data+science+machine+learning+intern', type: 'Job Board' },
            { title: 'ML Research Internship', platform: 'Internshala', url: 'https://internshala.com/internships/machine-learning-internship', type: 'Research' },
            ...base.slice(2),
        ];
    }
    if (lower.includes('frontend') || lower.includes('web')) {
        return [
            { title: 'Frontend Developer Internship', platform: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=frontend+developer+intern', type: 'Job Board' },
            ...base.slice(1),
        ];
    }
    if (lower.includes('cloud') || lower.includes('devops')) {
        return [
            { title: 'Cloud / DevOps Internship', platform: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=cloud+devops+intern', type: 'Job Board' },
            ...base.slice(1),
        ];
    }
    return base;
}

// ─── Quiz Modal ───────────────────────────────────────────────────────────────
function QuizModal({ skills, milestoneTitle, onClose }: { skills: string[]; milestoneTitle: string; onClose: () => void }) {
    const [step, setStep] = useState<'intro' | 'quiz' | 'result'>('intro');
    const [questions] = useState(() => getQuizForSkills(skills));
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [answers, setAnswers] = useState<boolean[]>([]);

    const handleNext = () => {
        if (selected === null) return;
        const correct = selected === questions[current].answer;
        const newAnswers = [...answers, correct];
        setAnswers(newAnswers);
        setSelected(null);
        if (current + 1 >= questions.length) { setStep('result'); }
        else { setCurrent(c => c + 1); }
    };

    const score = answers.filter(Boolean).length;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#00D9FF]/10 rounded-lg">
                            <HelpCircle className="w-6 h-6 text-[#00D9FF]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Practice Quiz</h2>
                            <p className="text-base text-white/50 truncate max-w-[260px]">{milestoneTitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'intro' && (
                        <div className="space-y-5 text-center">
                            <div className="text-5xl">🎉</div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Week Complete!</h3>
                                <p className="text-lg text-white/60">Optional quiz to reinforce your learning:</p>
                                <div className="flex flex-wrap gap-2 justify-center mt-3">
                                    {skills.slice(0, 5).map((s, i) => (
                                        <span key={i} className="bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20 px-3 py-1 rounded-full text-base">{s}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/20 text-lg text-white/70 hover:bg-white/10 transition-colors">
                                    Skip for now
                                </button>
                                <button onClick={() => setStep('quiz')} className="flex-1 py-3 bg-[#00D9FF] text-black rounded-xl font-bold text-lg hover:bg-[#00b8d9] transition-colors">
                                    Take Quiz →
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'quiz' && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between text-base text-white/50">
                                <span>Question {current + 1} of {questions.length}</span>
                                <div className="flex gap-1.5">
                                    {questions.map((_, i) => (
                                        <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < current ? 'bg-green-400' : i === current ? 'bg-[#00D9FF]' : 'bg-white/20'}`} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xl font-semibold text-white leading-relaxed">{questions[current].q}</p>
                            <div className="space-y-2.5">
                                {questions[current].options.map((opt, i) => (
                                    <button key={i} onClick={() => setSelected(i)}
                                        className={`w-full text-left px-4 py-3.5 rounded-xl border text-lg transition-all ${
                                            selected === i
                                                ? 'bg-[#00D9FF]/20 border-[#00D9FF]/60 text-[#00D9FF]'
                                                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                                        }`}>
                                        {String.fromCharCode(65 + i)}. {opt}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleNext} disabled={selected === null}
                                className="w-full py-3 bg-[#00D9FF] text-black rounded-xl font-bold text-lg hover:bg-[#00b8d9] disabled:opacity-40 transition-colors">
                                {current + 1 < questions.length ? 'Next →' : 'See Results'}
                            </button>
                        </div>
                    )}

                    {step === 'result' && (
                        <div className="space-y-5 text-center">
                            <div className="text-5xl">{score >= 4 ? '🏆' : score >= 3 ? '👍' : '📚'}</div>
                            <div>
                                <div className="text-5xl font-bold text-white mb-1">{score}/{questions.length}</div>
                                <p className="text-xl text-white/60">
                                    {score >= 4 ? "Excellent! You've mastered these concepts." : score >= 3 ? 'Good progress! Review a few more concepts.' : 'Keep practicing! Revisit the learning materials.'}
                                </p>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-3">
                                <div className={`h-3 rounded-full transition-all ${score >= 4 ? 'bg-green-400' : score >= 3 ? 'bg-[#00D9FF]' : 'bg-yellow-400'}`}
                                    style={{ width: `${(score / questions.length) * 100}%` }} />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setStep('quiz'); setCurrent(0); setSelected(null); setAnswers([]); }}
                                    className="flex-1 py-3 border border-white/20 text-lg text-white/70 rounded-xl hover:bg-white/10 transition-colors">
                                    Retry Quiz
                                </button>
                                <button onClick={onClose}
                                    className="flex-1 py-3 bg-[#00D9FF] text-black rounded-xl font-bold text-lg hover:bg-[#00b8d9] transition-colors">
                                    Done ✓
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Completion Recommendations ───────────────────────────────────────────────
function CompletionRecommendations({ roadmap }: { roadmap: Roadmap }) {
    const courses = getCourseRecommendations(roadmap.currentRole, roadmap.targetGoal);
    const internships = getInternshipLinks(roadmap.currentRole, roadmap.targetGoal);

    return (
        <div className="space-y-6 mt-6">
            {/* Completion Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-green-500/20 to-[#00D9FF]/20 border border-green-500/30 p-6 text-center space-y-2">
                <div className="text-5xl">🎓</div>
                <h2 className="text-3xl font-bold text-white">Roadmap Complete!</h2>
                <p className="text-xl text-white/70">Congratulations on completing your <span className="text-[#00D9FF] font-semibold">{roadmap.targetGoal}</span> journey!</p>
            </div>

            {/* Paid Courses */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-6 space-y-4">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <GraduationCap className="w-7 h-7 text-purple-400" /> Recommended Paid Courses
                    </h3>
                    <p className="text-lg text-white/50 mt-1">Level up further with these industry-curated courses</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {courses.map((c, i) => (
                        <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                            className="flex flex-col gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/40 rounded-xl p-4 transition-all group">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors leading-tight">{c.title}</p>
                                <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-purple-400 shrink-0 mt-0.5 transition-colors" />
                            </div>
                            <div className="flex items-center justify-between text-base">
                                <span className="text-white/50">{c.platform}</span>
                                <span className="text-green-400 font-semibold">{c.price}</span>
                            </div>
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <Star key={j} className={`w-4 h-4 ${j < c.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                                ))}
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* Internship Links */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-6 space-y-4">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Briefcase className="w-7 h-7 text-[#00D9FF]" /> Internship Opportunities
                    </h3>
                    <p className="text-lg text-white/50 mt-1">Apply to these openings related to your completed roadmap</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {internships.map((intern, i) => (
                        <a key={i} href={intern.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00D9FF]/30 rounded-xl p-4 transition-all group">
                            <div className="p-2 bg-[#00D9FF]/10 rounded-lg shrink-0">
                                <Globe className="w-5 h-5 text-[#00D9FF]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-lg font-semibold text-white group-hover:text-[#00D9FF] transition-colors">{intern.title}</p>
                                <p className="text-base text-white/50">{intern.platform}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-base bg-white/10 text-white/60 px-2.5 py-0.5 rounded-full">{intern.type}</span>
                                <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-[#00D9FF] transition-colors" />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Week Card ────────────────────────────────────────────────────────────────
function WeekCard({ weekNum, skills, resources, isCompleted, onMarkComplete }: {
    weekNum: number;
    skills: string[];
    resources: Roadmap['milestones'][0]['resources'];
    isCompleted: boolean;
    onMarkComplete: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`rounded-xl border transition-all ${isCompleted ? 'bg-green-500/5 border-green-500/20' : 'bg-white/[0.03] border-white/[0.08] hover:border-white/15'}`}>
            <div className="flex items-center gap-3 p-4">
                <button onClick={onMarkComplete}
                    className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-white/25 text-white/30 hover:border-[#00D9FF]/50'
                    }`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </button>
                <div className="flex-1">
                    <span className={`text-lg font-semibold ${isCompleted ? 'text-green-400' : 'text-white/80'}`}>
                        Week {weekNum}
                    </span>
                    {!expanded && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {skills.slice(0, 4).map((s, i) => (
                                <span key={i} className="text-base bg-white/5 text-white/50 px-2.5 py-0.5 rounded">{s}</span>
                            ))}
                            {skills.length > 4 && <span className="text-base text-white/30">+{skills.length - 4} more</span>}
                        </div>
                    )}
                </div>
                <button onClick={() => setExpanded(e => !e)} className="p-1 text-white/30 hover:text-white/60 transition-colors">
                    <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    {skills.length > 0 && (
                        <div>
                            <p className="text-base font-medium text-white/40 uppercase tracking-wide mb-2">Topics this week</p>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((s, i) => (
                                    <span key={i} className="text-base bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] px-3 py-1 rounded-full">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {resources && resources.length > 0 && (
                        <div>
                            <p className="text-base font-medium text-white/40 uppercase tracking-wide mb-2">Resources</p>
                            <div className="space-y-2">
                                {resources.map((r, i) =>
                                    r.url ? (
                                        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-all group cursor-pointer">
                                            {resourceIcon(r.type)}
                                            <span className="flex-1 text-lg text-white/80 group-hover:text-white transition-colors">{r.title}</span>
                                            <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-[#00D9FF] transition-colors" />
                                        </a>
                                    ) : (
                                        <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
                                            {resourceIcon(r.type)}
                                            <span className="flex-1 text-lg text-white/80">{r.title}</span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Skill chip input ─────────────────────────────────────────────────────────
function SkillInput({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
    const [input, setInput] = useState('');
    const add = () => {
        const v = input.trim();
        if (v && !skills.includes(v) && skills.length < 20) {
            onChange([...skills, v]);
            setInput('');
        }
    };
    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder="Type a skill and press Enter…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF]/50"
                />
                <button onClick={add} className="px-4 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-white/70 transition-colors">
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {skills.map(s => (
                        <span key={s} className="flex items-center gap-1.5 bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] text-base px-3 py-1 rounded-full">
                            {s}
                            <button onClick={() => onChange(skills.filter(x => x !== s))} className="hover:text-white transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Milestone card ───────────────────────────────────────────────────────────
function MilestoneCard({
    milestone, index, total, onToggle, isToggling, onWeekComplete
}: {
    milestone: Roadmap['milestones'][0]; index: number; total: number;
    onToggle: () => void; isToggling: boolean;
    onWeekComplete: (skills: string[], title: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const numWeeks = parseDurationToWeeks(milestone.duration);
    const [completedWeeks, setCompletedWeeks] = useState<boolean[]>(() => new Array(numWeeks).fill(false));

    const toggleWeek = (weekIdx: number) => {
        const updated = [...completedWeeks];
        updated[weekIdx] = !updated[weekIdx];
        setCompletedWeeks(updated);
        if (updated[weekIdx]) {
            const weekSkills = getWeekSkills(milestone.skills, weekIdx, numWeeks);
            onWeekComplete(weekSkills, `${milestone.title} – Week ${weekIdx + 1}`);
        }
        // Auto-mark whole milestone done when all weeks checked
        if (updated.every(Boolean) && !milestone.completed) {
            onToggle();
        }
    };

    return (
        <div className={`relative flex gap-5 ${index < total - 1 ? 'pb-6' : ''}`}>
            {/* Vertical line */}
            {index < total - 1 && (
                <div className="absolute left-[22px] top-12 bottom-0 w-0.5 bg-white/10" />
            )}

            {/* Step circle */}
            <div className="shrink-0 flex flex-col items-center">
                <button
                    onClick={onToggle}
                    disabled={isToggling}
                    className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
                        milestone.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-[#0a0a0a] border-white/20 text-white/40 hover:border-[#00D9FF]/60'
                    }`}
                >
                    {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> :
                        milestone.completed ? <CheckCircle className="w-5 h-5" /> :
                            <span className="text-base font-bold">{index + 1}</span>}
                </button>
            </div>

            {/* Card */}
            <div className={`flex-1 rounded-xl border transition-all ${
                milestone.completed
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}>
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="w-full flex items-start justify-between p-5 text-left"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h3 className={`text-xl font-bold ${milestone.completed ? 'text-green-400' : 'text-white'}`}>
                                {milestone.title}
                            </h3>
                            {milestone.completed && (
                                <span className="text-base bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">Completed</span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-base text-white/40 flex-wrap">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{milestone.duration}</span>
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{milestone.weeklyHours}h/week</span>
                            <span className="flex items-center gap-1"><Code className="w-4 h-4" />{milestone.skills.length} skills</span>
                            <span className="flex items-center gap-1 text-[#00D9FF]/70"><Calendar className="w-4 h-4" />{numWeeks} weeks</span>
                        </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-white/30 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>

                {expanded && (
                    <div className="px-5 pb-5 space-y-5 border-t border-white/5 pt-4">
                        {milestone.description && (
                            <p className="text-lg text-white/70 leading-relaxed">{milestone.description}</p>
                        )}

                        {/* Deliverable */}
                        {milestone.deliverable && (
                            <div className="flex gap-3 bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-3">
                                <Award className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-base font-semibold text-purple-400 mb-0.5">Deliverable</p>
                                    <p className="text-lg text-white/80">{milestone.deliverable}</p>
                                </div>
                            </div>
                        )}

                        {/* Week-by-week plan */}
                        <div>
                            <p className="text-base font-semibold text-white/50 uppercase tracking-wider mb-3">
                                Week-by-Week Plan ({numWeeks} weeks)
                            </p>
                            <div className="space-y-2">
                                {Array.from({ length: numWeeks }).map((_, weekIdx) => (
                                    <WeekCard
                                        key={weekIdx}
                                        weekNum={weekIdx + 1}
                                        skills={getWeekSkills(milestone.skills, weekIdx, numWeeks)}
                                        resources={weekIdx === 0 ? milestone.resources : []}
                                        isCompleted={completedWeeks[weekIdx]}
                                        onMarkComplete={() => toggleWeek(weekIdx)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* All resources */}
                        {milestone.resources && milestone.resources.length > 0 && (
                            <div>
                                <p className="text-base font-semibold text-white/50 uppercase tracking-wider mb-3">All Resources</p>
                                <div className="space-y-2">
                                    {milestone.resources.map((r, i) =>
                                        r.url ? (
                                            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-all group cursor-pointer">
                                                {resourceIcon(r.type)}
                                                <span className="flex-1 text-lg text-white/80 group-hover:text-white transition-colors">{r.title}</span>
                                                <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-[#00D9FF] transition-colors" />
                                            </a>
                                        ) : (
                                            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
                                                {resourceIcon(r.type)}
                                                <span className="flex-1 text-lg text-white/80">{r.title}</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Roadmap Detail View ──────────────────────────────────────────────────────
function RoadmapDetail({
    roadmap, onBack, onUpdate, onDelete
}: {
    roadmap: Roadmap; onBack: () => void;
    onUpdate: (r: Roadmap) => void; onDelete: (id: string) => void;
}) {
    const [togglingIndex, setTogglingIndex] = useState<number | null>(null);
    const [quiz, setQuiz] = useState<{ skills: string[]; title: string } | null>(null);
    const completed = roadmap.milestones.filter(m => m.completed).length;
    const total = roadmap.milestones.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isRoadmapComplete = pct === 100 && total > 0;

    const handleToggle = async (index: number) => {
        setTogglingIndex(index);
        try {
            const updated = await roadmapService.toggleMilestone(roadmap._id, index);
            onUpdate(updated);
            toast.success(updated.milestones[index].completed ? '✅ Milestone completed!' : 'Milestone unmarked');
        } catch { toast.error('Failed to update milestone'); }
        finally { setTogglingIndex(null); }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this roadmap?')) return;
        try {
            await roadmapService.delete(roadmap._id);
            toast.success('Roadmap deleted');
            onDelete(roadmap._id);
        } catch { toast.error('Delete failed'); }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Quiz Modal */}
            {quiz && (
                <QuizModal
                    skills={quiz.skills}
                    milestoneTitle={quiz.title}
                    onClose={() => setQuiz(null)}
                />
            )}

            {/* Top bar */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-white truncate">{roadmap.title}</h1>
                    <p className="text-lg text-white/50">{roadmap.currentRole} → {roadmap.targetGoal}</p>
                </div>
                <button onClick={handleDelete} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* ── Progress Bar (top) ── */}
            <div className="rounded-xl bg-white/5 border border-white/10 px-6 py-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-bold text-white">{pct}%</span>
                        <span className="text-lg text-white/40 mb-0.5">{completed}/{total} milestones done</span>
                    </div>
                    <div className="flex items-center gap-6 text-base text-white/40">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{roadmap.timelineMonths}m timeline</span>
                        <span className="flex items-center gap-1.5"><Brain className="w-4 h-4" />{roadmap.totalSkills?.length ?? 0} skills</span>
                        <span className="flex items-center gap-1.5"><Target className="w-4 h-4" />{total} milestones</span>
                    </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                    <div className={`h-3 rounded-full transition-all duration-500 ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                </div>
            </div>

            {/* ── Full-width milestones ── */}
            <div className="space-y-4">
                {roadmap.summary && (
                    <div className="rounded-xl bg-white/5 border border-white/10 px-6 py-5">
                        <p className="text-xl text-white/75 leading-relaxed">{roadmap.summary}</p>
                    </div>
                )}

                <div className="rounded-xl bg-white/5 border border-white/10 p-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Milestones</h2>
                    <div>
                        {roadmap.milestones.map((m, i) => (
                            <MilestoneCard
                                key={i} milestone={m} index={i} total={roadmap.milestones.length}
                                onToggle={() => handleToggle(i)}
                                isToggling={togglingIndex === i}
                                onWeekComplete={(skills, title) => setQuiz({ skills, title })}
                            />
                        ))}
                    </div>
                </div>

                {/* Completion Recommendations shown after 100% */}
                {isRoadmapComplete && <CompletionRecommendations roadmap={roadmap} />}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Phase = 'hub' | 'setup' | 'generating' | 'detail';

export default function RoadmapPage() {
    const [phase, setPhase] = useState<Phase>('hub');
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [currentRole, setCurrentRole] = useState('');
    const [targetGoal, setTargetGoal] = useState('');
    const [timelineMonths, setTimelineMonths] = useState<number>(6);
    const [currentSkills, setCurrentSkills] = useState<string[]>([]);
    const [experienceNotes, setExperienceNotes] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadRoadmaps();
    }, []);

    const loadRoadmaps = async () => {
        setLoading(true);
        try {
            const data = await roadmapService.getAll();
            setRoadmaps(Array.isArray(data) ? data : []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const handleGenerate = async () => {
        if (!currentRole.trim() || !targetGoal.trim()) {
            toast.error('Please fill in current role and target goal');
            return;
        }
        setGenerating(true);
        setPhase('generating');
        try {
            const roadmap = await roadmapService.generate({
                currentRole, targetGoal, timelineMonths, currentSkills, experienceNotes
            });
            setRoadmaps(prev => [roadmap, ...prev]);
            setActiveRoadmap(roadmap);
            setPhase('detail');
            toast.success('Roadmap generated!');
            // Reset form
            setCurrentRole(''); setTargetGoal(''); setCurrentSkills([]); setExperienceNotes('');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to generate roadmap');
            setPhase('setup');
        } finally { setGenerating(false); }
    };

    const handleUpdateRoadmap = (updated: Roadmap) => {
        setRoadmaps(prev => prev.map(r => r._id === updated._id ? updated : r));
        setActiveRoadmap(updated);
    };

    const handleDeleteRoadmap = (id: string) => {
        setRoadmaps(prev => prev.filter(r => r._id !== id));
        setPhase('hub');
        setActiveRoadmap(null);
    };

    const openRoadmap = async (r: Roadmap) => {
        try {
            const fresh = await roadmapService.getOne(r._id);
            setActiveRoadmap(fresh);
        } catch { setActiveRoadmap(r); }
        setPhase('detail');
    };

    return (
        <div className="text-white flex flex-col gap-6 min-h-[calc(100vh-6rem)]">

            {/* ── Top Bar ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {(phase === 'setup' || phase === 'detail') && (
                        <button onClick={() => { setPhase('hub'); setActiveRoadmap(null); }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Map className="w-7 h-7 text-[#00D9FF]" /> Career Roadmap
                        </h1>
                        <p className="text-base text-white/40">AI-powered personalised learning paths</p>
                    </div>
                </div>
                {phase === 'hub' && (
                    <button onClick={() => setPhase('setup')}
                        className="flex items-center gap-2 bg-[#00D9FF] text-black px-5 py-2.5 rounded-xl font-bold text-lg hover:bg-[#00b8d9] transition-colors">
                        <Plus className="w-5 h-5" /> New Roadmap
                    </button>
                )}
            </div>

            {/* ── Hub ── */}
            {phase === 'hub' && (
                <div className="flex flex-col gap-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="w-8 h-8 animate-spin text-[#00D9FF]" />
                        </div>
                    ) : roadmaps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-6">
                            <div className="p-6 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/20">
                                <Map className="w-12 h-12 text-[#00D9FF]" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white mb-2">No roadmaps yet</h2>
                                <p className="text-white/50 text-xl">Generate your first AI career roadmap to get started</p>
                            </div>
                            <button onClick={() => setPhase('setup')}
                                className="flex items-center gap-2 bg-[#00D9FF] text-black px-6 py-3 rounded-xl font-bold text-xl hover:bg-[#00b8d9] transition-colors">
                                <Zap className="w-5 h-5" /> Generate Your Roadmap
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {roadmaps.map(r => {
                                const done = r.milestones.filter(m => m.completed).length;
                                const total = r.milestones.length;
                                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                                return (
                                    <button key={r._id} onClick={() => openRoadmap(r)}
                                        className="text-left rounded-xl bg-white/5 border border-white/10 p-5 hover:border-[#00D9FF]/30 hover:bg-white/10 transition-all group space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="p-2.5 rounded-lg bg-[#00D9FF]/10 border border-[#00D9FF]/20">
                                                <Map className="w-5 h-5 text-[#00D9FF]" />
                                            </div>
                                            <span className={`text-base font-medium px-2.5 py-1 rounded-full ${r.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-[#00D9FF]/10 text-[#00D9FF]'}`}>
                                                {r.status === 'completed' ? 'Completed' : 'Active'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-[#00D9FF] transition-colors mb-1 line-clamp-2">{r.title}</h3>
                                            <p className="text-base text-white/50">{r.currentRole} → {r.targetGoal}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-base text-white/40">
                                                <span>{done}/{total} milestones</span>
                                                <span className="font-semibold text-white/60">{pct}%</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-1.5">
                                                <div className={`h-1.5 rounded-full ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-base text-white/30">
                                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{r.timelineMonths}m</span>
                                            <span className="flex items-center gap-1"><Brain className="w-4 h-4" />{r.totalSkills?.length ?? 0} skills</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Setup Form ── */}
            {phase === 'setup' && (
                <div className="max-w-3xl mx-auto w-full">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 text-[#00D9FF] mb-4">
                                <Zap className="w-6 h-6" />
                                <span className="text-2xl font-bold">Generate AI Roadmap</span>
                            </div>
                            <p className="text-white/50 text-lg">Tell us where you are and where you want to go</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-lg font-semibold text-white/80">Current Role <span className="text-red-400">*</span></label>
                                <input value={currentRole} onChange={e => setCurrentRole(e.target.value)}
                                    placeholder="e.g., Junior Developer, Student, Career Switcher"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF]/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-lg font-semibold text-white/80">Target Goal <span className="text-red-400">*</span></label>
                                <input value={targetGoal} onChange={e => setTargetGoal(e.target.value)}
                                    placeholder="e.g., Senior SWE at FAANG, ML Engineer, CTO"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF]/50" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-lg font-semibold text-white/80">Timeline</label>
                            <div className="grid grid-cols-4 gap-3">
                                {[3, 6, 12, 24].map(m => (
                                    <button key={m} onClick={() => setTimelineMonths(m)}
                                        className={`py-3 rounded-xl text-lg font-semibold border transition-all ${
                                            timelineMonths === m
                                                ? 'bg-[#00D9FF]/20 border-[#00D9FF]/50 text-[#00D9FF]'
                                                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                                        }`}>
                                        {m}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-lg font-semibold text-white/80">Current Skills <span className="text-white/40 font-normal">(optional)</span></label>
                            <SkillInput skills={currentSkills} onChange={setCurrentSkills} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-lg font-semibold text-white/80">Experience Notes <span className="text-white/40 font-normal">(optional)</span></label>
                            <textarea value={experienceNotes} onChange={e => setExperienceNotes(e.target.value)}
                                placeholder="Any other context — background, constraints, specific areas to focus on..."
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF]/50 resize-none" />
                        </div>

                        <button onClick={handleGenerate} disabled={generating || !currentRole.trim() || !targetGoal.trim()}
                            className="w-full flex items-center justify-center gap-3 bg-[#00D9FF] text-black py-4 rounded-xl font-bold text-xl hover:bg-[#00b8d9] disabled:opacity-50 transition-colors">
                            <Zap className="w-6 h-6" />
                            Generate My Roadmap
                        </button>
                    </div>

                    {/* Feature cards */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {[
                            { icon: <Target className="w-6 h-6 text-[#00D9FF]" />, title: 'Personalised', desc: 'Tailored to your exact background and goals' },
                            { icon: <TrendingUp className="w-6 h-6 text-green-400" />, title: 'Step-by-step', desc: 'Concrete milestones with deliverables' },
                            { icon: <Brain className="w-6 h-6 text-purple-400" />, title: 'AI-Powered', desc: 'Industry-current, market-relevant skills' },
                        ].map(card => (
                            <div key={card.title} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center space-y-2">
                                <div className="flex justify-center">{card.icon}</div>
                                <p className="text-lg font-semibold text-white">{card.title}</p>
                                <p className="text-base text-white/50">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Generating ── */}
            {phase === 'generating' && (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-[#00D9FF]/20 border-t-[#00D9FF] animate-spin" />
                        <Brain className="w-8 h-8 text-[#00D9FF] absolute inset-0 m-auto" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-white">Crafting your roadmap…</h2>
                        <p className="text-white/50 text-xl">AI is generating a personalised {timelineMonths}-month plan for you</p>
                    </div>
                    <div className="flex items-center gap-2 text-base text-white/30">
                        <BarChart2 className="w-4 h-4" /> Analysing role requirements, tech stack trends and learning paths
                    </div>
                </div>
            )}

            {/* ── Detail ── */}
            {phase === 'detail' && activeRoadmap && (
                <RoadmapDetail
                    roadmap={activeRoadmap}
                    onBack={() => { setPhase('hub'); setActiveRoadmap(null); }}
                    onUpdate={handleUpdateRoadmap}
                    onDelete={handleDeleteRoadmap}
                />
            )}
        </div>
    );
}
