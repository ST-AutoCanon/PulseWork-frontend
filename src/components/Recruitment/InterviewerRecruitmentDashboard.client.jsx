"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { MdVisibility, MdAssignment } from "react-icons/md";
import "./RecruitmentFlow.css";
import CandidateDetailsPopup from "./CandidateDetailsPopup.client";
import InterviewAssessment from "./InterviewAssessment.client";
import { useAuth } from "../../context/AuthProvider.client";

function IconActionButton({ label, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      className={`rf-icon-btn ${className}`}
      onClick={onClick}
      aria-label={label}
      data-tooltip={label}
    >
      {children}
    </button>
  );
}

function getLatestAssessmentForMe(candidate, meId) {
  const assessments = Array.isArray(candidate?.assessments)
    ? candidate.assessments
    : [];

  const mine = assessments.filter(
    (a) => String(a?.interviewer_id || "") === String(meId || ""),
  );

  if (!mine.length) return null;

  return [...mine].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  )[0];
}

export default function InterviewerRecruitmentDashboard() {
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

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetailsOpen, setCandidateDetailsOpen] = useState(false);

  const [assessmentCandidate, setAssessmentCandidate] = useState(null);
  const [assessmentRound, setAssessmentRound] = useState("");
  const [assessmentToEdit, setAssessmentToEdit] = useState(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${BASE_URL}/recruitment`, {
        headers,
        withCredentials: true,
      });

      const all = res.data?.data || [];

      const detailed = await Promise.all(
        all.map(async (candidate) => {
          try {
            const detailRes = await axios.get(
              `${BASE_URL}/recruitment/${candidate.id}`,
              {
                headers,
                withCredentials: true,
              },
            );
            return detailRes.data?.data || candidate;
          } catch {
            return candidate;
          }
        }),
      );

      const assigned = detailed.filter((candidate) => {
        const latest = getLatestAssessmentForMe(candidate, meId);
        return !!latest;
      });

      setCandidates(assigned);
    } catch (err) {
      console.error("fetchCandidates error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId || !meId) return;
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, meId]);

  const openCandidateDetails = async (candidate) => {
    try {
      setDetailsLoading(true);
      setCandidateDetailsOpen(true);

      const res = await axios.get(`${BASE_URL}/recruitment/${candidate.id}`, {
        headers,
        withCredentials: true,
      });

      setSelectedCandidate(res.data?.data || candidate);
    } catch (err) {
      console.error("openCandidateDetails error:", err);
      setSelectedCandidate(candidate);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openAssessment = (candidate) => {
    const latest = getLatestAssessmentForMe(candidate, meId);
    setAssessmentCandidate(candidate);
    setAssessmentRound(
      latest?.round_name || candidate?.status || "Technical Round",
    );
    setAssessmentToEdit(latest);
  };

  return (
    <div className="recruitment-container">
      <div className="recruitment-header">
        <h2>My Interview Queue</h2>
      </div>

      {loading ? (
        <div className="rf-loading">Loading...</div>
      ) : (
        <div className="rf-interviewer-dashboard">
          <div className="rf-dashboard-header">
            <div>
              <h3>Assigned Candidates</h3>
              <p>{candidates.length} candidate(s) assigned to you</p>
            </div>

            <div className="rf-dashboard-count">{candidates.length}</div>
          </div>

          <div className="rf-candidate-grid">
            {candidates.length === 0 ? (
              <div className="pipeline-empty" style={{ gridColumn: "1 / -1" }}>
                No assigned candidates
              </div>
            ) : (
              candidates.map((candidate) => {
                const latest = getLatestAssessmentForMe(candidate, meId);

                return (
                  <div className="rf-interviewer-card" key={candidate.id}>
                    <div className="rf-interviewer-card-header">
                      <div>
                        <h4>{candidate.name}</h4>
                        <p>{candidate.applied_position || "—"}</p>
                      </div>

                      <span className="rf-status-badge">
                        {candidate.status || "—"}
                      </span>
                    </div>

                    <div className="rf-interviewer-info">
                      <div>
                        <label>Round</label>
                        <span>{latest?.round_name || "—"}</span>
                      </div>

                      <div>
                        <label>Decision</label>
                        <span>{latest?.decision || "Pending"}</span>
                      </div>

                      <div>
                        <label>Score</label>
                        <span>{latest?.score ?? "—"}</span>
                      </div>

                      <div>
                        <label>Email</label>
                        <span>{candidate.email || "—"}</span>
                      </div>
                    </div>

                    <div className="rf-interviewer-actions">
                      <button
                        type="button"
                        className="rf-secondary-btn"
                        onClick={() => openCandidateDetails(candidate)}
                      >
                        <MdVisibility />
                        View Details
                      </button>

                      <button
                        type="button"
                        className="rf-primary-btn"
                        onClick={() => openAssessment(candidate)}
                      >
                        <MdAssignment />
                        Assessment
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {candidateDetailsOpen && selectedCandidate && (
        <CandidateDetailsPopup
          candidate={selectedCandidate}
          loading={detailsLoading}
          onClose={() => {
            setCandidateDetailsOpen(false);
            setSelectedCandidate(null);
          }}
          onEdit={null}
          onAdvanceStatus={null}
          onReject={null}
          onMoveToOnboarding={null}
          onOpenAssessment={() => openAssessment(selectedCandidate)}
          onDelete={null}
          showAdvanceButton={false}
          showAssessmentButton={true}
          showEditButton={false}
          showDeleteButton={false}
        />
      )}

      {assessmentCandidate && (
        <InterviewAssessment
          candidate={assessmentCandidate}
          round={assessmentRound}
          mode="assessment"
          assessment={assessmentToEdit}
          onClose={() => {
            setAssessmentCandidate(null);
            setAssessmentRound("");
            setAssessmentToEdit(null);
          }}
          onSuccess={() => {
            setAssessmentCandidate(null);
            setAssessmentRound("");
            setAssessmentToEdit(null);
            fetchCandidates();
          }}
        />
      )}
    </div>
  );
}
