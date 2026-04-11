import { useState, useEffect, useRef, useCallback } from 'react';

export function useNarration() {
    const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
    const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    const speak = useCallback((texts: { en: string; hi: string; hinglish: string }): Promise<void> => {
        return new Promise((resolve) => {
            if (!isNarrationEnabled || !synthRef.current) {
                resolve();
                return;
            }
            
            // Cancel any ongoing speech
            synthRef.current.cancel();

            const textToSpeak = texts[language];
            if (!textToSpeak) {
                resolve();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            
            // Pick appropriate premium voice if possible
            const voices = synthRef.current.getVoices();
            
            if (language === 'hi') {
                // Try to find a premium Hindi voice
                const hindiVoice = voices.find(v => v.lang === 'hi-IN' && (v.name.includes('Neural') || v.name.includes('Google'))) 
                    || voices.find(v => v.lang.includes('hi'));
                if (hindiVoice) utterance.voice = hindiVoice;
            } else if (language === 'hinglish') {
                // For Hinglish (Latin scripts), Indian English voices do the best job
                const indianEnglishVoice = voices.find(v => v.lang === 'en-IN' && (v.name.includes('Neural') || v.name.includes('Google')))
                    || voices.find(v => v.lang === 'en-IN');
                if (indianEnglishVoice) utterance.voice = indianEnglishVoice;
            } else {
                // English Default
                const englishVoice = voices.find(v => (v.lang === 'en-US' || v.lang === 'en-GB') && (v.name.includes('Neural') || v.name.includes('Google')))
                    || voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB'));
                if (englishVoice) utterance.voice = englishVoice;
            }

            utterance.onend = () => {
                resolve();
            };
            utterance.onerror = () => {
                resolve();
            };

            synthRef.current.speak(utterance);
        });
    }, [isNarrationEnabled, language]);

    const stop = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.cancel();
        }
    }, []);

    return {
        language,
        setLanguage,
        isNarrationEnabled,
        setIsNarrationEnabled,
        speak,
        stop
    };
}
