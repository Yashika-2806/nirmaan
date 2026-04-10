// Voice narration templates and utilities

export interface NarrationText {
  english: string;
  hindi: string;
  hinglish: string;
}

export const NARRATION_TEMPLATES: Record<string, NarrationText> = {
  algorithm_start: {
    english: 'Starting algorithm execution. Watch the visualization as we step through the code.',
    hindi: 'एल्गोरिथम निष्पादन शुरू कर रहे हैं। जैसे-जैसे हम कोड के माध्यम से जाते हैं, विज़ुअलाइज़ेशन देखें।',
    hinglish: 'Algorithm execution shuru kar rahe hain. Jaise-jaise hum code ke madhya se jaate hain, visualization dekhen.',
  },
  comparing_elements: {
    english: 'Comparing elements at positions {pos1} and {pos2}.',
    hindi: '{pos1} और {pos2} स्थिति पर तत्वों की तुलना कर रहे हैं।',
    hinglish: '{pos1} aur {pos2} sthiti par tatvon ki tulna kar rahe hain.',
  },
  swap_operation: {
    english: 'Swapping elements {val1} and {val2}.',
    hindi: 'तत्वों {val1} और {val2} को स्वैप कर रहे हैं।',
    hinglish: 'Tatvon {val1} aur {val2} ko swap kar rahe hain.',
  },
  update_variable: {
    english: 'Updating variable {varName} to {value}.',
    hindi: 'चर {varName} को {value} में अपडेट कर रहे हैं।',
    hinglish: 'Var {varName} ko {value} mein update kar rahe hain.',
  },
  found_match: {
    english: 'Found a match! The condition is satisfied.',
    hindi: 'एक मेल मिल गया! शर्त पूरी हो गई है।',
    hinglish: 'Ek mel mil gaya! Shart puri ho gayi hai.',
  },
  algorithm_complete: {
    english: 'Algorithm execution complete. Let\'s review the final result.',
    hindi: 'एल्गोरिथम निष्पादन पूर्ण। आइए अंतिम परिणाम की समीक्षा करें।',
    hinglish: 'Algorithm execution purn. Aayie antim parinam ki samiksha karen.',
  },
  no_match_found: {
    english: 'No match found. The element is not in the array.',
    hindi: 'कोई मेल नहीं मिला। तत्व सरणी में नहीं है।',
    hinglish: 'Koi mel nahi mila. Tatva sarni mein nahi hai.',
  },
};

export function interpolateNarration(template: string, variables: Record<string, any>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
  });
  return result;
}

export function getNarrationText(key: string, language: 'english' | 'hindi' | 'hinglish' = 'english'): string {
  const template = NARRATION_TEMPLATES[key];
  if (!template) return '';
  return template[language];
}

// Voice generation configuration for future TTS integration
export interface VoiceConfig {
  language: 'english' | 'hindi' | 'hinglish';
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
}

export const DEFAULT_VOICE_CONFIGS: Record<string, VoiceConfig> = {
  english: {
    language: 'english',
    voiceId: 'en-US-Neural2-C', // Google Cloud TTS voice ID
    speed: 1.0,
    pitch: 0,
    volume: 1.0,
  },
  hindi: {
    language: 'hindi',
    voiceId: 'hi-IN-Neural2-A',
    speed: 1.0,
    pitch: 0,
    volume: 1.0,
  },
  hinglish: {
    language: 'hinglish',
    voiceId: 'hi-IN-Neural2-A', // Can use Hindi voice for Hinglish
    speed: 0.95,
    pitch: 0,
    volume: 1.0,
  },
};

/**
 * Web Speech API implementation for client-side voice narration
 * This works in modern browsers without backend API calls
 */
export class SimpleVoiceNarrator {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
    }
  }

  async speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): Promise<void> {
    if (!this.synth) {
      console.warn('Speech Synthesis not available in this browser');
      return;
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 1;
      utterance.pitch = options?.pitch ?? 1;
      utterance.volume = options?.volume ?? 1;

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        resolve();
      };

      this.isSpeaking = true;
      this.synth!.speak(utterance);
    });
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

// For future integration with advanced TTS services
export async function fetchNarrationAudio(text: string, language: string): Promise<string> {
  // This can be implemented later using:
  // - Google Cloud Text-to-Speech API
  // - Azure Cognitive Services
  // - AWS Polly
  // Returns URL to audio file
  console.log(`Fetching narration for: ${text} (${language})`);
  return '';
}
