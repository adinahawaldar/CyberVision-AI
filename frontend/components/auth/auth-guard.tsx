"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

const publicRoutes = ["/", "/sign-in", "/sign-up", "/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute =
    !pathname ||
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        window.location.href = "/sign-in";
      } else if (
        isAuthenticated &&
        (pathname?.startsWith("/sign-in") ||
          pathname?.startsWith("/sign-up") ||
          pathname === "/login")
      ) {
        window.location.href = "/dashboard";
      }
    }
  }, [isAuthenticated, isLoading, isPublicRoute, pathname]);

  // Only show blocking loading screen for protected routes while session loads
  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0e1015]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ff3538]"></div>
      </div>
    );
  }

  // If not authenticated and trying to access a protected route, block render
  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}