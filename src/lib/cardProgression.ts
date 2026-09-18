export interface ProgressionCard {
  level?: number;
  xp?: number;
  maxXp?: number;
  hp?: number;
  atk?: number;
  def?: number;
  spd?: number;
}

export const LEVEL_GAINS = Object.freeze({ hp: 15, atk: 7, def: 7, spd: 4 });

export function applyCardXp(card: ProgressionCard, xpGained: number) {
  const oldLevel = card.level || 1;
  card.level = oldLevel;
  card.xp = (card.xp || 0) + Math.max(0, xpGained);
  let maxXp = card.level * 100;
  const statUpgrades = { hp: 0, atk: 0, def: 0, spd: 0 };

  while (card.xp >= maxXp) {
    card.xp -= maxXp;
    card.level += 1;
    card.hp = (card.hp || 100) + LEVEL_GAINS.hp;
    card.atk = (card.atk || 50) + LEVEL_GAINS.atk;
    card.def = (card.def || 50) + LEVEL_GAINS.def;
    card.spd = (card.spd || 45) + LEVEL_GAINS.spd;
    statUpgrades.hp += LEVEL_GAINS.hp;
    statUpgrades.atk += LEVEL_GAINS.atk;
    statUpgrades.def += LEVEL_GAINS.def;
    statUpgrades.spd += LEVEL_GAINS.spd;
    maxXp = card.level * 100;
  }

  card.maxXp = maxXp;
  return { oldLevel, newLevel: card.level, leveledUp: card.level > oldLevel, statUpgrades };
}
