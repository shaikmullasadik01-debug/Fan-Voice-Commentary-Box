import { useState, useEffect, useCallback } from "react";
import { MatchEvent, PreloadedMatch, CommentatorPersona, CommentaryData, MatchContext, LanguageOption } from "./types";
import { PRELOADED_MATCHES, COMMENTATORS, INDIAN_CONSTITUTION_LANGUAGES } from "./data";
import { audioSynth } from "./utils/audioSynth";
import CommentaryCard from "./components/CommentaryCard";
import TimelineView from "./components/TimelineView";
import DashboardCharts from "./components/DashboardCharts";
import Soundboard from "./components/Soundboard";
import TacticalWallpaper from "./components/TacticalWallpaper";
import { Mic, Trophy, Info, Sparkles, Flame, Plus, Minus, Server, HelpCircle, FileText, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // 1. Core State
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(INDIAN_CONSTITUTION_LANGUAGES[0]);
  const [activeMatch, setActiveMatch] = useState<PreloadedMatch>(PRELOADED_MATCHES[0]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activePersona, setActivePersona] = useState<CommentatorPersona>(COMMENTATORS[0]);
  const [matchContext, setMatchContext] = useState<MatchContext>({
    sport: "Football",
    teamA: "Argentina",
    teamB: "France",
    scoreA: 2,
    scoreB: 2,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeCommentary, setActiveCommentary] = useState<CommentaryData | null>(null);
  const [isWaveActive, setIsWaveActive] = useState(false);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  // 2. Initialize Match Events
  useEffect(() => {
    initializeMatch(activeMatch);
  }, [activeMatch]);

  const initializeMatch = (match: PreloadedMatch) => {
    // Construct match events from preloaded list
    const initialEvents: MatchEvent[] = match.initialEvents.map((evt, idx) => ({
      id: `${match.id}-event-${idx}`,
      minute: evt.minute,
      text: evt.text,
      commentaries: {},
    }));
    setEvents(initialEvents);

    // Default scoreboard parsing
    let scoreA = 0;
    let scoreB = 0;
    if (match.id === "wc2022") {
      scoreA = 3;
      scoreB = 3;
    } else if (match.id === "cl1999") {
      scoreA = 2;
      scoreB = 1;
    } else if (match.id === "wc1986") {
      scoreA = 2;
      scoreB = 1;
    } else if (match.id === "wc2014") {
      scoreA = 0;
      scoreB = 5;
    }

    setMatchContext({
      sport: match.sport,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA,
      scoreB,
    });

    // Select the last event to kickstart the commentary
    if (initialEvents.length > 0) {
      setActiveEventId(initialEvents[initialEvents.length - 1].id);
    } else {
      setActiveEventId(null);
    }
  };

  // 3. Fetch Commentary from Express Backend
  const fetchCommentary = async (eventId: string, personaId: string, langId: string, langName: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    setIsLoading(true);
    setSystemAlert(null);
    try {
      const response = await fetch("/api/commentary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchContext,
          eventText: event.text,
          personaId,
          language: langName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setSystemAlert(data.error);
        return;
      }

      // Store generated commentary in the event item list keyed by persona + language
      const cacheKey = `${personaId}_${langId}`;
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === eventId) {
            return {
              ...e,
              commentaries: {
                ...e.commentaries,
                [cacheKey]: data,
              },
            };
          }
          return e;
        })
      );

      // Auto-trigger the physical synthesized soundboard if Gemini suggests one
      if (data.soundEffect) {
        audioSynth.trigger(data.soundEffect);
      }
    } catch (err: any) {
      console.error("Error fetching commentary:", err);
      setSystemAlert("Failed to connect to the Gemini server. Please make sure your dev server is running and the API key is active.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Update Commentary State when Event, Commentator, or Language changes
  useEffect(() => {
    if (activeEventId) {
      const event = events.find((e) => e.id === activeEventId);
      if (event) {
        const cacheKey = `${activePersona.id}_${selectedLanguage.id}`;
        const existingCommentary = event.commentaries[cacheKey];
        if (existingCommentary) {
          setActiveCommentary(existingCommentary);
        } else {
          // If no commentary generated yet for this persona-event-language combination, fetch it
          setActiveCommentary(null);
          fetchCommentary(activeEventId, activePersona.id, selectedLanguage.id, selectedLanguage.name);
        }
      }
    } else {
      setActiveCommentary(null);
    }
  }, [activeEventId, activePersona.id, selectedLanguage.id, events]);

  // 5. Appending a new Play-by-Play event (Manual or Autoplay)
  const handleEventAdd = (minute: number | string, text: string) => {
    const newId = `custom-event-${Date.now()}`;
    const newEvent: MatchEvent = {
      id: newId,
      minute,
      text,
      commentaries: {},
    };

    setEvents((prev) => [...prev, newEvent]);
    setActiveEventId(newId);

    // Scan text to see if a goal was scored to help auto-adjust score
    const goalText = text.toUpperCase();
    if (goalText.includes("GOAL") || goalText.includes("GOOO") || goalText.includes("SCORES")) {
      // Play crowd roar
      audioSynth.trigger("roar");
      
      // Attempt to guess who scored
      const teamAName = matchContext.teamA.toUpperCase();
      const teamBName = matchContext.teamB.toUpperCase();
      if (goalText.includes(teamAName) && !goalText.includes(teamBName)) {
        setMatchContext((prev) => ({ ...prev, scoreA: prev.scoreA + 1 }));
      } else if (goalText.includes(teamBName) && !goalText.includes(teamAName)) {
        setMatchContext((prev) => ({ ...prev, scoreB: prev.scoreB + 1 }));
      }
    } else {
      // Play a quick whistle for normal game action
      audioSynth.trigger("whistle");
    }
  };

  // Sound ripple animation trigger
  const handleNarrationTriggered = (text: string) => {
    setIsWaveActive(true);
    // Pulse off after 3.5 seconds
    setTimeout(() => {
      setIsWaveActive(false);
    }, 4000);
  };

  return (
    <div className={`min-h-screen relative font-sans transition-colors duration-500 selection:bg-yellow-300 selection:text-black ${
      theme === "dark" ? "bg-zinc-950 text-white dark" : "bg-[#FFFCEF] text-black"
    }`}>
      {/* 0. Live Tactical Wallpaper Background */}
      <TacticalWallpaper isWaveActive={isWaveActive} theme={theme} />
      
      {/* 1. Header Banner */}
      <header className="border-b-4 border-black bg-white dark:bg-zinc-900 dark:border-yellow-500 sticky top-0 z-30 px-6 py-4 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-black border-2 border-black dark:border-yellow-500 flex items-center justify-center shadow-lg relative card-shadow">
              <Mic className="w-6 h-6 text-yellow-300 stroke-[2.5]" />
              {isWaveActive && (
                <span className="absolute inset-0 rounded-2xl bg-yellow-300 animate-ping opacity-45" />
              )}
            </div>
            <div>
              <h1 className="font-display font-black text-lg md:text-xl tracking-tight text-black dark:text-white flex items-center gap-2">
                Fan-Voice Commentary Box 🎙️
              </h1>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-black/60 dark:text-white/60">
                Live Sports Commentator Personas Powered by Google Gemini AI
              </p>
            </div>
          </div>

          {/* Interactive Tools: Scoreboard + Theme Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Interactive Score Board Editor */}
            <div className="flex items-center gap-3.5 bg-white dark:bg-zinc-900 border-2 border-black dark:border-yellow-500 rounded-2xl px-4 py-2 card-shadow">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-500 stroke-[2.5]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Scoreboard:</span>
              </div>
              
              {/* Team A */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-black dark:text-white truncate max-w-[80px]">{matchContext.teamA}</span>
                <button
                  onClick={() => setMatchContext(p => ({ ...p, scoreA: Math.max(0, p.scoreA - 1) }))}
                  className="w-5 h-5 rounded-lg bg-black dark:bg-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-[10px] text-white cursor-pointer border border-black dark:border-zinc-700"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>
                <span className="text-sm font-mono font-black text-black dark:text-white px-1">{matchContext.scoreA}</span>
                <button
                  onClick={() => setMatchContext(p => ({ ...p, scoreA: p.scoreA + 1 }))}
                  className="w-5 h-5 rounded-lg bg-black dark:bg-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-[10px] text-white cursor-pointer border border-black dark:border-zinc-700"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>

              <span className="text-black dark:text-white font-black">-</span>

              {/* Team B */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMatchContext(p => ({ ...p, scoreB: Math.max(0, p.scoreB - 1) }))}
                  className="w-5 h-5 rounded-lg bg-black dark:bg-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-[10px] text-white cursor-pointer border border-black dark:border-zinc-700"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>
                <span className="text-sm font-mono font-black text-black dark:text-white px-1">{matchContext.scoreB}</span>
                <button
                  onClick={() => setMatchContext(p => ({ ...p, scoreB: p.scoreB + 1 }))}
                  className="w-5 h-5 rounded-lg bg-black dark:bg-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-[10px] text-white cursor-pointer border border-black dark:border-zinc-700"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>
                <span className="text-xs font-black text-black dark:text-white truncate max-w-[80px]">{matchContext.teamB}</span>
              </div>
            </div>

            {/* Light/Dark Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`p-2.5 rounded-2xl border-2 border-black dark:border-yellow-500 transition-all cursor-pointer card-shadow flex items-center justify-center ${
                theme === "dark" ? "bg-zinc-900 text-yellow-400 hover:text-yellow-300" : "bg-white text-black hover:bg-gray-50"
              }`}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon className="w-5 h-5 stroke-[2.5]" /> : <Sun className="w-5 h-5 stroke-[2.5]" />}
            </button>
          </div>
          
        </div>
      </header>

      {/* 2. Main Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Alerts / Configuration errors */}
        <AnimatePresence>
          {systemAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="system-alert-banner"
              className="bg-amber-100 border-2 border-black text-black rounded-3xl p-5 flex gap-3 items-start card-shadow"
            >
              <Info className="w-5 h-5 text-black shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-black uppercase tracking-widest text-[10px] text-amber-600 mb-1">
                  API Key Notice
                </p>
                <p className="leading-relaxed font-bold">
                  {systemAlert}
                </p>
                <p className="mt-2 text-gray-600 font-medium">
                  You can set your <code className="bg-white border border-black/10 px-1.5 py-0.5 rounded text-[10px] text-black font-mono font-black">GEMINI_API_KEY</code> and optional <code className="bg-white border border-black/10 px-1.5 py-0.5 rounded text-[10px] text-black font-mono font-black">ELEVENLABS_API_KEY</code> in the **Settings &gt; Secrets** panel in AI Studio.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Split View: Commentary vs Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Commentary Box + Soundboard) - 7 cols */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <CommentaryCard
              activePersona={activePersona}
              onPersonaChange={setActivePersona}
              commentary={activeCommentary}
              isLoading={isLoading}
              matchContext={matchContext}
              onNarrationTriggered={handleNarrationTriggered}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              eventText={events.find((e) => e.id === activeEventId)?.text || ""}
            />

            <Soundboard />
          </div>

          {/* Right Column (Live Timeline Feed) - 5 cols */}
          <div className="lg:col-span-5 h-full">
            <TimelineView
              events={events}
              activeEventId={activeEventId}
              onEventSelect={setActiveEventId}
              onEventAdd={handleEventAdd}
              onMatchChange={setActiveMatch}
              activeMatch={activeMatch}
              matchContext={matchContext}
              onScoreChange={(scoreA, scoreB) => setMatchContext((p) => ({ ...p, scoreA, scoreB }))}
              activePersonaId={activePersona.id}
            />
          </div>

        </div>

        {/* Bottom Section: Real-Time Charts & Analytics */}
        <DashboardCharts events={events} activePersona={activePersona} />

        {/* Submission Details & Concept Guide */}
        <section className="bg-white dark:bg-zinc-900 dark:border-yellow-500 border-2 border-black rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-start card-shadow">
          <div className="w-12 h-12 rounded-2xl bg-black border-2 border-black dark:border-yellow-500 text-yellow-300 flex items-center justify-center shrink-0 card-shadow">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-xs font-black tracking-widest text-gray-400 dark:text-zinc-500 uppercase font-display">
              Submission Tech Stack & Passion Concept
            </h4>
            <p className="text-xs text-black dark:text-zinc-300 font-semibold leading-relaxed">
              This app is a custom-crafted submission celebrating the high-octane energy of sports broadcasting and soccer fandom. It qualifies for the <strong>ElevenLabs + Google AI</strong> prize categories by integrating the <strong>@google/genai</strong> SDK server-side (utilizing the rapid reasoning of <code>gemini-3.5-flash</code> with strict JSON schemas) to output structured multi-dimensional commentaries alongside a dual-layer vocal engine (bridging browser SpeechSynthesis for instant local execution with a secure proxy endpoint for high-fidelity <strong>ElevenLabs TTS</strong>).
            </p>
            <div className="flex flex-wrap gap-2 pt-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-yellow-300 border-2 border-black text-black px-2.5 py-1 rounded-full flex items-center gap-1">
                <Server className="w-3 h-3 stroke-[2.5]" /> Express + Vite Server
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-300 border-2 border-black text-black px-2.5 py-1 rounded-full flex items-center gap-1">
                <Mic className="w-3 h-3 stroke-[2.5]" /> ElevenLabs Voice synthesis
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-green-300 border-2 border-black text-black px-2.5 py-1 rounded-full flex items-center gap-1">
                <Flame className="w-3 h-3 stroke-[2.5]" /> Recharts Analytics
              </span>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black/10 mt-12 py-8 px-6 text-center text-[10px] font-black uppercase tracking-wider text-black/50 bg-[#FFF5DB] dark:bg-zinc-950 dark:border-yellow-500/20 dark:text-zinc-500">
        <p>Fan-Voice Commentary Box &copy; 2026. Made with passion for the sports-fandom hackathon.</p>
      </footer>
    </div>
  );
}
