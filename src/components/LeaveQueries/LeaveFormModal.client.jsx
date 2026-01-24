"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MdOutlineCancel } from "react-icons/md";
import { getAdvanceNoticeDays } from "./leaveUtils.client";

/**
 * LeaveFormModal
 * - Uses leaveTypeOptions (from parent) which already contains eligibility flags.
 * - When a leave type is selected we compute required advance-notice days from:
 *    1) activePolicy.leave_settings (exact match)
 *    2) defaultLeaveSettings (fallback)
 *    3) leaveTypes meta (DB) which may include advance_notice_days/advanceNoticeDays/advance_notice
 *
 * - If advance-notice > 0 and not editing, we show a small hint and update the start-date min.
 */
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
}) {
  if (!isVisible) return null;

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  // dynamic min start date (default to today)
  const [minStartAllowed, setMinStartAllowed] = useState(todayIso);
  const [advanceNoticeDays, setAdvanceNoticeDays] = useState(0);

  // utility to format yyyy-mm-dd
  const formatIso = (d) =>
    d instanceof Date ? d.toISOString().split("T")[0] : String(d);

  // find setting in active policy or default settings by typeKey (case-insensitive)
  const findSettingInPolicyOrDefault = (typeKey) => {
    if (!typeKey) return null;
    const keyLower = String(typeKey || "").toLowerCase();

    // 1) active policy
    if (activePolicy && Array.isArray(activePolicy.leave_settings)) {
      const found = activePolicy.leave_settings.find(
        (s) => String(s.type || "").toLowerCase() === keyLower,
      );
      if (found) return found;
    }

    // 2) defaultLeaveSettings (client-side defaults)
    if (Array.isArray(defaultLeaveSettings)) {
      const found = defaultLeaveSettings.find(
        (s) => String(s.type || "").toLowerCase() === keyLower,
      );
      if (found) return found;
    }

    // 3) DB-driven leaveTypes meta
    if (Array.isArray(leaveTypes)) {
      const found = leaveTypes.find((t) => {
        const k = (t?.key || t?.type || t?.type_key || t).toString();
        return String(k).toLowerCase() === keyLower;
      });
      if (found) return found;
    }

    return null;
  };

  // determine notice days number from a setting object (various possible shapes)
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
    // support getAdvanceNoticeDays util for known shapes
    try {
      const t = getAdvanceNoticeDays(setting);
      if (typeof t === "number" && Number.isFinite(t))
        return Math.max(0, Math.floor(t));
    } catch {}
    return 0;
  };

  // compute min allowed start based on notice days (today + noticeDays)
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

  // effect: whenever selected leave type changes, update notice & min date
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

    // show alert once (only when selecting, not editing)
    if (!editingId && notice > 0) {
      const label =
        (leaveTypeOptions || []).find(
          (o) => String(o.type) === String(selectedType),
        )?.label || selectedType;
      const msg = activePolicy
        ? `This "${label}" leave requires at least ${notice} day(s) advance. Please pick a start date on or after ${computeMinStartForNotice(notice)}.`
        : `By default, a "${label}" leave requires at least ${notice} day(s) advance. Please pick a start date on or after ${computeMinStartForNotice(notice)}.`;
      try {
        showAlert?.(msg);
      } catch (e) {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.leavetype,
    activePolicy,
    defaultLeaveSettings,
    JSON.stringify(leaveTypes || []), // simplistic dependency for leaveTypes meta
  ]);

  // when user changes startDate manually, warn if earlier than allowed
  const handleStartChange = (e) => {
    handleInputChange(e);
    const chosen = e.target.value;
    if (!chosen) return;
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

  const effectiveMinStart = editingId ? todayIso : minStartAllowed || todayIso;

  return (
    <div className="leave-modal">
      <div className="leave-modal-content">
        <form className="leave-form" onSubmit={handleSubmit}>
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
                  // propagate
                  handleInputChange(e);
                  // additional logic runs in effect above
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
              {/* Inline hint about advance-notice */}
              {!editingId && advanceNoticeDays > 0 && (
                <div
                  className="leave-note"
                  style={{ fontSize: 13, color: "#333", marginTop: 6 }}
                >
                  This leave requires <strong>{advanceNoticeDays}</strong> day
                  (s) advance. Earliest allowed start:{" "}
                  <strong>{effectiveMinStart}</strong>.
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
                onChange={handleInputChange}
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

            {/* Helpful hint for menstrual / maternity / paternity */}
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
            <button type="submit" className="leave-save">
              {editingId ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
