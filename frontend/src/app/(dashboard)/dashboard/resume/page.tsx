
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { resumeService } from '@/services/resumeService';
import toast from 'react-hot-toast';
import {
    FileText, Plus, Download, Edit, Trash2, CheckCircle, Clock, Loader2
} from 'lucide-react';

export default function ResumeDashboard() {
    const [resumes, setResumes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchResumes();
    }, []);

    const fetchResumes = async () => {
        setIsLoading(true);
        try {
            const res = await resumeService.getAllResumes();
            if (res.success) setResumes(res.data);
        } catch {
            // If backend not connected, show empty state gracefully
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this resume?')) return;
        try {
            await resumeService.deleteResume(id);
            setResumes(prev => prev.filter(r => r._id !== id));
            toast.success('Resume deleted');
        } catch {
            toast.error('Failed to delete resume');
        }
    };

    const formatDate = (iso: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Resume Builder</h1>
                    <p className="text-gray-400 text-sm">Create AI-optimized resumes tailored for your dream job.</p>
                </div>
                <Link href="/dashboard/resume/builder"
                    className="flex items-center gap-2 px-4 py-2 bg-[#00D9FF] text-black rounded-lg font-bold hover:bg-[#00D9FF]/90 transition-colors">
                    <Plus className="w-5 h-5" />
                    Create New Resume
                </Link>
            </div>

            {/* Resume List */}
            {isLoading ? (
                <div className="flex justify-center items-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00D9FF]" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resumes.map(resume => {
                        const score = resume.analysis?.atsScore || 0;
                        return (
                            <div key={resume._id}
                                className="bg-[#111111] border border-gray-800 rounded-xl p-5 hover:border-[#00D9FF]/50 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-gray-800/50 rounded-lg text-[#00D9FF]">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/dashboard/resume/builder`}
                                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white" title="Edit">
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button onClick={() => handleDelete(resume._id)}
                                            className="p-2 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-400 transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-1 truncate">{resume.name}</h3>
                                <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    Updated {formatDate(resume.updatedAt)}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                                    <div className={`px-2 py-1 rounded text-xs font-bold border ${
                                        score >= 80 ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                        : score >= 60 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        : score > 0  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                        : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                    }`}>
                                        {score > 0 ? `ATS: ${score}/100` : 'Not Analyzed'}
                                    </div>
                                    {score >= 80 && <CheckCircle className="w-4 h-4 text-green-500" />}
                                </div>
                            </div>
                        );
                    })}

                    {/* Create New Card */}
                    <Link href="/dashboard/resume/builder"
                        className="border border-dashed border-gray-800 rounded-xl p-5 flex flex-col items-center justify-center text-gray-500 hover:border-[#00D9FF] hover:text-[#00D9FF] hover:bg-[#00D9FF]/5 transition-all cursor-pointer min-h-[200px] group">
                        <div className="p-4 bg-gray-900 group-hover:bg-[#00D9FF]/10 rounded-full mb-4 transition-colors">
                            <Plus className="w-8 h-8" />
                        </div>
                        <span className="font-medium">Create New Resume</span>
                    </Link>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && resumes.length === 0 && (
                <div className="text-center py-20">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <h2 className="text-xl font-bold text-white mb-2">No resumes yet</h2>
                    <p className="text-gray-500 mb-6">Create your first AI-powered resume in minutes.</p>
                    <Link href="/dashboard/resume/builder"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#00D9FF] text-black rounded-lg font-bold hover:bg-[#00D9FF]/90 transition-colors">
                        <Plus className="w-5 h-5" />
                        Create Resume Now
                    </Link>
                </div>
            )}
        </div>
    );
}

