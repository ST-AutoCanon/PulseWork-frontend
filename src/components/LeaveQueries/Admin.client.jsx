// File: Admin.client.jsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import "./Admin.css";
import PolicyModal from "./PolicyModal.client";
import Modal from "../Modal/Modal.client";
import CompensationPopup from "./CompensationPopup.client";
import { IoSearch } from "react-icons/io5";
import { MdOutlineRemoveRedEye, MdOutlineAttachFile } from "react-icons/md";
import { useAuth } from "../../context/AuthProvider.client";
import {
  normalizeLeaveTypes,
  getTypeKey,
  getTypeLabel,
} from "./leaveUtils.client";

const formatDate = (isoDate) => {
  if (!isoDate) return "";
  return new Date(isoDate).toISOString().split("T")[0];
};

const parseDateOnly = (isoDate) => {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) {
    const parts = String(isoDate).split("-");
    if (parts.length >= 3) {
      const [y, m, day] = parts;
      return new Date(Number(y), Number(m) - 1, Number(day));
    }
    return null;
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const calculateDays = (startDate, endDate) => {
  const s = parseDateOnly(startDate);
  const e = parseDateOnly(endDate);
  if (!s || !e) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((e - s) / msPerDay);
  return diffDays >= 0 ? diffDays + 1 : 0;
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

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

const canonicalTypeMatch = (candidate, ...keywords) => {
  if (!candidate) return false;
  const c = String(candidate).toLowerCase();
  return keywords.some((k) => c.includes(k));
};

export default function Admin({ openPolicyId = null }) {
  const { user } = useAuth();

  const [leaveQueries, setLeaveQueries] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusUpdates, setStatusUpdates] = useState({});
  const [updatedQueries, setUpdatedQueries] = useState(new Set());
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState({});

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const [policyAlerts, setPolicyAlerts] = useState([]);
  const [showPolicyAlertsModal, setShowPolicyAlertsModal] = useState(false);

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

  // Attachment modal state
  const [attachmentsModal, setAttachmentsModal] = useState({
    isVisible: false,
    title: "",
    files: [],
  });

  // cache mapping leaveId -> normalized attachments (pre-resolved)
  const [attachmentsMap, setAttachmentsMap] = useState({});

  const showAlert = (message, title = "") => {
    setLopModal((m) => ({ ...m, isVisible: false }));
    setTimeout(() => {
      setAlertModal({ isVisible: true, title, message });
    }, 120);
  };
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const daysUntil = (dateStr) => {
    if (!dateStr) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = d - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const computePolicyAlerts = (policyList = []) => {
    if (!Array.isArray(policyList)) return [];
    return policyList
      .map((p) => {
        const daysLeft = daysUntil(p.year_end);
        if (daysLeft < 0) return null;

        let severity = null;
        if (daysLeft <= 5) severity = "critical";
        else if (daysLeft <= 10) severity = "warning";
        if (!severity) return null;

        return {
          id: p.id,
          policy: p,
          daysLeft,
          severity,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const sevOrder = { critical: 0, warning: 1 };
        if (sevOrder[a.severity] !== sevOrder[b.severity]) {
          return sevOrder[a.severity] - sevOrder[b.severity];
        }
        return a.daysLeft - b.daysLeft;
      });
  };

  const buildHeaders = useCallback(() => {
    const h = {
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
      "Content-Type": "application/json",
    };
    if (user?.employeeId || user?.id) {
      h["x-employee-id"] = user.employeeId || user.id;
    }
    if (user?.orgId || user?.raw?.org_id || user?.org_id) {
      h["x-org-id"] =
        user.orgId || user.raw?.org_id || user.org_id || user.organization_id;
    }
    return h;
  }, [user]);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const url = `${API_BASE}/types`;
      const res = await fetch(url, {
        credentials: "include",
        headers: buildHeaders(),
      });
      if (!res.ok) {
        console.warn("[fetchLeaveTypes] non-ok", res.status);
        setLeaveTypes([]);
        return [];
      }
      const json = await res.json().catch(() => null);
      const raw = json?.data ?? json ?? [];
      const normalized = normalizeLeaveTypes(raw);
      setLeaveTypes(normalized);
      return normalized;
    } catch (err) {
      console.error("[fetchLeaveTypes] error:", err);
      setLeaveTypes([]);
      return [];
    }
  }, [buildHeaders]);

  const fetchPolicies = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/leave-policies`;

      const res = await fetch(url, {
        credentials: "include",
        headers: buildHeaders(),
      });
      let json = null;
      try {
        json = await res.json();
      } catch (e) {
        console.warn("[fetchPolicies] parse error", e);
      }

      setPolicies((json && (json.data || json.policies)) || []);
    } catch (err) {
      console.error("Failed to fetch leave policies:", err);
      showAlert("Could not load leave policies.");
    }
  }, [buildHeaders]);

  useEffect(() => {
    const alerts = computePolicyAlerts(policies);
    setPolicyAlerts(alerts);
    setShowPolicyAlertsModal(alerts.length > 0);
  }, [policies]);

  useEffect(() => {
    // initial data load
    fetchPolicies();
    fetchLeaveQueries();
    fetchLeaveTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, fromDate, toDate, search, user?.employeeId, user?.orgId]);

  useEffect(() => {
    if (openPolicyId) {
      setShowPolicyModal(true);
      setShowPolicyAlertsModal(false);
    }
  }, [openPolicyId]);

  const fetchLeaveQueries = useCallback(async () => {
    try {
      const paramsObj = {};
      if (search) paramsObj.search = search;
      if (statusFilter) paramsObj.status = statusFilter;
      if (fromDate) paramsObj.from_date = fromDate;
      if (toDate) paramsObj.to_date = toDate;

      const params = new URLSearchParams(paramsObj).toString();
      // leave routes are mounted at "/" so admin endpoint is /admin/leave (no /api prefix)
      const url = `${API_BASE}/admin/leave${params ? `?${params}` : ""}`;

      const res = await fetch(url, {
        credentials: "include",
        headers: buildHeaders(),
      });
      let json = null;
      try {
        json = await res.json();
      } catch (e) {
        console.error("[fetchLeaveQueries] JSON parse error", e);
        showAlert("Failed to parse server response for leave queries.");
        return;
      }

      if (json && (json.success || json.status === "success" || json.data)) {
        setLeaveQueries(json.data || json.leave_queries || json.message || []);
        setStatusUpdates({});
      } else {
        showAlert(json?.message || "Failed to fetch leave queries");
      }
    } catch (err) {
      console.error("[fetchLeaveQueries] Error:", err);
      showAlert("Error fetching leave queries");
    }
  }, [search, statusFilter, fromDate, toDate, buildHeaders]);

  const handleIgnorePolicyAlerts = async () => {
    const actorId = user?.employeeId || user?.id || null;

    try {
      setShowPolicyAlertsModal(false);
      const url = `${API_BASE}/api/leave-policies/auto-extend`;
      const body = { extensionDays: 90, actorId };
      const resp = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: buildHeaders(),
        body: JSON.stringify(body),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) {
        console.warn("[handleIgnorePolicyAlerts] server returned non-ok", json);
        showAlert(json?.message || "Failed to auto-extend policies.");
        return;
      }
      await fetchPolicies();
      await fetchLeaveQueries();
      showAlert(json?.message || "Policy auto-extension processed.");
    } catch (err) {
      console.error("[handleIgnorePolicyAlerts] error:", err);
      showAlert("Failed to auto-extend policies (network error).");
    }
  };

  const fetchEmployeeProfile = async (employeeId) => {
    if (!employeeId) return null;
    const candidates = [
      `${API_BASE}/api/employee/${employeeId}`,
      `${API_BASE}/api/employees/${employeeId}`,
      `${API_BASE}/api/profile/${employeeId}`,
      `${API_BASE}/api/employee/profile/${employeeId}`,
      `${API_BASE}/api/employee-profile/${employeeId}`,
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          credentials: "include",
          headers: buildHeaders(),
        });
        if (!res.ok) continue;
        const json = await res.json();
        const profile = json?.data || json?.message || json || null;
        if (profile) {
          const gender =
            profile.gender || profile.sex || profile.Gender || null;
          const dob =
            profile.dob || profile.date_of_birth || profile.dateOfBirth || null;
          return { ...profile, gender, dob };
        }
      } catch (err) {
        // ignore
      }
    }
    return null;
  };

  const augmentBalancesWithMenstrual = (balanceArray = [], profile = null) => {
    if (!Array.isArray(balanceArray)) return [];
    const copy = balanceArray.slice();
    const idx = copy.findIndex((b) =>
      canonicalTypeMatch(b.type || b.label || "", "menstrual", "menstr"),
    );
    const gender = (profile?.gender || "").toString().toLowerCase();
    const dob = profile?.dob || null;
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

    const usedThisMonth = (leaveQueries || []).some((r) => {
      try {
        const type = String(r.leave_type || r.type || "").toLowerCase();
        if (!type.includes("menstr")) return false;
        const s = new Date(r.start_date || r.startDate || r.date || 0);
        if (isNaN(s.getTime())) return false;
        const status = (r.status || "").toLowerCase();
        if (["rejected", "cancelled"].includes(status)) return false;
        return s.getMonth() === currentMonth && s.getFullYear() === currentYear;
      } catch {
        return false;
      }
    });

    if (idx === -1) {
      if (!usedThisMonth) {
        copy.push({
          type: "menstrual",
          label: "Menstrual Leave",
          allowance: 1,
          used: 0,
          remaining: 1,
          carry_forward: 0,
          ephemeral: true,
          ephemeral_month: currentMonth,
          ephemeral_year: currentYear,
        });
      }
      return copy;
    }

    const original = { ...copy[idx] };
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

  const loadLeaveBalance = async (employeeId) => {
    if (leaveBalances[employeeId]) {
      return leaveBalances[employeeId];
    }
    try {
      const url = `${API_BASE}/api/leave-policies/employee/${employeeId}/leave-balance`;

      const res = await fetch(url, {
        credentials: "include",
        headers: buildHeaders(),
      });
      let json = null;
      try {
        json = await res.json();
      } catch (e) {
        console.error("[loadLeaveBalance] JSON parse error", e);
        setLeaveBalances((b) => ({ ...b, [employeeId]: [] }));
        return [];
      }

      let data = json.data || [];

      try {
        const profile = await fetchEmployeeProfile(employeeId);
        data = augmentBalancesWithMenstrual(data, profile);
      } catch (err) {
        // ignore augmentation failures
      }

      setLeaveBalances((b) => ({ ...b, [employeeId]: data }));
      return data;
    } catch (err) {
      console.error("[loadLeaveBalance] Error:", err);
      return [];
    }
  };

  const handleDeletePolicy = async (id) => {
    if (!window.confirm("Delete this policy?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/leave-policies/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: buildHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchPolicies();
    } catch (err) {
      console.error("Failed to delete policy:", err);
      showAlert("Failed to delete policy.");
    }
  };

  const doUpdate = async (leaveId, payload = {}, query = null) => {
    try {
      let compensatedRaw;
      if (payload.hasOwnProperty("compensated_days"))
        compensatedRaw = payload.compensated_days;
      else if (payload.hasOwnProperty("compensatedDays"))
        compensatedRaw = payload.compensatedDays;
      else if (payload.hasOwnProperty("compensated"))
        compensatedRaw = payload.compensated;
      else compensatedRaw = 0;
      const compensated = Number(compensatedRaw) || 0;

      let deductedRaw;
      if (payload.hasOwnProperty("deducted_days"))
        deductedRaw = payload.deducted_days;
      else if (payload.hasOwnProperty("deductedDays"))
        deductedRaw = payload.deductedDays;
      else if (payload.hasOwnProperty("deducted"))
        deductedRaw = payload.deducted;
      else deductedRaw = 0;
      const deducted = Number(deductedRaw) || 0;

      let lopRaw;
      if (payload.hasOwnProperty("loss_of_pay_days"))
        lopRaw = payload.loss_of_pay_days;
      else if (payload.hasOwnProperty("lopDays")) lopRaw = payload.lopDays;
      else if (payload.hasOwnProperty("loss_of_pay"))
        lopRaw = payload.loss_of_pay;
      else lopRaw = 0;
      const lop = Number(lopRaw) || 0;

      let preservedRaw = null;
      if (payload.hasOwnProperty("preserved_leave_days"))
        preservedRaw = payload.preserved_leave_days;
      else if (payload.hasOwnProperty("preservedLeaveDays"))
        preservedRaw = payload.preservedLeaveDays;
      else if (payload.hasOwnProperty("preserved"))
        preservedRaw = payload.preserved;
      const preserved =
        preservedRaw === null || preservedRaw === undefined
          ? null
          : Number(preservedRaw);

      let status = "";
      if (payload.hasOwnProperty("status")) status = payload.status;
      else if (payload.hasOwnProperty("statusText"))
        status = payload.statusText;

      let comments = null;
      if (payload.hasOwnProperty("comments")) comments = payload.comments;
      else if (payload.hasOwnProperty("comment")) comments = payload.comment;
      else comments = null;

      const actorId = user?.employeeId || user?.id || null;

      const isDefaulted =
        payload.is_defaulted === true ||
        payload.isDefaulted === true ||
        payload.is_defaulted === "true" ||
        payload.isDefaulted === "true"
          ? true
          : false;

      const fullPayload = {
        status,
        comments,

        compensated_days: compensated,
        compensatedDays: compensated,
        compensated: compensated,

        deducted_days: deducted,
        deductedDays: deducted,
        deducted: deducted,

        loss_of_pay_days: lop,
        lopDays: lop,
        loss_of_pay: lop,

        preserved_leave_days:
          preserved === undefined || preserved === null ? null : preserved,
        preservedLeaveDays:
          preserved === undefined || preserved === null ? null : preserved,
        preserved:
          preserved === undefined || preserved === null ? null : preserved,

        total_days:
          payload &&
          (payload.total_days ??
            payload.totalDays ??
            payload.totalDaysRequested ??
            null),
        totalDays:
          payload &&
          (payload.totalDays ??
            payload.total_days ??
            payload.totalDaysRequested ??
            null),

        actorId,

        is_defaulted: isDefaulted,
        isDefaulted: isDefaulted,
      };

      const headersForReq = { ...buildHeaders() };
      if (actorId) headersForReq["x-employee-id"] = actorId;

      const url = `${API_BASE}/admin/leave/${leaveId}`;

      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: headersForReq,
        body: JSON.stringify(fullPayload),
      });

      let json = null;
      let text = null;
      try {
        json = await res.json();
      } catch (err) {
        try {
          text = await res.text();
        } catch (e) {
          text = `<failed to read text: ${String(e)}>`;
        }
      }

      if (!res.ok) {
        const serverMsg =
          (json && (json.message || (json.error && json.error.message))) ||
          text ||
          `Server returned ${res.status}`;
        console.warn("[doUpdate] Server error:", serverMsg);
        showAlert(serverMsg);
        return { ok: false, status: res.status, body: json || text };
      }

      if (json && (json.success || json.status === "success")) {
        setUpdatedQueries((s) => new Set(s).add(leaveId));
        await fetchLeaveQueries();
        return { ok: true, status: res.status, body: json };
      } else {
        const serverMsg =
          (json && (json.message || json.error)) ||
          "Failed to update leave (no success flag)";
        console.warn("[doUpdate] Warning:", serverMsg);
        showAlert(serverMsg);
        return { ok: false, status: res.status, body: json };
      }
    } catch (err) {
      console.error("[doUpdate] Unexpected error:", err);
      showAlert(
        "Error updating leave (network or client error). Check console.",
      );
      return { ok: false, error: err };
    }
  };

  const findActivePolicyForRequestDate = (request) => {
    if (!request) return null;
    if (!Array.isArray(policies) || policies.length === 0) return null;
    const startDate = request.start_date || request.startDate || null;
    if (!startDate) return null;
    try {
      const req = new Date(startDate);
      req.setHours(0, 0, 0, 0);
      for (const p of policies) {
        try {
          const s = new Date(p.year_start);
          const e = new Date(p.year_end);
          s.setHours(0, 0, 0, 0);
          e.setHours(0, 0, 0, 0);
          if (s <= req && req <= e) return p;
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const handleUpdate = async (leaveId, query) => {
    const upd = statusUpdates[leaveId] || {};

    if (upd.status === "Approved") {
      const days = calculateDays(query.start_date, query.end_date);
      const balances = await loadLeaveBalance(query.employee_id);
      const bal =
        balances.find((r) => {
          // match robustly by type key/label and by DB leave types
          const t = (r.type || r.label || "").toString().toLowerCase();
          const qType = (query.leave_type || "").toString().toLowerCase();
          if (!t || !qType) return false;
          if (t === qType) return true;
          // compare normalized leaveTypes loaded from /leave/types
          const matchByDb = (leaveTypes || []).some((lt) => {
            const ltKey = (lt.key || "").toString().toLowerCase();
            const ltLabel = (lt.label || "").toString().toLowerCase();
            return (
              ltKey === qType ||
              ltLabel === qType ||
              ltKey === t ||
              ltLabel === t
            );
          });
          if (matchByDb) return true;
          return t.includes(qType) || qType.includes(t);
        }) || null;

      const remaining =
        bal && bal.remaining !== undefined ? Number(bal.remaining) || 0 : 0;

      const deficit = Math.max(0, days - remaining);
      const EPS = 1e-6;

      const activePolicyForRequest = findActivePolicyForRequestDate(query);

      if (!activePolicyForRequest) {
        const simplePayload = {
          ...(upd || {}),
          status: "Approved",

          compensated_days: 0,
          compensatedDays: 0,
          compensated: 0,

          deducted_days: 0,
          deductedDays: 0,
          deducted: 0,

          loss_of_pay_days: Number(days),
          lopDays: Number(days),
          loss_of_pay: Number(days),

          preserved_leave_days: remaining > 0 ? Number(remaining) : null,
          preservedLeaveDays: remaining > 0 ? Number(remaining) : null,
          preserved: remaining > 0 ? Number(remaining) : null,

          total_days: Number(days),
          totalDays: Number(days),

          is_defaulted: true,
          isDefaulted: true,
        };

        const result = await doUpdate(leaveId, simplePayload, query);
        if (result && result.ok) {
          const msg = (result.body && result.body.message) || "Leave updated";
          showAlert(msg);
        } else {
          const msg =
            (result &&
              (result.message || (result.body && result.body.message))) ||
            "Failed to update leave";
          showAlert(msg);
        }
        return;
      }

      // ... same LopModal flows as before (approveDeficit, setAllCompensated, setAllDeducted, applyFlexibleSplit)
      // Reusing the implementation from your original file (kept unchanged)
      const approveDeficit = async () => {
        const preserved_leave_days = Number(remaining) || 0;
        const lopDaysVal = Number(days) || 0;

        const payload = {
          ...(upd || {}),
          status: "Approved",

          compensated_days: 0,
          compensatedDays: 0,
          compensated: 0,

          deducted_days: 0,
          deductedDays: 0,
          deducted: 0,

          loss_of_pay_days: lopDaysVal,
          lopDays: lopDaysVal,
          loss_of_pay: lopDaysVal,

          preserved_leave_days,
          preservedLeaveDays: preserved_leave_days,
          preserved: preserved_leave_days,

          total_days: Number(days),
          totalDays: Number(days),

          is_defaulted: false,
          isDefaulted: false,
        };

        const result = await doUpdate(leaveId, payload, query);

        if (result && result.ok) {
          const msg = (result.body && result.body.message) || "Leave updated";
          showAlert(msg);
        } else {
          const serverMsg =
            (result && result.message) ||
            (result && result.body && result.body.message) ||
            JSON.stringify(result && result.body) ||
            "Failed to approve as LoP — see alert.";
          console.warn("[approveDeficit] server failure:", serverMsg);
          setLopModal((m) => ({ ...m, error: serverMsg }));
        }
        return result;
      };

      const setAllCompensated = async () => {
        const compensated_days = Number(days) || 0;
        const preserved_leave_days = Number(remaining) || 0;

        const payload = {
          ...(upd || {}),
          status: "Approved",

          compensated_days: compensated_days,
          compensatedDays: compensated_days,
          compensated: compensated_days,

          deducted_days: 0,
          deductedDays: 0,
          deducted: 0,

          loss_of_pay_days: 0,
          lopDays: 0,
          loss_of_pay: 0,

          preserved_leave_days,
          preservedLeaveDays: preserved_leave_days,
          preserved: preserved_leave_days,

          total_days: Number(days),
          totalDays: Number(days),

          is_defaulted: false,
          isDefaulted: false,
        };

        const result = await doUpdate(leaveId, payload, query);

        if (result && result.ok) {
          const msg = (result.body && result.body.message) || "Leave updated";
          showAlert(msg);
        } else {
          const serverMsg =
            (result && result.message) ||
            (result && result.body && result.body.message) ||
            JSON.stringify(result && result.body) ||
            "Failed to set all compensated — see alert.";
          console.warn("[setAllCompensated] server failure:", serverMsg);
          setLopModal((m) => ({ ...m, error: serverMsg }));
        }
        return result;
      };

      const setAllDeducted = async () => {
        const daysNum = Number(days) || 0;
        const remainingNum = Number(remaining) || 0;
        const deducted_clamped = Math.min(daysNum, remainingNum);
        const lop_days = Math.max(0, daysNum - deducted_clamped);
        const preserved_leave_days = Math.max(
          0,
          remainingNum - deducted_clamped,
        );

        const payload = {
          ...(upd || {}),
          status: "Approved",

          compensated_days: 0,
          compensatedDays: 0,
          compensated: 0,

          deducted_days: deducted_clamped,
          deductedDays: deducted_clamped,
          deducted: deducted_clamped,

          loss_of_pay_days: lop_days,
          lopDays: lop_days,
          loss_of_pay: lop_days,

          preserved_leave_days,
          preservedLeaveDays: preserved_leave_days,
          preserved: preserved_leave_days,

          total_days: Number(days),
          totalDays: Number(days),

          is_defaulted: false,
          isDefaulted: false,
        };

        const result = await doUpdate(leaveId, payload, query);

        if (result && result.ok) {
          const msg = (result.body && result.body.message) || "Leave updated";
          showAlert(msg);
        } else {
          const serverMsg =
            (result && result.message) ||
            (result && result.body && result.body.message) ||
            JSON.stringify(result && result.body) ||
            "Failed to set all deducted — see alert.";
          console.warn("[setAllDeducted] server failure:", serverMsg);
          setLopModal((m) => ({ ...m, error: serverMsg }));
        }
        return result;
      };

      const applyFlexibleSplit = async (
        compensatedDays,
        deductedDays,
        lopDays,
      ) => {
        const c = Number(compensatedDays) || 0;
        const d = Number(deductedDays) || 0;
        const l = Number(lopDays) || 0;

        if (Math.abs(c + d + l - days) > EPS) {
          const msg = `Split values must add up to total requested days (${days}). Received: compensated=${c}, deducted=${d}, loss_of_pay=${l}.`;
          setLopModal((m) => ({ ...m, error: msg }));
          console.warn("[applyFlexibleSplit] validation failed", {
            days,
            c,
            d,
            l,
          });
          return { ok: false, message: "validation_failed", body: msg };
        }

        const deducted_clamped = Math.min(Number(remaining) || 0, d);
        if (deducted_clamped + EPS < d) {
          const msg = `Deducted days (${d}) exceed remaining (${remaining}). Please adjust.`;
          setLopModal((m) => ({ ...m, error: msg }));
          console.warn("[applyFlexibleSplit] deducted > remaining", {
            d,
            remaining,
          });
          return {
            ok: false,
            message: "deducted_exceeds_remaining",
            body: msg,
          };
        }

        let preserved_leave_days = Math.max(
          0,
          Number(remaining) - Number(deducted_clamped),
        );
        preserved_leave_days = Number(preserved_leave_days.toFixed(2));

        const payload = {
          ...(upd || {}),
          status: "Approved",

          compensated_days: Number(c.toFixed(2)),
          compensatedDays: Number(c.toFixed(2)),
          compensated: Number(c.toFixed(2)),

          deducted_days: Number(deducted_clamped.toFixed(2)),
          deductedDays: Number(deducted_clamped.toFixed(2)),
          deducted: Number(deducted_clamped.toFixed(2)),

          loss_of_pay_days: Number(l.toFixed(2)),
          lopDays: Number(l.toFixed(2)),
          loss_of_pay: Number(l.toFixed(2)),

          preserved_leave_days: preserved_leave_days,
          preservedLeaveDays: preserved_leave_days,
          preserved: preserved_leave_days,

          total_days: Number(days),
          totalDays: Number(days),

          is_defaulted: false,
          isDefaulted: false,
        };

        const result = await doUpdate(leaveId, payload, query);

        if (result && result.ok) {
          const msg = (result.body && result.body.message) || "Leave updated";
          showAlert(msg);
        } else if (
          result &&
          result.status &&
          result.status >= 200 &&
          result.status < 300
        ) {
          console.warn(
            "[applyFlexibleSplit] fallback: treating 2xx as success",
            result,
          );
          const msg = (result.body && result.body.message) || "Leave updated";
          showAlert(msg);
        } else {
          const serverMsg =
            (result && result.message) ||
            (result && result.body && result.body.message) ||
            JSON.stringify(result && result.body) ||
            "Failed to apply split — see alert.";
          console.warn("[applyFlexibleSplit] server failure:", serverMsg);
          setLopModal((m) => ({ ...m, error: serverMsg }));
        }

        return result;
      };

      setLopModal({
        isVisible: true,
        leaveId,
        deficit: Number(deficit),
        days: Number(days),
        remaining: Number(remaining),
        message: `Employee requested ${days} day(s); remaining balance = ${remaining}. Deficit = ${deficit}. Choose how to allocate the ${days} requested days:`,
        compensatedDays: 0,
        deductedDays: Math.min(Number(remaining), Number(days)),
        lopDays: Math.max(
          0,
          Number(days) - Math.min(Number(remaining), Number(days)),
        ),
        approveDeficit,
        setAllCompensated,
        setAllDeducted,
        applyFlexibleSplit,
        error: "",
      });
      return;
    }

    const result = await doUpdate(leaveId, upd);
    if (result && result.ok) {
      const msg = (result.body && result.body.message) || "Leave updated";
      showAlert(msg);
    }
  };

  const handleStatusChange = (leaveId, key, value) => {
    setStatusUpdates((prev) => ({
      ...prev,
      [leaveId]: { ...prev[leaveId], [key]: value },
    }));
  };

  // -------------------------
  // Attachment helpers
  // -------------------------
  const buildFileUrl = (filePath) => {
    if (!filePath) return "";
    if (/^https?:\/\//i.test(filePath)) return filePath;
    if (API_BASE) {
      const prefix = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
      return `${prefix}/${filePath.replace(/^\//, "")}`;
    }
    return filePath;
  };

  const extractAttachments = (query) => {
    if (!query) return [];

    const candidates = [
      query.attachments,
      query.leave_attachments,
      query.files,
      query.attachments_list,
      query.files_list,
      query.attachment_list,
      query.attachmentsData,
      query.data && query.data.attachments,
      query.data,
      query.payload,
    ];

    for (let cand of candidates) {
      if (!cand) continue;

      if (Array.isArray(cand) && cand.length > 0) return cand;

      if (typeof cand === "object" && cand !== null) {
        if (Array.isArray(cand.data) && cand.data.length > 0) return cand.data;
        if (Array.isArray(cand.attachments) && cand.attachments.length > 0)
          return cand.attachments;
        if (Array.isArray(cand.rows) && cand.rows.length > 0) return cand.rows;
        if (Array.isArray(cand.list) && cand.list.length > 0) return cand.list;
      }

      if (typeof cand === "string") {
        try {
          const parsed = JSON.parse(cand);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0)
            return parsed.data;
        } catch (e) {}
      }
    }

    const possibleSingle =
      query.file_name ||
      query.file_path ||
      query.file_url ||
      query.fileUrl ||
      query.filename;
    if (possibleSingle) {
      return [
        {
          id: query.id || null,
          file_name:
            query.file_name ||
            query.filename ||
            query.name ||
            `attachment-${query.id || "1"}`,
          file_path: query.file_path || query.file_url || query.url || null,
          mime_type: query.mime_type || query.type || "",
          size: query.size || null,
          created_at: query.created_at || null,
        },
      ];
    }

    return [];
  };

  const normalizeAttachment = (raw) => {
    if (!raw) return null;
    if (typeof raw === "string") {
      return {
        id: null,
        file_name: raw.split("/").pop(),
        file_path: raw,
        mime_type: "",
        size: null,
        created_at: null,
        url: raw,
      };
    }

    return {
      id:
        raw.id || raw.file_id || raw.attachment_id || raw.attachmentId || null,
      file_name:
        raw.file_name ||
        raw.filename ||
        raw.name ||
        raw.fileName ||
        (raw.file_path ? String(raw.file_path).split("/").pop() : "attachment"),
      file_path:
        raw.file_path ||
        raw.path ||
        raw.url ||
        raw.file_url ||
        raw.filePath ||
        null,
      mime_type: raw.mime_type || raw.type || raw.contentType || "",
      size: raw.size || raw.file_size || raw.length || null,
      created_at: raw.created_at || raw.createdAt || raw.uploaded_at || null,
      // keep any direct url the server provided
      url: raw.url || raw.file_url || null,
    };
  };

  const normalizeList = (rawList) => {
    if (!Array.isArray(rawList)) return [];
    return rawList.map((r) => normalizeAttachment(r)).filter(Boolean);
  };

  const getNormalizedPreviewList = (query) => {
    const raw = extractAttachments(query);
    return normalizeList(raw);
  };

  const openAttachments = async (query, providedAttachments = null) => {
    if (!query) return;
    const lid = String(query.leave_id || query.id || query.leaveId || "");

    // priority: providedAttachments -> cache -> extract from query -> fetch endpoints
    let normalized =
      Array.isArray(providedAttachments) && providedAttachments.length > 0
        ? normalizeList(providedAttachments)
        : [];

    if ((!normalized || normalized.length === 0) && attachmentsMap[lid]) {
      normalized = attachmentsMap[lid];
    }

    if (!normalized || normalized.length === 0) {
      const raw = extractAttachments(query);
      if (Array.isArray(raw) && raw.length > 0) {
        normalized = normalizeList(raw);
      }
    }

    if (!normalized || normalized.length === 0) {
      const candidates = [
        `${API_BASE}/admin/leave/${query.leave_id}/attachments`,
        `${API_BASE}/leave/${query.leave_id}/attachments`,
        `${API_BASE}/api/leave/${query.leave_id}/attachments`,
        `${API_BASE}/api/admin/leave/${query.leave_id}/attachments`,
        `${API_BASE}/employee/leave/${query.leave_id}/attachments`,
        `${API_BASE}/api/employee/leave/${query.leave_id}/attachments`,
      ].filter(Boolean);

      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            credentials: "include",
            headers: buildHeaders(),
          });
          if (!res.ok) continue;
          const json = await res.json().catch(() => null);
          const raw = json?.data || json?.attachments || json || [];
          if (Array.isArray(raw) && raw.length > 0) {
            normalized = normalizeList(raw);
            break;
          }
        } catch (err) {
          // ignore
        }
      }
    }

    if (!normalized || normalized.length === 0) {
      showAlert("No attachments found for this leave request.");
      setAttachmentsModal({
        isVisible: true,
        title: `Attachments — ${query.name || query.employee_id || query.leave_id}`,
        files: [],
      });
      return;
    }

    setAttachmentsMap((prev) => ({ ...prev, [lid]: normalized }));
    setAttachmentsModal({
      isVisible: true,
      title: `Attachments — ${query.name || query.employee_id || query.leave_id}`,
      files: normalized,
    });
  };

  const closeAttachments = () => {
    setAttachmentsModal({ isVisible: false, title: "", files: [] });
  };
  const openFileInNewTab = async (file) => {
    if (!file) return;

    const attachmentId = file.id || file.attachment_id || null;
    let url = "";
    if (attachmentId) {
      const base = API_BASE.replace(/\/$/, "");
      url = `${base}/attachments/${encodeURIComponent(attachmentId)}`;
    } else {
      url = file.url || file.file_url || file.file_path || "";
      if (!/^https?:\/\//i.test(url) && API_BASE) {
        url = `${API_BASE.replace(/\/$/, "")}/${String(url).replace(/^\//, "")}`;
      }
    }

    if (!url) {
      showAlert("No URL available for this file.");
      return;
    }

    try {
      // fetch the file using tenant/employee headers
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: buildHeaders(),
      });

      if (!res.ok) {
        let json = null;
        try {
          json = await res.json();
        } catch (e) {}
        const serverMsg =
          (json && (json.message || json.error)) ||
          `Failed to fetch file (HTTP ${res.status})`;
        showAlert(serverMsg);
        return;
      }

      // get blob and determine MIME
      const arrayBuffer = await res.arrayBuffer();
      const serverContentType = res.headers.get("Content-Type") || "";
      const knownMime = file.mime_type || file.mime || serverContentType || "";
      // if we have a known mime (pdf,image), use it — browsers will render PDFs/images inline
      const mime = knownMime || "application/octet-stream";

      // create a blob using the chosen mime (helps force inline rendering)
      const blob = new Blob([arrayBuffer], { type: mime });
      const objectUrl = URL.createObjectURL(blob);

      // Use anchor to open in new tab (more reliable for blob URLs)
      const a = document.createElement("a");
      a.href = objectUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      // do NOT set a.download — that forces a download
      document.body.appendChild(a);
      a.click();
      a.remove();

      // revoke after some time (give user time to view)
      setTimeout(
        () => {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch (e) {}
        },
        2 * 60 * 1000,
      ); // 2 minutes
    } catch (err) {
      console.error("[openFileInNewTab] error:", err);
      showAlert(
        "Could not open file. Network error or server refused access. Check console.",
      );
    }
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="admin-container">
      <div className="policy-header">
        <h2>Leave Queries</h2>
        <button
          className="manage-button"
          onClick={() => setShowPolicyModal(true)}
        >
          Manage Leave Policies
        </button>
      </div>

      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        onSaved={() => {
          fetchPolicies();
          fetchLeaveQueries();
          setShowPolicyModal(false);
        }}
        existingPolicies={policies}
        openPolicyId={openPolicyId}
      />

      <Modal
        isVisible={showPolicyAlertsModal}
        onClose={() => setShowPolicyAlertsModal(false)}
        buttons={[
          { label: "Ignore & Auto-extend", onClick: handleIgnorePolicyAlerts },
          {
            label: "View Policy",
            onClick: () => {
              setShowPolicyModal(true);
              setShowPolicyAlertsModal(false);
            },
          },
        ]}
      >
        <div className="policy-alerts-modal-content">
          <h4>Policy End Alerts</h4>
          {policyAlerts.length === 0 && <p>No policy alerts.</p>}
          {policyAlerts.map((a) => (
            <div
              key={a.id}
              className={`policy-alert-item ${a.severity === "critical" ? "alert-critical" : "alert-warning"}`}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {a.severity === "critical"
                      ? "Policy ending soon — ACTION REQUIRED"
                      : "Policy ending soon"}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    Period:{" "}
                    <strong>
                      {new Date(a.policy.year_start).toLocaleDateString()} —{" "}
                      {new Date(a.policy.year_end).toLocaleDateString()}
                    </strong>{" "}
                    •{" "}
                    <span style={{ fontWeight: 700 }}>
                      {a.daysLeft} day{a.daysLeft !== 1 ? "s" : ""} left
                    </span>
                  </div>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowPolicyModal(true);
                      setShowPolicyAlertsModal(false);
                    }}
                    className="alert-btn view-btn"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <div className="filters">
        <div className="status-filter">
          <label>Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <div className="search-bar">
          <label>Search by</label>
          <input
            type="text"
            placeholder="Name, Emp ID, Reason"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="date-filter">
          <label>From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <label>To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button className="search-button" onClick={fetchLeaveQueries}>
          <IoSearch /> Search
        </button>
      </div>

      <div>
        <div className="leave-table-container">
          <table className="leave-table">
            <thead>
              <tr>
                <th>Emp Name</th>
                <th>Emp ID</th>
                <th>Leave Type</th>
                <th>Half/Full Day</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Days</th>
                <th>Status</th>
                <th>Comments</th>
                <th>Attachment</th> {/* <-- new column */}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaveQueries
                .slice()
                .sort((a, b) => (b.leave_id || 0) - (a.leave_id || 0))
                .map((query) => {
                  const update = statusUpdates[query.leave_id] || {};
                  const currentStatus = update.status || query.status || "";
                  const statusClass =
                    currentStatus === "Approved"
                      ? "status-approved"
                      : currentStatus === "Rejected"
                        ? "status-rejected"
                        : "";
                  const isAlreadyUpdated =
                    query.status !== "pending" && query.status !== "Pending";
                  const isUpdating =
                    statusUpdates[query.leave_id]?.status &&
                    statusUpdates[query.leave_id]?.status !== query.status;

                  // attachments quick preview (robust)
                  const previewList = getNormalizedPreviewList(query);

                  // Primary change: show View button if either attachments are embedded
                  // OR we have a leave_id (server may hold attachments separately).
                  // This matches SelfTable behavior: let user try to fetch even if row doesn't include attachments.
                  const hasEmbeddedAttachments =
                    previewList && previewList.length > 0;
                  const hasPossibleServerAttachments = Boolean(query.leave_id);

                  const hasAttachments =
                    hasEmbeddedAttachments || hasPossibleServerAttachments;

                  let attachmentCell = null;
                  if (hasAttachments) {
                    const count = hasEmbeddedAttachments
                      ? previewList.length
                      : query.attachment_count || query.attachments_count || "";
                    attachmentCell = (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          className="attachments-btn"
                          onClick={() =>
                            // if we have embedded previewList, pass it so we avoid an extra fetch;
                            // otherwise openAttachments will probe server endpoints.
                            openAttachments(
                              query,
                              hasEmbeddedAttachments ? previewList : null,
                            )
                          }
                          title="View attachments"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 10px",
                            cursor: "pointer",
                          }}
                        >
                          <MdOutlineRemoveRedEye className="eye-icon" />
                          <span>View {count ? `(${count})` : ""}</span>
                        </button>
                      </div>
                    );
                  } else {
                    attachmentCell = (
                      <div className="no-attachments">Not Attached</div>
                    );
                  }
                  // --------------------------------------------------------

                  return (
                    <tr
                      key={query.leave_id}
                      className={isAlreadyUpdated ? "row-updated" : ""}
                    >
                      <td>{query.name}</td>
                      <td>{query.employee_id}</td>
                      <td>{query.leave_type}</td>
                      <td>{query.H_F_day}</td>
                      <td>{formatDate(query.start_date)}</td>
                      <td>{formatDate(query.end_date)}</td>
                      <td className="comments-col">
                        <div className="comment-preview">{query.reason}</div>
                      </td>
                      <td>{calculateDays(query.start_date, query.end_date)}</td>
                      <td>
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            handleStatusChange(
                              query.leave_id,
                              "status",
                              e.target.value,
                            )
                          }
                          className={`status-dropdown ${statusClass}`}
                          disabled={isAlreadyUpdated}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="comments-col">
                        <div className="comment-preview">
                          {query.comments ? (
                            <span>{query.comments}</span>
                          ) : (
                            <input
                              type="text"
                              placeholder="Enter Reason"
                              value={update.comments || ""}
                              onChange={(e) =>
                                handleStatusChange(
                                  query.leave_id,
                                  "comments",
                                  e.target.value,
                                )
                              }
                              className="comments-input"
                              disabled={isAlreadyUpdated}
                            />
                          )}
                        </div>
                      </td>

                      {/* Attachment cell */}
                      <td>{attachmentCell}</td>

                      <td>
                        <button
                          className={`update-button ${isAlreadyUpdated ? "disabled-button" : ""}`}
                          onClick={() => handleUpdate(query.leave_id, query)}
                          disabled={
                            isAlreadyUpdated ||
                            !isUpdating ||
                            (currentStatus === "Rejected" && !update.comments)
                          }
                        >
                          {isAlreadyUpdated ? "Updated" : "Update"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <CompensationPopup lopModal={lopModal} setLopModal={setLopModal} />

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>

      {/* Attachments modal — shows file names; clicking name opens file in new tab */}
      <Modal
        isVisible={attachmentsModal.isVisible}
        onClose={closeAttachments}
        buttons={[{ label: "Close", onClick: closeAttachments }]}
      >
        <div className="attachments-modal-content">
          <h4>{attachmentsModal.title}</h4>

          {attachmentsModal.files.length === 0 && <p>No attachments found.</p>}

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {attachmentsModal.files.map((f, idx) => {
              // compute a usable URL (but we won't fetch blobs here; open in new tab)
              const urlCandidate =
                f.url || f.file_path || f.file_url || f.url || "";
              const safeName = f.file_name || `attachment-${idx + 1}`;
              const sizeLabel = f.size ? ` • ${f.size} bytes` : "";
              return (
                <li
                  key={f.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 6px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <MdOutlineAttachFile />
                    <button
                      type="button"
                      onClick={() => openFileInNewTab(f)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        textDecoration: "underline",
                        color: "#0070f3",
                        cursor: "pointer",
                        fontSize: 14,
                        textAlign: "left",
                      }}
                    >
                      {safeName}
                    </button>
                    <span
                      style={{ color: "#666", marginLeft: 8, fontSize: 12 }}
                    >
                      {f.mime_type ? `(${f.mime_type})` : null}
                    </span>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    {urlCandidate ? (
                      <button
                        type="button"
                        onClick={() => openFileInNewTab(f)}
                        className="attachment-link-button"
                        style={{
                          background: "transparent",
                          border: "1px solid #ddd",
                          padding: "4px 8px",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Open
                      </button>
                    ) : (
                      <span style={{ color: "#999", fontSize: 12 }}>
                        No URL
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Modal>
    </div>
  );
}
