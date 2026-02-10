"use client";

import { useState, useEffect } from "react";
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
  const [balances, setBalances] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [activePolicy, setActivePolicy] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState({ self: [], team: [] });
  const [leaveTypes, setLeaveTypes] = useState([]);

  // user profile (from separate table) - contains gender, dob etc.
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

  // compute age from DOB string (ISO or parseable)
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

  // check if user already has same-type leave in same month (self requests)
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

  // fetch user profile (gender/dob) from separate table(s). Try several likely endpoints.
  const fetchUserProfile = async () => {
    if (!employeeId) return null;
    const candidates = [
      `${BACKEND}/api/employee/${employeeId}`,
      `${BACKEND}/api/employees/${employeeId}`,
      `${BACKEND}/api/profile/${employeeId}`,
      `${BACKEND}/api/employee/profile/${employeeId}`,
      `${BACKEND}/api/employee-profile/${employeeId}`,
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { credentials: "include", headers });
        if (!res.ok) continue;
        const json = await res.json();
        // try to find profile in json.data or json.message or top-level
        const profile =
          json?.data ||
          json?.message ||
          json ||
          (json?.result && json.result[0]) ||
          null;
        if (profile) {
          // normalize keys
          const gender =
            profile.gender ||
            profile.sex ||
            profile.Gender ||
            profile.gender_name ||
            null;
          const dob =
            profile.dob ||
            profile.date_of_birth ||
            profile.dateOfBirth ||
            profile.DOB ||
            null;
          const normalized = { ...profile, gender, dob };
          setUserProfile(normalized);
          return normalized;
        }
      } catch (err) {
        // ignore and try next
      }
    }
    setUserProfile(null);
    return null;
  };

  // normalizeLeaveTypes helper (shared used locally)
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

  /**
   * fetchLeaveTypes:
   * - If there is an activePolicy (policy object with leave_settings), derive the leave types from that policy (so employee UI shows only used types).
   * - Otherwise fall back to calling /types (or other endpoints) to fetch global/system types.
   */
  const fetchLeaveTypes = async () => {
    try {
      // 1) If we have an active policy with leave_settings, take types from there
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

      // 2) fallback: call /types endpoint (try both namespaced and fallback)
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

      // older APIs might be at /api/leave/types or /api/leave-types etc — fallback already handled elsewhere
      if (res.status === 404) {
        const fallback = `${BACKEND}/types${
          params.toString() ? `?${params.toString()}` : ""
        }`;

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

      const selfUrl = `${BACKEND}/employee/leave/${employeeId}`;
      const selfParams = new URLSearchParams();
      if (filters.from_date) selfParams.append("from_date", filters.from_date);
      if (filters.to_date) selfParams.append("to_date", filters.to_date);
      const selfFinalUrl = selfParams.toString()
        ? `${selfUrl}?${selfParams}`
        : selfUrl;

      const selfResponse = await fetch(selfFinalUrl, {
        credentials: "include",
        headers,
      });
      let selfRequests = [];
      if (selfResponse.ok) {
        const selfResult = await selfResponse.json();
        selfRequests =
          selfResult?.data ||
          selfResult?.message?.data ||
          extractArrayFromTeamResult(selfResult);
      }

      let teamRequests = [];
      if (canViewTeam) {
        const teamUrl = `${BACKEND}/team-lead/${employeeId}`;
        const teamParams = new URLSearchParams();
        if (filters.from_date)
          teamParams.append("from_date", filters.from_date);
        if (filters.to_date) teamParams.append("to_date", filters.to_date);
        if (teamSearch) teamParams.append("search", teamSearch);
        if (teamStatus) teamParams.append("status", teamStatus);
        const teamFinalUrl = teamParams.toString()
          ? `${teamUrl}?${teamParams}`
          : teamUrl;

        const teamResponse = await fetch(teamFinalUrl, {
          credentials: "include",
          headers,
        });
        if (teamResponse.ok) {
          const teamResult = await teamResponse.json();
          teamRequests = extractArrayFromTeamResult(
            teamResult?.data ?? teamResult ?? teamResult?.message ?? {},
          );
        } else {
          console.warn("Team fetch returned non-ok", teamResponse.status);
        }
      }

      setLeaveRequests({ self: selfRequests, team: teamRequests });
      return { self: selfRequests, team: teamRequests };
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

      // augment with menstrual monthly grant if eligible and not used this month
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

  // augmentation for monthly menstrual 1-day entitlement (ephemeral client-side)
  const augmentBalancesWithMenstrual = (balanceArray = []) => {
    if (!Array.isArray(balanceArray)) return [];
    const copy = balanceArray.slice();
    // find likely menstrual row
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
      // ensure menstrual balances are not carried forward accidentally
      if (idx >= 0) {
        const existing = { ...copy[idx] };
        // no carry forward for menstrual - ensure carry_forward property zeroed if present
        if ("carry_forward" in existing) existing.carry_forward = 0;
        copy[idx] = existing;
      }
      return copy;
    }

    // If no menstrual row exists, add ephemeral row for this month with 1 day
    if (idx === -1) {
      // only add if user has not already taken menstrual leave this month
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
        // user already used menstrual this month => no ephemeral grant
      }
      return copy;
    }

    // idx exists - modify existing row if necessary
    const original = { ...copy[idx] };
    // determine whether backend already provided a monthly grant or not by checking flags
    // We'll add 1 if user hasn't used in this month and backend did not already provide it.
    const usedThisMonth = hasExistingSameMonthForType(
      original.type || original.label || "menstrual",
    );
    const alreadyEphemeralForThisMonth =
      original.ephemeral_month === currentMonth &&
      original.ephemeral_year === currentYear;

    if (!usedThisMonth && !alreadyEphemeralForThisMonth) {
      // add 1 to allowance & remaining (client-side only)
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
      // ensure no carry forward
      original.carry_forward = 0;
      copy[idx] = original;
    } else {
      // ensure carry_forward is zero (menstrual should lapse)
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
      // augment as above for menstrual
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
    });
    setEditingId(null);
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
  };

  const handleEdit = (request) => {
    setFormData({
      reason: request.reason,
      leavetype: request.leave_type,
      h_f_day: request.H_F_day || "Full Day",
      startDate: parseLocalDate(request.start_date),
      endDate: parseLocalDate(request.end_date),
    });
    setEditingId(request.id || request.leave_id || null);
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

  // MAIN submit with gender/age/menstrual rules
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
      // if user selected a label instead of key, try best-effort lookup in leaveTypes
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

    // fetch user gender & dob (use userProfile if available); if not yet fetched, try to fetch
    if (!userProfile) await fetchUserProfile();

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

    // canonical matching for menstrual / maternity / paternity
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

    // MENSTRUAL rules
    if (isMenstrual) {
      // gender check
      if (personGender && personGender !== "female") {
        showAlert("Menstrual leave is available only for female employees.");
        return;
      }
      // age check (Karnataka guideline 18-52) - skip strict rejection if DOB missing, but warn
      if (personAge !== null && (personAge < 18 || personAge > 52)) {
        showAlert(
          "Menstrual leave is allowed only for females aged between 18 and 52.",
        );
        return;
      }
      if (personAge === null) {
        // warn but proceed with age-unknown: allow but inform
        showAlert(
          "DOB not available in profile — age-based eligibility for menstrual leave could not be verified.",
        );
        // we don't return; allow to continue (you may decide to block instead)
      }
      // single-day only
      const requestedDays = computeRequestedDays(
        formData.startDate,
        formData.endDate,
        formData.h_f_day,
      );
      if (requestedDays !== 1) {
        showAlert("Menstrual leave can be taken only for a single day.");
        return;
      }
      // not allowed if already taken same month
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

    // MATERNITY rules
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

    // PATERNITY rules
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

    // regular notice day checks
    const noticeDays = getAdvanceNoticeDays(setting);
    if (!editingId && noticeDays > 0) {
      const today = new Date();
      const minDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      minDate.setDate(minDate.getDate() + noticeDays);
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

    // compute requestedDays and allowances (taking into account our menstrual ephemeral grant)
    const requestedDays = computeRequestedDays(
      formData.startDate,
      formData.endDate,
      formData.h_f_day,
    );

    // ensure balances are up-to-date: fetch balances if empty
    if (!balances || balances.length === 0) {
      await fetchLeaveBalance();
    }

    // find the balance row (case-insensitive match)
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

    // fall back to default policy settings when balance not found
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

    // Special handling: if selected type is menstrual and we previously augmented balances with ephemeral 1-day grant,
    // that grant should have been included in balanceRow.remaining via augmentBalancesWithMenstrual above.
    // So remaining already reflects it.

    const requestData = { employeeId, name: employeeName, ...formData };
    const url = editingId
      ? `${BACKEND}/edit/${editingId}`
      : `${BACKEND}/employee/leave`;
    const method = editingId ? "PUT" : "POST";
    // replace your existing uploadAttachments with this function
    const uploadAttachments = async (leaveId, files = []) => {
      if (!leaveId) throw new Error("leaveId required for attachments");
      if (!Array.isArray(files) || files.length === 0)
        return { ok: true, uploaded: [] };

      // Normalize to actual File/Blob objects
      const fileObjs = [];
      for (const f of files) {
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
          fileObjs.push(f.blob);
          continue;
        }
      }

      if (fileObjs.length === 0) {
        console.warn(
          "[uploadAttachments] no actual File/Blob objects found in attachments array",
          { attachmentsPreview: files.slice(0, 5) },
        );
        return { ok: false, error: "No file objects found to upload" };
      }

      const form = new FormData();
      fileObjs.forEach((f, i) => {
        const fname =
          f && (f.name || f.fileName || f.file_name)
            ? f.name || f.fileName || f.file_name
            : `attachment-${i}`;
        form.append("attachments", f, fname);
      });

      // Build upload headers but remove Content-Type and any undefined/null values
      const uploadHeaders = {};
      for (const k of Object.keys(headers || {})) {
        const v = headers[k];
        if (v === undefined || v === null || v === "") continue;
        if (k.toLowerCase() === "content-type") continue; // let browser set multipart boundary
        uploadHeaders[k] = v;
      }

      // Candidate endpoints to try (order matters)
      const candidates = [
        `${BACKEND}/employee/leave/${leaveId}/attachments`,
        `${BACKEND}/leave/${leaveId}/attachments`,
        `${BACKEND}/employee/leave/${leaveId}/attachment`,
        `${BACKEND}/employee/leave/attachments?leaveId=${leaveId}`,
        `${BACKEND}/attachments/leave/${leaveId}`,
      ];

      let lastErr = null;
      for (const uploadUrl of candidates) {
        try {
          console.debug(
            "[uploadAttachments] trying",
            uploadUrl,
            "headers:",
            uploadHeaders,
          );
          const res = await fetch(uploadUrl, {
            method: "POST",
            credentials: "include",
            headers: uploadHeaders,
            body: form,
          });
          const json = await res.json().catch(() => null);
          if (res.ok) {
            return { ok: true, uploaded: json?.data || json };
          } else {
            // If 404, try next candidate; otherwise return error immediately (server responded but failed)
            if (res.status === 404) {
              console.warn("[uploadAttachments] 404 for", uploadUrl);
              lastErr = { status: 404, json };
              continue;
            } else {
              console.warn(
                "[uploadAttachments] failed:",
                res.status,
                json,
                "url:",
                uploadUrl,
              );
              return {
                ok: false,
                error: json || `HTTP ${res.status}`,
                status: res.status,
              };
            }
          }
        } catch (err) {
          console.warn("[uploadAttachments] network error for", uploadUrl, err);
          lastErr = err;
          continue;
        }
      }

      // All candidates exhausted
      return {
        ok: false,
        error:
          "No matching upload endpoint (all candidates returned 404 or network error)",
        lastErr,
      };
    };

    const doSubmit = async (data, submitUrl, submitMethod) => {
      try {
        const response = await fetch(submitUrl, {
          method: submitMethod,
          credentials: "include",
          headers,
          body: JSON.stringify(data),
        });
        const responseData = await response.json().catch(() => null);
        if (response.ok) {
          // if a new leave was created, backend should return created id in responseData.data.id
          const createdId =
            responseData?.data?.id || responseData?.id || data.leaveId || null;

          // Upload attachments if we have selected files AND a created id
          if (attachments && attachments.length && createdId) {
            // attempt upload (normalize wrappers if necessary)
            const uploadRes = await uploadAttachments(createdId, attachments);
            if (!uploadRes.ok) {
              // optional: show upload partial failure but still treat leave created OK
              console.warn("Attachments upload returned error:", uploadRes);
              showAlert(
                "Leave submitted but attachment upload failed. Check console/server logs.",
              );
            } else {
              // success: you can refresh attachments UI if present
              console.debug("Attachments uploaded:", uploadRes.uploaded);
            }
          }

          showAlert(
            editingId
              ? "Leave request updated successfully!"
              : "Leave request submitted successfully!",
          );
          setFormVisible(false);
          setEditingId(null);
          resetForm();
          // clear attachments after successful submit
          setAttachments([]);
          // refresh lists and balances
          await fetchLeaveRequests();
          await fetchLeaveBalance();
        } else {
          showAlert(responseData?.message || "Failed to submit leave request.");
        }
      } catch (err) {
        console.error("Error submitting leave request:", err);
        showAlert("An error occurred while submitting the leave request.");
      }
    };

    // Loss-of-pay flow and continue confirmation
    if (requestedDays > remaining && !activePolicy) {
      await doSubmit(requestData, url, method);
      return;
    }

    if (requestedDays > remaining) {
      const deficit = requestedDays - remaining;
      const confirmMsg = `You're requesting ${requestedDays} day(s), but you have only ${remaining} remaining (${allowance} allowance, ${used} used, ${carry_forward} carry-forward). This will incur ${deficit} Loss-of-Pay day(s). Do you want to continue?`;
      showConfirm(confirmMsg, async () => {
        await doSubmit(requestData, url, method);
        closeConfirm();
      });
      return;
    }

    await doSubmit(requestData, url, method);
  };

  // initial load: fetch profile, leave types, policies, leave-requests and balances (in sequence)
  useEffect(() => {
    (async () => {
      try {
        await fetchUserProfile();
      } catch (err) {
        // ignore profile errors
      }
      try {
        await fetchPolicies();
      } catch (err) {}
      // fetch requests first (so augmentBalancesWithMenstrual can check usage this month)
      try {
        await fetchLeaveRequests();
      } catch (err) {}
      try {
        await fetchLeaveTypes();
      } catch (err) {}
      try {
        await fetchLeaveBalance();
      } catch (err) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  // update activePolicy when policies change
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
