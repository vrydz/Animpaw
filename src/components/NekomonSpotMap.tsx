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
  Footprints,
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
  Check
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
  userPoints: number;
  token?: string;
}

// Default center: Jakarta Monas (-6.1754, 106.8272)
const DEFAULT_CENTER = { lat: -6.1754, lng: 106.8272 };

export const NekomonSpotMap: React.FC<NekomonSpotMapProps> = ({
  onSelectSpotToCapture,
  userPoints,
  token
}) => {
  const { language } = useLanguage();
  
  // Player state
  const [playerPos, setPlayerPos] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);
  const [prevPos, setPrevPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isRealGps, setIsRealGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  
  // Spots state
  const [spots, setSpots] = useState<NekomonSpot[]>([]);
  const [communitySpots, setCommunitySpots] = useState<NekomonSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<NekomonSpot | null>(null);
  const [filterCategory, setFilterCategory] = useState<SpotCategory | "all" | "community">("all");
  
  // Modals state
  const [showAddSpotModal, setShowAddSpotModal] = useState<boolean>(false);
  const [showQuestsModal, setShowQuestsModal] = useState<boolean>(false);
  
  // Community Spot Form State
  const [newSpotName, setNewSpotName] = useState<string>("");
  const [newSpotCategory, setNewSpotCategory] = useState<SpotCategory>("taman");
  const [newSpotTargetCat, setNewSpotTargetCat] = useState<string>("");
  const [newSpotElement, setNewSpotElement] = useState<"Api" | "Air" | "Tanah" | "Angin" | "Petir">("Air");
  const [newSpotDesc, setNewSpotDesc] = useState<string>("");
  const [isSubmittingSpot, setIsSubmittingSpot] = useState<boolean>(false);
  const [addSpotStatus, setAddSpotStatus] = useState<string | null>(null);

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

  // Fetch Community Spots from API
  const fetchCommunitySpots = async () => {
    try {
      const res = await fetch("/api/community-spots");
      if (res.ok) {
        const data = await res.json();
        if (data.spots && Array.isArray(data.spots)) {
          setCommunitySpots(data.spots);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch community spots:", e);
    }
  };

  useEffect(() => {
    fetchCommunitySpots();
  }, []);

  // Initialize Spots centered around initial player position
  useEffect(() => {
    const defaultGenerated = generateNekomonSpots(playerPos.lat, playerPos.lng);
    const combined = [...communitySpots, ...defaultGenerated];
    setSpots(combined);
    if (combined.length > 0 && !selectedSpot) {
      setSelectedSpot(combined[0]);
    }
  }, [communitySpots]);

  // Track Distance Traveled as player moves
  useEffect(() => {
    if (prevPos) {
      const dist = calculateDistanceMeters(prevPos.lat, prevPos.lng, playerPos.lat, playerPos.lng);
      if (dist > 0.5 && dist < 500) { // filter out unnatural teleports > 500m
        setDistanceTraveled((prev) => {
          const updated = prev + Math.round(dist);
          localStorage.setItem("nekomon_dist_traveled", updated.toString());
          return updated;
        });
      }
    }
    setPrevPos(playerPos);
  }, [playerPos]);

  // Request real GPS location if enabled
  useEffect(() => {
    if (!isRealGps) return;
    
    if (!("geolocation" in navigator)) {
      setGpsError(language === "id" ? "Browser tidak mendukung GPS Geolocation." : "Geolocation is not supported by your browser.");
      setIsRealGps(false);
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
        setGpsError(language === "id" ? "Gagal membaca GPS real. Menggunakan mode simulator." : "Failed to access real GPS. Switching to simulator.");
        setIsRealGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isRealGps, language]);

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

  // Teleport simulator control (moves player within ~10m of targeted spot)
  const handleTeleportToSpot = (spot: NekomonSpot) => {
    const near = offsetCoordinates(spot.lat, spot.lng, 6, 6);
    setPlayerPos(near);
    setSelectedSpot(spot);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([near.lat, near.lng], 18, { duration: 0.6 });
    }
    haptics.capture();
  };

  // Nudge player position in meters (Simulator mode)
  const handleNudgePlayer = (deltaNorth: number, deltaEast: number) => {
    const updated = offsetCoordinates(playerPos.lat, playerPos.lng, deltaNorth, deltaEast);
    setPlayerPos(updated);
    haptics.tap();
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

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[540px] flex flex-col bg-slate-950 overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      
      {/* MAP TOP HUD HEADER */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-slate-950 font-black shadow-md">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
              {language === "id" ? "Peta Spot Nekomon" : "Nekomon Spot Map"}
              <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                GPS Radar
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {language === "id" ? "Mendekatlah ke titik spot (< 25m) untuk memotret kucing" : "Get close to spot radius (< 25m) to capture cat"}
            </p>
          </div>
        </div>

        {/* Top HUD Buttons: Quests & Add Community Spot */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <button
            onClick={() => setShowQuestsModal(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer uppercase"
          >
            <Gift className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>Quest Harian</span>
          </button>

          <button
            onClick={() => setShowAddSpotModal(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer uppercase"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Spot Komunitas</span>
          </button>

          <button
            onClick={() => setIsRealGps(!isRealGps)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              isRealGps
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 animate-pulse"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            {isRealGps ? "GPS Real" : "Simulator"}
          </button>

          <button
            onClick={handleRespawnSpots}
            title={language === "id" ? "Respawn Spot Baru" : "Respawn New Spots"}
            className="p-2 bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* LEAFLET MAP CONTAINER */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0 bg-slate-900" />

      {/* MAP FLOATING CONTROLS (Recenter & Directional Nudges) */}
      <div className="absolute right-3 top-24 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          title={language === "id" ? "Ke Lokasi Saya" : "Recenter Player"}
          className="p-3 bg-slate-900/90 text-cyan-400 hover:text-white hover:bg-cyan-600 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {!isRealGps && (
          <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Jalan</span>
            <button
              onClick={() => handleNudgePlayer(10, 0)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
              title="Utara +10m"
            >
              ▲
            </button>
            <div className="flex gap-1">
              <button
                onClick={() => handleNudgePlayer(0, -10)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
                title="Barat -10m"
              >
                ◀
              </button>
              <button
                onClick={() => handleNudgePlayer(0, 10)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
                title="Timur +10m"
              >
                ▶
              </button>
            </div>
            <button
              onClick={() => handleNudgePlayer(-10, 0)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
              title="Selatan -10m"
            >
              ▼
            </button>
          </div>
        )}
      </div>

      {/* CATEGORY FILTER CHIPS */}
      <div className="absolute left-3 top-24 z-[1000] flex flex-col gap-1 max-w-[135px]">
        {(["all", "community", "taman", "cafe", "stasiun", "lapangan"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl text-left border backdrop-blur-md transition-all ${
              filterCategory === cat
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black"
                : "bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            {cat === "all" ? "🌐 Semua Spot" : cat === "community" ? "👥 Komunitas" : cat === "taman" ? "🌳 Taman" : cat === "cafe" ? "☕ Cafe" : cat === "stasiun" ? "🚉 Stasiun" : "⚽ Lapangan"}
          </button>
        ))}
      </div>

      {/* SELECTED SPOT HUD PANEL (BOTTOM CARDS) */}
      <AnimatePresence>
        {selectedSpot && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-3 left-3 right-3 z-[1000] p-4 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col gap-3"
          >
            {/* Spot Header Info */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                  selectedSpot.isCommunity 
                    ? "bg-purple-900/40 border border-purple-500/60 text-purple-200"
                    : "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300"
                }`}>
                  {selectedSpot.iconEmoji}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedSpot.isCommunity && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-purple-900 text-purple-200 rounded-md border border-purple-500">
                        👥 Komunitas
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-800 text-amber-400 rounded-md border border-slate-700">
                      {selectedSpot.categoryLabel}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-md ${
                      selectedSpot.rarity === "Legend" ? "bg-purple-950 text-purple-300 border border-purple-500" :
                      selectedSpot.rarity === "Epic" ? "bg-indigo-950 text-indigo-300 border border-indigo-500" :
                      selectedSpot.rarity === "Rare" ? "bg-cyan-950 text-cyan-300 border border-cyan-500" :
                      "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}>
                      {selectedSpot.rarity}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white mt-0.5 flex items-center gap-1.5">
                    {selectedSpot.name}
                  </h4>
                  {selectedSpot.submittedBy && (
                    <span className="text-[10px] text-slate-400 block">
                      Direkomendasikan oleh: <strong className="text-purple-300">@{selectedSpot.submittedBy}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Distance & Upvote */}
              <div className="text-right flex flex-col items-end gap-1">
                <div className={`px-3 py-1.5 rounded-2xl border text-xs font-black flex items-center gap-1.5 shadow-md ${
                  isInRange 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse" 
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}>
                  <Target className="w-3.5 h-3.5" />
                  <span>Jarak: {formatDistance(currentDist)}</span>
                </div>

                {selectedSpot.isCommunity && (
                  <button
                    onClick={() => handleVoteCommunitySpot(selectedSpot.id)}
                    className="px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 rounded-xl text-[10px] font-bold text-purple-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <ThumbsUp className="w-3 h-3 text-purple-400" />
                    <span>Valid! ({selectedSpot.votes || 1})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Spot Perks & Target Cat */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Target Kucing:</span>
                  <strong className="text-amber-300">{selectedSpot.targetCatName}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Bonus Spot:</span>
                  <strong className="text-cyan-300">+{selectedSpot.bonusPoints} Poin ({selectedSpot.boostedElement})</strong>
                </div>
              </div>
            </div>

            {/* ACTION BUTTON & SIMULATOR TELEPORT */}
            <div className="flex flex-col gap-2">
              {isInRange ? (
                <button
                  onClick={() => {
                    haptics.capture();
                    onSelectSpotToCapture(selectedSpot);
                  }}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>MEMOTRET & TANGKAP KUCING SPOT ({selectedSpot.iconEmoji})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 py-3 px-3 bg-slate-950/80 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Harus mendekat ke radius {selectedSpot.radiusMeters}m! (Kurang {currentDist - selectedSpot.radiusMeters}m)</span>
                  </div>

                  {!isRealGps && (
                    <button
                      onClick={() => handleTeleportToSpot(selectedSpot)}
                      className="px-3 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
                      title="Teleport Simulator Dekat Spot Ini"
                    >
                      <Footprints className="w-4 h-4" />
                      <span>Teleport</span>
                    </button>
                  )}
                </div>
              )}
            </div>

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
                      <option value="cafe">☕ Cafe Kucing</option>
                      <option value="stasiun">🚉 Stasiun Cat</option>
                      <option value="lapangan">⚽ Lapangan</option>
                      <option value="mall">🛍️ Mall & Plaza</option>
                      <option value="pantai">🏖️ Area Pantai</option>
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
