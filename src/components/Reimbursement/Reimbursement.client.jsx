"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Fragment,
} from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import {
  MdOutlineEdit,
  MdDeleteOutline,
  MdOutlineCancel,
  MdOutlineRemoveRedEye,
  MdEmojiTransportation,
  MdOutlinePhoneAndroid,
} from "react-icons/md";
import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
import { TbTriangleSquareCircle } from "react-icons/tb";
import "./Reimbursement.css";
import "./ParticipantSelection.css";
import Modal from "../Modal/Modal.client";
import ParticipantSelection from "./ParticipantSelection.client";
import AttachmentsModal from "./AttachmentModal.client";
import ReimbursementForm from "./ReimbursementForm.client";
import { useAuth } from "../../context/AuthProvider.client";

const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg"];
const ALLOWED_MIME = ["application/pdf", "image/png", "image/jpeg"];
const MAX_BYTES_PER_FILE = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

const claimTypes = [
  {
    icon: <MdEmojiTransportation className="claim-icons" />,
    label: "Transportation",
  },
  { icon: <GiKnifeFork className="claim-icons" />, label: "Meals" },
  {
    icon: <MdOutlinePhoneAndroid className="claim-icons" />,
    label: "Telecom",
  },
  { icon: <GiPencilBrush className="claim-icons" />, label: "Stationary" },
  {
    icon: <TbTriangleSquareCircle className="claim-icons" />,
    label: "Miscellaneous",
  },
];

const normalizeFilename = (fileName) =>
  fileName ? encodeURIComponent(fileName) : null;

const fileExtFromName = (name = "") =>
  String(name).includes(".") ? String(name).split(".").pop().toLowerCase() : "";

const isHTMLString = (s) =>
  typeof s === "string" && /<\s*!doctype|<\s*html/i.test(s.trim());

const tryExtractYearMonthFromPath = (filePath) => {
  if (!filePath) return {};
  const p = filePath.replace(/\\/g, "/");
  const m = p.match(/\/reimbursement\/(\d{4})\/(\d{2})\/([^/]+)\/([^/]+)$/);
  if (m) return { year: m[1], month: m[2], empId: m[3], filename: m[4] };
  const parts = p.split("/").filter(Boolean);
  if (parts.length >= 4) {
    const filename = parts[parts.length - 1];
    const empId = parts[parts.length - 2];
    const month = parts[parts.length - 3];
    const year = parts[parts.length - 4];
    const okYear = year && /^\d{4}$/.test(year) ? year : null;
    const okMonth = month && /^\d{2}$/.test(month) ? month : null;
    return { year: okYear, month: okMonth, empId: empId || null, filename };
  }
  return {};
};

const buildBackendAttachmentUrl = (
  BACKEND,
  year,
  month,
  empId,
  filename,
  orgId,
) => {
  if (!BACKEND) return null;
  if (!year || !month || !empId || !filename || !orgId) return null;
  return `${BACKEND}/reimbursement/${orgId}/${year}/${month}/${empId}/${normalizeFilename(
    filename,
  )}`;
};

