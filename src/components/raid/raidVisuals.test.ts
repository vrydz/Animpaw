import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { RaidLobbyRoom } from '../../types';
import { raidPressure, raidVisualDelta, raidFeedbackSound } from './raidVisuals';

function room(): RaidLobbyRoom {
  return {
    id: 'raid', currentTurn: 2, bossCurrentHp: 1000, bossMaxHp: 1000, status: 'in_battle', battleLogs: [],
    bossSnapshot: { skills: [{ name: 'Claw', effectType: 'critical' }] },
    slots: [{ userId: 'player', card: { id: 'card' }, currentHp: 500 }],
  } as RaidLobbyRoom;
}

test('raid prioritizes one informative sound per update', () => {
  const before = room();
  const after = { ...before, bossCurrentHp: 600 };
  const cue = raidVisualDelta(before, after)!;
  assert.equal(raidFeedbackSound(cue), 'attack');
  assert.equal(raidFeedbackSound({ ...cue, bossAttack: true }), 'raid-attack');
  assert.equal(raidFeedbackSound({ ...cue, playerCritical: true }), 'critical');
  assert.equal(raidFeedbackSound({ ...cue, phase: true, bossCritical: true }), 'raid-pressure');
  assert.equal(raidFeedbackSound({ ...cue, defeated: true, phase: true }), 'raid-victory');
  assert.equal(raidFeedbackSound({ ...cue, bossDelta: -10 }), 'heal');
});
test('identical polls and old turns never replay impacts', () => {
  const before = room();
  assert.equal(raidVisualDelta(before, structuredClone(before)), null);
  assert.equal(raidVisualDelta(before, { ...before, currentTurn: 1, bossCurrentHp: 600 }), null);
  assert.equal(raidVisualDelta(before, { ...before, id: 'another', bossCurrentHp: 600 }), null);
});
test('confirmed HP deltas, critical skill and capped logs are presentation-only', () => {
  const before = room();
  before.battleLogs = [{ turn: 1, actor: 'old', damage: 20 }] as RaidLobbyRoom['battleLogs'];
  const after = structuredClone(before);
  after.currentTurn++;
  after.bossCurrentHp = 400;
  after.slots[0]!.currentHp = 380;
  after.battleLogs = [
    { turn: 2, actor: 'player', actorType: 'player', damage: 600, isCritical: true },
    { turn: 2, actor: 'boss', actorType: 'boss', damage: 120, skillName: 'Claw' },
  ] as RaidLobbyRoom['battleLogs'];
  const untouched = JSON.stringify({ before, after });
  const cue = raidVisualDelta(before, after)!;
  assert.equal(cue.bossDelta, 600);
  assert.deepEqual(cue.slots, [120]);
  assert.equal(cue.playerCritical, true);
  assert.equal(cue.bossCritical, true);
  assert.equal(cue.phase, true);
  assert.equal(JSON.stringify({ before, after }), untouched);
  assert.equal(raidVisualDelta(after, structuredClone(after)), null);
});
test('elemental feedback stays attached to confirmed attackers, including zero net HP change', () => {
  const before = room();
  const after = structuredClone(before);
  after.battleLogs = [
    { turn: 2, actor: 'A', actorType: 'player', cardName: 'Firecat', damage: 70, isSuperEffective: true },
    { turn: 2, actor: 'B', actorType: 'player', cardName: 'Watercat', damage: 20, isResisted: true, isCritical: true },
  ] as RaidLobbyRoom['battleLogs'];
  const cue = raidVisualDelta(before, after)!;
  assert.equal(cue.bossDelta, 0);
  assert.deepEqual(cue.playerFeedback, [
    { actor: 'A', card: 'Firecat', critical: false, advantage: true, resisted: false },
    { actor: 'B', card: 'Watercat', critical: true, advantage: false, resisted: true },
  ]);
  assert.equal(raidVisualDelta(after, structuredClone(after)), null);
});
test('healing, phase thresholds, defeat and replacement slots', () => {
  const before = room();
  const after = structuredClone(before);
  after.bossCurrentHp = 200;
  assert.equal(raidPressure(after), 'last');
  assert.equal(raidVisualDelta(before, after)!.phase, true);
  assert.equal(raidVisualDelta(after, before)!.bossDelta, -800);
  after.bossCurrentHp = 0;
  assert.equal(raidVisualDelta(before, after)!.defeated, true);
  assert.equal(raidVisualDelta(before, after)!.phase, false);
  after.slots[0]!.card.id = 'replacement';
  after.slots[0]!.currentHp = 10;
  assert.deepEqual(raidVisualDelta(before, after)!.slots, [0]);
  assert.equal(raidPressure({ ...before, bossMaxHp: 0 }), 'steady');
});
