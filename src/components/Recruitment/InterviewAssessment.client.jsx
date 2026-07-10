"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { MdOutlineCancel } from "react-icons/md";
import "./RecruitmentFlow.css";
import { useAuth } from "../../context/AuthProvider.client";

function formatDateTimeForInput(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function getRoundMeta(round = "") {
  const value = String(round).toLowerCase();

  if (value.includes("technical")) {
    return {
      roundName: "Technical Round",
      label: "Technical Round",
      apiKey: "technical-feedback",
    };
  }

  if (value.includes("hr")) {
    return {
      roundName: "HR Round",
      label: "HR Round",
      apiKey: "hr-feedback",
    };
  }

  if (value.includes("manager")) {
    return {
      roundName: "Manager Round",
      label: "Manager Round",
      apiKey: "manager-feedback",
    };
  }

  return {
    roundName: round || "Technical Round",
    label: round || "Technical Round",
    apiKey: "technical-feedback",
  };
}

function getScheduleRoundFromStatus(status = "") {
  const value = String(status).toLowerCase();

  if (value === "screening") return "Technical Round";
  if (value === "technical round") return "HR Round";
  if (value === "hr round") return "Manager Round";
  if (value === "manager round") return "Manager Round";

  return "Technical Round";
}

function buildEmailBody({
  candidateName,
  position,
  interviewerName,
  interviewDate,
  interviewLink,
  organizationName,
  organizationEmail,
  organizationAddress,
  roundLabel,
}) {
  return `Hi ${candidateName || "Candidate"},

Your ${roundLabel || "interview"} has been scheduled.

Interview Details
-------------------------
Position: ${position || "N/A"}
Interviewer: ${interviewerName || "TBA"}
Date & Time: ${interviewDate || "TBA"}
Meeting Link: ${interviewLink || "TBA"}

Organization Details
-------------------------
Organization: ${organizationName || "N/A"}
Email: ${organizationEmail || "N/A"}
Address: ${organizationAddress || "N/A"}

Please join on time.

Regards,
${organizationName || "HR Team"}`;
}

function pickLatestAssessment(candidate, roundName) {
  const list = Array.isArray(candidate?.assessments)
    ? candidate.assessments
    : [];
  if (!list.length) return null;

  const normalized = String(roundName || "").toLowerCase();
  const filtered = list.filter((a) =>
    String(a.round_name || "")
      .toLowerCase()
      .includes(normalized.replace(" round", "")),
  );

  const source = filtered.length ? filtered : list;

  return (
    [...source].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    )[0] || null
  );
}

