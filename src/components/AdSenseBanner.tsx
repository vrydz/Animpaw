import React, { useEffect } from "react";

interface AdSenseBannerProps {
  slotId?: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slotId = "1234567890",
  format = "auto",
  className = ""
}) => {
  useEffect(() => {
    try {
      // Safely initialize AdSense ad unit if script is loaded
      if (typeof window !== "undefined") {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.log("AdSense ad unit push notice:", e);
    }
  }, []);

  return (
    <div className={`w-full max-w-4xl mx-auto my-4 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[100px] overflow-hidden text-center text-xs font-mono text-slate-400 ${className}`}>
      <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
        <span>Sponsor / Iklan AdSense</span>
      </div>
      
      {/* Real AdSense Ins Element */}
      <ins
        className="adsbygoogle w-full"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2411657012211511"
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
