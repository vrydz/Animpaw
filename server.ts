import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initWebSocket } from "./server/websocket";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "server", "db.json");

// Middleware to parse large JSON payloads (for base64 cat photos)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize DB structure if somehow empty
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = { users: [], captures: [], cards: [], trades: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(data);
    if (!parsed.trades) {
      parsed.trades = [];
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

    let modified = false;
    if (!parsed.users) {
      parsed.users = [];
    }
    for (const bot of bots) {
      if (!parsed.users.some((u: any) => u.id === bot.id)) {
        parsed.users.push(bot);
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2));
    }

    return parsed;
  } catch (err) {
    console.error("Error reading database:", err);
    return { users: [], captures: [], cards: [], trades: [] };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
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
  Scourge: {
    Api: ["Inferno Claw", "Blaze Shadow", "Scorched Fang", "Crimson Dread", "Hellfire Overlord"],
    Air: ["Abyssal Maw", "Vortex Whisper", "Riptide Shadow", "Frozen Abyss", "Tsunami Emperor"],
    Tanah: ["Ruin Claw", "Obelisk Mew", "Iron Root", "Titan Sentinel", "Worldbreaker Cat"],
    Angin: ["Tornado Phantom", "Void Gale", "Sonic Whiskers", "Asylum Breeze", "Cosmic Tempest"],
    Petir: ["Volt Razor", "Plasma Spark", "Thunder Fiend", "Tesla Empress", "Overdrive Overlord"],
  }
};

const STATS_RANGES: Record<string, { hp: [number, number]; atk: [number, number]; def: [number, number]; spd: [number, number] }> = {
  Common: { hp: [100, 250], atk: [50, 100], def: [50, 100], spd: [40, 80] },
  Rare: { hp: [250, 450], atk: [100, 180], def: [100, 180], spd: [80, 140] },
  Epic: { hp: [450, 650], atk: [180, 280], def: [180, 280], spd: [140, 220] },
  Legend: { hp: [650, 850], atk: [280, 400], def: [280, 400], spd: [220, 320] },
  Mythic: { hp: [850, 1200], atk: [400, 600], def: [400, 600], spd: [320, 500] },
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
    
    ${photoUrl ? `
    <!-- Original User Cat Photo framed with elemental vignette -->
    <g>
      <clipPath id="photo-clip">
        <rect x="35" y="90" width="330" height="225" rx="15" />
      </clipPath>
      <image href="${photoUrl}" x="35" y="90" width="330" height="225" clip-path="url(#photo-clip)" preserveAspectRatio="xMidYMid slice" />
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
      ${style === 'Sentinel' ? 'SENTINEL' : 'SCOURGE'}
    </text>

    <!-- Sparkles for Rarity -->
    <path d="M40,100 L45,115 L60,120 L45,125 L40,140 L35,125 L20,120 L35,115 Z" fill="${rarityColor}" opacity="0.8" />
    <path d="M340,110 L343,120 L353,123 L343,126 L340,136 L337,126 L327,123 L337,120 Z" fill="${rarityColor}" opacity="0.8" />
  </svg>`;

  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
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
    password: cleanPassword, // For simplicity kept plain
    points: 100, // starting credit
    cores: 0,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({
    success: true,
    user: { id: newUser.id, username: newUser.username, email: newUser.email, points: newUser.points, cores: 0 },
    token: Buffer.from(`${newUser.id}:${newUser.username}`).toString("base64")
  });
});

// Auth: Send Email Verification Link
app.post("/api/auth/send-verification", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }

  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({ error: "Email dan password tidak boleh kosong." });
  }

  const db = readDB();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === cleanEmail.toLowerCase());
  
  if (existingUser) {
    return res.status(400).json({ error: "Alamat email ini sudah terdaftar." });
  }

  if (!db.pendingVerifications) {
    db.pendingVerifications = [];
  }

  // Remove existing pending verifications for this email
  db.pendingVerifications = db.pendingVerifications.filter((v: any) => v.email.toLowerCase() !== cleanEmail.toLowerCase());

  const token = "vt_" + Math.random().toString(36).substr(2, 9);
  const newVerification = {
    token,
    email: cleanEmail,
    password: cleanPassword,
    verified: false,
    createdAt: new Date().toISOString()
  };

  db.pendingVerifications.push(newVerification);
  writeDB(db);

  res.json({
    success: true,
    message: `Link verifikasi email telah dikirim ke ${cleanEmail}!`,
    token
  });
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
    <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0b1329; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div style="max-width: 500px; margin: 0 auto; background: #0f172a; border: 2px solid #eab308; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="font-size: 50px; margin-bottom: 20px;">✅</div>
        <h2 style="color: #eab308; margin-bottom: 10px;">Email Berhasil Diverifikasi!</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Email Anda telah diverifikasi dengan sukses. Silakan kembali ke aplikasi Nekomon Anda untuk melanjutkan pembuatan username dan menyelesaikan pendaftaran akun.</p>
        <div style="margin-top: 30px; font-size: 12px; color: #64748b;">Nekomon Arena &bull; Real Cat-Based Card Game</div>
      </div>
    </div>
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
  const { token, username } = req.body;
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

  if (!verification.verified) {
    return res.status(400).json({ error: "Email Anda belum diverifikasi. Silakan klik link verifikasi terlebih dahulu." });
  }

  const newUser = {
    id: "user_" + Math.random().toString(36).substr(2, 9),
    email: verification.email,
    username: cleanUsername,
    password: verification.password,
    points: 100,
    cores: 0,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  
  // Remove verification entry
  db.pendingVerifications = db.pendingVerifications.filter((v: any) => v.token !== token);
  writeDB(db);

  res.json({
    success: true,
    user: { id: newUser.id, username: newUser.username, email: newUser.email, points: newUser.points, cores: 0 },
    token: Buffer.from(`${newUser.id}:${newUser.username}`).toString("base64")
  });
});

