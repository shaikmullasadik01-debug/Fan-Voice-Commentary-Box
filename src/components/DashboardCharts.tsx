import { MatchEvent, CommentatorPersona } from "../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Activity, Flame } from "lucide-react";

interface DashboardChartsProps {
  events: MatchEvent[];
  activePersona: CommentatorPersona;
}

export default function DashboardCharts({ events, activePersona }: DashboardChartsProps) {
  // Map events to chart-friendly data
  // Only include events that have generated commentary for the active persona
  const chartData = events
    .filter((e) => e.commentaries[activePersona.id])
    .map((e) => {
      const commentary = e.commentaries[activePersona.id];
      return {
        minute: typeof e.minute === "number" ? `${e.minute}'` : e.minute,
        event: e.text,
        tension: commentary.tensionIndex,
        sentiment: commentary.sentimentScore,
      };
    });

  const isDataAvailable = chartData.length > 0;

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950/95 border border-zinc-800 p-3 rounded-lg shadow-xl max-w-xs backdrop-blur-md">
          <div className="flex justify-between items-center mb-1.5 border-b border-zinc-800 pb-1">
            <span className="text-xs font-bold text-emerald-400">Minute: {data.minute}</span>
            <span className="text-[10px] font-mono text-zinc-400">Match Tension</span>
          </div>
          <p className="text-xs text-zinc-300 font-medium mb-2 leading-snug">"{data.event}"</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Tension Level:</span>
              <span className="font-bold text-orange-400">{data.tension}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Sentiment Intensity:</span>
              <span className={`font-bold ${data.sentiment >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {data.sentiment >= 0 ? `+${data.sentiment}` : data.sentiment}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="dashboard-charts-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Match Tension Timeline Chart */}
      <div id="tension-chart-card" className="bg-white rounded-3xl p-6 text-black border-2 border-black card-shadow flex flex-col h-[300px]">
        <div className="flex items-center gap-2.5 mb-4">
          <Activity className="w-5 h-5 text-orange-600" />
          <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase">
            Live Match Tension Timeline
          </h3>
        </div>

        {isDataAvailable ? (
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tensionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="minute" stroke="#1f2937" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#1f2937" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="tension"
                  stroke="#FF4E00"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, stroke: "#ffffff", fill: "#FF4E00" }}
                  activeDot={{ r: 6, strokeWidth: 1 }}
                  name="Tension Index"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
            <span className="text-3xl mb-1.5">📊</span>
            <span className="text-xs font-bold text-black uppercase tracking-wider">No live timeline analytics.</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Select a timeline event to start charting.</span>
          </div>
        )}
      </div>

      {/* 2. Sentiment / Passion Flow Chart */}
      <div id="sentiment-chart-card" className="bg-white rounded-3xl p-6 text-black border-2 border-black card-shadow flex flex-col h-[300px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-red-500" />
            <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase">
              Passion Sentiment Curve
            </h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-black/10 bg-black text-white">
            {activePersona.name}
          </span>
        </div>

        {isDataAvailable ? (
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sentimentPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sentimentNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="minute" stroke="#1f2937" fontSize={10} tickLine={false} />
                <YAxis domain={[-100, 100]} stroke="#1f2937" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sentiment"
                  stroke={activePersona.id === "grumpy" ? "#f59e0b" : "#FF0055"}
                  fill="url(#sentimentPos)"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: "#ffffff", fill: "#FF0055" }}
                  name="Sentiment Intensity"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
            <span className="text-3xl mb-1.5">📈</span>
            <span className="text-xs font-bold text-black uppercase tracking-wider">Sentiment curve is offline.</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Vocal performance metrics will map here live.</span>
          </div>
        )}
      </div>
    </div>
  );
}
