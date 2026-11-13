import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Lock,
  Unlock,
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCw as ReloadIcon,
  List,
  LayoutGrid,
  SkipBack,
  SkipForward,
  AlertTriangle,
  Tv,
  Smartphone,
  X,
  Maximize2,
  Settings
} from 'lucide-react';
import { Channel } from '../types/channel';
import { ChannelLogo } from './ChannelLogo';

export type PlayerMode = 'inline' | 'fullscreen' | 'pip';

interface VideoPlayerProps {
  channel: Channel;
  channels: Channel[];
  playerMode: PlayerMode;
  onChangeMode: (mode: PlayerMode) => void;
  onClose: () => void;
  onSelectChannel: (channel: Channel) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onOpenSettings?: () => void;
  isLandscapeRotated?: boolean;
  onToggleLandscape?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  channels,
  playerMode,
  onChangeMode,
  onClose,
  onSelectChannel,
  onOpenSettings,
  isLandscapeRotated: externalLandscape,
  onToggleLandscape,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [objectFit, setObjectFit] = useState<'contain' | 'cover'>('contain');
  const [channelDrawerOpen, setChannelDrawerOpen] = useState(false);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  // 3-Tier Server State: 1 (Primary), 2 (Backup), 3 (Second Backup) + CORS/HTTP Proxy fallback
  const [activeServerIndex, setActiveServerIndex] = useState<number>(1);
  const [useProxy, setUseProxy] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef<number>(0);

  useEffect(() => {
    setActiveServerIndex(1);
    setUseProxy(false);
    retryCountRef.current = 0;
  }, [channel.id]);

  const rawStreamUrl =
    activeServerIndex === 3 && channel.server3StreamUrl
      ? channel.server3StreamUrl
      : activeServerIndex === 2 && channel.backupStreamUrl
      ? channel.backupStreamUrl
      : channel.streamUrl;

  const isHttpOnly = rawStreamUrl.trim().toLowerCase().startsWith('http://');
  const shouldUseProxy = isHttpOnly || useProxy;
  const activeStreamUrl = shouldUseProxy
    ? `/api/stream-proxy?url=${encodeURIComponent(rawStreamUrl.trim())}`
    : rawStreamUrl.trim();

  // Playback scrub timeline state (matches Screenshot 2 bottom scrub bar)
  const [currentTime, setCurrentTime] = useState(33); // simulated buffer offset: -00:27 of 01:00
  const duration = 60;

