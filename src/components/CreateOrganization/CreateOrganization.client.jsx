"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import Modal from "../Modal/Modal.client";
import "./CreateOrganization.css";
import { useAuth } from "../../context/AuthProvider.client";

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

const MultiSelectCheckbox = ({
  options,
  selectedValues,
  onChange,
  disabled,
  isOpen: controlledIsOpen,
  onToggle,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === "boolean" && !!onToggle;
  const isOpen = isControlled ? controlledIsOpen : internalOpen;
  const ref = useRef(null);

  const toggleOption = (option) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter((val) => val !== option)
      : [...selectedValues, option];
    onChange(newValues);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (isControlled) {
      onToggle();
    } else {
      setInternalOpen((v) => !v);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isOpen) return;
      if (ref.current && !ref.current.contains(e.target)) {
        if (isControlled) {
          onToggle();
        } else {
          setInternalOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isControlled, onToggle]);

  return (
    <div
      ref={ref}
      className={`orgprefix-multi-select-container ${
        disabled ? "orgprefix-disabled" : ""
      }`}
    >
      <div
        className="orgprefix-multi-select-header"
        onClick={handleToggle}
        tabIndex={0}
        onKeyDown={(e) => !disabled && e.key === "Enter" && handleToggle()}
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

  const employeeId = useMemo(() => {
    if (propEmployeeId) return propEmployeeId;
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

  const toInputDate = (val) => {
    if (!val && val !== 0) return "";
    if (typeof val === "string") {
      const m = val.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
    }

    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

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
  const [adminDob, setAdminDob] = useState("");
  const [adminAadharNo, setAdminAadharNo] = useState("");
  const [adminPanNo, setAdminPanNo] = useState("");
  const [adminMobileNo, setAdminMobileNo] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sidebarItems, setSidebarItems] = useState([]);
  const [sidebarAccess, setSidebarAccess] = useState([]);
  const [message, setMessage] = useState("");
  const [orgTableData, setOrgTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrgData, setFilteredOrgData] = useState([]);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [errors, setErrors] = useState({});
  const [shouldValidate, setShouldValidate] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const [confirmDelete, setConfirmDelete] = useState({
    isVisible: false,
    orgId: null,
  });

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employeePrefix, setEmployeePrefix] = useState("");

  // ---------------------------
  // ROLES: dynamic fetch (replaces hardcoded roles)
  // ---------------------------
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

  const validatePrefix = (prefix) => {
    const regex = /^[A-Z]{2,4}$/;
    return prefix
      ? regex.test(prefix)
        ? ""
        : "Employee ID prefix must be 2 to 4 uppercase letters."
      : "Employee ID prefix is required.";
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
      newErrors.employeePrefix = validatePrefix(employeePrefix);
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
            employeePrefix: "Employee ID Prefix",
            cPanNo: "Company PAN No",
            adminEmail: "Admin Email ID",
            contactEmail: "Contact Email ID",
            contactPhone: "Contact Phone No",
            startDate: "Start Date",
            endDate: "End Date",
          };
          return `${fieldNames[key] || key}: ${error}`;
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
      case "employeePrefix":
        error = validatePrefix(value);
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  // reset form when opened (same as original)
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
      setAdminDob("");
      setAdminAadharNo("");
      setAdminPanNo("");
      setAdminMobileNo("");
      setContactEmail("");
      setContactPhone("");
      setStartDate("");
      setEndDate("");
      setSidebarAccess([]);
      setErrors({});
      setMessage("");
      setCurrentOrgId(null);
      setShouldValidate(false);
      setOpenDropdownId(null);
      setEmployeePrefix("");
    }
  }, [showForm, isEditing]);

  // ---------------------------
  // Fetch roles dynamically when form opens & step 2 / editing
  // ---------------------------
  useEffect(() => {
    // inside useEffect
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/user_roles`, {
          method: "GET",
          credentials: "include",
          headers,
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch roles: ${res.status}`);
        }
        const payload = await res.json();

        // API returns { status: 'success', data: [ {id, name}, ... ] }
        const list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];

        const extracted = list.map((r) => {
          if (typeof r === "string") return r;
          return r.name || r.role_name || r.role || String(r.id);
        });

        const normalized = Array.from(new Set(extracted.filter(Boolean))).sort(
          (a, b) => a.localeCompare(b)
        );

        setRoles(normalized);
      } catch (err) {
        console.error("Failed to fetch user roles:", err);
        setRoles([]);
        showAlert(
          "Failed to load roles from server. Sidebar-role assignment will be disabled until roles load. Please retry or contact support.",
          "Error"
        );
      } finally {
        setRolesLoading(false);
      }
    };

    // fetch roles when the form is opened and step 2 is shown (or editing an org)
    if (showForm && (step === 2 || isEditing)) {
      fetchRoles();
    }
  }, [showForm, step, isEditing, BASE_URL, headers]);

  // ---------------------------
  // Fetch sidebar items (original behavior) - unchanged
  // ---------------------------
  useEffect(() => {
    const fetchSidebarItems = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/sidebar-menu`, {
          method: "GET",
          credentials: "include",
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
  }, [showForm, step, isEditing, employeeId, headers, BASE_URL]);

  // ---------------------------
  // Fetch sidebar access when editing (original behavior) - unchanged
  // ---------------------------
  useEffect(() => {
    const fetchSidebarAccess = async () => {
      if (isEditing && currentOrgId && sidebarItems.length > 0) {
        try {
          const res = await fetch(
            `${BASE_URL}/api/sidebar-access?orgId=${currentOrgId}`,
            {
              method: "GET",
              credentials: "include",
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
  }, [isEditing, currentOrgId, sidebarItems, employeeId, headers, BASE_URL]);

  // ---------------------------
  // Organizations fetch (unchanged)
  // ---------------------------
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/organizations`, {
          credentials: "include",
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
  }, [employeeId, headers, BASE_URL]);

  useEffect(() => {
    const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
    const filtered = orgTableData.filter((org) => {
      if (!lowerCaseSearchTerm) return true;
      return (
        org.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
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
    setName(org.name || "");
    setSubdomain(org.subdomain || "");
    setNoEmployees(org.no_employees || "");
    setCompanyAddress(org.company_address || "");
    setCPanNo(org.c_pan_no || "");
    setAdminEmail(org.admin_email || "");
    setAdminFirstName(org.first_name || "");
    setAdminLastName(org.last_name || "");
    setAdminDob(toInputDate(org.dob));
    setAdminAadharNo(org.aadhaar_number || "");
    setAdminPanNo(org.pan_number || "");
    setAdminMobileNo(org.phone_number || "");
    setContactEmail(org.contact_email_id || "");
    setContactPhone(org.contact_phone_no || "");
    setStartDate(toInputDate(org.start_date));
    setEndDate(toInputDate(org.end_date));
    setEmployeePrefix(org.employee_prefix || "");
    setErrors({});
    setMessage("");
    setStep(1);
    setShouldValidate(true);
    setShowForm(true);
  };

  const handleDelete = (orgId) => {
    setConfirmDelete({ isVisible: true, orgId });
  };

  const performDelete = async () => {
    const orgId = confirmDelete.orgId;
    setConfirmDelete({ isVisible: false, orgId: null });

    try {
      const response = await fetch(`${BASE_URL}/api/organizations/${orgId}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });

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
    setOpenDropdownId(null);
    setEmployeePrefix("");
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
    if (isSubmitting) return;
    setMessage("");
    setShouldValidate(true);

    if (!validateForm(1) || !validateForm(2)) {
      return;
    }

    setIsSubmitting(true);

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
      dob: adminDob,
      aadhaar_number: adminAadharNo,
      pan_number: adminPanNo,
      phone_number: adminMobileNo,
      employee_prefix: employeePrefix,
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
        credentials: "include",
        body: JSON.stringify({ orgData, sidebarAccess: sidebarAccessData }),
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        data = null;
      }

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
            credentials: "include",
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
        setOpenDropdownId(null);
        setEmployeePrefix("");
      } else {
        const errorMsg =
          (data && (data.message || data.error)) ||
          `Failed to ${isEditing ? "update" : "create"} organization.`;
        showAlert(errorMsg, "Error");
        setMessage(`❌ ${errorMsg}`);
      }
    } catch (error) {
      console.error(
        `${isEditing ? "Update" : "Create"} organization error:`,
        error
      );
      showAlert(`Server error: ${error.message}`, "Error");
    } finally {
      setIsSubmitting(false);
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
      setOpenDropdownId(null);
      setEmployeePrefix("");
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
                  <div className="orgprefix-form-row">
                    <div className="orgprefix-form-field">
                      <label>
                        Organization Name<span className="red">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                      {errors.name && (
                        <span className="orgprefix-error-message">
                          {errors.name}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>
                        Display Name<span className="red">*</span>
                      </label>
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value)}
                        required
                      />
                      {errors.subdomain && (
                        <span className="orgprefix-error-message">
                          {errors.subdomain}
                        </span>
                      )}
                    </div>

                    <div className="orgprefix-form-field">
                      <label>
                        Employee ID Prefix<span className="red">*</span>
                      </label>
                      <input
                        type="text"
                        value={employeePrefix}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().slice(0, 4);
                          setEmployeePrefix(val);
                          if (shouldValidate)
                            updateFieldError("employeePrefix", val);
                        }}
                        pattern="[A-Z]{2,4}"
                        title="2 to 4 uppercase letters"
                        maxLength={4}
                        required
                      />
                      {errors.employeePrefix && (
                        <span className="orgprefix-error-message">
                          {errors.employeePrefix}
                        </span>
                      )}
                    </div>

                    <div className="orgprefix-form-field">
                      <label>
                        Number of Employees<span className="red">*</span>
                      </label>
                      <input
                        type="number"
                        value={noEmployees}
                        onChange={(e) => setNoEmployees(e.target.value)}
                        required
                      />
                      {errors.noEmployees && (
                        <span className="orgprefix-error-message">
                          {errors.noEmployees}
                        </span>
                      )}
                    </div>

                    <div className="orgprefix-form-field">
                      <label>
                        Company Address<span className="red">*</span>
                      </label>
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        required
                      />
                      {errors.companyAddress && (
                        <span className="orgprefix-error-message">
                          {errors.companyAddress}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>
                        Company PAN No<span className="red">*</span>
                      </label>
                      <input
                        type="text"
                        value={cPanNo}
                        onChange={(e) => {
                          const v = e.target.value.toUpperCase();
                          setCPanNo(v);
                          if (shouldValidate) updateFieldError("cPanNo", v);
                        }}
                        required
                      />
                      {errors.cPanNo && (
                        <span className="orgprefix-error-message">
                          {errors.cPanNo}
                        </span>
                      )}
                    </div>

                    <div className="orgprefix-form-field">
                      <label>
                        Contact Email ID<span className="red">*</span>
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => {
                          setContactEmail(e.target.value);
                          if (shouldValidate)
                            updateFieldError("contactEmail", e.target.value);
                        }}
                        required
                      />
                      {errors.contactEmail && (
                        <span className="orgprefix-error-message">
                          {errors.contactEmail}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>
                        Contact Phone No<span className="red">*</span>
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => {
                          setContactPhone(e.target.value);
                          if (shouldValidate)
                            updateFieldError("contactPhone", e.target.value);
                        }}
                        required
                      />
                      {errors.contactPhone && (
                        <span className="orgprefix-error-message">
                          {errors.contactPhone}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field orgprefix-date-field">
                      <label>
                        Start Date<span className="red">*</span>
                      </label>
                      <div className="orgprefix-date-input-container">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            if (shouldValidate)
                              updateFieldError("startDate", e.target.value);
                            if (shouldValidate)
                              updateFieldError("endDate", endDate);
                          }}
                          required
                        />
                      </div>
                      {errors.startDate && (
                        <span className="orgprefix-error-message">
                          {errors.startDate}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field orgprefix-date-field">
                      <label>
                        End Date<span className="red">*</span>
                      </label>
                      <div className="orgprefix-date-input-container">
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            if (shouldValidate)
                              updateFieldError("endDate", e.target.value);
                          }}
                          required
                        />
                      </div>
                      {errors.endDate && (
                        <span className="orgprefix-error-message">
                          {errors.endDate}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>
                        Admin Email ID<span className="red">*</span>
                      </label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => {
                          setAdminEmail(e.target.value);
                          if (shouldValidate)
                            updateFieldError("adminEmail", e.target.value);
                        }}
                        required
                      />
                      {errors.adminEmail && (
                        <span className="orgprefix-error-message">
                          {errors.adminEmail}
                        </span>
                      )}
                    </div>

                    <div className="orgprefix-form-field">
                      <label>
                        Admin First Name<span className="red">*</span>
                      </label>
                      <input
                        type="text"
                        value={adminFirstName}
                        onChange={(e) => setAdminFirstName(e.target.value)}
                        required
                      />
                      {errors.adminFirstName && (
                        <span className="orgprefix-error-message">
                          {errors.adminFirstName}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>
                        Admin Last Name<span className="red">*</span>
                      </label>
                      <input
                        type="text"
                        value={adminLastName}
                        onChange={(e) => setAdminLastName(e.target.value)}
                        required
                      />
                      {errors.adminLastName && (
                        <span className="orgprefix-error-message">
                          {errors.adminLastName}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>
                        Admin Date of Birth<span className="red">*</span>
                      </label>
                      <input
                        type="date"
                        value={adminDob}
                        onChange={(e) => setAdminDob(e.target.value)}
                        required
                      />
                      {errors.adminDob && (
                        <span className="orgprefix-error-message">
                          {errors.adminDob}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>
                        Admin Aadhaar No<span className="red">*</span>
                      </label>
                      <input
                        type="number"
                        value={adminAadharNo}
                        onChange={(e) => setAdminAadharNo(e.target.value)}
                        required
                      />
                      {errors.adminAadharNo && (
                        <span className="orgprefix-error-message">
                          {errors.adminAadharNo}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>
                        Admin Pan No<span className="red">*</span>
                      </label>
                      <input
                        type="text"
                        value={adminPanNo}
                        onChange={(e) => setAdminPanNo(e.target.value)}
                        required
                      />
                      {errors.adminPanNo && (
                        <span className="orgprefix-error-message">
                          {errors.adminPanNo}
                        </span>
                      )}
                    </div>
                    <div className="orgprefix-form-field">
                      <label>
                        Admin Mobile No<span className="red">*</span>
                      </label>
                      <input
                        type="number"
                        value={adminMobileNo}
                        onChange={(e) => setAdminMobileNo(e.target.value)}
                        required
                      />
                      {errors.adminMobileNo && (
                        <span className="orgprefix-error-message">
                          {errors.adminMobileNo}
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
                      <label>
                        Assign Roles to Sidebar Items
                        <span className="red">*</span>
                      </label>
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
                                {selectedRoles.length > 0 && (
                                  <span className="orgprefix-selected-role-indicator">
                                    Selected: {selectedRoles.join(", ")}
                                  </span>
                                )}
                                <MultiSelectCheckbox
                                  options={roles}
                                  selectedValues={selectedRoles}
                                  onChange={(newRoles) =>
                                    handleSidebarRoleChange(item.id, newRoles)
                                  }
                                  disabled={roles.length === 0 || rolesLoading}
                                  isOpen={openDropdownId === item.id}
                                  onToggle={() =>
                                    setOpenDropdownId((prev) =>
                                      prev === item.id ? null : item.id
                                    )
                                  }
                                />
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
                      disabled={isSubmitting || roles.length === 0}
                      title={roles.length === 0 ? "Roles not loaded yet" : ""}
                    >
                      {isSubmitting
                        ? isEditing
                          ? "Updating..."
                          : "Saving..."
                        : isEditing
                        ? "Update"
                        : "Save"}
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

      {confirmDelete.isVisible && (
        <Modal
          isVisible={confirmDelete.isVisible}
          onClose={() => setConfirmDelete({ isVisible: false, orgId: null })}
          buttons={[
            {
              label: "Cancel",
              onClick: () =>
                setConfirmDelete({ isVisible: false, orgId: null }),
            },
            { label: "Delete", onClick: performDelete },
          ]}
        >
          <p>Are you sure you want to delete this organization?</p>
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

      {/* ... rest of table rendering (unchanged from your original) ... */}
      {filteredOrgData.length > 0 ? (
        <>
          <div className="orgprefix-mobile-cards">
            {filteredOrgData.map((org) => (
              <div className="orgprefix-org-card" key={org.id}>
                <div className="orgprefix-org-card-header">{org.name}</div>
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
                      <span className="orgprefix-tooltip" title={org.name}>
                        {org.name}
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
