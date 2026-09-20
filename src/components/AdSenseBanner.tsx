import React, { useEffect, useRef } from "react";

const ADSENSE_SCRIPT_ID = "nekomon-adsense-script";

interface AdSenseBannerProps {
  slotId?: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slotId = "8821940125",
  format = "auto",
  className = ""
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushedRef = useRef<boolean>(false);
  const clientId = String(import.meta.env.VITE_ADSENSE_CLIENT || "").trim();
  const adsEnabled = import.meta.env.PROD
    && import.meta.env.VITE_ADSENSE_ENABLED === "true"
    && import.meta.env.VITE_ADSENSE_CMP_READY === "true"
    && /^ca-pub-\d+$/.test(clientId);

  useEffect(() => {
    if (!adsEnabled || typeof window === "undefined") return;

    const requestAd = () => {
      try {
        if (adRef.current && !isPushedRef.current && adRef.current.childNodes.length === 0) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isPushedRef.current = true;
        }
      } catch (error) {
        console.warn("AdSense request skipped:", error);
      }
    };

    const existingScript = document.getElementById(ADSENSE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if (existingScript.dataset.loaded === "true") requestAd();
      else existingScript.addEventListener("load", requestAd, { once: true });
      return () => existingScript.removeEventListener("load", requestAd);
    }

    const script = document.createElement("script");
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      requestAd();
    }, { once: true });
    document.head.appendChild(script);
  }, [adsEnabled, clientId]);

  if (!adsEnabled) return null;

  return (
    <div className={`w-full max-w-4xl mx-auto my-4 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[100px] overflow-hidden text-center text-xs font-mono text-slate-400 ${className}`}>
      <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
        <span>Sponsor / Google AdSense</span>
      </div>
      
      {/* Real AdSense Ins Element */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", minWidth: "280px", minHeight: "90px", width: "100%" }}
        data-ad-client="ca-pub-2411657012211511"
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
        data-tag-for-age-treatment="2"
      />
    </div>
  );
};
