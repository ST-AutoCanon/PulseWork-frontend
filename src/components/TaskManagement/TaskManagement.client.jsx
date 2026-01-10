// "use client";

// import React, {
//   useMemo,
//   useState,
//   useEffect,
//   useCallback,
//   useRef,
// } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import axios from "axios";
// import "./TaskManagement.css";
// import SupervisorPlanViewer from "../SupervisorPlanViewer/SupervisorPlanViewer.client";
// import Modal from "../Modal/Modal.client";
// import { useAuth } from "../../context/AuthProvider.client";

// const getProgressColor = (p) => {
//   if (p < 40) return "#ef4444";
//   if (p < 70) return "#f59e0b";
//   return "#10b981";
// };

// const parseDate = (dateStr) => {
//   if (!dateStr) return "";
//   const d = new Date(dateStr);
//   return isNaN(d.getTime())
//     ? ""
//     : d.toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//       });
// };

// const formatDate = (date) => {
//   if (!date) return "";
//   const d =
//     date instanceof Date && !isNaN(date.getTime()) ? date : new Date(date);
//   if (isNaN(d.getTime())) return "";
//   const day = String(d.getDate()).padStart(2, "0");
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   return `${d.getFullYear()}-${month}-${day}`;
// };

// const displayDate = (date) => parseDate(date);

// const TaskManagement = () => {
//   const { user, hydrated } = useAuth();
//   const [userContext, setUserContext] = useState(null);

//   useEffect(() => {
//     if (!hydrated || !user) {
//       setUserContext(null);
//       return;
//     }
//     setUserContext({
//       employeeId: String(user.employeeId),
//       role: String(user.role || "supervisor"),
//       orgId: user.orgId || null,
//     });
//   }, [user, hydrated]);

//   const [selectedTaskId, setSelectedTaskId] = useState(null);
//   const [messageText, setMessageText] = useState("");
//   const [showAssignForm, setShowAssignForm] = useState(false);
//   const [activeTab, setActiveTab] = useState("Progress");
//   const [mainTab, setMainTab] = useState("Task Board");

//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     employeeId: "",
//     startDate: null,
//     endDate: null,
//     status: "Yet to Start",
//     percentage: 0,
//   });

//   const [employees, setEmployees] = useState([]);
//   const [tasks, setTasks] = useState([]);
//   const [loadingEmployees, setLoadingEmployees] = useState(false);
//   const [loadingTasks, setLoadingTasks] = useState(false);
//   const [loadingMessages, setLoadingMessages] = useState(false);
//   const [error, setError] = useState(null);
//   const [editingProgress, setEditingProgress] = useState(false);
//   const [tempProgress, setTempProgress] = useState(0);
//   const [tempStatus, setTempStatus] = useState("");
//   const [alertModal, setAlertModal] = useState({
//     isVisible: false,
//     title: "",
//     message: "",
//   });

//   const abortControllerRef = useRef(null);

//   const getHeaders = useCallback(
//     () => ({
//       "x-employee-id": userContext?.employeeId || "",
//       "x-role": (userContext?.role || "supervisor").toLowerCase(),
//       "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
//       ...(userContext?.orgId && { "x-org-id": userContext.orgId }),
//     }),
//     [userContext]
//   );

//   useEffect(() => {
//     if (!userContext) return;
//     const fetch = async () => {
//       setLoadingEmployees(true);
//       try {
//         const res = await axios.get(
//           `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/supervisor/employees`,
//           { withCredentials: true, headers: getHeaders() }
//         );
//         setEmployees(res.data.employees || []);
//         setError(null);
//       } catch (e) {
//         setError(e.response?.data?.error || "Failed to load employees");
//         setEmployees([]);
//       } finally {
//         setLoadingEmployees(false);
//       }
//     };
//     fetch();
//   }, [userContext, getHeaders]);

//   const fetchTasks = useCallback(async () => {
//     if (!userContext || employees.length === 0) return;
//     setLoadingTasks(true);
//     try {
//       const res = await axios.get(
//         `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks`,
//         { withCredentials: true, headers: getHeaders() }
//       );

//       const validEmpIds = new Set(employees.map((e) => e.employee_id));
//       const formatted = (res.data || [])
//         .filter((t) => validEmpIds.has(t.employee_id))
//         .map((t) => {
//           const emp = employees.find((e) => e.employee_id === t.employee_id);
//           const prog = Number(t.percentage ?? 0);
//           const safeProg = isNaN(prog) ? 0 : Math.min(Math.max(prog, 0), 100);

//           return {
//             id: `Task-${t.task_id}`,
//             dbId: t.task_id,
//             title: t.task_title,
//             description: t.description,
//             status: t.status,
//             startDate: formatDate(t.start_date),
//             endDate: formatDate(t.due_date),
//             employeeId: t.employee_id,
//             user: { name: emp?.employee_name || "Unknown", profile: "" },
//             progress: safeProg,
//             messages: [],
//           };
//         });
//       setTasks(formatted);
//       setError(null);
//     } catch (e) {
//       setError(e.response?.data?.error || e.message || "Failed to load tasks");
//       setTasks([]);
//     } finally {
//       setLoadingTasks(false);
//     }
//   }, [userContext, employees, getHeaders]);

//   useEffect(() => {
//     fetchTasks();
//   }, [fetchTasks]);

//   const getSenderName = useCallback(
//     (sender) => {
//       if (sender === "Supervisor") return "You";
//       const emp = employees.find(
//         (e) => String(e.employee_id) === String(sender)
//       );
//       return emp ? emp.employee_name : "Unknown";
//     },
//     [employees]
//   );

//   const fetchMessages = useCallback(
//     async (taskDbId) => {
//       if (!taskDbId) return;

