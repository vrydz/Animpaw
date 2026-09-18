import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { getElementalMultiplier, getSkillPowerMultiplier, getSpeedMultiplier, getStyleAttackMultiplier, getStyleDefenseMultiplier } from "../src/lib/combatBalance";
import { applyCardXp } from "../src/lib/cardProgression";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

interface PlayerState {
  userId: string;
  username: string;
  card: any;
  hp: number;
  maxHp: number;
  energy: number;
  action: "attack" | "skill" | "defend" | null;
  isBot: boolean;
}

interface BattleRoom {
  id: string;
  playerA: PlayerState;
  playerB: PlayerState;
  status: "lobby" | "active" | "ended";
  winnerId: string | null;
  round: number;
  logs: string[];
  countdownValue: number;
  startedAt: number;
}

// Global state
const activeConnections = new Map<string, { ws: WebSocket; username: string; userProfile: any }>();
const matchmakingQueue: { userId: string; cardId: string }[] = [];
const activeBattles = new Map<string, BattleRoom>();
const chatHistory: ChatMessage[] = [];

// Clean up disconnected or inactive battles
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of activeBattles.entries()) {
    // If a battle has been running for more than 10 minutes, clean it up
    if (now - room.startedAt > 600000) {
      activeBattles.delete(id);
    }
  }
}, 60000);

// Helper to update card energy (1 bar per 2 hours)
function updateCardEnergy(card: any): any {
  if (!card) return card;
  const maxEnergy = card.maxEnergy ?? 5;
  let currentEnergy = card.energy ?? 5;
  const now = Date.now();
  const lastRefillMs = card.lastEnergyRefillAt ? new Date(card.lastEnergyRefillAt).getTime() : now;
  const twoHoursMs = 2 * 60 * 60 * 1000;

  if (currentEnergy < maxEnergy) {
    const elapsed = now - lastRefillMs;
    if (elapsed >= twoHoursMs) {
      const barsToAdd = Math.floor(elapsed / twoHoursMs);
      const newEnergy = Math.min(maxEnergy, currentEnergy + barsToAdd);
      const remainder = elapsed % twoHoursMs;
      card.energy = newEnergy;
      card.lastEnergyRefillAt = new Date(now - remainder).toISOString();
    } else {
      card.energy = currentEnergy;
    }
  } else {
    card.energy = maxEnergy;
    if (!card.lastEnergyRefillAt) {
      card.lastEnergyRefillAt = new Date(now).toISOString();
    }
  }
  card.maxEnergy = maxEnergy;
  return card;
}

// Broadcasters
function broadcastToAll(data: any) {
  const payload = JSON.stringify(data);
  for (const conn of activeConnections.values()) {
    if (conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(payload);
    }
  }
}

function broadcastPresence() {
  const onlineUsers = Array.from(activeConnections.entries()).map(([userId, info]) => {
    // Check if user is in an active battle
    let inBattle = false;
    for (const room of activeBattles.values()) {
      if ((room.playerA.userId === userId || room.playerB.userId === userId) && room.status !== "ended") {
        inBattle = true;
        break;
      }
    }
    return {
      id: userId,
      username: info.username,
      points: info.userProfile?.points || 0,
      inBattle
    };
  });
  
  broadcastToAll({
    type: "presence",
    onlineUsers
  });
}

