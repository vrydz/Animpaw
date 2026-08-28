import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Gift, 
  Sparkles, 
  CheckCircle2, 
  Award,
  Loader2,
  AlertCircle,
  ShieldCheck
} from "lucide-react";
import { audio } from "../lib/audio";
import { useLanguage } from "../context/LanguageContext";

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  rewardType?: "points_50" | "cores_5" | "standard";
  onRewardClaimed: (updatedUser: any, rewardMsg: string) => void;
}

export function RewardedAdModal({
  isOpen,
  onClose,
  token,
  rewardType = "standard",
  onRewardClaimed
}: RewardedAdModalProps) {
  const { language } = useLanguage();
  const [progress, setProgress] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(5);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushedRef = useRef<boolean>(false);

  const getRewardLabel = () => {
    if (rewardType === "points_50") {
      return language === "id" ? "+50 Poin Ekstra" : "+50 Extra Points";
    }
    if (rewardType === "cores_5") {
      return language === "id" ? "+5 Nekomon Cores" : "+5 Nekomon Cores";
    }
    return language === "id" ? "+30 Poin & +2 Nekomon Cores" : "+30 Points & +2 Nekomon Cores";
  };

  useEffect(() => {
    if (!isOpen) return;

    setProgress(0);
    setTimeLeft(5);
    setIsCompleted(false);
    setIsClaiming(false);
    setErrorMsg(null);
    isPushedRef.current = false;

    const durationSec = 5;
    const intervalMs = 100;
    const increment = 100 / ((durationSec * 1000) / intervalMs);

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

    // Initialize AdSense if script is available
    const adPushTimeout = setTimeout(() => {
      try {
        if (typeof window !== "undefined" && adRef.current && !isPushedRef.current) {
          if (adRef.current.childNodes.length === 0) {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            isPushedRef.current = true;
          }
        }
      } catch (e) {
        console.log("AdSense rewarded unit push notice:", e);
      }
    }, 200);

    return () => {
      clearInterval(timer);
      clearTimeout(adPushTimeout);
    };
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
        throw new Error(data.error || (language === "id" ? "Gagal mengklaim hadiah iklan." : "Failed to claim ad reward."));
      }

      try {
        audio.playLevelUp();
      } catch (e) {}

      onRewardClaimed(data.user, data.message);
      onClose();
    } catch (err: any) {
      console.error("Rewarded ad claim error:", err);
      setErrorMsg(err.message || (language === "id" ? "Terjadi kesalahan saat klaim hadiah." : "An error occurred while claiming reward."));
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
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded font-black text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                <Gift className="w-3.5 h-3.5" />
                {language === "id" ? "Iklan Berhadiah Google AdSense" : "Google AdSense Rewarded Ad"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isCompleted ? (
                <button
                  onClick={onClose}
                  className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-[11px] font-mono text-slate-400">
                  {language === "id" ? `Tonton ${Math.ceil(timeLeft)}s` : `Watch ${Math.ceil(timeLeft)}s`}
                </span>
              )}
            </div>
          </div>

          {/* Ad Provider Canvas */}
          <div className="p-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex-1 overflow-y-auto flex flex-col gap-4">
            {/* Reward Preview Badge */}
            <div className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-black shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
              <span>{language === "id" ? "Hadiah:" : "Reward:"} {getRewardLabel()}</span>
            </div>

            {/* Real Google AdSense Unit Container */}
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center min-h-[220px] text-center shadow-inner">
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Google AdSense Unit</span>
              </div>
              
              <ins
                ref={adRef}
                className="adsbygoogle w-full"
                style={{ display: "block", minHeight: "180px" }}
                data-ad-client="ca-pub-2411657012211511"
                data-ad-slot="8821940125"
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            </div>

            {/* Progress Status */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">
                {language === "id" ? "Status Penayangan Iklan" : "Ad Playback Status"}
              </span>
              <span className="text-[11px] font-mono font-bold">
                {isCompleted ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === "id" ? "Siap Diklaim" : "Ready to Claim"}
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono">
                    {Math.ceil(timeLeft)}s {language === "id" ? "tersisa" : "remaining"}
                  </span>
                )}
              </span>
            </div>

            {/* Video Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800 overflow-hidden p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Action Bottom Section */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-2">
            {isCompleted ? (
              <button
                onClick={handleClaimReward}
                disabled={isClaiming}
                className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{language === "id" ? "MENGKLAIM HADIAH..." : "CLAIMING REWARD..."}</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4.5 h-4.5" />
                    <span>{language === "id" ? `KLAIM HADIAH SEKARANG (${getRewardLabel()})` : `CLAIM REWARD NOW (${getRewardLabel()})`}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 bg-slate-900 border border-slate-800 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>{language === "id" ? `MENUNGGU IKLAN SELESAI (${Math.ceil(timeLeft)}s)...` : `WAITING FOR AD (${Math.ceil(timeLeft)}s)...`}</span>
              </button>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-400" />
                <span>Google AdSense Official Partner</span>
              </div>
              <span>ID: ca-pub-2411657012211511</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
