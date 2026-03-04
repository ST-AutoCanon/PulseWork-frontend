"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import "./TaskManagementAdmin.css";
import SupervisorPlanViewerAdmin from "./SupervisorPlanViewerAdmin.client";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";
import { MdMic, MdMicOff } from "react-icons/md";

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
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

const displayDate = (date) => parseDate(date);

const TaskManagementAdmin = () => {
  const { user, hydrated } = useAuth();
  const [userContext, setUserContext] = useState(null);

  useEffect(() => {
    if (!hydrated || !user) {
      setUserContext(null);
      return;
    }
    setUserContext({
      employeeId: String(user.employeeId),
      role: String(user.role || "admin"),
      orgId: user.orgId || null,
    });
  }, [user, hydrated]);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const [listening, setListening] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [activeTab, setActiveTab] = useState("Progress");
  const [mainTab, setMainTab] = useState("Task Board");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    employeeId: "",
    startDate: null,
    endDate: null,
    status: "Yet to Start",
    percentage: 0,
  });

  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [editingProgress, setEditingProgress] = useState(false);
  const [tempProgress, setTempProgress] = useState(0);
  const [tempStatus, setTempStatus] = useState("");
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const getHeaders = useCallback(
    () => ({
      "x-employee-id": userContext?.employeeId || "",
      "x-role": "admin",
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
      return emp?.employee_name || "Unknown";
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

  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      console.warn("Speech Recognition not supported");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();

        if (result.isFinal) {
          finalTranscriptRef.current += transcript + " ";
        } else {
          interimTranscript = transcript;
        }
      }

      setMessageText(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onend = () => {
      setListening(false);
      setMessageText(finalTranscriptRef.current.trim());
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
      setMessageText(finalTranscriptRef.current.trim());
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  // const fetchTasks = async () => {
  //   if (!userContext || employees.length === 0) return;
  //   setLoadingTasks(true);
  //   try {
  //     const res = await axios.get(
  //       `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks`,
  //       { withCredentials: true, headers: getHeaders() }
  //     );

  //     const validEmpIds = new Set(employees.map((e) => e.employee_id));
  //     const formatted = (res.data || [])
  //       .filter((t) => validEmpIds.has(t.employee_id))
  //       .map((t) => {
  //         const emp = employees.find((e) => e.employee_id === t.employee_id);
  //         const prog = Math.min(Math.max(Number(t.percentage ?? 0), 0), 100);

  //         return {
  //           id: `Task-${t.task_id}`,
  //           dbId: t.task_id,
  //           title: t.task_title,
  //           description: t.description,
  //           status: t.status,
  //           startDate: formatDate(t.start_date),
  //           endDate: formatDate(t.due_date),
  //           employeeId: t.employee_id,
  //           user: { name: emp?.employee_name || "Unknown", profile: "" },
  //           progress: prog,
  //           messages: [],
  //         };
  //       });
  //     setTasks(formatted);
  //     setError(null);
  //   } catch (e) {
  //     setError(e.response?.data?.error || e.message || "Failed to load tasks");
  //     setTasks([]);
  //   } finally {
  //     setLoadingTasks(false);
  //   }
  // };

  const fetchTasks = useCallback(async () => {
  if (!userContext || employees.length === 0) return;
  setLoadingTasks(true);

  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks`,
      { withCredentials: true, headers: getHeaders() }
    );

    const validEmpIds = new Set(employees.map((e) => e.employee_id));

    setTasks((currentTasks) => {
      // Create a lookup: dbId → current task object (to preserve messages, etc.)
      const currentTaskMap = new Map(
        currentTasks.map((t) => [t.dbId, t])
      );

      // Build updated tasks by merging server data with existing client data
      const mergedTasks = (res.data || [])
        .filter((t) => validEmpIds.has(t.employee_id))
        .map((serverTask) => {
          const emp = employees.find((e) => e.employee_id === serverTask.employee_id);
          const prog = Number(serverTask.percentage ?? 0);
          const safeProg = isNaN(prog) ? 0 : Math.min(Math.max(prog, 0), 100);

          // Get existing client-side task (if any)
          const existing = currentTaskMap.get(serverTask.task_id);

          return {
            // Prefer existing client data, fall back to server
            id: existing?.id || `Task-${serverTask.task_id}`,
            dbId: serverTask.task_id,
            title: serverTask.task_title,
            description: serverTask.description,
            status: serverTask.status,
            startDate: formatDate(serverTask.start_date),
            endDate: formatDate(serverTask.due_date),
            employeeId: serverTask.employee_id,
            user: existing?.user || { name: emp?.employee_name || "Unknown", profile: "" },
            progress: safeProg,

            // MOST IMPORTANT: always keep client-side messages if they exist
            messages: existing?.messages || [],
          };
        });

      // Optional: keep any local-only tasks that server didn't return (if needed)
      // For now we assume server is source of truth → only return merged server tasks
      return mergedTasks;
    });

    setError(null);
  } catch (e) {
    setError(e.response?.data?.error || e.message || "Failed to load tasks");
    // Do NOT clear tasks on error → keep previous state + messages
    // setTasks([]);  ← remove or comment this line
  } finally {
    setLoadingTasks(false);
  }
}, [userContext, employees, getHeaders]);
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
          const { progressMessages = [], clarificationMessages = [] } =
            res.data;
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
          ].sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
          );

          setTasks((prev) =>
            prev.map((t) => (t.dbId === taskId ? { ...t, messages: all } : t))
          );
        }
      } catch (e) {
        setTasks((prev) =>
          prev.map((t) => (t.dbId === taskId ? { ...t, messages: [] } : t))
        );
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

    fetchMessagesForTask(selected.dbId);
  }, [selectedTaskId, userContext, fetchMessagesForTask]);

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
    setMessageText("");
    setActiveTab("Progress");
    setEditingProgress(false);
    setTempProgress(0);
    setTempStatus("");
  };

  const startEditingProgress = () => {
    if (selectedTask) {
      setTempProgress(selectedTask.progress);
      setTempStatus(selectedTask.status);
      setEditingProgress(true);
    }
  };

  const handleSliderChange = (e) => {
    setTempProgress(parseInt(e.target.value, 10));
  };

  const handleStatusChange = (e) => {
    setTempStatus(e.target.value);
  };

  const saveProgress = async () => {
    if (!selectedTask || !userContext) return;
    const taskId = selectedTask.dbId;

    try {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id
            ? { ...t, status: tempStatus, progress: tempProgress }
            : t
        )
      );

      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employee-tasks/update/${taskId}`,
        { status: tempStatus, percentage: tempProgress },
        { withCredentials: true, headers: getHeaders() }
      );

      await fetchTasks();
      setAlertModal({ isVisible: true, message: "Task updated successfully" });
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to update task");
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id
            ? {
                ...t,
                status: selectedTask.status,
                progress: selectedTask.progress,
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

    const taskId = selectedTask.dbId;
    const newMsg = {
      text,
      time: new Date().toISOString(),
      sender: userContext.employeeId,
      senderName: "You",
      type: activeTab,
    };

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

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages`,
        { taskId, sender: userContext.employeeId, type: activeTab, text },
        { withCredentials: true, headers: getHeaders() }
      );
      setMessageText("");
      finalTranscriptRef.current = "";

      await fetchMessagesForTask(taskId);
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

  const openAssignForm = () => setShowAssignForm(true);
  const closeAssignForm = () => {
    setShowAssignForm(false);
    setFormData({
      title: "",
      description: "",
      employeeId: "",
      startDate: null,
      endDate: null,
      status: "Yet to Start",
      percentage: 0,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date, name) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const {
      title,
      description,
      employeeId,
      startDate,
      endDate,
      status,
      percentage,
    } = formData;
    if (!title || !employeeId || !startDate || !endDate) {
      setError("All required fields must be filled.");
      return;
    }

    try {
      const emp = employees.find((e) => e.employee_id === employeeId);
      if (!emp) throw new Error("Employee not found");

      const newId = tasks.length
        ? `Task-${
            Math.max(...tasks.map((t) => parseInt(t.id.split("-")[1]))) + 1
          }`
        : "Task-1";

      const payload = {
        employee_id: employeeId,
        task_title: title,
        description,
        start_date: formatDate(startDate),
        due_date: formatDate(endDate),
        status,
        percentage,
      };

      const postRes = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks`,
        payload,
        { withCredentials: true, headers: getHeaders() }
      );

      const createdTaskId = postRes.data.taskId || postRes.data.task_id;

      setTasks((prev) => [
        ...prev,
        {
          id: newId,
          dbId: createdTaskId,
          title,
          description,
          status,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          employeeId,
          user: { name: emp.employee_name, profile: "" },
          progress: percentage,
          messages: [],
        },
      ]);

      setAlertModal({ isVisible: true, message: "Task assigned successfully" });
      closeAssignForm();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to assign task");
    }
  };

  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  if (!hydrated)
    return <div className="task-admin-board-container">Loading...</div>;
  if (!user)
    return (
      <div className="task-admin-board-container">
        <div className="task-admin-error-message">
          Please <a href="/login">log in</a> as Admin.
        </div>
      </div>
    );

  return (
    <div className="task-admin-board-container">
      <div className="task-admin-sections">
        <button
          className={`task-admin-section-btn ${
            mainTab === "Task Board" ? "task-admin-active" : ""
          }`}
          onClick={() => setMainTab("Task Board")}
        >
          Supervisor Driven
        </button>
        <button
          className={`task-admin-section-btn ${
            mainTab === "Weekly Tasks" ? "task-admin-active" : ""
          }`}
          onClick={() => setMainTab("Weekly Tasks")}
        >
          Employee Driven
        </button>
      </div>

      {mainTab === "Task Board" && (
        <>
          <div className="task-admin-board-subheader">
            <button className="assign-task-admin-btn" onClick={openAssignForm}>
              Assign Task
            </button>
          </div>

          {error && <div className="task-admin-error-message">{error}</div>}
          {loadingTasks && (
            <div className="task-admin-loading-message">Loading tasks...</div>
          )}
          {!loadingTasks && tasks.length === 0 && !error && (
            <div className="task-admin-no-tasks">No tasks available</div>
          )}

          <div className="task-admin-board">
            {columns.map((col) => {
              const colTasks = tasks
                .filter((t) => t.status === col.key)
                .sort((a, b) => {
                  if (col.key === "Yet to Start")
                    return (
                      new Date(b.endDate || 0).getTime() -
                      new Date(a.endDate || 0).getTime()
                    );
                  return (
                    new Date(a.endDate || 0).getTime() -
                    new Date(b.endDate || 0).getTime()
                  );
                });

              return (
                <div className="task-admin-column" key={col.key}>
                  <div
                    className="task-admin-column-header"
                    style={{ backgroundColor: col.color }}
                  >
                    <span>{col.title}</span>
                  </div>
                  <div className="task-admin-list">
                    {colTasks.length === 0 && !loadingTasks && !error ? (
                      <div className="task-admin-no-tasks">
                        No {col.title.toLowerCase()} tasks
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const overdue =
                          task.status !== "Completed" &&
                          new Date(task.endDate) < currentDate;
                        const ring = overdue
                          ? "#ef4444"
                          : getProgressColor(task.progress);
                        return (
                          <div
                            className="task-admin-card"
                            key={task.id}
                            onClick={() => openDetails(task.id)}
                          >
                            <div className="task-admin-header">
                              <div className="task-admin-title-group">
                                <div className="task-admin-title">
                                  {task.title}
                                </div>
                                <div className="task-admin-employee-name">
                                  {task.user.name}
                                </div>
                                {/* <div className="task-admin-employee-id">
                                  EMP-ID: {task.employeeId}
                                </div>
                                <div className="task-admin-id-chip">
                                  {task.id}
                                </div> */}
                              </div>
                              <div
                                className="task-admin-progress-wrapper"
                                title={`${task.progress}%`}
                              >
                                <svg
                                  viewBox="0 0 36 36"
                                  className="task-admin-progress-ring"
                                >
                                  <path
                                    className="task-admin-circle-bg"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    stroke="#e5e7eb"
                                    strokeWidth="3"
                                    fill="none"
                                  />
                                  <path
                                    className="task-admin-circle"
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
                                    className="task-admin-percentage"
                                    textAnchor="middle"
                                    fill="#111827"
                                    fontSize="10px"
                                  >
                                    {task.progress}%
                                  </text>
                                </svg>
                              </div>
                            </div>

                            <div className="task-admin-dates">
                              <div className="task-admin-date-group">
                                <span className="task-admin-date-label">
                                  Start
                                </span>
                                <span className="task-admin-date-pill task-admin-start">
                                  {displayDate(task.startDate)}
                                </span>
                              </div>
                              <span className="task-admin-arrow">→</span>
                              <div className="task-admin-date-group">
                                <span className="task-admin-date-label">
                                  End
                                </span>
                                <span
                                  className={`task-admin-date-pill task-admin-end ${
                                    overdue ? "task-admin-overdue" : ""
                                  }`}
                                >
                                  {displayDate(task.endDate)}
                                </span>
                              </div>
                            </div>

                            <div className="task-admin-footer">
                              <div className="task-admin-spacer" />
                              <div
                                className="task-admin-msg-wrap"
                                title="Open messages"
                              >
                                <span
                                  className="task-admin-message-icon"
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
              <div
                className="task-admin-details-backdrop"
                onClick={closeDetails}
              >
                <div
                  className="task-admin-details"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="task-admin-details-header">
                    <div className="task-admin-details-title">
                      {/* <div className="task-admin-pill">{selectedTask.id}</div> */}
                      <h3>{selectedTask.title}</h3>
                    </div>
                    <button
                      className="task-admin-close-btn"
                      onClick={closeDetails}
                    >
                      X
                    </button>
                  </div>

                  <div className="task-admin-details-meta">
                    <div className="task-admin-meta-row">
                      <div className="task-admin-status-line">
                        <span className="task-admin-label">Status:</span>
                        <span className="task-admin-value">
                          {selectedTask.status}
                        </span>
                      </div>
                      <div className="task-admin-progress-wrapper">
                        <svg
                          viewBox="0 0 36 36"
                          className="task-admin-progress-ring"
                        >
                          <path
                            className="task-admin-circle-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                            fill="none"
                          />
                          <path
                            className="task-admin-circle"
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
                            className="task-admin-percentage"
                            textAnchor="middle"
                            fill="#111827"
                            fontSize="10px"
                          >
                            {selectedTask.progress}%
                          </text>
                        </svg>
                      </div>
                      {!editingProgress && (
                        <button
                          className="task-admin-edit-progress-btn"
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
                      <div className="task-admin-progress-editor">
                        <div className="task-admin-slider-container">
                          <label htmlFor="progress-slider">Progress</label>
                          <input
                            id="progress-slider"
                            type="range"
                            min="0"
                            max="100"
                            value={tempProgress}
                            onChange={handleSliderChange}
                            className="task-admin-progress-slider"
                          />
                          <span className="task-admin-slider-value">
                            {tempProgress}%
                          </span>
                        </div>
                        <div className="task-admin-status-container">
                          <label htmlFor="status-select">Status</label>
                          <select
                            id="status-select"
                            value={tempStatus}
                            onChange={handleStatusChange}
                            className="task-admin-status-select"
                          >
                            <option value="Yet to Start">Yet to Start</option>
                            <option value="In Progress">In Progress</option>
                            <option value="On-Hold">On-Hold</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div className="task-admin-editor-actions">
                          <button
                            onClick={saveProgress}
                            className="task-admin-save-btn"
                          >
                            Update Progress
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="task-admin-cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="task-admin-dates-row">
                      <span className="task-admin-date-pill task-admin-start">
                        Start: {displayDate(selectedTask.startDate)}
                      </span>
                      <span className="task-admin-arrow">→</span>
                      <span
                        className={`task-admin-date-pill task-admin-end ${
                          selectedTask.status !== "Completed" &&
                          new Date(selectedTask.endDate) < currentDate
                            ? "task-admin-overdue"
                            : ""
                        }`}
                      >
                        End: {displayDate(selectedTask.endDate)}
                      </span>
                    </div>

                    <div className="task-admin-description">
                      <h4>Description</h4>
                      <p>
                        {selectedTask.description
                          .split("\n")
                          .map((line, idx) => (
                            <span key={idx}>
                              {line.startsWith("- ")
                                ? `Bullet ${line.slice(2)}`
                                : line}
                              <br />
                            </span>
                          ))}
                      </p>
                    </div>
                  </div>

                  <div className="task-admin-tabs">
                    <div className="task-admin-tab-header">
                      <button
                        className={`task-admin-tab-btn ${
                          activeTab === "Progress" ? "task-admin-active" : ""
                        }`}
                        onClick={() => setActiveTab("Progress")}
                      >
                        Progress
                      </button>
                      <button
                        className={`task-admin-tab-btn ${
                          activeTab === "Clarification"
                            ? "task-admin-active"
                            : ""
                        }`}
                        onClick={() => setActiveTab("Clarification")}
                      >
                        Clarification
                      </button>
                    </div>

                    <div className="task-admin-tab-content">
                      {activeTab === "Progress" && (
                        <div className="task-admin-progress-tab">
                          <h4>Progress Updates</h4>
                          {loadingMessages ? (
                            <p className="task-admin-loading-message">
                              Loading...
                            </p>
                          ) : selectedTask.messages.filter(
                              (m) => m.type === "Progress"
                            ).length > 0 ? (
                            <div className="task-admin-messages">
                              {selectedTask.messages
                                .filter((m) => m.type === "Progress")
                                .map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={`task-admin-message ${
                                      String(msg.sender) ===
                                      String(userContext?.employeeId)
                                        ? "task-admin-sent"
                                        : "task-admin-received"
                                    }`}
                                  >
                                    <div className="task-admin-message-content">
                                      {msg.text}
                                    </div>
                                    <div className="task-admin-message-meta">
                                      <span>{displayDate(msg.time)}</span>
                                      {/* <span>{msg.senderName}</span> */}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="task-admin-no-msg">
                              No progress updates yet.
                            </p>
                          )}
                          <form
                            className="task-admin-chat-input"
                            onSubmit={handleAddMessage}
                          >
                            <div className="task-admin-input-wrapper">
                              <input
                                type="text"
                                placeholder="Type or speak a progress note..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                disabled={loadingMessages}
                              />

                              <button
                                type="button"
                                className="task-admin-mic-btn"
                                onClick={toggleListening}
                                title={
                                  listening
                                    ? "Stop Listening"
                                    : "Start Speaking"
                                }
                              >
                                {listening ? (
                                  <MdMicOff size={20} />
                                ) : (
                                  <MdMic size={20} />
                                )}
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
                        <div className="task-admin-clarification-tab">
                          <h4>Clarification</h4>
                          {loadingMessages ? (
                            <p className="task-admin-loading-message">
                              Loading...
                            </p>
                          ) : selectedTask.messages.filter(
                              (m) => m.type === "Clarification"
                            ).length > 0 ? (
                            <div className="task-admin-messages">
                              {selectedTask.messages
                                .filter((m) => m.type === "Clarification")
                                .map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={`task-admin-message ${
                                      String(msg.sender) ===
                                      String(userContext?.employeeId)
                                        ? "task-admin-sent"
                                        : "task-admin-received"
                                    }`}
                                  >
                                    <div className="task-admin-message-content">
                                      {msg.text}
                                    </div>
                                    <div className="task-admin-message-meta">
                                      <span>{displayDate(msg.time)}</span>
                                      {/* <span>{msg.senderName}</span> */}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="task-admin-no-msg">
                              No clarifications yet.
                            </p>
                          )}
                          <form
                            className="task-admin-chat-input"
                            onSubmit={handleAddMessage}
                          >
                            <div className="task-admin-input-wrapper">
                              <input
                                type="text"
                                placeholder="Type or speak a progress note..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                disabled={loadingMessages}
                              />

                              <button
                                type="button"
                                className="task-admin-mic-btn"
                                onClick={toggleListening}
                                title={
                                  listening
                                    ? "Stop Listening"
                                    : "Start Speaking"
                                }
                              >
                                {listening ? (
                                  <MdMicOff size={20} />
                                ) : (
                                  <MdMic size={20} />
                                )}
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

            {showAssignForm && (
              <div
                className="task-admin-details-backdrop"
                onClick={closeAssignForm}
              >
                <div
                  className="task-admin-details assign-task-admin-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="task-admin-details-header">
                    <h3>Assign New Task</h3>
                    <button
                      className="task-admin-close-btn"
                      onClick={closeAssignForm}
                    >
                      X
                    </button>
                  </div>
                  <form className="assign-form" onSubmit={handleFormSubmit}>
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label>Task Name</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label>Task Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          rows={4}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label>Assigned To</label>
                        <select
                          name="employeeId"
                          value={formData.employeeId}
                          onChange={handleFormChange}
                          required
                          disabled={loadingEmployees}
                        >
                          <option value="">
                            {loadingEmployees
                              ? "Loading..."
                              : "Select Employee"}
                          </option>
                          {employees.map((emp) => (
                            <option
                              key={emp.employee_id}
                              value={emp.employee_id}
                            >
                              {emp.employee_name} ({emp.employee_id})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                     <div className="form-group half-width">
  <label>Start Date</label>
  <DatePicker
    selected={formData.startDate}
    onChange={(d) => handleDateChange(d, "startDate")}
    dateFormat="dd/MM/yyyy"
    placeholderText="dd/mm/yyyy"
    className="date-picker"
    required
  />
</div>
                      <div className="form-group half-width">
  <label>End Date</label>
  <DatePicker
    selected={formData.endDate}
    onChange={(d) => handleDateChange(d, "endDate")}
    dateFormat="dd/MM/yyyy"
    placeholderText="dd/mm/yyyy"
    className="date-picker"
  />
</div>
                    </div>
                    <div className="form-row">
                      <div className="form-group half-width">
                        <label>Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="Yet to Start">Yet to Start</option>
                          <option value="In Progress">In Progress</option>
                          <option value="On-Hold">On-Hold</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <div className="form-group half-width">
                        <label>Progress (%)</label>
                        <input
                          type="number"
                          name="percentage"
                          value={formData.percentage}
                          onChange={handleFormChange}
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="submit-btn-task-admin"
                        disabled={loadingEmployees || loadingTasks}
                      >
                        Assign Task
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {mainTab === "Weekly Tasks" && <SupervisorPlanViewerAdmin />}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default TaskManagementAdmin;