//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//       const controller = new AbortController();
//       abortControllerRef.current = controller;

//       setLoadingMessages(true);

//       try {
//         const res = await axios.get(
//           `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/${taskDbId}`,
//           {
//             withCredentials: true,
//             headers: getHeaders(),
//             signal: controller.signal,
//           }
//         );

//         let all = [];
//         if (res.data.success) {
//           const { progressMessages = [], clarificationMessages = [] } =
//             res.data;
//           all = [
//             ...progressMessages.map((m) => ({
//               ...m,
//               senderName: getSenderName(m.sender),
//               type: "Progress",
//             })),
//             ...clarificationMessages.map((m) => ({
//               ...m,
//               senderName: getSenderName(m.sender),
//               type: "Clarification",
//             })),
//           ].sort((a, b) => new Date(a.time) - new Date(b.time));
//         }

//         setTasks((prev) =>
//           prev.map((t) => (t.dbId === taskDbId ? { ...t, messages: all } : t))
//         );
//       } catch (e) {
//         if (e.name !== "CanceledError") {
//           setTasks((prev) =>
//             prev.map((t) => (t.dbId === taskDbId ? { ...t, messages: [] } : t))
//           );
//         }
//       } finally {
//         setLoadingMessages(false);
//       }
//     },
//     [getHeaders, getSenderName]
//   );

//   useEffect(() => {
//     if (!selectedTaskId || !userContext || employees.length === 0) {
//       setLoadingMessages(false);
//       return;
//     }

//     const task = tasks.find((t) => t.id === selectedTaskId);
//     if (!task?.dbId) return;

//     fetchMessages(task.dbId);

//     return () => {
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//     };
//   }, [selectedTaskId, userContext, employees, fetchMessages]);

//   useEffect(() => {
//     if (!selectedTaskId || !userContext || employees.length === 0) {
//       setLoadingMessages(false);
//       return;
//     }

//     const task = tasks.find((t) => t.id === selectedTaskId);
//     if (!task?.dbId) return;

//     fetchMessages(task.dbId);

//     return () => {
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//     };
//   }, [selectedTaskId, userContext, employees, fetchMessages]);

//   const columns = useMemo(
//     () => [
//       { key: "Yet to Start", title: "Yet to Start", color: "#7c7d1e" },
//       { key: "In Progress", title: "In Progress", color: "#1d4ed8" },
//       { key: "On-Hold", title: "On-Hold", color: "#9d174d" },
//       { key: "Completed", title: "Completed", color: "#065f46" },
//     ],
//     []
//   );

//   const selectedTask = useMemo(
//     () => tasks.find((t) => t.id === selectedTaskId) || null,
//     [tasks, selectedTaskId]
//   );

//   const currentDate = new Date();

//   const openDetails = (id) => setSelectedTaskId(id);
//   const closeDetails = () => {
//     setSelectedTaskId(null);
//     setMessageText("");
//     setActiveTab("Progress");
//     setEditingProgress(false);
//     setTempProgress(0);
//     setTempStatus("");
//   };

//   const startEditingProgress = () => {
//     if (selectedTask) {
//       setTempProgress(selectedTask.progress);
//       setTempStatus(selectedTask.status);
//       setEditingProgress(true);
//     }
//   };

//   const handleSliderChange = (e) => {
//     setTempProgress(parseInt(e.target.value, 10));
//   };

//   const handleStatusChange = (e) => {
//     setTempStatus(e.target.value);
//   };

//   const saveProgress = async () => {
//     if (!selectedTask || !userContext) return;
//     const taskId = selectedTask.dbId;

//     try {
//       setTasks((prev) =>
//         prev.map((t) =>
//           t.id === selectedTask.id
//             ? { ...t, status: tempStatus, progress: tempProgress }
//             : t
//         )
//       );

//       await axios.put(
//         `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/employee-tasks/update/${taskId}`,
//         {
//           status: tempStatus,
//           percentage: tempProgress,
//           progress_percentage: tempProgress,
//         },
//         { withCredentials: true, headers: getHeaders() }
//       );

//       await fetchTasks();
//       setAlertModal({ isVisible: true, message: "Task updated successfully" });
//     } catch (e) {
//       setError(e.response?.data?.error || e.message || "Failed to update task");
//       setTasks((prev) =>
//         prev.map((t) =>
//           t.id === selectedTask.id
//             ? {
//                 ...t,
//                 status: selectedTask.status,
//                 progress: selectedTask.progress,
//               }
//             : t
//         )
//       );
//     } finally {
//       setEditingProgress(false);
//     }
//   };

//   const cancelEditing = () => {
//     setEditingProgress(false);
//     setTempProgress(selectedTask?.progress ?? 0);
//     setTempStatus(selectedTask?.status ?? "");
//   };

//   const handleAddMessage = async (e) => {
//     e.preventDefault();
//     const text = messageText.trim();
//     if (!text || !selectedTask || !userContext) return;

//     const taskId = selectedTask.dbId;
//     const newMsg = {
//       text,
//       time: new Date().toISOString(),
//       sender: "Supervisor",
//       senderName: "You",
//       type: activeTab,
//     };

//     setTasks((prev) =>
//       prev.map((t) =>
//         t.id === selectedTask.id
//           ? {
//               ...t,
//               messages: [...t.messages, newMsg].sort(
//                 (a, b) =>
//                   new Date(a.time).getTime() - new Date(b.time).getTime()
//               ),
//             }
//           : t
//       )
//     );

