import React, { useState, useEffect } from "react";
import { Sparkles, Gift, Flame, Trophy, Check, Calendar, Zap, Loader2, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { audio } from "../lib/audio";
import { haptics } from "../lib/vibration";
import { useLanguage } from "../context/LanguageContext";

interface DailyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onClaimSuccess: (updatedPoints: number, updatedCores: number, rewardMsg: string) => void;
  userPoints: number;
  userCores: number;
}

const STREAK_REWARDS = [
  { day: 1, pts: 25, cores: 2, icon: "🎁", labelEn: "Day 1 Welcome", labelId: "Hari 1 Selamat Datang" },
  { day: 2, pts: 35, cores: 5, icon: "⚡", labelEn: "Day 2 Booster", labelId: "Hari 2 Penambah Daya" },
  { day: 3, pts: 50, cores: 8, icon: "🔮", labelEn: "Day 3 Core Cache", labelId: "Hari 3 Paket Core" },
  { day: 4, pts: 75, cores: 10, icon: "🔥", labelEn: "Day 4 Energy Surge", labelId: "Hari 4 Lonjakan Energi" },
  { day: 5, pts: 100, cores: 15, icon: "👑", labelEn: "Day 5 Trainer Box", labelId: "Hari 5 Kotak Trainer" },
  { day: 6, pts: 150, cores: 20, icon: "🌟", labelEn: "Day 6 Elite Supply", labelId: "Hari 6 Bekal Elit" },
  { day: 7, pts: 250, cores: 30, icon: "🏆", labelEn: "Day 7 Grand Jackpot", labelId: "Hari 7 Hadiah Utama" },
];

