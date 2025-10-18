"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import {
  MdOutlineEdit,
  MdDeleteOutline,
  MdOutlineCancel,
  MdEmojiTransportation,
  MdOutlinePhoneAndroid,
  MdOutlineRemoveRedEye,
} from "react-icons/md";
import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
import { TbTriangleSquareCircle } from "react-icons/tb";
import "./Reimbursement.css";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

const claimTypes = [
  {
    icon: <MdEmojiTransportation className="claim-icons" />,
    label: "Transportation",
  },
  { icon: <GiKnifeFork className="claim-icons" />, label: "Meals" },
  {
    icon: <MdOutlinePhoneAndroid className="claim-icons" />,
    label: "Telecommunication",
  },
  { icon: <GiPencilBrush className="claim-icons" />, label: "Stationary" },
  {
    icon: <TbTriangleSquareCircle className="claim-icons" />,
    label: "Miscellaneous",
  },
];

const Reimbursement = () => {
  const { user } = useAuth();
  const orgId = user?.orgId || user?.org_id || null;
  const role = user?.role || " ";
  const authToken = user?.token;
  const employeeId = user?.employeeId;
  const departmentId = user?.department_id;

  const [reimbursements, setReimbursements] = useState([]);
  const [filteredReimbursements, setFilteredReimbursements] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [transportType, setTransportType] = useState("");
  const [noOfDaysType, setNoOfDaysType] = useState("");
  const [attachments, setAttachments] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [updateErrorMessage, setUpdateErrorMessage] = useState("");
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedSubType, setSelectedSubType] = useState("");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    employeeId: employeeId,
    department_id: departmentId,
    claim_type: "",
    transport_type: "",
    transport_amount: "",
    da: "",
    fromDate: "",
    toDate: "",
    date: "",
    travel_from: "",
    travel_to: "",
    meals_objective: "",
    purpose: "",
    purchasing_item: "",
    accommodation_fees: "",
    no_of_days: "",
    total_amount: "",
    meal_type: "",
    stationary: "",
    service_provider: "",
    project: "",
    attachments: null,
  });

  const formatDisplayDate = (raw) => {
    if (!raw) return "N/A";
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d)) return raw;
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-GB", { month: "short" });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const [confirmModal, setConfirmModal] = useState({
    isVisible: false,
    message: "",
    onConfirm: null,
  });
  const showConfirm = (message, onConfirm) =>
    setConfirmModal({ isVisible: true, message, onConfirm });
  const closeConfirm = () =>
    setConfirmModal({ isVisible: false, message: "", onConfirm: null });

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const fetchReimbursements = useCallback(async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/reimbursement/${employeeId}`,
        {
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "x-org-id": orgId,
          },
        }
      );

      const reimbursementsData = Array.isArray(response.data)
        ? response.data
        : response.data || [];
      setReimbursements(reimbursementsData);

      const attachmentsData = {};
      await Promise.all(
        reimbursementsData.map(async (claim) => {
          try {
            const claimId = claim.id;
            const attachmentResponse = await axios.get(
              `${BACKEND_URL}/reimbursement/${claimId}/attachments`,
              {
                headers: {
                  "x-api-key": API_KEY,
                  Authorization: `Bearer ${authToken}`,
                  "x-org-id": orgId,
                },
              }
            );

            attachmentsData[claimId] = (
              attachmentResponse.data.attachments || []
            ).map((file) => {
              // robustly extract org/year/month/empId from file_path
              const pathParts = (file.file_path || "")
                .split("/")
                .filter(Boolean);
              let orgSeg = "";
              let year = "";
              let month = "";
              let empId = claim.employee_id || claim.employeeId || "";
              const idx = pathParts.findIndex((p) => p === "reimbursement");
              if (idx !== -1 && pathParts.length >= idx + 5) {
                orgSeg = pathParts[idx + 1];
                year = pathParts[idx + 2];
                month = pathParts[idx + 3];
                empId = pathParts[idx + 4] || empId;
              } else {
                // fallback to older layout (no orgId)
                year = pathParts[pathParts.length - 4] || "";
                month = pathParts[pathParts.length - 3] || "";
                empId =
                  pathParts[pathParts.length - 2] ||
                  claim.employee_id ||
                  claim.employeeId ||
                  empId;
              }
              return {
                ...file,
                orgId: orgSeg,
                year,
                month,
                employeeId: empId,
              };
            });
          } catch (err) {
            console.error(
              `Error fetching attachments for claim ${claim.id}`,
              err
            );
            attachmentsData[claim.id] = [];
          }
        })
      );

      setAttachments(attachmentsData);
    } catch (error) {
      console.error("Error fetching reimbursements:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "We ran into a problem fetching reimbursements."
      );
      showAlert(
        error?.response?.data?.message || "Error fetching reimbursements."
      );
    }
  }, [employeeId, authToken, orgId]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/projectdrop`, {
        headers: { "x-api-key": API_KEY, "x-org-id": orgId },
      });
      setProjects(res.data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }, [orgId]);

  useEffect(() => {
    if (!employeeId) return;
    fetchReimbursements();
    fetchProjects();
  }, [fetchReimbursements, fetchProjects, employeeId]);

  const tryParseDate = (s) => {
    if (!s && s !== 0) return null;
    if (s instanceof Date && !isNaN(s)) return s;
    if (typeof s === "number") {
      const d = new Date(s);
      return isNaN(d) ? null : d;
    }
    let str = String(s).trim();
    if (!str) return null;
    str = str.replace(/\s+to\s+/i, " - ");
    str = str.replace(/\u2013|\u2014/g, " - ");
    str = str.replace(/\//g, "-");
    let d = new Date(str);
    if (!isNaN(d)) return d;
    if (str.includes("T")) {
      const [dateOnly] = str.split("T");
      d = new Date(dateOnly);
      if (!isNaN(d)) return d;
    }
    const ddmmyyyy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (ddmmyyyy) {
      const [, dd, mm, yyyy] = ddmmyyyy;
      d = new Date(`${yyyy}-${mm}-${dd}`);
      if (!isNaN(d)) return d;
    }
    return null;
  };

  const normalizeStartOfDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const normalizeEndOfDay = (date) =>
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999
    );

  const parseClaimRange = (claim) => {
    let start = null;
    let end = null;

    if (
      claim.date_range &&
      typeof claim.date_range === "string" &&
      (claim.date_range.includes(" - ") ||
        claim.date_range.toLowerCase().includes(" to ") ||
        claim.date_range.includes("–") ||
        claim.date_range.includes("—"))
    ) {
      const unified = claim.date_range
        .replace(/\s+to\s+/gi, " - ")
        .replace(/\u2013|\u2014/g, " - ");
      const parts = unified.split(" - ").map((p) => p.trim());
      if (parts.length >= 2) {
        const p0 = tryParseDate(parts[0]);
        const p1 = tryParseDate(parts[1]);
        start = p0 || null;
        end = p1 || null;
      }
    }

    if (!start && (claim.from_date || claim.fromDate)) {
      start = tryParseDate(claim.from_date || claim.fromDate);
    }
    if (!end && (claim.to_date || claim.toDate)) {
      end = tryParseDate(claim.to_date || claim.toDate);
    }

    if (!start && claim.date) {
      start = tryParseDate(claim.date);
      end = start;
    }

    if (!start && claim.created_at) {
      const t = tryParseDate(claim.created_at);
      start = t;
      end = t;
    }

    if (start && !end) end = start;

    if (start && end) {
      start = normalizeStartOfDay(start);
      end = normalizeEndOfDay(end);
    }
    return { start, end };
  };

  const applyFilters = useCallback(() => {
    const fRaw = fromDate ? tryParseDate(fromDate) : null;
    const tRaw = toDate ? tryParseDate(toDate) : null;
    const fStart = fRaw ? normalizeStartOfDay(fRaw) : null;
    const tEnd = tRaw ? normalizeEndOfDay(tRaw) : null;

    const filtered = reimbursements.filter((claim) => {
      if (
        statusFilter &&
        claim.status &&
        claim.status.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }

      if (!fStart && !tEnd) return true;

      const { start, end } = parseClaimRange(claim);

      if (!start || !end) {
        return !fStart && !tEnd;
      }

      if (fStart && !tEnd) {
        return end.getTime() >= fStart.getTime();
      }
      if (!fStart && tEnd) {
        return start.getTime() <= tEnd.getTime();
      }
      if (fStart && tEnd) {
        if (end.getTime() < fStart.getTime()) return false;
        if (start.getTime() > tEnd.getTime()) return false;
        return true;
      }

      return true;
    });

    setFilteredReimbursements(filtered);
  }, [reimbursements, fromDate, toDate, statusFilter]);

  useEffect(() => {
    applyFilters();
  }, [reimbursements, fromDate, toDate, statusFilter, applyFilters]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleClaimTypeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, claim_type: value }));
    setSelectedFiles([]);
    setSelectedClaim(null);
    setSelectedSubType("");
  };

  const handleTransportSubTypeChange = (type) => {
    setFormData((prev) => ({ ...prev, transport_type: type }));
    setSelectedSubType(type);
    if (type === "Outstation") {
      setFormData((prev) => ({ ...prev, no_of_days: "" }));
    }
  };

  const handleNoOfDaysChange = (event) =>
    setFormData((prev) => ({ ...prev, no_of_days: event.target.value }));

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files.map((file) => file.name));
    setFormData((prev) => ({ ...prev, attachments: files }));
  };

  const renderDateFields = () => {
    if (formData.transport_type === "Outstation") {
      return (
        <>
          <div className="rb-groups">
            <label>
              From Date<span className="asterisk">*</span>
            </label>
            <input
              type="date"
              name="fromDate"
              value={formData.fromDate}
              onChange={handleChange}
              max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
            />
          </div>
          <div className="rb-groups">
            <label>
              To Date<span className="asterisk">*</span>
            </label>
            <input
              type="date"
              name="toDate"
              value={formData.toDate}
              onChange={handleChange}
              max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
            />
          </div>
        </>
      );
    } else if (formData.no_of_days === "single") {
      return (
        <div className="rb-groups">
          <label>
            Date<span className="asterisk">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
          />
        </div>
      );
    } else if (formData.no_of_days === "multiple") {
      return (
        <>
          <div className="rb-groups">
            <label>
              From Date<span className="asterisk">*</span>
            </label>
            <input
              type="date"
              name="fromDate"
              value={formData.fromDate}
              onChange={handleChange}
              max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
            />
          </div>
          <div className="rb-groups">
            <label>
              To Date<span className="asterisk">*</span>
            </label>
            <input
              type="date"
              name="toDate"
              value={formData.toDate}
              onChange={handleChange}
              max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
            />
          </div>
        </>
      );
    }
    return null;
  };

  const handleEdit = (claim) => {
    setEditingId(claim.id);
    setShowForm(true);
    const existingAttachments = attachments[claim.id] || [];
    setFormData({
      employeeId: claim.employeeId || claim.employee_id || employeeId,
      department_id: claim.department_id || departmentId,
      claim_type: claim.claim_type || "",
      transport_type: claim.transport_type || "",
      fromDate: claim.from_date
        ? claim.from_date.substring(0, 10)
        : claim.fromDate || "",
      toDate: claim.to_date
        ? claim.to_date.substring(0, 10)
        : claim.toDate || "",
      date: claim.date ? claim.date.substring(0, 10) : claim.date || "",
      travel_from: claim.travel_from || "",
      travel_to: claim.travel_to || "",
      meals_objective: claim.meals_objective || "",
      purpose: claim.purpose || "",
      purchasing_item: claim.purchasing_item || "",
      accommodation_fees: claim.accommodation_fees || "",
      transport_amount: claim.transport_amount || "",
      da: claim.da || "",
      no_of_days: claim.no_of_days || "",
      total_amount: claim.total_amount || "",
      meal_type: claim.meal_type || "",
      stationary: claim.stationary || "",
      comments: claim.comments || "",
      service_provider: claim.service_provider || "",
      project: claim.project || "",
      attachments: existingAttachments,
    });
    setSelectedFiles(
      existingAttachments.map((file) => file.file_name || file.name)
    );
    setSelectedSubType(claim.transport_type || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErrorMessage("");
    const wordCount = formData.purpose
      ? formData.purpose.trim().split(/\s+/).filter(Boolean).length
      : 0;
    if (wordCount < 10) {
      showAlert(
        `Purpose Details / Comments must be at least 10 words. You have ${wordCount}.`
      );
      return;
    }
    try {
      const fd = new FormData();
      Object.keys(formData).forEach((k) => {
        if (k === "attachments") return; // handled separately
        const val = formData[k];
        if (val !== null && val !== undefined) fd.append(k, val);
      });

      // append role + orgId
      fd.append("role", role);
      if (orgId) fd.append("orgId", orgId);

      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((file) => {
          if (file instanceof File) {
            fd.append("attachments", file);
          }
        });
      }
      const config = {
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
          "x-org-id": orgId,
        },
      };
      let response;
      if (editingId) {
        response = await axios.put(
          `${BACKEND_URL}/reimbursement/${editingId}`,
          fd,
          config
        );
      } else {
        response = await axios.post(`${BACKEND_URL}/reimbursement`, fd, config);
      }
      showAlert(
        response?.data?.message || "Reimbursement submitted successfully!"
      );
      // reset form
      setFormData({
        employeeId: employeeId,
        department_id: departmentId,
        claim_type: "",
        transport_type: "",
        fromDate: "",
        toDate: "",
        date: "",
        travel_from: "",
        travel_to: "",
        meals_objective: "",
        purpose: "",
        purchasing_item: "",
        accommodation_fees: "",
        no_of_days: "",
        total_amount: "",
        meal_type: "",
        stationary: "",
        service_provider: "",
        project: "",
        attachments: null,
      });
      setShowForm(false);
      setEditingId(null);
      setSelectedFiles([]);
      fetchReimbursements();
    } catch (error) {
      console.error("Error submitting reimbursement:", error);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "An unexpected error occurred.";
      setSubmitErrorMessage(msg);
      showAlert(msg);
    }
  };

  const updateReimbursement = async (reimbursementId, updateData) => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/reimbursement/${reimbursementId}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
            "x-org-id": orgId,
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      console.log("Update Response:", response.data);
      fetchReimbursements();
      return response.data;
    } catch (error) {
      console.error("Error updating reimbursement:", error);
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "An unexpected error occurred.";
      setUpdateErrorMessage(msg);
      showAlert(msg);
      throw error;
    }
  };

  const deleteReimbursement = async (id) => {
    if (!id) {
      console.error("Error: Reimbursement ID is missing.");
      return;
    }
    showConfirm(
      "Are you sure you want to delete this reimbursement claim?",
      async () => {
        try {
          const response = await axios.delete(
            `${BACKEND_URL}/reimbursement/${id}`,
            {
              headers: {
                "x-api-key": API_KEY,
                "x-org-id": orgId,
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          showAlert(
            response.data.message || "Reimbursement deleted successfully!"
          );
          fetchReimbursements();
        } catch (error) {
          console.error("Error deleting reimbursement:", error);
          showAlert("There was an issue deleting the reimbursement.");
        } finally {
          closeConfirm();
        }
      }
    );
  };

  const handleOpenAttachments = async (files, claim) => {
    try {
      const fetchedFiles = await Promise.all(
        (files || []).map(async (file) => {
          if (!file?.file_name && !file?.file_name) return null;
          const fname = file.file_name || file.fileName || file.name;
          const match = fname.match(/^(\d{4})-(\d{2})/);
          if (!match) return null;
          const [, year, month] = match;

          // org/year/month/emp/file_name layout: pick org from file.orgId if available,
          // otherwise try extracting from file_path similarly
          let fileOrg = file.orgId || "";
          if (!fileOrg && file.file_path) {
            const parts = (file.file_path || "").split("/").filter(Boolean);
            const idx = parts.findIndex((p) => p === "reimbursement");
            if (idx !== -1 && parts.length >= idx + 5) {
              fileOrg = parts[idx + 1];
            } else if (parts.length >= 5) {
              // fallback heuristic: org may be at -5
              fileOrg = parts[parts.length - 5] || "";
            }
          }
          // prefer the orgId we have in the client context if nothing extracted
          if (!fileOrg) fileOrg = orgId || "";

          const empId = claim.employee_id || claim.employeeId || "";
          const url = `${BACKEND_URL}/reimbursement/${fileOrg}/${year}/${month}/${empId}/${fname}`;

          const response = await axios.get(url, {
            headers: {
              "x-api-key": API_KEY,
              Authorization: `Bearer ${authToken}`,
              "x-org-id": fileOrg || orgId,
              "x-employee-id": employeeId,
            },
            responseType: "blob",
          });

          return {
            name: fname,
            url: URL.createObjectURL(
              new Blob([response.data], {
                type: response.headers["content-type"],
              })
            ),
          };
        })
      );
      const validFiles = fetchedFiles.filter(Boolean);
      if (!validFiles.length)
        return showAlert("No valid attachments could be loaded.");
      setSelectedFiles(validFiles);
      setSelectedClaim(claim);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      showAlert("Could not load attachments. Please try again.");
    }
  };

  // Use filteredReimbursements (NOT reimbursements) for display and totals
  const filterClaims = filteredReimbursements || [];

  const totalAmount = (filteredReimbursements || []).reduce((sum, claim) => {
    const val = parseFloat(claim.total_amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  const approvedAmount = (filteredReimbursements || [])
    .filter((c) => (c.status || "").toLowerCase() === "approved")
    .reduce((sum, claim) => {
      const val = parseFloat(claim.total_amount);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  const rejectedAmount = (filteredReimbursements || [])
    .filter((c) => (c.status || "").toLowerCase() === "rejected")
    .reduce((sum, claim) => {
      const val = parseFloat(claim.total_amount);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

  const renderClaimSpecificFields = () => {
    switch (formData.claim_type) {
      case "Transportation":
        return (
          <>
            <div className="sub-tabs">
              {["Outstation", "Intercity", "Fuel"].map((type) => (
                <div
                  key={type}
                  className={`sub-tab ${
                    formData.transport_type === type ? "active" : ""
                  }`}
                  onClick={() => handleTransportSubTypeChange(type)}
                >
                  {type}
                </div>
              ))}
            </div>

            {(formData.transport_type === "Intercity" ||
              formData.transport_type === "Fuel") && (
              <div className="rb-radio">
                <label>Select no of days</label>
                <div className="rb-radio-options">
                  <label>
                    <input
                      type="radio"
                      name="no_of_days"
                      value="single"
                      checked={formData.no_of_days === "single"}
                      onChange={handleNoOfDaysChange}
                    />
                    Single
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="no_of_days"
                      value="multiple"
                      checked={formData.no_of_days === "multiple"}
                      onChange={handleNoOfDaysChange}
                    />
                    Multiple
                  </label>
                </div>
              </div>
            )}

            {formData.transport_type && (
              <div className="rb-main-form">
                <div className="rb-form-grid">
                  {renderDateFields()}

                  <div className="rb-groups">
                    <label>
                      Travel From<span className="asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      name="travel_from"
                      value={formData.travel_from}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="rb-groups">
                    <label>
                      Travel To<span className="asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      name="travel_to"
                      value={formData.travel_to}
                      onChange={handleChange}
                    />
                  </div>

                  {formData.transport_type === "Outstation" && (
                    <div className="rb-groups">
                      <label>Transport Amount</label>
                      <input
                        type="number"
                        name="transport_amount"
                        value={formData.transport_amount}
                        onChange={handleChange}
                      />
                    </div>
                  )}

                  {formData.transport_type === "Outstation" && (
                    <div className="rb-groups">
                      <label>Accommodation Fees</label>
                      <input
                        type="number"
                        name="accommodation_fees"
                        value={formData.accommodation_fees}
                        onChange={handleChange}
                      />
                    </div>
                  )}

                  {formData.transport_type === "Outstation" && (
                    <div className="rb-groups">
                      <label>DA</label>
                      <input
                        type="number"
                        name="da"
                        value={formData.da}
                        onChange={handleChange}
                      />
                    </div>
                  )}

                  <div className="rb-groups">
                    <label>
                      Total Amount<span className="asterisk">*</span>
                    </label>
                    <input
                      type="number"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="purpose-attachment">
                  <div className="pa-groups">
                    <label>
                      Purpose Details / Comments
                      <span className="asterisk">*</span>
                    </label>
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="pa-groups">
                    <label>Attachment</label>
                    <div className="attachment-wrapper">
                      <div className="file-links">
                        {selectedFiles.length > 0 ? (
                          selectedFiles.map((fileName, index) => (
                            <p key={index} className="file-name">
                              {fileName}
                            </p>
                          ))
                        ) : (
                          <p>No files selected</p>
                        )}
                      </div>

                      <div className="attachment-upload">
                        <input
                          type="file"
                          multiple
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          style={{ display: "none" }}
                        />
                        <button
                          type="button"
                          className="custom-file-upload"
                          onClick={() =>
                            fileInputRef.current && fileInputRef.current.click()
                          }
                        >
                          Browse
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        );

      case "Meals":
        return (
          <div className="rb-main-form">
            <div className="rb-form1-grid">
              <div className="rb-groups">
                <label>
                  Date<span className="asterisk">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  max={new Date(Date.now() - 86400000).toLocaleDateString(
                    "en-CA"
                  )}
                />
              </div>
              <div className="rb-groups">
                <label>Meal Type</label>
                <select
                  name="meal_type"
                  value={formData.meal_type}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="breakfast">Break Fast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="Full Day">Full Day</option>
                </select>
              </div>
              <div className="rb-groups">
                <label>Meal's objective</label>
                <select
                  name="meals_objective"
                  value={formData.meals_objective}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="client_visit">Client Visit</option>
                  <option value="team_outing">Team Outing</option>
                  <option value="extended_work">Extended</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className="rb-groups">
                <label>
                  Total Amount<span className="asterisk">*</span>
                </label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="purpose-attachment">
              <div className="pa-groups">
                <label>
                  Purpose Details / Comments<span className="asterisk">*</span>
                </label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                />
              </div>

              <div className="pa-groups">
                <label>Attachment</label>
                <div className="attachment-wrapper">
                  <div className="file-links">
                    {selectedFiles.length > 0 ? (
                      selectedFiles.map((fileName, index) => (
                        <p key={index} className="file-name">
                          {fileName}
                        </p>
                      ))
                    ) : (
                      <p>No files selected</p>
                    )}
                  </div>

                  <div className="attachment-upload">
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="custom-file-upload"
                      onClick={() =>
                        fileInputRef.current && fileInputRef.current.click()
                      }
                    >
                      Browse
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Telecommunication":
        return (
          <div className="rb-main-form">
            <div className="rb-form2-grid">
              <div className="rb-groups">
                <label>
                  Date<span className="asterisk">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  max={new Date(Date.now() - 86400000).toLocaleDateString(
                    "en-CA"
                  )}
                />
              </div>
              <div className="rb-groups">
                <label>Service Provider</label>
                <input
                  type="text"
                  name="service_provider"
                  value={formData.service_provider}
                  onChange={handleChange}
                />
              </div>
              <div className="rb-groups">
                <label>
                  Total Amount<span className="asterisk">*</span>
                </label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="purpose-attachment">
              <div className="pa-groups">
                <label>
                  Purpose Details / Comments<span className="asterisk">*</span>
                </label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                />
              </div>

              <div className="pa-groups">
                <label>Attachment</label>
                <div className="attachment-wrapper">
                  <div className="file-links">
                    {selectedFiles.length > 0 ? (
                      selectedFiles.map((fileName, index) => (
                        <p key={index} className="file-name">
                          {fileName}
                        </p>
                      ))
                    ) : (
                      <p>No files selected</p>
                    )}
                  </div>

                  <div className="attachment-upload">
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="custom-file-upload"
                      onClick={() =>
                        fileInputRef.current && fileInputRef.current.click()
                      }
                    >
                      Browse
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Stationary":
        return (
          <div className="rb-main-form">
            <div className="rb-form1-grid">
              <div className="rb-groups">
                <label>
                  Date<span className="asterisk">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  max={new Date(Date.now() - 86400000).toLocaleDateString(
                    "en-CA"
                  )}
                />
              </div>
              <div className="rb-groups">
                <label>Stationary</label>
                <select
                  name="stationary"
                  value={formData.stationary}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="office equipments">Office Equipments</option>
                  <option value="general stationary">General Stationary</option>
                </select>
              </div>
              <div className="rb-groups">
                <label>Purchasing Items</label>
                <input
                  type="text"
                  name="purchasing_item"
                  value={formData.purchasing_item}
                  onChange={handleChange}
                />
              </div>

              <div className="rb-groups">
                <label>
                  Total Amount<span className="asterisk">*</span>
                </label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="purpose-attachment">
              <div className="pa-groups">
                <label>
                  Purpose Details / Comments<span className="asterisk">*</span>
                </label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                />
              </div>

              <div className="pa-groups">
                <label>Attachment</label>
                <div className="attachment-wrapper">
                  <div className="file-links">
                    {selectedFiles.length > 0 ? (
                      selectedFiles.map((fileName, index) => (
                        <p key={index} className="file-name">
                          {fileName}
                        </p>
                      ))
                    ) : (
                      <p>No files selected</p>
                    )}
                  </div>

                  <div className="attachment-upload">
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="custom-file-upload"
                      onClick={() =>
                        fileInputRef.current && fileInputRef.current.click()
                      }
                    >
                      Browse
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Miscellaneous":
        return (
          <div className="rb-main-form">
            <div className="rb-form1-grid">
              <div className="rb-groups">
                <label>
                  Date<span className="asterisk">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  max={new Date(Date.now() - 86400000).toLocaleDateString(
                    "en-CA"
                  )}
                />
              </div>
              <div className="rb-groups">
                <label>
                  Total Amount<span className="asterisk">*</span>
                </label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="purpose-attachment">
              <div className="pa-groups">
                <label>
                  Purpose Details / Comments<span className="asterisk">*</span>
                </label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                />
              </div>

              <div className="pa-groups">
                <label>Attachment</label>
                <div className="attachment-wrapper">
                  <div className="file-links">
                    {selectedFiles.length > 0 ? (
                      selectedFiles.map((fileName, index) => (
                        <p key={index} className="file-name">
                          {fileName}
                        </p>
                      ))
                    ) : (
                      <p>No files selected</p>
                    )}
                  </div>

                  <div className="attachment-upload">
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="custom-file-upload"
                      onClick={() =>
                        fileInputRef.current && fileInputRef.current.click()
                      }
                    >
                      Browse
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ------------ Render ------------
  return (
    <div className="reimbursement-container">
      <div className="rb-form-header">
        {role !== "Manager" && role !== "Admin" && (
          <h2>Reimbursement Requests</h2>
        )}
      </div>

      <div className="filter-container">
        <label>Status By</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <label>Date From</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <label>To</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <button className="search-btn" onClick={applyFilters}>
          <FaSearch /> Search
        </button>

        <button
          className="apply-btn"
          onClick={() => {
            setSubmitErrorMessage("");
            setUpdateErrorMessage("");
            setSelectedFiles([]);
            setShowForm(true);
            setEditingId(null);
            setFormData({
              employeeId,
              department_id: departmentId,
              claim_type: "",
              transport_type: "",
              fromDate: "",
              toDate: "",
              date: "",
              travel_from: "",
              travel_to: "",
              meals_objective: "",
              purpose: "",
              purchasing_item: "",
              accommodation_fees: "",
              no_of_days: "",
              total_amount: "",
              meal_type: "",
              stationary: "",
              service_provider: "",
              project: "",
              attachments: null,
            });
          }}
        >
          Apply Claim
        </button>
      </div>

      {errorMessage && <p className="rb-error-message">{errorMessage}</p>}

      <div className="reimbursement-table-scroll">
        <table className="reimbursement-table">
          <thead>
            <tr>
              <th>Sl No</th>
              <th>Claim Type</th>
              <th>Date</th>
              <th>Purpose</th>
              <th>Amount</th>
              <th>Attachment</th>
              <th>Status</th>
              <th>Comments</th>
              <th>Payment Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filterClaims.map((claim, index) => (
              <tr key={claim.id}>
                <td>{index + 1}</td>
                <td>{claim.claim_type}</td>
                <td>
                  {claim.date_range
                    ? claim.date_range
                        .split(" - ")
                        .map(formatDisplayDate)
                        .join(" - ")
                    : claim.date
                    ? formatDisplayDate(claim.date)
                    : claim.from_date && claim.to_date
                    ? `${formatDisplayDate(
                        claim.from_date
                      )} - ${formatDisplayDate(claim.to_date)}`
                    : "N/A"}
                </td>
                <td>
                  <div className="rbadmin-comments">{claim.purpose}</div>
                </td>
                <td>{claim.total_amount}</td>
                <td>
                  {attachments[claim.id]?.length > 0 ? (
                    <button
                      className="attachments-btn"
                      onClick={() =>
                        handleOpenAttachments(attachments[claim.id], claim)
                      }
                    >
                      <MdOutlineRemoveRedEye className="eye-icon" /> View
                    </button>
                  ) : (
                    "Not Attached"
                  )}
                </td>
                <td>
                  <span
                    className={`rb-status-label ${
                      claim.status === "approved"
                        ? "rb-approved"
                        : claim.status === "rejected"
                        ? "rb-rejected"
                        : ""
                    }`}
                  >
                    {claim.status}
                  </span>
                </td>
                <td>
                  <div className="rbadmin-comments">
                    {claim.approver_comments || "No comments"}
                  </div>
                </td>
                <td>{claim.payment_status}</td>
                <td className="actions-column">
                  <MdOutlineEdit
                    className={`edit-icon ${
                      claim.status && claim.status.toLowerCase() !== "pending"
                        ? "disabled-icon"
                        : ""
                    }`}
                    onClick={() => {
                      if (
                        claim.status &&
                        claim.status.toLowerCase() === "pending"
                      ) {
                        handleEdit(claim);
                        setShowForm(true);
                      }
                    }}
                  />
                  <MdDeleteOutline
                    className={`delete-icon ${
                      claim.status && claim.status.toLowerCase() !== "pending"
                        ? "disabled-icon"
                        : ""
                    }`}
                    onClick={() => {
                      if (
                        claim.status &&
                        claim.status.toLowerCase() === "pending"
                      )
                        deleteReimbursement(claim.id);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td
                colSpan="4"
                style={{
                  textAlign: "right",
                  color: "#949494",
                  fontWeight: "bold",
                }}
              >
                Total Amount Claiming:{" "}
                <span style={{ fontWeight: "bold", color: "black" }}>
                  Rs {totalAmount}
                </span>
              </td>
              <td colSpan="3" style={{ textAlign: "right" }}>
                Amount Approved: Rs{" "}
                <span style={{ fontWeight: "bold" }}>{approvedAmount}</span>
              </td>
              <td colSpan="3" style={{ textAlign: "right" }}>
                Amount Rejected: Rs{" "}
                <span style={{ fontWeight: "bold" }}>{rejectedAmount}</span>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Mobile cards */}
        <div className="rb-reimbursement-cards">
          {filterClaims.map((claim, index) => (
            <div className="rb-reimbursement-card" key={claim.id}>
              <div className="rb-card-header">
                <span className={`rb-status ${claim.status?.toLowerCase()}`}>
                  {claim.status}
                </span>
              </div>
              <div className="rb-card-body">
                <p>
                  <strong>Sl No:</strong> {index + 1}
                </p>
                <p>
                  <strong>Claim Type:</strong> {claim.claim_type}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {claim.date ? formatDisplayDate(claim.date) : "N/A"}
                </p>
                <p>
                  <strong>Purpose:</strong> {claim.purpose}
                </p>
                <p>
                  <strong>Amount:</strong> Rs {claim.total_amount}
                </p>
                <p>
                  <strong>Comments:</strong>{" "}
                  {claim.approver_comments || "No comments"}
                </p>
              </div>
              <div className="rb-card-footer">
                {attachments[claim.id]?.length > 0 ? (
                  <button
                    className="rb-attachments-btn"
                    onClick={() =>
                      handleOpenAttachments(attachments[claim.id], claim)
                    }
                  >
                    <MdOutlineRemoveRedEye className="rb-eye-icon" /> View
                  </button>
                ) : (
                  <span className="rb-no-attachment">No Attachment</span>
                )}
                {claim.status && claim.status.toLowerCase() === "pending" && (
                  <div className="rb-card-actions">
                    <MdOutlineEdit
                      className="rb-edit-icon"
                      onClick={() => {
                        handleEdit(claim);
                        setShowForm(true);
                      }}
                    />
                    <MdDeleteOutline
                      className="rb-delete-icon"
                      onClick={() => deleteReimbursement(claim.id)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="rb-modal">
          <div className="rb-modal-content">
            <div className="claim-form-header">
              <h2 className="claim-form-title">
                {editingId ? "Edit Reimbursement" : "New Reimbursement"}
              </h2>
              <MdOutlineCancel
                className="claim-form-close"
                onClick={() => setShowForm(false)}
              />
            </div>
            {submitErrorMessage && (
              <p className="rb-error-message">{submitErrorMessage}</p>
            )}
            {updateErrorMessage && (
              <p className="rb-error-message">{updateErrorMessage}</p>
            )}
            <form className="reimbursement-form" onSubmit={handleSubmit}>
              <div className="claim-type">
                <label>
                  Project<span className="asterisk">*</span>
                </label>
                <select
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select project</option>
                  <option value="STS CLAIM">STS CLAIM</option>
                  {projects.map((proj, i) => (
                    <option key={i} value={proj}>
                      {proj}
                    </option>
                  ))}
                </select>

                <div className="rb-tabs">
                  {claimTypes.map(({ icon, label }) => (
                    <div
                      key={label}
                      className={`rb-tab ${
                        formData.claim_type === label ? "active" : ""
                      }`}
                      onClick={() =>
                        handleClaimTypeChange({ target: { value: label } })
                      }
                    >
                      {icon} {label}
                    </div>
                  ))}
                </div>
              </div>

              {renderClaimSpecificFields()}

              <div className="reimbursement-form-button">
                <button
                  type="button"
                  className="rb-close"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="rb-submit">
                  {editingId ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachments modal */}
      {isModalOpen && (
        <div className="att-modal-overlay">
          <div className="att-modal-content">
            <div className="att-header">
              <h2>Attachments</h2>
              <MdOutlineCancel
                className="att-close"
                onClick={() => setIsModalOpen(false)}
              />
            </div>
            <h4 className="att-files">
              {selectedClaim?.claim_type
                ? `${selectedClaim.claim_type} Bills`
                : "Bills"}
            </h4>
            {selectedFiles.length > 0 ? (
              selectedFiles.map((file, idx) => (
                <div className="att-files" key={idx}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.name}
                  </a>
                </div>
              ))
            ) : (
              <p>No attachments available</p>
            )}
            <button
              className="att-close-btn"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Modal
        isVisible={confirmModal.isVisible}
        onClose={closeConfirm}
        buttons={[
          { label: "Cancel", onClick: closeConfirm },
          { label: "Confirm", onClick: confirmModal.onConfirm },
        ]}
      >
        <p>{confirmModal.message}</p>
      </Modal>

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

export default Reimbursement;