export function initWebSocket(server: Server, readDB: () => any, writeDB: (data: any) => void) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade manually
  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    let currentUserId: string | null = null;
    let authTimeout = setTimeout(() => {
      if (!currentUserId && ws.readyState === WebSocket.OPEN) {
        ws.close(4001, "Authentication Timeout");
      }
    }, 10000);

    ws.on("message", (messageStr: string) => {
      try {
        const msg = JSON.parse(messageStr);

        // 1. AUTHENTICATION
        if (msg.type === "auth") {
          clearTimeout(authTimeout);
          const { token } = msg;
          if (!token) {
            ws.send(JSON.stringify({ type: "error", error: "Token is required" }));
            return;
          }

          try {
            const decoded = Buffer.from(token, "base64").toString("utf8");
            const [id, username] = decoded.split(":");
            const db = readDB();
            const user = db.users.find((u: any) => u.id === id && u.username.toLowerCase() === username.toLowerCase());

            if (!user) {
              ws.send(JSON.stringify({ type: "error", error: "Invalid credentials" }));
              return;
            }

            currentUserId = user.id;
            
            // Overwrite existing connection for same user if any
            const existing = activeConnections.get(currentUserId);
            if (existing) {
              try { existing.ws.close(); } catch(_) {}
            }

            activeConnections.set(currentUserId, { ws, username: user.username, userProfile: user });

            ws.send(JSON.stringify({
              type: "auth_ok",
              user: { id: user.id, username: user.username, points: user.points }
            }));

            // Send chat history
            ws.send(JSON.stringify({
              type: "chat_history",
              history: chatHistory
            }));

            broadcastPresence();
            console.log(`WebSocket user authenticated: ${user.username}`);
          } catch (err) {
            ws.send(JSON.stringify({ type: "error", error: "Auth failed" }));
          }
        }

        // Must be authenticated for any other action
        if (!currentUserId) return;
        const connectionInfo = activeConnections.get(currentUserId);
        if (!connectionInfo) return;

        // 2. CHAT MESSAGE
        if (msg.type === "chat") {
          const { text } = msg;
          if (!text || text.trim() === "") return;

          const newMsg: ChatMessage = {
            id: "msg_" + Math.random().toString(36).substr(2, 9),
            userId: currentUserId,
            username: connectionInfo.username,
            text: text.trim().substr(0, 200),
            timestamp: new Date().toISOString()
          };

          chatHistory.push(newMsg);
          if (chatHistory.length > 50) chatHistory.shift();

          broadcastToAll({
            type: "chat_msg",
            message: newMsg
          });
        }

        // 3. JOIN MATCHMAKING QUEUE
        if (msg.type === "join_queue") {
          const { cardId } = msg;
          if (!cardId) {
            ws.send(JSON.stringify({ type: "error", error: "Pilih Nekomon Card untuk bertarung." }));
            return;
          }

          const db = readDB();
          const card = db.cards.find((c: any) => c.id === cardId && c.userId === currentUserId);
          if (!card) {
            ws.send(JSON.stringify({ type: "error", error: "Nekomon Card tidak valid atau bukan milik Anda." }));
            return;
          }

          updateCardEnergy(card);
          if ((card.energy ?? 5) < 1) {
            ws.send(JSON.stringify({ type: "error", error: "Energi Nekomon Card ini telah habis (0/5)! Di-refill 1 bar setiap 2 jam. Pilih kartu lain atau tunggu energi terisi kembali." }));
            return;
          }

          // Remove if already in queue
          const qIdx = matchmakingQueue.findIndex(q => q.userId === currentUserId);
          if (qIdx !== -1) matchmakingQueue.splice(qIdx, 1);

          // Add to queue
          matchmakingQueue.push({ userId: currentUserId, cardId });
          ws.send(JSON.stringify({ type: "queue_status", status: "searching" }));

          // Attempt matchmaking
          processMatchmaking(readDB, writeDB);
        }

        // 4. LEAVE MATCHMAKING QUEUE
        if (msg.type === "leave_queue") {
          const qIdx = matchmakingQueue.findIndex(q => q.userId === currentUserId);
          if (qIdx !== -1) {
            matchmakingQueue.splice(qIdx, 1);
          }
          ws.send(JSON.stringify({ type: "queue_status", status: "idle" }));
        }

        // 5. SUBMIT BATTLE ACTION
        if (msg.type === "battle_action") {
          const { battleId, action } = msg;
          if (!battleId || !action) return;

          const room = activeBattles.get(battleId);
          if (!room || room.status !== "active") return;

          let player: PlayerState | null = null;
          let isPlayerA = false;

          if (room.playerA.userId === currentUserId) {
            player = room.playerA;
            isPlayerA = true;
          } else if (room.playerB.userId === currentUserId) {
            player = room.playerB;
          }

          if (!player) return;

          // If action is skill, make sure player has enough energy (costs 30)
          if (action === "skill" && player.energy < 30) {
            ws.send(JSON.stringify({ type: "error", error: "Energi tidak cukup untuk menggunakan Skill!" }));
            return;
          }

          player.action = action;

          // If opponent is Bot, auto-play Bot's turn instantly
          if (room.playerB.isBot) {
            const bot = room.playerB;
            if (bot.energy >= 30) {
              const roll = Math.random();
              bot.action = roll < 0.4 ? "skill" : (roll < 0.85 ? "attack" : "defend");
            } else {
              bot.action = Math.random() < 0.8 ? "attack" : "defend";
            }
          }

          // Check if both actions are submitted
          if (room.playerA.action && room.playerB.action) {
            resolveBattleRound(room, readDB, writeDB);
          } else {
            // Notify other player that this player is ready/waiting
            broadcastRoomState(room);
          }
        }

      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    });

    ws.on("close", () => {
      if (currentUserId) {
        activeConnections.delete(currentUserId);
        
        // Remove from matchmaking queue
        const qIdx = matchmakingQueue.findIndex(q => q.userId === currentUserId);
        if (qIdx !== -1) matchmakingQueue.splice(qIdx, 1);

        broadcastPresence();
        console.log(`WebSocket user disconnected: ${currentUserId}`);
      }
    });
  });
}

