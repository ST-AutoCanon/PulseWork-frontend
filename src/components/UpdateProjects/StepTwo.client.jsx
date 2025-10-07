"use client";

import React from "react";
import { MdSearch } from "react-icons/md";
import { useAuth } from "../../context/AuthProvider.client"; // adjust path if needed

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
  editable, // optional: if undefined we infer from user's role
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
          <label>STS Owner</label>
          <select
            name="sts_owner_id"
            value={formData.sts_owner_id || ""}
            onChange={(e) => handleStsOwnerChange(e)}
            disabled={!isEditable}
          >
            <option value="">Select STS Owner</option>
            {stsOwners.map((emp) => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>
        </div>

        <div className="pj-form-group2">
          <label>STS Contact</label>
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
            Add Employees{" "}
            <div className="pj-search-box">
              <MdSearch className="pj-search-icon" />
              <input
                type="text"
                className="pj-search-input"
                placeholder="Search by Name, EmpID or Dept"
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
                disabled={!isEditable}
              />
              <label>Dept</label>
              <input
                type="radio"
                name="employee-filter"
                value="all"
                checked={filterType === "all"}
                onChange={handleFilterChange}
                disabled={!isEditable}
              />
              <label>All</label>
            </div>
          </label>

          <div className="add-employee">
            <div className="employee-list">
              {filteredEmployees.map((item, index) =>
                item.type === "department" ? (
                  <div
                    key={index}
                    className="employee-item"
                    onDoubleClick={
                      isEditable
                        ? () => handleDepartmentDoubleClick(item.name)
                        : undefined
                    }
                  >
                    {item.name}
                  </div>
                ) : (
                  <div
                    key={item.employee_id}
                    className="employee-item"
                    onDoubleClick={
                      isEditable ? () => handleDoubleClick(item) : undefined
                    }
                  >
                    {item.name} ({item.department_name})
                  </div>
                )
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
