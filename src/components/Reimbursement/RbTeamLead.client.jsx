"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { FaFileInvoice } from "react-icons/fa6";
import {
  MdOutlineCancel,
  MdOutlineRemoveRedEye,
  MdOutlineEdit,
  MdDeleteOutline,
} from "react-icons/md";
import axios from "axios";
import Reimbursement from "./Reimbursement.client";
import "./RbTeamLead.css";
import Modal from "../Modal/Modal.client";
import ParticipantSelection from "./ParticipantSelection.client";
import { useAuth } from "../../context/AuthProvider.client";
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[-.+*]/g, "\\$&") + "=([^;]*)"),
  );
  return m ? decodeURIComponent(m[1]) : null;
}
function extractDepartment(body) {
  if (!body) return null;
  return (
    body.department_id ??
    body.deptId ??
    body.dept_id ??
    body.department ??
    (body.user &&
      (body.user.department_id ?? body.user.deptId ?? body.user.dept_id)) ??
    (body.data &&
      (body.data.department_id ?? body.data.deptId ?? body.data.dept_id)) ??
    (body.dashboard && body.dashboard.department_id) ??
    null
  );
}
function extractOrgId(body) {
  if (!body) return null;
  return (
    body.org_id ??
    body.orgId ??
    body.organization_id ??
    (body.organization && (body.organization.id ?? body.organization.org_id)) ??
    (body.user && (body.user.org_id ?? body.user.orgId)) ??
    (body.data && (body.data.org_id ?? body.data.orgId)) ??
    null
  );
}
function getEmployeeIdFromContextOrCookie(user) {
  const cand =
    user?.employeeId ||
    user?.id ||
    user?.raw?.employee_id ||
    user?.raw?.empId ||
    user?.raw?.id ||
    null;
  if (cand && String(cand).trim() !== "") return String(cand).trim();
  const cookieNames = ["x-employee-id", "employeeId", "employee_id", "empId"];
  for (const n of cookieNames) {
    const c = getCookie(n);
    if (c && String(c).trim() !== "") return String(c).trim();
  }
  return null;
}