// Auth: Request Forgot Password Link
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email wajib diisi." });
  }

  const cleanEmail = email.trim();
  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === cleanEmail.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: "Alamat email tidak terdaftar di sistem kami." });
  }

  if (!db.passwordResets) {
    db.passwordResets = [];
  }

  db.passwordResets = db.passwordResets.filter((r: any) => r.email.toLowerCase() !== cleanEmail.toLowerCase());

  const token = "rt_" + Math.random().toString(36).substr(2, 9);
  db.passwordResets.push({
    token,
    email: cleanEmail,
    createdAt: new Date().toISOString()
  });
  writeDB(db);

  res.json({
    success: true,
    message: `Link reset sandi telah dikirim ke ${cleanEmail}!`,
    token
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
  const resetEntry = db.passwordResets.find((r: any) => r.token === token);

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

  const resetEntry = db.passwordResets.find((r: any) => r.token === token);
  if (!resetEntry) {
    const isFromForm = req.headers["content-type"]?.includes("application/x-www-form-urlencoded");
    if (isFromForm) {
      return res.status(400).send(`<div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0b1329; color: #ef4444;"><h3>Sesi reset sandi tidak valid atau kadaluarsa.</h3></div>`);
    }
    return res.status(400).json({ error: "Sesi reset sandi tidak valid atau kadaluarsa." });
  }

  const user = db.users.find((u: any) => u.email.toLowerCase() === resetEntry.email.toLowerCase());
  if (user) {
    user.password = cleanPassword;
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
    (u.password === cleanPassword || u.password === password)
  );

  if (!user) {
    return res.status(401).json({ error: "Username, Email, atau password salah." });
  }

  res.json({
    success: true,
    user: { id: user.id, username: user.username, email: user.email, points: user.points, cores: user.cores || 0 },
    token: Buffer.from(`${user.id}:${user.username}`).toString("base64")
  });
});

// Auth: Sync / Restore user data from client backup (robust persistence helper)
app.post("/api/auth/sync", (req, res) => {
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
    user: { id: serverUser.id, username: serverUser.username, email: serverUser.email, points: serverUser.points, cores: serverUser.cores || 0 }
  });
});

// Helper to authenticate user using authorization token
function getAuthUser(req: express.Request, db: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [id, username] = decoded.split(":");
    return db.users.find((u: any) => u.id === id && u.username.toLowerCase() === username.toLowerCase()) || null;
  } catch (e) {
    return null;
  }
}

// Helper to calculate daily mission progress and reset states
function getMissionStatus(userId: string, user: any, db: any) {
  const userCaptures = db.captures.filter((c: any) => c.userId === userId);
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const capturesInLast24h = userCaptures.filter((c: any) => {
    return new Date(c.createdAt).getTime() >= oneDayAgo;
  });
  
  const lastBonusTime = user.lastDailyBonusAt ? new Date(user.lastDailyBonusAt).getTime() : 0;
  const completed = (now - lastBonusTime) < 24 * 60 * 60 * 1000;
  
  return {
    progress: Math.min(capturesInLast24h.length, 5),
    target: 5,
    completed: !!completed,
    capturesInLast24Hours: capturesInLast24h.length,
    bonusPoints: 25,
    nextResetMs: completed ? Math.max(0, 24 * 60 * 60 * 1000 - (now - lastBonusTime)) : 0
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
      lastDailyBonusAt: user.lastDailyBonusAt 
    },
    mission
  });
});

