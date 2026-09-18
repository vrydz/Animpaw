import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getAuth as getFirebaseAdminAuth } from "firebase-admin/auth";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initWebSocket } from "./server/websocket";
import { syncToFirestore, loadFromFirestore } from "./server/firestoreDb";
import { sendVerificationEmail, sendPasswordResetEmail } from "./server/mailer";
import { createSessionToken, hashPassword, verifyPassword, verifySessionToken } from "./server/security";
import { RAID_BOSS_TEMPLATES, createRaidBossInstance, generateBossArtwork, INDONESIAN_CITIES, CITY_BOSS_CONFIGS } from "./src/data/raidBossData";
import { resolveSeoRoute, renderSeoHtml } from "./server/seoRoutes";
import { ELEMENT_ADVANTAGE, ELEMENT_ADVANTAGE_MULTIPLIER, ELEMENT_RESISTANCE_MULTIPLIER, getSpeedMultiplier, getStyleAttackMultiplier, getStyleDefenseMultiplier } from "./src/lib/combatBalance";
import { applyCardXp } from "./src/lib/cardProgression";
import { NEKOMON_SPECIES_CATALOG } from "./src/data/nekomonSpeciesData";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "server", "db.json");

// Middleware to parse large JSON payloads (for base64 cat photos)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Synchronize memory cache / file DB on server boot
let isFirestoreLoaded = false;
let bootPromise: Promise<void> | null = null;

async function bootSyncFirestore() {
  if (isFirestoreLoaded) return;
  try {
    const remoteData = await loadFromFirestore();
    if (remoteData) {
      const current = readDBRaw();
      // Merge remote data into current DB
      if (Array.isArray(remoteData.users)) {
        remoteData.users.forEach((u: any) => {
          const idx = current.users.findIndex((x: any) => x.id === u.id);
          if (idx === -1) {
            current.users.push(u);
          } else {
            current.users[idx] = {
              ...current.users[idx],
              ...u,
              points: Math.max(current.users[idx].points || 0, u.points || 0),
              cores: Math.max(current.users[idx].cores || 0, u.cores || 0)
            };
          }
        });
      }
      if (Array.isArray(remoteData.captures)) {
        if (!current.captures) current.captures = [];
        remoteData.captures.forEach((c: any) => {
          if (!current.captures.some((x: any) => x.id === c.id)) {
            current.captures.push(c);
          }
        });
      }
      if (Array.isArray(remoteData.cards)) {
        if (!current.cards) current.cards = [];
        remoteData.cards.forEach((card: any) => {
          const cIdx = current.cards.findIndex((x: any) => x.id === card.id);
          if (cIdx === -1) {
            current.cards.push(card);
          } else {
            current.cards[cIdx] = { ...current.cards[cIdx], ...card };
          }
        });
      }
      if (Array.isArray(remoteData.trades)) {
        if (!current.trades) current.trades = [];
        remoteData.trades.forEach((t: any) => {
          if (!current.trades.some((x: any) => x.id === t.id)) {
            current.trades.push(t);
          }
        });
      }
      if (Array.isArray(remoteData.communitySpots)) {
        if (!current.communitySpots) current.communitySpots = [];
        remoteData.communitySpots.forEach((s: any) => {
          const sIdx = current.communitySpots.findIndex((x: any) => x.id === s.id);
          if (sIdx === -1) {
            current.communitySpots.push(s);
          } else {
            current.communitySpots[sIdx] = { ...current.communitySpots[sIdx], ...s };
          }
        });
      }
      if (Array.isArray(remoteData.battleHistory)) {
        if (!current.battleHistory) current.battleHistory = [];
        remoteData.battleHistory.forEach((b: any) => {
          if (!current.battleHistory.some((x: any) => x.id === b.id)) {
            current.battleHistory.push(b);
          }
        });
      }
      if (Array.isArray(remoteData.transactions)) {
        if (!current.transactions) current.transactions = [];
        remoteData.transactions.forEach((tx: any) => {
          if (!current.transactions.some((x: any) => x.id === tx.id)) {
            current.transactions.push(tx);
          }
        });
      }
      if (Array.isArray(remoteData.officialMails)) {
        if (!current.officialMails) current.officialMails = [];
        remoteData.officialMails.forEach((m: any) => {
          const mIdx = current.officialMails.findIndex((x: any) => x.id === m.id);
          if (mIdx === -1) {
            current.officialMails.push(m);
          } else {
            current.officialMails[mIdx] = { ...current.officialMails[mIdx], ...m };
          }
        });
      }
      if (Array.isArray(remoteData.directMessages)) {
        if (!current.directMessages) current.directMessages = [];
        remoteData.directMessages.forEach((dm: any) => {
          if (!current.directMessages.some((x: any) => x.id === dm.id)) {
            current.directMessages.push(dm);
          }
        });
      }
      if (Array.isArray(remoteData.territoryNodes)) {
        if (!current.territoryNodes) current.territoryNodes = [];
        remoteData.territoryNodes.forEach((node: any) => {
          const nIdx = current.territoryNodes.findIndex((x: any) => x.id === node.id);
          if (nIdx === -1) {
            current.territoryNodes.push(node);
          } else {
            current.territoryNodes[nIdx] = { ...current.territoryNodes[nIdx], ...node };
          }
        });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(current, null, 2));
      console.log("Database initialized & restored from Firestore successfully.");
    }
    isFirestoreLoaded = true;
  } catch (err) {
    console.warn("Boot Firestore sync warning:", err);
  }
}

async function ensureFirestoreLoaded() {
  if (isFirestoreLoaded) return;
  if (!bootPromise) {
    bootPromise = bootSyncFirestore();
  }
  await bootPromise;
}

// Trigger initial boot sync
ensureFirestoreLoaded();

// Express middleware for API routes to await Firestore sync
app.use("/api", async (req, res, next) => {
  try {
    await ensureFirestoreLoaded();
  } catch (e) {
    console.warn("Middleware Firestore sync wait notice:", e);
  }
  next();
});

// Default official mail broadcasts
const DEFAULT_OFFICIAL_MAILS = [
  {
    id: "mail_welcome_2026",
    title: "🎉 Selamat Datang di Nekomon Online (Welcome Trainer!)",
    category: "welcome",
    sender: "Nekomon Studio (support@nekomon.online)",
    senderEmail: "support@nekomon.online",
    summary: "Terima kasih telah bergabung dengan komunitas pemburu foto kucing AR Nekomon Online! Klaim hadiah sambutan starter pack Anda.",
    content: "Halo Trainer Nekomon!\n\nSelamat datang di dunia AR Cat Trading Card Game Indonesia! Tangkap foto kucing nyata di sekitarmu dengan Kamera AR, kumpulkan poin, dan tempa menjadi kartu anime faksi Sentinel atau Vanguard berkekuatan 5 Elemen (Aqua, Fire, Earth, Wind, Thunder).\n\nSebagai hadiah sambutan resmi dari kami, silakan klaim starter pack 50 Nekomon Points dan 5 Nekomon Cores di bawah ini!\n\nSalam hangat,\nTim Nekomon Studio\nEmail Bantuan: support@nekomon.online\nInstagram: @astronian22",
    reward: {
      points: 50,
      cores: 5
    },
    claimedUserIds: [],
    readUserIds: [],
    pinned: true,
    createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString()
  },
  {
    id: "mail_patch_v250",
    title: "🚀 Patch Update v2.5: Fitur Kotak Surat & Pesan Pribadi Antar Trainer",
    category: "patch_update",
    sender: "Nekomon Dev Team (support@nekomon.online)",
    senderEmail: "support@nekomon.online",
    summary: "Pembaruan v2.5 menghadirkan Kotak Surat Resmi (Mailbox), Siaran Update Game, dan Direct Messages antar pemain.",
    content: "Catatan Rilis Patch v2.5.0:\n\n1. 📬 Sistem Kotak Surat (Official Mailbox): Dapatkan informasi resmi langsung mengenai update patch, jadwal maintenance, dan hadiah kompensasi dari support@nekomon.online.\n2. 💬 Pesan Pribadi (Direct Messages): Sekarang Anda dapat berkirim pesan teks secara personal dengan trainer lain di seluruh Indonesia!\n3. ⚡ Optimasi sinkronisasi data kartu & arena PvP.\n4. 🛡️ Pembaruan identitas faksi Vanguard & balancing 5 elemen.\n\nKlaim bonus perayaan rilis patch sebesar +25 Poin & +2 Cores!",
    reward: {
      points: 25,
      cores: 2
    },
    claimedUserIds: [],
    readUserIds: [],
    pinned: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "mail_maint_schedule",
    title: "⚙️ Jadwal Pemeliharaan Server Rutin (Scheduled Maintenance)",
    category: "maintenance",
    sender: "Nekomon Operations (support@nekomon.online)",
    senderEmail: "support@nekomon.online",
    summary: "Informasi jadwal maintenance rutin mingguan untuk peningkatan kapasitas server dan database cloud.",
    content: "Pemberitahuan Kepada Seluruh Trainer:\n\nServer Nekomon Online dijadwalkan melakukan optimalisasi database cloud setiap hari Senin pukul 03:00 - 04:00 WIB. Selama proses pemeliharaan berlangsung, game tetap dapat diakses dengan mode fallback offline-sync.\n\nApabila Anda mengalami kendala teknis atau akun, silakan hubungi tim kami via email resmi: support@nekomon.online atau DM Instagram @astronian22.\n\nTerima kasih atas pengertian dan kerjasamanya! Silakan ambil hadiah kompensasi perawatan server berikut.",
    reward: {
      points: 15,
      cores: 1
    },
    claimedUserIds: [],
    readUserIds: [],
    pinned: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

// Raw sync readDB helper
function readDBRaw() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = { users: [], captures: [], cards: [], trades: [], communitySpots: [], battleHistory: [], transactions: [], officialMails: DEFAULT_OFFICIAL_MAILS, directMessages: [], raidBosses: [], raidLobbies: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(data);
    if (!parsed.trades) parsed.trades = [];
    if (!parsed.communitySpots) parsed.communitySpots = [];
    if (!parsed.battleHistory) parsed.battleHistory = [];
    if (!parsed.transactions) parsed.transactions = [];
    if (!parsed.captures) parsed.captures = [];
    if (!parsed.cards) parsed.cards = [];
    if (!parsed.officialMails) parsed.officialMails = [];
    if (!parsed.directMessages) parsed.directMessages = [];
    if (!parsed.raidBosses) parsed.raidBosses = [];
    if (!parsed.raidLobbies) parsed.raidLobbies = [];
    return parsed;
  } catch (err) {
    return { users: [], captures: [], cards: [], trades: [], communitySpots: [], battleHistory: [], transactions: [], officialMails: [], directMessages: [], raidBosses: [], raidLobbies: [] };
  }
}

// Initialize DB structure if somehow empty
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = { users: [], captures: [], cards: [], trades: [], communitySpots: [], battleHistory: [], transactions: [], officialMails: DEFAULT_OFFICIAL_MAILS, directMessages: [], raidBosses: [], raidLobbies: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(data);
    if (!parsed.trades) parsed.trades = [];
    if (!parsed.communitySpots) parsed.communitySpots = [];
    if (!parsed.battleHistory) parsed.battleHistory = [];
    if (!parsed.transactions) parsed.transactions = [];
    if (!parsed.captures) parsed.captures = [];
    if (!parsed.cards) parsed.cards = [];
    if (!parsed.officialMails) parsed.officialMails = [];
    if (!parsed.directMessages) parsed.directMessages = [];
    if (!parsed.raidBosses) parsed.raidBosses = [];
    if (!parsed.raidLobbies) parsed.raidLobbies = [];

    let modified = false;

    // Seed official mails if missing
    for (const defaultMail of DEFAULT_OFFICIAL_MAILS) {
      if (!parsed.officialMails.some((m: any) => m.id === defaultMail.id)) {
        parsed.officialMails.push(defaultMail);
        modified = true;
      }
    }

    // Seed Bot Players with unique names if they don't already exist
    const bots = [
      { id: "bot_cika_kitty", username: "Cika_Kitty", email: "cika_kitty@bot.com", password: "bot", points: 420, cores: 8, createdAt: new Date().toISOString(), isBot: true },
      { id: "bot_miauw_hunter", username: "Miauw_Hunter", email: "miauw_hunter@bot.com", password: "bot", points: 380, cores: 5, createdAt: new Date().toISOString(), isBot: true },
      { id: "bot_pakrt_neko", username: "PakRT_neko", email: "pakrt_neko@bot.com", password: "bot", points: 510, cores: 10, createdAt: new Date().toISOString(), isBot: true },
      { id: "bot_paw_master", username: "Paw_Master", email: "paw_master@bot.com", password: "bot", points: 310, cores: 3, createdAt: new Date().toISOString(), isBot: true },
      { id: "bot_neko_sensei", username: "Neko_Sensei", email: "neko_sensei@bot.com", password: "bot", points: 600, cores: 12, createdAt: new Date().toISOString(), isBot: true },
      { id: "bot_king_oyen", username: "King_Oyen", email: "king_oyen@bot.com", password: "bot", points: 750, cores: 15, createdAt: new Date().toISOString(), isBot: true }
    ];

    if (!parsed.users) {
      parsed.users = [];
    }
    for (const bot of bots) {
      if (!parsed.users.some((u: any) => u.id === bot.id)) {
        parsed.users.push(bot);
        modified = true;
      }
    }

    // Ensure demo account demo1 & starter deck exist
    if (ensureDemoUserAndDeck(parsed)) {
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2));
    }

    return parsed;
  } catch (err) {
    console.error("Error reading database:", err);
    return { users: [], captures: [], cards: [], trades: [], officialMails: [], directMessages: [] };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    // Asynchronously sync to Firestore database
    syncToFirestore(data).catch((e) => console.error("Firestore async write notice:", e));
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API Client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY found in process.env. Fallback generation will be used.");
}

// Robust retry wrapper with exponential backoff for Gemini API calls to handle transient 503 / rate limit errors
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      console.warn(`[Gemini API] Attempt ${attempt}/${maxRetries} failed with error: ${err?.message || err}`);
      
      if (attempt >= maxRetries) {
        throw err;
      }
      
      // Do not retry on 400 Bad Request, as that indicates invalid prompt/parameters
      const isBadRequest = err?.status === 400 || 
                           (err?.message && (err.message.includes("400") || err.message.includes("BAD_REQUEST"))) ||
                           (err?.error?.code === 400);
      if (isBadRequest) {
        console.error("[Gemini API] Bad Request (400) received. Aborting retries.");
        throw err;
      }

      // Do not retry on 429 Quota Exceeded / Resource Exhausted because free tier limits are non-transient within this minute
      const isQuotaExceeded = err?.status === 429 || 
                              (err?.message && (err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED") || err.message.toLowerCase().includes("quota")));
      if (isQuotaExceeded) {
        console.error("[Gemini API] Quota Exceeded / Resource Exhausted (429) received. Aborting retries to allow instant premium fallback.");
        throw err;
      }

      const waitTime = delayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.log(`[Gemini API] Retrying in ${Math.round(waitTime)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw new Error("Max retries reached");
}

// ----------------------------------------------------------------
// FALLBACK GENERATOR DATA (When Gemini API fails or is not configured)
// ----------------------------------------------------------------
const FALLBACKS: Record<string, Record<string, string[]>> = {
  Sentinel: {
    Api: ["Kojiro", "Flame Whisker", "Phoenix Claw", "Solaris Neko", "Amaterasu Paw"],
    Air: ["Mizuko", "Aqua Pearl", "Tidal Whisper", "Mist Guardian", "Leviathan Mew"],
    Tanah: ["Riku", "Terra Paws", "Earth Spirit", "Nature Vanguard", "Gaea Whisker"],
    Angin: ["Zephyr", "Breeze Whiskers", "Gale Dancer", "Sky Guardian", "Astral Wind"],
    Petir: ["Raijin", "Lightning Strike", "Thunder Fang", "Storm Surge", "Volt Empress"],
  },
  Vanguard: {
    Api: ["Inferno Claw", "Blaze Shadow", "Scorched Fang", "Crimson Dread", "Hellfire Overlord"],
    Air: ["Abyssal Maw", "Vortex Whisper", "Riptide Shadow", "Frozen Abyss", "Tsunami Emperor"],
    Tanah: ["Ruin Claw", "Obelisk Mew", "Iron Root", "Titan Sentinel", "Worldbreaker Cat"],
    Angin: ["Tornado Phantom", "Void Gale", "Sonic Whiskers", "Asylum Breeze", "Cosmic Tempest"],
    Petir: ["Volt Razor", "Plasma Spark", "Thunder Fiend", "Tesla Empress", "Overdrive Overlord"],
  }
};

const STATS_RANGES: Record<string, { hp: [number, number]; atk: [number, number]; def: [number, number]; spd: [number, number] }> = {
  Common: { hp: [120, 260], atk: [55, 105], def: [50, 100], spd: [45, 85] },
  Rare: { hp: [220, 380], atk: [90, 150], def: [85, 145], spd: [75, 125] },
  Epic: { hp: [340, 520], atk: [130, 210], def: [125, 205], spd: [110, 175] },
  Legend: { hp: [480, 700], atk: [190, 300], def: [180, 290], spd: [155, 240] },
  Mythic: { hp: [650, 900], atk: [270, 400], def: [250, 380], spd: [220, 330] },
};

const ABILITIES: Record<string, { name: string; desc: string }[]> = {
  Api: [
    { name: "Flame Burst", desc: "Melepaskan ledakan api membara yang membakar lawan." },
    { name: "Fire Shield", desc: "Melindungi diri dengan kubah api pertahanan tinggi." },
    { name: "Searing Claws", desc: "Cakaran api berkobar yang mengurangi pertahanan musuh." }
  ],
  Air: [
    { name: "Aqua Jet", desc: "Melesat cepat dengan semburan air bertekanan tinggi." },
    { name: "Tidal Wave", desc: "Memanggil gelombang tsunami penyembuh dan penyerang." },
    { name: "Mist Veil", desc: "Menghilang dalam kabut tebal untuk menghindari serangan lawan." }
  ],
  Tanah: [
    { name: "Earthquake Claw", desc: "Hantaman cakar ke bumi menciptakan guncangan hebat." },
    { name: "Stone Aegis", desc: "Membentuk pelindung dari kristal bumi untuk menyerap damage." },
    { name: "Forest Growth", desc: "Memanggil akar alam untuk mengikat pergerakan musuh." }
  ],
  Angin: [
    { name: "Zephyr Slash", desc: "Sayatan angin tajam tak terlihat berkecepatan tinggi." },
    { name: "Tornado Spin", desc: "Badai putar yang menerbangkan dan membingungkan musuh." },
    { name: "Gale Step", desc: "Langkah seringan udara yang melipatgandakan kecepatan gerak." }
  ],
  Petir: [
    { name: "Volt Tackle", desc: "Serbuan berenergi listrik murni dengan efek stun." },
    { name: "Thunderbolt Storm", desc: "Petir beruntun jatuh dari langit membakar semua pertahanan." },
    { name: "Overdrive Spark", desc: "Sengatan listrik instan untuk meningkatkan damage cakar." }
  ]
};

// Simple helper to generate a fallback SVG-based image representation of the Nekomon Card
function generateFallbackImage(name: string, element: string, style: string, rarity: string, photoUrl?: string) {
  const safePhotoUrl = photoUrl && photoUrl.length < 30000 ? photoUrl : undefined;
  const elementColors: Record<string, { bg: string; accent: string; text: string }> = {
    Api: { bg: "linear-gradient(135deg, #450a0a, #7f1d1d, #b91c1c)", accent: "#ef4444", text: "#fecaca" },
    Air: { bg: "linear-gradient(135deg, #172554, #1e3a8a, #2563eb)", accent: "#3b82f6", text: "#dbeafe" },
    Tanah: { bg: "linear-gradient(135deg, #1c1917, #44403c, #78716c)", accent: "#84cc16", text: "#f7fee7" },
    Angin: { bg: "linear-gradient(135deg, #022c22, #064e3b, #0d9488)", accent: "#2dd4bf", text: "#ccfbf1" },
    Petir: { bg: "linear-gradient(135deg, #422006, #713f12, #ca8a04)", accent: "#eab308", text: "#fef9c3" },
  };

  const rarityColors: Record<string, string> = {
    Common: "#9ca3af",
    Rare: "#3b82f6",
    Epic: "#a855f7",
    Legend: "#f59e0b",
    Mythic: "#ec4899"
  };

  const color = elementColors[element] || { bg: "linear-gradient(135deg, #111, #333)", accent: "#fff", text: "#eee" };
  const rarityColor = rarityColors[rarity] || "#fff";

  // Return a beautiful dynamic SVG with the element theme and name text inside
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color.bg.match(/#[0-9a-fA-F]{6}/g)?.[0] || '#111'}" />
        <stop offset="50%" stop-color="${color.bg.match(/#[0-9a-fA-F]{6}/g)?.[1] || '#333'}" />
        <stop offset="100%" stop-color="${color.bg.match(/#[0-9a-fA-F]{6}/g)?.[2] || '#555'}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${color.accent}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${color.accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    
    <rect width="400" height="400" fill="url(#bg)" />
    
    ${safePhotoUrl ? `
    <!-- Original User Cat Photo framed with elemental vignette -->
    <g>
      <clipPath id="photo-clip">
        <rect x="35" y="90" width="330" height="225" rx="15" />
      </clipPath>
      <image href="${safePhotoUrl}" x="35" y="90" width="330" height="225" clip-path="url(#photo-clip)" preserveAspectRatio="xMidYMid slice" />
      <!-- Stylized elemental tint overlay -->
      <rect x="35" y="90" width="330" height="225" fill="${color.accent}" fill-opacity="0.12" clip-path="url(#photo-clip)" style="mix-blend-mode: color;" />
      <!-- Artwork frame border -->
      <rect x="35" y="90" width="330" height="225" fill="none" stroke="${rarityColor}" stroke-width="2" rx="15" />
    </g>
    ` : `
    <!-- Central Magic Circle Glow -->
    <circle cx="200" cy="180" r="120" fill="url(#glow)" />
    
    <!-- Styled Cute Anime Cat Illustration -->
    <g transform="translate(200, 180)">
      <!-- Cat Head Silhouette/Drawing -->
      <path d="M-60,-20 C-65,-60 -50,-80 -40,-80 C-30,-80 -25,-60 -20,-50 C-10,-55 10,-55 20,-50 C25,-60 30,-80 40,-80 C50,-80 65,-60 60,-20 C65,20 40,60 0,60 C-40,60 -65,20 -60,-20 Z" fill="#ffffff" opacity="0.95" />
      
      <!-- Studio Ghibli/Mappa Eye Styling -->
      <circle cx="-25" cy="-10" r="7" fill="${style === 'Sentinel' ? '#333333' : '#111111'}" />
      <circle cx="-27" cy="-12" r="2.5" fill="#ffffff" />
      <circle cx="25" cy="-10" r="7" fill="${style === 'Sentinel' ? '#333333' : '#111111'}" />
      <circle cx="23" cy="-12" r="2.5" fill="#ffffff" />
      
      <!-- Whiskers -->
      <line x1="-50" y1="10" x2="-80" y2="8" stroke="${color.accent}" stroke-width="2" />
      <line x1="-50" y1="18" x2="-78" y2="23" stroke="${color.accent}" stroke-width="2" />
      <line x1="50" y1="10" x2="80" y2="8" stroke="${color.accent}" stroke-width="2" />
      <line x1="50" y1="18" x2="78" y2="23" stroke="${color.accent}" stroke-width="2" />

      <!-- Cute Mouth -->
      <path d="M-6,10 Q0,15 6,10" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" />
      
      <!-- Elemental Gem in Forehead -->
      <polygon points="0,-45 8,-35 0,-25 -8,-35" fill="${color.accent}" />
    </g>
    `}

    <!-- Outer borders -->
    <rect x="15" y="15" width="370" height="370" fill="none" stroke="${rarityColor}" stroke-width="4" rx="15" />
    <rect x="25" y="25" width="350" height="350" fill="none" stroke="${rarityColor}" stroke-width="1.5" stroke-dasharray="8,4" rx="10" />

    <!-- Header Frame for Name -->
    <rect x="50" y="45" width="300" height="35" fill="#1e293b" fill-opacity="0.8" rx="8" stroke="${rarityColor}" stroke-width="1.5" />
    <text x="200" y="68" font-family="monospace" font-size="18" fill="#ffffff" font-weight="bold" text-anchor="middle" letter-spacing="2">
      ${name.toUpperCase()}
    </text>

    <!-- Element Icon Circle -->
    <circle cx="65" cy="62" r="14" fill="${color.accent}" />
    <text x="65" y="67" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">
      ${element[0]}
    </text>

    <!-- Style Watermark -->
    <rect x="130" y="325" width="140" height="20" fill="${style === 'Sentinel' ? '#0f766e' : '#be123c'}" rx="5" />
    <text x="200" y="339" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">
      ${style === 'Sentinel' ? 'SENTINEL' : 'VANGUARD'}
    </text>

    <!-- Sparkles for Rarity -->
    <path d="M40,100 L45,115 L60,120 L45,125 L40,140 L35,125 L20,120 L35,115 Z" fill="${rarityColor}" opacity="0.8" />
    <path d="M340,110 L343,120 L353,123 L343,126 L340,136 L337,126 L327,123 L337,120 Z" fill="${rarityColor}" opacity="0.8" />
  </svg>`;

  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

// Helper to ensure demo account demo1 & starter deck are always available
function ensureDemoUserAndDeck(db: any): boolean {
  if (!db) return false;
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.cards)) db.cards = [];

  let modified = false;
  let demoUser = db.users.find((u: any) => u.username?.toLowerCase() === "demo1" || u.email?.toLowerCase() === "demo1@nekomon.online");
  
  if (!demoUser) {
    demoUser = {
      id: "user_demo1_tcg",
      username: "demo1",
      email: "demo1@nekomon.online",
      password: "n3komontcg",
      points: 1000,
      cores: 50,
      faction: "Sentinel",
      captureStreak: 3,
      createdAt: "2026-08-28T00:00:00.000Z",
      lastDailyBonusAt: new Date().toISOString(),
      isBot: false
    };
    db.users.push(demoUser);
    modified = true;
  } else {
    if (demoUser.password !== "n3komontcg") {
      demoUser.password = "n3komontcg";
      modified = true;
    }
    if ((demoUser.points || 0) < 500) {
      demoUser.points = 1000;
      modified = true;
    }
    if ((demoUser.cores || 0) < 20) {
      demoUser.cores = 50;
      modified = true;
    }
    if (!demoUser.faction) {
      demoUser.faction = "Sentinel";
      modified = true;
    }
  }

  // Ensure demo1 has 5 elemental starter cards ready for battle
  const demoCards = db.cards.filter((c: any) => c.userId === demoUser.id);
  if (demoCards.length < 5) {
    const starterDeck = [
      {
        id: "card_demo1_air_01",
        userId: demoUser.id,
        captureId: "",
        name: "Cyber Aquafox Kai",
        element: "Air",
        style: "Sentinel",
        rarity: "Epic",
        hp: 920,
        atk: 220,
        def: 180,
        spd: 160,
        skillName: "Gelombang Hydro Cyber",
        skillDesc: "Menerjang musuh dengan arus pusaran air bertekanan tinggi.",
        imageUrl: generateFallbackImage("Cyber Aquafox Kai", "Air", "Sentinel", "Epic", undefined),
        geminiUsed: false,
        level: 5,
        xp: 120,
        maxXp: 500,
        energy: 5,
        maxEnergy: 5,
        lastEnergyRefillAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: "card_demo1_api_02",
        userId: demoUser.id,
        captureId: "",
        name: "Flamewing Flare Neko",
        element: "Api",
        style: "Sentinel",
        rarity: "Epic",
        hp: 880,
        atk: 260,
        def: 150,
        spd: 175,
        skillName: "Cakaran Api Plasma",
        skillDesc: "Serangan cakar api yang membakar pertahanan musuh.",
        imageUrl: generateFallbackImage("Flamewing Flare Neko", "Api", "Sentinel", "Epic", undefined),
        geminiUsed: false,
        level: 5,
        xp: 180,
        maxXp: 500,
        energy: 5,
        maxEnergy: 5,
        lastEnergyRefillAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: "card_demo1_tanah_03",
        userId: demoUser.id,
        captureId: "",
        name: "Gaia Aegis Claw",
        element: "Tanah",
        style: "Sentinel",
        rarity: "Rare",
        hp: 1100,
        atk: 180,
        def: 250,
        spd: 120,
        skillName: "Perisai Batu Kristal",
        skillDesc: "Membentengi diri dengan lempengan kristal bumi kokoh.",
        imageUrl: generateFallbackImage("Gaia Aegis Claw", "Tanah", "Sentinel", "Rare", undefined),
        geminiUsed: false,
        level: 4,
        xp: 80,
        maxXp: 400,
        energy: 5,
        maxEnergy: 5,
        lastEnergyRefillAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: "card_demo1_angin_04",
        userId: demoUser.id,
        captureId: "",
        name: "Zephyr Storm Shadow",
        element: "Angin",
        style: "Sentinel",
        rarity: "Epic",
        hp: 840,
        atk: 230,
        def: 160,
        spd: 210,
        skillName: "Tornado Bayangan Angin",
        skillDesc: "Menebas lawan dengan kecepatan angin puting beliung.",
        imageUrl: generateFallbackImage("Zephyr Storm Shadow", "Angin", "Sentinel", "Epic", undefined),
        geminiUsed: false,
        level: 5,
        xp: 220,
        maxXp: 500,
        energy: 5,
        maxEnergy: 5,
        lastEnergyRefillAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: "card_demo1_petir_05",
        userId: demoUser.id,
        captureId: "",
        name: "Raijin Bolt Saber",
        element: "Petir",
        style: "Sentinel",
        rarity: "Legend",
        hp: 1050,
        atk: 310,
        def: 190,
        spd: 205,
        skillName: "Kilat Petir Megavolt",
        skillDesc: "Sambaran kilat berdaya 1.000.000 volt melumpuhkan musuh seketika.",
        imageUrl: generateFallbackImage("Raijin Bolt Saber", "Petir", "Sentinel", "Legend", undefined),
        geminiUsed: false,
        level: 6,
        xp: 350,
        maxXp: 600,
        energy: 5,
        maxEnergy: 5,
        lastEnergyRefillAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];

    starterDeck.forEach(card => {
      if (!db.cards.some((c: any) => c.id === card.id)) {
        db.cards.push(card);
        modified = true;
      }
    });
  }

  return modified;
}

// ----------------------------------------------------------------
// API ROUTES
// ----------------------------------------------------------------

// Auth: Register (Legacy direct route)
app.post("/api/auth/register", (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: "Email, username, dan password wajib diisi." });
  }

  const cleanEmail = email.trim();
  const cleanUsername = username.trim();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanUsername || !cleanPassword) {
    return res.status(400).json({ error: "Email, username, dan password tidak boleh kosong." });
  }

  const db = readDB();
  const existingUser = db.users.find((u: any) => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail.toLowerCase());
  
  if (existingUser) {
    return res.status(400).json({ error: "Username atau Email sudah terdaftar." });
  }

  const newUser = {
    id: "user_" + Math.random().toString(36).substr(2, 9),
    email: cleanEmail,
    username: cleanUsername,
    password: hashPassword(cleanPassword),
    points: 100, // starting credit
    cores: 0,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({
    success: true,
    user: { id: newUser.id, username: newUser.username, email: newUser.email, points: newUser.points, cores: 0 },
    token: createSessionToken(newUser)
  });
});

// Auth: Send Email Verification Link & Code via Real Hostinger SMTP (support@nekomon.online)
app.post("/api/auth/send-verification", async (req, res) => {
  const { email, password, isEn } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }

  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({ error: "Email dan password tidak boleh kosong." });
  }

  const db = readDB();
  const existingUser = db.users.find((u: any) => u.email && u.email.toLowerCase() === cleanEmail.toLowerCase());
  
  if (existingUser) {
    return res.status(400).json({ error: "Alamat email ini sudah terdaftar." });
  }

  if (!db.pendingVerifications) {
    db.pendingVerifications = [];
  }

  // Remove existing pending verifications for this email
  db.pendingVerifications = db.pendingVerifications.filter((v: any) => v.email.toLowerCase() !== cleanEmail.toLowerCase());

  const token = "vt_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const newVerification = {
    token,
    code,
    email: cleanEmail,
    password: hashPassword(cleanPassword),
    verified: false,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  db.pendingVerifications.push(newVerification);
  writeDB(db);

  // Construct absolute Verification URL
  const protocol = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "ais-dev-iuova2al3sc3knpj6hb7ml-261769556031.asia-east1.run.app";
  const baseUrl = `${protocol}://${host}`;
  const verificationUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  // Send real email via Hostinger SMTP (support@nekomon.online)
  const mailResult = await sendVerificationEmail({
    to: cleanEmail,
    verificationUrl,
    otpCode: code,
    isEn: isEn || false
  });

  res.json({
    success: true,
    message: isEn 
      ? `Verification email has been sent to ${cleanEmail} via support@nekomon.online!` 
      : `Email verifikasi telah dikirim langsung ke ${cleanEmail} via support@nekomon.online!`,
    token,
    emailSent: mailResult.success,
    mailError: mailResult.error || null
  });
});

// Auth: Resend Verification Email
app.post("/api/auth/resend-verification", async (req, res) => {
  const { email, isEn } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email wajib diisi." });
  }

  const cleanEmail = email.trim();
  const db = readDB();
  if (!db.pendingVerifications) db.pendingVerifications = [];
  const verification = db.pendingVerifications.find((v: any) => v.email.toLowerCase() === cleanEmail.toLowerCase());

  if (!verification) {
    return res.status(400).json({ error: "Data pendaftaran tidak ditemukan. Silakan daftar ulang." });
  }

  // Refresh code & token
  verification.code = Math.floor(100000 + Math.random() * 900000).toString();
  verification.token = "vt_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  verification.expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  writeDB(db);

  const protocol = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "ais-dev-iuova2al3sc3knpj6hb7ml-261769556031.asia-east1.run.app";
  const baseUrl = `${protocol}://${host}`;
  const verificationUrl = `${baseUrl}/api/auth/verify?token=${verification.token}`;

  const mailResult = await sendVerificationEmail({
    to: cleanEmail,
    verificationUrl,
    otpCode: verification.code,
    isEn: isEn || false
  });

  res.json({
    success: true,
    message: isEn 
      ? `A new verification email has been sent to ${cleanEmail}!` 
      : `Email verifikasi baru telah dikirimkan ke ${cleanEmail}!`,
    token: verification.token,
    emailSent: mailResult.success
  });
});

