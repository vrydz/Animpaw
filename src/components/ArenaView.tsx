import React, { useState, useEffect, useRef } from "react";
import { Card } from "../types";
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
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { audio } from "../lib/audio";
import { useLanguage } from "../context/LanguageContext";

interface ArenaViewProps {
  cards: Card[];
  token: string;
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

export function ArenaView({ cards, token, onBattleEndRefresh }: ArenaViewProps) {
  const { language, t } = useLanguage();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [activeTab, setActiveTab] = useState<"lobby" | "online">("lobby");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  
  // Matchmaking State
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [queueStatus, setQueueStatus] = useState<"idle" | "searching">("idle");
  const [searchTime, setSearchTime] = useState(0);

  // Battle Arena State
  const [battleId, setBattleId] = useState<string | null>(null);
  const [battleMode, setBattleMode] = useState<"none" | "lobby" | "active">("none");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [myRole, setMyRole] = useState<"playerA" | "playerB" | null>(null);
  
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
  const [meAnimation, setMeAnimation] = useState<"slash" | "impact" | null>(null);
  const [opponentAnimation, setOpponentAnimation] = useState<"slash" | "impact" | null>(null);

  const lastRoundRef = useRef<number>(0);
  const lastStatusRef = useRef<string>("none");

  const triggerMeAnimation = (type: "slash" | "impact") => {
    setMeAnimation(type);
    setTimeout(() => setMeAnimation(null), 350);
  };

  const triggerOpponentAnimation = (type: "slash" | "impact") => {
    setOpponentAnimation(type);
    setTimeout(() => setOpponentAnimation(null), 350);
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const searchIntervalRef = useRef<any>(null);

  // Auto-select a card if none selected
  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  // Connect WebSocket
  useEffect(() => {
    if (!token) return;

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
        }

        if (msg.type === "error") {
          setErrorMsg(msg.error);
          setTimeout(() => setErrorMsg(null), 4000);
          setQueueStatus("idle");
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
          setMyRole(msg.role);
          setBattleMode("lobby");
          setQueueStatus("idle");
          setRewards(null);
          try {
            audio.playCaptureSound();
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
          const prevRound = lastRoundRef.current;
          const prevStatus = lastStatusRef.current;
          
          lastRoundRef.current = msg.round;
          lastStatusRef.current = msg.status;

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

          // Trigger fight animations and element sound effects when a round resolves
          if (
            (msg.round > prevRound && prevRound > 0) || 
            (msg.status === "ended" && prevStatus === "active")
          ) {
            const myElement = msg.me?.card?.element || "Api";
            const oppElement = msg.opponent?.card?.element || "Air";
            
            const mySpd = msg.me?.card?.spd || 50;
            const oppSpd = msg.opponent?.card?.spd || 50;

            if (mySpd >= oppSpd) {
              // Me attacks first: play our element sound, trigger slash/impact overlay on opponent card
              try {
                audio.playElementSound(myElement);
              } catch (_) {}
              triggerOpponentAnimation(Math.random() < 0.5 ? "slash" : "impact");
              
              // Opponent attacks second (staggered by 400ms): plays opponent's sound, triggers slash/impact overlay on our card
              setTimeout(() => {
                try {
                  audio.playElementSound(oppElement);
                } catch (_) {}
                triggerMeAnimation(Math.random() < 0.5 ? "slash" : "impact");
              }, 400);
            } else {
              // Opponent attacks first: play opponent's element sound, trigger slash/impact overlay on our card
              try {
                audio.playElementSound(oppElement);
              } catch (_) {}
              triggerMeAnimation(Math.random() < 0.5 ? "slash" : "impact");
              
              // Me attacks second (staggered by 400ms): plays our sound, triggers slash/impact overlay on opponent card
              setTimeout(() => {
                try {
                  audio.playElementSound(myElement);
                } catch (_) {}
                triggerOpponentAnimation(Math.random() < 0.5 ? "slash" : "impact");
              }, 400);
            }
          }
        }

        if (msg.type === "battle_rewards") {
          setRewards(msg);
          if (msg.leveledUp) {
            try {
              audio.playRevealSound("Sentinel");
            } catch (_) {}
          } else {
            try {
              audio.playCaptureSound();
            } catch (_) {}
          }
        }

      } catch (err) {
        console.error("Error parsing ws message:", err);
      }
    };

    socket.onclose = () => {
      console.log("Arena WebSocket disconnected.");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [token, selectedCardId]);

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
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!selectedCardId) {
      setErrorMsg(language === "id" ? "Harap pilih Nekomon Card terlebih dahulu!" : "Please select a Nekomon Card first!");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    try {
      audio.playCaptureSound();
    } catch (_) {}
    ws.send(JSON.stringify({ type: "join_queue", cardId: selectedCardId }));
  };

  const leaveQueue = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
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

    try {
      audio.playCaptureSound();
    } catch (_) {}
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
      <div className="flex-1 flex flex-col bg-slate-950 font-sans text-slate-200">
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
              <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl flex flex-col justify-between gap-2.5 shadow-lg relative overflow-hidden">
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
                  {/* Slash / Impact overlays for Player A */}
                  <AnimatePresence>
                    {meAnimation === "slash" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                        animate={{ opacity: 1, scale: 1.2, rotate: -15 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                      >
                        <div className="w-[140%] h-3 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)] rotate-[35deg]" />
                      </motion.div>
                    )}
                    {meAnimation === "impact" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1.3 }}
                        exit={{ opacity: 0, scale: 1.8 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                      >
                        <div className="w-12 h-12 rounded-full border-4 border-yellow-400 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.8)] animate-ping" />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              </div>
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
              <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl flex flex-col justify-between gap-2.5 shadow-lg relative overflow-hidden">
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
                  {/* Slash / Impact overlays for Player B */}
                  <AnimatePresence>
                    {opponentAnimation === "slash" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                        animate={{ opacity: 1, scale: 1.2, rotate: -15 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                      >
                        <div className="w-[140%] h-3 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)] rotate-[35deg]" />
                      </motion.div>
                    )}
                    {opponentAnimation === "impact" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1.3 }}
                        exit={{ opacity: 0, scale: 1.8 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                      >
                        <div className="w-12 h-12 rounded-full border-4 border-yellow-400 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.8)] animate-ping" />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              </div>
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
          {rewards && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-5 overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-5 items-center text-center shadow-2xl relative"
              >
                <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center shadow-lg">
                  <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-black text-slate-100 tracking-wide">{language === "id" ? "HASIL PERTANDINGAN" : "BATTLE RESULT"}</h3>
                  <p className="text-xs text-slate-400">{language === "id" ? "Terima kasih telah bertarung di Nekomon Arena!" : "Thank you for fighting in the Nekomon Arena!"}</p>
                </div>

                {/* Reward metrics */}
                <div className="grid grid-cols-2 gap-3 w-full font-mono text-xs">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1">
                    <span className="text-[9px] text-slate-500">{language === "id" ? "POIN DITERIMA" : "POINTS RECEIVED"}</span>
                    <span className="font-extrabold text-yellow-400 text-sm">+{rewards.pointsGained} {language === "id" ? "Poin" : "Points"}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1">
                    <span className="text-[9px] text-slate-500">{language === "id" ? "EXP KARTU" : "CARD EXP"}</span>
                    <span className="font-extrabold text-blue-400 text-sm">+{rewards.xpGained} XP</span>
                  </div>
                </div>

                {/* LEVEL UP CELEBRATION */}
                {rewards.leveledUp && rewards.card && (
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-2xl w-full flex flex-col gap-1.5"
                  >
                    <div className="text-xs font-black text-yellow-400 tracking-wider flex items-center justify-center gap-1">
                      <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                      {language === "id" ? "🎉 LEVEL UP KARTU! 🎉" : "🎉 CARD LEVEL UP! 🎉"}
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono">
                      {rewards.card.name} {language === "id" ? "naik ke" : "reached"} <span className="font-black text-yellow-400">LV. {rewards.newLevel}</span>!
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 mt-1 font-mono text-[9px] text-slate-400">
                      <div>HP: {rewards.card.hp}</div>
                      <div>ATK: {rewards.card.atk}</div>
                      <div>DEF: {rewards.card.def}</div>
                      <div>SPD: {rewards.card.spd}</div>
                    </div>
                  </motion.div>
                )}

                <button
                  onClick={quitBattle}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs transition-all tracking-wider cursor-pointer mt-2"
                >
                  {language === "id" ? "KEMBALI KE LOBBY" : "RETURN TO LOBBY"}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
                        {c.name} (LV. {c.level || 1} • {c.element})
                      </option>
                    ))}
                  </select>

                  {/* Chosen Card Preview Hud */}
                  {selectedPlayerCard && (
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3.5">
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
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-3.5 rounded-xl text-xs transition-all tracking-widest flex items-center justify-center gap-2 shadow-md shadow-yellow-500/5 cursor-pointer"
                    >
                      <Swords className="w-4 h-4" />
                      {language === "id" ? "MULAI PVP ARENA ⚔️" : "START PVP ARENA ⚔️"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Elements RPS Mechanics Help Sheet */}
            <div className="bg-slate-900/40 border border-slate-800/50 p-3 rounded-2xl shrink-0 font-mono">
              <span className="text-[9px] font-extrabold text-slate-400 tracking-widest uppercase block mb-1.5">
                {language === "id" ? "KEUNGGULAN SIKLUS 5 ELEMEN (+40% PWR)" : "5-ELEMENT CYCLE ADVANTAGES (+40% PWR)"}
              </span>
              <div className="grid grid-cols-5 gap-1 text-[8.5px] text-center text-slate-400">
                <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                  <span className="text-blue-400 font-bold">💧 {language === "id" ? "Air" : "Water"}</span> {language === "id" ? "kalahkan" : "beats"} Api/Tanah
                </div>
                <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                  <span className="text-red-400 font-bold">🔥 {language === "id" ? "Api" : "Fire"}</span> {language === "id" ? "kalahkan" : "beats"} Angin/Petir
                </div>
                <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                  <span className="text-teal-400 font-bold">🌪️ {language === "id" ? "Angin" : "Wind"}</span> {language === "id" ? "kalahkan" : "beats"} Tanah/Air
                </div>
                <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                  <span className="text-amber-600 font-bold">🪵 {language === "id" ? "Tanah" : "Earth"}</span> {language === "id" ? "kalahkan" : "beats"} Petir/Api
                </div>
                <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                  <span className="text-yellow-400 font-bold">⚡ {language === "id" ? "Petir" : "Lightning"}</span> {language === "id" ? "kalahkan" : "beats"} Air/Angin
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

        {activeTab === "online" && (
          <div className="flex-1 bg-slate-900 border border-slate-800/60 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <span className="text-[10px] font-mono font-black tracking-wider text-slate-400 uppercase">
              {language === "id" ? "DAFTAR PELATIH AKTIF" : "ACTIVE TRAINERS LIST"}
            </span>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {onlineUsers.length === 0 ? (
                <div className="text-center text-slate-500 mt-6 font-mono text-[10px]">
                  {language === "id" ? "Tidak ada pelatih yang terdeteksi online." : "No trainers detected online."}
                </div>
              ) : (
                onlineUsers.map((u) => {
                  return (
                    <div key={u.id} className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between font-mono">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold text-slate-200 truncate">{u.username}</span>
                          <span className="text-[9px] text-slate-500 uppercase">{u.points} {language === "id" ? "Poin" : "Points"}</span>
                        </div>
                      </div>
                      
                      {u.inBattle ? (
                        <span className="bg-red-500/15 text-red-400 border border-red-500/20 text-[8px] font-bold px-2 py-0.5 rounded-full">
                          ⚔️ {language === "id" ? "SEDANG BATTLE" : "IN BATTLE"}
                        </span>
                      ) : (
                        <span className="bg-slate-900/60 text-slate-400 border border-slate-800 text-[8px] font-bold px-2 py-0.5 rounded-full">
                          {language === "id" ? "STANDBY" : "STANDBY"}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
