export interface PlayerBadge {
  levelRequirement: number;
  id: string;
  titleId: string;
  titleEn: string;
  badgeNameId: string;
  badgeNameEn: string;
  descId: string;
  descEn: string;
  emoji: string;
  colorTheme: string;
  badgeClass: string;
  glowClass: string;
  borderClass: string;
  textClass: string;
}

export const PLAYER_BADGES: PlayerBadge[] = [
  {
    levelRequirement: 10,
    id: "badge_lv10",
    titleId: "Level 10 - Pionir Nekomon",
    titleEn: "Level 10 - Nekomon Pioneer",
    badgeNameId: "Iron Paw",
    badgeNameEn: "Iron Paw",
    descId: "Penghargaan khusus untuk Trainer yang berhasil mencapai Level 10! Terbukti memiliki fondasi tim Nekomon yang tangguh.",
    descEn: "Special recognition for Trainers reaching Level 10! Proven to build a resilient Nekomon squad.",
    emoji: "🥉",
    colorTheme: "amber",
    badgeClass: "bg-amber-950/80 border-amber-600/70 text-amber-300",
    glowClass: "shadow-[0_0_20px_rgba(217,119,6,0.4)]",
    borderClass: "border-amber-500/50",
    textClass: "text-amber-400"
  },
  {
    levelRequirement: 20,
    id: "badge_lv20",
    titleId: "Level 20 - Ksatria Arena",
    titleEn: "Level 20 - Arena Knight",
    badgeNameId: "Silver Claws",
    badgeNameEn: "Silver Claws",
    descId: "Diberikan kepada Trainer Level 20. Diakui sebagai petarung berwawasan luas dan penakluk berbagai tantangan arena.",
    descEn: "Awarded to Level 20 Trainers. Recognized as an insightful battler and conqueror of arena trials.",
    emoji: "🥈",
    colorTheme: "slate",
    badgeClass: "bg-slate-900/90 border-slate-300/70 text-slate-100",
    glowClass: "shadow-[0_0_20px_rgba(203,213,225,0.4)]",
    borderClass: "border-slate-300/50",
    textClass: "text-slate-200"
  },
  {
    levelRequirement: 30,
    id: "badge_lv30",
    titleId: "Level 30 - Panglima Kosmik",
    titleEn: "Level 30 - Cosmic Commander",
    badgeNameId: "Golden Fangs",
    badgeNameEn: "Golden Fangs",
    descId: "Prestasi gemilang Trainer Level 30! Menguasai strategi tempur tingkat lanjut dan koordinasi skuad Nekomon elit.",
    descEn: "Glorious achievement for Level 30 Trainers! Mastered advanced battle strategies and elite Nekomon coordination.",
    emoji: "🥇",
    colorTheme: "yellow",
    badgeClass: "bg-yellow-950/80 border-yellow-400/80 text-yellow-300",
    glowClass: "shadow-[0_0_25px_rgba(234,179,8,0.5)]",
    borderClass: "border-yellow-400/60",
    textClass: "text-yellow-400"
  },
  {
    levelRequirement: 40,
    id: "badge_lv40",
    titleId: "Level 40 - Legenda Astral",
    titleEn: "Level 40 - Astral Legend",
    badgeNameId: "Diamond Whiskers",
    badgeNameEn: "Diamond Whiskers",
    descId: "Pencapaian luar biasa Trainer Level 40! Namanya diukir dalam sejarah sebagai Legenda Astral yang tak tertandingi.",
    descEn: "Extraordinary milestone for Level 40 Trainers! Name carved in history as an matchless Astral Legend.",
    emoji: "💎",
    colorTheme: "cyan",
    badgeClass: "bg-cyan-950/80 border-cyan-400/80 text-cyan-200",
    glowClass: "shadow-[0_0_30px_rgba(6,182,212,0.6)]",
    borderClass: "border-cyan-400/60",
    textClass: "text-cyan-300"
  },
  {
    levelRequirement: 50,
    id: "badge_lv50",
    titleId: "Level 50 - Dewa Nekomon",
    titleEn: "Level 50 - Nekomon God Sovereign",
    badgeNameId: "Mythic Crown",
    badgeNameEn: "Mythic Crown",
    descId: "TAHTA TERTINGGI LEVEL 50! Penguasa Takhta Mitis Kosmik dengan aura dewa yang menggetarkan seluruh semesta!",
    descEn: "SUPREME THRONED LEVEL 50! Ruler of the Cosmic Mythic Realm radiating godly aura across the multiverse!",
    emoji: "👑",
    colorTheme: "pink",
    badgeClass: "bg-gradient-to-r from-pink-950/90 via-purple-950/90 to-indigo-950/90 border-pink-400 text-pink-100",
    glowClass: "shadow-[0_0_35px_rgba(236,72,153,0.7)] animate-pulse",
    borderClass: "border-pink-400/80",
    textClass: "text-pink-300"
  }
];

