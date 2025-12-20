
import React from "react";
import { FaSearch } from "react-icons/fa";
import DetailsTab from "./../DetailsTab/DetailsTab";
import "./EmployeeTable.css";

const EmployeeTable = ({
  employees,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  tableRef,
  handleViewSingleEmployee,
  openAdvanceModal,
  openIncentiveModal,  // 🔹 Uncomment: Now passed from parent
  showDetailsTab,
  selectedEmployee,
  activeTab,
  setActiveTab,
  tableHeight,
  handleCloseDetailsTab,
  calculateSalaryDetails,
  employeeLopData,
  overtimeRecords,
  bonusRecords,
  advances,
  employeeIncentiveData,
}) => {
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.employee_id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleIncentiveClick = (emp) => {
    const isIncentiveEnabled = emp.plan_data?.isIncentives;
    if (isIncentiveEnabled) {
      openIncentiveModal(emp.employee_id, emp.full_name);
    } else {
      alert("Incentives are disabled in this compensation plan.");
    }
  };

  return (
    <div className="sb-table-main-content">
      <div className="sb-table-header-container">
        <h2 className="sb-table-heading">Employee Payslip List</h2>
        <div className="sb-table-search-wrapper">
          <input
            type="text"
            className="sb-table-search-input"
            placeholder="Search by Employee ID or Full Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch className="sb-table-search-icon" />
        </div>
      </div>
      <div className="sb-table-and-details-container">
        <div
          className={`sb-table-wrapper ${showDetailsTab ? "sb-table-compressed" : ""}`}
          ref={tableRef}
        >
          <table className="sb-table">
            <thead>
              <tr>
                <th className="sb-table-header sb-table-align-left">Emp ID</th>
                <th className="sb-table-header sb-table-align-left">Full Name</th>
                <th className="sb-table-header sb-table-align-left">Comp Plan</th>
                <th className="sb-table-header sb-table-align-left">Action</th>
              </tr>
            </thead>
            <tbody className="sb-table-body-wrapper">
              {currentEmployees.map((emp) => {
                const isIncentiveEnabled = emp.plan_data?.isIncentives;
                return (
                  <tr key={emp.employee_id}>
                    <td className="sb-table-cell sb-table-align-left">{emp.employee_id}</td>
                    <td className="sb-table-cell sb-table-align-left">{emp.full_name}</td>
                    <td className="sb-table-cell sb-table-align-left">
                      {emp.compensation_plan_name || "No Plan Assigned"}
                    </td>
                    <td className="sb-table-cell sb-table-align-center">
                      <div className="sb-table-action-buttons">
                        <button
                          className="sb-table-view-button"
                          onClick={() => handleViewSingleEmployee(emp)}
                        >
                          Annexure
                        </button>
                        <button
                          className="sb-table-advance-button"
                          onClick={() => openAdvanceModal(emp.employee_id, emp.full_name)}
                        >
                          Add Advance
                        </button>
                        <button
                          className={`sb-table-incentive-button ${!isIncentiveEnabled ? 'disabled' : ''}`}
                          onClick={() => handleIncentiveClick(emp)}
                          disabled={!isIncentiveEnabled}
                          title={!isIncentiveEnabled ? "Incentives disabled in this plan" : "Add Incentive"}
                        >
                          Add Incentive
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="sb-table-pagination">
            <button
              className="sb-table-pagination-button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="sb-table-pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="sb-table-pagination-button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
        {showDetailsTab && selectedEmployee && (
          <DetailsTab
            selectedEmployee={selectedEmployee}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tableHeight={tableHeight}
            handleCloseDetailsTab={handleCloseDetailsTab}
            calculateSalaryDetails={calculateSalaryDetails}
            employeeLopData={employeeLopData}
            overtimeRecords={overtimeRecords}
            bonusRecords={bonusRecords}
            advances={advances}
            employeeIncentiveData={employeeIncentiveData}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeTable;