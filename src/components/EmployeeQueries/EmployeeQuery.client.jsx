"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { BiEdit } from "react-icons/bi";
import { MdOutlineCancel } from "react-icons/md";
import { FiPaperclip, FiSend } from "react-icons/fi";
import { TbMessageOff } from "react-icons/tb";
import UserAvatar from "./UserAvatar.client";
import Modal from "../Modal/Modal.client";
import "./EmployeeQuery.css";
import { useAuth } from "../../context/AuthProvider.client";

const EmployeeQuery = () => {
  const { user } = useAuth();

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const employeeId = user?.employeeId ?? user?.id ?? null;
  const departmentId = user?.department_id ?? user?.departmentId ?? null;
  const name = user?.name ?? user?.fullName ?? "";
  const userRole = user?.role ?? user?.userRole ?? "";
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);
  const [recipientRole, setRecipientRole] = useState("");
  const [subject, setSubject] = useState("");
  const [queryText, setQueryText] = useState("");
  const [threadId, setThreadId] = useState(null);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [threadToClose, setThreadToClose] = useState(null);

  const selectedThreadIdRef = useRef(null);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const buildHeaders = (extra = {}) => ({
    "x-api-key": API_KEY,
    ...(employeeId ? { "x-employee-id": employeeId } : {}),
    ...(orgId ? { "x-org-id": orgId } : {}),
    ...extra,
  });

  const feedbackOptions = [
    { value: "very unsatisfied", stars: 1 },
    { value: "unsatisfied", stars: 2 },
    { value: "satisfied", stars: 3 },
    { value: "very satisfied", stars: 4 },
  ];

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  useEffect(() => {
    selectedThreadIdRef.current = selectedQuery?.id ?? null;
  }, [selectedQuery]);

  useEffect(() => {
    if (!employeeId) return;
    if (!BACKEND_URL) return;

    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      path: "/api/socket.io",
      auth: {
        apiKey: process.env.NEXT_PUBLIC_API_KEY,
        userId: employeeId,
      },
      query: { userId: employeeId },
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

    socket.on("newMessage", (msg) => {
      setMessages((prev) => {
        const sameMessage = prev.some(
          (m) =>
            String(m.id) === String(msg.id) ||
            (m.thread_id === msg.thread_id &&
              m.sender_id === msg.sender_id &&
              m.message === msg.message &&
              m.attachment_url === msg.attachment_url)
        );
        return sameMessage ? prev : [...prev, msg];
      });
      fetchEmpQueries();
    });

    socket.on("messageAck", (msg) => {
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (m) => String(m.id) === String(msg.id) || m.message === msg.message
        );
        return alreadyExists ? prev : [...prev, msg];
      });
    });

    socket.on("error", (err) => console.error("[socket] error:", err));

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("newMessage");
      socket.off("messageAck");
      socket.off("error");
      try {
        socket.disconnect();
      } catch (e) {}
    };
  }, [BACKEND_URL, API_KEY, employeeId, orgId]);

  const fetchEmpQueries = async () => {
    if (!employeeId) return setLoading(false);
    setLoading(true);
    try {
      const headers = buildHeaders();
      const url = `${BACKEND_URL}/threads/employee/${encodeURIComponent(
        employeeId
      )}`;
      const response = await axios.get(url, { headers });
      const payload = response.data;
      const data = payload?.data ?? payload?.threads ?? payload?.result ?? [];
      setQueries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching employee queries:", error);
      showAlert("Failed to load your queries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) fetchEmpQueries();
  }, [employeeId, orgId]);

  useEffect(() => {
    if (!selectedQuery) return;
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("joinThread", selectedQuery.id);
    }
    (async () => {
      try {
        const headers = buildHeaders();
        const res = await axios.get(
          `${BACKEND_URL}/threads/${selectedQuery.id}/messages`,
          { headers }
        );
        const msgs = res.data?.data ?? res.data ?? [];
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch (err) {
        console.error("Error fetching messages:", err);
        showAlert("Failed to load messages for the selected thread.");
      }
    })();
    (async () => {
      try {
        const headers = buildHeaders({ "Content-Type": "application/json" });
        await axios.put(
          `${BACKEND_URL}/threads/${selectedQuery.id}/messages/read`,
          { sender_id: employeeId },
          { headers }
        );
        setQueries((prev) =>
          prev.map((q) =>
            q.id === selectedQuery.id ? { ...q, unread_message_count: 0 } : q
          )
        );
      } catch (err) {}
    })();
  }, [selectedQuery]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setAttachmentFile(file);
      setAttachmentName(file.name);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedQuery) {
      showAlert("Please select a thread first.");
      return;
    }

    if (attachmentFile) {
      const formData = new FormData();
      formData.append("attachment", attachmentFile);
      formData.append("sender_id", employeeId);
      formData.append("sender_role", userRole);
      formData.append("recipient_id", selectedQuery.recipient_id);
      formData.append("message", inputMessage);

      try {
        const headers = buildHeaders({ "Content-Type": "multipart/form-data" });
        const res = await axios.post(
          `${BACKEND_URL}/threads/${selectedQuery.id}/messages`,
          formData,
          { headers }
        );
        const newMsg = res.data?.data?.message ?? res.data?.data ?? res.data;
        setInputMessage("");
        setAttachmentFile(null);
        setAttachmentName("");
        fetchEmpQueries();
      } catch (err) {
        console.error("attachment send error:", err);
        showAlert("Failed to send attachment. Please try again.");
      }
      return;
    }

    if (!inputMessage?.trim()) {
      showAlert("Please enter a message.");
      return;
    }

    const payload = {
      thread_id: selectedQuery.id,
      sender_id: employeeId,
      sender_role: userRole,
      recipient_id: selectedQuery.recipient_id,
      sender_name: name,
      message: inputMessage,
    };

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("sendQueryMessage", payload, async (resp) => {
        if (resp && resp.success) setInputMessage("");
        else {
          try {
            const headers = buildHeaders();
            const res = await axios.post(
              `${BACKEND_URL}/threads/${selectedQuery.id}/messages`,
              payload,
              { headers }
            );
            const newMsg =
              res.data?.data?.message ?? res.data?.data ?? res.data;
            setInputMessage("");
          } catch (err) {
            console.error("REST fallback failed after socket failure:", err);
            showAlert("Failed to send message. Please try again.");
          }
        }
      });
    } else {
      try {
        const headers = buildHeaders();
        const res = await axios.post(
          `${BACKEND_URL}/threads/${selectedQuery.id}/messages`,
          payload,
          { headers }
        );
        const newMsg = res.data?.data?.message ?? res.data?.data ?? res.data;
        setInputMessage("");
      } catch (err) {
        console.error("REST send failed:", err);
        showAlert("Failed to send message. Please try again.");
      }
    }
  };

  const startThread = async () => {
    if (!recipientRole || !subject || !queryText) {
      showAlert("Please fill out all fields.");
      return;
    }
    try {
      const headers = buildHeaders({ "Content-Type": "application/json" });
      const payload = {
        sender_id: employeeId,
        sender_role: userRole,
        role: recipientRole,
        department_id: departmentId,
        subject: subject,
        message: queryText,
      };
      const res = await axios.post(`${BACKEND_URL}/threads`, payload, {
        headers,
      });
      const tid =
        res.data?.data?.threadId ?? res.data?.threadId ?? res.data?.id ?? null;
      if (tid) setThreadId(tid);
      showAlert("Thread started successfully!");
      setShowModal(false);
      setRecipientRole("");
      setSubject("");
      setQueryText("");
      await fetchEmpQueries();
      if (isMobile && tid) {
        const found = (
          await axios
            .get(`${BACKEND_URL}/threads/${tid}`, { headers: buildHeaders() })
            .catch(() => null)
        )?.data;
        if (found) {
          setSelectedQuery(found.data ?? found);
        }
      }
    } catch (err) {
      console.error("Error starting thread:", err);
      showAlert("Failed to start thread. Please try again.");
    }
  };

  const openFeedbackModal = (tid) => {
    setThreadToClose(tid);
    setShowFeedbackModal(true);
  };

  const closeThread = async () => {
    if (!feedback) {
      showAlert("Please select your feedback.");
      return;
    }
    try {
      const headers = buildHeaders({ "Content-Type": "application/json" });
      await axios.put(
        `${BACKEND_URL}/threads/${threadToClose}/close`,
        { feedback, note: queryText },
        { headers }
      );
      showAlert("Thread closed successfully.");
      setShowFeedbackModal(false);
      setThreadToClose(null);
      setFeedback("");
      setShowThankYouModal(true);
      setQueries((prev) =>
        prev.map((q) =>
          q.id === threadToClose ? { ...q, status: "closed" } : q
        )
      );
    } catch (err) {
      console.error("Error closing thread:", err);
      showAlert("Failed to close thread. Please try again.");
    }
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setThreadToClose(null);
    setFeedback("");
  };

  const downloadAttachment = async (url) => {
    if (!url) return showAlert("No attachment URL provided");
    try {
      const filename = url.split("/").pop();
      const headers = buildHeaders();
      const response = await axios.get(
        `${BACKEND_URL}/attachments/${encodeURIComponent(filename)}`,
        { headers, responseType: "blob" }
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

  const handleSelectQuery = async (q) => {
    setSelectedQuery(q);
    try {
      const headers = buildHeaders();
      const res = await axios.get(`${BACKEND_URL}/threads/${q.id}/messages`, {
        headers,
      });
      const msgs = res.data?.data ?? res.data ?? [];
      setMessages(Array.isArray(msgs) ? msgs : []);
      await axios.put(
        `${BACKEND_URL}/threads/${q.id}/messages/read`,
        { sender_id: employeeId },
        { headers: buildHeaders({ "Content-Type": "application/json" }) }
      );
      setQueries((prev) =>
        prev.map((item) =>
          item.id === q.id ? { ...item, unread_message_count: 0 } : item
        )
      );
    } catch (err) {
      console.error("handleSelectQuery error:", err);
    }
  };

  const mobileBackToList = () => {
    setSelectedQuery(null);
    setMessages([]);
  };

  return (
    <div className="emp-query-container">
      <div className="emp-query-header">
        <h2>Employee Queries</h2>
        <button className="compose-button" onClick={() => setShowModal(true)}>
          <BiEdit className="compose-icon" /> Compose
        </button>
      </div>

      <div className="emp-query-content">
        {(!isMobile || !selectedQuery) && (
          <div className="emp-sidebar">
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

            <div className="emp-query-list">
              {loading ? (
                <p>Loading...</p>
              ) : queries.length === 0 ? (
                <p>No queries found</p>
              ) : (
                queries
                  .filter((qq) =>
                    showResolved
                      ? qq.status === "closed"
                      : qq.status !== "closed"
                  )
                  .map((qq) => (
                    <div
                      key={qq.id}
                      className={`emp-query-item ${
                        selectedQuery?.id === qq.id ? "active" : ""
                      }`}
                      onClick={() => handleSelectQuery(qq)}
                    >
                      <UserAvatar
                        photoUrl={qq.photo_url}
                        role={qq.role}
                        gender={qq.gender}
                        apiKey={API_KEY}
                        className="profile-pic"
                      />
                      <div className="emp-query-info">
                        <div className="emp-query-header">
                          <p className="emp-name">{qq.recipient_name}</p>
                          {qq.unread_message_count > 0 && (
                            <p className="emp-unread-dot">
                              {qq.unread_message_count > 9
                                ? "9+"
                                : qq.unread_message_count}
                            </p>
                          )}
                          <p className="time">
                            {qq.updated_at
                              ? new Date(qq.updated_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                        <p
                          className={`emp-message-preview ${
                            qq.unread_message_count > 0 ? "unread-message" : ""
                          }`}
                        >
                          {qq.latest_message || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {(!isMobile || selectedQuery) && (
          <div
            className={`emp-chat-container ${isMobile ? "mobile-chat" : ""}`}
            role="region"
            aria-live="polite"
          >
            {showFeedbackModal && (
              <div className="employee-query-modal-overlay">
                <div className="employee-query-modal">
                  <div className="emp-form-header">
                    <h3>End Query</h3>
                    <MdOutlineCancel
                      className="emp-close-button"
                      onClick={closeFeedbackModal}
                    />
                  </div>
                  <div className="feedback-options">
                    <p className="feedback-para">
                      Great!! <br />
                      I hope your query has been resolved. If not, click
                      “Cancel” to continue. Please provide your valuable Rating
                      and Feedback before you end your conversation. <br />
                      <span className="stars-info">
                        1 star is low and 4 stars are the highest rating.
                      </span>
                    </p>
                    <div className="stars-container">
                      {feedbackOptions.map((option, index) => (
                        <span
                          key={option.value}
                          className={`star ${
                            index <=
                            feedbackOptions.findIndex(
                              (o) => o.value === feedback
                            )
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => setFeedback(option.value)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div>
                      <label className="employee-query-label">Feedback</label>
                      <textarea
                        id="query-feedback"
                        placeholder="Your feedback matters"
                        className="employee-query-textarea"
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="emp-form-actions">
                    <button
                      className="empform-cancel-button"
                      onClick={closeFeedbackModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="employee-query-button"
                      onClick={closeThread}
                    >
                      End Query
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showThankYouModal && (
              <div className="employee-query-modal-overlay">
                <div className="employee-query-modal">
                  <div className="emp-form-header">
                    <h3>End Query</h3>
                    <MdOutlineCancel
                      className="emp-close-button"
                      onClick={() => setShowThankYouModal(false)}
                    />
                  </div>
                  <div className="feedback-options">
                    <p className="thank-you">
                      Thanks for your valuable feedback
                    </p>
                  </div>
                  <div className="thank-button">
                    <button
                      className="thank-close"
                      onClick={() => setShowThankYouModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedQuery ? (
              <>
                {isMobile && (
                  <div className="mobile-chat-topbar">
                    <button
                      className="mobile-back-btn"
                      onClick={mobileBackToList}
                      aria-label="Back to list"
                    >
                      ←
                    </button>

                    <div className="mobile-chat-title">
                      <UserAvatar
                        photoUrl={selectedQuery.photo_url}
                        role={selectedQuery.role}
                        gender={selectedQuery.gender}
                        apiKey={API_KEY}
                        className="profile-pic"
                      />
                      <div>
                        <div className="mobile-chat-name">
                          {selectedQuery.recipient_name}
                        </div>
                        <div className="mobile-chat-sub">
                          {selectedQuery.subject || ""}
                        </div>
                      </div>
                    </div>

                    <button
                      className="mobile-end-btn"
                      onClick={() => openFeedbackModal(selectedQuery.id)}
                      aria-label="End Query"
                      title="End Query"
                      disabled={selectedQuery.status === "closed"}
                    >
                      <TbMessageOff className="close-thread-icon" />
                    </button>
                  </div>
                )}

                <div className="emp-chat-header">
                  <div className="end">
                    <button
                      className="close-thread-button"
                      onClick={() => openFeedbackModal(selectedQuery.id)}
                      disabled={selectedQuery.status === "closed"}
                    >
                      <TbMessageOff className="close-thread-icon" /> End Query
                    </button>
                  </div>
                  <div>
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
                      From: <strong>{selectedQuery.recipient_name}</strong>
                    </p>
                    <h2>{selectedQuery.subject || "Subject"}</h2>
                  </div>
                </div>

                <div className="emp-chat-messages" ref={chatContainerRef}>
                  {[...messages].reverse().map((message) => (
                    <div
                      key={
                        message.id ??
                        `${message.thread_id}-${message.created_at}`
                      }
                      className={`emp-message-container ${
                        String(message.sender_id) === String(employeeId)
                          ? "right"
                          : "left"
                      }`}
                    >
                      <div className="emp-message-header">
                        <p className="emp-message-sender">
                          {message.sender_name}
                        </p>
                      </div>
                      <div className="emp-message">
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

                <div className="emp-chat-input">
                  <div className="input-container">
                    <div className="input-wrapper">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
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
                      id="fileInput"
                      style={{ display: "none" }}
                      onChange={handleAttachmentChange}
                      disabled={selectedQuery?.status === "closed"}
                    />
                  </div>
                  <button
                    className="emp-submit-btn"
                    onClick={handleSendMessage}
                    disabled={selectedQuery.status === "closed"}
                    aria-label={isMobile ? "Send message" : "Send"}
                  >
                    {isMobile ? (
                      <FiSend className="send-icon" aria-hidden="true" />
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="emp-select-query">
                {isMobile
                  ? "Tap a person to start chatting"
                  : "Select a query to view messages"}
              </div>
            )}
          </div>
        )}
      </div>
      {showModal && (
        <div className="employee-query-modal-overlay">
          <div className="employee-query-modal">
            <div className="emp-form-header">
              <h3>New Query</h3>
              <MdOutlineCancel
                className="emp-close-button"
                onClick={() => setShowModal(false)}
              />
            </div>
            <div className="employee-query-form">
              <div className="employee-query-field">
                <label htmlFor="recipientRole" className="employee-query-label">
                  To
                </label>
                <select
                  id="recipientRole"
                  className="employee-query-select"
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                >
                  <option value="">Select Recipient</option>
                  <option value="Admin">Admin</option>
                  {userRole !== "Manager" && (
                    <option value="Manager">Manager</option>
                  )}
                  <option value="HR">HR</option>
                </select>
              </div>

              <div className="employee-query-field">
                <label htmlFor="subject" className="employee-query-label">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  placeholder="Enter subject"
                  className="employee-query-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="employee-query-field">
                <label className="employee-query-label">My Query</label>
                <textarea
                  id="query"
                  placeholder="Text field"
                  className="employee-query-textarea"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                />
              </div>

              <div className="emp-form-actions">
                <button
                  className="empform-cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button className="employee-query-button" onClick={startThread}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default EmployeeQuery;