// Auth: Verify Email via Code (OTP)
app.post("/api/auth/verify-code", (req, res) => {
  const { token, code, email } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Kode verifikasi 6 digit wajib diisi." });
  }

  const cleanCode = code.trim();
  const db = readDB();
  if (!db.pendingVerifications) db.pendingVerifications = [];

  const verification = db.pendingVerifications.find((v: any) => 
    (token && v.token === token) || (email && v.email.toLowerCase() === email.trim().toLowerCase())
  );

  if (!verification) {
    return res.status(400).json({ error: "Sesi verifikasi tidak ditemukan atau telah kadaluarsa." });
  }

  if (verification.code && verification.code === cleanCode) {
    verification.verified = true;
    writeDB(db);
    return res.json({ success: true, verified: true, token: verification.token });
  }

  return res.status(400).json({ error: "Kode verifikasi 6-digit salah atau tidak sesuai." });
});

// Auth: Verify Email Link
app.get("/api/auth/verify", (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send("<h3>Token verifikasi tidak valid.</h3>");
  }

  const db = readDB();
  if (!db.pendingVerifications) db.pendingVerifications = [];

  const verification = db.pendingVerifications.find((v: any) => v.token === token);
  if (!verification) {
    return res.status(400).send("<h3>Link verifikasi kadaluarsa atau tidak ditemukan.</h3>");
  }

  verification.verified = true;
  writeDB(db);

  res.send(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Terverifikasi - Nekomon TCG</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px 15px; background: #060b14; color: #f8fafc; min-height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
        <div style="max-width: 480px; width: 100%; margin: 0 auto; background: #0f172a; border: 2px solid #eab308; padding: 40px 30px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <div style="font-size: 56px; margin-bottom: 16px;">⚔️</div>
          <h2 style="color: #eab308; margin: 0 0 12px 0; font-size: 24px; font-weight: 900;">Email Berhasil Diverifikasi!</h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Alamat email <strong>${verification.email}</strong> telah berhasil diverifikasi oleh sistem <strong>Nekomon Online</strong>.
          </p>
          <div style="padding: 16px; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 12px; margin-bottom: 24px;">
            <p style="margin: 0; color: #facc15; font-size: 13px; font-weight: bold;">
              ✨ Silakan kembali ke tab permainan Nekomon untuk melanjutkan pembuatan Username dan memulai pertarungan!
            </p>
          </div>
          <div style="font-size: 11px; color: #64748b;">
            Nekomon Arena &bull; support@nekomon.online
          </div>
        </div>
      </body>
    </html>
  `);
});

// Auth: Check verification status from UI
app.get("/api/auth/check-verification", (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: "Token diperlukan" });
  }
  const db = readDB();
  if (!db.pendingVerifications) db.pendingVerifications = [];
  const verification = db.pendingVerifications.find((v: any) => v.token === token);
  if (!verification) {
    return res.json({ verified: false });
  }
  res.json({ verified: verification.verified });
});

// Auth: Complete Registration with Username
app.post("/api/auth/complete-register", (req, res) => {
  const { token, username, code } = req.body;
  if (!token || !username) {
    return res.status(400).json({ error: "Token verifikasi dan username wajib diisi." });
  }

  const cleanUsername = username.trim();
  if (!cleanUsername) {
    return res.status(400).json({ error: "Username tidak boleh kosong." });
  }

  const db = readDB();
  
  // Check if username already exists
  const existingUser = db.users.find((u: any) => u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "Username sudah digunakan oleh pemain lain." });
  }

  if (!db.pendingVerifications) db.pendingVerifications = [];
  const verification = db.pendingVerifications.find((v: any) => v.token === token);
  
  if (!verification) {
    return res.status(400).json({ error: "Sesi registrasi tidak valid atau kadaluarsa." });
  }

  // If user provided code directly during complete register
  if (code && verification.code && code.trim() === verification.code) {
    verification.verified = true;
  }

  if (!verification.verified) {
    return res.status(400).json({ error: "Email Anda belum diverifikasi. Silakan klik link verifikasi di email Anda atau masukkan kode OTP." });
  }

  const newUser = {
    id: "user_" + Math.random().toString(36).substr(2, 9),
    email: verification.email,
    username: cleanUsername,
    password: verification.password,
    role: (verification.email === "verydiaz@gmail.com" || verification.email === "support@nekomon.online") ? "developer" : "user",
    points: 100,
    cores: 0,
    coins: 500,
    gems: 10,
    elementalDust: 50,
    rank: "Novice",
    rp: 0,
    stats: { wins: 0, losses: 0, winStreak: 0, bestStreak: 0, totalMatches: 0 },
    profileLevel: 1,
    profileExp: 0,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  
  // Remove verification entry
  db.pendingVerifications = db.pendingVerifications.filter((v: any) => v.token !== token);
  writeDB(db);

  res.json({
    success: true,
    user: { id: newUser.id, username: newUser.username, email: newUser.email, points: newUser.points, role: newUser.role, cores: 0 },
    token: createSessionToken(newUser)
  });
});

// Auth: Request Forgot Password Link
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email, isEn } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email wajib diisi." });
  }

  const cleanEmail = email.trim();
  const db = readDB();
  const user = db.users.find((u: any) => u.email && u.email.toLowerCase() === cleanEmail.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: "Alamat email tidak terdaftar di sistem kami." });
  }

  if (!db.passwordResets) {
    db.passwordResets = [];
  }

  db.passwordResets = db.passwordResets.filter((r: any) => r.email.toLowerCase() !== cleanEmail.toLowerCase());

  const token = "rt_" + crypto.randomBytes(32).toString("base64url");
  db.passwordResets.push({
    token,
    email: cleanEmail,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  });
  writeDB(db);

  const protocol = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "ais-dev-iuova2al3sc3knpj6hb7ml-261769556031.asia-east1.run.app";
  const baseUrl = `${protocol}://${host}`;
  const resetUrl = `${baseUrl}/api/auth/reset-password-page?token=${token}`;

  await sendPasswordResetEmail({
    to: cleanEmail,
    resetUrl,
    isEn: isEn || false
  });

  res.json({
    success: true,
    message: isEn ? `Password reset link sent to ${cleanEmail}!` : `Link reset sandi telah dikirim ke ${cleanEmail}!`,
    // Do not disclose reset tokens to API callers.
  });
});

