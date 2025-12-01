

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
    if (Object.prototype.hasOwnProperty.call(payload, "is_defaulted")) return normalizeBoolean(payload.is_defaulted);
    if (Object.prototype.hasOwnProperty.call(payload, "isDefaulted")) return normalizeBoolean(payload.isDefaulted);
    return false;
  };

  const handleUpdateClick = (leave) => {
    if (!onUpdate) return;

    const rawPayload = localInputs[leave.leave_id] || statusUpdates?.[leave.leave_id] || {};
    let isDefaultedFlag = normalizeIsDefaulted(rawPayload);

    const effectiveStatus = rawPayload.status ?? statusUpdates?.[leave.leave_id]?.status ?? leave.status;

    if (!isDefaultedFlag && effectiveStatus === "Approved") {
      const policy = findPolicyForRequest(leave);
      if (!policy) isDefaultedFlag = true;
    }

    const days = calculateDays(leave.start_date, leave.end_date, leave.H_F_day);

    const defaultedPayload = {
      ...rawPayload,
      compensated_days: 0,
      deducted_days: 0,
      loss_of_pay_days: Number(days),
      total_days: Number(days),
      preserved_leave_days: null,
      is_defaulted: isDefaultedFlag,
      isDefaulted: isDefaultedFlag,
    };

    const payloadToSend = isDefaultedFlag ? defaultedPayload : rawPayload;
    onUpdate(leave.leave_id, payloadToSend);
  };

  const renderStatusBadge = (status) => {
    const className = getStatusClass(status);
    return <span className={`leave-status-label ${className}`}>{status || "Pending"}</span>;
  };

  const isAlreadyUpdated = (leave) => leave.status !== "pending";
  const isPending = (leave) => (getCurrentStatus(leave) || "pending") === "pending";

  return (
    <>
      <h4 className="my-leaves">Team Leave Requests</h4>

      {/* Desktop Table */}
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
              const currentStatus = local.status ?? update.status ?? leave.status ?? "pending";
              const days = calculateDays(leave.start_date, leave.end_date, leave.H_F_day);

              return (
                <tr key={leave.leave_id} className={isAlreadyUpdated(leave) ? "row-updated" : ""}>
                  <td>{leave.name || `${leave.first_name || ""} ${leave.last_name || ""}`.trim()}</td>
                  <td>{leave.employee_id}</td>
                  <td>{leave.leave_type}</td>
                  <td>{leave.H_F_day}</td>
                  <td>{parseLocalDate(leave.start_date)}</td>
                  <td>{parseLocalDate(leave.end_date)}</td>
                  <td className="comments-col"><div className="comment-preview">{leave.reason}</div></td>
                  <td>{days}</td>
                  <td>
                    <select
                      value={currentStatus}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalInputs(prev => ({ ...prev, [leave.leave_id]: { ...prev[leave.leave_id], status: val } }));
                        handleStatusChange?.(leave.leave_id, "status", val);
                      }}
                      className={`status-dropdown ${getStatusClass(currentStatus)}`}
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
                      disabled={isAlreadyUpdated(leave) || !local.status && !local.comments}
                      className={`update-button ${isAlreadyUpdated(leave) ? "disabled-button" : ""}`}
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

      {/* Mobile Cards - Same Style as SelfTable */}
      <div className="self-compact-list">
        {sortedLeaves.map((leave) => {
          const local = localInputs[leave.leave_id] || {};
          const update = statusUpdates?.[leave.leave_id] || {};
          const currentStatus = local.status ?? update.status ?? leave.status ?? "pending";
          const days = calculateDays(leave.start_date, leave.end_date, leave.H_F_day);
          const name = leave.name || `${leave.first_name || ""} ${leave.last_name || ""}`.trim();

          return (
            <details key={leave.leave_id} className="compact-item">
              <summary className="compact-summary">
                <div className="compact-main">
                  <strong>{name}</strong>
                  <span className="compact-dates">
                    {parseLocalDate(leave.start_date)} → {parseLocalDate(leave.end_date)}
                  </span>
                  <div style={{ fontSize: "0.9em", color: "#555" }}>
                    {leave.leave_type} • {days} {days === 1 ? "day" : "days"}
                  </div>
                </div>
                {renderStatusBadge(currentStatus)}
              </summary>

              <div className="compact-details">
                <div><strong>Employee ID:</strong> {leave.employee_id}</div>
                <div><strong>Type:</strong> {leave.H_F_day || "Full Day"}</div>
                {leave.reason && <div><strong>Reason:</strong> {leave.reason}</div>}

                <div className="compact-form-section">
                  <label><strong>Status</strong></label>
                  <select
                    value={currentStatus}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalInputs(prev => ({
                        ...prev,
                        [leave.leave_id]: { ...prev[leave.leave_id], status: val },
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
                  <label><strong>Comment (optional)</strong></label>
                  {leave.comments ? (
                    <p style={{ margin: "8px 0", color: "#d32f2f" }}>{leave.comments}</p>
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
                    disabled={isAlreadyUpdated(leave) || (!local.status && !local.comments)}
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