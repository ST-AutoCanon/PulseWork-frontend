


// "use client";
// import React, { useState, useEffect , useMemo} from "react";
// import "./DynamicFormBuilder.css";
// import { useAuth } from "../../context/AuthProvider.client";
// import Modal from "../Modal/Modal.client";
// import { FiEdit2, FiTrash2 } from "react-icons/fi";
// import { FiPlus ,FiSave} from "react-icons/fi";
// import { FiDownload } from "react-icons/fi";export default function DynamicFormBuilder() {
//   const { user } = useAuth();
//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
//   const orgId =
//     user?.orgId ??
//     user?.org_id ??
//     user?.raw?.orgId ??
//     user?.Org_id ??
//     user?.raw?.Org_id ??
//     (typeof window !== "undefined" ? window.__ORG_ID : null) ??
//     null;
//   const currentEmployeeId =
//     user?.employeeId ??
//     user?.employee_id ??
//     user?.id ??
//     user?.empId ??
//     user?.emp_id ??
//     user?.raw?.employeeId ??
//     user?.raw?.employee_id ??
//     user?.raw?.id ??
//     user?.raw?.empId ??
//     user?.raw?.emp_id ??
//     (typeof window !== "undefined" ? window.__EMPLOYEE_ID : null) ??
//     null;
//   const getHeaders = (extra = {}, omitContentType = false) => {
//     const base = {
//       "x-api-key": API_KEY || "",
//       ...extra,
//     };
//     if (!omitContentType) base["Content-Type"] = "application/json";
//     if (orgId) base["x-org-id"] = String(orgId);
//     if (currentEmployeeId) base["x-employee-id"] = String(currentEmployeeId);
//     return base;
//   };



// const renderResponseValue = (response, fieldType = null) => {
//   if (response === undefined || response === null || response === "") return "—";

//   // Checkbox handling
//   if (fieldType === "checkbox" || typeof response === "boolean") {
//     return response === true || response === "true" ? 
//       <strong style={{ color: "#16a34a" }}>✅ Yes / Checked</strong> : 
//       <span style={{ color: "#ef4444" }}>❌ No / Unchecked</span>;
//   }

//   // File handling
//   if (Array.isArray(response)) {
//     const isFileArray = response.some(item => 
//       item && typeof item === "object" && (item.originalname || item.name || item.filename)
//     );

//     if (isFileArray) {
//       return (
//         <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//           {response.map((file, index) => {
//             const url = getFileUrl(file);
//             const name = file?.originalname || file?.name || file?.filename || `File ${index + 1}`;
//             return (
//               <div key={index} style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
//                 <span>📎 {name}</span>
//                 {url && (
//                   <>
//                     <button type="button" onClick={() => viewFile(file)} style={{ color: "#2563eb", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>
//                       View
//                     </button>
//                     <button type="button" onClick={() => downloadFile(file, name)} style={{ border: "none", background: "transparent", color: "#16a34a", textDecoration: "underline", cursor: "pointer" }}>
//                       Download
//                     </button>
//                   </>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       );
//     }
//     return response.join(", ");
//   }

//   // Single file object
//   if (response && typeof response === "object" && (response.originalname || response.name || response.filename)) {
//     const url = getFileUrl(response);
//     const name = response.originalname || response.name || response.filename || "File";
//     return (
//       <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
//         <span>📎 {name}</span>
//         {url && (
//           <>
//             <button type="button" onClick={() => viewFile(response)} style={{ color: "#2563eb", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>
//               View
//             </button>
//             <button type="button" onClick={() => downloadFile(response, name)} style={{ border: "none", background: "none", color: "#16a34a", cursor: "pointer" }}>Download</button>
//           </>
//         )}
//       </div>
//     );
//   }

//   return String(response);
// };
//   const [formName, setFormName] = useState("");
//   const [fields, setFields] = useState([]);
//   const [fieldType, setFieldType] = useState("text");
//   const [fieldLabel, setFieldLabel] = useState("");
//   const [fieldRequired, setFieldRequired] = useState(false);
//   const [fieldPlaceholder, setFieldPlaceholder] = useState("");
//   const [optionsInput, setOptionsInput] = useState("");
//   const [showOptions, setShowOptions] = useState(false);
//   const [editingFieldId, setEditingFieldId] = useState(null);
//   const [templates, setTemplates] = useState([]);
//   const [selfForms, setSelfForms] = useState([]);
//   const [teamSubmissions, setTeamSubmissions] = useState([]);
//   const [editingId, setEditingId] = useState(null);
//   const [viewMode, setViewMode] = useState(false);
//   const [fillMode, setFillMode] = useState(false);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [formData, setFormData] = useState({});
//   const [formResponses, setFormResponses] = useState([]);
//   const [feedbackRequests, setFeedbackRequests] = useState([]);
//   const [othersFeedbackContext, setOthersFeedbackContext] = useState(null);
//   const [isReviewMode, setIsReviewMode] = useState(false);
//   const [selectedSubmission, setSelectedSubmission] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [showResponsesModal, setShowResponsesModal] = useState(false);
//   const [currentResponses, setCurrentResponses] = useState([]);
//   const [currentFormTitle, setCurrentFormTitle] = useState("");
//   const [layoutMode, setLayoutMode] = useState("one");
//   const [activeFrom, setActiveFrom] = useState("");
//   const [activeTo, setActiveTo] = useState("");
//   const [formType, setFormType] = useState("employee_only");
//   const [hasSupervisorFeedback, setHasSupervisorFeedback] = useState(false);
//   const [supervisorLabel, setSupervisorLabel] = useState("");
//   const [supervisorType, setSupervisorType] = useState("text");
//   const [supervisorRequired, setSupervisorRequired] = useState(false);
//   const [supervisorVisibleToEmployee, setSupervisorVisibleToEmployee] = useState(true);
//   const [supervisorOptionsInput, setSupervisorOptionsInput] = useState("");
//   const [employees, setEmployees] = useState([]);
//   const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
//   const [showAssignSection, setShowAssignSection] = useState(false);
//   const [isSupervisor, setIsSupervisor] = useState(false);
//   const [myTeamEmployeeIds, setMyTeamEmployeeIds] = useState([]);
//   const [hasSubmitted, setHasSubmitted] = useState(false);
//   const [submissionData, setSubmissionData] = useState(null);
//   const [viewingSubmission, setViewingSubmission] = useState(false);
//   const [activeTab, setActiveTab] = useState("self");
//   const [alreadyAssignedIds, setAlreadyAssignedIds] = useState([]);
//   const [expandedResponses, setExpandedResponses] = useState(new Set());
//   const [searchTerm, setSearchTerm] = useState("");
//   const [supervisorFieldsList, setSupervisorFieldsList] = useState([]); // multiple supervisor fields
// const [editingSupervisorIndex, setEditingSupervisorIndex] = useState(null);
// const [supervisorPlaceholder, setSupervisorPlaceholder] = useState("");
// const [isDraft, setIsDraft] = useState(false);
// const [draftId, setDraftId] = useState(null); // to track draft record if needed

// const [fieldReferenceFile, setFieldReferenceFile] = useState(null);
// const [fieldNeedsOthersFeedback, setFieldNeedsOthersFeedback] = useState(false);
// const [fillSectionTab, setFillSectionTab] = useState("main");
// const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
// const [submittedFeedbackData, setSubmittedFeedbackData] = useState(null);

// const isFormActive = (from, to) => {
//   if (!from && !to) return true;

//   const now = new Date();

//   // Normalize dates to start/end of day in local time (IST)
//   const normalizeToStartOfDay = (dateStr) => {
//     if (!dateStr) return null;
//     const d = new Date(dateStr);
//     d.setHours(0, 0, 0, 0);
//     return d;
//   };

//   const normalizeToEndOfDay = (dateStr) => {
//     if (!dateStr) return null;
//     const d = new Date(dateStr);
//     d.setHours(23, 59, 59, 999);
//     return d;
//   };

//   const fromDate = normalizeToStartOfDay(from);
//   const toDate = normalizeToEndOfDay(to);

//   // Case 1: Both from and to are set
//   if (fromDate && toDate) {
//     return now >= fromDate && now <= toDate;
//   }

//   // Case 2: Only from is set (active from that day onwards)
//   if (fromDate) {
//     return now >= fromDate;
//   }

//   // Case 3: Only to is set (active until that day)
//   if (toDate) {
//     return now <= toDate;
//   }

//   return true;
// };
//   // Alert Modal State
//   const [alertModal, setAlertModal] = useState({
//     isVisible: false,
//     title: "",
//     message: "",
//     type: "info",
//   });
//   const showAlert = (message, title = "", type = "info") => {
//     setAlertModal({
//       isVisible: true,
//       title: title || (type === "success" ? "Success" : type === "error" ? "Error" : ""),
//       message,
//       type,
//     });
//   };
//   const closeAlert = () => {
//     setAlertModal({ isVisible: false, title: "", message: "", type: "info" });
//   };
//   const normalizeDateForInput = (value) => {
//     if (!value) return "";
//     if (value instanceof Date) return value.toISOString().slice(0, 10);
//     if (typeof value !== "string") return "";
//     return value.split("T")[0].split(" ")[0];
//   };
//   // ==================== COMPUTED FILTERED EMPLOYEES ====================
// const filteredEmployees = React.useMemo(() => {
//   if (!searchTerm.trim()) return employees;

//   const searchLower = searchTerm.toLowerCase().trim();

//   return employees.filter((emp) => {
//     const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`
//       .trim()
//       .toLowerCase();
    
//     const empId = String(emp.employee_id || emp.id || "").toLowerCase();

//     return fullName.includes(searchLower) || empId.includes(searchLower);
//   });
// }, [employees, searchTerm]);
//  const toTitleCase = (str) => {
//   if (!str) return "";
//   return str
//     .toLowerCase()
//     .split(" ")
//     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(" ");
// };
//   // ─── Role Checks ─────────────────────────────────────────────
//   const normalizedRole = (user?.role || user?.raw?.role || "").toString().toLowerCase();
//   const isAdmin = Boolean(
//     normalizedRole === "admin" ||
//     normalizedRole === "superadmin" ||
//     user?.isAdmin === true ||
//     user?.raw?.isAdmin === true
//   );
//   const isHR = normalizedRole === "hr";
//   const canBuildForms = isAdmin || isHR;
//   const canSeeAllTab = isAdmin || isHR;
//   // ─── Effects ────────────────────────────────────────────────
//   useEffect(() => {
//     if (!orgId || !currentEmployeeId) return;
//     const checkSupervisorStatus = async () => {
//       try {
//         let team = [];
//         const res = await fetch(`${BACKEND_URL}/api/supervisor/employees`, {
//           method: "GET",
//           credentials: "include",
//           headers: getHeaders(),
//         });
//         if (res.ok) {
//           const json = await res.json();
//           team = json.employees || json.data || json || [];
//         } else {
//           const fallback = await fetch(`${BACKEND_URL}/api/employees`, {
//             method: "GET",
//             credentials: "include",
//             headers: getHeaders(),
//           });
//           if (fallback.ok) {
//             const all = await fallback.json();
//             const data = all.data || all.employees || all || [];
//             team = (Array.isArray(data) ? data : []).filter(
//               (emp) => String(emp.supervisor_id || emp.supervisorId || "") === String(currentEmployeeId)
//             );
//           }
//         }
//         const teamIds = (Array.isArray(team) ? team : [])
//           .map((emp) => String(emp.employee_id || emp.id))
//           .filter(Boolean);
//         setMyTeamEmployeeIds(teamIds);
//         setIsSupervisor(teamIds.length > 0);
//       } catch (err) {
//         console.error("Team fetch failed:", err);
//         setIsSupervisor(false);
//         setMyTeamEmployeeIds([]);
//       }
//     };
//     checkSupervisorStatus();
//   }, [orgId, currentEmployeeId, BACKEND_URL]);
// // Set default tab for Admin (only All Forms)
// useEffect(() => {
//   if (isAdmin && !isHR) {
//     setActiveTab("all");
//   }
// }, [isAdmin, isHR]);

// const formatSubmittedTime = (dateString) => {
//   if (!dateString) return "—";

//   const date = new Date(dateString);

//   // Force IST (Asia/Kolkata)
//   return date.toLocaleString('en-IN', {
//     timeZone: 'Asia/Kolkata',
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: true,
//   });
// };
// const fetchTeamSubmissions = async () => {
//   if (!isSupervisor || myTeamEmployeeIds.length === 0) {
//     console.log("🚫 Skipping team fetch: Not supervisor or no team members");
//     setTeamSubmissions([]);
//     return;
//   }

//   console.log("📡 Fetching team submissions for", myTeamEmployeeIds.length, "employees...");

//   try {
//     const res = await fetch(`${BACKEND_URL}/api/forms/team-submissions`, {
//       method: "GET",
//       credentials: "include",
//       headers: getHeaders(),
//       cache: 'no-store',
//     });

//     if (!res.ok) {
//       console.error("❌ Team API failed:", res.status);
//       setTeamSubmissions([]);
//       return;
//     }

//     const json = await res.json();
//     let submissions = Array.isArray(json) ? json :
//                      json.data || json.submissions || json.responses || [];

//     console.log(`✅ Received ${submissions.length} team submissions from backend`);

//     // 🔥 FILTER 1: Only employee_supervisor forms
//     // 🔥 FILTER 2: Only employees under this supervisor
//     submissions = submissions.filter(sub => {
//       const empId = String(sub.employee_id || sub.employeeId || "");
//       return (
//         (sub.form_type === 'employee_supervisor' || !sub.form_type) &&
//         myTeamEmployeeIds.includes(empId)
//       );
//     });

//     console.log(`✅ After filtering: ${submissions.length} relevant submissions`);
//     setTeamSubmissions(submissions);

//   } catch (err) {
//     console.error("❌ Team submissions fetch error:", err);
//     setTeamSubmissions([]);
//   }
// };
// // Add this useEffect near your other effects
// useEffect(() => {
//   if (!orgId) return;

//   const fetchEmployees = async () => {
//     try {
//       const res = await fetch(`${BACKEND_URL}/api/employees`, {
//         method: "GET",
//         credentials: "include",
//         headers: getHeaders(),
//       });

//       if (res.ok) {
//         const json = await res.json();
//         const empList = Array.isArray(json) 
//           ? json 
//           : json.data || json.employees || json || [];
        
//         setEmployees(empList);
//       } else {
//         console.error("Failed to fetch employees:", res.status);
//         setEmployees([]);
//       }
//     } catch (err) {
//       console.error("Error fetching employees:", err);
//       setEmployees([]);
//     }
//   };

//   fetchEmployees();
// }, [orgId, BACKEND_URL]);   // Add any other deps if needed (e.g. currentEmployeeId)
//  // Improved data fetching with proper dependencies
// useEffect(() => {
//   if (!orgId) return;
//   // fetch feedback requests for current user
//   const fetchFeedbackRequests = async () => {
//     try {
//       const res = await fetch(`${BACKEND_URL}/api/forms/feedback-requests`, {
//         method: 'GET',
//         credentials: 'include',
//         headers: getHeaders(),
//       });
//       if (!res.ok) throw new Error('Failed to fetch feedback requests');
//       const json = await res.json();
//       setFeedbackRequests(json.data || []);
//     } catch (err) {
//       console.error('Failed to fetch feedback requests:', err);
//       setFeedbackRequests([]);
//     }
//   };

//   fetchForms();
//   fetchSelfForms();

//   if (isSupervisor || isHR) {
//     fetchTeamSubmissions();
//   }
//   fetchFeedbackRequests();
// }, [orgId, currentEmployeeId, isSupervisor, isHR]);   // Removed canBuildForms to avoid unnecessary re-renders
// // Refetch team submissions when coming back from review mode
// useEffect(() => {
//   if (!fillMode && !viewMode && isSupervisor) {
//     fetchTeamSubmissions();
//   }
// }, [fillMode, viewMode, isSupervisor]);
//   const fetchForms = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await fetch(`${BACKEND_URL}/api/forms`, {
//         method: "GET",
//         credentials: "include",
//         headers: getHeaders(),
//       });
//       if (!res.ok) throw new Error("Failed to load forms");
//       const json = await res.json();
//       setTemplates(getFormListFromResponse(json));
//     } catch (err) {
//       console.error(err);
//       setError("Failed to load forms");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const fetchSelfForms = async () => {
//     try {
//       const res = await fetch(`${BACKEND_URL}/api/forms/assigned`, {
//         method: "GET",
//         credentials: "include",
//         headers: getHeaders(),
//       });
//       if (res.ok) {
//         const json = await res.json();
//         setSelfForms(getFormListFromResponse(json));
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };
//   const getFormListFromResponse = (json) => {
//     if (!json) return [];
//     if (Array.isArray(json)) return json;
//     if (Array.isArray(json.data)) return json.data;
//     if (Array.isArray(json.forms)) return json.forms;
//     return [];
//   };

//   const hasOthersFeedbackField = (template) => {
//     if (!template) return false;
//     let formJson = template.form_json || [];
//     if (typeof formJson === "string") {
//       try {
//         formJson = JSON.parse(formJson);
//       } catch (e) {
//         formJson = [];
//       }
//     }
//     return Array.isArray(formJson) && formJson.some((f) => f.employee?.needsOthersFeedback === true);
//   };

//   const otherForms = selfForms.filter(hasOthersFeedbackField);
//   // Load already assigned employees when form is being edited
// // Fetch already assigned employees when editing a form
// useEffect(() => {
//   if (!editingId) {
//     setAlreadyAssignedIds([]);
//     return;
//   }
// // Filtered employees based on search
// const filteredEmployees = employees.filter((emp) => {
//   if (!searchTerm) return true;
  
//   const searchLower = searchTerm.toLowerCase().trim();
//   const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`.toLowerCase();
//   const empId = String(emp.employee_id || emp.id || "").toLowerCase();

//   return fullName.includes(searchLower) || empId.includes(searchLower);
// });
//   const fetchAlreadyAssigned = async () => {
//     try {
//       console.log(`🔍 Fetching assigned employees for form ID: ${editingId}`);
      
//       const res = await fetch(`${BACKEND_URL}/api/forms/${editingId}/assigned`, {
//         method: "GET",
//         credentials: "include",
//         headers: getHeaders(),
//       });

//       console.log(`📡 Response status: ${res.status}`);

//       if (res.ok) {
//         const json = await res.json();
//         console.log("📦 Raw response from /assigned:", json);

//         const assignedData = json.data || json.assigned || json.employeeIds || json || [];
//         const ids = assignedData.map((item) =>
//           String(item.employee_id || item.id || item.employeeId)
//         ).filter(Boolean);

//         console.log("✅ Final Already Assigned IDs:", ids);
//         setAlreadyAssignedIds(ids);
//       } else {
//         const errorText = await res.text();
//         console.log("❌ API Error:", errorText);
//         setAlreadyAssignedIds([]);
//       }
//     } catch (err) {
//       console.error("🚨 Fetch error:", err);
//       setAlreadyAssignedIds([]);
//     }
//   };

//   fetchAlreadyAssigned();
// }, [editingId, BACKEND_URL]);  // Important: re-run when editingId changes
//   // ==================== ALL ORIGINAL FUNCTIONS ====================
//   useEffect(() => {
//     const needsOptions = ["select", "radio", "checkbox-group"].includes(fieldType);
//     setShowOptions(needsOptions);
//     if (!needsOptions) setOptionsInput("");
//   }, [fieldType]);
//  useEffect(() => {
//   if (editingFieldId) {
//     const field = fields.find((f) => f.id === editingFieldId);
//     if (field) {
//       // === Employee Field Settings ===
//       setFieldLabel(field.employee.label || "");
//       setFieldType(field.employee.type || "text");
//       setFieldRequired(field.employee.required || false);
//       setFieldPlaceholder(field.employee.placeholder || "");

//       if (field.employee.options && Array.isArray(field.employee.options)) {
//         setOptionsInput(field.employee.options.map((o) => o.label).join(", "));
//       } else {
//         setOptionsInput("");
//       }

//       setFieldNeedsOthersFeedback(field.employee?.needsOthersFeedback === true);

//       // === Supervisor Fields Handling (Multiple Support) ===
//       if (field.supervisorFields && Array.isArray(field.supervisorFields) && field.supervisorFields.length > 0) {
//         setHasSupervisorFeedback(true);
//         setSupervisorFieldsList([...field.supervisorFields]);   // Load all supervisor fields
//       } 
//       // Backward compatibility for old single supervisor field
//       else if (field.supervisor) {
//         setHasSupervisorFeedback(true);
//         setSupervisorFieldsList([{
//           ...field.supervisor,
//           id: field.supervisor.id || Date.now().toString() + "_sup"
//         }]);
//       } 
//       else {
//         setHasSupervisorFeedback(false);
//         setSupervisorFieldsList([]);
//       }

//       // Reset supervisor input fields when editing starts
//       setSupervisorLabel("");
//       setSupervisorType("text");
//       setSupervisorRequired(false);
//       setSupervisorVisibleToEmployee(true);
//       setSupervisorOptionsInput("");
//       setEditingSupervisorIndex(null);
//     }
//   } else {
//     // Reset when not editing
//     setSupervisorFieldsList([]);
//     setHasSupervisorFeedback(false);
//   }
// }, [editingFieldId, fields]);

//   // Debug Info
//   useEffect(() => {
//     console.log("=== DEBUG INFO ===");
//     console.log("isSupervisor:", isSupervisor);
//     console.log("myTeamEmployeeIds:", myTeamEmployeeIds);
//     console.log("canBuildForms:", canBuildForms);
//     console.log("activeTab:", activeTab);
//     console.log("teamSubmissions length:", teamSubmissions.length);
//     console.log("teamSubmissions:", teamSubmissions);
//   }, [isSupervisor, myTeamEmployeeIds, canBuildForms, activeTab, teamSubmissions]);
// const toggleResponse = (index) => {
//   setExpandedResponses((prev) => {
//     const newSet = new Set(prev);
//     if (newSet.has(index)) {
//       newSet.delete(index);
//     } else {
//       newSet.add(index);
//     }
//     return newSet;
//   });
// };  

// // const addOrUpdateField = () => {
// //       const trimmed = fieldLabel.trim();
// //       if (!trimmed) {
// //         showAlert("Field label is required.");
// //         return;
// //       }

// //      let employeeConfig = {
// //   label: trimmed,
// //   type: fieldType,
// //   required: fieldRequired,
// //   placeholder: fieldPlaceholder.trim() || undefined,
// // };

// // // Add this for file type
// // if (fieldType === "file") {
// //   employeeConfig.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
// //   employeeConfig.multiple = false; // change to true if you want multiple files
// // }

// //       if (showOptions) {
// //         const opts = optionsInput
// //           .split(",")
// //           .map((o) => o.trim())
// //           .filter(Boolean)
// //           .map((label) => ({ label, value: label.toLowerCase().replace(/\s+/g, "-") }));

// //         if (opts.length === 0) {
// //           showAlert("Please provide at least one option for the employee field.");
// //           return;
// //         }
// //         employeeConfig.options = opts;
// //       }

// //       // === Multiple Supervisor Fields ===
// //       let supervisorFields = [];
// //       if (formType === 'employee_supervisor' && hasSupervisorFeedback) {
// //         if (supervisorFieldsList.length === 0) {
// //           showAlert("Please add at least one supervisor feedback field.");
// //           return;
// //         }
// //         supervisorFields = [...supervisorFieldsList];
// //       }

// //       const newField = {
// //         id: editingFieldId || Date.now().toString(),
// //         employee: employeeConfig,
// //         supervisorFields: supervisorFields.length > 0 ? supervisorFields : undefined,
// //       };

// //       if (editingFieldId) {
// //         setFields(fields.map((f) => (f.id === editingFieldId ? newField : f)));
// //       } else {
// //         setFields([...fields, newField]);
// //       }

// //       // Reset everything
// //       setFieldLabel("");
// //       setFieldType("text");
// //       setFieldRequired(false);
// //       setFieldPlaceholder("");
// //       setOptionsInput("");
// //       setHasSupervisorFeedback(false);
// //       setSupervisorFieldsList([]);
// //       setSupervisorLabel("");
// //       setSupervisorType("text");
// //       setSupervisorRequired(false);
// //       setSupervisorVisibleToEmployee(true);
// //       setSupervisorOptionsInput("");
// //       setEditingFieldId(null);
// //     };

// const addOrUpdateField = () => {
//   const trimmed = fieldLabel.trim();
//   if (!trimmed) {
//     showAlert("Field label is required.");
//     return;
//   }

//   let employeeConfig = {
//     label: trimmed,
//     type: fieldType,
//     required: fieldRequired,
//     placeholder: fieldPlaceholder.trim() || undefined,
//     referenceFile: fieldReferenceFile || undefined,
//     ...(fieldNeedsOthersFeedback ? { needsOthersFeedback: true } : {}),
//   };

//   // File specific settings
//   if (fieldType === "file") {
//     employeeConfig.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
//     employeeConfig.multiple = false;
//   }

//   if (showOptions) {
//     const opts = optionsInput
//       .split(",")
//       .map((o) => o.trim())
//       .filter(Boolean)
//       .map((label) => ({ label, value: label.toLowerCase().replace(/\s+/g, "-") }));

//     if (opts.length === 0) {
//       showAlert("Please provide at least one option for the employee field.");
//       return;
//     }
//     employeeConfig.options = opts;
//   }

//   let supervisorFields = [];
//   if (formType === 'employee_supervisor' && hasSupervisorFeedback) {
//     if (supervisorFieldsList.length === 0) {
//       showAlert("Please add at least one supervisor feedback field.");
//       return;
//     }
//     supervisorFields = [...supervisorFieldsList];
//   }

//   const newField = {
//     id: editingFieldId || Date.now().toString(),
//     employee: employeeConfig,
//     supervisorFields: supervisorFields.length > 0 ? supervisorFields : undefined,
//   };

//   if (editingFieldId) {
//     setFields(fields.map((f) => (f.id === editingFieldId ? newField : f)));
//   } else {
//     setFields([...fields, newField]);
//   }

//   // Reset
//   setFieldLabel("");
//   setFieldType("text");
//   setFieldRequired(false);
//   setFieldPlaceholder("");
//   setFieldReferenceFile(null);     // Reset reference file
//   setOptionsInput("");
//   setFieldNeedsOthersFeedback(false);
//   setHasSupervisorFeedback(false);
//   setSupervisorFieldsList([]);
//   setSupervisorLabel("");
//   setSupervisorType("text");
//   setSupervisorRequired(false);
//   setSupervisorVisibleToEmployee(true);
//   setSupervisorOptionsInput("");
//   setEditingFieldId(null);
// };
//   const deleteField = (id) => {
//     setFields(fields.filter((f) => f.id !== id));
//     if (editingFieldId === id) setEditingFieldId(null);
//   };
//   const editField = (id) => setEditingFieldId(id);
//   const saveTemplate = async () => {
//   // Validation - Show only in popup modal
//   if (!formName.trim()) {
//     showAlert("Please enter a Form Name.",  );
//     return;
//   }

//   if (fields.length === 0) {
//     showAlert("Please add at least one field to the form before creating it.", );
//     return;
//   }

// if (formType === 'employee_supervisor' && !fields.some(f => f.supervisorFields && f.supervisorFields.length > 0)) {    showAlert("For Employee + Supervisor form, please add at least one field with supervisor feedback.",  );
//     return;
//   }

//   setLoading(true);
//   setError(null);   // Clear any old error

//   try {
//     const method = editingId ? "PUT" : "POST";
//     const url = editingId
//       ? `${BACKEND_URL}/api/forms/${editingId}`
//       : `${BACKEND_URL}/api/forms`;

//     const referenceFiles = [];
//     const formJsonForSave = fields.map((field) => {
//       const fieldKey = field.id || field.fieldId || "";
//       const cloned = { ...field };

//       const maybeAddFile = (file, location) => {
//         if (!(file instanceof File) || !fieldKey) return;
//         referenceFiles.push({ fieldKey, file });
//         if (location === "top") {
//           cloned.referenceFile = { name: file.name };
//         } else if (location === "employee") {
//           cloned.employee = { ...cloned.employee, referenceFile: { name: file.name } };
//         } else if (location === "supervisor") {
//           cloned.supervisor = { ...cloned.supervisor, referenceFile: { name: file.name } };
//         }
//       };

//       maybeAddFile(field.referenceFile, "top");
//       maybeAddFile(field.employee?.referenceFile, "employee");
//       maybeAddFile(field.supervisor?.referenceFile, "supervisor");

//       return cloned;
//     });

//     const requestOptions = {
//       method,
//       credentials: "include",
//       headers: {},
//     };

//     if (referenceFiles.length > 0) {
//       const formData = new FormData();
//       formData.append("form_name", formName.trim());
//       formData.append("form_json", JSON.stringify(formJsonForSave));
//       formData.append("layout", layoutMode);
//       formData.append("active_from", activeFrom || "");
//       formData.append("active_to", activeTo || "");
//       formData.append("form_type", formType);

