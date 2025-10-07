"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import Modal from "../Modal/Modal.client"; // Import the Modal component
import "./CreateOrganization.css";
import { useAuth } from "../../context/AuthProvider.client"; // <- added

// Custom debounce hook (unchanged)
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// MultiSelectCheckbox component (unchanged)
const MultiSelectCheckbox = ({
  options,
  selectedValues,
  onChange,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter((val) => val !== option)
      : [...selectedValues, option];
    onChange(newValues);
  };

  return (
    <div
      className={`orgprefix-multi-select-container ${
        disabled ? "orgprefix-disabled" : ""
      }`}
    >
      <div
        className="orgprefix-multi-select-header"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => !disabled && e.key === "Enter" && setIsOpen(!isOpen)}
      >
        {selectedValues.length > 0 ? selectedValues.join(", ") : "Select Roles"}
      </div>
      {isOpen && (
        <div className="orgprefix-multi-select-options">
          {options.map((option) => (
            <label key={option} className="orgprefix-multi-select-option">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => toggleOption(option)}
                disabled={disabled}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateOrganization = ({ employeeId: propEmployeeId = null }) => {
  const { user } = useAuth();

  // prefer prop employeeId (from a higher-level prop). fallback to user from useAuth()
  const employeeId = useMemo(() => {
    if (propEmployeeId) return propEmployeeId;
    // user may be null while hydrating — that's ok
    return user?.employeeId ?? user?.id ?? null;
  }, [propEmployeeId, user]);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...(employeeId ? { "x-employee-id": employeeId } : {}),
    }),
    [API_KEY, employeeId]
  );

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOrgId, setCurrentOrgId] = useState(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [noEmployees, setNoEmployees] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [cPanNo, setCPanNo] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sidebarItems, setSidebarItems] = useState([]);
  const [sidebarAccess, setSidebarAccess] = useState([]);
  const [message, setMessage] = useState(""); // For form validation errors
  const [orgTableData, setOrgTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrgData, setFilteredOrgData] = useState([]);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [errors, setErrors] = useState({});
  const [shouldValidate, setShouldValidate] = useState(false);
  // New state for alert modal
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const roles = ["Admin", "Manager", "Employee", "General", "SuperAdmin"];
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Validation functions (unchanged)
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email
      ? regex.test(email)
        ? ""
        : "Please enter a valid email address."
      : "";
  };

  const validateMobileNumber = (phone) => {
    const regex = /^[6-9]\d{9}$/;
    return phone
      ? regex.test(phone)
        ? ""
        : "Please enter a valid 10-digit Indian mobile number."
      : "";
  };

  const validatePanNumber = (pan) => {
    const regex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
    return pan
      ? regex.test(pan)
        ? ""
        : "Please enter a valid PAN number (e.g., ABCDE1234F)."
      : "";
  };

  const validateDates = (start, end) => {
    if (!start || !end) return "";
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    return endDateObj >= startDateObj
      ? ""
      : "End date cannot be before start date.";
  };

  const validateForm = (currentStep) => {
    const newErrors = {};
    let errorMessages = [];

    if (currentStep === 1) {
      newErrors.name = name ? "" : "Organization Name is required.";
      newErrors.subdomain = subdomain ? "" : "Display Name is required.";
      newErrors.noEmployees = noEmployees
        ? ""
        : "Number of Employees is required.";
      newErrors.companyAddress = companyAddress
        ? ""
        : "Company Address is required.";
      newErrors.cPanNo = validatePanNumber(cPanNo);
      newErrors.adminEmail =
        validateEmail(adminEmail) ||
        (adminEmail ? "" : "Admin Email ID is required.");
      newErrors.contactEmail =
        validateEmail(contactEmail) ||
        (contactEmail ? "" : "Contact Email ID is required.");
      newErrors.contactPhone =
        validateMobileNumber(contactPhone) ||
        (contactPhone ? "" : "Contact Phone No is required.");
      newErrors.startDate = startDate ? "" : "Start Date is required.";
      newErrors.endDate =
        validateDates(startDate, endDate) ||
        (endDate ? "" : "End Date is required.");

      errorMessages = Object.entries(newErrors)
        .filter(([_, error]) => error)
        .map(([key, error]) => {
          const fieldNames = {
            name: "Organization Name",
            subdomain: "Display Name",
            noEmployees: "Number of Employees",
            companyAddress: "Company Address",
            cPanNo: "Company PAN No",
            adminEmail: "Admin Email ID",
            adminFirstName: "Admin First Name",
            adminLastName: "Admin Last Name",
            contactEmail: "Contact Email ID",
            contactPhone: "Contact Phone No",
            startDate: "Start Date",
            endDate: "End Date",
          };
          return `${fieldNames[key]}: ${error}`;
        });
    } else if (currentStep === 2) {
      newErrors.sidebarAccess = sidebarAccess.some(
        (access) => access.roles.length > 0
      )
        ? ""
        : "At least one sidebar item must have a role assigned.";
      if (newErrors.sidebarAccess) {
        errorMessages.push(
          "Sidebar Access: At least one sidebar item must have a role assigned."
        );
      }
    }

    setErrors(newErrors);
    setMessage(
      errorMessages.length > 0
        ? `❌ Please fix the following errors:\n${errorMessages.join("\n")}`
        : ""
    );
    return Object.values(newErrors).every((error) => error === "");
  };

  const updateFieldError = (field, value) => {
    let error = "";
    switch (field) {
      case "name":
        error = value ? "" : "Organization Name is required.";
        break;
      case "subdomain":
        error = value ? "" : "Display Name is required.";
        break;
      case "noEmployees":
        error = value ? "" : "Number of Employees is required.";
        break;
      case "companyAddress":
        error = value ? "" : "Company Address is required.";
        break;
      case "cPanNo":
        error = validatePanNumber(value);
        break;
      case "adminEmail":
        error = validateEmail(value);
        break;
      case "contactEmail":
        error = validateEmail(value);
        break;
      case "contactPhone":
        error = validateMobileNumber(value);
        break;
      case "startDate":
        error = value ? "" : "Start Date is required.";
        break;
      case "endDate":
        error =
          validateDates(startDate, value) ||
          (value ? "" : "End Date is required.");
        break;
      case "sidebarAccess":
        error = value.some((access) => access.roles.length > 0)
          ? ""
          : "At least one sidebar item must have a role assigned.";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Show alert modal
  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };

  // Close alert modal
  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  useEffect(() => {
    if (showForm && !isEditing) {
      setStep(1);
      setName("");
      setSubdomain("");
      setNoEmployees("");
      setCompanyAddress("");
      setCPanNo("");
      setAdminEmail("");
      setAdminFirstName("");
      setAdminLastName("");
      setContactEmail("");
      setContactPhone("");
      setStartDate("");
      setEndDate("");
      setSidebarAccess([]);
      setErrors({});
      setMessage("");
      setCurrentOrgId(null);
      setShouldValidate(false);
    }
  }, [showForm, isEditing]);

  // Fetch sidebar menu items
  useEffect(() => {
    const fetchSidebarItems = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/sidebar-menu`, {
          method: "GET",
          headers,
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch sidebar menu items: ${res.status}`);
        }
        const data = await res.json();
        setSidebarItems(data);
        if (!isEditing || sidebarAccess.length === 0) {
          setSidebarAccess(
            data.map((item) => ({ sidebar_item_id: item.id, roles: [] }))
          );
        }
      } catch (err) {
        console.error("Sidebar menu fetch error:", err);
        showAlert(
          "Failed to fetch sidebar menu items. Please try again or contact support.",
          "Error"
        );
        setSidebarItems([]);
        setSidebarAccess([]);
      }
    };

    if (showForm && (step === 2 || isEditing)) {
      fetchSidebarItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, step, isEditing, employeeId, headers, BASE_URL]);

  // Fetch sidebar access for editing
  useEffect(() => {
    const fetchSidebarAccess = async () => {
      if (isEditing && currentOrgId && sidebarItems.length > 0) {
        try {
          const res = await fetch(
            `${BASE_URL}/api/sidebar-access?orgId=${currentOrgId}`,
            {
              method: "GET",
              headers,
            }
          );
          if (!res.ok) {
            throw new Error(`Failed to fetch sidebar access: ${res.status}`);
          }
          const data = await res.json();
          const updatedAccess = sidebarItems.map((item) => {
            const accessRoles = data
              .filter((acc) => acc.sidebar_item_id === item.id)
              .map((acc) => acc.role);
            return {
              sidebar_item_id: item.id,
              roles: accessRoles,
            };
          });
          setSidebarAccess(updatedAccess);
        } catch (err) {
          console.error("Sidebar access fetch error:", err);
          showAlert(
            "Failed to fetch sidebar access. Please try again or contact support.",
            "Error"
          );
        }
      }
    };

    fetchSidebarAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, currentOrgId, sidebarItems, employeeId, headers, BASE_URL]);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/organizations`, {
          headers,
        });
        if (!res.ok)
          throw new Error(`Failed to fetch organizations: ${res.status}`);
        const data = await res.json();
        setOrgTableData(data);
        setFilteredOrgData(data);
      } catch (err) {
        console.error("Organization table fetch error:", err);
        showAlert("Failed to fetch organizations.", "Error");
      }
    };

    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, headers, BASE_URL]);

  // Filter organizations based on search term
  useEffect(() => {
    const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
    const filtered = orgTableData.filter((org) => {
      if (!lowerCaseSearchTerm) return true;
      return (
        org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.id.toString().includes(lowerCaseSearchTerm) ||
        org.admin_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.end_date?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    });
    setFilteredOrgData(filtered);
  }, [debouncedSearchTerm, orgTableData]);

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSidebarRoleChange = (sidebarItemId, selectedRoles) => {
    setSidebarAccess((prev) =>
      prev.map((access) =>
        access.sidebar_item_id === sidebarItemId
          ? { ...access, roles: selectedRoles }
          : access
      )
    );
    if (shouldValidate) {
      updateFieldError("sidebarAccess", [
        ...sidebarAccess.map((access) =>
          access.sidebar_item_id === sidebarItemId
            ? { ...access, roles: selectedRoles }
            : access
        ),
      ]);
    }
  };

  const handleEdit = async (org) => {
    setIsEditing(true);
    setCurrentOrgId(org.id);
    setName(org.Name || "");
    setSubdomain(org.subdomain || "");
    setNoEmployees(org.no_employees || "");
    setCompanyAddress(org.company_address || "");
    setCPanNo(org.c_pan_no || "");
    setAdminEmail(org.admin_email || "");
    setContactEmail(org.contact_email_id || "");
    setContactPhone(org.contact_phone_no || "");
    setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
    setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
    setErrors({});
    setMessage("");
    setStep(1);
    setShouldValidate(true);
    setShowForm(true);
  };

  const handleDelete = async (orgId) => {
    if (!window.confirm("Are you sure you want to delete this organization?"))
      return;

    try {
      const response = await fetch(`${BASE_URL}/api/organizations/${orgId}`, {
        method: "DELETE",
        headers,
      });

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        showAlert(
          `Server returned a non-JSON response (status: ${response.status}). Check the server configuration or URL.`,
          "Error"
        );
        return;
      }

      const data = await response.json();
      if (response.ok) {
        showAlert(
          data.message || "Organization deleted successfully.",
          "Success"
        );
        setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
        setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
      } else {
        showAlert(
          data.message ||
            `Failed to delete organization (status: ${response.status}).`,
          "Error"
        );
      }
    } catch (error) {
      console.error("Delete organization error:", error);
      showAlert(
        `Network error: ${error.message}. Please check your connection or server status.`,
        "Error"
      );
    }
  };

  const handleOpenForm = () => {
    setShowForm(true);
    setIsEditing(false);
    setCurrentOrgId(null);
    setStep(1);
    setName("");
    setSubdomain("");
    setNoEmployees("");
    setCompanyAddress("");
    setCPanNo("");
    setAdminEmail("");
    setContactEmail("");
    setContactPhone("");
    setStartDate("");
    setEndDate("");
    setSidebarAccess([]);
    setErrors({});
    setMessage("");
    setShouldValidate(false);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setShouldValidate(true);
    if (validateForm(1)) {
      setStep(2);
    }
  };

  const handlePrevStep = (e) => {
    e.preventDefault();
    setStep(1);
    setShouldValidate(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setShouldValidate(true);

    if (!validateForm(1) || !validateForm(2)) {
      return;
    }

    const orgData = {
      Name: name,
      subdomain,
      no_employees: parseInt(noEmployees) || 0,
      company_address: companyAddress,
      c_pan_no: cPanNo,
      admin_email: adminEmail,
      contact_email_id: contactEmail,
      contact_phone_no: contactPhone,
      start_date: startDate,
      end_date: endDate,
      first_name: adminFirstName,
      last_name: adminLastName,
    };

    const sidebarAccessData = sidebarAccess.flatMap((access) =>
      access.roles.map((role) => ({
        sidebar_item_id: access.sidebar_item_id,
        role,
      }))
    );

    try {
      const url = isEditing
        ? `${BASE_URL}/api/organizations/${currentOrgId}`
        : `${BASE_URL}/api/organizations`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ orgData, sidebarAccess: sidebarAccessData }),
      });

      const data = await response.json();
      if (response.ok) {
        showAlert(
          `Organization ${isEditing ? "updated" : "created"} successfully.`,
          "Success"
        );
        if (isEditing) {
          setOrgTableData((prev) =>
            prev.map((org) =>
              org.id === currentOrgId ? { ...org, ...orgData } : org
            )
          );
          setFilteredOrgData((prev) =>
            prev.map((org) =>
              org.id === currentOrgId ? { ...org, ...orgData } : org
            )
          );
        } else {
          const res = await fetch(`${BASE_URL}/api/organizations`, {
            headers,
          });
          if (!res.ok)
            throw new Error(`Failed to fetch organizations: ${res.status}`);
          const newData = await res.json();
          setOrgTableData(newData);
          setFilteredOrgData(newData);
        }
        setShowForm(false);
        setIsEditing(false);
        setCurrentOrgId(null);
        setStep(1);
        setName("");
        setSubdomain("");
        setNoEmployees("");
        setCompanyAddress("");
        setCPanNo("");
        setAdminEmail("");
        setContactEmail("");
        setContactPhone("");
        setStartDate("");
        setEndDate("");
        setSidebarAccess([]);
        setErrors({});
        setMessage("");
        setShouldValidate(false);
      } else {
        showAlert(
          data.error ||
            `Failed to ${isEditing ? "update" : "create"} organization.`,
          "Error"
        );
      }
    } catch (error) {
      console.error(
        `${isEditing ? "Update" : "Create"} organization error:`,
        error
      );
      showAlert(`Server error: ${error.message}`, "Error");
    }
  };

  const handleCloseModal = (e) => {
    if (e.target.className.includes("orgprefix-modal-overlay")) {
      setShowForm(false);
      setIsEditing(false);
      setCurrentOrgId(null);
      setStep(1);
      setName("");
      setSubdomain("");
      setNoEmployees("");
      setCompanyAddress("");
      setCPanNo("");
      setAdminEmail("");
      setContactEmail("");
      setContactPhone("");
      setStartDate("");
      setEndDate("");
      setSidebarAccess([]);
      setErrors({});
      setMessage("");
      setShouldValidate(false);
    }
  };

  const formatToIST = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleShowDetails = (org) => {
    setPopupData({
      company_address: org.company_address,
      admin_email: org.admin_email,
      contact_email_id: org.contact_email_id,
      contact_phone_no: org.contact_phone_no,
      start_date: formatToIST(org.start_date),
      end_date: formatToIST(org.end_date),
    });
    setShowDetailsPopup(true);
  };

  const handleCloseDetailsPopup = (e) => {
    if (e.target.className.includes("orgprefix-modal-overlay")) {
      setShowDetailsPopup(false);
      setPopupData(null);
    }
  };

  return (
    <div className="orgprefix-create-org-wrapper">
      <div className="orgprefix-table-header">
        <div className="orgprefix-search-container-org">
          <label className="orgprefix-search-label-org">Search by:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchInputChange}
            placeholder="Name, Id, Email, Date"
            className="orgprefix-search-input"
          />
        </div>
        <button className="orgprefix-open-form-btn" onClick={handleOpenForm}>
          + Add Organization
        </button>
      </div>

      {showForm && (
        <div className="orgprefix-modal-overlay" onClick={handleCloseModal}>
          <div className="orgprefix-create-org-container">
            <div className="orgprefix-form-header">
              <h2>
                {isEditing ? "Edit Organization" : "Create New Organization"}
              </h2>
              <span
                className="orgprefix-close-icon"
                onClick={() => setShowForm(false)}
              >
                ✕
              </span>
            </div>

            <form className="orgprefix-org-form" onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="orgprefix-form-section">
                  <h3>Organization Details</h3>
                  <div className="orgprefix-form-row">
                    <div className="orgprefix-form-field">
                      <label>Organization Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          updateFieldError("name", e.target.value);
                        }}
                      />
                      {errors.name && (
                        <span className="orgprefix-error-message">
                          {errors.name}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>Display Name *</label>
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => {
                          setSubdomain(e.target.value);
                          updateFieldError("subdomain", e.target.value);
                        }}
                      />
                      {errors.subdomain && (
                        <span className="orgprefix-error-message">
                          {errors.subdomain}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>Number of Employees *</label>
                      <input
                        type="number"
                        value={noEmployees}
                        onChange={(e) => {
                          setNoEmployees(e.target.value);
                          updateFieldError("noEmployees", e.target.value);
                        }}
                      />
                      {errors.noEmployees && (
                        <span className="orgprefix-error-message">
                          {errors.noEmployees}
                        </span>
                      )}
                    </div>

                    <div className="orgprefix-form-field">
                      <label>Company Address *</label>
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => {
                          setCompanyAddress(e.target.value);
                          updateFieldError("companyAddress", e.target.value);
                        }}
                      />
                      {errors.companyAddress && (
                        <span className="orgprefix-error-message">
                          {errors.companyAddress}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>Company PAN No *</label>
                      <input
                        type="text"
                        value={cPanNo}
                        onChange={(e) => {
                          setCPanNo(e.target.value.toUpperCase());
                          updateFieldError(
                            "cPanNo",
                            e.target.value.toUpperCase()
                          );
                        }}
                      />
                      {errors.cPanNo && (
                        <span className="orgprefix-error-message">
                          {errors.cPanNo}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>Admin Email ID *</label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => {
                          setAdminEmail(e.target.value);
                          updateFieldError("adminEmail", e.target.value);
                        }}
                      />
                      {errors.adminEmail && (
                        <span className="orgprefix-error-message">
                          {errors.adminEmail}
                        </span>
                      )}
                    </div>

                    <div className="orgprefix-form-field">
                      <label>Admin First Name *</label>
                      <input
                        type="text"
                        value={adminFirstName}
                        onChange={(e) => {
                          setAdminFirstName(e.target.value);
                          updateFieldError("adminFirstName", e.target.value);
                        }}
                      />
                      {errors.adminFirstName && (
                        <span className="orgprefix-error-message">
                          {errors.adminFirstName}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>Admin Last Name*</label>
                      <input
                        type="text"
                        value={adminLastName}
                        onChange={(e) => {
                          setAdminLastName(e.target.value);
                          updateFieldError("adminLastName", e.target.value);
                        }}
                      />
                      {errors.adminLastName && (
                        <span className="orgprefix-error-message">
                          {errors.adminLastName}
                        </span>
                      )}
                    </div>

                    <div className="orgprefix-form-field">
                      <label>Contact Email ID *</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => {
                          setContactEmail(e.target.value);
                          updateFieldError("contactEmail", e.target.value);
                        }}
                      />
                      {errors.contactEmail && (
                        <span className="orgprefix-error-message">
                          {errors.contactEmail}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>Contact Phone No *</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => {
                          setContactPhone(e.target.value);
                          updateFieldError("contactPhone", e.target.value);
                        }}
                      />
                      {errors.contactPhone && (
                        <span className="orgprefix-error-message">
                          {errors.contactPhone}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field orgprefix-date-field">
                      <label>Start Date *</label>
                      <div className="orgprefix-date-input-container">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            updateFieldError("startDate", e.target.value);
                            updateFieldError("endDate", endDate);
                          }}
                        />
                      </div>
                      {errors.startDate && (
                        <span className="orgprefix-error-message">
                          {errors.startDate}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field orgprefix-date-field">
                      <label>End Date *</label>
                      <div className="orgprefix-date-input-container">
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            updateFieldError("endDate", e.target.value);
                          }}
                        />
                      </div>
                      {errors.endDate && (
                        <span className="orgprefix-error-message">
                          {errors.endDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="orgprefix-form-actions">
                    <button
                      type="button"
                      className="orgprefix-cancel-btn"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="orgprefix-next-btn"
                      onClick={handleNextStep}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="orgprefix-form-section orgprefix-split-view">
                  <div className="orgprefix-right-section">
                    <h3>Sidebar Menu Access</h3>
                    <div className="orgprefix-sidebar-access-group">
                      <label>Assign Roles to Sidebar Items *</label>
                      {sidebarItems.length > 0 ? (
                        <div className="orgprefix-sidebar-list">
                          {sidebarItems.map((item) => {
                            const selectedRoles =
                              sidebarAccess.find(
                                (access) => access.sidebar_item_id === item.id
                              )?.roles || [];
                            return (
                              <div
                                key={item.id}
                                className="orgprefix-sidebar-item"
                              >
                                <span className="orgprefix-sidebar-label">
                                  {item.label}
                                </span>
                                <MultiSelectCheckbox
                                  options={roles}
                                  selectedValues={selectedRoles}
                                  onChange={(newRoles) =>
                                    handleSidebarRoleChange(item.id, newRoles)
                                  }
                                  disabled={alertModal.message.includes(
                                    "Failed to fetch sidebar menu items"
                                  )}
                                />
                                {selectedRoles.length > 0 && (
                                  <span className="orgprefix-selected-role-indicator">
                                    Selected: {selectedRoles.join(", ")}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="orgprefix-no-data">
                          {alertModal.message.includes(
                            "Failed to fetch sidebar menu items"
                          )
                            ? "Unable to load sidebar items. Please try again or contact support."
                            : "No sidebar items found."}
                        </p>
                      )}
                      {errors.sidebarAccess && (
                        <span className="orgprefix-error-message">
                          {errors.sidebarAccess}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="orgprefix-form-actions">
                    <button
                      type="button"
                      className="orgprefix-prev-btn"
                      onClick={handlePrevStep}
                    >
                      Previous
                    </button>
                    <button
                      type="submit"
                      className="orgprefix-save-btn"
                      disabled={alertModal.message.includes(
                        "Failed to fetch sidebar menu items"
                      )}
                    >
                      {isEditing ? "Update" : "Save"}
                    </button>
                  </div>
                </div>
              )}

              {message && <p className="orgprefix-message">{message}</p>}
            </form>
          </div>
        </div>
      )}

      {alertModal.isVisible && (
        <Modal
          isVisible={alertModal.isVisible}
          onClose={closeAlert}
          buttons={[{ label: "OK", onClick: closeAlert }]}
        >
          <p>{alertModal.message}</p>
        </Modal>
      )}

      {showDetailsPopup && popupData && (
        <div
          className="orgprefix-modal-overlay"
          onClick={handleCloseDetailsPopup}
        >
          <div className="orgprefix-create-org-container orgprefix-details-container">
            <div className="orgprefix-form-header">
              <h2>Organization Details</h2>
              <span
                className="orgprefix-close-icon"
                onClick={() => setShowDetailsPopup(false)}
              >
                ✕
              </span>
            </div>
            <div className="orgprefix-details-content">
              <p>
                <strong>Address:</strong> {popupData.company_address || "N/A"}
              </p>
              <p>
                <strong>Admin Email:</strong> {popupData.admin_email || "N/A"}
              </p>
              <p>
                <strong>Contact Email:</strong>{" "}
                {popupData.contact_email_id || "N/A"}
              </p>
              <p>
                <strong>Contact Phone:</strong>{" "}
                {popupData.contact_phone_no || "N/A"}
              </p>
              <p>
                <strong>Start Date:</strong> {popupData.start_date || "N/A"}
              </p>
              <p>
                <strong>End Date:</strong> {popupData.end_date || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      {filteredOrgData.length > 0 ? (
        <>
          <div className="orgprefix-mobile-cards">
            {filteredOrgData.map((org) => (
              <div className="orgprefix-org-card" key={org.id}>
                <div className="orgprefix-org-card-header">{org.Name}</div>
                <div className="orgprefix-org-card-content">
                  <strong>ID:</strong> {org.id}
                </div>
                <div className="orgprefix-org-card-content">
                  <strong>Subdomain:</strong> {org.subdomain}
                </div>
                <div className="orgprefix-org-card-content">
                  <strong>No. Employees:</strong> {org.no_employees}
                </div>
                <div className="orgprefix-org-card-actions">
                  <button
                    className="orgprefix-view-btn"
                    onClick={() => handleShowDetails(org)}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  <button
                    className="orgprefix-edit-btn"
                    onClick={() => handleEdit(org)}
                    title="Edit"
                  >
                    <MdEdit />
                  </button>
                  <button
                    className="orgprefix-delete-btn"
                    onClick={() => handleDelete(org.id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="orgprefix-org-table-container">
            <table className="orgprefix-org-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Sub domain</th>
                  <th>No Employees</th>
                  <th>Common Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgData.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <span className="orgprefix-tooltip" title={org.id}>
                        {org.id}
                      </span>
                    </td>
                    <td>
                      <span className="orgprefix-tooltip" title={org.Name}>
                        {org.Name}
                      </span>
                    </td>
                    <td>
                      <span className="orgprefix-tooltip" title={org.subdomain}>
                        {org.subdomain}
                      </span>
                    </td>
                    <td>
                      <span
                        className="orgprefix-tooltip"
                        title={org.no_employees.toString()}
                      >
                        {org.no_employees}
                      </span>
                    </td>
                    <td>
                      <span className="orgprefix-tooltip" title="View Details">
                        <button
                          className="orgprefix-view-btn"
                          onClick={() => handleShowDetails(org)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                      </span>
                    </td>
                    <td>
                      <div className="orgprefix-actions-org">
                        <span className="orgprefix-tooltip" title="Edit">
                          <button
                            className="orgprefix-edit-btn"
                            onClick={() => handleEdit(org)}
                            title="Edit"
                          >
                            <MdEdit />
                          </button>
                        </span>
                        <span className="orgprefix-tooltip" title="Delete">
                          <button
                            className="orgprefix-delete-btn"
                            onClick={() => handleDelete(org.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="orgprefix-no-data-message">
          <p>No organizations found.</p>
        </div>
      )}
    </div>
  );
};

export default CreateOrganization;
