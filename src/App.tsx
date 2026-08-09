import { useState, useEffect, useRef } from "react";
import { User, Capture, Card, Mission, NekomonSpot } from "./types";
import { AuthForm } from "./components/AuthForm";
import { VirtualCamera } from "./components/VirtualCamera";
import { NekomonSpotMap } from "./components/NekomonSpotMap";
import { ForgingStation } from "./components/ForgingStation";
import { GalleryView } from "./components/GalleryView";
import { CardMissions } from "./components/CardMissions";
import { ArenaView } from "./components/ArenaView";
import { LeaderboardView } from "./components/LeaderboardView";
import { CardTrading } from "./components/CardTrading";
import { GameGuide } from "./components/GameGuide";
import { AnimatedCounter } from "./components/AnimatedCounter";
import { ShopView } from "./components/ShopView";
import { DailyLoginModal } from "./components/DailyLoginModal";
import { NekomonDex } from "./components/NekomonDex";
import { InterstitialAdModal } from "./components/InterstitialAdModal";
import { RewardedAdModal } from "./components/RewardedAdModal";
import { AchievementShareModal } from "./components/AchievementShareModal";
import { NekomonCard } from "./components/NekomonCard";
import { getAnimeNekomonSpeciesArtwork } from "./data/nekomonSpeciesData";
import { useLanguage } from "./context/LanguageContext";

const nekomonLogoImg = new URL("./assets/images/nekomon_logo_official_1786260255520.jpg", import.meta.url).href;
const nekomonBottomBannerImg = new URL("./assets/images/bottom.png", import.meta.url).href;
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
  Eye,
  Swords,
  Trash2,
  Trophy,
  ArrowLeftRight,
  ShoppingBag,
  Gift,
  Tv,
  BookOpen,
  Coins,
  Flame,
  Share2,
  Users,
  Layers,
  MapPin,
  Edit3,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { audio } from "./lib/audio";
import { PLAYER_BADGES, getTrainerLevel, getHighestBadge, PlayerBadge } from "./lib/badges";

