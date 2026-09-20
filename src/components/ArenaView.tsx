import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { BattleAtmosphere, BattleCardMotion } from "./arena/BattleAtmosphere";
import { arenaOutcome, arenaRoundFeedback, type ArenaSnapshot } from "./arena/arenaFeedback";
import { Card } from "../types";
import { ResultFeedback } from "./feedback/ResultFeedback";
import { ELEMENT_ADVANTAGE, ELEMENT_ADVANTAGE_MULTIPLIER } from "../lib/combatBalance";
import { 
  Swords, 
  Send, 
  Zap, 
  Shield, 
  MessageSquare, 
  Users, 
  Tv, 
  User as UserIcon, 
  AlertCircle, 
  Sparkles, 
  ChevronRight,
  Flame,
  Droplets,
  Sprout,
  Wind,
  Zap as LightningIcon,
  Trophy,
  Compass,
  History,
  Clock,
  RotateCcw,
  PartyPopper,
  Crown
} from "lucide-react";

export interface BattleHistoryRecord {
  id: string;
  opponentName: string;
  opponentCardName?: string;
  opponentCardImageUrl?: string;
  opponentCardLevel?: number;
  opponentCardElement?: string;
  myCardName?: string;
  myCardImageUrl?: string;
  myCardLevel?: number;
  myCardElement?: string;
  result: "WIN" | "LOSS";
  isBotMatch?: boolean;
  createdAt: string;
}
import { motion, AnimatePresence } from "motion/react";
import { audio } from "../lib/audio";
import { useLanguage } from "../context/LanguageContext";
import { haptics } from "../lib/vibration";

interface ArenaViewProps {
  cards: Card[];
  token: string;
  userId?: string;
  onBattleEndRefresh?: () => void;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

interface OnlineUser {
  id: string;
  username: string;
  points: number;
  inBattle: boolean;
}

interface BattlePlayerState {
  username: string;
  hp: number;
  maxHp: number;
  energy: number;
  card: Card;
  hasSubmitted: boolean;
}

function getSessionUserId(token: string) {
  try {
    const payload = token.split(".")[0];
    if (!payload || typeof window === "undefined") return "";
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const parsed = JSON.parse(window.atob(padded));
    return typeof parsed.sub === "string" ? parsed.sub : "";
  } catch {
    return "";
  }
}

export function ArenaView({ cards, token, userId, onBattleEndRefresh }: ArenaViewProps) {
  const { language, t } = useLanguage();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsConnectionStatus, setWsConnectionStatus] = useState<"connecting" | "authenticated" | "disconnected" | "error">("disconnected");
  const [wsReconnectAttempt, setWsReconnectAttempt] = useState(0);
  const [activeTab, setActiveTab] = useState<"lobby" | "online" | "history">("lobby");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  
  // Battle History State
  const [battleHistory, setBattleHistory] = useState<BattleHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const fetchBattleHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const savedLocal = localStorage.getItem("nekomon_battle_history");
      let localRecords: BattleHistoryRecord[] = savedLocal ? JSON.parse(savedLocal) : [];

      if (token) {
        const res = await fetch("/api/arena/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.history)) {
            const myUserId = userId || getSessionUserId(token);

            const serverRecords: BattleHistoryRecord[] = data.history.map((item: any) => {
              const isWin = item.winnerId === myUserId || (!item.loserId && item.winnerId);
              return {
                id: item.id,
                opponentName: isWin ? item.loserName : item.winnerName,
                opponentCardName: isWin ? item.loserCardName : item.winnerCardName,
                opponentCardImageUrl: isWin ? item.loserCardImageUrl : item.winnerCardImageUrl,
                opponentCardLevel: isWin ? item.loserCardLevel : item.winnerCardLevel,
                opponentCardElement: isWin ? item.loserCardElement : item.winnerCardElement,
                myCardName: isWin ? item.winnerCardName : item.loserCardName,
                myCardImageUrl: isWin ? item.winnerCardImageUrl : item.loserCardImageUrl,
                myCardLevel: isWin ? item.winnerCardLevel : item.loserCardLevel,
                myCardElement: isWin ? item.winnerCardElement : item.loserCardElement,
                result: (item.winnerId === myUserId ? "WIN" : (item.loserId === myUserId ? "LOSS" : (isWin ? "WIN" : "LOSS"))),
                isBotMatch: item.isBotMatch,
                createdAt: item.createdAt
              };
            });

            const mergedMap = new Map<string, BattleHistoryRecord>();
            serverRecords.forEach(r => mergedMap.set(r.id, r));
            localRecords.forEach(r => {
              if (!mergedMap.has(r.id)) mergedMap.set(r.id, r);
            });

            const merged = Array.from(mergedMap.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setBattleHistory(merged);
            localStorage.setItem("nekomon_battle_history", JSON.stringify(merged.slice(0, 30)));
            setIsLoadingHistory(false);
            return;
          }
        }
      }

