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
  Sparkle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { BeaconNode, Card, User, TerritoryBattleLog } from "../types";
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
  const [playerFaction, setPlayerFaction] = useState<"Sentinel" | "Vanguard">("Sentinel");
  const [playerUnclaimedCores, setPlayerUnclaimedCores] = useState<number>(0);
  const [playerNodesCount, setPlayerNodesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClaimingCores, setIsClaimingCores] = useState<boolean>(false);

  // Modals & Action States
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

  // Check if node is connected to player's territory or faction base
  const isNodeConnectedToPlayer = (target: BeaconNode) => {
    if (!target) return false;
    const connectedNeighbors = nodes.filter(n => (target.connectedNodeIds || []).includes(n.id));
    return connectedNeighbors.some(n => {
      if (n.ownerId === user.id) return true;
      if (n.isBase && n.baseFaction === playerFaction) return true;
      if (n.ownerFaction === playerFaction && n.isActive) return true;
      return false;
    });
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
        showToast(
          language === "id"
            ? `Beacon ${selectedNode.name} berhasil dikuasai! Menghasilkan 5 Cores/hari.`
            : `Beacon ${selectedNode.nameEn || selectedNode.name} captured! Yields 5 Cores/day.`,
          "success"
        );
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
                ? "Tautkan kartu Mythic sebagai Anchor untuk kuasai Beacon (5 Cores/hari per area aktif)."
                : "Anchor Mythic cards to capture Beacons (5 Cores/day per active connected area)."}
            </p>
          </div>
        </div>

        {/* Cores Claiming Panel & Player Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Faction Badge */}
          <div className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${
            playerFaction === "Sentinel"
              ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
              : "bg-red-950/60 border-red-500/40 text-red-300"
          }`}>
            <Shield className="w-4 h-4" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                {language === "id" ? "FAKSI UTAMA" : "CORE FACTION"}
              </span>
              <span className="text-xs font-black">{playerFaction}</span>
            </div>
          </div>

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
            <div className="flex items-center gap-3">
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
            </div>
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>5 Cores / Hari per Area</span>
            </div>
          </div>
        </div>

        {/* Right Side: Selected Beacon Inspector & Action Hub */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {selectedNode ? (
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col gap-4">
              
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${getElementBadge(selectedNode.element).bg} ${getElementBadge(selectedNode.element).color} ${getElementBadge(selectedNode.element).border}`}>
                      {selectedNode.element.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      TIER {selectedNode.tier} (5 Cores/Hari)
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    {language === "id" ? selectedNode.name : (selectedNode.nameEn || selectedNode.name)}
                  </h3>
                </div>

                {selectedNode.isBase && (
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black rounded-lg uppercase shrink-0">
                    MARKAS HQ
                  </span>
                )}
              </div>

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
                        {language === "id" ? "Aktif (+5 Cores/h)" : "Active (+5 Cores/d)"}
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
                {(!selectedNode.ownerId || selectedNode.defenseHp <= 0) && !selectedNode.isBase && (
                  <button
                    onClick={() => {
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
                    <span>{language === "id" ? "Pasang Mythic Anchor & Klaim Area" : "Deploy Mythic Anchor & Capture"}</span>
                  </button>
                )}

                {/* 2. If Owned by Enemy -> Attack / Battle Garrison */}
                {selectedNode.ownerId && selectedNode.ownerId !== user.id && !selectedNode.isBase && (
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
                )}

                {/* 3. If Owned by Player or Friendly Faction -> Reinforce Support */}
                {(selectedNode.ownerId === user.id || (selectedNode.ownerFaction === playerFaction && !selectedNode.isBase)) && (
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
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[300px]">
              <Radio className="w-8 h-8 text-amber-500/40 mb-2 animate-pulse" />
              <span>{language === "id" ? "Pilih salah satu Node Beacon pada peta untuk melihat data dan aksi." : "Select a Beacon Node on the map to inspect data & actions."}</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CAPTURE BEACON WITH MYTHIC ANCHOR */}
      <AnimatePresence>
        {showCaptureModal && selectedNode && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-amber-500/40 p-6 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col gap-4 text-xs font-mono"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white uppercase">
                    {language === "id" ? "Aktifkan Mythic Beacon Anchor" : "Activate Mythic Beacon Anchor"}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowCaptureModal(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {captureError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{captureError}</span>
                </div>
              )}

              <p className="text-slate-300 leading-relaxed">
                {language === "id"
                  ? `Pilih 1 kartu bertingkat kelangkaan MYTHIC dari koleksimu sebagai Beacon Anchor untuk menguasai ${selectedNode.name}. Area ini akan menghasilkan 5 Nekomon Cores per hari jika supply line aktif.`
                  : `Select 1 MYTHIC card from your inventory as Beacon Anchor to claim ${selectedNode.nameEn || selectedNode.name}. Generates 5 Cores/day when supply line is active.`}
              </p>

              {/* Mythic Cards Selection */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-amber-300 uppercase text-[11px]">
                  {language === "id" ? "Pilih Kartu Mythic Anchor (*Wajib):" : "Select Mythic Anchor Card (*Required):"}
                </label>

                {userMythicCards.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {userMythicCards.map(c => {
                      const isChosen = selectedAnchorCardId === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedAnchorCardId(c.id)}
                          className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center ${
                            isChosen
                              ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400"
                              : "bg-slate-950 border-slate-800 hover:border-amber-500/40"
                          }`}
                        >
                          <div className="w-full h-20 rounded-lg overflow-hidden mb-1.5 bg-slate-900">
                            <img 
                              src={c.imageUrl} 
                              alt={c.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <span className="font-bold text-[11px] text-white truncate w-full">{c.name}</span>
                          <span className="text-[9px] text-amber-400 font-bold uppercase">{c.element} • Lv.{c.level || 20}</span>
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
                  disabled={!selectedAnchorCardId || isSubmittingCapture}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-black cursor-pointer shadow-lg"
                >
                  {isSubmittingCapture ? (language === "id" ? "Mengaktifkan..." : "Activating...") : (language === "id" ? "Klaim Area Sekarang" : "Claim Area Now")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
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

      {/* MODAL 4: FULL GAME GUIDE / SPECIFICATION MODAL */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col gap-4 text-xs font-mono max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white uppercase">
                    {language === "id" ? "Panduan Lengkap: Mode Capture Area & Beacon" : "Full Guide: Territory Control & Beacon War"}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4 text-slate-300 font-sans leading-relaxed">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-amber-300 font-mono uppercase mb-1">
                    1. Jaringan Beacon & Hadiah Core (5 Cores/Hari) 💎
                  </h4>
                  <p className="text-xs">
                    {language === "id"
                      ? "Setiap area Beacon yang berhasil kamu kuasai akan menghasilkan 5 Nekomon Core points per hari secara pasif. Akumulasi core dapat diklaim kapan saja melalui tombol 'Klaim Core Wilayah'."
                      : "Each captured Beacon generates 5 Nekomon Core points per day passively. Accumulated cores can be claimed anytime via the 'Claim Territory Cores' button."}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-cyan-300 font-mono uppercase mb-1">
                    2. Syarat Kartu Mythic Anchor & Aturan Koneksi 👑
                  </h4>
                  <p className="text-xs">
                    {language === "id"
                      ? "Hanya kartu berlevel kelangkaan MYTHIC yang dapat dipasang sebagai Beacon Anchor untuk menguasai area baru. Untuk merebut suatu Beacon, area tersebut WAJIB terhubung langsung (garis koneksi) dengan Beacon milikmu atau Markas Faksimu (Sentinel / Vanguard)."
                      : "Only MYTHIC rarity cards can be deployed as Beacon Anchors to seal territory ownership. To capture a new Beacon, it MUST be directly connected to an existing area you own or your Faction Base (Sentinel / Vanguard)."}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-red-400 font-mono uppercase mb-1">
                    3. Mekanisme Jalur Terputus (Supply Line Cut-off) ⚠️
                  </h4>
                  <p className="text-xs">
                    {language === "id"
                      ? "Jika lawan merebut Beacon perantara dan memutuskan jalur koneksimu menuju Markas Pusat/Anchor utama, maka seluruh Beacon di hilir akan berstatus TERPUTUS (Inactive) dan BERHENTI menghasilkan Cores sampai jalur terhubung kembali."
                      : "If an opponent captures an intermediate Beacon severing your supply line back to your Base/Root Anchor, all downstream nodes become SEVERED (Inactive) and CEASE generating Cores until reconnected."}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-emerald-400 font-mono uppercase mb-1">
                    4. Resonansi 5 Elemen Dasar (Air, Api, Tanah, Angin, Petir) ⚡
                  </h4>
                  <p className="text-xs">
                    {language === "id"
                      ? "Setiap Beacon memiliki afinitas elemen khusus. Kartu yang bertanding dengan elemen yang cocok mendapatkan bonus +25% ATK/DEF (Resonansi Medan)."
                      : "Every Beacon holds a distinct elemental affinity. Cards matching the Beacon's element receive a +25% ATK/DEF Field Resonance bonus."}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
                >
                  {language === "id" ? "Mengerti" : "Got it"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
