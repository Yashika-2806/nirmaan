'use client';

import React from 'react';

export type TemplateId = 'classic' | 'modern' | 'minimal' | 'executive' | 'creative';

export const TEMPLATES: { id: TemplateId; name: string; description: string; accent: string; preview: string }[] = [
    { id: 'classic',   name: 'Classic',   description: 'Serif, timeless, ATS-safe',    accent: '#1a1a1a', preview: 'bg-white border-t-4 border-gray-900' },
    { id: 'modern',    name: 'Modern',    description: 'Two-column with sidebar',       accent: '#0ea5e9', preview: 'bg-white border-t-4 border-sky-500' },
    { id: 'minimal',   name: 'Minimal',   description: 'Clean, spacious, sans-serif',   accent: '#64748b', preview: 'bg-white border-t-4 border-slate-400' },
    { id: 'executive', name: 'Executive', description: 'Bold header, corporate look',   accent: '#1e3a5f', preview: 'bg-white border-t-4 border-blue-900' },
    { id: 'creative',  name: 'Creative',  description: 'Vibrant accents, modern flair', accent: '#7c3aed', preview: 'bg-white border-t-4 border-violet-600' },
];

interface ResumeData {
    personal: { fullName: string; email: string; phone: string; location: string; linkedin: string; github: string; portfolio: string; summary: string };
    skills: { languages: string[]; frameworks: string[]; tools: string[]; concepts: string[] };
    experience: any[];
    education: any[];
    projects: any[];
    certifications: any[];
    competitiveProgramming: string;
    achievements: string[];
}

interface InputData {
    photoPreview: string;
}

