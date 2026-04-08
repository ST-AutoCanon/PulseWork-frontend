


"use client";
import React, { useState, useEffect } from "react";
import "./DynamicFormBuilder.css";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { FiPlus ,FiSave} from "react-icons/fi";
export default function DynamicFormBuilder() {
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
  // ==================== fetchTeamSubmissions - MOVED HERE ====================
// const fetchTeamSubmissions = async () => {
//   if (!isSupervisor || myTeamEmployeeIds.length === 0) {
//     setTeamSubmissions([]);
//     return;
//   }

//   try {
//     const res = await fetch(`${BACKEND_URL}/api/forms/team-submissions`, {
//       method: "GET",
//       credentials: "include",
//       headers: getHeaders(),
//       cache: 'no-store',
//     });

//     if (!res.ok) {
//       console.error("Team submissions API failed:", res.status);
//       setTeamSubmissions([]);
//       return;
//     }

//     const json = await res.json();
//     let submissions = Array.isArray(json) ? json :
//                      json.data || json.submissions || json.responses || [];

//     // Filter only employee_supervisor type forms
//     submissions = submissions.filter(sub =>
//       sub.form_type === 'employee_supervisor' || !sub.form_type
//     );

//     setTeamSubmissions(submissions);
//   } catch (err) {
//     console.error("Failed to fetch team submissions:", err);
//     setTeamSubmissions([]);
//   }
// };
// Add this function near your other utilities
// Add this function near your other utilities
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
        setFieldLabel(field.employee.label);
        setFieldType(field.employee.type);
        setFieldRequired(field.employee.required || false);
        setFieldPlaceholder(field.employee.placeholder || "");
        if (field.employee.options) {
          setOptionsInput(field.employee.options.map((o) => o.label).join(", "));
        }
        if (field.supervisor) {
          setHasSupervisorFeedback(true);
          setSupervisorLabel(field.supervisor.label);
          setSupervisorType(field.supervisor.type);
          setSupervisorRequired(field.supervisor.required || false);
          setSupervisorVisibleToEmployee(field.supervisor.visibleToEmployee !== false);
          if (field.supervisor.options) {
            setSupervisorOptionsInput(field.supervisor.options.map((o) => o.label).join(", "));
          }
        } else {
          setHasSupervisorFeedback(false);
          setSupervisorLabel("");
          setSupervisorType("text");
          setSupervisorRequired(false);
          setSupervisorVisibleToEmployee(true);
          setSupervisorOptionsInput("");
        }
      }
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
};
    const addOrUpdateField = () => {
    const trimmed = fieldLabel.trim();
    if (!trimmed) {
      showAlert("Field label is required.");
      return;
    }

    // Supervisor Validation
    if (formType === 'employee_supervisor' && hasSupervisorFeedback) {
      const allowedTypes = ['text', 'radio', 'checkbox-group', 'rating'];
      if (!allowedTypes.includes(supervisorType)) {
        showAlert("Supervisor feedback can only be text, radio, checkbox group, or rating.");
        return;
      }
      if (!supervisorLabel.trim()) {
        showAlert("Supervisor feedback label is required.");
        return;
      }
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

    let supervisorConfig = undefined;
    if (formType === 'employee_supervisor' && hasSupervisorFeedback) {
      supervisorConfig = {
        label: supervisorLabel.trim(),
        type: supervisorType,
        required: supervisorRequired,
        visibleToEmployee: supervisorVisibleToEmployee,
      };

      const needsOptions = supervisorType === 'radio' || supervisorType === 'checkbox-group';

      if (needsOptions) {
        const opts = supervisorOptionsInput
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
          .map((label) => ({ label, value: label.toLowerCase().replace(/\s+/g, "-") }));

        if (opts.length === 0) {
          showAlert(`Please provide at least one option for supervisor ${supervisorType === 'checkbox-group' ? 'checkbox' : 'radio'} field.`, "error");
          return;
        }
        supervisorConfig.options = opts;
      }
    }

    const newField = {
      id: editingFieldId || Date.now().toString(),
      employee: employeeConfig,
      supervisor: supervisorConfig,
    };

    if (editingFieldId) {
      setFields(fields.map((f) => (f.id === editingFieldId ? newField : f)));
    } else {
      setFields([...fields, newField]);
    }

    // Reset form
    setFieldLabel("");
    setFieldType("text");
    setFieldRequired(false);
    setFieldPlaceholder("");
    setOptionsInput("");
    setHasSupervisorFeedback(false);
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

  if (formType === 'employee_supervisor' && !fields.some(f => f.supervisor)) {
    showAlert("For Employee + Supervisor form, please add at least one field with supervisor feedback.",  );
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
  // const saveTemplate = async () => {
  //   if (!formName.trim()) {
  //     setError("Form name required");
  //     return;
  //   }
  //   if (fields.length === 0) {
  //     setError("Add at least one field");
  //     return;
  //   }
  //   if (formType === 'employee_supervisor' && !fields.some(f => f.supervisor)) {
  //     setError("Add at least one field with supervisor feedback");
  //     return;
  //   }
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const method = editingId ? "PUT" : "POST";
  //     const url = editingId
  //       ? `${BACKEND_URL}/api/forms/${editingId}`
  //       : `${BACKEND_URL}/api/forms`;
  //     const payload = {
  //       form_name: formName.trim(),
  //       form_json: fields,
  //       layout: layoutMode,
  //       active_from: activeFrom || null,
  //       active_to: activeTo || null,
  //       form_type: formType,
  //     };
  //     const res = await fetch(url, {
  //       method,
  //       credentials: "include",
  //       headers: getHeaders(),
  //       body: JSON.stringify(payload),
  //     });
  //     if (!res.ok) throw new Error("Failed to save form");
  //     await fetchForms();
  //     resetForm();
  //     showAlert(editingId ? "Form updated successfully" : "Form created successfully", "Success", "success");
  //   } catch (err) {
  //     console.error(err);
  //     setError("Save failed");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
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
      const now = new Date();
      const fromDate = form.active_from ? new Date(form.active_from) : null;
      const toDate = form.active_to ? new Date(form.active_to) : null;
      if ((fromDate && now < fromDate) || (toDate && now > toDate)) {
        setError("This form is not active at this time.");
        setSelectedTemplate(null);
        setFillMode(false);
        return;
      }
      setSelectedTemplate(form);
      setViewMode(false);
      setFillMode(true);
      setFormData({});
      setIsReviewMode(false);
      setTeamSubmissions([]);
      setSelectedSubmission(null);
      setHasSubmitted(false);
      setSubmissionData(null);
      setViewingSubmission(false);
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
      setError("Failed to load form");
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
  const renderField = (field, isPreview = true, onChange = null) => {
    const fieldKey = field.fieldId || field.id;
    const isDisabled = isPreview || field.readOnly || false;
    const handleChange = (value) => {
      if (onChange) onChange(fieldKey, value);
      else handleInputChange(fieldKey, value);
    };
    const currentValue = formData[fieldKey];
    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            className="df-input"
            disabled={isDisabled}
            value={currentValue || ""}
            onChange={(e) => handleChange(e.target.value)}
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
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder}
            className="df-input"
            disabled={isDisabled}
            value={currentValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            required={field.required && !isDisabled}
          />
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
                  name={fieldKey}
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
      case "checkbox-group":
        return (
          <div className="df-checkbox-group">
            {field.options?.map((opt) => (
              <label key={opt.value} className="df-checkbox-label">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={(currentValue || []).includes(opt.value)}
                  disabled={isDisabled}
                  onChange={(e) => {
                    const curr = currentValue || [];
                    const updated = e.target.checked
                      ? [...curr, opt.value]
                      : curr.filter((v) => v !== opt.value);
                    handleChange(updated);
                  }}
                />
                {opt.label}
              </label>
            ))}
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
  const viewResponses = async (formId, formName) => {
    try {
      setLoading(true);
      setCurrentResponses([]);
      const formRes = await fetch(`${BACKEND_URL}/api/forms/${formId}`, {
        credentials: "include",
        headers: getHeaders(),
      });
      if (!formRes.ok) throw new Error("Failed to load form");
      const formJson = await formRes.json();
      const form = formJson.data || formJson;
      const res = await fetch(`${BACKEND_URL}/api/forms/${formId}/responses`, {
        method: "GET",
        credentials: "include",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load responses");
      const json = await res.json();
      let rawResponses = [];
      if (Array.isArray(json)) rawResponses = json;
      else if (Array.isArray(json.data)) rawResponses = json.data;
      else if (Array.isArray(json.responses)) rawResponses = json.responses;
      const fieldMetaMap = (() => {
        let formJson = form.form_json;
        if (typeof formJson === 'string') {
          try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
        }
        return (formJson || []).reduce((acc, f) => {
          if (form.form_type === 'employee_supervisor') {
            if (f.employee) {
              acc[String(f.id)] = { label: f.employee.label || f.id, visibleTo: "employee" };
              if (f.supervisor) {
                acc[String(f.id) + '_sup'] = { label: f.supervisor.label || f.id + '_sup', visibleTo: "supervisor" };
              }
            }
          } else {
            if (f.employee) {
              acc[String(f.id)] = { label: f.employee.label || f.id, visibleTo: "both" };
            } else {
              acc[String(f.id)] = { label: f.label || f.id, visibleTo: "both" };
            }
          }
          return acc;
        }, {});
      })();
      const formatted = rawResponses.map((resp) => {
        const responseJson = resp.response_json || {};
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
          ...resp,
          readableAnswers: readable,
          metadata: meta,
          employeeDisplay: resp.employee_name || `Employee ${resp.employee_id || "Unknown"}`,
        };
      });
      setCurrentResponses(formatted);
      setCurrentFormTitle(formName || form.form_name || "Form Responses");
      setShowResponsesModal(true);
    } catch (err) {
      showAlert("Error loading responses: " + err.message, "Error", "error");
    } finally {
      setLoading(false);
    }
  };
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

    setSelectedEmployeeIds([]);

    // Refresh already assigned list
    const refreshRes = await fetch(`${BACKEND_URL}/api/forms/${editingId}/assigned`, {
      method: "GET",
      credentials: "include",
      headers: getHeaders(),
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      const ids = (data.data || data.assigned || []).map(item => String(item.employee_id || item.id));
      setAlreadyAssignedIds(ids);
    }

  } catch (err) {
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
      onChange={(e) => setFormName(toTitleCase(e.target.value))}
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
                <input placeholder="e.g., Your Name" value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} className="df-input" />
                <label style={{ display: "block", marginTop: "12px", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
                  Employee Placeholder (optional)
                </label>
                <input placeholder="e.g., Enter your full name" value={fieldPlaceholder} onChange={(e) => setFieldPlaceholder(e.target.value)} className="df-input" />
                {showOptions && (
                  <div style={{ marginTop: "12px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
                      Employee Options (comma separated)
                    </label>
                    <input placeholder="e.g., Option 1, Option 2, Option 3" value={optionsInput} onChange={(e) => setOptionsInput(e.target.value)} className="df-input" />
                  </div>
                )}
                <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", cursor: "pointer" }}>
                  <input type="checkbox" checked={fieldRequired} onChange={(e) => setFieldRequired(e.target.checked)} />
                  <span>Employee Required</span>
                </label>
                {formType === 'employee_supervisor' && (
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", cursor: "pointer" }}>
                    <input type="checkbox" checked={hasSupervisorFeedback} onChange={(e) => setHasSupervisorFeedback(e.target.checked)} />
                    <span>Add Supervisor Feedback for this field</span>
                  </label>
                )}
              {formType === 'employee_supervisor' && hasSupervisorFeedback && (
  <div style={{ marginTop: "16px", padding: "18px", backgroundColor: "#fff3cd", borderRadius: "10px", border: "1px solid #ffeaa7" }}>
    <h5 style={{ margin: "0 0 12px 0", color: "#856404" }}> Supervisor Feedback</h5>

    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
      Supervisor Field Type
    </label>
    <select 
      value={supervisorType} 
      onChange={(e) => setSupervisorType(e.target.value)} 
      className="df-input"
    >
      <option value="text">📝 Text</option>
      <option value="radio">◉ Radio Buttons</option>
      <option value="checkbox-group">☑️ Checkbox Group</option>
      <option value="rating">⭐ Rating</option>
    </select>

    <label style={{ display: "block", marginTop: "12px", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
      Supervisor Field Label
    </label>
    <input 
      placeholder="e.g., Supervisor Comments / Rating" 
      value={supervisorLabel} 
      onChange={(e) => setSupervisorLabel(e.target.value)} 
      className="df-input" 
    />

    {/* Options Input for Radio & Checkbox Group */}
    {(supervisorType === 'radio' || supervisorType === 'checkbox-group') && (
      <div style={{ marginTop: "12px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
          {supervisorType === 'checkbox-group' ? 'Checkbox Options' : 'Radio Options'} (comma separated)
        </label>
        <input
          placeholder={supervisorType === 'checkbox-group' 
            ? "e.g., Excellent, Good, Average, Poor, Very Poor" 
            : "e.g., Yes, No, Maybe"}
          value={supervisorOptionsInput}
          onChange={(e) => setSupervisorOptionsInput(e.target.value)}
          className="df-input"
        />
        <small style={{ color: "#666", display: "block", marginTop: "4px" }}>
          Separate options with commas
        </small>
      </div>
    )}

    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
        <input type="checkbox" checked={supervisorRequired} onChange={(e) => setSupervisorRequired(e.target.checked)} />
        <span>Supervisor Required</span>
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
        <input type="checkbox" checked={supervisorVisibleToEmployee} onChange={(e) => setSupervisorVisibleToEmployee(e.target.checked)} />
        <span>Visible to Employee</span>
      </label>
    </div>
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
                            {f.supervisor && <span style={{ color: "#856404", marginLeft: "10px" }}> Supervisor</span>}
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
                {/* {editingId && (
                  <div className="assign-container">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h4 style={{ margin: 0 }}>Assign Form to Employees</h4>
                      <button
                        type="button"
                        onClick={() => setShowAssignSection(!showAssignSection)}
                        style={{
                          padding: "8px 16px",
                          background: showAssignSection ? "#6c757d" : "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                      >
                        {showAssignSection ? "Hide" : "Assign"}
                      </button>
                    </div>
                    {showAssignSection && (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", cursor: "pointer", fontWeight: "600" }}>
                          <input
                            type="checkbox"
                            checked={selectedEmployeeIds.length === employees.length && employees.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployeeIds(employees.map(emp => emp.employee_id || emp.id));
                              } else {
                                setSelectedEmployeeIds([]);
                              }
                            }}
                          />
                          Select All Employees
                        </label>
                        <div className="assign-list">
                          {employees.map((emp) => {
                            const empId = emp.employee_id || emp.id;
                            const displayName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`.trim() || `Employee ${empId}`;
                            const isChecked = selectedEmployeeIds.includes(empId);
                            return (
                              <label key={empId} className="assign-item">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
                                    } else {
                                      setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== empId));
                                    }
                                  }}
                                />
                                <span>{displayName}</span>
                              </label>
                            );
                          })}
                        </div>
                        <div style={{ marginTop: "16px", textAlign: "right" }}>
                          <button
                            onClick={handleAssign}
                            disabled={loading || selectedEmployeeIds.length === 0}
                            style={{
                              padding: "12px 28px",
                              background: selectedEmployeeIds.length > 0 ? "#198754" : "#6c757d",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              fontWeight: "600",
                              cursor: selectedEmployeeIds.length > 0 ? "pointer" : "not-allowed"
                            }}
                          >
                            Assign to {selectedEmployeeIds.length} Employee{selectedEmployeeIds.length !== 1 ? "s" : ""}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )} */}
   {/* {editingId && (
  <div className="assign-container">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
      <h4 style={{ margin: 0 }}>Assign Form to Employees</h4>
      <button
        type="button"
        onClick={() => setShowAssignSection(!showAssignSection)}
        style={{
          padding: "8px 18px",
          background: showAssignSection ? "#6c757d" : "#0d6efd",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        {showAssignSection ? "Hide" : "Assign Employees"}
      </button>
    </div>

    {showAssignSection && (
      <>
        <div style={{ marginBottom: "16px", color: "#475569", fontSize: "14.5px" }}>
          Total Employees: <strong>{employees.length}</strong> &nbsp;&nbsp; 
          Already Assigned: <strong style={{ color: "#16a34a" }}>{alreadyAssignedIds.length}</strong>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", fontWeight: "600", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={selectedEmployeeIds.length > 0 && 
                     selectedEmployeeIds.length === employees.filter(emp => 
                       !alreadyAssignedIds.includes(String(emp.employee_id || emp.id))
                     ).length}
            onChange={(e) => {
              const availableEmps = employees.filter(emp => 
                !alreadyAssignedIds.includes(String(emp.employee_id || emp.id))
              );
              if (e.target.checked) {
                setSelectedEmployeeIds(availableEmps.map(emp => String(emp.employee_id || emp.id)));
              } else {
                setSelectedEmployeeIds([]);
              }
            }}
          />
          Select All Available Employees
        </label>

        <div className="assign-list">
          {employees.map((emp) => {
            const empId = String(emp.employee_id || emp.id || "");
            const isAlreadyAssigned = alreadyAssignedIds.includes(empId);

            const fullName = `${emp.first_name || ''} ${emp.middle_name || ''} ${emp.last_name || ''}`.trim();
            const displayText = fullName ? `${fullName} (${empId})` : `Employee ${empId}`;

            return (
              <label 
                key={empId}
                className="assign-item"
                style={{
                  opacity: isAlreadyAssigned ? 0.65 : 1,
                  cursor: isAlreadyAssigned ? "not-allowed" : "pointer",
                  background: isAlreadyAssigned ? "#f0fdf4" : "white"
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedEmployeeIds.includes(empId)}
                  disabled={isAlreadyAssigned}
                  onChange={(e) => {
                    if (isAlreadyAssigned) return;
                    if (e.target.checked) {
                      setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
                    } else {
                      setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== empId));
                    }
                  }}
                />
                <span style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                  {displayText}
                  {isAlreadyAssigned && (
                    <span style={{
                      background: "#16a34a",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "500"
                    }}>
                      Already Assigned
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>

        <div style={{ marginTop: "24px", textAlign: "right" }}>
          <button
            onClick={handleAssign}
            disabled={loading || selectedEmployeeIds.length === 0}
            style={{
              padding: "13px 34px",
              background: selectedEmployeeIds.length > 0 ? "#16a34a" : "#94a3b8",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "600",
              cursor: selectedEmployeeIds.length > 0 ? "pointer" : "not-allowed"
            }}
          >
            Assign to {selectedEmployeeIds.length} Employee{selectedEmployeeIds.length !== 1 ? "s" : ""}
          </button>
        </div>
      </>
    )}
  </div>
)} */}
{editingId && (
  <div className="assign-container">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
      <h4 style={{ margin: 0 }}>Assign Form to Employees</h4>
      <button
        type="button"
        onClick={() => setShowAssignSection(!showAssignSection)}
        style={{
          padding: "8px 18px",
          background: showAssignSection ? "#6c757d" : "#0d6efd",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        {showAssignSection ? "Hide" : "Assign Employees"}
      </button>
    </div>

    {showAssignSection && (
      <>
        <div style={{ marginBottom: "18px", fontSize: "14.5px", color: "#475569" }}>
          Total Employees: <strong>{employees.length}</strong> &nbsp;&nbsp; 
          Already Assigned: <strong style={{ color: "#16a34a" }}>{alreadyAssignedIds.length}</strong>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", cursor: "pointer", fontWeight: "600" }}>
          <input
            type="checkbox"
            checked={selectedEmployeeIds.length > 0 && 
                     selectedEmployeeIds.length === 
                     employees.filter(emp => !alreadyAssignedIds.includes(String(emp.employee_id || emp.id))).length}
            onChange={(e) => {
              const available = employees.filter(emp => 
                !alreadyAssignedIds.includes(String(emp.employee_id || emp.id))
              );
              if (e.target.checked) {
                setSelectedEmployeeIds(available.map(emp => String(emp.employee_id || emp.id)));
              } else {
                setSelectedEmployeeIds([]);
              }
            }}
          />
          Select All Available Employees
        </label>

        <div className="assign-list">
          {employees.map((emp) => {
            const empId = String(emp.employee_id || emp.id || "");
            const isAlreadyAssigned = alreadyAssignedIds.includes(empId);

            const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`.trim();
            const displayText = fullName ? `${fullName} (${empId})` : `Employee ${empId}`;

            return (
              <label 
                key={empId} 
                className="assign-item"
                style={{ 
                  opacity: isAlreadyAssigned ? 0.65 : 1,
                  background: isAlreadyAssigned ? "#f0fdf4" : "white"
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedEmployeeIds.includes(empId)}
                  disabled={isAlreadyAssigned}
                  onChange={(e) => {
                    if (isAlreadyAssigned) return;
                    if (e.target.checked) {
                      setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
                    } else {
                      setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== empId));
                    }
                  }}
                />
                <span style={{ flex: 1 }}>
                  {displayText}
                  {isAlreadyAssigned && (
                    <span style={{
                      marginLeft: "12px",
                      background: "#16a34a",
                      color: "white",
                      padding: "4px 11px",
                      borderRadius: "9999px",
                      fontSize: "13px",
                      fontWeight: "500"
                    }}>
                      Already Assigned
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>

        <div style={{ marginTop: "24px", textAlign: "right" }}>
          <button
            onClick={handleAssign}
            disabled={loading || selectedEmployeeIds.length === 0}
            style={{
              padding: "13px 34px",
              background: selectedEmployeeIds.length > 0 ? "#16a34a" : "#94a3b8",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "600"
            }}
          >
            Assign to {selectedEmployeeIds.length} Employee{selectedEmployeeIds.length !== 1 ? "s" : ""}
          </button>
        </div>
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
            {/* Tabs */}
            {/* {(isSupervisor || canBuildForms) && (
              <div className="df-tabs" style={{ marginBottom: "25px", display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setActiveTab("self")}
                  style={{
                    padding: "10px 24px",
                    background: activeTab === "self" ? "#79c42b" : "#f8f9fa",
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
                    background: activeTab === "team" ? "#79c42b" : "#f8f9fa",
                    color: activeTab === "team" ? "#fff" : "#333",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: activeTab === "team" ? "600" : "500"
                  }}
                >
                  Team Forms
                </button>
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
            )} */}
            {/* Tabs - Simplified for Admin */}
{(isSupervisor || canBuildForms) && (
  <div className="df-tabs" style={{ marginBottom: "25px", display: "flex", gap: "12px" }}>
    
    {/* Show Self & Team tabs only for HR and Supervisors (not pure Admin) */}
    {(!isAdmin || isHR) && (
      <>
        <button
          onClick={() => setActiveTab("self")}
          style={{
            padding: "10px 24px",
            background: activeTab === "self" ? "#79c42b" : "#f8f9fa",
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
            background: activeTab === "team" ? "#79c42b" : "#f8f9fa",
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
            {/* <div className="df-template-grid">
              {activeTab === "all" && canSeeAllTab ? (
                templates.length === 0 ? (
                  <p style={{ color: "#666", textAlign: "center", padding: "40px 0" }}>No forms created yet.</p>
                ) : (
                  templates.map((t) => {
                    let activeFrom = t.active_from || t.activeFrom || null;
                    let activeTo = t.active_to || t.activeTo || null;
                    const fromStr = activeFrom ? new Date(activeFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
                    const toStr = activeTo ? new Date(activeTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
                    const isActive = !activeFrom || !activeTo || (new Date() >= new Date(activeFrom) && new Date() <= new Date(activeTo));
                    return (
                      <div key={t.id} className="df-template-card">
<h4>{toTitleCase(t.form_name || t.name || "")}</h4>                        <div style={{
                          margin: "14px 0 18px 0",
                          padding: "12px 14px",
                          background: isActive ? "#f0fdf4" : "#fef2f2",
                          borderRadius: "10px",
                          border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
                        }}>
                          <strong>Active Period:</strong><br />
                          {fromStr} — {toStr}
                          <br />
                          <span style={{ color: isActive ? "#166534" : "#991b1b", fontWeight: "500" }}>
                            {isActive ? "✅ Currently Active" : "⚠️ Not Active"}
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
              ) : activeTab === "self" ? (
                selfForms.length === 0 ? (
                  <p style={{ color: "#666", textAlign: "center", padding: "40px 0" }}>No forms assigned to you yet.</p>
                ) : (
                  selfForms.map((t) => {
                    let activeFrom = t.active_from || t.activeFrom || null;
                    let activeTo = t.active_to || t.activeTo || null;
                    const fromStr = activeFrom ? new Date(activeFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
                    const toStr = activeTo ? new Date(activeTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
                    const isActive = !activeFrom || !activeTo || (new Date() >= new Date(activeFrom) && new Date() <= new Date(activeTo));
                    return (
                      <div key={t.id} className="df-template-card">
<h4>{toTitleCase(t.form_name || t.name || "")}</h4>    
                    <div style={{
                          margin: "14px 0 18px 0",
                          padding: "12px 14px",
                          background: isActive ? "#f0fdf4" : "#fef2f2",
                          borderRadius: "10px",
                          border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
                        }}>
                          <strong>Active Period:</strong><br />
                          {fromStr} — {toStr}
                          <br />
                          <span style={{ color: isActive ? "#166534" : "#991b1b", fontWeight: "500" }}>
                            {isActive ? "✅ Currently Active" : "⚠️ Not Active"}
                          </span>
                        </div>
                        <button
                          onClick={() => fillTemplate(t)}
                          className="df-fill-btn"
                          disabled={!isActive}
                          style={{ opacity: isActive ? 1 : 0.65 }}
                        >
                          {isActive ? "Fill Form" : "Not Active Now"}
                        </button>
                      </div>
                    );
                  })
                )
             ) : (
  // ==================== TEAM TAB - ONLY MY TEAM EMPLOYEES ====================
  <>
    {teamSubmissions.length === 0 ? (
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
              active_from: sub.active_from || sub.activeFrom || sub.form_active_from || null,
              active_to: sub.active_to || sub.activeTo || sub.form_active_to || null,
              submissions: []
            };
          }
          acc[formId].submissions.push(sub);
          return acc;
        }, {})
      ).map(([formId, group]) => {
        const fromStr = group.active_from
          ? new Date(group.active_from).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric'
            })
          : "—";
        const toStr = group.active_to
          ? new Date(group.active_to).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric'
            })
          : "—";
        const isActive = !group.active_from || !group.active_to ||
          (new Date() >= new Date(group.active_from) && new Date() <= new Date(group.active_to));

        return (
          <div key={formId} className="df-template-card">
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
                {isActive ? "✅ Currently Active" : "⚠️ Not Active"}
              </span>
            </div>
            <p style={{ color: "#666", marginBottom: "16px" }}>
              {group.submissions.length} employee{group.submissions.length > 1 ? "s" : ""} submitted
            </p>
            <div>
              {group.submissions.map((sub, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSubmission(sub);
                  }}
                  style={{
                    padding: "10px 12px",
                    marginBottom: "8px",
                    background: "#f8f9fa",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border: "1px solid #e9ecef",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e3f2fd")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                >
                  <strong>
                    {sub.employee_name || `Employee ${sub.employee_id || sub.employeeId || "Unknown"}`}
                  </strong>
                 
                </div>
              ))}
            </div>
          </div>
        );
      })
    )}
  </>
)}
            </div> */}
            <div className="df-template-grid">
  {/* ==================== ALL FORMS TAB (Admin/HR Management) ==================== */}
  {activeTab === "all" && canSeeAllTab && (
    templates.length === 0 ? (
      <p style={{ color: "#666", textAlign: "center", padding: "60px 0", gridColumn: "1 / -1" }}>
        No forms created yet.
      </p>
    ) : (
      templates.map((t) => {
        const activeFrom = t.active_from || t.activeFrom || null;
        const activeTo = t.active_to || t.activeTo || null;
        const fromStr = activeFrom ? new Date(activeFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
        const toStr = activeTo ? new Date(activeTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
        const isActive = !activeFrom || !activeTo || (new Date() >= new Date(activeFrom) && new Date() <= new Date(activeTo));

        return (
          <div key={t.id} className="df-template-card">
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
                {isActive ? "✅ Currently Active" : "⚠️ Not Active"}
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
  )}

  {/* ==================== SELF FORMS TAB ==================== */}
  {activeTab === "self" && (
    selfForms.length === 0 ? (
      <p style={{ color: "#666", textAlign: "center", padding: "60px 0", gridColumn: "1 / -1" }}>
        No forms assigned to you yet.
      </p>
    ) : (
      selfForms.map((t) => {
        const activeFrom = t.active_from || t.activeFrom || null;
        const activeTo = t.active_to || t.activeTo || null;
        const fromStr = activeFrom ? new Date(activeFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
        const toStr = activeTo ? new Date(activeTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
        const isActive = !activeFrom || !activeTo || (new Date() >= new Date(activeFrom) && new Date() <= new Date(activeTo));

        return (
          <div key={t.id} className="df-template-card">
            <h4>{toTitleCase(t.form_name || t.name || "")}</h4>
            <div style={{
              margin: "14px 0 18px 0",
              padding: "12px 14px",
              background: isActive ? "#f0fdf4" : "#fef2f2",
              borderRadius: "10px",
              border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
            }}>
              <strong>Active Period:</strong><br />
              {fromStr} — {toStr}
              <br />
              <span style={{ color: isActive ? "#166534" : "#991b1b", fontWeight: "500" }}>
                {isActive ? "✅ Currently Active" : "⚠️ Not Active"}
              </span>
            </div>

            <button
              onClick={() => fillTemplate(t)}
              className="df-fill-btn"
              disabled={!isActive}
              style={{ opacity: isActive ? 1 : 0.65, width: "100%" }}
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
        const isActive = !group.active_from || !group.active_to ||
          (new Date() >= new Date(group.active_from) && new Date() <= new Date(group.active_to));

        return (
          <div key={formId} className="df-template-card">
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
                {isActive ? "✅ Currently Active" : "⚠️ Not Active"}
              </span>
            </div>
            <p style={{ color: "#666", marginBottom: "16px" }}>
              {group.submissions.length} employee{group.submissions.length > 1 ? "s" : ""} submitted
            </p>
            <div>
              {group.submissions.map((sub, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSubmission(sub);
                  }}
                  style={{
                    padding: "10px 12px",
                    marginBottom: "8px",
                    background: "#f8f9fa",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border: "1px solid #e9ecef",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e3f2fd"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                >
                  <strong>
                    {sub.employee_name || `Employee ${sub.employee_id || sub.employeeId || "Unknown"}`}
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
        {viewMode && selectedTemplate && (
          <div className="df-preview">
<h3>{toTitleCase(selectedTemplate.form_name)} (Preview)</h3>            <form className={`df-form df-grid-layout df-grid-${selectedTemplate.layout || "one"}`}>
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
                    if (f.employee) {
                      const fields = [{ ...f.employee, isSupervisor: false, fieldId: f.id }];
                      if (f.supervisor) fields.push({ ...f.supervisor, isSupervisor: true, fieldId: f.id + '_sup' });
                      return fields;
                    }
                    return [];
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
  {field.isSupervisor && <span style={{ fontSize: '13px', color: '#64748b' }}> (Supervisor)</span>}
</label>
                    {renderField(field, true)}
                  </div>
                ));
              })()}
            </form>
            <button className="df-submit-btn" onClick={() => setViewMode(false)}>Back to Builder</button>
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
                      fieldsToRender.push({
                        ...f.employee,
                        isSupervisor: false,
                        fieldId: f.id,
                        readOnly: isReviewMode || viewingSubmission
                      });
                      if (f.supervisor && (isReviewMode || f.supervisor.visibleToEmployee === true)) {
                        fieldsToRender.push({
                          ...f.supervisor,
                          isSupervisor: true,
                          fieldId: f.id + '_sup',
                          readOnly: !isReviewMode
                        });
                      }
                    });
                  } else {
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
                  return fieldsToRender.map((field) => {
                    const isReadOnly = field.readOnly || false;
                    return (
                      <div key={field.fieldId} className="df-form-group">
                        <label>
                          {field.label}
                          {field.required && " *"}
                          {field.isSupervisor && " (Supervisor Feedback)"}
                          {isReadOnly && (isReviewMode || viewingSubmission) && " (Read Only)"}
                        </label>
                        {renderField(field, isReadOnly, (id, value) => handleInputChange(field.fieldId, value))}
                      </div>
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
        {/* Responses Modal */}
        {/* {showResponsesModal && (
          <div className="df-modal-overlay">
            <div className="df-modal df-responses-modal" style={{ maxWidth: "95%", width: "1100px", maxHeight: "90vh" }}>
              <h3>Responses for "{currentFormTitle}"</h3>
              {currentResponses.length === 0 ? (
                <p>No responses submitted yet for this form.</p>
              ) : (
                <div style={{ overflow: "auto", maxHeight: "70vh" }}>
                  {currentResponses.map((resp, index) => (
                    <div key={index} style={{ marginBottom: "25px", border: "1px solid #dee2e6", borderRadius: "8px", padding: "20px", backgroundColor: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                        <strong>Employee: {resp.employeeDisplay || "Unknown"}</strong>
                        <span style={{ color: "#666" }}>
                          Submitted: {new Date(resp.submitted_at || resp.submittedAt || resp.created_at || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f8f9fa" }}>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Question</th>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Answer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(resp.readableAnswers || {}).map(([question, answer], i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #f1f3f5" }}>
                              <td style={{ padding: "12px", fontWeight: "500", verticalAlign: "top", width: "45%" }}>{question}</td>
                              <td style={{ padding: "12px", verticalAlign: "top", backgroundColor: "#f8f9fa", whiteSpace: "pre-wrap" }}>
                                {Array.isArray(answer) ? answer.join(", ") : answer === "" || answer === null ? <em style={{ color: "#999" }}>No answer</em> : answer}
                              </td>
                            </tr>
                          ))}
                          {resp.metadata && Object.keys(resp.metadata).length > 0 && (
                            <tr>
                              <td colSpan={2} style={{ padding: "12px", backgroundColor: "#fff8e1", borderTop: "2px solid #f0ad4e" }}>
                                <strong>System Metadata:</strong>
                                <ul style={{ margin: "8px 0 0 16px", padding: 0, listStyleType: "disc" }}>
                                  {Object.entries(resp.metadata).map(([metaKey, metaValue]) => (
                                    <li key={metaKey} style={{ marginBottom: "4px" }}>
                                      {metaKey}: {metaValue || "-"}
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
              <div className="df-modal-actions" style={{ marginTop: "20px", textAlign: "right" }}>
                <button onClick={() => setShowResponsesModal(false)} style={{ padding: "12px 24px", background: "#0d6efd", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )} */}
        {/* Responses Modal - Collapsible List */}
{/* Responses Modal - Clean Table Style */}
{showResponsesModal && (
  <div className="df-modal-overlay">
    <div className="df-modal df-responses-modal" style={{ maxWidth: "95%", width: "1100px", maxHeight: "90vh" }}>
      <h3>Responses for "{currentFormTitle}"</h3>

      {currentResponses.length === 0 ? (
        <p>No responses submitted yet for this form.</p>
      ) : (
        <div style={{ overflow: "auto", maxHeight: "70vh" }}>
          {currentResponses.map((resp, index) => {
            const isExpanded = expandedResponses.has(index);

            return (
              <div
                key={index}
                style={{
                  marginBottom: "20px",
                  border: "1px solid #dee2e6",
                  borderRadius: "10px",
                  overflow: "hidden",
                  backgroundColor: "#fff"
                }}
              >
                {/* Header */}
                <div
                  onClick={() => toggleResponse(index)}
                  style={{
                    padding: "16px 20px",
                    backgroundColor: "#f8f9fa",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    userSelect: "none"
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "1.1rem" }}>
                      Employee: {resp.employeeDisplay || `Employee ${resp.employee_id || resp.employeeId || "Unknown"}`}
                    </strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <span style={{ color: "#555", fontSize: "0.92rem" }}>
                      Submitted: {new Date(resp.submitted_at || resp.submittedAt || resp.created_at || Date.now()).toLocaleString()}
                    </span>
                    <span style={{ 
                      fontSize: "1.5rem", 
                      transition: "transform 0.3s ease",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
                    }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Expanded Content - Clean Table */}
                {isExpanded && (
                  <div style={{ padding: "20px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f1f3f5" }}>
                          <th style={{ 
                            padding: "14px 16px", 
                            textAlign: "left", 
                            borderBottom: "2px solid #cbd5e1",
                            fontWeight: "600",
                            color: "#334155",
                            width: "45%"
                          }}>
                            Field
                          </th>
                          <th style={{ 
                            padding: "14px 16px", 
                            textAlign: "left", 
                            borderBottom: "2px solid #cbd5e1",
                            fontWeight: "600",
                            color: "#334155"
                          }}>
                            Response
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(resp.readableAnswers || {}).map(([fieldName, response], i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={{ 
                              padding: "14px 16px", 
                              fontWeight: "500", 
                              verticalAlign: "top",
                              color: "#1e2937"
                            }}>
                              {fieldName}
                            </td>
                            <td style={{ 
                              padding: "14px 16px", 
                              verticalAlign: "top",
                              backgroundColor: "#f8fafc",
                              color: "#0f172a",
                              whiteSpace: "pre-wrap",
                              lineHeight: "1.5"
                            }}>
                              {Array.isArray(response) 
                                ? response.join(", ") 
                                : response === "" || response === null || response === undefined 
                                  ? <em style={{ color: "#94a3b8" }}>— No response —</em> 
                                  : response}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Metadata */}
                    {resp.metadata && Object.keys(resp.metadata).length > 0 && (
                      <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "#fefce8", borderRadius: "8px", border: "1px solid #fde047" }}>
                        <strong style={{ color: "#854d0e" }}>Additional Information:</strong>
                        <ul style={{ margin: "10px 0 0 20px", padding: 0, listStyleType: "disc", color: "#713f12" }}>
                          {/* {Object.entries(resp.metadata).map(([key, value]) => (
                            <li key={key} style={{ marginBottom: "4px" }}>
                              {key.replace(/^__/, "")}: {value || "—"}
                            </li>
                          ))} */}
                          {Object.entries(resp.metadata).map(([key, value]) => {
  let displayValue = value;

  // 👉 Check if it's submitted_at (or any date field)
  if (key.toLowerCase().includes("submitted") && value) {
    displayValue = new Date(value).toLocaleDateString(); // ✅ only date
  }

  return (
    <li key={key} style={{ marginBottom: "4px" }}>
      {key.replace(/^__/, "")}: {displayValue || "—"}
    </li>
  );
})}
                        </ul>
                      </div>
                    )}
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
            background: "#0d6efd",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "500"
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