export default function InterviewAssessment({
  candidate,
  round = "Technical Round",
  mode = "schedule",
  assessment = null,
  onClose,
  onSuccess,
}) {
  const { user } = useAuth();
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
  const meId = user?.employeeId ?? user?.id ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const roundMeta = useMemo(() => getRoundMeta(round), [round]);
  const isScheduleMode = mode === "schedule";

  const [employees, setEmployees] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjectTouched, setSubjectTouched] = useState(false);
  const [bodyTouched, setBodyTouched] = useState(false);

  const latestAssessment = useMemo(() => {
    if (assessment) return assessment;
    return pickLatestAssessment(candidate, roundMeta.roundName);
  }, [assessment, candidate, roundMeta.roundName]);

  const [formData, setFormData] = useState({
    interviewer_id: "",
    interview_date: "",
    interview_link: "",
    send_interview_email: false,
    email_subject: "",
    email_body: "",
    score: "",
    decision: "",
    feedback: "",
    next_round_date: "",
  });

  const headers = useMemo(() => {
    const h = { "x-api-key": API_KEY };
    if (meId) h["x-employee-id"] = meId;
    if (orgId) h["x-org-id"] = orgId;
    return h;
  }, [API_KEY, meId, orgId]);

  useEffect(() => {
    const loadEmployees = async () => {
      if (!orgId) return;

      try {
        const res = await axios.get(
          `${BASE_URL}/recruitment/interviewers?orgId=${encodeURIComponent(orgId)}`,
          {
            headers,
            withCredentials: true,
          },
        );

        setEmployees(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error("loadEmployees error:", err);
      }
    };

    const loadOrganization = async () => {
      if (!orgId) return;

      try {
        const res = await axios.get(`${BASE_URL}/organization/${orgId}`, {
          headers,
          withCredentials: true,
        });

        setOrganization(res.data?.data || null);
      } catch (err) {
        console.error("loadOrganization error:", err);
      }
    };

    loadEmployees();
    loadOrganization();
  }, [BASE_URL, headers, orgId]);

  useEffect(() => {
    setSubjectTouched(false);
    setBodyTouched(false);

    if (isScheduleMode) {
      setFormData({
        interviewer_id: latestAssessment?.interviewer_id || "",
        interview_date: latestAssessment?.interview_date
          ? formatDateTimeForInput(latestAssessment.interview_date)
          : "",
        interview_link: latestAssessment?.interview_link || "",
        send_interview_email: !!latestAssessment?.send_interview_email,
        email_subject: latestAssessment?.email_subject || "",
        email_body:
          latestAssessment?.email_body ||
          buildEmailBody({
            candidateName: candidate?.name,
            position: candidate?.applied_position,
            interviewerName: "",
            interviewDate: latestAssessment?.interview_date
              ? formatDateTime(latestAssessment.interview_date)
              : "",
            interviewLink: latestAssessment?.interview_link || "",
            organizationName: organization?.name,
            organizationEmail:
              organization?.contact_email_id || organization?.admin_email,
            organizationAddress: organization?.company_address,
            roundLabel: roundMeta.label,
          }),
        score: "",
        decision: "",
        feedback: "",
        next_round_date: "",
      });
      return;
    }

    setFormData({
      interviewer_id: latestAssessment?.interviewer_id || "",
      interview_date: latestAssessment?.interview_date
        ? formatDateTimeForInput(latestAssessment.interview_date)
        : "",
      interview_link: latestAssessment?.interview_link || "",
      send_interview_email: !!latestAssessment?.send_interview_email,
      email_subject: latestAssessment?.email_subject || "",
      email_body: latestAssessment?.email_body || "",
      score: latestAssessment?.score ?? "",
      decision: latestAssessment?.decision ?? "",
      feedback: latestAssessment?.feedback ?? "",
      next_round_date: latestAssessment?.next_round_date
        ? formatDateTimeForInput(latestAssessment.next_round_date)
        : "",
    });
  }, [
    candidate,
    latestAssessment,
    isScheduleMode,
    organization,
    roundMeta.label,
  ]);

  useEffect(() => {
    if (!isScheduleMode) return;
    if (!formData.send_interview_email) return;
    if (bodyTouched && subjectTouched) return;

    const interviewerLabel =
      employees.find(
        (e) =>
          String(e.employee_id ?? e.id ?? "") ===
          String(formData.interviewer_id),
      )?.name || "TBA";

    const nextSubject =
      formData.email_subject ||
      `${roundMeta.label} scheduled for ${candidate?.name || "candidate"}`;

    const nextBody = buildEmailBody({
      candidateName: candidate?.name,
      position: candidate?.applied_position,
      interviewerName: interviewerLabel,
      interviewDate: formData.interview_date
        ? formatDateTime(formData.interview_date)
        : "",
      interviewLink: formData.interview_link,
      organizationName: organization?.name,
      organizationEmail:
        organization?.contact_email_id || organization?.admin_email,
      organizationAddress: organization?.company_address,
      roundLabel: roundMeta.label,
    });

    setFormData((prev) => {
      const updated = { ...prev };
      if (!subjectTouched) updated.email_subject = nextSubject;
      if (!bodyTouched) updated.email_body = nextBody;
      return updated;
    });
  }, [
    candidate,
    employees,
    formData.send_interview_email,
    formData.interviewer_id,
    formData.interview_date,
    formData.interview_link,
    formData.email_subject,
    bodyTouched,
    subjectTouched,
    organization,
    roundMeta.label,
    isScheduleMode,
  ]);

  const interviewerOptions = useMemo(() => {
    const list = (employees || []).map((emp) => {
      const value = String(emp.employee_id ?? emp.id ?? "");
      const label = emp.name || emp.first_name || emp.email || value;
      return { value, label };
    });

    if (
      formData.interviewer_id &&
      !list.some((item) => item.value === String(formData.interviewer_id))
    ) {
      list.unshift({
        value: String(formData.interviewer_id),
        label: `Current: ${formData.interviewer_id}`,
      });
    }

    return list;
  }, [employees, formData.interviewer_id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "email_subject") setSubjectTouched(true);
    if (name === "email_body") setBodyTouched(true);

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const endpointForSubmit = () => {
    if (isScheduleMode) {
      return `${BASE_URL}/recruitment/${candidate.id}/assign-interview`;
    }

    if (roundMeta.apiKey === "technical-feedback") {
      return `${BASE_URL}/recruitment/${candidate.id}/technical-feedback`;
    }
    if (roundMeta.apiKey === "hr-feedback") {
      return `${BASE_URL}/recruitment/${candidate.id}/hr-feedback`;
    }
    return `${BASE_URL}/recruitment/${candidate.id}/manager-feedback`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = isScheduleMode
        ? {
            round_name: getScheduleRoundFromStatus(candidate?.status),
            interviewer_id: formData.interviewer_id || null,
            interview_date: formData.interview_date || null,
            interview_link: formData.interview_link || null,
            send_interview_email: formData.send_interview_email ? 1 : 0,
            email_subject: formData.email_subject || null,
            email_body: formData.email_body || null,
          }
        : {
            assessment_id: latestAssessment?.id || null,
            round_name: roundMeta.roundName,
            score: formData.score || null,
            decision: formData.decision || null,
            feedback: formData.feedback || null,
            next_round_date: formData.next_round_date || null,
            interviewer_id: formData.interviewer_id || null,
            interview_date: formData.interview_date || null,
            interview_link: formData.interview_link || null,
          };

      await axios.post(endpointForSubmit(), payload, {
        headers,
        withCredentials: true,
      });

      onSuccess?.();
    } catch (err) {
      console.error("InterviewAssessment submit error:", err);
      setError(err.response?.data?.message || "Failed to save assessment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rf-modal-overlay">
      <div className="rf-modal rf-form-modal">
        <div className="rf-modal-header">
          <h3>
            {isScheduleMode
              ? `${roundMeta.label} Schedule`
              : `${roundMeta.label} Assessment`}
          </h3>
          <MdOutlineCancel className="rf-close-icon" onClick={onClose} />
        </div>

        <div className="rf-candidate-strip">
          <strong>{candidate?.name}</strong>
          <span>{candidate?.applied_position}</span>
        </div>

        <form className="rf-form" onSubmit={handleSubmit}>
          <div className="rf-grid">
            {isScheduleMode ? (
              <>
                <div className="rf-field">
                  <label>Assigned Interviewer</label>
                  <select
                    name="interviewer_id"
                    value={formData.interviewer_id}
                    onChange={handleChange}
                  >
                    <option value="">Select interviewer</option>
                    {interviewerOptions.map((emp) => (
                      <option key={emp.value} value={emp.value}>
                        {emp.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rf-field">
                  <label>Interview Date</label>
                  <input
                    type="datetime-local"
                    name="interview_date"
                    value={formData.interview_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="rf-field rf-full">
                  <label>Interview Link</label>
                  <input
                    type="url"
                    name="interview_link"
                    value={formData.interview_link}
                    onChange={handleChange}
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div style={{ width: "100%" }}>
                  <input
                    type="checkbox"
                    name="send_interview_email"
                    checked={formData.send_interview_email}
                    onChange={handleChange}
                  />
                  <label className="rf-checkbox-label">
                    <strong> Send interview email to candidate</strong>
                  </label>
                </div>

                {formData.send_interview_email && (
                  <>
                    <div className="rf-field rf-full">
                      <label>Email Subject</label>
                      <input
                        type="text"
                        name="email_subject"
                        value={formData.email_subject}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="rf-field rf-full">
                      <label>Email Body</label>
                      <textarea
                        name="email_body"
                        value={formData.email_body}
                        onChange={handleChange}
                        rows={8}
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="rf-field">
                  <label>Overall Score (1-10)</label>
                  <input
                    type="number"
                    name="score"
                    value={formData.score}
                    onChange={handleChange}
                    min="0"
                    max="10"
                    step="1"
                  />
                </div>

                <div className="rf-field">
                  <label>Decision</label>
                  <select
                    name="decision"
                    value={formData.decision}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Hold">Hold</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="rf-field rf-full">
                  <label>Feedback</label>
                  <textarea
                    name="feedback"
                    value={formData.feedback}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Write assessment feedback here..."
                  />
                </div>
              </>
            )}
          </div>

          {error && <p className="rf-error">{error}</p>}

          <div className="rf-actions">
            <button
              type="button"
              className="rf-secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="rf-primary-btn" disabled={loading}>
              {loading
                ? "Saving..."
                : isScheduleMode
                  ? "Save Schedule"
                  : "Save Assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