//     try {
//       await axios.post(
//         `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages`,
//         { taskId, sender: "Supervisor", type: activeTab, text },
//         { withCredentials: true, headers: getHeaders() }
//       );
//       setMessageText("");
//       fetchMessages(taskId);
//     } catch (e) {
//       setError(
//         e.response?.data?.error || e.message || "Failed to send message"
//       );
//       setTasks((prev) =>
//         prev.map((t) =>
//           t.id === selectedTask.id
//             ? {
//                 ...t,
//                 messages: t.messages.filter((m) => m.time !== newMsg.time),
//               }
//             : t
//         )
//       );
//     }
//   };

//   const openAssignForm = () => setShowAssignForm(true);
//   const closeAssignForm = () => {
//     setShowAssignForm(false);
//     setFormData({
//       title: "",
//       description: "",
//       employeeId: "",
//       startDate: null,
//       endDate: null,
//       status: "Yet to Start",
//       percentage: 0,
//     });
//   };

//   const handleFormChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleDateChange = (date, name) => {
//     setFormData((prev) => ({ ...prev, [name]: date }));
//   };

//   const handleFormSubmit = async (e) => {
//     e.preventDefault();
//     const {
//       title,
//       description,
//       employeeId,
//       startDate,
//       endDate,
//       status,
//       percentage,
//     } = formData;
//     if (!title || !employeeId || !startDate || !endDate) {
//       setError("All required fields must be filled.");
//       return;
//     }
//     if (!userContext) return;

//     try {
//       const emp = employees.find((e) => e.employee_id === employeeId);
//       if (!emp) throw new Error("Employee not under your supervision");

//       const payload = {
//         employee_id: employeeId,
//         task_title: title,
//         description,
//         start_date: formatDate(startDate),
//         due_date: formatDate(endDate),
//         status,
//         percentage,
//       };

//       const postRes = await axios.post(
//         `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks`,
//         payload,
//         { withCredentials: true, headers: getHeaders() }
//       );

//       const createdTaskId = postRes.data.task_id;
//       const newId =
//         tasks.length > 0
//           ? `Task-${
//               Math.max(...tasks.map((t) => parseInt(t.id.split("-")[1]))) + 1
//             }`
//           : "Task-1";

//       setTasks((prev) => [
//         ...prev,
//         {
//           id: newId,
//           dbId: createdTaskId,
//           title,
//           description,
//           status,
//           startDate: formatDate(startDate),
//           endDate: formatDate(endDate),
//           employeeId,
//           user: { name: emp.employee_name, profile: "" },
//           progress: percentage,
//           messages: [],
//         },
//       ]);

//       setAlertModal({ isVisible: true, message: "Task assigned successfully" });
//       closeAssignForm();
//     } catch (e) {
//       setError(e.response?.data?.error || e.message || "Failed to assign task");
//     }
//   };

//   const closeAlert = () =>
//     setAlertModal({ isVisible: false, title: "", message: "" });

//   if (!hydrated) return <div className="task-board-container">Loading...</div>;
//   if (!user)
//     return (
//       <div className="task-board-container">
//         <div className="task-error-message">
//           Please <a href="/login">log in</a>.
//         </div>
//       </div>
//     );

//   return (
//     <div className="task-board-container">
//       <div className="task-sections">
//         <button
//           className={`task-section-btn ${
//             mainTab === "Task Board" ? "task-active" : ""
//           }`}
//           onClick={() => setMainTab("Task Board")}
//         >
//           Supervisor Driven
//         </button>
//         <button
//           className={`task-section-btn ${
//             mainTab === "Weekly Tasks" ? "task-active" : ""
//           }`}
//           onClick={() => setMainTab("Weekly Tasks")}
//         >
//           Employee Driven
//         </button>
//       </div>

//       {mainTab === "Task Board" && (
//         <>
//           <div className="task-board-subheader">
//             <button className="assign-task-btn" onClick={openAssignForm}>
//               Assign Task
//             </button>
//           </div>

//           {error && <div className="task-error-message">{error}</div>}
//           {loadingTasks && (
//             <div className="task-loading-message">Loading tasks...</div>
//           )}
//           {!loadingTasks && tasks.length === 0 && !error && (
//             <div className="task-no-tasks">
//               No tasks available for your employees
//             </div>
//           )}

//           <div className="task-board">
//             {columns.map((col) => {
//               const colTasks = tasks
//                 .filter((t) => t.status === col.key)
//                 .sort((a, b) => {
//                   if (col.key === "Yet to Start")
//                     return (
//                       new Date(b.endDate || 0).getTime() -
//                       new Date(a.endDate || 0).getTime()
//                     );
//                   return (
//                     new Date(a.endDate || 0).getTime() -
//                     new Date(b.endDate || 0).getTime()
//                   );
//                 });