// Process Matchmaking Algorithm
function processMatchmaking(readDB: () => any, writeDB: (data: any) => void) {
  if (matchmakingQueue.length >= 2) {
    // Match the first two real players
    const matchA = matchmakingQueue.shift()!;
    const matchB = matchmakingQueue.shift()!;

    const db = readDB();
    const userA = db.users.find((u: any) => u.id === matchA.userId);
    const userB = db.users.find((u: any) => u.id === matchB.userId);
    const cardA = db.cards.find((c: any) => c.id === matchA.cardId);
    const cardB = db.cards.find((c: any) => c.id === matchB.cardId);

    if (!userA || !userB || !cardA || !cardB) {
      // Something is invalid, put survivors back in queue or discard
      if (userA && cardA) matchmakingQueue.push(matchA);
      if (userB && cardB) matchmakingQueue.push(matchB);
      return;
    }

    createBattleRoom(userA, cardA, userB, cardB, false, readDB, writeDB);
  } else if (matchmakingQueue.length === 1) {
    // If only 1 player in queue, start a timer to match with a Bot after 5 seconds
    const singleMatch = matchmakingQueue[0];
    const triggerTime = Date.now();

    setTimeout(() => {
      // Check if player is still in queue
      const currentIdx = matchmakingQueue.findIndex(q => q.userId === singleMatch.userId);
      if (currentIdx !== -1) {
        // Remove from queue and match with Bot
        matchmakingQueue.splice(currentIdx, 1);

        const db = readDB();
        const userA = db.users.find((u: any) => u.id === singleMatch.userId);
        const cardA = db.cards.find((c: any) => c.id === singleMatch.cardId);

        if (userA && cardA) {
          // Get seeded bots from database users list
          const bots = (db.users || []).filter((u: any) => u.id.startsWith("bot_") || u.isBot);
          const chosenBot = bots.length > 0
            ? bots[Math.floor(Math.random() * bots.length)]
            : { id: "bot_cika_kitty", username: "Cika_Kitty", points: 450 };

          const botUserId = chosenBot.id;
          const botUsername = `${chosenBot.username} [BOT]`;
          
          // Generate customized Bot card referencing player-forged cards (excluding other bot cards)
          const realCards = (db.cards || []).filter((c: any) => !c.userId.startsWith("bot_"));
          const refCard = realCards.length > 0
            ? realCards[Math.floor(Math.random() * realCards.length)]
            : cardA;

          // Scale bot card level based on the real player's card level
          const botCardLevel = Math.max(1, (cardA.level || 1) + Math.floor(Math.random() * 3) - 1);

          const botCard = {
            id: "bot_card_" + Math.random().toString(36).substr(2, 9),
            name: refCard.name || `${refCard.element || "Api"} Striker`,
            element: refCard.element || "Api",
            rarity: refCard.rarity || "Common",
            style: refCard.style || "Sentinel",
            skillName: refCard.skillName || `${refCard.element || "Api"} Burst`,
            skillDesc: refCard.skillDesc || "Serangan elemental bot yang tangguh.",
            level: botCardLevel,
            hp: Math.floor(((refCard.hp || 200) * (botCardLevel / (refCard.level || 1))) * (0.85 + Math.random() * 0.3)),
            atk: Math.floor(((refCard.atk || 80) * (botCardLevel / (refCard.level || 1))) * (0.85 + Math.random() * 0.3)),
            def: Math.floor(((refCard.def || 80) * (botCardLevel / (refCard.level || 1))) * (0.85 + Math.random() * 0.3)),
            spd: refCard.spd || 100,
            imageUrl: refCard.imageUrl || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=300&auto=format&fit=crop"
          };

          const botUser = { id: botUserId, username: botUsername, points: chosenBot.points || 100 };

          createBattleRoom(userA, cardA, botUser, botCard, true, readDB, writeDB);
        }
      }
    }, 5000);
  }
}

