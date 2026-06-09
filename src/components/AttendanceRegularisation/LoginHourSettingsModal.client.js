"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";
import "./LoginHourSettingsModal.css";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  Loader2,
  Mail,
  Settings2,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from "lucide-react";

const DEFAULT_VALUES = {
  punchInStart: "",
  punchOutStart: "",
  bufferMinutes: "10",
  lateLoginEnabled: true,
  lateStreakDays: "3",
  autoMarkLate: true,
  escalationMode: "mail_notify",
};

const DEFAULT_ACTION_ROLES = {
  hr: true,
  manager: true,
  supervisor: false,
};

function isValidTime(value) {
  return (
    typeof value === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)
  );
}

function normalizeTime(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  const match = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function getRole(user) {
  return String(user?.role || user?.designation || "")
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();
}

function Toggle({ label, description, checked, onChange, disabled }) {
  return (
    <label
      className={`toggle-card ${disabled ? "opacity-60" : ""}`}
      style={disabled ? { cursor: "not-allowed" } : undefined}
    >
      <div className="toggle-card__text">
        <div className="toggle-card__title">{label}</div>
        {description ? (
          <p className="toggle-card__desc">{description}</p>
        ) : null}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`toggle-switch ${checked ? "toggle-switch--on" : ""}`}
      >
        <span className="toggle-switch__thumb" />
      </button>
    </label>
  );
}

function Field({ label, hint, children, icon }) {
  return (
    <div className="field">
      <div className="field__label">
        {icon ? <span>{icon}</span> : null}
        <span>{label}</span>
      </div>
      {children}
      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  );
}

function TimeInput(props) {
  return <input type="time" {...props} className="field__input" />;
}

function NumberInput(props) {
  return <input type="number" {...props} className="field__input" />;
}

function SelectInput(props) {
  return <select {...props} className="field__input" />;
}

function CheckboxRow({ label, checked, onChange, disabled }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: 500 }}>
        {label}
      </span>
    </label>
  );
}

function parseActionRoles(value) {
  if (!value) return { ...DEFAULT_ACTION_ROLES };

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) {
      return {
        hr: parsed.includes("hr"),
        manager: parsed.includes("manager"),
        supervisor: parsed.includes("supervisor"),
      };
    }

    if (parsed && typeof parsed === "object") {
      return {
        hr: Boolean(parsed.hr),
        manager: Boolean(parsed.manager),
        supervisor: Boolean(parsed.supervisor),
      };
    }
  } catch {
    // fallback below
  }

  return { ...DEFAULT_ACTION_ROLES };
}

