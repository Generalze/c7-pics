import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "./api";
import { ApiError } from "./api";
import { clearStoredSession, readStoredSession, writeStoredSession } from "./session";
import type { AuthUserProfile } from "./types";

/**
 * Mirrors the API's requirePollingUnitFieldCapability guard: a legacy AGENT,
 * or a COORDINATOR at polling-unit level, with an agent profile. Anyone else
 * can authenticate but cannot use a single screen in this app, so the app
 * refuses them at sign-in with a clear reason instead of a wall of 403s.
 */
export function hasFieldCapability(user: AuthUserProfile): boolean {
  const isLegacyAgent = user.role === "AGENT";
  const isPollingUnitCoordinator = user.role === "COORDINATOR" && user.coordinatorProfile?.level === "POLLING_UNIT";
  return (isLegacyAgent || isPollingUnitCoordinator) && user.agentProfile !== null;
}

type AuthState = {
  /** True until the stored session has been read and validated. */
  isBootstrapping: boolean;
  token: string | null;
  user: AuthUserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-fetches the profile; signs out if the session is no longer valid. */
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUserProfile | null>(null);

  const clear = useCallback(async () => {
    setToken(null);
    setUser(null);
    await clearStoredSession();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await readStoredSession();
      if (!stored) {
        if (!cancelled) setIsBootstrapping(false);
        return;
      }
      // Show the cached profile immediately, then confirm the session is still
      // active. An agent's token dies the moment they sign in elsewhere.
      if (!cancelled) {
        setToken(stored.token);
        setUser(stored.user);
      }
      try {
        const fresh = await api.fetchMe(stored.token);
        if (!cancelled) {
          setUser(fresh);
          await writeStoredSession(stored.token, fresh);
        }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await clear();
        }
        // Offline: keep the cached session and let screens surface the network error.
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clear]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api.login(email.trim().toLowerCase(), password, true);
    if (!hasFieldCapability(result.user)) {
      // Release the server-side session we just created before refusing.
      await api.logout(result.token).catch(() => undefined);
      throw new ApiError(
        "This app is for polling unit agents. Your account does not have a field agent profile with an assigned polling unit.",
        403,
      );
    }
    await writeStoredSession(result.token, result.user);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const signOut = useCallback(async () => {
    const current = token;
    await clear();
    if (current) {
      await api.logout(current).catch(() => undefined);
    }
  }, [clear, token]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const fresh = await api.fetchMe(token);
      setUser(fresh);
      await writeStoredSession(token, fresh);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await clear();
      }
    }
  }, [clear, token]);

  const value = useMemo<AuthState>(
    () => ({ isBootstrapping, token, user, signIn, signOut, refreshProfile }),
    [isBootstrapping, token, user, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}

/** For screens that can only render when signed in: token and user are non-null. */
export function useSession(): { token: string; user: AuthUserProfile } & Pick<AuthState, "signOut" | "refreshProfile"> {
  const { token, user, signOut, refreshProfile } = useAuth();
  if (!token || !user) {
    throw new Error("useSession used outside a signed-in route.");
  }
  return { token, user, signOut, refreshProfile };
}

/** A user-facing message for any error a screen catches. */
export function describeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/** Whether an error means the session is dead and the user must sign in again. */
export function isSessionError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
