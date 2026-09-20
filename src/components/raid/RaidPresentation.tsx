import React, { memo, useEffect, useRef, useState } from 'react';
import type { RaidLobbyRoom } from '../../types';
import { raidPressure, raidVisualDelta } from './raidVisuals';
import './raidPresentation.css';
import { CinematicAccent } from '../feedback/CinematicAccent';
import { bossArtwork } from './bossArtwork';
import { audio } from '../../lib/audio';
import { raidFeedbackSound } from './raidVisuals';

export type RaidCue = NonNullable<ReturnType<typeof raidVisualDelta>> & { serial: number };

export function useRaidPresentation(room: RaidLobbyRoom) {
  const stageRef = useRef<HTMLDivElement>(null);
  const previous = useRef(room);
  const serial = useRef(0);
  const lastStatus = useRef({ id: room.id, status: room.status });
  const entered = useRef<string | null>(null);
  useEffect(() => {
    if (room.status === "in_battle" && entered.current !== room.id && !document.hidden) {
      entered.current = room.id;
      audio.playFeedback("raid-enter");
    }
    if (lastStatus.current.id === room.id && lastStatus.current.status === "in_battle" && room.status === "defeat") audio.playFeedback("defeat");
    lastStatus.current = { id: room.id, status: room.status };
  }, [room.id, room.status]);
  const [cue, setCue] = useState<RaidCue | null>(null);
  const [active, setActive] = useState(!document.hidden);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    let visible = true;
    const update = () => {
      const next = visible && !document.hidden;
      setActive(next);
      if (!next) setCue(null);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    if (stageRef.current) observer.observe(stageRef.current);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(media.matches);
    media.addEventListener('change', motion);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', motion);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  useEffect(() => {
    const delta = raidVisualDelta(previous.current, room);
    previous.current = room;
    if (delta && active && !document.hidden) {
      setCue({ ...delta, serial: ++serial.current });
      audio.playFeedback(raidFeedbackSound(delta));
    }
  }, [room, active]);
  useEffect(() => {
    if (!cue) return;
    const timer = window.setTimeout(() => setCue(null), 1400);
    return () => clearTimeout(timer);
  }, [cue]);
  return { stageRef, cue, active, reduced, pressure: raidPressure(room) };
}

const motes = Array.from({ length: 8 }, (_, i) => ({
  left: `${8 + i * 12}%`, top: `${26 + i % 3 * 23}%`,
  animationDelay: `${-i * 2.4}s`, animationDuration: `${13 + i % 3 * 3}s`,
}));
export const RaidEnvironment = memo(function RaidEnvironment() {
  return <div className="raid-environment" aria-hidden="true">
    <div className="raid-sky" /><div className="raid-horizon" /><div className="raid-orbit" />
    {motes.map((style, i) => <i key={i} className="raid-mote" style={style} />)}
  </div>;
});

export function RaidBossPortrait({ room, cue, reduced, active }: {
  room: RaidLobbyRoom; cue: RaidCue | null; reduced: boolean; active: boolean;
}) {
  const portrait = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cue || reduced || !active || !portrait.current) return;
    const frames = cue.defeated
      ? [{ transform: 'translateY(0) scale(1)', opacity: 1 }, { transform: 'translateY(14px) scale(.97)', opacity: .45 }]
      : [
          { transform: 'translate(0,0) scale(1)' },
          { transform: cue.bossDelta > 0 ? 'translate(-3px,0) scale(.985)' : 'translate(0,0)', offset: .18 },
          { transform: 'translate(0,0) scale(1)', offset: .36 },
          { transform: cue.bossAttack ? 'translate(0,5px) scale(1.025)' : 'translate(0,0)', offset: .62 },
          { transform: 'translate(0,0) scale(1)' },
        ];
    const animation = portrait.current.animate(frames, { duration: cue.defeated ? 580 : 720, easing: 'ease-out' });
    return () => animation.cancel();
  }, [cue, reduced, active]);
  return <div className="raid-portrait-entry">
    {cue?.defeated && active && !reduced && <CinematicAccent kind="victory" />}
    <div className="raid-portrait-idle">
      <div ref={portrait} className="raid-portrait" data-defeated={room.status === 'victory'}>
        <img src={bossArtwork(room.bossSnapshot.imageUrl)} alt={room.bossSnapshot.name} referrerPolicy="no-referrer" decoding="async" onError={event => {
          const image = event.currentTarget;
          if (image.getAttribute("src") !== room.bossSnapshot.imageUrl) image.src = room.bossSnapshot.imageUrl;
        }} />
        <div className="raid-art-shade" aria-hidden="true" />
        <span className="raid-art-caption">RAID BOSS • LV. {room.bossSnapshot.level}</span>
        {cue && cue.bossDelta > 0 && <div key={cue.serial} className="raid-boss-impact" aria-hidden="true"><i /><b /></div>}
      </div>
    </div>
    {cue && cue.bossDelta !== 0 && <span key={cue.serial} className={`raid-damage ${cue.bossDelta < 0 ? 'raid-heal' : ''}`} aria-hidden="true">
      <small>Δ HP • NET</small>
      {cue.bossDelta > 0 ? '−' : '+'}{Math.abs(cue.bossDelta).toLocaleString()} HP
    </span>}
  </div>;
}

