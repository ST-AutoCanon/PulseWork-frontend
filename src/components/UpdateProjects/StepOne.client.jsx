"use client";

import React from "react";
import { useAuth } from "../../context/AuthProvider.client";

const StepOne = ({
  formData,
  countries,
  states,
  categories,
  dropdownRef,
  dropdownOpen,
  toggleDropdown,
  handleCategoryChange,
  handleChange,
  formatDate,
  selectedFiles,
  handleFileUpload,
  openAttachment,
  editable,
}) => {
  const { user } = useAuth();
  const userRole = user?.role ?? "Employee";
  const isEditable =
    typeof editable === "boolean"
      ? editable
      : !["Employee", "General"].includes(userRole);

  return (
    <div className="pj-step-one">
      <div className="pj-form-grid">
        <div className="pj-form-group">
          <label>
            Company Name<span className="required">*</span>
          </label>
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            readOnly={!isEditable}
            required
          />
        </div>
        <div className="pj-form-group">
          <label>
            Project Name<span className="required">*</span>
          </label>
          <input
            type="text"
            name="project_name"
            value={formData.project_name}
            onChange={handleChange}
            readOnly={!isEditable}
            required
          />
        </div>
        <div className="pj-form-group">
          <label>
            Project POC Name<span className="required">*</span>
          </label>
          <input
            type="text"
            name="project_poc_name"
            value={formData.project_poc_name}
            onChange={handleChange}
            readOnly={!isEditable}
            required
          />
        </div>
        <div className="pj-form-group">
          <label>
            Project POC Contact<span className="required">*</span>
          </label>
          <input
            type="number"
            name="project_poc_contact"
            value={formData.project_poc_contact}
            onChange={handleChange}
            readOnly={!isEditable}
            required
          />
        </div>
        <div className="pj-form-group">
          <label>
            Company GST<span className="required">*</span>
          </label>
          <input
            type="text"
            name="company_gst"
            value={formData.company_gst}
            onChange={handleChange}
            readOnly={!isEditable}
            required
          />
        </div>
        <div className="pj-form-group">
          <label>
            Company PAN<span className="required">*</span>
          </label>
          <input
            type="text"
            name="company_pan"
            value={formData.company_pan}
            onChange={handleChange}
            readOnly={!isEditable}
            required
          />
        </div>
        <div className="pj-form-group">
          <label>
            Company Address<span className="required">*</span>
          </label>
          <input
            type="text"
            name="company_address"
            value={formData.company_address}
            onChange={handleChange}
            readOnly={!isEditable}
            required
          />
        </div>
        <div className="pj-form-group">
          <label>
            Country (Company Located at)<span className="required">*</span>
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            disabled={!isEditable}
            required
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div className="pj-form-group">
          <label>
            State (Company Located at)<span className="required">*</span>
          </label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            disabled={!isEditable}
            required
          >
            <option value="">Select State</option>
            {states &&
              states.map((state) => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
          </select>
        </div>

        <div className="pj-form-group1">
          <label className="project-category">
            Project Category<span className="required">*</span>
          </label>
          <div className="custom-dropdown" ref={dropdownRef}>
            <div
              className="dropdown-header"
              onClick={() => isEditable && toggleDropdown()}
            >
              {formData.project_category && formData.project_category.length > 0
                ? formData.project_category.join(", ")
                : "Select Categories"}
            </div>
            {dropdownOpen && (
              <div className="dropdown-menu">
                {categories.map((category) => (
                  <label key={category} className="dropdown-item">
                    <input
                      type="checkbox"
                      value={category}
                      checked={formData.project_category.includes(category)}
                      onChange={handleCategoryChange}
                      disabled={!isEditable}
                      required
                    />
                    {category}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pj-form-group">
          <label>
            Tentative Start Date<span className="required">*</span>
          </label>
          <input
            type="date"
            name="start_date"
            value={formatDate(formData.start_date)}
            onChange={handleChange}
            readOnly={!isEditable}
            required
          />
        </div>
        <div className="pj-form-group">
          <label>
            Tentative End Date<span className="required">*</span>
          </label>
          <input
            type="date"
            name="end_date"
            value={formatDate(formData.end_date)}
            onChange={handleChange}
            min={formData.start_date}
            readOnly={!isEditable}
            required
          />
        </div>
        <div className="pj-form-group">
          <label>
            Mode of Service<span className="required">*</span>
          </label>
          <select
            name="service_mode"
            value={formData.service_mode}
            onChange={handleChange}
            disabled={!isEditable}
            required
          >
            <option value=" ">Select Mode</option>
            <option value="Online">Online</option>
            <option value="Working from Office">Working from Office</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Working at client location">
              Working at client location
            </option>
          </select>
        </div>
        <div className="pj-form-group">
          <label>
            Service Location<span className="required">*</span>
          </label>
          <input
            type="text"
            name="service_location"
            value={formData.service_location}
            onChange={handleChange}
            readOnly={!isEditable}
            required
          />
        </div>
        <div className="pj-form-group">
          <label>
            Project Status<span className="required">*</span>
          </label>
          <select
            name="project_status"
            value={formData.project_status}
            onChange={handleChange}
            disabled={!isEditable}
            required
          >
            <option value=" ">Select Status</option>
            <option value="Yet to Start">Yet to Start</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="pj-form-group">
          <label>
            Payment Type<span className="required">*</span>
          </label>
          <select
            name="payment_type"
            value={formData.payment_type}
            onChange={handleChange}
            disabled={!isEditable}
            required
          >
            <option value=" ">Select Payment Type</option>
            <option value="Monthly Scheduled">Monthly Scheduled</option>
            <option value="Service Scheduled">Service Scheduled</option>
          </select>
        </div>
      </div>

      <div className="pj-form-row">
        <div className="pj-description">
          <label>Project Description</label>
          <textarea
            placeholder="Describe project..."
            name="description"
            value={formData.description}
            onChange={handleChange}
            readOnly={!isEditable}
          ></textarea>
        </div>
        <div className="pj-attachment">
          <label>Attachment</label>
          <div className="pj-attachment-wrapper">
            <div className="pj-file-links">
              {Array.isArray(selectedFiles) && selectedFiles.length > 0 ? (
                selectedFiles.map((fileName, index) => (
                  <p
                    key={index}
                    className={`pj-file-name ${!isEditable ? "disabled" : ""}`}
                    onClick={() => isEditable && openAttachment(fileName)}
                  >
                    {fileName}
                  </p>
                ))
              ) : (
                <p>No files selected</p>
              )}
            </div>
            <div className="pj-attachment-upload">
              <input
                type="file"
                multiple
                id="fileInput"
                className="pj-hidden-file-input"
                name="attachment_url"
                onChange={handleFileUpload}
                disabled={!isEditable}
                data-employee-id={user?.employeeId ?? user?.id ?? ""}
              />
              <label
                htmlFor="fileInput"
                className={`pj-custom-file-upload ${
                  !isEditable ? "disabled" : ""
                }`}
              >
                Browse
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepOne;
