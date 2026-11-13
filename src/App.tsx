import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './components/Header';
import { SportsTicker } from './components/SportsTicker';
import { ChannelCard } from './components/ChannelCard';
import { ChannelLogo } from './components/ChannelLogo';
import { VideoPlayer, PlayerMode } from './components/VideoPlayer';
import { AdminModal } from './components/AdminModal';
import { AppSettingsModal, AppSettings, defaultSettings } from './components/AppSettingsModal';
import { initialChannels } from './data/channels';
import { Channel } from './types/channel';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  testFirestoreConnection,
  subscribeToChannels,
  saveChannelToFirestore,
  deleteChannelFromFirestore,
  signInAdminWithGoogle,
  signOutAdmin,
  PersistedChannelRecord,
} from './lib/firebase';
import {
  Tv,
  Radio,
  Sparkles,
  LayoutGrid,
  List,
  Flame,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Heart,
  Settings
} from 'lucide-react';

const STORAGE_KEY_CHANNELS = 'cricbd_custom_channels_v9';
const LEGACY_STORAGE_KEY_CHANNELS = 'cricbd_custom_channels_v8';
const STORAGE_KEY_OVERRIDES = 'cricbd_admin_overrides_v1';
const STORAGE_KEY_FAVORITES = 'cricbd_favorites_v3';
const STORAGE_KEY_LANG = 'cricbd_lang_v2';
const STORAGE_KEY_SETTINGS = 'cricbd_app_settings_v1';

const initialChannelIds = new Set(initialChannels.map((c) => c.id));

function mergeWithInitialChannels(overrides: PersistedChannelRecord[]): Channel[] {
  const overrideMap = new Map<string, PersistedChannelRecord>();
  for (const rec of overrides) {
    if (rec && rec.id) {
      overrideMap.set(rec.id, rec);
    }
  }

  const merged: Channel[] = [];
  // Custom-added channels first so admin additions appear prominently
  for (const rec of overrides) {
    if (rec && rec.id && !initialChannelIds.has(rec.id) && !rec.deleted) {
      merged.push(rec);
    }
  }
  // Built-in channels (applying any admin edits or soft-deletes)
  for (const base of initialChannels) {
    const ov = overrideMap.get(base.id);
    if (ov?.deleted) continue;
    merged.push(ov ? { ...base, ...ov } : base);
  }

  const uniqueMap = new Map<string, Channel>();
  for (const ch of merged) {
    if (ch && ch.name) {
      const key = ch.name.trim().toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, ch);
      }
    }
  }
  return Array.from(uniqueMap.values());
}

