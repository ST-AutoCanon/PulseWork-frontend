

"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { MdMic, MdMicOff } from "react-icons/md";
import {
  getISOWeek,
  startOfISOWeek,
  endOfISOWeek,
  format,
  parseISO,
  addDays,
} from "date-fns";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";
import "./SupervisorPlanViewer.css";

const SupervisorPlanViewer = () => {
  const { user, hydrated } = useAuth();
  const [supervisorId, setSupervisorId] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [error, setError] = useState(null);
  const [openNodes, setOpenNodes] = useState({});
  const recognitionRef = useRef(null);
  const [listeningTaskId, setListeningTaskId] = useState(null);
  const [liveComments, setLiveComments] = useState({});
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const startListening = (taskId) => {
    if (!SpeechRecognition) {
      showAlert("Speech recognition is not supported in this browser.");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    setListeningTaskId(taskId);
    recognition.onresult = (event) => {
      let transcriptChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptChunk += event.results[i][0].transcript + " ";
        }
      }
      if (!transcriptChunk) return;
      setLiveComments((prev) => {
        const existing =
          prev[taskId] ||
          tasks.find((t) => t.task_id === taskId)?.sup_comment ||
          "";
        const updated = (existing + " " + transcriptChunk).trim();
        updateTaskField(taskId, "sup_comment", updated);
        return {
          ...prev,
          [taskId]: updated,
        };
      });
    };
    recognition.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "audio-capture") return;
      console.error("Speech error:", e);
    };
    recognition.onend = () => {
      if (recognitionRef.current && listeningTaskId === taskId) {
        try {
          recognition.start();
        } catch {}
      }
    };
    recognition.start();
  };

  const stopListening = () => {
    setListeningTaskId(null);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const reworkedParentIds = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (t.parent_task_id) {
        set.add(t.parent_task_id);
      }
    });
    return set;
  }, [tasks]);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    message: "",
  });
  const [freezeDays, setFreezeDays] = useState(3);
  const [pendingReviewChanges, setPendingReviewChanges] = useState({});

  useEffect(() => {
    if (!hydrated) return;
    if (user?.employeeId || user?.employee_id) {
      const id = String(user.employeeId || user.employee_id)
        .trim()
        .toUpperCase();
      setSupervisorId(id);
      const fetchedOrgId = user?.orgId ?? user?.org_id ?? null;
      setOrgId(fetchedOrgId);
    } else {
      setError("User not logged in or employeeId missing.");
    }
  }, [user, hydrated]);

  const apiHeaders = useMemo(() => {
    if (!supervisorId) return null;
    const headers = {
      "x-employee-id": supervisorId,
      "x-role": user?.role || "Supervisor",
    };
    if (orgId) {
      headers["x-org-id"] = orgId;
    }
    return headers;
  }, [supervisorId, user?.role, orgId]);

  useEffect(() => {
    if (!supervisorId || !apiHeaders) return;
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/supervisor/employees`,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        const empData = Array.isArray(response.data.employees)
          ? response.data.employees.map((emp) => ({
              ...emp,
              employee_id: emp.employee_id?.trim().toUpperCase(),
            }))
          : [];
        setEmployees(empData);
        setSelectedEmployee(empData[0]?.employee_id || null);
        setError(empData.length === 0 ? "No employees assigned to you." : null);
      } catch (err) {
        const errorMessage = err.response?.status
          ? `Error ${err.response.status}: ${
              err.response.data?.error || err.response.statusText
            }`
          : err.code === "ECONNABORTED"
          ? "Request timed out"
          : `Network error: ${err.message}`;
        setError(errorMessage);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    const fetchHolidays = async () => {
      setLoadingHolidays(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/holidays/all`,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        setHolidays(
          Array.isArray(response.data.holidays)
            ? response.data.holidays.map((h) => h.date)
            : []
        );
      } catch {
        setHolidays([]);
      } finally {
        setLoadingHolidays(false);
      }
    };
    const fetchFreezeDays = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/config`,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        let cfgArray = [];
        if (Array.isArray(response.data)) {
          cfgArray = response.data;
        } else if (Array.isArray(response.data?.data)) {
          cfgArray = response.data.data;
        } else if (
          response.data?.data &&
          typeof response.data.data === "object"
        ) {
          cfgArray = Object.entries(response.data.data).map(([k, v]) => ({
            key: k,
            value: String(v),
          }));
        }
        const cfg = cfgArray.find((c) => c.key === "freeze_days_supervisor");
        const days = cfg ? parseInt(cfg.value, 10) : NaN;
        setFreezeDays(isNaN(days) ? 3 : days);
      } catch (err) {
        console.error(
          "fetchFreezeDays error:",
          err.response?.data || err.message
        );
        setFreezeDays(3);
      }
    };
    fetchEmployees();
    fetchHolidays();
    fetchFreezeDays();
  }, [supervisorId, apiHeaders]);

  useEffect(() => {
    if (!supervisorId || employees.length === 0) return;
    const fetchLeaves = async () => {
      setLoadingLeaves(true);
      const leavesMap = {};
      try {
        for (const emp of employees) {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/employee/leave/${emp.employee_id}`,
            {
              withCredentials: true,
              headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "" },
              timeout: 10000,
            }
          );
          leavesMap[emp.employee_id] = Array.isArray(response.data.data)
            ? response.data.data.filter((leave) => leave.status === "Approved")
            : [];
        }
        setEmployeeLeaves(leavesMap);
      } catch {
        setEmployeeLeaves({});
      } finally {
        setLoadingLeaves(false);
      }
    };
    fetchLeaves();
  }, [supervisorId, employees]);

  const getWeekIdForDate = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const week = getISOWeek(d);
    return `${year}-${String(week).padStart(2, "0")}`;
  };

  const parseWeekId = (weekId) => {
    if (!weekId || typeof weekId !== "string") return null;
    const [year, week] = weekId.split("-").map(Number);
    if (!year || !week) return null;
    return { year, week };
  };

  const employeeLevelMap = useMemo(() => {
    const map = {};
    employees.forEach((emp) => {
      map[emp.employee_id] = emp.level;
    });
    return map;
  }, [employees]);

  const isDirectEmployee = useMemo(() => {
    return employeeLevelMap[selectedEmployee] === 1;
  }, [employeeLevelMap, selectedEmployee]);

  useEffect(() => {
    if (!supervisorId || !apiHeaders) return;
    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/${supervisorId}`,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        const validStatuses = [
          "not started",
          "working",
          "completed",
          "suspended",
        ];
        const taskData =
          res.data.success && Array.isArray(res.data.data)
            ? res.data.data.map((task) => ({
                ...task,
                employee_id: task.employee_id?.trim().toUpperCase(),
                emp_status: validStatuses.includes(task.emp_status)
                  ? task.emp_status
                  : "not started",
                week_id: task.week_id,
              }))
            : [];
        setTasks(taskData);

        const uniqueWeekIds = [
          ...new Set(taskData.map((t) => t.week_id)),
        ].sort();
        const currentWeekId = getWeekIdForDate(new Date());

        if (uniqueWeekIds.length > 0) {
          if (uniqueWeekIds.includes(currentWeekId)) {
            setSelectedWeekId(currentWeekId);
          } else {
            setSelectedWeekId(uniqueWeekIds[uniqueWeekIds.length - 1]);
          }
        } else {
          setSelectedWeekId(currentWeekId);
        }

        setError(null);
      } catch (err) {
        const errorMessage = err.response?.status
          ? `Error ${err.response.status}: ${
              err.response.data?.error || err.response.statusText
            }`
          : err.code === "ECONNABORTED"
          ? "Request timed out"
          : `Network error: ${err.message}`;
        setError(errorMessage);
        setTasks([]);
        setSelectedWeekId(getWeekIdForDate(new Date()));
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, [supervisorId, apiHeaders]);

  // ────────────────────────────────────────────────────────────────
  // UPDATED: Conditional project fetch based on visibility setting
  useEffect(() => {
    if (!supervisorId || !selectedEmployee || !apiHeaders) return;

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        // Step 1: Fetch the current visibility mode
        let visibilityMode = "assigned_only"; // default fallback

        try {
          const visRes = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/org/project-visibility`,
            { withCredentials: true, headers: apiHeaders, timeout: 10000 }
          );
          visibilityMode = visRes.data?.visibility_mode || "assigned_only";
        } catch (err) {
          console.warn("Failed to fetch visibility → defaulting to assigned_only", err);
        }

        // Step 2: Choose endpoint based on visibility
        let projResponse;
        if (visibilityMode === "all") {
          // Fetch ALL projects in the organization
          projResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects`,
            {
              params: { orgId: orgId },
              withCredentials: true,
              headers: apiHeaders,
              timeout: 10000,
            }
          );
        } else {
          // Fetch only assigned projects (original behavior)
          projResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/employeeProjects`,
            {
              params: { employeeId: selectedEmployee },
              withCredentials: true,
              headers: apiHeaders,
              timeout: 10000,
            }
          );
        }

        // Step 3: Build project map
        const newProjects = {};
        (projResponse.data.projects || []).forEach((project) => {
          newProjects[project.id] = project.project || project.project_name || "Unnamed";
        });

        setProjects(newProjects);
        setError(null);
      } catch (err) {
        console.error("Projects fetch failed:", err);
        setProjects({});
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [supervisorId, selectedEmployee, apiHeaders, orgId]);
  // ────────────────────────────────────────────────────────────────

  const weekIds = useMemo(() => {
    const unique = [...new Set(tasks.map((t) => t.week_id))];
    return unique.sort();
  }, [tasks]);

  const currentWeekIndex = useMemo(() => {
    return weekIds.indexOf(selectedWeekId);
  }, [weekIds, selectedWeekId]);

  const getWeekStartDate = (weekId) => {
    if (!weekId || typeof weekId !== "string") return null;

    if (!/^\d{4}-\d{2}$/.test(weekId)) return null;

    const [year, week] = weekId.split("-").map(Number);

    if (!year || !week || week < 1 || week > 53) return null;

    const jan4 = new Date(year, 0, 4);
    const weekStart = startOfISOWeek(addDays(jan4, (week - 1) * 7));

    return isNaN(weekStart.getTime()) ? null : weekStart;
  };

  const weekDays = useMemo(() => {
    if (!selectedWeekId) return [];

    const weekStart = getWeekStartDate(selectedWeekId);
    if (!weekStart || isNaN(weekStart.getTime())) return [];

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dateDisplay = format(date, "MMM d");
      days.push({ dateStr, dateDisplay });
    }
    return days;
  }, [selectedWeekId]);

  const tasksByDate = useMemo(() => {
    const map = {};
    weekDays.forEach(({ dateStr }) => (map[dateStr] = []));
    if (selectedEmployee && selectedWeekId) {
      tasks.forEach((task) => {
        if (
          task.employee_id === selectedEmployee &&
          task.week_id === selectedWeekId
        ) {
          const taskDateStr = format(parseISO(task.task_date), "yyyy-MM-dd");
          if (map[taskDateStr]) map[taskDateStr].push(task);
        }
      });
    }
    return map;
  }, [tasks, selectedEmployee, selectedWeekId, weekDays]);

  const showAlert = (message) => {
    setAlertModal({ isVisible: true, message });
    setTimeout(() => setAlertModal({ isVisible: false, message: "" }), 5000);
  };

  const formatWeekId = (weekId) => {
    if (!weekId) return "N/A";

    const weekStart = getWeekStartDate(weekId);
    if (!weekStart || isNaN(weekStart.getTime())) {
      return `Week ${weekId} (Invalid Date)`;
    }

    const weekEnd = endOfISOWeek(weekStart);
    return `Week ${weekId} (${format(weekStart, "MMM d, yyyy")} - ${format(
      weekEnd,
      "MMM d, yyyy"
    )})`;
  };

  const isDateEditable = (dateString) => {
    if (!dateString) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateString);
    taskDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - taskDate.getTime()) / (1000 * 3600 * 24)
    );
    return diffDays <= freezeDays;
  };

  const handleReviewChange = (taskId, value) => {
    if (value === "pending") {
      setPendingReviewChanges((prev) => {
        const newPrev = { ...prev };
        delete newPrev[taskId];
        return newPrev;
      });
    } else {
      setPendingReviewChanges((prev) => ({ ...prev, [taskId]: value }));
    }
  };

  const updateTaskField = (taskId, field, value) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.task_id === taskId) {
          if (field === "project") {
            const selectedProject = Object.entries(projects).find(
              ([id]) => id === value
            );
            return {
              ...task,
              project_id: value,
              project_name: selectedProject
                ? selectedProject[1]
                : task.project_name,
            };
          }
          return { ...task, [field]: value };
        }
        return task;
      })
    );
  };

  const saveTaskField = async (taskId) => {
    const task = tasks.find((t) => t.task_id === taskId);
    if (!task) {
      showAlert("Task not found");
      return;
    }
    if (!isDateEditable(task.task_date)) {
      showAlert(
        `Cannot edit: Task is outside the ${freezeDays}-day editable window.`
      );
      return;
    }
    const effectiveReviewStatus =
      pendingReviewChanges[taskId] || task.sup_review_status;
    if (task.sup_review_status === "suspended_review") {
      showAlert("This task is suspended and cannot be updated.");
      return;
    }
    try {
      const updateData = {
        sup_status: task.sup_status || "incomplete",
        sup_comment: task.sup_comment || "",
        sup_review_status: effectiveReviewStatus || "pending",
        replacement_task: task.replacement_task || null,
        star_rating: task.star_rating || 0,
        project_id: task.project_id,
        project_name: task.project_name,
      };
      if (task.sup_status === "re-work") {
        let taskDate = new Date(task.task_date || new Date());
        taskDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(taskDate);
        nextDay.setDate(taskDate.getDate() + 1);
        const nextDayString = nextDay.toLocaleDateString("en-CA");
        if (!isDateEditable(nextDayString)) {
          showAlert(
            `Cannot create re-work: Next day is outside the ${freezeDays}-day window.`
          );
          return;
        }
        const nextDayWeekId = getWeekIdForDate(nextDay);
        const newTaskName = task.replacement_task || task.task_name;
        const newTaskData = {
          week_id: nextDayWeekId,
          task_date: nextDayString,
          project_id: task.project_id,
          project_name: task.project_name,
          task_name: newTaskName,
          employee_id: task.employee_id,
          emp_status: "not started",
          sup_status: "incomplete",
          emp_comment: null,
          sup_comment: null,
          sup_review_status: "pending",
          star_rating: 0,
          parent_task_id: task.task_id,
        };
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor`,
          newTaskData,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        updateData.sup_status = "re-work";
        await axios.put(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/${taskId}`,
          updateData,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        showAlert(response.data.message || "New task created successfully");
        if (response.data.newTask) {
          const newTask = {
            ...response.data.newTask,
            employee_name:
              employees.find(
                (emp) => emp.employee_id === response.data.newTask.employee_id
              )?.employee_name || "Unknown",
            employee_id: response.data.newTask.employee_id
              ?.trim()
              .toUpperCase(),
            emp_status: response.data.newTask.emp_status || "not started",
            week_id: response.data.newTask.week_id,
          };
          setTasks((prev) => [...prev, newTask]);
          const newTaskWeek = newTask.week_id;
          if (newTaskWeek && newTaskWeek !== selectedWeekId) {
            setSelectedWeekId(newTaskWeek);
          }
        }
      } else {
        await axios.put(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/${taskId}`,
          updateData,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        showAlert("Task updated successfully");
      }
      setPendingReviewChanges((prev) => {
        const newPrev = { ...prev };
        delete newPrev[taskId];
        return newPrev;
      });
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/${supervisorId}`,
        { withCredentials: true, headers: apiHeaders, timeout: 10000 }
      );
      const validStatuses = [
        "not started",
        "working",
        "completed",
        "suspended",
      ];
      const taskData =
        res.data.success && Array.isArray(res.data.data)
          ? res.data.data.map((task) => ({
              ...task,
              employee_id: task.employee_id?.trim().toUpperCase(),
              emp_status: validStatuses.includes(task.emp_status)
                ? task.emp_status
                : "not started",
              week_id: task.week_id,
            }))
          : [];
      setTasks(taskData);
    } catch (err) {
      const errorMessage = err.response?.status
        ? `Error ${err.response.status}: ${
            err.response.data?.error || err.response.statusText
          }`
        : err.code === "ECONNABORTED"
        ? "Request timed out"
        : `Network error: ${err.message}`;
      showAlert(`Failed to update task: ${errorMessage}`);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "completed":
        return "#28a745";
      case "working":
        return "#3770ecff";
      case "not started":
        return "#888";
      case "suspended":
        return "#dc3545";
      default:
        return "#007bff";
    }
  };

  const getReviewStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#28a745";
      case "struck":
        return "#ffc107";
      case "suspended_review":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "working":
        return "Working";
      case "not started":
        return "Not Started";
      case "suspended":
        return "Suspended";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTaskDateStyle = (dateString, employeeId) => {
    if (!dateString)
      return {
        className:
          "supervisor-plan-task-date supervisor-plan-task-date-regular",
        tooltip: "N/A",
      };
    const taskDate = new Date(dateString);
    taskDate.setHours(0, 0, 0, 0);
    const isApprovedLeave = employeeLeaves[employeeId]?.some((leave) => {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      return taskDate >= startDate && taskDate <= endDate;
    });
    const isSunday = taskDate.getDay() === 0;
    const isHoliday = holidays.some((holiday) => {
      const holidayDate = new Date(holiday);
      holidayDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === holidayDate.getTime();
    });
    if (isApprovedLeave)
      return {
        className: "supervisor-plan-task-date supervisor-plan-task-date-leave",
        tooltip: "Leave",
      };
    if (isHoliday)
      return {
        className:
          "supervisor-plan-task-date supervisor-plan-task-date-holiday",
        tooltip: "Holiday",
      };
    if (isSunday)
      return {
        className: "supervisor-plan-task-date supervisor-plan-task-date-sunday",
        tooltip: "Sunday",
      };
    return {
      className: "supervisor-plan-task-date supervisor-plan-task-date-regular",
      tooltip: formatDate(dateString),
    };
  };

  const buildEmployeeTree = (employees) => {
    const map = {};
    const roots = [];
    employees.forEach((emp) => {
      map[emp.employee_id] = { ...emp, children: [] };
    });
    employees.forEach((emp) => {
      if (map[emp.supervisor_id]) {
        map[emp.supervisor_id].children.push(map[emp.employee_id]);
      } else {
        roots.push(map[emp.employee_id]);
      }
    });
    return roots;
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  const employeeTree = useMemo(() => {
    return buildEmployeeTree(filteredEmployees);
  }, [filteredEmployees]);

  const goToPreviousWeek = () => {
    if (currentWeekIndex > 0) {
      setSelectedWeekId(weekIds[currentWeekIndex - 1]);
    }
  };

  const goToNextWeek = () => {
    if (currentWeekIndex < weekIds.length - 1) {
      setSelectedWeekId(weekIds[currentWeekIndex + 1]);
    }
  };

  if (!hydrated)
    return (
      <div className="supervisor-plan-wrapper">
        <p>Loading user...</p>
      </div>
    );
  if (!user)
    return (
      <div className="supervisor-plan-wrapper">
        <div className="supervisor-plan-error-message">
          Please <a href="/login">log in</a>.
        </div>
      </div>
    );
  if (!supervisorId)
    return (
      <div className="supervisor-plan-wrapper">
        <div className="supervisor-plan-error-message">
          {error || "Supervisor ID missing."} <a href="/login">Log in again</a>.
        </div>
      </div>
    );

  const EmployeeNode = ({ emp }) => {
    const hasChildren = emp.children && emp.children.length > 0;
    const isOpen = openNodes[emp.employee_id] || false;

    return (
      <>
        <li
          className={
            selectedEmployee === emp.employee_id ? "supervisor-plan-active" : ""
          }
        >
          {hasChildren ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setOpenNodes((prev) => ({
                  ...prev,
                  [emp.employee_id]: !prev[emp.employee_id],
                }));
              }}
              style={{ fontSize: "12px", cursor: "pointer" }}
            >
              {isOpen ? "▼" : "▶"}
            </span>
          ) : (
            <span style={{ width: "12px", display: "inline-block" }}></span>
          )}
          <span
            onClick={() => setSelectedEmployee(emp.employee_id)}
            style={{ flex: 1, cursor: "pointer" }}
          >
            {emp.employee_name}
          </span>
        </li>

        {hasChildren &&
          isOpen &&
          emp.children.map((child) => (
            <EmployeeNode key={child.employee_id} emp={child} />
          ))}
      </>
    );
  };

  return (
    <div className="supervisor-plan-wrapper">
      <Modal
        isVisible={alertModal.isVisible}
        onClose={() => setAlertModal({ isVisible: false, message: "" })}
        buttons={[
          {
            label: "OK",
            onClick: () => setAlertModal({ isVisible: false, message: "" }),
          },
        ]}
      >
        <p>{alertModal.message}</p>
      </Modal>
      <div className="supervisor-plan-employee-list">
        <h3>Employees</h3>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search employees by name"
          className="supervisor-plan-search-bar"
          style={{
            padding: "8px",
            fontSize: "11px",
            marginBottom: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loadingEmployees || loadingHolidays || loadingLeaves ? (
          <p>Loading employees...</p>
        ) : employeeTree.length === 0 ? (
          <p>No employees match the search criteria.</p>
        ) : (
          <ul className="supervisor-plan-employee-scroll">
            {employeeTree.map((root) => (
              <EmployeeNode key={root.employee_id} emp={root} />
            ))}
          </ul>
        )}
      </div>
      <div className="supervisor-plan-task-details">
        {loadingTasks || loadingProjects ? (
          <p>Loading tasks or projects...</p>
        ) : selectedEmployee === null ? (
          <p>Select an employee to view tasks</p>
        ) : weekIds.length === 0 ? (
          <p>No tasks assigned for this employee.</p>
        ) : (
          <>
            <div className="supervisor-plan-week-navigation">
              <button
                className="supervisor-plan-nav-button"
                onClick={goToPreviousWeek}
                disabled={currentWeekIndex <= 0}
              >
                &lt;
              </button>
              <span className="supervisor-plan-week-label">
                {formatWeekId(selectedWeekId)}
              </span>
              <button
                className="supervisor-plan-nav-button"
                onClick={goToNextWeek}
                disabled={currentWeekIndex >= weekIds.length - 1}
              >
                &gt;
              </button>
            </div>
            <div className="supervisor-plan-tasks-container">
              {weekDays.map(({ dateStr, dateDisplay }) => {
                const dayTasks = tasksByDate[dateStr] || [];
                const sampleTaskForStyle = dayTasks[0] || {
                  task_date: dateStr,
                  employee_id: selectedEmployee,
                };
                const dateStyle = getTaskDateStyle(
                  sampleTaskForStyle.task_date,
                  selectedEmployee
                );
                return (
                  <div key={dateStr} className="supervisor-plan-day-group">
                    <div className="supervisor-plan-day-header">
                      <span
                        className={dateStyle.className}
                        title={dateStyle.tooltip}
                      >
                        {dateDisplay}
                      </span>
                    </div>
                    {dayTasks.length === 0 ? (
                      <p className="supervisor-plan-no-tasks">
                        No tasks assigned for this day.
                      </p>
                    ) : (
                      dayTasks.map((task) => {
                        const editable = isDateEditable(task.task_date);
                        const taskDateStyle = getTaskDateStyle(
                          task.task_date,
                          task.employee_id
                        );
                        const effectiveReviewStatus =
                          pendingReviewChanges[task.task_id] ||
                          task.sup_review_status;
                        const isFrozen =
                          task.sup_review_status === "suspended_review" ||
                          reworkedParentIds.has(task.task_id) ||
                          !isDirectEmployee;
                        const showReviewSelect =
                          task.sup_review_status === "pending" &&
                          !pendingReviewChanges[task.task_id];
                        return (
                          <div
                            key={task.task_id}
                            className={`supervisor-plan-task-card ${
                              !editable || isFrozen
                                ? "supervisor-plan-task-frozen"
                                : ""
                            }`}
                          >
                            <div className="supervisor-plan-task-header">
                              <div className="supervisor-plan-task-title">
                                {effectiveReviewStatus === "struck" ? (
                                  <>
                                    <span
                                      style={{
                                        textDecoration: "line-through",
                                        color: "#a0a0a0",
                                      }}
                                    >
                                      {task.task_name}
                                    </span>
                                    {task.replacement_task && (
                                      <span
                                        style={{
                                          color: "#007bff",
                                          marginLeft: "8px",
                                        }}
                                      >
                                        → {task.replacement_task}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  task.task_name
                                )}
                              </div>
                              <div className="supervisor-plan-task-meta">
                               {effectiveReviewStatus !== "pending" && (
  <span className="supervisor-plan-status-icon">
    {effectiveReviewStatus === "approved" && "✅"}
    {effectiveReviewStatus === "struck" && "📝"}
    {effectiveReviewStatus === "suspended_review" && "⛔"}
  </span>
)}
                                <span
                                  className={taskDateStyle.className}
                                  title={taskDateStyle.tooltip}
                                >
                                  {formatDate(task.task_date)}
                                </span>
                                <div className="supervisor-plan-project-circle-wrapper">
                                  <span className="supervisor-plan-project-circle">
                                    {task.project_id}
                                  </span>
                                  <div className="supervisor-plan-tooltip">
                                    {task.project_name}
                                  </div>
                                </div>
                                <div className="supervisor-plan-status-dot-wrapper">
                                  <span
                                    className="supervisor-plan-status-dot"
                                    style={{
                                      backgroundColor: statusColor(
                                        task.emp_status
                                      ),
                                    }}
                                  ></span>
                                  <div className="supervisor-plan-tooltip">
                                    {statusLabel(task.emp_status)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="supervisor-plan-task-body">
                              <p>
                                <strong>Emp-Update:</strong>{" "}
                                {task.emp_comment || "-"}
                              </p>
                            </div>
                            {isFrozen && (
                              <div className="supervisor-plan-frozen-message">
                                This task is suspended and frozen. No edits
                                allowed.
                              </div>
                            )}
                            <div className="supervisor-plan-edit-section">
                              <label>
                                Project:
                                <select
                                  value={task.project_id || ""}
                                  onChange={(e) =>
                                    updateTaskField(
                                      task.task_id,
                                      "project",
                                      e.target.value
                                    )
                                  }
                                  disabled={!editable || isFrozen}
                                >
                                  <option value="">Select Project</option>
                                  {Object.entries(projects).map(
                                    ([id, name]) => (
                                      <option key={id} value={id}>
                                        {id} - {name}
                                      </option>
                                    )
                                  )}
                                </select>
                              </label>
                              <label>
                                Update:
                                <select
                                  value={task.sup_status || "incomplete"}
                                  onChange={(e) =>
                                    updateTaskField(
                                      task.task_id,
                                      "sup_status",
                                      e.target.value
                                    )
                                  }
                                  disabled={!editable || isFrozen}
                                >
                                  <option value="completed">Completed</option>
                                  <option value="add on">Add On</option>
                                  <option value="re-work">Re-work</option>
                                  <option value="incomplete">Incomplete</option>
                                </select>
                              </label>
                              <label className="supervisor-admin-feedback-label">
                                Feedback:
                                <div className="supervisor-admin-feedback-container">
                                  <input
                                    type="text"
                                    value={
                                      liveComments[task.task_id] ??
                                      task.sup_comment ??
                                      ""
                                    }
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setLiveComments((prev) => ({
                                        ...prev,
                                        [task.task_id]: text,
                                      }));
                                      updateTaskField(
                                        task.task_id,
                                        "sup_comment",
                                        text
                                      );
                                    }}
                                    placeholder="Add comment"
                                    disabled={isFrozen}
                                    className="supervisor-admin-feedback-input"
                                  />
                                  <button
                                    type="button"
                                    className={`supervisor-admin-mic-button ${
                                      listeningTaskId === task.task_id
                                        ? "listening"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      listeningTaskId === task.task_id
                                        ? stopListening()
                                        : startListening(task.task_id)
                                    }
                                    disabled={isFrozen}
                                    aria-label={
                                      listeningTaskId === task.task_id
                                        ? "Stop listening"
                                        : "Start voice input"
                                    }
                                  >
                                    {listeningTaskId === task.task_id ? (
                                      <MdMicOff />
                                    ) : (
                                      <MdMic />
                                    )}
                                  </button>
                                </div>
                              </label>
                              {showReviewSelect && (
                                <label>
                                  Review:
                                  <select
                                    value={task.sup_review_status || "pending"}
                                    style={{
                                      color: getReviewStatusColor(
                                        task.sup_review_status
                                      ),
                                    }}
                                    onChange={(e) =>
                                      handleReviewChange(
                                        task.task_id,
                                        e.target.value
                                      )
                                    }
                                    disabled={!editable || isFrozen}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="struck">Update task</option>
                                    <option value="suspended_review">
                                      Suspended
                                    </option>
                                  </select>
                                </label>
                              )}
                              {effectiveReviewStatus === "struck" && (
                                <label>
                                  Updated task:
                                  <input
                                    type="text"
                                    value={task.replacement_task || ""}
                                    onChange={(e) =>
                                      updateTaskField(
                                        task.task_id,
                                        "replacement_task",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter updated task"
                                    disabled={!editable || isFrozen}
                                  />
                                </label>
                              )}
                              {effectiveReviewStatus !== "pending" && (
                                <label>
                                  Rating:
                                  <div className="supervisor-plan-star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        className={`supervisor-plan-star ${
                                          task.star_rating >= star
                                            ? "filled"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          editable &&
                                          !isFrozen &&
                                          updateTaskField(
                                            task.task_id,
                                            "star_rating",
                                            star
                                          )
                                        }
                                        style={{
                                          cursor:
                                            editable && !isFrozen
                                              ? "pointer"
                                              : "not-allowed",
                                        }}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </label>
                              )}
                              <button
                                className="supervisor-plan-update-task-button"
                                onClick={() => saveTaskField(task.task_id)}
                                disabled={!editable || isFrozen}
                              >
                                Update
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupervisorPlanViewer;