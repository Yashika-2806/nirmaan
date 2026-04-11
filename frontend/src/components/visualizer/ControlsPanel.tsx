import { Play, Pause, SkipBack, SkipForward, RotateCcw, Volume2, VolumeX, FastForward } from 'lucide-react';

interface ControlsPanelProps {
    isPlaying: boolean;
    speed: number;
    onPlayPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onReset: () => void;
    onSpeedChange: (speed: number) => void;
    isNarrationEnabled: boolean;
    onToggleNarration: () => void;
    language: 'en' | 'hi' | 'hinglish';
    onLanguageChange: (lang: 'en' | 'hi' | 'hinglish') => void;
    supportedLanguages: string[];
}

export function ControlsPanel({
    isPlaying, speed, onPlayPause, onNext, onPrev, onReset, onSpeedChange,
    isNarrationEnabled, onToggleNarration, language, onLanguageChange, supportedLanguages
}: ControlsPanelProps) {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-[#111111] border-t border-gray-800">
            {/* Speed & Narration */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-1.5 border border-gray-800">
                    <button 
                        onClick={onToggleNarration}
                        className={`p-2 rounded transition-colors ${isNarrationEnabled ? 'bg-[#00D9FF]/20 text-[#00D9FF]' : 'text-gray-500 hover:text-white'}`}
                        title={isNarrationEnabled ? "Disable Narration" : "Enable Narration"}
                    >
                        {isNarrationEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    <select
                        title="Narration Language"
                        aria-label="Narration Language"
                        className="bg-transparent text-sm text-gray-300 outline-none pr-2"
                        value={language}
                        onChange={(e) => onLanguageChange(e.target.value as any)}
                        disabled={!isNarrationEnabled}
                    >
                        <option value="en">English</option>
                        {supportedLanguages.includes('hi') && <option value="hi">Hindi</option>}
                        {supportedLanguages.includes('hinglish') && <option value="hinglish">Hinglish</option>}
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <FastForward className="w-4 h-4 text-gray-500" />
                    <input
                        title="Playback speed"
                        aria-label="Playback speed"
                        type="range" min="0.5" max="3" step="0.5" value={speed}
                        onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                        className="w-24 accent-[#00D9FF]"
                    />
                    <span className="text-xs text-gray-500 font-bold w-6">{speed}x</span>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3">
                <button onClick={onReset} className="p-3 text-gray-400 hover:bg-white/5 rounded-full transition-colors" title="Reset">
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button onClick={onPrev} className="p-3 text-gray-400 hover:bg-white/5 rounded-full transition-colors" title="Previous Step">
                    <SkipBack className="w-5 h-5" />
                </button>
                <button 
                    onClick={onPlayPause}
                    className={`p-4 rounded-full flex items-center justify-center transition-all shadow-lg ${isPlaying ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-[#00D9FF] text-black hover:bg-[#00D9FF]/90 shadow-[#00D9FF]/20'}`}
                >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
                <button onClick={onNext} className="p-3 text-gray-400 hover:bg-white/5 rounded-full transition-colors" title="Next Step">
                    <SkipForward className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
