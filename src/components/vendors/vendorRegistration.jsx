"use client";

import React from "react";
import "./vendorRegistration.css";

const VendorRegistration = ({
  step,
  formData,
  handleChange,
  handleNext,
  handleBack,
  handleSubmit,
  handleCancel,
  isSending,
}) => {
  return (
    <div className="vendr0registration-container" role="dialog" aria-modal="true" aria-labelledby="vendor-registration-title">
      <div className="vendr0registration-brandbar">
        <div>
          <span className="vendr0registration-eyebrow">Vendor management</span>
          <h2 id="vendor-registration-title">Vendor Registration</h2>
        </div>

        <button
          type="button"
          className="vendr0registration-close"
          onClick={handleCancel}
          aria-label="Close vendor registration"
        >
          ×
        </button>
      </div>

      <div className="vendr0registration-progress" aria-label={`Step ${step} of 2`}>
        <div className={`vendr0registration-step ${step === 1 ? "active" : "complete"}`}><span>1</span><strong>Vendor details</strong></div>
        <div className="vendr0registration-step-line" />
        <div className={`vendr0registration-step ${step === 2 ? "active" : ""}`}><span>2</span><strong>Send invitation</strong></div>
      </div>

      {step === 1 ? (
        <form onSubmit={(event) => { event.preventDefault(); handleNext(); }}>
          <div className="vendr0registration-intro">
            <h3>Start a new invitation</h3>
            <p>Add the vendor name first. You can review the email before it is sent.</p>
          </div>
          <fieldset className="vendr0registration-panel">
            <legend>Vendor Details</legend>
            <div className="form-group">
              <label htmlFor="registration-vendor-name">Vendor Name</label>
              <input
                id="registration-vendor-name"
                type="text"
                name="vendorName"
                value={formData.vendorName || ""}
                onChange={handleChange}
                placeholder="Enter vendor name"
                required
                autoFocus
              />
            </div>
          </fieldset>
          <div className="vendr0registration-actions">
            <button type="button" onClick={handleCancel} className="cancel-btn">Cancel</button>
            <button type="submit" className="save-vendor-btn">Next</button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <fieldset className="vendr0registration-panel">
            <legend>Send Registration Email</legend>
            <div className="mail-composer">
              <div className="mail-composer-row">
                <label htmlFor="registration-from">From</label>
                <input id="registration-from" value={formData.from} readOnly />
              </div>
              <div className="mail-composer-row">
                <label htmlFor="registration-recipient-email">To</label>
                <input id="registration-recipient-email" type="email" name="recipientEmail" value={formData.recipientEmail || ""} onChange={handleChange} placeholder="vendor@example.com" required autoFocus />
              </div>
              <div className="mail-composer-row">
                <label htmlFor="registration-vendor-name-readonly">Vendor Name</label>
                <input id="registration-vendor-name-readonly" value={formData.vendorName} readOnly />
              </div>
              <div className="mail-composer-row">
                <label htmlFor="registration-subject">Subject</label>
                <input id="registration-subject" name="subject" value={formData.subject || ""} onChange={handleChange} required />
              </div>
              <div className="form-group mail-message-field">
                <label htmlFor="registration-body">Message</label>
                <textarea id="registration-body" name="body" value={formData.body || ""} onChange={handleChange} rows="8" required />
              </div>
            </div>
          </fieldset>
          <div className="vendr0registration-actions">
            <button type="button" onClick={handleBack} className="cancel-btn">Back</button>
            <button type="submit" className="save-vendor-btn" disabled={isSending}>{isSending ? "Sending..." : "Send Email"}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default VendorRegistration;