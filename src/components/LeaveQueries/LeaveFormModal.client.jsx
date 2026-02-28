"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MdOutlineCancel } from "react-icons/md";
import {
  getAdvanceNoticeDays,
  computeRequestedDays,
} from "./leaveUtils.client";

export default function LeaveFormModal({
  isVisible,
  onClose,
  formData,
  setFormData,
  handleInputChange,
  handleSubmit,
  leaveTypeOptions,
  editingId,
  showAlert,
  activePolicy,
  defaultLeaveSettings,
  leaveTypes = [],
  userProfile = null,
  attachments = [],
  setAttachments = () => {},
}) {
  if (!isVisible) return null;

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [minStartAllowed, setMinStartAllowed] = useState(todayIso);
  const [advanceNoticeDays, setAdvanceNoticeDays] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formatIso = (d) =>
    d instanceof Date ? d.toISOString().split("T")[0] : String(d);

  const oneMonthAgoIso = useMemo(() => {
    try {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      d.setHours(0, 0, 0, 0);
      return formatIso(d);
    } catch {
      return todayIso;
    }
  }, [todayIso]);

  const findSettingInPolicyOrDefault = (typeKey) => {
    if (!typeKey) return null;
    const keyLower = String(typeKey || "").toLowerCase();

    if (activePolicy && Array.isArray(activePolicy.leave_settings)) {
      const found = activePolicy.leave_settings.find(
        (s) => String(s.type || "").toLowerCase() === keyLower,
      );
      if (found) return found;
    }

    if (Array.isArray(defaultLeaveSettings)) {
      const found = defaultLeaveSettings.find(
        (s) => String(s.type || "").toLowerCase() === keyLower,
      );
      if (found) return found;
    }

    if (Array.isArray(leaveTypes)) {
      const found = leaveTypes.find((t) => {
        const k = (t?.key || t?.type || t?.type_key || t).toString();
        return String(k).toLowerCase() === keyLower;
      });
      if (found) return found;
    }

    return null;
  };

  const extractNoticeDays = (setting) => {
    if (!setting) return 0;
    const candidates = [
      setting.advance_notice_days,
      setting.advanceNoticeDays,
      setting.advance_notice,
      setting.advanceNotice,
      setting.advance_days,
      setting.notice_days,
    ];
    for (const v of candidates) {
      const n = Number(v ?? 0);
      if (!isNaN(n) && Number.isFinite(n) && n > 0)
        return Math.max(0, Math.floor(n));
    }
    try {
      const t = getAdvanceNoticeDays(setting);
      if (typeof t === "number" && Number.isFinite(t))
        return Math.max(0, Math.floor(t));
    } catch {}
    return 0;
  };

  const computeMinStartForNotice = (noticeDays) => {
    try {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + (Number(noticeDays) || 0));
      return formatIso(d);
    } catch {
      return todayIso;
    }
  };

  const calcRequestedDays = () => {
    try {
      const s = formData.startDate || "";
      const e = formData.endDate || "";
      const hf = formData.h_f_day || "Full Day";
      if (!s || !e) return 0;
      return Number(computeRequestedDays(s, e, hf) || 0);
    } catch {
      return 0;
    }
  };

  const isSunday = (isoDate) => {
    if (!isoDate) return false;
    const d = new Date(isoDate);
    return d.getDay() === 0;
  };

  useEffect(() => {
    const selectedType = formData.leavetype || "";
    if (!selectedType) {
      setAdvanceNoticeDays(0);
      setMinStartAllowed(todayIso);
      return;
    }
    const setting = findSettingInPolicyOrDefault(selectedType);
    const notice = extractNoticeDays(setting);
    setAdvanceNoticeDays(notice);
    setMinStartAllowed(computeMinStartForNotice(notice));

    if (!editingId && notice > 0) {
      const label =
        (leaveTypeOptions || []).find(
          (o) => String(o.type) === String(selectedType),
        )?.label || selectedType;
      const msg = activePolicy
        ? `This "${label}" leave requires at least ${notice} day(s) advance. Please pick a start date on or after ${computeMinStartForNotice(
            notice,
          )}.`
        : `By default, a "${label}" leave requires at least ${notice} day(s) advance. Please pick a start date on or after ${computeMinStartForNotice(
            notice,
          )}.`;
      try {
        showAlert?.(msg);
      } catch (e) {}
    }
  }, [
    formData.leavetype,
    activePolicy,
    defaultLeaveSettings,
    JSON.stringify(leaveTypes || []),
  ]);

  const handleStartChange = (e) => {
    const chosen = e.target.value;

    if (!chosen) {
      handleInputChange(e);
      return;
    }

    if (isSunday(chosen)) {
      showAlert?.("Sunday cannot be selected as a leave start date.");
      return;
    }

    handleInputChange(e);

    if (!editingId && advanceNoticeDays > 0) {
      const allowed = minStartAllowed;
      if (new Date(chosen) < new Date(allowed)) {
        showAlert?.(
          `Selected start date ${chosen} is earlier than allowed by advance-notice requirement. Earliest allowed start is ${allowed}.`,
        );
      }
    }
  };

  const selectedOpt = leaveTypeOptions.find(
    (o) => String(o.type) === String(formData.leavetype),
  );

  const effectiveMinStart = (() => {
    if (editingId) return oneMonthAgoIso;
    if (advanceNoticeDays > 0) {
      return minStartAllowed || todayIso;
    }
    return oneMonthAgoIso;
  })();

  const requestedDays = calcRequestedDays();
  const selectedTypeStr = (formData.leavetype || "").toString().toLowerCase();

  const isSickType =
    /sick/i.test(selectedTypeStr) || selectedTypeStr === "sick";
  const isMaternityType = /matern/i.test(selectedTypeStr);
  const isPaternityType = /patern/i.test(selectedTypeStr);

  const showAttachmentOption =
    (isSickType && requestedDays > 3) || isMaternityType || isPaternityType;

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  useEffect(() => {
    try {
      if (!Array.isArray(attachments) || attachments.length === 0) {
        const meta = Array.isArray(formData.attachments)
          ? formData.attachments
          : [];

        const allLocalNoFile =
          meta.length > 0 &&
          meta.every(
            (m) =>
              !m.serverId &&
              !m.fileUrl &&
              !m.remote &&
              !m.file_path &&
              !m.url &&
              !m.id,
          );

        if (meta.length === 0 || allLocalNoFile) {
          if (!editingId) {
            setFormData((prev) => ({ ...prev, attachments: [] }));
          } else {
          }
        }
        return;
      }

      const meta = attachments.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        uploaded: false,
      }));
      setFormData((prev) => ({ ...prev, attachments: meta }));
    } catch (err) {}
  }, [attachments, editingId, JSON.stringify(formData.attachments || [])]);

  const handleFilesChange = (e) => {
    const files = e.target.files;
    if (!files) return;
    const arrFiles = Array.from(files).filter((f) => {
      const ext = (f.name || "").toLowerCase();
      const okMime =
        (f.type && f.type.startsWith("image/")) || f.type === "application/pdf";
      const okExt = /\.(png|jpg|jpeg|gif|bmp|webp|pdf)$/i.test(ext);
      return okMime || okExt;
    });

    if (arrFiles.length === 0) {
      showAlert("No supported files selected. Use images or PDFs only.");
      return;
    }

    const existingHook = Array.isArray(attachments) ? attachments : [];
    const newHook = existingHook.concat(arrFiles);
    setAttachments(newHook);

    try {
      e.target.value = "";
    } catch {}
  };

  const removeAttachment = (idx) => {
    const hookArr = Array.isArray(attachments) ? attachments.slice() : null;
    if (hookArr && hookArr.length > 0) {
      if (idx >= 0 && idx < hookArr.length) {
        hookArr.splice(idx, 1);
        setAttachments(hookArr);
      }
      return;
    }

    const metaArr = Array.isArray(formData.attachments)
      ? formData.attachments.slice()
      : [];
    if (idx >= 0 && idx < metaArr.length) {
      metaArr.splice(idx, 1);
      setFormData({ ...formData, attachments: metaArr });
    }
  };
  const hasAnyAttachment = () => {
    const hookCount = Array.isArray(attachments) ? attachments.length : 0;
    const metaCount = Array.isArray(formData.attachments)
      ? formData.attachments.length
      : 0;

    return hookCount > 0 || metaCount > 0;
  };
  return (
    <div className="leave-modal">
      <div className="leave-modal-content">
        <form
          className="leave-form"
          onSubmit={async (e) => {
            e.preventDefault();

            if (isSubmitting) return;

            if (showAttachmentOption && !hasAnyAttachment()) {
              showAlert?.(
                "Supporting document is mandatory for this leave type.",
              );
              return;
            }

            try {
              if (isSunday(formData.startDate) || isSunday(formData.endDate)) {
                showAlert?.("Leave cannot include Sunday.");
                return;
              }
              setIsSubmitting(true);
              await handleSubmit?.(e);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="leave-form-header">
            <h2>Leave Request Form</h2>
            <MdOutlineCancel
              className="icon"
              onClick={onClose}
              aria-label="Close modal"
            />
          </div>

          <div className="leave-form-grid">
            <div className="leave-form-group">
              <label htmlFor="leavetype">Type of Leave</label>
              <select
                id="leavetype"
                name="leavetype"
                value={formData.leavetype || ""}
                onChange={(e) => {
                  handleInputChange(e);
                }}
                required
              >
                <option value="">Select</option>
                {leaveTypeOptions.map((opt) => (
                  <option
                    key={opt.type}
                    value={opt.type}
                    disabled={!!opt.disabled}
                    title={opt.disabled ? opt.reason : undefined}
                  >
                    {opt.label}
                    {opt.disabled ? ` — ${opt.reason || "not eligible"}` : ""}
                  </option>
                ))}
              </select>
              {selectedOpt && selectedOpt.disabled && (
                <div className="leave-note" style={{ color: "#b04" }}>
                  {selectedOpt.reason}
                </div>
              )}
            </div>

            <div className="leave-form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                type="date"
                name="startDate"
                value={formData.startDate || ""}
                onChange={handleStartChange}
                required
                min={effectiveMinStart}
              />
              {!editingId && advanceNoticeDays > 0 && (
                <div
                  className="leave-note"
                  style={{ fontSize: 13, color: "#333", marginTop: 6 }}
                >
                  This leave requires <strong>{advanceNoticeDays}</strong>{" "}
                  day(s) advance. Earliest allowed start:{" "}
                  <strong>{computeMinStartForNotice(advanceNoticeDays)}</strong>
                  .
                </div>
              )}
            </div>

            <div className="leave-form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                type="date"
                name="endDate"
                value={formData.endDate || ""}
                onChange={(e) => {
                  const chosen = e.target.value;

                  if (isSunday(chosen)) {
                    showAlert?.(
                      "Sunday cannot be selected as a leave end date.",
                    );
                    return;
                  }

                  handleInputChange(e);
                }}
                min={formData.startDate || effectiveMinStart}
                required
              />
            </div>

            <div className="leave-form-group">
              <label htmlFor="h_f_day">Half/Full Day</label>
              <select
                id="h_f_day"
                name="h_f_day"
                value={formData.h_f_day || "Full Day"}
                onChange={handleInputChange}
                disabled={
                  formData.startDate &&
                  formData.endDate &&
                  formData.endDate > formData.startDate
                }
              >
                <option value="Full Day">Full Day</option>
                <option value="Half Day">Half Day</option>
              </select>
            </div>

            <div className="leave-form-group">
              <label htmlFor="reason">Leave Reason</label>
              <input
                id="reason"
                type="text"
                name="reason"
                value={formData.reason || ""}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Attachment input (Option A) */}
            {showAttachmentOption && (
              <div className="leave-form-group">
                <label htmlFor="attachments">Attach supporting documents</label>

                <input
                  id="attachments"
                  type="file"
                  name="attachments"
                  onChange={handleFilesChange}
                  multiple
                  accept="image/*,application/pdf"
                />

                {/* Prefer hook-level attachments for display; fallback to formData.attachments */}
                {Array.isArray(attachments) && attachments.length > 0 ? (
                  <ul className="leave-form-attachments">
                    {attachments.map((f, idx) => (
                      <li key={`${f.name || f.filename}-${idx}`}>
                        <span>
                          {f.name || f.originalname || f.filename} —{" "}
                          {formatSize(f.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          aria-label={`Remove ${f.name || f.originalname || f.filename}`}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : Array.isArray(formData.attachments) &&
                  formData.attachments.length > 0 ? (
                  <ul className="leave-form-attachments">
                    {formData.attachments.map((f, idx) => (
                      <li key={`${f.name || f.file_name || idx}-${idx}`}>
                        <span>
                          {f.name || f.file_name || f.fileName} —{" "}
                          {formatSize(f.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          aria-label={`Remove ${f.name || f.file_name}`}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}

            {selectedOpt &&
              typeof selectedOpt.type === "string" &&
              /menstr|matern|patern/i.test(selectedOpt.type) && (
                <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                  {/menstr/i.test(selectedOpt.type) && (
                    <div style={{ fontSize: 13, color: "#333" }}>
                      <strong>Note:</strong> Menstrual leave is a single-day
                      entitlement per month (if eligible). It cannot be taken
                      for consecutive days and any unused menstrual entitlement
                      lapses at the end of the month.
                    </div>
                  )}
                  {/matern/i.test(selectedOpt.type) && (
                    <div style={{ fontSize: 13, color: "#333" }}>
                      <strong>Note:</strong> Maternity leave is for female
                      employees; maximum allowed duration is 182 days.
                    </div>
                  )}
                  {/patern/i.test(selectedOpt.type) && (
                    <div style={{ fontSize: 13, color: "#333" }}>
                      <strong>Note:</strong> Paternity leave is for male
                      employees; maximum allowed duration is 15 days.
                    </div>
                  )}
                </div>
              )}
          </div>

          <div className="leave-form-actions">
            <button type="button" className="leave-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="leave-save"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : editingId ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
