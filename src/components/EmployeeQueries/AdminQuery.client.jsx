"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FiPaperclip } from "react-icons/fi";
import { io } from "socket.io-client";
import UserAvatar from "./UserAvatar.client";
import Modal from "../Modal/Modal.client";
import "./AdminQuery.css";
import { useAuth } from "../../context/AuthProvider.client";

const AdminQuery = () => {
  const { user } = useAuth();
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const employeeId = user?.employeeId ?? user?.id ?? null;
  const name = user?.name ?? user?.fullName ?? user?.displayName ?? "";
  const userRole = user?.role ?? user?.userRole ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachmentBase64, setAttachmentBase64] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [loadingQueries, setLoadingQueries] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);
  const selectedThreadIdRef = useRef(null);
  const [attachmentFile, setAttachmentFile] = useState(null);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const headersBase = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
    ...(employeeId ? { "x-employee-id": employeeId } : {}),
    ...(orgId ? { "x-org-id": orgId } : {}),
  };

  useEffect(() => {
    selectedThreadIdRef.current = selectedQuery?.id ?? null;
  }, [selectedQuery]);

  useEffect(() => {
    if (!employeeId) {
      console.warn("[socket] not connecting: employeeId missing");
      setLoading(false);
      return;
    }
    if (!BACKEND_URL) {
      console.warn("[socket] BACKEND_URL not configured");
      setLoading(false);
      return;
    }

    const socket = io(BACKEND_URL, {
      query: { userId: employeeId },
      auth: { apiKey: API_KEY, orgId },
      path: "/api/socket.io",
    });

    socketRef.current = socket;

    const onConnect = () =>
      console.log("[socket] connected", socket.id, "userId=", employeeId);
    const onDisconnect = (reason) =>
      console.log("[socket] disconnected", reason);
    const onConnectError = (err) =>
      console.error("[socket] connect_error", err);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    const addIfNotExists = (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => {
          if (m.id && msg.id) return String(m.id) === String(msg.id);
          const sameThread = String(m.thread_id) === String(msg.thread_id);
          const sameSender = String(m.sender_id) === String(msg.sender_id);
          const sameText = (m.message || "") === (msg.message || "");
          const t1 = m.created_at ? new Date(m.created_at).getTime() : 0;
          const t2 = msg.created_at ? new Date(msg.created_at).getTime() : 0;
          const closeTime = Math.abs(t1 - t2) < 3000;
          const sameAttachment =
            (m.attachment_url || "") === (msg.attachment_url || "");
          return (
            sameThread && sameSender && sameText && closeTime && sameAttachment
          );
        });
        return exists ? prev : [...prev, msg];
      });
    };

    socket.on("newMessage", (msg) => {
      if (String(msg.thread_id) === String(selectedThreadIdRef.current)) {
        addIfNotExists(msg);
      }
      fetchQueries();
    });

    socket.on("messageAck", (msg) => {
      if (String(msg.thread_id) === String(selectedThreadIdRef.current)) {
        addIfNotExists(msg);
      }
    });

    socket.on("error", (err) => console.error("[socket] server error:", err));

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("newMessage");
      socket.off("messageAck");
      socket.off("error");
      try {
        socket.disconnect();
      } catch (e) {
        console.warn("[socket] disconnect error", e);
      }
    };
  }, [BACKEND_URL, API_KEY, employeeId, orgId]);

  const fetchQueries = async (opts = { silent: false }) => {
    if (!opts.silent) {
      setLoadingQueries(true);
      setError("");
    }
    try {
      const headers = {
        "x-api-key": API_KEY,
        ...(employeeId ? { "x-employee-id": employeeId } : {}),
        ...(orgId ? { "x-org-id": orgId } : {}),
      };
      const response = await axios.get(`${BACKEND_URL}/threads`, { headers });
      const list = response.data?.data ?? response.data ?? [];
      setQueries(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("fetchQueries error:", err);
      if (!opts.silent) setError("Error fetching queries");
    } finally {
      if (!opts.silent) setLoadingQueries(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async (threadId) => {
    try {
      const headers = {
        "x-api-key": API_KEY,
        ...(employeeId ? { "x-employee-id": employeeId } : {}),
        ...(orgId ? { "x-org-id": orgId } : {}),
      };
      const response = await axios.get(
        `${BACKEND_URL}/threads/${threadId}/messages`,
        { headers }
      );
      return response.data?.data ?? [];
    } catch (err) {
      console.error("Error fetching messages:", err);
      showAlert("Failed to fetch thread messages. Please try again.");
      return [];
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !attachmentFile && !attachmentBase64) {
      showAlert("Message or attachment is required.");
      return;
    }
    if (!selectedQuery) {
      showAlert("Select a thread first.");
      return;
    }

    if (attachmentFile) {
      const form = new FormData();
      form.append("attachment", attachmentFile);
      form.append("sender_id", employeeId);
      form.append("sender_role", userRole);
      form.append("recipient_id", selectedQuery.sender_id);
      form.append("message", newMessage);

      try {
        const headers = {
          "x-api-key": API_KEY,
          ...(employeeId ? { "x-employee-id": employeeId } : {}),
          ...(orgId ? { "x-org-id": orgId } : {}),
          "Content-Type": "multipart/form-data",
        };
        await axios.post(
          `${BACKEND_URL}/threads/${selectedQuery.id}/messages`,
          form,
          { headers }
        );

        setNewMessage("");
        clearAttachmentInput();
        fetchQueries();
      } catch (err) {
        console.error("attachment send error:", err);
        showAlert("Failed to send attachment");
      }
      return;
    }

    const payload = {
      thread_id: selectedQuery.id,
      sender_id: employeeId,
      sender_role: userRole,
      recipient_id: selectedQuery.sender_id,
      sender_name: name,
      message: newMessage,
    };

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("sendQueryMessage", payload, async (resp) => {
        if (resp && resp.success) {
          setNewMessage("");
          fetchQueries({ silent: true });
        } else {
          try {
            const headers = {
              "x-api-key": API_KEY,
              ...(employeeId ? { "x-employee-id": employeeId } : {}),
              ...(orgId ? { "x-org-id": orgId } : {}),
            };
            const res = await axios.post(
              `${BACKEND_URL}/threads/${selectedQuery.id}/messages`,
              payload,
              { headers }
            );
            const newMsg =
              res.data?.data?.message ?? res.data?.data ?? res.data;
            setMessages((prev) => [...prev, newMsg]);
            setNewMessage("");
          } catch (err) {
            console.error("REST fallback error:", err);
            showAlert("Failed to send message. Please try again.");
          }
        }
      });
    } else {
      try {
        const headers = {
          "x-api-key": API_KEY,
          ...(employeeId ? { "x-employee-id": employeeId } : {}),
          ...(orgId ? { "x-org-id": orgId } : {}),
        };
        const res = await axios.post(
          `${BACKEND_URL}/threads/${selectedQuery.id}/messages`,
          payload,
          { headers }
        );
        const newMsg = res.data?.data?.message ?? res.data?.data ?? res.data;
        setNewMessage("");
      } catch (err) {
        console.error("REST send failed:", err);
        showAlert("Failed to send message. Please try again.");
      }
    }
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAttachmentFile(file);
    setAttachmentName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => setAttachmentBase64(e.target.result);
    reader.readAsDataURL(file);
  };

  const clearAttachmentInput = () => {
    setAttachmentFile(null);
    setAttachmentName("");
    setAttachmentBase64(null);
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
  };

  const markMessagesAsRead = async (threadId) => {
    try {
      const headers = {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
        ...(employeeId ? { "x-employee-id": employeeId } : {}),
        ...(orgId ? { "x-org-id": orgId } : {}),
      };
      await axios.put(
        `${BACKEND_URL}/threads/${threadId}/messages/read`,
        { sender_id: employeeId },
        { headers }
      );
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const handleSelectQuery = async (query) => {
    setSelectedQuery(query);
    setMessages([]);
    setLoadingMessages(true);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("joinThread", query.id);
    } else {
      console.warn("[client] socket not connected: cannot emit joinThread");
    }

    try {
      const fetched = await fetchMessages(query.id);
      setMessages(fetched || []);
      await markMessagesAsRead(query.id);

      fetchQueries({ silent: true });
    } catch (err) {
      console.error("Error selecting query:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const toggleResolved = () => setShowResolved((prev) => !prev);

  const downloadAttachment = async (url) => {
    if (!url) return showAlert("No attachment URL");
    try {
      const filename = url.split("/").pop();
      const headers = {
        "x-api-key": API_KEY,
        ...(employeeId ? { "x-employee-id": employeeId } : {}),
        ...(orgId ? { "x-org-id": orgId } : {}),
      };
      const response = await axios.get(
        `${BACKEND_URL}/attachments/${filename}`,
        {
          headers,
          responseType: "blob",
        }
      );
      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute("download", filename || "file");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading file:", err);
      showAlert("Failed to download file.");
    }
  };

  if (error) return <p>{error}</p>;

  return (
    <div className="admin-query-container">
      <div className="admin-query-header">
        <h2>Employee Queries</h2>
      </div>

      <div className="admin-query-content">
        <div className="ad-sidebar">
          <div className="toggle-switch">
            <div
              className={`toggle-option ${!showResolved ? "active" : ""}`}
              onClick={() => setShowResolved(false)}
            >
              Queries
            </div>
            <div
              className={`toggle-option ${showResolved ? "active" : ""}`}
              onClick={() => setShowResolved(true)}
            >
              Resolved
            </div>
          </div>

          <div className="query-list">
            {loadingQueries ? (
              <p>Loading queries…</p>
            ) : queries.length === 0 ? (
              <p>No queries found</p>
            ) : (
              queries
                .filter((query) =>
                  showResolved
                    ? query.status === "closed"
                    : query.status !== "closed"
                )
                .map((query) => (
                  <div
                    key={query.id}
                    className={`query-item ${
                      selectedQuery?.id === query.id ? "active" : ""
                    }`}
                    onClick={() => handleSelectQuery(query)}
                  >
                    <UserAvatar
                      photoUrl={query.photo_url}
                      role={query.role}
                      gender={query.gender}
                      apiKey={API_KEY}
                      className="profile-pic"
                    />
                    <div className="query-info">
                      <div className="query-header">
                        <p className="name">{query.sender_name}</p>
                        {query.unread_message_count > 0 && (
                          <p className="unread-dot">
                            {query.unread_message_count > 9
                              ? "9+"
                              : query.unread_message_count}
                          </p>
                        )}
                        <p className="time">
                          {query.updated_at
                            ? new Date(query.updated_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <p
                        className={`message-preview ${
                          query.unread_message_count > 0 ? "unread-message" : ""
                        }`}
                      >
                        {query.status === "closed" && query.feedback
                          ? query.feedback
                          : query.latest_message || "No messages yet"}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="chat-container">
          {selectedQuery ? (
            loadingMessages ? (
              <p>Loading messages…</p>
            ) : (
              <>
                <div className="chat-header">
                  <p>
                    {selectedQuery.created_at
                      ? new Date(selectedQuery.created_at).toLocaleString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )
                      : "—"}
                  </p>
                  <p>
                    From: <strong>{selectedQuery.sender_name}</strong>
                  </p>
                  <h2>{selectedQuery.subject || "Subject"}</h2>
                </div>

                <div className="chat-messages" ref={chatContainerRef}>
                  {selectedQuery.status === "closed" &&
                    selectedQuery.feedback && (
                      <div className="message-container feedback-message">
                        <div className="message feedback">
                          <p>
                            <strong>Feedback:</strong> {selectedQuery.feedback}
                          </p>
                          {selectedQuery.note && (
                            <p>
                              <strong>Note:</strong> {selectedQuery.note}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                  {[...messages].reverse().map((message) => (
                    <div
                      key={
                        message.id ||
                        `${message.thread_id}-${message.created_at}`
                      }
                      className={`message-container ${
                        String(message.sender_id) === String(employeeId)
                          ? "right"
                          : "left"
                      }`}
                    >
                      <div className="message-header">
                        <p className="message-sender">{message.sender_name}</p>
                      </div>
                      <div className="message">
                        <p className="message-text">{message.message}</p>
                        {message.attachment_url && (
                          <button
                            className="emp-attachment"
                            onClick={() =>
                              downloadAttachment(message.attachment_url)
                            }
                          >
                            📎 {message.attachment_url.split("/").pop()}
                          </button>
                        )}
                        <span className="message-time">
                          {message.created_at
                            ? new Date(message.created_at).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="chat-input">
                  <div className="input-container">
                    <div className="input-wrapper">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={selectedQuery.status === "closed"}
                        className="message-input"
                      />
                      {attachmentName && (
                        <span className="attachment-suffix">
                          {attachmentName}
                        </span>
                      )}
                      <label htmlFor="fileInput" className="attachment-icon">
                        <FiPaperclip />
                      </label>
                    </div>

                    <input
                      type="file"
                      onChange={handleAttachmentChange}
                      disabled={selectedQuery.status === "closed"}
                      style={{ display: "none" }}
                      id="fileInput"
                    />
                  </div>

                  <button
                    className="submit-btn"
                    onClick={sendMessage}
                    disabled={selectedQuery.status === "closed"}
                  >
                    Submit
                  </button>
                </div>
              </>
            )
          ) : (
            <p className="select-query">Select a query to view details</p>
          )}
        </div>
      </div>

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p style={{ whiteSpace: "pre-wrap" }}>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default AdminQuery;
