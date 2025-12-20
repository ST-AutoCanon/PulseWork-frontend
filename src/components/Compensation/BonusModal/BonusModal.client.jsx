"use client";

import React from "react";
import "./BonusModal.css";

const BonusModal = ({
  bonusModal,
  setBonusModal,
  handleBonusSubmit,
  isLoading = false,
}) => {
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = [
    { value: currentYear - 1, label: (currentYear - 1).toString() },
    { value: currentYear, label: currentYear.toString() },
    { value: currentYear + 1, label: (currentYear + 1).toString() },
  ];

  const closeModal = () => {
    setBonusModal({ ...bonusModal, isVisible: false });
  };

  const updateField = (field, value) => {
    setBonusModal((prev) => ({
      ...prev,
      [field]: value,
      error: "",
    }));
  };

  if (!bonusModal?.isVisible) return null;

  return (
    <div className="bm-modal-overlay" onClick={closeModal}>
      <div
        className="bm-modal"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="bm-modal-header">
          <h2>Add Bonus</h2>
          <button
            className="bm-modal-close"
            onClick={closeModal}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="bm-modal-content">
          {bonusModal.error && (
            <div className="bm-modal-error" role="alert">
              {bonusModal.error}
            </div>
          )}

          {/* Bonus Type Selection */}
          <div className="bm-modal-field">
            <label htmlFor="bonus-option">Bonus Type</label>
            <select
              id="bonus-option"
              value={bonusModal.selectedOption || ""}
              onChange={(e) => updateField("selectedOption", e.target.value)}
            >
              <option value="">Select Bonus Type</option>
              <option value="percentageCtc">Percentage of CTC</option>
              <option value="monthlySalaryCount">Number of Monthly Salaries</option>
              <option value="fixedAmount">Fixed Amount</option>
            </select>
          </div>

          {/* Conditional Fields */}
          {bonusModal.selectedOption === "percentageCtc" && (
            <div className="bm-modal-field">
              <label htmlFor="percentage-ctc">Percentage of CTC (%)</label>
              <input
                id="percentage-ctc"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g. 8.33"
                value={bonusModal.percentageCtc || ""}
                onChange={(e) => updateField("percentageCtc", e.target.value)}
              />
            </div>
          )}

          {bonusModal.selectedOption === "monthlySalaryCount" && (
            <div className="bm-modal-field">
              <label htmlFor="salary-count">Number of Monthly Salaries</label>
              <input
                id="salary-count"
                type="number"
                min="0.1"
                max="24"
                step="0.1"
                placeholder="e.g. 1.5"
                value={bonusModal.monthlySalaryCount || ""}
                onChange={(e) => updateField("monthlySalaryCount", e.target.value)}
              />
            </div>
          )}

          {bonusModal.selectedOption === "fixedAmount" && (
            <div className="bm-modal-field">
              <label htmlFor="fixed-amount">Fixed Amount (₹)</label>
              <input
                id="fixed-amount"
                type="number"
                min="0"
                placeholder="e.g. 50000"
                value={bonusModal.fixedAmount || ""}
                onChange={(e) => updateField("fixedAmount", e.target.value)}
              />
            </div>
          )}

          {/* Applicable Month */}
          <div className="bm-modal-field">
            <label htmlFor="bonus-month">Applicable Month</label>
            <select
              id="bonus-month"
              value={bonusModal.selectedMonth || ""}
              onChange={(e) => updateField("selectedMonth", e.target.value)}
            >
              <option value="">Select Month</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="bm-modal-field">
            <label htmlFor="bonus-year">Year</label>
            <select
              id="bonus-year"
              value={bonusModal.selectedYear || ""}
              onChange={(e) => updateField("selectedYear", e.target.value)}
            >
              <option value="">Select Year</option>
              {years.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="bm-modal-actions">
            <button
              type="button"
              className="bm-modal-cancel"
              onClick={closeModal}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bm-modal-submit"
              onClick={handleBonusSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Add Bonus"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonusModal;