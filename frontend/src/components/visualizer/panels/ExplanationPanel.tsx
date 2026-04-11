import { Info, Volume2, VolumeX } from 'lucide-react';

interface ExplanationPanelProps {
    title: string;
    description: string;
    stepIndex: number;
    totalSteps: number;
}

export function ExplanationPanel({ title, description, stepIndex, totalSteps }: ExplanationPanelProps) {
    return (
        <div className="flex flex-col bg-[#0f0f0f] border border-gray-800 rounded-xl overflow-hidden shadow-lg h-full relative group hover:border-[#00D9FF]/30 transition-colors">
            <div className="flex items-center justify-between px-4 py-3 bg-[#151515] border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#00D9FF]" />
                    <span className="text-sm font-bold text-gray-300">Explanation</span>
                </div>
                <div className="text-xs text-gray-500 font-bold bg-gray-800 px-2 py-1 rounded">
                    Step {stepIndex + 1} / {totalSteps}
                </div>
            </div>
            <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
                <h3 className="text-xl font-bold text-white mb-2">{title || "Waiting to start..."}</h3>
                <p className="text-gray-300 text-lg leading-relaxed">{description || "Click Play to begin visualization."}</p>
                
                {/* Visual flair */}
                <div className="mt-8 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-[#00D9FF] animate-pulse"></div>
                        Live Execution State
                    </div>
                </div>
            </div>
        </div>
    );
}
