"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authApi, AuthApiError } from "@/lib/api/auth";
import { canAccess, type AuthUser, type Guarded } from "@/lib/auth/sections";

const STORAGE_KEY = "theges.session";
const REFRESH_MIN_INTERVAL_MS = 30_000;

type Status = "loading" | "anonymous" | "authenticated" | "unreachable";

interface AuthContextValue {
  status: Status;
  user: AuthUser | null;
  token: string | null;
  signIn: (login: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
  can: (section: Guarded) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(STORAGE_KEY, token);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage blocked — the session then lasts until the tab closes
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const lastCheck = useRef(0);

  const verify = useCallback(async (stored: string) => {
    lastCheck.current = Date.now();
    try {
      const { user: fresh } = await authApi.me(stored);
      setUser(fresh);
      setToken(stored);
      setStatus("authenticated");
    } catch (e) {
      if (e instanceof AuthApiError && e.code === "INVALID_SESSION") {
        writeToken(null);
        setUser(null);
        setToken(null);
        setStatus("anonymous");
      } else {
        setStatus((prev) => (prev === "authenticated" ? prev : "unreachable"));
      }
    }
  }, []);

  useEffect(() => {
    const stored = readToken();
    if (!stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the persisted session on mount
      setStatus("anonymous");
      return;
    }
    verify(stored);
  }, [verify, attempt]);

  // Rights changed (or the account was switched off) while the tab sat in the background:
  // re-check as soon as the person comes back, at most every 30 seconds.
  useEffect(() => {
    if (!token) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCheck.current < REFRESH_MIN_INTERVAL_MS) return;
      verify(token);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [token, verify]);

  const signIn = useCallback(async (login: string, password: string) => {
    const { token: fresh, user: loggedIn } = await authApi.login(login, password);
    writeToken(fresh);
    lastCheck.current = Date.now();
    setToken(fresh);
    setUser(loggedIn);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    const current = token;
    writeToken(null);
    setUser(null);
    setToken(null);
    setStatus("anonymous");
    if (current) await authApi.logout(current).catch(() => undefined);
  }, [token]);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  const can = useCallback((section: Guarded) => canAccess(user, section), [user]);

  const value = useMemo(
    () => ({ status, user, token, signIn, signOut, retry, can }),
    [status, user, token, signIn, signOut, retry, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
