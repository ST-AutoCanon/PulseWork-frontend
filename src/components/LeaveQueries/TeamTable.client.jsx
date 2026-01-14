"use client";

import React, { useState, useEffect } from "react";
import { parseLocalDate, calculateDays } from "./leaveUtils.client";

export default function TeamTable({
  leaveRequests,
  statusUpdates,
  handleStatusChange,
  onUpdate,
  canViewTeam,
  policies = [],
  activePolicy = null,
  loadLeaveBalance,
  lopModal,
  setLopModal,
}) {
  if (!canViewTeam) return null;

  const sortedLeaves = (leaveRequests.team || []).sort(
    (a, b) => (b.leave_id || b.id || 0) - (a.leave_id || a.id || 0)
  );

  const getCurrentStatus = (leave) => {
    const update = statusUpdates?.[leave.leave_id] || {};
    return update.status || leave.status || "";
  };

  const getStatusClass = (status) =>
    status === "Approved"
      ? "status-approved"
      : status === "Rejected"
      ? "status-rejected"
      : "status-pending";

  const [localInputs, setLocalInputs] = useState({});

  useEffect(() => {
    if (!statusUpdates) {
      setLocalInputs({});
      return;
    }
    setLocalInputs((prev) => ({ ...prev, ...statusUpdates }));
  }, [statusUpdates]);

  const setLocalComment = (leaveId, comments) => {
    setLocalInputs((prev) => ({
      ...prev,
      [leaveId]: { ...(prev[leaveId] || {}), comments },
    }));
  };

  const parseRequestStartDate = (request) => {
    const d = request?.start_date ?? request?.startDate ?? null;
    if (!d) return null;
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  };

  const findPolicyForRequest = (request) => {
    const reqDate = parseRequestStartDate(request);
    if (!reqDate) return null;

    if (Array.isArray(policies) && policies.length > 0) {
      for (const p of policies) {
        try {
          const s = new Date(p.year_start);
          const e = new Date(p.year_end);
          s.setHours(0, 0, 0, 0);
          e.setHours(0, 0, 0, 0);
          if (s <= reqDate && reqDate <= e) return p;
        } catch {}
      }
    }

    if (activePolicy?.year_start && activePolicy?.year_end) {
      try {
        const s = new Date(activePolicy.year_start);
        const e = new Date(activePolicy.year_end);
        s.setHours(0, 0, 0, 0);
        e.setHours(0, 0, 0, 0);
        if (s <= reqDate && reqDate <= e) return activePolicy;
      } catch {}
    }
    return null;
  };

  const normalizeBoolean = (v) => {
    if (v === true || v === false) return v;
    if (typeof v === "string") {
      const t = v.trim().toLowerCase();
      return ["true", "1", "yes", "on"].includes(t);
    }
    return !!v;
  };

  const normalizeIsDefaulted = (payload) => {
    if (!payload) return false;
    if (Object.prototype.hasOwnProperty.call(payload, "is_defaulted"))
      return normalizeBoolean(payload.is_defaulted);
    if (Object.prototype.hasOwnProperty.call(payload, "isDefaulted"))
      return normalizeBoolean(payload.isDefaulted);
    return false;
  };

  const getRemainingForLeave = async (leave) => {
    try {
      if (typeof loadLeaveBalance === "function") {
        const balances = await loadLeaveBalance(leave.employee_id);
        if (Array.isArray(balances)) {
          const b = balances.find(
            (r) => String(r.type) === String(leave.leave_type)
          );
          if (b && b.remaining !== undefined) return Number(b.remaining) || 0;
        }
      }
    } catch (e) {}
    if (leave.remaining !== undefined) return Number(leave.remaining) || 0;
    return 0;
  };

  const handleUpdateClick = async (leave) => {
    if (!onUpdate) return;

    const rawPayload =
      localInputs[leave.leave_id] || statusUpdates?.[leave.leave_id] || {};
    const effectiveStatus =
      rawPayload.status ??
      statusUpdates?.[leave.leave_id]?.status ??
      leave.status;

    if (effectiveStatus !== "Approved") {
      try {
        await onUpdate(leave.leave_id, rawPayload);
      } catch (e) {}
      return;
    }

    let isDefaultedFlag = normalizeIsDefaulted(rawPayload);

    if (!isDefaultedFlag) {
      const policy = findPolicyForRequest(leave);
      if (!policy) isDefaultedFlag = true;
    }

    const days = calculateDays(leave.start_date, leave.end_date, leave.H_F_day);

    if (isDefaultedFlag) {
      const defaultedPayload = {
        ...rawPayload,
        compensated_days: 0,
        deducted_days: 0,
        loss_of_pay_days: Number(days),
        total_days: Number(days),
        preserved_leave_days: null,
        is_defaulted: true,
        isDefaulted: true,
        status: "Approved",
      };
      await onUpdate(leave.leave_id, defaultedPayload);
      return;
    }

    const remaining = await getRemainingForLeave(leave);
    const deficit = Math.max(0, days - remaining);
    const EPS = 1e-6;

    if (typeof setLopModal === "function") {
      const approveDeficit = async () => {
        const preserved_leave_days = Number(remaining) || 0;
        const lopDaysVal = Number(days) || 0;

        const payload = {
          ...(rawPayload || {}),
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

        const result = await onUpdate(leave.leave_id, payload);
        if (result && result.ok) {
          setLopModal((m) => ({ ...m, isVisible: false }));
        } else {
          const serverMsg =
            (result &&
              (result.message || (result.body && result.body.message))) ||
            JSON.stringify(result && result.body) ||
            "Failed to approve as LoP — see modal.";
          setLopModal((m) => ({ ...m, error: serverMsg }));
        }
        return result;
      };

      const setAllCompensated = async () => {
        const compensated_days = Number(days) || 0;
        const preserved_leave_days = Number(remaining) || 0;

        const payload = {
          ...(rawPayload || {}),
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

        const result = await onUpdate(leave.leave_id, payload);
        if (result && result.ok) {
          setLopModal((m) => ({ ...m, isVisible: false }));
        } else {
          const serverMsg =
            (result &&
              (result.message || (result.body && result.body.message))) ||
            JSON.stringify(result && result.body) ||
            "Failed to set all compensated — see modal.";
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
          ...(rawPayload || {}),
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

        const result = await onUpdate(leave.leave_id, payload);
        if (result && result.ok) {
          setLopModal((m) => ({ ...m, isVisible: false }));
        } else {
          const serverMsg =
            (result &&
              (result.message || (result.body && result.body.message))) ||
            JSON.stringify(result && result.body) ||
            "Failed to set all deducted — see modal.";
          setLopModal((m) => ({ ...m, error: serverMsg }));
        }
        return result;
      };

      const applyFlexibleSplit = async (
        compensatedDays,
        deductedDays,
        lopDays
      ) => {
        const c = Number(compensatedDays) || 0;
        const d = Number(deductedDays) || 0;
        const l = Number(lopDays) || 0;

        if (Math.abs(c + d + l - days) > 1e-6) {
          const msg = `Split values must add up to total requested days (${days}). Received: compensated=${c}, deducted=${d}, loss_of_pay=${l}.`;
          setLopModal((m) => ({ ...m, error: msg }));
          return { ok: false, message: "validation_failed", body: msg };
        }

        const deducted_clamped = Math.min(Number(remaining) || 0, d);
        if (deducted_clamped + 1e-6 < d) {
          const msg = `Deducted days (${d}) exceed remaining (${remaining}). Please adjust.`;
          setLopModal((m) => ({ ...m, error: msg }));
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
          ...(rawPayload || {}),
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

        const result = await onUpdate(leave.leave_id, payload);
        if (result && result.ok) {
          setLopModal((m) => ({ ...m, isVisible: false }));
        } else if (result && result.status >= 200 && result.status < 300) {
          setLopModal((m) => ({ ...m, isVisible: false }));
        } else {
          const serverMsg =
            (result &&
              (result.message || (result.body && result.body.message))) ||
            JSON.stringify(result && result.body) ||
            "Failed to apply split — see modal.";
          setLopModal((m) => ({ ...m, error: serverMsg }));
        }
        return result;
      };

      setLopModal({
        isVisible: true,
        leaveId: leave.leave_id,
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

    await onUpdate(leave.leave_id, rawPayload);
  };

  const renderStatusBadge = (status) => {
    const className = getStatusClass(status);
    return (
      <span className={`leave-status-label ${className}`}>
        {status || "Pending"}
      </span>
    );
  };

  const isAlreadyUpdated = (leave) => leave.status !== "pending";

  return (
    <>
      <h4 className="my-leaves">Team Leave Requests</h4>

      <div className="leave-request-table desktop-view">
        <table className="leave-requests">
          <thead>
            <tr>
              <th>Emp Name</th>
              <th>Emp ID</th>
              <th>Leave Type</th>
              <th>Half/Full</th>
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
            {sortedLeaves.map((leave) => {
              const local = localInputs[leave.leave_id] || {};
              const update = statusUpdates?.[leave.leave_id] || {};
              const currentStatus =
                local.status ?? update.status ?? leave.status ?? "pending";
              const days = calculateDays(
                leave.start_date,
                leave.end_date,
                leave.H_F_day
              );

              return (
                <tr
                  key={leave.leave_id}
                  className={isAlreadyUpdated(leave) ? "row-updated" : ""}
                >
                  <td>
                    {leave.name ||
                      `${leave.first_name || ""} ${
                        leave.last_name || ""
                      }`.trim()}
                  </td>
                  <td>{leave.employee_id}</td>
                  <td>{leave.leave_type}</td>
                  <td>{leave.H_F_day}</td>
                  <td>{parseLocalDate(leave.start_date)}</td>
                  <td>{parseLocalDate(leave.end_date)}</td>
                  <td className="comments-col">
                    <div className="comment-preview">{leave.reason}</div>
                  </td>
                  <td>{days}</td>
                  <td>
                    <select
                      value={currentStatus}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalInputs((prev) => ({
                          ...prev,
                          [leave.leave_id]: {
                            ...prev[leave.leave_id],
                            status: val,
                          },
                        }));
                        handleStatusChange?.(leave.leave_id, "status", val);
                      }}
                      className={`status-dropdown ${getStatusClass(
                        currentStatus
                      )}`}
                      disabled={isAlreadyUpdated(leave)}
                    >
                      <option value="pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="comments-col">
                    {leave.comments ? (
                      <div className="comment-preview">{leave.comments}</div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Add comment..."
                        value={local.comments ?? update.comments ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setLocalComment(leave.leave_id, v);
                          handleStatusChange?.(leave.leave_id, "comments", v);
                        }}
                        disabled={isAlreadyUpdated(leave)}
                        className="comments-input"
                      />
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleUpdateClick(leave)}
                      disabled={
                        isAlreadyUpdated(leave) ||
                        (!local.status && !local.comments)
                      }
                      className={`update-button ${
                        isAlreadyUpdated(leave) ? "disabled-button" : ""
                      }`}
                    >
                      {isAlreadyUpdated(leave) ? "Updated" : "Update"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="self-compact-list">
        {sortedLeaves.map((leave) => {
          const local = localInputs[leave.leave_id] || {};
          const update = statusUpdates?.[leave.leave_id] || {};
          const currentStatus =
            local.status ?? update.status ?? leave.status ?? "pending";
          const days = calculateDays(
            leave.start_date,
            leave.end_date,
            leave.H_F_day
          );
          const name =
            leave.name ||
            `${leave.first_name || ""} ${leave.last_name || ""}`.trim();

          return (
            <details key={leave.leave_id} className="compact-item">
              <summary className="compact-summary">
                <div className="compact-main">
                  <strong>{name}</strong>
                  <span className="compact-dates">
                    {parseLocalDate(leave.start_date)} →{" "}
                    {parseLocalDate(leave.end_date)}
                  </span>
                  <div style={{ fontSize: "0.9em", color: "#555" }}>
                    {leave.leave_type} • {days} {days === 1 ? "day" : "days"}
                  </div>
                </div>
                {renderStatusBadge(currentStatus)}
              </summary>

              <div className="compact-details">
                <div>
                  <strong>Employee ID:</strong> {leave.employee_id}
                </div>
                <div>
                  <strong>Type:</strong> {leave.H_F_day || "Full Day"}
                </div>
                {leave.reason && (
                  <div>
                    <strong>Reason:</strong> {leave.reason}
                  </div>
                )}

                <div className="compact-form-section">
                  <label>
                    <strong>Status</strong>
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalInputs((prev) => ({
                        ...prev,
                        [leave.leave_id]: {
                          ...prev[leave.leave_id],
                          status: val,
                        },
                      }));
                      handleStatusChange?.(leave.leave_id, "status", val);
                    }}
                    disabled={isAlreadyUpdated(leave)}
                    className="mobile-status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="compact-form-section">
                  <label>
                    <strong>Comment (optional)</strong>
                  </label>
                  {leave.comments ? (
                    <p style={{ margin: "8px 0", color: "#d32f2f" }}>
                      {leave.comments}
                    </p>
                  ) : (
                    <input
                      type="text"
                      placeholder="Reason for rejection or note..."
                      value={local.comments ?? update.comments ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLocalComment(leave.leave_id, v);
                        handleStatusChange?.(leave.leave_id, "comments", v);
                      }}
                      disabled={isAlreadyUpdated(leave)}
                      className="comments-input"
                    />
                  )}
                </div>

                <div className="compact-actions">
                  <button
                    onClick={() => handleUpdateClick(leave)}
                    disabled={
                      isAlreadyUpdated(leave) ||
                      (!local.status && !local.comments)
                    }
                    style={{
                      opacity: isAlreadyUpdated(leave) ? 0.6 : 1,
                      background: isAlreadyUpdated(leave) ? "#ccc" : "#1976d2",
                    }}
                  >
                    {isAlreadyUpdated(leave) ? "Updated" : "Update Request"}
                  </button>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
