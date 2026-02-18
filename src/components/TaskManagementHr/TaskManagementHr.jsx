

"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import "./TaskManagementHr.css"; // ← use the CSS below (exact copy with prefix change)
import SupervisorPlanViewerHr from "./SupervisorPlanViewerHr.client"; // ← your HR weekly viewer
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

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

const displayDate = (date) => parseDate(date);

const TaskManagementHr = () => {
  const { user, hydrated } = useAuth();
  const [userContext, setUserContext] = useState(null);

  useEffect(() => {
    if (!hydrated || !user) {
      setUserContext(null);
      return;
    }
    setUserContext({
      employeeId: String(user.employeeId),
      role: String(user.role || "hr"),
      orgId: user.orgId || null,
    });
  }, [user, hydrated]);

  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activeTab, setActiveTab] = useState("Progress");
  const [mainTab, setMainTab] = useState("Task Board");

  const [alertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const getHeaders = useCallback(
    () => ({
      "x-employee-id": userContext?.employeeId || "",
      "x-role": "hr",
      "x-org-id": userContext?.orgId ?? "",
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
    }),
    [userContext]
  );

  const getSenderName = useCallback(
    (senderId) => {
      if (!senderId) return "Unknown";
      if (String(senderId) === String(userContext?.employeeId)) return "You";
      const emp = employees.find(
        (e) => String(e.employee_id) === String(senderId)
      );
      return emp?.employee_name || senderId || "Unknown";
    },
    [userContext?.employeeId, employees]
  );

  useEffect(() => {
    if (!userContext) return;
    const fetch = async () => {
      setLoadingEmployees(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/employees/all`,
          { withCredentials: true, headers: getHeaders() }
        );
        setEmployees(res.data.employees || []);
        setError(null);
      } catch (e) {
        setError(e.response?.data?.error || "Failed to load employees");
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetch();
  }, [userContext, getHeaders]);

  const fetchTasks = async () => {
    if (!userContext || employees.length === 0) return;
    setLoadingTasks(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks`,
        { withCredentials: true, headers: getHeaders() }
      );

      const validEmpIds = new Set(employees.map((e) => e.employee_id));
      const formatted = (res.data || [])
        .filter((t) => validEmpIds.has(t.employee_id))
        .map((t) => {
          const emp = employees.find((e) => e.employee_id === t.employee_id);
          const prog = Math.min(Math.max(Number(t.percentage ?? 0), 0), 100);

          return {
            id: `Task-${t.task_id}`,
            dbId: t.task_id,
            title: t.task_title,
            description: t.description,
            status: t.status,
            startDate: t.start_date,
            endDate: t.due_date,
            employeeId: t.employee_id,
            user: { name: emp?.employee_name || "Unknown", profile: "" },
            progress: prog,
            messages: [],
          };
        });
      setTasks(formatted);
      setError(null);
    } catch (e) {
      setError("Failed to load tasks");
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userContext, employees.length, getHeaders]);

  const fetchMessagesForTask = useCallback(
    async (taskId) => {
      if (!taskId) return;
      setLoadingMessages(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/${taskId}`,
          { withCredentials: true, headers: getHeaders() }
        );

        if (res.data.success) {
          const { progressMessages = [], clarificationMessages = [] } = res.data;
          const all = [
            ...progressMessages.map((m) => ({
              ...m,
              senderName: getSenderName(m.sender),
              type: "Progress",
            })),
            ...clarificationMessages.map((m) => ({
              ...m,
              senderName: getSenderName(m.sender),
              type: "Clarification",
            })),
          ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

          setTasks((prev) =>
            prev.map((t) => (t.dbId === taskId ? { ...t, messages: all } : t))
          );
        }
      } catch (e) {
        console.error("Failed to load messages:", e);
      } finally {
        setLoadingMessages(false);
      }
    },
    [getHeaders, getSenderName]
  );

  useEffect(() => {
  if (!selectedTaskId || !userContext) return;

  const selected = tasks.find((t) => t.id === selectedTaskId);
  if (!selected?.dbId) return;

  // ← Add this check
  if (selected.messages?.length > 0) {
    return; // already loaded → skip network call
  }

  fetchMessagesForTask(selected.dbId);
}, [selectedTaskId, userContext, fetchMessagesForTask, tasks]);
//   useEffect(() => {
//     if (!selectedTaskId || !userContext) return;
//     const selected = tasks.find((t) => t.id === selectedTaskId);
//     if (selected?.dbId) {
//       fetchMessagesForTask(selected.dbId);
//     }
//   }, [selectedTaskId, userContext, fetchMessagesForTask, tasks]);

  const columns = useMemo(
    () => [
      { key: "Yet to Start", title: "Yet to Start", color: "#7c7d1e" },
      { key: "In Progress", title: "In Progress", color: "#1d4ed8" },
      { key: "On-Hold", title: "On-Hold", color: "#9d174d" },
      { key: "Completed", title: "Completed", color: "#065f46" },
    ],
    []
  );

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  const currentDate = new Date();

  const openDetails = (id) => setSelectedTaskId(id);
  const closeDetails = () => {
    setSelectedTaskId(null);
    setActiveTab("Progress");
  };

  if (!hydrated)
    return <div className="task-hr-board-container">Loading...</div>;

  if (!user)
    return (
      <div className="task-hr-board-container">
        <div className="task-hr-error-message">
          Please <a href="/login">log in</a>.
        </div>
      </div>
    );

  return (
    <div className="task-hr-board-container">
      <div className="task-hr-sections">
        <button
          className={`task-hr-section-btn ${mainTab === "Task Board" ? "task-hr-active" : ""}`}
          onClick={() => setMainTab("Task Board")}
        >
          Supervisor Driven
        </button>
        <button
          className={`task-hr-section-btn ${mainTab === "Weekly Tasks" ? "task-hr-active" : ""}`}
          onClick={() => setMainTab("Weekly Tasks")}
        >
          Employee Driven
        </button>
      </div>

      {mainTab === "Task Board" && (
        <>
          {error && <div className="task-hr-error-message">{error}</div>}
          {loadingTasks && (
            <div className="task-hr-loading-message">Loading tasks...</div>
          )}
          {!loadingTasks && tasks.length === 0 && !error && (
            <div className="task-hr-no-tasks">No tasks available</div>
          )}

          <div className="task-hr-board">
            {columns.map((col) => {
              const colTasks = tasks
                .filter((t) => t.status === col.key)
                .sort((a, b) => {
                  if (col.key === "Yet to Start")
                    return new Date(b.endDate || 0).getTime() - new Date(a.endDate || 0).getTime();
                  return new Date(a.endDate || 0).getTime() - new Date(b.endDate || 0).getTime();
                });

              return (
                <div className="task-hr-column" key={col.key}>
                  <div
                    className="task-hr-column-header"
                    style={{ backgroundColor: col.color }}
                  >
                    <span>{col.title}</span>
                  </div>
                  <div className="task-hr-list">
                    {colTasks.length === 0 && !loadingTasks && !error ? (
                      <div className="task-hr-no-tasks">
                        No {col.title.toLowerCase()} tasks
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const overdue =
                          task.status !== "Completed" &&
                          new Date(task.endDate) < currentDate;
                        const ring = overdue ? "#ef4444" : getProgressColor(task.progress);

                        return (
                          <div
                            className="task-hr-card"
                            key={task.id}
                            onClick={() => openDetails(task.id)}
                          >
                            <div className="task-hr-header">
                              <div className="task-hr-title-group">
                                <div className="task-hr-title">{task.title}</div>
                                <div className="task-hr-employee-name">
                                  {task.user.name}
                                </div>
                              </div>
                              <div
                                className="task-hr-progress-wrapper"
                                title={`${task.progress}%`}
                              >
                                <svg
                                  viewBox="0 0 36 36"
                                  className="task-hr-progress-ring"
                                >
                                  <path
                                    className="task-hr-circle-bg"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    stroke="#e5e7eb"
                                    strokeWidth="3"
                                    fill="none"
                                  />
                                  <path
                                    className="task-hr-circle"
                                    strokeDasharray="100"
                                    strokeDashoffset={100 - task.progress}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    stroke={ring}
                                    strokeWidth="3"
                                    fill="none"
                                    strokeLinecap="round"
                                  />
                                  <text
                                    x="18"
                                    y="20.35"
                                    className="task-hr-percentage"
                                    textAnchor="middle"
                                    fill="#111827"
                                    fontSize="10px"
                                  >
                                    {task.progress}%
                                  </text>
                                </svg>
                              </div>
                            </div>

                            <div className="task-hr-dates">
                              <div className="task-hr-date-group">
                                <span className="task-hr-date-label">Start</span>
                                <span className="task-hr-date-pill task-hr-start">
                                  {displayDate(task.startDate)}
                                </span>
                              </div>
                              <span className="task-hr-arrow">→</span>
                              <div className="task-hr-date-group">
                                <span className="task-hr-date-label">End</span>
                                <span
                                  className={`task-hr-date-pill task-hr-end ${
                                    overdue ? "task-hr-overdue" : ""
                                  }`}
                                >
                                  {displayDate(task.endDate)}
                                </span>
                              </div>
                            </div>

                            <div className="task-hr-footer">
                              <div className="task-hr-spacer" />
                              <div className="task-hr-msg-wrap" title="View messages">
                                <span className="task-hr-message-icon" role="img" aria-label="messages">
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
              <div className="task-hr-details-backdrop" onClick={closeDetails}>
                <div className="task-hr-details" onClick={(e) => e.stopPropagation()}>
                  <div className="task-hr-details-header">
                    <div className="task-hr-details-title">
                      <h3>{selectedTask.title}</h3>
                    </div>
                    <button className="task-hr-close-btn" onClick={closeDetails}>
                      X
                    </button>
                  </div>

                  <div className="task-hr-details-meta">
                    <div className="task-hr-meta-row">
                      <div className="task-hr-status-line">
                        <span className="task-hr-label">Status:</span>
                        <span className="task-hr-value">{selectedTask.status}</span>
                      </div>
                      <div className="task-hr-progress-wrapper">
                        <svg viewBox="0 0 36 36" className="task-hr-progress-ring">
                          <path
                            className="task-hr-circle-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                            fill="none"
                          />
                          <path
                            className="task-hr-circle"
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
                            className="task-hr-percentage"
                            textAnchor="middle"
                            fill="#111827"
                            fontSize="10px"
                          >
                            {selectedTask.progress}%
                          </text>
                        </svg>
                      </div>
                    </div>

                    <div className="task-hr-dates-row">
                      <span className="task-hr-date-pill task-hr-start">
                        Start: {displayDate(selectedTask.startDate)}
                      </span>
                      <span className="task-hr-arrow">→</span>
                      <span
                        className={`task-hr-date-pill task-hr-end ${
                          selectedTask.status !== "Completed" &&
                          new Date(selectedTask.endDate) < currentDate
                            ? "task-hr-overdue"
                            : ""
                        }`}
                      >
                        End: {displayDate(selectedTask.endDate)}
                      </span>
                    </div>

                    <div className="task-hr-description">
                      <h4>Description</h4>
                      <p>
                        {selectedTask.description
                          .split("\n")
                          .map((line, idx) => (
                            <span key={idx}>
                              {line.startsWith("- ") ? `• ${line.slice(2)}` : line}
                              <br />
                            </span>
                          ))}
                      </p>
                    </div>
                  </div>

                  <div className="task-hr-tabs">
                    <div className="task-hr-tab-header">
                      <button
                        className={`task-hr-tab-btn ${activeTab === "Progress" ? "task-hr-active" : ""}`}
                        onClick={() => setActiveTab("Progress")}
                      >
                        Progress
                      </button>
                      <button
                        className={`task-hr-tab-btn ${activeTab === "Clarification" ? "task-hr-active" : ""}`}
                        onClick={() => setActiveTab("Clarification")}
                      >
                        Clarification
                      </button>
                    </div>

                    <div className="task-hr-tab-content">
                      {activeTab === "Progress" && (
                        <div className="task-hr-progress-tab">
                          <h4>Progress Updates</h4>
                          {loadingMessages ? (
                            <p className="task-hr-loading-message">Loading...</p>
                          ) : selectedTask.messages.filter((m) => m.type === "Progress").length > 0 ? (
                            <div className="task-hr-messages">
                              {selectedTask.messages
                                .filter((m) => m.type === "Progress")
                                .map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={`task-hr-message ${
                                      String(msg.sender) === String(userContext?.employeeId)
                                        ? "task-hr-sent"
                                        : "task-hr-received"
                                    }`}
                                  >
                                    <div className="task-hr-message-content">{msg.text}</div>
                                    <div className="task-hr-message-meta">
                                      <span>{displayDate(msg.time)}</span>
                                      
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="task-hr-no-msg">No progress updates yet.</p>
                          )}
                        </div>
                      )}

                      {activeTab === "Clarification" && (
                        <div className="task-hr-clarification-tab">
                          <h4>Clarification</h4>
                          {loadingMessages ? (
                            <p className="task-hr-loading-message">Loading...</p>
                          ) : selectedTask.messages.filter((m) => m.type === "Clarification").length > 0 ? (
                            <div className="task-hr-messages">
                              {selectedTask.messages
                                .filter((m) => m.type === "Clarification")
                                .map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={`task-hr-message ${
                                      String(msg.sender) === String(userContext?.employeeId)
                                        ? "task-hr-sent"
                                        : "task-hr-received"
                                    }`}
                                  >
                                    <div className="task-hr-message-content">{msg.text}</div>
                                    <div className="task-hr-message-meta">
                                      <span>{displayDate(msg.time)}</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="task-hr-no-msg">No clarifications yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {mainTab === "Weekly Tasks" && <SupervisorPlanViewerHr />}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={() => {}}
        buttons={[{ label: "OK", onClick: () => {} }]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default TaskManagementHr;