import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  Volume1,
  VolumeX,
  Music,
  Disc,
  Globe,
  Download,
  Smartphone,
  CheckCircle2,
  Sliders,
  Sparkles,
  Zap,
  Check,
  Laptop,
  Share2,
  Info
} from "lucide-react";
import { audio, BGMTheme } from "../lib/audio";
import { useLanguage, Language } from "../context/LanguageContext";

export type SettingsSubTab = "audio" | "language" | "install";

interface SettingsViewProps {
  initialSubTab?: SettingsSubTab;
  onInstallPwa: () => void;
  isPwaInstalled: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  initialSubTab = "audio",
  onInstallPwa,
  isPwaInstalled,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsSubTab>(initialSubTab);

  // Audio State
  const [bgmOn, setBgmOn] = useState<boolean>(() => audio.getPlayingStatus());
  const [volume, setVolume] = useState<number>(() => audio.getBgmVolume());
  const [currentTheme, setCurrentTheme] = useState<BGMTheme>(() => audio.getBgmTheme());
  const [sfxTested, setSfxTested] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    setBgmOn(audio.getPlayingStatus());
    setVolume(audio.getBgmVolume());
    setCurrentTheme(audio.getBgmTheme());
  }, []);

  const toggleBGM = () => {
    try {
      if (bgmOn) {
        audio.stopBGM();
        setBgmOn(false);
      } else {
        audio.startBGM(currentTheme);
        setBgmOn(true);
      }
    } catch (err) {
      console.warn("BGM toggle failed:", err);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    audio.setBgmVolume(newVol);
    if (newVol > 0 && !bgmOn) {
      audio.startBGM(currentTheme);
      setBgmOn(true);
    } else if (newVol === 0 && bgmOn) {
      audio.stopBGM();
      setBgmOn(false);
    }
  };

  const handlePresetVolume = (vol: number) => {
    setVolume(vol);
    audio.setBgmVolume(vol);
    if (vol > 0 && !bgmOn) {
      audio.startBGM(currentTheme);
      setBgmOn(true);
    } else if (vol === 0 && bgmOn) {
      audio.stopBGM();
      setBgmOn(false);
    }
  };

  const handleSelectTheme = (theme: BGMTheme) => {
    setCurrentTheme(theme);
    audio.setBgmTheme(theme);
    if (!bgmOn) {
      audio.startBGM(theme);
      setBgmOn(true);
    }
  };

  const testSfx = (type: "forge" | "victory" | "element") => {
    try {
      if (type === "forge") {
        audio.playForgingSound();
      } else if (type === "victory") {
        audio.playVictory();
      } else {
        audio.playElementSound("api");
      }
      setSfxTested(type);
      setTimeout(() => setSfxTested(null), 1200);
    } catch (_) {}
  };

  const themes: { id: BGMTheme; labelKey: string; icon: string; descId: string; descEn: string }[] = [
    {
      id: "cozy",
      labelKey: "bgm.theme_cozy",
      icon: "🏡",
      descId: "110 BPM • Melodi Santai & Cozy Pentatonik",
      descEn: "110 BPM • Relaxed & Cozy Pentatonic Melodies",
    },
    {
      id: "battle",
      labelKey: "bgm.theme_battle",
      icon: "⚔️",
      descId: "138 BPM • Rhythm Pertarungan RPG Semangat",
      descEn: "138 BPM • High Energy RPG Battle Rhythm",
    },
    {
      id: "shrine",
      labelKey: "bgm.theme_shrine",
      icon: "⛩️",
      descId: "88 BPM • Nuansa Kuil Mistik & Tradisional",
      descEn: "88 BPM • Mystical Shrine & Traditional Ambience",
    },
    {
      id: "vanguard",
      labelKey: "bgm.theme_vanguard",
      icon: "⚡",
      descId: "125 BPM • Modern Synthwave & High Tempo",
      descEn: "125 BPM • Cybernetic Synthwave & Fast Beats",
    },
  ];

  const VolumeIcon = bgmOn ? (volume > 0.4 ? Volume2 : Volume1) : VolumeX;

  const subNavItems = [
    {
      id: "audio" as const,
      labelId: "Audio & BGM",
      labelEn: "Audio & BGM",
      descId: "Musik & Suara",
      descEn: "Music & Sounds",
      icon: Volume2,
      activeColor: "from-amber-500 to-yellow-600 text-slate-950",
    },
    {
      id: "language" as const,
      labelId: "Pilihan Bahasa",
      labelEn: "Language",
      descId: "ID / EN",
      descEn: "ID / EN",
      icon: Globe,
      activeColor: "from-cyan-500 to-blue-600 text-slate-950",
    },
    {
      id: "install" as const,
      labelId: "Install Aplikasi",
      labelEn: "Install App",
      descId: "PWA Mobile",
      descEn: "Mobile PWA",
      icon: Download,
      activeColor: "from-emerald-500 to-teal-600 text-slate-950",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 font-mono">
      {/* Settings Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                {language === "id" ? "PENGATURAN & PREFERENSI" : "SETTINGS & PREFERENCES"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "id"
                  ? "Atur soundtrack audio, ganti bahasa antarmuka, dan pasang aplikasi PWA."
                  : "Customize background music, interface language, and install PWA application."}
              </p>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-bold">
            {language === "id" ? "Sistem Siap" : "System Ready"}
          </span>
        </div>
      </div>

      {/* Submenu Tabs Bar */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-lg">
        {subNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 sm:py-3 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? `bg-gradient-to-r ${item.activeColor} shadow-md scale-[1.02]`
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="text-center sm:text-left">
                <span className="block leading-tight font-mono">
                  {language === "id" ? item.labelId : item.labelEn}
                </span>
                <span
                  className={`hidden sm:block text-[9px] font-medium leading-none mt-0.5 ${
                    isActive ? "opacity-90 text-slate-900" : "text-slate-400"
                  }`}
                >
                  {language === "id" ? item.descId : item.descEn}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Submenu Content Panels */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {/* 1. AUDIO & SOUNDTRACK SUBMENU */}
          {activeTab === "audio" && (
            <motion.div
              key="settings-audio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {/* Master BGM Card */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-2xl border ${
                        bgmOn
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      <Music className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                        {language === "id" ? "Soundtrack Musik Latar (BGM)" : "Background Music (BGM)"}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {language === "id"
                          ? "Musik dinamis 8-bit / Synthwave yang mengiringi petualangan berburu Nekomon"
                          : "Dynamic 8-bit & Synthwave tracks generated in real-time by Web Audio synthesizer"}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={toggleBGM}
                    className={`relative inline-flex h-8 w-15 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      bgmOn ? "bg-amber-500" : "bg-slate-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                        bgmOn ? "translate-x-7 bg-yellow-400" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Equalizer Visualizer & Current Theme Badge */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Visualizer bars */}
                    <div className="flex items-end gap-1.5 h-8 px-2 bg-slate-900 border border-slate-800 rounded-xl">
                      {[0.3, 0.7, 0.9, 0.4, 0.8, 0.5, 0.95, 0.6].map((bar, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 rounded-full transition-all duration-300 ${
                            bgmOn
                              ? "bg-gradient-to-t from-amber-500 to-yellow-400 animate-pulse"
                              : "bg-slate-700 h-2"
                          }`}
                          style={{
                            height: bgmOn ? `${Math.max(20, bar * 100)}%` : "20%",
                            animationDelay: `${idx * 120}ms`,
                          }}
                        />
                      ))}
                    </div>

                    <div>
                      <span className="text-xs font-black text-slate-200 block">
                        {bgmOn
                          ? language === "id"
                            ? "Status: Musik Sedang Dimainkan"
                            : "Status: Music Playing"
                          : language === "id"
                          ? "Status: Musik Dinonaktifkan"
                          : "Status: Muted"}
                      </span>
                      <span className="text-[11px] text-amber-400 font-bold block">
                        {language === "id" ? "Tema Aktif: " : "Active Theme: "}
                        {currentTheme.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={toggleBGM}
                      className={`px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        bgmOn
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20"
                      }`}
                    >
                      {bgmOn
                        ? language === "id"
                          ? "Matikan Musik ⏸️"
                          : "Mute BGM ⏸️"
                        : language === "id"
                        ? "Nyalakan Musik ▶️"
                        : "Play BGM ▶️"}
                    </button>
                  </div>
                </div>

                {/* Volume Slider Section */}
                <div className="flex flex-col gap-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-850">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <VolumeIcon className="w-4 h-4 text-amber-400" />
                      <span>{language === "id" ? "Volume Soundtrack BGM" : "BGM Soundtrack Volume"}</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
                  />

                  {/* Preset Volume Buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[
                      { label: "Mute (0%)", val: 0 },
                      { label: "25%", val: 0.25 },
                      { label: "50%", val: 0.5 },
                      { label: "100%", val: 1.0 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetVolume(preset.val)}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          Math.abs(volume - preset.val) < 0.05
                            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Soundtrack Theme Selector */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-200 flex items-center gap-2">
                      <Disc className="w-4 h-4 text-amber-400 animate-spin-slow" />
                      <span>{language === "id" ? "Pilih Tema Suasana Musik:" : "Select Music Atmosphere Theme:"}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {themes.map((th) => {
                      const isSelected = currentTheme === th.id;
                      return (
                        <button
                          key={th.id}
                          onClick={() => handleSelectTheme(th.id)}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer relative overflow-hidden ${
                            isSelected
                              ? "bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10"
                              : "bg-slate-950/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700"
                          }`}
                        >
                          <span className="text-2xl shrink-0 p-1.5 bg-slate-900/90 rounded-xl border border-slate-800">
                            {th.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-black text-xs uppercase tracking-wider ${
                                  isSelected ? "text-amber-300" : "text-slate-200"
                                }`}
                              >
                                {t(th.labelKey)}
                              </span>
                              {isSelected && (
                                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md">
                                  {language === "id" ? "AKTIF" : "ACTIVE"}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                              {language === "id" ? th.descId : th.descEn}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SFX Audio Test Buttons */}
                <div className="border-t border-slate-800 pt-4 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {language === "id" ? "Uji Efek Suara (Sound FX):" : "Test Sound Effects (Sound FX):"}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => testSfx("forge")}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      🔨 {sfxTested === "forge" ? "Playing..." : language === "id" ? "Suara Forge" : "Forge SFX"}
                    </button>
                    <button
                      onClick={() => testSfx("victory")}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      🏆 {sfxTested === "victory" ? "Playing..." : language === "id" ? "Suara Menang" : "Victory SFX"}
                    </button>
                    <button
                      onClick={() => testSfx("element")}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      🔥 {sfxTested === "element" ? "Playing..." : language === "id" ? "Suara Elemen" : "Element SFX"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. LANGUAGE SUBMENU */}
          {activeTab === "language" && (
            <motion.div
              key="settings-language"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div className="bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col gap-5">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    {language === "id" ? "Pilihan Bahasa Antarmuka (Language)" : "Interface Language Selection"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === "id"
                      ? "Pilih bahasa tampilan untuk seluruh tombol, teks panduan, dialog pertarungan, dan kartu Nekomon."
                      : "Choose your preferred display language for UI labels, battle prompts, game guides, and cards."}
                  </p>
                </div>

                {/* Language Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Indonesian Option */}
                  <button
                    onClick={() => setLanguage("id")}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left cursor-pointer relative overflow-hidden ${
                      language === "id"
                        ? "bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-slate-900 border-cyan-400 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-400/50"
                        : "bg-slate-950/70 border-slate-800 hover:bg-slate-850 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-3xl p-2 bg-slate-900 rounded-2xl border border-slate-800 shrink-0">
                      🇮🇩
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-100">
                          Bahasa Indonesia
                        </span>
                        {language === "id" && (
                          <span className="text-[10px] bg-cyan-400 text-slate-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            AKTIF
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Bahasa resmi game Nekomon untuk trainer Indonesia. Menggunakan istilah lokal dan panduan berbahasa Indonesia.
                      </p>
                    </div>
                  </button>

                  {/* English Option */}
                  <button
                    onClick={() => setLanguage("en")}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left cursor-pointer relative overflow-hidden ${
                      language === "en"
                        ? "bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-slate-900 border-cyan-400 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-400/50"
                        : "bg-slate-950/70 border-slate-800 hover:bg-slate-850 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-3xl p-2 bg-slate-900 rounded-2xl border border-slate-800 shrink-0">
                      🇬🇧
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-100">
                          English (International)
                        </span>
                        {language === "en" && (
                          <span className="text-[10px] bg-cyan-400 text-slate-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Global English localization for international players. Complete cards, lore descriptions, and guides.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-slate-400">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    {language === "id"
                      ? "Preferensi bahasa tersimpan secara otomatis di browser dan perangkat Anda."
                      : "Your language preference is automatically saved locally to your device and browser."}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. INSTALL APP (PWA) SUBMENU */}
          {activeTab === "install" && (
            <motion.div
              key="settings-install"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {/* Install Status Card */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                      <Download className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                        {language === "id" ? "Instalasi Aplikasi Nekomon (PWA)" : "Install Nekomon Application (PWA)"}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {language === "id"
                          ? "Pasang Nekomon langsung ke layar utama ponsel / tablet untuk pengalaman bermain layar penuh tanpa address bar!"
                          : "Install Nekomon directly to your home screen for full-screen immersive experience!"}
                      </p>
                    </div>
                  </div>

                  {/* App Status Badge */}
                  <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isPwaInstalled ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-200">
                      {isPwaInstalled
                        ? language === "id"
                          ? "Aplikasi Terpasang 📱"
                          : "App Installed 📱"
                        : language === "id"
                        ? "Siap Dipasang 📲"
                        : "Ready to Install 📲"}
                    </span>
                  </div>
                </div>

                {/* Main Install Action Banner */}
                <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
                      🐱
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-100">
                        Nekomon TCG Online • Progressive Web App
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {language === "id"
                          ? "Mendukung kamera AR instan, geolokasi GPS mulus, dan audio tanpa jeda."
                          : "Supports instant AR camera, smooth GPS tracking, and seamless audio."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onInstallPwa}
                    disabled={isPwaInstalled}
                    className={`w-full sm:w-auto px-5 py-3 rounded-xl font-black text-xs uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg ${
                      isPwaInstalled
                        ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-default"
                        : "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 cursor-pointer shadow-amber-500/20 active:scale-95"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isPwaInstalled
                        ? language === "id"
                          ? "SUDAH TERPASANG"
                          : "ALREADY INSTALLED"
                        : language === "id"
                        ? "PASANG APLIKASI SEKARANG"
                        : "INSTALL APP NOW"}
                    </span>
                  </button>
                </div>

                {/* Step-by-step Guides for Platforms */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Android Guide */}
                  <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Smartphone className="w-4 h-4" />
                      <span>Android (Chrome)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {language === "id"
                        ? "Klik tombol Pasang di atas, atau buka menu Chrome (titik tiga di kanan atas) dan pilih 'Install aplikasi' atau 'Tambahkan ke Layar Utama'."
                        : "Tap the Install button above, or tap Chrome menu (3 dots) and select 'Install app' or 'Add to Home screen'."}
                    </p>
                  </div>

                  {/* iOS Guide */}
                  <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <Share2 className="w-4 h-4" />
                      <span>iOS / iPhone (Safari)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {language === "id"
                        ? "Buka Safari, tekan tombol Bagikan / Share (ikon kotak dengan panah ke atas di bawah layar), lalu pilih 'Tambahkan ke Layar Utama' (Add to Home Screen)."
                        : "In Safari, tap the Share icon (square with upward arrow at bottom) and select 'Add to Home Screen'."}
                    </p>
                  </div>

                  {/* Desktop Guide */}
                  <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <Laptop className="w-4 h-4" />
                      <span>Desktop (PC / Mac)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {language === "id"
                        ? "Pada peramban Chrome / Edge di komputer, klik ikon 'Install' di bilah alamat URL (address bar) di pojok kanan atas."
                        : "On Chrome / Edge on desktop, click the 'Install' icon on the right side of the URL address bar."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