// Create Battle Room State
function createBattleRoom(userA: any, cardA: any, userB: any, cardB: any, isBot: boolean, readDB: () => any, writeDB: (data: any) => void) {
  const battleId = "battle_" + Math.random().toString(36).substr(2, 9);

  // Deduct 1 card energy bar from participating player cards
  const db = readDB();
  if (cardA && cardA.id) {
    const dbCardA = db.cards.find((c: any) => c.id === cardA.id);
    if (dbCardA) {
      updateCardEnergy(dbCardA);
      if ((dbCardA.energy ?? 5) === (dbCardA.maxEnergy ?? 5)) {
        dbCardA.lastEnergyRefillAt = new Date().toISOString();
      }
      dbCardA.energy = Math.max(0, (dbCardA.energy ?? 5) - 1);
      cardA.energy = dbCardA.energy;
      cardA.lastEnergyRefillAt = dbCardA.lastEnergyRefillAt;
    }
  }

  if (!isBot && cardB && cardB.id) {
    const dbCardB = db.cards.find((c: any) => c.id === cardB.id);
    if (dbCardB) {
      updateCardEnergy(dbCardB);
      if ((dbCardB.energy ?? 5) === (dbCardB.maxEnergy ?? 5)) {
        dbCardB.lastEnergyRefillAt = new Date().toISOString();
      }
      dbCardB.energy = Math.max(0, (dbCardB.energy ?? 5) - 1);
      cardB.energy = dbCardB.energy;
      cardB.lastEnergyRefillAt = dbCardB.lastEnergyRefillAt;
    }
  }
  writeDB(db);

  const room: BattleRoom = {
    id: battleId,
    playerA: {
      userId: userA.id,
      username: userA.username,
      card: cardA,
      hp: cardA.hp || 200,
      maxHp: cardA.hp || 200,
      energy: 30, // Start with 30 energy to allow early Skill
      action: null,
      isBot: false
    },
    playerB: {
      userId: userB.id,
      username: userB.username,
      card: cardB,
      hp: cardB.hp || 200,
      maxHp: cardB.hp || 200,
      energy: 30,
      action: null,
      isBot
    },
    status: "lobby",
    winnerId: null,
    round: 0,
    logs: [
      `[ARENA] Pertandingan ditemukan! ${userA.username} VS ${userB.username}.`,
      `[INFO] Kucing sedang bersiap-siap di ruang ganti...`
    ],
    countdownValue: 5,
    startedAt: Date.now()
  };

  activeBattles.set(battleId, room);

  // Broadcast Match Found to Player A and Player B (if B is real)
  sendToUser(room.playerA.userId, {
    type: "battle_found",
    battleId: room.id,
    role: "playerA",
    opponentName: room.playerB.username,
    isBot
  });

  if (!isBot) {
    sendToUser(room.playerB.userId, {
      type: "battle_found",
      battleId: room.id,
      role: "playerB",
      opponentName: room.playerA.username,
      isBot: false
    });
  }

  // Lobby countdown to hide cards before battle officially starts
  const interval = setInterval(() => {
    const r = activeBattles.get(battleId);
    if (!r) {
      clearInterval(interval);
      return;
    }

    r.countdownValue -= 1;
    
    if (r.countdownValue <= 0) {
      clearInterval(interval);
      r.status = "active";
      r.round = 1;
      r.logs.push(`[MULAI] Pertempuran dimulai! Nekomon cards telah terungkap! 💥`);
      r.logs.push(`[ROUND 1] Pilih aksi Anda: Serang, Skill (Butuh 30 Energi), atau Bertahan!`);
      
      broadcastRoomState(r);
    } else {
      broadcastLobbyState(r);
    }
  }, 1000);

  broadcastLobbyState(room);
  broadcastPresence();
}

// Send state to a single user
function sendToUser(userId: string, data: any) {
  const conn = activeConnections.get(userId);
  if (conn && conn.ws.readyState === WebSocket.OPEN) {
    conn.ws.send(JSON.stringify(data));
  }
}

