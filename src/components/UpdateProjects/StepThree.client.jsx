"use client";

import React from "react";
import { getStatusBgColor } from "./utils.client";
import { useAuth } from "../../context/AuthProvider.client";

const StepThree = ({
  formData,
  addMilestone,
  removeMilestone,
  handleMilestoneChange,
  stsOwners,
  editable,
}) => {
  const { user } = useAuth();
  const userRole = user?.role ?? "Employee";
  const isEditable =
    typeof editable === "boolean"
      ? editable
      : !["Employee", "General"].includes(userRole);

  return (
    <div className="pj-step-three">
      <button
        className="add-milestone-btn"
        onClick={addMilestone}
        disabled={!isEditable}
      >
        + Add New Milestone
      </button>
      <div className="milestone-table-container">
        <table className="milestone-table">
          <thead>
            <tr>
              <th>Sl no</th>
              <th>Milestone Details</th>
              <th>Start Date</th>
              <th>Expected End Date</th>
              <th>Current Status</th>
              <th>Dependency</th>
              <th>Responsible By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {formData.milestones.map((milestone, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: getStatusBgColor(milestone.status),
                }}
              >
                <td>{index + 1}</td>
                <td>
                  <input
                    type="text"
                    name="details"
                    value={milestone.details}
                    onChange={(e) => handleMilestoneChange(index, e)}
                    readOnly={!isEditable}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    name="start_date"
                    value={
                      milestone.start_date
                        ? new Date(milestone.start_date)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) => handleMilestoneChange(index, e)}
                    readOnly={!isEditable}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    name="end_date"
                    value={
                      milestone.end_date
                        ? new Date(milestone.end_date)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) => handleMilestoneChange(index, e)}
                    min={milestone.start_date}
                    readOnly={!isEditable}
                  />
                </td>
                <td>
                  <select
                    name="status"
                    value={milestone.status}
                    onChange={(e) => handleMilestoneChange(index, e)}
                    disabled={!isEditable}
                    style={{
                      backgroundColor: getStatusBgColor(milestone.status),
                    }}
                  >
                    <option value=" ">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    name="dependency"
                    value={milestone.dependency}
                    onChange={(e) => handleMilestoneChange(index, e)}
                    readOnly={!isEditable}
                  />
                </td>
                <td>
                  <select
                    name="assigned_to"
                    value={milestone.assigned_to || ""}
                    onChange={(e) => handleMilestoneChange(index, e)}
                    disabled={!isEditable}
                  >
                    <option value="">Responsible By</option>
                    {stsOwners.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {isEditable && (
                    <button
                      type="button"
                      className="remove-milestone-btn"
                      onClick={() => removeMilestone(index)}
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StepThree;
