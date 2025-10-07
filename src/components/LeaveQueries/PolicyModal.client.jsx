// src/components/PolicyModal.js
"use client";

import React, { useState, useEffect, useRef } from "react";
import "./PolicyModal.css";
import {
  MdOutlineCancel,
  MdDeleteOutline,
  MdAddCircleOutline,
  MdOutlineEdit,
} from "react-icons/md";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client"; // auth context

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const headers = {
  "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
  "Content-Type": "application/json",
};

const BUILT_IN = [
  { key: "casual", label: "Casual Leave" },
  { key: "earned", label: "Earned Leave" },
];

export default function PolicyModal({
  isOpen,
  onClose,
  onSaved,
  openPolicyId = null,
}) {
  const { userData, setUserData } = useAuth();

  const [policies, setPolicies] = useState([]);
  const [alert, setAlert] = useState(null);
  const [policyAlerts, setPolicyAlerts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({
    isVisible: false,
    id: null,
    loading: false,
    message: "Are you sure you want to delete this policy?",
  });

  const [form, setForm] = useState({
    id: null,
    period: "yearly",
    yearStart: "",
    yearEnd: "",
    config: BUILT_IN.reduce((acc, { key }) => {
      acc[key] = {
        enabled: false,
        value: "",
        carryForward: "",
        advanceNoticeDays: "",
        ...(key === "earned" ? { workingDays: "", earnedLeaves: "" } : {}),
      };
      return acc;
    }, {}),
    extras: [],
  });

  const autoOpenedRef = useRef(null);
  const showAlert = (msg) => setAlert(msg);
  const clearAlert = () => setAlert(null);

  // ---------------- ALERT LOGIC ----------------
  const daysUntil = (dateStr) => {
    if (!dateStr) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  };

  const computePolicyAlerts = (policyList = []) => {
    return (policyList || [])
      .map((p) => {
        const daysLeft = daysUntil(p.year_end);
        if (daysLeft < 0) return null;
        let severity = null;
        if (daysLeft <= 5) severity = "critical";
        else if (daysLeft <= 10) severity = "warning";
        if (!severity) return null;
        return { id: p.id, policy: p, daysLeft, severity };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const sevOrder = { critical: 0, warning: 1 };
        if (sevOrder[a.severity] !== sevOrder[b.severity])
          return sevOrder[a.severity] - sevOrder[b.severity];
        return a.daysLeft - b.daysLeft;
      });
  };

  useEffect(() => {
    setPolicyAlerts(computePolicyAlerts(policies));
  }, [policies]);

  // ---------------- FETCH POLICIES ----------------
  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/leave-policies`, { headers });
        const json = await res.json();
        const list = json.data || [];
        setPolicies(list);
        runAutoExtendOnLoad(list);
      } catch {
        showAlert("Could not load policies.");
      }
    })();

    resetForm();
    autoOpenedRef.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || openPolicyId == null || !policies.length) return;
    if (autoOpenedRef.current === String(openPolicyId)) return;
    const found = policies.find((p) => String(p.id) === String(openPolicyId));
    if (found) {
      onEdit(found);
      autoOpenedRef.current = String(openPolicyId);
    }
  }, [policies, openPolicyId, isOpen]);

  // ---------------- FORM HELPERS ----------------
  const resetForm = () =>
    setForm({
      id: null,
      period: "yearly",
      yearStart: "",
      yearEnd: "",
      config: BUILT_IN.reduce((acc, { key }) => {
        acc[key] = {
          enabled: false,
          value: "",
          carryForward: "",
          advanceNoticeDays: "",
          ...(key === "earned" ? { workingDays: "", earnedLeaves: "" } : {}),
        };
        return acc;
      }, {}),
      extras: [],
    });

  const updateForm = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateConfig = (key, patch) =>
    setForm((f) => ({
      ...f,
      config: { ...f.config, [key]: { ...f.config[key], ...patch } },
    }));
  const addExtra = () =>
    updateForm({
      extras: [
        ...form.extras,
        {
          id: Date.now(),
          label: "",
          value: "",
          carryForward: "",
          advanceNoticeDays: "",
        },
      ],
    });
  const removeExtra = (id) =>
    updateForm({ extras: form.extras.filter((r) => r.id !== id) });
  const updateExtra = (id, patch) =>
    updateForm({
      extras: form.extras.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });

  const onEdit = (policy) => {
    const cfg = BUILT_IN.reduce((acc, { key }) => {
      const s =
        (policy.leave_settings || []).find((ls) => ls.type === key) || {};
      acc[key] = {
        enabled: !!s.enabled,
        value: s.value ?? "",
        carryForward: s.carry_forward ?? "",
        advanceNoticeDays: s.advance_notice_days ?? "",
        workingDays: s.working_days ?? "",
        earnedLeaves: s.earned_leaves ?? "",
      };
      return acc;
    }, {});
    const extras = (policy.leave_settings || [])
      .filter((ls) => !BUILT_IN.some((b) => b.key === ls.type))
      .map((ls) => ({
        id: Date.now() + Math.random(),
        label: ls.type,
        value: ls.value ?? "",
        carryForward: ls.carry_forward ?? "",
        advanceNoticeDays: ls.advance_notice_days ?? "",
      }));
    setForm({
      id: policy.id,
      period: policy.period,
      yearStart: policy.year_start,
      yearEnd: policy.year_end,
      config: cfg,
      extras,
    });
    clearAlert();
  };

  const hasOverlappingPolicy = (yearStart, yearEnd, ignoreId = null) => {
    if (!yearStart || !yearEnd) return false;
    const newStart = new Date(yearStart);
    const newEnd = new Date(yearEnd);
    newStart.setHours(0, 0, 0, 0);
    newEnd.setHours(0, 0, 0, 0);
    return policies.some((p) => {
      if (ignoreId && p.id === ignoreId) return false;
      if (!p.year_start || !p.year_end) return false;
      const existingStart = new Date(p.year_start);
      const existingEnd = new Date(p.year_end);
      existingStart.setHours(0, 0, 0, 0);
      existingEnd.setHours(0, 0, 0, 0);
      return newStart <= existingEnd && existingStart <= newEnd;
    });
  };

  // ---------------- HANDLE SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, period, yearStart, yearEnd, config, extras } = form;

    if (hasOverlappingPolicy(yearStart, yearEnd, id)) {
      showAlert(
        id
          ? "Another policy already uses this date range."
          : "Policy already exists for this date range."
      );
      return;
    }

    const settings = [
      ...BUILT_IN.filter(({ key }) => config[key].enabled).map(({ key }) => ({
        type: key,
        enabled: true,
        ...(key === "earned"
          ? {
              working_days: Number(config.earned.workingDays) || 0,
              earned_leaves: Number(config.earned.earnedLeaves) || 0,
            }
          : { value: Number(config[key].value) || 0 }),
        carry_forward: Number(config[key].carryForward) || 0,
        advance_notice_days: Number(config[key].advanceNoticeDays || 0),
      })),
      ...extras.map(({ label, value, carryForward, advanceNoticeDays }) => ({
        type: (label || "").trim() || "Custom",
        enabled: true,
        value: Number(value) || 0,
        carry_forward: Number(carryForward) || 0,
        advance_notice_days: Number(advanceNoticeDays || 0),
      })),
    ];

    const payload = {
      period,
      year_start: yearStart,
      year_end: yearEnd,
      leave_settings: settings,
    };
    const url = id
      ? `${API_BASE}/api/leave-policies/${id}`
      : `${API_BASE}/api/leave-policies`;

    try {
      const res = await fetch(url, {
        method: id ? "PUT" : "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const fresh = await fetch(`${API_BASE}/api/leave-policies`, { headers });
      const json = await fresh.json();
      setPolicies(json.data || []);
      if (typeof onSaved === "function") onSaved();
      onClose();
    } catch {
      showAlert("Failed to save policy.");
    }
  };

  // ---------------- AUTH-BASED ALERTS STORAGE ----------------
  useEffect(() => {
    if (!userData) return;
    try {
      const store = policyAlerts.map((a) => ({
        id: `policy-${a.id}`,
        type: "policy",
        message:
          a.severity === "critical"
            ? `Policy ending soon — ${a.daysLeft} day${
                a.daysLeft !== 1 ? "s" : ""
              } left`
            : `Policy ending in ${a.daysLeft} day${
                a.daysLeft !== 1 ? "s" : ""
              }`,
        policyId: a.id,
        year_start: a.policy.year_start,
        year_end: a.policy.year_end,
        daysLeft: a.daysLeft,
        severity: a.severity,
        triggered_at: new Date().toISOString(),
      }));
      setUserData({ ...userData, policyAlerts: store });
    } catch (err) {
      console.error("Failed to persist policy alerts:", err);
    }
  }, [policyAlerts, userData, setUserData]);

  // ---------------- UI ----------------
  if (!isOpen) return null;

  return (
    <div className="policy-modal-overlay">
      {/* Modal content remains mostly unchanged */}
      {/* ... keep your form, table, and confirmation Modal as-is ... */}
    </div>
  );
}
