// Standalone DEV fixture. The actual Territory component runs against synthetic transport only.
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TerritoryControlView } from '../TerritoryControlView';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';
import type { BeaconNode, Card, User } from '../../types';
import '../../index.css';

if (!import.meta.env.DEV) throw new Error('Development-only visual fixture.');
const nativeMatchMedia = window.matchMedia.bind(window);
if (new URLSearchParams(location.search).has('reduced')) window.matchMedia = query => {
  const media = nativeMatchMedia(query);
  if (query.includes('prefers-reduced-motion')) Object.defineProperty(media, 'matches', { value: true });
  return media;
};
const user: User = { id: 'visual-player', username: 'Luna', email: 'fixture@example.invalid', points: 100, cores: 0, faction: 'Sentinel' };
const cards: Card[] = ['Air', 'Api', 'Angin', 'Petir'].map((element, i) => ({
  id: `visual-card-${i}`, userId: user.id, captureId: 'fixture', name: ['Moonlit Anchor', 'Ember Vanguard', 'Wind Sentinel', 'Storm Guardian'][i],
  element: element as Card['element'], style: 'Sentinel', rarity: 'Mythic', hp: 900, atk: 200, def: 180, spd: 100, level: 8, energy: 5,
  skillName: 'Elemental Strike', skillDesc: 'Visual fixture', geminiUsed: false, imageUrl: `/images/bosses/boss_cat_${element.toLowerCase()}.jpg`, createdAt: '2026-01-01',
}));
// Match the existing server map's actual names and visual coordinates, without importing backend code.
const names = ['Sentinel Prime Bastion Alpha', 'PIK Coastal Sanctuary', 'Tangerang Crystal Ridge', 'Serpong Volt Substation', 'Cengkareng Aero Relay', 'Bintaro Eco Sanctum', 'Ancol Ocean Spire', 'Sudirman Megatower Hub', 'Monas Central Energy Nexus', 'Senayan Biosphere Nexus', 'Depok Verdant Spire', 'Kelapa Gading Ember Core', 'Pulomas Solar Spire', 'Cakung Steel Nexus', 'TMII Heritage Bastion', 'Cibubur Flame Sanctuary', 'Vanguard Stronghold Prime'];
const positions = [[8,50],[20,18],[20,50],[20,82],[34,34],[34,68],[48,16],[44,36],[50,52],[44,68],[48,86],[66,20],[66,40],[64,56],[64,78],[78,72],[92,50]];
function initial(scenario = 'Neutral HQ'): BeaconNode[] {
  return names.map((name, i) => {
    const hq = i === 0 || i === 16;
    const own = scenario !== 'All neutral' && ((i === 0 && scenario !== 'Neutral HQ') || i === 4 || i === 8);
    const enemy = scenario !== 'All neutral' && (i === 16 || i === 10 || i === 15);
    return {
      id: `visual-node-${i}`, name, nameEn: name, element: cards[i % cards.length].element,
      x: positions[i][0], y: positions[i][1],
      lat: 0, lng: 0, connectedNodeIds: hq ? ['visual-node-10', 'visual-node-1', 'visual-node-0'] : ['visual-node-0', `visual-node-${Math.min(16, i + 1)}`],
      isBase: hq, baseFaction: i === 0 ? 'Sentinel' : i === 16 ? 'Vanguard' : null,
      ownerId: own ? user.id : enemy ? 'enemy' : null, ownerName: own ? 'Luna' : enemy ? 'Akira' : null, ownerFaction: own ? 'Sentinel' : enemy ? 'Vanguard' : null,
      anchorCard: own ? cards[3] : enemy ? cards[1] : null, garrisonDeck: [], capturedAt: null, lastClaimedAt: null,
      accumulatedCores: 0, isActive: true, defenseHp: 250, maxDefenseHp: 250, tier: hq ? 3 : i % 3 === 0 ? 2 : 1,
      descriptionId: 'Wilayah pratinjau visual. Tidak ada data pemain atau hadiah sungguhan.', descriptionEn: 'Visual preview territory. No real player data or rewards.',
    };
  });
}
let nodes = initial();
let held = true;
let pending: { complete: () => void; reject: () => void } | undefined;
let reportRequest = (_text: string) => {};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = String(input);
  if (!url.startsWith('/api/')) return nativeFetch(input, init);
  if (url === '/api/territory/nodes') return Promise.resolve(respond({ success: true, nodes, playerFaction: user.faction, playerUnclaimedCores: 0, playerNodesCount: nodes.filter(n => n.ownerId === user.id).length }));
  if (url === '/api/territory/capture' || url === '/api/territory/battle') {
    const payload = JSON.parse(String(init?.body || '{}'));
    reportRequest(`PENDING ${url} • ${payload.nodeId}`);
    return new Promise<Response>(resolve => {
      pending = {
        complete() {
          const node = nodes.find(n => n.id === payload.nodeId)!;
          if (url.endsWith('/capture')) {
            Object.assign(node, { ownerId: user.id, ownerName: user.username, ownerFaction: user.faction, anchorCard: cards.find(c => c.id === payload.anchorCardId), capturedAt: new Date().toISOString(), cooldownUntil: new Date(Date.now() + 3600000).toISOString() });
            resolve(respond({ success: true, node, nodes, message: 'Preview capture confirmed.' }));
          } else {
            // Two acknowledgments exercise partial defense progress then neutral breach.
            const breached = node.defenseHp <= 100;
            if (breached) Object.assign(node, { ownerId: null, ownerName: null, ownerFaction: null, anchorCard: null, defenseHp: 250 });
            else node.defenseHp = 100;
            resolve(respond({ success: true, won: true, nodeCaptured: breached, node, defenseHpRemaining: node.defenseHp, turns: [{ turn: 1, attackerCardName: 'Moonlit Anchor', defenderCardName: 'Guardian', damageDealt: 150, elementalBonus: false, messageId: 'Serangan dikonfirmasi.', messageEn: 'Strike confirmed.' }], pointsRewarded: breached ? 60 : 0, coresRewarded: breached ? 2 : 0 }));
          }
          pending = undefined;
          reportRequest(`CONFIRMED ${url} • ${payload.nodeId}`);
        },
        reject() { resolve(respond({ error: 'Preview request rejected. No ownership change.' }, 409)); pending = undefined; reportRequest('REJECTED • no state changed'); },
      };
      if (!held) pending.complete();
    });
  }
  return Promise.resolve(respond({ error: 'This action is not provided by the isolated visual fixture.' }, 400));
};

