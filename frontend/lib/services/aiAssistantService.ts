/**
 * AI Assistant Service - Handles API calls related to OllamaVision AI Assistant
 */

// Types for AI Assistant
export interface QueryRequest {
  camera_id?: string;
  case_id?: string;
  case_data?: any;
  query: string;
}

// Updated QueryResponse interface to match the new backend response structure
export interface QueryResponse {
  success: boolean;
  response?: string; // The detailed text response from AI
  error?: string | null; // Error message if success is false
  camera_id?: string;
  camera_name?: string;
  case_id?: string;
  timestamp?: string;
  model?: string;
  image_base64?: string;
}

// Backend API base URL
const API_BASE_URL = 'http://localhost:8000';

/**
 * Submit a contextual query
 * POST /api/v1/contextual/query
 */
export const submitQuery = async (request: QueryRequest): Promise<QueryResponse> => {
  // First attempt: Python FastAPI vision backend with YOLO + OpenAI
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/api/v1/contextual/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const responseData = await response.json();
      return responseData as QueryResponse;
    }
  } catch (error) {
    console.warn('Backend server unreachable, falling back to Next.js AI Assistant route...');
  }

  // Fallback: Next.js OpenAI Assistant Route
  try {
    const fallbackRes = await fetch('/api/ai-assistant/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const fallbackData = await fallbackRes.json();
    if (!fallbackRes.ok) {
      throw new Error(fallbackData.error || `HTTP ${fallbackRes.status}`);
    }
    return fallbackData as QueryResponse;
  } catch (fallbackError: any) {
    console.error('Failed to submit query through fallback route:', fallbackError);
    throw fallbackError;
  }
};

// Removed checkQueryStatus function as the endpoint /api/v1/ollama-vision/query/{query_id} is no longer valid
// and a new one for status checking with the /api/v1/contextual/ path was not provided.