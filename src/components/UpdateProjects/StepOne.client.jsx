"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { FiSearch, FiX, FiChevronDown } from "react-icons/fi";
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
  customers = [],
}) => {
  const { user } = useAuth();
  const userRole = user?.role ?? "Employee";
  const isEditable =
    typeof editable === "boolean"
      ? editable
      : !["Employee", "General"].includes(userRole);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);

  const customerWrapRef = useRef(null);

  const applyCustomer = (customer) => {
    if (!customer) return;

    handleChange({
      target: { name: "company_name", value: customer.company_name || "" },
    });
    handleChange({
      target: { name: "company_gst", value: customer.company_gst || "" },
    });
    handleChange({
      target: { name: "company_pan", value: customer.company_pan || "" },
    });
    handleChange({
      target: {
        name: "company_address",
        value: customer.company_address || "",
      },
    });
    handleChange({
      target: { name: "country", value: customer.country || "" },
    });
    handleChange({
      target: { name: "state", value: customer.state || "" },
    });
    handleChange({
      target: {
        name: "project_poc_name",
        value: customer.project_poc_name || "",
      },
    });
    handleChange({
      target: {
        name: "project_poc_contact",
        value: customer.project_poc_contact || "",
      },
    });
  };

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);

    return customers.filter((customer) => {
      const name = String(customer.company_name || "").toLowerCase();
      const gst = String(customer.company_gst || "").toLowerCase();
      const pan = String(customer.company_pan || "").toLowerCase();
      const contact = String(customer.project_poc_contact || "").toLowerCase();
      const address = String(customer.company_address || "").toLowerCase();
      return (
        name.includes(q) ||
        gst.includes(q) ||
        pan.includes(q) ||
        contact.includes(q) ||
        address.includes(q)
      );
    });
  }, [customers, customerSearch]);

  const handleCustomerSelect = (customer) => {
    if (!customer) return;
    setSelectedCustomerId(String(customer.id));
    setCustomerSearch(customer.company_name || "");
    setShowCustomerPanel(false);
    applyCustomer(customer);
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId("");
    setCustomerSearch("");
    setShowCustomerPanel(false);
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        customerWrapRef.current &&
        !customerWrapRef.current.contains(e.target)
      ) {
        setShowCustomerPanel(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="pj-step-one">
      <div className="pj-customer-group" ref={customerWrapRef}>
        <label className="customer-label">Customer Search</label>

        <div className="pj-customer-search-shell">
          <div className="pj-customer-search-bar">
            <FiSearch className="pj-customer-search-icon" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setSelectedCustomerId("");
                setShowCustomerPanel(true);
              }}
              onFocus={() => setShowCustomerPanel(true)}
              placeholder="Search by company, GST, PAN, contact, address"
              disabled={!isEditable}
            />

            {customerSearch && isEditable && (
              <button
                type="button"
                className="pj-customer-clear-icon-btn"
                onClick={handleClearCustomer}
                aria-label="Clear customer search"
              >
                <FiX />
              </button>
            )}
          </div>

          <div className="pj-customer-meta-row">
            <span>
              {filteredCustomers.length} result
              {filteredCustomers.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              className="pj-customer-panel-toggle"
              onClick={() => setShowCustomerPanel((v) => !v)}
              disabled={!isEditable}
            >
              Browse <FiChevronDown />
            </button>
          </div>

          {showCustomerPanel && isEditable && (
            <div className="pj-customer-panel">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    className={`pj-customer-item ${
                      String(customer.id) === String(selectedCustomerId)
                        ? "selected"
                        : ""
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <div className="pj-customer-item-top">
                      <strong>{customer.company_name || "Unnamed"}</strong>
                      {String(customer.id) === String(selectedCustomerId) && (
                        <span className="pj-customer-selected-badge">
                          Selected
                        </span>
                      )}
                    </div>

                    <div className="pj-customer-item-grid">
                      <span>
                        GST: <b>{customer.company_gst || "—"}</b>
                      </span>
                      <span>
                        PAN: <b>{customer.company_pan || "—"}</b>
                      </span>
                      <span>
                        Contact: <b>{customer.project_poc_contact || "—"}</b>
                      </span>
                      <span className="pj-customer-address">
                        {customer.company_address || "—"}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="pj-customer-empty">
                  No matching customers found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
            Project POC Email<span className="required">*</span>
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
                className={`pj-custom-file-upload ${!isEditable ? "disabled" : ""}`}
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
