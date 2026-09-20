import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { arenaOutcome, arenaRoundFeedback, type ArenaSnapshot } from './arenaFeedback';
const before: ArenaSnapshot = { battleId: 'b', round: 1, status: 'active', logs: [],
  me: { username: 'A', card: { name: 'Neko', element: 'Api' } },
  opponent: { username: 'B', card: { name: 'Other', element: 'Air' } } };
const after = { ...before, round: 2, logs: ['--- ROUND 1 RESOLUTION ---',
  "[AKSI] A's Neko mengambil sikap Bertahan dan mengumpulkan energi 🛡️.",
  "[AKSI] B's Other mengerahkan Ultimate Skill [Wave] 💥.",
  '🔥 UNGGUL ELEMEN! Elemen Air milik Other sangat efektif melawan Api (+30% PWR)!'] };
test('confirmed defend is not an attack; advantage comes from the log', () => {
  const result = arenaRoundFeedback(before, after)!;
  assert.equal(result.me.action, 'defend');
  assert.equal(result.me.advantage, false);
  assert.equal(result.opponent.action, 'skill');
  assert.equal(result.opponent.advantage, true);
});
test('initial snapshots, duplicate rounds, old rounds and new battles do not replay', () => {
  assert.equal(arenaRoundFeedback(null, after), null);
  assert.equal(arenaRoundFeedback(after, structuredClone(after)), null);
  assert.equal(arenaRoundFeedback(after, before), null);
  assert.equal(arenaRoundFeedback(before, { ...after, battleId: 'new' }), null);
});
test('unknown or ambiguous actions stay neutral and inputs are not mutated', () => {
  const untouched = JSON.stringify(after);
  assert.equal(arenaRoundFeedback(before, { ...after, logs: ['--- ROUND 1 RESOLUTION ---', 'unknown'] })!.me.action, null);
  assert.equal(arenaRoundFeedback(before, { ...after, opponent: after.me })!.me.action, null);
  assert.equal(JSON.stringify(after), untouched);
});
test('same-round final resolution is supported and outcome uses winner identity only', () => {
  assert.ok(arenaRoundFeedback(before, { ...after, round: 1, status: 'ended' }));
  assert.equal(arenaOutcome({ status: 'ended', winnerId: 'A' }, 'A'), 'win');
  assert.equal(arenaOutcome({ status: 'ended', winnerId: 'B' }, 'A'), 'loss');
  assert.equal(arenaOutcome({ status: 'ended' }, 'A'), null);
  assert.equal(arenaOutcome({ status: 'active', winnerId: 'A' }, 'A'), null);
});
test('camera UI only celebrates a confirmed callback and never invents scanner confidence', () => {
  const source = readFileSync(new URL('../VirtualCamera.tsx', import.meta.url), 'utf8');
  assert.ok(source.indexOf('if (!confirmed) return;') < source.indexOf('setShowPointsToast(true)'));
  assert.match(source, /Promise<boolean>/);
  assert.doesNotMatch(source, /PROBABILITY 99%|targetLockConfidence|DIST: ~1.2m|Sinyal Kucing Terdeteksi/);
  assert.match(source, /SIMULASI/);
});
test('capture callback propagates failure and success audio follows HTTP confirmation', () => {
  const source = readFileSync(new URL('../../App.tsx', import.meta.url), 'utf8');
  const capture = source.slice(source.indexOf('  const handleCapture = async'), source.indexOf('  // Delete captured photo'));
  assert.match(capture, /if \(!token\) return false/);
  assert.match(capture, /return true/);
  assert.match(capture, /return false;\s*};/);
  assert.ok(capture.indexOf('if (response.ok)') < capture.indexOf('audio.playCaptureSound()'));
});
test('daily claim only celebrates after confirmation, not on button press', () => {
  const source = readFileSync(new URL('../DailyLoginModal.tsx', import.meta.url), 'utf8');
  const handler = source.slice(source.indexOf('const handleClaimBonus = async'));
  assert.ok(handler.indexOf('if (response.ok)') < handler.indexOf('haptics.victory()'));
  assert.doesNotMatch(handler, /playUnboxingExplosion/);
});
