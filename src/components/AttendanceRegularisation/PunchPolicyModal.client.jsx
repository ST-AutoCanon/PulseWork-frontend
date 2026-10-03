"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthProvider.client";
import "./PunchPolicyModal.css";

const emptyShift = () => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
  name: "",
  punchInTime: "09:00",
  bufferTime: "15",
  punchOutTime: "18:00",
});

const emptyFormState = () => ({
  policyName: "",
  description: "",
  policyType: "late_login",
  appliesTo: "specific",
  deductionBasis: "percentage",
  deductionType: "half_day",
  deductionValue: "",
  minDuration: "15",
  limitWeekly: "2",
  limitMonthly: "4",
  halfDayBelowHours: "3",
  fullDayBelowHours: "1",
  enableFullDayThreshold: true,
  lateCountLimit: "22",
  lateWithinDays: "15",
  shiftMode: "general",
  punchInTime: "09:00",
  bufferTime: "15",
  punchOutTime: "18:00",
  shifts: [emptyShift()],
  skipIfRegularised: true,
  policyStatus: "active",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTill: "",
  noExpiry: true,
  selectedGroups: [],
  selectedEmployees: [],
});

function normalizePolicyFromApi(row) {
  if (!row) return null;
  const type = row.policyType || row.policy_type || "late_login";
  const policyType =
    type === "missed_punch_in" || type === "miss_punch_out"
      ? "miss_punch_out"
      : type === "both"
        ? "late_login"
        : type;

  let deductionBasis =
    row.deductionBasis || row.deduction_basis || "percentage";
  if (deductionBasis === "hours") deductionBasis = "percentage";

  let deductionType = row.deductionType || row.deduction_type || "half_day";
  if (deductionType === "hour" || deductionType === "per_hour") {
    deductionType = "half_day";
  }

  const rawShifts = row.shifts || row.shift_config;
  let shifts = [];
  if (Array.isArray(rawShifts) && rawShifts.length) {
    shifts = rawShifts.map((s, i) => ({
      id: s.id || `s-${i}-${Date.now()}`,
      name: s.name || `Shift ${i + 1}`,
      punchInTime: s.punchInTime || s.punch_in_time || "09:00",
      bufferTime: String(s.bufferTime ?? s.buffer_time ?? "15"),
      punchOutTime: s.punchOutTime || s.punch_out_time || "18:00",
    }));
  } else {
    shifts = [
      {
        id: "default",
        name: "General",
        punchInTime: row.punchInTime || row.punch_in_time || "09:00",
        bufferTime: String(row.bufferTime ?? row.buffer_time ?? "15"),
        punchOutTime: row.punchOutTime || row.punch_out_time || "18:00",
      },
    ];
  }

  const shiftMode =
    row.shiftMode ||
    row.shift_mode ||
    (shifts.length > 1 ? "multiple" : "general");

  // Keep minDuration and bufferTime aligned when loading
  const buf = String(
    row.bufferTime ??
      row.buffer_time ??
      row.minDuration ??
      row.min_duration ??
      shifts[0]?.bufferTime ??
      "15",
  );
  const minDur = String(row.minDuration ?? row.min_duration ?? buf ?? "15");

  return {
    id: String(row.id),
    policyName: row.policyName || row.policy_name || "",
    description: row.description || "",
    policyType,
    appliesTo: row.appliesTo || row.applies_to || "specific",
    deductionBasis,
    deductionType,
    deductionValue: String(row.deductionValue ?? row.deduction_value ?? ""),
    minDuration: minDur,
    limitWeekly: String(row.limitWeekly ?? row.limit_weekly ?? "2"),
    limitMonthly: String(row.limitMonthly ?? row.limit_monthly ?? "4"),
    halfDayBelowHours: String(
      row.halfDayBelowHours ?? row.half_day_below_hours ?? "3",
    ),
    fullDayBelowHours: String(
      row.fullDayBelowHours ?? row.full_day_below_hours ?? "1",
    ),
    enableFullDayThreshold: !!(
      row.enableFullDayThreshold ??
      row.enable_full_day_threshold ??
      true
    ),
    lateCountLimit: String(row.lateCountLimit ?? row.late_count_limit ?? "22"),
    lateWithinDays: String(row.lateWithinDays ?? row.late_within_days ?? "15"),
    shiftMode,
    punchInTime:
      row.punchInTime || row.punch_in_time || shifts[0]?.punchInTime || "09:00",
    bufferTime: buf,
    punchOutTime:
      row.punchOutTime ||
      row.punch_out_time ||
      shifts[0]?.punchOutTime ||
      "18:00",
    shifts: shifts.map((s) => ({ ...s, bufferTime: buf })),
    skipIfRegularised: !!(
      row.skipIfRegularised ??
      row.skip_if_regularised ??
      true
    ),
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

  // List
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

  // Form
  const [policyName, setPolicyName] = useState("");
  const [description, setDescription] = useState("");
  const [policyType, setPolicyType] = useState("late_login");
  const [appliesTo, setAppliesTo] = useState("specific");
  const [deductionBasis, setDeductionBasis] = useState("percentage");
  const [deductionType, setDeductionType] = useState("half_day");
  const [deductionValue, setDeductionValue] = useState("");
  const [minDuration, setMinDuration] = useState("15");
  const [limitWeekly, setLimitWeekly] = useState("2");
  const [limitMonthly, setLimitMonthly] = useState("4");
  const [halfDayBelowHours, setHalfDayBelowHours] = useState("3");
  const [fullDayBelowHours, setFullDayBelowHours] = useState("1");
  const [enableFullDayThreshold, setEnableFullDayThreshold] = useState(true);
  const [lateCountLimit, setLateCountLimit] = useState("22");
  const [lateWithinDays, setLateWithinDays] = useState("15");
  const [shiftMode, setShiftMode] = useState("general");
  const [punchInTime, setPunchInTime] = useState("09:00");
  const [bufferTime, setBufferTime] = useState("15");
  const [punchOutTime, setPunchOutTime] = useState("18:00");
  const [shifts, setShifts] = useState([emptyShift()]);
  const [skipIfRegularised, setSkipIfRegularised] = useState(true);
  const [policyStatus, setPolicyStatus] = useState("active");
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [effectiveTill, setEffectiveTill] = useState("");
  const [noExpiry, setNoExpiry] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchText, setSearchText] = useState("");

  // Assignment
  const [assignmentTab, setAssignmentTab] = useState("groups");
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [empSearch, setEmpSearch] = useState("");
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  /** employeeId -> { policyId, policyName } for other policies */
  const [employeePolicyMap, setEmployeePolicyMap] = useState({});

  const isLateLogin = policyType === "late_login";
  const isMissPunchOut = policyType === "miss_punch_out";
  const isLessHours = policyType === "less_login_hours";

  const clearMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  /** Keep Min Duration and Buffer Time always the same */
  const setMinDurationAndBuffer = (value) => {
    const v =
      value === "" || value === null || value === undefined
        ? ""
        : String(value);
    setMinDuration(v);
    setBufferTime(v);
    setShifts((prev) => prev.map((s) => ({ ...s, bufferTime: v })));
  };

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

  const buildEmployeePolicyMap = useCallback(
    async (currentEditId) => {
      if (!orgId || !BACKEND_URL) return;
      const map = {};

      const applyAssignments = (policy) => {
        if (!policy || String(policy.id) === String(currentEditId || ""))
          return;
        const emps = policy.selectedEmployees || [];
        emps.forEach((e) => {
          const eid = String(e.id ?? e.employee_id ?? e);
          if (!eid) return;
          if (!map[eid]) {
            map[eid] = {
              policyId: String(policy.id),
              policyName: policy.policyName || "Another policy",
            };
          }
        });
      };

      let list = policies;
      const needsDetail = list.some(
        (p) =>
          String(p.id) !== String(currentEditId || "") &&
          (!Array.isArray(p.selectedEmployees) ||
            p.selectedEmployees.length === 0),
      );

      if (needsDetail && list.length > 0) {
        try {
          const details = await Promise.all(
            list
              .filter((p) => String(p.id) !== String(currentEditId || ""))
              .map((p) =>
                axios
                  .get(`${BACKEND_URL}/api/punch-policy/${p.id}`, {
                    headers,
                    withCredentials: true,
                  })
                  .then((r) =>
                    r.data?.data ? normalizePolicyFromApi(r.data.data) : null,
                  )
                  .catch(() => null),
              ),
          );
          details.filter(Boolean).forEach(applyAssignments);
        } catch (err) {
          console.warn("[buildEmployeePolicyMap]", err);
          list.forEach(applyAssignments);
        }
      } else {
        list.forEach(applyAssignments);
      }

      setEmployeePolicyMap(map);
    },
    [BACKEND_URL, headers, orgId, policies],
  );

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
        if (deptRes.data?.success) setDepartments(deptRes.data.data || []);
        if (empRes.data?.success) setEmployees(empRes.data.data || []);
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
    buildEmployeePolicyMap(editingId);
  }, [isOpen, view, editingId]);

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
    setDeductionBasis(
      policy.deductionBasis === "hours"
        ? "percentage"
        : policy.deductionBasis || "percentage",
    );
    setDeductionType(
      policy.deductionType === "hour" || policy.deductionType === "per_hour"
        ? "half_day"
        : policy.deductionType || "half_day",
    );
    setDeductionValue(policy.deductionValue || "");

    const sharedBuf = policy.bufferTime || policy.minDuration || "15";
    setMinDuration(policy.minDuration || sharedBuf);
    setBufferTime(sharedBuf);

    setLimitWeekly(policy.limitWeekly || "2");
    setLimitMonthly(policy.limitMonthly || "4");
    setHalfDayBelowHours(policy.halfDayBelowHours || "3");
    setFullDayBelowHours(policy.fullDayBelowHours || "1");
    setEnableFullDayThreshold(!!policy.enableFullDayThreshold);
    setLateCountLimit(policy.lateCountLimit || "22");
    setLateWithinDays(policy.lateWithinDays || "15");
    setShiftMode(policy.shiftMode || "general");
    setPunchInTime(policy.punchInTime || "09:00");
    setPunchOutTime(policy.punchOutTime || "18:00");
    setShifts(
      policy.shifts?.length
        ? policy.shifts.map((s) => ({
            ...s,
            bufferTime: sharedBuf,
          }))
        : [
            {
              id: "default",
              name: "General",
              punchInTime: policy.punchInTime || "09:00",
              bufferTime: sharedBuf,
              punchOutTime: policy.punchOutTime || "18:00",
            },
          ],
    );
    setSkipIfRegularised(policy.skipIfRegularised !== false);
    setPolicyStatus(policy.policyStatus || "active");
    setEffectiveFrom(
      policy.effectiveFrom || new Date().toISOString().slice(0, 10),
    );
    setEffectiveTill(policy.effectiveTill || "");
    setNoExpiry(!!policy.noExpiry);
    setSelectedGroups(policy.selectedGroups || []);
    setSelectedEmployees(policy.selectedEmployees || []);
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
    setMinDuration(empty.minDuration);
    setBufferTime(empty.bufferTime);
    setLimitWeekly(empty.limitWeekly);
    setLimitMonthly(empty.limitMonthly);
    setHalfDayBelowHours(empty.halfDayBelowHours);
    setFullDayBelowHours(empty.fullDayBelowHours);
    setEnableFullDayThreshold(empty.enableFullDayThreshold);
    setLateCountLimit(empty.lateCountLimit);
    setLateWithinDays(empty.lateWithinDays);
    setShiftMode(empty.shiftMode);
    setPunchInTime(empty.punchInTime);
    setPunchOutTime(empty.punchOutTime);
    setShifts([{ ...emptyShift(), bufferTime: empty.bufferTime }]);
    setSkipIfRegularised(empty.skipIfRegularised);
    setPolicyStatus(empty.policyStatus);
    setEffectiveFrom(empty.effectiveFrom);
    setEffectiveTill(empty.effectiveTill);
    setNoExpiry(empty.noExpiry);
    setSelectedGroups([]);
    setSelectedEmployees([]);
    setSearchText("");
    setEmpSearch("");
    setAssignmentTab("groups");
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
      setError(getApiErrorMessage(err, "Failed to delete policy."));
    } finally {
      setDeleteLoading(false);
    }
  };

  const addShift = () => {
    setShifts((prev) => [
      ...prev,
      {
        ...emptyShift(),
        name: `Shift ${prev.length + 1}`,
        bufferTime: minDuration || bufferTime || "15",
      },
    ]);
  };

  const updateShift = (id, field, value) => {
    if (field === "bufferTime") {
      setMinDurationAndBuffer(value);
      return;
    }
    setShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const removeShift = (id) => {
    setShifts((prev) =>
      prev.length <= 1 ? prev : prev.filter((s) => s.id !== id),
    );
  };

  const buildPayload = () => {
    const sharedBuffer = Number(minDuration) || Number(bufferTime) || 0;

    const base = {
      policyName: policyName.trim(),
      description: description.trim(),
      policyType,
      appliesTo,
      deductionBasis,
      deductionType,
      deductionValue: Number(deductionValue) || 0,
      minDuration: sharedBuffer,
      limitWeekly: Number(limitWeekly) || 0,
      limitMonthly: Number(limitMonthly) || 0,
      halfDayBelowHours: Number(halfDayBelowHours) || 0,
      fullDayBelowHours: Number(fullDayBelowHours) || 0,
      enableFullDayThreshold,
      lateCountLimit: Number(lateCountLimit) || 0,
      lateWithinDays: Number(lateWithinDays) || 0,
      skipIfRegularised,
      policyStatus,
      effectiveFrom,
      effectiveTill: noExpiry ? null : effectiveTill || null,
      noExpiry,
      selectedGroups: [...selectedGroups],
      selectedEmployees: selectedEmployees.map((e) => ({
        id: e.id,
        name: e.name,
      })),
    };

    if (isLateLogin) {
      base.shiftMode = shiftMode;
      base.bufferTime = sharedBuffer;
      if (shiftMode === "general") {
        base.punchInTime = punchInTime;
        base.punchOutTime = punchOutTime;
        base.shifts = [
          {
            name: "General",
            punchInTime,
            bufferTime: sharedBuffer,
            punchOutTime,
          },
        ];
      } else {
        base.shifts = shifts.map((s) => ({
          name: s.name || "Shift",
          punchInTime: s.punchInTime,
          bufferTime: sharedBuffer,
          punchOutTime: s.punchOutTime,
        }));
        if (shifts[0]) {
          base.punchInTime = shifts[0].punchInTime;
          base.punchOutTime = shifts[0].punchOutTime;
        }
      }
    }

    return base;
  };

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
    try {
      setSaveLoading(true);
      const payload = buildPayload();
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

  const getEmployeeExistingPolicy = (empId) => {
    const key = String(empId);
    return employeePolicyMap[key] || null;
  };

  const toggleEmployee = (emp) => {
    const exists = selectedEmployees.some((e) => e.id === emp.id);
    if (exists) {
      setSelectedEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      return;
    }

    const existing = getEmployeeExistingPolicy(emp.id);
    if (existing) {
      window.alert(
        `${emp.name || emp.id} is already assigned to policy “${existing.policyName}”.\n\nAn employee can only be in one policy. Remove them from that policy first, then assign here.`,
      );
      return;
    }

    setSelectedEmployees((prev) => [...prev, { id: emp.id, name: emp.name }]);
  };

  const isEmployeeSelected = (id) => selectedEmployees.some((e) => e.id === id);

  const policyTypeLabel =
    policyType === "late_login"
      ? "Late Login"
      : policyType === "miss_punch_out"
        ? "Miss Punch Out"
        : "Less Login Hours";

  const summary = {
    policyType: policyTypeLabel,
    deductionType: deductionType === "half_day" ? "Half Day" : "Full Day",
    limits: isLessHours
      ? `Half < ${halfDayBelowHours}h${enableFullDayThreshold ? ` · Full < ${fullDayBelowHours}h` : ""}`
      : isLateLogin
        ? `${lateCountLimit} late in ${lateWithinDays} days · min ${minDuration}m`
        : `W:${limitWeekly} M:${limitMonthly}`,
    shiftInfo: isLateLogin
      ? shiftMode === "general"
        ? `General ${punchInTime}–${punchOutTime} (buf ${bufferTime}m)`
        : `${shifts.length} shifts (buf ${bufferTime}m)`
      : "—",
    appliesTo:
      appliesTo === "all"
        ? "All Employees"
        : `${selectedGroups.length} Dept · ${selectedEmployees.length} Emp`,
    policyStatus: policyStatus === "active" ? "Active" : "Inactive",
    skipIfRegularised: skipIfRegularised ? "Yes" : "No",
  };

  const validitySectionNum = isLateLogin ? "4" : "3";
  const assignSectionNum = isLateLogin ? "5" : "4";

  if (!isOpen) return null;

  /* ───── LIST VIEW ───── */
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
                Late login, miss punch-out and less login hours deduction rules.
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
                    <th style={{ width: 140 }}>Type</th>
                    <th style={{ width: 100 }}>Status</th>
                    <th style={{ width: 120, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listLoading ? (
                    <tr>
                      <td colSpan={4} className="pp-list-empty">
                        Loading policies...
                      </td>
                    </tr>
                  ) : filteredPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="pp-list-empty">
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
                        <td style={{ fontSize: 13, color: "#475569" }}>
                          {policy.policyType === "late_login"
                            ? "Late Login"
                            : policy.policyType === "miss_punch_out"
                              ? "Miss Punch Out"
                              : policy.policyType === "less_login_hours"
                                ? "Less Login Hours"
                                : policy.policyType}
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

  /* ───── FORM VIEW ───── */
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
              Configure rules by policy type for pay deduction.
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
                      placeholder="e.g. Late Login – Factory"
                    />
                  </div>
                  <div className="pp-field">
                    <label>
                      Policy Type <span className="required">*</span>
                    </label>
                    <select
                      value={policyType}
                      onChange={(e) => setPolicyType(e.target.value)}
                    >
                      <option value="late_login">1. Late Login</option>
                      <option value="miss_punch_out">2. Miss Punch Out</option>
                      <option value="less_login_hours">
                        3. Less Login Hours
                      </option>
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
                      <span>Specific Departments / Employees</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Deduction Configuration */}
              <div className="pp-section">
                <h3 className="pp-section-title">2. Deduction Configuration</h3>
                <p className="pp-section-desc">
                  {isLateLogin &&
                    "Set min duration (same as buffer) and late count within days. When exceeded, Half/Full Day deduction applies. Approved regularisation skips deduction."}
                  {isMissPunchOut &&
                    "Set free miss punch-out counts (Weekly / Monthly). When exceeded, Half/Full Day deduction applies. Approved regularisation skips deduction."}
                  {isLessHours &&
                    "Set worked-hours thresholds. Below threshold → Half Day / Full Day. Approved regularisation skips deduction."}
                </p>

                {isLateLogin && (
                  <>
                    <div className="pp-field" style={{ marginBottom: 16 }}>
                      <label>
                        Min Duration (count as late after){" "}
                        <span style={{ color: "#64748b", fontWeight: 400 }}>
                          = Buffer Time
                        </span>
                      </label>
                      <div className="pp-short-input">
                        <input
                          type="number"
                          min="0"
                          value={minDuration}
                          onChange={(e) =>
                            setMinDurationAndBuffer(e.target.value)
                          }
                        />
                        <span>mins</span>
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          marginTop: 6,
                        }}
                      >
                        Changing this also updates Buffer Time in Other
                        Settings.
                      </p>
                    </div>
                    <div
                      className="pp-grid pp-grid-two"
                      style={{ marginBottom: 8 }}
                    >
                      <div className="pp-field">
                        <label>Late count limit</label>
                        <div
                          className="pp-short-input"
                          style={{ width: "100%" }}
                        >
                          <input
                            type="number"
                            min="1"
                            value={lateCountLimit}
                            onChange={(e) => setLateCountLimit(e.target.value)}
                          />
                          <span>times</span>
                        </div>
                      </div>
                      <div className="pp-field">
                        <label>Within days</label>
                        <div
                          className="pp-short-input"
                          style={{ width: "100%" }}
                        >
                          <input
                            type="number"
                            min="1"
                            value={lateWithinDays}
                            onChange={(e) => setLateWithinDays(e.target.value)}
                          />
                          <span>days</span>
                        </div>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginBottom: 16,
                      }}
                    >
                      Example: {lateCountLimit || "22"} late logins within{" "}
                      {lateWithinDays || "15"} days → deduction applies.
                    </p>
                  </>
                )}

                {isMissPunchOut && (
                  <div
                    className="pp-grid pp-grid-two"
                    style={{ marginBottom: 16 }}
                  >
                    <div className="pp-field">
                      <label>Free limit – Weekly</label>
                      <div className="pp-short-input" style={{ width: "100%" }}>
                        <input
                          type="number"
                          min="0"
                          value={limitWeekly}
                          onChange={(e) => setLimitWeekly(e.target.value)}
                        />
                        <span>times</span>
                      </div>
                    </div>
                    <div className="pp-field">
                      <label>Free limit – Monthly</label>
                      <div className="pp-short-input" style={{ width: "100%" }}>
                        <input
                          type="number"
                          min="0"
                          value={limitMonthly}
                          onChange={(e) => setLimitMonthly(e.target.value)}
                        />
                        <span>times</span>
                      </div>
                    </div>
                  </div>
                )}

                {isLessHours && (
                  <div
                    className="pp-grid pp-grid-two"
                    style={{ marginBottom: 16 }}
                  >
                    <div className="pp-field">
                      <label>
                        Half Day if worked hours &lt;{" "}
                        <span className="required">*</span>
                      </label>
                      <div className="pp-short-input" style={{ width: "100%" }}>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={halfDayBelowHours}
                          onChange={(e) => setHalfDayBelowHours(e.target.value)}
                        />
                        <span>hours</span>
                      </div>
                    </div>
                    <div className="pp-field">
                      <label
                        className="pp-flag-row"
                        style={{ marginBottom: 8 }}
                      >
                        <input
                          type="checkbox"
                          checked={enableFullDayThreshold}
                          onChange={(e) =>
                            setEnableFullDayThreshold(e.target.checked)
                          }
                        />
                        <span>Full Day if worked hours &lt;</span>
                      </label>
                      {enableFullDayThreshold && (
                        <div
                          className="pp-short-input"
                          style={{ width: "100%" }}
                        >
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={fullDayBelowHours}
                            onChange={(e) =>
                              setFullDayBelowHours(e.target.value)
                            }
                          />
                          <span>hours</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pp-field">
                  <label>When limit / threshold is exceeded — Apply As</label>
                  <div className="pp-radio-row">
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

                <div className="pp-field" style={{ marginTop: 16 }}>
                  <label>
                    Deduction Value <span className="required">*</span>
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
                      style={{ flex: 1, maxWidth: 200 }}
                      placeholder={
                        deductionBasis === "percentage" ? "e.g. 50" : "e.g. 200"
                      }
                    />
                    <span style={{ color: "#6b7280", fontSize: 14 }}>
                      {deductionBasis === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                </div>

                <label className="pp-flag-row" style={{ marginTop: 16 }}>
                  <input
                    type="checkbox"
                    checked={skipIfRegularised}
                    onChange={(e) => setSkipIfRegularised(e.target.checked)}
                  />
                  <span>
                    Do not apply deduction if attendance regularisation is
                    approved
                  </span>
                </label>
              </div>

              {/* 3. Other Settings — LATE LOGIN ONLY */}
              {isLateLogin && (
                <div className="pp-section">
                  <h3 className="pp-section-title">3. Other Settings</h3>
                  <p className="pp-section-desc">
                    Configure shift timings. Buffer Time is linked to Min
                    Duration (count as late after). Late count limits are set in
                    Deduction Configuration.
                  </p>

                  <div className="pp-field" style={{ marginBottom: 16 }}>
                    <label>Shift Type</label>
                    <div className="pp-radio-row">
                      <label
                        className={`pp-radio ${shiftMode === "general" ? "active" : ""}`}
                      >
                        <input
                          type="radio"
                          name="shiftMode"
                          checked={shiftMode === "general"}
                          onChange={() => setShiftMode("general")}
                        />
                        <span>General Shift</span>
                      </label>
                      <label
                        className={`pp-radio ${shiftMode === "multiple" ? "active" : ""}`}
                      >
                        <input
                          type="radio"
                          name="shiftMode"
                          checked={shiftMode === "multiple"}
                          onChange={() => setShiftMode("multiple")}
                        />
                        <span>Multiple Shifts</span>
                      </label>
                    </div>
                  </div>

                  {shiftMode === "general" && (
                    <div
                      className="pp-grid pp-grid-three"
                      style={{ marginBottom: 16 }}
                    >
                      <div className="pp-field">
                        <label>Punch In Time</label>
                        <input
                          type="time"
                          value={punchInTime}
                          onChange={(e) => setPunchInTime(e.target.value)}
                        />
                      </div>
                      <div className="pp-field">
                        <label>
                          Buffer Time{" "}
                          <span style={{ color: "#64748b", fontWeight: 400 }}>
                            = Min Duration
                          </span>
                        </label>
                        <div
                          className="pp-short-input"
                          style={{ width: "100%" }}
                        >
                          <input
                            type="number"
                            min="0"
                            value={bufferTime}
                            onChange={(e) =>
                              setMinDurationAndBuffer(e.target.value)
                            }
                          />
                          <span>mins</span>
                        </div>
                      </div>
                      <div className="pp-field">
                        <label>Punch Out Time</label>
                        <input
                          type="time"
                          value={punchOutTime}
                          onChange={(e) => setPunchOutTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {shiftMode === "multiple" && (
                    <div style={{ marginBottom: 16 }}>
                      {shifts.map((s, idx) => (
                        <div
                          key={s.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 14,
                            padding: 14,
                            marginBottom: 12,
                            background: "#f8fafc",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 10,
                            }}
                          >
                            <div
                              className="pp-field"
                              style={{ flex: 1, marginRight: 12 }}
                            >
                              <label>Shift Name</label>
                              <input
                                type="text"
                                value={s.name}
                                onChange={(e) =>
                                  updateShift(s.id, "name", e.target.value)
                                }
                                placeholder={`Shift ${idx + 1}`}
                              />
                            </div>
                            {shifts.length > 1 && (
                              <button
                                type="button"
                                className="pp-icon-btn danger"
                                title="Remove shift"
                                onClick={() => removeShift(s.id)}
                                style={{ marginTop: 18 }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <div className="pp-grid pp-grid-three">
                            <div className="pp-field">
                              <label>Punch In</label>
                              <input
                                type="time"
                                value={s.punchInTime}
                                onChange={(e) =>
                                  updateShift(
                                    s.id,
                                    "punchInTime",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="pp-field">
                              <label>
                                Buffer{" "}
                                <span
                                  style={{
                                    color: "#64748b",
                                    fontWeight: 400,
                                  }}
                                >
                                  = Min Duration
                                </span>
                              </label>
                              <div
                                className="pp-short-input"
                                style={{ width: "100%" }}
                              >
                                <input
                                  type="number"
                                  min="0"
                                  value={s.bufferTime}
                                  onChange={(e) =>
                                    updateShift(
                                      s.id,
                                      "bufferTime",
                                      e.target.value,
                                    )
                                  }
                                />
                                <span>mins</span>
                              </div>
                            </div>
                            <div className="pp-field">
                              <label>Punch Out</label>
                              <input
                                type="time"
                                value={s.punchOutTime}
                                onChange={(e) =>
                                  updateShift(
                                    s.id,
                                    "punchOutTime",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="pp-btn pp-btn-secondary pp-btn-sm"
                        onClick={addShift}
                      >
                        <Plus size={14} style={{ marginRight: 6 }} />
                        Add Shift
                      </button>
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
              )}

              {!isLateLogin && (
                <div className="pp-section">
                  <h3 className="pp-section-title">3. Policy Status</h3>
                  <div className="pp-field">
                    <label>Status</label>
                    <select
                      value={policyStatus}
                      onChange={(e) => setPolicyStatus(e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pp-section">
                <h3 className="pp-section-title">
                  {validitySectionNum}. Policy Validity
                </h3>
                <div className="pp-grid pp-grid-two">
                  <div className="pp-field">
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

            {/* Assignment panel */}
            <aside className="pp-assignment-panel">
              <h3 className="pp-assignment-title">
                {assignSectionNum}. Assign Policy To
              </h3>
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
                        Loading...
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
                    Departments: {selectedGroups.length}
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
                  <p
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      marginBottom: 8,
                      paddingLeft: 2,
                    }}
                  >
                    Employees already on another policy cannot be selected.
                  </p>
                  <div className="pp-group-list" style={{ maxHeight: 280 }}>
                    {assignmentLoading ? (
                      <div
                        style={{ padding: 12, color: "#94a3b8", fontSize: 13 }}
                      >
                        Loading...
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
                            const existing = getEmployeeExistingPolicy(emp.id);
                            const blocked = !!existing && !selected;
                            return (
                              <button
                                key={emp.id}
                                type="button"
                                className={`pp-group-item ${selected ? "selected" : ""} ${blocked ? "disabled" : ""}`}
                                onClick={() => toggleEmployee(emp)}
                                style={{
                                  marginBottom: 4,
                                  opacity: blocked ? 0.55 : 1,
                                  cursor: blocked ? "not-allowed" : "pointer",
                                }}
                                title={
                                  blocked
                                    ? `Already in “${existing.policyName}”`
                                    : undefined
                                }
                              >
                                <div style={{ flex: 1, textAlign: "left" }}>
                                  <div style={{ fontWeight: 500 }}>
                                    {emp.name}
                                  </div>
                                  <div
                                    style={{ fontSize: 11, color: "#94a3b8" }}
                                  >
                                    {emp.id}
                                    {blocked && (
                                      <span
                                        style={{
                                          color: "#b91c1c",
                                          marginLeft: 6,
                                        }}
                                      >
                                        · in “{existing.policyName}”
                                      </span>
                                    )}
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
                    Employees: {selectedEmployees.length}
                  </div>
                </>
              )}

              <div className="pp-summary-box">
                <h4>Policy Summary</h4>
                <div className="pp-summary-list">
                  <div className="pp-summary-row">
                    <span>Type</span>
                    <strong>{summary.policyType}</strong>
                  </div>
                  <div className="pp-summary-row">
                    <span>Apply As</span>
                    <strong>{summary.deductionType}</strong>
                  </div>
                  <div className="pp-summary-row">
                    <span>Limits</span>
                    <strong>{summary.limits}</strong>
                  </div>
                  {isLateLogin && (
                    <div className="pp-summary-row">
                      <span>Shift</span>
                      <strong>{summary.shiftInfo}</strong>
                    </div>
                  )}
                  <div className="pp-summary-row">
                    <span>Skip if Regularised</span>
                    <strong>{summary.skipIfRegularised}</strong>
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
                Policy applies to selected departments / employees.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