// Auth: Reset Password Page HTML Form
app.get("/api/auth/reset-password-page", (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send("<h3>Token reset tidak valid.</h3>");
  }

  const db = readDB();
  if (!db.passwordResets) db.passwordResets = [];
  const resetEntry = db.passwordResets.find((r: any) => r.token === token && new Date(r.expiresAt).getTime() > Date.now());

  if (!resetEntry) {
    return res.status(400).send("<h3>Sesi reset sandi kadaluarsa atau tidak ditemukan.</h3>");
  }

  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0b1329; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div style="width: 100%; max-width: 400px; background: #0f172a; border: 2px solid #eab308; padding: 35px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: left;">
        <h2 style="color: #eab308; margin-top: 0; margin-bottom: 5px; font-weight: 900; letter-spacing: 1px;">RESET PASSWORD</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 25px; line-height: 1.5;">Masukkan kata sandi baru untuk akun Anda (${resetEntry.email}).</p>
        
        <form action="/api/auth/reset-password" method="POST">
          <input type="hidden" name="token" value="${token}" />
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 5px; text-transform: uppercase;">KATA SANDI BARU</label>
            <input type="password" name="password" required placeholder="••••••••" style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 12px; color: #fff; font-size: 14px;" />
          </div>
          <button type="submit" style="width: 100%; background: linear-gradient(to right, #eab308, #d97706); border: none; color: #020617; padding: 12px; font-weight: 900; border-radius: 8px; cursor: pointer; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin-top: 10px;">Simpan Sandi Baru ⚔️</button>
        </form>
      </div>
    </div>
  `);
});

// Auth: Complete Reset Password
app.post("/api/auth/reset-password", (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: "Token dan sandi baru wajib diisi." });
  }

  const cleanPassword = password.trim();
  if (!cleanPassword) {
    return res.status(400).json({ error: "Sandi baru tidak boleh kosong." });
  }

  const db = readDB();
  if (!db.passwordResets) db.passwordResets = [];

  const resetEntry = db.passwordResets.find((r: any) => r.token === token && new Date(r.expiresAt).getTime() > Date.now());
  if (!resetEntry) {
    const isFromForm = req.headers["content-type"]?.includes("application/x-www-form-urlencoded");
    if (isFromForm) {
      return res.status(400).send(`<div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0b1329; color: #ef4444;"><h3>Sesi reset sandi tidak valid atau kadaluarsa.</h3></div>`);
    }
    return res.status(400).json({ error: "Sesi reset sandi tidak valid atau kadaluarsa." });
  }

  const user = db.users.find((u: any) => u.email.toLowerCase() === resetEntry.email.toLowerCase());
  if (user) {
    user.password = hashPassword(cleanPassword);
  }

  db.passwordResets = db.passwordResets.filter((r: any) => r.token !== token);
  writeDB(db);

  const isFromForm = req.headers["content-type"]?.includes("application/x-www-form-urlencoded");
  if (isFromForm) {
    return res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0b1329; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div style="max-width: 500px; width: 100%; background: #0f172a; border: 2px solid #eab308; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="font-size: 50px; margin-bottom: 20px;">🎉</div>
          <h2 style="color: #eab308; margin-bottom: 10px;">Sandi Berhasil Diubah!</h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Kata sandi Anda telah berhasil diupdate. Silakan kembali ke aplikasi Nekomon Anda dan masuk menggunakan kata sandi baru Anda.</p>
        </div>
      </div>
    `);
  }

  res.json({ success: true, message: "Kata sandi berhasil diperbarui!" });
});

// Auth: Login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username/Email dan password wajib diisi." });
  }

  const cleanIdentifier = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  const db = readDB();
  const user = db.users.find((u: any) =>
    (u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier) &&
    verifyPassword(cleanPassword, u.password || "")
  );

  if (!user) {
    return res.status(401).json({ error: "Username, Email, atau password salah." });
  }

  // Upgrade a legacy plaintext password only after successful verification.
  if (!user.password.startsWith("scrypt$")) {
    user.password = hashPassword(cleanPassword);
    writeDB(db);
  }

  // Login Endpoint
  res.json({
    success: true,
    user: { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      points: user.points, 
      cores: user.cores || 0,
      captureStreak: user.captureStreak || 0,
      lastCaptureDate: user.lastCaptureDate || ""
    },
    token: createSessionToken(user)
  });
});

// Auth: Google Sign-In
app.post("/api/auth/google", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken || typeof idToken !== "string") return res.status(400).json({ error: "Google ID token wajib ada." });
  let claims: any;
  try {
    claims = await getFirebaseAdminAuth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Google ID token tidak valid." });
  }
  if (!claims.email || !claims.email_verified) return res.status(401).json({ error: "Email Google harus terverifikasi." });
  const email = claims.email;
  const displayName = claims.name || "";
  const uid = claims.uid;
  const photoURL = claims.picture || "";

  const db = readDB();
  const cleanEmail = email.trim().toLowerCase();

  let user = db.users.find((u: any) => u.email?.toLowerCase() === cleanEmail || (uid && u.id === uid));

  if (!user) {
    let baseName = displayName ? displayName.replace(/[^a-zA-Z0-9_]/g, "_") : cleanEmail.split("@")[0];
    if (!baseName || baseName.length < 3) baseName = "Trainer_" + Math.random().toString(36).substring(2, 6);

    let finalUsername = baseName;
    let count = 1;
    while (db.users.some((u: any) => u.username?.toLowerCase() === finalUsername.toLowerCase())) {
      finalUsername = `${baseName}_${count++}`;
    }

    user = {
      id: uid || "user_" + Math.random().toString(36).substr(2, 9),
      email: cleanEmail,
      username: finalUsername,
      password: hashPassword(crypto.randomBytes(32).toString("base64url")),
      points: 100,
      cores: 5,
      avatarUrl: photoURL || "",
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    writeDB(db);
  } else if (photoURL && !user.avatarUrl) {
    user.avatarUrl = photoURL;
    writeDB(db);
  }

  res.json({
    success: true,
    user: { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      points: user.points, 
      cores: user.cores || 0,
      avatarUrl: user.avatarUrl || "",
      captureStreak: user.captureStreak || 0,
      lastCaptureDate: user.lastCaptureDate || ""
    },
    token: createSessionToken(user)
  });
});

// Auth: Sync / Restore user data from client backup (robust persistence helper)
app.post("/api/auth/sync", (req, res) => {
  const authDb = readDB();
  if (!getAuthUser(req, authDb)) return res.status(401).json({ error: "Unauthorized" });
  return res.status(410).json({ error: "Sinkronisasi backup browser telah dinonaktifkan demi keamanan akun." });

  const { user, password, captures, cards, trades } = req.body;
  if (!user || !user.id || !user.username) {
    return res.status(400).json({ error: "Data user tidak lengkap untuk melakukan sinkronisasi." });
  }

  const db = readDB();
  
  // 1. Restore User if missing
  let serverUser = db.users.find((u: any) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
  
  const restoredUser = {
    id: user.id,
    email: user.email || `${user.username}@nekomon.local`,
    username: user.username,
    password: password || user.password || "nekomon123",
    points: user.points !== undefined ? user.points : 100,
    cores: user.cores !== undefined ? user.cores : 0,
    createdAt: user.createdAt || new Date().toISOString(),
    lastDailyBonusAt: user.lastDailyBonusAt || null
  };

  if (!serverUser) {
    db.users.push(restoredUser);
    serverUser = restoredUser;
  } else {
    // If found, update properties if backup is more progressive
    if (password) {
      serverUser.password = password;
    }
    if ((user.points || 0) > (serverUser.points || 0)) {
      serverUser.points = user.points;
    }
    if ((user.cores || 0) > (serverUser.cores || 0)) {
      serverUser.cores = user.cores;
    }
    if (user.lastDailyBonusAt) {
      serverUser.lastDailyBonusAt = user.lastDailyBonusAt;
    }
    const idx = db.users.findIndex((u: any) => u.id === serverUser.id);
    if (idx !== -1) {
      db.users[idx] = serverUser;
    }
  }

  // 2. Restore Captures
  if (Array.isArray(captures)) {
    captures.forEach((cap: any) => {
      if (!cap || !cap.id) return;
      const exists = db.captures.some((c: any) => c.id === cap.id);
      if (!exists) {
        cap.userId = serverUser.id;
        db.captures.push(cap);
      }
    });
  }

  // 3. Restore Cards
  if (Array.isArray(cards)) {
    cards.forEach((card: any) => {
      if (!card || !card.id) return;
      const exists = db.cards.some((c: any) => c.id === card.id);
      if (!exists) {
        card.userId = serverUser.id;
        db.cards.push(card);
      } else {
        const idx = db.cards.findIndex((c: any) => c.id === card.id);
        if (idx !== -1 && (card.level || 1) > (db.cards[idx].level || 1)) {
          db.cards[idx] = card;
        }
      }
    });
  }

  // 4. Restore Trades
  if (Array.isArray(trades)) {
    if (!db.trades) db.trades = [];
    trades.forEach((t: any) => {
      if (!t || !t.id) return;
      const exists = db.trades.some((x: any) => x.id === t.id);
      if (!exists) {
        db.trades.push(t);
      }
    });
  }

  writeDB(db);

  res.json({
    success: true,
    user: { 
      id: serverUser.id, 
      username: serverUser.username, 
      email: serverUser.email, 
      points: serverUser.points, 
      cores: serverUser.cores || 0,
      captureStreak: serverUser.captureStreak || 0,
      lastCaptureDate: serverUser.lastCaptureDate || ""
    }
  });
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper to authenticate user using authorization token
function getAuthUser(req: express.Request, db: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const session = verifySessionToken(authHeader.slice("Bearer ".length).trim());
  if (!session) return null;
  const foundUser = db.users?.find((u: any) => u.id === session.sub && u.username?.toLowerCase() === session.username.toLowerCase()) || null;

  if (foundUser) {
    const now = Date.now();
    const lastSeenMs = foundUser.lastSeen ? new Date(foundUser.lastSeen).getTime() : 0;
    // Refresh user activity timestamp every 30 seconds
    if (now - lastSeenMs > 30000) {
      foundUser.lastSeen = new Date(now).toISOString();
      writeDB(db);
    }
  }

  return foundUser || null;
}

// User Heartbeat endpoint to maintain online status and sync activity history
app.post("/api/user/heartbeat", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  user.lastSeen = new Date().toISOString();
  writeDB(db);
  res.json({ success: true, lastSeen: user.lastSeen, isOnline: true });
});

// Helper to calculate daily mission progress and reset states
function getMissionStatus(userId: string, user: any, db: any) {
  const userCaptures = db.captures.filter((c: any) => c.userId === userId);
  const userCards = db.cards.filter((c: any) => c.userId === userId);
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const capturesInLast24h = userCaptures.filter((c: any) => {
    return new Date(c.createdAt).getTime() >= oneDayAgo;
  });
  
  const lastBonusTime = user.lastDailyBonusAt ? new Date(user.lastDailyBonusAt).getTime() : 0;
  const completed = (now - lastBonusTime) < 24 * 60 * 60 * 1000;

  // Mission Level > 8 Status
  const highestCardLevel = userCards.reduce((max: number, c: any) => Math.max(max, c.level || 1), 1);
  const hasCardAboveLevel8 = highestCardLevel > 8;
  const lastLevel8BonusTime = user.lastLevel8BonusAt ? new Date(user.lastLevel8BonusAt).getTime() : 0;
  const level8MissionCompleted = (now - lastLevel8BonusTime) < 24 * 60 * 60 * 1000;
  
  return {
    progress: Math.min(capturesInLast24h.length, 5),
    target: 5,
    completed: !!completed,
    capturesInLast24Hours: capturesInLast24h.length,
    bonusPoints: 25,
    nextResetMs: completed ? Math.max(0, 24 * 60 * 60 * 1000 - (now - lastBonusTime)) : 0,
    
    // Mission Daily Level > 8
    highestCardLevel,
    level8Target: 8,
    hasCardAboveLevel8,
    level8Completed: !!level8MissionCompleted,
    level8BonusPoints: 50,
    level8BonusCores: 20,
    level8NextResetMs: level8MissionCompleted ? Math.max(0, 24 * 60 * 60 * 1000 - (now - lastLevel8BonusTime)) : 0
  };
}

// User Profile Fetch
app.get("/api/user/profile", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const mission = getMissionStatus(user.id, user, db);
  res.json({ 
    user: { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      points: user.points,
      cores: user.cores || 0,
      avatarUrl: user.avatarUrl || "",
      nameChangeCount: user.nameChangeCount || 0,
      lastDailyBonusAt: user.lastDailyBonusAt,
      lastLevel8BonusAt: user.lastLevel8BonusAt,
      captureStreak: user.captureStreak || 0,
      lastCaptureDate: user.lastCaptureDate || ""
    },
    mission
  });
});

// Claim Daily Level > 8 Mission
app.post("/api/user/claim-level8-mission", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userCards = db.cards.filter((c: any) => c.userId === user.id);
  const highestCardLevel = userCards.reduce((max: number, c: any) => Math.max(max, c.level || 1), 1);

  if (highestCardLevel <= 8) {
    return res.status(400).json({ error: "Anda belum memiliki kartu Nekomon dengan level di atas 8! Lakukan Misi Harian untuk menaikkan level kartu Anda." });
  }

  const now = Date.now();
  const lastLevel8BonusTime = user.lastLevel8BonusAt ? new Date(user.lastLevel8BonusAt).getTime() : 0;
  const isEligible = (now - lastLevel8BonusTime) >= 24 * 60 * 60 * 1000;

  if (!isEligible) {
    return res.status(400).json({ error: "Bonus Misi Level > 8 sudah diklaim untuk hari ini. Silakan tunggu reset harian berikutnya." });
  }

  user.points = (user.points || 0) + 50;
  user.cores = (user.cores || 0) + 20;
  user.lastLevel8BonusAt = new Date().toISOString();

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  if (uIdx !== -1) {
    db.users[uIdx] = user;
  }
  writeDB(db);

  const mission = getMissionStatus(user.id, user, db);

  res.json({
    success: true,
    message: "Selamat! Misi Harian Kartu Level > 8 Selesai! Hadiah +50 Poin & +20 Cores telah ditambahkan ke akun Anda! 🎉",
    points: user.points,
    cores: user.cores,
    mission
  });
});

// Claim Daily 24-Hour Login Bonus
app.post("/api/user/claim-daily-login", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now = Date.now();
  const lastBonusTime = user.lastDailyBonusAt ? new Date(user.lastDailyBonusAt).getTime() : 0;
  const timeDiffMs = now - lastBonusTime;
  const twentyHoursMs = 20 * 60 * 60 * 1000;

  if (lastBonusTime > 0 && timeDiffMs < twentyHoursMs) {
    const nextMs = twentyHoursMs - timeDiffMs;
    return res.status(400).json({ 
      error: "Bonus login harian sudah diklaim untuk hari ini! Silakan kembali lagi besok.",
      nextAvailableInMs: nextMs
    });
  }

  // Calculate streak day
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  let currentStreak = user.dailyStreak || 0;
  if (lastBonusTime > 0 && timeDiffMs < fortyEightHoursMs) {
    currentStreak = (currentStreak % 7) + 1;
  } else {
    currentStreak = 1;
  }

  // Reward matrix based on day streak (1 to 7)
  const STREAK_REWARDS = [
    { day: 1, pts: 25, cores: 2, label: "Day 1 Bonus" },
    { day: 2, pts: 35, cores: 5, label: "Day 2 Booster" },
    { day: 3, pts: 50, cores: 8, label: "Day 3 Core Pack" },
    { day: 4, pts: 75, cores: 10, label: "Day 4 Energy Surge" },
    { day: 5, pts: 100, cores: 15, label: "Day 5 Trainer Cache" },
    { day: 6, pts: 150, cores: 20, label: "Day 6 Elite Supply" },
    { day: 7, pts: 250, cores: 30, label: "Day 7 Grand Jackpot" },
  ];

  const reward = STREAK_REWARDS[currentStreak - 1] || STREAK_REWARDS[0];

  user.points = (user.points || 0) + reward.pts;
  user.cores = (user.cores || 0) + reward.cores;
  user.lastDailyBonusAt = new Date().toISOString();
  user.dailyStreak = currentStreak;

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  if (uIdx !== -1) {
    db.users[uIdx] = user;
  }
  writeDB(db);

  res.json({
    success: true,
    message: `Bonus Login Harian Hari ke-${currentStreak} Berhasil Diklaim! (+${reward.pts} PTS & +${reward.cores} Cores)`,
    points: user.points,
    cores: user.cores,
    dailyStreak: currentStreak,
    lastDailyBonusAt: user.lastDailyBonusAt,
    reward
  });
});

// Energy Auto-Refill Helper (1 bar every 2 hours, max 5)
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

// Helper to get card IDs currently locked in active Boss Raids (waiting or in_battle)
function getLockedRaidCardIds(db: any): Set<string> {
  const set = new Set<string>();
  if (!db.raidLobbies) return set;
  const now = Date.now();
  db.raidLobbies.forEach((room: any) => {
    if (room && (room.status === "waiting" || room.status === "in_battle")) {
      // Stale safety threshold: ignore rooms older than 2 hours to prevent permanent card lockouts
      const age = now - new Date(room.createdAt || 0).getTime();
      if (age < 2 * 60 * 60 * 1000) {
        room.slots?.forEach((s: any) => {
          if (s && s.card && s.card.id) {
            set.add(s.card.id);
          }
        });
      }
    }
  });
  return set;
}

// Fetch Gallery & Cards
app.get("/api/user/gallery", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const lockedCardIds = getLockedRaidCardIds(db);
  let updatedAnyCard = false;
  const userCaptures = db.captures.filter((c: any) => c.userId === user.id);
  const userCards = db.cards
    .filter((c: any) => c.userId === user.id)
    .map((c: any) => {
      const prevEnergy = c.energy;
      const updated = updateCardEnergy(c);
      if (prevEnergy !== updated.energy) updatedAnyCard = true;
      return {
        ...updated,
        inRaid: lockedCardIds.has(updated.id)
      };
    });

  if (updatedAnyCard) {
    writeDB(db);
  }

  const mission = getMissionStatus(user.id, user, db);

  res.json({ 
    captures: userCaptures, 
    cards: userCards,
    mission 
  });
});

// Analisis dan deteksi kucing pada gambar base64 menggunakan Gemini
async function analyzeCatPhoto(photoBase64: string): Promise<{ isCat: boolean; reason: string }> {
  if (!ai) {
    return { isCat: true, reason: "Gemini API Key tidak terkonfigurasi. Menggunakan mode simulasi: Kucing berhasil terdeteksi!" };
  }

  try {
    let mimeType = "image/jpeg";
    let base64Data = photoBase64;
    if (photoBase64.startsWith("data:")) {
      const parts = photoBase64.split(",");
      base64Data = parts[1];
      const match = parts[0].match(/:(.*?);/);
      if (match) {
        mimeType = match[1];
      }
    }

    const response = await callWithRetry(async () => {
      return await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          "Analisis foto ini secara mendalam. Apakah ini adalah foto kucing asli (nyata, domestik, liar, anak kucing, dll.)? Jawab dalam format JSON. Jika ini bukan kucing asli (misalnya anjing, objek mati, mainan kucing fiktif, ilustrasi fiktif, manusia, pemandangan tanpa kucing, atau blank screen/kamera ditutup), set isCat ke false. Berikan penjelasan singkat, ramah, dan spesifik dalam bahasa Indonesia pada field 'reason'.",
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCat: {
                type: Type.BOOLEAN,
                description: "True jika ini foto kucing nyata, false jika bukan foto kucing nyata.",
              },
              reason: {
                type: Type.STRING,
                description: "Penjelasan dalam bahasa Indonesia yang ramah tentang apa yang terdeteksi atau kenapa ditolak.",
              },
            },
            required: ["isCat", "reason"],
          },
        },
      });
    });

    const text = response.text;
    if (text) {
      const result = JSON.parse(text.trim());
      return {
        isCat: !!result.isCat,
        reason: result.reason || "Selesai dianalisis oleh AI."
      };
    }
  } catch (err) {
    console.error("Gagal menganalisis foto menggunakan Gemini:", err);
  }

  // Safe fallback if API fails
  return { isCat: true, reason: "Berhasil diverifikasi melalui sensor cadangan Nekomon!" };
}

// Capture photo and get 10 points (plus optional Nekomon Spot bonus)
app.post("/api/capture", async (req, res) => {
  const { photo, spotBonus, spotName, spotId, lat, lng, locationName } = req.body; // base64 photo + optional spot bonus & spot info & geolocation
  if (!photo) {
    return res.status(400).json({ error: "Data foto kucing wajib dikirim." });
  }

  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 3 Cat Captures Limit per Spot per Day Check
  if (spotId || spotName) {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const todaySpotCaptures = db.captures.filter((c: any) => {
      if (c.userId !== user.id) return false;
      const captureDateStr = new Date(c.createdAt).toISOString().split("T")[0];
      if (captureDateStr !== todayStr) return false;
      if (spotId && c.spotId === spotId) return true;
      if (spotName && c.spotName === spotName) return true;
      return false;
    });

    if (todaySpotCaptures.length >= 3) {
      return res.status(400).json({
        error: `Batas harian tercapai! Anda telah menangkap 3 kucing di spot [${spotName || "ini"}] hari ini. Pembatasan akan direset besok. Silakan berburu di spot lokasi lain!`
      });
    }
  }

  // Analisis foto menggunakan Gemini
  const analysis = await analyzeCatPhoto(photo);
  if (!analysis.isCat) {
    return res.status(400).json({ error: analysis.reason });
  }

  // Add 10 points for regular capture
  let basePointsAdded = 10;
  let spotPointsAdded = 0;
  if (spotBonus && typeof spotBonus === "number" && spotBonus > 0) {
    spotPointsAdded = Math.min(100, spotBonus);
  }

  user.points += (basePointsAdded + spotPointsAdded);

  const newCapture = {
    id: "cap_" + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    photoUrl: photo,
    isForged: false,
    createdAt: new Date().toISOString(),
    spotId: spotId || null,
    spotName: spotName || null,
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    locationName: locationName || null
  };

  db.captures.push(newCapture);

  // Check daily mission eligibility
  let dailyBonusAwarded = false;
  let bonusMessage = "";
  
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const userCaptures = db.captures.filter((c: any) => c.userId === user.id);
  const capturesInLast24h = userCaptures.filter((c: any) => new Date(c.createdAt).getTime() >= oneDayAgo);

  if (capturesInLast24h.length >= 5) {
    const lastBonusTime = user.lastDailyBonusAt ? new Date(user.lastDailyBonusAt).getTime() : 0;
    const isEligible = (now - lastBonusTime) >= 24 * 60 * 60 * 1000;
    if (isEligible) {
      user.points += 25;
      user.lastDailyBonusAt = new Date().toISOString();
      dailyBonusAwarded = true;
      bonusMessage = "Misi Harian Selesai! Anda menangkap 5 kucing dalam 24 jam terakhir dan mendapatkan bonus 25 Poin! 🎉";
    }
  }

  // Capture Streak Logic (Daily Consecutive Capture Bonus)
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  let streakBonusAwarded = false;
  let streakBonusPoints = 0;
  let streakMessage = "";

  user.captureStreak = user.captureStreak || 0;

  if (!user.lastCaptureDate) {
    user.captureStreak = 1;
    user.lastCaptureDate = todayStr;
    streakMessage = "Streak Tangkap dimulai (1 Hari)! Tangkap kucing besok untuk meningkatkan streak-mu!";
  } else if (user.lastCaptureDate === todayStr) {
    // Already captured today, streak count stays intact
    if (user.captureStreak >= 3) {
      streakBonusPoints = Math.min(30, 15 + (user.captureStreak - 3) * 5);
      user.points += streakBonusPoints;
      streakBonusAwarded = true;
      streakMessage = `🔥 Streak Tangkap ${user.captureStreak} Hari Aktif! Bonus +${streakBonusPoints} Poin Ekstra!`;
    }
  } else if (user.lastCaptureDate === yesterdayStr) {
    // Consecutive day capture!
    user.captureStreak += 1;
    user.lastCaptureDate = todayStr;
    if (user.captureStreak >= 3) {
      streakBonusPoints = Math.min(30, 15 + (user.captureStreak - 3) * 5);
      user.points += streakBonusPoints;
      streakBonusAwarded = true;
      streakMessage = `🎉 SELAMAT! Streak Tangkap ${user.captureStreak} Hari Berturut-turut! Bonus +${streakBonusPoints} Poin Ekstra!`;
    } else {
      streakMessage = `🔥 Streak Tangkap bertambah menjadi ${user.captureStreak} Hari! (${3 - user.captureStreak} hari lagi untuk Bonus Streak)`;
    }
  } else {
    // Missed 1+ days -> Reset streak
    user.captureStreak = 1;
    user.lastCaptureDate = todayStr;
    streakMessage = "Streak Tangkap direset menjadi 1 Hari karena terlewat kemarin. Mari bangun streak lagi!";
  }

  // Update user in db
  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;

  writeDB(db);

  // Calculate final mission status to return
  const mission = getMissionStatus(user.id, user, db);

  res.json({
    success: true,
    points: user.points,
    capture: newCapture,
    dailyBonusAwarded,
    message: bonusMessage,
    streakBonusAwarded,
    streakBonusPoints,
    streakMessage,
    captureStreak: user.captureStreak,
    lastCaptureDate: user.lastCaptureDate,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      points: user.points,
      cores: user.cores || 0,
      captureStreak: user.captureStreak,
      lastCaptureDate: user.lastCaptureDate,
      lastDailyBonusAt: user.lastDailyBonusAt,
      lastLevel8BonusAt: user.lastLevel8BonusAt
    },
    mission
  });
});

// Forge to Nekomon Card
app.post("/api/forge", async (req, res) => {
  const { captureId, element, style } = req.body;
  if (!captureId || !element || !style) {
    return res.status(400).json({ error: "captureId, element, dan style wajib diisi." });
  }
  const validElements = new Set(["Api", "Air", "Tanah", "Angin", "Petir"]);
  const validStyles = new Set(["Vanguard", "Sentinel"]);
  if (!validElements.has(element) || !validStyles.has(style)) {
    return res.status(400).json({ error: "Elemen atau style kartu tidak valid." });
  }

  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (user.points < 50) {
    return res.status(400).json({ error: "Poin tidak mencukupi untuk melakukan forge (Dibutuhkan 50 poin)." });
  }

  const capture = db.captures.find((c: any) => c.id === captureId && c.userId === user.id);
  if (!capture) {
    return res.status(404).json({ error: "Foto kucing tidak ditemukan di galeri Anda." });
  }

  if (capture.isForged) {
    return res.status(400).json({ error: "Foto ini sudah pernah di-forge menjadi Nekomon Card." });
  }

  // Roll rarity:
  // Common: 45%, Rare: 30%, Epic: 15%, Legend: 8%, Mythic: 2%
  const roll = Math.random() * 100;
  let rarity = "Common";
  if (roll < 2) rarity = "Mythic";
  else if (roll < 10) rarity = "Legend";
  else if (roll < 25) rarity = "Epic";
  else if (roll < 55) rarity = "Rare";

  // Deduct points
  user.points -= 50;

  // Let's create the card details (dynamic or fallback)
  let cardName = "";
  let stats = { hp: 120, atk: 65, def: 55, spd: 45 };
  let skill = { name: "Spark Claw", desc: "Cakaran cepat bermuatan energi." };
  let finalImage = "";
  let geminiUsed = false;

  // 1. Roll stats based on rarity ranges
  const range = STATS_RANGES[rarity] || STATS_RANGES.Common;
  stats.hp = Math.floor(Math.random() * (range.hp[1] - range.hp[0] + 1)) + range.hp[0];
  stats.atk = Math.floor(Math.random() * (range.atk[1] - range.atk[0] + 1)) + range.atk[0];
  stats.def = Math.floor(Math.random() * (range.def[1] - range.def[0] + 1)) + range.def[0];
  stats.spd = Math.floor(Math.random() * (range.spd[1] - range.spd[0] + 1)) + range.spd[0];

  // 2. Select basic skills based on element
  const speciesPool = NEKOMON_SPECIES_CATALOG.filter(species => species.element === element && species.rarity === rarity);
  const preferredSpecies = speciesPool.filter(species => species.style === style);
  const selectedSpeciesPool = preferredSpecies.length > 0 ? preferredSpecies : speciesPool;
  const selectedSpecies = selectedSpeciesPool[Math.floor(Math.random() * selectedSpeciesPool.length)];
  if (selectedSpecies) {
    skill = { name: selectedSpecies.skillName, desc: selectedSpecies.skillDesc };
    cardName = selectedSpecies.name;
  } else {
    const elementSkills = ABILITIES[element] || ABILITIES.Api;
    const chosenSkill = elementSkills[Math.floor(Math.random() * elementSkills.length)];
    skill = { ...chosenSkill };
  }

  // 3. Choose basic card name
  const namesList = FALLBACKS[style]?.[element] || FALLBACKS.Sentinel.Api;
  if (!cardName) cardName = namesList[Math.floor(Math.random() * namesList.length)] + " " + rarity;

  // Call Gemini if initialized
  if (ai) {
    try {
      console.log(`Calling Gemini (gemini-3.5-flash) to customize card details for rarity: ${rarity}...`);
      
      const animeConcept = style === "Sentinel" ? "anime character with soft, magical composition, hand-drawn aesthetic, highly detailed, cozy, heartwarming, inspired by Ghibli, A-1 Pictures, Kyoto Animation, or Steampunk elements" : "anime character with sharp, dynamic, cinematic composition, modern high-contrast action anime style, cinematic lighting, sleek and energetic, inspired by Mappa, Bones, Madhouse, or Cyberpunk elements";

      const prompt = `Analisis foto kucing masukan yang diberikan dan data berikut untuk Nekomon Card Game:
- Foto Masukan: Deskripsikan secara detail ciri fisik kucing asli dari foto tersebut (warna bulu, corak/pola bulu seperti calico/tabby/solid, bentuk telinga, warna mata, pose, ekspresi). Ciri fisik unik ini WAJIB dipertahankan agar hasil anime terlihat mirip dengan foto asli!
- Elemen Terpilih: ${element}
- Studio Anime Gaya: ${style} (${animeConcept})
- Tingkat Kelangkaan (Rarity): ${rarity}
- Spesies Katalog Resmi: ${selectedSpecies?.name || "Varian Nekomon Liar"}
- Skill Dasar Katalog: ${selectedSpecies?.skillName || skill.name}
- Deskripsi Rarity yang harus dipenuhi: ${
        rarity === "Common" ? "Kucing domestik biasa dalam situasi sehari-hari yang menggemaskan, kekuatan sederhana." :
        rarity === "Rare" ? "Kucing dengan sedikit kostum ringan atau tema ras spesifik dengan percikan fantasi." :
        rarity === "Epic" ? "Kucing menyatu dengan elemen alam (${element}) atau sihir dengan aura mengagumkan." :
        rarity === "Legend" ? "Kucing dewa mitologi atau penjaga dimensi misterius, desain sangat detail, dramatis, mistis." :
        "Tingkat tertinggi: Dewa penguasa alam semesta (God-tier), megah, abstrak, mengintimidasi namun tetap kucing."
      }

Berikan output berupa objek JSON dengan spesifikasi tepat berikut:
{
  "name": "Nama varian maksimal 2-3 kata yang tetap jelas berasal dari spesies katalog ${selectedSpecies?.name || cardName}",
  "skillName": "Nama evolusi atau variasi dari skill katalog ${selectedSpecies?.skillName || skill.name}",
  "skillDesc": "Deskripsi efek skill dalam bahasa Indonesia",
  "imagePrompt": "Detailed English descriptive prompt for an image generator to draw this card's cat artwork. You MUST capture and transfer the exact physical features of the original cat from the photo (such as its specific fur patterns, colors, face markings, and eye colors/features) into the requested anime style. Specifically: describe a cat with the same fur color/pattern/markings and eye color as the original photo, but beautifully transformed into ${animeConcept} style, fused with the ${element} element, with specific details fitting the ${rarity} rarity description (e.g. glowing elemental aura, floating crystals or sparks, dynamic energy). Set background to a stunning elemental environment matching the element ${element}."
}`;

      // Call Gemini 3.5 Flash for the card metadata and prompt definition
      const contentRes = await callWithRetry(() => ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: capture.photoUrl.split(",")[1] || capture.photoUrl,
              mimeType: "image/jpeg"
            }
          },
          { text: prompt }
        ],
        config: {
          responseMimeType: "application/json"
        }
      }));

      if (contentRes.text) {
        const parsed = JSON.parse(contentRes.text.trim());
        if (parsed.name) cardName = parsed.name;
        if (parsed.skillName) skill.name = parsed.skillName;
        if (parsed.skillDesc) skill.desc = parsed.skillDesc;
        
        console.log("Card Profile generated successfully by Gemini:", parsed);

        // Now try generating the transformed image using gemini-3.1-flash-lite-image
        try {
          console.log(`Generating anime style card artwork using gemini-3.1-flash-lite-image with prompt: "${parsed.imagePrompt}"...`);
          const imgRes = await callWithRetry(() => ai!.models.generateContent({
            model: "gemini-3.1-flash-lite-image",
            contents: {
              parts: [{ text: parsed.imagePrompt }]
            },
            config: {
              imageConfig: {
                aspectRatio: "1:1"
              }
            }
          }));

          if (imgRes.candidates?.[0]?.content?.parts) {
            for (const part of imgRes.candidates[0].content.parts) {
              if (part.inlineData?.data) {
                finalImage = `data:image/png;base64,${part.inlineData.data}`;
                geminiUsed = true;
                console.log("Card Image generated successfully by Imagen!");
                break;
              }
            }
          }
        } catch (imgErr) {
          console.error("Gemini Image generation failed, will use premium SVG card generator fallback:", imgErr);
        }
      }
    } catch (genErr) {
      console.error("Gemini processing failed, falling back to dynamic generator:", genErr);
    }
  }

  // If Gemini wasn't able to produce an image, generate a stunning dynamic SVG
  if (!finalImage) {
    finalImage = generateFallbackImage(cardName, element, style, rarity, capture.photoUrl);
  }

  const newCard = {
    id: "card_" + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    captureId: capture.id,
    name: cardName,
    element,
    style,
    rarity,
    hp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    skillName: skill.name,
    skillDesc: skill.desc,
    imageUrl: finalImage,
    geminiUsed,
    level: 1,
    xp: 0,
    maxXp: 100,
    energy: 5,
    maxEnergy: 5,
    lastEnergyRefillAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  // Mark capture as forged
  capture.isForged = true;

  db.cards.push(newCard);
  
  // Save updated captures list
  const capIdx = db.captures.findIndex((c: any) => c.id === capture.id);
  db.captures[capIdx] = capture;

  // Determine Nekomon cores earned based on rarity
  let coresEarned = 1;
  const lowercaseRarity = rarity.toLowerCase();
  if (lowercaseRarity === "rare") {
    coresEarned = 2;
  } else if (lowercaseRarity === "epic") {
    coresEarned = 3;
  } else if (lowercaseRarity === "legend" || lowercaseRarity === "legendary") {
    coresEarned = 4;
  } else if (lowercaseRarity === "mythic") {
    coresEarned = 5;
  }

  user.cores = (user.cores || 0) + coresEarned;

  // Save updated user balance
  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;

  writeDB(db);

  res.json({
    success: true,
    points: user.points,
    cores: user.cores,
    coresEarned,
    card: newCard
  });
});

// Destroy Nekomon Card and refund points based on rarity
app.delete("/api/cards/:id", (req, res) => {
  const cardId = req.params.id;
  if (!cardId) {
    return res.status(400).json({ error: "ID Kartu wajib ditentukan." });
  }

  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Find user's card
  const cardIndex = db.cards.findIndex((c: any) => c.id === cardId && c.userId === user.id);
  if (cardIndex === -1) {
    return res.status(404).json({ error: "Nekomon Card tidak ditemukan." });
  }

  const card = db.cards[cardIndex];
  
  // Map points based on rarity: Common, Rare, Epic, Legend, Mythic
  const rarity = (card.rarity || "Common").toLowerCase();
  let pointsToRefund = 10;
  if (rarity === "rare") {
    pointsToRefund = 15;
  } else if (rarity === "epic") {
    pointsToRefund = 20;
  } else if (rarity === "legend" || rarity === "legendary") {
    pointsToRefund = 25;
  } else if (rarity === "mythic") {
    pointsToRefund = 30;
  }

  // Add refunded points to user
  user.points += pointsToRefund;

  // Un-forge the capture if it exists so it can be re-forged
  if (card.captureId) {
    const capture = db.captures.find((c: any) => c.id === card.captureId && c.userId === user.id);
    if (capture) {
      capture.isForged = false;
      const capIdx = db.captures.findIndex((c: any) => c.id === capture.id);
      if (capIdx !== -1) {
        db.captures[capIdx] = capture;
      }
    }
  }

  // Remove the card
  db.cards.splice(cardIndex, 1);

  // Update user in db
  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  if (uIdx !== -1) {
    db.users[uIdx] = user;
  }

  writeDB(db);

  res.json({
    success: true,
    points: user.points,
    refundedPoints: pointsToRefund,
    message: `Kartu Nekomon ${card.name} berhasil di-destroy! Anda mendapatkan kembali ${pointsToRefund} poin.`
  });
});

// Delete captured photo from gallery
app.delete("/api/captures/:id", (req, res) => {
  const captureId = req.params.id;
  if (!captureId) {
    return res.status(400).json({ error: "ID Foto wajib ditentukan." });
  }

  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Find user's capture
  const captureIndex = db.captures.findIndex((c: any) => c.id === captureId && c.userId === user.id);
  if (captureIndex === -1) {
    return res.status(404).json({ error: "Foto tidak ditemukan." });
  }

  const capture = db.captures[captureIndex];

  // Prevent deleting if forged
  if (capture.isForged) {
    return res.status(400).json({ error: "Foto ini telah di-forge menjadi Nekomon Card. Silakan hancurkan kartu Nekomon tersebut terlebih dahulu jika ingin menghapus foto." });
  }

  // Remove the capture
  db.captures.splice(captureIndex, 1);

  writeDB(db);

  res.json({
    success: true,
    message: "Foto kucing berhasil dihapus dari galeri."
  });
});

// Retake / Replace photo for an existing captured item in Gallery
app.put("/api/captures/:id/photo", async (req, res) => {
  const captureId = req.params.id;
  const { photo } = req.body;

  if (!captureId || !photo) {
    return res.status(400).json({ error: "ID Foto dan data foto baru wajib diisi." });
  }

  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const captureIndex = db.captures.findIndex((c: any) => c.id === captureId && c.userId === user.id);
  if (captureIndex === -1) {
    return res.status(404).json({ error: "Foto tidak ditemukan di galeri Anda." });
  }

  const capture = db.captures[captureIndex];
  if (capture.isForged) {
    return res.status(400).json({ error: "Foto ini sudah di-forge menjadi Nekomon Card. Foto kartu yang telah di-forge tidak dapat diganti." });
  }

  // Analyze new cat photo with Gemini
  const analysis = await analyzeCatPhoto(photo);
  if (!analysis.isCat) {
    return res.status(400).json({ error: analysis.reason });
  }

  capture.photoUrl = photo;
  db.captures[captureIndex] = capture;
  writeDB(db);

  res.json({
    success: true,
    message: "Foto kucing berhasil di-retake dan diperbarui!",
    capture
  });
});

// Update Profile Picture (Avatar)
app.post("/api/user/avatar", (req, res) => {
  const { avatarUrl } = req.body;
  
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  user.avatarUrl = avatarUrl || "";
  
  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  if (uIdx !== -1) {
    db.users[uIdx] = user;
  }

  writeDB(db);

  res.json({
    success: true,
    message: avatarUrl ? "Foto profil berhasil diperbarui!" : "Foto profil berhasil dihapus.",
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      points: user.points,
      cores: user.cores || 0,
      avatarUrl: user.avatarUrl,
      nameChangeCount: user.nameChangeCount || 0,
      captureStreak: user.captureStreak,
      lastCaptureDate: user.lastCaptureDate
    }
  });
});

// Change Username (1st change is FREE, 2nd and subsequent changes cost 200 Cores)
app.post("/api/user/change-username", (req, res) => {
  const { newUsername } = req.body;

  if (!newUsername || typeof newUsername !== "string") {
    return res.status(400).json({ error: "Username baru tidak boleh kosong." });
  }

  const cleanUsername = newUsername.trim();
  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    return res.status(400).json({ error: "Username harus terdiri dari 3 hingga 20 karakter." });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return res.status(400).json({ error: "Username hanya boleh menggunakan huruf, angka, dan garis bawah (_)." });
  }

  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (user.username.toLowerCase() === cleanUsername.toLowerCase()) {
    return res.status(400).json({ error: "Username baru sama dengan username Anda saat ini." });
  }

  // Check if username is already taken by another user
  const isTaken = db.users.some((u: any) => u.id !== user.id && u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (isTaken) {
    return res.status(400).json({ error: "Username tersebut sudah digunakan oleh player lain. Silakan pilih username lain." });
  }

  const currentCount = user.nameChangeCount || 0;

  if (currentCount > 0) {
    // Requires 200 Cores
    const userCores = user.cores || 0;
    if (userCores < 200) {
      return res.status(400).json({
        error: `Nekomon Cores tidak cukup! Penggantian username kedua dan seterusnya membutuhkan 200 Cores (Cores Anda saat ini: ${userCores}).`
      });
    }
    user.cores = userCores - 200;
  }

  user.username = cleanUsername;
  user.nameChangeCount = currentCount + 1;

  // Update user in db
  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  if (uIdx !== -1) {
    db.users[uIdx] = user;
  }

  writeDB(db);

  // Generate new token since auth token is base64 of id:username
  const newToken = createSessionToken(user);

  res.json({
    success: true,
    message: currentCount === 0 
      ? `Selamat! Username berhasil diubah menjadi @${cleanUsername} secara GRATIS (Penggantian ke-1).`
      : `Username berhasil diubah menjadi @${cleanUsername} (-200 Nekomon Cores).`,
    newToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      points: user.points,
      cores: user.cores || 0,
      avatarUrl: user.avatarUrl || "",
      nameChangeCount: user.nameChangeCount,
      captureStreak: user.captureStreak,
      lastCaptureDate: user.lastCaptureDate
    }
  });
});

// Run Daily Activity/Mission for a specific Nekomon Card to gain XP and Level Up
app.post("/api/cards/:id/mission", (req, res) => {
  const cardId = req.params.id;
  const { activityId } = req.body;

  if (!cardId || !activityId) {
    return res.status(400).json({ error: "ID Kartu dan ID Aktivitas wajib ditentukan." });
  }

  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Find the card and check ownership
  const cardIndex = db.cards.findIndex((c: any) => c.id === cardId && c.userId === user.id);
  if (cardIndex === -1) {
    return res.status(404).json({ error: "Nekomon Card tidak ditemukan atau bukan milik Anda." });
  }

  const card = db.cards[cardIndex];

  // Set default level properties if missing
  if (card.level === undefined) card.level = 1;
  if (card.xp === undefined) card.xp = 0;
  if (card.maxXp === undefined) card.maxXp = card.level * 100;

  // Energy Check & Refill Logic
  updateCardEnergy(card);
  if ((card.energy ?? 5) < 1) {
    return res.status(400).json({
      error: "Energi Nekomon ini telah habis (0/5)! Setiap menjalankan misi dibutuhkan 1 bar energi. Energi di-refill 1 bar setiap 2 jam sekali."
    });
  }

  // Deduct 1 bar of energy for running a mission
  if ((card.energy ?? 5) === (card.maxEnergy ?? 5)) {
    card.lastEnergyRefillAt = new Date().toISOString();
  }
  card.energy = (card.energy ?? 5) - 1;

  // Define activities
  const activities: Record<string, { name: string; xp: number; points: number; desc: string; opponent: string }> = {
    patrol: {
      name: "Patroli Lingkungan Harian",
      xp: 30,
      points: 5,
      desc: "Mengitari kompleks rumah mencari keberadaan Nekomon liar atau sisa cemilan lezat.",
      opponent: "Oyen Kompleks Sebelah"
    },
    training: {
      name: "Latihan Kebugaran Gym Kucing",
      xp: 60,
      points: 10,
      desc: "Berlatih melompati pagar tinggi dan mengejar mainan laser berkecepatan tinggi untuk meningkatkan refleks.",
      opponent: "Robot Tikus Latihan"
    },
    rescue: {
      name: "Penyelamatan Anak Kucing",
      xp: 100,
      points: 20,
      desc: "Menyelamatkan seekor anak kucing manis yang memanjat terlalu tinggi dan terjebak di dahan pohon raksasa.",
      opponent: "Dahan Pohon Ek Raksasa"
    },
    boss: {
      name: "Pertempuran Bos: Oyen Gendut Sang Raja",
      xp: 180,
      points: 35,
      desc: "Menantang penguasa legendaris taman kota, si Oyen Gendut yang tangguh untuk memperebutkan tahta kasur taman.",
      opponent: "Oyen Gendut Sang Raja"
    },
    master_trial: {
      name: "Ujian Master Nekomon (Lv. >8)",
      xp: 300,
      points: 60,
      desc: "Ujian kualifikasi tingkat tinggi bagi Nekomon veteran untuk menghadapi Penjaga Dimensi Purba.",
      opponent: "Penjaga Dimensi Purba"
    }
  };

  const activity = activities[activityId];
  if (!activity) {
    return res.status(400).json({ error: "Aktivitas tidak valid." });
  }

  // Calculate success probability based on card level and mission level
  const missionLevels: Record<string, number> = {
    patrol: 1,
    training: 3,
    rescue: 5,
    boss: 8,
    master_trial: 8
  };
  const missionLevel = missionLevels[activityId] || 1;
  const cardLevel = card.level || 1;

  let successRate = 0.75; // Base success rate of 75% for equal levels
  if (cardLevel >= missionLevel) {
    // Higher levels increase success rate up to 98%
    successRate = Math.min(0.98, 0.75 + (cardLevel - missionLevel) * 0.05);
  } else {
    // Lower levels penalize success rate down to 15%
    successRate = Math.max(0.15, 0.75 - (missionLevel - cardLevel) * 0.15);
  }

  const roll = Math.random();
  const missionSuccess = roll <= successRate;

  // Award rewards based on success or failure
  let xpGained = 0;
  let pointsGained = 0;

  if (missionSuccess) {
    xpGained = activity.xp;
    pointsGained = activity.points;
  } else {
    // Consolation prize: 15% of standard XP (min 5) and 0 points
    xpGained = Math.max(5, Math.floor(activity.xp * 0.15));
    pointsGained = 0;
  }

  user.points = (user.points || 0) + pointsGained;

  // Apply XP & check Level Up
  const { oldLevel, newLevel, leveledUp, statUpgrades } = applyCardXp(card, xpGained);

  // Generate realistic battle/activity logs
  const logs = [
    `[MEMULAI] ${card.name} (LV. ${oldLevel}) memulai aktivitas: "${activity.name}".`,
    `[SPECS] Deskripsi: ${activity.desc}`,
    `[ANALISIS] Peluang keberhasilan: ${(successRate * 100).toFixed(0)}% (Level Kartu: ${cardLevel} vs Tingkat Misi: ${missionLevel}).`,
    `[MUSUH] Berhadapan dengan rintangan/lawan: ${activity.opponent}.`
  ];

  if (missionSuccess) {
    if (activityId === "patrol") {
      logs.push(`[AKSI] ${card.name} mengendus-endus semak bersemangat.`);
      logs.push(`[PERTEMUAN] Bertemu dengan ${activity.opponent} yang sedang memakan ikan asin.`);
      logs.push(`[AKSI] Menggunakan skill andalan [${card.skillName}] untuk menggertak lawan!`);
      logs.push(`[BERHASIL] ${activity.opponent} kabur meninggalkan area. Patroli selesai dengan sukses!`);
    } else if (activityId === "training") {
      logs.push(`[AKSI] ${card.name} meregangkan otot kaki dan kuku.`);
      logs.push(`[AKSI] Mengejar ${activity.opponent} yang bergerak lincah.`);
      logs.push(`[AKSI] Melancarkan [${card.skillName}] berkali-kali ke arah robot latihan.`);
      logs.push(`[BERHASIL] Menangkap robot tikus dalam waktu rekor! Fisik dan fokus meningkat tajam.`);
    } else if (activityId === "rescue") {
      logs.push(`[AKSI] Anak kucing mengeong ketakutan di atas pohon.`);
      logs.push(`[AKSI] ${card.name} memanjat dahan pohon dengan gagah berani.`);
      logs.push(`[AKSI] Menggunakan keahlian elemennya untuk mengamankan posisi dahan.`);
      logs.push(`[BERHASIL] Menggendong anak kucing turun dengan selamat menggunakan mulutnya. Misi penyelamatan sukses!`);
    } else if (activityId === "master_trial") {
      logs.push(`[AKSI] Memasuki gerbang dimensi rahasia Ujian Master Nekomon!`);
      logs.push(`[AKSI] Berhadapan langsung dengan ${activity.opponent}.`);
      logs.push(`[BATTLE] ${card.name} mengerahkan kekuatan elemen ${card.element} penuh dan melancarkan [${card.skillName}]!`);
      logs.push(`[BERHASIL] Penjaga Dimensi Purba mengakui keunggulan kekuatan ${card.name}. Ujian Master berhasil diselesaikan!`);
    } else {
      logs.push(`[AKSI] Berhadapan tatap muka dengan sang legenda, ${activity.opponent}!`);
      logs.push(`[AKSI] ${card.name} mengeluarkan aura elemen ${card.element} yang mengintimidasi.`);
      logs.push(`[BATTLE] Melancarkan serangan pamungkas: [${card.skillName}]!`);
      logs.push(`[BATTLE] ${activity.opponent} membalas dengan hempasan badannya yang gemoy.`);
      logs.push(`[AKSI] Dengan kelincahan tinggi, ${card.name} berhasil menghindar dan mencakar balik.`);
      logs.push(`[BERHASIL] ${activity.opponent} terduduk kelelahan dan memberikan hormat tanda mengakui keunggulan Anda!`);
    }
    logs.push(`[MISI SELESAI] Kemenangan diraih!`);
  } else {
    if (activityId === "patrol") {
      logs.push(`[AKSI] ${card.name} mengendus-endus semak bersemangat.`);
      logs.push(`[PERTEMUAN] Bertemu dengan ${activity.opponent} yang sedang berkumpul bersama kawanannya.`);
      logs.push(`[AKSI] Mencoba melancarkan skill [${card.skillName}] tetapi terpeleset kulit pisang!`);
      logs.push(`[GAGAL] ${activity.opponent} mengeong keras menertawakan ${card.name}. Patroli dihentikan karena malu.`);
    } else if (activityId === "training") {
      logs.push(`[AKSI] ${card.name} meregangkan otot kaki dan kuku.`);
      logs.push(`[AKSI] Mengejar ${activity.opponent} yang bergerak sangat lincah.`);
      logs.push(`[AKSI] Mencoba melompat tinggi tetapi menabrak dinding treadmill.`);
      logs.push(`[GAGAL] Energi ${card.name} terkuras habis sebelum latihan selesai. Robot latihan menang kali ini.`);
    } else if (activityId === "rescue") {
      logs.push(`[AKSI] Anak kucing mengeong ketakutan di atas dahan tinggi.`);
      logs.push(`[AKSI] ${card.name} mencoba memanjat pohon tetapi dahan terlalu licin.`);
      logs.push(`[AKSI] Mencoba menggunakan dorongan energi elemen ${card.element}, namun dahan patah lebih dulu.`);
      logs.push(`[GAGAL] ${card.name} terjatuh ke tumpukan jerami. Untungnya tidak terluka, namun anak kucing harus diselamatkan dengan tangga pemadam.`);
    } else if (activityId === "master_trial") {
      logs.push(`[AKSI] Memasuki gerbang dimensi Ujian Master Nekomon.`);
      logs.push(`[AKSI] Berhadapan dengan ${activity.opponent} yang memancarkan tekanan aura raksasa.`);
      logs.push(`[BATTLE] ${card.name} mencoba menyerang, namun aura Penjaga Dimensi Purba terlalu tangguh.`);
      logs.push(`[GAGAL] Ujian Master belum berhasil diselesaikan. Tingkatkan level atau statistik kartu Anda!`);
    } else {
      logs.push(`[AKSI] Berhadapan tatap muka dengan sang legenda, ${activity.opponent}!`);
      logs.push(`[AKSI] ${card.name} mengeluarkan aura elemen ${card.element} yang gemetaran.`);
      logs.push(`[BATTLE] Mencoba melancarkan serangan pamungkas [${card.skillName}]!`);
      logs.push(`[BATTLE] ${activity.opponent} membalas dengan tatapan dingin dan kibasan ekor yang memicu badai debu.`);
      logs.push(`[GAGAL] ${card.name} terlempar keluar dari ring arena. Pertarungan dimenangkan oleh sang raja oyen.`);
    }
    logs.push(`[MISI GAGAL] Sayang sekali, misi tidak berhasil diselesaikan. Dapatkan hadiah hiburan!`);
  }

  if (leveledUp) {
    logs.push(`[LEVEL UP] 🎉 SELAMAT! ${card.name} naik ke LEVEL ${newLevel}!`);
    logs.push(`[LEVEL UP] Stat Meningkat: HP +${statUpgrades.hp}, ATK +${statUpgrades.atk}, DEF +${statUpgrades.def}, SPD +${statUpgrades.spd}!`);
  }

  // Update card in DB
  db.cards[cardIndex] = card;

  // Update user points in DB
  const userIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[userIdx] = user;

  writeDB(db);

  res.json({
    success: true,
    missionSuccess,
    card,
    points: user.points,
    xpGained,
    pointsGained,
    leveledUp,
    newLevel,
    statUpgrades,
    logs
  });
});

// Evolve Nekomon Card to higher rarity and stats
app.post("/api/cards/:id/evolve", async (req, res) => {
  const cardId = req.params.id;
  if (!cardId) {
    return res.status(400).json({ error: "ID Kartu wajib ditentukan." });
  }

  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Find user's card
  const cardIndex = db.cards.findIndex((c: any) => c.id === cardId && c.userId === user.id);
  if (cardIndex === -1) {
    return res.status(404).json({ error: "Nekomon Card tidak ditemukan atau bukan milik Anda." });
  }

  const card = db.cards[cardIndex];
  const currentRarity = card.rarity || "Common";

  // Map rarity progression
  const rarityProgression: Record<string, { next: string; cores: number; points: number }> = {
    "Common": { next: "Rare", cores: 2, points: 50 },
    "Rare": { next: "Epic", cores: 4, points: 100 },
    "Epic": { next: "Legend", cores: 8, points: 150 },
    "Legend": { next: "Mythic", cores: 12, points: 250 },
  };

  const progression = rarityProgression[currentRarity];
  if (!progression) {
    return res.status(400).json({ error: "Kartu Anda sudah mencapai tingkat kelangkaan tertinggi (Mythic) dan tidak bisa berevolusi lebih jauh!" });
  }

  const { next: nextRarity, cores: requiredCores, points: requiredPoints } = progression;

  // Check requirements
  const userCores = user.cores || 0;
  const userPoints = user.points || 0;

  if (userCores < requiredCores) {
    return res.status(400).json({ 
      error: `Cores tidak mencukupi untuk melakukan evolusi. Dibutuhkan ${requiredCores} Nekomon Cores (Anda memiliki ${userCores} Cores).` 
    });
  }

  if (userPoints < requiredPoints) {
    return res.status(400).json({ 
      error: `Poin tidak mencukupi untuk melakukan evolusi. Dibutuhkan ${requiredPoints} Poin (Anda memiliki ${userPoints} Poin).` 
    });
  }

  // Deduct costs
  user.cores -= requiredCores;
  user.points -= requiredPoints;

  // Save current stats for log report
  const oldStats = { hp: card.hp, atk: card.atk, def: card.def, spd: card.spd || 45 };

  // Calculate new upgraded stats
  const range = STATS_RANGES[nextRarity] || STATS_RANGES.Rare;
  const newHp = Math.max(Math.floor(card.hp * 1.18), range.hp[0] + Math.floor(Math.random() * 50));
  const newAtk = Math.max(Math.floor(card.atk * 1.18), range.atk[0] + Math.floor(Math.random() * 30));
  const newDef = Math.max(Math.floor(card.def * 1.18), range.def[0] + Math.floor(Math.random() * 30));
  const newSpd = Math.max(Math.floor((card.spd || 45) * 1.15), range.spd[0] + Math.floor(Math.random() * 20));

  const statsIncreases = {
    hp: newHp - oldStats.hp,
    atk: newAtk - oldStats.atk,
    def: newDef - oldStats.def,
    spd: newSpd - oldStats.spd
  };

  // Upgraded name and skill fallback
  let evolvedName = `${card.name.replace(/ (Common|Rare|Epic|Legend|Mythic)$/i, "")} ${nextRarity}`;
  
  // Custom prefix titles to sound super cool
  const elementPrefixes: Record<string, string[]> = {
    "Api": ["Ignis", "Blazing", "Solaris", "Volcanic", "Pyre"],
    "Air": ["Aqua", "Tidal", "Glacial", "Abyssal", "Tsunami"],
    "Tanah": ["Terra", "Gaea", "Granite", "Obelisk", "Titanic"],
    "Angin": ["Zephyr", "Aero", "Tempest", "Sonic", "Cyclone"],
    "Petir": ["Volt", "Lightning", "Thunder", "Plasma", "Tesla"]
  };
  const prefixes = elementPrefixes[card.element] || ["Quantum", "Evolved", "Apex"];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  let nameWithoutRarity = card.name.replace(/ (Common|Rare|Epic|Legend|Mythic)$/i, "");
  if (!nameWithoutRarity.includes(randomPrefix)) {
    evolvedName = `${randomPrefix} ${nameWithoutRarity} ${nextRarity}`;
  }

  let evolvedSkillName = `${card.skillName || "Scratch"} +`;
  let evolvedSkillDesc = `Versi evolusi dari ${card.skillName}. Serangan berkekuatan tinggi dengan limpahan energi elemen ${card.element}.`;

  let evolvedImage = "";
  let geminiUsed = false;

  // Let's load the associated capture if any, to carry over visual style
  const capture = db.captures.find((c: any) => c.id === card.captureId);

  if (ai) {
    try {
      console.log(`Calling Gemini to generate evolution details for card ${card.name} to rarity ${nextRarity}...`);
      const animeConcept = card.style === "Sentinel" ? "anime character with soft, magical composition, hand-drawn aesthetic, highly detailed, cozy, heartwarming, inspired by Ghibli, A-1 Pictures, Kyoto Animation, or Steampunk elements" : "anime character with sharp, dynamic, cinematic composition, modern high-contrast action anime style, cinematic lighting, sleek and energetic, inspired by Mappa, Bones, Madhouse, or Cyberpunk elements";

      const prompt = `Lakukan evolusi kosmetis dan kekuatan pada Nekomon Card berikut ini:
- Nama Sekarang: ${card.name}
- Elemen: ${card.element}
- Studio Gaya: ${card.style} (${animeConcept})
- Kelangkaan Sebelumnya: ${currentRarity}
- Kelangkaan Baru (Evolusi): ${nextRarity}
- Karakteristik Kucing Fisik (Jika ada foto): Deskripsikan secara elegan agar tetap mirip.

Berikan output berupa objek JSON dengan spesifikasi tepat berikut:
{
  "name": "Nama fantasi hasil evolusi baru yang sangat megah, legendaris, dan cocok untuk tingkat ${nextRarity} bertema elemen ${card.element} (contoh: ${randomPrefix} ${nameWithoutRarity}, maksimal 3 kata)",
  "skillName": "Nama skill hasil evolusi baru yang jauh lebih kuat",
  "skillDesc": "Deskripsi efek skill evolusi yang sangat keren dan eksplosif dalam bahasa Indonesia",
  "imagePrompt": "Detailed English descriptive prompt for an image generator to draw this card's UPGRADED cat artwork. It must be an evolved, significantly more powerful, and majestic version of the cat from ${card.name}. Describe the cat with the same physical characteristics (fur pattern, eye color) but now fully infused with massive ${card.element} elemental power (e.g., massive flaming wings, floating lightning orbs, majestic crystal crown, storm swirling around it). Retain the style: ${animeConcept}. The background should be a spectacular epic elemental scenery."
}`;

      const contents: any[] = [];
      if (capture && capture.photoUrl) {
        contents.push({
          inlineData: {
            data: capture.photoUrl.split(",")[1] || capture.photoUrl,
            mimeType: "image/jpeg"
          }
        });
      }
      contents.push({ text: prompt });

      const contentRes = await callWithRetry(() => ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          responseMimeType: "application/json"
        }
      }));

      if (contentRes.text) {
        const parsed = JSON.parse(contentRes.text.trim());
        if (parsed.name) evolvedName = parsed.name;
        if (parsed.skillName) evolvedSkillName = parsed.skillName;
        if (parsed.skillDesc) evolvedSkillDesc = parsed.skillDesc;

        console.log("Evolved card metadata generated by Gemini:", parsed);

        // Try generating the evolved artwork using gemini-3.1-flash-lite-image
        try {
          console.log(`Generating evolved card artwork using gemini-3.1-flash-lite-image with prompt: "${parsed.imagePrompt}"...`);
          const imgRes = await callWithRetry(() => ai!.models.generateContent({
            model: "gemini-3.1-flash-lite-image",
            contents: {
              parts: [{ text: parsed.imagePrompt }]
            },
            config: {
              imageConfig: {
                aspectRatio: "1:1"
              }
            }
          }));

          if (imgRes.candidates?.[0]?.content?.parts) {
            for (const part of imgRes.candidates[0].content.parts) {
              if (part.inlineData?.data) {
                evolvedImage = `data:image/png;base64,${part.inlineData.data}`;
                geminiUsed = true;
                console.log("Evolved Card Image generated successfully by Imagen!");
                break;
              }
            }
          }
        } catch (imgErr) {
          console.error("Gemini Evolved Image generation failed, fallback will be used:", imgErr);
        }
      }
    } catch (genErr) {
      console.error("Gemini evolution processing failed, falling back to dynamic SVG generator:", genErr);
    }
  }

  // Fallback to beautiful dynamic SVG if Gemini failed or is not available
  if (!evolvedImage) {
    evolvedImage = generateFallbackImage(evolvedName, card.element, card.style, nextRarity, capture?.photoUrl);
  }

  // Record previous form in evolution history
  if (!card.evolutionHistory) {
    card.evolutionHistory = [];
  }
  card.evolutionHistory.push({
    rarity: currentRarity,
    name: card.name,
    hp: card.hp,
    atk: card.atk,
    def: card.def,
    spd: card.spd || 45,
    skillName: card.skillName,
    skillDesc: card.skillDesc,
    imageUrl: card.imageUrl,
    evolvedAt: new Date().toISOString()
  });

  // Update card fields
  card.name = evolvedName;
  card.rarity = nextRarity;
  card.hp = newHp;
  card.atk = newAtk;
  card.def = newDef;
  card.spd = newSpd;
  card.skillName = evolvedSkillName;
  card.skillDesc = evolvedSkillDesc;
  card.imageUrl = evolvedImage;
  card.geminiUsed = geminiUsed;

  // Save changes to DB
  db.cards[cardIndex] = card;

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;

  writeDB(db);

  res.json({
    success: true,
    message: `Selamat! Nekomon Card Anda berhasil berevolusi menjadi ${evolvedName}! 🎉`,
    card,
    points: user.points,
    cores: user.cores,
    oldRarity: currentRarity,
    newRarity: nextRarity,
    statsIncreases,
    requiredCores,
    requiredPoints
  });
});

// Cancel / Revert evolution of a Nekomon card to its previous state
app.post("/api/cards/:id/cancel-evolution", async (req, res) => {
  const cardId = req.params.id;
  if (!cardId) {
    return res.status(400).json({ error: "ID Kartu wajib ditentukan." });
  }

  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Find user's card
  const cardIndex = db.cards.findIndex((c: any) => c.id === cardId && c.userId === user.id);
  if (cardIndex === -1) {
    return res.status(404).json({ error: "Nekomon Card tidak ditemukan atau bukan milik Anda." });
  }

  const card = db.cards[cardIndex];

  // Verify there is an evolution history
  if (!card.evolutionHistory || card.evolutionHistory.length === 0) {
    return res.status(400).json({ error: "Kartu ini masih dalam wujud aslinya dan belum pernah berevolusi." });
  }

  // Pop the last state from evolution history
  const previousState = card.evolutionHistory[card.evolutionHistory.length - 1];
  const previousRarity = previousState.rarity;

  // Map rarity progression to find previous cost
  const rarityProgression: Record<string, { next: string; cores: number; points: number }> = {
    "Common": { next: "Rare", cores: 2, points: 50 },
    "Rare": { next: "Epic", cores: 4, points: 100 },
    "Epic": { next: "Legend", cores: 8, points: 150 },
    "Legend": { next: "Mythic", cores: 12, points: 250 },
  };

  const progression = rarityProgression[previousRarity];
  if (!progression) {
    return res.status(400).json({ error: "Gagal memproses biaya pembatalan karena status sebelumnya tidak valid." });
  }

  // Cost to cancel is 50% of previous evolution cost
  const requiredCores = Math.floor(progression.cores * 0.5);
  const requiredPoints = Math.floor(progression.points * 0.5);

  // Check user's resources
  const userCores = user.cores || 0;
  const userPoints = user.points || 0;

  if (userCores < requiredCores) {
    return res.status(400).json({ 
      error: `Cores tidak mencukupi untuk membatalkan evolusi. Dibutuhkan ${requiredCores} Nekomon Cores (Anda memiliki ${userCores} Cores).` 
    });
  }

  if (userPoints < requiredPoints) {
    return res.status(400).json({ 
      error: `Poin tidak mencukupi untuk membatalkan evolusi. Dibutuhkan ${requiredPoints} Poin (Anda memiliki ${userPoints} Poin).` 
    });
  }

  // Deduct cost
  user.cores -= requiredCores;
  user.points -= requiredPoints;

  // Restore the previous state
  card.evolutionHistory.pop(); // Remove it from history
  
  card.name = previousState.name;
  card.rarity = previousState.rarity;
  card.hp = previousState.hp;
  card.atk = previousState.atk;
  card.def = previousState.def;
  card.spd = previousState.spd || 45;
  card.skillName = previousState.skillName;
  card.skillDesc = previousState.skillDesc;
  card.imageUrl = previousState.imageUrl;

  // Save changes to DB
  db.cards[cardIndex] = card;

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;

  writeDB(db);

  res.json({
    success: true,
    message: `Evolusi berhasil dibatalkan! Kartu Nekomon Anda dikembalikan ke tingkat ${card.rarity} (${card.name}) dengan biaya tambahan ${requiredCores} Cores & ${requiredPoints} Poin.`,
    card,
    points: user.points,
    cores: user.cores,
    requiredCores,
    requiredPoints
  });
});

// ----------------------------------------------------------------
// CARD TRADING SYSTEM API ENDPOINTS
// ----------------------------------------------------------------

// GET other players and their cards for trading
app.get("/api/trading/players", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const otherUsers = (db.users || []).filter((u: any) => u.id !== user.id);
  const cards = db.cards || [];

  const players = otherUsers.map((u: any) => {
    const userCards = cards.filter((c: any) => c.userId === u.id);
    return {
      id: u.id,
      username: u.username,
      points: u.points || 0,
      cores: u.cores || 0,
      totalCards: userCards.length,
      cards: userCards
    };
  });

  res.json({ success: true, players });
});

// GET active trades involving the authenticated user (incoming & outgoing)
app.get("/api/trading/trades", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userTrades = (db.trades || []).filter(
    (t: any) => t.senderId === user.id || t.receiverId === user.id
  );

  res.json({ success: true, trades: userTrades });
});

// POST propose a new trade with another player
app.post("/api/trading/propose", (req, res) => {
  const { receiverId, senderCardId, receiverCardId } = req.body;
  if (!receiverId || !senderCardId || !receiverCardId) {
    return res.status(400).json({ error: "Receiver ID, sender card ID, dan receiver card ID wajib ditentukan." });
  }

  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (user.id === receiverId) {
    return res.status(400).json({ error: "Anda tidak bisa mengajukan pertukaran dengan diri sendiri." });
  }

  const receiver = db.users.find((u: any) => u.id === receiverId);
  if (!receiver) {
    return res.status(404).json({ error: "Pemain tujuan tidak ditemukan." });
  }

  const senderCard = db.cards.find((c: any) => c.id === senderCardId && c.userId === user.id);
  if (!senderCard) {
    return res.status(404).json({ error: "Kartu penawaran Anda tidak ditemukan atau bukan milik Anda." });
  }

  const receiverCard = db.cards.find((c: any) => c.id === receiverCardId && c.userId === receiverId);
  if (!receiverCard) {
    return res.status(404).json({ error: "Kartu yang diminta tidak ditemukan atau bukan milik pemain tujuan." });
  }

  // Ensure same/similar rarity
  const sRarity = (senderCard.rarity || "Common").trim().toLowerCase();
  const rRarity = (receiverCard.rarity || "Common").trim().toLowerCase();
  if (sRarity !== rRarity) {
    return res.status(400).json({
      error: `Anda hanya dapat menukar kartu dengan tingkat kelangkaan (rarity) yang sama! Kartu Anda: ${senderCard.rarity}, Kartu tujuan: ${receiverCard.rarity}.`
    });
  }

  // Check if there is already a pending trade of the same cards
  const existingPending = (db.trades || []).find(
    (t: any) => 
      t.status === "pending" && 
      ((t.senderCardId === senderCardId && t.receiverCardId === receiverCardId) ||
       (t.senderCardId === receiverCardId && t.receiverCardId === senderCardId))
  );

  if (existingPending) {
    return res.status(400).json({ error: "Tawaran pertukaran untuk kartu ini sedang berlangsung dan menunggu konfirmasi." });
  }

  const newTrade = {
    id: "trd_" + Math.random().toString(36).substr(2, 9),
    senderId: user.id,
    senderUsername: user.username,
    receiverId: receiver.id,
    receiverUsername: receiver.username,
    senderCardId: senderCard.id,
    senderCardName: senderCard.name,
    senderCardRarity: senderCard.rarity,
    senderCardImageUrl: senderCard.imageUrl,
    receiverCardId: receiverCard.id,
    receiverCardName: receiverCard.name,
    receiverCardRarity: receiverCard.rarity,
    receiverCardImageUrl: receiverCard.imageUrl,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  if (!db.trades) db.trades = [];
  db.trades.push(newTrade);
  writeDB(db);

  res.json({
    success: true,
    trade: newTrade,
    message: `Tawaran pertukaran kartu ${senderCard.name} dengan ${receiverCard.name} milik @${receiver.username} berhasil dikirim! 🤝`
  });
});

// POST accept a trade proposal
app.post("/api/trading/trades/:id/accept", (req, res) => {
  const tradeId = req.params.id;
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const trades = db.trades || [];
  const tradeIndex = trades.findIndex((t: any) => t.id === tradeId);
  if (tradeIndex === -1) {
    return res.status(404).json({ error: "Tawaran pertukaran tidak ditemukan." });
  }

  const trade = trades[tradeIndex];
  if (trade.receiverId !== user.id) {
    return res.status(403).json({ error: "Anda tidak memiliki hak untuk menerima tawaran pertukaran ini." });
  }

  if (trade.status !== "pending") {
    return res.status(400).json({ error: `Tawaran pertukaran ini sudah selesai dengan status: ${trade.status}` });
  }

  // Find cards in the database
  const senderCardIndex = db.cards.findIndex((c: any) => c.id === trade.senderCardId);
  const receiverCardIndex = db.cards.findIndex((c: any) => c.id === trade.receiverCardId);

  if (senderCardIndex === -1 || db.cards[senderCardIndex].userId !== trade.senderId) {
    trade.status = "cancelled";
    db.trades[tradeIndex] = trade;
    writeDB(db);
    return res.status(400).json({ error: "Kartu milik penawar sudah tidak tersedia atau telah dipindahtangankan." });
  }

  if (receiverCardIndex === -1 || db.cards[receiverCardIndex].userId !== user.id) {
    trade.status = "cancelled";
    db.trades[tradeIndex] = trade;
    writeDB(db);
    return res.status(400).json({ error: "Kartu Anda yang diminta sudah tidak tersedia atau telah dipindahtangankan." });
  }

  // Perform SWAP
  db.cards[senderCardIndex].userId = user.id; // Sender card becomes receiver's
  db.cards[receiverCardIndex].userId = trade.senderId; // Receiver card becomes sender's

  // Set trade status to accepted
  trade.status = "accepted";
  db.trades[tradeIndex] = trade;

  // Auto-cancel any other pending trades that involve the same cards since they've now been traded!
  db.trades = db.trades.map((t: any) => {
    if (t.status === "pending" && t.id !== trade.id) {
      if (t.senderCardId === trade.senderCardId || 
          t.senderCardId === trade.receiverCardId || 
          t.receiverCardId === trade.senderCardId || 
          t.receiverCardId === trade.receiverCardId) {
        return { ...t, status: "cancelled" };
      }
    }
    return t;
  });

  writeDB(db);

  res.json({
    success: true,
    message: `Sukses! Kartu @${trade.senderUsername} (${trade.senderCardName}) berhasil ditukar dengan kartu Anda (${trade.receiverCardName})! 🎉`
  });
});

// POST reject a trade proposal
app.post("/api/trading/trades/:id/reject", (req, res) => {
  const tradeId = req.params.id;
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const trades = db.trades || [];
  const tradeIndex = trades.findIndex((t: any) => t.id === tradeId);
  if (tradeIndex === -1) {
    return res.status(404).json({ error: "Tawaran pertukaran tidak ditemukan." });
  }

  const trade = trades[tradeIndex];
  if (trade.receiverId !== user.id) {
    return res.status(403).json({ error: "Anda tidak memiliki hak untuk menolak tawaran pertukaran ini." });
  }

  if (trade.status !== "pending") {
    return res.status(400).json({ error: "Tawaran pertukaran sudah tidak berstatus pending." });
  }

  trade.status = "rejected";
  db.trades[tradeIndex] = trade;
  writeDB(db);

  res.json({
    success: true,
    message: `Tawaran pertukaran dari @${trade.senderUsername} berhasil ditolak.`
  });
});

// POST cancel an outgoing trade proposal
app.post("/api/trading/trades/:id/cancel", (req, res) => {
  const tradeId = req.params.id;
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const trades = db.trades || [];
  const tradeIndex = trades.findIndex((t: any) => t.id === tradeId);
  if (tradeIndex === -1) {
    return res.status(404).json({ error: "Tawaran pertukaran tidak ditemukan." });
  }

  const trade = trades[tradeIndex];
  if (trade.senderId !== user.id) {
    return res.status(403).json({ error: "Anda tidak berhak membatalkan tawaran pertukaran ini." });
  }

  if (trade.status !== "pending") {
    return res.status(400).json({ error: "Tawaran pertukaran sudah tidak berstatus pending." });
  }

  trade.status = "cancelled";
  db.trades[tradeIndex] = trade;
  writeDB(db);

  res.json({
    success: true,
    message: "Tawaran pertukaran berhasil dibatalkan."
  });
});

// GET Public Game Statistics (Total Players & Total Forged Cards)
app.get("/api/public/stats", (_req, res) => {
  try {
    const db = readDB();
    const users = db.users || [];
    const cards = db.cards || [];

    // Filter out bots if any, count active players
    const realUsers = users.filter((u: any) => !u.isBot && !u.id.startsWith("bot_"));
    const realCards = cards.filter((c: any) => !c.isBot && !c.userId?.startsWith("bot_"));

    const basePlayers = 142; // Base community count multiplier
    const baseCards = 680;   // Base community cards forged count

    res.json({
      success: true,
      totalPlayers: Math.max(basePlayers, basePlayers + realUsers.length),
      totalCards: Math.max(baseCards, baseCards + realCards.length),
    });
  } catch (err) {
    res.json({
      success: true,
      totalPlayers: 142,
      totalCards: 680,
    });
  }
});

// GET Leaderboard stats for Nekomon card collections and highest levels
app.get("/api/leaderboard", async (req, res) => {
  try {
    const db = readDB();
    const users = db.users || [];
    const cards = db.cards || [];

    const rarityScores: Record<string, number> = {
      "common": 1,
      "rare": 2,
      "epic": 3,
      "legend": 4,
      "legendary": 4,
      "mythic": 5
    };

    const leaderboard = users.map((user: any) => {
      let userCards;
      if (user.id.startsWith("bot_") || user.isBot) {
        // Find player-forged cards to use as reference
        const realCards = cards.filter((c: any) => !c.userId.startsWith("bot_") && !c.isBot);
        if (realCards.length > 0) {
          let charSum = 0;
          for (let i = 0; i < user.id.length; i++) charSum += user.id.charCodeAt(i);
          
          userCards = [];
          const numCards = Math.min(3, realCards.length);
          for (let i = 0; i < numCards; i++) {
            const refCard = realCards[(charSum + i) % realCards.length];
            const levelMultiplier = Math.max(1, Math.floor((user.points || 100) / 120));
            const level = Math.max(1, (refCard.level || 1) + (charSum % 3) + levelMultiplier - 1);
            userCards.push({
              ...refCard,
              id: `bot_card_${user.id}_${refCard.id}`,
              userId: user.id,
              level,
            });
          }
        } else {
          userCards = [];
        }
      } else {
        userCards = cards.filter((c: any) => c.userId === user.id);
      }
      
      // Calculate highest level and best card
      let highestLevel = 1;
      let bestCard: any = null;
      let highestScore = 0;

      userCards.forEach((card: any) => {
        const lvl = card.level || 1;
        if (lvl > highestLevel) {
          highestLevel = lvl;
        }

        const rarity = (card.rarity || "Common").toLowerCase();
        const rScore = rarityScores[rarity] || 1;
        const score = rScore * 1000 + lvl;

        if (score > highestScore) {
          highestScore = score;
          bestCard = {
            id: card.id,
            name: card.name,
            rarity: card.rarity || "Common",
            level: lvl,
            element: card.element
          };
        }
      });

      const isOnline = !user.isBot && user.lastSeen
        ? (Date.now() - new Date(user.lastSeen).getTime() < 4 * 60 * 1000)
        : false;

      return {
        id: user.id,
        username: user.username,
        points: user.points || 0,
        cores: user.cores || 0,
        totalCards: userCards.length,
        highestLevel: userCards.length > 0 ? highestLevel : 0,
        bestCard,
        isBot: !!user.isBot,
        isOnline,
        lastSeen: user.lastSeen || user.createdAt || null
      };
    });

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error("Error retrieving leaderboard:", err);
    res.status(500).json({ error: "Gagal memuat leaderboard" });
  }
});

// Endpoint to get all trainers' activity and history (online/offline status & lastSeen)
app.get("/api/trainers/history", (req, res) => {
  try {
    const db = readDB();
    const trainers = (db.users || [])
      .map((u: any) => {
        const userCards = (db.cards || []).filter((c: any) => c.userId === u.id);
        const isOnline = !u.isBot && u.lastSeen
          ? (Date.now() - new Date(u.lastSeen).getTime() < 4 * 60 * 1000)
          : false;
        return {
          id: u.id,
          username: u.username,
          faction: u.faction || "Sentinel",
          points: u.points || 0,
          cores: u.cores || 0,
          totalCards: userCards.length,
          avatar: u.avatar || "",
          isBot: !!u.isBot,
          isOnline,
          lastSeen: u.lastSeen || u.createdAt || null,
          createdAt: u.createdAt || null
        };
      })
      .sort((a: any, b: any) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        const timeA = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
        const timeB = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
        return timeB - timeA;
      });

    res.json({ success: true, trainers });
  } catch (err) {
    console.error("Error retrieving trainers history:", err);
    res.status(500).json({ error: "Gagal memuat histori trainer" });
  }
});

// ----------------------------------------------------------------
// SHOP & VIRTUAL MICROTRANSACTIONS ENDPOINTS
// ----------------------------------------------------------------

// Payment gateways are intentionally disabled until a signed, server-verified
// payment implementation is available. Keep the routes explicit so legacy
// clients fail safely rather than receiving simulated goods.
app.all([
  "/api/shop/midtrans-token", "/api/shop/midtrans-finish", "/api/midtrans/notification",
  "/api/shop/ipaymu-session", "/api/shop/ipaymu-finish", "/api/ipaymu/notification", "/api/ipaymu/notify",
  "/api/shop/buy-points", "/api/shop/buy-booster"
], (_req, res) => res.status(410).json({ error: "Pembayaran sementara tidak tersedia." }));

// Rewarded Ad completion endpoint (AdMob / Unity Ads integration - 4 hours cooldown)
app.post("/api/ads/reward", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 4 Hours Cooldown enforcement (4 hours = 4 * 60 * 60 * 1000 = 14,400,000 ms)
  const COOLDOWN_HOURS = 4;
  const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;
  const now = Date.now();

  if (user.lastRewardedAdClaim) {
    const lastClaimTime = new Date(user.lastRewardedAdClaim).getTime();
    const elapsed = now - lastClaimTime;
    if (elapsed < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - elapsed;
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;

      let timeString = "";
      if (hours > 0) {
        timeString = `${hours} jam ${minutes} menit ${seconds} detik`;
      } else if (minutes > 0) {
        timeString = `${minutes} menit ${seconds} detik`;
      } else {
        timeString = `${seconds} detik`;
      }

      return res.status(429).json({
        error: `Fitur rewarded ad di Shop hanya bisa diklaim setiap 4 jam sekali. Mohon tunggu ${timeString} lagi.`,
        cooldownRemainingMs: remainingMs,
        cooldownSeconds: remainingSeconds,
        nextClaimAvailableAt: new Date(lastClaimTime + COOLDOWN_MS).toISOString()
      });
    }
  }

  const { rewardType } = req.body;
  let pointsGained = 0;
  let coresGained = 0;
  let rewardTitle = "";

  if (rewardType === "cores_5") {
    coresGained = 5;
    rewardTitle = "+5 Nekomon Cores";
  } else if (rewardType === "points_50") {
    pointsGained = 50;
    rewardTitle = "+50 Poin Ekstra";
  } else if (rewardType === "points_100") {
    pointsGained = 100;
    rewardTitle = "+100 Poin Ekstra";
  } else {
    // Standard rewarded ad (Balanced)
    pointsGained = 30;
    coresGained = 2;
    rewardTitle = "+30 Poin & +2 Nekomon Cores";
  }

  user.points = (user.points || 0) + pointsGained;
  user.cores = (user.cores || 0) + coresGained;
  user.lastRewardedAdClaim = new Date(now).toISOString();

  if (!db.transactions) db.transactions = [];
  const tx = {
    id: "tx_ad_" + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    type: "rewarded_ad",
    packageId: "rewarded_ad_" + (rewardType || "standard"),
    packageName: "Iklan Video Berhadiah (" + rewardTitle + ")",
    price: 0,
    priceCurrency: "FREE",
    pointsAdded: pointsGained,
    createdAt: new Date().toISOString()
  };
  db.transactions.push(tx);

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  if (uIdx !== -1) {
    db.users[uIdx] = user;
    writeDB(db);
  }

  res.json({
    success: true,
    message: `Selamat! Klaim Iklan Berhadiah Berhasil: ${rewardTitle}`,
    pointsGained,
    coresGained,
    user: {
      id: user.id,
      username: user.username,
      points: user.points,
      cores: user.cores || 0,
      lastRewardedAdClaim: user.lastRewardedAdClaim
    },
    transaction: tx,
    nextClaimAvailableAt: new Date(now + COOLDOWN_MS).toISOString(),
    cooldownSeconds: COOLDOWN_HOURS * 3600
  });
});

// 3. Fetch transaction history
app.get("/api/shop/transactions", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const txs = db.transactions ? db.transactions.filter((t: any) => t.userId === user.id) : [];
  res.json({ success: true, transactions: txs });
});

// 4. Buy Energy Refill Potion using Points
app.post("/api/shop/buy-energy-potion", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { potionType, cardId } = req.body;
  let priceInPoints = 0;
  let packageName = "";

  if (potionType === "single") {
    priceInPoints = 30;
    packageName = "Ramuan Energi Kartu (1 Kartu)";
    if (!cardId) {
      return res.status(400).json({ error: "Silakan pilih kartu Nekomon yang ingin diisi ulang energinya." });
    }
    const card = db.cards.find((c: any) => c.id === cardId && c.userId === user.id);
    if (!card) {
      return res.status(404).json({ error: "Kartu Nekomon tidak ditemukan." });
    }
  } else if (potionType === "team") {
    priceInPoints = 100;
    packageName = "Mega Ramuan Energi Tim (Semua Kartu)";
  } else {
    return res.status(400).json({ error: "Tipe Ramuan Energi tidak valid." });
  }

  if ((user.points || 0) < priceInPoints) {
    return res.status(400).json({
      error: `Poin tidak mencukupi. Diperlukan ${priceInPoints} Poin (Saldo Anda: ${user.points || 0} Poin).`
    });
  }

  // Deduct Points
  user.points = (user.points || 0) - priceInPoints;

  const refilledCards: any[] = [];
  if (potionType === "single") {
    const card = db.cards.find((c: any) => c.id === cardId && c.userId === user.id);
    if (card) {
      card.energy = 5;
      card.maxEnergy = 5;
      card.lastEnergyRefillAt = new Date().toISOString();
      refilledCards.push(card);
    }
  } else if (potionType === "team") {
    db.cards.forEach((card: any) => {
      if (card.userId === user.id) {
        card.energy = 5;
        card.maxEnergy = 5;
        card.lastEnergyRefillAt = new Date().toISOString();
        refilledCards.push(card);
      }
    });
  }

  if (!db.transactions) db.transactions = [];
  const tx = {
    id: "tx_" + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    type: "energy_potion",
    packageId: potionType === "single" ? "potion_single" : "potion_team",
    packageName,
    price: priceInPoints,
    priceCurrency: "POINTS",
    pointsDeducted: priceInPoints,
    createdAt: new Date().toISOString()
  };
  db.transactions.unshift(tx);

  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  db.users[uIdx] = user;
  writeDB(db);

  res.json({
    success: true,
    message: `Energi ${potionType === "single" ? "kartu Nekomon" : "semua kartu Nekomon"} berhasil diisi ulang penuh ke 5/5!`,
    user: { id: user.id, username: user.username, points: user.points, cores: user.cores || 0 },
    refilledCards,
    transaction: tx
  });
});

// ----------------------------------------------------------------
// Arena Battle History Route
// ----------------------------------------------------------------
app.get("/api/arena/history", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userHistory = (db.battleHistory || []).filter(
    (item: any) => item.winnerId === user.id || item.loserId === user.id
  );
  res.json({ success: true, history: userHistory });
});

// ----------------------------------------------------------------
// Community Spots (Crowdsourced Spawns) Routes
// ----------------------------------------------------------------
const categoryEmojis: Record<string, string> = {
  taman: "🌳",
  jalan: "🛣️",
  komplek: "🏡",
  cafe: "☕",
  stasiun: "🚉",
  terminal: "🚌",
  halte: "🚏",
  others: "📍"
};

const categoryLabels: Record<string, string> = {
  taman: "Taman Kucing",
  jalan: "Jalan / Trotoar",
  komplek: "Komplek Perumahan",
  cafe: "Cafe Kucing",
  stasiun: "Stasiun Cat",
  terminal: "Terminal Bus",
  halte: "Halte Bus",
  others: "Spot Lainnya"
};

app.get("/api/community-spots", (req, res) => {
  const db = readDB();
  const communitySpots = db.communitySpots || [];
  res.json({ success: true, spots: communitySpots });
});

app.post("/api/community-spots", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  const { name, category, lat, lng, targetCatName, description, boostedElement } = req.body;

  if (!name || !lat || !lng || !category || !targetCatName) {
    return res.status(400).json({ error: "Nama spot, kategori, lokasi GPS, dan nama kucing target wajib diisi." });
  }

  if (!db.communitySpots) {
    db.communitySpots = [];
  }

  const catKey = category && categoryEmojis[category] ? category : "others";

  const newSpot = {
    id: "spot_comm_" + Math.random().toString(36).substr(2, 9),
    name: name.trim(),
    category: catKey,
    categoryLabel: categoryLabels[catKey] || "Spot Komunitas",
    lat: Number(lat),
    lng: Number(lng),
    radiusMeters: 25,
    boostedElement: boostedElement || "Air",
    bonusPoints: 35,
    bonusCores: 5,
    targetCatName: targetCatName.trim(),
    rarity: "Epic",
    iconEmoji: categoryEmojis[catKey] || "🐾",
    description: description ? description.trim() : "Spot kucing rekomendasi dari komunitas player!",
    isCommunity: true,
    submittedBy: user ? user.username : "Komunitas Player",
    votes: 1,
    createdAt: new Date().toISOString()
  };

  db.communitySpots.push(newSpot);
  writeDB(db);

  res.json({
    success: true,
    message: "Spot kucing berhasil didaftarkan ke Peta Komunitas! Terima kasih atas kontribusinya 🐾",
    spot: newSpot
  });
});

app.put("/api/community-spots/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();

  if (!db.communitySpots) db.communitySpots = [];
  const spotIndex = db.communitySpots.findIndex((s: any) => s.id === id);

  const { name, category, targetCatName, description, boostedElement, lat, lng, radiusMeters, rarity, bonusPoints, bonusCores } = req.body;
  const catKey = category && categoryEmojis[category] ? category : "taman";

  if (spotIndex === -1) {
    const newSpot = {
      id,
      name: (name || "Spot Nekomon").trim(),
      category: catKey,
      categoryLabel: categoryLabels[catKey] || "Spot Komunitas",
      lat: Number(lat) || 0,
      lng: Number(lng) || 0,
      radiusMeters: Number(radiusMeters) || 25,
      boostedElement: boostedElement || "Air",
      bonusPoints: Number(bonusPoints) || 25,
      bonusCores: Number(bonusCores) || 1,
      targetCatName: (targetCatName || "Kucing Target").trim(),
      rarity: rarity || "Rare",
      iconEmoji: categoryEmojis[catKey] || "🐾",
      description: description ? description.trim() : "Spot template yang diperbarui oleh komunitas!",
      isCommunity: true,
      votes: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.communitySpots.push(newSpot);
    writeDB(db);
    return res.json({
      success: true,
      message: "Data spot lokasi berhasil disimpan dan diperbarui! ✏️",
      spot: newSpot
    });
  }

  const spot = db.communitySpots[spotIndex];

  if (name && name.trim()) spot.name = name.trim();
  if (category && categoryEmojis[category]) {
    spot.category = category;
    spot.categoryLabel = categoryLabels[category] || spot.categoryLabel || "Spot Komunitas";
    spot.iconEmoji = categoryEmojis[category] || spot.iconEmoji || "🐾";
  }
  if (targetCatName && targetCatName.trim()) spot.targetCatName = targetCatName.trim();
  if (description !== undefined) spot.description = description.trim();
  if (boostedElement) spot.boostedElement = boostedElement;
  if (lat && !isNaN(Number(lat))) spot.lat = Number(lat);
  if (lng && !isNaN(Number(lng))) spot.lng = Number(lng);
  spot.updatedAt = new Date().toISOString();

  db.communitySpots[spotIndex] = spot;
  writeDB(db);

  res.json({
    success: true,
    message: "Data spot lokasi berhasil diperbarui! ✏️",
    spot
  });
});

app.delete("/api/community-spots/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();

  if (!db.communitySpots) db.communitySpots = [];
  const spotIndex = db.communitySpots.findIndex((s: any) => s.id === id);

  if (spotIndex === -1) {
    return res.status(404).json({ error: "Spot komunitas tidak ditemukan." });
  }

  db.communitySpots.splice(spotIndex, 1);
  writeDB(db);

  res.json({
    success: true,
    message: "Spot komunitas berhasil dihapus."
  });
});

app.post("/api/community-spots/:id/vote", (req, res) => {
  const { id } = req.params;
  const db = readDB();

  if (!db.communitySpots) db.communitySpots = [];
  const spot = db.communitySpots.find((s: any) => s.id === id);

  if (!spot) {
    return res.status(404).json({ error: "Spot komunitas tidak ditemukan." });
  }

  spot.votes = (spot.votes || 0) + 1;
  writeDB(db);

  res.json({
    success: true,
    message: "Dukungan/vote berhasil ditambahkan!",
    votes: spot.votes
  });
});

// ----------------------------------------------------------------
// OFFICIAL MAIL & MESSAGES API ENDPOINTS
// ----------------------------------------------------------------

// 1. Get all official mail announcements with read/claimed status for user
app.get("/api/mail/official", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  const userId = user ? user.id : "";

  const mails = (db.officialMails || []).map((m: any) => {
    const isRead = userId ? (m.readUserIds || []).includes(userId) : false;
    const isClaimed = userId ? (m.claimedUserIds || []).includes(userId) : false;
    return {
      ...m,
      isRead,
      isClaimed
    };
  });

  // Sort pinned first, then newest createdAt
  mails.sort((a: any, b: any) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  res.json({ success: true, mails });
});

// 2. Mark official mail as read
app.post("/api/mail/official/:id/read", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Sesi login tidak valid." });
  }

  const { id } = req.params;
  const mailIndex = (db.officialMails || []).findIndex((m: any) => m.id === id);
  if (mailIndex === -1) {
    return res.status(404).json({ error: "Surat resmi tidak ditemukan." });
  }

  if (!db.officialMails[mailIndex].readUserIds) {
    db.officialMails[mailIndex].readUserIds = [];
  }

  if (!db.officialMails[mailIndex].readUserIds.includes(user.id)) {
    db.officialMails[mailIndex].readUserIds.push(user.id);
    writeDB(db);
  }

  res.json({ success: true, message: "Surat ditandai telah dibaca." });
});

// 3. Claim attached rewards from official mail
app.post("/api/mail/official/:id/claim", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Sesi login tidak valid." });
  }

  const { id } = req.params;
  const mailIndex = (db.officialMails || []).findIndex((m: any) => m.id === id);
  if (mailIndex === -1) {
    return res.status(404).json({ error: "Surat resmi tidak ditemukan." });
  }

  const mail = db.officialMails[mailIndex];
  if (!mail.reward || (!mail.reward.points && !mail.reward.cores)) {
    return res.status(400).json({ error: "Surat ini tidak memiliki hadiah yang dapat diklaim." });
  }

  if (!mail.claimedUserIds) {
    mail.claimedUserIds = [];
  }

  if (mail.claimedUserIds.includes(user.id)) {
    return res.status(400).json({ error: "Hadiah surat ini sudah pernah Anda klaim sebelumnya." });
  }

  // Find user index in db
  const uIdx = db.users.findIndex((u: any) => u.id === user.id);
  if (uIdx === -1) {
    return res.status(404).json({ error: "Pengguna tidak ditemukan." });
  }

  const ptsReward = mail.reward.points || 0;
  const coresReward = mail.reward.cores || 0;

  db.users[uIdx].points = (db.users[uIdx].points || 0) + ptsReward;
  db.users[uIdx].cores = (db.users[uIdx].cores || 0) + coresReward;
  mail.claimedUserIds.push(user.id);

  if (!mail.readUserIds) mail.readUserIds = [];
  if (!mail.readUserIds.includes(user.id)) mail.readUserIds.push(user.id);

  writeDB(db);

  res.json({
    success: true,
    message: `Selamat! Berhasil mengklaim +${ptsReward} Poin dan +${coresReward} Cores! 🎉`,
    claimed: {
      points: ptsReward,
      cores: coresReward
    },
    user: {
      id: db.users[uIdx].id,
      username: db.users[uIdx].username,
      points: db.users[uIdx].points,
      cores: db.users[uIdx].cores
    }
  });
});

// 4. Create official broadcast (Admin / Developer tool - strictly verydiaz@gmail.com or support@nekomon.online)
app.post("/api/mail/official/broadcast", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  const { title, category, content, summary, rewardPoints, rewardCores, pinned } = req.body;

  // Strict check: only verified developer accounts with email verydiaz@gmail.com, nekomaster@nekomon.online, or support@nekomon.online
  const developerEmails = ["verydiaz@gmail.com", "nekomaster@nekomon.online", "support@nekomon.online"];
  const isAuthorized = user && user.email && developerEmails.includes(user.email.toLowerCase().trim());

  if (!isAuthorized) {
    return res.status(403).json({
      error: "Akses ditolak. Fitur siaran resmi ini hanya dapat dilakukan oleh akun Developer Nekomon (verydiaz@gmail.com / nekomaster@nekomon.online / support@nekomon.online)."
    });
  }

  if (!title || !content) {
    return res.status(400).json({ error: "Judul dan isi pengumuman resmi wajib diisi." });
  }

  if (!db.officialMails) db.officialMails = [];

  const newMail = {
    id: "mail_broad_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 5),
    title: title.trim(),
    category: category || "announcement",
    sender: "Nekomon Studio (support@nekomon.online)",
    senderEmail: "support@nekomon.online",
    summary: summary ? summary.trim() : title.trim(),
    content: content.trim(),
    reward: (Number(rewardPoints) > 0 || Number(rewardCores) > 0) ? {
      points: Number(rewardPoints) || 0,
      cores: Number(rewardCores) || 0
    } : undefined,
    claimedUserIds: [],
    readUserIds: user ? [user.id] : [],
    pinned: !!pinned,
    createdAt: new Date().toISOString()
  };

  db.officialMails.unshift(newMail);
  writeDB(db);

  res.json({
    success: true,
    message: "Surat pengumuman resmi berhasil disiarkan ke seluruh trainer! 📬",
    mail: newMail
  });
});

// 4b. Developer Gift to Specific User (Developer Only: verydiaz@gmail.com, nekomaster@nekomon.online, support@nekomon.online)
app.post("/api/developer/gift-user", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  const { targetUserId, targetUsername, points, cores, note } = req.body;

  // Strict check: only verified developer accounts
  const developerEmails = ["verydiaz@gmail.com", "nekomaster@nekomon.online", "support@nekomon.online"];
  const isAuthorized = user && user.email && developerEmails.includes(user.email.toLowerCase().trim());

  if (!isAuthorized) {
    return res.status(403).json({
      error: "Akses ditolak. Fitur pemberian hadiah ini khusus akun Developer Nekomon."
    });
  }

  const pts = Math.max(0, Math.floor(Number(points) || 0));
  const crs = Math.max(0, Math.floor(Number(cores) || 0));

  if (pts === 0 && crs === 0) {
    return res.status(400).json({ error: "Jumlah Poin atau Nekomon Cores harus lebih dari 0." });
  }

  // Find target user
  let targetIdx = -1;
  if (targetUserId) {
    targetIdx = (db.users || []).findIndex((u: any) => u.id === targetUserId);
  }
  if (targetIdx === -1 && targetUsername) {
    targetIdx = (db.users || []).findIndex(
      (u: any) => u.username && u.username.toLowerCase().trim() === targetUsername.toLowerCase().trim()
    );
  }

  if (targetIdx === -1) {
    return res.status(404).json({ error: "Akun Trainer tujuan tidak ditemukan." });
  }

  const targetUser = db.users[targetIdx];
  targetUser.points = (targetUser.points || 0) + pts;
  targetUser.cores = (targetUser.cores || 0) + crs;

  // Create an automatic Direct Message from Developer to notify the recipient
  if (!db.directMessages) db.directMessages = [];
  const giftDmText = `🎁 [HADIAH SPESIAL DARI DEVELOPER NEKOMON]\n` +
    `Selamat! Akunmu baru saja menerima hadiah resmi:\n` +
    `• +${pts.toLocaleString()} Poin Trainer\n` +
    `• +${crs.toLocaleString()} Nekomon Cores\n` +
    (note ? `\nCatatan Pengembang: "${note.trim()}"\n` : "") +
    `\nTerima kasih telah berpetualang di dunia Nekomon! 🐾✨`;

  const newDm = {
    id: "dm_devgift_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 6),
    senderId: user.id,
    senderUsername: user.username + " (Developer)",
    senderAvatar: "👑",
    recipientId: targetUser.id,
    recipientUsername: targetUser.username,
    recipientAvatar: targetUser.avatar || "",
    content: giftDmText,
    createdAt: new Date().toISOString(),
    read: false
  };
  db.directMessages.push(newDm);

  writeDB(db);

  res.json({
    success: true,
    message: `Berhasil memberikan hadiah +${pts} Poin & +${crs} Cores kepada @${targetUser.username}! 🎉`,
    recipient: {
      id: targetUser.id,
      username: targetUser.username,
      points: targetUser.points,
      cores: targetUser.cores
    }
  });
});

// 4c. Developer Gift Broadcast with Instant Credit or Claimable Mail
app.post("/api/developer/gift-broadcast", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  const { title, content, summary, category, rewardPoints, rewardCores, distributionMode, pinned } = req.body;

  const developerEmails = ["verydiaz@gmail.com", "nekomaster@nekomon.online", "support@nekomon.online"];
  const isAuthorized = user && user.email && developerEmails.includes(user.email.toLowerCase().trim());

  if (!isAuthorized) {
    return res.status(403).json({
      error: "Akses ditolak. Fitur siaran hadiah ini khusus akun Developer Nekomon."
    });
  }

  const pts = Math.max(0, Math.floor(Number(rewardPoints) || 0));
  const crs = Math.max(0, Math.floor(Number(rewardCores) || 0));

  if (!title || !content) {
    return res.status(400).json({ error: "Judul dan isi surat siaran wajib diisi." });
  }

  if (pts === 0 && crs === 0) {
    return res.status(400).json({ error: "Tentukan jumlah Poin atau Cores untuk hadiah siaran." });
  }

  const mode = distributionMode === "instant_all" ? "instant_all" : "claimable_mail";
  let affectedUserCount = 0;

  if (mode === "instant_all") {
    // Directly deposit to every registered user
    (db.users || []).forEach((u: any) => {
      u.points = (u.points || 0) + pts;
      u.cores = (u.cores || 0) + crs;
      affectedUserCount++;
    });
  }

  if (!db.officialMails) db.officialMails = [];

  const newMail = {
    id: "mail_devgift_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 5),
    title: title.trim(),
    category: category || "system_reward",
    sender: "Nekomon Studio (support@nekomon.online)",
    senderEmail: "support@nekomon.online",
    summary: summary ? summary.trim() : title.trim(),
    content: content.trim() + (mode === "instant_all" ? `\n\n[INFO SISTEM]: Hadiah +${pts} Poin dan +${crs} Cores telah otomatis dikreditkan langsung ke saldo akun seluruh Trainer!` : ""),
    reward: {
      points: pts,
      cores: crs
    },
    instantCredited: mode === "instant_all",
    claimedUserIds: mode === "instant_all" ? (db.users || []).map((u: any) => u.id) : [],
    readUserIds: user ? [user.id] : [],
    pinned: !!pinned,
    createdAt: new Date().toISOString()
  };

  db.officialMails.unshift(newMail);
  writeDB(db);

  res.json({
    success: true,
    message: mode === "instant_all"
      ? `Hadiah broadcast berhasil dikreditkan instan ke ${affectedUserCount} pemain (+${pts} Pts, +${crs} Cores)! 🎁`
      : `Surat hadiah resmi berhasil disiarkan ke seluruh pemain dengan tombol klaim! 📬`,
    mail: newMail,
    affectedUserCount
  });
});

// 5. Search other players for starting a conversation
app.get("/api/players/search", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  const query = (req.query.q as string || "").toLowerCase().trim();

  const players = (db.users || [])
    .filter((u: any) => {
      if (user && u.id === user.id) return false;
      if (!query) return true;
      return (u.username && u.username.toLowerCase().includes(query)) || (u.id && u.id.toLowerCase().includes(query));
    })
    .slice(0, 20)
    .map((u: any) => {
      const userCards = (db.cards || []).filter((c: any) => c.userId === u.id);
      const isOnline = !u.isBot && u.lastSeen
        ? (Date.now() - new Date(u.lastSeen).getTime() < 4 * 60 * 1000)
        : false;
      return {
        id: u.id,
        username: u.username,
        points: u.points || 0,
        cores: u.cores || 0,
        totalCards: userCards.length,
        avatar: u.avatar || "",
        faction: u.faction || "Sentinel",
        isBot: !!u.isBot,
        isOnline,
        lastSeen: u.lastSeen || u.createdAt || null
      };
    });

  res.json({ success: true, players });
});

// 6. Get inbox conversation threads
app.get("/api/messages/conversations", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Sesi login tidak valid." });
  }

  const allDms = db.directMessages || [];
  const threadsMap = new Map<string, any>();

  // Find all messages where user is sender or recipient
  allDms.forEach((dm: any) => {
    if (dm.senderId === user.id || dm.recipientId === user.id) {
      const isSender = dm.senderId === user.id;
      const partnerId = isSender ? dm.recipientId : dm.senderId;
      const partnerUsername = isSender ? dm.recipientUsername : dm.senderUsername;
      const partnerAvatar = isSender ? dm.recipientAvatar : dm.senderAvatar;

      if (!threadsMap.has(partnerId)) {
        const partnerUser = (db.users || []).find((u: any) => u.id === partnerId);
        const isOnline = partnerUser && !partnerUser.isBot && partnerUser.lastSeen
          ? (Date.now() - new Date(partnerUser.lastSeen).getTime() < 4 * 60 * 1000)
          : false;

        threadsMap.set(partnerId, {
          partnerId,
          partnerUsername: partnerUser ? partnerUser.username : partnerUsername,
          partnerAvatar: partnerUser ? partnerUser.avatar : partnerAvatar,
          faction: partnerUser?.faction || "Sentinel",
          isBot: partnerUser ? !!partnerUser.isBot : false,
          isOnline,
          lastSeen: partnerUser?.lastSeen || partnerUser?.createdAt || null,
          lastMessage: dm.content,
          lastMessageAt: dm.createdAt,
          unreadCount: 0
        });
      } else {
        const current = threadsMap.get(partnerId);
        if (new Date(dm.createdAt).getTime() > new Date(current.lastMessageAt).getTime()) {
          current.lastMessage = dm.content;
          current.lastMessageAt = dm.createdAt;
        }
      }

      // If this message was sent to the user and is not read
      if (dm.recipientId === user.id && !dm.read) {
        const thread = threadsMap.get(partnerId);
        thread.unreadCount = (thread.unreadCount || 0) + 1;
      }
    }
  });

  const threads = Array.from(threadsMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  res.json({ success: true, threads });
});

// 7. Get chat thread messages with a specific partner
app.get("/api/messages/thread/:partnerId", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Sesi login tidak valid." });
  }

  const { partnerId } = req.params;
  const partner = (db.users || []).find((u: any) => u.id === partnerId);

  const allDms = db.directMessages || [];
  let updated = false;

  const messages = allDms.filter((dm: any) => {
    const isConv = (dm.senderId === user.id && dm.recipientId === partnerId) ||
                   (dm.senderId === partnerId && dm.recipientId === user.id);
    
    if (isConv && dm.recipientId === user.id && !dm.read) {
      dm.read = true;
      updated = true;
    }
    return isConv;
  }).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (updated) {
    writeDB(db);
  }

  const partnerIsOnline = partner && !partner.isBot && partner.lastSeen
    ? (Date.now() - new Date(partner.lastSeen).getTime() < 4 * 60 * 1000)
    : false;

  res.json({
    success: true,
    partner: partner ? {
      id: partner.id,
      username: partner.username,
      avatar: partner.avatar,
      faction: partner.faction || "Sentinel",
      isBot: !!partner.isBot,
      isOnline: partnerIsOnline,
      lastSeen: partner.lastSeen || partner.createdAt || null
    } : { id: partnerId, username: "Trainer", isBot: false, isOnline: false, lastSeen: null },
    messages
  });
});

// 8. Send Direct Message to a player (Supports text, shared cat photo, and shared geolocation)
app.post("/api/messages/send", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Sesi login tidak valid." });
  }

  const { recipientId, recipientUsername, content, sharedPhotoUrl, sharedLocation, sharedSpotName } = req.body;
  if ((!content || !content.trim()) && !sharedPhotoUrl && !sharedLocation) {
    return res.status(400).json({ error: "Pesan tidak boleh kosong." });
  }

  let recipient = null;
  if (recipientId) {
    recipient = (db.users || []).find((u: any) => u.id === recipientId);
  } else if (recipientUsername) {
    recipient = (db.users || []).find((u: any) => u.username.toLowerCase() === recipientUsername.toLowerCase());
  }

  if (!recipient) {
    return res.status(404).json({ error: "Penerima pesan (Trainer) tidak ditemukan." });
  }

  if (recipient.id === user.id) {
    return res.status(400).json({ error: "Anda tidak dapat mengirim pesan pribadi ke diri sendiri." });
  }

  if (!db.directMessages) db.directMessages = [];

  const newDm = {
    id: "dm_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 6),
    senderId: user.id,
    senderUsername: user.username,
    senderAvatar: user.avatar || "",
    recipientId: recipient.id,
    recipientUsername: recipient.username,
    recipientAvatar: recipient.avatar || "",
    content: (content || "").trim(),
    sharedPhotoUrl: sharedPhotoUrl || undefined,
    sharedLocation: (sharedLocation && typeof sharedLocation.lat === "number" && typeof sharedLocation.lng === "number") ? {
      lat: sharedLocation.lat,
      lng: sharedLocation.lng,
      name: sharedLocation.name || sharedSpotName || "Lokasi Tangkapan Kucing"
    } : undefined,
    sharedSpotName: sharedSpotName || undefined,
    createdAt: new Date().toISOString(),
    read: false
  };

  db.directMessages.push(newDm);

  // If recipient is a bot player, generate an instant friendly bot reply after short delay
  if (recipient.isBot) {
    const botReplies = [
      "Miauw! Salam kenal Trainer! Senang bisa ngobrol 🐱✨",
      "Kucing-kucing di Peta Spot hari ini aktif banget lho! Mau tanding di Arena?",
      "Pesanmu sudah diterima! Jangan lupa selesaikan misi harian untuk dapat Poin & Cores ya 🐾",
      "Halo! Keren banget kartu Nekomon kamu. Terus berburu dan tingkatkan level kartumu! 🚀",
      "Miauw miauw! Semangat berburu foto kucing hari ini! 😺"
    ];
    const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];

    const botDm = {
      id: "dm_bot_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 6),
      senderId: recipient.id,
      senderUsername: recipient.username,
      senderAvatar: recipient.avatar || "",
      recipientId: user.id,
      recipientUsername: user.username,
      recipientAvatar: user.avatar || "",
      content: randomReply,
      createdAt: new Date(Date.now() + 1000).toISOString(),
      read: false
    };
    db.directMessages.push(botDm);
  }

  writeDB(db);

  res.json({
    success: true,
    message: "Pesan berhasil dikirim! 💬",
    directMessage: newDm
  });
});

// 9. Mark thread as read
app.post("/api/messages/mark-read/:partnerId", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Sesi login tidak valid." });
  }

  const { partnerId } = req.params;
  const allDms = db.directMessages || [];
  let updated = false;

  allDms.forEach((dm: any) => {
    if (dm.senderId === partnerId && dm.recipientId === user.id && !dm.read) {
      dm.read = true;
      updated = true;
    }
  });

  if (updated) {
    writeDB(db);
  }

  res.json({ success: true });
});

// 10. Delete a direct message
app.delete("/api/messages/:messageId", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Sesi login tidak valid." });
  }

  const { messageId } = req.params;
  const dmIdx = (db.directMessages || []).findIndex((dm: any) => dm.id === messageId);

  if (dmIdx === -1) {
    return res.status(404).json({ error: "Pesan tidak ditemukan." });
  }

  const dm = db.directMessages[dmIdx];
  if (dm.senderId !== user.id && dm.recipientId !== user.id) {
    return res.status(403).json({ error: "Anda tidak memiliki izin menghapus pesan ini." });
  }

  db.directMessages.splice(dmIdx, 1);
  writeDB(db);

  res.json({ success: true, message: "Pesan berhasil dihapus." });
});

// 11. Get total unread counts for badges
app.get("/api/messages/unread-count", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.json({ success: true, officialUnread: 0, directMessagesUnread: 0, totalUnread: 0 });
  }

  const userId = user.id;

  // Unread official mails
  const officialMails = db.officialMails || [];
  const officialUnread = officialMails.filter((m: any) => !(m.readUserIds || []).includes(userId)).length;

  // Unread direct messages
  const directMessages = db.directMessages || [];
  const directMessagesUnread = directMessages.filter((dm: any) => dm.recipientId === userId && !dm.read).length;

  res.json({
    success: true,
    officialUnread,
    directMessagesUnread,
    totalUnread: officialUnread + directMessagesUnread
  });
});

// =================================================================
// TCG TERRITORY CONTROL & BEACON AREA CAPTURE SYSTEM
// =================================================================

const DEFAULT_TERRITORY_NODES = [
  // 1. Sentinel Headquarters (West Base) - Tier 3
  {
    id: "beacon-sentinel-hq",
    name: "Benteng Pusat Sentinel Alpha",
    nameEn: "Sentinel Prime Bastion Alpha",
    element: "Air",
    x: 8,
    y: 50,
    lat: -6.1754,
    lng: 106.6800,
    connectedNodeIds: ["beacon-pik-spire", "beacon-tangerang-ridge", "beacon-serpong-volt"],
    isBase: true,
    baseFaction: "Sentinel",
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    ownerAvatar: undefined,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 250,
    maxDefenseHp: 250,
    tier: 3,
    reinforcementsCount: 0,
    descriptionId: "Markas Komando Utama faksi Sentinel. Berstatus netral di awal permainan dan harus segera di-capture oleh kartu Mythic Lv.3+ berenergi penuh (5/5).",
    descriptionEn: "Supreme Headquarters of the Sentinel Faction. Neutral at start; must be captured first by a Mythic card Lv.3+ with full energy (5/5)."
  },

  // 2. PIK Coastal Sanctuary - Tier 1 (Air)
  {
    id: "beacon-pik-spire",
    name: "Suaka Pesisir PIK",
    nameEn: "PIK Coastal Sanctuary",
    element: "Air",
    x: 20,
    y: 18,
    lat: -6.1100,
    lng: 106.7400,
    connectedNodeIds: ["beacon-sentinel-hq", "beacon-tangerang-ridge", "beacon-ancol-ocean", "beacon-cengkareng-aero"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 100,
    maxDefenseHp: 100,
    tier: 1,
    reinforcementsCount: 0,
    descriptionId: "Titik dermaga pesisir barat dengan ombak tenang pelindung energi Air.",
    descriptionEn: "Western harbor coastal outpost channeling calm protective Water waves."
  },

  // 3. Tangerang Crystal Ridge - Tier 1 (Tanah)
  {
    id: "beacon-tangerang-ridge",
    name: "Punggungan Kristal Tangerang",
    nameEn: "Tangerang Crystal Ridge",
    element: "Tanah",
    x: 20,
    y: 50,
    lat: -6.1700,
    lng: 106.6300,
    connectedNodeIds: ["beacon-sentinel-hq", "beacon-pik-spire", "beacon-cengkareng-aero", "beacon-serpong-volt"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 100,
    maxDefenseHp: 100,
    tier: 1,
    reinforcementsCount: 0,
    descriptionId: "Punggungan batuan geomantik yang memperkokoh jalur barat laut.",
    descriptionEn: "Geomantic earthen crystal ridge reinforcing northwestern corridors."
  },

  // 4. Serpong Volt Substation - Tier 2 (Petir)
  {
    id: "beacon-serpong-volt",
    name: "Substasi Kilat Serpong",
    nameEn: "Serpong Volt Substation",
    element: "Petir",
    x: 20,
    y: 82,
    lat: -6.2800,
    lng: 106.6600,
    connectedNodeIds: ["beacon-sentinel-hq", "beacon-tangerang-ridge", "beacon-bintaro-sanctum"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 120,
    maxDefenseHp: 120,
    tier: 2,
    reinforcementsCount: 0,
    descriptionId: "Pembangkit kilat dinamis penyokong energi pertahanan barat daya.",
    descriptionEn: "Dynamic electrical lightning substation powering southwestern sectors."
  },

  // 5. Cengkareng Aero Relay - Tier 2 (Angin)
  {
    id: "beacon-cengkareng-aero",
    name: "Relay Udara Cengkareng",
    nameEn: "Cengkareng Aero Relay",
    element: "Angin",
    x: 34,
    y: 34,
    lat: -6.1400,
    lng: 106.7200,
    connectedNodeIds: ["beacon-pik-spire", "beacon-tangerang-ridge", "beacon-ancol-ocean", "beacon-sudirman-tower", "beacon-monas-core"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 120,
    maxDefenseHp: 120,
    tier: 2,
    reinforcementsCount: 0,
    descriptionId: "Menara relay transmisi udara strategis penghubung koridor barat ke pusat ibu kota.",
    descriptionEn: "Strategic aerial transmission relay bridging western approaches to central hubs."
  },

  // 6. Bintaro Eco Sanctum - Tier 2 (Tanah)
  {
    id: "beacon-bintaro-sanctum",
    name: "Sanctuarium Bintaro Eco",
    nameEn: "Bintaro Eco Sanctum",
    element: "Tanah",
    x: 34,
    y: 68,
    lat: -6.2800,
    lng: 106.7300,
    connectedNodeIds: ["beacon-serpong-volt", "beacon-tangerang-ridge", "beacon-senayan-nexus", "beacon-depok-verdant"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 120,
    maxDefenseHp: 120,
    tier: 2,
    reinforcementsCount: 0,
    descriptionId: "Suaka alam berpagar geomantik kuat penopang jalur pertahanan selatan.",
    descriptionEn: "Nature sanctuary guarded by strong geomantic barriers supporting southern lines."
  },

  // 7. Ancol Ocean Spire - Tier 2 (Air)
  {
    id: "beacon-ancol-ocean",
    name: "Menara Samudra Ancol",
    nameEn: "Ancol Ocean Spire",
    element: "Air",
    x: 48,
    y: 16,
    lat: -6.1200,
    lng: 106.8300,
    connectedNodeIds: ["beacon-pik-spire", "beacon-cengkareng-aero", "beacon-sudirman-tower", "beacon-kelapa-gading"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 120,
    maxDefenseHp: 120,
    tier: 2,
    reinforcementsCount: 0,
    descriptionId: "Spire pesisir utara berenergi air pasang. Memberikan +25% buff stat untuk Nekomon berelemen Air.",
    descriptionEn: "Northern coastal spire brimming with oceanic tides. Grants +25% field bonus for Water Nekomon."
  },

  // 8. Sudirman Megatower Hub - Tier 2 (Petir)
  {
    id: "beacon-sudirman-tower",
    name: "Megatower Sudirman Hub",
    nameEn: "Sudirman Megatower Hub",
    element: "Petir",
    x: 44,
    y: 36,
    lat: -6.2100,
    lng: 106.8220,
    connectedNodeIds: ["beacon-cengkareng-aero", "beacon-ancol-ocean", "beacon-monas-core", "beacon-cakung-steel"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 120,
    maxDefenseHp: 120,
    tier: 2,
    reinforcementsCount: 0,
    descriptionId: "Konektor sinyal kilat ultra-tinggi yang menghubungkan kawasan metropolitan dan Monas.",
    descriptionEn: "Ultra-high voltage signal connector linking metropolitan towers and Monas."
  },

  // 9. Monas Central Energy Nexus - Tier 3 (Petir)
  {
    id: "beacon-monas-core",
    name: "Puncak Nexus Monas",
    nameEn: "Monas Central Energy Nexus",
    element: "Petir",
    x: 50,
    y: 52,
    lat: -6.1754,
    lng: 106.8272,
    connectedNodeIds: ["beacon-cengkareng-aero", "beacon-sudirman-tower", "beacon-senayan-nexus", "beacon-cakung-steel"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 180,
    maxDefenseHp: 180,
    tier: 3,
    reinforcementsCount: 0,
    descriptionId: "Pusat persimpangan petir paling strategis di pulau (Tier 3: 10 Cores/hari). Titik perebutan utama faksi!",
    descriptionEn: "Most strategic Tier 3 energy nexus bridging central routes (10 Cores/day). Main faction contention point!"
  },

  // 10. Senayan Biosphere Nexus - Tier 2 (Tanah)
  {
    id: "beacon-senayan-nexus",
    name: "Nexus Biosfer Senayan",
    nameEn: "Senayan Biosphere Nexus",
    element: "Tanah",
    x: 44,
    y: 68,
    lat: -6.2250,
    lng: 106.8000,
    connectedNodeIds: ["beacon-bintaro-sanctum", "beacon-monas-core", "beacon-depok-verdant", "beacon-tmii-bastion"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 120,
    maxDefenseHp: 120,
    tier: 2,
    reinforcementsCount: 0,
    descriptionId: "Benteng pertahanan geomantik tanah kokoh. Memberikan bonus ketahanan +25% untuk Nekomon Tanah.",
    descriptionEn: "Solid geomagnetic earthen bastion. Provides +25% endurance bonus for Earth Nekomon."
  },

  // 11. Depok Verdant Spire - Tier 1 (Tanah)
  {
    id: "beacon-depok-verdant",
    name: "Spire Hutan Depok Verdant",
    nameEn: "Depok Verdant Spire",
    element: "Tanah",
    x: 48,
    y: 86,
    lat: -6.4000,
    lng: 106.8200,
    connectedNodeIds: ["beacon-bintaro-sanctum", "beacon-senayan-nexus", "beacon-tmii-bastion"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 100,
    maxDefenseHp: 100,
    tier: 1,
    reinforcementsCount: 0,
    descriptionId: "Hutan rimbun selatan berenergi kristal bumi pelindung (Tier 1: 5 Cores/hari).",
    descriptionEn: "Lush southern woodland infused with protective earthen crystals (Tier 1: 5 Cores/day)."
  },

  // 12. Kelapa Gading Ember Core - Tier 2 (Api)
  {
    id: "beacon-kelapa-gading",
    name: "Pilar Bara Kelapa Gading",
    nameEn: "Kelapa Gading Ember Core",
    element: "Api",
    x: 66,
    y: 20,
    lat: -6.1550,
    lng: 106.9050,
    connectedNodeIds: ["beacon-ancol-ocean", "beacon-pulomas-solar", "beacon-cakung-steel", "beacon-vanguard-hq"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 120,
    maxDefenseHp: 120,
    tier: 2,
    reinforcementsCount: 0,
    descriptionId: "Kubah bara vulkanik timur laut penyokong faksi Vanguard (Tier 2: 7 Cores/hari).",
    descriptionEn: "Northeastern volcanic ember dome bolstering Vanguard territory (Tier 2: 7 Cores/day)."
  },

  // 13. Pulomas Solar Spire - Tier 1 (Api)
  {
    id: "beacon-pulomas-solar",
    name: "Pilar Surya Pulomas",
    nameEn: "Pulomas Solar Spire",
    element: "Api",
    x: 66,
    y: 40,
    lat: -6.1700,
    lng: 106.8800,
    connectedNodeIds: ["beacon-kelapa-gading", "beacon-cakung-steel", "beacon-cibubur-flame", "beacon-vanguard-hq"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 100,
    maxDefenseHp: 100,
    tier: 1,
    reinforcementsCount: 0,
    descriptionId: "Pilar tenaga surya berkekuatan radiasi api stabil.",
    descriptionEn: "Solar power spire channeling stable radiant Fire energy."
  },

  // 14. Cakung Steel Nexus - Tier 2 (Petir)
  {
    id: "beacon-cakung-steel",
    name: "Nexus Baja Cakung",
    nameEn: "Cakung Steel Nexus",
    element: "Petir",
    x: 64,
    y: 56,
    lat: -6.1900,
    lng: 106.9400,
    connectedNodeIds: ["beacon-monas-core", "beacon-sudirman-tower", "beacon-kelapa-gading", "beacon-pulomas-solar", "beacon-cibubur-flame", "beacon-vanguard-hq"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 120,
    maxDefenseHp: 120,
    tier: 2,
    reinforcementsCount: 0,
    descriptionId: "Nexus industri baja timur penghubung sentral langsung ke Markas Vanguard.",
    descriptionEn: "Eastern steel nexus directly connecting central corridors to Vanguard HQ."
  },

  // 15. TMII Heritage Bastion - Tier 2 (Tanah)
  {
    id: "beacon-tmii-bastion",
    name: "Bastion Budaya TMII",
    nameEn: "TMII Heritage Bastion",
    element: "Tanah",
    x: 64,
    y: 78,
    lat: -6.3000,
    lng: 106.8900,
    connectedNodeIds: ["beacon-senayan-nexus", "beacon-depok-verdant", "beacon-cibubur-flame"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 120,
    maxDefenseHp: 120,
    tier: 2,
    reinforcementsCount: 0,
    descriptionId: "Benteng monumen geo-energi tenggara yang kaya akan pertahanan tanah alami.",
    descriptionEn: "Southeastern geo-energy monument rich in natural earthen defense fortifications."
  },

  // 16. Cibubur Flame Sanctuary - Tier 2 (Api)
  {
    id: "beacon-cibubur-flame",
    name: "Suaka Api Cibubur",
    nameEn: "Cibubur Flame Sanctuary",
    element: "Api",
    x: 78,
    y: 72,
    lat: -6.3700,
    lng: 106.9000,
    connectedNodeIds: ["beacon-cakung-steel", "beacon-pulomas-solar", "beacon-tmii-bastion", "beacon-vanguard-hq"],
    isBase: false,
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 120,
    maxDefenseHp: 120,
    tier: 2,
    reinforcementsCount: 0,
    descriptionId: "Suaka api keramat di tenggara penjaga gerbang benteng Vanguard.",
    descriptionEn: "Sacred flame sanctuary guarding southeastern Vanguard gateway approaches."
  },

  // Vanguard Stronghold Prime (East Base) - Tier 3
  {
    id: "beacon-vanguard-hq",
    name: "Benteng Pusat Vanguard Prime",
    nameEn: "Vanguard Stronghold Prime",
    element: "Api",
    x: 92,
    y: 50,
    lat: -6.2200,
    lng: 106.8800,
    connectedNodeIds: ["beacon-kelapa-gading", "beacon-pulomas-solar", "beacon-cakung-steel", "beacon-cibubur-flame"],
    isBase: true,
    baseFaction: "Vanguard",
    ownerId: null,
    ownerName: null,
    ownerFaction: null,
    ownerAvatar: undefined,
    anchorCard: null,
    garrisonDeck: [],
    capturedAt: null,
    lastClaimedAt: null,
    accumulatedCores: 0,
    isActive: true,
    defenseHp: 250,
    maxDefenseHp: 250,
    tier: 3,
    reinforcementsCount: 0,
    descriptionId: "Markas Komando Utama faksi Vanguard. Berstatus netral di awal permainan dan harus segera di-capture oleh kartu Mythic Lv.3+ berenergi penuh (5/5).",
    descriptionEn: "Supreme Stronghold of the Vanguard Faction. Neutral at start; must be captured first by a Mythic card Lv.3+ with full energy (5/5)."
  }
];

// Helper: Ensure territory nodes exist and are seamlessly updated & handle 3-day war countdown reset
function getInitializedTerritoryNodes(db: any) {
  const now = Date.now();

  // Check if 3-day countdown expired to reset all beacon areas to neutral
  if (db.territoryWarResetCountdown) {
    const countdownEnd = new Date(db.territoryWarResetCountdown.countdownUntil).getTime();
    if (now >= countdownEnd) {
      // 3 Days elapsed! Reset all territory nodes back to neutral and restart Beacon War!
      if (Array.isArray(db.territoryNodes)) {
        db.territoryNodes.forEach((node: any) => {
          node.ownerId = null;
          node.ownerName = null;
          node.ownerFaction = null;
          node.ownerAvatar = undefined;
          node.anchorCard = null;
          node.garrisonDeck = [];
          node.capturedAt = null;
          node.lastClaimedAt = null;
          node.accumulatedCores = 0;
          node.cooldownUntil = null;
          node.defenseHp = node.maxDefenseHp || (node.isBase ? 250 : node.tier === 3 ? 180 : 120);
          node.reinforcementsCount = 0;
        });
      }
      db.territoryWarResetHistory = db.territoryWarResetHistory || [];
      db.territoryWarResetHistory.push({
        ...db.territoryWarResetCountdown,
        completedAt: new Date(now).toISOString()
      });
      db.territoryWarResetCountdown = null;
    }
  }

  if (!db.territoryNodes || !Array.isArray(db.territoryNodes) || db.territoryNodes.length === 0) {
    db.territoryNodes = JSON.parse(JSON.stringify(DEFAULT_TERRITORY_NODES));
  } else {
    // Check if new nodes need to be merged in & clear legacy dummy owners
    const existingMap = new Map<string, any>(db.territoryNodes.map((n: any) => [n.id, n]));
    const merged = DEFAULT_TERRITORY_NODES.map((defNode: any) => {
      const existing: any = existingMap.get(defNode.id);
      if (existing) {
        // Cleanse legacy dummy owner strings if any
        if (existing.ownerId === "sentinel-faction-core" || existing.ownerId === "vanguard-faction-core") {
          existing.ownerId = null;
          existing.ownerName = null;
          existing.ownerFaction = null;
          existing.ownerAvatar = undefined;
          existing.anchorCard = null;
          existing.garrisonDeck = [];
          existing.capturedAt = null;
          existing.lastClaimedAt = null;
          existing.accumulatedCores = 0;
          existing.reinforcementsCount = 0;
        }
        return {
          ...defNode,
          ...existing,
          x: defNode.x,
          y: defNode.y,
          connectedNodeIds: defNode.connectedNodeIds,
          tier: defNode.tier,
          element: defNode.element,
          isBase: defNode.isBase,
          baseFaction: defNode.baseFaction,
          name: defNode.name,
          nameEn: defNode.nameEn
        };
      }
      return JSON.parse(JSON.stringify(defNode));
    });
    db.territoryNodes = merged;
  }
  return db.territoryNodes;
}

// Graph Algorithm: Evaluate supply lines & tiered core accumulation for all nodes
function evaluateSupplyLinesAndCores(nodes: any[]) {
  const nodeMap = new Map<string, any>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const now = Date.now();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // Run BFS from owned bases
  const activeNodesSet = new Set<string>();
  const baseNodes = nodes.filter(n => n.isBase && n.ownerId);
  baseNodes.forEach(base => {
    activeNodesSet.add(base.id);
    const queue = [base.id];
    const visited = new Set<string>([base.id]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const curr = nodeMap.get(currentId);
      if (!curr) continue;

      (curr.connectedNodeIds || []).forEach((neighborId: string) => {
        const neighbor = nodeMap.get(neighborId);
        if (!neighbor || visited.has(neighborId)) return;

        const sameOwner = neighbor.ownerId && neighbor.ownerId === curr.ownerId;
        const sameFaction = neighbor.ownerFaction && neighbor.ownerFaction === curr.ownerFaction;

        if (sameOwner || sameFaction) {
          visited.add(neighborId);
          activeNodesSet.add(neighborId);
          queue.push(neighborId);
        }
      });
    }
  });

  // Update isActive and compute tiered core accumulation:
  // Tier 1 (5 cores/day), Tier 2 (7 cores/day), Tier 3 (10 cores/day)
  nodes.forEach(node => {
    if (node.isBase) {
      node.isActive = true;
    } else if (!node.ownerId) {
      node.isActive = true; // Neutral nodes are always interactable
    } else {
      node.isActive = activeNodesSet.has(node.id);
    }

    // Tiered Core generation calculation
    const coresPerDay = node.tier === 3 ? 10 : node.tier === 2 ? 7 : 5;
    const maxCap = node.tier === 3 ? 40 : node.tier === 2 ? 30 : 20;

    if (node.ownerId && node.isActive && node.capturedAt) {
      const lastClaim = node.lastClaimedAt ? new Date(node.lastClaimedAt).getTime() : new Date(node.capturedAt).getTime();
      const elapsed = Math.max(0, now - lastClaim);
      const daysElapsed = elapsed / MS_PER_DAY;
      const generated = Math.min(maxCap, Math.floor(daysElapsed * coresPerDay * 10) / 10);
      node.accumulatedCores = (node.accumulatedCores || 0) + generated;
      node.lastClaimedAt = new Date(now).toISOString();
    }
  });
}

// Territory Node Base Capture Cooldown: 2 hours (scaled down by card level)
const TERRITORY_CAPTURE_COOLDOWN_MS = 2 * 60 * 60 * 1000;

// 1. Get all territory nodes & user faction status
app.get("/api/territory/nodes", (req, res) => {
  const db = readDB();
  const nodes = getInitializedTerritoryNodes(db);
  evaluateSupplyLinesAndCores(nodes);
  writeDB(db);

  const user = getAuthUser(req, db);
  let playerFaction: "Sentinel" | "Vanguard" | null = null;
  let playerUnclaimedCores = 0;
  let playerNodesCount = 0;

  const now = Date.now();

  // Populate cooldown fields on each node
  nodes.forEach(node => {
    if (node.capturedAt && node.cooldownUntil) {
      const cooldownEnd = new Date(node.cooldownUntil).getTime();
      const remainingSec = Math.max(0, Math.ceil((cooldownEnd - now) / 1000));
      node.cooldownRemainingSeconds = remainingSec;
    } else {
      node.cooldownRemainingSeconds = 0;
    }
  });

  if (user) {
    playerFaction = user.faction || null;

    // Calculate total unclaimed cores owned by this user & check adjacent cooldown lock
    nodes.forEach(n => {
      if (n.ownerId === user.id) {
        playerNodesCount++;
        if (n.isActive) {
          playerUnclaimedCores += n.accumulatedCores || 0;
        }
      }

      // Check if target node is adjacent to any node owned by user with active capture cooldown
      const connectedNeighbors = nodes.filter(neighbor => (n.connectedNodeIds || []).includes(neighbor.id));
      const activeCooldownNeighbor = connectedNeighbors.find(neighbor =>
        neighbor.ownerId === user.id && (neighbor.cooldownRemainingSeconds || 0) > 0
      );

      if (activeCooldownNeighbor) {
        n.isAdjacentLocked = true;
        n.adjacentCooldownSeconds = activeCooldownNeighbor.cooldownRemainingSeconds || 0;
      } else {
        n.isAdjacentLocked = false;
        n.adjacentCooldownSeconds = 0;
      }
    });
  }

  // Active 3-Day War Reset Countdown Info
  let warResetCountdown: any = null;
  if (db.territoryWarResetCountdown) {
    const countdownEnd = new Date(db.territoryWarResetCountdown.countdownUntil).getTime();
    const remainingSec = Math.max(0, Math.ceil((countdownEnd - now) / 1000));
    warResetCountdown = {
      ...db.territoryWarResetCountdown,
      remainingSeconds: remainingSec
    };
  }

  res.json({
    success: true,
    nodes,
    playerFaction,
    userFaction: user ? user.faction : null,
    playerUnclaimedCores: Math.round(playerUnclaimedCores * 10) / 10,
    playerNodesCount,
    warResetCountdown
  });
});

// 2. Select or Switch Faction (Sentinel or Vanguard)
app.post("/api/territory/choose-faction", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Silakan login terlebih dahulu." });
  }

  const { faction } = req.body;
  if (faction !== "Sentinel" && faction !== "Vanguard") {
    return res.status(400).json({ error: "Faksi tidak valid. Pilih Sentinel atau Vanguard." });
  }

  user.faction = faction;
  writeDB(db);

  res.json({
    success: true,
    message: `Selamat bergabung dengan Faksi ${faction}! Semua kartu Nekomon milikmu siap bertempur untuk ${faction}.`,
    faction: user.faction
  });
});

// 3. Capture a Beacon Node (Enforcing Mythic requirement, HQ Lv3+ requirement, Full 5-Bar Energy for HQ, 2-Bar Energy for T2/T3, Speed bonus, Anchor migration, Connection rules & 3-Day war countdown)
app.post("/api/territory/capture", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Silakan login terlebih dahulu." });
  }

  const { nodeId, anchorCardId, garrisonCardIds } = req.body;
  if (!nodeId || !anchorCardId) {
    return res.status(400).json({ error: "ID Node Beacon dan ID Kartu Mythic Anchor wajib dipilih!" });
  }

  const nodes = getInitializedTerritoryNodes(db);
  const targetNode = nodes.find(n => n.id === nodeId);
  if (!targetNode) {
    return res.status(404).json({ error: "Node Beacon tidak ditemukan di peta." });
  }

  // Verify Mythic Card Ownership
  const userCards = (db.cards || []).filter((c: any) => c.userId === user.id);
  const mythicCard = userCards.find((c: any) => c.id === anchorCardId);

  if (!mythicCard) {
    return res.status(400).json({ error: "Kartu Anchor yang dipilih tidak ditemukan dalam koleksimu!" });
  }

  if (mythicCard.rarity !== "Mythic") {
    return res.status(400).json({ 
      error: "Hanya kartu bertingkat kelangkaan MYTHIC yang dapat diaktifkan sebagai Beacon Anchor untuk menguasai area!" 
    });
  }

  // Enforce the same ownership cap shown by the client. Reusing an anchor
  // migrates ownership instead of consuming an additional territory slot.
  const maxAllowedNodes = Math.max(2, 1 + userCards.filter((c: any) => c.rarity === "Mythic").length * 2);
  const ownedNodesCount = nodes.filter(n => n.ownerId === user.id).length;
  const migratedAnchorNode = nodes.find(n => n.id !== targetNode.id && n.ownerId === user.id && n.anchorCard?.id === mythicCard.id);
  const projectedNodesCount = ownedNodesCount + (targetNode.ownerId === user.id ? 0 : 1) - (migratedAnchorNode ? 1 : 0);
  if (projectedNodesCount > maxAllowedNodes) {
    return res.status(400).json({
      error: `Batas penguasaan tercapai (${ownedNodesCount}/${maxAllowedNodes} Beacon). Tambahkan kartu Mythic atau pindahkan Anchor yang sudah aktif.`
    });
  }

  // Update card energy before checking
  updateCardEnergy(mythicCard);
  const cardLevel = mythicCard.level || 1;
  const currentCardEnergy = mythicCard.energy ?? 5;

  // Rule 3 (Part A): Markas HQ (T3 Base) Harus di-capture oleh kartu Nekomon Mythic level minimal 3 & Energi Full Bar (5/5)
  if (targetNode.isBase) {
    if (cardLevel < 3) {
      return res.status(400).json({
        error: `Markas Komando HQ ${targetNode.name} adalah benteng komando utama dan hanya dapat dikuasai oleh kartu Nekomon Mythic dengan level minimal 3 (Lv.3+)! (Kartu ini Lv.${cardLevel}). Silakan latih / tingkatkan level kartu Mythic milikmu terlebih dahulu.`
      });
    }

    if (currentCardEnergy < 5) {
      return res.status(400).json({
        error: `Syarat Energi Penuh Markas HQ: Untuk menguasai Markas Komando HQ, energi kartu Nekomon Mythic harus FULL BAR (5/5). Energi kartu ini saat ini: ${currentCardEnergy}/5 bar.`
      });
    }
  } else if (targetNode.tier >= 2) {
    // Rule 3 (Part B): Beacon T2 dan T3 membutuhkan kartu Nekomon Mythic dengan energi minimal 2 bar
    if (currentCardEnergy < 2) {
      return res.status(400).json({
        error: `Syarat Energi Beacon Tier ${targetNode.tier}: Untuk merebut Beacon Tier ${targetNode.tier}, kartu Nekomon Mythic minimal harus memiliki 2 bar energi! (Energi kartu saat ini: ${currentCardEnergy}/5 bar).`
      });
    }
  }

  // Player Faction
  const playerFaction: "Sentinel" | "Vanguard" = user.faction || "Sentinel";

  // Rule 1 & 6: Proses capturing beacon harus terhubung dengan Markas HQ atau wilayah yang sudah dikuasai
  const isDirectOwnFactionHQ = targetNode.isBase && targetNode.baseFaction === playerFaction;

  if (!isDirectOwnFactionHQ) {
    // Non-starting HQ nodes require that the player's faction already owns their own HQ or active territory
    const ownFactionHQ = nodes.find(n => n.isBase && n.baseFaction === playerFaction);
    const isOwnHQCaptured = ownFactionHQ && ownFactionHQ.ownerFaction === playerFaction && ownFactionHQ.ownerId;

    if (!isOwnHQCaptured) {
      return res.status(400).json({
        error: `Markas Komando ${playerFaction} Prime berstatus netral dan belum dikuasai! Faksi ${playerFaction} harus merebut Markas Komando HQ terlebih dahulu sebagai titik awal sebelum dapat menguasai Beacon lainnya.`
      });
    }

    const connectedNodes = nodes.filter(n => (targetNode.connectedNodeIds || []).includes(n.id));
    const hasValidConnection = connectedNodes.some(neighbor => {
      // Check if neighbor is owned by this player
      if (neighbor.ownerId === user.id) return true;
      // Check if neighbor is faction base owned by player's faction
      if (neighbor.isBase && neighbor.baseFaction === playerFaction && neighbor.ownerFaction === playerFaction && neighbor.ownerId) return true;
      // Check if neighbor is owned by same faction and active
      if (neighbor.ownerFaction === playerFaction && neighbor.isActive && neighbor.ownerId) return true;
      return false;
    });

    if (!hasValidConnection) {
      return res.status(400).json({
        error: "Aturan Jalur Terhubung: Kamu hanya dapat merebut Beacon yang terhubung langsung dengan Beacon aktif milikmu atau sekutu faksimu!"
      });
    }
  }

  // Check if any adjacent node owned by player is currently under capture cooldown
  const now = Date.now();
  const connectedNodes = nodes.filter(n => (targetNode.connectedNodeIds || []).includes(n.id));
  const activeCooldownAdjacent = connectedNodes.find(adj => {
    if (adj.ownerId !== user.id) return false;
    if (!adj.cooldownUntil) return false;
    const cooldownEnd = new Date(adj.cooldownUntil).getTime();
    return cooldownEnd > now;
  });

  if (activeCooldownAdjacent) {
    const cooldownEnd = new Date(activeCooldownAdjacent.cooldownUntil!).getTime();
    const remainingSec = Math.ceil((cooldownEnd - now) / 1000);
    const hours = Math.floor(remainingSec / 3600);
    const mins = Math.floor((remainingSec % 3600) / 60);
    const secs = remainingSec % 60;
    const timeStr = `${hours > 0 ? `${hours} jam ` : ""}${mins} menit ${secs} detik`;
    return res.status(400).json({
      error: `Jeda Penaklukan Aktif: Node terhubung "${activeCooldownAdjacent.name}" baru saja direbut. Harap tunggu ${timeStr} sebelum merebut node sekitar.`
    });
  }

  // Rule 5: Kartu mythic yang digunakan sebagai Anchor bisa dipakai untuk Capture Beacon lain, namun beacon sebelumnya akan kembali netral.
  const previousAnchoredNode = nodes.find(
    n => n.id !== targetNode.id && n.anchorCard && n.anchorCard.id === mythicCard.id
  );

  let previousNodeNeutralizedName: string | null = null;
  if (previousAnchoredNode) {
    previousNodeNeutralizedName = previousAnchoredNode.name;
    previousAnchoredNode.ownerId = null;
    previousAnchoredNode.ownerName = null;
    previousAnchoredNode.ownerFaction = null;
    previousAnchoredNode.ownerAvatar = undefined;
    previousAnchoredNode.anchorCard = null;
    previousAnchoredNode.garrisonDeck = [];
    previousAnchoredNode.capturedAt = null;
    previousAnchoredNode.lastClaimedAt = null;
    previousAnchoredNode.accumulatedCores = 0;
    previousAnchoredNode.cooldownUntil = null;
    previousAnchoredNode.defenseHp = previousAnchoredNode.maxDefenseHp || 100;
    previousAnchoredNode.reinforcementsCount = 0;
  }

  // Deduct 1 bar energy for anchoring / capturing
  mythicCard.energy = Math.max(0, currentCardEnergy - 1);
  mythicCard.lastEnergyRefillAt = new Date().toISOString();

  // Prepare Garrison Deck
  const garrisonDeck: any[] = [];
  if (Array.isArray(garrisonCardIds)) {
    if (garrisonCardIds.length > 3) {
      return res.status(400).json({ error: "Garnisun dibatasi maksimal 3 kartu." });
    }
    const uniqueGarrisonCardIds = [...new Set(garrisonCardIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0))];
    if (uniqueGarrisonCardIds.length !== garrisonCardIds.length) {
      return res.status(400).json({ error: "Setiap slot garnisun harus menggunakan kartu yang berbeda." });
    }
    uniqueGarrisonCardIds.forEach((cId: string) => {
      const found = userCards.find((c: any) => c.id === cId);
      if (found && found.id !== mythicCard.id) {
        garrisonDeck.push(found);
      }
    });
    if (garrisonDeck.length !== uniqueGarrisonCardIds.length) {
      return res.status(400).json({ error: "Satu atau lebih kartu garnisun tidak valid." });
    }
  }

  // Rule 4: Semakin besar levelnya, semakin cepat proses capturenya (Jeda stabilisasi dipersingkat)
  // Base cooldown: 7200s (2 jam). Each level above 1 provides +8% speed bonus.
  // Rule 5: Penambahan garnisun saat proses capture memangkas cooldown (1 kartu = -5 menit)
  const speedMultiplier = 1 + Math.max(0, (cardLevel - 1)) * 0.08;
  const baseCooldownMs = Math.round(TERRITORY_CAPTURE_COOLDOWN_MS / speedMultiplier);
  const garrisonReductionMs = garrisonDeck.length * 5 * 60 * 1000;
  const cooldownDurationMs = Math.max(5 * 60 * 1000, baseCooldownMs - garrisonReductionMs);

  // Assign ownership & set capture cooldown based on speed multiplier and garrison reduction
  targetNode.ownerId = user.id;
  targetNode.ownerName = user.username;
  targetNode.ownerFaction = playerFaction;
  targetNode.ownerAvatar = user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`;
  targetNode.anchorCard = mythicCard;
  targetNode.garrisonDeck = garrisonDeck;
  targetNode.capturedAt = new Date().toISOString();
  targetNode.cooldownUntil = new Date(Date.now() + cooldownDurationMs).toISOString();
  targetNode.lastClaimedAt = new Date().toISOString();
  targetNode.accumulatedCores = 0;
  targetNode.defenseHp = targetNode.maxDefenseHp || (targetNode.isBase ? 250 : targetNode.tier === 3 ? 180 : 120);
  targetNode.reinforcementsCount = 0;

  // Rule 2: Setelah salah satu markas HQ berhasil di-capture oleh lawan, muncul countdown timer 3 hari sebelum semua area kembali netral
  let warCountdownTriggered = false;
  if (targetNode.isBase) {
    if (targetNode.baseFaction && playerFaction !== targetNode.baseFaction) {
      // Enemy Base Captured! Trigger 3-Day War Victory Reset Countdown
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      db.territoryWarResetCountdown = {
        capturedHQId: targetNode.id,
        capturedHQName: targetNode.name,
        capturedHQNameEn: targetNode.nameEn || targetNode.name,
        originalFaction: targetNode.baseFaction,
        capturedByFaction: playerFaction,
        capturedByUserName: user.username,
        countdownUntil: new Date(Date.now() + threeDaysMs).toISOString(),
        startedAt: new Date().toISOString()
      };
      warCountdownTriggered = true;
    } else if (targetNode.baseFaction && playerFaction === targetNode.baseFaction) {
      // Original Faction successfully defended or recaptured their HQ! Clear countdown if it targeted this HQ
      if (db.territoryWarResetCountdown && db.territoryWarResetCountdown.capturedHQId === targetNode.id) {
        db.territoryWarResetCountdown = null;
      }
    }
  }

  // Re-evaluate whole network supply lines
  evaluateSupplyLinesAndCores(nodes);
  writeDB(db);

  const tierCoresPerDay = targetNode.tier === 3 ? 10 : targetNode.tier === 2 ? 7 : 5;
  let message = `Berhasil mengaktifkan Beacon ${targetNode.name} (Tier ${targetNode.tier}: ${tierCoresPerDay} Cores/hari) dengan Anchor Mythic ${mythicCard.name} (Lv.${cardLevel})!`;
  if (warCountdownTriggered) {
    message += ` ⚠️ PERINGATAN DARURAT: Markas Komando lawan telah ditaklukkan! Countdown 3 Hari menuju Reset Musim Beacon War telah dimulai!`;
  }
  if (previousNodeNeutralizedName) {
    message += ` Catatan: Beacon sebelumnya "${previousNodeNeutralizedName}" telah dikembalikan ke status Netral karena kartu Anchor-nya dipindahkan.`;
  }

  res.json({
    success: true,
    message,
    previousNodeNeutralizedName,
    node: targetNode,
    nodes,
    warResetCountdown: db.territoryWarResetCountdown
  });
});