//               return (
//                 <div className="task-column" key={col.key}>
//                   <div
//                     className="task-column-header"
//                     style={{ backgroundColor: col.color }}
//                   >
//                     <span>{col.title}</span>
//                   </div>
//                   <div className="task-list">
//                     {colTasks.length === 0 && !loadingTasks && !error ? (
//                       <div className="task-no-tasks">
//                         No {col.title.toLowerCase()} tasks
//                       </div>
//                     ) : (
//                       colTasks.map((task) => {
//                         const overdue =
//                           task.status !== "Completed" &&
//                           new Date(task.endDate) < currentDate;
//                         const ring = overdue
//                           ? "#ef4444"
//                           : getProgressColor(task.progress);
//                         return (
//                           <div
//                             className="task-card"
//                             key={task.id}
//                             onClick={() => openDetails(task.id)}
//                           >
//                             <div className="task-header">
//                               <div className="task-title-group">
//                                 <div className="task-title">{task.title}</div>
//                                 <div className="task-employee-name">
//                                   {task.user.name}
//                                 </div>
//                                 <div className="task-employee-id">
//                                   EMP-ID: {task.employeeId}
//                                 </div>
//                                 <div className="task-id-chip">{task.id}</div>
//                               </div>
//                               <div
//                                 className="task-progress-wrapper"
//                                 title={`${task.progress}%`}
//                               >
//                                 <svg
//                                   viewBox="0 0 36 36"
//                                   className="task-progress-ring"
//                                 >
//                                   <path
//                                     className="task-circle-bg"
//                                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
//                                     stroke="#e5e7eb"
//                                     strokeWidth="3"
//                                     fill="none"
//                                   />
//                                   <path
//                                     className="task-circle"
//                                     strokeDasharray="100"
//                                     strokeDashoffset={100 - task.progress}
//                                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
//                                     stroke={ring}
//                                     strokeWidth="3"
//                                     fill="none"
//                                     strokeLinecap="round"
//                                   />
//                                   <text
//                                     x="18"
//                                     y="20.35"
//                                     className="task-percentage"
//                                     textAnchor="middle"
//                                     fill="#111827"
//                                     fontSize="10px"
//                                   >
//                                     {task.progress}%
//                                   </text>
//                                 </svg>
//                               </div>
//                             </div>
//                             <div className="task-dates">
//                               <div className="task-date-group">
//                                 <span className="task-date-label">Start</span>
//                                 <span className="task-date-pill task-start">
//                                   {displayDate(task.startDate)}
//                                 </span>
//                               </div>
//                               <span className="task-arrow">→</span>
//                               <div className="task-date-group">
//                                 <span className="task-date-label">End</span>
//                                 <span
//                                   className={`task-date-pill task-end ${
//                                     overdue ? "task-overdue" : ""
//                                   }`}
//                                 >
//                                   {displayDate(task.endDate)}
//                                 </span>
//                               </div>
//                             </div>
//                             <div className="task-footer">
//                               <div className="task-spacer" />
//                               <div
//                                 className="task-msg-wrap"
//                                 title="Open messages"
//                               >
//                                 <span
//                                   className="task-message-icon"
//                                   role="img"
//                                   aria-label="messages"
//                                 >
//                                   💬
//                                 </span>
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })
//                     )}
//                   </div>
//                 </div>
//               );
//             })}

//             {selectedTask && (
//               <div className="task-details-backdrop" onClick={closeDetails}>
//                 <div
//                   className="task-details"
//                   onClick={(e) => e.stopPropagation()}
//                 >
//                   <div className="task-details-header">
//                     <div className="task-details-title">
//                       <div className="task-pill">{selectedTask.id}</div>
//                       <h3>{selectedTask.title}</h3>
//                     </div>
//                     <button
//                       className="task-close-btn"
//                       onClick={closeDetails}
//                       aria-label="Close"
//                     >
//                       X
//                     </button>
//                   </div>

//                   <div className="task-details-meta">
//                     <div className="task-meta-row">
//                       <div className="task-status-line">
//                         <span className="task-label">Status:</span>
//                         <span className="task-value">
//                           {selectedTask.status}
//                         </span>
//                       </div>
//                       <div className="task-progress-wrapper">
//                         <svg viewBox="0 0 36 36" className="task-progress-ring">
//                           <path
//                             className="task-circle-bg"
//                             d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
//                             stroke="#e5e7eb"
//                             strokeWidth="3"
//                             fill="none"
//                           />
//                           <path
//                             className="task-circle"
//                             strokeDasharray="100"
//                             strokeDashoffset={100 - selectedTask.progress}
//                             d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
//                             stroke={
//                               selectedTask.status !== "Completed" &&
//                               new Date(selectedTask.endDate) < currentDate
//                                 ? "#ef4444"
//                                 : getProgressColor(selectedTask.progress)
//                             }
//                             strokeWidth="3"
//                             fill="none"
//                             strokeLinecap="round"
//                           />
//                           <text
//                             x="18"
//                             y="20.35"
//                             className="task-percentage"
//                             textAnchor="middle"
//                             fill="#111827"
//                             fontSize="10px"
//                           >
//                             {selectedTask.progress}%
//                           </text>
//                         </svg>
//                       </div>
//                       {!editingProgress && (
//                         <button
//                           className="task-edit-progress-btn"
//                           onClick={startEditingProgress}
//                           title="Edit Progress"
//                         >
//                           Edit
//                         </button>
//                       )}
//                     </div>

//                     {editingProgress && (
//                       <div className="task-progress-editor">
//                         <div className="task-slider-container">
//                           <label htmlFor="progress-slider">Progress</label>
//                           <input
//                             id="progress-slider"
//                             type="range"
//                             min="0"
//                             max="100"
//                             value={tempProgress}
//                             onChange={handleSliderChange}
//                             className="task-progress-slider"
//                           />
//                           <span className="task-slider-value">
//                             {tempProgress}%
//                           </span>
//                         </div>
//                         <div className="task-status-container">
//                           <label htmlFor="status-select">Status</label>
//                           <select
//                             id="status-select"
//                             value={tempStatus}
//                             onChange={handleStatusChange}
//                             className="task-status-select"
//                           >
//                             <option value="Yet to Start">Yet to Start</option>
//                             <option value="In Progress">In Progress</option>
//                             <option value="On-Hold">On-Hold</option>
//                             <option value="Completed">Completed</option>
//                           </select>
//                         </div>
//                         <div className="task-editor-actions">
//                           <button
//                             onClick={saveProgress}
//                             className="task-save-btn"
//                           >
//                             Update Progress
//                           </button>
//                           <button
//                             onClick={cancelEditing}
//                             className="task-cancel-btn"
//                           >
//                             Cancel
//                           </button>
//                         </div>
//                       </div>
//                     )}

