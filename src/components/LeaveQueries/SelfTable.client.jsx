"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { parseLocalDate } from "./leaveUtils.client";
import {
  MdOutlineEdit,
  MdDeleteOutline,
  MdOutlineAttachFile,
  MdOutlineRemoveRedEye,
  MdOpenInNew,
  MdOutlineAttachFile as MdAttachFileIcon,
} from "react-icons/md";
import Modal from "../Modal/Modal.client";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";

export default function SelfTable({ leaveRequests, onEdit, onCancel }) {
  const { user } = useAuth();

  const sortedRequests = [...(leaveRequests?.self || [])].sort((a, b) =>
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
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [attachmentsMap, setAttachmentsMap] = useState({});

  const showAlert = (message) => {
    setAlertMessage(message);
    setAlertOpen(true);
  };

  useEffect(() => {
    setAttachmentsMap({});
  }, [leaveRequests]);

  const attachmentsMapRef = useRef({});
  useEffect(() => {
    attachmentsMapRef.current = attachmentsMap;
  }, [attachmentsMap]);

  useEffect(() => {
    return () => {
      try {
        Object.values(attachmentsMapRef.current || {})
          .flat()
          .forEach((p) => {
            if (
              p &&
              p.url &&
              typeof p.url === "string" &&
              p.url.startsWith("blob:")
            ) {
              try {
                URL.revokeObjectURL(p.url);
              } catch (e) {}
            }
          });
      } catch (e) {}
    };
  }, []);

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

    if (attachment.url && typeof attachment.url === "string") {
      return attachment.url;
    }

    if (attachment.file_path && /^https?:\/\//i.test(attachment.file_path)) {
      return attachment.file_path;
    }

    if (attachment.id) {
      const orgQuery =
        leave && (leave.orgId || leave.org_id)
          ? `?orgId=${encodeURIComponent(leave.orgId || leave.org_id)}`
          : "";
      return `/attachments/${encodeURIComponent(attachment.id)}${orgQuery}`;
    }

    if (attachment.file_path && attachment.file_path.startsWith("/")) {
      const orgQuery =
        leave && (leave.orgId || leave.org_id)
          ? `?orgId=${encodeURIComponent(leave.orgId || leave.org_id)}`
          : "";
      return `${attachment.file_path}${orgQuery}`;
    }

    if (attachment.file_path && typeof attachment.file_path === "string") {
      const trimmed = attachment.file_path.trim();
      if (/^\/{1,2}/.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
        return trimmed;
      }
      const normalized = trimmed.replace(/\\/g, "/").replace(/^\/+/, "");
      return normalized ? `/${normalized}` : null;
    }

    return null;
  }, []);

  const onPreviewClick = (attachment, leave) => {
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

    handleOpenLeaveAttachments([attachment], leave, { openDirect: true });
  };

  const onViewAllAttachments = (attachments = [], leave = null) => {
    handleOpenLeaveAttachments(attachments, leave);
  };

  const closePreview = () => {
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

      const serverBase =
        (backendBase && String(backendBase).trim()) || "http://localhost:5001";
      const absBase = serverBase.replace(/\/$/, "");

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

      let candidateFiles = Array.isArray(files) ? files.slice() : [];
      if (!candidateFiles || candidateFiles.length === 0) {
        try {
          const metaUrl = `${absBase}/employee/leave/${encodeURIComponent(
            leaveIdKey,
          )}/attachments`;

          const resp = await axios.get(metaUrl, {
            withCredentials: true,
            headers: buildHeaders(),
          });

          candidateFiles = Array.isArray(resp.data)
            ? resp.data
            : Array.isArray(resp.data?.data)
              ? resp.data.data
              : Array.isArray(resp.data?.attachments)
                ? resp.data.attachments
                : [];
        } catch (err) {
          console.warn(
            "Could not fetch leave attachments metadata:",
            err?.response?.data || err?.message || err,
          );
        }
      }
      if (!candidateFiles || candidateFiles.length === 0) {
        showAlert("No attachments available.");
        return;
      }

      const tryFetchBlob = async (url, extraHeaders = {}) => {
        try {
          const resp = await axios.get(url, {
            withCredentials: true,
            headers: { ...buildHeaders(), ...extraHeaders },
            responseType: "blob",
          });

          // Validate that the blob is not HTML content (error page)
          const contentType = (
            resp.headers["content-type"] || ""
          ).toLowerCase();
          if (contentType.includes("text/html")) {
            console.warn(
              `Received HTML instead of file from ${url}. Status: ${resp.status}`,
            );
            return { ok: false, status: resp.status, err: "HTML response" };
          }

          return {
            ok: true,
            blob: resp.data,
            contentType: contentType,
          };
        } catch (err) {
          console.warn(`Failed to fetch blob from ${url}:`, err?.message);
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

          const attempts = [];

          const attUrl =
            fileOrAtt.url || fileOrAtt.file_url || fileOrAtt.filePath || null;
          if (attUrl && /^https?:\/\//i.test(String(attUrl))) {
            const r = await tryFetchBlob(attUrl);
            attempts.push({ method: "direct URL", ok: r.ok });
            if (r.ok)
              return {
                id: attachId,
                file_name: filename || attUrl,
                url: URL.createObjectURL(r.blob),
                mime_type: r.contentType,
              };
          }

          if (attachId) {
            const serveUrl = `${absBase}/attachments/${encodeURIComponent(attachId)}${leave?.orgId || leave?.org_id ? `?orgId=${encodeURIComponent(leave.orgId || leave.org_id)}` : ""}`;
            const r2 = await tryFetchBlob(serveUrl);
            attempts.push({
              method: "attachment ID endpoint",
              ok: r2.ok,
              url: serveUrl,
            });
            if (r2.ok)
              return {
                id: attachId,
                file_name: filename || fileOrAtt.file_name || attachId,
                url: URL.createObjectURL(r2.blob),
                mime_type: r2.contentType,
              };
          }

          if (fileOrAtt.file_path) {
            const fp = String(fileOrAtt.file_path);
            const candidatePath = fp.startsWith("/")
              ? `${absBase}${fp}`
              : `${absBase}/${fp}`;
            const r3 = await tryFetchBlob(candidatePath);
            attempts.push({
              method: "file path",
              ok: r3.ok,
              path: candidatePath,
            });
            if (r3.ok)
              return {
                id: attachId,
                file_name: filename || fp.split(/[\\/]/).pop(),
                url: URL.createObjectURL(r3.blob),
                mime_type: r3.contentType,
              };
          }

          if (filename) {
            const m = String(filename).match(/^(\d{4})-(\d{2})-/);
            const year = m ? m[1] : null;
            const month = m ? m[2] : null;
            const empForPath =
              attEmp || leave?.employee_id || leave?.employeeId;
            if (year && month && empForPath) {
              const legacyUrl = `${absBase}/employee/leave/${encodeURIComponent(year)}/${encodeURIComponent(month)}/${encodeURIComponent(empForPath)}/${encodeURIComponent(filename)}`;
              const r4 = await tryFetchBlob(legacyUrl);
              attempts.push({
                method: "legacy path",
                ok: r4.ok,
                path: legacyUrl,
              });
              if (r4.ok)
                return {
                  id: attachId,
                  file_name: filename,
                  url: URL.createObjectURL(r4.blob),
                  mime_type: r4.contentType,
                };
            }
          }

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
                  attempts.push({ method: "metadata URL", ok: rM.ok });
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
                  attempts.push({ method: "metadata file path", ok: rM2.ok });
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
            console.warn("Failed to fetch metadata:", metaErr?.message);
          }

          console.warn("All attempts failed for attachment:", filename, {
            fileOrAtt,
            attempts,
          });
          return null;
        }),
      );

      const goodFiles = (resolved || []).filter(Boolean);
      if (goodFiles.length === 0) {
        showAlert("No attachments could be retrieved (file not found).");
        return;
      }

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
      showAlert("Failed to open attachments.");
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
              const reqAttachments = Array.isArray(request.attachments)
                ? request.attachments
                : [];
              const lid = String(
                request.id || request.leave_id || request.leaveId || "",
              );
              const cached = attachmentsMap[lid] || [];

              return (
                <tr
                  key={`${request.id || request.leave_id}-${request.attachments?.length || 0}`}
                >
                  {" "}
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
                            handleOpenLeaveAttachments(reqAttachments, request)
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
              key={`${request.id || request.leave_id}-${request.attachments?.length || 0}`}
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
                          handleOpenLeaveAttachments(reqAttachments, request)
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
      <Modal
        title="Notice"
        isVisible={alertOpen}
        onClose={() => setAlertOpen(false)}
        buttons={[
          {
            label: "OK",
            onClick: () => setAlertOpen(false),
          },
        ]}
      >
        <div style={{ padding: "10px 0" }}>{alertMessage}</div>
      </Modal>

      {/* Preview Modal — two-column large viewer */}
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
        <div className="attachments-modal-large">
          <h4 className="modal-title" style={{ marginBottom: 12 }}>
            {/* optional title space */}
          </h4>

          <div className="attachments-grid">
            {/* Left: list of files */}
            <div className="attachments-list-column">
              {(!previewList || previewList.length === 0) &&
              previewAttachment ? (
                <ul
                  className="attachments-list"
                  style={{ listStyle: "none", padding: 0, margin: 0 }}
                >
                  <li
                    className="attachment-row"
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid #f3f3f3",
                    }}
                  >
                    <button
                      className="attachment-name-btn"
                      onClick={() => {
                        setPreviewAttachment(previewAttachment);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      {previewAttachment.file_name || previewAttachment.name}
                    </button>
                  </li>
                </ul>
              ) : previewList && previewList.length > 0 ? (
                <ul
                  className="attachments-list"
                  style={{ listStyle: "none", padding: 0, margin: 0 }}
                >
                  {previewList.map((f, idx) => {
                    const safeName =
                      f.file_name || f.filename || `Attachment ${idx + 1}`;
                    return (
                      <li
                        key={f.id || idx}
                        className="attachment-row"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: 8,
                          borderBottom: "1px solid #f3f3f3",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <button
                            className="attachment-name-btn"
                            onClick={() => setPreviewAttachment(f)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              textAlign: "left",
                              cursor: "pointer",
                              color:
                                previewAttachment &&
                                (f.id === previewAttachment.id ||
                                  f.url === previewAttachment.url)
                                  ? "#0070f3"
                                  : undefined,
                            }}
                          >
                            {safeName}
                          </button>
                        </div>

                        <div className="attachment-actions">
                          <button
                            onClick={() => {
                              if (f.url) openUrlInNewTab(f.url);
                              else if (
                                previewAttachment &&
                                previewAttachment.url
                              )
                                openUrlInNewTab(previewAttachment.url);
                              else showAlert("No URL available to open.");
                            }}
                            style={{
                              background: "none",
                              border: "1px solid #ddd",
                              padding: "6px 10px",
                              cursor: "pointer",
                              borderRadius: 4,
                            }}
                          >
                            Open
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div style={{ padding: 12, color: "#666" }}>
                  No attachments available.
                </div>
              )}
            </div>

            {/* Right: large preview */}
            <div
              className="attachments-preview-column"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: 12,
                maxHeight: "82vh",
                overflow: "auto",
              }}
            >
              {previewAttachment ? (
                <>
                  {/* image preview */}
                  {previewAttachment.mime_type &&
                    previewAttachment.mime_type.startsWith("image/") && (
                      <img
                        src={previewAttachment.url}
                        alt={
                          previewAttachment.file_name || previewAttachment.name
                        }
                        style={{
                          maxWidth: "100%",
                          maxHeight: "80vh",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    )}

                  {/* pdf preview */}
                  {previewAttachment.mime_type === "application/pdf" && (
                    <iframe
                      src={previewAttachment.url}
                      title={previewAttachment.file_name || "pdf"}
                      style={{ width: "100%", height: "80vh", border: "none" }}
                    />
                  )}

                  {/* other files */}
                  {(!previewAttachment.mime_type ||
                    (!previewAttachment.mime_type.startsWith("image/") &&
                      previewAttachment.mime_type !== "application/pdf")) && (
                    <div style={{ padding: 16, textAlign: "center" }}>
                      <p style={{ marginBottom: 12 }}>
                        <strong>
                          {previewAttachment.file_name ||
                            previewAttachment.name}
                        </strong>
                      </p>
                      <div>
                        <button
                          onClick={() =>
                            previewAttachment.url &&
                            openUrlInNewTab(previewAttachment.url)
                          }
                          style={{
                            background: "none",
                            border: "1px solid #ddd",
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderRadius: 4,
                          }}
                        >
                          Open / Download
                        </button>
                      </div>
                    </div>
                  )}

                  {/* thumbnail strip if multiple */}
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
                              style={{
                                width: 80,
                                height: 60,
                                objectFit: "cover",
                              }}
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
                              <MdAttachFileIcon size={20} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="preview-placeholder">
                  Select a file to preview
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
