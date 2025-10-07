"use client";

import React, { useState, useEffect } from "react";
import "jspdf-autotable"; // Import autoTable plugin for tables
import "./PayrollSummary.css"; // Ensure proper CSS
import generatePayslipPDF from "../../utils/generatePayslipPDF";
import { useAuth } from "../../context/AuthProvider.client"; // Adjust path

const PayrollSummary = () => {
  const { user } = useAuth(); // Get logged-in employee info
  const getCurrentMonthYear = () => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentMonthYear());
  const [payrollData, setPayrollData] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const employeeId = user?.employeeId;

  const headers = {
    "x-api-key": API_KEY ?? "",
    "x-employee-id": employeeId ?? "",
  };

  const handleDateChange = (event) => {
    const [month, year] = event.target.value.split("-");
    setSelectedDate({ month: parseInt(month), year: parseInt(year) });
  };

  useEffect(() => {
    if (!employeeId) return;

    const fetchPayrollData = async () => {
      setLoading(true);
      setError(null);
      setPayrollData(null);
      setBankDetails(null);
      setEmployeeDetails(null);

      try {
        const res = await fetch(
          `${BACKEND_URL}/api/salary-slip?employee_id=${employeeId}&month=${selectedDate.month}&year=${selectedDate.year}`,
          { headers }
        );
        const result = await res.json();

        if (res.ok && result) {
          setPayrollData(result);
          fetchBankDetails();
          fetchEmployeeDetails();
        } else {
          setPayrollData(null);
        }
      } catch (err) {
        setError("Failed to fetch payroll data.");
      }
      setLoading(false);
    };

    const fetchBankDetails = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/bank-details/${employeeId}`,
          { headers }
        );
        const result = await res.json();
        setBankDetails(res.ok ? result : null);
      } catch (err) {
        console.error("Failed to fetch bank details:", err);
      }
    };

    const fetchEmployeeDetails = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/employee-details/${employeeId}`,
          { headers }
        );
        const result = await res.json();
        setEmployeeDetails(res.ok ? result : null);
      } catch (err) {
        console.error("Failed to fetch employee details:", err);
      }
    };

    const fetchAttendanceData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/attendance/${employeeId}`, {
          headers,
        });
        const result = await res.json();
        setAttendance(
          res.ok && result.attendanceStats ? result.attendanceStats : null
        );
      } catch (err) {
        console.error("Failed to fetch attendance details:", err);
      }
    };

    fetchPayrollData();
    fetchAttendanceData();
  }, [selectedDate, employeeId, BACKEND_URL, API_KEY]);

  return (
    <div className="payroll-container">
      <h1 className="payroll-title">Employee Payslip</h1>

      {/* Month & Year Dropdown */}
      <div className="payroll-controls">
        <label className="payroll-label">Select Month & Year:</label>
        <select
          value={`${selectedDate.month}-${selectedDate.year}`}
          onChange={handleDateChange}
          className="payroll-select"
        >
          {[...Array(6)].map((_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return (
              <option
                key={i}
                value={`${date.getMonth() + 1}-${date.getFullYear()}`}
              >
                {date.toLocaleString("default", { month: "long" })}{" "}
                {date.getFullYear()}
              </option>
            );
          })}
        </select>
      </div>

      {/* Payroll Rendering */}
      {loading ? (
        <p>Loading payroll data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : payrollData ? (
        <>
          {(bankDetails || employeeDetails) && (
            <div className="bank-details">
              {bankDetails && (
                <>
                  <p>
                    <strong>Bank Name:</strong> {bankDetails.bank_name}
                  </p>
                  <p>
                    <strong>Account Number:</strong>{" "}
                    {bankDetails.account_number}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="payslip">
            <h2>
              Payslip for{" "}
              {new Date(
                selectedDate.year,
                selectedDate.month - 1
              ).toLocaleString("default", { month: "long", year: "numeric" })}
            </h2>

            <table className="payslip-table">
              <thead>
                <tr>
                  <th>Earnings</th>
                  <th>Amount</th>
                  <th>Deductions</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic Salary</td>
                  <td>₹{payrollData.basic_salary}</td>
                  <td>Provident Fund (PF)</td>
                  <td>₹{payrollData.pf || 0}</td>
                </tr>
                <tr>
                  <td>HRA</td>
                  <td>₹{payrollData.hra || 0}</td>
                  <td>ESI / Insurance</td>
                  <td>₹{payrollData.insurance || 0}</td>
                </tr>
                <tr>
                  <td>Other Allowances</td>
                  <td>₹{payrollData.allowance || 0}</td>
                  <td>Professional Tax</td>
                  <td>₹{payrollData.pt || 0}</td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td>TDS</td>
                  <td>₹{payrollData.tds || 0}</td>
                </tr>
                {payrollData.special_allowance > 0 && (
                  <tr>
                    <td>Bonus</td>
                    <td>₹{payrollData.special_allowance}</td>
                    <td></td>
                    <td></td>
                  </tr>
                )}
                {payrollData.rnrbonus > 0 && (
                  <tr>
                    <td>Rewards And Recognition</td>
                    <td>₹{payrollData.rnrbonus}</td>
                    <td></td>
                    <td></td>
                  </tr>
                )}
                {payrollData.advance_recovery > 0 && (
                  <tr>
                    <td></td>
                    <td></td>
                    <td>Advance Recovery</td>
                    <td>₹{payrollData.advance_recovery}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td>
                    <strong>Gross Earnings</strong>
                  </td>
                  <td>
                    <strong>₹{payrollData.total_earnings}</strong>
                  </td>
                  <td>
                    <strong>Total Deductions</strong>
                  </td>
                  <td>
                    <strong>₹{payrollData.total_deductions}</strong>
                  </td>
                </tr>
                <tr className="net-salary-row">
                  <td colSpan="2">
                    <strong>Net Salary</strong>
                  </td>
                  <td colSpan="2">
                    <strong>₹{Math.floor(payrollData.net_salary)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {(payrollData.advance_taken || payrollData.advance_recovery) && (
              <div className="advance-section">
                <h3>Salary Advance</h3>
                <table className="advance-table">
                  <thead>
                    <tr>
                      <th>Total Advance Taken</th>
                      <th>Advance Recovery This Month</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>₹{payrollData.salary_advance || 0}</td>
                      <td>₹{payrollData.advance_recovery || 0}</td>
                    </tr>
                  </tbody>
                  <tr className="net-salary-row">
                    <td
                      colSpan="2"
                      style={{
                        textAlign: "left",
                        paddingLeft: "8px",
                        backgroundColor: "white",
                        color: "black",
                      }}
                    >
                      <strong>
                        Net Salary: ₹{Math.floor(payrollData.net_salary)}
                      </strong>
                    </td>
                  </tr>
                </table>
              </div>
            )}

            <button
              onClick={() =>
                generatePayslipPDF(
                  payrollData,
                  selectedDate,
                  bankDetails,
                  attendance,
                  employeeDetails
                )
              }
              className="payroll-download-btn"
            >
              Download PDF
            </button>
          </div>
        </>
      ) : (
        <p>No payroll data available for this month.</p>
      )}
    </div>
  );
};

export default PayrollSummary;
