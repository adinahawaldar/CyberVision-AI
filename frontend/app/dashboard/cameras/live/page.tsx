"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PlusCircle
} from "lucide-react";
import { getCamerasClient } from "@/lib/data/cameras";
import { Camera } from "@/lib/types";

// Fallback demo cameras
const DEFAULT_CAMERAS: Camera[] = [
  { 
    id: "cam-webcam-0", 
    name: "Camera 01 - Main Entrance (Webcam)", 
    location: "Main Entrance", 
    status: "online",
    streamUrl: "http://localhost:8000/api/v1/streaming/live/cam-webcam-0",
    hlsUrl: "http://localhost:8000/api/v1/streaming/live/cam-webcam-0",
    thumbnailUrl: "/camera-placeholder.jpg",
    aiFeatures: [],
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

  // MJPEG stream URL from FastAPI backend
  const streamUrl = `http://localhost:8000/api/v1/streaming/live/${camera.id}${withDetection ? '' : '?raw=true'}`;

  return (
    <Card className={`overflow-hidden border border-border/40 bg-zinc-950/80 transition-all ${
      isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none bg-black' : 'h-full'
    }`}>
      <div className="relative h-full flex flex-col">
        {/* Live Video Feed Container */}
        <div className="relative aspect-video h-full w-full bg-black overflow-hidden flex items-center justify-center">
          {isPlaying && !hasError ? (
            <img 
              src={streamUrl} 
              alt={camera.name} 
              className="h-full w-full object-cover select-none"
              onError={() => setHasError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
              <CameraIcon className="w-10 h-10 text-muted-foreground/50 animate-pulse" />
              <p className="text-sm font-mono text-muted-foreground">
                {hasError ? "Connecting to Camera Feed..." : "Feed Paused"}
              </p>
              {hasError && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs"
                  onClick={() => setHasError(false)}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Retry
                </Button>
              )}
            </div>
          )}

          {/* HUD Overlay - Top Left */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
            <Badge 
              variant={camera.status === "online" && !hasError ? "default" : "destructive"} 
              className="h-5 px-2 py-0 text-[10px] font-mono tracking-wider font-semibold"
            >
              {camera.status === "online" && !hasError ? "● LIVE" : "OFFLINE"}
            </Badge>
            <Badge variant="outline" className="bg-black/60 text-zinc-300 backdrop-blur-sm border-zinc-700 text-xs">
              {camera.location}
            </Badge>
            {withDetection && (
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> YOLOv8 AI
              </Badge>
            )}
          </div>

          {/* HUD Overlay - Bottom Controls */}
          <div className="absolute bottom-2 right-2 flex gap-1.5 backdrop-blur-md bg-black/50 p-1 rounded-full border border-white/10">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 rounded-full text-white hover:bg-white/20"
              title={withDetection ? "Turn Off AI Overlays" : "Turn On AI Overlays"}
              onClick={() => onToggleDetection(camera.id)}
            >
              {withDetection ? <Eye size={14} className="text-cyan-400" /> : <EyeOff size={14} />}
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 rounded-full text-white hover:bg-white/20"
              title={isPlaying ? "Pause Stream" : "Play Stream"}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 rounded-full text-white hover:bg-white/20"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              onClick={() => onToggleFullscreen(camera.id)}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
          </div>
          
          {/* Camera Name Label */}
          <div className="absolute bottom-2 left-2">
            <div className="rounded bg-black/70 backdrop-blur-md px-2 py-1 text-xs font-medium text-white border border-white/10">
              {camera.name}
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
  
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [gridLayout, setGridLayout] = useState<"2x2" | "3x3">("2x2");
  const [fullscreenCamera, setFullscreenCamera] = useState<string | null>(spotlightId);
  const [detectionStates, setDetectionStates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveCameras = async () => {
    setIsLoading(true);
    try {
      const data = await getCamerasClient();
      setCameras(data || []);
    } catch (e) {
      console.error("Failed to load cameras:", e);
      setCameras([]);
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
          <h1 className="text-3xl font-bold tracking-tight">Live Surveillance View</h1>
          <p className="text-muted-foreground">
            Multi-camera matrix with real-time YOLOv8 object detection & security tracking.
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
              Exit Spotlight View
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
            onClick={() => setGridLayout("2x2")}
            title="2x2 Matrix"
          >
            <Grid size={16} />
          </Button>
          
          <Button
            variant={gridLayout === "3x3" ? "default" : "outline"}
            size="icon"
            onClick={() => setGridLayout("3x3")}
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
      ) : cameras.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/60 bg-zinc-950/40 min-h-[380px] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-primary shadow-inner">
            <CameraIcon className="w-7 h-7 text-[#ff3538]" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-lg font-bold tracking-tight">No Cameras Connected Yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your account has no CCTV feeds configured. Add your first RTSP stream or USB webcam to begin monitoring.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button asChild className="rounded-full bg-[#ff3538] hover:bg-[#e62e31] text-white">
              <Link href="/dashboard/settings?tab=cameras">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Add Camera Feed
              </Link>
            </Button>
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
            <p className="text-[11px] text-muted-foreground">Inference Model</p>
            <p className="text-lg font-bold text-cyan-400">YOLOv8</p>
          </div>
          <div className="p-2 rounded bg-zinc-900/50">
            <p className="text-[11px] text-muted-foreground">Streaming Engine</p>
            <p className="text-lg font-bold text-amber-400">MJPEG / HLS</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}