import { RaidBoss, BossSpeciesType, NekomonElement } from "../types";

// Forged Boss Artwork (Mapped directly to high-definition forged images from user reference dog/cat/rat assets)
export const FORGED_BOSS_ARTWORK_URLS: Record<BossSpeciesType, Record<NekomonElement, string>> = {
  kucing: {
    Api: "/images/bosses/boss_cat_api.jpg",
    Air: "/images/bosses/boss_cat_air.jpg",
    Tanah: "/images/bosses/boss_cat_tanah.jpg",
    Angin: "/images/bosses/boss_cat_angin.jpg",
    Petir: "/images/bosses/boss_cat_petir.jpg"
  },
  anjing: {
    Api: "/images/bosses/boss_dog_api.jpg",
    Air: "/images/bosses/boss_dog_air.jpg",
    Tanah: "/images/bosses/boss_dog_tanah.jpg",
    Angin: "/images/bosses/boss_dog_angin.jpg",
    Petir: "/images/bosses/boss_dog_petir.jpg"
  },
  tikus: {
    Api: "/images/bosses/boss_rat_api.jpg",
    Air: "/images/bosses/boss_rat_air.jpg",
    Tanah: "/images/bosses/boss_rat_tanah.jpg",
    Angin: "/images/bosses/boss_rat_angin.jpg",
    Petir: "/images/bosses/boss_rat_petir.jpg"
  }
};

