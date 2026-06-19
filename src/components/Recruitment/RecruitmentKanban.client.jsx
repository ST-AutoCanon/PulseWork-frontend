"use client";

import React, { useMemo, useState } from "react";
import axios from "axios";
import { MdOutlineCancel } from "react-icons/md";
import "./RecruitmentFlow.css";
import { useAuth } from "../../context/AuthProvider.client";

export default function InterviewAssessment({
  candidate,
  round = "Technical Round",
  onClose,
  onSuccess,
}) {
  const { user } = useAuth();
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
  const meId = user?.employeeId ?? user?.id ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [formData, setFormData] = useState({
    score: "",
    status: "",
    feedback: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const headers = useMemo(() => {
    const h = { "x-api-key": API_KEY };
    if (meId) h["x-employee-id"] = meId;
    if (orgId) h["x-org-id"] = orgId;
    return h;
  }, [API_KEY, meId, orgId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const endpointForRound = () => {
    if (round.toLowerCase().includes("technical"))
      return `${BASE_URL}/recruitment/${candidate.id}/technical-feedback`;
    if (round.toLowerCase().includes("hr"))
      return `${BASE_URL}/recruitment/${candidate.id}/hr-feedback`;
    if (round.toLowerCase().includes("manager"))
      return `${BASE_URL}/recruitment/${candidate.id}/manager-feedback`;
    return `${BASE_URL}/recruitment/${candidate.id}/assessment`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post(
        endpointForRound(),
        {
          round,
          ...formData,
        },
        {
          withCredentials: true,
          headers,
        },
      );

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
          <h3>{round} Assessment</h3>
          <MdOutlineCancel className="rf-close-icon" onClick={onClose} />
        </div>

        <div className="rf-candidate-strip">
          <strong>{candidate?.name}</strong>
          <span>{candidate?.applied_position}</span>
        </div>

        <form className="rf-form" onSubmit={handleSubmit}>
          <div className="rf-grid">
            <div className="rf-field">
              <label>Score</label>
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
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
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
                rows={6}
                placeholder="Write interview feedback here..."
              />
            </div>
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
              {loading ? "Saving..." : "Save Assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
