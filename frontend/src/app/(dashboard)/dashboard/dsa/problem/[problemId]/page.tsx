'use client';

import { useState } from 'react';
import {
    MessageSquare,
    Send,
    Code,
    Play,
    CheckCircle,
    HelpCircle,
    Cpu,
    Zap,
    ArrowLeft,
    Clock
} from 'lucide-react';
import Link from 'next/link';
import { aiService } from '@/services/aiService';

// Mock Problem Data
const PROBLEM = {
    id: '1',
    title: "Two Sum",
    difficulty: "Easy",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
        { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
    ]
};

export default function ProblemPage() {
    const [messages, setMessages] = useState([
        { role: 'ai', content: "Hello! I'm your AI Interviewer. Let's tackle the 'Two Sum' problem together. First, could you explain your approach? How would you solve this efficiently?" }
    ]);
    const [input, setInput] = useState('');
    const [phase, setPhase] = useState('approach'); // approach, constraints, coding
    const [code, setCode] = useState(`function twoSum(nums, target) {
    // Write your solution here
    
}`);


    const [isAiThinking, setIsAiThinking] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        // Add user message
        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setIsAiThinking(true);

        try {
            // contextualize the input based on phase
            let validationContext = "";
            let context = PROBLEM.description;

            // If in coding phase, maybe include the current code in the context
            if (phase === 'coding') {
                context += `\n\nCurrent User Code:\n${code}`;
            }

            const response = await aiService.generateFeedback(
                PROBLEM.title,
                input, // User entry
                context
            );

            if (response.success) {
                setMessages(prev => [...prev, { role: 'ai', content: response.feedback }]);

                // Simple state progression logic based on AI response keywords (optional enhancement)
                // For now, we keep manual or keyword-based progression if needed, 
                // but relying on AI's natural response is better.
                if (phase === 'approach' && (response.feedback.toLowerCase().includes('optimal') || response.feedback.toLowerCase().includes('hash map'))) {
                    setPhase('constraints');
                } else if (phase === 'constraints' && response.feedback.toLowerCase().includes('code')) {
                    setPhase('coding');
                }
            }
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: "I'm having trouble connecting to my brain right now. Please try again in a moment."
            }]);
        } finally {
            setIsAiThinking(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/dsa/sheets/neetcode-150" className="p-2 hover:bg-gray-800 rounded-full text-gray-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            {PROBLEM.title}
                            <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">{PROBLEM.difficulty}</span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Time: 00:00
                    </span>
                    <button className="btn-primary flex items-center gap-2 px-4 py-2 bg-[#00D9FF] text-black rounded-lg font-bold hover:bg-[#00D9FF]/90">
                        <CheckCircle className="w-4 h-4" /> Submit
                    </button>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Left Panel: Problem & Chat */}
                <div className="w-2/5 flex flex-col gap-4">
                    {/* Problem Description */}
                    <div className="bg-[#111111] border border-gray-800 rounded-xl p-4 overflow-y-auto max-h-[40%]">
                        <h2 className="font-bold text-white mb-2">Description</h2>
                        <p className="text-gray-400 text-sm mb-4">{PROBLEM.description}</p>
                        <div className="space-y-2">
                            {PROBLEM.examples.map((ex, i) => (
                                <div key={i} className="bg-[#0a0a0a] p-2 rounded border border-gray-800 text-xs font-mono">
                                    <div className="text-gray-500">Input: <span className="text-white">{ex.input}</span></div>
                                    <div className="text-gray-500">Output: <span className="text-[#00D9FF]">{ex.output}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Chat Interface */}
                    <div className="flex-1 bg-[#111111] border border-gray-800 rounded-xl flex flex-col overflow-hidden relative">
                        {/* Chat Header */}
                        <div className="p-3 border-b border-gray-800 bg-[#151515] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[#00D9FF]" />
                                <span className="font-semibold text-white text-sm">AI Interviewer</span>
                            </div>
                            <span className="text-xs text-gray-500">{phase.toUpperCase()} PHASE</span>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'ai' && (
                                        <div className="w-8 h-8 rounded-full bg-[#00D9FF]/10 flex items-center justify-center flex-shrink-0 border border-[#00D9FF]/20">
                                            <Cpu className="w-4 h-4 text-[#00D9FF]" />
                                        </div>
                                    )}
                                    <div className={`p-3 rounded-lg text-sm max-w-[80%] ${msg.role === 'user'
                                        ? 'bg-[#00D9FF] text-black font-medium rounded-br-none'
                                        : 'bg-[#1a1a1a] text-gray-300 border border-gray-800 rounded-bl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-[#151515] border-t border-gray-800 flex gap-2">
                            <input
                                className="flex-1 bg-[#0a0a0a] text-white text-sm rounded-lg px-3 py-2 border border-gray-800 focus:outline-none focus:border-[#00D9FF]"
                                placeholder="Explain your approach..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button
                                onClick={handleSend}
                                className="p-2 bg-[#00D9FF] rounded-lg text-black hover:bg-[#00D9FF]/90 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Code Editor */}
                <div className="w-3/5 bg-[#111111] border border-gray-800 rounded-xl flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-[#151515]">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Code className="w-4 h-4" />
                            <span>JavaScript</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/dashboard/dsa/visualizer" className="flex items-center gap-1 px-3 py-1.5 bg-[#0a0a0a] border border-gray-700 rounded text-xs text-[#00D9FF] hover:border-[#00D9FF] transition-colors">
                                <Play className="w-3 h-3" /> Visualize Logic
                            </Link>
                            <button className="flex items-center gap-1 px-3 py-1.5 bg-[#0a0a0a] border border-gray-700 rounded text-xs text-gray-300 hover:text-white transition-colors">
                                <HelpCircle className="w-3 h-3" /> Get Hint
                            </button>
                        </div>
                    </div>
                    <textarea
                        className="flex-1 bg-[#0a0a0a] text-gray-300 font-mono p-4 text-sm outline-none resize-none"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck="false"
                    />
                </div>
            </div>
        </div>
    );
}