const tryParseDate = (s) => {
  if (!s && s !== 0) return null;
  if (s instanceof Date && !isNaN(s)) return s;
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

const normalizeStartOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const normalizeEndOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const defaultRowForType = (type) => {
  const base = {
    purpose: "",
    attachments: [],
    invoices: [],
    total_amount: "",
  };

  switch (String(type || "").toLowerCase()) {
    case "transportation":
      return {
        ...base,
        travel_from: "",
        travel_to: "",
        transport_amount: "",
        accommodation_fees: "",
        da: "",
      };
    case "meals":
      return {
        ...base,
        meal_type: "",
        meals_objective: "",
      };
    case "telecommunication":
    case "telecom":
      return {
        ...base,
        service_provider: "",
      };
    case "stationary":
      return {
        ...base,
        stationary: "",
        purchasing_item: "",
      };
    case "miscellaneous":
      return { ...base };
    default:
      return { ...base };
  }
};

const makeClientUniqueName = (file, rowIdx = null) => {
  const ext =
    file && file.name && file.name.includes(".")
      ? "." + String(file.name).split(".").pop()
      : "";
  const shortUid = Math.random().toString(36).slice(2, 8);
  const prefix = typeof rowIdx === "number" ? `r${rowIdx}` : "m";
  return `${prefix}_${Date.now()}_${shortUid}${ext}`;
};

const Reimbursement = () => {
  const { user } = useAuth();

  // —— removed all localStorage fallbacks — derive from user / env only ——
  const role = String(user?.role || "Employee");
  const authToken =
    user?.raw?.token ||
    user?.raw?.authToken ||
    user?.token ||
    user?.authToken ||
    "";

  const employeeId =
    user?.employeeId ||
    user?.id ||
    user?.raw?.employee_id ||
    user?.raw?.empId ||
    "";
  const departmentId = user?.raw?.department_id || user?.department_id || "";

  // --- orgId state & resolution (to avoid "orgId required" errors) ---
  const [orgId, setOrgId] = useState(
    user?.orgId ||
      user?.raw?.org_id ||
      user?.org_id ||
      user?.organization_id ||
      null,
  );
  const [orgResolveTried, setOrgResolveTried] = useState(false);
  const [resolvingOrg, setResolvingOrg] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const resolveOrgIdOnce = useCallback(async () => {
    if (orgId) return orgId;
    if (orgResolveTried) return orgId;
    if (
      !process.env.NEXT_PUBLIC_BACKEND_URL &&
      !process.env.REACT_APP_BACKEND_URL
    ) {
      setOrgResolveTried(true);
      return null;
    }
    if (!authToken) {
      setOrgResolveTried(true);
      return null;
    }
    if (resolvingOrg) return null;
    setResolvingOrg(true);

    const RAW_BACKEND =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.REACT_APP_BACKEND_URL ||
      "";
    const BACKEND = RAW_BACKEND.replace(/\/$/, "");
    const candidatePaths = [
      "/me",
      "/profile",
      "/user/profile",
      "/auth/me",
      "/user",
    ];
    let found = null;

    try {
      for (const p of candidatePaths) {
        const url = `${BACKEND}${p}`;
        try {
          const resp = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "x-api-key":
                process.env.NEXT_PUBLIC_API_KEY ||
                process.env.REACT_APP_API_KEY ||
                "",
            },
            withCredentials: true,
          });
          const data = resp?.data;
          if (!data) continue;
          const candidate =
            data.orgId ||
            data.org_id ||
            data.organization_id ||
            data.organization?.id ||
            data.organization?.org_id ||
            null;
          if (candidate) {
            found = String(candidate);
            break;
          }
          if (data.user) {
            const u = data.user;
            const cand =
              u.orgId ||
              u.org_id ||
              u.organization_id ||
              u.organization?.id ||
              u.organization?.org_id ||
              null;
            if (cand) {
              found = String(cand);
              break;
            }
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
      setOrgResolveTried(true);
    }

    if (found) {
      setOrgId(found);
      console.info("Resolved orgId for requests:", found);
      return found;
    }
    console.warn(
      "Could not resolve orgId from profile endpoints; requests may fail if backend requires x-org-id",
    );
    return null;
  }, [authToken, orgId, orgResolveTried, resolvingOrg]);

  const [reimbursements, setReimbursements] = useState([]);
  const [filteredReimbursements, setFilteredReimbursements] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedClaims, setExpandedClaims] = useState(new Set());
  const initialAttachmentsRef = useRef([]);
  // ensure backendBase is defined in client files
  const backendBase =
    (
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.REACT_APP_BACKEND_URL ||
      ""
    ) // empty string falls back to default below
      .replace(/\/$/, "") || "http://localhost:5001";

  const toggleExpand = (claimId) => {
    setExpandedClaims((prev) => {
      const s = new Set(prev);
      if (s.has(claimId)) s.delete(claimId);
      else s.add(claimId);
      return s;
    });
  };

  const isExpanded = (claimId) => expandedClaims.has(claimId);

  const [attachments, setAttachments] = useState({});
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [attachmentViewerFiles, setAttachmentViewerFiles] = useState([]);
  const [attachmentViewerTitle, setAttachmentViewerTitle] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [updateErrorMessage, setUpdateErrorMessage] = useState("");
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState(
    role === "Admin" ? "approved" : "pending",
  );

  const [participantMode, setParticipantMode] = useState("single");
  const [participants, setParticipants] = useState(
    employeeId ? [employeeId] : [],
  );
  const [employeeOptions, setEmployeeOptions] = useState([]);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const [confirmModal, setConfirmModal] = useState({
    isVisible: false,
    id: null,
    title: "Confirm",
    message: "",
    claim: null,
  });
  const openConfirmDelete = (id, claim = null) =>
    setConfirmModal({
      isVisible: true,
      id,
      title: "Delete Reimbursement",
      message: "Are you sure you want to delete this reimbursement?",
      claim,
    });
  const closeConfirmDelete = () =>
    setConfirmModal({
      isVisible: false,
      id: null,
      title: "",
      message: "",
      claim: null,
    });

  const [formData, setFormData] = useState({
    employeeId,
    department_id: departmentId,
    claim_type: "",
    transport_type: "",
    transport_amount: "",
    da: "",
    fromDate: "",
    toDate: "",
    date: "",
    travel_from: "",
    travel_to: "",
    meals_objective: "",
    purpose: "",
    purchasing_item: "",
    accommodation_fees: "",
    no_of_days: "",
    total_amount: "",
    meal_type: "",
    stationary: "",
    service_provider: "",
    project: "",
    attachments: null,
    invoices: [],
    _forceShowTransport: false,
  });

  // BACKEND resolution (support NEXT_PUBLIC and REACT_APP only)
  const RAW_BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const BACKEND = (() => {
    if (!RAW_BACKEND) return "";
    if (!/^https?:\/\//i.test(RAW_BACKEND))
      return `http://${RAW_BACKEND}`.replace(/\/$/, "");
    return RAW_BACKEND.replace(/\/$/, "");
  })();

  // Build headers: prefer resolved orgId state
  const buildHeaders = useCallback(() => {
    const h = {};
    const apiKey =
      process.env.NEXT_PUBLIC_API_KEY || process.env.REACT_APP_API_KEY || "";
    if (apiKey) h["x-api-key"] = apiKey;
    if (authToken) h["Authorization"] = `Bearer ${authToken}`;

    const actorId =
      (user &&
        (user.employeeId || user.id || user.emp_id || user.employee_id)) ||
      null;
    if (actorId) h["x-employee-id"] = String(actorId);

    const effectiveOrgId =
      orgId ||
      (user &&
        (user.orgId ||
          user.org_id ||
          user.organization_id ||
          (user.raw && user.raw.org_id))) ||
      null;
    if (effectiveOrgId) h["x-org-id"] = String(effectiveOrgId);

    if (typeof window !== "undefined") {
      console.debug(
        "buildHeaders -> x-employee-id:",
        h["x-employee-id"],
        "x-org-id:",
        h["x-org-id"],
      );
    }

    return h;
  }, [authToken, user, orgId]);

  const extractErrorMessage = (
    err,
    fallback = "An unexpected error occurred.",
  ) => {
    const data = err?.response?.data;
    if (data) {
      if (typeof data === "string") {
        const trimmed = data.trim();
        if (isHTMLString(trimmed)) {
          const status = err?.response?.status;
          if (status === 415)
            return `Invalid file type. Allowed: ${ALLOWED_EXT.join(
              ", ",
            ).toUpperCase()}.`;
          if (status === 403 || status === 401)
            return "You are not authorized to upload this file.";
          return "Server rejected the uploaded file (invalid/forbidden). Please check file type and try again.";
        }
        return data;
      }
      if (data.error) return data.error;
      if (data.message) return data.message;
      if (data.errors) {
        if (Array.isArray(data.errors)) return data.errors.join(", ");
        if (typeof data.errors === "object") return JSON.stringify(data.errors);
      }
    }
    if (err?.message) return err.message;
    return fallback;
  };

  const validateFileObject = (file) => {
    if (!file || typeof file !== "object")
      return { ok: false, reason: "Invalid file" };
    if (!(file instanceof File)) return { ok: true };
    const ext = fileExtFromName(file.name);
    if (!ALLOWED_EXT.includes(ext))
      return { ok: false, reason: "Invalid file type" };
    if (file.type && !ALLOWED_MIME.includes(file.type)) {
      return { ok: false, reason: "Invalid file mime type" };
    }
    if (file.size > MAX_BYTES_PER_FILE)
      return {
        ok: false,
        reason: `File too large (max ${MAX_BYTES_PER_FILE / 1024 / 1024} MB)`,
      };
    return { ok: true };
  };

  const validateFilesArray = (files = []) => {
    const invalids = [];
    const valids = [];
    let totalBytes = 0;
    for (const f of files) {
      if (f instanceof File) totalBytes += f.size;
    }
    if (totalBytes > MAX_TOTAL_BYTES) {
      return {
        ok: false,
        invalids: [],
        valids: [],
        reason: `Total selected files exceed maximum allowed size (${
          MAX_TOTAL_BYTES / 1024 / 1024
        } MB).`,
      };
    }
    for (const f of files) {
      const res = validateFileObject(f);
      if (!res.ok)
        invalids.push({ file: f, reason: res.reason || "Invalid file" });
      else valids.push(f);
    }
    return { ok: invalids.length === 0, invalids, valids };
  };

  const handleFileUpload = (e, meta = {}) => {
    try {
      const rawFiles = Array.from(e.target.files || []);
      if (!rawFiles.length) {
        setSelectedFiles([]);
        setFormData((p) => ({ ...p, attachments: null }));
        return;
      }

      const validation = validateFilesArray(rawFiles);
      if (!validation.ok) {
        if (validation.reason) {
          showAlert(validation.reason, "Invalid files");
          setSelectedFiles([]);
          setFormData((p) => ({ ...p, attachments: null }));
          return;
        }
        if (validation.invalids && validation.invalids.length) {
          const names = validation.invalids
            .map((i) => `${i.file?.name || "(unknown)"} — ${i.reason}`)
            .join("\n");
          showAlert(
            `The following files are not allowed:\n${names}`,
            "Invalid file(s)",
          );
          setFormData((p) => ({ ...p, attachments: validation.valids }));
          setSelectedFiles(validation.valids.map((f) => f.name));
          return;
        }
      }

      const rowIndex =
        meta && typeof meta.rowIndex === "number" ? meta.rowIndex : null;
      const claimType = formData.claim_type;

      const clientFiles = rawFiles.map((file) => {
        try {
          return new File([file], makeClientUniqueName(file, rowIndex), {
            type: file.type,
          });
        } catch (err) {
          return file;
        }
      });

      const clientNames = clientFiles.map((f) => f.name);

      if (rowIndex !== null && claimType) {
        const rowsObj =
          formData.claim_rows && typeof formData.claim_rows === "object"
            ? { ...formData.claim_rows }
            : {};
        const rows = Array.isArray(rowsObj[claimType])
          ? rowsObj[claimType].slice()
          : [];

        while (rows.length <= rowIndex)
          rows.push({ ...defaultRowForType(claimType) });

        rows[rowIndex] = {
          ...(rows[rowIndex] || {}),
          _files: clientFiles,
          attachments: clientNames,
        };

        rowsObj[claimType] = rows;
        setFormData((p) => ({ ...p, claim_rows: rowsObj }));
        if (rowIndex === 0) setSelectedFiles(clientNames.slice());
        return;
      }

      setFormData((p) => ({ ...p, attachments: clientFiles }));
      setSelectedFiles(clientNames.slice());
    } catch (err) {
      console.error("handleFileUpload error", err);
      showAlert("Could not process selected files. Please try again.");
    }
  };

  const fetchReimbursements = useCallback(async () => {
    try {
      // ensure orgId resolved before requesting (most backend endpoints require x-org-id)
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();

      const url =
        employeeId && employeeId !== ""
          ? `${
              BACKEND ||
              process.env.NEXT_PUBLIC_BACKEND_URL ||
              process.env.REACT_APP_BACKEND_URL
            }/reimbursement/${employeeId}`
          : `${
              BACKEND ||
              process.env.NEXT_PUBLIC_BACKEND_URL ||
              process.env.REACT_APP_BACKEND_URL
            }/reimbursements`;

      const config = { withCredentials: true, headers: buildHeaders() };
      if (String(url).includes("/uploads/")) {
        config.withCredentials = true;
        config.responseType = "blob";
      }

      const res = await axios.get(url, config);
      const data = Array.isArray(res.data) ? res.data : res.data || [];
      setReimbursements(data);

      const attachmentsData = {};
      await Promise.all(
        data.map(async (claim) => {
          try {
            const attachRes = await axios.get(
              `${
                BACKEND ||
                process.env.NEXT_PUBLIC_BACKEND_URL ||
                process.env.REACT_APP_BACKEND_URL
              }/reimbursement/${claim.id}/attachments`,
              { withCredentials: true, headers: buildHeaders() },
            );
            attachmentsData[claim.id] = attachRes.data.attachments || [];
          } catch {
            attachmentsData[claim.id] = [];
          }
        }),
      );
      const dataWithAttach = (data || []).map((claim) => {
        const list = attachmentsData[claim.id] || [];
        const line_attachments_map = {};
        const claimLevelAttachments = [];

        list.forEach((a) => {
          const lineId = a.line_id ?? a.lineId ?? a.line ?? null;
          if (lineId !== null && lineId !== undefined) {
            const key = String(lineId);
            if (!line_attachments_map[key]) line_attachments_map[key] = [];
            line_attachments_map[key].push(a);
          } else {
            claimLevelAttachments.push(a);
          }
        });

        return {
          ...claim,
          attachments: claimLevelAttachments,
          line_attachments_map,
        };
      });

      setReimbursements(dataWithAttach);
      setAttachments(attachmentsData);
    } catch (err) {
      console.error("Error fetching reimbursements:", err);
      setErrorMessage(
        extractErrorMessage(err, "Error fetching reimbursements"),
      );
    }
  }, [
    employeeId,
    BACKEND,
    buildHeaders,
    orgId,
    orgResolveTried,
    resolveOrgIdOnce,
  ]);

  const fetchProjects = useCallback(async () => {
    try {
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();
      const res = await axios.get(
        `${
          BACKEND ||
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          process.env.REACT_APP_BACKEND_URL
        }/projectdrop`,
        { withCredentials: true, headers: buildHeaders() },
      );
      setProjects(res.data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }, [BACKEND, buildHeaders, orgId, orgResolveTried, resolveOrgIdOnce]);

  const fetchEmployees = useCallback(async () => {
    try {
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();
      const url = `${
        BACKEND ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.REACT_APP_BACKEND_URL
      }/reimbursement/employees`;
      const res = await axios.get(url, {
        withCredentials: true,
        headers: buildHeaders(),
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
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
        "Could not fetch /reimbursement/employees — falling back to demo list",
      );
      setEmployeeOptions([
        { employee_id: employeeId || "E000", name: "You", position: "" },
        { employee_id: "E1001", name: "Priya Sharma", position: "Developer" },
        { employee_id: "E1002", name: "Rahul Verma", position: "Analyst" },
        { employee_id: "E1003", name: "Amit Patel", position: "Sales" },
      ]);
    }
  }, [
    employeeId,
    BACKEND,
    buildHeaders,
    orgId,
    orgResolveTried,
    resolveOrgIdOnce,
  ]);

  useEffect(() => {
    // init: try to resolve orgId first (if missing) then load data
    const init = async () => {
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();
      await fetchReimbursements();
      fetchProjects();
      fetchEmployees();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseClaimRange = (claim) => {
    let start = null,
      end = null;
    if (claim.date_range && typeof claim.date_range === "string") {
      const unified = claim.date_range
        .replace(/\s+to\s+/i, " - ")
        .replace(/\u2013|\u2014/g, " - ");
      const parts = unified.split(" - ").map((p) => p.trim());
      if (parts.length >= 2) {
        start = tryParseDate(parts[0]);
        end = tryParseDate(parts[1]);
      }
    }
    if (!start && (claim.from_date || claim.fromDate))
      start = tryParseDate(claim.from_date || claim.fromDate);
    if (!end && (claim.to_date || claim.toDate))
      end = tryParseDate(claim.to_date || claim.toDate);
    if (!start && claim.date) start = tryParseDate(claim.date);
    if (!start && claim.created_at) start = tryParseDate(claim.created_at);
    if (start && !end) end = start;
    if (start && end) {
      start = normalizeStartOfDay(start);
      end = normalizeEndOfDay(end);
    }
    return { start, end };
  };

  const applyFilters = useCallback(() => {
    const fRaw = fromDate ? tryParseDate(fromDate) : null;
    const tRaw = toDate ? tryParseDate(toDate) : null;
    const fStart = fRaw ? normalizeStartOfDay(fRaw) : null;
    const tEnd = tRaw ? normalizeEndOfDay(tRaw) : null;

    const filtered = reimbursements.filter((claim) => {
      if (
        statusFilter &&
        claim.status &&
        claim.status.toLowerCase() !== statusFilter.toLowerCase()
      )
        return false;
      if (!fStart && !tEnd) return true;
      const { start, end } = parseClaimRange(claim);
      if (!start || !end) return !fStart && !tEnd;
      if (fStart && !tEnd) return end.getTime() >= fStart.getTime();
      if (!fStart && tEnd) return start.getTime() <= tEnd.getTime();
      if (fStart && tEnd) {
        if (end.getTime() < fStart.getTime()) return false;
        if (start.getTime() > tEnd.getTime()) return false;
        return true;
      }
      return true;
    });
    setFilteredReimbursements(filtered);
  }, [reimbursements, fromDate, toDate, statusFilter]);

  useEffect(() => {
    applyFilters();
  }, [reimbursements, fromDate, toDate, statusFilter, applyFilters]);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleClaimTypeChange = (value) => {
    setFormData((p) => ({
      ...p,
      claim_type: value,
      transport_type: "",
      no_of_days: "",
      _forceShowTransport: false,
    }));
    setSelectedFiles([]);
  };

  const handleTransportSubTypeChange = (type) => {
    setFormData((p) => ({
      ...p,
      transport_type: type,
      _forceShowTransport: false,
    }));
    if (type === "Outstation") setFormData((p) => ({ ...p, no_of_days: "" }));
  };

  const handleNoOfDaysChange = (e) =>
    setFormData((p) => ({ ...p, no_of_days: e.target.value }));

  const buildClaimRowsFromLines = (lines = [], claimType) => {
    if (!Array.isArray(lines)) return {};

    return {
      [claimType]: lines
        .sort((a, b) => a.line_index - b.line_index)
        .map((line) => ({
          ...defaultRowForType(claimType),
          ...(line.payload || {}),
          total_amount: line.total_amount || line.payload?.total_amount || "",
        })),
    };
  };

  const handleEdit = (claim) => {
    setEditingId(claim.id);
    setShowForm(true);

    const claimType = claim.claim_type || "";
    const firstLine = claim.lines?.[0]?.payload || {};

    const ids =
      Array.isArray(claim.participants) && claim.participants.length
        ? claim.participants
        : [employeeId];

    setParticipants(ids);
    setParticipantMode(ids.length > 1 ? "group" : "single");

    const lam = claim.line_attachments_map || {};

    const rawLines = Array.isArray(claim.lines)
      ? claim.lines
          .slice()
          .sort((a, b) => (a.line_index || 0) - (b.line_index || 0))
      : [];
    const normalizedRows = rawLines.map((ln, idx) => {
      const payload =
        ln.payload && typeof ln.payload === "object" ? { ...ln.payload } : {};
      const base = {
        ...defaultRowForType(claimType),
        ...payload,
        total_amount:
          ln.total_amount || payload.total_amount || payload.totalAmount || "",
      };

      base.dates = base.dates || [];

      if (payload.date_range && typeof payload.date_range === "string") {
        base.date_range = payload.date_range;
        const parts = payload.date_range
          .replace(/\u2013|\u2014/g, "-")
          .split(/\s*-\s*/);
        if (parts.length >= 1 && parts[0]) base.from_date = parts[0].trim();
        if (parts.length >= 2 && parts[1]) base.to_date = parts[1].trim();
      }

      if (payload.from_date) base.from_date = payload.from_date;
      if (payload.to_date) base.to_date = payload.to_date;

      if (Array.isArray(payload.dates) && payload.dates.length) {
        base.dates = payload.dates
          .map((d) =>
            d instanceof Date ? d.toISOString().slice(0, 10) : String(d).trim(),
          )
          .filter(Boolean);
      }

      if (payload.date) {
        if (typeof payload.date === "string" && payload.date.includes(",")) {
          base.dates = base.dates.concat(
            payload.date
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          );
        } else {
          base.date = payload.date;
        }
      }

      if (base.date instanceof Date)
        base.date = base.date.toISOString().slice(0, 10);
      if (base.from_date instanceof Date)
        base.from_date = base.from_date.toISOString().slice(0, 10);
      if (base.to_date instanceof Date)
        base.to_date = base.to_date.toISOString().slice(0, 10);
      if (Array.isArray(base.dates)) {
        base.dates = base.dates
          .map((d) =>
            d instanceof Date ? d.toISOString().slice(0, 10) : String(d).trim(),
          )
          .filter(Boolean);
      }

      return base;
    });

    if (Array.isArray(rawLines) && rawLines.length) {
      for (let i = 0; i < rawLines.length; i++) {
        const ln = rawLines[i];
        const rowIndex = typeof ln.line_index === "number" ? ln.line_index : i;
        const attachList = (lam && (lam[String(ln.id)] || lam[ln.id])) || [];
        const filenames = attachList
          .map(
            (a) =>
              a?.file_name || a?.filename || a?.name || a?.fileName || null,
          )
          .filter(Boolean);

        if (!normalizedRows[rowIndex])
          normalizedRows[rowIndex] = { ...defaultRowForType(claimType) };
        normalizedRows[rowIndex] = {
          ...(normalizedRows[rowIndex] || {}),
          attachments: filenames,
        };
      }
    }

    const claimRows = {};
    if (claimType) claimRows[claimType] = normalizedRows;

    const initialList = (attachments[claim.id] || [])
      .map(
        (a) =>
          a?.file_name || a?.filename || a?.name || a?.fileName || String(a),
      )
      .filter(Boolean);
    initialAttachmentsRef.current = initialList;

    const firstRow =
      normalizedRows && normalizedRows.length && normalizedRows[0]
        ? normalizedRows[0]
        : {};

    const claimLevelDateStr = claim.date || claim.created_at || "";
    const claimLevelFromStr = claim.from_date || claim.fromDate || "";
    const claimLevelToStr = claim.to_date || claim.toDate || "";

    const canonicalizeDateString = (raw) => {
      if (!raw && raw !== 0) return null;
      if (Array.isArray(raw) && raw.length) raw = raw[0];
      let s = String(raw).trim();
      if (!s) return null;

      if (
        s.includes("-") &&
        s.split("-").length >= 2 &&
        !/^\d{4}-\d{2}-\d{2}$/.test(s)
      ) {
        const parts = s
          .split(/\s*-\s*/)
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length) s = parts[0];
      }

      const d = tryParseDate(s);
      if (d) return d.toISOString().slice(0, 10);

      const m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
      if (m) return `${m[1]}-${m[2]}-${m[3]}`;
      return null;
    };

    const splitRangeToCanon = (s) => {
      if (!s) return [null, null];
      const parts = String(s)
        .replace(/\u2013|\u2014/g, "-")
        .split(/\s*-\s*/);
      const a = parts[0] ? canonicalizeDateString(parts[0]) : null;
      const b = parts[1] ? canonicalizeDateString(parts[1]) : null;
      return [a, b];
    };

    const determineNoOfDays = (rows) => {
      if (!Array.isArray(rows) || rows.length === 0) {
        const cf = canonicalizeDateString(claimLevelFromStr);
        const ct = canonicalizeDateString(claimLevelToStr);
        if (cf && ct) return cf === ct ? "single" : "multiple";
        if (claimLevelDateStr || cf || ct) return "single";
        return "";
      }

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i] || {};

        if (Array.isArray(r.dates) && r.dates.length > 1) return "multiple";

        if (r.date_range && typeof r.date_range === "string") {
          const [ra, rb] = splitRangeToCanon(r.date_range);
          if (ra && rb && ra !== rb) return "multiple";
          if (!ra || !rb) return "multiple";
        }

        if (r.from_date && r.to_date) {
          const fa = canonicalizeDateString(r.from_date);
          const fb = canonicalizeDateString(r.to_date);
          if (fa && fb && fa !== fb) return "multiple";
          if (!fa || !fb) return "multiple";
        }
      }

      const firstRow = rows[0] || {};
      let firstCanon =
        (firstRow.date && canonicalizeDateString(firstRow.date)) ||
        (Array.isArray(firstRow.dates) &&
          firstRow.dates[0] &&
          canonicalizeDateString(firstRow.dates[0])) ||
        (firstRow.from_date && canonicalizeDateString(firstRow.from_date)) ||
        canonicalizeDateString(claimLevelDateStr) ||
        canonicalizeDateString(claimLevelFromStr) ||
        canonicalizeDateString(claimLevelToStr) ||
        null;

      if (!firstCanon && firstRow.from_date && firstRow.to_date) {
        const fa = canonicalizeDateString(firstRow.from_date);
        const fb = canonicalizeDateString(firstRow.to_date);
        if (fa && fb && fa === fb) firstCanon = fa;
      }

      const uniq = new Set();
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i] || {};
        let canon = null;
        if (r.date) canon = canonicalizeDateString(r.date);
        else if (Array.isArray(r.dates) && r.dates.length)
          canon = canonicalizeDateString(r.dates[0]);
        else if (r.from_date && r.to_date && r.from_date === r.to_date)
          canon = canonicalizeDateString(r.from_date);
        else if (r.from_date && !r.to_date)
          canon = canonicalizeDateString(r.from_date);
        else if (r.to_date && !r.from_date)
          canon = canonicalizeDateString(r.to_date);
        else if (r.date_range) {
          const [ra, rb] = splitRangeToCanon(r.date_range);
          canon = ra || rb || null;
        }

        if (!canon) canon = firstCanon;

        if (canon) uniq.add(canon);
        else {
          return "multiple";
        }
      }

      if (uniq.size === 0) return "";
      if (uniq.size === 1) return "single";
      return "multiple";
    };

    const detectedNoOfDays = determineNoOfDays(normalizedRows);

    const topDate =
      (normalizedRows[0] &&
        (normalizedRows[0].date ||
          (Array.isArray(normalizedRows[0].dates) &&
            normalizedRows[0].dates[0]))) ||
      claim.date ||
      "";
    const topFromDate =
      (normalizedRows[0] && normalizedRows[0].from_date) ||
      claim.from_date ||
      "";
    const topToDate =
      (normalizedRows[0] && normalizedRows[0].to_date) || claim.to_date || "";

    setFormData({
      employeeId: claim.employee_id || employeeId,
      department_id: claim.department_id || departmentId,

      claim_type: claimType,
      transport_type: claim.transport_type || "",

      purpose: firstRow.purpose || claim.comments || "",
      date: topDate,
      fromDate: topFromDate,
      toDate: topToDate,
      travel_from: firstRow.travel_from || "",
      travel_to: firstRow.travel_to || "",
      meals_objective: firstRow.meals_objective || "",
      purchasing_item: firstRow.purchasing_item || "",
      accommodation_fees: firstRow.accommodation_fees || "",
      da: firstRow.da || "",
      meal_type: firstRow.meal_type || "",
      service_provider: firstRow.service_provider || "",
      stationary: firstRow.stationairy_item || "",

      total_amount: claim.aggregated_total || "",

      project: claim.project || "",
      invoices: parseInvoicesFromClaim(claim),

      attachments: claim.attachments || [],

      claim_rows: claimRows,

      participants: ids,
      participant_mode: ids.length > 1 ? "group" : "single",

      no_of_days: detectedNoOfDays || claim.no_of_days || claim.noOfDays || "",

      _forceShowTransport: false,
    });
    setSelectedFiles(initialList.slice());
  };

  const getParticipantNamesForClaim = (claim = {}) => {
    const part = claim.participants || claim.participant_ids || [];
    if (!part || (Array.isArray(part) && part.length === 0)) {
      if (
        String(claim.employee_id) === String(employeeId) ||
        String(claim.employeeId) === String(employeeId)
      )
        return "You";
      return "-";
    }

    const ids = Array.from(
      new Set(
        (part || [])
          .map((p) =>
            typeof p === "object" ? p.employee_id || p.id || p.employeeId : p,
          )
          .filter(Boolean),
      ),
    );

    const names = ids.map((id) => {
      if (Array.isArray(part)) {
        const foundInClaim = part.find((p) => {
          const pid =
            typeof p === "object" ? p.employee_id || p.id || p.employeeId : p;
          return String(pid) === String(id);
        });
        if (foundInClaim && (foundInClaim.name || foundInClaim.employee_name)) {
          return foundInClaim.name || foundInClaim.employee_name;
        }
      }

      const found = employeeOptions.find(
        (e) =>
          String(e.employee_id) === String(id) ||
          String(e.id) === String(id) ||
          String(e.empId) === String(id),
      );
      if (found) return found.name;

      if (String(id) === String(employeeId)) return "You";

      return String(id);
    });

    return names.join(", ");
  };

  const tryExtractYearMonthFromPathLocal = tryExtractYearMonthFromPath;
  const handleOpenAttachments = async (files = [], claim = {}) => {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        showAlert("No attachments available for this claim.");
        return;
      }

      const possible = await Promise.all(
        files.map(async (f) => {
          try {
            const fileName = f.file_name || f.filename || f.name;
            let year, month, empId, filename;
            if (f.file_path) {
              const meta = tryExtractYearMonthFromPathLocal(f.file_path);
              year = meta.year;
              month = meta.month;
              empId = meta.empId;
              filename = meta.filename || fileName;
            }
            empId = empId || claim.employee_id || claim.employeeId || "";
            if (!year || !month) {
              const m2 = fileName && fileName.match(/^(\d{4})[-_](\d{2})/);
              if (m2) {
                year = year || m2[1];
                month = month || m2[2];
                filename = filename || fileName;
              }
            }
            filename = filename || fileName;
            let urlToFetch = null;
            if (year && month && empId && filename)
              urlToFetch = buildBackendAttachmentUrl(
                BACKEND,
                year,
                month,
                empId,
                filename,
                orgId,
              );
            else if (f.url) urlToFetch = f.url;
            else if (filename && empId)
              urlToFetch = `${BACKEND}/reimbursement/${empId}/${normalizeFilename(
                filename,
              )}`;
            if (!urlToFetch) return null;
            const resp = await axios.get(urlToFetch, {
              responseType: "blob",
              withCredentials: true,
              headers: buildHeaders(),
            });
            const blob = new Blob([resp.data], {
              type: resp.headers["content-type"] || undefined,
            });
            return { name: filename, url: URL.createObjectURL(blob) };
          } catch (err) {
            console.warn("attachment fetch failed for", f, err?.message || err);
            return null;
          }
        }),
      );

      const mapped = possible.filter(Boolean);
      if (!mapped.length) {
        showAlert(
          "No attachments could be loaded (files may be missing on server).",
        );
        return;
      }
      setAttachmentViewerFiles(mapped);
      setAttachmentViewerTitle(`${claim.claim_type || "Claim"} Bills`);
      setIsAttachmentsOpen(true);
    } catch (err) {
      console.error("Error opening attachments:", err);
      showAlert("Could not load attachments. Please try again.");
    }
  };

  const parseInvoicesFromClaim = (claim) => {
    let invs =
      claim.invoices || claim.invoice_numbers || claim.invoice_no || [];
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
    if (!Array.isArray(invs)) invs = invs ? [String(invs)] : [];
    return invs.map((i) => (i || "").toString().trim()).filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErrorMessage("");

    const wordCount = formData.purpose
      ? formData.purpose.trim().split(/\s+/).filter(Boolean).length
      : 0;
    if (wordCount < 10) {
      showAlert(
        `Purpose Details / Comments must be at least 10 words. You have ${wordCount}.`,
      );
      return;
    }

    const mainRaw =
      formData.invoices && Array.isArray(formData.invoices)
        ? formData.invoices
        : formData.invoices
          ? [formData.invoices]
          : [];
    const claimType = formData.claim_type || null;
    const rowsObj =
      formData.claim_rows && typeof formData.claim_rows === "object"
        ? formData.claim_rows
        : {};
    const rowsForType = Array.isArray(rowsObj[claimType])
      ? rowsObj[claimType]
      : [];

    const rowRaw = rowsForType.flatMap((r) => {
      if (!r || typeof r !== "object") return [];
      if (Array.isArray(r.invoices)) return r.invoices;
      if (r.invoices === undefined || r.invoices === null) return [];
      return [String(r.invoices)];
    });

    const rawInvoices = [...mainRaw, ...rowRaw];

    const cleanedInvoices = (rawInvoices || [])
      .map((i) => (i || "").toString().trim())
      .filter(Boolean);

    if (!cleanedInvoices.length) {
      showAlert(
        "Invoice / Bill Number is required. Please add at least one invoice (marked *).",
      );
      setSubmitErrorMessage("Invoice number required.");
      return;
    }

    const dupeLocal = cleanedInvoices.find(
      (v, idx) => cleanedInvoices.indexOf(v) !== idx,
    );
    if (dupeLocal) {
      showAlert(`Duplicate invoice number in form: "${dupeLocal}"`);
      setSubmitErrorMessage(`Duplicate invoice "${dupeLocal}" in the form.`);
      return;
    }

    const existingMap = {};
    (reimbursements || []).forEach((claim) => {
      if (!claim || !claim.id) return;
      if (editingId && String(claim.id) === String(editingId)) return;
      const invs = parseInvoicesFromClaim(claim);
      invs.forEach((inv) => {
        existingMap[inv.toLowerCase()] = claim.id;
      });
    });
    for (const inv of cleanedInvoices) {
      if (existingMap[inv.toLowerCase()]) {
        showAlert(
          `Duplicate invoice detected: "${inv}" is already used in reimbursement ID ${
            existingMap[inv.toLowerCase()]
          }. Please verify and use a unique invoice number.`,
        );
        setSubmitErrorMessage(
          `Duplicate invoice "${inv}" found in claim ${
            existingMap[inv.toLowerCase()]
          }.`,
        );
        return;
      }
    }

    const attachmentsForValidation = formData.attachments || [];
    const attachmentsArray = Array.isArray(attachmentsForValidation)
      ? attachmentsForValidation
      : [attachmentsForValidation];
    const validation = validateFilesArray(attachmentsArray);
    if (!validation.ok) {
      if (validation.reason) showAlert(validation.reason, "Invalid files");
      else if (validation.invalids && validation.invalids.length) {
        const names = validation.invalids
          .map((i) => `${i.file?.name || "(unknown)"} — ${i.reason}`)
          .join("\n");
        showAlert(
          `Cannot submit. The following files are not allowed:\n${names}`,
          "Invalid file(s)",
        );
      } else showAlert("Cannot submit due to invalid attachments.");
      setSubmitErrorMessage("Invalid attachments present.");
      return;
    }

    try {
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();

      const fd = new FormData();

      const claimType = formData.claim_type || null;
      const rowsObj =
        formData.claim_rows && typeof formData.claim_rows === "object"
          ? formData.claim_rows
          : {};
      const rowsForType = Array.isArray(rowsObj[claimType])
        ? rowsObj[claimType]
        : [];

      const lines = rowsForType.map((r, idx) => {
        const payload = { ...(r || {}) };

        if (payload._files) delete payload._files;

        if (payload.invoices && !Array.isArray(payload.invoices)) {
          payload.invoices = [String(payload.invoices)];
        }

        if (idx === 0) {
          if (formData.date) payload.date = formData.date;
          if (formData.fromDate) payload.from_date = formData.fromDate;
          if (formData.toDate) payload.to_date = formData.toDate;
        }

        const totalNum = Number(payload.total_amount || 0);
        const total = Number.isFinite(totalNum) ? totalNum : 0;

        return {
          line_type: claimType,
          payload,
          total_amount: Number(total).toFixed(2),
        };
      });

      fd.append("lines", JSON.stringify(lines));

      if (cleanedInvoices && cleanedInvoices.length)
        fd.append("invoices", JSON.stringify(cleanedInvoices));

      fd.append("role", role || "Employee");

      if (claimType) fd.append("claim_type", claimType);
      if (formData.transport_type)
        fd.append("transport_type", formData.transport_type);
      if (formData.project) fd.append("project", formData.project);
      if (formData.purpose) fd.append("comments", formData.purpose);

      const attachmentsMeta = {};

      rowsForType.forEach((r, idx) => {
        const files = Array.isArray(r._files) ? r._files : [];
        for (const file of files) {
          const uniqueName = file.name;
          fd.append("attachments", file, uniqueName);
          attachmentsMeta[uniqueName] = idx;
        }
      });

      if (formData.attachments && Array.isArray(formData.attachments)) {
        for (const file of formData.attachments) {
          if (file instanceof File) {
            fd.append("attachments", file, file.name);
          }
        }
      }

      if (Object.keys(attachmentsMeta).length > 0)
        fd.append("attachmentsMeta", JSON.stringify(attachmentsMeta));

      const existingAttachmentsObjects = [];

      const currentAttachmentsRaw = formData.attachments || [];
      const currentAttachmentsArr = Array.isArray(currentAttachmentsRaw)
        ? currentAttachmentsRaw
        : [currentAttachmentsRaw];
      for (const item of currentAttachmentsArr) {
        if (item instanceof File) continue;
        const fileName =
          typeof item === "string"
            ? item
            : item?.file_name ||
              item?.filename ||
              item?.name ||
              item?.fileName ||
              "";
        if (!fileName) continue;
        existingAttachmentsObjects.push({
          file_name: String(fileName).trim(),
          file_path: null, // we resolve by filename + orgId on server
          org_id: orgId || null, // include orgId to help server match by organization
        });
      }

      for (let i = 0; i < rowsForType.length; i++) {
        const r = rowsForType[i] || {};
        const list = Array.isArray(r.attachments) ? r.attachments : [];
        for (const it of list) {
          if (it instanceof File) continue;
          const fileName =
            typeof it === "string"
              ? it
              : it?.file_name || it?.filename || it?.name || it?.fileName || "";
          if (!fileName) continue;
          existingAttachmentsObjects.push({
            file_name: String(fileName).trim(),
            file_path: null,
            line_index: Number(i),
            org_id: orgId || null,
          });
        }
      }

      const seen = new Set();
      const deduped = [];
      for (const o of existingAttachmentsObjects) {
        const key = String(o.file_name || "").trim();
        if (!key) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(o);
      }

      if (deduped.length > 0)
        fd.append("existingAttachments", JSON.stringify(deduped));

      if (formData.department_id)
        fd.append("department_id", String(formData.department_id));

      const finalParticipants =
        Array.isArray(participants) && participants.length
          ? participants.map((p) => (typeof p === "object" ? p.employee_id : p))
          : [];
      fd.append("participants", JSON.stringify(finalParticipants));

      const empToSend = formData.employeeId || employeeId || "";
      if (empToSend) {
        fd.append("employeeId", String(empToSend));
        fd.append("employee_id", String(empToSend));
      }

      const cfg = {
        withCredentials: true,
        headers: { ...buildHeaders(), "x-employee-id": String(empToSend) },
      };

      let res;
      if (editingId) {
        res = await axios.put(
          `${
            BACKEND ||
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.REACT_APP_BACKEND_URL
          }/reimbursement/${editingId}`,
          fd,
          cfg,
        );
      } else {
        res = await axios.post(
          `${
            BACKEND ||
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.REACT_APP_BACKEND_URL
          }/reimbursement`,
          fd,
          cfg,
        );
      }

      showAlert(res?.data?.message || "Reimbursement submitted successfully!");
      setShowForm(false);
      setEditingId(null);
      setParticipants(employeeId ? [employeeId] : []);
      setParticipantMode("single");
      setFormData((p) => ({
        ...p,
        claim_type: "",
        transport_type: "",
        purpose: "",
        attachments: null,
        total_amount: "",
        invoices: [],
        _forceShowTransport: false,
        claim_rows: {},
      }));
      setSelectedFiles([]);
      fetchReimbursements();
    } catch (err) {
      console.error("Error submitting:", err);
      const msg = extractErrorMessage(err);
      setSubmitErrorMessage(msg);
      showAlert(msg);
    }
  };

  const deleteReimbursement = async (id) => {
    if (!id) return;
    try {
      if (!orgId && !orgResolveTried) await resolveOrgIdOnce();
      const res = await axios.delete(
        `${
          BACKEND ||
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          process.env.REACT_APP_BACKEND_URL
        }/reimbursement/${id}`,
        {
          withCredentials: true,
          headers: buildHeaders(),
        },
      );
      showAlert(res.data.message || "Deleted");
      fetchReimbursements();
    } catch (err) {
      console.error("Delete error:", err);
      const msg = extractErrorMessage(err, "Unable to delete reimbursement.");
      showAlert(msg);
    }
  };

  const handleConfirmDelete = async () => {
    const id = confirmModal.id;
    closeConfirmDelete();
    if (!id) return;
    await deleteReimbursement(id);
  };

  const onParticipantSelectionChange = (value) => {
    if (!value) {
      setParticipants([]);
      return;
    }

    if (Array.isArray(value)) {
      const ids = value
        .map((v) => v?.employee_id || v?.id || v?.employeeId || v?.empId)
        .filter(Boolean);
      setParticipants(ids);
      setParticipantMode(ids.length > 1 ? "group" : "single");
      return;
    }

    const id = value.employee_id || value.id || value.employeeId || value.empId;
    setParticipants(id ? [id] : []);
    setParticipantMode("single");
  };

  const renderSingleTile = () => {
    const selfOpt = employeeOptions.find(
      (e) =>
        String(e.employee_id) === String(employeeId) ||
        String(e.id) === String(employeeId),
    );
    const displayName = selfOpt ? selfOpt.name : "You";
    const isSelected =
      participants &&
      participants.length &&
      String(participants[0]) === String(employeeId);
    return (
      <div
        className={`ps-item ${isSelected ? "selected" : ""}`}
        role="option"
        aria-selected={isSelected}
        onClick={() => {
          setParticipants([employeeId]);
        }}
      >
        <div className="ps-item-top">
          <div className="ps-item-name">{displayName}</div>
          <div className="ps-item-id">{employeeId}</div>
        </div>
        <div className={`ps-item-action ${isSelected ? "sel" : ""}`}>
          {isSelected ? "Selected" : "Click to select (Self)"}
        </div>
      </div>
    );
  };

  const formatDisplayDate = (raw) => {
    if (!raw) return " ";
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d)) return raw;
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-GB", { month: "short" });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const filterClaims = filteredReimbursements || [];
  const displayRows = [];
  (filterClaims || []).forEach((claim) => {
    const lines = Array.isArray(claim.lines)
      ? claim.lines
          .slice()
          .sort((a, b) => (a.line_index || 0) - (b.line_index || 0))
      : [];
    if (lines.length === 0) {
      displayRows.push({ claim, line: null, isFirstLine: true, rowSpan: 1 });
    } else {
      lines.forEach((line, li) => {
        displayRows.push({
          claim,
          line,
          isFirstLine: li === 0,
          rowSpan: lines.length,
        });
      });
    }
  });

  const totalAmount = displayRows.reduce((s, r) => {
    const amt = r.line
      ? Number(r.line.total_amount || r.line.payload?.total_amount || 0)
      : Number(r.claim?.aggregated_total || 0);
    return s + (isNaN(amt) ? 0 : Number(amt));
  }, 0);

  const approvedAmount = displayRows
    .filter((r) => (r.claim.status || "").toLowerCase() === "approved")
    .reduce((s, r) => {
      const amt = r.line
        ? Number(r.line.total_amount || r.line.payload?.total_amount || 0)
        : Number(r.claim?.aggregated_total || 0);
      return s + (isNaN(amt) ? 0 : Number(amt));
    }, 0);

  const rejectedAmount = displayRows
    .filter((r) => (r.claim.status || "").toLowerCase() === "rejected")
    .reduce((s, r) => {
      const amt = r.line
        ? Number(r.line.total_amount || r.line.payload?.total_amount || 0)
        : Number(r.claim?.aggregated_total || 0);
      return s + (isNaN(amt) ? 0 : Number(amt));
    }, 0);

  const shouldShowParticipantControls = () => {
    if (!formData.claim_type) return false;
    const ct = String(formData.claim_type || "").toLowerCase();

    if (ct === "transportation")
      return !!formData.transport_type || !!formData._forceShowTransport;

    if (
      [
        "meals",
        "miscellaneous",
        "telecommunication",
        "telecom",
        "stationary",
      ].includes(ct)
    )
      return true;

    return false;
  };

  // --- Render ---
  return (
    <div className="reimbursement-container">
      <div className="rb-form-header">
        {role !== "Manager" && role !== "Admin" && role !== "HR" && (
          <h2>Reimbursement Requests</h2>
        )}
      </div>

      <div className="filter-container">
        <label>Status By</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <label>Date From</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <label>To</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <button className="search-btn" onClick={applyFilters}>
          <FaSearch /> Search
        </button>

        <button
          className="apply-btn"
          onClick={() => {
            setSubmitErrorMessage("");
            setUpdateErrorMessage("");
            setSelectedFiles([]);
            setShowForm(true);
            setEditingId(null);
            setFormData({
              employeeId,
              department_id: departmentId,
              claim_type: "",
              transport_type: "",
              fromDate: "",
              toDate: "",
              date: "",
              travel_from: "",
              travel_to: "",
              meals_objective: "",
              purpose: "",
              purchasing_item: "",
              accommodation_fees: "",
              no_of_days: "",
              total_amount: "",
              meal_type: "",
              stationary: "",
              service_provider: "",
              project: "",
              attachments: null,
              invoices: [],
              _forceShowTransport: false,
            });
          }}
        >
          Apply Claim
        </button>
      </div>

      {errorMessage && <p className="rb-error-message">{errorMessage}</p>}

      <div className="reimbursement-table-scroll2">
        <table className="reimbursement-table">
          <thead>
            <tr>
              <th>Sl No</th>
              <th>Claim Type</th>
              <th>Participants</th>
              <th>Date</th>
              <th>Purpose</th>
              <th>Invoice(s)</th>
              <th>Amount</th>
              <th>Attachment</th>
              <th>Status</th>
              <th>Comments</th>
              <th>Payment Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filterClaims.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ textAlign: "center" }}>
                  No claims found
                </td>
              </tr>
            ) : (
              filterClaims.map((claim, claimIdx) => {
                const lines = Array.isArray(claim.lines)
                  ? claim.lines
                      .slice()
                      .sort((a, b) => (a.line_index || 0) - (b.line_index || 0))
                  : [];

                const invSet = new Set();

                const topInvs = parseInvoicesFromClaim(claim);
                (topInvs || []).forEach((i) => {
                  if (i !== undefined && i !== null && String(i).trim())
                    invSet.add(String(i).trim());
                });

                lines.forEach((ln) => {
                  const lnInvRaw =
                    ln?.payload?.invoices ?? ln?.payload?.invoice ?? [];
                  let parsed = lnInvRaw;
                  try {
                    if (typeof parsed === "string" && parsed.trim())
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
                      if (i !== undefined && i !== null && String(i).trim())
                        invSet.add(String(i).trim());
                    });
                  }
                });

                const claimLevelInvs = Array.from(invSet);
                const claimInvDisplay = claimLevelInvs.length
                  ? claimLevelInvs.join(", ")
                  : "-";

                let primaryClaimDate = null;
                if (claim.date_range) {
                  primaryClaimDate = claim.date_range;
                } else if (claim.date) {
                  primaryClaimDate = claim.date;
                } else if (claim.from_date && claim.to_date) {
                  primaryClaimDate = `${claim.from_date} - ${claim.to_date}`;
                } else if (
                  lines.length > 0 &&
                  lines[0].payload &&
                  (lines[0].payload.date || lines[0].payload.from_date)
                ) {
                  if (lines[0].payload.date)
                    primaryClaimDate = lines[0].payload.date;
                  else if (
                    lines[0].payload.from_date &&
                    lines[0].payload.to_date
                  )
                    primaryClaimDate = `${lines[0].payload.from_date} - ${lines[0].payload.to_date}`;
                  else if (lines[0].payload.from_date)
                    primaryClaimDate = lines[0].payload.from_date;
                }

                const isOpen = isExpanded(claim.id);

                return (
                  <Fragment key={`claim-${claim.id || claimIdx}`}>
                    <tr className="claim-main-row">
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleExpand(claim.id)}
                          aria-expanded={isOpen}
                          title={isOpen ? "Collapse" : "Expand"}
                          style={{ minWidth: 36 }}
                        >
                          {isOpen ? "−" : "+"}
                        </button>{" "}
                        {claimIdx + 1}
                      </td>

                      <td>{claim.claim_type || "-"}</td>

                      <td
                        className="participants-cell"
                        title={getParticipantNamesForClaim(claim)}
                      >
                        {getParticipantNamesForClaim(claim)}
                      </td>

                      <td>
                        <div className="rbadmin-comments">
                          {primaryClaimDate
                            ? Array.isArray(primaryClaimDate)
                              ? primaryClaimDate
                                  .map(formatDisplayDate)
                                  .join(" - ")
                              : String(primaryClaimDate).includes(" - ")
                                ? String(primaryClaimDate)
                                    .split(" - ")
                                    .map(formatDisplayDate)
                                    .join(" - ")
                                : formatDisplayDate(primaryClaimDate)
                            : " "}
                        </div>
                      </td>

                      <td>
                        <div className="rbadmin-comments">
                          {claim.purpose || claim.comments || "-"}
                        </div>
                      </td>

                      <td className="invoice-cell" title={claimInvDisplay}>
                        {claimInvDisplay}
                      </td>

                      <td>
                        {Number(
                          claim.aggregated_total || claim.total_amount || 0,
                        ).toFixed(2)}
                      </td>

                      <td>
                        {attachments[claim.id] &&
                        attachments[claim.id].length > 0 ? (
                          <button
                            className="attachments-btn"
                            onClick={() =>
                              handleOpenAttachments(
                                attachments[claim.id],
                                claim,
                              )
                            }
                          >
                            <MdOutlineRemoveRedEye className="eye-icon" /> View
                          </button>
                        ) : (
                          "Not Attached"
                        )}
                      </td>

                      <td>
                        <span
                          className={`rb-status-label ${
                            claim.status === "approved"
                              ? "rb-approved"
                              : claim.status === "rejected"
                                ? "rb-rejected"
                                : ""
                          }`}
                        >
                          {claim.status || "-"}
                        </span>
                      </td>

                      <td>
                        <div className="rbadmin-comments">
                          {claim.approver_comments || "No comments"}
                        </div>
                      </td>

                      <td>{claim.payment_status || "-"}</td>

                      <td className="rb-actions-column">
                        <MdOutlineEdit
                          className={`icons-btn ${
                            (claim.status || "").toLowerCase() !== "pending"
                              ? "disabled-icon"
                              : ""
                          }`}
                          aria-disabled={
                            (claim.status || "").toLowerCase() !== "pending"
                          }
                          disabled={
                            (claim.status || "").toLowerCase() !== "pending"
                          }
                          onClick={() => {
                            if (
                              (claim.status || "").toLowerCase() !== "pending"
                            )
                              return;
                            handleEdit(claim);
                            setShowForm(true);
                          }}
                          title={
                            (claim.status || "").toLowerCase() === "pending"
                              ? "Edit"
                              : "Cannot edit"
                          }
                          aria-label={`Edit reimbursement ${claim.id}`}
                        />

                        <MdDeleteOutline
                          className={`icons-btn ${
                            (claim.status || "").toLowerCase() !== "pending"
                              ? "disabled-icon"
                              : ""
                          }`}
                          aria-disabled={
                            (claim.status || "").toLowerCase() !== "pending"
                          }
                          disabled={
                            (claim.status || "").toLowerCase() !== "pending"
                          }
                          onClick={() => {
                            if (
                              (claim.status || "").toLowerCase() !== "pending"
                            )
                              return;
                            openConfirmDelete(claim.id, claim);
                          }}
                          title={
                            (claim.status || "").toLowerCase() === "pending"
                              ? "Delete"
                              : "Cannot delete"
                          }
                          aria-label={`Delete reimbursement ${claim.id}`}
                        />
                      </td>
                    </tr>

                    {isOpen &&
                      (lines.length
                        ? lines
                        : [{ id: null, payload: claim }]
                      ).map((line, li) => {
                        const payload = line.payload || {};
                        let invs =
                          Array.isArray(payload.invoices) &&
                          payload.invoices.length
                            ? payload.invoices
                            : [];
                        if (typeof invs === "string" && invs.trim()) {
                          try {
                            invs = JSON.parse(invs);
                          } catch {
                            invs = invs
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                          }
                        }
                        if (!Array.isArray(invs))
                          invs = invs ? [String(invs)] : [];
                        const invDisplay = invs.length ? invs.join(", ") : "-";

                        const dateDisplay =
                          payload.date ||
                          payload.from_date ||
                          payload.to_date ||
                          null;

                        const lineAttachments =
                          (claim.line_attachments_map &&
                            line &&
                            (claim.line_attachments_map[String(line.id)] ||
                              claim.line_attachments_map[line.id])) ||
                          [];

                        const attachmentsForThis =
                          Array.isArray(lineAttachments) &&
                          lineAttachments.length
                            ? lineAttachments
                            : [];

                        const amount = line
                          ? line.total_amount || payload.total_amount || 0
                          : 0;

                        return (
                          <tr
                            key={`claim-${claim.id}-line-${line.id ?? li}`}
                            className="claim-line-row"
                          >
                            <td></td>
                            <td></td>
                            <td></td>

                            <td>
                              {dateDisplay
                                ? Array.isArray(dateDisplay)
                                  ? dateDisplay
                                      .map(formatDisplayDate)
                                      .join(" - ")
                                  : formatDisplayDate(dateDisplay)
                                : " "}
                            </td>

                            <td>
                              <div style={{ paddingLeft: 8 }}>
                                {payload.purpose || "-"}
                              </div>
                            </td>

                            <td className="invoice-cell" title={invDisplay}>
                              {invDisplay}
                            </td>

                            <td>{Number(amount || 0).toFixed(2)}</td>

                            <td>
                              {attachmentsForThis &&
                              attachmentsForThis.length > 0 ? (
                                <button
                                  className="attachments-btn"
                                  onClick={() =>
                                    handleOpenAttachments(
                                      attachmentsForThis,
                                      claim,
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
                          </tr>
                        );
                      })}
                  </Fragment>
                );
              })
            )}
          </tbody>

          <tfoot>
            <tr className="total-row">
              <td colSpan="4" className="total-left">
                Total Amount Claiming:{" "}
                <span className="total-amount">Rs {totalAmount}</span>
              </td>
              <td colSpan="4" className="total-right">
                Amount Approved: Rs{" "}
                <span className="total-amount">{approvedAmount}</span>
              </td>
              <td colSpan="4" className="total-right">
                Amount Rejected: Rs{" "}
                <span className="total-amount">{rejectedAmount}</span>
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="rb-reimbursement-cards">
          {filterClaims.map((claim, idx) => {
            const invSetCard = new Set();
            const topInvsCard = parseInvoicesFromClaim(claim);
            (topInvsCard || []).forEach((i) => {
              if (i !== undefined && i !== null && String(i).trim())
                invSetCard.add(String(i).trim());
            });
            const linesCard = Array.isArray(claim.lines) ? claim.lines : [];
            linesCard.forEach((ln) => {
              const lnInvRaw =
                ln?.payload?.invoices ?? ln?.payload?.invoice ?? [];
              let parsed = lnInvRaw;
              try {
                if (typeof parsed === "string" && parsed.trim())
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
                  if (i !== undefined && i !== null && String(i).trim())
                    invSetCard.add(String(i).trim());
                });
              }
            });
            const invDisplay = Array.from(invSetCard).length
              ? Array.from(invSetCard).join(", ")
              : "-";

            const isPending = (claim.status || "").toLowerCase() === "pending";

            const canEdit = isPending;
            const canDelete = isPending;

            const primaryCardDate =
              claim.date_range ||
              claim.date ||
              (claim.from_date && claim.to_date
                ? `${claim.from_date} - ${claim.to_date}`
                : null) ||
              (Array.isArray(claim.lines) && claim.lines[0]?.payload
                ? claim.lines[0].payload.date ||
                  (claim.lines[0].payload.from_date &&
                  claim.lines[0].payload.to_date
                    ? `${claim.lines[0].payload.from_date} - ${claim.lines[0].payload.to_date}`
                    : claim.lines[0].payload.from_date)
                : null);

            const cardPurpose = claim.purpose || claim.comments || "-";

            return (
              <div className="rb-reimbursement-card" key={claim.id}>
                <div className="rb-card-header">
                  <span className={`rb-status ${claim.status?.toLowerCase()}`}>
                    {claim.status}
                  </span>
                </div>
                <div className="rb-card-body">
                  <p>
                    <strong>Sl No:</strong> {idx + 1}
                  </p>
                  <p>
                    <strong>Claim Type:</strong> {claim.claim_type}
                  </p>
                  <p>
                    <strong>Participants:</strong>{" "}
                    {getParticipantNamesForClaim(claim)}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {primaryCardDate
                      ? Array.isArray(primaryCardDate)
                        ? primaryCardDate.map(formatDisplayDate).join(" - ")
                        : String(primaryCardDate).includes(" - ")
                          ? String(primaryCardDate)
                              .split(" - ")
                              .map(formatDisplayDate)
                              .join(" - ")
                          : formatDisplayDate(primaryCardDate)
                      : " "}
                  </p>
                  <p>
                    <strong>Purpose:</strong> {cardPurpose}
                  </p>
                  <p>
                    <strong>Invoice(s):</strong> {invDisplay}
                  </p>
                  <p>
                    <strong>Amount:</strong> Rs{" "}
                    {Number(
                      claim.aggregated_total || claim.total_amount || 0,
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="rb-card-footer">
                  {attachments[claim.id]?.length > 0 ? (
                    <button
                      className="rb-attachments-btn"
                      onClick={() =>
                        handleOpenAttachments(attachments[claim.id], claim)
                      }
                    >
                      <MdOutlineRemoveRedEye className="rb-eye-icon" /> View
                    </button>
                  ) : (
                    <span className="rb-no-attachment">No Attachment</span>
                  )}

                  <div className="rb-card-actions">
                    <button
                      className={`rb-icons-btn ${
                        !canEdit ? "disabled-icon" : ""
                      }`}
                      disabled={!canEdit}
                      aria-disabled={!canEdit}
                      onClick={() => {
                        if (!canEdit) return;
                        handleEdit(claim);
                        setShowForm(true);
                      }}
                      title={canEdit ? "Edit" : "Cannot edit"}
                      aria-label={`Edit reimbursement ${claim.id}`}
                    >
                      <MdOutlineEdit className="rb-edit-icon md-edit" />
                    </button>

                    <button
                      className={`rb-icons-btn ${
                        !canDelete ? "disabled-icon" : ""
                      }`}
                      disabled={!canDelete}
                      aria-disabled={!canDelete}
                      onClick={() => {
                        if (!canDelete) return;
                        openConfirmDelete(claim.id, claim);
                      }}
                      title={canDelete ? "Delete" : "Cannot delete"}
                      aria-label={`Delete reimbursement ${claim.id}`}
                    >
                      <MdDeleteOutline className="rb-delete-icon md-delete" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <ReimbursementForm
          projects={projects}
          claimTypes={claimTypes}
          handleClaimTypeChange={handleClaimTypeChange}
          formData={formData}
          handleChange={handleChange}
          shouldShowParticipantControls={shouldShowParticipantControls}
          participantMode={participantMode}
          setParticipantMode={setParticipantMode}
          renderSingleTile={renderSingleTile}
          onParticipantSelectionChange={onParticipantSelectionChange}
          employeeOptions={employeeOptions}
          handleFileUpload={handleFileUpload}
          handleTransportSubTypeChange={handleTransportSubTypeChange}
          handleNoOfDaysChange={handleNoOfDaysChange}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          handleSubmit={handleSubmit}
          editingId={editingId}
          setEditingId={setEditingId}
          setShowForm={setShowForm}
          setParticipants={setParticipants}
          setFormData={setFormData}
          participants={participants}
        />
      )}

      <AttachmentsModal
        isOpen={isAttachmentsOpen}
        title={attachmentViewerTitle}
        files={attachmentViewerFiles}
        onClose={() => setIsAttachmentsOpen(false)}
      />

      <Modal
        isVisible={confirmModal.isVisible}
        onClose={closeConfirmDelete}
        buttons={[
          { label: "Cancel", onClick: closeConfirmDelete },
          { label: "Yes, Delete", onClick: handleConfirmDelete },
        ]}
      >
        <h3>{confirmModal.title}</h3>
        <p>{confirmModal.message}</p>
      </Modal>

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <h3>{alertModal.title}</h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default Reimbursement;
