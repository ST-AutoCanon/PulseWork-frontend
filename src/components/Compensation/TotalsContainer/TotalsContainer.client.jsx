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

  const summaryCards = [
    { label: "Total Net Salary", value: totals.totalPayable, icon: <FaMoneyBillWave /> },
    { label: "Total Gross", value: totals.totalGross, icon: <FaChartLine /> },
    { label: "Total TDS", value: totals.totalTDS, icon: <FaMoneyCheckAlt /> },
    { label: "Total Advance", value: totals.totalAdvance, icon: <FaHandHoldingUsd /> },
    { label: "Total Overtime", value: totals.totalOvertime, icon: <FaClock /> },
    { label: "Total Bonus", value: totals.totalBonus, icon: <FaGift /> },
    { label: "Employee PF", value: totals.totalEmployeePF, icon: <FaShieldAlt /> },
    { label: "Employer PF", value: totals.totalEmployerPF, icon: <FaBriefcase /> },
    { label: "Employee Insurance", value: totals.totalInsurance, icon: <FaStethoscope /> },
    { label: "LOP Deduction", value: totalLopDeduction, icon: <FaExclamationTriangle /> },
  ];

  return (
    <div className="sb-totals-container">
      <h2 className="sb-totals-total-payroll">
        Total Net Salary: ₹{formatCurrency(totals.totalPayable)}
      </h2>

      <div className="sb-totals-grid">
        {summaryCards.map((card) => (
          <div key={card.label} className="sb-totals-card">
            <div className="sb-totals-card-icon">{card.icon}</div>
            <div>
              <span className="sb-totals-card-title">{card.label}</span>
              <span className="sb-totals-card-value">
                ₹{formatCurrency(card.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TotalsContainer;
