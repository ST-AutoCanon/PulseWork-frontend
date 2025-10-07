"use client";

import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { ContentContext } from "./Context.client";
import { useAuth } from "../../context/AuthProvider.client"; // <-- adjust path as needed
import "./Notifications.css";

export default function Notifications({ visible, onClose, onRead }) {
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const { setActiveContent } = useContext(ContentContext);
  const { user } = useAuth();
  const meId = user?.employeeId ?? user?.employee_id ?? user?.id ?? null;

  function getHeaders() {
    const headers = {};
    if (process.env.NEXT_PUBLIC_API_KEY) {
      headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY;
    }
    if (meId) {
      headers["x-employee-id"] = meId;
    }
    return headers;
  }

  useEffect(() => {
    if (!visible) return;

    const controller = new AbortController();
    let mounted = true;

    async function fetchNotifications() {
      try {
        const res = await axios.get(`/api/notifications`, {
          baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || undefined,
          headers: getHeaders(),
          signal: controller.signal,
        });

        if (!mounted) return;

        // normalize several possible server response shapes
        if (res?.data?.success && Array.isArray(res.data.notifications)) {
          setNotifications(res.data.notifications);
        } else if (Array.isArray(res?.data)) {
          setNotifications(res.data);
        } else if (Array.isArray(res?.data?.notifications)) {
          setNotifications(res.data.notifications);
        } else if (Array.isArray(res?.data?.data)) {
          setNotifications(res.data.data);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        if (axios.isCancel?.(err)) return;
        if (err?.name === "CanceledError") return;
        console.error("Error fetching notifications", err);
        if (mounted) setNotifications([]);
      }
    }

    fetchNotifications();

    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, meId]);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const markRead = async (id) => {
    try {
      await axios.put(
        `/api/notifications/${encodeURIComponent(id)}/read`,
        {},
        {
          baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || undefined,
          headers: getHeaders(),
        }
      );
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      onRead?.();
    } catch (err) {
      console.error("Error marking notification read", err);
    }
  };

  const handleClickNotification = async (note) => {
    // optimistic: mark read locally and notify parent
    await markRead(note.id);
    onClose?.();

    // try to open NoteDashboard dynamically; fallback to a simple view
    try {
      setActiveContent(
        <NoteDashboard
          key={note.meeting_id ?? note.id}
          highlightedId={note.meeting_id ?? note.id}
        />
      );
    } catch (err) {
      console.warn("Could not load NoteDashboard dynamically:", err);
      setActiveContent(
        <div>
          <h3>Note</h3>
          <p>Meeting ID: {note.meeting_id ?? note.id}</p>
        </div>
      );
    }
  };

  if (!visible) return null;

  return (
    <div className="notifications-dropdown" ref={dropdownRef}>
      <h4>Notifications</h4>

      {notifications.length === 0 ? (
        <p className="empty">No new notifications</p>
      ) : (
        notifications.map((note) => (
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
          >
            <p className="n_message">{note.message}</p>
            <small className="n_time">
              {note.triggered_at
                ? new Date(note.triggered_at).toLocaleString()
                : ""}
            </small>
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
          </div>
        ))
      )}
    </div>
  );
}
