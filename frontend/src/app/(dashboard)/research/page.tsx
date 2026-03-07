'use client';

import { useState } from 'react';
import {
    BookOpen, Search, FileText, Quote, Sparkles, Loader2,
    FlaskConical, GraduationCap, Copy, CheckCheck, ChevronDown, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

type ResearchType = 'literature-review' | 'methodology' | 'citations';

const RESEARCH_TYPES: { value: ResearchType; label: string; icon: React.ReactNode; description: string }[] = [
    {
        value: 'literature-review',
        label: 'Literature Review',
        icon: <BookOpen className="w-5 h-5" />,
        description: 'Comprehensive overview of existing research, key themes, and gaps',
    },
    {
        value: 'methodology',
        label: 'Research Methodology',
        icon: <FlaskConical className="w-5 h-5" />,
        description: 'Research design, data collection methods, and step-by-step plan',
    },
    {
        value: 'citations',
        label: 'Generate Citations',
        icon: <Quote className="w-5 h-5" />,
        description: 'APA-formatted references and BibTeX for academic writing',
    },
];

function MarkdownContent({ text }: { text: string }) {
    // Simple markdown renderer for headings, bold, bullets
    const lines = text.split('\n');
    return (
        <div className="space-y-1.5">
            {lines.map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-5 mb-2 first:mt-0">{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-[#00D9FF] mt-4 mb-1">{line.slice(4)}</h3>;
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-base font-semibold text-white/90">{line.slice(2, -2)}</p>;
                if (line.startsWith('- ') || line.startsWith('* ')) return (
                    <div key={i} className="flex gap-2 text-base text-white/75">
                        <span className="text-[#00D9FF] shrink-0 mt-0.5">•</span>
                        <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                    </div>
                );
                if (/^\d+\.\s/.test(line)) return (
                    <div key={i} className="flex gap-2 text-base text-white/75">
                        <span className="text-[#00D9FF] shrink-0 font-mono text-sm mt-0.5">{line.match(/^\d+/)?.[0]}.</span>
                        <span dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                    </div>
                );
                if (line.trim() === '') return <div key={i} className="h-1" />;
                return (
                    <p key={i} className="text-base text-white/75 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                );
            })}
        </div>
    );
}

