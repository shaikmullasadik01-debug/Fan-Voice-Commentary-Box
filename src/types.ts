export interface MatchContext {
  sport: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
}

export interface CommentaryData {
  commentaryText: string;
  sentimentScore: number; // -100 to +100
  tensionIndex: number; // 0 to 100
  vocalInstructions: string;
  soundEffect: "roar" | "whistle" | "sigh" | "airhorn" | "gasp";
  transliteratedText?: string; // Transliterated romanized script for reading help
}

export interface LanguageOption {
  id: string;
  name: string;
  nativeName: string;
}

export interface MatchEvent {
  id: string;
  minute: number | string;
  text: string;
  // Store generated commentaries per persona
  commentaries: Record<string, CommentaryData>;
}

export interface PreloadedMatch {
  id: string;
  title: string;
  sport: string;
  teamA: string;
  teamB: string;
  initialEvents: { minute: number | string; text: string }[];
}

export interface CommentatorPersona {
  id: string;
  name: string;
  role: string;
  avatar: string; // Emoji avatar
  description: string;
  voiceSettings: {
    pitch: number;
    rate: number;
    voiceNameLang?: string; // Hint for web speech matching
  };
  colorClass: string; // Tailwind color accent
  bgClass: string;
  borderClass: string;
}