//                     <div className="task-dates-row">
//                       <span className="task-date-pill task-start">
//                         Start: {displayDate(selectedTask.startDate)}
//                       </span>
//                       <span className="task-arrow">→</span>
//                       <span
//                         className={`task-date-pill task-end ${
//                           selectedTask.status !== "Completed" &&
//                           new Date(selectedTask.endDate) < currentDate
//                             ? "task-overdue"
//                             : ""
//                         }`}
//                       >
//                         End: {displayDate(selectedTask.endDate)}
//                       </span>
//                     </div>

//                     <div className="task-description">
//                       <h4>Description</h4>
//                       <p>
//                         {selectedTask.description
//                           .split("\n")
//                           .map((line, idx) => (
//                             <span key={idx}>
//                               {line.startsWith("- ")
//                                 ? `• ${line.slice(2)}`
//                                 : line}
//                               <br />
//                             </span>
//                           ))}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="task-tabs">
//                     <div className="task-tab-header">
//                       <button
//                         className={`task-tab-btn ${
//                           activeTab === "Progress" ? "task-active" : ""
//                         }`}
//                         onClick={() => setActiveTab("Progress")}
//                       >
//                         Progress
//                       </button>
//                       <button
//                         className={`task-tab-btn ${
//                           activeTab === "Clarification" ? "task-active" : ""
//                         }`}
//                         onClick={() => setActiveTab("Clarification")}
//                       >
//                         Clarification
//                       </button>
//                     </div>

//                     <div className="task-tab-content">
//                       {activeTab === "Progress" && (
//                         <div className="task-progress-tab">
//                           <h4>Progress Updates</h4>
//                           {loadingMessages ? (
//                             <p className="task-loading-message">Loading…</p>
//                           ) : selectedTask.messages.filter(
//                               (m) => m.type === "Progress"
//                             ).length === 0 ? (
//                             <p className="task-no-msg">
//                               No progress updates yet.
//                             </p>
//                           ) : (
//                             <div className="task-messages">
//                               {selectedTask.messages
//                                 .filter((m) => m.type === "Progress")
//                                 .map((msg, idx) => (
//                                   <div
//                                     key={idx}
//                                     className={`task-message ${
//                                       msg.sender === "Supervisor"
//                                         ? "task-sent"
//                                         : "task-received"
//                                     }`}
//                                   >
//                                     <div className="task-message-content">
//                                       {msg.text}
//                                     </div>
//                                     <div className="task-message-meta">
//                                       <span>{displayDate(msg.time)}</span>
//                                       <span>{msg.senderName}</span>
//                                     </div>
//                                   </div>
//                                 ))}
//                             </div>
//                           )}
//                           <form
//                             className="task-chat-input"
//                             onSubmit={handleAddMessage}
//                           >
//                             <input
//                               type="text"
//                               placeholder="Type a progress note..."
//                               value={messageText}
//                               onChange={(e) => setMessageText(e.target.value)}
//                               disabled={loadingMessages}
//                             />
//                             <button
//                               type="submit"
//                               disabled={loadingMessages || !messageText.trim()}
//                             >
//                               Send
//                             </button>
//                           </form>
//                         </div>
//                       )}

//                       {activeTab === "Clarification" && (
//                         <div className="task-clarification-tab">
//                           <h4>Clarification</h4>
//                           {loadingMessages ? (
//                             <p className="task-loading-message">Loading…</p>
//                           ) : selectedTask.messages.filter(
//                               (m) => m.type === "Clarification"
//                             ).length === 0 ? (
//                             <p className="task-no-msg">
//                               No clarifications yet.
//                             </p>
//                           ) : (
//                             <div className="task-messages">
//                               {selectedTask.messages
//                                 .filter((m) => m.type === "Clarification")
//                                 .map((msg, idx) => (
//                                   <div
//                                     key={idx}
//                                     className={`task-message ${
//                                       msg.sender === "Supervisor"
//                                         ? "task-sent"
//                                         : "task-received"
//                                     }`}
//                                   >
//                                     <div className="task-message-content">
//                                       {msg.text}
//                                     </div>
//                                     <div className="task-message-meta">
//                                       <span>{displayDate(msg.time)}</span>
//                                       <span>{msg.senderName}</span>
//                                     </div>
//                                   </div>
//                                 ))}
//                             </div>
//                           )}
//                           <form
//                             className="task-chat-input"
//                             onSubmit={handleAddMessage}
//                           >
//                             <input
//                               type="text"
//                               placeholder="Ask a question..."
//                               value={messageText}
//                               onChange={(e) => setMessageText(e.target.value)}
//                               disabled={loadingMessages}
//                             />
//                             <button
//                               type="submit"
//                               disabled={loadingMessages || !messageText.trim()}
//                             >
//                               Send
//                             </button>
//                           </form>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {showAssignForm && (
//               <div className="task-details-backdrop" onClick={closeAssignForm}>
//                 <div
//                   className="task-details assign-task-modal"
//                   onClick={(e) => e.stopPropagation()}
//                 >
//                   <div className="task-details-header">
//                     <h3>Assign New Task</h3>
//                     <button
//                       className="task-close-btn"
//                       onClick={closeAssignForm}
//                     >
//                       X
//                     </button>
//                   </div>
//                   <form className="assign-form" onSubmit={handleFormSubmit}>
//                     <div className="form-row">
//                       <div className="form-group full-width">
//                         <label>Task Name</label>
//                         <input
//                           type="text"
//                           name="title"
//                           value={formData.title}
//                           onChange={handleFormChange}
//                           required
//                         />
//                       </div>
//                     </div>
//                     <div className="form-row">
//                       <div className="form-group full-width">
//                         <label>Description</label>
//                         <textarea
//                           name="description"
//                           value={formData.description}
//                           onChange={handleFormChange}
//                           rows={4}
//                           required
//                         />
//                       </div>
//                     </div>
//                     <div className="form-row">
//                       <div className="form-group full-width">
//                         <label>Assigned To</label>
//                         <select
//                           name="employeeId"
//                           value={formData.employeeId}
//                           onChange={handleFormChange}
//                           required
//                           disabled={loadingEmployees}
//                         >
//                           <option value="">
//                             {loadingEmployees
//                               ? "Loading..."
//                               : "Select Employee"}
//                           </option>
//                           {employees.map((e) => (
//                             <option key={e.employee_id} value={e.employee_id}>
//                               {e.employee_name} ({e.employee_id})
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                     </div>
//                     <div className="form-row">
//                       <div className="form-group half-width">
//                         <label>Start Date</label>
//                         <DatePicker
//                           selected={formData.startDate}
//                           onChange={(d) => handleDateChange(d, "startDate")}
//                           dateFormat="dd-MM-yyyy"
//                           className="date-picker"
//                           required
//                         />
//                       </div>
//                       <div className="form-group half-width">
//                         <label>End Date</label>
//                         <DatePicker
//                           selected={formData.endDate}
//                           onChange={(d) => handleDateChange(d, "endDate")}
//                           dateFormat="dd-MM-yyyy"
//                           className="date-picker"
//                           required
//                         />
//                       </div>
//                     </div>
//                     <div className="form-row">
//                       <div className="form-group half-width">
//                         <label>Status</label>
//                         <select
//                           name="status"
//                           value={formData.status}
//                           onChange={handleFormChange}
//                         >
//                           <option value="Yet to Start">Yet to Start</option>
//                           <option value="In Progress">In Progress</option>
//                           <option value="On-Hold">On-Hold</option>
//                           <option value="Completed">Completed</option>
//                         </select>
//                       </div>
//                       <div className="form-group half-width">
//                         <label>Progress (%)</label>
//                         <input
//                           type="number"
//                           name="percentage"
//                           value={formData.percentage}
//                           onChange={handleFormChange}
//                           min="0"
//                           max="100"
//                         />
//                       </div>
//                     </div>
//                     <div className="form-actions">
//                       <button
//                         type="submit"
//                         className="submit-btn-task"
//                         disabled={loadingEmployees || loadingTasks}
//                       >
//                         Assign Task
//                       </button>
//                     </div>
//                   </form>
//                 </div>
//               </div>
//             )}
//           </div>
//         </>
//       )}

