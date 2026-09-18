export const ELEMENT_ADVANTAGE: Readonly<Record<string, string>> = Object.freeze({
  Api: "Angin",
  Angin: "Tanah",
  Tanah: "Petir",
  Petir: "Air",
  Air: "Api"
});

export const ELEMENT_ADVANTAGE_MULTIPLIER = 1.3;
export const ELEMENT_RESISTANCE_MULTIPLIER = 0.8;

export function getElementalMultiplier(attackerElement?: string, defenderElement?: string): number {
  if (!attackerElement || !defenderElement || attackerElement === defenderElement) return 1;
  return ELEMENT_ADVANTAGE[attackerElement] === defenderElement ? ELEMENT_ADVANTAGE_MULTIPLIER : 1;
}

// SPD has a meaningful but bounded effect: at most +/-15% damage tempo.
// A 50-point advantage is worth roughly 10%, without eclipsing ATK/DEF or counters.
export function getSpeedMultiplier(attackerSpeed?: number, defenderSpeed?: number): number {
  const difference = (attackerSpeed || 0) - (defenderSpeed || 0);
  return 1 + Math.max(-0.15, Math.min(0.15, difference / 500));
}

export function getStyleAttackMultiplier(style?: string): number {
  return style === "Vanguard" ? 1.05 : 1;
}

export function getStyleDefenseMultiplier(style?: string): number {
  return style === "Sentinel" ? 1.12 : 1;
}

// Element choice is already differentiated by the counter cycle. Keep raw skill
// power equal so no element receives a permanent advantage independent of matchup.
export function getSkillPowerMultiplier(_element?: string): number {
  return 1.55;
}
