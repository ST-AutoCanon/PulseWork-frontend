"use client";

import React from "react";
import { format, addMonths, startOfMonth } from "date-fns";
import "./AdvanceModal.css";

const AdvanceModal = ({
  advanceModal,
  setAdvanceModal,
  handleAdvanceSubmit,
  isLoading = false,
   threeMonthsCtc = 0,
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
  const baseNetSalary = parseFloat(advanceModal.baseNetSalary);

  if (
    !amount ||
    amount <= 0 ||
    !months ||
    months <= 0 ||
    !baseNetSalary ||
    baseNetSalary <= 0
  ) {
    return null;
  }

  // Normal recovery if divided equally
  const normalRecovery = amount / months;

  // Maximum amount that can be deducted from employee's salary
  const maxMonthlyRecovery = baseNetSalary;

  // Actual deduction cannot exceed Base Net Salary
  const monthlyRecovery = Math.min(
    normalRecovery,
    maxMonthlyRecovery
  );

  // Calculate how many months are actually required
  const requiredMonths = Math.ceil(amount / maxMonthlyRecovery);

  return {
    normalRecovery,
    monthlyRecovery,
    requiredMonths,
    exceedsSalaryLimit: normalRecovery > maxMonthlyRecovery,
  };
};

  const recoveryCalculation = computeMonthlyRecoveries();
  const selectedMonthLabel =
    availableMonths.find((m) => m.value === advanceModal.applicableMonth)
      ?.label || "";

  const closeModal = () => {
    setAdvanceModal({ ...advanceModal, isVisible: false });
  };
const minimumRecoveryMonths =
  recoveryCalculation?.requiredMonths || 1;
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
  Maximum allowed: ₹{threeMonthsCtc.toLocaleString("en-IN")}{" "}
  <em>(3 months' CTC)</em>
</p>
          </div>

          <div className="am-modal-field">
            <label htmlFor="recovery-months">Recovery Over (Months)</label>
           <input
  id="recovery-months"
  type="number"
  min={minimumRecoveryMonths}
  max="24"
  placeholder={`Minimum ${minimumRecoveryMonths} months`}
  value={advanceModal.recoveryMonths || ""}
  onChange={(e) =>
    updateField("recoveryMonths", e.target.value)
  }
/>
          {recoveryCalculation && (
  <div className="am-recovery-preview">
    <div>
      <strong>Base Net Salary:</strong>{" "}
      ₹{Number(advanceModal.baseNetSalary).toLocaleString("en-IN")}
    </div>

    <div>
      <strong>Normal Recovery:</strong>{" "}
      ₹
      {Math.round(
        recoveryCalculation.normalRecovery
      ).toLocaleString("en-IN")}
      /month
    </div>

    <div>
      <strong>Maximum Salary Deduction:</strong>{" "}
      ₹
      {Math.round(
        advanceModal.baseNetSalary
      ).toLocaleString("en-IN")}
      /month
    </div>

    <div>
      <strong>Minimum Recovery Period:</strong>{" "}
      {recoveryCalculation.requiredMonths} months
    </div>

    {recoveryCalculation.exceedsSalaryLimit && (
      <div className="am-recovery-warning">
        The calculated recovery exceeds the employee's Base Net
        Salary. Recovery will be limited to ₹
        {Math.round(
          advanceModal.baseNetSalary
        ).toLocaleString("en-IN")}{" "}
        per month.
      </div>
    )}
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
