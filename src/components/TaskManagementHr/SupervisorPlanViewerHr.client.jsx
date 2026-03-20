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
import "./SupervisorPlanViewerHr.css";

const SupervisorPlanViewerHr = () => {
  const { user, hydrated } = useAuth();

  const [hrId, setHrId] = useState(null);
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

  const [alertModal, setAlertModal] = useState({ isVisible: false, message: "" });
  const [configModal, setConfigModal] = useState({
    isVisible: false,
    freezeDaysSupervisor: "",
    freezeDaysEmployee: "",
  });
  const [loadingConfig, setLoadingConfig] = useState(false);

  // ── NEW STATES for Project Types / Visibility ───────────────────────────────
  const [projectVisibilityModal, setProjectVisibilityModal] = useState({
    isVisible: false,
    currentValue: "assigned_only", // fallback default
  });
  // ──────────────────────────────────────────────────────────────────────────────

  const apiHeaders = useMemo(
    () => ({
      "x-employee-id": hrId,
      "x-role": "hr",
      "x-org-id": user?.orgId ?? "",
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
    }),
    [hrId, user?.orgId]
  );

  useEffect(() => {
    if (!hydrated) return;
    if (user?.employeeId) setHrId(String(user.employeeId));
    else setError("HR ID not found. Please log in.");
  }, [user, hydrated]);

  useEffect(() => {
    if (!hrId) return;

    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/employees/all`,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        const empData = Array.isArray(res.data.employees)
          ? res.data.employees.map((emp) => ({
              ...emp,
              employee_id: emp.employee_id?.trim().toUpperCase(),
            }))
          : [];
        setEmployees(empData);
        setError(empData.length === 0 ? "No active employees available." : null);
      } catch (err) {
        setError("Failed to load employees");
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    const fetchHolidays = async () => {
      setLoadingHolidays(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/holidays/all`,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        setHolidays(
          Array.isArray(res.data.holidays) ? res.data.holidays.map(h => h.date) : []
        );
      } catch {
        setHolidays([]);
      } finally {
        setLoadingHolidays(false);
      }
    };

    const fetchApprovedLeaves = async () => {
      setLoadingLeaves(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/leave`,
          { params: { status: "Approved" }, withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        const leaveData = Array.isArray(res.data.data)
          ? res.data.data.map((leave) => ({
              employee_id: leave.employee_id?.trim().toUpperCase(),
              start_date: leave.start_date,
              end_date: leave.end_date,
              h_f_day: leave.H_F_day,
            }))
          : [];
        setApprovedLeaves(leaveData);
      } catch {
        setApprovedLeaves([]);
      } finally {
        setLoadingLeaves(false);
      }
    };

    fetchEmployees();
    fetchHolidays();
    fetchApprovedLeaves();
  }, [hrId, apiHeaders]);

  useEffect(() => {
    if (!hrId) return;

    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor`,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
        );
        const validStatuses = ["not started", "working", "completed", "suspended"];
        const taskData = res.data.success && Array.isArray(res.data.data)
          ? res.data.data.map((task) => ({
              ...task,
              employee_id: task.employee_id?.trim().toUpperCase(),
              emp_status: validStatuses.includes(task.emp_status) ? task.emp_status : "not started",
              week_id: task.week_id,
              project_id: task.project_id,
              project_name: task.project_name,
            }))
          : [];
        setTasks(taskData);
        setError(null);
      } catch (err) {
        setError("Failed to load tasks");
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [hrId, apiHeaders]);

  useEffect(() => {
    if (tasks.length === 0 || selectedWeekId) return;
    const uniqueWeekIds = [...new Set(tasks.map(t => t.week_id))].sort();
    const currentWeekId = getWeekIdForDate(new Date());
    const defaultWeek = uniqueWeekIds.includes(currentWeekId)
      ? currentWeekId
      : uniqueWeekIds[uniqueWeekIds.length - 1] || currentWeekId;
    setSelectedWeekId(defaultWeek);
  }, [tasks]);

  useEffect(() => {
    if (employees.length === 0 || selectedEmployee) return;
    const employeeIdsWithTasks = [...new Set(tasks.map(t => t.employee_id))];
    const preferred = employees.find(e => employeeIdsWithTasks.includes(e.employee_id));
    setSelectedEmployee(preferred ? preferred.employee_id : employees[0]?.employee_id || null);
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

  // ── NEW: Fetch current project visibility setting when hrId is ready ──
  useEffect(() => {
    if (!hrId) return;

    const fetchProjectVisibility = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/org/project-visibility`,
          { withCredentials: true, headers: apiHeaders, timeout: 10000 }
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
  }, [hrId, apiHeaders]);
  // ──────────────────────────────────────────────────────────────────────────────

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/config`,
        { withCredentials: true, headers: apiHeaders }
      );
      const data = res.data.data || {};
      setConfigModal({
        isVisible: true,
        freezeDaysSupervisor: data.freeze_days_supervisor || "",
        freezeDaysEmployee: data.freeze_days_employee || "",
      });
    } catch (err) {
      console.error("Config fetch failed:", err);
      setConfigModal({ isVisible: true, freezeDaysSupervisor: "", freezeDaysEmployee: "" });
    } finally {
      setLoadingConfig(false);
    }
  };

  const updateConfig = async () => {
    const { freezeDaysSupervisor, freezeDaysEmployee } = configModal;
    if (!/^\d+$/.test(freezeDaysSupervisor) || !/^\d+$/.test(freezeDaysEmployee)) {
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
      setConfigModal(prev => ({ ...prev, isVisible: false }));
    } catch (err) {
      showAlert("Failed to update configuration.");
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
          (err.response?.data?.error || err.message || "Unknown error")
      );
    }
  };
  // ──────────────────────────────────────────────────────────────────────────────

  const showAlert = (msg) => {
    setAlertModal({ isVisible: true, message: msg });
    setTimeout(() => setAlertModal({ isVisible: false, message: "" }), 5000);
  };

  const getWeekIdForDate = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const week = getISOWeek(d);
    return `${year}-${String(week).padStart(2, "0")}`;
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
    if (!weekStart || isNaN(weekStart.getTime())) return `Week ${weekId} (Invalid)`;
    const weekEnd = endOfISOWeek(weekStart);
    return `Week ${weekId} (${format(weekStart, "MMM d, yyyy")} - ${format(weekEnd, "MMM d, yyyy")})`;
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
      case "completed": return "#28a745";
      case "working":   return "#3770ecff";
      case "not started": return "#888";
      case "suspended": return "#dc3545";
      default: return "#007bff";
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case "completed": return "Completed";
      case "working":   return "Working";
      case "not started": return "Not Started";
      case "suspended": return "Suspended";
      default: return "Unknown";
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
    if (!dateString) return { className: "supervisor-plan-hr-task-date-regular", tooltip: "N/A" };

    const taskDate = new Date(dateString);
    taskDate.setHours(0, 0, 0, 0);

    const isApprovedLeave = approvedLeaves.some((leave) => {
      if (leave.employee_id !== employeeId) return false;
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      const isHalf = leave.h_f_day?.toLowerCase().includes("half");
      if (isHalf) return taskDate.getTime() === start.getTime();
      return taskDate.getTime() >= start.getTime() && taskDate.getTime() <= end.getTime();
    });

    const isSunday  = taskDate.getDay() === 0;
    const isHoliday = holidays.some(h => new Date(h).toDateString() === taskDate.toDateString());

    if (isApprovedLeave) return { className: "supervisor-plan-hr-task-date-leave", tooltip: "Leave" };
    if (isHoliday)      return { className: "supervisor-plan-hr-task-date-holiday", tooltip: "Holiday" };
    if (isSunday)       return { className: "supervisor-plan-hr-task-date-sunday", tooltip: "Sunday" };
    return { className: "supervisor-plan-hr-task-date-regular", tooltip: formatDate(dateString) };
  };

  const getReviewStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return { color: "#28a745", label: "Approved", icon: "✅" };
      case "struck":
        return { color: "#ffc107", label: "Replaced-new", icon: "⚠️" };
      case "suspended_review":
        return { color: "#dc3545", label: "Suspended", icon: "⛔" };
      default:
        return { color: "#6c757d", label: "Pending", icon: "⏳" };
    }
  };

  const weekIds = useMemo(() => [...new Set(tasks.map(t => t.week_id))].sort(), [tasks]);
  const currentWeekIndex = useMemo(() => weekIds.indexOf(selectedWeekId), [weekIds, selectedWeekId]);

  const tasksByDate = useMemo(() => {
    const map = {};
    weekDays.forEach(({ dateStr }) => map[dateStr] = []);
    if (selectedEmployee && selectedWeekId) {
      tasks.forEach(task => {
        if (task.employee_id === selectedEmployee && task.week_id === selectedWeekId) {
          const dateStr = format(parseISO(task.task_date), "yyyy-MM-dd");
          if (map[dateStr]) map[dateStr].push(task);
        }
      });
    }
    return map;
  }, [tasks, selectedEmployee, selectedWeekId, weekDays]);

  const filteredEmployees = useMemo(() =>
    employees.filter(emp => emp.employee_name?.toLowerCase().includes(searchQuery.toLowerCase())),
  [employees, searchQuery]);

  const goToPreviousWeek = () => {
    if (currentWeekIndex > 0) setSelectedWeekId(weekIds[currentWeekIndex - 1]);
  };

  const goToNextWeek = () => {
    if (currentWeekIndex < weekIds.length - 1)
      setSelectedWeekId(weekIds[currentWeekIndex + 1]);
  };

  if (!hydrated) return <div className="supervisor-plan-hr-wrapper">Loading...</div>;

  if (!user) return (
    <div className="supervisor-plan-hr-wrapper">
      <div className="supervisor-plan-hr-error-message">
        Please <a href="/login">log in</a>.
      </div>
    </div>
  );

  if (!hrId) return (
    <div className="supervisor-plan-hr-wrapper">
      <div className="supervisor-plan-hr-error-message">
        {error || "HR ID missing."} <a href="/login">Log in again</a>.
      </div>
    </div>
  );

  return (
    <div className="supervisor-plan-hr-wrapper">

      <Modal
        isVisible={alertModal.isVisible}
        onClose={() => setAlertModal({ isVisible: false, message: "" })}
        buttons={[{ label: "OK", onClick: () => setAlertModal({ isVisible: false, message: "" }) }]}
      >
        <p>{alertModal.message}</p>
      </Modal>

      {configModal.isVisible && (
        <div
          className="supervisor-plan-hr-modal-overlay"
          onClick={() => setConfigModal(prev => ({ ...prev, isVisible: false }))}
        >
          <form
            className="supervisor-plan-hr-modal"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="supervisor-plan-hr-modal-title">Update Freeze Days</h3>
            <div className="supervisor-plan-hr-config-modal-content">
              <div className="supervisor-plan-hr-config-input-group">
                <label className="supervisor-plan-hr-config-label">
                  Supervisor Freeze Days
                  <input
                    type="number"
                    min="0"
                    value={configModal.freezeDaysSupervisor}
                    onChange={e => setConfigModal(prev => ({ ...prev, freezeDaysSupervisor: e.target.value }))}
                    disabled={loadingConfig}
                    className="supervisor-plan-hr-config-input"
                  />
                </label>
                <label className="supervisor-plan-hr-config-label">
                  Employee Freeze Days
                  <input
                    type="number"
                    min="0"
                    value={configModal.freezeDaysEmployee}
                    onChange={e => setConfigModal(prev => ({ ...prev, freezeDaysEmployee: e.target.value }))}
                    disabled={loadingConfig}
                    className="supervisor-plan-hr-config-input"
                  />
                </label>
              </div>
            </div>
            <div className="supervisor-plan-hr-modal-buttons">
              <button
                type="button"
                className="supervisor-plan-hr-modal-button supervisor-plan-hr-modal-button-cancel"
                onClick={() => setConfigModal(prev => ({ ...prev, isVisible: false }))}
                disabled={loadingConfig}
              >
                Cancel
              </button>
              <button
                type="button"
                className="supervisor-plan-hr-modal-button supervisor-plan-hr-modal-button-save"
                onClick={updateConfig}
                disabled={loadingConfig}
              >
                {loadingConfig ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── NEW: Project Visibility Modal ──────────────────────────────────────── */}
      {projectVisibilityModal.isVisible && (
        <div
          className="supervisor-plan-hr-modal-overlay"
          onClick={() => setProjectVisibilityModal((prev) => ({ ...prev, isVisible: false }))}
        >
          <div
            className="supervisor-plan-hr-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px", padding: "24px" }}
          >
            <h3 className="supervisor-plan-hr-modal-title">
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

            <div className="supervisor-plan-hr-modal-buttons">
              <button
                type="button"
                className="supervisor-plan-hr-modal-button supervisor-plan-hr-modal-button-cancel"
                onClick={() => setProjectVisibilityModal((prev) => ({ ...prev, isVisible: false }))}
              >
                Cancel
              </button>
              <button
                type="button"
                className="supervisor-plan-hr-modal-button supervisor-plan-hr-modal-button-save"
                onClick={saveProjectVisibility}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ────────────────────────────────────────────────────────────────────────────── */}

      {/* <div
        className="supervisor-plan-hr-header"
        style={{ display: "flex", alignItems: "center", gap: "12px" }}
      >
        <button
          className="supervisor-plan-hr-config-button"
          onClick={fetchConfig}
          disabled={loadingConfig}
        >
          {loadingConfig ? "Loading..." : "Update Freeze Days"}
        </button>

        <button
          className="supervisor-plan-hr-config-button"
          onClick={() =>
            setProjectVisibilityModal((prev) => ({ ...prev, isVisible: true }))
          }
        >
          Project Types
        </button>
      </div> */}
  <div
  className="supervisor-plan-hr-header"
  style={{ display: "flex", alignItems: "center", gap: "12px" }}
>
  <button
    className="supervisor-plan-hr-config-button"
    onClick={fetchConfig}
    disabled={loadingConfig}
  >
    {loadingConfig ? "Loading..." : "Update Freeze Days"}
  </button>

  <button
    className="supervisor-plan-hr-config-button"
    onClick={() =>
      setProjectVisibilityModal((prev) => ({ ...prev, isVisible: true }))
    }
  >
    Project Types
  </button>
</div>
      <div className="supervisor-plan-hr-employee-list">
        <h3>Employees</h3>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search employees by name"
          className="supervisor-plan-hr-search-bar"
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loadingEmployees || loadingHolidays || loadingLeaves ? (
          <p>Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p>No employees match the search criteria.</p>
        ) : (
          <ul className="supervisor-plan-hr-employee-scroll">
            {filteredEmployees.map(emp => (
              <li
                key={emp.employee_id}
                className={selectedEmployee === emp.employee_id ? "supervisor-plan-hr-active" : ""}
                onClick={() => setSelectedEmployee(emp.employee_id)}
              >
                {emp.employee_name || emp.employee_id}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="supervisor-plan-hr-task-details">
        {loadingTasks || loadingProjects ? (
          <p>Loading tasks or projects...</p>
        ) : selectedEmployee === null ? (
          <p>Select an employee to view tasks</p>
        ) : weekIds.length === 0 ? (
          <p>No tasks assigned for this employee.</p>
        ) : (
          <>
            <div className="supervisor-plan-hr-week-navigation">
              <button
                className="supervisor-plan-hr-nav-button"
                onClick={goToPreviousWeek}
                disabled={currentWeekIndex <= 0}
              >
                &lt;
              </button>
              <span className="supervisor-plan-hr-week-label">
                {formatWeekId(selectedWeekId)}
              </span>
              <button
                className="supervisor-plan-hr-nav-button"
                onClick={goToNextWeek}
                disabled={currentWeekIndex >= weekIds.length - 1}
              >
                &gt;
              </button>
            </div>

            <div className="supervisor-plan-hr-tasks-container">
              {weekDays.map(({ dateStr, dateDisplay }) => {
                const dayTasks = tasksByDate[dateStr] || [];
                const sample = dayTasks[0] || { task_date: dateStr, employee_id: selectedEmployee };
                const dateStyle = getTaskDateStyle(sample.task_date, selectedEmployee);

                return (
                  <div key={dateStr} className="supervisor-plan-hr-day-group">
                    <div className="supervisor-plan-hr-day-header">
                      <span className={dateStyle.className} title={dateStyle.tooltip}>
                        {dateDisplay}
                      </span>
                    </div>

                    {dayTasks.length === 0 ? (
                      <p className="supervisor-plan-hr-no-tasks">No tasks assigned for this day.</p>
                    ) : (
                      dayTasks.map(task => {
                        const taskDateStyle = getTaskDateStyle(task.task_date, task.employee_id);
                        const review = getReviewStyle(task.sup_review_status);

                        return (
                          <div key={task.task_id} className="supervisor-plan-hr-task-card">
                            <div className="supervisor-plan-hr-task-header">
                              <div className="supervisor-plan-hr-task-title">
                                {task.task_name}
                              </div>
                              <div className="supervisor-plan-hr-task-meta">
                                <span className={taskDateStyle.className} title={taskDateStyle.tooltip}>
                                  {formatDate(task.task_date)}
                                </span>
                                <div className="supervisor-plan-hr-project-circle-wrapper">
                                  <span className="supervisor-plan-hr-project-circle">
                                    {task.project_id || "N/A"}
                                  </span>
                                  <div className="supervisor-plan-hr-tooltip">
                                    {task.project_name || "Unknown"}
                                  </div>
                                </div>
                                <div className="supervisor-plan-hr-status-dot-wrapper">
                                  <span
                                    className="supervisor-plan-hr-status-dot"
                                    style={{ backgroundColor: statusColor(task.emp_status) }}
                                  />
                                  <div className="supervisor-plan-hr-tooltip">
                                    {statusLabel(task.emp_status)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="supervisor-plan-hr-task-body">
                              <p>
                                <strong>Employee Update:</strong> {task.emp_comment || "—"}
                              </p>
                            </div>

                            <div className="supervisor-plan-hr-review-section">
                              <div
                                className="review-status-line"
                                style={{
                                  color: review.color,
                                  fontWeight: 600,
                                  marginBottom: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px"
                                }}
                              >
                                <span style={{ fontSize: "1.2em" }}>{review.icon}</span>
                                Review: {review.label}
                              </div>
                              {task.sup_review_status === "struck" && task.replacement_task && (
                                <p style={{ color: "#d35400", marginTop: "6px" }}>
                                  <strong>Replacement Task:</strong> {task.replacement_task}
                                </p>
                              )}
                              <p>
                                <strong>Supervisor Decision:</strong> {task.sup_status || "—"}
                              </p>
                              <p>
                                <strong>Supervisor Comment:</strong> {task.sup_comment || "—"}
                              </p>
                              <p>
                                <strong>Rating:</strong>{" "}
                                {task.star_rating ? "★".repeat(task.star_rating) : "—"}
                              </p>
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

export default SupervisorPlanViewerHr;