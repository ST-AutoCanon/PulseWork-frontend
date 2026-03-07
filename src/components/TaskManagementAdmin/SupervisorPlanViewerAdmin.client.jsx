
"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
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
import "./SupervisorPlanViewerAdmin.css";

const SupervisorPlanViewerAdmin = () => {
  const { user, hydrated } = useAuth();

  const [supervisorId, setSupervisorId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [error, setError] = useState(null);

  const defaultToCurrentWeek = true;

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    message: "",
  });

  const reworkedParentIds = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (t.parent_task_id) {
        set.add(t.parent_task_id);
      }
    });
    return set;
  }, [tasks]);

  const [configModal, setConfigModal] = useState({
    isVisible: false,
    freezeDaysSupervisor: "",
    freezeDaysEmployee: "",
  });

  // ── NEW STATES for Project Types / Visibility ───────────────────────────────
  const [projectVisibilityModal, setProjectVisibilityModal] = useState({
    isVisible: false,
    currentValue: "assigned_only", // fallback default
  });
  // ──────────────────────────────────────────────────────────────────────────────

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [pendingReviewChanges, setPendingReviewChanges] = useState({});

  const apiHeaders = useMemo(
    () => ({
      "x-employee-id": supervisorId,
      "x-role": user?.role || "admin",
      "x-org-id": user?.orgId ?? "",
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
    }),
    [supervisorId, user?.role]
  );

  useEffect(() => {
    if (!hydrated) return;
    if (user?.employeeId) {
      setSupervisorId(String(user.employeeId));
    } else {
      setError("Supervisor ID not found. Please log in.");
    }
  }, [user, hydrated]);

  useEffect(() => {
    if (!supervisorId) return;

    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/employees/all`,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        const empData = Array.isArray(response.data.employees)
          ? response.data.employees.map((emp) => ({
              ...emp,
              employee_id: emp.employee_id?.trim().toUpperCase(),
            }))
          : [];
        setEmployees(empData);
        setError(
          empData.length === 0 ? "No active employees available." : null
        );
      } catch (err) {
        const errorMessage =
          err.response?.data?.error ||
          err.response?.statusText ||
          err.message ||
          "Failed to load employees";
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
      } catch (err) {
        setHolidays([]);
      } finally {
        setLoadingHolidays(false);
      }
    };

    const fetchApprovedLeaves = async () => {
      setLoadingLeaves(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/leave`,
          {
            params: { status: "Approved" },
            withCredentials: true,
            headers: apiHeaders,
            timeout: 10000,
          }
        );
        const leaveData = Array.isArray(response.data.data)
          ? response.data.data.map((leave) => ({
              employee_id: leave.employee_id?.trim().toUpperCase(),
              start_date: leave.start_date,
              end_date: leave.end_date,
              h_f_day: leave.H_F_day,
            }))
          : [];
        setApprovedLeaves(leaveData);
      } catch (err) {
        setApprovedLeaves([]);
      } finally {
        setLoadingLeaves(false);
      }
    };

    fetchEmployees();
    fetchHolidays();
    fetchApprovedLeaves();
  }, [supervisorId, apiHeaders]);

  useEffect(() => {
    if (!supervisorId) return;

    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor`,
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
                project_id: task.project_id,
                project_name: task.project_name,
              }))
            : [];
        setTasks(taskData);
        setError(null);
      } catch (err) {
        const errorMessage =
          err.response?.data?.error ||
          err.response?.statusText ||
          err.message ||
          "Failed to load tasks";
        setError(errorMessage);
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [supervisorId, apiHeaders]);

  useEffect(() => {
    if (tasks.length === 0 || selectedWeekId !== null) return;

    const uniqueWeekIds = [...new Set(tasks.map((t) => t.week_id))].sort();
    const currentWeekId = getWeekIdForDate(new Date());

    const defaultWeek =
      defaultToCurrentWeek && uniqueWeekIds.includes(currentWeekId)
        ? currentWeekId
        : uniqueWeekIds[uniqueWeekIds.length - 1] || currentWeekId;

    setSelectedWeekId(defaultWeek);
  }, [tasks]);

  useEffect(() => {
    if (employees.length === 0 || selectedEmployee !== null) return;

    const employeeIdsWithTasks = [...new Set(tasks.map((t) => t.employee_id))];
    const preferred = employees.find((e) =>
      employeeIdsWithTasks.includes(e.employee_id)
    );
    setSelectedEmployee(
      preferred ? preferred.employee_id : employees[0]?.employee_id || null
    );
  }, [employees, tasks]);

  // ────────────────────────────────────────────────────────────────
  // UPDATED: Conditional project fetch based on visibility setting
  useEffect(() => {
    if (!selectedEmployee) return;

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
              params: { orgId: user?.orgId ?? "" },
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
  }, [selectedEmployee, apiHeaders, user?.orgId]);
  // ────────────────────────────────────────────────────────────────

  // ── NEW: Fetch current project visibility setting when supervisorId is ready ──
  useEffect(() => {
    if (!supervisorId) return;

    const fetchProjectVisibility = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/org/project-visibility`,
          { withCredentials: true, headers: apiHeaders }
        );
        const mode = res.data?.visibility_mode || "assigned_only";
        setProjectVisibilityModal((prev) => ({
          ...prev,
          currentValue: mode,
        }));
      } catch (err) {
        console.warn("Failed to load project visibility setting:", err);
      }
    };

    fetchProjectVisibility();
  }, [supervisorId, apiHeaders]);
  // ──────────────────────────────────────────────────────────────────────────────

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/config`,
        { withCredentials: true, headers: apiHeaders }
      );

      const data = response.data.data || {};

      setConfigModal({
        isVisible: true,
        freezeDaysSupervisor: data.freeze_days_supervisor || "",
        freezeDaysEmployee: data.freeze_days_employee || "",
      });
    } catch (err) {
      console.error("Config fetch failed:", err);
      setConfigModal({
        isVisible: true,
        freezeDaysSupervisor: "",
        freezeDaysEmployee: "",
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const updateConfig = async () => {
    const { freezeDaysSupervisor, freezeDaysEmployee } = configModal;

    if (
      !/^\d+$/.test(freezeDaysSupervisor) ||
      !/^\d+$/.test(freezeDaysEmployee)
    ) {
      showAlert("Freeze days must be positive integers.");
      return;
    }

    setLoadingConfig(true);
    try {
      await Promise.all([
        axios.put(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/config`,
          { key: "freeze_days_supervisor", value: freezeDaysSupervisor },
          { withCredentials: true, headers: apiHeaders }
        ),
        axios.put(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/config`,
          { key: "freeze_days_employee", value: freezeDaysEmployee },
          { withCredentials: true, headers: apiHeaders }
        ),
      ]);

      showAlert("Configuration updated successfully");
      setConfigModal((prev) => ({ ...prev, isVisible: false }));
    } catch (err) {
      console.error("Config save failed:", err);
      showAlert(
        "Failed to update configuration: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoadingConfig(false);
    }
  };

  // ── NEW: Save project visibility setting ─────────────────────────────────────
  const saveProjectVisibility = async () => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/org/project-visibility`,
        { visibility_mode: projectVisibilityModal.currentValue },
        { withCredentials: true, headers: apiHeaders }
      );
      showAlert("Project visibility setting updated successfully");
      setProjectVisibilityModal((prev) => ({ ...prev, isVisible: false }));
    } catch (err) {
      showAlert(
        "Failed to update project visibility: " +
          (err.response?.data?.error || err.message)
      );
    }
  };
  // ──────────────────────────────────────────────────────────────────────────────

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

  const saveTaskField = async (taskId) => {
    const task = tasks.find((t) => t.task_id === taskId);
    if (!task) {
      showAlert("Task not found");
      return;
    }

    if (task.sup_review_status === "suspended_review") {
      showAlert("This task is suspended and cannot be updated.");
      return;
    }

    try {
      const effectiveReviewStatus =
        pendingReviewChanges[taskId] || task.sup_review_status;
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
        const taskDate = new Date(task.task_date || new Date());
        taskDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(taskDate);
        nextDay.setDate(taskDate.getDate() + 1);
        const nextDayString = nextDay.toLocaleDateString("en-CA");
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
            project_id: response.data.newTask.project_id,
            project_name: response.data.newTask.project_name,
          };
          setTasks((prev) => [...prev, newTask]);

          const newTaskWeek = newTask.week_id;
          if (newTaskWeek && newTaskWeek !== selectedWeekId) {
            setSelectedWeekId(newTaskWeek);
          }
          if (newTask.employee_id !== selectedEmployee) {
            setSelectedEmployee(newTask.employee_id);
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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor`,
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
              project_id: task.project_id,
              project_name: task.project_name,
            }))
          : [];
      setTasks(taskData);
    } catch (err) {
      showAlert("Failed to update task.");
    }
  };

  const showAlert = (message) => {
    setAlertModal({ isVisible: true, message });
    setTimeout(() => setAlertModal({ isVisible: false, message: "" }), 5000);
  };

  const getWeekIdForDate = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const week = getISOWeek(d);
    return `${year}-${String(week).padStart(2, "0")}`;
  };

  const parseWeekId = (weekId) => {
    if (!weekId) return null;
    const [year, week] = weekId.split("-").map(Number);
    return { year, week };
  };

  const getWeekStartDate = (weekId) => {
    if (!weekId || typeof weekId !== "string") return null;
    if (!/^\d{4}-\d{2}$/.test(weekId)) return null;

    const [year, week] = weekId.split("-").map(Number);
    if (!year || !week || week < 1 || week > 53) return null;

    const jan4 = new Date(year, 0, 4);
    return startOfISOWeek(addDays(jan4, (week - 1) * 7));
  };

  const formatWeekId = (weekId) => {
    if (!weekId) return "N/A";

    const weekStart = getWeekStartDate(weekId);
    if (!weekStart || isNaN(weekStart.getTime())) {
      return `Week ${weekId} (Invalid)`;
    }
    const weekEnd = endOfISOWeek(weekStart);
    return `Week ${weekId} (${format(weekStart, "MMM d, yyyy")} - ${format(
      weekEnd,
      "MMM d, yyyy"
    )})`;
  };

  const generateWeekDays = () => {
    if (!selectedWeekId) return [];

    const weekStart = getWeekStartDate(selectedWeekId);
    if (!weekStart || isNaN(weekStart.getTime())) return [];

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        dateStr: format(date, "yyyy-MM-dd"),
        dateDisplay: format(date, "MMM d"),
      };
    });
  };

  const weekDays = generateWeekDays();

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

    const isApprovedLeave = approvedLeaves.some((leave) => {
      if (leave.employee_id !== employeeId) return false;
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      const isHalfDay = leave.h_f_day.toLowerCase().includes("half");
      if (isHalfDay) return taskDate.getTime() === startDate.getTime();
      return (
        taskDate.getTime() >= startDate.getTime() &&
        taskDate.getTime() <= endDate.getTime()
      );
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

  const weekIds = useMemo(
    () => [...new Set(tasks.map((t) => t.week_id))].sort(),
    [tasks]
  );

  const currentWeekIndex = useMemo(
    () => weekIds.indexOf(selectedWeekId),
    [weekIds, selectedWeekId]
  );

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

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  const goToPreviousWeek = () => {
    if (currentWeekIndex > 0) setSelectedWeekId(weekIds[currentWeekIndex - 1]);
  };

  const goToNextWeek = () => {
    if (currentWeekIndex < weekIds.length - 1)
      setSelectedWeekId(weekIds[currentWeekIndex + 1]);
  };

  if (!hydrated)
    return <div className="supervisor-plan-admin-wrapper">Loading user...</div>;
  if (!user)
    return (
      <div className="supervisor-plan-admin-wrapper">
        <div className="supervisor-plan-admin-error-message">
          Please <a href="/login">log in</a>.
        </div>
      </div>
    );
  if (!supervisorId)
    return (
      <div className="supervisor-plan-admin-wrapper">
        <div className="supervisor-plan-admin-error-message">
          {error || "Supervisor ID missing."} <a href="/login">Log in again</a>.
        </div>
      </div>
    );

  return (
    <div className="supervisor-plan-admin-wrapper">
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

      {/* Existing Freeze Days Modal */}
      {configModal.isVisible && (
        <div
          className="supervisor-plan-admin-modal-overlay"
          onClick={() =>
            setConfigModal((prev) => ({ ...prev, isVisible: false }))
          }
        >
          <form
            className="supervisor-plan-admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="supervisor-plan-admin-modal-title">
              Update Freeze Days
            </h3>
            <div className="supervisor-plan-admin-config-modal-content">
              <div className="supervisor-plan-admin-config-input-group">
                <label className="supervisor-plan-admin-config-label">
                  Supervisor Freeze Days
                  <input
                    type="number"
                    min="0"
                    value={configModal.freezeDaysSupervisor}
                    onChange={(e) =>
                      setConfigModal((prev) => ({
                        ...prev,
                        freezeDaysSupervisor: e.target.value,
                      }))
                    }
                    disabled={loadingConfig}
                    className="supervisor-plan-admin-config-input"
                  />
                </label>
                <label className="supervisor-plan-admin-config-label">
                  Employee Freeze Days
                  <input
                    type="number"
                    min="0"
                    value={configModal.freezeDaysEmployee}
                    onChange={(e) =>
                      setConfigModal((prev) => ({
                        ...prev,
                        freezeDaysEmployee: e.target.value,
                      }))
                    }
                    disabled={loadingConfig}
                    className="supervisor-plan-admin-config-input"
                  />
                </label>
              </div>
            </div>
            <div className="supervisor-plan-admin-modal-buttons">
              <button
                type="button"
                className="supervisor-plan-admin-modal-button supervisor-plan-admin-modal-button-cancel"
                onClick={() =>
                  setConfigModal((prev) => ({ ...prev, isVisible: false }))
                }
                disabled={loadingConfig}
              >
                Cancel
              </button>
              <button
                type="button"
                className="supervisor-plan-admin-modal-button supervisor-plan-admin-modal-button-save"
                onClick={updateConfig}
                disabled={loadingConfig}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── NEW: Project Visibility Modal ──────────────────────────────────────── */}
      {projectVisibilityModal.isVisible && (
        <div
          className="supervisor-plan-admin-modal-overlay"
          onClick={() =>
            setProjectVisibilityModal((prev) => ({ ...prev, isVisible: false }))
          }
        >
          <div
            className="supervisor-plan-admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px", padding: "24px" }}
          >
            <h3 className="supervisor-plan-admin-modal-title">
              Project Visibility for Employees
            </h3>

            <div style={{ margin: "24px 0" }}>
              <p style={{ marginBottom: "20px", fontSize: "15px" }}>
                Choose which projects employees can see and select in their views
                (task logging, time entry, leave application, etc.):
              </p>

              <label style={{ display: "block", marginBottom: "16px" }}>
                <input
                  type="radio"
                  name="proj-visibility"
                  value="all"
                  checked={projectVisibilityModal.currentValue === "all"}
                  onChange={() =>
                    setProjectVisibilityModal((prev) => ({
                      ...prev,
                      currentValue: "all",
                    }))
                  }
                />
                <strong style={{ marginLeft: "8px" }}>All projects</strong>
                <br />
                <small style={{ marginLeft: "28px", color: "#666" }}>
                  Employees can see and select any project in the organization
                </small>
              </label>

              <label style={{ display: "block" }}>
                <input
                  type="radio"
                  name="proj-visibility"
                  value="assigned_only"
                  checked={projectVisibilityModal.currentValue === "assigned_only"}
                  onChange={() =>
                    setProjectVisibilityModal((prev) => ({
                      ...prev,
                      currentValue: "assigned_only",
                    }))
                  }
                />
                <strong style={{ marginLeft: "8px" }}>Only assigned projects</strong>
                <br />
                <small style={{ marginLeft: "28px", color: "#666" }}>
                  Employees can only see projects where they are added to the team
                </small>
              </label>
            </div>

            <div className="supervisor-plan-admin-modal-buttons">
              <button
                type="button"
                className="supervisor-plan-admin-modal-button supervisor-plan-admin-modal-button-cancel"
                onClick={() =>
                  setProjectVisibilityModal((prev) => ({ ...prev, isVisible: false }))
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="supervisor-plan-admin-modal-button supervisor-plan-admin-modal-button-save"
                onClick={saveProjectVisibility}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ────────────────────────────────────────────────────────────────────────────── */}

      
{/* <div className="supervisor-plan-admin-header">
        <button
          className="supervisor-plan-admin-config-button"
          onClick={fetchConfig}
          disabled={loadingConfig}
          style={{  top: "10px", right: "10px",gap:"10px" }}
        >
          {loadingConfig ? "Loading..." : "Update Freeze Days"}
        </button>

        <button
          className="supervisor-plan-admin-config-button"
          onClick={() =>
            setProjectVisibilityModal((prev) => ({ ...prev, isVisible: true }))
          }
        >
          Project Types
        </button>
      </div> */}
      <div
  className="supervisor-plan-admin-header"
  style={{ display: "flex", alignItems: "center", gap: "12px" }}
>
  <button
    className="supervisor-plan-admin-config-button"
    onClick={fetchConfig}
    disabled={loadingConfig}
  >
    {loadingConfig ? "Loading..." : "Update Freeze Days"}
  </button>

  <button
    className="supervisor-plan-admin-config-button"
    onClick={() =>
      setProjectVisibilityModal((prev) => ({ ...prev, isVisible: true }))
    }
  >
    Project Types
  </button>
</div>
      <div className="supervisor-plan-admin-employee-list">
        <h3>Employees</h3>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search employees by name"
          className="supervisor-plan-admin-search-bar"
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loadingEmployees || loadingHolidays || loadingLeaves ? (
          <p>Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p>No employees match the search criteria.</p>
        ) : (
          <ul className="supervisor-plan-admin-employee-scroll">
            {filteredEmployees.map((emp) => (
              <li
                key={emp.employee_id}
                className={
                  selectedEmployee === emp.employee_id
                    ? "supervisor-plan-admin-active"
                    : ""
                }
                onClick={() => setSelectedEmployee(emp.employee_id)}
              >
                {emp.employee_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="supervisor-plan-admin-task-details">
        {loadingTasks || loadingProjects ? (
          <p>Loading tasks or projects...</p>
        ) : selectedEmployee === null ? (
          <p>Select an employee to view tasks</p>
        ) : weekIds.length === 0 ? (
          <p>No tasks assigned for this employee.</p>
        ) : (
          <>
            <div className="supervisor-plan-admin-week-navigation">
              <button
                className="supervisor-plan-admin-nav-button"
                onClick={goToPreviousWeek}
                disabled={currentWeekIndex <= 0}
              >
                &lt;
              </button>
              <span className="supervisor-plan-admin-week-label">
                {formatWeekId(selectedWeekId)}
              </span>
              <button
                className="supervisor-plan-admin-nav-button"
                onClick={goToNextWeek}
                disabled={currentWeekIndex >= weekIds.length - 1}
              >
                &gt;
              </button>
            </div>
            <div className="supervisor-plan-admin-tasks-container">
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
                  <div
                    key={dateStr}
                    className="supervisor-plan-admin-day-group"
                  >
                    <div className="supervisor-plan-admin-day-header">
                      <span
                        className={dateStyle.className}
                        title={dateStyle.tooltip}
                      >
                        {dateDisplay}
                      </span>
                    </div>
                    {dayTasks.length === 0 ? (
                      <p className="supervisor-plan-admin-no-tasks">
                        No tasks assigned for this day.
                      </p>
                    ) : (
                      dayTasks.map((task) => {
                        const taskDateStyle = getTaskDateStyle(
                          task.task_date,
                          task.employee_id
                        );
                        const effectiveReviewStatus =
                          pendingReviewChanges[task.task_id] ||
                          task.sup_review_status;
                        const isFrozen =
                          task.sup_review_status === "suspended_review" ||
                          reworkedParentIds.has(task.task_id);

                        const showReviewSelect =
                          task.sup_review_status === "pending" &&
                          !pendingReviewChanges[task.task_id];
                        return (
                          <div
                            key={task.task_id}
                            className={`supervisor-plan-admin-task-card ${
                              isFrozen
                                ? "supervisor-plan-admin-task-frozen"
                                : ""
                            }`}
                          >
                            <div className="supervisor-plan-admin-task-header">
                              <div className="supervisor-plan-admin-task-title">
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
                              <div className="supervisor-plan-admin-task-meta">
                                {effectiveReviewStatus !== "pending" && (
                                  <span className="supervisor-plan-status-icon">
                                    {effectiveReviewStatus === "approved" &&
                                      "✅"}
                                    {effectiveReviewStatus === "struck" && "📝"}
                                    {effectiveReviewStatus ===
                                      "suspended_review" && "⛔"}
                                  </span>
                                )}
                                <span
                                  className={taskDateStyle.className}
                                  title={taskDateStyle.tooltip}
                                >
                                  {formatDate(task.task_date)}
                                </span>
                                <div className="supervisor-plan-admin-project-circle-wrapper">
                                  <span className="supervisor-plan-admin-project-circle">
                                    {task.project_id || "N/A"}
                                  </span>
                                  <div className="supervisor-plan-admin-tooltip">
                                    {task.project_name || "Unknown"}
                                  </div>
                                </div>
                                <div className="supervisor-plan-admin-status-dot-wrapper">
                                  <span
                                    className="supervisor-plan-admin-status-dot"
                                    style={{
                                      backgroundColor: statusColor(
                                        task.emp_status
                                      ),
                                    }}
                                  ></span>
                                  <div className="supervisor-plan-admin-tooltip">
                                    {statusLabel(task.emp_status)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="supervisor-plan-admin-task-body">
                              <p>
                                <strong>Emp-Update:</strong>{" "}
                                {task.emp_comment || "-"}
                              </p>
                            </div>
                            {isFrozen && (
                              <div className="supervisor-plan-admin-frozen-message">
                                This task is suspended and frozen. No edits
                                allowed.
                              </div>
                            )}
                            <div
                              className={`supervisor-plan-admin-edit-section ${
                                isFrozen
                                  ? "supervisor-plan-admin-edit-section-disabled"
                                  : ""
                              }`}
                            >
                              <label>
                                Project:{" "}
                                <select
                                  value={task.project_id || ""}
                                  onChange={(e) =>
                                    updateTaskField(
                                      task.task_id,
                                      "project",
                                      e.target.value
                                    )
                                  }
                                  disabled={isFrozen}
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
                                Update:{" "}
                                <select
                                  value={task.sup_status || "incomplete"}
                                  onChange={(e) =>
                                    updateTaskField(
                                      task.task_id,
                                      "sup_status",
                                      e.target.value
                                    )
                                  }
                                  disabled={isFrozen}
                                >
                                  <option value="completed">Completed</option>
                                  <option value="add on">Add On</option>
                                  <option value="re-work">Re-work</option>
                                  <option value="incomplete">Incomplete</option>
                                </select>
                              </label>
                              <label>
                                Feedback:{" "}
                                <input
                                  type="text"
                                  value={task.sup_comment || ""}
                                  onChange={(e) =>
                                    updateTaskField(
                                      task.task_id,
                                      "sup_comment",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Add comment"
                                  disabled={isFrozen}
                                />
                              </label>
                              {showReviewSelect && (
                                <label>
                                  Review:{" "}
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
                                    disabled={isFrozen}
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
                                  Updated task:{" "}
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
                                    disabled={isFrozen}
                                  />
                                </label>
                              )}
                              {effectiveReviewStatus !== "pending" && (
                                <label>
                                  Rating:
                                  <div className="supervisor-plan-admin-star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        className={`supervisor-plan-admin-star ${
                                          task.star_rating >= star
                                            ? "filled"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          !isFrozen &&
                                          updateTaskField(
                                            task.task_id,
                                            "star_rating",
                                            star
                                          )
                                        }
                                        style={{
                                          cursor: isFrozen
                                            ? "not-allowed"
                                            : "pointer",
                                        }}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </label>
                              )}
                              <button
                                className="supervisor-plan-admin-update-task-button"
                                onClick={() => saveTaskField(task.task_id)}
                                disabled={isFrozen}
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

export default SupervisorPlanViewerAdmin;
