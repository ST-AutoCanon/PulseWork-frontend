"use client";

import React from "react";
import { MdSearch } from "react-icons/md";
import { useAuth } from "../../context/AuthProvider.client";

const StepTwo = ({
  stsOwners,
  filteredEmployees,
  searchQuery,
  setSearchQuery,
  handleFilterChange,
  handleDoubleClick,
  handleDepartmentDoubleClick,
  selectedEmployees,
  handleRemoveEmployee,
  points,
  handleInputChange,
  handleKeyDown,
  editable,
  handleStsOwnerChange,
  handleChange,
  formData,
  filterType,
}) => {
  const { user } = useAuth();
  const userRole = user?.role ?? "Employee";
  const isEditable =
    typeof editable === "boolean"
      ? editable
      : !["Employee", "General"].includes(userRole);

  return (
    <div className="pj-step-two">
      <div className="step-two-grid">
        <div className="pj-form-group2">
          <label>Project Owner</label>
          <select
            name="sts_owner_id"
            value={formData.sts_owner_id || ""}
            onChange={(e) => handleStsOwnerChange(e)}
            disabled={!isEditable}
          >
            <option value="">Select Project Owner</option>
            {stsOwners.map((emp) => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>
        </div>

        <div className="pj-form-group2">
          <label>Project Contact</label>
          <input
            type="text"
            name="sts_contact"
            value={formData.sts_contact || ""}
            onChange={handleChange}
            readOnly={!isEditable}
          />
        </div>

        <div className="pj-form-group2">
          <label>
            Add Employees
            {isEditable ? (
              <div className="pj-add-emp">
                <div className="pj-search-box">
                  <MdSearch className="pj-search-icon" />
                  <input
                    type="text"
                    className="pj-search-input"
                    placeholder="by Name, EmpID or Dept"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="sp2-radio">
                  <input
                    type="radio"
                    name="employee-filter"
                    value="dept"
                    checked={filterType === "dept"}
                    onChange={handleFilterChange}
                  />
                  <label>Dept</label>
                  <input
                    type="radio"
                    name="employee-filter"
                    value="all"
                    checked={filterType === "all"}
                    onChange={handleFilterChange}
                  />
                  <label>All</label>
                </div>
              </div>
            ) : (
              <div
                style={{ marginLeft: "45px", fontSize: "12px", color: "#666" }}
              >
                Employee selection is read-only for your role.
              </div>
            )}
          </label>

          <div className="add-employee">
            <div
              className="employee-list"
              style={{
                pointerEvents: isEditable ? "auto" : "none",
                opacity: isEditable ? 1 : 0.6,
              }}
            >
              {isEditable ? (
                filteredEmployees.map((item, index) =>
                  item.type === "department" ? (
                    <div
                      key={index}
                      className="employee-item"
                      onDoubleClick={() =>
                        handleDepartmentDoubleClick(item.name)
                      }
                    >
                      {item.name}
                    </div>
                  ) : (
                    <div
                      key={item.employee_id}
                      className="employee-item"
                      onDoubleClick={() => handleDoubleClick(item)}
                    >
                      {item.name} ({item.department_name})
                    </div>
                  )
                )
              ) : (
                <div style={{ color: "#444", padding: 8 }}>
                  Employee search and selection disabled.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pj-form-group2">
          <label>Employee List</label>
          <div className="employee-list-box">
            {selectedEmployees.length > 0 ? (
              selectedEmployees.map((emp, index) => (
                <div key={index} className="selected-employee">
                  {emp.name}
                  <span
                    className="remove-employee"
                    onClick={
                      isEditable
                        ? () => handleRemoveEmployee(emp.employee_id)
                        : undefined
                    }
                    style={{
                      cursor: isEditable ? "pointer" : "default",
                      opacity: isEditable ? 1 : 0.6,
                    }}
                  >
                    ❌
                  </span>
                </div>
              ))
            ) : (
              <p className="placeholder-text">
                double tap on name/dept to add employee
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="key-input">
        <label>Key Considerations</label>
        <div className="key-considerations-box">
          {points.map((point, index) => (
            <div key={index} className="key-point">
              {index + 1}.{" "}
              <input
                type="text"
                placeholder="write your points..."
                value={point}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                readOnly={!isEditable}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepTwo;
