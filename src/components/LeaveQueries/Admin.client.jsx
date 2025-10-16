"use client";

import React, { useState, useEffect, useCallback } from "react";
import "./Admin.css";
import PolicyModal from "./PolicyModal.client";
import Modal from "../Modal/Modal.client";
import CompensationPopup from "./CompensationPopup.client";
import { IoSearch } from "react-icons/io5";
import { useAuth } from "../../context/AuthProvider.client";

const formatDate = (isoDate) => {
  if (!isoDate) return "";
  return new Date(isoDate).toISOString().split("T")[0];
};

const parseDateOnly = (isoDate) => {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) {
    const parts = isoDate.split("-");
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

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Admin({ openPolicyId = null }) {
  const { user } = useAuth();

  const [leaveQueries, setLeaveQueries] = useState([]);
  const [policies, setPolicies] = useState([]);
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

  const fetchPolicies = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/leave-policies`;
      console.log("[fetchPolicies] GET", url);
      const res = await fetch(url, { headers: buildHeaders() });
      const json = await res.json().catch(() => null);
      console.log("[fetchPolicies] response:", res.status, json);
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
    console.log(
      "[Admin] Initial/follow-up load: statusFilter, fromDate, toDate, search, user",
      { statusFilter, fromDate, toDate, search, user }
    );
    fetchPolicies();
    fetchLeaveQueries();
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
      const url = `${API_BASE}/admin/leave${params ? `?${params}` : ""}`;
      console.log("[fetchLeaveQueries] GET", url);
      const res = await fetch(url, { headers: buildHeaders() });
      let json = null;
      try {
        json = await res.json();
      } catch (e) {
        console.error("[fetchLeaveQueries] JSON parse error", e);
        const text = await res.text();
        console.log("[fetchLeaveQueries] raw response text:", text);
        showAlert("Failed to parse server response for leave queries.");
        return;
      }
      console.log("[fetchLeaveQueries] response:", res.status, json);
      if (json && (json.success || json.status === "success")) {
        setLeaveQueries(json.data || json.leave_queries || json.message || []);
        setStatusUpdates({});
      } else {
        showAlert(json.message || "Failed to fetch leave queries");
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

  const loadLeaveBalance = async (employeeId) => {
    if (leaveBalances[employeeId]) {
      console.log(
        "[loadLeaveBalance] cached for",
        employeeId,
        leaveBalances[employeeId]
      );
      return leaveBalances[employeeId];
    }
    try {
      const url = `${API_BASE}/api/leave-policies/employee/${employeeId}/leave-balance`;
      console.log("[loadLeaveBalance] GET", url);
      const res = await fetch(url, { headers: buildHeaders() });
      let json = null;
      try {
        json = await res.json();
      } catch (e) {
        console.error("[loadLeaveBalance] JSON parse error", e);
        const text = await res.text();
        console.log("[loadLeaveBalance] raw response text:", text);
        setLeaveBalances((b) => ({ ...b, [employeeId]: [] }));
        return [];
      }
      console.log("[loadLeaveBalance] response:", res.status, json);
      const data = json.data || [];
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
      console.log("[doUpdate] Sending PUT", url, "payload:", fullPayload);

      const res = await fetch(url, {
        method: "PUT",
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

      console.log(
        "[doUpdate] Response status:",
        res.status,
        "json:",
        json,
        "text:",
        text
      );

      if (!res.ok) {
        const serverMsg =
          (json && (json.message || (json.error && json.error.message))) ||
          text ||
          `Server returned ${res.status}`;
        console.warn("[doUpdate] Server error:", serverMsg);
        showAlert(serverMsg);
        return { ok: false, status: res.status, body: json || text };
      }

      if (json && json.success) {
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
        "Error updating leave (network or client error). Check console."
      );
      return { ok: false, error: err };
    }
  };

  /**
   * Helper: findActivePolicyForRequestDate
   */
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
    console.log(
      "[handleUpdate] invoked for leaveId:",
      leaveId,
      "upd:",
      upd,
      "query:",
      query
    );
    if (upd.status === "Approved") {
      const days = calculateDays(query.start_date, query.end_date);
      const balances = await loadLeaveBalance(query.employee_id);
      const bal = balances.find((r) => r.type === query.leave_type);
      const remaining =
        bal && bal.remaining !== undefined ? Number(bal.remaining) || 0 : 0;

      console.log("[handleUpdate] days, remaining:", { days, remaining });

      const deficit = Math.max(0, days - remaining);
      const EPS = 1e-6;

      const activePolicyForRequest = findActivePolicyForRequestDate(query);

      if (!activePolicyForRequest) {
        // No active policy: perform a simple approve WITHOUT opening the compensation popup.
        // Default behaviour here: treat the full requested days as Loss-of-Pay (LoP).
        // Set is_defaulted = true so backend knows this was a system/default approval path.
        const simplePayload = {
          ...(upd || {}),
          status: "Approved",

          // default splits
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

          // mark this action as defaulted (server will set is_defaulted column)
          is_defaulted: true,
          isDefaulted: true,
        };

        console.log(
          "[handleUpdate] No active policy found for request — performing simple approve (default to LoP)",
          { leaveId, simplePayload }
        );

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

      // If there IS an active policy -> show compensation popup as before
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

          // manual admin approval under active policy
          is_defaulted: false,
          isDefaulted: false,
        };

        console.log("[approveDeficit] payload:", payload);

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

          // manual admin action under active policy
          is_defaulted: false,
          isDefaulted: false,
        };

        console.log("[setAllCompensated] payload:", payload);

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
          remainingNum - deducted_clamped
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

          // manual admin action under active policy
          is_defaulted: false,
          isDefaulted: false,
        };

        console.log("[setAllDeducted] payload:", payload);

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
        lopDays
      ) => {
        console.log("[applyFlexibleSplit] called", {
          leaveId,
          compensatedDays,
          deductedDays,
          lopDays,
          days,
          remaining,
        });

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
          Number(remaining) - Number(deducted_clamped)
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

          // manual admin action under active policy
          is_defaulted: false,
          isDefaulted: false,
        };

        console.log("[applyFlexibleSplit] payload:", payload);

        const result = await doUpdate(leaveId, payload, query);

        console.log("[applyFlexibleSplit] doUpdate result:", result);

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
            result
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

      // OPEN THE POPUP
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
          Number(days) - Math.min(Number(remaining), Number(days))
        ),
        approveDeficit,
        setAllCompensated,
        setAllDeducted,
        applyFlexibleSplit,
        error: "",
      });
      return;
    }

    // Not Approved (or simple non-split action) — send simple status update (reject/approve without splits)
    console.log("[handleUpdate] sending simple update", {
      leaveId,
      payload: upd,
    });
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

      {/* Policy Alerts Modal */}
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
              className={`policy-alert-item ${
                a.severity === "critical" ? "alert-critical" : "alert-warning"
              }`}
              style={{
                padding: "10px",
                borderRadius: 6,
                marginBottom: 8,
                background: a.severity === "critical" ? "#fff1f0" : "#fff8e6",
                borderLeft:
                  a.severity === "critical"
                    ? "4px solid #e74c3c"
                    : "4px solid #ffb020",
              }}
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
                    </strong>
                    {" • "}
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

      {/* Filters Section */}
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaveQueries
                .slice()
                .sort((a, b) => (b.leave_id || 0) - (a.leave_id || 0))
                .map((query) => {
                  const update = statusUpdates[query.leave_id] || {};
                  // prefer the update.status if present, otherwise use the server value
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
                              e.target.value
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
                                  e.target.value
                                )
                              }
                              className="comments-input"
                              disabled={isAlreadyUpdated}
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          className={`update-button ${
                            isAlreadyUpdated ? "disabled-button" : ""
                          }`}
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

      {/* Compensation popup (rendered BEFORE alert) */}
      <CompensationPopup lopModal={lopModal} setLopModal={setLopModal} />

      {/* Alert Modal (rendered after popup to avoid stacking surprises) */}
      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
}
