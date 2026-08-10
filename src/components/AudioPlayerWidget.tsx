import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, Volume1, VolumeX, Music, Disc, X, SlidersHorizontal, Check } from "lucide-react";
import { audio, BGMTheme } from "../lib/audio";
import { useLanguage } from "../context/LanguageContext";

export const AudioPlayerWidget: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [bgmOn, setBgmOn] = useState<boolean>(() => audio.getPlayingStatus());
  const [volume, setVolume] = useState<number>(() => audio.getBgmVolume());
  const [currentTheme, setCurrentTheme] = useState<BGMTheme>(() => audio.getBgmTheme());

  useEffect(() => {
    setBgmOn(audio.getPlayingStatus());
    setVolume(audio.getBgmVolume());
    setCurrentTheme(audio.getBgmTheme());
  }, [isOpen]);

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
      console.warn("BGM initialization failed:", err);
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

  const themes: { id: BGMTheme; labelKey: string; icon: string; desc: string }[] = [
    { id: "cozy", labelKey: "bgm.theme_cozy", icon: "🏡", desc: "110 BPM • Melodi Santai & Cozy Pentatonik" },
    { id: "battle", labelKey: "bgm.theme_battle", icon: "⚔️", desc: "138 BPM • Rhythm Pertarungan RPG Semangat" },
    { id: "shrine", labelKey: "bgm.theme_shrine", icon: "⛩️", desc: "88 BPM • Nuansa Kuil Mistik & Ghibli" },
    { id: "vanguard", labelKey: "bgm.theme_vanguard", icon: "⚡", desc: "125 BPM • Modern Synthwave & High Energy" },
  ];

  const VolumeIcon = bgmOn ? (volume > 0.4 ? Volume2 : Volume1) : VolumeX;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-slate-900/98 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-5 shadow-2xl shadow-yellow-500/10 text-slate-100 overflow-hidden z-50"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${bgmOn ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5 font-mono">
                    {t("bgm.title")}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {t("bgm.subtitle")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BGM Toggle Switch & Animated Equalizer */}
            <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-850 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Animated Equalizer Visualizer */}
                <div className="flex items-end gap-1 h-6 px-1">
                  {[0.4, 0.8, 0.3, 0.9, 0.6, 0.2].map((height, idx) => (
                    <div
                      key={idx}
                      className={`w-1 rounded-full transition-all duration-300 ${bgmOn ? "bg-gradient-to-t from-amber-500 to-yellow-400 animate-pulse" : "bg-slate-700 h-1.5"}`}
                      style={{
                        height: bgmOn ? `${Math.max(15, height * 100)}%` : "20%",
                        animationDelay: `${idx * 150}ms`,
                      }}
                    />
                  ))}
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    {bgmOn ? t("bgm.active") : t("bgm.muted")}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {bgmOn ? `Tema: ${currentTheme.toUpperCase()}` : "Audio Dimatikan"}
                  </span>
                </div>
              </div>

              {/* Power Toggle Button */}
              <button
                onClick={toggleBGM}
                className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  bgmOn ? "bg-amber-500" : "bg-slate-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                    bgmOn ? "translate-x-6 bg-yellow-400" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* BGM Volume Slider Control */}
            <div className="mb-4 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-850">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <VolumeIcon className="w-4 h-4 text-yellow-400" />
                  {t("bgm.volume_label")}
                </label>
                <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
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
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400 focus:outline-none"
              />

              {/* Quick Volume Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {[
                  { label: "Mute", val: 0 },
                  { label: "25%", val: 0.25 },
                  { label: "50%", val: 0.5 },
                  { label: "100%", val: 1.0 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetVolume(preset.val)}
                    className={`py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      Math.abs(volume - preset.val) < 0.05
                        ? "bg-yellow-500 text-slate-950 border-yellow-400"
                        : "bg-slate-850 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Soundtrack Theme Selector */}
            <div className="mb-2">
              <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-yellow-400 animate-spin-slow" />
                {t("bgm.theme_label")}
              </label>

              <div className="grid grid-cols-2 gap-2">
                {themes.map((th) => {
                  const isSelected = currentTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => handleSelectTheme(th.id)}
                      className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-yellow-500/50 text-slate-100 shadow-lg shadow-yellow-500/5"
                          : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">{th.icon}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-200 leading-tight">
                        {t(th.labelKey)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                        {th.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Controller Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-12 h-12 rounded-full border shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95 group relative ${
          bgmOn
            ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 border-yellow-400 shadow-yellow-500/20"
            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
        }`}
        title={bgmOn ? `BGM: ${Math.round(volume * 100)}% Volume` : "Mainkan & Atur BGM"}
      >
        {bgmOn ? (
          <>
            <VolumeIcon className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
          </>
        ) : (
          <VolumeX className="w-5 h-5" />
        )}

        {/* Small Sliders Badge */}
        <span className="absolute -bottom-0.5 -left-0.5 bg-slate-900 border border-slate-700 text-yellow-400 p-0.5 rounded-full shadow">
          <SlidersHorizontal className="w-2.5 h-2.5" />
        </span>

        {/* Tooltip on hover */}
        <span className="absolute right-14 bg-slate-900/95 text-slate-200 text-[10px] font-bold font-mono px-2 py-1 rounded-lg border border-slate-850 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          {bgmOn ? `BGM: ${Math.round(volume * 100)}%` : "BGM: MATI"}
        </span>
      </button>
    </div>
  );
};
