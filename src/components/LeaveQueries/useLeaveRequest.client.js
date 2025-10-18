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
  const { user } = useAuth(); // user object from your AuthProvider
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

  // ----- UI state -----
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

  const [balances, setBalances] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [activePolicy, setActivePolicy] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState({ self: [], team: [] });

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

  // ----- Alert/Confirm helpers -----
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

  // ----- status updates (for team approvals) -----
  const [statusUpdates, setStatusUpdates] = useState({});

  /**
   * handleStatusChange: update local statusUpdates state immediately.
   * Called by TeamTable when user changes dropdown or comments.
   */
  const handleStatusChange = (leaveId, field, value) => {
    setStatusUpdates((prev) => ({
      ...prev,
      [leaveId]: { ...(prev[leaveId] || {}), [field]: value },
    }));
  };

  /**
   * handleUpdate: call backend to commit status change for a leave request.
   * - leaveId: id of leave request
   * - payload: optional, object of { status, comments } (fall back to statusUpdates[leaveId])
   *
   * NOTE: replace the endpoint URL below if your API differs.
   */
  // Replace existing handleUpdate with this implementation
  const handleUpdate = async (leaveId, payload = null) => {
    // prefer explicit payload param, otherwise the local statusUpdates entry
    const update = payload || statusUpdates[leaveId] || {};
    // pull basic fields
    const status = update.status || "";
    const comments = update.comments || "";

    if (!leaveId) return;
    if (!status) {
      showAlert("Please select a status before updating.");
      return;
    }
    if (String(status).toLowerCase() === "rejected" && !comments) {
      showAlert("Please enter comments when rejecting a request.");
      return;
    }

    // optimistic UI update: mark request as updated locally so table responds immediately
    setLeaveRequests((prev) => {
      const nextTeam = (prev.team || []).map((r) =>
        String(r.leave_id || r.id) === String(leaveId)
          ? { ...r, status, comments: comments || r.comments }
          : r
      );
      return { ...prev, team: nextTeam };
    });

    // clear the local status update (we'll re-fetch or handle result below)
    setStatusUpdates((prev) => {
      const clone = { ...prev };
      delete clone[leaveId];
      return clone;
    });

    // ----- normalize any split fields that might be in payload -----
    const normalizeBoolean = (v) => {
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

    const pickNumber = (...vals) => {
      for (const v of vals) {
        if (v === null || v === undefined) continue;
        const n = Number(v);
        if (!isNaN(n)) return n;
      }
      return 0;
    };

    // collect split fields from many possible keys (frontend might use snake/camel)
    const compensated =
      pickNumber(
        update.compensated_days,
        update.compensatedDays,
        update.compensated,
        0
      ) || 0;
    const deducted =
      pickNumber(
        update.deducted_days,
        update.deductedDays,
        update.deducted,
        0
      ) || 0;
    const lop =
      pickNumber(
        update.loss_of_pay_days,
        update.lopDays,
        update.loss_of_pay,
        0
      ) || 0;
    // preserved may be intentionally null
    const preservedRaw =
      update.preserved_leave_days ??
      update.preservedLeaveDays ??
      update.preserved ??
      null;
    const preserved =
      preservedRaw === null || preservedRaw === undefined
        ? null
        : Number(preservedRaw);

    // total_days: prefer explicit payload, otherwise compute from local leaveRequests entry
    let totalDays = pickNumber(
      update.total_days,
      update.totalDays,
      update.totalDaysRequested
    );

    if (!totalDays) {
      // try to compute from cached leaveRequests (fall back)
      const row =
        (leaveRequests.team || []).find(
          (r) => String(r.leave_id || r.id) === String(leaveId)
        ) || null;
      if (row) {
        try {
          // use your util calculateDays (imported)
          totalDays = calculateDays(row.start_date, row.end_date, row.H_F_day);
        } catch {
          totalDays = 0;
        }
      }
    }

    // is_defaulted boolean (accept both keys)
    const isDefaultedFlag = normalizeBoolean(
      update.is_defaulted ?? update.isDefaulted ?? false
    );

    // Build final body to send to server (include both snake_case & camelCase where helpful)
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

      // send boolean flag (backend accepts it)
      is_defaulted: Boolean(isDefaultedFlag),
      isDefaulted: Boolean(isDefaultedFlag),

      // actor / approver id: set caller approverId (backend expects actorId optionally)
      actorId: employeeId,
      approverId: employeeId,
    };

    try {
      const url = `${BACKEND}/admin/leave/${leaveId}`;
      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // backend failed — show message and rollback by refetching list
        let json = null;
        try {
          json = await res.json();
        } catch (e) {}
        showAlert(json?.message || "Failed to update leave status.");
        await fetchLeaveRequests();
        return;
      }

      // success — refresh list & balances
      showAlert("Leave status updated.");
      await fetchLeaveRequests();
      await fetchLeaveBalance();
    } catch (err) {
      console.error("handleUpdate error:", err);
      showAlert("Failed to update leave (network error).");
      // rollback by re-fetching
      await fetchLeaveRequests();
    }
  };

  // ----- Fetchers -----
  const fetchLeaveBalance = async () => {
    if (!employeeId) return;
    try {
      const res = await fetch(
        `${BACKEND}/api/leave-policies/employee/${employeeId}/leave-balance`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed to load leave balance");
      const json = await res.json();
      setBalances(json.data || []);
    } catch (err) {
      console.error("fetchLeaveBalance:", err);
      showAlert("Could not fetch leave balance.");
      setBalances([]);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/leave-policies`, { headers });
      const json = await res.json();
      setPolicies(json.data || []);
    } catch (err) {
      console.error("fetchPolicies:", err);
      setPolicies([]);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchLeaveBalance();
  }, []);

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
        null
    );
  }, [policies]);

  // ----- Leave Requests -----
  useEffect(() => {
    if (employeeId) fetchLeaveRequests();
  }, [employeeId, teamSearch, teamStatus, filters.from_date, filters.to_date]);

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

      // Self leaves
      const selfUrl = `${BACKEND}/employee/leave/${employeeId}`;
      const selfParams = new URLSearchParams();
      if (filters.from_date) selfParams.append("from_date", filters.from_date);
      if (filters.to_date) selfParams.append("to_date", filters.to_date);
      const selfFinalUrl = selfParams.toString()
        ? `${selfUrl}?${selfParams}`
        : selfUrl;

      const selfResponse = await fetch(selfFinalUrl, { headers });
      let selfRequests = [];
      if (selfResponse.ok) {
        const selfResult = await selfResponse.json();
        selfRequests =
          selfResult?.data ||
          selfResult?.message?.data ||
          extractArrayFromTeamResult(selfResult);
      }

      // Team leaves
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

        const teamResponse = await fetch(teamFinalUrl, { headers });
        if (teamResponse.ok) {
          const teamResult = await teamResponse.json();
          teamRequests = extractArrayFromTeamResult(
            teamResult?.data ?? teamResult ?? teamResult?.message ?? {}
          );
        } else {
          console.warn("Team fetch returned non-ok", teamResponse.status);
        }
      }

      setLeaveRequests({ self: selfRequests, team: teamRequests });
    } catch (err) {
      console.error("fetchLeaveRequests error:", err);
      setLeaveRequests({ self: [], team: [] });
    }
  };

  const loadLeaveBalance = async (employeeIdToLoad) => {
    if (!employeeIdToLoad) return [];
    if (leaveBalancesCache[employeeIdToLoad])
      return leaveBalancesCache[employeeIdToLoad];

    try {
      const url = `${BACKEND}/api/leave-policies/employee/${employeeIdToLoad}/leave-balance`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const arr = json.data || [];
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
        (b) => String(b.type).toLowerCase() === String(type).toLowerCase()
      ) || null
    );
  };

  // ----- Form & UI Actions -----
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
            { method: "DELETE", headers }
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
      }
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

    const selectedType = String(formData.leavetype || "").toLowerCase();
    let setting = null;
    if (activePolicy && Array.isArray(activePolicy.leave_settings)) {
      setting = activePolicy.leave_settings.find(
        (s) => String(s.type || "").toLowerCase() === selectedType
      );
    }
    if (!setting) {
      setting = defaultLeaveSettings.find(
        (s) => String(s.type || "").toLowerCase() === selectedType
      );
    }
    if (!setting) {
      showAlert("Selected leave type is not available.");
      return;
    }

    const noticeDays = getAdvanceNoticeDays(setting);
    if (!editingId && noticeDays > 0) {
      const today = new Date();
      const minDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      minDate.setDate(minDate.getDate() + noticeDays);
      const chosenStartRaw = new Date(formData.startDate);
      const chosenStart = new Date(
        chosenStartRaw.getFullYear(),
        chosenStartRaw.getMonth(),
        chosenStartRaw.getDate()
      );
      if (chosenStart < minDate) {
        showAlert(
          !activePolicy
            ? `By default, a ${setting.type} request requires at least ${noticeDays} day(s) advance. You must apply at least ${noticeDays} day(s) before the start date.`
            : `You must apply for ${formData.leavetype} at least ${noticeDays} day(s) before the start date.`
        );
        return;
      }
    }

    const requestedDays = computeRequestedDays(
      formData.startDate,
      formData.endDate,
      formData.h_f_day
    );
    const balanceRow = getBalanceForType(setting.type);
    let allowance = 0,
      used = 0,
      remaining = 0,
      carry_forward = Number(setting.carry_forward || 0);
    if (balanceRow) {
      allowance = Number(
        balanceRow.allowance ??
          balanceRow.earned ??
          balanceRow.annual_allowance ??
          0
      );
      used = Number(balanceRow.used ?? 0);
      remaining = Number(balanceRow.remaining ?? 0);
      carry_forward = Number(balanceRow.carry_forward ?? carry_forward);
    } else {
      if (String(setting.type).toLowerCase() === "earned")
        allowance = Number(setting.earned_leaves || 0) + carry_forward;
      else allowance = Number(setting.value || 0) + carry_forward;
      used = 0;
      remaining = allowance - used;
    }

    const requestData = { employeeId, name: employeeName, ...formData };
    const url = editingId
      ? `${BACKEND}/edit/${editingId}`
      : `${BACKEND}/employee/leave`;
    const method = editingId ? "PUT" : "POST";

    const doSubmit = async (data, submitUrl, submitMethod) => {
      try {
        const response = await fetch(submitUrl, {
          method: submitMethod,
          headers,
          body: JSON.stringify(data),
        });
        const responseData = await response.json();
        if (response.ok) {
          showAlert(
            editingId
              ? "Leave request updated successfully!"
              : "Leave request submitted successfully!"
          );
          setFormVisible(false);
          setEditingId(null);
          resetForm();
          fetchLeaveRequests();
          fetchLeaveBalance();
        } else {
          showAlert(responseData.message || "Failed to submit leave request.");
        }
      } catch (err) {
        console.error("Error submitting leave request:", err);
        showAlert("An error occurred while submitting the leave request.");
      }
    };

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

  return {
    // states
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

    // mappings
    defaultLeaveSettings,
    canViewTeam,

    // actions
    openForm,
    closeForm,
    handleInputChange,
    handleSubmit,
    handleEdit,
    handleCancel,

    // filters
    filters,
    setFilters,
    teamSearch,
    setTeamSearch,
    teamStatus,
    setTeamStatus,
    fetchLeaveRequests,

    // modals & LOP
    setLopModal,
    fetchMonthlyLop: async (m, y) => {
      if (!employeeId) return 0;
      try {
        const url = `${BACKEND}/api/leave-policies/employee/${employeeId}/monthly-lop?month=${m}&year=${y}`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const payload = json?.data || {};
        const val = Number(
          payload.total_lop ?? payload.totalLop ?? payload.lop ?? 0
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
          headers,
          body: JSON.stringify({ month: m, year: y }),
        });
        if (!res.ok) throw new Error("Compute failed");
        const json = await res.json();
        const payload = json?.data || {};
        const val = Number(
          payload.total_lop ?? payload.totalLop ?? payload.lop ?? 0
        );
        setMonthlyLop(Number.isFinite(val) ? val : 0);
        return val;
      } catch (err) {
        console.error("Compute monthly LOP failed:", err);
        showAlert("Failed to compute monthly LOP.");
        return null;
      }
    },

    // alert helpers
    showAlert,
    closeAlert,
    showConfirm,
    closeConfirm,

    // misc setters
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
  };
}