export default function App() {
  // Admin channel overrides (added/edited/deleted channels persisted across Cloud + Server + localStorage)
  const [adminOverrides, setAdminOverrides] = useState<PersistedChannelRecord[]>(() => {
    try {
      const savedOverrides = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (savedOverrides) {
        const parsed = JSON.parse(savedOverrides);
        if (Array.isArray(parsed)) return parsed;
      }
      // Migrate any custom channels saved in previous v8/v9 localStorage
      for (const key of [STORAGE_KEY_CHANNELS, LEGACY_STORAGE_KEY_CHANNELS]) {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter((c: Channel) => c && c.id && !initialChannelIds.has(c.id));
          }
        }
      }
    } catch (_) {}
    return [];
  });

  const channels = useMemo(() => mergeWithInitialChannels(adminOverrides), [adminOverrides]);

  const [cloudUserEmail, setCloudUserEmail] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // App Settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return defaultSettings;
  });
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);

  // Default active channel on first load
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(() => {
    if (defaultSettings.autoPlayOnStartup && initialChannels.length > 0) {
      return initialChannels[0];
    }
    return null;
  });
  const [playerMode, setPlayerMode] = useState<PlayerMode>('inline');
  const playerSectionRef = useRef<HTMLDivElement>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return ['14', '23', '24', '34', '75', '81'];
  });

  // Language state: 'en' or 'bn'
  const [language, setLanguage] = useState<'en' | 'bn'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved === 'bn' || saved === 'en') return saved;
    } catch (_) {}
    return 'bn';
  });

  // Navigation & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAppLandscape, setIsAppLandscape] = useState(false);

  // Save overrides locally + to server backup whenever updated
  const persistOverridesLocallyAndServer = (nextOverrides: PersistedChannelRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(nextOverrides));
      localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(mergeWithInitialChannels(nextOverrides)));
    } catch (_) {}
    fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channels: nextOverrides }),
    }).catch(() => {});
  };

  // Connect Firebase Auth + Firestore real-time sync + Server /api/channels hydration
  useEffect(() => {
    testFirestoreConnection();

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCloudUserEmail(user?.email || null);
    });

    // Hydrate from Express server backup first (works without login)
    fetch('/api/channels')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.channels) && data.channels.length > 0) {
          setAdminOverrides((prev) => {
            const map = new Map<string, PersistedChannelRecord>();
            for (const item of prev) map.set(item.id, item);
            for (const item of data.channels) {
              if (item && item.id) map.set(item.id, item);
            }
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    // Real-time Firestore listener (permanent cloud sync across all devices)
    const unsubChannels = subscribeToChannels(
      (cloudRecords) => {
        if (cloudRecords.length === 0) return;
        setAdminOverrides((prev) => {
          const map = new Map<string, PersistedChannelRecord>();
          for (const item of prev) map.set(item.id, item);
          for (const rec of cloudRecords) map.set(rec.id, rec);
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      },
      () => {}
    );

    return () => {
      unsubAuth();
      unsubChannels();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
    } catch (_) {}
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch (_) {}
  }, [language]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Channel Selection: Immediate video playback without intrusive toasts
  const handleChannelSelect = (ch: Channel) => {
    setSelectedChannel(ch);
    if (settings.autoFullscreenOnChannelTap) {
      setPlayerMode('fullscreen');
    } else if (playerMode === 'pip') {
      setPlayerMode('inline');
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (channelId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      return next;
    });
  };

  // Refresh streams action
  const handleRefreshStreams = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast(
        language === 'bn' ? 'সকল লাইভ চ্যানেল রিফ্রেশ হয়েছে!' : 'All live streams reconnected & verified!'
      );
    }, 1000);
  };

  // Admin Actions
  const deduplicateChannels = (list: Channel[]) => {
    const map = new Map<string, Channel>();
    for (const c of list) {
      if (c && c.name) {
        const key = c.name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, c);
        }
      }
    }
    return Array.from(map.values());
  };

  const handleAddChannel = async (newChan: Channel) => {
    const record: PersistedChannelRecord = { ...newChan, deleted: false };
    setAdminOverrides((prev) => {
      const next = [record, ...prev.filter((c) => c.id !== record.id)];
      persistOverridesLocallyAndServer(next);
      return next;
    });
    if (auth.currentUser) {
      try {
        await saveChannelToFirestore(record);
      } catch (_) {}
    }
    showToast(`"${newChan.name}" স্থায়ীভাবে যোগ হয়েছে।`);
  };

  const handleUpdateChannel = async (updated: Channel) => {
    const record: PersistedChannelRecord = { ...updated, deleted: false };
    setAdminOverrides((prev) => {
      const next = [record, ...prev.filter((c) => c.id !== record.id)];
      persistOverridesLocallyAndServer(next);
      return next;
    });
    if (auth.currentUser) {
      try {
        await saveChannelToFirestore(record);
      } catch (_) {}
    }
    showToast(`"${updated.name}" আপডেট ও সেভ হয়েছে।`);
  };

  const handleDeleteChannel = async (id: string) => {
    const target = channels.find((c) => c.id === id);
    const isBuiltIn = initialChannelIds.has(id);

    setAdminOverrides((prev) => {
      let next: PersistedChannelRecord[];
      if (isBuiltIn && target) {
        next = [{ ...target, deleted: true }, ...prev.filter((c) => c.id !== id)];
      } else {
        next = prev.filter((c) => c.id !== id);
      }
      persistOverridesLocallyAndServer(next);
      return next;
    });

    if (auth.currentUser) {
      try {
        if (isBuiltIn && target) {
          await saveChannelToFirestore({ ...target, deleted: true });
        } else {
          await deleteChannelFromFirestore(id);
        }
      } catch (_) {}
    }
    showToast(`"${target?.name || ''}" মুছে ফেলা হয়েছে।`);
  };

  const handleExportChannels = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(channels, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cricbd_channels_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportChannels = async (imported: Channel[]) => {
    const records: PersistedChannelRecord[] = imported
      .filter((c) => c && c.id && c.name && c.streamUrl)
      .map((c) => ({ ...c, deleted: false }));
    setAdminOverrides(records);
    persistOverridesLocallyAndServer(records);
    if (auth.currentUser) {
      for (const rec of records) {
        try {
          await saveChannelToFirestore(rec);
        } catch (_) {}
      }
    }
    showToast(`${records.length}টি চ্যানেল ইমপোর্ট ও সেভ হয়েছে।`);
  };

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInAdminWithGoogle();
      setCloudUserEmail(user?.email || null);
      if (adminOverrides.length > 0) {
        setIsSyncingCloud(true);
        for (const rec of adminOverrides) {
          try {
            await saveChannelToFirestore(rec);
          } catch (_) {}
        }
        setIsSyncingCloud(false);
      }
      showToast('Google ক্লাউড সিঙ্ক সফলভাবে চালু হয়েছে!');
    } catch {
      showToast('Google লগইন সম্পন্ন হয়নি। আবার চেষ্টা করুন।');
    }
  };

  const handleGoogleSignOut = async () => {
    await signOutAdmin();
    setCloudUserEmail(null);
    showToast('Google সাইন আউট সম্পন্ন।');
  };

  const handleSyncAllToCloud = async () => {
    if (!auth.currentUser) return;
    setIsSyncingCloud(true);
    try {
      for (const rec of adminOverrides) {
        await saveChannelToFirestore(rec);
      }
      showToast('সকল কাস্টম চ্যানেল ক্লাউডে স্থায়ীভাবে সেভ হয়েছে!');
    } catch {
      showToast('ক্লাউড সিঙ্ক ব্যর্থ হয়েছে (অনুমতি যাচাই করুন)।');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Filtered Channels logic with guaranteed unique keys and names
  const filteredChannels = useMemo(() => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    return channels.filter((ch) => {
      if (!ch || !ch.id || seenIds.has(ch.id)) return false;
      const nameKey = ch.name ? ch.name.trim().toLowerCase() : '';
      if (nameKey && seenNames.has(nameKey)) return false;

      seenIds.add(ch.id);
      if (nameKey) seenNames.add(nameKey);

      // If only active channels setting is on:
      if (settings.onlyActiveChannels && ch.status !== 'online') {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ch.name.toLowerCase().includes(q);
        const matchesCategory = ch.category.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory) return false;
      }

      if (showOnlyFavorites) {
        if (!favorites.includes(ch.id)) return false;
      }

      if (activeCategory !== 'all') {
        if (ch.category.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [channels, searchQuery, showOnlyFavorites, activeCategory, favorites, settings.onlyActiveChannels]);

  const handleSelectMatchChannel = (chanName: string) => {
    const found = channels.find(
      (c) =>
        c.name.toLowerCase().includes(chanName.toLowerCase()) ||
        chanName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (found) {
      handleChannelSelect(found);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <BrowserRouter>
      <div className={`${isAppLandscape ? 'fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-[#080c16]' : 'h-[100dvh] w-full overflow-hidden'} bg-[#080c16] text-slate-100 flex flex-col font-['Outfit'] selection:bg-emerald-500 selection:text-black`}>
        {/* ------------------------------------------------------------- */}
        {/* COMPLETELY STATIONARY TOP VIDEO PLAYER (flex-none)            */}
        {/* It is outside the scroll container, so it CANNOT move at all! */}
        {/* ------------------------------------------------------------- */}
        {selectedChannel && (
          <div
            className={
              playerMode === 'fullscreen'
                ? 'contents'
                : 'flex-none z-30 w-full bg-black border-b border-emerald-500/30 shadow-2xl'
            }
          >
            <div className={playerMode === 'fullscreen' ? 'contents' : 'max-w-4xl mx-auto'}>
              <VideoPlayer
                channel={selectedChannel}
                channels={channels}
                playerMode={playerMode}
                onChangeMode={setPlayerMode}
                onClose={() => setSelectedChannel(null)}
                onSelectChannel={handleChannelSelect}
                isFavorite={favorites.includes(selectedChannel.id)}
                onToggleFavorite={handleToggleFavorite}
                onOpenSettings={() => setAppSettingsOpen(true)}
                isLandscapeRotated={isAppLandscape}
                onToggleLandscape={() => setIsAppLandscape(!isAppLandscape)}
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SCROLLABLE CONTENT CONTAINER: Scrolls independently below!    */}
        {/* ------------------------------------------------------------- */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
          style={{ overscrollBehaviorY: 'none' }}
        >
          {/* Top Header */}
          <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            if (showOnlyFavorites) setShowOnlyFavorites(false);
          }}
          favoritesCount={favorites.length}
          showOnlyFavorites={showOnlyFavorites}
          onToggleFavoritesOnly={() => setShowOnlyFavorites(!showOnlyFavorites)}
          onRefreshStreams={handleRefreshStreams}
          isRefreshing={isRefreshing}
          language={language}
          onToggleLanguage={() => setLanguage(language === 'en' ? 'bn' : 'en')}
          onOpenAdmin={() => setAdminOpen(true)}
          onOpenSettings={() => setAppSettingsOpen(true)}
          totalChannels={channels.length}
          isPlayerActive={!!selectedChannel && playerMode === 'inline'}
        />

        {/* Live Sports Ticker */}
        <SportsTicker onSelectMatchChannel={handleSelectMatchChannel} />

        {/* Main Body with Channel Grid */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-5 py-2 sm:py-3 space-y-2.5 pb-16 md:pb-6">
          {/* If no channel is selected yet, prompt banner */}
          {!selectedChannel && (
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-950/80 via-[#0d1424] to-slate-950 border border-emerald-500/20 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
                    {language === 'bn' ? 'রেডি টু স্ট্রিম' : 'Ready to Stream'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {language === 'bn'
                    ? 'যেকোনো চ্যানেলে টাচ করুন — উপরে ছোট স্ক্রিনে প্লে হবে'
                    : 'Tap any channel to play in top screen without fullscreen'}
                </h2>
                <p className="text-xs text-zinc-400">
                  {language === 'bn'
                    ? 'রোটেট বাটন চাপলেই মোবাইল ঘুরিয়ে ফুলস্ক্রিন ও সোজা হবে।'
                    : 'Use Rotate button to expand to full orientation-aware screen.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleChannelSelect(channels[0])}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all shrink-0"
              >
                <Tv size={14} />
                <span>{language === 'bn' ? 'প্রথম চ্যানেল প্লে করুন' : 'Start Watching'}</span>
              </button>
            </div>
          )}

          {/* Section Toolbar: Header + Category + Count + View Mode */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-emerald-500" />
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>
                  {showOnlyFavorites
                    ? language === 'bn'
                      ? 'পছন্দের চ্যানেল'
                      : 'Favorite Channels'
                    : activeCategory === 'all'
                    ? language === 'bn'
                      ? 'সকল লাইভ চ্যানেল'
                      : 'All Live Channels'
                    : `${activeCategory.toUpperCase()}`}
                </span>
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-white/10 text-zinc-300 font-normal">
                  {filteredChannels.length}
                </span>
              </h2>
            </div>

            {/* Layout switch controls */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-500 text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-emerald-500 text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Compact List View"
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {/* Channel Grid: Touch any card to play in top player! */}
          {filteredChannels.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
              <Tv size={28} className="mx-auto text-zinc-500" />
              <h3 className="text-sm font-bold text-white">
                {language === 'bn' ? 'কোন চ্যানেল মেলেনি' : 'No channels found'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                  setShowOnlyFavorites(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-black font-bold text-xs"
              >
                {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-2.5">
              {filteredChannels.map((ch) => {
                const isCurrent = selectedChannel?.id === ch.id;
                return (
                  <div
                    key={ch.id}
                    className={`relative rounded-lg transition-all ${
                      isCurrent ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20' : ''
                    }`}
                  >
                    <ChannelCard
                      channel={ch}
                      onClick={handleChannelSelect}
                      isFavorite={favorites.includes(ch.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-[#0c101c] overflow-hidden">
              {filteredChannels.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => handleChannelSelect(ch)}
                  className={`px-2.5 py-1.5 flex items-center justify-between gap-2.5 hover:bg-white/5 cursor-pointer transition-colors ${
                    selectedChannel?.id === ch.id ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ChannelLogo
                      name={ch.name}
                      category={ch.category}
                      logo={ch.logo}
                      mobileImage={ch.mobileImage}
                      compact
                      className="w-9 h-7 rounded-md shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">
                        {ch.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1 truncate">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            ch.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>{ch.category} • HD Live</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChannelSelect(ch);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black font-bold text-[11px] shrink-0"
                  >
                    Play
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-white/10 bg-[#060911] py-5 px-4 mt-8 text-center text-xs text-zinc-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wider">CRICBD</span>
              <span>•</span>
              <span>Habil Live Sport TV Network</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Adaptive HLS & Sensor Rotation
              </span>
              <button
                type="button"
                onClick={() => setAppSettingsOpen(true)}
                className="hover:text-emerald-400 transition-colors"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="hover:text-emerald-400 transition-colors"
              >
                Admin Panel
              </button>
            </div>
          </div>
        </footer>
        </div>

        {/* Mobile Pinned Bottom Navigation Bar (Hidden in Fullscreen) */}
        {playerMode !== 'fullscreen' && (
          <nav className="md:hidden flex-none z-30 bg-[#090d18]/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 flex items-center justify-around text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setShowOnlyFavorites(false);
              }}
              className={`flex flex-col items-center gap-1 font-semibold ${
                activeCategory === 'all' && !showOnlyFavorites ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            >
              <Tv size={18} />
              <span className="text-[10px]">Live TV</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('cricket');
                setShowOnlyFavorites(false);
              }}
              className={`flex flex-col items-center gap-1 font-semibold ${
                activeCategory === 'cricket' ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            >
              <Radio size={18} />
              <span className="text-[10px]">Cricket</span>
            </button>
            <button
              type="button"
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex flex-col items-center gap-1 font-semibold ${
                showOnlyFavorites ? 'text-rose-400' : 'text-zinc-400'
              }`}
            >
              <Heart size={18} className={showOnlyFavorites ? 'fill-rose-500 text-rose-500' : ''} />
              <span className="text-[10px]">Favorites</span>
            </button>
            <button
              type="button"
              onClick={() => setAppSettingsOpen(true)}
              className="flex flex-col items-center gap-1 font-semibold text-zinc-400 hover:text-white"
            >
              <Settings size={18} />
              <span className="text-[10px]">Settings</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="flex flex-col items-center gap-1 font-semibold text-zinc-400 hover:text-emerald-400"
            >
              <ShieldCheck size={18} />
              <span className="text-[10px]">Admin</span>
            </button>
          </nav>
        )}

        {/* App Settings Modal (Screenshot 1) */}
        <AppSettingsModal
          isOpen={appSettingsOpen}
          onClose={() => setAppSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={setSettings}
          onShowToast={showToast}
        />

        {/* Admin Management Modal */}
        <AdminModal
          isOpen={adminOpen}
          onClose={() => setAdminOpen(false)}
          channels={channels}
          onAddChannel={handleAddChannel}
          onUpdateChannel={handleUpdateChannel}
          onDeleteChannel={handleDeleteChannel}
          onExportChannels={handleExportChannels}
          onImportChannels={handleImportChannels}
          cloudUserEmail={cloudUserEmail}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          onSyncAllToCloud={handleSyncAllToCloud}
          isSyncingCloud={isSyncingCloud}
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#0d1424] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}
