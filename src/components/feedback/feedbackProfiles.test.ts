import { test } from 'node:test';
import assert from 'node:assert/strict';
import { feedbackNotes, rarityProfile, rarityProfiles, type FeedbackSound } from './feedbackProfiles';

test('rarity presentation increases gradually and remains bounded', () => {
  const profiles = Object.values(rarityProfiles);
  assert.deepEqual(profiles.map(p => p.rank), [1, 2, 3, 4, 5]);
  assert.deepEqual(profiles.map(p => p.duration), [450, 650, 850, 1100, 1300]);
  assert.ok(profiles.every(p => p.particles <= 8));
  assert.equal(rarityProfile('Legendary'), rarityProfile('Legend'));
  assert.equal(rarityProfile('unknown'), rarityProfile('Common'));
});
test('feedback tones are short bounded motifs, not new audio assets or mechanics', () => {
  const kinds: FeedbackSound[] = ['attack','defend','heal','critical','reward','victory','defeat','summon','evolution','reveal','raid-enter','raid-attack','raid-pressure','raid-victory'];
  for (const kind of kinds) {
    const notes = feedbackNotes(kind, 'Mythic');
    assert.ok(notes.length >= 1 && notes.length <= 5);
    assert.ok(notes.every(f => Number.isFinite(f) && f >= 60 && f <= 1200));
  }
  assert.equal(feedbackNotes('reveal', 'Common').length, 1);
  assert.equal(feedbackNotes('reveal', 'Mythic').length, 5);
  assert.notDeepEqual(feedbackNotes('attack'), feedbackNotes('raid-attack'));
});