//       referenceFiles.forEach(({ fieldKey, file }) => {
//         if (!fieldKey) return;
//         formData.append(`referenceFile_${fieldKey}`, file);
//       });

//       requestOptions.headers = getHeaders({}, true);
//       requestOptions.body = formData;
//     } else {
//       requestOptions.headers = getHeaders();
//       requestOptions.body = JSON.stringify({
//         form_name: formName.trim(),
//         form_json: formJsonForSave,
//         layout: layoutMode,
//         active_from: activeFrom || null,
//         active_to: activeTo || null,
//         form_type: formType,
//       });
//     }

//     const res = await fetch(url, requestOptions);

//     if (!res.ok) throw new Error("Failed to save form");

//     await fetchForms();
//     resetForm();

//     showAlert(
//       editingId ? "Form updated successfully!" : "Form created successfully!", 
//       "Success", 
//       "success"
//     );

//   } catch (err) {
//     console.error(err);
//     showAlert("Failed to save the form. Please try again later.", "Error", "error");
//   } finally {
//     setLoading(false);
//   }
// };
  
//   const resetForm = () => {
//     setFormName("");
//     setFields([]);
//     setEditingId(null);
//     setEditingFieldId(null);
//     setFieldLabel("");
//     setFieldType("text");
//     setFieldRequired(false);
//     setFieldPlaceholder("");
//     setOptionsInput("");
//     setLayoutMode("one");
//     setActiveFrom("");
//     setActiveTo("");
//     setFormType("employee_only");
//     setHasSupervisorFeedback(false);
//     setSupervisorLabel("");
//     setSupervisorType("text");
//     setSupervisorRequired(false);
//     setSupervisorVisibleToEmployee(true);
//     setSupervisorOptionsInput("");
//   };
//   const editTemplate = async (template) => {
//     try {
//       setLoading(true);
//       const res = await fetch(`${BACKEND_URL}/api/forms/${template.id}`, {
//         method: "GET",
//         credentials: "include",
//         headers: getHeaders(),
//       });
//       if (!res.ok) throw new Error("Failed to fetch form");
//       const json = await res.json();
//       const form = json.data || json;
//       setFormName(form.form_name);
//       let formJson = form.form_json;
//       if (typeof formJson === 'string') {
//         try {
//           formJson = JSON.parse(formJson);
//         } catch (e) {
//           formJson = [];
//         }
//       }
//       let empFields = [];
//       if (form.form_type === 'employee_supervisor') {
//         if (formJson?.employeeFields && Array.isArray(formJson.employeeFields)) {
//           const employeeFields = formJson.employeeFields || [];
//           const supervisorFields = formJson.supervisorFields || [];
//           empFields = employeeFields.map((ef, i) => ({
//             id: ef.id || `emp_${i}`,
//             employee: ef,
//             supervisor: supervisorFields.find(sf => sf.id === ef.id) || undefined
//           }));
//         } else if (Array.isArray(formJson)) {
//           empFields = formJson.map(f => f.employee ? f : { id: f.id, employee: f, supervisor: undefined });
//         }
//       } else {
//         if (Array.isArray(formJson)) {
//           empFields = formJson.map(f => f.employee ? f : { id: f.id, employee: f, supervisor: undefined });
//         }
//       }
//       setFields(empFields);
//       setActiveFrom(normalizeDateForInput(form.active_from));
//       setActiveTo(normalizeDateForInput(form.active_to));
//       setLayoutMode(form.layout || "one");
//       setFormType(form.form_type || "employee_only");
//       setEditingId(form.id);
//       setViewMode(false);
//       setFillMode(false);
//       setIsReviewMode(false);
//       setTeamSubmissions([]);
//       setSelectedSubmission(null);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to load form");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const viewTemplate = async (template) => {
//   try {
//     setLoading(true);
//     const res = await fetch(`${BACKEND_URL}/api/forms/${template.id}`, {
//       method: "GET",
//       credentials: "include",
//       headers: getHeaders(),
//       cache: 'no-store',
//     });
//     if (!res.ok) throw new Error("Failed to fetch form");
    
//     const json = await res.json();
//     let form = json.data || json;

//     if (typeof form.form_json === 'string') {
//       form.form_json = JSON.parse(form.form_json);
//     }

//     setSelectedTemplate(form);
//     setViewMode(true);
//     setFillMode(false);
//     setIsReviewMode(false);
//   } catch (err) {
//     console.error(err);
//     showAlert("Failed to load preview", "Error", "error");
//   } finally {
//     setLoading(false);
//   }
// };
//   // const viewTemplate = async (template) => {
//   //   try {
//   //     setLoading(true);
//   //     const res = await fetch(`${BACKEND_URL}/api/forms/${template.id}`, {
//   //       method: "GET",
//   //       credentials: "include",
//   //       headers: getHeaders(),
//   //     });
//   //     if (!res.ok) throw new Error("Failed to fetch form");
//   //     const json = await res.json();
//   //     let form = json.data || json;
//   //     if (typeof form.form_json === 'string') {
//   //       try {
//   //         form.form_json = JSON.parse(form.form_json);
//   //       } catch (e) {
//   //         form.form_json = [];
//   //       }
//   //     }
//   //     setSelectedTemplate(form);
//   //     setViewMode(true);
//   //     setFillMode(false);
//   //     setIsReviewMode(false);
//   //   } catch (err) {
//   //     console.error(err);
//   //     setError("Failed to load form");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };
// //  const fillTemplate = async (template) => {
// //   try {
// //     setLoading(true);
// //     setError(null);

// //     const res = await fetch(`${BACKEND_URL}/api/forms/${template.id}`, {
// //       method: "GET",
// //       credentials: "include",
// //       headers: getHeaders(),
// //     });

// //     if (!res.ok) throw new Error("Failed to load form");

// //     const json = await res.json();
// //     let form = json.data || json;

// //     if (typeof form.form_json === 'string') {
// //       try {
// //         form.form_json = JSON.parse(form.form_json);
// //       } catch (e) {
// //         form.form_json = [];
// //       }
// //     }

// //     // ==================== CRITICAL FIX ====================
// //     // Use dates from the template list (card) if backend doesn't return them
// //     if (!form.active_from && template.active_from) {
// //       form.active_from = template.active_from;
// //     }
// //     if (!form.active_to && template.active_to) {
// //       form.active_to = template.active_to;
// //     }

// //     console.log("=== FILL TEMPLATE DATE FIX ===");
// //     console.log("Template (card) dates:", {
// //       active_from: template.active_from,
// //       active_to: template.active_to
// //     });
// //     console.log("Form (fetched) dates:", {
// //       active_from: form.active_from,
// //       active_to: form.active_to
// //     });

// //     const isCurrentlyActive = isFormActive(form.active_from, form.active_to);

// //     if (!isCurrentlyActive) {
// //       showAlert(
// //         `This form is not active at this time.\n\nActive From: ${form.active_from || "Not Set"}\nActive To: ${form.active_to || "Not Set"}`,
// //         "Form Not Active",
// //         "warning"
// //       );
// //       setSelectedTemplate(null);
// //       setFillMode(false);
// //       return;
// //     }

// //     setSelectedTemplate(form);
// //     setViewMode(false);
// //     setFillMode(true);
// //     setFormData({});
// //     setIsReviewMode(false);
// //     setHasSubmitted(false);
// //     setSubmissionData(null);
// //     setViewingSubmission(false);

// //     // Check if user already submitted
// //     const responseRes = await fetch(`${BACKEND_URL}/api/forms/${template.id}/responses`, {
// //       method: "GET",
// //       credentials: "include",
// //       headers: getHeaders(),
// //     });

// //     if (responseRes.ok) {
// //       const respJson = await responseRes.json();
// //       let rawResponses = Array.isArray(respJson) ? respJson : respJson.data || respJson.responses || [];
// //       const userSubmission = rawResponses.find(r =>
// //         String(r.employee_id || r.employeeId) === String(currentEmployeeId)
// //       );
// //       if (userSubmission) {
// //         setHasSubmitted(true);
// //         setSubmissionData(userSubmission);
// //       }
// //     }
// //   } catch (err) {
// //     console.error("Fill template error:", err);
// //     showAlert("Failed to load the form. Please try again.", "Error", "error");
// //   } finally {
// //     setLoading(false);
// //   }
// // };

// // const fillTemplate = async (template) => {
// //   try {
// //     setLoading(true);
// //     setError(null);

// //     // 1. Fetch Form Template
// //     const formRes = await fetch(`${BACKEND_URL}/api/forms/${template.id}`, {
// //       method: "GET",
// //       credentials: "include",
// //       headers: getHeaders(),
// //     });

// //     if (!formRes.ok) throw new Error("Failed to load form");

// //     const formJson = await formRes.json();
// //     let form = formJson.data || formJson;

// //     if (typeof form.form_json === 'string') {
// //       try { form.form_json = JSON.parse(form.form_json); } catch (e) { form.form_json = []; }
// //     }

// //     // Date fallback
// //     if (!form.active_from && template.active_from) form.active_from = template.active_from;
// //     if (!form.active_to && template.active_to) form.active_to = template.active_to;

// //     if (!isFormActive(form.active_from, form.active_to)) {
// //       showAlert("This form is not active at this time.", "Form Not Active", "warning");
// //       return;
// //     }

// //     setSelectedTemplate(form);
// //     setViewMode(false);
// //     setFillMode(true);
// //     setIsReviewMode(false);
// //     setViewingSubmission(false);

// //     // 2. LOAD DRAFT OR SUBMITTED RESPONSE
// //     const responseRes = await fetch(`${BACKEND_URL}/api/forms/${template.id}/responses`, {
// //       method: "GET",
// //       credentials: "include",
// //       headers: getHeaders(),
// //     });

// //     if (responseRes.ok) {
// //       const respJson = await responseRes.json();
// //       let rawResponses = Array.isArray(respJson) 
// //         ? respJson 
// //         : respJson.data || respJson.responses || respJson || [];

// //       const userResponse = rawResponses.find(r => 
// //         String(r.employee_id || r.employeeId) === String(currentEmployeeId)
// //       );

// //       if (userResponse?.response_json) {
// //         const data = userResponse.response_json;

// //         setFormData(data);
// //         setSubmissionData(userResponse);

// //         const isSubmitted = userResponse.status === 'submitted' || 
// //                            data.__is_draft === false;

// //         setHasSubmitted(isSubmitted);
// //         setIsDraft(!isSubmitted);

// //         console.log("✅ Loaded Draft:", !isSubmitted, "Data keys:", Object.keys(data));
// //       } else {
// //         setFormData({});
// //         setHasSubmitted(false);
// //         setIsDraft(false);
// //       }
// //     }

// //   } catch (err) {
// //     console.error("Fill template error:", err);
// //     showAlert("Failed to load form data", "Error", "error");
// //   } finally {
// //     setLoading(false);
// //   }
// // };
// const fillTemplate = async (template) => {
//   try {
//     setLoading(true);
//     setError(null);

//     // 🔥 ALWAYS FETCH THE LATEST FORM VERSION FROM BACKEND
//     const formRes = await fetch(`${BACKEND_URL}/api/forms/${template.id}`, {
//       method: "GET",
//       credentials: "include",
//       headers: getHeaders(),
//       cache: 'no-store',           // Important: Don't use browser cache
//     });

//     if (!formRes.ok) throw new Error("Failed to load latest form");

//     const formJson = await formRes.json();
//     let form = formJson.data || formJson;

//     // Parse form_json if it's string
//     if (typeof form.form_json === 'string') {
//       try { 
//         form.form_json = JSON.parse(form.form_json); 
//       } catch (e) { 
//         form.form_json = []; 
//       }
//     }

//     setSelectedTemplate(form);
//     setViewMode(false);
//     setFillMode(true);
//     setIsReviewMode(false);
//     setViewingSubmission(false);
//     setFormData({});
//     // Do NOT reset feedbackSubmitted and submittedFeedbackData to keep feedback visible

//     if (!template.openOthersFeedbackMode) {
//       setOthersFeedbackContext(null);
//     }

//     // Load user's previous response / draft
//     const responseRes = await fetch(`${BACKEND_URL}/api/forms/${template.id}/responses`, {
//       method: "GET",
//       credentials: "include",
//       headers: getHeaders(),
//     });

//     if (responseRes.ok) {
//       const respJson = await responseRes.json();
//       let rawResponses = Array.isArray(respJson) 
//         ? respJson 
//         : respJson.data || respJson.responses || [];

//       setFormResponses(rawResponses || []);

//       const userResponse = rawResponses.find(r => 
//         String(r.employee_id || r.employeeId) === String(currentEmployeeId)
//       );

//       if (userResponse?.response_json) {
//         setFormData(userResponse.response_json);
//         setSubmissionData(userResponse);


//       // If opened in 'others feedback' mode, load the requester's response from backend
//       if (template.openOthersFeedbackMode && othersFeedbackContext?.requesterEmployeeId) {
//         const requesterId = String(othersFeedbackContext.requesterEmployeeId);
//         const requesterResponse = rawResponses.find(r => String(r.employee_id || r.employeeId) === requesterId);
//         if (requesterResponse && requesterResponse.response_json) {
//           // Show the requester's response JSON so the recipient can see context
//           setFormData(requesterResponse.response_json || {});
//           setSubmissionData(requesterResponse);

//           // Extract any existing feedback left for the current recipient
//           try {
//             const baseField = othersFeedbackContext.fieldId;
//             const feedbackKey = `${baseField}_others_feedback_from_${currentEmployeeId}`;
//             const existing = (requesterResponse.response_json && requesterResponse.response_json[feedbackKey]) || null;
//             if (existing !== undefined && existing !== null && String(existing).trim() !== "") {
//               setSubmittedFeedbackData({
//                 feedbackText: existing,
//                 requesterName: othersFeedbackContext.requesterName || "Unknown",
//                 timestamp: requesterResponse.submitted_at || requesterResponse.__submitted_at || new Date().toLocaleString()
//               });
//               setFeedbackSubmitted(true);
//             }
//           } catch (e) {
//             // ignore
//           }
//         }
//       }
//         // Check if form is a draft - if __is_draft is true, it's always a draft
//         const isDraft = userResponse.response_json.__is_draft === true;
//         const isSubmitted = !isDraft;

//         setHasSubmitted(isSubmitted);
//         setIsDraft(isDraft);
//       } else {
//         setHasSubmitted(false);
//         setIsDraft(false);
//       }
//     }

//   } catch (err) {
//     console.error("Fill template error:", err);
//     showAlert("Failed to load the latest form version. Please try again.", "Error", "error");
//   } finally {
//     setLoading(false);
//   }
// };

// const formatRequesterDisplay = (requesterId, requesterFirstName, requesterLastName) => {
//   const requesterName = `${requesterFirstName || ''} ${requesterLastName || ''}`.trim();
//   if (requesterId && requesterName) {
//     return `${requesterId} — ${requesterName}`;
//   }
//   if (requesterName) {
//     return requesterName;
//   }
//   return requesterId || "Unknown requester";
// };

// // Open a form as a recipient to provide "others" feedback for a specific requester
// const openOthersFeedback = (req) => {
//   try {
//     if (!req || !req.form_id) return;
//     const requesterName = formatRequesterDisplay(req.requester_id, req.requester_first_name, req.requester_last_name);
//     const fieldId = req.fieldId || `${req.form_id}_others_feedback`;
//     setOthersFeedbackContext({ 
//       requesterEmployeeId: req.requester_id,
//       requesterName,
//       fieldId,
//       fieldLabel: req.fieldLabel || "Requested Feedback",
//       requestContext: req.requestContext || req.fieldValue || null,
//       requestReason: req.requestReason || null,
//       feedbackKey: `${fieldId}_others_feedback_from_${req.requester_id}`,
//       sourceLabel: req.sourceLabel || 'Requested Feedback',
//     });
//     // Open the form in fill mode using special feedback mode
//     // schedule fillTemplate on next tick so state (othersFeedbackContext) is applied
//     setTimeout(() => fillTemplate({ id: req.form_id, form_name: req.form_name, openOthersFeedbackMode: true }), 0);
//   } catch (err) {
//     console.error('openOthersFeedback error:', err);
//   }
// };

// const saveDraft = async (e) => {
//   e?.preventDefault();
//   e?.stopPropagation();
//   if (!selectedTemplate?.id) return;
//   return submitFormWithFiles(true);
// };
// const handleSelectSubmission = async (submission) => {
//   console.log("Selected submission:", submission);

//   setSelectedSubmission(submission);
//   setFormData(submission.response_json || {});

//   setIsReviewMode(true);
//   setFillMode(true);
//   // Do NOT reset feedbackSubmitted and submittedFeedbackData to keep feedback visible

//   // Fetch the actual form template
//   const formId = submission.form_id || submission.formId || submission.template_id;
//   if (formId) {
//     try {
//       setLoading(true);
//       const res = await fetch(`${BACKEND_URL}/api/forms/${formId}`, {
//         method: "GET",
//         credentials: "include",
//         headers: getHeaders(),
//       });

//       if (res.ok) {
//         const json = await res.json();
//         let form = json.data || json;

//         if (typeof form.form_json === 'string') {
//           try { form.form_json = JSON.parse(form.form_json); } catch (e) { form.form_json = []; }
//         }

//         setSelectedTemplate(form);
//       }
//     } catch (err) {
//       console.error("Failed to load form for review", err);
//     } finally {
//       setLoading(false);
//     }
//   }
// };
//   const handleInputChange = (fieldId, value) => {
//     setFormData((prev) => ({ ...prev, [fieldId]: value }));
//   };
//   const validateForm = () => {
//     let isValid = true;
//     const errors = [];
//     let fieldsToValidate = [];
//     let formJson = selectedTemplate.form_json || [];
//     if (typeof formJson === 'string') {
//       try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
//     }
//     if (selectedTemplate.form_type === 'employee_supervisor') {
//       formJson.forEach(f => {
//         if (!f.employee) return;
//         fieldsToValidate.push({ ...f.employee, fieldId: f.id, isSupervisor: false });
//         if (isReviewMode && f.supervisor) {
//           fieldsToValidate.push({ ...f.supervisor, fieldId: f.id + '_sup', isSupervisor: true });
//         }
//       });
//     } else {
//       formJson.forEach(f => {
//         const field = f.employee || f;
//         fieldsToValidate.push({ ...field, fieldId: f.id || field.id, isSupervisor: false });
//       });
//     }
//     fieldsToValidate.forEach(field => {
//       const fieldId = field.fieldId;
//       const value = formData[fieldId];
//       const isSupervisorField = field.isSupervisor;
//       if (isSupervisorField && !isReviewMode) return;
//       const isRequired = field.required === true;
//       if (isRequired) {
//         let hasValue = false;
//         if (value === undefined || value === null || value === "") hasValue = false;
//         else if (Array.isArray(value)) hasValue = value.length > 0;
//         else if (typeof value === "string") hasValue = value.trim() !== "";
//         else hasValue = true;
//         if (!hasValue) {
//           isValid = false;
//           const fieldLabel = field.label || `Field ${fieldId}`;
//           errors.push(`"${fieldLabel}" is required${isSupervisorField ? " (Supervisor)" : ""}`);
//         }
//       }
//     });
//     if (!isValid) {
//       showAlert("Please fill all required fields:\n\n" + errors.join("\n"), "error");
//     }
//     return isValid;
//   };
//   // const submitFilledForm = async () => {
//   //   if (!selectedTemplate?.id) return;
//   //   if (!validateForm()) return;
//   //   setLoading(true);
//   //   try {
//   //     const responsePayload = {
//   //       ...formData,
//   //       __submitted_by: currentEmployeeId,
//   //       __submitted_at: new Date().toISOString(),
//   //     };
//   //     if (isReviewMode) {
//   //       responsePayload.__reviewed_by = currentEmployeeId;
//   //       responsePayload.__reviewed_employee = selectedSubmission?.employee_id || selectedSubmission?.employeeId || null;
//   //       responsePayload.__is_review = true;
//   //     }
//   //     const res = await fetch(`${BACKEND_URL}/api/forms/${selectedTemplate.id}/submit`, {
//   //       method: "POST",
//   //       credentials: "include",
//   //       headers: getHeaders(),
//   //       body: JSON.stringify({
//   //         response_json: responsePayload,
//   //         isReview: isReviewMode,
//   //         reviewedEmployeeId: selectedSubmission?.employee_id || selectedSubmission?.employeeId,
//   //       }),
//   //     });
//   //     if (!res.ok) {
//   //       const err = await res.json().catch(() => ({}));
//   //       throw new Error(err.message || "Submission failed");
//   //     }
//   //     showAlert(isReviewMode ? "Review submitted successfully!" : "Form submitted successfully!", "Success", "success");
//   //     setHasSubmitted(true);
//   //     setSubmissionData({ response_json: responsePayload });
//   //     setFillMode(false);
//   //     setIsReviewMode(false);
//   //     setTeamSubmissions([]);
//   //     setSelectedSubmission(null);
//   //     setFormData({});
//   //   } catch (err) {
//   //     console.error("Submit error:", err);
//   //     showAlert("Failed to submit: " + err.message, "Error", "error");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };
// //   const submitFilledForm = async () => {
// //   if (!selectedTemplate?.id) return;
// //   if (!validateForm()) return;

// //   setLoading(true);
// //   try {
// //     const responsePayload = {
// //       ...formData,
// //       __submitted_by: currentEmployeeId,
// //       __submitted_at: new Date().toISOString(),
// //       __is_draft: false,
// //     };

// //     const res = await fetch(`${BACKEND_URL}/api/forms/${selectedTemplate.id}/submit`, {
// //       method: "POST",
// //       credentials: "include",
// //       headers: getHeaders(),
// //       body: JSON.stringify({
// //         response_json: responsePayload,
// //         isDraft: false,
// //         isReview: isReviewMode,
// //         reviewedEmployeeId: selectedSubmission?.employee_id || selectedSubmission?.employeeId,
// //       }),
// //     });

// //     if (!res.ok) throw new Error("Submission failed");

// //     showAlert(
// //       isReviewMode ? "Review submitted successfully!" : "Form submitted successfully!", 
// //       "Success", 
// //       "success"
// //     );

// //     setHasSubmitted(true);
// //     setIsDraft(false);
// //     setSubmissionData({ response_json: responsePayload });
// //     setFillMode(false); // or keep open to show success

// //   } catch (err) {
// //     console.error("Submit error:", err);
// //     showAlert("Failed to submit: " + err.message, "Error", "error");
// //   } finally {
// //     setLoading(false);
// //   }
// // };
// // Replace both functions with these:

// const submitFormWithFiles = async (isDraft = false) => {
//   if (!selectedTemplate?.id) return;

//   const isOthersOnlyMode = Boolean(
//     othersFeedbackContext &&
//     othersFeedbackContext.requesterEmployeeId &&
//     !isReviewMode &&
//     !viewingSubmission
//   );

//   if (!isDraft) {
//     if (isOthersOnlyMode) {
//       const feedbackKey = othersFeedbackContext?.feedbackKey;
//       const feedbackValue = formData[feedbackKey];
//       if (feedbackValue === undefined || feedbackValue === null || String(feedbackValue).trim() === "") {
//         showAlert("Please provide feedback before submitting.", "error");
//         return;
//       }
//     } else if (!validateForm()) {
//       return;
//     }
//   }

//   setLoading(true);

//   try {
//     const formDataToSend = new FormData();

//     const responsePayload = {
//       ...formData,
//       __submitted_by: currentEmployeeId,
//       __last_updated: new Date().toISOString(),
//     };

//     if (isDraft) {
//       responsePayload.__is_draft = true;
//       responsePayload.__saved_at = new Date().toISOString();
//       responsePayload.__saved_by = currentEmployeeId;
//     } else {
//       responsePayload.__is_draft = false;
//       responsePayload.__submitted_at = new Date().toISOString();
//     }

//     if (isReviewMode) {
//       responsePayload.__reviewed_by = currentEmployeeId;
//       responsePayload.__reviewed_employee = selectedSubmission?.employee_id || selectedSubmission?.employeeId;
//       responsePayload.__is_review = true;
//     }

//     formDataToSend.append("response_json", JSON.stringify(responsePayload));
//     formDataToSend.append("isDraft", String(isDraft));
//     formDataToSend.append("isReview", String(isReviewMode));

//     if (isReviewMode && selectedSubmission) {
//       formDataToSend.append("reviewedEmployeeId", selectedSubmission.employee_id || selectedSubmission.employeeId);
//     }

//     // Append Files
//     Object.keys(formData).forEach(key => {
//       const value = formData[key];
//       if (value && Array.isArray(value) && value[0] instanceof File) {
//         value.forEach(file => {
//           formDataToSend.append(key, file);
//         });
//       }
//     });

//     const resolvedOrgId = orgId || (typeof window !== "undefined" ? window.__ORG_ID : "") || "unknown";
//     const resolvedEmployeeId = currentEmployeeId || (typeof window !== "undefined" ? window.__EMPLOYEE_ID : "") || "unknown";

//     if (!resolvedOrgId || !resolvedEmployeeId) {
//       throw new Error(
//         "Missing employee or organization ID. Please refresh and login again before submitting."
//       );
//     }

//     // If we are in 'others feedback' context, POST only the feedback entries to the dedicated endpoint
//     if (othersFeedbackContext && othersFeedbackContext.requesterEmployeeId) {
//       const requesterId = String(othersFeedbackContext.requesterEmployeeId);
//       const suffix = `_others_feedback_from_${requesterId}`;
//       const feedbackEntries = {};
//       Object.keys(formData).forEach(k => {
//         if (typeof k === 'string' && k.endsWith(suffix)) {
//           const base = k.replace(new RegExp(suffix + `$`), '');
//           feedbackEntries[base] = formData[k];
//         }
//       });

//       const postBody = {
//         requesterEmployeeId: requesterId,
//         feedbackEntries,
//       };

//       const res = await fetch(`${BACKEND_URL}/api/forms/${selectedTemplate.id}/others-feedback`, {
//         method: 'POST',
//         credentials: 'include',
//         headers: {
//           'Content-Type': 'application/json',
//           'x-api-key': API_KEY || '',
//           'x-org-id': resolvedOrgId,
//           'x-employee-id': resolvedEmployeeId,
//         },
//         body: JSON.stringify(postBody),
//       });

//       if (!res.ok) throw new Error('Feedback submission failed');

//       showAlert('✅ Feedback submitted successfully!', 'Success', 'success');

//       // Refresh the requester's response from backend and extract stored feedback
//       try {
//         const resp = await fetch(`${BACKEND_URL}/api/forms/${selectedTemplate.id}/responses`, {
//           method: 'GET',
//           credentials: 'include',
//           headers: getHeaders(),
//         });
//         if (resp.ok) {
//           const json = await resp.json();
//           const raw = Array.isArray(json) ? json : json.data || json.responses || [];
//           const requesterResp = raw.find(r => String(r.employee_id || r.employeeId) === String(requesterId));
//           if (requesterResp && requesterResp.response_json) {
//             const baseField = othersFeedbackContext.fieldId;
//             const feedbackKeyForRecipient = `${baseField}_others_feedback_from_${resolvedEmployeeId}`;
//             const stored = requesterResp.response_json[feedbackKeyForRecipient];
//             if (stored !== undefined && stored !== null && String(stored).trim() !== "") {
//               setSubmittedFeedbackData({
//                 feedbackText: stored,
//                 requesterName: othersFeedbackContext?.requesterName || "Unknown",
//                 timestamp: requesterResp.submitted_at || requesterResp.__submitted_at || new Date().toLocaleString()
//               });
//               setFeedbackSubmitted(true);
//             }
//             // also update formData to reflect latest requester response
//             setFormData(requesterResp.response_json || {});
//             setSubmissionData(requesterResp);
//           }
//         }
//       } catch (e) {
//         // ignore
//       }
      
//       // Keep fillMode true to show the card, don't clear context yet
//       // setOthersFeedbackContext(null);
//       // setFillMode(false);

//       // Mark the current feedback request as responded but keep it visible
//       try {
//         setFeedbackRequests(prev => (prev || []).map(r => {
//           const matchesForm = String(r.form_id || r.formId) === String(selectedTemplate?.id);
//           const matchesRequester = String(r.requester_id || r.requesterId) === String(othersFeedbackContext?.requesterEmployeeId);
//           const matchesField = String(r.fieldId || r.field_id || r.field) === String(othersFeedbackContext?.fieldId);
//           if (matchesForm && matchesRequester && matchesField) {
//             return {
//               ...r,
//               respondedByCurrent: true,
//               respondedAt: new Date().toISOString(),
//             };
//           }
//           return r;
//         }));
//       } catch (e) {
//         // ignore
//       }

//       return;
//     }

//     const res = await fetch(`${BACKEND_URL}/api/forms/${selectedTemplate.id}/submit`, {
//       method: "POST",
//       credentials: "include",
//       headers: {
//         "x-api-key": API_KEY || "",
//         "x-org-id": resolvedOrgId,
//         "x-employee-id": resolvedEmployeeId,
//       },
//       body: formDataToSend,
//     });

