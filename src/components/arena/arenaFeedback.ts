// Presentation adapter for the existing text-log protocol. Unknown logs stay neutral.
export interface ArenaSnapshot {
  battleId: string;
  round: number;
  status: string;
  winnerId?: string | null;
  logs?: string[];
  me: { username: string; card: { name: string; element: string } };
  opponent: { username: string; card: { name: string; element: string } };
}
export interface ArenaActionCue {
  id: string;
  action: 'attack' | 'skill' | 'defend' | null;
  advantage: boolean;
}
export function arenaOutcome(snapshot: Pick<ArenaSnapshot, 'status' | 'winnerId'>, userId: string): 'win' | 'loss' | null {
  if (snapshot.status !== 'ended' || !snapshot.winnerId || !userId) return null;
  return snapshot.winnerId === userId ? 'win' : 'loss';
}
export function arenaRoundFeedback(before: ArenaSnapshot | null, after: ArenaSnapshot) {
  if (!before || before.battleId !== after.battleId || after.round < before.round) return null;
  const logs = after.logs || [];
  let start = -1;
  for (let i = 0; i < logs.length; i++) if (/^--- ROUND \d+ RESOLUTION ---$/.test(logs[i])) start = i;
  if (start < 0 || (before.logs || []).includes(logs[start])) return null;
  const id = `${after.battleId}:${logs[start]}`;
  const roundLogs = logs.slice(start + 1);
  const prefix = (player: ArenaSnapshot['me']) => `[AKSI] ${player.username}'s ${player.card.name} `;
  const ambiguous = prefix(after.me) === prefix(after.opponent);
  const cue = (player: ArenaSnapshot['me']): ArenaActionCue => {
    const line = ambiguous ? undefined : roundLogs.find(log => log.startsWith(prefix(player)));
    const action = line?.slice(prefix(player).length);
    return {
      id,
      action: action?.startsWith('melancarkan serangan Cakar Cepat') ? 'attack'
        : action?.startsWith('mengerahkan Ultimate Skill [') ? 'skill'
        : action?.startsWith('mengambil sikap Bertahan') ? 'defend' : null,
      advantage: !ambiguous && roundLogs.some(log => log.startsWith(`🔥 UNGGUL ELEMEN! Elemen ${player.card.element} milik ${player.card.name} sangat efektif`)),
    };
  };
  return { me: cue(after.me), opponent: cue(after.opponent) };
}
