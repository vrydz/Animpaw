import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Shield,
  Swords,
  Sparkles,
  Camera,
  FolderHeart,
  BookOpen,
  Gamepad2,
  Target,
  Trophy,
  Mail,
  ArrowLeftRight,
  ShoppingBag,
  User as UserIcon,
  HelpCircle,
  Database,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkle,
  Settings as SettingsIcon,
  Volume2,
  Globe,
  Download
} from "lucide-react";
import { haptics } from "../lib/vibration";

export type NavCategoryId = "exploration" | "collection" | "combat" | "community" | "account" | "settings";

export interface NavSubItem {
  id: string;
  labelId: string;
  labelEn: string;
  descId: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface NavCategory {
  id: NavCategoryId;
  titleId: string;
  titleEn: string;
  subtitleId: string;
  subtitleEn: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  glowColor: string;
  subItems: NavSubItem[];
}

export const getNavCategories = (mailUnreadCount: number, isDeveloper: boolean): NavCategory[] => [
  {
    id: "exploration",
    titleId: "Eksplorasi & Peta",
    titleEn: "Exploration & Maps",
    subtitleId: "Spot GPS, Teritori & Raid Boss",
    subtitleEn: "GPS Spots, Territory & Raids",
    icon: MapPin,
    accentColor: "from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400",
    glowColor: "rgba(16, 185, 129, 0.25)",
    subItems: [
      {
        id: "spot_map",
        labelId: "Peta Spot GPS",
        labelEn: "GPS Spot Map",
        descId: "Jelajahi spot & temukan Nekomon liar",
        descEn: "Explore spots & encounter wild Nekomon",
        icon: MapPin
      },
      {
        id: "territory",
        labelId: "Dominasi Wilayah",
        labelEn: "Territory Control",
        descId: "Rebut wilayah faksi Sentinel vs Vanguard",
        descEn: "Capture territory Sentinel vs Vanguard",
        icon: Shield
      },
      {
        id: "raid",
        labelId: "Raid Boss Co-op",
        labelEn: "Co-op Raid Boss",
        descId: "Serang monster boss bersama trainer lain",
        descEn: "Battle massive raid bosses together",
        icon: Swords
      },
      {
        id: "events",
        labelId: "Event & Mitra",
        labelEn: "Events & Partners",
        descId: "Event berhadiah & sponsor kartu langka",
        descEn: "Rewarding events & partner sponsors",
        icon: Sparkles
      }
    ]
  },
  {
    id: "collection",
    titleId: "Koleksi & Deteksi",
    titleEn: "Collection & Detection",
    subtitleId: "AR Scanner, Galeri & Nekodex",
    subtitleEn: "AR Camera, Gallery & Dex",
    icon: Camera,
    accentColor: "from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-400",
    glowColor: "rgba(245, 158, 11, 0.25)",
    subItems: [
      {
        id: "camera",
        labelId: "Kamera Scanner AR",
        labelEn: "AR Camera Scanner",
        descId: "Deteksi & foto kucing untuk buat kartu",
        descEn: "Scan & snap cats to forge cards",
        icon: Camera
      },
      {
        id: "gallery",
        labelId: "Galeri Kartu",
        labelEn: "Card Gallery",
        descId: "Koleksi kartu Nekomon yang kamu miliki",
        descEn: "Your owned Nekomon card collection",
        icon: FolderHeart
      },
      {
        id: "dex",
        labelId: "Nekodex Lengkap",
        labelEn: "Complete Nekodex",
        descId: "Katalog seluruh 200+ spesies Nekomon",
        descEn: "Encyclopedia of 200+ Nekomon species",
        icon: BookOpen
      }
    ]
  },
  {
    id: "combat",
    titleId: "Pertempuran & Misi",
    titleEn: "Combat & Quests",
    subtitleId: "Arena PvP, Misi & Ranking",
    subtitleEn: "PvP Arena, Missions & Ranking",
    icon: Gamepad2,
    accentColor: "from-rose-500/20 to-red-500/10 border-rose-500/40 text-rose-400",
    glowColor: "rgba(244, 63, 94, 0.25)",
    subItems: [
      {
        id: "arena",
        labelId: "Arena PvP",
        labelEn: "PvP Arena",
        descId: "Duel kartu giliran berbasis elemen",
        descEn: "Turn-based elemental card battles",
        icon: Gamepad2
      },
      {
        id: "missions",
        labelId: "Misi Harian",
        labelEn: "Daily Quests",
        descId: "Selesaikan quest & raih reward bonus",
        descEn: "Complete tasks to earn bonus rewards",
        icon: Target
      },
      {
        id: "leaderboard",
        labelId: "Papan Peringkat",
        labelEn: "Leaderboards",
        descId: "Daftar trainer terbaik se-nusantara",
        descEn: "Top trainers ranking across regions",
        icon: Trophy
      }
    ]
  },
  {
    id: "community",
    titleId: "Komunitas & Toko",
    titleEn: "Community & Shop",
    subtitleId: "Surat, Barter & Toko Nekomon",
    subtitleEn: "Mailbox, Trade & Shop",
    icon: ShoppingBag,
    accentColor: "from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-400",
    glowColor: "rgba(6, 182, 212, 0.25)",
    subItems: [
      {
        id: "mail",
        labelId: "Surat & Chat",
        labelEn: "Mailbox & Chat",
        descId: "Kirim pesan & periksa status pemain",
        descEn: "Message players & view online status",
        icon: Mail,
        badge: mailUnreadCount
      },
      {
        id: "trading",
        labelId: "Barter Kartu",
        labelEn: "Card Trading",
        descId: "Tukar kartu koleksi sesama trainer",
        descEn: "Trade cards with other trainers",
        icon: ArrowLeftRight
      },
      {
        id: "shop",
        labelId: "Toko Nekomon",
        labelEn: "Nekomon Shop",
        descId: "Beli Core, Booster Pack & Gacha",
        descEn: "Buy Cores, Booster Packs & Gacha",
        icon: ShoppingBag
      }
    ]
  },
  {
    id: "account",
    titleId: "Akun & Bantuan",
    titleEn: "Account & Support",
    subtitleId: "Profil, Panduan & Pengaturan",
    subtitleEn: "Profile, Guide & Settings",
    icon: UserIcon,
    accentColor: "from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-400",
    glowColor: "rgba(168, 85, 247, 0.25)",
    subItems: [
      {
        id: "profile",
        labelId: "Profil Trainer",
        labelEn: "Trainer Profile",
        descId: "Statistik, faksi & kustomisasi akun",
        descEn: "Stats, faction & account customisation",
        icon: UserIcon
      },
      {
        id: "guide",
        labelId: "Panduan Game",
        labelEn: "Game Guide",
        descId: "Tata cara bermain, elemen & aturan",
        descEn: "How to play, elements & official rules",
        icon: HelpCircle
      },
      ...(isDeveloper
        ? [
            {
              id: "db_backup_trigger",
              labelId: "Backup Database",
              labelEn: "Database Backup",
              descId: "Pencadangan & pemulihan data Firestore",
              descEn: "Firestore data backup & recovery tool",
              icon: Database
            }
          ]
        : [])
    ]
  },
  {
    id: "settings",
    titleId: "Pengaturan & Preferensi",
    titleEn: "Settings & System",
    subtitleId: "Audio, Bahasa & PWA",
    subtitleEn: "Audio, Language & PWA",
    icon: SettingsIcon,
    accentColor: "from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-400",
    glowColor: "rgba(245, 158, 11, 0.25)",
    subItems: [
      {
        id: "settings_audio",
        labelId: "Pengaturan Audio",
        labelEn: "Audio Settings",
        descId: "BGM, tema musik & volume suara",
        descEn: "BGM, music themes & volume",
        icon: Volume2
      },
      {
        id: "settings_language",
        labelId: "Pilihan Bahasa",
        labelEn: "Language",
        descId: "Ganti bahasa game (ID / EN)",
        descEn: "Switch game language (ID / EN)",
        icon: Globe
      },
      {
        id: "settings_install",
        labelId: "Install Aplikasi",
        labelEn: "Install App",
        descId: "Pasang Nekomon PWA ke perangkat",
        descEn: "Install Nekomon PWA to device",
        icon: Download
      }
    ]
  }
];

export function getCategoryForTab(tab: string): NavCategoryId {
  if (["spot_map", "territory", "raid", "events"].includes(tab)) return "exploration";
  if (["camera", "gallery", "dex"].includes(tab)) return "collection";
  if (["arena", "missions", "leaderboard"].includes(tab)) return "combat";
  if (["mail", "trading", "shop"].includes(tab)) return "community";
  if (["profile", "guide", "db_backup_trigger"].includes(tab)) return "account";
  if (["settings", "settings_audio", "settings_language", "settings_install"].includes(tab)) return "settings";
  return "exploration";
}

interface NavigationCarouselProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  language: "id" | "en";
  mailUnreadCount: number;
  isDeveloper: boolean;
  onOpenDatabaseBackup?: () => void;
}