//     if (!res.ok) throw new Error("Submission failed");

//     showAlert(
//       isDraft ? "✅ Draft saved successfully! You can continue later." : 
//       isReviewMode ? "Review submitted successfully!" : "✅ Form submitted successfully!", 
//       "Success", 
//       "success"
//     );

//     setHasSubmitted(!isDraft);
//     setIsDraft(isDraft);

//     if (!isDraft) {
//       setFillMode(false);
//     }

//   } catch (err) {
//     console.error("Submit error:", err);
//     showAlert("Failed to submit: " + err.message, "Error", "error");
//   } finally {
//     setLoading(false);
//   }
// };


// const submitFilledForm = () => submitFormWithFiles(false);
//  const addOrUpdateSupervisorField = () => {
//   if (!supervisorLabel.trim()) {
//     showAlert("Supervisor field label is required");
//     return;
//   }

//   const newSupField = {
//     id: Date.now().toString() + "_sup",
//     label: supervisorLabel.trim(),
//     type: supervisorType,
//     required: supervisorRequired,
//     visibleToEmployee: supervisorVisibleToEmployee,
//     placeholder: supervisorPlaceholder.trim() || undefined,   // ← ADD THIS LINE
//   };

//   // Options for radio / checkbox-group
//   if ((supervisorType === 'radio' || supervisorType === 'checkbox-group') && supervisorOptionsInput.trim()) {
//     newSupField.options = supervisorOptionsInput
//       .split(",")
//       .map(o => o.trim())
//       .filter(Boolean)
//       .map(label => ({
//         label,
//         value: label.toLowerCase().replace(/\s+/g, "-")
//       }));
//   }
// if (supervisorType === "file") {
//   newSupField.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
//   newSupField.multiple = false;
// }
//   if (editingSupervisorIndex !== null) {
//     const updated = [...supervisorFieldsList];
//     updated[editingSupervisorIndex] = newSupField;
//     setSupervisorFieldsList(updated);
//     setEditingSupervisorIndex(null);
//   } else {
//     setSupervisorFieldsList([...supervisorFieldsList, newSupField]);
//   }

//   // Reset all inputs
//   setSupervisorLabel("");
//   setSupervisorType("text");
//   setSupervisorRequired(false);
//   setSupervisorVisibleToEmployee(true);
//   setSupervisorOptionsInput("");
//   setSupervisorPlaceholder("");   // ← Make sure this exists
// };

// const editSupervisorField = (index) => {
//   const sup = supervisorFieldsList[index];
//   if (!sup) return;

//   setSupervisorLabel(sup.label || "");
//   setSupervisorType(sup.type || "text");
//   setSupervisorRequired(sup.required || false);
//   setSupervisorVisibleToEmployee(sup.visibleToEmployee !== false);
//   setSupervisorOptionsInput(sup.options ? sup.options.map(o => o.label).join(", ") : "");
//   setSupervisorPlaceholder(sup.placeholder || "");   // ← This must be here
//   setEditingSupervisorIndex(index);
// };

// const deleteSupervisorField = (index) => {
//   setSupervisorFieldsList(prev => prev.filter((_, i) => i !== index));
//   if (editingSupervisorIndex === index) setEditingSupervisorIndex(null);
// };
// // ==================== IMPROVED FILE PATH HELPERS ====================

// const normalizeFilePath = (raw) => {
//   console.log("[normalizeFilePath] Input:", raw);
//   if (!raw) return null;

//   if (typeof raw === "string") {
//     let str = raw.replace(/\\/g, "/").trim();
//     if (str.startsWith("http")) return str;
//     // Take only the filename part
//     const result = str.split("/").pop();
//     console.log("[normalizeFilePath] String result:", result);
//     return result;
//   }

//   if (typeof raw === "object") {
//     const result = normalizeFilePath(
//       raw.filename || 
//       raw.originalname || 
//       raw.path || 
//       raw.file_url || 
//       raw.name
//     );
//     console.log("[normalizeFilePath] Object result:", result);
//     return result;
//   }

//   const result = String(raw);
//   console.log("[normalizeFilePath] Default result:", result);
//   return result;
// };

// const getFileUrl = (file) => {
//   console.log("[getFileUrl] Input file:", file);
//   if (!file) return null;

//   // Local file during form fill
//   if (file instanceof File) {
//     console.log("[getFileUrl] Local File object, creating object URL");
//     return URL.createObjectURL(file);
//   }

//   const filename = normalizeFilePath(file);
//   console.log("[getFileUrl] Normalized filename:", filename);
//   if (!filename) {
//     console.warn("[getFileUrl] Could not normalize file path");
//     return null;
//   }

//   if (filename.startsWith("http")) {
//     console.log("[getFileUrl] URL is absolute");
//     return filename;
//   }

//   const base = BACKEND_URL ? BACKEND_URL.replace(/\/+$/, "") : "";
//   const org = orgId || 1;
//   const url = `${base}/api/forms/download/${org}/${encodeURIComponent(filename)}`;
//   console.log("[getFileUrl] Constructed URL:", url);
  
//   return url;
// };
// // 3. Keep the latest viewFile and downloadFile (with headers)
// const viewFile = async (file) => {
//   const url = getFileUrl(file);
//   console.log("[viewFile] URL:", url, "File:", file);
//   if (!url) {
//     showAlert("Cannot generate file URL", "Error", "error");
//     return;
//   }

//   try {
//     const newWindow = window.open("", "_blank");
//     if (!newWindow) {
//       showAlert("Please allow popups", "Warning", "warning");
//       return;
//     }

//     newWindow.document.write(`<h3 style="text-align:center;margin-top:100px;">Loading...</h3>`);

//     const res = await fetch(url, {
//       credentials: "include",
//       headers: getHeaders()
//     });

//     console.log("[viewFile] Fetch response status:", res.status);

//     if (!res.ok) throw new Error(`HTTP ${res.status}`);

//     const blob = await res.blob();
//     console.log("[viewFile] Blob received, size:", blob.size, "Type:", blob.type);
    
//     const blobUrl = URL.createObjectURL(blob);
//     const contentType = res.headers.get("content-type") || blob.type || "";
//     const fileName = file?.originalname || file?.name || file?.filename || "file";

//     if (contentType.includes("pdf")) {
//       newWindow.document.write(`
//         <!DOCTYPE html><html><head><title>${fileName}</title>
//         <style>body,iframe{margin:0;padding:0;width:100%;height:100vh;border:none;}</style></head>
//         <body><iframe src="${blobUrl}"></iframe></body></html>
//       `);
//     } else if (contentType.startsWith("image/")) {
//       newWindow.document.write(`
//         <!DOCTYPE html><html><head><title>${fileName}</title>
//         <style>body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;background:#111;}
//                img{max-width:100%;max-height:100vh;}</style></head>
//         <body><img src="${blobUrl}" alt="${fileName}"/></body></html>
//       `);
//     } else {
//       newWindow.location.href = blobUrl;
//     }

//     newWindow.document.close();
//     setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
//     showAlert("File opened successfully", "Success", "success");
//   } catch (err) {
//     console.error("[viewFile] Error:", err);
//     showAlert("Failed to preview: " + err.message, "Info");
//     const url = getFileUrl(file);
//     if (url) window.open(url, "_blank");
//   }
// };

// const downloadFile = (file, suggestedName = null) => {
//   const url = getFileUrl(file);
//   if (!url) {
//     console.error("[downloadFile] Cannot generate URL for file:", file);
//     showAlert("Cannot download file - invalid file reference", "Error", "error");
//     return;
//   }

//   console.log("[downloadFile] Starting download from URL:", url);
  
//   fetch(url, { credentials: "include", headers: getHeaders() })
//     .then(res => {
//       console.log("[downloadFile] Fetch response status:", res.status);
//       if (!res.ok) {
//         throw new Error(`HTTP ${res.status}: ${res.statusText}`);
//       }
//       return res.blob();
//     })
//     .then(blob => {
//       console.log("[downloadFile] Blob received, size:", blob.size);
//       if (blob.size === 0) {
//         throw new Error("Downloaded file is empty");
//       }
//       const blobUrl = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = blobUrl;
//       a.download = suggestedName || file?.originalname || file?.name || file?.filename || "file";
//       document.body.appendChild(a);
//       console.log("[downloadFile] Triggering download as:", a.download);
//       a.click();
//       document.body.removeChild(a);
//       setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
//       showAlert("File downloaded successfully", "Success", "success");
//     })
//     .catch((err) => {
//       console.error("[downloadFile] Error during download:", err);
//       showAlert(`Download failed: ${err.message}`, "Error", "error");
//       // Fallback: try opening directly
//       console.log("[downloadFile] Attempting fallback - opening URL directly:", url);
//       window.open(url, "_blank");
//     });
// };

// const renderField = (field, isPreview = true, onChange = null) => {
//   const fieldKey = field.fieldId || field.id;
//   const isDisabled = isPreview || field.readOnly || false;

//   const handleChange = (value) => {
//     if (onChange) {
//       onChange(fieldKey, value);
//     } else {
//       handleInputChange(fieldKey, value);
//     }
//   };

//   const currentValue = formData[fieldKey];
// 	const handleKeyDown = (e) => {
// 		if (e.key !== "Enter") return;
// 		// Allow newlines in textarea
// 		if (e.target && e.target.tagName === "TEXTAREA") return;
// 		if (e.shiftKey || e.ctrlKey || e.altKey) return;
// 		try {
// 			e.preventDefault();
// 			const formEl = e.target.closest && e.target.closest('form');
// 			if (!formEl) return;
// 			const focusableSelector = 'input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])';
// 			const focusables = Array.from(formEl.querySelectorAll(focusableSelector)).filter(el => el.offsetParent !== null);
// 			const idx = focusables.indexOf(e.target);
// 			if (idx >= 0 && idx < focusables.length - 1) {
// 				const next = focusables[idx + 1];
// 				next.focus();
// 				if (typeof next.select === 'function') next.select();
// 			}
// 		} catch (err) {
// 			// silent
// 		}
// 	};
//   const feedbackRequestKey = `${fieldKey}_feedback_request_to`;
//   const selectedFeedbackEmployeeId = formData[feedbackRequestKey] || "";
//   const selectedFeedbackEmployee = employees.find(
//     (emp) => String(emp.employee_id || emp.id) === String(selectedFeedbackEmployeeId)
//   );

//   const renderFeedbackRequester = () => {
//     if (!field.needsOthersFeedback || isDisabled) return null;

//     return (
//       <div style={{ marginTop: "16px", padding: "14px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px" }}>
//         <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
//           Select employee for feedback
//         </label>
//         <select
//           className="df-input"
//           value={selectedFeedbackEmployeeId}
//           onChange={(e) => handleInputChange(feedbackRequestKey, e.target.value)}
//         >
//           <option value="">-- Select employee --</option>
//           {employees
//             .filter((emp) => String(emp.employee_id || emp.id) !== String(currentEmployeeId))
//             .map((emp) => {
//               const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`.trim();
//               return (
//                 <option key={emp.employee_id || emp.id} value={emp.employee_id || emp.id}>
//                   {fullName || `Employee ${emp.employee_id || emp.id}`}
//                 </option>
//               );
//             })}
//         </select>
//         {selectedFeedbackEmployeeId && (
//           <small style={{ display: "block", marginTop: "10px", color: "#0f172a" }}>
//             Feedback requested from {selectedFeedbackEmployee ? `${selectedFeedbackEmployee.first_name || ""} ${selectedFeedbackEmployee.last_name || ""}`.trim() : selectedFeedbackEmployeeId}. They will submit their feedback separately.
//           </small>
//         )}
//       </div>
//     );
//   };

//   // Common Reference File Component
//   const ReferenceFile = () => {
//     const referenceFile = field.referenceFile || field.employee?.referenceFile || field.supervisor?.referenceFile;
//     console.log("[ReferenceFile] Component rendered with field:", field, "referenceFile:", referenceFile);
    
//     if (!referenceFile) return null;
    
//     const url = getFileUrl(referenceFile);
//     const fileName = referenceFile.name || referenceFile.originalname || referenceFile.filename || "Reference File";
    
//     console.log("[ReferenceFile] URL:", url, "FileName:", fileName);
    
//     if (!url) {
//       console.warn("[ReferenceFile] No URL generated for reference file:", referenceFile);
//       return null;
//     }
    
//     return (
//       <div style={{
//         margin: "10px 0 12px 0",
//         padding: "12px 14px",
//         background: "#f0f9ff",
//         border: "1px solid #bae6fd",
//         borderRadius: "8px"
//       }}>
//         <strong style={{ color: "#0369a1", display: "block", marginBottom: "6px" }}>
//           📋 Sample Reference:
//         </strong>
//         <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
//           <span>📎 {fileName}</span>
//           {url && (
//             <>
//               <button
//                 type="button"
//                 onClick={() => {
//                   console.log("[ReferenceFile] View button clicked", referenceFile);
//                   viewFile(referenceFile);
//                 }}
//                 style={{ border: "none", background: "transparent", color: "#2563eb", textDecoration: "underline", cursor: "pointer", padding: 0 }}
//               >
//                 View
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   console.log("[ReferenceFile] Download button clicked", referenceFile);
//                   downloadFile(referenceFile, fileName);
//                 }}
//                 style={{ border: "none", background: "transparent", color: "#16a34a", textDecoration: "underline", cursor: "pointer" }}
//               >
//                 Download
//               </button>
//             </>
//           )}
//         </div>
//       </div>
//     );
//   };

//   switch (field.type) {
//     case "text":
//     case "email":
//     case "number":
//       return (
//         <div className="df-form-group">
//           {/* <label>
//             {field.label}
//             {field.required && <span style={{ color: "red" }}> *</span>}
//           </label> */}
//           <ReferenceFile />
//           <input
//             type={field.type}
//             placeholder={field.placeholder || ""}
//             className="df-input"
//             disabled={isDisabled}
//             value={currentValue || ""}
// 						onChange={(e) => handleChange(e.target.value)}
// 						onKeyDown={handleKeyDown}
//             required={field.required && !isDisabled}
//           />
//           {renderFeedbackRequester()}
//         </div>
//       );

//     case "textarea":
//       return (
//         <div className="df-form-group">
//           {/* <label>
//             {field.label}
//             {field.required && <span style={{ color: "red" }}> *</span>}
//           </label> */}
//           <ReferenceFile />
//           <textarea
//             placeholder={field.placeholder || ""}
//             className="df-input"
//             disabled={isDisabled}
//             value={currentValue || ""}
//             onChange={(e) => handleChange(e.target.value)}
//             rows={4}
//             required={field.required && !isDisabled}
//           />
//           {renderFeedbackRequester()}
//         </div>
//       );

//     case "date":
//       return (
//         <div className="df-form-group">
//           {/* <label>
//             {field.label}
//             {field.required && <span style={{ color: "red" }}> *</span>}
//           </label> */}
//           <ReferenceFile />
//           <input
//             type="date"
//             className="df-input"
//             disabled={isDisabled}
//             value={currentValue || ""}
// 						onChange={(e) => handleChange(e.target.value)}
// 						onKeyDown={handleKeyDown}
//             required={field.required && !isDisabled}
//           />
//           {renderFeedbackRequester()}
//         </div>
//       );

//     case "daterange":
//       const rangeValue = currentValue || { start: "", end: "" };
//       return (
//         <div className="df-form-group">
//           {/* <label>
//             {field.label}
//             {field.required && <span style={{ color: "red" }}> *</span>}
//           </label> */}
//           <ReferenceFile />
//           <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
//             <div style={{ flex: 1 }}>
// 							<input type="date" className="df-input" disabled={isDisabled} value={rangeValue.start || ""} onChange={(e) => handleChange({ ...rangeValue, start: e.target.value })} onKeyDown={handleKeyDown} />
//             </div>
//             <div style={{ flex: 1 }}>
// 							<input type="date" className="df-input" disabled={isDisabled} value={rangeValue.end || ""} onChange={(e) => handleChange({ ...rangeValue, end: e.target.value })} onKeyDown={handleKeyDown} />
//             </div>
//           </div>
//           {renderFeedbackRequester()}
//         </div>
//       );

//     case "select":
//       return (
//         <div className="df-form-group">
//           {/* <label>
//             {field.label}
//             {field.required && <span style={{ color: "red" }}> *</span>}
//           </label> */}
//           <ReferenceFile />
// 		  <select className="df-input" disabled={isDisabled} value={currentValue || ""} onChange={(e) => handleChange(e.target.value)} onKeyDown={handleKeyDown}>
//             <option value="">-- Select --</option>
//             {(field.options || []).map((opt, i) => (
//               <option key={i} value={opt.value}>{opt.label}</option>
//             ))}
//           </select>
//           {renderFeedbackRequester()}
//         </div>
//       );

//     case "radio":
//       return (
//         <div className="df-form-group">
//           {/* <label>
//             {field.label}
//             {field.required && <span style={{ color: "red" }}> *</span>}
//           </label> */}
//           <ReferenceFile />
//           <div className="df-radio-group">
//             {(field.options || []).map((opt, index) => (
//               <label key={opt.value ?? index} className="df-radio-label">
//                 <input
//                   type="radio"
//                   name={fieldKey}
//                   value={opt.value ?? opt.label}
//                   checked={String(currentValue) === String(opt.value ?? opt.label)}
//                   disabled={isDisabled}
// 									onChange={(e) => handleChange(e.target.value)}
// 									onKeyDown={handleKeyDown}
//                   required={field.required && !isDisabled}
//                 />
//                 {opt.label ?? opt.value}
//               </label>
//             ))}
//           </div>
//           {renderFeedbackRequester()}
//         </div>
//       );

//     case "checkbox-group":
//       {
//         const selectedValues = Array.isArray(currentValue) ? currentValue : [];
//         return (
//           <div className="df-form-group">
//             {/* <label>
//               {field.label}
//               {field.required && <span style={{ color: "red" }}> *</span>}
//             </label> */}
//             <ReferenceFile />
//             <div className="df-checkbox-group">
//               {(field.options || []).map((opt, index) => {
//                 const value = opt.value ?? opt.label;
//                 const isChecked = selectedValues.includes(value);
//                 return (
//                   <label key={value ?? index} className="df-checkbox-label">
//                     <input
//                       type="checkbox"
//                       value={value}
//                       checked={isChecked}
//                       disabled={isDisabled}
// 											onChange={(e) => {
//                         const updated = e.target.checked
//                           ? [...selectedValues, value]
//                           : selectedValues.filter((v) => v !== value);
//                         handleChange(updated);
//                       }}
// 											onKeyDown={handleKeyDown}
//                     />
//                     {opt.label ?? opt.value}
//                   </label>
//                 );
//               })}
//             </div>
//             {renderFeedbackRequester()}
//           </div>
//         );
//       }

//     case "checkbox":
//       return (
//         <div className="df-form-group">
//           {/* <label>
//             {field.label}
//             {field.required && <span style={{ color: "red" }}> *</span>}
//           </label> */}
//           <ReferenceFile />
//           <input
//             type="checkbox"
//             disabled={isDisabled}
//             checked={!!currentValue}
// 						onChange={(e) => handleChange(e.target.checked)}
// 						onKeyDown={handleKeyDown}
//           />
//           {renderFeedbackRequester()}
//         </div>
//       );

//     case "rating":
//       {
//         const currentRating = Number(currentValue) || 0;
//         return (
//           <div className="df-form-group">
//             {/* <label>
//               {field.label}
//               {field.required && <span style={{ color: "red" }}> *</span>}
//             </label> */}
//             <ReferenceFile />
//             <div className="df-rating-container" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
//               {[1, 2, 3, 4, 5].map((star) => (
//                 <span
//                   key={star}
// 									className={`df-star ${currentRating >= star ? "filled" : ""} ${isDisabled ? "disabled" : ""}`}
// 									role="button"
// 									tabIndex={isDisabled ? -1 : 0}
// 									onClick={() => {
// 										if (isDisabled) return;
// 										const newVal = currentRating === star ? 0 : star;
// 										handleChange(newVal);
// 									}}
// 									onKeyDown={(e) => {
// 										if (isDisabled) return;
// 										if (e.key === "Enter" || e.key === " ") {
// 											e.preventDefault();
// 											const newVal = currentRating === star ? 0 : star;
// 											handleChange(newVal);
// 										}
// 									}}
// 									style={{ cursor: isDisabled ? "default" : "pointer", fontSize: "1.7rem", color: currentRating >= star ? "#f59e0b" : "#cbd5e1" }}
//                 >
//                   ★
//                 </span>
//               ))}
// 							{currentRating > 0 && (
// 								<>
// 									<span className="df-rating-value">({currentRating})</span>
// 									{!isDisabled && (
// 										<button
// 											type="button"
// 											onClick={() => handleChange(0)}
// 											style={{ marginLeft: "12px", background: "transparent", border: "1px solid #e5e7eb", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" }}
// 										>
// 											Clear
// 										</button>
// 									)}
// 								</>
// 							)}
//             </div>
//             {renderFeedbackRequester()}
//           </div>
//         );
//       }

//     case "file":
//       return (
//         <div className="df-form-group">
//           {/* <label>
//             {field.label}
//             {field.required && <span style={{ color: "red" }}> *</span>}
//           </label> */}
//           <ReferenceFile />
//           <input
//             type="file"
//             className="df-input"
//             disabled={isDisabled}
//             accept={field.accept || ".pdf,.doc,.docx,.jpg,.jpeg,.png"}
//             multiple={field.multiple || false}
//             onChange={(e) => handleChange(Array.from(e.target.files || []))}
//             required={field.required && !isDisabled}
//           />
//           <small style={{ color: "#666", fontSize: "0.82rem", display: "block", marginTop: "4px" }}>
//             PDF, JPG, PNG, DOC, DOCX (Max 10MB)
//           </small>

//           {Array.isArray(currentValue) && currentValue.length > 0 && (
//             <div style={{ marginTop: "10px" }}>
//               <strong>Your Attached Files:</strong>
//               {currentValue.map((file, idx) => {
//                 const url = getFileUrl(file);
//                 const name = file?.originalname || file?.name || `File ${idx + 1}`;
//                 return (
//                   <div key={idx} style={{ marginTop: "6px", background: "#f0fdf4", borderRadius: "6px", display: "flex", justifyContent: "space-between" }}>
//                     {/* <span>📎 {name}</span> */}
//                     {url && (
//                       <div style={{ display: "flex", gap: "12px" }}>
//                         <button type="button" onClick={() => viewFile(file)} style={{ color: "#2563eb", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>View</button>
//                         <button type="button" onClick={() => downloadFile(file, name)}>Download</button>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//           {renderFeedbackRequester()}
//         </div>
//       );

//     default:
//       return (
//         <div className="df-form-group">
//           <label>{field.label}</label>
//           <ReferenceFile />
//           <em>Unsupported field type: {field.type}</em>
//         </div>
//       );
//   }
// };
// // const renderField = (field, isPreview = true, onChange = null) => {
// //   const fieldKey = field.fieldId || field.id;
// //   const isDisabled = isPreview || field.readOnly || false;

// //   // Use passed onChange or fallback to default
// //   const handleChange = (value) => {
// //     if (onChange) {
// //       onChange(fieldKey, value);
// //     } else {
// //       handleInputChange(fieldKey, value);
// //     }
// //   };

// //   const currentValue = formData[fieldKey];

// //   switch (field.type) {
// //     case "text":
// //     case "email":
// //     case "number":
// //       return (
// //         <input
// //           type={field.type}
// //           placeholder={field.placeholder || ""}
// //           className="df-input"
// //           disabled={isDisabled}
// //           value={currentValue || ""}
// //           onChange={(e) => handleChange(e.target.value)}
// //           required={field.required && !isDisabled}
// //         />
// //       );

// //     case "textarea":
// //       return (
// //         <textarea
// //           placeholder={field.placeholder || ""}
// //           className="df-input"
// //           disabled={isDisabled}
// //           value={currentValue || ""}
// //           onChange={(e) => handleChange(e.target.value)}
// //           rows={4}
// //           required={field.required && !isDisabled}
// //         />
// //       );

// //     case "date":
// //       return (
// //         <input
// //           type="date"
// //           className="df-input"
// //           disabled={isDisabled}
// //           value={currentValue || ""}
// //           onChange={(e) => handleChange(e.target.value)}
// //           required={field.required && !isDisabled}
// //         />
// //       );

// //     case "daterange":
// //       const rangeValue = currentValue || { start: "", end: "" };
// //       return (
// //         <div className="df-date-range" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
// //           <div style={{ flex: 1 }}>
// //             <label style={{ fontSize: "0.85rem", color: "#666", display: "block", marginBottom: "4px" }}>Start Date</label>
// //             <input
// //               type="date"
// //               className="df-input"
// //               disabled={isDisabled}
// //               value={rangeValue.start || ""}
// //               onChange={(e) => {
// //                 const newRange = { ...(rangeValue || {}), start: e.target.value };
// //                 handleChange(newRange);
// //               }}
// //             />
// //           </div>
// //           <div style={{ flex: 1 }}>
// //             <label style={{ fontSize: "0.85rem", color: "#666", display: "block", marginBottom: "4px" }}>End Date</label>
// //             <input
// //               type="date"
// //               className="df-input"
// //               disabled={isDisabled}
// //               value={rangeValue.end || ""}
// //               onChange={(e) => {
// //                 const newRange = { ...(rangeValue || {}), end: e.target.value };
// //                 handleChange(newRange);
// //               }}
// //             />
// //           </div>
// //         </div>
// //       );

// //    case "select":
// //   return (
// //     <select
// //       className="df-input"
// //       disabled={isDisabled}           // This will now be false in preview
// //       value={currentValue || ""}
// //       onChange={(e) => handleChange(e.target.value)}
// //     >
// //       <option value="">-- Select {field.label || "option"} --</option>
// //       {(field.options || []).map((opt, i) => (
// //         <option 
// //           key={opt.value || i} 
// //           value={opt.value || opt.label}
// //         >
// //           {opt.label || opt.value}
// //         </option>
// //       ))}
// //     </select>
// //   );

// //     case "radio":
// //       return (
// //         <div className="df-radio-group">
// //           {field.options?.map((opt) => (
// //             <label key={opt.value} className="df-radio-label">
// //               <input
// //                 type="radio"
// //                 name={fieldKey}                    // Important for grouping
// //                 value={opt.value}
// //                 checked={currentValue === opt.value}
// //                 disabled={isDisabled}
// //                 onChange={(e) => handleChange(e.target.value)}
// //                 required={field.required && !isDisabled}
// //               />
// //               {opt.label}
// //             </label>
// //           ))}
// //         </div>
// //       );

// //     // FIXED: Checkbox Group - Works for both Employee & Supervisor fields
// //     case "checkbox-group":
// //       const selectedValues = Array.isArray(currentValue) ? currentValue : [];

// //       return (
// //         <div className="df-checkbox-group">
// //           {field.options?.map((opt) => {
// //             const isChecked = selectedValues.includes(opt.value);

// //             return (
// //               <label key={opt.value} className="df-checkbox-label">
// //                 <input
// //                   type="checkbox"
// //                   value={opt.value}
// //                   checked={isChecked}
// //                   disabled={isDisabled}
// //                   onChange={(e) => {
// //                     let updated;
// //                     if (e.target.checked) {
// //                       updated = [...selectedValues, opt.value];        // Add
// //                     } else {
// //                       updated = selectedValues.filter((v) => v !== opt.value); // Remove
// //                     }
// //                     handleChange(updated);
// //                   }}
// //                 />
// //                 {opt.label}
// //               </label>
// //             );
// //           })}
// //         </div>
// //       );

// //     case "checkbox":
// //       return (
// //         <input
// //           type="checkbox"
// //           disabled={isDisabled}
// //           checked={!!currentValue}
// //           onChange={(e) => handleChange(e.target.checked)}
// //         />
// //       );

// //     case "rating":
// //       const currentRating = Number(currentValue) || 0;
// //       return (
// //         <div className="df-rating-container">
// //           {[1, 2, 3, 4, 5].map((star) => (
// //             <span
// //               key={star}
// //               className={`df-star ${currentRating >= star ? "filled" : ""} ${isDisabled ? "disabled" : ""}`}
// //               onClick={() => !isDisabled && handleChange(star)}
// //               style={{ cursor: isDisabled ? "default" : "pointer", fontSize: "2rem" }}
// //             >
// //               ★
// //             </span>
// //           ))}
// //           {currentRating > 0 && <span className="df-rating-value">({currentRating})</span>}
// //         </div>
// //       );
// //       case "file":
// //   return (
// //     <div>
// //       <input
// //         type="file"
// //         className="df-input"
// //         disabled={isDisabled}
// //         accept={field.accept || ".pdf,.doc,.docx,.jpg,.jpeg,.png"}
// //         multiple={field.multiple || false}
// //         onChange={(e) => {
// //           const files = Array.from(e.target.files || []);
// //           handleChange(files);
// //         }}
// //         required={field.required && !isDisabled}
// //       />
// //       <small style={{ color: "#666", fontSize: "0.82rem", display: "block", marginTop: "4px" }}>
// //         PDF, JPG, PNG, DOC, DOCX (Max 10MB)
// //       </small>

