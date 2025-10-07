"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSocket } from "./SocketContext.client";
import { useAuth } from "../../context/AuthProvider.client"; // <-- useAuth
import UserAvatar from "../EmployeeQueries/UserAvatar.client";
import GroupModal from "./GroupModal.client";
import { FaTrash } from "react-icons/fa";
import "./ChatList.css";
import Modal from "../Modal/Modal.client";

export default function ChatList({ onSelect }) {
  const socket = useSocket();
  const { user } = useAuth(); // get authenticated user

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const meId = user?.employeeId ?? null;

  const headers = useMemo(
    () => ({ "x-api-key": API_KEY, "x-employee-id": meId }),
    [API_KEY, meId]
  );

  const [rooms, setRooms] = useState([]);
  const [tab, setTab] = useState("private");
  const [mode, setMode] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeId, setActiveId] = useState(null);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const showAlert = ({ title = "", message, onConfirm }) => {
    setAlertModal({ isVisible: true, title, message, onConfirm });
  };

  const closeAlert = () =>
    setAlertModal({
      isVisible: false,
      title: "",
      message: "",
      onConfirm: null,
    });

  // Fetch rooms + socket listener
  useEffect(() => {
    if (!meId) return; // wait until user is loaded
    let mounted = true;

    axios
      .get(`${BASE_URL}/rooms`, { headers })
      .then((r) => {
        if (!mounted) return;
        setRooms(r.data || []);
      })
      .catch(() => {
        if (!mounted) return;
        setRooms([]);
      });

    const onRoomCreated = (newRoom) => {
      setRooms((rs) => [newRoom, ...rs]);
      const id = newRoom.id;
      setActiveId(id);
      if (typeof onSelect === "function") onSelect(newRoom);
    };

    socket.on("room_created", onRoomCreated);

    return () => {
      mounted = false;
      socket.off("room_created", onRoomCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, BASE_URL, headers, onSelect, meId]);

  // Fetch employees for private search
  useEffect(() => {
    if (!meId || tab !== "private") return;
    let mounted = true;

    axios
      .get(`${BASE_URL}/employees`, { headers })
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
  }, [tab, BASE_URL, headers, meId]);

  // Filtering
  const filteredRooms = rooms.filter((r) =>
    r.is_group ? tab === "group" : tab === "private"
  );
  const suggestions = employees.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.employee_id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteGroup = (roomId) => {
    showAlert({
      message: "Are you sure you want to delete this group permanently?",
      onConfirm: async () => {
        try {
          await axios.delete(`${BASE_URL}/rooms/${roomId}`, { headers });
          setRooms((rs) => rs.filter((r) => r.id !== roomId));
          if (activeId === roomId) setActiveId(null);
        } catch (err) {
          console.error("Failed to delete group:", err);
        } finally {
          closeAlert();
        }
      },
    });
  };

  return (
    <div className="chat-list">
      {/* Tabs */}
      <div className="chat-tabs">
        <button
          className={tab === "private" ? "active" : ""}
          onClick={() => {
            setTab("private");
            setMode(null);
            setActiveId(null);
          }}
        >
          Private
        </button>
        <button
          className={tab === "group" ? "active" : ""}
          onClick={() => {
            setTab("group");
            setMode(null);
            setActiveId(null);
          }}
        >
          Group
        </button>
      </div>

      {/* Private search OR New Group */}
      <div className="new-chat-area">
        {tab === "private" ? (
          <>
            <input
              className="chat-search"
              placeholder="Search or start new…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="search-suggestions">
                {suggestions.length > 0 ? (
                  suggestions.map((u) => (
                    <div
                      key={u.employee_id}
                      className="suggestion-item"
                      onClick={() => {
                        socket.emit("create_room", {
                          name: "",
                          isGroup: false,
                          members: [u.employee_id],
                        });
                        setSearchTerm("");
                      }}
                    >
                      <UserAvatar
                        photoUrl={u.photo_url}
                        role={u.role}
                        gender={u.gender}
                        apiKey={API_KEY}
                        className="chat-avatar-small"
                      />
                      <span>{u.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-suggest">No users found</div>
                )}
              </div>
            )}
          </>
        ) : (
          <button className="new-group-btn" onClick={() => setMode("group")}>
            + New Group
          </button>
        )}
      </div>

      {/* Room list */}
      <div className="rooms-container">
        {filteredRooms.map((r) => (
          <div key={r.id} className="chat-list-item-wrapper">
            <div
              className={`chat-list-item ${activeId === r.id ? "active" : ""}`}
              onMouseDown={(e) => e.preventDefault()} // prevent focus scroll
              onClick={(e) => {
                e.preventDefault(); // prevent default scrolling
                setActiveId(r.id);
                if (typeof onSelect === "function") onSelect(r);
              }}
            >
              <UserAvatar
                photoUrl={r.photo_url}
                role={r.role}
                gender={r.gender}
                apiKey={API_KEY}
                className="chat-avatar"
              />
              <span className="chat-name">
                {r.name}
                {r.unreadCount > 0 && (
                  <span className="unread-badge">{r.unreadCount}</span>
                )}
              </span>
            </div>
            {r.is_group === 1 && String(r.createdBy) === String(meId) && (
              <button
                className="delete-group-btn"
                onClick={() => deleteGroup(r.id)}
                title="Delete group"
              >
                <FaTrash />
              </button>
            )}
          </div>
        ))}
        {filteredRooms.length === 0 && (
          <div className="empty-placeholder">
            {tab === "private" ? "No private chats" : "No groups yet"}
          </div>
        )}
      </div>

      {/* Group Modal */}
      {mode === "group" && (
        <GroupModal
          onCreate={() => setMode(null)}
          onClose={() => setMode(null)}
        />
      )}

      <Modal
        isVisible={alertModal.isVisible}
        title={alertModal.title}
        onClose={closeAlert}
        buttons={[
          { label: "Cancel", onClick: closeAlert },
          { label: "Delete", onClick: alertModal.onConfirm },
        ]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
}