export interface TrainerProgress {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  totalExp: number;
  rankTitleId: string;
  rankTitleEn: string;
  highestBadge: PlayerBadge | null;
  nextBadge: PlayerBadge | null;
  levelsUntilNextBadge: number;
}

// XP required to level up from level L to L+1
export function getXpRequiredForLevel(level: number): number {
  return Math.floor(180 + Math.pow(level, 1.32) * 48);
}

// Get rank title based on trainer level
export function getRankTitle(level: number): { id: string; en: string } {
  if (level >= 50) return { id: "Dewa Nekomon", en: "Nekomon God Sovereign" };
  if (level >= 40) return { id: "Legenda Astral", en: "Astral Legend" };
  if (level >= 30) return { id: "Panglima Kosmik", en: "Cosmic Commander" };
  if (level >= 20) return { id: "Ksatria Arena", en: "Arena Knight" };
  if (level >= 10) return { id: "Pionir Lapangan", en: "Field Pioneer" };
  if (level >= 5) return { id: "Penjelajah Kucing", en: "Cat Explorer" };
  return { id: "Pemula Nekomon", en: "Nekomon Novice" };
}

// Comprehensive Trainer Progress & XP calculation
export function getTrainerProgress(
  cardsCount: number,
  totalCardLevels: number,
  points: number = 0,
  cores: number = 0,
  capturesCount: number = 0,
  territoryCount: number = 0
): TrainerProgress {
  // Balanced EXP contribution weights
  const cardExp = Math.max(0, cardsCount) * 120;
  const levelExp = Math.max(0, totalCardLevels) * 60;
  const captureExp = Math.max(0, capturesCount) * 40;
  const pointExp = Math.floor(Math.max(0, points) * 0.4);
  const coreExp = Math.max(0, cores) * 5;
  const territoryExp = Math.max(0, territoryCount) * 250;

  const totalExp = Math.max(0, cardExp + levelExp + captureExp + pointExp + coreExp + territoryExp);

  let currentLevel = 1;
  let accumulatedXp = 0;

  // Step through level thresholds
  while (currentLevel < 100) {
    const neededForNext = getXpRequiredForLevel(currentLevel);
    if (accumulatedXp + neededForNext <= totalExp) {
      accumulatedXp += neededForNext;
      currentLevel++;
    } else {
      break;
    }
  }

  const currentLevelXp = Math.max(0, totalExp - accumulatedXp);
  const nextLevelXp = getXpRequiredForLevel(currentLevel);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentLevelXp / nextLevelXp) * 100)));

  const rank = getRankTitle(currentLevel);
  const highestBadge = getHighestBadge(currentLevel);
  const nextBadge = PLAYER_BADGES.find(b => b.levelRequirement > currentLevel) || null;
  const levelsUntilNextBadge = nextBadge ? Math.max(0, nextBadge.levelRequirement - currentLevel) : 0;

  return {
    level: currentLevel,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
    totalExp,
    rankTitleId: rank.id,
    rankTitleEn: rank.en,
    highestBadge,
    nextBadge,
    levelsUntilNextBadge
  };
}

export function getTrainerLevel(
  cardsCount: number, 
  totalCardLevels: number, 
  points: number, 
  cores: number = 0, 
  capturesCount: number = 0,
  territoryCount: number = 0
): number {
  return getTrainerProgress(cardsCount, totalCardLevels, points, cores, capturesCount, territoryCount).level;
}

export function getUnlockedBadges(trainerLevel: number): PlayerBadge[] {
  return PLAYER_BADGES.filter(b => trainerLevel >= b.levelRequirement);
}

export function getHighestBadge(trainerLevel: number): PlayerBadge | null {
  const unlocked = getUnlockedBadges(trainerLevel);
  if (unlocked.length === 0) return null;
  return unlocked[unlocked.length - 1];
}