export const DailyLoginModal: React.FC<DailyLoginModalProps> = ({
  isOpen,
  onClose,
  token,
  onClaimSuccess,
  userPoints,
  userCores
}) => {
  const { language } = useLanguage();
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimedToday, setClaimedToday] = useState<boolean>(false);
  const [currentStreak, setCurrentStreak] = useState<number>(1);
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check LocalStorage & calculate daily login state
  useEffect(() => {
    const lastClaimTs = localStorage.getItem("nekomon_daily_login_last_claim_v2");
    const savedStreak = localStorage.getItem("nekomon_daily_login_streak_v2");

    const now = Date.now();
    const lastTime = lastClaimTs ? parseInt(lastClaimTs, 10) : 0;
    const timeDiff = now - lastTime;
    const twentyHoursMs = 20 * 60 * 60 * 1000;
    const fortyEightHoursMs = 48 * 60 * 60 * 1000;

    let streak = savedStreak ? parseInt(savedStreak, 10) : 0;

    if (lastTime > 0 && timeDiff < twentyHoursMs) {
      setClaimedToday(true);
      setCurrentStreak(streak > 0 ? streak : 1);
    } else {
      setClaimedToday(false);
      if (lastTime > 0 && timeDiff < fortyEightHoursMs) {
        // Keep streak progressing
        setCurrentStreak(streak > 0 ? (streak % 7) + 1 : 1);
      } else {
        // Reset streak to day 1
        setCurrentStreak(1);
      }
    }
  }, [isOpen]);

  // Timer countdown for next claim
  useEffect(() => {
    if (!claimedToday) return;

    const updateCountdown = () => {
      const lastClaimTs = localStorage.getItem("nekomon_daily_login_last_claim_v2");
      if (!lastClaimTs) return;

      const now = Date.now();
      const lastTime = parseInt(lastClaimTs, 10);
      const targetTime = lastTime + 20 * 60 * 60 * 1000;
      const remainingMs = targetTime - now;

      if (remainingMs <= 0) {
        setClaimedToday(false);
        setTimeLeftStr("");
      } else {
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
        const pad = (n: number) => String(n).padStart(2, "0");
        setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [claimedToday]);

  const handleClaimBonus = async () => {
    if (claimedToday || isClaiming) return;
    setIsClaiming(true);
    setErrorMsg(null);
    haptics.victory();

    try {
      if (token) {
        // Online API Claim
        const response = await fetch("/api/user/claim-daily-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (response.ok) {
          const nowStr = String(Date.now());
          localStorage.setItem("nekomon_daily_login_last_claim_v2", nowStr);
          localStorage.setItem("nekomon_daily_login_streak_v2", String(data.dailyStreak || currentStreak));
          
          setClaimedToday(true);
          setCurrentStreak(data.dailyStreak || currentStreak);
          
          try {
            audio.playUnboxingExplosion("Petir");
          } catch (_) {}

          onClaimSuccess(
            data.points, 
            data.cores, 
            data.message || (language === "id" ? "Bonus Login Harian Berhasil Diklaim!" : "Daily Login Bonus Claimed!")
          );
        } else {
          setErrorMsg(data.error || (language === "id" ? "Gagal mengklaim bonus." : "Failed to claim bonus."));
        }
      } else {
        // Offline / LocalStorage Fallback Claim
        const reward = STREAK_REWARDS[currentStreak - 1] || STREAK_REWARDS[0];
        const newPts = userPoints + reward.pts;
        const newCores = userCores + reward.cores;
        
        const nowStr = String(Date.now());
        localStorage.setItem("nekomon_daily_login_last_claim_v2", nowStr);
        localStorage.setItem("nekomon_daily_login_streak_v2", String(currentStreak));

        setClaimedToday(true);
        
        try {
          audio.playUnboxingExplosion("Petir");
        } catch (_) {}

        onClaimSuccess(
          newPts, 
          newCores, 
          language === "id" 
            ? `Bonus Login Hari ke-${currentStreak} Berhasil! (+${reward.pts} PTS & +${reward.cores} Cores)`
            : `Day ${currentStreak} Daily Bonus Claimed! (+${reward.pts} PTS & +${reward.cores} Cores)`
        );
      }
    } catch (err) {
      setErrorMsg(language === "id" ? "Terjadi kesalahan koneksi." : "Connection error occurred.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="daily-login-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden font-mono"
        >
          {/* Header Background Glow */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/15 via-yellow-500/5 to-transparent pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => {
              haptics.tap();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-all cursor-pointer z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Title & Streak Header */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400 shadow-inner shrink-0">
              <Gift className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>{language === "id" ? "BONUS LOGIN HARIAN 24 JAM" : "24-HOUR DAILY LOGIN BONUS"}</span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-2 py-0.5 rounded-full font-mono font-extrabold">
                  STREAK
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "id"
                  ? "Buka game setiap hari untuk klaim poin & core booster beruntun!"
                  : "Open the game daily to claim points & core booster streak!"}
              </p>
            </div>
          </div>

          {/* 7-Day Rewards Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 relative z-10 my-1">
            {STREAK_REWARDS.map((reward) => {
              const isCurrent = reward.day === currentStreak;
              const isCompleted = reward.day < currentStreak || (reward.day === currentStreak && claimedToday);
              const isLocked = reward.day > currentStreak;

              return (
                <div
                  key={reward.day}
                  className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all relative overflow-hidden ${
                    isCurrent && !claimedToday
                      ? "bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105"
                      : isCompleted
                      ? "bg-slate-950/80 border-emerald-500/30 text-slate-400"
                      : "bg-slate-950/40 border-slate-800 text-slate-500 opacity-70"
                  }`}
                >
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 font-mono">
                    H-{reward.day}
                  </span>

                  <div className="my-1.5 text-2xl relative">
                    {reward.icon}
                    {isCompleted && (
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5 border border-slate-950">
                        <Check className="w-2.5 h-2.5 font-black" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col text-[8.5px] font-bold font-mono">
                    <span className={isCurrent ? "text-amber-300" : "text-slate-300"}>+{reward.pts}p</span>
                    <span className="text-teal-400">+{reward.cores}c</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs text-center font-mono">
              {errorMsg}
            </div>
          )}

          {/* Action Button Section */}
          <div className="flex flex-col gap-2 relative z-10 pt-1">
            {claimedToday ? (
              <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 flex flex-col items-center gap-1 text-center">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <Check className="w-4 h-4" />
                  <span>{language === "id" ? "Bonus Hari Ini Sudah Diklaim!" : "Today's Bonus Already Claimed!"}</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === "id" ? "Bonus berikutnya siap dalam:" : "Next bonus ready in:"}</span>
                  <span className="text-amber-400 font-bold">{timeLeftStr || "20:00:00"}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleClaimBonus}
                disabled={isClaiming}
                className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(245,158,11,0.5)] cursor-pointer flex items-center justify-center gap-2"
              >
                {isClaiming ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                    <span>
                      {language === "id"
                        ? `KLAIM BONUS HARI KE-${currentStreak} (+${STREAK_REWARDS[currentStreak - 1]?.pts} PTS & +${STREAK_REWARDS[currentStreak - 1]?.cores} CORES)`
                        : `CLAIM DAY ${currentStreak} BONUS (+${STREAK_REWARDS[currentStreak - 1]?.pts} PTS & +${STREAK_REWARDS[currentStreak - 1]?.cores} CORES)`}
                    </span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => {
                haptics.tap();
                onClose();
              }}
              className="w-full bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all border border-slate-700/60 cursor-pointer text-center"
            >
              {language === "id" ? "Lanjut Bermain Game" : "Continue Playing"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
