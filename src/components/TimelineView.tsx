import React, { useState, useEffect, useRef } from "react";
import { MatchEvent, PreloadedMatch, MatchContext } from "../types";
import { PRELOADED_MATCHES } from "../data";
import { Plus, ListCollapse, Play, Pause, RotateCcw, AlertCircle, ChevronDown, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TimelineViewProps {
  events: MatchEvent[];
  activeEventId: string | null;
  onEventSelect: (eventId: string) => void;
  onEventAdd: (minute: number | string, text: string) => void;
  onMatchChange: (match: PreloadedMatch) => void;
  activeMatch: PreloadedMatch;
  matchContext: MatchContext;
  onScoreChange: (scoreA: number, scoreB: number) => void;
  activePersonaId: string;
}

export default function TimelineView({
  events,
  activeEventId,
  onEventSelect,
  onEventAdd,
  onMatchChange,
  activeMatch,
  matchContext,
  onScoreChange,
  activePersonaId,
}: TimelineViewProps) {
  const [showMatchDropdown, setShowMatchDropdown] = useState(false);
  const [manualMin, setManualMin] = useState("");
  const [manualText, setManualText] = useState("");
  const [isAutoplayRunning, setIsAutoplayRunning] = useState(false);
  const [autoplayIndex, setAutoplayIndex] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop autoplay when match changes
  useEffect(() => {
    stopAutoplay();
    // Find the number of events already processed in this match
    setAutoplayIndex(events.length);
  }, [activeMatch]);

  // Autoplay loop
  useEffect(() => {
    if (isAutoplayRunning) {
      timerRef.current = setInterval(() => {
        const initialEvents = activeMatch.initialEvents;
        if (autoplayIndex < initialEvents.length) {
          const nextEvent = initialEvents[autoplayIndex];
          onEventAdd(nextEvent.minute, nextEvent.text);
          setAutoplayIndex((prev) => prev + 1);
        } else {
          // If all preloaded events are finished, generate a random interesting live soccer event!
          const randomLiveMinutes = 90 + (autoplayIndex - initialEvents.length + 1);
          const customScenarios = [
            `The referee calls for a video VAR review on a possible handball in the box! Tension is sky high!`,
            `Yellow card issued! Crucial tactical foul to stop a breakaway counter-attack.`,
            `Stunning long-range shot from 35 yards out! Crashes right off the crossbar, goalkeeper was beaten!`,
            `Fierce argument breaks out near the corner flag! Players are pushing and shoving, referee is rushing over!`,
            `Substitution: A young 17-year-old local academy prospect is subbed on to make his legendary debut!`,
            `The stadium crowd begins chanting at the top of their lungs, waving scarves as heavy rain starts pouring!`
          ];
          const text = customScenarios[Math.floor(Math.random() * customScenarios.length)];
          onEventAdd(randomLiveMinutes, text);
          setAutoplayIndex((prev) => prev + 1);
        }
      }, 5000); // Inject a new event every 5 seconds
    } else {
      stopAutoplay();
    }

    return () => stopAutoplay();
  }, [isAutoplayRunning, autoplayIndex, activeMatch, events]);

  const stopAutoplay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleManualInject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    const minuteVal = manualMin.trim() || "LIVE";
    onEventAdd(minuteVal, manualText);
    setManualText("");
    setManualMin("");
    // If user injects manually, increment autoplay index so we don't duplicate positions
    setAutoplayIndex((prev) => prev + 1);
  };

  const handleResetMatch = () => {
    stopAutoplay();
    onMatchChange(activeMatch);
    setAutoplayIndex(0);
  };

  return (
    <div id="timeline-container" className="bg-yellow-300 rounded-3xl p-6 text-black border-2 border-black card-shadow flex flex-col gap-5 h-full">
      {/* 1. Legendary Match Selector */}
      <div id="match-selector" className="relative">
        <label className="text-[10px] font-black uppercase text-black/50 block mb-1.5 tracking-widest">
          Choose Legendary Arena Match
        </label>
        <button
          id="match-select-dropdown-btn"
          onClick={() => setShowMatchDropdown(!showMatchDropdown)}
          className="w-full flex items-center justify-between p-3.5 bg-black hover:bg-zinc-900 border-2 border-black rounded-2xl text-left text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer card-shadow"
        >
          <span className="truncate">🏆 {activeMatch.title}</span>
          <ChevronDown className={`w-4 h-4 text-white transition-transform ${showMatchDropdown ? "rotate-185" : ""}`} />
        </button>

        <AnimatePresence>
          {showMatchDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              id="match-dropdown-list"
              className="absolute z-20 w-full mt-2 bg-white border-2 border-black rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
            >
              {PRELOADED_MATCHES.map((match) => (
                <button
                  key={match.id}
                  onClick={() => {
                    onMatchChange(match);
                    setShowMatchDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 text-left text-xs hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer ${
                    match.id === activeMatch.id ? "bg-gray-100 text-black font-black" : "text-gray-700"
                  }`}
                >
                  <div className="truncate pr-4">
                    <p className="font-bold">{match.title}</p>
                    <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Sport: {match.sport}</p>
                  </div>
                  {match.id === activeMatch.id && <CheckCircle2 className="w-4 h-4 shrink-0 text-black" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Score & Control Strip */}
      <div id="match-scores-strip" className="bg-white/40 border-2 border-black/10 rounded-2xl p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Active Score board */}
          <div className="text-[9px] font-black uppercase bg-black text-white px-2 py-0.5 rounded-full shrink-0 tracking-wider">
            Live Score
          </div>
          <span className="text-xs font-black text-black truncate">
            {matchContext.teamA} {matchContext.scoreA} - {matchContext.scoreB} {matchContext.teamB}
          </span>
        </div>

        {/* Action button controls */}
        <div className="flex gap-1.5 shrink-0">
          <button
            id="autoplay-btn"
            onClick={() => setIsAutoplayRunning(!isAutoplayRunning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer border-2 border-black card-shadow ${
              isAutoplayRunning
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-black text-white hover:bg-zinc-900"
            }`}
            title={isAutoplayRunning ? "Pause stream simulation" : "Start real-time stream simulation"}
          >
            {isAutoplayRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            {isAutoplayRunning ? "PAUSE" : "AUTOPLAY"}
          </button>
          <button
            id="reset-timeline-btn"
            onClick={handleResetMatch}
            className="p-1.5 rounded-xl bg-white border-2 border-black text-black hover:bg-gray-50 transition-colors cursor-pointer"
            title="Reset Match Events"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 3. Play-by-Play Event list */}
      <div id="timeline-list-card" className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase text-black/60 tracking-widest flex items-center gap-1">
            <ListCollapse className="w-3.5 h-3.5" />
            Play Events ({events.length})
          </span>
          {isAutoplayRunning && (
            <span className="text-[9px] text-red-600 font-extrabold uppercase tracking-widest animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              Streaming...
            </span>
          )}
        </div>

        <div id="timeline-scroll-area" className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[350px]">
          <AnimatePresence initial={false}>
            {events.map((event) => {
              const isSelected = event.id === activeEventId;
              const hasCommentary = !!event.commentaries[activePersonaId];

              return (
                <motion.button
                  key={event.id}
                  id={`timeline-event-item-${event.id}`}
                  onClick={() => onEventSelect(event.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? "bg-white text-black border-black card-shadow font-extrabold"
                      : "bg-white/30 border-black/15 text-gray-800 hover:bg-white/50 hover:border-black/30 font-semibold"
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    {/* Time Minute Stamp */}
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 text-center min-w-[32px] bg-black text-white uppercase tracking-tighter">
                      {typeof event.minute === "number" ? `${event.minute}'` : event.minute}
                    </span>

                    {/* Event Description */}
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-xs leading-relaxed font-bold transition-colors ${
                        isSelected ? "text-black" : "text-black/85"
                      }`}>
                        {event.text}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="absolute right-3.5 top-4.5 flex items-center gap-1.5">
                    {hasCommentary ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black/10" title="Commentary evaluated" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-400 animate-pulse border border-black/10" title="Awaiting commentary" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>

          {events.length === 0 && (
            <div className="h-32 flex flex-col items-center justify-center text-black/60 border-2 border-dashed border-black/25 rounded-2xl bg-white/20">
              <span className="text-2xl mb-1.5">📋</span>
              <p className="text-xs font-bold uppercase tracking-wider">No play-by-play events yet.</p>
              <button
                onClick={handleResetMatch}
                className="text-[10px] text-black font-black uppercase hover:underline mt-1.5 cursor-pointer"
              >
                Reset Match
              </button>
            </div>
          )}
        </div>
      </div>

      <hr className="border-black/15" />

      {/* 4. Manual Event Injector Form */}
      <form id="manual-event-form" onSubmit={handleManualInject} className="flex flex-col gap-2 relative z-10">
        <label className="text-[10px] font-black uppercase text-black/50 block tracking-widest">
          Inject Custom Match Event
        </label>
        <div className="flex gap-2">
          {/* Minute box */}
          <input
            type="text"
            placeholder="Min"
            value={manualMin}
            onChange={(e) => setManualMin(e.target.value)}
            className="w-16 bg-white border-2 border-black text-black font-bold text-xs px-2.5 py-3 rounded-2xl focus:outline-none text-center font-mono placeholder-black/40"
          />
          {/* Text box */}
          <input
            type="text"
            placeholder="Type live soccer action drama..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            className="flex-1 bg-white border-2 border-black text-black font-bold text-xs px-3.5 py-3 rounded-2xl focus:outline-none placeholder-black/40"
          />
          {/* Inject button */}
          <button
            type="submit"
            className="p-3 bg-black hover:bg-zinc-900 text-white rounded-2xl transition-all shrink-0 flex items-center justify-center cursor-pointer border-2 border-black card-shadow"
            title="Inject Event"
          >
            <Plus className="w-4 h-4 stroke-[3.5]" />
          </button>
        </div>
        <span className="text-[9px] font-black uppercase text-black/55 flex items-center gap-1 mt-1 tracking-wide">
          <AlertCircle className="w-3.5 h-3.5" />
          Commentary is updated instantly via Google Gemini API
        </span>
      </form>
    </div>
  );
}
