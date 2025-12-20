import React from "react";
import "./BonusModal.css";

const BonusModal = ({ bonusModal, setBonusModal, handleBonusSubmit, isLoading }) => {
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
  const years = [currentYear, currentYear + 1].map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }));

  return (
    <div className="bm-modal-overlay">
      <div className="bm-modal">
        <div className="bm-modal-header">
          <h2>Add Bonus</h2>
          <button
            className="bm-modal-close"
            onClick={() => setBonusModal({ ...bonusModal, isVisible: false })}
          >
            ×
          </button>
        </div>
        <div className="bm-modal-content">
          {bonusModal.error && <div className="bm-modal-error">{bonusModal.error}</div>}
          <div className="bm-modal-field">
            <label>Bonus Option:</label>
            <select
              value={bonusModal.selectedOption}
              onChange={(e) =>
                setBonusModal({ ...bonusModal, selectedOption: e.target.value, error: "" })
              }
            >
              <option value="">Select Option</option>
              <option value="percentageCtc">Percentage of CTC</option>
              <option value="monthlySalaryCount">Number of Monthly Salaries</option>
              <option value="fixedAmount">Fixed Amount</option>
            </select>
          </div>
          {bonusModal.selectedOption === "percentageCtc" && (
            <div className="bm-modal-field">
              <label>Percentage of CTC:</label>
              <input
                type="number"
                value={bonusModal.percentageCtc}
                onChange={(e) =>
                  setBonusModal({ ...bonusModal, percentageCtc: e.target.value, error: "" })
                }
                placeholder="Enter percentage (0-100)"
              />
            </div>
          )}
          {bonusModal.selectedOption === "monthlySalaryCount" && (
            <div className="bm-modal-field">
              <label>Number of Monthly Salaries:</label>
              <input
                type="number"
                value={bonusModal.monthlySalaryCount}
                onChange={(e) =>
                  setBonusModal({ ...bonusModal, monthlySalaryCount: e.target.value, error: "" })
                }
                placeholder="Enter number (1-10)"
              />
            </div>
          )}
          {bonusModal.selectedOption === "fixedAmount" && (
            <div className="bm-modal-field">
              <label>Fixed Amount:</label>
              <input
                type="number"
                value={bonusModal.fixedAmount}
                onChange={(e) =>
                  setBonusModal({ ...bonusModal, fixedAmount: e.target.value, error: "" })
                }
                placeholder="Enter amount"
              />
            </div>
          )}
          <div className="bm-modal-field">
            <label>Applicable Month:</label>
            <select
              value={bonusModal.selectedMonth}
              onChange={(e) =>
                setBonusModal({ ...bonusModal, selectedMonth: e.target.value, error: "" })
              }
            >
              <option value="">Select Month</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bm-modal-field">
            <label>Year:</label>
            <select
              value={bonusModal.selectedYear}
              onChange={(e) =>
                setBonusModal({ ...bonusModal, selectedYear: e.target.value, error: "" })
              }
            >
              <option value="">Select Year</option>
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bm-modal-actions">
            <button
              className="bm-modal-cancel"
              onClick={() => setBonusModal({ ...bonusModal, isVisible: false })}
            >
              Cancel
            </button>
            <button
              className="bm-modal-submit"
              onClick={handleBonusSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonusModal;