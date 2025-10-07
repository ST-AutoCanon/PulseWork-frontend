"use client";

import React from "react";
import { MdOutlineCancel } from "react-icons/md";
import { getAdvanceNoticeDays } from "./leaveUtils.client";

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
}) {
  if (!isVisible) return null;

  // Called when user selects a leave type — updates form and shows notice if needed
  const onLeaveTypeChange = (e) => {
    handleInputChange(e);

    if (editingId) return;

    const selectedType = String(e.target.value || "").toLowerCase();
    if (!selectedType) return;

    let setting =
      (activePolicy?.leave_settings || []).find(
        (s) => String(s.type || "").toLowerCase() === selectedType
      ) || null;

    if (!setting && Array.isArray(defaultLeaveSettings)) {
      setting = defaultLeaveSettings.find(
        (s) => String(s.type || "").toLowerCase() === selectedType
      );
    }

    if (!setting) return;

    const noticeDays = getAdvanceNoticeDays(setting);
    if (noticeDays > 0) {
      const message = activePolicy
        ? `This "${setting.type}" leave requires at least ${noticeDays} day(s) advance. Please choose a start date at least ${noticeDays} day(s) after today.`
        : `By default, a ${setting.type} request requires at least ${noticeDays} day(s) advance. Please choose a start date at least ${noticeDays} day(s) after today.`;

      showAlert?.(message);
    }
  };

  const minStartDate = new Date().toISOString().split("T")[0];

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
                onChange={onLeaveTypeChange}
                required
              >
                <option value="">Select</option>
                {leaveTypeOptions.map((opt) => (
                  <option key={opt.type} value={opt.type}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="leave-form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                type="date"
                name="startDate"
                value={formData.startDate || ""}
                onChange={handleInputChange}
                required
                min={minStartDate}
              />
            </div>

            <div className="leave-form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                type="date"
                name="endDate"
                value={formData.endDate || ""}
                onChange={handleInputChange}
                min={formData.startDate || minStartDate}
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
