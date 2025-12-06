"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthProvider.client";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connecting, setConnecting] = useState(true);

  const userId = useMemo(() => user?.employeeId ?? null, [user]);
  const orgId = useMemo(
    () =>
      user?.orgId ??
      user?.org_id ??
      user?.raw?.org_id ??
      user?.Org_id ??
      user?.raw?.Org_id ??
      null,
    [user]
  );

  const BACKEND_URL = useMemo(() => {
    if (typeof process !== "undefined") {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!userId) {
      console.warn("SocketProvider: no employeeId available from useAuth()");
      setConnecting(false);
      return;
    }

    if (!BACKEND_URL) {
      console.error("SocketProvider: BACKEND_URL not configured");
      setConnecting(false);
      return;
    }

    setConnecting(true);

    let socketUrl = BACKEND_URL;
    let socketPath = "/socket.io";

    try {
      const parsed = new URL(BACKEND_URL);
      socketUrl = `${parsed.protocol}//${parsed.host}`;
    } catch {}

    const socketPathEnv =
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SOCKET_PATH) ||
      null;
    if (socketPathEnv) socketPath = socketPathEnv;

    const sock = io(socketUrl, {
      path: "/api/socket.io",
      auth: { userId, orgId, apiKey: process.env.NEXT_PUBLIC_API_KEY },
      reconnectionAttempts: 5,
      timeout: 20000,
      autoConnect: true,
    });

    const onConnect = () => {
      setConnecting(false);
    };
    const onConnectError = (err) => {
      console.error("Socket connect_error:", err?.message || err);
      setConnecting(false);
    };

    sock.on("connect", onConnect);
    sock.on("connect_error", onConnectError);

    setSocket(sock);

    return () => {
      try {
        sock.off("connect", onConnect);
        sock.off("connect_error", onConnectError);
        sock.disconnect();
      } catch (e) {}
      setSocket(null);
    };
  }, [userId, orgId, BACKEND_URL]);

  if (!socket && connecting) {
    return <div>Connecting to chat…</div>;
  }

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
