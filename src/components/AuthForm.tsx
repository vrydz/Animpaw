import React, { useState } from "react";
import { 
  User, 
  ShieldAlert, 
  CheckCircle, 
  Sparkles, 
  Mail, 
  Lock, 
  ArrowRight, 
  RefreshCw, 
  Camera, 
  Flame, 
  Swords, 
  ShieldCheck, 
  HelpCircle, 
  Info, 
  FileText, 
  MapPin,
  Coins
} from "lucide-react";
import { motion } from "motion/react";
import { signInWithGoogleFirebase } from "../lib/firebase";
import { getAnimeNekomonSpeciesArtwork } from "../data/nekomonSpeciesData";
import { LegalPagesModal, LegalTabType } from "./LegalPagesModal";
import { AdSenseBanner } from "./AdSenseBanner";
import { useLanguage } from "../context/LanguageContext";

const nekomonLogoImg = new URL("../assets/images/nekomon_logo_official_1786260255520.jpg", import.meta.url).href;

interface AuthFormProps {
  onSuccess: (token: string, userData: any) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [mode, setMode] = useState<"login" | "register_email" | "register_verifying" | "register_username" | "forgot_password" | "reset_password">("login");
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [token, setToken] = useState<string>("");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Legal Modal State
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTabType>("privacy");

