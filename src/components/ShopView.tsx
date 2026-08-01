import React, { useState, useEffect } from "react";
import { Card, User } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { 
  Sparkles, 
  Coins, 
  ShoppingBag, 
  Flame, 
  Droplet, 
  Trees, 
  Wind, 
  Zap, 
  ArrowRight, 
  CreditCard, 
  History, 
  HelpCircle, 
  CheckCircle2, 
  QrCode, 
  Wallet, 
  ShieldCheck, 
  TrendingUp, 
  Compass,
  Layers,
  ChevronRight,
  Sparkle,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NekomonCard } from "./NekomonCard";
import { audio } from "../lib/audio";

interface ShopViewProps {
  user: User | null;
  cards?: Card[];
  onPurchaseSuccess: (updatedPoints: number, updatedCores: number, addedCards?: Card[]) => void;
  onRefreshCards?: () => void;
  onRequestRewardedAd?: (rewardType: "points_50" | "cores_5" | "standard") => void;
}

interface Transaction {
  id: string;
  type: "points" | "booster" | "energy_potion";
  packageId: string;
  packageName: string;
  price: number;
  priceCurrency?: string;
  pointsAdded?: number;
  pointsDeducted?: number;
  cardsCount?: number;
  createdAt: string;
}

export function ShopView({ user, cards = [], onPurchaseSuccess, onRefreshCards, onRequestRewardedAd }: ShopViewProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"points" | "gacha" | "energy" | "ads" | "history">("points");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  
  // Customization for Booster Packs
  const [targetElement, setTargetElement] = useState<string>("Random");
  const [targetStyle, setTargetStyle] = useState<string>("Random");

  // Energy Refill Potion State
  const [selectedEnergyCardId, setSelectedEnergyCardId] = useState<string>("");
  const [isBuyingPotion, setIsBuyingPotion] = useState<boolean>(false);
  const [potionSuccessMsg, setPotionSuccessMsg] = useState<string | null>(null);
  const [potionErrorMsg, setPotionErrorMsg] = useState<string | null>(null);

  // Auto-select first card if available
  useEffect(() => {
    if (cards.length > 0 && !selectedEnergyCardId) {
      setSelectedEnergyCardId(cards[0].id);
    }
  }, [cards, selectedEnergyCardId]);

  const handleBuyEnergyPotion = async (potionType: "single" | "team") => {
    setPotionSuccessMsg(null);
    setPotionErrorMsg(null);
    setIsBuyingPotion(true);

    if (potionType === "single" && !selectedEnergyCardId) {
      setPotionErrorMsg(language === "id" ? "Pilih kartu Nekomon terlebih dahulu." : "Please select a Nekomon card first.");
      setIsBuyingPotion(false);
      return;
    }

    const token = localStorage.getItem("nekomon_token");
    try {
      const res = await fetch("/api/shop/buy-energy-potion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          potionType,
          cardId: potionType === "single" ? selectedEnergyCardId : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membeli Ramuan Energi");
      }

      try {
        audio.playUnboxingExplosion("Petir");
      } catch (_) {}

      setPotionSuccessMsg(data.message || (language === "id" ? "Energi kartu berhasil diisi penuh ke 5/5!" : "Card energy successfully refilled to 5/5!"));
      onPurchaseSuccess(data.user.points, data.user.cores);
      if (onRefreshCards) onRefreshCards();
    } catch (err: any) {
      setPotionErrorMsg(err.message || "Gagal memproses pembelian Ramuan Energi.");
    } finally {
      setIsBuyingPotion(false);
    }
  };
  
  // Checkout Modal State
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [checkoutType, setCheckoutType] = useState<"points" | "booster" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "gopay" | "va">("qris");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "success" | "error">("pending");
  
  // Post-purchase Reveal State
  const [earnedCards, setEarnedCards] = useState<Card[]>([]);
  const [revealedCardIndices, setRevealedCardIndices] = useState<number[]>([]);
  const [coresEarned, setCoresEarned] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch transaction history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    const token = localStorage.getItem("nekomon_token");
    try {
      const res = await fetch("/api/shop/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const triggerCheckout = (type: "points" | "booster", id: string) => {
    setErrorMsg(null);
    setPaymentStatus("pending");
    setCheckoutType(type);
    if (type === "points") {
      setSelectedPackageId(id);
      setSelectedPackId(null);
    } else {
      setSelectedPackId(id);
      setSelectedPackageId(null);
    }
    setIsCheckingOut(true);
    try {
      audio.playCaptureSound();
    } catch (_) {}
  };

  const simulatePaymentSuccess = async () => {
    setPaymentStatus("processing");
    const token = localStorage.getItem("nekomon_token");
    
    try {
      if (checkoutType === "points" && selectedPackageId) {
        const res = await fetch("/api/shop/buy-points", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ packageId: selectedPackageId })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membeli poin");
        
        setTimeout(() => {
          setPaymentStatus("success");
          try {
            audio.playUnboxingExplosion("Petir");
          } catch (_) {}
          onPurchaseSuccess(data.user.points, data.user.cores);
        }, 1500);

      } else if (checkoutType === "booster" && selectedPackId) {
        const res = await fetch("/api/shop/buy-booster", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            packId: selectedPackId,
            element: targetElement === "Random" ? undefined : targetElement,
            style: targetStyle === "Random" ? undefined : targetStyle
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membeli booster pack");
        
        setTimeout(() => {
          setPaymentStatus("success");
          setEarnedCards(data.cards || []);
          setCoresEarned(data.coresEarned || 0);
          setRevealedCardIndices([]);
          try {
            audio.playRevealSound("Scourge");
          } catch (_) {}
          onPurchaseSuccess(data.user.points, data.user.cores, data.cards);
        }, 1500);
      }
    } catch (err: any) {
      setPaymentStatus("error");
      setErrorMsg(err.message || "Gagal memproses transaksi");
    }
  };

  const toggleRevealCard = (index: number) => {
    if (revealedCardIndices.includes(index)) return;
    setRevealedCardIndices(prev => [...prev, index]);
    try {
      audio.playRevealSound("Sentinel");
    } catch (_) {}
  };

  const closeCheckoutModal = () => {
    setIsCheckingOut(false);
    setCheckoutType(null);
    setSelectedPackageId(null);
    setSelectedPackId(null);
    setEarnedCards([]);
    setRevealedCardIndices([]);
    setCoresEarned(0);
    setPaymentStatus("pending");
  };

  // Pricing & metadata
  const getSelectedMetadata = () => {
    if (checkoutType === "points") {
      if (selectedPackageId === "points_100") return { name: "100 Nekomon Points", price: 15000, desc: "Cocok untuk forging kilat" };
      if (selectedPackageId === "points_500") return { name: "500 Nekomon Points", price: 50000, desc: "Bonus 50 poin ekstra!" };
      if (selectedPackageId === "points_1200") return { name: "1200 Nekomon Points", price: 100000, desc: "Hemat maksimal (Bonus 200 poin!)" };
    } else if (checkoutType === "booster") {
      if (selectedPackId === "booster_epic") return { name: "Booster Pack Epic", price: 25000, desc: "Peluang Epic/Legendary/Mythic" };
      if (selectedPackId === "booster_legend") return { name: "Booster Pack Legend", price: 50000, desc: "Peluang tinggi Legendary/Mythic" };
      if (selectedPackId === "booster_ultimate") return { name: "Celestial Booster Pack", price: 100000, desc: "Dapatkan 3 kartu mistis premium!" };
    }
    return { name: "Unknown Item", price: 0, desc: "" };
  };

  const meta = getSelectedMetadata();

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-6 text-slate-200 font-sans" id="shop_view_root">
      
      {/* Upper Promo Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/60 via-indigo-950/80 to-slate-900 border border-purple-500/30 rounded-3xl p-6 mb-6 shadow-[0_0_30px_rgba(147,51,234,0.15)]">
        <div className="absolute top-0 right-0 p-4 text-purple-400/20 pointer-events-none">
          <ShoppingBag className="w-48 h-48 -rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 bg-purple-500/25 text-purple-300 border border-purple-500/40 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Special Event Promotion
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight leading-none uppercase">
            {t("shop.title")}
          </h2>
          <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
            {t("shop.desc")}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mt-5">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-slate-400">{language === "id" ? "Saldo Poin" : "Points Balance"}:</span>
              <span className="text-yellow-400 font-bold">{user?.points || 0}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">{language === "id" ? "Saldo Core" : "Cores Balance"}:</span>
              <span className="text-cyan-400 font-bold">{user?.cores || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-6">
        <button
          onClick={() => setActiveTab("points")}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-2 ${activeTab === "points" ? "bg-yellow-500 text-slate-950" : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:bg-slate-800"}`}
        >
          <Coins className="w-4 h-4" />
          {language === "id" ? "BELI POIN 💎" : "BUY POINTS 💎"}
        </button>
        <button
          onClick={() => setActiveTab("gacha")}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-2 ${activeTab === "gacha" ? "bg-purple-600 text-white" : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:bg-slate-800"}`}
        >
          <ShoppingBag className="w-4 h-4" />
          {language === "id" ? "GACHA BOOSTER 📦" : "GACHA BOOSTER 📦"}
        </button>
        <button
          onClick={() => setActiveTab("energy")}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-2 ${activeTab === "energy" ? "bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:bg-slate-800"}`}
        >
          <Zap className="w-4 h-4 fill-current" />
          {language === "id" ? "RAMUAN ENERGI ⚡" : "ENERGY POTION ⚡"}
        </button>
        <button
          onClick={() => setActiveTab("ads")}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-2 ${activeTab === "ads" ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]" : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:bg-slate-800"}`}
        >
          <Award className="w-4 h-4 text-pink-400" />
          {language === "id" ? "IKLAN BERHADIAH 🎁" : "REWARDED ADS 🎁"}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-2 ${activeTab === "history" ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-slate-900 text-slate-400 border border-slate-800/80 hover:bg-slate-800"}`}
        >
          <History className="w-4 h-4" />
          {language === "id" ? "RIWAYAT TRANSAKSI" : "TRANSACTION HISTORY"}
        </button>
      </div>

      {/* Point Store (Microtransactions) */}
      {activeTab === "points" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Package 1: 100 Points */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:border-yellow-500/40 transition-all group">
            <div className="absolute -top-3 -right-2 bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg">
              STARTER PACK
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 group-hover:scale-110 transition-transform">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 font-mono">100 Nekomon Points</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {language === "id" 
                  ? "Cukup untuk melakukan 2x Forging standar di stasiun kreasimu." 
                  : "Enough to perform 2x standard Forging operations."}
              </p>
            </div>
            <div className="border-t border-slate-800 pt-4 flex justify-between items-center mt-2">
              <span className="text-xl font-black text-yellow-400 font-mono">Rp 15.000</span>
              <button
                onClick={() => triggerCheckout("points", "points_100")}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all shadow-md active:scale-95"
              >
                {language === "id" ? "BELI" : "BUY"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Package 2: 500 Points (Best Value) */}
          <div className="bg-slate-900/80 border-2 border-purple-500/50 rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:border-purple-400 transition-all group shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[9px] font-mono font-black px-3 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              BEST VALUE 🔥
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 font-mono">500 Nekomon Points</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {language === "id" 
                  ? "Bonus +50 Poin gratis! Sempurna untuk melakukan 10x Forging beruntun." 
                  : "Includes +50 free Points! Perfect for conducting 10 sequential Forgings."}
              </p>
            </div>
            <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center mt-2">
              <div>
                <span className="text-xl font-black text-purple-400 font-mono">Rp 50.000</span>
                <span className="block text-[9px] font-mono text-slate-500 line-through">Rp 75.000</span>
              </div>
              <button
                onClick={() => triggerCheckout("points", "points_500")}
                className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all shadow-md active:scale-95"
              >
                {language === "id" ? "BELI" : "BUY"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Package 3: 1200 Points */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:border-yellow-500/40 transition-all group">
            <div className="absolute -top-3 -right-2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg">
              MEGA BUNDLE
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 group-hover:scale-110 transition-transform">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 font-mono">1200 Nekomon Points</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {language === "id" 
                  ? "Bonus +200 Poin gratis! Persediaan tak terbatas untuk mendevelop koleksi Nekomon tier dewa." 
                  : "Includes +200 free Points! Maximize your ultimate Nekomon forge power."}
              </p>
            </div>
            <div className="border-t border-slate-800 pt-4 flex justify-between items-center mt-2">
              <div>
                <span className="text-xl font-black text-yellow-400 font-mono">Rp 100.000</span>
                <span className="block text-[9px] font-mono text-slate-500 line-through">Rp 180.000</span>
              </div>
              <button
                onClick={() => triggerCheckout("points", "points_1200")}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all shadow-md active:scale-95"
              >
                {language === "id" ? "BELI" : "BUY"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Gacha Booster Packs */}
      {activeTab === "gacha" && (
        <div className="flex flex-col gap-6">
          
          {/* Booster Configuration Panel */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">Gacha Targeting Catalyst</h4>
                <p className="text-[10px] text-slate-400">Pilih aliran seni dan energi elemen untuk diprogram ke booster pack Anda!</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* Element Dropdown */}
              <div className="flex flex-col gap-1 flex-1 md:flex-initial">
                <span className="text-[9px] font-mono text-slate-500 uppercase">Target Element:</span>
                <select
                  value={targetElement}
                  onChange={(e) => setTargetElement(e.target.value)}
                  className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="Random">🎲 Random (All Elements)</option>
                  <option value="Api">🔥 Api (Fire)</option>
                  <option value="Air">💧 Air (Water)</option>
                  <option value="Tanah">🌿 Tanah (Earth)</option>
                  <option value="Angin">🌪️ Angin (Wind)</option>
                  <option value="Petir">⚡ Petir (Thunder)</option>
                </select>
              </div>

              {/* Style Dropdown */}
              <div className="flex flex-col gap-1 flex-1 md:flex-initial">
                <span className="text-[9px] font-mono text-slate-500 uppercase">Target Art Style:</span>
                <select
                  value={targetStyle}
                  onChange={(e) => setTargetStyle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="Random">🎲 Random Styles</option>
                  <option value="Sentinel">🌸 Sentinel Style</option>
                  <option value="Scourge">💀 Scourge Style</option>
                </select>
              </div>
            </div>
          </div>

          {/* Gacha Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Booster Epic */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-900/40 rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:border-purple-500/30 transition-all group">
              <div className="absolute top-2 right-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-mono px-2 py-0.5 rounded">
                RATE UP: EPIC
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-600/10 border border-rose-600/20 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                  <Sparkle className="w-6 h-6 animate-spin-slow" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 font-mono">Epic Booster Pack</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {language === "id" 
                    ? "Berisi 1 kartu acak yang dijamin bertingkat kelangkaan minimal EPIC (Epic / Legend / Mythic). Tidak butuh foto kucing asli!" 
                    : "Contains 1 guaranteed card of EPIC rarity or higher (Epic / Legend / Mythic). No cat photo required!"}
                </p>
              </div>
              <div className="border-t border-slate-800 pt-4 flex justify-between items-center mt-2">
                <span className="text-lg font-black text-purple-400 font-mono">Rp 25.000</span>
                <button
                  onClick={() => triggerCheckout("booster", "booster_epic")}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all active:scale-95"
                >
                  {language === "id" ? "BELI & BUKA" : "BUY & OPEN"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Booster Legend */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-900/40 rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:border-amber-500/30 transition-all group">
              <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono px-2 py-0.5 rounded">
                RATE UP: LEGEND
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 font-mono">Legendary Booster Pack</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {language === "id" 
                    ? "Berisi 1 kartu jaminan bertingkat kelangkaan LEGEND atau MYTHIC! Kecepatan dan stat tempur tertinggi untuk merajai PVP Arena." 
                    : "Contains 1 card with guaranteed LEGEND or MYTHIC rarity! Maximize your speed and power stats to rule the PVP arena."}
                </p>
              </div>
              <div className="border-t border-slate-800 pt-4 flex justify-between items-center mt-2">
                <span className="text-lg font-black text-amber-400 font-mono">Rp 50.000</span>
                <button
                  onClick={() => triggerCheckout("booster", "booster_legend")}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all active:scale-95"
                >
                  {language === "id" ? "BELI & BUKA" : "BUY & OPEN"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Celestial Pack (3 Cards) */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-pink-500/40 rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:border-pink-400 transition-all group shadow-[0_0_20px_rgba(244,63,94,0.1)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-600 text-white text-[9px] font-mono font-black px-3 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                ULTIMATE PACKAGE 🌌
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 font-mono">Celestial Booster Pack</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {language === "id" 
                    ? "Isi 3 KARTU PREMIUM sekaligus! Memberikan bonus Nekomon Core ekstra luar biasa besar dari akumulasi kartu mistis barumu." 
                    : "Contains 3 PREMIUM CARDS! Grants extremely high Nekomon Core rewards from your stellar epic/mythic collection."}
                </p>
              </div>
              <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center mt-2">
                <span className="text-lg font-black text-pink-400 font-mono">Rp 100.000</span>
                <button
                  onClick={() => triggerCheckout("booster", "booster_ultimate")}
                  className="bg-pink-600 hover:bg-pink-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all active:scale-95"
                >
                  {language === "id" ? "BELI & BUKA" : "BUY & OPEN"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Energy Refill Potion Tab */}
      {activeTab === "energy" && (
        <div className="flex flex-col gap-6" id="energy_potion_tab">
          
          {/* Promo Banner / Info Header */}
          <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 border border-amber-500/40 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-7 h-7 fill-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black font-mono tracking-wider uppercase text-slate-100 flex items-center gap-2">
                  STASIUN PEMULIH ENERGI (ENERGY REFILL POTION)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {language === "id"
                    ? "Gunakan Nekomon Poin milikmu untuk mengisi ulang energi kartu secara instan (5/5) tanpa harus menunggu refill otomatis 2 jam!"
                    : "Use your Nekomon Points to instantly refill card energy back to 5/5 without waiting for the 2-hour auto-refill!"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 border border-amber-500/30 px-3.5 py-2 rounded-xl font-mono text-xs text-amber-400 font-bold shrink-0">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>{user?.points || 0} POIN</span>
            </div>
          </div>

          {/* Messages */}
          {potionSuccessMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs p-3.5 rounded-xl font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{potionSuccessMsg}</span>
            </div>
          )}
          {potionErrorMsg && (
            <div className="bg-red-950/80 border border-red-500/50 text-red-300 text-xs p-3.5 rounded-xl font-mono flex items-center gap-2">
              <span>⚠️ {potionErrorMsg}</span>
            </div>
          )}

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Item 1: Ramuan Energi Kartu (Single Refill) */}
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:border-amber-400 transition-all group">
              <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                SINGLE CARD REFILL
              </div>

              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 fill-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
                  <span>Ramuan Energi Kartu</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {language === "id"
                    ? "Memulihkan energi 1 Kartu Nekomon terpilih hingga penuh (5/5) secara instan!"
                    : "Instantly restores 1 selected Nekomon Card energy back to full (5/5)!"}
                </p>

                {/* Card Selector Dropdown */}
                {cards && cards.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-2.5 bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                    <label className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                      {language === "id" ? "Pilih Kartu Yang Ingin Diisi Ulang:" : "Select Card to Refill:"}
                    </label>
                    <select
                      value={selectedEnergyCardId}
                      onChange={(e) => setSelectedEnergyCardId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (LV. {c.level || 1} • ⚡{c.energy ?? 5}/{c.maxEnergy || 5})
                        </option>
                      ))}
                    </select>

                    {/* Selected Card Preview Strip */}
                    {cards.find(c => c.id === selectedEnergyCardId) && (() => {
                      const selectedCard = cards.find(c => c.id === selectedEnergyCardId)!;
                      return (
                        <div className="flex items-center gap-3 pt-1 border-t border-slate-800/80 mt-1">
                          <img
                            src={selectedCard.imageUrl}
                            alt={selectedCard.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                          />
                          <div className="flex-1 font-mono text-[10px] min-w-0">
                            <div className="font-bold text-slate-200 truncate uppercase">{selectedCard.name}</div>
                            <div className="text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="text-amber-400 font-bold flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5 fill-amber-400" />
                                Energi: {selectedCard.energy ?? 5}/5
                              </span>
                              <span>• LV. {selectedCard.level || 1}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500 font-mono">
                    {language === "id" ? "Belum ada kartu Nekomon di koleksi Anda." : "No Nekomon cards found in collection."}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-4 flex justify-between items-center mt-2">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-xl font-black text-yellow-400 font-mono">30 POIN</span>
                </div>
                <button
                  onClick={() => handleBuyEnergyPotion("single")}
                  disabled={isBuyingPotion || !selectedEnergyCardId || (user?.points || 0) < 30}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-500 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed uppercase"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  {isBuyingPotion ? (language === "id" ? "PROSES..." : "BUYING...") : (language === "id" ? "BELI & ISI ULANG" : "BUY & REFILL")}
                </button>
              </div>

            </div>

            {/* Item 2: Mega Ramuan Energi Tim (Team Refill) */}
            <div className="bg-slate-900/80 border-2 border-yellow-500/50 rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:border-yellow-400 transition-all group shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-950 text-[9px] font-mono font-black px-3 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                BEST VALUE MEGA REFILL ⚡
              </div>

              <div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
                  <span>Mega Ramuan Energi Tim</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {language === "id"
                    ? "Isi ulang energi SEMUA Kartu Nekomon di koleksimu hingga penuh (5/5) secara bersamaan!"
                    : "Instantly refills energy for ALL Nekomon Cards in your collection back to full (5/5)!"}
                </p>

                <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">{language === "id" ? "Total Koleksi Kartu:" : "Total Cards:"}</span>
                    <span className="font-bold text-yellow-400">{cards?.length || 0} Kartu</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">{language === "id" ? "Kartu Butuh Isi Ulang:" : "Cards Needing Refill:"}</span>
                    <span className="font-bold text-amber-400">
                      {cards?.filter(c => (c.energy ?? 5) < 5).length || 0} Kartu
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center mt-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span className="text-xl font-black text-yellow-400 font-mono">100 POIN</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 line-through">150 POIN</span>
                </div>

                <button
                  onClick={() => handleBuyEnergyPotion("team")}
                  disabled={isBuyingPotion || !cards || cards.length === 0 || (user?.points || 0) < 100}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-500 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed uppercase"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  {isBuyingPotion ? (language === "id" ? "PROSES..." : "BUYING...") : (language === "id" ? "ISI ULANG SEMUA" : "REFILL ALL")}
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Rewarded Video Ads View */}
      {activeTab === "ads" && (
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-r from-pink-950/80 via-slate-900 to-purple-950/80 border border-pink-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 opacity-10">
              <Award className="w-64 h-64 text-pink-400" />
            </div>
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                ADMOB & UNITY ADS REWARDED SDK
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">
                Tonton Video, Dapatkan Poin & Core Gratis!
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Dukung game Nekomon dengan menonton iklan sponsor singkat selama 5-6 detik. Setelah video selesai, kamu akan mendapatkan hadiah instan tanpa batas harian!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ad Option 1 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:border-pink-500/50 transition-all group shadow-md">
              <div className="absolute -top-3 right-3 bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                BEST BALANCED
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-100 font-mono">Paket Hadiah Kombinasi</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Tonton video 6s untuk mendapatkan bonus seimbang berupa <span className="text-amber-400 font-bold">+30 Poin</span> & <span className="text-cyan-400 font-bold">+2 Nekomon Cores</span>.
                </p>
              </div>
              <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 font-extrabold uppercase">GRATIS 100%</span>
                <button
                  onClick={() => onRequestRewardedAd && onRequestRewardedAd("standard")}
                  className="bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-110 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer uppercase"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Tonton Video</span>
                </button>
              </div>
            </div>

            {/* Ad Option 2 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:border-yellow-500/50 transition-all group shadow-md">
              <div className="absolute -top-3 right-3 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                POINTS BOOST
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-4 group-hover:scale-110 transition-transform">
                  <Coins className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-100 font-mono">Paket Poin Melimpah</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Fokus menambah tabungan poin untuk gacha booster pack. Dapatkan <span className="text-yellow-400 font-bold">+50 Poin Ekstra</span> langsung setelah video!
                </p>
              </div>
              <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 font-extrabold uppercase">GRATIS 100%</span>
                <button
                  onClick={() => onRequestRewardedAd && onRequestRewardedAd("points_50")}
                  className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer uppercase"
                >
                  <Coins className="w-4 h-4 fill-current" />
                  <span>Tonton Video</span>
                </button>
              </div>
            </div>

            {/* Ad Option 3 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:border-cyan-500/50 transition-all group shadow-md">
              <div className="absolute -top-3 right-3 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                CORES SPECIAL
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-100 font-mono">Paket Core Forging</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Membutuhkan Nekomon Core untuk upgrade level kartu? Dapatkan <span className="text-cyan-400 font-bold">+5 Nekomon Cores</span> per video iklan yang ditonton!
                </p>
              </div>
              <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 font-extrabold uppercase">GRATIS 100%</span>
                <button
                  onClick={() => onRequestRewardedAd && onRequestRewardedAd("cores_5")}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer uppercase"
                >
                  <Layers className="w-4 h-4 fill-current" />
                  <span>Tonton Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Tab */}
      {activeTab === "history" && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5" id="tx_history_section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-slate-300">
              {language === "id" ? "RIWAYAT TRANSAKSI ANDA" : "YOUR TRANSACTION LOGS"}
            </h3>
            <button 
              onClick={fetchHistory}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              Reload 🔄
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              {t("common.loading")}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              {language === "id" 
                ? "Belum ada transaksi pembelian. Silakan beli poin, booster pack, atau ramuan energi!" 
                : "No purchase records found. Get started by purchasing some Nekomon Points, Gacha Packs, or Energy Potions!"}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${tx.type === "points" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : tx.type === "energy_potion" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"}`}>
                      {tx.type === "points" ? <Coins className="w-4 h-4" /> : tx.type === "energy_potion" ? <Zap className="w-4 h-4 fill-amber-400 text-amber-400" /> : <ShoppingBag className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">{tx.packageName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ID: {tx.id} • {new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-800/50 pt-2.5 md:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">AMOUNT PAID</span>
                      <span className="font-bold text-emerald-400">
                        {tx.priceCurrency === "POINTS" ? `${tx.price} Points` : formattedPrice(tx.price)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">BONUS / EFFECT</span>
                      <span className="font-bold text-yellow-400">
                        {tx.type === "points" ? `+${tx.pointsAdded} Points` : tx.type === "energy_potion" ? "⚡ Refill Energi 5/5" : `+${tx.cardsCount} Cards`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checkout and Reveal Interactive Modal */}
      <AnimatePresence>
        {isCheckingOut && checkoutType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Closing cross */}
              {paymentStatus !== "processing" && paymentStatus !== "success" && (
                <button
                  onClick={closeCheckoutModal}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-full hover:bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              )}

              {/* Status Header */}
              <div className="border-b border-slate-800 pb-4 mb-4">
                <h3 className="text-sm font-black font-mono uppercase tracking-wider text-purple-400 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  {language === "id" ? "Portal Pembayaran Nekomon" : "Nekomon Payment Gateway"}
                </h3>
              </div>

              {errorMsg && (
                <div className="bg-red-950/80 border border-red-500/30 text-red-200 text-xs p-3 rounded-xl mb-4 font-mono">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* PENDING / SELECTING PAYMENT STATE */}
              {paymentStatus === "pending" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="checkout_gateway_pending">
                  
                  {/* Left Column: Summary */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">ITEM ORDERED</span>
                      <h4 className="text-lg font-black text-slate-100 font-mono mt-0.5">{meta.name}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{meta.desc}</p>
                      
                      {checkoutType === "booster" && (
                        <div className="mt-4 bg-slate-950 border border-slate-800/80 p-3 rounded-xl text-xs font-mono">
                          <div className="text-[10px] text-slate-500 uppercase font-black">CATALYST CONFIG</div>
                          <div className="flex justify-between mt-1 text-slate-300">
                            <span>Element:</span>
                            <span className="text-purple-400 font-bold">{targetElement}</span>
                          </div>
                          <div className="flex justify-between mt-0.5 text-slate-300">
                            <span>Style:</span>
                            <span className="text-pink-400 font-bold">{targetStyle}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 border-t border-slate-800/80 pt-4">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">TOTAL DUE</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">{formattedPrice(meta.price)}</span>
                      <span className="block text-[10px] text-slate-500 font-mono mt-1">✓ PPN 11% Included • Instant Delivery</span>
                    </div>
                  </div>

                  {/* Right Column: Payment Selection & Mock Details */}
                  <div className="flex flex-col gap-4 bg-slate-950/80 border border-slate-800/60 p-4 rounded-2xl">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Pilih Metode Pembayaran:</span>
                    
                    <div className="flex flex-col gap-2">
                      {/* QRIS */}
                      <button
                        onClick={() => setPaymentMethod("qris")}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${paymentMethod === "qris" ? "border-purple-500 bg-purple-500/10 text-slate-100" : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800/50"}`}
                      >
                        <div className="flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-purple-400" />
                          <div>
                            <div className="text-xs font-bold font-mono">QRIS (Scan & Bayar)</div>
                            <div className="text-[9px] text-slate-500">GoPay, OVO, Dana, ShopeePay</div>
                          </div>
                        </div>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${paymentMethod === "qris" ? "text-purple-400" : "text-transparent"}`} />
                      </button>

                      {/* GoPay Direct */}
                      <button
                        onClick={() => setPaymentMethod("gopay")}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${paymentMethod === "gopay" ? "border-blue-500 bg-blue-500/10 text-slate-100" : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800/50"}`}
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-blue-400" />
                          <div>
                            <div className="text-xs font-bold font-mono">GoPay E-Wallet</div>
                            <div className="text-[9px] text-slate-500">Bayar instan via Gojek App</div>
                          </div>
                        </div>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${paymentMethod === "gopay" ? "text-blue-400" : "text-transparent"}`} />
                      </button>

                      {/* Virtual Account */}
                      <button
                        onClick={() => setPaymentMethod("va")}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${paymentMethod === "va" ? "border-amber-500 bg-amber-500/10 text-slate-100" : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800/50"}`}
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-amber-400" />
                          <div>
                            <div className="text-xs font-bold font-mono">Virtual Account Bank</div>
                            <div className="text-[9px] text-slate-500">Mandiri, BCA, BRI, BNI</div>
                          </div>
                        </div>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${paymentMethod === "va" ? "text-amber-400" : "text-transparent"}`} />
                      </button>
                    </div>

                    <div className="mt-2">
                      <button
                        onClick={simulatePaymentSuccess}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl font-mono tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/10 active:scale-95 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {language === "id" ? "BAYAR SEKARANG" : "PAY NOW"}
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* PROCESSING STATE */}
              {paymentStatus === "processing" && (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-4" id="checkout_gateway_processing">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-dashed border-purple-500 rounded-full animate-spin" />
                    <div className="absolute inset-2 border border-dotted border-purple-300 rounded-full animate-spin-reverse" />
                  </div>
                  <h4 className="text-lg font-bold font-mono tracking-tight text-slate-100 mt-2">
                    {language === "id" ? "Memproses Pembayaran Anda..." : "Processing Your Payment..."}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Sistem sedang memverifikasi dana transfer instan Anda. Jangan tutup portal ini.
                  </p>
                </div>
              )}

              {/* SUCCESS STATE */}
              {paymentStatus === "success" && (
                <div className="py-2 flex flex-col items-center justify-center text-center gap-4" id="checkout_gateway_success">
                  
                  {/* Point Success Screen */}
                  {checkoutType === "points" ? (
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2 animate-bounce">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h4 className="text-xl font-black text-slate-100 font-mono tracking-tight uppercase">
                        {language === "id" ? "PEMBELIAN POIN SUKSES! 🎉" : "POINTS PURCHASED! 🎉"}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md leading-relaxed mt-1">
                        Pembayaran Rp {meta.price.toLocaleString()} terverifikasi. Kredit Nekomon Poin telah disinkronkan ke dalam saldo akun Anda secara aman.
                      </p>
                      
                      <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl w-full max-w-sm mt-4 font-mono text-xs flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">TRANSACTION ID:</span>
                          <span className="text-slate-300 font-bold">TX_{Math.floor(100000 + Math.random() * 900000)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-900 pt-2">
                          <span className="text-slate-500">CREDIT ADDED:</span>
                          <span className="text-yellow-400 font-black">+{selectedPackageId === "points_100" ? 100 : selectedPackageId === "points_500" ? 500 : 1200} POINTS</span>
                        </div>
                      </div>

                      <button
                        onClick={closeCheckoutModal}
                        className="mt-6 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        {t("common.close")}
                      </button>
                    </div>
                  ) : (
                    /* GACHA UNBOXING REVEAL STATE (BOOSTER PACK) */
                    <div className="w-full flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 mb-4 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-[10px] font-bold font-mono text-purple-300">
                          {language === "id" ? "BOOSTER PACK BERHASIL DIBELI! 📦" : "BOOSTER PACK RETRIEVED! 📦"}
                        </span>
                      </div>

                      <h4 className="text-lg font-black text-slate-100 font-mono tracking-tight mb-2 uppercase">
                        {language === "id" ? "KLIK UNTUK MEMBUKA KARTU!" : "TAP CARDS TO REVEAL!"}
                      </h4>
                      <p className="text-xs text-slate-400 mb-6 max-w-md">
                        {language === "id" 
                          ? `Anda memecahkan booster pack dan mendapatkan bonus +${coresEarned} Nekomon Cores! Balik kartu di bawah untuk melihat wujud aslinya.`
                          : `You opened the booster and acquired +${coresEarned} bonus Nekomon Cores! Click the card face below to reveal your summon.`}
                      </p>

                      {/* Flex/Grid of Earned Gacha Cards */}
                      <div className={`grid gap-6 ${earnedCards.length === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"} justify-center max-w-full overflow-x-auto p-2`}>
                        {earnedCards.map((card, idx) => {
                          const isRevealed = revealedCardIndices.includes(idx);
                          return (
                            <div key={card.id || idx} className="flex flex-col items-center gap-3">
                              <div className="w-[200px] h-[290px] relative perspective-1000">
                                <motion.div
                                  className="w-full h-full relative transition-transform duration-700 preserve-3d"
                                  style={{ transformStyle: "preserve-3d" }}
                                  animate={{ rotateY: isRevealed ? 180 : 0 }}
                                  onClick={() => toggleRevealCard(idx)}
                                >
                                  {/* FRONT SIDE (REVEALED CARD) */}
                                  <div 
                                    className="absolute inset-0 w-full h-full backface-hidden"
                                    style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
                                  >
                                    <NekomonCard card={card} size="sm" />
                                  </div>

                                  {/* BACK SIDE (FACE DOWN GACHA CARD) */}
                                  <div 
                                    className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 border-2 border-purple-500/40 rounded-2xl flex flex-col items-center justify-center p-4 shadow-[0_0_20px_rgba(147,51,234,0.3)] cursor-pointer hover:border-purple-400 transition-colors"
                                    style={{ backfaceVisibility: "hidden" }}
                                  >
                                    <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 animate-pulse">
                                      <ShoppingBag className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black tracking-widest font-mono text-purple-300 uppercase">NEKOMON</span>
                                    <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase">CLICK TO REVEAL 🔮</span>
                                  </div>

                                </motion.div>
                              </div>
                              
                              <AnimatePresence>
                                {isRevealed && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center font-mono"
                                  >
                                    <span className="text-[10px] font-black text-slate-100 block uppercase tracking-tight">{card.name}</span>
                                    <span className="text-[9px] text-yellow-400 font-extrabold uppercase">{card.rarity}</span>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>

                      {/* Confirm Addition */}
                      {revealedCardIndices.length === earnedCards.length && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-8"
                        >
                          <button
                            onClick={closeCheckoutModal}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-8 py-3 rounded-2xl transition-all shadow-lg hover:shadow-purple-500/20 active:scale-95 cursor-pointer font-mono tracking-widest"
                          >
                            {language === "id" ? "MASUKKAN KE ALBUM 🐾" : "ADD TO ALBUM 🐾"}
                          </button>
                        </motion.div>
                      )}

                    </div>
                  )}

                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
