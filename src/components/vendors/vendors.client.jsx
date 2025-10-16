"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import "./vendors.css";
import { FaEye, FaPencilAlt } from "react-icons/fa";
import { Eye, Download } from "react-feather";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

const Vendors = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    company_name: "",
    registered_address: "",
    branch_address: "",
    city: "",
    state: "",
    pin_code: "",
    gst_number: "",
    pan_number: "",
    company_type: "",
    msme_status: "Not Applicable",
    contact1_name: "",
    contact1_designation: "",
    contact1_mobile: "",
    contact1_email: "",
    contact2_name: "",
    contact2_designation: "",
    contact2_mobile: "",
    contact2_email: "",
    contact3_name: "",
    contact3_designation: "",
    contact3_mobile: "",
    contact3_email: "",
    bank_name: "",
    branch: "",
    account_number: "",
    ifsc_code: "",
    nature_of_business: "",
    product_category: "",
    years_of_experience: "",
  });

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const [files, setFiles] = useState({
    gst_certificate: null,
    pan_card: null,
    cancelled_cheque: null,
    msme_certificate: null,
    incorporation_certificate: null,
  });
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDocumentsPopup, setShowDocumentsPopup] = useState(false);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [showCompanyDetailsPopup, setShowCompanyDetailsPopup] = useState(false);
  const [showContactDetailsPopup, setShowContactDetailsPopup] = useState(false);
  const [showBankDetailsPopup, setShowBankDetailsPopup] = useState(false);
  const [showBusinessInfoPopup, setShowBusinessInfoPopup] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedVendorFiles, setSelectedVendorFiles] = useState(null);
  const [mobileErrors, setMobileErrors] = useState(["", "", ""]);
  const [emailErrors, setEmailErrors] = useState(["", "", ""]);
  const [error, setError] = useState("");

  const headers = useMemo(() => {
    if (!user) return null;
    const orgId =
      user.orgId ||
      user.org_id ||
      (user.org && user.org.id) ||
      (user.organization && user.organization.id) ||
      null;

    return {
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
      "x-employee-id": user.employeeId || user.id || "0",
      ...(orgId ? { "x-org-id": String(orgId) } : {}),
    };
  }, [
    user?.employeeId,
    user?.id,
    user?.orgId,
    user?.organizationId,
    user?.org?.id,
    user?.organization?.id,
  ]);

  useEffect(() => {
    if (!headers) return;

    const interceptor = axios.interceptors.request.use((config) => {
      config.headers = {
        ...(config.headers || {}),
        ...headers,
      };
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [headers]);

  const showAlert = useCallback((message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  }, []);

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  const togglePopup = () => {
    setShowForm(!showForm);
    setIsEditing(false);
    setEditingVendorId(null);
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      company_name: "",
      registered_address: "",
      branch_address: "",
      city: "",
      state: "",
      pin_code: "",
      gst_number: "",
      pan_number: "",
      company_type: "",
      msme_status: "Not Applicable",
      contact1_name: "",
      contact1_designation: "",
      contact1_mobile: "",
      contact1_email: "",
      contact2_name: "",
      contact2_designation: "",
      contact2_mobile: "",
      contact2_email: "",
      contact3_name: "",
      contact3_designation: "",
      contact3_mobile: "",
      contact3_email: "",
      bank_name: "",
      branch: "",
      account_number: "",
      ifsc_code: "",
      nature_of_business: "",
      product_category: "",
      years_of_experience: "",
    });
    setFiles({
      gst_certificate: null,
      pan_card: null,
      cancelled_cheque: null,
      msme_certificate: null,
      incorporation_certificate: null,
    });
    setError("");
    setMobileErrors(["", "", ""]);
    setEmailErrors(["", "", ""]);
  };

  const fetchVendors = useCallback(async () => {
    if (!headers) return;
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/vendors/list`,
        { headers }
      );
      if (response.data && response.data.success) {
        setVendors(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
      showAlert("Failed to fetch vendors");
    }
  }, [headers, showAlert]);

  // call once on mount / when headers change
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = vendors.filter((vendor) =>
    vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleShowCompanyDetails = (vendor) => {
    setSelectedVendor(vendor);
    setShowCompanyDetailsPopup(true);
  };

  const handleShowContactDetails = (vendor) => {
    setSelectedVendor(vendor);
    setShowContactDetailsPopup(true);
  };

  const handleShowBankDetails = (vendor) => {
    setSelectedVendor(vendor);
    setShowBankDetailsPopup(true);
  };

  const handleShowBusinessInfo = (vendor) => {
    setSelectedVendor(vendor);
    setShowBusinessInfoPopup(true);
  };

  const handleShowDocuments = (vendor) => {
    setSelectedVendorFiles({
      gst_certificate: vendor.gst_certificate || null,
      pan_card: vendor.pan_card || null,
      cancelled_cheque: vendor.cancelled_cheque || null,
      msme_certificate: vendor.msme_certificate || null,
      incorporation_certificate: vendor.incorporation_certificate || null,
    });
    setShowDocumentsPopup(true);
  };

  const handleShowDownloadPopup = (vendor) => {
    setSelectedVendorFiles({
      gst_certificate: vendor.gst_certificate || null,
      pan_card: vendor.pan_card || null,
      cancelled_cheque: vendor.cancelled_cheque || null,
      msme_certificate: vendor.msme_certificate || null,
      incorporation_certificate: vendor.incorporation_certificate || null,
    });
    setShowDownloadPopup(true);
  };

  const handleViewDocument = async (documentPath) => {
    if (!documentPath) {
      showAlert("No document available.");
      return;
    }

    try {
      const fileName = documentPath.split(/[/\\]/).pop();
      const fileUrl = `${
        process.env.NEXT_PUBLIC_BACKEND_URL
      }/vendors/download/${encodeURIComponent(fileName)}`;

      const response = await axios.get(fileUrl, {
        headers,
        responseType: "blob",
      });

      const extension = fileName.split(".").pop().toLowerCase();
      let mimeType = "application/octet-stream";

      if (extension === "pdf") mimeType = "application/pdf";
      else if (["jpg", "jpeg"].includes(extension)) mimeType = "image/jpeg";
      else if (extension === "png") mimeType = "image/png";

      const fileBlob = new Blob([response.data], { type: mimeType });
      const fileURL = window.URL.createObjectURL(fileBlob);
      window.open(fileURL, "_blank");
    } catch (error) {
      console.error(
        "Error viewing vendor document:",
        error.response?.data || error.message
      );
      showAlert("Failed to open vendor document.");
    }
  };

  const handleDownloadDocument = async (documentPath) => {
    if (!documentPath) {
      showAlert("No document available.");
      return;
    }

    try {
      const fileName = documentPath.split(/[/\\]/).pop();
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/vendors/download/${fileName}`,
        { headers, responseType: "blob" }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      showAlert("Failed to download file.");
    }
  };

  const handleDownloadAll = (vendorFiles) => {
    const fileKeys = [
      "gst_certificate",
      "pan_card",
      "cancelled_cheque",
      "msme_certificate",
      "incorporation_certificate",
    ];

    fileKeys.forEach((key) => {
      if (vendorFiles[key]) {
        handleDownloadDocument(vendorFiles[key]);
      }
    });
  };

  const handleEdit = (vendor) => {
    setIsEditing(true);
    const id = vendor.vendor_id || vendor.id || null;
    setEditingVendorId(id);
    setFormData((prev) => ({
      ...prev,
      name: vendor.name || "",
      contact_person: vendor.contact_person || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      address: vendor.address || "",
      company_name: vendor.company_name || "",
      registered_address: vendor.registered_address || "",
      branch_address: vendor.branch_address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      pin_code: vendor.pin_code || "",
      gst_number: vendor.gst_number || "",
      pan_number: vendor.pan_number || "",
      company_type: vendor.company_type || "",
      msme_status: vendor.msme_status || "Not Applicable",
      contact1_name: vendor.contact1_name || "",
      contact1_designation: vendor.contact1_designation || "",
      contact1_mobile: vendor.contact1_mobile || "",
      contact1_email: vendor.contact1_email || "",
      contact2_name: vendor.contact2_name || "",
      contact2_designation: vendor.contact2_designation || "",
      contact2_mobile: vendor.contact2_mobile || "",
      contact2_email: vendor.contact2_email || "",
      contact3_name: vendor.contact3_name || "",
      contact3_designation: vendor.contact3_designation || "",
      contact3_mobile: vendor.contact3_mobile || "",
      contact3_email: vendor.contact3_email || "",
      bank_name: vendor.bank_name || "",
      branch: vendor.branch || "",
      account_number: vendor.account_number || "",
      ifsc_code: vendor.ifsc_code || "",
      nature_of_business: vendor.nature_of_business || "",
      product_category: vendor.product_category || "",
      years_of_experience: vendor.years_of_experience || "",
    }));
    setFiles({
      gst_certificate: vendor.gst_certificate || null,
      pan_card: vendor.pan_card || null,
      cancelled_cheque: vendor.cancelled_cheque || null,
      msme_certificate: vendor.msme_certificate || null,
      incorporation_certificate: vendor.incorporation_certificate || null,
    });
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: newFiles } = e.target;
    setFiles((prev) => ({
      ...prev,
      [name]: newFiles && newFiles[0] ? newFiles[0] : null,
    }));
  };

  const validateField = (name, value, index) => {
    if (name.includes("mobile")) {
      const mobileRegex = /^\d{10}$/;
      const errorText = mobileRegex.test(value)
        ? ""
        : "Enter a valid 10-digit mobile number";
      setMobileErrors((prev) => {
        const copy = [...prev];
        copy[index] = errorText;
        return copy;
      });
      return !errorText;
    }

    if (name.includes("email")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const errorText = emailRegex.test(value)
        ? ""
        : "Enter a valid email address";
      setEmailErrors((prev) => {
        const copy = [...prev];
        copy[index] = errorText;
        return copy;
      });
      return !errorText;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      formData.years_of_experience &&
      Number(formData.years_of_experience) < 1
    ) {
      setError("Years of experience must be at least 1");
      return;
    }
    setError("");

    const formPayload = new FormData();
    Object.keys(formData).forEach((k) => {
      if (formData[k] !== undefined && formData[k] !== null) {
        formPayload.append(k, formData[k]);
      }
    });

    Object.keys(files).forEach((k) => {
      if (files[k]) formPayload.append(k, files[k]);
    });

    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (isEditing && editingVendorId) {
        const resp = await axios.put(
          `${base}/vendors/update/${editingVendorId}`,
          formPayload,
          {
            headers: {
              ...(headers || {}),
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (resp.data && resp.data.success) {
          // Optionally keep the optimistic update:
          // setVendors(prev => prev.map(...))

          // Re-fetch remote list so UI matches server
          await fetchVendors();

          showAlert("Vendor updated successfully");
          togglePopup();
        } else {
          showAlert("Failed to update vendor");
        }
      } else {
        const resp = await axios.post(`${base}/vendors/add`, formPayload, {
          headers: {
            ...(headers || {}),
            "Content-Type": "multipart/form-data",
          },
        });

        if (resp.data && resp.data.success) {
          // Re-fetch from server
          await fetchVendors();

          showAlert("Vendor added successfully");
          togglePopup();
        } else {
          showAlert("Failed to add vendor");
        }
      }
    } catch (err) {
      console.error("Vendor submit error:", err);
      showAlert("Error while submitting vendor");
    }
  };

  return (
    <div className="vendors-container">
      <div className="header-container">
        <div className="vendor-search-container">
          <input
            type="text"
            placeholder="Search by Company Name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <i className="fas fa-search search-icon"></i>
        </div>
        <button className="add-vendor-btn" onClick={togglePopup}>
          Add Vendor
        </button>
      </div>

      <div className="table-scroll-wrapper">
        <table className="vendor-table">
          <thead>
            <tr className="header-row">
              <th>Vendor ID</th>
              <th>Company Name</th>
              <th>Company Details</th>
              <th>Contact Details</th>
              <th>Bank Details</th>
              <th>Business Information</th>
              <th>Documents</th>
              <th>Last Edited</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map((vendor) => (
              <tr key={vendor.vendor_id}>
                <td>{vendor.vendor_id}</td>
                <td>{vendor.company_name}</td>
                <td>
                  <button
                    className="vendor-view-doc-btn"
                    onClick={() => handleShowCompanyDetails(vendor)}
                  >
                    <Eye size={16} style={{ marginRight: "5px" }} /> View
                  </button>
                </td>
                <td>
                  <button
                    className="vendor-view-doc-btn"
                    onClick={() => handleShowContactDetails(vendor)}
                  >
                    <Eye size={16} style={{ marginRight: "5px" }} /> View
                  </button>
                </td>
                <td>
                  <button
                    className="vendor-view-doc-btn"
                    onClick={() => handleShowBankDetails(vendor)}
                  >
                    <Eye size={16} style={{ marginRight: "5px" }} /> View
                  </button>
                </td>
                <td>
                  <button
                    className="vendor-view-doc-btn"
                    onClick={() => handleShowBusinessInfo(vendor)}
                  >
                    <Eye size={16} style={{ marginRight: "5px" }} /> View
                  </button>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      className="vendor-view-doc-btn"
                      onClick={() => handleShowDocuments(vendor)}
                    >
                      <Eye size={16} style={{ marginRight: "5px" }} />
                    </button>
                    <button
                      className="vendor-download-doc-btn"
                      onClick={() => handleShowDownloadPopup(vendor)}
                    >
                      <Download size={16} style={{ marginRight: "5px" }} />
                    </button>
                  </div>
                </td>
                <td>
                  {vendor.updated_at || vendor.created_at
                    ? new Date(
                        vendor.updated_at || vendor.created_at
                      ).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <button
                    className="vendor-edit-btn"
                    onClick={() => handleEdit(vendor)}
                    title="Edit Vendor"
                  >
                    <FaPencilAlt size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="vendor-popup-overlay">
          <div className="vendor-popup-form">
            <button className="vendor-popup-close-btn" onClick={togglePopup}>
              ×
            </button>

            <h2 className="vendor-form-title">
              {isEditing ? "Edit Vendor" : "Vendor Registration Form"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="companydetailsfeildset">
                <fieldset>
                  <legend>Company Details</legend>
                  <div className="contact-row four-columns">
                    <div className="contact-field">
                      <label htmlFor="company_name">
                        Company Name:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="company_name"
                        name="company_name"
                        placeholder="Enter Company Name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="city">
                        City:<span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="city"
                        name="city"
                        placeholder="Enter City"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="state">
                        State:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="state"
                        name="state"
                        placeholder="Enter State"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="pin_code">
                        Pin Code:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="pin_code"
                        name="pin_code"
                        placeholder="Enter Pin Code"
                        value={formData.pin_code}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="contact-row four-columns">
                    <div className="contact-field">
                      <label htmlFor="gst_number">
                        GST Number:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="gst_number"
                        name="gst_number"
                        placeholder="Enter GST Number"
                        value={formData.gst_number}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="pan_number">
                        PAN Number:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="pan_number"
                        name="pan_number"
                        placeholder="Enter PAN Number"
                        value={formData.pan_number}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="company_type">
                        Company Type:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="company_type"
                        name="company_type"
                        placeholder="Enter Company Type"
                        value={formData.company_type}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="msme_status">
                        MSME Status:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <select
                        id="msme_status"
                        name="msme_status"
                        value={formData.msme_status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Applicable">Applicable</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </div>
                  </div>
                  <div className="contact-row two-columns">
                    <div className="contact-field">
                      <label htmlFor="registered_address">
                        Registered Address:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="registered_address"
                        name="registered_address"
                        placeholder="Enter Registered Address"
                        value={formData.registered_address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="branch_address">
                        Branch/Manufacturing Address:
                      </label>
                      <input
                        id="branch_address"
                        name="branch_address"
                        placeholder="Enter Branch/Manufacturing Address"
                        value={formData.branch_address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </fieldset>
              </div>

              <div className="contactdetailsfeildset">
                {[1, 2, 3].map((i) => (
                  <fieldset key={i} className="contact-fieldset spaced">
                    <legend>Contact Details - {i}</legend>
                    <div className="contact-row four-columns">
                      <div className="contact-field">
                        <label htmlFor={`contact${i}_name`}>
                          Contact Person Name:
                          {i === 1 ? (
                            <span className="vendor-required-asterisk">*</span>
                          ) : null}
                        </label>
                        <input
                          id={`contact${i}_name`}
                          name={`contact${i}_name`}
                          placeholder="Enter Contact Person Name"
                          value={formData[`contact${i}_name`]}
                          onChange={handleInputChange}
                          required={i === 1}
                        />
                      </div>
                      <div className="contact-field">
                        <label htmlFor={`contact${i}_designation`}>
                          Designation:
                          {i === 1 ? (
                            <span className="vendor-required-asterisk">*</span>
                          ) : null}
                        </label>
                        <input
                          id={`contact${i}_designation`}
                          name={`contact${i}_designation`}
                          placeholder="Enter Designation"
                          value={formData[`contact${i}_designation`]}
                          onChange={handleInputChange}
                          required={i === 1}
                        />
                      </div>
                      <div className="contact-field">
                        <label htmlFor={`contact${i}_mobile`}>
                          Mobile Number:
                          {i === 1 ? (
                            <span className="vendor-required-asterisk">*</span>
                          ) : null}
                        </label>
                        <input
                          id={`contact${i}_mobile`}
                          name={`contact${i}_mobile`}
                          type="tel"
                          maxLength="10"
                          placeholder="Enter 10-digit Mobile Number"
                          value={formData[`contact${i}_mobile`]}
                          onChange={handleInputChange}
                          onBlur={(e) =>
                            validateField(e.target.name, e.target.value, i - 1)
                          }
                          required={i === 1}
                        />
                        {mobileErrors[i - 1] && (
                          <span className="error-message">
                            {mobileErrors[i - 1]}
                          </span>
                        )}
                      </div>
                      <div className="contact-field">
                        <label htmlFor={`contact${i}_email`}>
                          Email ID:
                          {i === 1 ? (
                            <span className="vendor-required-asterisk">*</span>
                          ) : null}
                        </label>
                        <input
                          id={`contact${i}_email`}
                          name={`contact${i}_email`}
                          type="email"
                          placeholder="Enter Email ID"
                          value={formData[`contact${i}_email`]}
                          onChange={handleInputChange}
                          onBlur={(e) =>
                            validateField(e.target.name, e.target.value, i - 1)
                          }
                          required={i === 1}
                        />
                        {emailErrors[i - 1] && (
                          <span className="error-message">
                            {emailErrors[i - 1]}
                          </span>
                        )}
                      </div>
                    </div>
                  </fieldset>
                ))}
              </div>

              <div className="feildsetbankdetails">
                <fieldset>
                  <legend>Bank Details</legend>
                  <div className="contact-row four-columns">
                    <div className="contact-field">
                      <label htmlFor="bank_name">
                        Bank Name:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="bank_name"
                        name="bank_name"
                        placeholder="Enter Bank Name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="branch">
                        Branch:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="branch"
                        name="branch"
                        placeholder="Enter Branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="account_number">
                        Account Number:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="account_number"
                        name="account_number"
                        placeholder="Enter Account Number"
                        value={formData.account_number}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="ifsc_code">
                        IFSC Code:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="ifsc_code"
                        name="ifsc_code"
                        placeholder="Enter IFSC Code"
                        value={formData.ifsc_code}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </fieldset>
              </div>

              <div className="feildsetbusinessinformation">
                <fieldset>
                  <legend>Business Information</legend>
                  <div className="contact-row three-columns">
                    <div className="contact-field">
                      <label htmlFor="nature_of_business">
                        Nature of Business:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="nature_of_business"
                        name="nature_of_business"
                        placeholder="Enter Nature of Business"
                        value={formData.nature_of_business}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="product_category">
                        Category of Products:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="product_category"
                        name="product_category"
                        placeholder="Enter Category of Products/Services"
                        value={formData.product_category}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="years_of_experience">
                        Years of Experience:
                        <span className="vendor-required-asterisk">*</span>
                      </label>
                      <input
                        id="years_of_experience"
                        name="years_of_experience"
                        type="number"
                        min="1"
                        placeholder="Enter Years of Experience"
                        value={formData.years_of_experience}
                        onChange={handleInputChange}
                        required
                      />
                      {error && <span className="error-message">{error}</span>}
                    </div>
                  </div>
                </fieldset>
              </div>

              <fieldset>
                <legend>Documents Required (Attach Copies)</legend>
                <div className="contact-row three-columns">
                  <div className="contact-field">
                    <label htmlFor="gst_certificate">
                      GST Certificate:
                      {!isEditing && (
                        <span className="vendor-required-asterisk">*</span>
                      )}
                    </label>
                    <input
                      id="gst_certificate"
                      type="file"
                      name="gst_certificate"
                      accept=".pdf,.jpg,.png,.jpeg"
                      onChange={handleFileChange}
                      required={!isEditing}
                    />
                  </div>
                  <div className="contact-field">
                    <label htmlFor="pan_card">
                      PAN Card:
                      {!isEditing && (
                        <span className="vendor-required-asterisk">*</span>
                      )}
                    </label>
                    <input
                      id="pan_card"
                      type="file"
                      name="pan_card"
                      accept=".pdf,.jpg,.png,.jpeg"
                      onChange={handleFileChange}
                      required={!isEditing}
                    />
                  </div>
                  <div className="contact-field">
                    <label htmlFor="cancelled_cheque">
                      Cancelled Cheque:
                      {!isEditing && (
                        <span className="vendor-required-asterisk">*</span>
                      )}
                    </label>
                    <input
                      id="cancelled_cheque"
                      type="file"
                      name="cancelled_cheque"
                      accept=".pdf,.jpg,.png,.jpeg"
                      onChange={handleFileChange}
                      required={!isEditing}
                    />
                  </div>
                </div>
                <div className="contact-row two-columns">
                  <div className="contact-field msme-field">
                    <label htmlFor="msme_certificate">
                      MSME Certificate (if applicable):
                    </label>
                    <input
                      id="msme_certificate"
                      type="file"
                      name="msme_certificate"
                      accept=".pdf,.jpg,.png,.jpeg"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="contact-field">
                    <label htmlFor="incorporation_certificate">
                      Company Incorporation Certificate:
                    </label>
                    <input
                      id="incorporation_certificate"
                      type="file"
                      name="incorporation_certificate"
                      accept=".pdf,.jpg,.png,.jpeg"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="vendor-form-buttons">
                <button
                  type="button"
                  onClick={togglePopup}
                  className="vendor-close-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="vendor-submit-btn">
                  {isEditing ? "Update" : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCompanyDetailsPopup && selectedVendor && (
        <div className="vendor-popup-overlay">
          <div className="vendor-popup-box">
            <button
              className="vendor-popup-close-btn"
              onClick={() => setShowCompanyDetailsPopup(false)}
            >
              ×
            </button>
            <h2 className="vendor-popup-title">Company Details</h2>
            <div className="vendor-details-container">
              <table className="details-table">
                <tbody>
                  <tr>
                    <td className="details-label">Company Name</td>
                    <td className="details-value">
                      {selectedVendor.company_name}
                    </td>
                  </tr>
                  <tr>
                    <td className="details-label">Registered Address</td>
                    <td className="details-value">
                      {selectedVendor.registered_address}
                    </td>
                  </tr>
                  <tr>
                    <td className="details-label">
                      Branch/Manufacturing Address
                    </td>
                    <td className="details-value">
                      {selectedVendor.branch_address || "-"}
                    </td>
                  </tr>
                  <tr>
                    <td className="details-label">City</td>
                    <td className="details-value">{selectedVendor.city}</td>
                  </tr>
                  <tr>
                    <td className="details-label">State</td>
                    <td className="details-value">{selectedVendor.state}</td>
                  </tr>
                  <tr>
                    <td className="details-label">Pin Code</td>
                    <td className="details-value">{selectedVendor.pin_code}</td>
                  </tr>
                  <tr>
                    <td className="details-label">GST Number</td>
                    <td className="details-value">
                      {selectedVendor.gst_number}
                    </td>
                  </tr>
                  <tr>
                    <td className="details-label">PAN Number</td>
                    <td className="details-value">
                      {selectedVendor.pan_number}
                    </td>
                  </tr>
                  <tr>
                    <td className="details-label">Company Type</td>
                    <td className="details-value">
                      {selectedVendor.company_type}
                    </td>
                  </tr>
                  <tr>
                    <td className="details-label">MSME Status</td>
                    <td className="details-value">
                      {selectedVendor.msme_status || "Not Applicable"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showContactDetailsPopup && selectedVendor && (
        <div className="vendor-popup-overlay">
          <div className="vendor-popup-box">
            <button
              className="vendor-popup-close-btn"
              onClick={() => setShowContactDetailsPopup(false)}
            >
              ×
            </button>
            <h2 className="vendor-popup-title">Contact Details</h2>
            <div className="contact-grid">
              <div className="grid-label" rowSpan={2}>
                Contact 1
              </div>
              <div className="grid-field">
                Name: {selectedVendor.contact1_name || "-"}
              </div>
              <div className="grid-field">
                Designation: {selectedVendor.contact1_designation || "-"}
              </div>
              <div className="grid-field">
                Email: {selectedVendor.contact1_email || "-"}
              </div>
              <div className="grid-field">
                Mobile: {selectedVendor.contact1_mobile || "-"}
              </div>
              <div className="grid-label">Contact 2</div>
              <div className="grid-field">
                Name: {selectedVendor.contact2_name || "-"}
              </div>
              <div className="grid-field">
                Designation: {selectedVendor.contact2_designation || "-"}
              </div>
              <div className="grid-field">
                Email: {selectedVendor.contact2_email || "-"}
              </div>
              <div className="grid-field">
                Mobile: {selectedVendor.contact2_mobile || "-"}
              </div>
              <div className="grid-label">Contact 3</div>
              <div className="grid-field">
                Name: {selectedVendor.contact3_name || "-"}
              </div>
              <div className="grid-field">
                Designation: {selectedVendor.contact3_designation || "-"}
              </div>
              <div className="grid-field">
                Email: {selectedVendor.contact3_email || "-"}
              </div>
              <div className="grid-field">
                Mobile: {selectedVendor.contact3_mobile || "-"}
              </div>
            </div>
          </div>
        </div>
      )}

      {showBankDetailsPopup && selectedVendor && (
        <div className="vendor-popup-overlay">
          <div className="vendor-popup-box">
            <button
              className="vendor-popup-close-btn"
              onClick={() => setShowBankDetailsPopup(false)}
            >
              ×
            </button>
            <h2 className="vendor-popup-title">Bank Details</h2>
            <div className="vendor-details-container">
              <table className="details-table">
                <tbody>
                  <tr>
                    <td className="details-label">Bank Name</td>
                    <td className="details-value">
                      {selectedVendor.bank_name}
                    </td>
                  </tr>
                  <tr>
                    <td className="details-label">Branch</td>
                    <td className="details-value">{selectedVendor.branch}</td>
                  </tr>
                  <tr>
                    <td className="details-label">Account Number</td>
                    <td className="details-value">
                      {selectedVendor.account_number}
                    </td>
                  </tr>
                  <tr>
                    <td className="details-label">IFSC Code</td>
                    <td className="details-value">
                      {selectedVendor.ifsc_code}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showBusinessInfoPopup && selectedVendor && (
        <div className="vendor-popup-overlay">
          <div className="vendor-popup-box">
            <button
              className="vendor-popup-close-btn"
              onClick={() => setShowBusinessInfoPopup(false)}
            >
              ×
            </button>
            <h2 className="vendor-popup-title">Business Information</h2>
            <div className="vendor-details-container">
              <table className="details-table">
                <tbody>
                  <tr>
                    <td className="details-label">Nature of Business</td>
                    <td className="details-value">
                      {selectedVendor.nature_of_business}
                    </td>
                  </tr>
                  <tr>
                    <td className="details-label">Product Category</td>
                    <td className="details-value">
                      {selectedVendor.product_category}
                    </td>
                  </tr>
                  <tr>
                    <td className="details-label">Years of Experience</td>
                    <td className="details-value">
                      {selectedVendor.years_of_experience}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showDocumentsPopup && selectedVendorFiles && (
        <div className="vendor-popup-overlay">
          <div className="vendor-popup-form documents-popup">
            <button
              className="vendor-popup-close-btn"
              onClick={() => setShowDocumentsPopup(false)}
            >
              ×
            </button>
            <h2 className="vendor-form-title">Vendor Documents (View)</h2>
            <ul className="documents-list">
              <li>
                <span
                  className={
                    selectedVendorFiles.gst_certificate
                      ? "file-link"
                      : "file-link disabled"
                  }
                  onClick={() =>
                    handleViewDocument(selectedVendorFiles.gst_certificate)
                  }
                >
                  GST Certificate
                </span>
              </li>
              <li>
                <span
                  className={
                    selectedVendorFiles.pan_card
                      ? "file-link"
                      : "file-link disabled"
                  }
                  onClick={() =>
                    handleViewDocument(selectedVendorFiles.pan_card)
                  }
                >
                  PAN Card
                </span>
              </li>
              <li>
                <span
                  className={
                    selectedVendorFiles.cancelled_cheque
                      ? "file-link"
                      : "file-link disabled"
                  }
                  onClick={() =>
                    handleViewDocument(selectedVendorFiles.cancelled_cheque)
                  }
                >
                  Cancelled Cheque
                </span>
              </li>
              <li>
                <span
                  className={
                    selectedVendorFiles.msme_certificate
                      ? "file-link"
                      : "file-link disabled"
                  }
                  onClick={() =>
                    handleViewDocument(selectedVendorFiles.msme_certificate)
                  }
                >
                  MSME Certificate
                </span>
              </li>
              <li>
                <span
                  className={
                    selectedVendorFiles.incorporation_certificate
                      ? "file-link"
                      : "file-link disabled"
                  }
                  onClick={() =>
                    handleViewDocument(
                      selectedVendorFiles.incorporation_certificate
                    )
                  }
                >
                  Incorporation Certificate
                </span>
              </li>
            </ul>
            <div className="vendor-form-buttons">
              <button
                className="vendor-submit-btn"
                onClick={() => handleDownloadAll(selectedVendorFiles)}
                disabled={
                  !selectedVendorFiles.gst_certificate &&
                  !selectedVendorFiles.pan_card &&
                  !selectedVendorFiles.cancelled_cheque &&
                  !selectedVendorFiles.msme_certificate &&
                  !selectedVendorFiles.incorporation_certificate
                }
              >
                Download All
              </button>
            </div>
          </div>
        </div>
      )}

      {showDownloadPopup && selectedVendorFiles && (
        <div className="vendor-popup-overlay">
          <div className="vendor-popup-form documents-popup">
            <button
              className="vendor-popup-close-btn"
              onClick={() => setShowDownloadPopup(false)}
            >
              ×
            </button>
            <h2 className="vendor-form-title">Vendor Documents (Download)</h2>
            <ul className="documents-list">
              <li className="document-item">
                <span className="file-name">GST Certificate</span>
                <button
                  className="download-btn"
                  onClick={() =>
                    handleDownloadDocument(selectedVendorFiles.gst_certificate)
                  }
                  disabled={!selectedVendorFiles.gst_certificate}
                >
                  Download
                </button>
              </li>
              <li className="document-item">
                <span className="file-name">PAN Card</span>
                <button
                  className="download-btn"
                  onClick={() =>
                    handleDownloadDocument(selectedVendorFiles.pan_card)
                  }
                  disabled={!selectedVendorFiles.pan_card}
                >
                  Download
                </button>
              </li>
              <li className="document-item">
                <span className="file-name">Cancelled Cheque</span>
                <button
                  className="download-btn"
                  onClick={() =>
                    handleDownloadDocument(selectedVendorFiles.cancelled_cheque)
                  }
                  disabled={!selectedVendorFiles.cancelled_cheque}
                >
                  Download
                </button>
              </li>
              <li className="document-item">
                <span className="file-name">MSME Certificate</span>
                <button
                  className="download-btn"
                  onClick={() =>
                    handleDownloadDocument(selectedVendorFiles.msme_certificate)
                  }
                  disabled={!selectedVendorFiles.msme_certificate}
                >
                  Download
                </button>
              </li>
              <li className="document-item">
                <span className="file-name">Incorporation Certificate</span>
                <button
                  className="download-btn"
                  onClick={() =>
                    handleDownloadDocument(
                      selectedVendorFiles.incorporation_certificate
                    )
                  }
                  disabled={!selectedVendorFiles.incorporation_certificate}
                >
                  Download
                </button>
              </li>
            </ul>
            <div className="vendor-form-buttons">
              <button
                className="vendor-submit-btn"
                onClick={() => handleDownloadAll(selectedVendorFiles)}
                disabled={
                  !selectedVendorFiles.gst_certificate &&
                  !selectedVendorFiles.pan_card &&
                  !selectedVendorFiles.cancelled_cheque &&
                  !selectedVendorFiles.msme_certificate &&
                  !selectedVendorFiles.incorporation_certificate
                }
              >
                Download All
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default Vendors;
