"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  Check,
  Info,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthProvider.client";
import "./PunchPolicyModal.css";

const DEFAULT_EXCUSES = [
  {
    id: "1",
    name: "Medical Leave (Sick)",
    weekly: "1",
    days15: "2",
    monthly: "4",
  },
  { id: "2", name: "Personal Work", weekly: "0.5", days15: "1", monthly: "2" },
  { id: "3", name: "Family Emergency", weekly: "1", days15: "2", monthly: "3" },
  {
    id: "4",
    name: "Official Work / Business",
    weekly: "1",
    days15: "2",
    monthly: "4",
  },
  {
    id: "5",
    name: "Transport Delay",
    weekly: "0.5",
    days15: "1",
    monthly: "2",
  },
  {
    id: "6",
    name: "Other (With Manager Approval)",
    weekly: "1",
    days15: "2",
    monthly: "3",
  },
];

const emptyFormState = () => ({
  policyName: "",
  description: "",
  policyType: "late_login",
  appliesTo: "specific",
  deductionBasis: "hours",
  deductionType: "hour",
  deductionValue: "",
  rounding: "nearest_minute",
  selectedGroups: [],
  selectedEmployees: [],
  applyGraceTime: true,
  graceMinutes: "15",
  minDuration: "15",
  markAsHalfDay: true,
  markAsFullDay: true,
  halfDayAfter: "03:00",
  fullDayAfter: "06:00",
  halfDayOperator: "greater",
  fullDayOperator: "greater",
  policyStatus: "active",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTill: "",
  noExpiry: true,
});

function normalizePolicyFromApi(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    policyName: row.policyName || row.policy_name || "",
    description: row.description || "",
    policyType: row.policyType || row.policy_type || "late_login",
    appliesTo: row.appliesTo || row.applies_to || "specific",
    deductionBasis: row.deductionBasis || row.deduction_basis || "hours",
    deductionType: row.deductionType || row.deduction_type || "hour",
    deductionValue: String(row.deductionValue ?? row.deduction_value ?? ""),
    rounding: row.rounding || "nearest_minute",
    selectedGroups: Array.isArray(row.selectedGroups)
      ? row.selectedGroups
      : Array.isArray(row.selected_groups)
        ? row.selected_groups
        : [],
    selectedEmployees: Array.isArray(row.selectedEmployees)
      ? row.selectedEmployees
      : Array.isArray(row.selected_employees)
        ? row.selected_employees
        : [],
    applyGraceTime: !!(row.applyGraceTime ?? row.apply_grace_time ?? true),
    graceMinutes: String(row.graceMinutes ?? row.grace_minutes ?? "15"),
    minDuration: String(row.minDuration ?? row.min_duration ?? "15"),
    markAsHalfDay: !!(row.markAsHalfDay ?? row.mark_as_half_day ?? true),
    markAsFullDay: !!(row.markAsFullDay ?? row.mark_as_full_day ?? true),
    halfDayAfter: row.halfDayAfter || row.half_day_after || "03:00",
    fullDayAfter: row.fullDayAfter || row.full_day_after || "06:00",
    halfDayOperator: row.halfDayOperator || row.half_day_operator || "greater",
    fullDayOperator: row.fullDayOperator || row.full_day_operator || "greater",
    policyStatus: row.policyStatus || row.policy_status || "active",
    effectiveFrom:
      row.effectiveFrom ||
      row.effective_from ||
      new Date().toISOString().slice(0, 10),
    effectiveTill: row.effectiveTill || row.effective_till || "",
    noExpiry:
      row.noExpiry === true ||
      row.no_expiry === true ||
      !(row.effectiveTill || row.effective_till),
    rules: Array.isArray(row.rules) ? row.rules : [],
    excuses:
      Array.isArray(row.excuses) && row.excuses.length
        ? row.excuses
        : DEFAULT_EXCUSES,
  };
}

function getApiErrorMessage(err, fallback = "Something went wrong.") {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (typeof first === "string") return first;
    if (first?.message) return first.message;
  }
  return err?.message || fallback;
}

