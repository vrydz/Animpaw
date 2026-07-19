import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  Check, 
  X, 
  User, 
  ArrowLeftRight, 
  Loader2, 
  FolderSync, 
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../types";
import { NekomonCard } from "./NekomonCard";

export interface TradeProposal {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
  senderCardId: string;
  senderCardName: string;
  senderCardRarity: string;
  senderCardImageUrl: string;
  receiverCardId: string;
  receiverCardName: string;
  receiverCardRarity: string;
  receiverCardImageUrl: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
}

export interface Player {
  id: string;
  username: string;
  points: number;
  cores: number;
  totalCards: number;
  cards: Card[];
}

interface CardTradingProps {
  userCards: Card[];
  token: string;
  onTradeCompleted: () => void;
}

export const CardTrading: React.FC<CardTradingProps> = ({ 
  userCards, 
  token, 
  onTradeCompleted 
}) => {
  const [activeTab, setActiveTab] = useState<"propose" | "my-trades">("propose");
  const [players, setPlayers] = useState<Player[]>([]);
  const [trades, setTrades] = useState<TradeProposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Proposal Creation States
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedReceiverCard, setSelectedReceiverCard] = useState<Card | null>(null);
  const [selectedSenderCard, setSelectedSenderCard] = useState<Card | null>(null);

  const fetchTradingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [playersRes, tradesRes] = await Promise.all([
        fetch("/api/trading/players", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/trading/trades", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (playersRes.ok && tradesRes.ok) {
        const playersData = await playersRes.json();
        const tradesData = await tradesRes.json();
        setPlayers(playersData.players || []);
        setTrades(tradesData.trades || []);
      } else {
        setError("Gagal memuat data pasar barter.");
      }
    } catch (err) {
      console.error("Error fetching trading data:", err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTradingData();
    }
  }, [token, userCards]);

  const handleProposeTrade = async () => {
    if (!selectedPlayer || !selectedReceiverCard || !selectedSenderCard) {
      setError("Silakan lengkapi pemilihan kartu sebelum mengajukan.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/trading/propose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedPlayer.id,
          senderCardId: selectedSenderCard.id,
          receiverCardId: selectedReceiverCard.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || "Tawaran barter berhasil dikirim!");
        setSelectedPlayer(null);
        setSelectedReceiverCard(null);
        setSelectedSenderCard(null);
        // Refresh
        await fetchTradingData();
        onTradeCompleted();
        setActiveTab("my-trades");
      } else {
        setError(data.error || "Gagal mengirimkan tawaran barter.");
      }
    } catch (err) {
      setError("Kesalahan koneksi saat mengirim tawaran.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptTrade = async (tradeId: string) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/trading/trades/${tradeId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || "Pertukaran diselesaikan!");
        await fetchTradingData();
        onTradeCompleted();
      } else {
        setError(data.error || "Gagal menyetujui pertukaran.");
      }
    } catch (err) {
      setError("Kesalahan jaringan saat memproses barter.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectTrade = async (tradeId: string) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/trading/trades/${tradeId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Tawaran barter berhasil ditolak.");
        await fetchTradingData();
      } else {
        setError(data.error || "Gagal menolak pertukaran.");
      }
    } catch (err) {
      setError("Kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTrade = async (tradeId: string) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/trading/trades/${tradeId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Tawaran barter berhasil dibatalkan.");
        await fetchTradingData();
      } else {
        setError(data.error || "Gagal membatalkan pertukaran.");
      }
    } catch (err) {
      setError("Kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to filter sender cards with the same rarity as the selected receiver card
  const getEligibleSenderCards = () => {
    if (!selectedReceiverCard) return [];
    return userCards.filter(
      (c) => (c.rarity || "Common").toLowerCase() === (selectedReceiverCard.rarity || "Common").toLowerCase()
    );
  };

  // Split trades into Incoming and Outgoing
  const incomingTrades = trades.filter((t) => t.status === "pending" && t.receiverUsername.toLowerCase() !== t.senderUsername.toLowerCase());
  const outgoingTrades = trades.filter((t) => t.senderUsername.toLowerCase() !== t.receiverUsername.toLowerCase());

  // Rarity color utility
  const getRarityBadgeStyle = (rarity: string) => {
    const r = rarity.toLowerCase();
    if (r === "mythic") return "bg-red-500/20 text-red-400 border border-red-500/30";
    if (r === "legend" || r === "legendary") return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    if (r === "epic") return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
    if (r === "rare") return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    return "bg-slate-500/20 text-slate-400 border border-slate-700";
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 flex-1">
      {/* Toast notifications */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-950/80 border border-red-800 text-red-200 p-3 rounded-xl text-xs flex items-center gap-2 mb-3 shadow-lg"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 p-3 rounded-xl text-xs flex items-center gap-2 mb-3 shadow-lg"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex bg-slate-900 rounded-xl p-1 mb-4 border border-slate-800/80 shrink-0">
        <button
          onClick={() => {
            setActiveTab("propose");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
            activeTab === "propose"
              ? "bg-slate-800 text-yellow-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          🤝 Buat Barter
        </button>
        <button
          onClick={() => {
            setActiveTab("my-trades");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center relative ${
            activeTab === "my-trades"
              ? "bg-slate-800 text-yellow-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          📂 Tawaran Saya
          {incomingTrades.length > 0 && (
            <span className="absolute top-1.5 right-3 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {incomingTrades.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <span className="text-xs font-mono">Memuat pasar Nekomon...</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-h-[460px] pr-1">
          {activeTab === "propose" ? (
            /* --- PROPOSE TRADE WINDOW --- */
            <div className="flex flex-col gap-4">
              
              {/* Step 1: Select Player */}
              {!selectedPlayer ? (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                      Langkah 1: Pilih Pemain Tujuan
                    </span>
                    <button 
                      onClick={fetchTradingData}
                      className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {players.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center gap-2">
                      <User className="w-8 h-8 text-slate-600" />
                      <span className="text-xs text-slate-400 font-medium">Belum ada pemain lain terdaftar</span>
                      <p className="text-[10px] text-slate-500">
                        Undang teman Anda untuk mendaftar akun agar dapat melangsungkan pertukaran kartu!
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                      {players.map((p) => (
                        <div 
                          key={p.id}
                          onClick={() => setSelectedPlayer(p)}
                          className="flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl cursor-pointer transition-all hover:border-slate-700 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-sm">
                              🐱
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-200">@{p.username}</h4>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {p.totalCards} Kartu · {p.points} Poin
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono flex items-center gap-1">
                            PILIH <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Step 2 & 3: Selected Player View */
                <div className="flex flex-col gap-4">
                  {/* Selected Player Header */}
                  <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">Target Barter:</span>
                      <span className="font-extrabold text-xs text-yellow-400">@{selectedPlayer.username}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPlayer(null);
                        setSelectedReceiverCard(null);
                        setSelectedSenderCard(null);
                      }}
                      className="text-[10px] font-mono text-rose-400 hover:text-rose-300 font-bold"
                    >
                      [Ubah Pemain]
                    </button>
                  </div>

                  {/* Selecting Target's Card */}
                  {!selectedReceiverCard ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                        Langkah 2: Pilih Kartu @{selectedPlayer.username} Yang Diinginkan
                      </span>

                      {selectedPlayer.cards.length === 0 ? (
                        <div className="text-center py-8 bg-slate-900/30 border border-slate-800 rounded-xl p-4">
                          <p className="text-xs text-slate-500">Pemain ini belum memiliki kartu Nekomon untuk ditukar.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1 bg-slate-900/10 rounded-xl border border-slate-900">
                          {selectedPlayer.cards.map((card) => (
                            <div
                              key={card.id}
                              onClick={() => setSelectedReceiverCard(card)}
                              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-yellow-500/50 p-2 rounded-xl cursor-pointer transition-all flex flex-col gap-1.5"
                            >
                              <div className="aspect-square w-full rounded-lg bg-slate-950 overflow-hidden relative border border-slate-800/80">
                                <img 
                                  src={card.imageUrl} 
                                  alt={card.name} 
                                  className="w-full h-full object-cover"
                                />
                                <span className={`absolute top-1 right-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full ${getRarityBadgeStyle(card.rarity)}`}>
                                  {card.rarity}
                                </span>
                              </div>
                              <div className="text-center">
                                <h4 className="font-extrabold text-[10px] text-slate-200 truncate">{card.name}</h4>
                                <span className="text-[9px] text-slate-500 font-mono capitalize">{card.element}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Target Card Selected, now select offered card of same rarity */
                    <div className="flex flex-col gap-3">
                      {/* Requested Card Summary Panel */}
                      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={selectedReceiverCard.imageUrl} 
                            alt={selectedReceiverCard.name} 
                            className="w-10 h-10 object-cover rounded bg-slate-950 border border-slate-800"
                          />
                          <div>
                            <span className="text-[9px] font-mono text-slate-500 block uppercase">Minta Kartu :</span>
                            <h4 className="font-extrabold text-xs text-slate-200">{selectedReceiverCard.name}</h4>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${getRarityBadgeStyle(selectedReceiverCard.rarity)}`}>
                          {selectedReceiverCard.rarity}
                        </span>
                      </div>

                      {/* Select Offered Card of Matching Rarity */}
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                            Langkah 3: Pilih Kartu Anda Ber-rarity "{selectedReceiverCard.rarity}"
                          </span>
                          <button
                            onClick={() => {
                              setSelectedReceiverCard(null);
                              setSelectedSenderCard(null);
                            }}
                            className="text-[10px] font-mono text-rose-400 hover:text-rose-300 font-bold"
                          >
                            [Ubah Kartu Target]
                          </button>
                        </div>

                        {getEligibleSenderCards().length === 0 ? (
                          <div className="text-center py-8 bg-rose-950/10 border border-rose-900/20 rounded-xl p-4 flex flex-col items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-rose-400" />
                            <p className="text-xs text-slate-400 font-semibold leading-normal">
                              Gagal: Tidak ada kartu dengan kelayakan barter.
                            </p>
                            <span className="text-[10px] text-slate-500 max-w-xs leading-relaxed text-center">
                              Anda tidak memiliki kartu Nekomon dengan kelangkaan <span className="text-yellow-500 font-bold">"{selectedReceiverCard.rarity}"</span> untuk ditukar. Anda harus meng-forge kartu baru dengan kelangkaan serupa.
                            </span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto p-1 bg-slate-900/10 rounded-xl border border-slate-900">
                            {getEligibleSenderCards().map((card) => {
                              const isSelected = selectedSenderCard?.id === card.id;
                              return (
                                <div
                                  key={card.id}
                                  onClick={() => setSelectedSenderCard(card)}
                                  className={`p-2 rounded-xl cursor-pointer transition-all flex flex-col gap-1.5 bg-slate-900 border ${
                                    isSelected 
                                      ? "border-yellow-500 bg-yellow-500/5 ring-1 ring-yellow-500" 
                                      : "border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                                  }`}
                                >
                                  <div className="aspect-square w-full rounded-lg bg-slate-950 overflow-hidden relative border border-slate-800/80">
                                    <img 
                                      src={card.imageUrl} 
                                      alt={card.name} 
                                      className="w-full h-full object-cover"
                                    />
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-yellow-500/10 flex items-center justify-center backdrop-blur-[1px]">
                                        <div className="w-6 h-6 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center shadow-lg font-bold">
                                          ✓
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-center">
                                    <h4 className="font-extrabold text-[10px] text-slate-200 truncate">{card.name}</h4>
                                    <span className="text-[9px] text-slate-500 font-mono capitalize">{card.element}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {selectedSenderCard && (
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 mt-2">
                          <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                            <span className="text-slate-500">Tingkat Rarity Barter:</span>
                            <span className="text-yellow-400 font-black tracking-wider uppercase">
                              {selectedReceiverCard.rarity}
                            </span>
                          </div>

                          <div className="flex items-center justify-around py-1">
                            <div className="flex flex-col items-center gap-1 text-center max-w-[100px]">
                              <img 
                                src={selectedSenderCard.imageUrl} 
                                alt={selectedSenderCard.name} 
                                className="w-12 h-12 object-cover rounded-xl border-2 border-emerald-500/50 bg-slate-950"
                              />
                              <span className="text-[9px] font-bold text-slate-300 truncate w-full">{selectedSenderCard.name}</span>
                              <span className="text-[8px] font-mono text-emerald-400">Punya Anda</span>
                            </div>
                            <ArrowLeftRight className="w-5 h-5 text-yellow-500 animate-pulse" />
                            <div className="flex flex-col items-center gap-1 text-center max-w-[100px]">
                              <img 
                                src={selectedReceiverCard.imageUrl} 
                                alt={selectedReceiverCard.name} 
                                className="w-12 h-12 object-cover rounded-xl border-2 border-yellow-500/50 bg-slate-950"
                              />
                              <span className="text-[9px] font-bold text-slate-300 truncate w-full">{selectedReceiverCard.name}</span>
                              <span className="text-[8px] font-mono text-yellow-500">@{selectedPlayer.username}</span>
                            </div>
                          </div>

                          <button
                            onClick={handleProposeTrade}
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                MENGIRIM TAWARAN...
                              </>
                            ) : (
                              <>
                                <FolderSync className="w-4 h-4" />
                                AJUKAN BARTER SEKARANG 🤝
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            /* --- MY TRADES WINDOW --- */
            <div className="flex flex-col gap-5">
              
              {/* Refresher */}
              <div className="flex justify-between items-center shrink-0">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Status & Daftar Riwayat Barter</span>
                <button 
                  onClick={fetchTradingData}
                  className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  SINKRONISASI
                </button>
              </div>

              {/* SECTION: Incoming Trades */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="font-extrabold text-xs text-slate-200">Tawaran Masuk ({incomingTrades.length})</h3>
                </div>

                {incomingTrades.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic py-2 text-center">Belum ada tawaran barter masuk dari pemain lain.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {incomingTrades.map((t) => (
                      <div 
                        key={t.id}
                        className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-3 shadow-md"
                      >
                        <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5 text-[9px] font-mono">
                          <span className="text-slate-400">Dari: <span className="font-extrabold text-yellow-500">@{t.senderUsername}</span></span>
                          <span className={`px-1.5 py-0.5 rounded ${getRarityBadgeStyle(t.senderCardRarity)}`}>
                            {t.senderCardRarity}
                          </span>
                        </div>

                        {/* Swap visualizer cards */}
                        <div className="grid grid-cols-7 gap-1 items-center bg-slate-950 p-2 rounded-lg border border-slate-900">
                          {/* Sender's Card */}
                          <div className="col-span-3 flex flex-col items-center gap-1 text-center">
                            <img 
                              src={t.senderCardImageUrl} 
                              alt={t.senderCardName} 
                              className="w-12 h-12 object-cover rounded-lg border border-slate-800 bg-slate-900"
                            />
                            <span className="text-[8px] font-bold text-slate-300 truncate w-full">{t.senderCardName}</span>
                            <span className="text-[7px] font-mono text-slate-500 uppercase">Ditawarkan</span>
                          </div>

                          <div className="col-span-1 flex justify-center text-yellow-500">
                            <ArrowRight className="w-4 h-4 animate-pulse" />
                          </div>

                          {/* Your Requested Card */}
                          <div className="col-span-3 flex flex-col items-center gap-1 text-center">
                            <img 
                              src={t.receiverCardImageUrl} 
                              alt={t.receiverCardName} 
                              className="w-12 h-12 object-cover rounded-lg border border-slate-800 bg-slate-900"
                            />
                            <span className="text-[8px] font-bold text-slate-300 truncate w-full">{t.receiverCardName}</span>
                            <span className="text-[7px] font-mono text-slate-500 uppercase">Milik Anda</span>
                          </div>
                        </div>

                        {/* Accept/Reject Button controls */}
                        <div className="flex gap-2 text-center mt-1">
                          <button
                            onClick={() => handleRejectTrade(t.id)}
                            disabled={submitting}
                            className="flex-1 bg-red-950/40 hover:bg-red-950 text-red-200 hover:text-red-100 border border-red-900/30 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            TOLAK
                          </button>
                          <button
                            onClick={() => handleAcceptTrade(t.id)}
                            disabled={submitting}
                            className="flex-1 bg-emerald-900 hover:bg-emerald-800 text-white border border-emerald-800 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            TERIMA BARTER
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: Outgoing & All Trade History */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <h3 className="font-extrabold text-xs text-slate-200">Riwayat & Status Kiriman ({outgoingTrades.length})</h3>
                </div>

                {outgoingTrades.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic py-2 text-center">Belum ada riwayat pengajuan barter.</p>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto">
                    {outgoingTrades.map((t) => {
                      const isSender = t.senderUsername.toLowerCase() === userCards[0]?.userId?.toLowerCase() || t.senderId === userCards[0]?.userId; // Wait, we can also check senderId matching
                      const displayTarget = t.senderId === t.receiverId ? "Self" : (t.senderUsername === t.receiverUsername ? "Self" : `@${t.receiverUsername}`);
                      
                      return (
                        <div 
                          key={t.id}
                          className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-lg flex flex-col gap-2 text-[9px]"
                        >
                          <div className="flex justify-between items-baseline">
                            <span className="text-slate-500 font-mono">ID: {t.id}</span>
                            <span className={`px-1 rounded text-[8px] font-bold uppercase font-mono ${
                              t.status === "pending" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                              t.status === "accepted" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                              "bg-slate-800 text-slate-400 border border-slate-700/80"
                            }`}>
                              {t.status}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-300">
                            <div className="flex flex-col truncate max-w-[100px]">
                              <span className="text-[8px] text-slate-500">Ditawarkan ({t.senderUsername}):</span>
                              <span className="font-extrabold text-slate-200 truncate">{t.senderCardName}</span>
                            </div>
                            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <div className="flex flex-col truncate max-w-[100px] text-right">
                              <span className="text-[8px] text-slate-500">Diminta ({t.receiverUsername}):</span>
                              <span className="font-extrabold text-slate-200 truncate">{t.receiverCardName}</span>
                            </div>
                          </div>

                          {t.status === "pending" && t.senderUsername !== t.receiverUsername && (
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => handleCancelTrade(t.id)}
                                disabled={submitting}
                                className="px-2 py-1 bg-red-950/20 hover:bg-red-950/50 text-red-400 rounded hover:text-red-200 transition-all font-bold cursor-pointer border border-red-900/20"
                              >
                                Batalkan Pengajuan
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};
