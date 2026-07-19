import { useState, useEffect, useRef } from "react";
import { User, Capture, Card, Mission } from "./types";
import { AuthForm } from "./components/AuthForm";
import { VirtualCamera } from "./components/VirtualCamera";
import { ForgingStation } from "./components/ForgingStation";
import { GalleryView } from "./components/GalleryView";
import { CardMissions } from "./components/CardMissions";
import { ArenaView } from "./components/ArenaView";
import { LeaderboardView } from "./components/LeaderboardView";
import { CardTrading } from "./components/CardTrading";
import { GameGuide } from "./components/GameGuide";
import { AnimatedCounter } from "./components/AnimatedCounter";
import { useLanguage } from "./context/LanguageContext";
import { 
  Sparkles, 
  LogOut, 
  Gamepad2, 
  Camera, 
  FolderHeart, 
  Hammer, 
  HelpCircle, 
  User as UserIcon, 
  Smartphone, 
  Monitor, 
  Wifi, 
  Battery, 
  Clock,
  CircleDot,
  Volume2,
  VolumeX,
  Music,
  X,
  Swords,
  Trash2,
  Trophy,
  ArrowLeftRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { audio } from "./lib/audio";

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [mission, setMission] = useState<Mission | null>(null);
  const [resetCountdown, setResetCountdown] = useState<number>(0);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  // App navigation & layout toggles
  const [mobileTab, setMobileTab] = useState<"camera" | "gallery" | "profile" | "missions" | "arena" | "leaderboard" | "trading" | "guide">("camera");
  const [desktopView, setDesktopView] = useState<"album" | "trading">("album");
  const [showForgeModal, setShowForgeModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [bgmOn, setBgmOn] = useState<boolean>(false);

  const toggleBGM = () => {
    try {
      if (bgmOn) {
        audio.stopBGM();
        setBgmOn(false);
      } else {
        audio.startBGM();
        setBgmOn(true);
      }
    } catch (err) {
      console.warn("BGM initialization failed:", err);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      try {
        audio.stopBGM();
      } catch (e) {}
    };
  }, []);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Synchronize reset countdown with active mission state
  useEffect(() => {
    if (mission && mission.completed && mission.nextResetMs > 0) {
      setResetCountdown(mission.nextResetMs);
    } else {
      setResetCountdown(0);
    }
  }, [mission]);

  // Ticking countdown interval for daily mission resets
  useEffect(() => {
    if (resetCountdown <= 0) return;
    const interval = setInterval(() => {
      setResetCountdown((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          if (token) fetchProfile(token);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resetCountdown, token]);

  // Time formatting helper for HH:MM:SS format
  const formatResetTime = (ms: number) => {
    if (ms <= 0) return "00j 00m 00d";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(hours)}j ${pad(minutes)}m ${pad(seconds)}d`;
  };

  // Load session from local storage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("nekomon_token");
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Helper to update local backups
  const updateLocalBackup = (userObj: any, capturesList?: any[], cardsList?: any[]) => {
    if (!userObj || !userObj.username) return;
    try {
      const key = "nekomon_backup_users";
      const existingStr = localStorage.getItem(key);
      const backups = existingStr ? JSON.parse(existingStr) : {};
      
      const usernameKey = userObj.username.toLowerCase();
      const prevBackup = backups[usernameKey] || {};
      
      backups[usernameKey] = {
        user: { ...prevBackup.user, ...userObj },
        password: prevBackup.password || "",
        captures: capturesList !== undefined ? capturesList : (prevBackup.captures || []),
        cards: cardsList !== undefined ? cardsList : (prevBackup.cards || [])
      };
      
      localStorage.setItem(key, JSON.stringify(backups));
      localStorage.setItem("nekomon_active_username", userObj.username);
    } catch (e) {
      console.error("Gagal melakukan backup lokal di App.tsx:", e);
    }
  };

  // Fetch Profile & Gallery data
  const fetchProfile = async (sessionToken: string) => {
    try {
      let response = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });

      if (!response.ok) {
        // Ephemeral Server Reset Fallback Check:
        // If profile returned 401, check if we have a matching local backup to restore.
        try {
          const activeUsername = localStorage.getItem("nekomon_active_username");
          if (activeUsername) {
            const key = "nekomon_backup_users";
            const existingStr = localStorage.getItem(key);
            const backups = existingStr ? JSON.parse(existingStr) : {};
            const usernameKey = activeUsername.toLowerCase();
            const backup = backups[usernameKey];

            if (backup && backup.user) {
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
                // Retry profile fetch now that user is restored!
                response = await fetch("/api/user/profile", {
                  headers: { Authorization: `Bearer ${sessionToken}` },
                });
              }
            }
          }
        } catch (syncErr) {
          console.error("Error during auto-sync restore in fetchProfile:", syncErr);
        }
      }

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        if (data.mission) {
          setMission(data.mission);
        }
        updateLocalBackup(data.user);
        fetchGallery(sessionToken, data.user);
      } else {
        handleLogout();
      }
    } catch (e) {
      console.error("Gagal memuat profil:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGallery = async (sessionToken: string, currentUser?: any) => {
    try {
      const response = await fetch("/api/user/gallery", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        const capturesList = data.captures || [];
        const cardsList = data.cards || [];
        setCaptures(capturesList);
        setCards(cardsList);
        if (data.mission) {
          setMission(data.mission);
        }

        const activeUser = currentUser || userRef.current;
        if (activeUser) {
          updateLocalBackup(activeUser, capturesList, cardsList);
        }
      }
    } catch (e) {
      console.error("Gagal memuat galeri:", e);
    }
  };

  // Auth login/register callback
  const handleAuthSuccess = (newToken: string, userData: User) => {
    localStorage.setItem("nekomon_token", newToken);
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("nekomon_active_username", userData.username);
    updateLocalBackup(userData);
    fetchGallery(newToken, userData);
  };

  // Logout action
  const handleLogout = () => {
    localStorage.removeItem("nekomon_token");
    setToken(null);
    setUser(null);
    setCaptures([]);
    setCards([]);
    setShowForgeModal(false);
  };

  // Photo captured callback (+10 points)
  const handleCapture = async (base64Photo: string) => {
    if (!token) return;
    try {
      // Play retro captured chime!
      try {
        audio.playCaptureSound();
      } catch (e) {
        console.warn("Capture audio failed:", e);
      }

      const response = await fetch("/api/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photo: base64Photo }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update user points and captures list
        let updatedUser = user;
        if (user) {
          updatedUser = { ...user, points: data.points };
          setUser(updatedUser);
        }
        setCaptures((prev) => {
          const nextCaptures = [data.capture, ...prev];
          if (updatedUser) {
            updateLocalBackup(updatedUser, nextCaptures, cards);
          }
          return nextCaptures;
        });
        
        if (data.mission) {
          setMission(data.mission);
        }

        // Custom toast and audio feedback on capture and/or daily mission completion
        if (data.dailyBonusAwarded) {
          try {
            audio.playForgingSound(); // Play level up / victory chime
          } catch (e) {}
          setNotification({
            message: data.message || (language === "id"
              ? "Selamat! Misi Harian Selesai dan Anda mendapatkan +25 Poin! 🎉"
              : "Congratulations! Daily Mission Completed and you received +25 Points! 🎉"),
            type: "success"
          });
        } else {
          setNotification({
            message: language === "id"
              ? "Foto kucing berhasil tertangkap! +10 Poin ditambahkan. 📸"
              : "Cat photo successfully captured! +10 Points added. 📸",
            type: "success"
          });
        }

        // Auto-switch to gallery tab to review the new photo!
        setMobileTab("gallery");
      } else {
        const errorData = await response.json();
        setNotification({
          message: errorData.error || (language === "id"
            ? "Gagal menyimpan foto. Analisis mendeteksi bahwa ini bukan foto kucing asli."
            : "Failed to save photo. Analysis detected that this is not a real cat photo."),
          type: "error"
        });
      }
    } catch (err) {
      console.error("Error sending captured photo:", err);
      setNotification({
        message: language === "id"
          ? "Terjadi kesalahan koneksi saat mengirim foto."
          : "A connection error occurred while sending the photo.",
        type: "error"
      });
    }
  };

  // Delete captured photo from gallery callback
  const handleDeleteCapture = async (captureId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (!token) return { success: false, error: language === "id" ? "Silakan login terlebih dahulu." : "Please log in first." };
    try {
      const response = await fetch(`/api/captures/${captureId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Remove from captures state
        setCaptures((prev) => {
          const nextCaptures = prev.filter((c) => c.id !== captureId);
          if (user) {
            updateLocalBackup(user, nextCaptures, cards);
          }
          return nextCaptures;
        });
        return { success: true, message: data.message };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || (language === "id" ? "Gagal menghapus foto." : "Failed to delete photo.") };
      }
    } catch (err) {
      console.error("Error deleting capture:", err);
      return { success: false, error: language === "id" ? "Terjadi kesalahan koneksi ke server." : "A connection error occurred." };
    }
  };

  // Nekomon card forged callback
  const handleForgeSuccess = (newCard: Card, updatedPoints: number, updatedCores?: number, coresEarned?: number) => {
    let updatedUser = user;
    if (user) {
      updatedUser = { ...user, points: updatedPoints, cores: updatedCores ?? user.cores };
      setUser(updatedUser);
    }
    
    const updatedCards = [newCard, ...cards];
    setCards(updatedCards);

    // Update capture status to forged locally
    const updatedCaptures = captures.map((c) => 
      c.id === newCard.captureId ? { ...c, isForged: true } : c
    );
    setCaptures(updatedCaptures);

    if (updatedUser) {
      updateLocalBackup(updatedUser, updatedCaptures, updatedCards);
    }

    const coreCount = coresEarned || 1;
    setNotification({
      message: `Berhasil melakukan Forge! Kartu Nekomon ${newCard.name} (${newCard.rarity}) dilahirkan! Anda mendapat +${coreCount} Nekomon Core! 💎`,
      type: "success"
    });

    // Refresh the local captures list to mark the capture as forged
    if (token) fetchGallery(token, updatedUser);
  };

  // Nekomon card daily activity/mission success callback
  const handleActivitySuccess = (updatedCard: Card, updatedPoints: number) => {
    let updatedUser = user;
    if (user) {
      updatedUser = { ...user, points: updatedPoints };
      setUser(updatedUser);
    }
    
    const updatedCards = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
    setCards(updatedCards);
    
    if (updatedUser) {
      updateLocalBackup(updatedUser, captures, updatedCards);
    }
    
    // Refresh list of captures/cards just to ensure database sync
    if (token) fetchGallery(token, updatedUser);
  };

  // Callback triggered upon successful card trading
  const handleTradeCompleted = () => {
    if (token) {
      fetchProfile(token);
    }
  };

  // Destroy a forged Nekomon card and receive points back
  const handleDestroyCard = async (cardId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (!token) return { success: false, error: language === "id" ? "Silakan login terlebih dahulu." : "Please log in first." };
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update user points
        let updatedUser = user;
        if (user) {
          updatedUser = { ...user, points: data.points };
          setUser(updatedUser);
        }
        
        // Remove from local cards state
        const updatedCards = cards.filter((c) => c.id !== cardId);
        setCards(updatedCards);

        // Find the destroyed card to un-forge its capture locally
        const destroyedCard = cards.find((c) => c.id === cardId);
        let updatedCaptures = captures;
        if (destroyedCard && destroyedCard.captureId) {
          updatedCaptures = captures.map((c) => 
            c.id === destroyedCard.captureId ? { ...c, isForged: false } : c
          );
          setCaptures(updatedCaptures);
        }

        if (updatedUser) {
          updateLocalBackup(updatedUser, updatedCaptures, updatedCards);
        }

        // Refresh captures list
        fetchGallery(token, updatedUser);
        return { success: true, message: data.message };
      } else {
        const errData = await response.json();
        return { success: false, error: errData.error || (language === "id" ? "Gagal menghancurkan kartu." : "Failed to destroy card.") };
      }
    } catch (err) {
      console.error("Error destroying card:", err);
      return { success: false, error: language === "id" ? "Terjadi kesalahan koneksi ke server." : "A connection error occurred." };
    }
  };

  // Evolve a Nekomon card to a higher rarity and stronger stats
  const handleEvolveCard = async (cardId: string): Promise<{ success: boolean; message?: string; error?: string; card?: Card }> => {
    if (!token) return { success: false, error: language === "id" ? "Silakan login terlebih dahulu." : "Please log in first." };
    try {
      const response = await fetch(`/api/cards/${cardId}/evolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update user points and cores
        let updatedUser = user;
        if (user) {
          updatedUser = { ...user, points: data.points, cores: data.cores };
          setUser(updatedUser);
        }
        
        // Update the card in local state
        const updatedCards = cards.map((c) => (c.id === cardId ? data.card : c));
        setCards(updatedCards);

        if (updatedUser) {
          updateLocalBackup(updatedUser, captures, updatedCards);
        }
        return { success: true, message: data.message, card: data.card };
      } else {
        const errData = await response.json();
        return { success: false, error: errData.error || (language === "id" ? "Gagal melakukan evolusi kartu." : "Failed to evolve card.") };
      }
    } catch (err) {
      console.error("Error evolving card:", err);
      return { success: false, error: language === "id" ? "Terjadi kesalahan koneksi ke server." : "A connection error occurred." };
    }
  };

  // Cancel/Revert a Nekomon card evolution
  const handleCancelEvolution = async (cardId: string): Promise<{ success: boolean; message?: string; error?: string; card?: Card }> => {
    if (!token) return { success: false, error: language === "id" ? "Silakan login terlebih dahulu." : "Please log in first." };
    try {
      const response = await fetch(`/api/cards/${cardId}/cancel-evolution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update user points and cores
        let updatedUser = user;
        if (user) {
          updatedUser = { ...user, points: data.points, cores: data.cores };
          setUser(updatedUser);
        }
        
        // Update the card in local state
        const updatedCards = cards.map((c) => (c.id === cardId ? data.card : c));
        setCards(updatedCards);

        if (updatedUser) {
          updateLocalBackup(updatedUser, captures, updatedCards);
        }
        return { success: true, message: data.message, card: data.card };
      } else {
        const errData = await response.json();
        return { success: false, error: errData.error || (language === "id" ? "Gagal membatalkan evolusi kartu." : "Failed to cancel card evolution.") };
      }
    } catch (err) {
      console.error("Error cancelling evolution:", err);
      return { success: false, error: language === "id" ? "Terjadi kesalahan koneksi ke server." : "A connection error occurred." };
    }
  };

  // Navigation shortcut to forge from specific capture item
  const handleSelectForge = (capture: Capture) => {
    setShowForgeModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start overflow-x-hidden pb-12 font-sans relative">
      
      {/* Spectacular Pastel Fantasy Cosmic Grid Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/40 via-slate-950 to-orange-950/30 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 z-0 pointer-events-none" />

      {/* Header section with bubble Nekomon title */}
      <header className="w-full max-w-7xl px-4 py-6 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2">
          {/* Logo element with custom visual ears design */}
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-500 to-pink-500 rounded-full blur opacity-45 group-hover:opacity-75 transition duration-500" />
            <div className="relative w-12 h-12 bg-slate-900 border-2 border-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🐱</span>
            </div>
            {/* Left and right floating ear markers for cartoon pokemon style */}
            <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-yellow-400 rounded-tl-full border border-slate-950 rotate-[-15deg]" />
            <div className="absolute -top-1 -right-1.5 w-4 h-4 bg-yellow-400 rounded-tr-full border border-slate-950 rotate-[15deg]" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-amber-300 to-pink-400 font-sans select-none drop-shadow-md">
              NEKOMON
            </h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Mobile Card Companion</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-[10px] font-black font-mono shadow-md select-none shrink-0">
            <button
              onClick={() => setLanguage("id")}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg transition-all cursor-pointer ${
                language === "id"
                  ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Bahasa Indonesia"
            >
              ID
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg transition-all cursor-pointer ${
                language === "en"
                  ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* User login stats or general status */}
          {user ? (
            <div className="flex items-center gap-2.5 sm:gap-4 bg-slate-900/80 border border-slate-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-md max-w-[200px] sm:max-w-none">
              <div className="flex flex-col text-right font-mono text-[10px] sm:text-xs min-w-0">
                <span className="text-slate-400 font-bold truncate">@{user.username}</span>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-0.5 mt-0.5 leading-none sm:leading-normal">
                  <span className="text-yellow-500 font-extrabold flex items-center justify-end gap-1 shrink-0">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse text-yellow-400" />
                    <AnimatedCounter value={user.points} suffix="PTS" />
                  </span>
                  <span className="hidden sm:inline text-slate-600">•</span>
                  <span className="text-teal-400 font-extrabold flex items-center justify-end gap-1 shrink-0">
                    <CircleDot className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-400" />
                    <AnimatedCounter value={user.cores || 0} suffix="CORE" />
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2 bg-slate-800 hover:bg-red-900 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer shrink-0"
                title="Keluar Game"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
              <span>Server: ONLINE</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
          )}
        </div>
      </header>

      {/* Main Container logic */}
      <main className="w-full max-w-7xl px-4 z-10 relative flex-1 flex flex-col justify-center items-center mt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <CircleDot className="w-10 h-10 text-yellow-500 animate-spin" />
            <span className="text-sm font-mono text-slate-400 uppercase tracking-widest">
              {language === "id" ? "Memulai Mesin Nekomon..." : "Starting Nekomon Engine..."}
            </span>
          </div>
        ) : !user ? (
          /* Landing Screen / Login portal with full-page visual card-game branding */
          <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-10 py-8">
            <div className="flex-1 max-w-lg text-left flex flex-col gap-5">
              <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold font-mono text-xs w-max uppercase tracking-wider">
                {language === "id" ? "🌌 CARD GAME BERBASIS KUCING ASLI" : "🌌 REAL CAT BASED CARD GAME"}
              </span>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-100 tracking-tight leading-none font-sans">
                {language === "id" ? (
                  <>TANGKAP KUCING ASLI, FORGE MENJADI <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-300">NEKOMON ANIME!</span></>
                ) : (
                  <>CAPTURE REAL CATS, FORGE INTO <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-300">NEKOMON ANIME!</span></>
                )}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t("header.desc")}
              </p>
              
              <div className="grid grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-900 text-xs font-mono text-slate-400">
                <div>
                  <div className="text-yellow-500 font-bold mb-1">
                    {language === "id" ? "🔥 100 POIN AWAL" : "🔥 100 INITIAL POINTS"}
                  </div>
                  {language === "id" 
                    ? "Dapatkan modal melimpah langsung sesaat setelah mendaftar pertama kali."
                    : "Get an abundant starting balance immediately upon registering for the first time."}
                </div>
                <div>
                  <div className="text-pink-400 font-bold mb-1">⚡ FORGE TO CARD</div>
                  {language === "id"
                    ? "Pilih tipe elemen: Api, Air, Tanah, Angin, atau Petir berkekuatan khusus."
                    : "Choose element types: Fire, Water, Earth, Wind, or Lightning with special powers."}
                </div>
              </div>
            </div>

            <div className="w-full max-w-md">
              <AuthForm onSuccess={handleAuthSuccess} />
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard Game Area (Simple & Dynamic Full-Width Layout) */
          <div className="w-full flex flex-col gap-6 py-4">
            
            {/* Unified Navigation Tab Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-xl w-full">
              {/* Profile Overview Card */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                  🎒
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-200">@{user.username}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                    <span className="text-yellow-500 font-bold">
                      <AnimatedCounter value={user.points} suffix={t("common.points").toUpperCase()} />
                    </span>
                    <span>•</span>
                    <span className="text-teal-400 font-bold">
                      <AnimatedCounter value={user.cores || 0} suffix={t("common.cores").toUpperCase()} />
                    </span>
                    <span>•</span>
                    <span className="text-pink-400 font-bold">
                      <AnimatedCounter value={cards.length} suffix={t("nav.gallery").toUpperCase()} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Game Tab List */}
              <div className="flex flex-wrap bg-slate-950 p-1 border border-slate-800 rounded-xl gap-1 select-none">
                {(
                  [
                    { id: "camera", label: t("nav.camera"), icon: Camera },
                    { id: "gallery", label: t("nav.gallery"), icon: FolderHeart },
                    { id: "arena", label: t("nav.arena"), icon: Swords },
                    { id: "missions", label: t("nav.missions"), icon: Gamepad2 },
                    { id: "trading", label: t("nav.trading"), icon: ArrowLeftRight },
                    { id: "leaderboard", label: t("nav.leaderboard"), icon: Trophy },
                    { id: "guide", label: t("nav.guide"), icon: HelpCircle },
                    { id: "profile", label: t("nav.profile"), icon: UserIcon }
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setMobileTab(tab.id);
                        setShowForgeModal(false);
                      }}
                      className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg font-black text-[10px] tracking-wider transition-all cursor-pointer ${
                        mobileTab === tab.id
                          ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-md shadow-yellow-500/10"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full">
              <AnimatePresence mode="wait">
                {mobileTab === "camera" && (
                  <motion.div
                    key="camera-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6"
                  >
                    <div className="border-b border-slate-800 pb-4">
                      <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-yellow-500" />
                        {t("camera.title")}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t("camera.desc")}
                      </p>
                    </div>

                    <div className="max-w-xl mx-auto w-full">
                      <VirtualCamera
                        onCapture={handleCapture}
                        userPoints={user.points}
                      />
                    </div>
                  </motion.div>
                )}

                {mobileTab === "gallery" && (
                  <motion.div
                    key="gallery-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6"
                  >
                    {showForgeModal ? (
                      <div className="relative">
                        <ForgingStation
                          captures={captures}
                          userPoints={user.points}
                          onForgeSuccess={handleForgeSuccess}
                          onClose={() => setShowForgeModal(false)}
                        />
                        <button
                          onClick={() => setShowForgeModal(false)}
                          className="absolute top-6 right-6 text-slate-400 hover:text-slate-100 p-1.5 rounded-xl bg-slate-800 border border-slate-700 transition-all cursor-pointer font-mono text-xs uppercase font-bold"
                        >
                          {language === "id" ? "Batal Forging" : "Cancel Forging"}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
                          <div>
                            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                              <FolderHeart className="w-5 h-5 text-pink-400" />
                              {t("gallery.title")}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {t("gallery.desc")}
                            </p>
                          </div>

                          <button
                            onClick={() => setShowForgeModal(true)}
                            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-yellow-500/10 cursor-pointer"
                          >
                            <Hammer className="w-4 h-4" />
                            {language === "id" ? "FORGE KARTU BARU (-50 Poin)" : "FORGE NEW CARD (-50 Points)"}
                          </button>
                        </div>

                        {/* Daily Mission Bento Card inside Gallery */}
                        {mission && (
                          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mission.completed ? 'bg-yellow-500/15 border border-yellow-500/30' : 'bg-slate-900 border border-slate-800'}`}>
                                <Sparkles className={`w-5 h-5 ${mission.completed ? 'text-yellow-400 animate-bounce' : 'text-slate-500'}`} />
                              </div>
                              <div>
                                <h3 className="font-extrabold text-xs text-slate-200 tracking-wide font-mono flex items-center gap-2">
                                  {language === "id" ? "MISI HARIAN NEKOMON" : "NEKOMON DAILY MISSION"}
                                  {mission.completed && (
                                    <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                                      {language === "id" ? "SELESAI" : "COMPLETED"}
                                    </span>
                                  )}
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {language === "id" ? (
                                    <>
                                      Tangkap minimal 5 kucing dalam kurun waktu 24 jam untuk klaim <span className="text-yellow-400 font-extrabold">25 Poin Bonus</span>!
                                    </>
                                  ) : (
                                    <>
                                      Capture at least 5 cats within a 24-hour window to claim <span className="text-yellow-400 font-extrabold">25 Bonus Points</span>!
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 w-full md:w-48 text-right shrink-0">
                              <div className="flex justify-between items-baseline text-[10px] font-mono">
                                <span className="text-slate-500 text-[9px] uppercase">
                                  {language === "id" ? "Progres Tangkapan" : "Capture Progress"}
                                </span>
                                <span className="font-extrabold text-slate-200 text-xs">
                                  {mission.progress} / {mission.target}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(mission.progress / mission.target) * 100}%` }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                  className={`h-full rounded-full ${mission.completed ? 'bg-gradient-to-r from-yellow-500 to-amber-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                                />
                              </div>
                              <span className="text-[9px] font-mono text-slate-500 mt-0.5 block">
                                {mission.completed 
                                  ? `${language === "id" ? "Resets dalam:" : "Resets in:"} ${formatResetTime(resetCountdown)}`
                                  : (language === "id" ? "Sliding 24 jam terhitung mundur" : "Sliding 24 hours countdown")
                                }
                              </span>
                            </div>
                          </div>
                        )}

                        <GalleryView
                          captures={captures}
                          cards={cards}
                          onSelectForge={handleSelectForge}
                          onDestroyCard={handleDestroyCard}
                          onDeleteCapture={handleDeleteCapture}
                          onEvolveCard={handleEvolveCard}
                          onCancelEvolution={handleCancelEvolution}
                          user={user}
                        />
                      </>
                    )}
                  </motion.div>
                )}

                {mobileTab === "arena" && (
                  <motion.div
                    key="arena-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6"
                  >
                    <div className="border-b border-slate-800 pb-4">
                      <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                        <Swords className="w-5 h-5 text-yellow-500 animate-pulse" />
                        {t("arena.title")}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t("arena.desc")}
                      </p>
                    </div>

                    <ArenaView
                      cards={cards}
                      token={token || ""}
                      onBattleEndRefresh={() => {
                        if (token) {
                          fetchProfile(token);
                          fetchGallery(token);
                        }
                      }}
                    />
                  </motion.div>
                )}

                {mobileTab === "missions" && (
                  <motion.div
                    key="missions-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6"
                  >
                    <div className="border-b border-slate-800 pb-4">
                      <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-teal-400" />
                        {t("missions.title")}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t("missions.desc")}
                      </p>
                    </div>

                    <CardMissions
                      cards={cards}
                      token={token || ""}
                      onActivitySuccess={handleActivitySuccess}
                    />
                  </motion.div>
                )}

                {mobileTab === "trading" && (
                  <motion.div
                    key="trading-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6"
                  >
                    <div className="border-b border-slate-800 pb-4">
                      <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                        <ArrowLeftRight className="w-5 h-5 text-yellow-500" />
                        {t("trading.title")}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t("trading.desc")}
                      </p>
                    </div>

                    <CardTrading
                      userCards={cards}
                      token={token || ""}
                      onTradeCompleted={handleTradeCompleted}
                    />
                  </motion.div>
                )}

                {mobileTab === "leaderboard" && (
                  <motion.div
                    key="leaderboard-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6"
                  >
                    <div className="border-b border-slate-800 pb-4">
                      <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        {t("leaderboard.title")}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t("leaderboard.desc")}
                      </p>
                    </div>

                    <LeaderboardView
                      currentUser={user}
                      token={token || ""}
                    />
                  </motion.div>
                )}

                {mobileTab === "profile" && (
                  <motion.div
                    key="profile-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6 max-w-2xl mx-auto w-full font-mono"
                  >
                    <div className="border-b border-slate-800 pb-4">
                      <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-yellow-500" />
                        {language === "id" ? "DETAIL AKUN PEMAIN" : "PLAYER ACCOUNT DETAILS"}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {language === "id" 
                          ? "Kelola data profil, skor, dan status keanggotaan trainer Nekomon Anda." 
                          : "Manage profile data, score, and membership status of your Nekomon trainer."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                        <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-yellow-500/30 flex items-center justify-center text-3xl">
                          🎒
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-slate-100">@{user.username}</h3>
                          <span className="text-xs text-slate-500 block">{user.email}</span>
                          <span className="text-[10px] text-yellow-500 mt-1 block uppercase font-bold">
                            {language === "id" 
                              ? `Trainer level ${Math.max(1, Math.floor(cards.length / 2) + 1)}` 
                              : `Trainer Level ${Math.max(1, Math.floor(cards.length / 2) + 1)}`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-1">
                            {language === "id" ? "TOTAL POIN" : "TOTAL POINTS"}
                          </span>
                          <span className="font-black text-yellow-500 text-sm">{user.points} PTS</span>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-1">
                            {language === "id" ? "NEKOMON CORE" : "NEKOMON CORES"}
                          </span>
                          <span className="font-black text-teal-400 text-sm">{user.cores || 0} CORE</span>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-1">
                            {language === "id" ? "KARTU DEK" : "DECK CARDS"}
                          </span>
                          <span className="font-black text-pink-400 text-sm">{cards.length} PCS</span>
                        </div>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full bg-red-950/40 hover:bg-red-950 text-red-200 hover:text-red-100 font-bold py-3 px-4 rounded-xl text-xs transition-all border border-red-900/30 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        {language === "id" ? "Keluar dari Game (Logout)" : "Log Out of Game"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {mobileTab === "guide" && (
                  <motion.div
                    key="guide-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="w-full"
                  >
                    <GameGuide />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}
      </main>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-55 max-w-sm w-11/12 bg-slate-900/95 backdrop-blur-md border rounded-2xl p-4 shadow-2xl flex items-start gap-3 transition-all ${
              notification.type === "error" 
                ? "border-rose-500/50 shadow-rose-950/10" 
                : "border-yellow-500/50 shadow-yellow-950/10"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0 ${
              notification.type === "error" ? "bg-rose-500/10 text-rose-400" : "bg-yellow-500/15"
            }`}>
              {notification.type === "error" ? "❌" : (notification.message.includes("Misi") ? "🏆" : "📸")}
            </div>
            <div className="flex-1">
              <h4 className={`font-extrabold text-xs uppercase tracking-wider font-mono ${
                notification.type === "error" ? "text-rose-400" : "text-yellow-400"
              }`}>
                {notification.type === "error" ? "Sistem Nekomon" : "Pemberitahuan"}
              </h4>
              <p className="text-xs text-slate-100 mt-1 font-sans font-medium leading-relaxed">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-100 p-0.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Audio Soundtrack Controller Button (Moved to bottom right for mobile friendliness) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleBGM}
          className={`flex items-center justify-center w-12 h-12 rounded-full border shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95 group relative ${
            bgmOn 
              ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 border-yellow-400" 
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
          title={bgmOn ? "Matikan Musik BGM" : "Mainkan Musik BGM"}
        >
          {bgmOn ? (
            <>
              <Volume2 className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
            </>
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
          {/* Tooltip on hover */}
          <span className="absolute right-14 bg-slate-900/95 text-slate-200 text-[10px] font-bold font-mono px-2 py-1 rounded-lg border border-slate-850 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
            {bgmOn ? "BGM: AKTIF" : "BGM: MATI"}
          </span>
        </button>
      </div>

    </div>
  );
}
