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
  const orgId = user?.orgId || null;
  const headers = {
    "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
    "x-employee-id": meId,
    "x-org-id": orgId,
  };

  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees`, { headers })
      .then((r) => setEmployees(r.data.data || []))
      .catch(() => setEmployees([]));
  }, [headers]);

  const suggestions = employees.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggle = (emp) => {
    setSelected((sel) =>
      sel.find((s) => s.employee_id === emp.employee_id)
        ? sel.filter((s) => s.employee_id !== emp.employee_id)
        : [...sel, emp]
    );
  };

  const create = () => {
    if (!name.trim() || selected.length === 0) return;
    socket.emit("create_room", {
      name,
      isGroup: true,
      members: selected.map((s) => s.employee_id),
    });
    onCreate();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Create Group</h3>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="selected-chips">
            {selected.map((u) => (
              <div key={u.employee_id} className="chip">
                <UserAvatar
                  photoUrl={u.photo_url}
                  role={u.role}
                  gender={u.gender}
                  apiKey={apiKey}
                  className="chip-avatar"
                />
                <span className="chip-name">{u.name}</span>
                <button
                  className="chip-remove"
                  onClick={() => toggle(u)}
                  aria-label={`Remove ${u.name}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Group name */}
        <input
          className="group-name-input"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Search */}
        <input
          className="msg-search"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Suggestions */}
        {searchTerm && (
          <div className="suggestions-list">
            {suggestions.length > 0 ? (
              suggestions.map((u) => {
                const isSel = !!selected.find(
                  (s) => s.employee_id === u.employee_id
                );
                return (
                  <div
                    key={u.employee_id}
                    className={`suggestion-item ${isSel ? "selected" : ""}`}
                    onClick={() => toggle(u)}
                  >
                    <UserAvatar
                      photoUrl={u.photo_url}
                      role={u.role}
                      gender={u.gender}
                      apiKey={apiKey}
                      className="chat-avatar-small"
                    />
                    <span>{u.name}</span>
                  </div>
                );
              })
            ) : (
              <div className="no-results">No matches</div>
            )}
          </div>
        )}

        {/* Actions */}
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
