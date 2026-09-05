import React, { useState, useEffect } from "react";
import { Trophy, Award, Crown, Loader2, Sparkles, FolderHeart, Star, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { formatPlayerActivity } from "../utils/timeAgo";

export interface LeaderboardEntry {
  id: string;
  username: string;
  points: number;
  cores: number;
  totalCards: number;
  highestLevel: number;
  bestCard: {
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

interface LeaderboardViewProps {
  currentUser?: User | null;
  token: string;
  onMessagePlayer?: (partnerId: string, partnerUsername: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ currentUser, token, onMessagePlayer }) => {
  const { language, t } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"cards" | "level">("cards");

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leaderboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(data.leaderboard || []);
      } else {
        setError(language === "id" ? "Gagal memuat papan peringkat." : "Failed to load leaderboard.");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(language === "id" ? "Kesalahan jaringan." : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [token]);

  // Sort entries based on selected filter
  const sortedEntries = [...entries].sort((a, b) => {
    if (sortBy === "cards") {
      // First sort by totalCards desc, then by highestLevel desc, then points desc
      if (b.totalCards !== a.totalCards) {
        return b.totalCards - a.totalCards;
      }
      if (b.highestLevel !== a.highestLevel) {
        return b.highestLevel - a.highestLevel;
      }
      return b.points - a.points;
    } else {
      // First sort by highestLevel desc, then by totalCards desc, then points desc
      if (b.highestLevel !== a.highestLevel) {
        return b.highestLevel - a.highestLevel;
      }
      if (b.totalCards !== a.totalCards) {
        return b.totalCards - a.totalCards;
      }
      return b.points - a.points;
    }
  });

  const getRarityBadgeColor = (rarity: string) => {
    const r = rarity.toLowerCase();
    if (r === "mythic") return "text-red-400 bg-red-950/40 border-red-800/40";
    if (r === "legend" || r === "legendary") return "text-amber-400 bg-amber-950/40 border-amber-800/40";
    if (r === "epic") return "text-purple-400 bg-purple-950/40 border-purple-800/40";
    if (r === "rare") return "text-blue-400 bg-blue-950/40 border-blue-800/40";
    return "text-slate-400 bg-slate-900 border-slate-800";
  };

  const getElementEmoji = (element: string) => {
    const el = element.toLowerCase();
    if (el === "api") return "🔥";
    if (el === "air") return "💧";
    if (el === "tanah") return "⛰️";
    if (el === "angin") return "🌪️";
    if (el === "petir") return "⚡";
    return "🐾";
  };

  return (
    <div id="leaderboard_container" className="flex flex-col gap-4 font-mono h-full">
      {/* View Title */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-yellow-500 font-bold tracking-widest uppercase">Global Ranks</span>
          <span className="text-xs font-black text-slate-200">{t("leaderboard.title")}</span>
        </div>
        <button
          onClick={fetchLeaderboard}
          className="text-[9px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all uppercase"
          disabled={loading}
        >
          {language === "id" ? "Segarkan" : "Refresh"}
        </button>
      </div>

      {/* Sorting Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-900">
        <button
          onClick={() => setSortBy("cards")}
          className={`py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
            sortBy === "cards"
              ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/15 border border-yellow-500/40 text-yellow-400"
              : "text-slate-500 hover:text-slate-300 bg-transparent border border-transparent"
          }`}
        >
          <FolderHeart className="w-3.5 h-3.5" />
          {language === "id" ? "Kolektor" : "Collector"}
        </button>
        <button
          onClick={() => setSortBy("level")}
          className={`py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
            sortBy === "level"
              ? "bg-gradient-to-r from-pink-500/20 to-purple-500/15 border border-pink-500/40 text-pink-400"
              : "text-slate-500 hover:text-slate-300 bg-transparent border border-transparent"
          }`}
        >
          <Star className="w-3.5 h-3.5 animate-pulse" />
          Master Level
        </button>
      </div>

      {/* Stats Description */}
      <p className="text-[9px] text-slate-500 leading-normal text-center bg-slate-900/20 p-2 rounded-lg border border-slate-900/40">
        {sortBy === "cards"
          ? (language === "id" ? "Peringkat berdasarkan jumlah koleksi Nekomon Card terbanyak." : "Ranked by total number of collected Nekomon Cards.")
          : (language === "id" ? "Peringkat berdasarkan level kartu Nekomon tertinggi yang dimiliki." : "Ranked by highest level of Nekomon Card owned.")}
      </p>

      {/* Loader / Content */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">{language === "id" ? "Menghubungkan ke Peringkat..." : "Connecting to Leaderboard..."}</span>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-xs text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded-xl p-3">
          {error}
        </div>
      ) : sortedEntries.length === 0 ? (
        <div className="text-center py-10 text-[10px] text-slate-500 leading-relaxed border border-slate-900 rounded-xl">
          {language === "id" ? "Belum ada pemain terdaftar." : "No players registered yet."}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2 max-h-[290px] overflow-y-auto pr-0.5">
          {sortedEntries.map((entry, index) => {
            const isMe = currentUser && entry.id === currentUser.id;
            const rank = index + 1;

            return (
              <div
                key={entry.id}
                className={`flex flex-col gap-1.5 p-2.5 rounded-xl transition-all border ${
                  isMe
                    ? "bg-slate-900/90 border-yellow-500/50 shadow-md shadow-yellow-500/5"
                    : "bg-slate-950/60 border-slate-900 hover:bg-slate-900/40 hover:border-slate-800"
                }`}
              >
                {/* Header Row: Rank + Username + Stats */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Rank Badge */}
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center font-black text-[10px] rounded">
                      {rank === 1 ? (
                        <Crown className="w-4.5 h-4.5 text-yellow-400 animate-bounce" />
                      ) : rank === 2 ? (
                        <Award className="w-4 h-4 text-slate-300" />
                      ) : rank === 3 ? (
                        <Award className="w-4 h-4 text-amber-600" />
                      ) : (
                        <span className="text-slate-500">#{rank}</span>
                      )}
                    </div>

                    {(() => {
                      const activity = formatPlayerActivity(entry.lastSeen, entry.isOnline, language, entry.isBot);
                      return (
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span 
                              className={`w-2 h-2 rounded-full shrink-0 ${activity.dotClass} ${activity.isOnline ? "animate-pulse" : ""}`}
                              title={activity.statusText} 
                            />
                            <span className={`text-[11px] font-black truncate max-w-[100px] sm:max-w-[130px] ${
                              isMe ? "text-yellow-400" : entry.isBot ? "text-amber-500 font-bold" : "text-slate-200"
                            }`}>
                              @{entry.username}
                            </span>
                            {isMe && (
                              <span className="text-[8px] bg-yellow-500 text-slate-950 px-1 rounded font-black uppercase">
                                {t("common.you")}
                              </span>
                            )}
                            {entry.isBot && (
                              <span className="text-[8px] bg-amber-950/40 text-amber-400 border border-amber-900/30 px-1 rounded font-black uppercase font-mono">
                                BOT
                              </span>
                            )}
                          </div>
                          <span className="text-[8px] font-mono text-slate-400 truncate mt-0.5">
                            {activity.statusText}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Main Sort Metric Highlighting */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-slate-300">
                      {entry.totalCards} {language === "id" ? "Kartu" : "Cards"}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-[10px] font-extrabold text-pink-400">
                      Lv. {entry.highestLevel}
                    </span>
                    {!isMe && onMessagePlayer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMessagePlayer(entry.id, entry.username);
                        }}
                        className="ml-1 p-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title={`Kirim pesan ke @${entry.username}`}
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span>Chat</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Best Card Details row if any */}
                {entry.bestCard ? (
                  <div className="flex items-center justify-between text-[9px] bg-slate-900/40 px-2 py-1.5 rounded-lg border border-slate-800/30">
                    <span className="text-slate-500 font-bold uppercase tracking-wide">{language === "id" ? "Kartu Utama:" : "Best Card:"}</span>
                    <div className="flex items-center gap-1">
                      <span>{getElementEmoji(entry.bestCard.element)}</span>
                      <span className="font-extrabold text-slate-300 max-w-[90px] truncate">{entry.bestCard.name}</span>
                      <span className={`px-1 py-0.2 rounded text-[8px] border font-black uppercase ${getRarityBadgeColor(entry.bestCard.rarity)}`}>
                        L.{entry.bestCard.level}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[8px] text-slate-600 italic">
                    {language === "id" ? "Belum memiliki Nekomon card." : "No Nekomon cards yet."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
