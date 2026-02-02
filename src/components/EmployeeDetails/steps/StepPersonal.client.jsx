"use client";

import React from "react";
import FileInput from "../FileInput.client";

export default function StepPersonal({ data, onChange }) {
  const today = new Date().toISOString().split("T")[0];
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  const maxDob = eighteenYearsAgo.toISOString().split("T")[0];

  return (
    <div className="step-personal">
      <label>
        First Name<span className="required">*</span>
        <input
          type="text"
          name="first_name"
          value={data.first_name || ""}
          onChange={(e) => onChange("first_name", e.target.value)}
          pattern="^[A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)*$"
          title="Must start with a capital letter and contain only letters"
          required
        />
      </label>

      <label>
        Middle Name
        <input
          type="text"
          name="middle_name"
          value={data.middle_name || ""}
          onChange={(e) => onChange("middle_name", e.target.value)}
          pattern="^[A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)*$"
          title="Must start with a capital letter and contain only letters"
        />
      </label>

      <label>
        Last Name<span className="required">*</span>
        <input
          type="text"
          name="last_name"
          value={data.last_name || ""}
          onChange={(e) => onChange("last_name", e.target.value)}
          pattern="^[A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)*$"
          title="Must start with a capital letter and contain only letters"
          required
        />
      </label>

      <label>
        Date of Birth<span className="required">*</span>
        <input
          type="date"
          name="dob"
          max={maxDob}
          value={data.dob ? data.dob.split("T")[0] : ""}
          onChange={(e) => onChange("dob", e.target.value)}
          title={`You must be at least 18 years old (born on or before ${maxDob})`}
          required
        />
      </label>

      <label>
        Email<span className="required">*</span>
        <input
          type="email"
          name="email"
          value={data.email || ""}
          onChange={(e) => onChange("email", e.target.value)}
          required
        />
      </label>

      <label>
        Alternate Email
        <input
          type="email"
          name="alternate_email"
          value={data.alternate_email || ""}
          onChange={(e) => onChange("alternate_email", e.target.value)}
        />
      </label>

      <label>
        Mobile<span className="required">*</span>
        <input
          type="tel"
          name="phone_number"
          value={data.phone_number || ""}
          onChange={(e) => onChange("phone_number", e.target.value)}
          pattern="^[6-9]\d{9}$"
          title="10‑digit Indian mobile number starting with 6–9"
          required
        />
      </label>

      <label>
        Alternate Mobile
        <input
          type="tel"
          name="alternate_number"
          value={data.alternate_number || ""}
          onChange={(e) => onChange("alternate_number", e.target.value)}
          pattern="^[6-9]\d{9}$"
          title="10‑digit Indian mobile number starting with 6–9"
        />
      </label>

      <label>
        Gender<span className="required">*</span>
        <select
          name="gender"
          value={data.gender || ""}
          onChange={(e) => onChange("gender", e.target.value)}
          required
        >
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </label>

      <label>
        Blood Group
        <select
          name="blood_group"
          value={data.blood_group || ""}
          onChange={(e) => onChange("blood_group", e.target.value)}
        >
          <option value="">Select</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
      </label>

      <label>
        Emergency Contact Name<span className="required">*</span>
        <input
          type="text"
          name="emergency_name"
          value={data.emergency_name || ""}
          onChange={(e) => onChange("emergency_name", e.target.value)}
          required
        />
      </label>

      <label>
        Emergency Contact Number<span className="required">*</span>
        <input
          type="tel"
          name="emergency_number"
          value={data.emergency_number || ""}
          onChange={(e) => onChange("emergency_number", e.target.value)}
          pattern="^[6-9]\d{9}$"
          title="10‑digit Indian mobile number starting with 6–9"
          required
        />
      </label>

      <label>
        Address
        <textarea
          name="address"
          value={data.address || ""}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="123 Street, City, State, Country"
        />
      </label>

      <FileInput
        name="photo"
        label="Profile Photo"
        accept="image/*"
        existingUrl={data.photo_url}
        onChange={onChange}
      />
    </div>
  );
}
