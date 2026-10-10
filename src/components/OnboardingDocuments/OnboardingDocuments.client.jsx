"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./onboarding-documents.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const DOCUMENTS = [
  {
    type: "PROFILE_PHOTO",
    label: "Recent passport-size photograph",
    required: true,
    accept: ".jpg,.jpeg,.png,.webp",
    multiple: false,
  },
  {
    type: "PAN_CARD",
    label: "PAN card",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    multiple: false,
  },
  {
    type: "ADDRESS_PROOF",
    label: "Government-issued identity or address proof",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    multiple: false,
  },
  {
    type: "BANK_PROOF",
    label: "Bank proof (cancelled cheque or passbook page)",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    multiple: false,
  },
  {
    type: "EDUCATION_CERTIFICATE",
    label: "Education certificates and marksheets",
    required: true,
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    multiple: true,
  },
  {
    type: "PREVIOUS_EMPLOYMENT_PROOF",
    label: "Previous-employment or relieving documents (if applicable)",
    required: false,
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    multiple: true,
  },
  {
    type: "SALARY_SLIPS",
    label: "Recent salary slips (if applicable)",
    required: false,
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    multiple: true,
  },
  {
    type: "OTHER",
    label: "Other documents requested by HR (optional)",
    required: false,
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
    multiple: true,
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 20;

export default function OnboardingDocumentsPage() {
  const [orgId, setOrgId] = useState("");
  const [token, setToken] = useState("");
  const [candidate, setCandidate] = useState(null);
  const [filesByType, setFilesByType] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const currentOrgId = params.get("orgId") || "";
        const currentToken = params.get("token") || "";

        if (!currentOrgId || !currentToken) {
          throw new Error("The onboarding link is invalid.");
        }

        setOrgId(currentOrgId);
        setToken(currentToken);

        const response = await axios.get(
          `${BACKEND_URL}/recruitment/public/onboarding/${encodeURIComponent(
            currentOrgId,
          )}/${encodeURIComponent(currentToken)}`,
          { withCredentials: true },
        );

        setCandidate(response.data?.data || null);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to open the onboarding form. Please contact HR.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, []);

  const handleFilesChange = (type, fileList) => {
    setFilesByType((previous) => ({
      ...previous,
      [type]: Array.from(fileList || []),
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const missingRequired = DOCUMENTS.filter(
      (item) => item.required && !(filesByType[item.type] || []).length,
    );

    if (missingRequired.length) {
      setError(
        `Please upload the required documents: ${missingRequired
          .map((item) => item.label)
          .join(", ")}.`,
      );
      return;
    }

    const selectedFiles = DOCUMENTS.flatMap((item) =>
      (filesByType[item.type] || []).map((file) => ({
        type: item.type,
        file,
      })),
    );

    if (!selectedFiles.length) {
      setError("Please select your required documents.");
      return;
    }

    if (selectedFiles.length > MAX_FILES) {
      setError(`You can submit up to ${MAX_FILES} files.`);
      return;
    }

    const oversizedFile = selectedFiles.find(
      (item) => item.file.size > MAX_FILE_SIZE,
    );

    if (oversizedFile) {
      setError("Each file must be 10 MB or smaller.");
      return;
    }

    const formData = new FormData();
    const documentTypes = [];

    selectedFiles.forEach(({ type, file }) => {
      formData.append("documents", file);
      documentTypes.push(type);
    });

    formData.append("documentTypes", JSON.stringify(documentTypes));

    setSubmitting(true);

    try {
      await axios.post(
        `${BACKEND_URL}/recruitment/public/onboarding/${encodeURIComponent(
          orgId,
        )}/${encodeURIComponent(token)}`,
        formData,
        { withCredentials: true },
      );

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Your documents could not be submitted. Please contact HR.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="onboarding-page">
        <div className="onboarding-card">Loading secure onboarding form...</div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="onboarding-page">
        <section className="onboarding-card onboarding-success">
          <div className="onboarding-success-icon">✓</div>
          <p className="onboarding-eyebrow">SUBMISSION COMPLETE</p>
          <h1>Thank you, {candidate?.name || "Candidate"}.</h1>
          <p>
            Your onboarding documents have been submitted successfully. Our HR
            team will review your submission and contact you if anything further
            is required.
          </p>
          <p className="onboarding-muted">You may now close this page.</p>
        </section>
      </main>
    );
  }

  if (error && !candidate) {
    return (
      <main className="onboarding-page">
        <section className="onboarding-card">
          <h1>Onboarding link unavailable</h1>
          <p className="onboarding-error">{error}</p>
          <p className="onboarding-muted">
            Please contact your HR team to request assistance or a new link.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <header className="onboarding-header">
          <p className="onboarding-eyebrow">PEOPLE & CULTURE</p>
          <h1>Onboarding Document Submission</h1>
          <p>
            Please upload clear and readable copies of the documents below to
            help us complete your onboarding records.
          </p>
        </header>

        <div className="onboarding-candidate">
          <div>
            <span>Candidate</span>
            <strong>{candidate?.name || "Candidate"}</strong>
          </div>
          <div>
            <span>Position</span>
            <strong>{candidate?.applied_position || "—"}</strong>
          </div>
        </div>

        <div className="onboarding-notice">
          Files must be PDF or image files, up to 10 MB each. Do not upload
          passwords, PINs, or banking login details.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="onboarding-document-list">
            {DOCUMENTS.map((item, index) => (
              <div className="onboarding-document-item" key={item.type}>
                <div className="onboarding-document-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="onboarding-document-content">
                  <label htmlFor={`document-${item.type}`}>
                    {item.label}
                    {item.required && (
                      <span className="onboarding-required"> Required</span>
                    )}
                  </label>

                  <input
                    id={`document-${item.type}`}
                    type="file"
                    accept={item.accept}
                    multiple={item.multiple}
                    required={item.required}
                    onChange={(event) =>
                      handleFilesChange(item.type, event.target.files)
                    }
                  />

                  {!!filesByType[item.type]?.length && (
                    <p className="onboarding-file-count">
                      {filesByType[item.type].length} file(s) selected
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="onboarding-error">{error}</p>}

          <button
            type="submit"
            className="onboarding-submit"
            disabled={submitting}
          >
            {submitting ? "Submitting documents..." : "Submit Documents"}
          </button>

          <p className="onboarding-footer-note">
            Your submission will be shared with the organisation's authorised HR
            team for onboarding purposes.
          </p>
        </form>
      </section>
    </main>
  );
}
