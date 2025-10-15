"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: async () => {},
  hydrated: false,
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
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  useEffect(() => {
    let mounted = true;

    async function rehydrate() {
      try {
        if (!BACKEND_URL) return;
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
        };

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
        if (mounted) setHydrated(true);
      }
    }

    rehydrate();
    return () => {
      mounted = false;
    };
  }, [BACKEND_URL, API_KEY]);

  const login = async (serverUser) => {
    setUser(serverUser);
    try {
      if (serverUser?.employeeId) {
        localStorage.setItem("auth:employeeId", String(serverUser.employeeId));
      }
    } catch (e) {}
    return serverUser;
  };

  const logout = async ({ redirect = true } = {}) => {
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
      setUser(null);
      try {
        localStorage.removeItem("auth:employeeId");
      } catch (e) {}
      if (redirect) router.push("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
