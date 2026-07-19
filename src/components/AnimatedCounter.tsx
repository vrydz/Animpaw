import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

interface AnimatedCounterProps {
  value: number;
  className?: string;
  suffix?: string;
}

export function AnimatedCounter({ value, className = "", suffix = "" }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const start = displayValue;
    const end = value;
    if (start === end) return;

    // Trigger scale pop animation when value changes
    setIsAnimating(true);
    const popTimer = setTimeout(() => setIsAnimating(false), 300);

    const duration = 1000; // 1 second duration
    const startTime = performance.now();
    let animationFrameId: number;

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutQuad easing
      const ease = progress * (2 - progress);
      const current = Math.floor(start + (end - start) * ease);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);
    prevValueRef.current = value;

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(popTimer);
    };
  }, [value]);

  return (
    <motion.span
      animate={isAnimating ? { scale: [1, 1.2, 1], y: [0, -2, 0] } : { scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`inline-block ${className}`}
    >
      {displayValue}
      {suffix && <span className="ml-1 text-[9px] sm:text-[10px] opacity-75">{suffix}</span>}
    </motion.span>
  );
}
