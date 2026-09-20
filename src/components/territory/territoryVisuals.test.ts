import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { BeaconNode } from '../../types';
import { defenseProgress, ownershipChange, territoryState, type TerritoryVisualEvent } from './territoryVisuals';

const neutral = { id: 'hq', isBase: true, baseFaction: 'Vanguard', ownerId: null, ownerFaction: null, defenseHp: 100, maxDefenseHp: 100 } as BeaconNode;
const enemy = { ...neutral, ownerId: 'enemy', ownerFaction: 'Vanguard' as const };
const own = { ...neutral, ownerId: 'player', ownerFaction: 'Sentinel' as const };
const pending = (kind: 'capture' | 'battle'): TerritoryVisualEvent => ({ serial: 1, nodeId: 'hq', kind, outcome: 'pending', before: neutral });

test('all five states follow confirmed ownership and only the targeted pending request', () => {
  assert.equal(territoryState(neutral, 'player', 'Sentinel'), 'neutral');
  assert.equal(territoryState(neutral, 'player', 'Sentinel', pending('capture')), 'capturing');
  assert.equal(territoryState(enemy, 'player', 'Sentinel', pending('battle')), 'contested');
  assert.equal(territoryState(own, 'player', 'Sentinel'), 'owned');
  assert.equal(territoryState(enemy, 'player', 'Sentinel'), 'enemy-owned');
  assert.equal(territoryState(neutral, 'player', 'Sentinel', { ...pending('battle'), nodeId: 'elsewhere' }), 'neutral');
});
test('friendly faction differs from enemy faction; HQ designation does not imply ownership', () => {
  assert.equal(territoryState({ ...own, ownerId: 'ally' }, 'player', 'Sentinel'), 'owned');
  assert.equal(territoryState(own, 'other', 'Vanguard'), 'enemy-owned');
  assert.equal(territoryState(neutral, 'player', 'Vanguard'), 'neutral');
});
test('breach remains neutral and failed requests never grant ownership', () => {
  assert.equal(territoryState(neutral, 'player', 'Sentinel', { ...pending('battle'), outcome: 'breached', after: neutral }), 'neutral');
  assert.equal(territoryState(neutral, 'player', 'Sentinel', { ...pending('capture'), outcome: 'failed' }), 'neutral');
  assert.equal(territoryState(enemy, 'player', 'Sentinel', { ...pending('battle'), outcome: 'resolved' }), 'enemy-owned');
});
test('progress shows server defense only, is bounded, and does not mutate data', () => {
  const node = { ...enemy, defenseHp: 40 };
  const before = JSON.stringify(node);
  assert.equal(defenseProgress(node), 60);
  assert.equal(defenseProgress({ ...node, defenseHp: -5 }), 100);
  assert.equal(defenseProgress({ ...node, defenseHp: 300 }), 0);
  assert.equal(defenseProgress({ ...node, maxDefenseHp: 0 }), 0);
  assert.equal(defenseProgress(neutral), 0);
  assert.equal(JSON.stringify(node), before);
});
test('ownership pulses ignore duplicate snapshots and ordinary HP updates', () => {
  assert.equal(ownershipChange(neutral, own), true);
  assert.equal(ownershipChange(own, enemy), true);
  assert.equal(ownershipChange(enemy, neutral), true);
  assert.equal(ownershipChange(own, { ...own }), false);
  assert.equal(ownershipChange(own, { ...own, defenseHp: 15 }), false);
  assert.equal(ownershipChange(neutral, { ...own, id: 'other' }), false);
});
