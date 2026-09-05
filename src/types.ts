export interface User {
  id: string;
  username: string;
  email: string;
  points: number;
  cores?: number;
  avatarUrl?: string;
  faction?: "Sentinel" | "Vanguard" | null;
  nameChangeCount?: number;
  lastDailyBonusAt?: string;
  lastLevel8BonusAt?: string;
  captureStreak?: number;
  lastCaptureDate?: string;
  lastRewardedAdClaim?: string;
  lastSeen?: string;
  isOnline?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  points: number;
  cores: number;
  totalCards: number;
  highestLevel: number;
  bestCard?: {
    id: string;
    name: string;
    rarity: string;
    level: number;
    element: string;
  } | null;
  isBot?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
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
  lat?: number;
  lng?: number;
  locationName?: string;
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
  style: "Sentinel" | "Vanguard";
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

export type SpotCategory = 
  | "taman" 
  | "jalan" 
  | "komplek" 
  | "cafe" 
  | "stasiun" 
  | "terminal" 
  | "halte" 
  | "others" 
  | "lapangan" 
  | "mall" 
  | "pantai"
  | "shelter_kucing"
  | "street_feeding"
  | "vet_clinic"
  | "landmark"
  | "tempat_ibadah";

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
  sponsoredEventId?: string;
}

export type SponsorEventType = "pet_shop" | "vet_clinic" | "pet_food_brand" | "shelter_rescue" | "community_event";

export interface SponsorshipEvent {
  id: string;
  title: string;
  titleEn?: string;
  sponsorName: string;
  type: SponsorEventType;
  bannerUrl: string;
  logoUrl?: string;
  tagline: string;
  taglineEn?: string;
  description: string;
  descriptionEn?: string;
  promoCode?: string;
  promoDiscount?: string;
  targetLink: string;
  rewardPoints?: number;
  rewardCores?: number;
  hasPhysicalLocation?: boolean;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  socialQuestGoal?: string;
  socialQuestGoalEn?: string;
  socialQuestCurrentPurchases?: number;
  socialQuestTargetPurchases?: number;
  socialImpactDescription?: string;
  socialImpactDescriptionEn?: string;
  createdAt: string;
  createdBy: string;
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

export type OfficialMailCategory = "welcome" | "patch_update" | "maintenance" | "system_reward" | "announcement";

export interface OfficialMail {
  id: string;
  title: string;
  category: OfficialMailCategory;
  sender: string;
  senderEmail: string;
  summary: string;
  content: string;
  reward?: {
    points?: number;
    cores?: number;
  };
  claimedUserIds?: string[];
  readUserIds?: string[];
  createdAt: string;
  pinned?: boolean;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  recipientId: string;
  recipientUsername: string;
  recipientAvatar?: string;
  content: string;
  createdAt: string;
  read: boolean;
  sharedPhotoUrl?: string;
  sharedLocation?: {
    lat: number;
    lng: number;
    name?: string;
  };
  sharedSpotName?: string;
}

export interface ConversationThread {
  partnerId: string;
  partnerUsername: string;
  partnerAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isBot?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  faction?: string;
}

export interface BeaconNode {
  id: string;
  name: string;
  nameEn?: string;
  element: "Api" | "Air" | "Tanah" | "Angin" | "Petir";
  x: number; // visual percentage (0-100)
  y: number; // visual percentage (0-100)
  lat: number;
  lng: number;
  connectedNodeIds: string[];
  isBase?: boolean;
  baseFaction?: "Sentinel" | "Vanguard" | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerFaction: "Sentinel" | "Vanguard" | null;
  ownerAvatar?: string;
  anchorCard: Card | null;
  garrisonDeck: Card[];
  capturedAt: string | null;
  lastClaimedAt: string | null;
  accumulatedCores: number;
  isActive: boolean; // supply line check: connected back to base/root
  defenseHp: number;
  maxDefenseHp: number;
  tier: 1 | 2 | 3;
  reinforcementsCount?: number;
  cooldownUntil?: string | null;
  cooldownRemainingSeconds?: number;
  isAdjacentLocked?: boolean;
  adjacentCooldownSeconds?: number;
  descriptionId?: string;
  descriptionEn?: string;
}

export interface TerritoryBattleLog {
  turn: number;
  attackerCardName: string;
  defenderCardName: string;
  damageDealt: number;
  elementalBonus: boolean;
  messageId: string;
  messageEn: string;
}

export interface TerritoryBattleResult {
  won: boolean;
  turns: TerritoryBattleLog[];
  damageToGarrison: number;
  nodeCaptured: boolean;
  coresRewarded: number;
  pointsRewarded: number;
}

export interface WarResetCountdown {
  capturedHQId: string;
  capturedHQName: string;
  capturedHQNameEn?: string;
  originalFaction: "Sentinel" | "Vanguard";
  capturedByFaction: "Sentinel" | "Vanguard";
  capturedByUserName: string;
  countdownUntil: string;
  startedAt: string;
  remainingSeconds: number;
}

export type BossSpeciesType = "kucing" | "tikus" | "anjing";
export type NekomonElement = "Api" | "Air" | "Tanah" | "Angin" | "Petir";

export interface BossSkill {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  element: NekomonElement;
  powerMultiplier: number;
  effectType?: "damage" | "aoe" | "critical" | "leech" | "rage";
}

export interface RaidBoss {
  id: string;
  name: string;
  nameEn: string;
  title: string;
  titleEn: string;
  speciesType: BossSpeciesType;
  level: number; // 5 - 30
  element: NekomonElement;
  buffElement: NekomonElement; // Boss has resistance/defense buff against this
  debuffElement: NekomonElement; // Boss is weak against this element (+75% extra dmg taken)
  buffDescription: string;
  buffDescriptionEn: string;
  debuffDescription: string;
  debuffDescriptionEn: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  imageUrl: string;
  locationName: string;
  cityId?: string;
  cityName?: string;
  latitude: number;
  longitude: number;
  spawnRadiusKm: number; // 10 km
  distanceMeters?: number;
  inRadius?: boolean;
  skills: BossSkill[];
  rewards: {
    cores: number;
    points: number;
    energyRefill: number;
    cardXp: number;
  };
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  isManual?: boolean;
  loreId?: string;
  loreEn?: string;
}

export interface RaidCombatSlot {
  slotIndex: number; // 0, 1, 2 (3 slots total)
  userId: string;
  username: string;
  faction?: "Sentinel" | "Vanguard" | null;
  card: Card;
  currentHp: number;
  maxHp: number;
  isReady: boolean;
  damageDealt: number;
}

export interface RaidLobbyRoom {
  id: string;
  roomCode: string;
  bossId: string;
  bossSnapshot: RaidBoss;
  hostUserId: string;
  hostUsername: string;
  isSinglePlayer: boolean;
  slots: (RaidCombatSlot | null)[];
  status: "waiting" | "in_battle" | "victory" | "defeat";
  currentTurn: number;
  bossCurrentHp: number;
  bossMaxHp: number;
  battleLogs: RaidBattleLog[];
  sharedRewardsClaimed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RaidBattleLog {
  turn: number;
  actor: string;
  actorType: "player" | "boss";
  cardName?: string;
  skillName?: string;
  element?: NekomonElement;
  damage: number;
  isCritical?: boolean;
  isSuperEffective?: boolean;
  isResisted?: boolean;
  messageId: string;
  messageEn: string;
  timestamp: string;
}




