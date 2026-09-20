import assert from 'node:assert/strict';
import test from 'node:test';
import { bossArtwork } from './bossArtwork';

test('only the approved fire cat artwork is replaced, unknown sources stay untouched', () => {
  assert.equal(bossArtwork('/images/bosses/boss_cat_api.jpg'), '/images/bosses/boss_cat_api-v2.png');
  assert.equal(bossArtwork('/images/bosses/boss_dog_air.jpg'), '/images/bosses/boss_dog_air.jpg');
  assert.equal(bossArtwork('https://example.com/custom.jpg'), 'https://example.com/custom.jpg');
});