// Broadcast Lobby State: Opponent's card is HIDDEN silhouette (no reveal yet!)
function broadcastLobbyState(room: BattleRoom) {
  // Player A sees Player B's card as mystery silhouette
  sendToUser(room.playerA.userId, {
    type: "battle_lobby",
    battleId: room.id,
    countdownValue: room.countdownValue,
    myCard: room.playerA.card,
    opponentName: room.playerB.username,
    opponentCard: { name: "Nekomon Misterius", level: "?", element: "???", rarity: "???", style: "???", imageUrl: null },
    logs: room.logs
  });

  if (!room.playerB.isBot) {
    // Player B sees Player A's card as mystery silhouette
    sendToUser(room.playerB.userId, {
      type: "battle_lobby",
      battleId: room.id,
      countdownValue: room.countdownValue,
      myCard: room.playerB.card,
      opponentName: room.playerA.username,
      opponentCard: { name: "Nekomon Misterius", level: "?", element: "???", rarity: "???", style: "???", imageUrl: null },
      logs: room.logs
    });
  }
}

// Broadcast Full Active Battle State (Cards are now revealed!)
function broadcastRoomState(room: BattleRoom) {
  // Player A State payload
  sendToUser(room.playerA.userId, {
    type: "battle_state",
    battleId: room.id,
    status: room.status,
    round: room.round,
    role: "playerA",
    me: {
      username: room.playerA.username,
      hp: room.playerA.hp,
      maxHp: room.playerA.maxHp,
      energy: room.playerA.energy,
      card: room.playerA.card,
      hasSubmitted: !!room.playerA.action
    },
    opponent: {
      username: room.playerB.username,
      hp: room.playerB.hp,
      maxHp: room.playerB.maxHp,
      energy: room.playerB.energy,
      card: room.playerB.card,
      hasSubmitted: !!room.playerB.action
    },
    logs: room.logs,
    winnerId: room.winnerId
  });

  if (!room.playerB.isBot) {
    // Player B State payload
    sendToUser(room.playerB.userId, {
      type: "battle_state",
      battleId: room.id,
      status: room.status,
      round: room.round,
      role: "playerB",
      me: {
        username: room.playerB.username,
        hp: room.playerB.hp,
        maxHp: room.playerB.maxHp,
        energy: room.playerB.energy,
        card: room.playerB.card,
        hasSubmitted: !!room.playerB.action
      },
      opponent: {
        username: room.playerA.username,
        hp: room.playerA.hp,
        maxHp: room.playerA.maxHp,
        energy: room.playerA.energy,
        card: room.playerA.card,
        hasSubmitted: !!room.playerA.action
      },
      logs: room.logs,
      winnerId: room.winnerId
    });
  }
}

