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
  const orgId =
    user?.orgId ??
    user?.raw?.org_id ??
    user?.organization_id ??
    user?.org_id ??
    null;

  useEffect(() => {
    if (!orgId) {
      console.warn("admin: orgId not found on user object", { user, orgId });
    } else {
      console.log("admin: orgId loaded", orgId);
    }
  }, [orgId, user]);

  useEffect(() => {
    console.log("[AdminQuery] user snapshot:", {
      user,
      userRole,
      orgId,
      employeeId,
    });
  }, [user, userRole, orgId, employeeId]);

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
  const [showResolveModal, setShowResolveModal] = useState(false);
  const messageIdsRef = useRef(new Set());

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

  const makeMsgKey = (m) => {
    if (!m) return null;
    if (m.id !== undefined && m.id !== null) return `id:${String(m.id)}`;
    const thread = m.thread_id ?? m.threadId ?? "";
    const sender = m.sender_id ?? m.senderId ?? "";
    const time = m.created_at ? new Date(m.created_at).getTime() : "";
    const att = m.attachment_url ?? m.attachmentUrl ?? "";
    const text = (m.message || "").slice(0, 200);
    return `f:${thread}::${sender}::${time}::${att}::${text}`;
  };

  const addIfNotExists = (msg) => {
    if (!msg) return;
    const key = makeMsgKey(msg);
    if (!key) return;
    if (messageIdsRef.current.has(key)) return;
    messageIdsRef.current.add(key);
    setMessages((prev) => [...prev, msg]);
  };

  useEffect(() => {
    if (!employeeId) {
      console.warn("[socket] not connecting: employeeId missing");
      setLoadingQueries(false);
      return;
    }
    if (!BACKEND_URL) {
      console.warn("[socket] BACKEND_URL not configured");
      setLoadingQueries(false);
      return;
    }
    if (!orgId) {
      console.warn("[socket] not connecting: orgId not available");
      setLoadingQueries(false);
      return;
    }

    const SOCKET_URL = BACKEND_URL.replace("/api", "");

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      path: "/api/socket.io",

      query: {
        userId: employeeId,
      },

      auth: {
        apiKey: API_KEY,
        userId: employeeId,
        ...(orgId ? { orgId } : {}),
      },
    });

    socketRef.current = socket;

    const handleNewMessage = (msg) => {
      if (String(msg.thread_id) === String(selectedThreadIdRef.current)) {
        addIfNotExists(msg);
      }
      fetchQueries?.({ silent: true });
    };

    const handleMessageAck = (msg) => {
      if (String(msg.thread_id) === String(selectedThreadIdRef.current)) {
        addIfNotExists(msg);
      }
    };

    const onConnect = () => {
      console.log("[socket] connected", socketRef.current?.id);
      fetchQueries?.();
    };

    const onDisconnect = (reason) => {
      console.log("[socket] disconnected:", reason);
    };

    const onConnectError = (err) => {
      console.error("[socket] connect_error:", err);
      showAlert("Realtime connection failed. Some updates may be delayed.");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageAck", handleMessageAck);
    socket.on("error", (err) => console.error("[socket] server error:", err));

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageAck", handleMessageAck);
      socket.off("error");
      try {
        socket.disconnect();
      } catch (e) {}
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
      const response = await axios.get(`${BACKEND_URL}/threads`, {
        withCredentials: true,
        headers,
      });
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
        { withCredentials: true, headers },
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

    if (!orgId) {
      console.warn("Attempt to send message without orgId", { user, orgId });
      showAlert(
        "Organization information is missing. Refresh the page or re-login.",
        "Configuration Error",
      );
      return;
    }

    const socketConnected = socketRef.current && socketRef.current.connected;

    /* if (attachmentFile) {
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
        };

        await axios.post(
          `${BACKEND_URL}/threads/${selectedQuery.id}/messages`,
          form,
          { withCredentials: true, headers },
        );

        if (!socketConnected) {
          const fetched = await fetchMessages(selectedQuery.id);
          messageIdsRef.current.clear();
          const unique = [];
          for (const m of fetched || []) {
            const k = makeMsgKey(m);
            if (!messageIdsRef.current.has(k)) {
              messageIdsRef.current.add(k);
              unique.push(m);
            }
          }
          setMessages(unique);
        }

        setNewMessage("");
        clearAttachmentInput();
        fetchQueries();
      } catch (err) {
        console.error("attachment send error:", err);
        showAlert("Failed to send attachment");
      }
      return;
    }*/
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
        };

        const res = await axios.post(
          `${BACKEND_URL}/threads/${selectedQuery.id}/messages`,
          form,
          {
            withCredentials: true,
            headers,
          },
        );

        const savedMessage =
          res.data?.data?.message || res.data?.data || res.data;

        // instantly show in sender UI
        if (savedMessage) {
          addIfNotExists(savedMessage);
        }

        // realtime update to others
        if (socketRef.current?.connected && savedMessage) {
          socketRef.current.emit(
            "sendQueryMessage",
            {
              thread_id: selectedQuery.id,
              sender_id: employeeId,
              sender_role: userRole,
              recipient_id: selectedQuery.sender_id,
              sender_name: name,
              message: savedMessage.message || "",
              attachment_url: savedMessage.attachment_url || null,
              created_at: savedMessage.created_at,
              id: savedMessage.id,
            },
            (resp) => {
              console.log("attachment socket emit response:", resp);
            },
          );
        }

        setNewMessage("");
        clearAttachmentInput();

        fetchQueries({ silent: true });
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

    if (socketConnected) {
      socketRef.current.emit("sendQueryMessage", payload, (resp) => {
        if (resp && resp.success) {
          setNewMessage("");
          fetchQueries({ silent: true });
        } else {
          console.warn("socket sendQueryMessage reported failure:", resp);
          showAlert("Message send failed over socket.");
        }
      });
    } else {
      try {
        const headers = {
          "x-api-key": API_KEY,
          ...(employeeId ? { "x-employee-id": employeeId } : {}),
          ...(orgId ? { "x-org-id": orgId } : {}),
        };
        await axios.post(
          `${BACKEND_URL}/threads/${selectedQuery.id}/messages`,
          payload,
          { withCredentials: true, headers },
        );
        const fetched = await fetchMessages(selectedQuery.id);
        messageIdsRef.current.clear();
        const unique = [];
        for (const m of fetched || []) {
          const k = makeMsgKey(m);
          if (!messageIdsRef.current.has(k)) {
            messageIdsRef.current.add(k);
            unique.push(m);
          }
        }
        setMessages(unique);
        setNewMessage("");
      } catch (err) {
        console.error("REST send failed:", err);
        showAlert("Failed to send message. Please try again.");
      }
    }
  };

  const requestCloseThread = async () => {
    if (!selectedQuery) return;

    try {
      const headers = {
        "x-api-key": API_KEY,
        ...(employeeId ? { "x-employee-id": employeeId } : {}),
        ...(orgId ? { "x-org-id": orgId } : {}),
        ...(userRole ? { "x-role": userRole } : {}),
        "Content-Type": "application/json",
      };

      await axios.put(
        `${BACKEND_URL}/threads/${selectedQuery.id}/request-close`,
        {},
        { withCredentials: true, headers },
      );

      setSelectedQuery((prev) =>
        prev ? { ...prev, status: "pending_close" } : prev,
      );
      fetchQueries({ silent: true });
      showAlert("Query marked as resolved. Waiting for sender approval.");
    } catch (err) {
      console.error("requestCloseThread error:", err);
      showAlert("Failed to request close.");
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
        { withCredentials: true, headers },
      );
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const handleSelectQuery = async (query) => {
    setSelectedQuery(query);
    messageIdsRef.current.clear();
    setMessages([]);
    setLoadingMessages(true);

    if (socketRef.current && socketRef.current.connected) {
      if (
        selectedThreadIdRef.current &&
        selectedThreadIdRef.current !== query.id
      ) {
        socketRef.current.emit("leaveThread", selectedThreadIdRef.current);
      }
      socketRef.current.emit("joinThread", query.id);
      selectedThreadIdRef.current = query.id;
    } else {
      console.warn("[client] socket not connected: cannot emit joinThread");
    }

    try {
      const fetched = await fetchMessages(query.id);
      const unique = [];
      for (const m of fetched || []) {
        const k = makeMsgKey(m);
        if (!messageIdsRef.current.has(k)) {
          messageIdsRef.current.add(k);
          unique.push(m);
        }
      }
      setMessages(unique);
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
      if (!orgId) {
        console.warn("[downloadAttachment] orgId missing, cannot download", {
          orgId,
          url,
        });
        return showAlert(
          "Organization information missing. Refresh the page or re-login.",
          "Configuration Error",
        );
      }
      const headers = {
        "x-api-key": API_KEY,
        ...(employeeId ? { "x-employee-id": employeeId } : {}),
        ...(orgId ? { "x-org-id": orgId } : {}),
      };
      const response = await axios.get(
        `${BACKEND_URL}/empquery/attachments/${encodeURIComponent(filename)}`,
        { withCredentials: true, headers, responseType: "blob" },
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
          <div className="eq-toggle-switch">
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
                    : query.status !== "closed",
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
                                },
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
                  <div className="end">
                    {selectedQuery.status !== "closed" && (
                      <button
                        className="close-thread-button"
                        onClick={requestCloseThread}
                        disabled={selectedQuery.status === "pending_close"}
                      >
                        {selectedQuery.status === "pending_close"
                          ? "Waiting for approval"
                          : "Is the query resolved?"}
                      </button>
                    )}
                  </div>
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
                          },
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

                  {[...messages].reverse().map((message, idx) => (
                    <div
                      key={
                        message.id ||
                        `${message.thread_id}-${message.created_at}-${idx}`
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
                                { hour: "2-digit", minute: "2-digit" },
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
                    className="ad-submit-btn"
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
