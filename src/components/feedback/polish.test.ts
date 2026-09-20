import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cardTilt } from './cardTilt';
import { parseVisualPreferences, cinematicAllowed, defaultVisualPreferences } from './visualPreferences';

test('visual settings safely default to auto and opt-out cinematics', () => {
  for (const value of [null, '', '{bad', 'null', '"text"', '{}']) assert.deepEqual(parseVisualPreferences(value), defaultVisualPreferences);
  assert.deepEqual(parseVisualPreferences('{"quality":"ultra","cinematic":"true"}'), defaultVisualPreferences);
  assert.deepEqual(parseVisualPreferences('{"quality":"low","cinematic":true}'), { quality: 'low', cinematic: true });
});
test('cinematics are gated by explicit choice, reduced motion, visibility and mobile quality', () => {
  assert.equal(cinematicAllowed(defaultVisualPreferences, false, false, false), false);
  const on = { quality: 'auto', cinematic: true } as const;
  assert.equal(cinematicAllowed(on, false, false, false), true);
  assert.equal(cinematicAllowed(on, true, false, false), false);
  assert.equal(cinematicAllowed(on, false, false, true), false);
  assert.equal(cinematicAllowed(on, false, true, false), false);
  assert.equal(cinematicAllowed({ quality: 'low', cinematic: true }, false, false, false), false);
  assert.equal(cinematicAllowed({ quality: 'standard', cinematic: true }, false, true, false), true);
});
test('tilt is centered, bounded and finite even with zero dimensions', () => {
  const middle = cardTilt(50, 100, 100, 200);
  assert.equal(Math.abs(middle.rx), 0); assert.equal(middle.ry, 0);
  for (const point of [[-100,999,100,200],[100,100,0,0],[0,0,100,200]]) {
    const result = cardTilt(...point as [number,number,number,number]);
    assert.ok(Math.abs(result.rx) <= 4 && Math.abs(result.ry) <= 4);
    assert.ok(result.gx >= 0 && result.gx <= 100 && result.gy >= 0 && result.gy <= 100);
  }
});
test('polish is presentation-only and never schedules gameplay callbacks', () => {
  const source = readFileSync(new URL('./CinematicAccent.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /fetch\(|audio\.|onComplete|onReward/);
  assert.match(source, /1200/);
  const tilt = readFileSync(new URL('./useCardTilt.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(tilt, /useState/);
  assert.match(tilt, /requestAnimationFrame/);
  assert.match(tilt, /cancelAnimationFrame/);
});
