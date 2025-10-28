"use client";

import { AuthProvider } from "@/hooks/useAuth";

// Global providers shared across the entire App Router tree.
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
