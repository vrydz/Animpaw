// Presentation-only overrides; never mutate the boss snapshot received from the server.
export function bossArtwork(source: string): string {
  return source === '/images/bosses/boss_cat_api.jpg'
    ? '/images/bosses/boss_cat_api-v2.png'
    : source;
}