export default function PunchPolicyModal({ isOpen, onClose }) {
  const { user } = useAuth();

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") || "";

  const employeeId =
    user?.employeeId ??
    user?.employee_id ??
    user?.raw?.employeeId ??
    user?.raw?.employee_id ??
    null;

  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.orgId ??
    user?.raw?.org_id ??
    null;

  const headers = useMemo(
    () => ({
      "x-api-key": API_KEY,
      "x-employee-id": employeeId,
      "x-org-id": orgId,
      "x-role": user?.role || "",
      "Content-Type": "application/json",
    }),
    [API_KEY, employeeId, orgId, user?.role],
  );

  // List state
  const [view, setView] = useState("list");
  const [policies, setPolicies] = useState([]);
  const [listSearch, setListSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form state
  const [policyName, setPolicyName] = useState("");
  const [description, setDescription] = useState("");
  const [policyType, setPolicyType] = useState("late_login");
  const [appliesTo, setAppliesTo] = useState("specific");
  const [deductionBasis, setDeductionBasis] = useState("hours");
  const [deductionType, setDeductionType] = useState("hour");
  const [deductionValue, setDeductionValue] = useState("");
  const [rounding, setRounding] = useState("nearest_minute");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [applyGraceTime, setApplyGraceTime] = useState(true);
  const [graceMinutes, setGraceMinutes] = useState("15");
  const [minDuration, setMinDuration] = useState("15");
  const [markAsHalfDay, setMarkAsHalfDay] = useState(true);
  const [markAsFullDay, setMarkAsFullDay] = useState(true);
  const [halfDayAfter, setHalfDayAfter] = useState("03:00");
  const [fullDayAfter, setFullDayAfter] = useState("06:00");
  const [halfDayOperator, setHalfDayOperator] = useState("greater");
  const [fullDayOperator, setFullDayOperator] = useState("greater");
  const [policyStatus, setPolicyStatus] = useState("active");
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [effectiveTill, setEffectiveTill] = useState("");
  const [noExpiry, setNoExpiry] = useState(true);

  // Rules & excuses
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({
    scenario: "late_login",
    adjustmentType: "deduction",
    applyAs: "hour",
    excuse: "",
    minDuration: "15",
  });
  const [excuses, setExcuses] = useState(DEFAULT_EXCUSES);

  // Assignment panel – dynamic
  const [assignmentTab, setAssignmentTab] = useState("groups"); // "groups" | "employees"
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [empSearch, setEmpSearch] = useState("");
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const clearMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  /* ───────────── Fetch policies ───────────── */
  const fetchPolicies = useCallback(async () => {
    if (!orgId || !BACKEND_URL) return;
    try {
      setListLoading(true);
      setError("");
      const res = await axios.get(`${BACKEND_URL}/api/punch-policy`, {
        headers,
        withCredentials: true,
        params: listSearch.trim() ? { search: listSearch.trim() } : undefined,
      });
      const ok =
        res?.data?.success === true ||
        (typeof res?.status === "number" &&
          res.status >= 200 &&
          res.status < 300);
      if (!ok) {
        setError(res?.data?.message || "Failed to load policies.");
        setPolicies([]);
        return;
      }
      const rows = res.data?.data || res.data || [];
      setPolicies(
        (Array.isArray(rows) ? rows : []).map(normalizePolicyFromApi),
      );
    } catch (err) {
      console.error("[PunchPolicyModal] fetchPolicies:", err);
      setError(getApiErrorMessage(err, "Failed to load policies."));
      setPolicies([]);
    } finally {
      setListLoading(false);
    }
  }, [BACKEND_URL, headers, orgId, listSearch]);

  /* ───────────── Fetch departments + employees ───────────── */
  const fetchAssignmentData = useCallback(
    async (search = "") => {
      if (!orgId || !BACKEND_URL) return;
      try {
        setAssignmentLoading(true);
        const [deptRes, empRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/punch-policy/departments`, {
            headers,
            withCredentials: true,
          }),
          axios.get(`${BACKEND_URL}/api/punch-policy/employees`, {
            headers,
            withCredentials: true,
            params: search.trim() ? { search: search.trim() } : undefined,
          }),
        ]);
        if (deptRes.data?.success) {
          setDepartments(deptRes.data.data || []);
        }
        if (empRes.data?.success) {
          setEmployees(empRes.data.data || []);
        }
      } catch (err) {
        console.error("[PunchPolicyModal] fetchAssignmentData:", err);
      } finally {
        setAssignmentLoading(false);
      }
    },
    [BACKEND_URL, headers, orgId],
  );

  useEffect(() => {
    if (!isOpen) return;
    setView("list");
    setEditingId(null);
    setDeleteConfirmId(null);
    setSearchText("");
    clearMessages();
    fetchPolicies();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || view !== "list") return;
    const t = setTimeout(() => fetchPolicies(), 300);
    return () => clearTimeout(t);
  }, [listSearch]);

  useEffect(() => {
    if (!isOpen || view !== "form") return;
    fetchAssignmentData();
  }, [isOpen, view]);

  useEffect(() => {
    if (!isOpen || view !== "form" || assignmentTab !== "employees") return;
    const t = setTimeout(() => fetchAssignmentData(empSearch), 300);
    return () => clearTimeout(t);
  }, [empSearch]);

  const filteredPolicies = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return policies;
    return policies.filter(
      (p) =>
        (p.policyName || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q),
    );
  }, [policies, listSearch]);

  // Departments used as selectable "groups"
  const filteredDepartments = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => (d.name || "").toLowerCase().includes(q));
  }, [departments, searchText]);

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        (e.name || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.id || "").toLowerCase().includes(q) ||
        (e.department || "").toLowerCase().includes(q),
    );
  }, [employees, empSearch]);

  // Group employees by department for display
  const employeesByDept = useMemo(() => {
    const map = {};
    filteredEmployees.forEach((emp) => {
      const dept = emp.department || "No Department";
      if (!map[dept]) map[dept] = [];
      map[dept].push(emp);
    });
    return map;
  }, [filteredEmployees]);

  const loadFormFromPolicy = (policy) => {
    setPolicyName(policy.policyName || "");
    setDescription(policy.description || "");
    setPolicyType(policy.policyType || "late_login");
    setAppliesTo(policy.appliesTo || "specific");
    setDeductionBasis(policy.deductionBasis || "hours");
    setDeductionType(policy.deductionType || "hour");
    setDeductionValue(policy.deductionValue || "");
    setRounding(policy.rounding || "nearest_minute");
    setSelectedGroups(policy.selectedGroups || []);
    setSelectedEmployees(policy.selectedEmployees || []);
    setApplyGraceTime(!!policy.applyGraceTime);
    setGraceMinutes(policy.graceMinutes || "15");
    setMinDuration(policy.minDuration || "15");
    setMarkAsHalfDay(!!policy.markAsHalfDay);
    setMarkAsFullDay(!!policy.markAsFullDay);
    setHalfDayAfter(policy.halfDayAfter || "03:00");
    setFullDayAfter(policy.fullDayAfter || "06:00");
    setHalfDayOperator(policy.halfDayOperator || "greater");
    setFullDayOperator(policy.fullDayOperator || "greater");
    setPolicyStatus(policy.policyStatus || "active");
    setEffectiveFrom(
      policy.effectiveFrom || new Date().toISOString().slice(0, 10),
    );
    setEffectiveTill(policy.effectiveTill || "");
    setNoExpiry(!!policy.noExpiry);
    setRules(policy.rules || []);
    setExcuses(
      policy.excuses && policy.excuses.length
        ? policy.excuses
        : DEFAULT_EXCUSES,
    );
  };

  const resetForm = () => {
    const empty = emptyFormState();
    setPolicyName(empty.policyName);
    setDescription(empty.description);
    setPolicyType(empty.policyType);
    setAppliesTo(empty.appliesTo);
    setDeductionBasis(empty.deductionBasis);
    setDeductionType(empty.deductionType);
    setDeductionValue(empty.deductionValue);
    setRounding(empty.rounding);
    setSelectedGroups(empty.selectedGroups);
    setSelectedEmployees(empty.selectedEmployees);
    setApplyGraceTime(empty.applyGraceTime);
    setGraceMinutes(empty.graceMinutes);
    setMinDuration(empty.minDuration);
    setMarkAsHalfDay(empty.markAsHalfDay);
    setMarkAsFullDay(empty.markAsFullDay);
    setHalfDayAfter(empty.halfDayAfter);
    setFullDayAfter(empty.fullDayAfter);
    setHalfDayOperator(empty.halfDayOperator);
    setFullDayOperator(empty.fullDayOperator);
    setPolicyStatus(empty.policyStatus);
    setEffectiveFrom(empty.effectiveFrom);
    setEffectiveTill(empty.effectiveTill);
    setNoExpiry(empty.noExpiry);
    setSearchText("");
    setEmpSearch("");
    setAssignmentTab("groups");
    setRules([]);
    setExcuses(DEFAULT_EXCUSES);
    setNewRule({
      scenario: "late_login",
      adjustmentType: "deduction",
      applyAs: "hour",
      excuse: "",
      minDuration: "15",
    });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    resetForm();
    clearMessages();
    setView("form");
  };

  const handleOpenEdit = async (policy) => {
    clearMessages();
    setEditingId(policy.id);
    loadFormFromPolicy(policy);
    setView("form");
    if (!BACKEND_URL || !orgId) return;
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/punch-policy/${policy.id}`,
        { headers, withCredentials: true },
      );
      const ok =
        res?.data?.success === true ||
        (typeof res?.status === "number" &&
          res.status >= 200 &&
          res.status < 300);
      if (ok && res.data?.data) {
        loadFormFromPolicy(normalizePolicyFromApi(res.data.data));
      }
    } catch (err) {
      console.warn("[PunchPolicyModal] get by id failed:", err);
    }
  };

  const handleBackToList = () => {
    setView("list");
    setEditingId(null);
    setDeleteConfirmId(null);
    clearMessages();
  };

  const handleDelete = async (id) => {
    if (!BACKEND_URL || !orgId) {
      setError("Missing backend configuration.");
      return;
    }
    try {
      setDeleteLoading(true);
      setError("");
      const res = await axios.delete(`${BACKEND_URL}/api/punch-policy/${id}`, {
        headers,
        withCredentials: true,
      });
      const ok =
        res?.data?.success === true ||
        (typeof res?.status === "number" &&
          res.status >= 200 &&
          res.status < 300);
      if (!ok) {
        setError(res?.data?.message || "Failed to delete policy.");
        return;
      }
      setDeleteConfirmId(null);
      setSuccessMsg(res?.data?.message || "Policy deleted successfully.");
      await fetchPolicies();
    } catch (err) {
      console.error("[PunchPolicyModal] delete:", err);
      setError(getApiErrorMessage(err, "Failed to delete policy."));
    } finally {
      setDeleteLoading(false);
    }
  };

  const buildPayload = () => ({
    policyName: policyName.trim(),
    description: description.trim(),
    policyType,
    appliesTo,
    deductionBasis,
    deductionType,
    deductionValue: Number(deductionValue) || 0,
    rounding,
    selectedGroups: [...selectedGroups],
    selectedEmployees: selectedEmployees.map((e) => ({
      id: e.id,
      name: e.name,
    })),
    applyGraceTime,
    graceMinutes: Number(graceMinutes) || 0,
    minDuration: Number(minDuration) || 0,
    markAsHalfDay,
    markAsFullDay,
    halfDayAfter,
    fullDayAfter,
    halfDayOperator,
    fullDayOperator,
    policyStatus,
    effectiveFrom,
    effectiveTill: noExpiry ? null : effectiveTill || null,
    noExpiry,
    rules,
    excuses,
  });

  const handleSave = async () => {
    clearMessages();
    if (!policyName.trim()) {
      setError("Policy Name is required.");
      return;
    }
    if (!effectiveFrom) {
      setError("Effective From date is required.");
      return;
    }
    if (!BACKEND_URL || !orgId) {
      setError("Missing backend configuration.");
      return;
    }
    const payload = buildPayload();
    try {
      setSaveLoading(true);
      let res;
      if (editingId) {
        res = await axios.put(
          `${BACKEND_URL}/api/punch-policy/${editingId}`,
          payload,
          { headers, withCredentials: true },
        );
      } else {
        res = await axios.post(`${BACKEND_URL}/api/punch-policy`, payload, {
          headers,
          withCredentials: true,
        });
      }
      const ok =
        res?.data?.success === true ||
        (typeof res?.status === "number" &&
          res.status >= 200 &&
          res.status < 300);
      if (!ok) {
        setError(
          res?.data?.message ||
            (editingId
              ? "Failed to update policy."
              : "Failed to create policy."),
        );
        return;
      }
      setSuccessMsg(
        res?.data?.message ||
          (editingId
            ? "Policy updated successfully."
            : "Policy created successfully."),
      );
      await fetchPolicies();
      handleBackToList();
    } catch (err) {
      console.error("[PunchPolicyModal] save:", err);
      setError(
        getApiErrorMessage(
          err,
          editingId ? "Failed to update policy." : "Failed to create policy.",
        ),
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleGroup = (name) => {
    setSelectedGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name],
    );
  };

  const toggleEmployee = (emp) => {
    setSelectedEmployees((prev) => {
      const exists = prev.some((e) => e.id === emp.id);
      if (exists) return prev.filter((e) => e.id !== emp.id);
      return [...prev, { id: emp.id, name: emp.name }];
    });
  };

  const isEmployeeSelected = (id) => selectedEmployees.some((e) => e.id === id);

  /* ── Rules ── */
  const handleAddRule = () => {
    if (!newRule.scenario || !newRule.applyAs) return;
    setRules((prev) => [...prev, { id: Date.now().toString(), ...newRule }]);
    setNewRule({
      scenario: "late_login",
      adjustmentType: "deduction",
      applyAs: "hour",
      excuse: "",
      minDuration: "15",
    });
  };

  const handleDeleteRule = (id) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleEditRule = (rule) => {
    setNewRule({ ...rule });
    setRules((prev) => prev.filter((r) => r.id !== rule.id));
  };

  /* ── Excuses ── */
  const updateExcuse = (id, field, value) => {
    setExcuses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

  const deleteExcuse = (id) => {
    setExcuses((prev) => prev.filter((e) => e.id !== id));
  };

  const addExcuse = () => {
    setExcuses((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "New Excuse",
        weekly: "1",
        days15: "2",
        monthly: "3",
      },
    ]);
  };

  const getRuleExampleText = (rule) => {
    switch (rule.scenario) {
      case "late_login":
        return "Login 09:45 · Scheduled 09:00 → 45 mins late → 0.5 hr deduction";
      case "missed_logout":
        return "Logout 05:15 · Scheduled 06:00 → 45 mins early → 0.5 hr deduction";
      case "missed_punch_in":
        return "Punch-in 10:30 · Scheduled 09:00 → 1.5 hrs → 1 hr deduction";
      case "less_total_hours":
        return "Worked 5h 20m · Required 8h → Shortage 2h 40m → Half Day";
      default:
        return "";
    }
  };

  const summary = {
    policyType:
      policyType === "late_login"
        ? "Late Login"
        : policyType === "missed_punch_in"
          ? "Missed Punch-in"
          : "Both",
    deductionType:
      deductionType === "hour"
        ? "Hour"
        : deductionType === "half_day"
          ? "Half Day"
          : "Full Day",
    rulesCount: rules.length,
    excusesCount: excuses.length,
    graceTime: applyGraceTime ? `${graceMinutes} mins` : "0 mins",
    halfDayAfter: markAsHalfDay
      ? `${halfDayOperator === "greater" ? ">" : "≥"} ${halfDayAfter}`
      : "—",
    fullDayAfter: markAsFullDay
      ? `${fullDayOperator === "greater" ? ">" : "≥"} ${fullDayAfter}`
      : "—",
    appliesTo:
      appliesTo === "all"
        ? "All Employees"
        : `${selectedGroups.length} Dept · ${selectedEmployees.length} Emp`,
    policyStatus: policyStatus === "active" ? "Active" : "Inactive",
  };

  if (!isOpen) return null;

  /* ──────────────────── LIST VIEW ──────────────────── */
  if (view === "list") {
    return (
      <div className="punch-policy-overlay" onClick={onClose}>
        <div
          className="punch-policy-modal pp-list-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pp-header">
            <div>
              <div className="pp-breadcrumb">
                <span>Attendance</span>
                <span>&gt;</span>
                <span className="pp-current">Policy Mapping</span>
              </div>
              <h2 className="pp-title" style={{ marginTop: 10 }}>
                Attendance Policy
              </h2>
              <p className="pp-subtitle">
                Map and manage late login and missed punch-in deduction rules.
              </p>
            </div>
            <div className="pp-header-actions">
              <button
                type="button"
                className="pp-btn pp-btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="pp-btn pp-btn-primary"
                onClick={handleOpenCreate}
              >
                <Plus size={16} style={{ marginRight: 6 }} />
                New Policy
              </button>
            </div>
          </div>

          <div className="pp-body">
            {error && (
              <div
                style={{
                  marginBottom: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: 13.5,
                  border: "1px solid #fecaca",
                }}
              >
                {error}
              </div>
            )}
            {successMsg && (
              <div
                style={{
                  marginBottom: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "#ecfdf5",
                  color: "#047857",
                  fontSize: 13.5,
                  border: "1px solid #bbf7d0",
                }}
              >
                {successMsg}
              </div>
            )}

            <div className="pp-list-toolbar">
              <div className="pp-list-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search Policy"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="pp-list-table-wrap">
              <table className="pp-list-table">
                <thead>
                  <tr>
                    <th>Policy Name</th>
                    <th style={{ width: 120 }}>Status</th>
                    <th style={{ width: 140, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listLoading ? (
                    <tr>
                      <td colSpan={3} className="pp-list-empty">
                        Loading policies...
                      </td>
                    </tr>
                  ) : filteredPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="pp-list-empty">
                        No policies found.
                      </td>
                    </tr>
                  ) : (
                    filteredPolicies.map((policy) => (
                      <tr key={policy.id}>
                        <td>
                          <div className="pp-list-name">
                            {policy.policyName}
                          </div>
                          <div className="pp-list-desc">
                            {policy.description || "—"}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`pp-status-badge ${
                              policy.policyStatus === "active"
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {policy.policyStatus === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="pp-list-actions">
                            {deleteConfirmId === policy.id ? (
                              <div className="pp-delete-confirm">
                                <button
                                  type="button"
                                  className="pp-delete-yes"
                                  disabled={deleteLoading}
                                  onClick={() => handleDelete(policy.id)}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  className="pp-delete-no"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="pp-icon-btn"
                                  title="Edit"
                                  onClick={() => handleOpenEdit(policy)}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="pp-icon-btn danger"
                                  title="Delete"
                                  onClick={() => setDeleteConfirmId(policy.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────── FORM VIEW ──────────────────── */
  return (
    <div className="punch-policy-overlay" onClick={onClose}>
      <div className="punch-policy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pp-header">
          <div>
            <div className="pp-breadcrumb">
              <span>Attendance</span>
              <span>&gt;</span>
              <span className="pp-current">
                {editingId ? "Edit Policy" : "New Policy"}
              </span>
            </div>
            <h2 className="pp-title" style={{ marginTop: 10 }}>
              {editingId
                ? "Edit Attendance Policy"
                : "Create Attendance Policy"}
            </h2>
            <p className="pp-subtitle">
              Configure deduction rules, excuses, and assignment.
            </p>
          </div>
          <div className="pp-header-actions">
            <button
              type="button"
              className="pp-btn pp-btn-secondary"
              onClick={handleBackToList}
            >
              Back
            </button>
            <button
              type="button"
              className="pp-btn pp-btn-primary"
              onClick={handleSave}
              disabled={saveLoading}
            >
              {saveLoading
                ? "Saving..."
                : editingId
                  ? "Update Policy"
                  : "Save Policy"}
            </button>
          </div>
        </div>

        <div className="pp-body">
          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 14px",
                borderRadius: 12,
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: 13.5,
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

          <div className="pp-main-layout">
            {/* ── Left form panel ── */}
            <div className="pp-form-panel">
              {/* 1. Policy Details */}
              <div className="pp-section">
                <h3 className="pp-section-title">1. Policy Details</h3>
                <div className="pp-grid pp-grid-two">
                  <div className="pp-field">
                    <label>
                      Policy Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                      placeholder="e.g. Late Login Policy"
                    />
                  </div>
                  <div className="pp-field">
                    <label>Policy Type</label>
                    <select
                      value={policyType}
                      onChange={(e) => setPolicyType(e.target.value)}
                    >
                      <option value="late_login">Late Login</option>
                      <option value="missed_punch_in">Missed Punch-in</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
                <div className="pp-field" style={{ marginTop: 14 }}>
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
                <div className="pp-field" style={{ marginTop: 14 }}>
                  <label>Applies To</label>
                  <div className="pp-radio-row">
                    <label
                      className={`pp-radio ${appliesTo === "all" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="appliesTo"
                        checked={appliesTo === "all"}
                        onChange={() => setAppliesTo("all")}
                      />
                      <span>All Employees</span>
                    </label>
                    <label
                      className={`pp-radio ${appliesTo === "specific" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="appliesTo"
                        checked={appliesTo === "specific"}
                        onChange={() => setAppliesTo("specific")}
                      />
                      <span>Specific Groups / Employees</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Half Day / Full Day */}
              <div className="pp-section">
                <h3 className="pp-section-title">
                  2. Half Day / Full Day Configuration
                </h3>
                <div className="pp-flag-row">
                  <input
                    type="checkbox"
                    checked={markAsHalfDay}
                    onChange={(e) => setMarkAsHalfDay(e.target.checked)}
                  />
                  <span>Mark as Half Day when late duration is</span>
                </div>
                {markAsHalfDay && (
                  <div className="pp-duration-row">
                    <div className="pp-duration-control">
                      <select
                        value={halfDayOperator}
                        onChange={(e) => setHalfDayOperator(e.target.value)}
                      >
                        <option value="greater">Greater than</option>
                        <option value="equal">Greater or equal</option>
                      </select>
                      <input
                        type="time"
                        value={halfDayAfter}
                        onChange={(e) => setHalfDayAfter(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="pp-flag-row">
                  <input
                    type="checkbox"
                    checked={markAsFullDay}
                    onChange={(e) => setMarkAsFullDay(e.target.checked)}
                  />
                  <span>Mark as Full Day when late duration is</span>
                </div>
                {markAsFullDay && (
                  <div className="pp-duration-row">
                    <div className="pp-duration-control">
                      <select
                        value={fullDayOperator}
                        onChange={(e) => setFullDayOperator(e.target.value)}
                      >
                        <option value="greater">Greater than</option>
                        <option value="equal">Greater or equal</option>
                      </select>
                      <input
                        type="time"
                        value={fullDayAfter}
                        onChange={(e) => setFullDayAfter(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Deduction Configuration */}
              <div className="pp-section">
                <h3 className="pp-section-title">3. Deduction Configuration</h3>
                <div className="pp-field">
                  <label>Apply As</label>
                  <div className="pp-radio-row">
                    <label
                      className={`pp-radio ${deductionType === "hour" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="deductionType"
                        checked={deductionType === "hour"}
                        onChange={() => setDeductionType("hour")}
                      />
                      <span>Hour</span>
                    </label>
                    <label
                      className={`pp-radio ${deductionType === "half_day" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="deductionType"
                        checked={deductionType === "half_day"}
                        onChange={() => setDeductionType("half_day")}
                      />
                      <span>Half Day</span>
                    </label>
                    <label
                      className={`pp-radio ${deductionType === "full_day" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="deductionType"
                        checked={deductionType === "full_day"}
                        onChange={() => setDeductionType("full_day")}
                      />
                      <span>Full Day</span>
                    </label>
                  </div>
                </div>
                <div className="pp-field" style={{ marginTop: 14 }}>
                  <label>Deduction Basis</label>
                  <div className="pp-radio-row">
                    <label
                      className={`pp-radio ${deductionBasis === "hours" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="deductionBasis"
                        checked={deductionBasis === "hours"}
                        onChange={() => setDeductionBasis("hours")}
                      />
                      <span>Actual Hours</span>
                    </label>
                    <label
                      className={`pp-radio ${deductionBasis === "percentage" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="deductionBasis"
                        checked={deductionBasis === "percentage"}
                        onChange={() => setDeductionBasis("percentage")}
                      />
                      <span>Percentage (%)</span>
                    </label>
                    <label
                      className={`pp-radio ${deductionBasis === "amount" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="deductionBasis"
                        checked={deductionBasis === "amount"}
                        onChange={() => setDeductionBasis("amount")}
                      />
                      <span>Fixed Amount (₹)</span>
                    </label>
                  </div>
                </div>
                <div
                  className="pp-grid pp-grid-three"
                  style={{ marginTop: 16 }}
                >
                  <div className="pp-field">
                    <label>
                      Deduction Value{" "}
                      {deductionBasis !== "hours" && (
                        <span className="required">*</span>
                      )}
                    </label>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={deductionValue}
                        onChange={(e) => setDeductionValue(e.target.value)}
                        style={{ flex: 1 }}
                        placeholder={
                          deductionBasis === "percentage"
                            ? "e.g. 50"
                            : deductionBasis === "amount"
                              ? "e.g. 200"
                              : "Auto"
                        }
                        disabled={deductionBasis === "hours"}
                      />
                      <span style={{ color: "#6b7280", fontSize: 14 }}>
                        {deductionBasis === "percentage"
                          ? "%"
                          : deductionBasis === "amount"
                            ? "₹"
                            : "hrs"}
                      </span>
                    </div>
                  </div>
                  <div className="pp-field">
                    <label>
                      Min Duration <span className="required">*</span>
                    </label>
                    <div className="pp-short-input" style={{ width: "100%" }}>
                      <input
                        type="number"
                        min="0"
                        value={minDuration}
                        onChange={(e) => setMinDuration(e.target.value)}
                        placeholder="15"
                      />
                      <span>mins</span>
                    </div>
                  </div>
                  <div className="pp-field">
                    <label>Rounding</label>
                    <select
                      value={rounding}
                      onChange={(e) => setRounding(e.target.value)}
                    >
                      <option value="nearest_minute">Nearest minute</option>
                      <option value="nearest_five">Nearest 5 min</option>
                      <option value="nearest_half">Nearest 0.5 hr</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Adjustment Rules */}
              <div className="pp-section">
                <h3 className="pp-section-title">
                  4. Configure Adjustment Rules
                </h3>
                <p className="pp-section-desc">
                  Define rules for different scenarios and min duration.
                </p>
                <div className="pp-rule-builder">
                  <div
                    className="pp-grid pp-grid-three"
                    style={{ marginBottom: 16 }}
                  >
                    <div className="pp-field">
                      <label>
                        Scenario <span className="required">*</span>
                      </label>
                      <select
                        value={newRule.scenario}
                        onChange={(e) =>
                          setNewRule({ ...newRule, scenario: e.target.value })
                        }
                      >
                        <option value="late_login">Late Login</option>
                        <option value="missed_logout">Missed Logout</option>
                        <option value="missed_punch_in">Missed Punch-in</option>
                        <option value="less_total_hours">
                          Less Total Hours
                        </option>
                      </select>
                    </div>
                    <div className="pp-field">
                      <label>
                        Adjustment Type <span className="required">*</span>
                      </label>
                      <select
                        value={newRule.adjustmentType}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            adjustmentType: e.target.value,
                          })
                        }
                      >
                        <option value="deduction">Deduction</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>
                    <div className="pp-field">
                      <label>
                        Apply As <span className="required">*</span>
                      </label>
                      <select
                        value={newRule.applyAs}
                        onChange={(e) =>
                          setNewRule({ ...newRule, applyAs: e.target.value })
                        }
                      >
                        <option value="hour">Hour</option>
                        <option value="half_day">Half Day</option>
                        <option value="full_day">Full Day</option>
                      </select>
                    </div>
                  </div>
                  <div
                    className="pp-grid pp-grid-two"
                    style={{ marginBottom: 16 }}
                  >
                    <div className="pp-field">
                      <label>Excuse / Reason (Optional)</label>
                      <select
                        value={newRule.excuse}
                        onChange={(e) =>
                          setNewRule({ ...newRule, excuse: e.target.value })
                        }
                      >
                        <option value="">Select Excuse</option>
                        {excuses.map((ex) => (
                          <option key={ex.id} value={ex.name}>
                            {ex.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="pp-field">
                      <label>Min Duration</label>
                      <div className="pp-short-input" style={{ width: "100%" }}>
                        <input
                          type="number"
                          min="0"
                          value={newRule.minDuration}
                          onChange={(e) =>
                            setNewRule({
                              ...newRule,
                              minDuration: e.target.value,
                            })
                          }
                          placeholder="15"
                        />
                        <span>Mins</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="pp-btn pp-btn-primary pp-btn-sm"
                    onClick={handleAddRule}
                  >
                    <Plus size={15} style={{ marginRight: 6 }} />
                    Add Rule
                  </button>
                </div>

                {rules.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "28px 16px",
                      color: "#94a3b8",
                      fontSize: 14,
                      border: "1px dashed #e2e8f0",
                      borderRadius: 14,
                    }}
                  >
                    No rules added yet. Create your first rule above.
                  </div>
                ) : (
                  <div className="pp-calc-examples">
                    {rules.map((rule, index) => (
                      <div
                        key={rule.id}
                        className="pp-calc-card"
                        style={{
                          borderLeftColor:
                            rule.scenario === "late_login"
                              ? "#3b82f6"
                              : rule.scenario === "missed_logout"
                                ? "#8b5cf6"
                                : rule.scenario === "missed_punch_in"
                                  ? "#10b981"
                                  : "#f59e0b",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div>
                            <div className="pp-calc-card-title">
                              {index + 1}.{" "}
                              {rule.scenario === "late_login"
                                ? "Late Login"
                                : rule.scenario === "missed_logout"
                                  ? "Missed Logout"
                                  : rule.scenario === "missed_punch_in"
                                    ? "Missed Punch-in"
                                    : "Less Total Hours"}{" "}
                              (
                              {rule.applyAs === "hour"
                                ? "Hourly"
                                : rule.applyAs === "half_day"
                                  ? "Half Day"
                                  : "Full Day"}
                              )
                            </div>
                            <div className="pp-calc-card-example">
                              {getRuleExampleText(rule)}
                            </div>
                            <div
                              style={{
                                marginTop: 8,
                                fontSize: 12,
                                color: "#64748b",
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                              }}
                            >
                              <span>
                                Type: <strong>{rule.adjustmentType}</strong>
                              </span>
                              {rule.excuse && (
                                <span>
                                  Excuse: <strong>{rule.excuse}</strong>
                                </span>
                              )}
                              <span>
                                Min: <strong>{rule.minDuration} mins</strong>
                              </span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="pp-icon-btn"
                              title="Edit"
                              onClick={() => handleEditRule(rule)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="pp-icon-btn danger"
                              title="Delete"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Excuse Mapping */}
              <div className="pp-section">
                <h3 className="pp-section-title">5. Excuse / Reason Mapping</h3>
                <p className="pp-section-desc">
                  Allowed days for each excuse (weekly / 15 days / monthly).
                </p>
                <div className="pp-excuse-table-wrap">
                  <table className="pp-excuse-table">
                    <thead>
                      <tr>
                        <th>Excuse / Reason</th>
                        <th style={{ width: 110 }}>Weekly</th>
                        <th style={{ width: 110 }}>15 Days</th>
                        <th style={{ width: 110 }}>Monthly</th>
                        <th style={{ width: 90, textAlign: "right" }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {excuses.map((ex) => (
                        <tr key={ex.id}>
                          <td>
                            <div className="pp-excuse-name">
                              <input
                                value={ex.name}
                                onChange={(e) =>
                                  updateExcuse(ex.id, "name", e.target.value)
                                }
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  fontWeight: 500,
                                  minHeight: "auto",
                                  padding: 0,
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={ex.weekly}
                              onChange={(e) =>
                                updateExcuse(ex.id, "weekly", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={ex.days15}
                              onChange={(e) =>
                                updateExcuse(ex.id, "days15", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={ex.monthly}
                              onChange={(e) =>
                                updateExcuse(ex.id, "monthly", e.target.value)
                              }
                            />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="pp-icon-btn danger"
                              onClick={() => deleteExcuse(ex.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  className="pp-add-excuse-btn"
                  onClick={addExcuse}
                >
                  <Plus size={14} /> Add Excuse
                </button>
              </div>

              {/* 6 + 7 */}
              <div className="pp-section pp-section-inline">
                <div className="pp-half">
                  <h3 className="pp-section-title">6. Other Settings</h3>
                  <div className="pp-toggle-row">
                    <label
                      style={{
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: "#374151",
                      }}
                    >
                      Apply Grace Time
                    </label>
                    <button
                      type="button"
                      className={`pp-toggle ${applyGraceTime ? "on" : ""}`}
                      onClick={() => setApplyGraceTime((v) => !v)}
                    >
                      <span className="pp-toggle-knob" />
                    </button>
                  </div>
                  {applyGraceTime && (
                    <div className="pp-field" style={{ marginBottom: 14 }}>
                      <label>Grace Time (Daily)</label>
                      <div className="pp-short-input">
                        <input
                          type="number"
                          min="0"
                          value={graceMinutes}
                          onChange={(e) => setGraceMinutes(e.target.value)}
                        />
                        <span>mins</span>
                      </div>
                    </div>
                  )}
                  <div className="pp-field">
                    <label>Policy Status</label>
                    <select
                      value={policyStatus}
                      onChange={(e) => setPolicyStatus(e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="pp-half">
                  <h3 className="pp-section-title">7. Policy Validity</h3>
                  <div className="pp-field" style={{ marginBottom: 14 }}>
                    <label>
                      Effective From <span className="required">*</span>
                    </label>
                    <div className="pp-date-input">
                      <input
                        type="date"
                        value={effectiveFrom}
                        onChange={(e) => setEffectiveFrom(e.target.value)}
                      />
                      <CalendarDays size={16} color="#9ca3af" />
                    </div>
                  </div>
                  <div className="pp-field">
                    <label>Effective Till</label>
                    <div className="pp-date-input">
                      <input
                        type="date"
                        value={effectiveTill}
                        disabled={noExpiry}
                        onChange={(e) => setEffectiveTill(e.target.value)}
                      />
                      <CalendarDays size={16} color="#9ca3af" />
                    </div>
                  </div>
                  <label className="pp-checkbox-row">
                    <input
                      type="checkbox"
                      checked={noExpiry}
                      onChange={(e) => {
                        setNoExpiry(e.target.checked);
                        if (e.target.checked) setEffectiveTill("");
                      }}
                    />
                    <span>No Expiry</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ── Assignment Panel ── */}
            <aside className="pp-assignment-panel">
              <h3 className="pp-assignment-title">8. Assign Policy To</h3>

              <div className="pp-tabs">
                <button
                  type="button"
                  className={`pp-tab ${assignmentTab === "groups" ? "active" : ""}`}
                  onClick={() => setAssignmentTab("groups")}
                >
                  <Users size={14} /> Departments
                </button>
                <button
                  type="button"
                  className={`pp-tab ${assignmentTab === "employees" ? "active" : ""}`}
                  onClick={() => setAssignmentTab("employees")}
                >
                  Employees
                </button>
              </div>

              {/* Selected chips */}
              <div className="pp-selected-chips">
                {selectedGroups.map((g) => (
                  <div key={`g-${g}`} className="pp-chip">
                    <Users size={13} />
                    {g}
                    <button type="button" onClick={() => toggleGroup(g)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {selectedEmployees.map((e) => (
                  <div key={`e-${e.id}`} className="pp-chip">
                    {e.name}
                    <button type="button" onClick={() => toggleEmployee(e)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {assignmentTab === "groups" ? (
                <>
                  <div className="pp-search-wrap" style={{ marginBottom: 10 }}>
                    <Search size={15} />
                    <input
                      placeholder="Search departments"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                  <div className="pp-group-list">
                    {assignmentLoading ? (
                      <div
                        style={{ padding: 12, color: "#94a3b8", fontSize: 13 }}
                      >
                        Loading departments...
                      </div>
                    ) : filteredDepartments.length === 0 ? (
                      <div
                        style={{ padding: 12, color: "#94a3b8", fontSize: 13 }}
                      >
                        No departments found.
                      </div>
                    ) : (
                      filteredDepartments.map((d) => {
                        const selected = selectedGroups.includes(d.name);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            className={`pp-group-item ${selected ? "selected" : ""}`}
                            onClick={() => toggleGroup(d.name)}
                          >
                            <Users size={14} />
                            {d.name}
                            {selected && <Check size={14} />}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="pp-total-selected">
                    Total Selected Departments: {selectedGroups.length}
                  </div>
                </>
              ) : (
                <>
                  <div className="pp-search-wrap" style={{ marginBottom: 10 }}>
                    <Search size={15} />
                    <input
                      placeholder="Search employees"
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                    />
                  </div>
                  <div className="pp-group-list" style={{ maxHeight: 280 }}>
                    {assignmentLoading ? (
                      <div
                        style={{ padding: 12, color: "#94a3b8", fontSize: 13 }}
                      >
                        Loading employees...
                      </div>
                    ) : Object.keys(employeesByDept).length === 0 ? (
                      <div
                        style={{ padding: 12, color: "#94a3b8", fontSize: 13 }}
                      >
                        No employees found.
                      </div>
                    ) : (
                      Object.entries(employeesByDept).map(([dept, emps]) => (
                        <div key={dept} style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#64748b",
                              marginBottom: 4,
                              paddingLeft: 4,
                            }}
                          >
                            {dept}
                          </div>
                          {emps.map((emp) => {
                            const selected = isEmployeeSelected(emp.id);
                            return (
                              <button
                                key={emp.id}
                                type="button"
                                className={`pp-group-item ${selected ? "selected" : ""}`}
                                onClick={() => toggleEmployee(emp)}
                                style={{ marginBottom: 4 }}
                              >
                                <div style={{ flex: 1, textAlign: "left" }}>
                                  <div style={{ fontWeight: 500 }}>
                                    {emp.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "#94a3b8",
                                    }}
                                  >
                                    {emp.id}
                                  </div>
                                </div>
                                {selected && <Check size={14} />}
                              </button>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pp-total-selected">
                    Total Selected Employees: {selectedEmployees.length}
                  </div>
                </>
              )}

              <div className="pp-summary-box">
                <h4>Policy Summary</h4>
                <div className="pp-summary-list">
                  <div className="pp-summary-row">
                    <span>Policy Type</span>
                    <strong>{summary.policyType}</strong>
                  </div>
                  <div className="pp-summary-row">
                    <span>Apply As</span>
                    <strong>{summary.deductionType}</strong>
                  </div>
                  <div className="pp-summary-row">
                    <span>Rules Created</span>
                    <strong>{summary.rulesCount}</strong>
                  </div>
                  <div className="pp-summary-row">
                    <span>Excuses Mapped</span>
                    <strong>{summary.excusesCount}</strong>
                  </div>
                  <div className="pp-summary-row">
                    <span>Grace Time</span>
                    <strong>{summary.graceTime}</strong>
                  </div>
                  <div className="pp-summary-row">
                    <span>Half Day After</span>
                    <strong>{summary.halfDayAfter}</strong>
                  </div>
                  <div className="pp-summary-row">
                    <span>Full Day After</span>
                    <strong>{summary.fullDayAfter}</strong>
                  </div>
                  <div className="pp-summary-row">
                    <span>Applies To</span>
                    <strong>{summary.appliesTo}</strong>
                  </div>
                  <div className="pp-summary-row">
                    <span>Status</span>
                    <strong>{summary.policyStatus}</strong>
                  </div>
                </div>
              </div>
              <div className="pp-confirm-badge">
                <Check size={15} />
                This policy will be applied to selected departments / employees.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
