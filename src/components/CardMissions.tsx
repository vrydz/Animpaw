import React, { useState, useEffect } from "react";
import { Card, Mission } from "../types";
import { Sparkles, Gamepad2, Play, CircleDot, ChevronRight, Swords, Compass, Shield, Heart, Trophy, Award, Loader2, Flame, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { audio } from "../lib/audio";
import { useLanguage } from "../context/LanguageContext";
import { getTimeUntilNextEnergyRefill, formatEnergyCountdown } from "../lib/energyUtils";

interface CardMissionsProps {
  cards: Card[];
  token: string;
  onActivitySuccess: (updatedCard: Card, updatedPoints: number) => void;
  mission?: Mission | null;
  onMissionClaimSuccess?: (updatedPoints: number, updatedCores: number, updatedMission: Mission) => void;
}

export const CardMissions: React.FC<CardMissionsProps> = ({ 
  cards, 
  token, 
  onActivitySuccess,
  mission,
  onMissionClaimSuccess
}) => {
  const { language } = useLanguage();
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [activityId, setActivityId] = useState<string>("patrol");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isClaimingBonus, setIsClaimingBonus] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState<number>(0);
  const [resultData, setResultData] = useState<any | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Highest level card in deck
  const highestLevelInDeck = cards.reduce((max, c) => Math.max(max, c.level || 1), 1);

  // Default selection to first card if available
  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  const selectedCard = cards.find(c => c.id === selectedCardId);

  // Claim Level > 8 Mission Handler
  const handleClaimLevel8Bonus = async () => {
    if (!token) return;
    setIsClaimingBonus(true);
    setError(null);
    try {
      const response = await fetch("/api/user/claim-level8-mission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        if (onMissionClaimSuccess) {
          onMissionClaimSuccess(data.points, data.cores, data.mission);
        }
        try {
          audio.playForgingSound();
        } catch (_) {}
      } else {
        setError(data.error || (language === "id" ? "Gagal mengklaim misi." : "Failed to claim mission."));
      }
    } catch (err) {
      setError(language === "id" ? "Kesalahan jaringan saat klaim misi." : "Network error claiming mission.");
    } finally {
      setIsClaimingBonus(false);
    }
  };

  // Trigger typed log effects sequentially
  useEffect(() => {
    if (isRunning && logs.length > 0 && logIndex < logs.length) {
      const timeout = setTimeout(() => {
        setDisplayedLogs(prev => [...prev, logs[logIndex]]);
        setLogIndex(prev => prev + 1);
        try {
          audio.playCaptureSound();
        } catch (_) {}
      }, 700);
      return () => clearTimeout(timeout);
    } else if (isRunning && logs.length > 0 && logIndex >= logs.length) {
      // Finished showing all logs, transition to result screen
      const timeout = setTimeout(() => {
        setIsRunning(false);
        setShowResult(true);
        if (resultData?.leveledUp) {
          try {
            audio.playRevealSound("Vanguard");
          } catch (_) {}
        } else {
          try {
            audio.playCaptureSound();
          } catch (_) {}
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isRunning, logs, logIndex, resultData]);

  const handleStartMission = async () => {
    if (!selectedCardId || !activityId) return;
    setIsSubmitting(true);
    setError(null);
    setLogs([]);
    setDisplayedLogs([]);
    setLogIndex(0);
    setResultData(null);
    setShowResult(false);

    try {
      const response = await fetch(`/api/cards/${selectedCardId}/mission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ activityId })
      });

      if (response.ok) {
        const data = await response.json();
        setResultData(data);
        setLogs(data.logs || []);
        setIsRunning(true);
      } else {
        const errData = await response.json();
        setError(errData.error || (language === "id" ? "Gagal memulai misi." : "Failed to start mission."));
      }
    } catch (err) {
      setError(language === "id" ? "Kesalahan jaringan saat memproses misi." : "Network error processing mission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishResult = () => {
    if (resultData) {
      onActivitySuccess(resultData.card, resultData.points);
    }
    // Reset state
    setShowResult(false);
    setResultData(null);
    setLogs([]);
    setDisplayedLogs([]);
    setLogIndex(0);
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-900/30 border border-slate-800 rounded-2xl min-h-[300px] gap-3">
        <Gamepad2 className="w-12 h-12 text-slate-700 animate-pulse" />
        <span className="text-xs font-bold text-slate-300 font-mono">
          {language === "id" ? "BELUM MEMILIKI NEKOMON" : "NO NEKOMON OWNED"}
        </span>
        <p className="text-[10px] text-slate-500 leading-normal max-w-xs">
          {language === "id" 
            ? "Silakan tangkap kucing di tab Kamera, lalu gunakan bengkel Forge di sebelah kiri untuk melahirkan Nekomon Card pertama Anda!"
            : "Please catch some cats in the Camera tab, then use the Forging Station on the left to spawn your first Nekomon Card!"}
        </p>
      </div>
    );
  }

  // Active missions info list
  const missionsInfo = [
    { id: "patrol", name: language === "id" ? "Patroli Lingkungan" : "Neighborhood Patrol", recLv: "Lv. 1+", xp: "+30", pts: "+5", icon: "🐾", theme: "from-emerald-500/15 via-slate-950 to-slate-950 border-emerald-900/30 text-emerald-400" },
    { id: "training", name: language === "id" ? "Latihan Gym Kucing" : "Cat Gym Training", recLv: "Lv. 3+", xp: "+60", pts: "+10", icon: "⚡", theme: "from-blue-500/15 via-slate-950 to-slate-950 border-blue-900/30 text-blue-400" },
    { id: "rescue", name: language === "id" ? "Penyelamatan Kitten" : "Kitten Rescue Operation", recLv: "Lv. 5+", xp: "+100", pts: "+20", icon: "🌳", theme: "from-purple-500/15 via-slate-950 to-slate-950 border-purple-900/30 text-purple-400" },
    { id: "boss", name: language === "id" ? "Pertarungan Bos Oyen" : "Ginger Cat Boss Fight", recLv: "Lv. 8+", xp: "+180", pts: "+35", icon: "👑", theme: "from-amber-500/15 via-slate-950 to-slate-950 border-amber-900/30 text-amber-400" },
    { id: "master_trial", name: language === "id" ? "Ujian Master Nekomon (Lv. >8)" : "Master Nekomon Trial (Lv. >8)", recLv: "Lv. 8+", xp: "+300", pts: "+60", icon: "🔥", theme: "from-rose-500/15 via-slate-950 to-slate-950 border-rose-900/30 text-rose-400" }
  ];

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      {/* Daily Mission Level > 8 Banner Card */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border border-rose-500/40 p-4 rounded-2xl flex flex-col gap-3 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-xs uppercase flex items-center gap-1.5 tracking-wide">
                <span>{language === "id" ? "MISI HARIAN: KARTU LEVEL > 8" : "DAILY MISSION: CARD LEVEL > 8"}</span>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] px-1.5 py-0.2 rounded font-mono">
                  SPECIAL
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                {language === "id" 
                  ? "Miliki atau latih minimal 1 kartu Nekomon hingga Level 9 ke atas!"
                  : "Own or train at least 1 Nekomon card up to Level 9 or above!"}
              </p>
            </div>
          </div>
          
          <div className="text-right shrink-0 font-bold text-[10px] bg-slate-950/80 px-2.5 py-1 rounded-xl border border-rose-500/20">
            <span className="text-rose-400 font-mono block">+50 PTS</span>
            <span className="text-teal-400 font-mono block">+20 CORES</span>
          </div>
        </div>

        {/* Progress Bar & Status */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-400">
              {language === "id" ? "Level Kartu Tertinggi Anda:" : "Your Highest Card Level:"}{" "}
              <strong className="text-rose-300 font-black">LV. {highestLevelInDeck}</strong>
            </span>
            <span className="font-bold text-slate-300 font-mono">
              {highestLevelInDeck > 8 
                ? (language === "id" ? "LV. 9+ (TERCAPAI 🎉)" : "LV. 9+ (REACHED 🎉)") 
                : `${highestLevelInDeck} / 8`}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (highestLevelInDeck / 8) * 100)}%` }}
            />
          </div>
        </div>

        {/* Claim Button or Requirements status */}
        {highestLevelInDeck > 8 ? (
          <button
            onClick={handleClaimLevel8Bonus}
            disabled={isClaimingBonus || (mission?.level8Completed ?? false)}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mission?.level8Completed
                ? "bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-bounce"
            }`}
          >
            {isClaimingBonus ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : mission?.level8Completed ? (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{language === "id" ? "✓ HADIAH LEVEL > 8 HARIAN SUDAH DIKLAIM" : "✓ LEVEL > 8 DAILY BONUS CLAIMED"}</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>{language === "id" ? "KLAIM BONUS MISI LEVEL > 8 (+50 PTS & +20 CORES)" : "CLAIM LEVEL > 8 MISSION BONUS (+50 PTS & +20 CORES)"}</span>
              </>
            )}
          </button>
        ) : (
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[10px] text-amber-400/90 flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {language === "id"
                ? "Gunakan 'Ujian Master Nekomon (Lv. >8)' atau aktivitas lain di bawah untuk menaikkan level kartu ke Level 9+!"
                : "Use 'Master Nekomon Trial (Lv. >8)' or other activities below to level up your card to Level 9+!"}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: Selection Dashboard */}
        {!isRunning && !showResult && (
          <motion.div
            key="selection-view"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col gap-4"
          >
            {/* Nekomon Card Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                {language === "id" ? "Pilih Nekomon Anda:" : "Select Your Nekomon:"}
              </label>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none text-xs cursor-pointer font-bold focus:border-teal-500/50"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (LV. {c.level || 1} • {c.rarity} • ⚡{c.energy ?? 5}/{c.maxEnergy || 5})
                  </option>
                ))}
              </select>
            </div>

            {/* Compact Nekomon Card Preview */}
            {selectedCard && (
              <div className="flex flex-col gap-2 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedCard.imageUrl}
                    alt={selectedCard.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-lg object-cover border border-slate-800"
                  />
                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="font-extrabold text-white text-[11px] truncate uppercase">{selectedCard.name}</span>
                      <span className="text-[9px] bg-teal-500/15 text-teal-400 border border-teal-500/30 px-1.5 py-0.5 rounded-full font-black">
                        LV. {selectedCard.level || 1}
                      </span>
                    </div>

                    {/* Attributes indicators */}
                    <div className="flex gap-2 text-[9px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">⚔ {selectedCard.atk}</span>
                      <span className="flex items-center gap-0.5 text-blue-400 font-bold">🛡 {selectedCard.def}</span>
                      <span className="flex items-center gap-0.5 text-emerald-400 font-bold">❤ {selectedCard.hp}</span>
                    </div>

                    {/* XP Bar preview */}
                    <div className="mt-1">
                      <div className="flex justify-between text-[8px] text-slate-500 mb-0.5">
                        <span>EXP</span>
                        <span>{selectedCard.xp || 0} / {selectedCard.level ? selectedCard.level * 100 : 100} XP</span>
                      </div>
                      <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-400"
                          style={{ width: `${Math.min(100, ((selectedCard.xp || 0) / (selectedCard.level ? selectedCard.level * 100 : 100)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Energy Indicator Row */}
                <div className="flex items-center justify-between bg-slate-950/80 border border-amber-500/20 px-2.5 py-1.5 rounded-xl text-[9px]">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>ENERGI: {selectedCard.energy ?? 5}/{selectedCard.maxEnergy || 5}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(selectedCard.maxEnergy || 5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2 rounded-xs border transition-all ${
                          i < (selectedCard.energy ?? 5)
                            ? "bg-amber-400 border-yellow-300 shadow-[0_0_4px_rgba(251,191,36,0.8)]"
                            : "bg-slate-900 border-slate-800 opacity-30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Energy depleted warning */}
            {selectedCard && (selectedCard.energy ?? 5) < 1 && (
              <div className="bg-amber-950/30 border border-amber-500/40 p-2.5 rounded-xl text-[10px] text-amber-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                <span>
                  {language === "id"
                    ? "Energi Nekomon ini telah habis (0/5)! Butuh 1 bar energi untuk menjalankan misi. Refill 1 bar otomatis setiap 2 jam sekali."
                    : "This Nekomon energy is empty (0/5)! Needs 1 energy bar to launch mission. Refills 1 bar automatically every 2 hours."}
                </span>
              </div>
            )}

            {/* Activity Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                {language === "id" ? "Daftar Aktivitas Harian:" : "Daily Activity Log:"}
              </label>
              
              <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                {missionsInfo.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActivityId(m.id)}
                    className={`text-left p-2.5 rounded-xl border flex items-center justify-between transition-all relative overflow-hidden group cursor-pointer ${
                      activityId === m.id
                        ? "bg-slate-900 border-teal-500/50 shadow-md shadow-teal-500/5 ring-1 ring-teal-500/20"
                        : "bg-slate-950 border-slate-900 hover:border-slate-800"
                    }`}
                  >
                    {/* Background visual elements */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${m.theme} opacity-5 z-0`} />
                    
                    <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{m.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[11px] text-slate-200 line-clamp-1">{m.name}</span>
                        <span className="text-[8px] text-slate-500">
                          {language === "id" ? "Rekomendasi:" : "Recommended:"} <span className="text-teal-500 font-bold">{m.recLv}</span>
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 flex flex-col items-end gap-0.5 text-[8px] shrink-0 font-bold">
                      <span className="text-teal-400">{m.xp} XP</span>
                      <span className="text-yellow-400">{m.pts} PTS</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-red-950/20 border border-red-900/40 p-2.5 rounded-xl text-[10px] text-red-400 leading-normal">
                ⚠️ {error}
              </div>
            )}

            {/* Launch Button */}
            <button
              onClick={handleStartMission}
              disabled={isSubmitting || !selectedCardId || (selectedCard && (selectedCard.energy ?? 5) < 1)}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-500 font-black py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10 cursor-pointer disabled:cursor-not-allowed uppercase"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  {language === "id" ? "MEMPERSIAPKAN MISI..." : "PREPARING MISSION..."}
                </>
              ) : selectedCard && (selectedCard.energy ?? 5) < 1 ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-slate-500 fill-slate-500" />
                  {language === "id" ? "ENERGI NEKOMON HABIS (0/5)" : "NEKOMON ENERGY DEPLETED (0/5)"}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-slate-950" fill="currentColor" />
                  {language === "id" ? "JALANKAN AKTIVITAS (-1 ENERGI)" : "LAUNCH ACTIVITY (-1 ENERGY)"}
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* VIEW 2: RPG Battle Terminal Console Runner */}
        {isRunning && (
          <motion.div
            key="running-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Retro RPG simulated display container */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-3 aspect-[10/9] flex flex-col justify-between relative overflow-hidden shadow-inner font-mono text-[9px] text-teal-400 leading-relaxed select-none">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none opacity-80" />
              
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[175px] pr-1 scrollbar-none scroll-smooth">
                <span className="text-[8px] text-slate-600 border-b border-slate-900 pb-1 mb-1 block">NEKOMON GO TERMINAL CONSOLE v1.2</span>
                {displayedLogs.map((log, i) => {
                  let colorClass = "text-teal-400";
                  if (log.includes("[LEVEL UP]")) colorClass = "text-yellow-400 font-bold animate-bounce";
                  else if (log.includes("[BERHASIL]")) colorClass = "text-emerald-400 font-bold";
                  else if (log.includes("[MEMULAI]")) colorClass = "text-slate-300";
                  else if (log.includes("[MUSUH]")) colorClass = "text-rose-400";
                  else if (log.includes("[BATTLE]")) colorClass = "text-amber-300";

                  return (
                    <div key={i} className={`flex gap-1.5 ${colorClass}`}>
                      <span className="text-slate-700 shrink-0">&gt;</span>
                      <p>{log}</p>
                    </div>
                  );
                })}
              </div>

              {/* Progress and status HUD */}
              <div className="border-t border-slate-900 pt-1.5 flex justify-between items-center text-[8px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  {language === "id" ? "MENGEKSEKUSI MISI..." : "EXECUTING MISSION..."}
                </span>
                <span>{logIndex} / {logs.length} ACTIONS</span>
              </div>
            </div>

            {/* Processing simulation text */}
            <div className="text-center py-2 text-slate-500 text-[10px] animate-pulse">
              {language === "id" ? "Sedang bertempur... harap tunggu! ⚔️" : "Battling... please wait! ⚔️"}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: Mission Complete / Reward Summary */}
        {showResult && resultData && (
          <motion.div
            key="result-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center"
          >
            {/* Big Victory or Defeat Icon */}
            <div className="flex justify-center">
              {resultData.missionSuccess !== false ? (
                <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/40 rounded-full flex items-center justify-center animate-bounce">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center animate-pulse">
                  <Shield className="w-6 h-6 text-red-400" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              {resultData.missionSuccess !== false ? (
                <>
                  <h3 className="text-sm font-black text-yellow-400 uppercase tracking-wider">
                    {language === "id" ? "MISI SELESAI!" : "MISSION COMPLETE!"}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {language === "id" 
                      ? "Nekomon Anda bertempur gagah berani dan berhasil membawa pulang kemenangan gilang-gemilang!"
                      : "Your Nekomon fought bravely and returned with a glorious victory!"}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-black text-red-400 uppercase tracking-wider">
                    {language === "id" ? "MISI GAGAL!" : "MISSION FAILED!"}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {language === "id"
                      ? "Nekomon Anda telah berjuang keras, namun musuh atau rintangan kali ini masih terlalu tangguh."
                      : "Your Nekomon fought hard, but the obstacles this time were too formidable."}
                  </p>
                </>
              )}
            </div>

            {/* Reward matrix box */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/40 flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500">{language === "id" ? "KREDIT DIDAPAT" : "CREDITS EARNED"}</span>
                  <span className="text-yellow-400 font-extrabold text-[11px]">+{resultData.pointsGained} PTS</span>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/40 flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500">{language === "id" ? "EXP DIDAPAT" : "EXP EARNED"}</span>
                  <span className="text-teal-400 font-extrabold text-[11px]">+{resultData.xpGained} XP</span>
                </div>
              </div>

              {/* Card leveling animation HUD */}
              <div className="flex items-center gap-3 border-t border-slate-900 pt-2.5 mt-0.5 text-left">
                <img
                  src={resultData.card.imageUrl}
                  alt={resultData.card.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover border border-slate-800"
                />
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-white text-[10px] truncate uppercase">{resultData.card.name}</span>
                    <span className="text-[9px] text-teal-400 font-bold">LV. {resultData.card.level}</span>
                  </div>

                  {/* Level up congrats visual banner */}
                  {resultData.leveledUp && (
                    <span className="text-[8px] text-yellow-400 font-bold animate-pulse mt-0.5">
                      {language === "id" ? "🎉 NAIK LEVEL! STATS MENINGKAT!" : "🎉 LEVEL UP! STATS INCREASED!"}
                    </span>
                  )}

                  {/* XP Bar preview */}
                  <div className="mt-1">
                    <div className="flex justify-between text-[7px] text-slate-500 mb-0.5">
                      <span>EXP GAUGE</span>
                      <span>{resultData.card.xp} / {resultData.card.maxXp} XP</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-400 to-emerald-500"
                        style={{ width: `${Math.min(100, (resultData.card.xp / resultData.card.maxXp) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Show Stats Gains if leveled up */}
              {resultData.leveledUp && resultData.statUpgrades && (
                <div className="grid grid-cols-4 gap-1.5 text-[8px] font-mono text-center border-t border-slate-900 pt-2 mt-0.5">
                  <div className="bg-red-950/20 border border-red-900/30 p-1 rounded">
                    <span className="text-red-400 block">HP</span>
                    <span className="text-white font-black">+{resultData.statUpgrades.hp}</span>
                  </div>
                  <div className="bg-amber-950/20 border border-amber-900/30 p-1 rounded">
                    <span className="text-amber-400 block">ATK</span>
                    <span className="text-white font-black">+{resultData.statUpgrades.atk}</span>
                  </div>
                  <div className="bg-blue-950/20 border border-blue-900/30 p-1 rounded">
                    <span className="text-blue-400 block">DEF</span>
                    <span className="text-white font-black">+{resultData.statUpgrades.def}</span>
                  </div>
                  <div className="bg-pink-950/20 border border-pink-900/30 p-1 rounded">
                    <span className="text-pink-400 block">SPD</span>
                    <span className="text-white font-black">+{resultData.statUpgrades.spd}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Back button */}
            <button
              onClick={handleFinishResult}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-2.5 px-4 rounded-xl text-xs transition-all border border-slate-700 cursor-pointer uppercase"
            >
              {language === "id" ? "Kembali ke Menu" : "Back to Dashboard"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
