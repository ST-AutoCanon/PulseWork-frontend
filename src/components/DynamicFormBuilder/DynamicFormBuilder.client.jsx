

"use client";
import React, { useState, useEffect , useMemo} from "react";
import "./DynamicFormBuilder.css";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { FiPlus ,FiSave} from "react-icons/fi";
import { FiDownload } from "react-icons/fi";export default function DynamicFormBuilder() {
  const { user } = useAuth();
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.orgId ??
    user?.Org_id ??
    user?.raw?.Org_id ??
    null;
  const currentEmployeeId = user?.employeeId ?? user?.id ?? null;
  const getHeaders = (extra = {}) => {
    const base = {
      "Content-Type": "application/json",
      "x-api-key": API_KEY || "",
      ...extra,
    };
    if (orgId) base["x-org-id"] = String(orgId);
    if (currentEmployeeId) base["x-employee-id"] = String(currentEmployeeId);
    return base;
  };
  // ─── States ────────────────────────────────────────────────
  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState([]);
  const [fieldType, setFieldType] = useState("text");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldPlaceholder, setFieldPlaceholder] = useState("");
  const [optionsInput, setOptionsInput] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selfForms, setSelfForms] = useState([]);
  const [teamSubmissions, setTeamSubmissions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [fillMode, setFillMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [currentResponses, setCurrentResponses] = useState([]);
  const [currentFormTitle, setCurrentFormTitle] = useState("");
  const [layoutMode, setLayoutMode] = useState("one");
  const [activeFrom, setActiveFrom] = useState("");
  const [activeTo, setActiveTo] = useState("");
  const [formType, setFormType] = useState("employee_only");
  const [hasSupervisorFeedback, setHasSupervisorFeedback] = useState(false);
  const [supervisorLabel, setSupervisorLabel] = useState("");
  const [supervisorType, setSupervisorType] = useState("text");
  const [supervisorRequired, setSupervisorRequired] = useState(false);
  const [supervisorVisibleToEmployee, setSupervisorVisibleToEmployee] = useState(true);
  const [supervisorOptionsInput, setSupervisorOptionsInput] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [showAssignSection, setShowAssignSection] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [myTeamEmployeeIds, setMyTeamEmployeeIds] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [viewingSubmission, setViewingSubmission] = useState(false);
  const [activeTab, setActiveTab] = useState("self");
  const [alreadyAssignedIds, setAlreadyAssignedIds] = useState([]);
  const [expandedResponses, setExpandedResponses] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [supervisorFieldsList, setSupervisorFieldsList] = useState([]); // multiple supervisor fields
const [editingSupervisorIndex, setEditingSupervisorIndex] = useState(null);
const [supervisorPlaceholder, setSupervisorPlaceholder] = useState("");

const isFormActive = (from, to) => {
  if (!from && !to) return true;

  const now = new Date();

  // Normalize dates to start/end of day in local time (IST)
  const normalizeToStartOfDay = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const normalizeToEndOfDay = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const fromDate = normalizeToStartOfDay(from);
  const toDate = normalizeToEndOfDay(to);

  // Case 1: Both from and to are set
  if (fromDate && toDate) {
    return now >= fromDate && now <= toDate;
  }

  // Case 2: Only from is set (active from that day onwards)
  if (fromDate) {
    return now >= fromDate;
  }

  // Case 3: Only to is set (active until that day)
  if (toDate) {
    return now <= toDate;
  }

  return true;
};
  // Alert Modal State
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
    type: "info",
  });
  const showAlert = (message, title = "", type = "info") => {
    setAlertModal({
      isVisible: true,
      title: title || (type === "success" ? "Success" : type === "error" ? "Error" : ""),
      message,
      type,
    });
  };
  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "", type: "info" });
  };
  const normalizeDateForInput = (value) => {
    if (!value) return "";
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value !== "string") return "";
    return value.split("T")[0].split(" ")[0];
  };
  // ==================== COMPUTED FILTERED EMPLOYEES ====================
const filteredEmployees = React.useMemo(() => {
  if (!searchTerm.trim()) return employees;

  const searchLower = searchTerm.toLowerCase().trim();

  return employees.filter((emp) => {
    const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`
      .trim()
      .toLowerCase();
    
    const empId = String(emp.employee_id || emp.id || "").toLowerCase();

    return fullName.includes(searchLower) || empId.includes(searchLower);
  });
}, [employees, searchTerm]);
 const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
  // ─── Role Checks ─────────────────────────────────────────────
  const normalizedRole = (user?.role || user?.raw?.role || "").toString().toLowerCase();
  const isAdmin = Boolean(
    normalizedRole === "admin" ||
    normalizedRole === "superadmin" ||
    user?.isAdmin === true ||
    user?.raw?.isAdmin === true
  );
  const isHR = normalizedRole === "hr";
  const canBuildForms = isAdmin || isHR;
  const canSeeAllTab = isAdmin || isHR;
  // ─── Effects ────────────────────────────────────────────────
  useEffect(() => {
    if (!orgId || !currentEmployeeId) return;
    const checkSupervisorStatus = async () => {
      try {
        let team = [];
        const res = await fetch(`${BACKEND_URL}/api/supervisor/employees`, {
          method: "GET",
          credentials: "include",
          headers: getHeaders(),
        });
        if (res.ok) {
          const json = await res.json();
          team = json.employees || json.data || json || [];
        } else {
          const fallback = await fetch(`${BACKEND_URL}/api/employees`, {
            method: "GET",
            credentials: "include",
            headers: getHeaders(),
          });
          if (fallback.ok) {
            const all = await fallback.json();
            const data = all.data || all.employees || all || [];
            team = (Array.isArray(data) ? data : []).filter(
              (emp) => String(emp.supervisor_id || emp.supervisorId || "") === String(currentEmployeeId)
            );
          }
        }
        const teamIds = (Array.isArray(team) ? team : [])
          .map((emp) => String(emp.employee_id || emp.id))
          .filter(Boolean);
        setMyTeamEmployeeIds(teamIds);
        setIsSupervisor(teamIds.length > 0);
      } catch (err) {
        console.error("Team fetch failed:", err);
        setIsSupervisor(false);
        setMyTeamEmployeeIds([]);
      }
    };
    checkSupervisorStatus();
  }, [orgId, currentEmployeeId, BACKEND_URL]);
// Set default tab for Admin (only All Forms)
useEffect(() => {
  if (isAdmin && !isHR) {
    setActiveTab("all");
  }
}, [isAdmin, isHR]);

const formatSubmittedTime = (dateString) => {
  if (!dateString) return "—";

  const date = new Date(dateString);

  // Force IST (Asia/Kolkata)
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
const fetchTeamSubmissions = async () => {
  if (!isSupervisor || myTeamEmployeeIds.length === 0) {
    console.log("🚫 Skipping team fetch: Not supervisor or no team members");
    setTeamSubmissions([]);
    return;
  }

  console.log("📡 Fetching team submissions for", myTeamEmployeeIds.length, "employees...");

  try {
    const res = await fetch(`${BACKEND_URL}/api/forms/team-submissions`, {
      method: "GET",
      credentials: "include",
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error("❌ Team API failed:", res.status);
      setTeamSubmissions([]);
      return;
    }

    const json = await res.json();
    let submissions = Array.isArray(json) ? json :
                     json.data || json.submissions || json.responses || [];

    console.log(`✅ Received ${submissions.length} team submissions from backend`);

    // 🔥 FILTER 1: Only employee_supervisor forms
    // 🔥 FILTER 2: Only employees under this supervisor
    submissions = submissions.filter(sub => {
      const empId = String(sub.employee_id || sub.employeeId || "");
      return (
        (sub.form_type === 'employee_supervisor' || !sub.form_type) &&
        myTeamEmployeeIds.includes(empId)
      );
    });

    console.log(`✅ After filtering: ${submissions.length} relevant submissions`);
    setTeamSubmissions(submissions);

  } catch (err) {
    console.error("❌ Team submissions fetch error:", err);
    setTeamSubmissions([]);
  }
};
// Add this useEffect near your other effects
useEffect(() => {
  if (!orgId) return;

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/employees`, {
        method: "GET",
        credentials: "include",
        headers: getHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        const empList = Array.isArray(json) 
          ? json 
          : json.data || json.employees || json || [];
        
        setEmployees(empList);
      } else {
        console.error("Failed to fetch employees:", res.status);
        setEmployees([]);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    }
  };

  fetchEmployees();
}, [orgId, BACKEND_URL]);   // Add any other deps if needed (e.g. currentEmployeeId)
 // Improved data fetching with proper dependencies
useEffect(() => {
  if (!orgId) return;

  fetchForms();
  fetchSelfForms();

  if (isSupervisor || isHR) {
    fetchTeamSubmissions();
  }
}, [orgId, isSupervisor, isHR]);   // Removed canBuildForms to avoid unnecessary re-renders
// Refetch team submissions when coming back from review mode
useEffect(() => {
  if (!fillMode && !viewMode && isSupervisor) {
    fetchTeamSubmissions();
  }
}, [fillMode, viewMode, isSupervisor]);
  const fetchForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/forms`, {
        method: "GET",
        credentials: "include",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load forms");
      const json = await res.json();
      setTemplates(getFormListFromResponse(json));
    } catch (err) {
      console.error(err);
      setError("Failed to load forms");
    } finally {
      setLoading(false);
    }
  };
  const fetchSelfForms = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/forms/assigned`, {
        method: "GET",
        credentials: "include",
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setSelfForms(getFormListFromResponse(json));
      }
    } catch (err) {
      console.error(err);
    }
  };
  const getFormListFromResponse = (json) => {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.forms)) return json.forms;
    return [];
  };
  // Load already assigned employees when form is being edited