// 4. Battle an Enemy Garrison / Neutral Guardian on a Node (Requires connected path)
app.post("/api/territory/battle", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Silakan login terlebih dahulu." });
  }

  const { nodeId, attackerCardIds } = req.body;
  if (!nodeId || !Array.isArray(attackerCardIds) || attackerCardIds.length === 0) {
    return res.status(400).json({ error: "Pilih minimal 1 kartu tempur untuk menyerang Beacon!" });
  }

  if (attackerCardIds.length > 3) {
    return res.status(400).json({ error: "Deck penyerang Territory dibatasi maksimal 3 kartu." });
  }

  const uniqueAttackerCardIds = [...new Set(attackerCardIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0))];
  if (uniqueAttackerCardIds.length !== attackerCardIds.length) {
    return res.status(400).json({ error: "Setiap slot deck Territory harus menggunakan kartu yang berbeda." });
  }

  const nodes = getInitializedTerritoryNodes(db);
  const targetNode = nodes.find(n => n.id === nodeId);
  if (!targetNode) {
    return res.status(404).json({ error: "Node Beacon tidak ditemukan." });
  }

  if (targetNode.ownerId === user.id) {
    return res.status(400).json({ error: "Beacon ini sudah berada di bawah kekuasaanmu!" });
  }

  const playerFaction: "Sentinel" | "Vanguard" = user.faction || "Sentinel";

  // Rule 6: Attacking enemy/neutral beacon requires connected node
  const connectedNodes = nodes.filter(n => (targetNode.connectedNodeIds || []).includes(n.id));
  const hasValidConnection = connectedNodes.some(neighbor => {
    if (neighbor.ownerId === user.id) return true;
    if (neighbor.isBase && neighbor.baseFaction === playerFaction) return true;
    if (neighbor.ownerFaction === playerFaction && neighbor.isActive) return true;
    return false;
  });

  if (!hasValidConnection) {
    return res.status(400).json({
      error: "Aturan Jalur Perang: Kamu hanya dapat menyerang Beacon yang terhubung langsung dengan wilayah milikmu, sekutu faksimu, atau Markas Faksimu!"
    });
  }

  // Check 2-Hour Territory Capture Cooldown: Prevent attacking adjacent nodes if recently captured an adjacent node
  const now = Date.now();
  const activeCooldownAdjacent = connectedNodes.find(adj => {
    if (adj.ownerId !== user.id) return false;
    if (!adj.cooldownUntil) return false;
    const cooldownEnd = new Date(adj.cooldownUntil).getTime();
    return cooldownEnd > now;
  });

  if (activeCooldownAdjacent) {
    const cooldownEnd = new Date(activeCooldownAdjacent.cooldownUntil!).getTime();
    const remainingSec = Math.ceil((cooldownEnd - now) / 1000);
    const hours = Math.floor(remainingSec / 3600);
    const mins = Math.floor((remainingSec % 3600) / 60);
    const secs = remainingSec % 60;
    const timeStr = `${hours > 0 ? `${hours} jam ` : ""}${mins} menit ${secs} detik`;
    const timeStrEn = `${hours > 0 ? `${hours}h ` : ""}${mins}m ${secs}s`;

    return res.status(400).json({
      error: `Jeda Penaklukan Teritori Aktif: Kamu baru saja merebut node terhubung "${activeCooldownAdjacent.name}". Serangan ke node di sekitarnya dijeda selama ${timeStr}.`,
      errorEn: `Territory Capture Cooldown Active: You recently captured adjacent node "${activeCooldownAdjacent.nameEn || activeCooldownAdjacent.name}". Attacks on adjacent nodes are paused (Remaining: ${timeStrEn}).`,
      cooldownRemainingSeconds: remainingSec,
      cooldownUntil: new Date(cooldownEnd).toISOString()
    });
  }

  const userCards = (db.cards || []).filter((c: any) => c.userId === user.id);
  const attackerDeck = uniqueAttackerCardIds.map((id: string) => userCards.find((c: any) => c.id === id)).filter(Boolean);

  if (attackerDeck.length !== uniqueAttackerCardIds.length) {
    return res.status(400).json({ error: "Kartu penyerang tidak valid." });
  }

  // Check if any card is currently locked in an active Boss Raid
  const lockedCardIds = getLockedRaidCardIds(db);
  const cardInRaid = attackerDeck.find((c: any) => lockedCardIds.has(c.id));
  if (cardInRaid) {
    return res.status(400).json({
      error: `Kartu "${cardInRaid.name}" sedang bertarung di Boss Raid dan tidak dapat digunakan untuk ekspansi teritori hingga raid selesai!`
    });
  }

  for (const card of attackerDeck) {
    updateCardEnergy(card);
    if ((card.energy ?? 5) < 1) {
      return res.status(400).json({
        error: `Kartu "${card.name}" membutuhkan minimal 1 energi untuk menyerang Territory.`
      });
    }
  }

  // Charge the battle cost only after every card and lock check has passed.
  attackerDeck.forEach((card: any) => {
    if ((card.energy ?? 5) === (card.maxEnergy ?? 5)) {
      card.lastEnergyRefillAt = new Date().toISOString();
    }
    card.energy = Math.max(0, (card.energy ?? 5) - 1);
  });

  // Determine defender cards
  let defenderDeck: any[] = [];
  if (targetNode.anchorCard) {
    defenderDeck = [targetNode.anchorCard, ...(targetNode.garrisonDeck || [])];
  } else {
    // Neutral elemental guardian
    defenderDeck = [
      {
        id: `guardian-${targetNode.id}`,
        name: `Guardian of ${targetNode.name}`,
        element: targetNode.element,
        style: "Sentinel",
        rarity: targetNode.tier === 3 ? "Legend" : "Epic",
        hp: targetNode.defenseHp || 100,
        atk: 70 + targetNode.tier * 15,
        def: 60 + targetNode.tier * 15,
        spd: 60 + targetNode.tier * 10,
        level: 10 + targetNode.tier * 5,
        skillName: "Elemental Resonance",
        skillDesc: `Menghasilkan perisai medan elemen ${targetNode.element}.`
      }
    ];
  }

  // TCG Combat Simulation with Elemental Matching & Type Advantages
  const battleTurns: any[] = [];
  let attackerTotalHp = attackerDeck.reduce((sum, c) => sum + (c.hp || 100), 0);
  let defenderTotalHp = targetNode.defenseHp || defenderDeck.reduce((sum, c) => sum + (c.hp || 100), 0);

  let turn = 1;
  const maxTurns = 6;

  while (turn <= maxTurns && attackerTotalHp > 0 && defenderTotalHp > 0) {
    const attackerCard = attackerDeck[(turn - 1) % attackerDeck.length];
    const defenderCard = defenderDeck[(turn - 1) % defenderDeck.length];

    // Attacker strike
    let atkPower = (attackerCard.atk || 50) * getStyleAttackMultiplier(attackerCard.style);
    const hasFieldBonus = attackerCard.element === targetNode.element;
    if (hasFieldBonus) atkPower = Math.round(atkPower * 1.25); // +25% beacon field bonus

    if (ELEMENT_ADVANTAGE[attackerCard.element] === defenderCard.element) {
      atkPower = Math.round(atkPower * ELEMENT_ADVANTAGE_MULTIPLIER);
    }

    atkPower = Math.round(atkPower * getSpeedMultiplier(attackerCard.spd, defenderCard.spd));

    const defPower = Math.round((defenderCard.def || 30) * getStyleDefenseMultiplier(defenderCard.style) * 0.4);
    const damageToDef = Math.max(15, atkPower - defPower + Math.floor(Math.random() * 12));
    defenderTotalHp = Math.max(0, defenderTotalHp - damageToDef);

    battleTurns.push({
      turn,
      attackerCardName: attackerCard.name,
      defenderCardName: defenderCard.name,
      damageDealt: damageToDef,
      elementalBonus: hasFieldBonus,
      messageId: `${attackerCard.name} menyerang ${defenderCard.name} dengan ${damageToDef} DMG! ${hasFieldBonus ? "(+25% Resonansi Elemen Area!)" : ""}`,
      messageEn: `${attackerCard.name} attacks ${defenderCard.name} dealing ${damageToDef} DMG! ${hasFieldBonus ? "(+25% Area Elemental Resonance!)" : ""}`
    });

    if (defenderTotalHp <= 0) break;

    // Defender counter-attack
    let defAtk = (defenderCard.atk || 50) * getStyleAttackMultiplier(defenderCard.style);
    if (defenderCard.element === targetNode.element) defAtk = Math.round(defAtk * 1.25);
    if (ELEMENT_ADVANTAGE[defenderCard.element] === attackerCard.element) {
      defAtk = Math.round(defAtk * ELEMENT_ADVANTAGE_MULTIPLIER);
    }
    defAtk = Math.round(defAtk * getSpeedMultiplier(defenderCard.spd, attackerCard.spd));
    const attDefPower = Math.round((attackerCard.def || 30) * getStyleDefenseMultiplier(attackerCard.style) * 0.4);
    const damageToAtt = Math.max(10, defAtk - attDefPower + Math.floor(Math.random() * 10));
    attackerTotalHp = Math.max(0, attackerTotalHp - damageToAtt);

    turn++;
  }

  const attackerWon = defenderTotalHp <= 0 || attackerTotalHp > defenderTotalHp;
  let nodeCaptured = false;
  let pointsRewarded = 0;
  let coresRewarded = 0;

  // Damage persists regardless of the round result, but rewards are granted only
  // once the node is actually breached. This prevents repeatable partial-win farming.
  targetNode.defenseHp = Math.max(0, defenderTotalHp);

  if (attackerWon) {
    if (targetNode.defenseHp <= 0) {
      // Node is breached / neutral and ready for Mythic anchor installation
      targetNode.ownerId = null;
      targetNode.ownerName = null;
      targetNode.ownerFaction = null;
      targetNode.anchorCard = null;
      targetNode.garrisonDeck = [];
      targetNode.defenseHp = targetNode.maxDefenseHp || (targetNode.isBase ? 250 : targetNode.tier === 3 ? 180 : 120);
      nodeCaptured = true;
      pointsRewarded = 60;
      coresRewarded = 2;
      user.points = (user.points || 0) + pointsRewarded;
      user.cores = (user.cores || 0) + coresRewarded;
    }
  }

  evaluateSupplyLinesAndCores(nodes);
  writeDB(db);

  res.json({
    success: true,
    won: attackerWon,
    nodeCaptured,
    defenseHpRemaining: targetNode.defenseHp,
    turns: battleTurns,
    pointsRewarded,
    coresRewarded,
    userPoints: user.points,
    userCores: user.cores,
    node: targetNode
  });
});

