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
  return [
    Number(deductions.lateLogin?.count || 0),
    amount.lateLogin,
    Number(deductions.missPunchOut?.count || 0),
    amount.missPunchOut,
    Number(deductions.lessLoginHours?.count || 0),
    amount.lessLoginHours,
  ];
}

function DeductionCells({ deduction }) {
  return (
    <>
      <td className="sd-table-cell sd-align-right sd-deduction">
        {Number(deduction?.count || 0)}
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
