export interface User {
  id: string;
  username: string;
  email: string;
  points: number;
  cores?: number;
  avatarUrl?: string;
  nameChangeCount?: number;
  lastDailyBonusAt?: string;
  lastLevel8BonusAt?: string;
  captureStreak?: number;
  lastCaptureDate?: string;
}

export interface Mission {
  progress: number;
  target: number;
  completed: boolean;
  capturesInLast24Hours: number;
  bonusPoints: number;
  nextResetMs: number;
  
  highestCardLevel?: number;
  level8Target?: number;
  hasCardAboveLevel8?: boolean;
  level8Completed?: boolean;
  level8BonusPoints?: number;
  level8BonusCores?: number;
  level8NextResetMs?: number;
}

export interface Capture {
  id: string;
  userId: string;
  photoUrl: string;
  isForged: boolean;
  createdAt: string;
  spotId?: string;
  spotName?: string;
}

export interface EvolutionLog {
  rarity: "Common" | "Rare" | "Epic" | "Legend" | "Mythic";
  name: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  skillName: string;
  skillDesc: string;
  imageUrl: string;
  evolvedAt: string;
}

export interface Card {
  id: string;
  userId: string;
  captureId: string;
  name: string;
  element: "Api" | "Air" | "Tanah" | "Angin" | "Petir";
  style: "Sentinel" | "Scourge";
  rarity: "Common" | "Rare" | "Epic" | "Legend" | "Mythic";
  hp: number;
  atk: number;
  def: number;
  spd: number;
  skillName: string;
  skillDesc: string;
  imageUrl: string;
  geminiUsed: boolean;
  createdAt: string;
  level?: number;
  xp?: number;
  maxXp?: number;
  evolutionHistory?: EvolutionLog[];
  energy?: number;
  maxEnergy?: number;
  lastEnergyRefillAt?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  error?: string;
}

export type SpotCategory = "taman" | "jalan" | "komplek" | "cafe" | "stasiun" | "terminal" | "halte" | "others" | "lapangan" | "mall" | "pantai";

export interface NekomonSpot {
  id: string;
  name: string;
  category: SpotCategory;
  categoryLabel: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  boostedElement: "Api" | "Air" | "Tanah" | "Angin" | "Petir";
  bonusPoints: number;
  bonusCores?: number;
  targetCatName: string;
  rarity: "Common" | "Rare" | "Epic" | "Legend";
  iconEmoji: string;
  description: string;
  isCommunity?: boolean;
  submittedBy?: string;
  votes?: number;
  createdAt?: string;
}

export interface ExplorationDailyQuests {
  distanceTraveledMeters: number; // e.g. 0 -> 1000m
  distanceTargetMeters: number;   // 1000m
  distanceClaimed: boolean;

  catsCapturedToday: number;      // 0 -> 3
  catsTarget: number;             // 3
  catsClaimed: boolean;

  spotVisitedToday: number;       // 0 -> 1
  spotTarget: number;             // 1
  spotClaimed: boolean;
}

