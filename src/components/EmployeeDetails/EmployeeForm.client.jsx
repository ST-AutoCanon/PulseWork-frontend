"use client";

import React, { useRef, useState } from "react";
import { useAuth } from "../../context/AuthProvider.client";
import StepPersonal from "./steps/StepPersonal.client";
import StepGovernmentDocs from "./steps/StepGovernmentDocs.client";
import StepEducation from "./steps/StepEducation.client";
import StepProfessional from "./steps/StepProfessional.client";
import StepBankDetails from "./steps/StepBankDetails.client";
import StepInsurance from "./steps/StepFamilyDetails.client";

const STEPS = [
  "personal",
  "government docs",
  "education",
  "professional",
  "bank details",
  "family details",
];

export default function EmployeeForm({
  initialData = {},
  onSubmit,
  onCancel,
  departments = [],
}) {
  const { user } = useAuth();
  const meId = user?.employeeId ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");

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
    // personal
    first_name: "",
    last_name: "",
    dob: null,
    email: "",
    alternate_email: "",
    phone_number: "",
    alternate_number: "",
    gender: "",
    blood_group: "",
    emergency_name: "",
    emergency_number: "",
    address: "",
    photo: null,
    // government
    aadhaar_number: "",
    aadhaar_doc: null,
    pan_number: "",
    pan_doc: null,
    passport_number: "",
    passport_doc: null,
    driving_license_number: "",
    driving_license_doc: null,
    voter_id: "",
    voter_id_doc: null,
    uan_number: "",
    pf_number: "",
    esi_number: "",
    // education
    tenth_institution: "",
    tenth_year: "",
    tenth_board: "",
    tenth_score: "",
    tenth_cert: sanitizedInitialData.tenth_cert,
    twelfth_institution: "",
    twelfth_year: "",
    twelfth_board: "",
    twelfth_score: "",
    twelfth_cert: sanitizedInitialData.twelfth_cert,
    ug_institution: "",
    ug_year: "",
    ug_board: "",
    ug_score: "",
    ug_cert: sanitizedInitialData.ug_cert,
    pg_institution: "",
    pg_year: "",
    pg_board: "",
    pg_score: "",
    pg_cert: sanitizedInitialData.pg_cert,
    additional_certs: sanitizedInitialData.additional_certs,
    // professional
    domain: "",
    employee_type: "",
    joining_date: null,
    role: "",
    department_id: "",
    position: "",
    supervisor_id: "",
    salary: "",
    experience: sanitizedInitialData.experience,
    other_docs: sanitizedInitialData.other_docs,
    resume: null,
    // bank
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch_name: "",
    // family
    father_name: "",
    father_dob: null,
    father_gov_doc: null,
    mother_name: "",
    mother_dob: null,
    mother_gov_doc: null,
    marital_status: "",
    marriage_date: null,
    spouse_name: "",
    spouse_dob: null,
    spouse_gov_doc: null,
    child1_name: "",
    child1_dob: null,
    child1_gov_doc: null,
    child2_name: "",
    child2_dob: null,
    child2_gov_doc: null,
    child3_name: "",
    child3_dob: null,
    child3_gov_doc: null,
    ...sanitizedInitialData,
  });

  const [loading, setLoading] = useState(false);
  const formRef = useRef();

  const handleChange = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const disableRequiredTemporarily = (fn) => {
    const form = formRef.current;
    if (!form) return fn();

    const requiredEls = Array.from(form.querySelectorAll("[required]"));
    requiredEls.forEach((el) => {
      el.dataset._wasRequired = "1";
      el.removeAttribute("required");
    });

    try {
      return fn();
    } finally {
      requiredEls.forEach((el) => {
        if (el.dataset && el.dataset._wasRequired) {
          el.setAttribute("required", "");
          delete el.dataset._wasRequired;
        }
      });
    }
  };

  const validateStep = () => {
    return disableRequiredTemporarily(() => {
      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return false;
      }
      return true;
    });
  };

  const next = () => {
    setError("");
    if (!validateStep()) return;
    setCurrentStep((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const back = () => setCurrentStep((i) => Math.max(i - 1, 0));

  const goToStep = (idx) => {
    if (idx === currentStep) return;

    if (idx < currentStep) {
      setError("");
      setCurrentStep(idx);
      return;
    }

    setError("");
    if (!validateStep()) return;
    setCurrentStep(idx);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError("");

    try {
      const fd = new FormData();

      const isFile = (v) => v instanceof File;
      const hasFileIn = (val) => {
        if (!val) return false;
        if (Array.isArray(val)) return val.some(isFile);
        return isFile(val);
      };

      function appendUrlArray(fd, key, maybeArr) {
        if (!maybeArr) return;
        if (Array.isArray(maybeArr)) {
          const urls = maybeArr.filter((v) => typeof v === "string");
          if (urls.length) fd.append(key, JSON.stringify(urls));
          return;
        }
        const s = String(maybeArr).trim();
        if (!s) return;
        if (s.startsWith("[") && s.endsWith("]")) {
          try {
            JSON.parse(s);
            fd.append(key, s);
            return;
          } catch {}
        }
        if (s.includes(",")) {
          const parts = s
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
          if (parts.length) fd.append(key, JSON.stringify(parts));
          return;
        }
        fd.append(key, JSON.stringify([s]));
      }

      const skipKeys = new Set([
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
        "resume",
      ]);

      Object.entries(formData).forEach(([key, val]) => {
        if (skipKeys.has(key)) return;
        if (val !== undefined && val !== null) fd.append(key, val);
      });

      [
        "other_docs",
        "tenth_cert",
        "twelfth_cert",
        "ug_cert",
        "pg_cert",
      ].forEach((field) => {
        const arr = formData[field];
        if (!Array.isArray(arr)) return;
        for (const f of arr) {
          if (isFile(f)) fd.append(field, f, f.name);
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
        if (!arr) return;
        if (Array.isArray(arr)) {
          for (const f of arr) {
            if (isFile(f)) fd.append(field, f, f.name);
          }
        } else if (isFile(arr)) {
          fd.append(field, arr, arr.name);
        }
      });

      if (isFile(formData.resume)) {
        fd.append("resume", formData.resume, formData.resume.name);
      }

      (formData.experience || []).forEach((exp, idx) => {
        fd.append(`experience[${idx}][company]`, exp.company ?? "");
        fd.append(`experience[${idx}][role]`, exp.role ?? "");
        fd.append(`experience[${idx}][start_date]`, exp.start_date ?? "");
        fd.append(`experience[${idx}][end_date]`, exp.end_date ?? "");

        if (Array.isArray(exp.doc) && exp.doc.some(isFile)) {
          for (const f of exp.doc) {
            if (isFile(f)) fd.append(`experience[${idx}][doc]`, f, f.name);
          }
        } else if (isFile(exp.doc)) {
          fd.append(`experience[${idx}][doc]`, exp.doc, exp.doc.name);
        } else {
          if (Array.isArray(exp.doc)) {
            const urlOnly = exp.doc.filter((x) => typeof x === "string");
            if (urlOnly.length)
              fd.append(
                `experience[${idx}][doc_urls]`,
                JSON.stringify(urlOnly)
              );
          } else if (typeof exp.doc === "string" && exp.doc.trim()) {
            fd.append(
              `experience[${idx}][doc_urls]`,
              JSON.stringify([exp.doc.trim()])
            );
          } else if (Array.isArray(exp.files)) {
            const urlOnly = exp.files.filter((x) => typeof x === "string");
            if (urlOnly.length)
              fd.append(
                `experience[${idx}][doc_urls]`,
                JSON.stringify(urlOnly)
              );
          }
        }
      });

      (formData.additional_certs || []).forEach((cert, idx) => {
        fd.append(`additional_certs[${idx}][name]`, cert.name ?? "");
        fd.append(`additional_certs[${idx}][year]`, cert.year ?? "");
        fd.append(
          `additional_certs[${idx}][institution]`,
          cert.institution ?? ""
        );

        if (Array.isArray(cert.file) && cert.file.some(isFile)) {
          for (const f of cert.file) {
            if (isFile(f))
              fd.append(`additional_certs[${idx}][file]`, f, f.name);
          }
        } else if (isFile(cert.file)) {
          fd.append(
            `additional_certs[${idx}][file]`,
            cert.file,
            cert.file.name
          );
        } else {
          if (
            Array.isArray(cert.files) &&
            cert.files.some((x) => typeof x === "string")
          ) {
            fd.append(
              `additional_certs[${idx}][file_urls]`,
              JSON.stringify(cert.files.filter((x) => typeof x === "string"))
            );
          } else if (
            Array.isArray(cert.file) &&
            cert.file.every((x) => typeof x === "string")
          ) {
            fd.append(
              `additional_certs[${idx}][file_urls]`,
              JSON.stringify(cert.file)
            );
          } else if (typeof cert.file === "string" && cert.file.trim()) {
            fd.append(
              `additional_certs[${idx}][file_urls]`,
              JSON.stringify([cert.file.trim()])
            );
          } else if (Array.isArray(cert.file_urls)) {
            fd.append(
              `additional_certs[${idx}][file_urls]`,
              JSON.stringify(cert.file_urls)
            );
          } else if (
            typeof cert.file_urls === "string" &&
            cert.file_urls.trim()
          ) {
            appendUrlArray(
              fd,
              `additional_certs[${idx}][file_urls]`,
              cert.file_urls
            );
          }
        }
      });

      if (!hasFileIn(formData.tenth_cert))
        appendUrlArray(fd, "tenth_cert_url", formData.tenth_cert);
      if (!hasFileIn(formData.twelfth_cert))
        appendUrlArray(fd, "twelfth_cert_url", formData.twelfth_cert);
      if (!hasFileIn(formData.ug_cert))
        appendUrlArray(fd, "ug_cert_url", formData.ug_cert);
      if (!hasFileIn(formData.pg_cert))
        appendUrlArray(fd, "pg_cert_url", formData.pg_cert);

      if (!hasFileIn(formData.other_docs))
        appendUrlArray(
          fd,
          "other_docs_urls",
          formData.other_docs || formData.other_docs_urls
        );

      if (!isFile(formData.resume) && formData.resume) {
        appendUrlArray(fd, "resume_url", formData.resume);
      } else if (!formData.resume && formData.resume_url) {
        appendUrlArray(fd, "resume_url", formData.resume_url);
      }

      const familyPairs = [
        ["father_gov_doc", "father_gov_doc_url"],
        ["mother_gov_doc", "mother_gov_doc_url"],
        ["spouse_gov_doc", "spouse_gov_doc_url"],
        ["child1_gov_doc", "child1_gov_doc_url"],
        ["child2_gov_doc", "child2_gov_doc_url"],
        ["child3_gov_doc", "child3_gov_doc_url"],
      ];
      for (const [fileField, urlField] of familyPairs) {
        const maybeFiles = formData[fileField];
        const maybeUrls = formData[urlField] || formData[fileField + "_url"];
        if (!hasFileIn(maybeFiles)) {
          appendUrlArray(fd, urlField, maybeUrls || maybeFiles);
        }
      }

      // call parent onSubmit (which should handle API headers); pass FormData
      await onSubmit(fd);

      // If supervisor changed for an existing employee, call supervisor assign endpoint
      if (
        initialData.employee_id &&
        initialData.supervisor_id !== formData.supervisor_id
      ) {
        const today = new Date().toISOString().slice(0, 10);
        const assignUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/supervisor/assign`;

        try {
          const headers = {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          };
          if (meId) headers["x-employee-id"] = meId;
          if (orgId) headers["x-org-id"] = orgId;

          const r = await fetch(assignUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({
              employeeId: initialData.employee_id,
              supervisorId: formData.supervisor_id,
              startDate: today,
            }),
          });

          // optional: log if assign failed
          try {
            const json = await r.json();
            if (!r.ok || (json && json.success === false)) {
              console.error("Supervisor assign failed", r.status, json);
            }
          } catch (parseErr) {
            if (!r.ok)
              console.error("Supervisor assign returned non-JSON", r.status);
          }
        } catch (e) {
          console.error("Supervisor assign request failed", e);
        }
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
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
    <StepProfessional
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
    <StepInsurance
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