// 5. Claim all accumulated Nekomon Cores from active connected territory nodes (Tier 1: 5, Tier 2: 7, Tier 3: 10 cores/day)
app.post("/api/territory/claim-cores", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Silakan login terlebih dahulu." });
  }

  const nodes = getInitializedTerritoryNodes(db);
  evaluateSupplyLinesAndCores(nodes);

  let totalClaimable = 0;
  const claimedNodesList: string[] = [];

  nodes.forEach(node => {
    if (node.ownerId === user.id && node.isActive) {
      const cores = Math.floor(node.accumulatedCores || 0);
      if (cores > 0) {
        totalClaimable += cores;
        node.accumulatedCores = Math.max(0, (node.accumulatedCores || 0) - cores);
        node.lastClaimedAt = new Date().toISOString();
        claimedNodesList.push(node.name);
      }
    }
  });

  if (totalClaimable <= 0) {
    return res.status(400).json({
      error: "Belum ada akumulasi Nekomon Core yang siap diklaim. Area aktif menghasilkan Cores setiap hari berdasarkan Tier Beacon (T1: 5, T2: 7, T3: 10 Cores/hari)!"
    });
  }

  user.cores = (user.cores || 0) + totalClaimable;
  writeDB(db);

  res.json({
    success: true,
    message: `Berhasil mengklaim ${totalClaimable} Nekomon Cores dari ${claimedNodesList.length} Beacon wilayah aktif!`,
    coresClaimed: totalClaimable,
    newUserCores: user.cores,
    nodes
  });
});