export function RaidTurnFeedback({ room, cue, language }: { room: RaidLobbyRoom; cue: RaidCue | null; language: 'id' | 'en' }) {
  const pressure = raidPressure(room);
  const skill = room.bossSnapshot.skills?.find(skill => skill.name === cue?.skill);
  return <div className="raid-event-track" aria-live="polite" aria-atomic="true">
    {cue?.bossAttack ? <div key={cue.serial} className={`raid-telegraph ${cue.bossCritical ? 'raid-critical' : ''}`}>
      <span>{language === 'id' ? 'HASIL SERANGAN BOSS' : 'BOSS ATTACK RESULT'}{cue.bossCritical ? ' • CRITICAL' : ''}</span>
      <strong>{language === 'en' ? skill?.nameEn || cue.skill || 'Counterattack' : cue.skill || 'Serangan balik'}</strong>
    </div> : <span className="raid-encounter-label">{room.status === 'victory' ? (language === 'id' ? 'BOSS TUMBANG' : 'BOSS DEFEATED') : 'RAID ENCOUNTER'}</span>}
    {cue && <div className="text-xs leading-relaxed text-slate-200">
      <p>{language === 'id' ? 'Δ HP = perubahan HP bersih sejak pembaruan terakhir, bukan damage satu hit.' : 'Δ HP = net HP change since the last update, not single-hit damage.'}</p>
      {cue.playerFeedback.map((attack, index) => <p key={index}>
        {attack.actor} • {attack.card || (language === 'id' ? 'Serangan' : 'Attack')}
        {attack.critical && ' • CRITICAL'}
        {attack.advantage && (language === 'id' ? ' • ↑ UNGGUL ELEMEN' : ' • ↑ ELEMENT ADVANTAGE')}
        {attack.resisted && (language === 'id' ? ' • ◈ DITAHAN ELEMEN' : ' • ◈ ELEMENT RESISTED')}
      </p>)}
    </div>}
    <span className="raid-pressure-label">
      {pressure === 'last' ? (language === 'id' ? 'HP BOSS ≤ 25%' : 'BOSS HP ≤ 25%') : pressure === 'intense' ? 'BOSS HP ≤ 50%' : (language === 'id' ? 'Bersatu menghadapi sang penjaga' : 'Stand together against the guardian')}
    </span>
    {cue?.phase && <span key={`phase-${cue.serial}`} className="text-xs text-amber-300">{language === 'id' ? 'Ambang HP terlewati • perubahan atmosfer saja' : 'HP threshold crossed • atmosphere change only'}</span>}
  </div>;
}

export function RaidSlotFeedback({ cue, index }: { cue: RaidCue | null; index: number }) {
  const delta = cue?.slots[index] || 0;
  if (!cue || !delta) return null;
  return <div key={cue.serial} className={`raid-slot-impact ${delta < 0 ? 'raid-heal' : ''}`} aria-hidden="true">
    <span>Δ HP • NET {delta > 0 ? '−' : '+'}{Math.abs(delta).toLocaleString()}</span>
  </div>;
}