// //       {/* Show Uploaded Files */}
// //       {Array.isArray(currentValue) && currentValue.length > 0 && (
// //         <div style={{ marginTop: "10px" }}>
// //           <strong style={{ fontSize: "0.85rem", color: "#166534" }}>Attached Files:</strong>
// //           {currentValue.map((file, idx) => {
// //             const url = getFileUrl(file);
// //             const name = file?.originalname || file?.name || file?.filename || `File ${idx + 1}`;

// //             return (
// //               <div
// //                 key={idx}
// //                 style={{
// //                   marginTop: "6px",
// //                   padding: "8px 10px",
// //                   background: "#f0fdf4",
// //                   borderRadius: "6px",
// //                   fontSize: "0.85rem",
// //                   display: "flex",
// //                   justifyContent: "space-between",
// //                   alignItems: "center"
// //                 }}
// //               >
// //                 <span>📎 {name}</span>
// //                 {url && (
// //                   <div style={{ display: "flex", gap: "12px" }}>
// //                     <a
// //                       href={url}
// //                       target="_blank"
// //                       rel="noopener noreferrer"
// //                       style={{ color: "#2563eb", textDecoration: "underline", fontSize: "0.82rem" }}
// //                     >
// //                       View
// //                     </a>
// //                     <button
// //                       type="button"
// //                       onClick={() => downloadFile(file, name)}
// //                       style={{
// //                         border: "none",
// //                         background: "transparent",
// //                         color: "#16a34a",
// //                         textDecoration: "underline",
// //                         cursor: "pointer",
// //                         fontSize: "0.82rem",
// //                         padding: 0
// //                       }}
// //                     >
// //                       Download
// //                     </button>
// //                   </div>
// //                 )}
// //               </div>
// //             );
// //           })}
// //         </div>
// //       )}
// //     </div>
// //   );
// // //  case "file":
// // //   return (
// // //     <div>
// // //       <input
// // //         type="file"
// // //         className="df-input"
// // //         disabled={isDisabled}
// // //         accept={field.accept || ".pdf,.doc,.docx,.jpg,.jpeg,.png"}
// // //         multiple={field.multiple || false}
// // //         onChange={(e) => {
// // //           const files = Array.from(e.target.files || []);
// // //           handleChange(files);
// // //         }}
// // //         required={field.required && !isDisabled}
// // //       />
// // //       <small style={{ color: "#666", fontSize: "0.82rem", display: "block", marginTop: "4px" }}>
// // //         PDF, JPG, PNG, DOC, DOCX (Max 10MB)
// // //       </small>

// // //       {/* Show Uploaded Files with View/Download */}
// // //       {Array.isArray(currentValue) && currentValue.length > 0 && (
// // //         <div style={{ marginTop: "10px" }}>
// // //           <strong style={{ fontSize: "0.85rem", color: "#166534" }}>Attached Files:</strong>
// // //           {currentValue.map((file, idx) => {
// // //             const url = getFileUrl(file);
// // //             const name = file?.originalname || file?.name || file?.filename || `File ${idx + 1}`;
// // //             return (
// // //               <div key={idx} style={{
// // //                 marginTop: "6px",
// // //                 padding: "8px 10px",
// // //                 background: "#f0fdf4",
// // //                 borderRadius: "6px",
// // //                 fontSize: "0.85rem",
// // //                 display: "flex",
// // //                 justifyContent: "space-between",
// // //                 alignItems: "center"
// // //               }}>
// // //                 <span>📎 {name}</span>
// // //                 <div>
// // //                   {url && (
// // //                     <>
// // //                       <a href={url} target="_blank" rel="noopener noreferrer" 
// // //                          style={{ marginRight: "12px", color: "#2563eb", textDecoration: "underline" }}>
// // //                         View
// // //                       </a>
// // //                       <a href={url} download style={{ color: "#16a34a", textDecoration: "underline" }}>
// // //                         Download
// // //                       </a>
// // //                     </>
// // //                   )}
// // //                 </div>
// // //               </div>
// // //             );
// // //           })}
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // case "file":
// // //   return (
// // //     <div>
// // //       <input
// // //         type="file"
// // //         className="df-input"
// // //         disabled={isDisabled}
// // //         accept={field.accept || ".pdf,.doc,.docx,.jpg,.jpeg,.png"}
// // //         multiple={field.multiple || false}
// // //         onChange={(e) => {
// // //           const files = Array.from(e.target.files || []);
// // //           handleChange(files);
// // //         }}
// // //         required={field.required && !isDisabled}
// // //       />
// // //       <small style={{ color: "#666", fontSize: "0.8rem", display: "block", marginTop: "4px" }}>
// // //         Max 10MB • PDF, JPG, PNG, DOC, DOCX
// // //       </small>

// // //       {/* Show previously uploaded files */}
// // //       {Array.isArray(currentValue) && currentValue.length > 0 && (
// // //         <div style={{ marginTop: "8px", fontSize: "0.85rem" }}>
// // //           {currentValue.map((file, i) => (
// // //             <div key={i} style={{ color: "#16a34a" }}>
// // //               ✓ {file.originalname || file.name}
// // //             </div>
// // //           ))}
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// //     default:
// //       return <em>Unsupported field type: {field.type}</em>;
// //   }
// // };
// // ==================== DOWNLOAD FORM RESPONSES AS EXCEL (with Supervisor Label) ====================
// // const downloadFormResponsesAsExcel = async (form) => {
// //   try {
// //     setLoading(true);
// //     showAlert("Preparing Excel file...", "Info");

// //     // Fetch form details
// //     const formRes = await fetch(`${BACKEND_URL}/api/forms/${form.id}`, {
// //       credentials: "include",
// //       headers: getHeaders(),
// //     });
// //     if (!formRes.ok) throw new Error("Failed to fetch form");

// //     const formJson = await formRes.json();
// //     const formData = formJson.data || formJson;

// //     // Fetch responses
// //     const res = await fetch(`${BACKEND_URL}/api/forms/${form.id}/responses`, {
// //       method: "GET",
// //       credentials: "include",
// //       headers: getHeaders(),
// //     });
// //     if (!res.ok) throw new Error("Failed to fetch responses");

// //     const json = await res.json();
// //     let rawResponses = Array.isArray(json) ? json : json.data || json.responses || [];

// //     // Fetch assigned employees
// //     let assignedEmployees = [];
// //     try {
// //       const assignRes = await fetch(`${BACKEND_URL}/api/forms/${form.id}/assigned`, {
// //         method: "GET",
// //         credentials: "include",
// //         headers: getHeaders(),
// //       });
// //       if (assignRes.ok) {
// //         const assignJson = await assignRes.json();
// //         assignedEmployees = assignJson.data || assignJson.assigned || assignJson.employeeIds || [];
// //       }
// //     } catch (e) {
// //       console.warn("Assigned employees fetch failed");
// //     }

// //     if (assignedEmployees.length === 0) {
// //       showAlert("No employees are assigned to this form yet.", "Warning", "warning");
// //       return;
// //     }

// //     const submittedMap = new Map(rawResponses.map(r => [String(r.employee_id || r.employeeId || ""), r]));

// //     const fieldHeaders = getFieldHeaders(formData);   // Now includes (Supervisor) tag

// //     const excelData = [
// //       ["Employee Name", "Employee ID", "Status", "Submitted At", ...fieldHeaders]
// //     ];

// //     assignedEmployees.forEach((emp) => {
// //       const empId = String(emp.employee_id || emp.id || "");
// //       const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`.trim() || `Employee ${empId}`;
// //       const submitted = submittedMap.get(empId);

// //       const baseRow = [
// //         fullName,
// //         empId,
// //         submitted ? "Submitted" : "Not Submitted",
// //         submitted?.submitted_at ? formatSubmittedTime(submitted.submitted_at) : "—",
// //       ];

// //       if (submitted) {
// //         const values = getFieldValues(submitted.response_json || {}, formData);
// //         excelData.push([...baseRow, ...values]);
// //       } else {
// //         excelData.push([...baseRow, ...Array(fieldHeaders.length).fill("—")]);
// //       }
// //     });

// //     // Generate Excel
// //     const XLSX = await import('xlsx');
// //     const ws = XLSX.utils.aoa_to_sheet(excelData);
// //     const wb = XLSX.utils.book_new();
// //     XLSX.utils.book_append_sheet(wb, ws, "Responses");

// //     const safeName = (form.form_name || "Form").replace(/[^a-zA-Z0-9]/g, "_");
// //     const fileName = `${safeName}_Responses_${new Date().toISOString().slice(0,10)}.xlsx`;

// //     XLSX.writeFile(wb, fileName);

// //     showAlert(`✅ Excel downloaded successfully!\n${fileName}`, "Success", "success");

// //   } catch (err) {
// //     console.error("Excel download error:", err);
// //     showAlert("Failed to generate Excel file. Please try again.", "Error", "error");
// //   } finally {
// //     setLoading(false);
// //   }
// // };
// // ==================== DOWNLOAD FORM RESPONSES AS EXCEL (Fixed Date + Supervisor Label) ====================
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

//     const fieldHeaders = getFieldHeaders(formData);

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
//         baseRow.push(...getFieldValues(submitted.response_json || {}, formData));
//       } else {
//         baseRow.push(...Array(fieldHeaders.length).fill("—"));
//       }

//       excelData.push(baseRow);
//     });

//     // Generate Excel
//     const XLSX = await import('xlsx');
//     const ws = XLSX.utils.aoa_to_sheet(excelData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Responses");

//     // FIXED: Get TODAY's date in IST (Asia/Kolkata)
//     const todayIST = new Date().toLocaleDateString('en-CA', { 
//       timeZone: 'Asia/Kolkata' 
//     });   // Format: YYYY-MM-DD

//     const safeName = (form.form_name || "Form").replace(/[^a-zA-Z0-9]/g, "_");
//     const fileName = `${safeName}_Responses_${todayIST}.xlsx`;

//     XLSX.writeFile(wb, fileName);

//     showAlert(`✅ Excel downloaded successfully!\n${fileName}`, "Success", "success");

//   } catch (err) {
//     console.error("Excel download error:", err);
//     showAlert("Failed to generate Excel file. Please try again.", "Error", "error");
//   } finally {
//     setLoading(false);
//   }
// };
// // ==================== HELPER: Get Field Headers with Supervisor Tag ====================
// const getFieldHeaders = (form) => {
//   let formJson = form.form_json;
//   if (typeof formJson === 'string') {
//     try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
//   }

//   const headers = [];

//   (formJson || []).forEach((f) => {
//     if (f.employee) {
//       // Employee Field
//       headers.push(f.employee.label || f.id || "Field");
//     } 
//     else if (f.label) {
//       // This is likely a supervisor field (from old structure or direct supervisor field)
//       headers.push(f.label + " (Supervisor)");
//     }
//     // Multiple supervisor fields support
//     if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
//       f.supervisorFields.forEach((sup, idx) => {
//         headers.push((sup.label || `Supervisor Field ${idx + 1}`) + " (Supervisor)");
//       });
//     }
//   });

//   return headers;
// };

// // // ==================== HELPER: Get Field Values ====================
// // const getFieldValues = (responseJson, form) => {
// //   let formJson = form.form_json;
// //   if (typeof formJson === 'string') {
// //     try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
// //   }

// //   const values = [];

// //   (formJson || []).forEach((f) => {
// //     // Employee field
// //     if (f.employee) {
// //       const key = f.id;
// //       let val = responseJson[key];
// //       if (Array.isArray(val)) val = val.join(", ");
// //       else if (val && typeof val === "object") val = JSON.stringify(val);
// //       values.push(val ?? "—");
// //     }

// //     // Multiple supervisor fields
// //     if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
// //       f.supervisorFields.forEach((sup, idx) => {
// //         const key = `${f.id}_sup_${idx}`;
// //         let val = responseJson[key];
// //         if (Array.isArray(val)) val = val.join(", ");
// //         else if (val && typeof val === "object") val = JSON.stringify(val);
// //         values.push(val ?? "—");
// //       });
// //     }
// //   });

// //   return values;
// // };
// // ==================== HELPER: Get Field Values (Fixed for Files) ====================
// const getFieldValues = (responseJson, form) => {
//   let formJson = form.form_json;
//   if (typeof formJson === 'string') {
//     try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
//   }

//   const values = [];

//   (formJson || []).forEach((f) => {
//     // Employee field
//     if (f.employee) {
//       const key = f.id;
//       let val = responseJson[key];

//       // 🔥 FIXED: Handle File Attachments
//       if (Array.isArray(val) && val.length > 0) {
//         const firstItem = val[0];
//         if (firstItem && typeof firstItem === "object" && 
//             (firstItem.originalname || firstItem.filename || firstItem.name)) {
//           val = val.map(file => 
//             file.originalname || file.filename || file.name || "File"
//           ).join(", ");
//         } else {
//           val = val.join(", ");
//         }
//       } 
//       else if (val && typeof val === "object") {
//         val = JSON.stringify(val);
//       }

//       values.push(val ?? "—");
//     }

//     // Multiple supervisor fields
//     if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
//       f.supervisorFields.forEach((sup, idx) => {
//         const key = `${f.id}_sup_${idx}`;
//         let val = responseJson[key];

//         if (Array.isArray(val) && val.length > 0) {
//           const firstItem = val[0];
//           if (firstItem && typeof firstItem === "object" && 
//               (firstItem.originalname || firstItem.filename)) {
//             val = val.map(file => 
//               file.originalname || file.filename || file.name || "File"
//             ).join(", ");
//           } else {
//             val = val.join(", ");
//           }
//         } else if (val && typeof val === "object") {
//           val = JSON.stringify(val);
//         }

//         values.push(val ?? "—");
//       });
//     }
//   });

//   return values;
// };
//  const viewResponses = async (formId, formName) => {
//   try {
//     setLoading(true);
//     setCurrentResponses([]);

//     // Fetch form details
//     const formRes = await fetch(`${BACKEND_URL}/api/forms/${formId}`, {
//       credentials: "include",
//       headers: getHeaders(),
//     });
//     if (!formRes.ok) throw new Error("Failed to load form");
//     const formJson = await formRes.json();
//     const form = formJson.data || formJson;

//     // Fetch responses (submitted ones)
//     const res = await fetch(`${BACKEND_URL}/api/forms/${formId}/responses`, {
//       method: "GET",
//       credentials: "include",
//       headers: getHeaders(),
//     });
//     if (!res.ok) throw new Error("Failed to load responses");
//     const json = await res.json();
//     let rawResponses = Array.isArray(json) 
//       ? json 
//       : json.data || json.responses || [];

//     // === NEW: Fetch Assigned Employees ===
//     let assignedEmployees = [];
//     try {
//       const assignRes = await fetch(`${BACKEND_URL}/api/forms/${formId}/assigned`, {
//         method: "GET",
//         credentials: "include",
//         headers: getHeaders(),
//       });

//       if (assignRes.ok) {
//         const assignJson = await assignRes.json();
//         assignedEmployees = assignJson.data || assignJson.assigned || assignJson.employeeIds || [];
//       }
//     } catch (assignErr) {
//       console.warn("Could not fetch assigned employees:", assignErr);
//     }

//     // Create a map of submitted responses by employee_id
//     const submittedMap = new Map();
//     rawResponses.forEach((resp) => {
//       const empId = String(resp.employee_id || resp.employeeId || "");
//       if (empId) submittedMap.set(empId, resp);
//     });

//     // Build final list: All assigned employees + their submission status
//     const fieldMetaMap = (() => {
//       let formJsonData = form.form_json;
//       if (typeof formJsonData === 'string') {
//         try { formJsonData = JSON.parse(formJsonData); } catch (e) { formJsonData = []; }
//       }

//       const map = {};
//       const addField = (field, id, visibleTo = 'both') => {
//         if (!id) return;
//         const fieldType = field?.type || field?.employee?.type || null;
//         const label = field?.label || field?.employee?.label || field?.name || id;
//         map[String(id)] = { label, visibleTo, type: fieldType };
//       };

//       (formJsonData || []).forEach(f => {
//         if (f.employee) {
//           addField(f.employee, f.id, 'employee');
//         } else {
//           addField(f, f.id || f.fieldId || f.name, 'both');
//         }

//         if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
//           f.supervisorFields.forEach((sup, idx) => {
//             const supKey = `${f.id}_sup_${idx}`;
//             addField(sup, supKey, 'supervisor');
//           });
//         } else if (f.supervisor) {
//           const supKey = `${f.id}_sup`;
//           addField(f.supervisor, supKey, 'supervisor');
//         }
//       });

//       return map;
//     })();

//     const getEmployeeName = (employeeId) => {
//       const emp = (employees || []).find(
//         (e) => String(e.employee_id || e.id) === String(employeeId)
//       );
//       if (!emp) return null;
//       return [emp.first_name, emp.middle_name, emp.last_name]
//         .filter(Boolean)
//         .join(" ")
//         .trim() || null;
//     };

//     const formattedResponses = assignedEmployees.map((emp) => {
//       const empId = String(emp.employee_id || emp.id || "");
//       const submittedResp = submittedMap.get(empId);

//       const fullName = `${emp.first_name || ''} ${emp.middle_name || ''} ${emp.last_name || ''}`.trim() 
//         || `Employee ${empId}`;

//       if (submittedResp) {
//         const responseJson = submittedResp.response_json || {};
//         const readable = [];
//         const meta = {};

//         const getFieldInfoForResponseKey = (key) => {
//           const normalizedKey = String(key);
//           let fieldInfo = fieldMetaMap[normalizedKey] || { label: normalizedKey, visibleTo: 'both', type: null };
//           let label = fieldInfo.label;

//           const feedbackMatch = normalizedKey.match(/^(.*)_others_feedback_from_(\d+)$/);
//           if (feedbackMatch) {
//             const baseKey = feedbackMatch[1];
//             const fromEmployeeId = feedbackMatch[2];
//             const baseInfo = fieldMetaMap[baseKey];
//             const sourceName = getEmployeeName(fromEmployeeId) || `Employee ${fromEmployeeId}`;
//             if (baseInfo) {
//               label = `${baseInfo.label} (Feedback from ${sourceName})`;
//               fieldInfo.type = baseInfo.type || fieldInfo.type;
//             } else {
//               label = `${label} (Feedback from ${sourceName})`;
//             }
//           } else if (/(_feedback_request_to)$/.test(normalizedKey)) {
//             const baseKey = normalizedKey.replace(/_feedback_request_to$/, "");
//             const baseInfo = fieldMetaMap[baseKey];
//             if (baseInfo) {
//               label = `${baseInfo.label} (Requested To)`;
//             } else {
//               label = `${label} (Requested To)`;
//             }
//           }

//           return { ...fieldInfo, label };
//         };

//         Object.keys(responseJson).forEach((key) => {
//           if (String(key).startsWith("__")) {
//             meta[key] = responseJson[key];
//             return;
//           }

//           if (/(_feedback_request_to)$/.test(String(key))) {
//             const baseKey = String(key).replace(/_feedback_request_to$/, "");
//             const requestValue = responseJson[baseKey];
//             const requestedToId = String(responseJson[key]);
//             const requestedToName = getEmployeeName(requestedToId) || requestedToId;
//             const requestLabel = fieldMetaMap[baseKey]?.label || baseKey;
//             readable.push({
//               key,
//               label: `${requestLabel} (Requested To)`,
//               response: requestedToName,
//               type: null,
//             });
//             if (requestValue !== undefined && requestValue !== null && requestValue !== "") {
//               readable.push({
//                 key: `${key}_reason`,
//                 label: `${requestLabel} (Request Reason)`,
//                 response: requestValue,
//                 type: null,
//               });
//             }
//             return;
//           }

//           const fieldInfo = getFieldInfoForResponseKey(key);
//           let answer = responseJson[key];

//           if (Array.isArray(answer)) {
//             // Keep arrays as arrays for renderResponseValue to handle
//           } else if (answer && typeof answer === "object") {
//             if (answer.start && answer.end) {
//               answer = `${answer.start} to ${answer.end}`;
//             }
//           } else if (answer === "" || answer === null || answer === undefined) {
//             answer = "—";
//           }

//           readable.push({
//             key,
//             label: fieldInfo.label,
//             response: answer,
//             type: fieldInfo.type || null,
//           });
//         });

//         return {
//           ...submittedResp,
//           employeeDisplay: fullName,
//           status: "submitted",
//           readableAnswers: readable,
//           metadata: meta,
//           requestedFeedback: Object.keys(responseJson)
//             .filter((k) => /_feedback_request_to$/.test(k))
//             .map((k) => {
//               const baseKey = k.replace(/_feedback_request_to$/, "");
//               const requestValue = responseJson[baseKey];
//               const requestedToId = String(responseJson[k]);
//               return {
//                 fieldId: baseKey,
//                 fieldLabel: fieldMetaMap[baseKey]?.label || baseKey,
//                 requestedToId,
//                 requestedToName: getEmployeeName(requestedToId) || requestedToId,
//                 requestValue,
//               };
//             }),
//           submitted_at: submittedResp.submitted_at || submittedResp.created_at,
//         };
//       } else {
//         return {
//           employee_id: empId,
//           employeeDisplay: fullName,
//           status: "not_submitted",
//           readableAnswers: [],
//           metadata: {
//             __status: "Not Submitted Yet",
//             __submitted_at: null,
//           },
//         };
//       }
//     });

//     setCurrentResponses(formattedResponses);
//     setCurrentFormTitle(formName || form.form_name || "Form Responses");
//     setShowResponsesModal(true);
//   } catch (err) {
//     console.error(err);
//     showAlert("Error loading responses: " + err.message, "Error", "error");
//   } finally {
//     setLoading(false);
//   }
// };
// //  const handleAssign = async () => {
// //   if (selectedEmployeeIds.length === 0) {
// //     showAlert("Please select at least one employee", "Warning", "warning");
// //     return;
// //   }

// //   setLoading(true);
// //   try {
// //     const res = await fetch(`${BACKEND_URL}/api/forms/${editingId}/assign`, {
// //       method: "POST",
// //       credentials: "include",
// //       headers: getHeaders(),
// //       body: JSON.stringify({ employeeIds: selectedEmployeeIds }),
// //     });

// //     const json = await res.json();

// //     if (!res.ok) throw new Error(json.message || "Assignment failed");

// //     showAlert(
// //       `Form successfully assigned to ${selectedEmployeeIds.length} employee${selectedEmployeeIds.length > 1 ? 's' : ''}`,
// //       "Success",
// //       "success"
// //     );

// //     setSelectedEmployeeIds([]);

// //     // Refresh already assigned list
// //     const refreshRes = await fetch(`${BACKEND_URL}/api/forms/${editingId}/assigned`, {
// //       method: "GET",
// //       credentials: "include",
// //       headers: getHeaders(),
// //     });
// //     if (refreshRes.ok) {
// //       const data = await refreshRes.json();
// //       const ids = (data.data || data.assigned || []).map(item => String(item.employee_id || item.id));
// //       setAlreadyAssignedIds(ids);
// //     }

// //   } catch (err) {
// //     showAlert("Failed to assign: " + err.message, "Error", "error");
// //   } finally {
// //     setLoading(false);
// //   }
// // };
// const handleAssign = async () => {
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

//     // ✅ CLEAR SELECTION
//     setSelectedEmployeeIds([]);

//     // ✅ Refresh Already Assigned List
//     const refreshRes = await fetch(`${BACKEND_URL}/api/forms/${editingId}/assigned`, {
//       method: "GET",
//       credentials: "include",
//       headers: getHeaders(),
//     });

//     if (refreshRes.ok) {
//       const data = await refreshRes.json();
//       const ids = (data.data || data.assigned || []).map(item =>
//         String(item.employee_id || item.id)
//       );
//       setAlreadyAssignedIds(ids);
//     }

//     // 🔥 MOST IMPORTANT FIX - Refresh Team Submissions
//     if (isSupervisor || isHR) {
//       await fetchTeamSubmissions();
//     }

//     // Optional: Also refresh self forms if needed
//     // await fetchSelfForms();

//   } catch (err) {
//     console.error("Assign error:", err);
//     showAlert("Failed to assign: " + err.message, "Error", "error");
//   } finally {
//     setLoading(false);
//   }
// };
//   if (!user) return <div>Please login</div>;
//   return (
//     <>
//       <div className="df-container">
//         {/* <h2 className="df-title">Dynamic Form Builder</h2> */}
//         {loading && <div className="df-loading">Loading...</div>}
//         {/* ==================== BUILDER - ONLY ADMIN & HR ==================== */}
//         {!viewMode && !fillMode && canBuildForms && (
//           <div className="df-builder-card">
//            <div className="df-top-config">
//   <div>
//     <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155" }}>
//       Form Name
//     </label>
//     <input
//   placeholder="e.g. Employee Survey"
//   value={formName}
//   onChange={(e) => setFormName(e.target.value)}   // ← Raw value only
//   onBlur={() => setFormName(toTitleCase(formName))} // ← Apply title case when user leaves the field
//   className="df-input"
//   style={{ fontSize: "1.1rem", fontWeight: "500" }}
// />
//   </div>

//   <div>
//     <label>Active From</label>
//     <input type="date" value={activeFrom} onChange={(e) => setActiveFrom(e.target.value)} className="df-input" />
//   </div>

//   <div>
//     <label>Active To</label>
//     <input type="date" value={activeTo} onChange={(e) => setActiveTo(e.target.value)} className="df-input" />
//   </div>

//   <div>
//     <label>Form Type</label>
//     <select value={formType} onChange={(e) => setFormType(e.target.value)} className="df-input">
//       <option value="employee_only">Employee Only</option>
//       <option value="employee_supervisor">Employee + Supervisor</option>
//     </select>
//   </div>

//   <div>
//     <label>Layout Style</label>
//     <select value={layoutMode} onChange={(e) => setLayoutMode(e.target.value)} className="df-input">
//       <option value="one">1 Column</option>
//       <option value="two">2 Columns</option>
//       <option value="three">3 Columns</option>
//     </select>
//   </div>
// </div>
//             <div className="df-builder">
//               <div className="df-field-builder">
//                 <h4 style={{ margin: "0 0 10px 0", color: "#0d6efd" }}>Add Form Fields</h4>
//                 <p style={{ margin: "0 0 16px 0", color: "#666", fontSize: "0.9rem" }}>
//                   Configure fields for employees{formType === 'employee_supervisor' ? ' and optional supervisor feedback' : ''}
//                 </p>
//                 <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
//                   Employee Field Type
//                 </label>
//                 <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="df-input">
//                   <option value="text">📝 Text</option>
//                   <option value="email">📧 Email</option>
//                   <option value="textarea">📄 Textarea</option>
//                   <option value="number">🔢 Number</option>
//                   <option value="date">📅 Date</option>
//                   <option value="daterange">📆 Date Range</option>
//                   <option value="select">📋 Dropdown</option>
//                   <option value="radio">◉ Radio Buttons</option>
//                   <option value="checkbox-group">☑️ Checkbox Group</option>
//                   <option value="checkbox">☐ Single Checkbox</option>
//                   <option value="rating">⭐ Rating</option>
//                   <option value="file">📎 Attachment</option>   {/* ← ADD THIS */}
//                 </select>
//                 <label style={{ display: "block", marginTop: "12px", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
//   Employee Field Label
// </label>
// <input 
//   placeholder="e.g., Your Name" 
//   value={fieldLabel} 
//   onChange={(e) => setFieldLabel(e.target.value)} 
//   className="df-input" 
// />

// <label style={{ display: "block", marginTop: "12px", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
//   Employee Placeholder (optional)
// </label>
// <input 
//   placeholder="e.g., Enter your full name" 
//   value={fieldPlaceholder} 
//   onChange={(e) => setFieldPlaceholder(e.target.value)} 
//   className="df-input" 
// />

// {(fieldType === "text" || fieldType === "textarea") && (
//   <div style={{ marginTop: "14px" }}>
//     <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
//       <input 
//         type="checkbox" 
//         checked={fieldNeedsOthersFeedback} 
//         onChange={(e) => setFieldNeedsOthersFeedback(e.target.checked)} 
//       />
//       Needs Feedback from Others
//     </label>
//     {fieldNeedsOthersFeedback && (
//       <small style={{ display: "block", marginTop: "8px", color: "#475569" }}>
//         Let the employee request feedback from another selected coworker and open an Others Feedback tab.
//       </small>
//     )}
//   </div>
// )}

// {/* NEW: Required Checkbox for Employee Field */}


