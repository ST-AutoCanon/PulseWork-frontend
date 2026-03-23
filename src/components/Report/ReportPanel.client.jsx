import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  MdFileDownload,
  MdPictureAsPdf,
  MdDateRange,
  MdOutlineAssessment,
} from "react-icons/md";
import "./ReportPanel.css";
import Modal from "../Modal/Modal.client";
import EmployeeTypeahead from "./EmployeeTypeahead.client";
import FieldsGrid from "./FieldsGrid.client";
import Pagination from "./Pagination.client";
import { getApiBase } from "./ReportUtils";
import { useAuth } from "../../context/AuthProvider.client";
import {
  STATUS_OPTIONS,
  SUB_OPTIONS,
  MAX_DOWNLOAD_FIELDS,
  PREVIEW_PAGE_SIZE,
  MAX_RANGE_DAYS,
} from "./ReportConstants";

function formatDateLocal(d) {
  if (!d || !(d instanceof Date)) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function inferManagerDeptFromDepartmentsArray(deptRows, employeeId) {
  if (!Array.isArray(deptRows) || !employeeId) return null;
  for (const d of deptRows) {
    const mgrCandidates = [
      d.manager_employee_id,
      d.managerId,
      d.manager_employeeid,
      d.manager_employee,
      d.manager_id,
      d.manager,
    ];
    for (const mgr of mgrCandidates) {
      if (!mgr) continue;
      const mgrId =
        typeof mgr === "object"
          ? mgr.employee_id || mgr.id || mgr.manager_employee_id || null
          : mgr;
      if (mgrId && String(mgrId) === String(employeeId)) {
        const id = d.department_id ?? d.id ?? d.departmentId ?? d._id ?? null;
        if (id) return String(id);
        break;
      }
    }

    if (Array.isArray(d.employees) && d.employees.length) {
      const foundMem = d.employees.find((m) => {
        const mid = m.employee_id ?? m.id ?? m._id ?? null;
        if (!mid) return false;
        return String(mid) === String(employeeId);
      });
      if (foundMem) {
        const id = d.department_id ?? d.id ?? d.departmentId ?? d._id ?? null;
        if (id) return String(id);
      }
    }

    if (d.manager && typeof d.manager === "object") {
      const nestedMgrId =
        d.manager.employee_id ||
        d.manager.id ||
        (d.manager.employee &&
          (d.manager.employee.id || d.manager.employee.employee_id));
      if (nestedMgrId && String(nestedMgrId) === String(employeeId)) {
        const id = d.department_id ?? d.id ?? d.departmentId ?? d._id ?? null;
        if (id) return String(id);
      }
    }
  }
  return null;
}

function deriveLifecycleFromAssignedTo(raw) {
  try {
    if (raw === null || raw === undefined) return "Unassigned";
    if (typeof raw === "object" && Array.isArray(raw) && raw.length === 0)
      return "Unassigned";

    let arr = [];
    if (Array.isArray(raw)) arr = raw;
    else {
      const s = String(raw).trim();
      if (!s) return "Unassigned";
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) arr = parsed;
        else if (parsed && typeof parsed === "object") arr = [parsed];
      } catch (e) {
        if (s.indexOf("},{") !== -1 || s.indexOf("}{") !== -1) {
          try {
            const clean = s.replace(/^\[?/, "").replace(/\]?$/, "");
            const parts = clean.split(/}\s*,\s*{/);
            arr = parts.map((part, i) => {
              let txt = part;
              if (i !== 0) txt = "{" + txt;
              if (i !== parts.length - 1) txt = txt + "}";
              try {
                return JSON.parse(txt);
              } catch (e2) {
                return { raw: txt };
              }
            });
          } catch (e2) {
            arr = [{ raw: s }];
          }
        } else {
          arr = [{ raw: s }];
        }
      }
    }

    if (!Array.isArray(arr) || arr.length === 0) return "Unassigned";

    const now = new Date();
    let anyActive = false;
    let anyDecom = false;
    for (const e of arr) {
      const status =
        (e && (e.status || e.Status || e.assignment_status || e.state)) ||
        (typeof e === "string" ? e : null);
      const returnDate =
        (e &&
          (e.returnDate || e.return_date || e.returned_on || e.returnedAt)) ||
        null;
      const st = status ? String(status).toLowerCase() : "";
      if (/(decommissioned|decommission|disposed)/.test(st)) {
        anyDecom = true;
      }
      if (/(returned|returned to stock|returned to vendor)/.test(st)) {
        continue;
      }
      if (returnDate) {
        const d = new Date(returnDate);
        if (!isNaN(d.getTime()) && d.getTime() <= now.getTime()) {
          continue;
        }
      }
      if (
        (e && (e.employeeId || e.employee_id || e.name || e.assigneeName)) ||
        (!returnDate && !/(returned|decommissioned)/.test(st))
      ) {
        anyActive = true;
      }
    }

    if (anyActive) return "assigned";
    if (anyDecom) return "decommissioned";
    return "returned";
  } catch (e) {
    return "Unassigned";
  }
}

