import React, { useEffect, useRef } from "react";

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

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && adRef.current && !isPushedRef.current) {
        if (adRef.current.childNodes.length === 0) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isPushedRef.current = true;
        }
      }
    } catch (e) {
      console.log("AdSense push notice:", e);
    }
  }, []);

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
      />
    </div>
  );
};
