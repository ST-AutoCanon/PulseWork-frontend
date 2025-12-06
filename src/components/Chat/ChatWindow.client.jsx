"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useSocket } from "./SocketContext.client";
import { useAuth } from "../../context/AuthProvider.client";
import {
  FaArrowLeft,
  FaPaperclip,
  FaSmile,
  FaPaperPlane,
  FaUsers,
  FaTrash,
  FaMapMarkerAlt,
} from "react-icons/fa";
import FileUpload from "./FileUpload.client";
import UserAvatar from "../EmployeeQueries/UserAvatar.client";
import Picker from "emoji-picker-react";
import MemberListModal from "./MemberListModal.client";
import Modal from "../Modal/Modal.client";
import { getDateLabel } from "./DateLabels";
import "./ChatWindow.css";

async function getLocationAndAddress() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve({
        lat: null,
        lng: null,
        address: "Geolocation not supported",
      });
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const url = new URL("https://nominatim.openstreetmap.org/reverse");
          url.search = new URLSearchParams({
            format: "jsonv2",
            lat: lat.toString(),
            lon: lng.toString(),
            zoom: "18",
            addressdetails: "1",
          }).toString();
          const res = await fetch(url.href);
          const json = await res.json();
          const a = json.address || {};
          const parts = [
            a.road,
            a.suburb,
            a.town || a.city,
            a.county,
            a.state,
            a.postcode,
          ].filter(Boolean);
          resolve({ lat, lng, address: parts.join(", ") || json.display_name });
        } catch {
          resolve({
            lat,
            lng,
            address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          });
        }
      },
      () =>
        resolve({
          lat: null,
          lng: null,
          address: "Permission denied or unavailable",
        }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export default function ChatWindow({ room, onBack }) {
  const { user } = useAuth();
  const meId = user?.employeeId ?? null;
  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.org_id ??
    user?.Org_id ??
    user?.raw?.Org_id ??
    null;
  const socket = useSocket();
  const messagesRef = useRef(null);

  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef(null);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const selectedFileRef = useRef(null);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const showAlert = ({ title = "", message, onConfirm }) =>
    setAlertModal({ isVisible: true, title, message, onConfirm });
  const closeAlert = () =>
    setAlertModal({
      isVisible: false,
      title: "",
      message: "",
      onConfirm: null,
    });

  const headers = {
    "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
    "x-employee-id": meId,
    "x-org-id": orgId,
  };

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((perm) => {
          if (perm.state === "prompt")
            navigator.geolocation.getCurrentPosition(
              () => {},
              () => {}
            );
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!room || room.isNew) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rooms/${room.id}/messages`, {
        withCredentials: true,
        headers,
      })
      .then((r) => {
        const shaped = (r.data || []).map((m) => ({
          id: m.id,
          roomId: m.roomId,
          sender_id: m.senderId,
          sender_name: m.senderName,
          photo_url: m.photoUrl ?? m.photo_url,
          content: m.content,
          type: m.type,
          file_url: m.fileUrl ?? m.file_url,
          sent_at: m.sentAt,
          readAt: m.readAt,
          location:
            m.latitude != null && m.longitude != null
              ? { lat: m.latitude, lng: m.longitude, address: m.address }
              : null,
        }));
        setMsgs(shaped);
      })
      .catch(console.error);
  }, [room, meId]);

  useEffect(() => {
    const handler = (m) => {
      if (m.roomId !== room?.id) return;
      setMsgs((ms) => [
        ...ms,
        {
          id: m.id,
          roomId: m.roomId,
          sender_id: m.senderId,
          sender_name: m.senderName,
          photo_url: m.photoUrl ?? m.photo_url,
          content: m.content,
          type: m.type,
          file_url: m.fileUrl ?? m.file_url,
          sent_at: m.sentAt,
          readAt: m.readAt,
          location: m.location || null,
        },
      ]);
    };
    socket.on("new_message", handler);
    return () => socket.off("new_message", handler);
  }, [socket, room]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [msgs]);

  const doSend = async (payload) => {
    const { lat, lng, address } = await getLocationAndAddress();
    if (lat == null || lng == null) {
      alert("Unable to get your location. Please enable location services.");
      return;
    }
    socket.emit("send_message", {
      ...payload,
      location: { lat, lng, address },
    });
  };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
      /\/+$/,
      ""
    );
    const url = `${base}/ChatUploads`;
    const resp = await axios.post(url, fd, { withCredentials: true, headers });
    return resp.data?.url;
  };

  const send = async () => {
    if ((!txt.trim() && !selectedFile) || !room) return;

    if (selectedFile) {
      try {
        const uploadedUrl = await uploadFile(selectedFile);
        const filenameToken = `[${selectedFile.name}]`;
        const caption = txt.replace(filenameToken, "").trim();
        await doSend({
          roomId: room.id,
          content: caption || "",
          type: "file",
          fileUrl: uploadedUrl,
        });
        setTxt("");
        setSelectedFile(null);
        selectedFileRef.current = null;
        setShowEmojiPicker(false);
      } catch (err) {
        console.error("File upload/send failed:", err);
        alert("Failed to upload or send file");
      }
      return;
    }

    if (txt.trim()) {
      doSend({ roomId: room.id, content: txt, type: "text" });
      setTxt("");
      setShowEmojiPicker(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    const prevName = selectedFileRef.current?.name;
    setTxt((prev) => {
      let newTxt = prev || "";

      if (prevName) {
        const prevToken = `[${prevName}]`;
        newTxt = newTxt
          .split(prevToken)
          .join("")
          .replace(/\s{2,}/g, " ")
          .trim();
        if (newTxt) newTxt += " ";
      }

      const token = `[${file.name}]`;
      if (newTxt.includes(token)) return newTxt + " ";
      return (newTxt + token + " ").trim() + " ";
    });

    setSelectedFile(file);
    selectedFileRef.current = file;
  };

  useEffect(() => {
    if (!selectedFile) return;
    const token = `[${selectedFile.name}]`;
    if (!txt.includes(token)) {
      setSelectedFile(null);
      selectedFileRef.current = null;
    }
  }, [txt, selectedFile]);

  const downloadFile = async (filename) => {
    try {
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
        /\/+$/,
        ""
      );
      const url = `${base}${filename}`;
      const resp = await fetch(url, { credentials: "include", headers });
      if (!resp.ok) throw new Error(`status ${resp.status}`);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename.split("/").pop() || filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("downloadFile error:", err);
      alert("Could not download file");
    }
  };

  useEffect(() => {
    if (room?.is_group === 1) {
      axios
        .get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/rooms/${room.id}/members`,
          { withCredentials: true, headers }
        )
        .then((r) => setMembers(r.data))
        .catch(console.error);
    } else {
      setMembers([]);
    }
  }, [room, meId]);

  const grouped = React.useMemo(() => {
    if (!room) return [];
    const groups = [];
    let lastLabel = null;
    msgs.forEach((m) => {
      const label = getDateLabel(m.sent_at);
      if (label !== lastLabel) {
        groups.push({ label, messages: [m] });
        lastLabel = label;
      } else groups[groups.length - 1].messages.push(m);
    });
    return groups;
  }, [msgs, room]);

  if (!room) return <div className="chat-window empty">Select a chat</div>;

  return (
    <div className="chat-window">
      <div className="m-header">
        <button
          className="back-btn"
          onClick={onBack}
          aria-label="Back to chat list"
        >
          <FaArrowLeft />
        </button>
        <UserAvatar
          photoUrl={room.photo_url}
          role={room.role}
          gender={room.gender}
          apiKey={process.env.NEXT_PUBLIC_API_KEY}
          className="header-avatar"
        />
        <div className="chat-header-title">
          {room.name ||
            room.members
              ?.filter((m) => m.employeeId !== meId)
              .map((m) => m.name)
              .join(", ") ||
            "Chat"}
        </div>
        {room.is_group === 1 && (
          <button
            className="members-btn"
            onClick={() => setShowMembers(true)}
            title="View members"
          >
            <FaUsers />
          </button>
        )}
      </div>

      <div className="messages" ref={messagesRef}>
        {grouped.map(({ label, messages }) => (
          <React.Fragment key={label}>
            <div className="date-separator">{label}</div>
            {messages.map((m, idx) => {
              const isMe = m.sender_id === meId;
              const isLast = idx === messages.length - 1 && room.is_group === 0;
              const isSeen = isMe && m.readAt != null;
              return (
                <div key={m.id} className={`msg-row ${isMe ? "me" : "them"}`}>
                  {!isMe && (
                    <UserAvatar
                      photoUrl={m.photo_url}
                      role={m.sender_role}
                      gender={m.sender_gender}
                      apiKey={process.env.NEXT_PUBLIC_API_KEY}
                      className="msg-avatar"
                    />
                  )}
                  <div
                    className={`msg-bubble ${
                      isMe ? "me-bubble" : "them-bubble"
                    }`}
                  >
                    {room.is_group === 1 && !isMe && m.sender_name && (
                      <div className="msg-sender">{m.sender_name}</div>
                    )}
                    {m.type === "text" ? (
                      <div className="msg-content">{m.content}</div>
                    ) : (
                      <button
                        className="msg-download-btn"
                        onClick={() => downloadFile(m.file_url)}
                      >
                        <FaPaperclip /> Download
                      </button>
                    )}
                    <div className="msg-time">
                      {new Date(m.sent_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {isLast && isSeen && <div className="msg-seen">Seen</div>}
                  <div className="msg-icons">
                    {m.location && (
                      <button
                        className="msg-address-icon"
                        title={m.location.address}
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${m.location.lat},${m.location.lng}`,
                            "_blank"
                          )
                        }
                      >
                        <FaMapMarkerAlt />
                      </button>
                    )}
                    {isMe && (
                      <button
                        className="msg-delete-btn"
                        title="Delete message"
                        onClick={() =>
                          showAlert({
                            message:
                              "Are you sure you want to permanently delete this message?",
                            onConfirm: async () => {
                              await axios.delete(
                                `${process.env.NEXT_PUBLIC_BACKEND_URL}/rooms/${room.id}/messages/${m.id}`,
                                { withCredentials: true, headers }
                              );
                              setMsgs((old) =>
                                old.filter((x) => x.id !== m.id)
                              );
                              closeAlert();
                            },
                          })
                        }
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  {isMe && <div className="msg-spacer" />}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="input-area">
        <div className="emoji-picker-container">
          <button
            className="icon-btn"
            onClick={() => setShowEmojiPicker((o) => !o)}
          >
            <FaSmile />
          </button>
          {showEmojiPicker && (
            <div className="emoji-dropdown" ref={emojiRef}>
              <Picker
                onEmojiClick={(emojiData) =>
                  setTxt((p) => p + (emojiData?.emoji || ""))
                }
                pickerStyle={{ width: "100%" }}
              />
            </div>
          )}
        </div>

        <FileUpload
          onSelect={handleFileSelect}
          employeeId={meId}
          orgId={orgId}
        />

        <textarea
          className="m-input"
          rows={2}
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          placeholder="Type a message"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button className="send-btn" onClick={send}>
          <FaPaperPlane />
        </button>
      </div>

      {showMembers && (
        <MemberListModal
          roomId={room.id}
          members={members}
          setMembers={setMembers}
          onClose={() => setShowMembers(false)}
          apiKey={process.env.NEXT_PUBLIC_API_KEY}
        />
      )}

      <Modal
        isVisible={alertModal.isVisible}
        title={alertModal.title}
        onClose={closeAlert}
        buttons={[
          { label: "Cancel", className: "cancel-btn", onClick: closeAlert },
          {
            label: "Delete",
            className: "confirm-btn",
            onClick: alertModal.onConfirm,
          },
        ]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
}