      setBattleHistory(localRecords);
    } catch (err) {
      console.error("Failed to load battle history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchBattleHistory();
  }, [token]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchBattleHistory();
    }
  }, [activeTab]);
  
  // Matchmaking State
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [queueStatus, setQueueStatus] = useState<"idle" | "searching">("idle");
  const [searchTime, setSearchTime] = useState(0);

  // Battle Arena State
  const [battleId, setBattleId] = useState<string | null>(null);
  const [battleMode, setBattleMode] = useState<"none" | "lobby" | "active">("none");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [myRole, setMyRole] = useState<"playerA" | "playerB" | null>(null);
  const [showVsIntro, setShowVsIntro] = useState<boolean>(false);
  
  const [myBattleState, setMyBattleState] = useState<BattlePlayerState | null>(null);
  const [opponentBattleState, setOpponentBattleState] = useState<BattlePlayerState | null>(null);
  const [mysteryOpponentCard, setMysteryOpponentCard] = useState<any>(null);
  
  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  const [rewards, setRewards] = useState<{
    pointsGained: number;
    xpGained: number;
    leveledUp: boolean;
    newLevel?: number;
    card?: Card;
  } | null>(null);

  // Battle Visual Animations & Round Resolvers
  const previousSnapshot = useRef<ArenaSnapshot | null>(null);
  const [roundFeedback, setRoundFeedback] = useState<ReturnType<typeof arenaRoundFeedback>>(null);
  const [confirmedOutcome, setConfirmedOutcome] = useState<"win" | "loss" | null>(null);
  const rewardReceived = useRef(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const searchIntervalRef = useRef<any>(null);

  const triggerVictoryConfetti = () => {
    if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    confetti({
      particleCount: window.innerWidth < 640 ? 14 : 28,
      spread: 65, startVelocity: 18, ticks: 100, gravity: .65,
      origin: { y: .6 }, colors: ["#d9bd80", "#91b7ca", "#f0e5cb"],
      disableForReducedMotion: true, zIndex: 9999,
    });
  };

  // Trigger Victory Confetti / Defeat Sound & Haptics on Rewards
  useEffect(() => {
    if (rewards) {
      const isWin = confirmedOutcome === "win";
      if (isWin) {
        triggerVictoryConfetti();
        try {
          haptics.victory();
          audio.playFeedback("victory");
        } catch (_) {}
      } else if (confirmedOutcome === "loss") {
        try {
          audio.playFeedback("defeat");
        } catch (_) {}
      }
    }
  }, [rewards, confirmedOutcome]);

  // Auto-select a card if none selected
  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  // Connect WebSocket
  useEffect(() => {
    if (!token) {
      setWsConnectionStatus("disconnected");
      return;
    }

    let intentionalClose = false;
    let reconnectTimer: number | undefined;
    setWsConnectionStatus("connecting");

    // Establish socket connection to current host
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socketUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log("Arena WebSocket connected.");
      // Authenticate
      socket.send(JSON.stringify({ type: "auth", token }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "auth_ok") {
          console.log("WebSocket Auth OK!");
          setWsConnectionStatus("authenticated");
        }

        if (msg.type === "error") {
          setErrorMsg(msg.error);
          setTimeout(() => setErrorMsg(null), 4000);
          setQueueStatus("idle");
          if (/auth|credential|session|token/i.test(msg.error || "")) {
            setWsConnectionStatus("error");
          }
        }

        if (msg.type === "presence") {
          setOnlineUsers(msg.onlineUsers || []);
        }

        if (msg.type === "chat_history") {
          setChatMessages(msg.history || []);
        }

        if (msg.type === "chat_msg") {
          setChatMessages(prev => [...prev, msg.message]);
        }

        if (msg.type === "queue_status") {
          setQueueStatus(msg.status);
          if (msg.status === "searching") {
            setSearchTime(0);
          }
        }

        if (msg.type === "battle_found") {
          setBattleId(msg.battleId);
          previousSnapshot.current = null;
          rewardReceived.current = false;
          setRoundFeedback(null);
          setConfirmedOutcome(null);
          setMyRole(msg.role);
          setBattleMode("lobby");
          setQueueStatus("idle");
          setRewards(null);
          setShowVsIntro(true);
          haptics.forgingStart();
          try {
            audio.playForgingSound();
          } catch (_) {}
        }

        if (msg.type === "battle_lobby") {
          setCountdown(msg.countdownValue);
          setMysteryOpponentCard(msg.opponentCard);
          setBattleLogs(msg.logs || []);
          
          // Find my own card details
          const myCardObj = cards.find(c => c.id === selectedCardId);
          if (myCardObj) {
            setMyBattleState({
              username: language === "id" ? "Anda" : "You",
              hp: myCardObj.hp || 200,
              maxHp: myCardObj.hp || 200,
              energy: 30,
              card: myCardObj,
              hasSubmitted: false
            });
          }
        }

        if (msg.type === "battle_state") {
          const feedback = arenaRoundFeedback(previousSnapshot.current, msg);
          previousSnapshot.current = msg;
          setBattleId(msg.battleId);
          setConfirmedOutcome(arenaOutcome(msg, userId || getSessionUserId(token)));
          if (feedback) {
            setRoundFeedback(feedback);
            if (!document.hidden) {
              // No speculative attack on submit, no sound for defend, no guessed SPD order.
              const attacks = [feedback.me, feedback.opponent].filter(cue => cue.action === "attack" || cue.action === "skill");
              try {
                if (attacks.length > 0) audio.playFeedback("attack");
                else if (feedback.me.action === "defend" || feedback.opponent.action === "defend") audio.playFeedback("defend");
              } catch (_) {}
            }
          }

          setBattleMode("active");
          setCountdown(null);
          setBattleLogs(msg.logs || []);
          
          if (msg.role === "playerA") {
            setMyBattleState(msg.me);
            setOpponentBattleState(msg.opponent);
          } else {
            setMyBattleState(msg.me);
            setOpponentBattleState(msg.opponent);
          }

          if (msg.status === "ended") {
            // Trigger callbacks to update main lists
            if (onBattleEndRefresh) {
              onBattleEndRefresh();
            }
          }

          // Action feedback is derived above from confirmed round logs.
        }

        if (msg.type === "battle_rewards") {
          if (rewardReceived.current) return;
          rewardReceived.current = true;
          setRewards(msg);
          // Outcome audio is emitted once by the confirmed rewards effect.
        }

      } catch (err) {
        console.error("Error parsing ws message:", err);
      }
    };

    socket.onerror = () => {
      setWsConnectionStatus("error");
      setErrorMsg(language === "id" ? "Koneksi Arena bermasalah. Sistem akan mencoba menyambung kembali." : "Arena connection failed. Reconnecting automatically.");
      setTimeout(() => setErrorMsg(null), 4000);
    };

    socket.onclose = () => {
      console.log("Arena WebSocket disconnected.");
      setWs(prev => prev === socket ? null : prev);
      setQueueStatus("idle");
      if (!intentionalClose) {
        setWsConnectionStatus("disconnected");
        reconnectTimer = window.setTimeout(() => setWsReconnectAttempt(value => value + 1), 1500);
      }
    };

    setWs(socket);

    return () => {
      intentionalClose = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket.close();
    };
  }, [token, selectedCardId, wsReconnectAttempt, userId]);

  // Handle Search Timer
  useEffect(() => {
    if (queueStatus === "searching") {
      searchIntervalRef.current = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    } else {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
      }
      setSearchTime(0);
    }

    return () => {
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    };
  }, [queueStatus]);

  // Scroll chats and logs to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [battleLogs]);

  // Matchmaking queues
  const joinQueue = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN || wsConnectionStatus !== "authenticated") {
      setErrorMsg(language === "id" ? "Koneksi Arena belum siap. Tunggu beberapa detik lalu coba kembali." : "Arena connection is not ready. Wait a moment and try again.");
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }
    if (!selectedCardId) {
      setErrorMsg(language === "id" ? "Harap pilih Nekomon Card terlebih dahulu!" : "Please select a Nekomon Card first!");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    const myCard = cards.find(c => c.id === selectedCardId);
    if (myCard && (myCard.energy ?? 5) < 1) {
      setErrorMsg(language === "id" ? "Energi Nekomon ini telah habis (0/5)! Butuh 1 bar energi untuk bertarung di Arena. Di-refill 1 bar setiap 2 jam." : "Nekomon energy empty (0/5)! Needs 1 energy bar to fight in Arena. Refills 1 bar every 2 hours.");
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }
    haptics.tap();
    try {
      audio.playCaptureSound();
    } catch (_) {}
    ws.send(JSON.stringify({ type: "join_queue", cardId: selectedCardId }));
  };

  const leaveQueue = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    haptics.tap();
    ws.send(JSON.stringify({ type: "leave_queue" }));
  };

  // Chat sender
  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ws || ws.readyState !== WebSocket.OPEN || !chatInput.trim()) return;

    ws.send(JSON.stringify({ type: "chat", text: chatInput }));
    setChatInput("");
  };

  // Submit Battle Action
  const submitAction = (action: "attack" | "skill" | "defend") => {
    if (!ws || !battleId || !myBattleState) return;
    
    // Check energy for skill
    if (action === "skill" && myBattleState.energy < 30) {
      setErrorMsg(language === "id" ? "Energi tidak cukup!" : "Not enough energy!");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    haptics.tap();
    try { audio.playCardSelectSound(); } catch (_) {}
    ws.send(JSON.stringify({ type: "battle_action", battleId, action }));
  };

  const quitBattle = () => {
    setBattleId(null);
    setBattleMode("none");
    setMyBattleState(null);
    setOpponentBattleState(null);
    setBattleLogs([]);
    setRewards(null);
  };

  // Render Element Badge/Icon
  const renderElementIcon = (element: string, size = "w-4 h-4") => {
    switch (element?.toLowerCase()) {
      case "api":
        return <Flame className={`${size} text-red-500`} />;
      case "air":
        return <Droplets className={`${size} text-blue-500`} />;
      case "tanah":
        return <Sprout className={`${size} text-amber-600`} />;
      case "angin":
        return <Wind className={`${size} text-teal-400`} />;
      case "petir":
        return <LightningIcon className={`${size} text-yellow-400`} />;
      default:
        return <Compass className={`${size} text-slate-400`} />;
    }
  };

  const selectedPlayerCard = cards.find(c => c.id === selectedCardId);

  // ----------------- BATTLE SCREEN RENDER -----------------
  if (battleMode !== "none") {
    const isLobby = battleMode === "lobby";

    return (
      <BattleAtmosphere victory={!!rewards && confirmedOutcome === "win"}>
        {/* Error HUD */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-16 left-4 right-4 z-50 bg-red-900/95 border border-red-500 p-3 rounded-xl text-xs font-bold text-red-100 flex items-center gap-2 shadow-lg"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header */}
        <div className="bg-slate-900 border-b border-slate-800/60 p-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Swords className="w-4.5 h-4.5 text-yellow-500 animate-pulse" />
            <span className="text-xs font-black tracking-widest text-slate-100 uppercase">
              {isLobby 
                ? (language === "id" ? "PERSIAPAN ARENA" : "ARENA PREPARATION") 
                : (language === "id" ? "LIVE BATTLE STADIUM" : "LIVE BATTLE STADIUM")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowVsIntro(true);
                try {
                  audio.playForgingSound();
                } catch (_) {}
              }}
              className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono text-yellow-400 font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>VS ANIMATION</span>
            </button>
            {isLobby && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono text-yellow-400 font-bold animate-bounce">
                {language === "id" ? "BATTLE MULAI" : "BATTLE STARTS"}: {countdown}s
              </div>
            )}
            {!isLobby && myBattleState && opponentBattleState && (
              <div className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-mono text-slate-400">
                ROUND {myBattleState.hp <= 0 || opponentBattleState.hp <= 0 
                  ? (language === "id" ? "SELESAI" : "FINISHED") 
                  : (myBattleState.hasSubmitted ? "WAITING..." : (language === "id" ? "PILIH AKSI" : "CHOOSE ACTION"))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic VS Transition Overlay Screen */}
        <AnimatePresence>
          {showVsIntro && (
            <motion.div
              key="vs-intro-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md overflow-hidden"
            >
              {/* Background Flashing Elemental Aura */}
              <motion.div
                initial={{ scale: 0.8, rotate: -15 }}
                animate={{ scale: [1, 1.25, 1], rotate: -15 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[160%] h-36 bg-gradient-to-r from-red-600/30 via-yellow-500/40 to-blue-600/30 filter blur-xl pointer-events-none"
              />

              {/* Glowing Radial Light */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.18)_0%,transparent_70%)] pointer-events-none" />

              {/* Main VS Stage Container */}
              <div className="relative z-10 w-full max-w-md px-4 flex flex-col items-center gap-6">
                
                {/* Header Banner */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                  className="bg-yellow-500/10 border border-yellow-500/40 px-4 py-1.5 rounded-full text-center"
                >
                  <span className="text-xs font-black tracking-widest text-yellow-400 font-mono uppercase flex items-center gap-2">
                    <Swords className="w-4 h-4 text-yellow-500 animate-spin" />
                    {language === "id" ? "PERTIMBANGAN KEKUATAN SANG PETARUNG" : "MATCH COMMENCING - BATTLE READY"}
                  </span>
                </motion.div>

                {/* Confrontation Row */}
                <div className="w-full grid grid-cols-2 gap-4 items-center relative min-h-[170px]">
                  
                  {/* PLAYER 1 (ME) - Slide from left */}
                  <motion.div
                    initial={{ x: -260, opacity: 0, rotate: -12 }}
                    animate={{ x: 0, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.15 }}
                    className="flex flex-col items-center gap-2 bg-slate-900/90 border-2 border-blue-500/70 p-3 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.35)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
                    <div className="text-[9px] font-black uppercase tracking-wider text-blue-400 font-mono">
                      {myBattleState?.username || (language === "id" ? "KARTU ANDA" : "YOUR CARD")}
                    </div>
                    
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-blue-400/50 bg-slate-950 shadow-inner relative">
                      {myBattleState?.card?.imageUrl || selectedPlayerCard?.imageUrl ? (
                        <img 
                          src={myBattleState?.card?.imageUrl || selectedPlayerCard?.imageUrl} 
                          alt="My Card" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">CAT</div>
                      )}
                    </div>

                    <div className="text-center font-mono w-full">
                      <span className="text-xs font-black text-slate-100 block truncate max-w-[120px] mx-auto">
                        {myBattleState?.card?.name || (selectedPlayerCard?.name || "Nekomon")}
                      </span>
                      <span className="text-[9px] text-blue-400 font-bold block">
                        LV. {myBattleState?.card?.level || (selectedPlayerCard?.level || 1)} • {myBattleState?.card?.rarity || "Common"}
                      </span>
                    </div>
                  </motion.div>

                  {/* CENTER VS ANIMATED EMBLEM */}
                  <motion.div
                    initial={{ scale: 4.5, opacity: 0, rotate: -45 }}
                    animate={{ scale: [4.5, 1.2, 1], opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.35, 1] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-yellow-500/50 filter blur-md"
                      />
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-red-600 border-4 border-slate-950 flex items-center justify-center shadow-[0_0_35px_rgba(234,179,8,1)] relative z-10">
                        <span className="font-black text-xl text-slate-950 italic tracking-tighter drop-shadow-md">
                          VS
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* PLAYER 2 (OPPONENT) - Slide from right */}
                  <motion.div
                    initial={{ x: 260, opacity: 0, rotate: 12 }}
                    animate={{ x: 0, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.25 }}
                    className="flex flex-col items-center gap-2 bg-slate-900/90 border-2 border-red-500/70 p-3 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.35)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-amber-500" />
                    <div className="text-[9px] font-black uppercase tracking-wider text-red-400 font-mono">
                      {opponentBattleState?.username || (language === "id" ? "LAWAN STADIUM" : "OPPONENT")}
                    </div>

                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-red-400/50 bg-slate-950 shadow-inner relative">
                      {opponentBattleState?.card?.imageUrl || mysteryOpponentCard?.imageUrl ? (
                        <img 
                          src={opponentBattleState?.card?.imageUrl || mysteryOpponentCard?.imageUrl} 
                          alt="Opponent Card" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-3xl font-black">
                          ?
                        </div>
                      )}
                    </div>

                    <div className="text-center font-mono w-full">
                      <span className="text-xs font-black text-slate-100 block truncate max-w-[120px] mx-auto">
                        {opponentBattleState?.card?.name || mysteryOpponentCard?.name || (language === "id" ? "Lawan Rahasia" : "Mystery Opponent")}
                      </span>
                      <span className="text-[9px] text-red-400 font-bold block">
                        LV. {opponentBattleState?.card?.level || mysteryOpponentCard?.level || 1} • {opponentBattleState?.card?.rarity || mysteryOpponentCard?.rarity || "Rare"}
                      </span>
                    </div>
                  </motion.div>

                </div>

                {/* Subtitle Action & Continue Button */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="text-center font-mono flex flex-col items-center gap-2 mt-1"
                >
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
                    <span>{language === "id" ? "SIAPKAN STRATEGI ELEMEN ANDA!" : "PREPARE YOUR ELEMENTAL STRATEGY!"}</span>
                  </div>

                  <button
                    onClick={() => setShowVsIntro(false)}
                    className="mt-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(234,179,8,0.5)] cursor-pointer flex items-center gap-2"
                  >
                    <span>{language === "id" ? "MULAI PERTANDINGAN" : "START MATCH"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stadium Battle Stage */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          
          {/* Confrontation Row */}
          <div className="grid grid-cols-2 gap-4 items-stretch relative">
            
            {/* Center VS overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900 border-2 border-slate-700/80 flex items-center justify-center font-black text-xs text-yellow-500 shadow-xl font-mono shadow-slate-950">
              VS
            </div>

            {/* PLAYER A (ME) */}
            {myBattleState && (
              <BattleCardMotion hp={myBattleState.hp} targetHp={opponentBattleState?.hp} side="left" actionCue={roundFeedback?.me} language={language}
                className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl flex flex-col justify-between gap-2.5 shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                
                {/* Username */}
                <div className="text-[10px] font-mono text-slate-400 truncate flex items-center gap-1 mt-1">
                  <UserIcon className="w-3 h-3 text-blue-400" />
                  <span>{myBattleState.username} {language === "id" ? "(Anda)" : "(You)"}</span>
                </div>

                {/* Card Artwork / Silhouette */}
                <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
                  {myBattleState.card.imageUrl ? (
                    <img 
                      src={myBattleState.card.imageUrl} 
                      alt={myBattleState.card.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-[11px] font-mono text-slate-600">Cat Card</div>
                  )}
                  {/* Elemental Visual Effect Overlay for Player A */}
                  {/* Element Icon overlay */}
                  <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
                    {renderElementIcon(myBattleState.card.element, "w-4 h-4")}
                  </div>
                </div>

                {/* Card Name & Element */}
                <div className="font-mono text-center shrink-0">
                  <div className="text-xs font-bold text-slate-100 truncate">{myBattleState.card.name}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">
                    LV. {myBattleState.card.level} • {myBattleState.card.element}
                  </div>
                </div>

                {/* HP GAUGE */}
                <div className="flex flex-col gap-1 font-mono shrink-0">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-500 font-extrabold">HP</span>
                    <span className="text-slate-300 font-black">{myBattleState.hp} / {myBattleState.maxHp}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${Math.max(0, (myBattleState.hp / myBattleState.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* ENERGY GAUGE */}
                <div className="flex flex-col gap-1 font-mono shrink-0">
                  <div className="flex justify-between text-[9px] items-center">
                    <span className="text-slate-500 font-extrabold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-yellow-400 shrink-0" /> ENRG
                    </span>
                    <span className="text-yellow-400 font-black">{myBattleState.energy} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${myBattleState.energy}%` }}
                    />
                  </div>
                </div>

                {/* Submission State Ring */}
                {myBattleState.hasSubmitted && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-mono px-2 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">
                      {language === "id" ? "AKSI DIKUNCI 🔒" : "ACTION LOCKED 🔒"}
                    </span>
                  </div>
                )}
              </BattleCardMotion>
            )}

            {/* PLAYER B (OPPONENT) */}
            {isLobby && mysteryOpponentCard ? (
              /* Mystery silhouette while in pre-battle lobby countdown */
              <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl flex flex-col justify-between gap-2.5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
                
                <div className="text-[10px] font-mono text-slate-400 truncate flex items-center gap-1 mt-1">
                  <UserIcon className="w-3 h-3 text-red-400" />
                  <span>{opponentBattleState?.username || (language === "id" ? "Lawan..." : "Opponent...")}</span>
                </div>

                {/* Silhouette Art */}
                <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800/50 flex items-center justify-center relative">
                  <div className="w-20 h-20 bg-slate-900 rounded-full border border-slate-800/30 flex items-center justify-center relative animate-pulse">
                    <Swords className="w-10 h-10 text-slate-700" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
                    <span className="text-[9px] font-mono text-slate-600 font-black">?</span>
                  </div>
                </div>

                <div className="font-mono text-center shrink-0">
                  <div className="text-xs font-black text-slate-500 truncate uppercase tracking-widest animate-pulse">{language === "id" ? "KARTU RAHASIA" : "SECRET CARD"}</div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">
                    LV. ? • {language === "id" ? "ELEMEN" : "ELEMENT"} ?
                  </div>
                </div>

                {/* Silhouette HP */}
                <div className="flex flex-col gap-1 font-mono shrink-0">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-600 font-extrabold">HP</span>
                    <span className="text-slate-600 font-black">??? / ???</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full border border-slate-900" />
                </div>

                {/* Silhouette Energy */}
                <div className="flex flex-col gap-1 font-mono shrink-0">
                  <div className="flex justify-between text-[9px] items-center">
                    <span className="text-slate-600 font-extrabold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-slate-700 shrink-0" /> ENRG
                    </span>
                    <span className="text-slate-600 font-black">??? / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full border border-slate-900" />
                </div>
              </div>
            ) : opponentBattleState ? (
              /* Revealed opponent card once battle commences */
              <BattleCardMotion hp={opponentBattleState.hp} targetHp={myBattleState?.hp} side="right" actionCue={roundFeedback?.opponent} language={language}
                className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl flex flex-col justify-between gap-2.5 shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
                
                {/* Username */}
                <div className="text-[10px] font-mono text-slate-400 truncate flex items-center gap-1 mt-1">
                  <UserIcon className="w-3 h-3 text-red-400" />
                  <span>{opponentBattleState.username}</span>
                </div>

                {/* Card Artwork */}
                <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
                  {opponentBattleState.card.imageUrl ? (
                    <img 
                      src={opponentBattleState.card.imageUrl} 
                      alt={opponentBattleState.card.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover animate-fade-in"
                    />
                  ) : (
                    <div className="text-[11px] font-mono text-slate-600">Cat Card</div>
                  )}
                  {/* Elemental Visual Effect Overlay for Player B */}
                  <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
                    {renderElementIcon(opponentBattleState.card.element, "w-4 h-4")}
                  </div>
                </div>

                {/* Card Name & Element */}
                <div className="font-mono text-center shrink-0">
                  <div className="text-xs font-bold text-slate-100 truncate">{opponentBattleState.card.name}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">
                    LV. {opponentBattleState.card.level} • {opponentBattleState.card.element}
                  </div>
                </div>

                {/* HP GAUGE */}
                <div className="flex flex-col gap-1 font-mono shrink-0">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-500 font-extrabold">HP</span>
                    <span className="text-slate-300 font-black">{opponentBattleState.hp} / {opponentBattleState.maxHp}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-red-400 transition-all duration-300"
                      style={{ width: `${Math.max(0, (opponentBattleState.hp / opponentBattleState.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* ENERGY GAUGE */}
                <div className="flex flex-col gap-1 font-mono shrink-0">
                  <div className="flex justify-between text-[9px] items-center">
                    <span className="text-slate-500 font-extrabold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-yellow-400 shrink-0" /> ENRG
                    </span>
                    <span className="text-yellow-400 font-black">{opponentBattleState.energy} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${opponentBattleState.energy}%` }}
                    />
                  </div>
                </div>

                {/* Submission State Ring */}
                {opponentBattleState.hasSubmitted && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-mono px-2 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">
                      {language === "id" ? "AKSI DIKUNCI 🔒" : "ACTION LOCKED 🔒"}
                    </span>
                  </div>
                )}
              </BattleCardMotion>
            ) : null}

          </div>

          {/* Action selection panels for the player */}
          {!isLobby && myBattleState && opponentBattleState && myBattleState.hp > 0 && opponentBattleState.hp > 0 && (
            <div className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-2xl flex flex-col gap-3 shrink-0 shadow-lg">
              <span className="text-[9.5px] font-mono font-extrabold tracking-wider text-slate-400 uppercase">
                {language === "id" ? "PILIH AKSI CLASH ANDA" : "CHOOSE YOUR CLASH ACTION"}
              </span>
              
              <div className="grid grid-cols-3 gap-2">
                
                {/* ATTACK */}
                <button
                  disabled={myBattleState.hasSubmitted}
                  onClick={() => submitAction("attack")}
                  className="bg-slate-950 border border-slate-800 hover:border-blue-500/60 disabled:border-slate-800/40 py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-blue-400 disabled:opacity-50 cursor-pointer"
                >
                  <Swords className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-mono font-black tracking-wide">{language === "id" ? "SERANG" : "ATTACK"}</span>
                  <span className="text-[8px] font-mono text-slate-500">{language === "id" ? "Serangan Cepat (0 ENR)" : "Fast ATK (0 ENR)"}</span>
                </button>

                {/* SKILL */}
                <button
                  disabled={myBattleState.hasSubmitted || myBattleState.energy < 30}
                  onClick={() => submitAction("skill")}
                  className={`bg-slate-950 border ${myBattleState.energy >= 30 ? "border-slate-800 hover:border-yellow-500/60 text-yellow-400" : "border-slate-800/40 text-slate-500"} py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer`}
                >
                  <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                  <span className="text-[10px] font-mono font-black tracking-wide">SKILL</span>
                  <span className="text-[8px] font-mono text-slate-500">{language === "id" ? "Skill Pamungkas (-30 ENR)" : "Ultimate (-30 ENR)"}</span>
                </button>

                {/* DEFEND */}
                <button
                  disabled={myBattleState.hasSubmitted}
                  onClick={() => submitAction("defend")}
                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500/60 disabled:border-slate-800/40 py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-emerald-400 disabled:opacity-50 cursor-pointer"
                >
                  <Shield className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-mono font-black tracking-wide">{language === "id" ? "BERTAHAN" : "DEFEND"}</span>
                  <span className="text-[8px] font-mono text-slate-500">{language === "id" ? "Block 65% (+30 ENR)" : "Block 65% (+30 ENR)"}</span>
                </button>

              </div>
            </div>
          )}

          {/* Battle Logs HUD */}
          <div className="flex-1 min-h-[140px] bg-slate-950 border border-slate-800/70 rounded-xl p-3 flex flex-col gap-2.5 overflow-hidden">
            <div className="flex items-center gap-1 text-[9px] font-mono font-extrabold tracking-widest text-slate-500 uppercase border-b border-slate-900 pb-1.5 shrink-0">
              <Tv className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === "id" ? "MONITOR LOG STADIUM" : "STADIUM LOG MONITOR"}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto font-mono text-[9.5px] leading-relaxed flex flex-col gap-1 pr-1">
              {battleLogs.map((log, index) => {
                let colorClass = "text-slate-400";
                if (log.startsWith("[AKSI]")) colorClass = "text-blue-300";
                if (log.startsWith("[SELESAI]") || log.startsWith("[MULAI]")) colorClass = "text-yellow-400 font-extrabold";
                if (log.startsWith("🔥") || log.includes("UNGGUL ELEMEN")) colorClass = "text-yellow-400 font-bold";
                if (log.startsWith("💥")) colorClass = "text-red-400";
                if (log.startsWith("🛡️")) colorClass = "text-emerald-400";
                if (log.includes("ROUND")) colorClass = "text-indigo-300 font-bold border-b border-slate-900/60 py-1 block";

                return (
                  <div key={index} className={colorClass}>
                    {log}
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>

        {/* REWARDS OVERLAY MODAL */}
        <AnimatePresence>
          {rewards && (() => {
            const isWin = confirmedOutcome === "win";
            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-5 overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.85, y: 40 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="w-full max-w-sm bg-slate-900 border-2 border-slate-800 p-6 rounded-3xl flex flex-col gap-5 items-center text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
                >
                  {/* Glowing background aura */}
                  <div className={`absolute -top-16 -left-16 w-48 h-48 rounded-full filter blur-3xl pointer-events-none ${
                    isWin ? "bg-yellow-500/20" : "bg-red-500/10"
                  }`} />
                  <div className={`absolute -bottom-16 -right-16 w-48 h-48 rounded-full filter blur-3xl pointer-events-none ${
                    isWin ? "bg-amber-500/20" : "bg-indigo-500/10"
                  }`} />

                  {/* Icon Badge */}
                  <motion.div 
                    initial={{ rotate: -15, scale: 0.5 }}
                    animate={{ rotate: 0, scale: [0.5, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center shadow-2xl relative z-10 ${
                      isWin 
                        ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 border-yellow-300 text-slate-950 shadow-[0_0_30px_rgba(234,179,8,0.6)]" 
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    {isWin ? (
                      <Crown className="w-10 h-10 animate-bounce drop-shadow-md" />
                    ) : (
                      <Trophy className="w-9 h-9 text-slate-600" />
                    )}
                  </motion.div>

                  {/* Title & Subtitle */}
                  <div className="flex flex-col gap-1 relative z-10">
                    <motion.h3 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={`text-xl font-black tracking-wide ${
                        isWin 
                          ? "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-sm" 
                          : "text-slate-200"
                      }`}
                    >
                      {confirmedOutcome === null ? (language === "id" ? "HASIL BELUM TERKONFIRMASI" : "OUTCOME NOT CONFIRMED") : isWin
                        ? (language === "id" ? "VICTORY! KEMENANGAN ARENA 🏆" : "VICTORY! ARENA CHAMPION 🏆")
                        : (language === "id" ? "DEFEAT / TETAP SEMANGAT 🛡️" : "DEFEAT / HARD FOUGHT 🛡️")}
                    </motion.h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {confirmedOutcome === null ? (language === "id" ? "Hadiah diterima. Identitas pemenang belum tersedia." : "Rewards received. Winner identity is not available yet.") : isWin
                        ? (language === "id" ? "Strategi & elemen Nekomon Anda berhasil melumpuhkan lawan!" : "Your strategy and elemental power dominated the arena!")
                        : (language === "id" ? "Pertandingan sengit! Terus latih kartu Nekomon Anda untuk rematch." : "Fierce match! Train your Nekomon cards for the rematch.")}
                    </p>
                  </div>

                  {confirmedOutcome && <ResultFeedback kind={confirmedOutcome === "win" ? "victory" : "defeat"}>{language === "id" ? "Hasil dan hadiah dikonfirmasi server" : "Result and rewards confirmed by server"}</ResultFeedback>}
                  {/* Reward Metrics */}
                  <div className="grid grid-cols-2 gap-3 w-full font-mono text-xs relative z-10">
                    <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1 shadow-inner">
                      <span className="text-[9px] text-slate-500 uppercase font-extrabold">
                        {language === "id" 
                          ? (rewards.pointsGained < 0 ? "PENALTI POIN" : "POIN DITERIMA") 
                          : (rewards.pointsGained < 0 ? "POINTS DEDUCTED" : "POINTS EARNED")}
                      </span>
                      <span className={`font-extrabold text-base ${rewards.pointsGained < 0 ? "text-rose-400" : "text-yellow-400"}`}>
                        {rewards.pointsGained > 0 ? `+${rewards.pointsGained}` : rewards.pointsGained} {language === "id" ? "Poin" : "Pts"}
                      </span>
                    </div>
                    <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1 shadow-inner">
                      <span className="text-[9px] text-slate-500 uppercase font-extrabold">{language === "id" ? "EXP KARTU" : "CARD EXP"}</span>
                      <span className="font-extrabold text-blue-400 text-base">+{rewards.xpGained} XP</span>
                    </div>
                  </div>

                  {/* LEVEL UP CELEBRATION */}
                  {rewards.leveledUp && rewards.card && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-yellow-500/10 border-2 border-yellow-500/40 p-3.5 rounded-2xl w-full flex flex-col gap-2 relative z-10 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                    >
                      <div className="text-xs font-black text-yellow-400 tracking-wider flex items-center justify-center gap-1.5 font-mono uppercase">
                        <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 animate-spin" />
                        {language === "id" ? "🎉 LEVEL UP KARTU! 🎉" : "🎉 CARD LEVEL UP! 🎉"}
                      </div>
                      <div className="text-[11px] text-slate-200 font-mono font-bold">
                        {rewards.card.name} {language === "id" ? "naik ke" : "reached"} <span className="font-black text-yellow-400 text-xs">LV. {rewards.newLevel}</span>!
                      </div>
                      <div className="grid grid-cols-4 gap-1 mt-0.5 font-mono text-[9px] text-slate-300 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                        <div>HP: <span className="text-emerald-400 font-bold">{rewards.card.hp}</span></div>
                        <div>ATK: <span className="text-red-400 font-bold">{rewards.card.atk}</span></div>
                        <div>DEF: <span className="text-blue-400 font-bold">{rewards.card.def}</span></div>
                        <div>SPD: <span className="text-yellow-400 font-bold">{rewards.card.spd}</span></div>
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="w-full flex flex-col gap-2 relative z-10 mt-1">
                    {isWin && (
                      <button
                        onClick={triggerVictoryConfetti}
                        className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-bold font-mono py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <PartyPopper className="w-4 h-4 text-yellow-400 animate-bounce" />
                        <span>{language === "id" ? "LEMPAR CONFETTI LAGI 🎉" : "RE-FIRE CONFETTI 🎉"}</span>
                      </button>
                    )}

                    <button
                      onClick={quitBattle}
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs transition-all tracking-wider cursor-pointer shadow-lg active:scale-95"
                    >
                      {language === "id" ? "KEMBALI KE LOBBY ⚔️" : "RETURN TO LOBBY ⚔️"}
                    </button>
                  </div>

                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </BattleAtmosphere>
    );
  }

  // ----------------- LOBBY / STADIUM SCREEN RENDER -----------------
  return (
    <div className="flex-1 flex flex-col bg-slate-950 font-sans text-slate-200">
      
      {/* Internal Tabs */}
      <div className="flex bg-slate-900 border-b border-slate-800/60 p-1 shrink-0">
        <button
          onClick={() => setActiveTab("lobby")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-mono tracking-wider font-extrabold transition-all cursor-pointer ${
            activeTab === "lobby" ? "bg-slate-950 text-yellow-500 shadow-sm border border-slate-800/40" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>{language === "id" ? "ARENA & CHAT" : "ARENA & CHAT"}</span>
        </button>
        <button
          onClick={() => setActiveTab("online")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-mono tracking-wider font-extrabold transition-all cursor-pointer ${
            activeTab === "online" ? "bg-slate-950 text-yellow-500 shadow-sm border border-slate-800/40" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{language === "id" ? `PEMAIN ONLINE` : `ONLINE PLAYERS`} ({onlineUsers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-mono tracking-wider font-extrabold transition-all cursor-pointer ${
            activeTab === "history" ? "bg-slate-950 text-yellow-500 shadow-sm border border-slate-800/40" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>{language === "id" ? "RIWAYAT" : "HISTORY"} ({battleHistory.length})</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        {activeTab === "lobby" && (
          <>
            {/* Nekomon Selection Panel */}
            <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl flex flex-col gap-3.5 shadow-lg shrink-0">
              <span className="text-[10px] font-mono font-black tracking-wider text-slate-400 uppercase">
                {language === "id" ? "PILIH CHAMPION ANDA ⚔️" : "CHOOSE YOUR CHAMPION ⚔️"}
              </span>

              {cards.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800/50 p-4 rounded-xl text-center flex flex-col gap-2">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === "id" 
                      ? 'Anda belum memiliki Nekomon Card! Tangkap kucing di tab Kamera lalu "Forge" di Album Koleksi Anda terlebih dahulu.' 
                      : 'You do not have any Nekomon Cards yet! Capture cats in the Camera tab and "Forge" them in your Collection Album first.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <select
                    disabled={queueStatus === "searching"}
                    value={selectedCardId}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/80 px-3 py-2.5 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-yellow-500/50"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (LV. {c.level || 1} • {c.element} • ⚡{c.energy ?? 5}/{c.maxEnergy || 5})
                      </option>
                    ))}
                  </select>

                  {/* Chosen Card Preview Hud */}
                  {selectedPlayerCard && (
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 relative">
                          {selectedPlayerCard.imageUrl ? (
                            <img 
                              src={selectedPlayerCard.imageUrl} 
                              alt={selectedPlayerCard.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-[8px] text-slate-600 flex items-center justify-center h-full">Art</div>
                          )}
                        </div>
                        <div className="flex-1 font-mono text-xs overflow-hidden">
                          <div className="font-extrabold text-slate-200 truncate">{selectedPlayerCard.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {renderElementIcon(selectedPlayerCard.element, "w-3 h-3")}
                            <span>{selectedPlayerCard.element} • LV. {selectedPlayerCard.level || 1}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-y-0.5 gap-x-2 text-[9px] font-mono text-slate-500 text-right pr-1 shrink-0">
                          <div>HP: <span className="text-slate-300 font-bold">{selectedPlayerCard.hp}</span></div>
                          <div>ATK: <span className="text-slate-300 font-bold">{selectedPlayerCard.atk}</span></div>
                          <div>DEF: <span className="text-slate-300 font-bold">{selectedPlayerCard.def}</span></div>
                          <div>SPD: <span className="text-slate-300 font-bold">{selectedPlayerCard.spd}</span></div>
                        </div>
                      </div>

                      {/* Energy Bar Indicator */}
                      <div className="flex items-center justify-between bg-slate-900/90 border border-amber-500/20 px-2.5 py-1.5 rounded-lg text-[9px] font-mono">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                          <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>ENERGI KARTU: {selectedPlayerCard.energy ?? 5}/{selectedPlayerCard.maxEnergy || 5}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(selectedPlayerCard.maxEnergy || 5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2.5 h-2 rounded-xs border transition-all ${
                                i < (selectedPlayerCard.energy ?? 5)
                                  ? "bg-amber-400 border-yellow-300 shadow-[0_0_4px_rgba(251,191,36,0.8)]"
                                  : "bg-slate-950 border-slate-800 opacity-30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Energy Depleted Notice */}
                  {selectedPlayerCard && (selectedPlayerCard.energy ?? 5) < 1 && (
                    <div className="bg-amber-950/30 border border-amber-500/40 p-2.5 rounded-xl font-mono text-[10px] text-amber-300 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                      <span>
                        {language === "id"
                          ? "Energi Nekomon ini habis (0/5)! Butuh 1 bar energi untuk masuk Arena. Refill 1 bar otomatis setiap 2 jam sekali."
                          : "Nekomon energy empty (0/5)! Needs 1 energy bar for Arena. Refills 1 bar automatically every 2 hours."}
                      </span>
                    </div>
                  )}

                  {/* Matchmaking Queue Button */}
                  {queueStatus === "searching" ? (
                    <div className="flex flex-col gap-2">
                      <div className="bg-slate-950 border border-yellow-500/20 p-3.5 rounded-xl flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-ping" />
                          <span className="text-xs font-mono font-bold text-yellow-400 animate-pulse">
                            {language === "id" ? "MENCARI RIVAL ONLINE..." : "MATCHMAKING IN PROGRESS..."} ({searchTime}s)
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">{language === "id" ? "Prioritas PVP" : "PVP Priority"}</span>
                      </div>
                      <button
                        onClick={leaveQueue}
                        className="w-full bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:text-red-400 text-slate-400 font-bold py-2.5 rounded-xl text-xs transition-all tracking-wider cursor-pointer"
                      >
                        {language === "id" ? "BATALKAN PENCARIAN" : "CANCEL SEARCH"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={joinQueue}
                      disabled={wsConnectionStatus !== "authenticated" || !!(selectedPlayerCard && (selectedPlayerCard.energy ?? 5) < 1)}
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-500 font-black py-3.5 rounded-xl text-xs transition-all tracking-widest flex items-center justify-center gap-2 shadow-md shadow-yellow-500/5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Swords className="w-4 h-4" />
                      {wsConnectionStatus !== "authenticated"
                        ? (language === "id" ? "MENGHUBUNGKAN ARENA..." : "CONNECTING TO ARENA...")
                        : selectedPlayerCard && (selectedPlayerCard.energy ?? 5) < 1
                        ? (language === "id" ? "ENERGI NEKOMON HABIS (0/5)" : "ENERGY DEPLETED (0/5)")
                        : (language === "id" ? "MULAI PVP ARENA ⚔️ (-1 ENERGI)" : "START PVP ARENA ⚔️ (-1 ENERGY)")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Arena Rules & Rewards Information Sheet */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl shrink-0 font-mono flex flex-col gap-2">
              <span className="text-[9px] font-extrabold text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                {language === "id" ? "INFORMASI HADIAH & ATURAN ARENA" : "ARENA RULES & REWARD INFO"}
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-2 rounded-xl flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">{language === "id" ? "🏆 KEMENANGAN" : "🏆 VICTORY"}</span>
                  <span className="text-emerald-300 font-extrabold">+25 Poin • +120 XP</span>
                </div>
                <div className="bg-rose-950/30 border border-rose-500/30 p-2 rounded-xl flex items-center justify-between">
                  <span className="text-rose-400 font-bold">{language === "id" ? "💔 KEKALAHAN" : "💔 DEFEAT"}</span>
                  <span className="text-rose-300 font-extrabold">-10 Poin • +50 XP</span>
                </div>
              </div>
            </div>

            {/* Elements RPS Mechanics Help Sheet */}
            <div className="bg-slate-900/40 border border-slate-800/50 p-3 rounded-2xl shrink-0 font-mono">
              <span className="text-[9px] font-extrabold text-slate-400 tracking-widest uppercase block mb-1.5">
                {language === "id" ? "KEUNGGULAN SIKLUS 5 ELEMEN" : "5-ELEMENT CYCLE ADVANTAGES"} (+{Math.round((ELEMENT_ADVANTAGE_MULTIPLIER - 1) * 100)}% PWR)
              </span>
              <div className="grid grid-cols-5 gap-1 text-[8.5px] text-center text-slate-400">
                <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                  <span className="text-blue-400 font-bold">💧 {language === "id" ? "Air" : "Water"}</span> {language === "id" ? "kalahkan" : "beats"} {ELEMENT_ADVANTAGE.Air}
                </div>
                <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                  <span className="text-red-400 font-bold">🔥 {language === "id" ? "Api" : "Fire"}</span> {language === "id" ? "kalahkan" : "beats"} {ELEMENT_ADVANTAGE.Api}
                </div>
                <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                  <span className="text-teal-400 font-bold">🌪️ {language === "id" ? "Angin" : "Wind"}</span> {language === "id" ? "kalahkan" : "beats"} {ELEMENT_ADVANTAGE.Angin}
                </div>
                <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                  <span className="text-amber-600 font-bold">🪵 {language === "id" ? "Tanah" : "Earth"}</span> {language === "id" ? "kalahkan" : "beats"} {ELEMENT_ADVANTAGE.Tanah}
                </div>
                <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                  <span className="text-yellow-400 font-bold">⚡ {language === "id" ? "Petir" : "Lightning"}</span> {language === "id" ? "kalahkan" : "beats"} {ELEMENT_ADVANTAGE.Petir}
                </div>
              </div>
            </div>

            {/* Live Global Chat */}
            <div className="flex-1 min-h-[180px] bg-slate-900 border border-slate-800/60 rounded-2xl p-3.5 flex flex-col gap-3 overflow-hidden shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800/50 pb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-mono font-black tracking-wider text-slate-300 uppercase">
                    {language === "id" ? "OBROLAN GLOBAL ARENA" : "GLOBAL ARENA CHAT"}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 font-mono text-[10px] leading-relaxed">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-slate-600 mt-6 text-[9.5px]">
                    {language === "id" ? "Belum ada obrolan. Jadilah yang pertama mengirim pesan! 💬" : "No chats yet. Be the first to send a message! 💬"}
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    return (
                      <div key={msg.id} className="flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-blue-400 truncate max-w-[120px]">{msg.username}</span>
                          <span className="text-[7.5px] text-slate-600">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-slate-300 bg-slate-950/40 border border-slate-900/60 px-2 py-1 rounded-lg inline-block w-fit max-w-full break-words">
                          {msg.text}
                        </p>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={sendChat} className="flex gap-2 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={language === "id" ? "Ketik pesan obrolan..." : "Type chat message..."}
                  className="flex-1 bg-slate-950 border border-slate-800/80 px-3 py-2 rounded-xl font-mono text-[10.5px] text-slate-200 focus:outline-none focus:border-yellow-500/40"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </>
        )}

        {activeTab === "history" && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Summary Stats Header Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 shadow-lg shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black tracking-wider text-slate-400 uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  {language === "id" ? "STATISTIK BATTLE ARENA" : "ARENA BATTLE STATS"}
                </span>
                <button
                  onClick={fetchBattleHistory}
                  disabled={isLoadingHistory}
                  className="text-[10px] font-mono text-slate-400 hover:text-yellow-400 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  <RotateCcw className={`w-3 h-3 ${isLoadingHistory ? "animate-spin text-yellow-400" : ""}`} />
                  <span>{language === "id" ? "REFRESH" : "REFRESH"}</span>
                </button>
              </div>

              {(() => {
                const total = battleHistory.length;
                const wins = battleHistory.filter(b => b.result === "WIN").length;
                const losses = total - wins;
                const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

                return (
                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-500 block">TOTAL</span>
                      <span className="text-sm font-bold text-slate-200">{total}</span>
                    </div>
                    <div className="bg-emerald-950/30 border border-emerald-500/20 p-2.5 rounded-xl">
                      <span className="text-[9px] text-emerald-400/70 block">{language === "id" ? "MENANG" : "WINS"}</span>
                      <span className="text-sm font-bold text-emerald-400">{wins}</span>
                    </div>
                    <div className="bg-red-950/30 border border-red-500/20 p-2.5 rounded-xl">
                      <span className="text-[9px] text-red-400/70 block">{language === "id" ? "KALAH" : "LOSSES"}</span>
                      <span className="text-sm font-bold text-red-400">{losses}</span>
                    </div>
                    <div className="bg-amber-950/30 border border-amber-500/20 p-2.5 rounded-xl">
                      <span className="text-[9px] text-amber-400/70 block">WIN RATE</span>
                      <span className="text-sm font-bold text-amber-400">{winRate}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Battle History Log Cards */}
            <div className="flex-1 bg-slate-900 border border-slate-800/60 rounded-2xl p-4 flex flex-col gap-3 shadow-lg overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-[10px] font-mono font-black tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-yellow-500" />
                  {language === "id" ? "DAFTAR RIWAYAT COMBAT RECENT" : "RECENT COMBAT HISTORY LOGS"}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {battleHistory.length} {language === "id" ? "Pertandingan" : "Matches"}
                </span>
              </div>

              {isLoadingHistory ? (
                <div className="py-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-2">
                  <RotateCcw className="w-5 h-5 animate-spin text-yellow-500" />
                  <span>{language === "id" ? "Memuat riwayat bertarung..." : "Loading battle history..."}</span>
                </div>
              ) : battleHistory.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
                    <Swords className="w-6 h-6" />
                  </div>
                  <div className="font-mono text-xs text-slate-400 font-bold">
                    {language === "id" ? "Belum Ada Riwayat Pertarungan" : "No Battle History Recorded Yet"}
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-xs text-center leading-relaxed font-mono">
                    {language === "id"
                      ? "Tantang pelatih lain atau AI Bot di PVP Arena untuk menguji kekuatan kartu Nekomon milikmu!"
                      : "Challenge other trainers or AI Bots in the PVP Arena to test your Nekomon card strength!"}
                  </p>
                  <button
                    onClick={() => setActiveTab("lobby")}
                    className="mt-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black font-mono text-xs px-5 py-2.5 rounded-xl tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {language === "id" ? "MASUK KE LOBBY ARENA ⚔️" : "ENTER ARENA LOBBY ⚔️"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {battleHistory.map((item) => {
                    const isWin = item.result === "WIN";
                    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString(language === "id" ? "id-ID" : "en-US", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    }) : "";

                    return (
                      <div
                        key={item.id}
                        className={`bg-slate-950/80 border ${
                          isWin ? "border-emerald-500/30 hover:border-emerald-500/60" : "border-red-500/20 hover:border-red-500/40"
                        } p-3.5 rounded-2xl flex flex-col gap-3 transition-all`}
                      >
                        {/* Header Row: Result Badge & Timestamp */}
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                          <div className="flex items-center gap-2 font-mono">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                isWin
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : "bg-red-500/15 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {isWin ? (
                                <>
                                  <Trophy className="w-3 h-3 text-emerald-400" />
                                  {language === "id" ? "VICTORY / MENANG" : "VICTORY"}
                                </>
                              ) : (
                                <>
                                  <span>💀</span>
                                  {language === "id" ? "DEFEAT / KALAH" : "DEFEAT"}
                                </>
                              )}
                            </span>

                            {item.isBotMatch && (
                              <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[8px] font-mono font-bold px-2 py-0.5 rounded-full">
                                AI BOT
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                            <Clock className="w-3 h-3 text-slate-600" />
                            <span>{dateStr}</span>
                          </div>
                        </div>

                        {/* Matchup Combatants Row */}
                        <div className="grid grid-cols-11 items-center gap-2 font-mono">
                          
                          {/* Left: My Card */}
                          <div className="col-span-5 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative">
                              {item.myCardImageUrl ? (
                                <img
                                  src={item.myCardImageUrl}
                                  alt={item.myCardName || "My Card"}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-[7px] text-slate-600 flex items-center justify-center h-full">Art</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-bold text-slate-200 truncate uppercase">
                                {item.myCardName || "Nekomon"}
                              </div>
                              <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                                {renderElementIcon(item.myCardElement || "Api", "w-2.5 h-2.5")}
                                <span>LV. {item.myCardLevel || 1}</span>
                              </div>
                            </div>
                          </div>

                          {/* VS Emblem */}
                          <div className="col-span-1 text-center flex items-center justify-center">
                            <span className="text-[10px] font-black font-mono text-yellow-500/80 bg-slate-950 border border-yellow-500/20 w-6 h-6 rounded-full flex items-center justify-center shadow-inner">
                              VS
                            </span>
                          </div>

                          {/* Right: Opponent's Card */}
                          <div className="col-span-5 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center justify-end text-right gap-2.5 min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-bold text-slate-200 truncate uppercase">
                                {item.opponentCardName || "Nekomon Opponent"}
                              </div>
                              <div className="text-[9px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                                <span>LV. {item.opponentCardLevel || 1}</span>
                                {renderElementIcon(item.opponentCardElement || "Air", "w-2.5 h-2.5")}
                              </div>
                              <div className="text-[8px] text-slate-500 truncate font-semibold mt-0.5">
                                vs {item.opponentName || "Pelatih"}
                              </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative">
                              {item.opponentCardImageUrl ? (
                                <img
                                  src={item.opponentCardImageUrl}
                                  alt={item.opponentCardName || "Opponent Card"}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-[7px] text-slate-600 flex items-center justify-center h-full">Art</div>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Footer Rewards Row */}
                        <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-slate-800/40 text-slate-400">
                          <span>
                            {language === "id" ? "Lawan:" : "Opponent:"} <strong className="text-slate-300">{item.opponentName}</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400 font-bold">
                              {isWin ? "+25 Poin" : "+10 Poin"}
                            </span>
                            <span className="text-blue-400 font-bold">
                              {isWin ? "+120 XP" : "+50 XP"}
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
