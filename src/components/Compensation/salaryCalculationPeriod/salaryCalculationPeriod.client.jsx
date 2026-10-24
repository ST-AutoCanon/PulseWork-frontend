"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthProvider.client";
import "./salaryCalculationPeriod.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export default function SalaryCalculationPeriod({ onClose, showAlert }) {
  const { user } = useAuth();
  const orgId = user?.orgId ?? user?.raw?.org_id ?? user?.org_id ?? null;
  const employeeId = user?.employeeId ?? user?.id ?? user?.employee_id ?? null;

  const [periods, setPeriods] = useState([]);
  const [cutoffDate, setCutoffDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getHeaders = useCallback(
    () => ({
      "x-api-key": API_KEY || "",
      ...(orgId ? { "x-org-id": String(orgId) } : {}),
      ...(employeeId ? { "x-employee-id": String(employeeId) } : {}),
    }),
    [employeeId, orgId],
  );

  const fetchPeriods = useCallback(async () => {
    if (!BACKEND_URL) {
      throw new Error("Backend URL is not configured.");
    }
    if (!orgId) {
      throw new Error("Organization information is unavailable.");
    }

    const response = await axios.get(
      `${BACKEND_URL}/api/salaryCalculationperiods`,
      { headers: getHeaders(), withCredentials: true },
    );
    return response.data?.data || [];
  }, [getHeaders, orgId]);

  useEffect(() => {
    let active = true;

    const loadPeriods = async () => {
      setLoading(true);
      try {
        const loadedPeriods = await fetchPeriods();
        if (active) {
          setPeriods(loadedPeriods);
          setErrorMessage("");
        }
      } catch (error) {
        console.error("[Salary Periods Error]", error);
        if (active) {
          setErrorMessage(
            error.response?.data?.error ||
              error.message ||
              "Failed to load salary periods.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPeriods();
    return () => {
      active = false;
    };
  }, [fetchPeriods]);

  const resetForm = () => {
    setEditingId(null);
    setCutoffDate("");
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cutoff = Number(cutoffDate);
    if (!Number.isInteger(cutoff) || cutoff < 1 || cutoff > 31) {
      setErrorMessage("Cutoff date must be between 1 and 31.");
      return;
    }
    if (!BACKEND_URL || !orgId) {
      setErrorMessage("Organization information or backend URL is unavailable.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const request = {
        headers: getHeaders(),
        withCredentials: true,
      };
      const payload = { cutoff_date: cutoff };

      if (editingId == null) {
        await axios.post(
          `${BACKEND_URL}/api/salaryCalculationperiods/addSalaryCalculationperiod`,
          payload,
          request,
        );
      } else {
        await axios.put(
          `${BACKEND_URL}/api/salaryCalculationperiods/updateSalaryCalculationperiod/${editingId}`,
          payload,
          request,
        );
      }

      setPeriods(await fetchPeriods());
      resetForm();
      showAlert?.(
        editingId == null
          ? "Salary calculation period saved successfully."
          : "Salary calculation period updated successfully.",
      );
    } catch (error) {
      console.error("[Save Salary Period Error]", error);
      const message =
        error.response?.data?.error ||
        error.message ||
        "Failed to save the salary calculation period.";
      setErrorMessage(message);
      showAlert?.(message);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (period) => {
    setEditingId(period.id);
    setCutoffDate(String(period.cutoff_date));
    setErrorMessage("");
  };

  let submitLabel = editingId == null ? "Save Period" : "Update Period";
  if (saving) submitLabel = "Saving...";

  let periodsContent;
  if (loading) {
    periodsContent = (
      <p className="salary-period-no-data">Loading periods...</p>
    );
  } else if (periods.length === 0) {
    periodsContent = (
      <p className="salary-period-no-data">No salary periods found.</p>
    );
  } else {
    periodsContent = (
      <div className="salary-period-table-wrapper">
        <table className="salary-period-table">
          <thead>
            <tr>
              <th>Cutoff date</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period, index) => (
              <tr
                className={index % 2 === 0 ? "even-row" : ""}
                key={period.id}
              >
                <td>{period.cutoff_date}</td>
                <td>
                  {period.created_at
                    ? new Date(period.created_at).toLocaleDateString()
                    : "-"}
                </td>
                <td className="salary-period-actions">
                  <button
                    className="salary-period-edit-btn"
                    type="button"
                    onClick={() => startEditing(period)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="salary-period-overlay">
      <dialog
        open
        className="salary-period-modal"
        aria-labelledby="salary-period-title"
      >
        <header className="salary-period-header">
          <h2 id="salary-period-title">Salary Calculation Period</h2>
          <button
            className="salary-period-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </header>

        <div className="salary-period-content">
          <section className="salary-period-form-section">
            <p className="salary-period-note">
              Set the monthly payroll cutoff day (1-31).
            </p>
            <form className="salary-period-form" onSubmit={handleSubmit}>
              <div className="salary-period-form-group">
                <label className="salary-period-label" htmlFor="cutoff-date">
                  Cutoff date
                </label>
                <input
                  className="salary-period-input"
                  id="cutoff-date"
                  type="number"
                  min="1"
                  max="31"
                  step="1"
                  value={cutoffDate}
                  onChange={(event) => setCutoffDate(event.target.value)}
                  required
                />
              </div>

              {errorMessage && (
                <p className="salary-period-error general" role="alert">
                  {errorMessage}
                </p>
              )}

              <button
                className="compensation-create-button"
                type="submit"
                disabled={saving || loading}
              >
                {submitLabel}
              </button>
              {editingId != null && (
                <button
                  className="salary-period-edit-btn"
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel edit
                </button>
              )}
            </form>
          </section>

          <section className="salary-period-list-section">
            <h3>Saved periods</h3>
            {periodsContent}
          </section>
        </div>
      </dialog>
    </div>
  );
}
