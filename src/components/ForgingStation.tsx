import React, { useState } from "react";
import { Capture, Card } from "../types";
import { Sparkles, Flame, Droplet, Trees, Wind, Zap, RefreshCw, AlertTriangle, Hammer, Compass, Eye, CircleDot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NekomonCard } from "./NekomonCard";
import { audio } from "../lib/audio";
import { useLanguage } from "../context/LanguageContext";

interface ForgingStationProps {
  captures: Capture[];
  userPoints: number;
  onForgeSuccess: (newCard: Card, updatedPoints: number, updatedCores?: number, coresEarned?: number) => void;
  onClose: () => void;
}

const ELEMENTS = [
  { id: "Api", label: "Api", icon: <Flame className="w-4 h-4 text-red-500" />, color: "border-red-500 text-red-400 bg-red-950/30 hover:bg-red-950/50" },
  { id: "Air", label: "Air", icon: <Droplet className="w-4 h-4 text-blue-500" />, color: "border-blue-500 text-blue-400 bg-blue-950/30 hover:bg-blue-950/50" },
  { id: "Tanah", label: "Tanah", icon: <Trees className="w-4 h-4 text-emerald-500" />, color: "border-emerald-500 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/50" },
  { id: "Angin", label: "Angin", icon: <Wind className="w-4 h-4 text-teal-500" />, color: "border-teal-500 text-teal-400 bg-teal-950/30 hover:bg-teal-950/50" },
  { id: "Petir", label: "Petir", icon: <Zap className="w-4 h-4 text-yellow-500" />, color: "border-yellow-500 text-yellow-400 bg-yellow-950/30 hover:bg-yellow-950/50" },
] as const;

const STYLES = [
  { id: "Sentinel", label: "Sentinel", desc: "Karakter anime dengan komposisi lembut, magis, menggunakan referensi studio A-1 picture/Kyoto animation atau nuansa Steampunk.", color: "border-teal-500 text-teal-300 bg-teal-950/30" },
  { id: "Scourge", label: "Scourge", desc: "Karakter anime dengan komposisi tegas, dinamis, tajam, sinematik menggunakan referensi studio Bones/Madhouse atau nuansa Cyberpunk.", color: "border-rose-500 text-rose-300 bg-rose-950/30" },
] as const;

const ELEMENT_REVEAL_DETAILS: Record<string, {
  glow: string;
  shadow: string;
  text: string;
  badge: string;
  emoji: string;
  capsuleName: string;
  desc: string;
  gradient: string;
  beamColor: string;
  buttonClass: string;
}> = {
  Api: {
    glow: "bg-red-500",
    shadow: "shadow-[0_0_50px_rgba(239,68,68,0.6)]",
    text: "text-red-400",
    badge: "bg-red-500/20 border-red-500/40 text-red-300",
    emoji: "🔥",
    capsuleName: "Kapsul Api Abadi",
    desc: "Aura panas membara terpancar hebat dari retakan kapsul logam hitam ini!",
    gradient: "from-red-600 via-orange-500 to-yellow-500",
    beamColor: "rgba(239,68,68,0.8)",
    buttonClass: "from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white"
  },
  Air: {
    glow: "bg-blue-500",
    shadow: "shadow-[0_0_50px_rgba(59,130,246,0.6)]",
    text: "text-blue-400",
    badge: "bg-blue-500/20 border-blue-500/40 text-blue-300",
    emoji: "💧",
    capsuleName: "Kapsul Samudra Purba",
    desc: "Tetesan embun magis menguap dengan cahaya biru pirus yang menenangkan!",
    gradient: "from-blue-600 via-cyan-500 to-sky-400",
    beamColor: "rgba(59,130,246,0.8)",
    buttonClass: "from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white"
  },
  Tanah: {
    glow: "bg-emerald-500",
    shadow: "shadow-[0_0_50px_rgba(16,185,129,0.6)]",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
    emoji: "🌿",
    capsuleName: "Kapsul Hutan Kosmik",
    desc: "Energi kehidupan bumi berdenyut dengan pilar cahaya zamrud yang megah!",
    gradient: "from-emerald-600 via-green-500 to-teal-500",
    beamColor: "rgba(16,185,129,0.8)",
    buttonClass: "from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white"
  },
  Angin: {
    glow: "bg-teal-400",
    shadow: "shadow-[0_0_50px_rgba(20,184,166,0.6)]",
    text: "text-teal-400",
    badge: "bg-teal-500/20 border-teal-500/40 text-teal-300",
    emoji: "🌪️",
    capsuleName: "Kapsul Angin Badai",
    desc: "Pusaran angin topan mistis melilit erat bagian inti pelindung kapsul!",
    gradient: "from-teal-500 via-cyan-400 to-emerald-400",
    beamColor: "rgba(20,184,166,0.8)",
    buttonClass: "from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-white"
  },
  Petir: {
    glow: "bg-yellow-400",
    shadow: "shadow-[0_0_50px_rgba(234,179,8,0.6)]",
    text: "text-yellow-400",
    badge: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
    emoji: "⚡",
    capsuleName: "Kapsul Petir Halilintar",
    desc: "Letupan listrik tegangan tinggi bergemuruh kencang menyelimuti seluruh baja kosmik!",
    gradient: "from-yellow-500 via-purple-600 to-indigo-500",
    beamColor: "rgba(234,179,8,0.8)",
    buttonClass: "from-yellow-500 to-purple-600 hover:from-yellow-400 hover:to-purple-500 text-white"
  }
};

