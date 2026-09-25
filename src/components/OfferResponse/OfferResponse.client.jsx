"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import "./OfferResponse.css";

export default function OfferResponse() {
  const searchParams = useSearchParams();

  const orgId = searchParams?.get("orgId");
  const token = searchParams?.get("token");

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [candidate, setCandidate] = useState(null);

  const [decision, setDecision] = useState("");

  const [concern, setConcern] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!orgId || !token || !BASE_URL) {
      setError("Invalid or missing offer response link.");
      setLoading(false);
      return;
    }

    const loadOffer = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${BASE_URL}/recruitment/public/offer-response/${encodeURIComponent(
            orgId,
          )}/${encodeURIComponent(token)}`,
          {
            withCredentials: true,
            headers: {
              "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
            },
          },
        );

        setCandidate(response.data?.data || null);
      } catch (err) {
        console.error("Load offer response error:", err);

        setError(
          err?.response?.data?.message ||
            "This offer response link is invalid or expired.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOffer();
  }, [BASE_URL, orgId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!decision) {
      setError("Please select Accept, Concern, or Reject.");
      return;
    }

    if (decision === "Concern" && !concern.trim()) {
      setError("Please enter your concern.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.post(
        `${BASE_URL}/recruitment/public/offer-response/${encodeURIComponent(
          orgId,
        )}/${encodeURIComponent(token)}`,
        {
          decision,
          concern: decision === "Concern" ? concern.trim() : null,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
        },
      );

      setSuccess(
        response.data?.message ||
          "Your response has been submitted successfully.",
      );
    } catch (err) {
      console.error("Submit offer response error:", err);

      setError(
        err?.response?.data?.message || "Unable to submit your response.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="offer-response-page">
        <div className="offer-response-card">
          <h2>Offer Response</h2>
          <p>Loading your offer details...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="offer-response-page">
        <div className="offer-response-card offer-response-success">
          <div className="offer-response-success-icon">✓</div>

          <h2>Response Submitted</h2>

          <p>{success}</p>

          <p>You can now close this page.</p>
        </div>
      </div>
    );
  }

  if (error && !candidate) {
    return (
      <div className="offer-response-page">
        <div className="offer-response-card">
          <h2>Offer Response</h2>

          <div className="offer-response-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="offer-response-page">
      <div className="offer-response-card">
        <div className="offer-response-header">
          <h1>Offer Acceptance</h1>

          <p>
            Hello <strong>{candidate?.name}</strong>
          </p>

          <p>
            Please submit your response for the offer for{" "}
            <strong>{candidate?.applied_position || "the position"}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="offer-response-options">
            <button
              type="button"
              className={`offer-response-option accept ${
                decision === "Accepted" ? "selected" : ""
              }`}
              onClick={() => {
                setDecision("Accepted");
                setError("");
              }}
            >
              <strong>Accept</strong>
              <span>I accept the offer.</span>
            </button>

            <button
              type="button"
              className={`offer-response-option concern ${
                decision === "Concern" ? "selected" : ""
              }`}
              onClick={() => {
                setDecision("Concern");
                setError("");
              }}
            >
              <strong>Concern</strong>
              <span>I have a concern about the offer.</span>
            </button>

            <button
              type="button"
              className={`offer-response-option reject ${
                decision === "Rejected" ? "selected" : ""
              }`}
              onClick={() => {
                setDecision("Rejected");
                setError("");
              }}
            >
              <strong>Reject</strong>
              <span>I do not wish to accept the offer.</span>
            </button>
          </div>

          {decision === "Concern" && (
            <div className="offer-response-concern">
              <label htmlFor="offer-concern">
                Please describe your concern
              </label>

              <textarea
                id="offer-concern"
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                rows={6}
                placeholder="Write your concern here..."
              />
            </div>
          )}

          {error && <div className="offer-response-error">{error}</div>}

          <button
            type="submit"
            className="offer-response-submit"
            disabled={submitting || !decision}
          >
            {submitting ? "Submitting..." : "Submit Response"}
          </button>
        </form>
      </div>
    </div>
  );
}
