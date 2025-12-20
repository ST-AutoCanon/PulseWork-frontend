"use client";

import React from "react";
import {
  FaMoneyBillWave,
  FaChartLine,
  FaMoneyCheckAlt,
  FaHandHoldingUsd,
  FaClock,
  FaGift,
  FaShieldAlt,
  FaBriefcase,
  FaStethoscope,
  FaExclamationTriangle,
} from "react-icons/fa";

import "./TotalsContainer.css";

const TotalsContainer = ({ totals, totalLopDeduction }) => {
  const formatCurrency = (value) =>
    (Math.round((value || 0) * 100) / 100).toLocaleString("en-IN");

  return (
    <div className="sb-totals-container">
      <h2 className="sb-totals-total-payroll">
        Total Payroll: ₹{formatCurrency(totals.totalPayable)}
      </h2>

      <div className="sb-totals-grid">
        {[
          ["Total Payable", totals.totalPayable, <FaMoneyBillWave />],
          ["Total Gross", totals.totalGross, <FaChartLine />],
          ["Total TDS", totals.totalTDS, <FaMoneyCheckAlt />],
          ["Total Advance", totals.totalAdvance, <FaHandHoldingUsd />],
          ["Total Overtime", totals.totalOvertime, <FaClock />],
          ["Total Bonus", totals.totalBonus, <FaGift />],
          ["Employee PF", totals.totalEmployeePF, <FaShieldAlt />],
          ["Employer PF", totals.totalEmployerPF, <FaBriefcase />],
          ["Insurance", totals.totalInsurance, <FaStethoscope />],
          ["LOP Deduction", totalLopDeduction, <FaExclamationTriangle />],
        ].map(([label, value, icon], idx) => (
          <div key={idx} className="sb-totals-card">
            <div className="sb-totals-card-icon">{icon}</div>
            <div>
              <span className="sb-totals-card-title">{label}</span>
              <span className="sb-totals-card-value">
                ₹{formatCurrency(value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TotalsContainer;
