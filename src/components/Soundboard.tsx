import { STADIUM_SOUNDS } from "../data";
import { audioSynth } from "../utils/audioSynth";
import { Play, Volume2 } from "lucide-react";
import { motion } from "motion/react";

interface SoundboardProps {
  onSoundTriggered?: (soundId: string) => void;
}

export default function Soundboard({ onSoundTriggered }: SoundboardProps) {
  const handlePlaySound = (soundId: string) => {
    audioSynth.trigger(soundId);
    if (onSoundTriggered) {
      onSoundTriggered(soundId);
    }
  };

  return (
    <div id="soundboard-container" className="bg-black rounded-3xl p-6 text-white border-2 border-black card-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Volume2 className="w-5 h-5 text-yellow-300" id="soundboard-icon" />
          <h3 id="soundboard-title" className="text-xs font-black tracking-widest text-white uppercase">
            Stadium Soundboard
          </h3>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 text-white px-2.5 py-1 rounded-full border border-white/10">
          Synthesized Live
        </span>
      </div>

      <p className="text-xs text-zinc-400 mb-5 leading-relaxed font-medium">
        Trigger synthesized arena sound effects to match the game events. These also auto-trigger during live matches!
      </p>

      <div id="soundboard-grid" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STADIUM_SOUNDS.map((sound) => (
          <motion.button
            key={sound.id}
            id={`sound-btn-${sound.id}`}
            onClick={() => handlePlaySound(sound.id)}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="flex flex-col items-center justify-center p-4 bg-zinc-900 border-2 border-zinc-800 rounded-2xl transition-all duration-200 hover:border-yellow-300 hover:bg-zinc-800 text-center cursor-pointer group"
          >
            <span className="text-3xl mb-1.5 filter drop-shadow group-hover:scale-125 transition-transform duration-200">
              {sound.emoji}
            </span>
            <span className="text-xs font-black text-zinc-100 truncate max-w-full">
              {sound.name}
            </span>
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Play className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
              <span className="text-[9px] text-yellow-300 uppercase font-black tracking-widest">
                PLAY
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
