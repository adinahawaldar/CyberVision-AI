/**
 * Camera Service - Handles API calls related to camera management
 * Scoped to authenticated user ID for complete privacy isolation.
 */

import { getAuthHeaders, getStoredUserId } from '@/lib/auth-utils';

// Type definitions for camera data
export type CameraFilter = {
  filter_id: string;
  filter_name: string;
  enabled: boolean;
};

export type Camera = {
  id?: string;
  user_id?: string;
  name: string;
  rtsp_url: string;
  status?: 'online' | 'offline';
  stream_url?: string;
  hls_url?: string;
  webrtc_url?: string;
  filters?: CameraFilter[];
  location?: string;
};

export type StreamInfo = {
  camera_id: string;
  hls_url: string;
  status: string;
  with_detection?: boolean;
};

// Backend API base URL
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Available filter types
export const AVAILABLE_FILTERS = [
  { name: 'OllamaVision', description: 'General-purpose AI vision filter' },
  { name: 'AnimalDetection', description: 'Detect animals in camera feed' },
  { name: 'Attendance', description: 'Track people attendance' },
  { name: 'VehicleDetection', description: 'Detect vehicles in camera feed' },
  { name: 'authorized_entry', description: 'Track authorized entry access' }
];

/**
 * Fetches all cameras for the current user from backend
 * GET /api/v1/contextual/cameras
 */
export const fetchCameras = async (): Promise<Camera[]> => {
  try {
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${API_BASE_URL}/contextual/cameras${query}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch cameras:', error);
    throw error;
  }
};

/**
 * Fetches a specific camera by ID
 * GET /api/v1/cameras/{camera_id}
 */
export const fetchCameraById = async (cameraId: string): Promise<Camera> => {
  try {
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${API_BASE_URL}/cameras/${cameraId}${query}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch camera ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Fetches a specific camera by name
 * GET /api/v1/cameras/by-name/{name}
 */
export const fetchCameraByName = async (name: string): Promise<Camera> => {
  try {
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${API_BASE_URL}/cameras/by-name/${encodeURIComponent(name)}${query}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch camera with name ${name}:`, error);
    throw error;
  }
};

/**
 * Adds a new camera scoped to current user
 * POST /api/v1/cameras/
 */
export const addCamera = async (cameraData: { name: string; rtsp_url: string; user_id?: string }): Promise<Camera> => {
  try {
    const userId = cameraData.user_id || getStoredUserId();
    const formData = new FormData();
    formData.append('name', cameraData.name);
    formData.append('rtsp_url', cameraData.rtsp_url);
    if (userId) {
      formData.append('user_id', userId);
    }

    const response = await fetch(`${API_BASE_URL}/cameras/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to add camera:', error);
    throw error;
  }
};

/**
 * Adds a new camera with filters scoped to current user
 * POST /api/v1/cameras/with-filters
 */
export const addCameraWithFilters = async (
  cameraData: { 
    name: string; 
    rtsp_url: string; 
    filters?: CameraFilter[];
    validate?: boolean;
    user_id?: string;
  }
): Promise<Camera> => {
  try {
    const userId = cameraData.user_id || getStoredUserId();
    const formData = new FormData();
    formData.append('name', cameraData.name);
    formData.append('rtsp_url', cameraData.rtsp_url);
    if (userId) {
      formData.append('user_id', userId);
    }
    
    if (cameraData.filters && cameraData.filters.length > 0) {
      formData.append('filters', JSON.stringify(cameraData.filters));
    }
    
    if (cameraData.validate !== undefined) {
      formData.append('validate', String(cameraData.validate));
    }

    const response = await fetch(`${API_BASE_URL}/cameras/with-filters`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to add camera with filters:', error);
    throw error;
  }
};

/**
 * Deletes a camera by ID
 * DELETE /api/v1/cameras/{camera_id}
 */
export const deleteCameraById = async (cameraId: string): Promise<void> => {
  try {
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${API_BASE_URL}/cameras/${cameraId}${query}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to delete camera ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Deletes a camera by name
 * DELETE /api/v1/cameras/by-name/{name}
 */
export const deleteCameraByName = async (name: string): Promise<void> => {
  try {
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${API_BASE_URL}/cameras/by-name/${encodeURIComponent(name)}${query}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to delete camera with name ${name}:`, error);
    throw error;
  }
};

/**
 * Starts a camera stream
 * POST /api/v1/streaming/start
 */
export const startCameraStream = async (cameraId: string): Promise<{ webrtc_url: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/streaming/start`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({ camera_id: cameraId }),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.webrtc_url) {
      return { webrtc_url: data.webrtc_url };
    } else if (data.url) {
      return { webrtc_url: data.url };
    } else if (data.result && data.result.webrtc_url) {
      return { webrtc_url: data.result.webrtc_url };
    } else {
      return { 
        webrtc_url: `ws://${window.location.hostname}:8000/api/v1/streaming/${cameraId}/webrtc`
      };
    }
  } catch (error) {
    console.error(`Failed to start stream for camera ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Fetches all filters for a camera
 * GET /api/v1/cameras/{camera_id}/filters
 */
export const fetchCameraFilters = async (cameraId: string): Promise<CameraFilter[]> => {
  try {
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${API_BASE_URL}/cameras/${cameraId}/filters${query}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch filters for camera ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Updates filters for a camera
 * PUT /api/v1/cameras/{camera_id}/filters
 */
export const updateCameraFilters = async (
  cameraId: string, 
  filters: CameraFilter[]
): Promise<CameraFilter[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cameras/${cameraId}/filters`, {
      method: 'PUT',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(filters),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to update filters for camera ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Gets status of all camera streams for user
 * GET /api/v1/streaming/
 */
export const getStreamStatus = async (): Promise<{ active_streams: StreamInfo[] }> => {
  try {
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${API_BASE_URL}/streaming/${query}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get stream status:', error);
    throw error;
  }
};

/**
 * Starts streaming for a specific camera
 * POST /api/v1/streaming/start/{camera_id}
 */
export const startStream = async (cameraId: string, withDetection: boolean = false): Promise<StreamInfo> => {
  try {
    const url = `${API_BASE_URL}/streaming/start/${cameraId}${withDetection ? '?with_detection=true' : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to start stream for camera ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Stops streaming for a specific camera
 * POST /api/v1/streaming/stop/{camera_id}
 */
export const stopStream = async (cameraId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/streaming/stop/${cameraId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to stop stream for camera ${cameraId}:`, error);
    throw error;
  }
};

/**
 * Gets HLS URLs for active cameras of the user
 * GET /api/v1/streaming/stream-urls
 */
export const getStreamUrls = async (): Promise<StreamInfo[]> => {
  try {
    const userId = getStoredUserId();
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const response = await fetch(`${API_BASE_URL}/streaming/stream-urls${query}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get stream URLs:', error);
    throw error;
  }
};

/**
 * Generates a unique filter ID based on the filter name and a timestamp
 */
export const generateFilterId = (filterName: string): string => {
  const timestamp = new Date().getTime().toString(36);
  const filterBase = filterName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${filterBase}-${timestamp.slice(-4)}`;
};