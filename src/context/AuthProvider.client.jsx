"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: async () => {},
  hydrated: false,
  isLoggingOut: false,
});

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[-.+*]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function readStoredEmployeeId() {
  if (typeof window === "undefined") return null;
  try {
    const fromLocal = localStorage.getItem("auth:employeeId");
    if (fromLocal) return fromLocal;
  } catch (e) {}
  const cookieCandidates = ["employeeId", "x-employee-id", "employee_id"];
  for (const name of cookieCandidates) {
    const c = getCookie(name);
    if (c) return c;
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const fetchDashboardFor = async (employeeId, orgId = null) => {
    if (!BACKEND_URL) return null;
    if (!employeeId) return null;

    try {
      const headers = {
        "x-api-key": API_KEY || "",
        ...(employeeId ? { "x-employee-id": String(employeeId) } : {}),
        ...(orgId ? { "x-org-id": String(orgId) } : {}),
      };

      const url = `${BACKEND_URL}/dashboard`;
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        console.debug("fetchDashboardFor: non-ok response", {
          url,
          status: res.status,
        });
        const txt = await res.text().catch(() => null);
        console.debug("fetchDashboardFor body:", txt);
        return null;
      }
      const json = await res.json().catch(() => null);
      const body = (json && (json.message ?? json)) || null;
      return body ?? null;
    } catch (err) {
      console.warn("fetchDashboardFor error", err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function rehydrate() {
      try {
        if (!BACKEND_URL) {
          if (mounted) {
            setHydrated(true);
          }
          return;
        }

        const employeeId = readStoredEmployeeId();
        const headers = {
          "x-api-key": API_KEY || "",
          ...(employeeId ? { "x-employee-id": String(employeeId) } : {}),
        };

        const res = await fetch(`${BACKEND_URL}/me`, {
          method: "GET",
          credentials: "include",
          headers,
        });

        if (!mounted) return;

        const json = await res.json().catch(() => null);
        if (!json) {
          setUser(null);
          return;
        }

        const body = json.message ?? json;

        const serverUser = {
          id: body.id ?? body.employeeId ?? body.employee_id ?? null,
          employeeId: body.employeeId ?? body.employee_id ?? body.id ?? null,
          name: body.name ?? body.dashboard?.name ?? null,
          role: body.role ?? null,
          dashboard: body.dashboard ?? {},
          sidebarMenu: body.sidebarMenu ?? [],
          raw: body,
          orgId: body.org_id ?? body.orgId ?? null,
        };

        try {
          const orgId = body.org_id ?? body.orgId ?? null;
          const dash = await fetchDashboardFor(serverUser.employeeId, orgId);
          serverUser.dashboard = dash ?? serverUser.dashboard ?? {};
        } catch (e) {
          console.debug("rehydrate: fetchDashboardFor failed", e);
        }

        if (res.ok) {
          setUser(serverUser);
          try {
            if (serverUser.employeeId) {
              localStorage.setItem(
                "auth:employeeId",
                String(serverUser.employeeId)
              );
            }
          } catch (e) {}
        } else {
          setUser(null);
          try {
            localStorage.removeItem("auth:employeeId");
          } catch (e) {}
        }
      } catch (err) {
        console.error("rehydrate error", err);
        setUser(null);
      } finally {
        if (mounted) {
          setHydrated(true);
          if (typeof window !== "undefined") window.__APP_LOGGING_OUT = false;
        }
      }
    }

    rehydrate();
    return () => {
      mounted = false;
    };
  }, [BACKEND_URL, API_KEY]);

  const fetchMe = async () => {
    if (!BACKEND_URL) return null;
    try {
      const employeeId = readStoredEmployeeId();
      const headers = {
        "x-api-key": API_KEY || "",
        ...(employeeId ? { "x-employee-id": String(employeeId) } : {}),
      };

      const res = await fetch(`${BACKEND_URL}/me`, {
        method: "GET",
        credentials: "include",
        headers,
      });
      const json = await res.json().catch(() => null);
      const body = (json && (json.message ?? json)) || null;
      if (!body) return null;

      const serverUser = {
        id: body.id ?? body.employeeId ?? body.employee_id ?? null,
        employeeId: body.employeeId ?? body.employee_id ?? body.id ?? null,
        name: body.name ?? body.dashboard?.name ?? body.email ?? null,
        role: body.role ?? null,
        dashboard: body.dashboard ?? {},
        sidebarMenu: body.sidebarMenu ?? [],
        raw: body,
        orgId: body.org_id ?? body.orgId ?? null,
      };

      try {
        const orgId = body.org_id ?? body.orgId ?? null;
        const dash = await fetchDashboardFor(serverUser.employeeId, orgId);
        serverUser.dashboard = dash ?? serverUser.dashboard ?? {};
      } catch (e) {
        console.debug("fetchMe: fetchDashboardFor failed", e);
      }

      if (res.ok) {
        setUser(serverUser);
        try {
          if (serverUser.employeeId) {
            localStorage.setItem(
              "auth:employeeId",
              String(serverUser.employeeId)
            );
          }
        } catch (e) {}
        return serverUser;
      } else {
        setUser(null);
        try {
          localStorage.removeItem("auth:employeeId");
        } catch (e) {}
        return null;
      }
    } catch (err) {
      console.error("fetchMe error", err);
      return null;
    }
  };

  const login = async (serverUser, { fetchFull = true } = {}) => {
    const minimalUser = {
      id: serverUser?.id ?? serverUser?.employeeId ?? null,
      employeeId: serverUser?.employeeId ?? serverUser?.id ?? null,
      name: serverUser?.name ?? null,
      role: serverUser?.role ?? null,
      dashboard: serverUser?.dashboard ?? {},
      sidebarMenu: serverUser?.sidebarMenu ?? [],
      raw: serverUser?.raw ?? {},
    };

    setUser(minimalUser);
    try {
      if (minimalUser?.employeeId) {
        localStorage.setItem("auth:employeeId", String(minimalUser.employeeId));
      }
    } catch (e) {}

    try {
      const orgIdFromRaw =
        minimalUser.raw?.org_id ?? minimalUser.raw?.orgId ?? null;

      fetchDashboardFor(minimalUser.employeeId, orgIdFromRaw)
        .then((dash) => {
          if (!dash) return;
          setUser((prev) => {
            if (!prev) return { ...minimalUser, dashboard: dash };
            return { ...prev, dashboard: dash };
          });
        })
        .catch((err) => {
          console.debug("login: fetchDashboardFor failed (non-fatal)", err);
        });
    } catch (e) {
      console.debug("login: starting dashboard fetch failed (non-fatal)", e);
    }

    if (fetchFull) {
      fetchMe().catch((e) => {
        console.warn("fetchMe after login failed:", e);
      });
    }

    return minimalUser;
  };

  const PARENT_ORIGIN =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_PARENT_ORIGIN || "http://localhost:1574"
      : null;

  const isFramed = () =>
    typeof window !== "undefined" &&
    window.parent &&
    window.parent !== window.self;

  const logout = async ({ redirect = true, reason } = {}) => {
    if (redirect) {
      try {
        if (
          isFramed() &&
          typeof window.parent !== "undefined" &&
          PARENT_ORIGIN
        ) {
          try {
            window.parent.postMessage(
              { type: "child-logged-out", reason: reason ?? "unknown" },
              PARENT_ORIGIN
            );
          } catch (err) {
            console.warn("Failed to post child-logged-out to parent:", err);
          }
        }

        try {
          router.push("/");
        } catch (err) {
          console.warn("router.push('/') failed:", err);
        }

        setUser(null);
        try {
          localStorage.removeItem("auth:employeeId");
        } catch (e) {
          console.warn("localStorage remove failed:", e);
        }

        if (typeof window !== "undefined") window.__APP_LOGGING_OUT = true;

        if (BACKEND_URL) {
          fetch(`${BACKEND_URL}/logout`, {
            method: "POST",
            credentials: "include",
            headers: {
              "x-api-key": API_KEY || "",
              "Content-Type": "application/json",
            },
          })
            .catch((err) => console.error("logout request failed:", err))
            .finally(() => {
              if (typeof window !== "undefined")
                window.__APP_LOGGING_OUT = false;
            });
        } else {
          if (typeof window !== "undefined") window.__APP_LOGGING_OUT = false;
        }

        return;
      } catch (err) {
        console.warn("logout (redirect=true) unexpected error:", err);
      }
    }

    setIsLoggingOut(true);
    setUser(null);
    try {
      localStorage.removeItem("auth:employeeId");
    } catch (e) {
      console.warn("localStorage remove failed:", e);
    }

    if (typeof window !== "undefined") window.__APP_LOGGING_OUT = true;

    try {
      if (BACKEND_URL) {
        await fetch(`${BACKEND_URL}/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
        });
      }
    } catch (err) {
      console.error("logout request failed:", err);
    } finally {
      if (typeof window !== "undefined") window.__APP_LOGGING_OUT = false;
      setIsLoggingOut(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, hydrated, isLoggingOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);