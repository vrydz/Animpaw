import React, { useEffect, useRef, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { audio } from '../../lib/audio';
import './presentation.css';
import { useVisualPreferences } from './visualPreferences';

// One lifecycle for audio: user activation unlocks it, hidden pages remain silent.
export function FeedbackAudioSession() {
  const visual = useVisualPreferences();
  useEffect(() => {
    document.documentElement.dataset.vfxQuality = visual.quality;
    return () => { delete document.documentElement.dataset.vfxQuality; };
  }, [visual.quality]);
  useEffect(() => {
    const unlock = () => { try { audio.init(); } catch (_) {} };
    const visibility = () => audio.setPageActive(!document.hidden);
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', visibility);
    visibility();
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  return null;
}

export function PresentationScope({ children, className = '', observe = true }: React.PropsWithChildren<{ className?: string; observe?: boolean }>) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(!document.hidden);
  const reduced = !!useReducedMotion();
  useEffect(() => {
    let visible = true;
    const update = () => setActive(visible && !document.hidden);
    const observer = observe ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }) : null;
    if (ref.current) observer?.observe(ref.current);
    document.addEventListener('visibilitychange', update);
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, [observe]);
  return <MotionConfig reducedMotion={reduced || !active ? 'always' : 'never'}>
    <div ref={ref} className={`p1-surface ${className}`} data-reduced={reduced} data-paused={!active}>{children}</div>
  </MotionConfig>;
}
