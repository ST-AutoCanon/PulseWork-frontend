import React from "react";
import "./AssignModal.css";

const AssignModal = ({ assignModal, setAssignModal, handleAssignSubmit, isLoading }) => {
  return (
    <div className="asm-modal-overlay">
      <div className="asm-modal">
        <div className="asm-modal-header">
          <h2>Assign Compensation Plan for {assignModal.fullName}</h2>
          <button
            className="asm-modal-close"
            onClick={() => setAssignModal({ ...assignModal, isVisible: false })}
          >
            ×
          </button>
        </div>
        <div className="asm-modal-content">
          {assignModal.error && <div className="asm-modal-error">{assignModal.error}</div>}
          <div className="asm-modal-field">
            <label>Compensation Plan:</label>
            <select
              value={assignModal.selectedCompensation}
              onChange={(e) =>
                setAssignModal({ ...assignModal, selectedCompensation: e.target.value, error: "" })
              }
            >
              <option value="">Select Compensation Plan</option>
              {assignModal.compensationList.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.compensation_plan_name}
                </option>
              ))}
            </select>
          </div>
          <div className="asm-modal-actions">
            <button
              className="asm-modal-cancel"
              onClick={() => setAssignModal({ ...assignModal, isVisible: false })}
            >
              Cancel
            </button>
            <button
              className="asm-modal-submit"
              onClick={handleAssignSubmit}
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

export default AssignModal;