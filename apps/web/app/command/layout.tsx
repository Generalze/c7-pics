"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "./command.css";
import { CommandSessionProvider, type CommandSession } from "../../components/command/session";
import { fetchCommandCentreMetrics } from "../../lib/api";
import { initials } from "../../components/command/ui";

type NavItem = { href: string; label: string; icon: string; exact?: boolean };

const NAV: NavItem[] = [
  { href: "/command", label: "Command Centre", icon: "▦", exact: true },
  { href: "/command/agents", label: "Agents", icon: "☖" },
  { href: "/command/map", label: "Live Map", icon: "◉" },
  { href: "/command/results", label: "Results", icon: "☑" },
  { href: "/command/incidents", label: "Incidents", icon: "⚠" },
  { href: "/command/evidence", label: "Evidence Vault", icon: "🗎" },
  { href: "/command/reports", label: "Reports", icon: "▥" },
];

const TITLES: Record<string, string> = {
  "/command": "Command Centre",
  "/command/agents": "Agents",
  "/command/map": "Live Map",
  "/command/results": "Results",
  "/command/incidents": "Incidents",
  "/command/evidence": "Evidence Vault",
  "/command/reports": "Reports",
};

const COLLAPSE_KEY = "pics.command.railCollapsed";

/** Ticks once a second, and only after mount so the server and client agree. */
function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function Shell({ session, children }: { session: CommandSession; children: React.ReactNode }) {
  const pathname = usePathname();
  const now = useClock();
  const [collapsed, setCollapsed] = useState(false);
  const [openIncidents, setOpenIncidents] = useState<number | null>(null);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // A blocked or private store is not a reason to fail the console.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const metrics = await fetchCommandCentreMetrics(session.token);
        if (!cancelled) {
          setOpenIncidents(metrics.operationalMetrics.incidentTracking.openHigh);
        }
      } catch {
        // The badge is an ornament; a failure here must not break navigation.
      }
    }
    void load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [session.token]);

  function toggleRail() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // Ignored: the preference simply will not persist.
      }
      return next;
    });
  }

  const title = TITLES[pathname ?? ""] ?? "Command Centre";

  return (
    <div className={collapsed ? "ec ec--railCollapsed" : "ec"}>
      <aside className="ec-rail">
        <div className="ec-brand">
          <span className="ec-brand-mark" aria-hidden="true">
            ✓
          </span>
          <span className="ec-brand-name">
            Election
            <br />
            Command
          </span>
        </div>

        <nav className="ec-nav" aria-label="Election Command">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : Boolean(pathname?.startsWith(item.href));
            const badge = item.href === "/command/incidents" ? openIncidents : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="ec-navItem"
                aria-current={active ? "page" : undefined}
                title={item.label}
              >
                <span className="ec-navIcon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="ec-navLabel">{item.label}</span>
                {badge ? <span className="ec-navBadge">{badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="ec-railFoot">
          <div>
            <div className="ec-railFoot-clock">
              {now ? now.toLocaleTimeString("en-GB", { hour12: false }) : "--:--:--"}
            </div>
            <div className="ec-railFoot-meta">
              {now ? now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
            </div>
          </div>
          <div className="ec-railFoot-user">
            <span className="ec-avatar" aria-hidden="true">
              {initials(session.user.name)}
            </span>
            <span>
              <span className="ec-railFoot-name">{session.user.name}</span>
              <span className="ec-railFoot-role">{session.user.role.replace(/_/g, " ")}</span>
            </span>
          </div>
          <button type="button" className="ec-railBtn" onClick={toggleRail}>
            {collapsed ? "›" : "‹ Collapse"}
          </button>
        </div>
      </aside>

      <div className="ec-main">
        <header className="ec-topbar">
          <h1 className="ec-topbar-title">{title}</h1>
          <span className="ec-scopeChip">Ogun State · 2027 Governorship</span>
          <div className="ec-topbar-right">
            <span className="ec-live">Live ops</span>
            <span className="ec-topClock">{now ? now.toLocaleTimeString("en-GB", { hour12: false }) : ""}</span>
          </div>
        </header>

        <main className="ec-content">{children}</main>

        <footer className="ec-footer">
          <span>Election Command Centre · Ogun State</span>
          <span>All data unofficial internal records · not for public distribution</span>
        </footer>
      </div>
    </div>
  );
}

export default function CommandLayout({ children }: { children: React.ReactNode }) {
  return (
    <CommandSessionProvider
      renderLoading={() => (
        <div className="ec">
          <div className="ec-main">
            <main className="ec-content">
              <div className="ec-state">
                <span className="ec-spinner" aria-hidden="true" />
                <span>Opening the command console…</span>
              </div>
            </main>
          </div>
        </div>
      )}
      renderDenied={(message) => (
        <div className="ec">
          <div className="ec-main">
            <main className="ec-content">
              <div className="ec-banner">{message}</div>
              <p>
                <Link href="/admin/dashboard" className="ec-btn">
                  Back to the admin console
                </Link>
              </p>
            </main>
          </div>
        </div>
      )}
    >
      {(session) => <Shell session={session}>{children}</Shell>}
    </CommandSessionProvider>
  );
}
