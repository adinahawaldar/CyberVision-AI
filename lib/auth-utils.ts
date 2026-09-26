/**
 * Auth and Multi-Tenant Privacy Utilities
 */

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cv_current_user_id") || null;
}

export function getAuthHeaders(
  extraHeaders: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const userId = getStoredUserId();
  if (userId) {
    headers["X-User-Id"] = userId;
  }
  return headers;
}

export function getUserStorageKey(baseKey: string): string {
  const userId = getStoredUserId();
  return userId ? `${baseKey}_${userId}` : baseKey;
}