  // Rotate & Orientation states:
  const [internalLandscape, setInternalLandscape] = useState(false);
  const isLandscapeRotated = externalLandscape !== undefined ? externalLandscape : internalLandscape;
  const [isDeviceLandscape, setIsDeviceLandscape] = useState(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDeviceLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advanceToFallback = useCallback(() => {
    if (!isHttpOnly && !useProxy) {
      setUseProxy(true);
      return true;
    }
    if (activeServerIndex === 1 && channel.backupStreamUrl) {
      setUseProxy(false);
      retryCountRef.current = 0;
      setActiveServerIndex(2);
      return true;
    }
    if (activeServerIndex === 2 && channel.server3StreamUrl) {
      setUseProxy(false);
      retryCountRef.current = 0;
      setActiveServerIndex(3);
      return true;
    }
    return false;
  }, [activeServerIndex, channel.backupStreamUrl, channel.server3StreamUrl, isHttpOnly, useProxy]);

  // 1. Initialize and load HLS stream without reloading on rotation
  const initStream = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsConnecting(true);
    setStreamError(null);

    const clearWatchdog = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // Timeout Watchdog: If stream doesn't load within 4.5s, try proxy or next server automatically
    timeoutRef.current = setTimeout(() => {
      const switched = advanceToFallback();
      if (!switched) {
        setStreamError('স্ট্রীম লোড হতে বেশি সময় নিচ্ছে। অনুগ্রহ করে রিকানেক্ট বা অন্য সার্ভার ট্রাই করুন।');
        setIsConnecting(false);
      }
    }, 4500);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 12,
        maxMaxBufferLength: 30,
        startLevel: -1,
        enableWorker: true,
        lowLatencyMode: false,
        liveSyncDurationCount: 3,
        fragLoadingTimeOut: 7000,
        manifestLoadingTimeOut: 6000,
      });

      hlsRef.current = hls;
      hls.loadSource(activeStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearWatchdog();
        setIsConnecting(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        clearWatchdog();
        setIsConnecting(false);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          clearWatchdog();
          const switched = advanceToFallback();
          if (switched) {
            setStreamError(null);
            return;
          }
          if (retryCountRef.current < 1) {
            retryCountRef.current += 1;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
              return;
            }
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
              return;
            }
          }
          setStreamError('সকল সার্ভারে সংযোগ ব্যাহত হয়েছে। অনুগ্রহ করে রিকানেক্ট বা অন্য চ্যানেল ট্রাই করুন।');
          hls.destroy();
          setIsConnecting(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = activeStreamUrl;
      const onMeta = () => {
        clearWatchdog();
        setIsConnecting(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
      };
      const onNativeErr = () => {
        clearWatchdog();
        if (!advanceToFallback()) {
          setStreamError('এই চ্যানেলের স্ট্রিমটি বর্তমানে অফলাইন রয়েছে।');
          setIsConnecting(false);
        }
      };
      video.addEventListener('loadedmetadata', onMeta, { once: true });
      video.addEventListener('error', onNativeErr, { once: true });
    } else {
      clearWatchdog();
      setStreamError('এই ব্রাউজারে HLS স্ট্রিম সমর্থিত নয়।');
      setIsConnecting(false);
    }
  }, [activeStreamUrl, advanceToFallback]);

  useEffect(() => {
    initStream();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [initStream]);

  // Orientation change detector
  useEffect(() => {
    const handleOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setIsDeviceLandscape(isLandscape);
    };

    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientation);
    }

    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientation);
      }
    };
  }, []);

  // Prevent touch-drag from scrolling the background channel list
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const preventTouchScroll = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    el.addEventListener('touchmove', preventTouchScroll, { passive: false });
    return () => {
      el.removeEventListener('touchmove', preventTouchScroll);
    };
  }, []);

  // Auto-hide controls timer
  const resetControlTimer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!isLocked) {
      setShowControls(true);
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowVolumeSlider(false);
      }, 4000);
    }
  };

  const handleTouchVideo = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    if (showControls) {
      setShowControls(false);
      setShowVolumeSlider(false);
    } else {
      resetControlTimer();
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
    resetControlTimer();
  };

  const handleSeek = (seconds: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    }
    setCurrentTime((prev) => Math.min(duration, Math.max(0, prev + seconds)));
    resetControlTimer();
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
    resetControlTimer();
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
    resetControlTimer();
  };

  const handleRotateToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onToggleLandscape) {
      onToggleLandscape();
      try {
        if (!isLandscapeRotated) {
          if (containerRef.current && !document.fullscreenElement) {
            containerRef.current.requestFullscreen?.().catch(() => {});
          }
          if (screen.orientation && 'lock' in screen.orientation) {
            (screen.orientation as any).lock('landscape').catch(() => {});
          }
        } else {
          if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          }
          if (screen.orientation && 'unlock' in screen.orientation) {
            (screen.orientation as any).unlock().catch(() => {});
          }
        }
      } catch (_) {}
    } else {
      setInternalLandscape((prev) => {
        const next = !prev;
        try {
          if (next) {
            if (containerRef.current && !document.fullscreenElement) {
              containerRef.current.requestFullscreen?.().catch(() => {});
            }
            if (screen.orientation && 'lock' in screen.orientation) {
              (screen.orientation as any).lock('landscape').catch(() => {});
            }
          } else {
            if (document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => {});
            }
            if (screen.orientation && 'unlock' in screen.orientation) {
              (screen.orientation as any).unlock().catch(() => {});
            }
          }
        } catch (_) {}
        return next;
      });
    }
    resetControlTimer();
  };

  // Channel switching: previous and next
  const currentIndex = channels.findIndex((c) => c.id === channel.id);
  const handleNextChannel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex >= 0 && currentIndex < channels.length - 1) {
      onSelectChannel(channels[currentIndex + 1]);
    } else if (channels.length > 0) {
      onSelectChannel(channels[0]);
    }
    resetControlTimer();
  };

  const handlePrevChannel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      onSelectChannel(channels[currentIndex - 1]);
    } else if (channels.length > 0) {
      onSelectChannel(channels[channels.length - 1]);
    }
    resetControlTimer();
  };

  const need90DegreeRotation = isLandscapeRotated && !isDeviceLandscape;

  // Format time (e.g., -00:27 and 01:00 from Screenshot 2)
  const remainingSeconds = Math.max(0, duration - currentTime);
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Unique categories for the category picker drawer
  const categories = Array.from(new Set(channels.map((c) => c.category)));

  return (
    <div
      ref={containerRef}
      className={`${
        isLandscapeRotated
          ? 'fixed inset-0 z-50 bg-black w-screen h-screen overflow-hidden flex items-center justify-center'
          : 'w-full bg-[#090d18] rounded-none sm:rounded-2xl overflow-hidden border-b sm:border border-emerald-500/30 shadow-2xl relative'
      } select-none`}
      style={{
        touchAction: 'none',
        overscrollBehavior: 'contain',
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
      }}
    >
      {/* INNER PLAYER WRAPPER */}
      <div
        className={`relative ${
          isLandscapeRotated
            ? need90DegreeRotation
              ? 'absolute'
              : 'w-full h-full'
            : 'w-full flex flex-col'
        }`}
        style={
          isLandscapeRotated && need90DegreeRotation
            ? {
                width: '100vh',
                height: '100vw',
                maxWidth: '100vh',
                maxHeight: '100vw',
                transform: 'rotate(90deg)',
                transformOrigin: 'center center',
                position: 'absolute',
                top: 'calc(50% - 50vw)',
                left: 'calc(50% - 50vh)',
              }
            : undefined
        }
      >
        {/* VIDEO DISPLAY AREA */}
        <div
          className={`relative w-full ${
            isLandscapeRotated ? 'h-full' : 'aspect-video'
          } bg-black overflow-hidden cursor-pointer`}
          onClick={handleTouchVideo}
          onMouseMove={resetControlTimer}
        >
          <video
            ref={videoRef}
            playsInline
            autoPlay
            className={`w-full h-full ${
              objectFit === 'cover' ? 'object-cover' : 'object-contain'
            } bg-black`}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Loading Spinner */}
          {isConnecting && !streamError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 p-4 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin mb-2" />
              <div className="text-sm font-bold text-white tracking-wide mb-1">
                {channel.name} — কানেক্ট হচ্ছে...
              </div>
              <div className="text-xs text-emerald-400 font-semibold">
                সার্ভার {activeServerIndex} • দ্রুত লোড হচ্ছে
              </div>
            </div>
          )}

          {/* Stream Error Dialog */}
          {streamError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 p-4 text-center space-y-2">
              <AlertTriangle size={26} className="text-rose-400 mb-1" />
              <div className="text-xs font-bold text-white mb-1">{streamError}</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    initStream();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <ReloadIcon size={14} /> রিকানেক্ট করুন
                </button>
                {channel.backupStreamUrl && activeServerIndex === 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveServerIndex(2);
                      setStreamError(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <ReloadIcon size={14} /> সার্ভার ২ (ব্যাকআপ) ট্রাই করুন
                  </button>
                )}
                {channel.server3StreamUrl && activeServerIndex <= 2 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveServerIndex(3);
                      setStreamError(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <ReloadIcon size={14} /> সার্ভার ৩ ট্রাই করুন
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Screen Locked Badge */}
          {isLocked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLocked(false);
                setShowControls(true);
              }}
              className="absolute top-4 right-4 z-40 p-3 rounded-full bg-black/70 border border-white/20 text-emerald-400 shadow-2xl backdrop-blur-md active:scale-95"
              title="স্ক্রিন আনলক করুন"
            >
              <Lock size={20} />
            </button>
          )}

          {/* 
            ================================================================
            PLAYER OVERLAY (MATCHING SCREENSHOT 2 EXACTLY!)
            ================================================================
          */}
          {!isLocked && showControls && (
            <div
              className="absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 bg-gradient-to-t from-black/85 via-black/20 to-black/80 pointer-events-none transition-opacity duration-300"
            >
              {/* 
                TOP TOOLBAR:
                Left: Back arrow button + Channel name pill (Geo Super LIVE)
                Right: Circular glass icons: List, Grid, Reload, Lock, Aspect, HD, Settings
              */}
              <div className="flex items-center justify-between gap-2 pointer-events-auto">
                {/* Left side */}
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isLandscapeRotated) {
                        if (onToggleLandscape) {
                          onToggleLandscape();
                        } else {
                          setInternalLandscape(false);
                        }
                      } else {
                        onClose();
                      }
                    }}
                    title="Back"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all shrink-0"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  {/* Channel Name Pill (matching Screenshot 2: Geo Super LIVE) */}
                  <div className="px-3 sm:px-4 py-1.5 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center gap-2 shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[130px] sm:max-w-xs">
                      {channel.name}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white tracking-wider animate-pulse">
                      LIVE
                    </span>
                  </div>
                </div>

                {/* Right side circular glass icon buttons matching Screenshot 2 */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* 1. Channel List Drawer */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setChannelDrawerOpen(true);
                      setCategoryDrawerOpen(false);
                    }}
                    title="Channel List"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    <List size={18} />
                  </button>

                  {/* 2. Grid / Keypad / Categories Drawer */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryDrawerOpen(true);
                      setChannelDrawerOpen(false);
                    }}
                    title="Categories"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    <LayoutGrid size={17} />
                  </button>

                  {/* 3. Reconnect Stream */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      initStream();
                    }}
                    title="Reload Stream"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    <ReloadIcon size={17} />
                  </button>

                  {/* 4. Screen Lock */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLocked(true);
                      setShowControls(false);
                    }}
                    title="Lock Screen"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    <Lock size={17} />
                  </button>

                  {/* 5. Aspect Fit / PiP */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setObjectFit(objectFit === 'contain' ? 'cover' : 'contain');
                    }}
                    title="Aspect Ratio"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    <Maximize2 size={17} />
                  </button>

                  {/* 6. HD Badge Button */}
                  <div className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center justify-center text-[11px] font-black text-white tracking-widest uppercase">
                    HD
                  </div>

                  {/* 7. Settings Gear Icon (Opens Screenshot 1 App Settings!) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenSettings) onOpenSettings();
                    }}
                    title="App Settings"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              </div>

              {/* 
                CENTER PLAYBACK CONTROLS (MATCHING SCREENSHOT 2 EXACTLY!):
                ⏮   ↺ 10s   [ ⏸ / ▶ ]   ↻ 10s   ⏭
              */}
              <div className="flex items-center justify-center gap-4 sm:gap-8 my-auto pointer-events-auto">
                {/* Previous Channel */}
                <button
                  type="button"
                  onClick={handlePrevChannel}
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all shadow-lg"
                  title="Previous Channel"
                >
                  <SkipBack size={22} className="fill-white" />
                </button>

                {/* Rewind 10s */}
                <button
                  type="button"
                  onClick={(e) => handleSeek(-10, e)}
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex flex-col items-center justify-center text-white active:scale-90 transition-all shadow-lg"
                  title="Rewind 10s"
                >
                  <RotateCcw size={18} />
                  <span className="text-[8px] font-black -mt-0.5">10s</span>
                </button>

                {/* 
                  Center Play/Pause Large Translucent Glass Button
                  Exact white circular border and frosted center from Screenshot 2
                */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 hover:bg-white/30 border-2 border-white/70 backdrop-blur-md flex items-center justify-center shadow-2xl active:scale-90 transition-transform text-white"
                >
                  {isPlaying ? (
                    <Pause size={28} className="fill-white text-white" />
                  ) : (
                    <Play size={28} className="fill-white text-white translate-x-0.5" />
                  )}
                </button>

                {/* Forward 10s */}
                <button
                  type="button"
                  onClick={(e) => handleSeek(10, e)}
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex flex-col items-center justify-center text-white active:scale-90 transition-all shadow-lg"
                  title="Forward 10s"
                >
                  <RotateCw size={18} />
                  <span className="text-[8px] font-black -mt-0.5">10s</span>
                </button>

                {/* Next Channel */}
                <button
                  type="button"
                  onClick={handleNextChannel}
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all shadow-lg"
                  title="Next Channel"
                >
                  <SkipForward size={22} className="fill-white" />
                </button>
              </div>

              {/* 
                BOTTOM BAR WITH PROGRESS SCRUBBER (MATCHING SCREENSHOT 2):
                -00:27  [========⚪=======]  01:00  🔊  ⛶
              */}
              <div className="flex items-center gap-2.5 sm:gap-4 px-2 sm:px-4 py-2 pointer-events-auto">
                {/* Monospace time on left: -00:27 */}
                <span className="text-xs sm:text-sm font-mono font-medium text-white/90 shrink-0">
                  -{formatTime(remainingSeconds)}
                </span>

                {/* Scrubber Progress Track */}
                <div className="flex-1 relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCurrentTime(val);
                      if (videoRef.current) {
                        videoRef.current.currentTime = val;
                      }
                      resetControlTimer();
                    }}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>

                {/* Time on right: 01:00 */}
                <span className="text-xs sm:text-sm font-mono font-medium text-white/90 shrink-0">
                  {formatTime(duration)}
                </span>

                {/* Volume icon button */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVolumeSlider(!showVolumeSlider);
                    }}
                    className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shrink-0"
                  >
                    {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  </button>

                  {/* Volume popup slider */}
                  {showVolumeSlider && (
                    <div
                      className="absolute bottom-10 right-0 p-2.5 rounded-xl bg-black/85 border border-white/20 backdrop-blur-md flex items-center gap-2 z-30 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button type="button" onClick={toggleMute} className="text-white hover:text-emerald-400">
                        {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-20 accent-emerald-500 h-1 bg-white/20 rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Rotate / Landscape fullscreen toggle */}
                <button
                  type="button"
                  onClick={handleRotateToggle}
                  title="Rotate / Fullscreen"
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shrink-0"
                >
                  <Smartphone size={17} className={isLandscapeRotated ? 'text-amber-400' : 'text-white'} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 
          SUB-BAR (Only in inline mode):
          Stationary, fixed height, clean and modern
        */}
        {!isLandscapeRotated && (
          <div className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <ChannelLogo
                name={channel.name}
                category={channel.category}
                logo={channel.logo}
                compact
                className="w-9 h-7 rounded-md shrink-0"
              />
              <div className="truncate">
                <span className="font-bold text-xs sm:text-sm text-white mr-1.5">
                  {channel.name}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {channel.category} • HD Live
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {(channel.backupStreamUrl || channel.server3StreamUrl) && (
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveServerIndex(1);
                      setStreamError(null);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                      activeServerIndex === 1 ? 'bg-emerald-500 text-black shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    সার্ভার ১
                  </button>
                  {channel.backupStreamUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveServerIndex(2);
                        setStreamError(null);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                        activeServerIndex === 2 ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      সার্ভার ২
                    </button>
                  )}
                  {channel.server3StreamUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveServerIndex(3);
                        setStreamError(null);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                        activeServerIndex === 3 ? 'bg-indigo-500 text-white shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      সার্ভার ৩
                    </button>
                  )}
                </div>
              )}

              {/* Settings button in sub-bar */}
              <button
                type="button"
                onClick={onOpenSettings}
                title="App Settings"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors"
              >
                <Settings size={15} />
              </button>
            </div>
          </div>
        )}

        {/* CHANNEL DRAWER (opened from the List button) */}
        {channelDrawerOpen && (
          <div
            className="absolute top-0 right-0 bottom-0 w-72 sm:w-80 bg-[#090d18]/95 border-l border-white/15 backdrop-blur-xl z-40 p-4 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Tv size={16} className="text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Live Channels</h4>
              </div>
              <button
                type="button"
                onClick={() => setChannelDrawerOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1">
              {React.useMemo(() => {
                const map = new Map<string, Channel>();
                for (const c of channels) {
                  if (c && c.name) {
                    const key = c.name.trim().toLowerCase();
                    if (!map.has(key)) {
                      map.set(key, c);
                    }
                  }
                }
                return Array.from(map.values());
              }, [channels]).map((ch) => {
                const isActive = ch.id === channel.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      onSelectChannel(ch);
                      setChannelDrawerOpen(false);
                    }}
                    className={`w-full px-2 py-1.5 rounded-xl text-left flex items-center justify-between gap-2 text-xs transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ChannelLogo
                        name={ch.name}
                        category={ch.category}
                        logo={ch.logo}
                        compact
                        className="w-8 h-6 rounded shrink-0"
                      />
                      <span className="truncate">{ch.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0">{ch.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CATEGORIES DRAWER (opened from the Grid / Keypad button) */}
        {categoryDrawerOpen && (
          <div
            className="absolute top-0 right-0 bottom-0 w-72 sm:w-80 bg-[#090d18]/95 border-l border-white/15 backdrop-blur-xl z-40 p-4 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <LayoutGrid size={16} className="text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Categories</h4>
              </div>
              <button
                type="button"
                onClick={() => setCategoryDrawerOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1">
              {categories.map((cat) => {
                const count = channels.filter((c) => c.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      const firstInCat = channels.find((c) => c.category === cat);
                      if (firstInCat) onSelectChannel(firstInCat);
                      setCategoryDrawerOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs bg-white/5 hover:bg-white/10 text-zinc-200 transition-colors"
                  >
                    <span className="font-semibold">{cat}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-400">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
