"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MdOutlineCancel, MdOutlineEdit, MdVisibility } from "react-icons/md";
import "./RecruitmentFlow.css";
import { useAuth } from "../../context/AuthProvider.client";
import { FaStar } from "react-icons/fa";

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function safeLink(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function getDecisionTone(decision = "") {
  const value = String(decision || "").toLowerCase();

  if (value.includes("selected")) return "success";
  if (value.includes("reject")) return "danger";
  if (value.includes("hold")) return "warning";

  return "neutral";
}

function getOverallDecision(assessment) {
  const feedbackEntries = Array.isArray(assessment?.feedback)
    ? assessment.feedback
    : [];

  const decisions = feedbackEntries
    .map((item) => String(item?.decision || "").trim())
    .filter(Boolean);

  if (!decisions.length) return null;

  const normalized = decisions.map((decision) => decision.toLowerCase());

  // Highest priority: Rejected
  if (normalized.some((decision) => decision === "rejected")) {
    return "Rejected";
  }

  // Next priority: Hold
  if (normalized.some((decision) => decision === "hold")) {
    return "Hold";
  }

  // Selected only when every submitted decision is Selected
  if (normalized.every((decision) => decision === "selected")) {
    return "Selected";
  }

  return "Pending";
}

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

function parseAssessmentFeedback(feedback) {
  if (!feedback) return {};

  if (typeof feedback === "object") {
    return feedback;
  }

  try {
    return JSON.parse(feedback);
  } catch {
    return {
      notes: feedback,
    };
  }
}

export default function CandidateDetailsPopup({
  candidate,
  onClose,
  onEdit,
  onEditInterviewerAssessment,
  onAdvanceStatus,
  onReject,
  onMoveToOnboarding,
  onDelete,
  showAdvanceButton = true,
  showEditButton = true,
  showDeleteButton = true,
}) {
  if (!candidate) return null;

  const { user } = useAuth();
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
  const meId = user?.employeeId ?? user?.id ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const headers = useMemo(() => {
    const h = { "x-api-key": API_KEY };
    if (meId) h["x-employee-id"] = meId;
    if (orgId) h["x-org-id"] = orgId;
    return h;
  }, [API_KEY, meId, orgId]);

  const [interviewers, setInterviewers] = useState([]);
  const [expandedInterviewers, setExpandedInterviewers] = useState({});

  useEffect(() => {
    const loadInterviewers = async () => {
      if (!orgId || !BASE_URL) return;

      try {
        const res = await fetch(
          `${BASE_URL}/recruitment/interviewers?orgId=${encodeURIComponent(orgId)}`,
          {
            headers,
            credentials: "include",
          },
        );

        if (!res.ok) throw new Error("Failed to load interviewers");

        const data = await res.json();
        setInterviewers(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error("loadInterviewers error:", err);
        setInterviewers([]);
      }
    };

    loadInterviewers();
  }, [BASE_URL, headers, orgId]);

  const status = candidate.status || "Applied";

  const assessments = useMemo(() => {
    if (!Array.isArray(candidate.assessments)) return [];

    return [...candidate.assessments].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }, [candidate.assessments]);

  const canConvertToEmployee = [
    "Offer Acceptance",
    "Offer Released",
    "Offer Status",
    "Onboarding",
  ].includes(status);

  const interviewerLookup = useMemo(() => {
    return interviewers.reduce((acc, interviewer) => {
      if (interviewer?.employee_id) {
        acc[String(interviewer.employee_id)] = interviewer;
      }
      return acc;
    }, {});
  }, [interviewers]);

  const getInterviewers = (interviewerIds) => {
    if (!interviewerIds) return [];

    const rawIds = Array.isArray(interviewerIds)
      ? interviewerIds
      : [interviewerIds];

    const ids = rawIds
      .flatMap((value) => String(value).split(","))
      .map((id) => String(id).trim())
      .filter(Boolean);

    return ids.map((id) => ({
      id,
      name: interviewerLookup[id]?.name || null,
    }));
  };

  const getInterviewerScoreEntries = (assessment) => {
    const interviewerList = getInterviewers(assessment?.interviewer_ids);

    const feedbackEntries = Array.isArray(assessment?.feedback)
      ? assessment.feedback
      : [];

    return interviewerList.map((person) => {
      const feedbackItem = feedbackEntries.find(
        (f) => String(f.interviewer_id) === String(person.id),
      );

      return {
        id: person.id,
        name: person.name,
        score: feedbackItem?.score ?? null,
        feedback: parseAssessmentFeedback(feedbackItem?.feedback),
        decision: feedbackItem?.decision,
      };
    });
  };

  const getOverallScore = (assessment) => {
    const entries = getInterviewerScoreEntries(assessment);

    const scoredEntries = entries.filter(
      (person) =>
        person.score !== null &&
        person.score !== undefined &&
        person.score !== "" &&
        !Number.isNaN(Number(person.score)),
    );

    if (!scoredEntries.length) return null;

    const total = scoredEntries.reduce(
      (sum, person) => sum + Number(person.score),
      0,
    );

    return total / scoredEntries.length;
  };

  const openResume = async () => {
    if (!candidate.resume_url) return;
    await openFileInNewTabWithHeaders(
      `${BASE_URL}${candidate.resume_url}`,
      headers,
    );
  };

  const toggleInterviewerExpanded = (key) => {
    setExpandedInterviewers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="rf-modal-overlay">
      <div className="rf-modal rf-details-modal">
        <div className="rf-modal-header">
          <h3>Candidate Details</h3>
          <MdOutlineCancel className="rf-close-icon" onClick={onClose} />
        </div>

        <div className="rf-details-grid">
          <div>
            <strong>Name</strong>
            <p>{valueOrDash(candidate.name)}</p>
          </div>
          <div>
            <strong>Email</strong>
            <p>{valueOrDash(candidate.email)}</p>
          </div>
          <div>
            <strong>Phone Number</strong>
            <p>{valueOrDash(candidate.phone)}</p>
          </div>
          <div>
            <strong>Position</strong>
            <p>{valueOrDash(candidate.applied_position)}</p>
          </div>
          <div>
            <strong>Department</strong>
            <p>{valueOrDash(candidate.department)}</p>
          </div>
          <div>
            <strong>Skills</strong>
            <p>{valueOrDash(candidate.skills)}</p>
          </div>
          <div>
            <strong>Source</strong>
            <p>{valueOrDash(candidate.source)}</p>
          </div>
          <div>
            <strong>Current CTC</strong>
            <p>{valueOrDash(candidate.current_ctc)}</p>
          </div>
          <div>
            <strong>Expected CTC</strong>
            <p>{valueOrDash(candidate.expected_ctc)}</p>
          </div>
          <div>
            <strong>Notice Period</strong>
            <p>{valueOrDash(candidate.notice_period)}</p>
          </div>
          <div>
            <strong>Total Experience</strong>
            <p>{valueOrDash(candidate.total_experience)}</p>
          </div>
          <div>
            <strong>Status</strong>
            <p>{valueOrDash(candidate.status)}</p>
          </div>
          <div>
            <strong>Resume</strong>
            <p>
              <button
                type="button"
                className="rf-secondary-btn"
                onClick={openResume}
                disabled={!candidate.resume_url}
              >
                Open Resume
              </button>
            </p>
          </div>
        </div>

        <div className="rf-assessment-history">
          <div className="rf-section-heading">
            <strong>Assessment History</strong>
            <span>{assessments.length} record(s)</span>
          </div>

          {assessments.length > 0 ? (
            <div className="rf-assessment-list">
              {assessments.map((a, index) => {
                const feedbackEntries = Array.isArray(a.feedback)
                  ? a.feedback
                  : [];

                const overallDecision = getOverallDecision(a);
                const overallScore = getOverallScore(a);

                const tone = getDecisionTone(overallDecision);
                const isLatest = index === 0;

                return (
                  <div
                    key={a.id}
                    className={`rf-assessment-card ${isLatest ? "is-latest" : ""}`}
                  >
                    <div className="rf-assessment-card-head">
                      <div>
                        <div className="rf-assessment-title-row">
                          <h4>{valueOrDash(a.round_name)}</h4>
                          {isLatest && (
                            <span className="rf-chip rf-chip-latest">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="rf-assessment-subtext">
                          Created {formatDateTime(a.created_at)}
                        </p>
                      </div>

                      <span className={`rf-chip rf-chip-${tone}`}>
                        {overallDecision || "Pending"}
                      </span>
                    </div>

                    <div className="rf-assessment-grid">
                      <div>
                        <span className="rf-label">Overall Score</span>
                        <strong>
                          {overallScore !== null
                            ? `${overallScore.toFixed(1)}/10`
                            : "Pending"}
                        </strong>
                      </div>
                      <div>
                        <span className="rf-label">Interviewers</span>
                        <div className="rf-interviewer-list">
                          {getInterviewers(a.interviewer_ids).length ? (
                            getInterviewers(a.interviewer_ids).map((person) => (
                              <div
                                key={person.id}
                                className="rf-interviewer-chip"
                              >
                                <span className="rf-interviewer-name">
                                  {person.name || "Unknown"}
                                </span>
                                <span className="rf-interviewer-id">
                                  ({person.id})
                                </span>
                              </div>
                            ))
                          ) : (
                            <strong>—</strong>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="rf-label">Per-Interviewer Scores</span>
                        <div className="rf-interviewer-list">
                          {getInterviewerScoreEntries(a).length ? (
                            getInterviewerScoreEntries(a).map((person) => (
                              <div
                                key={person.id}
                                className="rf-interviewer-chip"
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: "0.5rem",
                                }}
                              >
                                <span className="rf-interviewer-name">
                                  {person.name || person.id}
                                </span>
                                <span className="rf-interviewer-id">
                                  {person.score != null
                                    ? `${person.score}/10`
                                    : "Pending"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <strong>—</strong>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="rf-label">Interview Date</span>
                        <strong>{formatDateTime(a.interview_date)}</strong>
                      </div>
                      <div>
                        <span className="rf-label">Interview Link</span>
                        <strong className="rf-break">
                          {a.interview_link ? (
                            <a
                              href={safeLink(a.interview_link)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {a.interview_link}
                            </a>
                          ) : (
                            valueOrDash(a.interview_link)
                          )}
                        </strong>
                      </div>
                      <div>
                        <span className="rf-label">Email Sent</span>
                        <strong>{a.send_interview_email ? "Yes" : "No"}</strong>
                      </div>
                    </div>

                    <div className="rf-assessment-feedback">
                      <div className="rf-feedback-header">
                        <div>
                          <span className="rf-label">Evaluation Summary</span>
                          <h4>Interview Feedback</h4>
                        </div>

                        <div className="rf-feedback-score">
                          {overallScore !== null
                            ? overallScore.toFixed(1)
                            : "—"}
                          <span>/10</span>
                        </div>
                      </div>

                      <div className="rf-feedback-section">
                        <span className="rf-label">Interviewers</span>

                        <div className="rf-interviewer-summary-list">
                          {getInterviewerScoreEntries(a).length ? (
                            getInterviewerScoreEntries(a).map((person) => {
                              const personFeedback = person.feedback || {};
                              const isExpanded =
                                !!expandedInterviewers[`${a.id}-${person.id}`];

                              return (
                                <div
                                  key={`${a.id}-${person.id}`}
                                  className="rf-interviewer-summary-card"
                                >
                                  <div className="rf-interviewer-summary-header">
                                    <button
                                      type="button"
                                      className="rf-interviewer-summary-toggle"
                                      onClick={() =>
                                        toggleInterviewerExpanded(
                                          `${a.id}-${person.id}`,
                                        )
                                      }
                                    >
                                      <span>
                                        {person.name || person.id}

                                        {person.score != null
                                          ? ` • ${person.score}/10`
                                          : " • Pending"}

                                        {person.decision
                                          ? ` • ${person.decision}`
                                          : " • Decision Pending"}
                                      </span>
                                      {String(person.id) === String(meId) &&
                                        onEditInterviewerAssessment && (
                                          <button
                                            type="button"
                                            className="rf-interviewer-edit-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();

                                              onEditInterviewerAssessment({
                                                assessment: a,
                                                interviewerId: person.id,
                                              });
                                            }}
                                            title="Edit my assessment"
                                          >
                                            <MdOutlineEdit />
                                            Edit
                                          </button>
                                        )}
                                      <span className="rf-interviewer-summary-arrow">
                                        {isExpanded ? "▾" : "▸"}
                                      </span>
                                    </button>
                                  </div>

                                  {isExpanded && (
                                    <div className="rf-interviewer-summary-body">
                                      <div className="rf-feedback-section">
                                        <span className="rf-label">
                                          Evaluation Criteria
                                        </span>
                                        <div className="rf-rating-grid">
                                          {Object.entries(
                                            personFeedback.ratings || {},
                                          ).length ? (
                                            Object.entries(
                                              personFeedback.ratings || {},
                                            ).map(([key, value]) => (
                                              <div
                                                key={key}
                                                className="rf-rating-card"
                                              >
                                                <div className="rf-rating-top">
                                                  <strong>{key}</strong>
                                                  <span className="rf-rating-number">
                                                    {value}/5
                                                  </span>
                                                </div>
                                                <div className="rf-stars">
                                                  {[1, 2, 3, 4, 5].map(
                                                    (star) => (
                                                      <FaStar
                                                        key={star}
                                                        className={
                                                          star <= value
                                                            ? "rf-star active"
                                                            : "rf-star"
                                                        }
                                                      />
                                                    ),
                                                  )}
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="rf-empty-feedback">
                                              No ratings provided
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="rf-feedback-section">
                                        <span className="rf-label">
                                          Strengths
                                        </span>
                                        <div className="rf-feedback-tags success">
                                          {(personFeedback.strengths || [])
                                            .length ? (
                                            personFeedback.strengths.map(
                                              (item) => (
                                                <span key={item}>✓ {item}</span>
                                              ),
                                            )
                                          ) : (
                                            <small>No strengths added</small>
                                          )}
                                        </div>
                                      </div>

                                      <div className="rf-feedback-section">
                                        <span className="rf-label">
                                          Areas of Improvement
                                        </span>
                                        <div className="rf-feedback-tags warning">
                                          {(personFeedback.improvements || [])
                                            .length ? (
                                            personFeedback.improvements.map(
                                              (item) => (
                                                <span key={item}>! {item}</span>
                                              ),
                                            )
                                          ) : (
                                            <small>No improvements added</small>
                                          )}
                                        </div>
                                      </div>

                                      <div className="rf-feedback-section">
                                        <span className="rf-label">
                                          Additional Notes
                                        </span>
                                        <div className="rf-notes-box">
                                          {valueOrDash(personFeedback.notes)}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="rf-empty-feedback">
                              No interviewer feedback available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rf-empty-assessment">No assessments added yet.</div>
          )}
        </div>

        <div className="rf-actions rf-details-actions">
          {showEditButton && (
            <button type="button" className="rf-secondary-btn" onClick={onEdit}>
              <MdOutlineEdit /> Edit
            </button>
          )}

          {showAdvanceButton && (
            <button
              type="button"
              className="rf-primary-btn"
              onClick={onAdvanceStatus}
            >
              Advance Stage
            </button>
          )}

          {canConvertToEmployee && onMoveToOnboarding && (
            <button
              type="button"
              className="rf-secondary-btn"
              onClick={onMoveToOnboarding}
            >
              Convert to Employee
            </button>
          )}

          {showDeleteButton && onDelete && (
            <button type="button" className="rf-danger-btn" onClick={onDelete}>
              Delete
            </button>
          )}

          {onReject && (
            <button type="button" className="rf-danger-btn" onClick={onReject}>
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