const normalizeProject = (value) => String(value ?? "").trim();
const isInvalidProject = (value) => {
  const v = normalizeProject(value).toUpperCase();
  return !v || v === "STS CLAIM";
};
const dedupeProjects = (list = []) => {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).filter((item) => {
    const key = normalizeProject(item).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const RbTeamLead = () => {
  const { user, hydrated } = useAuth();
  const employeeData = (user && (user.raw || user.dashboard)) || {};

  const backendBase = (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    ""
  ).replace(/\/$/, "");
  const apiKey =
    process.env.NEXT_PUBLIC_API_KEY || process.env.REACT_APP_API_KEY || "";

  const authToken = user?.raw?.token || user?.token || user?.authToken || "";
  const rawUserRole = user?.role || user?.raw?.role || "";
  const userRole = String(rawUserRole).toLowerCase();
  const isHR = false;

  const teamLeadId = getEmployeeIdFromContextOrCookie(user);

  const initialDepartmentId = extractDepartment(
    user?.raw ?? user ?? employeeData,
  );
  const initialOrgId = extractOrgId(user?.raw ?? user);
  const [view, setView] = useState("team");
  const [employees, setEmployees] = useState([]);
  const [selfClaims, setSelfClaims] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedClaims, setExpandedClaims] = useState({});
  const [submittedFrom, setSubmittedFrom] = useState("");
  const [submittedTo, setSubmittedTo] = useState("");
  const [attachments, setAttachments] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [comments, setComments] = useState({});
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentClaim, setSelectedPaymentClaim] = useState(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectSelections, setProjectSelections] = useState({});
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [participantsForEdit, setParticipantsForEdit] = useState([]);
  const [participantsSaving, setParticipantsSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [claimToEdit, setClaimToEdit] = useState(null);
  const [departmentId, setDepartmentId] = useState(initialDepartmentId);
  const [deptResolveTried, setDeptResolveTried] = useState(false);
  const [resolvingDept, setResolvingDept] = useState(false);
  const [orgId, setOrgId] = useState(initialOrgId);
  const [orgResolveTried, setOrgResolveTried] = useState(false);
  const [resolvingOrg, setResolvingOrg] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const orgPrefix = useMemo(() => {
    const candidates = [
      user?.orgPrefix,
      user?.org_prefix,
      user?.raw?.orgPrefix,
      user?.raw?.org_prefix,
      user?.dashboard?.orgPrefix,
      user?.dashboard?.org_prefix,
      user?.organization?.orgPrefix,
      user?.organization?.org_prefix,
      user?.organization_name,
      user?.orgName,
      user?.raw?.organization_name,
      user?.raw?.org_name,
    ];
    const found = candidates.find(
      (v) => v !== undefined && v !== null && String(v).trim() !== "",
    );
    return found ? String(found).trim() : "";
  }, [user]);

  const orgClaimLabel = orgPrefix ? `${orgPrefix} CLAIM` : "";

  const safeProjects = useMemo(() => {
    return dedupeProjects(
      (Array.isArray(projects) ? projects : [])
        .map((p) => normalizeProject(p))
        .filter((p) => !isInvalidProject(p)),
    );
  }, [projects]);

  useEffect(() => {
    console.debug("Auth user (resolved):", {
      id: user?.employeeId || user?.id || teamLeadId,
      departmentId,
      orgId,
      hydrated,
      rawKeys: user?.raw ? Object.keys(user.raw).slice(0, 8) : undefined,
    });
  }, [user, departmentId, orgId, hydrated]);
  const buildHeaders = useCallback(
    (extra = {}) => {
      const h = {};
      if (apiKey) h["x-api-key"] = String(apiKey).trim();
      const actorId = getEmployeeIdFromContextOrCookie(user);
      if (actorId) h["x-employee-id"] = String(actorId).trim();
      const effectiveOrgId =
        orgId ||
        user?.orgId ||
        user?.raw?.org_id ||
        user?.org_id ||
        user?.organization_id ||
        null;
      if (effectiveOrgId) h["x-org-id"] = String(effectiveOrgId).trim();
      const token = user?.raw?.token || user?.token || user?.authToken || "";
      if (token) h["Authorization"] = `Bearer ${String(token).trim()}`;
      Object.assign(h, extra || {});
      if (h["x-department-id"]) delete h["x-department-id"];
      Object.keys(h).forEach((k) => {
        if (h[k] === null || h[k] === undefined || String(h[k]).trim() === "")
          delete h[k];
      });
      return h;
    },
    [user, apiKey, orgId],
  );
  const resolveDepartmentIdOnce = useCallback(async () => {
    if (departmentId) return departmentId;
    if (deptResolveTried) return null;
    if (!backendBase) return null;
    if (!authToken && !teamLeadId) return null;
    if (resolvingDept) return null;
    setResolvingDept(true);
    let attempted = false;
    const candidatePaths = [
      "/me",
      "/profile",
      "/user/profile",
      "/auth/me",
      "/user",
    ];
    let found = null;
    try {
      attempted = true;
      for (const p of candidatePaths) {
        const url = `${backendBase}${p}`;
        try {
          const headers = {
            "x-api-key": apiKey || "",
            ...(teamLeadId ? { "x-employee-id": String(teamLeadId) } : {}),
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          };
          const resp = await axios.get(url, { headers, withCredentials: true });
          const data = resp?.data;
          if (!data) continue;
          const body = data.message ?? data;
          const candidate = extractDepartment(body);
          if (candidate) {
            found = String(candidate);
            break;
          }
        } catch (err) {
          console.debug(
            "resolveDepartmentIdOnce: candidate failed",
            p,
            err?.response?.status,
          );
        }
      }
    } catch (e) {
      console.warn("resolveDepartmentIdOnce unexpected error", e);
    } finally {
      setResolvingDept(false);
      if (attempted) setDeptResolveTried(true);
    }
    if (found) {
      setDepartmentId(found);
      console.info("Resolved departmentId for requests:", found);
      return found;
    }
    return null;
  }, [
    backendBase,
    authToken,
    apiKey,
    departmentId,
    deptResolveTried,
    resolvingDept,
    teamLeadId,
  ]);
  const resolveOrgIdOnce = useCallback(async () => {
    if (orgId) return orgId;
    if (orgResolveTried) return orgId;
    if (!backendBase) return null;
    if (!authToken && !teamLeadId) return null;
    if (resolvingOrg) return null;

    setResolvingOrg(true);
    let attempted = false;
    const candidatePaths = [
      "/me",
      "/profile",
      "/user/profile",
      "/auth/me",
      "/user",
    ];
    let found = null;
    try {
      attempted = true;
      for (const p of candidatePaths) {
        const url = `${backendBase}${p}`;
        try {
          const headers = {
            "x-api-key": apiKey || "",
            ...(teamLeadId ? { "x-employee-id": String(teamLeadId) } : {}),
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          };
          const resp = await axios.get(url, { headers, withCredentials: true });
          const data = resp?.data;
          if (!data) continue;
          const body = data.message ?? data;
          const candidate = extractOrgId(body);
          if (candidate) {
            found = String(candidate);
            break;
          }
        } catch (err) {
          console.debug(
            "resolveOrgIdOnce: candidate failed",
            p,
            err?.response?.status,
          );
        }
      }
    } catch (e) {
      console.warn("resolveOrgIdOnce unexpected error", e);
    } finally {
      setResolvingOrg(false);
      if (attempted) setOrgResolveTried(true);
    }

    if (found) {
      setOrgId(found);
      console.info("Resolved orgId for requests:", found);
      return found;
    }
    return null;
  }, [
    backendBase,
    authToken,
    apiKey,
    orgId,
    orgResolveTried,
    resolvingOrg,
    teamLeadId,
  ]);
  useEffect(() => {
    if (!hydrated) return;
    if (!orgId && !orgResolveTried) resolveOrgIdOnce();
    if (!departmentId && !deptResolveTried) resolveDepartmentIdOnce();
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    const fetchProjects = async () => {
      try {
        if (!orgId && !orgResolveTried) await resolveOrgIdOnce();
        const url = (backendBase ? `${backendBase}` : "") + "/projectdrop";
        const response = await axios.get(url, {
          withCredentials: true,
          headers: buildHeaders(),
        });
        setProjects(response.data || []);
      } catch (error) {
        console.error(
          "Error fetching projects:",
          error?.response?.data || error?.message || error,
        );
      }
    };
    fetchProjects();
    fetchEmployeeOptions();
  }, [hydrated]);
  const fetchEmployeeOptions = async () => {
    try {
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();
      const url =
        (backendBase ? `${backendBase}` : "") + "/reimbursement/employees";
      const resp = await axios.get(url, {
        withCredentials: true,
        headers: buildHeaders(),
      });
      const list = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.data || resp.data || [];
      const mapped = (list || []).map((r) => {
        const id = r.employee_id || r.id || r.employeeId || r.empId;
        const name =
          r.name ||
          r.employee_name ||
          `${r.first_name || ""} ${r.last_name || ""}`.trim();
        return {
          employee_id: id,
          name,
          position: r.position || r.designation || "",
          department_name: r.department_name || r.department || "",
        };
      });
      setEmployeeOptions(mapped);
    } catch (err) {
      console.warn(
        "Could not fetch employees for participant selection. Falling back to demo list.",
        err?.response?.data || err?.message || err,
      );
      setEmployeeOptions([
        { employee_id: teamLeadId || "E000", name: "You", position: "" },
        { employee_id: "E1001", name: "Priya Sharma", position: "Developer" },
        { employee_id: "E1002", name: "Rahul Verma", position: "Analyst" },
      ]);
    }
  };
  useEffect(() => {
    if (view !== "team") return;
    if (!hydrated) return;
    fetchEmployees();
  }, [view, hydrated]);
  const resolveDateDisplay = (payload = {}, claim = {}) => {
    const pick = (obj, keys = []) => {
      for (const k of keys) {
        if (
          obj &&
          obj[k] !== undefined &&
          obj[k] !== null &&
          String(obj[k]).trim() !== ""
        )
          return obj[k];
      }
      return null;
    };

    const singleDateKeys = [
      "date",
      "expense_date",
      "txn_date",
      "created_at",
      "submitted_date",
      "paid_date",
      "claim_date",
      "date_of_expense",
      "expenseDate",
      "createdAt",
      "submittedAt",
    ];

    const startKeys = [
      "date_from",
      "from",
      "from_date",
      "start_date",
      "travel_from",
      "time_from",
      "timeStart",
      "fromDate",
    ];
    const endKeys = [
      "date_to",
      "to",
      "to_date",
      "end_date",
      "travel_to",
      "time_end",
      "timeEnd",
      "toDate",
    ];

    const start = pick(payload, startKeys);
    const end = pick(payload, endKeys);
    if (start || end) return formatRange(start, end);

    const single = pick(payload, singleDateKeys);
    if (single) return formatDisplayDate(single);

    const claimStart = pick(claim, startKeys);
    const claimEnd = pick(claim, endKeys);
    if (claimStart || claimEnd) return formatRange(claimStart, claimEnd);

    const claimSingle = pick(claim, singleDateKeys);
    if (claimSingle) return formatDisplayDate(claimSingle);

    const lastResort =
      claim.created_at ||
      claim.createdAt ||
      claim.submitted_date ||
      claim.submittedAt;
    if (lastResort) return formatDisplayDate(lastResort);

    return "-";
  };

  const formatDisplayDate = (raw) => {
    if (!raw) return " ";
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d)) return raw;
    const dd = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleString("en-GB", { month: "short" });
    const yy = d.getFullYear();
    return `${dd}-${mon}-${yy}`;
  };
  const formatRange = (from, to) => {
    const f = formatDisplayDate(from);
    const t = formatDisplayDate(to);
    if (!f && !t) return " ";
    if (f && t && f !== t) return `${f} - ${t}`;
    return f || t;
  };
  const fetchEmployees = async () => {
    try {
      if (!teamLeadId) {
        showAlert("Team lead id not available from auth.");
        console.warn("fetchEmployees aborted: missing teamLeadId on user");
        return;
      }
      let effectiveDept = departmentId ?? null;
      const userDeptCandidates = [
        user?.raw?.department_id,
        user?.raw?.deptId,
        user?.department_id,
        user?.deptId,
        user?.department,
        user?.raw?.departmentId,
        employeeData?.department_id,
        getCookie("department_id"),
        getCookie("x-department-id"),
      ];
      for (const cand of userDeptCandidates) {
        if (
          !effectiveDept &&
          cand !== undefined &&
          cand !== null &&
          String(cand).trim() !== ""
        ) {
          effectiveDept = String(cand).trim();
          break;
        }
      }
      if (!effectiveDept && !deptResolveTried) {
        const resolved = await resolveDepartmentIdOnce();
        if (resolved) effectiveDept = String(resolved).trim();
      }
      if (
        effectiveDept === "null" ||
        effectiveDept === "undefined" ||
        effectiveDept === ""
      )
        effectiveDept = null;

      if (!effectiveDept) {
        console.warn("fetchEmployees aborted: departmentId missing; user:", {
          userDeptCandidates,
          deptResolveTried,
        });
        showAlert("Department ID is missing from your profile. Contact admin.");
        return;
      }
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();
      const effectiveOrgForParam =
        orgId ||
        user?.orgId ||
        user?.raw?.org_id ||
        user?.org_id ||
        user?.organization_id ||
        null;
      if (!effectiveOrgForParam) {
        console.error(
          "fetchEmployees aborted: orgId missing; headers:",
          buildHeaders(),
        );
        showAlert(
          "Organization id (x-org-id) is missing from your session. The backend requires it.",
        );
        return;
      }
      const url =
        (backendBase ? `${backendBase}` : "") +
        `/team/${encodeURIComponent(teamLeadId)}/reimbursements`;
      const params = {};
      if (effectiveDept) params.departmentId = effectiveDept;
      if (submittedFrom) params.submittedFrom = submittedFrom;
      if (submittedTo) params.submittedTo = submittedTo;
      params.orgId = effectiveOrgForParam;
      params._t = Date.now();
      const headers = buildHeaders();
      if (!headers["x-org-id"] && effectiveOrgForParam) {
        headers["x-org-id"] = String(effectiveOrgForParam).trim();
      }
      console.debug("fetchEmployees -> GET (primary) ", url, {
        headers,
        params,
      });
      try {
        const response = await axios.get(url, {
          withCredentials: true,
          headers,
          params,
        });
        const flatClaims = response.data || [];
        const filteredFlatClaims = flatClaims.filter(
          (c) => String(c.employee_id) !== String(teamLeadId),
        );
        const grouped = filteredFlatClaims.reduce((acc, claim) => {
          const empId = claim.employee_id;
          if (!acc[empId]) acc[empId] = { employee_id: empId, claims: [] };
          acc[empId].claims.push(claim);
          return acc;
        }, {});
        setEmployees(Object.values(grouped));
        const attachmentsMap = {};
        filteredFlatClaims.forEach((claim) => {
          attachmentsMap[claim.id] = claim.attachments || [];
        });
        setAttachments(attachmentsMap);
        return;
      } catch (primaryError) {
        console.error(
          "Primary fetchEmployees failed (primary headers):",
          primaryError?.message || primaryError,
        );
        if (primaryError.response) {
          console.error(
            "response.status:",
            primaryError.response.status,
            "data:",
            primaryError.response.data,
          );
          const msg =
            primaryError?.response?.data?.error ||
            primaryError?.response?.data?.message ||
            primaryError.message;
          if ([401, 403].includes(primaryError.response.status)) {
            showAlert(
              msg || "Authentication error while fetching team reimbursements.",
            );
            return;
          } else {
            showAlert(msg);
            return;
          }
        } else if (primaryError.request) {
          console.warn(
            "No response from server (possible CORS/network). Attempting fallback request using query params and minimal headers.",
          );
        } else {
          console.error("setup error:", primaryError);
          showAlert("Error fetching employees.");
          return;
        }
        try {
          const fallbackParams = {
            ...params,
            departmentId: effectiveDept,
            orgId: effectiveOrgForParam,
            employeeId: teamLeadId,
            _t: Date.now(),
          };
          const minimalHeaders = {};
          if (apiKey) minimalHeaders["x-api-key"] = String(apiKey).trim();
          const actor = getEmployeeIdFromContextOrCookie(user);
          if (actor) minimalHeaders["x-employee-id"] = String(actor).trim();
          minimalHeaders["x-org-id"] = String(effectiveOrgForParam).trim();
          console.debug("fetchEmployees -> GET (fallback) ", url, {
            minimalHeaders,
            fallbackParams,
          });
          const response2 = await axios.get(url, {
            withCredentials: true,
            headers: minimalHeaders,
            params: fallbackParams,
          });
          const flatClaims = response2.data || [];
          const filteredFlatClaims = flatClaims.filter(
            (c) => String(c.employee_id) !== String(teamLeadId),
          );
          const grouped = filteredFlatClaims.reduce((acc, claim) => {
            const empId = claim.employee_id;
            if (!acc[empId]) acc[empId] = { employee_id: empId, claims: [] };
            acc[empId].claims.push(claim);
            return acc;
          }, {});
          setEmployees(Object.values(grouped));
          const attachmentsMap = {};
          filteredFlatClaims.forEach((claim) => {
            attachmentsMap[claim.id] = claim.attachments || [];
          });
          setAttachments(attachmentsMap);
          console.info("fetchEmployees fallback succeeded.");
          return;
        } catch (fallbackError) {
          console.error(
            "Fallback fetchEmployees also failed:",
            fallbackError?.message || fallbackError,
          );
          if (fallbackError.response) {
            console.error(
              "response.status:",
              fallbackError.response.status,
              "data:",
              fallbackError.response.data,
            );
            const msg =
              fallbackError?.response?.data?.error ||
              fallbackError?.response?.data?.message ||
              fallbackError.message;
            showAlert(msg || "Server rejected the request.");
          } else if (fallbackError.request) {
            console.error(
              "No response from server for fallback (likely CORS / network). Request object:",
              fallbackError.request,
            );
            showAlert("Network Error");
          } else {
            console.error("setup error:", fallbackError);
            showAlert("Error fetching employees.");
          }
          return;
        }
      }
    } catch (error) {
      console.error(
        "Unexpected error in fetchEmployees top-level catch:",
        error,
      );
      showAlert("Error fetching employees.");
    }
  };

  const fetchSelfClaims = async () => {
    try {
      const emp = getEmployeeIdFromContextOrCookie(user);
      if (!emp) {
        showAlert("Employee id missing from session.");
        return;
      }
      const url =
        (backendBase ? `${backendBase}` : "") +
        `/reimbursement/${encodeURIComponent(emp)}`;
      const headers = buildHeaders();
      try {
        const resp = await axios.get(url, { withCredentials: true, headers });
        const data = resp.data || [];
        setSelfClaims(Array.isArray(data) ? data : data.data || []);
        return;
      } catch (primaryErr) {
        console.warn(
          "Primary self fetch failed, trying fallback minimal headers",
          primaryErr?.message || primaryErr,
        );
        try {
          const minimalHeaders = {};
          if (apiKey) minimalHeaders["x-api-key"] = String(apiKey).trim();
          const actor = getEmployeeIdFromContextOrCookie(user);
          if (actor) minimalHeaders["x-employee-id"] = String(actor).trim();
          const resp2 = await axios.get(url, {
            withCredentials: true,
            headers: minimalHeaders,
          });
          const data2 = resp2.data || [];
          setSelfClaims(Array.isArray(data2) ? data2 : data2.data || []);
          return;
        } catch (fallbackErr) {
          console.error("Fallback self fetch failed:", fallbackErr);
          showAlert("Failed to fetch your reimbursements.");
        }
      }
    } catch (e) {
      console.error("fetchSelfClaims unexpected:", e);
      showAlert("Error fetching claims.");
    }
  };
  const toggleRow = (employeeId) =>
    setExpandedRows((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }));

  const toggleClaimExpand = (claimId) =>
    setExpandedClaims((prev) => ({ ...prev, [claimId]: !prev[claimId] }));
  const handleOpenAttachments = async (files, claim) => {
    try {
      if (!files || files.length === 0) {
        showAlert("No attachments available.");
        return;
      }

      const fetchedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            if (!file?.filename && !file?.file_name) return null;
            const filename = file.filename || file.file_name;
            const match = filename.match(/^(\d{4})-(\d{2})-\d{2}/);
            if (!match) return null;
            const year = match[1];
            const month = match[2];
            const empId = claim.employee_id;
            const fileUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/reimbursement/${orgId}/${year}/${month}/${empId}/${filename}`;

            const response = await axios.get(fileUrl, {
              withCredentials: true,
              headers: {
                "x-employee-id": String(empId),
                Authorization: authToken ? `Bearer ${authToken}` : undefined,
              },
              responseType: "blob",
            });

            return {
              name: filename,
              url: URL.createObjectURL(
                new Blob([response.data], {
                  type: response.headers["content-type"],
                }),
              ),
            };
          } catch (err) {
            console.warn(
              "attachment fetch failed for",
              file,
              err?.message || err,
            );
            return null;
          }
        }),
      );

      setSelectedFiles(fetchedFiles.filter(Boolean));
      setSelectedClaim(claim);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      showAlert("No attachments found for this screen.");
    }
  };

  const handleStatusChange = (id, value) =>
    setStatusUpdates((prev) => ({ ...prev, [id]: value }));
  const parseInvoicesForClaim = (claim) => {
    let invs =
      claim?.invoices || claim?.invoice_numbers || claim?.invoice_no || [];
    try {
      if (typeof invs === "string" && invs.trim()) invs = JSON.parse(invs);
    } catch (e) {
      if (typeof invs === "string")
        invs = invs
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      else invs = Array.isArray(invs) ? invs : [];
    }
    return Array.isArray(invs) && invs.length ? invs : [];
  };
  const getParticipantNamesForClaim = (claim = {}) => {
    const partRaw =
      claim.participants ||
      claim.participant_ids ||
      claim.participant_names ||
      [];
    let part = [];
    try {
      if (typeof partRaw === "string" && partRaw.trim())
        part = JSON.parse(partRaw);
      else part = Array.isArray(partRaw) ? partRaw : [];
    } catch {
      if (typeof partRaw === "string")
        part = partRaw ? partRaw.split(",").map((s) => s.trim()) : [];
      else part = Array.isArray(partRaw) ? partRaw : [];
    }
    if (!part || part.length === 0) {
      if (claim.employee_name) return claim.employee_name;
      return "You";
    }
    const names = part.map((p) => {
      if (typeof p === "object")
        return p.name || p.employee_name || p.employee_id || JSON.stringify(p);
      const found = employeeOptions.find(
        (e) =>
          String(e.employee_id) === String(p) || String(e.id) === String(p),
      );
      if (found) return found.name;
      return String(p);
    });
    return names.join(", ");
  };
  const parseAmount = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const s = String(v)
      .replace(/,/g, "")
      .replace(/[^0-9.\-]/g, "")
      .trim();
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };
  const getClaimAmount = (claim = {}) => {
    if (!claim) return 0;
    const candidates = [
      claim.aggregated_total,
      claim.aggregatedTotal,
      claim.total_amount,
      claim.totalAmount,
      claim.total,
    ];
    for (const c of candidates) {
      const n = parseAmount(c);
      if (n !== 0) return n;
    }
    if (Array.isArray(claim.lines) && claim.lines.length) {
      return claim.lines.reduce((s, ln) => {
        if (!ln) return s;
        const lnCandidates = [
          ln.total_amount,
          ln.totalAmount,
          ln.payload && ln.payload.total_amount,
          ln.payload && ln.payload.totalAmount,
        ];
        for (const lc of lnCandidates) {
          const lnVal = parseAmount(lc);
          if (lnVal !== 0) {
            s += lnVal;
            return s;
          }
        }
        s += parseAmount(ln.total_amount ?? ln.payload?.total_amount ?? 0);
        return s;
      }, 0);
    }
    return 0;
  };
  const openParticipantsModal = (claim) => {
    let existing = claim.participants || claim.participant_ids || [];
    try {
      if (typeof existing === "string" && existing.trim())
        existing = JSON.parse(existing);
    } catch {
      if (typeof existing === "string")
        existing = existing
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      else existing = Array.isArray(existing) ? existing : [];
    }
    const ids = (existing || [])
      .map((p) =>
        typeof p === "object"
          ? p.employee_id || p.id || p.employeeId
          : String(p),
      )
      .filter(Boolean)
      .map(String);
    setParticipantsForEdit(ids);
    setSelectedClaim(claim);
    setIsParticipantsModalOpen(true);
  };
  const handleParticipantSelectionChange = (selectedArray) => {
    const ids = (selectedArray || []).map((it) =>
      typeof it === "string" ? it : it.employee_id || it.id || it.employeeId,
    );
    setParticipantsForEdit(ids.map(String));
  };
  const saveParticipants = async () => {
    if (!selectedClaim) return;
    setParticipantsSaving(true);
    try {
      const url =
        (backendBase ? `${backendBase}` : "") +
        `/reimbursement/${selectedClaim.id}/participants`;
      await axios.put(
        url,
        { participants: participantsForEdit },
        {
          withCredentials: true,
          headers: { ...buildHeaders(), "Content-Type": "application/json" },
        },
      );
      showAlert("Participants updated.");
      setIsParticipantsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error("Error saving participants:", err);
      showAlert("Failed to save participants.");
    } finally {
      setParticipantsSaving(false);
    }
  };
  function sanitizeFileName(name = "") {
    return String(name)
      .normalize("NFKD")
      .replace(/[\u0000-\u001F<>:"/\\|?*]+/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 100);
  }

  const handleDownload = async (claim) => {
    try {
      const url =
        (backendBase ? `${backendBase}` : "") + `/download/${claim.id}`;
      const headers = buildHeaders();

      console.log("Download URL:", url);
      console.log("Request Headers:", headers);

      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const response = await axios.get(url, {
        withCredentials: true,
        headers,
        responseType: "blob",
      });

      if (response.status && response.status !== 200) {
        throw new Error(`Download failed: HTTP ${response.status}`);
      }

      let filename = "";
      const empName = claim.employee_name || claim.employeeName || claim.name;
      if (empName) {
        const base = sanitizeFileName(empName) || `Reimbursement_${claim.id}`;
        filename = `${base}_Reimbursement_${claim.id}.pdf`;
      }

      if (!filename) {
        const cd = response.headers && response.headers["content-disposition"];
        if (cd) {
          const filenameRegex = /filename[^;=\n]*=(['"]?)([^;\n]*)\1/;
          const matches = filenameRegex.exec(cd);
          if (matches && matches[2]) {
            filename = decodeURIComponent(matches[2].replace(/["']/g, ""));
          }
        }
      }

      if (!filename) {
        filename = `Reimbursement_${claim.id}.pdf`;
      }
      if (!filename.toLowerCase().endsWith(".pdf")) filename += ".pdf";

      const blob = new Blob([response.data], { type: "application/pdf" });

      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
        return;
      }

      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlObj;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(urlObj);

      console.log("Download started for", filename);
    } catch (error) {
      console.error("Error downloading reimbursement PDF:", error);

      try {
        if (error?.response?.data && error.response.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = function () {
            console.error("Server error text:", reader.result);
          };
          reader.readAsText(error.response.data);
        }
      } catch (rErr) {
        console.error("Failed to read error blob:", rErr);
      }

      alert(
        "There was an issue downloading the file. Check console for details.",
      );
    }
  };
  const updateStatus = async (claimId) => {
    try {
      const newStatus = statusUpdates[claimId];
      if (!newStatus) {
        showAlert("Select a status before updating.");
        return;
      }

      const currentClaim = employees
        .flatMap((e) => e.claims)
        .find((c) => String(c.id) === String(claimId));

      const finalProjectRaw =
        projectSelections[claimId] !== undefined &&
        projectSelections[claimId] !== null &&
        String(projectSelections[claimId]).trim() !== ""
          ? projectSelections[claimId]
          : currentClaim?.project || "";

      const finalProject = isInvalidProject(finalProjectRaw)
        ? ""
        : String(finalProjectRaw).trim();

      const url = `${
        backendBase ? backendBase : ""
      }/reimbursement/${claimId}/status`;

      const actor = getEmployeeIdFromContextOrCookie(user) || teamLeadId || "";

      const body = {
        status: newStatus,
        approver_comments: comments[claimId] || "",
        approver_id: actor || undefined,
        project: finalProject,
      };

      const headers = { ...buildHeaders(), "Content-Type": "application/json" };
      if (!headers["x-employee-id"] && actor)
        headers["x-employee-id"] = String(actor).trim();
      if (!headers["x-org-id"] && orgId)
        headers["x-org-id"] = String(orgId).trim();

      await axios.put(url, body, {
        withCredentials: true,
        headers,
      });

      const statusMsgMap = {
        approved: "Reimbursement approved successfully.",
        rejected: "Reimbursement rejected successfully.",
        pending: "Reimbursement marked as pending successfully.",
      };

      showAlert(
        statusMsgMap[String(newStatus).toLowerCase()] ||
          `Reimbursement ${newStatus} successfully.`,
      );

      fetchEmployees();
    } catch (err) {
      console.error("updateStatus failed:", err);

      try {
        const currentClaim = employees
          .flatMap((e) => e.claims)
          .find((c) => String(c.id) === String(claimId));

        const finalProjectRaw =
          projectSelections[claimId] !== undefined &&
          projectSelections[claimId] !== null &&
          String(projectSelections[claimId]).trim() !== ""
            ? projectSelections[claimId]
            : currentClaim?.project || "";

        const finalProject = isInvalidProject(finalProjectRaw)
          ? ""
          : String(finalProjectRaw).trim();

        const url = `${
          backendBase ? backendBase : ""
        }/reimbursement/${claimId}/status`;

        const body = {
          status: statusUpdates[claimId],
          approver_comments: comments[claimId] || "",
          approver_id:
            getEmployeeIdFromContextOrCookie(user) || teamLeadId || undefined,
          project: finalProject,
        };

        const minimalHeaders = {};
        if (apiKey) minimalHeaders["x-api-key"] = String(apiKey).trim();
        const actor = getEmployeeIdFromContextOrCookie(user) || teamLeadId;
        if (actor) minimalHeaders["x-employee-id"] = String(actor).trim();
        if (orgId) minimalHeaders["x-org-id"] = String(orgId).trim();
        minimalHeaders["Content-Type"] = "application/json";

        await axios.put(url, body, {
          withCredentials: true,
          headers: minimalHeaders,
        });

        const fallbackStatus = String(
          statusUpdates[claimId] || "",
        ).toLowerCase();
        const statusMsgMap = {
          approved: "Reimbursement approved successfully (fallback).",
          rejected: "Reimbursement rejected successfully (fallback).",
          pending: "Reimbursement marked as pending successfully (fallback).",
        };

        showAlert(statusMsgMap[fallbackStatus] || `Status updated (fallback).`);
        fetchEmployees();
      } catch (err2) {
        console.error("Fallback updateStatus failed:", err2);
        showAlert("Failed to update status.");
      }
    }
  };
  const updatePaymentStatus = async (claimIdParam, paymentOptionParam) => {
    try {
      const claimId =
        claimIdParam ||
        (selectedPaymentClaim &&
          (selectedPaymentClaim.id || selectedPaymentClaim));
      const paymentOption =
        paymentOptionParam ||
        selectedPaymentOption ||
        (selectedPaymentClaim && selectedPaymentClaim.payment_status) ||
        "";

      if (!claimId) {
        showAlert("No claim selected for payment update.");
        return;
      }
      if (!paymentOption) {
        showAlert("Select a payment status before submitting.");
        return;
      }

      const url =
        (backendBase ? `${backendBase}` : "") +
        `/reimbursement/${encodeURIComponent(claimId)}/payment`;

      const headers = { ...buildHeaders(), "Content-Type": "application/json" };
      const actor = getEmployeeIdFromContextOrCookie(user) || teamLeadId;
      if (!headers["x-employee-id"] && actor)
        headers["x-employee-id"] = String(actor).trim();
      if (!headers["x-org-id"] && orgId)
        headers["x-org-id"] = String(orgId).trim();

      await axios.put(
        url,
        {
          payment_status: paymentOption,
          user_role: user?.role || user?.raw?.role || undefined,
        },
        {
          withCredentials: true,
          headers,
        },
      );

      showAlert("Payment status updated.");
      setIsPaymentModalOpen(false);
      setSelectedPaymentClaim(null);
      setSelectedPaymentOption("");
      fetchEmployees();
    } catch (err) {
      console.error("updatePaymentStatus failed:", err);
      try {
        const url =
          (backendBase ? `${backendBase}` : "") +
          `/reimbursement/${encodeURIComponent(
            claimIdParam ||
              (selectedPaymentClaim && selectedPaymentClaim.id) ||
              "",
          )}/payment`;
        const minimalHeaders = {};
        if (apiKey) minimalHeaders["x-api-key"] = String(apiKey).trim();
        const actor = getEmployeeIdFromContextOrCookie(user) || teamLeadId;
        if (actor) minimalHeaders["x-employee-id"] = String(actor).trim();
        if (orgId) minimalHeaders["x-org-id"] = String(orgId).trim();
        minimalHeaders["Content-Type"] = "application/json";

        await axios.put(
          url,
          { payment_status: paymentOptionParam || selectedPaymentOption || "" },
          { withCredentials: true, headers: minimalHeaders },
        );

        showAlert("Payment status updated (fallback).");
        setIsPaymentModalOpen(false);
        setSelectedPaymentClaim(null);
        setSelectedPaymentOption("");
        fetchEmployees();
      } catch (err2) {
        console.error("Fallback updatePaymentStatus failed:", err2);
        showAlert("Failed to update payment status.");
      }
    }
  };

  const confirmOpenInSelfView = (claim) => {
    setIsEditModalOpen(false);
    setView("self");
    setTimeout(() => {
      fetchSelfClaims();
    }, 200);
  };
  const filteredEmployees = employees
    .map((emp) => ({
      ...emp,
      claims: emp.claims.filter((claim) => {
        const status = (claim.status || "").toLowerCase().trim();
        const pay = (claim.payment_status || "").toLowerCase().trim();
        switch (statusFilter) {
          case "approved":
            return status === "approved";
          case "rejected":
            return status === "rejected";
          case "pending":
            return status === "pending";
          case "approved_pending":
            return status === "approved" && pay === "pending";
          case "approved_paid":
            return status === "approved" && pay === "paid";
          case "pending":
          default:
            return true;
        }
      }),
    }))
    .filter((emp) => emp.claims.length > 0)
    .filter((emp) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const name = (emp.claims[0]?.employee_name || "").toLowerCase();
      const idStr = String(emp.employee_id).toLowerCase();
      return name.includes(q) || idStr.includes(q);
    });

  const totalAmount = employees.reduce(
    (sum, employee) =>
      sum +
      (Array.isArray(employee.claims)
        ? employee.claims.reduce(
            (claimSum, claim) => claimSum + getClaimAmount(claim),
            0,
          )
        : 0),
    0,
  );

  const approvedAmount = employees.reduce(
    (sum, employee) =>
      sum +
      (Array.isArray(employee.claims)
        ? employee.claims
            .filter(
              (claim) => String(claim.status).toLowerCase() === "approved",
            )
            .reduce((claimSum, claim) => claimSum + getClaimAmount(claim), 0)
        : 0),
    0,
  );
  return (
    <div className="rb-admin">
      <h2>Reimbursement Requests</h2>
      <div className="tabs-container">
        <button
          className={`tab ${view === "team" ? "active" : ""}`}
          onClick={() => setView("team")}
        >
          Team
        </button>
        <button
          className={`tab ${view === "self" ? "active" : ""}`}
          onClick={() => setView("self")}
        >
          Self
        </button>
      </div>
      {view === "team" ? (
        <div className="rb-main">
          <div className="rb-filters">
            <div className="rb-filter-group">
              <label>Status By</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="approved_pending">Approved - Pending</option>
                <option value="approved_paid">Approved - Paid</option>
              </select>
            </div>

            <div className="rb-filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search by name or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="rb-filter-group">
              <label>Submitted From:</label>
              <input
                type="date"
                value={submittedFrom}
                onChange={(e) => setSubmittedFrom(e.target.value)}
              />
            </div>
            <div className="rb-filter-group">
              <label>Submitted To</label>
              <input
                type="date"
                value={submittedTo}
                onChange={(e) => setSubmittedTo(e.target.value)}
              />
            </div>
            <button className="rb-search" onClick={fetchEmployees}>
              <FaSearch /> Search
            </button>
          </div>

          <div className="rb-atable-container">
            {filteredEmployees.map((employee) => {
              const filteredClaims = employee.claims;
              if (!filteredClaims.length) return null;
              return (
                <div key={employee.employee_id} className="employee-section">
                  <div
                    className="employee-row"
                    onClick={() => toggleRow(employee.employee_id)}
                  >
                    <div className="empId-rows">
                      <span>
                        {employee.claims[0]?.employee_name} - [
                        {employee.employee_id}]
                      </span>
                    </div>
                    <div className="emp-rows">
                      <span>
                        Total Amount Claiming: Rs{" "}
                        {filteredClaims
                          .reduce(
                            (sum, claim) => sum + getClaimAmount(claim),
                            0,
                          )
                          .toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </span>
                    </div>
                    <div className="emp-rows">
                      <span>
                        Amount Approved: Rs{" "}
                        {filteredClaims
                          .filter(
                            (claim) =>
                              String(claim.status || "").toLowerCase() ===
                              "approved",
                          )
                          .reduce(
                            (sum, claim) => sum + getClaimAmount(claim),
                            0,
                          )
                          .toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </span>
                    </div>
                    <div className="rbtoggle-btn">
                      {expandedRows[employee.employee_id] ? (
                        <FaChevronUp className="drop-icon" />
                      ) : (
                        <FaChevronDown className="drop-icon" />
                      )}
                    </div>
                  </div>
                  {expandedRows[employee.employee_id] && (
                    <div className="reimbursement-table-scroll">
                      <div className="rb-sub-container">
                        <table className="rb-sub-table">
                          <thead>
                            <tr>
                              <th>Sl No</th>
                              <th>Claim Type</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Purpose</th>
                              <th>Participants</th>
                              <th>Invoice(s)</th>
                              <th>Attachments</th>
                              <th>Status</th>
                              <th>Projects</th>
                              <th>Approver Comments</th>
                              <th>Payment Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClaims.map((rb, index) => {
                              const lines = Array.isArray(rb.lines)
                                ? rb.lines
                                    .slice()
                                    .sort(
                                      (a, b) =>
                                        (a.line_index || 0) -
                                        (b.line_index || 0),
                                    )
                                : [];

                              const claimLevelInvs = parseInvoicesForClaim(rb);
                              const invSet = new Set(
                                (claimLevelInvs || []).map((i) =>
                                  String(i).trim(),
                                ),
                              );

                              lines.forEach((ln) => {
                                const lnInvRaw =
                                  ln?.payload?.invoices ||
                                  ln?.payload?.invoice ||
                                  [];
                                let parsed = lnInvRaw;
                                try {
                                  if (
                                    typeof parsed === "string" &&
                                    parsed.trim()
                                  )
                                    parsed = JSON.parse(parsed);
                                } catch (e) {}
                                if (typeof parsed === "string") {
                                  parsed = parsed
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                }
                                if (Array.isArray(parsed)) {
                                  parsed.forEach((i) => {
                                    if (i) invSet.add(String(i).trim());
                                  });
                                }
                              });

                              const claimInvDisplay = invSet.size
                                ? Array.from(invSet).join(", ")
                                : "-";

                              const firstLinePayload =
                                lines && lines.length
                                  ? lines[0].payload || {}
                                  : {};
                              const amountDisplayNumber = getClaimAmount(rb);

                              return (
                                <React.Fragment
                                  key={
                                    rb.id || `${employee.employee_id}-${index}`
                                  }
                                >
                                  <tr className="claim-main-row">
                                    <td>
                                      <button
                                        type="button"
                                        onClick={() => toggleClaimExpand(rb.id)}
                                        aria-expanded={!!expandedClaims[rb.id]}
                                        title={
                                          expandedClaims[rb.id]
                                            ? "Collapse"
                                            : "Expand"
                                        }
                                        style={{ minWidth: 36 }}
                                      >
                                        {expandedClaims[rb.id] ? "−" : "+"}
                                      </button>{" "}
                                      {index + 1}
                                    </td>

                                    <td>{rb.claim_type || "-"}</td>

                                    <td>
                                      {resolveDateDisplay(
                                        lines && lines.length
                                          ? lines[0].payload
                                          : {},
                                        rb,
                                      )}
                                    </td>

                                    <td>
                                      ₹
                                      {amountDisplayNumber.toLocaleString(
                                        "en-IN",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </td>

                                    <td
                                      className="participants-cell-col"
                                      title={rb.purpose}
                                    >
                                      <div className="rbadmin-comments">
                                        {rb.purpose || rb.comments || "-"}
                                      </div>
                                    </td>

                                    <td
                                      className="participants-cell-col"
                                      title={getParticipantNamesForClaim(rb)}
                                    >
                                      <div className="rbadmin-comments">
                                        {getParticipantNamesForClaim(rb)}
                                      </div>
                                    </td>

                                    <td
                                      className="invoice-cell"
                                      title={claimInvDisplay}
                                      style={{
                                        maxWidth: 180,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {claimInvDisplay}
                                    </td>

                                    <td>
                                      {attachments[rb.id] &&
                                      attachments[rb.id].length > 0 ? (
                                        <button
                                          className="attachments-btn"
                                          onClick={() =>
                                            handleOpenAttachments(
                                              attachments[rb.id],
                                              rb,
                                            )
                                          }
                                        >
                                          <MdOutlineRemoveRedEye className="eye-icon" />{" "}
                                          View
                                        </button>
                                      ) : rb.line_attachments_map &&
                                        Object.keys(rb.line_attachments_map)
                                          .length > 0 ? (
                                        <button
                                          className="attachments-btn"
                                          onClick={() =>
                                            handleOpenAttachments(
                                              Object.values(
                                                rb.line_attachments_map,
                                              ).flat(),
                                              rb,
                                            )
                                          }
                                        >
                                          <MdOutlineRemoveRedEye className="eye-icon" />{" "}
                                          View Line Attachments
                                        </button>
                                      ) : (
                                        "Not Attached"
                                      )}
                                    </td>

                                    <td>
                                      {rb.status === "approved" ||
                                      rb.status === "rejected" ? (
                                        <span
                                          className={`status-label ${rb.status}`}
                                        >
                                          <span className="status-dot"></span>
                                          {rb.status.charAt(0).toUpperCase() +
                                            rb.status.slice(1)}
                                        </span>
                                      ) : (
                                        <select
                                          className="rb-status-dropdown"
                                          value={
                                            statusUpdates[rb.id] ||
                                            rb.status ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            handleStatusChange(
                                              rb.id,
                                              e.target.value,
                                            )
                                          }
                                        >
                                          <option value="">Pending</option>
                                          <option value="approved">
                                            Approve
                                          </option>
                                          <option value="rejected">
                                            Reject
                                          </option>
                                        </select>
                                      )}
                                    </td>

                                    <td>
                                      {rb.status === "approved" ||
                                      rb.status === "rejected" ? (
                                        <div className="rbadmin-comments">
                                          {projectSelections[rb.id] ||
                                            rb.project}
                                        </div>
                                      ) : (
                                        <select
                                          className="rb-status-dropdown"
                                          value={
                                            projectSelections[rb.id] !==
                                            undefined
                                              ? projectSelections[rb.id]
                                              : rb.project || ""
                                          }
                                          onChange={(e) =>
                                            setProjectSelections((prev) => ({
                                              ...prev,
                                              [rb.id]: e.target.value,
                                            }))
                                          }
                                        >
                                          <option value="">Select</option>
                                          {orgClaimLabel && (
                                            <option value={orgClaimLabel}>
                                              {orgClaimLabel}
                                            </option>
                                          )}

                                          {rb.project &&
                                            rb.project !== orgClaimLabel &&
                                            !safeProjects.includes(
                                              rb.project,
                                            ) && (
                                              <option
                                                key={`current-${rb.id}`}
                                                value={rb.project}
                                              >
                                                {rb.project}
                                              </option>
                                            )}

                                          {safeProjects.map((project, idx) => (
                                            <option key={idx} value={project}>
                                              {project}
                                            </option>
                                          ))}
                                        </select>
                                      )}
                                    </td>

                                    <td>
                                      {rb.status === "approved" ||
                                      rb.status === "rejected" ? (
                                        <div className="rbadmin-comments">
                                          {rb.approver_comments ||
                                            "No comments"}
                                        </div>
                                      ) : (
                                        <input
                                          type="text"
                                          placeholder="Enter comments"
                                          value={comments[rb.id] || ""}
                                          onChange={(e) =>
                                            setComments((prev) => ({
                                              ...prev,
                                              [rb.id]: e.target.value,
                                            }))
                                          }
                                        />
                                      )}
                                    </td>

                                    <td>
                                      {rb.status?.toLowerCase().trim() ===
                                      "approved" ? (
                                        !rb.payment_status ||
                                        rb.payment_status
                                          ?.toLowerCase()
                                          .trim() === "pending" ? (
                                          <button
                                            className="pending-payment-btn"
                                            onClick={() => {
                                              setSelectedPaymentClaim(rb);
                                              const current = rb.payment_status
                                                ? String(rb.payment_status)
                                                    .toLowerCase()
                                                    .trim()
                                                : "pending";
                                              setSelectedPaymentOption(current);
                                              setIsPaymentModalOpen(true);
                                            }}
                                          >
                                            Pending
                                          </button>
                                        ) : (
                                          <span>
                                            {rb.payment_status
                                              ? rb.payment_status
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                rb.payment_status.slice(1)
                                              : "N/A"}
                                            {rb.paid_date
                                              ? ` (${formatDisplayDate(
                                                  rb.paid_date,
                                                )})`
                                              : ""}
                                          </span>
                                        )
                                      ) : (
                                        <span>{rb.payment_status || "-"}</span>
                                      )}
                                    </td>

                                    <td>
                                      <FaFileInvoice
                                        size={24}
                                        className="update-btn"
                                        onClick={() => {
                                          if (
                                            rb.status === "approved" ||
                                            rb.status === "rejected"
                                          )
                                            return;
                                          updateStatus(rb.id);
                                        }}
                                        title="Update status"
                                      />
                                      <FiDownload
                                        size={24}
                                        className="download-btn"
                                        onClick={() => handleDownload(rb)}
                                        title="Download PDF"
                                      />
                                    </td>
                                  </tr>

                                  {expandedClaims[rb.id] &&
                                    (lines.length
                                      ? lines
                                      : [{ id: null, payload: rb }]
                                    ).map((line, li) => {
                                      const payload = line.payload || {};
                                      const lineInvsRaw =
                                        payload.invoices ||
                                        payload.invoice ||
                                        [];
                                      let lineInvs = [];
                                      try {
                                        if (
                                          typeof lineInvsRaw === "string" &&
                                          lineInvsRaw.trim()
                                        ) {
                                          lineInvs = JSON.parse(lineInvsRaw);
                                        } else if (Array.isArray(lineInvsRaw)) {
                                          lineInvs = lineInvsRaw;
                                        }
                                      } catch (e) {
                                        if (typeof lineInvsRaw === "string") {
                                          lineInvs = lineInvsRaw
                                            .split(",")
                                            .map((s) => s.trim())
                                            .filter(Boolean);
                                        }
                                      }
                                      const lnInvDisplay =
                                        Array.isArray(lineInvs) &&
                                        lineInvs.length
                                          ? lineInvs.join(", ")
                                          : claimInvDisplay;

                                      const lineAttachMap =
                                        rb.line_attachments_map || {};
                                      const attachmentsForThis =
                                        (line &&
                                          (lineAttachMap[String(line.id)] ||
                                            lineAttachMap[line.id])) ||
                                        [];

                                      const lineAmount = line
                                        ? line.total_amount ||
                                          payload.total_amount ||
                                          0
                                        : 0;

                                      return (
                                        <tr
                                          key={`line-${rb.id}-${line.id ?? li}`}
                                          className="claim-line-row"
                                        >
                                          <td></td>
                                          <td></td>
                                          <td>
                                            {resolveDateDisplay(payload, rb)}
                                          </td>
                                          <td>
                                            {Number(lineAmount || 0).toFixed(2)}
                                          </td>
                                          <td style={{ paddingLeft: 12 }}>
                                            {payload.purpose || "-"}
                                          </td>
                                          <td
                                            className="participants-cell-col"
                                            title={getParticipantNamesForClaim(
                                              rb,
                                            )}
                                          >
                                            <div className="rbadmin-comments">
                                              {getParticipantNamesForClaim(rb)}
                                            </div>
                                          </td>
                                          <td
                                            className="invoice-cell"
                                            title={lnInvDisplay}
                                          >
                                            {lnInvDisplay}
                                          </td>
                                          <td>
                                            {attachmentsForThis &&
                                            attachmentsForThis.length > 0 ? (
                                              <button
                                                className="attachments-btn"
                                                onClick={() =>
                                                  handleOpenAttachments(
                                                    attachmentsForThis.map(
                                                      (a) => ({
                                                        filename:
                                                          a.file_name ||
                                                          a.filename ||
                                                          a.fileName,
                                                        file_name:
                                                          a.file_name ||
                                                          a.filename,
                                                      }),
                                                    ),
                                                    rb,
                                                  )
                                                }
                                              >
                                                <MdOutlineRemoveRedEye className="eye-icon" />{" "}
                                                View
                                              </button>
                                            ) : (
                                              "Not Attached"
                                            )}
                                          </td>
                                          <td></td>
                                          <td></td>
                                          <td></td>
                                          <td></td>
                                          <td></td>
                                        </tr>
                                      );
                                    })}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Reimbursement />
      )}
      {isEditModalOpen && claimToEdit && (
        <Modal
          isVisible={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          buttons={[
            { label: "Close", onClick: () => setIsEditModalOpen(false) },
            {
              label: "Open in Self View",
              onClick: () => confirmOpenInSelfView(claimToEdit),
            },
          ]}
        >
          <h3>Edit Claim</h3>
          <p>
            <strong>Claim ID:</strong> {claimToEdit.id}
          </p>
          <p>
            <strong>Employee:</strong> {claimToEdit.employee_name} (
            {claimToEdit.employee_id})
          </p>
          <p>
            <strong>Type:</strong> {claimToEdit.claim_type}
          </p>
          <p>
            <strong>Amount:</strong> ₹{claimToEdit.total_amount}
          </p>
          <p>
            <strong>Purpose:</strong> {claimToEdit.purpose || "—"}
          </p>
          <p style={{ color: "#555", marginTop: 8 }}>
            Clicking "Open in Self View" will switch to the Self tab and store a
            temporary edit id in localStorage (`reimbursementEditId`). The
            Reimbursement UI can read that value to prefill the form for
            editing.
          </p>
        </Modal>
      )}
      {isParticipantsModalOpen && (
        <Modal
          isVisible={isParticipantsModalOpen}
          onClose={() => setIsParticipantsModalOpen(false)}
          buttons={[
            {
              label: "Cancel",
              onClick: () => setIsParticipantsModalOpen(false),
            },
            {
              label: participantsSaving ? "Saving..." : "Save",
              onClick: saveParticipants,
              disabled: participantsSaving,
            },
          ]}
        >
          <h3>Manage Participants</h3>
          <ParticipantSelection
            departmentId={departmentId}
            selectionMode="group"
            onSelectionChange={handleParticipantSelectionChange}
            initialSelection={
              participantsForEdit && participantsForEdit.length
                ? employeeOptions.filter((eo) =>
                    participantsForEdit.includes(String(eo.employee_id)),
                  )
                : []
            }
            limit={500}
            orgId={orgId}
          />
          <div className="participants-modal-selected">
            <div className="selected-title">Selected:</div>
            <div className="selected-list">
              {participantsForEdit && participantsForEdit.length ? (
                participantsForEdit.map((pid) => {
                  const found = employeeOptions.find(
                    (e) => String(e.employee_id) === String(pid),
                  );
                  return (
                    <div key={pid} className="selected-item">
                      {found ? `${found.name} [${pid}]` : pid}
                    </div>
                  );
                })
              ) : (
                <div className="selected-none">No participants selected.</div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {isModalOpen && (
        <div className="att-modal-overlay">
          <div className="att-modal-content">
            <div className="att-header">
              <h2>Attachments</h2>
              <MdOutlineCancel
                className="att-close"
                onClick={() => setIsModalOpen(false)}
              />
            </div>
            <h4 className="att-files">
              {selectedClaim?.claim_type
                ? `${selectedClaim.claim_type} Bills`
                : "Bills"}
            </h4>
            {selectedFiles.length > 0 ? (
              selectedFiles.map((file, index) => (
                <div className="att-files" key={index}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.name}
                  </a>
                </div>
              ))
            ) : (
              <p>No attachments available</p>
            )}
            <button
              className="att-close-btn"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {isPaymentModalOpen && (
        <Modal
          title={"Update Payment Status"}
          isVisible={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          buttons={[]}
        >
          <div className="payment-modal-content">
            <div className="payment-options">
              <label>
                <input
                  type="radio"
                  name="paymentOption"
                  value="rejected"
                  checked={selectedPaymentOption === "rejected"}
                  onChange={(e) => setSelectedPaymentOption(e.target.value)}
                />{" "}
                Reject
              </label>
              <label>
                <input
                  type="radio"
                  name="paymentOption"
                  value="paid"
                  checked={selectedPaymentOption === "paid"}
                  onChange={(e) => setSelectedPaymentOption(e.target.value)}
                />{" "}
                Payable
              </label>
              <label>
                <input
                  type="radio"
                  name="paymentOption"
                  value="pending"
                  checked={selectedPaymentOption === "pending"}
                  onChange={(e) => setSelectedPaymentOption(e.target.value)}
                />{" "}
                Pending
              </label>
            </div>
            <p>I'll make sure to process the payment today</p>

            <button
              className="modal-cross-btn"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="submit-payment-btn"
              onClick={() =>
                updatePaymentStatus(
                  selectedPaymentClaim?.id,
                  selectedPaymentOption,
                )
              }
              disabled={!selectedPaymentOption}
            >
              Submit
            </button>
          </div>
        </Modal>
      )}
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
export default RbTeamLead;
