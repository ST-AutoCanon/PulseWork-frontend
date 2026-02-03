"use client";

import React, { useState, useCallback } from "react";
import { parseLocalDate } from "./leaveUtils.client";
import {
  MdOutlineEdit,
  MdDeleteOutline,
  MdOutlineAttachFile,
  MdOutlineRemoveRedEye,
  MdOpenInNew,
} from "react-icons/md";
import Modal from "../Modal/Modal.client";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";

export default function SelfTable({ leaveRequests, onEdit, onCancel }) {
  const { user } = useAuth();

  const sortedRequests = (leaveRequests?.self || []).sort((a, b) =>
    String(b.start_date).localeCompare(String(a.start_date)),
  );

  const isEditable = (status) => status !== "Approved" && status !== "Rejected";

  const renderStatusLabel = (status) => {
    const classes =
      status === "Approved"
        ? "leave-approved"
        : status === "Rejected"
          ? "leave-rejected"
          : "";
    return <span className={`leave-status-label ${classes}`}>{status}</span>;
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [previewList, setPreviewList] = useState([]);

  // cache for resolved blobs/preview objects per leave id
  const [attachmentsMap, setAttachmentsMap] = useState({});

  // backend config + headers builder
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    "http://localhost:5001";
  const apiKey =
    process.env.NEXT_PUBLIC_API_KEY || process.env.REACT_APP_API_KEY || "";

  const buildHeaders = useCallback(() => {
    const h = {};
    if (apiKey) h["x-api-key"] = apiKey;

    const actorId =
      user?.employeeId || user?.id || user?.raw?.employee_id || null;
    if (actorId) h["x-employee-id"] = String(actorId);

    const orgId = user?.orgId || user?.org_id || user?.raw?.org_id || null;
    if (orgId) h["x-org-id"] = String(orgId);

    const token = user?.raw?.token || user?.token || user?.authToken || "";
    if (token) h["Authorization"] = `Bearer ${token}`;

    return h;
  }, [user, apiKey]);

  const openUrlInNewTab = useCallback(
    (url) => {
      try {
        const base = backendBase.replace(/\/$/, "");
        const final = url && url.startsWith("/") ? `${base}${url}` : url;
        window.open(final, "_blank", "noopener,noreferrer");
      } catch (e) {
        window.location.href = url;
      }
    },
    [backendBase],
  );

  const buildAttachmentUrl = useCallback((attachment, leave) => {
    if (!attachment) return null;

    if (attachment.file_path && /^https?:\/\//i.test(attachment.file_path)) {
      return attachment.file_path;
    }
    if (attachment.file_path && attachment.file_path.startsWith("/")) {
      const orgQuery =
        leave && (leave.orgId || leave.org_id)
          ? `?orgId=${encodeURIComponent(leave.orgId || leave.org_id)}`
          : "";
      return `${attachment.file_path}${orgQuery}`;
    }
    if (attachment.id) {
      const orgQuery =
        leave && (leave.orgId || leave.org_id)
          ? `?orgId=${encodeURIComponent(leave.orgId || leave.org_id)}`
          : "";
      return `/attachments/${attachment.id}${orgQuery}`;
    }
    if (attachment.file_path) return attachment.file_path;
    return null;
  }, []);

  const onPreviewClick = (attachment, leave) => {
    // If cached resolved preview exists, open from cache
    const lid = String(leave?.id || leave?.leave_id || leave?.leaveId || "");
    const cache = attachmentsMap[lid] || [];
    const found = cache.find(
      (c) =>
        (c.id && attachment.id && String(c.id) === String(attachment.id)) ||
        c.file_name === (attachment.file_name || attachment.name),
    );
    if (found) {
      setPreviewAttachment(found);
      setPreviewList(cache);
      setPreviewOpen(true);
      return;
    }

    // otherwise try quick direct URL or fall back to fetching/resolving
    const url = buildAttachmentUrl(attachment, leave);
    const mime = (attachment.mime_type || "").toLowerCase();
    if (url && (mime.startsWith("image/") || mime === "application/pdf")) {
      const abs = url.startsWith("/")
        ? `${backendBase.replace(/\/$/, "")}${url}`
        : url;
      setPreviewAttachment({ ...attachment, url: abs });
      setPreviewList([]);
      setPreviewOpen(true);
      return;
    }
    // fallback: fetch + resolve and cache
    handleOpenLeaveAttachments([attachment], leave, { openDirect: true });
  };

  const onViewAllAttachments = (attachments = [], leave = null) => {
    handleOpenLeaveAttachments(attachments, leave);
  };

  const closePreview = () => {
    (previewList || []).forEach((p) => {
      try {
        if (p && p.url && p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
      } catch {}
    });
    setPreviewOpen(false);
    setPreviewAttachment(null);
    setPreviewList([]);
  };

  const AttachmentBadge = ({ att, leave }) => {
    const url = buildAttachmentUrl(att, leave);
    return (
      <div
        className="attachment-badge"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginRight: 6,
        }}
      >
        <MdOutlineAttachFile style={{ verticalAlign: "middle" }} />
        <button
          className="link-like"
          onClick={() => onPreviewClick(att, leave)}
          title={att.file_name || att.name || "attachment"}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          <span
            style={{
              maxWidth: 160,
              display: "inline-block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              verticalAlign: "middle",
            }}
          >
            {att.file_name || att.name || "file"}
          </span>
        </button>
        <button
          className="small-icon-button"
          onClick={() => {
            if (url) {
              const abs = url.startsWith("/")
                ? `${backendBase.replace(/\/$/, "")}${url}`
                : url;
              openUrlInNewTab(abs);
            } else {
              handleOpenLeaveAttachments([att], leave, { openInNewTab: true });
            }
          }}
          title="Open in new tab"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <MdOpenInNew />
        </button>
      </div>
    );
  };

  /**
   * handleOpenLeaveAttachments
   * - checks attachmentsMap cache by leave id first
   * - if cache present opens modal with cached previews
   * - otherwise resolves blobs (multiple strategies), caches them, then opens modal
   *
   * opts:
   *  - openDirect: prefer opening single file inline when resolved
   *  - openInNewTab: immediately open first resolved in new tab
   */
  const handleOpenLeaveAttachments = async (
    files = [],
    leave = null,
    opts = {},
  ) => {
    try {
      const leaveIdKey = String(
        leave?.id || leave?.leave_id || leave?.leaveId || "",
      );
      // 1) if cached, use it immediately
      if (attachmentsMap[leaveIdKey] && attachmentsMap[leaveIdKey].length > 0) {
        const cached = attachmentsMap[leaveIdKey];
        if (opts.openInNewTab && cached[0]?.url) {
          openUrlInNewTab(cached[0].url);
          return;
        }
        if (opts.openDirect && cached.length === 1) {
          setPreviewAttachment(cached[0]);
          setPreviewList(cached);
          setPreviewOpen(true);
          return;
        }
        setPreviewList(cached);
        setPreviewAttachment(cached[0] || null);
        setPreviewOpen(true);
        return;
      }

      // 2) if no files metadata passed, try to fetch metadata from server
      let candidateFiles = Array.isArray(files) ? files.slice() : [];
      if (!candidateFiles || candidateFiles.length === 0) {
        try {
          const url = `${backendBase.replace(/\/$/, "")}/employee/leave/${encodeURIComponent(leaveIdKey)}/attachments`;
          const resp = await axios.get(url, {
            withCredentials: true,
            headers: buildHeaders(),
          });
          const list = Array.isArray(resp.data)
            ? resp.data
            : Array.isArray(resp.data?.data)
              ? resp.data.data
              : Array.isArray(resp.data?.attachments)
                ? resp.data.attachments
                : [];
          candidateFiles = Array.isArray(list) ? list : [];
        } catch (err) {
          console.warn(
            "Could not fetch leave attachments metadata:",
            err?.response?.data || err?.message || err,
          );
        }
      }

      if (!candidateFiles || candidateFiles.length === 0) {
        // nothing to show
        alert?.("No attachments available.") || null;
        return;
      }

      const serverBase =
        (backendBase && String(backendBase).trim()) || "http://localhost:5001";
      const absBase = serverBase.replace(/\/$/, "");

      const tryFetchBlob = async (url, extraHeaders = {}) => {
        try {
          const resp = await axios.get(url, {
            withCredentials: true,
            headers: { ...buildHeaders(), ...extraHeaders },
            responseType: "blob",
          });
          return {
            ok: true,
            blob: resp.data,
            contentType: resp.headers["content-type"],
          };
        } catch (err) {
          return { ok: false, status: err?.response?.status || null, err };
        }
      };

      const resolved = await Promise.all(
        candidateFiles.map(async (fileOrAtt) => {
          const filename =
            fileOrAtt.file_name ||
            fileOrAtt.filename ||
            fileOrAtt.fileName ||
            fileOrAtt.name ||
            "";
          const attachId = fileOrAtt.id || fileOrAtt.attachment_id || null;
          const attEmp =
            fileOrAtt.employee_id ||
            fileOrAtt.emp_id ||
            fileOrAtt.employeeId ||
            leave?.employee_id ||
            leave?.employeeId;

          // 1) absolute URL in metadata
          const attUrl =
            fileOrAtt.url || fileOrAtt.file_url || fileOrAtt.filePath || null;
          if (attUrl && /^https?:\/\//i.test(String(attUrl))) {
            const r = await tryFetchBlob(attUrl);
            if (r.ok)
              return {
                id: attachId,
                file_name: filename || attUrl,
                url: URL.createObjectURL(r.blob),
                mime_type: r.contentType,
              };
          }

          // 2) serve by attachment id (/attachments/:id)
          if (attachId) {
            const serveUrl = `${absBase}/attachments/${encodeURIComponent(attachId)}${leave?.orgId ? `?orgId=${encodeURIComponent(leave.orgId)}` : ""}`;
            const r2 = await tryFetchBlob(serveUrl);
            if (r2.ok)
              return {
                id: attachId,
                file_name: filename || fileOrAtt.file_name || attachId,
                url: URL.createObjectURL(r2.blob),
                mime_type: r2.contentType,
              };
          }

          // 3) file_path
          if (fileOrAtt.file_path) {
            const fp = String(fileOrAtt.file_path);
            const candidatePath = fp.startsWith("/")
              ? `${absBase}${fp}`
              : `${absBase}/${fp}`;
            const r3 = await tryFetchBlob(candidatePath);
            if (r3.ok)
              return {
                id: attachId,
                file_name: filename || fp.split(/[\\/]/).pop(),
                url: URL.createObjectURL(r3.blob),
                mime_type: r3.contentType,
              };
          }

          // 4) legacy path using filename date prefix
          if (filename) {
            const m = String(filename).match(/^(\d{4})-(\d{2})-/);
            const year = m ? m[1] : null;
            const month = m ? m[2] : null;
            const empForPath =
              attEmp || leave?.employee_id || leave?.employeeId;
            if (year && month && empForPath) {
              const legacyUrl = `${absBase}/employee/leave/${encodeURIComponent(year)}/${encodeURIComponent(month)}/${encodeURIComponent(empForPath)}/${encodeURIComponent(filename)}`;
              const r4 = await tryFetchBlob(legacyUrl);
              if (r4.ok)
                return {
                  id: attachId,
                  file_name: filename,
                  url: URL.createObjectURL(r4.blob),
                  mime_type: r4.contentType,
                };
            }
          }

          // 5) last resort: ask metadata endpoint for canonical path (if available)
          try {
            const metaResp = await axios.get(
              `${absBase}/employee/leave/${encodeURIComponent(leaveIdKey)}/attachments`,
              {
                withCredentials: true,
                headers: buildHeaders(),
              },
            );
            const metas = Array.isArray(metaResp.data)
              ? metaResp.data
              : Array.isArray(metaResp.data?.data)
                ? metaResp.data.data
                : [];
            if (metas.length) {
              const meta =
                metas.find(
                  (m) => (m.file_name || m.filename || m.name) === filename,
                ) || metas[0];
              if (meta) {
                if (meta.url && /^https?:\/\//i.test(meta.url)) {
                  const rM = await tryFetchBlob(meta.url);
                  if (rM.ok)
                    return {
                      id: meta.id || attachId,
                      file_name: meta.file_name || filename,
                      url: URL.createObjectURL(rM.blob),
                      mime_type: rM.contentType,
                    };
                }
                if (meta.file_path) {
                  const candidatePath = meta.file_path.startsWith("/")
                    ? `${absBase}${meta.file_path}`
                    : `${absBase}/${meta.file_path}`;
                  const rM2 = await tryFetchBlob(candidatePath);
                  if (rM2.ok)
                    return {
                      id: meta.id || attachId,
                      file_name: meta.file_name || filename,
                      url: URL.createObjectURL(rM2.blob),
                      mime_type: rM2.contentType,
                    };
                }
              }
            }
          } catch (metaErr) {
            // ignore
          }

          console.warn(
            "All attempts failed for attachment:",
            filename,
            fileOrAtt,
          );
          return null;
        }),
      );

      const goodFiles = (resolved || []).filter(Boolean);
      if (goodFiles.length === 0) {
        alert?.("No attachments could be retrieved (file not found).") || null;
        return;
      }

      // cache resolved preview objects
      setAttachmentsMap((prev) => ({ ...prev, [leaveIdKey]: goodFiles }));

      if (opts.openInNewTab && goodFiles[0] && goodFiles[0].url) {
        openUrlInNewTab(goodFiles[0].url);
        return;
      }

      if (opts.openDirect && goodFiles.length === 1) {
        const single = goodFiles[0];
        const mt = (single.mime_type || "").toLowerCase();
        if (mt.startsWith("image/") || mt === "application/pdf") {
          setPreviewAttachment(single);
          setPreviewList([]);
          setPreviewOpen(true);
          return;
        } else {
          openUrlInNewTab(single.url);
          return;
        }
      }

      setPreviewList(goodFiles);
      setPreviewAttachment(goodFiles[0] || null);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Error opening leave attachments:", err);
      alert?.("Failed to open attachments.") || null;
    }
  };

  return (
    <>
      <h4 className="my-leaves">My Leave Requests</h4>

      <div className="leave-request-table desktop-view">
        <table className="leave-requests">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Half/Full Day</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Comments</th>
              <th>Attachments</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.map((request) => {
              // attachments list may come from request.attachments or from cache
              const reqAttachments = Array.isArray(request.attachments)
                ? request.attachments
                : [];
              const lid = String(
                request.id || request.leave_id || request.leaveId || "",
              );
              const cached = attachmentsMap[lid] || [];

              return (
                <tr key={request.id || request.leave_id}>
                  <td>{request.leave_type}</td>
                  <td>{parseLocalDate(request.start_date)}</td>
                  <td>{parseLocalDate(request.end_date)}</td>
                  <td>{request.H_F_day}</td>
                  <td className="comment-col">
                    <div className="comment-preview">{request.reason}</div>
                  </td>
                  <td>{renderStatusLabel(request.status)}</td>
                  <td className="comment-col">
                    <div className="comment-preview">{request.comments}</div>
                  </td>

                  {/* Attachments column: eye icon button that opens modal and caches files */}
                  <td>
                    {(reqAttachments && reqAttachments.length > 0) ||
                    (cached && cached.length > 0) ? (
                      <div>
                        <button
                          className="attachments-btn"
                          onClick={() =>
                            // prefer cached previews if present; else use request.attachments
                            handleOpenLeaveAttachments(
                              cached && cached.length > 0
                                ? cached
                                : reqAttachments,
                              request,
                            )
                          }
                          title="View attachments"
                        >
                          <MdOutlineRemoveRedEye className="eye-icon" /> View{" "}
                          {cached && cached.length > 0
                            ? `(${cached.length})`
                            : reqAttachments.length
                              ? `(${reqAttachments.length})`
                              : ""}
                        </button>
                      </div>
                    ) : (
                      <div className="no-attachments">Not Attached</div>
                    )}
                  </td>

                  <td>
                    <MdOutlineEdit
                      onClick={() =>
                        isEditable(request.status) && onEdit(request)
                      }
                      className={`action-button ${!isEditable(request.status) ? "disabled" : ""}`}
                    />
                    <MdDeleteOutline
                      onClick={() =>
                        isEditable(request.status) &&
                        onCancel(request.id || request.leave_id)
                      }
                      className={`action-button ${!isEditable(request.status) ? "disabled" : ""}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* compact mobile list */}
      <div className="self-compact-list">
        {sortedRequests.map((request) => {
          const reqAttachments = Array.isArray(request.attachments)
            ? request.attachments
            : [];
          const lid = String(
            request.id || request.leave_id || request.leaveId || "",
          );
          const cached = attachmentsMap[lid] || [];

          return (
            <details
              key={request.id || request.leave_id}
              className="compact-item"
            >
              <summary className="compact-summary">
                <div className="compact-main">
                  <strong>{request.leave_type}</strong>
                  <span className="compact-dates">
                    {parseLocalDate(request.start_date)} -{" "}
                    {parseLocalDate(request.end_date)}
                  </span>
                </div>
                {renderStatusLabel(request.status)}
              </summary>
              <div className="compact-details">
                <div>
                  <strong>Type:</strong> {request.H_F_day}
                </div>
                {request.reason && (
                  <div>
                    <strong>Reason:</strong> {request.reason}
                  </div>
                )}
                {request.comments && (
                  <div>
                    <strong>Comments:</strong> {request.comments}
                  </div>
                )}

                <div style={{ marginTop: 8 }}>
                  <strong>Attachments: </strong>
                  {(reqAttachments && reqAttachments.length > 0) ||
                  (cached && cached.length > 0) ? (
                    <div style={{ marginTop: 6 }}>
                      <button
                        className="attachments-btn"
                        onClick={() =>
                          handleOpenLeaveAttachments(
                            cached && cached.length > 0
                              ? cached
                              : reqAttachments,
                            request,
                          )
                        }
                      >
                        <MdOutlineRemoveRedEye className="eye-icon" /> View{" "}
                        {cached && cached.length > 0
                          ? `(${cached.length})`
                          : reqAttachments.length
                            ? `(${reqAttachments.length})`
                            : ""}
                      </button>
                    </div>
                  ) : (
                    <span style={{ marginLeft: 6 }}>—</span>
                  )}
                </div>

                <div className="compact-actions" style={{ marginTop: 12 }}>
                  <button
                    disabled={!isEditable(request.status)}
                    onClick={() => onEdit(request)}
                  >
                    Edit
                  </button>
                  <button
                    disabled={!isEditable(request.status)}
                    onClick={() => onCancel(request.id || request.leave_id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </details>
          );
        })}
      </div>

      {/* Preview Modal */}
      <Modal
        title={
          previewAttachment
            ? previewAttachment.file_name || previewAttachment.name
            : "Attachments"
        }
        isVisible={previewOpen}
        onClose={closePreview}
        buttons={[
          { label: "Close", onClick: closePreview },
          ...(previewAttachment && previewAttachment.url
            ? [
                {
                  label: "Open in new tab",
                  onClick: () => openUrlInNewTab(previewAttachment.url),
                },
              ]
            : []),
        ]}
      >
        <div style={{ minWidth: 320, minHeight: 160 }}>
          {previewAttachment ? (
            <>
              {previewAttachment.mime_type &&
                previewAttachment.mime_type.startsWith("image/") && (
                  <img
                    src={previewAttachment.url}
                    alt={previewAttachment.file_name || previewAttachment.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "70vh",
                      display: "block",
                      margin: "0 auto",
                    }}
                  />
                )}

              {previewAttachment.mime_type === "application/pdf" && (
                <iframe
                  src={previewAttachment.url}
                  title={previewAttachment.file_name || "pdf"}
                  style={{ width: "100%", height: "70vh", border: "none" }}
                />
              )}

              {(!previewAttachment.mime_type ||
                (!previewAttachment.mime_type.startsWith("image/") &&
                  previewAttachment.mime_type !== "application/pdf")) && (
                <div style={{ padding: 12 }}>
                  <p>
                    <strong>
                      {previewAttachment.file_name || previewAttachment.name}
                    </strong>
                  </p>
                  <p>
                    <button
                      onClick={() =>
                        previewAttachment.url &&
                        openUrlInNewTab(previewAttachment.url)
                      }
                    >
                      <MdOutlineRemoveRedEye /> Open / Download
                    </button>
                  </p>
                </div>
              )}

              {previewList && previewList.length > 1 && (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 8,
                    overflowX: "auto",
                  }}
                >
                  {previewList.map((p) => (
                    <button
                      key={p.id || p.file_name}
                      onClick={() => setPreviewAttachment(p)}
                      style={{
                        border:
                          previewAttachment &&
                          (p.id === previewAttachment.id ||
                            p.url === previewAttachment.url)
                            ? "2px solid #0070f3"
                            : "1px solid #ddd",
                        padding: 4,
                        background: "#fff",
                      }}
                    >
                      {p.mime_type && p.mime_type.startsWith("image/") ? (
                        <img
                          src={p.url}
                          alt={p.file_name}
                          style={{ width: 80, height: 60, objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 80,
                            height: 60,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MdOutlineAttachFile size={20} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>No attachment selected</div>
          )}
        </div>
      </Modal>
    </>
  );
}
