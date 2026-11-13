import React, { useState } from 'react';
import {
  X,
  Shield,
  Key,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  LogOut,
  Server,
  Image as ImageIcon,
  Camera,
  Cloud,
  CloudOff
} from 'lucide-react';
import { Channel } from '../types/channel';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  onAddChannel: (channel: Channel) => void;
  onUpdateChannel: (channel: Channel) => void;
  onDeleteChannel: (channelId: string) => void;
  onExportChannels: () => void;
  onImportChannels: (channels: Channel[]) => void;
  cloudUserEmail?: string | null;
  onGoogleSignIn?: () => Promise<void>;
  onGoogleSignOut?: () => Promise<void>;
  onSyncAllToCloud?: () => Promise<void>;
  isSyncingCloud?: boolean;
}

async function compressImageToDataUrl(file: File, maxDimension: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const isPng = file.type === 'image/png';
        let dataUrl = canvas.toDataURL(isPng ? 'image/webp' : 'image/jpeg', 0.82);
        if (dataUrl.length > 180000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        }
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  channels,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onExportChannels,
  onImportChannels,
  cloudUserEmail,
  onGoogleSignIn,
  onGoogleSignOut,
  onSyncAllToCloud,
  isSyncingCloud = false,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Form State
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cricket');
  const [logo, setLogo] = useState('');
  const [mobileImage, setMobileImage] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [backupStreamUrl, setBackupStreamUrl] = useState('');
  const [server3StreamUrl, setServer3StreamUrl] = useState('');
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  const [isLive, setIsLive] = useState(true);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'habil123') {
      setIsAuthenticated(true);
      setErrorMsg('');
      setPasswordInput('');
    } else {
      setErrorMsg('ভুল পাসওয়ার্ড। অনুগ্রহ করে সঠিক এডমিন পাসওয়ার্ড দিন।');
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 256);
      setLogo(compressed);
      setUploadNotice('লোগো ছবি সফলভাবে যোগ হয়েছে!');
      setTimeout(() => setUploadNotice(null), 2500);
    } catch {
      setUploadNotice('ছবি লোড করা যায়নি। অনুগ্রহ করে অন্য ছবি চেষ্টা করুন।');
    }
  };

  const handleMobileImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 540);
      setMobileImage(compressed);
      setUploadNotice('মোবাইল ছবি সফলভাবে যোগ হয়েছে!');
      setTimeout(() => setUploadNotice(null), 2500);
    } catch {
      setUploadNotice('ছবি লোড করা যায়নি। অনুগ্রহ করে অন্য ছবি চেষ্টা করুন।');
    }
  };

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !streamUrl.trim()) {
      setUploadNotice('অনুগ্রহ করে চ্যানেলের নাম ও সার্ভার ১ লিংক দিন।');
      return;
    }

    if (editingChannelId) {
      const existing = channels.find((c) => c.id === editingChannelId);
      if (existing) {
        onUpdateChannel({
          ...existing,
          name: name.trim(),
          category,
          logo: logo.trim(),
          mobileImage: mobileImage.trim() || undefined,
          streamUrl: streamUrl.trim(),
          backupStreamUrl: backupStreamUrl.trim() || undefined,
          server3StreamUrl: server3StreamUrl.trim() || undefined,
          status,
          isLive,
        });
      }
      setEditingChannelId(null);
    } else {
      const newChan: Channel = {
        id: `custom_${Date.now()}`,
        name: name.trim(),
        category,
        logo: logo.trim() || mobileImage.trim() || '',
        mobileImage: mobileImage.trim() || undefined,
        streamUrl: streamUrl.trim(),
        backupStreamUrl: backupStreamUrl.trim() || undefined,
        server3StreamUrl: server3StreamUrl.trim() || undefined,
        status,
        isLive,
      };
      onAddChannel(newChan);
    }

    // Reset Form
    setName('');
    setLogo('');
    setMobileImage('');
    setStreamUrl('');
    setBackupStreamUrl('');
    setServer3StreamUrl('');
    setCategory('Cricket');
    setStatus('online');
    setIsLive(true);
  };

  const handleStartEdit = (ch: Channel) => {
    setEditingChannelId(ch.id);
    setName(ch.name);
    setCategory(ch.category);
    setLogo(ch.logo || '');
    setMobileImage(ch.mobileImage || '');
    setStreamUrl(ch.streamUrl || '');
    setBackupStreamUrl(ch.backupStreamUrl || '');
    setServer3StreamUrl(ch.server3StreamUrl || '');
    setStatus(ch.status === 'online' ? 'online' : 'offline');
    setIsLive(ch.isLive);
  };

  const handleCancelEdit = () => {
    setEditingChannelId(null);
    setName('');
    setLogo('');
    setMobileImage('');
    setStreamUrl('');
    setBackupStreamUrl('');
    setServer3StreamUrl('');
  };

  const handleQuickToggle = (ch: Channel) => {
    onUpdateChannel({
      ...ch,
      status: ch.status === 'online' ? 'offline' : 'online',
    });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportChannels(parsed);
          setUploadNotice('ব্যাকআপ চ্যানেল ইমপোর্ট সম্পন্ন হয়েছে!');
        }
      } catch {
        setUploadNotice('সঠিক JSON ফাইল নির্বাচন করুন।');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0d121f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#090d16]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">এডমিন কন্ট্রোল প্যানেল (স্থায়ী সেভ)</h2>
              <p className="text-xs text-zinc-400">নতুন চ্যানেল, ৩-সার্ভার ও মোবাইল লোগো/ছবি যোগ করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 max-h-[82vh] overflow-y-auto">
          {!isAuthenticated ? (
            /* Login Screen */
            <form onSubmit={handleLogin} className="max-w-sm mx-auto py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                <Key size={28} />
              </div>
              <h3 className="text-lg font-bold text-white">এডমিন লগইন</h3>
              <p className="text-xs text-zinc-400">
                চ্যানেল যোগ, এডিট ও স্থায়ীভাবে সংরক্ষণ করতে পাসওয়ার্ড দিন।
              </p>

              {errorMsg && (
                <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন..."
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-center text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20"
              >
                এডমিন প্যানেলে প্রবেশ করুন
              </button>
            </form>
          ) : (
            /* Admin Management Interface */
            <div className="space-y-5">
              {/* Cloud Sync Banner */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs">
                  {cloudUserEmail ? (
                    <>
                      <Cloud size={16} className="text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-emerald-300">ক্লাউড স্থায়ী সেভ চালু আছে</div>
                        <div className="text-[11px] text-zinc-400">{cloudUserEmail} — নতুন চ্যানেল কখনো হারাবে না</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <CloudOff size={16} className="text-amber-400 shrink-0" />
                      <div>
                        <div className="font-bold text-amber-300">Google ক্লাউড সিঙ্ক যুক্ত করুন</div>
                        <div className="text-[11px] text-zinc-400">যেকোনো ডিভাইসে স্থায়ী ব্যাকআপ রাখতে Google লগইন করুন</div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cloudUserEmail ? (
                    <>
                      {onSyncAllToCloud && (
                        <button
                          type="button"
                          onClick={onSyncAllToCloud}
                          disabled={isSyncingCloud}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold disabled:opacity-50"
                        >
                          {isSyncingCloud ? 'সিঙ্ক হচ্ছে...' : 'সব ক্লাউডে সেভ করুন'}
                        </button>
                      )}
                      {onGoogleSignOut && (
                        <button
                          type="button"
                          onClick={onGoogleSignOut}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px]"
                        >
                          সাইন আউট
                        </button>
                      )}
                    </>
                  ) : (
                    onGoogleSignIn && (
                      <button
                        type="button"
                        onClick={onGoogleSignIn}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold shadow"
                      >
                        Google দিয়ে কানেক্ট করুন
                      </button>
                    )
                  )}
                </div>
              </div>

              {uploadNotice && (
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>{uploadNotice}</span>
                </div>
              )}

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-lg font-bold text-white">{channels.length}</div>
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">মোট চ্যানেল</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-lg font-bold text-emerald-400">
                    {channels.filter((c) => c.status === 'online').length}
                  </div>
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold">সচল (Online)</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-lg font-bold text-rose-400">
                    {channels.filter((c) => c.status === 'offline').length}
                  </div>
                  <div className="text-[10px] text-rose-400 uppercase font-semibold">বন্ধ (Offline)</div>
                </div>
              </div>

              {/* Add / Edit Channel Form */}
              <form
                onSubmit={handleSaveChannel}
                className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {editingChannelId ? <Edit2 size={15} /> : <Plus size={15} />}
                    <span>{editingChannelId ? 'চ্যানেল ও সার্ভার এডিট করুন' : 'নতুন চ্যানেল যোগ করুন (স্থায়ী)'}</span>
                  </h4>
                  {editingChannelId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      বাতিল করুন
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      চ্যানেলের নাম *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="যেমন: Star Sports 1 HD"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      ক্যাটাগরি
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Cricket">Cricket</option>
                      <option value="Football">Football</option>
                      <option value="News">News</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Movies">Movies</option>
                      <option value="Kids">Kids</option>
                      <option value="Music">Music</option>
                      <option value="Sports">Sports</option>
                    </select>
                  </div>
                </div>

                {/* Channel Logo + Mobile Image Upload & URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Channel Logo */}
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                        <ImageIcon size={13} className="text-emerald-400" />
                        <span>চ্যানেল লোগো (ছবি / লিংক)</span>
                      </label>
                      {logo && (
                        <button
                          type="button"
                          onClick={() => setLogo('')}
                          className="text-[10px] text-rose-400 hover:text-rose-300"
                        >
                          মুছুন
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {logo && (
                        <img
                          src={logo}
                          alt="Logo preview"
                          className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 shrink-0 border border-white/20"
                        />
                      )}
                      <input
                        type="text"
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        placeholder="লোগো লিংক অথবা নিচের গ্যালারি বাটন..."
                        className="flex-1 min-w-0 px-2.5 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <label className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      <Camera size={13} />
                      <span>মোবাইল থেকে লোগো ছবি যোগ করুন</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Mobile Image / Banner */}
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                        <ImageIcon size={13} className="text-cyan-400" />
                        <span>মোবাইল ছবি / ব্যানার (ঐচ্ছিক)</span>
                      </label>
                      {mobileImage && (
                        <button
                          type="button"
                          onClick={() => setMobileImage('')}
                          className="text-[10px] text-rose-400 hover:text-rose-300"
                        >
                          মুছুন
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {mobileImage && (
                        <img
                          src={mobileImage}
                          alt="Mobile banner preview"
                          className="w-14 h-10 rounded-lg object-cover shrink-0 border border-white/20"
                        />
                      )}
                      <input
                        type="text"
                        value={mobileImage}
                        onChange={(e) => setMobileImage(e.target.value)}
                        placeholder="ছবির লিংক অথবা গ্যালারি থেকে সিলেক্ট..."
                        className="flex-1 min-w-0 px-2.5 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <label className="w-full py-1.5 px-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      <Camera size={13} />
                      <span>মোবাইল গ্যালারি থেকে ছবি যোগ করুন</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMobileImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* 3-Tier Server Stream URLs */}
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Server size={14} />
                    <span>৩-সার্ভার অটো সুইচ লিংক (সার্ভার ১ → ২ → ৩)</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-0.5">
                      সার্ভার ১ (প্রাইমারি .m3u8 লিংক) *
                    </label>
                    <input
                      type="url"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      placeholder="https://server1.com/index.m3u8"
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-0.5">
                      সার্ভার ২ (ব্যাকআপ লিংক — ঐচ্ছিক)
                    </label>
                    <input
                      type="url"
                      value={backupStreamUrl}
                      onChange={(e) => setBackupStreamUrl(e.target.value)}
                      placeholder="https://server2.com/index.m3u8"
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-0.5">
                      সার্ভার ৩ (দ্বিতীয় ব্যাকআপ — ঐচ্ছিক)
                    </label>
                    <input
                      type="url"
                      value={server3StreamUrl}
                      onChange={(e) => setServer3StreamUrl(e.target.value)}
                      placeholder="https://server3.com/index.m3u8"
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={status === 'online'}
                      onChange={(e) => setStatus(e.target.checked ? 'online' : 'offline')}
                      className="rounded accent-emerald-500"
                    />
                    <span>চ্যানেল অ্যাক্টিভ (Online)</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLive}
                      onChange={(e) => setIsLive(e.target.checked)}
                      className="rounded accent-red-500"
                    />
                    <span>LIVE ব্যাজ দেখান</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 size={14} />
                  <span>{editingChannelId ? 'চ্যানেল আপডেট ও স্থায়ী সেভ করুন' : 'চ্যানেল স্থায়ীভাবে যোগ করুন'}</span>
                </button>
              </form>

              {/* Channel List Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    সকল চ্যানেল ({channels.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onExportChannels}
                      title="Export Backup JSON"
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] flex items-center gap-1"
                    >
                      <Download size={12} /> Export
                    </button>
                    <label className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] flex items-center gap-1 cursor-pointer">
                      <Upload size={12} /> Import
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-black/40 overflow-hidden max-h-56 overflow-y-auto">
                  {channels.map((ch) => (
                    <div
                      key={ch.id}
                      className="p-2.5 flex items-center justify-between gap-2 hover:bg-white/5 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleQuickToggle(ch)}
                          title="Toggle Online/Offline"
                          className={`w-3 h-3 rounded-full shrink-0 transition-transform hover:scale-125 ${
                            ch.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {ch.logo && (
                          <img
                            src={ch.logo}
                            alt=""
                            className="w-6 h-5 rounded object-contain bg-white/90 p-0.5 shrink-0"
                          />
                        )}
                        <div className="truncate">
                          <span className="font-bold text-white mr-1.5">{ch.name}</span>
                          <span className="text-[10px] text-zinc-400 font-medium px-1.5 py-0.2 rounded bg-white/5">
                            {ch.category}
                          </span>
                          {(ch.backupStreamUrl || ch.server3StreamUrl) && (
                            <span className="ml-2 text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              Multi-Server
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(ch)}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteChannel(ch.id)}
                          className="p-1 rounded bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logout & Exit */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAuthenticated(false)}
                  className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1"
                >
                  <LogOut size={13} /> এডমিন লক করুন
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
