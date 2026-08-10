import React, { useState, useEffect } from "react";
import { Capture, Card, User } from "../types";
import { NekomonCard } from "./NekomonCard";
import { Camera, Hammer, Download, Image as ImageIcon, Calendar, Sparkles, X, ChevronLeft, ChevronRight, Award, Trash2, AlertTriangle, Loader2, Swords, Shield, Activity, Heart, RotateCcw, History } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { audio } from "../lib/audio";

// Cute custom illustrations generated via Imagen
const emptyDeckCat = new URL("../assets/images/empty_deck_cat_1784259732166.jpg", import.meta.url).href;
const emptyCaptureCat = new URL("../assets/images/empty_capture_cat_1784259746139.jpg", import.meta.url).href;

interface GalleryViewProps {
  captures: Capture[];
  cards: Card[];
  onSelectForge: (capture: Capture) => void;
  onDestroyCard: (cardId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onDeleteCapture: (captureId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onRetakeCapture?: (captureId: string, newPhotoBase64: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onEvolveCard: (cardId: string) => Promise<{ success: boolean; message?: string; error?: string; card?: Card }>;
  onCancelEvolution: (cardId: string) => Promise<{ success: boolean; message?: string; error?: string; card?: Card }>;
  user?: User | null;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  captures,
  cards,
  onSelectForge,
  onDestroyCard,
  onDeleteCapture,
  onRetakeCapture,
  onEvolveCard,
  onCancelEvolution,
  user,
}) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"cards" | "captures">("cards");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  
  // Carousel state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Active card displayed in gallery
  const activeDisplayedCard = cards[Math.min(currentCardIndex, cards.length - 1)];

  // Play unique element sound whenever a card appears in the gallery view
  useEffect(() => {
    if (activeTab === "cards" && activeDisplayedCard) {
      try {
        audio.playElementSound(activeDisplayedCard.element);
      } catch (e) {
        console.error("Failed to play element sound:", e);
      }
    }
  }, [activeDisplayedCard?.id, activeTab]);

  const handleNextCard = () => {
    if (cards.length === 0) return;
    setCurrentCardIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrevCard = () => {
    if (cards.length === 0) return;
    setCurrentCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleSelectCardModal = (card: Card) => {
    setSelectedCard(card);
    if (card) {
      try {
        audio.playElementSound(card.element);
      } catch (e) {}
    }
  };

  // Capture deletion states
  const [selectedCaptureForDelete, setSelectedCaptureForDelete] = useState<Capture | null>(null);
  const [isDeletingCapture, setIsDeletingCapture] = useState(false);
  const [deleteCaptureError, setDeleteCaptureError] = useState<string | null>(null);

  // Destruction flow states
  const [isConfirmingDestroy, setIsConfirmingDestroy] = useState(false);
  const [isDestroying, setIsDestroying] = useState(false);
  const [destroyError, setDestroyError] = useState<string | null>(null);
  const [destroySuccess, setDestroySuccess] = useState<string | null>(null);

  // Evolution flow states
  const [isConfirmingEvolve, setIsConfirmingEvolve] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolveError, setEvolveError] = useState<string | null>(null);
  const [evolveSuccess, setEvolveSuccess] = useState<{
    message: string;
    oldCard: Card;
    newCard: Card;
    statsIncreases: { hp: number; atk: number; def: number; spd: number };
  } | null>(null);

  // Cancel/Revert Evolution flow states
  const [isConfirmingCancelEvolve, setIsConfirmingCancelEvolve] = useState(false);
  const [isCancellingEvolve, setIsCancellingEvolve] = useState(false);
  const [cancelEvolveError, setCancelEvolveError] = useState<string | null>(null);
  const [cancelEvolveSuccess, setCancelEvolveSuccess] = useState<string | null>(null);

  // Download Nekomon Card image as JPEG/PNG
  const downloadCardImage = (card: Card) => {
    try {
      const link = document.createElement("a");
      link.href = card.imageUrl;
      link.download = `Nekomon_${card.name.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Gagal mengunduh gambar kartu:", e);
    }
  };

  const getRefundAmount = (rarity: string) => {
    const r = (rarity || "Common").toLowerCase();
    if (r === "rare") return 15;
    if (r === "epic") return 20;
    if (r === "legend" || r === "legendary") return 25;
    if (r === "mythic") return 30;
    return 10;
  };

  const getEvolveRequirements = (rarity: string) => {
    const r = (rarity || "Common").toLowerCase();
    if (r === "common") return { next: "Rare", cores: 2, points: 50 };
    if (r === "rare") return { next: "Epic", cores: 4, points: 100 };
    if (r === "epic") return { next: "Legend", cores: 8, points: 150 };
    if (r === "legend" || r === "legendary") return { next: "Mythic", cores: 12, points: 250 };
    return null;
  };

  const getCancelEvolutionRequirements = (rarity: string) => {
    const reqs = getEvolveRequirements(rarity);
    if (!reqs) return null;
    return {
      cores: Math.floor(reqs.cores * 0.5),
      points: Math.floor(reqs.points * 0.5),
    };
  };

  const handleCloseModal = () => {
    setSelectedCard(null);
    setIsConfirmingDestroy(false);
    setIsDestroying(false);
    setDestroyError(null);
    setDestroySuccess(null);
    setIsConfirmingEvolve(false);
    setIsEvolving(false);
    setEvolveError(null);
    setEvolveSuccess(null);
    setIsConfirmingCancelEvolve(false);
    setIsCancellingEvolve(false);
    setCancelEvolveError(null);
    setCancelEvolveSuccess(null);
  };

  const handleConfirmDestroy = async () => {
    if (!selectedCard) return;
    setIsDestroying(true);
    setDestroyError(null);
    try {
      const res = await onDestroyCard(selectedCard.id);
      if (res.success) {
        setDestroySuccess(res.message || (language === "id" ? "Kartu berhasil dihancurkan!" : "Card successfully destroyed!"));
      } else {
        setDestroyError(res.error || (language === "id" ? "Gagal menghancurkan kartu." : "Failed to destroy card."));
      }
    } catch (err) {
      setDestroyError(language === "id" ? "Terjadi kesalahan tak terduga." : "An unexpected error occurred.");
    } finally {
      setIsDestroying(false);
    }
  };

  const handleConfirmEvolve = async () => {
    if (!selectedCard) return;
    setIsEvolving(true);
    setEvolveError(null);
    try {
      const oldCard = { ...selectedCard };
      const res = await onEvolveCard(selectedCard.id);
      if (res.success && res.card) {
        setEvolveSuccess({
          message: res.message || (language === "id" ? "Evolusi berhasil!" : "Evolution successful!"),
          oldCard,
          newCard: res.card,
          statsIncreases: {
            hp: res.card.hp - oldCard.hp,
            atk: res.card.atk - oldCard.atk,
            def: res.card.def - oldCard.def,
            spd: (res.card.spd || 45) - (oldCard.spd || 45),
          }
        });
        setSelectedCard(res.card);
      } else {
        setEvolveError(res.error || (language === "id" ? "Gagal melakukan evolusi kartu." : "Failed to evolve card."));
      }
    } catch (err) {
      setEvolveError(language === "id" ? "Terjadi kesalahan tak terduga." : "An unexpected error occurred.");
    } finally {
      setIsEvolving(false);
    }
  };

  const handleConfirmCancelEvolve = async () => {
    if (!selectedCard) return;
    setIsCancellingEvolve(true);
    setCancelEvolveError(null);
    try {
      const res = await onCancelEvolution(selectedCard.id);
      if (res.success && res.card) {
        setCancelEvolveSuccess(res.message || (language === "id" ? "Evolusi berhasil dibatalkan!" : "Evolution successfully cancelled!"));
        setSelectedCard(res.card);
      } else {
        setCancelEvolveError(res.error || (language === "id" ? "Gagal membatalkan evolusi kartu." : "Failed to cancel card evolution."));
      }
    } catch (err) {
      setCancelEvolveError(language === "id" ? "Terjadi kesalahan tak terduga." : "An unexpected error occurred.");
    } finally {
      setIsCancellingEvolve(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-800 bg-slate-950 p-1.5 rounded-xl max-w-md mx-auto w-full font-mono text-xs">
        <button
          onClick={() => setActiveTab("cards")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold transition-all ${
            activeTab === "cards" 
              ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-md" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          {language === "id" ? `Nekomon Deck (${cards.length})` : `Nekomon Deck (${cards.length})`}
        </button>
        <button
          onClick={() => setActiveTab("captures")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold transition-all ${
            activeTab === "captures" 
              ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-md" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          {language === "id" ? `Kucing Tangkapan (${captures.length})` : `Captured Cats (${captures.length})`}
        </button>
      </div>

      {/* Main Grid display depending on Active Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "cards" ? (
          <motion.div
            key="cards-deck"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-5 bg-slate-900/10 rounded-2xl border border-slate-800/50 max-w-lg mx-auto w-full">
                <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-2 border-yellow-500/30 shadow-[0_0_25px_rgba(234,179,8,0.15)] bg-slate-950 flex items-center justify-center">
                  <img 
                    src={emptyDeckCat} 
                    alt="Empty Deck Cozy Cat" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-100 text-base font-mono flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                    {language === "id" ? "Album Nekomon Masih Kosong" : "Nekomon Deck is Empty"}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    {language === "id"
                      ? "Anda belum melakukan forging kartu! Ambil foto kucing menggunakan kamera, dapatkan poin, dan ubah foto mereka menjadi kartu anime."
                      : "You haven't forged any cards yet! Take real cat photos using the camera, earn points, and forge them into legendary anime cards."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 w-full">
                {/* Stunning Interactive Horizontal Carousel */}
                <div className="relative flex items-center justify-center w-full min-h-[500px] py-4 bg-slate-950/20 rounded-2xl border border-slate-900/50 p-6">
                  {/* Left Navigation Arrow */}
                  {cards.length > 1 && (
                    <button
                      onClick={handlePrevCard}
                      className="absolute left-4 z-30 p-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-xl active:scale-95"
                      title={language === "id" ? "Sebelumnya" : "Previous"}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}

                  {/* Dynamic Centered Active Card Slide */}
                  <div className="overflow-visible flex items-center justify-center max-w-full">
                    <AnimatePresence mode="wait">
                      {cards[Math.min(currentCardIndex, cards.length - 1)] && (
                        <motion.div
                          key={cards[Math.min(currentCardIndex, cards.length - 1)].id}
                          initial={{ opacity: 0, x: 80, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -80, scale: 0.95 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="flex justify-center"
                        >
                          <NekomonCard
                            card={cards[Math.min(currentCardIndex, cards.length - 1)]}
                            onClick={() => handleSelectCardModal(cards[Math.min(currentCardIndex, cards.length - 1)])}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right Navigation Arrow */}
                  {cards.length > 1 && (
                    <button
                      onClick={handleNextCard}
                      className="absolute right-4 z-30 p-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-xl active:scale-95"
                      title={language === "id" ? "Berikutnya" : "Next"}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Dot Pagination indicators */}
                {cards.length > 1 && (
                  <div className="flex items-center justify-center gap-2 flex-wrap max-w-md px-4 mt-1">
                    {cards.map((card, idx) => (
                      <button
                        key={card.id}
                        onClick={() => setCurrentCardIndex(idx)}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === Math.min(currentCardIndex, cards.length - 1)
                            ? "bg-yellow-500 w-5"
                            : "bg-slate-800 hover:bg-slate-700 w-2"
                        }`}
                        title={language === "id" ? `Buka Kartu ${idx + 1}` : `View Card ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Numeric Card Info label */}
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase bg-slate-950 px-3 py-1.5 rounded-full border border-slate-900/60">
                    {language === "id"
                      ? `KARTU ${Math.min(currentCardIndex, cards.length - 1) + 1} DARI ${cards.length} • KLIK UNTUK DETAIL STATS`
                      : `CARD ${Math.min(currentCardIndex, cards.length - 1) + 1} OF ${cards.length} • CLICK FOR DETAIL STATS`}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="captures-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            {captures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-5 bg-slate-900/10 rounded-2xl border border-slate-800/50 max-w-lg mx-auto w-full">
                <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-2 border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.15)] bg-slate-950 flex items-center justify-center">
                  <img 
                    src={emptyCaptureCat} 
                    alt="Empty Capture Cat" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-100 text-base font-mono flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4 text-blue-400" />
                    {language === "id" ? "Belum Ada Kucing Tertangkap" : "No Cats Captured Yet"}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    {language === "id"
                      ? "Buka tab Kamera dan foto kucing asli di sekitar Anda secara aktual untuk memulai koleksi dan menambah poin."
                      : "Open the Camera tab and photograph real cats around you to begin your collection and earn points."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {captures.map((cap) => (
                  <motion.div
                    key={cap.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col justify-between relative group"
                  >
                    {/* Capture photo */}
                    <div className="relative aspect-[4/3] w-full bg-slate-950">
                      <img
                        src={cap.photoUrl}
                        alt="Captured cat"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Delete capture button overlay */}
                      <button
                        onClick={() => setSelectedCaptureForDelete(cap)}
                        className="absolute top-2 left-2 p-1.5 bg-slate-950/80 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg border border-slate-800/80 hover:border-red-900/50 transition-all cursor-pointer z-10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title={language === "id" ? "Hapus foto kucing ini" : "Delete this cat photo"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Forged status badge */}
                      <span className={`absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded border ${
                        cap.isForged 
                          ? "bg-slate-950/80 text-slate-400 border-slate-800" 
                          : "bg-yellow-500 text-slate-950 border-yellow-400 animate-pulse"
                      }`}>
                        {cap.isForged 
                          ? (language === "id" ? "SUDAH FORGED" : "FORGED") 
                          : (language === "id" ? "SIAP FORGE" : "READY TO FORGE")}
                      </span>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3 flex flex-col gap-2 bg-slate-900/90">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>
                            {new Date(cap.createdAt).toLocaleDateString(language === "id" ? "id-ID" : "en-US")}
                          </span>
                        </div>
                        {cap.spotName && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded truncate max-w-[100px]">
                            📍 {cap.spotName}
                          </span>
                        )}
                      </div>

                      {!cap.isForged ? (
                        <button
                          onClick={() => onSelectForge(cap)}
                          className="w-full mt-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-bold py-1.5 px-2.5 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Hammer className="w-3.5 h-3.5" />
                          {language === "id" ? "Forge ke Nekomon" : "Forge to Nekomon"}
                        </button>
                      ) : (
                        <span className="w-full mt-1 bg-slate-950 border border-slate-800 text-slate-500 font-medium py-1.5 text-center block rounded-lg text-[10px] uppercase font-mono">
                          {language === "id" ? "Sudah Di-Forge" : "Already Forged"}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Inspector Modal for Single Nekomon Card */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={`bg-slate-900 border border-slate-800 rounded-2xl w-full p-5 relative shadow-2xl flex flex-col gap-4 transition-all duration-300 max-h-[95vh] overflow-y-auto ${
                isConfirmingDestroy || destroySuccess || isConfirmingEvolve || !!evolveSuccess || isConfirmingCancelEvolve || !!cancelEvolveSuccess ? "max-w-md" : "max-w-md md:max-w-3xl"
              }`}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded-full bg-slate-800 border border-slate-700 transition-all cursor-pointer z-55"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title */}
              <h3 className="font-extrabold text-slate-100 text-lg pr-8 font-mono border-b border-slate-800/80 pb-2">
                {destroySuccess ? (language === "id" ? "Hasil Destroy Kartu" : "Card Destroy Result") : 
                 isConfirmingDestroy ? (language === "id" ? "Hancurkan Kartu Nekomon" : "Dismantle Nekomon Card") : 
                 evolveSuccess ? (language === "id" ? "Evolusi Sukses! 🎉" : "Evolution Successful! 🎉") :
                 isConfirmingEvolve ? (language === "id" ? "Evolusi Nekomon Card" : "Evolve Nekomon Card") : 
                 cancelEvolveSuccess ? (language === "id" ? "Evolusi Dibatalkan! 🔄" : "Evolution Cancelled! 🔄") :
                 isConfirmingCancelEvolve ? (language === "id" ? "Batalkan Evolusi Nekomon" : "Cancel Nekomon Evolution") : 
                 (language === "id" ? "Detail Nekomon Card" : "Nekomon Card Details")}
              </h3>

              {/* Success Screen */}
              {destroySuccess ? (
                <div className="bg-emerald-950/30 border border-emerald-900/50 p-6 rounded-xl flex flex-col items-center text-center gap-4 my-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-400 text-base">
                      {language === "id" ? "Berhasil Dihancurkan!" : "Destroyed Successfully!"}
                    </h4>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {destroySuccess}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    {language === "id" ? "SELESAI 🐾" : "DONE 🐾"}
                  </button>
                </div>
              ) : cancelEvolveSuccess ? (
                /* Cancel Evolution Success Screen */
                <div className="bg-amber-950/20 border border-amber-900/30 p-6 rounded-xl flex flex-col items-center text-center gap-4 my-2 font-mono">
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-amber-400 text-base">
                      {language === "id" ? "Evolusi Berhasil Dibatalkan!" : "Evolution Reverted Successfully!"}
                    </h4>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {cancelEvolveSuccess}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCancelEvolveSuccess(null);
                      setIsConfirmingCancelEvolve(false);
                    }}
                    className="w-full mt-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    {language === "id" ? "KEMBALI 🐾" : "BACK 🐾"}
                  </button>
                </div>
              ) : evolveSuccess ? (
                /* Card Evolution Success Screen */
                <div className="flex flex-col gap-5 my-2">
                  {/* Big Sparkling Icon */}
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 animate-bounce">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 uppercase tracking-wide font-mono">
                        {language === "id" ? "Nekomon Berhasil Berevolusi!" : "Nekomon Evolved Successfully!"}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm mt-1 text-center">
                        {evolveSuccess.message}
                      </p>
                    </div>
                  </div>

                  {/* Before vs After Visual & Name Comparison */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 font-mono">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/60">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          {language === "id" ? "Sebelum" : "Before"}
                        </span>
                        <span className="font-extrabold text-slate-300 block max-w-[120px] truncate">{evolveSuccess.oldCard.name}</span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">{evolveSuccess.oldCard.rarity}</span>
                      </div>
                      <div className="text-center px-2 animate-pulse text-yellow-500 font-black text-sm">
                        ➔
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-pink-500 block uppercase font-bold">
                          {language === "id" ? "Sesudah" : "After"}
                        </span>
                        <span className="font-extrabold text-white block max-w-[120px] truncate">{evolveSuccess.newCard.name}</span>
                        <span className="text-[9px] bg-pink-950 text-pink-300 border border-pink-800/50 px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">{evolveSuccess.newCard.rarity}</span>
                      </div>
                    </div>

                    {/* Stats Increase List with values */}
                    <div className="flex flex-col gap-2 text-xs">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-bold">
                        {language === "id" ? "Peningkatan Stat Tambahan:" : "Additional Stat Increases:"}
                      </span>
                      
                      {/* HP */}
                      <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg border border-slate-800/40">
                        <span className="text-slate-400 font-bold">HP (HIT POINTS)</span>
                        <span className="text-emerald-400 font-extrabold">
                          {evolveSuccess.oldCard.hp} ➔ {evolveSuccess.newCard.hp} (+{evolveSuccess.statsIncreases.hp})
                        </span>
                      </div>

                      {/* ATK */}
                      <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg border border-slate-800/40">
                        <span className="text-slate-400 font-bold">ATK (ATTACK)</span>
                        <span className="text-emerald-400 font-extrabold">
                          {evolveSuccess.oldCard.atk} ➔ {evolveSuccess.newCard.atk} (+{evolveSuccess.statsIncreases.atk})
                        </span>
                      </div>

                      {/* DEF */}
                      <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg border border-slate-800/40">
                        <span className="text-slate-400 font-bold">DEF (DEFENSE)</span>
                        <span className="text-emerald-400 font-extrabold">
                          {evolveSuccess.oldCard.def} ➔ {evolveSuccess.newCard.def} (+{evolveSuccess.statsIncreases.def})
                        </span>
                      </div>

                      {/* SPD */}
                      <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg border border-slate-800/40">
                        <span className="text-slate-400 font-bold">SPD (SPEED)</span>
                        <span className="text-emerald-400 font-extrabold">
                          {evolveSuccess.oldCard.spd || 45} ➔ {evolveSuccess.newCard.spd || 45} (+{evolveSuccess.statsIncreases.spd})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Skill Change */}
                  <div className="bg-gradient-to-r from-purple-950/20 to-slate-900 border border-purple-900/30 p-3 rounded-xl flex flex-col gap-1 text-[11px] font-mono">
                    <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider font-bold">
                      {language === "id" ? "Skill Hasil Evolusi Baru:" : "New Evolved Skill:"}
                    </span>
                    <span className="font-extrabold text-white text-xs">{evolveSuccess.newCard.skillName}</span>
                    <p className="text-slate-400 text-[10px] leading-relaxed mt-0.5">{evolveSuccess.newCard.skillDesc}</p>
                  </div>

                  {/* View Card / Close Actions */}
                  <div className="flex flex-col gap-2 font-mono">
                    <button
                      onClick={() => {
                        setEvolveSuccess(null);
                        setIsConfirmingEvolve(false);
                      }}
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md"
                    >
                      {language === "id" ? "LIHAT DETIL KARTU EVOLUSI 🐾" : "VIEW EVOLVED CARD DETAILS 🐾"}
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-2 rounded-xl text-xs transition-all border border-slate-700 cursor-pointer"
                    >
                      {language === "id" ? "Kembali ke Galeri" : "Back to Gallery"}
                    </button>
                  </div>
                </div>
              ) : isConfirmingEvolve ? (
                /* Evolution Confirmation Screen */
                <div className="flex flex-col gap-4 my-2">
                  {(() => {
                    const reqs = getEvolveRequirements(selectedCard.rarity);
                    if (!reqs) return null;
                    const userCores = user?.cores || 0;
                    const userPoints = user?.points || 0;
                    const isCoresSufficient = userCores >= reqs.cores;
                    const isPointsSufficient = userPoints >= reqs.points;
                    const canEvolve = isCoresSufficient && isPointsSufficient;
                    return (
                      <>
                        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col gap-3.5 text-xs font-mono leading-relaxed">
                          <div className="flex items-center gap-2 text-yellow-500 font-bold">
                            <Sparkles className="w-5 h-5 shrink-0 text-yellow-400 animate-spin" />
                            <div>
                              <p className="text-sm">{language === "id" ? "Inisiasi Ritual Evolusi" : "Initiate Evolution Ritual"}</p>
                              <p className="text-[10px] font-normal text-slate-500 mt-0.5">{language === "id" ? "Memanfaatkan Nekomon Cores & Poin" : "Harnessing Nekomon Cores & Points"}</p>
                            </div>
                          </div>
                          
                          <p className="text-slate-300">
                            {language === "id" ? (
                              <>
                                Anda akan melakukan evolusi pada kartu <span className="font-extrabold text-white">"{selectedCard.name}"</span> dari rarity <span className="font-extrabold text-slate-300">{selectedCard.rarity}</span> menuju tingkat <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 uppercase">{reqs.next}</span>!
                              </>
                            ) : (
                              <>
                                You are about to evolve the card <span className="font-extrabold text-white">"{selectedCard.name}"</span> from <span className="font-extrabold text-slate-300">{selectedCard.rarity}</span> tier up to <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 uppercase">{reqs.next}</span>!
                              </>
                            )}
                          </p>

                          {/* Requirements comparison */}
                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block font-bold">{language === "id" ? "Biaya Persyaratan Evolusi:" : "Evolution Requirement Costs:"}</span>
                            
                            {/* Cores requirement */}
                            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/40">
                              <span className="text-slate-400 font-bold flex items-center gap-1">💎 NEKOMON CORES</span>
                              <span className="font-extrabold flex flex-col items-end">
                                <span className="text-slate-300">{language === "id" ? `Butuh: ${reqs.cores} Cores` : `Requires: ${reqs.cores} Cores`}</span>
                                <span className={`text-[10px] font-bold ${isCoresSufficient ? "text-emerald-400" : "text-red-400"}`}>
                                  {language === "id" ? `Milik Anda: ${userCores} ${isCoresSufficient ? "✓" : "✗ (Kurang)"}` : `Your Balance: ${userCores} ${isCoresSufficient ? "✓" : "✗ (Insufficient)"}`}
                                </span>
                              </span>
                            </div>

                            {/* Points requirement */}
                            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/40">
                              <span className="text-slate-400 font-bold flex items-center gap-1">🪙 POIN REWARD</span>
                              <span className="font-extrabold flex flex-col items-end">
                                <span className="text-slate-300">{language === "id" ? `Butuh: ${reqs.points} Poin` : `Requires: ${reqs.points} Points`}</span>
                                <span className={`text-[10px] font-bold ${isPointsSufficient ? "text-emerald-400" : "text-red-400"}`}>
                                  {language === "id" ? `Milik Anda: ${userPoints} ${isPointsSufficient ? "✓" : "✗ (Kurang)"}` : `Your Balance: ${userPoints} ${isPointsSufficient ? "✓" : "✗ (Insufficient)"}`}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {evolveError && (
                          <div className="bg-red-950/40 text-red-400 p-2.5 rounded-lg border border-red-900/30 text-[11px] font-mono text-center">
                            {evolveError}
                          </div>
                        )}

                        {!canEvolve && (
                          <div className="bg-yellow-950/20 border border-yellow-900/30 text-yellow-500 p-2.5 rounded-xl text-[10px] leading-normal font-mono">
                            {language === "id" 
                              ? "⚠️ Saldo Nekomon Cores atau Poin Anda tidak mencukupi untuk melakukan ritual evolusi ini. Kumpulkan Cores dengan melakukan forge kartu baru, atau selesaikan aktivitas misi harian untuk mendapatkan poin tambahan." 
                              : "⚠️ Your Nekomon Cores or Points balance is insufficient to perform this evolution ritual. Collect Cores by forging new cards, or complete daily card missions to earn additional points."}
                          </div>
                        )}

                        <div className="flex gap-2 border-t border-slate-800/80 pt-4 font-mono">
                          <button
                            disabled={isEvolving || !canEvolve}
                            onClick={handleConfirmEvolve}
                            className={`flex-1 font-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-lg ${
                              canEvolve 
                                ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-purple-500/10" 
                                : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                            }`}
                          >
                            {isEvolving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {language === "id" ? "MERAPAL RITUAL ELEMEN..." : "CASTING ELEMENT RITUAL..."}
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                {language === "id" ? "EVOLUSIKAN KARTU" : "EVOLVE CARD"}
                              </>
                            )}
                          </button>
                          <button
                            disabled={isEvolving}
                            onClick={() => setIsConfirmingEvolve(false)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 rounded-xl transition-all border border-slate-700 cursor-pointer text-xs"
                          >
                            {language === "id" ? "Batal" : "Cancel"}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : isConfirmingCancelEvolve ? (
                /* Cancel Evolution Confirmation Screen */
                <div className="flex flex-col gap-4 my-2">
                  {(() => {
                    const history = selectedCard.evolutionHistory || [];
                    if (history.length === 0) return null;
                    const prevForm = history[history.length - 1];
                    const reqs = getCancelEvolutionRequirements(prevForm.rarity);
                    if (!reqs) return null;
                    const userCores = user?.cores || 0;
                    const userPoints = user?.points || 0;
                    const isCoresSufficient = userCores >= reqs.cores;
                    const isPointsSufficient = userPoints >= reqs.points;
                    const canCancel = isCoresSufficient && isPointsSufficient;
                    return (
                      <>
                        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col gap-3.5 text-xs font-mono leading-relaxed">
                          <div className="flex items-center gap-2 text-yellow-500 font-bold">
                            <Sparkles className="w-5 h-5 shrink-0 text-yellow-400 animate-spin" />
                            <div>
                              <p className="text-sm">{language === "id" ? "Inisiasi Pembatalan Evolusi" : "Initiate Evolution Reversion"}</p>
                              <p className="text-[10px] font-normal text-slate-500 mt-0.5">{language === "id" ? "Mengembalikan Nekomon ke tahap sebelumnya" : "Reverting Nekomon to its previous stage"}</p>
                            </div>
                          </div>
                          
                          <p className="text-slate-300">
                            {language === "id" ? (
                              <>
                                Anda akan membatalkan evolusi kartu <span className="font-extrabold text-white">"{selectedCard.name}"</span> ({selectedCard.rarity}) kembali ke wujud sebelumnya: <span className="font-extrabold text-yellow-400">"{prevForm.name}"</span> ({prevForm.rarity}).
                              </>
                            ) : (
                              <>
                                You are about to revert the evolution of the card <span className="font-extrabold text-white">"{selectedCard.name}"</span> ({selectedCard.rarity}) back to its previous stage: <span className="font-extrabold text-yellow-400">"{prevForm.name}"</span> ({prevForm.rarity}).
                              </>
                            )}
                          </p>

                          <p className="text-slate-400 text-[10px] leading-normal italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40">
                            {language === "id" 
                              ? "*Catatan: Pembatalan membutuhkan biaya tambahan sebesar 50% dari biaya evolusi sebelumnya. Biaya orisinal evolusi tidak dikembalikan."
                              : "*Note: Reversion requires an additional cost equal to 50% of the previous evolution cost. Original evolution costs will not be refunded."}
                          </p>
 
                          {/* Requirements comparison */}
                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block font-bold">
                              {language === "id" ? "Biaya Pembatalan (50% dari biaya sebelumnya):" : "Reversion Costs (50% of previous cost):"}
                            </span>
                            
                            {/* Cores requirement */}
                            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/40">
                              <span className="text-slate-400 font-bold flex items-center gap-1">💎 NEKOMON CORES</span>
                              <span className="font-extrabold flex flex-col items-end">
                                <span className="text-slate-300">{language === "id" ? `Butuh: ${reqs.cores} Cores` : `Requires: ${reqs.cores} Cores`}</span>
                                <span className={`text-[10px] font-bold ${isCoresSufficient ? "text-emerald-400" : "text-red-400"}`}>
                                  {language === "id" ? `Milik Anda: ${userCores} ${isCoresSufficient ? "✓" : "✗ (Kurang)"}` : `Your Balance: ${userCores} ${isCoresSufficient ? "✓" : "✗ (Insufficient)"}`}
                                </span>
                              </span>
                            </div>
 
                            {/* Points requirement */}
                            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/40">
                              <span className="text-slate-400 font-bold flex items-center gap-1">🪙 POIN REWARD</span>
                              <span className="font-extrabold flex flex-col items-end">
                                <span className="text-slate-300">{language === "id" ? `Butuh: ${reqs.points} Poin` : `Requires: ${reqs.points} Points`}</span>
                                <span className={`text-[10px] font-bold ${isPointsSufficient ? "text-emerald-400" : "text-red-400"}`}>
                                  {language === "id" ? `Milik Anda: ${userPoints} ${isPointsSufficient ? "✓" : "✗ (Kurang)"}` : `Your Balance: ${userPoints} ${isPointsSufficient ? "✓" : "✗ (Insufficient)"}`}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
 
                        {cancelEvolveError && (
                          <div className="bg-red-950/40 text-red-400 p-2.5 rounded-lg border border-red-900/30 text-[11px] font-mono text-center">
                            {cancelEvolveError}
                          </div>
                        )}
 
                        {!canCancel && (
                          <div className="bg-yellow-950/20 border border-yellow-900/30 text-yellow-500 p-2.5 rounded-xl text-[10px] leading-normal font-mono">
                            {language === "id" 
                              ? "⚠️ Saldo Nekomon Cores atau Poin Anda tidak mencukupi untuk membatalkan evolusi ini." 
                              : "⚠️ Your Nekomon Cores or Points balance is insufficient to revert this evolution."}
                          </div>
                        )}
 
                        <div className="flex gap-2 border-t border-slate-800/80 pt-4 font-mono">
                          <button
                            disabled={isCancellingEvolve || !canCancel}
                            onClick={handleConfirmCancelEvolve}
                            className={`flex-1 font-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-lg ${
                              canCancel 
                                ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 shadow-yellow-500/10" 
                                : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                            }`}
                          >
                            {isCancellingEvolve ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {language === "id" ? "MEMPROSES..." : "PROCESSING..."}
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                {language === "id" ? "BATALKAN EVOLUSI" : "REVERT EVOLUTION"}
                              </>
                            )}
                          </button>
                          <button
                            disabled={isCancellingEvolve}
                            onClick={() => setIsConfirmingCancelEvolve(false)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 rounded-xl transition-all border border-slate-700 cursor-pointer text-xs"
                          >
                            {language === "id" ? "Tutup" : "Close"}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : isConfirmingDestroy ? (
                /* Confirmation Screen */
                <div className="flex flex-col gap-4 my-2">
                  <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-xl flex flex-col gap-3 text-xs leading-relaxed">
                    <div className="flex items-start gap-2 text-red-400 font-bold">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="text-sm">{language === "id" ? "Konfirmasi Tindakan Permanen" : "Confirm Permanent Action"}</p>
                        <p className="text-[10px] font-normal text-slate-400 mt-0.5">{language === "id" ? "Tindakan ini tidak dapat dibatalkan!" : "This action cannot be undone!"}</p>
                      </div>
                    </div>
                    <p className="text-slate-300">
                      {language === "id" ? (
                        <>
                          Anda akan menghancurkan kartu <span className="font-extrabold text-white">"{selectedCard.name}"</span> ({selectedCard.rarity}) dan mendapatkan pengembalian sebesar <span className="font-extrabold text-yellow-400 text-sm">{getRefundAmount(selectedCard.rarity)} Poin</span>.
                        </>
                      ) : (
                        <>
                          You are about to dismantle the card <span className="font-extrabold text-white">"{selectedCard.name}"</span> ({selectedCard.rarity}) and receive a refund of <span className="font-extrabold text-yellow-400 text-sm">{getRefundAmount(selectedCard.rarity)} Points</span>.
                        </>
                      )}
                    </p>
                  </div>

                  {destroyError && (
                    <div className="bg-red-900/30 text-red-200 p-2.5 rounded-lg border border-red-700/30 text-xs">
                      {destroyError}
                    </div>
                  )}

                  <div className="flex gap-2 border-t border-slate-800/80 pt-4">
                    <button
                      disabled={isDestroying}
                      onClick={handleConfirmDestroy}
                      className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-lg shadow-red-600/10"
                    >
                      {isDestroying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {language === "id" ? "MEMPROSES..." : "PROCESSING..."}
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          {language === "id" ? "YA, HANCURKAN KARTU" : "YES, DISMANTLE CARD"}
                        </>
                      )}
                    </button>
                    <button
                      disabled={isDestroying}
                      onClick={() => setIsConfirmingDestroy(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 rounded-xl transition-all border border-slate-700 cursor-pointer text-xs"
                    >
                      {language === "id" ? "Batal" : "Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Default Detail Screen with Rich Stats Layout */
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  {/* Left Column: Big Card Visual */}
                  <div className="shrink-0 flex justify-center py-1">
                    <NekomonCard card={selectedCard} size="md" />
                  </div>

                  {/* Right Column: In-Depth Technical Stats Panel */}
                  <div className="flex-1 w-full flex flex-col gap-4 self-stretch justify-between">
                    <div className="flex flex-col gap-3.5">
                      {/* Title Header with Element & Rarity Badge */}
                      <div className="border-b border-slate-800/60 pb-3">
                        <div className="flex items-center gap-2 justify-between flex-wrap">
                          <h4 className="text-xl font-black text-white font-mono tracking-tight uppercase">
                            {selectedCard.name}
                          </h4>
                          <span className={`px-2.5 py-0.5 text-[10px] rounded-full border uppercase tracking-widest font-black font-mono shadow-md ${
                            selectedCard.rarity.toLowerCase() === "common" ? "bg-slate-800 text-slate-300 border-slate-600" :
                            selectedCard.rarity.toLowerCase() === "rare" ? "bg-blue-950 text-blue-300 border-blue-500" :
                            selectedCard.rarity.toLowerCase() === "epic" ? "bg-rose-950 text-rose-300 border-rose-500" :
                            selectedCard.rarity.toLowerCase() === "legend" || selectedCard.rarity.toLowerCase() === "legendary" ? "bg-amber-950 text-amber-300 border-amber-500" :
                            "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400"
                          }`}>
                            {selectedCard.rarity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1 lowercase">
                          {language === "id" 
                            ? `Spesies Domestik • Tempaan Faksi ` 
                            : `Domestic Species • Forged by Faction `}
                          <span className="text-teal-400 font-bold">{selectedCard.style === "Sentinel" ? "Sentinel" : "Vanguard"}</span>
                        </p>
                      </div>

                      {/* Power Level Widget */}
                      <div className="bg-slate-950/60 border border-slate-800/60 p-3 rounded-xl flex flex-col gap-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold text-slate-400 font-mono tracking-wider uppercase">COMBAT POWER / POWER LEVEL</span>
                          <span className="text-sm font-black text-yellow-400 font-mono flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                            {selectedCard.atk * 3 + selectedCard.def * 2 + (selectedCard.spd || Math.floor((selectedCard.hp + selectedCard.atk) / 4.5)) * 4 + selectedCard.hp} CP
                          </span>
                        </div>
                        {/* CP Meter */}
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${Math.min(100, (((selectedCard.atk * 3 + selectedCard.def * 2 + (selectedCard.spd || Math.floor((selectedCard.hp + selectedCard.atk) / 4.5)) * 4 + selectedCard.hp) - 100) / 1000) * 100)}%` 
                            }}
                            className="h-full bg-gradient-to-r from-yellow-500 via-amber-500 to-rose-500 rounded-full"
                          />
                        </div>

                        {/* Attribute Matrix Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs font-mono">
                          <div className="bg-slate-900/50 border border-slate-800/40 p-2 rounded-lg flex items-center justify-between">
                            <span className="text-red-400 font-bold flex items-center gap-1">
                              <Swords className="w-3.5 h-3.5" /> {language === "id" ? "SERANGAN" : "ATTACK"}
                            </span>
                            <span className="text-white font-extrabold">{selectedCard.atk}</span>
                          </div>
                          <div className="bg-slate-900/50 border border-slate-800/40 p-2 rounded-lg flex items-center justify-between">
                            <span className="text-blue-400 font-bold flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5" /> {language === "id" ? "PERTAHANAN" : "DEFENSE"}
                            </span>
                            <span className="text-white font-extrabold">{selectedCard.def}</span>
                          </div>
                          <div className="bg-slate-900/50 border border-slate-800/40 p-2 rounded-lg flex items-center justify-between">
                            <span className="text-pink-400 font-bold flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5" /> {language === "id" ? "KECEPATAN" : "SPEED"}
                            </span>
                            <span className="text-white font-extrabold">{selectedCard.spd || Math.floor((selectedCard.hp + selectedCard.atk) / 4.5)}</span>
                          </div>
                          <div className="bg-slate-900/50 border border-slate-800/40 p-2 rounded-lg flex items-center justify-between">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5" /> {language === "id" ? "HIT POINTS" : "HIT POINTS"}
                            </span>
                            <span className="text-white font-extrabold">{selectedCard.hp}</span>
                          </div>
                        </div>
                      </div>

                      {/* Level & Experience Progress Bar */}
                      <div className="bg-slate-950/60 border border-slate-800/60 p-3 rounded-xl flex flex-col gap-2 font-mono">
                        <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          <span>{language === "id" ? "Level Nekomon" : "Nekomon Level"}</span>
                          <span className="text-teal-400 font-extrabold text-sm">LV. {selectedCard.level || 1}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                          <span>EXP GAUGE</span>
                          <span>{selectedCard.xp || 0} / {selectedCard.level ? selectedCard.level * 100 : 100} XP</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
                          <div 
                            className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, ((selectedCard.xp || 0) / (selectedCard.level ? selectedCard.level * 100 : 100)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Technical Specs Summary */}
                      <div className="grid grid-cols-3 gap-2 font-mono text-[9px]">
                        <div className="bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-xl flex flex-col gap-0.5">
                          <span className="text-slate-500 block font-bold">ELEMENT TYPE</span>
                          <span className={`font-extrabold text-[11px] uppercase tracking-wider ${
                            selectedCard.element === "Api" ? "text-red-400" :
                            selectedCard.element === "Air" ? "text-blue-400" :
                            selectedCard.element === "Tanah" ? "text-emerald-400" :
                            selectedCard.element === "Angin" ? "text-teal-400" :
                            "text-yellow-400"
                          }`}>
                            {selectedCard.element === "Api" ? "Fire 🔥" :
                             selectedCard.element === "Air" ? "Water 💧" :
                             selectedCard.element === "Tanah" ? "Earth 🌿" :
                             selectedCard.element === "Angin" ? "Wind 💨" :
                             "Thunder ⚡"}
                          </span>
                        </div>
                        <div className="bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-xl flex flex-col gap-0.5">
                          <span className="text-slate-500 block font-bold">RARITY TIER</span>
                          <span className={`font-extrabold text-[11px] uppercase tracking-wider ${
                            selectedCard.rarity.toLowerCase() === "common" ? "text-slate-400" :
                            selectedCard.rarity.toLowerCase() === "rare" ? "text-blue-400" :
                            selectedCard.rarity.toLowerCase() === "epic" ? "text-rose-400" :
                            selectedCard.rarity.toLowerCase() === "legend" || selectedCard.rarity.toLowerCase() === "legendary" ? "text-amber-400" :
                            "text-pink-400 font-bold"
                          }`}>
                            {selectedCard.rarity}
                          </span>
                        </div>
                        <div className="bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-xl flex flex-col gap-0.5">
                          <span className="text-slate-500 block font-bold">{language === "id" ? "FAKSI" : "FACTION"}</span>
                          <span className="font-extrabold text-teal-400 text-[11px] uppercase tracking-wider">
                            {selectedCard.style === "Sentinel" ? "Sentinel" : "Vanguard"}
                          </span>
                        </div>
                      </div>

                      {/* Active Signature Skill Box */}
                      <div className="bg-slate-950/30 border border-slate-800/50 p-3 rounded-xl flex flex-col gap-1 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-yellow-400 font-extrabold uppercase tracking-wide">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span>{language === "id" ? `SIGNATURE SKILL: ${selectedCard.skillName}` : `SIGNATURE SKILL: ${selectedCard.skillName}`}</span>
                        </div>
                        <p className="text-slate-300 text-[10px] leading-relaxed">
                          {selectedCard.skillDesc}
                        </p>
                      </div>

                      {/* Evolution History Sequence Timeline */}
                      <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl flex flex-col gap-3 font-mono">
                        <span className="text-[10px] text-pink-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-pink-500" />
                          {language === "id" ? "SEKUEN SEJARAH EVOLUSI KARTU" : "CARD EVOLUTION HISTORY TIMELINE"}
                        </span>

                        {(!selectedCard.evolutionHistory || selectedCard.evolutionHistory.length === 0) ? (
                          <div className="text-[10px] text-slate-500 italic py-2">
                            {language === "id" 
                              ? `Belum ada riwayat evolusi. Kartu ini masih berada dalam wujud aslinya (${selectedCard.rarity}).`
                              : `No evolution history. This card is still in its original form (${selectedCard.rarity}).`}
                          </div>
                        ) : (
                          <div className="relative pl-4 border-l border-slate-800/80 flex flex-col gap-4 mt-1">
                            {selectedCard.evolutionHistory.map((hist, hIdx) => (
                              <div key={hIdx} className="relative group/step">
                                {/* Bullet indicator */}
                                <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700 group-hover/step:bg-yellow-500 group-hover/step:border-yellow-400 transition-colors" />
                                
                                <div className="flex items-start gap-2.5 text-xs">
                                  {/* Thumbnail */}
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800 shrink-0 bg-slate-950">
                                    <img src={hist.imageUrl} alt={hist.name} className="w-full h-full object-cover" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 justify-between">
                                      <span className="font-extrabold text-slate-200 text-[11px] truncate">{hist.name}</span>
                                      <span className={`text-[8px] px-1 rounded border shrink-0 ${
                                        hist.rarity.toLowerCase() === "common" ? "bg-slate-800 text-slate-400 border-slate-700" :
                                        hist.rarity.toLowerCase() === "rare" ? "bg-blue-950/50 text-blue-400 border-blue-900/50" :
                                        hist.rarity.toLowerCase() === "epic" ? "bg-rose-950/50 text-rose-400 border-rose-900/50" :
                                        "bg-amber-950/50 text-amber-400 border-amber-900/50"
                                      }`}>
                                        {hist.rarity}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 grid grid-cols-4 gap-1 mt-1 leading-none">
                                      <span className="truncate">⚔️ ATK {hist.atk}</span>
                                      <span className="truncate">🛡️ DEF {hist.def}</span>
                                      <span className="truncate">⚡ SPD {hist.spd}</span>
                                      <span className="truncate">❤️ HP {hist.hp}</span>
                                    </div>
                                    <span className="text-[8px] text-slate-500 block mt-0.5 font-mono">
                                      {language === "id" ? `Evolved: ${new Date(hist.evolvedAt).toLocaleDateString("id-ID")}` : `Evolved: ${new Date(hist.evolvedAt).toLocaleDateString("en-US")}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Current Form indicator */}
                            <div className="relative group/step">
                              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-yellow-500 border border-yellow-400 animate-pulse" />
                              <div className="flex items-start gap-2.5 text-xs">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-yellow-500/30 shrink-0 bg-slate-950">
                                  <img src={selectedCard.imageUrl} alt={selectedCard.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 justify-between">
                                    <span className="font-black text-yellow-400 text-[11px] truncate">{selectedCard.name} {language === "id" ? "(Sekarang)" : "(Current)"}</span>
                                    <span className={`text-[8px] px-1 rounded border shrink-0 bg-yellow-500 text-slate-950 border-yellow-400 font-extrabold`}>
                                      {selectedCard.rarity}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-400 grid grid-cols-4 gap-1 mt-1 leading-none">
                                    <span className="truncate">⚔️ ATK {selectedCard.atk}</span>
                                    <span className="truncate">🛡️ DEF {selectedCard.def}</span>
                                    <span className="truncate">⚡ SPD {selectedCard.spd || 45}</span>
                                    <span className="truncate">❤️ HP {selectedCard.hp}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions bar */}
                    <div className="flex flex-col gap-2 border-t border-slate-800/60 pt-4 mt-3">
                      {selectedCard.rarity.toLowerCase() !== "mythic" && (
                        <button
                          onClick={() => setIsConfirmingEvolve(true)}
                          className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer uppercase font-mono tracking-wider"
                        >
                          <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
                          {language === "id" ? "EVOLUSI KE TINGKAT SELANJUTNYA 🌟" : "EVOLVE TO THE NEXT TIER 🌟"}
                        </button>
                      )}

                      {selectedCard.evolutionHistory && selectedCard.evolutionHistory.length > 0 && (
                        <button
                          onClick={() => setIsConfirmingCancelEvolve(true)}
                          className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer uppercase font-mono tracking-wider"
                        >
                          <RotateCcw className="w-4 h-4 text-slate-900" />
                          {language === "id" ? "BATALKAN EVOLUSI (REVERT TAHAP SEBELUMNYA) 🔄" : "REVERT EVOLUTION (RETURN TO PREVIOUS) 🔄"}
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadCardImage(selectedCard)}
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          {language === "id" ? "UNDUH KARTU (PNG)" : "DOWNLOAD CARD (PNG)"}
                        </button>
                        <button
                          onClick={() => setIsConfirmingDestroy(true)}
                          className="bg-red-950 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-900/50 p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          title={language === "id" ? "Hancurkan Kartu untuk refund poin" : "Dismantle Card for point refund"}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs font-bold px-1">{language === "id" ? "HANCURKAN" : "DESTROY"}</span>
                        </button>
                      </div>

                      <button
                        onClick={handleCloseModal}
                        className="w-full mt-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl text-xs transition-all border border-slate-700 cursor-pointer"
                      >
                        {language === "id" ? "Tutup" : "Close"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Custom Modal for deleting captures */}
            {selectedCaptureForDelete && (
              <motion.div
                key="delete-capture-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-slate-900 border border-red-500/30 rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4"
                >
                  <div className="flex items-center gap-2.5 text-rose-400">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono">
                      {language === "id" ? "Hapus Foto Kucing?" : "Delete Cat Photo?"}
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {language === "id" 
                      ? "Apakah Anda yakin ingin menghapus foto kucing ini dari galeri? Tindakan ini tidak dapat dibatalkan." 
                      : "Are you sure you want to delete this cat photo from your gallery? This action cannot be undone."}
                  </p>

                  {/* Photo preview */}
                  <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img
                      src={selectedCaptureForDelete.photoUrl}
                      alt="Delete Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {deleteCaptureError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex items-start gap-2 text-red-400 font-mono text-[9px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{deleteCaptureError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 font-mono mt-1">
                    <button
                      disabled={isDeletingCapture}
                      onClick={async () => {
                        setIsDeletingCapture(true);
                        setDeleteCaptureError(null);
                        const res = await onDeleteCapture(selectedCaptureForDelete.id);
                        setIsDeletingCapture(false);
                        if (res.success) {
                          setSelectedCaptureForDelete(null);
                        } else {
                          setDeleteCaptureError(res.error || (language === "id" ? "Gagal menghapus foto." : "Failed to delete photo."));
                        }
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
                    >
                      {isDeletingCapture ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {language === "id" ? "MENGHAPUS..." : "DELETING..."}
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          {language === "id" ? "YA, HAPUS" : "YES, DELETE"}
                        </>
                      )}
                    </button>
                    <button
                      disabled={isDeletingCapture}
                      onClick={() => {
                        setSelectedCaptureForDelete(null);
                        setDeleteCaptureError(null);
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all border border-slate-700 active:scale-98"
                    >
                      {language === "id" ? "BATAL" : "CANCEL"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