//       {mainTab === "Weekly Tasks" && <SupervisorPlanViewer />}

//       <Modal
//         isVisible={alertModal.isVisible}
//         onClose={closeAlert}
//         buttons={[{ label: "OK", onClick: closeAlert }]}
//       >
//         <p>{alertModal.message}</p>
//       </Modal>
//     </div>
//   );
// };

// export default TaskManagement;


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
import "./TaskManagement.css";
import SupervisorPlanViewer from "../SupervisorPlanViewer/SupervisorPlanViewer.client";
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
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", {
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
  return `${d.getFullYear()}-${month}-${day}`;
};
const displayDate = (date) => parseDate(date);

const TaskManagement = () => {
  const { user, hydrated } = useAuth();
  const [userContext, setUserContext] = useState(null);

  // Speech Recognition refs and state
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef(""); // Persists finalized text across restarts
  const [listening, setListening] = useState(false);
  const [messageText, setMessageText] = useState(""); // Final + interim

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
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!hydrated || !user) {
      setUserContext(null);
      return;
    }
    setUserContext({
      employeeId: String(user.employeeId),
      role: String(user.role || "supervisor"),
      orgId: user.orgId || null,
    });
  }, [user, hydrated]);

  // Speech Recognition Setup
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
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

  const getHeaders = useCallback(
    () => ({
      "x-employee-id": userContext?.employeeId || "",
      "x-role": (userContext?.role || "supervisor").toLowerCase(),
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
      ...(userContext?.orgId && { "x-org-id": userContext.orgId }),
    }),
    [userContext]
  );

  useEffect(() => {
    if (!userContext) return;
    const fetch = async () => {
      setLoadingEmployees(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/supervisor/employees`,
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

  const fetchTasks = useCallback(async () => {
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
          const prog = Number(t.percentage ?? 0);
          const safeProg = isNaN(prog) ? 0 : Math.min(Math.max(prog, 0), 100);
          return {
            id: `Task-${t.task_id}`,
            dbId: t.task_id,
            title: t.task_title,
            description: t.description,
            status: t.status,
            startDate: formatDate(t.start_date),
            endDate: formatDate(t.due_date),
            employeeId: t.employee_id,
            user: { name: emp?.employee_name || "Unknown", profile: "" },
            progress: safeProg,
            messages: [],
          };
        });
      setTasks(formatted);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, [userContext, employees, getHeaders]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getSenderName = useCallback(
    (sender) => {
      if (sender === "Supervisor") return "You";
      const emp = employees.find(
        (e) => String(e.employee_id) === String(sender)
      );
      return emp ? emp.employee_name : "Unknown";
    },
    [employees]
  );

  const fetchMessages = useCallback(
    async (taskDbId) => {
      if (!taskDbId) return;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setLoadingMessages(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/${taskDbId}`,
          {
            withCredentials: true,
            headers: getHeaders(),
            signal: controller.signal,
          }
        );
        let all = [];
        if (res.data.success) {
          const { progressMessages = [], clarificationMessages = [] } =
            res.data;
          all = [
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
          ].sort((a, b) => new Date(a.time) - new Date(b.time));
        }
        setTasks((prev) =>
          prev.map((t) => (t.dbId === taskDbId ? { ...t, messages: all } : t))
        );
      } catch (e) {
        if (e.name !== "CanceledError") {
          setTasks((prev) =>
            prev.map((t) => (t.dbId === taskDbId ? { ...t, messages: [] } : t))
          );
        }
      } finally {
        setLoadingMessages(false);
      }
    },
    [getHeaders, getSenderName]
  );

  useEffect(() => {
    if (!selectedTaskId || !userContext || employees.length === 0) {
      setLoadingMessages(false);
      return;
    }
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task?.dbId) return;
    fetchMessages(task.dbId);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedTaskId, userContext, employees, fetchMessages]);

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
    finalTranscriptRef.current = "";
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
        {
          status: tempStatus,
          percentage: tempProgress,
          progress_percentage: tempProgress,
        },
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
      sender: "Supervisor",
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
        { taskId, sender: "Supervisor", type: activeTab, text },
        { withCredentials: true, headers: getHeaders() }
      );

      // Clear input and speech buffer
      setMessageText("");
      finalTranscriptRef.current = "";

      fetchMessages(taskId);
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
    if (!userContext) return;
    try {
      const emp = employees.find((e) => e.employee_id === employeeId);
      if (!emp) throw new Error("Employee not under your supervision");
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
      const createdTaskId = postRes.data.task_id;
      const newId =
        tasks.length > 0
          ? `Task-${
              Math.max(...tasks.map((t) => parseInt(t.id.split("-")[1]))) + 1
            }`
          : "Task-1";
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

  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  if (!hydrated) return <div className="task-board-container">Loading...</div>;
  if (!user)
    return (
      <div className="task-board-container">
        <div className="task-error-message">
          Please <a href="/login">log in</a>.
        </div>
      </div>
    );

  return (
    <div className="task-board-container">
      <div className="task-sections">
        <button
          className={`task-section-btn ${
            mainTab === "Task Board" ? "task-active" : ""
          }`}
          onClick={() => setMainTab("Task Board")}
        >
          Supervisor Driven
        </button>
        <button
          className={`task-section-btn ${
            mainTab === "Weekly Tasks" ? "task-active" : ""
          }`}
          onClick={() => setMainTab("Weekly Tasks")}
        >
          Employee Driven
        </button>
      </div>

      {mainTab === "Task Board" && (
        <>
          <div className="task-board-subheader">
            <button className="assign-task-btn" onClick={openAssignForm}>
              Assign Task
            </button>
          </div>
          {error && <div className="task-error-message">{error}</div>}
          {loadingTasks && (
            <div className="task-loading-message">Loading tasks...</div>
          )}
          {!loadingTasks && tasks.length === 0 && !error && (
            <div className="task-no-tasks">
              No tasks available for your employees
            </div>
          )}

          <div className="task-board">
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
                <div className="task-column" key={col.key}>
                  <div
                    className="task-column-header"
                    style={{ backgroundColor: col.color }}
                  >
                    <span>{col.title}</span>
                  </div>
                  <div className="task-list">
                    {colTasks.length === 0 && !loadingTasks && !error ? (
                      <div className="task-no-tasks">
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
                            className="task-card"
                            key={task.id}
                            onClick={() => openDetails(task.id)}
                          >
                            <div className="task-header">
                              <div className="task-title-group">
                                <div className="task-title">{task.title}</div>
                                <div className="task-employee-name">
                                  {task.user.name}
                                </div>
                                <div className="task-employee-id">
                                  EMP-ID: {task.employeeId}
                                </div>
                                <div className="task-id-chip">{task.id}</div>
                              </div>
                              <div
                                className="task-progress-wrapper"
                                title={`${task.progress}%`}
                              >
                                <svg
                                  viewBox="0 0 36 36"
                                  className="task-progress-ring"
                                >
                                  <path
                                    className="task-circle-bg"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    stroke="#e5e7eb"
                                    strokeWidth="3"
                                    fill="none"
                                  />
                                  <path
                                    className="task-circle"
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
                                    className="task-percentage"
                                    textAnchor="middle"
                                    fill="#111827"
                                    fontSize="10px"
                                  >
                                    {task.progress}%
                                  </text>
                                </svg>
                              </div>
                            </div>
                            <div className="task-dates">
                              <div className="task-date-group">
                                <span className="task-date-label">Start</span>
                                <span className="task-date-pill task-start">
                                  {displayDate(task.startDate)}
                                </span>
                              </div>
                              <span className="task-arrow">→</span>
                              <div className="task-date-group">
                                <span className="task-date-label">End</span>
                                <span
                                  className={`task-date-pill task-end ${
                                    overdue ? "task-overdue" : ""
                                  }`}
                                >
                                  {displayDate(task.endDate)}
                                </span>
                              </div>
                            </div>
                            <div className="task-footer">
                              <div className="task-spacer" />
                              <div
                                className="task-msg-wrap"
                                title="Open messages"
                              >
                                <span
                                  className="task-message-icon"
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
              <div className="task-details-backdrop" onClick={closeDetails}>
                <div
                  className="task-details"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="task-details-header">
                    <div className="task-details-title">
                      <div className="task-pill">{selectedTask.id}</div>
                      <h3>{selectedTask.title}</h3>
                    </div>
                    <button
                      className="task-close-btn"
                      onClick={closeDetails}
                      aria-label="Close"
                    >
                      X
                    </button>
                  </div>

                  <div className="task-details-meta">
                    <div className="task-meta-row">
                      <div className="task-status-line">
                        <span className="task-label">Status:</span>
                        <span className="task-value">
                          {selectedTask.status}
                        </span>
                      </div>
                      <div className="task-progress-wrapper">
                        <svg viewBox="0 0 36 36" className="task-progress-ring">
                          <path
                            className="task-circle-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                            fill="none"
                          />
                          <path
                            className="task-circle"
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
                            className="task-percentage"
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
                          className="task-edit-progress-btn"
                          onClick={startEditingProgress}
                          title="Edit Progress"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {editingProgress && (
                      <div className="task-progress-editor">
                        <div className="task-slider-container">
                          <label htmlFor="progress-slider">Progress</label>
                          <input
                            id="progress-slider"
                            type="range"
                            min="0"
                            max="100"
                            value={tempProgress}
                            onChange={handleSliderChange}
                            className="task-progress-slider"
                          />
                          <span className="task-slider-value">
                            {tempProgress}%
                          </span>
                        </div>
                        <div className="task-status-container">
                          <label htmlFor="status-select">Status</label>
                          <select
                            id="status-select"
                            value={tempStatus}
                            onChange={handleStatusChange}
                            className="task-status-select"
                          >
                            <option value="Yet to Start">Yet to Start</option>
                            <option value="In Progress">In Progress</option>
                            <option value="On-Hold">On-Hold</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div className="task-editor-actions">
                          <button
                            onClick={saveProgress}
                            className="task-save-btn"
                          >
                            Update Progress
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="task-cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="task-dates-row">
                      <span className="task-date-pill task-start">
                        Start: {displayDate(selectedTask.startDate)}
                      </span>
                      <span className="task-arrow">→</span>
                      <span
                        className={`task-date-pill task-end ${
                          selectedTask.status !== "Completed" &&
                          new Date(selectedTask.endDate) < currentDate
                            ? "task-overdue"
                            : ""
                        }`}
                      >
                        End: {displayDate(selectedTask.endDate)}
                      </span>
                    </div>

                    <div className="task-description">
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

                  <div className="task-tabs">
                    <div className="task-tab-header">
                      <button
                        className={`task-tab-btn ${
                          activeTab === "Progress" ? "task-active" : ""
                        }`}
                        onClick={() => setActiveTab("Progress")}
                      >
                        Progress
                      </button>
                      <button
                        className={`task-tab-btn ${
                          activeTab === "Clarification" ? "task-active" : ""
                        }`}
                        onClick={() => setActiveTab("Clarification")}
                      >
                        Clarification
                      </button>
                    </div>

                    <div className="task-tab-content">
                      {activeTab === "Progress" && (
                        <div className="task-progress-tab">
                          <h4>Progress Updates</h4>
                          {loadingMessages ? (
                            <p className="task-loading-message">Loading…</p>
                          ) : selectedTask.messages.filter(
                              (m) => m.type === "Progress"
                            ).length === 0 ? (
                            <p className="task-no-msg">
                              No progress updates yet.
                            </p>
                          ) : (
                            <div className="task-messages">
                              {selectedTask.messages
                                .filter((m) => m.type === "Progress")
                                .map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={`task-message ${
                                      msg.sender === "Supervisor"
                                        ? "task-sent"
                                        : "task-received"
                                    }`}
                                  >
                                    <div className="task-message-content">
                                      {msg.text}
                                    </div>
                                    <div className="task-message-meta">
                                      <span>{displayDate(msg.time)}</span>
                                      <span>{msg.senderName}</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}

                          <form
                            className="task-chat-input"
                            onSubmit={handleAddMessage}
                          >
                            <div className="task-input-wrapper">
                              <input
                                type="text"
                                placeholder="Type or speak a progress note..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                disabled={loadingMessages}
                              />
                              <button
                                type="button"
                                className="task-mic-btn"
                                onClick={toggleListening}
                                title={
                                  listening ? "Stop Listening" : "Start Speaking"
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
                        <div className="task-clarification-tab">
                          <h4>Clarification</h4>
                          {loadingMessages ? (
                            <p className="task-loading-message">Loading…</p>
                          ) : selectedTask.messages.filter(
                              (m) => m.type === "Clarification"
                            ).length === 0 ? (
                            <p className="task-no-msg">
                              No clarifications yet.
                            </p>
                          ) : (
                            <div className="task-messages">
                              {selectedTask.messages
                                .filter((m) => m.type === "Clarification")
                                .map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={`task-message ${
                                      msg.sender === "Supervisor"
                                        ? "task-sent"
                                        : "task-received"
                                    }`}
                                  >
                                    <div className="task-message-content">
                                      {msg.text}
                                    </div>
                                    <div className="task-message-meta">
                                      <span>{displayDate(msg.time)}</span>
                                      <span>{msg.senderName}</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}

                          <form
                            className="task-chat-input"
                            onSubmit={handleAddMessage}
                          >
                            <div className="task-input-wrapper">
                              <input
                                type="text"
                                placeholder="Type or speak a clarification..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                disabled={loadingMessages}
                              />
                              <button
                                type="button"
                                className="task-mic-btn"
                                onClick={toggleListening}
                                title={
                                  listening ? "Stop Listening" : "Start Speaking"
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
              <div className="task-details-backdrop" onClick={closeAssignForm}>
                <div
                  className="task-details assign-task-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="task-details-header">
                    <h3>Assign New Task</h3>
                    <button
                      className="task-close-btn"
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
                        <label>Description</label>
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
                          {employees.map((e) => (
                            <option key={e.employee_id} value={e.employee_id}>
                              {e.employee_name} ({e.employee_id})
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
                          dateFormat="dd-MM-yyyy"
                          className="date-picker"
                          required
                        />
                      </div>
                      <div className="form-group half-width">
                        <label>End Date</label>
                        <DatePicker
                          selected={formData.endDate}
                          onChange={(d) => handleDateChange(d, "endDate")}
                          dateFormat="dd-MM-yyyy"
                          className="date-picker"
                          required
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
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="submit-btn-task"
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

      {mainTab === "Weekly Tasks" && <SupervisorPlanViewer />}

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

export default TaskManagement;