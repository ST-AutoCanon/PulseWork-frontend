"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { MdOutlineCancel, MdOutlineRefresh } from "react-icons/md";
import "./RecruitmentFlow.css";
import { useAuth } from "../../context/AuthProvider.client";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  applied_position: "",
  department: "",
  skills: "",
  source: "",
  current_ctc: "",
  expected_ctc: "",
  notice_period: "",
  total_experience: "",
  status: "Applied",
  resume_url: "",
};

function openFileInNewTabWithHeaders(url, headers) {
  return fetch(url, {
    headers,
    credentials: "include",
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to open file");
      return res.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    });
}

export default function CandidateForm({
  onClose,
  onSuccess,
  initialData = null,
}) {
  const { user } = useAuth();
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
  const meId = user?.employeeId ?? user?.id ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const isEdit = !!initialData;

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [resumeFile, setResumeFile] = useState(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parseError, setParseError] = useState("");

  const headers = useMemo(() => {
    const h = { "x-api-key": API_KEY };
    if (meId) h["x-employee-id"] = meId;
    if (orgId) h["x-org-id"] = orgId;
    return h;
  }, [API_KEY, meId, orgId]);

  useEffect(() => {
    if (!initialData) return;

    setFormData({
      name: initialData.name || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      applied_position: initialData.applied_position || "",
      department: initialData.department || "",
      skills: initialData.skills || "",
      source: initialData.source || "",
      current_ctc: initialData.current_ctc ?? "",
      expected_ctc: initialData.expected_ctc ?? "",
      notice_period: initialData.notice_period || "",
      total_experience: initialData.total_experience || "",
      status: initialData.status || "Applied",
      resume_url: initialData.resume_url || "",
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResumeParse = async (file) => {
    if (!file) return;

    setParseLoading(true);
    setParseError("");
    setError("");

    try {
      const fd = new FormData();
      fd.append("resume", file);
      if (orgId) fd.append("orgId", orgId);

      const res = await axios.post(`${BASE_URL}/recruitment/parse-resume`, fd, {
        withCredentials: true,
        headers,
      });

      const parsed = res.data?.data || res.data || {};

      setFormData((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        email: parsed.email || prev.email,
        phone: parsed.phone || prev.phone,
        applied_position: parsed.applied_position || prev.applied_position,
        department: parsed.department || prev.department,
        skills: parsed.skills || prev.skills,
        source: parsed.source || prev.source || "Resume Upload",
        current_ctc: parsed.current_ctc ?? prev.current_ctc,
        expected_ctc: parsed.expected_ctc ?? prev.expected_ctc,
        notice_period: parsed.notice_period || prev.notice_period,
        total_experience: parsed.total_experience || prev.total_experience,
      }));
    } catch (err) {
      console.error("Resume parse error:", err);
      setParseError(
        err.response?.data?.message ||
          "Unable to parse resume. You can still fill the form manually.",
      );
    } finally {
      setParseLoading(false);
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0] || null;
    setResumeFile(file);

    if (file) {
      await handleResumeParse(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fd = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          fd.append(key, typeof value === "boolean" ? String(value) : value);
        }
      });

      if (resumeFile) fd.append("resume", resumeFile);
      if (orgId) fd.append("orgId", orgId);

      if (isEdit) {
        await axios.put(`${BASE_URL}/recruitment/${initialData.id}`, fd, {
          withCredentials: true,
          headers,
        });
      } else {
        await axios.post(`${BASE_URL}/recruitment`, fd, {
          withCredentials: true,
          headers,
        });
      }

      onSuccess?.();
    } catch (err) {
      console.error("CandidateForm submit error:", err);
      setError(
        err.response?.data?.message ||
          `Failed to ${isEdit ? "update" : "create"} candidate.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const resetResume = () => {
    setResumeFile(null);
    setParseError("");
    setFormData((prev) => ({
      ...EMPTY_FORM,
      name: prev.name,
      email: prev.email,
      phone: prev.phone,
      applied_position: prev.applied_position,
      department: prev.department,
      skills: prev.skills,
      source: prev.source,
    }));
  };

  const openResume = async () => {
    if (!formData.resume_url) return;
    await openFileInNewTabWithHeaders(
      `${BASE_URL}${formData.resume_url}`,
      headers,
    );
  };

  return (
    <div className="rf-modal-overlay">
      <div className="rf-modal rf-form-modal">
        <div className="rf-modal-header">
          <h3>{isEdit ? "Update Candidate" : "Add Candidate"}</h3>
          <MdOutlineCancel className="rf-close-icon" onClick={onClose} />
        </div>

        <form className="rf-form" onSubmit={handleSubmit}>
          {!isEdit && (
            <div className="rf-resume-first">
              <div className="rf-field rf-full">
                <label>Upload Resume First</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                />
                <p className="rf-hint">
                  Upload a resume to auto-fill the candidate details.
                </p>
              </div>

              <div className="rf-resume-status">
                {parseLoading && <p>Reading resume and filling fields...</p>}
                {parseError && <p className="rf-error">{parseError}</p>}
                {resumeFile && !parseLoading && (
                  <div className="rf-resume-actions-inline">
                    <span>Resume loaded</span>
                    <button
                      type="button"
                      className="rf-secondary-btn"
                      onClick={resetResume}
                    >
                      <MdOutlineRefresh /> Re-upload
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rf-grid">
            <div className="rf-field">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="rf-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="rf-field">
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="rf-field">
              <label>Applied Position</label>
              <input
                type="text"
                name="applied_position"
                value={formData.applied_position}
                onChange={handleChange}
              />
            </div>

            <div className="rf-field">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div className="rf-field">
              <label>Skills</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
              />
            </div>

            <div className="rf-field">
              <label>Source</label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="Resume Upload / LinkedIn / Referral"
              />
            </div>

            <div className="rf-field">
              <label>Current CTC</label>
              <input
                type="number"
                name="current_ctc"
                value={formData.current_ctc}
                onChange={handleChange}
              />
            </div>

            <div className="rf-field">
              <label>Expected CTC</label>
              <input
                type="number"
                name="expected_ctc"
                value={formData.expected_ctc}
                onChange={handleChange}
              />
            </div>

            <div className="rf-field">
              <label>Notice Period</label>
              <input
                type="text"
                name="notice_period"
                value={formData.notice_period}
                onChange={handleChange}
                placeholder="30 days"
              />
            </div>

            <div className="rf-field">
              <label>Total Experience</label>
              <input
                type="text"
                name="total_experience"
                value={formData.total_experience}
                onChange={handleChange}
                placeholder="2 years 4 months"
              />
            </div>

            <div className="rf-field">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Applied">Applied</option>
                <option value="Screening">Screening</option>
                <option value="Technical Round">Technical Round</option>
                <option value="HR Round">HR Round</option>
                <option value="Manager Round">Manager Round</option>
                <option value="Offer Acceptance">Offer Acceptance</option>
                <option value="Offer Released">Offer Released</option>
                <option value="Offer Status">Offer Status</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Joined">Joined</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {isEdit && formData.resume_url && (
              <div className="rf-field rf-full">
                <label>Resume</label>
                <div className="rf-resume-actions-inline">
                  <span>Existing resume attached</span>
                  <button
                    type="button"
                    className="rf-secondary-btn"
                    onClick={openResume}
                  >
                    Open Resume
                  </button>
                </div>
              </div>
            )}

            {isEdit && (
              <div className="rf-field rf-full">
                <label>Replace Resume</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                />
              </div>
            )}
          </div>

          {error && <p className="rf-error">{error}</p>}

          <div className="rf-actions">
            <button
              type="button"
              className="rf-secondary-btn2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="rf-primary-btn" disabled={loading}>
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update Candidate"
                  : "Create Candidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
