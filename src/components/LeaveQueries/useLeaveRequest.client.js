"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthProvider.client";
import {
  defaultLeaveSettings,
  computeRequestedDays,
  getAdvanceNoticeDays,
  parseLocalDate,
  calculateDays,
} from "./leaveUtils.client";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const rolesWithTeamView = new Set([
  "supervisor",
  "manager",
  "admin",
  "ceo",
  "super admin",
  "superadmin",
  "super_admin",
]);

export default function useLeaveRequest() {
  const { user } = useAuth();
  const employeeId = user?.employeeId;
  const orgId = user?.orgId || user?.org_id;
  const employeeName = user?.name;
  const roleNormalized = String(user?.role || "")
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();
  const canViewTeam = rolesWithTeamView.has(roleNormalized);

  const headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
    "x-employee-id": employeeId,
    "x-org-id": orgId,
  };

  const [isFormVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    leavetype: "",
    h_f_day: "Full Day",
    startDate: "",
    endDate: "",
    attachments: [],
  });
  const [editingId, setEditingId] = useState(null);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    isVisible: false,
    message: "",
    onConfirm: null,
  });

  const [filters, setFilters] = useState({ from_date: "", to_date: "" });
  const [teamSearch, setTeamSearch] = useState("");
  const [teamStatus, setTeamStatus] = useState("");
  const [attachments, setAttachments] = useState([]);
  const originalAttachmentIdsRef = useRef([]);
  const [balances, setBalances] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [activePolicy, setActivePolicy] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState({ self: [], team: [] });
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [userProfile, setUserProfile] = useState(null);

  const now = new Date();
  const [lopMonth, setLopMonth] = useState(now.getMonth() + 1);
  const [lopYear, setLopYear] = useState(now.getFullYear());
  const [monthlyLop, setMonthlyLop] = useState(0);

  const [lopModal, setLopModal] = useState({
    isVisible: false,
    leaveId: null,
    deficit: 0,
    days: 0,
    remaining: 0,
    message: "",
    compensatedDays: 0,
    deductedDays: 0,
    lopDays: 0,
    approveDeficit: null,
    setAllCompensated: null,
    setAllDeducted: null,
    applyFlexibleSplit: null,
    error: "",
  });

  const [leaveBalancesCache, setLeaveBalancesCache] = useState({});

  const showAlert = (message, title = "") => {
    setLopModal((m) => ({ ...m, isVisible: false }));
    setTimeout(() => setAlertModal({ isVisible: true, title, message }), 120);
  };
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const showConfirm = (message, onConfirm) =>
    setConfirmModal({ isVisible: true, message, onConfirm });
  const closeConfirm = () =>
    setConfirmModal({ isVisible: false, message: "", onConfirm: null });

  const [statusUpdates, setStatusUpdates] = useState({});

  const handleStatusChange = (leaveId, field, value) => {
    setStatusUpdates((prev) => ({
      ...prev,
      [leaveId]: { ...(prev[leaveId] || {}), [field]: value },
    }));
  };

  const normalizeTypeKey = (s = "") =>
    (String(s).replace(/\s+/g, "_") || "").toLowerCase();

  const canonicalTypeMatch = (candidate, ...keywords) => {
    if (!candidate) return false;
    const c = String(candidate).toLowerCase();
    return keywords.some((k) => c.includes(k));
  };

  const computeAge = (dob) => {
    if (!dob) return null;
    try {
      const d = new Date(dob);
      if (isNaN(d.getTime())) return null;
      const diff = Date.now() - d.getTime();
      const ageDt = new Date(diff);
      return Math.abs(ageDt.getUTCFullYear() - 1970);
    } catch {
      return null;
    }
  };

  const hasExistingSameMonthForType = (typeKey, startDateStr) => {
    try {
      const start = startDateStr ? new Date(startDateStr) : new Date();
      const month = start.getMonth();
      const year = start.getFullYear();
      const arr = (leaveRequests.self || []).filter((r) => {
        const rType = String(
          r.leave_type || r.type || r.leaveType || "",
        ).toLowerCase();
        if (!rType) return false;
        if (!String(rType).includes(String(typeKey).toLowerCase()))
          return false;
        const s = new Date(
          r.start_date || r.startDate || r.date || r.from || 0,
        );
        if (isNaN(s.getTime())) return false;
        const status = (r.status || "").toLowerCase();
        if (["rejected", "cancelled"].includes(status)) return false;
        return s.getMonth() === month && s.getFullYear() === year;
      });
      return arr.length > 0;
    } catch {
      return false;
    }
  };

  const pickNumber = (...vals) => {
    for (const v of vals) {
      if (v === null || v === undefined) continue;
      const n = Number(v);
      if (!isNaN(n)) return n;
    }
    return 0;
  };

  const handleUpdate = async (leaveId, payload = null) => {
    const update = payload || statusUpdates[leaveId] || {};
    const status = update.status || "";
    const comments = update.comments || "";

    if (!leaveId) return;
    if (!status) {
      showAlert("Please select a status before updating.");
      return;
    }
    if (String(status).toLowerCase() === "rejected" && !comments) {
      showAlert("Please enter comments when rejecting a leave request.");
      return;
    }

    setLeaveRequests((prev) => {
      const nextTeam = (prev.team || []).map((r) =>
        String(r.leave_id || r.id) === String(leaveId)
          ? { ...r, status, comments: comments || r.comments }
          : r,
      );
      return { ...prev, team: nextTeam };
    });

    setStatusUpdates((prev) => {
      const clone = { ...prev };
      delete clone[leaveId];
      return clone;
    });

    const normalizedBool = (v) => {
      if (v === true || v === false) return v;
      if (typeof v === "string") {
        const t = v.trim().toLowerCase();
        if (["true", "1", "yes", "on"].includes(t)) return true;
        if (["false", "0", "no", "off"].includes(t)) return false;
        return false;
      }
      if (typeof v === "number") return v !== 0;
      return false;
    };

    const compensated =
      pickNumber(
        update.compensated_days,
        update.compensatedDays,
        update.compensated,
        0,
      ) || 0;
    const deducted =
      pickNumber(
        update.deducted_days,
        update.deductedDays,
        update.deducted,
        0,
      ) || 0;
    const lop =
      pickNumber(
        update.loss_of_pay_days,
        update.lopDays,
        update.loss_of_pay,
        0,
      ) || 0;
    const preservedRaw =
      update.preserved_leave_days ??
      update.preservedLeaveDays ??
      update.preserved ??
      null;
    const preserved =
      preservedRaw === null || preservedRaw === undefined
        ? null
        : Number(preservedRaw);

    let totalDays = pickNumber(
      update.total_days,
      update.totalDays,
      update.totalDaysRequested,
    );

    if (!totalDays) {
      const row =
        (leaveRequests.team || []).find(
          (r) => String(r.leave_id || r.id) === String(leaveId),
        ) || null;
      if (row) {
        try {
          totalDays = calculateDays(row.start_date, row.end_date, row.H_F_day);
        } catch {
          totalDays = 0;
        }
      }
    }

    const isDefaultedFlag = normalizedBool(
      update.is_defaulted ?? update.isDefaulted ?? false,
    );

    const body = {
      status,
      comments,
      compensated_days: Number(compensated),
      compensatedDays: Number(compensated),
      compensated: Number(compensated),

      deducted_days: Number(deducted),
      deductedDays: Number(deducted),
      deducted: Number(deducted),

      loss_of_pay_days: Number(lop),
      lopDays: Number(lop),
      loss_of_pay: Number(lop),

      preserved_leave_days: preserved === null ? null : Number(preserved),
      preservedLeaveDays: preserved === null ? null : Number(preserved),
      preserved: preserved === null ? null : Number(preserved),

      total_days: Number(totalDays),
      totalDays: Number(totalDays),

      is_defaulted: Boolean(isDefaultedFlag),
      isDefaulted: Boolean(isDefaultedFlag),

      actorId: employeeId,
      approverId: employeeId,
    };

    try {
      const url = `${BACKEND}/admin/leave/${leaveId}`;
      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let json = null;
        try {
          json = await res.json();
        } catch (e) {}
        showAlert(json?.message || "Failed to update leave status.");
        await fetchLeaveRequests();
        return;
      }

      showAlert("Leave status updated.");
      await fetchLeaveRequests();
      await fetchLeaveBalance();
    } catch (err) {
      console.error("handleUpdate error:", err);
      showAlert("Failed to update leave (network error).");
      await fetchLeaveRequests();
    }
  };

  const fetchUserProfile = async () => {
    if (!employeeId) return null;

    try {
      const url = `${BACKEND}/full/${employeeId}`;

      const res = await fetch(url, {
        credentials: "include",
        headers,
      });

      if (!res.ok) {
        console.warn("fetchUserProfile skipped — endpoint not available");
        setUserProfile(null);
        return null;
      }

      const json = await res.json();
      const profile = json?.data || json?.message || json || null;

      if (!profile) {
        setUserProfile(null);
        return null;
      }

      const normalized = {
        ...profile,
        gender: profile.gender || profile.sex || null,
        dob: profile.dob || profile.date_of_birth || null,
      };

      setUserProfile(normalized);
      return normalized;
    } catch (err) {
      console.warn("fetchUserProfile failed safely:", err?.message);
      setUserProfile(null);
      return null;
    }
  };

  function normalizeLeaveTypes(raw = []) {
    const normalizeKey = (s = "") =>
      String(s)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

    const pretty = (s = "") =>
      String(s)
        .replace(/[_-]+/g, " ")
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ");

    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((t) => {
      if (typeof t === "string") {
        const key = normalizeKey(t);
        return { key, label: pretty(key), raw: t };
      }
      const key =
        t.type_key ??
        t.key ??
        t.type ??
        t.typeKey ??
        t.name ??
        t.display_name ??
        "";
      const label = t.display_name ?? t.label ?? t.name ?? key ?? "";
      return {
        key: normalizeKey(key),
        label: label || pretty(key),
        gender: t.gender ?? t.gender_name ?? null,
        min_age: t.min_age ?? t.minAge ?? null,
        max_age: t.max_age ?? t.maxAge ?? null,
        ...t,
      };
    });
  }

  const normalizeServerAttachments = (arr = []) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((a) => {
      const id = a.id || a.attachment_id || a.attachmentId || null;
      const file_name =
        a.file_name || a.name || a.filename || a.fileName || null;
      const size = a.size || a.file_size || a.length || null;
      const mime_type = a.mime_type || a.mimetype || a.type || null;
      const file_path = a.file_path || a.path || a.filePath || null;
      const url = a.url || a.file_url || a.fileUrl || null;
      const created_at = a.created_at || a.createdAt || null;
      return {
        id,
        file_name,
        name: file_name,
        size,
        mime_type,
        file_path,
        url,
        created_at,
        _raw: a,
      };
    });
  };

  const fetchAttachmentsMetadataForLeave = async (leaveId) => {
    if (!leaveId) return [];
    const candidates = [
      `${BACKEND}/employee/leave/${encodeURIComponent(leaveId)}/attachments`,
      `${BACKEND}/api/employee/leave/${encodeURIComponent(leaveId)}/attachments`,
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { credentials: "include", headers });
        if (!res.ok) {
          if (res.status === 404) continue;
        }
        const json = await res.json().catch(() => null);
        const list =
          json?.data ||
          json?.attachments ||
          json?.message?.data ||
          (Array.isArray(json) ? json : null) ||
          null;
        if (Array.isArray(list) && list.length)
          return normalizeServerAttachments(list);
      } catch (e) {}
    }
    return [];
  };

  const fetchLeaveTypes = async () => {
    try {
      if (
        activePolicy &&
        Array.isArray(activePolicy.leave_settings) &&
        activePolicy.leave_settings.length > 0
      ) {
        const settings = activePolicy.leave_settings;
        const derived = (settings || []).map((s) => {
          const rawKey =
            s.type ?? s.type_key ?? s.key ?? (typeof s === "string" ? s : "");
          const key = String(rawKey || "").trim();
          const label =
            s.label ??
            (typeof s === "string" ? rawKey : s.display_name || rawKey || key);
          return {
            key: key ? key.toLowerCase().replace(/\s+/g, "_") : key,
            label,
          };
        });
        const normalized = normalizeLeaveTypes(derived);
        setLeaveTypes(normalized);
        return normalized;
      }

      let url = `${BACKEND}/types`;
      const params = new URLSearchParams();
      const gender =
        (userProfile?.gender || user?.gender || user?.sex || "").toString() ||
        "";
      const age = computeAge(
        userProfile?.dob || user?.date_of_birth || user?.dob,
      );
      if (gender) params.append("gender", gender);
      if (age !== null && Number.isFinite(age))
        params.append("age", String(age));
      if ([...params].length) url = `${url}?${params.toString()}`;

      console.debug("fetchLeaveTypes: trying", url, "headers:", headers);
      let res = await fetch(url, {
        credentials: "include",
        headers,
        cache: "no-store",
      });

      if (res.status === 404) {
        const fallback = `${BACKEND}/types${params.toString() ? `?${params.toString()}` : ""}`;

        console.warn("fetchLeaveTypes: primary 404, trying fallback", fallback);
        res = await fetch(fallback, {
          credentials: "include",
          headers,
          cache: "no-store",
        });
      }

      if (!res.ok)
        throw new Error(`Failed to load leave types (HTTP ${res.status})`);
      const json = await res.json();
      const arr = json?.data ?? (Array.isArray(json) ? json : []);
      const normalized = normalizeLeaveTypes(arr);
      setLeaveTypes(normalized);
      console.debug("fetchLeaveTypes -> normalized:", normalized);
      return normalized;
    } catch (err) {
      console.warn("fetchLeaveTypes failed:", err);
      setLeaveTypes([]);
      return [];
    }
  };

  const fetchPolicies = async () => {
    try {
      const url = `${BACKEND}/api/leave-policies?_=${Date.now()}`;
      const res = await fetch(url, {
        credentials: "include",
        headers,
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      console.debug("useLeaveRequest: fetchPolicies", res.status, json);
      setPolicies(json?.data || json || []);
    } catch (err) {
      console.error("Failed to fetch leave policies:", err);
      setPolicies([]);
    }
  };

  const extractArrayFromTeamResult = (obj) => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.message?.data)) return obj.message.data;
    if (Array.isArray(obj.message)) return obj.message;
    if (Array.isArray(obj.result)) return obj.result;
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) return obj[key];
    }
    return [];
  };

  const fetchLeaveRequests = async () => {
    try {
      if (!employeeId) return;

      console.log("========== FETCH LEAVE REQUESTS START ==========");

      const selfUrl = `${BACKEND}/employee/leave/${employeeId}`;
      const selfParams = new URLSearchParams();
      if (filters.from_date) selfParams.append("from_date", filters.from_date);
      if (filters.to_date) selfParams.append("to_date", filters.to_date);

      const selfFinalUrl = selfParams.toString()
        ? `${selfUrl}?${selfParams}`
        : selfUrl;

      console.log("SELF FETCH URL:", selfFinalUrl);

      const selfResponse = await fetch(selfFinalUrl, {
        credentials: "include",
        headers,
      });

      let selfRequests = [];

      if (selfResponse.ok) {
        const selfResult = await selfResponse.json();
        console.log("RAW SELF RESPONSE:", selfResult);

        selfRequests =
          selfResult?.data ||
          selfResult?.message?.data ||
          extractArrayFromTeamResult(selfResult);
      } else {
        console.warn("SELF FETCH FAILED:", selfResponse.status);
      }

      console.log("SELF REQUESTS BEFORE NORMALIZATION:", selfRequests);

      (selfRequests || []).forEach((r) => {
        console.log(
          "RAW ROW:",
          r.id || r.leave_id,
          "ATTACHMENTS:",
          r.attachments,
        );
      });

      let teamRequests = [];
      if (canViewTeam) {
        const teamUrl = `${BACKEND}/team-lead/${employeeId}`;
        const teamResponse = await fetch(teamUrl, {
          credentials: "include",
          headers,
        });

        if (teamResponse.ok) {
          const teamResult = await teamResponse.json();
          teamRequests = extractArrayFromTeamResult(
            teamResult?.data ?? teamResult ?? teamResult?.message ?? {},
          );
        }
      }

      const normalizeEmployeeId = (r) =>
        String(
          r?.employee_id ?? r?.employeeId ?? r?.emp_id ?? r?.id ?? "",
        ).trim();

      const ownIdStr = String(employeeId ?? "").trim();

      const filteredTeamRequests = Array.isArray(teamRequests)
        ? teamRequests.filter((r) => normalizeEmployeeId(r) !== ownIdStr)
        : [];

      const normalizedSelf = (selfRequests || []).map((r) => {
        const normalized = {
          ...r,
          attachments: normalizeServerAttachments(r.attachments || []),
        };

        console.log(
          "NORMALIZED ROW:",
          normalized.id || normalized.leave_id,
          "NORMALIZED ATTACHMENTS:",
          normalized.attachments,
        );

        return normalized;
      });

      const normalizedTeam = (filteredTeamRequests || []).map((r) => ({
        ...r,
        attachments: normalizeServerAttachments(r.attachments || []),
      }));

      console.log("FINAL SELF STATE ABOUT TO SET:", normalizedSelf);

      setLeaveRequests({ self: normalizedSelf, team: normalizedTeam });

      console.log("========== FETCH LEAVE REQUESTS END ==========");

      return { self: selfRequests, team: filteredTeamRequests };
    } catch (err) {
      console.error("fetchLeaveRequests error:", err);
      setLeaveRequests({ self: [], team: [] });
      return { self: [], team: [] };
    }
  };

  const fetchLeaveBalance = async () => {
    if (!employeeId) return;
    try {
      const res = await fetch(
        `${BACKEND}/api/leave-policies/employee/${employeeId}/leave-balance`,
        { credentials: "include", headers },
      );
      if (!res.ok) throw new Error("Failed to load leave balance");
      const json = await res.json();
      let arr = json.data || [];

      arr = augmentBalancesWithMenstrual(arr);

      setBalances(arr);
      return arr;
    } catch (err) {
      console.error("fetchLeaveBalance:", err);
      showAlert("Could not fetch leave balance.");
      setBalances([]);
      return [];
    }
  };

  const augmentBalancesWithMenstrual = (balanceArray = []) => {
    if (!Array.isArray(balanceArray)) return [];
    const copy = balanceArray.slice();
    const idx = copy.findIndex((b) =>
      canonicalTypeMatch(b.type || b.label || "", "menstrual", "menstr"),
    );
    const gender = (userProfile?.gender || user?.gender || user?.sex || "")
      .toString()
      .toLowerCase();
    const dob = userProfile?.dob || user?.date_of_birth || user?.dob;
    const age = computeAge(dob);
    const eligible =
      gender === "female" && (age === null || (age >= 18 && age <= 52));
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (!eligible) {
      if (idx >= 0) {
        const existing = { ...copy[idx] };
        if ("carry_forward" in existing) existing.carry_forward = 0;
        copy[idx] = existing;
      }
      return copy;
    }

    if (idx === -1) {
      const usedThisMonth = hasExistingSameMonthForType("menstrual");
      if (!usedThisMonth) {
        copy.push({
          type: "menstrual",
          label: "Menstrual Leave",
          allowance: 1,
          used: 0,
          remaining: 1,
          carry_forward: 0,
          ephemeral_month: currentMonth,
          ephemeral_year: currentYear,
          ephemeral: true,
        });
      } else {
      }
      return copy;
    }

    const original = { ...copy[idx] };

    const usedThisMonth = hasExistingSameMonthForType(
      original.type || original.label || "menstrual",
    );
    const alreadyEphemeralForThisMonth =
      original.ephemeral_month === currentMonth &&
      original.ephemeral_year === currentYear;

    if (!usedThisMonth && !alreadyEphemeralForThisMonth) {
      const baseAllowance = Number(original.allowance ?? original.earned ?? 0);
      const baseUsed = Number(original.used ?? 0);
      const baseRemaining = Number(
        original.remaining ?? baseAllowance - baseUsed,
      );
      original.allowance = baseAllowance + 1;
      original.remaining = baseRemaining + 1;
      original.ephemeral = true;
      original.ephemeral_month = currentMonth;
      original.ephemeral_year = currentYear;
      original.carry_forward = 0;
      copy[idx] = original;
    } else {
      original.carry_forward = 0;
      copy[idx] = original;
    }

    return copy;
  };

  const loadLeaveBalance = async (employeeIdToLoad) => {
    if (!employeeIdToLoad) return [];
    if (leaveBalancesCache[employeeIdToLoad])
      return leaveBalancesCache[employeeIdToLoad];

    try {
      const url = `${BACKEND}/api/leave-policies/employee/${employeeIdToLoad}/leave-balance`;
      console.debug("fetchLeaveBalance -> url:", url, "headers:", headers);

      const res = await fetch(url, { credentials: "include", headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      let arr = json.data || [];
      arr = augmentBalancesWithMenstrual(arr);
      setLeaveBalancesCache((prev) => ({ ...prev, [employeeIdToLoad]: arr }));
      return arr;
    } catch (err) {
      console.warn("loadLeaveBalance failed:", err);
      setLeaveBalancesCache((prev) => ({ ...prev, [employeeIdToLoad]: [] }));
      return [];
    }
  };

  const getBalanceForType = (type) => {
    if (!balances || balances.length === 0) return null;
    return (
      balances.find(
        (b) => String(b.type).toLowerCase() === String(type).toLowerCase(),
      ) || null
    );
  };

  const resetForm = () => {
    setFormData({
      reason: "",
      leavetype: "",
      h_f_day: "Full Day",
      startDate: "",
      endDate: "",
      attachments: [],
    });
    setEditingId(null);
    setAttachments([]);
  };

  const openForm = () => {
    resetForm();
    setFormVisible(true);
  };
  const closeForm = () => {
    resetForm();
    setFormVisible(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // optimistically set the value first (so UI updates)
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (
        (name === "startDate" || name === "endDate") &&
        next.startDate &&
        next.endDate
      ) {
        if (new Date(next.endDate) > new Date(next.startDate))
          next.h_f_day = "Full Day";
      }
      return next;
    });

    // immediate gender-based validation when selecting leave type
    if (name === "leavetype") {
      (async () => {
        // ensure we have profile data to check gender
        let profile = userProfile;
        if (!profile) {
          try {
            profile = await fetchUserProfile();
          } catch (err) {
            // silent fallback to whatever we have in `user`
          }
        }

        const gender = (profile?.gender || user?.gender || user?.sex || "")
          .toString()
          .toLowerCase()
          .trim();

        // detect canonical leave types using existing helper
        const isMenstrual = canonicalTypeMatch(value, "menstrual", "menstr");
        const isMaternity = canonicalTypeMatch(value, "matern", "maternity");
        const isPaternity = canonicalTypeMatch(value, "patern", "paternity");

        // if gender is unknown we can't validate — notify user and clear selection
        if (!gender) {
          showAlert(
            "Your profile gender is not set. Cannot validate selected leave type. Please update your profile.",
          );
          // clear the invalid selection
          setFormData((prev) => ({ ...prev, leavetype: "" }));
          return;
        }

        if (isPaternity && gender !== "male") {
          showAlert("Paternity leave is available only for male employees.");
          setFormData((prev) => ({ ...prev, leavetype: "" }));
          return;
        }

        if ((isMaternity || isMenstrual) && gender !== "female") {
          showAlert(
            "Maternity / Menstrual leave is available only for female employees.",
          );
          setFormData((prev) => ({ ...prev, leavetype: "" }));
          return;
        }

        // otherwise leave selection is fine — nothing more to do
      })();
    }
  };

  const handleEdit = async (request) => {
    setFormData({
      reason: request.reason || request.comments || "",
      leavetype: request.leave_type || request.type || request.leavetype || "",
      h_f_day: request.H_F_day || request.h_f_day || "Full Day",
      startDate: parseLocalDate(request.start_date),
      endDate: parseLocalDate(request.end_date),
      attachments: [],
    });

    setEditingId(request.id || request.leave_id || null);

    // reset attachments state
    setAttachments([]);
    originalAttachmentIdsRef.current = [];

    if (Array.isArray(request.attachments) && request.attachments.length > 0) {
      const normalized = normalizeServerAttachments(request.attachments);
      // set both formData and attachments state
      setFormData((prev) => ({ ...prev, attachments: normalized }));
      setAttachments(normalized);
      // record original attachment ids so we can detect removals later
      originalAttachmentIdsRef.current = normalized
        .map((a) => a.id)
        .filter(Boolean);
      setFormVisible(true);
      return;
    }

    const altCandidates = [
      request.files,
      request.attachments_meta,
      request.attachements,
      request.docs,
      request.files_list,
    ];
    for (const c of altCandidates) {
      if (Array.isArray(c) && c.length > 0) {
        const normalized = normalizeServerAttachments(c);
        setFormData((prev) => ({
          ...prev,
          attachments: normalized,
        }));
        setAttachments(normalized);
        originalAttachmentIdsRef.current = normalized
          .map((a) => a.id)
          .filter(Boolean);
        setFormVisible(true);
        return;
      }
    }

    try {
      const id = request.id || request.leave_id || request.leaveId;
      if (id) {
        const fetched = await fetchAttachmentsMetadataForLeave(id);
        if (fetched && fetched.length > 0) {
          setFormData((prev) => ({ ...prev, attachments: fetched }));
          setAttachments(fetched);
          originalAttachmentIdsRef.current = fetched
            .map((a) => a.id)
            .filter(Boolean);
          setFormVisible(true);
          return;
        }
      }
    } catch (err) {
      console.warn("handleEdit: failed to fetch attachments metadata:", err);
    }

    setFormVisible(true);
  };
  const handleCancel = (id) => {
    showConfirm(
      "Are you sure you want to cancel this leave request?",
      async () => {
        try {
          const response = await fetch(
            `${BACKEND}/cancel/${id}/${employeeId}`,
            { method: "DELETE", credentials: "include", headers },
          );
          if (response.ok) {
            showAlert("Leave request cancelled successfully!");
            fetchLeaveRequests();
          } else {
            showAlert("Failed to cancel leave request.");
          }
        } catch (err) {
          console.error("Error cancelling leave request:", err);
          showAlert("An error occurred while cancelling the leave request.");
        }
        closeConfirm();
      },
    );
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (
      !formData.leavetype ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.reason
    ) {
      showAlert("Please fill in all required fields.");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      showAlert("End date cannot be earlier than start date.");
      return;
    }

    const selectedTypeRaw = String(formData.leavetype || "");
    const selectedType = selectedTypeRaw.toLowerCase();

    let setting = null;
    if (activePolicy && Array.isArray(activePolicy.leave_settings)) {
      setting = activePolicy.leave_settings.find(
        (s) => String(s.type || "").toLowerCase() === selectedType,
      );
    }
    if (!setting) {
      setting = defaultLeaveSettings.find(
        (s) => String(s.type || "").toLowerCase() === selectedType,
      );
    }
    if (!setting) {
      const foundType = (leaveTypes || []).find(
        (t) =>
          String(t.key || t.type || t.label || t).toLowerCase() ===
          selectedType,
      );
      if (foundType) {
        setting = { type: foundType.key || foundType.type || foundType.label };
      }
    }
    if (!setting) {
      showAlert("Selected leave type is not available.");
      return;
    }

    if (!userProfile) {
      try {
        await fetchUserProfile();
      } catch {}
    }

    const personGender = (
      userProfile?.gender ||
      user?.gender ||
      user?.sex ||
      ""
    )
      .toString()
      .toLowerCase();
    const personDob = userProfile?.dob || user?.date_of_birth || user?.dob;
    const personAge = computeAge(personDob);

    const isMenstrual = canonicalTypeMatch(
      selectedTypeRaw,
      "menstrual",
      "menstr",
    );
    const isMaternity = canonicalTypeMatch(
      selectedTypeRaw,
      "matern",
      "maternity",
    );
    const isPaternity = canonicalTypeMatch(
      selectedTypeRaw,
      "patern",
      "paternity",
    );

    if (isMenstrual) {
      if (personGender && personGender !== "female") {
        showAlert("Menstrual leave is available only for female employees.");
        return;
      }
      if (personAge !== null && (personAge < 18 || personAge > 52)) {
        showAlert(
          "Menstrual leave is allowed only for females aged between 18 and 52.",
        );
        return;
      }
      if (personAge === null) {
        showAlert(
          "DOB not available in profile — age-based eligibility for menstrual leave could not be verified.",
        );
      }
      const requestedDays = computeRequestedDays(
        formData.startDate,
        formData.endDate,
        formData.h_f_day,
      );
      if (requestedDays !== 1) {
        showAlert("Menstrual leave can be taken only for a single day.");
        return;
      }
      const alreadyThisMonth = hasExistingSameMonthForType(
        selectedTypeRaw,
        formData.startDate,
      );
      if (alreadyThisMonth) {
        showAlert(
          "You have already taken menstrual leave in this month. Monthly limit reached.",
        );
        return;
      }
    }

    if (isMaternity) {
      if (personGender && personGender !== "female") {
        showAlert("Maternity leave is available only for female employees.");
        return;
      }
      const requestedDays = computeRequestedDays(
        formData.startDate,
        formData.endDate,
        formData.h_f_day,
      );
      if (requestedDays > 182) {
        showAlert(
          "Maternity leave exceeds maximum allowed duration (182 days).",
        );
        return;
      }
    }

    if (isPaternity) {
      if (personGender && personGender !== "male") {
        showAlert("Paternity leave is available only for male employees.");
        return;
      }
      const requestedDays = computeRequestedDays(
        formData.startDate,
        formData.endDate,
        formData.h_f_day,
      );
      if (requestedDays > 15) {
        showAlert(
          "Paternity leave exceeds maximum allowed duration (15 days).",
        );
        return;
      }
    }

    const noticeDays = getAdvanceNoticeDays(setting);
    if (!editingId && noticeDays > 0) {
      const today = new Date();
      const minDate = new Date();
      minDate.setDate(today.getDate() + noticeDays);
      const chosenStartRaw = new Date(formData.startDate);
      const chosenStart = new Date(
        chosenStartRaw.getFullYear(),
        chosenStartRaw.getMonth(),
        chosenStartRaw.getDate(),
      );
      if (chosenStart < minDate) {
        showAlert(
          !activePolicy
            ? `By default, a ${setting.type} request requires at least ${noticeDays} day(s) advance. You must apply at least ${noticeDays} day(s) before the start date.`
            : `You must apply for ${formData.leavetype} at least ${noticeDays} day(s) before the start date.`,
        );
        return;
      }
    }

    const requestedDays = computeRequestedDays(
      formData.startDate,
      formData.endDate,
      formData.h_f_day,
    );

    if (!balances || balances.length === 0) {
      await fetchLeaveBalance();
    }

    let balanceRow =
      (balances || []).find(
        (b) =>
          String(b.type || b.label || "")
            .toLowerCase()
            .trim() ===
          String(setting.type || setting.type || selectedTypeRaw)
            .toLowerCase()
            .trim(),
      ) ||
      (balances || []).find((b) =>
        String(b.type || b.label || "")
          .toLowerCase()
          .includes(String(selectedTypeRaw).toLowerCase()),
      ) ||
      null;

    let allowance = 0,
      used = 0,
      remaining = 0,
      carry_forward = Number(setting.carry_forward || 0);

    if (balanceRow) {
      allowance = Number(
        balanceRow.allowance ??
          balanceRow.earned ??
          balanceRow.annual_allowance ??
          0,
      );
      used = Number(balanceRow.used ?? 0);
      remaining = Number(balanceRow.remaining ?? allowance - used);
      carry_forward = Number(balanceRow.carry_forward ?? carry_forward);
    } else {
      if (String(setting.type).toLowerCase() === "earned")
        allowance = Number(setting.earned_leaves || 0) + carry_forward;
      else allowance = Number(setting.value || 0) + carry_forward;
      used = 0;
      remaining = allowance - used;
    }

    const requestData = { employeeId, name: employeeName, ...formData };
    const jsonUrl = editingId
      ? `${BACKEND}/edit/${editingId}`
      : `${BACKEND}/employee/leave`;
    const jsonMethod = editingId ? "PUT" : "POST";
    const removeAttachment = (attId) => {
      setAttachments((prev) =>
        (prev || []).filter((a) => (a.id || a.fileName || a.name) !== attId),
      );
      setFormData((prev) => ({
        ...prev,
        attachments: (prev.attachments || []).filter(
          (a) => (a.id || a.fileName || a.name) !== attId,
        ),
      }));
    };
    const normalizeFilesFromAttachments = (attachmentsArray = []) => {
      const fileObjs = [];
      for (const f of attachmentsArray) {
        if (!f) continue;
        try {
          if (typeof File !== "undefined" && f instanceof File) {
            fileObjs.push(f);
            continue;
          }
        } catch (e) {}
        if (f.file && (f.file instanceof File || f.file?.name)) {
          fileObjs.push(f.file);
          continue;
        }
        if (f.raw && (f.raw instanceof File || f.raw?.name)) {
          fileObjs.push(f.raw);
          continue;
        }
        if (f.blob && (f.blob instanceof Blob || f.blob?.size)) {
          const blob = f.blob;
          const name = f.name || f.fileName || `attachment-${Date.now()}.bin`;
          try {
            const file = new File([blob], name, {
              type: blob.type || "application/octet-stream",
            });
            fileObjs.push(file);
          } catch {
            fileObjs.push(blob);
          }
          continue;
        }
        if (f.name && f.size) {
        }
      }
      return fileObjs;
    };

    const uploadAttachments = async (leaveId, files = [], mode = "add") => {
      if (!leaveId) throw new Error("leaveId required for attachments");
      const fileObjs = normalizeFilesFromAttachments(files);
      if (!fileObjs.length) {
        console.warn("[uploadAttachments] no file objects to upload");
        return { ok: true, uploaded: [] };
      }

      const form = new FormData();
      fileObjs.forEach((f, i) => {
        const fname = f.name || f.fileName || `attachment-${i}`;
        form.append("attachments", f, fname);
      });

      const uploadHeaders = {};
      Object.keys(headers || {}).forEach((k) => {
        const v = headers[k];
        if (v === undefined || v === null || v === "") return;
        if (k.toLowerCase() === "content-type") return;
        uploadHeaders[k] = v;
      });

      const candidates =
        mode === "replace"
          ? [
              `${BACKEND}/employee/leave/${leaveId}/attachments`,
              `${BACKEND}/api/employee/leave/${leaveId}/attachments`,
            ]
          : [
              `${BACKEND}/employee/leave/${leaveId}/attachments`,
              `${BACKEND}/api/employee/leave/${leaveId}/attachments`,
            ];

      let lastErr = null;
      for (const uploadUrl of candidates) {
        try {
          console.debug("[uploadAttachments] attempting upload to", uploadUrl);
          const res = await fetch(uploadUrl, {
            method: mode === "replace" ? "PUT" : "POST",
            credentials: "include",
            headers: uploadHeaders,
            body: form,
          });
          const json = await res.json().catch(() => null);
          if (res.ok) {
            return { ok: true, uploaded: json?.data || json };
          } else {
            if (res.status === 404) {
              console.warn("[uploadAttachments] 404 at", uploadUrl);
              lastErr = { status: 404, json };
              continue;
            }
            return {
              ok: false,
              error: json || `HTTP ${res.status}`,
              status: res.status,
            };
          }
        } catch (err) {
          console.warn("[uploadAttachments] network error for", uploadUrl, err);
          lastErr = err;
          continue;
        }
      }

      return { ok: false, error: "No upload endpoint worked", lastErr };
    };
    // tries to delete an attachment by id for a given leave id
    const deleteAttachmentById = async (leaveId, attachmentId) => {
      if (!leaveId || !attachmentId)
        return { ok: false, error: "missing params" };
      const candidates = [
        `${BACKEND}/employee/leave/${encodeURIComponent(leaveId)}/attachments/${encodeURIComponent(attachmentId)}`,
        `${BACKEND}/api/employee/leave/${encodeURIComponent(leaveId)}/attachments/${encodeURIComponent(attachmentId)}`,
        // sometimes systems expose /attachments/{id} under leave — also try that:
        `${BACKEND}/employee/leave/${encodeURIComponent(leaveId)}/attachments/${encodeURIComponent(attachmentId)}`,
      ].filter(Boolean);

      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            method: "DELETE",
            credentials: "include",
            headers,
          });
          if (res.ok) return { ok: true, status: res.status };
          // if 404 try next candidate
          if (res.status === 404) continue;
          const json = await res.json().catch(() => null);
          return {
            ok: false,
            status: res.status,
            error: json || `HTTP ${res.status}`,
          };
        } catch (err) {
          // try next candidate
          console.warn("[deleteAttachmentById] error deleting", url, err);
          continue;
        }
      }
      return { ok: false, error: "no delete endpoint worked" };
    };

    const doSubmit = async (data, submitUrl, submitMethod) => {
      try {
        const hasFiles = Array.isArray(attachments) && attachments.length > 0;

        if (editingId) {
          // 1) delete attachments removed by user (compare originalAttachmentIdsRef vs attachments state)
          try {
            const origIds = Array.isArray(originalAttachmentIdsRef.current)
              ? originalAttachmentIdsRef.current.slice()
              : [];
            const keepIds = (attachments || [])
              .map((a) => a.id)
              .filter(Boolean);
            const removed = origIds.filter((id) => !keepIds.includes(id));

            if (removed.length > 0) {
              // attempt to delete each removed attachment (best-effort)
              await Promise.all(
                removed.map(async (attId) => {
                  try {
                    const delRes = await deleteAttachmentById(editingId, attId);
                    if (!delRes.ok) {
                      console.warn(
                        "[doSubmit] failed to delete attachment",
                        attId,
                        delRes,
                      );
                    }
                  } catch (e) {
                    console.warn("[doSubmit] deleteAttachment error:", e);
                  }
                }),
              );
            }
          } catch (err) {
            console.warn(
              "[doSubmit] error while deleting removed attachments:",
              err,
            );
          }

          // 2) now build the FormData and include any new files from attachments state
          const form = new FormData();

          Object.keys(data || {}).forEach((k) => {
            const v = data[k];
            if (v === undefined || v === null) return;

            if (typeof v === "object") {
              form.append(k, JSON.stringify(v));
            } else {
              form.append(k, String(v));
            }
          });

          // append file objects for attachments that are actual File objects (new uploads)
          const fileObjs = normalizeFilesFromAttachments(attachments || []);
          fileObjs.forEach((f, i) => {
            const fname = f.name || f.fileName || `attachment-${i}`;
            try {
              form.append("attachments", f, fname);
            } catch {
              // some environments may fail to append non-File blobs; ignore
              form.append("attachments", f);
            }
          });

          // Also include a JSON field of current attachment ids to keep (server may use this)
          const keepIdsPayload = (attachments || [])
            .map((a) => a.id)
            .filter(Boolean);
          form.append("keep_attachment_ids", JSON.stringify(keepIdsPayload));

          const uploadHeaders = {};
          Object.keys(headers || {}).forEach((k) => {
            const v = headers[k];
            if (!v) return;
            if (k.toLowerCase() === "content-type") return;
            uploadHeaders[k] = v;
          });

          const response = await fetch(submitUrl, {
            method: "PUT",
            credentials: "include",
            headers: uploadHeaders,
            body: form,
          });

          const responseData = await response.json().catch(() => null);

          if (response.ok) {
            showAlert("Leave request updated successfully!");
            setFormVisible(false);
            setEditingId(null);
            resetForm();
            setAttachments([]);
            originalAttachmentIdsRef.current = [];

            await fetchLeaveRequests();
            await fetchLeaveBalance();
          } else {
            showAlert(
              responseData?.message || "Failed to update leave request.",
            );
          }

          return;
        }

        if (!editingId && !hasFiles) {
          const response = await fetch(submitUrl, {
            method: "POST",
            credentials: "include",
            headers,
            body: JSON.stringify(data),
          });

          const responseData = await response.json().catch(() => null);

          if (response.ok) {
            showAlert("Leave request submitted successfully!");
            setFormVisible(false);
            resetForm();
            await fetchLeaveRequests();
            await fetchLeaveBalance();
          } else {
            showAlert(
              responseData?.message || "Failed to submit leave request.",
            );
          }

          return;
        }

        if (!editingId && hasFiles) {
          const form = new FormData();

          Object.keys(data || {}).forEach((k) => {
            const v = data[k];
            if (v === undefined || v === null) return;

            if (typeof v === "object") {
              form.append(k, JSON.stringify(v));
            } else {
              form.append(k, String(v));
            }
          });

          attachments.forEach((fileObj, i) => {
            let file = fileObj;

            if (!(fileObj instanceof File) && fileObj?.file instanceof File) {
              file = fileObj.file;
            }

            if (file instanceof File) {
              form.append("attachments", file, file.name);
            }
          });

          const uploadHeaders = {};
          Object.keys(headers || {}).forEach((k) => {
            const v = headers[k];
            if (!v) return;
            if (k.toLowerCase() === "content-type") return;
            uploadHeaders[k] = v;
          });

          const response = await fetch(submitUrl, {
            method: "POST",
            credentials: "include",
            headers: uploadHeaders,
            body: form,
          });

          const responseData = await response.json().catch(() => null);

          if (response.ok) {
            showAlert("Leave request submitted successfully!");
            setFormVisible(false);
            resetForm();
            setAttachments([]);
            await fetchLeaveRequests();
            await fetchLeaveBalance();
          } else {
            showAlert(
              responseData?.message || "Failed to submit leave request.",
            );
          }
        }
      } catch (err) {
        console.error("Error in doSubmit:", err);
        showAlert("An error occurred while submitting the leave request.");
      }
    };

    if (requestedDays > remaining && !activePolicy) {
      await doSubmit(requestData, jsonUrl, jsonMethod);
      return;
    }

    if (requestedDays > remaining) {
      const deficit = requestedDays - remaining;
      const confirmMsg = `You're requesting ${requestedDays} day(s), but you have only ${remaining} remaining (${allowance} allowance, ${used} used, ${carry_forward} carry-forward). This will incur ${deficit} Loss-of-Pay day(s). Do you want to continue?`;
      showConfirm(confirmMsg, async () => {
        await doSubmit(requestData, jsonUrl, jsonMethod);
        closeConfirm();
      });
      return;
    }

    await doSubmit(requestData, jsonUrl, jsonMethod);
  };

  useEffect(() => {
    if (!employeeId) return;

    (async () => {
      try {
        await fetchPolicies();
      } catch {}

      try {
        await fetchLeaveRequests();
      } catch {}

      try {
        await fetchLeaveTypes();
      } catch {}

      try {
        await fetchLeaveBalance();
      } catch {}

      try {
        await fetchUserProfile();
      } catch {}
    })();
  }, [employeeId]);

  useEffect(() => {
    if (!Array.isArray(policies) || policies.length === 0) {
      setActivePolicy(null);
      return;
    }
    const today = new Date();
    const inRange = policies.find((p) => {
      try {
        const s = new Date(p.year_start);
        const e = new Date(p.year_end);
        return s <= today && today <= e;
      } catch {
        return false;
      }
    });
    setActivePolicy(
      inRange ||
        policies
          .slice()
          .sort((a, b) => new Date(b.year_start) - new Date(a.year_start))[0] ||
        null,
    );
  }, [policies]);

  useEffect(() => {
    if (employeeId) fetchLeaveRequests();
  }, [employeeId, teamSearch, teamStatus, filters.from_date, filters.to_date]);

  return {
    isFormVisible,
    formData,
    editingId,
    alertModal,
    confirmModal,
    balances,
    policies,
    activePolicy,
    leaveRequests,
    lopModal,
    monthlyLop,
    lopMonth,
    lopYear,
    statusUpdates,
    handleStatusChange,
    handleUpdate,

    defaultLeaveSettings,
    canViewTeam,

    openForm,
    closeForm,
    handleInputChange,
    handleSubmit,
    handleEdit,
    handleCancel,

    filters,
    setFilters,
    teamSearch,
    setTeamSearch,
    teamStatus,
    setTeamStatus,
    fetchLeaveRequests,

    setLopModal,
    fetchMonthlyLop: async (m, y) => {
      if (!employeeId) return 0;
      try {
        const url = `${BACKEND}/api/leave-policies/employee/${employeeId}/monthly-lop?month=${m}&year=${y}`;
        const res = await fetch(url, { credentials: "include", headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const payload = json?.data || {};
        const val = Number(
          payload.total_lop ?? payload.totalLop ?? payload.lop ?? 0,
        );
        setMonthlyLop(Number.isFinite(val) ? val : 0);
        return val;
      } catch (err) {
        console.error("Could not fetch monthly LOP:", err);
        setMonthlyLop(0);
        return 0;
      }
    },
    computeMonthlyLop: async (m, y) => {
      if (!employeeId) return null;
      try {
        const url = `${BACKEND}/api/leave-policies/employee/${employeeId}/compute-monthly-lop`;
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ month: m, year: y }),
        });
        if (!res.ok) throw new Error("Compute failed");
        const json = await res.json();
        const payload = json?.data || {};
        const val = Number(
          payload.total_lop ?? payload.totalLop ?? payload.lop ?? 0,
        );
        setMonthlyLop(Number.isFinite(val) ? val : 0);
        return val;
      } catch (err) {
        console.error("Compute monthly LOP failed:", err);
        showAlert("Failed to compute monthly LOP.");
        return null;
      }
    },

    showAlert,
    closeAlert,
    showConfirm,
    closeConfirm,
    setFormData,
    setEditingId,
    setAlertModal,
    setConfirmModal,
    setBalances,
    setPolicies,
    setActivePolicy,
    setMonthlyLop,
    setLopMonth,
    setLopYear,
    loadLeaveBalance,
    getBalanceForType,

    attachments,
    setAttachments,
    fetchLeaveTypes,
    leaveTypes,
    userProfile,
  };
}
