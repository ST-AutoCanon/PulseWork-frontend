
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
import { useAuth } from "../../context/AuthProvider.client";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const BUILT_IN = [
  { key: "casual", label: "Casual Leave" },
  { key: "earned", label: "Earned Leave" },
];

// normalizeLeaveTypes helper
function normalizeKey(s = "") {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}
function prettyFromKey(s = "") {
  return String(s)
    .replace(/[_-]+/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}
function normalizeLeaveTypes(raw = []) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((t) => {
    if (typeof t === "string") {
      const key = normalizeKey(t);
      return { key, label: prettyFromKey(key), raw: t, is_active: true };
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
      label: label || prettyFromKey(key),
      gender: t.gender ?? t.gender_name ?? null,
      min_age: t.min_age ?? t.minAge ?? null,
      max_age: t.max_age ?? t.maxAge ?? null,
      is_active:
        typeof t.is_active === "boolean" ? t.is_active : (t.active ?? true),
      ...t,
    };
  });
}

export default function PolicyModal({
  isOpen,
  onClose,
  onSaved,
  openPolicyId = null,
}) {
  const { user } = useAuth();
  const employeeId = user?.employeeId ?? null;
  const orgId = user?.orgId ?? user?.org_id ?? null;

  // build headers at time of request (so we never send stale/undefined values)
  const buildHeaders = () => {
    const h = { "Content-Type": "application/json" };
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey) h["x-api-key"] = apiKey;
    if (employeeId) h["x-employee-id"] = employeeId;
    if (orgId) h["x-org-id"] = orgId;
    return h;
  };

  const [policies, setPolicies] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]); // fetched & normalized: { key, label, ... }
  const [alert, setAlert] = useState(null);
  const [policyAlerts, setPolicyAlerts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({
    isVisible: false,
    id: null,
    loading: false,
    message: "Are you sure you want to delete this policy?",
  });

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

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

  const daysUntil = (dateStr) => {
    if (!dateStr) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
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

  useEffect(() => {
    if (!isOpen) return;

    const aborter = new AbortController();
    (async () => {
      setLoading(true);
      setLoadError(null);
      clearAlert();
      try {
        // --- FETCH POLICIES (force fresh to avoid ETag cache) ---
        const headers = buildHeaders();
        const policyUrl = `${API_BASE}/api/leave-policies?_=${Date.now()}`;
        const pRes = await fetch(policyUrl, {
          credentials: "include",
          headers,
          signal: aborter.signal,
          cache: "no-store",
        });
        let pJson = null;
        try {
          pJson = await pRes.json();
        } catch (_) {
          pJson = null;
        }
        // handle different response shapes:
        // - data: [] (simple array)
        // - data: { policies: [...], defaultLeaveSettings: [...] }
        // - top-level array
        let list = [];
        if (pRes.ok) {
          if (Array.isArray(pJson?.data)) list = pJson.data;
          else if (pJson?.data && Array.isArray(pJson.data.policies))
            list = pJson.data.policies;
          else if (Array.isArray(pJson)) list = pJson;
          else if (pJson?.data && Array.isArray(pJson.data)) list = pJson.data;
          else list = [];
          setPolicies(list);
          setLoadError(null);
        } else {
          setPolicies([]);
          setLoadError("Could not load policies.");
        }

        // --- FETCH LEAVE TYPES (try /types) ---
        try {
          const typesUrl = `${API_BASE}/types`;
          let tRes = await fetch(typesUrl, {
            credentials: "include",
            headers: buildHeaders(),
            signal: aborter.signal,
            cache: "no-store",
          });

          if (tRes.status === 404) {
            // no namespaced endpoint; still try again (same URL fallback is harmless)
            tRes = await fetch(typesUrl, {
              credentials: "include",
              headers: buildHeaders(),
              signal: aborter.signal,
              cache: "no-store",
            });
          }

          if (tRes.ok) {
            const tJson = await tRes.json().catch(() => null);
            const arr = Array.isArray(tJson?.data)
              ? tJson.data
              : Array.isArray(tJson)
                ? tJson
                : [];
            const normalized = normalizeLeaveTypes(arr);
            setLeaveTypes(normalized);
          } else {
            setLeaveTypes([]);
          }
        } catch (err) {
          console.warn("PolicyModal: Failed to load leave types:", err);
          setLeaveTypes([]);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("PolicyModal: Failed to fetch policies:", err);
        setPolicies([]);
        setLoadError("Could not load policies.");
      } finally {
        setLoading(false);
      }
    })();

    resetForm();
    autoOpenedRef.current = null;

    return () => aborter.abort();
  }, [isOpen, employeeId, orgId, onSaved]);

  useEffect(() => {
    if (!isOpen || openPolicyId == null) return;
    if (!policies || policies.length === 0) return;
    if (autoOpenedRef.current === String(openPolicyId)) return;
    const found = policies.find((p) => String(p.id) === String(openPolicyId));
    if (found) {
      onEdit(found);
      autoOpenedRef.current = String(openPolicyId);
    }
  }, [policies, openPolicyId, isOpen]);

  function resetForm() {
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
    clearAlert();
  }

  useEffect(() => {
    if (!form.yearStart) {
      setForm((f) => ({ ...f, yearEnd: "" }));
      return;
    }
    const start = new Date(form.yearStart);
    const end = new Date(start);
    if (form.period === "half") end.setMonth(end.getMonth() + 6);
    else if (form.period === "quarter") end.setMonth(end.getMonth() + 3);
    else end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);
    setForm((f) => ({ ...f, yearEnd: end.toISOString().split("T")[0] }));
  }, [form.yearStart, form.period]);

  const updateForm = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateConfig = (key, patch) =>
    setForm((f) => ({
      ...f,
      config: { ...f.config, [key]: { ...f.config[key], ...patch } },
    }));

  // Add a blank extra row — admin must pick a leave type from dropdown
  const addExtra = () => {
    updateForm({
      extras: [
        ...form.extras,
        {
          id: Date.now() + Math.random(),
          typeKey: "", // leaveTypes key
          value: "",
          carryForward: "",
          advanceNoticeDays: "",
        },
      ],
    });
  };

  const removeExtra = (id) =>
    updateForm({ extras: form.extras.filter((r) => r.id !== id) });
  const updateExtra = (id, patch) =>
    setForm((f) => ({
      ...f,
      extras: f.extras.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

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
      .map((ls) => {
        const found = (leaveTypes || []).find(
          (t) => String(t.key).toLowerCase() === String(ls.type).toLowerCase(),
        );
        if (found) {
          return {
            id: Date.now() + Math.random(),
            typeKey: found.key,
            value: ls.value ?? "",
            carryForward: ls.carry_forward ?? "",
            advanceNoticeDays: ls.advance_notice_days ?? "",
          };
        } else {
          const missingKey = String(ls.type || "custom").trim();
          setLeaveTypes((prev) => {
            const exists = (prev || []).some(
              (p) => String(p.key).toLowerCase() === missingKey.toLowerCase(),
            );
            if (exists) return prev;
            return [...(prev || []), { key: missingKey, label: missingKey }];
          });
          return {
            id: Date.now() + Math.random(),
            typeKey: missingKey,
            value: ls.value ?? "",
            carryForward: ls.carry_forward ?? "",
            advanceNoticeDays: ls.advance_notice_days ?? "",
          };
        }
      });

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
      if (p.year_start === yearStart) return true;
      const existingStart = new Date(p.year_start);
      const existingEnd = new Date(p.year_end);
      existingStart.setHours(0, 0, 0, 0);
      existingEnd.setHours(0, 0, 0, 0);
      return newStart <= existingEnd && existingStart <= newEnd;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, period, yearStart, yearEnd, config, extras } = form;

    if (hasOverlappingPolicy(yearStart, yearEnd, id)) {
      showAlert(
        id
          ? "Another policy already uses this date range. Choose different dates or edit the existing policy."
          : "A policy already exists for this start/end date (or overlaps). Please pick different dates or edit the existing policy.",
      );
      return;
    }

    for (const ex of extras) {
      if (!ex.typeKey || ex.typeKey.trim() === "") {
        showAlert("Please select a leave type for every added leave.");
        return;
      }
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
      ...extras.map(({ typeKey, value, carryForward, advanceNoticeDays }) => {
        const typeString = String(typeKey || "Custom");
        return {
          type: typeString,
          enabled: true,
          value: Number(value) || 0,
          carry_forward: Number(carryForward) || 0,
          advance_notice_days: Number(advanceNoticeDays || 0),
        };
      }),
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
        credentials: "include",
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      let resJson = null;
      try {
        resJson = await res.json();
      } catch (_) {
        resJson = null;
      }
      if (!res.ok) {
        const serverMsg =
          (resJson && (resJson.message || resJson.error)) ||
          `Save failed ${res.status}`;
        throw new Error(serverMsg);
      }

      // refetch policies (force fresh)
      const freshUrl = `${API_BASE}/api/leave-policies?_=${Date.now()}`;
      const fresh = await fetch(freshUrl, {
        credentials: "include",
        headers: buildHeaders(),
        cache: "no-store",
      });
      const freshJson = fresh.ok ? await fresh.json().catch(() => null) : null;
      if (fresh.ok) {
        let list = [];
        if (Array.isArray(freshJson?.data)) list = freshJson.data;
        else if (freshJson?.data && Array.isArray(freshJson.data.policies))
          list = freshJson.data.policies;
        else if (Array.isArray(freshJson)) list = freshJson;
        setPolicies(list);
        setLoadError(null);
      } else {
        setPolicies([]);
        setLoadError("Could not load policies.");
      }

      if (id) {
        try {
          localStorage.removeItem(`policyIgnored:${id}`);
          localStorage.removeItem(`policyExtended:${id}`);
        } catch (_) {}
      }

      if (typeof onSaved === "function") onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save policy:", err);
      showAlert("Failed to save policy.");
    }
  };

  const promptDelete = (id) =>
    setConfirmDelete({
      isVisible: true,
      id,
      loading: false,
      message: "Are you sure you want to delete this policy?",
    });

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    if (!id) {
      setConfirmDelete({
        isVisible: false,
        id: null,
        loading: false,
        message: "",
      });
      return;
    }
    setConfirmDelete((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch(`${API_BASE}/api/leave-policies/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: buildHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      const fresh = await fetch(`${API_BASE}/api/leave-policies`, {
        credentials: "include",
        headers: buildHeaders(),
        cache: "no-store",
      });
      if (fresh.ok) {
        const json = await fresh.json();
        const list = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
        setPolicies(list);
      } else {
        setPolicies([]);
      }
      try {
        localStorage.removeItem(`policyIgnored:${id}`);
        localStorage.removeItem(`policyExtended:${id}`);
      } catch (_) {}
      if (typeof onSaved === "function") onSaved();
      setConfirmDelete({
        isVisible: false,
        id: null,
        loading: false,
        message: "",
      });
    } catch (err) {
      console.error("Failed to delete:", err);
      setConfirmDelete((s) => ({ ...s, loading: false }));
      showAlert("Failed to delete policy.");
    }
  };

  const handleCancelDelete = () =>
    setConfirmDelete({
      isVisible: false,
      id: null,
      loading: false,
      message: "",
    });

  const handleIgnoreAlert = async (policy) => {
    try {
      const key = `policyIgnored:${policy.id}`;
      const ts = new Date().toISOString();
      localStorage.setItem(key, ts);
      showAlert(
        "Alert ignored — if the policy ends and no changes are made, it will be auto-extended up to 3 months.",
      );
      if (daysUntil(policy.year_end) < 0) {
        extendPolicyIfNeeded(policy, ts).catch((err) => {
          console.error("Auto-extend failed:", err);
        });
      }
    } catch (err) {
      console.error("Failed to record ignore:", err);
    }
  };

  const extendPolicyIfNeeded = async (
    policy,
    ignoredAtISO = null,
    monthsToAdd = 3,
  ) => {
    if (!policy || !policy.id || !policy.year_end) return false;
    const ignoredKey = `policyIgnored:${policy.id}`;
    const extendedKey = `policyExtended:${policy.id}`;

    try {
      if (!ignoredAtISO) ignoredAtISO = localStorage.getItem(ignoredKey);
      if (!ignoredAtISO) return false;
      if (localStorage.getItem(extendedKey)) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(policy.year_end);
      endDate.setHours(0, 0, 0, 0);

      if (endDate >= today) return false;

      if (policy.updated_at) {
        const updatedAt = new Date(policy.updated_at);
        const ignoredAt = new Date(ignoredAtISO);
        if (updatedAt > ignoredAt) return false;
      }

      const newEnd = new Date(policy.year_end);
      newEnd.setMonth(newEnd.getMonth() + monthsToAdd);
      newEnd.setHours(0, 0, 0, 0);
      const newEndISO = newEnd.toISOString().split("T")[0];

      const payload = {
        period: policy.period,
        year_start: policy.year_start,
        year_end: newEndISO,
        leave_settings: policy.leave_settings || [],
      };

      const res = await fetch(`${API_BASE}/api/leave-policies/${policy.id}`, {
        method: "PUT",
        credentials: "include",
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Extend API failed with status ${res.status}`);
      }

      localStorage.setItem(extendedKey, newEndISO);

      const fresh = await fetch(`${API_BASE}/api/leave-policies`, {
        credentials: "include",
        headers: buildHeaders(),
        cache: "no-store",
      });
      if (fresh.ok) {
        const json = await fresh.json();
        const list = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
        setPolicies(list);
      } else {
        setPolicies([]);
      }

      if (typeof onSaved === "function") onSaved();

      showAlert(
        `Policy automatically extended to ${newEnd.toLocaleDateString()} (grace extension).`,
      );
      return true;
    } catch (err) {
      console.error("extendPolicyIfNeeded error:", err);
      return false;
    }
  };

  const runAutoExtendOnLoad = async (policyList = []) => {
    if (!Array.isArray(policyList) || policyList.length === 0) return;
    for (const p of policyList) {
      try {
        const ignoredAt = localStorage.getItem(`policyIgnored:${p.id}`);
        if (!ignoredAt) continue;
        if (localStorage.getItem(`policyExtended:${p.id}`)) continue;
        if (daysUntil(p.year_end) < 0) {
          await extendPolicyIfNeeded(p, ignoredAt, 3);
        }
      } catch (err) {
        console.error("runAutoExtendOnLoad error for policy", p.id, err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="policy-modal-overlay">
      <div className="policy-modal">
        <header className="policy-modal-header">
          <h3>Leave Policy Management</h3>
          <MdOutlineCancel className="policy-modal-close" onClick={onClose} />
        </header>

        <section className="policy-modal-body">
          {loading ? (
            <div className="policy-alert">Loading policies…</div>
          ) : loadError ? (
            <div className="policy-alert error">{loadError}</div>
          ) : policies.length === 0 ? (
            <div className="policy-alert info">No policies found yet.</div>
          ) : null}

          {alert && <div className="policy-alert">{alert}</div>}

          {policyAlerts.length > 0 && (
            <div
              className="policy-alerts-banner"
              role="region"
              aria-live="polite"
            >
              {policyAlerts.map((a) => (
                <div
                  key={a.id}
                  className={`policy-alert-item ${
                    a.severity === "critical"
                      ? "alert-critical"
                      : "alert-warning"
                  }`}
                >
                  <div className="alert-left">
                    <div className="alert-title">
                      {a.severity === "critical"
                        ? "Policy ending soon — ACTION REQUIRED"
                        : "Policy ending soon"}
                    </div>
                    <div className="alert-body">
                      Policy period:{" "}
                      <strong>
                        {new Date(a.policy.year_start).toLocaleDateString()} —{" "}
                        {new Date(a.policy.year_end).toLocaleDateString()}
                      </strong>{" "}
                      •{" "}
                      <span className="days-left">
                        {a.daysLeft} day{a.daysLeft !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="alert-actions">
                    <button
                      type="button"
                      className="alert-btn view-btn"
                      onClick={() => onEdit(a.policy)}
                      title="Open policy in editor"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="alert-btn ignore-btn"
                      onClick={() => handleIgnoreAlert(a.policy)}
                      title="Ignore this alert; if no changes are made after end, policy will be auto-extended up to 3 months"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="leave-config-form">
            <div className="period-row">
              <label>Period</label>
              <select
                value={form.period}
                onChange={(e) => updateForm({ period: e.target.value })}
              >
                <option value="yearly">Yearly</option>
                <option value="half">Half-Yearly</option>
                <option value="quarter">Quarterly</option>
              </select>
            </div>

            <div className="year-range">
              <label>
                Start Date
                <input
                  type="date"
                  value={form.yearStart}
                  onChange={(e) => updateForm({ yearStart: e.target.value })}
                  required
                />
              </label>
              <label>
                End Date
                <input type="date" value={form.yearEnd} readOnly />
              </label>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                Add Leave Type from system
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  className="add-extra-btn"
                  onClick={addExtra}
                >
                  <MdAddCircleOutline /> Add Leave Type
                </button>
              </div>
            </div>

            <div className="leave-types-grid">
              {BUILT_IN.map(({ key, label }) => (
                <div key={key} className="leave-type-row">
                  <input
                    type="checkbox"
                    checked={!!form.config[key]?.enabled}
                    onChange={(e) =>
                      updateConfig(key, { enabled: e.target.checked })
                    }
                  />{" "}
                  {label}
                  {form.config[key]?.enabled && (
                    <>
                      {key === "earned" ? (
                        <>
                          <input
                            type="number"
                            placeholder="Worked days"
                            value={form.config.earned.workingDays}
                            onChange={(e) =>
                              updateConfig("earned", {
                                workingDays: e.target.value,
                              })
                            }
                            required
                          />
                          <input
                            type="number"
                            placeholder="Earned leaves"
                            value={form.config.earned.earnedLeaves}
                            onChange={(e) =>
                              updateConfig("earned", {
                                earnedLeaves: e.target.value,
                              })
                            }
                            required
                          />
                        </>
                      ) : (
                        <input
                          type="number"
                          placeholder="Leaves / year"
                          value={form.config[key].value}
                          onChange={(e) =>
                            updateConfig(key, { value: e.target.value })
                          }
                          required
                        />
                      )}

                      <input
                        type="number"
                        placeholder="Carry forward"
                        value={form.config[key].carryForward}
                        onChange={(e) =>
                          updateConfig(key, { carryForward: e.target.value })
                        }
                        required
                      />
                      <input
                        type="number"
                        placeholder="Apply before (days)"
                        value={form.config[key].advanceNoticeDays}
                        onChange={(e) =>
                          updateConfig(key, {
                            advanceNoticeDays: e.target.value,
                          })
                        }
                        min="0"
                      />
                    </>
                  )}
                </div>
              ))}

              {form.extras.map(
                ({ id, typeKey, value, carryForward, advanceNoticeDays }) => (
                  <div key={id} className="leave-type-row extra-row">
                    {/* Dropdown of leaveTypes (from DB) — NO free text */}
                    <select
                      value={typeKey || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateExtra(id, { typeKey: v });
                      }}
                      required
                    >
                      <option value="">-- select leave type --</option>
                      {(leaveTypes || []).map((t, idx) => (
                        <option key={idx} value={t.key || t}>
                          {t.label || t.key || t}
                        </option>
                      ))}
                    </select>

                    {/* Show selected label read-only for clarity */}
                    <input
                      type="text"
                      placeholder="Selected leave label"
                      value={
                        (leaveTypes.find((t) => t.key === typeKey) || {})
                          .label ||
                        typeKey ||
                        ""
                      }
                      readOnly
                      style={{ opacity: 0.85 }}
                    />

                    <input
                      type="number"
                      placeholder="Leaves / year"
                      value={value}
                      onChange={(e) =>
                        updateExtra(id, { value: e.target.value })
                      }
                      required
                    />
                    <input
                      type="number"
                      placeholder="Carry forward"
                      value={carryForward}
                      onChange={(e) =>
                        updateExtra(id, { carryForward: e.target.value })
                      }
                      required
                    />
                    <input
                      type="number"
                      placeholder="Apply before (days)"
                      value={advanceNoticeDays}
                      onChange={(e) =>
                        updateExtra(id, { advanceNoticeDays: e.target.value })
                      }
                      min="0"
                    />
                    <MdDeleteOutline
                      className="remove-extra"
                      onClick={() => removeExtra(id)}
                    />
                  </div>
                ),
              )}
            </div>

            <button type="submit" className="policy-submit">
              {form.id ? "Update Policy" : "Create Policy"}
            </button>
          </form>

          <table className="policy-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Start</th>
                <th>End</th>
                <th>Settings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => {
                const settings = p.leave_settings || [];

                const renderSetting = (ls, idx) => {
                  const notice = ls.advance_notice_days
                    ? ` • Notice ${ls.advance_notice_days}d`
                    : "";
                  if ((ls.type || "").toLowerCase() === "earned") {
                    return (
                      <li key={ls.type + idx} className="policy-setting-item">
                        <span className="setting-name">Earned</span>
                        <span className="setting-value">
                          {ls.earned_leaves ?? ls.value ?? 0} /{" "}
                          {ls.working_days ?? "—"}
                        </span>
                        <span className="setting-meta">
                          CF {ls.carry_forward ?? 0}
                          {notice}
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={(ls.type || `custom${idx}`) + idx}
                      className="policy-setting-item"
                    >
                      <span className="setting-name">
                        {String(ls.type || "Custom")
                          .split("_")
                          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                          .join(" ")}
                      </span>
                      <span className="setting-value">
                        {ls.value ?? ls.earned_leaves ?? 0} days
                      </span>
                      <span className="setting-meta">
                        CF {ls.carry_forward ?? 0}
                        {notice}
                      </span>
                    </li>
                  );
                };

                return (
                  <tr key={p.id}>
                    <td>{p.period}</td>
                    <td>{new Date(p.year_start).toLocaleDateString()}</td>
                    <td>{new Date(p.year_end).toLocaleDateString()}</td>
                    <td>
                      {settings.length === 0 ? (
                        "—"
                      ) : (
                        <ul className="policy-settings-list">
                          {settings.map((ls, idx) => renderSetting(ls, idx))}
                        </ul>
                      )}
                    </td>
                    <td>
                      <MdOutlineEdit
                        className="policy-action-icon"
                        onClick={() => onEdit(p)}
                        style={{ cursor: "pointer" }}
                      />
                      <MdDeleteOutline
                        className="policy-action-icon"
                        onClick={() => promptDelete(p.id)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <footer className="policy-modal-footer">
          <button className="policy-modal-btn cancel" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>

      <Modal
        isVisible={confirmDelete.isVisible}
        onClose={handleCancelDelete}
        buttons={[
          {
            label: "Cancel",
            className: "policy-confirm-cancel",
            onClick: handleCancelDelete,
          },
          {
            label: confirmDelete.loading ? "Deleting..." : "Delete",
            className: "policy-confirm-delete",
            onClick: handleConfirmDelete,
          },
        ]}
      >
        <p>{confirmDelete.message}</p>
      </Modal>
    </div>
  );
}