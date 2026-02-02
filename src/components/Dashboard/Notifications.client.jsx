"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import Portal from "./Portal.client";
import { ContentContext } from "./Context.client";
import { useAuth } from "../../context/AuthProvider.client";
import Admin from "../LeaveQueries/Admin.client";
import Profile from "../Profile/Profile.client";
import "./Notifications.css";

export default function Notifications({
  visible,
  onClose,
  onRead,
  anchorRef = null,
}) {
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const [pos, setPos] = useState(null);
  const { setActiveContent } = useContext(ContentContext);
  const { user } = useAuth();
  const meId = user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

  const headers = useMemo(() => {
    const h = {};
    if (process.env.NEXT_PUBLIC_API_KEY)
      h["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY;
    if (meId) h["x-employee-id"] = meId;
    if (orgId) h["x-org-id"] = orgId;
    return h;
  }, [meId, orgId]);

  const fetchNotifications = useCallback(
    async (signal) => {
      try {
        const res = await axios.get(`/api/notifications`, {
          baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || undefined,
          withCredentials: true,
          headers,
          signal,
        });

        if (signal?.aborted) return;

        const data = res?.data;
        if (Array.isArray(data)) {
          setNotifications(data);
          return;
        }
        if (data?.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          return;
        }
        if (Array.isArray(data?.notifications)) {
          setNotifications(data.notifications);
          return;
        }
        if (Array.isArray(data?.data)) {
          setNotifications(data.data);
          return;
        }

        setNotifications([]);
      } catch (err) {
        if (axios.isCancel?.(err)) return;
        if (err?.name === "CanceledError") return;
        console.error("Error fetching notifications", err);
        setNotifications([]);
      }
    },
    [headers],
  );

  const handleExternalMarkRead = useCallback(
    (e) => {
      const id = e?.detail?.id;
      if (!id) return;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (typeof onRead === "function") onRead();
    },
    [onRead],
  );

  useEffect(() => {
    window.addEventListener("notification-read", handleExternalMarkRead);
    return () =>
      window.removeEventListener("notification-read", handleExternalMarkRead);
  }, [handleExternalMarkRead]);

  const handleOutsideClick = useCallback(
    (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose?.();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [handleOutsideClick]);

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    fetchNotifications(controller.signal);
    return () => controller.abort();
  }, [visible, fetchNotifications]);

  const markRead = useCallback(
    async (id) => {
      try {
        await axios.put(
          `/api/notifications/${encodeURIComponent(id)}/read`,
          {},
          {
            baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || undefined,
            withCredentials: true,
            headers,
          },
        );
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        onRead?.();
      } catch (err) {
        console.error("Error marking notification read", err);
      }
    },
    [headers, onRead],
  );

  const handleClickNotification = useCallback(
    async (note) => {
      try {
        if (note.policy_id) {
          setActiveContent(
            <Admin
              key={`admin-policy-${note.policy_id}`}
              openPolicyId={note.policy_id}
            />,
          );
          onClose?.();
          return;
        }

        if (note.meeting_id) {
          try {
            setActiveContent(
              <NoteDashboard
                key={note.meeting_id}
                highlightedId={note.meeting_id}
              />,
            );
          } catch (err) {
            console.warn("Could not load NoteDashboard dynamically:", err);
            setActiveContent(
              <div>
                <h3>Note</h3>
                <p>Meeting ID: {note.meeting_id}</p>
              </div>,
            );
          }
          onClose?.();
          return;
        }

        const msg = (note.message || "").toLowerCase();
        const isProfileMissing =
          msg.includes("profile") &&
          (msg.includes("incomplete") ||
            msg.includes("missing") ||
            msg.includes("update"));

        if (isProfileMissing) {
          setActiveContent(
            <Profile
              key={`profile-notif-${note.id}`}
              onClose={() => setActiveContent(null)}
              notificationId={note.id}
            />,
          );
          onClose?.();
          return;
        }

        await markRead(note.id);
        onClose?.();
      } catch (err) {
        console.error("Error handling notification click:", err);
      }
    },
    [markRead, onClose, setActiveContent],
  );

  useEffect(() => {
    if (!visible) return;

    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const width = 320;
      const gap = 8;
      const top = rect.bottom + gap;
      const left = Math.min(
        Math.max(8, rect.right - width),
        window.innerWidth - width - 8,
      );
      setPos({ top: Math.round(top), left: Math.round(left) });
    } else {
      setPos(null);
    }
  }, [visible, anchorRef]);

  useEffect(() => {
    if (visible && dropdownRef.current) {
      try {
        dropdownRef.current.focus();
      } catch (e) {}
    }
  }, [visible]);

  if (!visible) return null;

  const style = pos
    ? {
        position: "fixed",
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        zIndex: 999999,
      }
    : { position: "fixed", top: "0", right: "0", zIndex: 999999 };

  return (
    <Portal>
      <div
        className="notifications-dropdown"
        ref={dropdownRef}
        style={style}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <h4>
          Notifications
          <button
            className="mobile-close-btn"
            onClick={() => onClose?.()}
            aria-label="Close notifications"
          >
            ✕
          </button>
        </h4>

        {notifications.length === 0 ? (
          <p className="empty">No new notifications</p>
        ) : (
          notifications.map((note) => {
            const msg = (note.message || "").toLowerCase();
            const isProfileMissing =
              msg.includes("profile") &&
              (msg.includes("incomplete") ||
                msg.includes("missing") ||
                msg.includes("update"));

            return (
              <div
                key={note.id}
                className="notification-item"
                onClick={() => handleClickNotification(note)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    handleClickNotification(note);
                }}
                aria-label={`Notification: ${note.message}`}
              >
                <div className="notification-main">
                  <p className="n_message">{note.message}</p>
                  <small className="n_time">
                    {note.triggered_at
                      ? new Date(note.triggered_at).toLocaleString()
                      : ""}
                  </small>
                </div>

                {isProfileMissing ? (
                  <button
                    className="mark-read disabled"
                    aria-disabled="true"
                    title="This notification is cleared after you update your profile"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ✓
                  </button>
                ) : (
                  <button
                    className="mark-read"
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead(note.id);
                    }}
                    aria-label="Mark as read"
                  >
                    ✓
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </Portal>
  );
}
