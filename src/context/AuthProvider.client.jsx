// context/AuthProvider.client.js
"use client";

import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: async () => {},
  hydrated: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // We no longer block rendering on mount — components should render on refresh.
  const [hydrated] = useState(true);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

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
