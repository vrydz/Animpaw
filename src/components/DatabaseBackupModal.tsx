import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Upload,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  HardDrive,
  FileJson,
  X,
  Server,
  Activity,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { User } from "../types";

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onDataRestored?: () => void;
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  user,
  onDataRestored
}) => {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [restoreStats, setRestoreStats] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Hostinger MySQL states
  const [mysqlStatus, setMysqlStatus] = useState<any | null>(null);
  const [testingMysql, setTestingMysql] = useState<boolean>(false);
  const [migratingMysql, setMigratingMysql] = useState<boolean>(false);
  const [pullingMysql, setPullingMysql] = useState<boolean>(false);

  const isDev =
    user?.role === "developer" ||
    (user?.email && ["verydiaz@gmail.com", "support@nekomon.online", "nekomaster@nekomon.online"].includes(user.email.toLowerCase().trim()));

  const getDevToken = () => localStorage.getItem("token") || localStorage.getItem("nekomon_token") || "";

  // Fetch MySQL status whenever modal opens
  const fetchMySQLStatus = async () => {
    try {
      const token = getDevToken();
      const res = await fetch("/api/developer/database/mysql-status", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": user?.id || "",
          "x-user-email": user?.email || ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setMysqlStatus(data.status);
        }
      }
    } catch {
      // Ignore background status polling errors
    }
  };

  useEffect(() => {
    if (isOpen && isDev) {
      fetchMySQLStatus();
    }
  }, [isOpen, isDev]);

  if (!isOpen) return null;

  // 1. Download full JSON backup
  const handleDownloadBackup = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const token = getDevToken();
      const res = await fetch("/api/developer/database/backup", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": user?.id || "",
          "x-user-email": user?.email || ""
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengunduh backup database.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `nekomon_database_backup_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccessMsg(isEn ? "Database backup downloaded successfully!" : "File cadangan database (.json) berhasil diunduh ke perangkat Anda!");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memproses unduhan backup.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Upload and restore database JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        setRestoreStats(null);

        const content = event.target?.result as string;
        const backupData = JSON.parse(content);

        const token = getDevToken();
        const res = await fetch("/api/developer/database/restore", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
            "x-user-id": user?.id || "",
            "x-user-email": user?.email || ""
          },
          body: JSON.stringify({ backupData })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Gagal memulihkan database.");
        }

        setSuccessMsg(data.message || (isEn ? "Database restored successfully!" : "Database berhasil dipulihkan!"));
        if (data.stats) {
          setRestoreStats(data.stats);
        }
        if (onDataRestored) {
          onDataRestored();
        }
        fetchMySQLStatus();
      } catch (err: any) {
        setErrorMsg(err.message || "File JSON tidak valid atau struktur tidak cocok.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  // 3. Force Sync to Firestore
  const handleSyncFirestore = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const token = getDevToken();
      const res = await fetch("/api/developer/database/sync-firestore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": user?.id || "",
          "x-user-email": user?.email || ""
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi ke Firestore.");

      setSuccessMsg(data.message || (isEn ? "Firestore synchronized!" : "Data berhasil disinkronkan ke Cloud Firestore!"));
    } catch (err: any) {
      setErrorMsg(err.message || "Sinkronisasi gagal.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Test Hostinger MySQL Connection
  const handleTestMySQL = async () => {
    try {
      setTestingMysql(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const token = getDevToken();
      const res = await fetch("/api/developer/database/mysql-test", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": user?.id || "",
          "x-user-email": user?.email || ""
        }
      });

      const data = await res.json();
      if (data.status) setMysqlStatus(data.status);

      if (data.success) {
        setSuccessMsg(
          isEn
            ? `MySQL Connection OK (${data.result?.latencyMs ?? 0}ms)! Host: ${data.status?.host}:${data.status?.port}`
            : `Koneksi MySQL Sukses (${data.result?.latencyMs ?? 0}ms)! Host: ${data.status?.host}:${data.status?.port}`
        );
      } else {
        const errorDetail = data.status?.isHostingerRemoteBlocked
          ? (isEn ? data.status?.instructionEn : data.status?.instructionId)
          : (data.result?.message || data.error);
        setErrorMsg(errorDetail);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal mengetes koneksi MySQL.");
    } finally {
      setTestingMysql(false);
    }
  };

  // 5. Migrate / Push Data to Hostinger MySQL
  const handleMigrateMySQL = async () => {
    try {
      setMigratingMysql(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const token = getDevToken();
      const res = await fetch("/api/developer/database/mysql-migrate", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": user?.id || "",
          "x-user-email": user?.email || ""
        }
      });

      const data = await res.json();
      if (data.status) setMysqlStatus(data.status);

      if (data.success) {
        setSuccessMsg(isEn ? data.messageEn : data.message);
        if (data.stats) {
          setRestoreStats({
            usersCount: data.stats.users,
            cardsCount: data.stats.cards,
            spotsCount: data.stats.spots,
            capturesCount: data.stats.captures
          });
        }
      } else {
        const msg = data.status?.isHostingerRemoteBlocked
          ? (isEn ? data.status?.instructionEn : data.status?.instructionId)
          : (isEn ? data.errorEn : data.error);
        setErrorMsg(msg);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal sinkronisasi ke MySQL.");
    } finally {
      setMigratingMysql(false);
    }
  };

  // 6. Pull Data from Hostinger MySQL
  const handlePullMySQL = async () => {
    try {
      setPullingMysql(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const token = getDevToken();
      const res = await fetch("/api/developer/database/mysql-pull", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": user?.id || "",
          "x-user-email": user?.email || ""
        }
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(isEn ? data.messageEn : data.message);
        if (onDataRestored) onDataRestored();
        fetchMySQLStatus();
      } else {
        setErrorMsg(isEn ? data.errorEn : data.error);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal menarik data dari MySQL.");
    } finally {
      setPullingMysql(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-yellow-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 font-mono text-sm sm:text-base flex items-center gap-2">
                  <span>{isEn ? "Database & Hostinger MySQL Persistence" : "Cadangan Database & Hostinger MySQL"}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                    Developer Only
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {isEn ? "Scenario 1: Full-Stack Hostinger MySQL & Cloud Persistence" : "Skenario 1: Full-Stack MySQL Server Hostinger & Cloud Sync"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
            {!isDev ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isEn ? "Access Restricted" : "Akses Terbatas"}</span>
                </div>
                <p className="text-xs">
                  {isEn
                    ? "This menu is restricted to authorized developer accounts (verydiaz@gmail.com, nekomaster@nekomon.online, support@nekomon.online)."
                    : "Menu ini hanya dapat diakses oleh akun pengembang resmi (verydiaz@gmail.com, nekomaster@nekomon.online, support@nekomon.online)."}
                </p>
              </div>
            ) : (
              <>
                {/* 1. Hostinger MySQL Persistence Section (Scenario 1) */}
                <div className="p-4 bg-slate-950 rounded-xl border border-amber-500/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <Server className="w-4 h-4 text-amber-400" />
                      <span>{isEn ? "Hostinger MySQL Engine (Scenario 1)" : "Database MySQL Hostinger (Skenario 1)"}</span>
                    </div>

                    {mysqlStatus?.connected ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {isEn ? "Connected (Persistent)" : "Terhubung (Persisten)"}
                      </span>
                    ) : mysqlStatus?.isHostingerRemoteBlocked ? (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {isEn ? "Remote Whitelist Required" : "Perlu Remote Whitelist"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {mysqlStatus?.configured ? (isEn ? "Configured" : "Terkonfigurasi") : (isEn ? "Not Configured" : "Belum Dikonfigurasi")}
                      </span>
                    )}
                  </div>

                  {/* Server Info Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                    <div>
                      <span className="text-slate-500 block">Host:</span>
                      <span className="font-semibold text-slate-200">{mysqlStatus?.host || "194.59.164.56"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Port:</span>
                      <span className="font-semibold text-slate-200">{mysqlStatus?.port || 3306}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Database:</span>
                      <span className="font-semibold text-amber-300 truncate block">{mysqlStatus?.database || "u696515981_nekomondb"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">User:</span>
                      <span className="font-semibold text-slate-200 truncate block">{mysqlStatus?.user || "u696515981_support"}</span>
                    </div>
                  </div>

                  {/* Hostinger Instruction Notice */}
                  {mysqlStatus?.isHostingerRemoteBlocked && (
                    <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg text-amber-300/90 text-[11px] leading-relaxed space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{isEn ? "Hostinger Remote Access Notice" : "Petunjuk Akses MySQL Hostinger"}</span>
                      </div>
                      <p>
                        {isEn
                          ? "Hostinger rejected external connection: In Hostinger hPanel -> Databases -> Remote MySQL, allow wildcard '%' for user 'u696515981_support'. When deploying the app directly onto Hostinger (Scenario 1: Full-Stack), set DB_HOST='localhost' so it connects internally without network restriction."
                          : "Akses luar server Hostinger memerlukan izin: Buka hPanel Hostinger -> menu Databases -> Remote MySQL, lalu tambahkan IP atau tanda '%' untuk user 'u696515981_support'. Ketika aplikasi dijalankan langsung di server Hostinger (Skenario 1), ubah DB_HOST menjadi 'localhost' agar terhubung secara lokal tanpa batasan IP."}
                      </p>
                    </div>
                  )}

                  {/* MySQL Table Counts if Connected */}
                  {mysqlStatus?.connected && mysqlStatus?.tableCounts && (
                    <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-[10px] text-slate-400 space-y-1">
                      <span className="text-slate-300 font-bold block flex items-center gap-1">
                        <Layers className="w-3 h-3 text-cyan-400" />
                        {isEn ? "Table Record Counts in MySQL:" : "Jumlah Data di Tabel MySQL:"}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-slate-300">
                        <span>🃏 {isEn ? "Cards" : "Kartu"}: <b className="text-amber-400">{mysqlStatus.tableCounts["nekomon_cards"] ?? 0}</b></span>
                        <span>👥 {isEn ? "Users" : "Pemain"}: <b className="text-cyan-400">{mysqlStatus.tableCounts["nekomon_users"] ?? 0}</b></span>
                        <span>📍 {isEn ? "Spots" : "Spot"}: <b className="text-emerald-400">{mysqlStatus.tableCounts["nekomon_community_spots"] ?? 0}</b></span>
                        <span>📸 {isEn ? "Captures" : "Tangkapan"}: <b className="text-purple-400">{mysqlStatus.tableCounts["nekomon_captures"] ?? 0}</b></span>
                      </div>
                    </div>
                  )}

                  {/* MySQL Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={handleTestMySQL}
                      disabled={testingMysql || migratingMysql || pullingMysql}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${testingMysql ? "animate-spin" : ""}`} />
                      <span>{isEn ? "Test Connection" : "Tes Koneksi"}</span>
                    </button>

                    <button
                      onClick={handleMigrateMySQL}
                      disabled={testingMysql || migratingMysql || pullingMysql}
                      className="py-2 px-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Server className={`w-3 h-3 ${migratingMysql ? "animate-spin" : ""}`} />
                      <span>{isEn ? "Push to MySQL" : "Migrasi ke MySQL"}</span>
                    </button>

                    <button
                      onClick={handlePullMySQL}
                      disabled={testingMysql || migratingMysql || pullingMysql}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <HardDrive className={`w-3 h-3 ${pullingMysql ? "animate-spin" : ""}`} />
                      <span>{isEn ? "Pull from MySQL" : "Tarik dari MySQL"}</span>
                    </button>
                  </div>
                </div>

                {/* Cloud Firestore Persistence Info Card */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2 font-bold text-yellow-400">
                      <Cloud className="w-4 h-4 text-cyan-400" />
                      {isEn ? "Cloud Firestore Engine Status" : "Status Cloud Firestore"}
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Auto-Sync Active
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {isEn
                      ? "Every player account, forging card, capture history, and community map spot is continuously synced to Google Cloud Firestore (ai-studio-nekomoncardgame-216c27dc-311b-481e-8ce0-fa9586d56311) and automatically re-loaded upon server deploy."
                      : "Seluruh data pemain, kartu hasil forging, tangkapan AR, dan spot peta komunitas tersimpan di Google Cloud Firestore dan otomatis dimuat ulang (auto-sync) setiap kali server di-deploy."}
                  </p>
                </div>

                {/* Status Messages */}
                {successMsg && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">{successMsg}</p>
                      {restoreStats && (
                        <p className="text-[10px] text-emerald-500 mt-1">
                          📊 {restoreStats.usersCount} Pemain • {restoreStats.cardsCount} Kartu • {restoreStats.spotsCount} Spot Komunitas • {restoreStats.capturesCount} Log Foto
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="font-bold text-xs leading-relaxed">{errorMsg}</p>
                  </div>
                )}

                {/* 2 Main Action Tiles: JSON Download & Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Action 1: Download JSON Backup */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-yellow-400 font-bold">
                        <Download className="w-4 h-4" />
                        <span>{isEn ? "Download JSON Backup" : "Unduh Cadangan JSON"}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {isEn
                          ? "Export all player data, decks, battle histories, and maps to a local .json file."
                          : "Ekspor seluruh database (pemain, kartu, spot peta, transaksi) ke file .json lokal."}
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadBackup}
                      disabled={loading}
                      className="w-full py-2.5 px-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-yellow-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileJson className="w-3.5 h-3.5" />}
                      <span>{isEn ? "Export Backup .JSON" : "Unduh Backup .JSON"}</span>
                    </button>
                  </div>

                  {/* Action 2: Upload & Restore JSON */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold">
                        <Upload className="w-4 h-4" />
                        <span>{isEn ? "Restore Database" : "Pulihkan Database"}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {isEn
                          ? "Upload a previous .json backup file to restore server data and sync to MySQL/Firestore."
                          : "Unggah file backup .json untuk memulihkan seluruh data dan sinkronkan ke MySQL/Firestore."}
                      </p>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json,application/json"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="w-full py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-cyan-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                      <span>{isEn ? "Upload & Restore" : "Unggah & Pulihkan"}</span>
                    </button>
                  </div>
                </div>

                {/* Action 3: Force Sync to Firestore */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-slate-200 font-bold text-xs block">
                        {isEn ? "Force Push to Firestore" : "Paksa Sinkronkan ke Firestore"}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {isEn ? "Sync memory cache immediately to Google Cloud" : "Kirim seluruh data lokal langsung ke Cloud Firestore sekarang"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleSyncFirestore}
                    disabled={loading}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer text-[11px]"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                    <span>{isEn ? "Sync Now" : "Sinkronkan"}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Official Developer Tools • Nekomon Online</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-colors cursor-pointer"
            >
              {isEn ? "Close" : "Tutup"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