export default function ReportPanel() {
  const { user, hydrated } = useAuth();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [component, setComponent] = useState("select");
  const [status, setStatus] = useState("All");
  const [statusOptions, setStatusOptions] = useState([]);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [previewTotalRows, setPreviewTotalRows] = useState(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewMessage, setPreviewMessage] = useState("");

  const employeeId = user?.employeeId ?? user?.id ?? null;

  const rawRole = user?.role ? String(user.role).trim() : null;
  const lowerRawRole = rawRole ? rawRole.toLowerCase() : null;
  const effectiveRole =
    lowerRawRole === "hr" || lowerRawRole === "human resources"
      ? "admin"
      : rawRole;

  const userRole = effectiveRole || null;
  const managerDepartmentIdRaw =
    user?.department_id ?? user?.departmentId ?? user?.deptId ?? null;

  const lowerRole = userRole ? String(userRole).toLowerCase() : "";

  const isTeamRole = Boolean(
    lowerRole &&
    ["manager", "supervisor", "team lead", "teamlead", "lead"].some((s) =>
      lowerRole.includes(s),
    ),
  );

  const isAdmin = Boolean(
    userRole && String(userRole).toLowerCase() === "admin",
  );

  const [filterEmployeeId, setFilterEmployeeId] = useState(null);
  const [filterEmployeeName, setFilterEmployeeName] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState(null);
  const [isTypingSearch, setIsTypingSearch] = useState(false);

  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (isTeamRole && managerDepartmentIdRaw) {
      setFilterDepartmentId(managerDepartmentIdRaw);
    }
  }, [isTeamRole, managerDepartmentIdRaw]);

  const showAlert = (message, title = "") => {
    setPreviewOpen(false);
    setTimeout(() => {
      setAlertModal({ isVisible: true, title: title || "", message });
    }, 80);
  };
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const getErrorMessageFromAxiosError = useCallback(async (err) => {
    try {
      if (!err || !err.response) {
        if (err && err.message) return err.message;
        return "Unknown error from server";
      }
      const { status, data } = err.response;
      if (data === null || typeof data === "undefined") {
        return `Server responded with status ${status}`;
      }
      if (typeof data === "object" && !(data instanceof Blob)) {
        const candidate =
          data.message || data.error || data.msg || data.detail || null;
        if (candidate && typeof candidate === "string" && candidate.trim())
          return candidate;
        try {
          const s = JSON.stringify(data);
          return s.length > 0 ? s : `Server responded with status ${status}`;
        } catch (e) {
          return `Server responded with status ${status}`;
        }
      }
      let text = null;
      if (data instanceof Blob && typeof data.text === "function") {
        text = await data.text();
      } else if (typeof data === "string") {
        text = data;
      }
      if (!text || !text.trim())
        return `Server responded with status ${status}`;
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") {
          return (
            parsed.message ||
            parsed.error ||
            parsed.msg ||
            parsed.detail ||
            JSON.stringify(parsed)
          );
        }
      } catch (e) {
        const t = text.trim();
        return t.length > 500 ? t.slice(0, 500) + "..." : t;
      }
      return `Server responded with status ${status}`;
    } catch (e) {
      return err && err.message ? err.message : "Server error";
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setDeptLoading(true);
    const base = getApiBase();
    axios
      .get(`${base}/api/report/departments`, {
        withCredentials: true,
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY || "",
          "x-employee-id": employeeId || "",
          Accept: "application/json",
        },
      })
      .then((res) => {
        if (!mounted) return;
        const data = res && res.data ? res.data : [];
        let rows = [];
        if (Array.isArray(data)) rows = data;
        else if (Array.isArray(data.departments)) rows = data.departments;
        else if (Array.isArray(data.results)) rows = data.results;
        else if (Array.isArray(data.data)) rows = data.data;
        else rows = [];
        setDepartments(rows);

        if (
          isTeamRole &&
          !managerDepartmentIdRaw &&
          employeeId &&
          rows.length
        ) {
          const inferredId = inferManagerDeptFromDepartmentsArray(
            rows,
            employeeId,
          );
          if (inferredId) {
            setFilterDepartmentId(String(inferredId));
          } else {
            const found = rows.find((d) => {
              const mgr =
                d.manager_employee_id ??
                d.managerId ??
                d.manager_employeeid ??
                d.manager_employee;
              if (!mgr) return false;
              return String(mgr) === String(employeeId);
            });
            if (found) {
              const id =
                found.department_id ?? found.id ?? found.departmentId ?? null;
              if (id) setFilterDepartmentId(String(id));
            }
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch departments:", err);
        setDepartments([]);
      })
      .finally(() => {
        if (mounted) setDeptLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [employeeId, isTeamRole, managerDepartmentIdRaw]);

  useEffect(() => {
    if (!component || component === "select") {
      setStatusOptions([]);
      setStatus("All");
      setAvailableFields([]);
      setSelectedFields([]);
      setPreviewOpen(false);
      setPreviewRows([]);
      setPreviewError("");
      setPreviewMessage("");
      setFilterEmployeeId(null);
      setFilterEmployeeName("");
      if (!isTeamRole) setFilterDepartmentId(null);
      setIsTypingSearch(false);
      return;
    }

    const rawStatusOpts = STATUS_OPTIONS[component] || ["All"];
    const trimmedStatusOpts = rawStatusOpts.map((s) =>
      typeof s === "string" ? s.trim() : s,
    );
    setStatusOptions(trimmedStatusOpts);
    setStatus("All");

    const subs = SUB_OPTIONS[component] || [];
    let subsFiltered = subs;
    if (component === "vendors") {
      subsFiltered = subs.filter(
        (s) =>
          s.key !== "employee_name" &&
          s.key !== "department_name" &&
          s.key !== "department_id",
      );
      setFilterEmployeeId(null);
      setFilterEmployeeName("");
      setFilterDepartmentId(null);
    }

    setAvailableFields(subsFiltered);
    setSelectedFields(subsFiltered.map((s) => s.key));
    setPreviewOpen(false);
    setPreviewRows([]);
    setPreviewError("");
    setPreviewMessage("");

    if (
      isTeamRole &&
      (component === "attendance" || component === "employees")
    ) {
      if (managerDepartmentIdRaw) {
        setFilterDepartmentId(managerDepartmentIdRaw);
      } else {
        const inferredId = inferManagerDeptFromDepartmentsArray(
          departments,
          employeeId,
        );
        if (inferredId) setFilterDepartmentId(inferredId);
      }
    } else if (!isTeamRole) {
      setFilterDepartmentId(null);
    }

    if (component !== "vendors") {
      setFilterEmployeeId(null);
      setFilterEmployeeName("");
    }
    setIsTypingSearch(false);
  }, [component, isTeamRole, managerDepartmentIdRaw]);

  const presetRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    setStartDate(formatDateLocal(start));
    setEndDate(formatDateLocal(end));
  };
  const thisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(formatDateLocal(start));
    setEndDate(formatDateLocal(end));
  };

  const validateDates = () => {
    if (!startDate && !endDate) return true;
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (s > e) {
        showAlert("Start date cannot be after End date.");
        return false;
      }
      const diffMs = e.getTime() - s.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
      if (days > MAX_RANGE_DAYS) {
        showAlert(
          `Selected range is ${days} days. Maximum allowed is ${MAX_RANGE_DAYS} days. Please reduce range.`,
        );
        return false;
      }
      return true;
    }
    showAlert(
      "Please provide both Start Date and End Date, or leave both empty to use the default last 2 months range.",
    );
    return false;
  };

  const toggleField = (key) =>
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  const selectAllFields = () => {
    if (!availableFields || availableFields.length === 0) return;
    setSelectedFields(availableFields.map((s) => s.key));
  };
  const clearAllFields = () => setSelectedFields([]);
  const allSelected =
    availableFields.length > 0 &&
    selectedFields.length === availableFields.length;
  const someSelected =
    selectedFields.length > 0 && selectedFields.length < availableFields.length;

  const getEndpointForComponent = (comp) => {
    if (!comp || comp === "select") return null;
    if (comp === "tasks_supervisor") return "tasks/supervisor";
    if (comp === "tasks_employee") return "tasks/employee";
    return comp;
  };

  const effectiveManagerDepartmentId = (() => {
    if (!isTeamRole) return filterDepartmentId;
    return (
      filterDepartmentId ||
      managerDepartmentIdRaw ||
      inferManagerDeptFromDepartmentsArray(departments, employeeId) ||
      null
    );
  })();

  const onTypeStart = useCallback((typing) => setIsTypingSearch(typing), []);
  const onEmployeeSelect = useCallback((item) => {
    const employeeIdRaw =
      item.employee_id || item.id || item.emp_id || item.employeeId || "";
    const employeeNameRaw =
      item.employee_name || item.name || item.email || item.employeeName || "";

    setFilterEmployeeId(employeeIdRaw || employeeNameRaw);
    setFilterEmployeeName(employeeNameRaw);
    if (item.department_id) setFilterDepartmentId(item.department_id);
    setIsTypingSearch(false);
  }, []);
  const onEmployeeClear = useCallback(() => {
    setFilterEmployeeId(null);
    setFilterEmployeeName("");
  }, []);
  const onDepartmentChange = useCallback((ev) => {
    const val = ev.target.value;
    const v = val === "" ? null : val;
    setFilterDepartmentId(v);
    setFilterEmployeeId(null);
    setFilterEmployeeName("");
  }, []);
  const onDepartmentSelectFromDropdown = useCallback((dept) => {
    setFilterDepartmentId(dept ? String(dept.department_id) : null);
    setFilterEmployeeId(null);
    setFilterEmployeeName("");
  }, []);

  const buildParams = ({ includeFormat = false, preview = false } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    let stRaw = status === undefined || status === null ? "" : String(status);
    const stTrim = stRaw.trim();
    if (stTrim && stTrim.toLowerCase() !== "all") {
      params.append("status", stTrim);
    }

    if (preview) params.append("preview", "true");

    const MAX_CLIENT_FIELDS_SEND = 60;
    if (!preview) {
      if (selectedFields && selectedFields.length > 0) {
        const forbidden = new Set([
          "__asset_lifecycle_status",
          "raw_status",
          "lifecycle",
        ]);
        let fieldsToSend = selectedFields.filter((k) => !forbidden.has(k));
        if (fieldsToSend.length > MAX_CLIENT_FIELDS_SEND) {
          console.warn(
            `[ReportPanel] selectedFields length (${fieldsToSend.length}) exceeds MAX_CLIENT_FIELDS_SEND (${MAX_CLIENT_FIELDS_SEND}). Truncating for transport.`,
          );
          fieldsToSend = fieldsToSend.slice(0, MAX_CLIENT_FIELDS_SEND);
        }
        if (fieldsToSend.length)
          params.append("fields", fieldsToSend.join(","));
      }
    }

    // Always include employee-friendly and id values where applicable (employees component)
    if (component !== "vendors") {
      // employee id (exact) if available
      if (filterEmployeeId) params.append("employee_id", filterEmployeeId);
      // employee friendly name (helps server build human-readable meta when id wasn't selected)
      if (filterEmployeeName) params.append("employee", filterEmployeeName);

      if (isTeamRole) {
        const deptToSend = effectiveManagerDepartmentId || "";
        if (deptToSend) {
          params.append("department_id", deptToSend);
          params.append("department", String(deptToSend));
        }
      } else {
        if (filterDepartmentId) {
          params.append("department_id", filterDepartmentId);
          params.append("department", String(filterDepartmentId));
        }
      }
    }

    if (includeFormat) params.append("format", "xlsx");
    return params.toString();
  };
  const validateSelection = () => {
    if (!component || component === "select") {
      showAlert("Please select a component first.");
      return false;
    }
    if (!selectedFields || selectedFields.length === 0) {
      showAlert("Please select at least one field to proceed.");
      return false;
    }
    return true;
  };

  const ensureClientDownloadFieldLimit = (format) => {
    if (!selectedFields || !Array.isArray(selectedFields)) return true;
    const fmt = (format || "").toLowerCase();
    if (
      (fmt === "pdf" || fmt === "xlsx") &&
      selectedFields.length > MAX_DOWNLOAD_FIELDS
    ) {
      showAlert(
        `You have selected ${selectedFields.length} fields. Downloads (PDF/XLSX) are limited to ${MAX_DOWNLOAD_FIELDS} fields. Please reduce your selection or use Preview.`,
      );
      return false;
    }
    return true;
  };

  const download = async (format) => {
    if (!validateDates()) return;
    if (!validateSelection()) return;
    if (!ensureClientDownloadFieldLimit(format)) return;
    const isPdf = format === "pdf";
    if (isPdf) setDownloadingPdf(true);
    else setDownloadingXlsx(true);

    try {
      const base = getApiBase();
      const endpoint = getEndpointForComponent(component);
      if (!endpoint) {
        showAlert("Invalid component selected");
        return;
      }

      // include format inside buildParams to avoid manual concatenation problems
      const paramString = buildParams({ includeFormat: true, preview: false });
      // replace the default xlsx format with actual requested format
      const finalParamString = paramString.replace(
        /format=xlsx/i,
        `format=${encodeURIComponent(format)}`,
      );

      console.debug("[ReportPanel] download -> paramString:", finalParamString);

      const url = `${base}/api/report/${endpoint}?${finalParamString}`;

      let acceptHeader = "*/*";
      if (isPdf) acceptHeader = "application/pdf";
      else
        acceptHeader =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      const res = await axios.get(url, {
        responseType: "blob",
        withCredentials: true,
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY || "",
          "x-employee-id": employeeId || "",
          Accept: acceptHeader,
        },
        timeout: 2 * 60 * 1000,
      });

      const contentType = res.headers["content-type"] || "";
      const isJson =
        contentType.includes("application/json") ||
        contentType.includes("text/plain");
      if (isJson) {
        let text = "";
        try {
          text = await res.data.text();
        } catch (e) {
          text = "(unable to read response body)";
        }
        let parsedMsg = null;
        try {
          const parsed = JSON.parse(text || "{}");
          parsedMsg = parsed.message || parsed.error || parsed.msg || text;
        } catch (e) {
          parsedMsg = text || `Server responded with status ${res.status}`;
        }
        console.error("Server returned JSON/text instead of file:", parsedMsg);
        showAlert(parsedMsg);
        return;
      }

      let filename = `${component}_report.${isPdf ? "pdf" : "xlsx"}`;
      const disposition = res.headers["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Report download error:", err);
      const msg = await getErrorMessageFromAxiosError(err);
      showAlert(msg);
    } finally {
      if (isPdf) setDownloadingPdf(false);
      else setDownloadingXlsx(false);
    }
  };

  const fetchPreview = async () => {
    try {
      if (!validateDates()) return;
      if (!validateSelection()) return;

      setPreviewError("");
      setPreviewLoading(true);
      setPreviewRows([]);
      setPreviewTotalRows(null);
      setPreviewPage(1);
      setPreviewOpen(true);
      setPreviewMessage("");

      const base = getApiBase();
      const endpoint = getEndpointForComponent(component);
      if (!endpoint) {
        showAlert("Invalid component selected");
        return;
      }

      const paramString = buildParams({ preview: true });
      console.debug("[ReportPanel] preview -> paramString:", paramString);

      const url = `${base}/api/report/${endpoint}?${paramString}`;

      const res = await axios.get(url, {
        withCredentials: true,
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY || "",
          "x-employee-id": employeeId || "",
          Accept: "application/json",
        },
      });

      let rows = [];
      let total = null;

      if (res.data && Array.isArray(res.data.rows)) {
        rows = res.data.rows;
        total =
          typeof res.data.totalRows === "number"
            ? res.data.totalRows
            : rows.length;
      } else if (Array.isArray(res.data)) {
        rows = res.data;
        total = rows.length;
      } else if (Array.isArray(res.data.results)) {
        rows = res.data.results;
        total =
          typeof res.data.total === "number" ? res.data.total : rows.length;
      } else {
        throw new Error("Preview endpoint returned unexpected shape.");
      }

      const MAX_PREVIEW_ROWS = 200;
      setPreviewRows(rows.slice(0, MAX_PREVIEW_ROWS));
      setPreviewTotalRows((prev) => prev ?? total ?? rows.length);

      if (rows.length === 0) {
        const serverMsg =
          (res.data &&
            typeof res.data.message === "string" &&
            res.data.message) ||
          "No data available for the selected date range (max 2 months). Please change filters.";
        setPreviewMessage(serverMsg);
      } else {
        setPreviewMessage("");
      }

      if (rows.length > MAX_PREVIEW_ROWS) {
        setPreviewError(
          `Preview shows first ${MAX_PREVIEW_ROWS} rows. Server returned ${rows.length} rows.`,
        );
      }
    } catch (err) {
      console.error("Preview error:", err);
      const msg = await getErrorMessageFromAxiosError(err);
      setPreviewRows([]);
      setPreviewTotalRows(0);
      setPreviewMessage(msg);
      setPreviewError("");
      setPreviewOpen(true);
    } finally {
      setPreviewLoading(false);
    }
  };

  const keyToLabel = {};
  availableFields.forEach((f) => (keyToLabel[f.key] = f.label));
  const componentIsSelected = component && component !== "select";

  const totalPages = Math.max(
    1,
    Math.ceil((previewRows.length || 0) / PREVIEW_PAGE_SIZE),
  );
  const currentPage = Math.min(Math.max(1, previewPage), totalPages);
  const currentPageData = previewRows.slice(
    (currentPage - 1) * PREVIEW_PAGE_SIZE,
    currentPage * PREVIEW_PAGE_SIZE,
  );
  const goToPage = (p) => setPreviewPage(Math.min(Math.max(1, p), totalPages));

  const componentOptions = [
    { value: "leaves", label: "Leaves" },
    { value: "reimbursements", label: "Reimbursements" },
    { value: "employees", label: "Employees" },
    ...(isTeamRole ? [] : [{ value: "vendors", label: "Vendors" }]),
    ...(isTeamRole ? [] : [{ value: "assets", label: "Assets" }]),
    { value: "attendance", label: "Attendance" },
    { value: "tasks_employee", label: "Tasks (Employee Driven)" },
    { value: "tasks_supervisor", label: "Tasks (Supervisor Driven)" },
  ];

  return (
    <div className="rp-container">
      <header className="rp-header">
        <div className="rp-title">
          <MdOutlineAssessment size={28} />
          <div>
            <h2>Reports</h2>
            <p className="rp-sub">
              Export Leaves, Reimbursements, Employees, Vendors, Assets,
              Attendance, Tasks — Excel and PDF
            </p>
          </div>
        </div>
      </header>

      <section className="rp-card">
        <div className="rp-row">
          <label className="rp-label">Component</label>
          <select
            className="rep-select"
            value={component}
            onChange={(e) => setComponent(e.target.value)}
          >
            <option value="select" disabled>
              Select
            </option>
            {componentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rp-row rp-fields-row">
          <label className="rp-label">Fields</label>
          <div className="rp-fields-wrap">
            <div className="rp-fields-actions">
              <button
                type="button"
                className="rp-chip small"
                onClick={selectAllFields}
                aria-pressed={allSelected}
                title="Select all fields"
                disabled={!componentIsSelected || availableFields.length === 0}
              >
                {allSelected ? "All selected" : "Select all"}
              </button>
              <button
                type="button"
                className="rp-chip small"
                onClick={clearAllFields}
                title="Clear selection"
                disabled={!componentIsSelected || availableFields.length === 0}
              >
                Clear
              </button>
              {!componentIsSelected && (
                <span
                  className="rp-fields-selected-summary"
                  style={{ color: "#9aa4b2" }}
                >
                  Choose a component to see fields
                </span>
              )}
              {someSelected && componentIsSelected && (
                <span className="rp-fields-selected-summary">
                  {selectedFields.length} selected
                </span>
              )}
              {componentIsSelected && (
                <span
                  className="rp-fields-limit-summary"
                  style={{
                    marginLeft: 12,
                    color:
                      selectedFields.length > MAX_DOWNLOAD_FIELDS
                        ? "crimson"
                        : "#666",
                  }}
                >
                  {selectedFields.length} selected (max {MAX_DOWNLOAD_FIELDS}{" "}
                  for downloads)
                </span>
              )}
            </div>

            <FieldsGrid
              availableFields={availableFields}
              selectedFields={selectedFields}
              toggleField={toggleField}
              disabled={!componentIsSelected}
            />
          </div>
        </div>

        {component !== "vendors" && (
          <div className="rp-row">
            <label className="rp-label">Status</label>
            <select
              className="rep-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={!componentIsSelected || !statusOptions.length}
            >
              {statusOptions.length === 0 ? (
                <option value="All">—</option>
              ) : (
                statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        <div className="rp-row rp-dates rp-dates-4">
          <div className="rp-date-field">
            <label className="rp-label">Start Date</label>
            <div className="rp-input-with-icon">
              <MdDateRange className="rp-icon" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="rp-date-field">
            <label className="rp-label">End Date</label>
            <div className="rp-input-with-icon">
              <MdDateRange className="rp-icon" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {component !== "vendors" ? (
            <div className="rp-date-field rp-typeahead-field">
              <label className="rp-label">Employee Name</label>
              <EmployeeTypeahead
                onSelect={onEmployeeSelect}
                onTyping={onTypeStart}
                onClear={onEmployeeClear}
                employeeId={employeeId}
                departmentId={
                  isTeamRole ? effectiveManagerDepartmentId : filterDepartmentId
                }
                limit={10}
                selectedValue={filterEmployeeName}
                isTyping={isTypingSearch}
              />
              <div className="rp-typeahead-subtext">
                {filterEmployeeId ? (
                  <em>Filtering by employee: {filterEmployeeId}</em>
                ) : (
                  <em>Search by name or email</em>
                )}
              </div>
            </div>
          ) : (
            <div
              className="rp-date-field rp-typeahead-field"
              style={{ alignSelf: "flex-end" }}
            />
          )}

          {!isTeamRole && component !== "vendors" ? (
            <div className="rp-date-field rp-typeahead-field">
              <label className="rp-label">Department</label>
              <div>
                <select
                  className="rep-select"
                  value={filterDepartmentId || ""}
                  onChange={onDepartmentChange}
                  disabled={deptLoading}
                  aria-label="Select department"
                  style={{ width: "100%" }}
                >
                  <option value="">All departments</option>
                  {departments.map((d) => {
                    const id = d.department_id ?? d.id ?? d.departmentId ?? "";
                    const name =
                      d.department_name ?? d.name ?? d.departmentName ?? "";
                    return (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
                {deptLoading && (
                  <div className="rp-typeahead-subtext">
                    Loading departments…
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="rp-date-field rp-typeahead-field"
              style={{ alignSelf: "flex-end" }}
            ></div>
          )}
        </div>

        <div className="rp-presets">
          <button className="rp-chip" onClick={() => presetRange(7)}>
            Last 7 days
          </button>
          <button className="rp-chip" onClick={thisMonth}>
            This month
          </button>
          <button
            className="rp-chip"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
          >
            Clear Dates
          </button>
        </div>

        <div className="rp-actions">
          <button
            className="rp-btn preview"
            onClick={fetchPreview}
            disabled={previewLoading || !componentIsSelected}
            title={
              componentIsSelected
                ? "Preview table data"
                : "Select a component first"
            }
          >
            {previewLoading ? <span className="rp-spinner" /> : null}
            <span>{previewOpen ? "Refresh Preview" : "Preview"}</span>
          </button>

          <button
            className="rp-btn excel"
            onClick={() => download("xlsx")}
            disabled={downloadingXlsx || !componentIsSelected}
            title={
              componentIsSelected
                ? "Download Excel"
                : "Select a component first"
            }
          >
            {downloadingXlsx ? (
              <span className="rp-spinner" />
            ) : (
              <MdFileDownload />
            )}
            <span>Download Excel</span>
          </button>

          <button
            className="rp-btn pdf"
            onClick={() => download("pdf")}
            disabled={downloadingPdf || !componentIsSelected}
            title={
              componentIsSelected ? "Download PDF" : "Select a component first"
            }
          >
            {downloadingPdf ? (
              <span className="rp-spinner" />
            ) : (
              <MdPictureAsPdf />
            )}
            <span>Download PDF</span>
          </button>

          {previewOpen && (
            <button
              className="rp-btn"
              onClick={() => {
                setPreviewOpen(false);
                setPreviewRows([]);
                setPreviewError("");
                setPreviewMessage("");
              }}
            >
              Close Preview
            </button>
          )}
        </div>

        <div className="rp-note">
          <strong>Tip:</strong> Use the presets for quick ranges. For large
          exports, prefer Excel.
        </div>

        {previewOpen && (
          <div
            className="rp-preview-panel"
            role="region"
            aria-label="Report preview"
          >
            <div className="rp-preview-header">
              <strong>Preview</strong>
              <div className="rp-preview-meta">
                {previewLoading && (
                  <span className="rp-small-muted">Loading...</span>
                )}
                {!previewLoading && previewTotalRows != null && (
                  <span className="rp-small-muted">
                    Showing {currentPageData.length} of {previewTotalRows} rows
                    — page {currentPage} of {totalPages}
                  </span>
                )}
              </div>
            </div>

            {previewError && (
              <div className="rp-preview-error" role="alert">
                {previewError}
              </div>
            )}

            {!previewLoading && !previewError && previewRows.length === 0 && (
              <div className="rp-preview-empty rp-small-muted">
                {previewMessage || "No rows to preview with selected filters."}
              </div>
            )}

            {!previewLoading && previewRows.length > 0 && (
              <div className="rp-preview-table-wrap">
                <table className="rp-preview-table">
                  <thead>
                    <tr>
                      {selectedFields.map((k) => (
                        <th key={k}>{keyToLabel[k] || k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageData.map((row, idx) => (
                      <tr key={idx}>
                        {selectedFields.map((k) => {
                          if (component === "assets" && k === "status") {
                            const lifecycle =
                              row.__asset_lifecycle_status ||
                              row.lifecycle ||
                              deriveLifecycleFromAssignedTo(row.assigned_to);
                            return <td key={k + "-" + idx}>{lifecycle}</td>;
                          }

                          return (
                            <td key={k + "-" + idx}>
                              {row &&
                              Object.prototype.hasOwnProperty.call(row, k)
                                ? row[k] === null || row[k] === undefined
                                  ? ""
                                  : String(row[k])
                                : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <Pagination
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={goToPage}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        {alertModal.title && <h4>{alertModal.title}</h4>}
        <div style={{ whiteSpace: "pre-wrap" }}>{alertModal.message}</div>
      </Modal>
    </div>
  );
}
