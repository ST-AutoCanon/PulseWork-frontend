"use client";

import React, { useMemo, useState } from "react";

import {
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiMapPin,
  FiMonitor,
  FiPaperclip,
  FiPlus,
  FiUser,
  FiX,
} from "react-icons/fi";

const EmployeeRequestForm = ({ type, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    from: "",
    to: "",
    travelDate: "",
    returnDate: "",
    travelClass: "",
    tripType: "",
    purpose: "",
    additionalInfo: "",
    travelers: [""],

    amount: "",
    payoutDate: "",
    payoutMode: "",
    advanceReason: "",

    documentType: "",
    documentPurpose: "",
    documentAdditionalInfo: "",

    assetRequestType: "",
    itemName: "",
    configuration: "",
    assetReason: "",
    assetAdditionalInfo: "",
  });

  const [file, setFile] = useState(null);

  const [saving, setSaving] = useState(false);

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addTraveler = () => {
    setForm((prev) => ({
      ...prev,
      travelers: [...prev.travelers, ""],
    }));
  };

  const removeTraveler = (index) => {
    setForm((prev) => ({
      ...prev,
      travelers: prev.travelers.filter((_, i) => i !== index),
    }));
  };

  const updateTraveler = (index, value) => {
    setForm((prev) => ({
      ...prev,
      travelers: prev.travelers.map((name, i) => (i === index ? value : name)),
    }));
  };

  const config = useMemo(() => {
    const configs = {
      TRAVEL_BOOKING: {
        icon: FiMapPin,
        title: "Travel Ticket Request",
        subtitle:
          "Please provide your travel details and we'll take care of the rest.",
        button: "Submit Request",
        tone: "purple",
      },

      SALARY_ADVANCE: {
        icon: FiDollarSign,
        title: "Salary Advance Request",
        subtitle: "Fill in the details below to request salary advance.",
        button: "Submit Request",
        tone: "green",
      },

      SUPPORTING_DOCUMENT: {
        icon: FiFileText,
        title: "Supporting Documents Request",
        subtitle: "Fill in the details below.",
        button: "Submit Request",
        tone: "orange",
      },

      ASSET_REQUEST: {
        icon: FiMonitor,
        title: "Request for Laptop / Device / Software",
        subtitle: "Fill in the details below.",
        button: "Submit Request",
        tone: "blue",
      },
    };

    return configs[type] || configs.TRAVEL_BOOKING;
  }, [type]);

  const validate = () => {
    if (type === "TRAVEL_BOOKING") {
      return (
        form.from &&
        form.to &&
        form.travelDate &&
        form.travelClass &&
        form.tripType &&
        form.purpose &&
        form.travelers.some(Boolean)
      );
    }

    if (type === "SALARY_ADVANCE") {
      return (
        form.amount && form.payoutDate && form.payoutMode && form.advanceReason
      );
    }

    if (type === "SUPPORTING_DOCUMENT") {
      return form.documentType && form.documentPurpose;
    }

    if (type === "ASSET_REQUEST") {
      return form.assetRequestType && form.itemName && form.assetReason;
    }

    return false;
  };

  const submit = async () => {
    if (!validate()) {
      alert("Please complete all required fields.");
      return;
    }

    setSaving(true);

    try {
      let requestType = "";

      let title = "";

      let details = {};

      if (type === "TRAVEL_BOOKING") {
        requestType = "TRAVEL_BOOKING";

        title = "Travel Ticket Request";

        details = {
          from: form.from,
          to: form.to,
          travelDate: form.travelDate,
          returnDate: form.returnDate,
          travelClass: form.travelClass,
          tripType: form.tripType,
          purpose: form.purpose,
          additionalInfo: form.additionalInfo,
          travelers: form.travelers.filter(Boolean),
        };
      }

      if (type === "SALARY_ADVANCE") {
        requestType = "SALARY_ADVANCE";

        title = "Salary Advance Request";

        details = {
          amount: form.amount,
          payoutDate: form.payoutDate,
          payoutMode: form.payoutMode,
          reason: form.advanceReason,
          additionalInfo: form.additionalInfo,
        };
      }

      if (type === "SUPPORTING_DOCUMENT") {
        requestType = "SUPPORTING_DOCUMENT";

        title = "Supporting Documents Request";

        details = {
          documentType: form.documentType,
          purpose: form.documentPurpose,
          additionalInfo: form.documentAdditionalInfo,
        };
      }

      if (type === "ASSET_REQUEST") {
        requestType = "ASSET_REQUEST";

        title = "Request for Laptop / Device / Software";

        details = {
          requestType: form.assetRequestType,
          itemName: form.itemName,
          configuration: form.configuration,
          reason: form.assetReason,
          additionalInfo: form.assetAdditionalInfo,
        };
      }

      await onSubmit({
        requestType,
        title,
        details,
        file,
      });

      onClose();
    } catch (error) {
      console.error("Request submit error:", error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit request.",
      );
    } finally {
      setSaving(false);
    }
  };

  const Icon = config.icon;

  return (
    <div className="request-modal-backdrop">
      <div className={`request-modal ${config.tone}`}>
        <div className="request-modal-header">
          <div className="request-title-icon">
            <Icon />
          </div>

          <div className="request-modal-title">
            <h2>{config.title}</h2>

            <p>{config.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="request-close-button"
          >
            <FiX />
          </button>
        </div>

        <div className="request-modal-body">
          {/* =================================================
              TRAVEL
          ================================================= */}

          {type === "TRAVEL_BOOKING" && (
            <div className="request-form-grid">
              <RequestField label="From">
                <InputWithIcon
                  icon={<FiMapPin />}
                  value={form.from}
                  onChange={(value) => update("from", value)}
                  placeholder="Select departure city"
                />
              </RequestField>

              <RequestField label="To">
                <InputWithIcon
                  icon={<FiMapPin />}
                  value={form.to}
                  onChange={(value) => update("to", value)}
                  placeholder="Select destination city"
                />
              </RequestField>

              <RequestField label="Travel Date">
                <InputWithIcon
                  icon={<FiCalendar />}
                  type="date"
                  value={form.travelDate}
                  onChange={(value) => update("travelDate", value)}
                />
              </RequestField>

              <RequestField label="Return Date">
                <InputWithIcon
                  icon={<FiCalendar />}
                  type="date"
                  value={form.returnDate}
                  onChange={(value) => update("returnDate", value)}
                />
                <span className="optional-text">Optional</span>
              </RequestField>

              <RequestField label="Class">
                <select
                  value={form.travelClass}
                  onChange={(e) => update("travelClass", e.target.value)}
                >
                  <option value="">Select class</option>

                  <option value="Economy">Economy</option>

                  <option value="Premium Economy">Premium Economy</option>

                  <option value="Business">Business</option>

                  <option value="First">First</option>
                </select>
              </RequestField>

              <RequestField label="Trip Type">
                <select
                  value={form.tripType}
                  onChange={(e) => update("tripType", e.target.value)}
                >
                  <option value="">Select trip type</option>

                  <option value="Official">Official</option>

                  <option value="Client Visit">Client Visit</option>

                  <option value="Training">Training</option>

                  <option value="Conference">Conference</option>
                </select>
              </RequestField>

              <RequestField label="Purpose of Travel" full>
                <select
                  value={form.purpose}
                  onChange={(e) => update("purpose", e.target.value)}
                >
                  <option value="">Select purpose</option>

                  <option value="Client meeting">Client meeting</option>

                  <option value="Project discussion">Project discussion</option>

                  <option value="Training">Training</option>

                  <option value="Conference">Conference</option>

                  <option value="Other">Other</option>
                </select>
              </RequestField>

              <RequestField
                label={
                  <>
                    Additional Information{" "}
                    <span className="optional-text">(Optional)</span>
                  </>
                }
                full
              >
                <textarea
                  value={form.additionalInfo}
                  onChange={(e) => update("additionalInfo", e.target.value)}
                  placeholder="Enter any special requests or remarks"
                />
              </RequestField>

              <RequestField label="Who will be traveling?" full>
                <div className="traveler-list">
                  {form.travelers.map((traveler, index) => (
                    <div className="traveler-row" key={index}>
                      <FiUser />

                      <input
                        value={traveler}
                        onChange={(e) => updateTraveler(index, e.target.value)}
                        placeholder="Add traveler name"
                      />

                      {form.travelers.length > 1 && (
                        <button
                          type="button"
                          className="traveler-remove"
                          onClick={() => removeTraveler(index)}
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="small-outline-button"
                  onClick={addTraveler}
                >
                  <FiPlus />
                  Add
                </button>
              </RequestField>
            </div>
          )}

          {/* =================================================
              SALARY ADVANCE
          ================================================= */}

          {type === "SALARY_ADVANCE" && (
            <div className="request-form-grid">
              <RequestField label="Advance Amount" full>
                <div className="currency-input">
                  <span>₹</span>

                  <input
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(e) => update("amount", e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              </RequestField>

              <RequestField label="Preferred Payout Date">
                <InputWithIcon
                  icon={<FiCalendar />}
                  type="date"
                  value={form.payoutDate}
                  onChange={(value) => update("payoutDate", value)}
                />
              </RequestField>

              <RequestField label="Mode of Payout">
                <select
                  value={form.payoutMode}
                  onChange={(e) => update("payoutMode", e.target.value)}
                >
                  <option value="">Select mode</option>

                  <option value="Bank Transfer">Bank Transfer</option>

                  <option value="Salary">Salary</option>
                </select>
              </RequestField>

              <RequestField label="Reason for Advance" full>
                <select
                  value={form.advanceReason}
                  onChange={(e) => update("advanceReason", e.target.value)}
                >
                  <option value="">Select reason</option>

                  <option value="Medical emergency">Medical emergency</option>

                  <option value="Personal emergency">Personal emergency</option>

                  <option value="Travel">Travel</option>

                  <option value="Other">Other</option>
                </select>
              </RequestField>

              <RequestField label="Additional Information" full>
                <textarea
                  value={form.additionalInfo}
                  onChange={(e) => update("additionalInfo", e.target.value)}
                  placeholder="Enter any additional information"
                />
              </RequestField>

              <RequestField label="Attachments" full>
                <FileUpload
                  file={file}
                  onChange={setFile}
                  placeholder="Upload supporting documents (if any)"
                />
              </RequestField>
            </div>
          )}

          {/* =================================================
              SUPPORTING DOCUMENT
          ================================================= */}

          {type === "SUPPORTING_DOCUMENT" && (
            <div className="request-form-grid">
              <RequestField label="Document Type">
                <select
                  value={form.documentType}
                  onChange={(e) => update("documentType", e.target.value)}
                >
                  <option value="">Select document type</option>

                  <option value="Salary Certificate">Salary Certificate</option>

                  <option value="Employment Certificate">
                    Employment Certificate
                  </option>

                  <option value="Experience Letter">Experience Letter</option>

                  <option value="Other">Other</option>
                </select>
              </RequestField>

              <RequestField label="Purpose">
                <select
                  value={form.documentPurpose}
                  onChange={(e) => update("documentPurpose", e.target.value)}
                >
                  <option value="">Select purpose</option>

                  <option value="Bank">Bank</option>

                  <option value="Visa">Visa</option>

                  <option value="Loan">Loan</option>

                  <option value="Personal">Personal</option>
                </select>
              </RequestField>

              <RequestField label="Additional Information" full>
                <textarea
                  value={form.documentAdditionalInfo}
                  onChange={(e) =>
                    update("documentAdditionalInfo", e.target.value)
                  }
                  placeholder="Enter any additional information"
                />
              </RequestField>

              <RequestField label="Attachments" full>
                <FileUpload
                  file={file}
                  onChange={setFile}
                  placeholder="Upload documents"
                />
              </RequestField>
            </div>
          )}

          {/* =================================================
              ASSET
          ================================================= */}

          {type === "ASSET_REQUEST" && (
            <div className="request-form-grid">
              <RequestField label="Request Type">
                <select
                  value={form.assetRequestType}
                  onChange={(e) => update("assetRequestType", e.target.value)}
                >
                  <option value="">Select request type</option>

                  <option value="Laptop">Laptop</option>

                  <option value="Monitor">Monitor</option>

                  <option value="Mobile">Mobile</option>

                  <option value="Software">Software</option>

                  <option value="Accessory">Accessory</option>
                </select>
              </RequestField>

              <RequestField label="Item / Software Name">
                <input
                  value={form.itemName}
                  onChange={(e) => update("itemName", e.target.value)}
                  placeholder="Dell Latitude / VS Code etc."
                />
              </RequestField>

              <RequestField label="Configuration / Details" full>
                <input
                  value={form.configuration}
                  onChange={(e) => update("configuration", e.target.value)}
                  placeholder="Enter configuration details"
                />
              </RequestField>

              <RequestField label="Reason for Request" full>
                <select
                  value={form.assetReason}
                  onChange={(e) => update("assetReason", e.target.value)}
                >
                  <option value="">Select reason</option>

                  <option value="New Joiner">New Joiner</option>

                  <option value="Replacement">Replacement</option>

                  <option value="Additional Requirement">
                    Additional Requirement
                  </option>

                  <option value="Project Requirement">
                    Project Requirement
                  </option>
                </select>
              </RequestField>

              <RequestField label="Additional Information" full>
                <textarea
                  value={form.assetAdditionalInfo}
                  onChange={(e) =>
                    update("assetAdditionalInfo", e.target.value)
                  }
                  placeholder="Enter any additional information"
                />
              </RequestField>
            </div>
          )}
        </div>

        <div className="request-form-actions">
          <button
            type="button"
            className="request-cancel-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="request-submit-button"
            disabled={saving}
            onClick={submit}
          >
            {saving ? "Submitting..." : config.button}
          </button>
        </div>
      </div>
    </div>
  );
};

function RequestField({ label, children, full = false }) {
  return (
    <div className={`request-field ${full ? "full" : ""}`}>
      <label>{label}</label>

      {children}
    </div>
  );
}

function InputWithIcon({ icon, type = "text", value, onChange, placeholder }) {
  return (
    <div className="request-input-icon">
      {icon}

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function FileUpload({ file, onChange, placeholder }) {
  return (
    <label className="file-upload-row">
      <FiPaperclip />

      <span>{file ? file.name : placeholder}</span>

      <input
        type="file"
        hidden
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}

export default EmployeeRequestForm;
