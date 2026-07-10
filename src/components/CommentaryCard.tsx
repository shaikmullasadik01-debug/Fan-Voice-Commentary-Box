import { useState, useEffect, useRef } from "react";
import { CommentatorPersona, CommentaryData, MatchContext, LanguageOption } from "../types";
import { COMMENTATORS, INDIAN_CONSTITUTION_LANGUAGES } from "../data";
import { Play, Volume2, VolumeX, Sparkles, Radio, HelpCircle, AlertTriangle, Languages, ShieldCheck, CheckCircle, Zap, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CommentaryCardProps {
  activePersona: CommentatorPersona;
  onPersonaChange: (persona: CommentatorPersona) => void;
  commentary: CommentaryData | null;
  isLoading: boolean;
  matchContext: MatchContext;
  onNarrationTriggered: (text: string) => void;
  selectedLanguage: LanguageOption;
  onLanguageChange: (lang: LanguageOption) => void;
  eventText: string;
}

export default function CommentaryCard({
  activePersona,
  onPersonaChange,
  commentary,
  isLoading,
  matchContext,
  onNarrationTriggered,
  selectedLanguage,
  onLanguageChange,
  eventText,
}: CommentaryCardProps) {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAutoplayNarration, setIsAutoplayNarration] = useState(true);
  const [isElevenLabsMode, setIsElevenLabsMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // AI Quality and Alignment Testing State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Clear audit results whenever commentator, event, or language changes
  useEffect(() => {
    setAuditResult(null);
    setAuditError(null);
  }, [activePersona.id, eventText, selectedLanguage.id]);

  // Keep a reference to any active HTMLAudioElement or SpeechSynthesisUtterance
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);


  // Trigger speech synthesis when a new commentary arrives
  useEffect(() => {
    if (commentary && isAutoplayNarration && !isAudioMuted && !isLoading) {
      handleSpeak(commentary.commentaryText);
    }
  }, [commentary, isAutoplayNarration, isAudioMuted, isLoading]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleSpeak = async (text: string) => {
    stopSpeech();
    if (isAudioMuted) return;

    onNarrationTriggered(text); // Notify parent for wave animations

    if (isElevenLabsMode) {
      setTtsLoading(true);
      setTtsError(null);
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, personaId: activePersona.id }),
        });
        const data = await response.json();

        if (data.fallback) {
          console.log("ElevenLabs API fallback triggered:", data.message || data.error);
          // Fall back to Web Speech API
          playWebSpeech(text);
          if (data.error) {
            setTtsError("ElevenLabs key not configured. Falling back to Browser TTS.");
          }
        } else if (data.audio) {
          const audio = new Audio(data.audio);
          currentAudioRef.current = audio;
          setIsSpeaking(true);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = (e) => {
            console.error("Audio playback error:", e);
            setIsSpeaking(false);
            playWebSpeech(text); // Fallback on failure
          };
          await audio.play();
        }
      } catch (err: any) {
        console.error("Failed to generate ElevenLabs speech:", err);
        playWebSpeech(text);
      } finally {
        setTtsLoading(false);
      }
    } else {
      playWebSpeech(text);
    }
  };

  const playWebSpeech = (text: string) => {
    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis is not supported in this browser.");
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Highly tailored voice configuration based on commentators
      utterance.pitch = activePersona.voiceSettings.pitch;
      utterance.rate = activePersona.voiceSettings.rate;

      // Find an appropriate system voice match
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;

      if (activePersona.id === "grumpy") {
        // Look for British accent
        selectedVoice = voices.find(v => v.lang.startsWith("en-GB") && v.name.includes("Google"));
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith("en-GB"));
      } else if (activePersona.id === "poet") {
        // Look for melodic/natural voices or French accent if available (but English with romance is preferred)
        selectedVoice = voices.find(v => v.name.includes("Natural") || v.name.includes("Premium"));
      }

      if (!selectedVoice) {
        // General English voice
        selectedVoice = voices.find(v => v.lang.startsWith("en"));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error("Speech Synthesis error:", e);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Web Speech synthesis failed:", error);
      setIsSpeaking(false);
    }
  };

  // Helper to calculate the color and display text for the Sentiment Score (-100 to 100)
  const getSentimentDetails = (score: number) => {
    if (score > 60) return { label: "Pure Ecstasy", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (score > 15) return { label: "Optimistic/Hyped", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" };
    if (score >= -15) return { label: "Detached/Analytical", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20" };
    if (score >= -60) return { label: "Deep Sarcasm / Worry", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { label: "Profound Despair", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
  };

  const sentiment = commentary ? getSentimentDetails(commentary.sentimentScore) : null;

  return (
    <div id="commentary-box-card" className="bg-white dark:bg-zinc-900 dark:border-yellow-500 rounded-3xl p-6 md:p-8 text-black dark:text-white border-2 border-black card-shadow flex flex-col gap-6 relative overflow-hidden">
      {/* Subtle background glow matching the active persona */}
      <div className={`absolute -right-24 -top-24 w-48 h-48 rounded-full filter blur-[80px] opacity-10 transition-all duration-700 ${activePersona.bgClass}`} />

      {/* Broadcaster Selection Panel */}
      <div id="broadcasters-panel" className="relative z-10">
        <span className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest">
          Select Active Commentator
        </span>
        <div id="broadcaster-selector-grid" className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COMMENTATORS.map((persona) => {
            const isActive = persona.id === activePersona.id;
            return (
              <button
                key={persona.id}
                id={`persona-selector-${persona.id}`}
                onClick={() => {
                  stopSpeech();
                  onPersonaChange(persona);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-black dark:bg-yellow-500 text-white dark:text-black border-black dark:border-yellow-500 card-shadow"
                    : "bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-black dark:hover:text-white hover:border-gray-300 dark:hover:border-zinc-600"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0 ${isActive ? "bg-white/20" : "bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800"}`}>
                  {persona.avatar}
                </div>
                <div className="truncate">
                  <p className="text-xs font-black tracking-tight leading-none mb-1">
                    {persona.name}
                  </p>
                  <p className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-yellow-300 dark:text-black font-extrabold" : "text-gray-400"}`}>
                    {persona.role}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 22 Official Indian Languages Selector */}
      <div id="indian-languages-box" className="relative z-20 bg-yellow-500/5 p-4 rounded-2xl border-2 border-black/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Languages className="w-5 h-5 text-amber-500 stroke-[2.5]" />
          <div>
            <span className="text-[10px] font-black uppercase text-black block tracking-wider leading-none">
              Broadcasting Language
            </span>
            <span className="text-[9px] font-bold text-gray-400">
              Pick from 22 official Indian Constitution languages
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center justify-between gap-2.5 px-4 py-2 text-xs font-black bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            <span>{selectedLanguage.name} ({selectedLanguage.nativeName})</span>
            <span className="text-gray-400 text-[10px]">▼</span>
          </button>

          {showLanguageDropdown && (
            <div className="absolute right-0 mt-2 w-64 max-h-60 overflow-y-auto bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 p-1 divide-y divide-gray-100">
              {INDIAN_CONSTITUTION_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    onLanguageChange(lang);
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-yellow-50 transition-colors flex items-center justify-between ${
                    selectedLanguage.id === lang.id ? "bg-yellow-100/50 text-black font-black" : "text-gray-700"
                  }`}
                >
                  <span>{lang.name}</span>
                  <span className="text-[10px] opacity-60 font-mono">{lang.nativeName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Main Broadcast Commentary Output */}
      <div id="live-microphone-box" className="flex-1 flex flex-col gap-5 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Radio className={`w-4 h-4 ${isSpeaking ? "text-red-500 animate-pulse" : "text-gray-400"}`} />
            <span className="text-xs font-black uppercase text-gray-400 tracking-widest">
              Live Commentary Feed
            </span>
            {isSpeaking && (
              <span className="text-[9px] font-black bg-red-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider indicator-glow">
                ON AIR
              </span>
            )}
          </div>

          {/* Voice Synthesis Options */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Audio Toggle */}
            <button
              id="mute-unmute-btn"
              onClick={() => {
                if (isAudioMuted) {
                  setIsAudioMuted(false);
                } else {
                  stopSpeech();
                  setIsAudioMuted(true);
                }
              }}
              title={isAudioMuted ? "Unmute Voice" : "Mute Voice"}
              className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${
                isAudioMuted
                  ? "bg-gray-100 border-gray-200 text-gray-400 hover:text-gray-600"
                  : "bg-black border-black text-white hover:bg-gray-950"
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Auto Play toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAutoplayNarration}
                onChange={(e) => {
                  if (!e.target.checked) stopSpeech();
                  setIsAutoplayNarration(e.target.checked);
                }}
                className="rounded border-2 border-black text-black focus:ring-0 w-4 h-4 cursor-pointer"
              />
              Auto-Speak
            </label>

            {/* ElevenLabs Premium Toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isElevenLabsMode}
                onChange={(e) => {
                  stopSpeech();
                  setIsElevenLabsMode(e.target.checked);
                }}
                className="rounded border-2 border-black text-black focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className={`flex items-center gap-1 ${isElevenLabsMode ? "text-red-500 font-extrabold" : ""}`}>
                <Sparkles className="w-3.5 h-3.5" />
                ElevenLabs
              </span>
            </label>
          </div>
        </div>

        {/* TTS Loading/Error states */}
        {isElevenLabsMode && (ttsLoading || ttsError) && (
          <div className="text-xs border-2 border-black px-4 py-2.5 rounded-2xl flex items-center justify-between bg-yellow-50">
            {ttsLoading && (
              <span className="text-black font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Contacting ElevenLabs Synthesizer...
              </span>
            )}
            {ttsError && !ttsLoading && (
              <span className="text-red-600 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {ttsError}
              </span>
            )}
            {ttsError && (
              <button onClick={() => setTtsError(null)} className="text-gray-500 hover:text-black font-black uppercase text-[10px]">
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Commentary Speech Bubble */}
        <div id="commentary-bubble-wrapper" className="relative flex-1 flex flex-col justify-center py-2 min-h-[150px]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 text-gray-400"
              >
                {/* Simulated sound waves loading */}
                <div className="flex items-end gap-1.5 mb-4">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [12, 40, 12] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                      className={`w-1.5 rounded-full ${
                        activePersona.id === "hype"
                          ? "bg-red-500"
                          : activePersona.id === "grumpy"
                          ? "bg-orange-500"
                          : activePersona.id === "heartbroken"
                          ? "bg-pink-500"
                          : "bg-yellow-500"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-black uppercase tracking-wider text-black animate-pulse">
                  {activePersona.name} is drafting commentary...
                </p>
              </motion.div>
            ) : commentary ? (
              <motion.div
                key="commentary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex gap-4 items-start"
              >
                {/* Giant Speaker Avatar */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 border-black card-shadow relative ${activePersona.bgClass}`}>
                    {activePersona.avatar}
                    {isSpeaking && (
                      <span className="absolute -bottom-1.5 -right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-black"></span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-500 mt-2 tracking-wide truncate max-w-[80px]">
                    {activePersona.name.split(" ")[0]}
                  </span>
                </div>

                {/* Speech balloon */}
                <div className="flex-1 bg-gray-50 border-2 border-black rounded-3xl p-5 relative group">
                  {/* Decorative quote mark */}
                  <span className="absolute -left-2 top-5 w-4 h-4 bg-gray-50 border-l-2 border-b-2 border-black rotate-45" />

                  {/* Commentary text */}
                  <p id="commentary-display-text" className="text-xl md:text-2xl font-light italic leading-snug text-black pr-8 font-display">
                    "{commentary.commentaryText}"
                  </p>

                  {/* Phonetic Pronunciation helper for Indian Script translations */}
                  {commentary.transliteratedText && (
                    <div className="mt-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3.5 text-xs text-black/90 italic font-sans flex flex-col gap-0.5 relative overflow-hidden">
                      <span className="not-italic text-[9px] font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5 mb-1">
                        <Languages className="w-3.5 h-3.5 text-amber-600" /> Phonetic Pronunciation Helper ({selectedLanguage.name}):
                      </span>
                      "{commentary.transliteratedText}"
                    </div>
                  )}

                  {/* Audio trigger button in bubble */}
                  <button
                    id="manual-play-voice-btn"
                    onClick={() => handleSpeak(commentary.commentaryText)}
                    disabled={isSpeaking}
                    className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-black hover:bg-gray-200/50 rounded-xl transition-all cursor-pointer"
                    title="Speak commentary"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </button>

                  {/* Vocal Instructions display */}
                  <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-200 pt-3 font-mono">
                    <span className="flex items-center gap-1 font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-red-500" />
                      Vocal Delivery:
                    </span>
                    <span className="font-extrabold uppercase tracking-widest text-black">
                      {commentary.vocalInstructions}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                <span className="text-4xl mb-3">🏟️</span>
                <p className="text-sm font-bold text-black max-w-sm">
                  Stadium microphone is warm. Select a live match event on the timeline to generate dynamic commentary!
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Passion Sentiment Gauge & Match Tension indicator */}
        {commentary && sentiment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            id="passion-tension-meters"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
          >
            {/* Sentiment Meter (ecstasy / despair) */}
            <div className="bg-gray-50 border-2 border-black rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Commentator Passion Index
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-black/15 bg-white`}>
                  {sentiment.label}
                </span>
              </div>

              {/* Slider Meter */}
              <div className="relative h-3.5 w-full bg-gray-200 rounded-full my-3 overflow-hidden border border-black/10">
                {/* Red/Negative sentiment block */}
                <div className="absolute left-0 top-0 h-full w-1/2 bg-red-500/20" />
                {/* Green/Positive sentiment block */}
                <div className="absolute right-0 top-0 h-full w-1/2 bg-green-500/20" />
                {/* Midline separator */}
                <div className="absolute left-1/2 top-0 h-full w-[2px] bg-black z-10" />

                {/* Active Slider Fill from center */}
                {commentary.sentimentScore >= 0 ? (
                  <div
                    className="absolute left-1/2 top-0 h-full bg-green-500 transition-all duration-700"
                    style={{ width: `${(commentary.sentimentScore / 200) * 100}%` }}
                  />
                ) : (
                  <div
                    className="absolute top-0 h-full bg-red-500 transition-all duration-700"
                    style={{
                      left: `${50 - (Math.abs(commentary.sentimentScore) / 200) * 100}%`,
                      width: `${(Math.abs(commentary.sentimentScore) / 200) * 100}%`,
                    }}
                  />
                )}
              </div>

              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span className="uppercase tracking-wider">Grief (-100)</span>
                <span className={`font-black uppercase tracking-wider ${commentary.sentimentScore >= 0 ? "text-green-600" : "text-red-500"}`}>
                  Score: {commentary.sentimentScore > 0 ? `+${commentary.sentimentScore}` : commentary.sentimentScore}
                </span>
                <span className="uppercase tracking-wider">Ecstasy (+100)</span>
              </div>
            </div>

            {/* Match Tension Index Meter */}
            <div className="bg-gray-50 border-2 border-black rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Stadium Tension Level
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-white bg-black px-2.5 py-0.5 rounded-full indicator-glow">
                  {commentary.tensionIndex >= 80 ? "🔥 CLIMACTIC" : commentary.tensionIndex >= 40 ? "⚡ INTENSE" : "💤 CALM"}
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-3.5 w-full bg-gray-200 rounded-full my-3 overflow-hidden border border-black/10">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 via-pink-500 to-yellow-400 rounded-full transition-all duration-700"
                  style={{ width: `${commentary.tensionIndex}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span className="uppercase tracking-wider">Boring (0%)</span>
                <span className="font-black text-black uppercase tracking-wider">{commentary.tensionIndex}%</span>
                <span className="uppercase tracking-wider">Climactic (100%)</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI QUALITY & SECURITY EVALUATION SUITE */}
        {commentary && (
          <div id="ai-evaluation-suite-card" className="border-2 border-black rounded-3xl p-5 bg-stone-50/50 mt-2 flex flex-col gap-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-500 stroke-[2.5]" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">
                    AI Competition Quality & Safety Audit
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold leading-tight">
                    Dual-gate validator checks alignment, safety, and acoustic scores to reach 100% rigor
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  if (!commentary) return;
                  setIsAuditing(true);
                  setAuditError(null);
                  setAuditResult(null);
                  try {
                    const response = await fetch("/api/evaluate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        commentaryText: commentary.commentaryText,
                        transliteratedText: commentary.transliteratedText || "",
                        personaId: activePersona.id,
                        matchContext,
                        eventText,
                        language: selectedLanguage.name,
                      }),
                    });
                    if (!response.ok) throw new Error(`Audit failed (HTTP ${response.status})`);
                    const data = await response.json();
                    if (data.error) throw new Error(data.error);
                    setAuditResult(data);
                  } catch (err: any) {
                    setAuditError(err.message || "Failed to trigger automated evaluation.");
                  } finally {
                    setIsAuditing(false);
                  }
                }}
                disabled={isAuditing}
                className={`px-4 py-2.5 text-xs font-black rounded-xl border-2 border-black transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                  isAuditing ? "bg-gray-100 text-gray-400" : "bg-red-400 hover:bg-red-500 text-black"
                }`}
              >
                {isAuditing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Running Strict Audits...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Test & Audit Commentary
                  </>
                )}
              </button>
            </div>

            {auditError && (
              <div className="text-xs font-bold text-red-600 border border-red-200 bg-red-50/50 p-3 rounded-xl flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{auditError}</span>
              </div>
            )}

            {/* Audit Scorecard Dashboard */}
            <AnimatePresence>
              {auditResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 border-t border-black/10 pt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Radial Meter / Left Column */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center p-3 border-2 border-black bg-white rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider mb-2">Composite Score</span>
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="34" className="stroke-gray-100" strokeWidth="6" fill="transparent" />
                          <circle cx="40" cy="40" r="34" className="stroke-red-500" strokeWidth="6" fill="transparent"
                                  strokeDasharray={`${2 * Math.PI * 34}`}
                                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - auditResult.compositeScore / 100)}`} />
                        </svg>
                        <span className="absolute text-xl font-black font-mono">{auditResult.compositeScore}%</span>
                      </div>
                      <span className="mt-2 text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2.5 py-0.5 rounded-full">
                        {auditResult.verdict}
                      </span>
                    </div>

                    {/* Metric Bars / Right Column */}
                    <div className="md:col-span-8 grid grid-cols-1 gap-2 bg-white/70 border border-black/10 p-3 rounded-2xl">
                      {[
                        { label: "Style Alignment", val: auditResult.scores.personaAlignment },
                        { label: "Linguistic Accuracy", val: auditResult.scores.languageIntegrity },
                        { label: "Security & Safety Guard", val: auditResult.scores.securitySafety },
                        { label: "Emotional Vibe", val: auditResult.scores.energyExcitement },
                        { label: "Vocal Flow Efficiency", val: auditResult.scores.acousticFlow }
                      ].map((m, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[9px] font-black uppercase text-gray-500">
                            <span>{m.label}</span>
                            <span>{m.val}/100</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-black/5">
                            <div className="h-full bg-red-400 transition-all duration-500" style={{ width: `${m.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Audit Reports */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white border border-black/15 p-3.5 rounded-2xl flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase text-red-500 tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Linguistic & Safety Audit Report
                      </span>
                      <p className="text-xs text-black/85 leading-relaxed font-medium">
                        {auditResult.report}
                      </p>
                    </div>

                    <div className="bg-yellow-50/50 border border-yellow-300 p-3.5 rounded-2xl flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" /> Competition Recommendations
                      </span>
                      <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                        {auditResult.recommendations}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
