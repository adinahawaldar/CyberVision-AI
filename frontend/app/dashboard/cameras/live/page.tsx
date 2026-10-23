"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Grid, 
  Maximize2, 
  Minimize2, 
  Pause, 
  Play, 
  Eye, 
  EyeOff, 
  Sparkles,
  RefreshCw,
  Camera as CameraIcon,
  PlusCircle,
  ShieldAlert,
  Edit3,
  RotateCcw,
  Video,
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Volume2,
  VolumeX
} from "lucide-react";
import { getCamerasClient } from "@/lib/data/cameras";
import { Camera } from "@/lib/types";

// Ray-Casting (Jordan Curve) Point-in-Polygon Algorithm
// Checks if point (px, py) is strictly inside a polygon of vertices [{x, y}, ...]
export function isPointInPolygon(
  point: { x: number; y: number },
  polygon: { x: number; y: number }[]
): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Fallback demo cameras
const DEFAULT_CAMERAS: Camera[] = [
  { 
    id: "cam-webcam-0", 
    name: "Camera 01 - Laboratory Entrance (Laptop Webcam)", 
    location: "Laboratory Entrance", 
    status: "online",
    streamUrl: "http://localhost:8000/api/v1/streaming/live/cam-webcam-0",
    hlsUrl: "http://localhost:8000/api/v1/streaming/live/cam-webcam-0",
    thumbnailUrl: "/camera-placeholder.jpg",
    aiFeatures: ["Restricted Zone", "YOLOv8"],
    model: "HD Integrated Webcam",
    isStreaming: true
  },
  { 
    id: "cam-synthetic-2", 
    name: "Camera 02 - Perimeter Patrol", 
    location: "Perimeter North", 
    status: "online",
    streamUrl: "http://localhost:8000/api/v1/streaming/live/cam-synthetic-2",
    hlsUrl: "http://localhost:8000/api/v1/streaming/live/cam-synthetic-2",
    thumbnailUrl: "/camera-placeholder.jpg",
    aiFeatures: [],
    model: "CyberVision 4K PTZ",
    isStreaming: true
  },
  { 
    id: "cam-synthetic-3", 
    name: "Camera 03 - Server Vault", 
    location: "Secure Server Room", 
    status: "online",
    streamUrl: "http://localhost:8000/api/v1/streaming/live/cam-synthetic-3",
    hlsUrl: "http://localhost:8000/api/v1/streaming/live/cam-synthetic-3",
    thumbnailUrl: "/camera-placeholder.jpg",
    aiFeatures: [],
    model: "Infrared Secure Dome",
    isStreaming: true
  }
];

// Default Laboratory Entrance Polygon Boundary in normalized (0.0 to 1.0) coordinates
const DEFAULT_LAB_ENTRANCE_ZONE = [
  { x: 0.18, y: 0.28 },
  { x: 0.54, y: 0.22 },
  { x: 0.58, y: 0.78 },
  { x: 0.16, y: 0.82 }
];

interface LiveCameraFeedProps {
  camera: Camera;
  isFullscreen: boolean;
  withDetection: boolean;
  onToggleFullscreen: (id: string) => void;
  onToggleDetection: (id: string) => void;
}

