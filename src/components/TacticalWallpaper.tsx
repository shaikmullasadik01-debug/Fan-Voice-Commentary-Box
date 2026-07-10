import { motion, AnimatePresence } from "motion/react";

interface TacticalWallpaperProps {
  isWaveActive: boolean;
  theme: "light" | "dark";
}

export default function TacticalWallpaper({ isWaveActive, theme }: TacticalWallpaperProps) {
  const isDark = theme === "dark";

  // Tactical layout colors based on theme
  const lineColor = isDark ? "rgba(234, 179, 8, 0.15)" : "rgba(0, 0, 0, 0.04)";
  const spotColor = isDark ? "rgba(234, 179, 8, 0.25)" : "rgba(0, 0, 0, 0.08)";
  const playerColorA = isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.08)";
  const playerColorB = isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.08)";

  return (
    <div
      id="tactical-arena-wallpaper"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transition-colors duration-500"
      style={{
        backgroundColor: isDark ? "#0A0A0C" : "#FFFCEF",
      }}
    >
      {/* 1. Subtle Radial Gradient Grid */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: isDark 
            ? "radial-gradient(rgba(234, 179, 8, 0.1) 1px, transparent 1px)" 
            : "radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* 2. Tactical Field Markings */}
      <div className="absolute inset-x-8 inset-y-12 border-2 rounded-3xl opacity-70 transition-all duration-300"
           style={{ borderColor: lineColor }}>
        
        {/* Center Line */}
        <div className="absolute inset-y-0 left-1/2 border-l-2 -translate-x-1/2 transition-all"
             style={{ borderColor: lineColor }} />

        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 w-48 h-48 border-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all"
             style={{ borderColor: lineColor }} />
        
        <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all"
             style={{ backgroundColor: spotColor }} />

        {/* Penalty Area Left */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-36 h-72 border-r-2 border-y-2 rounded-r-3xl transition-all"
             style={{ borderColor: lineColor }}>
          {/* Penalty Spot */}
          <div className="absolute top-1/2 right-8 w-2 h-2 rounded-full -translate-y-1/2"
               style={{ backgroundColor: spotColor }} />
          {/* Goal Box */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-12 h-36 border-r-2 border-y-2 rounded-r-xl"
               style={{ borderColor: lineColor }} />
        </div>

        {/* Penalty Area Right */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-36 h-72 border-l-2 border-y-2 rounded-l-3xl transition-all"
             style={{ borderColor: lineColor }}>
          {/* Penalty Spot */}
          <div className="absolute top-1/2 left-8 w-2 h-2 rounded-full -translate-y-1/2"
               style={{ backgroundColor: spotColor }} />
          {/* Goal Box */}
          <div className="absolute top-1/2 -translate-y-1/2 right-0 w-12 h-36 border-l-2 border-y-2 rounded-l-xl"
               style={{ borderColor: lineColor }} />
        </div>
      </div>

      {/* 3. Floating Tactical Formations (X and O Players) */}
      <AnimatePresence>
        <motion.div
          animate={{
            y: [0, -10, 0],
            x: [0, 8, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0"
        >
          {/* Attacking Arrow */}
          <svg className="absolute top-1/4 left-1/3 w-32 h-24 opacity-20" viewBox="0 0 100 80" fill="none">
            <path d="M10 70 Q 50 10 90 20" stroke={isDark ? "#EAB308" : "#000000"} strokeWidth="2.5" strokeDasharray="5,5" />
            <polygon points="90,20 80,15 85,25" fill={isDark ? "#EAB308" : "#000000"} />
          </svg>

          {/* Player X1 (Home Team) */}
          <div className="absolute top-1/3 left-1/4 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full border border-black/30 flex items-center justify-center font-black text-[9px] shadow"
                 style={{ backgroundColor: playerColorA, color: isDark ? "#EF4444" : "#B91C1C" }}>
              X1
            </div>
            <span className="text-[7px] font-bold uppercase tracking-widest opacity-25 mt-1" style={{ color: isDark ? "#fff" : "#000" }}>ST</span>
          </div>

          {/* Player X2 (Home Team) */}
          <div className="absolute bottom-1/4 left-1/3 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full border border-black/30 flex items-center justify-center font-black text-[9px] shadow"
                 style={{ backgroundColor: playerColorA, color: isDark ? "#EF4444" : "#B91C1C" }}>
              X2
            </div>
            <span className="text-[7px] font-bold uppercase tracking-widest opacity-25 mt-1" style={{ color: isDark ? "#fff" : "#000" }}>WNG</span>
          </div>

          {/* Player O1 (Away Team) */}
          <div className="absolute top-1/2 right-1/4 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full border border-black/30 flex items-center justify-center font-black text-[9px] shadow"
                 style={{ backgroundColor: playerColorB, color: isDark ? "#3B82F6" : "#1D4ED8" }}>
              O1
            </div>
            <span className="text-[7px] font-bold uppercase tracking-widest opacity-25 mt-1" style={{ color: isDark ? "#fff" : "#000" }}>CB</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 4. Active Sound-responsive Broadcasting Waves */}
      {isWaveActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="w-[30vw] h-[30vw] rounded-full border-4"
            style={{ borderColor: isDark ? "rgba(234, 179, 8, 0.2)" : "rgba(0, 0, 0, 0.05)" }}
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0.5 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className="w-[40vw] h-[40vw] rounded-full border-2"
            style={{ borderColor: isDark ? "rgba(234, 179, 8, 0.1)" : "rgba(0, 0, 0, 0.03)" }}
          />
        </div>
      )}

      {/* 5. Subtle Arena Spotlight Lighting Glows */}
      <div className="absolute left-0 top-0 w-[500px] h-[500px] rounded-full filter blur-[150px] opacity-15 pointer-events-none"
           style={{ backgroundImage: isDark ? "radial-gradient(circle, rgba(234, 179, 8, 0.2) 0%, transparent 70%)" : "radial-gradient(circle, rgba(0, 0, 0, 0.04) 0%, transparent 70%)" }} />
      <div className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full filter blur-[150px] opacity-15 pointer-events-none"
           style={{ backgroundImage: isDark ? "radial-gradient(circle, rgba(234, 179, 8, 0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(0, 0, 0, 0.04) 0%, transparent 70%)" }} />
    </div>
  );
}
