"use client";

import React from "react";
import "./AllDetailsView.css";

const AllDetailsView = ({
  employees,
  searchQuery,
  setSearchQuery,
  handleBackToMain,
  calculateSalaryDetails,
  employeeLopData = {},
  employeeIncentiveData = {},
  overtimeRecords = [],
  bonusRecords = [],
  advances = [],
}) => {
  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      emp.employee_id.toString().toLowerCase().includes(searchLower) ||
      emp.full_name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="esd-container">
      <div className="esd-header">
        <button className="esd-back-button" onClick={handleBackToMain}>
          <svg
            className="esd-back-icon"
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
        <h1 className="esd-header-title">Employee Salary Overview</h1>
      </div>

      <div className="esd-search-container">
        <input
          type="text"
          className="esd-search-input"
          placeholder="Search by Employee ID or Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredEmployees.length > 0 ? (
        <div className="esd-table-container">
          <div className="esd-table-wrapper">
            <table className="esd-table">
              <thead>
                <tr>
                  <th className="esd-table-header esd-align-left esd-id-column">
                    ID
                  </th>
                  <th className="esd-table-header esd-align-left esd-name-column">
                    Name
                  </th>
                  <th className="esd-table-header esd-align-right">
                    Annual CTC
                  </th>
                  <th className="esd-table-header esd-align-right">Basic</th>
                  <th className="esd-table-header esd-align-right">HRA</th>
                  <th className="esd-table-header esd-align-right">LTA</th>
                  <th className="esd-table-header esd-align-right">
                    Other Allow.
                  </th>
                  <th className="esd-table-header esd-align-right">
                    Incentives
                  </th>
                  <th className="esd-table-header esd-align-right">Overtime</th>
                  <th className="esd-table-header esd-align-right">Bonus</th>
                  <th className="esd-table-header esd-align-right esd-deduction">
                    Adv. Rec.
                  </th>
                  <th className="esd-table-header esd-align-right esd-deduction">
                    Emp. PF
                  </th>
                  <th className="esd-table-header esd-align-right esd-deduction">
                    Emp'r PF
                  </th>
                  <th className="esd-table-header esd-align-right esd-deduction">
                    ESIC
                  </th>
                  <th className="esd-table-header esd-align-right esd-deduction">
                    Gratuity
                  </th>
                  <th className="esd-table-header esd-align-right esd-deduction">
                    Prof. Tax
                  </th>
                  <th className="esd-table-header esd-align-right esd-deduction">
                    TDS
                  </th>
                  <th className="esd-table-header esd-align-right esd-deduction">
                    Insurance
                  </th>
                  <th className="esd-table-header esd-align-right esd-ded">
                    LOP Days
                  </th>
                  <th className="esd-table-header esd-align-right esd-ded">
                    LOP Ded.
                  </th>
                  <th className="esd-table-header esd-align-right">
                    Gross Salary
                  </th>
                  <th className="esd-table-header esd-align-right">
                    Net Salary
                  </th>
                </tr>
              </thead>

              <tbody className="esd-table-body">
                {filteredEmployees.map((emp) => {
                  const salaryDetails = calculateSalaryDetails(
                    emp.ctc,
                    emp.plan_data || {},
                    emp.employee_id,
                    overtimeRecords,
                    bonusRecords,
                    advances,
                    employeeIncentiveData,
                    employeeLopData
                  );

                  const lopData = employeeLopData[emp.employee_id] || {
                    currentMonth: { days: 0, value: "0.00" },
                    yearly: { days: 0, value: "0.00" },
                  };

                  const empIdUpper = String(emp.employee_id).toUpperCase();
                  const incentiveEntry = Object.entries(
                    employeeIncentiveData
                  ).find(([key]) => String(key).toUpperCase() === empIdUpper);
                  const incentiveValue = incentiveEntry
                    ? parseFloat(incentiveEntry[1]?.totalIncentive?.value || 0)
                    : 0;

                  const grossSalary = salaryDetails?.grossSalary || 0;
                  const netFromCalc = salaryDetails?.netSalary || 0;
                  const finalNetSalary =
                    netFromCalc +
                    incentiveValue -
                    parseFloat(lopData.currentMonth?.value || 0);

                  const format = (val) =>
                    val > 0
                      ? `₹${parseFloat(val).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "₹0.00";

                  return (
                    <tr key={emp.employee_id} className="esd-table-row">
                      <td className="esd-table-cell esd-align-left esd-id-column">
                        {emp.employee_id}
                      </td>
                      <td className="esd-table-cell esd-align-left esd-name-column">
                        {emp.full_name}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {emp.ctc ? format(emp.ctc) : "N/A"}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {format(salaryDetails?.basicSalary)}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {format(salaryDetails?.hra)}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {format(salaryDetails?.ltaAllowance)}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {format(salaryDetails?.otherAllowances)}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {incentiveValue > 0 ? format(incentiveValue) : "₹0.00"}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {format(salaryDetails?.overtimePay)}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {format(salaryDetails?.bonusPay)}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-deduction">
                        {format(salaryDetails?.advanceRecovery)}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-deduction">
                        {format(salaryDetails?.employeePF)}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-deduction">
                        {format(salaryDetails?.employerPF)}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-deduction">
                        {format(salaryDetails?.esic)}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-deduction">
                        {format(salaryDetails?.gratuity)}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-deduction">
                        {format(salaryDetails?.professionalTax)}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-deduction">
                        {format(salaryDetails?.tds)}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-deduction">
                        {format(salaryDetails?.insurance)}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-deduction">
                        {lopData.currentMonth?.days ?? 0}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-deduction">
                        {format(lopData.currentMonth?.value || 0)}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {format(grossSalary)}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {finalNetSalary > 0 ? format(finalNetSalary) : "₹0.00"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="esd-no-data">
          No employees found matching your search.
        </div>
      )}
    </div>
  );
};

export default AllDetailsView;