// Example showcase cards for landing page visual presentation (AI Forging Results)
const SHOWCASE_CARDS: Card[] = [
  {
    id: "showcase_sentinel_1",
    userId: "showcase",
    captureId: "showcase_c1",
    name: "Lumina Aetheria",
    element: "Air",
    style: "Sentinel",
    rarity: "Legend",
    level: 15,
    hp: 240,
    atk: 110,
    def: 88,
    spd: 95,
    skillName: "Nyanyian Samudra Aetheria",
    skillDesc: "Memancarkan aura penyembuh magis suci dan menyemburkan ombak air jernih dari Faksi Sentinel.",
    imageUrl: getAnimeNekomonSpeciesArtwork("Lumina Aetheria", "Air", "Sentinel", "Legend"),
    geminiUsed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "showcase_scourge_1",
    userId: "showcase",
    captureId: "showcase_c2",
    name: "Shadowclaw Cyber-Ignis",
    element: "Api",
    style: "Scourge",
    rarity: "Mythic",
    level: 20,
    hp: 280,
    atk: 145,
    def: 92,
    spd: 110,
    skillName: "Tebasan Cakar Cyberpunk",
    skillDesc: "Menerjang dari bayangan kota cyberpunk dengan kecepatan suara, membakar musuh dengan tebasan Faksi Scourge.",
    imageUrl: getAnimeNekomonSpeciesArtwork("Shadowclaw Cyber-Ignis", "Api", "Scourge", "Mythic"),
    geminiUsed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "showcase_sentinel_2",
    userId: "showcase",
    captureId: "showcase_c3",
    name: "Gaiadon Terra-Guard",
    element: "Tanah",
    style: "Sentinel",
    rarity: "Epic",
    level: 14,
    hp: 310,
    atk: 98,
    def: 140,
    spd: 72,
    skillName: "Benteng Perisai Kristal",
    skillDesc: "Membangun perisai kristal bumi tak menembus dari Faksi Sentinel yang meregenerasi HP dan memantulkan serangan balik.",
    imageUrl: getAnimeNekomonSpeciesArtwork("Gaiadon Terra-Guard", "Tanah", "Sentinel", "Epic"),
    geminiUsed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "showcase_scourge_2",
    userId: "showcase",
    captureId: "showcase_c4",
    name: "Voltron Fulgur-Strike",
    element: "Petir",
    style: "Scourge",
    rarity: "Legend",
    level: 18,
    hp: 220,
    atk: 155,
    def: 75,
    spd: 135,
    skillName: "Kilat Petir Plasma Zero",
    skillDesc: "Menembakkan petir plasma kecepatan tinggi dari Faksi Scourge yang melumpuhkan gerakan musuh dan meningkatkan Crit Rate +50%.",
    imageUrl: getAnimeNekomonSpeciesArtwork("Voltron Fulgur-Strike", "Petir", "Scourge", "Legend"),
    geminiUsed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "showcase_sentinel_3",
    userId: "showcase",
    captureId: "showcase_c5",
    name: "Boreas Skydancer",
    element: "Angin",
    style: "Sentinel",
    rarity: "Mythic",
    level: 19,
    hp: 235,
    atk: 138,
    def: 82,
    spd: 148,
    skillName: "Badai Angin Surgawi",
    skillDesc: "Menari di udara menciptakan angin puyuh surgawi yang meningkatkan kecepatan seluruh tim sebesar +40%.",
    imageUrl: getAnimeNekomonSpeciesArtwork("Boreas Skydancer", "Angin", "Sentinel", "Mythic"),
    geminiUsed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "showcase_scourge_3",
    userId: "showcase",
    captureId: "showcase_c6",
    name: "Obsidian Fang",
    element: "Tanah",
    style: "Scourge",
    rarity: "Epic",
    level: 16,
    hp: 295,
    atk: 125,
    def: 130,
    spd: 80,
    skillName: "Gigitan Magma Obsidian",
    skillDesc: "Melapisi taring dengan batuan magma magis purba yang menghancurkan pertahanan musuh hingga 35%.",
    imageUrl: getAnimeNekomonSpeciesArtwork("Obsidian Fang", "Tanah", "Scourge", "Epic"),
    geminiUsed: true,
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [mission, setMission] = useState<Mission | null>(null);
  const [resetCountdown, setResetCountdown] = useState<number>(0);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  
  // Public community statistics for landing page
  const [publicStats, setPublicStats] = useState<{ totalPlayers: number; totalCards: number }>({
    totalPlayers: 142,
    totalCards: 680,
  });
  const [showcaseFaction, setShowcaseFaction] = useState<"all" | "Sentinel" | "Scourge">("all");
  const [isBottomBannerZoomed, setIsBottomBannerZoomed] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/public/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPublicStats({
            totalPlayers: data.totalPlayers || 142,
            totalCards: data.totalCards || 680,
          });
        }
      })
      .catch(() => {});
  }, []);
  
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  // App navigation & layout toggles
  const [mobileTab, setMobileTab] = useState<"camera" | "spot_map" | "gallery" | "dex" | "profile" | "missions" | "arena" | "leaderboard" | "trading" | "guide" | "shop">("spot_map");
  const [desktopView, setDesktopView] = useState<"album" | "trading">("album");
  const [showForgeModal, setShowForgeModal] = useState<boolean>(false);
  const [showDailyBonusModal, setShowDailyBonusModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [bgmOn, setBgmOn] = useState<boolean>(false);
  const [activeSpotToCapture, setActiveSpotToCapture] = useState<NekomonSpot | null>(null);

  // Ads Simulation State (AdMob & Unity Ads)
  const [showInterstitialAd, setShowInterstitialAd] = useState<boolean>(false);
  const [pendingTab, setPendingTab] = useState<"camera" | "spot_map" | "gallery" | "dex" | "profile" | "missions" | "arena" | "leaderboard" | "trading" | "guide" | "shop" | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [interstitialFreq, setInterstitialFreq] = useState<"random" | "always" | "off">("random");

  const [showRewardedAdModal, setShowRewardedAdModal] = useState<boolean>(false);
  const [rewardedAdType, setRewardedAdType] = useState<"points_50" | "cores_5" | "standard">("standard");

  // Achievement Share & Level Up Modal State
  const [achievementModalData, setAchievementModalData] = useState<{
    isOpen: boolean;
    type: "level_up" | "badge_unlocked" | "inspect";
    trainerLevel: number;
    badge: PlayerBadge | null;
  }>({
    isOpen: false,
    type: "badge_unlocked",
    trainerLevel: 1,
    badge: null
  });

  const totalCardLevels = cards.reduce((sum, c) => sum + (c.level || 1), 0);
  const currentTrainerLv = user ? getTrainerLevel(cards.length, totalCardLevels, user.points) : 1;

  const prevTrainerLvRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) {
      prevTrainerLvRef.current = null;
      return;
    }

    if (prevTrainerLvRef.current === null) {
      prevTrainerLvRef.current = currentTrainerLv;
    } else if (currentTrainerLv > prevTrainerLvRef.current) {
      const oldLv = prevTrainerLvRef.current;
      prevTrainerLvRef.current = currentTrainerLv;

      const newBadge = PLAYER_BADGES.find(b => currentTrainerLv >= b.levelRequirement && oldLv < b.levelRequirement);

      try { audio.playVictory(); } catch (e) {}

      const highestB = newBadge || getHighestBadge(currentTrainerLv);
      setAchievementModalData({
        isOpen: true,
        type: newBadge ? "badge_unlocked" : "level_up",
        trainerLevel: currentTrainerLv,
        badge: highestB
      });

      setNotification({
        message: newBadge 
          ? (language === "id"
              ? `🎉 SELAMAT! Trainer Level Up ke Lv.${currentTrainerLv} & Lencana "${newBadge.badgeNameId}" Terbuka! 🏆`
              : `🎉 CONGRATS! Trainer Leveled Up to Lv.${currentTrainerLv} & "${newBadge.badgeNameEn}" Badge Unlocked! 🏆`)
          : (language === "id"
              ? `⚡ SELAMAT! Trainer Level Up ke Level ${currentTrainerLv}! 🌟`
              : `⚡ CONGRATS! Trainer Leveled Up to Level ${currentTrainerLv}! 🌟`),
        type: "success"
      });
    }
  }, [user, currentTrainerLv, language]);

  const handleTabChange = (targetTab: "camera" | "spot_map" | "gallery" | "dex" | "profile" | "missions" | "arena" | "leaderboard" | "trading" | "guide" | "shop") => {
    if (targetTab === mobileTab) return;
    setShowForgeModal(false);

    const newCount = tabSwitchCount + 1;
    setTabSwitchCount(newCount);

    let triggerAd = false;
    if (interstitialFreq === "always") {
      triggerAd = true;
    } else if (interstitialFreq === "random") {
      // Triggers randomly after at least 1 switch (approx 35% probability)
      if (newCount >= 2 && Math.random() < 0.35) {
        triggerAd = true;
      }
    }

    if (triggerAd) {
      setPendingTab(targetTab);
      setShowInterstitialAd(true);
    } else {
      setMobileTab(targetTab);
    }
  };

  const handleCloseInterstitial = () => {
    setShowInterstitialAd(false);
    if (pendingTab) {
      setMobileTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleOpenRewardedAd = (type: "points_50" | "cores_5" | "standard" = "standard") => {
    setRewardedAdType(type);
    setShowRewardedAdModal(true);
  };

  const handleRewardClaimed = (updatedUser: any, rewardMsg: string) => {
    if (updatedUser) {
      setUser(prev => prev ? { ...prev, points: updatedUser.points, cores: updatedUser.cores } : updatedUser);
    }
    setNotification({
      message: rewardMsg,
      type: "success"
    });
  };

  const hasCheckedDailyBonus = useRef<boolean>(false);

  useEffect(() => {
    if (user && !hasCheckedDailyBonus.current) {
      hasCheckedDailyBonus.current = true;
      const lastClaimTs = localStorage.getItem("nekomon_daily_login_last_claim_v2");
      const lastTime = lastClaimTs ? parseInt(lastClaimTs, 10) : 0;
      const now = Date.now();
      const twentyHoursMs = 20 * 60 * 60 * 1000;
      if (!lastTime || (now - lastTime) >= twentyHoursMs) {
        setTimeout(() => {
          setShowDailyBonusModal(true);
        }, 1200);
      }
    }
  }, [user]);

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

  // Helper to update local backups safely with progressive quota protection
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
      
      // Progressive sanitizer to reduce payload size when storage quota is reached
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
              entry.cards = entry.cards.map((card: any) => ({
                ...card,
                imageUrl: mode === 0 && (!card.imageUrl?.startsWith("data:") || card.imageUrl.length < 30000) ? card.imageUrl : ""
              }));
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
            // Silently ignore quota limits for non-critical local backup
          }
        }
      }

      try {
        localStorage.setItem("nekomon_active_username", userObj.username);
      } catch {
        // Silently handle storage limits
      }
    } catch {
      // Ignore backup errors gracefully
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
              }).catch(() => null);

              if (syncResponse && syncResponse.ok) {
                // Retry profile fetch now that user is restored!
                response = await fetch("/api/user/profile", {
                  headers: { Authorization: `Bearer ${sessionToken}` },
                }).catch(() => response);
              }
            }
          }
        } catch (syncErr) {
          console.warn("Auto-sync notice in fetchProfile:", syncErr);
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

  // Photo captured callback (+10 points base + optional spot bonus)
  const handleCapture = async (base64Photo: string) => {
    if (!token) return;
    const currentSpot = activeSpotToCapture;
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
        body: JSON.stringify({ 
          photo: base64Photo,
          spotBonus: currentSpot ? currentSpot.bonusPoints : undefined,
          spotName: currentSpot ? currentSpot.name : undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (currentSpot) {
          setNotification({
            message: `Berhasil memotret kucing di spot [${currentSpot.name}] (< ${currentSpot.radiusMeters}m)! Bonus +${currentSpot.bonusPoints} Poin (${currentSpot.boostedElement})! 📍`,
            type: "success"
          });
          setActiveSpotToCapture(null);
        }
        // Update user points, streak, and captures list
        let updatedUser = user;
        if (data.user) {
          updatedUser = data.user;
          setUser(updatedUser);
        } else if (user) {
          updatedUser = { 
            ...user, 
            points: data.points,
            captureStreak: data.captureStreak !== undefined ? data.captureStreak : user.captureStreak,
            lastCaptureDate: data.lastCaptureDate !== undefined ? data.lastCaptureDate : user.lastCaptureDate
          };
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
        } else if (data.streakBonusAwarded) {
          try {
            audio.playForgingSound();
          } catch (e) {}
          setNotification({
            message: data.streakMessage || (language === "id"
              ? `Foto kucing ditangkap (+10 Poin)! 🔥 Streak Tangkap ${data.captureStreak} Hari (+${data.streakBonusPoints} Bonus Poin)!`
              : `Cat photo captured (+10 Points)! 🔥 Capture Streak: ${data.captureStreak} Days (+${data.streakBonusPoints} Bonus Points)!`),
            type: "success"
          });
        } else {
          setNotification({
            message: data.streakMessage ? `📸 Foto kucing berhasil tertangkap! ${data.streakMessage}` : (language === "id"
              ? "Foto kucing berhasil tertangkap! +10 Poin ditambahkan. 📸"
              : "Cat photo successfully captured! +10 Points added. 📸"),
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

  // Retake capture handler
  const handleRetakeCapture = async (captureId: string, newPhotoBase64: string) => {
    if (!token) return { success: false, error: "Unauthorized" };
    try {
      const response = await fetch(`/api/captures/${captureId}/photo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ photo: newPhotoBase64 })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || "Gagal memperbarui foto." };
      }
      setCaptures(prev => prev.map(c => c.id === captureId ? { ...c, photoUrl: newPhotoBase64 } : c));
      setNotification({
        message: "Foto kucing berhasil di-retake dan diperbarui!",
        type: "success"
      });
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: "Gagal terhubung ke server." };
    }
  };

  // Profile picture modal states
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarModalError, setAvatarModalError] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // Username change modal states
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameModalError, setUsernameModalError] = useState<string | null>(null);

  // Avatar update handler
  const handleSaveAvatar = async (avatarUrlToSave: string) => {
    if (!token) return;
    setIsSavingAvatar(true);
    setAvatarModalError(null);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ avatarUrl: avatarUrlToSave })
      });
      const data = await res.json();
      if (!res.ok) {
        setAvatarModalError(data.error || "Gagal memperbarui foto profil.");
      } else {
        if (user) {
          setUser({ ...user, avatarUrl: data.user.avatarUrl });
        }
        setShowAvatarModal(false);
        setAvatarDraft(null);
        setNotification({
          message: data.message || "Foto profil berhasil diperbarui!",
          type: "success"
        });
      }
    } catch (err) {
      setAvatarModalError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Username change handler
  const handleSaveUsername = async () => {
    if (!token) return;
    setIsSavingUsername(true);
    setUsernameModalError(null);
    try {
      const res = await fetch("/api/user/change-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newUsername: newUsernameInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameModalError(data.error || "Gagal mengubah username.");
      } else {
        if (data.newToken) {
          setToken(data.newToken);
          localStorage.setItem("nekomon_token", data.newToken);
        }
        if (user && data.user) {
          setUser({
            ...user,
            username: data.user.username,
            cores: data.user.cores,
            nameChangeCount: data.user.nameChangeCount
          });
        }
        setShowUsernameModal(false);
        setNewUsernameInput("");
        setNotification({
          message: data.message || "Username berhasil diubah!",
          type: "success"
        });
      }
    } catch (err) {
      setUsernameModalError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingUsername(false);
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

      {/* Header section with Official NEKOMON Emblem */}
      <header className="w-full max-w-7xl px-4 py-4 sm:py-6 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleTabChange("gallery")}>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-amber-500 to-red-600 rounded-2xl blur opacity-60 group-hover:opacity-90 transition duration-500" />
            <img 
              src={nekomonLogoImg} 
              alt="NEKOMON Official Logo" 
              className="relative h-11 sm:h-14 w-auto object-contain rounded-xl border border-amber-500/40 shadow-xl group-hover:scale-105 transition-all duration-300"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <h1 className="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-amber-300 to-pink-400 font-sans select-none drop-shadow-md leading-none">
              NEKOMON
            </h1>
            <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">Mobile Card Companion</span>
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  try { audio.playForgingSound(); } catch (_) {}
                  setShowDailyBonusModal(true);
                }}
                className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 hover:border-amber-400 p-2 sm:px-3 sm:py-2 rounded-2xl text-amber-400 hover:text-amber-300 font-mono text-[10px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md relative group shrink-0"
                title="Bonus Login Harian 24 Jam"
              >
                <Gift className="w-4 h-4 animate-bounce text-amber-400" />
                <span className="hidden sm:inline">{language === "id" ? "BONUS HARIAN" : "DAILY BONUS"}</span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
              </button>

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
          /* Landing Screen / Login portal with full-page visual card-game branding & card showcase */
          <div className="w-full flex flex-col gap-8 py-6">
            
            {/* Live Community Metrics Banner */}
            <div className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-around gap-4 text-center font-mono">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-black text-yellow-400">
                    <AnimatedCounter value={publicStats.totalPlayers} suffix="+" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {language === "id" ? "Pemain Terdaftar" : "Registered Players"}
                  </div>
                </div>
              </div>

              <div className="hidden sm:block h-8 w-[1px] bg-slate-800" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-black text-teal-400">
                    <AnimatedCounter value={publicStats.totalCards} suffix="+" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {language === "id" ? "Kartu Forged" : "Forged Cards"}
                  </div>
                </div>
              </div>

              <div className="hidden sm:block h-8 w-[1px] bg-slate-800" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Swords className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-black text-pink-400">
                    <AnimatedCounter value={2450} suffix="+" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {language === "id" ? "Pertempuran Arena" : "Arena Battles"}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Hero Section: Information & Login Portal */}
            <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-10">
              <div className="flex-1 max-w-lg text-left flex flex-col gap-5">
                
                {/* Official Grand Logo Emblem */}
                <div className="relative group max-w-md w-full my-1">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-amber-500 to-red-600 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-700 animate-pulse" />
                  <img 
                    src={nekomonLogoImg} 
                    alt="Official NEKOMON Logo Banner" 
                    className="relative w-full h-auto object-contain rounded-2xl border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20 group-hover:scale-[1.02] transition-all duration-500"
                  />
                </div>

                <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold font-mono text-xs w-max uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {language === "id" ? "CARD GAME BERBASIS KUCING ASLI" : "REAL CAT BASED CARD GAME"}
                </span>
                <h2 className="text-3xl lg:text-4xl font-black text-slate-100 tracking-tight leading-tight font-sans">
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
                    <div className="text-yellow-500 font-bold mb-1 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {language === "id" ? "100 POIN AWAL" : "100 INITIAL POINTS"}
                    </div>
                    {language === "id" 
                      ? "Dapatkan modal melimpah langsung sesaat setelah mendaftar pertama kali."
                      : "Get an abundant starting balance immediately upon registering for the first time."}
                  </div>
                  <div>
                    <div className="text-pink-400 font-bold mb-1 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      FAKSI & ELEMEN
                    </div>
                    {language === "id"
                      ? "Tempa kartu bergaya Faksi Sentinel atau Scourge dengan 5 tipe elemen berkekuatan khusus."
                      : "Forge cards in Sentinel or Scourge Factions with 5 special elemental powers."}
                  </div>
                </div>
              </div>

              <div className="w-full max-w-md">
                <AuthForm onSuccess={handleAuthSuccess} />
              </div>
            </div>

            {/* OFFICIAL GAME VISUAL & CARD SYSTEM SHOWCASE */}
            <div className="w-full bg-slate-900/40 border border-amber-500/30 p-5 sm:p-7 rounded-3xl flex flex-col gap-6 shadow-2xl shadow-amber-500/5 mt-4 relative overflow-hidden backdrop-blur-sm">
              {/* Decorative Background Glows */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h3 className="text-lg sm:text-xl font-black text-slate-100 font-sans tracking-wide uppercase">
                      {language === "id" ? "🎴 SISTEM KARTU & VISUAL GAME RESMI" : "🎴 OFFICIAL CARD SYSTEM & GAME VISUALS"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    {language === "id"
                      ? "Detail tampilan kartu Nekomon hasil Forging AI, statistik pertempuran (ATK, SPD, HP, DEF), serta Ultimate Skill Faksi Sentinel & Scourge:"
                      : "Visual breakdown of AI Forged Nekomon Cards, combat stats (ATK, SPD, HP, DEF), and Ultimate Skills for Sentinel & Scourge:"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBottomBannerZoomed(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black font-mono text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Eye className="w-4 h-4" />
                    {language === "id" ? "LIHAT FULLSCREEN 🔍" : "EXPAND FULLSCREEN 🔍"}
                  </button>
                </div>
              </div>

              {/* Dynamic Bottom Banner Visual Display */}
              <div className="relative group rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-950 shadow-2xl transition-all duration-500 hover:border-amber-400/60">
                <img 
                  src={nekomonBottomBannerImg} 
                  alt="Official NEKOMON Card Game System & Showcase" 
                  className="w-full h-auto object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.01] cursor-pointer"
                  onClick={() => setIsBottomBannerZoomed(true)}
                />
                
                {/* Subtle Hover Hint */}
                <div 
                  onClick={() => setIsBottomBannerZoomed(true)}
                  className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer backdrop-blur-[2px]"
                >
                  <span className="bg-slate-950/90 text-amber-300 border border-amber-500/50 px-5 py-2.5 rounded-2xl font-mono text-xs font-bold shadow-2xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <Eye className="w-4 h-4 text-amber-400" />
                    {language === "id" ? "Klik Untuk Memperbesar Tampilan Kartu 🔍" : "Click to Enlarge Card System Showcase 🔍"}
                  </span>
                </div>
              </div>

              {/* Dynamic Key Features & Stats Breakdown Ribbon */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs relative z-10">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex flex-col gap-1 shadow-md">
                  <span className="text-red-400 font-bold flex items-center gap-1.5 text-xs">
                    <span>🗡️</span> ATK (Attack)
                  </span>
                  <span className="text-slate-400 text-[11px] leading-tight">
                    {language === "id" ? "Mempengaruhi jumlah damage serangan dasar & skill." : "Determines base & skill attack damage dealt."}
                  </span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex flex-col gap-1 shadow-md">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                    <span>⚡</span> SPD (Speed)
                  </span>
                  <span className="text-slate-400 text-[11px] leading-tight">
                    {language === "id" ? "Menentukan urutan giliran bertindak di Arena." : "Controls turn priority order in Arena combat."}
                  </span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex flex-col gap-1 shadow-md">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                    <span>❤️</span> HP (Health)
                  </span>
                  <span className="text-slate-400 text-[11px] leading-tight">
                    {language === "id" ? "Daya tahan hidup. Jika 0 maka Nekomon gugur." : "Health points. Reaching 0 results in knockout."}
                  </span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex flex-col gap-1 shadow-md">
                  <span className="text-blue-400 font-bold flex items-center gap-1.5 text-xs">
                    <span>🛡️</span> DEF (Defense)
                  </span>
                  <span className="text-slate-400 text-[11px] leading-tight">
                    {language === "id" ? "Mengurangi besaran damage fisik & sihir." : "Reduces incoming physical & magic damage."}
                  </span>
                </div>
              </div>
            </div>

            {/* Lightbox Fullscreen Modal for Official Game Card System Image */}
            {isBottomBannerZoomed && (
              <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-fadeIn">
                <div className="relative max-w-5xl w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-100 font-mono uppercase tracking-wider">
                        NEKOMON OFFICIAL CARD SYSTEM & GAMEPLAY VISUAL
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsBottomBannerZoomed(false)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex justify-center items-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                    <img 
                      src={nekomonBottomBannerImg} 
                      alt="NEKOMON Official Card Showcase" 
                      className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="text-amber-400 font-bold">nekomon.online</span>
                    <button
                      onClick={() => setIsBottomBannerZoomed(false)}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all cursor-pointer shadow-lg"
                    >
                      {language === "id" ? "TUTUP" : "CLOSE"}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
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

                {/* Quick Ad Buttons in Header */}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRewardedAd("standard")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-110 text-white font-black text-[10px] tracking-wider transition-all shadow-md active:scale-95 cursor-pointer uppercase border border-pink-400/30"
                    title="Tonton video iklan berhadiah 5s untuk klaim Poin & Cores gratis"
                  >
                    <Gift className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                    <span>Tonton Iklan (+Poin & Core)</span>
                  </button>

                  <button
                    onClick={() => {
                      setPendingTab(mobileTab);
                      setShowInterstitialAd(true);
                    }}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-[10px] transition-all border border-slate-800 cursor-pointer"
                    title="Simulasi Iklan Interstitial (AdMob/Unity Ads)"
                  >
                    <Tv className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tes Interstitial</span>
                  </button>
                </div>
              </div>

              {/* Game Tab List */}
              <div className="flex flex-wrap bg-slate-950 p-1 border border-slate-800 rounded-xl gap-1 select-none">
                {(
                  [
                    { id: "spot_map", label: language === "id" ? "PETA SPOT 📍" : "SPOT MAP 📍", icon: MapPin },
                    { id: "camera", label: t("nav.camera"), icon: Camera },
                    { id: "gallery", label: t("nav.gallery"), icon: FolderHeart },
                    { id: "dex", label: t("nav.dex"), icon: BookOpen },
                    { id: "arena", label: t("nav.arena"), icon: Swords },
                    { id: "missions", label: t("nav.missions"), icon: Gamepad2 },
                    { id: "trading", label: t("nav.trading"), icon: ArrowLeftRight },
                    { id: "leaderboard", label: t("nav.leaderboard"), icon: Trophy },
                    { id: "shop", label: t("nav.shop"), icon: ShoppingBag },
                    { id: "guide", label: t("nav.guide"), icon: HelpCircle },
                    { id: "profile", label: t("nav.profile"), icon: UserIcon }
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
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
                {mobileTab === "spot_map" && (
                  <motion.div
                    key="spot-map-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex flex-col gap-4"
                  >
                    <NekomonSpotMap
                      onSelectSpotToCapture={(spot) => {
                        setActiveSpotToCapture(spot);
                        setMobileTab("camera");
                      }}
                      userPoints={user.points}
                      token={token || ""}
                    />
                  </motion.div>
                )}

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
                        activeSpot={activeSpotToCapture}
                        onClearSpot={() => setActiveSpotToCapture(null)}
                        spotCapturesCount={
                          activeSpotToCapture 
                            ? captures.filter(c => {
                                const todayStr = new Date().toISOString().split("T")[0];
                                const cDate = new Date(c.createdAt).toISOString().split("T")[0];
                                return cDate === todayStr && (c.spotId === activeSpotToCapture.id || c.spotName === activeSpotToCapture.name);
                              }).length
                            : 0
                        }
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
                          onRetakeCapture={handleRetakeCapture}
                          onEvolveCard={handleEvolveCard}
                          onCancelEvolution={handleCancelEvolution}
                          user={user}
                        />
                      </>
                    )}
                  </motion.div>
                )}

                {mobileTab === "dex" && (
                  <motion.div
                    key="dex-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="w-full"
                  >
                    <NekomonDex
                      cards={cards}
                      onOpenForge={() => {
                        setMobileTab("gallery");
                        setShowForgeModal(true);
                      }}
                    />
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
                      mission={mission}
                      onMissionClaimSuccess={(updatedPts, updatedCores, updatedMission) => {
                        setUser(prev => prev ? { ...prev, points: updatedPts, cores: updatedCores } : null);
                        setMission(updatedMission);
                        setNotification({
                          message: language === "id"
                            ? "Hadiah Misi Harian Level > 8 Berhasil Diklaim!"
                            : "Daily Mission Level > 8 Reward Successfully Claimed!",
                          type: "success"
                        });
                      }}
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

                {mobileTab === "profile" && (() => {
                  const totalCardLevels = cards.reduce((sum, c) => sum + (c.level || 1), 0);
                  const trainerLv = getTrainerLevel(cards.length, totalCardLevels, user.points);
                  const highestBadge = getHighestBadge(trainerLv);

                  return (
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
                        {/* Profile Card Header */}
                        <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850 relative overflow-hidden">
                          <div className="relative group shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-slate-900 to-slate-950 border-2 border-yellow-500/40 flex items-center justify-center text-3xl shadow-inner overflow-hidden">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                              ) : (
                                <span>{highestBadge ? highestBadge.emoji : "🎒"}</span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setShowAvatarModal(true);
                                setAvatarDraft(null);
                                setAvatarModalError(null);
                              }}
                              className="absolute -bottom-1 -right-1 p-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-lg shadow-md transition-all cursor-pointer border border-yellow-300"
                              title={language === "id" ? "Ganti foto profil" : "Change profile picture"}
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-lg text-slate-100 truncate">@{user.username}</h3>
                              <button
                                onClick={() => {
                                  setShowUsernameModal(true);
                                  setNewUsernameInput(user.username);
                                  setUsernameModalError(null);
                                }}
                                className="p-1 text-slate-400 hover:text-yellow-400 bg-slate-900 hover:bg-slate-850 rounded-md border border-slate-800 transition-all cursor-pointer text-[10px] flex items-center gap-1 font-mono"
                                title={language === "id" ? "Ganti username" : "Change username"}
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>{(user.nameChangeCount || 0) === 0 ? "GRATIS" : "200 Cores"}</span>
                              </button>
                              {highestBadge && (
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold border ${highestBadge.badgeClass} shadow-sm`}>
                                  {language === "id" ? highestBadge.badgeNameId : highestBadge.badgeNameEn}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 block truncate">{user.email}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-black text-yellow-400">
                                TRAINER LEVEL {trainerLv}
                              </span>
                              <span className="text-[10px] text-slate-500">• {cards.length} Cards • {totalCardLevels} Total Levels</span>
                            </div>
                          </div>
                        </div>

                        {/* Player Stats Grid */}
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

                        {/* CAPTURE STREAK SECTION */}
                        {(() => {
                          const streakDays = user.captureStreak || 0;
                          const isStreakActive = streakDays >= 3;
                          const progressPercent = Math.min(100, Math.round((streakDays / 3) * 100));

                          return (
                            <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                              isStreakActive 
                                ? "bg-gradient-to-r from-amber-950/80 via-slate-900 to-orange-950/80 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                : "bg-slate-950 border-slate-850"
                            }`}>
                              <div className="flex items-center justify-between gap-3 mb-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    isStreakActive ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse" : "bg-slate-900 text-slate-500 border border-slate-800"
                                  }`}>
                                    <Flame className="w-5 h-5 fill-current" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-black text-xs text-slate-100 uppercase tracking-wider">
                                        {language === "id" ? "STREAK TANGKAP HARIAN" : "DAILY CAPTURE STREAK"}
                                      </h4>
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                        isStreakActive 
                                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-bounce" 
                                          : "bg-slate-800 text-slate-400 border-slate-700"
                                      }`}>
                                        {isStreakActive ? (language === "id" ? "BONUS AKTIF (+15-30 PTS)" : "BONUS ACTIVE (+15-30 PTS)") : `${streakDays}/3 HARI`}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {language === "id" 
                                        ? "Tangkap minimal 1 foto kucing setiap hari selama 3+ hari berturut-turut untuk mengaktifkan bonus poin!" 
                                        : "Capture at least 1 cat photo daily for 3+ consecutive days to activate bonus points!"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xl font-black text-amber-400 flex items-center justify-end gap-1 font-mono">
                                    <span>{streakDays}</span>
                                    <span className="text-[10px] text-slate-400">{language === "id" ? "HARI" : "DAYS"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar to 3-Day Milestone */}
                              <div className="mt-3">
                                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                                  <span>{language === "id" ? "Progres Target Streak Bonus (3 Hari)" : "Progress to Bonus Streak Target (3 Days)"}</span>
                                  <span className="font-bold text-amber-400">{progressPercent}%</span>
                                </div>
                                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                  <div 
                                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>

                              {/* Status Footer */}
                              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-400" />
                                  {user.lastCaptureDate 
                                    ? (language === "id" ? `Foto terakhir: ${user.lastCaptureDate}` : `Last capture: ${user.lastCaptureDate}`)
                                    : (language === "id" ? "Belum ada foto hari ini" : "No capture today")}
                                </span>
                                {isStreakActive ? (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    ✓ {language === "id" ? "Bonus Streak Tangkap Aktif" : "Capture Streak Bonus Active"}
                                  </span>
                                ) : (
                                  <span className="text-amber-400 font-bold">
                                    {language === "id" ? `Butuh ${Math.max(1, 3 - streakDays)} hari lagi` : `Need ${Math.max(1, 3 - streakDays)} more day(s)`}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* BADGES SECTION */}
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col gap-3">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-amber-400" />
                              <h4 className="font-extrabold text-xs text-slate-100 uppercase tracking-wider">
                                {language === "id" ? "LENCANA PENCAPAIAN TRAINER" : "TRAINER ACHIEVEMENT BADGES"}
                              </h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                              LEVEL {trainerLv} / 50
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {PLAYER_BADGES.map((b) => {
                              const isUnlocked = currentTrainerLv >= b.levelRequirement;
                              return (
                                <div
                                  key={b.id}
                                  onClick={() => {
                                    setAchievementModalData({
                                      isOpen: true,
                                      type: isUnlocked ? "badge_unlocked" : "inspect",
                                      trainerLevel: currentTrainerLv,
                                      badge: b
                                    });
                                    try { audio.playVictory(); } catch (e) {}
                                  }}
                                  className={`p-3 rounded-xl border transition-all flex items-center gap-3 relative overflow-hidden cursor-pointer group ${
                                    isUnlocked
                                      ? "bg-slate-900/90 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:border-amber-400 hover:scale-[1.01]"
                                      : "bg-slate-950/50 border-slate-800/80 opacity-60 hover:opacity-90"
                                  }`}
                                >
                                  <div
                                    className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl shrink-0 ${
                                      isUnlocked ? b.badgeClass : "border-slate-800 bg-slate-900 text-slate-600"
                                    }`}
                                  >
                                    {b.emoji}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-xs font-black truncate ${isUnlocked ? "text-slate-100" : "text-slate-400"}`}>
                                        {language === "id" ? b.badgeNameId : b.badgeNameEn}
                                      </span>
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1 ${
                                        isUnlocked ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"
                                      }`}>
                                        {isUnlocked ? (
                                          <>
                                            <Share2 className="w-2.5 h-2.5" />
                                            <span>BAGIKAN</span>
                                          </>
                                        ) : (
                                          `LV. ${b.levelRequirement}`
                                        )}
                                      </span>
                                    </div>
                                    <p className="text-[9.5px] text-slate-400 mt-0.5 line-clamp-1 leading-tight">
                                      {language === "id" ? b.descId : b.descEn}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full bg-red-950/40 hover:bg-red-950 text-red-200 hover:text-red-100 font-bold py-3 px-4 rounded-xl text-xs transition-all border border-red-900/30 cursor-pointer flex items-center justify-center gap-2 mt-2"
                        >
                          <LogOut className="w-4 h-4" />
                          {language === "id" ? "Keluar dari Game (Logout)" : "Log Out of Game"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}

                {mobileTab === "shop" && (
                  <motion.div
                    key="shop-view"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="w-full"
                  >
                    <ShopView 
                      user={user} 
                      cards={cards}
                      onRefreshCards={() => token && fetchGallery(token)}
                      onRequestRewardedAd={(type) => handleOpenRewardedAd(type)}
                      onPurchaseSuccess={(updatedPoints, updatedCores, addedCards) => {
                        setUser(prev => prev ? { ...prev, points: updatedPoints, cores: updatedCores } : null);
                        if (addedCards && addedCards.length > 0) {
                          setCards(prev => [...prev, ...addedCards]);
                        }
                        if (token) {
                          fetchGallery(token);
                        }
                        setNotification({
                          message: language === "id"
                            ? "Transaksi berhasil disinkronkan ke server!"
                            : "Transaction successfully synchronized with the server!",
                          type: "success"
                        });
                      }} 
                    />
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

      {/* Interstitial Ad Simulator Modal */}
      <InterstitialAdModal
        isOpen={showInterstitialAd}
        onClose={handleCloseInterstitial}
        targetTabName={pendingTab ? t(`nav.${pendingTab}`) : undefined}
      />

      {/* Rewarded Video Ad Simulator Modal */}
      <RewardedAdModal
        isOpen={showRewardedAdModal}
        onClose={() => setShowRewardedAdModal(false)}
        token={token}
        rewardType={rewardedAdType}
        onRewardClaimed={handleRewardClaimed}
      />

      {/* Daily 24-Hour Login Bonus Modal */}
      <DailyLoginModal
        isOpen={showDailyBonusModal}
        onClose={() => setShowDailyBonusModal(false)}
        token={token}
        userPoints={user?.points || 0}
        userCores={user?.cores || 0}
        onClaimSuccess={(updatedPoints, updatedCores, rewardMsg) => {
          if (user) {
            const updatedUser = { ...user, points: updatedPoints, cores: updatedCores };
            setUser(updatedUser);
            updateLocalBackup(updatedUser);
          }
          setNotification({
            message: rewardMsg,
            type: "success"
          });
        }}
      />

      {/* Congratulatory Level-Up & Badge Unlock Share Modal */}
      <AchievementShareModal
        isOpen={achievementModalData.isOpen}
        onClose={() => setAchievementModalData(prev => ({ ...prev, isOpen: false }))}
        username={user?.username || "Trainer"}
        trainerLevel={achievementModalData.trainerLevel}
        badge={achievementModalData.badge}
        type={achievementModalData.type}
      />

      {/* Upload / Edit Profile Picture Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4 font-mono relative"
            >
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const res = event.target?.result as string;
                    if (res) setAvatarDraft(res);
                  };
                  reader.readAsDataURL(file);
                }}
                className="hidden"
              />

              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-yellow-500">
                  <Camera className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">
                    {language === "id" ? "Ganti Foto Profil" : "Change Profile Picture"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Safety notice banner */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-amber-300 text-[10px] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {language === "id" 
                    ? "Foto profil harus pantas dan sopan. Dilarang keras mengunggah foto yang mengandung unsur penghinaan, SARA, atau pornografi." 
                    : "Profile pictures must be appropriate. Hate speech, offensive material, and explicit content are strictly prohibited."}
                </span>
              </div>

              {/* Preview Avatar Box */}
              <div className="flex flex-col items-center justify-center my-1 gap-2">
                <div 
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl bg-slate-950 border-2 border-dashed border-yellow-500/50 hover:border-yellow-400 flex items-center justify-center overflow-hidden cursor-pointer shadow-inner relative group transition-all"
                >
                  {avatarDraft ? (
                    <img src={avatarDraft} alt="Preview" className="w-full h-full object-cover" />
                  ) : user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Current Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-500 group-hover:text-yellow-400">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[9px] font-bold">Pilih Foto</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">Klik kotak di atas untuk memilih foto baru dari galeri</span>
              </div>

              {avatarModalError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex items-start gap-2 text-red-400 text-[10px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{avatarModalError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  disabled={!avatarDraft || isSavingAvatar}
                  onClick={() => avatarDraft && handleSaveAvatar(avatarDraft)}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  {isSavingAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>MENYIMPAN...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>SIMPAN FOTO</span>
                    </>
                  )}
                </button>

                {user?.avatarUrl && (
                  <button
                    disabled={isSavingAvatar}
                    onClick={() => handleSaveAvatar("")}
                    className="px-3 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                    title="Hapus foto profil saat ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Username Modal */}
      <AnimatePresence>
        {showUsernameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4 font-mono relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-yellow-500">
                  <Edit3 className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">
                    {language === "id" ? "Ganti Username Player" : "Change Username"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowUsernameModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notice Banner based on change count */}
              {(user?.nameChangeCount || 0) === 0 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2 text-emerald-300 text-[10px] leading-relaxed">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Penggantian Pertama: GRATIS!</strong> Anda belum pernah mengganti username. Penggantian pertama tidak dikenakan biaya Nekomon Core.
                  </span>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-amber-300 text-[10px] leading-relaxed">
                  <Coins className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Biaya: 200 Nekomon Cores.</strong> Ini adalah penggantian username ke-{(user?.nameChangeCount || 0) + 1}. (Saldo Cores Anda saat ini: <strong>{user?.cores || 0} Cores</strong>)
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Username Baru</label>
                <input
                  type="text"
                  value={newUsernameInput}
                  onChange={(e) => setNewUsernameInput(e.target.value)}
                  placeholder="Contoh: NekomonMaster_99"
                  maxLength={20}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-yellow-500 transition-all font-mono"
                />
                <span className="text-[9px] text-slate-500">3-20 karakter, hanya huruf, angka, dan underscore (_).</span>
              </div>

              {usernameModalError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex items-start gap-2 text-red-400 text-[10px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{usernameModalError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  disabled={!newUsernameInput.trim() || isSavingUsername}
                  onClick={handleSaveUsername}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  {isSavingUsername ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>PROSES...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>SIMPAN USERNAME</span>
                    </>
                  )}
                </button>

                <button
                  disabled={isSavingUsername}
                  onClick={() => setShowUsernameModal(false)}
                  className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all border border-slate-700"
                >
                  BATAL
                </button>
              </div>
            </motion.div>
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
