// src/components/ProtectedLayout.client.jsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider.client";

const IDLE_TIMEOUT = 5 * 60 * 1000;
const CHECK_INTERVAL = 60 * 1000;

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const { user, logout, hydrated } = useAuth();
  const lastActivityRef = useRef(Date.now());

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
    try {
      // optional: store to sessionStorage if you want cross-tab sync
      sessionStorage.setItem("lastActivity", String(lastActivityRef.current));
    } catch {}
  };

  const syncFromStorage = () => {
    try {
      const v = sessionStorage.getItem("lastActivity");
      if (!v) return;
      const stored = parseInt(v, 10);
      // only adopt the stored time if it's *newer* than our current value
      if (!isNaN(stored) && stored > lastActivityRef.current) {
        lastActivityRef.current = stored;
      }
    } catch {}
  };

  useEffect(() => {
    // events to consider: mouse, keyboard, touch, scroll, focus/tab visibility
    const events = [
      "mousemove",
      "keydown",
      "click",
      "touchstart",
      "scroll",
      "focus",
    ];
    events.forEach((ev) => window.addEventListener(ev, updateActivity, true));

    const onVisibility = () => {
      if (!document.hidden) updateActivity();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // If you want cross-tab sync of activity, listen to storage events
    const onStorage = (e) => {
      if (e.key === "lastActivity") syncFromStorage();
    };
    window.addEventListener("storage", onStorage);

    // initial activity set — IMPORTANT: do this BEFORE first check
    updateActivity();

    // Periodic check
    const doCheck = async () => {
      // only run idle-logout if we actually have a logged-in user and auth hydrated
      if (!hydrated || !user) return;

      // try to update from other tabs but only if it's newer
      syncFromStorage();

      if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT) {
        try {
          // mark tab for login page modal (if you want the UI behavior)
          sessionStorage.setItem("loggedOutDueToInactivity", "true");
        } catch {}
        // call logout (this will call backend /logout via your provider)
        await logout({ redirect: true, reason: "idle" });
      }
    };

    // run immediate check + interval (now safe because we already called updateActivity)
    doCheck();
    const id = setInterval(doCheck, CHECK_INTERVAL);

    return () => {
      events.forEach((ev) =>
        window.removeEventListener(ev, updateActivity, true)
      );
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hydrated]);

  return <>{children}</>;
}
