import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Camera, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  Award, 
  Info, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Target, 
  ChevronRight,
  Crosshair,
  Layers,
  Map as MapIcon,
  Users,
  Plus,
  ThumbsUp,
  Gift,
  X,
  Loader2,
  Check,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Swords
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NekomonSpot, SpotCategory } from "../types";
import { calculateDistanceMeters, formatDistance, generateNekomonSpots, offsetCoordinates } from "../lib/geoUtils";
import { useLanguage } from "../context/LanguageContext";
import { haptics } from "../lib/vibration";
import { audio } from "../lib/audio";
import L from "leaflet";

interface NekomonSpotMapProps {
  onSelectSpotToCapture: (spot: NekomonSpot) => void;
  onNavigateToRaid?: () => void;
  userPoints: number;
  token?: string;
}

// Default center: Jakarta Monas (-6.1754, 106.8272)
const DEFAULT_CENTER = { lat: -6.1754, lng: 106.8272 };

export const NekomonSpotMap: React.FC<NekomonSpotMapProps> = ({
  onSelectSpotToCapture,
  onNavigateToRaid,
  userPoints,
  token
}) => {
  const { language } = useLanguage();
  
  // Player state
  const [playerPos, setPlayerPos] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);
  const [prevPos, setPrevPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  
  // Spots state
  const [spots, setSpots] = useState<NekomonSpot[]>([]);
  const [communitySpots, setCommunitySpots] = useState<NekomonSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<NekomonSpot | null>(null);
  const [filterCategory, setFilterCategory] = useState<SpotCategory | "all" | "community">("all");
  
  // Modals state
  const [showAddSpotModal, setShowAddSpotModal] = useState<boolean>(false);
  const [showEditSpotModal, setShowEditSpotModal] = useState<boolean>(false);
  const [showQuestsModal, setShowQuestsModal] = useState<boolean>(false);

  // Dynamic layout controls
  const [showFilterBar, setShowFilterBar] = useState<boolean>(false);
  const [isCardMinimized, setIsCardMinimized] = useState<boolean>(false);
  
  // Community Spot Form State
  const [newSpotName, setNewSpotName] = useState<string>("");
  const [newSpotCategory, setNewSpotCategory] = useState<SpotCategory>("taman");
  const [newSpotTargetCat, setNewSpotTargetCat] = useState<string>("");
  const [newSpotElement, setNewSpotElement] = useState<"Api" | "Air" | "Tanah" | "Angin" | "Petir">("Air");
  const [newSpotDesc, setNewSpotDesc] = useState<string>("");
  const [isSubmittingSpot, setIsSubmittingSpot] = useState<boolean>(false);
  const [addSpotStatus, setAddSpotStatus] = useState<string | null>(null);

  // Edit Community Spot Form State
  const [editingSpot, setEditingSpot] = useState<NekomonSpot | null>(null);
  const [editSpotName, setEditSpotName] = useState<string>("");
  const [editSpotCategory, setEditSpotCategory] = useState<SpotCategory>("taman");
  const [editSpotTargetCat, setEditSpotTargetCat] = useState<string>("");
  const [editSpotElement, setEditSpotElement] = useState<"Api" | "Air" | "Tanah" | "Angin" | "Petir">("Air");
  const [editSpotDesc, setEditSpotDesc] = useState<string>("");
  const [isUpdatingSpot, setIsUpdatingSpot] = useState<boolean>(false);
  const [editSpotStatus, setEditSpotStatus] = useState<string | null>(null);

  // Exploration Quests state (Stored in localStorage for persistence)
  const [distanceTraveled, setDistanceTraveled] = useState<number>(() => {
    const saved = localStorage.getItem("nekomon_dist_traveled");
    return saved ? Number(saved) : 180; // initial headstart
  });
  const [claimedDistanceQuest, setClaimedDistanceQuest] = useState<boolean>(() => {
    return localStorage.getItem("nekomon_claimed_dist") === "true";
  });
  const [claimedSpotQuest, setClaimedSpotQuest] = useState<boolean>(() => {
    return localStorage.getItem("nekomon_claimed_spot") === "true";
  });
  const [catsCapturedTodayCount, setCatsCapturedTodayCount] = useState<number>(() => {
    const saved = localStorage.getItem("nekomon_cats_today");
    return saved ? Number(saved) : 1;
  });
  const [claimedCatsQuest, setClaimedCatsQuest] = useState<boolean>(() => {
    return localStorage.getItem("nekomon_claimed_cats") === "true";
  });

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const playerMarkerRef = useRef<L.Marker | null>(null);
  const playerAccuracyCircleRef = useRef<L.Circle | null>(null);
  const spotMarkersRef = useRef<{ [id: string]: { marker: L.Marker; circle: L.Circle } }>({});

  // Ensure Leaflet CSS is loaded
  useEffect(() => {
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Fetch Community Spots from API with Local Backup Fallback
  const fetchCommunitySpots = async () => {
    try {
      const saved = localStorage.getItem("nekomon_community_spots_v2");
      if (saved) {
        try { setCommunitySpots(JSON.parse(saved)); } catch (_) {}
      }
      const res = await fetch("/api/community-spots");
      if (res.ok) {
        const data = await res.json();
        if (data.spots && Array.isArray(data.spots)) {
          setCommunitySpots(data.spots);
          localStorage.setItem("nekomon_community_spots_v2", JSON.stringify(data.spots));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch community spots:", e);
    }
  };

  const handleOpenEditModal = (spot: NekomonSpot) => {
    setEditingSpot(spot);
    setEditSpotName(spot.name);
    setEditSpotCategory(spot.category);
    setEditSpotTargetCat(spot.targetCatName || "");
    setEditSpotElement(spot.boostedElement || "Air");
    setEditSpotDesc(spot.description || "");
    setEditSpotStatus(null);
    setShowEditSpotModal(true);
  };

  const handleUpdateCommunitySpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpot) return;
    if (!editSpotName.trim() || !editSpotTargetCat.trim()) {
      setEditSpotStatus(language === "id" ? "Nama spot dan nama kucing target wajib diisi!" : "Spot name and cat name required!");
      return;
    }

    setIsUpdatingSpot(true);
    setEditSpotStatus(null);

    try {
      const res = await fetch(`/api/community-spots/${editingSpot.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          name: editSpotName,
          category: editSpotCategory,
          targetCatName: editSpotTargetCat,
          boostedElement: editSpotElement,
          description: editSpotDesc,
          lat: editingSpot.lat,
          lng: editingSpot.lng,
          radiusMeters: editingSpot.radiusMeters,
          rarity: editingSpot.rarity,
          bonusPoints: editingSpot.bonusPoints,
          bonusCores: editingSpot.bonusCores
        })
      });

      const data = await res.json();
      if (res.ok && data.spot) {
        setCommunitySpots(prev => {
          const exists = prev.some(s => s.id === editingSpot.id);
          const updated = exists
            ? prev.map(s => s.id === editingSpot.id ? data.spot : s)
            : [data.spot, ...prev];
          localStorage.setItem("nekomon_community_spots_v2", JSON.stringify(updated));
          return updated;
        });
        setSpots(prev => prev.map(s => s.id === editingSpot.id ? data.spot : s));
        setSelectedSpot(data.spot);
        setShowEditSpotModal(false);
        haptics.victory();
      } else {
        setEditSpotStatus(data.error || "Gagal memperbarui spot.");
      }
    } catch (err) {
      setEditSpotStatus("Kesalahan koneksi.");
    } finally {
      setIsUpdatingSpot(false);
    }
  };

  const handleDeleteCommunitySpot = async (spotId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus spot ini?")) return;
    try {
      const res = await fetch(`/api/community-spots/${spotId}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        setCommunitySpots(prev => {
          const updated = prev.filter(s => s.id !== spotId);
          localStorage.setItem("nekomon_community_spots_v2", JSON.stringify(updated));
          return updated;
        });
        setSpots(prev => prev.filter(s => s.id !== spotId));
        setSelectedSpot(null);
        setShowEditSpotModal(false);
        haptics.tap();
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchCommunitySpots();
  }, []);

  // Initialize Spots centered around player position (overriding default template spots with community edits if present)
  useEffect(() => {
    const defaultGenerated = generateNekomonSpots(playerPos.lat, playerPos.lng);
    const filteredDefaults = defaultGenerated.filter(d => !communitySpots.some(c => c.id === d.id));
    const combined = [...communitySpots, ...filteredDefaults];
    setSpots(combined);
    if (combined.length > 0 && !selectedSpot) {
      setSelectedSpot(combined[0]);
    } else if (selectedSpot) {
      const updatedSelected = combined.find(s => s.id === selectedSpot.id);
      if (updatedSelected) setSelectedSpot(updatedSelected);
    }
  }, [communitySpots, playerPos.lat, playerPos.lng]);

  // Track Distance Traveled as player moves
  useEffect(() => {
    if (prevPos) {
      const dist = calculateDistanceMeters(prevPos.lat, prevPos.lng, playerPos.lat, playerPos.lng);
      if (dist > 0.5 && dist < 500) { // filter out unnatural jumps > 500m
        setDistanceTraveled((prev) => {
          const updated = prev + Math.round(dist);
          localStorage.setItem("nekomon_dist_traveled", updated.toString());
          return updated;
        });
      }
    }
    setPrevPos(playerPos);
  }, [playerPos]);

  // Request real GPS location automatically
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsError(language === "id" ? "Browser tidak mendukung GPS Geolocation." : "Geolocation is not supported by your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setPlayerPos({ lat: newLat, lng: newLng });
        setGpsError(null);
      },
      (err) => {
        console.warn("GPS error:", err);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(language === "id" ? "Izin GPS ditolak. Aktifkan lokasi di browser." : "GPS permission denied.");
        } else {
          setGpsError(language === "id" ? "Mencari sinyal GPS..." : "Searching for GPS signal...");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [language]);

  // Initialize & update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      // Create Leaflet map
      const map = L.map(mapContainerRef.current, {
        center: [playerPos.lat, playerPos.lng],
        zoom: 17,
        zoomControl: false,
        attributionControl: false
      });

      // Add CartoDB Dark / OpenStreetMap tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd"
      }).addTo(map);

      // Add click to set player location in simulator mode
      map.on("click", (e: L.LeafletMouseEvent) => {
        setPlayerPos({ lat: e.latlng.lat, lng: e.latlng.lng });
        haptics.tap();
      });

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Update Player Marker
    const playerIcon = L.divIcon({
      className: "custom-player-marker",
      html: `
        <div class="relative flex items-center justify-center w-9 h-9">
          <div class="absolute inset-0 bg-cyan-500/40 rounded-full animate-ping"></div>
          <div class="w-8 h-8 bg-gradient-to-tr from-cyan-600 to-teal-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">
            🚶
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    if (!playerMarkerRef.current) {
      playerMarkerRef.current = L.marker([playerPos.lat, playerPos.lng], { icon: playerIcon }).addTo(map);
      playerAccuracyCircleRef.current = L.circle([playerPos.lat, playerPos.lng], {
        radius: 20,
        color: "#06b6d4",
        fillColor: "#06b6d4",
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: "4, 4"
      }).addTo(map);
    } else {
      playerMarkerRef.current.setLatLng([playerPos.lat, playerPos.lng]);
      if (playerAccuracyCircleRef.current) {
        playerAccuracyCircleRef.current.setLatLng([playerPos.lat, playerPos.lng]);
      }
    }

    // Clear old spot markers
    Object.values(spotMarkersRef.current).forEach(({ marker, circle }) => {
      marker.remove();
      circle.remove();
    });
    spotMarkersRef.current = {};

    // Filter spots
    const filteredSpots = filterCategory === "all" 
      ? spots 
      : filterCategory === "community"
      ? spots.filter(s => s.isCommunity)
      : spots.filter(s => s.category === filterCategory);

    // Draw spot markers & radius circles
    filteredSpots.forEach((spot) => {
      const dist = calculateDistanceMeters(playerPos.lat, playerPos.lng, spot.lat, spot.lng);
      const inRange = dist <= spot.radiusMeters;
      const isSelected = selectedSpot?.id === spot.id;
      const isCommunity = !!spot.isCommunity;

      const spotIcon = L.divIcon({
        className: "custom-spot-marker",
        html: `
          <div class="relative flex flex-col items-center group cursor-pointer">
            <div class="px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md whitespace-nowrap mb-1 transition-transform flex items-center gap-1 ${
              inRange 
                ? "bg-emerald-500 text-slate-950 font-black scale-110 shadow-emerald-500/50" 
                : isCommunity
                ? "bg-purple-900 text-purple-200 border border-purple-400 shadow-purple-900/50"
                : "bg-slate-900/90 text-amber-300 border border-amber-500/30"
            }">
              ${isCommunity ? "👥" : ""} ${spot.iconEmoji} ${spot.name} (${dist}m)
            </div>
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-xl border-2 transition-transform ${
              isSelected ? "scale-125 ring-4 ring-amber-400" : ""
            } ${
              inRange 
                ? "bg-gradient-to-br from-emerald-500 to-teal-700 border-white text-white animate-bounce" 
                : isCommunity
                ? "bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-950 border-purple-400 text-purple-200"
                : "bg-gradient-to-br from-slate-800 to-indigo-950 border-amber-500/60 text-amber-300"
            }">
              ${spot.iconEmoji}
            </div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50]
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: spotIcon })
        .addTo(map)
        .on("click", () => {
          setSelectedSpot(spot);
          haptics.tap();
        });

      const circle = L.circle([spot.lat, spot.lng], {
        radius: spot.radiusMeters,
        color: inRange ? "#10b981" : isCommunity ? "#a855f7" : "#f59e0b",
        fillColor: inRange ? "#10b981" : isCommunity ? "#a855f7" : "#f59e0b",
        fillOpacity: inRange ? 0.25 : 0.12,
        weight: isSelected ? 3 : 1.5
      }).addTo(map);

      spotMarkersRef.current[spot.id] = { marker, circle };
    });

  }, [playerPos, spots, selectedSpot, filterCategory]);

  // Recenter map on player
  const handleRecenter = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([playerPos.lat, playerPos.lng], 17, { duration: 0.8 });
      haptics.tap();
    }
  };

  // Respawn spots around player
  const handleRespawnSpots = () => {
    const defaultGenerated = generateNekomonSpots(playerPos.lat, playerPos.lng);
    const combined = [...communitySpots, ...defaultGenerated];
    setSpots(combined);
    if (combined.length > 0) {
      setSelectedSpot(combined[0]);
    }
    haptics.victory();
  };

  // Submit new community spot handler
  const handleAddCommunitySpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpotName.trim() || !newSpotTargetCat.trim()) {
      setAddSpotStatus(language === "id" ? "Nama spot dan nama kucing wajib diisi!" : "Spot name and cat name required!");
      return;
    }

    setIsSubmittingSpot(true);
    setAddSpotStatus(null);

    try {
      const res = await fetch("/api/community-spots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          name: newSpotName,
          category: newSpotCategory,
          lat: playerPos.lat,
          lng: playerPos.lng,
          targetCatName: newSpotTargetCat,
          boostedElement: newSpotElement,
          description: newSpotDesc
        })
      });

      const data = await res.json();
      if (res.ok && data.spot) {
        setCommunitySpots(prev => [data.spot, ...prev]);
        setSelectedSpot(data.spot);
        setShowAddSpotModal(false);
        // Reset form
        setNewSpotName("");
        setNewSpotTargetCat("");
        setNewSpotDesc("");
        try {
          audio.playForgingSound();
        } catch (_) {}
      } else {
        setAddSpotStatus(data.error || "Gagal membuat spot.");
      }
    } catch (err) {
      setAddSpotStatus("Kesalahan koneksi.");
    } finally {
      setIsSubmittingSpot(false);
    }
  };

  // Vote for a community spot
  const handleVoteCommunitySpot = async (spotId: string) => {
    try {
      const res = await fetch(`/api/community-spots/${spotId}/vote`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCommunitySpots(prev => prev.map(s => s.id === spotId ? { ...s, votes: data.votes } : s));
        setSpots(prev => prev.map(s => s.id === spotId ? { ...s, votes: data.votes } : s));
        if (selectedSpot && selectedSpot.id === spotId) {
          setSelectedSpot({ ...selectedSpot, votes: data.votes });
        }
        haptics.tap();
      }
    } catch (_) {}
  };

  // Selected spot distance & inRange status
  const currentDist = selectedSpot 
    ? calculateDistanceMeters(playerPos.lat, playerPos.lng, selectedSpot.lat, selectedSpot.lng)
    : 999;
  const isInRange = selectedSpot ? currentDist <= selectedSpot.radiusMeters : false;

  const categoriesList = [
    { id: "all", label: "🌐 Semua Spot" },
    { id: "community", label: "👥 Komunitas" },
    { id: "taman", label: "🌳 Taman" },
    { id: "jalan", label: "🛣️ Jalan / Trotoar" },
    { id: "cafe", label: "☕ Cafe" },
    { id: "stasiun", label: "🚉 Stasiun" },
    { id: "terminal", label: "🚌 Terminal" },
    { id: "halte", label: "🚏 Halte" },
    { id: "others", label: "📍 Lainnya" },
  ];

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[540px] flex flex-col bg-slate-950 overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      
      {/* MAP TOP HUD FLOATING TOOLBAR */}
      <div className="absolute top-2 left-2 right-2 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between gap-1.5 p-2 bg-slate-900/85 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-xl pointer-events-auto">
          {/* Left Title */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-slate-950 font-black shadow-md">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-1 uppercase tracking-wider">
                {language === "id" ? "Radar Spot" : "Spot Radar"}
                <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold">
                  GPS
                </span>
              </h3>
            </div>
          </div>

          {/* Quick Toolbar Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Category Filter Toggle */}
            <button
              onClick={() => { setShowFilterBar(!showFilterBar); haptics.tap(); }}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl flex items-center gap-1 border transition-all ${
                filterCategory !== "all" || showFilterBar
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700"
              }`}
              title="Filter Kategori Spot"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Filter</span>
            </button>

            {/* Daily Quest Button */}
            <button
              onClick={() => { setShowQuestsModal(true); haptics.tap(); }}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center gap-1 transition-all active:scale-95 cursor-pointer uppercase"
            >
              <Gift className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
              <span className="hidden sm:inline text-[11px]">Quest</span>
            </button>

            {/* Add Community Spot Button */}
            <button
              onClick={() => { setShowAddSpotModal(true); haptics.tap(); }}
              className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1 transition-all active:scale-95 cursor-pointer uppercase"
              title="Tambah Spot Komunitas"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline text-[11px]">+Spot</span>
            </button>

            {/* GPS Signal Indicator */}
            <div
              className={`px-2 py-1 text-xs font-bold rounded-xl flex items-center gap-1 transition-all ${
                gpsError
                  ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black"
              }`}
              title={gpsError || "GPS Real Aktif"}
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[10px] hidden md:inline">{gpsError ? "GPS Warning" : "GPS Aktif"}</span>
            </div>

            {/* Respawn Button */}
            <button
              onClick={handleRespawnSpots}
              title="Respawn Spot Baru"
              className="p-1.5 bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE HORIZONTAL FILTER CHIPS BAR */}
        <AnimatePresence>
          {showFilterBar && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center gap-1.5 p-2 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-x-auto no-scrollbar scroll-smooth">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setFilterCategory(cat.id as any);
                      haptics.tap();
                    }}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-xl whitespace-nowrap border transition-all shrink-0 ${
                      filterCategory === cat.id
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-105"
                        : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LEAFLET MAP CONTAINER */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0 bg-slate-900" />

      {/* RIGHT SIDE FLOATING MAP CONTROLS (Recenter & Raid Boss) */}
      <div className="absolute right-2 top-16 z-[1000] flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={handleRecenter}
          title="Ke Lokasi Saya"
          className="p-2.5 bg-slate-900/90 text-cyan-400 hover:text-white hover:bg-cyan-600 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {onNavigateToRaid && (
          <button
            onClick={() => {
              haptics.tap();
              onNavigateToRaid();
            }}
            title={language === "id" ? "Buka Raid Boss Co-op Arena (10 KM)" : "Open Co-op Raid Boss Arena (10 KM)"}
            className="p-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 border border-red-500/50 rounded-2xl shadow-xl shadow-red-950/60 backdrop-blur-md transition-all active:scale-95 flex items-center justify-center animate-pulse"
          >
            <Swords className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* SELECTED SPOT DYNAMIC BOTTOM SHEET / CARDS */}
      <AnimatePresence>
        {selectedSpot && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-2 left-2 right-2 z-[1000] p-3 bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 rounded-3xl shadow-2xl flex flex-col gap-2.5"
          >
            {/* MINIMIZED STATE BAR */}
            {isCardMinimized ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xl">{selectedSpot.iconEmoji}</span>
                  <div className="truncate">
                    <h4 className="text-xs font-black text-white truncate">{selectedSpot.name}</h4>
                    <span className="text-[10px] text-amber-400 font-bold">Jarak: {formatDistance(currentDist)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isInRange && (
                    <button
                      onClick={() => {
                        haptics.capture();
                        onSelectSpotToCapture(selectedSpot);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Potret</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsCardMinimized(false)}
                    className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700"
                    title="Buka Detail Card"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* EXPANDED FULL CARD */
              <>
                {/* Spot Header Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0 ${
                      selectedSpot.isCommunity 
                        ? "bg-purple-900/40 border border-purple-500/60 text-purple-200"
                        : "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300"
                    }`}>
                      {selectedSpot.iconEmoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {selectedSpot.isCommunity && (
                          <span className="px-1.5 py-0.2 text-[8px] font-black uppercase bg-purple-900 text-purple-200 rounded border border-purple-500">
                            👥 Komunitas
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 text-[8px] font-black uppercase bg-slate-800 text-amber-400 rounded border border-slate-700">
                          {selectedSpot.categoryLabel}
                        </span>
                        <span className={`px-1.5 py-0.2 text-[8px] font-black rounded ${
                          selectedSpot.rarity === "Legend" ? "bg-purple-950 text-purple-300 border border-purple-500" :
                          selectedSpot.rarity === "Epic" ? "bg-indigo-950 text-indigo-300 border border-indigo-500" :
                          selectedSpot.rarity === "Rare" ? "bg-cyan-950 text-cyan-300 border border-cyan-500" :
                          "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}>
                          {selectedSpot.rarity}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white mt-0.5 flex items-center gap-1">
                        {selectedSpot.name}
                      </h4>
                    </div>
                  </div>

                  {/* Distance & Edit Action */}
                  <div className="text-right flex items-center gap-1.5 shrink-0">
                    <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-black flex items-center gap-1 shadow-md ${
                      isInRange 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}>
                      <Target className="w-3 h-3" />
                      <span>{formatDistance(currentDist)}</span>
                    </div>

                    <button
                      onClick={() => handleOpenEditModal(selectedSpot)}
                      className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition-all hover:scale-105"
                      title="Edit Detail Spot Ini"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setIsCardMinimized(true)}
                      className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700"
                      title="Kecilkan Card"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Spot Perks & Target Cat */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/70 p-2 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[9px] text-slate-400 block leading-tight">Target Kucing:</span>
                      <strong className="text-amber-300 truncate block">{selectedSpot.targetCatName}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[9px] text-slate-400 block leading-tight">Bonus Spot:</span>
                      <strong className="text-cyan-300 truncate block">+{selectedSpot.bonusPoints} Poin ({selectedSpot.boostedElement})</strong>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="flex flex-col gap-1.5">
                  {isInRange ? (
                    <button
                      onClick={() => {
                        haptics.capture();
                        onSelectSpotToCapture(selectedSpot);
                      }}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>POTRET & TANGKAP KUCING SPOT ({selectedSpot.iconEmoji})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="py-2 px-2.5 bg-slate-950/80 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] font-bold flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Radius {selectedSpot.radiusMeters}m (Kurang {currentDist - selectedSpot.radiusMeters}m)</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">Mendekatlah ke lokasi</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: ADD COMMUNITY SPOT FORM */}
      <AnimatePresence>
        {showAddSpotModal && (
          <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-purple-500/40 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setShowAddSpotModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="p-2.5 bg-purple-950 text-purple-300 border border-purple-500/50 rounded-2xl">
                  <Users className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Rekomendasikan Spot Kucing Real</h3>
                  <p className="text-[11px] text-slate-400">Daftarkan lokasi asli di mana banyak kucing berkumpul di dunia nyata!</p>
                </div>
              </div>

              <form onSubmit={handleAddCommunitySpot} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Lokasi / Spot:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kopi Cat Cafe Sunter, Taman Suropati"
                    value={newSpotName}
                    onChange={(e) => setNewSpotName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kategori Spot:</label>
                    <select
                      value={newSpotCategory}
                      onChange={(e) => setNewSpotCategory(e.target.value as SpotCategory)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                    >
                      <option value="taman">🌳 Taman Kucing</option>
                      <option value="jalan">🛣️ Jalan / Trotoar</option>
                      <option value="komplek">🏡 Komplek Perumahan</option>
                      <option value="cafe">☕ Cafe Kucing</option>
                      <option value="stasiun">🚉 Stasiun Cat</option>
                      <option value="terminal">🚌 Terminal Bus</option>
                      <option value="halte">🚏 Halte Bus</option>
                      <option value="others">📍 Spot Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Elemen Boost:</label>
                    <select
                      value={newSpotElement}
                      onChange={(e) => setNewSpotElement(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                    >
                      <option value="Api">🔥 Api (Fire)</option>
                      <option value="Air">💧 Air (Water)</option>
                      <option value="Tanah">🌱 Tanah (Earth)</option>
                      <option value="Angin">🌪️ Angin (Wind)</option>
                      <option value="Petir">⚡ Petir (Lightning)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Kucing Target Di Spot Ini:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kucing Orange Oren, Kitten Putih"
                    value={newSpotTargetCat}
                    onChange={(e) => setNewSpotTargetCat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deskripsi & Petunjuk Akses:</label>
                  <textarea
                    rows={2}
                    placeholder="Misal: Suka mangkal dekat teras depan cafe tiap sore..."
                    value={newSpotDesc}
                    onChange={(e) => setNewSpotDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] text-cyan-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>Koordinat spot akan didaftarkan tepat di posisi GPS map Anda saat ini!</span>
                </div>

                {addSpotStatus && (
                  <div className="text-[10px] text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-900/40">
                    ⚠️ {addSpotStatus}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingSpot}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer uppercase"
                >
                  {isSubmittingSpot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Daftarkan Spot Komunitas Baru</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT COMMUNITY SPOT MODAL */}
      <AnimatePresence>
        {showEditSpotModal && editingSpot && (
          <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setShowEditSpotModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-2xl">
                  <Pencil className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Edit Spot Kucing Komunitas</h3>
                  <p className="text-[11px] text-slate-400">Perbarui informasi, kategori, dan detail kucing di spot ini</p>
                </div>
              </div>

              <form onSubmit={handleUpdateCommunitySpot} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Lokasi / Spot:</label>
                  <input
                    type="text"
                    required
                    value={editSpotName}
                    onChange={(e) => setEditSpotName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kategori Spot:</label>
                    <select
                      value={editSpotCategory}
                      onChange={(e) => setEditSpotCategory(e.target.value as SpotCategory)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    >
                      <option value="taman">🌳 Taman Kucing</option>
                      <option value="jalan">🛣️ Jalan / Trotoar</option>
                      <option value="komplek">🏡 Komplek Perumahan</option>
                      <option value="cafe">☕ Cafe Kucing</option>
                      <option value="stasiun">🚉 Stasiun Cat</option>
                      <option value="terminal">🚌 Terminal Bus</option>
                      <option value="halte">🚏 Halte Bus</option>
                      <option value="others">📍 Spot Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Elemen Boost:</label>
                    <select
                      value={editSpotElement}
                      onChange={(e) => setEditSpotElement(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    >
                      <option value="Api">🔥 Api (Fire)</option>
                      <option value="Air">💧 Air (Water)</option>
                      <option value="Tanah">🌱 Tanah (Earth)</option>
                      <option value="Angin">🌪️ Angin (Wind)</option>
                      <option value="Petir">⚡ Petir (Lightning)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Kucing Target:</label>
                  <input
                    type="text"
                    required
                    value={editSpotTargetCat}
                    onChange={(e) => setEditSpotTargetCat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deskripsi & Catatan:</label>
                  <textarea
                    rows={2}
                    value={editSpotDesc}
                    onChange={(e) => setEditSpotDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {editSpotStatus && (
                  <div className="text-[10px] text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-900/40">
                    ⚠️ {editSpotStatus}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteCommunitySpot(editingSpot.id)}
                    className="py-3 px-4 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold rounded-xl border border-rose-800/60 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    title="Hapus Spot Ini"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdatingSpot}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer uppercase"
                  >
                    {isUpdatingSpot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DAILY QUESTS & EXPLORATION MISSIONS */}
      <AnimatePresence>
        {showQuestsModal && (
          <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setShowQuestsModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl">
                  <Gift className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Quest Harian & Misi Eksplorasi</h3>
                  <p className="text-[11px] text-slate-400">Selesaikan aktivitas di peta nyata untuk klaim Card Pack & Poin!</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* QUEST 1: DISTANCE EXPLORATION */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                        <span>🚶 Misi 1: Jelajahi Radius / Jarak 1 km</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">Jalan atau gunakan simulator sejauh total 1.000 meter di peta hari ini.</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 shrink-0">
                      +50 PTS & +1 Pack
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Progress Terjelajahi:</span>
                      <strong className="text-white">{distanceTraveled} / 1000m</strong>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, (distanceTraveled / 1000) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    disabled={distanceTraveled < 1000 || claimedDistanceQuest}
                    onClick={() => {
                      setClaimedDistanceQuest(true);
                      localStorage.setItem("nekomon_claimed_dist", "true");
                      haptics.victory();
                      try { audio.playForgingSound(); } catch (_) {}
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      claimedDistanceQuest 
                        ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" 
                        : distanceTraveled >= 1000 
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg animate-pulse font-black" 
                        : "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    {claimedDistanceQuest ? "✓ Hadiah Telah Diklaim" : distanceTraveled >= 1000 ? "🎁 Klaim Hadiah (+50 PTS & Pack)" : "Belum Memenuhi Jarak (1000m)"}
                  </button>
                </div>

                {/* QUEST 2: CAPTURE 3 CATS */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                        <span>📸 Misi 2: Tangkap 3 Kucing / Spot</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">Potret minimal 3 kucing asli atau kucing spot di sekitar Anda hari ini.</p>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800 shrink-0">
                      +40 PTS & +15 Cores
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Progress Tangkapan:</span>
                      <strong className="text-white">{catsCapturedTodayCount} / 3 Target</strong>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, (catsCapturedTodayCount / 3) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    disabled={catsCapturedTodayCount < 3 || claimedCatsQuest}
                    onClick={() => {
                      setClaimedCatsQuest(true);
                      localStorage.setItem("nekomon_claimed_cats", "true");
                      haptics.victory();
                      try { audio.playForgingSound(); } catch (_) {}
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      claimedCatsQuest 
                        ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" 
                        : catsCapturedTodayCount >= 3 
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg animate-pulse font-black" 
                        : "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    {claimedCatsQuest ? "✓ Hadiah Telah Diklaim" : catsCapturedTodayCount >= 3 ? "🎁 Klaim Hadiah (+40 PTS & Cores)" : "Belum Cukup Tangkapan (3)"}
                  </button>
                </div>

                {/* QUEST 3: VISIT CITY PARK / CAFE SPOT */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                        <span>🌳 Misi 3: Kunjungi Spot Taman / Cafe</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">Masuk ke radius spot kategori Taman atau Cafe di peta radar.</p>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800 shrink-0">
                      +30 PTS & +1 Pack
                    </span>
                  </div>

                  <button
                    disabled={claimedSpotQuest}
                    onClick={() => {
                      setClaimedSpotQuest(true);
                      localStorage.setItem("nekomon_claimed_spot", "true");
                      haptics.victory();
                      try { audio.playForgingSound(); } catch (_) {}
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      claimedSpotQuest 
                        ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" 
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg font-black"
                    }`}
                  >
                    {claimedSpotQuest ? "✓ Hadiah Telah Diklaim" : "🎁 Klaim Hadiah Kunjungan Spot (+30 PTS)"}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
