"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";
import "./LeaveRegularisationModal.css";

const REASONS = [
  { value: "missed_punch_out", label: "Missed Punch Out" },
  { value: "late_login", label: "Late Login" },
  {
    value: "missed_apply_leave",
    label: "Missed Apply Leave / Missed Punch In",
  },
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

function fromDateKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function monthLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function weekdayLabels() {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
}

function formatDisplayDate(dateKey) {
  const d = fromDateKey(dateKey);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function normalizeDateList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((v) => String(v).slice(0, 10)).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).slice(0, 10)).filter(Boolean);
      }
    } catch {
      const single = String(value).slice(0, 10);
      return single ? [single] : [];
    }
  }

  return [];
}

function getRequestDates(request) {
  return normalizeDateList(
    request?.selected_dates ??
      request?.selectedDates ??
      request?.selected_dates_json,
  );
}

function isRejectedStatus(status) {
  return (
    String(status || "")
      .trim()
      .toLowerCase() === "rejected"
  );
}

function getRequestKey(request) {
  return request?.id || request?.request_id || request?.leave_id || null;
}

export default function LeaveRegularisationModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  title = "Leave Regularisation",
  subtitle = "Select a reason, choose eligible date(s), add your comment, and submit.",
  initialReason = "",
  initialDates = [],
  initialComment = "",
  defaultDate = null,
  existingRequests = [],
  excludeRequestId = null,
}) {
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

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const frozenDates = useMemo(() => {
    const set = new Set();
    const excludeKey =
      excludeRequestId != null ? String(excludeRequestId) : null;

    for (const request of existingRequests || []) {
      const requestKey = getRequestKey(request);
      if (
        excludeKey &&
        requestKey != null &&
        String(requestKey) === excludeKey
      ) {
        continue;
      }

      if (isRejectedStatus(request?.status)) continue;

      for (const dateKey of getRequestDates(request)) {
        set.add(dateKey);
      }
    }

    return set;
  }, [existingRequests, excludeRequestId]);

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(defaultDate ? new Date(defaultDate) : new Date()),
  );
  const [selectedReason, setSelectedReason] = useState(initialReason);
  const [selectedDates, setSelectedDates] = useState(
    () => new Set(normalizeDateList(initialDates)),
  );
  const [eligibleDates, setEligibleDates] = useState(() => new Set());
  const [comment, setComment] = useState(initialComment);
  const [errors, setErrors] = useState({});
  const [fetchingDates, setFetchingDates] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const baseDate = defaultDate ? new Date(defaultDate) : new Date();
    setWeekStart(startOfWeekMonday(baseDate));
    setSelectedReason(initialReason || "");
    setSelectedDates(new Set(normalizeDateList(initialDates)));
    setEligibleDates(new Set());
    setComment(initialComment || "");
    setErrors({});
  }, [isOpen, initialReason, initialDates, initialComment, defaultDate]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const fetchEligibleDates = async () => {
      if (!isOpen || !selectedReason || !employeeId || !orgId || !BACKEND_URL) {
        setEligibleDates(new Set());
        return;
      }

      const fromDate = toDateKey(weekStart);
      const toDate = toDateKey(addDays(weekStart, 5));

      try {
        setFetchingDates(true);
        setErrors((prev) => ({ ...prev, fetch: "" }));

        const res = await axios.get(
          `${BACKEND_URL}/api/leave-regularisation/eligible-dates`,
          {
            params: {
              regularisationType: selectedReason,
              fromDate,
              toDate,
            },
            headers: {
              "x-api-key": API_KEY,
              "x-employee-id": employeeId,
              "x-org-id": orgId,
            },
            withCredentials: true,
          },
        );

        const data = res.data?.data || res.data || {};
        const dates =
          data.eligibleDates ||
          data?.data?.eligibleDates ||
          (Array.isArray(data) ? data : []);

        const nextSet = new Set(
          (dates || []).map((d) => String(d).slice(0, 10)),
        );
        setEligibleDates(nextSet);

        setSelectedDates((prev) => {
          const next = new Set();
          for (const d of prev) {
            if (nextSet.has(d) && !frozenDates.has(d)) next.add(d);
          }
          return next;
        });
      } catch (err) {
        console.error("Failed to fetch eligible dates:", err);
        setEligibleDates(new Set());
        setSelectedDates(new Set());
        setErrors((prev) => ({
          ...prev,
          fetch:
            err.response?.data?.message ||
            "Failed to load eligible dates for the selected reason.",
        }));
      } finally {
        setFetchingDates(false);
      }
    };

    fetchEligibleDates();
  }, [
    isOpen,
    selectedReason,
    weekStart,
    employeeId,
    orgId,
    BACKEND_URL,
    API_KEY,
    frozenDates,
  ]);

  const weekDays = useMemo(() => {
    const cells = [];
    const weekdayList = weekdayLabels();

    for (let i = 0; i < 6; i++) {
      const date = addDays(weekStart, i);
      const key = toDateKey(date);
      const isFuture = key > todayKey;
      const isFrozen = frozenDates.has(key);

      cells.push({
        key,
        date,
        day: date.getDate(),
        weekday: weekdayList[i],
        disabled:
          isFuture ||
          !selectedReason ||
          fetchingDates ||
          !eligibleDates.has(key) ||
          isFrozen,
        frozen: isFrozen,
        eligible: eligibleDates.has(key),
        selected: selectedDates.has(key),
        isToday: key === todayKey,
      });
    }

    return cells;
  }, [
    weekStart,
    todayKey,
    selectedReason,
    fetchingDates,
    eligibleDates,
    selectedDates,
    frozenDates,
  ]);

  const canGoNext = toDateKey(addDays(weekStart, 7)) <= todayKey;

  const toggleDate = (dateKey) => {
    if (!eligibleDates.has(dateKey)) return;
    if (frozenDates.has(dateKey)) return;

    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });

    setErrors((prev) => ({ ...prev, dates: "", submit: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!selectedReason)
      nextErrors.reason = "Please select a regularisation type.";
    if (selectedDates.size === 0)
      nextErrors.dates = "Please select at least one date.";
    if (!comment.trim()) nextErrors.comment = "Please enter a comment.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const sortedDates = Array.from(selectedDates).sort();

    onSubmit?.({
      regularisationType: selectedReason,
      selectedDates: sortedDates,
      comment: comment.trim(),
      primaryDate: sortedDates[0] || null,
      fromDate: toDateKey(weekStart),
      toDate: toDateKey(addDays(weekStart, 5)),
    });
  };

  const selectedReasonLabel =
    REASONS.find((r) => r.value === selectedReason)?.label || "Not selected";

  if (!isOpen) return null;

  return (
    <div className="lr-modal-overlay" onMouseDown={onClose}>
      <div
        className="lr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lr-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="lr-modal-header">
          <div>
            <h2 id="lr-modal-title" className="lr-modal-title">
              {title}
            </h2>
            <p className="lr-modal-subtitle">{subtitle}</p>
          </div>

          <button
            type="button"
            className="lr-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form className="lr-modal-body" onSubmit={handleSubmit}>
          <section className="lr-section">
            <label className="lr-section-label">Regularisation Type</label>
            <div className="lr-radio-grid">
              {REASONS.map((item) => (
                <label
                  key={item.value}
                  className={`lr-radio-card ${
                    selectedReason === item.value ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="regularisationType"
                    value={item.value}
                    checked={selectedReason === item.value}
                    onChange={(e) => {
                      setSelectedReason(e.target.value);
                      setSelectedDates(new Set());
                      setErrors((prev) => ({
                        ...prev,
                        reason: "",
                        dates: "",
                        fetch: "",
                      }));
                    }}
                  />
                  <span className="lr-radio-ui" />
                  <span className="lr-radio-text">{item.label}</span>
                </label>
              ))}
            </div>
            {errors.reason ? (
              <div className="lr-error">{errors.reason}</div>
            ) : null}
            {errors.fetch ? (
              <div className="lr-error">{errors.fetch}</div>
            ) : null}
          </section>

          <section className="lr-section">
            <div className="lr-calendar-head">
              <label className="lr-section-label">Select Date(s)</label>
              <div className="lr-month-controls">
                <button
                  type="button"
                  className="lr-nav-btn"
                  onClick={() => setWeekStart((prev) => addDays(prev, -7))}
                >
                  ‹
                </button>
                <div className="lr-month-label">
                  {monthLabel(weekStart)} (Mon-Sat)
                </div>
                <button
                  type="button"
                  className="lr-nav-btn"
                  onClick={() => {
                    const next = addDays(weekStart, 7);
                    if (toDateKey(next) <= todayKey) setWeekStart(next);
                  }}
                  disabled={!canGoNext}
                >
                  ›
                </button>
              </div>
            </div>

            <div className="lr-calendar lr-week-calendar">
              {weekdayLabels().map((day) => (
                <div key={day} className="lr-weekday">
                  {day}
                </div>
              ))}

              {weekDays.map((cell) => (
                <label
                  key={cell.key}
                  className={[
                    "lr-day",
                    cell.selected ? "selected" : "",
                    cell.disabled ? "disabled" : "",
                    cell.frozen ? "frozen" : "",
                    cell.isToday ? "today" : "",
                    cell.eligible ? "eligible" : "",
                  ].join(" ")}
                  title={
                    cell.frozen
                      ? "Already used and not rejected"
                      : !selectedReason
                        ? "Select a reason first"
                        : cell.eligible
                          ? "Eligible"
                          : "Not eligible"
                  }
                >
                  <input
                    type="checkbox"
                    checked={cell.selected}
                    disabled={cell.disabled}
                    onChange={() => toggleDate(cell.key)}
                  />
                  <span className="lr-day-number">{cell.day}</span>
                  <span className="lr-day-check">✓</span>
                  <span className="lr-day-week">{cell.weekday}</span>
                </label>
              ))}
            </div>

            {errors.dates ? (
              <div className="lr-error">{errors.dates}</div>
            ) : null}
          </section>

          <section className="lr-section">
            <div className="lr-bottom-grid">
              <div className="lr-summary-card">
                <label className="lr-section-label">Selected Option</label>
                <div className="lr-summary-value">{selectedReasonLabel}</div>

                <label className="lr-section-label lr-top-space">
                  Selected Dates
                </label>
                <div className="lr-selected-dates">
                  {selectedDates.size > 0 ? (
                    Array.from(selectedDates)
                      .sort()
                      .map((d) => (
                        <span key={d} className="lr-date-chip">
                          {formatDisplayDate(d)}
                        </span>
                      ))
                  ) : (
                    <span className="lr-empty-note">No dates selected</span>
                  )}
                </div>
              </div>

              <div className="lr-comment-card">
                <label className="lr-section-label" htmlFor="lr-comment">
                  Comment
                </label>
                <textarea
                  id="lr-comment"
                  className="lr-comment-box"
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    setErrors((prev) => ({ ...prev, comment: "", submit: "" }));
                  }}
                  placeholder="Write the reason and any supporting details..."
                  rows={4}
                />
                {errors.comment ? (
                  <div className="lr-error">{errors.comment}</div>
                ) : null}
              </div>
            </div>
          </section>

          <div className="lr-footer">
            <button type="button" className="lr-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="lr-submit-btn" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
