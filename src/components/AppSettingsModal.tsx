import React, { useState, useEffect } from 'react';
import { X, Check, Copy, ExternalLink, Info } from 'lucide-react';

export interface AppSettings {
  nightMode: boolean;
  dataSavingMode: boolean;
  onlyActiveChannels: boolean;
  showChannelStatusDots: boolean;
  autoReconnectOnError: boolean;
  autoPlayOnStartup: boolean;
  autoFullscreenOnChannelTap: boolean;
  hevcH265: boolean;
  hwAcceleration: boolean;
  retryDelay: number;
  showEpg: boolean;
}

const SETTINGS_STORAGE_KEY = 'cricbd_app_settings_v1';

export const defaultSettings: AppSettings = {
  nightMode: true,
  dataSavingMode: false,
  onlyActiveChannels: true,
  showChannelStatusDots: true,
  autoReconnectOnError: true,
  autoPlayOnStartup: true,
  autoFullscreenOnChannelTap: false,
  hevcH265: true,
  hwAcceleration: true,
  retryDelay: 1,
  showEpg: false,
};

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onShowToast?: (msg: string) => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggle = (key: keyof AppSettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    onUpdateSettings(updated);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
  };

  const cycleRetryDelay = () => {
    const delays = [1, 2, 3, 5];
    const currIdx = delays.indexOf(settings.retryDelay);
    const nextDelay = delays[(currIdx + 1) % delays.length];
    const updated = {
      ...settings,
      retryDelay: nextDelay,
    };
    onUpdateSettings(updated);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
    if (onShowToast) {
      onShowToast(`Retry Delay set to ${nextDelay}s`);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (onShowToast) onShowToast('App link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* 
        Container designed exactly like Screenshot 1:
        Rounded top corners on mobile, white card background with clean dark text
      */}
      <div
        className="w-full max-w-md bg-white text-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-zinc-100">
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">App Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Settings List */}
        <div className="flex-1 overflow-y-auto px-6 divide-y divide-zinc-100 text-sm">
          {/* 1. Night Mode */}
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">🌙</span> Night Mode
            </span>
            <Switch checked={settings.nightMode} onChange={() => toggle('nightMode')} />
          </div>

          {/* 2. Data Saving Mode */}
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">📶</span> Data Saving Mode (Lowest Quality)
            </span>
            <Switch checked={settings.dataSavingMode} onChange={() => toggle('dataSavingMode')} />
          </div>

          {/* 3. Only Active Channels */}
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">✅</span> Only Active Channels
            </span>
            <Switch checked={settings.onlyActiveChannels} onChange={() => toggle('onlyActiveChannels')} />
          </div>

          {/* 4. Show Channel Status Dots */}
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">🟢</span> Show Channel Status Dots
            </span>
            <Switch checked={settings.showChannelStatusDots} onChange={() => toggle('showChannelStatusDots')} />
          </div>

          {/* 5. Auto-Reconnect on Error */}
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">🔄</span> Auto-Reconnect on Error
            </span>
            <Switch checked={settings.autoReconnectOnError} onChange={() => toggle('autoReconnectOnError')} />
          </div>

          {/* 6. Auto-play on Startup */}
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">▶️</span> Auto-play on Startup
            </span>
            <Switch checked={settings.autoPlayOnStartup} onChange={() => toggle('autoPlayOnStartup')} />
          </div>

          {/* 7. Auto Fullscreen on Channel Tap */}
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">📱</span> Auto Fullscreen on Channel Tap
            </span>
            <Switch checked={settings.autoFullscreenOnChannelTap} onChange={() => toggle('autoFullscreenOnChannelTap')} />
          </div>

          {/* 8. HEVC / H.265 */}
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">🎬</span> HEVC / H.265
            </span>
            <Switch checked={settings.hevcH265} onChange={() => toggle('hevcH265')} />
          </div>

          {/* 9. HW Acceleration */}
          <div className="py-3 flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">⚡</span> HW Acceleration
            </span>
            <Switch checked={settings.hwAcceleration} onChange={() => toggle('hwAcceleration')} />
          </div>

          {/* 10. Retry Delay: 1s */}
          <button
            type="button"
            onClick={cycleRetryDelay}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
          >
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">⌛</span> Retry Delay: {settings.retryDelay}s
            </span>
            <span className="text-xs text-zinc-500 font-semibold px-2 py-0.5 rounded bg-zinc-100">
              Tap to Change
            </span>
          </button>

          {/* 11. Our others apps */}
          <button
            type="button"
            onClick={() => setActiveInfoModal('otherApps')}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
          >
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">⭐</span> Our others apps
            </span>
            <span className="text-zinc-400">›</span>
          </button>

          {/* 12. About app */}
          <button
            type="button"
            onClick={() => setActiveInfoModal('about')}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
          >
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">ℹ️</span> About app
            </span>
            <span className="text-zinc-400">›</span>
          </button>

          {/* 13. Contact Developer */}
          <a
            href="mailto:mohammadhabilmia@gmail.com"
            className="w-full py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
          >
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">✉️</span> Contact Developer
            </span>
            <span className="text-xs text-zinc-500">mohammadhabilmia@gmail.com</span>
          </a>

          {/* 14. Join Telegram Group */}
          <button
            type="button"
            onClick={() => setActiveInfoModal('telegram')}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
          >
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">📢</span> Join Telegram Group
            </span>
            <span className="text-zinc-400">›</span>
          </button>

          {/* 15. Check Latest Version */}
          <button
            type="button"
            onClick={() => {
              if (onShowToast) onShowToast('You are running the latest version: CRIC BD v2.5.0');
            }}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
          >
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">⬇️</span> Check Latest Version
            </span>
            <span className="text-xs text-emerald-600 font-bold">v2.5.0 (Latest)</span>
          </button>

          {/* 16. Share & Copy App Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-3 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
          >
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">📤</span> Share & Copy App Link
            </span>
            <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>

          {/* 17. Show EPG (TV Guide) */}
          <div className="py-3 flex items-center justify-between pb-6">
            <span className="flex items-center gap-2.5 font-medium text-zinc-800">
              <span className="text-base">📺</span> Show EPG (TV Guide)
            </span>
            <Switch checked={settings.showEpg} onChange={() => toggle('showEpg')} />
          </div>
        </div>
      </div>

      {/* Info Sub-modal */}
      {activeInfoModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setActiveInfoModal(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl text-zinc-900 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base">
                {activeInfoModal === 'about'
                  ? 'About CRIC BD'
                  : activeInfoModal === 'telegram'
                  ? 'Telegram Community'
                  : 'More Apps'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveInfoModal(null)}
                className="text-zinc-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {activeInfoModal === 'about' && (
              <div className="text-xs text-zinc-600 space-y-2">
                <p className="font-bold text-zinc-900 text-sm">CRIC BD — Live Sports & TV Network</p>
                <p>Version: 2.5.0 (Latest Release)</p>
                <p>Developer: Mohammad Habil Mia</p>
                <p>Features: 74+ Live Cricket, Sports, Movies, Kids & Entertainment channels with adaptive HLS and 90-degree sensor rotation.</p>
              </div>
            )}

            {activeInfoModal === 'telegram' && (
              <div className="text-xs text-zinc-600 space-y-2">
                <p className="font-semibold text-zinc-900">CRIC BD Official Community</p>
                <p>Get instant live match schedules, cricket scorecards, new channel stream updates, and support directly from our Telegram channel.</p>
                <button
                  type="button"
                  onClick={() => {
                    window.open('https://t.me/cricbdlive', '_blank');
                    setActiveInfoModal(null);
                  }}
                  className="w-full mt-2 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs"
                >
                  Open Telegram Channel
                </button>
              </div>
            )}

            {activeInfoModal === 'otherApps' && (
              <div className="text-xs text-zinc-600 space-y-2">
                <p className="font-semibold text-zinc-900">Habil Network Applications</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>CRIC BD Live TV & Scorecard</li>
                  <li>Live Sports HD Player</li>
                  <li>Bangla News & Entertainment Hub</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Switch Toggle Component matching the exact design in Screenshot 1
interface SwitchProps {
  checked: boolean;
  onChange: () => void;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 ${
        checked ? 'bg-[#515c74]' : 'bg-[#e2e8f0]'
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full bg-white shadow-md block transform transition-transform absolute top-0.5 left-0.5 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};
