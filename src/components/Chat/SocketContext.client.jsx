"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthProvider.client"; // adjust path if your AuthProvider is elsewhere

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth(); // user expected to contain employeeId and orgId
  const [socket, setSocket] = useState(null);
  const [connecting, setConnecting] = useState(true);

  const userId = useMemo(() => user?.employeeId ?? null, [user]);
  const orgId = useMemo(() => user?.orgId ?? null, [user]);

  // Determine backend URL from NEXT_PUBLIC_BACKEND_URL (fallback to location.origin)
  const BACKEND_URL = useMemo(() => {
    if (typeof process !== "undefined") {
      return (
        process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL
      );
    }
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  useEffect(() => {
    // only run on client
    if (typeof window === "undefined") return;

    // If we don't have a logged-in user, skip trying to connect
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

    // Build socket URL (keep origin if BACKEND_URL contains path)
    let socketUrl = BACKEND_URL;
    let socketPath = "/socket.io";

    try {
      const parsed = new URL(BACKEND_URL);
      socketUrl = `${parsed.protocol}//${parsed.host}`;
      // keep socketPath default; you may override with NEXT_PUBLIC_SOCKET_PATH
    } catch {
      // BACKEND_URL may be relative; keep as-is
    }

    const socketPathEnv =
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SOCKET_PATH) ||
      null;
    if (socketPathEnv) socketPath = socketPathEnv;

    // attach user and org in query for server-side auth/identification
    const sock = io(socketUrl, {
      path: socketPath,
      query: { userId, orgId },
      reconnectionAttempts: 5,
      timeout: 20000,
      autoConnect: true,
    });

    const onConnect = () => {
      console.log(
        `Socket connected as ${sock.id} (userId=${userId}, orgId=${orgId})`
      );
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
      } catch (e) {
        /* ignore cleanup errors */
      }
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, orgId, BACKEND_URL]);

  if (!socket && connecting) {
    return <div>Connecting to chat…</div>;
  }

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