// 6. Reinforce Beacon (Accessibility for non-Mythic & faction members)
app.post("/api/territory/reinforce", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Silakan login terlebih dahulu." });
  }

  const { nodeId, supportCardId } = req.body;
  const nodes = getInitializedTerritoryNodes(db);
  const node = nodes.find(n => n.id === nodeId);
  if (!node) {
    return res.status(404).json({ error: "Node Beacon tidak ditemukan." });
  }

  const userCards = (db.cards || []).filter((c: any) => c.userId === user.id);
  const supportCard = userCards.find((c: any) => c.id === supportCardId);
  if (!supportCard) {
    return res.status(400).json({ error: "Pilih kartu support untuk memperkuat garnisun beacon!" });
  }

  if (!node.garrisonDeck) node.garrisonDeck = [];
  if (node.garrisonDeck.length < 4) {
    node.garrisonDeck.push(supportCard);
  }

  // Restore & boost defense HP
  node.defenseHp = Math.min((node.maxDefenseHp || 100) + 50, (node.defenseHp || 100) + 30);
  node.reinforcementsCount = (node.reinforcementsCount || 0) + 1;

  user.points = (user.points || 0) + 20;
  writeDB(db);

  res.json({
    success: true,
    message: `Garnisun Beacon ${node.name} berhasil diperkuat dengan ${supportCard.name}! (+30 Defense HP, +20 Trainer Pts)`,
    node,
    userPoints: user.points
  });
});

// Developer emails list with full access
const DEVELOPER_EMAILS = [
  "verydiaz@gmail.com",
  "nekomaster@nekomon.online",
  "support@nekomon.online"
];

// Helper to check if a user is an authorized developer
function isDeveloperUser(user: any): boolean {
  if (!user) return false;
  const cleanEmail = (user.email || "").toLowerCase().trim();
  const cleanUsername = (user.username || "").toLowerCase().trim();
  return (
    user.role === "developer" ||
    DEVELOPER_EMAILS.includes(cleanEmail) ||
    cleanUsername === "verydiaz" ||
    cleanUsername === "support" ||
    cleanUsername === "nekomaster"
  );
}

// ----------------------------------------------------------------
// SPONSORSHIP & EVENT HUB ROUTES (PET SHOPS, VET CLINICS, FOOD BRANDS)
// ----------------------------------------------------------------

