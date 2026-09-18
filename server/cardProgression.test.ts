import assert from "node:assert/strict";
import test from "node:test";
import { applyCardXp, LEVEL_GAINS } from "../src/lib/cardProgression";

test("all XP sources use deterministic shared level gains", () => {
  const card = { level: 1, xp: 90, maxXp: 100, hp: 100, atk: 50, def: 50, spd: 45 };
  const result = applyCardXp(card, 20);
  assert.equal(result.leveledUp, true);
  assert.equal(card.level, 2);
  assert.equal(card.xp, 10);
  assert.equal(card.maxXp, 200);
  assert.deepEqual(result.statUpgrades, LEVEL_GAINS);
  assert.deepEqual({ hp: card.hp, atk: card.atk, def: card.def, spd: card.spd }, { hp: 115, atk: 57, def: 57, spd: 49 });
});
