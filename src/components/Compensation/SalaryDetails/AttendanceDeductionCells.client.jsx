"use client";

import React from "react";

function getAmount(deduction) {
  return Math.max(0, Number(deduction?.amount || 0));
}

export function getAttendanceDeductionAmounts(deductions = {}) {
  return {
    lateLogin: getAmount(deductions.lateLogin),
    missPunchOut: getAmount(deductions.missPunchOut),
    lessLoginHours: getAmount(deductions.lessLoginHours),
  };
}

function getDeductionMethodText(deduction) {
  return (deduction?.breakdown || [])
    .map((method) => {
      const dayType =
        method.deductionType === "full_day" ? "Full-day" : "Half-day";
      const basis =
        String(method.basis || "").toLowerCase() === "amount"
          ? `fixed ₹${Number(method.value || 0).toFixed(2)}`
          : `${Number(method.value || 0)}%`;
      return `${dayType}: ${basis}`;
    })
    .filter(Boolean)
    .join("; ");
}

export function getAttendanceDeductionExportValues(deductions = {}) {
  const amount = getAttendanceDeductionAmounts(deductions);
  const formatCount = (deduction) =>
    `${Number(deduction?.eligibleCount ?? deduction?.count ?? 0)} (${Number(
      deduction?.count || 0,
    )})`;
  return [
    formatCount(deductions.lateLogin),
    `${amount.lateLogin.toFixed(2)}${getDeductionMethodText(deductions.lateLogin) ? ` (${getDeductionMethodText(deductions.lateLogin)})` : ""}`,
    formatCount(deductions.missPunchOut),
    `${amount.missPunchOut.toFixed(2)}${getDeductionMethodText(deductions.missPunchOut) ? ` (${getDeductionMethodText(deductions.missPunchOut)})` : ""}`,
    formatCount(deductions.lessLoginHours),
    `${amount.lessLoginHours.toFixed(2)}${getDeductionMethodText(deductions.lessLoginHours) ? ` (${getDeductionMethodText(deductions.lessLoginHours)})` : ""}`,
  ];
}

function DeductionCells({ deduction }) {
  const totalCount = Number(deduction?.count || 0);
  const eligibleCount = Number(deduction?.eligibleCount ?? totalCount);
  const methodText = getDeductionMethodText(deduction);

  return (
    <>
      <td className="sd-table-cell sd-align-right sd-deduction">
        {eligibleCount} ({totalCount})
      </td>
      <td className="sd-table-cell sd-align-right sd-deduction">
        <span>₹{getAmount(deduction).toFixed(2)}</span>
        {methodText && (
          <small className="sd-deduction-method">{methodText}</small>
        )}
      </td>
    </>
  );
}

export default function AttendanceDeductionCells({
  deductions,
  approvedLeaveCount = 0,
  lopDays = 0,
  lopDeduction = 0,
}) {
  return (
    <>
      <DeductionCells deduction={deductions?.lateLogin} />
      <td className="sd-table-cell sd-align-right sd-deduction">
        {Number(approvedLeaveCount || 0)} ({Number(lopDays || 0).toFixed(2)})
      </td>
      <td className="sd-table-cell sd-align-right sd-deduction">
        ₹{Number(lopDeduction || 0).toFixed(2)}
      </td>
      <DeductionCells deduction={deductions?.missPunchOut} />
      <DeductionCells deduction={deductions?.lessLoginHours} />
    </>
  );
}
