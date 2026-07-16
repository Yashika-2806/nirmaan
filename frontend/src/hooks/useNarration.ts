import { useState, useEffect, useRef, useCallback } from 'react';

export function useNarration() {
    const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
    const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentTextRef = useRef<string>('');
    const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    const stop = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        activeUtteranceRef.current = null;
        currentTextRef.current = '';
    }, []);

    const speak = useCallback((texts: { en: string; hi: string; hinglish: string }, rate: number = 1.0): Promise<void> => {
        return new Promise(async (resolve) => {
            if (!isNarrationEnabled) {
                resolve();
                return;
            }
            
            const textToSpeak = texts[language];
            if (!textToSpeak) {
                resolve();
                return;
            }

            // Set current text request
            currentTextRef.current = textToSpeak;

            // Cancel any ongoing speech or audio
            stop();
            
            // Restore current text request after stop clears it
            currentTextRef.current = textToSpeak;

            // 1. Try Sarvam AI Text to Speech (requires SARVAM_API_KEY in backend .env)
            try {
                const { aiService } = await import('@/services/aiService');
                const result = await aiService.generateSpeech(textToSpeak, language, rate);
                
                // If user changed step during the fetch, discard this result
                if (currentTextRef.current !== textToSpeak) {
                    resolve();
                    return;
                }
                
                if (result.success && result.audioBase64) {
                    const audio = new Audio("data:audio/mp3;base64," + result.audioBase64);
                    audioRef.current = audio;
                    
                    audio.onended = () => {
                        resolve();
                    };
                    audio.onerror = () => {
                        resolve();
                    };
                    
                    await audio.play();
                    return; // Success, audio played via Sarvam AI
                }
            } catch (err) {
                console.warn("Sarvam AI TTS API failed, falling back to native SpeechSynthesis:", err);
            }

            // If user changed step during the fallback check, discard
            if (currentTextRef.current !== textToSpeak) {
                resolve();
                return;
            }

            // 2. Fallback to Browser native speech synthesis
            if (!synthRef.current) {
                resolve();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            activeUtteranceRef.current = utterance; // Retain a strong reference to prevent GC bugs

            // Set speaking rate (0.5 to 2.0 based on visualizer speed)
            utterance.rate = rate;
            
            // Pick appropriate premium voice if possible
            const voices = synthRef.current.getVoices();
            
            if (language === 'hi') {
                const hindiVoice = voices.find(v => v.lang === 'hi-IN' && (v.name.includes('Neural') || v.name.includes('Google'))) 
                    || voices.find(v => v.lang.includes('hi'));
                if (hindiVoice) utterance.voice = hindiVoice;
            } else if (language === 'hinglish') {
                const indianEnglishVoice = voices.find(v => v.lang === 'en-IN' && (v.name.includes('Neural') || v.name.includes('Google')))
                    || voices.find(v => v.lang === 'en-IN');
                if (indianEnglishVoice) utterance.voice = indianEnglishVoice;
            } else {
                const englishVoice = voices.find(v => (v.lang === 'en-US' || v.lang === 'en-GB') && (v.name.includes('Neural') || v.name.includes('Google')))
                    || voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB'));
                if (englishVoice) utterance.voice = englishVoice;
            }

            utterance.onend = () => {
                activeUtteranceRef.current = null;
                resolve();
            };
            utterance.onerror = () => {
                activeUtteranceRef.current = null;
                resolve();
            };

            synthRef.current.speak(utterance);
        });
    }, [isNarrationEnabled, language, stop]);

    return {
        language,
        setLanguage,
        isNarrationEnabled,
        setIsNarrationEnabled,
        speak,
        stop
    };
}
