import { Card } from "../types";

/**
 * Calculates current energy for a Nekomon Card based on time elapsed since last refill.
 * Energy refills 1 bar every 2 hours (max 5 bars).
 */
export function updateCardEnergy(card: Card): Card {
  if (!card) return card;
  const maxEnergy = card.maxEnergy ?? 5;
  let currentEnergy = card.energy ?? 5;
  const now = Date.now();
  const lastRefillMs = card.lastEnergyRefillAt ? new Date(card.lastEnergyRefillAt).getTime() : now;
  const twoHoursMs = 2 * 60 * 60 * 1000; // 2 hours in ms

  if (currentEnergy < maxEnergy) {
    const elapsed = now - lastRefillMs;
    if (elapsed >= twoHoursMs) {
      const barsToAdd = Math.floor(elapsed / twoHoursMs);
      const newEnergy = Math.min(maxEnergy, currentEnergy + barsToAdd);
      const remainder = elapsed % twoHoursMs;
      card.energy = newEnergy;
      card.lastEnergyRefillAt = new Date(now - remainder).toISOString();
    } else {
      card.energy = currentEnergy;
    }
  } else {
    card.energy = maxEnergy;
    if (!card.lastEnergyRefillAt) {
      card.lastEnergyRefillAt = new Date(now).toISOString();
    }
  }
  card.maxEnergy = maxEnergy;
  return card;
}

/**
 * Returns remaining milliseconds until the next 1 bar energy refill.
 */
export function getTimeUntilNextEnergyRefill(card: Card): number {
  if (!card) return 0;
  const maxEnergy = card.maxEnergy ?? 5;
  const currentEnergy = card.energy ?? 5;
  if (currentEnergy >= maxEnergy) return 0;

  const now = Date.now();
  const lastRefillMs = card.lastEnergyRefillAt ? new Date(card.lastEnergyRefillAt).getTime() : now;
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const elapsed = now - lastRefillMs;
  const timeInCurrentInterval = elapsed % twoHoursMs;
  const remaining = twoHoursMs - timeInCurrentInterval;
  return Math.max(0, remaining);
}

/**
 * Formats energy countdown milliseconds into human-readable string (e.g. "01j 45m 20d").
 */
export function formatEnergyCountdown(ms: number): string {
  if (ms <= 0) return "Full";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}j ${pad(minutes)}m ${pad(seconds)}d`;
  }
  return `${pad(minutes)}m ${pad(seconds)}d`;
}