// Fetch already assigned employees when editing a form
useEffect(() => {
  if (!editingId) {
    setAlreadyAssignedIds([]);
    return;
  }
// Filtered employees based on search
const filteredEmployees = employees.filter((emp) => {
  if (!searchTerm) return true;
  
  const searchLower = searchTerm.toLowerCase().trim();
  const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`.toLowerCase();
  const empId = String(emp.employee_id || emp.id || "").toLowerCase();

  return fullName.includes(searchLower) || empId.includes(searchLower);
});
  const fetchAlreadyAssigned = async () => {
    try {
      console.log(`🔍 Fetching assigned employees for form ID: ${editingId}`);
      
      const res = await fetch(`${BACKEND_URL}/api/forms/${editingId}/assigned`, {
        method: "GET",
        credentials: "include",
        headers: getHeaders(),
      });

      console.log(`📡 Response status: ${res.status}`);

      if (res.ok) {
        const json = await res.json();
        console.log("📦 Raw response from /assigned:", json);

        const assignedData = json.data || json.assigned || json.employeeIds || json || [];
        const ids = assignedData.map((item) =>
          String(item.employee_id || item.id || item.employeeId)
        ).filter(Boolean);

        console.log("✅ Final Already Assigned IDs:", ids);
        setAlreadyAssignedIds(ids);
      } else {
        const errorText = await res.text();
        console.log("❌ API Error:", errorText);
        setAlreadyAssignedIds([]);
      }
    } catch (err) {
      console.error("🚨 Fetch error:", err);
      setAlreadyAssignedIds([]);
    }
  };

  fetchAlreadyAssigned();
}, [editingId, BACKEND_URL]);  // Important: re-run when editingId changes
  // ==================== ALL ORIGINAL FUNCTIONS ====================
  useEffect(() => {
    const needsOptions = ["select", "radio", "checkbox-group"].includes(fieldType);
    setShowOptions(needsOptions);
    if (!needsOptions) setOptionsInput("");
  }, [fieldType]);
 useEffect(() => {
  if (editingFieldId) {
    const field = fields.find((f) => f.id === editingFieldId);
    if (field) {
      // === Employee Field Settings ===
      setFieldLabel(field.employee.label || "");
      setFieldType(field.employee.type || "text");
      setFieldRequired(field.employee.required || false);
      setFieldPlaceholder(field.employee.placeholder || "");

      if (field.employee.options && Array.isArray(field.employee.options)) {
        setOptionsInput(field.employee.options.map((o) => o.label).join(", "));
      } else {
        setOptionsInput("");
      }

      // === Supervisor Fields Handling (Multiple Support) ===
      if (field.supervisorFields && Array.isArray(field.supervisorFields) && field.supervisorFields.length > 0) {
        setHasSupervisorFeedback(true);
        setSupervisorFieldsList([...field.supervisorFields]);   // Load all supervisor fields
      } 
      // Backward compatibility for old single supervisor field
      else if (field.supervisor) {
        setHasSupervisorFeedback(true);
        setSupervisorFieldsList([{
          ...field.supervisor,
          id: field.supervisor.id || Date.now().toString() + "_sup"
        }]);
      } 
      else {
        setHasSupervisorFeedback(false);
        setSupervisorFieldsList([]);
      }

      // Reset supervisor input fields when editing starts
      setSupervisorLabel("");
      setSupervisorType("text");
      setSupervisorRequired(false);
      setSupervisorVisibleToEmployee(true);
      setSupervisorOptionsInput("");
      setEditingSupervisorIndex(null);
    }
  } else {
    // Reset when not editing
    setSupervisorFieldsList([]);
    setHasSupervisorFeedback(false);
  }
}, [editingFieldId, fields]);

  // Debug Info
  useEffect(() => {
    console.log("=== DEBUG INFO ===");
    console.log("isSupervisor:", isSupervisor);
    console.log("myTeamEmployeeIds:", myTeamEmployeeIds);
    console.log("canBuildForms:", canBuildForms);
    console.log("activeTab:", activeTab);
    console.log("teamSubmissions length:", teamSubmissions.length);
    console.log("teamSubmissions:", teamSubmissions);
  }, [isSupervisor, myTeamEmployeeIds, canBuildForms, activeTab, teamSubmissions]);
const toggleResponse = (index) => {
  setExpandedResponses((prev) => {
    const newSet = new Set(prev);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    return newSet;
  });
};    const addOrUpdateField = () => {
      const trimmed = fieldLabel.trim();
      if (!trimmed) {
        showAlert("Field label is required.");
        return;
      }

      let employeeConfig = {
        label: trimmed,
        type: fieldType,
        required: fieldRequired,
        placeholder: fieldPlaceholder.trim() || undefined,
      };

      if (showOptions) {
        const opts = optionsInput
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
          .map((label) => ({ label, value: label.toLowerCase().replace(/\s+/g, "-") }));

        if (opts.length === 0) {
          showAlert("Please provide at least one option for the employee field.");
          return;
        }
        employeeConfig.options = opts;
      }

      // === Multiple Supervisor Fields ===
      let supervisorFields = [];
      if (formType === 'employee_supervisor' && hasSupervisorFeedback) {
        if (supervisorFieldsList.length === 0) {
          showAlert("Please add at least one supervisor feedback field.");
          return;
        }
        supervisorFields = [...supervisorFieldsList];
      }

      const newField = {
        id: editingFieldId || Date.now().toString(),
        employee: employeeConfig,
        supervisorFields: supervisorFields.length > 0 ? supervisorFields : undefined,
      };

      if (editingFieldId) {
        setFields(fields.map((f) => (f.id === editingFieldId ? newField : f)));
      } else {
        setFields([...fields, newField]);
      }

      // Reset everything
      setFieldLabel("");
      setFieldType("text");
      setFieldRequired(false);
      setFieldPlaceholder("");
      setOptionsInput("");
      setHasSupervisorFeedback(false);
      setSupervisorFieldsList([]);
      setSupervisorLabel("");
      setSupervisorType("text");
      setSupervisorRequired(false);
      setSupervisorVisibleToEmployee(true);
      setSupervisorOptionsInput("");
      setEditingFieldId(null);
    };
  const deleteField = (id) => {
    setFields(fields.filter((f) => f.id !== id));
    if (editingFieldId === id) setEditingFieldId(null);
  };
  const editField = (id) => setEditingFieldId(id);
  const saveTemplate = async () => {
  // Validation - Show only in popup modal
  if (!formName.trim()) {
    showAlert("Please enter a Form Name.",  );
    return;
  }

  if (fields.length === 0) {
    showAlert("Please add at least one field to the form before creating it.", );
    return;
  }

if (formType === 'employee_supervisor' && !fields.some(f => f.supervisorFields && f.supervisorFields.length > 0)) {    showAlert("For Employee + Supervisor form, please add at least one field with supervisor feedback.",  );
    return;
  }

  setLoading(true);
  setError(null);   // Clear any old error

  try {
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${BACKEND_URL}/api/forms/${editingId}`
      : `${BACKEND_URL}/api/forms`;

    const payload = {
      form_name: formName.trim(),
      form_json: fields,
      layout: layoutMode,
      active_from: activeFrom || null,
      active_to: activeTo || null,
      form_type: formType,
    };

    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Failed to save form");

    await fetchForms();
    resetForm();

    showAlert(
      editingId ? "Form updated successfully!" : "Form created successfully!", 
      "Success", 
      "success"
    );

  } catch (err) {
    console.error(err);
    showAlert("Failed to save the form. Please try again later.", "Error", "error");
  } finally {
    setLoading(false);
  }
};
  
  const resetForm = () => {
    setFormName("");
    setFields([]);
    setEditingId(null);
    setEditingFieldId(null);
    setFieldLabel("");
    setFieldType("text");
    setFieldRequired(false);
    setFieldPlaceholder("");
    setOptionsInput("");
    setLayoutMode("one");
    setActiveFrom("");
    setActiveTo("");
    setFormType("employee_only");
    setHasSupervisorFeedback(false);
    setSupervisorLabel("");
    setSupervisorType("text");
    setSupervisorRequired(false);
    setSupervisorVisibleToEmployee(true);
    setSupervisorOptionsInput("");
  };
  const editTemplate = async (template) => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/forms/${template.id}`, {
        method: "GET",
        credentials: "include",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch form");
      const json = await res.json();
      const form = json.data || json;
      setFormName(form.form_name);
      let formJson = form.form_json;
      if (typeof formJson === 'string') {
        try {
          formJson = JSON.parse(formJson);
        } catch (e) {
          formJson = [];
        }
      }
      let empFields = [];
      if (form.form_type === 'employee_supervisor') {
        if (formJson?.employeeFields && Array.isArray(formJson.employeeFields)) {
          const employeeFields = formJson.employeeFields || [];
          const supervisorFields = formJson.supervisorFields || [];
          empFields = employeeFields.map((ef, i) => ({
            id: ef.id || `emp_${i}`,
            employee: ef,
            supervisor: supervisorFields.find(sf => sf.id === ef.id) || undefined
          }));
        } else if (Array.isArray(formJson)) {
          empFields = formJson.map(f => f.employee ? f : { id: f.id, employee: f, supervisor: undefined });
        }
      } else {
        if (Array.isArray(formJson)) {
          empFields = formJson.map(f => f.employee ? f : { id: f.id, employee: f, supervisor: undefined });
        }
      }
      setFields(empFields);
      setActiveFrom(normalizeDateForInput(form.active_from));
      setActiveTo(normalizeDateForInput(form.active_to));
      setLayoutMode(form.layout || "one");
      setFormType(form.form_type || "employee_only");
      setEditingId(form.id);
      setViewMode(false);
      setFillMode(false);
      setIsReviewMode(false);
      setTeamSubmissions([]);
      setSelectedSubmission(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load form");
    } finally {
      setLoading(false);
    }
  };
  const viewTemplate = async (template) => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/forms/${template.id}`, {
        method: "GET",
        credentials: "include",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch form");
      const json = await res.json();
      let form = json.data || json;
      if (typeof form.form_json === 'string') {
        try {
          form.form_json = JSON.parse(form.form_json);
        } catch (e) {
          form.form_json = [];
        }
      }
      setSelectedTemplate(form);
      setViewMode(true);
      setFillMode(false);
      setIsReviewMode(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load form");
    } finally {
      setLoading(false);
    }
  };
 const fillTemplate = async (template) => {
  try {
    setLoading(true);
    setError(null);

    const res = await fetch(`${BACKEND_URL}/api/forms/${template.id}`, {
      method: "GET",
      credentials: "include",
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error("Failed to load form");

    const json = await res.json();
    let form = json.data || json;

    if (typeof form.form_json === 'string') {
      try {
        form.form_json = JSON.parse(form.form_json);
      } catch (e) {
        form.form_json = [];
      }
    }

    // ==================== CRITICAL FIX ====================
    // Use dates from the template list (card) if backend doesn't return them
    if (!form.active_from && template.active_from) {
      form.active_from = template.active_from;
    }
    if (!form.active_to && template.active_to) {
      form.active_to = template.active_to;
    }

    console.log("=== FILL TEMPLATE DATE FIX ===");
    console.log("Template (card) dates:", {
      active_from: template.active_from,
      active_to: template.active_to
    });
    console.log("Form (fetched) dates:", {
      active_from: form.active_from,
      active_to: form.active_to
    });

    const isCurrentlyActive = isFormActive(form.active_from, form.active_to);

    if (!isCurrentlyActive) {
      showAlert(
        `This form is not active at this time.\n\nActive From: ${form.active_from || "Not Set"}\nActive To: ${form.active_to || "Not Set"}`,
        "Form Not Active",
        "warning"
      );
      setSelectedTemplate(null);
      setFillMode(false);
      return;
    }

    setSelectedTemplate(form);
    setViewMode(false);
    setFillMode(true);
    setFormData({});
    setIsReviewMode(false);
    setHasSubmitted(false);
    setSubmissionData(null);
    setViewingSubmission(false);

    // Check if user already submitted
    const responseRes = await fetch(`${BACKEND_URL}/api/forms/${template.id}/responses`, {
      method: "GET",
      credentials: "include",
      headers: getHeaders(),
    });

    if (responseRes.ok) {
      const respJson = await responseRes.json();
      let rawResponses = Array.isArray(respJson) ? respJson : respJson.data || respJson.responses || [];
      const userSubmission = rawResponses.find(r =>
        String(r.employee_id || r.employeeId) === String(currentEmployeeId)
      );
      if (userSubmission) {
        setHasSubmitted(true);
        setSubmissionData(userSubmission);
      }
    }
  } catch (err) {
    console.error("Fill template error:", err);
    showAlert("Failed to load the form. Please try again.", "Error", "error");
  } finally {
    setLoading(false);
  }
};
const handleSelectSubmission = async (submission) => {
  console.log("Selected submission:", submission);

  setSelectedSubmission(submission);
  setFormData(submission.response_json || {});

  setIsReviewMode(true);
  setFillMode(true);

  // Fetch the actual form template
  const formId = submission.form_id || submission.formId || submission.template_id;
  if (formId) {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/forms/${formId}`, {
        method: "GET",
        credentials: "include",
        headers: getHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        let form = json.data || json;

        if (typeof form.form_json === 'string') {
          try { form.form_json = JSON.parse(form.form_json); } catch (e) { form.form_json = []; }
        }

        setSelectedTemplate(form);
      }
    } catch (err) {
      console.error("Failed to load form for review", err);
    } finally {
      setLoading(false);
    }
  }
};
  const handleInputChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };
  const validateForm = () => {
    let isValid = true;
    const errors = [];
    let fieldsToValidate = [];
    let formJson = selectedTemplate.form_json || [];
    if (typeof formJson === 'string') {
      try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
    }
    if (selectedTemplate.form_type === 'employee_supervisor') {
      formJson.forEach(f => {
        if (!f.employee) return;
        fieldsToValidate.push({ ...f.employee, fieldId: f.id, isSupervisor: false });
        if (isReviewMode && f.supervisor) {
          fieldsToValidate.push({ ...f.supervisor, fieldId: f.id + '_sup', isSupervisor: true });
        }
      });
    } else {
      formJson.forEach(f => {
        const field = f.employee || f;
        fieldsToValidate.push({ ...field, fieldId: f.id || field.id, isSupervisor: false });
      });
    }
    fieldsToValidate.forEach(field => {
      const fieldId = field.fieldId;
      const value = formData[fieldId];
      const isSupervisorField = field.isSupervisor;
      if (isSupervisorField && !isReviewMode) return;
      const isRequired = field.required === true;
      if (isRequired) {
        let hasValue = false;
        if (value === undefined || value === null || value === "") hasValue = false;
        else if (Array.isArray(value)) hasValue = value.length > 0;
        else if (typeof value === "string") hasValue = value.trim() !== "";
        else hasValue = true;
        if (!hasValue) {
          isValid = false;
          const fieldLabel = field.label || `Field ${fieldId}`;
          errors.push(`"${fieldLabel}" is required${isSupervisorField ? " (Supervisor)" : ""}`);
        }
      }
    });
    if (!isValid) {
      showAlert("Please fill all required fields:\n\n" + errors.join("\n"), "error");
    }
    return isValid;
  };
  const submitFilledForm = async () => {
    if (!selectedTemplate?.id) return;
    if (!validateForm()) return;
    setLoading(true);
    try {
      const responsePayload = {
        ...formData,
        __submitted_by: currentEmployeeId,
        __submitted_at: new Date().toISOString(),
      };
      if (isReviewMode) {
        responsePayload.__reviewed_by = currentEmployeeId;
        responsePayload.__reviewed_employee = selectedSubmission?.employee_id || selectedSubmission?.employeeId || null;
        responsePayload.__is_review = true;
      }
      const res = await fetch(`${BACKEND_URL}/api/forms/${selectedTemplate.id}/submit`, {
        method: "POST",
        credentials: "include",
        headers: getHeaders(),
        body: JSON.stringify({
          response_json: responsePayload,
          isReview: isReviewMode,
          reviewedEmployeeId: selectedSubmission?.employee_id || selectedSubmission?.employeeId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Submission failed");
      }
      showAlert(isReviewMode ? "Review submitted successfully!" : "Form submitted successfully!", "Success", "success");
      setHasSubmitted(true);
      setSubmissionData({ response_json: responsePayload });
      setFillMode(false);
      setIsReviewMode(false);
      setTeamSubmissions([]);
      setSelectedSubmission(null);
      setFormData({});
    } catch (err) {
      console.error("Submit error:", err);
      showAlert("Failed to submit: " + err.message, "Error", "error");
    } finally {
      setLoading(false);
    }
  };
 const addOrUpdateSupervisorField = () => {
  if (!supervisorLabel.trim()) {
    showAlert("Supervisor field label is required");
    return;
  }

  const newSupField = {
    id: Date.now().toString() + "_sup",
    label: supervisorLabel.trim(),
    type: supervisorType,
    required: supervisorRequired,
    visibleToEmployee: supervisorVisibleToEmployee,
    placeholder: supervisorPlaceholder.trim() || undefined,   // ← ADD THIS LINE
  };

  // Options for radio / checkbox-group
  if ((supervisorType === 'radio' || supervisorType === 'checkbox-group') && supervisorOptionsInput.trim()) {
    newSupField.options = supervisorOptionsInput
      .split(",")
      .map(o => o.trim())
      .filter(Boolean)
      .map(label => ({
        label,
        value: label.toLowerCase().replace(/\s+/g, "-")
      }));
  }

  if (editingSupervisorIndex !== null) {
    const updated = [...supervisorFieldsList];
    updated[editingSupervisorIndex] = newSupField;
    setSupervisorFieldsList(updated);
    setEditingSupervisorIndex(null);
  } else {
    setSupervisorFieldsList([...supervisorFieldsList, newSupField]);
  }

  // Reset all inputs
  setSupervisorLabel("");
  setSupervisorType("text");
  setSupervisorRequired(false);
  setSupervisorVisibleToEmployee(true);
  setSupervisorOptionsInput("");
  setSupervisorPlaceholder("");   // ← Make sure this exists
};

const editSupervisorField = (index) => {
  const sup = supervisorFieldsList[index];
  if (!sup) return;

  setSupervisorLabel(sup.label || "");
  setSupervisorType(sup.type || "text");
  setSupervisorRequired(sup.required || false);
  setSupervisorVisibleToEmployee(sup.visibleToEmployee !== false);
  setSupervisorOptionsInput(sup.options ? sup.options.map(o => o.label).join(", ") : "");
  setSupervisorPlaceholder(sup.placeholder || "");   // ← This must be here
  setEditingSupervisorIndex(index);
};

const deleteSupervisorField = (index) => {
  setSupervisorFieldsList(prev => prev.filter((_, i) => i !== index));
  if (editingSupervisorIndex === index) setEditingSupervisorIndex(null);
};
const renderField = (field, isPreview = true, onChange = null) => {
  const fieldKey = field.fieldId || field.id;
  const isDisabled = isPreview || field.readOnly || false;

  // Use passed onChange or fallback to default
  const handleChange = (value) => {
    if (onChange) {
      onChange(fieldKey, value);
    } else {
      handleInputChange(fieldKey, value);
    }
  };

  const currentValue = formData[fieldKey];

  switch (field.type) {
    case "text":
    case "email":
    case "number":
      return (
        <input
          type={field.type}
          placeholder={field.placeholder || ""}
          className="df-input"
          disabled={isDisabled}
          value={currentValue || ""}
          onChange={(e) => handleChange(e.target.value)}
          required={field.required && !isDisabled}
        />
      );

    case "textarea":
      return (
        <textarea
          placeholder={field.placeholder || ""}
          className="df-input"
          disabled={isDisabled}
          value={currentValue || ""}
          onChange={(e) => handleChange(e.target.value)}
          rows={4}
          required={field.required && !isDisabled}
        />
      );

    case "date":
      return (
        <input
          type="date"
          className="df-input"
          disabled={isDisabled}
          value={currentValue || ""}
          onChange={(e) => handleChange(e.target.value)}
          required={field.required && !isDisabled}
        />
      );

    case "daterange":
      const rangeValue = currentValue || { start: "", end: "" };
      return (
        <div className="df-date-range" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.85rem", color: "#666", display: "block", marginBottom: "4px" }}>Start Date</label>
            <input
              type="date"
              className="df-input"
              disabled={isDisabled}
              value={rangeValue.start || ""}
              onChange={(e) => {
                const newRange = { ...(rangeValue || {}), start: e.target.value };
                handleChange(newRange);
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.85rem", color: "#666", display: "block", marginBottom: "4px" }}>End Date</label>
            <input
              type="date"
              className="df-input"
              disabled={isDisabled}
              value={rangeValue.end || ""}
              onChange={(e) => {
                const newRange = { ...(rangeValue || {}), end: e.target.value };
                handleChange(newRange);
              }}
            />
          </div>
        </div>
      );

    case "select":
      return (
        <select
          className="df-input"
          disabled={isDisabled}
          value={currentValue || ""}
          onChange={(e) => handleChange(e.target.value)}
          required={field.required && !isDisabled}
        >
          <option value="">-- Select {field.label} --</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "radio":
      return (
        <div className="df-radio-group">
          {field.options?.map((opt) => (
            <label key={opt.value} className="df-radio-label">
              <input
                type="radio"
                name={fieldKey}                    // Important for grouping
                value={opt.value}
                checked={currentValue === opt.value}
                disabled={isDisabled}
                onChange={(e) => handleChange(e.target.value)}
                required={field.required && !isDisabled}
              />
              {opt.label}
            </label>
          ))}
        </div>
      );

    // FIXED: Checkbox Group - Works for both Employee & Supervisor fields
    case "checkbox-group":
      const selectedValues = Array.isArray(currentValue) ? currentValue : [];

      return (
        <div className="df-checkbox-group">
          {field.options?.map((opt) => {
            const isChecked = selectedValues.includes(opt.value);

            return (
              <label key={opt.value} className="df-checkbox-label">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={(e) => {
                    let updated;
                    if (e.target.checked) {
                      updated = [...selectedValues, opt.value];        // Add
                    } else {
                      updated = selectedValues.filter((v) => v !== opt.value); // Remove
                    }
                    handleChange(updated);
                  }}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      );

    case "checkbox":
      return (
        <input
          type="checkbox"
          disabled={isDisabled}
          checked={!!currentValue}
          onChange={(e) => handleChange(e.target.checked)}
        />
      );

    case "rating":
      const currentRating = Number(currentValue) || 0;
      return (
        <div className="df-rating-container">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`df-star ${currentRating >= star ? "filled" : ""} ${isDisabled ? "disabled" : ""}`}
              onClick={() => !isDisabled && handleChange(star)}
              style={{ cursor: isDisabled ? "default" : "pointer", fontSize: "2rem" }}
            >
              ★
            </span>
          ))}
          {currentRating > 0 && <span className="df-rating-value">({currentRating})</span>}
        </div>
      );

    default:
      return <em>Unsupported field type: {field.type}</em>;
  }
};
// ==================== DOWNLOAD FORM RESPONSES AS EXCEL (with Supervisor Label) ====================
// const downloadFormResponsesAsExcel = async (form) => {
//   try {
//     setLoading(true);
//     showAlert("Preparing Excel file...", "Info");

//     // Fetch form details
//     const formRes = await fetch(`${BACKEND_URL}/api/forms/${form.id}`, {
//       credentials: "include",
//       headers: getHeaders(),
//     });
//     if (!formRes.ok) throw new Error("Failed to fetch form");

//     const formJson = await formRes.json();
//     const formData = formJson.data || formJson;

//     // Fetch responses
//     const res = await fetch(`${BACKEND_URL}/api/forms/${form.id}/responses`, {
//       method: "GET",
//       credentials: "include",
//       headers: getHeaders(),
//     });
//     if (!res.ok) throw new Error("Failed to fetch responses");

//     const json = await res.json();
//     let rawResponses = Array.isArray(json) ? json : json.data || json.responses || [];

//     // Fetch assigned employees
//     let assignedEmployees = [];
//     try {
//       const assignRes = await fetch(`${BACKEND_URL}/api/forms/${form.id}/assigned`, {
//         method: "GET",
//         credentials: "include",
//         headers: getHeaders(),
//       });
//       if (assignRes.ok) {
//         const assignJson = await assignRes.json();
//         assignedEmployees = assignJson.data || assignJson.assigned || assignJson.employeeIds || [];
//       }
//     } catch (e) {
//       console.warn("Assigned employees fetch failed");
//     }

//     if (assignedEmployees.length === 0) {
//       showAlert("No employees are assigned to this form yet.", "Warning", "warning");
//       return;
//     }

//     const submittedMap = new Map(rawResponses.map(r => [String(r.employee_id || r.employeeId || ""), r]));

//     const fieldHeaders = getFieldHeaders(formData);   // Now includes (Supervisor) tag

//     const excelData = [
//       ["Employee Name", "Employee ID", "Status", "Submitted At", ...fieldHeaders]
//     ];

//     assignedEmployees.forEach((emp) => {
//       const empId = String(emp.employee_id || emp.id || "");
//       const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`.trim() || `Employee ${empId}`;
//       const submitted = submittedMap.get(empId);

//       const baseRow = [
//         fullName,
//         empId,
//         submitted ? "Submitted" : "Not Submitted",
//         submitted?.submitted_at ? formatSubmittedTime(submitted.submitted_at) : "—",
//       ];

//       if (submitted) {
//         const values = getFieldValues(submitted.response_json || {}, formData);
//         excelData.push([...baseRow, ...values]);
//       } else {
//         excelData.push([...baseRow, ...Array(fieldHeaders.length).fill("—")]);
//       }
//     });

//     // Generate Excel
//     const XLSX = await import('xlsx');
//     const ws = XLSX.utils.aoa_to_sheet(excelData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Responses");

//     const safeName = (form.form_name || "Form").replace(/[^a-zA-Z0-9]/g, "_");
//     const fileName = `${safeName}_Responses_${new Date().toISOString().slice(0,10)}.xlsx`;

//     XLSX.writeFile(wb, fileName);

//     showAlert(`✅ Excel downloaded successfully!\n${fileName}`, "Success", "success");

//   } catch (err) {
//     console.error("Excel download error:", err);
//     showAlert("Failed to generate Excel file. Please try again.", "Error", "error");
//   } finally {
//     setLoading(false);
//   }
// };
// ==================== DOWNLOAD FORM RESPONSES AS EXCEL (Fixed Date + Supervisor Label) ====================
const downloadFormResponsesAsExcel = async (form) => {
  try {
    setLoading(true);
    showAlert("Preparing Excel file...", "Info");

    // Fetch form details
    const formRes = await fetch(`${BACKEND_URL}/api/forms/${form.id}`, {
      credentials: "include",
      headers: getHeaders(),
    });
    if (!formRes.ok) throw new Error("Failed to fetch form");

    const formJson = await formRes.json();
    const formData = formJson.data || formJson;

    // Fetch responses
    const res = await fetch(`${BACKEND_URL}/api/forms/${form.id}/responses`, {
      method: "GET",
      credentials: "include",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch responses");

    const json = await res.json();
    let rawResponses = Array.isArray(json) ? json : json.data || json.responses || [];

    // Fetch assigned employees
    let assignedEmployees = [];
    try {
      const assignRes = await fetch(`${BACKEND_URL}/api/forms/${form.id}/assigned`, {
        method: "GET",
        credentials: "include",
        headers: getHeaders(),
      });
      if (assignRes.ok) {
        const assignJson = await assignRes.json();
        assignedEmployees = assignJson.data || assignJson.assigned || assignJson.employeeIds || [];
      }
    } catch (e) {
      console.warn("Assigned employees fetch failed");
    }

    if (assignedEmployees.length === 0) {
      showAlert("No employees are assigned to this form yet.", "Warning", "warning");
      return;
    }

    const submittedMap = new Map(rawResponses.map(r => [String(r.employee_id || r.employeeId || ""), r]));

    const fieldHeaders = getFieldHeaders(formData);

    const excelData = [
      ["Employee Name", "Employee ID", "Status", "Submitted At", ...fieldHeaders]
    ];

    assignedEmployees.forEach((emp) => {
      const empId = String(emp.employee_id || emp.id || "");
      const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`.trim() || `Employee ${empId}`;
      const submitted = submittedMap.get(empId);

      const baseRow = [
        fullName,
        empId,
        submitted ? "Submitted" : "Not Submitted",
        submitted?.submitted_at ? formatSubmittedTime(submitted.submitted_at) : "—",
      ];

      if (submitted) {
        baseRow.push(...getFieldValues(submitted.response_json || {}, formData));
      } else {
        baseRow.push(...Array(fieldHeaders.length).fill("—"));
      }

      excelData.push(baseRow);
    });

    // Generate Excel
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Responses");

    // FIXED: Get TODAY's date in IST (Asia/Kolkata)
    const todayIST = new Date().toLocaleDateString('en-CA', { 
      timeZone: 'Asia/Kolkata' 
    });   // Format: YYYY-MM-DD

    const safeName = (form.form_name || "Form").replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${safeName}_Responses_${todayIST}.xlsx`;

    XLSX.writeFile(wb, fileName);

    showAlert(`✅ Excel downloaded successfully!\n${fileName}`, "Success", "success");

  } catch (err) {
    console.error("Excel download error:", err);
    showAlert("Failed to generate Excel file. Please try again.", "Error", "error");
  } finally {
    setLoading(false);
  }
};
// ==================== HELPER: Get Field Headers with Supervisor Tag ====================
const getFieldHeaders = (form) => {
  let formJson = form.form_json;
  if (typeof formJson === 'string') {
    try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
  }

  const headers = [];

  (formJson || []).forEach((f) => {
    if (f.employee) {
      // Employee Field
      headers.push(f.employee.label || f.id || "Field");
    } 
    else if (f.label) {
      // This is likely a supervisor field (from old structure or direct supervisor field)
      headers.push(f.label + " (Supervisor)");
    }
    // Multiple supervisor fields support
    if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
      f.supervisorFields.forEach((sup, idx) => {
        headers.push((sup.label || `Supervisor Field ${idx + 1}`) + " (Supervisor)");
      });
    }
  });

  return headers;
};

// ==================== HELPER: Get Field Values ====================
const getFieldValues = (responseJson, form) => {
  let formJson = form.form_json;
  if (typeof formJson === 'string') {
    try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
  }

  const values = [];

  (formJson || []).forEach((f) => {
    // Employee field
    if (f.employee) {
      const key = f.id;
      let val = responseJson[key];
      if (Array.isArray(val)) val = val.join(", ");
      else if (val && typeof val === "object") val = JSON.stringify(val);
      values.push(val ?? "—");
    }

    // Multiple supervisor fields
    if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
      f.supervisorFields.forEach((sup, idx) => {
        const key = `${f.id}_sup_${idx}`;
        let val = responseJson[key];
        if (Array.isArray(val)) val = val.join(", ");
        else if (val && typeof val === "object") val = JSON.stringify(val);
        values.push(val ?? "—");
      });
    }
  });

  return values;
};

 const viewResponses = async (formId, formName) => {
  try {
    setLoading(true);
    setCurrentResponses([]);

    // Fetch form details
    const formRes = await fetch(`${BACKEND_URL}/api/forms/${formId}`, {
      credentials: "include",
      headers: getHeaders(),
    });
    if (!formRes.ok) throw new Error("Failed to load form");
    const formJson = await formRes.json();
    const form = formJson.data || formJson;

    // Fetch responses (submitted ones)
    const res = await fetch(`${BACKEND_URL}/api/forms/${formId}/responses`, {
      method: "GET",
      credentials: "include",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load responses");
    const json = await res.json();
    let rawResponses = Array.isArray(json) 
      ? json 
      : json.data || json.responses || [];

    // === NEW: Fetch Assigned Employees ===
    let assignedEmployees = [];
    try {
      const assignRes = await fetch(`${BACKEND_URL}/api/forms/${formId}/assigned`, {
        method: "GET",
        credentials: "include",
        headers: getHeaders(),
      });

      if (assignRes.ok) {
        const assignJson = await assignRes.json();
        assignedEmployees = assignJson.data || assignJson.assigned || assignJson.employeeIds || [];
      }
    } catch (assignErr) {
      console.warn("Could not fetch assigned employees:", assignErr);
    }

    // Create a map of submitted responses by employee_id
    const submittedMap = new Map();
    rawResponses.forEach((resp) => {
      const empId = String(resp.employee_id || resp.employeeId || "");
      if (empId) submittedMap.set(empId, resp);
    });

    // Build final list: All assigned employees + their submission status
   const fieldMetaMap = (() => {
  let formJsonData = form.form_json;
  if (typeof formJsonData === 'string') {
    try { formJsonData = JSON.parse(formJsonData); } catch (e) { formJsonData = []; }
  }

  const map = {};

  (formJsonData || []).forEach(f => {
    if (!f.employee) return;

    // Employee Field
    map[String(f.id)] = { 
      label: f.employee.label || f.id, 
      visibleTo: "employee" 
    };

    // Multiple Supervisor Fields
    if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
      f.supervisorFields.forEach((sup, idx) => {
        const supKey = `${f.id}_sup_${idx}`;
        map[supKey] = { 
          label: sup.label || `Supervisor Field ${idx + 1}`, 
          visibleTo: "supervisor" 
        };
      });
    } 
    // Backward compatibility for old single supervisor
    else if (f.supervisor) {
      const supKey = `${f.id}_sup`;
      map[supKey] = { 
        label: f.supervisor.label || "Supervisor Feedback", 
        visibleTo: "supervisor" 
      };
    }
  });

  return map;
})();



    const formattedResponses = assignedEmployees.map((emp) => {
      const empId = String(emp.employee_id || emp.id || "");
      const submittedResp = submittedMap.get(empId);

      const fullName = `${emp.first_name || ''} ${emp.middle_name || ''} ${emp.last_name || ''}`.trim() 
        || `Employee ${empId}`;

      if (submittedResp) {
        // Already submitted
        const responseJson = submittedResp.response_json || {};
        const readable = {};
        const meta = {};

        Object.keys(responseJson).forEach((key) => {
          if (String(key).startsWith("__")) {
            meta[key] = responseJson[key];
            return;
          }
          const fieldInfo = fieldMetaMap[String(key)] || { label: key, visibleTo: "both" };
          let label = fieldInfo.label;
          if (fieldInfo.visibleTo === "supervisor") label = `${label} (Supervisor only)`;

          let answer = responseJson[key];
          if (answer && typeof answer === "object" && !Array.isArray(answer)) {
            if (answer.start || answer.end) {
              answer = `${answer.start || "—"} to ${answer.end || "—"}`;
            } else {
              answer = JSON.stringify(answer);
            }
          } else if (Array.isArray(answer)) {
            answer = answer.join(", ");
          } else if (answer === "" || answer === null || answer === undefined) {
            answer = "No answer";
          }

          readable[label] = answer;
        });

        return {
          ...submittedResp,
          employeeDisplay: fullName,
          status: "submitted",
          readableAnswers: readable,
          metadata: meta,
          submitted_at: submittedResp.submitted_at || submittedResp.created_at,
        };
      } else {
        // Not submitted yet
        return {
          employee_id: empId,
          employeeDisplay: fullName,
          status: "not_submitted",
          readableAnswers: {},
          metadata: {
            __status: "Not Submitted Yet",
            __submitted_at: null
          },
        };
      }
    });

    setCurrentResponses(formattedResponses);
    setCurrentFormTitle(formName || form.form_name || "Form Responses");
    setShowResponsesModal(true);
  } catch (err) {
    console.error(err);
    showAlert("Error loading responses: " + err.message, "Error", "error");
  } finally {
    setLoading(false);
  }
};
//  const handleAssign = async () => {
//   if (selectedEmployeeIds.length === 0) {
//     showAlert("Please select at least one employee", "Warning", "warning");
//     return;
//   }

//   setLoading(true);
//   try {
//     const res = await fetch(`${BACKEND_URL}/api/forms/${editingId}/assign`, {
//       method: "POST",
//       credentials: "include",
//       headers: getHeaders(),
//       body: JSON.stringify({ employeeIds: selectedEmployeeIds }),
//     });

//     const json = await res.json();

//     if (!res.ok) throw new Error(json.message || "Assignment failed");

//     showAlert(
//       `Form successfully assigned to ${selectedEmployeeIds.length} employee${selectedEmployeeIds.length > 1 ? 's' : ''}`,
//       "Success",
//       "success"
//     );

//     setSelectedEmployeeIds([]);

//     // Refresh already assigned list
//     const refreshRes = await fetch(`${BACKEND_URL}/api/forms/${editingId}/assigned`, {
//       method: "GET",
//       credentials: "include",
//       headers: getHeaders(),
//     });
//     if (refreshRes.ok) {
//       const data = await refreshRes.json();
//       const ids = (data.data || data.assigned || []).map(item => String(item.employee_id || item.id));
//       setAlreadyAssignedIds(ids);
//     }

//   } catch (err) {
//     showAlert("Failed to assign: " + err.message, "Error", "error");
//   } finally {
//     setLoading(false);
//   }
// };
const handleAssign = async () => {
  if (selectedEmployeeIds.length === 0) {
    showAlert("Please select at least one employee", "Warning", "warning");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${BACKEND_URL}/api/forms/${editingId}/assign`, {
      method: "POST",
      credentials: "include",
      headers: getHeaders(),
      body: JSON.stringify({ employeeIds: selectedEmployeeIds }),
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json.message || "Assignment failed");

    showAlert(
      `Form successfully assigned to ${selectedEmployeeIds.length} employee${selectedEmployeeIds.length > 1 ? 's' : ''}`,
      "Success",
      "success"
    );

    // ✅ CLEAR SELECTION
    setSelectedEmployeeIds([]);

    // ✅ Refresh Already Assigned List
    const refreshRes = await fetch(`${BACKEND_URL}/api/forms/${editingId}/assigned`, {
      method: "GET",
      credentials: "include",
      headers: getHeaders(),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      const ids = (data.data || data.assigned || []).map(item =>
        String(item.employee_id || item.id)
      );
      setAlreadyAssignedIds(ids);
    }

    // 🔥 MOST IMPORTANT FIX - Refresh Team Submissions
    if (isSupervisor || isHR) {
      await fetchTeamSubmissions();
    }

    // Optional: Also refresh self forms if needed
    // await fetchSelfForms();

  } catch (err) {
    console.error("Assign error:", err);
    showAlert("Failed to assign: " + err.message, "Error", "error");
  } finally {
    setLoading(false);
  }
};
  if (!user) return <div>Please login</div>;
  return (
    <>
      <div className="df-container">
        {/* <h2 className="df-title">Dynamic Form Builder</h2> */}
        {loading && <div className="df-loading">Loading...</div>}
        {/* ==================== BUILDER - ONLY ADMIN & HR ==================== */}
        {!viewMode && !fillMode && canBuildForms && (
          <div className="df-builder-card">
           <div className="df-top-config">
  <div>
    <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155" }}>
      Form Name
    </label>
    <input
  placeholder="e.g. Employee Survey"
  value={formName}
  onChange={(e) => setFormName(e.target.value)}   // ← Raw value only
  onBlur={() => setFormName(toTitleCase(formName))} // ← Apply title case when user leaves the field
  className="df-input"
  style={{ fontSize: "1.1rem", fontWeight: "500" }}
/>
  </div>

  <div>
    <label>Active From</label>
    <input type="date" value={activeFrom} onChange={(e) => setActiveFrom(e.target.value)} className="df-input" />
  </div>

  <div>
    <label>Active To</label>
    <input type="date" value={activeTo} onChange={(e) => setActiveTo(e.target.value)} className="df-input" />
  </div>

  <div>
    <label>Form Type</label>
    <select value={formType} onChange={(e) => setFormType(e.target.value)} className="df-input">
      <option value="employee_only">Employee Only</option>
      <option value="employee_supervisor">Employee + Supervisor</option>
    </select>
  </div>

  <div>
    <label>Layout Style</label>
    <select value={layoutMode} onChange={(e) => setLayoutMode(e.target.value)} className="df-input">
      <option value="one">1 Column</option>
      <option value="two">2 Columns</option>
      <option value="three">3 Columns</option>
    </select>
  </div>
</div>
            <div className="df-builder">
              <div className="df-field-builder">
                <h4 style={{ margin: "0 0 10px 0", color: "#0d6efd" }}>Add Form Fields</h4>
                <p style={{ margin: "0 0 16px 0", color: "#666", fontSize: "0.9rem" }}>
                  Configure fields for employees{formType === 'employee_supervisor' ? ' and optional supervisor feedback' : ''}
                </p>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
                  Employee Field Type
                </label>
                <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="df-input">
                  <option value="text">📝 Text</option>
                  <option value="email">📧 Email</option>
                  <option value="textarea">📄 Textarea</option>
                  <option value="number">🔢 Number</option>
                  <option value="date">📅 Date</option>
                  <option value="daterange">📆 Date Range</option>
                  <option value="select">📋 Dropdown</option>
                  <option value="radio">◉ Radio Buttons</option>
                  <option value="checkbox-group">☑️ Checkbox Group</option>
                  <option value="checkbox">☐ Single Checkbox</option>
                  <option value="rating">⭐ Rating</option>
                </select>
                <label style={{ display: "block", marginTop: "12px", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
  Employee Field Label
</label>
<input 
  placeholder="e.g., Your Name" 
  value={fieldLabel} 
  onChange={(e) => setFieldLabel(e.target.value)} 
  className="df-input" 
/>

<label style={{ display: "block", marginTop: "12px", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
  Employee Placeholder (optional)
</label>
<input 
  placeholder="e.g., Enter your full name" 
  value={fieldPlaceholder} 
  onChange={(e) => setFieldPlaceholder(e.target.value)} 
  className="df-input" 
/>

{/* NEW: Required Checkbox for Employee Field */}
<div style={{ marginTop: "12px" }}>
  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
    <input 
      type="checkbox" 
      checked={fieldRequired} 
      onChange={(e) => setFieldRequired(e.target.checked)} 
    />
    Required Field
  </label>
</div>

{showOptions && (
  <div style={{ marginTop: "12px" }}>
    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
      Employee Options (comma separated)
    </label>
    <input 
      placeholder="e.g., Option 1, Option 2, Option 3" 
      value={optionsInput} 
      onChange={(e) => setOptionsInput(e.target.value)} 
      className="df-input" 
    />
  </div>
)}
               
                
                {formType === 'employee_supervisor' && (
  <div style={{ marginTop: "20px" }}>
    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
      <input 
        type="checkbox" 
        checked={hasSupervisorFeedback} 
        onChange={(e) => {
          setHasSupervisorFeedback(e.target.checked);
          if (!e.target.checked) {
            setSupervisorFieldsList([]);
          }
        }} 
      />
      <span>Add Supervisor Feedback (Multiple allowed)</span>
    </label>

    {hasSupervisorFeedback && (
      <div style={{ marginTop: "16px", padding: "18px", backgroundColor: "#fff3cd", borderRadius: "10px", border: "1px solid #ffeaa7" }}>
        <h5 style={{ margin: "0 0 16px 0", color: "#856404" }}>Supervisor Feedback Fields</h5>

        {/* List of added supervisor fields */}
        {/* List of added supervisor fields */}
{supervisorFieldsList.length > 0 && (
  <div style={{ marginBottom: "16px" }}>
    {supervisorFieldsList.map((sup, index) => (
      <div 
        key={index} 
        style={{
          padding: "14px 16px",
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: "10px",
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}
      >
        <div style={{ flex: 1 }}>
          <strong>{sup.label}</strong>
          <span style={{ marginLeft: "12px", color: "#666", fontSize: "0.9rem" }}>
            ({sup.type})
          </span>
          {sup.required && <span style={{ color: "red", marginLeft: "8px" }}>*</span>}
          
          {sup.placeholder && (
            <div style={{ fontSize: "0.85rem", color: "#888", marginTop: "6px" }}>
              Placeholder: "{sup.placeholder}"
            </div>
          )}
        </div>

        {/* Styled Edit & Delete Buttons - Same as Added Fields */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => editSupervisorField(index)}
            style={{
  padding: "6px 10px",
  background: "#16a34a",   // green button
  border: "1px solid #16a34a",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff"         // white icon
}}
            title="Edit Supervisor Field"
          >
            <FiEdit2 size={18} />
          </button>

          <button
            onClick={() => deleteSupervisorField(index)}
            style={{
  padding: "8px 12px",
  background: "#16a34a",   // green button
  border: "1px solid #16a34a",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff"         // white icon
}}
            title="Delete Supervisor Field"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>
    ))}
  </div>
)}

        {/* Form to add/edit supervisor field */}
      {/* Form to add/edit supervisor field */}
<div style={{ marginTop: "12px" }}>
  <label>Supervisor Field Type</label>
  <select 
    value={supervisorType} 
    onChange={(e) => setSupervisorType(e.target.value)} 
    className="df-input"
  >
    <option value="text">Text</option>
    <option value="textarea">Textarea</option>
    <option value="email">Email</option>
    <option value="number">Number</option>
    <option value="radio">Radio Buttons</option>
    <option value="checkbox-group">Checkbox Group</option>
    <option value="rating">Rating</option>
  </select>

  <label style={{ marginTop: "12px" }}>Supervisor Field Label</label>
  <input
    placeholder="e.g. Supervisor Comments"
    value={supervisorLabel}
    onChange={(e) => setSupervisorLabel(e.target.value)}
    className="df-input"
  />

  {/* NEW: Placeholder for supervisor fields */}
  {(supervisorType === "text" || supervisorType === "textarea" || supervisorType === "email" || supervisorType === "number") && (
    <div style={{ marginTop: "12px" }}>
      <label>Supervisor Placeholder (optional)</label>
      <input
        placeholder="e.g. Enter your detailed feedback here..."
        value={supervisorPlaceholder}
        onChange={(e) => setSupervisorPlaceholder(e.target.value)}
        className="df-input"
      />
    </div>
  )}

  {(supervisorType === 'radio' || supervisorType === 'checkbox-group') && (
    <div style={{ marginTop: "12px" }}>
      <label>Options (comma separated)</label>
      <input
        placeholder="Excellent, Good, Average, Poor"
        value={supervisorOptionsInput}
        onChange={(e) => setSupervisorOptionsInput(e.target.value)}
        className="df-input"
      />
    </div>
  )}

  <div style={{ marginTop: "12px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
    <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <input type="checkbox" checked={supervisorRequired} onChange={(e) => setSupervisorRequired(e.target.checked)} />
      Required
    </label>
    <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <input type="checkbox" checked={supervisorVisibleToEmployee} onChange={(e) => setSupervisorVisibleToEmployee(e.target.checked)} />
      Visible to Employee
    </label>
  </div>

  <button
    onClick={addOrUpdateSupervisorField}
    className="df-add-btn"
    style={{ marginTop: "16px", width: "100%" }}
  >
    {editingSupervisorIndex !== null ? "Update Supervisor Field" : 
     <><FiPlus size={18} /> Add Supervisor Field</>}
  </button>
</div>
      </div>
    )}
  </div>
)}
   
                <button 
  onClick={addOrUpdateField} 
  className="df-add-btn" 
  style={{ 
    marginTop: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  }}
>
  {editingFieldId ? (
    <>
      <FiEdit2 size={18} />
      Update Field
    </>
  ) : (
    <>
      <FiPlus size={18} />
      Add Field
    </>
  )}
</button>
              </div>
              <div>
                <div className="df-field-list-container">
                  <h5 style={{ margin: "0 0 12px 0", color: "#333" }}>Added Fields ({fields.length})</h5>
                  <div className="df-field-list">
                    {fields.length === 0 ? (
                      <p style={{ color: "#999", textAlign: "center", padding: "50px 20px" }}>No fields added yet</p>
                    ) : (
                      fields.map((f) => (
                        <div key={f.id} className="df-field-item">
                          <span>
  <strong>{f.employee.label}</strong>
  <span style={{ color: "#666", marginLeft: "8px" }}>({f.employee.type})</span>
  {f.employee.required && <span style={{ color: "#dc3545", marginLeft: "4px" }}>*</span>}
  
  {f.supervisorFields && f.supervisorFields.length > 0 && (
    <span style={{ color: "#856404", marginLeft: "12px", fontWeight: "600" }}>
      + {f.supervisorFields.length} Supervisor Field{f.supervisorFields.length > 1 ? 's' : ''}
    </span>
  )}
</span>
                        <div style={{ display: "flex", gap: "8px" }}>
  <button 
    onClick={() => editField(f.id)} 
    className="df-edit-btn" 
    style={{ 
      padding: "6px 10px", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center" 
    }}
    title="Edit Field"
  >
    <FiEdit2 size={18} />
  </button>

  <button 
    onClick={() => deleteField(f.id)} 
    className="df-delete-btn" 
    style={{ 
      padding: "6px 10px", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center" 
    }}
    title="Delete Field"
  >
    <FiTrash2 size={18} />
  </button>
</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
               
{editingId && (
  <div className="assign-section" style={{ marginTop: "30px", padding: "24px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
    <h3 style={{ marginTop: 0 }}>Assign Form to Employees</h3>

    <button
      type="button"
      onClick={() => setShowAssignSection(!showAssignSection)}
      style={{
        padding: "10px 20px",
        background: showAssignSection ? "#6c757d" : "#0d6efd",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        marginBottom: "20px"
      }}
    >
      {showAssignSection ? "Hide Assignment Panel" : "Show Assign Employees"}
    </button>

    {showAssignSection && (
      <>
        {/* Search Bar */}
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="df-input"
            style={{ width: "100%", padding: "12px 16px", fontSize: "1rem" }}
          />
        </div>

        <div style={{ marginBottom: "16px", display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.95rem" }}>
          <div><strong>Total:</strong> {employees.length}</div>
          <div><strong>Already Assigned:</strong> {alreadyAssignedIds.length}</div>
          <div><strong>Showing:</strong> {filteredEmployees.length}</div>
        </div>

        {/* Select All Checkbox */}
        <label style={{ display: "block", marginBottom: "14px", fontWeight: "600", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={
              filteredEmployees.length > 0 &&
              selectedEmployeeIds.length ===
                filteredEmployees.filter(emp => !alreadyAssignedIds.includes(String(emp.employee_id || emp.id))).length
            }
            onChange={(e) => {
              const available = filteredEmployees.filter(emp =>
                !alreadyAssignedIds.includes(String(emp.employee_id || emp.id))
              );
              if (e.target.checked) {
                setSelectedEmployeeIds(available.map(emp => String(emp.employee_id || emp.id)));
              } else {
                setSelectedEmployeeIds([]);
              }
            }}
          /> Select All 
        </label>

        {/* Employee List */}
        <div style={{ 
          maxHeight: "420px", 
          overflowY: "auto", 
          border: "1px solid #ddd", 
          borderRadius: "8px", 
          padding: "8px",
          background: "#fff"
        }}>
          {filteredEmployees.length === 0 ? (
            <p style={{ textAlign: "center", color: "#888", padding: "40px 20px" }}>
              No employees found for "{searchTerm}"
            </p>
          ) : (
            filteredEmployees.map((emp) => {
              const empId = String(emp.employee_id || emp.id || "");
              const isAlreadyAssigned = alreadyAssignedIds.includes(empId);
              const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`.trim();
              const displayText = fullName ? `${fullName} (${empId})` : `Employee ${empId}`;

              if (isAlreadyAssigned) return null; // Hide already assigned

              return (
                <label
                  key={empId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 14px",
                    margin: "6px 0",
                    background: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e9ecef",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseOut={(e) => e.currentTarget.style.background = "#fff"}
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployeeIds.includes(empId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
                      } else {
                        setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== empId));
                      }
                    }}
                    style={{ marginRight: "12px", transform: "scale(1.1)" }}
                  />
                  <span style={{ fontSize: "1.02rem" }}>{displayText}</span>
                </label>
              );
            })
          )}
        </div>

        {/* Assign Button */}
        <button
          onClick={handleAssign}
          disabled={loading || selectedEmployeeIds.length === 0}
          style={{
            marginTop: "24px",
            padding: "14px 32px",
            width: "100%",
            background: selectedEmployeeIds.length > 0 ? "#16a34a" : "#94a3b8",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "600",
            fontSize: "1.05rem",
            cursor: selectedEmployeeIds.length > 0 ? "pointer" : "not-allowed"
          }}
        >
          Assign to {selectedEmployeeIds.length} Employee{selectedEmployeeIds.length !== 1 ? "s" : ""}
        </button>
      </>
    )}
  </div>
)}
              </div>
            </div>
           <button 
  onClick={saveTemplate} 
  className="df-submit-btn" 
  disabled={loading}
  style={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  }}
