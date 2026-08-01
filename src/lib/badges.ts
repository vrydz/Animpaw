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

export function getTrainerLevel(cardsCount: number, totalCardLevels: number, points: number): number {
  const calculated = Math.floor(1 + (cardsCount * 1.5) + (totalCardLevels * 0.8) + ((points || 0) / 25));
  return Math.max(1, calculated);
}

export function getUnlockedBadges(trainerLevel: number): PlayerBadge[] {
  return PLAYER_BADGES.filter(b => trainerLevel >= b.levelRequirement);
}

export function getHighestBadge(trainerLevel: number): PlayerBadge | null {
  const unlocked = getUnlockedBadges(trainerLevel);
  if (unlocked.length === 0) return null;
  return unlocked[unlocked.length - 1];
}
