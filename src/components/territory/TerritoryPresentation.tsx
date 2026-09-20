import React, { memo, useEffect, useRef, useState } from 'react';
import { CircleDashed, Swords, Radio, ShieldCheck, ShieldAlert, Check, Crown, AlertTriangle } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import type { BeaconNode } from '../../types';
import { defenseProgress, ownershipChange, territoryLabels, territoryState, type TerritoryFaction, type TerritoryOutcome, type TerritoryState, type TerritoryVisualEvent } from './territoryVisuals';
import './territoryPresentation.css';

const stateIcons = { neutral: CircleDashed, contested: Swords, capturing: Radio, owned: ShieldCheck, 'enemy-owned': ShieldAlert };

export function useTerritoryFeedback() {
  const [event, setEvent] = useState<TerritoryVisualEvent | null>(null);
  const sequence = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!event || event.outcome === 'pending') return;
    const timer = window.setTimeout(() => setEvent(null), 3800);
    return () => clearTimeout(timer);
  }, [event]);
  return {
    event,
    begin(node: BeaconNode, kind: 'capture' | 'battle') {
      const serial = ++sequence.current;
      setEvent({ serial, nodeId: node.id, kind, outcome: 'pending', before: node });
      return serial;
    },
    finish(serial: number, outcome: TerritoryOutcome, after?: BeaconNode) {
      if (mounted.current) setEvent(previous => previous?.serial === serial ? { ...previous, outcome, after } : previous);
    },
  };
}

