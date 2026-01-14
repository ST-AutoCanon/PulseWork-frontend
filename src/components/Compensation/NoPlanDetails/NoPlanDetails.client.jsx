"use client";

import React from "react";
import { FaSearch } from "react-icons/fa";
import "./NoPlanDetails.css";

const NoPlanDetails = ({
  allEmployees = [],
  employees = [],
  searchTerm = "",
  debouncedSetSearchTerm,
  handleBackToMain,
  openAssignModal,
  isLoading = false,
}) => {
  const employeesWithoutPlans = allEmployees.filter((emp) => {
    const empId = String(emp.employee_id);
    return !employees.some(
      (assignedEmp) => String(assignedEmp.employee_id) === empId
    );
  });

  const filteredEmployees = employeesWithoutPlans.filter((emp) => {
    const search = searchTerm.toLowerCase();
    return (
      String(emp.employee_id).toLowerCase().includes(search) ||
      emp.full_name.toLowerCase().includes(search)
    );
  });

  return (
    <div className="npd-container">
      <div className="npd-header">
        <button
          className="npd-back-button"
          onClick={handleBackToMain}
          aria-label="Back to main"
        >
          <svg
            className="npd-back-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="npd-header-title">
          Employees Without Compensation Plans
        </h1>
      </div>

      <div className="npd-search-container">
        <input
          type="text"
          className="npd-search-input"
          placeholder="Search by Employee ID or Name..."
          value={searchTerm}
          onChange={(e) => debouncedSetSearchTerm(e.target.value)}
          aria-label="Search employees without plans"
        />
        <FaSearch className="npd-search-icon" />
      </div>

      {isLoading ? (
        <div className="npd-loading" role="status">
          Loading employees...
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="npd-table-container">
          <table className="npd-table" role="table">
            <thead>
              <tr>
                <th className="npd-table-header npd-align-left">Employee ID</th>
                <th className="npd-table-header npd-align-left">Full Name</th>
                <th className="npd-table-header npd-align-center">Action</th>
              </tr>
            </thead>
            <tbody className="npd-table-body">
              {filteredEmployees.map((emp) => (
                <tr key={emp.employee_id} className="npd-table-row">
                  <td className="npd-table-cell npd-align-left">
                    {emp.employee_id}
                  </td>
                  <td className="npd-table-cell npd-align-left">
                    {emp.full_name}
                  </td>
                  <td className="npd-table-cell npd-align-center">
                    <button
                      className="npd-assign-button"
                      onClick={() =>
                        openAssignModal(emp.employee_id, emp.full_name)
                      }
                    >
                      Assign Plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="npd-no-data">
          All employees have compensation plans assigned
        </div>
      )}
    </div>
  );
};

export default NoPlanDetails;
