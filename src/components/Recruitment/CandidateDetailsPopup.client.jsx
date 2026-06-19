"use client";

import React, { useMemo } from "react";
import { MdOutlineCancel, MdOutlineEdit, MdVisibility } from "react-icons/md";
import "./RecruitmentFlow.css";
import { useAuth } from "../../context/AuthProvider.client";

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

function getDecisionTone(decision = "") {
  const value = String(decision || "").toLowerCase();

  if (value.includes("selected")) return "success";
  if (value.includes("reject")) return "danger";
  if (value.includes("hold")) return "warning";

  return "neutral";
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

export default function CandidateDetailsPopup({
  candidate,
  onClose,
  onEdit,
  onAdvanceStatus,
  onReject,
  onMoveToOnboarding,
  onOpenAssessment,
  onDelete,
  showAdvanceButton = true,
  showAssessmentButton = true,
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

  const openResume = async () => {
    if (!candidate.resume_url) return;
    await openFileInNewTabWithHeaders(
      `${BASE_URL}${candidate.resume_url}`,
      headers,
    );
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
            <strong>Phone</strong>
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
                const tone = getDecisionTone(a.decision);
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
                        {valueOrDash(a.decision)}
                      </span>
                    </div>

                    <div className="rf-assessment-grid">
                      <div>
                        <span className="rf-label">Score</span>
                        <strong>{valueOrDash(a.score)}</strong>
                      </div>
                      <div>
                        <span className="rf-label">Interviewer</span>
                        <strong>{valueOrDash(a.interviewer_id)}</strong>
                      </div>
                      <div>
                        <span className="rf-label">Interview Date</span>
                        <strong>{formatDateTime(a.interview_date)}</strong>
                      </div>
                      <div>
                        <span className="rf-label">Interview Link</span>
                        <strong className="rf-break">
                          {valueOrDash(a.interview_link)}
                        </strong>
                      </div>
                      <div>
                        <span className="rf-label">Email Sent</span>
                        <strong>{a.send_interview_email ? "Yes" : "No"}</strong>
                      </div>
                      <div>
                        <span className="rf-label">Next Round Date</span>
                        <strong>{formatDateTime(a.next_round_date)}</strong>
                      </div>
                    </div>

                    <div className="rf-assessment-feedback">
                      <span className="rf-label">Feedback</span>
                      <p>{valueOrDash(a.feedback)}</p>
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

          {showAssessmentButton && onOpenAssessment && (
            <button
              type="button"
              className="rf-secondary-btn"
              onClick={onOpenAssessment}
            >
              <MdVisibility /> Assessment
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

          <button type="button" className="rf-danger-btn" onClick={onReject}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