// {showOptions && (
//   <div style={{ marginTop: "12px" }}>
//     <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "0.9rem" }}>
//       Employee Options (comma separated)
//     </label>
//     <input 
//       placeholder="e.g., Option 1, Option 2, Option 3" 
//       value={optionsInput} 
//       onChange={(e) => setOptionsInput(e.target.value)} 
//       className="df-input" 
//     />
//   </div>
// )}
//           <div style={{ marginTop: "12px" }}>
//   <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
//     <input 
//       type="checkbox" 
//       checked={fieldRequired} 
//       onChange={(e) => setFieldRequired(e.target.checked)} 
//     />
//     Required Field
//   </label>
// </div>   
// {/* Reference File - Available for ALL field types */}
// <div style={{ marginTop: "16px" }}>
//   <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#1e40af" }}>
//     📎 Reference File (Sample / Format for User)
//   </label>
//   <input
//     type="file"
//     accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
//     onChange={(e) => {
//       if (e.target.files?.[0]) {
//         setFieldReferenceFile(e.target.files[0]);
//       }
//     }}
//   />
//   {fieldReferenceFile && (
//     <small style={{ color: "green", display: "block", marginTop: "4px" }}>
//       ✓ {fieldReferenceFile.name}
//     </small>
//   )}
// </div>  
                
//                 {formType === 'employee_supervisor' && (
//   <div style={{ marginTop: "20px" }}>
//     <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
//       <input 
//         type="checkbox" 
//         checked={hasSupervisorFeedback} 
//         onChange={(e) => {
//           setHasSupervisorFeedback(e.target.checked);
//           if (!e.target.checked) {
//             setSupervisorFieldsList([]);
//           }
//         }} 
//       />
//       <span>Add Supervisor Feedback (Multiple allowed)</span>
//     </label>

//     {hasSupervisorFeedback && (
//       <div style={{ marginTop: "16px", padding: "18px", backgroundColor: "#fff3cd", borderRadius: "10px", border: "1px solid #ffeaa7" }}>
//         <h5 style={{ margin: "0 0 16px 0", color: "#856404" }}>Supervisor Feedback Fields</h5>

//         {/* List of added supervisor fields */}
//         {/* List of added supervisor fields */}
// {supervisorFieldsList.length > 0 && (
//   <div style={{ marginBottom: "16px" }}>
//     {supervisorFieldsList.map((sup, index) => (
//       <div 
//         key={index} 
//         style={{
//           padding: "14px 16px",
//           background: "#fff",
//           border: "1px solid #ddd",
//           borderRadius: "10px",
//           marginBottom: "12px",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
//         }}
//       >
//         <div style={{ flex: 1 }}>
//           <strong>{sup.label}</strong>
//           <span style={{ marginLeft: "12px", color: "#666", fontSize: "0.9rem" }}>
//             ({sup.type})
//           </span>
//           {sup.required && <span style={{ color: "red", marginLeft: "8px" }}>*</span>}
          
//           {sup.placeholder && (
//             <div style={{ fontSize: "0.85rem", color: "#888", marginTop: "6px" }}>
//               Placeholder: "{sup.placeholder}"
//             </div>
//           )}
//         </div>

//         {/* Styled Edit & Delete Buttons - Same as Added Fields */}
//         <div style={{ display: "flex", gap: "8px" }}>
//           <button
//             onClick={() => editSupervisorField(index)}
//             style={{
//   padding: "6px 10px",
//   background: "#16a34a",   // green button
//   border: "1px solid #16a34a",
//   borderRadius: "8px",
//   cursor: "pointer",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   color: "#ffffff"         // white icon
// }}
//             title="Edit Supervisor Field"
//           >
//             <FiEdit2 size={18} />
//           </button>

//           <button
//             onClick={() => deleteSupervisorField(index)}
//             style={{
//   padding: "8px 12px",
//   background: "#16a34a",   // green button
//   border: "1px solid #16a34a",
//   borderRadius: "8px",
//   cursor: "pointer",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   color: "#ffffff"         // white icon
// }}
//             title="Delete Supervisor Field"
//           >
//             <FiTrash2 size={18} />
//           </button>
//         </div>
//       </div>
//     ))}
//   </div>
// )}

//         {/* Form to add/edit supervisor field */}
//       {/* Form to add/edit supervisor field */}
// <div style={{ marginTop: "12px" }}>
//   <label>Supervisor Field Type</label>
//   <select 
//     value={supervisorType} 
//     onChange={(e) => setSupervisorType(e.target.value)} 
//     className="df-input"
//   >
//     <option value="text">Text</option>
//     <option value="textarea">Textarea</option>
//     <option value="email">Email</option>
//     <option value="number">Number</option>
//     <option value="radio">Radio Buttons</option>
//     <option value="checkbox-group">Checkbox Group</option>
//     <option value="rating">Rating</option>
//   </select>

//   <label style={{ marginTop: "12px" }}>Supervisor Field Label</label>
//   <input
//     placeholder="e.g. Supervisor Comments"
//     value={supervisorLabel}
//     onChange={(e) => setSupervisorLabel(e.target.value)}
//     className="df-input"
//   />

//   {/* NEW: Placeholder for supervisor fields */}
//   {(supervisorType === "text" || supervisorType === "textarea" || supervisorType === "email" || supervisorType === "number") && (
//     <div style={{ marginTop: "12px" }}>
//       <label>Supervisor Placeholder (optional)</label>
//       <input
//         placeholder="e.g. Enter your detailed feedback here..."
//         value={supervisorPlaceholder}
//         onChange={(e) => setSupervisorPlaceholder(e.target.value)}
//         className="df-input"
//       />
//     </div>
//   )}

//   {(supervisorType === 'radio' || supervisorType === 'checkbox-group') && (
//     <div style={{ marginTop: "12px" }}>
//       <label>Options (comma separated)</label>
//       <input
//         placeholder="Excellent, Good, Average, Poor"
//         value={supervisorOptionsInput}
//         onChange={(e) => setSupervisorOptionsInput(e.target.value)}
//         className="df-input"
//       />
//     </div>
//   )}

//   <div style={{ marginTop: "12px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
//     <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//       <input type="checkbox" checked={supervisorRequired} onChange={(e) => setSupervisorRequired(e.target.checked)} />
//       Required
//     </label>
//     <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//       <input type="checkbox" checked={supervisorVisibleToEmployee} onChange={(e) => setSupervisorVisibleToEmployee(e.target.checked)} />
//       Visible to Employee
//     </label>
//   </div>

//   <button
//     onClick={addOrUpdateSupervisorField}
//     className="df-add-btn"
//     style={{ marginTop: "16px", width: "100%" }}
//   >
//     {editingSupervisorIndex !== null ? "Update Supervisor Field" : 
//      <><FiPlus size={18} /> Add Supervisor Field</>}
//   </button>
// </div>
//       </div>
//     )}
//   </div>
// )}
   
//                 <button 
//   onClick={addOrUpdateField} 
//   className="df-add-btn" 
//   style={{ 
//     marginTop: "16px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: "8px"
//   }}
// >
//   {editingFieldId ? (
//     <>
//       <FiEdit2 size={18} />
//       Update Field
//     </>
//   ) : (
//     <>
//       <FiPlus size={18} />
//       Add Field
//     </>
//   )}
// </button>
//               </div>
//               <div>
//                 <div className="df-field-list-container">
//                   <h5 style={{ margin: "0 0 12px 0", color: "#333" }}>Added Fields ({fields.length})</h5>
//                   <div className="df-field-list">
//                     {fields.length === 0 ? (
//                       <p style={{ color: "#999", textAlign: "center", padding: "50px 20px" }}>No fields added yet</p>
//                     ) : (
//                       fields.map((f) => (
//                         <div key={f.id} className="df-field-item">
//                           <span>
//   <strong>{f.employee.label}</strong>
//   <span style={{ color: "#666", marginLeft: "8px" }}>({f.employee.type})</span>
//   {f.employee.required && <span style={{ color: "#dc3545", marginLeft: "4px" }}>*</span>}
//   {f.employee.needsOthersFeedback && (
//     <span style={{ color: "#0f766e", marginLeft: "12px", fontWeight: "600" }}>
//       + Others Feedback
//     </span>
//   )}
//   {f.supervisorFields && f.supervisorFields.length > 0 && (
//     <span style={{ color: "#856404", marginLeft: "12px", fontWeight: "600" }}>
//       + {f.supervisorFields.length} Supervisor Field{f.supervisorFields.length > 1 ? 's' : ''}
//     </span>
//   )}
// </span>
//                         <div style={{ display: "flex", gap: "8px" }}>
//   <button 
//     onClick={() => editField(f.id)} 
//     className="df-edit-btn" 
//     style={{ 
//       padding: "6px 10px", 
//       display: "flex", 
//       alignItems: "center", 
//       justifyContent: "center" 
//     }}
//     title="Edit Field"
//   >
//     <FiEdit2 size={18} />
//   </button>

//   <button 
//     onClick={() => deleteField(f.id)} 
//     className="df-delete-btn" 
//     style={{ 
//       padding: "6px 10px", 
//       display: "flex", 
//       alignItems: "center", 
//       justifyContent: "center" 
//     }}
//     title="Delete Field"
//   >
//     <FiTrash2 size={18} />
//   </button>
// </div>
//                         </div>
//                       ))
//                     )}
//                   </div>
//                 </div>
               
// {editingId && (
//   <div className="assign-section" style={{ marginTop: "30px", padding: "24px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
//     <h3 style={{ marginTop: 0 }}>Assign Form to Employees</h3>

//     <button
//       type="button"
//       onClick={() => setShowAssignSection(!showAssignSection)}
//       style={{
//         padding: "10px 20px",
//         background: showAssignSection ? "#6c757d" : "#0d6efd",
//         color: "white",
//         border: "none",
//         borderRadius: "8px",
//         cursor: "pointer",
//         marginBottom: "20px"
//       }}
//     >
//       {showAssignSection ? "Hide Assignment Panel" : "Show Assign Employees"}
//     </button>

//     {showAssignSection && (
//       <>
//         {/* Search Bar */}
//         <div style={{ marginBottom: "16px" }}>
//           <input
//             type="text"
//             placeholder="Search by name or employee ID..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="df-input"
//             style={{ width: "100%", padding: "12px 16px", fontSize: "1rem" }}
//           />
//         </div>

//         <div style={{ marginBottom: "16px", display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.95rem" }}>
//           <div><strong>Total:</strong> {employees.length}</div>
//           <div><strong>Already Assigned:</strong> {alreadyAssignedIds.length}</div>
//           <div><strong>Showing:</strong> {filteredEmployees.length}</div>
//         </div>

//         {/* Select All Checkbox */}
//         <label style={{ display: "block", marginBottom: "14px", fontWeight: "600", cursor: "pointer" }}>
//           <input
//             type="checkbox"
//             checked={
//               filteredEmployees.length > 0 &&
//               selectedEmployeeIds.length ===
//                 filteredEmployees.filter(emp => !alreadyAssignedIds.includes(String(emp.employee_id || emp.id))).length
//             }
//             onChange={(e) => {
//               const available = filteredEmployees.filter(emp =>
//                 !alreadyAssignedIds.includes(String(emp.employee_id || emp.id))
//               );
//               if (e.target.checked) {
//                 setSelectedEmployeeIds(available.map(emp => String(emp.employee_id || emp.id)));
//               } else {
//                 setSelectedEmployeeIds([]);
//               }
//             }}
//           /> Select All 
//         </label>

//         {/* Employee List */}
//         <div style={{ 
//           maxHeight: "420px", 
//           overflowY: "auto", 
//           border: "1px solid #ddd", 
//           borderRadius: "8px", 
//           padding: "8px",
//           background: "#fff"
//         }}>
//           {filteredEmployees.length === 0 ? (
//             <p style={{ textAlign: "center", color: "#888", padding: "40px 20px" }}>
//               No employees found for "{searchTerm}"
//             </p>
//           ) : (
//             filteredEmployees.map((emp) => {
//               const empId = String(emp.employee_id || emp.id || "");
//               const isAlreadyAssigned = alreadyAssignedIds.includes(empId);
//               const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`.trim();
//               const displayText = fullName ? `${fullName} (${empId})` : `Employee ${empId}`;

//               if (isAlreadyAssigned) return null; // Hide already assigned

//               return (
//                 <label
//                   key={empId}
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     padding: "12px 14px",
//                     margin: "6px 0",
//                     background: "#fff",
//                     borderRadius: "8px",
//                     border: "1px solid #e9ecef",
//                     cursor: "pointer",
//                     transition: "all 0.2s"
//                   }}
//                   onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"}
//                   onMouseOut={(e) => e.currentTarget.style.background = "#fff"}
//                 >
//                   <input
//                     type="checkbox"
//                     checked={selectedEmployeeIds.includes(empId)}
//                     onChange={(e) => {
//                       if (e.target.checked) {
//                         setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
//                       } else {
//                         setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== empId));
//                       }
//                     }}
//                     style={{ marginRight: "12px", transform: "scale(1.1)" }}
//                   />
//                   <span style={{ fontSize: "1.02rem" }}>{displayText}</span>
//                 </label>
//               );
//             })
//           )}
//         </div>

//         {/* Assign Button */}
//         <button
//           onClick={handleAssign}
//           disabled={loading || selectedEmployeeIds.length === 0}
//           style={{
//             marginTop: "24px",
//             padding: "14px 32px",
//             width: "100%",
//             background: selectedEmployeeIds.length > 0 ? "#16a34a" : "#94a3b8",
//             color: "white",
//             border: "none",
//             borderRadius: "10px",
//             fontWeight: "600",
//             fontSize: "1.05rem",
//             cursor: selectedEmployeeIds.length > 0 ? "pointer" : "not-allowed"
//           }}
//         >
//           Assign to {selectedEmployeeIds.length} Employee{selectedEmployeeIds.length !== 1 ? "s" : ""}
//         </button>
//       </>
//     )}
//   </div>
// )}
//               </div>
//             </div>
//            <button 
//   onClick={saveTemplate} 
//   className="df-submit-btn" 
//   disabled={loading}
//   style={{
//     display: "inline-flex",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: "10px"
//   }}
// >
//   {editingId ? (
//     <>
//       <FiSave size={20} />
//       Update Form
//     </>
//   ) : (
//     <>
//       <FiPlus size={20} />
//       Create Form
//     </>
//   )}
// </button>
//           </div>
//         )}
//         {/* ==================== TEMPLATES SECTION WITH TABS ==================== */}
//         {!viewMode && !fillMode && (
//           <div className="df-templates">
//             <h3>
//               {canBuildForms ? "Form Management" : isSupervisor ? "My Forms & Team" : "My Assigned Forms"}
//             </h3>
           
// {(isSupervisor || canBuildForms || feedbackRequests.length > 0) && (
//   <div className="df-tabs" style={{ marginBottom: "25px", display: "flex", gap: "12px" }}>
//     {/* Show Self tab for non-admin employees and HR */}
//     {(!isAdmin || isHR) && (
//       <button
//         onClick={() => setActiveTab("self")}
//         style={{
//           padding: "10px 24px",
//           background: activeTab === "self" ? "#16a34a" : "#f8f9fa",
//           color: activeTab === "self" ? "#fff" : "#333",
//           border: "none",
//           borderRadius: "8px",
//           cursor: "pointer",
//           fontWeight: activeTab === "self" ? "600" : "500"
//         }}
//       >
//         Self Forms
//       </button>
//     )}

//     {/* Show Team tab ONLY if supervisor */}
//     {isSupervisor && myTeamEmployeeIds.length > 0 && (
//       <button
//         onClick={() => setActiveTab("team")}
//         style={{
//           padding: "10px 24px",
//           background: activeTab === "team" ? "#16a34a" : "#f8f9fa",
//           color: activeTab === "team" ? "#fff" : "#333",
//           border: "none",
//           borderRadius: "8px",
//           cursor: "pointer",
//           fontWeight: activeTab === "team" ? "600" : "500"
//         }}
//       >
//         Team Forms
//       </button>
//     )}

//     {otherForms.length > 0 && (
//       <button
//         onClick={() => setActiveTab("others")}
//         style={{
//           padding: "10px 24px",
//           background: activeTab === "others" ? "#16a34a" : "#f8f9fa",
//           color: activeTab === "others" ? "#fff" : "#333",
//           border: "none",
//           borderRadius: "8px",
//           cursor: "pointer",
//           fontWeight: activeTab === "others" ? "600" : "500"
//         }}
//       >
//         Others
//       </button>
//     )}

//     {/* Show Feedback Requests tab ONLY if they have feedback requests */}
//     {feedbackRequests.length > 0 && (
//       <button
//         onClick={() => setActiveTab("feedbackRequests")}
//         style={{
//           padding: "10px 24px",
//           background: activeTab === "feedbackRequests" ? "#16a34a" : "#f8f9fa",
//           color: activeTab === "feedbackRequests" ? "#fff" : "#333",
//           border: "none",
//           borderRadius: "8px",
//           cursor: "pointer",
//           fontWeight: activeTab === "feedbackRequests" ? "600" : "500"
//         }}
//       >
//         Feedback Requests ({feedbackRequests.length})
//       </button>
//     )}

//     {/* All Forms tab - Always visible for Admin & HR */}
//     {canSeeAllTab && (
//       <button
//         onClick={() => setActiveTab("all")}
//         style={{
//           padding: "10px 24px",
//           background: activeTab === "all" ? "#16a34a" : "#f8f9fa",
//           color: activeTab === "all" ? "#fff" : "#333",
//           border: "none",
//           borderRadius: "8px",
//           cursor: "pointer",
//           fontWeight: activeTab === "all" ? "600" : "500"
//         }}
//       >
//         All Forms
//       </button>
//     )}
//   </div>
// )}

//      <div className="df-template-grid">
//   {/* ==================== ALL FORMS TAB ==================== */}
//   {/* {activeTab === "all" && canSeeAllTab && (
//     templates.length === 0 ? (
//       <p style={{ color: "#666", textAlign: "center", padding: "60px 0", gridColumn: "1 / -1" }}>
//         No forms created yet.
//       </p>
//     ) : (
//       templates.map((t, index) => {
//         const activeFrom = t.active_from || t.activeFrom || null;
//         const activeTo = t.active_to || t.activeTo || null;
//         const fromStr = activeFrom ? new Date(activeFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
//         const toStr = activeTo ? new Date(activeTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
// const isActive = isFormActive(activeFrom, activeTo);        return (
//           <div 
//             key={`all-${t.id || index}`}   // ← Safe unique key
//             className="df-template-card"
//           >
//             <h4>{toTitleCase(t.form_name || t.name || "")}</h4>
//             <div style={{
//               margin: "14px 0 18px 0",
//               padding: "12px 14px",
//               background: isActive ? "#f0fdf4" : "#fef2f2",
//               borderRadius: "10px",
//               border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
//             }}>
//               <strong>Active Period:</strong><br />
//               {fromStr} — {toStr}<br />
//               <span style={{ color: isActive ? "#166534" : "#991b1b", fontWeight: "500" }}>
//                 {isActive ? " Currently Active" : " Not Active"}
//               </span>
//             </div>
//             <div className="df-template-actions">
//               <button onClick={() => viewTemplate(t)} className="df-view-btn">Preview</button>
//               <button onClick={() => editTemplate(t)} className="df-edit-btn">Edit</button>
//               <button onClick={() => viewResponses(t.id, t.form_name)} className="df-view-btn">Responses</button>
//             </div>
//           </div>
//         );
//       })
//     )
//   )} */}

//   {/* ==================== ALL FORMS TAB WITH DOWNLOAD EXCEL ==================== */}
// {activeTab === "all" && canSeeAllTab && (
//   templates.length === 0 ? (
//     <p style={{ color: "#666", textAlign: "center", padding: "60px 0", gridColumn: "1 / -1" }}>
//       No forms created yet.
//     </p>
//   ) : (
//     templates.map((t, index) => {
//       const activeFrom = t.active_from || t.activeFrom || null;
//       const activeTo = t.active_to || t.activeTo || null;
//       const fromStr = activeFrom ? new Date(activeFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
//       const toStr = activeTo ? new Date(activeTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
// const isActive = isFormActive(
//   t.active_from || t.activeFrom, 
//   t.active_to || t.activeTo
// );
//       return (
//         <div key={`all-${t.id || index}`} className="df-template-card">
//           <button
//   onClick={() => downloadFormResponsesAsExcel(t)}
//   style={{
//     padding: "8px 12px",
//     color: "#1f2937",
//     border: "none",
//     marginLeft: "auto",
//     borderRadius: "8px",
//     cursor: "pointer",
//     fontWeight: "600",
//     display: "flex",
//     alignItems: "center",
//     gap: "3px",
//     fontSize: "0.92rem"
//   }}
//   title="Download Responses as Excel"
// >
// <FiDownload size={16} />
// </button>
//           <h4>{toTitleCase(t.form_name || t.name || "")}</h4>

//           <div style={{
//             margin: "14px 0 18px 0",
//             padding: "12px 14px",
//             background: isActive ? "#f0fdf4" : "#fef2f2",
//             borderRadius: "10px",
//             border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
//           }}>
//             <strong>Active Period:</strong><br />
//             {fromStr} — {toStr}<br />
//             <span style={{ color: isActive ? "#166534" : "#991b1b", fontWeight: "500" }}>
//               {isActive ? " Currently Active" : " Not Active"}
//             </span>
//           </div>

//           <div
//   className="df-template-actions"
//   style={{
//     display: "flex",
//     gap: "8px",
//     flexWrap: "nowrap",
//     alignItems: "center"
//   }}
// >
//   <button onClick={() => viewTemplate(t)} className="df-view-btn">
//     Preview
//   </button>

//   <button onClick={() => editTemplate(t)} className="df-edit-btn">
//     Edit
//   </button>

//   <button
//     onClick={() => viewResponses(t.id, t.form_name)}
//     className="df-view-btn"
//   >
//     Responses
//   </button>
// </div>
//         </div>
//       );
//     })
//   )
// )}

//   {/* ==================== SELF FORMS TAB ==================== */}
// {/* ==================== SELF FORMS TAB (Fixed for Same Day) ==================== */}
// {activeTab === "self" && (
//   selfForms.length === 0 ? (
//     <p style={{ color: "#666", textAlign: "center", padding: "60px 0", gridColumn: "1 / -1" }}>
//       No forms assigned to you yet.
//     </p>
//   ) : (
//     selfForms.map((t, index) => {
//       const formActiveFrom = t.active_from || t.activeFrom || null;
//       const formActiveTo = t.active_to || t.activeTo || null;

//       const fromStr = formActiveFrom
//         ? new Date(formActiveFrom).toLocaleDateString('en-GB', { 
//             day: '2-digit', month: 'short', year: 'numeric' 
//           })
//         : "—";

//       const toStr = formActiveTo
//         ? new Date(formActiveTo).toLocaleDateString('en-GB', { 
//             day: '2-digit', month: 'short', year: 'numeric' 
//           })
//         : "—";

//       const isActive = isFormActive(formActiveFrom, formActiveTo);

//       return (
//         <div
//           key={`self-${t.id}-${index}`}
//           className="df-template-card"
//         >
//           <h4>{toTitleCase(t.form_name || t.name || "")}</h4>
//           <div style={{
//             margin: "14px 0 18px 0",
//             padding: "12px 14px",
//             background: isActive ? "#f0fdf4" : "#fef2f2",
//             borderRadius: "10px",
//             border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
//           }}>
//             <strong>Active Period:</strong><br />
//             {fromStr} — {toStr}<br />
//             <span style={{ 
//               color: isActive ? "#166534" : "#991b1b", 
//               fontWeight: "500" 
//             }}>
//               {isActive ? "Currently Active" : "Not Active Now"}
//             </span>
//           </div>
//           <button
//             onClick={() => fillTemplate(t)}
//             className="df-fill-btn"
//             disabled={!isActive}
//             style={{
//               opacity: isActive ? 1 : 0.65,
//               width: "100%",
//               cursor: isActive ? "pointer" : "not-allowed"
//             }}
//           >
//             {isActive ? "Fill Form" : "Not Active Now"}
//           </button>
//         </div>
//       );
//     })
//   )
// )}

// {/* Feedback Requests Tab */}
// {activeTab === "feedbackRequests" && (
//   feedbackRequests.length === 0 ? (
//     <p style={{ color: "#666", textAlign: "center", padding: "60px 0", gridColumn: "1 / -1" }}>
//       No feedback requests at the moment.
//     </p>
//   ) : (
//     feedbackRequests.map((req, idx) => (
//       <div key={`fb-${req.form_id}-${req.requester_id}-${idx}`} className="df-template-card">
//         <h4>{toTitleCase(req.form_name || `Form ${req.form_id}`)}</h4>
//         <div style={{ margin: "8px 0 12px 0", color: "#444" }}>
//           <div>
//             <strong>Requested by: </strong>
//             {formatRequesterDisplay(req.requester_id, req.requester_first_name, req.requester_last_name)}
//           </div>
//           {/* <div>
//             <strong>Field: </strong>
//             {req.fieldLabel || "Requested Feedback"}
//           </div> */}
//           <div style={{ marginTop: "8px", color: "#475569", whiteSpace: "pre-wrap" }}>
//             <strong>Context: </strong>
//             {req.requestContext || req.fieldValue || "No context available."}
//           </div>
//           {/* <div style={{ marginTop: "8px", color: "#475569", whiteSpace: "pre-wrap" }}>
//             <strong>Details: </strong>
//             {req.requestReason || "No additional details provided."}
//           </div> */}
//         </div>
//         <div className="df-template-actions">
//           {req.alreadyProvided && req.providedValue ? (
//             <div style={{ marginBottom: 8, color: '#0f172a' }}>
//               <strong>Your submitted feedback:</strong>
//               <div style={{ marginTop: 6, color: '#334155', whiteSpace: 'pre-wrap' }}>{req.providedValue}</div>
//             </div>
//           ) : null}
//           <button onClick={() => openOthersFeedback(req)} className="df-fill-btn">
//             {req.alreadyProvided ? 'View / Edit Feedback' : 'Provide Feedback'}
//           </button>
//         </div>
//       </div>
//     ))
//   )
// )}
//   {/* ==================== OTHERS TAB ==================== */}
//   {activeTab === "others" && (
//     otherForms.length === 0 ? (
//       <p style={{
//         color: "#666",
//         textAlign: "center",
//         padding: "60px 0",
//         gridColumn: "1 / -1"
//       }}>
//         No forms requiring other feedback are available yet.
//       </p>
//     ) : (
//       otherForms.map((t, index) => {
//         const formActiveFrom = t.active_from || t.activeFrom || null;
//         const formActiveTo = t.active_to || t.activeTo || null;

//         const fromStr = formActiveFrom
//           ? new Date(formActiveFrom).toLocaleDateString('en-GB', { 
//               day: '2-digit', month: 'short', year: 'numeric' 
//             })
//           : "—";

//         const toStr = formActiveTo
//           ? new Date(formActiveTo).toLocaleDateString('en-GB', { 
//               day: '2-digit', month: 'short', year: 'numeric' 
//             })
//           : "—";

//         const isActive = isFormActive(formActiveFrom, formActiveTo);