export function generateBossArtwork(
  speciesType: BossSpeciesType,
  name: string,
  element: NekomonElement,
  level: number
): string {
  const forgedArtwork = FORGED_BOSS_ARTWORK_URLS[speciesType]?.[element];
  if (forgedArtwork) {
    return forgedArtwork;
  }

  // High-fidelity SVG fallback if image is not reachable
  const elementColors: Record<NekomonElement, { bg1: string; bg2: string; glow: string; accent: string; rune: string; icon: string }> = {
    Api: { bg1: "#2a0800", bg2: "#7a1400", glow: "#ff4d00", accent: "#ffaa00", rune: "IGNIS", icon: "🔥" },
    Air: { bg1: "#001830", bg2: "#003b73", glow: "#00b4d8", accent: "#90e0ef", rune: "AQUA", icon: "💧" },
    Tanah: { bg1: "#1f1404", bg2: "#4a350d", glow: "#10b981", accent: "#34d399", rune: "TERRA", icon: "⛰️" },
    Angin: { bg1: "#00201d", bg2: "#00594f", glow: "#2dd4bf", accent: "#5eead4", rune: "VENTUS", icon: "🌪️" },
    Petir: { bg1: "#220038", bg2: "#56008c", glow: "#facc15", accent: "#fde047", rune: "FULGUR", icon: "⚡" }
  };

  const theme = elementColors[element] || elementColors.Api;
  const isHighLevel = level >= 20;

  let creatureShape = "";
  if (speciesType === "kucing") {
    creatureShape = `
      <polygon points="120,180 150,70 190,145" fill="${theme.accent}" opacity="0.9" />
      <polygon points="280,180 250,70 210,145" fill="${theme.accent}" opacity="0.9" />
      <ellipse cx="200" cy="210" rx="90" ry="80" fill="#0f172a" stroke="${theme.glow}" stroke-width="6" />
      <polygon points="155,195 175,190 170,210 150,205" fill="${theme.accent}" />
      <polygon points="245,195 225,190 230,210 250,205" fill="${theme.accent}" />
      <polygon points="185,230 190,248 195,230" fill="#ffffff" />
      <polygon points="205,230 210,248 215,230" fill="#ffffff" />
    `;
  } else if (speciesType === "tikus") {
    creatureShape = `
      <circle cx="125" cy="130" r="55" fill="#0f172a" stroke="${theme.glow}" stroke-width="6" />
      <circle cx="275" cy="130" r="55" fill="#0f172a" stroke="${theme.glow}" stroke-width="6" />
      <ellipse cx="200" cy="225" rx="75" ry="90" fill="#0b0f19" stroke="${theme.glow}" stroke-width="6" />
      <rect x="190" y="245" width="9" height="28" rx="2" fill="#ffffff" stroke="${theme.accent}" stroke-width="2" />
      <rect x="201" y="245" width="9" height="28" rx="2" fill="#ffffff" stroke="${theme.accent}" stroke-width="2" />
    `;
  } else {
    creatureShape = `
      <polygon points="110,140 130,50 175,120" fill="${theme.accent}" />
      <polygon points="290,140 270,50 225,120" fill="${theme.accent}" />
      <path d="M 130,170 L 200,120 L 270,170 L 250,270 L 150,270 Z" fill="#0f172a" stroke="${theme.glow}" stroke-width="6" />
    `;
  }

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <radialGradient id="bgGrad" cx="50%" cy="45%" r="70%">
        <stop offset="0%" stop-color="${theme.bg2}" />
        <stop offset="70%" stop-color="${theme.bg1}" />
        <stop offset="100%" stop-color="#020617" />
      </radialGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bgGrad)" />
    <g>${creatureShape}</g>
    <text x="200" y="370" fill="${theme.accent}" font-family="monospace" font-weight="bold" font-size="12" text-anchor="middle">
      ★ RAID BOSS • ${speciesType.toUpperCase()} (${element.toUpperCase()}) ★
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export const RAID_BOSS_TEMPLATES: Array<Omit<RaidBoss, "id" | "latitude" | "longitude" | "createdAt" | "expiresAt">> = [
  // ==========================================
  // --- KUCING (CATS - Forged Bosses) ---
  // ==========================================
  {
    name: "Oyen Berserker Purba",
    nameEn: "Ancient Ginger Berserker",
    title: "Penguasa Jalanan Liar Berapi",
    titleEn: "Lord of Wild Magma Alleys",
    speciesType: "kucing",
    level: 6,
    element: "Api",
    buffElement: "Api",
    debuffElement: "Air",
    buffDescription: "Menyerap 40% kerusakan api dan meningkatkan serangan sebesar 25%.",
    buffDescriptionEn: "Absorbs 40% Fire damage and gains +25% attack boost.",
    debuffDescription: "Sangat rapuh terhadap serangan Air (Kerusakan diterima +75%).",
    debuffDescriptionEn: "Highly vulnerable to Water attacks (Takes +75% bonus damage).",
    hp: 4200,
    maxHp: 4200,
    atk: 145,
    def: 75,
    spd: 90,
    imageUrl: "/images/bosses/boss_cat_api.jpg",
    locationName: "Taman Suropati & Sekitarnya",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Cakaran Cakar Menyala",
        nameEn: "Flaming Claw Slash",
        description: "Mencakar 1 kartu dengan kobaran api bertemperatur tinggi.",
        descriptionEn: "Slashes 1 card with scorching high-temperature flames.",
        element: "Api",
        powerMultiplier: 1.3,
        effectType: "damage"
      },
      {
        name: "Raungan Oyen Menggelegar",
        nameEn: "Roar of the Stray King",
        description: "Menyerang seluruh 3 kartu sekaligus dengan gelombang panas.",
        descriptionEn: "Strikes all 3 player cards at once with an intense heatwave.",
        element: "Api",
        powerMultiplier: 0.95,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 3,
      points: 150,
      energyRefill: 25,
      cardXp: 200
    },
    isActive: true,
    loreId: "Kucing oyen legendaris berwajah garang yang ditempa baju zirah magma runic membara.",
    loreEn: "A ferocious legendary ginger cat forged with blazing runic magma battle plate."
  },
  {
    name: "Bastet Mecha-Sphynx",
    nameEn: "Bastet Mecha-Sphynx",
    title: "Pelindung Piramida Monolitik",
    titleEn: "Guardian of Ancient Granite Pyramids",
    speciesType: "kucing",
    level: 12,
    element: "Tanah",
    buffElement: "Tanah",
    debuffElement: "Angin",
    buffDescription: "Kulit pasir padat mereduksi 50% serangan fisik dan Tanah.",
    buffDescriptionEn: "Dense sandstone armor reduces Physical & Earth damage by 50%.",
    debuffDescription: "Rentan terhadap hembusan badai Angin kencang (Kerusakan +75%).",
    debuffDescriptionEn: "Vulnerable to tempest Wind erosion (Takes +75% bonus damage).",
    hp: 7800,
    maxHp: 7800,
    atk: 220,
    def: 160,
    spd: 70,
    imageUrl: "/images/bosses/boss_cat_tanah.jpg",
    locationName: "Kawasan Monas & Cagar Budaya",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Hentakan Piramida Granit",
        nameEn: "Granite Pyramid Slam",
        description: "Menghantam target dengan pilar batu monolitik kuno.",
        descriptionEn: "Crushes target with an ancient monolithic stone pillar.",
        element: "Tanah",
        powerMultiplier: 1.4,
        effectType: "damage"
      },
      {
        name: "Kutukan Pasir Firaun",
        nameEn: "Pharaoh Sand Curse",
        description: "Menebarkan debu gurun tajam yang melukai seluruh tim penyerang.",
        descriptionEn: "Scatters sharp desert dust damaging the entire raid squad.",
        element: "Tanah",
        powerMultiplier: 1.1,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 4,
      points: 260,
      energyRefill: 30,
      cardXp: 320
    },
    isActive: true,
    loreId: "Dewa kucing Mesir kuno yang bangkit dalam sasis bio-cybernetic berbahan batu granit berlapis emas.",
    loreEn: "Ancient Egyptian feline deity resurrected within a bio-cybernetic granite chassis with gold hieroglyphs."
  },
  {
    name: "Oceanus Bastet Tidal Queen",
    nameEn: "Oceanus Bastet Tidal Queen",
    title: "Ratu Gelombang Samudera Biru",
    titleEn: "Queen of the Abyssal Tides",
    speciesType: "kucing",
    level: 16,
    element: "Air",
    buffElement: "Air",
    debuffElement: "Petir",
    buffDescription: "Menyerap 45% kerusakan air dan memulihkan HP tiap giliran.",
    buffDescriptionEn: "Absorbs 45% water damage and regenerates HP each round.",
    debuffDescription: "Sangat rentan terhadap sengatan Petir Halilintar (+75%).",
    debuffDescriptionEn: "Highly vulnerable to Thunder shock discharges (+75%).",
    hp: 9600,
    maxHp: 9600,
    atk: 270,
    def: 175,
    spd: 120,
    imageUrl: "/images/bosses/boss_cat_air.jpg",
    locationName: "Kawasan Danau / Pelabuhan Kota",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Tebasan Cakar Tsunami",
        nameEn: "Tsunami Claw Cleave",
        description: "Tebasan air bertekanan tinggi yang menembus pertahanan lawan.",
        descriptionEn: "High-pressure water slice piercing through enemy defense.",
        element: "Air",
        powerMultiplier: 1.45,
        effectType: "critical"
      },
      {
        name: "Pusaran Ombak Samudra",
        nameEn: "Oceanic Maelstrom",
        description: "Pusaran air dingin menghantam seluruh 3 formasi kartu.",
        descriptionEn: "Sub-zero vortex battering all 3 battle slots.",
        element: "Air",
        powerMultiplier: 1.2,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 5,
      points: 340,
      energyRefill: 35,
      cardXp: 360
    },
    isActive: true,
    loreId: "Kucing air mistis dengan tanduk naga hidro dan zirah kristal laut dalam.",
    loreEn: "A mythical water feline wielding hydro dragon horns and deep-sea crystalline armor."
  },
  {
    name: "Celestial Zephyr Felis",
    nameEn: "Celestial Zephyr Felis",
    title: "Penguasa Angin Badai Langit",
    titleEn: "Sovereign of Celestial Gales",
    speciesType: "kucing",
    level: 22,
    element: "Angin",
    buffElement: "Angin",
    debuffElement: "Api",
    buffDescription: "Sayap angin menolak 50% serangan fisik dan kecepatan gerak bertambah tinggi.",
    buffDescriptionEn: "Gale wings deflect 50% physical attacks and massively boosts speed.",
    debuffDescription: "Sayap angin sangat rentan terhadap kobaran Api (+80%).",
    debuffDescriptionEn: "Wind feather armor is highly flammable against Fire (+80%).",
    hp: 13200,
    maxHp: 13200,
    atk: 360,
    def: 210,
    spd: 185,
    imageUrl: "/images/bosses/boss_cat_angin.jpg",
    locationName: "Bukit Angin & Menara Landmark",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Pedang Angin Topan Kucing",
        nameEn: "Tempest Gale Blade",
        description: "Bilah angin berkecepatan sonik mencabik target tunggal.",
        descriptionEn: "Sonic-speed wind blade slicing through single target.",
        element: "Angin",
        powerMultiplier: 1.55,
        effectType: "critical"
      },
      {
        name: "Badai Tornado Zamrud",
        nameEn: "Emerald Tornado Tempest",
        description: "Pusaran tornado hijau menyerang seluruh 3 slot penyerang.",
        descriptionEn: "Green vortex tornado sweeping all 3 attacking cards.",
        element: "Angin",
        powerMultiplier: 1.3,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 6,
      points: 460,
      energyRefill: 40,
      cardXp: 460
    },
    isActive: true,
    loreId: "Kucing dewa bersayap angin zamrud yang membelah awan dengan cakar badai.",
    loreEn: "Celestial winged feline cleaving storm clouds with emerald gale wings."
  },
  {
    name: "Emperor Spark Raijin Cat",
    nameEn: "Emperor Spark Raijin Cat",
    title: "Kaisar Petir Sejuta Volt",
    titleEn: "Million-Volt Raijin Cat Emperor",
    speciesType: "kucing",
    level: 30,
    element: "Petir",
    buffElement: "Petir",
    debuffElement: "Tanah",
    buffDescription: "Aliran petir murni memberikan kekebalan terhadap 60% serangan non-Tanah.",
    buffDescriptionEn: "Pure lightning current mitigates 60% non-Earth damage.",
    debuffDescription: "Tanah dan Bumi memutus konduksi listrik secara mutlak (+80%).",
    debuffDescriptionEn: "Ground and Earth absorbs electrical field causing +80% damage.",
    hp: 19800,
    maxHp: 19800,
    atk: 490,
    def: 280,
    spd: 195,
    imageUrl: "/images/bosses/boss_cat_petir.jpg",
    locationName: "Pusat Gardu Induk & Puncak Kota",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Kilat Penghancur Raijin",
        nameEn: "Raijin Cataclysm Bolt",
        description: "Petir sejuta volt menyengat satu target hingga hangus.",
        descriptionEn: "Million-volt lightning strike obliterating primary target.",
        element: "Petir",
        powerMultiplier: 1.8,
        effectType: "critical"
      },
      {
        name: "Hujan Guntur Halilintar",
        nameEn: "Thunderstorm Cataclysm",
        description: "Badai petir melanda seluruh 3 kartu arena secara serentak.",
        descriptionEn: "Cataclysmic thunderstorm striking all 3 card slots simultaneously.",
        element: "Petir",
        powerMultiplier: 1.45,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 8,
      points: 680,
      energyRefill: 50,
      cardXp: 620
    },
    isActive: true,
    loreId: "Wujud forged pamungkas sang kucing dewa petir dengan tanduk plasma bertegangan tinggi.",
    loreEn: "The ultimate forged thunder deity feline wielding crackling high-voltage plasma."
  },

  // ==========================================
  // --- ANJING (DOGS - Forged Bosses) ---
  // ==========================================
  {
    name: "Glacial Frosthound Howler",
    nameEn: "Glacial Frosthound Howler",
    title: "Serigala Es Kutub Utara",
    titleEn: "Arctic Frost Howler",
    speciesType: "anjing",
    level: 9,
    element: "Air",
    buffElement: "Air",
    debuffElement: "Petir",
    buffDescription: "Bulu es membekukan benturan dan mengurangi 40% kerusakan air/dingin.",
    buffDescriptionEn: "Frost fur freezes incoming shocks, mitigating 40% water damage.",
    debuffDescription: "Es mudah retak akibat sengatan arus Petir (Kerusakan +75%).",
    debuffDescriptionEn: "Ice armor shatters under Thunder current discharges (+75%).",
    hp: 5800,
    maxHp: 5800,
    atk: 180,
    def: 110,
    spd: 110,
    imageUrl: "/images/bosses/boss_dog_air.jpg",
    locationName: "Taman Hutan Kota / Daerah Perbukitan",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Taring Pembeku Gletser",
        nameEn: "Glacier Freeze Fang",
        description: "Gigitan taring es yang membekukan target seketika.",
        descriptionEn: "Glacial ice fang bite chilling target instantly.",
        element: "Air",
        powerMultiplier: 1.35,
        effectType: "damage"
      },
      {
        name: "Lolongan Badai Salju",
        nameEn: "Blizzard Howl Burst",
        description: "Lolongan kencang memanggil badai es ke seluruh tim penyerang.",
        descriptionEn: "Piercing howl summoning a blizzard on all 3 player cards.",
        element: "Air",
        powerMultiplier: 1.0,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 3,
      points: 190,
      energyRefill: 25,
      cardXp: 260
    },
    isActive: true,
    loreId: "Anjing serigala berbulu es kristal dengan rahang buas yang menghembuskan nafas beku gletser.",
    loreEn: "A ferocious frosthound with diamond ice plating exhaling sub-zero blizzard breath."
  },
  {
    name: "Cyber-Anubis High Sentinel",
    nameEn: "Cyber-Anubis High Sentinel",
    title: "Prajurit Anjing Bio-Sintetis Penjaga Gerbang",
    titleEn: "Bio-Synthetic Gate Guardian",
    speciesType: "anjing",
    level: 18,
    element: "Tanah",
    buffElement: "Tanah",
    debuffElement: "Angin",
    buffDescription: "Perisai cyber-titanium memantulkan 40% serangan tanah.",
    buffDescriptionEn: "Cyber-titanium shield reflects 40% of earth impacts.",
    debuffDescription: "Turbulensi Angin mengganggu modul melayang anti-gravitasi (+75%).",
    debuffDescriptionEn: "Wind turbulence destabilizes anti-grav hovering modules (+75%).",
    hp: 11200,
    maxHp: 11200,
    atk: 310,
    def: 200,
    spd: 130,
    imageUrl: "/images/bosses/boss_dog_tanah.jpg",
    locationName: "Kompleks Monumen & Cagar Sejarah",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Tombak Penghakiman Anubis",
        nameEn: "Spear of Judgment",
        description: "Tusukan tombak laser cybernetic bertenaga inti bumi.",
        descriptionEn: "Cybernetic laser spear powered by tectonic core energy.",
        element: "Tanah",
        powerMultiplier: 1.45,
        effectType: "critical"
      },
      {
        name: "Gelombang Gravitasi Emas",
        nameEn: "Golden Gravitational Wave",
        description: "Hentakan medan gravitasi meremukkan 3 posisi kartu.",
        descriptionEn: "Gravitational pulse crushing all 3 frontline battle positions.",
        element: "Tanah",
        powerMultiplier: 1.2,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 5,
      points: 390,
      energyRefill: 35,
      cardXp: 410
    },
    isActive: true,
    loreId: "Prajurit anjing pelindung berzirah batu obsidian hitam dan aksen emas berteknologi Sentinel.",
    loreEn: "Canine guardian warrior forged with black obsidian power armor and golden Sentinel runes."
  },
  {
    name: "Thunderfang Fenrir Direwolf",
    nameEn: "Thunderfang Fenrir Direwolf",
    title: "Serigala Petir Penghancur Belenggu",
    titleEn: "Unchained Thunder Direwolf",
    speciesType: "anjing",
    level: 20,
    element: "Petir",
    buffElement: "Petir",
    debuffElement: "Tanah",
    buffDescription: "Tubuh listrik mengalirkan arus tegangan tinggi (+30% ATK).",
    buffDescriptionEn: "Electrified body generates constant high-voltage current (+30% ATK).",
    debuffDescription: "Bumi dan Tanah menyerap habis arus listriknya (+75% DMG).",
    debuffDescriptionEn: "Earth and Ground grounding neutralizes its lightning core (+75% DMG).",
    hp: 12800,
    maxHp: 12800,
    atk: 350,
    def: 190,
    spd: 190,
    imageUrl: "/images/bosses/boss_dog_petir.jpg",
    locationName: "Menara Pemancar & Bukit Kilat",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Gigitan Halilintar Fenrir",
        nameEn: "Fenrir Thunderfang",
        description: "Sergapan taring petir berkecepatan suara.",
        descriptionEn: "Supersonic speed lightning fang lunge.",
        element: "Petir",
        powerMultiplier: 1.5,
        effectType: "damage"
      },
      {
        name: "Badai Petir Rantai 100.000V",
        nameEn: "Chain Thunderstorm 100kV",
        description: "Ledakan petir berantai menyengat 3 slot petarung.",
        descriptionEn: "Chain lightning explosion zapping all 3 battle slots.",
        element: "Petir",
        powerMultiplier: 1.25,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 5,
      points: 420,
      energyRefill: 35,
      cardXp: 430
    },
    isActive: true,
    loreId: "Serigala pemburu berotot baja dengan taring menyala elektro-plasma biru berkilauan.",
    loreEn: "Muscular direhound forged with sparkling electro-plasma fangs and cybernetic cyberplates."
  },
  {
    name: "Tempest Howler Direhound",
    nameEn: "Tempest Howler Direhound",
    title: "Lolongan Badai Topan Pegunungan",
    titleEn: "Mountain Tempest Howler",
    speciesType: "anjing",
    level: 24,
    element: "Angin",
    buffElement: "Angin",
    debuffElement: "Api",
    buffDescription: "Arus angin pusaran meredam serangan fisik dan mempercepat serangan ganda.",
    buffDescriptionEn: "Swirling wind turbulence cushions blows and enables double strikes.",
    debuffDescription: "Kobaran Api melahap pusaran oksigennya secara fatal (+75%).",
    debuffDescriptionEn: "Fire consumes its atmospheric oxygen field causing +75% damage.",
    hp: 14600,
    maxHp: 14600,
    atk: 410,
    def: 220,
    spd: 180,
    imageUrl: "/images/bosses/boss_dog_angin.jpg",
    locationName: "Dataran Tinggi & Lembah Angin",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Gelombang Suara Sonik",
        nameEn: "Sonic Shockwave Blast",
        description: "Lolongan sonik berkekuatan badai menghantam target.",
        descriptionEn: "Sonic roar shockwave battering target directly.",
        element: "Angin",
        powerMultiplier: 1.6,
        effectType: "critical"
      },
      {
        name: "Topan Lolongan Serigala",
        nameEn: "Gale Fang Tempest",
        description: "Pusaran angin tajam menyapu seluruh 3 formasi pertahanan.",
        descriptionEn: "Razor-sharp gale vortex sweeping all 3 formations.",
        element: "Angin",
        powerMultiplier: 1.3,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 6,
      points: 490,
      energyRefill: 40,
      cardXp: 490
    },
    isActive: true,
    loreId: "Anjing badai berkulit pirus yang mampu melepaskan ledakan sonik saat melolong.",
    loreEn: "A turquoise wind direhound unleashing acoustic sonic shockwaves through furious barks."
  },
  {
    name: "Cerberus Infernal Hellhound",
    nameEn: "Cerberus Infernal Hellhound",
    title: "Anjing Neraka Tiga Kepala Pelahap Jiwa",
    titleEn: "Three-Headed Underworld Hellhound",
    speciesType: "anjing",
    level: 28,
    element: "Api",
    buffElement: "Api",
    debuffElement: "Air",
    buffDescription: "Tiga kepala mengembuskan magma menyala (+50% resistensi Api).",
    buffDescriptionEn: "Three heads breathe blazing magma (+50% Fire resistance).",
    debuffDescription: "Air mendidihkan magma dan mendinginkannya secara fatal (+80% DMG).",
    debuffDescriptionEn: "Water solidifies and breaks its molten armor fatally (+80% DMG).",
    hp: 17500,
    maxHp: 17500,
    atk: 460,
    def: 250,
    spd: 160,
    imageUrl: "/images/bosses/boss_dog_api.jpg",
    locationName: "Kawasan Pabrik Peleburan Logam",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Tiga Semburan Magma Neraka",
        nameEn: "Triple Magma Breath",
        description: "Tiga kepala menyemburkan lahar pijar sekaligus ke 1 target.",
        descriptionEn: "Three heads blast molten lava streams simultaneously at 1 target.",
        element: "Api",
        powerMultiplier: 1.7,
        effectType: "critical"
      },
      {
        name: "Lautan Api Tartarus",
        nameEn: "Tartarus Sea of Flames",
        description: "Membakar seluruh arena dan menimbulkan luka bakar hebat di 3 kartu.",
        descriptionEn: "Ignites entire battlefield dealing heavy burns across 3 cards.",
        element: "Api",
        powerMultiplier: 1.4,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 7,
      points: 580,
      energyRefill: 45,
      cardXp: 560
    },
    isActive: true,
    loreId: "Anjing penjaga gerbang api purba dengan tiga kepala buas berbalut lava panas bergolak.",
    loreEn: "Three-headed infernal guardian hound shrouded in bubbling molten underworld lava."
  },

  // ==========================================
  // --- TIKUS (RATS / RODENTS - Forged Bosses) ---
  // ==========================================
  {
    name: "Ironfang Cyber-Rat Swarm",
    nameEn: "Ironfang Cyber-Rat Swarm",
    title: "Koloni Pengerat Logam Baja Tegangan Tinggi",
    titleEn: "High-Voltage Metallic Rodent Swarm",
    speciesType: "tikus",
    level: 7,
    element: "Petir",
    buffElement: "Petir",
    debuffElement: "Tanah",
    buffDescription: "Menyerap energi elektro dan mempercepat giliran serang.",
    buffDescriptionEn: "Absorbs electrical energy and accelerates attack turns.",
    debuffDescription: "Bumi dan Tanah menetralisir rangkaian sirkuitnya (Kerusakan +75%).",
    debuffDescriptionEn: "Earth and Ground grounding shorts its circuits (Takes +75% bonus damage).",
    hp: 4600,
    maxHp: 4600,
    atk: 155,
    def: 80,
    spd: 120,
    imageUrl: "/images/bosses/boss_rat_petir.jpg",
    locationName: "Gardu Listrik & Pusat Transit",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Gigitan Tegangan Tinggi",
        nameEn: "High-Voltage Overbite",
        description: "Gigitan gigi baja bermuatan listrik 50.000 volt.",
        descriptionEn: "Steel tooth bite carrying 50,000 volts of electricity.",
        element: "Petir",
        powerMultiplier: 1.3,
        effectType: "damage"
      },
      {
        name: "Serbuan Ribuan Tikus Kilat",
        nameEn: "Lightning Rodent Rush",
        description: "Ratusan tikus bermuatan listrik menyerbu 3 posisi kartu.",
        descriptionEn: "Hundreds of electrified robotic mice charge all 3 card positions.",
        element: "Petir",
        powerMultiplier: 0.95,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 3,
      points: 160,
      energyRefill: 25,
      cardXp: 220
    },
    isActive: true,
    loreId: "Kawanan pengerat dengan visor kuning siber dan gigi baja beraliran tegangan tinggi.",
    loreEn: "A cybernetic rodent swarm equipped with glowing ocular visors and high-voltage steel fangs."
  },
  {
    name: "Abyssal Rat Titan Behemoth",
    nameEn: "Abyssal Rat Titan Behemoth",
    title: "Titan Pengerat Tanah Bawah Kota",
    titleEn: "Undercity Tectonic Rat Titan",
    speciesType: "tikus",
    level: 15,
    element: "Tanah",
    buffElement: "Tanah",
    debuffElement: "Angin",
    buffDescription: "Kerangka baja dan kristal bumi menahan 45% serangan fisik.",
    buffDescriptionEn: "Heavy steel and earth crystal plating absorbs 45% physical impact.",
    debuffDescription: "Angin kencang mengikis kristal radioaktifnya (+75%).",
    debuffDescriptionEn: "Gale winds erode radioactive earth crystal shell (+75%).",
    hp: 9200,
    maxHp: 9200,
    atk: 275,
    def: 175,
    spd: 85,
    imageUrl: "/images/bosses/boss_rat_tanah.jpg",
    locationName: "Gorong-Gorong Tua Bawah Tanah",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Hentakan Cakar Seismik",
        nameEn: "Seismic Claw Quake",
        description: "Menghantam tanah menghasilkan gempa seismik lokal.",
        descriptionEn: "Slams ground causing a localized seismic earthquake.",
        element: "Tanah",
        powerMultiplier: 1.45,
        effectType: "damage"
      },
      {
        name: "Lumpur Kristal Radioaktif",
        nameEn: "Radioactive Earth Sludge",
        description: "Semburan lumpur asam yang merusak seluruh kartu penyerang.",
        descriptionEn: "Acidic sludge spray damaging all active raid cards.",
        element: "Tanah",
        powerMultiplier: 1.15,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 4,
      points: 320,
      energyRefill: 30,
      cardXp: 350
    },
    isActive: true,
    loreId: "Tikus raksasa berzirah mekanikal dengan kristal zamrud radioaktif yang berdenyut di punggungnya.",
    loreEn: "A giant mechanized rodent titan wielding glowing green radioactive crystal spikes on its back."
  },
  {
    name: "Pyro-Rodent Magma King",
    nameEn: "Pyro-Rodent Magma King",
    title: "Raja Pengerat Lahar Berpijar",
    titleEn: "Molten Magma Rodent King",
    speciesType: "tikus",
    level: 19,
    element: "Api",
    buffElement: "Api",
    debuffElement: "Air",
    buffDescription: "Aura lahar membakar musuh yang mendekat dan menahan 45% api.",
    buffDescriptionEn: "Molten aura burns nearby foes and deflects 45% Fire damage.",
    debuffDescription: "Sangat rapuh terhadap semburan Air dingin (+75%).",
    debuffDescriptionEn: "Extremely vulnerable to sub-zero Water deluge (+75%).",
    hp: 11800,
    maxHp: 11800,
    atk: 330,
    def: 185,
    spd: 125,
    imageUrl: "/images/bosses/boss_rat_api.jpg",
    locationName: "Pusat Pembakaran Sampah Kota",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Gigitan Batubara Pijar",
        nameEn: "Incandescent Ember Bite",
        description: "Gigitan taring lahar bersuhu 1000 derajat celcius.",
        descriptionEn: "1000-degree molten lava fang bite.",
        element: "Api",
        powerMultiplier: 1.5,
        effectType: "damage"
      },
      {
        name: "Hujan Abu Lahar Panas",
        nameEn: "Magma Ash Tempest",
        description: "Letusan abu panas membakar seluruh 3 kartu lawan.",
        descriptionEn: "Hot magma ash explosion burning all 3 enemy cards.",
        element: "Api",
        powerMultiplier: 1.25,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 5,
      points: 400,
      energyRefill: 35,
      cardXp: 420
    },
    isActive: true,
    loreId: "Pengerat bertubuh bara api dengan kumis menyala dan karapas lahar gunung berapi.",
    loreEn: "A volcanic rodent with glowing ember whiskers and burning molten magma carapace."
  },
  {
    name: "Radioactive Sewer Behemoth",
    nameEn: "Radioactive Sewer Behemoth",
    title: "Titan Limbah Radioaktif Bawah Kota",
    titleEn: "Radioactive Sludge Titan",
    speciesType: "tikus",
    level: 23,
    element: "Air",
    buffElement: "Air",
    debuffElement: "Petir",
    buffDescription: "Menyerap cairan limbah untuk menahan 50% damage air/es.",
    buffDescriptionEn: "Absorbs sewer runoff mitigating 50% water damage.",
    debuffDescription: "Konduktivitas limbah tinggi membuatnya sangat lemah terhadap Petir (+75%).",
    debuffDescriptionEn: "High waste conductivity makes it vulnerable to Thunder (+75%).",
    hp: 14500,
    maxHp: 14500,
    atk: 380,
    def: 220,
    spd: 100,
    imageUrl: "/images/bosses/boss_rat_air.jpg",
    locationName: "Pusat Pengolahan Air & Kanal",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Semprotan Asam Gamma",
        nameEn: "Gamma Acid Jet",
        description: "Tembakan asam berkekuatan tinggi menghancurkan pertahanan lawan.",
        descriptionEn: "High-pressure radioactive acid jet melting enemy defense.",
        element: "Air",
        powerMultiplier: 1.55,
        effectType: "critical"
      },
      {
        name: "Tsunami Limbah Beracun",
        nameEn: "Blighted Toxic Wave",
        description: "Ombak cairan beracun melanda seluruh 3 kartu lawan.",
        descriptionEn: "A flood of toxic waste covering all 3 frontline cards.",
        element: "Air",
        powerMultiplier: 1.3,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 6,
      points: 470,
      energyRefill: 40,
      cardXp: 470
    },
    isActive: true,
    loreId: "Tikus raksasa berlumur cairan hijau asam neon yang mendidih dengan kekuatan air radioaktif.",
    loreEn: "A giant rat mutated by bioluminescent neon green sludge with radioactive water currents."
  },
  {
    name: "Sovereign Plague Rodent",
    nameEn: "Sovereign Plague Rodent",
    title: "Penguasa Wabah Angin Hitam",
    titleEn: "Lord of the Black Gale",
    speciesType: "tikus",
    level: 27,
    element: "Angin",
    buffElement: "Angin",
    debuffElement: "Api",
    buffDescription: "Badai spora melindungi tubuhnya dan menolak 50% proyektil angin.",
    buffDescriptionEn: "Spore gales deflect 50% of wind projectiles and blows.",
    debuffDescription: "Spora sangat mudah terbakar jika diserang elemen Api (+80%).",
    debuffDescriptionEn: "Highly flammable spores incinerate under Fire attacks (+80%).",
    hp: 16900,
    maxHp: 16900,
    atk: 440,
    def: 240,
    spd: 175,
    imageUrl: "/images/bosses/boss_rat_angin.jpg",
    locationName: "Kawasan Industri & Pergudangan Tua",
    spawnRadiusKm: 10,
    skills: [
      {
        name: "Tornado Spora Mematikan",
        nameEn: "Virulent Spore Cyclone",
        description: "Pusaran angin beracun memotong dan melumpuhkan target.",
        descriptionEn: "Poisonous gale cyclone slicing through the target.",
        element: "Angin",
        powerMultiplier: 1.6,
        effectType: "critical"
      },
      {
        name: "Topan Hitam Pengikis Jiwa",
        nameEn: "Black Miasma Tempest",
        description: "Badai hitam raksasa menyerang seluruh 3 petarung sekaligus.",
        descriptionEn: "Massive dark storm battering all 3 combatants simultaneously.",
        element: "Angin",
        powerMultiplier: 1.35,
        effectType: "aoe"
      }
    ],
    rewards: {
      cores: 7,
      points: 560,
      energyRefill: 45,
      cardXp: 540
    },
    isActive: true,
    loreId: "Tikus wabah legendaris bersayap angin zamrud yang menebarkan badai spora mematikan.",
    loreEn: "Legendary plague rodent equipped with aero wings weaving deadly storm tornadoes."
  }
];