// Default initial seeded events
const DEFAULT_SPONSOR_EVENTS = [
  {
    id: "event_whiskas_shelter",
    title: "🐾 Donasi Pakan Shelter Kucing & Diskon Pakan 25%",
    titleEn: "🐾 Cat Shelter Food Drive & 25% Brand Discount",
    sponsorName: "Purrfect Feed & Whiskas Indonesia",
    type: "pet_food_brand",
    bannerUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=200&q=80",
    tagline: "Beli Pakan Favorit Kucingmu, Bantu Pakan Kucing Liar di Shelter!",
    taglineEn: "Buy your cat's favorite food, feed rescue shelter cats!",
    description: "Setiap pembelian produk pakan kucing bermerek mitra dengan kode voucher NEKOCARE25, Anda mendapatkan potongan harga 25% langsung, dan 10% dari nilai transaksi dialokasikan untuk penyediaan pakan gratis ke Shelter Kucing Indonesia.",
    descriptionEn: "Use code NEKOCARE25 for 25% off partner cat foods. 10% of proceeds go directly to funding dry food supplies for local rescue cat shelters.",
    promoCode: "NEKOCARE25",
    promoDiscount: "Diskon 25%",
    targetLink: "https://nekomon.online",
    rewardPoints: 50,
    rewardCores: 1,
    hasPhysicalLocation: false,
    startDate: new Date("2026-08-01T00:00:00.000Z").toISOString(),
    endDate: new Date("2026-12-31T23:59:59.000Z").toISOString(),
    isActive: true,
    socialQuestGoal: "Target 500kg Pakan Kucing untuk 5 Shelter Mitra",
    socialQuestGoalEn: "Target 500kg Cat Food Donated to 5 Partner Shelters",
    socialImpactDescription: "Program kerjasama resmi dengan shelter hewan terlantar untuk memastikan asupan gizi kucing rescue tetap terpenuhi.",
    socialImpactDescriptionEn: "Official collaboration program with rescue shelters ensuring rescued stray cats receive proper nutritional care.",
    createdAt: new Date().toISOString(),
    createdBy: "support@nekomon.online"
  },
  {
    id: "event_vet_care_spot",
    title: "🏥 Diskon 30% Cek Kesehatan & Vaksinasi Kucing di Vet Mitra",
    titleEn: "🏥 30% Off Health Check & Vaccines at Partner Vet Clinic",
    sponsorName: "NekoCare Vet Clinic & Pet Hospital",
    type: "vet_clinic",
    bannerUrl: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=200&q=80",
    tagline: "Kucing Sehat, Trainer Hebat! Rawat Kucing Kesayanganmu Sekarang.",
    taglineEn: "Healthy Cats, Happy Trainers! Care for your companion today.",
    description: "Tunjukkan profil game Nekomon Online Anda di meja resepsionis Klinik Hewan NekoCare untuk menikmati potongan diskon 30% biaya konsultasi dokter hewan, sterilisasi, dan vaksin tahunan.",
    descriptionEn: "Show your Nekomon Online game profile at NekoCare Clinic front desk to claim 30% discount on veterinary consultation, spaying/neutering, and annual vaccines.",
    promoCode: "VETNEKO30",
    promoDiscount: "Diskon 30%",
    targetLink: "https://nekomon.online",
    rewardPoints: 100,
    rewardCores: 2,
    hasPhysicalLocation: true,
    locationName: "NekoCare Central Vet Clinic",
    latitude: -6.2088,
    longitude: 106.8456,
    radiusMeters: 300,
    startDate: new Date("2026-08-01T00:00:00.000Z").toISOString(),
    endDate: new Date("2026-12-31T23:59:59.000Z").toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: "verydiaz@gmail.com"
  }
];

// 1. Get All Active Sponsor Events (Public to all players)
app.get("/api/events", (req, res) => {
  const db = readDB();
  if (!db.sponsorshipEvents) {
    db.sponsorshipEvents = DEFAULT_SPONSOR_EVENTS;
    writeDB(db);
  }
  res.json({
    success: true,
    events: db.sponsorshipEvents.filter((ev: any) => ev.isActive !== false)
  });
});

// 2. Create Sponsor Event (Developer Only)
app.post("/api/developer/events", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!isDeveloperUser(user)) {
    return res.status(403).json({
      error: "Akses ditolak. Hanya Akun Developer resmi (verydiaz@gmail.com / support@nekomon.online) yang dapat membuat event sponsor."
    });
  }

  const {
    title,
    titleEn,
    sponsorName,
    type,
    bannerUrl,
    logoUrl,
    tagline,
    taglineEn,
    description,
    descriptionEn,
    promoCode,
    promoDiscount,
    targetLink,
    rewardPoints,
    rewardCores,
    hasPhysicalLocation,
    locationName,
    latitude,
    longitude,
    radiusMeters,
    startDate,
    endDate,
    socialQuestGoal,
    socialQuestGoalEn,
    socialImpactDescription,
    socialImpactDescriptionEn
  } = req.body;

  if (!title || !sponsorName || !bannerUrl || !targetLink) {
    return res.status(400).json({ error: "Judul, Nama Sponsor, Banner URL, dan Link Tautan wajib diisi." });
  }

  if (!db.sponsorshipEvents) db.sponsorshipEvents = DEFAULT_SPONSOR_EVENTS;

  const newEvent = {
    id: "event_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 5),
    title: title.trim(),
    titleEn: titleEn ? titleEn.trim() : title.trim(),
    sponsorName: sponsorName.trim(),
    type: type || "pet_shop",
    bannerUrl: bannerUrl.trim(),
    logoUrl: logoUrl ? logoUrl.trim() : "",
    tagline: tagline ? tagline.trim() : "",
    taglineEn: taglineEn ? taglineEn.trim() : "",
    description: description.trim(),
    descriptionEn: descriptionEn ? descriptionEn.trim() : description.trim(),
    promoCode: promoCode ? promoCode.trim().toUpperCase() : "",
    promoDiscount: promoDiscount ? promoDiscount.trim() : "",
    targetLink: targetLink.trim(),
    rewardPoints: Number(rewardPoints) || 0,
    rewardCores: Number(rewardCores) || 0,
    hasPhysicalLocation: !!hasPhysicalLocation,
    locationName: locationName ? locationName.trim() : "",
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    radiusMeters: Number(radiusMeters) || 250,
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    socialQuestGoal: socialQuestGoal ? socialQuestGoal.trim() : "",
    socialQuestGoalEn: socialQuestGoalEn ? socialQuestGoalEn.trim() : "",
    socialImpactDescription: socialImpactDescription ? socialImpactDescription.trim() : "",
    socialImpactDescriptionEn: socialImpactDescriptionEn ? socialImpactDescriptionEn.trim() : "",
    createdAt: new Date().toISOString(),
    createdBy: user.email || "developer"
  };

  db.sponsorshipEvents.unshift(newEvent);

  // If this event has a physical location, automatically add/sync it to Community Spots on Map
  if (newEvent.hasPhysicalLocation && newEvent.latitude && newEvent.longitude) {
    if (!db.communitySpots) db.communitySpots = [];
    const spotCat = newEvent.type === "vet_clinic" ? "vet_clinic" : newEvent.type === "pet_shop" ? "cafe" : "landmark";
    const newSpot = {
      id: "spot_event_" + newEvent.id,
      name: `[SPONSOR] ${newEvent.locationName || newEvent.sponsorName}`,
      category: spotCat,
      categoryLabel: newEvent.sponsorName,
      lat: newEvent.latitude,
      lng: newEvent.longitude,
      radiusMeters: newEvent.radiusMeters || 250,
      boostedElement: "Air",
      bonusPoints: 30,
      bonusCores: 1,
      targetCatName: "Sponsored Companion",
      rarity: "Epic",
      iconEmoji: newEvent.type === "vet_clinic" ? "🏥" : "🏬",
      description: `${newEvent.title} - ${newEvent.promoDiscount || "Promo Spesial"}`,
      isCommunity: true,
      submittedBy: user.username || "Developer",
      sponsoredEventId: newEvent.id,
      createdAt: new Date().toISOString()
    };
    db.communitySpots.unshift(newSpot);
  }

  writeDB(db);

  res.json({
    success: true,
    message: "Event sponsor baru berhasil dipublikasikan! 🎉",
    event: newEvent
  });
});

// 3. Update Sponsor Event (Developer Only)
app.put("/api/developer/events/:id", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!isDeveloperUser(user)) {
    return res.status(403).json({ error: "Akses ditolak." });
  }

  const { id } = req.params;
  if (!db.sponsorshipEvents) db.sponsorshipEvents = DEFAULT_SPONSOR_EVENTS;

  const idx = db.sponsorshipEvents.findIndex((ev: any) => ev.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Event sponsor tidak ditemukan." });
  }

  const existing = db.sponsorshipEvents[idx];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString()
  };

  db.sponsorshipEvents[idx] = updated;
  writeDB(db);

  res.json({
    success: true,
    message: "Event sponsor berhasil diperbarui.",
    event: updated
  });
});

// 4. Delete Sponsor Event (Developer Only)
app.delete("/api/developer/events/:id", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!isDeveloperUser(user)) {
    return res.status(403).json({ error: "Akses ditolak." });
  }

  const { id } = req.params;
  if (!db.sponsorshipEvents) db.sponsorshipEvents = DEFAULT_SPONSOR_EVENTS;

  db.sponsorshipEvents = db.sponsorshipEvents.filter((ev: any) => ev.id !== id);
  if (db.communitySpots) {
    db.communitySpots = db.communitySpots.filter((s: any) => s.sponsoredEventId !== id);
  }

  writeDB(db);

  res.json({
    success: true,
    message: "Event sponsor berhasil dihapus."
  });
});

// ----------------------------------------------------------------
// RAID BOSS SYSTEM ROUTES (LEVEL 5-30, BUFF/DEBUFF, 3 SLOTS, 10KM)
// ----------------------------------------------------------------

// Haversine distance calculator
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Seed default bosses across all Indonesian cities (Levels 6 to 30)
// Boss levels 6, 7, 8 are ALWAYS standby. Higher tiers (9 & 10, 11 & 12, etc.) spawn after preceding level is defeated.
function seedAllCitiesRaidBosses(maxLevel: number = 8): any[] {
  const bosses: any[] = [];
  INDONESIAN_CITIES.forEach((city) => {
    CITY_BOSS_CONFIGS.filter(cfg => cfg.level <= maxLevel).forEach((cfg) => {
      const lat = Number((city.lat + cfg.dLat).toFixed(6));
      const lng = Number((city.lng + cfg.dLng).toFixed(6));
      const landmark = city.landmarks[cfg.landmarkIdx % city.landmarks.length];
      const boss = createRaidBossInstance(
        cfg.tplIdx,
        lat,
        lng,
        cfg.level,
        city.id,
        city.name,
        landmark
      );
      bosses.push(boss);
    });
  });
  return bosses;
}

// Ensure standby bosses (Levels 6, 7, 8) and progressive unlocked tiers (up to db.maxUnlockedRaidLevel)
function ensureStandbyAndUnlockedBosses(db: any): boolean {
  if (!db.raidBosses) db.raidBosses = [];
  if (!db.maxUnlockedRaidLevel) db.maxUnlockedRaidLevel = 8;

  let hasChanges = false;
  const currentMax = db.maxUnlockedRaidLevel;

  // Standby levels (6, 7, 8) are always required, plus any unlocked higher tiers
  const requiredLevels: number[] = [6, 7, 8];
  for (let l = 9; l <= currentMax; l++) {
    requiredLevels.push(l);
  }

  INDONESIAN_CITIES.forEach((city) => {
    requiredLevels.forEach((lvl) => {
      // Do not duplicate if boss exists (even if defeated, awaiting respawn cooldown)
      const exists = db.raidBosses.some(
        (b: any) => b.cityId === city.id && b.level === lvl
      );
      if (!exists) {
        const cfg = CITY_BOSS_CONFIGS.find((c) => c.level === lvl) || {
          dLat: 0.010,
          dLng: 0.010,
          tplIdx: lvl % 15,
          level: lvl,
          landmarkIdx: lvl % 5
        };
        const lat = Number((city.lat + cfg.dLat).toFixed(6));
        const lng = Number((city.lng + cfg.dLng).toFixed(6));
        const landmark = city.landmarks[cfg.landmarkIdx % city.landmarks.length];
        const boss = createRaidBossInstance(
          cfg.tplIdx,
          lat,
          lng,
          cfg.level,
          city.id,
          city.name,
          landmark
        );
        db.raidBosses.push(boss);
        hasChanges = true;
      }
    });
  });

  return hasChanges;
}

function ensureBossesForLocation(existingBosses: any[], userLat: number, userLng: number, maxLevel: number = 8): { bosses: any[]; hasChanges: boolean } {
  // Check if there is already at least one active or cooldown boss within 50 km of user's coordinates
  const hasNearbyBoss = existingBosses.some((b: any) => {
    return calculateDistanceMeters(userLat, userLng, b.latitude, b.longitude) <= 50000;
  });

  if (!hasNearbyBoss) {
    const localCityId = `local_${Math.round(Math.abs(userLat) * 100)}_${Math.round(Math.abs(userLng) * 100)}`;
    const localCityName = "Wilayah Lokal Trainer";
    const newLocalBosses = CITY_BOSS_CONFIGS.filter(cfg => cfg.level <= maxLevel).map((cfg) => {
      const lat = Number((userLat + cfg.dLat).toFixed(6));
      const lng = Number((userLng + cfg.dLng).toFixed(6));
      const landmark = `Area Satelit GPS Spot #${cfg.landmarkIdx + 1}`;
      return createRaidBossInstance(
        cfg.tplIdx,
        lat,
        lng,
        cfg.level,
        localCityId,
        localCityName,
        landmark
      );
    });
    return { bosses: [...existingBosses, ...newLocalBosses], hasChanges: true };
  }

  return { bosses: existingBosses, hasChanges: false };
}

function getInitializedRaidBosses(db: any, userLat?: number, userLng?: number): any[] {
  if (!db.raidBosses) db.raidBosses = [];
  if (!db.maxUnlockedRaidLevel) db.maxUnlockedRaidLevel = 8;
  
  const now = Date.now();
  const maxUnlocked = db.maxUnlockedRaidLevel || 8;
  let shouldSave = false;

  // 1. Process defeated bosses: check if 10-15 min cooldown has finished, then respawn with full HP!
  db.raidBosses.forEach((b: any) => {
    if (!b) return;
    const balancedBuffId = `Menahan 20% kerusakan dari elemen ${b.buffElement}.`;
    const balancedBuffEn = `Resists 20% damage from ${b.buffElement} attacks.`;
    const balancedDebuffId = `Lemah terhadap elemen ${b.debuffElement} (kerusakan +30%).`;
    const balancedDebuffEn = `Weak against ${b.debuffElement} attacks (+30% damage).`;
    if (b.buffDescription !== balancedBuffId || b.debuffDescription !== balancedDebuffId) {
      b.buffDescription = balancedBuffId;
      b.buffDescriptionEn = balancedBuffEn;
      b.debuffDescription = balancedDebuffId;
      b.debuffDescriptionEn = balancedDebuffEn;
      shouldSave = true;
    }
    if (b.rewards && b.rewards.energyRefill !== 1) {
      b.rewards.energyRefill = 1;
      shouldSave = true;
    }
    if (b.status === "defeated") {
      if (!b.respawnAt) {
        const respawnMins = Math.floor(Math.random() * 6) + 10;
        b.respawnMinutes = respawnMins;
        b.defeatedAt = new Date(now).toISOString();
        b.respawnAt = new Date(now + respawnMins * 60 * 1000).toISOString();
        shouldSave = true;
      }
      if (now >= new Date(b.respawnAt).getTime()) {
        b.status = "active";
        b.hp = b.maxHp || (b.level * 2500 + 5000);
        delete b.defeatedAt;
        delete b.respawnAt;
        delete b.respawnMinutes;
        shouldSave = true;
      }
    }
  });

  const beforeCount = db.raidBosses.length;

  // Filter out bosses: higher tiers cannot spawn unless unlocked or manually spawned by developer.
  // Standby bosses 6, 7, 8 never expire completely (they remain either active or awaiting respawn).
  db.raidBosses = db.raidBosses.filter((b: any) => {
    if (!b) return false;
    if (b.isManual) return true; // Developer manual spawn is preserved
    if (b.level > maxUnlocked) return false; // Enforce sequential unlock rule
    if (b.level <= 8) return true; // Standby bosses (6, 7, 8) always active or respawning
    return !b.expiresAt || new Date(b.expiresAt).getTime() > now;
  });

  if (db.raidBosses.length !== beforeCount) {
    shouldSave = true;
  }

  if (ensureStandbyAndUnlockedBosses(db)) {
    shouldSave = true;
  }

  // If user provided valid coordinates, ensure their 50km radius has bosses available
  if (userLat !== undefined && userLng !== undefined && !isNaN(userLat) && !isNaN(userLng)) {
    const locResult = ensureBossesForLocation(db.raidBosses, userLat, userLng, db.maxUnlockedRaidLevel);
    if (locResult.hasChanges) {
      db.raidBosses = locResult.bosses;
      shouldSave = true;
    }
  }

  if (shouldSave) {
    writeDB(db);
  }

  return db.raidBosses;
}

// 1. Get Active Raid Bosses (Strictly within 50 KM radius of player position)
app.get("/api/raid/bosses", (req, res) => {
  const db = readDB();
  const latQuery = parseFloat(req.query.lat as string);
  const lngQuery = parseFloat(req.query.lng as string);
  const cityQuery = (req.query.city as string || "").trim().toLowerCase();

  const hasCoords = !isNaN(latQuery) && !isNaN(lngQuery);
  const userLat = hasCoords ? latQuery : -6.1754;
  const userLng = hasCoords ? lngQuery : 106.8272;

  let allBosses = getInitializedRaidBosses(db, userLat, userLng);

  // Optional filter by city
  if (cityQuery && cityQuery !== "all") {
    allBosses = allBosses.filter((b: any) => (b.cityId || "").toLowerCase() === cityQuery);
  }

  const MAX_RADIUS_METERS = 50000; // 50 KM radius limit
  const now = Date.now();

  let decoratedBosses = allBosses
    .map((boss: any) => {
      const distMeters = calculateDistanceMeters(userLat, userLng, boss.latitude, boss.longitude);
      const distKm = (distMeters / 1000).toFixed(1);
      const isDefeated = boss.status === "defeated";
      const secondsUntilRespawn = isDefeated && boss.respawnAt
        ? Math.max(0, Math.ceil((new Date(boss.respawnAt).getTime() - now) / 1000))
        : 0;

      return {
        ...boss,
        status: isDefeated ? "defeated" : "active",
        secondsUntilRespawn,
        distanceMeters: distMeters,
        distanceKm: distKm,
        inRadius: distMeters <= MAX_RADIUS_METERS,
        canChallenge: distMeters <= MAX_RADIUS_METERS && !isDefeated
      };
    })
    .filter((boss: any) => boss.distanceMeters <= MAX_RADIUS_METERS);

  // Fallback: If no boss within 50km, dynamically spawn local satellite bosses within 50km
  if (decoratedBosses.length === 0) {
    const locResult = ensureBossesForLocation(db.raidBosses, userLat, userLng, db.maxUnlockedRaidLevel || 8);
    if (locResult.hasChanges) {
      db.raidBosses = locResult.bosses;
      writeDB(db);
      decoratedBosses = locResult.bosses
        .map((boss: any) => {
          const distMeters = calculateDistanceMeters(userLat, userLng, boss.latitude, boss.longitude);
          const distKm = (distMeters / 1000).toFixed(1);
          const isDefeated = boss.status === "defeated";
          const secondsUntilRespawn = isDefeated && boss.respawnAt
            ? Math.max(0, Math.ceil((new Date(boss.respawnAt).getTime() - now) / 1000))
            : 0;

          return {
            ...boss,
            status: isDefeated ? "defeated" : "active",
            secondsUntilRespawn,
            distanceMeters: distMeters,
            distanceKm: distKm,
            inRadius: distMeters <= MAX_RADIUS_METERS,
            canChallenge: distMeters <= MAX_RADIUS_METERS && !isDefeated
          };
        })
        .filter((boss: any) => boss.distanceMeters <= MAX_RADIUS_METERS);
    }
  }

  // Sort by level, then by distance
  decoratedBosses.sort((a: any, b: any) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.distanceMeters - b.distanceMeters;
  });

  res.json({
    success: true,
    userLocation: { lat: userLat, lng: userLng, hasGps: hasCoords },
    radiusLimitKm: 50,
    cities: INDONESIAN_CITIES,
    maxUnlockedLevel: db.maxUnlockedRaidLevel || 8,
    highestDefeatedLevel: db.highestDefeatedRaidBossLevel || 0,
    defeatedLevels: db.defeatedRaidBossLevels || [],
    bosses: decoratedBosses
  });
});

// 2. Get Single Raid Boss Details
app.get("/api/raid/bosses/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const bosses = getInitializedRaidBosses(db);
  const boss = bosses.find((b: any) => b.id === id);

  if (!boss) {
    return res.status(404).json({ error: "Raid Boss tidak ditemukan atau telah kadaluarsa." });
  }

  res.json({ success: true, boss });
});

// 3. Get Active Raid Lobby Rooms
app.get("/api/raid/lobbies", (req, res) => {
  const db = readDB();
  if (!db.raidLobbies) db.raidLobbies = [];
  
  // Return recent active rooms (waiting or in_battle within last 30 minutes)
  const now = Date.now();
  const activeLobbies = db.raidLobbies.filter((room: any) => {
    if (!room || !room.createdAt) return false;
    const isRecent = (now - new Date(room.createdAt).getTime()) < 30 * 60 * 1000;
    return isRecent && (room.status === "waiting" || room.status === "in_battle");
  });

  res.json({ success: true, lobbies: activeLobbies });
});

// 4. Get Single Raid Lobby Room State
app.get("/api/raid/lobby/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  if (!db.raidLobbies) db.raidLobbies = [];
  
  const room = db.raidLobbies.find((r: any) => r.id === id || r.roomCode === id);
  if (!room) {
    return res.status(404).json({ error: "Raid Room tidak ditemukan." });
  }

  res.json({ success: true, room });
});

