import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Play, 
  Info, 
  Smartphone, 
  CheckCircle2, 
  Tv, 
  Terminal,
  Volume2,
  VolumeX,
  Star
} from "lucide-react";

interface InterstitialAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTabName?: string;
  onAdClicked?: () => void;
}

const AD_CAMPAIGNS = [
  {
    id: "campaign_cybercat",
    title: "CyberCat Tactics: Meow Revolution",
    developer: "Aetheria Game Studios",
    rating: "4.9 ★",
    category: "Strategy & Gacha RPG",
    description: "Kumpulkan 100+ Kucing Cyberpunk Legendaris & Kuasai Arena Guild Global!",
    badge: "Sponsor Pilihan Game 2026",
    bgGradient: "from-purple-900 via-indigo-950 to-slate-950",
    accentColor: "from-pink-500 to-purple-600",
    bannerIcon: "🐱⚡",
    adUnitId: "ca-pub-2411657012211511/interstitial_01",
    cta: "Download Gratis di Play Store"
  },
  {
    id: "campaign_neko_gear",
    title: "NekoPro Wireless Gaming Headset",
    developer: "RazerNeko Hardware",
    rating: "4.8 ★",
    category: "Aksesori Esports & Audio",
    description: "Latency Rendah 15ms + RGB Nekomimi Sync dengan Game Nekomon!",
    badge: "Diskon 30% Khusus Player Nekomon",
    bgGradient: "from-teal-950 via-slate-900 to-emerald-950",
    accentColor: "from-teal-400 to-emerald-500",
    bannerIcon: "🎧✨",
    adUnitId: "unity_ads_rewarded_interstitial_992",
    cta: "Klaim Voucher Diskon 30%"
  },
  {
    id: "campaign_anime_stream",
    title: "NekoFlix Premium: Streaming Anime Tanpa Iklan",
    developer: "NekoMedia Entertainment",
    rating: "5.0 ★",
    category: "Entertainment & Anime",
    description: "Nonton Serial Anime Isekai Kucing & Manga Terbaru dalam Kualitas 4K Ultra HD!",
    badge: "Coba Gratis 14 Hari Pertama",
    bgGradient: "from-rose-950 via-slate-900 to-red-950",
    accentColor: "from-red-500 to-amber-500",
    bannerIcon: "🍿📺",
    adUnitId: "ca-pub-2411657012211511/interstitial_02",
    cta: "Mulai Trial Gratis 14 Hari"
  }
];

export function InterstitialAdModal({
  isOpen,
  onClose,
  targetTabName,
  onAdClicked
}: InterstitialAdModalProps) {
  const [countdown, setCountdown] = useState<number>(5);
  const [canSkip, setCanSkip] = useState<boolean>(false);
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState<number>(0);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const campaign = AD_CAMPAIGNS[currentCampaignIndex];

  // Initialize and run countdown when ad opens
  useEffect(() => {
    if (!isOpen) return;

    // Pick random campaign
    const randomIndex = Math.floor(Math.random() * AD_CAMPAIGNS.length);
    setCurrentCampaignIndex(randomIndex);

    setCountdown(5);
    setCanSkip(false);

    const initialLogs = [
      `[${new Date().toLocaleTimeString()}] SDK Initializing: Google AdMob / Unity Ads Interstitial SDK v22.4`,
      `[${new Date().toLocaleTimeString()}] Ad Unit: ${AD_CAMPAIGNS[randomIndex].adUnitId}`,
      `[${new Date().toLocaleTimeString()}] Ad Loaded successfully. Format: FULLSCREEN_INTERSTITIAL`,
      `[${new Date().toLocaleTimeString()}] Impression Recorded (CPM: $18.50)`
    ];
    setLogs(initialLogs);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        if (prev <= 3) {
          setCanSkip(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleBannerClick = () => {
    addLog(`User clicked ad banner! Triggering Adsterra Smartlink navigation.`);
    if (onAdClicked) onAdClicked();
    window.open("https://www.effectivecpmnetwork.com/ztq3ewy6?key=2d94eee8c23563828aaaffbdfba18e46", "_blank");
  };

  const handleClose = () => {
    addLog(`Ad dismissed by user. Triggering onAdDismissed() event.`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* SDK Top Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-black text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                ADSTERRA NETWORK & SMARTLINK
              </span>
              <span className="hidden sm:inline text-[10px] text-teal-400 font-mono font-bold">
                Smartlink Direct Active
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              {/* Skip / Countdown Button */}
              {canSkip ? (
                <button
                  onClick={handleClose}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700 cursor-pointer shadow-lg"
                >
                  <span>Tutup Iklan</span>
                  <X className="w-3.5 h-3.5 text-rose-400" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 text-slate-400 font-mono text-xs border border-slate-800">
                  <span>Dapat ditutup dlm {countdown}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Ad Container Main Card */}
          <div className={`p-6 bg-gradient-to-b ${campaign.bgGradient} flex-1 overflow-y-auto`}>
            {/* Sponsor Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-950/60 text-slate-200 border border-slate-800 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {campaign.badge}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {campaign.rating}
              </span>
            </div>

            {/* Campaign Visual Frame */}
            <div className="relative rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950/50 p-6 mb-5 text-center shadow-inner">
              <div className="text-6xl mb-3 animate-bounce">{campaign.bannerIcon}</div>
              <h3 className="text-xl font-black text-white tracking-wide mb-1">
                {campaign.title}
              </h3>
              <p className="text-xs text-amber-300 font-medium mb-3">
                {campaign.developer} • {campaign.category}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto mb-4">
                "{campaign.description}"
              </p>

              {/* Interactive Gameplay Preview Graphic */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-left mb-2">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                    Bonus Pendaftar Baru
                  </div>
                  <div className="text-xs font-bold text-teal-300">
                    🎁 Free 10x Summons & SSR Hero Pack
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-extrabold text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>4.9</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleBannerClick}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r ${campaign.accentColor} hover:brightness-110 shadow-lg shadow-pink-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer`}
            >
              <span>{campaign.cta}</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            {targetTabName && (
              <p className="text-center text-[10px] text-slate-400 mt-3 font-mono">
                Melanjutkan berpindah ke tab <span className="text-amber-400 font-bold">"{targetTabName}"</span> setelah iklan...
              </p>
            )}
          </div>

          {/* Bottom Footer & SDK Logs Toggle */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200 font-mono transition-colors"
              >
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>{showLogs ? "Sembunyikan Console SDK" : "Lihat Simulasi Callback SDK"}</span>
              </button>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                <ShieldCheck className="w-3 h-3 text-teal-400" />
                <span>Verified Ad Network</span>
              </div>
            </div>

            {showLogs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 max-h-28 overflow-y-auto space-y-1"
              >
                {logs.map((log, idx) => (
                  <div key={idx} className="leading-tight">
                    {log}
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
