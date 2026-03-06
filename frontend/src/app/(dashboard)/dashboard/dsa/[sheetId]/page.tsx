'use client';

import { useParams } from 'next/navigation';
import {
    CheckCircle,
    Circle,
    ChevronRight,
    Clock,
    Target,
    Zap
} from 'lucide-react';
import Link from 'next/link';

// Mock Data for Sheets
const SHEETS_DATA = {
    'neetcode-150': {
        title: "NeetCode 150",
        description: "A roadmap to tackle 150 LeetCode patterns.",
        questions: [
            { id: 'nc-1', title: "Contains Duplicate", difficulty: "Easy", status: "solved", topic: "Arrays & Hashing" },
            { id: 'nc-2', title: "Valid Anagram", difficulty: "Easy", status: "pending", topic: "Arrays & Hashing" },
            { id: 'nc-3', title: "Two Sum", difficulty: "Easy", status: "pending", topic: "Arrays & Hashing" },
            { id: 'nc-4', title: "Group Anagrams", difficulty: "Medium", status: "pending", topic: "Arrays & Hashing" },
            { id: 'nc-5', title: "Top K Frequent Elements", difficulty: "Medium", status: "pending", topic: "Arrays & Hashing" },
        ]
    },
    'blind-75': {
        title: "Blind 75",
        description: "The most essential 75 questions.",
        questions: [
            { id: 'b75-1', title: "Two Sum", difficulty: "Easy", status: "pending", topic: "Array" },
            { id: 'b75-2', title: "Best Time to Buy and Sell Stock", difficulty: "Easy", status: "pending", topic: "Array" },
            { id: 'b75-3', title: "Contains Duplicate", difficulty: "Easy", status: "solved", topic: "Array" },
        ]
    }
};

export default function SheetPage() {
    const params = useParams();
    const sheetId = params.sheetId as string;
    // @ts-ignore
    const sheet = SHEETS_DATA[sheetId] || SHEETS_DATA['neetcode-150']; // Fallback

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-[#00D9FF]">
                    <Link href="/dashboard/dsa" className="hover:underline">DSA</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span>{sheet.title}</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">{sheet.title}</h1>
                <p className="text-gray-400">{sheet.description}</p>
            </div>

            {/* Questions List */}
            <div className="bg-[#111111] border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#151515]">
                    <h2 className="font-semibold text-white">Questions</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{sheet.questions.filter((q: any) => q.status === 'solved').length} / {sheet.questions.length} Solved</span>
                    </div>
                </div>

                <div className="divide-y divide-gray-800">
                    {sheet.questions.map((q: any) => (
                        <Link
                            key={q.id}
                            href={`/dashboard/dsa/problem/${q.id}`}
                            className="flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                {q.status === 'solved' ? (
                                    <CheckCircle className="w-5 h-5 text-[#00D9FF]" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                                )}
                                <div>
                                    <h3 className="text-white font-medium group-hover:text-[#00D9FF] transition-colors">{q.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded border ${q.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                q.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {q.difficulty}
                                        </span>
                                        <span className="text-xs text-gray-500">{q.topic}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-[#00D9FF] flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> AI Interview
                                </span>
                                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
