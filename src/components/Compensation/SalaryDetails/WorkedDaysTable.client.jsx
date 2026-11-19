"use client";

import React from "react";
import * as XLSX from "xlsx";
import { Maximize2, Minimize2 } from "lucide-react";

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? dateValue
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
}

function formatPayrollPeriod(period) {
  if (!period?.startDate || !period?.endDate) return "Payroll period unavailable";
  return `${formatDate(period.startDate)} to ${formatDate(period.endDate)}`;
}

function formatAmount(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function formatDayCount(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function DailyAttendanceDetails({ attendance, expanded, onToggle }) {
  const dailyStatus = (attendance?.dailyStatus || []).filter(
    ({ status }) => status === "Absent" || status === "Pending Leave",
  );
  const pendingLeaveCount = dailyStatus.filter(
    ({ status }) => status === "Pending Leave",
  ).length;
  return (
    <div className="sd-worked-days-daily-details">
      <div className="sd-worked-days-attendance-summary">
        <strong>
          Absent (incl. pending): {formatDayCount(attendance?.absentDays)} days
          {pendingLeaveCount > 0 && ` | Pending leaves: ${pendingLeaveCount}`}
        </strong>
        <button
          type="button"
          className="sd-worked-days-expand"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Hide" : "Show"} daily attendance details`}
          title={expanded ? "Hide daily attendance details" : "Show daily attendance details"}
        >
          {expanded ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
        </button>
      </div>
      {expanded && (
        <div className="sd-worked-days-daily-list">
          <strong className="sd-worked-days-count-summary">
            Present: {formatDayCount(attendance?.workedDays)} | Absent:{" "}
            {formatDayCount(attendance?.absentDays)} | Leaves:{" "}
            {formatDayCount(attendance?.approvedLeaveDays)} | Pending leaves:{" "}
            {pendingLeaveCount}
          </strong>
          {dailyStatus.length ? dailyStatus.map(({ date, status }) => (
            <div key={date}>
              {formatDate(date)}:{" "}
              <span className={`sd-worked-days-status sd-worked-days-status-${status === "Absent" ? "absent" : "pending"}`}>
                {status}
              </span>
            </div>
          )) : <div>No absent or pending leave records</div>}
        </div>
      )}
    </div>
  );
}

function DeductionCells({ deduction }) {
  const count = Number(deduction?.count || 0);
  const eligibleCount = Number(deduction?.eligibleCount ?? count);
  return (
    <>
      <td className="sd-align-right sd-deduction">
        {eligibleCount} ({count})
      </td>
      <td className="sd-align-right sd-deduction">
        {formatAmount(deduction?.amount)}
      </td>
    </>
  );
}

export default function WorkedDaysTable({
  employees,
  data,
  salaryRows,
  monthlyDayCount,
  isLoading,
  error,
  onRetry,
}) {
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());
  const [expandedIds, setExpandedIds] = React.useState(() => new Set());

  if (isLoading) {
    return <div className="sd-worked-days-message">Calculating worked days...</div>;
  }

  if (error) {
    return (
      <div className="sd-worked-days-message sd-deduction-error" role="alert">
        {error}
        <button className="sd-worked-days-retry" onClick={onRetry} type="button">
          Retry
        </button>
      </div>
    );
  }

  if (!employees.length) {
    return <p className="sd-no-data">No employees found</p>;
  }

  const rowsByEmployee = new Map(
    (data?.employees || []).map((employee) => [
      String(employee.employee_id),
      employee,
    ]),
  );
  const salaryByEmployee = new Map(
    salaryRows.map((row) => [String(row.employee_id), row]),
  );
  const periodLabel = formatPayrollPeriod(data?.period);
  const selectedEmployees = employees.filter((employee) =>
    selectedIds.has(String(employee.employee_id)),
  );
  const allVisibleSelected =
    employees.length > 0 &&
    employees.every((employee) => selectedIds.has(String(employee.employee_id)));

  const toggleSelection = (employeeId) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      const id = String(employeeId);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      employees.forEach((employee) => {
        const id = String(employee.employee_id);
        if (allVisibleSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const toggleExpanded = (employeeId) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      const id = String(employeeId);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const downloadSelectedExcel = () => {
    if (!selectedEmployees.length) return;

    const headers = [
      "ID", "Employee Name", "Annual CTC", "Basic Salary", "HRA", "LTA",
      "Other Allowances", "Incentives", "Overtime", "Statutory Bonus", "Bonus",
      "Employer PF", "Gratuity", "Insurance (Employer)", "ESIC (Employer)",
      "Advance Recovery", "Employee PF", "ESIC (Employee)", "Professional Tax",
      "TDS", "Insurance (Employee)", "Gross Salary", "Final CTC", "Net Salary",
      "Base Net Salary", "Late Login Eligible Count (Total Violations)",
      "Late Login Amount", "Approved Leave Count (LOP Days)", "LOP Deduction",
      "Miss Punch Out Eligible Count (Total Violations)", "Miss Punch Out Amount",
      "Less Login Hours Eligible Count (Total Violations)", "Less Login Hours Amount",
      "Net Salary After Attendance Deductions",
      "Payroll Period", "Period Days", "Worked Days",
      "Approved Leave Days", "Absent Days", "Current Month Days",
      "Daily Attendance Details",
    ];
    const summaryRows = selectedEmployees.map((employee) => {
      const attendance = rowsByEmployee.get(String(employee.employee_id));
      const salary = salaryByEmployee.get(String(employee.employee_id));
      const deductions = salary?.attendanceDeductions || {};
      const pendingLeaveCount = (attendance?.dailyStatus || []).filter(
        ({ status }) => status === "Pending Leave",
      ).length;
      const count = (deduction) => {
        const total = Number(deduction?.count || 0);
        const eligible = Number(deduction?.eligibleCount ?? total);
        return `${eligible} (${total})`;
      };
      return [
        employee.employee_id,
        employee.full_name || "N/A",
        Number(employee.ctc || 0),
        Number(salary?.basicSalary || 0),
        Number(salary?.hra || 0),
        Number(salary?.ltaAllowance || 0),
        Number(salary?.otherAllowances || 0),
        Number(salary?.incentivePay || 0),
        Number(salary?.overtimePay || 0),
        Number(salary?.statutoryBonus || 0),
        Number(salary?.monthlyBonusPay || 0),
        Number(salary?.employerPF || 0),
        Number(salary?.gratuity || 0),
        Number(salary?.insuranceEmployer || 0),
        Number(salary?.esicEmployer || 0),
        Number(salary?.advanceRecovery || 0),
        Number(salary?.employeePF || 0),
        Number(salary?.esic || 0),
        Number(salary?.professionalTax || 0),
        Number(salary?.tds || 0),
        Number(salary?.insurance || 0),
        Number(salary?.localGross || 0),
        Number(salary?.finalCTC || 0),
        Number(salary?.localNet || 0),
        Number(salary?.baseNetSalary || 0),
        count(deductions.lateLogin),
        Number(deductions.lateLogin?.amount || 0),
        `${Number(deductions.approvedLeaveCount || 0)} (${Number(salary?.lopDays || 0).toFixed(2)})`,
        Number(salary?.lopDeduction || 0),
        count(deductions.missPunchOut),
        Number(deductions.missPunchOut?.amount || 0),
        count(deductions.lessLoginHours),
        Number(deductions.lessLoginHours?.amount || 0),
        Number(salary?.adjustedNetSalary || 0),
        periodLabel,
        Number(attendance?.totalWorkingDays || 0),
        Number(attendance?.workedDays || 0),
        Number(attendance?.approvedLeaveDays || 0),
        Number(attendance?.absentDays || 0),
        Number(monthlyDayCount || 0),
        `Present: ${formatDayCount(attendance?.workedDays)} | Absent: ${formatDayCount(attendance?.absentDays)} | Leaves: ${formatDayCount(attendance?.approvedLeaveDays)} | Pending leaves: ${pendingLeaveCount}`,
      ];
    });
    const summarySheet = XLSX.utils.aoa_to_sheet([headers, ...summaryRows]);
    summarySheet["!cols"] = headers.map((header) => ({
      wch: Math.min(Math.max(header.length + 2, 14), 34),
    }));
    summarySheet["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: summaryRows.length, c: headers.length - 1 },
      }),
    };

    const attendanceHeaders = [
      "ID", "Employee Name", "Date", "Status", "Leave Days", "Punch In", "Punch Out",
    ];
    const attendanceRows = selectedEmployees.flatMap((employee) => {
      const attendance = rowsByEmployee.get(String(employee.employee_id));
      const dailyStatus = (attendance?.dailyStatus || []).filter(
        ({ status }) => status === "Absent" || status === "Pending Leave",
      );
      return dailyStatus.length
        ? dailyStatus.map((day) => [
            employee.employee_id,
            employee.full_name || "N/A",
            formatDate(day.date),
            day.status,
            Number(day.leaveDays || 0),
            day.punchIn || "",
            day.punchOut || "",
          ])
        : [[employee.employee_id, employee.full_name || "N/A", "", "No daily attendance records", 0, "", ""]];
    });
    const attendanceSheet = XLSX.utils.aoa_to_sheet([
      attendanceHeaders,
      ...attendanceRows,
    ]);
    attendanceSheet["!cols"] = [
      { wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 24 },
      { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];
    attendanceSheet["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: attendanceRows.length, c: attendanceHeaders.length - 1 },
      }),
    };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Worked Days Summary");
    XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Daily Attendance");
    XLSX.writeFile(
      workbook,
      `worked-days-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <div className="sd-table-section">
      <div className="sd-worked-days-summary">
        <strong>Payroll period:</strong> {periodLabel}
        <div className="sd-worked-days-actions">
          <span>{selectedEmployees.length} selected</span>
          <button
            type="button"
            className="sd-worked-days-export"
            onClick={downloadSelectedExcel}
            disabled={!selectedEmployees.length}
          >
            Generate Excel Sheet
          </button>
        </div>
      </div>
      <div className="sd-table-container">
        <div className="sd-table-wrapper">
          <table className="sd-worked-days-table">
            <thead>
              <tr>
                <th className="sd-worked-days-select-column">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select all employees"
                  />
                </th>
                <th>ID</th>
                <th>Employee Name</th>
                <th>Annual CTC</th>
                <th>Basic Salary</th>
                <th>HRA</th>
                <th>LTA</th>
                <th>Other Allowances</th>
                <th>Incentives</th>
                <th>Overtime</th>
                <th>Statutory Bonus</th>
                <th>Bonus</th>
                <th>Employer PF</th>
                <th>Gratuity</th>
                <th>Insurance (Employer)</th>
                <th>ESIC (Employer)</th>
                <th>Advance Recovery</th>
                <th>Employee PF</th>
                <th>ESIC (Employee)</th>
                <th>Professional Tax</th>
                <th>TDS</th>
                <th>Insurance (Employee)</th>
                <th>Gross Salary</th>
                <th>Final CTC</th>
                <th>Net Salary</th>
                <th>Base Net Salary</th>
                <th>Late Login Eligible Count (Total Violations)</th>
                <th>Late Login Amount</th>
                <th>Approved Leave Count (LOP Days)</th>
                <th>LOP Deduction</th>
                <th>Miss Punch Out Eligible Count (Total Violations)</th>
                <th>Miss Punch Out Amount</th>
                <th>Less Login Hours Eligible Count (Total Violations)</th>
                <th>Less Login Hours Amount</th>
                <th>Net Salary After Attendance Deductions</th>
                <th>Payroll Period</th>
                <th>Period Days</th>
                <th>Worked Days</th>
                <th>Approved Leave Days</th>
                <th>Absent Days</th>
                <th>Current Month Days</th>
                <th>Daily Attendance Details</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const attendance = rowsByEmployee.get(
                  String(employee.employee_id),
                );
                const salary = salaryByEmployee.get(String(employee.employee_id));
                const deductions = salary?.attendanceDeductions || {};
                return (
                  <tr key={employee.employee_id}>
                    <td className="sd-worked-days-select-column">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(String(employee.employee_id))}
                        onChange={() => toggleSelection(employee.employee_id)}
                        aria-label={`Select ${employee.full_name || employee.employee_id}`}
                      />
                    </td>
                    <td>{employee.employee_id}</td>
                    <td>{employee.full_name || "N/A"}</td>
                    <td className="sd-align-right">
                      {employee.ctc
                        ? `₹${Number(employee.ctc).toLocaleString("en-IN")}`
                        : "N/A"}
                    </td>
                    <td className="sd-align-right">{formatAmount(salary?.basicSalary)}</td>
                    <td className="sd-align-right">{formatAmount(salary?.hra)}</td>
                    <td className="sd-align-right">{formatAmount(salary?.ltaAllowance)}</td>
                    <td className="sd-align-right">{formatAmount(salary?.otherAllowances)}</td>
                    <td className="sd-align-right">{formatAmount(salary?.incentivePay)}</td>
                    <td className="sd-align-right">{formatAmount(salary?.overtimePay)}</td>
                    <td className="sd-align-right">{formatAmount(salary?.statutoryBonus)}</td>
                    <td className="sd-align-right">{formatAmount(salary?.monthlyBonusPay)}</td>
                    <td className="sd-align-right sd-deduction">{formatAmount(salary?.employerPF)}</td>
                    <td className="sd-align-right sd-deduction">{formatAmount(salary?.gratuity)}</td>
                    <td className="sd-align-right sd-deduction">{formatAmount(salary?.insuranceEmployer)}</td>
                    <td className="sd-align-right sd-deduction">{formatAmount(salary?.esicEmployer)}</td>
                    <td className="sd-align-right sd-deduction">{formatAmount(salary?.advanceRecovery)}</td>
                    <td className="sd-align-right sd-deduction">{formatAmount(salary?.employeePF)}</td>
                    <td className="sd-align-right sd-deduction">{formatAmount(salary?.esic)}</td>
                    <td className="sd-align-right sd-deduction">{formatAmount(salary?.professionalTax)}</td>
                    <td className="sd-align-right sd-deduction">{formatAmount(salary?.tds)}</td>
                    <td className="sd-align-right sd-deduction">{formatAmount(salary?.insurance)}</td>
                    <td className="sd-align-right"><strong>{formatAmount(salary?.localGross)}</strong></td>
                    <td className="sd-align-right"><strong>{formatAmount(salary?.finalCTC)}</strong></td>
                    <td className="sd-align-right"><strong>{formatAmount(salary?.localNet)}</strong></td>
                    <td className="sd-align-right"><strong>{formatAmount(salary?.baseNetSalary)}</strong></td>
                    <DeductionCells deduction={deductions.lateLogin} />
                    <td className="sd-align-right sd-deduction">
                      {Number(deductions.approvedLeaveCount || 0)} (
                      {Number(salary?.lopDays || 0).toFixed(2)})
                    </td>
                    <td className="sd-align-right sd-deduction">
                      {formatAmount(salary?.lopDeduction)}
                    </td>
                    <DeductionCells deduction={deductions.missPunchOut} />
                    <DeductionCells deduction={deductions.lessLoginHours} />
                    <td className="sd-align-right">
                      <strong>{formatAmount(salary?.adjustedNetSalary)}</strong>
                    </td>
                    <td>{periodLabel}</td>
                    <td className="sd-align-right">
                      {attendance?.totalWorkingDays ?? "N/A"}
                    </td>
                    <td className="sd-align-right">
                      {attendance?.workedDays ?? "N/A"}
                    </td>
                    <td className="sd-align-right">
                      {formatDayCount(attendance?.approvedLeaveDays)}
                    </td>
                    <td className="sd-align-right">
                      {formatDayCount(attendance?.absentDays)}
                    </td>
                    <td className="sd-align-right">{monthlyDayCount || "N/A"}</td>
                    <td>
                      <DailyAttendanceDetails
                        attendance={attendance}
                        expanded={expandedIds.has(String(employee.employee_id))}
                        onToggle={() => toggleExpanded(employee.employee_id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