export const NavigationCarousel: React.FC<NavigationCarouselProps> = ({
  currentTab,
  onSelectTab,
  language,
  mailUnreadCount,
  isDeveloper,
  onOpenDatabaseBackup
}) => {
  const currentCategory = getCategoryForTab(currentTab);
  const [activeCategory, setActiveCategory] = React.useState<NavCategoryId>(currentCategory);

  // Synchronize category with active tab
  useEffect(() => {
    const derived = getCategoryForTab(currentTab);
    if (derived !== activeCategory) {
      setActiveCategory(derived);
    }
  }, [currentTab]);

  const categories = getNavCategories(mailUnreadCount, isDeveloper);
  const activeCatObj = categories.find((c) => c.id === activeCategory) || categories[0];

  const subMenuScrollRef = useRef<HTMLDivElement>(null);
  const mainCategoriesScrollRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (catId: NavCategoryId) => {
    haptics.tap();
    setActiveCategory(catId);
    // If the active tab is not in the newly selected category, switch to the first item
    const targetCat = categories.find((c) => c.id === catId);
    if (targetCat && !targetCat.subItems.some((s) => s.id === currentTab)) {
      const firstSubItem = targetCat.subItems[0];
      if (firstSubItem) {
        if (firstSubItem.id === "db_backup_trigger") {
          if (onOpenDatabaseBackup) onOpenDatabaseBackup();
        } else {
          onSelectTab(firstSubItem.id);
        }
      }
    }
  };

  const handleSubItemClick = (subId: string) => {
    haptics.tap();
    if (subId === "db_backup_trigger") {
      if (onOpenDatabaseBackup) onOpenDatabaseBackup();
    } else {
      onSelectTab(subId);
    }
  };

  const scrollSubMenu = (direction: "left" | "right") => {
    if (subMenuScrollRef.current) {
      const scrollAmount = direction === "left" ? -220 : 220;
      subMenuScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* 1. PRIMARY MAIN MENU TIER (5 Menu Utama Saja) */}
      <div className="w-full relative">
        <div
          ref={mainCategoriesScrollRef}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 px-0.5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const isSelected = activeCategory === cat.id;
            const hasUnread = cat.id === "community" && mailUnreadCount > 0;

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`group relative shrink-0 snap-start flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl font-mono text-xs font-black transition-all cursor-pointer select-none border active:scale-[0.98] ${
                  isSelected
                    ? "bg-slate-900/95 text-yellow-300 border-amber-400/80 shadow-lg shadow-amber-500/10 scale-[1.02]"
                    : "bg-slate-950/70 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800/90"
                }`}
              >
                {/* Active Indicator Backdrop */}
                {isSelected && (
                  <motion.div
                    layoutId="mainMenuHighlight"
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 rounded-xl border border-amber-400/50"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}

                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center relative z-10 transition-transform ${
                    isSelected ? "bg-amber-400 text-slate-950 scale-105" : "bg-slate-800/80 text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  )}
                </div>

                <div className="flex flex-col text-left relative z-10">
                  <span className="text-[11px] sm:text-xs tracking-tight font-black whitespace-nowrap">
                    {language === "id" ? cat.titleId : cat.titleEn}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono font-medium hidden sm:inline-block">
                    {cat.subItems.length} {language === "id" ? "Fitur" : "Features"}
                  </span>
                </div>

                {hasUnread && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[8px] font-black relative z-10 animate-pulse">
                    {mailUnreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DYNAMIC SUB-MENU CAROUSEL (Muncul Saat Menu Utama Diakses / Diklik) */}
      <div className="w-full relative bg-slate-950/90 border border-slate-800/80 rounded-2xl p-2.5 shadow-xl">
        <div className="flex items-center justify-between px-1.5 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-mono font-black uppercase text-amber-300 tracking-wider">
              {language === "id" ? activeCatObj.titleId : activeCatObj.titleEn}
            </span>
            <span className="text-[9px] text-slate-500 font-mono hidden md:inline">
              — {language === "id" ? activeCatObj.subtitleId : activeCatObj.subtitleEn}
            </span>
          </div>

          {/* Carousel Scroll Controls (Left & Right Glide) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollSubMenu("left")}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollSubMenu("right")}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Carousel Items */}
        <div
          ref={subMenuScrollRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory pt-2.5 pb-1 px-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <AnimatePresence mode="popLayout">
            {activeCatObj.subItems.map((sub) => {
              const SubIcon = sub.icon;
              const isActive = currentTab === sub.id;
              const badge = sub.badge;

              return (
                <motion.button
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => handleSubItemClick(sub.id)}
                  className={`shrink-0 snap-start flex items-center gap-2 py-2 px-3 sm:px-3.5 rounded-xl font-mono text-[11px] sm:text-xs font-bold transition-all cursor-pointer select-none active:scale-95 border ${
                    isActive
                      ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black border-yellow-300 shadow-md shadow-yellow-500/25 scale-[1.02]"
                      : "bg-slate-900/90 hover:bg-slate-800/90 text-slate-300 hover:text-white border-slate-800"
                  }`}
                >
                  <SubIcon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? "text-slate-950 scale-110" : "text-amber-400"
                    }`}
                  />
                  <span className="whitespace-nowrap font-bold">
                    {language === "id" ? sub.labelId : sub.labelEn}
                  </span>

                  {badge && badge > 0 ? (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[8px] font-black shrink-0 ${
                        isActive ? "bg-slate-950 text-yellow-400" : "bg-red-500 text-white animate-pulse"
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
