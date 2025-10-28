"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api-client";
import type { Region, UserRole } from "@/lib/constants/access-control";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: UserRole;
  region: Region;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; avatarUrl?: string; region?: Region }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await authApi.session();
      if (res?.user) {
        setUser(res.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch (error) {
      console.error("Failed to fetch session", error);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const res = await authApi.login({ email, password });
    setUser(res.user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(
    async ({ name, email, password, avatarUrl, region }: { name: string; email: string; password: string; avatarUrl?: string; region?: Region }) => {
      const res = await authApi.register({ name, email, password, avatarUrl, region });
      setUser(res.user);
      setStatus("authenticated");
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, refresh }),
    [login, logout, refresh, register, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
