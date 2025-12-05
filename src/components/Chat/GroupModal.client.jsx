"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSocket } from "./SocketContext.client";
import { useAuth } from "../../context/AuthProvider.client";
import UserAvatar from "../EmployeeQueries/UserAvatar.client";
import "./GroupModal.css";

export default function GroupModal({ onCreate, onClose, employeeId }) {
  const { user } = useAuth();
  const socket = useSocket();
  const meId = employeeId || user?.employeeId || null;
  const orgId = user?.orgId || user?.org_id || null;

  const headers = {
    "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
    "x-employee-id": meId,
    "x-org-id": orgId,
  };

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;

  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");

  const idOf = (u) => String(u?.employee_id ?? u?.employeeId ?? u?.id ?? "");
  const nameOf = (u) => u?.name ?? u?.fullName ?? "";

  useEffect(() => {
    if (!meId) return;
    let mounted = true;

    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees`, {
        withCredentials: true,
        headers,
      })
      .then((r) => {
        if (!mounted) return;
        setEmployees(r.data?.data || []);
      })
      .catch(() => {
        if (!mounted) return;
        setEmployees([]);
      });

    return () => {
      mounted = false;
    };
  }, [meId]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const suggestions = employees.filter((u) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return false;
    const nm = nameOf(u).toLowerCase();
    const eid = idOf(u).toLowerCase();
    return nm.includes(q) || eid.includes(q);
  });

  const toggle = (emp) => {
    const empId = idOf(emp);
    setSelected((sel) => {
      const exists = sel.some((s) => idOf(s) === empId);
      if (exists) return sel.filter((s) => idOf(s) !== empId);
      return [...sel, emp];
    });
  };

  const create = () => {
    if (!name.trim() || selected.length === 0) return;
    if (!socket || !socket.connected) {
      console.warn("Socket not ready — cannot create group");
      return;
    }
    socket.emit("create_room", {
      name,
      isGroup: true,
      members: selected.map((s) => idOf(s)),
    });
    if (typeof onCreate === "function") onCreate();
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <h3>Create Group</h3>

        {selected.length > 0 && (
          <div className="selected-chips">
            {selected.map((u) => (
              <div key={idOf(u)} className="chip">
                <UserAvatar
                  photoUrl={u.photo_url}
                  role={u.role}
                  gender={u.gender}
                  apiKey={apiKey}
                  className="chip-avatar"
                />
                <span className="chip-name">{nameOf(u)}</span>
                <button
                  className="chip-remove"
                  onClick={() => toggle(u)}
                  aria-label={`Remove ${nameOf(u)}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          className="group-name-input"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="msg-search"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {searchTerm && (
          <div className="suggestions-list">
            {suggestions.length > 0 ? (
              suggestions.map((u) => {
                const isSel = selected.some((s) => idOf(s) === idOf(u));
                return (
                  <div
                    key={idOf(u)}
                    className={`suggestion-item ${isSel ? "selected" : ""}`}
                    onClick={() => toggle(u)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggle(u);
                    }}
                  >
                    <UserAvatar
                      photoUrl={u.photo_url}
                      role={u.role}
                      gender={u.gender}
                      apiKey={apiKey}
                      className="chat-avatar-small"
                    />
                    <span>{nameOf(u)}</span>
                  </div>
                );
              })
            ) : (
              <div className="no-results">No matches</div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button
            className="create-btn"
            onClick={create}
            disabled={!name.trim() || selected.length === 0}
          >
            Create
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
