import React, { useRef, useState, useEffect } from "react";
import { Camera, Sparkles, RefreshCw, AlertTriangle, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";

interface VirtualCameraProps {
  onCapture: (base64Photo: string) => Promise<void>;
  userPoints: number;
}

export const VirtualCamera: React.FC<VirtualCameraProps> = ({ onCapture, userPoints }) => {
  const { language, t } = useLanguage();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showPointsToast, setShowPointsToast] = useState<boolean>(false);

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

  // Start Camera Stream
  const startCamera = async () => {
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

  // Capture Photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        
        await onCapture(base64);
        setShowPointsToast(true);
        setTimeout(() => setShowPointsToast(false), 3000);
        stopCamera();
      }
    } catch (e) {
      console.error("Error capturing photo:", e);
    } finally {
      setIsCapturing(false);
    }
  };

  // Hanya bisa diperoleh dari hasil buruan camera asli

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
            <span>{language === "id" ? "Kucing Ditangkap! +10 Poin 🐾" : "Cat Captured! +10 Points 🐾"}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Container */}
      <div className="relative aspect-[3/4] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-center items-center group">
        
        {/* Hidden Canvas for capture drawing */}
        <canvas ref={canvasRef} className="hidden" />

        {cameraActive && !cameraError ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover cursor-pointer"
              onClick={capturePhoto}
              title={language === "id" ? "Ketuk layar untuk ambil foto" : "Tap screen to take photo"}
            />

            {/* Capture Shutter Button */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1">
              <button
                onClick={capturePhoto}
                disabled={isCapturing}
                className="w-14 h-14 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-full border-4 border-white flex items-center justify-center shadow-lg transition-transform cursor-pointer disabled:opacity-50"
                title={language === "id" ? "Ambil Foto" : "Take Photo"}
              >
                <div className="w-6 h-6 rounded-full bg-white animate-pulse" />
              </button>
              <span className="text-[9px] text-white/90 font-mono bg-slate-950/80 px-2 py-0.5 rounded-md font-bold tracking-wider shadow-sm">
                {(language === "id" ? "AMBIL FOTO" : "CAPTURE PHOTO")} 📸
              </span>
            </div>
            
            {/* Camera Overlay HUD */}
            <div className="absolute inset-0 border-2 border-dashed border-yellow-500/30 m-6 pointer-events-none rounded-lg flex items-center justify-center">
              <div className="w-12 h-12 border-t-2 border-l-2 border-yellow-500 absolute top-0 left-0"></div>
              <div className="w-12 h-12 border-t-2 border-r-2 border-yellow-500 absolute top-0 right-0"></div>
              <div className="w-12 h-12 border-b-2 border-l-2 border-yellow-500 absolute bottom-0 left-0"></div>
              <div className="w-12 h-12 border-b-2 border-r-2 border-yellow-500 absolute bottom-0 right-0"></div>
              <span className="text-[10px] text-yellow-500/60 font-mono tracking-widest uppercase">Target Nekomon</span>
            </div>

            {/* Stop Camera Button */}
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 bg-slate-950/80 hover:bg-slate-950 text-slate-200 p-2 rounded-full border border-slate-800 transition-all text-xs flex items-center gap-1 z-30"
            >
              <RefreshCw className="w-3.5 h-3.5 rotate-45" />
              {language === "id" ? "Tutup Kamera" : "Close Camera"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className="w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center border border-slate-700 shadow-inner group-hover:scale-105 transition-all">
              <Camera className="w-8 h-8 text-yellow-500" />
            </div>
            
            <div>
              <h3 className="font-bold text-slate-200 text-lg">
                {language === "id" ? "Tangkap Kucing Aktif" : "Capture Active Cat"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                {language === "id"
                  ? "Gunakan kamera ponsel/laptop Anda untuk memfoto kucing asli di sekitar untuk menambah +10 Poin."
                  : "Use your device camera to take a photo of a real cat around you to earn +10 Points."}
              </p>
            </div>

            <button
              onClick={startCamera}
              disabled={isCapturing}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-md shadow-yellow-500/10 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {language === "id" ? "Aktifkan Kamera" : "Activate Camera"}
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {isCapturing && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
            <span className="text-sm font-bold text-slate-200">
              {language === "id" ? "Menyimpan Foto..." : "Saving Photo..."}
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

      {/* Hanya diperbolehkan menangkap lewat Kamera secara langsung */}

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
