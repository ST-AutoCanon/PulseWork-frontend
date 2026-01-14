"use client";

import React from "react";
import { format, addMonths, startOfMonth } from "date-fns";
import "./AdvanceModal.css";

const AdvanceModal = ({
  advanceModal,
  setAdvanceModal,
  handleAdvanceSubmit,
  isLoading = false,
  threeMonthsSalary = 0,
}) => {
  const generateAvailableMonths = () => {
    const today = new Date();
    const currentMonth = startOfMonth(today);
    const months = [];

    for (let i = 0; i < 2; i++) {
      const date = addMonths(currentMonth, i);
      months.push({
        value: format(date, "yyyy-MM"),
        label: format(date, "MMMM yyyy"),
      });
    }
    return months;
  };

  const availableMonths = generateAvailableMonths();

  const computeMonthlyRecoveries = () => {
    const amount = parseFloat(advanceModal.advanceAmount);
    const months = parseInt(advanceModal.recoveryMonths);

    if (!amount || amount <= 0 || !months || months <= 0) return null;

    const base = Math.floor(amount / months);
    const remainder = amount % months;

    const recoveries = Array(months)
      .fill(base)
      .map((val, idx) => (idx < remainder ? val + 1 : val));

    return recoveries.map((r) => `₹${r.toLocaleString("en-IN")}`).join(" + ");
  };

  const monthlyRecoveries = computeMonthlyRecoveries();
  const selectedMonthLabel =
    availableMonths.find((m) => m.value === advanceModal.applicableMonth)
      ?.label || "";

  const closeModal = () => {
    setAdvanceModal({ ...advanceModal, isVisible: false });
  };

  const updateField = (field, value) => {
    setAdvanceModal((prev) => ({
      ...prev,
      [field]: value,
      error: "",
    }));
  };

  if (!advanceModal?.isVisible) return null;

  return (
    <div className="am-modal-overlay" onClick={closeModal}>
      <div className="am-modal" onClick={(e) => e.stopPropagation()}>
        <div className="am-modal-header">
          <h2>Add Salary Advance</h2>
          <button
            className="am-modal-close"
            onClick={closeModal}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="am-modal-content">
          <div className="am-employee-name">
            For: <strong>{advanceModal.fullName || "Employee"}</strong>
          </div>

          {advanceModal.error && (
            <div className="am-modal-error" role="alert">
              {advanceModal.error}
            </div>
          )}

          <div className="am-modal-field">
            <label htmlFor="advance-amount">Advance Amount (₹)</label>
            <input
              id="advance-amount"
              type="number"
              min="1"
              placeholder="e.g. 25000"
              value={advanceModal.advanceAmount || ""}
              onChange={(e) => updateField("advanceAmount", e.target.value)}
            />
            <p className="am-modal-note">
              Maximum allowed: ₹{threeMonthsSalary.toLocaleString("en-IN")}{" "}
              <em>(3 months' gross salary)</em>
            </p>
          </div>

          <div className="am-modal-field">
            <label htmlFor="recovery-months">Recovery Over (Months)</label>
            <input
              id="recovery-months"
              type="number"
              min="1"
              max="24"
              placeholder="e.g. 6"
              value={advanceModal.recoveryMonths || ""}
              onChange={(e) => updateField("recoveryMonths", e.target.value)}
            />
            {monthlyRecoveries && (
              <div className="am-recovery-preview">
                <strong>Monthly Recovery:</strong> {monthlyRecoveries}
              </div>
            )}
          </div>

          <div className="am-modal-field">
            <label htmlFor="applicable-month">Recovery Starts From</label>
            <select
              id="applicable-month"
              value={advanceModal.applicableMonth || ""}
              onChange={(e) => updateField("applicableMonth", e.target.value)}
            >
              <option value="">Select Month</option>
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            {selectedMonthLabel && (
              <p className="am-start-note">
                Recovery will begin from <strong>{selectedMonthLabel}</strong>
              </p>
            )}
          </div>

          <div className="am-modal-actions">
            <button
              type="button"
              className="am-modal-cancel"
              onClick={closeModal}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="am-modal-submit"
              onClick={handleAdvanceSubmit}
              disabled={
                isLoading ||
                !advanceModal.advanceAmount ||
                !advanceModal.recoveryMonths ||
                !advanceModal.applicableMonth
              }
            >
              {isLoading ? "Submitting..." : "Add Advance"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvanceModal;
