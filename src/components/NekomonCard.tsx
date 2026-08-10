import React, { useRef, useState } from "react";
import { Card } from "../types";
import { Sparkles, Flame, Droplet, Trees, Wind, Zap, Award } from "lucide-react";
import { motion } from "motion/react";

interface NekomonCardProps {
  card: Card;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export const NekomonCard: React.FC<NekomonCardProps> = ({ card, onClick, size = "md" }) => {
  const { name, element, style, rarity, hp, atk, def, skillName, skillDesc, imageUrl } = card;

  // Gracefully handle cards created before the 'spd' stat was added
  const spd = card.spd || Math.floor((hp + atk) / 4.5);

  // Element configs
  const elementConfigs: Record<string, any> = {
    Api: {
      label: "FIRE TYPE",
      color: "text-red-500",
      glowColor: "rgba(239, 68, 68, 0.4)",
      borderColor: "border-red-500/70",
      icon: <Flame className="w-5 h-5 text-red-500" />,
      circleIcon: <Flame className="w-5 h-5 text-white" />,
      gradient: "from-red-950/80 via-slate-900 to-slate-950",
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/40"
    },
    Air: {
      label: "AQUA TYPE",
      color: "text-blue-500",
      glowColor: "rgba(59, 130, 246, 0.4)",
      borderColor: "border-blue-500/70",
      icon: <Droplet className="w-5 h-5 text-blue-500" />,
      circleIcon: <Droplet className="w-5 h-5 text-white" />,
      gradient: "from-blue-950/80 via-slate-900 to-slate-950",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40"
    },
    Tanah: {
      label: "EARTH TYPE",
      color: "text-emerald-500",
      glowColor: "rgba(16, 185, 129, 0.4)",
      borderColor: "border-emerald-500/70",
      icon: <Trees className="w-5 h-5 text-emerald-500" />,
      circleIcon: <Trees className="w-5 h-5 text-white" />,
      gradient: "from-emerald-950/80 via-slate-900 to-slate-950",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
    },
    Angin: {
      label: "WIND TYPE",
      color: "text-teal-500",
      glowColor: "rgba(20, 184, 166, 0.4)",
      borderColor: "border-teal-500/70",
      icon: <Wind className="w-5 h-5 text-teal-500" />,
      circleIcon: <Wind className="w-5 h-5 text-white" />,
      gradient: "from-teal-950/80 via-slate-900 to-slate-950",
      badgeColor: "bg-teal-500/20 text-teal-400 border-teal-500/40"
    },
    Petir: {
      label: "THUNDER TYPE",
      color: "text-yellow-500",
      glowColor: "rgba(234, 179, 8, 0.4)",
      borderColor: "border-yellow-500/70",
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      circleIcon: <Zap className="w-5 h-5 text-white" />,
      gradient: "from-yellow-950/80 via-slate-900 to-slate-950",
      badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
    }
  };
  const elementConfig = elementConfigs[element] || elementConfigs.Api;

  // Rarity config
  const rarityConfigs: Record<string, any> = {
    Common: {
      border: "border-slate-700",
      glow: "shadow-[0_0_15px_rgba(100,116,139,0.2)]",
      badge: "bg-slate-800 text-slate-300 border-slate-600",
      labelColor: "text-slate-400"
    },
    Rare: {
      border: "border-blue-600/80",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
      badge: "bg-blue-950 text-blue-300 border-blue-500",
      labelColor: "text-blue-400"
    },
    Epic: {
      border: "border-rose-600/85",
      glow: "shadow-[0_0_25px_rgba(225,29,72,0.45)]",
      badge: "bg-rose-950 text-rose-300 border-rose-500",
      labelColor: "text-rose-400"
    },
    Legend: {
      border: "border-amber-500",
      glow: "shadow-[0_0_30px_rgba(245,158,11,0.55)]",
      badge: "bg-amber-950 text-amber-300 border-amber-500",
      labelColor: "text-amber-400"
    },
    Legendary: {
      border: "border-amber-500",
      glow: "shadow-[0_0_30px_rgba(245,158,11,0.55)]",
      badge: "bg-amber-950 text-amber-300 border-amber-500",
      labelColor: "text-amber-400"
    },
    Mythic: {
      border: "border-pink-500",
      glow: "shadow-[0_0_35px_rgba(236,72,153,0.7)] animate-pulse",
      badge: "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400",
      labelColor: "text-pink-400"
    }
  };
  const rarityConfig = rarityConfigs[rarity] || rarityConfigs.Common;

  const sizeConfigs: Record<string, any> = {
    sm: "w-64 text-xs p-3.5",
    md: "w-[325px] text-sm p-4.5",
    lg: "w-[380px] text-base p-5.5"
  };
  const sizeConfig = sizeConfigs[size] || sizeConfigs.md;

  // Render elemental particle or decals on bottom border of card
  const renderElementalDecals = () => {
    if (element === "Api") {
      return (
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none overflow-hidden z-20">
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-red-500/20 to-transparent" />
          <svg className="absolute bottom-0 left-0 w-full h-12 text-orange-500/60 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,10 L100,10 L100,5 C90,8 80,2 70,7 C60,4 50,0 40,6 C30,3 20,8 10,2 C5,5 2,2 0,5 Z" fill="currentColor" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-full h-8 text-yellow-400/90 filter drop-shadow-[0_0_4px_rgba(245,158,11,0.9)] animate-pulse" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,10 L100,10 L100,3 C92,6 84,1 75,5 C66,2 58,0 48,4 C38,1 28,6 18,2 C10,4 5,1 0,3 Z" fill="currentColor" />
          </svg>
        </div>
      );
    }
    if (element === "Petir") {
      return (
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none overflow-hidden z-20">
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-yellow-500/20 to-transparent" />
          <Zap className="absolute bottom-2 left-2 w-5 h-5 text-yellow-400 animate-pulse" />
          <Zap className="absolute bottom-4 right-3 w-4 h-4 text-amber-300 animate-bounce" />
          <svg className="absolute bottom-0 left-0 w-full h-6 text-yellow-500/40" viewBox="0 0 100 10" preserveAspectRatio="none">
            <polyline points="0,5 20,1 40,9 60,2 80,8 100,3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      );
    }
    if (element === "Air") {
      return (
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none overflow-hidden z-20">
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-blue-500/20 to-transparent" />
          <div className="absolute bottom-2 left-3 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping opacity-60" />
          <div className="absolute bottom-4 right-4 w-2 h-2 bg-sky-300 rounded-full animate-bounce" />
          <svg className="absolute bottom-0 left-0 w-full h-8 text-blue-500/40" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,10 Q25,3 50,7 T100,5 L100,10 Z" fill="currentColor" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-full h-5 text-sky-400/60" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0,10 Q25,5 50,8 T100,6 L100,10 Z" fill="currentColor" />
          </svg>
        </div>
      );
    }
    if (element === "Tanah") {
      return (
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none overflow-hidden z-20">
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-emerald-500/20 to-transparent" />
          <Trees className="absolute bottom-2 left-2 w-5 h-5 text-emerald-400 opacity-60" />
          <div className="absolute bottom-3 right-3 w-4 h-6 bg-emerald-400/20 rounded border border-emerald-400/40 animate-pulse transform rotate-12" />
        </div>
      );
    }
    if (element === "Angin") {
      return (
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none overflow-hidden z-20">
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-teal-500/20 to-transparent" />
          <Wind className="absolute bottom-2 left-2 w-5 h-5 text-teal-400 opacity-60 animate-pulse" />
          <Wind className="absolute bottom-3 right-2 w-4 h-4 text-cyan-400 opacity-50" />
        </div>
      );
    }
    return null;
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowX, setGlowX] = useState(50);
  const [glowY, setGlowY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Smooth responsive tilt angle (-12 to 12 degrees)
    const rX = ((mouseY / height) - 0.5) * -12;
    const rY = ((mouseX / width) - 0.5) * 12;
    
    // Spot highlight coords
    const gX = (mouseX / width) * 100;
    const gY = (mouseY / height) * 100;

    setRotateX(rX);
    setRotateY(rY);
    setGlowX(gX);
    setGlowY(gY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative rounded-3xl border-4 ${rarityConfig.border} ${rarityConfig.glow} bg-slate-950 text-slate-100 flex flex-col overflow-hidden cursor-pointer ${sizeConfig} select-none pb-7`}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${size === "sm" ? 1.025 : 1.05}) translateY(-5px)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px)",
        boxShadow: isHovered
          ? `0 25px 50px -12px rgba(0,0,0,0.85), 0 0 35px ${elementConfig.glowColor}, 0 0 20px rgba(255, 255, 255, 0.15)`
          : `0 10px 30px -10px rgba(0,0,0,0.7), 0 0 20px ${elementConfig.glowColor}`,
        transition: isHovered 
          ? "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s ease" 
          : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease"
      }}
    >
      {/* Holographic Dynamic Glow/Shine overlay on hover */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none z-30 opacity-45 mix-blend-color-dodge transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 55%), radial-gradient(circle at ${100 - glowX}% ${100 - glowY}%, rgba(0, 0, 0, 0.25) 0%, transparent 70%)`
          }}
        />
      )}
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${elementConfig.gradient} opacity-95 z-0`} />

      {/* Rarity sparkles backdrop */}
      {rarity === "Mythic" && (
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-purple-500/5 to-cyan-500/10 animate-pulse z-0 pointer-events-none" />
      )}
      {rarity === "Legend" && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent z-0 pointer-events-none" />
      )}

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full gap-3.5">
        
        {/* Card Header matching exactly screenshot 2 */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col">
            <h3 className="font-extrabold text-slate-100 text-xl tracking-tight leading-tight line-clamp-1 uppercase">
              {name}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider lowercase">
              domestik
            </span>
          </div>

          <span className={`px-3 py-1 text-[10px] rounded-full border ${rarityConfig.badge} uppercase tracking-widest font-black font-mono shadow-md`}>
            {rarity}
          </span>
        </div>

        {/* Card Portrait Art with element sticker overlay */}
        <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900 shadow-inner group">
          <img
            src={imageUrl}
            alt={name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Style watermark in bottom left corner of art */}
          <span className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-xs border border-slate-800 text-[8px] font-mono font-bold tracking-widest px-2 py-0.5 rounded text-slate-300">
            {style === "Sentinel" ? "SENTINEL" : "SCOURGE"}
          </span>

          {/* Elemental Circle Indicator in top right corner of artwork frame */}
          <div className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-slate-950/80 backdrop-blur-xs border border-white/50 flex items-center justify-center shadow-lg">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800 border ${elementConfig.borderColor}`}>
              {elementConfig.circleIcon}
            </div>
          </div>

          {/* Level & Energy Overlay Badge with Sparkles for premium cards */}
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-slate-950/90 backdrop-blur-xs border border-teal-500/50 rounded-lg shadow-md flex items-center gap-1.5 z-20">
            <span className="text-[9px] font-mono font-black text-teal-400 tracking-wider">
              LV.{card.level || 1}
            </span>
            <div className="h-2.5 w-px bg-slate-700" />
            <div className="flex items-center gap-0.5 text-amber-400 text-[9px] font-mono font-extrabold">
              <Zap className="w-2.5 h-2.5 fill-amber-400" />
              <span>{card.energy ?? 5}/{card.maxEnergy || 5}</span>
            </div>
            {(rarity === "Legend" || rarity === "Mythic" || rarity === "Epic") && (
              <Sparkles className="w-2.5 h-2.5 text-yellow-400 animate-pulse" />
            )}
          </div>
        </div>

        {/* HUD Stats & Elemental summary matching screen 2 */}
        <div className="bg-slate-900/60 backdrop-blur-xs border border-slate-800/80 rounded-2xl p-3 flex flex-col gap-2.5">
          
          {/* Label Row */}
          <div className="flex justify-between items-center text-[10px] font-mono tracking-wider uppercase">
            <span className="text-slate-400 font-bold">{elementConfig.label}</span>
            <span className="text-yellow-400 font-extrabold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-400" />
              95% AI
            </span>
          </div>

          {/* Stats pills: ATK, DEF, SPD */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg py-1 px-1.5 flex flex-col justify-center items-center">
              <span className="text-amber-500 text-[9px] font-black tracking-wide">ATK</span>
              <span className="text-white font-extrabold text-sm mt-0.5">{atk}</span>
            </div>
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg py-1 px-1.5 flex flex-col justify-center items-center">
              <span className="text-blue-400 text-[9px] font-black tracking-wide">DEF</span>
              <span className="text-white font-extrabold text-sm mt-0.5">{def}</span>
            </div>
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg py-1 px-1.5 flex flex-col justify-center items-center">
              <span className="text-pink-400 text-[9px] font-black tracking-wide">SPD</span>
              <span className="text-white font-extrabold text-sm mt-0.5">{spd}</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="flex flex-col gap-0.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/30">
            <div className="flex justify-between items-center text-[8px] font-mono text-slate-400">
              <span className="font-bold text-teal-400">EXP GAUGE</span>
              <span>{card.xp || 0} / {card.level ? card.level * 100 : 100} XP</span>
            </div>
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((card.xp || 0) / (card.level ? card.level * 100 : 100)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Energy Gauge */}
          <div className="flex flex-col gap-1 bg-slate-950/60 p-1.5 rounded-lg border border-amber-500/30">
            <div className="flex justify-between items-center text-[8px] font-mono">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                ENERGY GAUGE
              </span>
              <span className="font-black text-amber-300">{card.energy ?? 5} / {card.maxEnergy || 5}</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(card.maxEnergy || 5)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-xs border transition-all duration-300 ${
                    i < (card.energy ?? 5)
                      ? "bg-amber-400 border-yellow-300 shadow-[0_0_5px_rgba(251,191,36,0.6)]"
                      : "bg-slate-900 border-slate-800 opacity-40"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Skill description summary */}
          <p className="text-[10px] text-slate-300 leading-normal font-mono">
            Berhasil ditempa dengan Faksi {style === "Sentinel" ? "Sentinel" : "Scourge"} dan menguasai elemen {element === "Petir" ? "Thunder" : element === "Api" ? "Fire" : element === "Air" ? "Water" : element === "Tanah" ? "Earth" : "Wind"}!
          </p>

          {/* Skill name & detail subtitle */}
          <div className="border-t border-slate-800/60 pt-2 flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
              <span className="text-[10px] font-extrabold text-yellow-400 uppercase tracking-wider line-clamp-1">
                SKILL: {skillName}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 italic leading-snug line-clamp-1">
              {skillDesc}
            </p>
          </div>

        </div>

      </div>

      {/* Decorative Elemental bottom flare overlay */}
      {renderElementalDecals()}
    </motion.div>
  );
};