// Fetch Gallery & Cards
app.get("/api/user/gallery", (req, res) => {
  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userCaptures = db.captures.filter((c: any) => c.userId === user.id);
  const userCards = db.cards.filter((c: any) => c.userId === user.id);
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

// Capture photo and get 10 points
app.post("/api/capture", async (req, res) => {
  const { photo } = req.body; // base64 photo
  if (!photo) {
    return res.status(400).json({ error: "Data foto kucing wajib dikirim." });
  }

  const db = readDB();
  const user = getAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Analisis foto menggunakan Gemini
  const analysis = await analyzeCatPhoto(photo);
  if (!analysis.isCat) {
    return res.status(400).json({ error: analysis.reason });
  }

  // Add 10 points for regular capture
  user.points += 10;

  const newCapture = {
    id: "cap_" + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    photoUrl: photo,
    isForged: false,
    createdAt: new Date().toISOString()
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
    mission
  });
});

// Forge to Nekomon Card
app.post("/api/forge", async (req, res) => {
  const { captureId, element, style } = req.body;
  if (!captureId || !element || !style) {
    return res.status(400).json({ error: "captureId, element, dan style wajib diisi." });
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
  const elementSkills = ABILITIES[element] || ABILITIES.Api;
  const chosenSkill = elementSkills[Math.floor(Math.random() * elementSkills.length)];
  skill = { ...chosenSkill };

  // 3. Choose basic card name
  const namesList = FALLBACKS[style]?.[element] || FALLBACKS.Sentinel.Api;
  cardName = namesList[Math.floor(Math.random() * namesList.length)] + " " + rarity;

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
- Deskripsi Rarity yang harus dipenuhi: ${
        rarity === "Common" ? "Kucing domestik biasa dalam situasi sehari-hari yang menggemaskan, kekuatan sederhana." :
        rarity === "Rare" ? "Kucing dengan sedikit kostum ringan atau tema ras spesifik dengan percikan fantasi." :
        rarity === "Epic" ? "Kucing menyatu dengan elemen alam (${element}) atau sihir dengan aura mengagumkan." :
        rarity === "Legend" ? "Kucing dewa mitologi atau penjaga dimensi misterius, desain sangat detail, dramatis, mistis." :
        "Tingkat tertinggi: Dewa penguasa alam semesta (God-tier), megah, abstrak, mengintimidasi namun tetap kucing."
      }

Berikan output berupa objek JSON dengan spesifikasi tepat berikut:
{
  "name": "Nama fantasi kucing yang sangat keren berciri khas elemen ${element} dan gaya ${style} (maksimal 2-3 kata, contoh: Volcanic Mane)",
  "skillName": "Nama skill bertema elemen ${element}",
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
    boss: 8
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
  let oldLevel = card.level;
  let newLevel = oldLevel;
  let currentXp = card.xp + xpGained;
  let maxXp = card.level * 100;
  let leveledUp = false;

  const statUpgrades = { hp: 0, atk: 0, def: 0, spd: 0 };

  while (currentXp >= maxXp) {
    currentXp -= maxXp;
    newLevel += 1;
    maxXp = newLevel * 100;
    leveledUp = true;

    // Stat gains
    const hpGain = Math.floor(Math.random() * 16) + 10; // +10 to +25
    const atkGain = Math.floor(Math.random() * 6) + 5;   // +5 to +10
    const defGain = Math.floor(Math.random() * 6) + 5;   // +5 to +10
    const spdGain = Math.floor(Math.random() * 5) + 3;   // +3 to +7

    card.hp += hpGain;
    card.atk += atkGain;
    card.def += defGain;
    card.spd = (card.spd || 45) + spdGain;

    statUpgrades.hp += hpGain;
    statUpgrades.atk += atkGain;
    statUpgrades.def += defGain;
    statUpgrades.spd += spdGain;
  }

  card.level = newLevel;
  card.xp = currentXp;
  card.maxXp = maxXp;

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
  const newHp = Math.max(Math.floor(card.hp * 1.35), range.hp[0] + Math.floor(Math.random() * 50));
  const newAtk = Math.max(Math.floor(card.atk * 1.35), range.atk[0] + Math.floor(Math.random() * 30));
  const newDef = Math.max(Math.floor(card.def * 1.35), range.def[0] + Math.floor(Math.random() * 30));
  const newSpd = Math.max(Math.floor((card.spd || 45) * 1.30), range.spd[0] + Math.floor(Math.random() * 20));

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

      return {
        id: user.id,
        username: user.username,
        points: user.points || 0,
        cores: user.cores || 0,
        totalCards: userCards.length,
        highestLevel: userCards.length > 0 ? highestLevel : 0,
        bestCard,
        isBot: !!user.isBot
      };
    });

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error("Error retrieving leaderboard:", err);
    res.status(500).json({ error: "Gagal memuat leaderboard" });
  }
});

// ----------------------------------------------------------------
// VITE AND STATIC ASSET MIDDLEWARE
// ----------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist/.");
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

  initWebSocket(server, readDB, writeDB);
}

startServer();
