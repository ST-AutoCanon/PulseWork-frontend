"use client";

import React, { useState } from "react";
import "./DownloadForm.css";
import { useAuth } from "../../context/AuthProvider.client";

const CustomerForm = ({ onClose, onSuccess }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    company_name: "",
    company_gst: "",
    company_pan: "",
    company_address: "",
    country: "",
    state: "",
    project_poc_name: "",
    project_poc_contact: "",
  });

  const buildHeaders = () => {
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
    };

    const employeeId = user?.employeeId ?? user?.id ?? null;
    if (employeeId) headers["x-employee-id"] = employeeId;

    const orgId =
      user?.orgId || user?.raw?.org_id || user?.org_id || user?.organization_id;
    if (orgId) headers["x-org-id"] = orgId;

    return headers;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

      const response = await fetch(`${BACKEND}/customers`, {
        method: "POST",
        credentials: "include",
        headers: buildHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create customer: ${response.status}`);
      }

      if (onSuccess) await onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Failed to create customer");
    }
  };

  return (
    <form className="download-form" onSubmit={handleSubmit}>
      <div className="download-title">
        <h2>Add Customer</h2>
        <button className="pj-close-button" type="button" onClick={onClose}>
          X
        </button>
      </div>

      <div className="download-form-grid">
        <div className="download-form-group">
          <label>
            Company Name <span className="required">*</span>
          </label>
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="download-form-group">
          <label>GSTIN</label>
          <input
            type="text"
            name="company_gst"
            value={formData.company_gst}
            onChange={handleChange}
          />
        </div>

        <div className="download-form-group">
          <label>PAN</label>
          <input
            type="text"
            name="company_pan"
            value={formData.company_pan}
            onChange={handleChange}
          />
        </div>

        <div className="download-form-group">
          <label>Address</label>
          <input
            type="text"
            name="company_address"
            value={formData.company_address}
            onChange={handleChange}
          />
        </div>

        <div className="download-form-group">
          <label>Country</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
          />
        </div>

        <div className="download-form-group">
          <label>State</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
        </div>

        <div className="download-form-group">
          <label>POC Name</label>
          <input
            type="text"
            name="project_poc_name"
            value={formData.project_poc_name}
            onChange={handleChange}
          />
        </div>

        <div className="download-form-group">
          <label>POC Contact</label>
          <input
            type="text"
            name="project_poc_contact"
            value={formData.project_poc_contact}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="download-form-actions">
        <button type="submit">Save Customer</button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
