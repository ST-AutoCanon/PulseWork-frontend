"use client";

import React from "react";
import FileInput from "../FileInput.client";

export default function StepFamilyDetails({ data, onChange }) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="step-personal">
      <label>
        Father’s Name
        <input
          type="text"
          name="father_name"
          value={data.father_name || ""}
          onChange={(e) => onChange("father_name", e.target.value)}
        />
      </label>
      <label>
        Father's Date of Birth
        <input
          type="date"
          name="father_dob"
          value={data.father_dob ? data.father_dob.split("T")[0] : ""}
          onChange={(e) => onChange("father_dob", e.target.value)}
        />
      </label>
      <FileInput
        name="father_gov_doc"
        label="Father's Government ID"
        accept=".pdf,image/*"
        multiple
        existingUrl={data.father_gov_doc_url}
        onChange={onChange}
      />

      <label>
        Mother’s Name
        <input
          type="text"
          name="mother_name"
          value={data.mother_name || ""}
          onChange={(e) => onChange("mother_name", e.target.value)}
        />
      </label>
      <label>
        Mother's Date of Birth
        <input
          type="date"
          name="mother_dob"
          value={data.mother_dob ? data.mother_dob.split("T")[0] : ""}
          onChange={(e) => onChange("mother_dob", e.target.value)}
        />
      </label>
      <FileInput
        name="mother_gov_doc"
        label="Mother's Government ID"
        accept=".pdf,image/*"
        multiple
        existingUrl={data.mother_gov_doc_url}
        onChange={onChange}
      />

      <label>
        Marital Status<span className="required">*</span>
        <select
          name="marital_status"
          value={data.marital_status || ""}
          onChange={(e) => onChange("marital_status", e.target.value)}
          required
        >
          <option value="">Select</option>
          <option>Married</option>
          <option>Unmarried</option>
        </select>
      </label>

      {data.marital_status === "Married" && (
        <>
          <label>
            Marriage Date<span className="required">*</span>
            <input
              type="date"
              name="marriage_date"
              max={today}
              value={data.marriage_date ? data.marriage_date.split("T")[0] : ""}
              onChange={(e) => onChange("marriage_date", e.target.value)}
              required
            />
          </label>
          <label>
            Spouse Name<span className="required">*</span>
            <input
              type="text"
              name="spouse_name"
              value={data.spouse_name || ""}
              onChange={(e) => onChange("spouse_name", e.target.value)}
              title="Must start with a capital letter and contain only letters"
              required
            />
          </label>
          <label>
            Spouse Date of Birth<span className="required">*</span>
            <input
              type="date"
              name="spouse_dob"
              value={data.spouse_dob ? data.spouse_dob.split("T")[0] : ""}
              onChange={(e) => onChange("spouse_dob", e.target.value)}
              required
            />
          </label>
          <FileInput
            name="spouse_gov_doc"
            label="Spouse Government ID"
            accept=".pdf,image/*"
            multiple
            existingUrl={data.spouse_gov_doc_url}
            onChange={onChange}
            required
          />

          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <label>
                Child {i} Name
                <input
                  type="text"
                  name={`child${i}_name`}
                  value={data[`child${i}_name`] || ""}
                  onChange={(e) => onChange(`child${i}_name`, e.target.value)}
                  title="Must start with a capital letter and contain only letters"
                />
              </label>
              <label>
                Child {i} Date of Birth
                <input
                  type="date"
                  name={`child${i}_dob`}
                  max={today}
                  value={
                    data[`child${i}_dob`]
                      ? data[`child${i}_dob`].split("T")[0]
                      : ""
                  }
                  onChange={(e) => onChange(`child${i}_dob`, e.target.value)}
                />
              </label>
              <FileInput
                name={`child${i}_gov_doc`}
                label={`Child ${i} Government ID`}
                accept=".pdf,image/*"
                multiple
                existingUrl={data[`child${i}_gov_doc_url`]}
                onChange={onChange}
              />
            </React.Fragment>
          ))}
        </>
      )}
    </div>
  );
}
