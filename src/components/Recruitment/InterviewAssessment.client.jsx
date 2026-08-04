"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { MdOutlineCancel } from "react-icons/md";
import "./RecruitmentFlow.css";
import { useAuth } from "../../context/AuthProvider.client";
import Select from "react-select";
import { FaStar } from "react-icons/fa";

const ASSESSMENT_PARAMETERS = [
  "Communication",
  "Technical Knowledge",
  "Problem Solving",
  "Coding Skills",
  "System Design",
  "Confidence",
  "Body Language",
  "Learning Ability",
  "Culture Fit",
];

const STRENGTH_OPTIONS = [
  "Strong Fundamentals",
  "Excellent Communication",
  "Quick Learner",
  "Problem Solving",
  "Leadership",
  "Positive Attitude",
  "Team Player",
];

const IMPROVEMENT_OPTIONS = [
  "Needs DSA Practice",
  "Needs Better Communication",
  "Needs More Confidence",
  "System Design",
  "Time Management",
  "Coding Speed",
  "Practical Exposure",
];

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
    interviewer_ids: [],
    interview_date: "",
    interview_link: "",
    send_interview_email: false,
    email_subject: "",
    email_body: "",
    decision: "",
    score: "",
    ratings: {},
    strengths: [],
    improvements: [],
    feedback: "",
  });

  const StarRating = ({ value, onChange }) => {
    return (
      <div className="rf-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={star <= value ? "rf-star active" : "rf-star"}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    );
  };

  const parsedFeedback = useMemo(() => {
    if (latestAssessment?.feedback_json) {
      return latestAssessment.feedback_json;
    }

    try {
      return latestAssessment?.feedback
        ? JSON.parse(latestAssessment.feedback)
        : {};
    } catch {
      return {};
    }
  }, [latestAssessment?.feedback_json, latestAssessment?.feedback]);

  const currentInterviewerScore = useMemo(() => {
    const interviewerKey = meId ? String(meId) : "";
    const scoreMap = parsedFeedback?.interviewer_scores || {};
    if (!interviewerKey) return latestAssessment?.score ?? "";
    return scoreMap[interviewerKey] ?? latestAssessment?.score ?? "";
  }, [meId, parsedFeedback, latestAssessment?.score]);

  const currentInterviewerFeedback = useMemo(() => {
    const interviewerKey = meId ? String(meId) : "";
    if (!interviewerKey) return {};

    const interviewerFeedbackMap = parsedFeedback?.interviewer_feedback || {};
    return interviewerFeedbackMap[interviewerKey] || {};
  }, [meId, parsedFeedback]);

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
        interviewer_ids: latestAssessment?.interviewer_ids
          ? String(latestAssessment.interviewer_ids).split(",")
          : [],
        interview_date: latestAssessment?.interview_date
          ? formatDateTimeForInput(latestAssessment.interview_date)
          : "",
        interview_link: latestAssessment?.interview_link || "",
        send_interview_email: !!latestAssessment?.send_interview_email,
        email_subject: latestAssessment?.email_subject || "",
        email_body: latestAssessment?.email_body || "",

        score: currentInterviewerScore ?? "",
        decision: latestAssessment?.decision ?? "",

        ratings: currentInterviewerFeedback.ratings || {},
        strengths: currentInterviewerFeedback.strengths || [],
        improvements: currentInterviewerFeedback.improvements || [],
        feedback: currentInterviewerFeedback.notes || "",
      });
      return;
    }

    setFormData({
      interviewer_ids: latestAssessment?.interviewer_ids
        ? String(latestAssessment.interviewer_ids).split(",")
        : [],

      interview_date: latestAssessment?.interview_date
        ? formatDateTimeForInput(latestAssessment.interview_date)
        : "",

      interview_link: latestAssessment?.interview_link || "",

      send_interview_email: !!latestAssessment?.send_interview_email,

      email_subject: latestAssessment?.email_subject || "",

      email_body: latestAssessment?.email_body || "",

      score: currentInterviewerScore ?? "",

      decision: latestAssessment?.decision ?? "",

      ratings: currentInterviewerFeedback.ratings || {},

      strengths: currentInterviewerFeedback.strengths || [],

      improvements: currentInterviewerFeedback.improvements || [],

      feedback: currentInterviewerFeedback.notes || "",
    });
  }, [latestAssessment?.id, isScheduleMode, meId]);

  useEffect(() => {
    if (!isScheduleMode) return;
    if (!formData.send_interview_email) return;
    if (bodyTouched && subjectTouched) return;

    const interviewerLabel =
      employees
        .filter((e) =>
          formData.interviewer_ids.includes(
            String(e.employee_id ?? e.id ?? ""),
          ),
        )
        .map((e) => e.name)
        .join(", ") || "TBA";

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
    formData.interviewer_ids,
    formData.interview_date,
    formData.interview_link,
    bodyTouched,
    subjectTouched,
    organization,
    roundMeta.label,
    isScheduleMode,
  ]);

  const interviewerOptions = useMemo(() => {
    return (employees || []).map((emp) => ({
      value: String(emp.employee_id ?? emp.id ?? ""),
      label: emp.name || emp.first_name || emp.email,
    }));
  }, [employees]);

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
            interviewer_ids: formData.interviewer_ids.length
              ? formData.interviewer_ids
              : [],
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
            feedback: JSON.stringify({
              overallScore: formData.score,

              ratings: formData.ratings,

              strengths: formData.strengths,

              improvements: formData.improvements,

              notes: formData.feedback,
              interviewer_feedback: meId
                ? {
                    [String(meId)]: {
                      overallScore: formData.score,
                      ratings: formData.ratings,
                      strengths: formData.strengths,
                      improvements: formData.improvements,
                      notes: formData.feedback,
                    },
                  }
                : undefined,
            }),
            interviewer_id: meId ? String(meId) : null,
            interviewer_ids: formData.interviewer_ids,
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
                  <Select
                    isMulti
                    isSearchable
                    placeholder="Search interviewers..."
                    options={interviewerOptions}
                    value={interviewerOptions.filter((option) =>
                      formData.interviewer_ids.includes(option.value),
                    )}
                    onChange={(selected) => {
                      setFormData((prev) => ({
                        ...prev,
                        interviewer_ids: selected
                          ? selected.map((item) => item.value)
                          : [],
                      }));
                    }}
                    closeMenuOnSelect={false}
                  />
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
                <div className="rf-field rf-full">
                  <label>
                    Overall Score <strong>{formData.score || 1}/10</strong>
                  </label>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.score}
                    className="rf-score-slider"
                    style={{
                      background: `linear-gradient(to right,
      #79c42b 0%,
      #79c42b ${((formData.score - 1) / 9) * 100}%,
      #ddd ${((formData.score - 1) / 9) * 100}%,
      #ddd 100%)`,
                    }}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        score: Number(e.target.value),
                      }))
                    }
                  />

                  <div className="rf-slider-labels">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <span key={num}>{num}</span>
                    ))}
                  </div>
                </div>

                <div className="rf-full">
                  <h4 className="rf-section-title">Evaluation Criteria</h4>

                  <div className="rf-rating-grid">
                    {ASSESSMENT_PARAMETERS.map((item) => (
                      <div key={item} className="rf-rating-card">
                        <label>{item}</label>

                        <StarRating
                          value={formData.ratings?.[item] || 0}
                          onChange={(rating) =>
                            setFormData((prev) => ({
                              ...prev,
                              ratings: {
                                ...prev.ratings,
                                [item]: rating,
                              },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rf-full">
                  <h4 className="rf-section-title">Strengths</h4>

                  <div className="rf-chip-selector">
                    {STRENGTH_OPTIONS.map((item) => {
                      const selected = (formData.strengths || []).includes(
                        item,
                      );

                      return (
                        <button
                          type="button"
                          key={item}
                          className={
                            selected ? "rf-chip-selected" : "rf-chip-option"
                          }
                          onClick={() => {
                            setFormData((prev) => {
                              const exists = (prev.strengths || []).includes(
                                item,
                              );

                              return {
                                ...prev,

                                strengths: exists
                                  ? (prev.strengths || []).filter(
                                      (i) => i !== item,
                                    )
                                  : [...(prev.strengths || []), item],
                              };
                            });
                          }}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rf-full">
                  <h4 className="rf-section-title">Improvements</h4>

                  <div className="rf-chip-selector">
                    {IMPROVEMENT_OPTIONS.map((item) => {
                      const selected = (formData.improvements || []).includes(
                        item,
                      );

                      return (
                        <button
                          type="button"
                          key={item}
                          className={
                            selected ? "rf-chip-selected" : "rf-chip-option"
                          }
                          onClick={() => {
                            setFormData((prev) => {
                              const exists = (prev.improvements || []).includes(
                                item,
                              );

                              return {
                                ...prev,

                                improvements: exists
                                  ? (prev.improvements || []).filter(
                                      (i) => i !== item,
                                    )
                                  : [...(prev.improvements || []), item],
                              };
                            });
                          }}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
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
                  <label>Additional Interview Notes</label>
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
