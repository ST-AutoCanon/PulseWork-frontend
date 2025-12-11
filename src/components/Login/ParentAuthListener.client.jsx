// src/components/ParentAuthListener.client.jsx
"use client";

import React, { useEffect, useCallback } from "react";

/**
 * Minimal ParentAuthListener
 * - Accepts messages from allowed parent origins and forwards them same-origin
 *   (so Login can pick them up whether it mounts early or late).
 * - Acknowledges the parent with a small 'forwarded' message.
 */

export default function ParentAuthListener() {
  const ALLOWED_PARENT_ORIGINS = [
    "http://localhost:1574",
    "http://localhost:8080",
  ];
  const LOCAL_ORIGIN =
    typeof window !== "undefined" ? window.location.origin : "";

  const replyToParent = useCallback((msg, targetOrigin) => {
    try {
      const parent =
        window.top && window.top !== window.self ? window.top : window.parent;
      if (parent) parent.postMessage(msg, targetOrigin || "*");
    } catch (err) {
      console.warn("replyToParent failed", err, msg);
    }
  }, []);

  useEffect(() => {
    function handleParentMessage(ev) {
      try {
        // Accept only from configured parent origins
        if (!ALLOWED_PARENT_ORIGINS.includes(ev.origin)) return;
        const msg = ev.data || {};
        if (msg.type !== "parent-login") return;

        const { username, password } = msg;
        if (!username || !password) {
          replyToParent(
            { type: "login-failed", error: "Missing credentials" },
            ev.origin
          );
          return;
        }

        // stash a short-lived copy for late-mounted login component
        try {
          window.__PARENT_LOGIN_PENDING = {
            username,
            password,
            sourceOrigin: ev.origin,
            createdAt: Date.now(),
          };
        } catch (e) {
          // non-fatal
        }

        // forward as same-origin message (so local Login listener gets it)
        try {
          window.postMessage(
            {
              type: "parent-login",
              username,
              password,
              sourceOrigin: ev.origin,
            },
            LOCAL_ORIGIN
          );
          replyToParent(
            { type: "forwarded", note: "credentials forwarded" },
            ev.origin
          );
        } catch (err) {
          console.error("[ParentAuthListener] forward failed", err);
          replyToParent(
            { type: "login-failed", error: "Internal forward error" },
            ev.origin
          );
        }
      } catch (err) {
        console.error("[ParentAuthListener] error", err);
      }
    }

    window.addEventListener("message", handleParentMessage, false);
    return () =>
      window.removeEventListener("message", handleParentMessage, false);
  }, [ALLOWED_PARENT_ORIGINS, LOCAL_ORIGIN, replyToParent]);

  return null;
}
