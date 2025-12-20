




import React from 'react';
import './AllDetailsView.css';

const AllDetailsView = ({
  employees,
  searchQuery,
  setSearchQuery,
  handleBackToMain,
  calculateSalaryDetails,
  employeeLopData,
  employeeIncentiveData,
  overtimeRecords,
  bonusRecords,
  advances,
}) => {
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.employee_id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="esd-header-title">Employee Salary Overview</div>
      </div>
      <div className="esd-search-container">
        <input
          type="text"
          className="esd-search-input"
          placeholder="Search by ID or Name"
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
                  <th className="esd-table-header esd-align-left esd-id-column">ID</th>
                  <th className="esd-table-header esd-align-left esd-name-column">Name</th>
                  <th className="esd-table-header esd-align-right">Annual CTC</th>
                  <th className="esd-table-header esd-align-right">Basic Salary</th>
                  <th className="esd-table-header esd-align-right">HRA</th>
                  <th className="esd-table-header esd-align-right esd-scrollable">LTA</th>
                  <th className="esd-table-header esd-align-right esd-scrollable">Other Allow.</th>
                  <th className="esd-table-header esd-align-right esd-scrollable">Incentives</th>
                  <th className="esd-table-header esd-align-right esd-scrollable">Overtime</th>
                  <th className="esd-table-header esd-align-right esd-scrollable">Bonus</th>
                  <th className="esd-table-header esd-align-right esd-scrollable esd-deduction">Advance Rec.</th>
                  <th className="esd-table-header esd-align-right esd-scrollable esd-deduction">Emp. PF</th>
                  <th className="esd-table-header esd-align-right esd-scrollable esd-deduction">Employer PF</th>
                  <th className="esd-table-header esd-align-right esd-scrollable esd-deduction">ESIC</th>
                  <th className="esd-table-header esd-align-right esd-scrollable esd-deduction">Gratuity</th>
                  <th className="esd-table-header esd-align-right esd-scrollable esd-deduction">Prof. Tax</th>
                  <th className="esd-table-header esd-align-right esd-scrollable esd-deduction">Income Tax</th>
                  <th className="esd-table-header esd-align-right esd-scrollable esd-deduction">Insurance</th>
                  <th className="esd-table-header esd-align-right esd-scrollable esd-deduction">LOP Days</th>
                  <th className="esd-table-header esd-align-right esd-scrollable esd-deduction">LOP Ded.</th>
                  <th className="esd-table-header esd-align-right esd-scrollable">Gross Salary</th>
                  <th className="esd-table-header esd-align-right esd-scrollable">Net Salary</th>
                </tr>
              </thead>
              <tbody className="esd-table-body">
                {filteredEmployees.map((emp) => {
                  const salaryDetails = calculateSalaryDetails(
                    emp.ctc,
                    emp.plan_data,
                    emp.employee_id,
                    overtimeRecords,
                    bonusRecords,
                    advances,
                    employeeIncentiveData
                  );
                  const lopData =
                    employeeLopData[emp.employee_id] || {
                      currentMonth: { days: 0, value: '0.00', currency: 'INR' },
                      deferred: { days: 0, value: '0.00', currency: 'INR' },
                      nextMonth: { days: 0, value: '0.00', currency: 'INR' },
                      yearly: { days: 0, value: '0.00', currency: 'INR' },
                    };

                  // Calculate incentive for this employee
                  const empId = String(emp.employee_id).toUpperCase();
                  const matchedKey = Object.keys(employeeIncentiveData).find(key => String(key).toUpperCase() === empId);
                  const incentiveObj = matchedKey ? employeeIncentiveData[matchedKey] : null;
                  const incentiveValue = incentiveObj?.totalIncentive ? parseFloat(incentiveObj.totalIncentive.value) || 0 : 0;

                  const netSalary = salaryDetails
                    ? salaryDetails.netSalary + incentiveValue - (lopData ? parseFloat(lopData.currentMonth.value || 0) : 0)
                    : 0;
                  return (
                    <tr key={emp.employee_id}>
                      <td className="esd-table-cell esd-align-left esd-id-column">{emp.employee_id}</td>
                      <td className="esd-table-cell esd-align-left esd-name-column">{emp.full_name}</td>
                      <td className="esd-table-cell esd-align-right">
                        {emp.ctc ? `₹${parseFloat(emp.ctc).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.basicSalary).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.hra).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.ltaAllowance).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.otherAllowances).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable">
                        {incentiveValue > 0 ? `₹${incentiveValue.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.overtimePay).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.bonusPay).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable esd-deduction">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.advanceRecovery).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable esd-deduction">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.employeePF).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable esd-deduction">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.employerPF).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable esd-deduction">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.esic).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable esd-deduction">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.gratuity).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable esd-deduction">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.professionalTax).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable esd-deduction">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.tds).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable esd-deduction">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.insurance).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable esd-deduction">
                        {lopData ? lopData.currentMonth.days : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable esd-deduction">
                        {lopData ? `₹${parseFloat(lopData.currentMonth.value || 0).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable">
                        {salaryDetails ? `₹${parseFloat(salaryDetails.grossSalary).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="esd-table-cell esd-align-right esd-scrollable">
                        {netSalary > 0 ? `₹${parseFloat(netSalary).toLocaleString()}` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="esd-no-data">No employees found</p>
      )}
    </div>
  );
};

export default AllDetailsView;