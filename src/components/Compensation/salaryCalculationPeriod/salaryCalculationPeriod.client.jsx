"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthProvider.client"; // Adjust path if needed
import "./salaryCalculationPeriod.css";


const SalaryCalculationPeriod = ({ onClose, showAlert }) => {
  const { user } = useAuth();

  const meId = user?.employeeId ?? user?.id ?? user?.employee_id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [periods, setPeriods] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ cutoff_date: "" });
  const [loading, setLoading] = useState(false);

  // Your current working backend endpoints
  const ENDPOINTS = {
    list: `${BACKEND_URL}/api/salaryCalculationperiods`,
    add: `${BACKEND_URL}/api/addSalaryCalculationperiod`,
    update: (id) => `${BACKEND_URL}/api/updateSalaryCalculationperiod/${id}`,
  };

  const headers = {
    "x-api-key": API_KEY,
    "x-employee-id": meId,
    ...(orgId ? { "x-org-id": orgId } : {}),
    
  };

  // Fetch periods
  const fetchPeriods = async () => {
    if (!BACKEND_URL || !meId) {
      showAlert?.("Please login to continue");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(ENDPOINTS.list, {withCredentials: true, headers });
      if (res.data.success) {
        const data = res.data.data || [];
        setPeriods(data);
        if (data.length === 0) {
          setFormData({ cutoff_date: new Date().getDate().toString() });
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showAlert?.("Failed to load salary periods");
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (meId) fetchPeriods();
  }, [meId]);

  // Submit form (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(formData.cutoff_date);
    if (isNaN(num) || num < 1 || num > 31) {
      showAlert?.("Please enter a valid day between 1 and 31");
      return;
    }

    setLoading(true);
    try {
      const payload = { cutoff_date: num };

      let res;
      if (isEditing) {
        res = await axios.put(ENDPOINTS.update(editingId), payload, { withCredentials: true,headers });
      } else {
        res = await axios.post(ENDPOINTS.add, payload, { withCredentials: true,headers });
      }

      if (res.data.success) {
        showAlert?.(isEditing ? "Updated successfully!" : "Added successfully!");
        fetchPeriods();
        toggleModal();
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Save failed";
      showAlert?.(msg);
    } finally {
      setLoading(false);
    }
  };

  // Edit button
  const handleEdit = (period) => {
    setIsEditing(true);
    setEditingId(period.id);
    setFormData({ cutoff_date: period.cutoff_date.toString() });
  };

  // Close modal
  const toggleModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ cutoff_date: "" });
    onClose?.();
  };

  return (
    <div className="salary-period-overlay">
      <div className="salary-period-modal">
        <div className="salary-period-header">
          <h2>{isEditing ? "Edit" : "Set"} Salary Cutoff Date</h2>
          <button onClick={toggleModal} className="salary-period-close">
            ×
          </button>
        </div>

        <div className="salary-period-content">
          {/* Form */}
          <div className="salary-period-form-section">
            <p className="salary-period-note">
              Salary will be calculated every month on this date (1-31)
            </p>

            <form onSubmit={handleSubmit}>
              <div className="salary-period-form-group">
                <label className="salary-period-label">Cutoff Date</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.cutoff_date}
                  onChange={(e) => setFormData({ cutoff_date: e.target.value })}
                  placeholder="25"
                  required
                  disabled={loading}
                  className="salary-period-input"
                />
              </div>

              <button
                type="submit"
                className="salary-period-submit"
                disabled={loading || !formData.cutoff_date}
              >
                {loading ? "Saving..." : isEditing ? "Update" : "Save"}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="salary-period-list-section">
            <h3>Current Cutoff Date</h3>

            {loading && periods.length === 0 ? (
              <p>Loading...</p>
            ) : periods.length === 0 ? (
              <p className="salary-period-no-data">No cutoff date set yet</p>
            ) : (
              <table className="salary-period-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cutoff Date</th>
                    <th>Updated On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.cutoff_date}</td>
                      <td>
                        {p.updated_at
                          ? new Date(p.updated_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        <button
                          onClick={() => handleEdit(p)}
                          className="salary-period-edit-btn"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryCalculationPeriod;