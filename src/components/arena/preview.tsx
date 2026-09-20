// Isolated development fixture. Never imported by the game or production entry.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArenaView } from '../ArenaView';
import { LanguageProvider } from '../../context/LanguageContext';
import { BattleAtmosphere, BattleCardMotion } from './BattleAtmosphere';
import type { Card } from '../../types';
import '../../index.css';

if (!import.meta.env.DEV) throw new Error('Visual fixture is development-only.');
// Deterministic accessibility scenario, confined to this development document.
const nativeMatchMedia = window.matchMedia.bind(window);
if (new URLSearchParams(location.search).has('reduced')) {
  window.matchMedia = query => {
    const result = nativeMatchMedia(query);
    if (query.includes('prefers-reduced-motion')) Object.defineProperty(result, 'matches', { value: true });
    return result;
  };
}
const cards: Card[] = ['Air', 'Api'].map((element, i) => ({
  id: 'visual-' + i, userId: 'preview', captureId: 'fixture', name: i ? 'Ember Sovereign' : 'Moonlit Guardian',
  element: element as Card['element'], style: i ? 'Vanguard' : 'Sentinel', rarity: 'Mythic',
  hp: 900, atk: 200, def: 180, spd: 100, level: 8, energy: 5,
  skillName: 'Elemental Strike', skillDesc: 'Visual fixture', geminiUsed: false,
  imageUrl: '/images/bosses/boss_cat_' + element.toLowerCase() + '.jpg', createdAt: '2026-01-01',
}));
let socket: PreviewSocket;
let hp = [900, 900], round = 1;
let logs: string[] = [];
function resolved(defend = false) {
  logs.push(`--- ROUND ${round} RESOLUTION ---`,
    `[AKSI] Luna's ${cards[0].name} ${defend ? 'mengambil sikap Bertahan dan mengumpulkan energi 🛡️.' : 'melancarkan serangan Cakar Cepat 🐾.'}`,
    `[AKSI] Akira's ${cards[1].name} melancarkan serangan Cakar Cepat 🐾.`);
  if (!defend) logs.push(`🔥 UNGGUL ELEMEN! Elemen Air milik ${cards[0].name} sangat efektif melawan Api (+30% PWR)!`);
  hp = [Math.max(1, hp[0] - (defend ? 30 : 90)), Math.max(1, hp[1] - (defend ? 0 : 120))];
  round++; emit();
}
class PreviewSocket {
  static OPEN = 1;
  readyState = 1;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  constructor() { socket = this; setTimeout(() => { this.onopen?.(); emit(); }, 100); }
  send() {}
  close() {}
}
function emit() {
  socket?.onmessage?.({ data: JSON.stringify({
    type: 'battle_state', battleId: 'visual', role: 'playerA', round,
    status: hp.some(n => n <= 0) ? 'ended' : 'active',
    winnerId: hp[1] <= 0 ? 'preview' : hp[0] <= 0 ? 'opponent' : null,
    me: { username: 'Luna', hp: hp[0], maxHp: 900, energy: 60, hasSubmitted: false, card: cards[0] },
    opponent: { username: 'Akira', hp: hp[1], maxHp: 900, energy: 45, hasSubmitted: false, card: cards[1] },
    logs,
  }) });
}
// Only this standalone preview substitutes transport. Production Arena is unchanged.
const nativeWebSocket = window.WebSocket;
window.WebSocket = PreviewSocket as unknown as typeof WebSocket;
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => String(input).startsWith('/api/')
  ? Promise.resolve(new Response(JSON.stringify({ success: true, history: [] }), { headers: { 'Content-Type': 'application/json' } }))
  : nativeFetch(input, init);

function Preview() {
  const [status, setStatus] = useState<'critical' | 'buff' | 'debuff'>();
  const [profile, setProfile] = useState('Frame sample not started');
  const [visible, setVisible] = useState(true);
  function sample() {
    setProfile('Sampling 3 seconds…');
    const frames: number[] = [];
    let first = 0, previous = 0;
    const tick = (now: number) => {
      if (!first) first = now;
      if (previous) frames.push(now - previous);
      previous = now;
      if (now - first < 3000) requestAnimationFrame(tick);
      else { frames.sort((a,b) => a-b); setProfile(`${frames.length} frames / 3s • median ${frames[Math.floor(frames.length/2)].toFixed(1)}ms • p95 ${frames[Math.floor(frames.length*.95)].toFixed(1)}ms`); }
    };
    requestAnimationFrame(tick);
  }
  return <main style={{ maxWidth: 850, margin: '0 auto', color: '#d7e1ef' }}>
    <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 16, fontSize: 12 }}>
      <strong>ARENA • VISUAL QA</strong>
      <a href="/arena-preview.html?reduced=1">Reduced motion preview</a>
      <button onClick={() => resolved()}>Attack / impact</button>
      <button onClick={() => resolved(true)}>Defend confirmed</button>
      <button onClick={() => emit()}>Repeat snapshot</button>
      <button onClick={() => { hp = [850, 680]; round++; emit(); }}>Heal</button>
      <button onClick={() => { hp = [850, 0]; round++; emit(); socket.onmessage?.({ data: JSON.stringify({ type: 'battle_rewards', pointsGained: 25, xpGained: 120, leveledUp: false }) }); }}>Victory</button>
      <button onClick={() => { hp = [0, 680]; round++; emit(); }}>Defeat</button>
      <button onClick={() => { hp = [900,900]; round=1; location.reload(); }}>Reset</button>
      <button onClick={sample}>Measure frames</button>
      <button onClick={() => setVisible(v => !v)}>Toggle visibility</button>
      <output>{profile}</output>
    </nav>
    <section style={{ display: visible ? 'flex' : 'none', minHeight: 720 }}><LanguageProvider><ArenaView cards={cards} token="visual-fixture" userId="preview" /></LanguageProvider></section>
    <aside style={{ padding: 16 }}>
      <p>Optional event visuals (not currently emitted by PvP):</p>
      {(['critical','buff','debuff'] as const).map(s => <button style={{ margin: 12 }} key={s} onClick={() => setStatus(s)}>{s}</button>)}
      <BattleAtmosphere><BattleCardMotion hp={900} side="left" status={status} className="relative rounded-xl overflow-hidden" ><img width="180" src={cards[0].imageUrl} alt="Optional status effect preview" /></BattleCardMotion></BattleAtmosphere>
    </aside>
  </main>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<Preview />);
if (import.meta.hot) import.meta.hot.dispose(() => {
  root.unmount();
  window.fetch = nativeFetch;
  window.WebSocket = nativeWebSocket;
  window.matchMedia = nativeMatchMedia;
});
