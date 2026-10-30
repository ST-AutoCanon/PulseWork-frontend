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
  MdDescription,
  MdOutlineCancel,
  MdVisibility,
  MdDownload,
  MdOutlineEmail,
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
  "Offer Released",
  "Offer Acceptance",
  "Onboarding",
  "Joined",
  "Rejected",
];

const STAGE_COLORS = {
  Applied: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    count: "#2563eb",
  },
  Screening: {
    bg: "#eef2ff",
    border: "#c7d2fe",
    text: "#4338ca",
    count: "#4f46e5",
  },
  "Technical Round": {
    bg: "#f5f3ff",
    border: "#ddd6fe",
    text: "#6d28d9",
    count: "#7c3aed",
  },
  "HR Round": {
    bg: "#faf5ff",
    border: "#e9d5ff",
    text: "#7e22ce",
    count: "#9333ea",
  },
  "Manager Round": {
    bg: "#ecfeff",
    border: "#a5f3fc",
    text: "#0e7490",
    count: "#0891b2",
  },
  "Offer Acceptance": {
    bg: "#fffbeb",
    border: "#fcd34d",
    text: "#92400e",
    count: "#eab308",
  },
  "Offer Released": {
    bg: "#fefce8",
    border: "#fde047",
    text: "#854d0e",
    count: "#facc15",
  },
  Onboarding: {
    bg: "#ecfdf5",
    border: "#a7f3d0",
    text: "#047857",
    count: "#059669",
  },
  Joined: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    text: "#15803d",
    count: "#16a34a",
  },
  Rejected: {
    bg: "#fef2f2",
    border: "#fecaca",
    text: "#b91c1c",
    count: "#dc2626",
  },
};