// Resolve Clash of a round server-authoritatively
function resolveBattleRound(room: BattleRoom, readDB: () => any, writeDB: (data: any) => void) {
  const cardA = room.playerA.card;
  const cardB = room.playerB.card;

  const actA = room.playerA.action!;
  const actB = room.playerB.action!;

  // 1. Calculate Element Multipliers based on 5-element Rock-Paper-Scissors cycle
  const multA = getElementalMultiplier(cardA.element, cardB.element);
  const multB = getElementalMultiplier(cardB.element, cardA.element);
  const speedMultA = getSpeedMultiplier(cardA.spd, cardB.spd);
  const speedMultB = getSpeedMultiplier(cardB.spd, cardA.spd);

  let roundLogs: string[] = [];
  roundLogs.push(`--- ROUND ${room.round} RESOLUTION ---`);

  // Action descriptions
  const actDesc = (act: string, card: any) => {
    if (act === "attack") return "melancarkan serangan Cakar Cepat 🐾";
    if (act === "skill") return `mengerahkan Ultimate Skill [${card.skillName || "Mew Attack"}] 💥`;
    return "mengambil sikap Bertahan dan mengumpulkan energi 🛡️";
  };

  roundLogs.push(`[AKSI] ${room.playerA.username}'s ${cardA.name} ${actDesc(actA, cardA)}.`);
  roundLogs.push(`[AKSI] ${room.playerB.username}'s ${cardB.name} ${actDesc(actB, cardB)}.`);

  // Element advantage announcements
  if (multA > 1.0) {
    roundLogs.push(`🔥 UNGGUL ELEMEN! Elemen ${cardA.element} milik ${cardA.name} sangat efektif melawan ${cardB.element} (+30% PWR)!`);
  }
  if (multB > 1.0) {
    roundLogs.push(`🔥 UNGGUL ELEMEN! Elemen ${cardB.element} milik ${cardB.name} sangat efektif melawan ${cardA.element} (+30% PWR)!`);
  }

  // Deduct energy for skills
  if (actA === "skill") room.playerA.energy -= 30;
  if (actB === "skill") room.playerB.energy -= 30;

  // Base damage calculations
  let dmgToB = 0;
  let dmgToA = 0;

  const minDmg = (lvl: number) => Math.max(15, lvl * 5);

  // A's attack power
  if (actA === "attack") {
    const raw = (cardA.atk || 80) * getStyleAttackMultiplier(cardA.style) * multA * speedMultA * (0.85 + Math.random() * 0.3);
    dmgToB = Math.max(minDmg(cardA.level), Math.floor(raw - (cardB.def || 80) * getStyleDefenseMultiplier(cardB.style) * 0.45));
  } else if (actA === "skill") {
    const raw = (cardA.atk || 80) * getStyleAttackMultiplier(cardA.style) * getSkillPowerMultiplier(cardA.element) * multA * speedMultA * (0.95 + Math.random() * 0.15);
    dmgToB = Math.max(minDmg(cardA.level) * 1.5, Math.floor(raw - (cardB.def || 80) * getStyleDefenseMultiplier(cardB.style) * 0.3));
  }

  // B's attack power
  if (actB === "attack") {
    const raw = (cardB.atk || 80) * getStyleAttackMultiplier(cardB.style) * multB * speedMultB * (0.85 + Math.random() * 0.3);
    dmgToA = Math.max(minDmg(cardB.level), Math.floor(raw - (cardA.def || 80) * getStyleDefenseMultiplier(cardA.style) * 0.45));
  } else if (actB === "skill") {
    const raw = (cardB.atk || 80) * getStyleAttackMultiplier(cardB.style) * getSkillPowerMultiplier(cardB.element) * multB * speedMultB * (0.95 + Math.random() * 0.15);
    dmgToA = Math.max(minDmg(cardB.level) * 1.5, Math.floor(raw - (cardA.def || 80) * getStyleDefenseMultiplier(cardA.style) * 0.3));
  }

  // Adjust for defenses
  if (actB === "defend") {
    dmgToB = Math.floor(dmgToB * 0.35); // Block 65% damage
    room.playerB.energy = Math.min(100, room.playerB.energy + 30); // Higher energy regen
    roundLogs.push(`🛡️ ${cardB.name} berhasil memitigasi sebagian besar damage!`);
  } else {
    room.playerB.energy = Math.min(100, room.playerB.energy + 15); // Normal energy regen
  }

  if (actA === "defend") {
    dmgToA = Math.floor(dmgToA * 0.35);
    room.playerA.energy = Math.min(100, room.playerA.energy + 30);
    roundLogs.push(`🛡️ ${cardA.name} berhasil memitigasi sebagian besar damage!`);
  } else {
    room.playerA.energy = Math.min(100, room.playerA.energy + 15);
  }

  // Apply damages
  if (dmgToB > 0) {
    room.playerB.hp = Math.max(0, room.playerB.hp - dmgToB);
    roundLogs.push(`💥 ${cardA.name} memberikan ${dmgToB} DMG kepada ${cardB.name}!`);
  }
  if (dmgToA > 0) {
    room.playerA.hp = Math.max(0, room.playerA.hp - dmgToA);
    roundLogs.push(`💥 ${cardB.name} memberikan ${dmgToA} DMG kepada ${cardA.name}!`);
  }

  // Reset submitted actions
  room.playerA.action = null;
  room.playerB.action = null;

  // Append new logs
  room.logs.push(...roundLogs);

  // Check battle end conditions
  if (room.playerA.hp <= 0 || room.playerB.hp <= 0) {
    room.status = "ended";
    
    let winner: PlayerState | null = null;
    let loser: PlayerState | null = null;

    if (room.playerA.hp <= 0 && room.playerB.hp <= 0) {
      // Tie breaker based on higher speed, then a fair random roll.
      if ((cardA.spd || 0) > (cardB.spd || 0)) {
        winner = room.playerA;
        loser = room.playerB;
      } else if ((cardB.spd || 0) > (cardA.spd || 0)) {
        winner = room.playerB;
        loser = room.playerA;
      } else if (Math.random() < 0.5) {
        winner = room.playerA;
        loser = room.playerB;
      } else {
        winner = room.playerB;
        loser = room.playerA;
      }
    } else if (room.playerA.hp <= 0) {
      winner = room.playerB;
      loser = room.playerA;
    } else {
      winner = room.playerA;
      loser = room.playerB;
    }

    room.winnerId = winner.userId;
    room.logs.push(`[SELESAI] Pertempuran Berakhir! Pemenangnya adalah ${winner.username}'s ${winner.card.name}! 🎉`);

    // Distribute rewards to database users and cards
    awardMatchRewards(winner, loser, readDB, writeDB);
  } else {
    room.round += 1;
    room.logs.push(`[SISTEM] Round ${room.round} Dimulai! Pilihlah langkah Anda berikutnya.`);
  }

  broadcastRoomState(room);
  broadcastPresence();
}

