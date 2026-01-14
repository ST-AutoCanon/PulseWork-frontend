"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import axios from "axios";
import "./EmpTaskManagement.css";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";
import WeeklyTaskPlanner from "../WeeklyTaskPlanner/WeeklyTaskPlanner.client";

const getProgressColor = (p) => {
  if (p < 40) return "#ef4444";
  if (p < 70) return "#f59e0b";
  return "#10b981";
};

const parseDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDate = (date) => {
  if (!date) return "";
  const d =
    date instanceof Date && !isNaN(date.getTime()) ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const displayDate = (date) => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return parseDate(d);
};

const EmpTaskManagement = () => {
  const { user, hydrated } = useAuth();
  const [userContext, setUserContext] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState("Progress");
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [editingProgress, setEditingProgress] = useState(false);
  const [tempProgress, setTempProgress] = useState(0);
  const [tempStatus, setTempStatus] = useState("");
  const [activeSection, setActiveSection] = useState("Tasks");
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    message: "",
  });

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setMessageText((prev) => (prev + " " + finalTranscript).trim());
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    if (user?.employeeId) {
      const ctx = {
        employeeId: String(user.employeeId),
        role: String(user.role || "employee"),
        orgId: user.orgId || null,
      };
      setUserContext(ctx);
      setEmployeeId(ctx.employeeId);
    } else {
      setError("Employee ID not found. Please log in.");
    }
  }, [user, hydrated]);

  const getHeaders = () => ({
    "x-employee-id": userContext?.employeeId || "",
    "x-role": userContext?.role || "",
    ...(userContext?.orgId && { "x-org-id": userContext.orgId }),
    "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
  });

  useEffect(() => {
    if (!employeeId || !userContext) return;

    const fetch = async () => {
      setLoadingTasks(true);
      setError(null);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/task-emp-emp/employee/${employeeId}`,
          { withCredentials: true, headers: getHeaders() }
        );

        const raw = res.data;
        if (!Array.isArray(raw)) throw new Error("Invalid tasks data");

        const formatted = raw.map((t) => {
          const prog = Number(t.percentage ?? 0);
          const safeProg = isNaN(prog) ? 0 : Math.min(Math.max(prog, 0), 100);

          return {
            id: `Task-${t.task_id}`,
            dbId: t.task_id,
            title: t.task_title || "Untitled Task",
            description: t.description || "No description",
            status: (() => {
              const s = (t.status ?? "").trim().toLowerCase();
              const map = {
                "yet to start": "Yet to Start",
                "in progress": "In Progress",
                "on-hold": "On-Hold",
                "on hold": "On-Hold",
                completed: "Completed",
              };
              return map[s] || "Yet to Start";
            })(),
            startDate: formatDate(t.start_date),
            endDate: formatDate(t.due_date),
            employeeId,
            progress: safeProg,
            messages: [],
          };
        });

        setTasks(formatted);
      } catch (e) {
        if (e.response?.status === 404) setTasks([]);
        else
          setError(
            e.response?.data?.error || e.message || "Failed to load tasks"
          );
      } finally {
        setLoadingTasks(false);
      }
    };

    fetch();
  }, [employeeId, userContext]);

  useEffect(() => {
    if (!selectedTaskId || !employeeId || !userContext) return;
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task?.dbId) return;

    const fetch = async () => {
      setLoadingMessages(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/${task.dbId}`,
          { withCredentials: true, headers: getHeaders() }
        );

        if (res.data.success) {
          const { progressMessages = [], clarificationMessages = [] } =
            res.data;
          const all = [
            ...progressMessages.map((m) => ({
              ...m,
              senderName:
                String(m.sender) === employeeId ? "You" : "Supervisor",
              type: "Progress",
            })),
            ...clarificationMessages.map((m) => ({
              ...m,
              senderName:
                String(m.sender) === employeeId ? "You" : "Supervisor",
              type: "Clarification",
            })),
          ].sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
          );

          setTasks((prev) =>
            prev.map((t) =>
              t.id === selectedTaskId ? { ...t, messages: all } : t
            )
          );
        }
      } catch (e) {
        if (e.response?.status !== 404) {
          setError(e.response?.data?.error || e.message);
        }
        setTasks((prev) =>
          prev.map((t) =>
            t.id === selectedTaskId ? { ...t, messages: [] } : t
          )
        );
      } finally {
        setLoadingMessages(false);
      }
    };

    fetch();
  }, [selectedTaskId, employeeId, userContext]);

  const columns = useMemo(
    () => [
      { key: "Yet to Start", title: "Yet to Start", color: "#7c7d1e" },
      { key: "In Progress", title: "In Progress", color: "#1d4ed8" },
      { key: "On-Hold", title: "On-Hold", color: "#9d174d" },
      { key: "Completed", title: "Completed", color: "#065f46" },
    ],
    []
  );

  const dropdownColumns = useMemo(
    () => columns.filter((col) => col.key !== "Completed"),
    [columns]
  );

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  const currentDate = new Date();

  const openDetails = (id) => {
    setSelectedTaskId(id);
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setTempProgress(task.progress);
      setTempStatus(task.status);
    }
  };

  const closeDetails = () => {
    setSelectedTaskId(null);
    setMessageText("");
    setActiveTab("Progress");
    setEditingProgress(false);
  };

  const startEditingProgress = () => {
    if (selectedTask) {
      setTempProgress(selectedTask.progress);
      setTempStatus(selectedTask.status);
      setEditingProgress(true);
    }
  };

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setTempProgress(val);
  };

  const handleStatusChange = (e) => {
    setTempStatus(e.target.value);
  };

  const saveProgress = async () => {
    if (!selectedTask || !userContext) return;
    const dbId = selectedTask.dbId;

    try {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id
            ? { ...t, status: tempStatus, progress: tempProgress }
            : t
        )
      );

      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employee-tasks/update/${dbId}`,
        {
          status: tempStatus,
          percentage: tempProgress,
          progress_percentage: tempProgress,
        },
        { withCredentials: true, headers: getHeaders() }
      );

      showAlert("Task updated successfully");
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to update");
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id
            ? {
                ...t,
                progress: selectedTask.progress,
                status: selectedTask.status,
              }
            : t
        )
      );
    } finally {
      setEditingProgress(false);
    }
  };

  const cancelEditing = () => {
    setEditingProgress(false);
    setTempProgress(selectedTask?.progress ?? 0);
    setTempStatus(selectedTask?.status ?? "");
  };

  const handleAddMessage = async (e) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || !selectedTask || !userContext) return;

    const dbId = selectedTask.dbId;
    const newMsg = {
      text,
      time: new Date().toISOString(),
      sender: employeeId,
      senderName: "You",
      type: activeTab,
    };

    try {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id
            ? {
                ...t,
                messages: [...t.messages, newMsg].sort(
                  (a, b) =>
                    new Date(a.time).getTime() - new Date(b.time).getTime()
                ),
              }
            : t
        )
      );

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages`,
        { taskId: dbId, sender: employeeId, type: activeTab, text },
        { withCredentials: true, headers: getHeaders() }
      );

      setMessageText("");
    } catch (e) {
      setError(
        e.response?.data?.error || e.message || "Failed to send message"
      );
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id
            ? {
                ...t,
                messages: t.messages.filter((m) => m.time !== newMsg.time),
              }
            : t
        )
      );
    }
  };

  const showAlert = (msg) => setAlertModal({ isVisible: true, message: msg });
  const closeAlert = () => setAlertModal({ isVisible: false, message: "" });

  if (!hydrated)
    return <div className="emp-task-board-container">Loading user...</div>;
  if (!user) {
    return (
      <div className="emp-task-board-container">
        <div className="emp-task-error-message">
          Please <a href="/login">log in</a>.
        </div>
      </div>
    );
  }
  if (!employeeId) {
    return (
      <div className="emp-task-board-container">
        <div className="emp-task-error-message">
          {error || "Employee ID missing."} <a href="/login">Log in again</a>.
        </div>
      </div>
    );
  }

  return (
    <div className="emp-task-board-container-1">
      <div className="emp-task-sections">
        <button
          className={`emp-section-btn ${
            activeSection === "Tasks" ? "emp-active" : ""
          }`}
          onClick={() => setActiveSection("Tasks")}
        >
          Supervisor Driven
        </button>
        <button
          className={`emp-section-btn ${
            activeSection === "WeeklyTasks" ? "emp-active" : ""
          }`}
          onClick={() => setActiveSection("WeeklyTasks")}
        >
          Employee Driven
        </button>
      </div>

      {activeSection === "Tasks" && (
        <>
          {error && <div className="emp-task-error-message">{error}</div>}
          {loadingTasks && (
            <div className="emp-task-loading-message">Loading tasks...</div>
          )}
          {!loadingTasks && tasks.length === 0 && !error && (
            <div className="emp-task-no-tasks">No tasks assigned yet</div>
          )}

          <div className="emp-task-board">
            {columns.map((col) => {
              const colTasks = tasks
                .filter((t) => t.status === col.key)
                .sort(
                  (a, b) =>
                    new Date(a.endDate).getTime() -
                    new Date(b.endDate).getTime()
                );

              return (
                <div className="emp-task-column" key={col.key}>
                  <div
                    className="emp-task-column-header"
                    style={{ backgroundColor: col.color }}
                  >
                    <span>{col.title}</span>
                    <span className="emp-task-count-badge">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="emp-task-list">
                    {colTasks.length === 0 ? (
                      <div className="emp-task-no-tasks">
                        No {col.title.toLowerCase()} tasks
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const isOverdue =
                          task.status !== "Completed" &&
                          new Date(task.endDate) < currentDate;
                        const ringColor = isOverdue
                          ? "#ef4444"
                          : getProgressColor(task.progress);

                        return (
                          <div
                            className="emp-task-card"
                            key={task.id}
                            onClick={() => openDetails(task.id)}
                          >
                            <div className="emp-task-header">
                              <div className="emp-task-title-group">
                                <div className="emp-task-title">
                                  {task.title}
                                </div>
                                <div className="emp-task-id-chip">
                                  {task.id}
                                </div>
                              </div>

                              <div
                                className="emp-task-progress-wrapper"
                                title={`${task.progress}%`}
                              >
                                <svg
                                  viewBox="0 0 36 36"
                                  className="emp-task-progress-ring"
                                >
                                  <path
                                    className="emp-task-circle-bg"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    stroke="#e5e7eb"
                                    strokeWidth="3"
                                    fill="none"
                                  />
                                  <path
                                    className="emp-task-circle"
                                    strokeDasharray="100"
                                    strokeDashoffset={100 - task.progress}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    stroke={ringColor}
                                    strokeWidth="3"
                                    fill="none"
                                    strokeLinecap="round"
                                  />
                                  <text
                                    x="18"
                                    y="20.35"
                                    className="emp-task-percentage"
                                    textAnchor="middle"
                                    fill="#111827"
                                    fontSize="10px"
                                  >
                                    {task.progress}%
                                  </text>
                                </svg>
                              </div>
                            </div>

                            <div className="emp-task-dates">
                              <div className="emp-task-date-group">
                                <span className="emp-task-date-label">
                                  Start
                                </span>
                                <span className="emp-task-date-pill emp-task-start">
                                  {displayDate(task.startDate)}
                                </span>
                              </div>
                              <span className="emp-task-arrow">→</span>
                              <div className="emp-task-date-group">
                                <span className="emp-task-date-label">End</span>
                                <span
                                  className={`emp-task-date-pill emp-task-end ${
                                    isOverdue ? "emp-task-overdue" : ""
                                  }`}
                                >
                                  {displayDate(task.endDate)}
                                </span>
                              </div>
                            </div>

                            <div className="emp-task-footer">
                              <div className="emp-task-spacer" />
                              <div
                                className="emp-task-msg-wrap"
                                title="Open messages"
                              >
                                <span
                                  className="emp-task-message-icon"
                                  role="img"
                                  aria-label="messages"
                                >
                                  💬
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}

            {selectedTask && (
              <div className="emp-task-details-backdrop" onClick={closeDetails}>
                <div
                  className="emp-task-details"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="emp-task-details-header">
                    <div className="emp-task-details-title">
                      <div className="emp-task-pill">{selectedTask.id}</div>
                      <h3>{selectedTask.title}</h3>
                    </div>
                    <button
                      className="emp-task-close-btn"
                      onClick={closeDetails}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="emp-task-details-meta">
                    <div className="emp-task-meta-row">
                      <div className="emp-task-status-line">
                        <span className="emp-task-label">Status:</span>
                        <span className="emp-task-value">
                          {selectedTask.status}
                        </span>
                      </div>

                      <div className="emp-task-progress-wrapper">
                        <svg
                          viewBox="0 0 36 36"
                          className="emp-task-progress-ring"
                        >
                          <path
                            className="emp-task-circle-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                            fill="none"
                          />
                          <path
                            className="emp-task-circle"
                            strokeDasharray="100"
                            strokeDashoffset={100 - selectedTask.progress}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            stroke={
                              selectedTask.status !== "Completed" &&
                              new Date(selectedTask.endDate) < currentDate
                                ? "#ef4444"
                                : getProgressColor(selectedTask.progress)
                            }
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                          />
                          <text
                            x="18"
                            y="20.35"
                            className="emp-task-percentage"
                            textAnchor="middle"
                            fill="#111827"
                            fontSize="10px"
                          >
                            {selectedTask.progress}%
                          </text>
                        </svg>
                      </div>

                      {activeTab === "Progress" && !editingProgress && (
                        <button
                          className="emp-task-edit-progress-btn"
                          onClick={startEditingProgress}
                          title="Edit Progress"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                              stroke="#6b7280"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                              stroke="#6b7280"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {editingProgress && (
                      <div className="emp-task-progress-editor">
                        <div className="emp-task-slider-container">
                          <label htmlFor="progress-slider">Progress</label>
                          <input
                            id="progress-slider"
                            type="range"
                            min="0"
                            max="100"
                            value={tempProgress}
                            onChange={handleSliderChange}
                            className="emp-task-progress-slider"
                          />
                          <span className="emp-task-slider-value">
                            {tempProgress}%
                          </span>
                        </div>

                        <div className="emp-task-status-container">
                          <label htmlFor="status-select">Status</label>
                          <select
                            id="status-select"
                            value={tempStatus}
                            onChange={handleStatusChange}
                            className="emp-task-status-select"
                          >
                            {dropdownColumns.map((col) => (
                              <option key={col.key} value={col.key}>
                                {col.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="emp-task-editor-actions">
                          <button
                            onClick={saveProgress}
                            className="emp-task-save-btn"
                          >
                            Update Progress
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="emp-task-cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="emp-task-dates-row">
                      <span className="emp-task-date-pill emp-task-start">
                        Start: {displayDate(selectedTask.startDate)}
                      </span>
                      <span className="emp-task-arrow">→</span>
                      <span
                        className={`emp-task-date-pill emp-task-end ${
                          selectedTask.status !== "Completed" &&
                          new Date(selectedTask.endDate) < currentDate
                            ? "emp-task-overdue"
                            : ""
                        }`}
                      >
                        End: {displayDate(selectedTask.endDate)}
                      </span>
                    </div>

                    <div className="emp-task-description">
                      <h4>Description</h4>
                      <p>
                        {selectedTask.description
                          .split("\n")
                          .map((line, idx) => (
                            <span key={idx}>
                              {line.startsWith("- ")
                                ? `• ${line.slice(2)}`
                                : line}
                              <br />
                            </span>
                          ))}
                      </p>
                    </div>
                  </div>

                  <div className="emp-task-tabs">
                    <div className="emp-task-tab-header">
                      <button
                        className={`emp-task-tab-btn ${
                          activeTab === "Progress" ? "emp-task-active" : ""
                        }`}
                        onClick={() => setActiveTab("Progress")}
                      >
                        Progress
                      </button>
                      <button
                        className={`emp-task-tab-btn ${
                          activeTab === "Clarification" ? "emp-task-active" : ""
                        }`}
                        onClick={() => setActiveTab("Clarification")}
                      >
                        Clarification
                      </button>
                    </div>

                    <div className="emp-task-tab-content">
                      {activeTab === "Progress" && (
                        <div className="emp-task-progress-tab">
                          <h4>Progress Updates</h4>
                          {loadingMessages ? (
                            <p className="emp-task-loading-message">
                              Loading progress messages...
                            </p>
                          ) : selectedTask.messages.filter(
                              (msg) => msg.type === "Progress"
                            ).length > 0 ? (
                            <div className="emp-task-messages">
                              {selectedTask.messages
                                .filter((msg) => msg.type === "Progress")
                                .map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={`emp-task-message ${
                                      msg.senderName === "You"
                                        ? "emp-task-sent"
                                        : "emp-task-received"
                                    }`}
                                  >
                                    <div className="emp-task-message-content">
                                      {msg.text}
                                    </div>
                                    <div className="emp-task-message-meta">
                                      <span>{displayDate(msg.time)}</span>
                                      <span>{msg.senderName}</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="emp-task-no-msg">
                              No progress updates yet.
                            </p>
                          )}
                          <form
                            className="emp-task-chat-input"
                            onSubmit={handleAddMessage}
                          >
                            <div className="emp-task-mic-input-wrapper">
                              <input
                                type="text"
                                placeholder={
                                  isListening
                                    ? "Listening... speak now"
                                    : "Type a progress comment…"
                                }
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                disabled={loadingMessages}
                              />
                              <button
                                type="button"
                                className={`emp-task-mic-button ${
                                  isListening ? "listening" : ""
                                }`}
                                onClick={toggleMic}
                                title={isListening ? "Stop listening" : "Speak"}
                              >
                                <i className="fa-solid fa-microphone"></i>
                              </button>
                            </div>
                            <button
                              type="submit"
                              disabled={loadingMessages || !messageText.trim()}
                            >
                              Send
                            </button>
                          </form>
                        </div>
                      )}

                      {activeTab === "Clarification" && (
                        <div className="emp-task-clarification-tab">
                          <h4>Clarification</h4>
                          {loadingMessages ? (
                            <p className="emp-task-loading-message">
                              Loading clarification messages...
                            </p>
                          ) : selectedTask.messages.filter(
                              (msg) => msg.type === "Clarification"
                            ).length > 0 ? (
                            <div className="emp-task-messages">
                              {selectedTask.messages
                                .filter((msg) => msg.type === "Clarification")
                                .map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={`emp-task-message ${
                                      msg.senderName === "You"
                                        ? "emp-task-sent"
                                        : "emp-task-received"
                                    }`}
                                  >
                                    <div className="emp-task-message-content">
                                      {msg.text}
                                    </div>
                                    <div className="emp-task-message-meta">
                                      <span>{displayDate(msg.time)}</span>
                                      <span>{msg.senderName}</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="emp-task-no-msg">
                              No clarifications yet.
                            </p>
                          )}
                          <form
                            className="emp-task-chat-input"
                            onSubmit={handleAddMessage}
                          >
                            <div className="emp-task-mic-input-wrapper">
                              <input
                                type="text"
                                placeholder={
                                  isListening
                                    ? "Listening... speak now"
                                    : "Type a clarification message…"
                                }
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                disabled={loadingMessages}
                              />
                              <button
                                type="button"
                                className={`emp-task-mic-button ${
                                  isListening ? "listening" : ""
                                }`}
                                onClick={toggleMic}
                                title={isListening ? "Stop listening" : "Speak"}
                              >
                                <i className="fa-solid fa-microphone"></i>
                              </button>
                            </div>
                            <button
                              type="submit"
                              disabled={loadingMessages || !messageText.trim()}
                            >
                              Send
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Modal
            isVisible={alertModal.isVisible}
            onClose={closeAlert}
            buttons={[{ label: "OK", onClick: closeAlert }]}
          >
            <p>{alertModal.message}</p>
          </Modal>
        </>
      )}

      {activeSection === "WeeklyTasks" &&
        (userContext ? (
          <WeeklyTaskPlanner
            userRole={userContext.role?.toLowerCase() || "employee"}
            employeeId={employeeId}
            userContext={userContext}
          />
        ) : (
          <div className="emp-task-loading-message">
            Loading user session...
          </div>
        ))}
    </div>
  );
};

export default EmpTaskManagement;
