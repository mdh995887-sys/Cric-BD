import React from 'react';
import { Heart, Play, Tv } from 'lucide-react';
import { Channel } from '../types/channel';
import { ChannelLogo } from './ChannelLogo';

interface ChannelCardProps {
  channel: Channel;
  onClick: (channel: Channel) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (channelId: string, e: React.MouseEvent) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const getCategoryAccent = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'cricket':
        return 'text-emerald-400';
      case 'sports':
      case 'football':
        return 'text-cyan-400';
      case 'news':
        return 'text-rose-400';
      case 'movies':
        return 'text-amber-400';
      case 'entertainment':
        return 'text-purple-400';
      case 'kids':
        return 'text-pink-400';
      case 'music':
        return 'text-teal-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div
      onClick={() => onClick(channel)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(channel);
        }
      }}
      className="group relative flex flex-col bg-[#0e1320] border border-white/10 hover:border-emerald-500/60 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-emerald-950/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      {/* Compact Visual Original Logo Area */}
      <div className="relative h-14 sm:h-16 w-full overflow-hidden bg-black/40">
        <ChannelLogo
          name={channel.name}
          category={channel.category}
          logo={channel.logo}
          mobileImage={channel.mobileImage}
        />

        {/* Subtle hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 group-hover:from-emerald-950/50 transition-colors pointer-events-none" />

        {/* Top Badges: Micro LIVE dot & Favorite */}
        <div className="absolute top-1 left-1 right-1 flex items-center justify-between z-10 pointer-events-none">
          {channel.isLive ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase bg-red-600/90 text-white shadow-sm">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
              <span>LIVE</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium bg-zinc-800/80 text-zinc-300">
              <Tv size={8} />
            </span>
          )}

          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(channel.id, e);
              }}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="pointer-events-auto p-1 rounded-full bg-black/55 hover:bg-black/85 text-zinc-300 hover:text-rose-400 transition-all backdrop-blur-sm border border-white/10"
            >
              <Heart
                size={11}
                className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-300'}
              />
            </button>
          )}
        </div>

        {/* Center Quick Play Overlay Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
          <div className="w-7 h-7 rounded-full bg-emerald-500/90 text-black flex items-center justify-center shadow-lg">
            <Play size={13} className="fill-black translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Minimal Compact Card Body */}
      <div className="px-1.5 py-1.5 flex flex-col gap-0.5">
        <h3 className="text-[11px] font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate leading-tight">
          {channel.name}
        </h3>
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[9px] font-semibold truncate ${getCategoryAccent(channel.category)}`}>
            {channel.category}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              channel.status === 'online'
                ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]'
                : 'bg-rose-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

