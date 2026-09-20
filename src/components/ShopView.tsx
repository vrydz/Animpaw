import React, { useEffect, useState } from "react";
import { History, Sparkles, Zap } from "lucide-react";
import { Card, User } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { audio } from "../lib/audio";

interface ShopViewProps {
  user: User | null;
  cards?: Card[];
  onPurchaseSuccess: (updatedPoints: number, updatedCores: number, addedCards?: Card[]) => void;
  onRefreshCards?: () => void;
}

interface Transaction {
  id: string;
  type: "energy_potion";
  packageName: string;
  pointsDeducted?: number;
  createdAt: string;
}

export function ShopView({ user, cards = [], onPurchaseSuccess, onRefreshCards }: ShopViewProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"energy" | "history">("energy");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isBuying, setIsBuying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) setSelectedCardId(cards[0].id);
  }, [cards, selectedCardId]);

  useEffect(() => {
    if (activeTab !== "history") return;
    const load = async () => {
      setLoadingHistory(true);
      try {
        const token = localStorage.getItem("nekomon_token");
        const response = await fetch("/api/shop/transactions", { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          setTransactions((data.transactions || []).filter((tx: Transaction) => tx.type === "energy_potion"));
        }
      } finally {
        setLoadingHistory(false);
      }
    };
    void load();
  }, [activeTab]);

  const buyPotion = async (potionType: "single" | "team") => {
    if (potionType === "single" && !selectedCardId) {
      setError(language === "id" ? "Pilih kartu terlebih dahulu." : "Select a card first.");
      return;
    }
    setIsBuying(true);
    setMessage(null);
    setError(null);
    try {
      const token = localStorage.getItem("nekomon_token");
      const response = await fetch("/api/shop/buy-energy-potion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ potionType, cardId: potionType === "single" ? selectedCardId : undefined })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Energy refill failed");
      try { audio.playUnboxingExplosion("Petir"); } catch (_) {}
      setMessage(data.message);
      onPurchaseSuccess(data.user.points, data.user.cores);
      onRefreshCards?.();
    } catch (err: any) {
      setError(err.message || (language === "id" ? "Gagal mengisi energi." : "Failed to refill energy."));
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-6 text-slate-200">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Sparkles className="text-yellow-400" />{language === "id" ? "Pusat Dukungan Nekomon" : "Nekomon Support Center"}</h1>
        <p className="text-sm text-slate-400 mt-2 mb-6">{language === "id" ? "Payment gateway dan pembelian uang nyata telah dihapus. Fitur berikut hanya memakai hadiah atau poin yang diperoleh di dalam game." : "Payment gateways and real-money purchases have been removed. These features only use rewards or points earned in game."}</p>

        <div className="flex gap-2 mb-6">
          {(["energy", "history"] as const).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border ${activeTab === tab ? "bg-purple-600 border-purple-400 text-white" : "bg-slate-900 border-slate-800 text-slate-400"}`}>{tab === "energy" ? (language === "id" ? "Energi" : "Energy") : (language === "id" ? "Riwayat" : "History")}</button>)}
        </div>

        {message && <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-sm text-emerald-300">{message}</div>}
        {error && <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-300">{error}</div>}

        {activeTab === "energy" && <div className="grid md:grid-cols-2 gap-4">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><Zap className="text-yellow-400 mb-3" /><h2 className="font-black text-white">{language === "id" ? "Ramuan Energi Kartu" : "Card Energy Potion"}</h2><p className="text-xs text-slate-400 my-2">{language === "id" ? "Isi satu kartu ke energi penuh dengan 30 poin game." : "Refill one card with 30 in-game points."}</p><select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm mb-3">{cards.map(card => <option key={card.id} value={card.id}>{card.name} — {card.energy ?? 5}/{card.maxEnergy ?? 5}</option>)}</select><button disabled={isBuying || !selectedCardId} onClick={() => void buyPotion("single")} className="w-full rounded-xl bg-yellow-500 p-3 font-black text-slate-950 disabled:opacity-50">{language === "id" ? "Isi Energi — 30 Poin" : "Refill Energy — 30 Points"}</button></section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><Zap className="text-purple-400 mb-3" /><h2 className="font-black text-white">{language === "id" ? "Ramuan Energi Tim" : "Team Energy Potion"}</h2><p className="text-xs text-slate-400 my-2">{language === "id" ? "Isi seluruh kartu ke energi penuh dengan 100 poin game." : "Refill every card with 100 in-game points."}</p><button disabled={isBuying || cards.length === 0} onClick={() => void buyPotion("team")} className="w-full rounded-xl bg-purple-600 p-3 font-black text-white disabled:opacity-50 md:mt-[52px]">{language === "id" ? "Isi Seluruh Tim — 100 Poin" : "Refill Team — 100 Points"}</button></section>
        </div>}

        {activeTab === "history" && <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-black text-white flex items-center gap-2 mb-4"><History size={18} />{language === "id" ? "Riwayat Penggunaan Poin" : "Point Usage History"}</h2>{loadingHistory ? <p className="text-slate-400">Loading...</p> : transactions.length === 0 ? <p className="text-slate-500">{language === "id" ? "Belum ada transaksi energi." : "No energy transactions yet."}</p> : transactions.map(tx => <div key={tx.id} className="flex justify-between border-t border-slate-800 py-3 text-sm"><span>{tx.packageName}</span><span className="text-yellow-400">-{tx.pointsDeducted || 0} pts</span></div>)}</section>}

        <div className="mt-6 text-xs text-slate-500">{language === "id" ? `Saldo saat ini: ${user?.points || 0} poin` : `Current balance: ${user?.points || 0} points`}</div>
      </div>
    </div>
  );
}
