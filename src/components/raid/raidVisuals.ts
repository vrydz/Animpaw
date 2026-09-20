import type { RaidLobbyRoom } from '../../types';
import type { FeedbackSound } from '../feedback/feedbackProfiles';

// Presentation thresholds only: no turn, stat, or reward is resolved here.
export function raidPressure(room: RaidLobbyRoom): 'steady' | 'intense' | 'last' {
  const ratio = room.bossMaxHp > 0 ? room.bossCurrentHp / room.bossMaxHp : 1;
  return ratio <= .25 ? 'last' : ratio <= .5 ? 'intense' : 'steady';
}

// One sound per received result, in order of informational importance.
export function raidFeedbackSound(cue: NonNullable<ReturnType<typeof raidVisualDelta>>): FeedbackSound {
  if (cue.defeated) return 'raid-victory';
  if (cue.phase) return 'raid-pressure';
  if (cue.bossCritical || cue.playerCritical) return 'critical';
  if (cue.bossAttack) return 'raid-attack';
  if (cue.bossDelta < 0 || cue.slots.some(delta => delta < 0)) return 'heal';
  return 'attack';
}

export function raidVisualDelta(before: RaidLobbyRoom, after: RaidLobbyRoom) {
  if (before.id !== after.id || after.currentTurn < before.currentTurn) return null;
  // Compare content rather than array length, so capped logs also work.
  const known = new Set(before.battleLogs.filter(log => log.turn >= before.currentTurn).map(log => JSON.stringify(log)));
  const fresh = after.battleLogs.filter(log => log.turn >= before.currentTurn && !known.has(JSON.stringify(log)));
  const attacks = fresh.filter(log => log.actorType === 'boss' && log.damage > 0);
  const playerAttacks = fresh.filter(log => log.actorType === 'player' && log.damage > 0);
  const bossDelta = before.bossCurrentHp - after.bossCurrentHp;
  const slots = after.slots.map((slot, index) => {
    const old = before.slots[index];
    if (!slot || !old || slot.card.id !== old.card.id || slot.userId !== old.userId) return 0;
    return old.currentHp - slot.currentHp;
  });
  const phase = raidPressure(before) !== raidPressure(after) && bossDelta > 0 && after.bossCurrentHp > 0;
  const defeated = before.bossCurrentHp > 0 && after.bossCurrentHp <= 0;
  if (!bossDelta && !slots.some(Boolean) && !attacks.length && !playerAttacks.length && !phase && !defeated) return null;
  return {
    bossDelta, slots, phase, defeated,
    // Attribute elemental/critical facts to logged attackers, not to aggregate HP loss.
    playerFeedback: playerAttacks.map(log => ({
      actor: log.actor, card: log.cardName, critical: !!log.isCritical,
      advantage: !!log.isSuperEffective, resisted: !!log.isResisted,
    })),
    bossAttack: attacks.length > 0,
    skill: attacks.find(log => log.skillName)?.skillName,
    playerCritical: fresh.some(log => log.actorType === 'player' && log.damage > 0 && log.isCritical),
    bossCritical: attacks.some(log => log.isCritical || after.bossSnapshot.skills?.some(skill => skill.name === log.skillName && skill.effectType === 'critical')),
  };
}
