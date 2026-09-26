import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// Interface for MySQL DB Status
export interface MySQLStatusInfo {
  configured: boolean;
  enabled: boolean;
  driver: string;
  host: string;
  port: number;
  database: string;
  user: string;
  connected: boolean;
  initialized: boolean;
  lastConnectedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  isHostingerRemoteBlocked: boolean;
  instructionId: string | null;
  instructionEn: string | null;
  tableCounts: Record<string, number>;
}

interface MySQLConfig {
  driver: string;
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  connectionLimit: number;
  connectTimeout: number;
  ssl: boolean;
  sslCaPath?: string;
}

function getMySQLConfig(): MySQLConfig {
  return {
    driver: process.env.DATABASE_DRIVER || "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "u696515981_support",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "u696515981_nekomondb",
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10),
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || "10000", 10),
    ssl: process.env.DB_SSL === "true",
    sslCaPath: process.env.DB_SSL_CA_PATH || ""
  };
}

let pool: mysql.Pool | null = null;
let isConnected = false;
let isInitialized = false;
let lastConnectedTime: string | null = null;
let lastSyncTime: string | null = null;
let lastErrorMessage: string | null = null;
let isRemoteHostBlocked = false;
let tableCountsCache: Record<string, number> = {};

export function isMySQLEnabled(): boolean {
  const driver = (process.env.DATABASE_DRIVER || "").toLowerCase();
  const hasHost = Boolean(process.env.DB_HOST);
  const hasUser = Boolean(process.env.DB_USER);
  return driver === "mysql" || hasHost || hasUser;
}

export function getMySQLPool(): mysql.Pool | null {
  if (pool) return pool;
  if (!isMySQLEnabled()) return null;

  try {
    const config = getMySQLConfig();
    const poolConfig: mysql.PoolOptions = {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.connectionLimit,
      connectTimeout: config.connectTimeout,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      charset: "utf8mb4"
    };

    if (config.ssl) {
      if (config.sslCaPath && fs.existsSync(config.sslCaPath)) {
        poolConfig.ssl = { ca: fs.readFileSync(config.sslCaPath, "utf8") };
      } else {
        poolConfig.ssl = { rejectUnauthorized: false };
      }
    }

    pool = mysql.createPool(poolConfig);
    return pool;
  } catch (err: any) {
    lastErrorMessage = err?.message || String(err);
    console.error("[MySQL] Failed to initialize pool:", err);
    return null;
  }
}

export async function testMySQLConnection(): Promise<{ success: boolean; message: string; latencyMs?: number; error?: string }> {
  const poolInstance = getMySQLPool();
  if (!poolInstance) {
    return {
      success: false,
      message: "MySQL is not enabled or configuration is incomplete."
    };
  }

  const startTime = Date.now();
  try {
    const connection = await poolInstance.getConnection();
    const latency = Date.now() - startTime;
    await connection.query("SELECT 1 AS ping");
    connection.release();

    isConnected = true;
    isRemoteHostBlocked = false;
    lastConnectedTime = new Date().toISOString();
    lastErrorMessage = null;

    return {
      success: true,
      message: `MySQL connected successfully (${latency}ms)! Database: ${getMySQLConfig().database}`,
      latencyMs: latency
    };
  } catch (err: any) {
    isConnected = false;
    const msg = err?.message || String(err);
    lastErrorMessage = msg;

    if (msg.includes("Access denied for user") || err.code === "ER_ACCESS_DENIED_ERROR") {
      isRemoteHostBlocked = true;
    }

    return {
      success: false,
      message: "Connection test failed: " + msg,
      error: msg
    };
  }
}

