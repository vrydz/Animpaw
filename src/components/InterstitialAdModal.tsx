import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  ShieldCheck, 
  Sparkles
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface InterstitialAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTabName?: string;
  onAdClicked?: () => void;
}

export function InterstitialAdModal({
  isOpen,
  onClose,
  targetTabName
}: InterstitialAdModalProps) {
  const { language } = useLanguage();
  const [countdown, setCountdown] = useState<number>(5);
  const [canSkip, setCanSkip] = useState<boolean>(false);
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(5);
    setCanSkip(false);
    isPushedRef.current = false;

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

    // Initialize AdSense if script is available
    const adPushTimeout = setTimeout(() => {
      try {
        if (typeof window !== "undefined" && adRef.current && !isPushedRef.current) {
          if (adRef.current.childNodes.length === 0) {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            isPushedRef.current = true;
          }
        }
      } catch (e) {
        console.log("AdSense modal unit push notice:", e);
      }
    }, 200);

    return () => {
      clearInterval(timer);
      clearTimeout(adPushTimeout);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded font-black text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {language === "id" ? "Iklan Google AdSense" : "Google AdSense Ad"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Skip / Countdown Button */}
              {canSkip ? (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700 cursor-pointer shadow-lg active:scale-95"
                >
                  <span>{language === "id" ? "Tutup Iklan" : "Close Ad"}</span>
                  <X className="w-4 h-4 text-rose-400" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 text-slate-400 font-mono text-xs border border-slate-800">
                  <span>{language === "id" ? `Dapat ditutup dlm ${countdown}s` : `Can close in ${countdown}s`}</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Ad Provider Content Canvas */}
          <div className="p-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex-1 overflow-y-auto flex flex-col gap-4">
            
            {/* Real Google AdSense Unit Container */}
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center min-h-[250px] text-center shadow-inner">
              <div className="text-[10px] text-slate-500 font-mono uppercase mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Google AdSense Display Unit</span>
              </div>
              
              <ins
                ref={adRef}
                className="adsbygoogle w-full"
                style={{ display: "block", minHeight: "200px" }}
                data-ad-client="ca-pub-2411657012211511"
                data-ad-slot="8821940125"
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            </div>

            {targetTabName && (
              <p className="text-center text-[11px] text-slate-400 font-mono">
                {language === "id" 
                  ? `Melanjutkan berpindah ke tab "${targetTabName}"...` 
                  : `Continuing to "${targetTabName}" tab...`}
              </p>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Google AdSense Official Partner</span>
            </div>
            <span>ID: ca-pub-2411657012211511</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
