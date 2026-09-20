import type { BeaconNode } from '../../types';

export type TerritoryFaction = 'Sentinel' | 'Vanguard';
export type TerritoryState = 'neutral' | 'contested' | 'capturing' | 'owned' | 'enemy-owned';
export type TerritoryOutcome = 'pending' | 'captured' | 'breached' | 'resolved' | 'failed';
export interface TerritoryVisualEvent {
  serial: number;
  nodeId: string;
  kind: 'capture' | 'battle';
  outcome: TerritoryOutcome;
  before: BeaconNode;
  after?: BeaconNode;
}

// Presentation only. A battle breach is NOT ownership; the server requires an Anchor afterward.
export function territoryState(node: BeaconNode, userId: string, faction: TerritoryFaction, event?: TerritoryVisualEvent | null): TerritoryState {
  if (event?.nodeId === node.id && event.outcome === 'pending') return event.kind === 'capture' ? 'capturing' : 'contested';
  if (!node.ownerId) return 'neutral';
  return node.ownerId === userId || node.ownerFaction === faction ? 'owned' : 'enemy-owned';
}

export function defenseProgress(node: BeaconNode): number {
  if (!node.ownerId || node.maxDefenseHp <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - node.defenseHp / node.maxDefenseHp) * 100)));
}

export function ownershipChange(before: BeaconNode, after: BeaconNode): boolean {
  return before.id === after.id && (before.ownerId !== after.ownerId || before.ownerFaction !== after.ownerFaction);
}

export const territoryLabels: Record<TerritoryState, { id: string; en: string }> = {
  neutral: { id: 'NETRAL', en: 'NEUTRAL' },
  contested: { id: 'DIPEREBUTKAN', en: 'CONTESTED' },
  capturing: { id: 'MENGUASAI', en: 'CAPTURING' },
  owned: { id: 'DIKUASAI', en: 'OWNED' },
  'enemy-owned': { id: 'WILAYAH MUSUH', en: 'ENEMY OWNED' },
};
