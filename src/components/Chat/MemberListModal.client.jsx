"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import UserAvatar from "../EmployeeQueries/UserAvatar.client";
import Modal from "../Modal/Modal.client";
import "./MemberListModal.css";
import { useAuth } from "../../context/AuthProvider.client";

export default function MemberListModal({
  roomId,
  members = [],
  setMembers,
  onClose,
  apiKey,
  employeeId,
}) {
  const { user } = useAuth();
  const [allEmployees, setAllEmployees] = useState([]);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(null);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [creatorId, setCreatorId] = useState(null);

  const meId = employeeId || user?.employeeId || null;
  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.org_id ??
    user?.Org_id ??
    user?.raw?.Org_id ??
    null;

  const API_KEY = apiKey || process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const headers = useMemo(
    () => ({
      "x-api-key": API_KEY ?? "",
      "x-employee-id": meId ?? "",
      "x-org-id": orgId ?? "",
    }),
    [API_KEY, meId, orgId]
  );

  const showAlert = ({ title = "", message = "", onConfirm = null }) => {
    setAlertModal({ isVisible: true, title, message, onConfirm });
  };
  const closeAlert = () =>
    setAlertModal({
      isVisible: false,
      title: "",
      message: "",
      onConfirm: null,
    });

  useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    axios
      .get(`${BASE_URL}/rooms/${roomId}/members`, {
        withCredentials: true,
        headers,
      })
      .then((res) => {
        if (!mounted) return;
        const data = res.data || [];
        if (typeof setMembers === "function") setMembers(data);
        setCreatorId(data?.[0]?.creatorId ?? null);
      })
      .catch((err) => {
        console.error("Failed to load members:", err);
      });
    return () => {
      mounted = false;
    };
  }, [roomId, BASE_URL, JSON.stringify(headers), setMembers]);

  useEffect(() => {
    let mounted = true;
    axios
      .get(`${BASE_URL}/employees`, { withCredentials: true, headers })
      .then((r) => {
        if (!mounted) return;
        setAllEmployees(r.data?.data || []);
      })
      .catch((err) => {
        console.error("Failed to load employees:", err);
        setAllEmployees([]);
      });
    return () => {
      mounted = false;
    };
  }, [BASE_URL, JSON.stringify(headers)]);

  const suggestions = allEmployees
    .filter(
      (u) =>
        (u.name || "").toLowerCase().includes(query.toLowerCase()) ||
        (u.employee_id || "").toLowerCase().includes(query.toLowerCase())
    )
    .filter((u) => !members.some((m) => m.employee_id === u.employee_id));

  const addMember = async (empId) => {
    setAdding(empId);
    try {
      await axios.post(
        `${BASE_URL}/rooms/${roomId}/members`,
        { employeeId: empId },
        { withCredentials: true, headers }
      );
      const { data } = await axios.get(`${BASE_URL}/rooms/${roomId}/members`, {
        withCredentials: true,
        headers,
      });
      if (typeof setMembers === "function") setMembers(data);
      setQuery("");
    } catch (err) {
      console.error("Failed to add member:", err);
    } finally {
      setAdding(null);
    }
  };

  const confirmRemove = (empId) => {
    showAlert({
      message: "This will remove them from the group. Continue?",
      onConfirm: async () => {
        try {
          await axios.delete(`${BASE_URL}/rooms/${roomId}/members/${empId}`, {
            withCredentials: true,
            headers,
          });
          const { data } = await axios.get(
            `${BASE_URL}/rooms/${roomId}/members`,
            { withCredentials: true, headers }
          );
          if (typeof setMembers === "function") setMembers(data);
        } catch (err) {
          console.error("Failed to remove member:", err);
        } finally {
          closeAlert();
        }
      },
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="member-modal" onClick={(e) => e.stopPropagation()}>
          <h4>Group Members</h4>
          <ul className="member-list">
            {members.map((u) => (
              <li key={u.employee_id} className="member-item">
                <UserAvatar
                  photoUrl={u.photo_url}
                  role={u.role}
                  gender={u.gender}
                  apiKey={API_KEY}
                  className="member-avatar"
                />
                <span className="member-name">
                  {u.name}
                  {u.employee_id === creatorId && (
                    <span className="creator-badge"> (Creator)</span>
                  )}
                </span>
                {creatorId === meId && u.employee_id !== creatorId && (
                  <button
                    className="remove-btn"
                    disabled={adding === u.employee_id}
                    onClick={() => confirmRemove(u.employee_id)}
                    title="Remove from group"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>

          <hr />

          {creatorId === meId && (
            <>
              <input
                type="text"
                placeholder="Add member by name or ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="member-search"
              />
              {query && (
                <ul className="suggestions-list">
                  {suggestions.length > 0 ? (
                    suggestions.map((u) => (
                      <li key={u.employee_id} className="suggestion-item">
                        <UserAvatar
                          photoUrl={u.photo_url}
                          role={u.role}
                          gender={u.gender}
                          apiKey={API_KEY}
                          className="suggest-avatar"
                        />
                        <span>{u.name}</span>
                        <button
                          disabled={adding === u.employee_id}
                          onClick={() => addMember(u.employee_id)}
                        >
                          {adding === u.employee_id ? "Adding…" : "Add"}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="no-suggest">No matches</li>
                  )}
                </ul>
              )}
            </>
          )}

          <button className="member-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <Modal
        isVisible={alertModal.isVisible}
        title={alertModal.title}
        onClose={closeAlert}
        buttons={[
          { label: "Cancel", className: "cancel-btn", onClick: closeAlert },
          {
            label: "Remove",
            className: "confirm-btn",
            onClick: alertModal.onConfirm,
          },
        ]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </>
  );
}
