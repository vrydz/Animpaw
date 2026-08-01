import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Share2, Copy, Check, X, Sparkles, Award, ExternalLink, Zap, ShieldCheck } from "lucide-react";
import { PlayerBadge } from "../lib/badges";
import { useLanguage } from "../context/LanguageContext";
import { audio } from "../lib/audio";

interface AchievementShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  trainerLevel: number;
  badge: PlayerBadge | null;
  type?: "level_up" | "badge_unlocked" | "inspect";
}

export const AchievementShareModal: React.FC<AchievementShareModalProps> = ({
  isOpen,
  onClose,
  username,
  trainerLevel,
  badge,
  type = "badge_unlocked"
}) => {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const badgeName = badge 
    ? (language === "id" ? badge.badgeNameId : badge.badgeNameEn)
    : `Trainer Level ${trainerLevel}`;
  
  const badgeTitle = badge
    ? (language === "id" ? badge.titleId : badge.titleEn)
    : (language === "id" ? `Trainer Level ${trainerLevel}` : `Trainer Level ${trainerLevel}`);

  const badgeDesc = badge
    ? (language === "id" ? badge.descId : badge.descEn)
    : (language === "id" 
        ? `Selamat! Trainer @${username} telah berhasil mencapai Level ${trainerLevel}! Skuad Nekomon Anda semakin kuat.`
        : `Congrats! Trainer @${username} reached Level ${trainerLevel}! Your Nekomon squad is growing stronger.`);

  const badgeEmoji = badge ? badge.emoji : "⚡";

  // Bragging share message text
  const shareText = language === "id"
    ? `🎮 Hore! Saya @${username} baru saja mencapai Trainer Level ${trainerLevel} di Nekomon! 🐱⚡\n🏅 Lencana Unik: ${badgeEmoji} ${badgeName} (${badgeTitle})\nCoba tangkap foto kucingmu & bertarung sekarang: ${window.location.origin}`
    : `🎮 Yay! I @${username} just reached Trainer Level ${trainerLevel} in Nekomon! 🐱⚡\n🏅 Unique Badge: ${badgeEmoji} ${badgeName} (${badgeTitle})\nTry capturing cat photos & battling now: ${window.location.origin}`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      try { audio.playForgingSound(); } catch (e) {}
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      try { audio.playForgingSound(); } catch (e) {}
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      console.error("Failed to copy link:", e);
    }
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, "_blank");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        {/* Confetti / Particle Animation Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: -20, 
                scale: Math.random() * 0.8 + 0.4,
                rotate: 0,
                opacity: 1 
              }}
              animate={{ 
                y: window.innerHeight + 50, 
                rotate: 360,
                opacity: [1, 0.8, 0] 
              }}
              transition={{ 
                duration: Math.random() * 3 + 2, 
                repeat: Infinity, 
                delay: Math.random() * 2 
              }}
              className={`absolute w-3 h-3 rounded-sm ${
                i % 4 === 0 ? "bg-amber-400" : i % 4 === 1 ? "bg-yellow-300" : i % 4 === 2 ? "bg-pink-500" : "bg-cyan-400"
              }`}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden font-mono"
        >
          {/* Top Banner Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Badge Title */}
          <div className="text-center mt-2 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-widest mb-2 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              {type === "badge_unlocked"
                ? (language === "id" ? "LENCANA DIBUKA!" : "BADGE UNLOCKED!")
                : type === "level_up"
                ? (language === "id" ? "LEVEL UP TRAINER!" : "TRAINER LEVEL UP!")
                : (language === "id" ? "DETAIL LENCANA" : "BADGE DETAILS")}
            </div>

            <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">
              {type === "badge_unlocked"
                ? (language === "id" ? "PENCAPAIAN HEBAT!" : "GREAT ACHIEVEMENT!")
                : (language === "id" ? "SELAMAT TRAINER!" : "CONGRATULATIONS!")}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              @{username} • Trainer Level {trainerLevel}
            </p>
          </div>

          {/* Badge Display Box */}
          <div className={`p-5 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden my-4 ${
            badge?.glowClass || "bg-gradient-to-b from-amber-950/60 to-slate-950 border-amber-500/50"
          }`}>
            <div className="w-20 h-20 rounded-2xl bg-slate-950/80 border-2 border-amber-400/80 flex items-center justify-center text-5xl shadow-2xl mb-3 relative group">
              <span className="transform group-hover:scale-110 transition-transform duration-300">{badgeEmoji}</span>
              <div className="absolute -bottom-2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-amber-300 shadow">
                LV. {badge?.levelRequirement || trainerLevel}
              </div>
            </div>

            <h4 className="font-black text-lg text-amber-300 tracking-wide mt-1">
              {badgeName}
            </h4>
            <span className="text-xs font-bold text-slate-300 mb-2">
              {badgeTitle}
            </span>

            <p className="text-xs text-slate-300/90 leading-relaxed max-w-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {badgeDesc}
            </p>

            {/* Privilege Badge Perk */}
            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>
                {language === "id" 
                  ? `Bonus Hak Istimewa: Status Trainer Tingkat ${badge?.levelRequirement || trainerLevel}` 
                  : `Bonus Privilege: Tier ${badge?.levelRequirement || trainerLevel} Trainer Status`}
              </span>
            </div>
          </div>

          {/* Share Preview Text */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mb-1">
              <span>{language === "id" ? "PRANALA / PESAN BAGIKAN" : "SHARE MESSAGE PREVIEW"}</span>
              <span className="text-amber-400 font-mono">#NekomonApp</span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-2 italic font-sans bg-slate-900/80 p-2 rounded border border-slate-850">
              "{shareText}"
            </p>
          </div>

          {/* Action Share Buttons Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleShareTwitter}
              className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>X / Twitter</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyText}
              className={`flex-1 py-2.5 px-3 rounded-xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                copied
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                  : "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700"
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (language === "id" ? "Pesan Tersalin!" : "Message Copied!") : (language === "id" ? "Salin Pesan" : "Copy Message")}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className={`py-2.5 px-3 rounded-xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                copiedLink
                  ? "bg-teal-500 text-slate-950 border-teal-400"
                  : "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700"
              }`}
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Award className="w-4 h-4" />}
              <span>{copiedLink ? (language === "id" ? "Tautan Tersalin" : "Link Copied") : (language === "id" ? "Salin Link" : "Copy Link")}</span>
            </button>
          </div>

          {/* Dismiss Footer */}
          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-center text-xs text-slate-500 hover:text-slate-300 transition-colors font-bold"
          >
            {language === "id" ? "Tutup & Lanjutkan Petualangan" : "Close & Continue Adventure"}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