//         return (
//           <div
//             key={`others-${t.id}-${index}`}
//             className="df-template-card"
//           >
//             <h4>{toTitleCase(t.form_name || t.name || "")}</h4>
//             <div style={{
//               margin: "14px 0 18px 0",
//               padding: "12px 14px",
//               background: isActive ? "#f0fdf4" : "#fef2f2",
//               borderRadius: "10px",
//               border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
//             }}>
//               <strong>Active Period:</strong><br />
//               {fromStr} — {toStr}<br />
//               <span style={{ 
//                 color: isActive ? "#166534" : "#991b1b", 
//                 fontWeight: "500" 
//               }}>
//                 {isActive ? "Currently Active" : "Not Active Now"}
//               </span>
//             </div>
//             <p style={{ color: "#475569", marginBottom: "16px" }}>
//               This form can request feedback from a selected coworker and keeps other-feedback responses separate from your own answers.
//             </p>
//             <button
//               onClick={() => fillTemplate(t)}
//               className="df-fill-btn"
//               disabled={!isActive}
//               style={{
//                 opacity: isActive ? 1 : 0.65,
//                 width: "100%",
//                 cursor: isActive ? "pointer" : "not-allowed"
//               }}
//             >
//               {isActive ? "Fill Form" : "Not Active Now"}
//             </button>
//           </div>
//         );
//       })
//     )
//   )}
//   {/* ==================== TEAM TAB (Supervisor) ==================== */}
//   {activeTab === "team" && (
//     teamSubmissions.length === 0 ? (
//       <p style={{
//         color: "#666",
//         textAlign: "center",
//         padding: "60px 0",
//         gridColumn: "1 / -1",
//         fontSize: "16px"
//       }}>
//         No team submissions to review yet.
//       </p>
//     ) : (
//       Object.entries(
//         teamSubmissions.reduce((acc, sub) => {
//           const formId = sub.form_id || sub.formId || "unknown";
//           const formName = sub.form_name || "Supervisor Review";
//           if (!acc[formId]) {
//             acc[formId] = {
//               formId,
//               formName,
//               active_from: sub.active_from || sub.activeFrom || null,
//               active_to: sub.active_to || sub.activeTo || null,
//               submissions: []
//             };
//           }
//           acc[formId].submissions.push(sub);
//           return acc;
//         }, {})
//       ).map(([formId, group]) => {
//         const fromStr = group.active_from
//           ? new Date(group.active_from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
//           : "—";
//         const toStr = group.active_to
//           ? new Date(group.active_to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
//           : "—";
// const isActive = isFormActive(group.active_from, group.active_to);
//         return (
//           <div 
//             key={`team-${formId}`}   // ← Safe key for group
//             className="df-template-card"
//           >
//             <h4>{group.formName}</h4>
//             <div style={{
//               margin: "14px 0 18px 0",
//               padding: "12px 14px",
//               background: isActive ? "#f0fdf4" : "#fef2f2",
//               borderRadius: "10px",
//               border: `1px solid ${isActive ? "#86efac" : "#fecaca"}`,
//             }}>
//               <strong>Active Period:</strong><br />
//               {fromStr} — {toStr}<br />
//               <span style={{ color: isActive ? "#166534" : "#991b1b", fontWeight: "500" }}>
//                 {isActive ? " Currently Active" : " Not Active"}
//               </span>
//             </div>
//             <p style={{ color: "#666", marginBottom: "16px" }}>
//               {group.submissions.length} employee{group.submissions.length > 1 ? "s" : ""} submitted
//             </p>
//             <div
//   style={{
//     maxHeight: "180px",   // fixed height so card won't extend
//     overflowY: "auto",    // vertical scroll when more employees
//     paddingRight: "6px",
//     marginTop: "12px",
//   }}
// >
//   {group.submissions.map((sub, idx) => (
//     <div
//       key={`sub-${sub.form_id || sub.formId || formId}-${sub.employee_id || sub.employeeId || idx}`}
//       onClick={(e) => {
//         e.stopPropagation();
//         handleSelectSubmission(sub);
//       }}
//       style={{
//         padding: "10px 12px",
//         marginBottom: "8px",
//         background: "#f8f9fa",
//         borderRadius: "8px",
//         cursor: "pointer",
//         border: "1px solid #e9ecef",
//       }}
//       onMouseOver={(e) =>
//         (e.currentTarget.style.backgroundColor = "#e3f2fd")
//       }
//       onMouseOut={(e) =>
//         (e.currentTarget.style.backgroundColor = "#f8f9fa")
//       }
//     >
//       <strong>
//         {sub.employee_name ||
//           `Employee ${sub.employee_id || sub.employeeId || "Unknown"}`}
//       </strong>
//     </div>
//   ))}
// </div>
//           </div>
//         );
//       })
//     )
//   )}
// </div>
//           </div>
//         )}
//         {/* Preview Mode */}
// {/* Preview Mode - FIXED for Multiple Supervisor Fields + Placeholder */}
// {/* Preview Mode - FIXED: Dropdowns are now clickable */}
// {viewMode && selectedTemplate && (
//   <div className="df-preview">
//     <h3>{toTitleCase(selectedTemplate.form_name)} (Preview)</h3>
    
//     <div className="df-preview-notice" style={{
//       background: "#e0f2fe",
//       color: "#0369a1",
//       padding: "12px 16px",
//       borderRadius: "8px",
//       marginBottom: "20px",
//       fontSize: "0.95rem"
//     }}>
//       This is a preview. You can interact with fields (dropdowns, radio, etc.) to see how the form will look.
//     </div>

//     <form className={`df-form df-grid-layout df-grid-${selectedTemplate.layout || "one"}`}>
//       {(() => {
//         let formJson = selectedTemplate.form_json;
//         if (typeof formJson === 'string') {
//           try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
//         }

//         const fieldsToShow = [];

//         (formJson || []).forEach(f => {
//           // Employee Field
//           if (f.employee) {
//             fieldsToShow.push({
//               ...f.employee,
//               fieldId: f.id,
//               isSupervisor: false,
//               readOnly: false   // ← Important: Allow interaction in preview
//             });
//           } 
//           // Backward compatibility
//           else if (f.label && f.type) {
//             fieldsToShow.push({
//               ...f,
//               fieldId: f.id || `field_${Date.now()}`,
//               isSupervisor: false,
//               readOnly: false
//             });
//           }

//           // Supervisor Fields (Multiple)
//           if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
//             f.supervisorFields.forEach((sup, idx) => {
//               fieldsToShow.push({
//                 ...sup,
//                 fieldId: `${f.id}_sup_${idx}`,
//                 isSupervisor: true,
//                 readOnly: false
//               });
//             });
//           }
//         });

//         return fieldsToShow.map((field) => (
//           <div key={field.fieldId} className="df-form-group">
//             <label>
//               {field.label}
//               {field.required && <span className="required"> *</span>}
//               {field.isSupervisor && (
//                 <span style={{ color: "#2563eb", fontWeight: "600", marginLeft: "8px" }}>
//                   (Supervisor)
//                 </span>
//               )}
//             </label>
//             {/* Pass false so dropdown is NOT disabled in preview */}
//             {renderField(field, false)}
//           </div>
//         ));
//       })()}
//     </form>

//     <button
//       className="df-submit-btn"
//       onClick={() => setViewMode(false)}
//       style={{ marginTop: "25px" }}
//     >
//       Back to Form Management
//     </button>
//   </div>
// )}
//         {/* Fill / Review Mode */}
//         {fillMode && selectedTemplate && (
//           <div className="df-fill-preview">
//             <h3>
//   {toTitleCase(selectedTemplate.form_name)}
//   {isReviewMode && " — Supervisor Review"}
//   {hasSubmitted && !isReviewMode && " — Submitted"}
// </h3>
//             {hasSubmitted && !isReviewMode && !viewingSubmission ? (
//               <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8f9fa", borderRadius: "8px" }}>
//                 <h3>✅ Form Submitted Successfully</h3>
//                 <p>You have already submitted this form.</p>
//                 <button
//                   onClick={() => {
//                     setViewingSubmission(true);
//                     setFormData(submissionData?.response_json || {});
//                   }}
//                   className="df-submit-btn"
//                   style={{ marginTop: "15px" }}
//                 >
//                   View My Submission
//                 </button>
//               </div>
//             ) : feedbackSubmitted && submittedFeedbackData ? (
//               <div style={{ padding: "20px", background: "#dcfce7", border: "2px solid #22c55e", borderRadius: "12px", marginBottom: "24px" }}>
//                 <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
//                   <div style={{ fontSize: "32px" }}>✅</div>
//                   <div style={{ flex: 1 }}>
//                     <h3 style={{ margin: "0 0 12px 0", color: "#166534" }}>Feedback Submitted Successfully!</h3>
//                     <div style={{ background: "white", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
//                       <div style={{ marginBottom: "10px" }}>
//                         <strong style={{ color: "#0f172a" }}>Submitted to:</strong> {submittedFeedbackData.requesterName}
//                       </div>
//                       <div style={{ marginBottom: "10px" }}>
//                         <strong style={{ color: "#0f172a" }}>Time:</strong> {submittedFeedbackData.timestamp}
//                       </div>
//                       <div style={{ marginBottom: "0" }}>
//                         <strong style={{ color: "#0f172a" }}>Your Feedback:</strong>
//                         <div style={{ background: "#f1f5f9", padding: "12px", borderRadius: "6px", marginTop: "8px", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#334155" }}>
//                           {submittedFeedbackData.feedbackText}
//                         </div>
//                       </div>
//                     </div>
//                     <button
//                       onClick={() => {
//                         setOthersFeedbackContext(null);
//                         setFillMode(false);
//                         setFormData({});
//                         // Keep feedbackSubmitted and submittedFeedbackData to display the card persistently
//                       }}
//                       style={{
//                         padding: "10px 24px",
//                         background: "#16a34a",
//                         color: "white",
//                         border: "none",
//                         borderRadius: "6px",
//                         cursor: "pointer",
//                         fontWeight: "600"
//                       }}
//                     >
//                       Back to Forms
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <form className={`df-form df-grid-layout df-grid-${selectedTemplate.layout || "one"}`} onSubmit={(e) => { e.preventDefault(); submitFilledForm(); }}>
//                 {(() => {
//                   let fieldsToRender = [];
//                   let formJson = selectedTemplate.form_json || [];
//                   if (typeof formJson === 'string') {
//                     try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
//                   }
//                                    if (selectedTemplate.form_type === 'employee_supervisor') {
//                     formJson.forEach(f => {
//                       if (!f.employee) return;

//                       // Employee Field
//                       fieldsToRender.push({
//                         ...f.employee,
//                         isSupervisor: false,
//                         fieldId: f.id,
//                         readOnly: isReviewMode || viewingSubmission
//                       });

//                       // Multiple Supervisor Fields
//                       if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
//                         f.supervisorFields.forEach((sup, idx) => {
//                           const shouldShowToEmployee = sup.visibleToEmployee !== false;
//                           if (isReviewMode || shouldShowToEmployee) {
//                             fieldsToRender.push({
//                               ...sup,
//                               isSupervisor: true,
//                               fieldId: `${f.id}_sup_${idx}`,
//                               readOnly: !isReviewMode
//                             });
//                           }
//                         });
//                       } 
//                       // Backward compatibility (old single supervisor)
//                       else if (f.supervisor && (isReviewMode || f.supervisor.visibleToEmployee !== false)) {
//                         fieldsToRender.push({
//                           ...f.supervisor,
//                           isSupervisor: true,
//                           fieldId: f.id + '_sup',
//                           readOnly: !isReviewMode
//                         });
//                       }
//                     });
//                   } else {
//                     // Normal employee-only forms
//                     formJson.forEach(f => {
//                       const field = f.employee || f;
//                       fieldsToRender.push({
//                         ...field,
//                         isSupervisor: false,
//                         fieldId: f.id || field.id,
//                         readOnly: false
//                       });
//                     });
//                   } 
//             // Backward compatibility for old single supervisor
           
      
//                   const isOthersOnlyMode = Boolean(
//                     othersFeedbackContext &&
//                     othersFeedbackContext.requesterEmployeeId &&
//                     !isReviewMode &&
//                     !viewingSubmission
//                   );

//                   const feedbackRequesterName = othersFeedbackContext?.requesterName || "Selected colleague";
//                   const feedbackFieldKey = othersFeedbackContext?.feedbackKey;
//                   const feedbackLabel = othersFeedbackContext?.sourceLabel || "Requested Feedback";

//                   return (
//                     <>
//                       {isOthersOnlyMode ? (
//                         <div style={{ display: "grid", gap: "20px" }}>
//                           <div style={{ color: "#475569", marginBottom: "12px" }}>
//                             <strong>Others Feedback</strong> — submit your feedback separately for {feedbackRequesterName}. The main form fields are not shown here.
//                           </div>
//                           <div style={{ padding: "12px 14px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px" }}>
//                             <div style={{ fontWeight: 600, marginBottom: "8px", color: "#0f172a" }}>
//                               Request context
//                             </div>
//                             {/* <div style={{ marginBottom: "6px", color: "#334155" }}>
//                               <strong>Field:</strong> {othersFeedbackContext?.fieldLabel || feedbackLabel}
//                             </div> */}
//                               <div style={{ marginBottom: "6px", color: "#334155" }}>
//                               <strong>Requested by:</strong> {othersFeedbackContext?.requesterName || "Unknown requester"}
//                             </div>
//                             {/* <div style={{ marginBottom: "6px", color: "#334155" }}>
//                               <strong>Field:</strong> {othersFeedbackContext?.fieldLabel || feedbackLabel}
//                             </div> */}
//                             <div style={{ marginBottom: "6px", color: "#334155" }}>
//                               <strong>Current value:</strong> {othersFeedbackContext?.requestContext || "—"}
//                             </div>
//                             {/* <div style={{ color: "#475569", whiteSpace: "pre-wrap" }}>
//                               {othersFeedbackContext?.requestReason || "No additional details were provided by the requester."}
//                             </div> */}
//                           </div>
//                           <div className="df-form-group">
//                             <label>
//                               Feedback for {feedbackRequesterName}
//                               <span style={{ color: "#2563eb", fontWeight: "600", marginLeft: "8px" }}>
//                                 ({feedbackLabel})
//                               </span>
//                             </label>
//                             <textarea
//                               placeholder={`Enter feedback for ${feedbackRequesterName}`}
//                               className="df-input"
//                               rows={6}
//                               value={formData[feedbackFieldKey] || ""}
//                               onChange={(e) => handleInputChange(feedbackFieldKey, e.target.value)}
//                             />
//                           </div>
//                         </div>
//                       ) : (
//                         fieldsToRender.map((field) => {
//                           const isReadOnly = field.readOnly || false;
//                           return (
//                             <div key={field.fieldId} className="df-form-group">
//                               <label>
//                                 {field.label}
//                                 {field.required && (
//                                   <span style={{ color: "red" }}> *</span>
//                                 )}
//                                 {field.isSupervisor && (
//                                   <span style={{ color: "#2563eb", fontWeight: "600" }}>
//                                     {" "} (Supervisor)
//                                   </span>
//                                 )}
//                                 {isReadOnly && (isReviewMode || viewingSubmission) && " (Read Only)"}
//                               </label>
//                               {renderField(
//                                 field,
//                                 isReadOnly,
//                                 (id, value) => handleInputChange(id, value)
//                               )}
//                             </div>
//                           );
//                         })
//                       )}
//                     </>
//                   );
//                 })()}
//   {!viewingSubmission && (
//   <div style={{ 
//     display: "flex", 
//     gap: "16px", 
//     marginTop: "30px", 
//     justifyContent: "center",
//     flexWrap: "wrap"
//   }}>
//     {(() => {
//       const isOthersOnlyMode = Boolean(
//         othersFeedbackContext &&
//         othersFeedbackContext.requesterEmployeeId &&
//         !isReviewMode &&
//         !viewingSubmission
//       );

//       if (isOthersOnlyMode) {
//         return (
//           <button 
//             type="submit" 
//             className="df-submit-btn"
//             style={{ 
//               padding: "14px 32px",
//               minWidth: "200px",
//               background: "#16a34a"
//             }}
//             disabled={loading}
//           >
//             ✅ Submit Feedback
//           </button>
//         );
//       }

//       return (
//         <>
//           {/* Save Draft Button - Always available until final submit */}
//           <button 
//             type="button"
//             onClick={saveDraft}
//             className="df-submit-btn"
//             style={{ 
//               background: "#f59e0b", 
//               color: "white",
//               padding: "14px 32px",
//               minWidth: "180px"
//             }}
//             disabled={loading}
//           >
//             💾 Save Draft
//           </button>

//           {/* Final Submit Button */}
//           <button 
//             type="submit" 
//             className="df-submit-btn"
//             style={{ 
//               padding: "14px 32px",
//               minWidth: "180px",
//               background: "#16a34a"
//             }}
//             disabled={loading}
//           >
//             ✅ {isReviewMode ? "Submit Review" : "Final Submit"}
//           </button>
//         </>
//       );
//     })()}
//   </div>
// )}
//               </form>
//             )}
//         <button className="df-back-btn" onClick={() => {
//   setFillMode(false);
//   setIsReviewMode(false);
//   setViewingSubmission(false);
//   setSelectedSubmission(null);
//   setFormData({});
//   setHasSubmitted(false);
//   setFillSectionTab("main");
//   setSubmissionData(null);
//   setOthersFeedbackContext(null);
//   // Do NOT clear feedbackSubmitted and submittedFeedbackData to keep them visible
//   // Do NOT clear teamSubmissions here
// }}>
//   Back
// </button>
//           </div>
//         )}
      
// {showResponsesModal && (
//   <div className="df-modal-overlay">
//     <div className="df-modal df-responses-modal" style={{ maxWidth: "95%", width: "1100px", maxHeight: "90vh" }}>
//       <h3>Responses for "{currentFormTitle}"</h3>
      
//       <div style={{ marginBottom: "15px", fontSize: "0.95rem", color: "#475569" }}>
//         Total Assigned: <strong>{currentResponses.length}</strong> | 
//         Submitted: <strong style={{color: "#16a34a", fontWeight: "600"}}>
//           {currentResponses.filter(r => r.status === "submitted").length}
//         </strong> | 
//         Pending: <strong style={{color: "#ef4444"}}>
//           {currentResponses.filter(r => r.status === "not_submitted").length}
//         </strong>
//       </div>

//       {currentResponses.length === 0 ? (
//         <p>No employees assigned to this form yet.</p>
//       ) : (
//         <div style={{ overflow: "auto", maxHeight: "70vh" }}>
          
//          {currentResponses.map((resp, index) => {
//   const reviewedById = resp.metadata?.__reviewed_by;
//   let reviewedByName = "";
//   if (reviewedById) {
//     const supervisor = employees.find(
//       emp => String(emp.employee_id || emp.id) === String(reviewedById)
//     );
//     reviewedByName = supervisor
//       ? `${supervisor.first_name || ""} ${supervisor.middle_name || ""} ${supervisor.last_name || ""}`.trim() || `Supervisor ${reviewedById}`
//       : `Supervisor ${reviewedById}`;
//   }

//   const isExpanded = expandedResponses.has(index);
//   const isNotSubmitted = resp.status === "not_submitted";

//   return (
//     <div
//       key={index}
//       style={{
//         marginBottom: "20px",
//         border: isNotSubmitted ? "1px solid #dee2e6" : "1px solid #4ade80",
//         borderRadius: "10px",
//         overflow: "hidden",
//         backgroundColor: isNotSubmitted ? "#fef2f2" : "#f0fdf4",
//       }}
//     >
//       {/* Improved Header with Proper Employee Name */}
//       <div
//         onClick={() => !isNotSubmitted && toggleResponse(index)}
//         style={{
//           padding: "16px 20px",
//           backgroundColor: isNotSubmitted ? "#fee2e2" : "#ecfdf5",
//           cursor: isNotSubmitted ? "default" : "pointer",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <div>
//           <strong style={{ fontSize: "1.12rem", color: "#1e2937" }}>
//             Employee: {resp.employeeDisplay || 
//               `${resp.employee_first_name || ""} ${resp.employee_middle_name || ""} ${resp.employee_last_name || ""}`.trim() || 
//               `Employee ${resp.employee_id || "Unknown"}`}
//           </strong>
          
//           {reviewedByName && (
//             <div style={{ marginTop: "6px", fontSize: "0.95rem", color: "#475569" }}>
//               Reviewed By: <strong>{reviewedByName}</strong>
//             </div>
//           )}
//         </div>

//         {!isNotSubmitted && (
//           <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
//             <span style={{ color: "#555", fontSize: "0.93rem" }}>
//               Submitted: {formatSubmittedTime(resp.submitted_at)}
//             </span>
//             <span style={{ 
//               fontSize: "1.55rem", 
//               transition: "transform 0.3s ease", 
//               transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" 
//             }}>
//               ▼
//             </span>
//           </div>
//         )}
//       </div>

//       {/* Content */}
//   {/* Content */}
// {!isNotSubmitted && isExpanded && (
//   <div style={{ padding: "20px" }}>
//     <table style={{ width: "100%", borderCollapse: "collapse" }}>
//       <thead>
//         <tr style={{ backgroundColor: "#f1f3f5" }}>
//           <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "2px solid #cbd5e1" }}>Field</th>
//           <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "2px solid #cbd5e1" }}>Response</th>
//         </tr>
//       </thead>
//       <tbody>
//         {(resp.readableAnswers || []).map((answerItem, i) => {
//           const response = answerItem.response;
//           const fieldType = answerItem.type || null;

//           return (
//             <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
//               <td style={{ padding: "14px 16px", fontWeight: "500", verticalAlign: "top" }}>
//                 {answerItem.label}
//               </td>
//               <td style={{ padding: "14px 16px", backgroundColor: "#f8fafc", verticalAlign: "top" }}>
//                 {renderResponseValue(response, fieldType)}
//               </td>
//             </tr>
//           );
//         })}
//       </tbody>
//     </table>

//           {/* Metadata */}
//           {resp.metadata && Object.keys(resp.metadata).length > 0 && (
//             <div style={{
//               marginTop: "20px",
//               padding: "16px",
//               backgroundColor: "#fff8e1",
//               borderRadius: "8px",
//               border: "1px solid #f0ad4e"
//             }}>
//               <strong style={{ color: "#854d0e", display: "block", marginBottom: "12px" }}>
//                 Additional Information:
//               </strong>
//               <ul style={{ margin: "0 0 0 20px", padding: 0, listStyleType: "disc", color: "#713f12" }}>
//                 {Object.entries(resp.metadata)
//                  .filter(([metaKey]) => {
//   const key = metaKey.toLowerCase().replace(/^__/, "");
//   return !(
//     key === "orgid" || key === "org_id" ||
//     key === "formid" || key === "form_id" ||
//     key === "isreview" || key === "is_review" ||
//     key === "reviewed_employee" || key === "reviewedemployee" ||
//     key === "reviewed_at" || key === "reviewedat" ||

//     // Hide draft fields
//     key === "isdraft" || key === "is_draft" ||

//     // Hide last updated fields
//     key === "lastupdated" || key === "last_updated" ||
//     key === "updatedat" || key === "updated_at"
//   );
// })
//                   .map(([metaKey, metaValue]) => {
//                     let displayKey = metaKey.replace(/^__/, "").replace(/_/g, " ");
//                     let displayValue = metaValue;
//                     if (metaKey.toLowerCase().includes("submitted_at") || 
//                         metaKey.toLowerCase().includes("reviewed_at")) {
//                       displayValue = metaValue 
//                         ? new Date(metaValue).toLocaleString("en-IN", { 
//                             timeZone: "Asia/Kolkata",
//                             day: "2-digit", month: "short", year: "numeric",
//                             hour: "2-digit", minute: "2-digit", hour12: true 
//                           }) 
//                         : "—";
//                     }
//                     return (
//                       <li key={metaKey} style={{ marginBottom: "6px" }}>
//                         <strong>{toTitleCase(displayKey)}:</strong> {displayValue || "—"}
//                       </li>
//                     );
//                   })}
//               </ul>
//             </div>
//           )}
//         </div>
//       )}

//       {isNotSubmitted && (
//         <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>
//           This employee has not submitted the form yet.
//         </div>
//       )}
//     </div>
//   );
// })}
//         </div>
//       )}

//       <div className="df-modal-actions" style={{ marginTop: "25px", textAlign: "right" }}>
//         <button
//           onClick={() => {
//             setShowResponsesModal(false);
//             setExpandedResponses(new Set());
//           }}
//           style={{
//             padding: "12px 28px",
//             background: "#16a34a",
//             color: "white",
//             border: "none",
//             borderRadius: "8px",
//             cursor: "pointer",
//             fontSize: "1rem"
//           }}
//         >
//           Close
//         </button>
//       </div>
//     </div>
//   </div>
// )}
//       </div>
//       {/* Alert Modal */}
//       <Modal
//         isVisible={alertModal.isVisible}
//         onClose={closeAlert}
//         buttons={[
//           {
//             label: "OK",
//             onClick: closeAlert,
//           },
//         ]}
//       >
//         <div style={{ textAlign: "center" }}>
//           {alertModal.title && (
//             <h3
//               style={{
//                 margin: "0 0 16px 0",
//                 color:
//                   alertModal.type === "error"
//                     ? "#dc3545"
//                     : alertModal.type === "success"
//                     ? "#28a745"
//                     : alertModal.type === "warning"
//                     ? "#ffc107"
//                     : "#0d6efd",
//               }}
//             >
//               {alertModal.title}
//             </h3>
//           )}
//           <p style={{ margin: "0", whiteSpace: "pre-line" }}>{alertModal.message}</p>
//         </div>
//       </Modal>
//     </>
//   );
// }





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
    (typeof window !== "undefined" ? window.__ORG_ID : null) ??
    null;
  const currentEmployeeId =
    user?.employeeId ??
    user?.employee_id ??
    user?.id ??
    user?.empId ??
    user?.emp_id ??
    user?.raw?.employeeId ??
    user?.raw?.employee_id ??
    user?.raw?.id ??
    user?.raw?.empId ??
    user?.raw?.emp_id ??
    (typeof window !== "undefined" ? window.__EMPLOYEE_ID : null) ??
    null;
  const getHeaders = (extra = {}, omitContentType = false) => {
    const base = {
      "x-api-key": API_KEY || "",
      ...extra,
    };
    if (!omitContentType) base["Content-Type"] = "application/json";
    if (orgId) base["x-org-id"] = String(orgId);
    if (currentEmployeeId) base["x-employee-id"] = String(currentEmployeeId);
    return base;
  };



