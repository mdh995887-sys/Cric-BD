import React from 'react';
import { Activity, Flame, Trophy } from 'lucide-react';
import { MatchScore } from '../types/channel';

interface SportsTickerProps {
  onSelectMatchChannel?: (channelName: string) => void;
}

export const liveMatches: MatchScore[] = [
  {
    id: 'm1',
    tournament: 'BPL 2026 Live',
    teamA: { name: 'Comilla Victorians', code: 'CV', score: '178/4', overs: '19.2' },
    teamB: { name: 'Rangpur Riders', code: 'RR', score: '174/8', overs: '20.0' },
    statusText: 'CV needs 5 runs in 4 balls',
    isLive: true,
    sport: 'cricket',
  },
  {
    id: 'm2',
    tournament: 'ICC Asia Cup',
    teamA: { name: 'Bangladesh', code: 'BAN', score: '286/7', overs: '50.0' },
    teamB: { name: 'Sri Lanka', code: 'SL', score: '142/3', overs: '26.4' },
    statusText: 'SL needs 145 runs',
    isLive: true,
    sport: 'cricket',
  },
  {
    id: 'm3',
    tournament: 'International T20',
    teamA: { name: 'India', code: 'IND', score: '192/5', overs: '20.0' },
    teamB: { name: 'Pakistan', code: 'PAK', score: '118/4', overs: '14.1' },
    statusText: 'PAK target 193',
    isLive: true,
    sport: 'cricket',
  },
  {
    id: 'm4',
    tournament: 'Premier League',
    teamA: { name: 'Arsenal', code: 'ARS', score: '2' },
    teamB: { name: 'Man City', code: 'MCI', score: '1' },
    statusText: '78\' Live',
    isLive: true,
    sport: 'football',
  },
];

export const SportsTicker: React.FC<SportsTickerProps> = ({ onSelectMatchChannel }) => {
  return (
    <div className="w-full bg-[#0a0f1d] border-b border-white/10 px-3 py-2 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Ticker Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Trophy size={14} className="text-emerald-400" />
          <span className="tracking-wide uppercase text-[11px]">Match Arena</span>
        </div>

        {/* Scrollable match cards */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 flex-1 scroll-smooth">
          {liveMatches.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMatchChannel && onSelectMatchChannel('Willow')}
              className="group flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer shrink-0 text-xs"
            >
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-tight flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {m.tournament}
                </span>

                <div className="flex items-center gap-2 font-bold text-slate-100 mt-0.5">
                  <span className="text-emerald-400">{m.teamA.code}</span>
                  <span className="text-zinc-400 text-[10px]">{m.teamA.score}</span>
                  <span className="text-zinc-600 font-normal">vs</span>
                  <span className="text-cyan-400">{m.teamB.code}</span>
                  <span className="text-zinc-400 text-[10px]">{m.teamB.score}</span>
                </div>
              </div>

              <div className="border-l border-white/10 pl-2 text-[10px] text-amber-300/90 font-medium whitespace-nowrap">
                {m.statusText}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
