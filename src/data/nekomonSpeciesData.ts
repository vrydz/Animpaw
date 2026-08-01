export interface SpeciesEntry {
  dexNumber: string;
  id: string;
  name: string;
  element: "Api" | "Air" | "Tanah" | "Angin" | "Petir";
  style: "Sentinel" | "Scourge";
  rarity: "Common" | "Rare" | "Epic" | "Legend" | "Mythic";
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  skillName: string;
  skillDesc: string;
  loreId: string;
  loreEn: string;
  habitatId: string;
  habitatEn: string;
  height: string;
  weight: string;
  stage: string;
  imageUrl: string;
}

export function getAnimeNekomonSpeciesArtwork(
  name: string,
  element: "Api" | "Air" | "Tanah" | "Angin" | "Petir",
  style: "Sentinel" | "Scourge",
  rarity: "Common" | "Rare" | "Epic" | "Legend" | "Mythic"
): string {
  const elementColors = {
    Api: {
      bg1: "#1f0500", bg2: "#801200", bg3: "#e63900", accent: "#ffaa00",
      symbol: "🔥", eyeColor: "#ffcc00", aura: "#ff4500",
      rune: "IGNIS", particles: ["✨", "🔥", "💥", "⚡"]
    },
    Air: {
      bg1: "#001026", bg2: "#003b80", bg3: "#0088cc", accent: "#00f0ff",
      symbol: "💧", eyeColor: "#00ffff", aura: "#00bfff",
      rune: "AQUA", particles: ["🫧", "💧", "✨", "🌊"]
    },
    Tanah: {
      bg1: "#120e03", bg2: "#4a320d", bg3: "#8a5d14", accent: "#34d399",
      symbol: "⛰️", eyeColor: "#10b981", aura: "#059669",
      rune: "TERRA", particles: ["💎", "🌿", "✨", "🪨"]
    },
    Angin: {
      bg1: "#001a18", bg2: "#005c53", bg3: "#00a896", accent: "#5eead4",
      symbol: "🌪️", eyeColor: "#2dd4bf", aura: "#14b8a6",
      rune: "VENTUS", particles: ["🍃", "🌀", "✨", "⚡"]
    },
    Petir: {
      bg1: "#1a0033", bg2: "#4c0080", bg3: "#8000ff", accent: "#facc15",
      symbol: "⚡", eyeColor: "#fde047", aura: "#eab308",
      rune: "FULGUR", particles: ["⚡", "✨", "💥", "🟣"]
    }
  };

  const theme = elementColors[element] || elementColors.Api;
  const isScourge = style === "Scourge";
  const cleanId = name.replace(/[^a-zA-Z0-9]/g, '');
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 650" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad_${cleanId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.bg1}"/>
        <stop offset="50%" stop-color="${theme.bg2}"/>
        <stop offset="100%" stop-color="${theme.bg3}"/>
      </linearGradient>
      <radialGradient id="auraGrad_${cleanId}" cx="50%" cy="45%" r="45%">
        <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.8"/>
        <stop offset="60%" stop-color="${theme.aura}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${theme.bg1}" stop-opacity="0"/>
      </radialGradient>
      <filter id="glow_${cleanId}">
        <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <rect width="500" height="650" fill="url(#bgGrad_${cleanId})"/>
    <circle cx="250" cy="280" r="210" fill="url(#auraGrad_${cleanId})"/>

    <rect x="20" y="20" width="460" height="610" rx="20" fill="none" stroke="${theme.accent}" stroke-width="3" opacity="0.7"/>
    <rect x="28" y="28" width="444" height="594" rx="16" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.25"/>

    <circle cx="250" cy="280" r="160" fill="none" stroke="${theme.accent}" stroke-width="2" stroke-dasharray="8,6" opacity="0.45" filter="url(#glow_${cleanId})"/>
    <circle cx="250" cy="280" r="130" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.35"/>

    <g filter="url(#glow_${cleanId})" opacity="0.75">
      <path d="M 250,100 L 250,50 M 140,170 L 100,130 M 360,170 L 400,130 M 100,280 L 50,280 M 400,280 L 450,280" stroke="${theme.accent}" stroke-width="3"/>
    </g>

    <path d="M 160,220 L 110,100 Q 150,110 200,170 Z" fill="${isScourge ? '#181825' : '#2a2a3e'}" stroke="${theme.accent}" stroke-width="4" filter="url(#glow_${cleanId})"/>
    <path d="M 165,210 L 125,120 Q 155,125 190,170 Z" fill="${theme.aura}" opacity="0.8"/>

    <path d="M 340,220 L 390,100 Q 350,110 300,170 Z" fill="${isScourge ? '#181825' : '#2a2a3e'}" stroke="${theme.accent}" stroke-width="4" filter="url(#glow_${cleanId})"/>
    <path d="M 335,210 L 375,120 Q 345,125 310,170 Z" fill="${theme.aura}" opacity="0.8"/>

    <ellipse cx="250" cy="290" rx="110" ry="95" fill="${isScourge ? '#11111d' : '#222235'}" stroke="${theme.accent}" stroke-width="3" filter="url(#glow_${cleanId})"/>

    <path d="M 250,215 L 260,235 L 250,255 L 240,235 Z" fill="${theme.accent}" filter="url(#glow_${cleanId})"/>
    <text x="250" y="210" text-anchor="middle" fill="${theme.accent}" font-family="sans-serif" font-size="12" font-weight="900" letter-spacing="2">${theme.rune}</text>

    <ellipse cx="195" cy="285" rx="28" ry="34" fill="#050508" stroke="${theme.accent}" stroke-width="2"/>
    <ellipse cx="195" cy="285" rx="22" ry="28" fill="${theme.eyeColor}" filter="url(#glow_${cleanId})"/>
    <ellipse cx="195" cy="285" rx="10" ry="20" fill="#000000"/>
    <circle cx="188" cy="272" r="7" fill="#ffffff"/>
    <circle cx="202" cy="295" r="3.5" fill="#ffffff"/>

    <ellipse cx="305" cy="285" rx="28" ry="34" fill="#050508" stroke="${theme.accent}" stroke-width="2"/>
    <ellipse cx="305" cy="285" rx="22" ry="28" fill="${theme.eyeColor}" filter="url(#glow_${cleanId})"/>
    <ellipse cx="305" cy="285" rx="10" ry="20" fill="#000000"/>
    <circle cx="298" cy="272" r="7" fill="#ffffff"/>
    <circle cx="312" cy="295" r="3.5" fill="#ffffff"/>

    <polygon points="250,325 243,318 257,318" fill="${theme.accent}"/>
    <path d="M 243,332 Q 250,338 250,330 Q 250,338 257,332" fill="none" stroke="${theme.accent}" stroke-width="2.5" stroke-linecap="round"/>

    <path d="M 140,310 L 80,300 M 135,325 L 75,325 M 140,340 L 85,350" stroke="${theme.accent}" stroke-width="2" opacity="0.8"/>
    <path d="M 360,310 L 420,300 M 365,325 L 425,325 M 360,340 L 415,350" stroke="${theme.accent}" stroke-width="2" opacity="0.8"/>

    <path d="M 170,365 Q 250,420 330,365 L 350,470 Q 250,510 150,470 Z" fill="${isScourge ? '#1f132b' : '#1e293b'}" stroke="${theme.accent}" stroke-width="3" filter="url(#glow_${cleanId})"/>
    <circle cx="250" cy="420" r="18" fill="${theme.accent}" filter="url(#glow_${cleanId})"/>

    <text x="70" y="180" font-size="28" opacity="0.95">${theme.particles[0]}</text>
    <text x="390" y="200" font-size="28" opacity="0.95">${theme.particles[1]}</text>
    <text x="80" y="440" font-size="26" opacity="0.95">${theme.particles[2]}</text>
    <text x="380" y="450" font-size="26" opacity="0.95">${theme.particles[3]}</text>

    <rect x="40" y="520" width="420" height="90" rx="16" fill="#080c14" stroke="${theme.accent}" stroke-width="2" opacity="0.95"/>
    <text x="250" y="555" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="900" letter-spacing="1">${name.toUpperCase()}</text>
    <text x="250" y="585" text-anchor="middle" fill="${theme.accent}" font-family="sans-serif" font-size="13" font-weight="800" letter-spacing="3">${element.toUpperCase()} • ${style.toUpperCase()} • ${rarity.toUpperCase()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const RAW_SPECIES: (Omit<SpeciesEntry, "imageUrl"> & { imageUrl?: string })[] = [
  {
    dexNumber: "#001",
    id: "dex_001_ignis_claw",
    name: "Ignis Claw",
    element: "Api",
    style: "Sentinel",
    rarity: "Common",
    baseHp: 120,
    baseAtk: 45,
    baseDef: 35,
    baseSpd: 40,
    skillName: "Embrik Scratch",
    skillDesc: "Mencakar musuh dengan cakar berbara api hangat.",
    loreId: "Spesies kucing bernyawa api magis yang gemar meringkuk tidur di dekat perapian. Bulunya selalu terasa hangat.",
    loreEn: "A magical fire-element feline species that loves curling up near hearths. Its fur is perpetually warm to the touch.",
    habitatId: "Desa Lemba Panas",
    habitatEn: "Warm Valley Village",
    height: "0.4 m",
    weight: "3.8 kg",
    stage: "Tahap 1 - Dasar",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#002",
    id: "dex_002_pyro_paw",
    name: "Pyro Paw",
    element: "Api",
    style: "Sentinel",
    rarity: "Rare",
    baseHp: 155,
    baseAtk: 62,
    baseDef: 48,
    baseSpd: 58,
    skillName: "Flame Flare",
    skillDesc: "Mengibaskan ekor untuk menyemburkan percikan api menembus pertahanan lawan.",
    loreId: "Kakarot-paw berbulu kemerahan yang ceria. Percikan apinya kerap digunakan penduduk desa untuk menyalakan obor malam.",
    loreEn: "A cheerful reddish-furred feline. Its sparks are often used by villagers to light night torches.",
    habitatId: "Hutan Pinus Merah",
    habitatEn: "Red Pine Forest",
    height: "0.6 m",
    weight: "6.2 kg",
    stage: "Tahap 1 - Dasar",
    imageUrl: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#003",
    id: "dex_003_vulkanos_lynx",
    name: "Vulkanos Lynx",
    element: "Api",
    style: "Scourge",
    rarity: "Epic",
    baseHp: 210,
    baseAtk: 88,
    baseDef: 65,
    baseSpd: 72,
    skillName: "Magma Burst",
    skillDesc: "Menghantamkan cakar lahar panas yang memicu ledakan area.",
    loreId: "Lynx pemangsa kegelapan berwatak keras yang menghuni lereng gunung berapi terlarang. Matanya bersinar bagaikan batu magam.",
    loreEn: "A fierce dark predator inhabiting forbidden volcanic slopes. Its eyes glow like molten magma stones.",
    habitatId: "Kawah Gunung Magma",
    habitatEn: "Magma Crater Volcano",
    height: "1.1 m",
    weight: "22.5 kg",
    stage: "Tahap 2 - Evolusi",
    imageUrl: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#004",
    id: "dex_004_infernal_blaze",
    name: "Infernal Blaze",
    element: "Api",
    style: "Scourge",
    rarity: "Legend",
    baseHp: 280,
    baseAtk: 120,
    baseDef: 85,
    baseSpd: 95,
    skillName: "Hellfire Cleave",
    skillDesc: "Menebas lawan dengan aura neraka terkuat yang membakar musuh secara konstan.",
    loreId: "Nekomon legendaris yang bertubuh kobar nyala api abadi. Konon tatapannya sanggup melelehkan zirah baja terkuat.",
    loreEn: "A legendary Nekomon engulfed in eternal flames. Its gaze is said to melt the thickest steel armor.",
    habitatId: "Puncak Gunung Api Abadi",
    habitatEn: "Peak of Eternal Flame",
    height: "1.6 m",
    weight: "45.0 kg",
    stage: "Tahap 3 - Awaken",
    imageUrl: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#005",
    id: "dex_005_helios_solis",
    name: "Helios Solis",
    element: "Api",
    style: "Sentinel",
    rarity: "Mythic",
    baseHp: 350,
    baseAtk: 145,
    baseDef: 110,
    baseSpd: 115,
    skillName: "Solar Coronation",
    skillDesc: "Memanggil pilar surya murni untuk memulihkan diri sambil menghanguskan musuh.",
    loreId: "Kucing mitos penjaga surya abadi. Diyakini oleh legenda kuno sebagai pembawa fajar dan kehidupan bagi daratan terpencil.",
    loreEn: "A mythical feline guardian of the sun. Ancient legends credit it with bringing dawn and life to remote lands.",
    habitatId: "Kuil Surya Angkasa",
    habitatEn: "Sky Solar Temple",
    height: "2.1 m",
    weight: "78.0 kg",
    stage: "Tahap Mitos",
    imageUrl: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#006",
    id: "dex_006_nautilus_paws",
    name: "Nautilus Paws",
    element: "Air",
    style: "Sentinel",
    rarity: "Common",
    baseHp: 130,
    baseAtk: 38,
    baseDef: 42,
    baseSpd: 45,
    skillName: "Aqua Jet",
    skillDesc: "Menembakkan gelembung air bertekanan lembut.",
    loreId: "Kucing pesisir dengan ekor yang menyerupai riak gelombang air jernih. Amat lincah berenang menyeberangi sungai.",
    loreEn: "A coastal cat whose tail resembles clear water ripples. Extremely agile swimming across rivers.",
    habitatId: "Pesisir Pantai Biru",
    habitatEn: "Blue Coastal Shore",
    height: "0.5 m",
    weight: "4.1 kg",
    stage: "Tahap 1 - Dasar",
    imageUrl: "https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#007",
    id: "dex_007_coral_tail",
    name: "Coral Tail",
    element: "Air",
    style: "Sentinel",
    rarity: "Rare",
    baseHp: 165,
    baseAtk: 55,
    baseDef: 58,
    baseSpd: 62,
    skillName: "Tidal Shield",
    skillDesc: "Menciptakan perisai air terumbu karang yang menyerap damage.",
    loreId: "Penyelam laut dangkal berbulu kebiruan. Memiliki indera tajam untuk mendeteksi datangnya gelombang pasang.",
    loreEn: "A shallow-sea diver with bluish fur. Possesses keen senses to detect incoming tidal surges.",
    habitatId: "Terumbu Karang Selatan",
    habitatEn: "Southern Coral Reef",
    height: "0.7 m",
    weight: "7.8 kg",
    stage: "Tahap 1 - Dasar",
    imageUrl: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#008",
    id: "dex_008_tsunami_saber",
    name: "Tsunami Saber",
    element: "Air",
    style: "Scourge",
    rarity: "Epic",
    baseHp: 215,
    baseAtk: 82,
    baseDef: 72,
    baseSpd: 80,
    skillName: "Frostbite Bite",
    skillDesc: "Gigitan es taring tajam yang membekukan gerakan lawan.",
    loreId: "Pemburu samudra dalam yang bertaring es kristal. Mampu menyelam hingga palung tergelap tanpa merasa dingin.",
    loreEn: "A deep-ocean hunter with crystal ice fangs. Able to dive into the darkest trenches without feeling the cold.",
    habitatId: "Palung Laut Dalam",
    habitatEn: "Deep Sea Trench",
    height: "1.2 m",
    weight: "28.0 kg",
    stage: "Tahap 2 - Evolusi",
    imageUrl: "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#009",
    id: "dex_009_leviathan_whisker",
    name: "Leviathan Whisker",
    element: "Air",
    style: "Scourge",
    rarity: "Legend",
    baseHp: 290,
    baseAtk: 110,
    baseDef: 92,
    baseSpd: 88,
    skillName: "Abyssal Deluge",
    skillDesc: "Memanggil pusaran gelombang samudra raksasa meremukkan musuh.",
    loreId: "Penguasa laut selatan yang dihormati para pelaut. Cukup mengibaskan kumisnya untuk mengendalikan arus badai.",
    loreEn: "Master of the southern seas respected by sailors. A twitch of its whiskers alters ocean storm currents.",
    habitatId: "Samudra Atlantis Abadi",
    habitatEn: "Eternal Atlantis Ocean",
    height: "1.8 m",
    weight: "52.0 kg",
    stage: "Tahap 3 - Awaken",
    imageUrl: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#010",
    id: "dex_010_astraea_oceanus",
    name: "Astraea Oceanus",
    element: "Air",
    style: "Sentinel",
    rarity: "Mythic",
    baseHp: 360,
    baseAtk: 130,
    baseDef: 125,
    baseSpd: 105,
    skillName: "Oceanic Blessing",
    skillDesc: "Menciptakan hujan embun abadi yang memulihkan seluruh tim.",
    loreId: "Nekomon mitologi penyembuh air mata kehidupan. Dipercaya mendiami istana mutiara di dasar samudra tak tersentuh.",
    loreEn: "Mythological Nekomon healer born of life's tears. Inhabits an untouched pearl palace on the ocean floor.",
    habitatId: "Istana Mutiara Samudra",
    habitatEn: "Ocean Pearl Palace",
    height: "2.3 m",
    weight: "85.0 kg",
    stage: "Tahap Mitos",
    imageUrl: "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#011",
    id: "dex_011_terra_paw",
    name: "Terra Paw",
    element: "Tanah",
    style: "Sentinel",
    rarity: "Common",
    baseHp: 140,
    baseAtk: 40,
    baseDef: 50,
    baseSpd: 30,
    skillName: "Stone Bump",
    skillDesc: "Menyeruduk dengan dahi sekeras batu kerikil.",
    loreId: "Kucing gunung berbulu padat kecokelatan. Menyukai kehangatan bebatuan yang terpapar sinar matahari pagi.",
    loreEn: "A mountain cat with dense brownish fur. Loves the warmth of rocks basking in the morning sun.",
    habitatId: "Bukit Batu Kapur",
    habitatEn: "Limestone Hill",
    height: "0.5 m",
    weight: "5.5 kg",
    stage: "Tahap 1 - Dasar",
    imageUrl: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#012",
    id: "dex_012_pebble_fur",
    name: "Pebble Fur",
    element: "Tanah",
    style: "Sentinel",
    rarity: "Rare",
    baseHp: 180,
    baseAtk: 52,
    baseDef: 70,
    baseSpd: 42,
    skillName: "Rock Armor",
    skillDesc: "Menebal kulit dengan lapisan kristal batu meningkatkan pertahanan.",
    loreId: "Ahli kamuflase di tebing pegunungan. Sisik bulunya mengandung mineral bumi padat yang menangkal cakar tajam.",
    loreEn: "A cliff camouflage expert. Its fur scales contain dense earth minerals that ward off sharp claws.",
    habitatId: "Tebing Granit Tinggi",
    habitatEn: "High Granite Cliff",
    height: "0.8 m",
    weight: "11.2 kg",
    stage: "Tahap 1 - Dasar",
    imageUrl: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#013",
    id: "dex_013_obsidian_fang",
    name: "Obsidian Fang",
    element: "Tanah",
    style: "Scourge",
    rarity: "Epic",
    baseHp: 230,
    baseAtk: 85,
    baseDef: 90,
    baseSpd: 55,
    skillName: "Earthquake Slam",
    skillDesc: "Hantaman cakar berat meretakkan fondasi tanah di bawah kaki lawan.",
    loreId: "Bertaring batu obsidian hitam tajam. Serangan guncangannya sanggup merobohkan benteng batu dalam sekali tebasan.",
    loreEn: "Armed with sharp black obsidian tings. Its ground-shattering strikes can collapse stone fortresses.",
    habitatId: "Gua Lembah Kelam",
    habitatEn: "Dark Valley Cavern",
    height: "1.3 m",
    weight: "36.0 kg",
    stage: "Tahap 2 - Evolusi",
    imageUrl: "https://images.unsplash.com/photo-1501820488136-72669149e0d4?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#014",
    id: "dex_014_titan_colossus",
    name: "Titan Colossus",
    element: "Tanah",
    style: "Scourge",
    rarity: "Legend",
    baseHp: 310,
    baseAtk: 115,
    baseDef: 120,
    baseSpd: 65,
    skillName: "Mountain Crush",
    skillDesc: "Menjatuhkan bongkahan batu raksasa menimbun pertahanan lawan.",
    loreId: "Raksasa berotot batu granit kuno. Penjaga gerbang rahasia inti bumi yang telah bertapa selama seribu tahun.",
    loreEn: "An ancient granite-muscled giant. Guardian of the secret earth core gate, meditating for a thousand years.",
    habitatId: "Inti Pegunungan Himalaya",
    habitatEn: "Himalayan Core Peaks",
    height: "2.2 m",
    weight: "120.0 kg",
    stage: "Tahap 3 - Awaken",
    imageUrl: "https://images.unsplash.com/photo-1472491235688-bdc81a63246e?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#015",
    id: "dex_015_gaia_matriarch",
    name: "Gaia Matriarch",
    element: "Tanah",
    style: "Sentinel",
    rarity: "Mythic",
    baseHp: 380,
    baseAtk: 125,
    baseDef: 140,
    baseSpd: 80,
    skillName: "Terra Rejuvenation",
    skillDesc: "Menebarkan aura kehijauan memulihkan HP dan memperkuat armor seluruh kawan.",
    loreId: "Sang dewi bumi tertinggi. Di mana pun kakinya memijak, tanah tandus seketika berubah menjadi hutan lebat berbunga.",
    loreEn: "The supreme earth goddess. Wherever its paws tread, barren soil instantly blossoms into a lush forest.",
    habitatId: "Hutan Purba Gaia",
    habitatEn: "Primeval Gaia Forest",
    height: "2.5 m",
    weight: "150.0 kg",
    stage: "Tahap Mitos",
    imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#016",
    id: "dex_016_zephyr_whisker",
    name: "Zephyr Whisker",
    element: "Angin",
    style: "Sentinel",
    rarity: "Common",
    baseHp: 110,
    baseAtk: 42,
    baseDef: 30,
    baseSpd: 55,
    skillName: "Breeze Slash",
    skillDesc: "Tebasan angin sepoi yang meluncur cepat.",
    loreId: "Kucing berbulu putih kapas yang amat ringan. Lompatannya seolah tak terpengaruh oleh gravitasi bumi.",
    loreEn: "A cotton-white cat of incredible lightness. Its leaps seem almost untouched by gravity.",
    habitatId: "Padang Rumput Angin",
    habitatEn: "Windy Meadow Grasslands",
    height: "0.4 m",
    weight: "2.9 kg",
    stage: "Tahap 1 - Dasar",
    imageUrl: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#017",
    id: "dex_017_gale_step",
    name: "Gale Step",
    element: "Angin",
    style: "Sentinel",
    rarity: "Rare",
    baseHp: 150,
    baseAtk: 60,
    baseDef: 42,
    baseSpd: 78,
    skillName: "Gust Dash",
    skillDesc: "Menerjang dengan kecepatan angin menembus formasi musuh.",
    loreId: "Pelari ulung yang sanggup melintasi dedaunan tanpa menjatuhkan sebutir embun pun dari permukaannya.",
    loreEn: "A master sprinter capable of treading over leaves without dropping a single dewdrop.",
    habitatId: "Hutan Bambu Tiongkok",
    habitatEn: "Bamboo Wind Forest",
    height: "0.6 m",
    weight: "5.1 kg",
    stage: "Tahap 1 - Dasar",
    imageUrl: "https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#018",
    id: "dex_018_vortex_panther",
    name: "Vortex Panther",
    element: "Angin",
    style: "Scourge",
    rarity: "Epic",
    baseHp: 200,
    baseAtk: 92,
    baseDef: 58,
    baseSpd: 100,
    skillName: "Tornado Cyclone",
    skillDesc: "Menciptakan puyuh angin kencang melontarkan lawan ke udara.",
    loreId: "Panther bayangan badai. Langkah kakinya memicu gumpalan pusaran angin bertekanan udara tinggi di sekelilingnya.",
    loreEn: "A storm shadow panther. Every stride triggers high-pressure wind whirlwinds in its wake.",
    habitatId: "Puncak Bukit Badai",
    habitatEn: "Storm Peak Ridge",
    height: "1.1 m",
    weight: "21.0 kg",
    stage: "Tahap 2 - Evolusi",
    imageUrl: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#019",
    id: "dex_019_tempest_phantom",
    name: "Tempest Phantom",
    element: "Angin",
    style: "Scourge",
    rarity: "Legend",
    baseHp: 270,
    baseAtk: 125,
    baseDef: 75,
    baseSpd: 125,
    skillName: "Sonic Windstorm",
    skillDesc: "Gelombang supersonik angin tajam memotong garis pertahanan lawan.",
    loreId: "Nekomon legendaris pembalik badai. Terbang menyusuri awan troposfer dan hampir tidak pernah menjejak daratan.",
    loreEn: "Legendary storm weaver. Glides through troposphere clouds and rarely ever touches solid ground.",
    habitatId: "Awan Stratosfer Tinggi",
    habitatEn: "High Stratosphere Clouds",
    height: "1.7 m",
    weight: "38.0 kg",
    stage: "Tahap 3 - Awaken",
    imageUrl: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#020",
    id: "dex_020_boreas_skydancer",
    name: "Boreas Skydancer",
    element: "Angin",
    style: "Sentinel",
    rarity: "Mythic",
    baseHp: 340,
    baseAtk: 138,
    baseDef: 102,
    baseSpd: 145,
    skillName: "Aurora Mirage",
    skillDesc: "Tarian langit bersinar menipu serangan musuh dan memberikan serangan balasan kilat.",
    loreId: "Penguasa langit utara yang menari gembira di antara kilauan aurora borealis. Penjaga kebebasan angin abadi.",
    loreEn: "Ruler of northern skies dancing joyfully amid the aurora borealis light. Guardian of eternal wind freedom.",
    habitatId: "Langit Aurora Kutub",
    habitatEn: "Polar Aurora Sky",
    height: "2.0 m",
    weight: "62.0 kg",
    stage: "Tahap Mitos",
    imageUrl: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#021",
    id: "dex_021_spark_kitten",
    name: "Spark Kitten",
    element: "Petir",
    style: "Sentinel",
    rarity: "Common",
    baseHp: 115,
    baseAtk: 48,
    baseDef: 32,
    baseSpd: 52,
    skillName: "Static Zap",
    skillDesc: "Sengatan listrik statis kejutan kecil.",
    loreId: "Anak kucing berenergi listrik statis. Setiap kali bulunya dielus, akan terdengar bunyi percikan listrik mungil.",
    loreEn: "A static-charged kitten. Every stroke of its fur emits gentle crackling electric sparks.",
    habitatId: "Pembangkit Listrik Lama",
    habitatEn: "Old Electric Substation",
    height: "0.3 m",
    weight: "2.5 kg",
    stage: "Tahap 1 - Dasar",
    imageUrl: "https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#022",
    id: "dex_022_volt_panther",
    name: "Volt Panther",
    element: "Petir",
    style: "Sentinel",
    rarity: "Rare",
    baseHp: 158,
    baseAtk: 68,
    baseDef: 45,
    baseSpd: 82,
    skillName: "Thunder Strike",
    skillDesc: "Sambaran petir kuning yang memicu efek stun singkat.",
    loreId: "Panther lincah pemberani. Jalur lariannya meninggalkan pendaran garis kilat kuning keemasan yang berkilau.",
    loreEn: "A nimble brave panther. Its running trail leaves behind glowing golden lightning streaks.",
    habitatId: "Lembah Kilat Petir",
    habitatEn: "Lightning Strike Valley",
    height: "0.7 m",
    weight: "8.5 kg",
    stage: "Tahap 1 - Dasar",
    imageUrl: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#023",
    id: "dex_023_thunder_claws",
    name: "Thunder Claws",
    element: "Petir",
    style: "Scourge",
    rarity: "Epic",
    baseHp: 205,
    baseAtk: 96,
    baseDef: 60,
    baseSpd: 105,
    skillName: "Plasma Claw",
    skillDesc: "Cakar plasma bertegangan tinggi yang menghancurkan perisai musuh.",
    loreId: "Pemukul guruh di malam badai. Serangan cakarnya diiringi dentuman gemuruh yang membuat ciut nyali lawan.",
    loreEn: "Night thunderstorm striker. Its claw slash is accompanied by roaring thunder that instills fear.",
    habitatId: "Puncak Menara Petir",
    habitatEn: "Thunder Tower Summit",
    height: "1.2 m",
    weight: "24.0 kg",
    stage: "Tahap 2 - Evolusi",
    imageUrl: "https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#024",
    id: "dex_024_raijin_executor",
    name: "Raijin Executor",
    element: "Petir",
    style: "Scourge",
    rarity: "Legend",
    baseHp: 275,
    baseAtk: 132,
    baseDef: 78,
    baseSpd: 130,
    skillName: "Million Volt Judgement",
    skillDesc: "Penyergapan giga-volt petir dari langit melumpuhkan target.",
    loreId: "Dewa petir legenda Nekomon. Menguasai tegangan sejuta volt murni yang dialirkan langsung melalui ekor plasmanya.",
    loreEn: "Legendary Nekomon thunder deity. Controls a million volts of raw electricity channeled via its plasma tail.",
    habitatId: "Awan Badai Elektrik",
    habitatEn: "Electric Stormcloud Domain",
    height: "1.8 m",
    weight: "48.0 kg",
    stage: "Tahap 3 - Awaken",
    imageUrl: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#025",
    id: "dex_025_emperor_spark",
    name: "Emperor Spark",
    element: "Petir",
    style: "Sentinel",
    rarity: "Mythic",
    baseHp: 345,
    baseAtk: 150,
    baseDef: 105,
    baseSpd: 140,
    skillName: "Electromagnetic Overload",
    skillDesc: "Badai elektromagnetik raksasa yang merusak seluruh sistem pertahanan musuh.",
    loreId: "Penguasa medan elektromagnetik planet. Mampu menghentikan rotasi mesin atau badai petir berbahaya hanya dengan tatapan.",
    loreEn: "Ruler of the planet's electromagnetic field. Can halt machine engines or dangerous lightning storms with a single gaze.",
    habitatId: "Inti Elektromagnetik Bumi",
    habitatEn: "Earth Electromagnetic Core",
    height: "2.1 m",
    weight: "72.0 kg",
    stage: "Tahap Mitos",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#026",
    id: "dex_026_mecha_meow",
    name: "Mecha Meow",
    element: "Api",
    style: "Scourge",
    rarity: "Rare",
    baseHp: 162,
    baseAtk: 64,
    baseDef: 52,
    baseSpd: 65,
    skillName: "Laser Beam Eyes",
    skillDesc: "Tembakan laser optik termal merah presisi tinggi.",
    loreId: "Kucing cybernetic hasil peradaban masa depan. Matanya dilengkapi sensor infra-merah untuk melacak target di kegelapan.",
    loreEn: "A cybernetic cat engineered by future civilization. Equipped with infrared sensors to track targets in total darkness.",
    habitatId: "Kota Cyberpunk Neo-Tokyo",
    habitatEn: "Neo-Tokyo Cyberpunk City",
    height: "0.6 m",
    weight: "14.5 kg",
    stage: "Tahap 1 - Dasar",
    imageUrl: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#027",
    id: "dex_027_astral_tail",
    name: "Astral Tail",
    element: "Angin",
    style: "Sentinel",
    rarity: "Epic",
    baseHp: 210,
    baseAtk: 86,
    baseDef: 68,
    baseSpd: 92,
    skillName: "Starlight Comet",
    skillDesc: "Hujan komet bintang keemasan yang menembus garis pertahanan lawan.",
    loreId: "Ekornya berkilau bintang-bintang kosmik gaib. Dipercaya para astronom kuno dapat meramal kedatangan badai luar angkasa.",
    loreEn: "Its tail glimmers with mystical cosmic stars. Ancient astronomers believed it predicted cosmic space storms.",
    habitatId: "Observatorium Bintang Kuno",
    habitatEn: "Ancient Star Observatory",
    height: "1.0 m",
    weight: "18.5 kg",
    stage: "Tahap 2 - Evolusi",
    imageUrl: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#028",
    id: "dex_028_phantom_shadow",
    name: "Phantom Shadow",
    element: "Petir",
    style: "Scourge",
    rarity: "Legend",
    baseHp: 268,
    baseAtk: 128,
    baseDef: 72,
    baseSpd: 135,
    skillName: "Shadow Strike",
    skillDesc: "Menciptakan ilusi ganda yang menyerang target dari arah tak terduga.",
    loreId: "Kucing pemburu bayangan cepat. Menggunakan cakar plasma ganda untuk mengejutkan lawan sebelum mereka sempat menyadarinya.",
    loreEn: "A swift shadow hunter cat. Uses dual plasma claws to strike opponents before they even realize its presence.",
    habitatId: "Lorong Dimensi Bayangan",
    habitatEn: "Shadow Dimension Passage",
    height: "1.5 m",
    weight: "32.0 kg",
    stage: "Tahap 3 - Awaken",
    imageUrl: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#029",
    id: "dex_029_chrono_paw",
    name: "Chrono Paw",
    element: "Tanah",
    style: "Sentinel",
    rarity: "Mythic",
    baseHp: 355,
    baseAtk: 140,
    baseDef: 130,
    baseSpd: 110,
    skillName: "Temporal Stasis",
    skillDesc: "Memperlambat ritme waktu dalam pertempuran untuk membalikkan posisi keunggulan.",
    loreId: "Kucing penjaga lorong waktu abadi. Mampu menggeser ritme pertempuran dan mengembalikan luka menjadi utuh kembali.",
    loreEn: "Guardian of the eternal time corridor. Capable of shifting battle rhythms and rewinding wounds to pristine health.",
    habitatId: "Kuil Jam Kosmik Waktu",
    habitatEn: "Cosmic Clock Temple",
    height: "2.2 m",
    weight: "95.0 kg",
    stage: "Tahap Mitos",
    imageUrl: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=600&q=80"
  },
  {
    dexNumber: "#030",
    id: "dex_030_celestial_empress",
    name: "Celestial Empress",
    element: "Air",
    style: "Sentinel",
    rarity: "Mythic",
    baseHp: 400,
    baseAtk: 160,
    baseDef: 145,
    baseSpd: 150,
    skillName: "Genesis Divine Burst",
    skillDesc: "Ledakan cahaya kehidupan kosmik tertinggi yang menganugerahkan kemenangan abadi.",
    loreId: "Penguasa tertinggi seluruh spesies Nekomon di seluruh penjuru galaksi. Mahkotanya bersinar dengan aura lima elemen harmoni.",
    loreEn: "The supreme empress of all Nekomon species across the galaxy. Her crown shines with the harmony of all five elements.",
    habitatId: "Takhta Surgawi Kosmos",
    habitatEn: "Celestial Cosmic Throne",
    height: "2.6 m",
    weight: "110.0 kg",
    stage: "Tahap Mitos Supreme"
  }
];

export const NEKOMON_SPECIES_CATALOG: SpeciesEntry[] = RAW_SPECIES.map((item) => ({
  ...item,
  imageUrl: getAnimeNekomonSpeciesArtwork(item.name, item.element, item.style, item.rarity)
}));
