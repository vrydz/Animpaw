/**
 * Nekomon Online - MySQL Connection Diagnostic Script (ID/EN)
 * Run on server: npm run test:db or node scripts/test-mysql-connection.js
 */
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

async function runDiagnostic() {
  console.log("==================================================");
  console.log("🐾 NEKOMON MYSQL DIAGNOSTIC TOOL / ALAT DIAGNOSTIK");
  console.log("==================================================");

  const host = process.env.DB_HOST || "localhost";
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const database = process.env.DB_NAME || "u696515981_nekomondb";
  const user = process.env.DB_USER || "u696515981_support";
  const password = process.env.DB_PASSWORD || "";
  const driver = process.env.DATABASE_DRIVER || "mysql";

  console.log(`[Config / Konfigurasi]`);
  console.log(`- Driver       : ${driver}`);
  console.log(`- Host         : ${host}`);
  console.log(`- Port         : ${port}`);
  console.log(`- Database     : ${database}`);
  console.log(`- User         : ${user}`);
  console.log(`- Password Set : ${password ? "YES / TERISI (***)" : "NO / KOSONG"}`);
  console.log("--------------------------------------------------");

  if (!password) {
    console.warn("⚠️  PERINGATAN (WARNING): DB_PASSWORD masih kosong di environment!");
    console.warn("   Pastikan berkas .env berisi kredensial MySQL yang benar.");
  }

  console.log("⏳ Menguji koneksi ke database server MySQL... (Testing connection...)");
  const startTime = Date.now();

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: 10000
    });

    const latency = Date.now() - startTime;
    console.log(`✅ KONEKSI BERHASIL! / CONNECTION SUCCESSFUL! (${latency}ms)`);
    console.log(`--------------------------------------------------`);

    const [ping] = await connection.query("SELECT 1 AS ping, NOW() AS server_time, VERSION() AS mysql_version;");
    console.log("📊 Informasi Server MySQL:");
    console.log(`   - MySQL Version : ${ping[0]?.mysql_version}`);
    console.log(`   - Server Time   : ${ping[0]?.server_time}`);

    const [tables] = await connection.query("SHOW TABLES;");
    console.log(`📋 Total Tabel di Database: ${tables.length}`);
    if (tables.length > 0) {
      console.log("   Daftar Tabel:");
      for (const t of tables) {
        const tableName = Object.values(t)[0];
        try {
          const [cnt] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
          console.log(`   - ${tableName}: ${cnt[0]?.count} baris/rows`);
        } catch {
          console.log(`   - ${tableName}`);
        }
      }
    } else {
      console.log("   (Belum ada tabel dibuat. Tabel akan otomatis dibuat saat server applet dijalankan)");
    }

    await connection.end();
    console.log("==================================================");
    console.log("🎉 Database MySQL Hostinger 100% siap digunakan!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ KONEKSI GAGAL / CONNECTION FAILED!");
    console.error(`   Pesan Error: ${err.message}`);
    console.log("--------------------------------------------------");

    if (err.message.includes("Access denied for user") || err.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("💡 PENYEBAB & SOLUSI (CAUSE & SOLUTION):");
      console.log("1. Jika script ini dijalankan di luar server Hostinger (remote):");
      console.log("   - Buka hPanel Hostinger -> Databases -> Remote MySQL.");
      console.log(`   - Tambahkan simbol '%' (semua host) atau IP Anda untuk user '${user}'.`);
      console.log("2. Jika script ini dijalankan langsung di server Hostinger (Full-Stack):");
      console.log("   - Pastikan DB_HOST=\"localhost\" atau \"127.0.0.1\".");
      console.log("   - Periksa kembali ketepatan DB_PASSWORD.");
    } else if (err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED") {
      console.log("💡 PENYEBAB & SOLUSI (CAUSE & SOLUTION):");
      console.log(`   - Host ${host}:${port} tidak dapat dijangkau. Pastikan port 3306 terbuka atau gunakan 'localhost'.`);
    }

    console.log("==================================================");
    process.exit(1);
  }
}

runDiagnostic();
