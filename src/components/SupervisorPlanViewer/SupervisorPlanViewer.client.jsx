

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  getISOWeek,
  startOfISOWeek,
  endOfISOWeek,
  format,
  parseISO,
  addDays,
} from 'date-fns';
import Modal from '../Modal/Modal.client';
import { useAuth } from '../../context/AuthProvider.client';
import './SupervisorPlanViewer.css';

const SupervisorPlanViewer = () => {
  const { user, hydrated } = useAuth();

  // ────────────────────── 1. ALL STATE HOOKS ──────────────────────
  const [supervisorId, setSupervisorId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [alertModal, setAlertModal] = useState({ isVisible: false, message: '' });
  const [freezeDays, setFreezeDays] = useState(3);
  const [pendingReviewChanges, setPendingReviewChanges] = useState({});

  // ────────────────────── 2. SET SUPERVISOR ID FROM USER ──────────────────────
  useEffect(() => {
    if (!hydrated) return;
    if (user?.employeeId) {
      const id = String(user.employeeId).trim().toUpperCase();
      setSupervisorId(id);
      console.log('supervisorId set →', id);
    } else {
      setError('User not logged in or employeeId missing.');
    }
  }, [user, hydrated]);

  // ────────────────────── 3. CENTRALIZED HEADERS ──────────────────────
  const apiHeaders = useMemo(() => {
    if (!supervisorId) return null;
    return {
      'x-employee-id': supervisorId,
      'x-role': user?.role || 'Supervisor',
      'x-org-id': 161,
      'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
    };
  }, [supervisorId, user?.role]);

  // ────────────────────── 4. FETCH EMPLOYEES, HOLIDAYS, FREEZE DAYS ──────────────────────
  useEffect(() => {
    if (!supervisorId || !apiHeaders) return;

    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/supervisor/employees`,
          { headers: apiHeaders, timeout: 10000 }
        );
        const empData = Array.isArray(response.data.employees)
          ? response.data.employees.map((emp) => ({
              ...emp,
              employee_id: emp.employee_id?.trim().toUpperCase(),
            }))
          : [];
        setEmployees(empData);
        setSelectedEmployee(empData[0]?.employee_id || null);
        setError(empData.length === 0 ? 'No employees assigned to you.' : null);
      } catch (err) {
        const errorMessage =
          err.response?.status
            ? `Error ${err.response.status}: ${err.response.data?.error || err.response.statusText}`
            : err.code === 'ECONNABORTED'
            ? 'Request timed out'
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
          { headers: apiHeaders, timeout: 10000 }
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
          { headers: apiHeaders, timeout: 10000 }
        );

        let cfgArray = [];

        if (Array.isArray(response.data)) {
          cfgArray = response.data;
        } else if (Array.isArray(response.data?.data)) {
          cfgArray = response.data.data;
        } else if (response.data?.data && typeof response.data.data === 'object') {
          cfgArray = Object.entries(response.data.data).map(([k, v]) => ({
            key: k,
            value: String(v),
          }));
        }

        const cfg = cfgArray.find((c) => c.key === 'freeze_days_supervisor');
        const days = cfg ? parseInt(cfg.value, 10) : NaN;

        setFreezeDays(isNaN(days) ? 3 : days);
        console.log('Freeze days loaded:', isNaN(days) ? 3 : days);
      } catch (err) {
        console.error('fetchFreezeDays error:', err.response?.data || err.message);
        setFreezeDays(3);
      }
    };

    fetchEmployees();
    fetchHolidays();
    fetchFreezeDays();
  }, [supervisorId, apiHeaders]);

  // ────────────────────── 5. FETCH LEAVES ──────────────────────
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
              headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' },
              timeout: 10000,
            }
          );
          leavesMap[emp.employee_id] = Array.isArray(response.data.data)
            ? response.data.data.filter((leave) => leave.status === 'Approved')
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

  // ────────────────────── 6. FETCH TASKS ──────────────────────
  useEffect(() => {
    if (!supervisorId || !apiHeaders) return;

    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/${supervisorId}`,
          { headers: apiHeaders, timeout: 10000 }
        );
        const validStatuses = ['not started', 'working', 'completed', 'suspended'];
        const taskData =
          res.data.success && Array.isArray(res.data.data)
            ? res.data.data.map((task) => ({
                ...task,
                employee_id: task.employee_id?.trim().toUpperCase(),
                emp_status: validStatuses.includes(task.emp_status)
                  ? task.emp_status
                  : 'not started',
                week_id: Number(task.week_id),
              }))
            : [];
        setTasks(taskData);
        if (taskData.length > 0) {
          const weekIds = [...new Set(taskData.map((t) => t.week_id))].sort(
            (a, b) => a - b
          );
          setSelectedWeekId(weekIds[weekIds.length - 1]);
        }
        setError(null);
      } catch (err) {
        const errorMessage =
          err.response?.status
            ? `Error ${err.response.status}: ${err.response.data?.error || err.response.statusText}`
            : err.code === 'ECONNABORTED'
            ? 'Request timed out'
            : `Network error: ${err.message}`;
        setError(errorMessage);
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [supervisorId, apiHeaders]);

  // ────────────────────── 7. FETCH PROJECTS ──────────────────────
  useEffect(() => {
    if (!supervisorId || !selectedEmployee) return;

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/employeeProjects`,
          {
            params: { employeeId: selectedEmployee },
            headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' },
            timeout: 10000,
          }
        );
        const newProjects = {};
        (response.data.projects || []).forEach((project) => {
          newProjects[project.id] = project.project;
        });
        setProjects(newProjects);
        setError(null);
      } catch {
        setProjects({});
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [supervisorId, selectedEmployee]);

  // ────────────────────── 8. useMemo ──────────────────────
  const weekIds = useMemo(() => {
    return [...new Set(tasks.map((t) => t.week_id))].sort((a, b) => a - b);
  }, [tasks]);

  const currentWeekIndex = useMemo(() => {
    return weekIds.indexOf(selectedWeekId);
  }, [weekIds, selectedWeekId]);

  const weekDays = useMemo(() => {
    if (!selectedWeekId) return [];
    const currentYear = new Date().getFullYear();
    const weekStartDate = startOfISOWeek(new Date(currentYear, 0, 1));
    const adjustedStart = addDays(weekStartDate, (selectedWeekId - 1) * 7);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(adjustedStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dateDisplay = format(date, 'MMM d');
      days.push({ dateStr, dateDisplay });
    }
    return days;
  }, [selectedWeekId]);

  const tasksByDate = useMemo(() => {
    const map = {};
    weekDays.forEach(({ dateStr }) => (map[dateStr] = []));
    if (selectedEmployee && selectedWeekId) {
      tasks.forEach((task) => {
        if (task.employee_id === selectedEmployee && task.week_id === selectedWeekId) {
          const taskDateStr = format(parseISO(task.task_date), 'yyyy-MM-dd');
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

  // ────────────────────── 9. UTILS ──────────────────────
  const showAlert = (message) => {
    setAlertModal({ isVisible: true, message });
    setTimeout(() => setAlertModal({ isVisible: false, message: '' }), 5000);
  };

  const formatWeekId = (weekId) => {
    if (!weekId) return 'N/A';
    const currentYear = new Date().getFullYear();
    const startDate = startOfISOWeek(new Date(currentYear, 0, 1));
    const weekStart = new Date(
      startDate.getTime() + (weekId - 1) * 7 * 24 * 60 * 60 * 1000
    );
    const weekEnd = endOfISOWeek(weekStart);
    return `Week ${weekId} (${format(weekStart, 'MMM d, yyyy')} - ${format(
      weekEnd,
      'MMM d, yyyy'
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
    if (value === 'pending') {
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
          if (field === 'project') {
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
      showAlert('Task not found');
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

    if (task.sup_review_status === 'suspended_review') {
      showAlert('This task is suspended and cannot be updated.');
      return;
    }

    try {
      const updateData = {
        sup_status: task.sup_status || 'incomplete',
        sup_comment: task.sup_comment || '',
        sup_review_status: effectiveReviewStatus || 'pending',
        replacement_task: task.replacement_task || null,
        star_rating: task.star_rating || 0,
        project_id: task.project_id,
        project_name: task.project_name,
      };

      if (task.sup_status === 're-work') {
        let taskDate = new Date(task.task_date || new Date());
        taskDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(taskDate);
        nextDay.setDate(taskDate.getDate() + 1);
        const nextDayString = nextDay.toLocaleDateString('en-CA');

        if (!isDateEditable(nextDayString)) {
          showAlert(
            `Cannot create re-work: Next day is outside the ${freezeDays}-day window.`
          );
          return;
        }

        const nextDayWeekId = getISOWeek(nextDay);
        const newTaskName = task.replacement_task || task.task_name;

        const newTaskData = {
          week_id: nextDayWeekId,
          task_date: nextDayString,
          project_id: task.project_id,
          project_name: task.project_name,
          task_name: newTaskName,
          employee_id: task.employee_id,
          emp_status: 'not started',
          sup_status: 'incomplete',
          emp_comment: null,
          sup_comment: null,
          sup_review_status: 'pending',
          star_rating: 0,
          parent_task_id: task.task_id,
        };

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor`,
          newTaskData,
          { headers: apiHeaders, timeout: 10000 }
        );

        updateData.sup_status = 're-work';
        await axios.put(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/${taskId}`,
          updateData,
          { headers: apiHeaders, timeout: 10000 }
        );

        showAlert(response.data.message || 'New task created successfully');
        if (response.data.newTask) {
          const newTask = {
            ...response.data.newTask,
            employee_name:
              employees.find(
                (emp) => emp.employee_id === response.data.newTask.employee_id
              )?.employee_name || 'Unknown',
            employee_id: response.data.newTask.employee_id
              ?.trim()
              .toUpperCase(),
            emp_status: response.data.newTask.emp_status || 'not started',
            week_id: Number(response.data.newTask.week_id),
          };
          setTasks((prev) => [...prev, newTask]);
          const newTaskWeek = newTask.week_id;
          if (
            newTaskWeek &&
            newTaskWeek !== selectedWeekId
          ) {
            setSelectedWeekId(newTaskWeek);
          }
        }
      } else {
        await axios.put(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/${taskId}`,
          updateData,
          { headers: apiHeaders, timeout: 10000 }
        );
        showAlert('Task updated successfully');
      }

      setPendingReviewChanges((prev) => {
        const newPrev = { ...prev };
        delete newPrev[taskId];
        return newPrev;
      });

      // Refresh tasks
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/weekly_task_supervisor/${supervisorId}`,
        { headers: apiHeaders, timeout: 10000 }
      );
      const validStatuses = ['not started', 'working', 'completed', 'suspended'];
      const taskData =
        res.data.success && Array.isArray(res.data.data)
          ? res.data.data.map((task) => ({
              ...task,
              employee_id: task.employee_id?.trim().toUpperCase(),
              emp_status: validStatuses.includes(task.emp_status)
                ? task.emp_status
                : 'not started',
              week_id: Number(task.week_id),
            }))
          : [];
      setTasks(taskData);
    } catch (err) {
      const errorMessage =
        err.response?.status
          ? `Error ${err.response.status}: ${err.response.data?.error || err.response.statusText}`
          : err.code === 'ECONNABORTED'
          ? 'Request timed out'
          : `Network error: ${err.message}`;
      showAlert(`Failed to update task: ${errorMessage}`);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'working': return '#3770ecff';
      case 'not started': return '#888';
      case 'suspended': return '#dc3545';
      default: return '#007bff';
    }
  };

  const getReviewStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'struck': return '#ffc107';
      case 'suspended_review': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'working': return 'Working';
      case 'not started': return 'Not Started';
      case 'suspended': return 'Suspended';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTaskDateStyle = (dateString, employeeId) => {
    if (!dateString)
      return {
        className: 'supervisor-plan-task-date supervisor-plan-task-date-regular',
        tooltip: 'N/A',
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
        className: 'supervisor-plan-task-date supervisor-plan-task-date-leave',
        tooltip: 'Leave',
      };
    if (isHoliday)
      return {
        className: 'supervisor-plan-task-date supervisor-plan-task-date-holiday',
        tooltip: 'Holiday',
      };
    if (isSunday)
      return {
        className: 'supervisor-plan-task-date supervisor-plan-task-date-sunday',
        tooltip: 'Sunday',
      };
    return {
      className: 'supervisor-plan-task-date supervisor-plan-task-date-regular',
      tooltip: formatDate(dateString),
    };
  };

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

  // ────────────────────── 10. EARLY RETURNS ──────────────────────
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
          {error || 'Supervisor ID missing.'}{' '}
          <a href="/login">Log in again</a>.
        </div>
      </div>
    );

  // ────────────────────── 11. RENDER ──────────────────────
  return (
    <div className="supervisor-plan-wrapper">
      <Modal
        isVisible={alertModal.isVisible}
        onClose={() => setAlertModal({ isVisible: false, message: '' })}
        buttons={[
          {
            label: 'OK',
            onClick: () => setAlertModal({ isVisible: false, message: '' }),
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
                    style={{ padding: '8px', fontSize:'11px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}

        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loadingEmployees || loadingHolidays || loadingLeaves ? (
          <p>Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p>No employees match the search criteria.</p>
        ) : (
          <ul className="supervisor-plan-employee-scroll">
            {filteredEmployees.map((emp) => (
              <li
                key={emp.employee_id}
                className={
                  selectedEmployee === emp.employee_id
                    ? 'supervisor-plan-active'
                    : ''
                }
                onClick={() => setSelectedEmployee(emp.employee_id)}
              >
                {emp.employee_name}
              </li>
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
                          task.sup_review_status === 'suspended_review';
                        const showReviewSelect =
                          task.sup_review_status === 'pending' &&
                          !pendingReviewChanges[task.task_id];
                        return (
                          <div
                            key={task.task_id}
                            className={`supervisor-plan-task-card ${
                              (!editable || isFrozen)
                                ? 'supervisor-plan-task-frozen'
                                : ''
                            }`}
                          >
                            <div className="supervisor-plan-task-header">
                              <div className="supervisor-plan-task-title">
                                {effectiveReviewStatus === 'struck' ? (
                                  <>
                                    <span
                                      style={{
                                        textDecoration: 'line-through',
                                        color: '#a0a0a0',
                                      }}
                                    >
                                      {task.task_name}
                                    </span>
                                    {task.replacement_task && (
                                      <span
                                        style={{
                                          color: '#007bff',
                                          marginLeft: '8px',
                                        }}
                                      >
                                        Right arrow {task.replacement_task}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  task.task_name
                                )}
                              </div>
                              <div className="supervisor-plan-task-meta">
                                {effectiveReviewStatus !== 'pending' && (
                                  <span className="supervisor-plan-status-icon">
                                    {effectiveReviewStatus === 'approved' && '✅'}
                               {effectiveReviewStatus === 'struck' && '📝'}
                              {effectiveReviewStatus === 'suspended_review' && '⛔'}
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
                                <strong>Emp-Update:</strong>{' '}
                                {task.emp_comment || '-'}
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
                                  value={task.project_id || ''}
                                  onChange={(e) =>
                                    updateTaskField(
                                      task.task_id,
                                      'project',
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
                                  value={task.sup_status || 'incomplete'}
                                  onChange={(e) =>
                                    updateTaskField(
                                      task.task_id,
                                      'sup_status',
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
                              <label>
                                Feedback:
                                <input
                                  type="text"
                                  value={task.sup_comment || ''}
                                  onChange={(e) =>
                                    updateTaskField(
                                      task.task_id,
                                      'sup_comment',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Add comment"
                                  disabled={!editable || isFrozen}
                                />
                              </label>
                              {showReviewSelect && (
                                <label>
                                  Review:
                                  <select
                                    value={task.sup_review_status || 'pending'}
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
                              {effectiveReviewStatus === 'struck' && (
                                <label>
                                  Updated task:
                                  <input
                                    type="text"
                                    value={task.replacement_task || ''}
                                    onChange={(e) =>
                                      updateTaskField(
                                        task.task_id,
                                        'replacement_task',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter updated task"
                                    disabled={!editable || isFrozen}
                                  />
                                </label>
                              )}
                              {effectiveReviewStatus !== 'pending' && (
                                <label>
                                  Rating:
                                  <div className="supervisor-plan-star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        className={`supervisor-plan-star ${
                                          task.star_rating >= star
                                            ? 'filled'
                                            : ''
                                        }`}
                                        onClick={() =>
                                          (editable && !isFrozen) &&
                                          updateTaskField(
                                            task.task_id,
                                            'star_rating',
                                            star
                                          )
                                        }
                                        style={{
                                          cursor:
                                            editable && !isFrozen
                                              ? 'pointer'
                                              : 'not-allowed',
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