import { NekomonSpot, SpotCategory } from "../types";

/**
 * Calculates distance in meters between two geographical points using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Formats distance into human readable text (e.g. "12m", "250m", "1.5 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Helper to offset lat/lng by approximate meters
 * 1 degree latitude ~ 111,000 meters
 * 1 degree longitude ~ 111,000 * cos(lat) meters
 */
export function offsetCoordinates(
  lat: number,
  lng: number,
  offsetNorthMeters: number,
  offsetEastMeters: number
): { lat: number; lng: number } {
  const deltaLat = offsetNorthMeters / 111000;
  const deltaLng = offsetEastMeters / (111000 * Math.cos(lat * (Math.PI / 180)));
  return {
    lat: Number((lat + deltaLat).toFixed(6)),
    lng: Number((lng + deltaLng).toFixed(6)),
  };
}

const SPOT_PRESETS: Array<{
  nameTemplate: string;
  category: SpotCategory;
  categoryLabel: string;
  targetCatName: string;
  iconEmoji: string;
  boostedElement: "Api" | "Air" | "Tanah" | "Angin" | "Petir";
  rarity: "Common" | "Rare" | "Epic" | "Legend";
  bonusPoints: number;
  bonusCores?: number;
  description: string;
  radiusMeters: number;
}> = [
  {
    nameTemplate: "Taman Kucing Merdeka",
    category: "taman",
    categoryLabel: "Taman Kota",
    targetCatName: "Kucing Calico Park",
    iconEmoji: "🌳",
    boostedElement: "Tanah",
    rarity: "Common",
    bonusPoints: 15,
    radiusMeters: 25,
    description: "Area taman hijau yang sering disinggahi kucing belang tiga yang lincah."
  },
  {
    nameTemplate: "Kopi Cat Corner",
    category: "cafe",
    categoryLabel: "Cafe & Warkop",
    targetCatName: "Kucing Barista Mocha",
    iconEmoji: "☕",
    boostedElement: "Air",
    rarity: "Rare",
    bonusPoints: 20,
    radiusMeters: 20,
    description: "Aroma kopi hangat menarik perhatian kucing berbulu cokelat keemasan."
  },
  {
    nameTemplate: "Stasiun Nekomon Central",
    category: "stasiun",
    categoryLabel: "Stasiun Transit",
    targetCatName: "Kucing Kilat Stasiun",
    iconEmoji: "🚉",
    boostedElement: "Petir",
    rarity: "Epic",
    bonusPoints: 30,
    bonusCores: 1,
    radiusMeters: 30,
    description: "Deru kereta membangkitkan aura listrik pada kucing hitam misterius!"
  },
  {
    nameTemplate: "Lapangan Merah Felis",
    category: "lapangan",
    categoryLabel: "Lapangan & Alun-alun",
    targetCatName: "Kucing Champion Oranye",
    iconEmoji: "⚽",
    boostedElement: "Api",
    rarity: "Rare",
    bonusPoints: 25,
    radiusMeters: 25,
    description: "Kucing oranye tangguh yang suka berlarian di tengah lapangan terbuka."
  },
  {
    nameTemplate: "Nekomon Grand Mall",
    category: "mall",
    categoryLabel: "Pusat Perbelanjaan",
    targetCatName: "Kucing Angora Anggun",
    iconEmoji: "🏢",
    boostedElement: "Angin",
    rarity: "Epic",
    bonusPoints: 35,
    radiusMeters: 20,
    description: "Kucing putih cantik dengan bulu lebat berangin di sekitar lobi utama."
  },
  {
    nameTemplate: "Danau Meow Bay",
    category: "pantai",
    categoryLabel: "Danau & Rawa",
    targetCatName: "Kucing Fisher Biru",
    iconEmoji: "🏖️",
    boostedElement: "Air",
    rarity: "Legend",
    bonusPoints: 50,
    bonusCores: 2,
    radiusMeters: 30,
    description: "Kucing legendaris langka yang pandai menangkap ikan di tepi air."
  },
  {
    nameTemplate: "Taman Bunga Sakura Meow",
    category: "taman",
    categoryLabel: "Taman Kota",
    targetCatName: "Kucing Persik Ghibli",
    iconEmoji: "🌸",
    boostedElement: "Angin",
    rarity: "Rare",
    bonusPoints: 20,
    radiusMeters: 25,
    description: "Kelopak bunga Sakura berguguran di sekitar kucing berbulu merah muda."
  },
  {
    nameTemplate: "Warkop Meow Latte",
    category: "cafe",
    categoryLabel: "Cafe & Warkop",
    targetCatName: "Kucing Espresso Kilat",
    iconEmoji: "☕",
    boostedElement: "Petir",
    rarity: "Common",
    bonusPoints: 15,
    radiusMeters: 20,
    description: "Tempat nongkrong santai yang selalu diramaikan anak kucing imut."
  }
];

/**
 * Generates dynamic Nekomon spots surrounding a center coordinate
 */
export function generateNekomonSpots(centerLat: number, centerLng: number): NekomonSpot[] {
  // Preset offsets (meters relative to center) so some spots are 15-25m away (instant capture range) and others 50-180m away
  const offsets = [
    { north: 12, east: 14 },   // ~18m (Inside 25m radius right away!)
    { north: -60, east: 40 },  // ~72m
    { north: 90, east: -50 },  // ~103m
    { north: -120, east: -90 },// ~150m
    { north: 40, east: 140 },  // ~145m
    { north: -30, east: -25 }, // ~39m
  ];

  return offsets.map((off, index) => {
    const preset = SPOT_PRESETS[index % SPOT_PRESETS.length];
    const coords = offsetCoordinates(centerLat, centerLng, off.north, off.east);
    
    return {
      id: `spot_${index + 1}_${Date.now()}`,
      name: preset.nameTemplate,
      category: preset.category,
      categoryLabel: preset.categoryLabel,
      lat: coords.lat,
      lng: coords.lng,
      radiusMeters: preset.radiusMeters,
      boostedElement: preset.boostedElement,
      bonusPoints: preset.bonusPoints,
      bonusCores: preset.bonusCores,
      targetCatName: preset.targetCatName,
      rarity: preset.rarity,
      iconEmoji: preset.iconEmoji,
      description: preset.description
    };
  });
}