export function createRaidBossInstance(
  templateIndex: number,
  lat: number,
  lng: number,
  customLevel?: number
): RaidBoss {
  const tpl = RAID_BOSS_TEMPLATES[templateIndex % RAID_BOSS_TEMPLATES.length];
  const level = customLevel && customLevel >= 5 && customLevel <= 30 ? customLevel : tpl.level;
  
  // Scale stats if level was customized
  const levelRatio = level / tpl.level;
  const hp = Math.round(tpl.hp * levelRatio);
  const atk = Math.round(tpl.atk * (1 + (level - tpl.level) * 0.04));
  const def = Math.round(tpl.def * (1 + (level - tpl.level) * 0.03));
  const spd = Math.round(tpl.spd * (1 + (level - tpl.level) * 0.02));

  const cores = Math.max(2, Math.min(10, Math.round(level * 0.25) + 1));
  const points = Math.round(level * 22) + 50;
  const energyRefill = Math.min(50, 20 + Math.round(level * 1.0));
  const cardXp = Math.round(level * 20) + 100;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours active

  const id = `boss_${tpl.speciesType}_lv${level}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const imageUrl = tpl.imageUrl || generateBossArtwork(tpl.speciesType, tpl.name, tpl.element, level);

  return {
    id,
    name: tpl.name,
    nameEn: tpl.nameEn,
    title: tpl.title,
    titleEn: tpl.titleEn,
    speciesType: tpl.speciesType,
    level,
    element: tpl.element,
    buffElement: tpl.buffElement,
    debuffElement: tpl.debuffElement,
    buffDescription: tpl.buffDescription,
    buffDescriptionEn: tpl.buffDescriptionEn,
    debuffDescription: tpl.debuffDescription,
    debuffDescriptionEn: tpl.debuffDescriptionEn,
    hp,
    maxHp: hp,
    atk,
    def,
    spd,
    imageUrl,
    locationName: tpl.locationName,
    latitude: lat,
    longitude: lng,
    spawnRadiusKm: 10,
    skills: tpl.skills,
    rewards: {
      cores,
      points,
      energyRefill,
      cardXp
    },
    isActive: true,
    expiresAt,
    createdAt: now.toISOString(),
    loreId: tpl.loreId,
    loreEn: tpl.loreEn
  };
}