>
  {editingId ? (
    <>
      <FiSave size={20} />
      Update Form
    </>
  ) : (
    <>
      <FiPlus size={20} />
      Create Form
    </>
  )}
</button>
          </div>
        )}
        {/* ==================== TEMPLATES SECTION WITH TABS ==================== */}
        {!viewMode && !fillMode && (
          <div className="df-templates">
            <h3>
              {canBuildForms ? "Form Management" : isSupervisor ? "My Forms & Team" : "My Assigned Forms"}
            </h3>
           
{(isSupervisor || canBuildForms) && (
  <div className="df-tabs" style={{ marginBottom: "25px", display: "flex", gap: "12px" }}>
    
    {/* Show Self & Team tabs only for HR and Supervisors (not pure Admin) */}
    {(!isAdmin || isHR) && (
      <>
        <button
          onClick={() => setActiveTab("self")}
          style={{
            padding: "10px 24px",
            background: activeTab === "self" ? "#16a34a" : "#f8f9fa",
            color: activeTab === "self" ? "#fff" : "#333",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: activeTab === "self" ? "600" : "500"
          }}
        >
          Self Forms
        </button>

        <button
          onClick={() => setActiveTab("team")}
          style={{
            padding: "10px 24px",
            background: activeTab === "team" ? "#16a34a" : "#f8f9fa",
            color: activeTab === "team" ? "#fff" : "#333",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: activeTab === "team" ? "600" : "500"
          }}
        >
          Team Forms
        </button>
      </>
    )}

    {/* All Forms tab - Always visible for Admin & HR */}
    {canSeeAllTab && (
      <button
        onClick={() => setActiveTab("all")}
        style={{
          padding: "10px 24px",
          background: activeTab === "all" ? "#16a34a" : "#f8f9fa",
          color: activeTab === "all" ? "#fff" : "#333",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: activeTab === "all" ? "600" : "500"
        }}
      >
        All Forms
      </button>
    )}
  </div>
)}
          
     <div className="df-template-grid">
  {/* ==================== ALL FORMS TAB ==================== */}
  {/* {activeTab === "all" && canSeeAllTab && (
    templates.length === 0 ? (
      <p style={{ color: "#666", textAlign: "center", padding: "60px 0", gridColumn: "1 / -1" }}>
        No forms created yet.
      </p>
    ) : (
      templates.map((t, index) => {
        const activeFrom = t.active_from || t.activeFrom || null;
        const activeTo = t.active_to || t.activeTo || null;
        const fromStr = activeFrom ? new Date(activeFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
        const toStr = activeTo ? new Date(activeTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
const isActive = isFormActive(activeFrom, activeTo);        return (
          <div 
            key={`all-${t.id || index}`}   // ← Safe unique key
            className="df-template-card"
          >
            <h4>{toTitleCase(t.form_name || t.name || "")}</h4>
            <div style={{
              margin: "14px 0 18px 0",
              padding: "12px 14px",
              background: isActive ? "#f0fdf4" : "#fef2f2",
              borderRadius: "10px",
              border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
            }}>
              <strong>Active Period:</strong><br />
              {fromStr} — {toStr}<br />
              <span style={{ color: isActive ? "#166534" : "#991b1b", fontWeight: "500" }}>
                {isActive ? " Currently Active" : " Not Active"}
              </span>
            </div>
            <div className="df-template-actions">
              <button onClick={() => viewTemplate(t)} className="df-view-btn">Preview</button>
              <button onClick={() => editTemplate(t)} className="df-edit-btn">Edit</button>
              <button onClick={() => viewResponses(t.id, t.form_name)} className="df-view-btn">Responses</button>
            </div>
          </div>
        );
      })
    )
  )} */}

  {/* ==================== ALL FORMS TAB WITH DOWNLOAD EXCEL ==================== */}
{activeTab === "all" && canSeeAllTab && (
  templates.length === 0 ? (
    <p style={{ color: "#666", textAlign: "center", padding: "60px 0", gridColumn: "1 / -1" }}>
      No forms created yet.
    </p>
  ) : (
    templates.map((t, index) => {
      const activeFrom = t.active_from || t.activeFrom || null;
      const activeTo = t.active_to || t.activeTo || null;
      const fromStr = activeFrom ? new Date(activeFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
      const toStr = activeTo ? new Date(activeTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
const isActive = isFormActive(
  t.active_from || t.activeFrom, 
  t.active_to || t.activeTo
);
      return (
        <div key={`all-${t.id || index}`} className="df-template-card">
          <button
  onClick={() => downloadFormResponsesAsExcel(t)}
  style={{
    padding: "8px 12px",
    color: "#1f2937",
    border: "none",
    marginLeft: "auto",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    fontSize: "0.92rem"
  }}
  title="Download Responses as Excel"
>
<FiDownload size={16} />
</button>
          <h4>{toTitleCase(t.form_name || t.name || "")}</h4>

          <div style={{
            margin: "14px 0 18px 0",
            padding: "12px 14px",
            background: isActive ? "#f0fdf4" : "#fef2f2",
            borderRadius: "10px",
            border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
          }}>
            <strong>Active Period:</strong><br />
            {fromStr} — {toStr}<br />
            <span style={{ color: isActive ? "#166534" : "#991b1b", fontWeight: "500" }}>
              {isActive ? " Currently Active" : " Not Active"}
            </span>
          </div>

          <div className="df-template-actions" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => viewTemplate(t)} className="df-view-btn">Preview</button>
            <button onClick={() => editTemplate(t)} className="df-edit-btn">Edit</button>
            <button onClick={() => viewResponses(t.id, t.form_name)} className="df-view-btn">Responses</button>
            
            {/* New Download Excel Button */}
            
          </div>
        </div>
      );
    })
  )
)}

  {/* ==================== SELF FORMS TAB ==================== */}
{/* ==================== SELF FORMS TAB (Fixed for Same Day) ==================== */}
{activeTab === "self" && (
  selfForms.length === 0 ? (
    <p style={{ color: "#666", textAlign: "center", padding: "60px 0", gridColumn: "1 / -1" }}>
      No forms assigned to you yet.
    </p>
  ) : (
    selfForms.map((t, index) => {
      const formActiveFrom = t.active_from || t.activeFrom || null;
      const formActiveTo = t.active_to || t.activeTo || null;

      const fromStr = formActiveFrom
        ? new Date(formActiveFrom).toLocaleDateString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric' 
          })
        : "—";

      const toStr = formActiveTo
        ? new Date(formActiveTo).toLocaleDateString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric' 
          })
        : "—";

      const isActive = isFormActive(formActiveFrom, formActiveTo);

      return (
        <div
          key={`self-${t.id}-${index}`}
          className="df-template-card"
        >
          <h4>{toTitleCase(t.form_name || t.name || "")}</h4>
          <div style={{
            margin: "14px 0 18px 0",
            padding: "12px 14px",
            background: isActive ? "#f0fdf4" : "#fef2f2",
            borderRadius: "10px",
            border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
          }}>
            <strong>Active Period:</strong><br />
            {fromStr} — {toStr}<br />
            <span style={{ 
              color: isActive ? "#166534" : "#991b1b", 
              fontWeight: "500" 
            }}>
              {isActive ? "Currently Active" : "Not Active Now"}
            </span>
          </div>
          <button
            onClick={() => fillTemplate(t)}
            className="df-fill-btn"
            disabled={!isActive}
            style={{
              opacity: isActive ? 1 : 0.65,
              width: "100%",
              cursor: isActive ? "pointer" : "not-allowed"
            }}
          >
            {isActive ? "Fill Form" : "Not Active Now"}
          </button>
        </div>
      );
    })
  )
)}
  {/* ==================== TEAM TAB (Supervisor) ==================== */}
  {activeTab === "team" && (
    teamSubmissions.length === 0 ? (
      <p style={{
        color: "#666",
        textAlign: "center",
        padding: "60px 0",
        gridColumn: "1 / -1",
        fontSize: "16px"
      }}>
        No team submissions to review yet.
      </p>
    ) : (
      Object.entries(
        teamSubmissions.reduce((acc, sub) => {
          const formId = sub.form_id || sub.formId || "unknown";
          const formName = sub.form_name || "Supervisor Review";
          if (!acc[formId]) {
            acc[formId] = {
              formId,
              formName,
              active_from: sub.active_from || sub.activeFrom || null,
              active_to: sub.active_to || sub.activeTo || null,
              submissions: []
            };
          }
          acc[formId].submissions.push(sub);
          return acc;
        }, {})
      ).map(([formId, group]) => {
        const fromStr = group.active_from
          ? new Date(group.active_from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : "—";
        const toStr = group.active_to
          ? new Date(group.active_to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : "—";
const isActive = isFormActive(group.active_from, group.active_to);
        return (
          <div 
            key={`team-${formId}`}   // ← Safe key for group
            className="df-template-card"
          >
            <h4>{group.formName}</h4>
            <div style={{
              margin: "14px 0 18px 0",
              padding: "12px 14px",
              background: isActive ? "#f0fdf4" : "#fef2f2",
              borderRadius: "10px",
              border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
            }}>
              <strong>Active Period:</strong><br />
              {fromStr} — {toStr}<br />
              <span style={{ color: isActive ? "#166534" : "#991b1b", fontWeight: "500" }}>
                {isActive ? " Currently Active" : " Not Active"}
              </span>
            </div>
            <p style={{ color: "#666", marginBottom: "16px" }}>
              {group.submissions.length} employee{group.submissions.length > 1 ? "s" : ""} submitted
            </p>
            <div
  style={{
    maxHeight: "180px",   // fixed height so card won't extend
    overflowY: "auto",    // vertical scroll when more employees
    paddingRight: "6px",
    marginTop: "12px",
  }}
>
  {group.submissions.map((sub, idx) => (
    <div
      key={`sub-${sub.form_id || sub.formId || formId}-${sub.employee_id || sub.employeeId || idx}`}
      onClick={(e) => {
        e.stopPropagation();
        handleSelectSubmission(sub);
      }}
      style={{
        padding: "10px 12px",
        marginBottom: "8px",
        background: "#f8f9fa",
        borderRadius: "8px",
        cursor: "pointer",
        border: "1px solid #e9ecef",
      }}
      onMouseOver={(e) =>
        (e.currentTarget.style.backgroundColor = "#e3f2fd")
      }
      onMouseOut={(e) =>
        (e.currentTarget.style.backgroundColor = "#f8f9fa")
      }
    >
      <strong>
        {sub.employee_name ||
          `Employee ${sub.employee_id || sub.employeeId || "Unknown"}`}
      </strong>
    </div>
  ))}
</div>
          </div>
        );
      })
    )
  )}
</div>
          </div>
        )}
        {/* Preview Mode */}
{/* Preview Mode - FIXED for Multiple Supervisor Fields + Placeholder */}
{viewMode && selectedTemplate && (
  <div className="df-preview">
    <h3>{toTitleCase(selectedTemplate.form_name)} (Preview)</h3>
    <form className={`df-form df-grid-layout df-grid-${selectedTemplate.layout || "one"}`}>
      {(() => {
        let fieldsToShow = [];
        let formJson = selectedTemplate.form_json;

        if (typeof formJson === 'string') {
          try {
            formJson = JSON.parse(formJson);
          } catch (e) {
            formJson = [];
          }
        }

        if (selectedTemplate.form_type === 'employee_supervisor') {
          fieldsToShow = (formJson || []).flatMap(f => {
            if (!f.employee) return [];

            const result = [{
              ...f.employee,
              isSupervisor: false,
              fieldId: f.id
            }];

            // Multiple Supervisor Fields
            if (f.supervisorFields && Array.isArray(f.supervisorFields) && f.supervisorFields.length > 0) {
              f.supervisorFields.forEach((sup, idx) => {
                result.push({
                  ...sup,
                  isSupervisor: true,
                  fieldId: `${f.id}_sup_${idx}`
                });
              });
            } 
            // Backward compatibility
            else if (f.supervisor) {
              result.push({
                ...f.supervisor,
                isSupervisor: true,
                fieldId: f.id + '_sup'
              });
            }

            return result;
          });
        } else {
          fieldsToShow = (formJson || []).map(f => {
            if (f.employee) {
              return { ...f.employee, isSupervisor: false, fieldId: f.id };
            } else {
              return { ...f, isSupervisor: false, fieldId: f.id };
            }
          });
        }

        return fieldsToShow.map((field) => (
          <div key={field.fieldId} className="df-form-group">
            <label>
              {field.label}
              {field.required && <span className="required"> *</span>}
              {field.isSupervisor && (
                <span style={{ color: "#2563eb", fontWeight: "600", marginLeft: "8px" }}>
                  (Supervisor)
                </span>
              )}
            </label>
            {renderField(field, true)}
          </div>
        ));
      })()}
    </form>
    <button 
      className="df-submit-btn" 
      onClick={() => setViewMode(false)}
      style={{ marginTop: "20px" }}
    >
      Back to Builder
    </button>
  </div>
)}
        {/* Fill / Review Mode */}
        {fillMode && selectedTemplate && (
          <div className="df-fill-preview">
            <h3>
  {toTitleCase(selectedTemplate.form_name)}
  {isReviewMode && " — Supervisor Review"}
  {hasSubmitted && !isReviewMode && " — Submitted"}
</h3>
            {hasSubmitted && !isReviewMode && !viewingSubmission ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8f9fa", borderRadius: "8px" }}>
                <h3>✅ Form Submitted Successfully</h3>
                <p>You have already submitted this form.</p>
                <button
                  onClick={() => {
                    setViewingSubmission(true);
                    setFormData(submissionData?.response_json || {});
                  }}
                  className="df-submit-btn"
                  style={{ marginTop: "15px" }}
                >
                  View My Submission
                </button>
              </div>
            ) : (
              <form className={`df-form df-grid-layout df-grid-${selectedTemplate.layout || "one"}`} onSubmit={(e) => { e.preventDefault(); submitFilledForm(); }}>
                {(() => {
                  let fieldsToRender = [];
                  let formJson = selectedTemplate.form_json || [];
                  if (typeof formJson === 'string') {
                    try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
                  }
                                   if (selectedTemplate.form_type === 'employee_supervisor') {
                    formJson.forEach(f => {
                      if (!f.employee) return;

                      // Employee Field
                      fieldsToRender.push({
                        ...f.employee,
                        isSupervisor: false,
                        fieldId: f.id,
                        readOnly: isReviewMode || viewingSubmission
                      });

                      // Multiple Supervisor Fields
                      if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
                        f.supervisorFields.forEach((sup, idx) => {
                          const shouldShowToEmployee = sup.visibleToEmployee !== false;
                          if (isReviewMode || shouldShowToEmployee) {
                            fieldsToRender.push({
                              ...sup,
                              isSupervisor: true,
                              fieldId: `${f.id}_sup_${idx}`,
                              readOnly: !isReviewMode
                            });
                          }
                        });
                      } 
                      // Backward compatibility (old single supervisor)
                      else if (f.supervisor && (isReviewMode || f.supervisor.visibleToEmployee !== false)) {
                        fieldsToRender.push({
                          ...f.supervisor,
                          isSupervisor: true,
                          fieldId: f.id + '_sup',
                          readOnly: !isReviewMode
                        });
                      }
                    });
                  } else {
                    // Normal employee-only forms
                    formJson.forEach(f => {
                      const field = f.employee || f;
                      fieldsToRender.push({
                        ...field,
                        isSupervisor: false,
                        fieldId: f.id || field.id,
                        readOnly: false
                      });
                    });
                  } 
            // Backward compatibility for old single supervisor
           
      
                  return fieldsToRender.map((field) => {
                    const isReadOnly = field.readOnly || false;
                    return (
                      <div key={field.fieldId} className="df-form-group">
                        <label>
                          {field.label}
{field.required && (
  <span style={{ color: "red" }}> *</span>
)}{field.isSupervisor && (
  <span style={{ color: "#2563eb", fontWeight: "600" }}>
    {" "} (Supervisor)
  </span>
)}                          {isReadOnly && (isReviewMode || viewingSubmission) && " (Read Only)"}
                        </label>
{renderField(
  field, 
  isReadOnly, 
  (id, value) => handleInputChange(id, value)   // Use 'id' instead of hardcoding field.fieldId
)}                      </div>
                    );
                  });
                })()}
                {!viewingSubmission && (
                  <button type="submit" className="df-submit-btn">
                    {isReviewMode ? "Submit Review" : "Submit Response"}
                  </button>
                )}
              </form>
            )}
        <button className="df-back-btn" onClick={() => {
  setFillMode(false);
  setIsReviewMode(false);
  setViewingSubmission(false);
  setSelectedSubmission(null);
  setFormData({});
  setHasSubmitted(false);
  setSubmissionData(null);
  // Do NOT clear teamSubmissions here
}}>
  Back