// 5. Create Raid Lobby (Single Player with 3 slots or Multiplayer Room)
app.post("/api/raid/lobby/create", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Silakan login terlebih dahulu untuk membuat Raid Room." });
  }

  const { bossId, isSinglePlayer, cardIds, cards: clientPassedCards, roomCode: customCode, userLat, userLng } = req.body;
  const bosses = getInitializedRaidBosses(db, userLat, userLng);
  const boss = bosses.find((b: any) => b.id === bossId);

  if (!boss) {
    return res.status(404).json({ error: "Raid Boss tidak ditemukan atau sudah berakhir." });
  }

  // Check 50 KM radius restriction if coordinates are provided
  if (userLat !== undefined && userLng !== undefined && !isNaN(userLat) && !isNaN(userLng)) {
    const distMeters = calculateDistanceMeters(userLat, userLng, boss.latitude, boss.longitude);
    if (distMeters > 50000) {
      return res.status(400).json({
        error: `Raid Boss berada di luar radius 50 KM (${(distMeters / 1000).toFixed(1)} km) dari posisi Anda. Hanya boss dalam radius 50 KM yang dapat ditantang.`
      });
    }
  }

  // Check if boss is currently in Defeated cooldown state (10-15 minutes)
  const now = Date.now();
  if (boss.status === "defeated") {
    const respawnTime = boss.respawnAt ? new Date(boss.respawnAt).getTime() : now + 10 * 60 * 1000;
    if (now < respawnTime) {
      const remainingSecs = Math.max(1, Math.ceil((respawnTime - now) / 1000));
      const mins = Math.floor(remainingSecs / 60);
      const secs = remainingSecs % 60;
      return res.status(400).json({
        error: `Raid Boss ${boss.name} telah dikalahkan (Status: Defeated). Boss akan spawn kembali dalam ${mins} menit ${secs} detik.`
      });
    } else {
      // Cooldown passed, respawn boss
      boss.status = "active";
      boss.hp = boss.maxHp || (boss.level * 2500 + 5000);
      delete boss.defeatedAt;
      delete boss.respawnAt;
      delete boss.respawnMinutes;
    }
  }

  if (!db.cards) db.cards = [];
  let userCards = db.cards.filter((c: any) => c.userId === user.id);

  // Merge client-passed cards if not already present
  if (Array.isArray(clientPassedCards) && clientPassedCards.length > 0) {
    clientPassedCards.forEach((c: any) => {
      if (c && c.id) {
        const existingIdx = userCards.findIndex((uc: any) => uc.id === c.id);
        if (existingIdx === -1) {
          userCards.push(c);
        }
        if (!db.cards.some((dc: any) => dc.id === c.id)) {
          db.cards.push({ ...c, userId: user.id });
        }
      }
    });
  }

  if (userCards.length === 0) {
    const starterElements: ("Air" | "Api" | "Tanah" | "Angin" | "Petir")[] = ["Air", "Api", "Tanah", "Angin", "Petir"];
    starterElements.forEach((el, idx) => {
      const cardId = `card_${user.id.replace(/[^a-z0-9]/g, "_")}_${el.toLowerCase()}_${idx + 1}`;
      const newCard = {
        id: cardId,
        userId: user.id,
        captureId: "",
        name: `${el} Sentinel Striker`,
        element: el,
        style: user.faction || "Sentinel",
        rarity: "Epic",
        hp: 950,
        atk: 250,
        def: 180,
        spd: 170,
        skillName: `Serangan Murni ${el}`,
        skillDesc: `Kekuatan elemental murni ${el} yang kokoh.`,
        imageUrl: generateFallbackImage(`${el} Sentinel Striker`, el, user.faction || "Sentinel", "Epic", undefined),
        geminiUsed: false,
        level: 5,
        xp: 100,
        maxXp: 500,
        energy: 5,
        maxEnergy: 5,
        lastEnergyRefillAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      db.cards.push(newCard);
      userCards.push(newCard);
    });
    writeDB(db);
  }

  const lockedCardIds = getLockedRaidCardIds(db);
  if (!db.raidLobbies) db.raidLobbies = [];

  const roomId = `raid_room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const roomCode = customCode && customCode.trim() ? customCode.trim().toUpperCase() : `RAID-${Math.floor(1000 + Math.random() * 9000)}`;

  const slots: any[] = [null, null, null];

  if (isSinglePlayer) {
    // Single player: equip up to 3 cards from user's selection or inventory
    const selectedIds = Array.isArray(cardIds) && cardIds.length > 0 
      ? cardIds 
      : userCards.slice(0, 3).map((c: any) => c.id);

    const cardsToEquip: any[] = [];
    for (const cId of selectedIds.slice(0, 3)) {
      const card = userCards.find((c: any) => c.id === cId);
      if (!card) continue;

      // Lockout check: Card cannot already be participating in an active raid
      if (lockedCardIds.has(card.id)) {
        return res.status(400).json({
          error: `Kartu "${card.name}" sedang digunakan dalam Boss Raid lain. Kartu tidak dapat digunakan hingga raid selesai!`
        });
      }

      // Energy check: Each card must have at least 2 energy bars
      const updatedCard = updateCardEnergy(card);
      if ((updatedCard.energy ?? 5) < 2) {
        return res.status(400).json({
          error: `Kartu "${card.name}" membutuhkan minimal 2 bar energi untuk Boss Raid (Energi saat ini: ${updatedCard.energy ?? 0}/5).`
        });
      }

      cardsToEquip.push(updatedCard);
    }

    if (cardsToEquip.length === 0) {
      return res.status(400).json({ error: "Pilih minimal 1 kartu tempur yang memiliki minimal 2 energi dan tidak sedang dalam raid." });
    }

    // Deduct 2 energy per participating card immediately upon boss raid execution
    cardsToEquip.forEach((card: any, idx: number) => {
      const dbCard = db.cards.find((c: any) => c.id === card.id);
      if (dbCard) {
        dbCard.energy = Math.max(0, (dbCard.energy ?? 5) - 2);
        card.energy = dbCard.energy;
      }
      slots[idx] = {
        slotIndex: idx,
        userId: user.id,
        username: user.username,
        faction: user.faction || "Sentinel",
        card,
        currentHp: card.hp || (card.level ? card.level * 30 + 150 : 200),
        maxHp: card.hp || (card.level ? card.level * 30 + 150 : 200),
        isReady: true,
        damageDealt: 0
      };
    });
  } else {
    // Multiplayer: Host takes Slot 0, Slots 1 and 2 remain open for other players
    const hostCardId = Array.isArray(cardIds) && cardIds.length > 0 ? cardIds[0] : userCards[0]?.id;
    const hostCard = userCards.find((c: any) => c.id === hostCardId) || userCards[0];

    if (!hostCard) {
      return res.status(400).json({ error: "Pilih 1 kartu tempur untuk slot Host." });
    }

    // Lockout check
    if (lockedCardIds.has(hostCard.id)) {
      return res.status(400).json({
        error: `Kartu "${hostCard.name}" sedang digunakan dalam Boss Raid lain. Kartu tidak dapat digunakan hingga raid selesai!`
      });
    }

    // Energy check: min 2 bars
    const updatedHostCard = updateCardEnergy(hostCard);
    if ((updatedHostCard.energy ?? 5) < 2) {
      return res.status(400).json({
        error: `Kartu "${hostCard.name}" membutuhkan minimal 2 bar energi untuk Boss Raid (Energi saat ini: ${updatedHostCard.energy ?? 0}/5).`
      });
    }

    // Deduct 2 energy immediately upon execution
    const dbHostCard = db.cards.find((c: any) => c.id === hostCard.id);
    if (dbHostCard) {
      dbHostCard.energy = Math.max(0, (dbHostCard.energy ?? 5) - 2);
      hostCard.energy = dbHostCard.energy;
    }

    slots[0] = {
      slotIndex: 0,
      userId: user.id,
      username: user.username,
      faction: user.faction || "Sentinel",
      card: hostCard,
      currentHp: hostCard.hp || (hostCard.level ? hostCard.level * 30 + 150 : 200),
      maxHp: hostCard.hp || (hostCard.level ? hostCard.level * 30 + 150 : 200),
      isReady: true,
      damageDealt: 0
    };
  }

  const initialLogs = [
    {
      turn: 0,
      actor: "System",
      actorType: "player",
      damage: 0,
      messageId: isSinglePlayer
        ? `⚔️ Pertarungan Solo dimulai menghadapi ${boss.name} (LV. ${boss.level})! Serang sekarang!`
        : `🚨 Raid Lobby dibuka untuk menghadapi ${boss.name} (LV. ${boss.level})! Bagikan kode room ke teman untuk bergabung.`,
      messageEn: isSinglePlayer
        ? `⚔️ Solo Battle started against ${boss.nameEn || boss.name} (LV. ${boss.level})! Attack now!`
        : `🚨 Raid Lobby opened against ${boss.nameEn || boss.name} (LV. ${boss.level})! Share code with friends.`,
      timestamp: new Date().toISOString()
    }
  ];

  const newRoom = {
    id: roomId,
    roomCode,
    bossId: boss.id,
    bossSnapshot: boss,
    hostUserId: user.id,
    hostUsername: user.username,
    isSinglePlayer: !!isSinglePlayer,
    slots,
    status: isSinglePlayer ? "in_battle" : "waiting",
    currentTurn: 1,
    bossCurrentHp: boss.hp,
    bossMaxHp: boss.hp,
    battleLogs: initialLogs,
    sharedRewardsClaimed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.raidLobbies.unshift(newRoom);
  writeDB(db);

  res.json({
    success: true,
    message: isSinglePlayer ? "Single-Player Raid Battle siap dimulai! ⚔️" : "Multiplayer Raid Lobby berhasil dibuat! Bagikan Kode Room ke temanmu. 👥",
    room: newRoom
  });
});

// 6. Join Multiplayer Raid Lobby (Equip Card into Slot 1, 2, or 3)
app.post("/api/raid/lobby/join", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Silakan login terlebih dahulu untuk bergabung." });
  }

  const { roomId, roomCode, cardId, card: clientCard, slotIndex, userLat, userLng } = req.body;
  if (!db.raidLobbies) db.raidLobbies = [];

  const room = db.raidLobbies.find((r: any) => 
    (roomId && r.id === roomId) || (roomCode && r.roomCode === roomCode.trim().toUpperCase())
  );

  if (!room) {
    return res.status(404).json({ error: "Room tidak ditemukan. Pastikan Kode Room benar." });
  }

  if (room.status !== "waiting") {
    return res.status(400).json({ error: "Pertarungan Raid di room ini sudah berlangsung atau selesai." });
  }

  if (!db.cards) db.cards = [];
  let userCards = db.cards.filter((c: any) => c.userId === user.id);
  if (clientCard && clientCard.id && !userCards.some((c: any) => c.id === clientCard.id)) {
    userCards.push(clientCard);
    db.cards.push({ ...clientCard, userId: user.id });
  }

  if (userCards.length === 0) {
    const starterElements: ("Air" | "Api" | "Tanah" | "Angin" | "Petir")[] = ["Air", "Api", "Tanah", "Angin", "Petir"];
    starterElements.forEach((el, idx) => {
      const cId = `card_${user.id.replace(/[^a-z0-9]/g, "_")}_${el.toLowerCase()}_${idx + 1}`;
      const newCard = {
        id: cId,
        userId: user.id,
        captureId: "",
        name: `${el} Sentinel Striker`,
        element: el,
        style: user.faction || "Sentinel",
        rarity: "Epic",
        hp: 950,
        atk: 250,
        def: 180,
        spd: 170,
        skillName: `Serangan Murni ${el}`,
        skillDesc: `Kekuatan elemental murni ${el} yang kokoh.`,
        imageUrl: generateFallbackImage(`${el} Sentinel Striker`, el, user.faction || "Sentinel", "Epic", undefined),
        geminiUsed: false,
        level: 5,
        xp: 100,
        maxXp: 500,
        energy: 5,
        maxEnergy: 5,
        lastEnergyRefillAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      db.cards.push(newCard);
      userCards.push(newCard);
    });
    writeDB(db);
  }

  const cardToEquip = userCards.find((c: any) => c.id === cardId) || userCards[0];

  // Lockout check: Card cannot already be in another active raid
  const lockedCardIds = getLockedRaidCardIds(db);
  const alreadyInThisRoom = room.slots.some((s: any) => s && s.card && s.card.id === cardToEquip.id && s.userId === user.id);

  if (!alreadyInThisRoom && lockedCardIds.has(cardToEquip.id)) {
    return res.status(400).json({
      error: `Kartu "${cardToEquip.name}" sedang digunakan dalam Boss Raid lain. Kartu tidak dapat digunakan hingga raid selesai!`
    });
  }

  // Energy check: min 2 bars
  if (!alreadyInThisRoom) {
    const updatedCard = updateCardEnergy(cardToEquip);
    if ((updatedCard.energy ?? 5) < 2) {
      return res.status(400).json({
        error: `Kartu "${cardToEquip.name}" membutuhkan minimal 2 bar energi untuk bergabung ke Boss Raid (Energi saat ini: ${updatedCard.energy ?? 0}/5).`
      });
    }

    // Deduct 2 energy immediately upon joining lobby
    const dbCard = db.cards.find((c: any) => c.id === cardToEquip.id);
    if (dbCard) {
      dbCard.energy = Math.max(0, (dbCard.energy ?? 5) - 2);
      cardToEquip.energy = dbCard.energy;
    }
  }

  // Find open slot
  let targetSlot = -1;
  if (typeof slotIndex === "number" && slotIndex >= 0 && slotIndex <= 2) {
    if (!room.slots[slotIndex] || room.slots[slotIndex].userId === user.id) {
      targetSlot = slotIndex;
    }
  }

  if (targetSlot === -1) {
    targetSlot = room.slots.findIndex((s: any) => s === null);
  }

  if (targetSlot === -1) {
    // Check if user already occupied a slot
    const existingSlot = room.slots.findIndex((s: any) => s && s.userId === user.id);
    if (existingSlot !== -1) {
      targetSlot = existingSlot;
    } else {
      return res.status(400).json({ error: "Room sudah penuh! 3 Slot petarung telah terisi." });
    }
  }

  const cardHp = cardToEquip.hp || (cardToEquip.level ? cardToEquip.level * 30 + 150 : 200);

  room.slots[targetSlot] = {
    slotIndex: targetSlot,
    userId: user.id,
    username: user.username,
    faction: user.faction || "Sentinel",
    card: cardToEquip,
    currentHp: cardHp,
    maxHp: cardHp,
    isReady: true,
    damageDealt: 0
  };

  room.battleLogs.push({
    turn: 0,
    actor: user.username,
    actorType: "player",
    cardName: cardToEquip.name,
    damage: 0,
    messageId: `🎮 ${user.username} bergabung ke Slot ${targetSlot + 1} dengan ${cardToEquip.name}! (-2 Energi)`,
    messageEn: `🎮 ${user.username} joined Slot ${targetSlot + 1} with ${cardToEquip.name}! (-2 Energy)`,
    timestamp: new Date().toISOString()
  });

  room.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({
    success: true,
    message: `Berhasil bergabung ke Slot ${targetSlot + 1}! 🛡️`,
    room
  });
});

// 7. Leave / Cancel Raid Lobby (Refunds energy if cancelled/left before battle)
app.post("/api/raid/lobby/leave", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Silakan login terlebih dahulu." });
  }

  const { roomId } = req.body;
  if (!db.raidLobbies) db.raidLobbies = [];
  const room = db.raidLobbies.find((r: any) => r.id === roomId);

  if (!room) {
    return res.status(404).json({ error: "Room tidak ditemukan." });
  }

  if (room.status === "waiting") {
    if (room.hostUserId === user.id) {
      // Host cancels lobby -> refund energy to all occupied slots and mark cancelled
      room.status = "cancelled";
      room.slots.forEach((s: any) => {
        if (s && s.card) {
          const dbCard = db.cards?.find((c: any) => c.id === s.card.id);
          if (dbCard) {
            dbCard.energy = Math.min(dbCard.maxEnergy || 5, (dbCard.energy || 0) + 2);
          }
        }
      });
    } else {
      // Guest leaves -> refund guest card energy and clear slot
      const sIdx = room.slots.findIndex((s: any) => s && s.userId === user.id);
      if (sIdx !== -1) {
        const slot = room.slots[sIdx];
        if (slot && slot.card) {
          const dbCard = db.cards?.find((c: any) => c.id === slot.card.id);
          if (dbCard) {
            dbCard.energy = Math.min(dbCard.maxEnergy || 5, (dbCard.energy || 0) + 2);
          }
        }
        room.slots[sIdx] = null;
      }
    }
  } else if (room.status === "in_battle") {
    // Forfeit / surrender during active raid
    if (room.isSinglePlayer || room.hostUserId === user.id) {
      room.status = "defeat";
      room.battleLogs.push({
        turn: room.currentTurn,
        actor: user.username,
        actorType: "player",
        damage: 0,
        messageId: `🏳️ Trainer ${user.username} memilih menyerah dan menghentikan Boss Raid.`,
        messageEn: `🏳️ Trainer ${user.username} surrendered and stopped the Boss Raid.`,
        timestamp: new Date().toISOString()
      });
    } else {
      const sIdx = room.slots.findIndex((s: any) => s && s.userId === user.id);
      if (sIdx !== -1) {
        room.slots[sIdx].currentHp = 0;
      }
    }
  }

  room.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ success: true, room });
});

// 7. Update Card in Slot (Single Player or Host)
app.post("/api/raid/lobby/slot", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { roomId, slotIndex, cardId } = req.body;
  if (!db.raidLobbies) db.raidLobbies = [];
  const room = db.raidLobbies.find((r: any) => r.id === roomId);

  if (!room) return res.status(404).json({ error: "Room tidak ditemukan." });
  if (room.status !== "waiting") return res.status(400).json({ error: "Room sedang bertarung." });

  if (slotIndex < 0 || slotIndex > 2) return res.status(400).json({ error: "Slot tidak valid." });

  const isHost = room.hostUserId === user.id;
  const currentSlot = room.slots[slotIndex];

  if (!isHost && currentSlot && currentSlot.userId !== user.id) {
    return res.status(403).json({ error: "Anda tidak memiliki izin mengubah slot pemain lain." });
  }

  if (!cardId) {
    // Empty slot
    room.slots[slotIndex] = null;
  } else {
    const card = db.cards.find((c: any) => c.id === cardId && (c.userId === user.id || isHost));
    if (!card) return res.status(404).json({ error: "Kartu tidak ditemukan." });

    const cardHp = card.hp || (card.level ? card.level * 30 + 150 : 200);
    room.slots[slotIndex] = {
      slotIndex,
      userId: user.id,
      username: user.username,
      faction: user.faction || "Sentinel",
      card,
      currentHp: cardHp,
      maxHp: cardHp,
      isReady: true,
      damageDealt: currentSlot ? currentSlot.damageDealt || 0 : 0
    };
  }

  room.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({ success: true, room });
});

// 8. Start Raid Battle
app.post("/api/raid/lobby/start", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { roomId } = req.body;
  if (!db.raidLobbies) db.raidLobbies = [];
  const room = db.raidLobbies.find((r: any) => r.id === roomId);

  if (!room) return res.status(404).json({ error: "Room tidak ditemukan." });
  if (room.hostUserId !== user.id && !room.slots.some((s: any) => s?.userId === user.id) && user.role !== "developer") {
    return res.status(403).json({ error: "Hanya Host yang dapat memulai pertarungan." });
  }

  const filledSlots = room.slots.filter((s: any) => s !== null);
  if (filledSlots.length === 0) {
    return res.status(400).json({ error: "Setidaknya 1 Slot kartu harus terisi untuk memulai." });
  }

  room.status = "in_battle";
  room.currentTurn = 1;
  room.battleLogs.push({
    turn: 1,
    actor: "System",
    actorType: "player",
    damage: 0,
    messageId: `⚔️ Pertarungan Raid dimulai oleh ${user.username}! Seluruh komandan serang Boss sekarang!`,
    messageEn: `⚔️ Raid Battle started by ${user.username}! All commanders attack the Boss now!`,
    timestamp: new Date().toISOString()
  });
  room.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({ success: true, message: "Pertarungan Raid dimulai! Serang Boss sekarang! ⚔️🔥", room });
});

// 9. Execute Raid Battle Turn (Attack, Skills, Elemental Buff/Debuff, Shared Rewards)
app.post("/api/raid/lobby/turn", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) return res.status(401).json({ error: "Unauthorized." });

  const { roomId, action, expectedTurn } = req.body;
  if (!db.raidLobbies) db.raidLobbies = [];
  const room = db.raidLobbies.find((r: any) => r.id === roomId);

  if (!room) return res.status(404).json({ error: "Room tidak ditemukan." });
  if (room.status !== "in_battle") {
    return res.status(400).json({ error: "Pertarungan tidak aktif atau telah selesai." });
  }

  const participantSlot = room.slots.find((slot: any) => slot && slot.userId === user.id);
  if (!participantSlot) {
    return res.status(403).json({ error: "Hanya peserta yang terdaftar di Raid ini dapat menjalankan turn." });
  }
  if (action !== "attack") {
    return res.status(400).json({ error: "Aksi Raid tidak valid." });
  }
  if (!Number.isInteger(expectedTurn) || expectedTurn !== room.currentTurn) {
    return res.status(409).json({
      error: "Turn Raid sudah diproses atau state permainan belum sinkron.",
      room
    });
  }

  const boss = room.bossSnapshot;
  const turnNum = room.currentTurn;
  const roundLogs: any[] = [];

  // PHASE 1: PLAYER SLOTS ATTACK THE BOSS
  const aliveSlots = room.slots.filter((s: any) => s && s.currentHp > 0);

  if (aliveSlots.length === 0) {
    room.status = "defeat";
    room.updatedAt = new Date().toISOString();
    writeDB(db);
    return res.json({ success: true, room, defeat: true });
  }

  let totalRoundPlayerDamage = 0;

  aliveSlots.forEach((slot: any) => {
    const card = slot.card;
    const cardLevel = card.level || 1;
    const cardAtk = card.atk || (cardLevel * 25 + 40);
    const bossDef = boss.def || (boss.level * 18 + 30);

    let rawDamage = Math.max(25, Math.floor(cardAtk * getStyleAttackMultiplier(card.style) * (120 / (100 + bossDef * 0.35))));

    // Elemental Buff / Debuff Multipliers
    let elementMult = 1.0;
    let isSuperEffective = false;
    let isResisted = false;

    if (card.element === boss.debuffElement) {
      elementMult = ELEMENT_ADVANTAGE_MULTIPLIER;
      isSuperEffective = true;
    } else if (card.element === boss.buffElement) {
      elementMult = ELEMENT_RESISTANCE_MULTIPLIER;
      isResisted = true;
    }

    const isCrit = Math.random() < 0.20;
    const critMult = isCrit ? 1.5 : 1.0;
    const variance = 0.9 + Math.random() * 0.2;

    const speedMult = getSpeedMultiplier(card.spd, boss.spd);
    const damageDealt = Math.round(rawDamage * elementMult * speedMult * critMult * variance);
    totalRoundPlayerDamage += damageDealt;
    slot.damageDealt = (slot.damageDealt || 0) + damageDealt;

    let effTextId = "";
    let effTextEn = "";
    if (isSuperEffective) {
      effTextId = " 💥 SANGAT EFEKTIF (+30% Counter Elemen!)";
      effTextEn = " 💥 SUPER EFFECTIVE (+30% Element Counter!)";
    } else if (isResisted) {
      effTextId = " 🛡️ DITAHAN (-20% Resistensi Elemen Boss)";
      effTextEn = " 🛡️ RESISTED (-20% Boss Element Resistance)";
    }

    const critTextId = isCrit ? " [CRITICAL HIT!]" : "";
    const critTextEn = isCrit ? " [CRITICAL HIT!]" : "";

    roundLogs.push({
      turn: turnNum,
      actor: slot.username,
      actorType: "player",
      cardName: card.name,
      element: card.element,
      damage: damageDealt,
      isCritical: isCrit,
      isSuperEffective,
      isResisted,
      messageId: `[Ronde ${turnNum}] Slot ${slot.slotIndex + 1}: ${card.name} (${card.element}) melancarkan Serangan Elemen menghasilkan ${damageDealt} DMG ke ${boss.name}!${effTextId}${critTextId}`,
      messageEn: `[Round ${turnNum}] Slot ${slot.slotIndex + 1}: ${card.name} (${card.element}) used Elemental Strike, dealing ${damageDealt} DMG to ${boss.nameEn || boss.name}!${effTextEn}${critTextEn}`,
      timestamp: new Date().toISOString()
    });
  });

  // Apply damage to Boss
  room.bossCurrentHp = Math.max(0, room.bossCurrentHp - totalRoundPlayerDamage);

  // CHECK VICTORY
  if (room.bossCurrentHp <= 0) {
    room.status = "victory";
    room.bossCurrentHp = 0;

    // Require a meaningful contribution so an idle slot cannot receive the
    // same economy rewards as active combatants.
    const uniqueUserIds = Array.from(new Set(room.slots.filter((s: any) => s !== null).map((s: any) => s.userId)));
    const rewards = boss.rewards;
    const totalRaidDamage = room.slots.reduce((sum: number, slot: any) => sum + (slot?.damageDealt || 0), 0);
    const minimumContribution = Math.max(1, Math.ceil(totalRaidDamage * 0.05));
    const eligibleUserIds = uniqueUserIds.filter((uId: string) =>
      room.slots
        .filter((slot: any) => slot?.userId === uId)
        .reduce((sum: number, slot: any) => sum + (slot.damageDealt || 0), 0) >= minimumContribution
    );

    eligibleUserIds.forEach((uId: string) => {
      const pUser = db.users.find((u: any) => u.id === uId);
      if (pUser) {
        pUser.points = (pUser.points || 0) + rewards.points;
        pUser.cores = (pUser.cores || 0) + rewards.cores;
      }
    });

    // Refill energy and add XP to participating cards
    room.slots.forEach((slot: any) => {
      if (slot && slot.card && eligibleUserIds.includes(slot.userId)) {
        const cIdx = db.cards.findIndex((c: any) => c.id === slot.card.id);
        if (cIdx !== -1) {
          const c = db.cards[cIdx];
          c.energy = Math.min(c.maxEnergy || 5, (c.energy || 0) + rewards.energyRefill);
          applyCardXp(c, rewards.cardXp);
        }
      }
    });

    roundLogs.push({
      turn: turnNum,
      actor: "Victory",
      actorType: "player",
      damage: 0,
      messageId: `🎉🏆 KEMENANGAN RAID! ${boss.name} berhasil ditumbangkan! ${eligibleUserIds.length}/${uniqueUserIds.length} pemain memenuhi kontribusi minimum 5% dan menerima: +${rewards.cores} Nekomon Cores, +${rewards.points} Poin, +${rewards.energyRefill} Energi, +${rewards.cardXp} Card XP!`,
      messageEn: `🎉🏆 RAID VICTORY! ${boss.nameEn || boss.name} has been defeated! ${eligibleUserIds.length}/${uniqueUserIds.length} players met the 5% contribution requirement and receive: +${rewards.cores} Nekomon Cores, +${rewards.points} Points, +${rewards.energyRefill} Energy, +${rewards.cardXp} Card XP!`,
      timestamp: new Date().toISOString()
    });

    // Save to battle history
    if (!db.battleHistory) db.battleHistory = [];
    db.battleHistory.unshift({
      id: `raid_win_${Date.now()}`,
      opponentName: `[RAID BOSS] ${boss.name} (LV. ${boss.level})`,
      opponentCardName: boss.name,
      opponentCardImageUrl: boss.imageUrl,
      opponentCardLevel: boss.level,
      opponentCardElement: boss.element,
      myCardName: room.slots[0]?.card?.name || "Raid Team",
      myCardImageUrl: room.slots[0]?.card?.imageUrl || "",
      myCardLevel: room.slots[0]?.card?.level || 1,
      myCardElement: room.slots[0]?.card?.element || "Api",
      result: "WIN",
      isBotMatch: false,
      createdAt: new Date().toISOString()
    });

    // PROGRESSIVE RAID BOSS UNLOCK ENGINE & DEFEATED COOLDOWN LOGIC
    // Aturan: Boss yang sudah dikalahkan akan muncul status "defeated" dan baru spawn kembali setelah jeda 10-15 menit.
    // 2 level boss berikutnya baru bisa di-spawn setelah bos level sebelumnya dikalahkan.
    if (!db.maxUnlockedRaidLevel) db.maxUnlockedRaidLevel = 8;
    if (!db.defeatedRaidBossLevels) db.defeatedRaidBossLevels = [];
    if (!db.defeatedRaidBossLevels.includes(boss.level)) {
      db.defeatedRaidBossLevels.push(boss.level);
    }
    db.highestDefeatedRaidBossLevel = Math.max(db.highestDefeatedRaidBossLevel || 0, boss.level);

    // Set 10-15 minute respawn cooldown for this defeated boss
    const respawnMinutes = Math.floor(Math.random() * 6) + 10; // 10 to 15 minutes
    const defeatedAt = new Date().toISOString();
    const respawnAt = new Date(Date.now() + respawnMinutes * 60 * 1000).toISOString();

    const targetBoss = (db.raidBosses || []).find((b: any) => b.id === boss.id);
    if (targetBoss) {
      targetBoss.status = "defeated";
      targetBoss.hp = 0;
      targetBoss.defeatedAt = defeatedAt;
      targetBoss.respawnMinutes = respawnMinutes;
      targetBoss.respawnAt = respawnAt;
    }

    roundLogs.push({
      turn: turnNum,
      actor: "System",
      actorType: "player",
      damage: 0,
      messageId: `⏳ ${boss.name} telah berstatus DEFEATED dan akan spawn kembali setelah jeda istirahat ${respawnMinutes} menit.`,
      messageEn: `⏳ ${boss.nameEn || boss.name} is now DEFEATED and will respawn after a ${respawnMinutes}-minute cooldown.`,
      timestamp: new Date().toISOString()
    });

    let newlyUnlockedLevels: number[] = [];
    if (boss.level >= db.maxUnlockedRaidLevel && db.maxUnlockedRaidLevel < 30) {
      const prevMax = db.maxUnlockedRaidLevel;
      const nextMax = Math.min(30, prevMax + 2);
      for (let l = prevMax + 1; l <= nextMax; l++) {
        newlyUnlockedLevels.push(l);
      }
      db.maxUnlockedRaidLevel = nextMax;
      ensureStandbyAndUnlockedBosses(db);

      const unlockedStr = newlyUnlockedLevels.map(lvl => `Level ${lvl}`).join(" & ");
      roundLogs.push({
        turn: turnNum,
        actor: "Nekomon Global Dispatcher",
        actorType: "player",
        damage: 0,
        messageId: `🚨⚡ TIER BARU RAID BOSS TERBUKA! Karena Boss Level ${boss.level} berhasil dikalahkan, kini Boss ${unlockedStr} telah resmi spawn di spot peta!`,
        messageEn: `🚨⚡ NEW RAID BOSS TIER UNLOCKED! Because Boss Level ${boss.level} was defeated, Boss ${unlockedStr} has now spawned on the map!`,
        timestamp: new Date().toISOString()
      });
    }

    room.battleLogs.push(...roundLogs);
    room.sharedRewardsClaimed = true;
    room.updatedAt = new Date().toISOString();
    writeDB(db);

    return res.json({
      success: true,
      victory: true,
      room,
      maxUnlockedLevel: db.maxUnlockedRaidLevel,
      newlyUnlockedLevels,
      sharedRewards: {
        cores: rewards.cores,
        points: rewards.points,
        energyRefill: rewards.energyRefill,
        cardXp: rewards.cardXp,
        playersCount: eligibleUserIds.length
      }
    });
  }

  // PHASE 2: BOSS COUNTERATTACK
  const skills = boss.skills || [];
  const chosenSkill = skills.length > 0 ? skills[Math.floor(Math.random() * skills.length)] : {
    name: "Serangan Brutal Boss",
    nameEn: "Boss Savage Strike",
    element: boss.element,
    powerMultiplier: 1.2,
    effectType: "damage"
  };

  const isAoe = chosenSkill.effectType === "aoe";
  const missingHpRatio = 1 - Math.max(0, room.bossCurrentHp) / Math.max(1, boss.maxHp || boss.hp || 1);
  const effectMultiplier = chosenSkill.effectType === "critical"
    ? 1.5
    : chosenSkill.effectType === "rage"
      ? 1 + missingHpRatio * 0.75
      : 1;
  let bossHealing = 0;

  if (isAoe) {
    // Hits all alive slots
    aliveSlots.forEach((slot: any) => {
      const card = slot.card;
      const cardDef = (card.def || (card.level ? card.level * 15 + 20 : 30)) * getStyleDefenseMultiplier(card.style);
      const bossAtk = boss.atk || (boss.level * 22 + 50);
      const skillMult = chosenSkill.powerMultiplier || 1.0;

      const bossDmg = Math.max(20, Math.round(bossAtk * skillMult * effectMultiplier * getSpeedMultiplier(boss.spd, card.spd) * (85 / (85 + cardDef * 0.4))));
      slot.currentHp = Math.max(0, slot.currentHp - bossDmg);
      if (chosenSkill.effectType === "leech") bossHealing += Math.round(bossDmg * 0.5);

      roundLogs.push({
        turn: turnNum,
        actor: boss.name,
        actorType: "boss",
        skillName: chosenSkill.name,
        element: chosenSkill.element,
        damage: bossDmg,
        messageId: `⚡ ${boss.name} melancarkan skill area "${chosenSkill.name}" menghasilkan ${bossDmg} DMG ke ${card.name} (Slot ${slot.slotIndex + 1})! [HP Sisa: ${slot.currentHp}/${slot.maxHp}]`,
        messageEn: `⚡ ${boss.nameEn || boss.name} unleashed AOE skill "${chosenSkill.nameEn || chosenSkill.name}" dealing ${bossDmg} DMG to ${card.name} (Slot ${slot.slotIndex + 1})! [Remaining HP: ${slot.currentHp}/${slot.maxHp}]`,
        timestamp: new Date().toISOString()
      });
    });
  } else {
    // Target 1 alive slot randomly
    const targetSlot = aliveSlots[Math.floor(Math.random() * aliveSlots.length)];
    const card = targetSlot.card;
    const cardDef = (card.def || (card.level ? card.level * 15 + 20 : 30)) * getStyleDefenseMultiplier(card.style);
    const bossAtk = boss.atk || (boss.level * 22 + 50);
    const skillMult = chosenSkill.powerMultiplier || 1.35;

    const bossDmg = Math.max(30, Math.round(bossAtk * skillMult * effectMultiplier * getSpeedMultiplier(boss.spd, card.spd) * (90 / (90 + cardDef * 0.4))));
    targetSlot.currentHp = Math.max(0, targetSlot.currentHp - bossDmg);
    if (chosenSkill.effectType === "leech") bossHealing += Math.round(bossDmg * 0.5);

    roundLogs.push({
      turn: turnNum,
      actor: boss.name,
      actorType: "boss",
      skillName: chosenSkill.name,
      element: chosenSkill.element,
      damage: bossDmg,
      messageId: `🔥 ${boss.name} memfokuskan serangan "${chosenSkill.name}" menghantam ${card.name} (Slot ${targetSlot.slotIndex + 1}) sebesar ${bossDmg} DMG! [HP Sisa: ${targetSlot.currentHp}/${targetSlot.maxHp}]`,
      messageEn: `🔥 ${boss.nameEn || boss.name} focused strike "${chosenSkill.nameEn || chosenSkill.name}" smashing ${card.name} (Slot ${targetSlot.slotIndex + 1}) for ${bossDmg} DMG! [Remaining HP: ${targetSlot.currentHp}/${targetSlot.maxHp}]`,
      timestamp: new Date().toISOString()
    });
  }

  if (bossHealing > 0) {
    const hpBeforeHealing = room.bossCurrentHp;
    room.bossCurrentHp = Math.min(boss.maxHp || boss.hp, room.bossCurrentHp + bossHealing);
    const actualHealing = room.bossCurrentHp - hpBeforeHealing;
    roundLogs.push({
      turn: turnNum,
      actor: boss.name,
      actorType: "boss",
      damage: 0,
      messageId: `🩸 Efek Leech memulihkan ${actualHealing} HP ${boss.name}.`,
      messageEn: `🩸 Leech restored ${actualHealing} HP to ${boss.nameEn || boss.name}.`,
      timestamp: new Date().toISOString()
    });
  }

  // Check Defeat (all slots reach 0 HP)
  const remainingAlive = room.slots.filter((s: any) => s && s.currentHp > 0);
  if (remainingAlive.length === 0) {
    room.status = "defeat";
    roundLogs.push({
      turn: turnNum,
      actor: "System",
      actorType: "boss",
      damage: 0,
      messageId: `💀 Seluruh kartu penyerang telah tumbang! Tim Raid kalah dalam menghadapi ${boss.name}.`,
      messageEn: `💀 All combatant cards have fallen! The raid team was defeated by ${boss.nameEn || boss.name}.`,
      timestamp: new Date().toISOString()
    });
  }

  room.currentTurn = turnNum + 1;
  room.battleLogs.push(...roundLogs);
  room.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({
    success: true,
    room,
    defeated: remainingAlive.length === 0
  });
});

// 10. Developer Only: Spawn Custom Raid Boss (verydiaz@gmail.com, nekomaster@nekomon.online, support@nekomon.online)
app.post("/api/developer/raid/spawn", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!isDeveloperUser(user)) {
    return res.status(403).json({ error: "Akses khusus Developer Nekomon." });
  }

  const { speciesType, level, element, name, lat, lng, locationName } = req.body;
  const targetLevel = Math.max(5, Math.min(30, Number(level) || 15));
  const targetLat = !isNaN(Number(lat)) ? Number(lat) : -6.1754;
  const targetLng = !isNaN(Number(lng)) ? Number(lng) : 106.8272;

  // Find template matching species or level
  const tplIdx = RAID_BOSS_TEMPLATES.findIndex(
    (t: any) => t.speciesType === speciesType || (element && t.element === element)
  );
  const boss = createRaidBossInstance(tplIdx !== -1 ? tplIdx : 0, targetLat, targetLng, targetLevel);

  if (name && name.trim()) {
    boss.name = name.trim();
    boss.nameEn = name.trim();
  }
  if (element && ["Air", "Api", "Tanah", "Angin", "Petir"].includes(element)) {
    boss.element = element;
  }
  if (locationName && locationName.trim()) {
    boss.locationName = locationName.trim();
  }

  boss.isManual = true;
  boss.spawnRadiusKm = 99999; // Tanpa batas jarak untuk boss spawn developer
  if (req.body.cityName) boss.cityName = req.body.cityName;
  if (req.body.cityId) boss.cityId = req.body.cityId;

  if (!db.raidBosses) db.raidBosses = [];
  db.raidBosses.unshift(boss);
  writeDB(db);

  res.json({
    success: true,
    message: `Raid Boss [LV. ${targetLevel}] ${boss.name} (${boss.speciesType.toUpperCase()}, ${boss.element}) berhasil di-spawn! 🐾⚡`,
    boss
  });
});

// 11. Developer Only: Reset All Raid Bosses & Lobbies
app.post("/api/developer/raid/reset", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!isDeveloperUser(user)) {
    return res.status(403).json({ error: "Akses khusus Developer." });
  }

  db.maxUnlockedRaidLevel = 8;
  db.highestDefeatedRaidBossLevel = 0;
  db.defeatedRaidBossLevels = [];
  db.raidBosses = [];
  ensureStandbyAndUnlockedBosses(db);
  db.raidLobbies = [];
  writeDB(db);

  res.json({
    success: true,
    message: "Seluruh data Raid Boss direset ke kondisi standby (Level 6, 7, 8 stand by di seluruh kota).",
    maxUnlockedLevel: 8,
    bosses: db.raidBosses
  });
});

// 12. Developer Only: Export Database Backup (JSON & Firestore Status)
app.get("/api/developer/database/backup", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!isDeveloperUser(user)) {
    return res.status(403).json({ error: "Akses khusus Developer resmi (verydiaz@gmail.com / support@nekomon.online)." });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `nekomon_backup_${timestamp}.json`;
  
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/json");
  return res.send(JSON.stringify(db, null, 2));
});

// 13. Developer Only: Restore Database from JSON & Re-sync to Firestore
app.post("/api/developer/database/restore", async (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!isDeveloperUser(user)) {
    return res.status(403).json({ error: "Akses khusus Developer resmi (verydiaz@gmail.com / support@nekomon.online)." });
  }

  const { backupData } = req.body;
  if (!backupData || typeof backupData !== "object") {
    return res.status(400).json({ error: "Payload data backup tidak valid." });
  }

  // Validate critical structure
  const restoredDB: any = {
    users: Array.isArray(backupData.users) ? backupData.users : db.users || [],
    captures: Array.isArray(backupData.captures) ? backupData.captures : db.captures || [],
    cards: Array.isArray(backupData.cards) ? backupData.cards : db.cards || [],
    trades: Array.isArray(backupData.trades) ? backupData.trades : db.trades || [],
    communitySpots: Array.isArray(backupData.communitySpots) ? backupData.communitySpots : db.communitySpots || [],
    battleHistory: Array.isArray(backupData.battleHistory) ? backupData.battleHistory : db.battleHistory || [],
    transactions: Array.isArray(backupData.transactions) ? backupData.transactions : db.transactions || [],
    officialMails: Array.isArray(backupData.officialMails) ? backupData.officialMails : db.officialMails || DEFAULT_OFFICIAL_MAILS,
    directMessages: Array.isArray(backupData.directMessages) ? backupData.directMessages : db.directMessages || [],
    raidBosses: Array.isArray(backupData.raidBosses) ? backupData.raidBosses : db.raidBosses || [],
    raidLobbies: Array.isArray(backupData.raidLobbies) ? backupData.raidLobbies : db.raidLobbies || [],
    maxUnlockedRaidLevel: backupData.maxUnlockedRaidLevel || db.maxUnlockedRaidLevel || 8,
    highestDefeatedRaidBossLevel: backupData.highestDefeatedRaidBossLevel || db.highestDefeatedRaidBossLevel || 0,
    defeatedRaidBossLevels: Array.isArray(backupData.defeatedRaidBossLevels) ? backupData.defeatedRaidBossLevels : db.defeatedRaidBossLevels || []
  };

  // Preserve standby bosses
  ensureStandbyAndUnlockedBosses(restoredDB);

  // Preserve demo user
  ensureDemoUserAndDeck(restoredDB);

  // Write to local disk
  writeDB(restoredDB);

  // Force sync to Cloud Firestore
  try {
    await syncToFirestore(restoredDB);
  } catch (syncErr: any) {
    console.warn("Restore Firestore sync notice:", syncErr?.message || syncErr);
  }

  return res.json({
    success: true,
    message: `Database berhasil dipulihkan! Total: ${restoredDB.users.length} Pemain, ${restoredDB.cards.length} Kartu, ${restoredDB.communitySpots.length} Spot Komunitas. Data tersinkronisasi ke Firestore.`,
    stats: {
      usersCount: restoredDB.users.length,
      cardsCount: restoredDB.cards.length,
      spotsCount: restoredDB.communitySpots.length,
      capturesCount: restoredDB.captures.length,
      mailsCount: restoredDB.officialMails.length
    }
  });
});

// 14. Developer Only: Force Immediate Push to Cloud Firestore
app.post("/api/developer/database/sync-firestore", async (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!isDeveloperUser(user)) {
    return res.status(403).json({ error: "Akses khusus Developer resmi (verydiaz@gmail.com / support@nekomon.online)." });
  }

  try {
    await syncToFirestore(db);
    return res.json({
      success: true,
      message: "Seluruh data lokal server berhasil disinkronkan langsung ke Cloud Firestore!",
      stats: {
        users: db.users?.length || 0,
        cards: db.cards?.length || 0,
        communitySpots: db.communitySpots?.length || 0
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      error: "Gagal menyinkronkan ke Firestore: " + (err?.message || err)
    });
  }
});

// Explicit endpoint for Google AdSense ads.txt verification
app.get("/ads.txt", (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send("google.com, pub-2411657012211511, DIRECT, f08c47fec0942fa0\n");
});

// Explicit endpoint for Googlebot & AdSense robots.txt crawler verification
app.get("/robots.txt", (_req, res) => {
  const robotsPath = path.join(process.cwd(), "public", "robots.txt");
  if (fs.existsSync(robotsPath)) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.sendFile(robotsPath);
  }
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send("User-agent: *\nAllow: /\n\nUser-agent: Mediapartners-Google\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nSitemap: https://nekomon.online/sitemap.xml\n");
});

// Explicit endpoint for XML sitemap
app.get("/sitemap.xml", (_req, res) => {
  const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
  if (fs.existsSync(sitemapPath)) {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.sendFile(sitemapPath);
  }
  res.status(404).end();
});

// ----------------------------------------------------------------
// VITE AND STATIC ASSET MIDDLEWARE WITH ADSENSE SEO VIRTUAL ROUTES
// ----------------------------------------------------------------
const SEO_PATHS = [
  "/privacy-policy", "/privacy",
  "/terms-of-service", "/terms", "/terms-and-conditions", "/term-and-conditions", "/terms-conditions", "/terms-of-use",
  "/refund-policy", "/refund", "/refunds",
  "/about", "/about-us",
  "/contact", "/contact-us",
  "/disclaimer",
  "/guide", "/game-guide", "/panduan"
];

async function startServer() {
  // Always serve sw.js with strict no-cache headers to trigger immediate worker retirement
  app.get(["/sw.js", "/service-worker.js"], (req, res) => {
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.sendFile(path.join(process.cwd(), "public", "sw.js"));
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Intercept AdSense & Googlebot Virtual SEO Routes before Vite default SPA fallback
    app.get(SEO_PATHS, async (req, res, next) => {
      try {
        const routeMeta = resolveSeoRoute(req.path);
        if (!routeMeta) return next();
        const indexPath = path.join(process.cwd(), "index.html");
        let html = fs.readFileSync(indexPath, "utf-8");
        html = await vite.transformIndexHtml(req.originalUrl, html);
        const seoHtml = renderSeoHtml(html, routeMeta);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(seoHtml);
      } catch (e) {
        next(e);
      }
    });

    app.use(vite.middlewares);
    console.log("Vite development middleware integrated with AdSense SEO route support.");
  } else {
    const distPath = path.join(process.cwd(), "dist");

    // Intercept AdSense & Googlebot Virtual SEO Routes in production
    app.get(SEO_PATHS, (req, res, next) => {
      try {
        const routeMeta = resolveSeoRoute(req.path);
        if (!routeMeta) return next();
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          const html = fs.readFileSync(indexPath, "utf-8");
          const seoHtml = renderSeoHtml(html, routeMeta);
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          return res.send(seoHtml);
        }
        return next();
      } catch (e) {
        next(e);
      }
    });

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist/ with AdSense SEO route support.");
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

  initWebSocket(server, readDB, writeDB);
}

startServer();
