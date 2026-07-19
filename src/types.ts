export interface User {
  id: string;
  username: string;
  email: string;
  points: number;
  cores?: number;
  lastDailyBonusAt?: string;
}

export interface Mission {
  progress: number;
  target: number;
  completed: boolean;
  capturesInLast24Hours: number;
  bonusPoints: number;
  nextResetMs: number;
}

export interface Capture {
  id: string;
  userId: string;
  photoUrl: string;
  isForged: boolean;
  createdAt: string;
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
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  error?: string;
}