export default function ResearchPage() {
    const [topic, setTopic] = useState('');
    const [researchType, setResearchType] = useState<ResearchType>('literature-review');
    const [content, setContent] = useState('');
    const [citations, setCitations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [history, setHistory] = useState<{ topic: string; type: ResearchType; timestamp: Date }[]>([]);

    const handleResearch = async () => {
        if (!topic.trim()) {
            toast.error('Please enter a research topic');
            return;
        }

        setIsLoading(true);
        setContent('');
        setCitations([]);
        try {
            const response = await api.post(`/research/${researchType}`, { topic });
            setContent(response.data.data.content);
            if (response.data.data.citations?.length) {
                setCitations(response.data.data.citations);
            }
            setHistory(prev => [{ topic: topic.trim(), type: researchType, timestamp: new Date() }, ...prev.slice(0, 9)]);
            toast.success('Research completed!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to conduct research');
        } finally {
            setIsLoading(false);
        }
    };

    const copyContent = () => {
        const full = content + (citations.length ? '\n\nCITATIONS:\n' + citations.map((c, i) => `[${i + 1}] ${c}`).join('\n') : '');
        navigator.clipboard.writeText(full);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied to clipboard');
    };

    const selectedType = RESEARCH_TYPES.find(t => t.value === researchType)!;

    return (
        <div className="min-h-screen space-y-6 text-base">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-[#00D9FF]" />
                        Research Assistant
                    </h1>
                    <p className="text-white/50 mt-1 text-lg">AI-powered literature reviews, methodology guides &amp; citations</p>
                </div>
                <div className="flex gap-3 text-base text-white/40">
                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
                        <FileText className="w-4 h-4" /> {history.length} researched
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
                        <Quote className="w-4 h-4" /> {citations.length} citations
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left panel ── */}
                <div className="space-y-5">
                    {/* Query input */}
                    <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
                        <h2 className="text-xl font-semibold text-white">Research Query</h2>

                        <div>
                            <label className="block text-base font-medium text-white/60 mb-2">Topic or Question</label>
                            <textarea
                                className="w-full min-h-[130px] bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-lg text-white placeholder:text-white/25 focus:outline-none focus:border-[#00D9FF]/50 resize-none transition-colors"
                                placeholder="e.g. Machine learning for healthcare diagnostics, or What are the best approaches for distributed systems fault tolerance?"
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleResearch(); }}
                            />
                            <p className="text-sm text-white/25 mt-1">Ctrl+Enter to search</p>
                        </div>

                        {/* Research type selector */}
                        <div>
                            <label className="block text-base font-medium text-white/60 mb-2">Research Type</label>
                            <div className="space-y-2">
                                {RESEARCH_TYPES.map(type => (
                                    <button
                                        key={type.value}
                                        onClick={() => setResearchType(type.value)}
                                        className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                                            researchType === type.value
                                                ? 'bg-[#00D9FF]/10 border-[#00D9FF]/40 text-[#00D9FF]'
                                                : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:border-white/20'
                                        }`}
                                    >
                                        <span className="shrink-0 mt-0.5">{type.icon}</span>
                                        <div>
                                            <p className="text-base font-medium">{type.label}</p>
                                            <p className="text-sm text-white/40 mt-0.5">{type.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleResearch}
                            disabled={isLoading || !topic.trim()}
                            className="w-full flex items-center justify-center gap-2 bg-[#00D9FF] hover:bg-[#00D9FF]/90 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold py-3 px-6 rounded-xl transition-all text-lg"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            {isLoading ? 'Researching…' : 'Start Research'}
                        </button>
                    </div>

                    {/* Features card */}
                    <div className="rounded-xl bg-gradient-to-br from-[#00D9FF]/10 to-purple-500/10 border border-[#00D9FF]/20 p-5">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#00D9FF]" /> AI Capabilities
                        </h3>
                        <ul className="space-y-2 text-base text-white/60">
                            {['Comprehensive literature reviews', 'Research methodology guides', 'APA & BibTeX citations', 'Research gap identification', 'Step-by-step research plans'].map(f => (
                                <li key={f} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* History */}
                    {history.length > 0 && (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                            <h3 className="text-lg font-semibold text-white mb-3">Recent Searches</h3>
                            <div className="space-y-2">
                                {history.slice(0, 5).map((h, i) => (
                                    <button key={i} onClick={() => { setTopic(h.topic); setResearchType(h.type); }}
                                        className="w-full text-left p-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] transition-colors group">
                                        <p className="text-base text-white/70 truncate group-hover:text-white transition-colors">{h.topic}</p>
                                        <p className="text-sm text-white/30 mt-0.5">{RESEARCH_TYPES.find(t => t.value === h.type)?.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Results panel ── */}
                <div className="lg:col-span-2 space-y-5">
                    {isLoading && (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-10 flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-[#00D9FF] animate-spin" />
                            <p className="text-xl text-white/60">Researching <span className="text-white">{topic}</span>…</p>
                            <p className="text-base text-white/30">This may take 15–30 seconds</p>
                        </div>
                    )}

                    {!isLoading && content && (
                        <>
                            {/* Result header */}
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#00D9FF]/10">
                                        {selectedType.icon}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{selectedType.label}</h2>
                                        <p className="text-base text-white/40 truncate max-w-[300px]">{topic}</p>
                                    </div>
                                </div>
                                <button onClick={copyContent}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-base text-white/60 hover:text-white transition-all">
                                    {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy All'}
                                </button>
                            </div>

                            {/* Main content */}
                            <div className="rounded-xl bg-white/5 border border-white/10 p-6">
                                <MarkdownContent text={content} />
                            </div>

                            {/* Citations */}
                            {citations.length > 0 && (
                                <div className="rounded-xl bg-white/5 border border-white/10 p-6">
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Quote className="w-5 h-5 text-purple-400" />
                                        Citations ({citations.length})
                                    </h2>
                                    <div className="space-y-3">
                                        {citations.map((citation, i) => (
                                            <div key={i} className="flex gap-3 bg-white/[0.04] rounded-lg px-4 py-3">
                                                <span className="shrink-0 font-bold text-[#00D9FF] text-base">[{i + 1}]</span>
                                                <p className="text-base text-white/70 leading-relaxed">{citation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {!isLoading && !content && (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-16 flex flex-col items-center gap-4 text-center">
                            <div className="p-5 rounded-2xl bg-white/5">
                                <GraduationCap className="w-14 h-14 text-white/20" />
                            </div>
                            <h3 className="text-2xl font-semibold text-white/60">Ready to Research</h3>
                            <p className="text-lg text-white/35 max-w-md">
                                Enter a topic, choose a research type, and let AI generate a comprehensive analysis for you
                            </p>
                            <div className="grid grid-cols-3 gap-3 mt-4 w-full max-w-lg">
                                {['Machine Learning in Healthcare', 'Distributed Systems Design', 'Quantum Computing Basics'].map(s => (
                                    <button key={s} onClick={() => setTopic(s)}
                                        className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#00D9FF]/30 text-sm text-white/50 hover:text-white transition-all text-left">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
