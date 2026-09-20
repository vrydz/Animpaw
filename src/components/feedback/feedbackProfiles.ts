// Presentation data only: these profiles never determine rewards or combat results.
export const rarityProfiles = {
  Common: { color: '#cbd5e1', duration: 450, particles: 2, rank: 1, symbol: '◇' },
  Rare: { color: '#60a5fa', duration: 650, particles: 3, rank: 2, symbol: '◈' },
  Epic: { color: '#fb7185', duration: 850, particles: 4, rank: 3, symbol: '✦' },
  Legend: { color: '#fbbf24', duration: 1100, particles: 6, rank: 4, symbol: '✧' },
  Mythic: { color: '#f0abfc', duration: 1300, particles: 8, rank: 5, symbol: '✺' },
} as const;
export function rarityProfile(rarity: string) {
  const key = rarity === 'Legendary' ? 'Legend' : rarity;
  return rarityProfiles[key as keyof typeof rarityProfiles] || rarityProfiles.Common;
}
export type FeedbackSound = 'attack' | 'defend' | 'heal' | 'critical' | 'reward' | 'victory' | 'defeat'
  | 'summon' | 'evolution' | 'reveal' | 'raid-enter' | 'raid-attack' | 'raid-pressure' | 'raid-victory';
export function feedbackNotes(kind: FeedbackSound, rarity = 'Common'): readonly number[] {
  switch (kind) {
    case 'attack': return [220, 110];
    case 'defend': return [330, 247];
    case 'heal': return [392, 523];
    case 'critical': return [164, 82, 440];
    case 'reward': return [523, 659, 784];
    case 'victory': return [392, 494, 587, 784];
    case 'defeat': return [294, 247, 196];
    case 'summon': return [196, 294, 392];
    case 'evolution': return [262, 392, 523, 659];
    case 'raid-enter': return [82, 123, 164];
    case 'raid-attack': return [110, 73];
    case 'raid-pressure': return [147, 196, 220];
    case 'raid-victory': return [196, 294, 392, 494, 587];
    case 'reveal': return [392, 494, 587, 784, 988].slice(0, rarityProfile(rarity).rank);
  }
}