function IconActionButton({
  label,
  onClick,
  children,
  className = "",
  disabled = false,
}) {
  return (
    <button
      type="button"
      className={`rf-icon-btn ${className}`}
      onClick={onClick}
      aria-label={label}
      title={label}
      data-tooltip={label}
      disabled={disabled}
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
  if (["Joined", "Rejected"].includes(candidate.status)) {
    return false;
  }

  if (candidate.status === "Offer Acceptance") {
    return candidate.offer_decision === "Accepted";
  }

  return true;
}

function canConvert(candidate) {
  return ["Onboarding", "Joined"].includes(candidate.status);
}

function canOpenAssessment(candidate) {
  return ["Screening", "Technical Round", "HR Round", "Manager Round"].includes(
    candidate.status,
  );
}

function candidateToEmployeeInitialData(candidate) {
  const nameParts = String(candidate?.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    first_name: nameParts[0] || "",
    middle_name: nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "",
    last_name: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
    email: candidate?.email || "",
    phone_number: candidate?.phone || "",
    position: candidate?.applied_position || "",
    salary: candidate?.expected_ctc || candidate?.current_ctc || "",
    total_experience_text: candidate?.total_experience || "0",
    resume_url: candidate?.resume_url || "",
    candidate_department: candidate?.department || "",
    candidate_id: candidate?.id || "",
  };
}

const OFFER_STATUS_EMAIL_STAGES = [
  "Offer Released",
  "Offer Acceptance",
  "Onboarding",
];

function getOfferStatusEmailDefaults(status, candidate) {
  const candidateName = candidate?.name || "Candidate";
  const position = candidate?.applied_position || "the position discussed";
  const organizationName = "People & Culture";

  switch (status) {
    case "Offer Acceptance":
      return {
        subject: `${organizationName} | Offer Review Requested | ${candidateName}`,
        body: `Dear ${candidateName},

We are pleased to invite you to review the offer for ${position}.

Please review the offer letter and use the secure response button included in this email to accept the offer, raise a concern, or decline it.

If you have questions, please contact our HR team.

Warm regards,
People & Culture Team`,
      };

    case "Onboarding":
      return {
        subject: `${organizationName} | Onboarding Document Submission | ${candidateName}`,
        body: `Dear ${candidateName},

Congratulations on progressing to onboarding for ${position}.

Please use the secure document-submission button included in this email to upload the documents requested below.

Please prepare your photograph, PAN card, identity/address proof, bank proof and education certificates. Previous-employment documents, salary slips and any additional HR-requested documents should also be included where applicable.

Please upload readable copies through the secure form rather than replying to this email with personal documents attached.

Thank you for your cooperation.

Warm regards,
People & Culture Team`,
      };

    case "Offer Released":
      return {
        subject: `${organizationName} | Offer Letter Update | ${candidateName}`,
        body: `Dear ${candidateName},

Your offer letter is ready for review. Please read the attached document carefully and contact our HR team if you have any questions.

Warm regards,
People & Culture Team`,
      };

    default:
      return {
        subject: `${organizationName} | Recruitment Update | ${candidateName}`,
        body: `Dear ${candidateName},

We are contacting you with an update regarding your application for ${position}.

Please contact our HR team if you require any assistance.

Warm regards,
People & Culture Team`,
      };
  }
}

function getRecruitmentLetterEmailDefaults(candidate, document) {
  const candidateName = candidate?.name || "Candidate";
  const organizationName = "People & Culture";

  if (document?.document_type === "OFFER_LETTER") {
    return {
      subject: `${organizationName} | Your Offer Letter | ${candidateName}`,
      body: `Dear ${candidateName},

Please find your offer letter attached for your review.

Use the secure button in this email to review and respond to your offer. If you have any questions, please contact our HR team.

Warm regards,
People & Culture Team`,
    };
  }

  return {
    subject: `${organizationName} | Your Appointment Letter | ${candidateName}`,
    body: `Dear ${candidateName},

Congratulations on your appointment. Please find your appointment letter attached. Kindly review it and retain a copy for your records.

If you have any questions, please contact our HR team.

Warm regards,
People & Culture Team`,
  };
}

function RecruitmentLetterCard({
  document,
  onEdit,
  onPreview,
  onDownload,
  onSend,
}) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  if (!document) {
    return null;
  }

  const isDraft = document.status === "DRAFT";
  const runAction = async (action) => {
    setBusy(true);
    setActionError("");
    try {
      await action();
    } catch (error) {
      console.error("Recruitment letter action failed:", error);
      setActionError(
        error.response?.data?.message ||
          error.message ||
          "Unable to complete this letter action.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rf-recruitment-letter-card">
      <div className="rf-recruitment-letter-header">
        <div>
          <strong>
            {document.document_type === "OFFER_LETTER"
              ? "Offer Letter"
              : "Appointment Letter"}
          </strong>
          <br />

          <span>{document.letter?.template_name || "Letter"}</span>
        </div>

        <span
          className={
            isDraft
              ? "rf-letter-status rf-letter-status-draft"
              : "rf-letter-status rf-letter-status-sent"
          }
        >
          {isDraft ? "DRAFT" : "SENT"}
        </span>
      </div>

      <div className="rf-recruitment-letter-actions">
        <IconActionButton
          label="Preview"
          onClick={() => runAction(onPreview)}
          disabled={busy}
        >
          <MdVisibility />
        </IconActionButton>

        <IconActionButton
          label="Download"
          onClick={() => runAction(onDownload)}
          disabled={busy}
        >
          <MdDownload />
        </IconActionButton>

        {isDraft && (
          <IconActionButton
            label="Edit Draft"
            onClick={() => runAction(onEdit)}
            disabled={busy}
          >
            <MdOutlineEdit />
          </IconActionButton>
        )}

        <IconActionButton
          label={isDraft ? "Send to Candidate" : "Resend"}
          onClick={() => runAction(onSend)}
          disabled={busy}
        >
          <MdOutlineEmail />
        </IconActionButton>
      </div>

      {busy && <small className="rf-letter-action-status">Working...</small>}
      {actionError && (
        <small className="rf-letter-action-error" role="alert">
          {actionError}
        </small>
      )}

      {document.sent_at && (
        <small>Sent on {new Date(document.sent_at).toLocaleString()}</small>
      )}
    </div>
  );
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

  const [candidateLetters, setCandidateLetters] = useState({});
  const [letterEmailModal, setLetterEmailModal] = useState({
    visible: false,
    candidate: null,
    document: null,
    subject: "",
    body: "",
    sending: false,
    error: "",
  });

  const openRecruitmentLetter = (
    candidate,
    documentType,
    existingLetter = null,
  ) => {
    window.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: {
          path: "/letterHead",
          recruitmentContext: {
            candidateId: candidate.id,
            documentType,
            candidate,
            existingLetter,
          },
        },
      }),
    );
  };

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
    sendStatusEmail: false,
    emailSubject: "",
    emailBody: "",
  });

  const [onboardingDocumentsModal, setOnboardingDocumentsModal] = useState({
    visible: false,
    candidate: null,
    loading: false,
    documents: [],
  });

  const viewOnboardingDocuments = async (candidate) => {
    setOnboardingDocumentsModal({
      visible: true,
      candidate,
      loading: true,
      documents: [],
    });

    try {
      const res = await axios.get(
        `${BASE_URL}/recruitment/${candidate.id}/onboarding-documents`,
        {
          headers,
          withCredentials: true,
        },
      );

      setOnboardingDocumentsModal({
        visible: true,
        candidate,
        loading: false,
        documents: res.data?.data || [],
      });
    } catch (error) {
      console.error("viewOnboardingDocuments error:", error);

      setOnboardingDocumentsModal({
        visible: true,
        candidate,
        loading: false,
        documents: [],
      });

      window.alert(
        error.response?.data?.message ||
          "Unable to retrieve the onboarding documents.",
      );
    }
  };

  const downloadOnboardingDocument = async (doc) => {
    const candidate = onboardingDocumentsModal.candidate;

    if (!candidate || !doc?.id) return;

    try {
      const res = await axios.get(
        `${BASE_URL}/recruitment/${candidate.id}/onboarding-documents/${doc.id}/download`,
        {
          headers,
          withCredentials: true,
          responseType: "blob",
        },
      );

      const blobUrl = window.URL.createObjectURL(res.data);
      const link = window.document.createElement("a");

      link.href = blobUrl;
      link.download = doc.original_filename || "onboarding-document";

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("downloadOnboardingDocument error:", error);
      window.alert("Unable to download this document.");
    }
  };

  const loadCandidateLetters = async () => {
    if (!orgId) return;

    try {
      const res = await axios.get(`${BASE_URL}/recruitment/letters`, {
        headers,
        withCredentials: true,
      });

      const rows = res.data?.data || [];
      const grouped = {};

      rows.forEach((document) => {
        const candidateId = String(document.candidate_id);

        if (!grouped[candidateId]) {
          grouped[candidateId] = {};
        }

        const key =
          document.document_type === "OFFER_LETTER" ? "offer" : "appointment";

        const existing = grouped[candidateId][key];

        if (
          !existing ||
          new Date(document.updated_at || document.created_at) >
            new Date(existing.updated_at || existing.created_at)
        ) {
          grouped[candidateId][key] = document;
        }
      });

      setCandidateLetters(grouped);
    } catch (err) {
      console.error("loadCandidateLetters error:", err);
    }
  };

  const getRecruitmentLetterFile = async (document) => {
    const filename = document?.letter?.attachment;

    if (!filename) {
      throw new Error("PDF attachment not found for this letter.");
    }

    return axios.get(
      `${BASE_URL}/api/letterheads/download/${encodeURIComponent(filename)}`,
      {
        headers,
        withCredentials: true,
        responseType: "blob",
      },
    );
  };

  const previewRecruitmentLetter = async (document) => {
    let previewWindow = null;

    try {
      if (!document?.letter?.attachment) {
        throw new Error("PDF attachment not found for this letter.");
      }

      previewWindow = window.open("", "_blank");

      const res = await getRecruitmentLetterFile(document);

      const blobUrl = window.URL.createObjectURL(res.data);

      if (previewWindow) {
        previewWindow.location.href = blobUrl;
      } else {
        window.open(blobUrl, "_blank");
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }

      console.error("previewRecruitmentLetter error:", err);
      throw err;
    }
  };

  const downloadRecruitmentLetter = async (recruitmentLetter) => {
    try {
      if (!recruitmentLetter?.letter?.attachment) {
        throw new Error("PDF attachment not found for this letter.");
      }

      const res = await getRecruitmentLetterFile(recruitmentLetter);

      const filename =
        recruitmentLetter?.letter?.attachment ||
        `${recruitmentLetter?.letter?.template_name || "letter"}.pdf`;

      const blobUrl = window.URL.createObjectURL(res.data);
      const link = window.document.createElement("a");

      link.href = blobUrl;
      link.download = filename;

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.error("downloadRecruitmentLetter error:", err);
      throw err;
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${BASE_URL}/recruitment`, {
        headers,
        withCredentials: true,
      });

      setCandidates(res.data?.data || []);

      await loadCandidateLetters();
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

    if (
      candidate.status === "Manager Round" &&
      nextStatus === "Offer Released"
    ) {
      openRecruitmentLetter(
        candidate,
        "OFFER_LETTER",
        candidateLetters[candidate.id]?.offer || null,
      );
      return;
    }

    if (OFFER_STATUS_EMAIL_STAGES.includes(nextStatus)) {
      const defaults = getOfferStatusEmailDefaults(nextStatus, candidate);
      setOfferDecisionModal({
        visible: true,
        candidate,
        nextStatus,
        offerDecision: "Pending",
        sendStatusEmail: false,
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

      await axios.put(`${BASE_URL}/recruitment/${candidate.id}`, payload, {
        headers,
        withCredentials: true,
      });

      setOfferDecisionModal({
        visible: false,
        candidate: null,
        nextStatus: null,
        offerDecision: "Pending",
        sendStatusEmail: false,
        emailSubject: "",
        emailBody: "",
      });
      fetchCandidates();
    } catch (err) {
      console.error("confirmOfferDecision error:", err);
    }
  };

  const reinitiateOffer = (candidate) => {
    const defaults = getOfferStatusEmailDefaults("Offer Acceptance", candidate);

    setOfferDecisionModal({
      visible: true,
      candidate,
      nextStatus: "Offer Acceptance",
      offerDecision: "Pending",
      sendStatusEmail: false,
      emailSubject: defaults.subject,
      emailBody: defaults.body,
    });
  };

  const closeOfferDecisionModal = () => {
    setOfferDecisionModal({
      visible: false,
      candidate: null,
      nextStatus: null,
      offerDecision: "Pending",
      sendStatusEmail: false,
    });
  };

  const convertCandidate = (candidate) => {
    openConfirmModal({
      title: "Convert Candidate",
      message: `Convert ${candidate.name} to an employee?`,
      onConfirm: () => {
        closeConfirmModal();
        setCandidateDetailsOpen(false);
        setSelectedCandidate(null);
        window.dispatchEvent(
          new CustomEvent("app:navigate", {
            detail: {
              path: "/employeeDetails",
              employeeInitialData: candidateToEmployeeInitialData(candidate),
            },
          }),
        );
      },
    });
  };

  const prepareAppointmentLetter = (candidate) => {
    setCandidateDetailsOpen(false);
    setSelectedCandidate(null);

    window.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: {
          path: "/letterHead",
          recruitmentContext: {
            candidateId: candidate.id,
            documentType: "APPOINTMENT_LETTER",
            candidate,
            existingLetter: candidateLetters[candidate.id]?.appointment || null,
          },
        },
      }),
    );
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

  const openRecruitmentLetterEmail = (candidate, document) => {
    const defaults = getRecruitmentLetterEmailDefaults(candidate, document);
    setLetterEmailModal({
      visible: true,
      candidate,
      document,
      subject: defaults.subject,
      body: defaults.body,
      sending: false,
      error: "",
    });
  };

  const closeRecruitmentLetterEmail = () => {
    if (letterEmailModal.sending) return;
    setLetterEmailModal({
      visible: false,
      candidate: null,
      document: null,
      subject: "",
      body: "",
      sending: false,
      error: "",
    });
  };

  const compressRecruitmentLetter = async (document) => {
    const response = await getRecruitmentLetterFile(document);
    const [{ pdfjs }, { jsPDF }] = await Promise.all([
      import("react-pdf"),
      import("jspdf"),
    ]);

    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const sourceBytes = new Uint8Array(await response.data.arrayBuffer());
    const loadingTask = pdfjs.getDocument({ data: sourceBytes });
    const sourcePdf = await loadingTask.promise;
    let compressedPdf = null;

    try {
      for (
        let pageNumber = 1;
        pageNumber <= sourcePdf.numPages;
        pageNumber += 1
      ) {
        const sourcePage = await sourcePdf.getPage(pageNumber);
        const pageSize = sourcePage.getViewport({ scale: 1 });
        const viewport = sourcePage.getViewport({ scale: 1.25 });
        const canvas = window.document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Unable to prepare the letter PDF for email.");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await sourcePage.render({ canvasContext: context, viewport }).promise;

        const imageData = canvas.toDataURL("image/jpeg", 0.5);
        if (!compressedPdf) {
          compressedPdf = new jsPDF({
            orientation:
              pageSize.width > pageSize.height ? "landscape" : "portrait",
            unit: "pt",
            format: [pageSize.width, pageSize.height],
            compress: true,
          });
        } else {
          compressedPdf.addPage(
            [pageSize.width, pageSize.height],
            pageSize.width > pageSize.height ? "landscape" : "portrait",
          );
        }

        compressedPdf.addImage(
          imageData,
          "JPEG",
          0,
          0,
          pageSize.width,
          pageSize.height,
          undefined,
          "FAST",
        );
        canvas.width = 0;
        canvas.height = 0;
        sourcePage.cleanup();
      }
    } finally {
      await loadingTask.destroy();
    }

    if (!compressedPdf) {
      throw new Error("The letter PDF has no pages to attach.");
    }

    const blob = compressedPdf.output("blob");
    if (blob.size > 14_000_000) {
      throw new Error(
        "The compressed PDF is still too large to email. Edit the letter and reduce its content before sending.",
      );
    }

    const filename =
      document?.letter?.template_name?.trim().replace(/[^\w.-]+/g, "_") ||
      "recruitment-letter";
    return new File([blob], `${filename}.pdf`, { type: "application/pdf" });
  };

  const sendRecruitmentLetter = async (candidate, document, subject, body) => {
    if (!document?.id) {
      throw new Error("Recruitment letter record is missing.");
    }

    try {
      const compressedPdf = await compressRecruitmentLetter(document);
      const payload = new FormData();
      payload.append("email_subject", subject);
      payload.append("email_body", body);
      payload.append("letter_pdf", compressedPdf);

      const response = await axios.post(
        `${BASE_URL}/recruitment/${candidate.id}/letters/${document.id}/send`,
        payload,
        {
          headers,
          withCredentials: true,
        },
      );

      await fetchCandidates();
      const candidateStatus = response.data?.data?.candidateStatus;
      if (candidateStatus) {
        setCandidates((currentCandidates) =>
          currentCandidates.map((currentCandidate) =>
            String(currentCandidate.id) === String(candidate.id)
              ? { ...currentCandidate, status: candidateStatus }
              : currentCandidate,
          ),
        );
      }

      setExpandedCandidateId(candidate.id);
    } catch (err) {
      console.error("sendRecruitmentLetter error:", err);
      throw err;
    }
  };

  const submitRecruitmentLetterEmail = async (event) => {
    event.preventDefault();
    const { candidate, document, subject, body } = letterEmailModal;

    if (!candidate || !document || !subject.trim() || !body.trim()) {
      setLetterEmailModal((prev) => ({
        ...prev,
        error: "Enter an email subject and message before sending.",
      }));
      return;
    }

    setLetterEmailModal((prev) => ({ ...prev, sending: true, error: "" }));

    try {
      await sendRecruitmentLetter(candidate, document, subject.trim(), body.trim());
      setLetterEmailModal({
        visible: false,
        candidate: null,
        document: null,
        subject: "",
        body: "",
        sending: false,
        error: "",
      });
      setExpandedCandidateId(candidate.id);
    } catch (error) {
      console.error("sendRecruitmentLetter error:", error);
      setLetterEmailModal((prev) => ({
        ...prev,
        sending: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Unable to send the letter.",
      }));
    }
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
              <div
                className="pipeline-column"
                key={stage}
                style={{
                  "--stage-bg": STAGE_COLORS[stage]?.bg || "#f8fafc",
                  "--stage-border": STAGE_COLORS[stage]?.border || "#e2e8f0",
                  "--stage-text": STAGE_COLORS[stage]?.text || "#334155",
                  "--stage-count": STAGE_COLORS[stage]?.count || "#64748b",
                }}
              >
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

                              {candidate.status === "Offer Acceptance" && (
                                <div className="rf-offer-response-summary">
                                  <div>
                                    <span className="rf-label">
                                      Candidate Response
                                    </span>

                                    <strong>
                                      {candidate.offer_decision || "Pending"}
                                    </strong>
                                  </div>

                                  {candidate.offer_decision === "Concern" &&
                                    candidate.offer_concern && (
                                      <div>
                                        <span className="rf-label">
                                          Candidate Concern
                                        </span>

                                        <div className="rf-notes-box">
                                          {candidate.offer_concern}
                                        </div>
                                      </div>
                                    )}

                                  {candidate.offer_response_at && (
                                    <div>
                                      <span className="rf-label">
                                        Response Submitted
                                      </span>

                                      <strong>
                                        {new Date(
                                          candidate.offer_response_at,
                                        ).toLocaleString()}
                                      </strong>
                                    </div>
                                  )}
                                </div>
                              )}

                              {candidate.status === "Onboarding" && (
                                <div className="rf-onboarding-documents-summary">
                                  <div>
                                    <strong>Onboarding documents</strong>
                                    <span>
                                      {candidate.onboarding_submitted_at
                                        ? `Submitted ${new Date(
                                            candidate.onboarding_submitted_at,
                                          ).toLocaleString()}`
                                        : "Awaiting candidate submission"}
                                    </span>
                                  </div>

                                  {candidate.onboarding_submitted_at && (
                                    <button
                                      type="button"
                                      className="candidate-advance-btn"
                                      onClick={() =>
                                        viewOnboardingDocuments(candidate)
                                      }
                                    >
                                      Review Submitted Documents
                                    </button>
                                  )}
                                </div>
                              )}

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

                                {candidate.status === "Joined" && (
                                  <IconActionButton
                                    label="Create Appointment Letter"
                                    onClick={() =>
                                      openRecruitmentLetter(
                                        candidate,
                                        "APPOINTMENT_LETTER",
                                      )
                                    }
                                  >
                                    <MdDescription />
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

                              {candidate.status === "Offer Acceptance" &&
                                candidate.offer_decision === "Accepted" && (
                                  <button
                                    type="button"
                                    className="candidate-advance-btn"
                                    onClick={() =>
                                      advanceCandidate(candidate, "Onboarding")
                                    }
                                  >
                                    Move to Onboarding
                                  </button>
                                )}

                              {["Offer Released", "Offer Acceptance"].includes(
                                candidate.status,
                              ) &&
                                candidateLetters[candidate.id]?.offer && (
                                  <RecruitmentLetterCard
                                    document={
                                      candidateLetters[candidate.id].offer
                                    }
                                    onEdit={() =>
                                      openRecruitmentLetter(
                                        candidate,
                                        "OFFER_LETTER",
                                        candidateLetters[candidate.id].offer,
                                      )
                                    }
                                    onSend={() =>
                                      openRecruitmentLetterEmail(
                                        candidate,
                                        candidateLetters[candidate.id].offer,
                                      )
                                    }
                                    onPreview={() =>
                                      previewRecruitmentLetter(
                                        candidateLetters[candidate.id].offer,
                                      )
                                    }
                                    onDownload={() =>
                                      downloadRecruitmentLetter(
                                        candidateLetters[candidate.id].offer,
                                      )
                                    }
                                  />
                                )}

                              {candidate.status === "Offer Acceptance" &&
                                candidate.offer_decision === "Concern" &&
                                candidateLetters[candidate.id]?.offer && (
                                  <button
                                    type="button"
                                    className="rf-primary-btn"
                                    onClick={() =>
                                      openRecruitmentLetterEmail(
                                        candidate,
                                        candidateLetters[candidate.id].offer,
                                      )
                                    }
                                  >
                                    Review Concern & Re-send Offer Letter
                                  </button>
                                )}

                              {candidate.status === "Joined" &&
                                candidateLetters[candidate.id]?.appointment && (
                                  <RecruitmentLetterCard
                                    document={
                                      candidateLetters[candidate.id].appointment
                                    }
                                    onEdit={() =>
                                      openRecruitmentLetter(
                                        candidate,
                                        "APPOINTMENT_LETTER",
                                        candidateLetters[candidate.id]
                                          .appointment,
                                      )
                                    }
                                    onSend={() =>
                                      openRecruitmentLetterEmail(
                                        candidate,
                                        candidateLetters[candidate.id]
                                          .appointment,
                                      )
                                    }
                                    onPreview={() =>
                                      previewRecruitmentLetter(
                                        candidateLetters[candidate.id]
                                          .appointment,
                                      )
                                    }
                                    onDownload={() =>
                                      downloadRecruitmentLetter(
                                        candidateLetters[candidate.id]
                                          .appointment,
                                      )
                                    }
                                  />
                                )}

                              {candidate.status === "Manager Round" ? (
                                <button
                                  type="button"
                                  className="candidate-advance-btn"
                                  onClick={() =>
                                    openRecruitmentLetter(
                                      candidate,
                                      "OFFER_LETTER",
                                      candidateLetters[candidate.id]?.offer ||
                                        null,
                                    )
                                  }
                                >
                                  Create Offer Letter
                                </button>
                              ) : ![
                                  "Offer Released",
                                  "Offer Acceptance",
                                ].includes(candidate.status) &&
                                canAdvance(candidate) ? (
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
                              ) : null}
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
            if (selectedCandidate.status === "Manager Round") {
              setCandidateDetailsOpen(false);

              openRecruitmentLetter(
                selectedCandidate,
                "OFFER_LETTER",
                candidateLetters[selectedCandidate.id]?.offer || null,
              );

              return;
            }

            const next = getNextStage(selectedCandidate.status);

            if (next) {
              advanceCandidate(selectedCandidate, next);
            }
          }}
          onReject={() => advanceCandidate(selectedCandidate, "Rejected")}
          onMoveToOnboarding={() => convertCandidate(selectedCandidate)}
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

      {letterEmailModal.visible && (
        <div className="rf-modal-overlay">
          <div className="rf-modal rf-form-modal rf-letter-email-modal">
            <div className="rf-modal-header">
              <h3>
                Send{" "}
                {letterEmailModal.document?.document_type === "OFFER_LETTER"
                  ? "Offer Letter"
                  : "Appointment Letter"}
              </h3>
              <button
                type="button"
                className="rf-close-icon"
                aria-label="Close email composer"
                onClick={closeRecruitmentLetterEmail}
                disabled={letterEmailModal.sending}
              >
                <MdOutlineCancel />
              </button>
            </div>

            <form
              className="rf-form"
              onSubmit={submitRecruitmentLetterEmail}
            >
              <div className="rf-grid">
                <div className="rf-field rf-full">
                  <label htmlFor="recruitment-letter-recipient">To</label>
                  <input
                    id="recruitment-letter-recipient"
                    type="email"
                    value={letterEmailModal.candidate?.email || ""}
                    readOnly
                  />
                </div>

                <div className="rf-field rf-full">
                  <label htmlFor="recruitment-letter-subject">Subject</label>
                  <input
                    id="recruitment-letter-subject"
                    type="text"
                    value={letterEmailModal.subject}
                    onChange={(event) =>
                      setLetterEmailModal((prev) => ({
                        ...prev,
                        subject: event.target.value,
                      }))
                    }
                    maxLength={200}
                    required
                  />
                </div>

                <div className="rf-field rf-full">
                  <label htmlFor="recruitment-letter-body">Email message</label>
                  <textarea
                    id="recruitment-letter-body"
                    rows={10}
                    value={letterEmailModal.body}
                    onChange={(event) =>
                      setLetterEmailModal((prev) => ({
                        ...prev,
                        body: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="rf-field rf-full">
                  <span className="rf-letter-email-attachment">
                    Attachment:{" "}
                    {letterEmailModal.document?.letter?.template_name || "Letter"}.pdf
                    {" — "}
                    PDF will be compressed before sending.
                    {letterEmailModal.document?.document_type ===
                      "OFFER_LETTER" &&
                      " The secure offer-response button is added automatically."}
                  </span>
                </div>
              </div>

              {letterEmailModal.error && (
                <div className="rf-error-banner" role="alert">
                  {letterEmailModal.error}
                </div>
              )}

              <div className="rf-actions">
                <button
                  type="button"
                  className="rf-secondary-btn2"
                  onClick={closeRecruitmentLetterEmail}
                  disabled={letterEmailModal.sending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rf-primary-btn"
                  disabled={letterEmailModal.sending}
                >
                  {letterEmailModal.sending
                    ? "Compressing and sending..."
                    : "Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
                {offerDecisionModal.nextStatus === "Offer Acceptance" && (
                  <div className="rf-offer-email-hint">
                    <strong>Candidate response link</strong>
                    <p>
                      A secure, one-time response link will be inserted
                      automatically into this email.
                    </p>
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
                    <div className="rf-email-preview">
                      <div className="rf-email-preview-heading">
                        <span>EMAIL PREVIEW</span>
                        <small>Preview of the candidate-facing message</small>
                      </div>

                      <div className="rf-email-preview-content">
                        <div className="rf-email-preview-label">Subject</div>
                        <strong>{offerDecisionModal.emailSubject}</strong>

                        <div className="rf-email-preview-label">Message</div>
                        <p>{offerDecisionModal.emailBody}</p>

                        {offerDecisionModal.nextStatus ===
                          "Offer Acceptance" && (
                          <div className="rf-email-preview-cta">
                            Review &amp; Respond to Offer
                          </div>
                        )}

                        {offerDecisionModal.nextStatus === "Onboarding" && (
                          <div className="rf-email-preview-cta">
                            Submit Onboarding Documents
                          </div>
                        )}

                        <small className="rf-email-preview-note">
                          The secure link is generated by the server and added
                          to the outgoing email automatically.
                        </small>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="rf-actions">
                <button
                  type="button"
                  className="rf-secondary-btn2"
                  onClick={closeOfferDecisionModal}
                >
                  Cancel
                </button>
                <button type="submit" className="rf-primary-btn">
                  {offerDecisionModal.nextStatus === "Offer Acceptance"
                    ? "Send Offer Acceptance"
                    : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {onboardingDocumentsModal.visible && (
        <div className="rf-modal-overlay">
          <div className="rf-modal rf-form-modal">
            <div className="rf-modal-header">
              <h3>
                Onboarding Documents
                {onboardingDocumentsModal.candidate?.name
                  ? ` — ${onboardingDocumentsModal.candidate.name}`
                  : ""}
              </h3>

              <MdOutlineCancel
                className="rf-close-icon"
                onClick={() =>
                  setOnboardingDocumentsModal({
                    visible: false,
                    candidate: null,
                    loading: false,
                    documents: [],
                  })
                }
              />
            </div>

            {onboardingDocumentsModal.loading ? (
              <p>Loading documents...</p>
            ) : onboardingDocumentsModal.documents.length === 0 ? (
              <p>No uploaded documents were found.</p>
            ) : (
              <div className="rf-onboarding-document-list">
                {onboardingDocumentsModal.documents.map((doc) => (
                  <div key={doc.id} className="rf-onboarding-document-row">
                    <div>
                      <strong>{doc.document_type.replace(/_/g, " ")}</strong>
                      <span>{doc.original_filename}</span>
                      <small>
                        Submitted{" "}
                        {doc.submitted_at
                          ? new Date(doc.submitted_at).toLocaleString()
                          : "—"}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="rf-primary-btn"
                      onClick={() => downloadOnboardingDocument(doc)}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
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