const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  camera,
  isFullscreen,
  withDetection,
  onToggleFullscreen,
  onToggleDetection
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useLocalWebcam, setUseLocalWebcam] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);

  // Restricted Area Boundary State
  const [showZone, setShowZone] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zonePoints, setZonePoints] = useState<{ x: number; y: number }[]>(DEFAULT_LAB_ENTRANCE_ZONE);
  const [tempPoints, setTempPoints] = useState<{ x: number; y: number }[]>([]);
  const [soundAlert, setSoundAlert] = useState(false);

  // Simulated / Tracked Person Reference Point (Feet position) in normalized 0.0 - 1.0
  const [refPoint, setRefPoint] = useState<{ x: number; y: number }>({ x: 0.35, y: 0.52 });
  const [isBreached, setIsBreached] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Stream URL from FastAPI backend
  const streamUrl = `http://localhost:8000/api/v1/streaming/live/${camera.id}${withDetection ? '' : '?raw=true'}`;

  // Start real laptop camera directly via getUserMedia
  const startRealLaptopCamera = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert("Webcam access not supported in this browser environment.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setUseLocalWebcam(true);
      setWebcamActive(true);
      setHasError(false);
    } catch (err: any) {
      console.warn("Could not start local laptop webcam:", err);
      alert("Please allow camera permissions in your browser to use your laptop webcam directly.");
    }
  };

  const stopRealLaptopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setUseLocalWebcam(false);
    setWebcamActive(false);
  };

  useEffect(() => {
    return () => {
      stopRealLaptopCamera();
    };
  }, []);

  // Beep sound on breach
  const playAlertBeep = useCallback(() => {
    if (!soundAlert) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch alarm
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, [soundAlert]);

  // Evaluate Point-in-Polygon boundary check whenever reference point or zone points change
  useEffect(() => {
    if (!showZone || zonePoints.length < 3) {
      setIsBreached(false);
      return;
    }
    const breached = isPointInPolygon(refPoint, zonePoints);
    if (breached && !isBreached) {
      playAlertBeep();
    }
    setIsBreached(breached);
  }, [refPoint, zonePoints, showZone, playAlertBeep, isBreached]);

  // Handle clicking on video container to draw boundary or position reference point
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (isDrawing) {
      const next = [...tempPoints, { x: nx, y: ny }];
      setTempPoints(next);
      if (next.length >= 4) {
        setZonePoints(next);
      }
    } else {
      // Reposition reference point (simulating a detected person's feet)
      setRefPoint({ x: nx, y: ny });
    }
  };

  const finishDrawing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tempPoints.length >= 3) {
      setZonePoints(tempPoints);
    }
    setIsDrawing(false);
    setTempPoints([]);
  };

  const resetToDefaultZone = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZonePoints(DEFAULT_LAB_ENTRANCE_ZONE);
    setTempPoints([]);
    setIsDrawing(false);
  };

  const activePoints = isDrawing && tempPoints.length > 0 ? tempPoints : zonePoints;
  const svgPointsStr = activePoints.map(p => `${p.x * 100},${p.y * 100}`).join(" ");

  return (
    <Card className={`overflow-hidden border border-border/40 bg-zinc-950/90 transition-all ${
      isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none bg-black' : 'h-full'
    }`}>
      <div className="relative h-full flex flex-col">
        {/* Live Video Feed Container */}
        <div 
          ref={containerRef}
          onClick={handleContainerClick}
          className={`relative aspect-video h-full w-full bg-black overflow-hidden flex items-center justify-center select-none ${
            isDrawing ? 'cursor-crosshair' : 'cursor-pointer'
          }`}
        >
          {/* Real Laptop Webcam (HTML5 MediaStream) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
              useLocalWebcam && webcamActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Backend MJPEG Stream */}
          {!useLocalWebcam && (
            isPlaying && !hasError ? (
              <img 
                src={streamUrl} 
                alt={camera.name} 
                className="h-full w-full object-cover select-none"
                onError={() => setHasError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 z-0">
                <CameraIcon className="w-10 h-10 text-muted-foreground/50 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-sm font-mono text-zinc-300 font-semibold">
                    {hasError ? "Vision Backend Offline" : "Feed Paused"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Start backend on port 8000 or click below to stream directly from your real laptop camera!
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button 
                    size="sm" 
                    className="h-8 text-xs bg-[#ff3538] hover:bg-[#e62e31] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRealLaptopCamera();
                    }}
                  >
                    <Video className="w-3.5 h-3.5 mr-1.5" /> Use Laptop Camera
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHasError(false);
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry Stream
                  </Button>
                </div>
              </div>
            )
          )}

          {/* RESTRICTED ZONE POLYGON OVERLAY (SVG) */}
          {showZone && activePoints.length >= 2 && (
            <svg 
              className="absolute inset-0 h-full w-full pointer-events-none z-20"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern id="hazardPattern" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="6" stroke={isBreached ? "#ef4444" : "#f59e0b"} strokeWidth="2" strokeOpacity="0.3" />
                </pattern>
              </defs>

              {/* Polygon fill & border */}
              {activePoints.length >= 3 && (
                <polygon
                  points={svgPointsStr}
                  fill={isBreached ? "rgba(239, 68, 68, 0.35)" : "rgba(245, 158, 11, 0.2)"}
                  stroke={isBreached ? "#ff0033" : "#f59e0b"}
                  strokeWidth="0.8"
                  strokeDasharray={isDrawing ? "2, 1" : "none"}
                  className={isBreached ? "animate-pulse" : ""}
                />
              )}

              {/* Polygon line connecting unclosed points in drawing mode */}
              {isDrawing && (
                <polyline
                  points={svgPointsStr}
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="0.8"
                />
              )}

              {/* Vertex handles */}
              {activePoints.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x * 100}
                    cy={pt.y * 100}
                    r={isBreached ? "1.6" : "1.3"}
                    fill={isBreached ? "#ff0033" : "#00f0ff"}
                    stroke="#ffffff"
                    strokeWidth="0.4"
                  />
                  <text
                    x={pt.x * 100 + 1.5}
                    y={pt.y * 100 - 1.5}
                    fill="#ffffff"
                    fontSize="2.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    P{idx + 1}
                  </text>
                </g>
              ))}

              {/* Zone Title Label in SVG center */}
              {activePoints.length >= 3 && (
                <text
                  x={activePoints.reduce((acc, p) => acc + p.x, 0) / activePoints.length * 100}
                  y={activePoints.reduce((acc, p) => acc + p.y, 0) / activePoints.length * 100}
                  fill="#ffffff"
                  fontSize="3"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                  className="select-none"
                >
                  {isBreached ? "⚠️ RESTRICTED AREA BREACH" : "RESTRICTED: LAB ENTRANCE"}
                </text>
              )}
            </svg>
          )}

          {/* SIMULATED PERSON DETECTION BOX & BOTTOM-CENTRE REFERENCE POINT */}
          {showZone && (
            <div 
              className="absolute pointer-events-none z-20 transition-all duration-150"
              style={{
                left: `calc(${refPoint.x * 100}% - 30px)`,
                top: `calc(${refPoint.y * 100}% - 70px)`,
                width: '60px',
                height: '70px'
              }}
            >
              {/* Bounding Box for Person */}
              <div className={`w-full h-full border-2 rounded-sm relative transition-colors ${
                isBreached 
                  ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(255,0,0,0.6)]' 
                  : 'border-emerald-400 bg-emerald-500/10'
              }`}>
                {/* Person tag badge */}
                <div className={`absolute -top-5 left-0 px-1 py-0.2 text-[9px] font-mono font-bold rounded text-black ${
                  isBreached ? 'bg-red-500 text-white' : 'bg-emerald-400'
                }`}>
                  PERSON 94%
                </div>

                {/* Bottom-Center Reference Point (Feet contact point on floor) */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full border-2 border-white flex items-center justify-center animate-ping absolute ${
                    isBreached ? 'bg-red-600' : 'bg-amber-400'
                  }`} />
                  <div className={`w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center relative z-10 ${
                    isBreached ? 'bg-red-600' : 'bg-amber-400'
                  }`}>
                    <Crosshair className="w-2.5 h-2.5 text-black" />
                  </div>
                  <span className="text-[8px] font-mono whitespace-nowrap bg-black/80 px-1 py-0.2 rounded text-white mt-1 border border-white/20">
                    Feet: ({refPoint.x.toFixed(2)}, {refPoint.y.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* HUD Top Left Badges */}
          <div className="absolute top-2 left-2 flex items-center gap-2 z-30">
            <Badge 
              variant={useLocalWebcam || (camera.status === "online" && !hasError) ? "default" : "destructive"} 
              className="h-5 px-2 py-0 text-[10px] font-mono tracking-wider font-semibold"
            >
              {useLocalWebcam ? "● LAPTOP WEBCAM" : (camera.status === "online" && !hasError ? "● LIVE STREAM" : "OFFLINE")}
            </Badge>
            <Badge variant="outline" className="bg-black/70 text-zinc-300 backdrop-blur-sm border-zinc-700 text-xs">
              {camera.location}
            </Badge>
            {withDetection && (
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> YOLOv8 AI
              </Badge>
            )}
          </div>

          {/* INTRUSION ALERT BANNER (TOP CENTER) */}
          {showZone && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              {isBreached ? (
                <div className="flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-mono font-bold shadow-lg shadow-red-600/50 animate-bounce border border-red-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  🚨 RESTRICTED AREA BREACH: LABORATORY ENTRANCE!
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md text-emerald-400 px-3 py-1 rounded-full text-[11px] font-mono border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  PERIMETER SECURE // Feet Reference Point Outside Boundary
                </div>
              )}
            </div>
          )}

          {/* DRAW ZONE CONTROLS TOOLBAR (TOP RIGHT) */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-30">
            {isDrawing ? (
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-lg border border-cyan-500/50">
                <span className="text-[11px] font-mono text-cyan-300 px-2">
                  Click on feed ({tempPoints.length}/4+ pts)
                </span>
                <Button 
                  size="sm" 
                  variant="default" 
                  className="h-6 text-[10px] px-2 bg-cyan-600 hover:bg-cyan-500 text-white"
                  onClick={finishDrawing}
                  disabled={tempPoints.length < 3}
                >
                  Close Polygon
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 text-[10px] px-2 text-zinc-400 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDrawing(false);
                    setTempPoints([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/10">
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-6 text-[11px] px-2 ${showZone ? 'text-amber-400 font-semibold' : 'text-zinc-400'}`}
                  title="Toggle Boundary Zone"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowZone(!showZone);
                  }}
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                  {showZone ? "Zone: ON" : "Zone: OFF"}
                </Button>

                {showZone && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[11px] px-2 text-cyan-300 hover:text-cyan-200"
                      title="Draw Custom 4+ Point Boundary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDrawing(true);
                        setTempPoints([]);
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> Draw Zone
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[11px] px-1 text-zinc-400 hover:text-white"
                      title="Reset to Laboratory Entrance Preset"
                      onClick={resetToDefaultZone}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[11px] px-1 text-zinc-400 hover:text-white"
                      title={soundAlert ? "Mute Alarm Sound" : "Enable Alarm Audio"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSoundAlert(!soundAlert);
                      }}
                    >
                      {soundAlert ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Instructions Hint (Bottom Left above label) */}
          <div className="absolute bottom-10 left-2 z-30 pointer-events-none">
            <span className="text-[10px] font-mono bg-black/75 px-2 py-0.5 rounded text-zinc-300 border border-white/10">
              💡 Tip: Click anywhere on video to move reference point (feet position)
            </span>
          </div>

          {/* HUD Overlay - Bottom Controls */}
          <div className="absolute bottom-2 right-2 flex gap-1.5 backdrop-blur-md bg-black/60 p-1 rounded-full border border-white/10 z-30">
            {/* Toggle Real Laptop Webcam vs Backend Stream */}
            <Button 
              size="icon" 
              variant="ghost" 
              className={`h-7 w-7 rounded-full text-white hover:bg-white/20 ${useLocalWebcam ? 'text-emerald-400 bg-white/10' : ''}`}
              title={useLocalWebcam ? "Switch to Backend Stream" : "Switch to Real Laptop Camera"}
              onClick={(e) => {
                e.stopPropagation();
                if (useLocalWebcam) {
                  stopRealLaptopCamera();
                } else {
                  startRealLaptopCamera();
                }
              }}
            >
              <Video size={14} />
            </Button>

            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 rounded-full text-white hover:bg-white/20"
              title={withDetection ? "Turn Off AI Overlays" : "Turn On AI Overlays"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleDetection(camera.id);
              }}
            >
              {withDetection ? <Eye size={14} className="text-cyan-400" /> : <EyeOff size={14} />}
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 rounded-full text-white hover:bg-white/20"
              title={isPlaying ? "Pause Stream" : "Play Stream"}
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 rounded-full text-white hover:bg-white/20"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Restricted Zone View"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFullscreen(camera.id);
              }}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
          </div>
          
          {/* Camera Name Label */}
          <div className="absolute bottom-2 left-2 z-30">
            <div className="rounded bg-black/70 backdrop-blur-md px-2 py-1 text-xs font-medium text-white border border-white/10 flex items-center gap-1.5">
              <span>{camera.name}</span>
              {isFullscreen && (
                <Badge variant="outline" className="text-[10px] py-0 px-1 border-cyan-500/50 text-cyan-300">
                  FULLSCREEN MONITORED
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function LiveViewPage() {
  const searchParams = useSearchParams();
  const spotlightId = searchParams.get("id");
  
  const [cameras, setCameras] = useState<Camera[]>(DEFAULT_CAMERAS);
  const [gridLayout, setGridLayout] = useState<"2x2" | "3x3">("2x2");
  const [fullscreenCamera, setFullscreenCamera] = useState<string | null>(spotlightId || "cam-webcam-0");
  const [detectionStates, setDetectionStates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchLiveCameras = async () => {
    setIsLoading(true);
    try {
      const data = await getCamerasClient();
      if (data && data.length > 0) {
        setCameras(data);
      } else {
        setCameras(DEFAULT_CAMERAS);
      }
    } catch (e) {
      console.error("Failed to load cameras, using defaults:", e);
      setCameras(DEFAULT_CAMERAS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveCameras();
  }, []);

  const toggleFullscreen = (cameraId: string) => {
    setFullscreenCamera(fullscreenCamera === cameraId ? null : cameraId);
  };

  const toggleDetection = async (cameraId: string) => {
    const currentState = detectionStates[cameraId] !== false; // default true
    const newState = !currentState;
    
    setDetectionStates(prev => ({
      ...prev,
      [cameraId]: newState
    }));

    try {
      await fetch(`http://localhost:8000/api/v1/streaming/start/${cameraId}?with_detection=${newState}`, {
        method: 'POST'
      });
    } catch (err) {
      console.error("Error updating detection state on backend:", err);
    }
  };

  const visibleCameras = fullscreenCamera 
    ? cameras.filter(cam => cam.id === fullscreenCamera)
    : cameras.slice(0, gridLayout === "2x2" ? 4 : 9);

  return (
    <div className="flex h-full w-full flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Live Surveillance & Geofencing</h1>
            <Badge className="bg-[#ff3538]/20 text-[#ff3538] border-[#ff3538]/40 text-xs">
              Boundary & Zone Detection
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time YOLOv8 object detection with interactive restricted boundary zone drawing and breach detection.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {fullscreenCamera && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFullscreenCamera(null)}
              className="text-xs font-mono"
            >
              <Minimize2 className="w-3.5 h-3.5 mr-1" /> Exit Spotlight View
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            title="Refresh Feeds"
            onClick={fetchLiveCameras}
          >
            <RefreshCw size={16} />
          </Button>

          <Button
            variant={gridLayout === "2x2" ? "default" : "outline"}
            size="icon"
            onClick={() => {
              setFullscreenCamera(null);
              setGridLayout("2x2");
            }}
            title="2x2 Matrix"
          >
            <Grid size={16} />
          </Button>
          
          <Button
            variant={gridLayout === "3x3" ? "default" : "outline"}
            size="icon"
            onClick={() => {
              setFullscreenCamera(null);
              setGridLayout("3x3");
            }}
            title="3x3 Matrix"
          >
            <div className="grid grid-cols-3 gap-0.5 w-3.5 h-3.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-current rounded-[1px]" />
              ))}
            </div>
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex h-[450px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="text-sm font-mono text-muted-foreground">Initializing camera video pipeline...</p>
          </div>
        </div>
      ) : (
        <div 
          className={`grid h-full gap-4 ${
            fullscreenCamera 
              ? 'grid-cols-1' 
              : gridLayout === "2x2" 
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {visibleCameras.map((camera) => (
            <LiveCameraFeed
              key={camera.id}
              camera={camera}
              withDetection={detectionStates[camera.id] !== false}
              isFullscreen={fullscreenCamera === camera.id}
              onToggleFullscreen={toggleFullscreen}
              onToggleDetection={toggleDetection}
            />
          ))}
        </div>
      )}
      
      {/* Node Metrics Bar */}
      <Card className="mt-auto border-border/40">
        <CardHeader className="py-2.5">
          <CardTitle className="text-xs uppercase tracking-wider font-mono text-muted-foreground flex items-center justify-between">
            <span>Surveillance Node Feed Metrics</span>
            <span className="text-emerald-500 font-semibold">● Vision Engine Online</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 text-center font-mono">
          <div className="p-2 rounded bg-zinc-900/50">
            <p className="text-[11px] text-muted-foreground">Monitored Feeds</p>
            <p className="text-lg font-bold text-foreground">{cameras.length}</p>
          </div>
          <div className="p-2 rounded bg-zinc-900/50">
            <p className="text-[11px] text-muted-foreground">Active Streams</p>
            <p className="text-lg font-bold text-emerald-400">{cameras.filter(c => c.status === "online").length}</p>
          </div>
          <div className="p-2 rounded bg-zinc-900/50">
            <p className="text-[11px] text-muted-foreground">Boundary Algorithm</p>
            <p className="text-lg font-bold text-cyan-400">Ray-Casting PIP</p>
          </div>
          <div className="p-2 rounded bg-zinc-900/50">
            <p className="text-[11px] text-muted-foreground">Reference Target</p>
            <p className="text-lg font-bold text-amber-400">Feet Bottom-Center</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}