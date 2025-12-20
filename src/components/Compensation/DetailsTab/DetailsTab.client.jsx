
"use client";

import React from "react";
import "./DetailsTab.css";
import { parseApplicableMonth } from "../../../utils/SalaryCalculations.js";

const DetailsTab = ({
  selectedEmployee,
  activeTab,
  setActiveTab,
  calculateSalaryDetails,
  overtimeRecords = [],
  bonusRecords = [],
  advances = [],
  employeeIncentiveData = {},
  employeeLopData = {},   // ← RECEIVE PRE-FETCHED LOP DATA
  tableHeight,
  handleCloseDetailsTab,
}) => {
  if (!selectedEmployee?.employee_id || !selectedEmployee.ctc) {
    return <p>No valid employee data</p>;
  }

  const planData = selectedEmployee.plan_data || {};

  // Use pre-fetched LOP data from parent
  const lopInfo = employeeLopData[selectedEmployee.employee_id];

  console.log("🔍 DetailsTab - Employee ID:", selectedEmployee.employee_id);
  console.log("🔍 DetailsTab - Received LOP Info:", lopInfo);

  const monthlyLopValue = Number(lopInfo?.currentMonth?.value || 0);
  const yearlyLopValue = Number(lopInfo?.yearly?.value || 0);

  console.log("💸 DetailsTab - Monthly LOP Deduction:", monthlyLopValue);
  console.log("💸 DetailsTab - Yearly LOP Deduction:", yearlyLopValue);

  /* ---------------- SALARY BASE ---------------- */
  const salaryDetails = calculateSalaryDetails(
    selectedEmployee.ctc,
    planData,
    selectedEmployee.employee_id,
    overtimeRecords,
    bonusRecords,
    advances,
    employeeIncentiveData
    // NO employeeLopData passed here → LOP not calculated inside
  );

  if (!salaryDetails) {
    return <p>Unable to calculate salary details</p>;
  }

  /* ---------------- BONUS (CURRENT MONTH) ---------------- */
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, "0");
  const monthlyCTC = Number(selectedEmployee.ctc) / 12;

  const monthlyBonuses = bonusRecords.filter((bonus) => {
    const date = parseApplicableMonth(bonus.applicable_month);
    return (
      date &&
      date.getFullYear() === currentYear &&
      String(date.getMonth() + 1).padStart(2, "0") === currentMonthStr
    );
  });

  const monthlyBonusPay = monthlyBonuses.reduce((sum, bonus) => {
    if (bonus.fixed_amount) return sum + Number(bonus.fixed_amount || 0);
    if (bonus.percentage_ctc)
      return sum + (Number(bonus.percentage_ctc || 0) / 100) * Number(selectedEmployee.ctc || 0);
    if (bonus.percentage_monthly_salary)
      return sum + Number(bonus.percentage_monthly_salary || 0) * monthlyCTC;
    return sum;
  }, 0);

  const yearlyBonusPay = salaryDetails.recordBonusPayYearly || monthlyBonusPay * 12;

  /* ---------------- HELPERS ---------------- */
  const getAmount = (item) => (activeTab === "monthly" ? item.monthly : item.yearly);

  const format = (v) =>
    `₹${Number(v || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  /* ---------------- EARNINGS ---------------- */
  const earnings = [
    { label: "Basic Salary", monthly: salaryDetails.basicSalary, yearly: salaryDetails.basicSalary * 12 },
    { label: "HRA", monthly: salaryDetails.hra, yearly: salaryDetails.hra * 12 },
    { label: "LTA Allowance", monthly: salaryDetails.ltaAllowance, yearly: salaryDetails.ltaAllowance * 12 },
    { label: "Other Allowances", monthly: salaryDetails.otherAllowances, yearly: salaryDetails.otherAllowances * 12 },
    { label: "Overtime Pay", monthly: salaryDetails.overtimePay, yearly: salaryDetails.overtimePay * 12 },
    { label: "Incentive Pay", monthly: salaryDetails.incentivePay, yearly: salaryDetails.incentivePay * 12 },
    { label: "Bonus Pay", monthly: monthlyBonusPay, yearly: yearlyBonusPay },
  ];

  /* ---------------- DEDUCTIONS ---------------- */
  const deductions = [
    {
      label: "LOP Deduction",
      monthly: monthlyLopValue,
      yearly: yearlyLopValue,
    },
    {
      label: "Advance Recovery",
      monthly: salaryDetails.advanceRecovery,
      yearly: salaryDetails.advanceRecovery * 12,
    },
    {
      label: "Employee PF",
      monthly: salaryDetails.employeePF,
      yearly: salaryDetails.employeePF * 12,
    },
    {
      label: "Professional Tax",
      monthly: salaryDetails.professionalTax,
      yearly: salaryDetails.professionalTax * 12,
    },
  ].filter((item) => getAmount(item) > 0);

  /* ---------------- TOTALS ---------------- */
  const correctedGross = salaryDetails.grossSalary + monthlyBonusPay - salaryDetails.bonusPay;

  const totalDeductions = deductions.reduce((sum, d) => sum + getAmount(d), 0);
  const correctedNet = correctedGross - totalDeductions;

  /* ---------------- EMPLOYER CONTRIBUTIONS ---------------- */
  const employerContributions = [
    { label: "Employer PF", monthly: salaryDetails.employerPF, yearly: salaryDetails.employerPF * 12 },
    { label: "Gratuity", monthly: salaryDetails.gratuity, yearly: salaryDetails.gratuity * 12 },
  ].filter((item) => getAmount(item) > 0);

  /* ---------------- UI ---------------- */
  return (
    <div className="sb-details-tab" style={{ height: tableHeight }}>
      <div className="sb-details-header">
        <h2>
          Salary Annexure – {selectedEmployee.full_name || selectedEmployee.employee_id}
        </h2>
        {handleCloseDetailsTab && (
          <button className="sb-close-details" onClick={handleCloseDetailsTab}>
            ×
          </button>
        )}
      </div>

      <div className="sb-details-tab-buttons">
        <button
          className={activeTab === "monthly" ? "active" : ""}
          onClick={() => setActiveTab("monthly")}
        >
          Monthly
        </button>
        <button
          className={activeTab === "yearly" ? "active" : ""}
          onClick={() => setActiveTab("yearly")}
        >
          Yearly (Approx*)
        </button>
      </div>

      <table className="sb-details-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>{activeTab === "monthly" ? "Monthly Amount" : "Yearly Amount"}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="section-header">
            <td colSpan="2"><strong>Earnings</strong></td>
          </tr>

          {earnings.map((item) => (
            <tr key={item.label}>
              <td>{item.label}</td>
              <td>{format(getAmount(item))}</td>
            </tr>
          ))}

          <tr className="total-row">
            <td><strong>Gross Salary</strong></td>
            <td><strong>{format(activeTab === "monthly" ? correctedGross : correctedGross * 12)}</strong></td>
          </tr>

          <tr className="section-header">
            <td colSpan="2"><strong>Deductions</strong></td>
          </tr>

          {deductions.map((item) => (
            <tr key={item.label} className="deduction-row">
              <td>{item.label}</td>
              <td>{format(getAmount(item))}</td>
            </tr>
          ))}

          <tr className="total-row">
            <td><strong>Net Salary (Take Home)</strong></td>
            <td><strong>{format(activeTab === "monthly" ? correctedNet : correctedNet * 12)}</strong></td>
          </tr>

          {employerContributions.length > 0 && (
            <>
              <tr className="section-header">
                <td colSpan="2"><strong>Employer Contributions (CTC)</strong></td>
              </tr>
              {employerContributions.map((item) => (
                <tr key={item.label}>
                  <td>{item.label}</td>
                  <td>{format(getAmount(item))}</td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DetailsTab;