function Preview() {
  const { setLanguage } = useLanguage();
  const [revision, setRevision] = useState(0);
  const [request, setRequest] = useState('No action pending');
  const [hold, setHold] = useState(true);
  const [visible, setVisible] = useState(true);
  const [profile, setProfile] = useState('No frame sample yet');
  const frame = useRef(0);
  useEffect(() => { reportRequest = setRequest; return () => { reportRequest = () => {}; cancelAnimationFrame(frame.current); }; }, []);
  function reset(scenario: string) {
    pending?.reject(); nodes = initial(scenario); setRevision(n => n + 1); setRequest('No action pending');
  }
  function measure() {
    cancelAnimationFrame(frame.current); setProfile('Sampling 4 seconds…');
    let first = 0, previous = 0;
    const frames: number[] = [];
    const tick = (now: number) => {
      if (!first) first = now;
      if (previous) frames.push(now - previous);
      previous = now;
      if (now - first < 4000) frame.current = requestAnimationFrame(tick);
      else { frames.sort((a,b) => a-b); setProfile(`${frames.length} frames / 4s • median ${frames[Math.floor(frames.length / 2)].toFixed(1)}ms • p95 ${frames[Math.floor(frames.length * .95)].toFixed(1)}ms • >33ms ${frames.filter(n => n > 33.4).length}`); }
    };
    frame.current = requestAnimationFrame(tick);
  }
  return <>
    <nav style={{ position: 'sticky', top: 0, zIndex: 4000, display: 'flex', gap: 10, flexWrap: 'wrap', padding: 10, background: '#111827', color: '#e2e8f0', fontSize: 11 }}>
      <strong>TERRITORY • VISUAL QA • SYNTHETIC DATA</strong>
      {['Neutral HQ', 'Enemy assault', 'All neutral'].map(scenario => <button key={scenario} onClick={() => reset(scenario)}>{scenario}</button>)}
      <button onClick={() => setLanguage('en')}>English</button><button onClick={() => setLanguage('id')}>Indonesia</button>
      <label><input type="checkbox" checked={hold} onChange={e => { held = e.target.checked; setHold(held); }} /> Hold server response</label>
      <button disabled={!request.startsWith('PENDING')} onClick={() => pending?.complete()}>Confirm response</button>
      <button disabled={!request.startsWith('PENDING')} onClick={() => pending?.reject()}>Reject response</button>
      <button onClick={measure}>Measure frames</button>
      <button onClick={() => setVisible(v => !v)}>Toggle visibility</button>
      <a href="/territory-preview.html?reduced=1">Reduced motion</a><a href="/territory-preview.html">Normal motion</a>
      <output aria-label="Request result">{request}</output><output aria-label="Frame sample">{profile}</output>
    </nav>
    <main style={{ padding: 12, maxWidth: 1360, margin: '0 auto', display: visible ? 'block' : 'none' }}><TerritoryControlView key={revision} user={user} cards={cards} token="visual-fixture" onRefreshUser={() => {}} /></main>
  </>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><LanguageProvider><Preview /></LanguageProvider></React.StrictMode>);
if (import.meta.hot) import.meta.hot.dispose(() => { root.unmount(); pending?.reject(); window.fetch = nativeFetch; window.matchMedia = nativeMatchMedia; });
