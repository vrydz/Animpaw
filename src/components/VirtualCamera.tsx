import React, { useRef, useState, useEffect } from "react";
import { 
  Camera, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  MapPin, 
  Zap, 
  X,
  Scan,
  Target,
  Crosshair,
  Activity,
  Eye,
  Radio,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { haptics } from "../lib/vibration";
import { NekomonSpot } from "../types";

interface VirtualCameraProps {
  onCapture: (base64Photo: string, spotId?: string, spotName?: string, lat?: number, lng?: number, locationName?: string) => Promise<void>;
  userPoints: number;
  activeSpot?: NekomonSpot | null;
  onClearSpot?: () => void;
  spotCapturesTodayCount?: number;
}

export const VirtualCamera: React.FC<VirtualCameraProps> = ({ 
  onCapture, 
  userPoints,
  activeSpot,
  onClearSpot,
  spotCapturesTodayCount = 0
}) => {
  const { language, t } = useLanguage();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showPointsToast, setShowPointsToast] = useState<boolean>(false);
  const [capturedDraft, setCapturedDraft] = useState<string | null>(null);

  // Geolocation State for Captured Photos
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLocating, setGeoLocating] = useState<boolean>(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  // Fetch / update geolocation
  const fetchGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus(language === "id" ? "Geolocation tidak didukung" : "Geolocation not supported");
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6))
        });
        setGeoLocating(false);
        setGeoStatus(null);
      },
      (err) => {
        console.warn("Geolocation notice:", err.message);
        setGeoLocating(false);
        setGeoStatus(language === "id" ? "GPS Opsional / Izin Lokasi Nonaktif" : "GPS Optional / Permission Disabled");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    fetchGeolocation();
  }, []);

  // AR Scanner Overlay States
  const [arEnabled, setArEnabled] = useState<boolean>(true);
  const [arTheme, setArTheme] = useState<"cyan" | "emerald" | "amber">("cyan");
  const [targetLockConfidence, setTargetLockConfidence] = useState<number>(85);
  const [detectedFeatureText, setDetectedFeatureText] = useState<string>("Sinyal Kucing Terdeteksi");
  const [boxCoords, setBoxCoords] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 25,
    y: 30,
    w: 50,
    h: 40
  });

  // Pinch-to-Zoom Scale & Touch Gesture States
  const [zoomScale, setZoomScale] = useState<number>(1);
  const touchStartDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      initialZoomRef.current = zoomScale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartDistRef.current > 0) {
        const factor = currentDist / touchStartDistRef.current;
        const newZoom = Math.min(Math.max(1, initialZoomRef.current * factor), 4);
        setZoomScale(Number(newZoom.toFixed(2)));
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Real-time AR Scanner Simulation Loop (Bounding box motion & target detection confidence)
  useEffect(() => {
    if (!cameraActive || !arEnabled) return;

    const features = [
      language === "id" ? "Pola Telinga Kucing Terdeteksi 🐾" : "Cat Ear Pattern Detected 🐾",
      language === "id" ? "Deteksi Panas Feline Matrix (98.4%)" : "Feline Heat Matrix (98.4%)",
      language === "id" ? "Mata & Kumis Nekomon Terunci 🎯" : "Nekomon Eye & Whiskers Locked 🎯",
      language === "id" ? "Deteksi Gerakan Ekor & Aura 🌟" : "Tail & Aura Motion Tracked 🌟",
      activeSpot 
        ? `${language === "id" ? "Target Spot Matched:" : "Target Spot Matched:"} ${activeSpot.targetCatName}` 
        : language === "id" ? "Aura Nekomon Liar Terkonfirmasi!" : "Wild Nekomon Aura Confirmed!"
    ];

    let frameCount = 0;
    const interval = setInterval(() => {
      frameCount += 1;
      
      // Smooth sinusoidal floating box motion
      const newX = 22 + Math.sin(frameCount * 0.15) * 8;
      const newY = 25 + Math.cos(frameCount * 0.12) * 6;
      const newW = 52 + Math.sin(frameCount * 0.1) * 4;
      const newH = 42 + Math.cos(frameCount * 0.15) * 3;
      
      setBoxCoords({ x: Math.max(10, newX), y: Math.max(15, newY), w: newW, h: newH });

      // Dynamic confidence score pulsing between 82% and 99%
      const conf = Math.floor(84 + Math.sin(frameCount * 0.3) * 12 + Math.random() * 3);
      setTargetLockConfidence(Math.min(99, Math.max(75, conf)));

      // Rotate detected text every few ticks
      if (frameCount % 18 === 0) {
        const nextFeature = features[Math.floor(Math.random() * features.length)];
        setDetectedFeatureText(nextFeature);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [cameraActive, arEnabled, language, activeSpot]);

  // Start Camera Stream
  const startCamera = async () => {
    haptics.tap();
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
        audio: false,
      });
      
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError(
        language === "id"
          ? "Gagal mengakses kamera. Pastikan memberikan izin kamera agar dapat memfoto kucing asli."
          : "Failed to access camera. Please make sure camera permissions are granted to photograph real cats."
      );
      setCameraActive(false);
    }
  };

  // Bind stream to video element when it mounts or stream is acquired
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error("Video play failed in useEffect:", err);
      });
    }
  }, [cameraActive, stream]);

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Capture Photo Draft for Preview & Retake
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    haptics.capture();

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Handle crop if zoomed in
        if (zoomScale > 1) {
          const cropW = canvas.width / zoomScale;
          const cropH = canvas.height / zoomScale;
          const cropX = (canvas.width - cropW) / 2;
          const cropY = (canvas.height - cropH) / 2;
          ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        } else {
          // Standard full video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedDraft(base64);
      }
    } catch (e) {
      console.error("Error capturing photo draft:", e);
    }
  };

  // Confirm photo capture submission
  const handleConfirmPhoto = async () => {
    if (!capturedDraft) return;
    setIsCapturing(true);
    try {
      await onCapture(
        capturedDraft,
        activeSpot?.id,
        activeSpot?.name,
        currentLocation?.lat,
        currentLocation?.lng,
        activeSpot?.name || (currentLocation ? `GPS (${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)})` : undefined)
      );
      setShowPointsToast(true);
      setTimeout(() => setShowPointsToast(false), 3000);
      setCapturedDraft(null);
      stopCamera();
    } catch (e) {
      console.error("Error submitting captured photo:", e);
    } finally {
      setIsCapturing(false);
    }
  };

  // Retake Photo (Clear current preview draft to take a new angle)
  const handleRetakePhoto = () => {
    haptics.tap();
    setCapturedDraft(null);
  };

  const themeColors = {
    cyan: {
      border: "border-cyan-400",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      badge: "bg-cyan-950/80 text-cyan-300 border-cyan-500/50",
      reticle: "border-cyan-400/80"
    },
    emerald: {
      border: "border-emerald-400",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      badge: "bg-emerald-950/80 text-emerald-300 border-emerald-500/50",
      reticle: "border-emerald-400/80"
    },
    amber: {
      border: "border-amber-400",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      badge: "bg-amber-950/80 text-amber-300 border-amber-500/50",
      reticle: "border-amber-400/80"
    }
  };

  const currentTheme = themeColors[arTheme] || themeColors.cyan;

  return (
    <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl max-w-md w-full mx-auto relative overflow-hidden">
      {/* Dynamic Points Indicator Gained Toast */}
      <AnimatePresence>
        {showPointsToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-1.5 border border-yellow-300"
          >
            <Sparkles className="w-5 h-5 animate-bounce" />
            <span>
              {activeSpot
                ? `Kucing Spot Tangkap! +${10 + activeSpot.bonusPoints} Poin (${activeSpot.boostedElement}) 🐾`
                : language === "id"
                ? "Kucing Ditangkap! +10 Poin 🐾"
                : "Cat Captured! +10 Points 🐾"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Nekomon Spot Header Banner */}
      {activeSpot && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeSpot.iconEmoji}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded">
                  Spot Aktif
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {activeSpot.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                Bonus +{activeSpot.bonusPoints} Poin ({activeSpot.boostedElement}) • Target: {activeSpot.targetCatName}
              </p>
            </div>
          </div>

          {onClearSpot && (
            <button
              onClick={onClearSpot}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
              title="Lepas Spot"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* SPOT DAILY LIMIT WARNING IF 3/3 REACHED */}
      {activeSpot && spotCapturesTodayCount >= 3 && (
        <div className="bg-rose-950/90 border border-rose-500/50 p-2.5 rounded-xl text-xs text-rose-200 flex items-center gap-2 font-mono shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          <div className="leading-tight">
            <strong className="text-rose-300 block font-bold">🚫 Batas Spot Harian 3/3 Kucing!</strong>
            <span className="text-[10px] text-slate-300">Anda sudah menangkap 3 kucing di spot ini hari ini. Silakan pindah berburu di spot lokasi lain!</span>
          </div>
        </div>
      )}

      {/* Screen Container */}
      <div className="relative aspect-[3/4] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-center items-center group">
        
        {/* Hidden Canvas for capture drawing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* PREVIEW & RETAKE OVERLAY DRAFT */}
        {capturedDraft ? (
          <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-between p-3 z-30">
            {/* Top Status */}
            <div className="w-full bg-slate-900/90 border border-slate-800 p-2 rounded-xl flex items-center justify-between text-xs z-10">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                {language === "id" ? "Pratinjau Hasil Foto Kucing" : "Cat Photo Preview"}
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                Angle Terkunci
              </span>
            </div>

            {/* Photo Image Frame */}
            <div className="relative flex-1 w-full my-2 overflow-hidden rounded-xl border-2 border-amber-500/40 shadow-2xl bg-black">
              <img
                src={capturedDraft}
                alt="Draft Cat Capture"
                className="w-full h-full object-cover"
              />

              {/* Geolocation Tag Overlay on Photo */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700/80 flex items-center justify-between text-[10px] font-mono text-slate-300 shadow-lg">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {activeSpot?.name || (currentLocation ? `Lat: ${currentLocation.lat.toFixed(4)}, Lng: ${currentLocation.lng.toFixed(4)}` : (language === "id" ? "Lokasi: Belum terdeteksi" : "Location: Undetected"))}
                  </span>
                </div>
                {currentLocation && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                    GPS OK
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons: Retake, Delete, Confirm */}
            <div className="w-full grid grid-cols-3 gap-2 pt-1 z-10">
              <button
                onClick={handleRetakePhoto}
                disabled={isCapturing}
                className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
                title="Foto ulang jika angle/pencahayaan belum pas"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Foto Ulang</span>
              </button>

              <button
                onClick={() => setCapturedDraft(null)}
                disabled={isCapturing}
                className="py-2.5 px-2 bg-rose-950/80 hover:bg-rose-900 active:scale-95 text-rose-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all border border-rose-800/80 cursor-pointer disabled:opacity-50"
                title="Hapus foto ini"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>

              <button
                onClick={handleConfirmPhoto}
                disabled={isCapturing || (activeSpot !== null && activeSpot !== undefined && spotCapturesTodayCount >= 3)}
                className="py-2.5 px-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isCapturing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 font-black" />
                )}
                <span>Simpan</span>
              </button>
            </div>
          </div>
        ) : cameraActive && !cameraError ? (
          <div 
            className="relative w-full h-full select-none overflow-hidden touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover cursor-pointer transition-transform duration-100 ease-out origin-center"
              style={{
                transform: `scale(${zoomScale})`
              }}
              onClick={capturePhoto}
              title={language === "id" ? "Ketuk layar untuk ambil foto (Cubit/Pinch untuk Zoom)" : "Tap screen to take photo (Pinch to Zoom)"}
            />

            {/* REAL-TIME AR NEKOMON SCANNER OVERLAY */}
            {arEnabled && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                
                {/* 1. Tactical HUD Corner Reticles */}
                <div className="absolute inset-4 border border-slate-700/30 rounded-xl pointer-events-none">
                  <div className={`w-6 h-6 border-t-2 border-l-2 ${currentTheme.border} absolute top-0 left-0 rounded-tl-lg`} />
                  <div className={`w-6 h-6 border-t-2 border-r-2 ${currentTheme.border} absolute top-0 right-0 rounded-tr-lg`} />
                  <div className={`w-6 h-6 border-b-2 border-l-2 ${currentTheme.border} absolute bottom-0 left-0 rounded-bl-lg`} />
                  <div className={`w-6 h-6 border-b-2 border-r-2 ${currentTheme.border} absolute bottom-0 right-0 rounded-br-lg`} />
                </div>

                {/* 2. Top Telemetry HUD Strip */}
                <div className="absolute top-4 left-6 right-16 flex items-center justify-between text-[10px] font-mono bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <Activity className={`w-3.5 h-3.5 ${currentTheme.text} animate-pulse`} />
                    <span className="font-bold uppercase tracking-wider">AR SCANNER V2.4</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">LOCK:</span>
                    <strong className={`${currentTheme.text} font-black`}>{targetLockConfidence}%</strong>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                </div>

                {/* 3. DYNAMIC AR BOUNDING BOX OVERLAY (Tracking Target Cat) */}
                <div 
                  className={`absolute border-2 ${currentTheme.border} ${currentTheme.bg} rounded-2xl transition-all duration-300 ease-out shadow-2xl flex flex-col justify-between p-2`}
                  style={{
                    left: `${boxCoords.x}%`,
                    top: `${boxCoords.y}%`,
                    width: `${boxCoords.w}%`,
                    height: `${boxCoords.h}%`
                  }}
                >
                  {/* Bounding Box Corner Brackets */}
                  <div className={`w-3 h-3 border-t-2 border-l-2 ${currentTheme.border} absolute -top-1 -left-1`} />
                  <div className={`w-3 h-3 border-t-2 border-r-2 ${currentTheme.border} absolute -top-1 -right-1`} />
                  <div className={`w-3 h-3 border-b-2 border-l-2 ${currentTheme.border} absolute -bottom-1 -left-1`} />
                  <div className={`w-3 h-3 border-b-2 border-r-2 ${currentTheme.border} absolute -bottom-1 -right-1`} />

                  {/* Top Bounding Box Label */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider ${currentTheme.badge} flex items-center gap-1 shadow-sm`}>
                      <Target className="w-3 h-3 animate-spin" />
                      NEKOMON LOCK
                    </span>
                    <span className="text-[9px] font-mono text-white/90 bg-slate-950/90 px-1.5 py-0.5 rounded font-bold border border-slate-700">
                      {targetLockConfidence > 90 ? "PROBABILITY 99%" : "MATCHING..."}
                    </span>
                  </div>

                  {/* Center Target Crosshair within Bounding Box */}
                  <div className="self-center my-auto relative flex items-center justify-center">
                    <div className={`w-10 h-10 border border-dashed ${currentTheme.border} rounded-full animate-spin-slow flex items-center justify-center`}>
                      <div className={`w-2 h-2 rounded-full ${targetLockConfidence > 90 ? "bg-emerald-400" : "bg-cyan-400"} animate-ping`} />
                    </div>
                  </div>

                  {/* Bottom Bounding Box Detected Feature readout */}
                  <div className="bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 flex items-center justify-between text-[9px] font-mono">
                    <span className="text-white font-bold truncate max-w-[130px]">{detectedFeatureText}</span>
                    <span className={`${currentTheme.text} font-black`}>
                      {activeSpot ? activeSpot.boostedElement : "Wild"}
                    </span>
                  </div>
                </div>

                {/* 4. Bottom Grid Scanner Lines */}
                <div className="absolute bottom-16 left-6 right-6 flex items-center justify-between text-[9px] font-mono text-slate-400 pointer-events-none">
                  <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                    DIST: ~1.2m
                  </span>
                  <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-amber-300">
                    AURA MATRIX: STABLE
                  </span>
                </div>
              </div>
            )}

            {/* CAMERA ZOOM CONTROLS (Bottom-Left) */}
            <div className="absolute bottom-5 left-4 z-30 flex items-center gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setZoomScale(prev => Math.max(1, Number((prev - 0.25).toFixed(2))))}
                disabled={zoomScale <= 1}
                className="p-1.5 hover:bg-slate-800 text-slate-300 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              
              <span className="text-[10px] font-mono font-bold text-yellow-400 px-1.5 min-w-[32px] text-center">
                {zoomScale.toFixed(1)}x
              </span>

              <button
                onClick={() => setZoomScale(prev => Math.min(4, Number((prev + 0.25).toFixed(2))))}
                disabled={zoomScale >= 4}
                className="p-1.5 hover:bg-slate-800 text-slate-300 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AR SCANNER TOGGLE & THEME CONTROLS (Top-Right) */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
              <button
                onClick={() => setArEnabled(!arEnabled)}
                className={`p-2 rounded-xl text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer ${
                  arEnabled
                    ? "bg-cyan-950/90 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-950/50"
                    : "bg-slate-950/80 text-slate-400 border-slate-800"
                }`}
                title="Toggle AR Scanner Effect"
              >
                <Scan className={`w-4 h-4 ${arEnabled ? "animate-pulse text-cyan-400" : ""}`} />
                <span className="hidden sm:inline">{arEnabled ? "AR ON" : "AR OFF"}</span>
              </button>

              {arEnabled && (
                <button
                  onClick={() => {
                    const themes: Array<"cyan" | "emerald" | "amber"> = ["cyan", "emerald", "amber"];
                    const next = themes[(themes.indexOf(arTheme) + 1) % themes.length];
                    setArTheme(next);
                  }}
                  className="p-2 rounded-xl text-xs font-bold border bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 cursor-pointer"
                  title="Ganti Warna Sensor AR"
                >
                  <Eye className={`w-4 h-4 ${currentTheme.text}`} />
                </button>
              )}

              {/* Stop Camera Button */}
              <button
                onClick={stopCamera}
                className="bg-slate-950/80 hover:bg-slate-950 text-slate-200 p-2 rounded-xl border border-slate-800 transition-all text-xs flex items-center gap-1 cursor-pointer"
                title={language === "id" ? "Tutup Kamera" : "Close Camera"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Capture Shutter Button */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1">
              <button
                onClick={capturePhoto}
                disabled={isCapturing}
                className="w-16 h-16 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-full border-4 border-white flex items-center justify-center shadow-2xl shadow-red-600/50 transition-transform cursor-pointer disabled:opacity-50"
                title={language === "id" ? "Ambil Foto Kucing" : "Take Cat Photo"}
              >
                <div className="w-7 h-7 rounded-full bg-white animate-pulse" />
              </button>
              <span className="text-[9px] text-white font-mono bg-slate-950/90 px-2.5 py-0.5 rounded-full font-black tracking-wider shadow-md border border-slate-800">
                {(language === "id" ? "AMBIL FOTO KUCING" : "CAPTURE CAT")} 📸
              </span>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className="w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center border border-slate-700 shadow-inner group-hover:scale-105 transition-all">
              <Camera className="w-8 h-8 text-yellow-500" />
            </div>
            
            <div>
              <h3 className="font-bold text-slate-200 text-lg">
                {language === "id" ? "Tangkap Kucing & AR Scanner" : "Capture Cat & AR Scanner"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                {language === "id"
                  ? "Gunakan kamera dengan AR Nekomon Overlay untuk memfoto kucing asli di sekitar untuk menambah +10 Poin."
                  : "Use your device camera with AR Nekomon Overlay to take a photo of a real cat around you to earn +10 Points."}
              </p>
            </div>

            <button
              onClick={startCamera}
              disabled={isCapturing}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-md shadow-yellow-500/10 flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              {language === "id" ? "Aktifkan Kamera & AR" : "Activate Camera & AR"}
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {isCapturing && (
          <div className="absolute inset-0 bg-slate-950/85 z-40 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
            <span className="text-sm font-bold text-slate-200">
              {language === "id" ? "Verifikasi & Menyimpan Kucing..." : "Verifying & Saving Cat..."}
            </span>
          </div>
        )}

        {/* Camera Access Error Message */}
        {cameraError && !cameraActive && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-950/90 border border-red-500/30 p-2.5 rounded-lg text-center flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-[10px] text-red-300 text-left leading-tight">{cameraError}</span>
          </div>
        )}
      </div>

      {/* Capture Stats HUD */}
      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
        <span className="text-slate-400">{language === "id" ? "Total Koin:" : "Total Coins:"}</span>
        <span className="font-bold text-yellow-500 flex items-center gap-1">
          {userPoints} {t("common.points")} 🐾
        </span>
      </div>
    </div>
  );
};
;
