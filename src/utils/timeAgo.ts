/**
 * Helper to calculate and format player online/offline status and activity history.
 * Supports bilingual display (ID/EN).
 */

export interface PlayerActivityStatus {
  isOnline: boolean;
  statusText: string;
  relativeTime: string;
  badgeClass: string;
  dotClass: string;
}

export function isPlayerOnline(lastSeen?: string): boolean {
  if (!lastSeen) return false;
  const lastTime = new Date(lastSeen).getTime();
  if (isNaN(lastTime)) return false;
  // Consider online if active within last 4 minutes
  return Date.now() - lastTime < 4 * 60 * 1000;
}

export function formatPlayerActivity(
  lastSeen?: string,
  explicitIsOnline?: boolean,
  lang: "id" | "en" = "id",
  isBot?: boolean
): PlayerActivityStatus {
  if (isBot) {
    return {
      isOnline: false,
      statusText: lang === "id" ? "AI Trainer (Standby)" : "AI Trainer (Standby)",
      relativeTime: lang === "id" ? "Siap tanding 24/7" : "Ready 24/7",
      badgeClass: "text-amber-400 bg-amber-950/40 border-amber-800/40",
      dotClass: "bg-amber-400"
    };
  }

  const online = explicitIsOnline !== undefined ? explicitIsOnline : isPlayerOnline(lastSeen);

  if (online) {
    return {
      isOnline: true,
      statusText: lang === "id" ? "Online Sekarang" : "Online Now",
      relativeTime: lang === "id" ? "Aktif" : "Active",
      badgeClass: "text-emerald-400 bg-emerald-950/50 border-emerald-500/40",
      dotClass: "bg-emerald-400"
    };
  }

  if (!lastSeen) {
    return {
      isOnline: false,
      statusText: lang === "id" ? "Offline" : "Offline",
      relativeTime: lang === "id" ? "Belum ada riwayat" : "No history",
      badgeClass: "text-slate-400 bg-slate-900/60 border-slate-800",
      dotClass: "bg-slate-500"
    };
  }

  const date = new Date(lastSeen);
  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  let relativeTime = "";
  if (diffMinutes < 1) {
    relativeTime = lang === "id" ? "Baru saja" : "Just now";
  } else if (diffMinutes < 60) {
    relativeTime = lang === "id" ? `${diffMinutes} menit lalu` : `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    relativeTime = lang === "id" ? `${diffHours} jam lalu` : `${diffHours}h ago`;
  } else if (diffDays === 1) {
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    relativeTime = lang === "id" ? `Kemarin pk ${timeStr}` : `Yesterday at ${timeStr}`;
  } else if (diffDays < 7) {
    relativeTime = lang === "id" ? `${diffDays} hari lalu` : `${diffDays}d ago`;
  } else {
    relativeTime = date.toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short"
    });
  }

  const statusText = lang === "id" 
    ? `Offline • Terakhir online: ${relativeTime}` 
    : `Offline • Last seen: ${relativeTime}`;

  return {
    isOnline: false,
    statusText,
    relativeTime,
    badgeClass: "text-slate-400 bg-slate-900/70 border-slate-800",
    dotClass: "bg-slate-500"
  };
}