// -------------------------------------------------------------
// Table Schemas Initialization
// -------------------------------------------------------------
export async function initMySQLTables(): Promise<boolean> {
  const poolInstance = getMySQLPool();
  if (!poolInstance) return false;

  try {
    const testResult = await testMySQLConnection();
    if (!testResult.success) {
      if (isRemoteHostBlocked) {
        console.warn("[MySQL] Hostinger remote connection note: MySQL user access requires whitelisting your IP or '%' in Hostinger hPanel -> Databases -> Remote MySQL, or deploying directly to Hostinger server where localhost connects directly.");
      } else {
        console.warn("[MySQL] Could not connect to MySQL at startup:", testResult.message);
      }
      return false;
    }

    const schemas = [
      `CREATE TABLE IF NOT EXISTS nekomon_users (
        id VARCHAR(128) PRIMARY KEY,
        username VARCHAR(100),
        email VARCHAR(255),
        password VARCHAR(255),
        points INT DEFAULT 0,
        cores INT DEFAULT 0,
        faction VARCHAR(50),
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_username (username),
        INDEX idx_user_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_cards (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128),
        capture_id VARCHAR(128),
        name VARCHAR(255),
        element VARCHAR(50),
        rarity VARCHAR(50),
        level INT DEFAULT 1,
        xp INT DEFAULT 0,
        energy INT DEFAULT 100,
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_card_user (user_id),
        INDEX idx_card_element (element),
        INDEX idx_card_rarity (rarity)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_captures (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128),
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_capture_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_trades (
        id VARCHAR(128) PRIMARY KEY,
        sender_id VARCHAR(128),
        target_id VARCHAR(128),
        status VARCHAR(50),
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_trade_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_community_spots (
        id VARCHAR(128) PRIMARY KEY,
        name VARCHAR(255),
        element VARCHAR(50),
        created_by VARCHAR(128),
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_battle_history (
        id VARCHAR(128) PRIMARY KEY,
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_transactions (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128),
        type VARCHAR(50),
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_transaction_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_official_mails (
        id VARCHAR(128) PRIMARY KEY,
        category VARCHAR(50),
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_direct_messages (
        id VARCHAR(128) PRIMARY KEY,
        sender_id VARCHAR(128),
        receiver_id VARCHAR(128),
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dm_parties (sender_id, receiver_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_raid_bosses (
        id VARCHAR(128) PRIMARY KEY,
        element VARCHAR(50),
        level INT DEFAULT 1,
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_raid_lobbies (
        id VARCHAR(128) PRIMARY KEY,
        room_code VARCHAR(50),
        status VARCHAR(50),
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_territory_nodes (
        id VARCHAR(128) PRIMARY KEY,
        owner_faction VARCHAR(50),
        data JSON,
        created_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS nekomon_system_meta (
        meta_key VARCHAR(128) PRIMARY KEY,
        meta_value JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
    ];

    for (const sql of schemas) {
      await poolInstance.query(sql);
    }

    isInitialized = true;
    console.log("[MySQL] All tables verified/created successfully in Hostinger MySQL.");
    await refreshTableCounts();
    return true;
  } catch (err: any) {
    console.error("[MySQL] Error initializing tables:", err);
    lastErrorMessage = err?.message || String(err);
    return false;
  }
}

export async function refreshTableCounts(): Promise<Record<string, number>> {
  const poolInstance = getMySQLPool();
  if (!poolInstance || !isConnected) return tableCountsCache;

  const tables = [
    "nekomon_users",
    "nekomon_cards",
    "nekomon_captures",
    "nekomon_trades",
    "nekomon_community_spots",
    "nekomon_battle_history",
    "nekomon_transactions",
    "nekomon_official_mails",
    "nekomon_direct_messages",
    "nekomon_raid_bosses",
    "nekomon_raid_lobbies",
    "nekomon_territory_nodes"
  ];

  const counts: Record<string, number> = {};
  for (const table of tables) {
    try {
      const [rows]: any = await poolInstance.query(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = rows?.[0]?.count || 0;
    } catch {
      counts[table] = 0;
    }
  }

  tableCountsCache = counts;
  return counts;
}

// -------------------------------------------------------------
// Load Full Database from MySQL
// -------------------------------------------------------------
export async function loadFromMySQL(): Promise<any | null> {
  const poolInstance = getMySQLPool();
  if (!poolInstance || !isConnected) return null;

  try {
    const parseRows = (rows: any[]): any[] => {
      if (!Array.isArray(rows)) return [];
      return rows.map((r) => {
        let itemData: any = {};
        if (typeof r.data === "string") {
          try {
            itemData = JSON.parse(r.data);
          } catch {
            itemData = {};
          }
        } else if (r.data && typeof r.data === "object") {
          itemData = r.data;
        }

        return {
          ...itemData,
          id: r.id || itemData.id,
          ...(r.username ? { username: r.username } : {}),
          ...(r.email ? { email: r.email } : {}),
          ...(r.password ? { password: r.password } : {}),
          ...(typeof r.points === "number" ? { points: r.points } : {}),
          ...(typeof r.cores === "number" ? { cores: r.cores } : {}),
          ...(r.user_id ? { userId: r.user_id } : {})
        };
      });
    };

    const [usersRows]: any = await poolInstance.query("SELECT * FROM nekomon_users");
    const [cardsRows]: any = await poolInstance.query("SELECT * FROM nekomon_cards");
    const [capturesRows]: any = await poolInstance.query("SELECT * FROM nekomon_captures");
    const [tradesRows]: any = await poolInstance.query("SELECT * FROM nekomon_trades");
    const [spotsRows]: any = await poolInstance.query("SELECT * FROM nekomon_community_spots");
    const [battleRows]: any = await poolInstance.query("SELECT * FROM nekomon_battle_history");
    const [txRows]: any = await poolInstance.query("SELECT * FROM nekomon_transactions");
    const [mailsRows]: any = await poolInstance.query("SELECT * FROM nekomon_official_mails");
    const [dmRows]: any = await poolInstance.query("SELECT * FROM nekomon_direct_messages");
    const [bossRows]: any = await poolInstance.query("SELECT * FROM nekomon_raid_bosses");
    const [lobbyRows]: any = await poolInstance.query("SELECT * FROM nekomon_raid_lobbies");
    const [territoryRows]: any = await poolInstance.query("SELECT * FROM nekomon_territory_nodes");
    const [metaRows]: any = await poolInstance.query("SELECT * FROM nekomon_system_meta");

    const users = parseRows(usersRows);
    const cards = parseRows(cardsRows);
    const captures = parseRows(capturesRows);
    const trades = parseRows(tradesRows);
    const communitySpots = parseRows(spotsRows);
    const battleHistory = parseRows(battleRows);
    const transactions = parseRows(txRows);
    const officialMails = parseRows(mailsRows);
    const directMessages = parseRows(dmRows);
    const raidBosses = parseRows(bossRows);
    const raidLobbies = parseRows(lobbyRows);
    const territoryNodes = parseRows(territoryRows);

    let maxUnlockedRaidLevel = 10;
    let highestDefeatedRaidBossLevel = 8;
    let defeatedRaidBossLevels: number[] = [];
    let passwordResets: any[] = [];

    if (Array.isArray(metaRows)) {
      for (const m of metaRows) {
        const val = typeof m.meta_value === "string" ? JSON.parse(m.meta_value) : m.meta_value;
        if (m.meta_key === "maxUnlockedRaidLevel") maxUnlockedRaidLevel = Number(val) || 10;
        if (m.meta_key === "highestDefeatedRaidBossLevel") highestDefeatedRaidBossLevel = Number(val) || 0;
        if (m.meta_key === "defeatedRaidBossLevels") defeatedRaidBossLevels = Array.isArray(val) ? val : [];
        if (m.meta_key === "passwordResets") passwordResets = Array.isArray(val) ? val : [];
      }
    }

    // If completely empty in MySQL, return null so caller can seed from db.json
    if (users.length === 0 && cards.length === 0 && communitySpots.length === 0 && officialMails.length === 0) {
      return null;
    }

    console.log(`[MySQL] Successfully loaded game state from MySQL: ${users.length} users, ${cards.length} cards, ${territoryNodes.length} territory nodes.`);

    return {
      users,
      cards,
      captures,
      trades,
      communitySpots,
      battleHistory,
      transactions,
      officialMails,
      directMessages,
      raidBosses,
      raidLobbies,
      territoryNodes,
      maxUnlockedRaidLevel,
      highestDefeatedRaidBossLevel,
      defeatedRaidBossLevels,
      passwordResets
    };
  } catch (err: any) {
    console.error("[MySQL] Failed to load data from MySQL:", err);
    lastErrorMessage = err?.message || String(err);
    return null;
  }
}

// -------------------------------------------------------------
// Synchronize Full Database to MySQL
// -------------------------------------------------------------
let syncInProgress = false;
let pendingSyncData: any = null;

export async function syncToMySQL(data: any): Promise<void> {
  const poolInstance = getMySQLPool();
  if (!poolInstance || !isConnected || !isInitialized) {
    return;
  }

  if (syncInProgress) {
    pendingSyncData = data;
    return;
  }

  syncInProgress = true;
  try {
    // 1. Sync Users
    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        if (!u || !u.id) continue;
        const createdAt = u.createdAt ? new Date(u.createdAt) : new Date();
        const jsonStr = JSON.stringify(u);
        await poolInstance.query(
          `INSERT INTO nekomon_users (id, username, email, password, points, cores, faction, data, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             username = VALUES(username),
             email = VALUES(email),
             password = VALUES(password),
             points = VALUES(points),
             cores = VALUES(cores),
             faction = VALUES(faction),
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [u.id, u.username || "", u.email || "", u.password || "", u.points || 0, u.cores || 0, u.faction || "", jsonStr, createdAt]
        );
      }
    }

    // 2. Sync Cards (CRITICAL: Every captured and forged card!)
    if (Array.isArray(data.cards)) {
      for (const c of data.cards) {
        if (!c || !c.id) continue;
        const createdAt = c.createdAt ? new Date(c.createdAt) : new Date();
        const jsonStr = JSON.stringify(c);
        await poolInstance.query(
          `INSERT INTO nekomon_cards (id, user_id, capture_id, name, element, rarity, level, xp, energy, data, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             user_id = VALUES(user_id),
             capture_id = VALUES(capture_id),
             name = VALUES(name),
             element = VALUES(element),
             rarity = VALUES(rarity),
             level = VALUES(level),
             xp = VALUES(xp),
             energy = VALUES(energy),
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [
            c.id,
            c.userId || "",
            c.captureId || "",
            c.name || "Nekomon",
            c.element || "Api",
            c.rarity || "Common",
            c.level || 1,
            c.xp || 0,
            c.energy !== undefined ? c.energy : 100,
            jsonStr,
            createdAt
          ]
        );
      }
    }

    // 3. Sync Captures
    if (Array.isArray(data.captures)) {
      for (const cap of data.captures) {
        if (!cap || !cap.id) continue;
        const createdAt = cap.capturedAt ? new Date(cap.capturedAt) : new Date();
        await poolInstance.query(
          `INSERT INTO nekomon_captures (id, user_id, data, created_at)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             user_id = VALUES(user_id),
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [cap.id, cap.userId || "", JSON.stringify(cap), createdAt]
        );
      }
    }

    // 4. Sync Trades
    if (Array.isArray(data.trades)) {
      for (const t of data.trades) {
        if (!t || !t.id) continue;
        const createdAt = t.createdAt ? new Date(t.createdAt) : new Date();
        await poolInstance.query(
          `INSERT INTO nekomon_trades (id, sender_id, target_id, status, data, created_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             sender_id = VALUES(sender_id),
             target_id = VALUES(target_id),
             status = VALUES(status),
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [t.id, t.senderId || "", t.targetId || "", t.status || "open", JSON.stringify(t), createdAt]
        );
      }
    }

    // 5. Sync Community Spots
    if (Array.isArray(data.communitySpots)) {
      for (const s of data.communitySpots) {
        if (!s || !s.id) continue;
        const createdAt = s.createdAt ? new Date(s.createdAt) : new Date();
        await poolInstance.query(
          `INSERT INTO nekomon_community_spots (id, name, element, created_by, data, created_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             element = VALUES(element),
             created_by = VALUES(created_by),
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [s.id, s.name || "", s.element || "", s.createdBy || "", JSON.stringify(s), createdAt]
        );
      }
    }

    // 6. Sync Battle History
    if (Array.isArray(data.battleHistory)) {
      for (const b of data.battleHistory) {
        if (!b || !b.id) continue;
        const createdAt = b.createdAt ? new Date(b.createdAt) : new Date();
        await poolInstance.query(
          `INSERT INTO nekomon_battle_history (id, data, created_at)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [b.id, JSON.stringify(b), createdAt]
        );
      }
    }

    // 7. Sync Transactions
    if (Array.isArray(data.transactions)) {
      for (const tx of data.transactions) {
        if (!tx || !tx.id) continue;
        const createdAt = tx.createdAt ? new Date(tx.createdAt) : new Date();
        await poolInstance.query(
          `INSERT INTO nekomon_transactions (id, user_id, type, data, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             user_id = VALUES(user_id),
             type = VALUES(type),
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [tx.id, tx.userId || "", tx.type || "purchase", JSON.stringify(tx), createdAt]
        );
      }
    }

    // 8. Sync Official Mails
    if (Array.isArray(data.officialMails)) {
      for (const m of data.officialMails) {
        if (!m || !m.id) continue;
        const createdAt = m.createdAt ? new Date(m.createdAt) : new Date();
        await poolInstance.query(
          `INSERT INTO nekomon_official_mails (id, category, data, created_at)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             category = VALUES(category),
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [m.id, m.category || "general", JSON.stringify(m), createdAt]
        );
      }
    }

    // 9. Sync Direct Messages
    if (Array.isArray(data.directMessages)) {
      for (const dm of data.directMessages) {
        if (!dm || !dm.id) continue;
        const createdAt = dm.createdAt ? new Date(dm.createdAt) : new Date();
        await poolInstance.query(
          `INSERT INTO nekomon_direct_messages (id, sender_id, receiver_id, data, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             sender_id = VALUES(sender_id),
             receiver_id = VALUES(receiver_id),
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [dm.id, dm.senderId || "", dm.receiverId || "", JSON.stringify(dm), createdAt]
        );
      }
    }

    // 10. Sync Raid Bosses
    if (Array.isArray(data.raidBosses)) {
      for (const boss of data.raidBosses) {
        if (!boss || !boss.id) continue;
        const createdAt = boss.createdAt ? new Date(boss.createdAt) : new Date();
        await poolInstance.query(
          `INSERT INTO nekomon_raid_bosses (id, element, level, data, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             element = VALUES(element),
             level = VALUES(level),
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [boss.id, boss.element || "Fire", boss.level || 1, JSON.stringify(boss), createdAt]
        );
      }
    }

    // 11. Sync Raid Lobbies
    if (Array.isArray(data.raidLobbies)) {
      for (const lobby of data.raidLobbies) {
        if (!lobby || !lobby.id) continue;
        const createdAt = lobby.createdAt ? new Date(lobby.createdAt) : new Date();
        await poolInstance.query(
          `INSERT INTO nekomon_raid_lobbies (id, room_code, status, data, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             room_code = VALUES(room_code),
             status = VALUES(status),
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [lobby.id, lobby.roomCode || "", lobby.status || "waiting", JSON.stringify(lobby), createdAt]
        );
      }
    }

    // 12. Sync Territory Nodes
    if (Array.isArray(data.territoryNodes)) {
      for (const node of data.territoryNodes) {
        if (!node || !node.id) continue;
        await poolInstance.query(
          `INSERT INTO nekomon_territory_nodes (id, owner_faction, data)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             owner_faction = VALUES(owner_faction),
             data = VALUES(data),
             updated_at = CURRENT_TIMESTAMP`,
          [node.id, node.ownerFaction || "Neutral", JSON.stringify(node)]
        );
      }
    }

    // 13. Sync Meta state
    const metaEntries = [
      { key: "maxUnlockedRaidLevel", val: data.maxUnlockedRaidLevel || 10 },
      { key: "highestDefeatedRaidBossLevel", val: data.highestDefeatedRaidBossLevel || 0 },
      { key: "defeatedRaidBossLevels", val: data.defeatedRaidBossLevels || [] },
      { key: "passwordResets", val: data.passwordResets || [] }
    ];

    for (const m of metaEntries) {
      await poolInstance.query(
        `INSERT INTO nekomon_system_meta (meta_key, meta_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE
           meta_value = VALUES(meta_value),
           updated_at = CURRENT_TIMESTAMP`,
        [m.key, JSON.stringify(m.val)]
      );
    }

    lastSyncTime = new Date().toISOString();
  } catch (err: any) {
    console.error("[MySQL] Error persisting data to MySQL:", err?.message || err);
    lastErrorMessage = err?.message || String(err);
  } finally {
    syncInProgress = false;
    if (pendingSyncData) {
      const nextData = pendingSyncData;
      pendingSyncData = null;
      setImmediate(() => syncToMySQL(nextData));
    }
  }
}

// -------------------------------------------------------------
// Atomic single-card helper: immediate persistence
// -------------------------------------------------------------
export async function persistSingleCardToMySQL(card: any): Promise<boolean> {
  const poolInstance = getMySQLPool();
  if (!poolInstance || !isConnected || !isInitialized) return false;
  if (!card || !card.id) return false;

  try {
    const createdAt = card.createdAt ? new Date(card.createdAt) : new Date();
    await poolInstance.query(
      `INSERT INTO nekomon_cards (id, user_id, capture_id, name, element, rarity, level, xp, energy, data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         capture_id = VALUES(capture_id),
         name = VALUES(name),
         element = VALUES(element),
         rarity = VALUES(rarity),
         level = VALUES(level),
         xp = VALUES(xp),
         energy = VALUES(energy),
         data = VALUES(data),
         updated_at = CURRENT_TIMESTAMP`,
      [
        card.id,
        card.userId || "",
        card.captureId || "",
        card.name || "Nekomon",
        card.element || "Api",
        card.rarity || "Common",
        card.level || 1,
        card.xp || 0,
        card.energy !== undefined ? card.energy : 100,
        JSON.stringify(card),
        createdAt
      ]
    );
    return true;
  } catch (err: any) {
    console.error(`[MySQL] Failed to atomically persist card ${card.id}:`, err?.message || err);
    return false;
  }
}

// -------------------------------------------------------------
// Atomic delete card helper
// -------------------------------------------------------------
export async function deleteSingleCardFromMySQL(cardId: string): Promise<boolean> {
  const poolInstance = getMySQLPool();
  if (!poolInstance || !isConnected || !isInitialized) return false;

  try {
    await poolInstance.query("DELETE FROM nekomon_cards WHERE id = ?", [cardId]);
    return true;
  } catch (err: any) {
    console.error(`[MySQL] Failed to delete card ${cardId} from MySQL:`, err?.message || err);
    return false;
  }
}

// -------------------------------------------------------------
// Status & Diagnostics Provider
// -------------------------------------------------------------
export function getMySQLStatus(): MySQLStatusInfo {
  const cfg = getMySQLConfig();
  const enabled = isMySQLEnabled();

  let instructionId: string | null = null;
  let instructionEn: string | null = null;

  if (isRemoteHostBlocked) {
    instructionId = `Akses Remote MySQL Hostinger Ditolak: Server MySQL Hostinger (${cfg.host}) memerlukan izin Remote MySQL. Buka hPanel Hostinger -> menu "Databases" -> "Remote MySQL", lalu tambahkan IP server atau simbol wildcard '%' untuk user '${cfg.user}'. Catatan: Jika aplikasi di-deploy langsung di server Hostinger (Skenario 1), ubah DB_HOST menjadi 'localhost' atau '127.0.0.1' agar terkoneksi secara internal tanpa batasan remote IP.`;
    instructionEn = `Hostinger Remote MySQL Access Denied: MySQL server at ${cfg.host} rejected connection from external host. In Hostinger hPanel -> Databases -> Remote MySQL, add wildcard '%' or your server IP for user '${cfg.user}'. Note: If running directly on the Hostinger server (Scenario 1), set DB_HOST="localhost" or "127.0.0.1" for direct zero-latency internal connection.`;
  }

  return {
    configured: Boolean(cfg.host && cfg.database && cfg.user),
    enabled,
    driver: cfg.driver,
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    user: cfg.user,
    connected: isConnected,
    initialized: isInitialized,
    lastConnectedAt: lastConnectedTime,
    lastSyncAt: lastSyncTime,
    lastError: lastErrorMessage,
    isHostingerRemoteBlocked: isRemoteHostBlocked,
    instructionId,
    instructionEn,
    tableCounts: tableCountsCache
  };
}
