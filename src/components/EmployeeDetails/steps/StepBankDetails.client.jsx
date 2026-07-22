"use client";

import React from "react";
import { useAuth } from "../../../context/AuthProvider.client";

const ACCOUNT_TYPES = ["Savings", "Current", "Salary", "Other"];

export default function StepBankDetails({ data, onChange }) {
  const { user } = useAuth();

  const canEditBankDetails = ["HR", "Admin"].includes(user?.role);
  return (
    <div className="step-bank">
      <label>
        Bank Name<span className="required">*</span>
        <input
          type="text"
          name="bank_name"
          value={data.bank_name || ""}
          onChange={(e) => onChange("bank_name", e.target.value)}
          disabled={!canEditBankDetails}
          required
        />
      </label>

      <label>
        Account Number<span className="required">*</span>
        <input
          type="text"
          name="account_number"
          value={data.account_number || ""}
          onChange={(e) => onChange("account_number", e.target.value)}
          disabled={!canEditBankDetails}
          required
        />
      </label>

      <label>
        IFSC Code<span className="required">*</span>
        <input
          type="text"
          name="ifsc_code"
          value={data.ifsc_code || ""}
          onChange={(e) => onChange("ifsc_code", e.target.value)}
          disabled={!canEditBankDetails}
          required
        />
      </label>

      <label>
        Branch<span className="required">*</span>
        <input
          type="text"
          name="branch_name"
          value={data.branch_name || ""}
          onChange={(e) => onChange("branch_name", e.target.value)}
          disabled={!canEditBankDetails}
          required
        />
      </label>
    </div>
  );
}
