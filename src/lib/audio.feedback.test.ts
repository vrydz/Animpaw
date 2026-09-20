import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine } from './audio';

test('feedback waits for activation, caps voices, deduplicates, mutes and cancels hidden cues', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const parameter = () => ({ setValueAtTime() {}, setTargetAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  let created = 0, cancelled = 0;
  class Context {
    currentTime = 1;
    state = 'running';
    destination = {};
    createGain() { return { gain: parameter(), connect() {}, disconnect() {} }; }
    createOscillator() {
      created++;
      return { type: 'sine', frequency: parameter(), connect() {}, disconnect() {}, start() {}, onended: null as null | (() => void),
        stop(time?: number) { if (time === undefined) { cancelled++; this.onended?.(); } } };
    }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    resume() { this.state = 'running'; return Promise.resolve(); }
  }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { AudioContext: Context } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { hidden: false } });
  try {
    const engine = new AudioEngine();
    engine.playFeedback('reveal', 'Mythic');
    assert.equal(created, 0);
    engine.init();
    engine.playFeedback('reveal', 'Mythic');
    assert.equal(created, 5);
    engine.playFeedback('reveal', 'Mythic');
    engine.playFeedback('raid-victory');
    assert.equal(created, 5);
    engine.playFeedback('critical');
    assert.equal(created, 8);
    engine.setSfxVolume(0);
    engine.playFeedback('attack');
    assert.equal(created, 8);
    engine.setSfxVolume(NaN);
    assert.equal(engine.getSfxVolume(), 0);
    engine.setPageActive(false);
    assert.equal(cancelled, 8);
    engine.setSfxVolume(1);
    engine.playFeedback('attack');
    assert.equal(created, 8);
    engine.setPageActive(true);
    engine.playFeedback('attack');
    assert.equal(created, 10);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument); else Reflect.deleteProperty(globalThis, 'document');
  }
});
