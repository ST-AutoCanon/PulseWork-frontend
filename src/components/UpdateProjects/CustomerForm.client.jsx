"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./DownloadForm.css";
import { Country, State } from "country-state-city";
import { useAuth } from "../../context/AuthProvider.client";

const CustomerForm = ({ onClose, onSuccess, initialData = null }) => {
  const { user } = useAuth();
  const isEditMode = Boolean(initialData?.id);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);

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

  useEffect(() => {
    const countryList = Country.getAllCountries().map((item) => ({
      code: item.isoCode,
      name: item.name,
    }));
    setCountries(countryList);
  }, []);

  useEffect(() => {
    if (formData.country) {
      const stateList = State.getStatesOfCountry(formData.country).map(
        (item) => ({ code: item.isoCode, name: item.name }),
      );
      setStates(stateList);
    } else {
      setStates([]);
    }
  }, [formData.country]);

  useEffect(() => {
    if (!initialData) return;

    setFormData({
      company_name: initialData.company_name || "",
      company_gst: initialData.company_gst || "",
      company_pan: initialData.company_pan || "",
      company_address: initialData.company_address || "",
      country: initialData.country || "",
      state: initialData.state || "",
      project_poc_name: initialData.project_poc_name || "",
      project_poc_contact: initialData.project_poc_contact || "",
    });
  }, [initialData]);

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
      const url = isEditMode
        ? `${BACKEND}/customers/${initialData.id}`
        : `${BACKEND}/customers`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: buildHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${isEditMode ? "update" : "create"} customer: ${
            response.status
          }`,
        );
      }

      const data = await response.json().catch(() => ({}));

      if (onSuccess) {
        onSuccess({
          message:
            data?.message ||
            (isEditMode
              ? "Customer updated successfully."
              : "Customer created successfully."),
        });
      }

      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to save customer");
    }
  };

  const stateDisabled = !formData.country;

  return (
    <form className="download-form" onSubmit={handleSubmit}>
      <div className="download-title">
        <h2>{isEditMode ? "Edit Customer" : "Add Customer"}</h2>
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
          <select
            name="country"
            value={formData.country}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                country: e.target.value,
                state: "",
              }));
            }}
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="download-form-group">
          <label>State</label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            disabled={stateDisabled}
          >
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state.code} value={state.name}>
                {state.name}
              </option>
            ))}
          </select>
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
        <button type="submit">
          {isEditMode ? "Update Customer" : "Save Customer"}
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
