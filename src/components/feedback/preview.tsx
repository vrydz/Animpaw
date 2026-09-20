// Isolated development fixture: no account, API request, or economy mutation.
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CardReveal } from './CardReveal';
import { FeedbackAudioSession, PresentationScope } from './PresentationScope';
import { VisualSettings } from './VisualSettings';
import { ResultFeedback } from './ResultFeedback';
import { NekomonCard } from '../NekomonCard';
import { GalleryView } from '../GalleryView';
import { ForgingStation } from '../ForgingStation';
import { SettingsView } from '../SettingsView';
import { LanguageProvider } from '../../context/LanguageContext';
import { getAnimeNekomonSpeciesArtwork } from '../../data/nekomonSpeciesData';
import type { Card, Capture, User } from '../../types';
import '../../index.css';

if (!import.meta.env.DEV) throw new Error('Presentation fixture is development-only.');
const nativeMedia = window.matchMedia.bind(window);
if (new URLSearchParams(location.search).has('reduced')) window.matchMedia = query => {
  const media = nativeMedia(query);
  if (query.includes('prefers-reduced-motion')) Object.defineProperty(media, 'matches', { value: true });
  return media;
};
const base: Card = {
  id: 'presentation-card', userId: 'fixture', captureId: 'photo', name: 'Crimson Guardian', element: 'Api', style: 'Sentinel', rarity: 'Common',
  hp: 900, atk: 180, def: 150, spd: 100, energy: 5, level: 8, skillName: 'Flame Claw', skillDesc: 'Synthetic visual fixture',
  imageUrl: getAnimeNekomonSpeciesArtwork('Crimson Guardian', 'Api', 'Sentinel', 'Common'), geminiUsed: false, createdAt: '2026-01-01',
};
const player: User = { id: 'fixture', username: 'Preview', email: '', points: 1000, cores: 1000 };
const capture: Capture = { id: 'photo', userId: 'fixture', isForged: false, photoUrl: base.imageUrl, createdAt: '2026-01-01' };
let selectedRarity: Card['rarity'] = 'Mythic';
const resultCard = (): Card => ({ ...base, rarity: selectedRarity, imageUrl: '/images/bosses/boss_cat_api-v2.png' });
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (!String(input).startsWith('/api/')) return nativeFetch(input, init);
  const forge = String(input) === '/api/forge';
  return Promise.resolve(new Response(JSON.stringify(forge ? { card: resultCard(), points: 950, cores: 1000 } : { error: 'Fixture blocks APIs' }), { status: forge ? 200 : 403, headers: { 'Content-Type': 'application/json' } }));
};

function Preview() {
  const [mode, setMode] = useState('Rarity reveal');
  const [rarity, setRarity] = useState<Card['rarity']>('Mythic');
  const [revision, setRevision] = useState(0);
  const [receipts, setReceipts] = useState(0);
  const [sample, setSample] = useState('No frame sample');
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const card = resultCard();
  const measure = () => {
    cancelAnimationFrame(frame.current);
    setSample('Sampling…');
    const frames: number[] = [];
    let start = 0, previous = 0, replayed = false;
    const tick = (now: number) => {
      if (!start) start = now;
      if (previous) frames.push(now - previous);
      previous = now;
      if (!replayed && now - start > 700) { replayed = true; setRevision(n => n + 1); }
      if (now - start < 4000) frame.current = requestAnimationFrame(tick);
      else {
        frames.sort((a, b) => a - b);
        setSample(`${frames.length} frames / 4s • p95 ${frames[Math.floor(frames.length * .95)].toFixed(1)}ms • >33ms ${frames.filter(n => n > 33.4).length}`);
      }
    };
    frame.current = requestAnimationFrame(tick);
  };
  return <LanguageProvider><FeedbackAudioSession />
    <main style={{ color: '#e2e8f0', maxWidth: 1000, margin: 'auto', padding: 16 }}>
      <h1 className="text-lg font-bold mb-3">P1–P3 • SYNTHETIC PRESENTATION QA</h1>
      <nav className="flex flex-wrap gap-3 mb-4 text-sm">
        {['Rarity reveal', 'Evolution', 'Forge flow', 'Collection', 'Audio', 'Reward'].map(name => <button className="border border-slate-600 px-3 py-2 rounded-lg" key={name} onClick={() => { setMode(name); setRevision(n => n + 1); }}>{name}</button>)}
        <label>Preview rarity <select className="bg-slate-800 p-2" value={rarity} onChange={event => { selectedRarity = event.target.value as Card['rarity']; setRarity(selectedRarity); setRevision(n => n + 1); }}>{['Common','Rare','Epic','Legend','Mythic'].map(value => <option key={value}>{value}</option>)}</select></label>
        <button onClick={() => setRevision(n => n + 1)}>Replay result</button>
        <button onClick={measure}>Measure frames</button>
        <a href="/feedback-preview.html?reduced=1">Reduced motion</a><a href="/feedback-preview.html">Normal motion</a>
      </nav>
      <output className="block mb-4">{sample} • Confirmed fixture receipts: {receipts}</output>
      <VisualSettings language="en" />
      {mode === 'Rarity reveal' && <PresentationScope className="max-w-sm mx-auto"><CardReveal key={revision} card={card} language="en"><NekomonCard card={card} size="lg" /></CardReveal></PresentationScope>}
      {mode === 'Evolution' && <PresentationScope><CardReveal key={revision} card={card} previousCard={base} language="en" /></PresentationScope>}
      {mode === 'Forge flow' && <ForgingStation key={revision} captures={[capture]} userPoints={1000} onClose={() => setMode('Rarity reveal')} onForgeSuccess={() => setReceipts(n => n + 1)} />}
      {mode === 'Collection' && <GalleryView key={revision} captures={[]} cards={[base]} user={player} onSelectForge={() => {}} onDestroyCard={async () => ({ success: false })} onDeleteCapture={async () => ({ success: false })} onCancelEvolution={async () => ({ success: false })} onEvolveCard={async () => ({ success: true, card: { ...resultCard(), rarity: 'Rare' }, message: 'Synthetic confirmed result — no account changed.' })} />}
      {mode === 'Audio' && <SettingsView initialSubTab="audio" onInstallPwa={() => {}} isPwaInstalled={false} />}
      {mode === 'Reward' && <PresentationScope><ResultFeedback key={revision} kind="reward">Confirmed reward • 25 points • synthetic fixture</ResultFeedback><ResultFeedback key={'win-' + revision} kind="victory">Confirmed victory • synthetic fixture</ResultFeedback></PresentationScope>}
    </main>
  </LanguageProvider>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><Preview /></React.StrictMode>);
if (import.meta.hot) import.meta.hot.dispose(() => { root.unmount(); window.fetch = nativeFetch; window.matchMedia = nativeMedia; });
