// src/context/AuthProvider.client.jsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: async () => {},
  hydrated: false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  // optional: try to hydrate from server session (GET /me)
  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      if (!BACKEND_URL) {
        setHydrated(true);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/me`, {
          method: "GET",
          credentials: "include",
          headers: { "x-api-key": API_KEY || "" },
        });
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          const payload = json?.message ?? json;
          if (payload) {
            const serverUser = {
              id:
                payload.id ?? payload.employeeId ?? payload.employee_id ?? null,
              employeeId:
                payload.dashboard?.employeeId ??
                payload.employeeId ??
                payload.employee_id ??
                null,
              role: payload.role ?? null,
              name: payload.name ?? payload.dashboard?.name ?? null,
              gender: payload.gender ?? payload.dashboard?.gender ?? null,
              orgId: payload.org_id ?? payload.orgId ?? payload.Org_id ?? null,
              dashboard: payload.dashboard ?? {},
              sidebarMenu: payload.sidebarMenu ?? [],
              raw: payload,
            };
            setUser(serverUser);
          }
        }
      } catch (err) {
        // ignore if /me not implemented
      } finally {
        if (mounted) setHydrated(true);
      }
    }
    hydrate();
    return () => {
      mounted = false;
    };
  }, [BACKEND_URL, API_KEY]);

  const login = async (serverUser) => {
    setUser(serverUser);
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
