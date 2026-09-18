import assert from "node:assert/strict";
import test from "node:test";
import {
  ELEMENT_ADVANTAGE,
  ELEMENT_ADVANTAGE_MULTIPLIER,
  ELEMENT_RESISTANCE_MULTIPLIER,
  getElementalMultiplier,
  getSkillPowerMultiplier,
  getSpeedMultiplier,
  getStyleAttackMultiplier,
  getStyleDefenseMultiplier
} from "../src/lib/combatBalance";

test("each element has exactly one counter with the shared 30 percent bonus", () => {
  const elements = Object.keys(ELEMENT_ADVANTAGE);
  assert.equal(elements.length, 5);
  assert.equal(new Set(Object.values(ELEMENT_ADVANTAGE)).size, 5);
  for (const attacker of elements) {
    const boosted = elements.filter(defender => getElementalMultiplier(attacker, defender) > 1);
    assert.deepEqual(boosted, [ELEMENT_ADVANTAGE[attacker]]);
    assert.equal(getElementalMultiplier(attacker, boosted[0]), ELEMENT_ADVANTAGE_MULTIPLIER);
  }
  assert.equal(ELEMENT_ADVANTAGE_MULTIPLIER, 1.3);
  assert.equal(ELEMENT_RESISTANCE_MULTIPLIER, 0.8);
});

test("styles have comparable impact and elemental skill power is neutral", () => {
  assert.equal(getStyleAttackMultiplier("Vanguard"), 1.05);
  assert.equal(getStyleDefenseMultiplier("Sentinel"), 1.12);
  assert.equal(getStyleAttackMultiplier("Sentinel"), 1);
  assert.equal(getStyleDefenseMultiplier("Vanguard"), 1);
  const powers = ["Api", "Air", "Tanah", "Angin", "Petir"].map(getSkillPowerMultiplier);
  assert.equal(new Set(powers).size, 1);
  assert.equal(powers[0], 1.55);

  const baseDamage = 100 - 100 * 0.45;
  const vanguardDamage = 100 * getStyleAttackMultiplier("Vanguard") - 100 * 0.45;
  const damageIntoSentinel = 100 - 100 * getStyleDefenseMultiplier("Sentinel") * 0.45;
  const vanguardGain = (vanguardDamage - baseDamage) / baseDamage;
  const sentinelReduction = (baseDamage - damageIntoSentinel) / baseDamage;
  assert.ok(Math.abs(vanguardGain - sentinelReduction) < 0.02);
});

test("speed contributes to combat tempo but remains bounded", () => {
  assert.equal(getSpeedMultiplier(100, 100), 1);
  assert.equal(getSpeedMultiplier(150, 100), 1.1);
  assert.equal(getSpeedMultiplier(1000, 1), 1.15);
  assert.equal(getSpeedMultiplier(1, 1000), 0.85);
});
