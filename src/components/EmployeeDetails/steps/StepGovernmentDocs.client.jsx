"use client";

import React from "react";
import FileInput from "../FileInput.client";

export default function StepGovernmentDocs({ data, onChange }) {
  return (
    <div className="step-personal">
      <label>
        Aadhaar Number<span className="required">*</span>
        <input
          type="text"
          name="aadhaar_number"
          value={data.aadhaar_number || ""}
          onChange={(e) => onChange("aadhaar_number", e.target.value)}
          pattern="^\d{12}$"
          title="Enter exactly 12 digits"
          required
        />
      </label>
      <FileInput
        name="aadhaar_doc"
        label="Aadhaar Copy"
        accept=".pdf,image/*"
        required
        existingUrl={data.aadhaar_doc_url}
        onChange={onChange}
      />

      <label>
        PAN Number<span className="required">*</span>
        <input
          type="text"
          name="pan_number"
          value={data.pan_number || ""}
          onChange={(e) => onChange("pan_number", e.target.value)}
          pattern="^[A-Z]{5}[0-9]{4}[A-Z]$"
          title="Format: ABCDE1234F"
          required
        />
      </label>
      <FileInput
        name="pan_doc"
        label="PAN Copy"
        accept=".pdf,image/*"
        required
        existingUrl={data.pan_doc_url}
        onChange={onChange}
      />

      <label>
        Passport Number
        <input
          type="text"
          name="passport_number"
          value={data.passport_number || ""}
          onChange={(e) => onChange("passport_number", e.target.value)}
          pattern="^[A-Z][0-9]{7}$"
          title="1 letter followed by 7 digits"
        />
      </label>
      <FileInput
        name="passport_doc"
        label="Passport Copy"
        accept=".pdf,image/*"
        existingUrl={data.passport_doc_url}
        onChange={onChange}
      />

      <label>
        Driving License
        <input
          type="text"
          name="driving_license_number"
          value={data.driving_license_number || ""}
          onChange={(e) => onChange("driving_license_number", e.target.value)}
        />
      </label>
      <FileInput
        name="driving_license_doc"
        label="Driving License Copy"
        accept=".pdf,image/*"
        existingUrl={data.driving_license_doc_url}
        onChange={onChange}
      />

      <label>
        Voter ID
        <input
          type="text"
          name="voter_id"
          value={data.voter_id || ""}
          onChange={(e) => onChange("voter_id", e.target.value)}
          pattern="^[A-Z]{3}[0-9]{7}$"
          title="3 letters followed by 7 digits"
        />
      </label>
      <FileInput
        name="voter_id_doc"
        label="Voter ID Copy"
        accept=".pdf,image/*"
        existingUrl={data.voter_id_doc_url}
        onChange={onChange}
      />

      <label>
        UAN (Universal Account Number)
        <input
          type="text"
          name="uan_number"
          value={data.uan_number || ""}
          onChange={(e) => onChange("uan_number", e.target.value)}
          pattern="^[0-9]{12}$"
          title="Enter 12 digit UAN"
        />
      </label>

      <label>
        PF Number
        <input
          type="text"
          name="pf_number"
          value={data.pf_number || ""}
          onChange={(e) => onChange("pf_number", e.target.value)}
          pattern="^[A-Z0-9\/\-]+$"
          title="Enter valid PF number"
        />
      </label>

      <label>
        ESI Number
        <input
          type="text"
          name="esi_number"
          value={data.esi_number || ""}
          onChange={(e) => onChange("esi_number", e.target.value)}
          pattern="^[0-9]{10}$"
          title="Enter 10 digit ESI number"
        />
      </label>
    </div>
  );
}
