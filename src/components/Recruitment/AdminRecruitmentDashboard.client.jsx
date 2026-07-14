"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  MdPersonAdd,
  MdOutlineEdit,
  MdDeleteOutline,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdAssignment,
  MdPersonAddAlt,
  MdOutlineCancel,
  MdVisibility,
} from "react-icons/md";

import "./RecruitmentFlow.css";
import CandidateForm from "./CandidateForm.client";
import CandidateDetailsPopup from "./CandidateDetailsPopup.client";
import InterviewAssessment from "./InterviewAssessment.client";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";

const PIPELINE = [
  "Applied",
  "Screening",
  "Technical Round",
  "HR Round",
  "Manager Round",
  "Offer Acceptance",
  "Offer Released",
  "Offer Status",
  "Onboarding",
  "Joined",
  "Rejected",
];

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

function getNextStage(status) {
  const currentIndex = PIPELINE.indexOf(status);
  if (currentIndex === -1 || currentIndex >= PIPELINE.indexOf("Joined")) {
    return null;
  }
  return PIPELINE[currentIndex + 1];
}

function canAdvance(candidate) {
  return !["Joined", "Rejected"].includes(candidate.status);
}

function canConvert(candidate) {
  return [
    "Offer Acceptance",
    "Offer Released",
    "Offer Status",
    "Onboarding",
  ].includes(candidate.status);
}

function canOpenAssessment(candidate) {
  return ["Screening", "Technical Round", "HR Round", "Manager Round"].includes(
    candidate.status,
  );
}

const OFFER_STATUS_EMAIL_STAGES = [
  "Offer Acceptance",
  "Offer Released",
  "Offer Status",
  "Onboarding",
];

function getOfferStatusEmailDefaults(status, candidate) {
  const candidateName = candidate?.name || "Candidate";
  const position = candidate?.applied_position || "N/A";
  const decision = candidate?.offer_decision || "Pending";

  switch (status) {
    case "Offer Acceptance":
      return {
        subject: `Offer Acceptance Request - ${candidateName}`,
        body: `Hi ${candidateName},\n\nCongratulations! You have progressed to the offer acceptance stage for ${position}. Please respond with your acceptance details as soon as possible.\n\nRegards,\nHR Team`,
      };
    case "Offer Released":
      return {
        subject: `Offer Letter Released - ${candidateName}`,
        body: `Hi ${candidateName},\n\nYour offer letter has been released. Please review it carefully and share your decision.\n\nRegards,\nHR Team`,
      };
    case "Offer Status":
      return {
        subject: `Offer Status Update - ${candidateName}`,
        body: `Hi ${candidateName},\n\nYour offer status has been updated to ${decision}. Please reach out to our team if you need any assistance.\n\nRegards,\nHR Team`,
      };
    case "Onboarding":
      return {
        subject: `Onboarding Documents Request - ${candidateName}`,
        body: `Hi ${candidateName},\n\nWelcome to the onboarding stage. Please attach your original documents as requested so we can complete your onboarding.\n\nRegards,\nHR Team`,
      };
    default:
      return {
        subject: `Update from HR - ${candidateName}`,
        body: `Hi ${candidateName},\n\nThis is an update regarding your application.\n\nRegards,\nHR Team`,
      };
  }
}

