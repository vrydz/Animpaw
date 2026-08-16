import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  Swords, 
  Sparkles, 
  Crown, 
  Zap, 
  Flame, 
  Droplets, 
  Sprout, 
  Wind, 
  Zap as LightningIcon, 
  Layers, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Coins, 
  Award, 
  User as UserIcon, 
  Info, 
  X, 
  ChevronRight, 
  ArrowUpRight,
  ShieldCheck,
  Radio,
  Clock,
  Target,
  Sparkle,
  Lock,
  Hourglass,
  Timer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { BeaconNode, Card, User, TerritoryBattleLog, WarResetCountdown } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { haptics } from "../lib/vibration";
import { audio } from "../lib/audio";
import { NekomonCard } from "./NekomonCard";

interface TerritoryControlViewProps {
  user: User;
  cards: Card[];
  token: string;
  onRefreshUser: () => void;
}

export const TerritoryControlView: React.FC<TerritoryControlViewProps> = ({
  user,
  cards,
  token,
  onRefreshUser
}) => {
  const { language } = useLanguage();

  // State
  const [nodes, setNodes] = useState<BeaconNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<BeaconNode | null>(null);
  const [playerFaction, setPlayerFaction] = useState<"Sentinel" | "Vanguard">(user?.faction || "Sentinel");
  const [playerUnclaimedCores, setPlayerUnclaimedCores] = useState<number>(0);
  const [playerNodesCount, setPlayerNodesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClaimingCores, setIsClaimingCores] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [warResetCountdown, setWarResetCountdown] = useState<WarResetCountdown | null>(null);

  // 1-second live ticker for smooth real-time visual cooldowns
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Modals & Action States
  const [showFactionModal, setShowFactionModal] = useState<boolean>(!user?.faction);
  const [isSubmittingFaction, setIsSubmittingFaction] = useState<boolean>(false);
  const [showCaptureModal, setShowCaptureModal] = useState<boolean>(false);
  const [showBattleModal, setShowBattleModal] = useState<boolean>(false);
  const [showReinforceModal, setShowReinforceModal] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  // Capture selection
  const [selectedAnchorCardId, setSelectedAnchorCardId] = useState<string>("");
  const [selectedGarrisonCardIds, setSelectedGarrisonCardIds] = useState<string[]>([]);
  const [isSubmittingCapture, setIsSubmittingCapture] = useState<boolean>(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Battle selection & simulation
  const [selectedAttackerCardIds, setSelectedAttackerCardIds] = useState<string[]>([]);
  const [isBattling, setIsBattling] = useState<boolean>(false);
  const [battleLogs, setBattleLogs] = useState<TerritoryBattleLog[]>([]);
  const [battleResult, setBattleResult] = useState<{ won: boolean; nodeCaptured: boolean; cores: number; points: number } | null>(null);

  // Reinforce selection
  const [selectedSupportCardId, setSelectedSupportCardId] = useState<string>("");
  const [isSubmittingReinforce, setIsSubmittingReinforce] = useState<boolean>(false);

  // Notification popup
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper: Format War Reset Countdown (Days, Hours, Mins, Secs)
  const formatWarResetTimer = (countdownEndIso: string) => {
    const endMs = new Date(countdownEndIso).getTime();
    const remainingMs = Math.max(0, endMs - currentTime);
    const totalSecs = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return {
      days,
      hours,
      mins,
      secs,
      formatted: `${days}h ${String(hours).padStart(2, "0")}j ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`,
      isExpired: totalSecs <= 0
    };
  };

  // Fetch territory state from server
  const fetchTerritoryNodes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/territory/nodes", {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      const data = await res.json();
      if (data.success) {
        setNodes(data.nodes || []);
        if (data.playerFaction) setPlayerFaction(data.playerFaction);
        setPlayerUnclaimedCores(data.playerUnclaimedCores || 0);
        setPlayerNodesCount(data.playerNodesCount || 0);
        setWarResetCountdown(data.warResetCountdown || null);
        
        if (selectedNode) {
          const updated = (data.nodes || []).find((n: BeaconNode) => n.id === selectedNode.id);
          if (updated) setSelectedNode(updated);
        } else if (data.nodes && data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching territory nodes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTerritoryNodes();
    const interval = setInterval(fetchTerritoryNodes, 25000);
    return () => clearInterval(interval);
  }, [token]);

  // Mythic Cards Owned by User
  const userMythicCards = cards.filter(c => c.rarity === "Mythic");
  const maxAllowedNodes = Math.max(2, 1 + (userMythicCards.length * 2));

  // Element styling helper
  const getElementBadge = (element: string) => {
    switch (element) {
      case "Api":
        return { icon: Flame, color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40", glow: "shadow-red-500/20" };
      case "Air":
        return { icon: Droplets, color: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/40", glow: "shadow-cyan-500/20" };
      case "Tanah":
        return { icon: Sprout, color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/40", glow: "shadow-emerald-500/20" };
      case "Angin":
        return { icon: Wind, color: "text-teal-300", bg: "bg-teal-500/20", border: "border-teal-500/40", glow: "shadow-teal-500/20" };
      case "Petir":
        return { icon: LightningIcon, color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/40", glow: "shadow-amber-500/20" };
      default:
        return { icon: Sparkles, color: "text-slate-300", bg: "bg-slate-800", border: "border-slate-700", glow: "" };
    }
  };

  // Territory 2-Hour Capture Cooldown Helpers
  const getNodeCooldownRemaining = (node: BeaconNode | null | undefined): number => {
    if (!node || (!node.capturedAt && !node.cooldownUntil)) return 0;
    const cooldownEnd = node.cooldownUntil
      ? new Date(node.cooldownUntil).getTime()
      : new Date(node.capturedAt!).getTime() + 2 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((cooldownEnd - currentTime) / 1000));
  };

  const formatCooldownDigital = (seconds: number): string => {
    if (seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatCooldownHuman = (seconds: number, lang: string): string => {
    if (seconds <= 0) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (lang === "id") {
      return `${h > 0 ? `${h}j ` : ""}${m}m ${s}d`;
    }
    return `${h > 0 ? `${h}h ` : ""}${m}m ${s}s`;
  };

  // Check if an adjacent node owned by the current player was recently captured (blocks offensive moves for 2 hours)
  const getAdjacentCooldownForPlayer = (targetNode: BeaconNode | null | undefined): {
    isLocked: boolean;
    remainingSeconds: number;
    sourceNode?: BeaconNode;
  } => {
    if (!targetNode) return { isLocked: false, remainingSeconds: 0 };
    const connectedNeighbors = nodes.filter(n => (targetNode.connectedNodeIds || []).includes(n.id));
    let maxRemaining = 0;
    let sourceNode: BeaconNode | undefined;

    for (const neighbor of connectedNeighbors) {
      if (neighbor.ownerId === user.id) {
        const rem = getNodeCooldownRemaining(neighbor);
        if (rem > maxRemaining) {
          maxRemaining = rem;
          sourceNode = neighbor;
        }
      }
    }

    return {
      isLocked: maxRemaining > 0,
      remainingSeconds: maxRemaining,
      sourceNode
    };
  };

  // Claim all accumulated cores
  const handleClaimAllCores = async () => {
    if (playerUnclaimedCores <= 0 || isClaimingCores) return;
    try {
      setIsClaimingCores(true);
      const res = await fetch("/api/territory/claim-cores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          language === "id" 
            ? `Berhasil mengklaim +${data.coresClaimed} Nekomon Cores!` 
            : `Successfully claimed +${data.coresClaimed} Nekomon Cores!`, 
          "success"
        );
        try {
          audio.playVictorySound();
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch (_) {}
        onRefreshUser();
        fetchTerritoryNodes();
      } else {
        showToast(data.error || "Gagal mengklaim core.", "error");
      }
    } catch (_) {
      showToast("Gagal koneksi ke server.", "error");
    } finally {
      setIsClaimingCores(false);
    }
  };

  // Choose / Change Faction Handler
  const handleChooseFaction = async (faction: "Sentinel" | "Vanguard") => {
    try {
      setIsSubmittingFaction(true);
      const res = await fetch("/api/territory/choose-faction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ faction })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlayerFaction(faction);
        showToast(
          language === "id"
            ? `Berhasil bergabung dengan Faksi ${faction}! Semua kartu Nekomon milikmu dapat bergabung memperjuangkan faksi ini.`
            : `Joined the ${faction} Faction! All your Nekomon cards can join the battle for this faction.`,
          "success"
        );
        try {
          audio.playVictorySound();
          confetti({ particleCount: 70, spread: 60 });
        } catch (_) {}
        setShowFactionModal(false);
        onRefreshUser();
        fetchTerritoryNodes();
      } else {
        showToast(data.error || "Gagal memilih faksi.", "error");
      }
    } catch (_) {
      showToast("Kesalahan server.", "error");
    } finally {
      setIsSubmittingFaction(false);
    }
  };

  // Check if node is connected to player's territory or faction base
  // Rule 1: Markas Komando HQ (Sentinel/Vanguard) berstatus netral di awal dan harus segera di-capture
  // Rule 6: Capture beacon lain hanya bisa dilakukan jika terhubung dengan HQ yang sudah dikuasai atau wilayah sekutu
  const isNodeConnectedToPlayer = (target: BeaconNode) => {
    if (!target) return false;

    // Direct access to player's own starting HQ base
    if (target.isBase && target.baseFaction === playerFaction) {
      return true;
    }

    // For any other beacon, player's faction must have captured their own HQ first
    const ownFactionHQ = nodes.find(n => n.isBase && n.baseFaction === playerFaction);
    const isOwnHQCaptured = ownFactionHQ && ownFactionHQ.ownerFaction === playerFaction && ownFactionHQ.ownerId;
    if (!isOwnHQCaptured) {
      return false;
    }

    const connectedNeighbors = nodes.filter(n => (target.connectedNodeIds || []).includes(n.id));
    return connectedNeighbors.some(n => {
      if (n.ownerId === user.id) return true;
      if (n.isBase && n.baseFaction === playerFaction && n.ownerFaction === playerFaction && n.ownerId) return true;
      if (n.ownerFaction === playerFaction && n.isActive && n.ownerId) return true;
      return false;
    });
  };

  // Tier Benefit Helper
  const getNodeTierCores = (tier: number) => {
    if (tier === 3) return 10;
    if (tier === 2) return 7;
    return 5;
  };

  // Capture Beacon Node Handler
  const handleCaptureBeacon = async () => {
    if (!selectedNode || !selectedAnchorCardId) {
      setCaptureError(language === "id" ? "Pilih 1 kartu Mythic sebagai Anchor!" : "Select 1 Mythic card as Anchor!");
      return;
    }

    try {
      setIsSubmittingCapture(true);
      setCaptureError(null);

      const res = await fetch("/api/territory/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          nodeId: selectedNode.id,
          anchorCardId: selectedAnchorCardId,
          garrisonCardIds: selectedGarrisonCardIds
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const tierCores = getNodeTierCores(selectedNode.tier);
        showToast(
          data.message || (
            language === "id"
              ? `Beacon ${selectedNode.name} (Tier ${selectedNode.tier}: ${tierCores} Cores/hari) berhasil dikuasai!`
              : `Beacon ${selectedNode.nameEn || selectedNode.name} (Tier ${selectedNode.tier}: ${tierCores} Cores/day) captured!`
          ),
          "success"
        );
        if (data.warResetCountdown) {
          setWarResetCountdown(data.warResetCountdown);
        }
        try {
          audio.playVictorySound();
          confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
        } catch (_) {}
        setShowCaptureModal(false);
        onRefreshUser();
        fetchTerritoryNodes();
      } else {
        setCaptureError(data.error || "Gagal merebut beacon.");
      }
    } catch (_) {
      setCaptureError("Koneksi gagal.");
    } finally {
      setIsSubmittingCapture(false);
    }
  };

  // Battle Garrison on Node Handler
  const handleStartBattle = async () => {
    if (!selectedNode || selectedAttackerCardIds.length === 0) {
      showToast(language === "id" ? "Pilih minimal 1 kartu penyerang!" : "Select at least 1 attacking card!", "error");
      return;
    }

    const adjCool = getAdjacentCooldownForPlayer(selectedNode);
    if (adjCool.isLocked) {
      showToast(
        language === "id"
          ? `Jeda Penaklukan Aktif: Serangan ke node sekitar ditangguhkan (${formatCooldownDigital(adjCool.remainingSeconds)}).`
          : `Capture Cooldown Active: Assault on adjacent sector is paused (${formatCooldownDigital(adjCool.remainingSeconds)}).`,
        "error"
      );
      return;
    }

    try {
      setIsBattling(true);
      setBattleLogs([]);
      setBattleResult(null);

      const res = await fetch("/api/territory/battle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          nodeId: selectedNode.id,
          attackerCardIds: selectedAttackerCardIds
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBattleLogs(data.turns || []);
        setBattleResult({
          won: data.won,
          nodeCaptured: data.nodeCaptured,
          cores: data.coresRewarded,
          points: data.pointsRewarded
        });
        if (data.won) {
          try {
            audio.playVictorySound();
            if (data.nodeCaptured) {
              confetti({ particleCount: 60, spread: 80 });
            }
          } catch (_) {}
        }
        onRefreshUser();
        fetchTerritoryNodes();
      } else {
        showToast(data.error || "Gagal memulai pertempuran.", "error");
      }
    } catch (_) {
      showToast("Kesalahan server.", "error");
    } finally {
      setIsBattling(false);
    }
  };

  // Reinforce Beacon Node Handler
  const handleReinforceBeacon = async () => {
    if (!selectedNode || !selectedSupportCardId) return;

    try {
      setIsSubmittingReinforce(true);
      const res = await fetch("/api/territory/reinforce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          nodeId: selectedNode.id,
          supportCardId: selectedSupportCardId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          language === "id" 
            ? `Beacon berhasil diperkuat! (+30 HP Garnisun, +20 Poin Trainer)` 
            : `Beacon successfully reinforced! (+30 Garrison HP, +20 Trainer Pts)`,
          "success"
        );
        try {
          audio.playForgingSound();
        } catch (_) {}
        setShowReinforceModal(false);
        setSelectedSupportCardId("");
        onRefreshUser();
        fetchTerritoryNodes();
      } else {
        showToast(data.error || "Gagal memperkuat beacon.", "error");
      }
    } catch (_) {
      showToast("Kesalahan jaringan.", "error");
    } finally {
      setIsSubmittingReinforce(false);
    }
  };

  // Territory Faction Stats Calculation
  const sentinelNodes = nodes.filter(n => n.ownerFaction === "Sentinel").length;
  const vanguardNodes = nodes.filter(n => n.ownerFaction === "Vanguard").length;
  const totalOccupied = Math.max(1, sentinelNodes + vanguardNodes);
  const sentinelPercent = Math.round((sentinelNodes / totalOccupied) * 100);
  const vanguardPercent = 100 - sentinelPercent;

  return (
    <div className="flex flex-col gap-5 w-full font-mono select-none">
      
      {/* TOAST POPUP NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[2000] px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-lg ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-900/30"
                : toastMessage.type === "error"
                ? "bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-rose-900/30"
                : "bg-slate-900/90 text-amber-200 border-amber-500/50 shadow-amber-900/30"
            }`}
          >
            {toastMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastMessage.type === "info" && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER HUD & TERRITORY OVERVIEW */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Title & Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                {language === "id" ? "Dominasi Wilayah Beacon" : "Territory Control & Beacon War"}
              </h2>
              <button
                onClick={() => setShowInfoModal(true)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                title={language === "id" ? "Panduan Mode Wilayah" : "Territory Mode Guide"}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === "id"
                ? "Kuasai Beacon berjenjang (T1: 5 Core, T2: 7 Core, T3: 10 Core/hari) dengan kartu Mythic Anchor!"
                : "Control tiered Beacons (T1: 5, T2: 7, T3: 10 Cores/day) with Mythic Anchor cards!"}
            </p>
          </div>
        </div>

        {/* Cores Claiming Panel & Player Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Faction Badge & Switcher Button */}
          <button
            onClick={() => setShowFactionModal(true)}
            className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer hover:scale-105 ${
              playerFaction === "Sentinel"
                ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:border-cyan-400 shadow-cyan-950/40"
                : "bg-red-950/60 border-red-500/40 text-red-300 hover:border-red-400 shadow-red-950/40"
            }`}
            title={language === "id" ? "Klik untuk ganti Faksi / Guild" : "Click to switch Faction / Guild"}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                {language === "id" ? "FAKSI (GANTI)" : "FACTION (SWITCH)"}
              </span>
              <span className="text-xs font-black flex items-center gap-1">
                <span>{playerFaction}</span>
                <span className="text-[9px] text-amber-400">✎</span>
              </span>
            </div>
          </button>

          {/* Owned Nodes Counter */}
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                {language === "id" ? "WILAYAH DIKUASAI" : "CONTROLLED NODES"}
              </span>
              <span className="text-xs font-black text-amber-300">
                {playerNodesCount} / {maxAllowedNodes} Beacon
              </span>
            </div>
          </div>

          {/* Claim All Cores Button */}
          <button
            onClick={handleClaimAllCores}
            disabled={playerUnclaimedCores <= 0 || isClaimingCores}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
              playerUnclaimedCores > 0
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20 active:scale-95 animate-pulse"
                : "bg-slate-800/80 text-slate-500 border border-slate-750 cursor-not-allowed"
            }`}
          >
            <Layers className={`w-4 h-4 ${playerUnclaimedCores > 0 ? "text-slate-950 animate-bounce" : "text-slate-500"}`} />
            <span>
              {language === "id" ? "Klaim Core Wilayah" : "Claim Territory Cores"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-950/80 text-cyan-300 font-mono text-[11px] font-black">
              +{playerUnclaimedCores} Cores
            </span>
          </button>
        </div>
      </div>

      {/* WAR VICTORY RESET 3-DAY COUNTDOWN BANNER */}
      {warResetCountdown && warResetCountdown.isActive && (() => {
        const timer = formatWarResetTimer(warResetCountdown.resetAt);
        if (timer.isExpired) return null;
        const isSentinelWinner = warResetCountdown.winnerFaction === "Sentinel";

        return (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl ${
              isSentinelWinner
                ? "bg-gradient-to-r from-blue-950/90 via-cyan-950/70 to-slate-950 border-cyan-500/50 shadow-cyan-950/50"
                : "bg-gradient-to-r from-red-950/90 via-amber-950/70 to-slate-950 border-red-500/50 shadow-red-950/50"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-2xl shrink-0 ${
                isSentinelWinner ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"
              }`}>
                <Crown className="w-7 h-7 animate-bounce" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    {language === "id" ? "FASE AKHIR PERANG" : "WAR FINAL PHASE"}
                  </span>
                  <span className={`text-xs font-black uppercase ${isSentinelWinner ? "text-cyan-300" : "text-red-300"}`}>
                    HQ {warResetCountdown.targetHQ === "Sentinel" ? "Sentinel Prime" : "Vanguard Prime"} {language === "id" ? "DITAKLUKKAN" : "CAPTURED"}!
                  </span>
                </div>
                <h3 className="text-sm font-black text-white mt-0.5">
                  {language === "id"
                    ? `Markas musuh berhasil direbut oleh ${warResetCountdown.capturedByUsername || "Pemain"} (${warResetCountdown.winnerFaction})!`
                    : `Enemy HQ captured by ${warResetCountdown.capturedByUsername || "Player"} (${warResetCountdown.winnerFaction})!`}
                </h3>
                <p className="text-[11px] text-slate-300">
                  {language === "id"
                    ? "Seluruh wilayah Beacon akan kembali Netral saat hitung mundur berakhir untuk memulai ronde perang berikutnya."
                    : "All Beacon territories will reset to Neutral when the countdown expires to begin the next season."}
                </p>
              </div>
            </div>

            {/* Countdown Box */}
            <div className="flex flex-col items-center sm:items-end shrink-0">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                {language === "id" ? "WAKTU TERSISA SEBELUM RESET" : "TIME UNTIL WAR RESET"}
              </span>
              <div className="flex items-center gap-1.5 font-mono font-black">
                <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-750 text-amber-300 text-center min-w-[42px]">
                  <span className="text-sm">{timer.days}</span>
                  <span className="block text-[8px] text-slate-500 uppercase">{language === "id" ? "HARI" : "DAYS"}</span>
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-750 text-amber-300 text-center min-w-[42px]">
                  <span className="text-sm">{String(timer.hours).padStart(2, "0")}</span>
                  <span className="block text-[8px] text-slate-500 uppercase">{language === "id" ? "JAM" : "HRS"}</span>
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-750 text-amber-300 text-center min-w-[42px]">
                  <span className="text-sm">{String(timer.mins).padStart(2, "0")}</span>
                  <span className="block text-[8px] text-slate-500 uppercase">{language === "id" ? "MENIT" : "MIN"}</span>
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-750 text-amber-300 text-center min-w-[42px]">
                  <span className="text-sm">{String(timer.secs).padStart(2, "0")}</span>
                  <span className="block text-[8px] text-slate-500 uppercase">{language === "id" ? "DETIK" : "SEC"}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* FACTION INFLUENCE METER */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            SENTINEL ({sentinelPercent}%)
          </span>
          <span className="text-slate-400 text-[10px] uppercase tracking-wider">
            {language === "id" ? "KONTROL TERITORI PULAU" : "ISLAND TERRITORY DOMINANCE"}
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            VANGUARD ({vanguardPercent}%)
            <Swords className="w-3.5 h-3.5 text-red-400" />
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700" 
            style={{ width: `${sentinelPercent}%` }} 
          />
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-red-600 transition-all duration-700" 
            style={{ width: `${vanguardPercent}%` }} 
          />
        </div>
      </div>

      {/* MAIN INTERACTIVE STRATEGIC TERRITORY MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Map Graphic / Interconnected Graph Canvas */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden min-h-[460px] flex flex-col justify-between">
          
          {/* Map Grid Background Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
          
          {/* Top Map HUD Overlay */}
          <div className="relative z-10 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{language === "id" ? "Jaringan Beacon Aktif" : "Active Beacon Grid"}</span>
            </div>
            
            <button
              onClick={fetchTerritoryNodes}
              disabled={isLoading}
              className="pointer-events-auto p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
              title="Refresh Jaringan Peta"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
            </button>
          </div>

          {/* SVG Connection Lines Rendering (Supply Lines) */}
          <div className="relative w-full h-[380px] my-2">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {nodes.map(node => {
                return (node.connectedNodeIds || []).map(targetId => {
                  const target = nodes.find(n => n.id === targetId);
                  if (!target || node.id > target.id) return null; // Avoid duplicate bidirectional lines

                  const isConnectedActive = node.isActive && target.isActive && (
                    (node.ownerId && node.ownerId === target.ownerId) ||
                    (node.ownerFaction && node.ownerFaction === target.ownerFaction)
                  );

                  const isSevered = (node.ownerId || target.ownerId) && (!node.isActive || !target.isActive);

                  return (
                    <g key={`line-${node.id}-${target.id}`}>
                      {/* Outer Glow */}
                      <line
                        x1={`${node.x}%`}
                        y1={`${node.y}%`}
                        x2={`${target.x}%`}
                        y2={`${target.y}%`}
                        stroke={
                          isConnectedActive 
                            ? node.ownerFaction === "Sentinel" ? "#06b6d4" : "#f59e0b"
                            : isSevered 
                            ? "#ef4444" 
                            : "#334155"
                        }
                        strokeWidth={isConnectedActive ? "3.5" : "1.5"}
                        strokeDasharray={isSevered ? "6,4" : isConnectedActive ? undefined : "4,4"}
                        strokeOpacity={isConnectedActive ? "0.9" : isSevered ? "0.7" : "0.35"}
                      />
                    </g>
                  );
                });
              })}
            </svg>

            {/* Interactive Node Beacon Points */}
            {nodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              const isPlayerOwned = node.ownerId === user.id;
              const elem = getElementBadge(node.element);
              const ElemIcon = elem.icon;
              const nodeCooldownSec = getNodeCooldownRemaining(node);
              const adjacentCooldown = getAdjacentCooldownForPlayer(node);

              return (
                <motion.div
                  key={node.id}
                  onClick={() => {
                    setSelectedNode(node);
                    haptics.tap();
                  }}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 flex flex-col items-center group`}
                >
                  {/* Visual 2-Hour Cooldown Timer Badge on Map */}
                  {nodeCooldownSec > 0 && (
                    <motion.span 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-4 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[8px] font-mono font-black tracking-tighter flex items-center gap-1 shadow-lg border border-amber-300 animate-pulse z-30"
                      title={language === "id" ? `Jeda Penaklukan: ${formatCooldownHuman(nodeCooldownSec, "id")}` : `Capture Cooldown: ${formatCooldownHuman(nodeCooldownSec, "en")}`}
                    >
                      <Clock className="w-2.5 h-2.5 text-slate-950 shrink-0" />
                      <span>{formatCooldownDigital(nodeCooldownSec)}</span>
                    </motion.span>
                  )}

                  {/* Visual Adjacent Attack Lock Badge */}
                  {nodeCooldownSec <= 0 && adjacentCooldown.isLocked && !isPlayerOwned && !node.isBase && (
                    <motion.span 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-4 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[8px] font-mono font-black tracking-tighter flex items-center gap-0.5 shadow-lg border border-rose-400 z-30"
                      title={language === "id" ? `Terkunci jeda penaklukan terhubung: ${formatCooldownHuman(adjacentCooldown.remainingSeconds, "id")}` : `Locked by adjacent capture cooldown: ${formatCooldownHuman(adjacentCooldown.remainingSeconds, "en")}`}
                    >
                      <Lock className="w-2.5 h-2.5 text-white shrink-0" />
                      <span>{formatCooldownDigital(adjacentCooldown.remainingSeconds)}</span>
                    </motion.span>
                  )}

                  {/* Node Anchor Icon */}
                  <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-xl ${
                    node.isBase
                      ? node.baseFaction === "Sentinel"
                        ? "bg-gradient-to-br from-cyan-600 to-blue-900 border-2 border-cyan-400 ring-4 ring-cyan-500/20 text-white"
                        : "bg-gradient-to-br from-red-600 to-amber-900 border-2 border-amber-400 ring-4 ring-amber-500/20 text-white"
                      : isPlayerOwned
                      ? node.isActive
                        ? "bg-gradient-to-br from-emerald-500 to-teal-800 border-2 border-emerald-300 ring-4 ring-emerald-500/30 text-white shadow-emerald-500/30"
                        : "bg-gradient-to-br from-amber-600 to-slate-900 border-2 border-dashed border-red-400 text-amber-200"
                      : node.ownerId
                      ? node.ownerFaction === "Sentinel"
                        ? "bg-gradient-to-br from-blue-700 to-slate-950 border-2 border-cyan-500/80 text-cyan-200"
                        : "bg-gradient-to-br from-red-700 to-slate-950 border-2 border-red-500/80 text-red-200"
                      : "bg-slate-900 border-2 border-slate-700 hover:border-amber-400 text-slate-400 hover:text-amber-300"
                  } ${isSelected ? "ring-4 ring-amber-400 scale-110 shadow-2xl" : ""}`}>
                    
                    {/* Node Center Icon */}
                    {node.isBase ? (
                      <Crown className="w-5 h-5 animate-pulse" />
                    ) : node.anchorCard ? (
                      <ElemIcon className="w-5 h-5 animate-spin-slow" />
                    ) : (
                      <ElemIcon className="w-4 h-4" />
                    )}

                    {/* Active Supply Line Beacon Pulse Indicator */}
                    {node.isActive && node.ownerId && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border border-slate-950 animate-ping" />
                    )}

                    {/* Cut-off Warning Icon */}
                    {!node.isActive && node.ownerId && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border border-slate-950 flex items-center justify-center text-[8px] text-white font-bold animate-bounce" title="Supply line terputus!">
                        !
                      </span>
                    )}

                    {/* Tier Star Badge */}
                    <span className="absolute -bottom-1.5 px-1 py-0.2 rounded-full bg-slate-950 border border-slate-700 text-[8px] font-black text-amber-400">
                      T{node.tier}
                    </span>
                  </div>

                  {/* Node Label Tooltip */}
                  <span className={`mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black tracking-tight whitespace-nowrap backdrop-blur-md shadow-md border ${
                    isSelected
                      ? "bg-amber-400 text-slate-950 border-amber-300 font-bold"
                      : isPlayerOwned
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-900/80 text-slate-300 border-slate-800"
                  }`}>
                    {language === "id" ? node.name : (node.nameEn || node.name)}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Map Legend */}
          <div className="relative z-10 pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400">
            <div className="flex items-center flex-wrap gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Sentinel
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Vanguard
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Milikmu
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" /> Netral
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>{language === "id" ? "Jeda 2 Jam" : "2h Cooldown"}</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{language === "id" ? "T1: 5 | T2: 7 | T3: 10 Cores/Hari" : "T1: 5 | T2: 7 | T3: 10 Cores/Day"}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Selected Beacon Inspector & Action Hub */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {selectedNode ? (() => {
            const selectedNodeCooldown = getNodeCooldownRemaining(selectedNode);
            const selectedAdjacentCooldown = getAdjacentCooldownForPlayer(selectedNode);

            return (
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col gap-4">
                
                {/* Header Info */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${getElementBadge(selectedNode.element).bg} ${getElementBadge(selectedNode.element).color} ${getElementBadge(selectedNode.element).border}`}>
                        {selectedNode.element.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        TIER {selectedNode.tier} ({getNodeTierCores(selectedNode.tier)} Cores/Hari)
                      </span>
                      {selectedNodeCooldown > 0 && (
                        <span className="px-2 py-0.5 text-[9px] font-mono font-black rounded-full bg-amber-500 text-slate-950 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-950" />
                          {formatCooldownDigital(selectedNodeCooldown)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-white">
                      {language === "id" ? selectedNode.name : (selectedNode.nameEn || selectedNode.name)}
                    </h3>
                  </div>

                  {selectedNode.isBase ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black rounded-lg uppercase shrink-0 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>MARKAS HQ</span>
                      </span>
                      <span className="text-[9px] font-bold text-amber-400/90 font-mono">
                        Syarat: Mythic Lv.3+
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* VISUAL COOLDOWN BANNER 1: NODE CAPTURE STABILIZATION (2 HOURS) */}
                {selectedNodeCooldown > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-slate-950 border border-amber-500/40 rounded-xl flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                        {language === "id" ? "JEDA PENAKLUKAN (2 JAM)" : "CAPTURE COOLDOWN (2 HOURS)"}
                      </span>
                      <span className="font-mono font-black text-xs text-amber-300 bg-slate-950 px-2.5 py-0.5 rounded-md border border-amber-500/40 shadow-inner">
                        {formatCooldownDigital(selectedNodeCooldown)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      {language === "id" 
                        ? "Beacon ini baru saja direbut. Sesuai aturan game balance, serangan ke node sekitar dijeda selama 2 jam." 
                        : "This Beacon was recently captured. Per 2-hour game balance rules, attacks on adjacent nodes are paused."}
                    </p>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                        style={{ width: `${Math.min(100, Math.max(0, (selectedNodeCooldown / 7200) * 100))}%` }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* VISUAL COOLDOWN BANNER 2: ADJACENT ATTACK LOCK (2 HOURS) */}
                {selectedNodeCooldown <= 0 && selectedAdjacentCooldown.isLocked && !selectedNode.isBase && selectedNode.ownerId !== user.id && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-gradient-to-br from-rose-500/20 via-red-500/10 to-slate-950 border border-rose-500/40 rounded-xl flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-rose-400 uppercase flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                        {language === "id" ? "SERANGAN TERKUNCI SEMENTARA" : "ATTACK TEMPORARILY LOCKED"}
                      </span>
                      <span className="font-mono font-black text-xs text-rose-300 bg-slate-950 px-2.5 py-0.5 rounded-md border border-rose-500/40 shadow-inner">
                        {formatCooldownDigital(selectedAdjacentCooldown.remainingSeconds)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      {language === "id"
                        ? `Kamu baru saja merebut node terhubung "${selectedAdjacentCooldown.sourceNode?.name || "Sekitar"}". Serangan ke node ini dijeda untuk mencegah ekspansi kilat.`
                        : `You recently captured connected node "${selectedAdjacentCooldown.sourceNode?.nameEn || selectedAdjacentCooldown.sourceNode?.name || "Neighbor"}". Attacks paused to prevent rapid expansion.`}
                    </p>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-1000"
                        style={{ width: `${Math.min(100, Math.max(0, (selectedAdjacentCooldown.remainingSeconds / 7200) * 100))}%` }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === "id" ? selectedNode.descriptionId : (selectedNode.descriptionEn || selectedNode.descriptionId)}
                </p>

                {/* Status Indicators (Supply Line & Owner) */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase font-black">
                      {language === "id" ? "STATUS JALUR (SUPPLY)" : "SUPPLY LINE"}
                    </span>
                    <span className={`font-black mt-0.5 flex items-center gap-1 ${
                      selectedNode.isActive ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {selectedNode.isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {language === "id" ? `Aktif (+${getNodeTierCores(selectedNode.tier)} Cores/h)` : `Active (+${getNodeTierCores(selectedNode.tier)} Cores/d)`}
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                          {language === "id" ? "Terputus (0 Cores)" : "Severed (0 Cores)"}
                        </>
                      )}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase font-black">
                      {language === "id" ? "PENGUASA AREA" : "CURRENT OWNER"}
                    </span>
                    <span className="font-black text-white mt-0.5 truncate">
                      {selectedNode.ownerName || (language === "id" ? "Belum Dikuasai (Netral)" : "Neutral Territory")}
                    </span>
                  </div>
                </div>

                {/* Defense Garrison HP Bar */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      {language === "id" ? "Ketahanan Garnisun" : "Garrison HP"}
                    </span>
                    <span className="font-mono font-black text-cyan-300">
                      {selectedNode.defenseHp} / {selectedNode.maxDefenseHp} HP
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, (selectedNode.defenseHp / selectedNode.maxDefenseHp) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Mythic Beacon Anchor Card Preview */}
                {selectedNode.anchorCard ? (
                  <div className="p-3 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-slate-950 border border-amber-500/30 rounded-xl flex items-center gap-3">
                    <div className="w-14 h-16 rounded-lg overflow-hidden border border-amber-500/50 bg-slate-950 shrink-0">
                      <img 
                        src={selectedNode.anchorCard.imageUrl} 
                        alt={selectedNode.anchorCard.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-amber-400 font-black tracking-wider uppercase flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        MYTHIC BEACON ANCHOR
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{selectedNode.anchorCard.name}</h4>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        ATK {selectedNode.anchorCard.atk} • DEF {selectedNode.anchorCard.def} • Lv.{selectedNode.anchorCard.level || 20}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950/80 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                    <Crown className="w-5 h-5 text-amber-400/50" />
                    <span>
                      {language === "id" 
                        ? "Belum ada kartu Mythic Anchor yang dipasang di Beacon ini." 
                        : "No Mythic Anchor card assigned to this Beacon."}
                    </span>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                  {/* 1. If Neutral or Breached -> Capture (Requires Mythic Card) */}
                  {(!selectedNode.ownerId || selectedNode.defenseHp <= 0) && (
                    <button
                      onClick={() => {
                        if (selectedAdjacentCooldown.isLocked) {
                          showToast(
                            language === "id"
                              ? `Jeda Penaklukan: Tunggu ${formatCooldownHuman(selectedAdjacentCooldown.remainingSeconds, "id")} sebelum merebut node sekitar.`
                              : `Capture Cooldown: Wait ${formatCooldownHuman(selectedAdjacentCooldown.remainingSeconds, "en")} before capturing adjacent nodes.`,
                            "error"
                          );
                          return;
                        }
                        if (!isNodeConnectedToPlayer(selectedNode)) {
                          showToast(
                            language === "id"
                              ? "Beacon harus terkoneksi langsung dengan wilayah milikmu atau Markas Faksimu!"
                              : "Beacon must directly connect to your owned area or Faction Base!",
                            "error"
                          );
                          return;
                        }
                        setShowCaptureModal(true);
                        haptics.tap();
                      }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                    >
                      <Crown className="w-4 h-4" />
                      <span>
                        {selectedNode.isBase 
                          ? (language === "id" ? "Kuasai Markas Komando HQ (Lv.3+ & 5/5 Energy)" : "Capture Command HQ Base (Lv.3+ & 5/5 Energy)")
                          : (language === "id" ? "Pasang Mythic Anchor & Klaim Area" : "Deploy Mythic Anchor & Capture")}
                      </span>
                    </button>
                  )}

                  {/* 2. If Owned by Enemy -> Attack / Battle Garrison */}
                  {selectedNode.ownerId && selectedNode.ownerId !== user.id && selectedNode.defenseHp > 0 && (
                    selectedAdjacentCooldown.isLocked ? (
                      <div className="w-full py-3 px-4 rounded-xl bg-slate-950 border border-rose-500/40 text-rose-300 font-bold text-xs uppercase tracking-wider flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-[11px]">
                            {language === "id" ? "Jeda Penaklukan:" : "Attack Cooldown:"}
                          </span>
                        </div>
                        <span className="font-mono font-black text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                          {formatCooldownDigital(selectedAdjacentCooldown.remainingSeconds)}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (!isNodeConnectedToPlayer(selectedNode)) {
                            showToast(
                              language === "id"
                                ? "Jalur Serangan: Kamu harus memiliki wilayah yang terhubung untuk menyerang Beacon ini!"
                                : "Attack Path: You must have an interconnected node to attack this Beacon!",
                              "error"
                            );
                            return;
                          }
                          setShowBattleModal(true);
                          haptics.tap();
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer"
                      >
                        <Swords className="w-4 h-4" />
                        <span>{language === "id" ? "Serang Garnisun Musuh (TCG Duel)" : "Assault Garrison (TCG Battle)"}</span>
                      </button>
                    )
                  )}

                  {/* 3. If Owned by Player or Friendly Faction -> Reinforce Support */}
                  {(selectedNode.ownerId === user.id || selectedNode.ownerFaction === playerFaction) && (
                    <button
                      onClick={() => {
                        setShowReinforceModal(true);
                        haptics.tap();
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>{language === "id" ? "Perkuat Garnisun Pertahanan (+HP)" : "Reinforce Garrison (+HP)"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })() : (
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[300px]">
              <Radio className="w-8 h-8 text-amber-500/40 mb-2 animate-pulse" />
              <span>{language === "id" ? "Pilih salah satu Node Beacon pada peta untuk melihat data dan aksi." : "Select a Beacon Node on the map to inspect data & actions."}</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CAPTURE BEACON WITH MYTHIC ANCHOR */}
      <AnimatePresence>
        {showCaptureModal && selectedNode && (() => {
          const selectedMythicCard = userMythicCards.find(c => c.id === selectedAnchorCardId);
          const cardLevel = selectedMythicCard?.level || 1;
          const cardEnergy = selectedMythicCard?.energy ?? 5;
          const isHQ = selectedNode.isBase;
          const isHQLevelValid = !isHQ || cardLevel >= 3;
          const isEnergyValid = isHQ ? cardEnergy === 5 : (selectedNode.tier >= 2 ? cardEnergy >= 2 : true);
          const isEligibleToCapture = isHQLevelValid && isEnergyValid;

          const speedBonusPct = Math.max(0, (cardLevel - 1) * 8);
          const speedMultiplier = 1 + Math.max(0, (cardLevel - 1)) * 0.08;
          const cooldownDurationMs = Math.max(15 * 60 * 1000, Math.round(7200000 / speedMultiplier));
          const cooldownMins = Math.round(cooldownDurationMs / 60000);
          const cooldownDurationStr = Math.floor(cooldownMins / 60) > 0 
            ? `${Math.floor(cooldownMins / 60)}j ${cooldownMins % 60}m` 
            : `${cooldownMins} menit`;

          const existingAnchoredNode = nodes.find(n => n.id !== selectedNode.id && n.anchorCard?.id === selectedAnchorCardId);
          const tierCores = getNodeTierCores(selectedNode.tier);

          return (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-amber-500/40 p-6 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col gap-4 text-xs font-mono max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black text-white uppercase">
                      {isHQ 
                        ? (language === "id" ? "Kuasai Markas Komando HQ" : "Claim Command HQ Base")
                        : (language === "id" ? "Aktifkan Mythic Beacon Anchor" : "Activate Mythic Beacon Anchor")}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setShowCaptureModal(false)}
                    className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* HQ Badge & Requirement */}
                {isHQ && (
                  <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center gap-2.5 text-amber-300">
                    <Crown className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                    <div className="flex flex-col">
                      <span className="font-black text-xs uppercase">MARKAS KOMANDO HQ ({selectedNode.baseFaction})</span>
                      <span className="text-[10px] text-slate-300 leading-tight">
                        {language === "id" 
                          ? "Syarat Khusus HQ: Kartu Mythic minimal Level 3 & Energi Full Bar (5/5 Bar)!" 
                          : "HQ Requirements: Mythic card Level 3+ & Full Bar Energy (5/5 Bars)!"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tier 2 / 3 Requirement Notice */}
                {!isHQ && selectedNode.tier >= 2 && (
                  <div className="p-2.5 bg-cyan-950/60 border border-cyan-500/30 rounded-xl flex items-center gap-2 text-cyan-300">
                    <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-[10px]">
                      {language === "id" 
                        ? `Beacon Tier ${selectedNode.tier} memerlukan kartu Mythic dengan energi minimal 2 Bar.`
                        : `Tier ${selectedNode.tier} Beacon requires a Mythic card with at least 2 Energy Bars.`}
                    </span>
                  </div>
                )}

                {captureError && (
                  <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{captureError}</span>
                  </div>
                )}

                <p className="text-slate-300 leading-relaxed">
                  {language === "id"
                    ? `Pilih 1 kartu bertingkat kelangkaan MYTHIC dari koleksimu sebagai Beacon Anchor untuk menguasai ${selectedNode.name}. Area Tier ${selectedNode.tier} ini akan menghasilkan ${tierCores} Nekomon Cores per hari jika supply line aktif.`
                    : `Select 1 MYTHIC card from your inventory as Beacon Anchor to claim ${selectedNode.nameEn || selectedNode.name}. This Tier ${selectedNode.tier} node generates ${tierCores} Cores/day when supply line is active.`}
                </p>

                {/* Mythic Cards Selection */}
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-amber-300 uppercase text-[11px] flex items-center justify-between">
                    <span>{language === "id" ? "Pilih Kartu Mythic Anchor (*Wajib):" : "Select Mythic Anchor Card (*Required):"}</span>
                    {isHQ && <span className="text-[10px] text-amber-400 font-bold">Min Lv.3 & 5/5 Energy</span>}
                  </label>

                  {userMythicCards.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1">
                      {userMythicCards.map(c => {
                        const isChosen = selectedAnchorCardId === c.id;
                        const cLvl = c.level || 1;
                        const cEnergy = c.energy ?? 5;
                        const cardLevelValid = !isHQ || cLvl >= 3;
                        const cardEnergyValid = isHQ ? cEnergy === 5 : (selectedNode.tier >= 2 ? cEnergy >= 2 : true);
                        const cardEligible = cardLevelValid && cardEnergyValid;

                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedAnchorCardId(c.id)}
                            className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center relative ${
                              isChosen
                                ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400"
                                : !cardEligible
                                ? "bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100"
                                : "bg-slate-950 border-slate-800 hover:border-amber-500/40"
                            }`}
                          >
                            <div className="w-full h-20 rounded-lg overflow-hidden mb-1.5 bg-slate-900 relative">
                              <img 
                                src={c.imageUrl} 
                                alt={c.name} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover" 
                              />
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-slate-950/80 text-[8px] font-black text-amber-300 border border-amber-500/30">
                                Lv.{cLvl}
                              </span>
                              <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-slate-950/80 text-[8px] font-black text-cyan-300 border border-cyan-500/30 flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 text-cyan-400" />
                                {cEnergy}/5
                              </span>
                            </div>
                            <span className="font-bold text-[11px] text-white truncate w-full">{c.name}</span>
                            <span className="text-[9px] text-amber-400 font-bold uppercase">{c.element}</span>
                            
                            {!cardEligible && (
                              <span className="text-[7.5px] text-rose-400 font-bold mt-0.5 leading-none">
                                {!cardLevelValid ? "Lv.<3" : "Energi Kurang"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-center flex flex-col items-center gap-1.5">
                      <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
                      <span className="font-bold">
                        {language === "id" 
                          ? "Kamu belum memiliki Kartu Tingkat MYTHIC!" 
                          : "You don't own any MYTHIC cards yet!"}
                      </span>
                      <span className="text-[11px] text-slate-300">
                        {language === "id"
                          ? "Tingkatkan/Forge kartu Legend ke Mythic di Galeri, atau dapatkan dari Booster Pack di Toko. Kamu tetap dapat memperkuat wilayah dengan tombol 'Perkuat Garnisun'!"
                          : "Forge Legend cards to Mythic in Gallery or unlock from Shop. You can still contribute by reinforcing friendly garrisons!"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Speed & Anchor Migration Feedback */}
                {selectedMythicCard && (
                  <div className="flex flex-col gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        {language === "id" ? "Kecepatan Penaklukan:" : "Capture Speed Bonus:"}
                      </span>
                      <span className="text-amber-300 font-black">
                        +{speedBonusPct}% (Jeda: {cooldownDurationStr})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      {language === "id"
                        ? `Kartu ${selectedMythicCard.name} (Lv.${cardLevel}) mempercepat stabilisasi penaklukan menjadi ${cooldownDurationStr} (Standar: 2 Jam).`
                        : `${selectedMythicCard.name} (Lv.${cardLevel}) reduces capture stabilization cooldown to ${cooldownDurationStr} (Standard: 2 Hours).`}
                    </div>

                    {/* Energy Bar visual preview */}
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-850">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        {language === "id" ? "Energi Kartu:" : "Card Energy:"}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-3 h-3 rounded-full border text-[8px] flex items-center justify-center ${
                              i < cardEnergy
                                ? "bg-cyan-500 border-cyan-400 text-slate-950 font-black"
                                : "bg-slate-900 border-slate-800 text-slate-600"
                            }`}
                          >
                            ⚡
                          </span>
                        ))}
                        <span className="ml-1 font-mono font-bold text-cyan-300">({cardEnergy}/5)</span>
                      </div>
                    </div>

                    {/* Relocation Notice */}
                    {existingAnchoredNode && (
                      <div className="mt-1 p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>
                          {language === "id"
                            ? `Perhatian: Kartu ini sedang menjadi Anchor di "${existingAnchoredNode.name}". Memasangnya di sini akan mengembalikan "${existingAnchoredNode.name}" ke status Netral!`
                            : `Warning: This card is anchoring "${existingAnchoredNode.nameEn || existingAnchoredNode.name}". Assigning it here will reset that Beacon to Neutral!`}
                        </span>
                      </div>
                    )}

                    {/* Validation Warnings */}
                    {!isEligibleToCapture && (
                      <div className="mt-1 p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>
                          {isHQ && !isHQLevelValid
                            ? (language === "id"
                                ? `Markas HQ membutuhkan kartu Mythic minimal Level 3 (Kartu saat ini: Lv.${cardLevel}). Latih kartu ini terlebih dahulu!`
                                : `HQ Base requires a Mythic card of Level 3+ (Selected card: Lv.${cardLevel}). Upgrade it first!`)
                            : (language === "id"
                                ? `Energi tidak mencukupi! ${isHQ ? "Markas HQ memerlukan energi Full Bar (5/5 bar)." : `Beacon Tier ${selectedNode.tier} memerlukan minimal 2 bar energi.`} (Energi kartu ini: ${cardEnergy}/5).`
                                : `Insufficient energy! ${isHQ ? "HQ requires 5/5 Full Bar energy." : `Tier ${selectedNode.tier} requires at least 2 energy bars.`} (Current: ${cardEnergy}/5).`)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowCaptureModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold"
                  >
                    {language === "id" ? "Batal" : "Cancel"}
                  </button>
                  <button
                    onClick={handleCaptureBeacon}
                    disabled={!selectedAnchorCardId || isSubmittingCapture || !isEligibleToCapture}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-black cursor-pointer shadow-lg"
                  >
                    {isSubmittingCapture ? (language === "id" ? "Mengaktifkan..." : "Activating...") : (language === "id" ? "Klaim Area Sekarang" : "Claim Area Now")}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* MODAL 2: TCG BATTLE ASSAULT ON GARRISON */}
      <AnimatePresence>
        {showBattleModal && selectedNode && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-red-500/40 p-6 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col gap-4 text-xs font-mono"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-red-400" />
                  <h3 className="text-sm font-black text-white uppercase">
                    {language === "id" ? "Duel TCG Perebutan Beacon" : "TCG Beacon Garrison Assault"}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setShowBattleModal(false);
                    setBattleLogs([]);
                    setBattleResult(null);
                  }}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Battle Overview */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black">
                    {language === "id" ? "TARGET BEACON" : "TARGET BEACON"}
                  </span>
                  <h4 className="text-sm font-bold text-white">{selectedNode.name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-black">
                    {language === "id" ? "RESONANSI ELEMEN" : "ELEMENT RESONANCE"}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold justify-end">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+25% Buff {selectedNode.element}</span>
                  </div>
                </div>
              </div>

              {/* Attacker Deck Selection */}
              {!battleResult && (
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-300 uppercase text-[11px]">
                    {language === "id" ? "Pilih Kartu Tempur Penyerang (Maks. 3 Kartu):" : "Select Attacking Cards (Max 3):"}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {cards.slice(0, 12).map(c => {
                      const isSelected = selectedAttackerCardIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAttackerCardIds(prev => prev.filter(id => id !== c.id));
                            } else if (selectedAttackerCardIds.length < 3) {
                              setSelectedAttackerCardIds(prev => [...prev, c.id]);
                            }
                          }}
                          className={`p-1.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center ${
                            isSelected
                              ? "bg-red-500/20 border-red-400 ring-2 ring-red-400"
                              : "bg-slate-950 border-slate-800 hover:border-red-500/40"
                          }`}
                        >
                          <div className="w-full h-16 rounded-lg overflow-hidden mb-1 bg-slate-900">
                            <img 
                              src={c.imageUrl} 
                              alt={c.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <span className="font-bold text-[10px] text-white truncate w-full">{c.name}</span>
                          <span className="text-[8px] text-slate-400">ATK {c.atk}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Combat Logs Simulation Display */}
              {battleLogs.length > 0 && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-44 overflow-y-auto flex flex-col gap-1.5">
                  {battleLogs.map((log, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
                      <span className="text-slate-300">
                        {language === "id" ? log.messageId : log.messageEn}
                      </span>
                      <span className="text-red-400 font-bold shrink-0">-{log.damageDealt} HP</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Battle Result Summary */}
              {battleResult && (
                <div className={`p-4 rounded-xl border flex flex-col items-center text-center gap-1.5 ${
                  battleResult.won
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}>
                  <h4 className="text-base font-black uppercase">
                    {battleResult.won 
                      ? (battleResult.nodeCaptured ? "BEACON BERHASIL DIREBUT!" : "SERANGAN GARNISUN BERHASIL!")
                      : "SERANGAN GAGAL / BERTAHAN!"}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {battleResult.won
                      ? `Kamu memperoleh +${battleResult.points} Poin dan +${battleResult.cores} Nekomon Cores!`
                      : "Garnisun lawan terlalu kokoh. Perkuat timmu dan coba kembali!"}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                {!battleResult ? (
                  <>
                    <button
                      onClick={() => setShowBattleModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold"
                    >
                      {language === "id" ? "Batal" : "Cancel"}
                    </button>
                    <button
                      onClick={handleStartBattle}
                      disabled={selectedAttackerCardIds.length === 0 || isBattling}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-black cursor-pointer shadow-lg flex items-center gap-2"
                    >
                      <Swords className="w-4 h-4" />
                      <span>{isBattling ? (language === "id" ? "Bertempur..." : "Battling...") : (language === "id" ? "Mulai Serangan TCG" : "Launch TCG Attack")}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowBattleModal(false);
                      setBattleLogs([]);
                      setBattleResult(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                  >
                    {language === "id" ? "Tutup" : "Close"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: REINFORCE GARRISON (NON-MYTHIC & FACTION SUPPORT) */}
      <AnimatePresence>
        {showReinforceModal && selectedNode && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-cyan-500/40 p-6 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col gap-4 text-xs font-mono"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-black text-white uppercase">
                    {language === "id" ? "Perkuat Garnisun Wilayah" : "Reinforce Territory Garrison"}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowReinforceModal(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-slate-300 leading-relaxed">
                {language === "id"
                  ? `Kirimkan kartu penjaga pendukung untuk memulihkan +30 HP Pertahanan Beacon ${selectedNode.name}. Setiap bantuan garnisun memberikan +20 Poin Trainer!`
                  : `Assign a support guardian card to restore +30 Defense HP to ${selectedNode.nameEn || selectedNode.name}. Each reinforcement grants +20 Trainer Points!`}
              </p>

              {/* Card Selection */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                {cards.slice(0, 12).map(c => {
                  const isChosen = selectedSupportCardId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedSupportCardId(c.id)}
                      className={`p-1.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center ${
                        isChosen
                          ? "bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-400"
                          : "bg-slate-950 border-slate-800 hover:border-cyan-500/40"
                      }`}
                    >
                      <div className="w-full h-16 rounded-lg overflow-hidden mb-1 bg-slate-900">
                        <img 
                          src={c.imageUrl} 
                          alt={c.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <span className="font-bold text-[10px] text-white truncate w-full">{c.name}</span>
                      <span className="text-[8px] text-cyan-300">DEF {c.def}</span>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowReinforceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold"
                >
                  {language === "id" ? "Batal" : "Cancel"}
                </button>
                <button
                  onClick={handleReinforceBeacon}
                  disabled={!selectedSupportCardId || isSubmittingReinforce}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black cursor-pointer shadow-lg"
                >
                  {isSubmittingReinforce ? (language === "id" ? "Mengirim..." : "Sending...") : (language === "id" ? "Kirim Penguatan (+30 HP)" : "Send Support (+30 HP)")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: FULL GAME GUIDE / SPECIFICATION MODAL (7 CORE RULES) */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col gap-4 text-xs font-mono max-h-[88vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white uppercase">
                    {language === "id" ? "Panduan Lengkap: Aturan Beacon War & Wilayah" : "Full Guide: Beacon War & Territory Rules"}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3 text-slate-300 font-sans leading-relaxed">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-amber-300 font-mono uppercase mb-1">
                    1. Pemilihan Faksi (Sentinel / Vanguard) 🛡️
                  </h4>
                  <p className="text-xs">
                    {language === "id"
                      ? "Pemain memilih faksi/guild Sentinel atau Vanguard sebelum berperang. Seluruh kartu Nekomon dalam koleksimu bebas bergabung dan membela faksi yang dipilih."
                      : "Players select Sentinel or Vanguard before engaging in battle. All Nekomon cards in your collection can join and fight for your chosen faction."}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-cyan-300 font-mono uppercase mb-1">
                    2. Persebaran Jaringan Beacon Luas 🗺️
                  </h4>
                  <p className="text-xs">
                    {language === "id"
                      ? "Wilayah terbagi menjadi 22 Beacon strategis yang tersebar merata di 5 zona elemen, mulai dari Markas HQ, Outpost perbatasan, hingga Sanctuary kristal."
                      : "The map features 22 balanced strategic Beacons spread across 5 elemental zones, spanning from HQ Bases to border outposts and crystal sanctuaries."}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-yellow-400 font-mono uppercase mb-1">
                    3. Syarat Penaklukan Markas HQ (Mythic Level 3+) 🏛️
                  </h4>
                  <p className="text-xs">
                    {language === "id"
                      ? "Markas Komando HQ Sentinel Prime maupun Vanguard Prime hanya dapat direbut menggunakan kartu tingkat MYTHIC dengan Level minimal 3 (Lv.3+)."
                      : "Command HQ Bases (Sentinel Prime & Vanguard Prime) can only be captured using a MYTHIC card of Level 3 or higher (Lv.3+)."}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-blue-400 font-mono uppercase mb-1">
                    4. Penaklukan Beacon & Skala Kecepatan Level ⚡
                  </h4>
                  <p className="text-xs">
                    {language === "id"
                      ? "Beacon reguler dapat direbut oleh kartu Mythic level berapa saja. Semakin tinggi level kartu Mythic yang dipasang, semakin cepat proses stabilisasi dan jeda penaklukan."
                      : "Standard Beacons can be captured by Mythic cards of any level. Higher card levels grant a speed bonus and reduce stabilization cooldowns."}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-purple-400 font-mono uppercase mb-1">
                    5. Relokasi Anchor Kartu Mythic 🔄
                  </h4>
                  <p className="text-xs">
                    {language === "id"
                      ? "Kartu Mythic yang sedang menjadi Anchor dapat digunakan untuk merebut Beacon lain. Namun, Beacon sebelumnya akan otomatis kembali ke status Netral."
                      : "A Mythic card currently serving as an Anchor can capture a new Beacon; doing so will safely reset its previous Beacon back to Neutral."}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-red-400 font-mono uppercase mb-1">
                    6. Aturan Koneksi Jalur Node (Supply Line Rule) 🔗
                  </h4>
                  <p className="text-xs">
                    {language === "id"
                      ? "Proses merebut Beacon netral atau menyerang Beacon musuh hanya bisa dilakukan jika node tersebut terhubung langsung dengan wilayah milikmu atau Markas Faksimu."
                      : "Capturing or attacking can only be initiated if the target node is directly connected to a territory you own or your Faction Base."}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-emerald-400 font-mono uppercase mb-1">
                    7. Benefit Berjenjang (Tier 1, 2, dan 3) 💎
                  </h4>
                  <p className="text-xs">
                    {language === "id"
                      ? "Setiap Tier memberikan hasil Core pasif berbeda: Tier 1 (5 Core/hari, cap 20), Tier 2 (7 Core/hari, cap 30), dan Tier 3 (10 Core/hari, cap 40)."
                      : "Each tier yields distinct passive Cores: Tier 1 (5 Cores/day, cap 20), Tier 2 (7 Cores/day, cap 30), and Tier 3 (10 Cores/day, cap 40)."}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  {language === "id" ? "Mengerti" : "Got it"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: FACTION SELECTION MODAL */}
      <AnimatePresence>
        {showFactionModal && (
          <div className="fixed inset-0 z-[3100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl max-w-xl w-full flex flex-col gap-5 text-xs font-mono"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    {language === "id" ? "Pilih Faksi / Guild Perang Beacon" : "Select Beacon War Faction / Guild"}
                  </h3>
                </div>
                {user?.faction && (
                  <button 
                    onClick={() => setShowFactionModal(false)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                {language === "id"
                  ? "Tentukan faksi tempatmu bernaung dalam pertempuran perebutan Beacon. Semua kartu Nekomon dalam koleksimu dapat bergabung dan bertarung untuk faksi ini!"
                  : "Choose your allegiance in the Beacon War. Any Nekomon card in your deck can fight on behalf of your selected faction!"}
              </p>

              {/* Faction Cards Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Sentinel */}
                <div
                  onClick={() => !isSubmittingFaction && handleChooseFaction("Sentinel")}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 group ${
                    playerFaction === "Sentinel"
                      ? "bg-gradient-to-b from-cyan-950/80 to-slate-950 border-cyan-400 ring-4 ring-cyan-500/20 shadow-xl shadow-cyan-950/50"
                      : "bg-slate-950 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black tracking-wider uppercase">
                        GUILD SENTINEL
                      </span>
                      <Crown className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h4 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                      Sentinel Order
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      {language === "id"
                        ? "Penjaga keteraturan dan pelindung energi inti pulau. Mengutamakan pertahanan solid dan sinergi resonansi kristal."
                        : "Guardians of order and the island's core matrix. Focused on resilient defense and crystal resonance."}
                    </p>
                  </div>
                  <button
                    disabled={isSubmittingFaction}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <span>{playerFaction === "Sentinel" ? "✓ Faksi Aktif" : "Gabung Sentinel"}</span>
                  </button>
                </div>

                {/* Vanguard */}
                <div
                  onClick={() => !isSubmittingFaction && handleChooseFaction("Vanguard")}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 group ${
                    playerFaction === "Vanguard"
                      ? "bg-gradient-to-b from-red-950/80 to-slate-950 border-red-500 ring-4 ring-red-500/20 shadow-xl shadow-red-950/50"
                      : "bg-slate-950 border-slate-800 hover:border-red-500/50 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black tracking-wider uppercase">
                        GUILD VANGUARD
                      </span>
                      <Swords className="w-5 h-5 text-red-400" />
                    </div>
                    <h4 className="text-base font-black text-white group-hover:text-red-300 transition-colors">
                      Vanguard Legion
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      {language === "id"
                        ? "Pasukan pelopor ekspansi dan penaklukan kilat. Mengutamakan agresi serbuan dan dominasi jalur teritori."
                        : "Pioneers of rapid expansion and frontline dominance. Focused on aggressive assaults and territory control."}
                    </p>
                  </div>
                  <button
                    disabled={isSubmittingFaction}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <span>{playerFaction === "Vanguard" ? "✓ Faksi Aktif" : "Gabung Vanguard"}</span>
                  </button>
                </div>

              </div>

              {user?.faction && (
                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setShowFactionModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    {language === "id" ? "Tutup" : "Close"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
