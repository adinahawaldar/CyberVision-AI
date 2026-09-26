"use client";

import { createContext, useContext, useMemo, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

export type User = {
  id: string;
  name: string;
  username: string;
  role: "admin";
  avatar: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const user: User | null = useMemo(() => {
    if (!clerkUser) return null;
    return {
      id: clerkUser.id,
      name:
        clerkUser.fullName ||
        clerkUser.firstName ||
        clerkUser.username ||
        clerkUser.primaryEmailAddress?.emailAddress ||
        "Admin Operator",
      username:
        clerkUser.username ||
        clerkUser.primaryEmailAddress?.emailAddress ||
        "admin",
      role: "admin",
      avatar:
        clerkUser.imageUrl ||
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
    };
  }, [clerkUser]);

  // Synchronize active user ID to localStorage and cookies for backend isolation
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        (window as any).next = (window as any).next || {};
        (window as any).next.version = "15.0.0";
        (window as any).__internal_onBeforeSetActive = () => Promise.resolve();
      } catch {}

      if (clerkUser?.id) {
        localStorage.setItem("cv_current_user_id", clerkUser.id);
        document.cookie = `cv_user_id=${clerkUser.id}; path=/; SameSite=Lax`;
      } else if (isLoaded && !isSignedIn) {
        localStorage.removeItem("cv_current_user_id");
        document.cookie = "cv_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  }, [clerkUser?.id, isLoaded, isSignedIn]);

  const logout = async () => {
    if (typeof window !== "undefined") {
      try {
        (window as any).next = (window as any).next || {};
        (window as any).next.version = "15.0.0";
        (window as any).__internal_onBeforeSetActive = () => Promise.resolve();
      } catch {}
      localStorage.removeItem("cv_current_user_id");
      localStorage.removeItem("secureview-user");
      document.cookie = "cv_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    try {
      await signOut();
    } catch (err) {
      console.warn("Clerk signOut non-fatal warning:", err);
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const login = async (_username: string, _password: string) => {
    // Legacy stub - authentication is handled by Clerk
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !isLoaded,
        login,
        logout,
        isAuthenticated: !!isSignedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};