'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { resumeService } from '@/services/resumeService';
import toast from 'react-hot-toast';
import {
    User, Briefcase, GraduationCap, Code, Code2, FileText, ArrowLeft, Eye,
    Save, Wand2, Github, Globe, CheckCircle, Loader2, Clock, Edit,
    Plus, Trash2, Download, FolderGit2, Award, RefreshCw, BarChart2, X
} from 'lucide-react';

const STEPS = [
    { id: 'personal',   label: 'Personal',   icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education',  label: 'Education',  icon: GraduationCap },
    { id: 'projects',   label: 'Projects',   icon: FolderGit2 },
    { id: 'skills',     label: 'Skills',     icon: Code },
    { id: 'finalize',   label: 'Finalize',   icon: FileText },
];

const inputCls = 'w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00D9FF] outline-none transition-colors placeholder:text-gray-600';
const labelCls = 'text-xs font-bold text-gray-500 uppercase mb-1 block';

export default function ResumeBuilder() {
    const [phase, setPhase] = useState<'onboarding' | 'editing'>('onboarding');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [savedResumeId, setSavedResumeId] = useState<string | null>(null);
    const [atsScore, setAtsScore] = useState<number | null>(null);
    const [atsImprovements, setAtsImprovements] = useState<string[]>([]);
    const [showAtsPanel, setShowAtsPanel] = useState(false);
    const [activeTab, setActiveTab] = useState<'new' | 'myResumes'>('new');
    const [myResumes, setMyResumes] = useState<any[]>([]);
    const [isLoadingResumes, setIsLoadingResumes] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTab === 'myResumes') fetchMyResumes();
    }, [activeTab]);

    const fetchMyResumes = async () => {
        setIsLoadingResumes(true);
        try {
            const res = await resumeService.getAllResumes();
            if (res.success) setMyResumes(res.data);
        } catch { /* silently handle */ } finally {
            setIsLoadingResumes(false);
        }
    };

    const handleDeleteResume = async (id: string) => {
        if (!confirm('Delete this resume?')) return;
        try {
            await resumeService.deleteResume(id);
            setMyResumes(prev => prev.filter(r => r._id !== id));
            toast.success('Resume deleted');
        } catch { toast.error('Failed to delete resume'); }
    };

    const formatDate = (iso: string) => {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const [inputData, setInputData] = useState({
        resumeName: '',
        fullName: '',
        email: '',
        phone: '',
        age: '',
        location: '',
        photo: null as File | null,
        photoPreview: '',
        githubUrl: '',
        leetcodeUrl: '',
        codeforcesUrl: '',
        portfolioUrl: '',
        linkedinAchievements: ''
    });

    const [currentStep, setCurrentStep] = useState('personal');
    const [isPreviewOpen, setIsPreviewOpen] = useState(true);

    const [resumeData, setResumeData] = useState({
        personal: { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', summary: '' },
        skills: { languages: [] as string[], frameworks: [] as string[], tools: [] as string[], concepts: [] as string[] },
        experience: [] as any[],
        education: [] as any[],
        projects: [] as any[],
        certifications: [] as any[],
        competitiveProgramming: '',
        achievements: [] as string[]
    });

    const handleInput = (field: string, value: string) =>
        setInputData(prev => ({ ...prev, [field]: value }));

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setInputData(prev => ({ ...prev, photo: file, photoPreview: URL.createObjectURL(file) }));
        }
    };

    const handlePersonalChange = (field: string, value: string) =>
        setResumeData(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }));

    const addItem = (section: string, template: object) =>
        setResumeData(prev => ({ ...prev, [section]: [...(prev as any)[section], { ...template }] }));

    const removeItem = (section: string, index: number) =>
        setResumeData(prev => ({ ...prev, [section]: (prev as any)[section].filter((_: any, i: number) => i !== index) }));

    const updateItem = (section: string, index: number, field: string, value: any) =>
        setResumeData(prev => {
            const arr = [...(prev as any)[section]];
            arr[index] = { ...arr[index], [field]: value };
            return { ...prev, [section]: arr };
        });

    // Recursively replace all null values with safe defaults so inputs never receive null
    const sanitizeResumeData = (data: any): any => {
        if (data === null || data === undefined) return '';
        if (typeof data === 'string') return data;
        if (typeof data === 'number' || typeof data === 'boolean') return data;
        if (Array.isArray(data)) return data.map(sanitizeResumeData);
        if (typeof data === 'object') {
            const out: any = {};
            for (const key of Object.keys(data)) {
                out[key] = sanitizeResumeData(data[key]);
            }
            return out;
        }
        return data;
    };

    // ── Generate ──────────────────────────────────────────────────────────────
    const generateResume = async () => {
        if (!inputData.fullName.trim()) { toast.error('Full name is required'); return; }
        setIsGenerating(true);
        const tid = toast.loading('Fetching profiles & building your resume with AI...');
        try {
            const response = await resumeService.generateResume(inputData);
            if (response.success && response.data && !response.data.error) {
                const clean = sanitizeResumeData(response.data);
                setResumeData(prev => ({ ...prev, ...clean }));
                setPhase('editing');
                toast.success('Resume generated! Review and edit each section.', { id: tid });
                await saveResume(clean, inputData.resumeName || `${inputData.fullName}'s Resume`);
            } else {
                toast.error(response.data?.error || 'AI could not build the resume. Check your API key.', { id: tid });
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Backend connection failed.', { id: tid });
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const saveResume = async (data?: any, name?: string) => {
        setIsSaving(true);
        try {
            const content = data || resumeData;
            const allSkills = Array.isArray(content.skills)
                ? content.skills
                : [
                    ...(content.skills?.languages || []),
                    ...(content.skills?.frameworks || []),
                    ...(content.skills?.tools || []),
                    ...(content.skills?.concepts || []),
                ];
            const payload = {
                name: name || inputData.resumeName || `${resumeData.personal.fullName || inputData.fullName}'s Resume`,
                content: {
                    personal: content.personal,
                    experience: content.experience,
                    education: content.education,
                    projects: content.projects,
                    skills: allSkills,
                    certifications: content.certifications,
                    achievements: content.achievements,
                }
            };

            if (savedResumeId) {
                await resumeService.updateResume(savedResumeId, payload);
            } else {
                const res = await resumeService.createResume(payload);
                if (res.success) setSavedResumeId(res.data._id);
            }
            if (!data) toast.success('Resume saved!');
        } catch {
            if (!data) toast.error('Failed to save resume.');
        } finally {
            setIsSaving(false);
        }
    };

    // ── ATS Analyze ───────────────────────────────────────────────────────────
    const analyzeATS = async () => {
        setIsAnalyzing(true);
        const tid = toast.loading('Analyzing resume for ATS score...');
        try {
            const res = await resumeService.analyzeResume(resumeData, '', savedResumeId || undefined);
            if (res.success) {
                setAtsScore(res.data.atsScore);
                setAtsImprovements(res.data.improvements || []);
                setShowAtsPanel(true);
                toast.success(`ATS Score: ${res.data.atsScore}/100`, { id: tid });
            }
        } catch {
            toast.error('ATS analysis failed.', { id: tid });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── Regenerate Summary ────────────────────────────────────────────────────
    const regenerateSummary = async () => {
        setIsRegenerating(true);
        const tid = toast.loading('Regenerating summary with AI...');
        try {
            const res = await resumeService.regenerateSummary(resumeData);
            if (res.success && res.data.summary) {
                handlePersonalChange('summary', res.data.summary);
                toast.success('Summary regenerated!', { id: tid });
            }
        } catch {
            toast.error('Failed to regenerate summary.', { id: tid });
        } finally {
            setIsRegenerating(false);
        }
    };

    // ── PDF Export ────────────────────────────────────────────────────────────
    const exportPDF = async () => {
        if (!previewRef.current) { toast.error('Enable the preview panel first.'); return; }
        setIsExporting(true);
        const tid = toast.loading('Generating PDF...');
        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const canvas = await html2canvas(previewRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: previewRef.current.scrollWidth,
                windowHeight: previewRef.current.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = pdf.internal.pageSize.getHeight();
            const imgH = (canvas.height * pdfW) / canvas.width;

            let heightLeft = imgH;
            let position = 0;
            pdf.addImage(imgData, 'JPEG', 0, position, pdfW, imgH);
            heightLeft -= pdfH;
            while (heightLeft > 0) {
                position = heightLeft - imgH;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfW, imgH);
                heightLeft -= pdfH;
            }

            pdf.save(`${resumeData.personal.fullName || 'Resume'}_Resume.pdf`);
            toast.success('PDF downloaded!', { id: tid });
        } catch (err: any) {
            toast.error('PDF export failed: ' + err.message, { id: tid });
        } finally {
            setIsExporting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ONBOARDING
    // ─────────────────────────────────────────────────────────────────────────
    if (phase === 'onboarding') {
        return (
            <div className="-m-8 min-h-screen flex flex-col bg-[#0a0a0a] overflow-y-auto">

                {/* ── Top bar ── */}
                <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur border-b border-gray-800 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#00D9FF]/10 rounded-lg border border-[#00D9FF]/20">
                            <Wand2 className="w-5 h-5 text-[#00D9FF]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">AI Resume Generator</h1>
                            <p className="text-xs text-gray-500">Build a FAANG-ready resume instantly from your profiles</p>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex items-center bg-[#111111] border border-gray-800 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === 'new'
                                    ? 'bg-[#00D9FF] text-black shadow'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Plus className="w-4 h-4" /> New Resume
                        </button>
                        <button
                            onClick={() => setActiveTab('myResumes')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === 'myResumes'
                                    ? 'bg-[#00D9FF] text-black shadow'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <FileText className="w-4 h-4" /> My Resumes
                            {myResumes.length > 0 && (
                                <span className="bg-black/20 text-xs px-1.5 py-0.5 rounded-full">{myResumes.length}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── MY RESUMES TAB ── */}
                {activeTab === 'myResumes' && (
                    <div className="flex-1 p-8">
                        {isLoadingResumes ? (
                            <div className="flex justify-center items-center py-32">
                                <Loader2 className="w-8 h-8 animate-spin text-[#00D9FF]" />
                            </div>
                        ) : myResumes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center">
                                <FileText className="w-16 h-16 text-gray-700 mb-4" />
                                <h2 className="text-xl font-bold text-white mb-2">No resumes yet</h2>
                                <p className="text-gray-500 mb-6">Generate your first AI-powered resume using the New Resume tab.</p>
                                <button onClick={() => setActiveTab('new')}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#00D9FF] text-black rounded-lg font-bold hover:bg-[#00D9FF]/90 transition-colors">
                                    <Plus className="w-5 h-5" /> Create Resume Now
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {myResumes.map(resume => {
                                    const score = resume.analysis?.atsScore || 0;
                                    return (
                                        <div key={resume._id}
                                            className="bg-[#111111] border border-gray-800 rounded-xl p-5 hover:border-[#00D9FF]/50 transition-all group flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-gray-800/50 rounded-lg text-[#00D9FF]">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setActiveTab('new'); }}
                                                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white" title="Edit in builder">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteResume(resume._id)}
                                                        className="p-2 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-400 transition-colors" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <h3 className="text-base font-semibold text-white mb-1 truncate">{resume.name}</h3>
                                            <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                Updated {formatDate(resume.updatedAt)}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-800">
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
                                {/* New resume card */}
                                <button onClick={() => setActiveTab('new')}
                                    className="border border-dashed border-gray-800 rounded-xl p-5 flex flex-col items-center justify-center text-gray-500 hover:border-[#00D9FF] hover:text-[#00D9FF] hover:bg-[#00D9FF]/5 transition-all min-h-[180px] group">
                                    <div className="p-4 bg-gray-900 group-hover:bg-[#00D9FF]/10 rounded-full mb-3 transition-colors">
                                        <Plus className="w-7 h-7" />
                                    </div>
                                    <span className="font-medium text-sm">New Resume</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── NEW RESUME TAB ── */}
                {activeTab === 'new' && (
                    <div className="flex-1 p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                            {/* Col 1 — Personal Details */}
                            <div className="space-y-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
                                    <User className="w-4 h-4 text-[#00D9FF]" /> Personal Details
                                </h3>
                                <div>
                                    <label className={labelCls}>Resume Name</label>
                                    <input className={inputCls} placeholder="e.g. SDE Resume 2026"
                                        value={inputData.resumeName} onChange={e => handleInput('resumeName', e.target.value)} />
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-[#111111] border border-gray-800 rounded-lg">
                                    <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                                        {inputData.photoPreview
                                            ? <img src={inputData.photoPreview} alt="Photo" className="w-full h-full object-cover" />
                                            : <User className="w-8 h-8 text-gray-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <label className={labelCls}>Profile Photo (Optional)</label>
                                        <input type="file" accept="image/*" onChange={handlePhotoUpload}
                                            className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#00D9FF]/10 file:text-[#00D9FF] hover:file:bg-[#00D9FF]/20 file:cursor-pointer" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Full Name *</label>
                                        <input className={inputCls} placeholder="e.g. Rudra Pratap"
                                            value={inputData.fullName} onChange={e => handleInput('fullName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Age</label>
                                        <input type="number" className={inputCls} placeholder="22"
                                            value={inputData.age} onChange={e => handleInput('age', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Phone</label>
                                        <input className={inputCls} placeholder="+91 98765..."
                                            value={inputData.phone} onChange={e => handleInput('phone', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Email</label>
                                        <input className={inputCls} placeholder="you@email.com"
                                            value={inputData.email} onChange={e => handleInput('email', e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Location</label>
                                    <input className={inputCls} placeholder="City, Country"
                                        value={inputData.location} onChange={e => handleInput('location', e.target.value)} />
                                </div>
                            </div>

                            {/* Col 2 — Public Profiles */}
                            <div className="space-y-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
                                    <Globe className="w-4 h-4 text-[#00D9FF]" /> Public Profiles
                                </h3>
                                <p className="text-xs text-gray-500">
                                    AI fetches your public profiles via official APIs to auto-generate projects, skills, and competitive programming stats.
                                </p>
                                {([
                                    { icon: Github, field: 'githubUrl',     placeholder: 'GitHub Profile URL  (e.g. https://github.com/username)' },
                                    { icon: Code,   field: 'leetcodeUrl',   placeholder: 'LeetCode Profile URL  (e.g. https://leetcode.com/username)' },
                                    { icon: Code2,  field: 'codeforcesUrl', placeholder: 'Codeforces Profile URL  (e.g. https://codeforces.com/profile/handle)' },
                                ] as const).map(({ icon: Icon, field, placeholder }) => (
                                    <div key={field} className="relative group">
                                        <Icon className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-[#00D9FF] transition-colors" />
                                        <input className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-[#00D9FF] outline-none placeholder:text-gray-600"
                                            placeholder={placeholder}
                                            value={(inputData as any)[field]}
                                            onChange={e => handleInput(field, e.target.value)} />
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-900 rounded-lg px-3 py-2">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                    GitHub · LeetCode · Codeforces use official APIs — data is always accurate
                                </div>
                                <div>
                                    <label className={labelCls}>Portfolio / Website</label>
                                    <input className={inputCls} placeholder="https://yourportfolio.dev"
                                        value={inputData.portfolioUrl} onChange={e => handleInput('portfolioUrl', e.target.value)} />
                                </div>
                            </div>

                            {/* Col 3 — Achievements */}
                            <div className="space-y-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
                                    <Award className="w-4 h-4 text-[#00D9FF]" /> Achievements & Certifications
                                    <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded-full">Optional</span>
                                </h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Paste your hackathon wins, certifications, honors, or any achievements here. AI will extract each one into your resume.
                                </p>
                                <div className="bg-[#111111] border border-dashed border-gray-700 rounded-lg p-3 focus-within:border-[#00D9FF] transition-colors flex-1">
                                    <textarea
                                        className="w-full bg-transparent text-white text-sm outline-none resize-none placeholder:text-gray-600 min-h-[200px]"
                                        placeholder={`Examples:

🏆 Won 1st place at HackNITR 4.0 (March 2024)
📜 AWS Certified Cloud Practitioner (2024)
🥈 Finalist at Smart India Hackathon 2023
📜 Full Stack Web Dev – Udemy (2023)
🎓 Google DSC Core Team Member 2023-24
🏅 Top 5% on LeetCode Weekly Contest`}
                                        value={inputData.linkedinAchievements}
                                        onChange={e => handleInput('linkedinAchievements', e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-gray-600">💡 Copy from your LinkedIn posts, certificates, or just type them out.</p>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="flex justify-center pb-8">
                            <button
                                onClick={generateResume}
                                disabled={isGenerating || !inputData.fullName.trim()}
                                className="px-10 py-4 bg-gradient-to-r from-[#00D9FF] to-cyan-500 text-black font-bold text-lg rounded-xl hover:shadow-[0_0_40px_rgba(0,217,255,0.4)] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100"
                            >
                                {isGenerating
                                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing & Building...</>
                                    : <><Wand2 className="w-5 h-5" /> Generate Resume with AI</>}
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-600 pb-6">
                            AI will fetch your public GitHub, LeetCode, and Codeforces data automatically.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EDITING PHASE
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-[calc(100vh-80px)] gap-4 overflow-hidden">

            {/* ATS Drawer — fixed right side panel */}
            {showAtsPanel && (
                <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowAtsPanel(false)}>
                    <div
                        className="relative h-full w-[420px] bg-[#111111] border-l border-gray-800 flex flex-col shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
                            <div className="flex items-center gap-3">
                                <BarChart2 className="w-5 h-5 text-purple-400" />
                                <span className="text-white font-bold text-base">ATS Score Analysis</span>
                            </div>
                            <button onClick={() => setShowAtsPanel(false)}
                                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Score Gauge */}
                        <div className="flex flex-col items-center py-8 px-6 border-b border-gray-800">
                            <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-8 ${
                                atsScore! >= 80 ? 'border-green-500 bg-green-500/10'
                                : atsScore! >= 60 ? 'border-yellow-500 bg-yellow-500/10'
                                : 'border-red-500 bg-red-500/10'
                            }`}>
                                <div className="text-center">
                                    <div className={`text-4xl font-black ${
                                        atsScore! >= 80 ? 'text-green-400'
                                        : atsScore! >= 60 ? 'text-yellow-400'
                                        : 'text-red-400'
                                    }`}>{atsScore}</div>
                                    <div className="text-gray-500 text-xs font-bold">/ 100</div>
                                </div>
                            </div>
                            <p className={`mt-3 text-sm font-bold ${
                                atsScore! >= 80 ? 'text-green-400'
                                : atsScore! >= 60 ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}>
                                {atsScore! >= 80 ? '🟢 Strong — Ready to apply' : atsScore! >= 60 ? '🟡 Good — Minor improvements needed' : '🔴 Needs work — Follow suggestions below'}
                            </p>
                        </div>

                        {/* Improvements List */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Suggestions to improve</p>
                            {atsImprovements.map((imp, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl">
                                    <span className="mt-0.5 w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                                    <p className="text-gray-300 text-sm leading-relaxed">{imp}</p>
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-800">
                            <button onClick={() => setShowAtsPanel(false)}
                                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold text-sm transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between shrink-0 bg-[#111111] border border-gray-800 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => setPhase('onboarding')}
                        className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-white">
                            {resumeData.personal.fullName || inputData.fullName || 'My Resume'}
                        </h1>
                        <div className="flex items-center gap-3 text-xs mt-0.5">
                            {savedResumeId
                                ? <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Saved</span>
                                : <span className="text-gray-500">Unsaved</span>}
                            {atsScore !== null && (
                                <span className={`px-2 py-0.5 rounded-md font-bold border ${
                                    atsScore >= 80 ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                    : atsScore >= 60 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                                }`}>
                                    ATS {atsScore}/100
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={analyzeATS} disabled={isAnalyzing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-colors disabled:opacity-50">
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                        ATS Score
                    </button>
                    <button onClick={() => saveResume()} disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-50">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                    <button onClick={() => setIsPreviewOpen(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors ${
                            isPreviewOpen
                                ? 'bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/30'
                                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                        }`}>
                        <Eye className="w-4 h-4" /> {isPreviewOpen ? 'Hide' : 'Preview'}
                    </button>
                    <button onClick={exportPDF} disabled={isExporting || !isPreviewOpen}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#00D9FF] text-black rounded-xl font-bold text-sm hover:bg-[#00D9FF]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex gap-4 overflow-hidden min-h-0">

                {/* LEFT: Editor */}
                <div className={`flex flex-col gap-4 transition-all duration-300 overflow-hidden ${isPreviewOpen ? 'w-[55%]' : 'w-full'}`}>

                    {/* Stepper */}
                    <div className="bg-[#111111] border border-gray-800 rounded-2xl p-2 flex overflow-x-auto shrink-0 gap-1">
                        {STEPS.map(step => {
                            const Icon = step.icon;
                            const active = currentStep === step.id;
                            return (
                                <button key={step.id} onClick={() => setCurrentStep(step.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap flex-1 justify-center font-medium ${
                                        active ? 'bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30'
                                               : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900 border border-transparent'
                                    }`}>
                                    <Icon className={`w-4 h-4 ${active ? 'text-[#00D9FF]' : ''}`} />
                                    {step.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Form */}
                    <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 flex-1 overflow-y-auto min-h-0">

                        {/* PERSONAL */}
                        {currentStep === 'personal' && (
                            <div className="space-y-4">
                                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                                    <User className="w-4 h-4 text-[#00D9FF]" /> Personal Details
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {(['fullName', 'email', 'phone', 'location'] as const).map(field => (
                                        <div key={field}>
                                            <label className={labelCls}>{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                            <input className={inputCls}
                                                value={resumeData.personal[field] ?? ''}
                                                onChange={e => handlePersonalChange(field, e.target.value)} />
                                        </div>
                                    ))}
                                    {(['linkedin', 'github', 'portfolio'] as const).map(field => (
                                        <div key={field} className="col-span-2">
                                            <label className={labelCls}>{field.charAt(0).toUpperCase() + field.slice(1)} URL</label>
                                            <input className={inputCls}
                                                value={resumeData.personal[field] ?? ''}
                                                onChange={e => handlePersonalChange(field, e.target.value)} />
                                        </div>
                                    ))}
                                    <div className="col-span-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className={labelCls}>Professional Summary</label>
                                            <button onClick={regenerateSummary} disabled={isRegenerating}
                                                className="text-xs text-[#00D9FF] flex items-center gap-1 hover:underline disabled:opacity-50">
                                                {isRegenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                Re-Generate with AI
                                            </button>
                                        </div>
                                        <textarea rows={5}
                                            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00D9FF] outline-none resize-none leading-relaxed"
                                            value={resumeData.personal.summary ?? ''}
                                            onChange={e => handlePersonalChange('summary', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EXPERIENCE */}
                        {currentStep === 'experience' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-[#00D9FF]" /> Work Experience
                                    </h2>
                                    <button onClick={() => addItem('experience', { role: '', company: '', location: '', startDate: '', endDate: '', bullets: [''] })}
                                        className="text-sm px-3 py-1.5 bg-[#00D9FF]/10 text-[#00D9FF] rounded-lg border border-[#00D9FF]/30 hover:bg-[#00D9FF]/20">
                                        <Plus className="w-4 h-4 inline mr-1" />Add
                                    </button>
                                </div>
                                {resumeData.experience.length === 0 ? (
                                    <div className="text-center py-16 text-gray-600 border border-dashed border-gray-800 rounded-xl">
                                        <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No experience yet.</p>
                                    </div>
                                ) : resumeData.experience.map((exp, i) => (
                                    <div key={i} className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-xl space-y-3">
                                        <div className="flex justify-between text-xs text-gray-500 font-bold">
                                            <span>EXPERIENCE #{i + 1}</span>
                                            <button onClick={() => removeItem('experience', i)} className="text-red-500 hover:text-red-400 flex items-center gap-1">
                                                <Trash2 className="w-3 h-3" />Remove
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input className={inputCls} placeholder="Job Title" value={exp.role} onChange={e => updateItem('experience', i, 'role', e.target.value)} />
                                            <input className={inputCls} placeholder="Company" value={exp.company} onChange={e => updateItem('experience', i, 'company', e.target.value)} />
                                            <input className={inputCls} placeholder="Start (e.g. Jan 2023)" value={exp.startDate} onChange={e => updateItem('experience', i, 'startDate', e.target.value)} />
                                            <input className={inputCls} placeholder="End (or Present)" value={exp.endDate} onChange={e => updateItem('experience', i, 'endDate', e.target.value)} />
                                            <input className={inputCls + ' col-span-2'} placeholder="Location (optional)" value={exp.location || ''} onChange={e => updateItem('experience', i, 'location', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Bullet Points (one per line)</label>
                                            <textarea rows={4}
                                                className="w-full bg-[#111111] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00D9FF] outline-none resize-none"
                                                placeholder="• Engineered a feature that reduced latency by 40%..."
                                                value={Array.isArray(exp.bullets) ? exp.bullets.join('\n') : (exp.description || '')}
                                                onChange={e => updateItem('experience', i, 'bullets', e.target.value.split('\n'))} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* EDUCATION */}
                        {currentStep === 'education' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-[#00D9FF]" /> Education
                                    </h2>
                                    <button onClick={() => addItem('education', { school: '', degree: '', fieldOfStudy: '', year: '', grade: '', coursework: '' })}
                                        className="text-sm px-3 py-1.5 bg-[#00D9FF]/10 text-[#00D9FF] rounded-lg border border-[#00D9FF]/30 hover:bg-[#00D9FF]/20">
                                        <Plus className="w-4 h-4 inline mr-1" />Add
                                    </button>
                                </div>
                                {resumeData.education.length === 0 ? (
                                    <div className="text-center py-16 text-gray-600 border border-dashed border-gray-800 rounded-xl">
                                        <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No education yet.</p>
                                    </div>
                                ) : resumeData.education.map((edu, i) => (
                                    <div key={i} className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-xl space-y-3">
                                        <div className="flex justify-between text-xs text-gray-500 font-bold">
                                            <span>EDUCATION #{i + 1}</span>
                                            <button onClick={() => removeItem('education', i)} className="text-red-500 hover:text-red-400 flex items-center gap-1">
                                                <Trash2 className="w-3 h-3" />Remove
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input className={inputCls + ' col-span-2'} placeholder="School / University" value={edu.school} onChange={e => updateItem('education', i, 'school', e.target.value)} />
                                            <input className={inputCls} placeholder="Degree (e.g. B.Tech)" value={edu.degree} onChange={e => updateItem('education', i, 'degree', e.target.value)} />
                                            <input className={inputCls} placeholder="Field of Study" value={edu.fieldOfStudy || ''} onChange={e => updateItem('education', i, 'fieldOfStudy', e.target.value)} />
                                            <input className={inputCls} placeholder="Year (2021-2025)" value={edu.year} onChange={e => updateItem('education', i, 'year', e.target.value)} />
                                            <input className={inputCls} placeholder="GPA / CGPA (optional)" value={edu.grade || ''} onChange={e => updateItem('education', i, 'grade', e.target.value)} />
                                            <input className={inputCls + ' col-span-2'} placeholder="Relevant coursework (optional)" value={edu.coursework || ''} onChange={e => updateItem('education', i, 'coursework', e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* PROJECTS */}
                        {currentStep === 'projects' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <FolderGit2 className="w-4 h-4 text-[#00D9FF]" /> Projects
                                    </h2>
                                    <button onClick={() => addItem('projects', { name: '', link: '', bullets: [''], techStack: [] })}
                                        className="text-sm px-3 py-1.5 bg-[#00D9FF]/10 text-[#00D9FF] rounded-lg border border-[#00D9FF]/30 hover:bg-[#00D9FF]/20">
                                        <Plus className="w-4 h-4 inline mr-1" />Add
                                    </button>
                                </div>
                                {resumeData.projects.length === 0 ? (
                                    <div className="text-center py-16 text-gray-600 border border-dashed border-gray-800 rounded-xl">
                                        <FolderGit2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No projects yet — AI should have auto-filled these from GitHub.</p>
                                    </div>
                                ) : resumeData.projects.map((proj, i) => (
                                    <div key={i} className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-xl space-y-3">
                                        <div className="flex justify-between text-xs text-gray-500 font-bold">
                                            <span>PROJECT #{i + 1}</span>
                                            <button onClick={() => removeItem('projects', i)} className="text-red-500 hover:text-red-400 flex items-center gap-1">
                                                <Trash2 className="w-3 h-3" />Remove
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input className={inputCls} placeholder="Project Name" value={proj.name} onChange={e => updateItem('projects', i, 'name', e.target.value)} />
                                            <input className={inputCls} placeholder="GitHub / Live Link" value={proj.link || ''} onChange={e => updateItem('projects', i, 'link', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Bullet Points (one per line)</label>
                                            <textarea rows={4}
                                                className="w-full bg-[#111111] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00D9FF] outline-none resize-none"
                                                placeholder="• Architected a system that..."
                                                value={Array.isArray(proj.bullets) ? proj.bullets.join('\n') : (proj.description || '')}
                                                onChange={e => updateItem('projects', i, 'bullets', e.target.value.split('\n'))} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Tech Stack (comma-separated)</label>
                                            <input className={inputCls}
                                                placeholder="React, Node.js, MongoDB, AWS..."
                                                value={Array.isArray(proj.techStack) ? proj.techStack.join(', ') : (proj.technologies?.join(', ') || '')}
                                                onChange={e => updateItem('projects', i, 'techStack', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* SKILLS */}
                        {currentStep === 'skills' && (
                            <div className="space-y-5">
                                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                                    <Code className="w-4 h-4 text-[#00D9FF]" /> Skills & Competitive Programming
                                </h2>

                                <div>
                                    <label className={labelCls}>Competitive Programming Summary</label>
                                    <textarea rows={3}
                                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00D9FF] outline-none resize-none"
                                        placeholder="e.g. Active on LeetCode (300+ problems) and Codeforces (Expert, 1650 rating)"
                                        value={resumeData.competitiveProgramming ?? ''}
                                        onChange={e => setResumeData(prev => ({ ...prev, competitiveProgramming: e.target.value }))} />
                                </div>

                                {([
                                    { key: 'languages' as const, label: 'Programming Languages' },
                                    { key: 'frameworks' as const, label: 'Frameworks & Libraries' },
                                    { key: 'tools' as const, label: 'Tools & Platforms' },
                                    { key: 'concepts' as const, label: 'Concepts & Methodologies' },
                                ]).map(({ key, label }) => (
                                    <div key={key}>
                                        <label className={labelCls}>{label}</label>
                                        <input className={inputCls}
                                            placeholder="Comma-separated list..."
                                            value={Array.isArray(resumeData.skills[key]) ? resumeData.skills[key].join(', ') : ''}
                                            onChange={e => setResumeData(prev => ({
                                                ...prev,
                                                skills: { ...prev.skills, [key]: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                                            }))} />
                                        <div className="flex flex-wrap gap-1.5 mt-2 min-h-[28px]">
                                            {(resumeData.skills[key] || []).map((s, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded-full text-xs border border-gray-700">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* FINALIZE */}
                        {currentStep === 'finalize' && (
                            <div className="space-y-5">
                                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                                    <Award className="w-4 h-4 text-[#00D9FF]" /> Certifications & Achievements
                                </h2>

                                {/* Certifications */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-white">Certifications</label>
                                        <button onClick={() => addItem('certifications', { name: '', issuer: '', date: '' })}
                                            className="text-xs px-3 py-1.5 bg-[#00D9FF]/10 text-[#00D9FF] rounded-lg border border-[#00D9FF]/30 hover:bg-[#00D9FF]/20">
                                            <Plus className="w-3 h-3 inline mr-1" />Add
                                        </button>
                                    </div>
                                    {(!resumeData.certifications || resumeData.certifications.length === 0) ? (
                                        <p className="text-gray-600 text-sm py-4 text-center border border-dashed border-gray-800 rounded-xl">No certifications yet.</p>
                                    ) : resumeData.certifications.map((cert, i) => (
                                        <div key={i} className="p-3 bg-[#0a0a0a] border border-gray-800 rounded-lg space-y-2">
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>CERT #{i + 1}</span>
                                                <button onClick={() => removeItem('certifications', i)} className="text-red-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <input className={inputCls + ' col-span-2'} placeholder="Certification Name" value={cert.name} onChange={e => updateItem('certifications', i, 'name', e.target.value)} />
                                                <input className={inputCls} placeholder="Year" value={cert.date} onChange={e => updateItem('certifications', i, 'date', e.target.value)} />
                                                <input className={inputCls + ' col-span-3'} placeholder="Issuing Organization" value={cert.issuer} onChange={e => updateItem('certifications', i, 'issuer', e.target.value)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Achievements */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-white">Achievements & Awards</label>
                                        <button onClick={() => setResumeData(prev => ({ ...prev, achievements: [...prev.achievements, ''] }))}
                                            className="text-xs px-3 py-1.5 bg-[#00D9FF]/10 text-[#00D9FF] rounded-lg border border-[#00D9FF]/30 hover:bg-[#00D9FF]/20">
                                            <Plus className="w-3 h-3 inline mr-1" />Add
                                        </button>
                                    </div>
                                    {(!resumeData.achievements || resumeData.achievements.length === 0) ? (
                                        <p className="text-gray-600 text-sm py-4 text-center border border-dashed border-gray-800 rounded-xl">No achievements yet.</p>
                                    ) : resumeData.achievements.map((ach, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input className={inputCls + ' flex-1'} placeholder="Describe your achievement..."
                                                value={ach}
                                                onChange={e => {
                                                    const arr = [...resumeData.achievements];
                                                    arr[i] = e.target.value;
                                                    setResumeData(prev => ({ ...prev, achievements: arr }));
                                                }} />
                                            <button onClick={() => setResumeData(prev => ({ ...prev, achievements: prev.achievements.filter((_, j) => j !== i) }))}
                                                className="px-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                    <p className="text-green-400 text-sm">
                                        Your resume is ready! Click <strong>Export PDF</strong> in the header to download your resume.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Live Preview */}
                {isPreviewOpen && (
                    <div className="flex-1 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-700 min-h-0">
                        <div className="bg-gray-100 px-3 py-2 border-b flex justify-between items-center shrink-0">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Live Preview (A4)</span>
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-gray-200 p-4">
                            {/* A4 Page */}
                            <div
                                ref={previewRef}
                                className="bg-white mx-auto shadow-md"
                                style={{ width: '210mm', minHeight: '297mm', padding: '15mm 20mm' }}
                            >
                                <div className="font-serif text-black text-[13px] leading-relaxed">
                                    {/* Header */}
                                    <header className="border-b-2 border-gray-900 pb-4 mb-5">
                                        <div className={`flex ${inputData.photoPreview ? 'items-center gap-5' : 'flex-col items-center'}`}>
                                            {inputData.photoPreview && (
                                                <img src={inputData.photoPreview} alt="Profile"
                                                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 shrink-0" />
                                            )}
                                            <div className="flex-1 text-center">
                                                <h1 className="text-[26px] font-bold text-gray-900 uppercase tracking-wider mb-2">
                                                    {resumeData.personal.fullName || 'Your Name'}
                                                </h1>
                                                <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 font-sans text-[12px] text-gray-600">
                                                    {resumeData.personal.email && <span>{resumeData.personal.email}</span>}
                                                    {resumeData.personal.phone && <span>• {resumeData.personal.phone}</span>}
                                                    {resumeData.personal.location && <span>• {resumeData.personal.location}</span>}
                                                    {resumeData.personal.linkedin && <span>• {resumeData.personal.linkedin}</span>}
                                                    {resumeData.personal.github && <span>• {resumeData.personal.github}</span>}
                                                    {resumeData.personal.portfolio && <span>• {resumeData.personal.portfolio}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </header>

                                    {/* Summary */}
                                    {resumeData.personal.summary && (
                                        <section className="mb-4">
                                            <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">
                                                Professional Summary
                                            </h2>
                                            <p className="text-gray-700 text-justify">{resumeData.personal.summary}</p>
                                        </section>
                                    )}

                                    {/* Skills */}
                                    {(resumeData.skills.languages?.length > 0 || resumeData.skills.frameworks?.length > 0) && (
                                        <section className="mb-4">
                                            <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">
                                                Technical Skills
                                            </h2>
                                            <div className="font-sans space-y-0.5 text-gray-800">
                                                {resumeData.skills.languages?.length > 0 && (
                                                    <p><span className="font-bold">Languages:</span> {resumeData.skills.languages.join(' • ')}</p>
                                                )}
                                                {resumeData.skills.frameworks?.length > 0 && (
                                                    <p><span className="font-bold">Frameworks & Libraries:</span> {resumeData.skills.frameworks.join(' • ')}</p>
                                                )}
                                                {resumeData.skills.tools?.length > 0 && (
                                                    <p><span className="font-bold">Tools & Platforms:</span> {resumeData.skills.tools.join(' • ')}</p>
                                                )}
                                                {resumeData.skills.concepts?.length > 0 && (
                                                    <p><span className="font-bold">Concepts:</span> {resumeData.skills.concepts.join(' • ')}</p>
                                                )}
                                            </div>
                                        </section>
                                    )}

                                    {/* Experience */}
                                    {resumeData.experience.length > 0 && (
                                        <section className="mb-4">
                                            <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">
                                                Experience
                                            </h2>
                                            {resumeData.experience.map((exp, i) => (
                                                <div key={i} className="mb-3">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="font-bold text-[14px] text-gray-900">{exp.role}</span>
                                                        <span className="font-sans text-[12px] text-gray-600">
                                                            {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                                                        </span>
                                                    </div>
                                                    <p className="font-sans italic text-gray-700 mb-1">
                                                        {exp.company}{exp.location ? ` | ${exp.location}` : ''}
                                                    </p>
                                                    {Array.isArray(exp.bullets) && exp.bullets.filter(Boolean).length > 0 ? (
                                                        <ul className="list-disc ml-5 font-sans text-gray-700 space-y-0.5">
                                                            {exp.bullets.filter(Boolean).map((b: string, idx: number) => (
                                                                <li key={idx}>{b.replace(/^[•\-]\s*/, '')}</li>
                                                            ))}
                                                        </ul>
                                                    ) : exp.description ? (
                                                        <p className="font-sans text-gray-700">{exp.description}</p>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </section>
                                    )}

                                    {/* Projects */}
                                    {resumeData.projects.length > 0 && (
                                        <section className="mb-4">
                                            <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">
                                                Projects
                                            </h2>
                                            {resumeData.projects.map((proj, i) => (
                                                <div key={i} className="mb-3">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="font-bold text-[14px] text-gray-900">{proj.name}</span>
                                                        {proj.link && (
                                                            <span className="font-sans text-[11px] text-blue-700">{proj.link}</span>
                                                        )}
                                                    </div>
                                                    {Array.isArray(proj.bullets) && proj.bullets.filter(Boolean).length > 0 ? (
                                                        <ul className="list-disc ml-5 font-sans text-gray-700 space-y-0.5">
                                                            {proj.bullets.filter(Boolean).map((b: string, idx: number) => (
                                                                <li key={idx}>{b.replace(/^[•\-]\s*/, '')}</li>
                                                            ))}
                                                        </ul>
                                                    ) : proj.description ? (
                                                        <p className="font-sans text-gray-700">{proj.description}</p>
                                                    ) : null}
                                                    {(proj.techStack?.length > 0 || proj.technologies?.length > 0) && (
                                                        <p className="font-sans text-gray-500 text-[11px] mt-0.5">
                                                            <span className="font-bold">Tech Stack:</span> {(proj.techStack || proj.technologies)?.join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </section>
                                    )}

                                    {/* Education */}
                                    {resumeData.education.length > 0 && (
                                        <section className="mb-4">
                                            <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">
                                                Education
                                            </h2>
                                            {resumeData.education.map((edu, i) => (
                                                <div key={i} className="mb-2">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="font-bold text-[14px] text-gray-900">{edu.school}</span>
                                                        <span className="font-sans text-[12px] text-gray-600">{edu.year}</span>
                                                    </div>
                                                    <p className="font-sans text-gray-700">
                                                        {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}{edu.grade ? ` | ${edu.grade}` : ''}
                                                    </p>
                                                    {edu.coursework && (
                                                        <p className="font-sans text-gray-500 text-[11px]">
                                                            <span className="font-bold">Coursework:</span> {edu.coursework}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </section>
                                    )}

                                    {/* Competitive Programming & Achievements */}
                                    {(resumeData.competitiveProgramming || resumeData.achievements?.filter(Boolean).length > 0) && (
                                        <section className="mb-4">
                                            <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">
                                                Achievements & Competitive Programming
                                            </h2>
                                            {resumeData.competitiveProgramming && (
                                                <p className="font-sans text-gray-700 mb-2">{resumeData.competitiveProgramming}</p>
                                            )}
                                            {resumeData.achievements?.filter(Boolean).length > 0 && (
                                                <ul className="list-disc ml-5 font-sans text-gray-700 space-y-0.5">
                                                    {resumeData.achievements.filter(Boolean).map((a, i) => (
                                                        <li key={i}>{a}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </section>
                                    )}

                                    {/* Certifications */}
                                    {resumeData.certifications?.length > 0 && (
                                        <section className="mb-4">
                                            <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">
                                                Certifications
                                            </h2>
                                            <ul className="font-sans text-gray-700 space-y-0.5">
                                                {resumeData.certifications.map((cert, i) => (
                                                    <li key={i}>
                                                        <span className="font-bold">{cert.name}</span>
                                                        {cert.issuer ? ` — ${cert.issuer}` : ''}
                                                        {cert.date ? ` (${cert.date})` : ''}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
