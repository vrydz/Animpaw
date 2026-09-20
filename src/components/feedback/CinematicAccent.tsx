import React, { useEffect, useRef, useState } from 'react';
import { cinematicAllowed, useVisualPreferences } from './visualPreferences';
import './presentation.css';

// Decorative, finite, local to the artwork. Never delays a callback or intercepts input.
export function CinematicAccent({ kind, ready = true }: { kind: 'rarity' | 'evolution' | 'victory'; ready?: boolean }) {
  const settings = useVisualPreferences();
  const [playing, setPlaying] = useState(false);
  const consumed = useRef(false);
  const host = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ready) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const compact = matchMedia('(max-width: 640px), (pointer: coarse)');
    const allowed = () => cinematicAllowed(settings, reduced.matches, compact.matches, document.hidden);
    const stop = () => { if (!allowed()) setPlaying(false); };
    if (!consumed.current) { consumed.current = true; setPlaying(allowed()); }
    stop();
    const timer = setTimeout(() => setPlaying(false), 1200);
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) setPlaying(false); });
    if (host.current) observer.observe(host.current);
    document.addEventListener('visibilitychange', stop);
    reduced.addEventListener('change', stop);
    compact.addEventListener('change', stop);
    return () => { clearTimeout(timer); observer.disconnect(); document.removeEventListener('visibilitychange', stop); reduced.removeEventListener('change', stop); compact.removeEventListener('change', stop); };
  }, [ready, settings]);
  return <span ref={host} className="cinematic-host" aria-hidden="true">{playing && <span className="cinematic-accent" data-kind={kind}>
    <i /><i /><i /><i /><b />
  </span>}</span>;
}
