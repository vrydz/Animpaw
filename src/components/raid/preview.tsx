// Standalone development document only. No real accounts, API requests, or rewards.
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RaidBattleArena } from '../RaidBattleArena';
import type { Card, RaidLobbyRoom } from '../../types';
import '../../index.css';

if (!import.meta.env.DEV) throw new Error('Visual fixture is development-only.');
const nativeMatchMedia = window.matchMedia.bind(window);
// Exercise the component's accessibility switch; OS media-query QA is separate.
if (new URLSearchParams(location.search).has('reduced')) {
  window.matchMedia = query => {
    const media = nativeMatchMedia(query);
    if (query.includes('prefers-reduced-motion')) Object.defineProperty(media, 'matches', { value: true });
    return media;
  };
}
const cards: Card[] = ['Air', 'Api', 'Angin'].map((element, index) => ({
  id: `visual-${index}`, userId: 'preview', captureId: 'fixture', name: ['Moonlit Guardian', 'Ember Vanguard', 'Wind Sentinel'][index],
  element: element as Card['element'], style: 'Sentinel', rarity: 'Mythic', hp: 900, atk: 200, def: 180, spd: 100, level: 8, energy: 5,
  skillName: 'Elemental Strike', skillDesc: 'Visual fixture', geminiUsed: false,
  imageUrl: `/images/bosses/boss_cat_${element.toLowerCase()}.jpg`, createdAt: '2026-01-01',
}));
function initial(): RaidLobbyRoom {
  return {
    id: 'visual-raid', roomCode: 'VISUAL', bossId: 'visual-boss', hostUserId: '', hostUsername: 'Preview', isSinglePlayer: true,
    status: 'in_battle', currentTurn: 1, bossCurrentHp: 12000, bossMaxHp: 12000, battleLogs: [], createdAt: '', updatedAt: '',
    slots: cards.map((card, slotIndex) => ({ slotIndex, userId: 'preview', username: ['Luna', 'Akira', 'Sora'][slotIndex], card, currentHp: 900, maxHp: 900, isReady: true, damageDealt: 0 })),
    bossSnapshot: {
      id: 'visual-boss', name: 'Raijin, Penjaga Badai', nameEn: 'Raijin, Storm Sovereign', title: 'Penjaga', titleEn: 'Guardian',
      speciesType: 'kucing', level: 20, element: 'Api', buffElement: 'Angin', debuffElement: 'Air',
      buffDescription: '', buffDescriptionEn: '', debuffDescription: '', debuffDescriptionEn: '',
      hp: 12000, maxHp: 12000, atk: 300, def: 150, spd: 100, imageUrl: '/images/bosses/boss_cat_api.jpg', locationName: 'Crimson Sanctuary',
      latitude: 0, longitude: 0, spawnRadiusKm: 10, skills: [
        { name: 'Gelombang Bara', nameEn: 'Ember Tempest', description: '', descriptionEn: '', element: 'Api', powerMultiplier: 1, effectType: 'aoe' },
        { name: 'Cakar Penghakiman', nameEn: 'Judgment Claw', description: '', descriptionEn: '', element: 'Api', powerMultiplier: 1, effectType: 'critical' },
      ], rewards: { cores: 12, points: 80, energyRefill: 2, cardXp: 150 }, isActive: true, expiresAt: '', createdAt: '',
    },
  };
}
let snapshot = initial();
function advance(kind = 'Attack') {
  const next = structuredClone(snapshot);
  const turn = next.currentTurn++;
  const oldHp = next.bossCurrentHp;
  next.bossCurrentHp = kind === 'Phase' ? 5700 : kind === 'Low HP' ? 2400 : kind === 'Victory' ? 0 : kind === 'Heal' ? Math.min(12000, oldHp + 650) : Math.max(1, oldHp - 420);
  const skill = next.bossSnapshot.skills[kind === 'Critical' ? 1 : 0];
  next.battleLogs.push({ turn, actor: 'Luna', actorType: 'player', damage: Math.max(0, oldHp - next.bossCurrentHp), isCritical: kind === 'Critical', messageId: `Tim menyerang pada ronde ${turn}.`, messageEn: `Team attacks on round ${turn}.`, timestamp: `${turn}` });
  next.slots.forEach((slot, index) => {
    if (!slot) return;
    slot.damageDealt += 140;
    if (kind === 'Victory' || kind === 'Heal') return;
    if (kind === 'Defeat') slot.currentHp = 0;
    else if (index === 0 || kind === 'AOE') slot.currentHp = Math.max(1, slot.currentHp - 90);
  });
  if (kind !== 'Victory' && kind !== 'Heal') next.battleLogs.push({ turn, actor: next.bossSnapshot.name, actorType: 'boss', damage: 90, skillName: skill.name, messageId: `Boss menggunakan ${skill.name}.`, messageEn: `Boss uses ${skill.nameEn}.`, timestamp: `${turn}` });
  if (kind === 'Victory') next.status = 'victory';
  if (kind === 'Defeat') next.status = 'defeat';
  snapshot = next;
}
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (!String(input).startsWith('/api/')) return nativeFetch(input, init);
  if (String(input).endsWith('/turn')) advance();
  return Promise.resolve(new Response(JSON.stringify({ room: snapshot, victory: snapshot.status === 'victory', defeated: snapshot.status === 'defeat', sharedRewards: snapshot.bossSnapshot.rewards }), { headers: { 'Content-Type': 'application/json' } }));
};

