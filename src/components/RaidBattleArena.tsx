import React, { useState, useEffect, useRef } from "react";
import { RaidLobbyRoom, User } from "../types";
import {
  Swords,
  Shield,
  Zap,
  Flame,
  Droplets,
  Mountain,
  Wind,
  Users,
  Copy,
  Check,
  Award,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Play,
  RotateCcw,
  Gift
} from "lucide-react";

interface RaidBattleArenaProps {
  initialRoom: RaidLobbyRoom;
  currentUser: User | null;
  token?: string;
  currentLanguage: "id" | "en";
  onExit: () => void;
  onRefreshUserData?: () => void;
}

export const RaidBattleArena: React.FC<RaidBattleArenaProps> = ({
  initialRoom,
  currentUser,
  token,
  currentLanguage,
  onExit,
  onRefreshUserData
}) => {
  const [room, setRoom] = useState<RaidLobbyRoom>(initialRoom);
  const [loadingTurn, setLoadingTurn] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [autoBattle, setAutoBattle] = useState<boolean>(false);
  const [bossHitAnim, setBossHitAnim] = useState<boolean>(false);
  const [playerHitAnim, setPlayerHitAnim] = useState<number | null>(null);
  const [victoryRewards, setVictoryRewards] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const getAuthHeaders = () => {
    const activeToken = token || localStorage.getItem("nekomon_token") || localStorage.getItem("token") || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }
    if (currentUser?.id) {
      headers["x-user-id"] = currentUser.id;
    }
    if (currentUser?.email) {
      headers["x-user-email"] = currentUser.email;
    }
    return headers;
  };

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room.battleLogs]);

  // Keep every participant synchronized both in the lobby and during battle.
  useEffect(() => {
    if (room.status === "waiting" || room.status === "in_battle") {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/raid/lobby/${room.id}`, {
            headers: getAuthHeaders()
          });
          if (res.ok) {
            const data = await res.json();
            if (data.room) setRoom(data.room);
          }
        } catch (e) {
          console.error("Room sync error:", e);
        }
      }, room.status === "in_battle" ? 1500 : 3000);
      return () => clearInterval(interval);
    }
  }, [room.id, room.status]);

  // Auto-battle runner
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoBattle && room.status === "in_battle" && !loadingTurn) {
      timer = setTimeout(() => {
        handleExecuteTurn();
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [autoBattle, room.status, loadingTurn]);

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleStartBattle = async () => {
    setLoadingTurn(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/raid/lobby/start", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ roomId: room.id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (currentLanguage === "id" ? "Gagal memulai battle." : "Failed to start battle."));

      setRoom(data.room);
    } catch (e: any) {
      setErrorMsg(e.message || (currentLanguage === "id" ? "Gagal memulai pertarungan." : "Failed to start battle."));
    } finally {
      setLoadingTurn(false);
    }
  };

  const handleExecuteTurn = async () => {
    if (loadingTurn || room.status !== "in_battle") return;

    setLoadingTurn(true);
    setErrorMsg("");
    setBossHitAnim(true);
    setTimeout(() => setBossHitAnim(false), 600);

    try {
      const res = await fetch("/api/raid/lobby/turn", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ roomId: room.id, action: "attack", expectedTurn: room.currentTurn })
      });

      const data = await res.json();
      if (res.status === 409 && data.room) {
        setRoom(data.room);
        return;
      }
      if (!res.ok) throw new Error(data.error || (currentLanguage === "id" ? "Gagal menjalankan turn." : "Failed to execute turn."));

      setRoom(data.room);

      if (data.victory) {
        setVictoryRewards(data.sharedRewards);
        setAutoBattle(false);
        if (onRefreshUserData) onRefreshUserData();
      } else if (data.defeated) {
        setAutoBattle(false);
      }
    } catch (e: any) {
      setErrorMsg(e.message || (currentLanguage === "id" ? "Gagal menjalankan serangan." : "Failed to execute attack."));
      setAutoBattle(false);
    } finally {
      setLoadingTurn(false);
    }
  };

  const handleExitArena = async () => {
    // If exiting while battle or lobby is still active, notify server to release room and card locks
    if (room.status === "waiting" || room.status === "in_battle") {
      try {
        const activeToken = token || localStorage.getItem("nekomon_token") || localStorage.getItem("token") || "";
        await fetch("/api/raid/lobby/leave", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
            ...(currentUser?.id ? { "x-user-id": currentUser.id } : {})
          },
          body: JSON.stringify({ roomId: room.id })
        }).catch(() => null);
      } catch (e) {
        console.warn("Failed to notify leave:", e);
      }
    }
    if (onRefreshUserData) {
      onRefreshUserData();
    }
    onExit();
  };

  const boss = room.bossSnapshot;
  const bossHpPercent = Math.max(0, Math.min(100, Math.round((room.bossCurrentHp / room.bossMaxHp) * 100)));
  const isHost = !room.hostUserId || currentUser?.id === room.hostUserId || room.slots[0]?.userId === currentUser?.id || currentUser?.role === "developer";

  const getElementBadge = (elem: string) => {
    switch (elem) {
      case "Api":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30"><Flame size={12} /> {elem}</span>;
      case "Air":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30"><Droplets size={12} /> {elem}</span>;
      case "Tanah":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><Mountain size={12} /> {elem}</span>;
      case "Angin":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30"><Wind size={12} /> {elem}</span>;
      case "Petir":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"><Zap size={12} /> {elem}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-800 text-neutral-300">{elem}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-3 sm:p-6 pb-24 max-w-5xl mx-auto flex flex-col justify-between">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
        <button
          id="exit-raid-btn"
          onClick={handleExitArena}
          className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 border border-neutral-800 flex items-center gap-1.5 transition"
        >
          <ArrowLeft size={14} />
          {currentLanguage === "id" ? "Keluar Arena" : "Exit Arena"}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-400">
            {room.isSinglePlayer
              ? currentLanguage === "id"
                ? "⚔️ Single Player Raid"
                : "⚔️ Single Player Raid"
              : currentLanguage === "id"
              ? "👥 Multiplayer Co-op"
              : "👥 Multiplayer Co-op"}
          </span>

          {!room.isSinglePlayer && (
            <button
              id="copy-room-code-btn"
              onClick={handleCopyRoomCode}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-xs font-mono font-bold text-indigo-300 border border-indigo-700/50 flex items-center gap-1 transition"
            >
              {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {room.roomCode}
            </button>
          )}

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              room.status === "in_battle"
                ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                : room.status === "waiting"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : room.status === "victory"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {room.status === "in_battle"
              ? `Ronde ${room.currentTurn}`
              : room.status === "waiting"
              ? "Menunggu"
              : room.status === "victory"
              ? "Kemenangan!"
              : "Kekalahan"}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* BOSS STAGE (TOP SECTION) */}
      <div className="relative rounded-2xl bg-gradient-to-b from-red-950/40 via-neutral-900 to-neutral-950 border border-red-900/50 p-5 sm:p-6 mb-5 shadow-2xl overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10">
          {/* Boss Artwork with dynamic hit animation */}
          <div
            className={`w-32 h-32 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-neutral-950 border-2 border-red-500/60 shadow-2xl shrink-0 transition-transform duration-200 ${
              bossHitAnim ? "scale-95 brightness-150 ring-4 ring-red-500" : "scale-100"
            }`}
          >
            <img
              src={boss.imageUrl}
              alt={boss.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Boss HP & Meta Info */}
          <div className="flex-1 w-full min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-xs font-black bg-red-600 text-white shadow">
                LV. {boss.level}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 capitalize">
                {boss.speciesType === "kucing" ? "🐱 Cat Boss" : boss.speciesType === "tikus" ? "🐭 Rat Boss" : "🐶 Dog Boss"}
              </span>
              {getElementBadge(boss.element)}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {currentLanguage === "id" ? boss.name : boss.nameEn || boss.name}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              📍 {boss.locationName}
            </p>

            {/* Boss HP Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs font-mono mb-1 font-bold">
                <span className="text-red-400">HP BOSS</span>
                <span className="text-neutral-300">
                  {room.bossCurrentHp.toLocaleString()} / {room.bossMaxHp.toLocaleString()} ({bossHpPercent}%)
                </span>
              </div>
              <div className="w-full h-4 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${bossHpPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Buff & Debuff Indicators */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/40 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 font-semibold">
                  💥 Debuff Lemah (+30%):
                </span>
                {getElementBadge(boss.debuffElement)}
              </div>
              <div className="p-2 rounded-lg bg-red-950/40 border border-red-900/40 flex items-center justify-between">
                <span className="text-[11px] text-red-400 font-semibold">
                  🛡️ Buff Tahan (-20%):
                </span>
                {getElementBadge(boss.buffElement)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMBAT LOGS WINDOW */}
      <div className="mb-5 rounded-2xl bg-neutral-950 border border-neutral-800 p-3 sm:p-4 h-48 overflow-y-auto font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-neutral-400 text-[11px]">
          <span className="font-bold flex items-center gap-1">
            <Swords size={12} className="text-red-400" /> Log Pertarungan Real-Time
          </span>
          <span>Ronde #{room.currentTurn}</span>
        </div>

        <div className="space-y-1.5">
          {room.battleLogs.map((log, idx) => {
            const isBoss = log.actorType === "boss";
            return (
              <div
                key={idx}
                className={`p-2 rounded-lg leading-relaxed ${
                  isBoss
                    ? "bg-red-950/30 text-red-300 border-l-2 border-red-500"
                    : log.actor === "Victory"
                    ? "bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500 font-bold"
                    : log.actor === "System"
                    ? "bg-neutral-900/80 text-neutral-400"
                    : "bg-neutral-900/60 text-neutral-200 border-l-2 border-indigo-500"
                }`}
              >
                {currentLanguage === "id" ? log.messageId : log.messageEn || log.messageId}
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* 3 PLAYER COMBAT SLOTS (BOTTOM SECTION) */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Shield size={14} className="text-indigo-400" />
            {currentLanguage === "id" ? "Slot Pasukan Nekomon (3 Slot)" : "Nekomon Combat Slots (3 Slots)"}
          </h3>
          <span className="text-xs text-neutral-400">
            {room.slots.filter((s) => s !== null).length} / 3 {currentLanguage === "id" ? "Terisi" : "Filled"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((slotIdx) => {
            const slot = room.slots[slotIdx];
            if (!slot) {
              return (
                <div
                  key={slotIdx}
                  id={`empty-slot-${slotIdx}`}
                  className="rounded-xl bg-neutral-900/40 border border-dashed border-neutral-800 p-4 flex flex-col items-center justify-center text-center min-h-[140px]"
                >
                  <Users size={24} className="text-neutral-600 mb-1" />
                  <span className="text-xs font-bold text-neutral-400">
                    Slot {slotIdx + 1}: {currentLanguage === "id" ? "Kosong" : "Empty"}
                  </span>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    {room.isSinglePlayer
                      ? currentLanguage === "id"
                        ? "Pilih kartu di persiapan"
                        : "Select card in prep"
                      : currentLanguage === "id"
                      ? "Menunggu teman join..."
                      : "Waiting for player..."}
                  </p>
                </div>
              );
            }

            const card = slot.card;
            const hpPercent = Math.max(0, Math.min(100, Math.round((slot.currentHp / slot.maxHp) * 100)));
            const isFallen = slot.currentHp <= 0;

            return (
              <div
                key={slotIdx}
                id={`combat-slot-${slotIdx}`}
                className={`rounded-xl bg-neutral-900 border p-3 flex flex-col justify-between transition-all shadow-md ${
                  isFallen
                    ? "border-red-900/40 opacity-60 bg-red-950/20"
                    : "border-neutral-800 hover:border-indigo-500/40"
                }`}
              >
                <div>
                  {/* Slot Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      Slot {slotIdx + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-300 truncate max-w-[100px]">
                      {slot.username}
                    </span>
                  </div>

                  {/* Card Visual & Stats */}
                  <div className="flex items-center gap-2.5">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-12 h-12 rounded-lg object-cover bg-neutral-950 shrink-0 border border-neutral-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{card.name}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        {getElementBadge(card.element)}
                        <span className="text-[10px] text-neutral-400">Lv.{card.level || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HP Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-mono font-bold mb-0.5">
                    <span className={isFallen ? "text-red-500" : "text-emerald-400"}>
                      {isFallen ? "TUMBANG" : "HP"}
                    </span>
                    <span className="text-neutral-300">
                      {slot.currentHp} / {slot.maxHp}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFallen ? "bg-red-900" : "bg-emerald-500"
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Total Damage Dealt */}
                <div className="mt-2 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                  <span>Damage:</span>
                  <span className="font-bold text-amber-400">{slot.damageDealt?.toLocaleString() || 0} DMG</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTROLS BAR (BOTTOM FIXED / ACTIONS) */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        {room.status === "waiting" ? (
          <>
            <div className="text-xs text-neutral-400 text-center sm:text-left">
              {room.isSinglePlayer
                ? currentLanguage === "id"
                  ? "Semua slot kartu siap. Klik tombol di kanan untuk mulai."
                  : "All cards ready. Click start to begin."
                : currentLanguage === "id"
                ? `Bagikan kode ${room.roomCode} ke teman atau mulai pertarungan langsung.`
                : `Share code ${room.roomCode} with friends or start battle immediately.`}
            </div>

            {isHost && (
              <button
                id="start-raid-battle-btn"
                onClick={handleStartBattle}
                disabled={loadingTurn}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 font-bold text-white text-xs shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Play size={14} className={loadingTurn ? "animate-spin" : ""} />
                {loadingTurn
                  ? currentLanguage === "id"
                    ? "Memulai Battle..."
                    : "Starting Battle..."
                  : currentLanguage === "id"
                  ? "Mulai Pertarungan Raid"
                  : "Start Raid Battle"}
              </button>
            )}
          </>
        ) : room.status === "in_battle" ? (
          <>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="auto-battle-toggle-btn"
                onClick={() => setAutoBattle(!autoBattle)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  autoBattle
                    ? "bg-red-600 text-white border-red-500 animate-pulse"
                    : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700"
                }`}
              >
                <Zap size={14} />
                {autoBattle
                  ? currentLanguage === "id"
                    ? "Otomatis ON"
                    : "Auto ON"
                  : currentLanguage === "id"
                  ? "Otomatis OFF"
                  : "Auto OFF"}
              </button>
            </div>

            <button
              id="execute-turn-btn"
              onClick={handleExecuteTurn}
              disabled={loadingTurn}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 font-black text-white text-sm shadow-xl shadow-red-950/60 flex items-center justify-center gap-2 transition transform active:scale-95"
            >
              <Swords size={16} />
              {loadingTurn
                ? currentLanguage === "id"
                  ? "Menyerang..."
                  : "Attacking..."
                : currentLanguage === "id"
                ? "⚡ SERANG BERSAMA (Co-op Attack)"
                : "⚡ CO-OP STRIKE"}
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300">
              {room.status === "victory"
                ? currentLanguage === "id"
                  ? "🎉 Kemenangan Raid tercapai!"
                  : "🎉 Raid Victory achieved!"
                : currentLanguage === "id"
                ? "💀 Pasukan tumbang. Coba lagi!"
                : "💀 Defeated. Try again!"}
            </span>
            <button
              onClick={handleExitArena}
              className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition"
            >
              {currentLanguage === "id" ? "Kembali ke Raid Hub" : "Back to Raid Hub"}
            </button>
          </div>
        )}
      </div>

      {/* VICTORY MODAL OVERLAY */}
      {room.status === "victory" && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-emerald-500/50 rounded-2xl w-full max-w-md p-6 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>

            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
              <Award size={32} />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase tracking-wider">
              {currentLanguage === "id" ? "Raid Boss Tumbang!" : "Raid Boss Defeated!"}
            </span>

            <h2 className="text-2xl font-black text-white mt-2">
              {currentLanguage === "id" ? "KEMENANGAN BERSAMA! 🎉" : "SHARED VICTORY! 🎉"}
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              {currentLanguage === "id"
                ? `Seluruh tim pemain berhasil menumbangkan ${boss.name} (LV. ${boss.level}) dan menerima pembagian hadiah rata:`
                : `All team players defeated ${boss.nameEn || boss.name} (LV. ${boss.level}) and received shared rewards:`}
            </p>

            {/* Shared Rewards Box */}
            <div className="mt-5 p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" /> Nekomon Cores (Shared)
                </span>
                <span className="font-bold font-mono text-amber-300">+{boss.rewards.cores} Cores</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Award size={14} className="text-indigo-400" /> Nekomon Points
                </span>
                <span className="font-bold font-mono text-indigo-300">+{boss.rewards.points} Pts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Zap size={14} className="text-yellow-400" /> Energi Kartu Pulih
                </span>
                <span className="font-bold font-mono text-yellow-300">+{boss.rewards.energyRefill} Energy</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Swords size={14} className="text-red-400" /> EXP Kartu
                </span>
                <span className="font-bold font-mono text-red-300">+{boss.rewards.cardXp} XP</span>
              </div>
            </div>

            <button
              id="claim-victory-exit-btn"
              onClick={handleExitArena}
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-white text-xs shadow-lg shadow-emerald-950/60 transition"
            >
              {currentLanguage === "id" ? "Klaim & Kembali ke Hub" : "Claim & Back to Hub"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