// Award points and XP, check card Level Ups in Database
function awardMatchRewards(winner: PlayerState, loser: PlayerState, readDB: () => any, writeDB: (data: any) => void) {
  const db = readDB();

  // Record battle history entry in server database
  if (!db.battleHistory) db.battleHistory = [];
  const historyEntry = {
    id: "bh_" + Math.random().toString(36).substring(2, 11),
    winnerId: winner.userId,
    winnerName: winner.username,
    winnerCardName: winner.card?.name || "Nekomon",
    winnerCardImageUrl: winner.card?.imageUrl || "",
    winnerCardLevel: winner.card?.level || 1,
    winnerCardElement: winner.card?.element || "Api",
    loserId: loser.userId,
    loserName: loser.username,
    loserCardName: loser.card?.name || "Nekomon",
    loserCardImageUrl: loser.card?.imageUrl || "",
    loserCardLevel: loser.card?.level || 1,
    loserCardElement: loser.card?.element || "Air",
    isBotMatch: winner.isBot || loser.isBot,
    createdAt: new Date().toISOString()
  };
  db.battleHistory.unshift(historyEntry);
  if (db.battleHistory.length > 50) {
    db.battleHistory = db.battleHistory.slice(0, 50);
  }

  // 1. Process Winner
  if (!winner.isBot) {
    const wUser = db.users.find((u: any) => u.id === winner.userId);
    if (wUser) {
      wUser.points = (wUser.points || 0) + 25; // Winner gets 25 points
    }

    const wCardIdx = db.cards.findIndex((c: any) => c.id === winner.card.id && c.userId === winner.userId);
    if (wCardIdx !== -1) {
      const card = db.cards[wCardIdx];
      const xpGained = 120;
      const { leveledUp } = applyCardXp(card, xpGained);

      db.cards[wCardIdx] = card;

      sendToUser(winner.userId, {
        type: "battle_rewards",
        pointsGained: 25,
        xpGained: 120,
        leveledUp,
        newLevel: card.level,
        card
      });
    }
  } else {
    // Winner is a Bot
    const wUser = db.users.find((u: any) => u.id === winner.userId);
    if (wUser) {
      wUser.points = (wUser.points || 0) + 25;
    }
  }

  // 2. Process Loser (10 Points Penalty)
  if (!loser.isBot) {
    const lUser = db.users.find((u: any) => u.id === loser.userId);
    if (lUser) {
      lUser.points = Math.max(0, (lUser.points || 0) - 10); // Loser loses 10 points
    }

    const lCardIdx = db.cards.findIndex((c: any) => c.id === loser.card.id && c.userId === loser.userId);
    if (lCardIdx !== -1) {
      const card = db.cards[lCardIdx];
      const xpGained = 50;
      const { leveledUp } = applyCardXp(card, xpGained);

      db.cards[lCardIdx] = card;

      sendToUser(loser.userId, {
        type: "battle_rewards",
        pointsGained: -10,
        xpGained: 50,
        leveledUp,
        newLevel: card.level,
        card
      });
    }
  } else {
    // Loser is a Bot
    const lUser = db.users.find((u: any) => u.id === loser.userId);
    if (lUser) {
      lUser.points = (lUser.points || 0) + 10;
    }
  }

  writeDB(db);
}