const renderResponseValue = (response, fieldType = null) => {
  if (response === undefined || response === null || response === "") return "—";

  // Checkbox handling
  if (fieldType === "checkbox" || typeof response === "boolean") {
    return response === true || response === "true" ? 
      <strong style={{ color: "#16a34a" }}>✅ Yes / Checked</strong> : 
      <span style={{ color: "#ef4444" }}>❌ No / Unchecked</span>;
  }

  // File handling
  if (Array.isArray(response)) {
    const isFileArray = response.some(item => 
      item && typeof item === "object" && (item.originalname || item.name || item.filename)
    );

    if (isFileArray) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {response.map((file, index) => {
        let name = `File ${index + 1}`;
        if (file && typeof file === "object") {
          name = file.originalname || file.filename || file.name || name;
        }

        const url = getFileUrl(file);
        return (
          <div key={index} style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <span>📎 {name}</span>
            {url && (
              <>
                <button type="button" onClick={() => viewFile(file)} style={{ color: "#2563eb", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>
                  View
                </button>
                <button type="button" onClick={() => downloadFile(file, name)} style={{ border: "none", background: "transparent", color: "#16a34a", textDecoration: "underline", cursor: "pointer" }}>
                  Download
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
    return response.join(", ");
  }

  // Single file object
  if (response && typeof response === "object" && (response.originalname || response.name || response.filename)) {
    const url = getFileUrl(response);
    const name = response.originalname || response.name || response.filename || "File";
    return (
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span>📎 {name}</span>
        {url && (
          <>
            <button type="button" onClick={() => viewFile(response)} style={{ color: "#2563eb", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>
              View
            </button>
            <button type="button" onClick={() => downloadFile(response, name)} style={{ border: "none", background: "none", color: "#16a34a", cursor: "pointer" }}>Download</button>
          </>
        )}
      </div>
    );
  }

  return String(response);
};
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
  const [formResponses, setFormResponses] = useState([]);
  const [feedbackRequests, setFeedbackRequests] = useState([]);
  const [othersFeedbackContext, setOthersFeedbackContext] = useState(null);
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
const [isDraft, setIsDraft] = useState(false);
const [draftId, setDraftId] = useState(null); // to track draft record if needed

const [fieldReferenceFile, setFieldReferenceFile] = useState(null);
const [fieldNeedsOthersFeedback, setFieldNeedsOthersFeedback] = useState(false);
const [fillSectionTab, setFillSectionTab] = useState("main");
const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
const [submittedFeedbackData, setSubmittedFeedbackData] = useState(null);

const isFormActive = (from, to) => {
  if (!from && !to) return true;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // End of today

  let fromDate = from ? new Date(from) : null;
  let toDate = to ? new Date(to) : null;

  // Normalize dates to remove time component for comparison
  if (fromDate) fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  if (toDate) toDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999);

  if (fromDate && isNaN(fromDate.getTime())) return true;
  if (toDate && isNaN(toDate.getTime())) return true;

  // If both dates are set
  if (fromDate && toDate) {
    return now >= fromDate && now <= toDate;
  }

  // Only from date
  if (fromDate) {
    return now >= fromDate;
  }

  // Only to date
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

  let dateStr = "";

  if (typeof value === "string") {
    dateStr = value.trim().split("T")[0].split(" ")[0];
  } else if (value instanceof Date) {
    dateStr = value.toISOString().slice(0, 10);
  }

  if (!dateStr) return "";

  // Reject clearly invalid dates
  if (
    dateStr.startsWith("1900") || 
    dateStr.startsWith("9999") || 
    dateStr.startsWith("0001") || 
    dateStr.startsWith("0000")
  ) {
    return "";
  }

  // Validate proper YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const year = parseInt(dateStr.substring(0, 4));
    if (year >= 1950 && year <= 2100) {   // Reasonable range
      return dateStr;
    }
  }

  return "";   // Everything else → empty
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
  // fetch feedback requests for current user
  const fetchFeedbackRequests = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/forms/feedback-requests`, {
        method: 'GET',
        credentials: 'include',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch feedback requests');
      const json = await res.json();
      setFeedbackRequests(json.data || []);
    } catch (err) {
      console.error('Failed to fetch feedback requests:', err);
      setFeedbackRequests([]);
    }
  };

  fetchForms();
  fetchSelfForms();

  if (isSupervisor || isHR) {
    fetchTeamSubmissions();
  }
  fetchFeedbackRequests();
}, [orgId, currentEmployeeId, isSupervisor, isHR]);   // Removed canBuildForms to avoid unnecessary re-renders
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

  const hasOthersFeedbackField = (template) => {
    if (!template) return false;
    let formJson = template.form_json || [];
    if (typeof formJson === "string") {
      try {
        formJson = JSON.parse(formJson);
      } catch (e) {
        formJson = [];
      }
    }
    return Array.isArray(formJson) && formJson.some((f) => f.employee?.needsOthersFeedback === true);
  };

  const otherForms = selfForms.filter(hasOthersFeedbackField);
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

      setFieldNeedsOthersFeedback(field.employee?.needsOthersFeedback === true);

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
};  


const addOrUpdateField = () => {
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
    referenceFile: fieldReferenceFile || undefined,
    ...(fieldNeedsOthersFeedback ? { needsOthersFeedback: true } : {}),
  };

  // File specific settings
  if (fieldType === "file") {
    employeeConfig.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
    employeeConfig.multiple = false;
  }

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

  // Reset
  setFieldLabel("");
  setFieldType("text");
  setFieldRequired(false);
  setFieldPlaceholder("");
  setFieldReferenceFile(null);     // Reset reference file
  setOptionsInput("");
  setFieldNeedsOthersFeedback(false);
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

    const referenceFiles = [];
    const formJsonForSave = fields.map((field) => {
      const fieldKey = field.id || field.fieldId || "";
      const cloned = { ...field };

      const maybeAddFile = (file, location) => {
        if (!(file instanceof File) || !fieldKey) return;
        referenceFiles.push({ fieldKey, file });
        if (location === "top") {
          cloned.referenceFile = { name: file.name };
        } else if (location === "employee") {
          cloned.employee = { ...cloned.employee, referenceFile: { name: file.name } };
        } else if (location === "supervisor") {
          cloned.supervisor = { ...cloned.supervisor, referenceFile: { name: file.name } };
        }
      };

      maybeAddFile(field.referenceFile, "top");
      maybeAddFile(field.employee?.referenceFile, "employee");
      maybeAddFile(field.supervisor?.referenceFile, "supervisor");

      return cloned;
    });

    const requestOptions = {
      method,
      credentials: "include",
      headers: {},
    };

    if (referenceFiles.length > 0) {
      const formData = new FormData();
      formData.append("form_name", formName.trim());
      formData.append("form_json", JSON.stringify(formJsonForSave));
      formData.append("layout", layoutMode);
      formData.append("active_from", activeFrom || "");
      formData.append("active_to", activeTo || "");
      formData.append("form_type", formType);

      referenceFiles.forEach(({ fieldKey, file }) => {
        if (!fieldKey) return;
        formData.append(`referenceFile_${fieldKey}`, file);
      });

      requestOptions.headers = getHeaders({}, true);
      requestOptions.body = formData;
    } else {
      requestOptions.headers = getHeaders();
      requestOptions.body = JSON.stringify({
        form_name: formName.trim(),
        form_json: formJsonForSave,
        layout: layoutMode,
        active_from: activeFrom || null,
        active_to: activeTo || null,
        form_type: formType,
      });
    }

    const res = await fetch(url, requestOptions);

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
      cache: 'no-store',
    });
    if (!res.ok) throw new Error("Failed to fetch form");
    
    const json = await res.json();
    let form = json.data || json;

    if (typeof form.form_json === 'string') {
      form.form_json = JSON.parse(form.form_json);
    }

    setSelectedTemplate(form);
    setViewMode(true);
    setFillMode(false);
    setIsReviewMode(false);
  } catch (err) {
    console.error(err);
    showAlert("Failed to load preview", "Error", "error");
  } finally {
    setLoading(false);
  }
};
const fillTemplate = async (template) => {
  try {
    setLoading(true);
    setError(null);

    const formRes = await fetch(`${BACKEND_URL}/api/forms/${template.id}`, {
      method: "GET",
      credentials: "include",
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!formRes.ok) throw new Error("Failed to load latest form");

    const formJson = await formRes.json();
    let form = formJson.data || formJson;

    if (typeof form.form_json === 'string') {
      try { form.form_json = JSON.parse(form.form_json); } catch (e) { form.form_json = []; }
    }

    setSelectedTemplate(form);
    setViewMode(false);
    setFillMode(true);
    setIsReviewMode(false);
    setViewingSubmission(false);

    const responseRes = await fetch(`${BACKEND_URL}/api/forms/${template.id}/responses`, {
      method: "GET",
      credentials: "include",
      headers: getHeaders(),
    });

    let rawResponses = [];
    if (responseRes.ok) {
      const respJson = await responseRes.json();
      rawResponses = Array.isArray(respJson) ? respJson : respJson.data || respJson.responses || [];
    }

    const isOthersOnlyMode = Boolean(othersFeedbackContext?.requesterEmployeeId);

    if (isOthersOnlyMode) {
      // Keep your existing others feedback code unchanged
    } else {
      const userResponse = rawResponses.find(r => 
        String(r.employee_id || r.employeeId) === String(currentEmployeeId)
      );

      if (userResponse?.response_json) {
        let responseData = typeof userResponse.response_json === 'string'
          ? JSON.parse(userResponse.response_json)
          : userResponse.response_json || {};

        // 🔥 STRONG FILE NORMALIZATION
        Object.keys(responseData).forEach(key => {
          let val = responseData[key];
          if (!val) return;

          if (Array.isArray(val)) {
            // Remove empty/invalid entries
            responseData[key] = val.filter(item => 
              item && (item.originalname || item.filename || item.name || item instanceof File)
            );
          } else if (val && typeof val === "object" && (val.originalname || val.filename || val.name)) {
            // Convert single file object → array (most common cause of validation failure)
            responseData[key] = [val];
          }
        });

        setFormData(responseData);
        setSubmissionData(userResponse);

        const isDraftStatus = responseData.__is_draft === true;
        setHasSubmitted(!isDraftStatus);
        setIsDraft(isDraftStatus);

        console.log("✅ Draft loaded with", Object.keys(responseData).length, "fields");
      } else {
        setFormData({});
        setHasSubmitted(false);
        setIsDraft(false);
      }
    }

  } catch (err) {
    console.error("Fill template error:", err);
    showAlert("Failed to load the latest form version.", "Error", "error");
  } finally {
    setLoading(false);
  }
};
const formatRequesterDisplay = (requesterId, requesterFirstName, requesterLastName) => {
  const requesterName = `${requesterFirstName || ''} ${requesterLastName || ''}`.trim();
  if (requesterId && requesterName) {
    return `${requesterId} — ${requesterName}`;
  }
  if (requesterName) {
    return requesterName;
  }
  return requesterId || "Unknown requester";
};

// Open a form as a recipient to provide "others" feedback for a specific requester
// Replace your current openOthersFeedback
const openOthersFeedback = (req) => {
  try {
    if (!req || !req.form_id) return;

    const requesterName = formatRequesterDisplay(
      req.requester_id, 
      req.requester_first_name, 
      req.requester_last_name
    );

    const fieldId = req.fieldId || `${req.form_id}_others_feedback`;

    setOthersFeedbackContext({ 
      requesterEmployeeId: req.requester_id,
      requesterName,
      fieldId,
      fieldLabel: req.fieldLabel || "Requested Feedback",
      requestContext: req.requestContext || req.fieldValue || null,
      requestReason: req.requestReason || null,
      feedbackKey: `${fieldId}_others_feedback_from_${currentEmployeeId}`,
      sourceLabel: req.sourceLabel || 'Requested Feedback',
    });

    // Clear previous feedback state
    setFeedbackSubmitted(false);
    setSubmittedFeedbackData(null);

    setTimeout(() => {
      fillTemplate({ 
        id: req.form_id, 
        form_name: req.form_name, 
        openOthersFeedbackMode: true 
      });
      console.log("feedbackKey =", feedbackKey);
console.log("existingFeedback =", existingFeedback);
console.log("responseJson =", requesterResponse.response_json);
    }, 10);

  } catch (err) {
    console.error('openOthersFeedback error:', err);
    showAlert("Failed to open feedback form", "Error", "error");
  }
};

const saveDraft = async (e) => {
  e?.preventDefault();
  e?.stopPropagation();
  if (!selectedTemplate?.id) return;
  return submitFormWithFiles(true);
};
const handleSelectSubmission = async (submission) => {
  console.log("Selected submission for review:", submission);

  setSelectedSubmission(submission);
const responseData =
  typeof submission.response_json === "string"
    ? JSON.parse(submission.response_json)
    : submission.response_json || {};

setFormData(responseData);

console.log("Loaded formData:", responseData);
  setIsReviewMode(true);
  setFillMode(true);
  setViewingSubmission(false);

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
          try { 
            form.form_json = JSON.parse(form.form_json); 
          } catch (e) { 
            form.form_json = []; 
          }
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
      if (f.employee) {
        fieldsToValidate.push({ ...f.employee, fieldId: f.id, isSupervisor: false });
      }
      if (f.supervisorFields) {
        f.supervisorFields.forEach((sup, idx) => {
          fieldsToValidate.push({ 
            ...sup, 
            fieldId: `${f.id}_sup_${idx}`, 
            isSupervisor: true 
          });
        });
      }
    });
  } else {
    formJson.forEach(f => {
      const field = f.employee || f;
      fieldsToValidate.push({ 
        ...field, 
        fieldId: f.id || field.id, 
        isSupervisor: false 
      });
    });
  }

 fieldsToValidate.forEach(field => {

  // ✅ IMPORTANT FIX
  if (field.isSupervisor && !isReviewMode) {
    return;
  }

  const fieldId = field.fieldId;
  const value = formData[fieldId];
  const isRequired = field.required === true;

  if (!isRequired) return;

  let hasValue = false;

  if (field.type === "file") {
    hasValue =
      Array.isArray(value) &&
      value.length > 0;
  } 
  else if (Array.isArray(value)) {
    hasValue = value.length > 0;
  } 
  else if (typeof value === "string") {
    hasValue = value.trim() !== "";
  } 
  else {
    hasValue = !!value;
  }

  if (!hasValue) {
    isValid = false;
    errors.push(`"${field.label}" is required`);
  }
});

  if (!isValid) {
    showAlert("Please fill all required fields:\n\n" + errors.join("\n"), "Error", "error");
  }
  return isValid;
};
const submitFormWithFiles = async (isDraft = false) => {
  if (!selectedTemplate?.id) return;

  const isOthersOnlyMode = Boolean(
    othersFeedbackContext &&
    othersFeedbackContext.requesterEmployeeId &&
    !isReviewMode &&
    !viewingSubmission
  );

  if (!isDraft) {
    if (isOthersOnlyMode) {
      const feedbackKey = othersFeedbackContext?.feedbackKey;
      const feedbackValue = formData[feedbackKey];
      if (!feedbackValue || String(feedbackValue).trim() === "") {
        showAlert("Please provide feedback before submitting.", "error");
        return;
      }
    } else if (!validateForm()) {
      return;
    }
  }

  setLoading(true);

  try {
    const resolvedOrgId = orgId || (typeof window !== "undefined" ? window.__ORG_ID : "") || "unknown";
    const resolvedEmployeeId = currentEmployeeId || (typeof window !== "undefined" ? window.__EMPLOYEE_ID : "") || "unknown";

    if (!resolvedOrgId || !resolvedEmployeeId) {
      throw new Error("Missing employee or organization ID. Please refresh and login again.");
    }

    // === OTHERS FEEDBACK PATH ===
    if (isOthersOnlyMode && othersFeedbackContext?.requesterEmployeeId) {
      const requesterId = String(othersFeedbackContext.requesterEmployeeId);
      const feedbackKey = othersFeedbackContext.feedbackKey ||
        `${othersFeedbackContext.fieldId}_others_feedback_from_${currentEmployeeId}`;
      const feedbackValue = formData[feedbackKey];

      if (!feedbackValue || String(feedbackValue).trim() === "") {
        showAlert("Feedback cannot be empty", "error");
        setLoading(false);
        return;
      }

      const feedbackEntries = {
        [othersFeedbackContext.fieldId]: feedbackValue
      };

      const res = await fetch(`${BACKEND_URL}/api/forms/${selectedTemplate.id}/others-feedback`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY || "",
          "x-org-id": resolvedOrgId,
          "x-employee-id": resolvedEmployeeId,
        },
        body: JSON.stringify({ requesterEmployeeId: requesterId, feedbackEntries }),
      });

      if (!res.ok) throw new Error("Feedback submission failed");

      showAlert("✅ Feedback submitted successfully!", "Success", "success");

      // Refresh to show saved feedback
      const refreshRes = await fetch(`${BACKEND_URL}/api/forms/${selectedTemplate.id}/responses`, {
        method: "GET",
        credentials: "include",
        headers: getHeaders(),
      });
console.log("response_json:", userResponse?.response_json);
      if (refreshRes.ok) {
        const json = await refreshRes.json();
        const raw = Array.isArray(json) ? json : json.data || json.responses || [];
        const requesterResp = raw.find(r => String(r.employee_id || r.employeeId) === requesterId);
        if (requesterResp?.response_json) {
          const fullJson = typeof requesterResp.response_json === "string"
            ? JSON.parse(requesterResp.response_json)
            : requesterResp.response_json;
          setFormData(fullJson);
          const savedFeedback = fullJson[feedbackKey];
          if (savedFeedback) {
            setSubmittedFeedbackData({
              feedbackText: savedFeedback,
              requesterName: othersFeedbackContext.requesterName || "Unknown",
              timestamp: requesterResp.submitted_at || new Date().toISOString()
            });
            setFeedbackSubmitted(true);
          }
        }
      }
      return;
    }
    
// === NORMAL SUBMIT / DRAFT PATH ===
const formDataToSend = new FormData();
const cleanFormData = {};

Object.keys(formData).forEach(key => {
  const value = formData[key];
  
if (value instanceof File) {
   formDataToSend.append(key, value);
   cleanFormData[key] = {
      name: value.name
   };
}
else if (value && Array.isArray(value) && value.length > 0){
    const newFiles = value.filter(item => item instanceof File);
    // ✅ Accept ANY object as a saved file - don't filter by specific properties
    const savedFiles = value.filter(item => 
      item && typeof item === "object" && !(item instanceof File)
    );
    
    if (newFiles.length > 0) {
      newFiles.forEach(file => formDataToSend.append(key, file));
    }
    // Keep all saved file objects in JSON
    cleanFormData[key] = savedFiles.length > 0 ? savedFiles : value;
  } else {
    cleanFormData[key] = value;
  }
});

const responsePayload = {
  ...cleanFormData,
  __submitted_by: currentEmployeeId,
  __last_updated: new Date().toISOString(),
};

if (isDraft) {
  responsePayload.__is_draft = true;
  responsePayload.__saved_at = new Date().toISOString();
  responsePayload.__saved_by = currentEmployeeId;
} else {
  responsePayload.__is_draft = false;
  responsePayload.__submitted_at = new Date().toISOString();
}

if (isReviewMode) {
  responsePayload.__reviewed_by = currentEmployeeId;
  responsePayload.__reviewed_employee = selectedSubmission?.employee_id || selectedSubmission?.employeeId;
  responsePayload.__is_review = true;
}

formDataToSend.append("response_json", JSON.stringify(responsePayload));
formDataToSend.append("isDraft", String(isDraft));
formDataToSend.append("isReview", String(isReviewMode));

if (isReviewMode && selectedSubmission) {
  formDataToSend.append(
    "reviewedEmployeeId", 
    selectedSubmission.employee_id || selectedSubmission.employeeId
  );
}

// ❌ DELETE the second file loop that was here - it was re-appending files
// and mutating responsePayload after it was already serialized

const res = await fetch(`${BACKEND_URL}/api/forms/${selectedTemplate.id}/submit`, {
  method: "POST",
  credentials: "include",
  headers: {
    "x-api-key": API_KEY || "",
    "x-org-id": resolvedOrgId,
    "x-employee-id": resolvedEmployeeId,
  },
  body: formDataToSend,
});
    if (!res.ok) throw new Error("Submission failed");

    showAlert(
      isDraft ? "✅ Draft saved successfully! You can continue later." :
      isReviewMode ? "Review submitted successfully!" : "✅ Form submitted successfully!",
      "Success",
      "success"
    );

    setHasSubmitted(!isDraft);
    setIsDraft(isDraft);

    if (!isDraft) {
      setFillMode(false);
    }

  } catch (err) {
    console.error("Submit error:", err);
    showAlert("Failed to submit: " + err.message, "Error", "error");
  } finally {
    setLoading(false);
  }
};


const submitFilledForm = () => submitFormWithFiles(false);
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
if (supervisorType === "file") {
  newSupField.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
  newSupField.multiple = false;
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
// ==================== IMPROVED FILE PATH HELPERS ====================

const normalizeFilePath = (raw) => {
  console.log("[normalizeFilePath] Input:", raw);
  if (!raw) return null;

  if (typeof raw === "string") {
    let str = raw.replace(/\\/g, "/").trim();
    if (str.startsWith("http")) return str;
    // Take only the filename part
    const result = str.split("/").pop();
    console.log("[normalizeFilePath] String result:", result);
    return result;
  }

  if (typeof raw === "object") {
    const result = normalizeFilePath(
      raw.filename || 
      raw.originalname || 
      raw.path || 
      raw.file_url || 
      raw.name
    );
    console.log("[normalizeFilePath] Object result:", result);
    return result;
  }

  const result = String(raw);
  console.log("[normalizeFilePath] Default result:", result);
  return result;
};

const getFileUrl = (file) => {
  console.log("[getFileUrl] Input file:", file);
  if (!file) return null;

  // Local file during form fill
  if (file instanceof File) {
    console.log("[getFileUrl] Local File object, creating object URL");
    return URL.createObjectURL(file);
  }

  const filename = normalizeFilePath(file);
  console.log("[getFileUrl] Normalized filename:", filename);
  if (!filename) {
    console.warn("[getFileUrl] Could not normalize file path");
    return null;
  }

  if (filename.startsWith("http")) {
    console.log("[getFileUrl] URL is absolute");
    return filename;
  }

  const base = BACKEND_URL ? BACKEND_URL.replace(/\/+$/, "") : "";
  const org = orgId || 1;
  const url = `${base}/api/forms/download/${org}/${encodeURIComponent(filename)}`;
  console.log("[getFileUrl] Constructed URL:", url);
  
  return url;
};
// 3. Keep the latest viewFile and downloadFile (with headers)
const viewFile = async (file) => {
  const url = getFileUrl(file);
  console.log("[viewFile] URL:", url, "File:", file);

  if (!url) {
    showAlert("Cannot generate file URL", "Error", "error");
    return;
  }

  try {
    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      showAlert("Please allow popups", "Warning", "warning");
      return;
    }

    // Show clean loading state
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loading File...</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: system-ui, sans-serif;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: #334155;
          }
          .loader {
            border: 4px solid #e2e8f0;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <h3>Loading file...</h3>
      </body>
      </html>
    `);
    newWindow.document.close();

    const res = await fetch(url, {
      credentials: "include",
      headers: getHeaders()
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const contentType = res.headers.get("content-type") || blob.type || "";
    const fileName = file?.originalname || file?.name || file?.filename || "file";

    let htmlContent = "";

    if (contentType.includes("pdf")) {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${fileName}</title>
          <style>
            body, iframe { margin:0; padding:0; width:100%; height:100vh; border:none; }
          </style>
        </head>
        <body>
          <iframe src="${blobUrl}" title="${fileName}"></iframe>
        </body>
        </html>`;
    } else if (contentType.startsWith("image/")) {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${fileName}</title>
          <style>
            body {
              margin:0; padding:0; 
              display:flex; justify-content:center; align-items:center;
              background:#111; height:100vh;
            }
            img { max-width:100%; max-height:100vh; }
          </style>
        </head>
        <body>
          <img src="${blobUrl}" alt="${fileName}"/>
        </body>
        </html>`;
    } else {
      // Fallback: direct navigation
      newWindow.location.href = blobUrl;
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return;
    }

    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);

  } catch (err) {
    console.error("[viewFile] Error:", err);
    showAlert("Failed to preview: " + err.message, "Info");

    // Fallback
    window.open(url, "_blank");
  }
};

const downloadFile = (file, suggestedName = null) => {
  const url = getFileUrl(file);
  if (!url) {
    console.error("[downloadFile] Cannot generate URL for file:", file);
    showAlert("Cannot download file - invalid file reference", "Error", "error");
    return;
  }

  console.log("[downloadFile] Starting download from URL:", url);
  
  fetch(url, { credentials: "include", headers: getHeaders() })
    .then(res => {
      console.log("[downloadFile] Fetch response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.blob();
    })
    .then(blob => {
      console.log("[downloadFile] Blob received, size:", blob.size);
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = suggestedName || file?.originalname || file?.name || file?.filename || "file";
      document.body.appendChild(a);
      console.log("[downloadFile] Triggering download as:", a.download);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      showAlert("File downloaded successfully", "Success", "success");
    })
    .catch((err) => {
      console.error("[downloadFile] Error during download:", err);
      showAlert(`Download failed: ${err.message}`, "Error", "error");
      // Fallback: try opening directly
      console.log("[downloadFile] Attempting fallback - opening URL directly:", url);
      window.open(url, "_blank");
    });
};

const renderField = (field, isPreview = true, onChange = null) => {
const fieldKey = field.fieldId || field.id || field.employee?.id;
  const isDisabled = isPreview || field.readOnly || false;

  const handleChange = (value) => {
    if (onChange) {
      onChange(fieldKey, value);
    } else {
      handleInputChange(fieldKey, value);
    }
  };

  const currentValue = formData[fieldKey];
	const handleKeyDown = (e) => {
		if (e.key !== "Enter") return;
		// Allow newlines in textarea
		if (e.target && e.target.tagName === "TEXTAREA") return;
		if (e.shiftKey || e.ctrlKey || e.altKey) return;
		try {
			e.preventDefault();
			const formEl = e.target.closest && e.target.closest('form');
			if (!formEl) return;
			const focusableSelector = 'input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])';
			const focusables = Array.from(formEl.querySelectorAll(focusableSelector)).filter(el => el.offsetParent !== null);
			const idx = focusables.indexOf(e.target);
			if (idx >= 0 && idx < focusables.length - 1) {
				const next = focusables[idx + 1];
				next.focus();
				if (typeof next.select === 'function') next.select();
			}
		} catch (err) {
			// silent
		}
	};
  const feedbackRequestKey = `${fieldKey}_feedback_request_to`;
  const selectedFeedbackEmployeeId = formData[feedbackRequestKey] || "";
  const selectedFeedbackEmployee = employees.find(
    (emp) => String(emp.employee_id || emp.id) === String(selectedFeedbackEmployeeId)
  );

  const renderFeedbackRequester = () => {
    if (!field.needsOthersFeedback || isDisabled) return null;

    return (
      <div style={{ marginTop: "16px", padding: "14px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px" }}>
        <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
          Select employee for feedback
        </label>
        <select
          className="df-input"
          value={selectedFeedbackEmployeeId}
          onChange={(e) => handleInputChange(feedbackRequestKey, e.target.value)}
        >
          <option value="">-- Select employee --</option>
          {employees
            .filter((emp) => String(emp.employee_id || emp.id) !== String(currentEmployeeId))
            .map((emp) => {
              const fullName = `${emp.first_name || ""} ${emp.middle_name || ""} ${emp.last_name || ""}`.trim();
              return (
                <option key={emp.employee_id || emp.id} value={emp.employee_id || emp.id}>
                  {fullName || `Employee ${emp.employee_id || emp.id}`}
                </option>
              );
            })}
        </select>
        {selectedFeedbackEmployeeId && (
          <small style={{ display: "block", marginTop: "10px", color: "#0f172a" }}>
            Feedback requested from {selectedFeedbackEmployee ? `${selectedFeedbackEmployee.first_name || ""} ${selectedFeedbackEmployee.last_name || ""}`.trim() : selectedFeedbackEmployeeId}. They will submit their feedback separately.
          </small>
        )}
      </div>
    );
  };

  // Common Reference File Component
  const ReferenceFile = () => {
    const referenceFile = field.referenceFile || field.employee?.referenceFile || field.supervisor?.referenceFile;
    console.log("[ReferenceFile] Component rendered with field:", field, "referenceFile:", referenceFile);
    
    if (!referenceFile) return null;
    
    const url = getFileUrl(referenceFile);
    const fileName = referenceFile.name || referenceFile.originalname || referenceFile.filename || "Reference File";
    
    console.log("[ReferenceFile] URL:", url, "FileName:", fileName);
    
    if (!url) {
      console.warn("[ReferenceFile] No URL generated for reference file:", referenceFile);
      return null;
    }
    
    return (
      <div style={{
        margin: "10px 0 12px 0",
        padding: "12px 14px",
        background: "#f0f9ff",
        border: "1px solid #bae6fd",
        borderRadius: "8px"
      }}>
        <strong style={{ color: "#0369a1", display: "block", marginBottom: "6px" }}>
          📋 Sample Reference:
        </strong>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span>📎 {fileName}</span>
          {url && (
            <>
              <button
                type="button"
                onClick={() => {
                  console.log("[ReferenceFile] View button clicked", referenceFile);
                  viewFile(referenceFile);
                }}
                style={{ border: "none", background: "transparent", color: "#2563eb", textDecoration: "underline", cursor: "pointer", padding: 0 }}
              >
                View
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("[ReferenceFile] Download button clicked", referenceFile);
                  downloadFile(referenceFile, fileName);
                }}
                style={{ border: "none", background: "transparent", color: "#16a34a", textDecoration: "underline", cursor: "pointer" }}
              >
                Download
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  switch (field.type) {
    case "text":
    case "email":
    case "number":
      return (
        
        <div className="df-form-group">
          {/* <label>
            {field.label}
            {field.required && <span style={{ color: "red" }}> *</span>}
          </label> */}
          
          <ReferenceFile />
          
          <input
            type={field.type}
            placeholder={field.placeholder || ""}
            className="df-input"
            disabled={isDisabled}
            value={currentValue || ""}
						onChange={(e) => handleChange(e.target.value)}
						onKeyDown={handleKeyDown}
            required={field.required && !isDisabled}
          />
          {renderFeedbackRequester()}
        </div>
        
      );

    case "textarea":
      return (
        <div className="df-form-group">
          {/* <label>
            {field.label}
            {field.required && <span style={{ color: "red" }}> *</span>}
          </label> */}
          <ReferenceFile />
          <textarea
            placeholder={field.placeholder || ""}
            className="df-input"
            disabled={isDisabled}
            value={currentValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            required={field.required && !isDisabled}
          />
          {renderFeedbackRequester()}
        </div>
      );
    case "tel":   // Mobile Number
      return (
        <div className="df-form-group">
          <ReferenceFile />
          <input
            type="tel"
            placeholder={field.placeholder || "+91 98765 43210"}
            className="df-input"
            disabled={isDisabled}
            value={currentValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            required={field.required && !isDisabled}
            pattern="[0-9+\-\s]+"
          />
          
          <small style={{ color: "#666", fontSize: "0.82rem", display: "block", marginTop: "4px" }}>
            Enter mobile number with country code (e.g., +91 9876543210)
          </small>
          {renderFeedbackRequester()}
        </div>
      );
    case "date":
      return (
        <div className="df-form-group">
          {/* <label>
            {field.label}
            {field.required && <span style={{ color: "red" }}> *</span>}
          </label> */}
          <ReferenceFile />
          <input
            type="date"
            className="df-input"
            disabled={isDisabled}
            value={currentValue || ""}
						onChange={(e) => handleChange(e.target.value)}
						onKeyDown={handleKeyDown}
            required={field.required && !isDisabled}
          />
          {renderFeedbackRequester()}
        </div>
      );

    case "daterange":
      const rangeValue = currentValue || { start: "", end: "" };
      return (
        <div className="df-form-group">
          {/* <label>
            {field.label}
            {field.required && <span style={{ color: "red" }}> *</span>}
          </label> */}
          <ReferenceFile />
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
							<input type="date" className="df-input" disabled={isDisabled} value={rangeValue.start || ""} onChange={(e) => handleChange({ ...rangeValue, start: e.target.value })} onKeyDown={handleKeyDown} />
            </div>
            <div style={{ flex: 1 }}>
							<input type="date" className="df-input" disabled={isDisabled} value={rangeValue.end || ""} onChange={(e) => handleChange({ ...rangeValue, end: e.target.value })} onKeyDown={handleKeyDown} />
            </div>
          </div>
          {renderFeedbackRequester()}
        </div>
      );

    case "select":
      return (
        <div className="df-form-group">
          {/* <label>
            {field.label}
            {field.required && <span style={{ color: "red" }}> *</span>}
          </label> */}
          <ReferenceFile />
		  <select className="df-input" disabled={isDisabled} value={currentValue || ""} onChange={(e) => handleChange(e.target.value)} onKeyDown={handleKeyDown}>
            <option value="">-- Select --</option>
            {(field.options || []).map((opt, i) => (
              <option key={i} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {renderFeedbackRequester()}
        </div>
      );

    case "radio":
      return (
        <div className="df-form-group">
          {/* <label>
            {field.label}
            {field.required && <span style={{ color: "red" }}> *</span>}
          </label> */}
          <ReferenceFile />
          <div className="df-radio-group">
            {(field.options || []).map((opt, index) => (
              <label key={opt.value ?? index} className="df-radio-label">
                <input
                  type="radio"
                  name={fieldKey}
                  value={opt.value ?? opt.label}
                  checked={String(currentValue) === String(opt.value ?? opt.label)}
                  disabled={isDisabled}
									onChange={(e) => handleChange(e.target.value)}
									onKeyDown={handleKeyDown}
                  required={field.required && !isDisabled}
                />
                {opt.label ?? opt.value}
              </label>
            ))}
          </div>
          {renderFeedbackRequester()}
        </div>
      );

    case "checkbox-group":
      {
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        return (
          <div className="df-form-group">
            {/* <label>
              {field.label}
              {field.required && <span style={{ color: "red" }}> *</span>}
            </label> */}
            <ReferenceFile />
            <div className="df-checkbox-group">
              {(field.options || []).map((opt, index) => {
                const value = opt.value ?? opt.label;
                const isChecked = selectedValues.includes(value);
                return (
                  <label key={value ?? index} className="df-checkbox-label">
                    <input
                      type="checkbox"
                      value={value}
                      checked={isChecked}
                      disabled={isDisabled}
											onChange={(e) => {
                        const updated = e.target.checked
                          ? [...selectedValues, value]
                          : selectedValues.filter((v) => v !== value);
                        handleChange(updated);
                      }}
											onKeyDown={handleKeyDown}
                    />
                    {opt.label ?? opt.value}
                  </label>
                );
              })}
            </div>
            {renderFeedbackRequester()}
          </div>
        );
      }

    case "checkbox":
      return (
        <div className="df-form-group">
          {/* <label>
            {field.label}
            {field.required && <span style={{ color: "red" }}> *</span>}
          </label> */}
          <ReferenceFile />
          <input
            type="checkbox"
            disabled={isDisabled}
            checked={!!currentValue}
						onChange={(e) => handleChange(e.target.checked)}
						onKeyDown={handleKeyDown}
          />
          {renderFeedbackRequester()}
        </div>
      );

    case "rating":
      {
        const currentRating = Number(currentValue) || 0;
        return (
          <div className="df-form-group">
            {/* <label>
              {field.label}
              {field.required && <span style={{ color: "red" }}> *</span>}
            </label> */}
            <ReferenceFile />
            <div className="df-rating-container" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
									className={`df-star ${currentRating >= star ? "filled" : ""} ${isDisabled ? "disabled" : ""}`}
									role="button"
									tabIndex={isDisabled ? -1 : 0}
									onClick={() => {
										if (isDisabled) return;
										const newVal = currentRating === star ? 0 : star;
										handleChange(newVal);
									}}
									onKeyDown={(e) => {
										if (isDisabled) return;
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											const newVal = currentRating === star ? 0 : star;
											handleChange(newVal);
										}
									}}
									style={{ cursor: isDisabled ? "default" : "pointer", fontSize: "1.7rem", color: currentRating >= star ? "#f59e0b" : "#cbd5e1" }}
                >
                  ★
                </span>
              ))}
							{currentRating > 0 && (
								<>
									<span className="df-rating-value">({currentRating})</span>
									{!isDisabled && (
										<button
											type="button"
											onClick={() => handleChange(0)}
											style={{ marginLeft: "12px", background: "transparent", border: "1px solid #e5e7eb", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" }}
										>
											Clear
										</button>
									)}
								</>
							)}
            </div>
            {renderFeedbackRequester()}
          </div>
        );
      }
      
      case "file":
  return (
    <div className="df-form-group">
      <ReferenceFile field={field} />
     <input
  type="file"
  className="df-input"
  disabled={isDisabled}
  accept={field.accept || ".pdf,.doc,.docx,.jpg,.jpeg,.png"}
  multiple={field.multiple || false}
onChange={(e) => {
  const files = Array.from(e.target.files || []);

  handleInputChange(field.fieldId || field.id, files);
}}/>
      <small style={{ color: "#666", fontSize: "0.82rem", display: "block", marginTop: "4px" }}>
        PDF, JPG, PNG, DOC, DOCX (Max 10MB)
      </small>

      {/* FIXED: Show saved files with proper detection */}
      {Array.isArray(currentValue) && currentValue.length > 0 && (
        <div style={{ 
          marginTop: "12px", 
          padding: "12px", 
          background: "#f0fdf4", 
          borderRadius: "8px", 
          border: "1px solid #86efac" 
        }}>
          <strong style={{ color: "#166534" }}>✅ Already Saved:</strong>
          {currentValue.map((file, idx) => {
            let name = `File ${idx + 1}`;
            if (file && typeof file === "object" && file !== null) {
              name = file.originalname || file.filename || file.name || file.fileName || name;
            } else if (typeof file === "string") {
              name = file.split('/').pop() || name;
            }

            const url = getFileUrl(file);

            return (
              <div key={idx} style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ wordBreak: "break-all", fontWeight: "500" }}>📎 {name}</span>
                {url && (
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button 
                      type="button" 
                      onClick={() => viewFile(file)}
                      style={{ color: "#2563eb", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}
                    >
                      View
                    </button>
                    <button 
                      type="button" 
                      onClick={() => downloadFile(file, name)}
                      style={{ color: "#16a34a", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <small style={{ color: "#15803d", marginTop: "8px", display: "block" }}>
            You can upload a new file to replace
          </small>
        </div>
      )}

      {renderFeedbackRequester()}
    </div>
  );
    default:
      return (
        <div className="df-form-group">
          <label>{field.label}</label>
          <ReferenceFile />
          <em>Unsupported field type: {field.type}</em>
        </div>
      );
  }
};
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

// // ==================== HELPER: Get Field Values ====================
// const getFieldValues = (responseJson, form) => {
//   let formJson = form.form_json;
//   if (typeof formJson === 'string') {
//     try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
//   }

//   const values = [];

//   (formJson || []).forEach((f) => {
//     // Employee field
//     if (f.employee) {
//       const key = f.id;
//       let val = responseJson[key];
//       if (Array.isArray(val)) val = val.join(", ");
//       else if (val && typeof val === "object") val = JSON.stringify(val);
//       values.push(val ?? "—");
//     }

//     // Multiple supervisor fields
//     if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
//       f.supervisorFields.forEach((sup, idx) => {
//         const key = `${f.id}_sup_${idx}`;
//         let val = responseJson[key];
//         if (Array.isArray(val)) val = val.join(", ");
//         else if (val && typeof val === "object") val = JSON.stringify(val);
//         values.push(val ?? "—");
//       });
//     }
//   });

//   return values;
// };
// ==================== HELPER: Get Field Values (Fixed for Files) ====================
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

      // 🔥 FIXED: Handle File Attachments
      if (Array.isArray(val) && val.length > 0) {
        const firstItem = val[0];
        if (firstItem && typeof firstItem === "object" && 
            (firstItem.originalname || firstItem.filename || firstItem.name)) {
          val = val.map(file => 
            file.originalname || file.filename || file.name || "File"
          ).join(", ");
        } else {
          val = val.join(", ");
        }
      } 
      else if (val && typeof val === "object") {
        val = JSON.stringify(val);
      }

      values.push(val ?? "—");
    }

    // Multiple supervisor fields
    if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
      f.supervisorFields.forEach((sup, idx) => {
        const key = `${f.id}_sup_${idx}`;
        let val = responseJson[key];

        if (Array.isArray(val) && val.length > 0) {
          const firstItem = val[0];
          if (firstItem && typeof firstItem === "object" && 
              (firstItem.originalname || firstItem.filename)) {
            val = val.map(file => 
              file.originalname || file.filename || file.name || "File"
            ).join(", ");
          } else {
            val = val.join(", ");
          }
        } else if (val && typeof val === "object") {
          val = JSON.stringify(val);
        }

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
    let rawResponses = Array.isArray(json) ? json : json.data || json.responses || [];

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
    } catch (e) {
      console.warn("Assigned employees fetch failed");
    }

    const submittedMap = new Map(rawResponses.map(r => [String(r.employee_id || r.employeeId || ""), r]));

    // ==================== IMPROVED FIELD META ====================
    const fieldMetaMap = (() => {
      let formJsonData = form.form_json;
      if (typeof formJsonData === 'string') {
        try { formJsonData = JSON.parse(formJsonData); } catch (e) { formJsonData = []; }
      }

      const map = {};

      const addField = (field, id, visibleTo = 'both', isSupervisor = false) => {
        if (!id) return;
        const label = field?.label || id;
        const type = field?.type || null;
        map[String(id)] = { 
          label: isSupervisor ? `${label} (Supervisor)` : label, 
          visibleTo, 
          type,
          isSupervisor 
        };
      };

      (formJsonData || []).forEach(f => {
        if (f.employee) {
          addField(f.employee, f.id, 'employee', false);
        } else if (f.label && f.type) {
          addField(f, f.id || f.fieldId, 'both', false);
        }

        // Multiple supervisor fields
        if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
          f.supervisorFields.forEach((sup, idx) => {
            const supKey = `${f.id}_sup_${idx}`;
            addField(sup, supKey, 'supervisor', true);
          });
        } else if (f.supervisor) {
          const supKey = `${f.id}_sup`;
          addField(f.supervisor, supKey, 'supervisor', true);
        }
      });

      return map;
    })();

    const getEmployeeName = (employeeId) => {
      const emp = (employees || []).find(e => String(e.employee_id || e.id) === String(employeeId));
      if (!emp) return `Employee ${employeeId}`;
      return [emp.first_name, emp.middle_name, emp.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || `Employee ${employeeId}`;
    };

    const formattedResponses = assignedEmployees.map((emp) => {
      const empId = String(emp.employee_id || emp.id || "");
      const submittedResp = submittedMap.get(empId);

      const fullName = getEmployeeName(empId);

      if (submittedResp) {
        const responseJson = submittedResp.response_json || {};
        const readable = [];
        const meta = {};

        Object.keys(responseJson).forEach((key) => {
          if (String(key).startsWith("__")) {
            meta[key] = responseJson[key];
            return;
          }

          const fieldInfo = fieldMetaMap[String(key)] || { 
            label: key, 
            isSupervisor: false 
          };

          let answer = responseJson[key];
          if (Array.isArray(answer)) {
            // File or multi-select handling already in renderResponseValue
          } else if (answer && typeof answer === "object" && answer.start && answer.end) {
            answer = `${answer.start} to ${answer.end}`;
          } else if (answer === "" || answer === null || answer === undefined) {
            answer = "—";
          }

          readable.push({
            key,
            label: fieldInfo.label,
            response: answer,
            type: fieldInfo.type || null,
          });
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
        return {
          employee_id: empId,
          employeeDisplay: fullName,
          status: "not_submitted",
          readableAnswers: [],
          metadata: { __status: "Not Submitted Yet" },
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
  <input 
    type="date" 
    value={normalizeDateForInput(activeFrom)} 
    onChange={(e) => setActiveFrom(e.target.value || null)} 
    className="df-input" 
  />
</div>

<div>
  <label>Active To</label>
  <input 
    type="date" 
    value={normalizeDateForInput(activeTo)} 
    onChange={(e) => setActiveTo(e.target.value || null)} 
    className="df-input" 
  />
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
                  <option value="tel">📱 Mobile Number</option>   {/* ← NEW */}
                  <option value="textarea">📄 Textarea</option>
                  <option value="number">🔢 Number</option>
                  <option value="date">📅 Date</option>
                  <option value="daterange">📆 Date Range</option>
                  <option value="select">📋 Dropdown</option>
                  <option value="radio">◉ Radio Buttons</option>
                  <option value="checkbox-group">☑️ Checkbox Group</option>
                  <option value="checkbox">☐ Single Checkbox</option>
                  <option value="rating">⭐ Rating</option>
                  <option value="file">📎 Attachment</option>   {/* ← ADD THIS */}
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

{(fieldType === "text" || fieldType === "textarea") && (
  <div style={{ marginTop: "14px" }}>
    {/* <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
      <input 
        type="checkbox" 
        checked={fieldNeedsOthersFeedback} 
        onChange={(e) => setFieldNeedsOthersFeedback(e.target.checked)} 
      />
      Needs Feedback from Others
    </label> */}
    {fieldNeedsOthersFeedback && (
      <small style={{ display: "block", marginTop: "8px", color: "#475569" }}>
        Let the employee request feedback from another selected coworker and open an Others Feedback tab.
      </small>
    )}
  </div>
)}

{/* NEW: Required Checkbox for Employee Field */}


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
{/* Reference File - Available for ALL field types */}
<div style={{ marginTop: "16px" }}>
  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#1e40af" }}>
    📎 Reference File (Sample / Format for User)
  </label>
  <input
    type="file"
    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
    onChange={(e) => {
      if (e.target.files?.[0]) {
        setFieldReferenceFile(e.target.files[0]);
      }
    }}
  />
  {fieldReferenceFile && (
    <small style={{ color: "green", display: "block", marginTop: "4px" }}>
      ✓ {fieldReferenceFile.name}
    </small>
  )}
</div>  
                
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
  {f.employee.needsOthersFeedback && (
    <span style={{ color: "#0f766e", marginLeft: "12px", fontWeight: "600" }}>
      + Others Feedback
    </span>
  )}
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
           
{(isSupervisor || canBuildForms || feedbackRequests.length > 0) && (
  <div className="df-tabs" style={{ marginBottom: "25px", display: "flex", gap: "12px" }}>
    {/* Show Self tab for non-admin employees and HR */}
    {(!isAdmin || isHR) && (
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
    )}

    {/* Show Team tab ONLY if supervisor */}
    {isSupervisor && myTeamEmployeeIds.length > 0 && (
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
    )}

    {otherForms.length > 0 && (
      <button
        onClick={() => setActiveTab("others")}
        style={{
          padding: "10px 24px",
          background: activeTab === "others" ? "#16a34a" : "#f8f9fa",
          color: activeTab === "others" ? "#fff" : "#333",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: activeTab === "others" ? "600" : "500"
        }}
      >
        Others
      </button>
    )}

    {/* Show Feedback Requests tab ONLY if they have feedback requests */}
    {/* {feedbackRequests.length > 0 && (
      <button
        onClick={() => setActiveTab("feedbackRequests")}
        style={{
          padding: "10px 24px",
          background: activeTab === "feedbackRequests" ? "#16a34a" : "#f8f9fa",
          color: activeTab === "feedbackRequests" ? "#fff" : "#333",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: activeTab === "feedbackRequests" ? "600" : "500"
        }}
      >
        Feedback Requests ({feedbackRequests.length})
      </button>
    )} */}

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

          <div
  className="df-template-actions"
  style={{
    display: "flex",
    gap: "8px",
    flexWrap: "nowrap",
    alignItems: "center"
  }}
>
  <button onClick={() => viewTemplate(t)} className="df-view-btn">
    Preview
  </button>

  <button onClick={() => editTemplate(t)} className="df-edit-btn">
    Edit
  </button>

  <button
    onClick={() => viewResponses(t.id, t.form_name)}
    className="df-view-btn"
  >
    Responses
  </button>
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

{/* Feedback Requests Tab */}
{activeTab === "feedbackRequests" && (
  feedbackRequests.length === 0 ? (
    <p style={{ color: "#666", textAlign: "center", padding: "60px 0", gridColumn: "1 / -1" }}>
      No feedback requests at the moment.
    </p>
  ) : (
    feedbackRequests.map((req, idx) => (
      <div key={`fb-${req.form_id}-${req.requester_id}-${idx}`} className="df-template-card">
        <h4>{toTitleCase(req.form_name || `Form ${req.form_id}`)}</h4>
        <div style={{ margin: "8px 0 12px 0", color: "#444" }}>
          <div>
            <strong>Requested by: </strong>
            {formatRequesterDisplay(req.requester_id, req.requester_first_name, req.requester_last_name)}
          </div>
          {/* <div>
            <strong>Field: </strong>
            {req.fieldLabel || "Requested Feedback"}
          </div> */}
          <div style={{ marginTop: "8px", color: "#475569", whiteSpace: "pre-wrap" }}>
            <strong>Context: </strong>
            {req.requestContext || req.fieldValue || "No context available."}
          </div>
          {/* <div style={{ marginTop: "8px", color: "#475569", whiteSpace: "pre-wrap" }}>
            <strong>Details: </strong>
            {req.requestReason || "No additional details provided."}
          </div> */}
        </div>
        <div className="df-template-actions">
          {req.alreadyProvided && req.providedValue ? (
            <div style={{ marginBottom: 8, color: '#0f172a' }}>
              <strong>Your submitted feedback:</strong>
              <div style={{ marginTop: 6, color: '#334155', whiteSpace: 'pre-wrap' }}>{req.providedValue}</div>
            </div>
          ) : null}
          <button onClick={() => openOthersFeedback(req)} className="df-fill-btn">
            {req.alreadyProvided ? 'View / Edit Feedback' : 'Provide Feedback'}
          </button>
        </div>
      </div>
    ))
  )
)}
  {/* ==================== OTHERS TAB ==================== */}
  {activeTab === "others" && (
    otherForms.length === 0 ? (
      <p style={{
        color: "#666",
        textAlign: "center",
        padding: "60px 0",
        gridColumn: "1 / -1"
      }}>
        No forms requiring other feedback are available yet.
      </p>
    ) : (
      otherForms.map((t, index) => {
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
            key={`others-${t.id}-${index}`}
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
            <p style={{ color: "#475569", marginBottom: "16px" }}>
              This form can request feedback from a selected coworker and keeps other-feedback responses separate from your own answers.
            </p>
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
{/* Preview Mode - FIXED: Dropdowns are now clickable */}
{viewMode && selectedTemplate && (
  <div className="df-preview">
    <h3>{toTitleCase(selectedTemplate.form_name)} (Preview)</h3>
    
    <div className="df-preview-notice" style={{
      background: "#e0f2fe",
      color: "#0369a1",
      padding: "12px 16px",
      borderRadius: "8px",
      marginBottom: "20px",
      fontSize: "0.95rem"
    }}>
      This is a preview. You can interact with fields (dropdowns, radio, etc.) to see how the form will look.
    </div>

    <form className={`df-form df-grid-layout df-grid-${selectedTemplate.layout || "one"}`}>
      {(() => {
        let formJson = selectedTemplate.form_json;
        if (typeof formJson === 'string') {
          try { formJson = JSON.parse(formJson); } catch (e) { formJson = []; }
        }

        const fieldsToShow = [];

        (formJson || []).forEach(f => {
          // Employee Field
          if (f.employee) {
            fieldsToShow.push({
              ...f.employee,
              fieldId: f.id,
              isSupervisor: false,
              readOnly: false   // ← Important: Allow interaction in preview
            });
          } 
          // Backward compatibility
          else if (f.label && f.type) {
            fieldsToShow.push({
              ...f,
              fieldId: f.id || `field_${Date.now()}`,
              isSupervisor: false,
              readOnly: false
            });
          }

          // Supervisor Fields (Multiple)
          if (f.supervisorFields && Array.isArray(f.supervisorFields)) {
            f.supervisorFields.forEach((sup, idx) => {
              fieldsToShow.push({
                ...sup,
                fieldId: `${f.id}_sup_${idx}`,
                isSupervisor: true,
                readOnly: false
              });
            });
          }
        });

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
            {/* Pass false so dropdown is NOT disabled in preview */}
            {renderField(field, false)}
          </div>
        ));
      })()}
    </form>

    <button
      className="df-submit-btn"
      onClick={() => setViewMode(false)}
      style={{ marginTop: "25px" }}
    >
      Back to Form Management
    </button>
  </div>
)}
        {/* Fill / Review Mode */}
        {fillMode && selectedTemplate && (
          <div className="df-fill-preview">
       <h3 style={{ marginBottom: "20px" }}>
  {toTitleCase(selectedTemplate.form_name)}
  
  {isReviewMode && selectedSubmission && (
    <span style={{ 
      fontSize: "1.05rem", 
      fontWeight: "500", 
      color: "#334155", 
      marginLeft: "8px" 
    }}>
      — Reviewing: <span style={{ color: "#1e40af", fontWeight: "600" }}>
        {selectedSubmission.employee_name || 
         getEmployeeName(selectedSubmission.employee_id || selectedSubmission.employeeId)}
      </span>
    </span>
  )}

  {isReviewMode && !selectedSubmission && " — Supervisor Review"}
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
            ) : feedbackSubmitted && submittedFeedbackData ? (
              <div style={{ padding: "20px", background: "#dcfce7", border: "2px solid #22c55e", borderRadius: "12px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ fontSize: "32px" }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 12px 0", color: "#166534" }}>Feedback Submitted Successfully!</h3>
                    <div style={{ background: "white", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
                      <div style={{ marginBottom: "10px" }}>
                        <strong style={{ color: "#0f172a" }}>Submitted to:</strong> {submittedFeedbackData.requesterName}
                      </div>
                      <div style={{ marginBottom: "10px" }}>
                        <strong style={{ color: "#0f172a" }}>Time:</strong> {submittedFeedbackData.timestamp}
                      </div>
                      <div style={{ marginBottom: "0" }}>
                        <strong style={{ color: "#0f172a" }}>Your Feedback:</strong>
                        <div style={{ background: "#f1f5f9", padding: "12px", borderRadius: "6px", marginTop: "8px", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#334155" }}>
                          {submittedFeedbackData.feedbackText}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setOthersFeedbackContext(null);
                        setFillMode(false);
                        setFormData({});
                        // Keep feedbackSubmitted and submittedFeedbackData to display the card persistently
                      }}
                      style={{
                        padding: "10px 24px",
                        background: "#16a34a",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600"
                      }}
                    >
                      Back to Forms
                    </button>
                  </div>
                </div>
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
           
      
                  const isOthersOnlyMode = Boolean(
                    othersFeedbackContext &&
                    othersFeedbackContext.requesterEmployeeId &&
                    !isReviewMode &&
                    !viewingSubmission
                  );

                  const feedbackRequesterName = othersFeedbackContext?.requesterName || "Selected colleague";
                  const feedbackFieldKey = othersFeedbackContext?.feedbackKey;
                  const feedbackLabel = othersFeedbackContext?.sourceLabel || "Requested Feedback";

                  return (
                    <>
                      {isOthersOnlyMode ? (
                        <div style={{ display: "grid", gap: "20px" }}>
                          <div style={{ color: "#475569", marginBottom: "12px" }}>
                            <strong>Others Feedback</strong> — submit your feedback separately for {feedbackRequesterName}. The main form fields are not shown here.
                          </div>
                          <div style={{ padding: "12px 14px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px" }}>
                            <div style={{ fontWeight: 600, marginBottom: "8px", color: "#0f172a" }}>
                              Request context
                            </div>
                            {/* <div style={{ marginBottom: "6px", color: "#334155" }}>
                              <strong>Field:</strong> {othersFeedbackContext?.fieldLabel || feedbackLabel}
                            </div> */}
                              <div style={{ marginBottom: "6px", color: "#334155" }}>
                              <strong>Requested by:</strong> {othersFeedbackContext?.requesterName || "Unknown requester"}
                            </div>
                            {/* <div style={{ marginBottom: "6px", color: "#334155" }}>
                              <strong>Field:</strong> {othersFeedbackContext?.fieldLabel || feedbackLabel}
                            </div> */}
                            <div style={{ marginBottom: "6px", color: "#334155" }}>
                              <strong>Current value:</strong> {othersFeedbackContext?.requestContext || "—"}
                            </div>
                            {/* <div style={{ color: "#475569", whiteSpace: "pre-wrap" }}>
                              {othersFeedbackContext?.requestReason || "No additional details were provided by the requester."}
                            </div> */}
                          </div>
                          <div className="df-form-group">
                            <label>
                              Feedback for {feedbackRequesterName}
                              <span style={{ color: "#2563eb", fontWeight: "600", marginLeft: "8px" }}>
                                ({feedbackLabel})
                              </span>
                            </label>
                           <textarea
  placeholder={`Enter feedback for ${feedbackRequesterName}`}
  className="df-input"
  rows={6}
  value={formData[feedbackFieldKey] || ""}
  onChange={(e) => handleInputChange(feedbackFieldKey, e.target.value)}
  disabled={feedbackSubmitted}   // Prevents editing after final submit (optional)
/>
                          </div>
                        </div>
                      ) : (
                        fieldsToRender.map((field) => {
                          const isReadOnly = field.readOnly || false;
                          return (
                            <div key={field.fieldId} className="df-form-group">
                              <label>
                                {field.label}
                                {field.required && (
                                  <span style={{ color: "red" }}> *</span>
                                )}
                                {field.isSupervisor && (
                                  <span style={{ color: "#2563eb", fontWeight: "600" }}>
                                    {" "} (Supervisor)
                                  </span>
                                )}
                                {isReadOnly && (isReviewMode || viewingSubmission) && " (Read Only)"}
                              </label>
                              {renderField(
                                field,
                                isReadOnly,
                                (id, value) => handleInputChange(id, value)
                              )}
                            </div>
                          );
                        })
                      )}
                    </>
                  );
                })()}
  {!viewingSubmission && (
  <div style={{ 
    display: "flex", 
    gap: "16px", 
    marginTop: "30px", 
    justifyContent: "center",
    flexWrap: "wrap"
  }}>
    {(() => {
      const isOthersOnlyMode = Boolean(
        othersFeedbackContext &&
        othersFeedbackContext.requesterEmployeeId &&
        !isReviewMode &&
        !viewingSubmission
      );

      if (isOthersOnlyMode) {
        return (
          <button 
            type="submit" 
            className="df-submit-btn"
            style={{ 
              padding: "14px 32px",
              minWidth: "200px",
              background: "#16a34a"
            }}
            disabled={loading}
          >
            ✅ Submit Feedback
          </button>
        );
      }

      return (
        <>
          {/* Save Draft Button - Always available until final submit */}
          <button 
            type="button"
            onClick={saveDraft}
            className="df-submit-btn"
            style={{ 
              background: "#f59e0b", 
              color: "white",
              padding: "14px 32px",
              minWidth: "180px"
            }}
            disabled={loading}
          >
            💾 Save Draft
          </button>

          {/* Final Submit Button */}
          <button 
            type="submit" 
            className="df-submit-btn"
            style={{ 
              padding: "14px 32px",
              minWidth: "180px",
              background: "#16a34a"
            }}
            disabled={loading}
          >
            ✅ {isReviewMode ? "Submit Review" : "Final Submit"}
          </button>
        </>
      );
    })()}
  </div>
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
  setFillSectionTab("main");
  setSubmissionData(null);
  setOthersFeedbackContext(null);
  // Do NOT clear feedbackSubmitted and submittedFeedbackData to keep them visible
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
        {(resp.readableAnswers || []).map((answerItem, i) => {
          const response = answerItem.response;
          const fieldType = answerItem.type || null;

          return (
            <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "14px 16px", fontWeight: "500", verticalAlign: "top" }}>
                {answerItem.label}
              </td>
              <td style={{ padding: "14px 16px", backgroundColor: "#f8fafc", verticalAlign: "top" }}>
                {renderResponseValue(response, fieldType)}
              </td>
            </tr>
          );
        })}
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
      key === "isreview" || key === "is_review" ||
      key === "reviewed_employee" || key === "reviewedemployee" ||
      key === "isdraft" || key === "is_draft" ||
      key === "lastupdated" || key === "last_updated" ||
      key === "updatedat" || key === "updated_at"
    );
  })
  .map(([metaKey, metaValue]) => {
    let displayKey = metaKey.replace(/^__/, "").replace(/_/g, " ");
    
    let displayValue = metaValue;

    // Handle Dates
    if (
      metaKey.toLowerCase().includes("submitted_at") ||
      metaKey.toLowerCase().includes("reviewed_at") ||
      metaKey.toLowerCase().includes("saved_at")
    ) {
      displayValue = metaValue 
        ? new Date(metaValue).toLocaleString("en-IN", { 
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true 
          }) 
        : "—";
    } 
    // Handle File Objects (this was causing the crash)
    else if (metaValue && typeof metaValue === "object" && !Array.isArray(metaValue)) {
      if (metaValue.originalname || metaValue.filename || metaValue.name) {
        displayValue = metaValue.originalname || metaValue.filename || metaValue.name;
      } else {
        displayValue = "[Object]";
      }
    } 
    // Handle Arrays
    else if (Array.isArray(metaValue)) {
      displayValue = metaValue.map(item => {
        if (item && typeof item === "object" && (item.originalname || item.filename || item.name)) {
          return item.originalname || item.filename || item.name;
        }
        return String(item);
      }).join(", ");
    } 
    else {
      displayValue = String(metaValue || "—");
    }

    return (
      <li key={metaKey} style={{ marginBottom: "6px" }}>
        <strong>{toTitleCase(displayKey)}:</strong> {displayValue}
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
