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

export function getAttendanceDeductionExportValues(deductions = {}) {
  const amount = getAttendanceDeductionAmounts(deductions);
  const formatCount = (deduction) =>
    `${Number(deduction?.eligibleCount ?? deduction?.count ?? 0)} (${Number(
      deduction?.count || 0,
    )})`;
  return [
    formatCount(deductions.lateLogin),
    amount.lateLogin,
    formatCount(deductions.missPunchOut),
    amount.missPunchOut,
    formatCount(deductions.lessLoginHours),
    amount.lessLoginHours,
  ];
}

function DeductionCells({ deduction }) {
  const totalCount = Number(deduction?.count || 0);
  const eligibleCount = Number(deduction?.eligibleCount ?? totalCount);

  return (
    <>
      <td className="sd-table-cell sd-align-right sd-deduction">
        {eligibleCount} ({totalCount})
      </td>
      <td className="sd-table-cell sd-align-right sd-deduction">
        ₹{getAmount(deduction).toFixed(2)}
      </td>
    </>
  );
}

export default function AttendanceDeductionCells({ deductions }) {
  return (
    <>
      <DeductionCells deduction={deductions?.lateLogin} />
      <DeductionCells deduction={deductions?.missPunchOut} />
      <DeductionCells deduction={deductions?.lessLoginHours} />
    </>
  );
}
