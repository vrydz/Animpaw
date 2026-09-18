import React, { useState, useMemo } from "react";
import { Card } from "../types";
import { NEKOMON_SPECIES_CATALOG, SpeciesEntry } from "../data/nekomonSpeciesData";
import { useLanguage } from "../context/LanguageContext";
import { audio } from "../lib/audio";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  Flame,
  Droplets,
  Mountain,
  Wind,
  Zap,
  Shield,
  Swords,
  Trophy,
  Sparkles,
  Lock,
  CheckCircle2,
  Volume2,
  X,
  Compass,
  ArrowUpDown,
  BookOpen,
  Info,
  ChevronRight,
  Activity,
  Layers,
  MapPin,
  Maximize2
} from "lucide-react";

interface NekomonDexProps {
  cards: Card[];
  onOpenForge?: () => void;
}

export function NekomonDex({ cards, onOpenForge }: NekomonDexProps) {
  const { language, t } = useLanguage();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedElement, setSelectedElement] = useState<string>("ALL");
  const [selectedRarity, setSelectedRarity] = useState<string>("ALL");
  const [selectedStyle, setSelectedStyle] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "DISCOVERED" | "LOCKED">("ALL");
  const [sortBy, setSortBy] = useState<"DEX" | "NAME" | "RARITY" | "STATS">("DEX");

  // Selected species for detail inspection modal
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesEntry | null>(null);

  // Cross-reference user's collection with Dex catalog
  const speciesAnalysis = useMemo(() => {
    return NEKOMON_SPECIES_CATALOG.map((species) => {
      // Find matching user cards in inventory
      const matchingCards = cards.filter((c) => {
        const cName = c.name.toLowerCase();
        const sName = species.name.toLowerCase();
        // Name substring match OR exact element + rarity + style match
        const nameMatch = cName.includes(sName) || sName.includes(cName);
        const specMatch = c.element === species.element && c.rarity === species.rarity && c.style === species.style;
        return nameMatch || specMatch;
      });

      const isDiscovered = matchingCards.length > 0;
      const countOwned = matchingCards.length;
      const highestLevelOwned = isDiscovered
        ? Math.max(...matchingCards.map((c) => c.level || 1))
        : 0;

      return {
        species,
        isDiscovered,
        countOwned,
        highestLevelOwned,
        userCards: matchingCards,
      };
    });
  }, [cards]);

  // Total Dex Progress Stats
  const totalSpeciesCount = NEKOMON_SPECIES_CATALOG.length;
  const discoveredCount = useMemo(() => {
    return speciesAnalysis.filter((item) => item.isDiscovered).length;
  }, [speciesAnalysis]);
  const progressPercent = Math.round((discoveredCount / totalSpeciesCount) * 100);

  // Filtered & Sorted species
  const filteredAnalysis = useMemo(() => {
    return speciesAnalysis
      .filter((item) => {
        const { species, isDiscovered } = item;

        // Search Query
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase().trim();
          const matchName = species.name.toLowerCase().includes(q);
          const matchNum = species.dexNumber.toLowerCase().includes(q);
          const matchSkill = species.skillName.toLowerCase().includes(q);
          const matchLore =
            species.loreId.toLowerCase().includes(q) || species.loreEn.toLowerCase().includes(q);
          if (!matchName && !matchNum && !matchSkill && !matchLore) return false;
        }

        // Element Filter
        if (selectedElement !== "ALL" && species.element !== selectedElement) return false;

        // Rarity Filter
        if (selectedRarity !== "ALL" && species.rarity !== selectedRarity) return false;

        // Style Filter
        if (selectedStyle !== "ALL" && species.style !== selectedStyle) return false;

        // Status Filter
        if (selectedStatus === "DISCOVERED" && !isDiscovered) return false;
        if (selectedStatus === "LOCKED" && isDiscovered) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "DEX") {
          return a.species.dexNumber.localeCompare(b.species.dexNumber);
        } else if (sortBy === "NAME") {
          return a.species.name.localeCompare(b.species.name);
        } else if (sortBy === "RARITY") {
          const rarityOrder = { Common: 1, Rare: 2, Epic: 3, Legend: 4, Mythic: 5 };
          return rarityOrder[b.species.rarity] - rarityOrder[a.species.rarity];
        } else if (sortBy === "STATS") {
          const statA = a.species.baseHp + a.species.baseAtk + a.species.baseDef + a.species.baseSpd;
          const statB = b.species.baseHp + b.species.baseAtk + b.species.baseDef + b.species.baseSpd;
          return statB - statA;
        }
        return 0;
      });
  }, [speciesAnalysis, searchQuery, selectedElement, selectedRarity, selectedStyle, selectedStatus, sortBy]);

  // Render Element Badge/Icon Helper
  const renderElementIcon = (element: string, size = "w-4 h-4") => {
    switch (element?.toLowerCase()) {
      case "api":
        return <Flame className={`${size} text-red-500`} />;
      case "air":
        return <Droplets className={`${size} text-blue-500`} />;
      case "tanah":
        return <Mountain className={`${size} text-amber-600`} />;
      case "angin":
        return <Wind className={`${size} text-teal-400`} />;
      case "petir":
        return <Zap className={`${size} text-yellow-400`} />;
      default:
        return <Sparkles className={`${size} text-slate-400`} />;
    }
  };

  // Render Rarity Badge Styling
  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "bg-slate-800/90 text-slate-300 border-slate-700";
      case "Rare":
        return "bg-blue-950/90 text-blue-400 border-blue-500/40";
      case "Epic":
        return "bg-purple-950/90 text-purple-400 border-purple-500/40";
      case "Legend":
        return "bg-amber-950/90 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/10";
      case "Mythic":
        return "bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  // Play Dex scanner cry sound
  const playDexScanSound = () => {
    try {
      audio.playCaptureSound();
    } catch (e) {}
  };

  return (
    <div className="w-full flex flex-col gap-6 font-mono select-none">
      
      {/* POKEDEX TOP CONSOLE HEADER FRAME */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-red-900/60 p-5 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* Retro Cyber LED Indicators */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse flex items-center justify-center text-xs">
              👁️
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-ping" />
              <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-200 shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playDexScanSound();
              }}
              className="bg-slate-900 hover:bg-slate-800 text-yellow-400 border border-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-inner active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
              <span>DEX SCANNER VOICE</span>
            </button>
          </div>
        </div>

        {/* Title & Completion Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-red-500" />
              <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-wider">
                NEKOMON-DEX SPECIES INDEX
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              {language === "id"
                ? "Katalog ensiklopedia resmi seluruh spesies Nekomon. Tangkap kucing asli dan lakukan Forging untuk melengkapi data koleksi!"
                : "Official encyclopedia catalog of all Nekomon species. Capture real cats and perform Forging to unlock full lore data!"}
            </p>
          </div>

          {/* Dex Progress Widget */}
          <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-2 w-full md:w-64 shrink-0 shadow-inner">
            <div className="flex justify-between items-center text-[10px] font-extrabold">
              <span className="text-slate-400 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                {language === "id" ? "PROGRES DEX" : "DEX PROGRESS"}
              </span>
              <span className="text-yellow-400 text-xs">{progressPercent}%</span>
            </div>

            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-400 rounded-full"
              />
            </div>

            <div className="flex justify-between text-[9px] text-slate-500">
              <span>{discoveredCount} {language === "id" ? "Ditemukan" : "Discovered"}</span>
              <span>{totalSpeciesCount} {language === "id" ? "Total Spesies" : "Total Species"}</span>
            </div>
          </div>
        </div>

      </div>

      {/* SEARCH, FILTER & SORTING BAR */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 shadow-lg">
        
        {/* Search Input Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "id"
                  ? "Cari nama spesies, #nomor, jurus, atau kata kunci lore..."
                  : "Search species name, #number, skill, or lore keywords..."
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 shrink-0">
              <ArrowUpDown className="w-3 h-3 text-red-400" />
              {language === "id" ? "URUTKAN:" : "SORT BY:"}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-red-500/60 cursor-pointer w-full sm:w-auto"
            >
              <option value="DEX">{language === "id" ? "No. Dex (#001)" : "Dex No (#001)"}</option>
              <option value="NAME">{language === "id" ? "Nama (A-Z)" : "Name (A-Z)"}</option>
              <option value="RARITY">{language === "id" ? "Kelangkaan (Tinggi)" : "Rarity (Highest)"}</option>
              <option value="STATS">{language === "id" ? "Total Stat Base" : "Total Base Stats"}</option>
            </select>
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-[10px]">
          
          {/* Status Filters */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
            {(["ALL", "DISCOVERED", "LOCKED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedStatus === st
                    ? "bg-red-950/80 text-red-400 border border-red-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st === "ALL" && (language === "id" ? "SEMUA" : "ALL")}
                {st === "DISCOVERED" && (language === "id" ? "DITEMUKAN" : "DISCOVERED")}
                {st === "LOCKED" && (language === "id" ? "TERKUNCI" : "LOCKED")}
              </button>
            ))}
          </div>

          {/* Element Filters */}
          <div className="flex flex-wrap items-center gap-1">
            {["ALL", "Api", "Air", "Tanah", "Angin", "Petir"].map((elem) => (
              <button
                key={elem}
                onClick={() => setSelectedElement(elem)}
                className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 font-bold transition-all cursor-pointer ${
                  selectedElement === elem
                    ? "bg-slate-800 text-yellow-400 border-yellow-500/50 shadow-sm"
                    : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {elem !== "ALL" && renderElementIcon(elem, "w-3 h-3")}
                <span>{elem === "ALL" ? (language === "id" ? "SEMUA ELEMEN" : "ALL ELEMENTS") : elem}</span>
              </button>
            ))}
          </div>

          {/* Rarity Filter */}
          <div className="flex flex-wrap items-center gap-1">
            {["ALL", "Common", "Rare", "Epic", "Legend", "Mythic"].map((rar) => (
              <button
                key={rar}
                onClick={() => setSelectedRarity(rar)}
                className={`px-2.5 py-1 rounded-xl border font-bold transition-all cursor-pointer ${
                  selectedRarity === rar
                    ? "bg-slate-800 text-amber-400 border-amber-500/50"
                    : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {rar === "ALL" ? (language === "id" ? "SEMUA KELANGKAAN" : "ALL RARITY") : rar}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* SPECIES GRID */}
      {filteredAnalysis.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 text-xl">
            🔍
          </div>
          <div className="text-slate-300 font-bold text-sm">
            {language === "id" ? "Tidak Ada Spesies Nekomon Sesuai Filter" : "No Nekomon Species Matches Filter"}
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            {language === "id"
              ? "Coba ubah kata kunci pencarian atau bersihkan filter elemen/kelangkaan."
              : "Try changing your search query or clear your element/rarity filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAnalysis.map((item) => {
            const { species, isDiscovered, countOwned, highestLevelOwned, userCards } = item;
            const totalBase = species.baseHp + species.baseAtk + species.baseDef + species.baseSpd;
            const cardArtwork = (isDiscovered && userCards && userCards.length > 0 && userCards[0].imageUrl) ? userCards[0].imageUrl : species.imageUrl;

            return (
              <motion.div
                key={species.id}
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => {
                  playDexScanSound();
                  audio.playElementSound(species.element);
                  setSelectedSpecies(species);
                }}
                className={`bg-slate-950 border ${
                  isDiscovered
                    ? "border-slate-800 hover:border-red-500/60 shadow-lg"
                    : "border-slate-900 opacity-80 hover:opacity-100 grayscale hover:grayscale-0"
                } rounded-2xl p-3.5 flex flex-col gap-3 cursor-pointer transition-all relative overflow-hidden group`}
              >
                {/* Header Badge: Dex # & Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                    {species.dexNumber}
                  </span>

                  {isDiscovered ? (
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{countOwned}x • LV.{highestLevelOwned}</span>
                    </span>
                  ) : (
                    <span className="bg-slate-900/90 text-slate-500 border border-slate-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>{language === "id" ? "LOCKED" : "LOCKED"}</span>
                    </span>
                  )}
                </div>

                {/* Species Portrait Artwork / Silhouette */}
                <div className="w-full h-44 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden relative flex items-center justify-center">
                  {isDiscovered ? (
                    <>
                      <img
                        src={cardArtwork}
                        alt={species.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Element Icon Overlay */}
                      <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-1.5 rounded-lg shadow-md">
                        {renderElementIcon(species.element, "w-4 h-4")}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative p-4 text-center">
                      <img
                        src={species.imageUrl}
                        alt={species.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover brightness-0 opacity-20 filter"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-950/70">
                        <Lock className="w-6 h-6 text-slate-600 animate-pulse" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {language === "id" ? "BELUM DITEMUKAN" : "UNDISCOVERED"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Species Name & Details */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-extrabold text-sm text-slate-100 truncate group-hover:text-red-400 transition-colors">
                      {isDiscovered ? species.name : `??? (${species.dexNumber})`}
                    </h3>
                    <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getRarityBadge(species.rarity)}`}>
                      {species.rarity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      {renderElementIcon(species.element, "w-3 h-3")}
                      <span>{species.element}</span>
                    </span>
                    <span className="text-slate-500 font-bold">{species.style}</span>
                  </div>
                </div>

                {/* Base Stats Bar */}
                <div className="grid grid-cols-4 gap-1 text-[8.5px] font-bold text-center bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 mt-1">
                  <div>
                    <span className="text-slate-500 block">HP</span>
                    <span className="text-emerald-400">{species.baseHp}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ATK</span>
                    <span className="text-red-400">{species.baseAtk}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">DEF</span>
                    <span className="text-blue-400">{species.baseDef}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SPD</span>
                    <span className="text-yellow-400">{species.baseSpd}</span>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* POKEDEX SPECIES INSPECTION MODAL */}
      <AnimatePresence>
        {selectedSpecies && (() => {
          const matchingItem = speciesAnalysis.find(
            (item) => item.species.id === selectedSpecies.id
          );
          const isUnlocked = matchingItem?.isDiscovered || false;
          const userCards = matchingItem?.userCards || [];
          const modalArtwork = (isUnlocked && userCards && userCards.length > 0 && userCards[0].imageUrl) ? userCards[0].imageUrl : selectedSpecies.imageUrl;
          const totalStat =
            selectedSpecies.baseHp +
            selectedSpecies.baseAtk +
            selectedSpecies.baseDef +
            selectedSpecies.baseSpd;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setSelectedSpecies(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border-2 border-red-600/60 rounded-3xl p-5 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-5 relative font-mono text-slate-200"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-950 text-red-400 border border-red-500/40 text-xs font-black px-2.5 py-1 rounded-xl">
                      {selectedSpecies.dexNumber}
                    </span>
                    <h2 className="text-lg font-black text-slate-100">
                      {isUnlocked ? selectedSpecies.name : "??? (UNENCOUNTERED)"}
                    </h2>
                  </div>

                  <button
                    onClick={() => setSelectedSpecies(null)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Left Column: Image & Quick Specs */}
                  <div className="flex flex-col gap-3">
                    <div className="w-full h-64 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative shadow-inner">
                      {isUnlocked ? (
                        <>
                          <img
                            src={modalArtwork}
                            alt={selectedSpecies.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                            {renderElementIcon(selectedSpecies.element, "w-4 h-4")}
                            <span className="text-xs font-bold text-slate-200">{selectedSpecies.element}</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                          <img
                            src={selectedSpecies.imageUrl}
                            alt={selectedSpecies.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover brightness-0 opacity-20 filter"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80">
                            <Lock className="w-8 h-8 text-slate-600 animate-bounce" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              {language === "id" ? "DATA SILUET TERKUNCI" : "SILHOUETTE DATA LOCKED"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Species Anatomical Data Table */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-slate-500 block uppercase font-bold">{language === "id" ? "TINGGI" : "HEIGHT"}</span>
                        <span className="font-bold text-slate-200">{selectedSpecies.height}</span>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-slate-500 block uppercase font-bold">{language === "id" ? "BERAT" : "WEIGHT"}</span>
                        <span className="font-bold text-slate-200">{selectedSpecies.weight}</span>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl col-span-2 flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 block uppercase font-bold">{language === "id" ? "HABITAT" : "HABITAT"}</span>
                          <span className="font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            {language === "id" ? selectedSpecies.habitatId : selectedSpecies.habitatEn}
                          </span>
                        </div>
                        <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-400">
                          {selectedSpecies.stage}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Stats & Lore Backstory */}
                  <div className="flex flex-col gap-4">
                    
                    {/* Lore Box */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-red-500" />
                        {language === "id" ? "CATATAN LORE POKÉDEX" : "POKÉDEX LORE ENTRY"}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        {isUnlocked
                          ? language === "id"
                            ? `"${selectedSpecies.loreId}"`
                            : `"${selectedSpecies.loreEn}"`
                          : language === "id"
                          ? `"??? Data spesies ini belum teruji di arena. Lakukan Forging dari foto kucing asli untuk membuka lore lengkap!"`
                          : `"??? Species lore is classified. Perform Forging from a cat capture to decrypt this entry!"`}
                      </p>
                    </div>

                    {/* Base Stats Radar Progress Bars */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2.5">
                      <div className="flex justify-between items-center text-[10px] font-bold border-b border-slate-800/80 pb-1.5">
                        <span className="text-slate-400 uppercase">{language === "id" ? "STATISTIK BASE DENGAN MUTU" : "BASE SPECIES STATS"}</span>
                        <span className="text-yellow-400 font-extrabold">TOTAL: {totalStat}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-snug">
                        {language === "id"
                          ? "Statistik ini adalah profil dasar spesies. Statistik kartu hasil Forge tetap mengikuti rarity dan dapat bervariasi."
                          : "These are species baseline stats. Forged card stats follow rarity ranges and may vary."}
                      </p>

                      <div className="flex flex-col gap-2 text-[10px]">
                        {/* HP Bar */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-0.5">
                            <span>HP (Health)</span>
                            <span className="font-bold text-emerald-400">{selectedSpecies.baseHp}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (selectedSpecies.baseHp / 400) * 100)}%` }} />
                          </div>
                        </div>

                        {/* ATK Bar */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-0.5">
                            <span>ATK (Attack)</span>
                            <span className="font-bold text-red-400">{selectedSpecies.baseAtk}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (selectedSpecies.baseAtk / 200) * 100)}%` }} />
                          </div>
                        </div>

                        {/* DEF Bar */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-0.5">
                            <span>DEF (Defense)</span>
                            <span className="font-bold text-blue-400">{selectedSpecies.baseDef}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (selectedSpecies.baseDef / 200) * 100)}%` }} />
                          </div>
                        </div>

                        {/* SPD Bar */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-0.5">
                            <span>SPD (Speed)</span>
                            <span className="font-bold text-yellow-400">{selectedSpecies.baseSpd}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, (selectedSpecies.baseSpd / 200) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Signature Skill Box */}
                    <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-1">
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                        {language === "id" ? "JURUS SPESIAL SPESIES" : "SIGNATURE SPECIES MOVE"}
                      </span>
                      <div className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                        <span>{selectedSpecies.skillName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {selectedSpecies.skillDesc}
                      </p>
                    </div>

                  </div>

                </div>

                {/* User Owned Inventory Cards Footer */}
                {isUnlocked && userCards.length > 0 && (
                  <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-2.5">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {language === "id"
                        ? `KARTU DALAM INVENTARIS ANDA (${userCards.length} KARTU)`
                        : `CARDS IN YOUR INVENTORY (${userCards.length} CARDS)`}
                    </span>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {userCards.map((c) => (
                        <div
                          key={c.id}
                          className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center gap-2 shrink-0 min-w-36"
                        >
                          <img
                            src={c.imageUrl}
                            alt={c.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0"
                          />
                          <div className="flex flex-col text-[9px] min-w-0">
                            <span className="font-bold text-slate-200 truncate">{c.name}</span>
                            <span className="text-yellow-400 font-bold">LV. {c.level || 1} • {c.rarity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action button if locked */}
                {!isUnlocked && onOpenForge && (
                  <button
                    onClick={() => {
                      setSelectedSpecies(null);
                      onOpenForge();
                    }}
                    className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {language === "id"
                        ? "FORGE FOTO KUCING UNTUK MEMBUKA SPESIES INI!"
                        : "FORGE A CAT CAPTURE TO UNLOCK THIS SPECIES!"}
                    </span>
                  </button>
                )}

              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