interface Props {
    template: TemplateId;
    resumeData: ResumeData;
    inputData: InputData;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const BulletList = ({ items }: { items: string[] }) => (
    <ul className="list-disc ml-5 space-y-0.5">
        {items.filter(Boolean).map((b, i) => <li key={i}>{b.replace(/^[•\-]\s*/, '')}</li>)}
    </ul>
);

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — CLASSIC
// ─────────────────────────────────────────────────────────────────────────────
export function ClassicTemplate({ resumeData, inputData }: { resumeData: ResumeData; inputData: InputData }) {
    const { personal, skills, experience, education, projects, certifications, competitiveProgramming, achievements } = resumeData;
    return (
        <div className="font-serif text-black text-[13px] leading-relaxed">
            {/* Header */}
            <header className="border-b-2 border-gray-900 pb-4 mb-5">
                <div className={`flex ${inputData.photoPreview ? 'items-center gap-5' : 'flex-col items-center'}`}>
                    {inputData.photoPreview && (
                        <img src={inputData.photoPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 shrink-0" />
                    )}
                    <div className="flex-1 text-center">
                        <h1 className="text-[26px] font-bold text-gray-900 uppercase tracking-wider mb-2">
                            {personal.fullName || 'Your Name'}
                        </h1>
                        <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 font-sans text-[12px] text-gray-600">
                            {personal.email && <span>{personal.email}</span>}
                            {personal.phone && <span>• {personal.phone}</span>}
                            {personal.location && <span>• {personal.location}</span>}
                            {personal.linkedin && <span>• {personal.linkedin}</span>}
                            {personal.github && <span>• {personal.github}</span>}
                            {personal.portfolio && <span>• {personal.portfolio}</span>}
                        </div>
                    </div>
                </div>
            </header>

            {personal.summary && (
                <section className="mb-4">
                    <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">Professional Summary</h2>
                    <p className="font-sans text-gray-700 text-justify">{personal.summary}</p>
                </section>
            )}

            {(skills.languages?.length > 0 || skills.frameworks?.length > 0 || skills.tools?.length > 0) && (
                <section className="mb-4">
                    <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">Technical Skills</h2>
                    <div className="font-sans space-y-0.5 text-gray-800">
                        {skills.languages?.length > 0 && <p><span className="font-bold">Languages:</span> {skills.languages.join(' • ')}</p>}
                        {skills.frameworks?.length > 0 && <p><span className="font-bold">Frameworks & Libraries:</span> {skills.frameworks.join(' • ')}</p>}
                        {skills.tools?.length > 0 && <p><span className="font-bold">Tools & Platforms:</span> {skills.tools.join(' • ')}</p>}
                        {skills.concepts?.length > 0 && <p><span className="font-bold">Concepts:</span> {skills.concepts.join(' • ')}</p>}
                    </div>
                </section>
            )}

            {experience.length > 0 && (
                <section className="mb-4">
                    <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">Experience</h2>
                    {experience.map((exp, i) => (
                        <div key={i} className="mb-3">
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-[14px]">{exp.role}</span>
                                <span className="font-sans text-[12px] text-gray-600">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}</span>
                            </div>
                            <p className="font-sans italic text-gray-700 mb-1">{exp.company}{exp.location ? ` | ${exp.location}` : ''}</p>
                            {Array.isArray(exp.bullets) && exp.bullets.filter(Boolean).length > 0
                                ? <BulletList items={exp.bullets} />
                                : exp.description ? <p className="font-sans text-gray-700">{exp.description}</p> : null}
                        </div>
                    ))}
                </section>
            )}

            {projects.length > 0 && (
                <section className="mb-4">
                    <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">Projects</h2>
                    {projects.map((proj, i) => (
                        <div key={i} className="mb-3">
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-[14px]">{proj.name}</span>
                                {proj.link && <span className="font-sans text-[11px] text-blue-700">{proj.link}</span>}
                            </div>
                            {Array.isArray(proj.bullets) && proj.bullets.filter(Boolean).length > 0
                                ? <BulletList items={proj.bullets} />
                                : proj.description ? <p className="font-sans text-gray-700">{proj.description}</p> : null}
                            {(proj.techStack?.length > 0 || proj.technologies?.length > 0) && (
                                <p className="font-sans text-gray-500 text-[11px] mt-0.5"><span className="font-bold">Tech:</span> {(proj.techStack || proj.technologies)?.join(', ')}</p>
                            )}
                        </div>
                    ))}
                </section>
            )}

            {education.length > 0 && (
                <section className="mb-4">
                    <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">Education</h2>
                    {education.map((edu, i) => (
                        <div key={i} className="mb-2">
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-[14px]">{edu.school}</span>
                                <span className="font-sans text-[12px] text-gray-600">{edu.year}</span>
                            </div>
                            <p className="font-sans text-gray-700">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}{edu.grade ? ` | ${edu.grade}` : ''}</p>
                        </div>
                    ))}
                </section>
            )}

            {(competitiveProgramming || achievements?.filter(Boolean).length > 0) && (
                <section className="mb-4">
                    <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">Achievements & Competitive Programming</h2>
                    {competitiveProgramming && <p className="font-sans text-gray-700 mb-2">{competitiveProgramming}</p>}
                    {achievements?.filter(Boolean).length > 0 && <BulletList items={achievements} />}
                </section>
            )}

            {certifications?.length > 0 && (
                <section className="mb-4">
                    <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-900 mb-2 pb-0.5">Certifications</h2>
                    <ul className="font-sans space-y-0.5 text-gray-700">
                        {certifications.map((cert, i) => (
                            <li key={i}><span className="font-bold">{cert.name}</span>{cert.issuer ? ` — ${cert.issuer}` : ''}{cert.date ? ` (${cert.date})` : ''}</li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — MODERN (two-column sidebar)
// ─────────────────────────────────────────────────────────────────────────────
export function ModernTemplate({ resumeData, inputData }: { resumeData: ResumeData; inputData: InputData }) {
    const { personal, skills, experience, education, projects, certifications, competitiveProgramming, achievements } = resumeData;
    const sidebarBg = '#0ea5e9';

    return (
        <div className="font-sans text-[12px] leading-relaxed flex min-h-full" style={{ minHeight: '297mm' }}>
            {/* LEFT SIDEBAR */}
            <div className="w-[34%] shrink-0 text-white p-6 flex flex-col gap-5" style={{ backgroundColor: sidebarBg }}>
                {/* Photo & Name */}
                <div className="flex flex-col items-center text-center gap-3">
                    {inputData.photoPreview
                        ? <img src={inputData.photoPreview} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white/30" />
                        : <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">{(personal.fullName || 'Y').charAt(0)}</div>}
                    <div>
                        <h1 className="text-[20px] font-bold uppercase tracking-wide leading-tight">{personal.fullName || 'Your Name'}</h1>
                    </div>
                </div>

                <hr className="border-white/30" />

                {/* Contact */}
                <div>
                    <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2 text-white/70">Contact</h2>
                    <div className="space-y-1 text-[11px] text-white/90">
                        {personal.email && <div>✉ {personal.email}</div>}
                        {personal.phone && <div>📞 {personal.phone}</div>}
                        {personal.location && <div>📍 {personal.location}</div>}
                        {personal.linkedin && <div>🔗 {personal.linkedin}</div>}
                        {personal.github && <div>💻 {personal.github}</div>}
                        {personal.portfolio && <div>🌐 {personal.portfolio}</div>}
                    </div>
                </div>

                {/* Skills */}
                {(skills.languages?.length > 0 || skills.frameworks?.length > 0 || skills.tools?.length > 0) && (
                    <div>
                        <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2 text-white/70">Skills</h2>
                        <div className="space-y-1.5">
                            {skills.languages?.length > 0 && (
                                <div>
                                    <p className="text-[10px] text-white/60 font-semibold uppercase mb-1">Languages</p>
                                    <div className="flex flex-wrap gap-1">
                                        {skills.languages.map((s, i) => <span key={i} className="px-2 py-0.5 bg-white/20 rounded text-[10px]">{s}</span>)}
                                    </div>
                                </div>
                            )}
                            {skills.frameworks?.length > 0 && (
                                <div>
                                    <p className="text-[10px] text-white/60 font-semibold uppercase mb-1">Frameworks</p>
                                    <div className="flex flex-wrap gap-1">
                                        {skills.frameworks.map((s, i) => <span key={i} className="px-2 py-0.5 bg-white/20 rounded text-[10px]">{s}</span>)}
                                    </div>
                                </div>
                            )}
                            {skills.tools?.length > 0 && (
                                <div>
                                    <p className="text-[10px] text-white/60 font-semibold uppercase mb-1">Tools</p>
                                    <div className="flex flex-wrap gap-1">
                                        {skills.tools.map((s, i) => <span key={i} className="px-2 py-0.5 bg-white/20 rounded text-[10px]">{s}</span>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Education in sidebar */}
                {education.length > 0 && (
                    <div>
                        <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2 text-white/70">Education</h2>
                        {education.map((edu, i) => (
                            <div key={i} className="mb-2">
                                <p className="font-bold text-[11px]">{edu.school}</p>
                                <p className="text-white/80 text-[10px]">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</p>
                                <p className="text-white/60 text-[10px]">{edu.year}{edu.grade ? ` | ${edu.grade}` : ''}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Certifications in sidebar */}
                {certifications?.length > 0 && (
                    <div>
                        <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2 text-white/70">Certifications</h2>
                        {certifications.map((cert, i) => (
                            <p key={i} className="text-[11px] mb-1"><span className="font-semibold">{cert.name}</span>{cert.date ? ` (${cert.date})` : ''}</p>
                        ))}
                    </div>
                )}
            </div>

            {/* RIGHT MAIN */}
            <div className="flex-1 p-6 bg-white">
                {personal.summary && (
                    <section className="mb-5">
                        <h2 className="text-[12px] font-bold uppercase tracking-widest mb-1 pb-1 border-b-2" style={{ borderColor: sidebarBg, color: sidebarBg }}>Profile</h2>
                        <p className="text-gray-700 text-justify mt-2">{personal.summary}</p>
                    </section>
                )}

                {experience.length > 0 && (
                    <section className="mb-5">
                        <h2 className="text-[12px] font-bold uppercase tracking-widest mb-3 pb-1 border-b-2" style={{ borderColor: sidebarBg, color: sidebarBg }}>Experience</h2>
                        {experience.map((exp, i) => (
                            <div key={i} className="mb-4">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-[13px] text-gray-900">{exp.role}</span>
                                    <span className="text-[11px] text-gray-500">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}</span>
                                </div>
                                <p className="italic text-gray-600 mb-1">{exp.company}{exp.location ? ` | ${exp.location}` : ''}</p>
                                {Array.isArray(exp.bullets) && exp.bullets.filter(Boolean).length > 0
                                    ? <ul className="list-disc ml-5 text-gray-700 space-y-0.5">{exp.bullets.filter(Boolean).map((b: string, idx: number) => <li key={idx}>{b.replace(/^[•\-]\s*/, '')}</li>)}</ul>
                                    : exp.description ? <p className="text-gray-700">{exp.description}</p> : null}
                            </div>
                        ))}
                    </section>
                )}

                {projects.length > 0 && (
                    <section className="mb-5">
                        <h2 className="text-[12px] font-bold uppercase tracking-widest mb-3 pb-1 border-b-2" style={{ borderColor: sidebarBg, color: sidebarBg }}>Projects</h2>
                        {projects.map((proj, i) => (
                            <div key={i} className="mb-3">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-[13px] text-gray-900">{proj.name}</span>
                                    {proj.link && <span className="text-[10px] text-blue-600">{proj.link}</span>}
                                </div>
                                {Array.isArray(proj.bullets) && proj.bullets.filter(Boolean).length > 0
                                    ? <ul className="list-disc ml-5 text-gray-700 space-y-0.5">{proj.bullets.filter(Boolean).map((b: string, idx: number) => <li key={idx}>{b.replace(/^[•\-]\s*/, '')}</li>)}</ul>
                                    : proj.description ? <p className="text-gray-700">{proj.description}</p> : null}
                                {(proj.techStack?.length > 0 || proj.technologies?.length > 0) && (
                                    <p className="text-gray-500 text-[11px] mt-0.5"><span className="font-bold">Stack:</span> {(proj.techStack || proj.technologies)?.join(', ')}</p>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {(competitiveProgramming || achievements?.filter(Boolean).length > 0) && (
                    <section className="mb-5">
                        <h2 className="text-[12px] font-bold uppercase tracking-widest mb-2 pb-1 border-b-2" style={{ borderColor: sidebarBg, color: sidebarBg }}>Achievements</h2>
                        {competitiveProgramming && <p className="text-gray-700 mb-1">{competitiveProgramming}</p>}
                        {achievements?.filter(Boolean).length > 0 && (
                            <ul className="list-disc ml-5 text-gray-700 space-y-0.5">{achievements.filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}</ul>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — MINIMAL
// ─────────────────────────────────────────────────────────────────────────────
export function MinimalTemplate({ resumeData, inputData }: { resumeData: ResumeData; inputData: InputData }) {
    const { personal, skills, experience, education, projects, certifications, competitiveProgramming, achievements } = resumeData;
    return (
        <div className="font-sans text-[13px] leading-relaxed text-gray-800">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-4">
                    {inputData.photoPreview && (
                        <img src={inputData.photoPreview} alt="Profile" className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <div>
                        <h1 className="text-[28px] font-light tracking-wide text-gray-900">{personal.fullName || 'Your Name'}</h1>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-500 mt-1">
                            {personal.email && <span>{personal.email}</span>}
                            {personal.phone && <span>{personal.phone}</span>}
                            {personal.location && <span>{personal.location}</span>}
                            {personal.github && <span>{personal.github}</span>}
                            {personal.linkedin && <span>{personal.linkedin}</span>}
                            {personal.portfolio && <span>{personal.portfolio}</span>}
                        </div>
                    </div>
                </div>
                {personal.summary && <p className="mt-4 text-gray-600 text-[12px] leading-relaxed border-l-2 border-slate-300 pl-3">{personal.summary}</p>}
            </div>

            {(skills.languages?.length > 0 || skills.frameworks?.length > 0) && (
                <section className="mb-5">
                    <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Skills</h2>
                    <div className="space-y-1 text-[12px]">
                        {skills.languages?.length > 0 && <p><span className="text-gray-500">Languages —</span> {skills.languages.join(', ')}</p>}
                        {skills.frameworks?.length > 0 && <p><span className="text-gray-500">Frameworks —</span> {skills.frameworks.join(', ')}</p>}
                        {skills.tools?.length > 0 && <p><span className="text-gray-500">Tools —</span> {skills.tools.join(', ')}</p>}
                        {skills.concepts?.length > 0 && <p><span className="text-gray-500">Concepts —</span> {skills.concepts.join(', ')}</p>}
                    </div>
                </section>
            )}

            {experience.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Experience</h2>
                    {experience.map((exp, i) => (
                        <div key={i} className="mb-4">
                            <div className="flex justify-between">
                                <p className="font-semibold text-gray-900">{exp.role} <span className="font-normal text-gray-600">— {exp.company}</span></p>
                                <span className="text-[11px] text-gray-400">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}</span>
                            </div>
                            <div className="mt-1 text-gray-600 text-[12px]">
                                {Array.isArray(exp.bullets) && exp.bullets.filter(Boolean).length > 0
                                    ? <ul className="list-none space-y-0.5">{exp.bullets.filter(Boolean).map((b: string, idx: number) => <li key={idx} className="before:content-['–'] before:mr-2 before:text-slate-400">{b.replace(/^[•\-]\s*/, '')}</li>)}</ul>
                                    : exp.description}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {projects.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Projects</h2>
                    {projects.map((proj, i) => (
                        <div key={i} className="mb-3">
                            <div className="flex justify-between">
                                <p className="font-semibold text-gray-900">{proj.name}</p>
                                {proj.link && <span className="text-[10px] text-blue-500">{proj.link}</span>}
                            </div>
                            <div className="mt-1 text-gray-600 text-[12px]">
                                {Array.isArray(proj.bullets) && proj.bullets.filter(Boolean).length > 0
                                    ? <ul className="list-none space-y-0.5">{proj.bullets.filter(Boolean).map((b: string, idx: number) => <li key={idx} className="before:content-['–'] before:mr-2 before:text-slate-400">{b.replace(/^[•\-]\s*/, '')}</li>)}</ul>
                                    : proj.description}
                            </div>
                            {(proj.techStack?.length > 0 || proj.technologies?.length > 0) && (
                                <p className="text-gray-400 text-[10px] mt-0.5">{(proj.techStack || proj.technologies)?.join(' · ')}</p>
                            )}
                        </div>
                    ))}
                </section>
            )}

            {education.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Education</h2>
                    {education.map((edu, i) => (
                        <div key={i} className="flex justify-between mb-1">
                            <div>
                                <p className="font-semibold text-gray-900">{edu.school}</p>
                                <p className="text-gray-600 text-[12px]">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}{edu.grade ? ` · ${edu.grade}` : ''}</p>
                            </div>
                            <span className="text-[11px] text-gray-400">{edu.year}</span>
                        </div>
                    ))}
                </section>
            )}

            {(competitiveProgramming || achievements?.filter(Boolean).length > 0 || certifications?.length > 0) && (
                <section className="mb-5">
                    <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Achievements</h2>
                    {competitiveProgramming && <p className="text-gray-600 text-[12px] mb-1">{competitiveProgramming}</p>}
                    {achievements?.filter(Boolean).map((a, i) => (
                        <p key={i} className="text-gray-600 text-[12px] before:content-['–'] before:mr-2 before:text-slate-400">{a}</p>
                    ))}
                    {certifications?.map((cert, i) => (
                        <p key={i} className="text-gray-600 text-[12px]"><span className="font-medium">{cert.name}</span>{cert.issuer ? ` — ${cert.issuer}` : ''}{cert.date ? ` (${cert.date})` : ''}</p>
                    ))}
                </section>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4 — EXECUTIVE
// ─────────────────────────────────────────────────────────────────────────────
export function ExecutiveTemplate({ resumeData, inputData }: { resumeData: ResumeData; inputData: InputData }) {
    const { personal, skills, experience, education, projects, certifications, competitiveProgramming, achievements } = resumeData;
    const headerBg = '#1e3a5f';

    return (
        <div className="font-sans text-[12.5px] leading-relaxed text-gray-800">
            {/* Bold header banner */}
            <div className="text-white mb-6" style={{ backgroundColor: headerBg, margin: '-15mm -20mm 20px -20mm', padding: '18px 20mm' }}>
                <div className="flex items-center gap-5">
                    {inputData.photoPreview && (
                        <img src={inputData.photoPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shrink-0" />
                    )}
                    <div className="flex-1">
                        <h1 className="text-[28px] font-bold tracking-wide">{personal.fullName || 'Your Name'}</h1>
                        <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-[11px] text-blue-100 mt-1">
                            {personal.email && <span>✉ {personal.email}</span>}
                            {personal.phone && <span>📞 {personal.phone}</span>}
                            {personal.location && <span>📍 {personal.location}</span>}
                            {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
                            {personal.github && <span>💻 {personal.github}</span>}
                            {personal.portfolio && <span>🌐 {personal.portfolio}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {personal.summary && (
                <section className="mb-5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest mb-2 pb-1" style={{ color: headerBg, borderBottom: `2px solid ${headerBg}` }}>Executive Summary</h2>
                    <p className="text-gray-700">{personal.summary}</p>
                </section>
            )}

            {(skills.languages?.length > 0 || skills.frameworks?.length > 0) && (
                <section className="mb-5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest mb-2 pb-1" style={{ color: headerBg, borderBottom: `2px solid ${headerBg}` }}>Core Competencies</h2>
                    <div className="grid grid-cols-2 gap-y-1 text-[12px]">
                        {skills.languages?.length > 0 && <p><span className="font-semibold text-gray-700">Languages:</span> {skills.languages.join(', ')}</p>}
                        {skills.frameworks?.length > 0 && <p><span className="font-semibold text-gray-700">Frameworks:</span> {skills.frameworks.join(', ')}</p>}
                        {skills.tools?.length > 0 && <p><span className="font-semibold text-gray-700">Tools:</span> {skills.tools.join(', ')}</p>}
                        {skills.concepts?.length > 0 && <p><span className="font-semibold text-gray-700">Concepts:</span> {skills.concepts.join(', ')}</p>}
                    </div>
                </section>
            )}

            {experience.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest mb-3 pb-1" style={{ color: headerBg, borderBottom: `2px solid ${headerBg}` }}>Professional Experience</h2>
                    {experience.map((exp, i) => (
                        <div key={i} className="mb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-[14px] text-gray-900">{exp.role}</p>
                                    <p className="font-semibold" style={{ color: headerBg }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                                </div>
                                <span className="text-[11px] text-gray-500 whitespace-nowrap">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}</span>
                            </div>
                            <div className="mt-1">
                                {Array.isArray(exp.bullets) && exp.bullets.filter(Boolean).length > 0
                                    ? <ul className="list-disc ml-5 text-gray-700 space-y-0.5">{exp.bullets.filter(Boolean).map((b: string, idx: number) => <li key={idx}>{b.replace(/^[•\-]\s*/, '')}</li>)}</ul>
                                    : exp.description ? <p className="text-gray-700">{exp.description}</p> : null}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {projects.length > 0 && (
                <section className="mb-5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest mb-3 pb-1" style={{ color: headerBg, borderBottom: `2px solid ${headerBg}` }}>Key Projects</h2>
                    {projects.map((proj, i) => (
                        <div key={i} className="mb-3">
                            <div className="flex justify-between">
                                <p className="font-bold text-gray-900">{proj.name}</p>
                                {proj.link && <span className="text-[10px] text-blue-700">{proj.link}</span>}
                            </div>
                            {Array.isArray(proj.bullets) && proj.bullets.filter(Boolean).length > 0
                                ? <ul className="list-disc ml-5 text-gray-700 space-y-0.5">{proj.bullets.filter(Boolean).map((b: string, idx: number) => <li key={idx}>{b.replace(/^[•\-]\s*/, '')}</li>)}</ul>
                                : proj.description ? <p className="text-gray-700">{proj.description}</p> : null}
                            {(proj.techStack?.length > 0 || proj.technologies?.length > 0) && (
                                <p className="text-gray-500 text-[11px] mt-0.5"><span className="font-semibold">Technologies:</span> {(proj.techStack || proj.technologies)?.join(', ')}</p>
                            )}
                        </div>
                    ))}
                </section>
            )}

            <div className="grid grid-cols-2 gap-6">
                {education.length > 0 && (
                    <section>
                        <h2 className="text-[12px] font-bold uppercase tracking-widest mb-2 pb-1" style={{ color: headerBg, borderBottom: `2px solid ${headerBg}` }}>Education</h2>
                        {education.map((edu, i) => (
                            <div key={i} className="mb-2">
                                <p className="font-bold">{edu.school}</p>
                                <p className="text-gray-600">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</p>
                                <p className="text-gray-500 text-[11px]">{edu.year}{edu.grade ? ` | ${edu.grade}` : ''}</p>
                            </div>
                        ))}
                    </section>
                )}

                <section>
                    {(competitiveProgramming || achievements?.filter(Boolean).length > 0) && (
                        <>
                            <h2 className="text-[12px] font-bold uppercase tracking-widest mb-2 pb-1" style={{ color: headerBg, borderBottom: `2px solid ${headerBg}` }}>Achievements</h2>
                            {competitiveProgramming && <p className="text-gray-700 mb-1">{competitiveProgramming}</p>}
                            {achievements?.filter(Boolean).map((a, i) => <p key={i} className="text-gray-700">• {a}</p>)}
                        </>
                    )}
                    {certifications?.length > 0 && (
                        <>
                            <h2 className="text-[12px] font-bold uppercase tracking-widest mt-3 mb-2 pb-1" style={{ color: headerBg, borderBottom: `2px solid ${headerBg}` }}>Certifications</h2>
                            {certifications.map((cert, i) => <p key={i} className="text-gray-700 text-[12px]"><span className="font-semibold">{cert.name}</span>{cert.date ? ` · ${cert.date}` : ''}</p>)}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 5 — CREATIVE
// ─────────────────────────────────────────────────────────────────────────────
export function CreativeTemplate({ resumeData, inputData }: { resumeData: ResumeData; inputData: InputData }) {
    const { personal, skills, experience, education, projects, certifications, competitiveProgramming, achievements } = resumeData;
    const accent = '#7c3aed';

    const SectionTitle = ({ children }: { children: React.ReactNode }) => (
        <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: accent }}>{children}</h2>
        </div>
    );

    return (
        <div className="font-sans text-[12.5px] leading-relaxed text-gray-800">
            {/* Header */}
            <div className="mb-6 pb-4" style={{ borderBottom: `3px solid ${accent}` }}>
                <div className="flex items-center gap-5">
                    {inputData.photoPreview && (
                        <img src={inputData.photoPreview} alt="Profile" className="w-24 h-24 rounded-2xl object-cover border-4 shrink-0" style={{ borderColor: accent }} />
                    )}
                    <div className="flex-1">
                        <h1 className="text-[30px] font-black tracking-tight" style={{ color: accent }}>{personal.fullName || 'Your Name'}</h1>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-500 mt-2">
                            {personal.email && <span className="flex items-center gap-1">✉ {personal.email}</span>}
                            {personal.phone && <span>📞 {personal.phone}</span>}
                            {personal.location && <span>📍 {personal.location}</span>}
                            {personal.github && <span>💻 {personal.github}</span>}
                            {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
                            {personal.portfolio && <span>🌐 {personal.portfolio}</span>}
                        </div>
                    </div>
                </div>
                {personal.summary && <p className="mt-4 text-gray-600 text-[12px]">{personal.summary}</p>}
            </div>

            {/* Skills as tags */}
            {(skills.languages?.length > 0 || skills.frameworks?.length > 0) && (
                <section className="mb-5">
                    <SectionTitle>Skills</SectionTitle>
                    <div className="space-y-2">
                        {skills.languages?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Lang:</span>
                                {skills.languages.map((s, i) => <span key={i} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: accent }}>{s}</span>)}
                            </div>
                        )}
                        {skills.frameworks?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Fw:</span>
                                {skills.frameworks.map((s, i) => <span key={i} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border" style={{ color: accent, borderColor: accent }}>{s}</span>)}
                            </div>
                        )}
                        {skills.tools?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Tools:</span>
                                {skills.tools.map((s, i) => <span key={i} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-gray-300 text-gray-600">{s}</span>)}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {experience.length > 0 && (
                <section className="mb-5">
                    <SectionTitle>Experience</SectionTitle>
                    {experience.map((exp, i) => (
                        <div key={i} className="mb-4 pl-4 border-l-2 border-purple-100">
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-[14px] text-gray-900">{exp.role}</span>
                                <span className="text-[11px] text-gray-400">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}</span>
                            </div>
                            <p className="font-semibold text-[12px] mb-1" style={{ color: accent }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                            {Array.isArray(exp.bullets) && exp.bullets.filter(Boolean).length > 0
                                ? <ul className="list-disc ml-5 text-gray-700 space-y-0.5">{exp.bullets.filter(Boolean).map((b: string, idx: number) => <li key={idx}>{b.replace(/^[•\-]\s*/, '')}</li>)}</ul>
                                : exp.description ? <p className="text-gray-700">{exp.description}</p> : null}
                        </div>
                    ))}
                </section>
            )}

            {projects.length > 0 && (
                <section className="mb-5">
                    <SectionTitle>Projects</SectionTitle>
                    <div className="grid grid-cols-1 gap-3">
                        {projects.map((proj, i) => (
                            <div key={i} className="p-3 rounded-xl border border-purple-100 bg-purple-50/40">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-bold text-[13px] text-gray-900">{proj.name}</span>
                                    {proj.link && <span className="text-[10px] text-blue-600">{proj.link}</span>}
                                </div>
                                {Array.isArray(proj.bullets) && proj.bullets.filter(Boolean).length > 0
                                    ? <ul className="list-disc ml-5 text-gray-700 space-y-0.5 text-[12px]">{proj.bullets.filter(Boolean).map((b: string, idx: number) => <li key={idx}>{b.replace(/^[•\-]\s*/, '')}</li>)}</ul>
                                    : proj.description ? <p className="text-gray-700 text-[12px]">{proj.description}</p> : null}
                                {(proj.techStack?.length > 0 || proj.technologies?.length > 0) && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {(proj.techStack || proj.technologies)?.map((t: string, ti: number) => (
                                            <span key={ti} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">{t}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-2 gap-6">
                {education.length > 0 && (
                    <section>
                        <SectionTitle>Education</SectionTitle>
                        {education.map((edu, i) => (
                            <div key={i} className="mb-2">
                                <p className="font-bold text-gray-900">{edu.school}</p>
                                <p className="text-gray-600">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</p>
                                <p className="text-gray-400 text-[11px]">{edu.year}{edu.grade ? ` · ${edu.grade}` : ''}</p>
                            </div>
                        ))}
                    </section>
                )}

                <section>
                    {(competitiveProgramming || achievements?.filter(Boolean).length > 0) && (
                        <>
                            <SectionTitle>Achievements</SectionTitle>
                            {competitiveProgramming && <p className="text-gray-700 mb-1 text-[12px]">{competitiveProgramming}</p>}
                            {achievements?.filter(Boolean).map((a, i) => (
                                <p key={i} className="text-gray-700 text-[12px] flex items-start gap-1"><span style={{ color: accent }}>▸</span>{a}</p>
                            ))}
                        </>
                    )}
                    {certifications?.length > 0 && (
                        <>
                            <SectionTitle>Certifications</SectionTitle>
                            {certifications.map((cert, i) => (
                                <p key={i} className="text-gray-700 text-[12px] mb-1"><span className="font-semibold">{cert.name}</span>{cert.date ? ` · ${cert.date}` : ''}</p>
                            ))}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — renders chosen template
// ─────────────────────────────────────────────────────────────────────────────
export function ResumeTemplate({ template, resumeData, inputData }: Props) {
    switch (template) {
        case 'modern':    return <ModernTemplate resumeData={resumeData} inputData={inputData} />;
        case 'minimal':   return <MinimalTemplate resumeData={resumeData} inputData={inputData} />;
        case 'executive': return <ExecutiveTemplate resumeData={resumeData} inputData={inputData} />;
        case 'creative':  return <CreativeTemplate resumeData={resumeData} inputData={inputData} />;
        default:          return <ClassicTemplate resumeData={resumeData} inputData={inputData} />;
    }
}
