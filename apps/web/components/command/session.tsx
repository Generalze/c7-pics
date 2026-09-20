"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUserProfile } from "@pics-nigeria/shared";
import { ApiError, fetchCurrentUser } from "../../lib/api";
import { clearSession, readSession } from "../../lib/session";

/**
 * Roles admitted to the Election Command console. This mirrors the API guard on
 * /dashboard/metrics: the figures are state-wide, so a coordinator scoped to one
 * territory is deliberately not admitted. The API remains the authority; this
 * only decides what the console offers.
 */
export const COMMAND_ROLES = ["SUPER_ADMIN", "STATE_OFFICER", "ADMIN"] as const;

export type CommandSession = { token: string; user: AuthUserProfile };

const SessionContext = createContext<CommandSession | null>(null);

type State =
  | { phase: "loading" }
  | { phase: "ready"; session: CommandSession }
  | { phase: "denied"; message: string };

export function useCommandSession(): CommandSession {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useCommandSession must be used inside CommandSessionProvider.");
  }
  return session;
}

export function CommandSessionProvider({
  children,
  renderLoading,
  renderDenied,
}: {
  children: (session: CommandSession) => React.ReactNode;
  renderLoading: () => React.ReactNode;
  renderDenied: (message: string) => React.ReactNode;
}) {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    const token = readSession();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const user = await fetchCurrentUser(token);
        if (cancelled) return;
        if (!COMMAND_ROLES.includes(user.role as (typeof COMMAND_ROLES)[number])) {
          setState({
            phase: "denied",
            message: "The Election Command console is available to state command roles only.",
          });
          return;
        }
        setState({ phase: "ready", session: { token, user } });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          window.location.href = "/login";
          return;
        }
        setState({
          phase: "denied",
          message: error instanceof Error ? error.message : "Could not verify your session.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => (state.phase === "ready" ? state.session : null), [state]);

  if (state.phase === "loading" || !value) {
    if (state.phase === "denied") {
      return <>{renderDenied(state.message)}</>;
    }
    return <>{renderLoading()}</>;
  }

  return <SessionContext.Provider value={value}>{children(value)}</SessionContext.Provider>;
}