</button>
          </div>
        )}
      
{showResponsesModal && (
  <div className="df-modal-overlay">
    <div className="df-modal df-responses-modal" style={{ maxWidth: "95%", width: "1100px", maxHeight: "90vh" }}>
      <h3>Responses for "{currentFormTitle}"</h3>
      
      <div style={{ marginBottom: "15px", fontSize: "0.95rem", color: "#475569" }}>
        Total Assigned: <strong>{currentResponses.length}</strong> | 
        Submitted: <strong style={{color: "#16a34a", fontWeight: "600"}}>
          {currentResponses.filter(r => r.status === "submitted").length}
        </strong> | 
        Pending: <strong style={{color: "#ef4444"}}>
          {currentResponses.filter(r => r.status === "not_submitted").length}
        </strong>
      </div>

      {currentResponses.length === 0 ? (
        <p>No employees assigned to this form yet.</p>
      ) : (
        <div style={{ overflow: "auto", maxHeight: "70vh" }}>
          
         {currentResponses.map((resp, index) => {
  const reviewedById = resp.metadata?.__reviewed_by;
  let reviewedByName = "";
  if (reviewedById) {
    const supervisor = employees.find(
      emp => String(emp.employee_id || emp.id) === String(reviewedById)
    );
    reviewedByName = supervisor
      ? `${supervisor.first_name || ""} ${supervisor.middle_name || ""} ${supervisor.last_name || ""}`.trim() || `Supervisor ${reviewedById}`
      : `Supervisor ${reviewedById}`;
  }

  const isExpanded = expandedResponses.has(index);
  const isNotSubmitted = resp.status === "not_submitted";

  return (
    <div
      key={index}
      style={{
        marginBottom: "20px",
        border: isNotSubmitted ? "1px solid #dee2e6" : "1px solid #4ade80",
        borderRadius: "10px",
        overflow: "hidden",
        backgroundColor: isNotSubmitted ? "#fef2f2" : "#f0fdf4",
      }}
    >
      {/* Improved Header with Proper Employee Name */}
      <div
        onClick={() => !isNotSubmitted && toggleResponse(index)}
        style={{
          padding: "16px 20px",
          backgroundColor: isNotSubmitted ? "#fee2e2" : "#ecfdf5",
          cursor: isNotSubmitted ? "default" : "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <strong style={{ fontSize: "1.12rem", color: "#1e2937" }}>
            Employee: {resp.employeeDisplay || 
              `${resp.employee_first_name || ""} ${resp.employee_middle_name || ""} ${resp.employee_last_name || ""}`.trim() || 
              `Employee ${resp.employee_id || "Unknown"}`}
          </strong>
          
          {reviewedByName && (
            <div style={{ marginTop: "6px", fontSize: "0.95rem", color: "#475569" }}>
              Reviewed By: <strong>{reviewedByName}</strong>
            </div>
          )}
        </div>

        {!isNotSubmitted && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#555", fontSize: "0.93rem" }}>
              Submitted: {formatSubmittedTime(resp.submitted_at)}
            </span>
            <span style={{ 
              fontSize: "1.55rem", 
              transition: "transform 0.3s ease", 
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" 
            }}>
              ▼
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {!isNotSubmitted && isExpanded && (
        <div style={{ padding: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f3f5" }}>
                <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "2px solid #cbd5e1" }}>Field</th>
                <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "2px solid #cbd5e1" }}>Response</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(resp.readableAnswers || {}).map(([fieldName, response], i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "14px 16px", fontWeight: "500" }}>{fieldName}</td>
                  <td style={{ padding: "14px 16px", backgroundColor: "#f8fafc", whiteSpace: "pre-wrap" }}>
                    {Array.isArray(response) ? response.join(", ") : response || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Metadata */}
          {resp.metadata && Object.keys(resp.metadata).length > 0 && (
            <div style={{
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "#fff8e1",
              borderRadius: "8px",
              border: "1px solid #f0ad4e"
            }}>
              <strong style={{ color: "#854d0e", display: "block", marginBottom: "12px" }}>
                Additional Information:
              </strong>
              <ul style={{ margin: "0 0 0 20px", padding: 0, listStyleType: "disc", color: "#713f12" }}>
                {Object.entries(resp.metadata)
                  .filter(([metaKey]) => {
                    const key = metaKey.toLowerCase().replace(/^__/, "");
                    return !(
                      key === "orgid" || key === "org_id" ||
                      key === "formid" || key === "form_id" ||
                      key === "isreview" || key === "is_review"||
                          key === "reviewed_employee" || key === "reviewedemployee"||   // ✅ ADD THIS
key === "reviewed_at" || key === "reviewedat"
                    );
                  })
                  .map(([metaKey, metaValue]) => {
                    let displayKey = metaKey.replace(/^__/, "").replace(/_/g, " ");
                    let displayValue = metaValue;
                    if (metaKey.toLowerCase().includes("submitted_at") || 
                        metaKey.toLowerCase().includes("reviewed_at")) {
                      displayValue = metaValue 
                        ? new Date(metaValue).toLocaleString("en-IN", { 
                            timeZone: "Asia/Kolkata",
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit", hour12: true 
                          }) 
                        : "—";
                    }
                    return (
                      <li key={metaKey} style={{ marginBottom: "6px" }}>
                        <strong>{toTitleCase(displayKey)}:</strong> {displayValue || "—"}
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>
      )}

      {isNotSubmitted && (
        <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>
          This employee has not submitted the form yet.
        </div>
      )}
    </div>
  );
})}
        </div>
      )}

      <div className="df-modal-actions" style={{ marginTop: "25px", textAlign: "right" }}>
        <button
          onClick={() => {
            setShowResponsesModal(false);
            setExpandedResponses(new Set());
          }}
          style={{
            padding: "12px 28px",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem"
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
      </div>
      {/* Alert Modal */}
      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[
          {
            label: "OK",
            onClick: closeAlert,
          },
        ]}
      >
        <div style={{ textAlign: "center" }}>
          {alertModal.title && (
            <h3
              style={{
                margin: "0 0 16px 0",
                color:
                  alertModal.type === "error"
                    ? "#dc3545"
                    : alertModal.type === "success"
                    ? "#28a745"
                    : alertModal.type === "warning"
                    ? "#ffc107"
                    : "#0d6efd",
              }}
            >
              {alertModal.title}
            </h3>
          )}
          <p style={{ margin: "0", whiteSpace: "pre-line" }}>{alertModal.message}</p>
        </div>
      </Modal>
    </>
  );
}
