import React, { useState, useEffect } from "react";
import { RaidBoss, RaidLobbyRoom, Card, User } from "../types";
import {
  Swords,
  Shield,
  Zap,
  Flame,
  Droplets,
  Mountain,
  Wind,
  Users,
  User as UserIcon,
  Plus,
  Compass,
  AlertTriangle,
  Gift,
  RefreshCw,
  Search,
  Sparkles,
  ChevronRight,
  MapPin,
  Clock,
  Radio
} from "lucide-react";

interface RaidBossHubProps {
  user: User | null;
  userCards: Card[];
  currentLanguage: "id" | "en";
  userCoordinates?: { lat: number; lng: number } | null;
  initialBossId?: string | null;
  onEnterBattle: (room: RaidLobbyRoom) => void;
  onNavigateToMap?: () => void;
}

const DEVELOPER_EMAILS = [
  "verydiaz@gmail.com",
  "nekomaster@nekomon.online",
  "support@nekomon.online"
];

export const RaidBossHub: React.FC<RaidBossHubProps> = ({
  user,
  userCards,
  currentLanguage,
  userCoordinates,
  initialBossId,
  onEnterBattle,
  onNavigateToMap
}) => {
  const [bosses, setBosses] = useState<RaidBoss[]>([]);
  const [lobbies, setLobbies] = useState<RaidLobbyRoom[]>([]);
  const [selectedBoss, setSelectedBoss] = useState<RaidBoss | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Filters
  const [speciesFilter, setSpeciesFilter] = useState<"all" | "kucing" | "tikus" | "anjing">("all");
  const [onlyWithinRadius, setOnlyWithinRadius] = useState<boolean>(false);
  const [cityFilter, setCityFilter] = useState<string>("all");

  // Modal / Action state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState<boolean>(true);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [customRoomCode, setCustomRoomCode] = useState<string>("");
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Developer Tool State
  const [showDevPanel, setShowDevPanel] = useState<boolean>(false);
  const [devSpecies, setDevSpecies] = useState<"kucing" | "tikus" | "anjing">("kucing");
  const [devLevel, setDevLevel] = useState<number>(15);
  const [devElement, setDevElement] = useState<string>("Api");
  const [devBossName, setDevBossName] = useState<string>("");
  const [devLocationName, setDevLocationName] = useState<string>("Monumen Nasional, Jakarta");
  const [devLat, setDevLat] = useState<number>(userCoordinates?.lat || -6.1754);
  const [devLng, setDevLng] = useState<number>(userCoordinates?.lng || 106.8272);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(8);
  const [highestDefeatedLevel, setHighestDefeatedLevel] = useState<number>(0);

  const isDev =
    user?.role === "developer" ||
    (user?.email && DEVELOPER_EMAILS.includes(user.email.toLowerCase().trim()));

  const getDevToken = () => localStorage.getItem("token") || localStorage.getItem("nekomon_token") || "";

  const fetchBossesAndLobbies = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const lat = userCoordinates?.lat || -6.1754;
      const lng = userCoordinates?.lng || 106.8272;

      const [bossRes, lobbyRes] = await Promise.all([
        fetch(`/api/raid/bosses?lat=${lat}&lng=${lng}`),
        fetch(`/api/raid/lobbies`)
      ]);

      if (bossRes.ok) {
        const bData = await bossRes.json();
        const loadedBosses: RaidBoss[] = bData.bosses || [];
        setBosses(loadedBosses);
        if (bData.maxUnlockedLevel) setMaxUnlockedLevel(bData.maxUnlockedLevel);
        if (bData.highestDefeatedLevel !== undefined) setHighestDefeatedLevel(bData.highestDefeatedLevel);
        if (initialBossId) {
          const target = loadedBosses.find((b: RaidBoss) => b.id === initialBossId);
          if (target) setSelectedBoss(target);
        }
      }
      if (lobbyRes.ok) {
        const lData = await lobbyRes.json();
        setLobbies(lData.lobbies || []);
      }
    } catch (e: any) {
      console.error("Error fetching raid data:", e);
      setErrorMsg(currentLanguage === "id" ? "Gagal memuat data Raid Boss." : "Failed to load Raid Bosses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBossesAndLobbies();
    const interval = setInterval(fetchBossesAndLobbies, 25000);
    return () => clearInterval(interval);
  }, [userCoordinates]);

  // Initial card selection for single player
  useEffect(() => {
    if (userCards && userCards.length > 0 && selectedCardIds.length === 0) {
      setSelectedCardIds(userCards.slice(0, 3).map((c) => c.id));
    }
  }, [userCards]);

  const handleOpenCreate = (boss: RaidBoss) => {
    setSelectedBoss(boss);
    setIsSinglePlayer(true);
    if (userCards && userCards.length > 0) {
      setSelectedCardIds(userCards.slice(0, 3).map((c) => c.id));
    }
    setShowCreateModal(true);
  };

  const handleToggleCardSelection = (cardId: string) => {
    if (isSinglePlayer) {
      if (selectedCardIds.includes(cardId)) {
        if (selectedCardIds.length === 1) return; // Keep at least 1
        setSelectedCardIds(selectedCardIds.filter((id) => id !== cardId));
      } else {
        if (selectedCardIds.length >= 3) {
          // Replace last
          setSelectedCardIds([selectedCardIds[0], selectedCardIds[1], cardId]);
        } else {
          setSelectedCardIds([...selectedCardIds, cardId]);
        }
      }
    } else {
      // Multiplayer: 1 card only
      setSelectedCardIds([cardId]);
    }
  };

  const handleCreateLobby = async () => {
    if (!selectedBoss) return;
    if (selectedCardIds.length === 0) {
      setErrorMsg(currentLanguage === "id" ? "Pilih minimal 1 kartu Nekomon!" : "Select at least 1 Nekomon card!");
      return;
    }

    setActionLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/raid/lobby/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bossId: selectedBoss.id,
          isSinglePlayer,
          cardIds: selectedCardIds,
          roomCode: customRoomCode,
          userLat: userCoordinates?.lat,
          userLng: userCoordinates?.lng
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat Raid Room.");
      }

      setShowCreateModal(false);
      onEnterBattle(data.room);
    } catch (e: any) {
      setErrorMsg(e.message || "Terjadi kesalahan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinByCode = async (code: string) => {
    if (!code || !code.trim()) return;
    if (userCards.length === 0) {
      setErrorMsg(currentLanguage === "id" ? "Anda belum memiliki kartu Nekomon." : "You have no Nekomon cards.");
      return;
    }

    setActionLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/raid/lobby/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roomCode: code.trim().toUpperCase(),
          cardId: userCards[0].id,
          userLat: userCoordinates?.lat,
          userLng: userCoordinates?.lng
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal bergabung ke Room.");
      }

      onEnterBattle(data.room);
    } catch (e: any) {
      setErrorMsg(e.message || "Gagal bergabung ke Room.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeveloperSpawn = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const token = getDevToken();
      const res = await fetch("/api/developer/raid/spawn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": user?.id || "",
          "x-user-email": user?.email || ""
        },
        body: JSON.stringify({
          speciesType: devSpecies,
          level: devLevel,
          element: devElement,
          name: devBossName,
          locationName: devLocationName,
          lat: devLat,
          lng: devLng
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal spawn Boss.");

      setSuccessMsg(data.message || "Raid Boss berhasil di-spawn!");
      fetchBossesAndLobbies();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeveloperReset = async () => {
    if (!confirm(currentLanguage === "id" ? "Reset seluruh Raid Boss ke default (Standby LV 6, 7, 8)?" : "Reset all Raid Bosses to default (Standby LV 6, 7, 8)?")) return;
    setActionLoading(true);
    try {
      const token = getDevToken();
      const res = await fetch("/api/developer/raid/reset", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": user?.id || "",
          "x-user-email": user?.email || ""
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        fetchBossesAndLobbies();
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getElementBadge = (elem: string) => {
    switch (elem) {
      case "Api":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30"><Flame size={12} /> {elem}</span>;
      case "Air":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30"><Droplets size={12} /> {elem}</span>;
      case "Tanah":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><Mountain size={12} /> {elem}</span>;
      case "Angin":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30"><Wind size={12} /> {elem}</span>;
      case "Petir":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"><Zap size={12} /> {elem}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-neutral-800 text-neutral-300">{elem}</span>;
    }
  };

  const availableCities = Array.from(
    new Set(bosses.map((b) => b.cityName).filter(Boolean) as string[])
  ).sort();

  const filteredBosses = bosses.filter((b) => {
    if (speciesFilter !== "all" && b.speciesType !== speciesFilter) return false;
    if (onlyWithinRadius && b.inRadius === false) return false;
    if (cityFilter !== "all" && b.cityName !== cityFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-3 sm:p-6 pb-24">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-red-950 via-neutral-900 to-indigo-950 border border-red-900/40 p-5 sm:p-8 mb-6 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-full opacity-15 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                <Radio size={14} className="animate-spin" /> RAID CO-OP BOSS (LV. 6 - 30)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                <MapPin size={12} /> {currentLanguage === "id" ? "Tersedia di Seluruh Kota Nusantara" : "Available in All Indonesian Cities"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
                <Sparkles size={12} className="text-yellow-400" />
                {currentLanguage === "id" ? "Bebas Jarak / Multi-Kota" : "No Distance Limit"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50">
                🏆 {currentLanguage === "id" ? `Tier Terbuka: Max LV. ${maxUnlockedLevel}` : `Tier Unlocked: Max LV. ${maxUnlockedLevel}`}
                <span className="text-[10px] text-amber-400/80 font-sans">({currentLanguage === "id" ? "LV 6, 7, 8 Standby" : "LV 6, 7, 8 Standby"})</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Swords className="text-red-400" />
              {currentLanguage === "id" ? "Raid Boss Co-op Arena Lintas Kota" : "Multi-City Co-op Raid Boss Arena"}
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              {currentLanguage === "id"
                ? "Raid Boss hadir tanpa syarat batas jarak! Bos level 6, 7, dan 8 selalu standby di setiap kota. Kalahkan bos level tertinggi untuk memunculkan 2 level bos berikutnya secara berurutan di spot map!"
                : "Raid Bosses are live without any distance restrictions! Boss levels 6, 7, and 8 are always on standby. Defeat the highest tier boss to sequentially unlock and spawn the next 2 boss levels on the spot map!"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="refresh-raid-btn"
              onClick={fetchBossesAndLobbies}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 flex items-center gap-1.5 transition"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {currentLanguage === "id" ? "Segarkan" : "Refresh"}
            </button>

            {onNavigateToMap && (
              <button
                id="view-map-raid-btn"
                onClick={onNavigateToMap}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-xs font-semibold text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 transition"
              >
                <Compass size={14} />
                {currentLanguage === "id" ? "Lihat di Peta" : "View on Map"}
              </button>
            )}

            {isDev && (
              <button
                id="dev-spawn-modal-btn"
                onClick={() => setShowDevPanel(!showDevPanel)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-bold text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition"
              >
                <Sparkles size={14} />
                {currentLanguage === "id" ? "Dev Panel Boss" : "Dev Boss Spawner"}
              </button>
            )}
          </div>
        </div>

        {/* Quick Join By Code Bar */}
        <div className="mt-5 pt-4 border-t border-neutral-800/70 flex flex-col sm:flex-row items-center gap-3">
          <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1">
            <Users size={14} className="text-indigo-400" />
            {currentLanguage === "id" ? "Punya Kode Room Teman?" : "Have a Room Code?"}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              id="raid-join-code-input"
              type="text"
              placeholder="Contoh: RAID-4921"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="bg-neutral-900/90 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 w-full sm:w-44 uppercase font-mono tracking-wider"
            />
            <button
              id="raid-join-by-code-btn"
              onClick={() => handleJoinByCode(joinCodeInput)}
              disabled={actionLoading || !joinCodeInput.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-bold text-white transition flex items-center gap-1 whitespace-nowrap"
            >
              {currentLanguage === "id" ? "Gabung" : "Join"}
            </button>
          </div>
        </div>
      </div>

      {/* Developer Spawner Panel */}
      {isDev && showDevPanel && (
        <div className="mb-6 rounded-2xl bg-amber-950/30 border border-amber-500/40 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Sparkles size={16} />
              {currentLanguage === "id" ? "Developer Tools: Kontrol Spawn Raid Boss" : "Developer Tools: Raid Boss Spawner"}
            </h3>
            <button
              id="dev-reset-all-btn"
              onClick={handleDeveloperReset}
              disabled={actionLoading}
              className="text-xs px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/50"
            >
              {currentLanguage === "id" ? "Reset Semua Boss" : "Reset All Bosses"}
            </button>
          </div>

          <form onSubmit={handleDeveloperSpawn} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">Spesies Boss</label>
              <select
                id="dev-species-select"
                value={devSpecies}
                onChange={(e) => setDevSpecies(e.target.value as any)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
              >
                <option value="kucing">Kucing (Cat Boss)</option>
                <option value="tikus">Tikus (Rat Boss)</option>
                <option value="anjing">Anjing (Dog Boss)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Level (5 - 30)</label>
              <input
                id="dev-level-input"
                type="number"
                min="5"
                max="30"
                value={devLevel}
                onChange={(e) => setDevLevel(parseInt(e.target.value) || 5)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Elemen</label>
              <select
                id="dev-element-select"
                value={devElement}
                onChange={(e) => setDevElement(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
              >
                <option value="Api">Api (Fire)</option>
                <option value="Air">Air (Water)</option>
                <option value="Tanah">Tanah (Earth)</option>
                <option value="Angin">Angin (Wind)</option>
                <option value="Petir">Petir (Thunder)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Nama Lokasi</label>
              <input
                id="dev-loc-input"
                type="text"
                value={devLocationName}
                onChange={(e) => setDevLocationName(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-neutral-400 mb-1">Nama Kustom Boss (Opsional)</label>
              <input
                id="dev-boss-name-input"
                type="text"
                placeholder="Biarkan kosong untuk nama otomatis..."
                value={devBossName}
                onChange={(e) => setDevBossName(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Latitude</label>
              <input
                id="dev-lat-input"
                type="number"
                step="0.0001"
                value={devLat}
                onChange={(e) => setDevLat(parseFloat(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Longitude</label>
              <input
                id="dev-lng-input"
                type="number"
                step="0.0001"
                value={devLng}
                onChange={(e) => setDevLng(parseFloat(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 mt-2">
              <button
                id="dev-spawn-submit-btn"
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold text-neutral-950 flex items-center gap-1 transition"
              >
                <Plus size={14} /> Spawn Boss Baru
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-700/60 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Active Multiplayer Lobbies Section */}
      {lobbies.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="text-indigo-400" size={18} />
              {currentLanguage === "id" ? "Lobby Terbuka Siap Join" : "Open Lobbies Ready to Join"}
            </h2>
            <span className="text-xs text-neutral-400">
              {lobbies.length} {currentLanguage === "id" ? "Room Aktif" : "Active Rooms"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lobbies.map((room) => {
              const filledSlots = room.slots.filter((s) => s !== null).length;
              return (
                <div
                  key={room.id}
                  id={`lobby-card-${room.id}`}
                  className="rounded-xl bg-neutral-900 border border-indigo-900/40 p-4 flex flex-col justify-between hover:border-indigo-500/50 transition shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
                        {room.roomCode}
                      </span>
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Users size={12} /> {filledSlots}/3 Slot
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {room.bossSnapshot.name} (LV. {room.bossSnapshot.level})
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      {currentLanguage === "id" ? "Host:" : "Host:"} <strong className="text-neutral-200">{room.hostUsername}</strong>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400">
                      {room.status === "waiting" ? (
                        <span className="text-emerald-400 font-medium">🟢 Siap Bertarung</span>
                      ) : (
                        <span className="text-amber-400 font-medium">⚔️ Sedang Berlangsung</span>
                      )}
                    </span>
                    <button
                      id={`join-lobby-btn-${room.id}`}
                      onClick={() => handleJoinByCode(room.roomCode)}
                      disabled={actionLoading || filledSlots >= 3}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition"
                    >
                      {currentLanguage === "id" ? "Masuk Room" : "Enter Room"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Boss List */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio size={18} className="text-red-400" />
            {currentLanguage === "id" ? "Daftar Raid Boss di Sekitarmu" : "Raid Bosses in Your Vicinity"}
          </h2>
          <p className="text-xs text-neutral-400">
            {currentLanguage === "id"
              ? "Pilih Boss untuk bertarung dalam Single Player (3 Kartu) atau buka Room Co-op Multiplayer."
              : "Choose a Boss to battle in Single Player (3 Cards) or create a Co-op Multiplayer Room."}
          </p>
        </div>

        {/* Species & Radius Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* City Filter Selector */}
          {availableCities.length > 0 && (
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg text-xs">
              <span className="text-neutral-400 font-medium">📍 {currentLanguage === "id" ? "Kota:" : "City:"}</span>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-neutral-900 text-white">
                  {currentLanguage === "id" ? "Semua Kota" : "All Cities"} ({bosses.length})
                </option>
                {availableCities.map((city) => (
                  <option key={city} value={city} className="bg-neutral-900 text-white">
                    {city}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 text-xs">
            <button
              onClick={() => setSpeciesFilter("all")}
              className={`px-2.5 py-1 rounded-md transition ${
                speciesFilter === "all" ? "bg-red-600 text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {currentLanguage === "id" ? "Semua" : "All"}
            </button>
            <button
              onClick={() => setSpeciesFilter("kucing")}
              className={`px-2.5 py-1 rounded-md transition ${
                speciesFilter === "kucing" ? "bg-red-600 text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              🐱 {currentLanguage === "id" ? "Kucing" : "Cat"}
            </button>
            <button
              onClick={() => setSpeciesFilter("tikus")}
              className={`px-2.5 py-1 rounded-md transition ${
                speciesFilter === "tikus" ? "bg-red-600 text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              🐭 {currentLanguage === "id" ? "Tikus" : "Rat"}
            </button>
            <button
              onClick={() => setSpeciesFilter("anjing")}
              className={`px-2.5 py-1 rounded-md transition ${
                speciesFilter === "anjing" ? "bg-red-600 text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              🐶 {currentLanguage === "id" ? "Anjing" : "Dog"}
            </button>
          </div>

          <button
            onClick={() => setOnlyWithinRadius(!onlyWithinRadius)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              onlyWithinRadius
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-600"
                : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
            }`}
          >
            <MapPin size={12} />
            {currentLanguage === "id" ? "Hanya < 10 KM" : "Only < 10 KM"}
          </button>
        </div>
      </div>

      {/* Boss Grid */}
      {loading ? (
        <div className="p-12 text-center text-neutral-500">
          <RefreshCw className="animate-spin mx-auto mb-2 text-red-400" size={24} />
          <p className="text-xs">{currentLanguage === "id" ? "Mendeteksi sinyal Boss di radius 10 KM..." : "Detecting Boss signals in 10 KM radius..."}</p>
        </div>
      ) : filteredBosses.length === 0 ? (
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-8 text-center text-neutral-400">
          <AlertTriangle size={32} className="mx-auto mb-2 text-amber-400 opacity-60" />
          <p className="text-sm font-semibold">{currentLanguage === "id" ? "Tidak ada Raid Boss yang sesuai filter." : "No Raid Bosses match current filters."}</p>
          <button
            onClick={() => {
              setSpeciesFilter("all");
              setOnlyWithinRadius(false);
            }}
            className="mt-3 text-xs text-indigo-400 hover:underline"
          >
            {currentLanguage === "id" ? "Reset Filter" : "Reset Filters"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBosses.map((boss) => {
            const inRange = boss.inRadius !== false;
            return (
              <div
                key={boss.id}
                id={`boss-card-${boss.id}`}
                className={`rounded-2xl bg-neutral-900/90 border transition-all flex flex-col justify-between overflow-hidden shadow-xl ${
                  inRange ? "border-neutral-800 hover:border-red-600/60" : "border-neutral-800/40 opacity-75"
                }`}
              >
                {/* Boss Visual & Element Badges */}
                <div className="relative p-4 bg-gradient-to-b from-neutral-800/50 to-transparent">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-black bg-red-600 text-white shadow-md">
                        LV. {boss.level}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700 capitalize">
                        {boss.speciesType === "kucing" ? "🐱 Kucing" : boss.speciesType === "tikus" ? "🐭 Tikus" : "🐶 Anjing"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {inRange ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <MapPin size={10} /> {boss.distanceKm || "0.8"} KM (Tersedia)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1">
                          <MapPin size={10} /> {boss.distanceKm} KM (&gt; 10 KM)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Artwork & Stats */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0 shadow-inner flex items-center justify-center">
                      <img
                        src={boss.imageUrl}
                        alt={boss.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-extrabold text-white truncate">
                        {currentLanguage === "id" ? boss.name : boss.nameEn || boss.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {boss.cityName && (
                          <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-xs">
                            📍 {boss.cityName}
                          </span>
                        )}
                        <span className="text-xs text-neutral-400 truncate flex items-center gap-1">
                          <MapPin size={11} className="text-red-400 shrink-0" />
                          {boss.locationName}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-neutral-400">{currentLanguage === "id" ? "Elemen:" : "Element:"}</span>
                        {getElementBadge(boss.element)}
                      </div>

                      {/* HP & Attack Stats */}
                      <div className="mt-2 text-[11px] text-neutral-300 grid grid-cols-2 gap-1 font-mono">
                        <div>HP: <span className="text-red-400 font-bold">{boss.hp.toLocaleString()}</span></div>
                        <div>ATK: <span className="text-amber-400 font-bold">{boss.atk}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buffs & Debuffs Elemental Info */}
                <div className="px-4 py-2.5 bg-neutral-950/60 border-t border-b border-neutral-800/80 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-900/40">
                      <span className="text-[10px] text-emerald-400 block font-semibold">
                        ⚡ {currentLanguage === "id" ? "Debuff Kelemahan (+75% DMG):" : "Weakness Debuff (+75% DMG):"}
                      </span>
                      <div className="mt-1 flex items-center gap-1">
                        {getElementBadge(boss.debuffElement)}
                      </div>
                    </div>

                    <div className="p-1.5 rounded bg-red-950/40 border border-red-900/40">
                      <span className="text-[10px] text-red-400 block font-semibold">
                        🛡️ {currentLanguage === "id" ? "Buff Resistensi (-50% DMG):" : "Buff Resistance (-50% DMG):"}
                      </span>
                      <div className="mt-1 flex items-center gap-1">
                        {getElementBadge(boss.buffElement)}
                      </div>
                    </div>
                  </div>

                  {/* Rewards Preview */}
                  <div className="mt-2 pt-2 border-t border-neutral-800/50 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1 text-amber-300 font-semibold">
                      <Gift size={12} /> {currentLanguage === "id" ? "Hadiah Shared:" : "Shared Rewards:"}
                    </span>
                    <span className="text-neutral-200">
                      +{boss.rewards.cores} Cores • +{boss.rewards.points} Poin • +{boss.rewards.energyRefill} Energi
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-neutral-900 flex items-center gap-2">
                  <button
                    id={`boss-fight-btn-${boss.id}`}
                    onClick={() => handleOpenCreate(boss)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-xs font-bold text-white shadow-lg shadow-red-950/50 transition flex items-center justify-center gap-1.5"
                  >
                    <Swords size={14} />
                    {currentLanguage === "id" ? "Mulai / Buat Raid Room" : "Start / Create Raid"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Prepare Raid Team */}
      {showCreateModal && selectedBoss && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Swords className="text-red-400" size={20} />
                <h3 className="text-lg font-bold text-white">
                  {currentLanguage === "id" ? "Persiapan Tim Raid (3 Slot)" : "Raid Team Preparation (3 Slots)"}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            {/* Boss Overview */}
            <div className="mt-4 p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
              <img
                src={selectedBoss.imageUrl}
                alt={selectedBoss.name}
                className="w-14 h-14 rounded-lg object-cover bg-neutral-900"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">
                    LV. {selectedBoss.level}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">{selectedBoss.name}</h4>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  HP: <span className="text-red-400 font-bold">{selectedBoss.hp}</span> • Weakness:{" "}
                  <strong className="text-emerald-400">{selectedBoss.debuffElement}</strong> • Resists:{" "}
                  <strong className="text-red-400">{selectedBoss.buffElement}</strong>
                </p>
              </div>
            </div>

            {/* Mode Switch: Single Player (3 Kartu Sendiri) vs Multiplayer (Co-op 3 Player) */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                {currentLanguage === "id" ? "Pilih Mode Bertarung:" : "Select Battle Mode:"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="raid-mode-single-btn"
                  onClick={() => {
                    setIsSinglePlayer(true);
                    if (userCards && userCards.length > 0) {
                      setSelectedCardIds(userCards.slice(0, 3).map((c) => c.id));
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    isSinglePlayer
                      ? "bg-red-950/60 border-red-500 text-white"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  <UserIcon className={isSinglePlayer ? "text-red-400" : "text-neutral-500"} size={20} />
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {currentLanguage === "id" ? "Single Player (3 Kartu)" : "Single Player (3 Cards)"}
                    </h5>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {currentLanguage === "id"
                        ? "Pasang 3 kartu dari koleksimu sekaligus untuk bertarung solo."
                        : "Equip 3 cards from your own deck to battle solo."}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  id="raid-mode-multi-btn"
                  onClick={() => {
                    setIsSinglePlayer(false);
                    if (userCards && userCards.length > 0) {
                      setSelectedCardIds([userCards[0].id]);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    !isSinglePlayer
                      ? "bg-indigo-950/60 border-indigo-500 text-white"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  <Users className={!isSinglePlayer ? "text-indigo-400" : "text-neutral-500"} size={20} />
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {currentLanguage === "id" ? "Multiplayer Co-op (3 Pemain)" : "Multiplayer Co-op (3 Players)"}
                    </h5>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {currentLanguage === "id"
                        ? "Buka Room, pasang 1 kartumu, dan ajak 2 pemain lain bergabung."
                        : "Open a Room, equip 1 card, and invite 2 other players."}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Room Code (for Multiplayer) */}
            {!isSinglePlayer && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  {currentLanguage === "id" ? "Kode Room Kustom (Opsional):" : "Custom Room Code (Optional):"}
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RAID-MIAU"
                  value={customRoomCode}
                  onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white uppercase font-mono"
                />
              </div>
            )}

            {/* 3 Slots Selection Display */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">
                  {isSinglePlayer
                    ? currentLanguage === "id"
                      ? "Pilih 3 Kartu untuk 3 Slot Penyerang:"
                      : "Select 3 Cards for 3 Combat Slots:"
                    : currentLanguage === "id"
                    ? "Pilih 1 Kartu untuk Slotmu (Host):"
                    : "Select 1 Card for your Slot (Host):"}
                </span>
                <span className="text-xs text-red-400 font-mono">
                  {selectedCardIds.length} / {isSinglePlayer ? 3 : 1} {currentLanguage === "id" ? "Dipilih" : "Selected"}
                </span>
              </div>

              {/* Card Picker Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 bg-neutral-950/60 rounded-xl border border-neutral-800">
                {userCards.map((card) => {
                  const isSelected = selectedCardIds.includes(card.id);
                  const isEffective = card.element === selectedBoss.debuffElement;
                  const isResisted = card.element === selectedBoss.buffElement;

                  return (
                    <div
                      key={card.id}
                      onClick={() => handleToggleCardSelection(card.id)}
                      className={`p-2 rounded-xl border cursor-pointer transition flex items-center gap-2.5 relative ${
                        isSelected
                          ? "bg-red-950/70 border-red-500 shadow-md ring-1 ring-red-500"
                          : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-11 h-11 rounded-lg object-cover bg-neutral-950 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate">{card.name}</span>
                          <span className="text-[10px] text-neutral-400">Lv.{card.level || 1}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {getElementBadge(card.element)}
                        </div>
                        {isEffective && (
                          <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">
                            💥 +75% Bonus Weakness!
                          </span>
                        )}
                        {isResisted && (
                          <span className="text-[9px] text-red-400 font-medium block mt-0.5">
                            🛡️ -50% Resisted
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300"
              >
                {currentLanguage === "id" ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                id="confirm-create-raid-btn"
                onClick={handleCreateLobby}
                disabled={actionLoading || selectedCardIds.length === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg flex items-center gap-1.5 transition"
              >
                <Swords size={14} />
                {actionLoading
                  ? currentLanguage === "id"
                    ? "Menyiapkan Room..."
                    : "Preparing..."
                  : isSinglePlayer
                  ? currentLanguage === "id"
                    ? "Mulai Pertarungan Solo"
                    : "Start Solo Battle"
                  : currentLanguage === "id"
                  ? "Buka Room Multiplayer"
                  : "Create Multiplayer Room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
