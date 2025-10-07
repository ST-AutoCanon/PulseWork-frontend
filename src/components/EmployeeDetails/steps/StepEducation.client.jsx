"use client";

import React from "react";
import FileInput from "../FileInput.client";
import { MdOutlineCancel } from "react-icons/md";

export default function StepEducation({ data, onChange }) {
  const yearNow = new Date().getFullYear();
  const certs = Array.isArray(data.additional_certs)
    ? data.additional_certs
    : [];

  const updateCert = (idx, field, value) => {
    const newList = [...certs];
    newList[idx] = { ...newList[idx], [field]: value };
    onChange("additional_certs", newList);
  };

  const addCert = () => {
    onChange("additional_certs", [
      ...certs,
      { name: "", year: "", institution: "", file: null },
    ]);
  };

  const removeCert = (idx) => {
    const newList = certs.filter((_, i) => i !== idx);
    onChange("additional_certs", newList);
  };

  return (
    <div className="step-professional">
      <div className="step-education">
        {/* SSLC (10th) */}
        <label>
          SSLC(10th) Institution<span className="required">*</span>
          <input
            type="text"
            name="tenth_institution"
            value={data.tenth_institution || ""}
            onChange={(e) => onChange("tenth_institution", e.target.value)}
            required
          />
        </label>
        <label>
          SSLC(10th) Year<span className="required">*</span>
          <input
            type="number"
            name="tenth_year"
            min="1900"
            max={yearNow}
            value={data.tenth_year || ""}
            onChange={(e) => onChange("tenth_year", e.target.value)}
            required
          />
        </label>
        <label>
          SSLC(10th) Board<span className="required">*</span>
          <input
            type="text"
            name="tenth_board"
            value={data.tenth_board || ""}
            onChange={(e) => onChange("tenth_board", e.target.value)}
            required
          />
        </label>
        <label>
          SSLC(10th) Score (%)<span className="required">*</span>
          <input
            type="number"
            name="tenth_score"
            min="0"
            max="100"
            step="0.01"
            value={data.tenth_score || ""}
            onChange={(e) => onChange("tenth_score", e.target.value)}
            required
          />
        </label>

        <FileInput
          name="tenth_cert"
          label="SSLC(10th) Certificate"
          accept=".pdf,image/*"
          multiple
          required
          existingUrl={data.tenth_cert_url}
          onChange={onChange}
        />

        {/* PUC (12th) / Diploma */}
        <label>
          12th/Diploma Institution<span className="required">*</span>
          <input
            type="text"
            name="twelfth_institution"
            value={data.twelfth_institution || ""}
            onChange={(e) => onChange("twelfth_institution", e.target.value)}
            required
          />
        </label>
        <label>
          12th/Diploma Year<span className="required">*</span>
          <input
            type="number"
            name="twelfth_year"
            min="1900"
            max={yearNow}
            value={data.twelfth_year || ""}
            onChange={(e) => onChange("twelfth_year", e.target.value)}
            required
          />
        </label>
        <label>
          12th/Diploma Board<span className="required">*</span>
          <input
            type="text"
            name="twelfth_board"
            value={data.twelfth_board || ""}
            onChange={(e) => onChange("twelfth_board", e.target.value)}
            required
          />
        </label>
        <label>
          12th/Diploma Score (%)<span className="required">*</span>
          <input
            type="number"
            name="twelfth_score"
            min="0"
            max="100"
            step="0.01"
            value={data.twelfth_score || ""}
            onChange={(e) => onChange("twelfth_score", e.target.value)}
            required
          />
        </label>

        <FileInput
          name="twelfth_cert"
          label="12th/Diploma Certificate"
          accept=".pdf,image/*"
          multiple
          required
          existingUrl={data.twelfth_cert_url}
          onChange={onChange}
        />

        {/* Undergraduate */}
        <label>
          UG Institution
          <input
            type="text"
            name="ug_institution"
            value={data.ug_institution || ""}
            onChange={(e) => onChange("ug_institution", e.target.value)}
          />
        </label>
        <label>
          UG Year
          <input
            type="number"
            name="ug_year"
            min="1900"
            max={yearNow}
            value={data.ug_year || ""}
            onChange={(e) => onChange("ug_year", e.target.value)}
          />
        </label>
        <label>
          UG University
          <input
            type="text"
            name="ug_board"
            value={data.ug_board || ""}
            onChange={(e) => onChange("ug_board", e.target.value)}
          />
        </label>
        <label>
          UG Score (%)
          <input
            type="number"
            name="ug_score"
            min="0"
            max="100"
            step="0.01"
            value={data.ug_score || ""}
            onChange={(e) => onChange("ug_score", e.target.value)}
          />
        </label>

        <FileInput
          name="ug_cert"
          label="UG Certificate"
          accept=".pdf,image/*"
          multiple
          existingUrl={data.ug_cert_url}
          onChange={onChange}
        />

        {/* Postgraduate */}
        <label>
          PG Institution
          <input
            type="text"
            name="pg_institution"
            value={data.pg_institution || ""}
            onChange={(e) => onChange("pg_institution", e.target.value)}
          />
        </label>
        <label>
          PG Year
          <input
            type="number"
            name="pg_year"
            min="1900"
            max={yearNow}
            value={data.pg_year || ""}
            onChange={(e) => onChange("pg_year", e.target.value)}
          />
        </label>
        <label>
          PG University
          <input
            type="text"
            name="pg_board"
            value={data.pg_board || ""}
            onChange={(e) => onChange("pg_board", e.target.value)}
          />
        </label>
        <label>
          PG Score (%)
          <input
            type="number"
            name="pg_score"
            min="0"
            max="100"
            step="0.01"
            value={data.pg_score || ""}
            onChange={(e) => onChange("pg_score", e.target.value)}
          />
        </label>

        <FileInput
          name="pg_cert"
          label="PG Certificate"
          accept=".pdf,image/*"
          multiple
          existingUrl={data.pg_cert_url}
          onChange={onChange}
        />
      </div>

      <div className="edu-add-row">
        <button type="button" className="pj-next-btn" onClick={addCert}>
          + Add Certification
        </button>
      </div>

      <div className="exp-box">
        {certs.map((cert, idx) => (
          <div key={idx} className="st-pro2">
            <label>
              Certification Name
              <input
                type="text"
                value={cert.name}
                onChange={(e) => updateCert(idx, "name", e.target.value)}
                name={`additional_certs.${idx}.name`}
              />
            </label>
            <label>
              Year
              <input
                type="number"
                min="1900"
                max={yearNow}
                value={cert.year}
                onChange={(e) => updateCert(idx, "year", e.target.value)}
                name={`additional_certs.${idx}.year`}
              />
            </label>
            <label>
              Institution
              <input
                type="text"
                value={cert.institution}
                onChange={(e) => updateCert(idx, "institution", e.target.value)}
                name={`additional_certs.${idx}.institution`}
              />
            </label>
            <label>
              <FileInput
                name={`additional_certs[${idx}][file]`}
                label="Certificate Upload"
                accept=".pdf,image/*"
                multiple
                existingUrl={cert.file_url}
                onChange={(name, file) => updateCert(idx, "file", file)}
              />
            </label>
            <MdOutlineCancel
              className="remove-cert-btn"
              onClick={() => removeCert(idx)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
