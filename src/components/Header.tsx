import React, { useState } from 'react';
import {
  Menu,
  X,
  Search,
  Tv,
  Radio,
  Trophy,
  Heart,
  RotateCw,
  Globe,
  Shield,
  Layers,
  Sparkles,
  Flame,
  Settings
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  favoritesCount: number;
  showOnlyFavorites: boolean;
  onToggleFavoritesOnly: () => void;
  onRefreshStreams: () => void;
  isRefreshing: boolean;
  language: 'en' | 'bn';
  onToggleLanguage: () => void;
  onOpenAdmin: () => void;
  onOpenSettings?: () => void;
  totalChannels: number;
  isPlayerActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onSelectCategory,
  favoritesCount,
  showOnlyFavorites,
  onToggleFavoritesOnly,
  onRefreshStreams,
  isRefreshing,
  language,
  onToggleLanguage,
  onOpenAdmin,
  onOpenSettings,
  totalChannels,
  isPlayerActive = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpenMobile, setSearchOpenMobile] = useState(false);

  const categories = [
    { id: 'all', en: 'All Channels', bn: 'সব চ্যানেল' },
    { id: 'cricket', en: 'Cricket', bn: 'ক্রিকেট' },
    { id: 'football', en: 'Football', bn: 'ফুটবল' },
    { id: 'news', en: 'News', bn: 'সংবাদ' },
    { id: 'entertainment', en: 'Entertainment', bn: 'বিনোদন' },
    { id: 'movies', en: 'Movies', bn: 'সিনেমা' },
    { id: 'kids', en: 'Kids', bn: 'শিশু-কিশোর' },
    { id: 'music', en: 'Music', bn: 'গান' },
  ];

  return (
    <header className={`${isPlayerActive ? 'relative' : 'sticky top-0'} z-40 w-full bg-[#080d19]/95 backdrop-blur-md border-b border-white/10 shadow-lg`}>
      {/* Main Top Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              if (showOnlyFavorites) onToggleFavoritesOnly();
            }}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-md shadow-emerald-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                <Tv className="w-5 h-5 text-emerald-400 group-hover:text-black transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white font-['Outfit']">
                  CRIC<span className="text-emerald-400">BD</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest hidden sm:inline-block">
                  Live
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wide hidden sm:block -mt-1">
                Habil Live Sport TV
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'চ্যানেল খুঁজুন (উদাঃ Willow, Ananda, Asian)...'
                  : 'Search channels (e.g. Willow, Ananda, Asian)...'
              }
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-white/5 hover:bg-white/10 focus:bg-black/60 border border-white/10 focus:border-emerald-500 text-sm text-slate-100 placeholder-zinc-500 transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Search Toggle */}
          <button
            type="button"
            onClick={() => setSearchOpenMobile(!searchOpenMobile)}
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            title="Search"
          >
            <Search size={18} />
          </button>

          {/* Refresh Streams button */}
          <button
            type="button"
            onClick={onRefreshStreams}
            disabled={isRefreshing}
            title={language === 'bn' ? 'স্ট্রিম রিফ্রেশ করুন' : 'Refresh Streams'}
            className="p-2 sm:px-3 sm:py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-emerald-400 transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <RotateCw size={16} className={isRefreshing ? 'animate-spin text-emerald-400' : ''} />
            <span className="hidden sm:inline">
              {isRefreshing ? (language === 'bn' ? 'যাচাই হচ্ছে...' : 'Refreshing...') : (language === 'bn' ? 'রিফ্রেশ' : 'Refresh')}
            </span>
          </button>

          {/* Favorites quick toggle */}
          <button
            type="button"
            onClick={onToggleFavoritesOnly}
            title="Favorites"
            className={`p-2 sm:px-3 sm:py-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-semibold ${
              showOnlyFavorites
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-rose-400'
            }`}
          >
            <Heart size={16} className={showOnlyFavorites ? 'fill-rose-500 text-rose-500' : ''} />
            <span className="hidden sm:inline">
              {language === 'bn' ? 'পছন্দের' : 'Favorites'}
            </span>
            {favoritesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={onToggleLanguage}
            title="Language"
            className="p-2 sm:px-2.5 sm:py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-cyan-400 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <Globe size={15} />
            <span className="uppercase text-[11px]">{language === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* App Settings Button (Screenshot 1) */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="App Settings"
            className="p-2 sm:px-2.5 sm:py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <Settings size={16} />
            <span className="hidden xl:inline">Settings</span>
          </button>

          {/* Admin Login Button */}
          <button
            type="button"
            onClick={onOpenAdmin}
            title="Admin Management"
            className="p-2 sm:px-3 sm:py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <Shield size={16} />
            <span className="hidden lg:inline">Admin</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
            title="Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Search input bar dropdown */}
      {searchOpenMobile && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-white/5 bg-[#0a0f1d]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Ananda, Asian, Willow, BTV..."
              autoFocus
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-white/10 border border-white/15 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Horizontal Category Navigation Bar */}
      <div className="border-t border-white/5 bg-[#070b14]/90 px-3 sm:px-6 py-1.5 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-1.5 min-w-max">
          {categories.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id);
                  if (showOnlyFavorites) onToggleFavoritesOnly();
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25 font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5'
                }`}
              >
                {language === 'bn' ? cat.bn : cat.en}
              </button>
            );
          })}

          <div className="ml-auto pl-4 text-[11px] text-zinc-500 font-medium hidden md:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{totalChannels} Channels Active</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Slide-out Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0f1d] px-4 py-4 space-y-3">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Quick Channels
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id);
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between ${
                  activeCategory === cat.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-white/5 text-zinc-300 border border-white/5'
                }`}
              >
                <span>{language === 'bn' ? cat.bn : cat.en}</span>
                <Radio size={12} className="opacity-50" />
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-zinc-400">Total {totalChannels} Channels</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="text-xs font-bold text-emerald-400 flex items-center gap-1"
            >
              <Shield size={14} /> Admin Area
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
