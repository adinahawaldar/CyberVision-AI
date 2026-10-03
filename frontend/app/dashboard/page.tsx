"use client";

import React, { useState, useEffect } from "react";
import {
  Camera as CameraIcon,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Radio,
  SlidersHorizontal,
  Plus,
  Video,
  Grid3X3,
  LayoutGrid,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCamerasClient } from "@/lib/data/cameras";
import { Camera } from "@/lib/types";
import AddCameraDialog from "@/components/settings/camera-tab/add-camera-dialog";

// Clean 6 surveillance cameras with simple, intuitive names
const DEFAULT_6_CAMERAS = [
  {
    id: "cam-webcam-0",
    name: "Entrance",
    status: "online",
    fps: "28.4"
  },
  {
    id: "cam-synthetic-2",
    name: "Backyard",
    status: "online",
    fps: "25.0"
  },
  {
    id: "cam-synthetic-3",
    name: "Lobby",
    status: "online",
    fps: "24.8"
  },
  {
    id: "cam-synthetic-4",
    name: "Parking",
    status: "online",
    fps: "25.0"
  },
  {
    id: "cam-synthetic-5",
    name: "Warehouse",
    status: "online",
    fps: "24.6"
  },
  {
    id: "cam-synthetic-6",
    name: "Office",
    status: "online",
    fps: "28.2"
  }
];

export default function DashboardPage() {
  const [cameras, setCameras] = useState<any[]>(DEFAULT_6_CAMERAS);
  const [withDetection, setWithDetection] = useState<Record<string, boolean>>({
    "cam-webcam-0": true,
    "cam-synthetic-2": true,
    "cam-synthetic-3": true,
    "cam-synthetic-4": true,
    "cam-synthetic-5": true,
    "cam-synthetic-6": true
  });
  const [fullscreenCam, setFullscreenCam] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadCameras = async () => {
      try {
        const data = await getCamerasClient();
        if (data && data.length > 0) {
          const merged = DEFAULT_6_CAMERAS.map((slot, index) => {
            if (data[index]) {
              return {
                ...slot,
                id: data[index].id || slot.id,
                name: data[index].name && !data[index].name.startsWith("CAMERA") ? data[index].name : slot.name,
                status: data[index].status || "online",
              };
            }
            return slot;
          });
          setCameras(merged);
        }
      } catch (e) {
        // Fallback to defaults
      }
    };

    loadCameras();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setImageErrors({});
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const toggleDetection = (camId: string) => {
    setWithDetection((prev) => ({
      ...prev,
      [camId]: !prev[camId]
    }));
  };

  const toggleFullscreen = (camId: string) => {
    if (fullscreenCam === camId) {
      setFullscreenCam(null);
    } else {
      setFullscreenCam(camId);
    }
  };

  const handleCameraAdded = (newCam: any) => {
    const formatted = {
      id: newCam.id,
      name: newCam.name || newCam.location || `Camera ${cameras.length + 1}`,
      status: "online",
      fps: "25.0"
    };
    setCameras((prev) => [formatted, ...prev]);
    setWithDetection((prev) => ({ ...prev, [newCam.id]: true }));
  };

  // Helper to generate correct backend MJPEG stream URL
  const getStreamUrl = (camId: string) => {
    const isDetect = withDetection[camId] !== false;
    const actualEndpointId =
      camId === "cam-synthetic-4"
        ? "cam-synthetic-2"
        : camId === "cam-synthetic-5"
        ? "cam-synthetic-3"
        : camId === "cam-synthetic-6"
        ? "cam-webcam-0"
        : camId;

    return `http://localhost:8000/api/v1/streaming/live/${actualEndpointId}${isDetect ? "" : "?raw=true"}`;
  };

  return (
    <div className="flex flex-col space-y-5 max-w-7xl mx-auto pb-10">
      
      {/* TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          CCTV Surveillance
        </h1>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 px-3 text-xs font-medium border-border"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* ADD CAMERA / WEBCAM INTEGRATION */}
          <AddCameraDialog
            onCameraAdded={handleCameraAdded}
            trigger={
              <Button size="sm" className="h-8 px-3 text-xs bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Camera
              </Button>
            }
          />
        </div>
      </div>

      {/* 6-CAMERA GRID: 3 COLUMNS X 2 ROWS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras.map((camera) => {
          const isFull = fullscreenCam === camera.id;
          const isError = imageErrors[camera.id];
          const isAIActive = withDetection[camera.id] !== false;

          return (
            <Card
              key={camera.id}
              className={`overflow-hidden border border-border bg-card transition-all duration-200 hover:shadow-sm ${
                isFull
                  ? "fixed inset-0 z-50 h-screen w-screen rounded-none bg-black border-none"
                  : "rounded-xl"
              }`}
            >
              {/* CAMERA TOP BAR: SIMPLE NAME & FULLSCREEN */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50/80 dark:bg-muted/40 border-b border-border">
                <span className="text-sm font-semibold text-foreground truncate">
                  {camera.name}
                </span>

                <button
                  onClick={() => toggleFullscreen(camera.id)}
                  title={isFull ? "Exit Fullscreen" : "Fullscreen"}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {isFull ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* CAMERA VIDEO STREAM CONTAINER */}
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center group">
                {!isError ? (
                  <img
                    src={getStreamUrl(camera.id)}
                    alt={camera.name}
                    className="h-full w-full object-cover select-none"
                    onError={() => {
                      setImageErrors((prev) => ({ ...prev, [camera.id]: true }));
                    }}
                  />
                ) : (
                  // SIMPLE CLEAN OFFLINE PLACEHOLDER (NO DUPLICATE TEXT)
                  <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                    <CameraIcon className="w-6 h-6 text-slate-500 mb-1.5" />
                    <span className="text-xs text-slate-400">Offline</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setImageErrors((prev) => ({ ...prev, [camera.id]: false }))}
                      className="mt-2.5 h-6 px-2.5 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Reconnect
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

    </div>
  );
}