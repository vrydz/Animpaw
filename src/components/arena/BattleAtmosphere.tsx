import React, { memo, useEffect, useRef, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import './battleAtmosphere.css';

const motes = Array.from({ length: 10 }, (_, i) => ({
  left: `${7 + (i * 29) % 88}%`, top: `${12 + (i * 17) % 76}%`,
  animationDelay: `${-i * 1.7}s`, animationDuration: `${12 + i % 4 * 3}s`,
}));
export function BattleAtmosphere({ children, victory = false }: React.PropsWithChildren<{ victory?: boolean }>) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(!document.hidden);
  const reduced = useReducedMotion();
  useEffect(() => {
    let visible = true;
    const update = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return <MotionConfig reducedMotion={reduced || !active ? 'always' : 'never'}>
    <div ref={root} className="arena-scene flex-1 flex flex-col font-sans text-slate-200" data-paused={!active} data-reduced={!!reduced} data-victory={victory}>
      <div className="arena-environment" aria-hidden="true">
        <div className="arena-light" /><div className="arena-horizon" />
        {motes.map((style, i) => <i key={i} className="arena-mote" style={style} />)}
      </div>
      {children}
    </div>
  </MotionConfig>;
}

// Presentation only; HP deltas are confirmed state, never predicted damage.
export const BattleCardMotion = memo(function BattleCardMotion({ children, hp, targetHp, side, className, status }: React.PropsWithChildren<{
  hp: number; targetHp?: number; side: 'left' | 'right'; className?: string;
  status?: 'critical' | 'buff' | 'debuff';
}>) {
  const root = useRef<HTMLDivElement>(null);
  const previous = useRef({ hp, targetHp, status });
  const [cue, setCue] = useState<{ kind: string; label: string; id: number } | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const before = previous.current;
    previous.current = { hp, targetHp, status };
    if (document.hidden) return;
    const damage = before.hp - hp;
    const attacking = targetHp !== undefined && before.targetHp !== undefined && targetHp < before.targetHp;
    const kind = hp <= 0 && before.hp > 0 ? 'defeat' : damage < 0 ? 'heal' : damage > 0 ? 'damage' : status !== before.status ? status : undefined;
    if (kind) setCue({ kind, label: kind === 'heal' ? `+${-damage}` : kind === 'damage' ? `−${damage}` : kind.toUpperCase(), id: Date.now() });
    let animation: Animation | undefined;
    if (!reduced && root.current && (attacking || damage > 0)) {
      const direction = side === 'left' ? 1 : -1;
      animation = root.current.animate([
        { transform: 'translate(0, 0)' },
        { transform: `translate(${direction * (attacking ? 9 : -3)}px, ${attacking ? -3 : 0}px)`, offset: .32 },
        { transform: 'translate(0, 0)' },
      ], { duration: 340, easing: 'cubic-bezier(.2,.7,.3,1)' });
    }
    return () => animation?.cancel();
  }, [hp, targetHp, status, reduced, side]);
  useEffect(() => {
    if (!cue) return;
    const timer = window.setTimeout(() => setCue(null), 950);
    return () => clearTimeout(timer);
  }, [cue]);
  return <div ref={root} className={`arena-card ${className || ''}`} data-side={side} data-defeated={hp <= 0}>
    {children}
    {cue && <div key={cue.id} className={`arena-cue arena-cue--${cue.kind}`} aria-hidden="true"><span>{cue.label}</span></div>}
  </div>;
});