const getElementRevealDetails = (element: string) => {
  return ELEMENT_REVEAL_DETAILS[element] || ELEMENT_REVEAL_DETAILS.Api;
};

export const ForgingStation: React.FC<ForgingStationProps> = ({
  captures,
  userPoints,
  onForgeSuccess,
  onClose,
}) => {
  const { language, t } = useLanguage();
  const unforgedCaptures = captures.filter((c) => !c.isForged);

  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(
    unforgedCaptures[0] || null
  );
  const [selectedElement, setSelectedElement] = useState<"Api" | "Air" | "Tanah" | "Angin" | "Petir">("Api");
  const [selectedStyle, setSelectedStyle] = useState<"Sentinel" | "Scourge">("Sentinel");
  
  const [isForging, setIsForging] = useState<boolean>(false);
  const [forgedCard, setForgedCard] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Custom reveal and unboxing states
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isUnboxing, setIsUnboxing] = useState<boolean>(false);

  const handleStartReveal = () => {
    if (isUnboxing || !forgedCard) return;
    setIsUnboxing(true);

    try {
      audio.playUnboxingExplosion(forgedCard.element);
    } catch (_) {}

    setTimeout(() => {
      setIsRevealed(true);
      setIsUnboxing(false);
      try {
        audio.playRevealSound(selectedStyle);
      } catch (_) {}
    }, 1500);
  };

  const handleForge = async () => {
    if (!selectedCapture) {
      setError(language === "id" ? "Pilih foto kucing dari galeri terlebih dahulu." : "Please choose a cat photo from the gallery first.");
      return;
    }

    if (userPoints < 50) {
      setError(language === "id" ? "Poin Anda tidak mencukupi untuk melakukan forge (membutuhkan 50 poin)." : "Your points are insufficient for forging (requires 50 points).");
      return;
    }

    setIsForging(true);
    setError(null);
    setForgedCard(null);
    setIsRevealed(false);
    setIsUnboxing(false);

    // Play the sweeping energy sound
    try {
      audio.playForgingSound();
    } catch (e) {
      console.warn("Audio feedback error:", e);
    }

    const token = localStorage.getItem("nekomon_token");

    try {
      const response = await fetch("/api/forge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          captureId: selectedCapture.id,
          element: selectedElement,
          style: selectedStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (language === "id" ? "Gagal melakukan forge." : "Failed to forge."));
      }

      // Mimic a dramatic forging delay for extra card opening game vibes!
      setTimeout(() => {
        setForgedCard(data.card);
        onForgeSuccess(data.card, data.points, data.cores, data.coresEarned);
        setIsForging(false);
      }, 4000);

    } catch (err: any) {
      setError(err.message || (language === "id" ? "Gagal melakukan forge." : "Failed to forge."));
      setIsForging(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-4xl mx-auto flex flex-col gap-6 relative">
      
      {/* Header section */}
      <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-yellow-500 animate-pulse" />
            {t("forging.title")}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === "id"
              ? "Satukan foto kucing asli Anda dengan energi elemen kosmik untuk melahirkan Nekomon Card Anime!"
              : "Fuse your real cat photo with cosmic elemental energy to birth an Anime Nekomon Card!"}
          </p>
        </div>
        
        <div className="flex flex-col items-end text-right font-mono text-xs">
          <span className="text-slate-500">{language === "id" ? "Saldo Kredit:" : "Credit Balance:"}</span>
          <span className="font-bold text-yellow-500">{userPoints} {t("common.points")} 🐾</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/80 border border-red-500/30 text-red-200 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Forging Animation overlay state */}
      <AnimatePresence>
        {isForging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950 rounded-2xl flex flex-col items-center justify-center p-6 text-center overflow-hidden"
          >
            {/* Spinning mystical elemental portal */}
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
              {/* Outer Energy Rings */}
              <div className="absolute inset-0 border-4 border-dashed border-yellow-500/20 rounded-full animate-spin-slow" />
              <div className="absolute inset-2 border border-dotted border-purple-500/40 rounded-full animate-spin" />
              <div className="absolute inset-6 border-2 border-dashed border-cyan-500/30 rounded-full animate-spin-reverse" />
              
              {/* Elemental energy spheres */}
              <div className="absolute top-0 w-4 h-4 bg-red-500 rounded-full filter blur-sm animate-pulse" />
              <div className="absolute right-0 w-4 h-4 bg-blue-500 rounded-full filter blur-sm animate-pulse" />
              <div className="absolute bottom-0 w-4 h-4 bg-emerald-500 rounded-full filter blur-sm animate-pulse" />
              <div className="absolute left-0 w-4 h-4 bg-yellow-400 rounded-full filter blur-sm animate-pulse" />

              {/* Central Glowing Cat Icon */}
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border-2 border-yellow-500 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                <Sparkles className="w-10 h-10 text-yellow-500 animate-bounce" />
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-100 tracking-wider">
              {language === "id" ? "MELAKUKAN FORGING..." : "FORGING CARD..."}
            </h3>
            <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
              {language === "id"
                ? "Gemini sedang mentransformasikan foto kucing Anda menjadi ilustrasi anime style legendaris serta memformulasikan statistik kekuatan..."
                : "Gemini is transforming your cat photo into a legendary anime-style illustration and formulating power stats..."}
            </p>

            <div className="flex gap-2.5 mt-6 font-mono text-[10px] text-yellow-500/60 uppercase tracking-widest">
              <span className="animate-pulse">{language === "id" ? "Menghitung Hp" : "Calculating HP"}</span> • 
              <span className="animate-pulse delay-100">{language === "id" ? "Merakit Skill" : "Synthesizing Skills"}</span> • 
              <span className="animate-pulse delay-200">{language === "id" ? "Melukis Gaya" : "Painting Art Style"}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forging Result Display state */}
      <AnimatePresence>
        {forgedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-slate-950/95 rounded-2xl flex flex-col items-center justify-center p-6 overflow-y-auto"
          >
            {!isRevealed ? (
              /* --- DRAMATIC UNBOXING CAPSULE SCREEN --- */
              <div className="flex flex-col items-center justify-center max-w-md w-full text-center relative py-6">
                
                {/* Element-themed Background Aura Light */}
                <div className={`absolute -z-10 w-72 h-72 rounded-full blur-[90px] opacity-45 transition-all duration-1000 ${
                  getElementRevealDetails(forgedCard.element).glow
                }`} />

                {/* Rotating Mystical Magic Circles */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-8">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className={`w-72 h-72 rounded-full border border-dashed opacity-30 ${
                      forgedCard.element === "Api" ? "border-red-500" :
                      forgedCard.element === "Air" ? "border-blue-500" :
                      forgedCard.element === "Tanah" ? "border-emerald-500" :
                      forgedCard.element === "Angin" ? "border-teal-500" : "border-yellow-500"
                    }`}
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                    className={`absolute w-60 h-60 rounded-full border border-dotted opacity-20 ${
                      forgedCard.element === "Api" ? "border-red-400" :
                      forgedCard.element === "Air" ? "border-blue-400" :
                      forgedCard.element === "Tanah" ? "border-emerald-400" :
                      forgedCard.element === "Angin" ? "border-teal-400" : "border-yellow-400"
                    }`}
                  />
                </div>

                {/* Blinding flash overlay on explosion */}
                {isUnboxing && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [1, 2.2, 4.5, 6] }}
                    transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1] }}
                    className={`absolute inset-0 z-20 rounded-full mix-blend-screen pointer-events-none filter blur-md ${
                      getElementRevealDetails(forgedCard.element).glow
                    }`}
                  />
                )}

                {/* Floating Unboxing capsule / card pack container */}
                <motion.div
                  animate={isUnboxing ? {
                    x: [0, -8, 8, -8, 8, -6, 6, -4, 4, 0],
                    y: [0, 6, -8, 6, -8, 4, -4, 2, -2, 0],
                    scale: [1, 1.05, 0.95, 1.1, 0.9, 1.15, 0.85, 1.2, 0.8, 1.1],
                    rotate: [0, -3, 3, -4, 4, -2, 2, -1, 1, 0]
                  } : {
                    y: [0, -12, 0],
                  }}
                  transition={isUnboxing ? {
                    duration: 1.5,
                    ease: "easeInOut"
                  } : {
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut"
                  }}
                  onClick={handleStartReveal}
                  className={`relative w-48 h-64 bg-slate-900 border-2 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer select-none group transition-all overflow-hidden ${
                    forgedCard.element === "Api" ? "border-red-500 hover:border-red-400" :
                    forgedCard.element === "Air" ? "border-blue-500 hover:border-blue-400" :
                    forgedCard.element === "Tanah" ? "border-emerald-500 hover:border-emerald-400" :
                    forgedCard.element === "Angin" ? "border-teal-500 hover:border-teal-400" : "border-yellow-500 hover:border-yellow-400"
                  } ${getElementRevealDetails(forgedCard.element).shadow}`}
                >
                  {/* Glowing lines or particle trail inside the card back */}
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-slate-900/90 z-0" />
                  
                  {/* Glowing cosmic star dust */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)] z-0" />
                  
                  {/* Outer border lights */}
                  <div className="absolute inset-1.5 border border-dashed border-slate-800 rounded-xl z-10" />

                  {/* Element-themed details */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 border-slate-800 bg-slate-950 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-3xl animate-pulse">
                        {getElementRevealDetails(forgedCard.element).emoji}
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                        {language === "id" ? "Kapsul Elemen" : "Elemental Capsule"}
                      </div>
                      <div className={`text-sm font-black uppercase tracking-wider ${
                        getElementRevealDetails(forgedCard.element).text
                      }`}>
                        {language === "id" ? forgedCard.element : (
                          forgedCard.element === "Api" ? "Fire" :
                          forgedCard.element === "Air" ? "Water" :
                          forgedCard.element === "Tanah" ? "Earth" :
                          forgedCard.element === "Angin" ? "Wind" : "Lightning"
                        )}
                      </div>
                    </div>

                    {/* Mystical symbol or core */}
                    <div className="w-8 h-8 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center mt-2 animate-spin-slow">
                      <Sparkles className={`w-4 h-4 ${
                        getElementRevealDetails(forgedCard.element).text
                      }`} />
                    </div>
                  </div>

                  {/* Highlight sheen swept effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />
                </motion.div>

                {/* Description & tap instruction */}
                <div className="mt-8 flex flex-col gap-2 px-4 z-10">
                  <span className={`text-[10px] uppercase font-mono font-bold tracking-widest ${
                    getElementRevealDetails(forgedCard.element).text
                  }`}>
                    {language === "id" ? getElementRevealDetails(forgedCard.element).capsuleName : (
                      forgedCard.element === "Api" ? "Eternal Fire Capsule" :
                      forgedCard.element === "Air" ? "Ancient Ocean Capsule" :
                      forgedCard.element === "Tanah" ? "Cosmic Forest Capsule" :
                      forgedCard.element === "Angin" ? "Storm Wind Capsule" : "Thunder Lightning Capsule"
                    )}
                  </span>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {language === "id" ? getElementRevealDetails(forgedCard.element).desc : (
                      forgedCard.element === "Api" ? "Burning heat radiates fiercely from the cracks of this black metal capsule!" :
                      forgedCard.element === "Air" ? "Magical dew droplets evaporate with a calming turquoise light!" :
                      forgedCard.element === "Tanah" ? "Earth's life force pulses with a magnificent emerald pillar of light!" :
                      forgedCard.element === "Angin" ? "A mystical typhoon vortex wraps tightly around the capsule's protective core!" :
                      "High-voltage electricity sparks and rumbles across the cosmic steel casing!"
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 italic animate-pulse">
                    {language === "id"
                      ? "*Tekan kapsul di atas untuk melangsungkan unboxing kosmik!"
                      : "*Tap the capsule above to initiate cosmic unboxing!"}
                  </p>
                </div>

                {/* Large Action Button */}
                <div className="mt-6 w-full px-6 z-10">
                  <button
                    onClick={handleStartReveal}
                    disabled={isUnboxing}
                    className={`w-full bg-gradient-to-r py-3 px-6 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none ${
                      getElementRevealDetails(forgedCard.element).buttonClass
                    }`}
                  >
                    {isUnboxing 
                      ? (language === "id" ? "MEMBUKA SEGEL..." : "RELEASING SEAL...") 
                      : (language === "id" ? "BUKA KAPSUL SEKARANG 🎁" : "OPEN CAPSULE NOW 🎁")}
                  </button>
                </div>
              </div>
            ) : (
              /* --- THE ORIGINAL CARD DISPLAY & CONTROLS AFTER REVEAL --- */
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-4xl">
                {/* The brand new card with entrance scale/tilt */}
                <motion.div
                  initial={{ rotateY: 180, scale: 0.5 }}
                  animate={{ rotateY: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="relative"
                >
                  {/* Dynamic background lighting behind card */}
                  <div className={`absolute inset-0 rounded-3xl blur-[40px] opacity-35 -z-10 ${
                    getElementRevealDetails(forgedCard.element).glow
                  }`} />

                  <NekomonCard card={forgedCard} size="lg" />
                </motion.div>

                {/* Success details & collector claim controls */}
                <div className="flex flex-col gap-4 max-w-md text-left">
                  <div className="bg-yellow-500 text-slate-950 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider w-max flex items-center gap-1.5 shadow-md">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    {language === "id" ? "NEKOMON CARD BERHASIL DICIPTAKAN!" : "NEKOMON CARD CREATED SUCCESSFULLY!"}
                  </div>

                  <div>
                    <h3 className="text-2xl font-extrabold text-white">{forgedCard.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === "id"
                        ? "Nekomon Card baru Anda telah aman tersimpan di Gallery dan siap diunduh kapan saja!"
                        : "Your new Nekomon Card has been safely stored in your Gallery and is ready for combat!"}
                    </p>
                  </div>

                  {/* Rarity Info block */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rarity:</span>
                      <span className="font-bold text-pink-400 uppercase">{forgedCard.rarity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{language === "id" ? "Elemen:" : "Element:"}</span>
                      <span className={`font-bold ${getElementRevealDetails(forgedCard.element).text}`}>
                        {language === "id" ? forgedCard.element : (
                          forgedCard.element === "Api" ? "Fire" :
                          forgedCard.element === "Air" ? "Water" :
                          forgedCard.element === "Tanah" ? "Earth" :
                          forgedCard.element === "Angin" ? "Wind" : "Lightning"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{language === "id" ? "Studio Gaya:" : "Art Style:"}</span>
                      <span className="font-bold text-teal-400">{forgedCard.style === "Sentinel" ? "Sentinel" : "Scourge"}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/80 pt-2 mt-1">
                      <span className="text-slate-500">{language === "id" ? "Nekomon Core Didapat:" : "Nekomon Cores Gained:"}</span>
                      <span className="font-extrabold text-teal-400 flex items-center gap-1">
                        <CircleDot className="w-3.5 h-3.5 animate-pulse text-teal-400" />
                        +{
                          forgedCard.rarity.toLowerCase() === "rare" ? "2 Cores" :
                          forgedCard.rarity.toLowerCase() === "epic" ? "3 Cores" :
                          (forgedCard.rarity.toLowerCase() === "legend" || forgedCard.rarity.toLowerCase() === "legendary") ? "4 Cores" :
                          forgedCard.rarity.toLowerCase() === "mythic" ? "5 Cores" : "1 Core"
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => {
                        setForgedCard(null);
                        setIsRevealed(false);
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl text-sm transition-all text-center cursor-pointer border border-slate-700"
                    >
                      {language === "id" ? "Forge Lagi" : "Forge Again"}
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-3 px-4 rounded-xl text-sm transition-all text-center cursor-pointer shadow-lg"
                    >
                      {language === "id" ? "Buka Galeri" : "Open Gallery"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Forging Configuration Dashboard */}
      {unforgedCaptures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <Compass className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200">
              {language === "id" ? "Tidak Ada Kucing yang Bisa Di-Forge" : "No Cats Available to Forge"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              {language === "id"
                ? "Semua foto kucing Anda sudah dikonversi menjadi Nekomon Card! Tangkap kucing baru terlebih dahulu menggunakan Kamera Game."
                : "All your cat photos have been converted to Nekomon Cards! Capture a new cat first using the Game Camera."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-5 rounded-lg text-xs transition-all border border-slate-700"
          >
            {language === "id" ? "Kembali ke Beranda" : "Back to Home"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left panel: Capture Selection & configuration */}
          <div className="md:col-span-7 flex flex-col gap-5">
            
            {/* Choose original cat photo */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 font-mono">
                {language === "id" ? "1. PILIH FOTO KUCING DOMESTIK :" : "1. SELECT DOMESTIC CAT PHOTO :"}
              </span>
              <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
                {unforgedCaptures.map((cap) => (
                  <button
                    key={cap.id}
                    onClick={() => setSelectedCapture(cap)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedCapture?.id === cap.id ? "border-yellow-500 scale-95 shadow-md shadow-yellow-500/25" : "border-slate-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={cap.photoUrl}
                      alt="cat"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Choose element */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 font-mono">
                {language === "id" ? "2. PILIH TIPE ELEMEN KEKUATAN (ELEMENT) :" : "2. SELECT ELEMENT POWER TYPE :"}
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {ELEMENTS.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => setSelectedElement(el.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all focus:outline-none cursor-pointer ${
                      selectedElement === el.id 
                        ? `${el.color} border-current scale-102 font-bold shadow-md` 
                        : "border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <span className="mb-1">{el.icon}</span>
                    <span className="text-[10px] uppercase font-mono">
                      {language === "id" ? el.label : (
                        el.id === "Api" ? "Fire" :
                        el.id === "Air" ? "Water" :
                        el.id === "Tanah" ? "Earth" :
                        el.id === "Angin" ? "Wind" : "Lightning"
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Choose Studio Style */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 font-mono">
                {language === "id" ? "3. PILIH STUDIO GAYA ANIME (STYLE) :" : "3. SELECT ANIME ART STYLE :"}
              </span>
              <div className="grid grid-cols-2 gap-3">
                {STYLES.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStyle(st.id)}
                    className={`flex flex-col text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedStyle === st.id 
                        ? `${st.color} scale-102 shadow-md` 
                        : "border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold text-xs font-mono uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                      {st.id === "Sentinel" ? "SENTINEL" : "SCOURGE"}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-normal">
                      {language === "id" ? st.desc : (
                        st.id === "Sentinel"
                          ? "Anime character with soft, magical composition, using references of studio A-1 pictures/Kyoto animation or Steampunk nuances."
                          : "Anime character with bold, dynamic, sharp, cinematic composition using references of studio Bones/Madhouse or Cyberpunk nuances."
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right panel: Live Craft Preview & pricing */}
          <div className="md:col-span-5 flex flex-col justify-between bg-slate-950 p-4 rounded-xl border border-slate-800/80 min-h-[300px]">
            
            {/* Card Portrait placeholder or photo selected */}
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
              <div className="relative w-44 aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
                {selectedCapture ? (
                  <img
                    src={selectedCapture.photoUrl}
                    alt="Selected Cat"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-1.5 p-4">
                    <Eye className="w-8 h-8" />
                    <span className="text-[10px]">
                      {language === "id" ? "Pilih foto kucing di kiri untuk pratinjau" : "Select cat photo on the left to preview"}
                    </span>
                  </div>
                )}
                {selectedCapture && (
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-950/80 text-[9px] text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-800">
                    {language === "id" ? "Bahan Baku" : "Raw Material"}
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-300 uppercase font-mono">
                  {language === "id" ? "Pratinjau Bahan" : "Material Preview"}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {language === "id"
                    ? `Foto ini akan dilarutkan menjadi Nekomon Card ${selectedElement} bergaya ${selectedStyle === "Sentinel" ? "Sentinel" : "Scourge"}`
                    : `This photo will be fused into a ${
                        selectedElement === "Api" ? "Fire" :
                        selectedElement === "Air" ? "Water" :
                        selectedElement === "Tanah" ? "Earth" :
                        selectedElement === "Angin" ? "Wind" : "Lightning"
                      } Nekomon Card with ${selectedStyle === "Sentinel" ? "Sentinel" : "Scourge"} style`}
                </p>
              </div>
            </div>

            {/* Price block & submit */}
            <div className="border-t border-slate-900 pt-3 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">{language === "id" ? "Biaya Forging:" : "Forging Cost:"}</span>
                <span className="font-extrabold text-rose-500">
                  {language === "id" ? "- 50 Poin Credit" : "- 50 Credit Points"}
                </span>
              </div>

              <button
                onClick={handleForge}
                disabled={userPoints < 50 || !selectedCapture}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-black py-3 rounded-xl text-sm transition-all shadow-md shadow-yellow-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Hammer className="w-4 h-4" />
                {language === "id" ? "MULAI FORGE SEKARANG" : "START FORGING NOW"}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