export default function AdminRecruitmentDashboard() {
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
  const [formVisible, setFormVisible] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [expandedCandidateId, setExpandedCandidateId] = useState(null);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetailsOpen, setCandidateDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [assessmentCandidate, setAssessmentCandidate] = useState(null);
  const [assessmentRound, setAssessmentRound] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const [offerDecisionModal, setOfferDecisionModal] = useState({
    visible: false,
    candidate: null,
    nextStatus: null,
    offerDecision: "Pending",
    sendStatusEmail: true,
    emailSubject: "",
    emailBody: "",
  });

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/recruitment`, {
        headers,
        withCredentials: true,
      });
      setCandidates(res.data?.data || []);
    } catch (err) {
      console.error("fetchCandidates error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const closeForm = () => {
    setFormVisible(false);
    setEditingCandidate(null);
  };

  const openConfirmModal = ({ title, message, onConfirm }) => {
    setConfirmModal({
      visible: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      visible: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  const editCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setFormVisible(true);
  };

  const deleteCandidate = (candidate) => {
    openConfirmModal({
      title: "Delete Candidate",
      message: `Are you sure you want to permanently delete ${candidate.name}?`,
      onConfirm: async () => {
        try {
          await axios.delete(`${BASE_URL}/recruitment/${candidate.id}`, {
            headers,
            withCredentials: true,
          });

          if (expandedCandidateId === candidate.id) {
            setExpandedCandidateId(null);
          }

          if (selectedCandidate?.id === candidate.id) {
            setSelectedCandidate(null);
            setCandidateDetailsOpen(false);
          }

          closeConfirmModal();
          fetchCandidates();
        } catch (err) {
          console.error("deleteCandidate error:", err);
        }
      },
    });
  };

  const advanceCandidate = (candidate, nextStatus) => {
    if (!nextStatus) return;

    const needsOfferDecision = nextStatus === "Offer Status";

    if (OFFER_STATUS_EMAIL_STAGES.includes(nextStatus)) {
      const defaults = getOfferStatusEmailDefaults(nextStatus, candidate);
      setOfferDecisionModal({
        visible: true,
        candidate,
        nextStatus,
        offerDecision: nextStatus === "Offer Status" ? "Pending" : "Pending",
        sendStatusEmail: true,
        emailSubject: defaults.subject,
        emailBody: defaults.body,
      });
    } else {
      openConfirmModal({
        title: "Advance Candidate",
        message: `Move ${candidate.name || "this candidate"} to ${nextStatus}?`,
        onConfirm: async () => {
          try {
            await axios.put(
              `${BASE_URL}/recruitment/${candidate.id}`,
              {
                status: nextStatus,
              },
              {
                headers,
                withCredentials: true,
              },
            );

            closeConfirmModal();
            fetchCandidates();
          } catch (err) {
            console.error("advanceCandidate error:", err);
          }
        },
      });
    }
  };

  const confirmOfferDecision = async () => {
    const {
      candidate,
      nextStatus,
      offerDecision,
      sendStatusEmail,
      emailSubject,
      emailBody,
    } = offerDecisionModal;

    try {
      const payload = {
        status: nextStatus,
        send_status_email: sendStatusEmail ? 1 : 0,
        email_subject: emailSubject || null,
        email_body: emailBody || null,
      };

      if (nextStatus === "Offer Status") {
        payload.offer_decision = offerDecision;
      }

      await axios.put(`${BASE_URL}/recruitment/${candidate.id}`, payload, {
        headers,
        withCredentials: true,
      });

      setOfferDecisionModal({
        visible: false,
        candidate: null,
        nextStatus: null,
        offerDecision: "Pending",
        sendStatusEmail: true,
        emailSubject: "",
        emailBody: "",
      });
      fetchCandidates();
    } catch (err) {
      console.error("confirmOfferDecision error:", err);
    }
  };

  const closeOfferDecisionModal = () => {
    setOfferDecisionModal({
      visible: false,
      candidate: null,
      nextStatus: null,
      offerDecision: "Pending",
    });
  };

  const convertCandidate = (candidate) => {
    openConfirmModal({
      title: "Convert Candidate",
      message: `Convert ${candidate.name} to an employee?`,
      onConfirm: async () => {
        try {
          await axios.post(
            `${BASE_URL}/recruitment/${candidate.id}/convert-to-employee`,
            {},
            {
              headers,
              withCredentials: true,
            },
          );

          closeConfirmModal();
          fetchCandidates();
        } catch (err) {
          console.error("convertCandidate error:", err);
        }
      },
    });
  };

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
    setAssessmentCandidate(candidate);
    setAssessmentRound(candidate.status || "Technical Round");
  };

  return (
    <div className="recruitment-container">
      <div className="recruitment-header">
        <h2>Recruitment & Onboarding</h2>

        <button
          type="button"
          className="add-candidate-btn"
          onClick={() => setFormVisible(true)}
        >
          <MdPersonAdd /> Add Candidate
        </button>
      </div>

      {loading ? (
        <div className="rf-loading">Loading...</div>
      ) : (
        <div className="pipeline-board">
          {PIPELINE.map((stage) => {
            const stageCandidates = candidates.filter(
              (c) => c.status === stage,
            );

            return (
              <div className="pipeline-column" key={stage}>
                <div className="pipeline-header">
                  <h3>{stage}</h3>
                  <span>{stageCandidates.length}</span>
                </div>

                <div className="pipeline-cards">
                  {stageCandidates.length === 0 ? (
                    <div className="pipeline-empty">No candidates</div>
                  ) : (
                    stageCandidates.map((candidate) => {
                      const isExpanded = expandedCandidateId === candidate.id;

                      return (
                        <div className="candidate-card" key={candidate.id}>
                          <div className="candidate-card-top">
                            <div>
                              <h4>{candidate.name}</h4>
                              <p>{candidate.applied_position || "—"}</p>
                            </div>

                            <button
                              type="button"
                              className="candidate-expand-btn"
                              onClick={() =>
                                setExpandedCandidateId(
                                  isExpanded ? null : candidate.id,
                                )
                              }
                            >
                              {isExpanded ? (
                                <MdKeyboardArrowUp />
                              ) : (
                                <MdKeyboardArrowDown />
                              )}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="candidate-card-expanded">
                              <div className="candidate-meta">
                                <span>
                                  Department: {candidate.department || "—"}
                                </span>
                                <span>Source: {candidate.source || "—"}</span>
                              </div>

                              <div className="candidate-actions">
                                <IconActionButton
                                  label="View"
                                  onClick={() =>
                                    openCandidateDetails(candidate)
                                  }
                                >
                                  <MdVisibility />
                                </IconActionButton>

                                <IconActionButton
                                  label="Edit"
                                  onClick={() => editCandidate(candidate)}
                                >
                                  <MdOutlineEdit />
                                </IconActionButton>

                                {canOpenAssessment(candidate) && (
                                  <IconActionButton
                                    label="Schedule Interview"
                                    onClick={() => openAssessment(candidate)}
                                  >
                                    <MdAssignment />
                                  </IconActionButton>
                                )}

                                {canConvert(candidate) && (
                                  <IconActionButton
                                    label="Convert to Employee"
                                    onClick={() => convertCandidate(candidate)}
                                  >
                                    <MdPersonAddAlt />
                                  </IconActionButton>
                                )}

                                {candidate.status !== "Rejected" &&
                                  candidate.status !== "Joined" && (
                                    <IconActionButton
                                      label="Reject"
                                      onClick={() =>
                                        advanceCandidate(candidate, "Rejected")
                                      }
                                      className="rf-icon-danger"
                                    >
                                      <MdOutlineCancel />
                                    </IconActionButton>
                                  )}

                                <IconActionButton
                                  label="Delete"
                                  onClick={() => deleteCandidate(candidate)}
                                  className="rf-icon-danger"
                                >
                                  <MdDeleteOutline />
                                </IconActionButton>
                              </div>

                              {canAdvance(candidate) && (
                                <button
                                  type="button"
                                  className="candidate-advance-btn"
                                  onClick={() =>
                                    advanceCandidate(
                                      candidate,
                                      getNextStage(candidate.status),
                                    )
                                  }
                                >
                                  Advance to Next Stage
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formVisible && (
        <CandidateForm
          initialData={editingCandidate}
          onClose={closeForm}
          onSuccess={() => {
            closeForm();
            fetchCandidates();
          }}
        />
      )}

      {candidateDetailsOpen && selectedCandidate && (
        <CandidateDetailsPopup
          candidate={selectedCandidate}
          loading={detailsLoading}
          onClose={() => {
            setCandidateDetailsOpen(false);
            setSelectedCandidate(null);
          }}
          onEdit={() => {
            setCandidateDetailsOpen(false);
            editCandidate(selectedCandidate);
          }}
          onAdvanceStatus={() => {
            const next = getNextStage(selectedCandidate.status);
            if (next) advanceCandidate(selectedCandidate, next);
          }}
          onReject={() => advanceCandidate(selectedCandidate, "Rejected")}
          onMoveToOnboarding={() =>
            advanceCandidate(selectedCandidate, "Onboarding")
          }
          onOpenAssessment={() => openAssessment(selectedCandidate)}
          onDelete={() => deleteCandidate(selectedCandidate)}
          showAdvanceButton
          showAssessmentButton
          showEditButton
          showDeleteButton
        />
      )}

      {assessmentCandidate && (
        <InterviewAssessment
          candidate={assessmentCandidate}
          round={assessmentRound}
          mode="schedule"
          onClose={() => {
            setAssessmentCandidate(null);
            setAssessmentRound("");
          }}
          onSuccess={() => {
            setAssessmentCandidate(null);
            setAssessmentRound("");
            fetchCandidates();
          }}
        />
      )}

      {offerDecisionModal.visible && offerDecisionModal.candidate && (
        <div className="rf-modal-overlay">
          <div className="rf-modal rf-form-modal">
            <div className="rf-modal-header">
              <h3>{offerDecisionModal.nextStatus} Update</h3>
              <MdOutlineCancel
                className="rf-close-icon"
                onClick={closeOfferDecisionModal}
              />
            </div>

            <div className="rf-candidate-strip">
              <strong>{offerDecisionModal.candidate.name}</strong>
              <span>{offerDecisionModal.candidate.applied_position}</span>
            </div>

            <form
              className="rf-form"
              onSubmit={(e) => {
                e.preventDefault();
                confirmOfferDecision();
              }}
            >
              <div className="rf-grid">
                {offerDecisionModal.nextStatus === "Offer Status" && (
                  <div className="rf-field rf-full">
                    <label>Offer Decision</label>
                    <select
                      value={offerDecisionModal.offerDecision}
                      onChange={(e) =>
                        setOfferDecisionModal((prev) => ({
                          ...prev,
                          offerDecision: e.target.value,
                        }))
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                )}

                <div style={{ width: "100%" }}>
                  <input
                    type="checkbox"
                    name="send_status_email"
                    checked={offerDecisionModal.sendStatusEmail}
                    onChange={(e) =>
                      setOfferDecisionModal((prev) => ({
                        ...prev,
                        sendStatusEmail: e.target.checked,
                      }))
                    }
                  />
                  <label className="rf-checkbox-label">
                    <strong> Send status email to candidate</strong>
                  </label>
                </div>

                {offerDecisionModal.sendStatusEmail && (
                  <>
                    <div className="rf-field rf-full">
                      <label>Email Subject</label>
                      <input
                        type="text"
                        value={offerDecisionModal.emailSubject}
                        onChange={(e) =>
                          setOfferDecisionModal((prev) => ({
                            ...prev,
                            emailSubject: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="rf-field rf-full">
                      <label>Email Body</label>
                      <textarea
                        rows={8}
                        value={offerDecisionModal.emailBody}
                        onChange={(e) =>
                          setOfferDecisionModal((prev) => ({
                            ...prev,
                            emailBody: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="rf-actions">
                <button
                  type="button"
                  className="rf-secondary-btn"
                  onClick={closeOfferDecisionModal}
                >
                  Cancel
                </button>
                <button type="submit" className="rf-primary-btn">
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        isVisible={confirmModal.visible}
        title={confirmModal.title}
        onClose={closeConfirmModal}
        buttons={[
          {
            label: "Cancel",
            className: "ac-modal-btn",
            onClick: closeConfirmModal,
          },
          {
            label: "Confirm",
            className: "ac-modal-btn ac-modal-btn-primary",
            onClick: () => confirmModal.onConfirm?.(),
          },
        ]}
      >
        <p>{confirmModal.message}</p>
      </Modal>
    </div>
  );
}
