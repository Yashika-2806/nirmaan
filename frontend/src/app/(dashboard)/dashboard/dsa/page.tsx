'use client';

import { useState, useEffect } from 'react';
import {
    Code,
    Play,
    Pause,
    RotateCcw,
    ChevronDown,
    Search,
    Filter,
    CheckCircle,
    Circle,
    Zap,
    Plus,
    BarChart2,
    Target,
    ArrowRight,
    Loader2,
    SkipForward,
    MessageSquarePlus,
    Trash2,
    Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { getQuestions } from '@/data/dsa_sheets';

// Initial Mock Data (kept for type inference or fallback)
const INITIAL_QUESTIONS = getQuestions('blind-75');


// Simple Markdown Renderer for AI Feedback
const MarkdownRenderer = ({ content }: { content: string }) => {
    if (!content) return null;

    // Split by double newlines for paragraphs
    const paragraphs = content.split(/\n\n+/);

    return (
        <div className="space-y-4">
            {paragraphs.map((paragraph, i) => {
                // Handle headings (lines starting with # or **Heading**)
                // But specifically for 'Validation:', 'Analysis:' etc which user wants as headings
                // My backend prompt uses **Heading:** style.

                const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                return (
                    <p key={i} className="text-gray-300 leading-relaxed text-sm md:text-base">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className="text-[#00D9FF] font-bold">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                        })}
                    </p>
                );
            })}
        </div>
    );
};

