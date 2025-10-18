"use client";

import React, { useState, useEffect } from "react";
import { parseLocalDate, calculateDays } from "./leaveUtils.client";

export default function TeamTable({
  leaveRequests,
  statusUpdates,
  handleStatusChange,
  onUpdate,
  canViewTeam,
  policies = [], // NEW: pass policies array (optional)
  activePolicy = null, // NEW: or pass an activePolicy (optional)
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
      : "";

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
    // Prefer searching policies array; otherwise try activePolicy fallback
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
        } catch {
          /* skip malformed */
        }
      }
    }

    // fallback: check provided activePolicy if it covers request
    if (activePolicy && activePolicy.year_start && activePolicy.year_end) {
      try {
        const s = new Date(activePolicy.year_start);
        const e = new Date(activePolicy.year_end);
        s.setHours(0, 0, 0, 0);
        e.setHours(0, 0, 0, 0);
        if (s <= reqDate && reqDate <= e) return activePolicy;
      } catch {
        /* ignore */
      }
    }

    return null;
  };

  // Robust boolean normalizer — accepts booleans, numbers (1/0), and common string forms
  const normalizeBoolean = (v) => {
    if (v === true || v === false) return v;
    if (typeof v === "string") {
      const t = v.trim().toLowerCase();
      if (t === "true" || t === "1" || t === "yes" || t === "on") return true;
      if (t === "false" || t === "0" || t === "no" || t === "off") return false;
      return false;
    }
    if (typeof v === "number") return v !== 0;
    return false;
  };

  // Prefer explicit property presence: if payload has is_defaulted use that, else if it has isDefaulted use that.
  const normalizeIsDefaulted = (payload) => {
    if (!payload || typeof payload !== "object") return false;
    if (Object.prototype.hasOwnProperty.call(payload, "is_defaulted")) {
      return normalizeBoolean(payload.is_defaulted);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "isDefaulted")) {
      return normalizeBoolean(payload.isDefaulted);
    }
    return false;
  };

  return (
    <>
      <h4 className="my-leaves">Team Leave Requests</h4>
      <div className="leave-request-table">
        <table className="leave-requests">
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
            {sortedLeaves.map((leave) => {
              const update = statusUpdates?.[leave.leave_id] || {};
              const local = localInputs?.[leave.leave_id] || {};
              const currentStatus = getCurrentStatus(leave);
              const statusClass = getStatusClass(currentStatus);
              const isAlreadyUpdated = leave.status !== "pending";
              const isUpdating =
                (local.status ?? update.status) &&
                (local.status ?? update.status) !== leave.status;
              const days = calculateDays(
                leave.start_date,
                leave.end_date,
                leave.H_F_day
              );

              return (
                <tr
                  key={leave.leave_id || leave.id}
                  className={isAlreadyUpdated ? "row-updated" : ""}
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
                      value={
                        local.status ??
                        update.status ??
                        leave.status ??
                        "pending"
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalInputs((prev) => ({
                          ...prev,
                          [leave.leave_id]: {
                            ...(prev[leave.leave_id] || {}),
                            status: val,
                          },
                        }));
                        if (typeof handleStatusChange === "function") {
                          handleStatusChange(leave.leave_id, "status", val);
                        }
                      }}
                      className={`status-dropdown ${statusClass}`}
                      disabled={isAlreadyUpdated}
                    >
                      <option value="pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>

                  <td className="comments-col">
                    <div className="comment-preview">
                      {leave.comments ? (
                        <span className="comments-display">
                          {leave.comments}
                        </span>
                      ) : (
                        <input
                          type="text"
                          placeholder="Enter Reason"
                          value={local.comments ?? update.comments ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLocalComment(leave.leave_id, v);
                            if (typeof handleStatusChange === "function") {
                              handleStatusChange(leave.leave_id, "comments", v);
                            }
                          }}
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
                      // inside the render for each leave row, replace existing onClick callback
                      onClick={() => {
                        if (!onUpdate) return;
                        const rawPayload =
                          localInputs[leave.leave_id] || update || {};

                        // respect explicit flags from UI if set
                        let isDefaultedFlag = normalizeIsDefaulted(rawPayload);

                        // effective status (prefer explicit input)
                        const effectiveStatus =
                          rawPayload.status ??
                          update.status ??
                          leave.status ??
                          "";

                        // if approving and no policy covers the request start date -> default behavior
                        if (
                          !isDefaultedFlag &&
                          String(effectiveStatus).toLowerCase() === "approved"
                        ) {
                          const foundPolicy = findPolicyForRequest(leave);
                          if (!foundPolicy) {
                            isDefaultedFlag = true;
                          }
                        }

                        // compute total requested days (use your util; adjust params if needed)
                        const days = calculateDays(
                          leave.start_date,
                          leave.end_date,
                          leave.H_F_day
                        );

                        // Build the minimal "default approval" payload required by server
                        // Mirror the Admin component's simplePayload:
                        const defaultedPayload = {
                          // status/comments will come from rawPayload if present
                          ...rawPayload,

                          // default splits: all days as Loss-of-Pay, no compensated/deducted
                          compensated_days: 0,
                          compensatedDays: 0,
                          compensated: 0,

                          deducted_days: 0,
                          deductedDays: 0,
                          deducted: 0,

                          loss_of_pay_days: Number(days),
                          lopDays: Number(days),
                          loss_of_pay: Number(days),

                          // preserved leave: unknown here; set to null (Admin used remaining if available)
                          preserved_leave_days: null,
                          preservedLeaveDays: null,
                          preserved: null,

                          total_days: Number(days),
                          totalDays: Number(days),

                          is_defaulted: isDefaultedFlag,
                          isDefaulted: isDefaultedFlag,
                        };

                        // If not defaulted, just send rawPayload (it may contain status/comments/etc)
                        const payloadToSend = isDefaultedFlag
                          ? defaultedPayload
                          : { ...rawPayload };

                        onUpdate(leave.leave_id, payloadToSend);
                      }}
                      disabled={
                        isAlreadyUpdated ||
                        !isUpdating ||
                        ((local.comments ?? update.comments) === "" &&
                          (local.status ?? update.status) === "Rejected")
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
    </>
  );
}
