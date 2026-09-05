import React, { useState, useRef } from "react";
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
  X
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

  if (!isOpen) return null;

  const isDev =
    user?.role === "developer" ||
    (user?.email && ["verydiaz@gmail.com", "support@nekomon.online", "nekomaster@nekomon.online"].includes(user.email.toLowerCase().trim()));

  const getDevToken = () => localStorage.getItem("token") || localStorage.getItem("nekomon_token") || "";

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-slate-900 border border-yellow-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 font-mono text-sm sm:text-base flex items-center gap-2">
                  <span>{isEn ? "Database Backup & Firestore Recovery" : "Cadangan & Pemulihan Database"}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                    Developer Only
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {isEn ? "Permanent cloud persistence & 1-click JSON snapshot" : "Penyimpanan awan permanen & ekspor/impor 1-klik"}
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
            {/* Developer Check Warning */}
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
                {/* Cloud Firestore Persistence Info Card */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2 font-bold text-yellow-400">
                      <Cloud className="w-4 h-4 text-cyan-400" />
                      {isEn ? "Cloud Firestore Engine Status" : "Status Cloud Firestore"}
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Connected (Auto-Sync Active)
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
                    <p className="font-bold text-xs">{errorMsg}</p>
                  </div>
                )}

                {/* 3 Main Action Tiles */}
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
                          ? "Upload a previous .json backup file to restore server data and sync to Firestore."
                          : "Unggah file backup .json untuk memulihkan seluruh data dan sinkronkan ke Firestore."}
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