export default function LoginHourSettingsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const userRole = getRole(user);
  const isAdmin = userRole === "admin";

  const [values, setValues] = useState(DEFAULT_VALUES);
  const [actionRoles, setActionRoles] = useState(DEFAULT_ACTION_ROLES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") || "";

  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.orgId ??
    user?.raw?.org_id ??
    null;

  const employeeId =
    user?.employeeId ??
    user?.employee_id ??
    user?.raw?.employeeId ??
    user?.raw?.employee_id ??
    "";

  const headers = useMemo(
    () => ({
      "x-api-key": API_KEY,
      "x-org-id": orgId || "",
      "x-employee-id": employeeId || "",
      "Content-Type": "application/json",
    }),
    [API_KEY, orgId, employeeId],
  );

  useEffect(() => {
    if (!isOpen || !BACKEND_URL || !orgId) return;

    let cancelled = false;

    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await axios.get(
          `${BACKEND_URL}/attendance/login-hours-config`,
          {
            withCredentials: true,
            headers,
          },
        );

        const config = response.data?.data || {};

        if (!cancelled) {
          setValues({
            punchInStart: normalizeTime(config.punch_in_start),
            punchOutStart: normalizeTime(config.punch_out_start),
            bufferMinutes: String(config.buffer_minutes ?? 10),
            lateLoginEnabled: String(config.late_login_enabled ?? "1") !== "0",
            lateStreakDays: String(config.late_streak_days ?? 3),
            autoMarkLate: String(config.auto_mark_late ?? "1") !== "0",
            escalationMode: String(config.escalation_mode ?? "mail_notify"),
          });

          setActionRoles(parseActionRoles(config.action_roles));
        }
      } catch (err) {
        console.error("Fetch punch login hours failed:", err);
        if (!cancelled) {
          setError("Unable to load attendance settings.");
          setValues(DEFAULT_VALUES);
          setActionRoles({ ...DEFAULT_ACTION_ROLES });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchConfig();

    return () => {
      cancelled = true;
    };
  }, [isOpen, BACKEND_URL, headers, orgId]);

  const handleChange = (field, value) => {
    if (typeof value === "boolean") {
      setValues((prev) => ({ ...prev, [field]: value }));
      return;
    }

    if (typeof value !== "string") return;

    if (["bufferMinutes", "lateStreakDays"].includes(field)) {
      if (/^[0-9]*$/.test(value)) {
        setValues((prev) => ({ ...prev, [field]: value }));
      }
      return;
    }

    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const validateValues = () => {
    const errors = [];
    const { punchInStart, punchOutStart, bufferMinutes, lateStreakDays } =
      values;

    if (punchInStart && !isValidTime(punchInStart)) {
      errors.push("Punch-in start must be HH:mm.");
    }

    if (punchOutStart && !isValidTime(punchOutStart)) {
      errors.push("Punch-out start must be HH:mm.");
    }

    const numberFields = [
      [bufferMinutes, 0, 120, "Buffer time"],
      [lateStreakDays, 1, 30, "Late streak days"],
    ];

    for (const [value, min, max, label] of numberFields) {
      if (value !== "" && (Number(value) < min || Number(value) > max)) {
        errors.push(`${label} must be between ${min} and ${max}.`);
      }
    }

    const selectedRoles = Object.values(actionRoles).some(Boolean);
    if (!selectedRoles) {
      errors.push("Select at least one role who can take action.");
    }

    if (!values.escalationMode) {
      errors.push("Select an escalation method.");
    }

    return errors;
  };

  const saveLoginHoursConfig = async (configData) =>
    axios.post(`${BACKEND_URL}/attendance/login-hours-config`, configData, {
      withCredentials: true,
      headers,
    });

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const validationErrors = validateValues();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
      return;
    }

    if (!BACKEND_URL || !orgId) {
      setError("Unable to save settings. Missing backend or organization.");
      return;
    }

    setLoading(true);

    try {
      const selectedActionRoles = Object.entries(actionRoles)
        .filter(([, checked]) => checked)
        .map(([role]) => role);

      await saveLoginHoursConfig({
        punch_in_start: values.punchInStart || "",
        punch_out_start: values.punchOutStart || "",
        buffer_minutes: values.bufferMinutes || "10",
        late_login_enabled: values.lateLoginEnabled ? "1" : "0",
        late_login_streak_days: values.lateStreakDays || "3",
        auto_mark_late: values.autoMarkLate ? "1" : "0",
        late_escalation_mode: values.escalationMode || "mail_notify",
        late_action_roles: JSON.stringify(selectedActionRoles),
      });

      setSuccess("Attendance settings saved successfully.");
      setError(null);
    } catch (err) {
      console.error("Save punch login hours failed:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save attendance settings.",
      );
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const latePreview = useMemo(() => {
    const start = values.punchInStart || "--:--";
    const buffer = values.bufferMinutes || "10";
    const streak = values.lateStreakDays || "3";
    const autoLate = values.autoMarkLate ? "enabled" : "disabled";
    const selectedRoles = Object.entries(actionRoles)
      .filter(([, checked]) => checked)
      .map(([role]) => role.toUpperCase())
      .join(", ");

    const modeText =
      values.escalationMode === "mail_notify"
        ? "Send email and notification"
        : values.escalationMode === "attendance_regularisation"
          ? "Mark late in attendance regularisation"
          : "Escalation alert only";

    return `Punch-in starts at ${start} with ${buffer} min buffer. Late login is ${autoLate}. Late streak is ${streak} day(s). Escalation mode: ${modeText}. Action roles: ${selectedRoles || "None"}.`;
  }, [
    values.punchInStart,
    values.bufferMinutes,
    values.lateStreakDays,
    values.autoMarkLate,
    values.escalationMode,
    actionRoles,
  ]);

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="attendance-modal-overlay" onClick={onClose}>
        <div
          className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-8 text-center shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Access denied
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Only administrators can configure punch-hour rules.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-modal-overlay" onClick={onClose}>
      <div
        className="attendance-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="attendance-modal__header">
          <div>
            <div className="attendance-modal__eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              Attendance control center
            </div>
            <h3 className="attendance-modal__title">Configure punch hours</h3>
            <p className="attendance-modal__subtitle">
              Set punch-in and punch-out timing, buffer time, late streak days,
              and escalation handling from one admin screen.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="attendance-modal__close"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="attendance-modal__body">
          {error ? (
            <div className="attendance-modal__alert attendance-modal__alert--error">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="attendance-modal__alert attendance-modal__alert--success">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{success}</p>
            </div>
          ) : null}

          <div className="attendance-grid">
            <div className="attendance-stack">
              <div className="summary-grid">
                {[
                  {
                    label: "Punch-in start",
                    value: values.punchInStart || "Not set",
                    icon: Clock3,
                  },
                  {
                    label: "Punch-out start",
                    value: values.punchOutStart || "Not set",
                    icon: CalendarDays,
                  },
                  {
                    label: "Buffer time",
                    value: `${values.bufferMinutes || 10} min`,
                    icon: Gauge,
                  },
                  {
                    label: "Late streak days",
                    value: `${values.lateStreakDays || 3}`,
                    icon: Bell,
                  },
                ].map((card) => (
                  <div key={card.label} className="summary-card">
                    <div className="summary-card__label">
                      <card.icon className="h-4 w-4" />
                      {card.label}
                    </div>
                    <div className="summary-card__value">{card.value}</div>
                  </div>
                ))}
              </div>

              <section className="attendance-card">
                <div className="attendance-card__title">
                  <Clock3 className="attendance-card__icon h-5 w-5" />
                  Default punch windows
                </div>

                <div className="attendance-card__grid">
                  <Field
                    label="Punch-in start"
                    hint="Employees can start punching in from this time."
                    icon={<Clock3 className="h-4 w-4" />}
                  >
                    <TimeInput
                      value={values.punchInStart}
                      onChange={(e) =>
                        handleChange("punchInStart", e.target.value)
                      }
                      disabled={loading}
                    />
                  </Field>

                  <Field
                    label="Buffer time"
                    hint="Extra minutes allowed before marking punch-in as late."
                    icon={<Gauge className="h-4 w-4" />}
                  >
                    <NumberInput
                      min="0"
                      max="120"
                      value={values.bufferMinutes}
                      onChange={(e) =>
                        handleChange("bufferMinutes", e.target.value)
                      }
                      disabled={loading}
                    />
                  </Field>

                  <Field
                    label="Punch-out start"
                    hint="Employees can punch out from this time onward."
                    icon={<CalendarDays className="h-4 w-4" />}
                  >
                    <TimeInput
                      value={values.punchOutStart}
                      onChange={(e) =>
                        handleChange("punchOutStart", e.target.value)
                      }
                      disabled={loading}
                    />
                  </Field>

                  <Field
                    label="Late streak days"
                    hint="Consecutive late days before escalation starts."
                    icon={<Bell className="h-4 w-4" />}
                  >
                    <NumberInput
                      min="1"
                      max="30"
                      value={values.lateStreakDays}
                      onChange={(e) =>
                        handleChange("lateStreakDays", e.target.value)
                      }
                      disabled={loading}
                    />
                  </Field>
                </div>
              </section>

              <section className="attendance-card">
                <div className="attendance-card__title">
                  <Settings2 className="attendance-card__icon h-5 w-5" />
                  Late-login engine
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Toggle
                    label="Enable late-login rules"
                    description="Turn on late-login detection for this organization."
                    checked={values.lateLoginEnabled}
                    onChange={(checked) =>
                      handleChange("lateLoginEnabled", checked)
                    }
                    disabled={loading}
                  />
                  <Toggle
                    label="Auto mark late"
                    description="Automatically tag attendance as late when rules are violated."
                    checked={values.autoMarkLate}
                    onChange={(checked) =>
                      handleChange("autoMarkLate", checked)
                    }
                    disabled={loading}
                  />
                </div>
              </section>

              <section className="attendance-card">
                <div className="attendance-card__title">
                  <Users className="attendance-card__icon h-5 w-5" />
                  Escalation handling
                </div>

                <div className="attendance-card__grid">
                  <div className="field">
                    <div className="field__label">
                      <Users className="h-4 w-4" />
                      <span>Who can take action</span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "10px",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                      }}
                    >
                      <CheckboxRow
                        label="HR"
                        checked={actionRoles.hr}
                        onChange={(checked) =>
                          setActionRoles((prev) => ({
                            ...prev,
                            hr: checked,
                          }))
                        }
                        disabled={loading}
                      />
                      <CheckboxRow
                        label="Manager"
                        checked={actionRoles.manager}
                        onChange={(checked) =>
                          setActionRoles((prev) => ({
                            ...prev,
                            manager: checked,
                          }))
                        }
                        disabled={loading}
                      />
                      <CheckboxRow
                        label="Supervisor"
                        checked={actionRoles.supervisor}
                        onChange={(checked) =>
                          setActionRoles((prev) => ({
                            ...prev,
                            supervisor: checked,
                          }))
                        }
                        disabled={loading}
                      />
                    </div>
                    <p className="field__hint">
                      Choose the roles allowed to respond when the late streak
                      limit is broken.
                    </p>
                  </div>

                  <Field
                    label="Escalation method"
                    hint="Choose how the escalation should be handled."
                    icon={<Mail className="h-4 w-4" />}
                  >
                    <SelectInput
                      value={values.escalationMode}
                      onChange={(e) =>
                        handleChange("escalationMode", e.target.value)
                      }
                      disabled={loading}
                    >
                      <option value="mail_notify">
                        Send email and notification
                      </option>
                      <option value="attendance_regularisation">
                        Mark as late in attendance regularisation
                      </option>
                    </SelectInput>
                  </Field>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="preview-card">
                <div className="preview-card__eyebrow">
                  <Sparkles className="h-4 w-4" />
                  Live rule preview
                </div>
                <p className="preview-card__text">{latePreview}</p>

                <div className="preview-card__stats">
                  <div className="preview-card__row">
                    <span className="text-indigo-100">Current status</span>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                      Active
                    </span>
                  </div>
                  <div className="preview-card__row">
                    <span className="text-indigo-100">Auto late marking</span>
                    <span className="preview-card__value">
                      {values.autoMarkLate ? "On" : "Off"}
                    </span>
                  </div>
                  <div className="preview-card__row">
                    <span className="text-indigo-100">Escalation method</span>
                    <span className="preview-card__value">
                      {values.escalationMode === "mail_notify"
                        ? "Email + notification"
                        : values.escalationMode === "attendance_regularisation"
                          ? "Attendance regularisation"
                          : "Alert only"}
                    </span>
                  </div>
                </div>
              </section>

              <section className="side-card">
                <h4 className="side-card__title">What this does</h4>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <li>
                    Uses punch-in start plus buffer time for late checking.
                  </li>
                  <li>Keeps late-login rules simple and easy to manage.</li>
                  <li>
                    Lets you control who can act and how escalation works.
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </div>

        <div className="attendance-modal__footer">
          <p className="attendance-modal__footer-note">
            Changes apply to the selected organization.
          </p>

          <div className="attendance-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn--ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="btn btn--primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save settings"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