  const openLegalModal = (tab: LegalTabType) => {
    setLegalModalTab(tab);
    setShowLegalModal(true);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const googleUser = await signInWithGoogleFirebase();
      if (!googleUser || !googleUser.email) {
        throw new Error(isEn ? "Failed to retrieve information from Google." : "Gagal mendapatkan informasi dari Google.");
      }

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleUser.email,
          displayName: googleUser.displayName || "",
          uid: googleUser.uid,
          photoURL: googleUser.photoURL || ""
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || (isEn ? "Google sign-in failed." : "Gagal masuk menggunakan Google."));
      }

      setSuccess(isEn ? "Google login successful! Loading game..." : "Login Google berhasil! Memuat data game...");
      updateLocalBackup(data.user, "google_oauth_auth");
      setTimeout(() => {
        onSuccess(data.token, data.user);
      }, 1000);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError(isEn ? "Google login session was cancelled." : "Sesi login Google dibatalkan.");
      } else {
        setError(err.message || (isEn ? "Failed to sign in with Google." : "Gagal masuk menggunakan Google."));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateLocalBackup = (userObj: any, passwordStr: string) => {
    if (!userObj || !userObj.username) return;
    try {
      const key = "nekomon_backup_users";
      const existingStr = localStorage.getItem(key);
      const backups = existingStr ? JSON.parse(existingStr) : {};
      
      const usernameKey = userObj.username.toLowerCase();
      const prevBackup = backups[usernameKey] || {};
      
      backups[usernameKey] = {
        user: { ...prevBackup.user, ...userObj },
        password: passwordStr || prevBackup.password || "",
        captures: prevBackup.captures || [],
        cards: prevBackup.cards || []
      };
      
      const sanitize = (data: any, mode: number) => {
        try {
          const clean = JSON.parse(JSON.stringify(data));
          for (const k in clean) {
            const entry = clean[k];
            if (entry?.captures) {
              entry.captures = entry.captures.map((c: any) => ({
                ...c,
                photoBase64: mode === 0 && (c.photoBase64?.length || 0) < 30000 ? c.photoBase64 : ""
              }));
            }
            if (entry?.cards) {
              entry.cards = entry.cards.map((card: any) => {
                let img = card.imageUrl;
                if (!img || typeof img !== "string" || img.trim() === "" || (mode > 0 && img.length > 50000)) {
                  img = getAnimeNekomonSpeciesArtwork(
                    card.name || "Nekomon",
                    card.element || "Api",
                    card.style || "Sentinel",
                    card.rarity || "Common"
                  );
                }
                return {
                  ...card,
                  imageUrl: img
                };
              });
            }
            if (mode === 2) {
              entry.captures = [];
              entry.cards = [];
            }
          }
          return clean;
        } catch {
          return data;
        }
      };

      try {
        localStorage.setItem(key, JSON.stringify(sanitize(backups, 0)));
      } catch {
        try {
          localStorage.setItem(key, JSON.stringify(sanitize(backups, 1)));
        } catch {
          try {
            localStorage.setItem(key, JSON.stringify(sanitize(backups, 2)));
          } catch {
            // Ignore quota limits
          }
        }
      }
    } catch {
      // Ignore backup errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        let data = await response.json();

        // Ephemeral Server Reset Fallback Check:
        if (!response.ok) {
          try {
            const key = "nekomon_backup_users";
            const existingStr = localStorage.getItem(key);
            const backups = existingStr ? JSON.parse(existingStr) : {};
            const usernameKey = username.trim().toLowerCase();
            const backup = backups[usernameKey];

            if (backup && backup.password === password.trim()) {
              setSuccess(isEn ? "Syncing account from local database..." : "Sinkronisasi akun dari database lokal...");
              const syncResponse = await fetch("/api/auth/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user: backup.user,
                  password: backup.password,
                  captures: backup.captures,
                  cards: backup.cards
                }),
              });

              if (syncResponse.ok) {
                // Retry login now that user is restored
                const retryResponse = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username, password }),
                });
                data = await retryResponse.json();
                if (retryResponse.ok) {
                  setSuccess(isEn ? "Login successful! Loading game..." : "Login berhasil! Memuat data game...");
                  updateLocalBackup(data.user, password.trim());
                  setTimeout(() => {
                    onSuccess(data.token, data.user);
                  }, 1200);
                  return;
                }
              }
            }
          } catch (syncErr) {
            console.error("Error during auto-sync restore:", syncErr);
          }
          throw new Error(data.error || (isEn ? "Invalid username, email, or password." : "Username, Email, atau password salah."));
        }

        setSuccess(isEn ? "Login successful! Loading game..." : "Login berhasil! Memuat data game...");
        updateLocalBackup(data.user, password.trim());
        setTimeout(() => {
          onSuccess(data.token, data.user);
        }, 1200);

      } else if (mode === "register_email") {
        const response = await fetch("/api/auth/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || (isEn ? "Failed to process email registration." : "Gagal memproses pendaftaran email."));
        }

        setSuccess(isEn ? `Verification link sent to ${email}!` : `Link verifikasi berhasil dikirim ke ${email}!`);
        setToken(data.token);
        setTimeout(() => {
          setMode("register_verifying");
          setSuccess(null);
        }, 1500);

      } else if (mode === "register_username") {
        const response = await fetch("/api/auth/complete-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, username }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || (isEn ? "Failed to register trainer username." : "Gagal mendaftarkan nama alias."));
        }

        setSuccess(isEn ? "Registration complete! Logging in..." : "Pendaftaran selesai! Memulai game...");
        updateLocalBackup(data.user, "initial_reg");
        setTimeout(() => {
          onSuccess(data.token, data.user);
        }, 1200);

      } else if (mode === "forgot_password") {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || (isEn ? "Failed to send reset link." : "Gagal mengirim link reset."));
        }

        setSuccess(isEn ? "Password reset link sent to your email!" : "Link reset password berhasil dikirim ke email Anda!");
        setToken(data.token);
        setTimeout(() => {
          setMode("reset_password");
          setSuccess(null);
        }, 1500);

      } else if (mode === "reset_password") {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || (isEn ? "Failed to reset password." : "Gagal mereset kata sandi."));
        }

        setSuccess(isEn ? "Password updated successfully! Please log in." : "Sandi berhasil diupdate! Silakan masuk kembali.");
        setTimeout(() => {
          setMode("login");
          setSuccess(null);
          setNewPassword("");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || (isEn ? "Failed to connect to server." : "Gagal menghubungi server."));
    } finally {
      setLoading(false);
    }
  };

  const getHeaderInfo = () => {
    switch (mode) {
      case "login":
        return {
          title: isEn ? "LOG IN TO NEKOMON" : "MASUK NEKOMON",
          desc: isEn ? "Log in to continue your adventure of collecting legendary Nekomon cards." : "Masuk untuk melanjutkan petualangan mengoleksi kartu Nekomon legendaris."
        };
      case "register_email":
        return {
          title: isEn ? "REGISTER NEW ACCOUNT" : "DAFTAR AKUN BARU",
          desc: isEn ? "Enter your real email address. The system will send an email verification link first." : "Masukkan alamat email asli Anda. Sistem akan mengirimkan link verifikasi email terlebih dahulu."
        };
      case "register_verifying":
        return {
          title: isEn ? "VERIFY YOUR EMAIL" : "VERIFIKASI EMAIL ANDA",
          desc: isEn ? "We have sent a verification link to your email address." : "Kami telah mengirimkan tautan verifikasi ke email asli Anda."
        };
      case "register_username":
        return {
          title: isEn ? "CREATE YOUR USERNAME" : "BUAT USERNAME ANDA",
          desc: isEn ? "Email verified successfully! Now choose a unique trainer username to start the game." : "Email berhasil diverifikasi! Sekarang, tentukan nama alias unik untuk memulai game."
        };
      case "forgot_password":
        return {
          title: isEn ? "FORGOT PASSWORD" : "LUPA KATA SANDI",
          desc: isEn ? "Enter your registered email address to receive a password reset link." : "Ketik alamat email Anda yang pernah terdaftar untuk mendapatkan tautan reset sandi."
        };
      case "reset_password":
        return {
          title: isEn ? "SET NEW PASSWORD" : "ATUR SANDI BARU",
          desc: isEn ? "Enter your new chosen password to restore access to your trainer account." : "Masukkan sandi baru pilihan Anda untuk memulihkan akses ke akun trainer."
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="w-full flex flex-col font-sans selection:bg-yellow-500 selection:text-slate-950">
      
      {/* Interactive Login / Register Form Card */}
      <div className="w-full bg-slate-900 border-2 border-yellow-500/40 rounded-2xl shadow-2xl p-6 relative overflow-hidden font-mono">
        
        {/* Decorative Gaming Background Particles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full filter blur-xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full filter blur-xl pointer-events-none"></div>

        {/* Header section with Official NEKOMON Logo */}
        <div className="text-center flex flex-col items-center gap-2 mb-6">
          <div className="relative group max-w-[180px] w-full mb-1">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-amber-500 to-red-600 rounded-2xl blur-md opacity-60 group-hover:opacity-90 transition duration-500" />
            <img 
              src={nekomonLogoImg} 
              alt="Official NEKOMON Logo" 
              className="relative w-full h-auto object-contain rounded-xl border border-amber-500/40 shadow-xl"
            />
          </div>
          <h2 className="text-xl font-black text-slate-100 font-sans tracking-wide">
            {headerInfo.title}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            {headerInfo.desc}
          </p>
        </div>

        {/* Error and Success alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-950/80 border border-red-500/30 text-red-200 text-xs p-3 rounded-xl mb-4 flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 text-xs p-3 rounded-xl mb-4 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}

        {/* Form Submission */}
        {mode !== "register_verifying" ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Email Field (SignUp or ForgotPassword) */}
            {(mode === "register_email" || mode === "forgot_password") && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {isEn ? "REAL EMAIL ADDRESS" : "ALAMAT EMAIL ASLI"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isEn ? "your_email@domain.com" : "email_anda@domain.com"}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all font-mono"
                />
              </div>
            )}

            {/* Username Field (Login or complete register) */}
            {(mode === "login" || mode === "register_username") && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  {mode === "login" 
                    ? (isEn ? "USERNAME / EMAIL" : "USERNAME / EMAIL") 
                    : (isEn ? "NEW TRAINER USERNAME" : "USERNAME BARU")}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={mode === "login" 
                    ? (isEn ? "username or email" : "pilih_nama_unik atau email") 
                    : (isEn ? "unique_trainer_name" : "nama_unik_trainer")}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all font-mono"
                />
              </div>
            )}

            {/* Password Field (Login or SignUp) */}
            {(mode === "login" || mode === "register_email") && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  {isEn ? "PASSWORD" : "KATA SANDI (PASSWORD)"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all font-mono"
                />
              </div>
            )}

            {/* New Password Field (ResetPassword mode) */}
            {mode === "reset_password" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  {isEn ? "NEW PASSWORD" : "KATA SANDI BARU (NEW PASSWORD)"}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all font-mono"
                />
              </div>
            )}

            {/* Form Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl transition-all shadow-md shadow-yellow-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>{isEn ? "Processing server..." : "Memproses server..."}</span>
              ) : (
                <>
                  <span>
                    {mode === "login" && (isEn ? "LOG IN NOW" : "MASUK SEKARANG")}
                    {mode === "register_email" && (isEn ? "SEND EMAIL VERIFICATION" : "KIRIM VERIFIKASI EMAIL")}
                    {mode === "register_username" && (isEn ? "COMPLETE REGISTRATION" : "SELESAIKAN PENDAFTARAN")}
                    {mode === "forgot_password" && (isEn ? "SEND RESET LINK" : "KIRIM LINK RESET PASSWORD")}
                    {mode === "reset_password" && (isEn ? "SAVE NEW PASSWORD" : "SIMPAN SANDI BARU")}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {mode === "login" && (
              <div className="flex flex-col gap-2.5 mt-1">
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    {isEn ? "or sign in with" : "atau masuk dengan"}
                  </span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold py-2.5 px-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm text-xs disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isEn ? "Sign in with Google" : "Masuk dengan Google"}</span>
                </button>
              </div>
            )}
          </form>
        ) : (
          /* Register Verifying Mode - interactive and beautiful simulation portal */
          <div className="flex flex-col gap-5 p-5 bg-slate-950/60 rounded-2xl border border-yellow-500/20 text-center">
            <div className="relative mx-auto">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                <Mail className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">
                {isEn ? "Waiting for Verification" : "Menunggu Verifikasi"}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {isEn ? (
                  <>Verification link has been sent to <strong className="text-yellow-400">{email}</strong>. Use the simulator button below to simulate clicking the email link.</>
                ) : (
                  <>Tautan verifikasi telah terkirim secara virtual ke <strong className="text-yellow-400">{email}</strong>. Gunakan simulator di bawah untuk menyimulasikan konfirmasi link email.</>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setSuccess(null);
                  try {
                    const res = await fetch(`/api/auth/verify?token=${token}`);
                    if (res.ok) {
                      setSuccess(isEn ? "Email verified successfully! 🎉" : "Email Anda berhasil diverifikasi! 🎉");
                      setTimeout(() => {
                        setMode("register_username");
                        setSuccess(null);
                      }, 1500);
                    } else {
                      throw new Error(isEn ? "Verification failed." : "Gagal melakukan verifikasi.");
                    }
                  } catch (err: any) {
                    setError(err.message || (isEn ? "Failed to verify email." : "Gagal memverifikasi email."));
                  }
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-md shadow-yellow-500/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                {isEn ? "SIMULATE EMAIL LINK CLICK ✉️" : "SIMULASIKAN KLIK LINK VERIFIKASI ✉️"}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setSuccess(null);
                  try {
                    const res = await fetch(`/api/auth/check-verification?token=${token}`);
                    const data = await res.json();
                    if (data.verified) {
                      setSuccess(isEn ? "Verification detected!" : "Verifikasi sukses dideteksi!");
                      setTimeout(() => {
                        setMode("register_username");
                        setSuccess(null);
                      }, 1200);
                    } else {
                      setError(isEn ? "Email not verified yet. Please click the simulation button above." : "Email belum diverifikasi. Silakan klik tombol simulasi di atas.");
                    }
                  } catch (err) {
                    setError(isEn ? "Failed to check verification status." : "Gagal memeriksa status verifikasi.");
                  }
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {isEn ? "CHECK VERIFICATION STATUS" : "CEK STATUS VERIFIKASI"}
              </button>
            </div>
          </div>
        )}

        {/* Switch auth mode footer */}
        <div className="mt-5 text-center text-xs flex flex-col gap-2.5">
          {mode === "login" && (
            <>
              <div className="text-slate-500">
                {isEn ? "Don't have an account? " : "Belum memiliki akun? "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register_email");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-yellow-500 hover:text-yellow-400 font-bold underline cursor-pointer"
                >
                  {isEn ? "Register New Account" : "Daftar Akun Baru"}
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot_password");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-slate-400 hover:text-slate-300 font-bold underline cursor-pointer"
                >
                  {isEn ? "Forgot Password?" : "Lupa Kata Sandi?"}
                </button>
              </div>
            </>
          )}

          {(mode === "register_email" || mode === "forgot_password" || mode === "register_verifying" || mode === "register_username" || mode === "reset_password") && (
            <div className="text-slate-500">
              {isEn ? "Already have an account? " : "Sudah memiliki akun? "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-yellow-500 hover:text-yellow-400 font-bold underline cursor-pointer"
              >
                {isEn ? "Back to Login" : "Halaman Login"}
              </button>
            </div>
          )}
        </div>

        {/* Bonus modal badge */}
        {mode === "register_email" && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] text-amber-400/80 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{isEn ? "Bonus 100 Initial Points immediately after registration!" : "Bonus 100 Poin modal awal langsung setelah mendaftar!"}</span>
          </div>
        )}
      </div>

      {/* Render Legal Pages Modal */}
      <LegalPagesModal
        isOpen={showLegalModal}
        initialTab={legalModalTab}
        onClose={() => setShowLegalModal(false)}
      />
    </div>
  );
};
