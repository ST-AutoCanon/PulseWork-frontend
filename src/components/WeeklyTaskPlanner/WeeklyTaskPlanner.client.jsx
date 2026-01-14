"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./WeeklyTaskPlanner.css";
import Modal from "../Modal/Modal.client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MdMic, MdMicNone } from "react-icons/md";

const WeeklyTaskPlanner = ({
  userRole = "employee",
  employeeId,
  userContext,
}) => {
  if (!userContext) {
    return (
      <div className="weekly-planner-container">
        <div className="weekly-loading">Loading user session…</div>
      </div>
    );
  }

  const authRequest = async (config) => {
    return axios({
      ...config,
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
      withCredentials: true,
      headers: {
        "x-employee-id": userContext.employeeId,
        "x-role": userContext.role,
        ...(userContext.orgId && { "x-org-id": userContext.orgId }),
        "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
        ...config.headers,
      },
    });
  };

  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const offsetToMonday = (dayOfWeek + 6) % 7;
  const startOfCurrentWeek = new Date(today);
  startOfCurrentWeek.setDate(today.getDate() - offsetToMonday);

  const startDate = new Date(startOfCurrentWeek);
  startDate.setDate(startOfCurrentWeek.getDate() + weekOffset * 7);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const formatDateRange = (start, end) => {
    const startDay = start.getDate();
    const startMonth = start.toLocaleString("default", { month: "short" });
    const endDay = end.getDate();
    const endMonth = end.toLocaleString("default", { month: "short" });
    const year = start.getFullYear();
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  };

  const dateRange = formatDateRange(startDate, endDate);

  const getISOWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-${String(weekNo).padStart(2, "0")}`;
  };

  const weekId = getISOWeekNumber(startDate);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = `${d.getDate()} ${d.toLocaleString("default", {
      month: "short",
    })}`;
    weekDates.push(dateStr);
  }
  const [tasksData, setTasksData] = useState(
    weekDates.map((date) => ({ date, tasks: [] }))
  );
  const [projects, setProjects] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [expandedDates, setExpandedDates] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [editingSupStatus, setEditingSupStatus] = useState(null);
  const [formData, setFormData] = useState({
    taskName: "",
    status: "",
    comment: "",
  });
  const [supFormData, setSupFormData] = useState({
    supStatus: "",
    supComment: "",
  });
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignTasks, setAssignTasks] = useState([]);
  const [supReviewMode, setSupReviewMode] = useState(false);
  const [strikeTaskId, setStrikeTaskId] = useState(null);
  const [replacementData, setReplacementData] = useState({
    projectId: "",
    projectName: "",
    taskName: "",
    date: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [error, setError] = useState(null);
  const [noTasks, setNoTasks] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [freezeDays, setFreezeDays] = useState(0);
  const [orgFreezeDays, setOrgFreezeDays] = useState(0);
  const [mobileTooltip, setMobileTooltip] = useState({
    isVisible: false,
    content: "",
    position: { x: 0, y: 0 },
    dotId: null,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const tooltipRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [assignListeningIndex, setAssignListeningIndex] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isMobile &&
        mobileTooltip.isVisible &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target)
      ) {
        setMobileTooltip({
          isVisible: false,
          content: "",
          position: { x: 0, y: 0 },
          dotId: null,
        });
      }
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileTooltip.isVisible, isMobile]);

  const handleTooltipClick = (e, content, dotId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMobile) return;
    const rect = e.target.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const tooltipX = rect.left + rect.width / 2 + scrollX;
    const tooltipY = rect.top - 40 + scrollY;
    setMobileTooltip((prev) => ({
      isVisible: prev.dotId === dotId ? false : true,
      content,
      position: { x: tooltipX, y: tooltipY },
      dotId: prev.dotId === dotId ? null : dotId,
    }));
  };

  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const toggleDropdown = (index) => {
    setDropdownOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const withRetry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
      }
    }
  };

  const formatDateIST = (date) => {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(istDate.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const effectiveFreezeDays = freezeDays;

  const isTaskEditable = (taskDate) => {
    if (!taskDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const task = new Date(taskDate);
    task.setHours(0, 0, 0, 0);

    const diffDays = (today - task) / (1000 * 3600 * 24);

    if (diffDays < 0) return true;

    if (diffDays === 0) return true;

    return diffDays <= effectiveFreezeDays;
  };

  const getTaskDateStyle = (dateStr) => {
    const [day, month] = dateStr.split(" ");
    const year = startDate.getFullYear();
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const taskDate = new Date(year, monthIndex, parseInt(day));
    taskDate.setHours(0, 0, 0, 0);

    const isApprovedLeave = approvedLeaves.some((leave) => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return taskDate >= start && taskDate <= end;
    });

    const isSunday = taskDate.getDay() === 0;
    const isHoliday = holidays.some(
      (h) => new Date(h).toDateString() === taskDate.toDateString()
    );

    if (isApprovedLeave)
      return {
        className: "week-task-day-date week-task-day-date-leave",
        tooltip: "Leave",
      };
    if (isHoliday)
      return {
        className: "week-task-day-date week-task-day-date-holiday",
        tooltip: "Holiday",
      };
    if (isSunday)
      return {
        className: "week-task-day-date week-task-day-date-sunday",
        tooltip: "Sunday",
      };
    return {
      className: "week-task-day-date week-task-day-date-regular",
      tooltip: dateStr,
    };
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      showAlert("Speech Recognition is not supported in this browser.");
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "en-IN";
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData((prev) => ({
        ...prev,
        comment: prev.comment ? prev.comment + " " + transcript : transcript,
      }));
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  const startAssignListening = (index) => {
    if (!("webkitSpeechRecognition" in window)) {
      showAlert("Speech Recognition is not supported in this browser.");
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "en-IN";
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setAssignListeningIndex(index);
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAssignTasks((prev) =>
        prev.map((task, i) =>
          i === index
            ? { ...task, taskName: task.taskName + " " + transcript }
            : task
        )
      );
    };
    recognitionRef.current.onerror = () => setAssignListeningIndex(null);
    recognitionRef.current.onend = () => setAssignListeningIndex(null);

    recognitionRef.current.start();
  };

  const stopAssignListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setAssignListeningIndex(null);
  };

  const fetchData = async () => {
    if (!employeeId) {
      showAlert("Employee ID is required to fetch data.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadingHolidays(true);
    setLoadingLeaves(true);
    setError(null);
    setNoTasks(false);
    try {
      const cfg = await withRetry(() =>
        authRequest({ method: "GET", url: "/api/config" })
      );

      const configObj = cfg.data?.data ?? {};

      const freezeValue = configObj.freeze_days_employee ?? 0;
      let finalDays = Number(freezeValue);
      if (isNaN(finalDays) || finalDays < 0) finalDays = 0;

      setFreezeDays(finalDays);
      setOrgFreezeDays(userContext.orgId ? finalDays : 0);

      const hol = await withRetry(() =>
        authRequest({
          method: "GET",
          url: "/api/weekly_task_supervisor/holidays/all",
        })
      );
      const holidayList = Array.isArray(hol.data.holidays)
        ? hol.data.holidays.map((h) => h.date)
        : [];
      setHolidays(holidayList.length > 0 ? holidayList : ["2025-12-25"]);

      const lv = await withRetry(() =>
        authRequest({ method: "GET", url: `/employee/leave/${employeeId}` })
      );
      const approved = Array.isArray(lv.data.data)
        ? lv.data.data.filter((l) => l.status === "Approved")
        : [];
      setApprovedLeaves(approved);

      const proj = await withRetry(() =>
        authRequest({
          method: "GET",
          url: "/projects/employeeProjects",
          params: { employeeId },
        })
      );
      const projMap = {};
      (proj.data.projects || []).forEach((p) => (projMap[p.id] = p.project));
      setProjects(projMap);

      const tsk = await withRetry(() =>
        authRequest({
          method: "GET",
          url: `/api/week_tasks/employee/${employeeId}`,
        })
      );
      const tasks = Array.isArray(tsk.data) ? tsk.data : [];

      if (tasks.length === 0) {
        setNoTasks(true);
        setTasksData(weekDates.map((d) => ({ date: d, tasks: [] })));
        return;
      }

      const filtered = tasks.filter((t) => t.week_id === weekId);
      const grouped = weekDates.map((date) => ({
        date,
        tasks: filtered.filter((t) => {
          const td = new Date(t.task_date);
          return (
            `${td.getDate()} ${td.toLocaleString("default", {
              month: "short",
            })}` === date
          );
        }),
      }));
      setTasksData(grouped);
    } catch (err) {
      console.error("fetchData error:", err);
      showAlert(`Failed to load data: ${err.message}`);
      setHolidays(["2025-12-25"]);
      setApprovedLeaves([]);
      setFreezeDays(0);
      setOrgFreezeDays(0);
    } finally {
      setLoading(false);
      setLoadingHolidays(false);
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) fetchData();
    else showAlert("Backend URL not configured.");
  }, [employeeId, weekId, weekOffset, userContext]);

  const handlePreviousWeek = () => {
    setWeekOffset((prev) => Math.max(prev - 1, -3));
  };
  const handleNextWeek = () => {
    setWeekOffset((prev) => Math.min(prev + 1, 3));
  };

  const toggleExpand = (date) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const handleEditClick = (task) => {
    if (!isTaskEditable(task.task_date)) {
      showAlert(
        `Cannot edit: Task is before the ${effectiveFreezeDays}-day editable period.`
      );
      return;
    }
    if (task.sup_review_status === "suspended_review") {
      showAlert("This task is suspended and cannot be updated.");
      return;
    }
    if (editingTask === task.task_id) {
      setEditingTask(null);
      setFormData({ taskName: "", status: "", comment: "" });
    } else {
      setEditingTask(task.task_id);
      setFormData({
        taskName: task.task_name,
        status: task.emp_status,
        comment: task.emp_comment || "",
      });
    }
  };

  const handleSupStatusEditClick = (task) => {
    if (userRole !== "supervisor") return;
    if (!isTaskEditable(task.task_date)) {
      showAlert(
        `Cannot edit: Task is before the ${effectiveFreezeDays}-day editable period.`
      );
      return;
    }
    if (task.sup_review_status === "suspended_review") {
      showAlert("This task is suspended and cannot be updated.");
      return;
    }
    if (editingSupStatus === task.task_id) {
      setEditingSupStatus(null);
      setSupFormData({ supStatus: "", supComment: "" });
    } else {
      setEditingSupStatus(task.task_id);
      setSupFormData({
        supStatus: task.sup_status || "incomplete",
        supComment: task.sup_comment || "",
      });
    }
  };

  const handleSave = async (taskId) => {
    const task = tasksData
      .flatMap((d) => d.tasks)
      .find((t) => t.task_id === taskId);
    if (!isTaskEditable(task.task_date)) {
      showAlert(
        `Cannot edit: Task is before the ${effectiveFreezeDays}-day editable period.`
      );
      return;
    }
    if (task.sup_review_status === "suspended_review") {
      showAlert("This task is suspended and cannot be updated.");
      return;
    }
    try {
      const updated = {
        project_id: task.project_id,
        project_name: task.project_name,
        task_name: formData.taskName,
        emp_status: formData.status,
        emp_comment: formData.comment,
        sup_status: task.sup_status || "incomplete",
        sup_comment: task.sup_comment,
        sup_review_status: task.sup_review_status,
        employee_id: task.employee_id,
        star_rating: task.star_rating,
        replacement_task: task.replacement_task,
      };
      await authRequest({
        method: "PUT",
        url: `/api/week_tasks/${taskId}`,
        data: updated,
      });
      setTasksData((prev) =>
        prev.map((day) => ({
          ...day,
          tasks: day.tasks.map((t) =>
            t.task_id === taskId
              ? {
                  ...t,
                  task_name: formData.taskName,
                  emp_status: formData.status,
                  emp_comment: formData.comment,
                }
              : t
          ),
        }))
      );
      showAlert("Task updated successfully!");
    } catch (err) {
      showAlert(`Failed to update task: ${err.message}`);
    } finally {
      setEditingTask(null);
      setFormData({ taskName: "", status: "", comment: "" });
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setFormData({ taskName: "", status: "", comment: "" });
  };

  const handleSupStatusSave = async (taskId) => {
    if (userRole !== "supervisor") return;
    const task = tasksData
      .flatMap((d) => d.tasks)
      .find((t) => t.task_id === taskId);
    if (!isTaskEditable(task.task_date)) {
      showAlert(
        `Cannot edit: Task is before the ${effectiveFreezeDays}-day editable period.`
      );
      return;
    }
    if (task.sup_review_status === "suspended_review") {
      showAlert("This task is suspended and cannot be updated.");
      return;
    }
    try {
      const updateData = {
        project_id: task.project_id,
        project_name: task.project_name,
        task_name: task.task_name,
        emp_status: task.emp_status,
        emp_comment: task.emp_comment,
        sup_status: task.sup_status || "incomplete",
        sup_comment: task.sup_comment,
        sup_review_status: task.sup_review_status,
        employee_id: task.employee_id,
        star_rating: task.star_rating,
        replacement_task: task.replacement_task,
      };

      if (supFormData.supStatus === "re-work") {
        const taskDate = new Date(task.task_date);
        const nextDay = new Date(taskDate);
        nextDay.setDate(taskDate.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split("T")[0];
        if (!isTaskEditable(nextDayStr)) {
          showAlert(
            `Cannot create new task: Next day is before the ${effectiveFreezeDays}-day editable period.`
          );
          return;
        }
        const nextWeek = getISOWeekNumber(nextDay);
        const newTask = {
          week_id: nextWeek,
          task_date: nextDayStr,
          project_id: task.project_id,
          project_name: task.project_name,
          task_name: task.replacement_task || task.task_name,
          employee_id: task.employee_id,
          emp_status: "not started",
          sup_status: "incomplete",
          emp_comment: null,
          sup_comment: null,
          sup_review_status: "pending",
          star_rating: 0,
          parent_task_id: task.task_id,
        };
        const resp = await authRequest({
          method: "POST",
          url: "/api/week_tasks",
          data: newTask,
        });
        updateData.sup_status = "re-work";
        await authRequest({
          method: "PUT",
          url: `/api/week_tasks/${taskId}`,
          data: updateData,
        });
        showAlert(resp.data.message || "New task created successfully");
        if (resp.data.newTask) {
          const nt = {
            ...resp.data.newTask,
            employee_name: "Unknown",
            employee_id: resp.data.newTask.employee_id?.trim().toUpperCase(),
            emp_status: resp.data.newTask.emp_status || "not started",
          };
          setTasksData((prev) => {
            const copy = [...prev];
            const dayIdx = copy.findIndex(
              (d) =>
                d.date ===
                `${nextDay.getDate()} ${nextDay.toLocaleString("default", {
                  month: "short",
                })}`
            );
            if (dayIdx > -1) copy[dayIdx].tasks.push(nt);
            return copy;
          });
          if (nextWeek !== weekId) {
            const offsetDiff = nextWeek - weekId;
            setWeekOffset((p) => p + offsetDiff);
          }
        }
      } else {
        await authRequest({
          method: "PUT",
          url: `/api/week_tasks/${taskId}`,
          data: {
            ...updateData,
            sup_status: supFormData.supStatus,
            sup_comment: supFormData.supComment,
          },
        });
        showAlert("Supervisor status updated successfully!");
      }

      setTasksData((prev) =>
        prev.map((day) => ({
          ...day,
          tasks: day.tasks.map((t) =>
            t.task_id === taskId
              ? {
                  ...t,
                  sup_status: supFormData.supStatus,
                  sup_comment: supFormData.supComment,
                }
              : t
          ),
        }))
      );
    } catch (err) {
      showAlert(`Failed to update supervisor status: ${err.message}`);
    } finally {
      setEditingSupStatus(null);
      setSupFormData({ supStatus: "", supComment: "" });
    }
  };

  const handleSupStatusCancel = () => {
    setEditingSupStatus(null);
    setSupFormData({ supStatus: "", supComment: "" });
  };

  const handleEnterReview = () => {
    if (userRole === "supervisor") setSupReviewMode(true);
  };
  const handleExitReview = () => {
    setSupReviewMode(false);
    setStrikeTaskId(null);
    setEditingSupStatus(null);
  };

  const handleApprove = async (taskId) => {
    if (userRole !== "supervisor") return;
    const task = tasksData
      .flatMap((d) => d.tasks)
      .find((t) => t.task_id === taskId);
    if (!isTaskEditable(task.task_date)) {
      showAlert(
        `Cannot edit: Task is before the ${effectiveFreezeDays}-day editable period.`
      );
      return;
    }
    if (task.sup_review_status === "suspended_review") {
      showAlert("This task is suspended and cannot be updated.");
      return;
    }
    try {
      await authRequest({
        method: "PUT",
        url: `/api/week_tasks/${taskId}`,
        data: { ...task, sup_review_status: "approved" },
      });
      setTasksData((prev) =>
        prev.map((day) => ({
          ...day,
          tasks: day.tasks.map((t) =>
            t.task_id === taskId ? { ...t, sup_review_status: "approved" } : t
          ),
        }))
      );
      showAlert("Task approved successfully!");
    } catch (err) {
      showAlert(`Failed to approve task: ${err.message}`);
    }
  };

  const handleSuspendReview = async (taskId) => {
    if (userRole !== "supervisor") return;
    const task = tasksData
      .flatMap((d) => d.tasks)
      .find((t) => t.task_id === taskId);
    if (!isTaskEditable(task.task_date)) {
      showAlert(
        `Cannot edit: Task is before the ${effectiveFreezeDays}-day editable period.`
      );
      return;
    }
    try {
      await authRequest({
        method: "PUT",
        url: `/api/week_tasks/${taskId}`,
        data: { ...task, sup_review_status: "suspended_review" },
      });
      setTasksData((prev) =>
        prev.map((day) => ({
          ...day,
          tasks: day.tasks.map((t) =>
            t.task_id === taskId
              ? { ...t, sup_review_status: "suspended_review" }
              : t
          ),
        }))
      );
      showAlert("Task suspended successfully!");
    } catch (err) {
      showAlert(`Failed to suspend task: ${err.message}`);
    }
  };

  const handleStrike = async (taskId, dayDate) => {
    if (userRole !== "supervisor") return;
    const task = tasksData
      .flatMap((d) => d.tasks)
      .find((t) => t.task_id === taskId);
    if (!isTaskEditable(task.task_date)) {
      showAlert(
        `Cannot edit: Task is before the ${effectiveFreezeDays}-day editable period.`
      );
      return;
    }
    if (task.sup_review_status === "suspended_review") {
      showAlert("This task is suspended and cannot be updated.");
      return;
    }
    try {
      await authRequest({
        method: "PUT",
        url: `/api/week_tasks/${taskId}`,
        data: { ...task, sup_review_status: "struck", replacement_task: null },
      });
      setTasksData((prev) =>
        prev.map((day) => ({
          ...day,
          tasks: day.tasks.map((t) =>
            t.task_id === taskId
              ? { ...t, sup_review_status: "struck", replacement_task: null }
              : t
          ),
        }))
      );
      setStrikeTaskId(taskId);
      setReplacementData({
        projectId: "",
        projectName: "",
        taskName: "",
        date: dayDate,
      });
    } catch (err) {
      showAlert(`Failed to strike task: ${err.message}`);
    }
  };

  const handleReplacementChange = (field, value) => {
    setReplacementData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "projectId" ? { projectName: projects[value] || "" } : {}),
    }));
  };

  const handleAddReplacement = async () => {
    if (userRole !== "supervisor") return;
    if (!replacementData.projectId || !replacementData.taskName) {
      showAlert("Please provide project ID and task name.");
      return;
    }
    const dayIdx = tasksData.findIndex((d) => d.date === replacementData.date);
    const taskIdx = tasksData[dayIdx].tasks.findIndex(
      (t) => t.task_id === strikeTaskId
    );
    const task = tasksData[dayIdx].tasks[taskIdx];
    if (!isTaskEditable(task.task_date)) {
      showAlert(
        `Cannot edit: Task is before the ${effectiveFreezeDays}-day editable period.`
      );
      return;
    }
    if (task.sup_review_status === "suspended_review") {
      showAlert("This task is suspended and cannot be updated.");
      return;
    }
    try {
      const updated = {
        ...task,
        sup_review_status: "struck",
        replacement_task: replacementData.taskName,
      };
      await authRequest({
        method: "PUT",
        url: `/api/week_tasks/${strikeTaskId}`,
        data: updated,
      });

      const [day, month] = replacementData.date.split(" ");
      const monthIdx =
        new Date(`${month} 1, ${startDate.getFullYear()}`).getMonth() + 1;
      const formatted = `${startDate.getFullYear()}-${String(monthIdx).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const newTask = {
        week_id: weekId,
        task_date: formatted,
        project_id: replacementData.projectId,
        project_name: replacementData.projectName,
        task_name: replacementData.taskName,
        emp_status: "not started",
        emp_comment: "",
        sup_status: "incomplete",
        sup_comment: "",
        sup_review_status: "approved",
        employee_id: employeeId,
        star_rating: null,
        replacement_task: null,
      };
      const resp = await authRequest({
        method: "POST",
        url: "/api/week_tasks",
        data: newTask,
      });
      setTasksData((prev) => {
        const copy = [...prev];
        copy[dayIdx].tasks.splice(taskIdx + 1, 0, {
          ...newTask,
          task_id: resp.data.taskId,
        });
        return copy;
      });
      setProjects((prev) => ({
        ...prev,
        [replacementData.projectId]: replacementData.projectName,
      }));
      setNoTasks(false);
      showAlert("Replacement task added successfully!");
      setStrikeTaskId(null);
      setReplacementData({
        projectId: "",
        projectName: "",
        taskName: "",
        date: "",
      });
    } catch (err) {
      showAlert(`Failed to add replacement task: ${err.message}`);
    }
  };

  const handleAssignClick = () => {
    setShowAssignForm(true);
    setAssignTasks([
      {
        dates: [],
        projectId: "",
        projectName: "",
        taskName: "",
      },
    ]);
    setDropdownOpen({});
  };

  const handleAddTask = () => {
    setAssignTasks((prev) => [
      ...prev,
      { dates: [], projectId: "", projectName: "", taskName: "" },
    ]);
  };

  const handleRemoveTask = (idx) => {
    if (assignTasks.length <= 1) return;
    setAssignTasks((prev) => prev.filter((_, i) => i !== idx));
    setDropdownOpen((prev) => {
      const n = { ...prev };
      delete n[idx];
      return n;
    });
  };

  const handleAssignChange = (idx, field, value) => {
    setAssignTasks((prev) =>
      prev.map((t, i) => {
        if (i !== idx) return t;
        if (field === "dates") {
          const newDates = t.dates.includes(value)
            ? t.dates.filter((d) => d !== value)
            : [...t.dates, value];
          return { ...t, dates: newDates };
        }
        return { ...t, [field]: value };
      })
    );
  };

  const handleProjectSelect = (idx) => (e) => {
    const id = e.target.value;
    setAssignTasks((prev) =>
      prev.map((t, i) =>
        i === idx ? { ...t, projectId: id, projectName: projects[id] || "" } : t
      )
    );
  };
  const handleAssignSubmit = async () => {
    const valid = assignTasks.filter(
      (t) => t.projectId && t.taskName && t.dates.length > 0
    );
    if (valid.length === 0) {
      showAlert("Fill at least one task with dates, project & name.");
      return;
    }

    const newTasksAdded = [];

    try {
      for (const task of valid) {
        setProjects((prev) => ({
          ...prev,
          [task.projectId]: task.projectName,
        }));

        for (const date of task.dates) {
          const [day, month] = date.split(" ");
          const monthIdx = new Date(
            `${month} 1, ${startDate.getFullYear()}`
          ).getMonth();
          const taskDate = new Date(
            startDate.getFullYear(),
            monthIdx,
            parseInt(day)
          );
          const isoDate = formatDateIST(taskDate);

          const newTaskBase = {
            week_id: weekId,
            task_date: isoDate,
            project_id: task.projectId,
            project_name: task.projectName,
            task_name: task.taskName,
            emp_status: "not started",
            emp_comment: "",
            sup_status: "incomplete",
            sup_comment: "",
            sup_review_status: "pending",
            employee_id: employeeId,
            star_rating: null,
            replacement_task: null,
          };

          const resp = await authRequest({
            method: "POST",
            url: "/api/week_tasks",
            data: newTaskBase,
          });

          const fullNewTask = {
            ...newTaskBase,
            task_id: resp.data.taskId,
          };

          newTasksAdded.push({ task: fullNewTask, date });
        }
      }

      setTasksData((prev) => {
        const copy = prev.map((day) => ({ ...day, tasks: [...day.tasks] }));
        newTasksAdded.forEach(({ task, date }) => {
          const dayIdx = copy.findIndex((d) => d.date === date);
          if (dayIdx !== -1) {
            copy[dayIdx].tasks.push(task);
          }
        });
        return copy;
      });

      setNoTasks(false);
      showAlert("Tasks assigned successfully!");
      setShowAssignForm(false);
      setAssignTasks([]);
      setDropdownOpen({});
    } catch (err) {
      showAlert(`Failed to assign tasks: ${err.message}`);
    }
  };
  const handleAssignCancel = () => {
    setShowAssignForm(false);
    setAssignTasks([]);
    setDropdownOpen({});
  };

  const statusColors = {
    completed: "#28a745",
    "add on": "#17a2b8",
    "re-work": "#dc3545",
    incomplete: "#ffc107",
    "not started": "#888",
    working: "#007bff",
  };
  const statusLabels = {
    completed: "Completed",
    "add on": "Add On",
    "re-work": "Re-work",
    incomplete: "Incomplete",
    "not started": "Not Started",
    working: "Working",
  };
  const reviewColors = {
    approved: "#28a745",
    struck: "#dc3545",
    suspended_review: "#ffc107",
  };
  const reviewIcons = {
    approved: "✓",
    struck: "✗",
    suspended_review: "⛔",
  };

  return (
    <div className="week-task-weekly-task-planner">
      <div className="week-task-planner-header">
        <h2>
          Weekly Task Planner{" "}
          <span className="week-task-week-id">
            Week {weekId}: {dateRange}
          </span>
          <div className="week-task-week-navigation">
            <button
              onClick={handlePreviousWeek}
              className="week-task-nav-button-task"
              disabled={weekOffset <= -3}
              title={
                weekOffset <= -3
                  ? "Cannot view earlier than 3 weeks ago"
                  : "Previous Week"
              }
            >
              <ChevronLeft size={20} />
            </button>

            <div className="week-task-nav-dots">
              <span className="week-task-dot"></span>
              <span className="week-task-dot"></span>
              <span className="week-task-dot"></span>
            </div>

            <button
              onClick={handleNextWeek}
              className="week-task-nav-button-task"
              disabled={weekOffset >= 3}
              title={
                weekOffset >= 3
                  ? "Cannot view beyond 3 weeks ahead"
                  : "Next Week"
              }
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </h2>

        <div className="week-task-header-buttons">
          <button
            className="week-task-assign-task-button"
            onClick={handleAssignClick}
          >
            Assign New Tasks
          </button>
        </div>
      </div>

      {(loading || loadingHolidays || loadingLeaves) && (
        <div>Loading data…</div>
      )}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchData} style={{ marginLeft: "10px" }}>
            Retry
          </button>
        </div>
      )}
      {!loading && !error && noTasks && (
        <div className="no-tasks-message">
          No tasks available in this Week {weekId}: {dateRange}.
        </div>
      )}

      {mobileTooltip.isVisible && (
        <div
          ref={tooltipRef}
          className="week-task-mobile-tooltip"
          style={{
            top: `${mobileTooltip.position.y}px`,
            left: `${mobileTooltip.position.x}px`,
            position: "absolute",
            zIndex: 1000,
          }}
        >
          {mobileTooltip.content}
        </div>
      )}

      {showAssignForm && (
        <div className="week-task-assign-form-modal">
          <div className="week-task-assign-form-empdriven">
            <div className="week-task-form-header">
              <h3>Assign New Tasks</h3>
              <button
                className="week-task-close-button"
                onClick={handleAssignCancel}
              >
                ×
              </button>
            </div>

            <div className="week-task-tasks-form-container">
              {assignTasks.map((task, idx) => (
                <div key={idx} className="week-task-task-form-row">
                  <div className="week-task-form-row-header">
                    <h4>Task {idx + 1}</h4>
                    <button
                      onClick={() => handleRemoveTask(idx)}
                      className="week-task-remove-task-button"
                      disabled={assignTasks.length === 1}
                    >
                      ×
                    </button>
                  </div>

                  <div className="week-task-form-grid">
                    <div className="week-task-form-group-task">
                      <label>Dates</label>
                      <div className="week-task-multi-select-dropdown">
                        <div
                          className="week-task-dropdown-header-task"
                          onClick={() => toggleDropdown(idx)}
                        >
                          {task.dates.length > 0
                            ? task.dates.join(", ")
                            : "-- Select Dates --"}
                          <span className="arrow">
                            {dropdownOpen[idx] ? "▲" : "▼"}
                          </span>
                        </div>
                        {dropdownOpen[idx] && (
                          <div className="week-task-dropdown-list">
                            {weekDates.map((d) => {
                              const style = getTaskDateStyle(d);
                              return (
                                <label
                                  key={d}
                                  className="week-task-checkbox-label"
                                >
                                  <input
                                    type="checkbox"
                                    checked={task.dates.includes(d)}
                                    onChange={() =>
                                      handleAssignChange(idx, "dates", d)
                                    }
                                  />
                                  {d}
                                  {style.tooltip !== d && (
                                    <span
                                      className={`week-task-date-status ${style.className}`}
                                    >
                                      {style.tooltip}
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="week-task-form-group-task">
                      <label>Project</label>
                      <select
                        value={task.projectId}
                        onChange={handleProjectSelect(idx)}
                      >
                        <option value="">Select Project</option>
                        {Object.entries(projects).map(([id, name]) => (
                          <option key={id} value={id}>
                            {id} - {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="week-task-form-group-task">
                      <label>Task</label>
                      <div className="week-task-comment-mic-wrapper">
                        <input
                          type="text"
                          value={task.taskName}
                          onChange={(e) =>
                            handleAssignChange(idx, "taskName", e.target.value)
                          }
                          placeholder="Enter task"
                          className="week-task-edit-comment-input"
                        />
                        <span
                          className="week-task-mic-icon"
                          onClick={() =>
                            assignListeningIndex === idx
                              ? stopAssignListening()
                              : startAssignListening(idx)
                          }
                          style={{
                            cursor: "pointer",
                          }}
                        >
                          {assignListeningIndex === idx ? (
                            <MdMicNone className="mic-listening" />
                          ) : (
                            <MdMic className="mic-idle" />
                          )}
                        </span>
                        {assignListeningIndex === idx && (
                          <span
                            style={{
                              marginLeft: "6px",
                              color: "red",
                              fontSize: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            Listening…
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddTask}
                className="week-task-add-task-button"
              >
                + Add Another Task
              </button>
            </div>

            <div className="week-task-form-actions">
              <button
                onClick={handleAssignCancel}
                className="week-task-cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                className="week-task-save-button"
              >
                Save All Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {userRole === "supervisor" && strikeTaskId && (
        <div className="week-task-replacement-modal">
          <div className="week-task-replacement-form">
            <div className="week-task-form-header">
              <h4>Replace Struck Task</h4>
              <button
                className="week-task-close-button"
                onClick={() => setStrikeTaskId(null)}
              >
                ×
              </button>
            </div>

            <div className="week-task-form-grid">
              <div className="week-task-form-group-task">
                <label>Project</label>
                <select
                  value={replacementData.projectId}
                  onChange={(e) =>
                    handleReplacementChange("projectId", e.target.value)
                  }
                >
                  <option value="">Select Project</option>
                  {Object.entries(projects).map(([id, name]) => (
                    <option key={id} value={id}>
                      {id} - {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="week-task-form-group-task">
                <label>Task Name</label>
                <input
                  type="text"
                  value={replacementData.taskName}
                  onChange={(e) =>
                    handleReplacementChange("taskName", e.target.value)
                  }
                  placeholder="Enter replacement task name"
                />
              </div>
            </div>

            <div className="week-task-form-actions">
              <button
                onClick={handleAddReplacement}
                className="week-task-save-button"
              >
                Add Replacement
              </button>
              <button
                onClick={() => setStrikeTaskId(null)}
                className="week-task-cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        !noTasks &&
        tasksData.map((day) => {
          const isExpanded = expandedDates[day.date] || false;
          const visible = isExpanded ? day.tasks : day.tasks.slice(0, 3);
          const dateStyle = getTaskDateStyle(day.date);

          return (
            <div key={day.date} className="week-task-day-card">
              <div className="week-task-day-left-column">
                <span
                  className={dateStyle.className}
                  title={isMobile ? "" : dateStyle.tooltip}
                  onClick={(e) =>
                    handleTooltipClick(e, dateStyle.tooltip, `date-${day.date}`)
                  }
                  onTouchStart={(e) =>
                    handleTooltipClick(e, dateStyle.tooltip, `date-${day.date}`)
                  }
                  style={{ cursor: isMobile ? "pointer" : "default" }}
                >
                  {day.date}
                </span>

                <div className="week-task-projects-column">
                  {visible.map((task, idx) => (
                    <div
                      key={`${task.task_id}-${day.date}-${idx}`}
                      className="week-task-circle-container"
                    >
                      <div
                        className="week-task-project-circle"
                        title={isMobile ? "" : task.project_name}
                        onClick={(e) =>
                          handleTooltipClick(
                            e,
                            task.project_name,
                            `proj-${task.task_id}`
                          )
                        }
                        onTouchStart={(e) =>
                          handleTooltipClick(
                            e,
                            task.project_name,
                            `proj-${task.task_id}`
                          )
                        }
                        style={{ cursor: isMobile ? "pointer" : "default" }}
                      >
                        {task.project_id}
                      </div>

                      <div
                        className="week-task-task-id-circle"
                        title={isMobile ? "" : `Task ID: ${task.task_id}`}
                        onClick={(e) =>
                          handleTooltipClick(
                            e,
                            `Task ID: ${task.task_id}`,
                            `tid-${task.task_id}`
                          )
                        }
                        onTouchStart={(e) =>
                          handleTooltipClick(
                            e,
                            `Task ID: ${task.task_id}`,
                            `tid-${task.task_id}`
                          )
                        }
                        style={{ cursor: isMobile ? "pointer" : "default" }}
                      >
                        {task.task_id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="week-task-tasks-section">
                <div className="week-task-tasks-header">
                  <div className="week-task-header-task">Tasks</div>
                  <div className="week-task-header-employee">
                    Employee Update
                  </div>
                  <div className="week-task-header-supervisor">
                    Supervisor Feedback
                  </div>
                </div>

                <div className="week-task-tasks-list">
                  {visible.map((task) => {
                    const editable = isTaskEditable(task.task_date);
                    const frozen =
                      task.sup_review_status === "suspended_review";
                    const canEdit = editable && !frozen;

                    return (
                      <div
                        key={`${task.task_id}-${day.date}`}
                        className={`week-task-task-row ${
                          !canEdit ? "task-frozen" : ""
                        }`}
                      >
                        <div className="week-task-task-name">
                          {task.sup_review_status === "struck" ? (
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
                                    marginLeft: "10px",
                                  }}
                                >
                                  Replacement: {task.replacement_task}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {task.task_name}
                              {task.sup_review_status !== "pending" && (
                                <span
                                  className={`week-task-review-status-icon ${task.sup_review_status}`}
                                  style={{
                                    color: reviewColors[task.sup_review_status],
                                  }}
                                  title={task.sup_review_status}
                                >
                                  {reviewIcons[task.sup_review_status]}
                                </span>
                              )}
                            </>
                          )}

                          {userRole === "supervisor" &&
                            supReviewMode &&
                            task.sup_review_status === "pending" && (
                              <div className="week-task-review-action-icons">
                                <svg
                                  className="week-task-action-icon approve"
                                  onClick={() => handleApprove(task.task_id)}
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="green"
                                  strokeWidth="2"
                                  style={{
                                    cursor: canEdit ? "pointer" : "not-allowed",
                                  }}
                                >
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                                <svg
                                  className="week-task-action-icon strike"
                                  onClick={() =>
                                    handleStrike(task.task_id, day.date)
                                  }
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="red"
                                  strokeWidth="2"
                                  style={{
                                    cursor: canEdit ? "pointer" : "not-allowed",
                                  }}
                                >
                                  <path d="M18 6L6 18" />
                                </svg>
                                <svg
                                  className="week-task-action-icon suspend"
                                  onClick={() =>
                                    handleSuspendReview(task.task_id)
                                  }
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="orange"
                                  strokeWidth="2"
                                  style={{
                                    cursor: canEdit ? "pointer" : "not-allowed",
                                  }}
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="15" y1="9" x2="9" y2="15" />
                                  <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                              </div>
                            )}
                        </div>

                        <div
                          className="week-task-update-section"
                          style={{ opacity: canEdit ? 1 : 0.5 }}
                        >
                          {editingTask === task.task_id &&
                            userRole === "employee" && (
                              <div className="week-task-edit-popup">
                                <div className="week-task-checkbox-group">
                                  {["completed", "not started", "working"].map(
                                    (s) => (
                                      <label
                                        key={s}
                                        className="week-task-checkbox-label"
                                      >
                                        <input
                                          type="radio"
                                          name="emp-status"
                                          value={s}
                                          checked={formData.status === s}
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              status: e.target.value,
                                            })
                                          }
                                          disabled={!canEdit}
                                        />
                                        {statusLabels[s] || s}
                                      </label>
                                    )
                                  )}
                                </div>
                                <div className="week-task-comment-mic-wrapper">
                                  <input
                                    type="text"
                                    placeholder="Add comment"
                                    value={formData.comment}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        comment: e.target.value,
                                      })
                                    }
                                    className="week-task-edit-comment-input"
                                    disabled={!canEdit}
                                  />
                                  <span
                                    className="week-task-mic-icon"
                                    onClick={
                                      isListening
                                        ? stopListening
                                        : startListening
                                    }
                                    style={{
                                      cursor: "pointer",
                                      marginLeft: "8px",
                                      fontSize: "22px",
                                    }}
                                  >
                                    {isListening ? (
                                      <MdMicNone className="mic-listening" />
                                    ) : (
                                      <MdMic className="mic-idle" />
                                    )}
                                  </span>
                                  {isListening && (
                                    <span
                                      style={{
                                        marginLeft: "6px",
                                        color: "red",
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Listening…
                                    </span>
                                  )}
                                </div>
                                <div className="week-task-edit-actions">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="week-task-cancel-button"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSave(task.task_id)}
                                    className="week-task-edit-save-button"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            )}
                          <div className="week-task-status-container">
                            <span className="week-task-comment">
                              {task.emp_comment || "N/A"}
                            </span>
                            <div className="week-task-status-dots">
                              <span
                                className="week-task-status-dot"
                                style={{
                                  backgroundColor:
                                    statusColors[task.emp_status] || "#888",
                                  cursor: isMobile ? "pointer" : "default",
                                }}
                                title={
                                  isMobile
                                    ? ""
                                    : statusLabels[task.emp_status] ||
                                      task.emp_status
                                }
                                onClick={(e) =>
                                  handleTooltipClick(
                                    e,
                                    statusLabels[task.emp_status] ||
                                      task.emp_status,
                                    `emp-${task.task_id}`
                                  )
                                }
                                onTouchStart={(e) =>
                                  handleTooltipClick(
                                    e,
                                    statusLabels[task.emp_status] ||
                                      task.emp_status,
                                    `emp-${task.task_id}`
                                  )
                                }
                              />
                              <svg
                                className="week-task-edit-icon"
                                onClick={() => handleEditClick(task)}
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#007bff"
                                strokeWidth="2"
                                style={{
                                  cursor: canEdit ? "pointer" : "not-allowed",
                                  opacity: canEdit ? 1 : 0.5,
                                }}
                                title="Edit employee update"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div
                          className="week-task-supervisor-section"
                          style={{ opacity: canEdit ? 1 : 0.5 }}
                        >
                          {userRole === "supervisor" &&
                          supReviewMode &&
                          editingSupStatus === task.task_id ? (
                            <div className="week-task-edit-section">
                              <div className="week-task-checkbox-group">
                                {[
                                  "completed",
                                  "add on",
                                  "re-work",
                                  "incomplete",
                                ].map((s) => (
                                  <label
                                    key={s}
                                    className="week-task-checkbox-label"
                                  >
                                    <input
                                      type="radio"
                                      name="sup-status"
                                      value={s}
                                      checked={supFormData.supStatus === s}
                                      onChange={(e) =>
                                        setSupFormData({
                                          ...supFormData,
                                          supStatus: e.target.value,
                                        })
                                      }
                                      disabled={!canEdit}
                                    />
                                    {statusLabels[s] || s}
                                  </label>
                                ))}
                              </div>
                              <input
                                type="text"
                                placeholder="Add supervisor comment"
                                value={supFormData.supComment}
                                onChange={(e) =>
                                  setSupFormData({
                                    ...supFormData,
                                    supComment: e.target.value,
                                  })
                                }
                                className="week-task-edit-comment-input"
                                disabled={!canEdit}
                              />
                              <div className="week-task-edit-actions">
                                <button
                                  onClick={handleSupStatusCancel}
                                  className="week-task-cancel-button"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() =>
                                    handleSupStatusSave(task.task_id)
                                  }
                                  className="week-task-edit-save-button"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="week-task-status-container">
                              <span className="week-task-comment">
                                {task.sup_comment || "N/A"}
                              </span>
                              <div className="week-task-status-dots">
                                <span
                                  className="week-task-status-dot"
                                  style={{
                                    backgroundColor:
                                      statusColors[task.sup_status] || "#888",
                                    cursor: isMobile ? "pointer" : "default",
                                  }}
                                  title={
                                    isMobile
                                      ? ""
                                      : statusLabels[task.sup_status] ||
                                        task.sup_status
                                  }
                                  onClick={(e) =>
                                    handleTooltipClick(
                                      e,
                                      statusLabels[task.sup_status] ||
                                        task.sup_status,
                                      `sup-${task.task_id}`
                                    )
                                  }
                                  onTouchStart={(e) =>
                                    handleTooltipClick(
                                      e,
                                      statusLabels[task.sup_status] ||
                                        task.sup_status,
                                      `sup-${task.task_id}`
                                    )
                                  }
                                />
                                {userRole === "supervisor" && supReviewMode && (
                                  <svg
                                    className="week-task-edit-icon"
                                    onClick={() =>
                                      handleSupStatusEditClick(task)
                                    }
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#007bff"
                                    strokeWidth="2"
                                    style={{
                                      cursor: canEdit
                                        ? "pointer"
                                        : "not-allowed",
                                    }}
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {day.tasks.length > 3 && (
                  <svg
                    className="week-task-expand-icon-task"
                    onClick={() => toggleExpand(day.date)}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#28a745"
                    strokeWidth="2"
                  >
                    {isExpanded ? (
                      <path d="M19 9l-7-7-7 7" />
                    ) : (
                      <path d="M5 15l7 7 7-7" />
                    )}
                  </svg>
                )}
              </div>
            </div>
          );
        })}

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

export default WeeklyTaskPlanner;