export function useTerritoryMotion() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(!document.hidden);
  const reduced = !!useReducedMotion();
  useEffect(() => {
    let visible = true;
    const update = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    if (ref.current) observer.observe(ref.current);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return { ref, active, reduced };
}

export const TerritoryStatus = memo(function TerritoryStatus({ state, language = 'en' }: { state: TerritoryState; language?: 'id' | 'en' }) {
  const Icon = stateIcons[state];
  return <span className="territory-status" data-state={state}><Icon size={12} aria-hidden="true" />{territoryLabels[state][language]}</span>;
});

export const TerritoryLegend = memo(function TerritoryLegend({ language }: { language: 'id' | 'en' }) {
  return <div className="territory-state-legend" aria-label={language === 'id' ? 'Legenda status wilayah' : 'Territory state legend'}>
    {(Object.keys(territoryLabels) as TerritoryState[]).map(state => <TerritoryStatus key={state} state={state} language={language} />)}
  </div>;
});

export const TerritoryMapAtmosphere = memo(function TerritoryMapAtmosphere() {
  return <div className="territory-map-atmosphere" aria-hidden="true"><i /><b /></div>;
});

export const TerritoryBeacon = memo(function TerritoryBeacon({ node, faction, userId, selected, event, children }: React.PropsWithChildren<{
  node: BeaconNode; faction: TerritoryFaction; userId: string; selected: boolean; event: TerritoryVisualEvent | null;
}>) {
  const before = useRef(node);
  const [change, setChange] = useState(0);
  useEffect(() => {
    if (ownershipChange(before.current, node) && !document.hidden) setChange(n => n + 1);
    before.current = node;
  }, [node]);
  const state = territoryState(node, userId, faction, event);
  return <span className="territory-beacon" data-state={state} data-faction={node.ownerId ? node.ownerFaction : 'neutral'} data-selected={selected}>
    <span className="territory-beacon-halo" aria-hidden="true" />
    <span className="territory-beacon-face">{children}</span>
    <span className="territory-beacon-relation" aria-hidden="true">{React.createElement(stateIcons[state], { size: 11 })}</span>
    <span className="territory-beacon-tier">T{node.tier}</span>
    {!!change && <span key={change} className="territory-ownership-wave" aria-hidden="true" />}
  </span>;
});

interface SceneProps {
  node: BeaconNode; faction: TerritoryFaction; userId: string; language: 'id' | 'en';
  event: TerritoryVisualEvent | null; mode?: 'overview' | 'capture' | 'battle'; ready?: boolean; obscured?: boolean;
}
export const TerritoryCaptureScene = memo(function TerritoryCaptureScene({ node, faction, userId, language, event, mode = 'overview', ready = false, obscured = false }: SceneProps) {
  const motion = useTerritoryMotion();
  const localEvent = event?.nodeId === node.id ? event : null;
  // The receipt comes directly from an existing response; it never feeds game state or actions.
  const resolvedNode = localEvent?.after || node;
  const state = territoryState(resolvedNode, userId, faction, localEvent);
  const pending = localEvent?.outcome === 'pending';
  const captured = localEvent?.outcome === 'captured' && resolvedNode.ownerId === userId;
  const breached = localEvent?.outcome === 'breached' && !resolvedNode.ownerId;
  const failed = localEvent?.outcome === 'failed';
  const fraction = defenseProgress(resolvedNode);
  const owned = !!resolvedNode.ownerId;
  const colorFaction = pending ? faction : owned ? resolvedNode.ownerFaction : 'neutral';
  const attackMode = mode === 'battle' || localEvent?.kind === 'battle';
  const steps = attackMode
    ? (language === 'id' ? ['Pasukan', 'Duel', 'Terobos', 'Anchor'] : ['Squad', 'Clash', 'Breach', 'Anchor'])
    : (language === 'id' ? ['Anchor', 'Energi', 'Konfirmasi', 'Dikuasai'] : ['Anchor', 'Energy', 'Confirm', 'Owned']);
  const stage = captured ? 4 : breached ? 3 : pending ? 2 : ready ? 1 : 0;
  const title = captured ? (language === 'id' ? 'WILAYAH DIKUASAI!' : 'TERRITORY SECURED!')
    : breached ? (language === 'id' ? 'PERTAHANAN DITEMBUS' : 'DEFENSE BREACHED')
    : failed ? (language === 'id' ? 'PERMINTAAN GAGAL' : 'REQUEST FAILED')
    : pending ? (state === 'contested' ? (language === 'id' ? 'FAKSI BERTEMPUR' : 'FACTIONS CLASH') : (language === 'id' ? 'MENYALURKAN ENERGI' : 'CHANNELING ENERGY'))
    : language === 'id' ? node.name : node.nameEn || node.name;
  return <div ref={motion.ref} className="territory-capture-scene" data-mode={mode} data-pending={pending} data-state={state} data-faction={colorFaction} data-paused={!motion.active || obscured} data-reduced={motion.reduced} data-success={captured}>
    <div className="territory-scene-light" aria-hidden="true" />
    <div className="territory-scene-top"><TerritoryStatus state={state} language={language} /><span className="territory-faction-label">{owned ? resolvedNode.ownerFaction : pending ? faction : '—'}</span></div>
    <div className="territory-sigil" aria-hidden="true">
      <span className="territory-sigil-orbit" /><span className="territory-sigil-floor" />
      <span className="territory-crystal"><Radio size={25} strokeWidth={1.5} /></span>
      {pending && <div className="territory-energy-particles">{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ '--particle-angle': `${i * 60}deg`, animationDelay: `${-i * .27}s` } as React.CSSProperties} />)}</div>}
      {captured && <span key={localEvent?.serial} className="territory-capture-burst"><Check size={26} /></span>}
    </div>
    <div className="territory-scene-copy" role="status" aria-live="polite" aria-atomic="true">
      <strong>{captured && <Crown size={14} aria-hidden="true" />}{failed && <AlertTriangle size={14} aria-hidden="true" />}{title}</strong>
      <span>{captured ? `${resolvedNode.ownerName || ''} • ${resolvedNode.ownerFaction}`
        : breached ? (language === 'id' ? 'Netral kembali. Pasang Mythic Anchor untuk menguasai.' : 'Now neutral. Deploy a Mythic Anchor to claim ownership.')
        : failed ? (language === 'id' ? 'Tidak ada perubahan kepemilikan yang dikonfirmasi.' : 'No ownership change confirmed.')
        : pending ? (language === 'id' ? 'Menunggu hasil server…' : 'Awaiting server confirmation…')
        : owned ? `${resolvedNode.ownerId === userId ? (language === 'id' ? 'Milikmu' : 'Yours') : resolvedNode.ownerFaction === faction ? (language === 'id' ? 'Sekutu' : 'Ally') : (language === 'id' ? 'Lawan' : 'Opponent')} • ${resolvedNode.ownerName || resolvedNode.ownerFaction}`
        : (language === 'id' ? 'Beacon bebas • Mythic Anchor diperlukan' : 'Unclaimed beacon • Mythic Anchor required')}</span>
    </div>
    {pending ? <div className="territory-progress-track" role="progressbar" aria-label={language === 'id' ? 'Menunggu konfirmasi capture' : 'Awaiting capture confirmation'} aria-valuetext={language === 'id' ? 'Diproses, durasi tidak tersedia' : 'Processing, duration unavailable'}><i className="territory-progress-indeterminate" /></div>
      : (state === 'enemy-owned' || breached) ? <div className="territory-defense-progress">
        <div><span>{language === 'id' ? 'Pertahanan ditembus' : 'Defense breached'}</span><b>{breached ? 100 : fraction}%</b></div>
        <div className="territory-progress-track" role="progressbar" aria-label={language === 'id' ? 'Pertahanan ditembus' : 'Defense breached'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={breached ? 100 : fraction}><i style={{ transform: `scaleX(${(breached ? 100 : fraction) / 100})` }} /></div>
      </div> : captured ? <div className="territory-progress-track" role="progressbar" aria-label={language === 'id' ? 'Kepemilikan dikonfirmasi' : 'Ownership confirmed'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={100}><i className="territory-progress-complete" /></div> : null}
    {(mode !== 'overview' || pending || captured || breached || failed) && <ol className="territory-capture-steps" aria-label={language === 'id' ? 'Tahap capture' : 'Capture stages'}>
      {steps.map((step, index) => <li key={step} data-done={index < stage} aria-current={index === stage - 1 ? 'step' : undefined}><span>{index < stage ? <Check size={10} /> : index + 1}</span>{step}</li>)}
    </ol>}
    {captured && <div key={`victory-${localEvent?.serial}`} className="territory-success-rays" aria-hidden="true" />}
  </div>;
});