function Preview() {
  const [revision, setRevision] = useState(0);
  const [visible, setVisible] = useState(true);
  const [profile, setProfile] = useState('No frame sample yet');
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  function measure() {
    cancelAnimationFrame(frame.current);
    setProfile('Sampling 4 seconds…');
    const frames: number[] = [];
    let start = 0, previous = 0, attacked = false;
    const tick = (now: number) => {
      if (!start) start = now;
      if (previous) frames.push(now - previous);
      previous = now;
      if (!attacked && now - start > 800) { advance('Critical'); attacked = true; }
      if (now - start < 4000) frame.current = requestAnimationFrame(tick);
      else {
        frames.sort((a, b) => a - b);
        setProfile(`${frames.length} frames / 4s • median ${frames[Math.floor(frames.length / 2)].toFixed(1)}ms • p95 ${frames[Math.floor(frames.length * .95)].toFixed(1)}ms • >33ms ${frames.filter(ms => ms > 33.4).length}`);
      }
    };
    frame.current = requestAnimationFrame(tick);
  }
  return <>
    <nav className="raid-qa-toolbar" style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 12, color: '#e5e5e5', background: '#171717', fontSize: 12 }}>
      <strong>RAID • VISUAL QA • SYNTHETIC DATA</strong>
      {['Attack', 'Critical', 'AOE', 'Phase', 'Low HP', 'Heal', 'Victory', 'Defeat'].map(kind => <button key={kind} onClick={() => advance(kind)}>{kind}</button>)}
      <button onClick={() => { snapshot = initial(); setRevision(n => n + 1); }}>Reset</button>
      <button onClick={() => setVisible(v => !v)}>Toggle visibility</button>
      <button onClick={measure}>Measure frames</button>
      <a href="/raid-preview.html?reduced=1">Reduced motion</a>
      <a href="/raid-preview.html">Normal motion</a>
      <output aria-live="polite">{profile}</output>
    </nav>
    <div style={{ display: visible ? 'block' : 'none' }}><RaidBattleArena key={revision} initialRoom={snapshot} currentUser={null} token="visual-fixture" currentLanguage="en" onExit={() => { snapshot = initial(); setRevision(n => n + 1); }} /></div>
  </>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><Preview /></React.StrictMode>);
if (import.meta.hot) import.meta.hot.dispose(() => { root.unmount(); window.fetch = nativeFetch; window.matchMedia = nativeMatchMedia; });
