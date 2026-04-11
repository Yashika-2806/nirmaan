import { Code } from 'lucide-react';

interface CodePanelProps {
    code: string;
    activeLines: number[];
}

export function CodePanel({ code, activeLines }: CodePanelProps) {
    const lines = code.split('\n');

    return (
        <div className="flex flex-col bg-[#0f0f0f] border border-gray-800 rounded-xl overflow-hidden h-full">
            <div className="flex items-center justify-between px-4 py-3 bg-[#151515] border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-[#00D9FF]" />
                    <span className="text-sm font-bold text-gray-300">Source Code</span>
                </div>
            </div>
            <div className="flex-1 overflow-auto bg-[#0a0a0a] p-4 font-mono text-sm leading-relaxed text-gray-300">
                {lines.map((line, i) => {
                    const lineNumber = i + 1;
                    const isActive = activeLines.includes(lineNumber);
                    return (
                        <div 
                            key={i} 
                            className={`flex transition-colors duration-200 ${isActive ? 'bg-[#00D9FF]/20 text-white rounded' : 'hover:bg-white/5'}`}
                        >
                            <span className={`w-8 text-right pr-4 select-none ${isActive ? 'text-[#00D9FF] font-bold' : 'text-gray-600'}`}>
                                {lineNumber}
                            </span>
                            <span className="whitespace-pre">{line}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