// Improved Markdown Renderer V2 (List Support + Larger Font)
const MarkdownRendererImproved = ({ content }: { content: string }) => {
    if (!content) return null;

    // Split by single newline
    const lines = content.split('\n');

    return (
        <div className="space-y-1 text-base md:text-lg">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                // Treat empty lines as spacers (but smaller height)
                if (!trimmed) return <div key={i} className="h-3"></div>;

                // Check for list items
                const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
                const isOrdered = /^\d+\.\s/.test(trimmed);

                // Indentation
                const indentClass = (isBullet || isOrdered) ? 'pl-6 relative' : '';

                // Handle bolding
                const parts = line.split(/(\*\*.*?\*\*)/g);

                return (
                    <div key={i} className={`${indentClass} text-gray-300 leading-relaxed mb-1`}>
                        {isBullet && <span className="absolute left-1 top-2.5 w-1.5 h-1.5 bg-[#00D9FF] rounded-full"></span>}
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                // If it's a heading like "Validation:", give it block display or highlight
                                const text = part.slice(2, -2);
                                // Check if it's likely a heading (ends with :)
                                const isHeading = text.trim().endsWith(':');
                                return <strong key={j} className={`text-[#00D9FF] font-bold ${isHeading ? 'block mt-4 mb-2 text-xl border-b border-[#00D9FF]/20 pb-1 w-fit' : ''}`}>{text}</strong>;
                            }
                            return part;
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default function DSAPage() {
    const [questions, setQuestions] = useState(INITIAL_QUESTIONS);

    const [sheets, setSheets] = useState([
        { id: 'blind-75', name: 'Blind 75 Must-Do Questions', total: 75, solved: 0, desc: 'Top 75 LeetCode questions for interview prep' },
        { id: 'neetcode-150', name: 'NeetCode 150', total: 150, solved: 0, desc: 'Comprehensive roadmap for all patterns' },
        { id: 'grind-75', name: "Grind 75", total: 75, solved: 0, desc: 'Modern version of Blind 75' },
        { id: 'love-babbar', name: "Love Babbar 450", total: 450, solved: 0, desc: 'Complete placement preparation' },
    ]);

    const [activeSheet, setActiveSheet] = useState(sheets[0]);
    const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

    // Load questions when sheet changes
    useEffect(() => {
        if (!activeSheet.id.startsWith('custom-')) {
            const newQuestions = getQuestions(activeSheet.id);
            if (newQuestions.length > 0) {
                setQuestions(newQuestions);
            } else {
                // If it returns empty (e.g. undefined sheet), maybe keep previous or clear
                // setQuestions([]); 
                // But keep it safe.
            }
        }
    }, [activeSheet]);

    // Create Sheet Form State
    const [newSheetName, setNewSheetName] = useState('');
    const [newSheetQuestions, setNewSheetQuestions] = useState([{ title: '', url: '' }]);

    const [difficulty, setDifficulty] = useState('All');
    const [topic, setTopic] = useState('All');
    const [search, setSearch] = useState('');

    // Add a new empty question row to the modal form
    const addQuestionRow = () => {
        setNewSheetQuestions([...newSheetQuestions, { title: '', url: '' }]);
    };

    // Remove a question row
    const removeQuestionRow = (index: number) => {
        const updated = [...newSheetQuestions];
        updated.splice(index, 1);
        setNewSheetQuestions(updated);
    };

    // Handle input change for questions in modal
    const handleQuestionChange = (index: number, field: 'title' | 'url', value: string) => {
        const updated = [...newSheetQuestions];
        updated[index][field] = value;
        setNewSheetQuestions(updated);
    };

    const handleCreateSheet = () => {
        if (!newSheetName.trim()) return;

        const sheetId = `custom-${Date.now()}`;

        // Filter out empty questions
        const validQuestions = newSheetQuestions.filter(q => q.title.trim() !== '');

        const newSheet = {
            id: sheetId,
            name: newSheetName,
            total: validQuestions.length,
            solved: 0,
            desc: 'Custom Question Sheet'
        };

        // Create question objects
        const newQuestionsToAdd = validQuestions.map((q, i) => ({
            id: `${sheetId}-${i}`,
            title: q.title,
            difficulty: 'Medium', // Default for custom
            topic: 'Custom',
            status: 'pending',
            sheet: sheetId,
            leetcodeUrl: q.url || '#'
        }));

        setSheets([...sheets, newSheet]);
        setQuestions([...questions, ...newQuestionsToAdd]);
        setActiveSheet(newSheet);

        // Reset Form
        setNewSheetName('');
        setNewSheetQuestions([{ title: '', url: '' }]);
        setIsCreateSheetOpen(false);
    };

    // Visualizer State
    const [code, setCode] = useState(`// Selection Sort
function selectionSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    swap(arr, i, minIdx);
  }
}`);
    const [bars, setBars] = useState([40, 70, 20, 90, 30, 60, 10, 50]);
    const [isVisualizing, setIsVisualizing] = useState(false);

    // Mock visualization
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isVisualizing) {
            interval = setInterval(() => {
                setBars(prev => {
                    const newBars = [...prev];
                    const i = Math.floor(Math.random() * 8);
                    const j = Math.floor(Math.random() * 8);
                    const temp = newBars[i];
                    newBars[i] = newBars[j];
                    newBars[j] = temp;
                    return newBars;
                });
            }, 500);
        }
        return () => clearInterval(interval);
    }, [isVisualizing]);

    // AI Review State
    const [reviewQuestion, setReviewQuestion] = useState<any>(null);
    const [reviewStep, setReviewStep] = useState(0);
    const [reviewInput, setReviewInput] = useState('');
    const [aiFeedback, setAiFeedback] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const AI_QUESTIONS = [
        "What was your initial approach to solving this problem?",
        "What is the time and space complexity of your solution?",
        "Did you consider any edge cases? If so, which ones?",
        "How would your solution handle a significantly larger dataset?",
        "Could you have optimized the space complexity further?"
    ];

    const handleMarkComplete = (question: any) => {
        setReviewQuestion(question);
        setReviewStep(0);
        setAiFeedback('');
        setReviewInput('');
    };

    const handleSkip = () => {
        setQuestions(prev => prev.map(q =>
            q.id === reviewQuestion.id ? { ...q, status: 'solved' } : q
        ));
        setReviewQuestion(null);
    };

    const handleReviewSubmit = async () => {
        if (aiFeedback) {
            if (reviewStep < AI_QUESTIONS.length - 1) {
                setReviewStep(prev => prev + 1);
                setReviewInput('');
                setAiFeedback('');
            } else {
                setQuestions(prev => prev.map(q =>
                    q.id === reviewQuestion.id ? { ...q, status: 'solved' } : q
                ));
                setReviewQuestion(null);
                alert(`Great job! "${reviewQuestion.title}" is now marked as completed.`);
            }
            return;
        }

        if (!reviewInput.trim()) return;

        setIsAiLoading(true);

        try {
            const res = await api.post('/ai/review', {
                questionTitle: reviewQuestion.title,
                userAnswer: reviewInput,
                currentQuestion: AI_QUESTIONS[reviewStep]
            });

            setAiFeedback(res.data.feedback);

        } catch (error) {
            console.error("AI Error:", error);
            setAiFeedback("Failed to get AI feedback. Please ensure the backend server is running and key is configured.");
        } finally {
            setIsAiLoading(false);
        }
    };

    // Filter Logic
    const filteredQuestions = questions.filter(q =>
        q.sheet === activeSheet.id &&
        (difficulty === 'All' || q.difficulty === difficulty) &&
        (topic === 'All' || q.topic === topic) &&
        (q.title.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-100px)] relative">

            {/* Create Sheet Modal */}
            {isCreateSheetOpen && (
                <div className="absolute inset-0 z-[60] bg-[#0a0a0a]/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111111] border border-gray-800 rounded-xl w-full max-w-2xl p-6 animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-white">Create Custom Sheet</h2>
                                <p className="text-sm text-gray-400">Curate your own list of problems.</p>
                            </div>
                            <button onClick={() => setIsCreateSheetOpen(false)} className="text-gray-500 hover:text-white">✕</button>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2 space-y-6">
                            {/* Sheet Name */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sheet Name</label>
                                <input
                                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#00D9FF] outline-none"
                                    placeholder="e.g., My Weak Topics, Google Prep"
                                    value={newSheetName}
                                    onChange={(e) => setNewSheetName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Questions List */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Questions</label>
                                    <span className="text-xs text-gray-600">{newSheetQuestions.length} Questions</span>
                                </div>
                                <div className="space-y-3">
                                    {newSheetQuestions.map((q, index) => (
                                        <div key={index} className="flex gap-3 items-start group">
                                            <span className="text-gray-600 text-sm mt-3 w-4 text-center">{index + 1}.</span>
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-[#00D9FF] outline-none placeholder:text-gray-600"
                                                    placeholder="Question Name (Required)"
                                                    value={q.title}
                                                    onChange={(e) => handleQuestionChange(index, 'title', e.target.value)}
                                                />
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 top-2.5 w-3 h-3 text-gray-600" />
                                                    <input
                                                        className="w-full bg-[#1a1a1a] border border-gray-800 rounded px-3 py-2 pl-8 text-xs text-gray-300 focus:border-[#00D9FF] outline-none placeholder:text-gray-600"
                                                        placeholder="Problem Link (Optional)"
                                                        value={q.url}
                                                        onChange={(e) => handleQuestionChange(index, 'url', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            {newSheetQuestions.length > 1 && (
                                                <button
                                                    onClick={() => removeQuestionRow(index)}
                                                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addQuestionRow}
                                    className="mt-4 w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-400 text-sm hover:border-[#00D9FF] hover:text-[#00D9FF] transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Another Question
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 shrink-0 pt-4 border-t border-gray-800">
                            <button
                                onClick={() => setIsCreateSheetOpen(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateSheet}
                                disabled={!newSheetName.trim() || newSheetQuestions.every(q => !q.title.trim())}
                                className="px-6 py-2 bg-[#00D9FF] text-black font-bold rounded-lg hover:bg-[#00D9FF]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create Sheet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Review Modal */}
            {reviewQuestion && (
                <div className="absolute inset-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#111111] border border-[#00D9FF]/30 rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col shadow-[0_0_80px_-20px_#00D9FF] animate-in fade-in zoom-in duration-300">
                        {/* ... Modal Header ... */}
                        <div className="p-6 border-b border-gray-800 bg-[#151515] flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#00D9FF]/10 rounded-full border border-[#00D9FF]/20">
                                    <Zap className="w-6 h-6 text-[#00D9FF]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">AI Post-Solution Review</h2>
                                    <p className="text-base text-gray-400">Reviewing: <span className="text-[#00D9FF] font-semibold">{reviewQuestion.title}</span></p>
                                </div>
                            </div>
                            <button onClick={() => setReviewQuestion(null)} className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">✕</button>
                        </div>

                        <div className="p-8 space-y-8 overflow-y-auto flex-1">
                            {/* Progress */}
                            <div className="flex items-center gap-2 mb-6">
                                {AI_QUESTIONS.map((_, i) => (
                                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= reviewStep ? 'bg-[#00D9FF] shadow-[0_0_10px_#00D9FF]' : 'bg-gray-800'}`}></div>
                                ))}
                            </div>

                            {/* Question & Feedback */}
                            <div className="space-y-6">
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-full bg-[#00D9FF]/10 flex-shrink-0 flex items-center justify-center border border-[#00D9FF]/20 mt-1">
                                        <Zap className="w-6 h-6 text-[#00D9FF]" />
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <p className="text-2xl text-white font-medium leading-relaxed">{AI_QUESTIONS[reviewStep]}</p>

                                    </div>
                                </div>

                                {/* User Input */}
                                <div className="ml-16">
                                    <textarea
                                        value={reviewInput}
                                        onChange={(e) => setReviewInput(e.target.value)}
                                        placeholder="Type your detailed answer here..."
                                        disabled={isAiLoading || !!aiFeedback}
                                        className="w-full h-64 bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 text-lg text-gray-200 resize-none focus:border-[#00D9FF] outline-none transition-all disabled:opacity-50 placeholder:text-gray-600 focus:shadow-[0_0_30px_-5px_rgba(0,217,255,0.1)]"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleReviewSubmit();
                                            }
                                        }}
                                    />
                                    {aiFeedback && (
                                        <div className="mt-6 p-6 bg-green-500/10 border border-green-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 shadow-inner">
                                            <h4 className="font-bold flex items-center gap-2 mb-4 text-green-300 border-b border-green-500/20 pb-2"><Zap className="w-5 h-5" /> AI Analysis</h4>
                                            <MarkdownRendererImproved content={aiFeedback} />
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-gray-500">Analysis powered by <strong>Google Gemini</strong></span>
                                        </div>

                                        <div className="flex gap-3">
                                            {/* Skip Button */}
                                            <button
                                                onClick={handleSkip}
                                                className="px-6 py-3 border border-gray-700 text-gray-300 font-bold text-lg rounded-xl hover:bg-white/5 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                Skip & Mark Complete <SkipForward className="w-5 h-5" />
                                            </button>

                                            {/* Main Action Button */}
                                            <button
                                                onClick={handleReviewSubmit}
                                                disabled={isAiLoading || (!reviewInput.trim() && !aiFeedback)}
                                                className="px-8 py-3 bg-[#00D9FF] text-black font-bold text-lg rounded-xl hover:bg-[#00D9FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 shadow-[0_0_20px_-5px_#00D9FF]"
                                            >
                                                {isAiLoading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" /> Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        {aiFeedback ? (
                                                            <>Next Question <ArrowRight className="w-5 h-5" /></>
                                                        ) : (
                                                            <>Get AI Feedback <MessageSquarePlus className="w-5 h-5" /></>
                                                        )}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LEFT PANEL: Algo Visualizer */}
            <div className="w-full xl:w-2/5 flex flex-col gap-4">
                <div className="bg-[#111111] border border-gray-800 rounded-xl p-1 flex items-center justify-between">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="p-2 bg-[#00D9FF]/10 rounded-lg">
                            <Zap className="w-5 h-5 text-[#00D9FF]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-white">Algo Visualizer</h2>
                            <p className="text-xs text-gray-400">Step-by-step execution</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-[#111111] border border-gray-800 rounded-xl p-4 flex flex-col gap-4 overflow-hidden relative group hover:border-[#00D9FF]/30 transition-all">
                    {/* ... Visualizer Content ... */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-[#00D9FF] text-sm font-bold">
                            <Code className="w-4 h-4" /> Code
                        </div>
                        <select className="bg-[#1a1a1a] border border-gray-700 text-xs rounded px-2 py-1 text-gray-300 outline-none">
                            <option>Selection Sort</option>
                            <option>Bubble Sort</option>
                            <option>Insertion Sort</option>
                        </select>
                    </div>

                    <div className="bg-[#0a0a0a] rounded-lg p-3 font-mono text-xs text-gray-400 border border-gray-800 h-48 overflow-auto">
                        <pre>{code}</pre>
                    </div>

                    <button
                        onClick={() => setIsVisualizing(!isVisualizing)}
                        className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${isVisualizing ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-[#00D9FF] text-black hover:bg-[#00D9FF]/90'
                            }`}
                    >
                        {isVisualizing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isVisualizing ? 'Stop Visualization' : 'Visualize'}
                    </button>

                    <div className="flex-1 bg-[#0a0a0a] rounded-lg border border-gray-800 p-4 flex flex-col relative overflow-hidden">
                        <div className="text-xs text-gray-500 mb-4 font-bold">Array Visualization</div>
                        <div className="flex-1 flex items-end justify-center gap-2 px-4 pb-4">
                            {bars.map((h, i) => (
                                <div
                                    key={i}
                                    style={{ height: `${h}%` }}
                                    className="flex-1 bg-gradient-to-t from-[#00D9FF] to-cyan-300 rounded-t-sm transition-all duration-300 shadow-[0_0_10px_-2px_#00D9FF]"
                                ></div>
                            ))}
                        </div>

                        <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-800">
                            <button className="p-1 hover:text-white text-gray-500"><RotateCcw className="w-4 h-4" /></button>
                            <div className="w-32 bg-gray-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-[#00D9FF] w-1/3 h-full"></div>
                            </div>
                            <span className="text-xs text-gray-500">Speed 1x</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Sheets & Questions */}
            <div className="w-full xl:w-3/5 flex flex-col gap-4">
                {/* Filters */}
                <div className="bg-[#111111] border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 font-bold mb-1 block uppercase">DSA Sheet</label>
                        <div className="relative">
                            <select
                                className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-sm rounded-lg px-3 py-2 appearance-none focus:border-[#00D9FF] outline-none cursor-pointer"
                                value={activeSheet.id}
                                onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                        setIsCreateSheetOpen(true);
                                        return;
                                    }
                                    const sheet = sheets.find(s => s.id === e.target.value);
                                    if (sheet) setActiveSheet(sheet);
                                }}
                            >
                                {sheets.map(sheet => (
                                    <option key={sheet.id} value={sheet.id}>{sheet.name} ({sheet.total})</option>
                                ))}
                                <option disabled>──────────</option>
                                <option value="custom" className="text-[#00D9FF] font-bold">+ Create Custom Sheet</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="w-32">
                        <label className="text-xs text-gray-500 font-bold mb-1 block uppercase">Difficulty</label>
                        <div className="relative">
                            <select
                                className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-sm rounded-lg px-3 py-2 appearance-none outline-none"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                <option value="All">All Levels</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="w-32">
                        <label className="text-xs text-gray-500 font-bold mb-1 block uppercase">Topic</label>
                        <div className="relative">
                            <select
                                className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-sm rounded-lg px-3 py-2 appearance-none outline-none"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            >
                                <option value="All">All Topics</option>
                                <option value="Array">Array</option>
                                <option value="DP">Dynamic Prog.</option>
                                <option value="Graph">Graph</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Selected Sheet Info Card */}
                <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D9FF]/5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                    <div className="relative z-10">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-[#0a0a0a] rounded-xl border border-gray-800">
                                <Code className="w-8 h-8 text-[#00D9FF]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{activeSheet.name}</h2>
                                <p className="text-gray-400 text-sm">{activeSheet.desc}</p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-2 flex justify-between text-sm">
                            <span className="text-gray-400">Progress: {filteredQuestions.filter(q => q.status === 'solved').length} / {filteredQuestions.length}</span>
                            <span className="text-[#00D9FF] font-bold">
                                {filteredQuestions.length > 0
                                    ? Math.round((filteredQuestions.filter(q => q.status === 'solved').length / filteredQuestions.length) * 100)
                                    : 0
                                }%
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-6">
                            <div
                                className="h-full bg-[#00D9FF] transition-all duration-500"
                                style={{ width: `${filteredQuestions.length > 0 ? (filteredQuestions.filter(q => q.status === 'solved').length / filteredQuestions.length) * 100 : 0}%` }}
                            ></div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            <StatBox label="Easy" value={filteredQuestions.filter(q => q.difficulty === 'Easy').length.toString()} />
                            <StatBox label="Medium" value={filteredQuestions.filter(q => q.difficulty === 'Medium').length.toString()} />
                            <StatBox label="Hard" value={filteredQuestions.filter(q => q.difficulty === 'Hard').length.toString()} />
                            <StatBox label="Solved" value={filteredQuestions.filter(q => q.status === 'solved').length.toString()} />
                        </div>
                    </div>
                </div>

                {/* Search & List */}
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                            placeholder="Search problems by title or topic..."
                            className="w-full bg-[#111111] border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-[#00D9FF] outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 bg-[#111111] border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {filteredQuestions.map((q, i) => (
                                <a
                                    key={q.id}
                                    href={q.leetcodeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 hover:bg-[#1a1a1a] rounded-lg group transition-colors border border-transparent hover:border-gray-800 cursor-pointer text-decoration-none"
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleMarkComplete(q);
                                            }}
                                            className="focus:outline-none z-10 relative p-1 rounded-full hover:bg-gray-800 transition-colors"
                                            title={q.status === 'solved' ? "Completed" : "Mark as completed"}
                                        >
                                            {q.status === 'solved' ? (
                                                <CheckCircle className="w-5 h-5 text-[#00D9FF] hover:text-[#00D9FF]/80 transition-colors" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-gray-600 hover:text-[#00D9FF] transition-colors" />
                                            )}
                                        </button>
                                        <div>
                                            <h3 className={`text-sm font-medium transition-colors flex items-center gap-2 ${q.status === 'solved' ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>
                                                {i + 1}. {q.title}
                                                {q.leetcodeUrl !== '#' && <Target className="w-3 h-3 text-gray-600 group-hover:text-[#00D9FF] transition-colors" />}
                                                {q.sheet.startsWith('custom-') && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 rounded">Custom</span>}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-gray-500">{q.topic}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <span className={`text-xs px-2 py-0.5 rounded border ${q.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        q.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                            'bg-red-500/10 text-red-500 border-red-500/20'
                                        }`}>
                                        {q.difficulty}
                                    </span>
                                </a>
                            ))}
                            {filteredQuestions.length === 0 && (
                                <div className="text-center py-10 text-gray-500">
                                    <p>No questions found for this sheet/filter.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value }: { label: string, value: string }) {
    return (
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3">
            <div className="text-xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-gray-500 uppercase font-bold">{label}</div>
        </div>
    );
}
