"use client";

import React, { useRef, useState } from "react";
import StepPersonal from "../EmployeeDetails/steps/StepPersonal.client";
import StepGovernmentDocs from "../EmployeeDetails/steps/StepGovernmentDocs.client";
import StepEducation from "../EmployeeDetails/steps/StepEducation.client";
import StepBankDetails from "../EmployeeDetails/steps/StepBankDetails.client";
import StepFamilyDetails from "../EmployeeDetails/steps/StepFamilyDetails.client";
import StepProfessionalEmployee from "./StepProfessionalEmployee.client";
import "../EmployeeDetails/EmployeeDetails.css";
import { useAuth } from "../../context/AuthProvider.client"; // adjust path if your auth provider is elsewhere

const STEPS = [
  "personal",
  "government docs",
  "education",
  "professional",
  "bank details",
  "family details",
];

export default function EmployeeFormEmployee({
  initialData = {},
  onSubmit,
  onCancel,
  departments = [],
}) {
  const { user } = useAuth(); // provide x-employee-id if needed
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const formRef = useRef();

  const sanitizedInitialData = {
    ...initialData,
    experience: Array.isArray(initialData.experience)
      ? initialData.experience
      : [],
    other_docs: Array.isArray(initialData.other_docs)
      ? initialData.other_docs
      : [],
    additional_certs: Array.isArray(initialData.additional_certs)
      ? initialData.additional_certs
      : [],
    tenth_cert: Array.isArray(initialData.tenth_cert)
      ? initialData.tenth_cert
      : [],
    twelfth_cert: Array.isArray(initialData.twelfth_cert)
      ? initialData.twelfth_cert
      : [],
    ug_cert: Array.isArray(initialData.ug_cert) ? initialData.ug_cert : [],
    pg_cert: Array.isArray(initialData.pg_cert) ? initialData.pg_cert : [],
  };

  const [formData, setFormData] = useState({
    ...sanitizedInitialData,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const validateStep = () => {
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return false;
    }
    return true;
  };

  const next = () => {
    setError("");
    if (!validateStep()) return;
    setCurrentStep((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const back = () => setCurrentStep((i) => Math.max(i - 1, 0));

  const goToStep = (targetIndex) => {
    setError("");
    if (targetIndex === currentStep) return;
    // allow going backwards without validation
    if (targetIndex < currentStep) {
      setCurrentStep(targetIndex);
      return;
    }
    // going forward: validate current step first (same as Next)
    if (!validateStep()) return;
    setCurrentStep(targetIndex);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError("");

    try {
      const fd = new FormData();

      Object.entries(formData).forEach(([key, val]) => {
        if (
          [
            "experience",
            "other_docs",
            "additional_certs",
            "tenth_cert",
            "twelfth_cert",
            "ug_cert",
            "pg_cert",
            "father_gov_doc",
            "mother_gov_doc",
            "spouse_gov_doc",
            "child1_gov_doc",
            "child2_gov_doc",
            "child3_gov_doc",
          ].includes(key)
        )
          return;
        if (val != null && val !== undefined) fd.append(key, val);
      });

      [
        "other_docs",
        "tenth_cert",
        "twelfth_cert",
        "ug_cert",
        "pg_cert",
      ].forEach((field) => {
        const arr = formData[field];
        if (Array.isArray(arr)) {
          arr.forEach((file) => {
            if (file instanceof File) fd.append(field, file, file.name);
          });
        }
      });

      (formData.experience || []).forEach((exp, idx) => {
        fd.append(`experience[${idx}][company]`, exp.company || "");
        fd.append(`experience[${idx}][role]`, exp.role || "");
        fd.append(`experience[${idx}][start_date]`, exp.start_date || "");
        fd.append(`experience[${idx}][end_date]`, exp.end_date || "");
        if (Array.isArray(exp.doc)) {
          exp.doc.forEach((f) => {
            if (f instanceof File)
              fd.append(`experience[${idx}][doc]`, f, f.name);
          });
        } else if (exp.doc instanceof File) {
          fd.append(`experience[${idx}][doc]`, exp.doc, exp.doc.name);
        }
      });

      (formData.additional_certs || []).forEach((cert, idx) => {
        fd.append(`additional_certs[${idx}][name]`, cert.name || "");
        fd.append(`additional_certs[${idx}][year]`, cert.year || "");
        fd.append(
          `additional_certs[${idx}][institution]`,
          cert.institution || ""
        );
        if (Array.isArray(cert.file)) {
          cert.file.forEach((f) => {
            if (f instanceof File)
              fd.append(`additional_certs[${idx}][file]`, f, f.name);
          });
        } else if (cert.file instanceof File) {
          fd.append(
            `additional_certs[${idx}][file]`,
            cert.file,
            cert.file.name
          );
        }
      });

      [
        "father_gov_doc",
        "mother_gov_doc",
        "spouse_gov_doc",
        "child1_gov_doc",
        "child2_gov_doc",
        "child3_gov_doc",
      ].forEach((field) => {
        const arr = formData[field];
        if (Array.isArray(arr)) {
          arr.forEach((f) => {
            if (f instanceof File) fd.append(field, f, f.name);
          });
        }
      });

      if (formData.resume instanceof File)
        fd.append("resume", formData.resume, formData.resume.name);

      await onSubmit(fd);

      const initialEmpId = initialData.employee_id;
      if (
        initialEmpId &&
        initialData.supervisor_id !== formData.supervisor_id
      ) {
        try {
          const employeeId = initialData.employee_id;
          const today = new Date().toISOString().slice(0, 10);

          // Use NEXT_PUBLIC env var names in Next.js apps
          const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
          const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

          const headers = {
            "Content-Type": "application/json",
            "x-api-key": API_KEY ?? "",
            // include x-employee-id from auth if available
            ...(user?.employeeId ? { "x-employee-id": user.employeeId } : {}),
          };

          await fetch(`${BACKEND}/supervisor/assign`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              employeeId,
              supervisorId: formData.supervisor_id,
              startDate: today,
            }),
          });
        } catch (err) {
          console.error("Supervisor assign failed:", err);
        }
      }
    } catch (err) {
      console.error("EmployeeFormEmployee submit error:", err);
      setError(err.message || "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const stepsComponents = [
    <StepPersonal key="personal" data={formData} onChange={handleChange} />,
    <StepGovernmentDocs
      key="government_docs"
      data={formData}
      onChange={handleChange}
    />,
    <StepEducation key="education" data={formData} onChange={handleChange} />,
    <StepProfessionalEmployee
      key="professional"
      data={formData}
      onChange={handleChange}
      departments={departments}
    />,
    <StepBankDetails
      key="bank_details"
      data={formData}
      onChange={handleChange}
    />,
    <StepFamilyDetails
      key="family_details"
      data={formData}
      onChange={handleChange}
    />,
  ];

  return (
    <div className="employee-form">
      <div className="steps-indicator">
        {STEPS.map((lbl, i) => {
          const isActive = i === currentStep;
          return (
            <div
              key={lbl}
              role="button"
              tabIndex={0}
              aria-current={isActive ? "step" : undefined}
              className={isActive ? "active " : ""}
              onClick={() => goToStep(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToStep(i);
                }
              }}
            >
              {lbl}
            </div>
          );
        })}
      </div>

      <form ref={formRef} noValidate className="ed-form">
        {stepsComponents.map((Comp, idx) => (
          <fieldset
            key={idx}
            disabled={idx !== currentStep}
            style={{ display: idx === currentStep ? "block" : "none" }}
          >
            {Comp}
          </fieldset>
        ))}
      </form>

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        {currentStep > 0 && (
          <button type="button" onClick={back}>
            Back
          </button>
        )}
        {currentStep < STEPS.length - 1 && (
          <button type="button" onClick={next}>
            Next
          </button>
        )}
        {currentStep === STEPS.length - 1 && (
          <button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}
