import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Play, 
  Gift, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Tv, 
  Coins, 
  Zap, 
  Flame,
  Award,
  Loader2,
  AlertCircle
} from "lucide-react";
import { audio } from "../lib/audio";

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  rewardType?: "points_50" | "cores_5" | "standard";
  onRewardClaimed: (updatedUser: any, rewardMsg: string) => void;
}

const REWARDED_ADS = [
  {
    id: "rewarded_ad_gacha",
    title: "Trailer Spesial: Mythic Neko-Gacha Release",
    sponsor: "Nekomon Global Studio",
    durationSec: 6,
    rewardText: "+30 Poin & +2 Nekomon Cores",
    bgGradient: "from-amber-950 via-slate-900 to-purple-950",
    accentColor: "from-amber-400 to-yellow-500",
    previewEmoji: "🔮✨"
  },
  {
    id: "rewarded_ad_arena",
    title: "Cyber-Cat Arena: League Championship 2026",
    sponsor: "Esports Neko Association",
    durationSec: 6,
    rewardText: "+50 Poin Ekstra",
    bgGradient: "from-teal-950 via-slate-900 to-cyan-950",
    accentColor: "from-teal-400 to-cyan-500",
    previewEmoji: "⚔️🔥"
  },
  {
    id: "rewarded_ad_cores",
    title: "Neko Forge: Panduan Forging Kartu Mythic",
    sponsor: "Elemental Craft Guild",
    durationSec: 6,
    rewardText: "+5 Nekomon Cores",
    bgGradient: "from-purple-950 via-slate-900 to-pink-950",
    accentColor: "from-pink-400 to-purple-500",
    previewEmoji: "💎⚡"
  }
];

export function RewardedAdModal({
  isOpen,
  onClose,
  token,
  rewardType = "standard",
  onRewardClaimed
}: RewardedAdModalProps) {
  const [progress, setProgress] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(6);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [adIndex, setAdIndex] = useState<number>(0);

  const selectedAd = REWARDED_ADS[adIndex];

  useEffect(() => {
    if (!isOpen) return;

    // Select ad based on rewardType
    let idx = 0;
    if (rewardType === "points_50") idx = 1;
    else if (rewardType === "cores_5") idx = 2;
    else idx = Math.floor(Math.random() * REWARDED_ADS.length);

    setAdIndex(idx);
    setProgress(0);
    setTimeLeft(REWARDED_ADS[idx].durationSec);
    setIsCompleted(false);
    setIsClaiming(false);
    setErrorMsg(null);

    const duration = REWARDED_ADS[idx].durationSec;
    const intervalMs = 100;
    const increment = 100 / ((duration * 1000) / intervalMs);

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        const nextProgress = prevProgress + increment;
        if (nextProgress >= 100) {
          clearInterval(timer);
          setIsCompleted(true);
          setTimeLeft(0);
          try {
            audio.playCaptureSuccess();
          } catch (e) {}
          return 100;
        }
        return nextProgress;
      });

      setTimeLeft((prevTime) => {
        if (prevTime <= 0.1) return 0;
        return +(prevTime - intervalMs / 1000).toFixed(1);
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, rewardType]);

  const handleClaimReward = async () => {
    setIsClaiming(true);
    setErrorMsg(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/ads/reward", {
        method: "POST",
        headers,
        body: JSON.stringify({ rewardType })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengklaim hadiah iklan.");
      }

      try {
        audio.playLevelUp();
      } catch (e) {}

      onRewardClaimed(data.user, data.message);
      onClose();
    } catch (err: any) {
      console.error("Rewarded ad claim error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat klaim hadiah.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded font-black text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                <Gift className="w-3.5 h-3.5" />
                IKLAN VIDEO BERHADIAH
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              </button>

              {isCompleted ? (
                <button
                  onClick={onClose}
                  className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-[11px] font-mono text-slate-400">
                  Tonton {timeLeft}s
                </span>
              )}
            </div>
          </div>

          {/* Video Simulator Body */}
          <div className={`p-6 bg-gradient-to-b ${selectedAd.bgGradient} flex-1 text-center`}>
            {/* Reward Preview Header */}
            <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 border border-amber-500/40 text-amber-300 text-xs font-black shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
              <span>Hadiah: {selectedAd.rewardText}</span>
            </div>

            {/* Video Player Canvas */}
            <div className="relative rounded-2xl border border-slate-700 bg-slate-950 p-8 my-3 shadow-inner overflow-hidden">
              {/* Video Animation Element */}
              <div className="text-7xl mb-4 animate-pulse">{selectedAd.previewEmoji}</div>

              <h3 className="text-lg font-black text-white tracking-wide mb-1">
                {selectedAd.title}
              </h3>
              <p className="text-xs text-slate-400 font-medium mb-4">
                Sponsor: <span className="text-teal-400">{selectedAd.sponsor}</span>
              </p>

              {/* Live Video Playing Animation */}
              {!isCompleted ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 py-2 px-4 rounded-xl border border-amber-500/20">
                    <Play className="w-3.5 h-3.5 fill-amber-400 animate-ping" />
                    <span>Memutar Video Iklan Adsterra... ({Math.ceil(timeLeft)}s)</span>
                  </div>
                  <a
                    href="https://www.effectivecpmnetwork.com/ztq3ewy6?key=2d94eee8c23563828aaaffbdfba18e46"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setIsCompleted(true);
                      setTimeLeft(0);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <span>🚀 Klik Untuk Buka Iklan Sponsor Adsterra</span>
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-400 bg-emerald-500/10 py-2 px-4 rounded-xl border border-emerald-500/30 animate-bounce">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>VIDEO SELESAI! HADIAH SIAP DIKLAIM</span>
                  </div>
                  <a
                    href="https://www.effectivecpmnetwork.com/ztq3ewy6?key=2d94eee8c23563828aaaffbdfba18e46"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-teal-400 hover:text-teal-300 underline font-mono"
                  >
                    🔗 Visit Sponsor Link (Adsterra Smartlink)
                  </a>
                </div>
              )}
            </div>

            {/* Video Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden mb-2 p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>

            {!isCompleted ? (
              <p className="text-[11px] text-slate-400 font-mono">
                ⚠️ Mohon tunggu hingga video selesai untuk mendapatkan hadiah.
              </p>
            ) : (
              <p className="text-[11px] text-emerald-300 font-mono font-bold">
                ✨ Klik tombol di bawah untuk menambahkan hadiah ke akun Anda!
              </p>
            )}

            {errorMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Action Bottom Section */}
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            {isCompleted ? (
              <button
                onClick={handleClaimReward}
                disabled={isClaiming}
                className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Mengklaim Hadiah...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4.5 h-4.5" />
                    <span>Klaim Hadiah Now ({selectedAd.rewardText})</span>
                  </>
                )}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 bg-slate-900 border border-slate-800 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Menunggu Video Selesai ({Math.ceil(timeLeft)}s)...</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
