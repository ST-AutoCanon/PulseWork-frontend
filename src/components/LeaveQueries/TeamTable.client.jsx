"use client";

import React, { useState, useEffect, useCallback } from "react";
import Modal from "../Modal/Modal.client";
import { MdOutlineRemoveRedEye, MdOutlineAttachFile } from "react-icons/md";
import {
  parseLocalDate,
  calculateDays,
  normalizeLeaveTypes,
} from "./leaveUtils.client";
import { useAuth } from "../../context/AuthProvider.client";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

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
  const { user } = useAuth();

  if (!canViewTeam) return null;

  const sortedLeaves = (leaveRequests.team || []).sort(
    (a, b) => (b.leave_id || b.id || 0) - (a.leave_id || a.id || 0),
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

  // -------------------------
  // Attachment helpers (same UX as Admin)
  // -------------------------
  const [attachmentsModal, setAttachmentsModal] = useState({
    isVisible: false,
    title: "",
    files: [],
  });
  const [attachmentsMap, setAttachmentsMap] = useState({});

  const buildHeaders = useCallback(() => {
    const h = { "Content-Type": "application/json" };
    if (user?.employeeId || user?.id) {
      h["x-employee-id"] = user.employeeId || user.id;
    }
    if (user?.orgId || user?.raw?.org_id || user?.org_id) {
      h["x-org-id"] =
        user.orgId || user.raw?.org_id || user.org_id || user.organization_id;
    }
    return h;
  }, [user]);

  const extractAttachments = (query) => {
    if (!query) return [];

    const candidates = [
      query.attachments,
      query.leave_attachments,
      query.files,
      query.attachments_list,
      query.files_list,
      query.attachment_list,
      query.attachmentsData,
      query.data && query.data.attachments,
      query.data,
      query.payload,
    ];

    for (let cand of candidates) {
      if (!cand) continue;

      if (Array.isArray(cand) && cand.length > 0) return cand;

      if (typeof cand === "object" && cand !== null) {
        if (Array.isArray(cand.data) && cand.data.length > 0) return cand.data;
        if (Array.isArray(cand.attachments) && cand.attachments.length > 0)
          return cand.attachments;
        if (Array.isArray(cand.rows) && cand.rows.length > 0) return cand.rows;
        if (Array.isArray(cand.list) && cand.list.length > 0) return cand.list;
      }

      if (typeof cand === "string") {
        try {
          const parsed = JSON.parse(cand);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0)
            return parsed.data;
        } catch (e) {}
      }
    }

    const possibleSingle =
      query.file_name ||
      query.file_path ||
      query.file_url ||
      query.fileUrl ||
      query.filename;
    if (possibleSingle) {
      return [
        {
          id: query.id || null,
          file_name:
            query.file_name ||
            query.filename ||
            query.name ||
            `attachment-${query.id || "1"}`,
          file_path: query.file_path || query.file_url || query.url || null,
          mime_type: query.mime_type || query.type || "",
          size: query.size || null,
          created_at: query.created_at || null,
        },
      ];
    }

    return [];
  };

  const normalizeAttachment = (raw) => {
    if (!raw) return null;
    if (typeof raw === "string") {
      return {
        id: null,
        file_name: raw.split("/").pop(),
        file_path: raw,
        mime_type: "",
        size: null,
        created_at: null,
        url: raw,
      };
    }

    return {
      id:
        raw.id || raw.file_id || raw.attachment_id || raw.attachmentId || null,
      file_name:
        raw.file_name ||
        raw.filename ||
        raw.name ||
        raw.fileName ||
        (raw.file_path ? String(raw.file_path).split("/").pop() : "attachment"),
      file_path:
        raw.file_path ||
        raw.path ||
        raw.url ||
        raw.file_url ||
        raw.filePath ||
        null,
      mime_type: raw.mime_type || raw.type || raw.contentType || "",
      size: raw.size || raw.file_size || raw.length || null,
      created_at: raw.created_at || raw.createdAt || raw.uploaded_at || null,
      url: raw.url || raw.file_url || null,
    };
  };

  const normalizeList = (rawList) => {
    if (!Array.isArray(rawList)) return [];
    return rawList.map((r) => normalizeAttachment(r)).filter(Boolean);
  };

  const getNormalizedPreviewList = (query) => {
    const raw = extractAttachments(query);
    return normalizeList(raw);
  };

  const openAttachments = async (query, providedAttachments = null) => {
    if (!query) return;
    const lid = String(query.leave_id || query.id || query.leaveId || "");

    let normalized =
      Array.isArray(providedAttachments) && providedAttachments.length > 0
        ? normalizeList(providedAttachments)
        : [];

    if ((!normalized || normalized.length === 0) && attachmentsMap[lid]) {
      normalized = attachmentsMap[lid];
    }

    if (!normalized || normalized.length === 0) {
      const raw = extractAttachments(query);
      if (Array.isArray(raw) && raw.length > 0) {
        normalized = normalizeList(raw);
      }
    }

    if (!normalized || normalized.length === 0) {
      const candidates = [
        `${API_BASE}/admin/leave/${query.leave_id}/attachments`,
        `${API_BASE}/leave/${query.leave_id}/attachments`,
        `${API_BASE}/api/leave/${query.leave_id}/attachments`,
        `${API_BASE}/api/admin/leave/${query.leave_id}/attachments`,
        `${API_BASE}/employee/leave/${query.leave_id}/attachments`,
      ].filter(Boolean);

      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            credentials: "include",
            headers: buildHeaders(),
          });
          if (!res.ok) continue;
          const json = await res.json().catch(() => null);
          const raw = json?.data || json?.attachments || json || [];
          if (Array.isArray(raw) && raw.length > 0) {
            normalized = normalizeList(raw);
            break;
          }
        } catch (err) {
          // ignore
        }
      }
    }

    if (!normalized || normalized.length === 0) {
      setAttachmentsModal({
        isVisible: true,
        title: `Attachments — ${query.name || query.employee_id || query.leave_id}`,
        files: [],
      });
      return;
    }

    setAttachmentsMap((prev) => ({ ...prev, [lid]: normalized }));
    setAttachmentsModal({
      isVisible: true,
      title: `Attachments — ${query.name || query.employee_id || query.leave_id}`,
      files: normalized,
    });
  };

  const closeAttachments = useCallback(() => {
    setAttachmentsModal({ isVisible: false, title: "", files: [] });
  }, []);

  // Replace the existing openFileInNewTab in TeamTable with this:
  const openFileInNewTab = async (file) => {
    if (!file) return;

    // try to build attachment URL (if server expects attachment id)
    const attachmentId = file.id || file.attachment_id || file.file_id || null;
    let url = "";
    if (attachmentId) {
      const base = API_BASE.replace(/\/$/, "");
      url = `${base}/attachments/${encodeURIComponent(attachmentId)}`;
    } else {
      url = file.url || file.file_url || file.file_path || "";
      if (!/^https?:\/\//i.test(url) && API_BASE) {
        url = `${API_BASE.replace(/\/$/, "")}/${String(url).replace(/^\//, "")}`;
      }
    }

    if (!url) {
      console.error("[openFileInNewTab] no url for file", file);
      return;
    }

    try {
      // Quick HEAD check: if direct public URL works, open it (no headers needed)
      try {
        const headRes = await fetch(url, {
          method: "HEAD",
          credentials: "include",
        });
        if (headRes.ok) {
          window.open(url, "_blank", "noopener,noreferrer");
          return;
        }
        // else fall through to fetch with headers
      } catch (e) {
        // HEAD might fail due to CORS or server not supporting HEAD — try GET below
      }

      // Fetch the file while sending tenant headers / cookies
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: buildHeaders(),
      });

      if (!res.ok) {
        let json = null;
        try {
          json = await res.json();
        } catch (e) {}
        const serverMsg =
          (json && (json.message || json.error)) ||
          `Failed to fetch file (HTTP ${res.status})`;
        console.warn(
          "[openFileInNewTab] server responded non-ok",
          res.status,
          serverMsg,
        );
        // user visible feedback
        alert(serverMsg);
        return;
      }

      // create a blob and open in new tab (works for PDFs/images inline)
      const arrayBuffer = await res.arrayBuffer();
      const serverContentType = res.headers.get("Content-Type") || "";
      const knownMime =
        file.mime_type ||
        file.mime ||
        serverContentType ||
        "application/octet-stream";
      const blob = new Blob([arrayBuffer], { type: knownMime });
      const objectUrl = URL.createObjectURL(blob);

      // Use anchor click (more reliable for blob URLs)
      const a = document.createElement("a");
      a.href = objectUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();

      // revoke after a short delay
      setTimeout(
        () => {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch (e) {}
        },
        2 * 60 * 1000,
      ); // 2 minutes
    } catch (err) {
      console.error("[openFileInNewTab] error:", err);
      alert("Could not open attachment. See console for details.");
    }
  };

  const getRemainingForLeave = async (leave) => {
    try {
      if (typeof loadLeaveBalance === "function") {
        const balances = await loadLeaveBalance(leave.employee_id);
        if (Array.isArray(balances)) {
          const b = balances.find(
            (r) => String(r.type) === String(leave.leave_type),
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

    let isDefaultedFlag = false;
    if (rawPayload) {
      if (Object.prototype.hasOwnProperty.call(rawPayload, "is_defaulted"))
        isDefaultedFlag = !!rawPayload.is_defaulted;
      else if (Object.prototype.hasOwnProperty.call(rawPayload, "isDefaulted"))
        isDefaultedFlag = !!rawPayload.isDefaulted;
    }

    if (!isDefaultedFlag) {
      const policy = (function findPolicyForRequest(request) {
        const d = request?.start_date ?? request?.startDate ?? null;
        if (!d) return null;
        const reqDate = new Date(d);
        reqDate.setHours(0, 0, 0, 0);
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
      })(leave);

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
          remainingNum - deducted_clamped,
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
        lopDays,
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
          Number(remaining) - Number(deducted_clamped),
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
          Number(days) - Math.min(Number(remaining), Number(days)),
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
              <th>Attachment</th>
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
                leave.H_F_day,
              );

              // compute display name (used in both compact + desktop)
              const name =
                leave.name ||
                `${leave.first_name || ""} ${leave.last_name || ""}`.trim();

              const previewList = getNormalizedPreviewList(leave);
              const hasEmbeddedAttachments =
                previewList && previewList.length > 0;
              const hasPossibleServerAttachments = Boolean(leave.leave_id);
              const hasAttachments =
                hasEmbeddedAttachments || hasPossibleServerAttachments;

              let attachmentCell = null;
              if (hasAttachments) {
                const count = hasEmbeddedAttachments
                  ? previewList.length
                  : leave.attachment_count || leave.attachments_count || "";
                attachmentCell = (
                  <div>
                    <button
                      className="attachments-btn"
                      onClick={() =>
                        openAttachments(
                          leave,
                          hasEmbeddedAttachments ? previewList : null,
                        )
                      }
                      title="View attachments"
                    >
                      <MdOutlineRemoveRedEye className="eye-icon" />
                      <span>View {count ? `(${count})` : ""}</span>
                    </button>
                  </div>
                );
              } else {
                attachmentCell = (
                  <div className="no-attachments">Not Attached</div>
                );
              }

              return (
                <tr
                  key={leave.leave_id}
                  className={isAlreadyUpdated(leave) ? "row-updated" : ""}
                >
                  <td
                    className="employee-name"
                    data-full={name}
                    title={name} /* native fallback for accessibility & touch */
                  >
                    <span className="truncate">{name}</span>
                  </td>{" "}
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
                          setLocalInputs((prev) => ({
                            ...prev,
                            [leave.leave_id]: {
                              ...prev[leave.leave_id],
                              comments: v,
                            },
                          }));
                          handleStatusChange?.(leave.leave_id, "comments", v);
                        }}
                        disabled={isAlreadyUpdated(leave)}
                        className="comments-input"
                      />
                    )}
                  </td>
                  <td>{attachmentCell}</td>
                  <td>
                    <button
                      onClick={() => handleUpdateClick(leave)}
                      disabled={
                        isAlreadyUpdated(leave) ||
                        (!local.status && !local.comments)
                      }
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

      {/* compact/mobile view unchanged (keeps using `name` variable there) */}
      <div className="self-compact-list">
        {sortedLeaves.map((leave) => {
          const local = localInputs[leave.leave_id] || {};
          const update = statusUpdates?.[leave.leave_id] || {};
          const currentStatus =
            local.status ?? update.status ?? leave.status ?? "pending";
          const days = calculateDays(
            leave.start_date,
            leave.end_date,
            leave.H_F_day,
          );
          const name =
            leave.name ||
            `${leave.first_name || ""} ${leave.last_name || ""}`.trim();

          const previewList = getNormalizedPreviewList(leave);
          const hasEmbeddedAttachments = previewList && previewList.length > 0;
          const hasPossibleServerAttachments = Boolean(leave.leave_id);
          const hasAttachments =
            hasEmbeddedAttachments || hasPossibleServerAttachments;

          return (
            <details key={leave.leave_id} className="compact-item">
              <summary className="compact-summary">
                <div className="compact-main">
                  <span className="compact-dates">
                    {parseLocalDate(leave.start_date)} →{" "}
                    {parseLocalDate(leave.end_date)}
                  </span>
                  <div style={{ fontSize: "0.9em", color: "#555" }}>
                    {name} • {leave.leave_type} • {days}{" "}
                    {days === 1 ? "day" : "days"}
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

                <div style={{ marginTop: 8 }}>
                  <strong>Attachments:</strong>{" "}
                  {hasAttachments ? (
                    <button
                      onClick={() =>
                        openAttachments(
                          leave,
                          hasEmbeddedAttachments ? previewList : null,
                        )
                      }
                      style={{ marginLeft: 8 }}
                    >
                      <MdOutlineAttachFile
                        style={{ verticalAlign: "middle" }}
                      />{" "}
                      View
                    </button>
                  ) : (
                    <span style={{ color: "#999", marginLeft: 8 }}>
                      Not Attached
                    </span>
                  )}
                </div>

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
                        setLocalInputs((prev) => ({
                          ...prev,
                          [leave.leave_id]: {
                            ...prev[leave.leave_id],
                            comments: v,
                          },
                        }));
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

      <Modal
        isVisible={attachmentsModal.isVisible}
        onClose={closeAttachments}
        buttons={[{ label: "Close", onClick: closeAttachments }]}
      >
        <div className="professional-attachments-modal">
          <h4 className="modal-title">
            {attachmentsModal.title || "Attachments"}
          </h4>

          {attachmentsModal.files.length === 0 ? (
            <div className="no-files">
              <p>No attachments found for this leave request.</p>
            </div>
          ) : (
            <div className="attachments-list">
              {attachmentsModal.files.map((f, idx) => {
                const safeName = f.file_name || `Attachment ${idx + 1}`;
                const urlCandidate = f.url || f.file_path || f.file_url || "";
                const fileSize = f.size
                  ? `${(f.size / 1024).toFixed(1)} KB`
                  : null;

                return (
                  <div key={f.id || idx} className="attachment-row">
                    <div className="attachment-left">
                      <MdOutlineAttachFile className="file-icon" />
                      <div className="attachment-details">
                        <button
                          className="file-name-btn"
                          onClick={() => openFileInNewTab(f)}
                        >
                          {safeName}
                        </button>
                        <div className="attachment-meta">
                          {f.mime_type && <span>{f.mime_type}</span>}
                          {fileSize && <span>{fileSize}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="attachment-right">
                      {urlCandidate ? (
                        <button
                          className="open-btn"
                          onClick={() => openFileInNewTab(f)}
                        >
                          Open
                        </button>
                      ) : (
                        <span className="no-url">No preview available</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
