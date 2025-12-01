// // // // // // // "use client";

// // // // // // // import React, { useState, useEffect, useCallback, useRef } from "react";
// // // // // // // import axios from "axios";
// // // // // // // import { FaSearch } from "react-icons/fa";
// // // // // // // import {
// // // // // // //   MdOutlineEdit,
// // // // // // //   MdDeleteOutline,
// // // // // // //   MdOutlineCancel,
// // // // // // //   MdEmojiTransportation,
// // // // // // //   MdOutlinePhoneAndroid,
// // // // // // //   MdOutlineRemoveRedEye,
// // // // // // // } from "react-icons/md";
// // // // // // // import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
// // // // // // // import { TbTriangleSquareCircle } from "react-icons/tb";
// // // // // // // import "./Reimbursement.css";
// // // // // // // import Modal from "../Modal/Modal.client";
// // // // // // // import { useAuth } from "../../context/AuthProvider.client";

// // // // // // // const claimTypes = [
// // // // // // //   {
// // // // // // //     icon: <MdEmojiTransportation className="claim-icons" />,
// // // // // // //     label: "Transportation",
// // // // // // //   },
// // // // // // //   { icon: <GiKnifeFork className="claim-icons" />, label: "Meals" },
// // // // // // //   {
// // // // // // //     icon: <MdOutlinePhoneAndroid className="claim-icons" />,
// // // // // // //     label: "Telecommunication",
// // // // // // //   },
// // // // // // //   { icon: <GiPencilBrush className="claim-icons" />, label: "Stationary" },
// // // // // // //   {
// // // // // // //     icon: <TbTriangleSquareCircle className="claim-icons" />,
// // // // // // //     label: "Miscellaneous",
// // // // // // //   },
// // // // // // // ];

// // // // // // // const Reimbursement = () => {
// // // // // // //   const { user } = useAuth();
// // // // // // //   const orgId = user?.orgId || user?.org_id || null;
// // // // // // //   const role = user?.role || " ";
// // // // // // //   const authToken = user?.token;
// // // // // // //   const employeeId = user?.employeeId;
// // // // // // //   const departmentId = user?.department_id;

// // // // // // //   const [reimbursements, setReimbursements] = useState([]);
// // // // // // //   const [filteredReimbursements, setFilteredReimbursements] = useState([]);
// // // // // // //   const [fromDate, setFromDate] = useState("");
// // // // // // //   const [toDate, setToDate] = useState("");
// // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // //   const [editingId, setEditingId] = useState(null);
// // // // // // //   const [transportType, setTransportType] = useState("");
// // // // // // //   const [noOfDaysType, setNoOfDaysType] = useState("");
// // // // // // //   const [attachments, setAttachments] = useState({});
// // // // // // //   const [isModalOpen, setIsModalOpen] = useState(false);
// // // // // // //   const [selectedFiles, setSelectedFiles] = useState([]);
// // // // // // //   const [selectedClaim, setSelectedClaim] = useState(null);
// // // // // // //   const [errorMessage, setErrorMessage] = useState("");
// // // // // // //   const [updateErrorMessage, setUpdateErrorMessage] = useState("");
// // // // // // //   const [submitErrorMessage, setSubmitErrorMessage] = useState("");
// // // // // // //   const [projects, setProjects] = useState([]);
// // // // // // //   const [statusFilter, setStatusFilter] = useState("pending");
// // // // // // //   const [selectedSubType, setSelectedSubType] = useState("");

// // // // // // //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
// // // // // // //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// // // // // // //   const fileInputRef = useRef(null);

// // // // // // //   const [formData, setFormData] = useState({
// // // // // // //     employeeId: employeeId,
// // // // // // //     department_id: departmentId,
// // // // // // //     claim_type: "",
// // // // // // //     transport_type: "",
// // // // // // //     transport_amount: "",
// // // // // // //     da: "",
// // // // // // //     fromDate: "",
// // // // // // //     toDate: "",
// // // // // // //     date: "",
// // // // // // //     travel_from: "",
// // // // // // //     travel_to: "",
// // // // // // //     meals_objective: "",
// // // // // // //     purpose: "",
// // // // // // //     purchasing_item: "",
// // // // // // //     accommodation_fees: "",
// // // // // // //     no_of_days: "",
// // // // // // //     total_amount: "",
// // // // // // //     meal_type: "",
// // // // // // //     stationary: "",
// // // // // // //     service_provider: "",
// // // // // // //     project: "",
// // // // // // //     attachments: null,
// // // // // // //   });

// // // // // // //   const formatDisplayDate = (raw) => {
// // // // // // //     if (!raw) return "N/A";
// // // // // // //     const d = raw instanceof Date ? raw : new Date(raw);
// // // // // // //     if (isNaN(d)) return raw;
// // // // // // //     const day = String(d.getDate()).padStart(2, "0");
// // // // // // //     const month = d.toLocaleString("en-GB", { month: "short" });
// // // // // // //     const year = d.getFullYear();
// // // // // // //     return `${day}-${month}-${year}`;
// // // // // // //   };

// // // // // // //   const [confirmModal, setConfirmModal] = useState({
// // // // // // //     isVisible: false,
// // // // // // //     message: "",
// // // // // // //     onConfirm: null,
// // // // // // //   });
// // // // // // //   const showConfirm = (message, onConfirm) =>
// // // // // // //     setConfirmModal({ isVisible: true, message, onConfirm });
// // // // // // //   const closeConfirm = () =>
// // // // // // //     setConfirmModal({ isVisible: false, message: "", onConfirm: null });

// // // // // // //   const [alertModal, setAlertModal] = useState({
// // // // // // //     isVisible: false,
// // // // // // //     title: "",
// // // // // // //     message: "",
// // // // // // //   });
// // // // // // //   const showAlert = (message, title = "") =>
// // // // // // //     setAlertModal({ isVisible: true, title, message });
// // // // // // //   const closeAlert = () =>
// // // // // // //     setAlertModal({ isVisible: false, title: "", message: "" });

// // // // // // //   const fetchReimbursements = useCallback(async () => {
// // // // // // //     try {
// // // // // // //       const response = await axios.get(
// // // // // // //         `${BACKEND_URL}/reimbursement/${employeeId}`,
// // // // // // //         {
// // // // // // //           headers: {
// // // // // // //             "x-api-key": API_KEY,
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             Authorization: `Bearer ${authToken}`,
// // // // // // //             "x-org-id": orgId,
// // // // // // //           },
// // // // // // //         }
// // // // // // //       );

// // // // // // //       const reimbursementsData = Array.isArray(response.data)
// // // // // // //         ? response.data
// // // // // // //         : response.data || [];
// // // // // // //       setReimbursements(reimbursementsData);

// // // // // // //       const attachmentsData = {};
// // // // // // //       await Promise.all(
// // // // // // //         reimbursementsData.map(async (claim) => {
// // // // // // //           try {
// // // // // // //             const claimId = claim.id;
// // // // // // //             const attachmentResponse = await axios.get(
// // // // // // //               `${BACKEND_URL}/reimbursement/${claimId}/attachments`,
// // // // // // //               {
// // // // // // //                 headers: {
// // // // // // //                   "x-api-key": API_KEY,
// // // // // // //                   Authorization: `Bearer ${authToken}`,
// // // // // // //                   "x-org-id": orgId,
// // // // // // //                 },
// // // // // // //               }
// // // // // // //             );

// // // // // // //             attachmentsData[claimId] = (
// // // // // // //               attachmentResponse.data.attachments || []
// // // // // // //             ).map((file) => {
// // // // // // //               // robustly extract org/year/month/empId from file_path
// // // // // // //               const pathParts = (file.file_path || "")
// // // // // // //                 .split("/")
// // // // // // //                 .filter(Boolean);
// // // // // // //               let orgSeg = "";
// // // // // // //               let year = "";
// // // // // // //               let month = "";
// // // // // // //               let empId = claim.employee_id || claim.employeeId || "";
// // // // // // //               const idx = pathParts.findIndex((p) => p === "reimbursement");
// // // // // // //               if (idx !== -1 && pathParts.length >= idx + 5) {
// // // // // // //                 orgSeg = pathParts[idx + 1];
// // // // // // //                 year = pathParts[idx + 2];
// // // // // // //                 month = pathParts[idx + 3];
// // // // // // //                 empId = pathParts[idx + 4] || empId;
// // // // // // //               } else {
// // // // // // //                 // fallback to older layout (no orgId)
// // // // // // //                 year = pathParts[pathParts.length - 4] || "";
// // // // // // //                 month = pathParts[pathParts.length - 3] || "";
// // // // // // //                 empId =
// // // // // // //                   pathParts[pathParts.length - 2] ||
// // // // // // //                   claim.employee_id ||
// // // // // // //                   claim.employeeId ||
// // // // // // //                   empId;
// // // // // // //               }
// // // // // // //               return {
// // // // // // //                 ...file,
// // // // // // //                 orgId: orgSeg,
// // // // // // //                 year,
// // // // // // //                 month,
// // // // // // //                 employeeId: empId,
// // // // // // //               };
// // // // // // //             });
// // // // // // //           } catch (err) {
// // // // // // //             console.error(
// // // // // // //               `Error fetching attachments for claim ${claim.id}`,
// // // // // // //               err
// // // // // // //             );
// // // // // // //             attachmentsData[claim.id] = [];
// // // // // // //           }
// // // // // // //         })
// // // // // // //       );

// // // // // // //       setAttachments(attachmentsData);
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Error fetching reimbursements:", error);
// // // // // // //       setErrorMessage(
// // // // // // //         error?.response?.data?.message ||
// // // // // // //           "We ran into a problem fetching reimbursements."
// // // // // // //       );
// // // // // // //       showAlert(
// // // // // // //         error?.response?.data?.message || "Error fetching reimbursements."
// // // // // // //       );
// // // // // // //     }
// // // // // // //   }, [employeeId, authToken, orgId]);

// // // // // // //   const fetchProjects = useCallback(async () => {
// // // // // // //     try {
// // // // // // //       const res = await axios.get(`${BACKEND_URL}/projectdrop`, {
// // // // // // //         headers: { "x-api-key": API_KEY, "x-org-id": orgId },
// // // // // // //       });
// // // // // // //       setProjects(res.data || []);
// // // // // // //     } catch (err) {
// // // // // // //       console.error("Error fetching projects:", err);
// // // // // // //     }
// // // // // // //   }, [orgId]);

// // // // // // //   useEffect(() => {
// // // // // // //     if (!employeeId) return;
// // // // // // //     fetchReimbursements();
// // // // // // //     fetchProjects();
// // // // // // //   }, [fetchReimbursements, fetchProjects, employeeId]);

// // // // // // //   const tryParseDate = (s) => {
// // // // // // //     if (!s && s !== 0) return null;
// // // // // // //     if (s instanceof Date && !isNaN(s)) return s;
// // // // // // //     if (typeof s === "number") {
// // // // // // //       const d = new Date(s);
// // // // // // //       return isNaN(d) ? null : d;
// // // // // // //     }
// // // // // // //     let str = String(s).trim();
// // // // // // //     if (!str) return null;
// // // // // // //     str = str.replace(/\s+to\s+/i, " - ");
// // // // // // //     str = str.replace(/\u2013|\u2014/g, " - ");
// // // // // // //     str = str.replace(/\//g, "-");
// // // // // // //     let d = new Date(str);
// // // // // // //     if (!isNaN(d)) return d;
// // // // // // //     if (str.includes("T")) {
// // // // // // //       const [dateOnly] = str.split("T");
// // // // // // //       d = new Date(dateOnly);
// // // // // // //       if (!isNaN(d)) return d;
// // // // // // //     }
// // // // // // //     const ddmmyyyy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
// // // // // // //     if (ddmmyyyy) {
// // // // // // //       const [, dd, mm, yyyy] = ddmmyyyy;
// // // // // // //       d = new Date(`${yyyy}-${mm}-${dd}`);
// // // // // // //       if (!isNaN(d)) return d;
// // // // // // //     }
// // // // // // //     return null;
// // // // // // //   };

// // // // // // //   const normalizeStartOfDay = (date) =>
// // // // // // //     new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
// // // // // // //   const normalizeEndOfDay = (date) =>
// // // // // // //     new Date(
// // // // // // //       date.getFullYear(),
// // // // // // //       date.getMonth(),
// // // // // // //       date.getDate(),
// // // // // // //       23,
// // // // // // //       59,
// // // // // // //       59,
// // // // // // //       999
// // // // // // //     );

// // // // // // //   const parseClaimRange = (claim) => {
// // // // // // //     let start = null;
// // // // // // //     let end = null;

// // // // // // //     if (
// // // // // // //       claim.date_range &&
// // // // // // //       typeof claim.date_range === "string" &&
// // // // // // //       (claim.date_range.includes(" - ") ||
// // // // // // //         claim.date_range.toLowerCase().includes(" to ") ||
// // // // // // //         claim.date_range.includes("–") ||
// // // // // // //         claim.date_range.includes("—"))
// // // // // // //     ) {
// // // // // // //       const unified = claim.date_range
// // // // // // //         .replace(/\s+to\s+/gi, " - ")
// // // // // // //         .replace(/\u2013|\u2014/g, " - ");
// // // // // // //       const parts = unified.split(" - ").map((p) => p.trim());
// // // // // // //       if (parts.length >= 2) {
// // // // // // //         const p0 = tryParseDate(parts[0]);
// // // // // // //         const p1 = tryParseDate(parts[1]);
// // // // // // //         start = p0 || null;
// // // // // // //         end = p1 || null;
// // // // // // //       }
// // // // // // //     }

// // // // // // //     if (!start && (claim.from_date || claim.fromDate)) {
// // // // // // //       start = tryParseDate(claim.from_date || claim.fromDate);
// // // // // // //     }
// // // // // // //     if (!end && (claim.to_date || claim.toDate)) {
// // // // // // //       end = tryParseDate(claim.to_date || claim.toDate);
// // // // // // //     }

// // // // // // //     if (!start && claim.date) {
// // // // // // //       start = tryParseDate(claim.date);
// // // // // // //       end = start;
// // // // // // //     }

// // // // // // //     if (!start && claim.created_at) {
// // // // // // //       const t = tryParseDate(claim.created_at);
// // // // // // //       start = t;
// // // // // // //       end = t;
// // // // // // //     }

// // // // // // //     if (start && !end) end = start;

// // // // // // //     if (start && end) {
// // // // // // //       start = normalizeStartOfDay(start);
// // // // // // //       end = normalizeEndOfDay(end);
// // // // // // //     }
// // // // // // //     return { start, end };
// // // // // // //   };

// // // // // // //   const applyFilters = useCallback(() => {
// // // // // // //     const fRaw = fromDate ? tryParseDate(fromDate) : null;
// // // // // // //     const tRaw = toDate ? tryParseDate(toDate) : null;
// // // // // // //     const fStart = fRaw ? normalizeStartOfDay(fRaw) : null;
// // // // // // //     const tEnd = tRaw ? normalizeEndOfDay(tRaw) : null;

// // // // // // //     const filtered = reimbursements.filter((claim) => {
// // // // // // //       if (
// // // // // // //         statusFilter &&
// // // // // // //         claim.status &&
// // // // // // //         claim.status.toLowerCase() !== statusFilter.toLowerCase()
// // // // // // //       ) {
// // // // // // //         return false;
// // // // // // //       }

// // // // // // //       if (!fStart && !tEnd) return true;

// // // // // // //       const { start, end } = parseClaimRange(claim);

// // // // // // //       if (!start || !end) {
// // // // // // //         return !fStart && !tEnd;
// // // // // // //       }

// // // // // // //       if (fStart && !tEnd) {
// // // // // // //         return end.getTime() >= fStart.getTime();
// // // // // // //       }
// // // // // // //       if (!fStart && tEnd) {
// // // // // // //         return start.getTime() <= tEnd.getTime();
// // // // // // //       }
// // // // // // //       if (fStart && tEnd) {
// // // // // // //         if (end.getTime() < fStart.getTime()) return false;
// // // // // // //         if (start.getTime() > tEnd.getTime()) return false;
// // // // // // //         return true;
// // // // // // //       }

// // // // // // //       return true;
// // // // // // //     });

// // // // // // //     setFilteredReimbursements(filtered);
// // // // // // //   }, [reimbursements, fromDate, toDate, statusFilter]);

// // // // // // //   useEffect(() => {
// // // // // // //     applyFilters();
// // // // // // //   }, [reimbursements, fromDate, toDate, statusFilter, applyFilters]);

// // // // // // //   const handleChange = (e) =>
// // // // // // //     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

// // // // // // //   const handleClaimTypeChange = (e) => {
// // // // // // //     const value = e.target.value;
// // // // // // //     setFormData((prev) => ({ ...prev, claim_type: value }));
// // // // // // //     setSelectedFiles([]);
// // // // // // //     setSelectedClaim(null);
// // // // // // //     setSelectedSubType("");
// // // // // // //   };

// // // // // // //   const handleTransportSubTypeChange = (type) => {
// // // // // // //     setFormData((prev) => ({ ...prev, transport_type: type }));
// // // // // // //     setSelectedSubType(type);
// // // // // // //     if (type === "Outstation") {
// // // // // // //       setFormData((prev) => ({ ...prev, no_of_days: "" }));
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleNoOfDaysChange = (event) =>
// // // // // // //     setFormData((prev) => ({ ...prev, no_of_days: event.target.value }));

// // // // // // //   const handleFileUpload = (e) => {
// // // // // // //     const files = Array.from(e.target.files || []);
// // // // // // //     setSelectedFiles(files.map((file) => file.name));
// // // // // // //     setFormData((prev) => ({ ...prev, attachments: files }));
// // // // // // //   };

// // // // // // //   const renderDateFields = () => {
// // // // // // //     if (formData.transport_type === "Outstation") {
// // // // // // //       return (
// // // // // // //         <>
// // // // // // //           <div className="rb-groups">
// // // // // // //             <label>
// // // // // // //               From Date<span className="asterisk">*</span>
// // // // // // //             </label>
// // // // // // //             <input
// // // // // // //               type="date"
// // // // // // //               name="fromDate"
// // // // // // //               value={formData.fromDate}
// // // // // // //               onChange={handleChange}
// // // // // // //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// // // // // // //             />
// // // // // // //           </div>
// // // // // // //           <div className="rb-groups">
// // // // // // //             <label>
// // // // // // //               To Date<span className="asterisk">*</span>
// // // // // // //             </label>
// // // // // // //             <input
// // // // // // //               type="date"
// // // // // // //               name="toDate"
// // // // // // //               value={formData.toDate}
// // // // // // //               onChange={handleChange}
// // // // // // //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// // // // // // //             />
// // // // // // //           </div>
// // // // // // //         </>
// // // // // // //       );
// // // // // // //     } else if (formData.no_of_days === "single") {
// // // // // // //       return (
// // // // // // //         <div className="rb-groups">
// // // // // // //           <label>
// // // // // // //             Date<span className="asterisk">*</span>
// // // // // // //           </label>
// // // // // // //           <input
// // // // // // //             type="date"
// // // // // // //             name="date"
// // // // // // //             value={formData.date}
// // // // // // //             onChange={handleChange}
// // // // // // //             max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// // // // // // //           />
// // // // // // //         </div>
// // // // // // //       );
// // // // // // //     } else if (formData.no_of_days === "multiple") {
// // // // // // //       return (
// // // // // // //         <>
// // // // // // //           <div className="rb-groups">
// // // // // // //             <label>
// // // // // // //               From Date<span className="asterisk">*</span>
// // // // // // //             </label>
// // // // // // //             <input
// // // // // // //               type="date"
// // // // // // //               name="fromDate"
// // // // // // //               value={formData.fromDate}
// // // // // // //               onChange={handleChange}
// // // // // // //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// // // // // // //             />
// // // // // // //           </div>
// // // // // // //           <div className="rb-groups">
// // // // // // //             <label>
// // // // // // //               To Date<span className="asterisk">*</span>
// // // // // // //             </label>
// // // // // // //             <input
// // // // // // //               type="date"
// // // // // // //               name="toDate"
// // // // // // //               value={formData.toDate}
// // // // // // //               onChange={handleChange}
// // // // // // //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// // // // // // //             />
// // // // // // //           </div>
// // // // // // //         </>
// // // // // // //       );
// // // // // // //     }
// // // // // // //     return null;
// // // // // // //   };

// // // // // // //   const handleEdit = (claim) => {
// // // // // // //     setEditingId(claim.id);
// // // // // // //     setShowForm(true);
// // // // // // //     const existingAttachments = attachments[claim.id] || [];
// // // // // // //     setFormData({
// // // // // // //       employeeId: claim.employeeId || claim.employee_id || employeeId,
// // // // // // //       department_id: claim.department_id || departmentId,
// // // // // // //       claim_type: claim.claim_type || "",
// // // // // // //       transport_type: claim.transport_type || "",
// // // // // // //       fromDate: claim.from_date
// // // // // // //         ? claim.from_date.substring(0, 10)
// // // // // // //         : claim.fromDate || "",
// // // // // // //       toDate: claim.to_date
// // // // // // //         ? claim.to_date.substring(0, 10)
// // // // // // //         : claim.toDate || "",
// // // // // // //       date: claim.date ? claim.date.substring(0, 10) : claim.date || "",
// // // // // // //       travel_from: claim.travel_from || "",
// // // // // // //       travel_to: claim.travel_to || "",
// // // // // // //       meals_objective: claim.meals_objective || "",
// // // // // // //       purpose: claim.purpose || "",
// // // // // // //       purchasing_item: claim.purchasing_item || "",
// // // // // // //       accommodation_fees: claim.accommodation_fees || "",
// // // // // // //       transport_amount: claim.transport_amount || "",
// // // // // // //       da: claim.da || "",
// // // // // // //       no_of_days: claim.no_of_days || "",
// // // // // // //       total_amount: claim.total_amount || "",
// // // // // // //       meal_type: claim.meal_type || "",
// // // // // // //       stationary: claim.stationary || "",
// // // // // // //       comments: claim.comments || "",
// // // // // // //       service_provider: claim.service_provider || "",
// // // // // // //       project: claim.project || "",
// // // // // // //       attachments: existingAttachments,
// // // // // // //     });
// // // // // // //     setSelectedFiles(
// // // // // // //       existingAttachments.map((file) => file.file_name || file.name)
// // // // // // //     );
// // // // // // //     setSelectedSubType(claim.transport_type || "");
// // // // // // //   };

// // // // // // //   const handleSubmit = async (e) => {
// // // // // // //     e.preventDefault();
// // // // // // //     setSubmitErrorMessage("");
// // // // // // //     const wordCount = formData.purpose
// // // // // // //       ? formData.purpose.trim().split(/\s+/).filter(Boolean).length
// // // // // // //       : 0;
// // // // // // //     if (wordCount < 10) {
// // // // // // //       showAlert(
// // // // // // //         `Purpose Details / Comments must be at least 10 words. You have ${wordCount}.`
// // // // // // //       );
// // // // // // //       return;
// // // // // // //     }
// // // // // // //     try {
// // // // // // //       const fd = new FormData();
// // // // // // //       Object.keys(formData).forEach((k) => {
// // // // // // //         if (k === "attachments") return; // handled separately
// // // // // // //         const val = formData[k];
// // // // // // //         if (val !== null && val !== undefined) fd.append(k, val);
// // // // // // //       });

// // // // // // //       // append role + orgId
// // // // // // //       fd.append("role", role);
// // // // // // //       if (orgId) fd.append("orgId", orgId);

// // // // // // //       if (formData.attachments && formData.attachments.length > 0) {
// // // // // // //         formData.attachments.forEach((file) => {
// // // // // // //           if (file instanceof File) {
// // // // // // //             fd.append("attachments", file);
// // // // // // //           }
// // // // // // //         });
// // // // // // //       }
// // // // // // //       const config = {
// // // // // // //         headers: {
// // // // // // //           "x-api-key": API_KEY,
// // // // // // //           "Content-Type": "multipart/form-data",
// // // // // // //           Authorization: `Bearer ${authToken}`,
// // // // // // //           "x-org-id": orgId,
// // // // // // //         },
// // // // // // //       };
// // // // // // //       let response;
// // // // // // //       if (editingId) {
// // // // // // //         response = await axios.put(
// // // // // // //           `${BACKEND_URL}/reimbursement/${editingId}`,
// // // // // // //           fd,
// // // // // // //           config
// // // // // // //         );
// // // // // // //       } else {
// // // // // // //         response = await axios.post(`${BACKEND_URL}/reimbursement`, fd, config);
// // // // // // //       }
// // // // // // //       showAlert(
// // // // // // //         response?.data?.message || "Reimbursement submitted successfully!"
// // // // // // //       );
// // // // // // //       // reset form
// // // // // // //       setFormData({
// // // // // // //         employeeId: employeeId,
// // // // // // //         department_id: departmentId,
// // // // // // //         claim_type: "",
// // // // // // //         transport_type: "",
// // // // // // //         fromDate: "",
// // // // // // //         toDate: "",
// // // // // // //         date: "",
// // // // // // //         travel_from: "",
// // // // // // //         travel_to: "",
// // // // // // //         meals_objective: "",
// // // // // // //         purpose: "",
// // // // // // //         purchasing_item: "",
// // // // // // //         accommodation_fees: "",
// // // // // // //         no_of_days: "",
// // // // // // //         total_amount: "",
// // // // // // //         meal_type: "",
// // // // // // //         stationary: "",
// // // // // // //         service_provider: "",
// // // // // // //         project: "",
// // // // // // //         attachments: null,
// // // // // // //       });
// // // // // // //       setShowForm(false);
// // // // // // //       setEditingId(null);
// // // // // // //       setSelectedFiles([]);
// // // // // // //       fetchReimbursements();
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Error submitting reimbursement:", error);
// // // // // // //       const msg =
// // // // // // //         error?.response?.data?.error ||
// // // // // // //         error?.response?.data?.message ||
// // // // // // //         "An unexpected error occurred.";
// // // // // // //       setSubmitErrorMessage(msg);
// // // // // // //       showAlert(msg);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const updateReimbursement = async (reimbursementId, updateData) => {
// // // // // // //     try {
// // // // // // //       const response = await axios.put(
// // // // // // //         `${BACKEND_URL}/reimbursement/${reimbursementId}`,
// // // // // // //         updateData,
// // // // // // //         {
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": API_KEY,
// // // // // // //             "x-org-id": orgId,
// // // // // // //             Authorization: `Bearer ${authToken}`,
// // // // // // //           },
// // // // // // //         }
// // // // // // //       );

// // // // // // //       fetchReimbursements();
// // // // // // //       return response.data;
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Error updating reimbursement:", error);
// // // // // // //       const msg =
// // // // // // //         error?.response?.data?.message ||
// // // // // // //         error.message ||
// // // // // // //         "An unexpected error occurred.";
// // // // // // //       setUpdateErrorMessage(msg);
// // // // // // //       showAlert(msg);
// // // // // // //       throw error;
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const deleteReimbursement = async (id) => {
// // // // // // //     if (!id) {
// // // // // // //       console.error("Error: Reimbursement ID is missing.");
// // // // // // //       return;
// // // // // // //     }
// // // // // // //     showConfirm(
// // // // // // //       "Are you sure you want to delete this reimbursement claim?",
// // // // // // //       async () => {
// // // // // // //         try {
// // // // // // //           const response = await axios.delete(
// // // // // // //             `${BACKEND_URL}/reimbursement/${id}`,
// // // // // // //             {
// // // // // // //               headers: {
// // // // // // //                 "x-api-key": API_KEY,
// // // // // // //                 "x-org-id": orgId,
// // // // // // //                 Authorization: `Bearer ${authToken}`,
// // // // // // //               },
// // // // // // //             }
// // // // // // //           );
// // // // // // //           showAlert(
// // // // // // //             response.data.message || "Reimbursement deleted successfully!"
// // // // // // //           );
// // // // // // //           fetchReimbursements();
// // // // // // //         } catch (error) {
// // // // // // //           console.error("Error deleting reimbursement:", error);
// // // // // // //           showAlert("There was an issue deleting the reimbursement.");
// // // // // // //         } finally {
// // // // // // //           closeConfirm();
// // // // // // //         }
// // // // // // //       }
// // // // // // //     );
// // // // // // //   };

// // // // // // //   const handleOpenAttachments = async (files, claim) => {
// // // // // // //     try {
// // // // // // //       const fetchedFiles = await Promise.all(
// // // // // // //         (files || []).map(async (file) => {
// // // // // // //           if (!file?.file_name && !file?.file_name) return null;
// // // // // // //           const fname = file.file_name || file.fileName || file.name;
// // // // // // //           const match = fname.match(/^(\d{4})-(\d{2})/);
// // // // // // //           if (!match) return null;
// // // // // // //           const [, year, month] = match;

// // // // // // //           // org/year/month/emp/file_name layout: pick org from file.orgId if available,
// // // // // // //           // otherwise try extracting from file_path similarly
// // // // // // //           let fileOrg = file.orgId || "";
// // // // // // //           if (!fileOrg && file.file_path) {
// // // // // // //             const parts = (file.file_path || "").split("/").filter(Boolean);
// // // // // // //             const idx = parts.findIndex((p) => p === "reimbursement");
// // // // // // //             if (idx !== -1 && parts.length >= idx + 5) {
// // // // // // //               fileOrg = parts[idx + 1];
// // // // // // //             } else if (parts.length >= 5) {
// // // // // // //               // fallback heuristic: org may be at -5
// // // // // // //               fileOrg = parts[parts.length - 5] || "";
// // // // // // //             }
// // // // // // //           }
// // // // // // //           // prefer the orgId we have in the client context if nothing extracted
// // // // // // //           if (!fileOrg) fileOrg = orgId || "";

// // // // // // //           const empId = claim.employee_id || claim.employeeId || "";
// // // // // // //           const url = `${BACKEND_URL}/reimbursement/${fileOrg}/${year}/${month}/${empId}/${fname}`;

// // // // // // //           const response = await axios.get(url, {
// // // // // // //             headers: {
// // // // // // //               "x-api-key": API_KEY,
// // // // // // //               Authorization: `Bearer ${authToken}`,
// // // // // // //               "x-org-id": fileOrg || orgId,
// // // // // // //               "x-employee-id": employeeId,
// // // // // // //             },
// // // // // // //             responseType: "blob",
// // // // // // //           });

// // // // // // //           return {
// // // // // // //             name: fname,
// // // // // // //             url: URL.createObjectURL(
// // // // // // //               new Blob([response.data], {
// // // // // // //                 type: response.headers["content-type"],
// // // // // // //               })
// // // // // // //             ),
// // // // // // //           };
// // // // // // //         })
// // // // // // //       );
// // // // // // //       const validFiles = fetchedFiles.filter(Boolean);
// // // // // // //       if (!validFiles.length)
// // // // // // //         return showAlert("No valid attachments could be loaded.");
// // // // // // //       setSelectedFiles(validFiles);
// // // // // // //       setSelectedClaim(claim);
// // // // // // //       setIsModalOpen(true);
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Error fetching attachments:", error);
// // // // // // //       showAlert("Could not load attachments. Please try again.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   // Use filteredReimbursements (NOT reimbursements) for display and totals
// // // // // // //   const filterClaims = filteredReimbursements || [];

// // // // // // //   const totalAmount = (filteredReimbursements || []).reduce((sum, claim) => {
// // // // // // //     const val = parseFloat(claim.total_amount);
// // // // // // //     return sum + (isNaN(val) ? 0 : val);
// // // // // // //   }, 0);
// // // // // // //   const approvedAmount = (filteredReimbursements || [])
// // // // // // //     .filter((c) => (c.status || "").toLowerCase() === "approved")
// // // // // // //     .reduce((sum, claim) => {
// // // // // // //       const val = parseFloat(claim.total_amount);
// // // // // // //       return sum + (isNaN(val) ? 0 : val);
// // // // // // //     }, 0);
// // // // // // //   const rejectedAmount = (filteredReimbursements || [])
// // // // // // //     .filter((c) => (c.status || "").toLowerCase() === "rejected")
// // // // // // //     .reduce((sum, claim) => {
// // // // // // //       const val = parseFloat(claim.total_amount);
// // // // // // //       return sum + (isNaN(val) ? 0 : val);
// // // // // // //     }, 0);

// // // // // // //   const renderClaimSpecificFields = () => {
// // // // // // //     switch (formData.claim_type) {
// // // // // // //       case "Transportation":
// // // // // // //         return (
// // // // // // //           <>
// // // // // // //             <div className="sub-tabs">
// // // // // // //               {["Outstation", "Intercity", "Fuel"].map((type) => (
// // // // // // //                 <div
// // // // // // //                   key={type}
// // // // // // //                   className={`sub-tab ${
// // // // // // //                     formData.transport_type === type ? "active" : ""
// // // // // // //                   }`}
// // // // // // //                   onClick={() => handleTransportSubTypeChange(type)}
// // // // // // //                 >
// // // // // // //                   {type}
// // // // // // //                 </div>
// // // // // // //               ))}
// // // // // // //             </div>

// // // // // // //             {(formData.transport_type === "Intercity" ||
// // // // // // //               formData.transport_type === "Fuel") && (
// // // // // // //               <div className="rb-radio">
// // // // // // //                 <label>Select no of days</label>
// // // // // // //                 <div className="rb-radio-options">
// // // // // // //                   <label>
// // // // // // //                     <input
// // // // // // //                       type="radio"
// // // // // // //                       name="no_of_days"
// // // // // // //                       value="single"
// // // // // // //                       checked={formData.no_of_days === "single"}
// // // // // // //                       onChange={handleNoOfDaysChange}
// // // // // // //                     />
// // // // // // //                     Single
// // // // // // //                   </label>

// // // // // // //                   <label>
// // // // // // //                     <input
// // // // // // //                       type="radio"
// // // // // // //                       name="no_of_days"
// // // // // // //                       value="multiple"
// // // // // // //                       checked={formData.no_of_days === "multiple"}
// // // // // // //                       onChange={handleNoOfDaysChange}
// // // // // // //                     />
// // // // // // //                     Multiple
// // // // // // //                   </label>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             )}

// // // // // // //             {formData.transport_type && (
// // // // // // //               <div className="rb-main-form">
// // // // // // //                 <div className="rb-form-grid">
// // // // // // //                   {renderDateFields()}

// // // // // // //                   <div className="rb-groups">
// // // // // // //                     <label>
// // // // // // //                       Travel From<span className="asterisk">*</span>
// // // // // // //                     </label>
// // // // // // //                     <input
// // // // // // //                       type="text"
// // // // // // //                       name="travel_from"
// // // // // // //                       value={formData.travel_from}
// // // // // // //                       onChange={handleChange}
// // // // // // //                     />
// // // // // // //                   </div>
// // // // // // //                   <div className="rb-groups">
// // // // // // //                     <label>
// // // // // // //                       Travel To<span className="asterisk">*</span>
// // // // // // //                     </label>
// // // // // // //                     <input
// // // // // // //                       type="text"
// // // // // // //                       name="travel_to"
// // // // // // //                       value={formData.travel_to}
// // // // // // //                       onChange={handleChange}
// // // // // // //                     />
// // // // // // //                   </div>

// // // // // // //                   {formData.transport_type === "Outstation" && (
// // // // // // //                     <div className="rb-groups">
// // // // // // //                       <label>Transport Amount</label>
// // // // // // //                       <input
// // // // // // //                         type="number"
// // // // // // //                         name="transport_amount"
// // // // // // //                         value={formData.transport_amount}
// // // // // // //                         onChange={handleChange}
// // // // // // //                       />
// // // // // // //                     </div>
// // // // // // //                   )}

// // // // // // //                   {formData.transport_type === "Outstation" && (
// // // // // // //                     <div className="rb-groups">
// // // // // // //                       <label>Accommodation Fees</label>
// // // // // // //                       <input
// // // // // // //                         type="number"
// // // // // // //                         name="accommodation_fees"
// // // // // // //                         value={formData.accommodation_fees}
// // // // // // //                         onChange={handleChange}
// // // // // // //                       />
// // // // // // //                     </div>
// // // // // // //                   )}

// // // // // // //                   {formData.transport_type === "Outstation" && (
// // // // // // //                     <div className="rb-groups">
// // // // // // //                       <label>DA</label>
// // // // // // //                       <input
// // // // // // //                         type="number"
// // // // // // //                         name="da"
// // // // // // //                         value={formData.da}
// // // // // // //                         onChange={handleChange}
// // // // // // //                       />
// // // // // // //                     </div>
// // // // // // //                   )}

// // // // // // //                   <div className="rb-groups">
// // // // // // //                     <label>
// // // // // // //                       Total Amount<span className="asterisk">*</span>
// // // // // // //                     </label>
// // // // // // //                     <input
// // // // // // //                       type="number"
// // // // // // //                       name="total_amount"
// // // // // // //                       value={formData.total_amount}
// // // // // // //                       onChange={handleChange}
// // // // // // //                     />
// // // // // // //                   </div>
// // // // // // //                 </div>

// // // // // // //                 <div className="purpose-attachment">
// // // // // // //                   <div className="pa-groups">
// // // // // // //                     <label>
// // // // // // //                       Purpose Details / Comments
// // // // // // //                       <span className="asterisk">*</span>
// // // // // // //                     </label>
// // // // // // //                     <textarea
// // // // // // //                       name="purpose"
// // // // // // //                       value={formData.purpose}
// // // // // // //                       onChange={handleChange}
// // // // // // //                     />
// // // // // // //                   </div>

// // // // // // //                   <div className="pa-groups">
// // // // // // //                     <label>Attachment</label>
// // // // // // //                     <div className="attachment-wrapper">
// // // // // // //                       <div className="file-links">
// // // // // // //                         {selectedFiles.length > 0 ? (
// // // // // // //                           selectedFiles.map((fileName, index) => (
// // // // // // //                             <p key={index} className="file-name">
// // // // // // //                               {fileName}
// // // // // // //                             </p>
// // // // // // //                           ))
// // // // // // //                         ) : (
// // // // // // //                           <p>No files selected</p>
// // // // // // //                         )}
// // // // // // //                       </div>

// // // // // // //                       <div className="attachment-upload">
// // // // // // //                         <input
// // // // // // //                           type="file"
// // // // // // //                           multiple
// // // // // // //                           ref={fileInputRef}
// // // // // // //                           onChange={handleFileUpload}
// // // // // // //                           style={{ display: "none" }}
// // // // // // //                         />
// // // // // // //                         <button
// // // // // // //                           type="button"
// // // // // // //                           className="custom-file-upload"
// // // // // // //                           onClick={() =>
// // // // // // //                             fileInputRef.current && fileInputRef.current.click()
// // // // // // //                           }
// // // // // // //                         >
// // // // // // //                           Browse
// // // // // // //                         </button>
// // // // // // //                       </div>
// // // // // // //                     </div>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             )}
// // // // // // //           </>
// // // // // // //         );

// // // // // // //       case "Meals":
// // // // // // //         return (
// // // // // // //           <div className="rb-main-form">
// // // // // // //             <div className="rb-form1-grid">
// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>
// // // // // // //                   Date<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <input
// // // // // // //                   type="date"
// // // // // // //                   name="date"
// // // // // // //                   value={formData.date}
// // // // // // //                   onChange={handleChange}
// // // // // // //                   max={new Date(Date.now() - 86400000).toLocaleDateString(
// // // // // // //                     "en-CA"
// // // // // // //                   )}
// // // // // // //                 />
// // // // // // //               </div>
// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>Meal Type</label>
// // // // // // //                 <select
// // // // // // //                   name="meal_type"
// // // // // // //                   value={formData.meal_type}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 >
// // // // // // //                   <option value="">Select</option>
// // // // // // //                   <option value="breakfast">Break Fast</option>
// // // // // // //                   <option value="lunch">Lunch</option>
// // // // // // //                   <option value="dinner">Dinner</option>
// // // // // // //                   <option value="Full Day">Full Day</option>
// // // // // // //                 </select>
// // // // // // //               </div>
// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>Meal's objective</label>
// // // // // // //                 <select
// // // // // // //                   name="meals_objective"
// // // // // // //                   value={formData.meals_objective}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 >
// // // // // // //                   <option value="">Select</option>
// // // // // // //                   <option value="client_visit">Client Visit</option>
// // // // // // //                   <option value="team_outing">Team Outing</option>
// // // // // // //                   <option value="extended_work">Extended</option>
// // // // // // //                   <option value="others">Others</option>
// // // // // // //                 </select>
// // // // // // //               </div>

// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>
// // // // // // //                   Total Amount<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <input
// // // // // // //                   type="number"
// // // // // // //                   name="total_amount"
// // // // // // //                   value={formData.total_amount}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 />
// // // // // // //               </div>
// // // // // // //             </div>

// // // // // // //             <div className="purpose-attachment">
// // // // // // //               <div className="pa-groups">
// // // // // // //                 <label>
// // // // // // //                   Purpose Details / Comments<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <textarea
// // // // // // //                   name="purpose"
// // // // // // //                   value={formData.purpose}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 />
// // // // // // //               </div>

// // // // // // //               <div className="pa-groups">
// // // // // // //                 <label>Attachment</label>
// // // // // // //                 <div className="attachment-wrapper">
// // // // // // //                   <div className="file-links">
// // // // // // //                     {selectedFiles.length > 0 ? (
// // // // // // //                       selectedFiles.map((fileName, index) => (
// // // // // // //                         <p key={index} className="file-name">
// // // // // // //                           {fileName}
// // // // // // //                         </p>
// // // // // // //                       ))
// // // // // // //                     ) : (
// // // // // // //                       <p>No files selected</p>
// // // // // // //                     )}
// // // // // // //                   </div>

// // // // // // //                   <div className="attachment-upload">
// // // // // // //                     <input
// // // // // // //                       type="file"
// // // // // // //                       multiple
// // // // // // //                       ref={fileInputRef}
// // // // // // //                       onChange={handleFileUpload}
// // // // // // //                       style={{ display: "none" }}
// // // // // // //                     />
// // // // // // //                     <button
// // // // // // //                       type="button"
// // // // // // //                       className="custom-file-upload"
// // // // // // //                       onClick={() =>
// // // // // // //                         fileInputRef.current && fileInputRef.current.click()
// // // // // // //                       }
// // // // // // //                     >
// // // // // // //                       Browse
// // // // // // //                     </button>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             </div>
// // // // // // //           </div>
// // // // // // //         );

// // // // // // //       case "Telecommunication":
// // // // // // //         return (
// // // // // // //           <div className="rb-main-form">
// // // // // // //             <div className="rb-form2-grid">
// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>
// // // // // // //                   Date<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <input
// // // // // // //                   type="date"
// // // // // // //                   name="date"
// // // // // // //                   value={formData.date}
// // // // // // //                   onChange={handleChange}
// // // // // // //                   max={new Date(Date.now() - 86400000).toLocaleDateString(
// // // // // // //                     "en-CA"
// // // // // // //                   )}
// // // // // // //                 />
// // // // // // //               </div>
// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>Service Provider</label>
// // // // // // //                 <input
// // // // // // //                   type="text"
// // // // // // //                   name="service_provider"
// // // // // // //                   value={formData.service_provider}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 />
// // // // // // //               </div>
// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>
// // // // // // //                   Total Amount<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <input
// // // // // // //                   type="number"
// // // // // // //                   name="total_amount"
// // // // // // //                   value={formData.total_amount}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 />
// // // // // // //               </div>
// // // // // // //             </div>
// // // // // // //             <div className="purpose-attachment">
// // // // // // //               <div className="pa-groups">
// // // // // // //                 <label>
// // // // // // //                   Purpose Details / Comments<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <textarea
// // // // // // //                   name="purpose"
// // // // // // //                   value={formData.purpose}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 />
// // // // // // //               </div>

// // // // // // //               <div className="pa-groups">
// // // // // // //                 <label>Attachment</label>
// // // // // // //                 <div className="attachment-wrapper">
// // // // // // //                   <div className="file-links">
// // // // // // //                     {selectedFiles.length > 0 ? (
// // // // // // //                       selectedFiles.map((fileName, index) => (
// // // // // // //                         <p key={index} className="file-name">
// // // // // // //                           {fileName}
// // // // // // //                         </p>
// // // // // // //                       ))
// // // // // // //                     ) : (
// // // // // // //                       <p>No files selected</p>
// // // // // // //                     )}
// // // // // // //                   </div>

// // // // // // //                   <div className="attachment-upload">
// // // // // // //                     <input
// // // // // // //                       type="file"
// // // // // // //                       multiple
// // // // // // //                       ref={fileInputRef}
// // // // // // //                       onChange={handleFileUpload}
// // // // // // //                       style={{ display: "none" }}
// // // // // // //                     />
// // // // // // //                     <button
// // // // // // //                       type="button"
// // // // // // //                       className="custom-file-upload"
// // // // // // //                       onClick={() =>
// // // // // // //                         fileInputRef.current && fileInputRef.current.click()
// // // // // // //                       }
// // // // // // //                     >
// // // // // // //                       Browse
// // // // // // //                     </button>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             </div>
// // // // // // //           </div>
// // // // // // //         );

// // // // // // //       case "Stationary":
// // // // // // //         return (
// // // // // // //           <div className="rb-main-form">
// // // // // // //             <div className="rb-form1-grid">
// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>
// // // // // // //                   Date<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <input
// // // // // // //                   type="date"
// // // // // // //                   name="date"
// // // // // // //                   value={formData.date}
// // // // // // //                   onChange={handleChange}
// // // // // // //                   max={new Date(Date.now() - 86400000).toLocaleDateString(
// // // // // // //                     "en-CA"
// // // // // // //                   )}
// // // // // // //                 />
// // // // // // //               </div>
// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>Stationary</label>
// // // // // // //                 <select
// // // // // // //                   name="stationary"
// // // // // // //                   value={formData.stationary}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 >
// // // // // // //                   <option value="">Select</option>
// // // // // // //                   <option value="office equipments">Office Equipments</option>
// // // // // // //                   <option value="general stationary">General Stationary</option>
// // // // // // //                 </select>
// // // // // // //               </div>
// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>Purchasing Items</label>
// // // // // // //                 <input
// // // // // // //                   type="text"
// // // // // // //                   name="purchasing_item"
// // // // // // //                   value={formData.purchasing_item}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 />
// // // // // // //               </div>

// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>
// // // // // // //                   Total Amount<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <input
// // // // // // //                   type="number"
// // // // // // //                   name="total_amount"
// // // // // // //                   value={formData.total_amount}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 />
// // // // // // //               </div>
// // // // // // //             </div>

// // // // // // //             <div className="purpose-attachment">
// // // // // // //               <div className="pa-groups">
// // // // // // //                 <label>
// // // // // // //                   Purpose Details / Comments<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <textarea
// // // // // // //                   name="purpose"
// // // // // // //                   value={formData.purpose}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 />
// // // // // // //               </div>

// // // // // // //               <div className="pa-groups">
// // // // // // //                 <label>Attachment</label>
// // // // // // //                 <div className="attachment-wrapper">
// // // // // // //                   <div className="file-links">
// // // // // // //                     {selectedFiles.length > 0 ? (
// // // // // // //                       selectedFiles.map((fileName, index) => (
// // // // // // //                         <p key={index} className="file-name">
// // // // // // //                           {fileName}
// // // // // // //                         </p>
// // // // // // //                       ))
// // // // // // //                     ) : (
// // // // // // //                       <p>No files selected</p>
// // // // // // //                     )}
// // // // // // //                   </div>

// // // // // // //                   <div className="attachment-upload">
// // // // // // //                     <input
// // // // // // //                       type="file"
// // // // // // //                       multiple
// // // // // // //                       ref={fileInputRef}
// // // // // // //                       onChange={handleFileUpload}
// // // // // // //                       style={{ display: "none" }}
// // // // // // //                     />
// // // // // // //                     <button
// // // // // // //                       type="button"
// // // // // // //                       className="custom-file-upload"
// // // // // // //                       onClick={() =>
// // // // // // //                         fileInputRef.current && fileInputRef.current.click()
// // // // // // //                       }
// // // // // // //                     >
// // // // // // //                       Browse
// // // // // // //                     </button>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             </div>
// // // // // // //           </div>
// // // // // // //         );

// // // // // // //       case "Miscellaneous":
// // // // // // //         return (
// // // // // // //           <div className="rb-main-form">
// // // // // // //             <div className="rb-form1-grid">
// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>
// // // // // // //                   Date<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <input
// // // // // // //                   type="date"
// // // // // // //                   name="date"
// // // // // // //                   value={formData.date}
// // // // // // //                   onChange={handleChange}
// // // // // // //                   max={new Date(Date.now() - 86400000).toLocaleDateString(
// // // // // // //                     "en-CA"
// // // // // // //                   )}
// // // // // // //                 />
// // // // // // //               </div>
// // // // // // //               <div className="rb-groups">
// // // // // // //                 <label>
// // // // // // //                   Total Amount<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <input
// // // // // // //                   type="number"
// // // // // // //                   name="total_amount"
// // // // // // //                   value={formData.total_amount}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 />
// // // // // // //               </div>
// // // // // // //             </div>

// // // // // // //             <div className="purpose-attachment">
// // // // // // //               <div className="pa-groups">
// // // // // // //                 <label>
// // // // // // //                   Purpose Details / Comments<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <textarea
// // // // // // //                   name="purpose"
// // // // // // //                   value={formData.purpose}
// // // // // // //                   onChange={handleChange}
// // // // // // //                 />
// // // // // // //               </div>

// // // // // // //               <div className="pa-groups">
// // // // // // //                 <label>Attachment</label>
// // // // // // //                 <div className="attachment-wrapper">
// // // // // // //                   <div className="file-links">
// // // // // // //                     {selectedFiles.length > 0 ? (
// // // // // // //                       selectedFiles.map((fileName, index) => (
// // // // // // //                         <p key={index} className="file-name">
// // // // // // //                           {fileName}
// // // // // // //                         </p>
// // // // // // //                       ))
// // // // // // //                     ) : (
// // // // // // //                       <p>No files selected</p>
// // // // // // //                     )}
// // // // // // //                   </div>

// // // // // // //                   <div className="attachment-upload">
// // // // // // //                     <input
// // // // // // //                       type="file"
// // // // // // //                       multiple
// // // // // // //                       ref={fileInputRef}
// // // // // // //                       onChange={handleFileUpload}
// // // // // // //                       style={{ display: "none" }}
// // // // // // //                     />
// // // // // // //                     <button
// // // // // // //                       type="button"
// // // // // // //                       className="custom-file-upload"
// // // // // // //                       onClick={() =>
// // // // // // //                         fileInputRef.current && fileInputRef.current.click()
// // // // // // //                       }
// // // // // // //                     >
// // // // // // //                       Browse
// // // // // // //                     </button>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             </div>
// // // // // // //           </div>
// // // // // // //         );
// // // // // // //       default:
// // // // // // //         return null;
// // // // // // //     }
// // // // // // //   };

// // // // // // //   // ------------ Render ------------
// // // // // // //   return (
// // // // // // //     <div className="reimbursement-container">
// // // // // // //       <div className="rb-form-header">
// // // // // // //         {role !== "Manager" && role !== "Admin" && (
// // // // // // //           <h2>Reimbursement Requests</h2>
// // // // // // //         )}
// // // // // // //       </div>

// // // // // // //       <div className="filter-container">
// // // // // // //         <label>Status By</label>
// // // // // // //         <select
// // // // // // //           value={statusFilter}
// // // // // // //           onChange={(e) => setStatusFilter(e.target.value)}
// // // // // // //         >
// // // // // // //           <option value="pending">Pending</option>
// // // // // // //           <option value="approved">Approved</option>
// // // // // // //           <option value="rejected">Rejected</option>
// // // // // // //         </select>

// // // // // // //         <label>Date From</label>
// // // // // // //         <input
// // // // // // //           type="date"
// // // // // // //           value={fromDate}
// // // // // // //           onChange={(e) => setFromDate(e.target.value)}
// // // // // // //         />

// // // // // // //         <label>To</label>
// // // // // // //         <input
// // // // // // //           type="date"
// // // // // // //           value={toDate}
// // // // // // //           onChange={(e) => setToDate(e.target.value)}
// // // // // // //         />

// // // // // // //         <button className="search-btn" onClick={applyFilters}>
// // // // // // //           <FaSearch /> Search
// // // // // // //         </button>

// // // // // // //         <button
// // // // // // //           className="apply-btn"
// // // // // // //           onClick={() => {
// // // // // // //             setSubmitErrorMessage("");
// // // // // // //             setUpdateErrorMessage("");
// // // // // // //             setSelectedFiles([]);
// // // // // // //             setShowForm(true);
// // // // // // //             setEditingId(null);
// // // // // // //             setFormData({
// // // // // // //               employeeId,
// // // // // // //               department_id: departmentId,
// // // // // // //               claim_type: "",
// // // // // // //               transport_type: "",
// // // // // // //               fromDate: "",
// // // // // // //               toDate: "",
// // // // // // //               date: "",
// // // // // // //               travel_from: "",
// // // // // // //               travel_to: "",
// // // // // // //               meals_objective: "",
// // // // // // //               purpose: "",
// // // // // // //               purchasing_item: "",
// // // // // // //               accommodation_fees: "",
// // // // // // //               no_of_days: "",
// // // // // // //               total_amount: "",
// // // // // // //               meal_type: "",
// // // // // // //               stationary: "",
// // // // // // //               service_provider: "",
// // // // // // //               project: "",
// // // // // // //               attachments: null,
// // // // // // //             });
// // // // // // //           }}
// // // // // // //         >
// // // // // // //           Apply Claim
// // // // // // //         </button>
// // // // // // //       </div>

// // // // // // //       {errorMessage && <p className="rb-error-message">{errorMessage}</p>}

// // // // // // //       <div className="reimbursement-table-scroll">
// // // // // // //         <table className="reimbursement-table">
// // // // // // //           <thead>
// // // // // // //             <tr>
// // // // // // //               <th>Sl No</th>
// // // // // // //               <th>Claim Type</th>
// // // // // // //               <th>Date</th>
// // // // // // //               <th>Purpose</th>
// // // // // // //               <th>Amount</th>
// // // // // // //               <th>Attachment</th>
// // // // // // //               <th>Status</th>
// // // // // // //               <th>Comments</th>
// // // // // // //               <th>Payment Status</th>
// // // // // // //               <th>Action</th>
// // // // // // //             </tr>
// // // // // // //           </thead>
// // // // // // //           <tbody>
// // // // // // //             {filterClaims.map((claim, index) => (
// // // // // // //               <tr key={claim.id}>
// // // // // // //                 <td>{index + 1}</td>
// // // // // // //                 <td>{claim.claim_type}</td>
// // // // // // //                 <td>
// // // // // // //                   {claim.date_range
// // // // // // //                     ? claim.date_range
// // // // // // //                         .split(" - ")
// // // // // // //                         .map(formatDisplayDate)
// // // // // // //                         .join(" - ")
// // // // // // //                     : claim.date
// // // // // // //                     ? formatDisplayDate(claim.date)
// // // // // // //                     : claim.from_date && claim.to_date
// // // // // // //                     ? `${formatDisplayDate(
// // // // // // //                         claim.from_date
// // // // // // //                       )} - ${formatDisplayDate(claim.to_date)}`
// // // // // // //                     : "N/A"}
// // // // // // //                 </td>
// // // // // // //                 <td>
// // // // // // //                   <div className="rbadmin-comments">{claim.purpose}</div>
// // // // // // //                 </td>
// // // // // // //                 <td>{claim.total_amount}</td>
// // // // // // //                 <td>
// // // // // // //                   {attachments[claim.id]?.length > 0 ? (
// // // // // // //                     <button
// // // // // // //                       className="attachments-btn"
// // // // // // //                       onClick={() =>
// // // // // // //                         handleOpenAttachments(attachments[claim.id], claim)
// // // // // // //                       }
// // // // // // //                     >
// // // // // // //                       <MdOutlineRemoveRedEye className="eye-icon" /> View
// // // // // // //                     </button>
// // // // // // //                   ) : (
// // // // // // //                     "Not Attached"
// // // // // // //                   )}
// // // // // // //                 </td>
// // // // // // //                 <td>
// // // // // // //                   <span
// // // // // // //                     className={`rb-status-label ${
// // // // // // //                       claim.status === "approved"
// // // // // // //                         ? "rb-approved"
// // // // // // //                         : claim.status === "rejected"
// // // // // // //                         ? "rb-rejected"
// // // // // // //                         : ""
// // // // // // //                     }`}
// // // // // // //                   >
// // // // // // //                     {claim.status}
// // // // // // //                   </span>
// // // // // // //                 </td>
// // // // // // //                 <td>
// // // // // // //                   <div className="rbadmin-comments">
// // // // // // //                     {claim.approver_comments || "No comments"}
// // // // // // //                   </div>
// // // // // // //                 </td>
// // // // // // //                 <td>{claim.payment_status}</td>
// // // // // // //                 <td className="actions-column">
// // // // // // //                   <MdOutlineEdit
// // // // // // //                     className={`edit-icon ${
// // // // // // //                       claim.status && claim.status.toLowerCase() !== "pending"
// // // // // // //                         ? "disabled-icon"
// // // // // // //                         : ""
// // // // // // //                     }`}
// // // // // // //                     onClick={() => {
// // // // // // //                       if (
// // // // // // //                         claim.status &&
// // // // // // //                         claim.status.toLowerCase() === "pending"
// // // // // // //                       ) {
// // // // // // //                         handleEdit(claim);
// // // // // // //                         setShowForm(true);
// // // // // // //                       }
// // // // // // //                     }}
// // // // // // //                   />
// // // // // // //                   <MdDeleteOutline
// // // // // // //                     className={`delete-icon ${
// // // // // // //                       claim.status && claim.status.toLowerCase() !== "pending"
// // // // // // //                         ? "disabled-icon"
// // // // // // //                         : ""
// // // // // // //                     }`}
// // // // // // //                     onClick={() => {
// // // // // // //                       if (
// // // // // // //                         claim.status &&
// // // // // // //                         claim.status.toLowerCase() === "pending"
// // // // // // //                       )
// // // // // // //                         deleteReimbursement(claim.id);
// // // // // // //                     }}
// // // // // // //                   />
// // // // // // //                 </td>
// // // // // // //               </tr>
// // // // // // //             ))}
// // // // // // //           </tbody>
// // // // // // //           <tfoot>
// // // // // // //             <tr className="total-row">
// // // // // // //               <td
// // // // // // //                 colSpan="4"
// // // // // // //                 style={{
// // // // // // //                   textAlign: "right",
// // // // // // //                   color: "#949494",
// // // // // // //                   fontWeight: "bold",
// // // // // // //                 }}
// // // // // // //               >
// // // // // // //                 Total Amount Claiming:{" "}
// // // // // // //                 <span style={{ fontWeight: "bold", color: "black" }}>
// // // // // // //                   Rs {totalAmount}
// // // // // // //                 </span>
// // // // // // //               </td>
// // // // // // //               <td colSpan="3" style={{ textAlign: "right" }}>
// // // // // // //                 Amount Approved: Rs{" "}
// // // // // // //                 <span style={{ fontWeight: "bold" }}>{approvedAmount}</span>
// // // // // // //               </td>
// // // // // // //               <td colSpan="3" style={{ textAlign: "right" }}>
// // // // // // //                 Amount Rejected: Rs{" "}
// // // // // // //                 <span style={{ fontWeight: "bold" }}>{rejectedAmount}</span>
// // // // // // //               </td>
// // // // // // //             </tr>
// // // // // // //           </tfoot>
// // // // // // //         </table>

// // // // // // //         {/* Mobile cards */}
// // // // // // //         <div className="rb-reimbursement-cards">
// // // // // // //           {filterClaims.map((claim, index) => (
// // // // // // //             <div className="rb-reimbursement-card" key={claim.id}>
// // // // // // //               <div className="rb-card-header">
// // // // // // //                 <span className={`rb-status ${claim.status?.toLowerCase()}`}>
// // // // // // //                   {claim.status}
// // // // // // //                 </span>
// // // // // // //               </div>
// // // // // // //               <div className="rb-card-body">
// // // // // // //                 <p>
// // // // // // //                   <strong>Sl No:</strong> {index + 1}
// // // // // // //                 </p>
// // // // // // //                 <p>
// // // // // // //                   <strong>Claim Type:</strong> {claim.claim_type}
// // // // // // //                 </p>
// // // // // // //                 <p>
// // // // // // //                   <strong>Date:</strong>{" "}
// // // // // // //                   {claim.date ? formatDisplayDate(claim.date) : "N/A"}
// // // // // // //                 </p>
// // // // // // //                 <p>
// // // // // // //                   <strong>Purpose:</strong> {claim.purpose}
// // // // // // //                 </p>
// // // // // // //                 <p>
// // // // // // //                   <strong>Amount:</strong> Rs {claim.total_amount}
// // // // // // //                 </p>
// // // // // // //                 <p>
// // // // // // //                   <strong>Comments:</strong>{" "}
// // // // // // //                   {claim.approver_comments || "No comments"}
// // // // // // //                 </p>
// // // // // // //               </div>
// // // // // // //               <div className="rb-card-footer">
// // // // // // //                 {attachments[claim.id]?.length > 0 ? (
// // // // // // //                   <button
// // // // // // //                     className="rb-attachments-btn"
// // // // // // //                     onClick={() =>
// // // // // // //                       handleOpenAttachments(attachments[claim.id], claim)
// // // // // // //                     }
// // // // // // //                   >
// // // // // // //                     <MdOutlineRemoveRedEye className="rb-eye-icon" /> View
// // // // // // //                   </button>
// // // // // // //                 ) : (
// // // // // // //                   <span className="rb-no-attachment">No Attachment</span>
// // // // // // //                 )}
// // // // // // //                 {claim.status && claim.status.toLowerCase() === "pending" && (
// // // // // // //                   <div className="rb-card-actions">
// // // // // // //                     <MdOutlineEdit
// // // // // // //                       className="rb-edit-icon"
// // // // // // //                       onClick={() => {
// // // // // // //                         handleEdit(claim);
// // // // // // //                         setShowForm(true);
// // // // // // //                       }}
// // // // // // //                     />
// // // // // // //                     <MdDeleteOutline
// // // // // // //                       className="rb-delete-icon"
// // // // // // //                       onClick={() => deleteReimbursement(claim.id)}
// // // // // // //                     />
// // // // // // //                   </div>
// // // // // // //                 )}
// // // // // // //               </div>
// // // // // // //             </div>
// // // // // // //           ))}
// // // // // // //         </div>
// // // // // // //       </div>

// // // // // // //       {/* Form modal */}
// // // // // // //       {showForm && (
// // // // // // //         <div className="rb-modal">
// // // // // // //           <div className="rb-modal-content">
// // // // // // //             <div className="claim-form-header">
// // // // // // //               <h2 className="claim-form-title">
// // // // // // //                 {editingId ? "Edit Reimbursement" : "New Reimbursement"}
// // // // // // //               </h2>
// // // // // // //               <MdOutlineCancel
// // // // // // //                 className="claim-form-close"
// // // // // // //                 onClick={() => setShowForm(false)}
// // // // // // //               />
// // // // // // //             </div>
// // // // // // //             {submitErrorMessage && (
// // // // // // //               <p className="rb-error-message">{submitErrorMessage}</p>
// // // // // // //             )}
// // // // // // //             {updateErrorMessage && (
// // // // // // //               <p className="rb-error-message">{updateErrorMessage}</p>
// // // // // // //             )}
// // // // // // //             <form className="reimbursement-form" onSubmit={handleSubmit}>
// // // // // // //               <div className="claim-type">
// // // // // // //                 <label>
// // // // // // //                   Project<span className="asterisk">*</span>
// // // // // // //                 </label>
// // // // // // //                 <select
// // // // // // //                   name="project"
// // // // // // //                   value={formData.project}
// // // // // // //                   onChange={handleChange}
// // // // // // //                   required
// // // // // // //                 >
// // // // // // //                   <option value="">Select project</option>
// // // // // // //                   <option value="Company Claim">Company Claim</option>
// // // // // // //                   {projects.map((proj, i) => (
// // // // // // //                     <option key={i} value={proj}>
// // // // // // //                       {proj}
// // // // // // //                     </option>
// // // // // // //                   ))}
// // // // // // //                 </select>

// // // // // // //                 <div className="rb-tabs">
// // // // // // //                   {claimTypes.map(({ icon, label }) => (
// // // // // // //                     <div
// // // // // // //                       key={label}
// // // // // // //                       className={`rb-tab ${
// // // // // // //                         formData.claim_type === label ? "active" : ""
// // // // // // //                       }`}
// // // // // // //                       onClick={() =>
// // // // // // //                         handleClaimTypeChange({ target: { value: label } })
// // // // // // //                       }
// // // // // // //                     >
// // // // // // //                       {icon} {label}
// // // // // // //                     </div>
// // // // // // //                   ))}
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               {renderClaimSpecificFields()}

// // // // // // //               <div className="reimbursement-form-button">
// // // // // // //                 <button
// // // // // // //                   type="button"
// // // // // // //                   className="rb-close"
// // // // // // //                   onClick={() => setShowForm(false)}
// // // // // // //                 >
// // // // // // //                   Cancel
// // // // // // //                 </button>
// // // // // // //                 <button type="submit" className="rb-submit">
// // // // // // //                   {editingId ? "Update" : "Submit"}
// // // // // // //                 </button>
// // // // // // //               </div>
// // // // // // //             </form>
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       )}

// // // // // // //       {/* Attachments modal */}
// // // // // // //       {isModalOpen && (
// // // // // // //         <div className="att-modal-overlay">
// // // // // // //           <div className="att-modal-content">
// // // // // // //             <div className="att-header">
// // // // // // //               <h2>Attachments</h2>
// // // // // // //               <MdOutlineCancel
// // // // // // //                 className="att-close"
// // // // // // //                 onClick={() => setIsModalOpen(false)}
// // // // // // //               />
// // // // // // //             </div>
// // // // // // //             <h4 className="att-files">
// // // // // // //               {selectedClaim?.claim_type
// // // // // // //                 ? `${selectedClaim.claim_type} Bills`
// // // // // // //                 : "Bills"}
// // // // // // //             </h4>
// // // // // // //             {selectedFiles.length > 0 ? (
// // // // // // //               selectedFiles.map((file, idx) => (
// // // // // // //                 <div className="att-files" key={idx}>
// // // // // // //                   <a href={file.url} target="_blank" rel="noopener noreferrer">
// // // // // // //                     {file.name}
// // // // // // //                   </a>
// // // // // // //                 </div>
// // // // // // //               ))
// // // // // // //             ) : (
// // // // // // //               <p>No attachments available</p>
// // // // // // //             )}
// // // // // // //             <button
// // // // // // //               className="att-close-btn"
// // // // // // //               onClick={() => setIsModalOpen(false)}
// // // // // // //             >
// // // // // // //               Close
// // // // // // //             </button>
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       )}

// // // // // // //       <Modal
// // // // // // //         isVisible={confirmModal.isVisible}
// // // // // // //         onClose={closeConfirm}
// // // // // // //         buttons={[
// // // // // // //           { label: "Cancel", onClick: closeConfirm },
// // // // // // //           { label: "Confirm", onClick: confirmModal.onConfirm },
// // // // // // //         ]}
// // // // // // //       >
// // // // // // //         <p>{confirmModal.message}</p>
// // // // // // //       </Modal>

// // // // // // //       <Modal
// // // // // // //         isVisible={alertModal.isVisible}
// // // // // // //         onClose={closeAlert}
// // // // // // //         buttons={[{ label: "OK", onClick: closeAlert }]}
// // // // // // //       >
// // // // // // //         <p>{alertModal.message}</p>
// // // // // // //       </Modal>
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default Reimbursement;


// // // // // // "use client";

// // // // // // import React, { useState, useEffect, useCallback, useRef } from "react";
// // // // // // import axios from "axios";
// // // // // // import { FaSearch } from "react-icons/fa";
// // // // // // import {
// // // // // //   MdOutlineEdit,
// // // // // //   MdDeleteOutline,
// // // // // //   MdOutlineCancel,
// // // // // //   MdEmojiTransportation,
// // // // // //   MdOutlinePhoneAndroid,
// // // // // //   MdOutlineRemoveRedEye,
// // // // // // } from "react-icons/md";
// // // // // // import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
// // // // // // import { TbTriangleSquareCircle } from "react-icons/tb";
// // // // // // import "./Reimbursement.css";
// // // // // // import Modal from "../Modal/Modal.client";
// // // // // // import { useAuth } from "../../context/AuthProvider.client";

// // // // // // const claimTypes = [
// // // // // //   { icon: <MdEmojiTransportation className="claim-icons" />, label: "Transportation" },
// // // // // //   { icon: <GiKnifeFork className="claim-icons" />, label: "Meals" },
// // // // // //   { icon: <MdOutlinePhoneAndroid className="claim-icons" />, label: "Telecommunication" },
// // // // // //   { icon: <GiPencilBrush className="claim-icons" />, label: "Stationary" },
// // // // // //   { icon: <TbTriangleSquareCircle className="claim-icons" />, label: "Miscellaneous" },
// // // // // // ];

// // // // // // const Reimbursement = () => {
// // // // // //   const { user } = useAuth();
// // // // // //   const orgId = user?.orgId || user?.org_id || null;
// // // // // //   const role = user?.role || " ";
// // // // // //   const authToken = user?.token;
// // // // // //   const employeeId = user?.employeeId;
// // // // // //   const departmentId = user?.department_id;

// // // // // //   const [reimbursements, setReimbursements] = useState([]);
// // // // // //   const [filteredReimbursements, setFilteredReimbursements] = useState([]);
// // // // // //   const [fromDate, setFromDate] = useState("");
// // // // // //   const [toDate, setToDate] = useState("");
// // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // //   const [editingId, setEditingId] = useState(null);
// // // // // //   const [attachments, setAttachments] = useState({});
// // // // // //   const [isModalOpen, setIsModalOpen] = useState(false);
// // // // // //   const [selectedFiles, setSelectedFiles] = useState([]);
// // // // // //   const [selectedClaim, setSelectedClaim] = useState(null);
// // // // // //   const [errorMessage, setErrorMessage] = useState("");
// // // // // //   const [updateErrorMessage, setUpdateErrorMessage] = useState("");
// // // // // //   const [submitErrorMessage, setSubmitErrorMessage] = useState("");
// // // // // //   const [projects, setProjects] = useState([]);
// // // // // //   const [statusFilter, setStatusFilter] = useState("pending");
// // // // // //   const [selectedSubType, setSelectedSubType] = useState("");

// // // // // //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
// // // // // //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// // // // // //   const fileInputRef = useRef(null);

// // // // // //   const [formData, setFormData] = useState({
// // // // // //     employeeId,
// // // // // //     department_id: departmentId,
// // // // // //     claim_type: "",
// // // // // //     transport_type: "",
// // // // // //     transport_amount: "",
// // // // // //     da: "",
// // // // // //     fromDate: "",
// // // // // //     toDate: "",
// // // // // //     date: "",
// // // // // //     travel_from: "",
// // // // // //     travel_to: "",
// // // // // //     meals_objective: "",
// // // // // //     purpose: "",
// // // // // //     purchasing_item: "",
// // // // // //     accommodation_fees: "",
// // // // // //     no_of_days: "",
// // // // // //     total_amount: "",
// // // // // //     meal_type: "",
// // // // // //     stationary: "",
// // // // // //     service_provider: "",
// // // // // //     project: "",
// // // // // //     attachments: null,
// // // // // //   });

// // // // // //   const formatDisplayDate = (raw) => {
// // // // // //     if (!raw) return "N/A";
// // // // // //     const d = raw instanceof Date ? raw : new Date(raw);
// // // // // //     if (isNaN(d)) return raw;
// // // // // //     const day = String(d.getDate()).padStart(2, "0");
// // // // // //     const month = d.toLocaleString("en-GB", { month: "short" });
// // // // // //     const year = d.getFullYear();
// // // // // //     return `${day}-${month}-${year}`;
// // // // // //   };

// // // // // //   const [confirmModal, setConfirmModal] = useState({ isVisible: false, message: "", onConfirm: null });
// // // // // //   const showConfirm = (msg, onConfirm) => setConfirmModal({ isVisible: true, message: msg, onConfirm });
// // // // // //   const closeConfirm = () => setConfirmModal({ isVisible: false, message: "", onConfirm: null });

// // // // // //   const [alertModal, setAlertModal] = useState({ isVisible: false, title: "", message: "" });
// // // // // //   const showAlert = (msg, title = "") => setAlertModal({ isVisible: true, title, message: msg });
// // // // // //   const closeAlert = () => setAlertModal({ isVisible: false, title: "", message: "" });

// // // // // //   const fetchReimbursements = useCallback(async () => {
// // // // // //     try {
// // // // // //       const response = await axios.get(`${BACKEND_URL}/reimbursement/${employeeId}`, {
// // // // // //         headers: {
// // // // // //           "x-api-key": API_KEY,
// // // // // //           "Content-Type": "application/json",
// // // // // //           Authorization: `Bearer ${authToken}`,
// // // // // //           "x-org-id": orgId,
// // // // // //         },
// // // // // //       });

// // // // // //       const data = Array.isArray(response.data) ? response.data : response.data || [];
// // // // // //       setReimbursements(data);

// // // // // //       const att = {};
// // // // // //       await Promise.all(
// // // // // //         data.map(async (c) => {
// // // // // //           try {
// // // // // //             const r = await axios.get(`${BACKEND_URL}/reimbursement/${c.id}/attachments`, {
// // // // // //               headers: { "x-api-key": API_KEY, Authorization: `Bearer ${authToken}`, "x-org-id": orgId },
// // // // // //             });
// // // // // //             att[c.id] = (r.data.attachments || []).map((f) => ({
// // // // // //               ...f,
// // // // // //               orgId: orgId,
// // // // // //               year: (f.file_path?.split("/").find((_, i, a) => a[i - 1] === "reimbursement")?.split("/")?.[2]) || "",
// // // // // //               month: (f.file_path?.split("/").find((_, i, a) => a[i - 1] === "reimbursement")?.split("/")?.[3]) || "",
// // // // // //               employeeId: c.employee_id || c.employeeId || employeeId,
// // // // // //             }));
// // // // // //           } catch { att[c.id] = []; }
// // // // // //         })
// // // // // //       );
// // // // // //       setAttachments(att);
// // // // // //     } catch (e) {
// // // // // //       console.error(e);
// // // // // //       setErrorMessage(e?.response?.data?.message || "Failed to load reimbursements");
// // // // // //       showAlert(e?.response?.data?.message || "Error loading data");
// // // // // //     }
// // // // // //   }, [employeeId, authToken, orgId]);

// // // // // //   const fetchProjects = useCallback(async () => {
// // // // // //     try {
// // // // // //       const r = await axios.get(`${BACKEND_URL}/projectdrop`, { headers: { "x-api-key": API_KEY, "x-org-id": orgId } });
// // // // // //       setProjects(r.data || []);
// // // // // //     } catch { }
// // // // // //   }, [orgId]);

// // // // // //   useEffect(() => {
// // // // // //     if (employeeId) {
// // // // // //       fetchReimbursements();
// // // // // //       fetchProjects();
// // // // // //     }
// // // // // //   }, [fetchReimbursements, fetchProjects, employeeId]);

// // // // // //   const tryParseDate = (s) => {
// // // // // //     if (!s) return null;
// // // // // //     if (s instanceof Date && !isNaN(s)) return s;
// // // // // //     const d = new Date(s);
// // // // // //     if (!isNaN(d)) return d;
// // // // // //     const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/);
// // // // // //     if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
// // // // // //     return null;
// // // // // //   };

// // // // // //   const normalizeStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
// // // // // //   const normalizeEndOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// // // // // //   const parseClaimRange = (c) => {
// // // // // //     let start = null, end = null;
// // // // // //     if (c.date_range) {
// // // // // //       const parts = c.date_range.replace(/\s+to\s+/gi, " - ").replace(/[–—]/g, " - ").split(" - ").map(p => p.trim());
// // // // // //       if (parts.length >= 2) { start = tryParseDate(parts[0]); end = tryParseDate(parts[1]); }
// // // // // //     }
// // // // // //     if (!start && (c.from_date || c.fromDate)) start = tryParseDate(c.from_date || c.fromDate);
// // // // // //     if (!end && (c.to_date || c.toDate)) end = tryParseDate(c.to_date || c.toDate);
// // // // // //     if (!start && c.date) { start = tryParseDate(c.date); end = start; }
// // // // // //     if (start && !end) end = start;
// // // // // //     if (start && end) { start = normalizeStartOfDay(start); end = normalizeEndOfDay(end); }
// // // // // //     return { start, end };
// // // // // //   };

// // // // // //   const applyFilters = useCallback(() => {
// // // // // //     const f = fromDate ? normalizeStartOfDay(tryParseDate(fromDate)) : null;
// // // // // //     const t = toDate ? normalizeEndOfDay(tryParseDate(toDate)) : null;

// // // // // //     const filtered = reimbursements.filter(c => {
// // // // // //       if (statusFilter && c.status?.toLowerCase() !== statusFilter) return false;
// // // // // //       if (!f && !t) return true;
// // // // // //       const { start, end } = parseClaimRange(c);
// // // // // //       if (!start || !end) return !f && !t;
// // // // // //       if (f && !t) return end >= f;
// // // // // //       if (!f && t) return start <= t;
// // // // // //       return end >= f && start <= t;
// // // // // //     });
// // // // // //     setFilteredReimbursements(filtered);
// // // // // //   }, [reimbursements, fromDate, toDate, statusFilter]);

// // // // // //   useEffect(() => applyFilters(), [applyFilters]);

// // // // // //   const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
// // // // // //   const handleClaimTypeChange = (e) => {
// // // // // //     const v = e.target.value;
// // // // // //     setFormData(p => ({ ...p, claim_type: v }));
// // // // // //     setSelectedFiles([]); setSelectedClaim(null); setSelectedSubType("");
// // // // // //   };
// // // // // //   const handleTransportSubTypeChange = (t) => { setFormData(p => ({ ...p, transport_type: t })); setSelectedSubType(t); };
// // // // // //   const handleNoOfDaysChange = (e) => setFormData(p => ({ ...p, no_of_days: e.target.value }));
// // // // // //   const handleFileUpload = (e) => {
// // // // // //     const files = Array.from(e.target.files);
// // // // // //     setSelectedFiles(files.map(f => f.name));
// // // // // //     setFormData(p => ({ ...p, attachments: files }));
// // // // // //   };

// // // // // //   const renderDateFields = () => {
// // // // // //     if (formData.transport_type === "Outstation") {
// // // // // //       return (
// // // // // //         <>
// // // // // //           <div className="rb-groups"><label>From Date<span className="asterisk">*</span></label><input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // // //           <div className="rb-groups"><label>To Date<span className="asterisk">*</span></label><input type="date" name="toDate" value={formData.toDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // // //         </>
// // // // // //       );
// // // // // //     }
// // // // // //     if (formData.no_of_days === "single") {
// // // // // //       return (
// // // // // //         <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // // //       );
// // // // // //     }
// // // // // //     if (formData.no_of_days === "multiple") {
// // // // // //       return (
// // // // // //         <>
// // // // // //           <div className="rb-groups"><label>From Date<span className="asterisk">*</span></label><input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // // //           <div className="rb-groups"><label>To Date<span className="asterisk">*</span></label><input type="date" name="toDate" value={formData.toDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // // //         </>
// // // // // //       );
// // // // // //     }
// // // // // //     return null;
// // // // // //   };

// // // // // //   const handleEdit = (c) => {
// // // // // //     setEditingId(c.id);
// // // // // //     setShowForm(true);
// // // // // //     const atts = attachments[c.id] || [];
// // // // // //     setFormData({
// // // // // //       employeeId: c.employeeId || c.employee_id || employeeId,
// // // // // //       department_id: c.department_id || departmentId,
// // // // // //       claim_type: c.claim_type || "",
// // // // // //       transport_type: c.transport_type || "",
// // // // // //       fromDate: c.from_date?.substring(0, 10) || c.fromDate || "",
// // // // // //       toDate: c.to_date?.substring(0, 10) || c.toDate || "",
// // // // // //       date: c.date?.substring(0, 10) || "",
// // // // // //       travel_from: c.travel_from || "",
// // // // // //       travel_to: c.travel_to || "",
// // // // // //       meals_objective: c.meals_objective || "",
// // // // // //       purpose: c.purpose || "",
// // // // // //       purchasing_item: c.purchasing_item || "",
// // // // // //       accommodation_fees: c.accommodation_fees || "",
// // // // // //       transport_amount: c.transport_amount || "",
// // // // // //       da: c.da || "",
// // // // // //       no_of_days: c.no_of_days || "",
// // // // // //       total_amount: c.total_amount || "",
// // // // // //       meal_type: c.meal_type || "",
// // // // // //       stationary: c.stationary || "",
// // // // // //       service_provider: c.service_provider || "",
// // // // // //       project: c.project || "",
// // // // // //       attachments: atts,
// // // // // //     });
// // // // // //     setSelectedFiles(atts.map(f => f.file_name || f.name));
// // // // // //     setSelectedSubType(c.transport_type || "");
// // // // // //   };

// // // // // //   const handleSubmit = async (e) => {
// // // // // //     e.preventDefault();
// // // // // //     setSubmitErrorMessage("");
// // // // // //     const words = formData.purpose?.trim().split(/\s+/).filter(Boolean).length || 0;
// // // // // //     if (words < 10) { showAlert(`Purpose must be at least 10 words (you have ${words})`); return; }

// // // // // //     const fd = new FormData();
// // // // // //     Object.entries(formData).forEach(([k, v]) => { if (k !== "attachments" && v != null) fd.append(k, v); });
// // // // // //     fd.append("role", role);
// // // // // //     if (orgId) fd.append("orgId", orgId);
// // // // // //     (formData.attachments || []).forEach(f => f instanceof File && fd.append("attachments", f));

// // // // // //     try {
// // // // // //       const cfg = { headers: { "x-api-key": API_KEY, "Content-Type": "multipart/form-data", Authorization: `Bearer ${authToken}`, "x-org-id": orgId } };
// // // // // //       editingId
// // // // // //         ? await axios.put(`${BACKEND_URL}/reimbursement/${editingId}`, fd, cfg)
// // // // // //         : await axios.post(`${BACKEND_URL}/reimbursement`, fd, cfg);
// // // // // //       showAlert("Submitted successfully!");
// // // // // //       setShowForm(false); setEditingId(null); setSelectedFiles([]); fetchReimbursements();
// // // // // //     } catch (err) {
// // // // // //       const msg = err?.response?.data?.error || err?.response?.data?.message || "Submission failed";
// // // // // //       setSubmitErrorMessage(msg); showAlert(msg);
// // // // // //     }
// // // // // //   };

// // // // // //   const deleteReimbursement = (id) => showConfirm("Delete this claim?", async () => {
// // // // // //     try {
// // // // // //       await axios.delete(`${BACKEND_URL}/reimbursement/${id}`, { headers: { "x-api-key": API_KEY, "x-org-id": orgId, Authorization: `Bearer ${authToken}` } });
// // // // // //       showAlert("Deleted!"); fetchReimbursements();
// // // // // //     } catch { showAlert("Delete failed"); } finally { closeConfirm(); }
// // // // // //   });

// // // // // //   const handleOpenAttachments = async (files, claim) => {
// // // // // //     try {
// // // // // //       const blobs = await Promise.all(
// // // // // //         (files || []).map(async (f) => {
// // // // // //           const name = f.file_name || f.name;
// // // // // //           const match = name.match(/^(\d{4})-(\d{2})/);
// // // // // //           if (!match) return null;
// // // // // //           const [, y, m] = match;
// // // // // //           const url = `${BACKEND_URL}/reimbursement/${orgId}/${y}/${m}/${claim.employee_id || claim.employeeId || employeeId}/${name}`;
// // // // // //           const r = await axios.get(url, { headers: { "x-api-key": API_KEY, Authorization: `Bearer ${authToken}`, "x-org-id": orgId }, responseType: "blob" });
// // // // // //           return { name, url: URL.createObjectURL(new Blob([r.data], { type: r.headers["content-type"] })) };
// // // // // //         })
// // // // // //       );
// // // // // //       const valid = blobs.filter(Boolean);
// // // // // //       if (!valid.length) return showAlert("No attachments");
// // // // // //       setSelectedFiles(valid); setSelectedClaim(claim); setIsModalOpen(true);
// // // // // //     } catch { showAlert("Failed to load attachments"); }
// // // // // //   };

// // // // // //   const totalAmount = filteredReimbursements.reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);
// // // // // //   const approvedAmount = filteredReimbursements.filter(c => c.status?.toLowerCase() === "approved").reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);
// // // // // //   const rejectedAmount = filteredReimbursements.filter(c => c.status?.toLowerCase() === "rejected").reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);

// // // // // //   const renderClaimSpecificFields = () => {
// // // // // //     switch (formData.claim_type) {
// // // // // //       case "Transportation":
// // // // // //         return (
// // // // // //           <>
// // // // // //             <div className="sub-tabs">
// // // // // //               {["Outstation", "Intercity", "Fuel"].map(t => (
// // // // // //                 <div key={t} className={`sub-tab ${formData.transport_type === t ? "active" : ""}`} onClick={() => handleTransportSubTypeChange(t)}>{t}</div>
// // // // // //               ))}
// // // // // //             </div>

// // // // // //             {(formData.transport_type === "Intercity" || formData.transport_type === "Fuel") && (
// // // // // //               <div className="rb-radio">
// // // // // //                 <label>Select no of days</label>
// // // // // //                 <div className="rb-radio-options">
// // // // // //                   {["single", "multiple"].map(v => (
// // // // // //                     <label key={v}><input type="radio" name="no_of_days" value={v} checked={formData.no_of_days === v} onChange={handleNoOfDaysChange} />{v.charAt(0).toUpperCase() + v.slice(1)}</label>
// // // // // //                   ))}
// // // // // //                 </div>
// // // // // //               </div>
// // // // // //             )}

// // // // // //             {formData.transport_type && (
// // // // // //               <div className="rb-main-form">
// // // // // //                 <div className="rb-form-grid">
// // // // // //                   {renderDateFields()}
// // // // // //                   <div className="rb-groups"><label>Travel From<span className="asterisk">*</span></label><input type="text" name="travel_from" value={formData.travel_from} onChange={handleChange} /></div>
// // // // // //                   <div className="rb-groups"><label>Travel To<span className="asterisk">*</span></label><input type="text" name="travel_to" value={formData.travel_to} onChange={handleChange} /></div>
// // // // // //                   {formData.transport_type === "Outstation" && (
// // // // // //                     <>
// // // // // //                       <div className="rb-groups"><label>Transport Amount</label><input type="number" name="transport_amount" value={formData.transport_amount} onChange={handleChange} /></div>
// // // // // //                       <div className="rb-groups"><label>Accommodation Fees</label><input type="number" name="accommodation_fees" value={formData.accommodation_fees} onChange={handleChange} /></div>
// // // // // //                       <div className="rb-groups"><label>DA</label><input type="number" name="da" value={formData.da} onChange={handleChange} /></div>
// // // // // //                     </>
// // // // // //                   )}
// // // // // //                   <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // // // //                 </div>

// // // // // //                 <div className="purpose-attachment">
// // // // // //                   <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // // // //                   <div className="pa-groups">
// // // // // //                     <label>Attachment</label>
// // // // // //                     <div className="attachment-wrapper">
// // // // // //                       <div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div>
// // // // // //                       <div className="attachment-upload">
// // // // // //                         <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
// // // // // //                         <button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button>
// // // // // //                       </div>
// // // // // //                     </div>
// // // // // //                   </div>
// // // // // //                 </div>
// // // // // //               </div>
// // // // // //             )}
// // // // // //           </>
// // // // // //         );

// // // // // //       case "Meals":
// // // // // //         return (
// // // // // //           <div className="rb-main-form">
// // // // // //             <div className="rb-form1-grid">
// // // // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // // //               <div className="rb-groups"><label>Meal Type</label><select name="meal_type" value={formData.meal_type} onChange={handleChange}><option value="">Select</option><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="Full Day">Full Day</option></select></div>
// // // // // //               <div className="rb-groups"><label>Meal's objective</label><select name="meals_objective" value={formData.meals_objective} onChange={handleChange}><option value="">Select</option><option value="client_visit">Client Visit</option><option value="team_outing">Team Outing</option><option value="extended_work">Extended</option><option value="others">Others</option></select></div>
// // // // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // // // //             </div>
// // // // // //             <div className="purpose-attachment">
// // // // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // // // //             </div>
// // // // // //           </div>
// // // // // //         );

// // // // // //       case "Telecommunication":
// // // // // //         return (
// // // // // //           <div className="rb-main-form">
// // // // // //             <div className="rb-form2-grid">
// // // // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // // //               <div className="rb-groups"><label>Service Provider</label><input type="text" name="service_provider" value={formData.service_provider} onChange={handleChange} /></div>
// // // // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // // // //             </div>
// // // // // //             <div className="purpose-attachment">
// // // // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // // // //             </div>
// // // // // //           </div>
// // // // // //         );

// // // // // //       case "Stationary":
// // // // // //         return (
// // // // // //           <div className="rb-main-form">
// // // // // //             <div className="rb-form1-grid">
// // // // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // // //               <div className="rb-groups"><label>Stationary</label><select name="stationary" value={formData.stationary} onChange={handleChange}><option value="">Select</option><option value="office equipments">Office Equipments</option><option value="general stationary">General Stationary</option></select></div>
// // // // // //               <div className="rb-groups"><label>Purchasing Items</label><input type="text" name="purchasing_item" value={formData.purchasing_item} onChange={handleChange} /></div>
// // // // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // // // //             </div>
// // // // // //             <div className="purpose-attachment">
// // // // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // // // //             </div>
// // // // // //           </div>
// // // // // //         );

// // // // // //       case "Miscellaneous":
// // // // // //         return (
// // // // // //           <div className="rb-main-form">
// // // // // //             <div className="rb-form1-grid">
// // // // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // // // //             </div>
// // // // // //             <div className="purpose-attachment">
// // // // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // // // //             </div>
// // // // // //           </div>
// // // // // //         );

// // // // // //       default:
// // // // // //         return null;
// // // // // //     }
// // // // // //   };

// // // // // //   return (
// // // // // //     <div className="reimbursement-container">
// // // // // //       <div className="rb-form-header">{role !== "Manager" && role !== "Admin" && <h2>Reimbursement Requests</h2>}</div>

// // // // // //       {/* FILTER BAR – DESKTOP: full, MOBILE: only status + apply */}
// // // // // //       <div className="filter-container">
// // // // // //         {/* Desktop-only fields */}
// // // // // //         <div className="desktop-only">
// // // // // //           <label>Date From</label>
// // // // // //           <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
// // // // // //           <label>To</label>
// // // // // //           <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
// // // // // //           <button className="search-btn" onClick={applyFilters}><FaSearch /> Search</button>
// // // // // //         </div>

// // // // // //         {/* Shared */}
// // // // // //         <label>Status By</label>
// // // // // //         <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
// // // // // //           <option value="pending">Pending</option>
// // // // // //           <option value="approved">Approved</option>
// // // // // //           <option value="rejected">Rejected</option>
// // // // // //         </select>

// // // // // //         <button className="apply-btn" onClick={() => {
// // // // // //           setShowForm(true); setEditingId(null); setSelectedFiles([]);
// // // // // //           setFormData({
// // // // // //             employeeId, department_id: departmentId, claim_type: "", transport_type: "", fromDate: "", toDate: "", date: "", travel_from: "", travel_to: "",
// // // // // //             meals_objective: "", purpose: "", purchasing_item: "", accommodation_fees: "", no_of_days: "", total_amount: "", meal_type: "", stationary: "", service_provider: "", project: "", attachments: null
// // // // // //           });
// // // // // //         }}>Apply Claim</button>
// // // // // //       </div>

// // // // // //       {errorMessage && <p className="rb-error-message">{errorMessage}</p>}

// // // // // //       <div className="reimbursement-table-scroll">
// // // // // //         {/* ---------- DESKTOP TABLE (unchanged) ---------- */}
// // // // // //         <table className="reimbursement-table">
// // // // // //           <thead>
// // // // // //             <tr>
// // // // // //               <th>Sl No</th><th>Claim Type</th><th>Date</th><th>Purpose</th><th>Amount</th><th>Attachment</th><th>Status</th><th>Comments</th><th>Payment Status</th><th>Action</th>
// // // // // //             </tr>
// // // // // //           </thead>
// // // // // //           <tbody>
// // // // // //             {filteredReimbursements.map((c, i) => (
// // // // // //               <tr key={c.id}>
// // // // // //                 <td>{i + 1}</td>
// // // // // //                 <td>{c.claim_type}</td>
// // // // // //                 <td>{c.date_range ? c.date_range.split(" - ").map(formatDisplayDate).join(" - ") : c.date ? formatDisplayDate(c.date) : `${formatDisplayDate(c.from_date)} - ${formatDisplayDate(c.to_date)}`}</td>
// // // // // //                 <td><div className="rbadmin-comments">{c.purpose}</div></td>
// // // // // //                 <td>{c.total_amount}</td>
// // // // // //                 <td>{attachments[c.id]?.length ? <button className="attachments-btn" onClick={() => handleOpenAttachments(attachments[c.id], c)}><MdOutlineRemoveRedEye className="eye-icon" /> View</button> : "Not Attached"}</td>
// // // // // //                 <td><span className={`rb-status-label ${c.status === "approved" ? "rb-approved" : c.status === "rejected" ? "rb-rejected" : ""}`}>{c.status}</span></td>
// // // // // //                 <td><div className="rbadmin-comments">{c.approver_comments || "No comments"}</div></td>
// // // // // //                 <td>{c.payment_status}</td>
// // // // // //                 <td className="actions-column">
// // // // // //                   <MdOutlineEdit className={`edit-icon ${c.status?.toLowerCase() !== "pending" ? "disabled-icon" : ""}`} onClick={() => c.status?.toLowerCase() === "pending" && handleEdit(c)} />
// // // // // //                   <MdDeleteOutline className={`delete-icon ${c.status?.toLowerCase() !== "pending" ? "disabled-icon" : ""}`} onClick={() => c.status?.toLowerCase() === "pending" && deleteReimbursement(c.id)} />
// // // // // //                 </td>
// // // // // //               </tr>
// // // // // //             ))}
// // // // // //           </tbody>
// // // // // //           <tfoot>
// // // // // //             <tr className="total-row">
// // // // // //               <td colSpan="4" style={{ textAlign: "right", color: "#949494", fontWeight: "bold" }}>Total Amount Claiming: <span style={{ fontWeight: "bold", color: "black" }}>Rs {totalAmount}</span></td>
// // // // // //               <td colSpan="3" style={{ textAlign: "right" }}>Amount Approved: Rs <span style={{ fontWeight: "bold" }}>{approvedAmount}</span></td>
// // // // // //               <td colSpan="3" style={{ textAlign: "right" }}>Amount Rejected: Rs <span style={{ fontWeight: "bold" }}>{rejectedAmount}</span></td>
// // // // // //             </tr>
// // // // // //           </tfoot>
// // // // // //         </table>

// // // // // //         {/* ---------- MOBILE LIST VIEW (new pattern) ---------- */}
// // // // // //         <div className="m-reimbursement-list">
// // // // // //           {filteredReimbursements.map((c, i) => {
// // // // // //             const Icon = claimTypes.find(t => t.label === c.claim_type)?.icon || null;
// // // // // //             return (
// // // // // //               <div className="m-list-item" key={c.id}>
// // // // // //                 <div className="m-item-left">
// // // // // //                   {Icon && <div className="m-item-icon">{Icon}</div>}
// // // // // //                   <div className="m-item-info">
// // // // // //                     <div className="m-item-title">{c.claim_type}</div>
// // // // // //                     <div className="m-item-date">
// // // // // //                       {c.date_range ? c.date_range.split(" - ").map(formatDisplayDate).join(" - ") : c.date ? formatDisplayDate(c.date) : `${formatDisplayDate(c.from_date)} - ${formatDisplayDate(c.to_date)}`}
// // // // // //                     </div>
// // // // // //                   </div>
// // // // // //                 </div>
// // // // // //                 <div className="m-item-right">
// // // // // //                   <div className="m-item-amount">Rs {c.total_amount}</div>
// // // // // //                   <div className={`m-item-status ${c.status?.toLowerCase() || "pending"}`}>{c.status}</div>
// // // // // //                   <div className="m-item-actions">
// // // // // //                     {attachments[c.id]?.length ? (
// // // // // //                       <button className="m-attach-btn" onClick={() => handleOpenAttachments(attachments[c.id], c)}>
// // // // // //                         <MdOutlineRemoveRedEye className="eye-icon" />
// // // // // //                       </button>
// // // // // //                     ) : null}
// // // // // //                     {c.status?.toLowerCase() === "pending" && (
// // // // // //                       <>
// // // // // //                         <MdOutlineEdit className="m-edit-icon" onClick={() => handleEdit(c)} />
// // // // // //                         <MdDeleteOutline className="m-delete-icon" onClick={() => deleteReimbursement(c.id)} />
// // // // // //                       </>
// // // // // //                     )}
// // // // // //                   </div>
// // // // // //                 </div>
// // // // // //               </div>
// // // // // //             );
// // // // // //           })}
// // // // // //         </div>
// // // // // //       </div>

// // // // // //       {/* ---------- FORM MODAL ---------- */}
// // // // // //      {showForm && (
// // // // // //   <div className="rb-modal">
// // // // // //     <div className="rb-modal-content m-modal-content">
// // // // // //       {/* ────── HEADER (close button) ────── */}
// // // // // //       <div className="claim-form-header">
// // // // // //         <h2 className="claim-form-title">{editingId ? "Edit Claim" : "New Claim"}</h2>
// // // // // //         <MdOutlineCancel className="claim-form-close" onClick={() => setShowForm(false)} />
// // // // // //       </div>

// // // // // //       {/* ────── ERROR MESSAGES ────── */}
// // // // // //       {submitErrorMessage && <p className="rb-error-message">{submitErrorMessage}</p>}
// // // // // //       {updateErrorMessage && <p className="rb-error-message">{updateErrorMessage}</p>}

// // // // // //       {/* ────── FORM ────── */}
// // // // // //       <form className="reimbursement-form" onSubmit={handleSubmit}>

// // // // // //         {/* ────── 1. STICKY CLAIM‑TYPE (project + tabs) ────── */}
// // // // // //         <div className="claim-type m-claim-header">
// // // // // //           <label>Project<span className="asterisk">*</span></label>
// // // // // //           <select name="project" value={formData.project} onChange={handleChange} required>
// // // // // //             <option value="">Select project</option>
// // // // // //             <option value="Company Claim">Company Claim</option>
// // // // // //             {projects.map((p, i) => (
// // // // // //               <option key={i} value={p}>{p}</option>
// // // // // //             ))}
// // // // // //           </select>

// // // // // //           <div className="rb-tabs">
// // // // // //             {claimTypes.map(({ icon, label }) => (
// // // // // //               <div
// // // // // //                 key={label}
// // // // // //                 className={`rb-tab ${formData.claim_type === label ? "active" : ""}`}
// // // // // //                 onClick={() => handleClaimTypeChange({ target: { value: label } })}
// // // // // //               >
// // // // // //                 {icon} {label}
// // // // // //               </div>
// // // // // //             ))}
// // // // // //           </div>
// // // // // //         </div>

// // // // // //         {/* ────── 2. SCROLLABLE BODY (all dynamic fields) ────── */}
// // // // // //         <div className="m-form-body">
// // // // // //           {renderClaimSpecificFields()}
// // // // // //         </div>

// // // // // //         {/* ────── 3. STICKY BUTTONS ────── */}
// // // // // //         <div className="reimbursement-form-button m-form-buttons">
// // // // // //           <button type="button" className="rb-close m-close" onClick={() => setShowForm(false)}>
// // // // // //             Cancel
// // // // // //           </button>
// // // // // //           <button type="submit" className="rb-submit m-submit">
// // // // // //             {editingId ? "Update" : "Submit"}
// // // // // //           </button>
// // // // // //         </div>
// // // // // //       </form>
// // // // // //     </div>
// // // // // //   </div>
// // // // // // )}

// // // // // //       {/* ---------- ATTACHMENTS MODAL ---------- */}
// // // // // //       {isModalOpen && (
// // // // // //         <div className="att-modal-overlay">
// // // // // //           <div className="att-modal-content">
// // // // // //             <div className="att-header">
// // // // // //               <h2>Attachments</h2>
// // // // // //               <MdOutlineCancel className="att-close" onClick={() => setIsModalOpen(false)} />
// // // // // //             </div>
// // // // // //             <h4 className="att-files">{selectedClaim?.claim_type} Bills</h4>
// // // // // //             {selectedFiles.length ? selectedFiles.map((f, i) => (
// // // // // //               <div className="att-files" key={i}><a href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a></div>
// // // // // //             )) : <p>No attachments</p>}
// // // // // //             <button className="att-close-btn" onClick={() => setIsModalOpen(false)}>Close</button>
// // // // // //           </div>
// // // // // //         </div>
// // // // // //       )}

// // // // // //       <Modal isVisible={confirmModal.isVisible} onClose={closeConfirm} buttons={[{ label: "Cancel", onClick: closeConfirm }, { label: "Confirm", onClick: confirmModal.onConfirm }]}><p>{confirmModal.message}</p></Modal>
// // // // // //       <Modal isVisible={alertModal.isVisible} onClose={closeAlert} buttons={[{ label: "OK", onClick: closeAlert }]}><p>{alertModal.message}</p></Modal>
// // // // // //     </div>
// // // // // //   );
// // // // // // };

// // // // // // export default Reimbursement;


// // // // // "use client";

// // // // // import React, { useState, useEffect, useCallback, useRef } from "react";
// // // // // import axios from "axios";
// // // // // import { FaSearch } from "react-icons/fa";
// // // // // import {
// // // // //   MdOutlineEdit,
// // // // //   MdDeleteOutline,
// // // // //   MdOutlineCancel,
// // // // //   MdEmojiTransportation,
// // // // //   MdOutlinePhoneAndroid,
// // // // //   MdOutlineRemoveRedEye,
// // // // // } from "react-icons/md";
// // // // // import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
// // // // // import { TbTriangleSquareCircle } from "react-icons/tb";
// // // // // import "./Reimbursement.css";
// // // // // import Modal from "../Modal/Modal.client";
// // // // // import { useAuth } from "../../context/AuthProvider.client";

// // // // // const claimTypes = [
// // // // //   { icon: <MdEmojiTransportation className="claim-icons" />, label: "Transportation" },
// // // // //   { icon: <GiKnifeFork className="claim-icons" />, label: "Meals" },
// // // // //   { icon: <MdOutlinePhoneAndroid className="claim-icons" />, label: "Telecommunication" },
// // // // //   { icon: <GiPencilBrush className="claim-icons" />, label: "Stationary" },
// // // // //   { icon: <TbTriangleSquareCircle className="claim-icons" />, label: "Miscellaneous" },
// // // // // ];

// // // // // const transportSubTypes = ["Outstation", "Intercity", "Fuel"];

// // // // // const Reimbursement = () => {
// // // // //   const { user } = useAuth();
// // // // //   const orgId = user?.orgId || user?.org_id || null;
// // // // //   const role = user?.role || " ";
// // // // //   const authToken = user?.token;
// // // // //   const employeeId = user?.employeeId;
// // // // //   const departmentId = user?.department_id;

// // // // //   const [reimbursements, setReimbursements] = useState([]);
// // // // //   const [filteredReimbursements, setFilteredReimbursements] = useState([]);
// // // // //   const [fromDate, setFromDate] = useState("");
// // // // //   const [toDate, setToDate] = useState("");
// // // // //   const [showForm, setShowForm] = useState(false);
// // // // //   const [editingId, setEditingId] = useState(null);
// // // // //   const [attachments, setAttachments] = useState({});
// // // // //   const [isModalOpen, setIsModalOpen] = useState(false);
// // // // //   const [selectedFiles, setSelectedFiles] = useState([]);
// // // // //   const [selectedClaim, setSelectedClaim] = useState(null);
// // // // //   const [errorMessage, setErrorMessage] = useState("");
// // // // //   const [updateErrorMessage, setUpdateErrorMessage] = useState("");
// // // // //   const [submitErrorMessage, setSubmitErrorMessage] = useState("");
// // // // //   const [projects, setProjects] = useState([]);
// // // // //   const [statusFilter, setStatusFilter] = useState("pending");
// // // // //   const [mobileStep, setMobileStep] = useState(1); // 1 = claim type, 2 = transport subtype, 3 = form

// // // // //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
// // // // //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// // // // //   const fileInputRef = useRef(null);

// // // // //   const [formData, setFormData] = useState({
// // // // //     employeeId,
// // // // //     department_id: departmentId,
// // // // //     claim_type: "",
// // // // //     transport_type: "",
// // // // //     transport_amount: "",
// // // // //     da: "",
// // // // //     fromDate: "",
// // // // //     toDate: "",
// // // // //     date: "",
// // // // //     travel_from: "",
// // // // //     travel_to: "",
// // // // //     meals_objective: "",
// // // // //     purpose: "",
// // // // //     purchasing_item: "",
// // // // //     accommodation_fees: "",
// // // // //     no_of_days: "",
// // // // //     total_amount: "",
// // // // //     meal_type: "",
// // // // //     stationary: "",
// // // // //     service_provider: "",
// // // // //     project: "",
// // // // //     attachments: null,
// // // // //   });

// // // // //   const formatDisplayDate = (raw) => {
// // // // //     if (!raw) return "N/A";
// // // // //     const d = raw instanceof Date ? raw : new Date(raw);
// // // // //     if (isNaN(d)) return raw;
// // // // //     const day = String(d.getDate()).padStart(2, "0");
// // // // //     const month = d.toLocaleString("en-GB", { month: "short" });
// // // // //     const year = d.getFullYear();
// // // // //     return `${day}-${month}-${year}`;
// // // // //   };

// // // // //   const [confirmModal, setConfirmModal] = useState({ isVisible: false, message: "", onConfirm: null });
// // // // //   const showConfirm = (msg, onConfirm) => setConfirmModal({ isVisible: true, message: msg, onConfirm });
// // // // //   const closeConfirm = () => setConfirmModal({ isVisible: false, message: "", onConfirm: null });

// // // // //   const [alertModal, setAlertModal] = useState({ isVisible: false, title: "", message: "" });
// // // // //   const showAlert = (msg, title = "") => setAlertModal({ isVisible: true, title, message: msg });
// // // // //   const closeAlert = () => setAlertModal({ isVisible: false, title: "", message: "" });

// // // // //   const fetchReimbursements = useCallback(async () => {
// // // // //     try {
// // // // //       const response = await axios.get(`${BACKEND_URL}/reimbursement/${employeeId}`, {
// // // // //         headers: {
// // // // //           "x-api-key": API_KEY,
// // // // //           "Content-Type": "application/json",
// // // // //           Authorization: `Bearer ${authToken}`,
// // // // //           "x-org-id": orgId,
// // // // //         },
// // // // //       });

// // // // //       const data = Array.isArray(response.data) ? response.data : response.data || [];
// // // // //       setReimbursements(data);

// // // // //       const att = {};
// // // // //       await Promise.all(
// // // // //         data.map(async (c) => {
// // // // //           try {
// // // // //             const r = await axios.get(`${BACKEND_URL}/reimbursement/${c.id}/attachments`, {
// // // // //               headers: { "x-api-key": API_KEY, Authorization: `Bearer ${authToken}`, "x-org-id": orgId },
// // // // //             });
// // // // //             att[c.id] = (r.data.attachments || []).map((f) => ({
// // // // //               ...f,
// // // // //               orgId: orgId,
// // // // //               year: (f.file_path?.split("/").find((_, i, a) => a[i - 1] === "reimbursement")?.split("/")?.[2]) || "",
// // // // //               month: (f.file_path?.split("/").find((_, i, a) => a[i - 1] === "reimbursement")?.split("/")?.[3]) || "",
// // // // //               employeeId: c.employee_id || c.employeeId || employeeId,
// // // // //             }));
// // // // //           } catch { att[c.id] = []; }
// // // // //         })
// // // // //       );
// // // // //       setAttachments(att);
// // // // //     } catch (e) {
// // // // //       console.error(e);
// // // // //       setErrorMessage(e?.response?.data?.message || "Failed to load reimbursements");
// // // // //       showAlert(e?.response?.data?.message || "Error loading data");
// // // // //     }
// // // // //   }, [employeeId, authToken, orgId]);

// // // // //   const fetchProjects = useCallback(async () => {
// // // // //     try {
// // // // //       const r = await axios.get(`${BACKEND_URL}/projectdrop`, { headers: { "x-api-key": API_KEY, "x-org-id": orgId } });
// // // // //       setProjects(r.data || []);
// // // // //     } catch { }
// // // // //   }, [orgId]);

// // // // //   useEffect(() => {
// // // // //     if (employeeId) {
// // // // //       fetchReimbursements();
// // // // //       fetchProjects();
// // // // //     }
// // // // //   }, [fetchReimbursements, fetchProjects, employeeId]);

// // // // //   const tryParseDate = (s) => {
// // // // //     if (!s) return null;
// // // // //     if (s instanceof Date && !isNaN(s)) return s;
// // // // //     const d = new Date(s);
// // // // //     if (!isNaN(d)) return d;
// // // // //     const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/);
// // // // //     if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
// // // // //     return null;
// // // // //   };

// // // // //   const normalizeStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
// // // // //   const normalizeEndOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// // // // //   const parseClaimRange = (c) => {
// // // // //     let start = null, end = null;
// // // // //     if (c.date_range) {
// // // // //       const parts = c.date_range.replace(/\s+to\s+/gi, " - ").replace(/[–—]/g, " - ").split(" - ").map(p => p.trim());
// // // // //       if (parts.length >= 2) { start = tryParseDate(parts[0]); end = tryParseDate(parts[1]); }
// // // // //     }
// // // // //     if (!start && (c.from_date || c.fromDate)) start = tryParseDate(c.from_date || c.fromDate);
// // // // //     if (!end && (c.to_date || c.toDate)) end = tryParseDate(c.to_date || c.toDate);
// // // // //     if (!start && c.date) { start = tryParseDate(c.date); end = start; }
// // // // //     if (start && ! E) end = start;
// // // // //     if (start && end) { start = normalizeStartOfDay(start); end = normalizeEndOfDay(end); }
// // // // //     return { start, end };
// // // // //   };

// // // // //   const applyFilters = useCallback(() => {
// // // // //     const f = fromDate ? normalizeStartOfDay(tryParseDate(fromDate)) : null;
// // // // //     const t = toDate ? normalizeEndOfDay(tryParseDate(toDate)) : null;

// // // // //     const filtered = reimbursements.filter(c => {
// // // // //       if (statusFilter && c.status?.toLowerCase() !== statusFilter) return false;
// // // // //       if (!f && !t) return true;
// // // // //       const { start, end } = parseClaimRange(c);
// // // // //       if (!start || !end) return !f && !t;
// // // // //       if (f && !t) return end >= f;
// // // // //       if (!f && t) return start <= t;
// // // // //       return end >= f && start <= t;
// // // // //     });
// // // // //     setFilteredReimbursements(filtered);
// // // // //   }, [reimbursements, fromDate, toDate, statusFilter]);

// // // // //   useEffect(() => applyFilters(), [applyFilters]);

// // // // //   const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
// // // // //   const handleClaimTypeChange = (type) => {
// // // // //     setFormData(p => ({ ...p, claim_type: type, transport_type: "", no_of_days: "" }));
// // // // //     setSelectedFiles([]); setSelectedClaim(null);
// // // // //     setMobileStep(type === "Transportation" ? 2 : 3);
// // // // //   };
// // // // //   const handleTransportSubTypeChange = (t) => {
// // // // //     setFormData(p => ({ ...p, transport_type: t, no_of_days: "" }));
// // // // //     setMobileStep(3);
// // // // //   };
// // // // //   const handleNoOfDaysChange = (e) => setFormData(p => ({ ...p, no_of_days: e.target.value }));
// // // // //   const handleFileUpload = (e) => {
// // // // //     const files = Array.from(e.target.files);
// // // // //     setSelectedFiles(files.map(f => f.name));
// // // // //     setFormData(p => ({ ...p, attachments: files }));
// // // // //   };

// // // // //   const renderDateFields = () => {
// // // // //     if (formData.transport_type === "Outstation") {
// // // // //       return (
// // // // //         <>
// // // // //           <div className="rb-groups"><label>From Date<span className="asterisk">*</span></label><input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // //           <div className="rb-groups"><label>To Date<span className="asterisk">*</span></label><input type="date" name="toDate" value={formData.toDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // //         </>
// // // // //       );
// // // // //     }
// // // // //     if (formData.no_of_days === "single") {
// // // // //       return (
// // // // //         <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // //       );
// // // // //     }
// // // // //     if (formData.no_of_days === "multiple") {
// // // // //       return (
// // // // //         <>
// // // // //           <div className="rb-groups"><label>From Date<span className="asterisk">*</span></label><input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // //           <div className="rb-groups"><label>To Date<span className="asterisk">*</span></label><input type="date" name="toDate" value={formData.toDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // //         </>
// // // // //       );
// // // // //     }
// // // // //     return null;
// // // // //   };

// // // // //   const handleEdit = (c) => {
// // // // //     setEditingId(c.id);
// // // // //     setShowForm(true);
// // // // //     setMobileStep(3); // Skip to form
// // // // //     const atts = attachments[c.id] || [];
// // // // //     setFormData({
// // // // //       employeeId: c.employeeId || c.employee_id || employeeId,
// // // // //       department_id: c.department_id || departmentId,
// // // // //       claim_type: c.claim_type || "",
// // // // //       transport_type: c.transport_type || "",
// // // // //       fromDate: c.from_date?.substring(0, 10) || c.fromDate || "",
// // // // //       toDate: c.to_date?.substring(0, 10) || c.toDate || "",
// // // // //       date: c.date?.substring(0, 10) || "",
// // // // //       travel_from: c.travel_from || "",
// // // // //       travel_to: c.travel_to || "",
// // // // //       meals_objective: c.meals_objective || "",
// // // // //       purpose: c.purpose || "",
// // // // //       purchasing_item: c.purchasing_item || "",
// // // // //       accommodation_fees: c.accommodation_fees || "",
// // // // //       transport_amount: c.transport_amount || "",
// // // // //       da: c.da || "",
// // // // //       no_of_days: c.no_of_days || "",
// // // // //       total_amount: c.total_amount || "",
// // // // //       meal_type: c.meal_type || "",
// // // // //       stationary: c.stationary || "",
// // // // //       service_provider: c.service_provider || "",
// // // // //       project: c.project || "",
// // // // //       attachments: atts,
// // // // //     });
// // // // //     setSelectedFiles(atts.map(f => f.file_name || f.name));
// // // // //   };

// // // // //   const handleSubmit = async (e) => {
// // // // //     e.preventDefault();
// // // // //     setSubmitErrorMessage("");
// // // // //     const words = formData.purpose?.trim().split(/\s+/).filter(Boolean).length || 0;
// // // // //     if (words < 10) { showAlert(`Purpose must be at least 10 words (you have ${words})`); return; }

// // // // //     const fd = new FormData();
// // // // //     Object.entries(formData).forEach(([k, v]) => { if (k !== "attachments" && v != null) fd.append(k, v); });
// // // // //     fd.append("role", role);
// // // // //     if (orgId) fd.append("orgId", orgId);
// // // // //     (formData.attachments || []).forEach(f => f instanceof File && fd.append("attachments", f));

// // // // //     try {
// // // // //       const cfg = { headers: { "x-api-key": API_KEY, "Content-Type": "multipart/form-data", Authorization: `Bearer ${authToken}`, "x-org-id": orgId } };
// // // // //       editingId
// // // // //         ? await axios.put(`${BACKEND_URL}/reimbursement/${editingId}`, fd, cfg)
// // // // //         : await axios.post(`${BACKEND_URL}/reimbursement`, fd, cfg);
// // // // //       showAlert("Submitted successfully!");
// // // // //       setShowForm(false); setEditingId(null); setSelectedFiles([]); setMobileStep(1); fetchReimbursements();
// // // // //     } catch (err) {
// // // // //       const msg = err?.response?.data?.error || err?.response?.data?.message || "Submission failed";
// // // // //       setSubmitErrorMessage(msg); showAlert(msg);
// // // // //     }
// // // // //   };

// // // // //   const deleteReimbursement = (id) => showConfirm("Delete this claim?", async () => {
// // // // //     try {
// // // // //       await axios.delete(`${BACKEND_URL}/reimbursement/${id}`, { headers: { "x-api-key": API_KEY, "x-org-id": orgId, Authorization: `Bearer ${authToken}` } });
// // // // //       showAlert("Deleted!"); fetchReimbursements();
// // // // //     } catch { showAlert("Delete failed"); } finally { closeConfirm(); }
// // // // //   });

// // // // //   const handleOpenAttachments = async (files, claim) => {
// // // // //     try {
// // // // //       const blobs = await Promise.all(
// // // // //         (files || []).map(async (f) => {
// // // // //           const name = f.file_name || f.name;
// // // // //           const match = name.match(/^(\d{4})-(\d{2})/);
// // // // //           if (!match) return null;
// // // // //           const [, y, m] = match;
// // // // //           const url = `${BACKEND_URL}/reimbursement/${orgId}/${y}/${m}/${claim.employee_id || claim.employeeId || employeeId}/${name}`;
// // // // //           const r = await axios.get(url, { headers: { "x-api-key": API_KEY, Authorization: `Bearer ${authToken}`, "x-org-id": orgId }, responseType: "blob" });
// // // // //           return { name, url: URL.createObjectURL(new Blob([r.data], { type: r.headers["content-type"] })) };
// // // // //         })
// // // // //       );
// // // // //       const valid = blobs.filter(Boolean);
// // // // //       if (!valid.length) return showAlert("No attachments");
// // // // //       setSelectedFiles(valid); setSelectedClaim(claim); setIsModalOpen(true);
// // // // //     } catch { showAlert("Failed to load attachments"); }
// // // // //   };

// // // // //   const totalAmount = filteredReimbursements.reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);
// // // // //   const approvedAmount = filteredReimbursements.filter(c => c.status?.toLowerCase() === "approved").reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);
// // // // //   const rejectedAmount = filteredReimbursements.filter(c => c.status?.toLowerCase() === "rejected").reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);

// // // // //   const renderClaimSpecificFields = () => {
// // // // //     switch (formData.claim_type) {
// // // // //       case "Transportation":
// // // // //         return (
// // // // //           <>
// // // // //             {(formData.transport_type === "Intercity" || formData.transport_type === "Fuel") && (
// // // // //               <div className="rb-radio">
// // // // //                 <label>Select no of days</label>
// // // // //                 <div className="rb-radio-options">
// // // // //                   {["single", "multiple"].map(v => (
// // // // //                     <label key={v}><input type="radio" name="no_of_days" value={v} checked={formData.no_of_days === v} onChange={handleNoOfDaysChange} />{v.charAt(0).toUpperCase() + v.slice(1)}</label>
// // // // //                   ))}
// // // // //                 </div>
// // // // //               </div>
// // // // //             )}

// // // // //             <div className="rb-main-form">
// // // // //               <div className="rb-form-grid">
// // // // //                 {renderDateFields()}
// // // // //                 <div className="rb-groups"><label>Travel From<span className="asterisk">*</span></label><input type="text" name="travel_from" value={formData.travel_from} onChange={handleChange} /></div>
// // // // //                 <div className="rb-groups"><label>Travel To<span className="asterisk">*</span></label><input type="text" name="travel_to" value={formData.travel_to} onChange={handleChange} /></div>
// // // // //                 {formData.transport_type === "Outstation" && (
// // // // //                   <>
// // // // //                     <div className="rb-groups"><label>Transport Amount</label><input type="number" name="transport_amount" value={formData.transport_amount} onChange={handleChange} /></div>
// // // // //                     <div className="rb-groups"><label>Accommodation Fees</label><input type="number" name="accommodation_fees" value={formData.accommodation_fees} onChange={handleChange} /></div>
// // // // //                     <div className="rb-groups"><label>DA</label><input type="number" name="da" value={formData.da} onChange={handleChange} /></div>
// // // // //                   </>
// // // // //                 )}
// // // // //                 <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // // //               </div>

// // // // //               <div className="purpose-attachment">
// // // // //                 <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // // //                 <div className="pa-groups">
// // // // //                   <label>Attachment</label>
// // // // //                   <div className="attachment-wrapper">
// // // // //                     <div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div>
// // // // //                     <div className="attachment-upload">
// // // // //                       <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
// // // // //                       <button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button>
// // // // //                     </div>
// // // // //                   </div>
// // // // //                 </div>
// // // // //               </div>
// // // // //             </div>
// // // // //           </>
// // // // //         );

// // // // //       case "Meals":
// // // // //         return (
// // // // //           <div className="rb-main-form">
// // // // //             <div className="rb-form1-grid">
// // // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // //               <div className="rb-groups"><label>Meal Type</label><select name="meal_type" value={formData.meal_type} onChange={handleChange}><option value="">Select</option><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="Full Day">Full Day</option></select></div>
// // // // //               <div className="rb-groups"><label>Meal's objective</label><select name="meals_objective" value={formData.meals_objective} onChange={handleChange}><option value="">Select</option><option value="client_visit">Client Visit</option><option value="team_outing">Team Outing</option><option value="extended_work">Extended</option><option value="others">Others</option></select></div>
// // // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // // //             </div>
// // // // //             <div className="purpose-attachment">
// // // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // // //             </div>
// // // // //           </div>
// // // // //         );

// // // // //       case "Telecommunication":
// // // // //         return (
// // // // //           <div className="rb-main-form">
// // // // //             <div className="rb-form2-grid">
// // // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // //               <div className="rb-groups"><label>Service Provider</label><input type="text" name="service_provider" value={formData.service_provider} onChange={handleChange} /></div>
// // // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // // //             </div>
// // // // //             <div className="purpose-attachment">
// // // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // // //             </div>
// // // // //           </div>
// // // // //         );

// // // // //       case "Stationary":
// // // // //         return (
// // // // //           <div className="rb-main-form">
// // // // //             <div className="rb-form1-grid">
// // // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // //               <div className="rb-groups"><label>Stationary</label><select name="stationary" value={formData.stationary} onChange={handleChange}><option value="">Select</option><option value="office equipments">Office Equipments</option><option value="general stationary">General Stationary</option></select></div>
// // // // //               <div className="rb-groups"><label>Purchasing Items</label><input type="text" name="purchasing_item" value={formData.purchasing_item} onChange={handleChange} /></div>
// // // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // // //             </div>
// // // // //             <div className="purpose-attachment">
// // // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // // //             </div>
// // // // //           </div>
// // // // //         );

// // // // //       case "Miscellaneous":
// // // // //         return (
// // // // //           <div className="rb-main-form">
// // // // //             <div className="rb-form1-grid">
// // // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // // //             </div>
// // // // //             <div className="purpose-attachment">
// // // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // // //             </div>
// // // // //           </div>
// // // // //         );

// // // // //       default:
// // // // //         return null;
// // // // //     }
// // // // //   };

// // // // //   return (
// // // // //     <div className="reimbursement-container">
// // // // //       <div className="rb-form-header">{role !== "Manager" && role !== "Admin" && <h2>Reimbursement Requests</h2>}</div>

// // // // //       <div className="filter-container">
// // // // //         <div className="desktop-only">
// // // // //           <label>Date From</label>
// // // // //           <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
// // // // //           <label>To</label>
// // // // //           <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
// // // // //           <button className="search-btn" onClick={applyFilters}><FaSearch /> Search</button>
// // // // //         </div>

// // // // //         <label>Status By</label>
// // // // //         <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
// // // // //           <option value="pending">Pending</option>
// // // // //           <option value="approved">Approved</option>
// // // // //           <option value="rejected">Rejected</option>
// // // // //         </select>

// // // // //         <button className="apply-btn" onClick={() => {
// // // // //           setShowForm(true); setEditingId(null); setSelectedFiles([]); setMobileStep(1);
// // // // //           setFormData({
// // // // //             employeeId, department_id: departmentId, claim_type: "", transport_type: "", fromDate: "", toDate: "", date: "", travel_from: "", travel_to: "",
// // // // //             meals_objective: "", purpose: "", purchasing_item: "", accommodation_fees: "", no_of_days: "", total_amount: "", meal_type: "", stationary: "", service_provider: "", project: "", attachments: null
// // // // //           });
// // // // //         }}>Apply Claim</button>
// // // // //       </div>

// // // // //       {errorMessage && <p className="rb-error-message">{errorMessage}</p>}

// // // // //       <div className="reimbursement-table-scroll">
// // // // //         <table className="reimbursement-table">
// // // // //           <thead>
// // // // //             <tr>
// // // // //               <th>Sl No</th><th>Claim Type</th><th>Date</th><th>Purpose</th><th>Amount</th><th>Attachment</th><th>Status</th><th>Comments</th><th>Payment Status</th><th>Action</th>
// // // // //             </tr>
// // // // //           </thead>
// // // // //           <tbody>
// // // // //             {filteredReimbursements.map((c, i) => (
// // // // //               <tr key={c.id}>
// // // // //                 <td>{i + 1}</td>
// // // // //                 <td>{c.claim_type}</td>
// // // // //                 <td>{c.date_range ? c.date_range.split(" - ").map(formatDisplayDate).join(" - ") : c.date ? formatDisplayDate(c.date) : `${formatDisplayDate(c.from_date)} - ${formatDisplayDate(c.to_date)}`}</td>
// // // // //                 <td><div className="rbadmin-comments">{c.purpose}</div></td>
// // // // //                 <td>{c.total_amount}</td>
// // // // //                 <td>{attachments[c.id]?.length ? <button className="attachments-btn" onClick={() => handleOpenAttachments(attachments[c.id], c)}><MdOutlineRemoveRedEye className="eye-icon" /> View</button> : "Not Attached"}</td>
// // // // //                 <td><span className={`rb-status-label ${c.status === "approved" ? "rb-approved" : c.status === "rejected" ? "rb-rejected" : ""}`}>{c.status}</span></td>
// // // // //                 <td><div className="rbadmin-comments">{c.approver_comments || "No comments"}</div></td>
// // // // //                 <td>{c.payment_status}</td>
// // // // //                 <td className="actions-column">
// // // // //                   <MdOutlineEdit className={`edit-icon ${c.status?.toLowerCase() !== "pending" ? "disabled-icon" : ""}`} onClick={() => c.status?.toLowerCase() === "pending" && handleEdit(c)} />
// // // // //                   <MdDeleteOutline className={`delete-icon ${c.status?.toLowerCase() !== "pending" ? "disabled-icon" : ""}`} onClick={() => c.status?.toLowerCase() === "pending" && deleteReimbursement(c.id)} />
// // // // //                 </td>
// // // // //               </tr>
// // // // //             ))}
// // // // //           </tbody>
// // // // //           <tfoot>
// // // // //             <tr className="total-row">
// // // // //               <td colSpan="4" style={{ textAlign: "right", color: "#949494", fontWeight: "bold" }}>Total Amount Claiming: <span style={{ fontWeight: "bold", color: "black" }}>Rs {totalAmount}</span></td>
// // // // //               <td colSpan="3" style={{ textAlign: "right" }}>Amount Approved: Rs <span style={{ fontWeight: "bold" }}>{approvedAmount}</span></td>
// // // // //               <td colSpan="3" style={{ textAlign: "right" }}>Amount Rejected: Rs <span style={{ fontWeight: "bold" }}>{rejectedAmount}</span></td>
// // // // //             </tr>
// // // // //           </tfoot>
// // // // //         </table>

// // // // //         <div className="m-reimbursement-list">
// // // // //           {filteredReimbursements.map((c, i) => {
// // // // //             const Icon = claimTypes.find(t => t.label === c.claim_type)?.icon || null;
// // // // //             return (
// // // // //               <div className="m-list-item" key={c.id}>
// // // // //                 <div className="m-item-left">
// // // // //                   {Icon && <div className="m-item-icon">{Icon}</div>}
// // // // //                   <div className="m-item-info">
// // // // //                     <div className="m-item-title">{c.claim_type}</div>
// // // // //                     <div className="m-item-date">
// // // // //                       {c.date_range ? c.date_range.split(" - ").map(formatDisplayDate).join(" - ") : c.date ? formatDisplayDate(c.date) : `${formatDisplayDate(c.from_date)} - ${formatDisplayDate(c.to_date)}`}
// // // // //                     </div>
// // // // //                   </div>
// // // // //                 </div>
// // // // //                 <div className="m-item-right">
// // // // //                   <div className="m-item-amount">Rs {c.total_amount}</div>
// // // // //                   <div className={`m-item-status ${c.status?.toLowerCase() || "pending"}`}>{c.status}</div>
// // // // //                   <div className="m-item-actions">
// // // // //                     {attachments[c.id]?.length ? (
// // // // //                       <button className="m-attach-btn" onClick={() => handleOpenAttachments(attachments[c.id], c)}>
// // // // //                         <MdOutlineRemoveRedEye className="eye-icon" />
// // // // //                       </button>
// // // // //                     ) : null}
// // // // //                     {c.status?.toLowerCase() === "pending" && (
// // // // //                       <>
// // // // //                         <MdOutlineEdit className="m-edit-icon" onClick={() => handleEdit(c)} />
// // // // //                         <MdDeleteOutline className="m-delete-icon" onClick={() => deleteReimbursement(c.id)} />
// // // // //                       </>
// // // // //                     )}
// // // // //                   </div>
// // // // //                 </div>
// // // // //               </div>
// // // // //             );
// // // // //           })}
// // // // //         </div>
// // // // //       </div>

// // // // //       {/* FORM MODAL – MOBILE WIZARD */}
// // // // //       {showForm && (
// // // // //         <div className="rb-modal">
// // // // //           <div className="rb-modal-content m-modal-content" style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
// // // // //             <div className="claim-form-header">
// // // // //               <h2 className="claim-form-title">
// // // // //                 {mobileStep === 1 ? "Select Claim Type" : mobileStep === 2 ? "Select Transport Type" : editingId ? "Edit Claim" : "New Claim"}
// // // // //               </h2>
// // // // //               <MdOutlineCancel
// // // // //                 className="claim-form-close"
// // // // //                 onClick={() => {
// // // // //                   setShowForm(false);
// // // // //                   setMobileStep(1);
// // // // //                   setFormData(prev => ({ ...prev, claim_type: "", transport_type: "" }));
// // // // //                 }}
// // // // //               />
// // // // //             </div>

// // // // //             {submitErrorMessage && <p className="rb-error-message">{submitErrorMessage}</p>}
// // // // //             {updateErrorMessage && <p className="rb-error-message">{updateErrorMessage}</p>}

// // // // //             <form className="reimbursement-form" onSubmit={handleSubmit} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
// // // // //               {/* STEP 1: Claim Type */}
// // // // //               <div className={`mobile-wizard-step ${mobileStep === 1 ? 'active' : ''}`} style={{ padding: '0 16px', flex: 1, overflowY: 'auto' }}>
// // // // //                 <div className="claim-type">
// // // // //                   <label>Project<span className="asterisk">*</span></label>
// // // // //                   <select name="project" value={formData.project} onChange={handleChange} required>
// // // // //                     <option value="">Select project</option>
// // // // //                     <option value="Company Claim">Company Claim</option>
// // // // //                     {projects.map((p, i) => (
// // // // //                       <option key={i} value={p}>{p}</option>
// // // // //                     ))}
// // // // //                   </select>

// // // // //                   <div className="rb-tabs" style={{ marginTop: '20px' }}>
// // // // //                     {claimTypes.map(({ icon, label }) => (
// // // // //                       <div
// // // // //                         key={label}
// // // // //                         className={`rb-tab ${formData.claim_type === label ? "active" : ""}`}
// // // // //                         onClick={() => handleClaimTypeChange(label)}
// // // // //                         style={{ fontSize: '14px', padding: '12px 8px' }}
// // // // //                       >
// // // // //                         {icon} {label}
// // // // //                       </div>
// // // // //                     ))}
// // // // //                   </div>
// // // // //                 </div>
// // // // //               </div>

// // // // //               {/* STEP 2: Transport Subtype */}
// // // // //               <div className={`mobile-wizard-step ${mobileStep === 2 ? 'active' : ''}`} style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
// // // // //                 <div className="mobile-step-back" onClick={() => setMobileStep(1)}>
// // // // //                   ← Change Claim Type
// // // // //                 </div>
// // // // //                 <div className="sub-tabs">
// // // // //                   {transportSubTypes.map(t => (
// // // // //                     <div
// // // // //                       key={t}
// // // // //                       className={`sub-tab ${formData.transport_type === t ? "active" : ""}`}
// // // // //                       onClick={() => handleTransportSubTypeChange(t)}
// // // // //                     >
// // // // //                       {t}
// // // // //                     </div>
// // // // //                   ))}
// // // // //                 </div>
// // // // //               </div>

// // // // //               {/* STEP 3: Main Form */}
// // // // //               <div className={`mobile-wizard-step ${mobileStep === 3 ? 'active' : ''}`} style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
// // // // //                 <div className="mobile-step-back" onClick={() => setMobileStep(formData.claim_type === "Transportation" ? 2 : 1)}>
// // // // //                   ← Change {formData.claim_type === "Transportation" ? "Sub-Type" : "Claim Type"}
// // // // //                 </div>

// // // // //                 {renderClaimSpecificFields()}

// // // // //                 <div className="reimbursement-form-button m-form-buttons" style={{ marginTop: '20px' }}>
// // // // //                   <button type="button" className="rb-close m-close" onClick={() => setShowForm(false)}>
// // // // //                     Cancel
// // // // //                   </button>
// // // // //                   <button type="submit" className="rb-submit m-submit">
// // // // //                     {editingId ? "Update" : "Submit"}
// // // // //                   </button>
// // // // //                 </div>
// // // // //               </div>
// // // // //             </form>
// // // // //           </div>
// // // // //         </div>
// // // // //       )}

// // // // //       {/* ATTACHMENTS MODAL */}
// // // // //       {isModalOpen && (
// // // // //         <div className="att-modal-overlay">
// // // // //           <div className="att-modal-content">
// // // // //             <div className="att-header">
// // // // //               <h2>Attachments</h2>
// // // // //               <MdOutlineCancel className="att-close" onClick={() => setIsModalOpen(false)} />
// // // // //             </div>
// // // // //             <h4 className="att-files">{selectedClaim?.claim_type} Bills</h4>
// // // // //             {selectedFiles.length ? selectedFiles.map((f, i) => (
// // // // //               <div className="att-files" key={i}><a href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a></div>
// // // // //             )) : <p>No attachments</p>}
// // // // //             <button className="att-close-btn" onClick={() => setIsModalOpen(false)}>Close</button>
// // // // //           </div>
// // // // //         </div>
// // // // //       )}

// // // // //       <Modal isVisible={confirmModal.isVisible} onClose={closeConfirm} buttons={[{ label: "Cancel", onClick: closeConfirm }, { label: "Confirm", onClick: confirmModal.onConfirm }]}><p>{confirmModal.message}</p></Modal>
// // // // //       <Modal isVisible={alertModal.isVisible} onClose={closeAlert} buttons={[{ label: "OK", onClick: closeAlert }]}><p>{alertModal.message}</p></Modal>
// // // // //     </div>
// // // // //   );
// // // // // };

// // // // // export default Reimbursement;

// // // // "use client";

// // // // import React, { useState, useEffect, useCallback, useRef } from "react";
// // // // import axios from "axios";
// // // // import { FaSearch } from "react-icons/fa";
// // // // import {
// // // //   MdOutlineEdit,
// // // //   MdDeleteOutline,
// // // //   MdOutlineCancel,
// // // //   MdEmojiTransportation,
// // // //   MdOutlinePhoneAndroid,
// // // //   MdOutlineRemoveRedEye,
// // // // } from "react-icons/md";
// // // // import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
// // // // import { TbTriangleSquareCircle } from "react-icons/tb";
// // // // import "./Reimbursement.css";
// // // // import Modal from "../Modal/Modal.client";
// // // // import { useAuth } from "../../context/AuthProvider.client";

// // // // const claimTypes = [
// // // //   { icon: <MdEmojiTransportation className="claim-icons" />, label: "Transportation" },
// // // //   { icon: <GiKnifeFork className="claim-icons" />, label: "Meals" },
// // // //   { icon: <MdOutlinePhoneAndroid className="claim-icons" />, label: "Telecommunication" },
// // // //   { icon: <GiPencilBrush className="claim-icons" />, label: "Stationary" },
// // // //   { icon: <TbTriangleSquareCircle className="claim-icons" />, label: "Miscellaneous" },
// // // // ];

// // // // const transportSubTypes = ["Outstation", "Intercity", "Fuel"];

// // // // const Reimbursement = () => {
// // // //   const { user } = useAuth();
// // // //   const orgId = user?.orgId || user?.org_id || null;
// // // //   const role = user?.role || " ";
// // // //   const authToken = user?.token;
// // // //   const employeeId = user?.employeeId;
// // // //   const departmentId = user?.department_id;

// // // //   const [reimbursements, setReimbursements] = useState([]);
// // // //   const [filteredReimbursements, setFilteredReimbursements] = useState([]);
// // // //   const [fromDate, setFromDate] = useState("");
// // // //   const [toDate, setToDate] = useState("");
// // // //   const [showForm, setShowForm] = useState(false);
// // // //   const [editingId, setEditingId] = useState(null);
// // // //   const [attachments, setAttachments] = useState({});
// // // //   const [isModalOpen, setIsModalOpen] = useState(false);
// // // //   const [selectedFiles, setSelectedFiles] = useState([]);
// // // //   const [selectedClaim, setSelectedClaim] = useState(null);
// // // //   const [errorMessage, setErrorMessage] = useState("");
// // // //   const [updateErrorMessage, setUpdateErrorMessage] = useState("");
// // // //   const [submitErrorMessage, setSubmitErrorMessage] = useState("");
// // // //   const [projects, setProjects] = useState([]);
// // // //   const [statusFilter, setStatusFilter] = useState("pending");
// // // //   const [mobileStep, setMobileStep] = useState(1); // 1 = claim type, 2 = transport subtype, 3 = form

// // // //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
// // // //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// // // //   const fileInputRef = useRef(null);

// // // //   const [formData, setFormData] = useState({
// // // //     employeeId,
// // // //     department_id: departmentId,
// // // //     claim_type: "",
// // // //     transport_type: "",
// // // //     transport_amount: "",
// // // //     da: "",
// // // //     fromDate: "",
// // // //     toDate: "",
// // // //     date: "",
// // // //     travel_from: "",
// // // //     travel_to: "",
// // // //     meals_objective: "",
// // // //     purpose: "",
// // // //     purchasing_item: "",
// // // //     accommodation_fees: "",
// // // //     no_of_days: "",
// // // //     total_amount: "",
// // // //     meal_type: "",
// // // //     stationary: "",
// // // //     service_provider: "",
// // // //     project: "",
// // // //     attachments: null,
// // // //   });

// // // //   const formatDisplayDate = (raw) => {
// // // //     if (!raw) return "N/A";
// // // //     const d = raw instanceof Date ? raw : new Date(raw);
// // // //     if (isNaN(d)) return raw;
// // // //     const day = String(d.getDate()).padStart(2, "0");
// // // //     const month = d.toLocaleString("en-GB", { month: "short" });
// // // //     const year = d.getFullYear();
// // // //     return `${day}-${month}-${year}`;
// // // //   };

// // // //   const [confirmModal, setConfirmModal] = useState({ isVisible: false, message: "", onConfirm: null });
// // // //   const showConfirm = (msg, onConfirm) => setConfirmModal({ isVisible: true, message: msg, onConfirm });
// // // //   const closeConfirm = () => setConfirmModal({ isVisible: false, message: "", onConfirm: null });

// // // //   const [alertModal, setAlertModal] = useState({ isVisible: false, title: "", message: "" });
// // // //   const showAlert = (msg, title = "") => setAlertModal({ isVisible: true, title, message: msg });
// // // //   const closeAlert = () => setAlertModal({ isVisible: false, title: "", message: "" });

// // // //   const fetchReimbursements = useCallback(async () => {
// // // //     try {
// // // //       const response = await axios.get(`${BACKEND_URL}/reimbursement/${employeeId}`, {
// // // //         headers: {
// // // //           "x-api-key": API_KEY,
// // // //           "Content-Type": "application/json",
// // // //           Authorization: `Bearer ${authToken}`,
// // // //           "x-org-id": orgId,
// // // //         },
// // // //       });

// // // //       const data = Array.isArray(response.data) ? response.data : response.data || [];
// // // //       setReimbursements(data);

// // // //       const att = {};
// // // //       await Promise.all(
// // // //         data.map(async (c) => {
// // // //           try {
// // // //             const r = await axios.get(`${BACKEND_URL}/reimbursement/${c.id}/attachments`, {
// // // //               headers: { "x-api-key": API_KEY, Authorization: `Bearer ${authToken}`, "x-org-id": orgId },
// // // //             });
// // // //             att[c.id] = (r.data.attachments || []).map((f) => ({
// // // //               ...f,
// // // //               orgId: orgId,
// // // //               year: (f.file_path?.split("/").find((_, i, a) => a[i - 1] === "reimbursement")?.split("/")?.[2]) || "",
// // // //               month: (f.file_path?.split("/").find((_, i, a) => a[i - 1] === "reimbursement")?.split("/")?.[3]) || "",
// // // //               employeeId: c.employee_id || c.employeeId || employeeId,
// // // //             }));
// // // //           } catch { att[c.id] = []; }
// // // //         })
// // // //       );
// // // //       setAttachments(att);
// // // //     } catch (e) {
// // // //       console.error(e);
// // // //       setErrorMessage(e?.response?.data?.message || "Failed to load reimbursements");
// // // //       showAlert(e?.response?.data?.message || "Error loading data");
// // // //     }
// // // //   }, [employeeId, authToken, orgId]);

// // // //   const fetchProjects = useCallback(async () => {
// // // //     try {
// // // //       const r = await axios.get(`${BACKEND_URL}/projectdrop`, { headers: { "x-api-key": API_KEY, "x-org-id": orgId } });
// // // //       setProjects(r.data || []);
// // // //     } catch { }
// // // //   }, [orgId]);

// // // //   useEffect(() => {
// // // //     if (employeeId) {
// // // //       fetchReimbursements();
// // // //       fetchProjects();
// // // //     }
// // // //   }, [fetchReimbursements, fetchProjects, employeeId]);

// // // //   const tryParseDate = (s) => {
// // // //     if (!s) return null;
// // // //     if (s instanceof Date && !isNaN(s)) return s;
// // // //     const d = new Date(s);
// // // //     if (!isNaN(d)) return d;
// // // //     const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/);
// // // //     if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
// // // //     return null;
// // // //   };

// // // //   const normalizeStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
// // // //   const normalizeEndOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// // // //   const parseClaimRange = (c) => {
// // // //     let start = null, end = null;
// // // //     if (c.date_range) {
// // // //       const parts = c.date_range.replace(/\s+to\s+/gi, " - ").replace(/[–—]/g, " - ").split(" - ").map(p => p.trim());
// // // //       if (parts.length >= 2) { start = tryParseDate(parts[0]); end = tryParseDate(parts[1]); }
// // // //     }
// // // //     if (!start && (c.from_date || c.fromDate)) start = tryParseDate(c.from_date || c.fromDate);
// // // //     if (!end && (c.to_date || c.toDate)) end = tryParseDate(c.to_date || c.toDate);
// // // //     if (!start && c.date) { start = tryParseDate(c.date); end = start; }
// // // //     if (start && !end) end = start;
// // // //     if (start && end) { start = normalizeStartOfDay(start); end = normalizeEndOfDay(end); }
// // // //     return { start, end };
// // // //   };

// // // //   const applyFilters = useCallback(() => {
// // // //     const f = fromDate ? normalizeStartOfDay(tryParseDate(fromDate)) : null;
// // // //     const t = toDate ? normalizeEndOfDay(tryParseDate(toDate)) : null;

// // // //     const filtered = reimbursements.filter(c => {
// // // //       if (statusFilter && c.status?.toLowerCase() !== statusFilter) return false;
// // // //       if (!f && !t) return true;
// // // //       const { start, end } = parseClaimRange(c);
// // // //       if (!start || !end) return !f && !t;
// // // //       if (f && !t) return end >= f;
// // // //       if (!f && t) return start <= t;
// // // //       return end >= f && start <= t;
// // // //     });
// // // //     setFilteredReimbursements(filtered);
// // // //   }, [reimbursements, fromDate, toDate, statusFilter]);

// // // //   useEffect(() => applyFilters(), [applyFilters]);

// // // //   const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
// // // //   const handleClaimTypeChange = (type) => {
// // // //     setFormData(p => ({ ...p, claim_type: type, transport_type: "", no_of_days: "" }));
// // // //     setSelectedFiles([]); setSelectedClaim(null);
// // // //     setMobileStep(type === "Transportation" ? 2 : 3);
// // // //   };
// // // //   const handleTransportSubTypeChange = (t) => {
// // // //     setFormData(p => ({ ...p, transport_type: t, no_of_days: "" }));
// // // //     setMobileStep(3);
// // // //   };
// // // //   const handleNoOfDaysChange = (e) => setFormData(p => ({ ...p, no_of_days: e.target.value }));
// // // //   const handleFileUpload = (e) => {
// // // //     const files = Array.from(e.target.files);
// // // //     setSelectedFiles(files.map(f => f.name));
// // // //     setFormData(p => ({ ...p, attachments: files }));
// // // //   };

// // // //   const renderDateFields = () => {
// // // //     if (formData.transport_type === "Outstation") {
// // // //       return (
// // // //         <>
// // // //           <div className="rb-groups"><label>From Date<span className="asterisk">*</span></label><input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // //           <div className="rb-groups"><label>To Date<span className="asterisk">*</span></label><input type="date" name="toDate" value={formData.toDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // //         </>
// // // //       );
// // // //     }
// // // //     if (formData.no_of_days === "single") {
// // // //       return (
// // // //         <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // //       );
// // // //     }
// // // //     if (formData.no_of_days === "multiple") {
// // // //       return (
// // // //         <>
// // // //           <div className="rb-groups"><label>From Date<span className="asterisk">*</span></label><input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // //           <div className="rb-groups"><label>To Date<span className="asterisk">*</span></label><input type="date" name="toDate" value={formData.toDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // //         </>
// // // //       );
// // // //     }
// // // //     return null;
// // // //   };

// // // //   const handleEdit = (c) => {
// // // //     setEditingId(c.id);
// // // //     setShowForm(true);
// // // //     setMobileStep(3); // Skip to form
// // // //     const atts = attachments[c.id] || [];
// // // //     setFormData({
// // // //       employeeId: c.employeeId || c.employee_id || employeeId,
// // // //       department_id: c.department_id || departmentId,
// // // //       claim_type: c.claim_type || "",
// // // //       transport_type: c.transport_type || "",
// // // //       fromDate: c.from_date?.substring(0, 10) || c.fromDate || "",
// // // //       toDate: c.to_date?.substring(0, 10) || c.toDate || "",
// // // //       date: c.date?.substring(0, 10) || "",
// // // //       travel_from: c.travel_from || "",
// // // //       travel_to: c.travel_to || "",
// // // //       meals_objective: c.meals_objective || "",
// // // //       purpose: c.purpose || "",
// // // //       purchasing_item: c.purchasing_item || "",
// // // //       accommodation_fees: c.accommodation_fees || "",
// // // //       transport_amount: c.transport_amount || "",
// // // //       da: c.da || "",
// // // //       no_of_days: c.no_of_days || "",
// // // //       total_amount: c.total_amount || "",
// // // //       meal_type: c.meal_type || "",
// // // //       stationary: c.stationary || "",
// // // //       service_provider: c.service_provider || "",
// // // //       project: c.project || "",
// // // //       attachments: atts,
// // // //     });
// // // //     setSelectedFiles(atts.map(f => f.file_name || f.name));
// // // //   };

// // // //   const handleSubmit = async (e) => {
// // // //     e.preventDefault();
// // // //     setSubmitErrorMessage("");
// // // //     const words = formData.purpose?.trim().split(/\s+/).filter(Boolean).length || 0;
// // // //     if (words < 10) { showAlert(`Purpose must be at least 10 words (you have ${words})`); return; }

// // // //     const fd = new FormData();
// // // //     Object.entries(formData).forEach(([k, v]) => { if (k !== "attachments" && v != null) fd.append(k, v); });
// // // //     fd.append("role", role);
// // // //     if (orgId) fd.append("orgId", orgId);
// // // //     (formData.attachments || []).forEach(f => f instanceof File && fd.append("attachments", f));

// // // //     try {
// // // //       const cfg = { headers: { "x-api-key": API_KEY, "Content-Type": "multipart/form-data", Authorization: `Bearer ${authToken}`, "x-org-id": orgId } };
// // // //       editingId
// // // //         ? await axios.put(`${BACKEND_URL}/reimbursement/${editingId}`, fd, cfg)
// // // //         : await axios.post(`${BACKEND_URL}/reimbursement`, fd, cfg);
// // // //       showAlert("Submitted successfully!");
// // // //       setShowForm(false); setEditingId(null); setSelectedFiles([]); setMobileStep(1); fetchReimbursements();
// // // //     } catch (err) {
// // // //       const msg = err?.response?.data?.error || err?.response?.data?.message || "Submission failed";
// // // //       setSubmitErrorMessage(msg); showAlert(msg);
// // // //     }
// // // //   };

// // // //   const deleteReimbursement = (id) => showConfirm("Delete this claim?", async () => {
// // // //     try {
// // // //       await axios.delete(`${BACKEND_URL}/reimbursement/${id}`, { headers: { "x-api-key": API_KEY, "x-org-id": orgId, Authorization: `Bearer ${authToken}` } });
// // // //       showAlert("Deleted!"); fetchReimbursements();
// // // //     } catch { showAlert("Delete failed"); } finally { closeConfirm(); }
// // // //   });

// // // //   const handleOpenAttachments = async (files, claim) => {
// // // //     try {
// // // //       const blobs = await Promise.all(
// // // //         (files || []).map(async (f) => {
// // // //           const name = f.file_name || f.name;
// // // //           const match = name.match(/^(\d{4})-(\d{2})/);
// // // //           if (!match) return null;
// // // //           const [, y, m] = match;
// // // //           const url = `${BACKEND_URL}/reimbursement/${orgId}/${y}/${m}/${claim.employee_id || claim.employeeId || employeeId}/${name}`;
// // // //           const r = await axios.get(url, { headers: { "x-api-key": API_KEY, Authorization: `Bearer ${authToken}`, "x-org-id": orgId }, responseType: "blob" });
// // // //           return { name, url: URL.createObjectURL(new Blob([r.data], { type: r.headers["content-type"] })) };
// // // //         })
// // // //       );
// // // //       const valid = blobs.filter(Boolean);
// // // //       if (!valid.length) return showAlert("No attachments");
// // // //       setSelectedFiles(valid); setSelectedClaim(claim); setIsModalOpen(true);
// // // //     } catch { showAlert("Failed to load attachments"); }
// // // //   };

// // // //   const totalAmount = filteredReimbursements.reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);
// // // //   const approvedAmount = filteredReimbursements.filter(c => c.status?.toLowerCase() === "approved").reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);
// // // //   const rejectedAmount = filteredReimbursements.filter(c => c.status?.toLowerCase() === "rejected").reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);

// // // //   const renderClaimSpecificFields = () => {
// // // //     switch (formData.claim_type) {
// // // //       case "Transportation":
// // // //         return (
// // // //           <>
// // // //             {(formData.transport_type === "Intercity" || formData.transport_type === "Fuel") && (
// // // //               <div className="rb-radio">
// // // //                 <label>Select no of days</label>
// // // //                 <div className="rb-radio-options">
// // // //                   {["single", "multiple"].map(v => (
// // // //                     <label key={v}><input type="radio" name="no_of_days" value={v} checked={formData.no_of_days === v} onChange={handleNoOfDaysChange} />{v.charAt(0).toUpperCase() + v.slice(1)}</label>
// // // //                   ))}
// // // //                 </div>
// // // //               </div>
// // // //             )}

// // // //             <div className="rb-main-form">
// // // //               <div className="rb-form-grid">
// // // //                 {renderDateFields()}
// // // //                 <div className="rb-groups"><label>Travel From<span className="asterisk">*</span></label><input type="text" name="travel_from" value={formData.travel_from} onChange={handleChange} /></div>
// // // //                 <div className="rb-groups"><label>Travel To<span className="asterisk">*</span></label><input type="text" name="travel_to" value={formData.travel_to} onChange={handleChange} /></div>
// // // //                 {formData.transport_type === "Outstation" && (
// // // //                   <>
// // // //                     <div className="rb-groups"><label>Transport Amount</label><input type="number" name="transport_amount" value={formData.transport_amount} onChange={handleChange} /></div>
// // // //                     <div className="rb-groups"><label>Accommodation Fees</label><input type="number" name="accommodation_fees" value={formData.accommodation_fees} onChange={handleChange} /></div>
// // // //                     <div className="rb-groups"><label>DA</label><input type="number" name="da" value={formData.da} onChange={handleChange} /></div>
// // // //                   </>
// // // //                 )}
// // // //                 <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // //               </div>

// // // //               <div className="purpose-attachment">
// // // //                 <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // //                 <div className="pa-groups">
// // // //                   <label>Attachment</label>
// // // //                   <div className="attachment-wrapper">
// // // //                     <div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div>
// // // //                     <div className="attachment-upload">
// // // //                       <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
// // // //                       <button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button>
// // // //                     </div>
// // // //                   </div>
// // // //                 </div>
// // // //               </div>
// // // //             </div>
// // // //           </>
// // // //         );

// // // //       case "Meals":
// // // //         return (
// // // //           <div className="rb-main-form">
// // // //             <div className="rb-form1-grid">
// // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // //               <div className="rb-groups"><label>Meal Type</label><select name="meal_type" value={formData.meal_type} onChange={handleChange}><option value="">Select</option><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="Full Day">Full Day</option></select></div>
// // // //               <div className="rb-groups"><label>Meal's objective</label><select name="meals_objective" value={formData.meals_objective} onChange={handleChange}><option value="">Select</option><option value="client_visit">Client Visit</option><option value="team_outing">Team Outing</option><option value="extended_work">Extended</option><option value="others">Others</option></select></div>
// // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // //             </div>
// // // //             <div className="purpose-attachment">
// // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // //             </div>
// // // //           </div>
// // // //         );

// // // //       case "Telecommunication":
// // // //         return (
// // // //           <div className="rb-main-form">
// // // //             <div className="rb-form2-grid">
// // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // //               <div className="rb-groups"><label>Service Provider</label><input type="text" name="service_provider" value={formData.service_provider} onChange={handleChange} /></div>
// // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // //             </div>
// // // //             <div className="purpose-attachment">
// // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // //             </div>
// // // //           </div>
// // // //         );

// // // //       case "Stationary":
// // // //         return (
// // // //           <div className="rb-main-form">
// // // //             <div className="rb-form1-grid">
// // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // //               <div className="rb-groups"><label>Stationary</label><select name="stationary" value={formData.stationary} onChange={handleChange}><option value="">Select</option><option value="office equipments">Office Equipments</option><option value="general stationary">General Stationary</option></select></div>
// // // //               <div className="rb-groups"><label>Purchasing Items</label><input type="text" name="purchasing_item" value={formData.purchasing_item} onChange={handleChange} /></div>
// // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // //             </div>
// // // //             <div className="purpose-attachment">
// // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // //             </div>
// // // //           </div>
// // // //         );

// // // //       case "Miscellaneous":
// // // //         return (
// // // //           <div className="rb-main-form">
// // // //             <div className="rb-form1-grid">
// // // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // // //             </div>
// // // //             <div className="purpose-attachment">
// // // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // // //             </div>
// // // //           </div>
// // // //         );

// // // //       default:
// // // //         return null;
// // // //     }
// // // //   };

// // // //   return (
// // // //     <div className="reimbursement-container">
// // // //       <div className="rb-form-header">{role !== "Manager" && role !== "Admin" && <h2>Reimbursement Requests</h2>}</div>

// // // //       <div className="filter-container">
// // // //         <div className="desktop-only date-filter-row">
// // // //           <div className="date-group">
// // // //             <label>From</label>
// // // //             <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
// // // //           </div>
// // // //           <div className="date-group">
// // // //             <label>To</label>
// // // //             <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
// // // //           </div>
// // // //           <button className="search-btn" onClick={applyFilters}><FaSearch /> Search</button>
// // // //         </div>

// // // //         <div className="status-apply-row">
// // // //           <label>Status By</label>
// // // //           <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
// // // //             <option value="pending">Pending</option>
// // // //             <option value="approved">Approved</option>
// // // //             <option value="rejected">Rejected</option>
// // // //           </select>

// // // //           <button className="apply-btn" onClick={() => {
// // // //             setShowForm(true); setEditingId(null); setSelectedFiles([]); setMobileStep(1);
// // // //             setFormData({
// // // //               employeeId, department_id: departmentId, claim_type: "", transport_type: "", fromDate: "", toDate: "", date: "", travel_from: "", travel_to: "",
// // // //               meals_objective: "", purpose: "", purchasing_item: "", accommodation_fees: "", no_of_days: "", total_amount: "", meal_type: "", stationary: "", service_provider: "", project: "", attachments: null
// // // //             });
// // // //           }}>Apply Claim</button>
// // // //         </div>
// // // //       </div>

// // // //       {errorMessage && <p className="rb-error-message">{errorMessage}</p>}

// // // //       <div className="reimbursement-table-scroll">
// // // //         <table className="reimbursement-table">
// // // //           <thead>
// // // //             <tr>
// // // //               <th>Sl No</th><th>Claim Type</th><th>Date</th><th>Purpose</th><th>Amount</th><th>Attachment</th><th>Status</th><th>Comments</th><th>Payment Status</th><th>Action</th>
// // // //             </tr>
// // // //           </thead>
// // // //           <tbody>
// // // //             {filteredReimbursements.map((c, i) => (
// // // //               <tr key={c.id}>
// // // //                 <td>{i + 1}</td>
// // // //                 <td>{c.claim_type}</td>
// // // //                 <td>{c.date_range ? c.date_range.split(" - ").map(formatDisplayDate).join(" - ") : c.date ? formatDisplayDate(c.date) : `${formatDisplayDate(c.from_date)} - ${formatDisplayDate(c.to_date)}`}</td>
// // // //                 <td><div className="rbadmin-comments">{c.purpose}</div></td>
// // // //                 <td>{c.total_amount}</td>
// // // //                 <td>{attachments[c.id]?.length ? <button className="attachments-btn" onClick={() => handleOpenAttachments(attachments[c.id], c)}><MdOutlineRemoveRedEye className="eye-icon" /> View</button> : "Not Attached"}</td>
// // // //                 <td><span className={`rb-status-label ${c.status === "approved" ? "rb-approved" : c.status === "rejected" ? "rb-rejected" : ""}`}>{c.status}</span></td>
// // // //                 <td><div className="rbadmin-comments">{c.approver_comments || "No comments"}</div></td>
// // // //                 <td>{c.payment_status}</td>
// // // //                 <td className="actions-column">
// // // //                   <MdOutlineEdit className={`edit-icon ${c.status?.toLowerCase() !== "pending" ? "disabled-icon" : ""}`} onClick={() => c.status?.toLowerCase() === "pending" && handleEdit(c)} />
// // // //                   <MdDeleteOutline className={`delete-icon ${c.status?.toLowerCase() !== "pending" ? "disabled-icon" : ""}`} onClick={() => c.status?.toLowerCase() === "pending" && deleteReimbursement(c.id)} />
// // // //                 </td>
// // // //               </tr>
// // // //             ))}
// // // //           </tbody>
// // // //           <tfoot>
// // // //             <tr className="total-row">
// // // //               <td colSpan="4" style={{ textAlign: "right", color: "#949494", fontWeight: "bold" }}>Total Amount Claiming: <span style={{ fontWeight: "bold", color: "black" }}>Rs {totalAmount}</span></td>
// // // //               <td colSpan="3" style={{ textAlign: "right" }}>Amount Approved: Rs <span style={{ fontWeight: "bold" }}>{approvedAmount}</span></td>
// // // //               <td colSpan="3" style={{ textAlign: "right" }}>Amount Rejected: Rs <span style={{ fontWeight: "bold" }}>{rejectedAmount}</span></td>
// // // //             </tr>
// // // //           </tfoot>
// // // //         </table>

// // // //         <div className="m-reimbursement-list">
// // // //           {filteredReimbursements.map((c, i) => {
// // // //             const Icon = claimTypes.find(t => t.label === c.claim_type)?.icon || null;
// // // //             return (
// // // //               <div className="m-list-item" key={c.id}>
// // // //                 <div className="m-item-left">
// // // //                   {Icon && <div className="m-item-icon">{Icon}</div>}
// // // //                   <div className="m-item-info">
// // // //                     <div className="m-item-title">{c.claim_type}</div>
// // // //                     <div className="m-item-date">
// // // //                       {c.date_range ? c.date_range.split(" - ").map(formatDisplayDate).join(" - ") : c.date ? formatDisplayDate(c.date) : `${formatDisplayDate(c.from_date)} - ${formatDisplayDate(c.to_date)}`}
// // // //                     </div>
// // // //                   </div>
// // // //                 </div>
// // // //                 <div className="m-item-right">
// // // //                   <div className="m-item-amount">Rs {c.total_amount}</div>
// // // //                   <div className={`m-item-status ${c.status?.toLowerCase() || "pending"}`}>{c.status}</div>
// // // //                   <div className="m-item-actions">
// // // //                     {attachments[c.id]?.length ? (
// // // //                       <button className="m-attach-btn" onClick={() => handleOpenAttachments(attachments[c.id], c)}>
// // // //                         <MdOutlineRemoveRedEye className="eye-icon" />
// // // //                       </button>
// // // //                     ) : null}
// // // //                     {c.status?.toLowerCase() === "pending" && (
// // // //                       <>
// // // //                         <MdOutlineEdit className="m-edit-icon" onClick={() => handleEdit(c)} />
// // // //                         <MdDeleteOutline className="m-delete-icon" onClick={() => deleteReimbursement(c.id)} />
// // // //                       </>
// // // //                     )}
// // // //                   </div>
// // // //                 </div>
// // // //               </div>
// // // //             );
// // // //           })}
// // // //         </div>
// // // //       </div>

// // // //       {/* FORM MODAL – MOBILE WIZARD */}
// // // //       {showForm && (
// // // //         <div className="rb-modal">
// // // //           <div className="rb-modal-content m-modal-content">
// // // //             <div className="claim-form-header">
// // // //               <h2 className="claim-form-title">
// // // //                 {mobileStep === 1 ? "Select Claim Type" : mobileStep === 2 ? "Select Transport Type" : editingId ? "Edit Claim" : "New Claim"}
// // // //               </h2>
// // // //               <MdOutlineCancel
// // // //                 className="claim-form-close"
// // // //                 onClick={() => {
// // // //                   setShowForm(false);
// // // //                   setMobileStep(1);
// // // //                   setFormData(prev => ({ ...prev, claim_type: "", transport_type: "" }));
// // // //                 }}
// // // //               />
// // // //             </div>

// // // //             {submitErrorMessage && <p className="rb-error-message">{submitErrorMessage}</p>}

// // // //             <form className="reimbursement-form" onSubmit={handleSubmit}>
// // // //               {/* STEP 1: Claim Type */}
// // // //               <div className={`mobile-wizard-step ${mobileStep === 1 ? 'active' : ''}`}>
// // // //                 <div className="claim-type">
// // // //                   <div className="rb-groups">
// // // //                     <label>Project<span className="asterisk">*</span></label>
// // // //                     <select name="project" value={formData.project} onChange={handleChange} required>
// // // //                       <option value="">Select project</option>
// // // //                       <option value="Company Claim">Company Claim</option>
// // // //                       {projects.map((p, i) => (
// // // //                         <option key={i} value={p}>{p}</option>
// // // //                       ))}
// // // //                     </select>
// // // //                   </div>

// // // //                   <div className="rb-tabs">
// // // //                     {claimTypes.map(({ icon, label }) => (
// // // //                       <div
// // // //                         key={label}
// // // //                         className={`rb-tab ${formData.claim_type === label ? "active" : ""}`}
// // // //                         onClick={() => handleClaimTypeChange(label)}
// // // //                       >
// // // //                         {icon} <span>{label}</span>
// // // //                       </div>
// // // //                     ))}
// // // //                   </div>
// // // //                 </div>
// // // //               </div>

// // // //               {/* STEP 2: Transport Subtype */}
// // // //               <div className={`mobile-wizard-step ${mobileStep === 2 ? 'active' : ''}`}>
// // // //                 <div className="mobile-step-back" onClick={() => setMobileStep(1)}>
// // // //                   ← Change Claim Type
// // // //                 </div>
// // // //                 <div className="sub-tabs">
// // // //                   {transportSubTypes.map(t => (
// // // //                     <div
// // // //                       key={t}
// // // //                       className={`sub-tab ${formData.transport_type === t ? "active" : ""}`}
// // // //                       onClick={() => handleTransportSubTypeChange(t)}
// // // //                     >
// // // //                       {t}
// // // //                     </div>
// // // //                   ))}
// // // //                 </div>
// // // //               </div>

// // // //               {/* STEP 3: Main Form */}
// // // //               <div className={`mobile-wizard-step ${mobileStep === 3 ? 'active' : ''}`}>
// // // //                 <div className="mobile-step-back" onClick={() => setMobileStep(formData.claim_type === "Transportation" ? 2 : 1)}>
// // // //                   ← Change {formData.claim_type === "Transportation" ? "Sub-Type" : "Claim Type"}
// // // //                 </div>

// // // //                 {renderClaimSpecificFields()}

// // // //                 <div className="reimbursement-form-button m-form-buttons">
// // // //                   <button type="button" className="rb-close m-close" onClick={() => setShowForm(false)}>
// // // //                     Cancel
// // // //                   </button>
// // // //                   <button type="submit" className="rb-submit m-submit">
// // // //                     {editingId ? "Update" : "Submit"}
// // // //                   </button>
// // // //                 </div>
// // // //               </div>
// // // //             </form>
// // // //           </div>
// // // //         </div>
// // // //       )}

// // // //       {/* ATTACHMENTS MODAL */}
// // // //       {isModalOpen && (
// // // //         <div className="att-modal-overlay">
// // // //           <div className="att-modal-content">
// // // //             <div className="att-header">
// // // //               <h2>Attachments</h2>
// // // //               <MdOutlineCancel className="att-close" onClick={() => setIsModalOpen(false)} />
// // // //             </div>
// // // //             <h4 className="att-files">{selectedClaim?.claim_type} Bills</h4>
// // // //             {selectedFiles.length ? selectedFiles.map((f, i) => (
// // // //               <div className="att-files" key={i}><a href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a></div>
// // // //             )) : <p>No attachments</p>}
// // // //             <button className="att-close-btn" onClick={() => setIsModalOpen(false)}>Close</button>
// // // //           </div>
// // // //         </div>
// // // //       )}

// // // //       <Modal isVisible={confirmModal.isVisible} onClose={closeConfirm} buttons={[{ label: "Cancel", onClick: closeConfirm }, { label: "Confirm", onClick: confirmModal.onConfirm }]}><p>{confirmModal.message}</p></Modal>
// // // //       <Modal isVisible={alertModal.isVisible} onClose={closeAlert} buttons={[{ label: "OK", onClick: closeAlert }]}><p>{alertModal.message}</p></Modal>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default Reimbursement;


// // // "use client";

// // // import React, { useState, useEffect, useCallback, useRef } from "react";
// // // import axios from "axios";
// // // import { FaSearch } from "react-icons/fa";
// // // import {
// // //   MdOutlineEdit,
// // //   MdDeleteOutline,
// // //   MdOutlineCancel,
// // //   MdEmojiTransportation,
// // //   MdOutlinePhoneAndroid,
// // //   MdOutlineRemoveRedEye,
// // // } from "react-icons/md";
// // // import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
// // // import { TbTriangleSquareCircle } from "react-icons/tb";
// // // import "./Reimbursement.css";
// // // import Modal from "../Modal/Modal.client";
// // // import { useAuth } from "../../context/AuthProvider.client";

// // // const claimTypes = [
// // //   { icon: <MdEmojiTransportation className="claim-icons" />, label: "Transportation" },
// // //   { icon: <GiKnifeFork className="claim-icons" />, label: "Meals" },
// // //   { icon: <MdOutlinePhoneAndroid className="claim-icons" />, label: "Telecommunication" },
// // //   { icon: <GiPencilBrush className="claim-icons" />, label: "Stationary" },
// // //   { icon: <TbTriangleSquareCircle className="claim-icons" />, label: "Miscellaneous" },
// // // ];

// // // const transportSubTypes = ["Outstation", "Intercity", "Fuel"];

// // // const Reimbursement = () => {
// // //   const { user } = useAuth();
// // //   const orgId = user?.orgId || user?.org_id || null;
// // //   const role = user?.role || " ";
// // //   const authToken = user?.token;
// // //   const employeeId = user?.employeeId;
// // //   const departmentId = user?.department_id;

// // //   const [reimbursements, setReimbursements] = useState([]);
// // //   const [filteredReimbursements, setFilteredReimbursements] = useState([]);
// // //   const [fromDate, setFromDate] = useState("");
// // //   const [toDate, setToDate] = useState("");
// // //   const [showForm, setShowForm] = useState(false);
// // //   const [editingId, setEditingId] = useState(null);
// // //   const [attachments, setAttachments] = useState({});
// // //   const [isModalOpen, setIsModalOpen] = useState(false);
// // //   const [selectedFiles, setSelectedFiles] = useState([]);
// // //   const [selectedClaim, setSelectedClaim] = useState(null);
// // //   const [errorMessage, setErrorMessage] = useState("");
// // //   const [updateErrorMessage, setUpdateErrorMessage] = useState("");
// // //   const [submitErrorMessage, setSubmitErrorMessage] = useState("");
// // //   const [projects, setProjects] = useState([]);
// // //   const [statusFilter, setStatusFilter] = useState("pending");
// // //   const [mobileStep, setMobileStep] = useState(1); // 1 = claim type, 2 = transport subtype, 3 = form

// // //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
// // //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// // //   const fileInputRef = useRef(null);

// // //   const [formData, setFormData] = useState({
// // //     employeeId,
// // //     department_id: departmentId,
// // //     claim_type: "",
// // //     transport_type: "",
// // //     transport_amount: "",
// // //     da: "",
// // //     fromDate: "",
// // //     toDate: "",
// // //     date: "",
// // //     travel_from: "",
// // //     travel_to: "",
// // //     meals_objective: "",
// // //     purpose: "",
// // //     purchasing_item: "",
// // //     accommodation_fees: "",
// // //     no_of_days: "",
// // //     total_amount: "",
// // //     meal_type: "",
// // //     stationary: "",
// // //     service_provider: "",
// // //     project: "",
// // //     attachments: null,
// // //   });

// // //   const formatDisplayDate = (raw) => {
// // //     if (!raw) return "N/A";
// // //     const d = raw instanceof Date ? raw : new Date(raw);
// // //     if (isNaN(d)) return raw;
// // //     const day = String(d.getDate()).padStart(2, "0");
// // //     const month = d.toLocaleString("en-GB", { month: "short" });
// // //     const year = d.getFullYear();
// // //     return `${day}-${month}-${year}`;
// // //   };

// // //   const [confirmModal, setConfirmModal] = useState({ isVisible: false, message: "", onConfirm: null });
// // //   const showConfirm = (msg, onConfirm) => setConfirmModal({ isVisible: true, message: msg, onConfirm });
// // //   const closeConfirm = () => setConfirmModal({ isVisible: false, message: "", onConfirm: null });

// // //   const [alertModal, setAlertModal] = useState({ isVisible: false, title: "", message: "" });
// // //   const showAlert = (msg, title = "") => setAlertModal({ isVisible: true, title, message: msg });
// // //   const closeAlert = () => setAlertModal({ isVisible: false, title: "", message: "" });

// // //   const fetchReimbursements = useCallback(async () => {
// // //     try {
// // //       const response = await axios.get(`${BACKEND_URL}/reimbursement/${employeeId}`, {
// // //         headers: {
// // //           "x-api-key": API_KEY,
// // //           "Content-Type": "application/json",
// // //           Authorization: `Bearer ${authToken}`,
// // //           "x-org-id": orgId,
// // //         },
// // //       });

// // //       const data = Array.isArray(response.data) ? response.data : response.data || [];
// // //       setReimbursements(data);

// // //       const att = {};
// // //       await Promise.all(
// // //         data.map(async (c) => {
// // //           try {
// // //             const r = await axios.get(`${BACKEND_URL}/reimbursement/${c.id}/attachments`, {
// // //               headers: { "x-api-key": API_KEY, Authorization: `Bearer ${authToken}`, "x-org-id": orgId },
// // //             });
// // //             att[c.id] = (r.data.attachments || []).map((f) => ({
// // //               ...f,
// // //               orgId: orgId,
// // //               year: (f.file_path?.split("/").find((_, i, a) => a[i - 1] === "reimbursement")?.split("/")?.[2]) || "",
// // //               month: (f.file_path?.split("/").find((_, i, a) => a[i - 1] === "reimbursement")?.split("/")?.[3]) || "",
// // //               employeeId: c.employee_id || c.employeeId || employeeId,
// // //             }));
// // //           } catch { att[c.id] = []; }
// // //         })
// // //       );
// // //       setAttachments(att);
// // //     } catch (e) {
// // //       console.error(e);
// // //       setErrorMessage(e?.response?.data?.message || "Failed to load reimbursements");
// // //       showAlert(e?.response?.data?.message || "Error loading data");
// // //     }
// // //   }, [employeeId, authToken, orgId]);

// // //   const fetchProjects = useCallback(async () => {
// // //     try {
// // //       const r = await axios.get(`${BACKEND_URL}/projectdrop`, { headers: { "x-api-key": API_KEY, "x-org-id": orgId } });
// // //       setProjects(r.data || []);
// // //     } catch { }
// // //   }, [orgId]);

// // //   useEffect(() => {
// // //     if (employeeId) {
// // //       fetchReimbursements();
// // //       fetchProjects();
// // //     }
// // //   }, [fetchReimbursements, fetchProjects, employeeId]);

// // //   const tryParseDate = (s) => {
// // //     if (!s) return null;
// // //     if (s instanceof Date && !isNaN(s)) return s;
// // //     const d = new Date(s);
// // //     if (!isNaN(d)) return d;
// // //     const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/);
// // //     if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
// // //     return null;
// // //   };

// // //   const normalizeStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
// // //   const normalizeEndOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// // //   const parseClaimRange = (c) => {
// // //     let start = null, end = null;
// // //     if (c.date_range) {
// // //       const parts = c.date_range.replace(/\s+to\s+/gi, " - ").replace(/[–—]/g, " - ").split(" - ").map(p => p.trim());
// // //       if (parts.length >= 2) { start = tryParseDate(parts[0]); end = tryParseDate(parts[1]); }
// // //     }
// // //     if (!start && (c.from_date || c.fromDate)) start = tryParseDate(c.from_date || c.fromDate);
// // //     if (!end && (c.to_date || c.toDate)) end = tryParseDate(c.to_date || c.toDate);
// // //     if (!start && c.date) { start = tryParseDate(c.date); end = start; }
// // //     if (start && !end) end = start;
// // //     if (start && end) { start = normalizeStartOfDay(start); end = normalizeEndOfDay(end); }
// // //     return { start, end };
// // //   };

// // //   const applyFilters = useCallback(() => {
// // //     const f = fromDate ? normalizeStartOfDay(tryParseDate(fromDate)) : null;
// // //     const t = toDate ? normalizeEndOfDay(tryParseDate(toDate)) : null;

// // //     const filtered = reimbursements.filter(c => {
// // //       if (statusFilter && c.status?.toLowerCase() !== statusFilter) return false;
// // //       if (!f && !t) return true;
// // //       const { start, end } = parseClaimRange(c);
// // //       if (!start || !end) return !f && !t;
// // //       if (f && !t) return end >= f;
// // //       if (!f && t) return start <= t;
// // //       return end >= f && start <= t;
// // //     });
// // //     setFilteredReimbursements(filtered);
// // //   }, [reimbursements, fromDate, toDate, statusFilter]);

// // //   useEffect(() => applyFilters(), [applyFilters]);

// // //   const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
// // //   const handleClaimTypeChange = (type) => {
// // //     setFormData(p => ({ ...p, claim_type: type, transport_type: "", no_of_days: "" }));
// // //     setSelectedFiles([]); setSelectedClaim(null);
// // //     setMobileStep(type === "Transportation" ? 2 : 3);
// // //   };
// // //   const handleTransportSubTypeChange = (t) => {
// // //     setFormData(p => ({ ...p, transport_type: t, no_of_days: "" }));
// // //     setMobileStep(3);
// // //   };
// // //   const handleNoOfDaysChange = (e) => setFormData(p => ({ ...p, no_of_days: e.target.value }));
// // //   const handleFileUpload = (e) => {
// // //     const files = Array.from(e.target.files);
// // //     setSelectedFiles(files.map(f => f.name));
// // //     setFormData(p => ({ ...p, attachments: files }));
// // //   };

// // //   const renderDateFields = () => {
// // //     if (formData.transport_type === "Outstation") {
// // //       return (
// // //         <>
// // //           <div className="rb-groups"><label>From Date<span className="asterisk">*</span></label><input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // //           <div className="rb-groups"><label>To Date<span className="asterisk">*</span></label><input type="date" name="toDate" value={formData.toDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // //         </>
// // //       );
// // //     }
// // //     if (formData.no_of_days === "single") {
// // //       return (
// // //         <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // //       );
// // //     }
// // //     if (formData.no_of_days === "multiple") {
// // //       return (
// // //         <>
// // //           <div className="rb-groups"><label>From Date<span className="asterisk">*</span></label><input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // //           <div className="rb-groups"><label>To Date<span className="asterisk">*</span></label><input type="date" name="toDate" value={formData.toDate} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // //         </>
// // //       );
// // //     }
// // //     return null;
// // //   };

// // //   const handleEdit = (c) => {
// // //     setEditingId(c.id);
// // //     setShowForm(true);
// // //     setMobileStep(3); // Skip to form
// // //     const atts = attachments[c.id] || [];
// // //     setFormData({
// // //       employeeId: c.employeeId || c.employee_id || employeeId,
// // //       department_id: c.department_id || departmentId,
// // //       claim_type: c.claim_type || "",
// // //       transport_type: c.transport_type || "",
// // //       fromDate: c.from_date?.substring(0, 10) || c.fromDate || "",
// // //       toDate: c.to_date?.substring(0, 10) || c.toDate || "",
// // //       date: c.date?.substring(0, 10) || "",
// // //       travel_from: c.travel_from || "",
// // //       travel_to: c.travel_to || "",
// // //       meals_objective: c.meals_objective || "",
// // //       purpose: c.purpose || "",
// // //       purchasing_item: c.purchasing_item || "",
// // //       accommodation_fees: c.accommodation_fees || "",
// // //       transport_amount: c.transport_amount || "",
// // //       da: c.da || "",
// // //       no_of_days: c.no_of_days || "",
// // //       total_amount: c.total_amount || "",
// // //       meal_type: c.meal_type || "",
// // //       stationary: c.stationary || "",
// // //       service_provider: c.service_provider || "",
// // //       project: c.project || "",
// // //       attachments: atts,
// // //     });
// // //     setSelectedFiles(atts.map(f => f.file_name || f.name));
// // //   };

// // //   const handleSubmit = async (e) => {
// // //     e.preventDefault();
// // //     setSubmitErrorMessage("");
// // //     const words = formData.purpose?.trim().split(/\s+/).filter(Boolean).length || 0;
// // //     if (words < 10) { showAlert(`Purpose must be at least 10 words (you have ${words})`); return; }

// // //     const fd = new FormData();
// // //     Object.entries(formData).forEach(([k, v]) => { if (k !== "attachments" && v != null) fd.append(k, v); });
// // //     fd.append("role", role);
// // //     if (orgId) fd.append("orgId", orgId);
// // //     (formData.attachments || []).forEach(f => f instanceof File && fd.append("attachments", f));

// // //     try {
// // //       const cfg = { headers: { "x-api-key": API_KEY, "Content-Type": "multipart/form-data", Authorization: `Bearer ${authToken}`, "x-org-id": orgId } };
// // //       editingId
// // //         ? await axios.put(`${BACKEND_URL}/reimbursement/${editingId}`, fd, cfg)
// // //         : await axios.post(`${BACKEND_URL}/reimbursement`, fd, cfg);
// // //       showAlert("Submitted successfully!");
// // //       setShowForm(false); setEditingId(null); setSelectedFiles([]); setMobileStep(1); fetchReimbursements();
// // //     } catch (err) {
// // //       const msg = err?.response?.data?.error || err?.response?.data?.message || "Submission failed";
// // //       setSubmitErrorMessage(msg); showAlert(msg);
// // //     }
// // //   };

// // //   const deleteReimbursement = (id) => showConfirm("Delete this claim?", async () => {
// // //     try {
// // //       await axios.delete(`${BACKEND_URL}/reimbursement/${id}`, { headers: { "x-api-key": API_KEY, "x-org-id": orgId, Authorization: `Bearer ${authToken}` } });
// // //       showAlert("Deleted!"); fetchReimbursements();
// // //     } catch { showAlert("Delete failed"); } finally { closeConfirm(); }
// // //   });

// // //   const handleOpenAttachments = async (files, claim) => {
// // //     try {
// // //       const blobs = await Promise.all(
// // //         (files || []).map(async (f) => {
// // //           const name = f.file_name || f.name;
// // //           const match = name.match(/^(\d{4})-(\d{2})/);
// // //           if (!match) return null;
// // //           const [, y, m] = match;
// // //           const url = `${BACKEND_URL}/reimbursement/${orgId}/${y}/${m}/${claim.employee_id || claim.employeeId || employeeId}/${name}`;
// // //           const r = await axios.get(url, { headers: { "x-api-key": API_KEY, Authorization: `Bearer ${authToken}`, "x-org-id": orgId }, responseType: "blob" });
// // //           return { name, url: URL.createObjectURL(new Blob([r.data], { type: r.headers["content-type"] })) };
// // //         })
// // //       );
// // //       const valid = blobs.filter(Boolean);
// // //       if (!valid.length) return showAlert("No attachments");
// // //       setSelectedFiles(valid); setSelectedClaim(claim); setIsModalOpen(true);
// // //     } catch { showAlert("Failed to load attachments"); }
// // //   };

// // //   const totalAmount = filteredReimbursements.reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);
// // //   const approvedAmount = filteredReimbursements.filter(c => c.status?.toLowerCase() === "approved").reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);
// // //   const rejectedAmount = filteredReimbursements.filter(c => c.status?.toLowerCase() === "rejected").reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0);

// // //   const renderClaimSpecificFields = () => {
// // //     switch (formData.claim_type) {
// // //       case "Transportation":
// // //         return (
// // //           <>
// // //             {(formData.transport_type === "Intercity" || formData.transport_type === "Fuel") && (
// // //               <div className="rb-radio">
// // //                 <label>Select no of days</label>
// // //                 <div className="rb-radio-options">
// // //                   {["single", "multiple"].map(v => (
// // //                     <label key={v}><input type="radio" name="no_of_days" value={v} checked={formData.no_of_days === v} onChange={handleNoOfDaysChange} />{v.charAt(0).toUpperCase() + v.slice(1)}</label>
// // //                   ))}
// // //                 </div>
// // //               </div>
// // //             )}

// // //             <div className="rb-main-form">
// // //               <div className="rb-form-grid">
// // //                 {renderDateFields()}
// // //                 <div className="rb-groups"><label>Travel From<span className="asterisk">*</span></label><input type="text" name="travel_from" value={formData.travel_from} onChange={handleChange} /></div>
// // //                 <div className="rb-groups"><label>Travel To<span className="asterisk">*</span></label><input type="text" name="travel_to" value={formData.travel_to} onChange={handleChange} /></div>
// // //                 {formData.transport_type === "Outstation" && (
// // //                   <>
// // //                     <div className="rb-groups"><label>Transport Amount</label><input type="number" name="transport_amount" value={formData.transport_amount} onChange={handleChange} /></div>
// // //                     <div className="rb-groups"><label>Accommodation Fees</label><input type="number" name="accommodation_fees" value={formData.accommodation_fees} onChange={handleChange} /></div>
// // //                     <div className="rb-groups"><label>DA</label><input type="number" name="da" value={formData.da} onChange={handleChange} /></div>
// // //                   </>
// // //                 )}
// // //                 <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // //               </div>

// // //               <div className="purpose-attachment">
// // //                 <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // //                 <div className="pa-groups">
// // //                   <label>Attachment</label>
// // //                   <div className="attachment-wrapper">
// // //                     <div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div>
// // //                     <div className="attachment-upload">
// // //                       <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
// // //                       <button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button>
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </>
// // //         );

// // //       case "Meals":
// // //         return (
// // //           <div className="rb-main-form">
// // //             <div className="rb-form1-grid">
// // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // //               <div className="rb-groups"><label>Meal Type</label><select name="meal_type" value={formData.meal_type} onChange={handleChange}><option value="">Select</option><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="Full Day">Full Day</option></select></div>
// // //               <div className="rb-groups"><label>Meal's objective</label><select name="meals_objective" value={formData.meals_objective} onChange={handleChange}><option value="">Select</option><option value="client_visit">Client Visit</option><option value="team_outing">Team Outing</option><option value="extended_work">Extended</option><option value="others">Others</option></select></div>
// // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // //             </div>
// // //             <div className="purpose-attachment">
// // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // //             </div>
// // //           </div>
// // //         );

// // //       case "Telecommunication":
// // //         return (
// // //           <div className="rb-main-form">
// // //             <div className="rb-form2-grid">
// // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // //               <div className="rb-groups"><label>Service Provider</label><input type="text" name="service_provider" value={formData.service_provider} onChange={handleChange} /></div>
// // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // //             </div>
// // //             <div className="purpose-attachment">
// // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // //             </div>
// // //           </div>
// // //         );

// // //       case "Stationary":
// // //         return (
// // //           <div className="rb-main-form">
// // //             <div className="rb-form1-grid">
// // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // //               <div className="rb-groups"><label>Stationary</label><select name="stationary" value={formData.stationary} onChange={handleChange}><option value="">Select</option><option value="office equipments">Office Equipments</option><option value="general stationary">General Stationary</option></select></div>
// // //               <div className="rb-groups"><label>Purchasing Items</label><input type="text" name="purchasing_item" value={formData.purchasing_item} onChange={handleChange} /></div>
// // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // //             </div>
// // //             <div className="purpose-attachment">
// // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // //             </div>
// // //           </div>
// // //         );

// // //       case "Miscellaneous":
// // //         return (
// // //           <div className="rb-main-form">
// // //             <div className="rb-form1-grid">
// // //               <div className="rb-groups"><label>Date<span className="asterisk">*</span></label><input type="date" name="date" value={formData.date} onChange={handleChange} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} /></div>
// // //               <div className="rb-groups"><label>Total Amount<span className="asterisk">*</span></label><input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} /></div>
// // //             </div>
// // //             <div className="purpose-attachment">
// // //               <div className="pa-groups"><label>Purpose Details / Comments<span className="asterisk">*</span></label><textarea name="purpose" value={formData.purpose} onChange={handleChange} /></div>
// // //               <div className="pa-groups"><label>Attachment</label><div className="attachment-wrapper"><div className="file-links">{selectedFiles.length ? selectedFiles.map((n, i) => <p key={i} className="file-name">{n}</p>) : <p>No files selected</p>}</div><div className="attachment-upload"><input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} /><button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>Browse</button></div></div></div>
// // //             </div>
// // //           </div>
// // //         );

// // //       default:
// // //         return null;
// // //     }
// // //   };

// // //   return (
// // //     <div className="reimbursement-container">
// // //       <div className="rb-form-header">{role !== "Manager" && role !== "Admin" && <h2>Reimbursement Requests</h2>}</div>

// // //       <div className="filter-container">
// // //         <div className="desktop-filter-row">
// // //           <div className="date-group">
// // //             <label>From</label>
// // //             <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
// // //           </div>
// // //           <div className="date-group">
// // //             <label>To</label>
// // //             <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
// // //           </div>
// // //           <button className="search-btn" onClick={applyFilters}><FaSearch /> Search</button>
// // //         </div>

// // //         <div className="status-apply-row">
// // //           <label>Status By</label>
// // //           <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
// // //             <option value="pending">Pending</option>
// // //             <option value="approved">Approved</option>
// // //             <option value="rejected">Rejected</option>
// // //           </select>

// // //           <button className="apply-btn" onClick={() => {
// // //             setShowForm(true); setEditingId(null); setSelectedFiles([]); setMobileStep(1);
// // //             setFormData({
// // //               employeeId, department_id: departmentId, claim_type: "", transport_type: "", fromDate: "", toDate: "", date: "", travel_from: "", travel_to: "",
// // //               meals_objective: "", purpose: "", purchasing_item: "", accommodation_fees: "", no_of_days: "", total_amount: "", meal_type: "", stationary: "", service_provider: "", project: "", attachments: null
// // //             });
// // //           }}>Apply Claim</button>
// // //         </div>
// // //       </div>

// // //       {errorMessage && <p className="rb-error-message">{errorMessage}</p>}

// // //       <div className="reimbursement-table-scroll">
// // //         <table className="reimbursement-table">
// // //           <thead>
// // //             <tr>
// // //               <th>Sl No</th><th>Claim Type</th><th>Date</th><th>Purpose</th><th>Amount</th><th>Attachment</th><th>Status</th><th>Comments</th><th>Payment Status</th><th>Action</th>
// // //             </tr>
// // //           </thead>
// // //           <tbody>
// // //             {filteredReimbursements.map((c, i) => (
// // //               <tr key={c.id}>
// // //                 <td>{i + 1}</td>
// // //                 <td>{c.claim_type}</td>
// // //                 <td>{c.date_range ? c.date_range.split(" - ").map(formatDisplayDate).join(" - ") : c.date ? formatDisplayDate(c.date) : `${formatDisplayDate(c.from_date)} - ${formatDisplayDate(c.to_date)}`}</td>
// // //                 <td><div className="rbadmin-comments">{c.purpose}</div></td>
// // //                 <td>{c.total_amount}</td>
// // //                 <td>{attachments[c.id]?.length ? <button className="attachments-btn" onClick={() => handleOpenAttachments(attachments[c.id], c)}><MdOutlineRemoveRedEye className="eye-icon" /> View</button> : "Not Attached"}</td>
// // //                 <td><span className={`rb-status-label ${c.status === "approved" ? "rb-approved" : c.status === "rejected" ? "rb-rejected" : ""}`}>{c.status}</span></td>
// // //                 <td><div className="rbadmin-comments">{c.approver_comments || "No comments"}</div></td>
// // //                 <td>{c.payment_status}</td>
// // //                 <td className="actions-column">
// // //                   <MdOutlineEdit className={`edit-icon ${c.status?.toLowerCase() !== "pending" ? "disabled-icon" : ""}`} onClick={() => c.status?.toLowerCase() === "pending" && handleEdit(c)} />
// // //                   <MdDeleteOutline className={`delete-icon ${c.status?.toLowerCase() !== "pending" ? "disabled-icon" : ""}`} onClick={() => c.status?.toLowerCase() === "pending" && deleteReimbursement(c.id)} />
// // //                 </td>
// // //               </tr>
// // //             ))}
// // //           </tbody>
// // //           <tfoot>
// // //             <tr className="total-row">
// // //               <td colSpan="4" style={{ textAlign: "right", color: "#949494", fontWeight: "bold" }}>Total Amount Claiming: <span style={{ fontWeight: "bold", color: "black" }}>Rs {totalAmount}</span></td>
// // //               <td colSpan="3" style={{ textAlign: "right" }}>Amount Approved: Rs <span style={{ fontWeight: "bold" }}>{approvedAmount}</span></td>
// // //               <td colSpan="3" style={{ textAlign: "right" }}>Amount Rejected: Rs <span style={{ fontWeight: "bold" }}>{rejectedAmount}</span></td>
// // //             </tr>
// // //           </tfoot>
// // //         </table>

// // //         <div className="m-reimbursement-list">
// // //           {filteredReimbursements.map((c, i) => {
// // //             const Icon = claimTypes.find(t => t.label === c.claim_type)?.icon || null;
// // //             return (
// // //               <div className="m-list-item" key={c.id}>
// // //                 <div className="m-item-left">
// // //                   {Icon && <div className="m-item-icon">{Icon}</div>}
// // //                   <div className="m-item-info">
// // //                     <div className="m-item-title">{c.claim_type}</div>
// // //                     <div className="m-item-date">
// // //                       {c.date_range ? c.date_range.split(" - ").map(formatDisplayDate).join(" - ") : c.date ? formatDisplayDate(c.date) : `${formatDisplayDate(c.from_date)} - ${formatDisplayDate(c.to_date)}`}
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //                 <div className="m-item-right">
// // //                   <div className="m-item-amount">Rs {c.total_amount}</div>
// // //                   <div className={`m-item-status ${c.status?.toLowerCase() || "pending"}`}>{c.status}</div>
// // //                   <div className="m-item-actions">
// // //                     {attachments[c.id]?.length ? (
// // //                       <button className="m-attach-btn" onClick={() => handleOpenAttachments(attachments[c.id], c)}>
// // //                         <MdOutlineRemoveRedEye className="eye-icon" />
// // //                       </button>
// // //                     ) : null}
// // //                     {c.status?.toLowerCase() === "pending" && (
// // //                       <>
// // //                         <MdOutlineEdit className="m-edit-icon" onClick={() => handleEdit(c)} />
// // //                         <MdDeleteOutline className="m-delete-icon" onClick={() => deleteReimbursement(c.id)} />
// // //                       </>
// // //                     )}
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             );
// // //           })}
// // //         </div>
// // //       </div>

// // //       {/* FORM MODAL – MOBILE WIZARD */}
// // //       {showForm && (
// // //         <div className="rb-modal">
// // //           <div className="rb-modal-content m-modal-content">
// // //             <div className="claim-form-header">
// // //               <h2 className="claim-form-title">
// // //                 {mobileStep === 1 ? "Select Claim Type" : mobileStep === 2 ? "Select Transport Type" : editingId ? "Edit Claim" : "New Claim"}
// // //               </h2>
// // //               <MdOutlineCancel
// // //                 className="claim-form-close"
// // //                 onClick={() => {
// // //                   setShowForm(false);
// // //                   setMobileStep(1);
// // //                   setFormData(prev => ({ ...prev, claim_type: "", transport_type: "" }));
// // //                 }}
// // //               />
// // //             </div>

// // //             {submitErrorMessage && <p className="rb-error-message">{submitErrorMessage}</p>}

// // //             <form className="reimbursement-form" onSubmit={handleSubmit}>
// // //               {/* STEP 1: Claim Type */}
// // //               <div className={`mobile-wizard-step ${mobileStep === 1 ? 'active' : ''}`}>
// // //                 <div className="claim-type">
// // //                   <div className="rb-groups">
// // //                     <label>Project<span className="asterisk">*</span></label>
// // //                     <select name="project" value={formData.project} onChange={handleChange} required>
// // //                       <option value="">Select project</option>
// // //                       <option value="Company Claim">Company Claim</option>
// // //                       {projects.map((p, i) => (
// // //                         <option key={i} value={p}>{p}</option>
// // //                       ))}
// // //                     </select>
// // //                   </div>

// // //                   <div className="rb-tabs">
// // //                     {claimTypes.map(({ icon, label }) => (
// // //                       <div
// // //                         key={label}
// // //                         className={`rb-tab ${formData.claim_type === label ? "active" : ""}`}
// // //                         onClick={() => handleClaimTypeChange(label)}
// // //                       >
// // //                         {icon} <span>{label}</span>
// // //                       </div>
// // //                     ))}
// // //                   </div>
// // //                 </div>
// // //               </div>

// // //               {/* STEP 2: Transport Subtype */}
// // //               <div className={`mobile-wizard-step ${mobileStep === 2 ? 'active' : ''}`}>
// // //                 <div className="mobile-step-back" onClick={() => setMobileStep(1)}>
// // //                   ← Change Claim Type
// // //                 </div>
// // //                 <div className="sub-tabs">
// // //                   {transportSubTypes.map(t => (
// // //                     <div
// // //                       key={t}
// // //                       className={`sub-tab ${formData.transport_type === t ? "active" : ""}`}
// // //                       onClick={() => handleTransportSubTypeChange(t)}
// // //                     >
// // //                       {t}
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //               </div>

// // //               {/* STEP 3: Main Form */}
// // //               <div className={`mobile-wizard-step ${mobileStep === 3 ? 'active' : ''}`}>
// // //                 <div className="mobile-step-back" onClick={() => setMobileStep(formData.claim_type === "Transportation" ? 2 : 1)}>
// // //                   ← Change {formData.claim_type === "Transportation" ? "Sub-Type" : "Claim Type"}
// // //                 </div>

// // //                 {renderClaimSpecificFields()}

// // //                 <div className="reimbursement-form-button m-form-buttons">
// // //                   <button type="button" className="rb-close m-close" onClick={() => setShowForm(false)}>
// // //                     Cancel
// // //                   </button>
// // //                   <button type="submit" className="rb-submit m-submit">
// // //                     {editingId ? "Update" : "Submit"}
// // //                   </button>
// // //                 </div>
// // //               </div>
// // //             </form>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* ATTACHMENTS MODAL */}
// // //       {isModalOpen && (
// // //         <div className="att-modal-overlay">
// // //           <div className="att-modal-content">
// // //             <div className="att-header">
// // //               <h2>Attachments</h2>
// // //               <MdOutlineCancel className="att-close" onClick={() => setIsModalOpen(false)} />
// // //             </div>
// // //             <h4 className="att-files">{selectedClaim?.claim_type} Bills</h4>
// // //             {selectedFiles.length ? selectedFiles.map((f, i) => (
// // //               <div className="att-files" key={i}><a href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a></div>
// // //             )) : <p>No attachments</p>}
// // //             <button className="att-close-btn" onClick={() => setIsModalOpen(false)}>Close</button>
// // //           </div>
// // //         </div>
// // //       )}

// // //       <Modal isVisible={confirmModal.isVisible} onClose={closeConfirm} buttons={[{ label: "Cancel", onClick: closeConfirm }, { label: "Confirm", onClick: confirmModal.onConfirm }]}><p>{confirmModal.message}</p></Modal>
// // //       <Modal isVisible={alertModal.isVisible} onClose={closeAlert} buttons={[{ label: "OK", onClick: closeAlert }]}><p>{alertModal.message}</p></Modal>
// // //     </div>
// // //   );
// // // };

// // // export default Reimbursement;

// // // "use client";

// // // import React, { useState, useEffect, useCallback, useRef } from "react";
// // // import axios from "axios";
// // // import { FaSearch } from "react-icons/fa";
// // // import {
// // //   MdOutlineEdit,
// // //   MdDeleteOutline,
// // //   MdOutlineCancel,
// // //   MdEmojiTransportation,
// // //   MdOutlinePhoneAndroid,
// // //   MdOutlineRemoveRedEye,
// // // } from "react-icons/md";
// // // import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
// // // import { TbTriangleSquareCircle } from "react-icons/tb";
// // // import "./Reimbursement.css";
// // // import Modal from "../Modal/Modal.client";
// // // import { useAuth } from "../../context/AuthProvider.client";

// // // const claimTypes = [
// // //   {
// // //     icon: <MdEmojiTransportation className="claim-icons" />,
// // //     label: "Transportation",
// // //   },
// // //   { icon: <GiKnifeFork className="claim-icons" />, label: "Meals" },
// // //   {
// // //     icon: <MdOutlinePhoneAndroid className="claim-icons" />,
// // //     label: "Telecommunication",
// // //   },
// // //   { icon: <GiPencilBrush className="claim-icons" />, label: "Stationary" },
// // //   {
// // //     icon: <TbTriangleSquareCircle className="claim-icons" />,
// // //     label: "Miscellaneous",
// // //   },
// // // ];

// // // const Reimbursement = () => {
// // //   const { user } = useAuth();
// // //   const orgId = user?.orgId || user?.org_id || null;
// // //   const role = user?.role || " ";
// // //   const authToken = user?.token;
// // //   const employeeId = user?.employeeId;
// // //   const departmentId = user?.department_id;

// // //   const [reimbursements, setReimbursements] = useState([]);
// // //   const [filteredReimbursements, setFilteredReimbursements] = useState([]);
// // //   const [fromDate, setFromDate] = useState("");
// // //   const [toDate, setToDate] = useState("");
// // //   const [showForm, setShowForm] = useState(false);
// // //   const [editingId, setEditingId] = useState(null);
// // //   const [transportType, setTransportType] = useState("");
// // //   const [noOfDaysType, setNoOfDaysType] = useState("");
// // //   const [attachments, setAttachments] = useState({});
// // //   const [isModalOpen, setIsModalOpen] = useState(false);
// // //   const [selectedFiles, setSelectedFiles] = useState([]);
// // //   const [selectedClaim, setSelectedClaim] = useState(null);
// // //   const [errorMessage, setErrorMessage] = useState("");
// // //   const [updateErrorMessage, setUpdateErrorMessage] = useState("");
// // //   const [submitErrorMessage, setSubmitErrorMessage] = useState("");
// // //   const [projects, setProjects] = useState([]);
// // //   const [statusFilter, setStatusFilter] = useState("pending");
// // //   const [selectedSubType, setSelectedSubType] = useState("");

// // //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
// // //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// // //   const fileInputRef = useRef(null);

// // //   const [formData, setFormData] = useState({
// // //     employeeId: employeeId,
// // //     department_id: departmentId,
// // //     claim_type: "",
// // //     transport_type: "",
// // //     transport_amount: "",
// // //     da: "",
// // //     fromDate: "",
// // //     toDate: "",
// // //     date: "",
// // //     travel_from: "",
// // //     travel_to: "",
// // //     meals_objective: "",
// // //     purpose: "",
// // //     purchasing_item: "",
// // //     accommodation_fees: "",
// // //     no_of_days: "",
// // //     total_amount: "",
// // //     meal_type: "",
// // //     stationary: "",
// // //     service_provider: "",
// // //     project: "",
// // //     attachments: null,
// // //   });

// // //   const formatDisplayDate = (raw) => {
// // //     if (!raw) return "N/A";
// // //     const d = raw instanceof Date ? raw : new Date(raw);
// // //     if (isNaN(d)) return raw;
// // //     const day = String(d.getDate()).padStart(2, "0");
// // //     const month = d.toLocaleString("en-GB", { month: "short" });
// // //     const year = d.getFullYear();
// // //     return `${day}-${month}-${year}`;
// // //   };

// // //   const [confirmModal, setConfirmModal] = useState({
// // //     isVisible: false,
// // //     message: "",
// // //     onConfirm: null,
// // //   });
// // //   const showConfirm = (message, onConfirm) =>
// // //     setConfirmModal({ isVisible: true, message, onConfirm });
// // //   const closeConfirm = () =>
// // //     setConfirmModal({ isVisible: false, message: "", onConfirm: null });

// // //   const [alertModal, setAlertModal] = useState({
// // //     isVisible: false,
// // //     title: "",
// // //     message: "",
// // //   });
// // //   const showAlert = (message, title = "") =>
// // //     setAlertModal({ isVisible: true, title, message });
// // //   const closeAlert = () =>
// // //     setAlertModal({ isVisible: false, title: "", message: "" });

// // //   const fetchReimbursements = useCallback(async () => {
// // //     try {
// // //       const response = await axios.get(
// // //         `${BACKEND_URL}/reimbursement/${employeeId}`,
// // //         {
// // //           headers: {
// // //             "x-api-key": API_KEY,
// // //             "Content-Type": "application/json",
// // //             Authorization: `Bearer ${authToken}`,
// // //             "x-org-id": orgId,
// // //           },
// // //         }
// // //       );

// // //       const reimbursementsData = Array.isArray(response.data)
// // //         ? response.data
// // //         : response.data || [];
// // //       setReimbursements(reimbursementsData);

// // //       const attachmentsData = {};
// // //       await Promise.all(
// // //         reimbursementsData.map(async (claim) => {
// // //           try {
// // //             const claimId = claim.id;
// // //             const attachmentResponse = await axios.get(
// // //               `${BACKEND_URL}/reimbursement/${claimId}/attachments`,
// // //               {
// // //                 headers: {
// // //                   "x-api-key": API_KEY,
// // //                   Authorization: `Bearer ${authToken}`,
// // //                   "x-org-id": orgId,
// // //                 },
// // //               }
// // //             );

// // //             attachmentsData[claimId] = (
// // //               attachmentResponse.data.attachments || []
// // //             ).map((file) => {
// // //               // robustly extract org/year/month/empId from file_path
// // //               const pathParts = (file.file_path || "")
// // //                 .split("/")
// // //                 .filter(Boolean);
// // //               let orgSeg = "";
// // //               let year = "";
// // //               let month = "";
// // //               let empId = claim.employee_id || claim.employeeId || "";
// // //               const idx = pathParts.findIndex((p) => p === "reimbursement");
// // //               if (idx !== -1 && pathParts.length >= idx + 5) {
// // //                 orgSeg = pathParts[idx + 1];
// // //                 year = pathParts[idx + 2];
// // //                 month = pathParts[idx + 3];
// // //                 empId = pathParts[idx + 4] || empId;
// // //               } else {
// // //                 // fallback to older layout (no orgId)
// // //                 year = pathParts[pathParts.length - 4] || "";
// // //                 month = pathParts[pathParts.length - 3] || "";
// // //                 empId =
// // //                   pathParts[pathParts.length - 2] ||
// // //                   claim.employee_id ||
// // //                   claim.employeeId ||
// // //                   empId;
// // //               }
// // //               return {
// // //                 ...file,
// // //                 orgId: orgSeg,
// // //                 year,
// // //                 month,
// // //                 employeeId: empId,
// // //               };
// // //             });
// // //           } catch (err) {
// // //             console.error(
// // //               `Error fetching attachments for claim ${claim.id}`,
// // //               err
// // //             );
// // //             attachmentsData[claim.id] = [];
// // //           }
// // //         })
// // //       );

// // //       setAttachments(attachmentsData);
// // //     } catch (error) {
// // //       console.error("Error fetching reimbursements:", error);
// // //       setErrorMessage(
// // //         error?.response?.data?.message ||
// // //           "We ran into a problem fetching reimbursements."
// // //       );
// // //       showAlert(
// // //         error?.response?.data?.message || "Error fetching reimbursements."
// // //       );
// // //     }
// // //   }, [employeeId, authToken, orgId]);

// // //   const fetchProjects = useCallback(async () => {
// // //     try {
// // //       const res = await axios.get(`${BACKEND_URL}/projectdrop`, {
// // //         headers: { "x-api-key": API_KEY, "x-org-id": orgId },
// // //       });
// // //       setProjects(res.data || []);
// // //     } catch (err) {
// // //       console.error("Error fetching projects:", err);
// // //     }
// // //   }, [orgId]);

// // //   useEffect(() => {
// // //     if (!employeeId) return;
// // //     fetchReimbursements();
// // //     fetchProjects();
// // //   }, [fetchReimbursements, fetchProjects, employeeId]);

// // //   const tryParseDate = (s) => {
// // //     if (!s && s !== 0) return null;
// // //     if (s instanceof Date && !isNaN(s)) return s;
// // //     if (typeof s === "number") {
// // //       const d = new Date(s);
// // //       return isNaN(d) ? null : d;
// // //     }
// // //     let str = String(s).trim();
// // //     if (!str) return null;
// // //     str = str.replace(/\s+to\s+/i, " - ");
// // //     str = str.replace(/\u2013|\u2014/g, " - ");
// // //     str = str.replace(/\//g, "-");
// // //     let d = new Date(str);
// // //     if (!isNaN(d)) return d;
// // //     if (str.includes("T")) {
// // //       const [dateOnly] = str.split("T");
// // //       d = new Date(dateOnly);
// // //       if (!isNaN(d)) return d;
// // //     }
// // //     const ddmmyyyy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
// // //     if (ddmmyyyy) {
// // //       const [, dd, mm, yyyy] = ddmmyyyy;
// // //       d = new Date(`${yyyy}-${mm}-${dd}`);
// // //       if (!isNaN(d)) return d;
// // //     }
// // //     return null;
// // //   };

// // //   const normalizeStartOfDay = (date) =>
// // //     new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
// // //   const normalizeEndOfDay = (date) =>
// // //     new Date(
// // //       date.getFullYear(),
// // //       date.getMonth(),
// // //       date.getDate(),
// // //       23,
// // //       59,
// // //       59,
// // //       999
// // //     );

// // //   const parseClaimRange = (claim) => {
// // //     let start = null;
// // //     let end = null;

// // //     if (
// // //       claim.date_range &&
// // //       typeof claim.date_range === "string" &&
// // //       (claim.date_range.includes(" - ") ||
// // //         claim.date_range.toLowerCase().includes(" to ") ||
// // //         claim.date_range.includes("–") ||
// // //         claim.date_range.includes("—"))
// // //     ) {
// // //       const unified = claim.date_range
// // //         .replace(/\s+to\s+/gi, " - ")
// // //         .replace(/\u2013|\u2014/g, " - ");
// // //       const parts = unified.split(" - ").map((p) => p.trim());
// // //       if (parts.length >= 2) {
// // //         const p0 = tryParseDate(parts[0]);
// // //         const p1 = tryParseDate(parts[1]);
// // //         start = p0 || null;
// // //         end = p1 || null;
// // //       }
// // //     }

// // //     if (!start && (claim.from_date || claim.fromDate)) {
// // //       start = tryParseDate(claim.from_date || claim.fromDate);
// // //     }
// // //     if (!end && (claim.to_date || claim.toDate)) {
// // //       end = tryParseDate(claim.to_date || claim.toDate);
// // //     }

// // //     if (!start && claim.date) {
// // //       start = tryParseDate(claim.date);
// // //       end = start;
// // //     }

// // //     if (!start && claim.created_at) {
// // //       const t = tryParseDate(claim.created_at);
// // //       start = t;
// // //       end = t;
// // //     }

// // //     if (start && !end) end = start;

// // //     if (start && end) {
// // //       start = normalizeStartOfDay(start);
// // //       end = normalizeEndOfDay(end);
// // //     }
// // //     return { start, end };
// // //   };

// // //   const applyFilters = useCallback(() => {
// // //     const fRaw = fromDate ? tryParseDate(fromDate) : null;
// // //     const tRaw = toDate ? tryParseDate(toDate) : null;
// // //     const fStart = fRaw ? normalizeStartOfDay(fRaw) : null;
// // //     const tEnd = tRaw ? normalizeEndOfDay(tRaw) : null;

// // //     const filtered = reimbursements.filter((claim) => {
// // //       if (
// // //         statusFilter &&
// // //         claim.status &&
// // //         claim.status.toLowerCase() !== statusFilter.toLowerCase()
// // //       ) {
// // //         return false;
// // //       }

// // //       if (!fStart && !tEnd) return true;

// // //       const { start, end } = parseClaimRange(claim);

// // //       if (!start || !end) {
// // //         return !fStart && !tEnd;
// // //       }

// // //       if (fStart && !tEnd) {
// // //         return end.getTime() >= fStart.getTime();
// // //       }
// // //       if (!fStart && tEnd) {
// // //         return start.getTime() <= tEnd.getTime();
// // //       }
// // //       if (fStart && tEnd) {
// // //         if (end.getTime() < fStart.getTime()) return false;
// // //         if (start.getTime() > tEnd.getTime()) return false;
// // //         return true;
// // //       }

// // //       return true;
// // //     });

// // //     setFilteredReimbursements(filtered);
// // //   }, [reimbursements, fromDate, toDate, statusFilter]);

// // //   useEffect(() => {
// // //     applyFilters();
// // //   }, [reimbursements, fromDate, toDate, statusFilter, applyFilters]);

// // //   const handleChange = (e) =>
// // //     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

// // //   const handleClaimTypeChange = (e) => {
// // //     const value = e.target.value;
// // //     setFormData((prev) => ({ ...prev, claim_type: value }));
// // //     setSelectedFiles([]);
// // //     setSelectedClaim(null);
// // //     setSelectedSubType("");
// // //   };

// // //   const handleTransportSubTypeChange = (type) => {
// // //     setFormData((prev) => ({ ...prev, transport_type: type }));
// // //     setSelectedSubType(type);
// // //     if (type === "Outstation") {
// // //       setFormData((prev) => ({ ...prev, no_of_days: "" }));
// // //     }
// // //   };

// // //   const handleNoOfDaysChange = (event) =>
// // //     setFormData((prev) => ({ ...prev, no_of_days: event.target.value }));

// // //   const handleFileUpload = (e) => {
// // //     const files = Array.from(e.target.files || []);
// // //     setSelectedFiles(files.map((file) => file.name));
// // //     setFormData((prev) => ({ ...prev, attachments: files }));
// // //   };

// // //   const renderDateFields = () => {
// // //     if (formData.transport_type === "Outstation") {
// // //       return (
// // //         <>
// // //           <div className="rb-groups">
// // //             <label>
// // //               From Date<span className="asterisk">*</span>
// // //             </label>
// // //             <input
// // //               type="date"
// // //               name="fromDate"
// // //               value={formData.fromDate}
// // //               onChange={handleChange}
// // //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// // //             />
// // //           </div>
// // //           <div className="rb-groups">
// // //             <label>
// // //               To Date<span className="asterisk">*</span>
// // //             </label>
// // //             <input
// // //               type="date"
// // //               name="toDate"
// // //               value={formData.toDate}
// // //               onChange={handleChange}
// // //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// // //             />
// // //           </div>
// // //         </>
// // //       );
// // //     } else if (formData.no_of_days === "single") {
// // //       return (
// // //         <div className="rb-groups">
// // //           <label>
// // //             Date<span className="asterisk">*</span>
// // //           </label>
// // //           <input
// // //             type="date"
// // //             name="date"
// // //             value={formData.date}
// // //             onChange={handleChange}
// // //             max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// // //           />
// // //         </div>
// // //       );
// // //     } else if (formData.no_of_days === "multiple") {
// // //       return (
// // //         <>
// // //           <div className="rb-groups">
// // //             <label>
// // //               From Date<span className="asterisk">*</span>
// // //             </label>
// // //             <input
// // //               type="date"
// // //               name="fromDate"
// // //               value={formData.fromDate}
// // //               onChange={handleChange}
// // //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// // //             />
// // //           </div>
// // //           <div className="rb-groups">
// // //             <label>
// // //               To Date<span className="asterisk">*</span>
// // //             </label>
// // //             <input
// // //               type="date"
// // //               name="toDate"
// // //               value={formData.toDate}
// // //               onChange={handleChange}
// // //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// // //             />
// // //           </div>
// // //         </>
// // //       );
// // //     }
// // //     return null;
// // //   };

// // //   const handleEdit = (claim) => {
// // //     setEditingId(claim.id);
// // //     setShowForm(true);
// // //     const existingAttachments = attachments[claim.id] || [];
// // //     setFormData({
// // //       employeeId: claim.employeeId || claim.employee_id || employeeId,
// // //       department_id: claim.department_id || departmentId,
// // //       claim_type: claim.claim_type || "",
// // //       transport_type: claim.transport_type || "",
// // //       fromDate: claim.from_date
// // //         ? claim.from_date.substring(0, 10)
// // //         : claim.fromDate || "",
// // //       toDate: claim.to_date
// // //         ? claim.to_date.substring(0, 10)
// // //         : claim.toDate || "",
// // //       date: claim.date ? claim.date.substring(0, 10) : claim.date || "",
// // //       travel_from: claim.travel_from || "",
// // //       travel_to: claim.travel_to || "",
// // //       meals_objective: claim.meals_objective || "",
// // //       purpose: claim.purpose || "",
// // //       purchasing_item: claim.purchasing_item || "",
// // //       accommodation_fees: claim.accommodation_fees || "",
// // //       transport_amount: claim.transport_amount || "",
// // //       da: claim.da || "",
// // //       no_of_days: claim.no_of_days || "",
// // //       total_amount: claim.total_amount || "",
// // //       meal_type: claim.meal_type || "",
// // //       stationary: claim.stationary || "",
// // //       comments: claim.comments || "",
// // //       service_provider: claim.service_provider || "",
// // //       project: claim.project || "",
// // //       attachments: existingAttachments,
// // //     });
// // //     setSelectedFiles(
// // //       existingAttachments.map((file) => file.file_name || file.name)
// // //     );
// // //     setSelectedSubType(claim.transport_type || "");
// // //   };

// // //   const handleSubmit = async (e) => {
// // //     e.preventDefault();
// // //     setSubmitErrorMessage("");
// // //     const wordCount = formData.purpose
// // //       ? formData.purpose.trim().split(/\s+/).filter(Boolean).length
// // //       : 0;
// // //     if (wordCount < 10) {
// // //       showAlert(
// // //         `Purpose Details / Comments must be at least 10 words. You have ${wordCount}.`
// // //       );
// // //       return;
// // //     }
// // //     try {
// // //       const fd = new FormData();
// // //       Object.keys(formData).forEach((k) => {
// // //         if (k === "attachments") return; // handled separately
// // //         const val = formData[k];
// // //         if (val !== null && val !== undefined) fd.append(k, val);
// // //       });

// // //       // append role + orgId
// // //       fd.append("role", role);
// // //       if (orgId) fd.append("orgId", orgId);

// // //       if (formData.attachments && formData.attachments.length > 0) {
// // //         formData.attachments.forEach((file) => {
// // //           if (file instanceof File) {
// // //             fd.append("attachments", file);
// // //           }
// // //         });
// // //       }
// // //       const config = {
// // //         headers: {
// // //           "x-api-key": API_KEY,
// // //           "Content-Type": "multipart/form-data",
// // //           Authorization: `Bearer ${authToken}`,
// // //           "x-org-id": orgId,
// // //         },
// // //       };
// // //       let response;
// // //       if (editingId) {
// // //         response = await axios.put(
// // //           `${BACKEND_URL}/reimbursement/${editingId}`,
// // //           fd,
// // //           config
// // //         );
// // //       } else {
// // //         response = await axios.post(`${BACKEND_URL}/reimbursement`, fd, config);
// // //       }
// // //       showAlert(
// // //         response?.data?.message || "Reimbursement submitted successfully!"
// // //       );
// // //       // reset form
// // //       setFormData({
// // //         employeeId: employeeId,
// // //         department_id: departmentId,
// // //         claim_type: "",
// // //         transport_type: "",
// // //         fromDate: "",
// // //         toDate: "",
// // //         date: "",
// // //         travel_from: "",
// // //         travel_to: "",
// // //         meals_objective: "",
// // //         purpose: "",
// // //         purchasing_item: "",
// // //         accommodation_fees: "",
// // //         no_of_days: "",
// // //         total_amount: "",
// // //         meal_type: "",
// // //         stationary: "",
// // //         service_provider: "",
// // //         project: "",
// // //         attachments: null,
// // //       });
// // //       setShowForm(false);
// // //       setEditingId(null);
// // //       setSelectedFiles([]);
// // //       fetchReimbursements();
// // //     } catch (error) {
// // //       console.error("Error submitting reimbursement:", error);
// // //       const msg =
// // //         error?.response?.data?.error ||
// // //         error?.response?.data?.message ||
// // //         "An unexpected error occurred.";
// // //       setSubmitErrorMessage(msg);
// // //       showAlert(msg);
// // //     }
// // //   };

// // //   const updateReimbursement = async (reimbursementId, updateData) => {
// // //     try {
// // //       const response = await axios.put(
// // //         `${BACKEND_URL}/reimbursement/${reimbursementId}`,
// // //         updateData,
// // //         {
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": API_KEY,
// // //             "x-org-id": orgId,
// // //             Authorization: `Bearer ${authToken}`,
// // //           },
// // //         }
// // //       );
// // //       console.log("Update Response:", response.data);
// // //       fetchReimbursements();
// // //       return response.data;
// // //     } catch (error) {
// // //       console.error("Error updating reimbursement:", error);
// // //       const msg =
// // //         error?.response?.data?.message ||
// // //         error.message ||
// // //         "An unexpected error occurred.";
// // //       setUpdateErrorMessage(msg);
// // //       showAlert(msg);
// // //       throw error;
// // //     }
// // //   };

// // //   const deleteReimbursement = async (id) => {
// // //     if (!id) {
// // //       console.error("Error: Reimbursement ID is missing.");
// // //       return;
// // //     }
// // //     showConfirm(
// // //       "Are you sure you want to delete this reimbursement claim?",
// // //       async () => {
// // //         try {
// // //           const response = await axios.delete(
// // //             `${BACKEND_URL}/reimbursement/${id}`,
// // //             {
// // //               headers: {
// // //                 "x-api-key": API_KEY,
// // //                 "x-org-id": orgId,
// // //                 Authorization: `Bearer ${authToken}`,
// // //               },
// // //             }
// // //           );
// // //           showAlert(
// // //             response.data.message || "Reimbursement deleted successfully!"
// // //           );
// // //           fetchReimbursements();
// // //         } catch (error) {
// // //           console.error("Error deleting reimbursement:", error);
// // //           showAlert("There was an issue deleting the reimbursement.");
// // //         } finally {
// // //           closeConfirm();
// // //         }
// // //       }
// // //     );
// // //   };

// // //   const handleOpenAttachments = async (files, claim) => {
// // //     try {
// // //       const fetchedFiles = await Promise.all(
// // //         (files || []).map(async (file) => {
// // //           if (!file?.file_name && !file?.file_name) return null;
// // //           const fname = file.file_name || file.fileName || file.name;
// // //           const match = fname.match(/^(\d{4})-(\d{2})/);
// // //           if (!match) return null;
// // //           const [, year, month] = match;

// // //           // org/year/month/emp/file_name layout: pick org from file.orgId if available,
// // //           // otherwise try extracting from file_path similarly
// // //           let fileOrg = file.orgId || "";
// // //           if (!fileOrg && file.file_path) {
// // //             const parts = (file.file_path || "").split("/").filter(Boolean);
// // //             const idx = parts.findIndex((p) => p === "reimbursement");
// // //             if (idx !== -1 && parts.length >= idx + 5) {
// // //               fileOrg = parts[idx + 1];
// // //             } else if (parts.length >= 5) {
// // //               // fallback heuristic: org may be at -5
// // //               fileOrg = parts[parts.length - 5] || "";
// // //             }
// // //           }
// // //           // prefer the orgId we have in the client context if nothing extracted
// // //           if (!fileOrg) fileOrg = orgId || "";

// // //           const empId = claim.employee_id || claim.employeeId || "";
// // //           const url = `${BACKEND_URL}/reimbursement/${fileOrg}/${year}/${month}/${empId}/${fname}`;

// // //           const response = await axios.get(url, {
// // //             headers: {
// // //               "x-api-key": API_KEY,
// // //               Authorization: `Bearer ${authToken}`,
// // //               "x-org-id": fileOrg || orgId,
// // //               "x-employee-id": employeeId,
// // //             },
// // //             responseType: "blob",
// // //           });

// // //           return {
// // //             name: fname,
// // //             url: URL.createObjectURL(
// // //               new Blob([response.data], {
// // //                 type: response.headers["content-type"],
// // //               })
// // //             ),
// // //           };
// // //         })
// // //       );
// // //       const validFiles = fetchedFiles.filter(Boolean);
// // //       if (!validFiles.length)
// // //         return showAlert("No valid attachments could be loaded.");
// // //       setSelectedFiles(validFiles);
// // //       setSelectedClaim(claim);
// // //       setIsModalOpen(true);
// // //     } catch (error) {
// // //       console.error("Error fetching attachments:", error);
// // //       showAlert("Could not load attachments. Please try again.");
// // //     }
// // //   };

// // //   // Use filteredReimbursements (NOT reimbursements) for display and totals
// // //   const filterClaims = filteredReimbursements || [];

// // //   const totalAmount = (filteredReimbursements || []).reduce((sum, claim) => {
// // //     const val = parseFloat(claim.total_amount);
// // //     return sum + (isNaN(val) ? 0 : val);
// // //   }, 0);
// // //   const approvedAmount = (filteredReimbursements || [])
// // //     .filter((c) => (c.status || "").toLowerCase() === "approved")
// // //     .reduce((sum, claim) => {
// // //       const val = parseFloat(claim.total_amount);
// // //       return sum + (isNaN(val) ? 0 : val);
// // //     }, 0);
// // //   const rejectedAmount = (filteredReimbursements || [])
// // //     .filter((c) => (c.status || "").toLowerCase() === "rejected")
// // //     .reduce((sum, claim) => {
// // //       const val = parseFloat(claim.total_amount);
// // //       return sum + (isNaN(val) ? 0 : val);
// // //     }, 0);

// // //   const renderClaimSpecificFields = () => {
// // //     switch (formData.claim_type) {
// // //       case "Transportation":
// // //         return (
// // //           <>
// // //             <div className="sub-tabs">
// // //               {["Outstation", "Intercity", "Fuel"].map((type) => (
// // //                 <div
// // //                   key={type}
// // //                   className={`sub-tab ${
// // //                     formData.transport_type === type ? "active" : ""
// // //                   }`}
// // //                   onClick={() => handleTransportSubTypeChange(type)}
// // //                 >
// // //                   {type}
// // //                 </div>
// // //               ))}
// // //             </div>

// // //             {(formData.transport_type === "Intercity" ||
// // //               formData.transport_type === "Fuel") && (
// // //               <div className="rb-radio">
// // //                 <label>Select no of days</label>
// // //                 <div className="rb-radio-options">
// // //                   <label>
// // //                     <input
// // //                       type="radio"
// // //                       name="no_of_days"
// // //                       value="single"
// // //                       checked={formData.no_of_days === "single"}
// // //                       onChange={handleNoOfDaysChange}
// // //                     />
// // //                     Single
// // //                   </label>

// // //                   <label>
// // //                     <input
// // //                       type="radio"
// // //                       name="no_of_days"
// // //                       value="multiple"
// // //                       checked={formData.no_of_days === "multiple"}
// // //                       onChange={handleNoOfDaysChange}
// // //                     />
// // //                     Multiple
// // //                   </label>
// // //                 </div>
// // //               </div>
// // //             )}

// // //             {formData.transport_type && (
// // //               <div className="rb-main-form">
// // //                 <div className="rb-form-grid">
// // //                   {renderDateFields()}

// // //                   <div className="rb-groups">
// // //                     <label>
// // //                       Travel From<span className="asterisk">*</span>
// // //                     </label>
// // //                     <input
// // //                       type="text"
// // //                       name="travel_from"
// // //                       value={formData.travel_from}
// // //                       onChange={handleChange}
// // //                     />
// // //                   </div>
// // //                   <div className="rb-groups">
// // //                     <label>
// // //                       Travel To<span className="asterisk">*</span>
// // //                     </label>
// // //                     <input
// // //                       type="text"
// // //                       name="travel_to"
// // //                       value={formData.travel_to}
// // //                       onChange={handleChange}
// // //                     />
// // //                   </div>

// // //                   {formData.transport_type === "Outstation" && (
// // //                     <div className="rb-groups">
// // //                       <label>Transport Amount</label>
// // //                       <input
// // //                         type="number"
// // //                         name="transport_amount"
// // //                         value={formData.transport_amount}
// // //                         onChange={handleChange}
// // //                       />
// // //                     </div>
// // //                   )}

// // //                   {formData.transport_type === "Outstation" && (
// // //                     <div className="rb-groups">
// // //                       <label>Accommodation Fees</label>
// // //                       <input
// // //                         type="number"
// // //                         name="accommodation_fees"
// // //                         value={formData.accommodation_fees}
// // //                         onChange={handleChange}
// // //                       />
// // //                     </div>
// // //                   )}

// // //                   {formData.transport_type === "Outstation" && (
// // //                     <div className="rb-groups">
// // //                       <label>DA</label>
// // //                       <input
// // //                         type="number"
// // //                         name="da"
// // //                         value={formData.da}
// // //                         onChange={handleChange}
// // //                       />
// // //                     </div>
// // //                   )}

// // //                   <div className="rb-groups">
// // //                     <label>
// // //                       Total Amount<span className="asterisk">*</span>
// // //                     </label>
// // //                     <input
// // //                       type="number"
// // //                       name="total_amount"
// // //                       value={formData.total_amount}
// // //                       onChange={handleChange}
// // //                     />
// // //                   </div>
// // //                 </div>

// // //                 <div className="purpose-attachment">
// // //                   <div className="pa-groups">
// // //                     <label>
// // //                       Purpose Details / Comments
// // //                       <span className="asterisk">*</span>
// // //                     </label>
// // //                     <textarea
// // //                       name="purpose"
// // //                       value={formData.purpose}
// // //                       onChange={handleChange}
// // //                     />
// // //                   </div>

// // //                   <div className="pa-groups">
// // //                     <label>Attachment</label>
// // //                     <div className="attachment-wrapper">
// // //                       <div className="file-links">
// // //                         {selectedFiles.length > 0 ? (
// // //                           selectedFiles.map((fileName, index) => (
// // //                             <p key={index} className="file-name">
// // //                               {fileName}
// // //                             </p>
// // //                           ))
// // //                         ) : (
// // //                           <p>No files selected</p>
// // //                         )}
// // //                       </div>

// // //                       <div className="attachment-upload">
// // //                         <input
// // //                           type="file"
// // //                           multiple
// // //                           ref={fileInputRef}
// // //                           onChange={handleFileUpload}
// // //                           style={{ display: "none" }}
// // //                         />
// // //                         <button
// // //                           type="button"
// // //                           className="custom-file-upload"
// // //                           onClick={() =>
// // //                             fileInputRef.current && fileInputRef.current.click()
// // //                           }
// // //                         >
// // //                           Browse
// // //                         </button>
// // //                       </div>
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             )}
// // //           </>
// // //         );

// // //       case "Meals":
// // //         return (
// // //           <div className="rb-main-form">
// // //             <div className="rb-form1-grid">
// // //               <div className="rb-groups">
// // //                 <label>
// // //                   Date<span className="asterisk">*</span>
// // //                 </label>
// // //                 <input
// // //                   type="date"
// // //                   name="date"
// // //                   value={formData.date}
// // //                   onChange={handleChange}
// // //                   max={new Date(Date.now() - 86400000).toLocaleDateString(
// // //                     "en-CA"
// // //                   )}
// // //                 />
// // //               </div>
// // //               <div className="rb-groups">
// // //                 <label>Meal Type</label>
// // //                 <select
// // //                   name="meal_type"
// // //                   value={formData.meal_type}
// // //                   onChange={handleChange}
// // //                 >
// // //                   <option value="">Select</option>
// // //                   <option value="breakfast">Break Fast</option>
// // //                   <option value="lunch">Lunch</option>
// // //                   <option value="dinner">Dinner</option>
// // //                   <option value="Full Day">Full Day</option>
// // //                 </select>
// // //               </div>
// // //               <div className="rb-groups">
// // //                 <label>Meal's objective</label>
// // //                 <select
// // //                   name="meals_objective"
// // //                   value={formData.meals_objective}
// // //                   onChange={handleChange}
// // //                 >
// // //                   <option value="">Select</option>
// // //                   <option value="client_visit">Client Visit</option>
// // //                   <option value="team_outing">Team Outing</option>
// // //                   <option value="extended_work">Extended</option>
// // //                   <option value="others">Others</option>
// // //                 </select>
// // //               </div>

// // //               <div className="rb-groups">
// // //                 <label>
// // //                   Total Amount<span className="asterisk">*</span>
// // //                 </label>
// // //                 <input
// // //                   type="number"
// // //                   name="total_amount"
// // //                   value={formData.total_amount}
// // //                   onChange={handleChange}
// // //                 />
// // //               </div>
// // //             </div>

// // //             <div className="purpose-attachment">
// // //               <div className="pa-groups">
// // //                 <label>
// // //                   Purpose Details / Comments<span className="asterisk">*</span>
// // //                 </label>
// // //                 <textarea
// // //                   name="purpose"
// // //                   value={formData.purpose}
// // //                   onChange={handleChange}
// // //                 />
// // //               </div>

// // //               <div className="pa-groups">
// // //                 <label>Attachment</label>
// // //                 <div className="attachment-wrapper">
// // //                   <div className="file-links">
// // //                     {selectedFiles.length > 0 ? (
// // //                       selectedFiles.map((fileName, index) => (
// // //                         <p key={index} className="file-name">
// // //                           {fileName}
// // //                         </p>
// // //                       ))
// // //                     ) : (
// // //                       <p>No files selected</p>
// // //                     )}
// // //                   </div>

// // //                   <div className="attachment-upload">
// // //                     <input
// // //                       type="file"
// // //                       multiple
// // //                       ref={fileInputRef}
// // //                       onChange={handleFileUpload}
// // //                       style={{ display: "none" }}
// // //                     />
// // //                     <button
// // //                       type="button"
// // //                       className="custom-file-upload"
// // //                       onClick={() =>
// // //                         fileInputRef.current && fileInputRef.current.click()
// // //                       }
// // //                     >
// // //                       Browse
// // //                     </button>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         );

// // //       case "Telecommunication":
// // //         return (
// // //           <div className="rb-main-form">
// // //             <div className="rb-form2-grid">
// // //               <div className="rb-groups">
// // //                 <label>
// // //                   Date<span className="asterisk">*</span>
// // //                 </label>
// // //                 <input
// // //                   type="date"
// // //                   name="date"
// // //                   value={formData.date}
// // //                   onChange={handleChange}
// // //                   max={new Date(Date.now() - 86400000).toLocaleDateString(
// // //                     "en-CA"
// // //                   )}
// // //                 />
// // //               </div>
// // //               <div className="rb-groups">
// // //                 <label>Service Provider</label>
// // //                 <input
// // //                   type="text"
// // //                   name="service_provider"
// // //                   value={formData.service_provider}
// // //                   onChange={handleChange}
// // //                 />
// // //               </div>
// // //               <div className="rb-groups">
// // //                 <label>
// // //                   Total Amount<span className="asterisk">*</span>
// // //                 </label>
// // //                 <input
// // //                   type="number"
// // //                   name="total_amount"
// // //                   value={formData.total_amount}
// // //                   onChange={handleChange}
// // //                 />
// // //               </div>
// // //             </div>
// // //             <div className="purpose-attachment">
// // //               <div className="pa-groups">
// // //                 <label>
// // //                   Purpose Details / Comments<span className="asterisk">*</span>
// // //                 </label>
// // //                 <textarea
// // //                   name="purpose"
// // //                   value={formData.purpose}
// // //                   onChange={handleChange}
// // //                 />
// // //               </div>

// // //               <div className="pa-groups">
// // //                 <label>Attachment</label>
// // //                 <div className="attachment-wrapper">
// // //                   <div className="file-links">
// // //                     {selectedFiles.length > 0 ? (
// // //                       selectedFiles.map((fileName, index) => (
// // //                         <p key={index} className="file-name">
// // //                           {fileName}
// // //                         </p>
// // //                       ))
// // //                     ) : (
// // //                       <p>No files selected</p>
// // //                     )}
// // //                   </div>

// // //                   <div className="attachment-upload">
// // //                     <input
// // //                       type="file"
// // //                       multiple
// // //                       ref={fileInputRef}
// // //                       onChange={handleFileUpload}
// // //                       style={{ display: "none" }}
// // //                     />
// // //                     <button
// // //                       type="button"
// // //                       className="custom-file-upload"
// // //                       onClick={() =>
// // //                         fileInputRef.current && fileInputRef.current.click()
// // //                       }
// // //                     >
// // //                       Browse
// // //                     </button>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         );

// // //       case "Stationary":
// // //         return (
// // //           <div className="rb-main-form">
// // //             <div className="rb-form1-grid">
// // //               <div className="rb-groups">
// // //                 <label>
// // //                   Date<span className="asterisk">*</span>
// // //                 </label>
// // //                 <input
// // //                   type="date"
// // //                   name="date"
// // //                   value={formData.date}
// // //                   onChange={handleChange}
// // //                   max={new Date(Date.now() - 86400000).toLocaleDateString(
// // //                     "en-CA"
// // //                   )}
// // //                 />
// // //               </div>
// // //               <div className="rb-groups">
// // //                 <label>Stationary</label>
// // //                 <select
// // //                   name="stationary"
// // //                   value={formData.stationary}
// // //                   onChange={handleChange}
// // //                 >
// // //                   <option value="">Select</option>
// // //                   <option value="office equipments">Office Equipments</option>
// // //                   <option value="general stationary">General Stationary</option>
// // //                 </select>
// // //               </div>
// // //               <div className="rb-groups">
// // //                 <label>Purchasing Items</label>
// // //                 <input
// // //                   type="text"
// // //                   name="purchasing_item"
// // //                   value={formData.purchasing_item}
// // //                   onChange={handleChange}
// // //                 />
// // //               </div>

// // //               <div className="rb-groups">
// // //                 <label>
// // //                   Total Amount<span className="asterisk">*</span>
// // //                 </label>
// // //                 <input
// // //                   type="number"
// // //                   name="total_amount"
// // //                   value={formData.total_amount}
// // //                   onChange={handleChange}
// // //                 />
// // //               </div>
// // //             </div>

// // //             <div className="purpose-attachment">
// // //               <div className="pa-groups">
// // //                 <label>
// // //                   Purpose Details / Comments<span className="asterisk">*</span>
// // //                 </label>
// // //                 <textarea
// // //                   name="purpose"
// // //                   value={formData.purpose}
// // //                   onChange={handleChange}
// // //                 />
// // //               </div>

// // //               <div className="pa-groups">
// // //                 <label>Attachment</label>
// // //                 <div className="attachment-wrapper">
// // //                   <div className="file-links">
// // //                     {selectedFiles.length > 0 ? (
// // //                       selectedFiles.map((fileName, index) => (
// // //                         <p key={index} className="file-name">
// // //                           {fileName}
// // //                         </p>
// // //                       ))
// // //                     ) : (
// // //                       <p>No files selected</p>
// // //                     )}
// // //                   </div>

// // //                   <div className="attachment-upload">
// // //                     <input
// // //                       type="file"
// // //                       multiple
// // //                       ref={fileInputRef}
// // //                       onChange={handleFileUpload}
// // //                       style={{ display: "none" }}
// // //                     />
// // //                     <button
// // //                       type="button"
// // //                       className="custom-file-upload"
// // //                       onClick={() =>
// // //                         fileInputRef.current && fileInputRef.current.click()
// // //                       }
// // //                     >
// // //                       Browse
// // //                     </button>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         );

// // //       case "Miscellaneous":
// // //         return (
// // //           <div className="rb-main-form">
// // //             <div className="rb-form1-grid">
// // //               <div className="rb-groups">
// // //                 <label>
// // //                   Date<span className="asterisk">*</span>
// // //                 </label>
// // //                 <input
// // //                   type="date"
// // //                   name="date"
// // //                   value={formData.date}
// // //                   onChange={handleChange}
// // //                   max={new Date(Date.now() - 86400000).toLocaleDateString(
// // //                     "en-CA"
// // //                   )}
// // //                 />
// // //               </div>
// // //               <div className="rb-groups">
// // //                 <label>
// // //                   Total Amount<span className="asterisk">*</span>
// // //                 </label>
// // //                 <input
// // //                   type="number"
// // //                   name="total_amount"
// // //                   value={formData.total_amount}
// // //                   onChange={handleChange}
// // //                 />
// // //               </div>
// // //             </div>

// // //             <div className="purpose-attachment">
// // //               <div className="pa-groups">
// // //                 <label>
// // //                   Purpose Details / Comments<span className="asterisk">*</span>
// // //                 </label>
// // //                 <textarea
// // //                   name="purpose"
// // //                   value={formData.purpose}
// // //                   onChange={handleChange}
// // //                 />
// // //               </div>

// // //               <div className="pa-groups">
// // //                 <label>Attachment</label>
// // //                 <div className="attachment-wrapper">
// // //                   <div className="file-links">
// // //                     {selectedFiles.length > 0 ? (
// // //                       selectedFiles.map((fileName, index) => (
// // //                         <p key={index} className="file-name">
// // //                           {fileName}
// // //                         </p>
// // //                       ))
// // //                     ) : (
// // //                       <p>No files selected</p>
// // //                     )}
// // //                   </div>

// // //                   <div className="attachment-upload">
// // //                     <input
// // //                       type="file"
// // //                       multiple
// // //                       ref={fileInputRef}
// // //                       onChange={handleFileUpload}
// // //                       style={{ display: "none" }}
// // //                     />
// // //                     <button
// // //                       type="button"
// // //                       className="custom-file-upload"
// // //                       onClick={() =>
// // //                         fileInputRef.current && fileInputRef.current.click()
// // //                       }
// // //                     >
// // //                       Browse
// // //                     </button>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         );
// // //       default:
// // //         return null;
// // //     }
// // //   };

// // //   // ------------ Render ------------
// // //   return (
// // //     <div className="reimbursement-container">
// // //       <div className="rb-form-header">
// // //         {role !== "Manager" && role !== "Admin" && (
// // //           <h2>Reimbursement Requests</h2>
// // //         )}
// // //       </div>

// // //            {/* ORIGINAL FILTER CONTAINER - DESKTOP ONLY (100% unchanged) */}
// // //       <div className="filter-container">
// // //         <label>Status By</label>
// // //         <select
// // //           value={statusFilter}
// // //           onChange={(e) => setStatusFilter(e.target.value)}
// // //         >
// // //           <option value="pending">Pending</option>
// // //           <option value="approved">Approved</option>
// // //           <option value="rejected">Rejected</option>
// // //         </select>

// // //         <label>Date From</label>
// // //         <input
// // //           type="date"
// // //           value={fromDate}
// // //           onChange={(e) => setFromDate(e.target.value)}
// // //         />

// // //         <label>To</label>
// // //         <input
// // //           type="date"
// // //           value={toDate}
// // //           onChange={(e) => setToDate(e.target.value)}
// // //         />

// // //         <button className="search-btn" onClick={applyFilters}>
// // //           <FaSearch /> Search
// // //         </button>

// // //         <button
// // //           className="apply-btn"
// // //           onClick={() => {
// // //             setSubmitErrorMessage("");
// // //             setUpdateErrorMessage("");
// // //             setSelectedFiles([]);
// // //             setShowForm(true);
// // //             setEditingId(null);
// // //             setFormData({
// // //               employeeId,
// // //               department_id: departmentId,
// // //               claim_type: "",
// // //               transport_type: "",
// // //               fromDate: "",
// // //               toDate: "",
// // //               date: "",
// // //               travel_from: "",
// // //               travel_to: "",
// // //               meals_objective: "",
// // //               purpose: "",
// // //               purchasing_item: "",
// // //               accommodation_fees: "",
// // //               no_of_days: "",
// // //               total_amount: "",
// // //               meal_type: "",
// // //               stationary: "",
// // //               service_provider: "",
// // //               project: "",
// // //               attachments: null,
// // //             });
// // //           }}
// // //         >
// // //           Apply Claim
// // //         </button>
// // //       </div>

// // //       {/* NEW MOBILE-ONLY TOP BAR - Completely separate */}
// // //       <div className="mobile-only-top-bar">
// // //         <select
// // //           value={statusFilter}
// // //           onChange={(e) => setStatusFilter(e.target.value)}
// // //           className="mobile-status-dropdown"
// // //         >
// // //           <option value="pending">Pending</option>
// // //           <option value="approved">Approved</option>
// // //           <option value="rejected">Rejected</option>
// // //         </select>

// // //         <button
// // //           className="mobile-apply-claim-btn"
// // //           onClick={() => {
// // //             setSubmitErrorMessage("");
// // //             setUpdateErrorMessage("");
// // //             setSelectedFiles([]);
// // //             setShowForm(true);
// // //             setEditingId(null);
// // //             setFormData({
// // //               employeeId,
// // //               department_id: departmentId,
// // //               claim_type: "",
// // //               transport_type: "",
// // //               fromDate: "",
// // //               toDate: "",
// // //               date: "",
// // //               travel_from: "",
// // //               travel_to: "",
// // //               meals_objective: "",
// // //               purpose: "",
// // //               purchasing_item: "",
// // //               accommodation_fees: "",
// // //               no_of_days: "",
// // //               total_amount: "",
// // //               meal_type: "",
// // //               stationary: "",
// // //               service_provider: "",
// // //               project: "",
// // //               attachments: null,
// // //             });
// // //           }}
// // //         >
// // //           + Apply Claim
// // //         </button>
// // //       </div>

// // //       {errorMessage && <p className="rb-error-message">{errorMessage}</p>}

// // //       <div className="reimbursement-table-scroll">
// // //         <table className="reimbursement-table">
// // //           <thead>
// // //             <tr>
// // //               <th>Sl No</th>
// // //               <th>Claim Type</th>
// // //               <th>Date</th>
// // //               <th>Purpose</th>
// // //               <th>Amount</th>
// // //               <th>Attachment</th>
// // //               <th>Status</th>
// // //               <th>Comments</th>
// // //               <th>Payment Status</th>
// // //               <th>Action</th>
// // //             </tr>
// // //           </thead>
// // //           <tbody>
// // //             {filterClaims.map((claim, index) => (
// // //               <tr key={claim.id}>
// // //                 <td>{index + 1}</td>
// // //                 <td>{claim.claim_type}</td>
// // //                 <td>
// // //                   {claim.date_range
// // //                     ? claim.date_range
// // //                         .split(" - ")
// // //                         .map(formatDisplayDate)
// // //                         .join(" - ")
// // //                     : claim.date
// // //                     ? formatDisplayDate(claim.date)
// // //                     : claim.from_date && claim.to_date
// // //                     ? `${formatDisplayDate(
// // //                         claim.from_date
// // //                       )} - ${formatDisplayDate(claim.to_date)}`
// // //                     : "N/A"}
// // //                 </td>
// // //                 <td>
// // //                   <div className="rbadmin-comments">{claim.purpose}</div>
// // //                 </td>
// // //                 <td>{claim.total_amount}</td>
// // //                 <td>
// // //                   {attachments[claim.id]?.length > 0 ? (
// // //                     <button
// // //                       className="attachments-btn"
// // //                       onClick={() =>
// // //                         handleOpenAttachments(attachments[claim.id], claim)
// // //                       }
// // //                     >
// // //                       <MdOutlineRemoveRedEye className="eye-icon" /> View
// // //                     </button>
// // //                   ) : (
// // //                     "Not Attached"
// // //                   )}
// // //                 </td>
// // //                 <td>
// // //                   <span
// // //                     className={`rb-status-label ${
// // //                       claim.status === "approved"
// // //                         ? "rb-approved"
// // //                         : claim.status === "rejected"
// // //                         ? "rb-rejected"
// // //                         : ""
// // //                     }`}
// // //                   >
// // //                     {claim.status}
// // //                   </span>
// // //                 </td>
// // //                 <td>
// // //                   <div className="rbadmin-comments">
// // //                     {claim.approver_comments || "No comments"}
// // //                   </div>
// // //                 </td>
// // //                 <td>{claim.payment_status}</td>
// // //                 <td className="actions-column">
// // //                   <MdOutlineEdit
// // //                     className={`edit-icon ${
// // //                       claim.status && claim.status.toLowerCase() !== "pending"
// // //                         ? "disabled-icon"
// // //                         : ""
// // //                     }`}
// // //                     onClick={() => {
// // //                       if (
// // //                         claim.status &&
// // //                         claim.status.toLowerCase() === "pending"
// // //                       ) {
// // //                         handleEdit(claim);
// // //                         setShowForm(true);
// // //                       }
// // //                     }}
// // //                   />
// // //                   <MdDeleteOutline
// // //                     className={`delete-icon ${
// // //                       claim.status && claim.status.toLowerCase() !== "pending"
// // //                         ? "disabled-icon"
// // //                         : ""
// // //                     }`}
// // //                     onClick={() => {
// // //                       if (
// // //                         claim.status &&
// // //                         claim.status.toLowerCase() === "pending"
// // //                       )
// // //                         deleteReimbursement(claim.id);
// // //                     }}
// // //                   />
// // //                 </td>
// // //               </tr>
// // //             ))}
// // //           </tbody>
// // //           <tfoot>
// // //             <tr className="total-row">
// // //               <td
// // //                 colSpan="4"
// // //                 style={{
// // //                   textAlign: "right",
// // //                   color: "#949494",
// // //                   fontWeight: "bold",
// // //                 }}
// // //               >
// // //                 Total Amount Claiming:{" "}
// // //                 <span style={{ fontWeight: "bold", color: "black" }}>
// // //                   Rs {totalAmount}
// // //                 </span>
// // //               </td>
// // //               <td colSpan="3" style={{ textAlign: "right" }}>
// // //                 Amount Approved: Rs{" "}
// // //                 <span style={{ fontWeight: "bold" }}>{approvedAmount}</span>
// // //               </td>
// // //               <td colSpan="3" style={{ textAlign: "right" }}>
// // //                 Amount Rejected: Rs{" "}
// // //                 <span style={{ fontWeight: "bold" }}>{rejectedAmount}</span>
// // //               </td>
// // //             </tr>
// // //           </tfoot>
// // //         </table>

// // //         {/* Mobile cards */}
// // //         {/* Mobile cards */}
// // //       {/* ULTRA CLEAN FLAT LIST - BANKING APP STYLE (NO CARDS, NO DOTS) */}
// // //       <div className="rb-flat-mobile">
// // //         {filterClaims.length === 0 ? (
// // //           <div className="rb-no-records">No reimbursement claims found</div>
// // //         ) : (
// // //           filterClaims.map((claim, index) => (
// // //             <div
// // //               key={claim.id}
// // //               className="rb-flat-row"
// // //               onClick={() => claim.status?.toLowerCase() === "pending" && handleEdit(claim)}
// // //             >
// // //               <div className="rb-flat-left">
// // //                 <div className="rb-flat-header">
// // //                   {/* <span className="rb-serial">{index + 1}</span> */}
// // // <span className="rb-claim-type">
// // //   {claim.claim_type === "Transportation" && (
// // //     <MdEmojiTransportation className="mobile-claim-icon" />
// // //   )}
// // //   {claim.claim_type === "Meals" && (
// // //     <GiKnifeFork className="mobile-claim-icon" />
// // //   )}
// // //   {claim.claim_type === "Telecommunication" && (
// // //     <MdOutlinePhoneAndroid className="mobile-claim-icon" />
// // //   )}
// // //   {claim.claim_type === "Stationary" && (
// // //     <GiPencilBrush className="mobile-claim-icon" />
// // //   )}
// // //   {claim.claim_type === "Miscellaneous" && (
// // //     <TbTriangleSquareCircle className="mobile-claim-icon" />
// // //   )}
// // //   {claim.claim_type}
// // // </span>                  <span className={`rb-status-tag ${claim.status?.toLowerCase()}`}>
// // //                     {claim.status || "Pending"}
// // //                   </span>
// // //                 </div>

// // //                 <div className="rb-flat-date">
// // //                   {claim.date
// // //                     ? formatDisplayDate(claim.date)
// // //                     : claim.date_range
// // //                     ? claim.date_range.split(" - ").map(formatDisplayDate).join(" → ")
// // //                     : claim.from_date && claim.to_date
// // //                     ? `${formatDisplayDate(claim.from_date)} → ${formatDisplayDate(claim.to_date)}`
// // //                     : "N/A"}
// // //                 </div>

// // //                 {/* <div className="rb-flat-purpose">
// // //                   {claim.purpose || "No description"}
// // //                 </div> */}
// // //               </div>

// // //               <div className="rb-flat-right">
// // //                 <div className="rb-flat-amount">₹{claim.total_amount}</div>

// // //                 <div className="rb-flat-icons">
// // //                   {attachments[claim.id]?.length > 0 && (
// // //                     <MdOutlineRemoveRedEye
// // //                       className="icon view"
// // //                       onClick={(e) => {
// // //                         e.stopPropagation();
// // //                         handleOpenAttachments(attachments[claim.id], claim);
// // //                       }}
// // //                     />
// // //                   )}

// // //                   {claim.status?.toLowerCase() === "pending" && (
// // //                     <>
// // //                       <MdOutlineEdit
// // //                         className="icon edit"
// // //                         onClick={(e) => {
// // //                           e.stopPropagation();
// // //                           handleEdit(claim);
// // //                         }}
// // //                       />
// // //                       <MdDeleteOutline
// // //                         className="icon delete"
// // //                         onClick={(e) => {
// // //                           e.stopPropagation();
// // //                           deleteReimbursement(claim.id);
// // //                         }}
// // //                       />
// // //                     </>
// // //                   )}
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           ))
// // //         )}
// // //       </div>

// // //       {/* Clean Fixed Bottom Bar */}
// // //       <div className="rb-bottom-bar">
// // //         <div>Total <strong>₹{totalAmount}</strong></div>
// // //         <div>Approved <strong>₹{approvedAmount}</strong></div>
// // //         <div>Rejected <strong>₹{rejectedAmount}</strong></div>
// // //       </div>
             
// // //       </div>

// // //       {/* Form modal */}
// // //       {showForm && (
// // //         <div className="rb-modal">
// // //           <div className="rb-modal-content">
// // //             <div className="claim-form-header">
// // //               <h2 className="claim-form-title">
// // //                 {editingId ? "Edit Reimbursement" : "New Reimbursement"}
// // //               </h2>
// // //               <MdOutlineCancel
// // //                 className="claim-form-close"
// // //                 onClick={() => setShowForm(false)}
// // //               />
// // //             </div>
// // //             {submitErrorMessage && (
// // //               <p className="rb-error-message">{submitErrorMessage}</p>
// // //             )}
// // //             {updateErrorMessage && (
// // //               <p className="rb-error-message">{updateErrorMessage}</p>
// // //             )}
// // //             <form className="reimbursement-form" onSubmit={handleSubmit}>
// // //               <div className="claim-type">
// // //                 <label>
// // //                   Project<span className="asterisk">*</span>
// // //                 </label>
// // //                 <select
// // //                   name="project"
// // //                   value={formData.project}
// // //                   onChange={handleChange}
// // //                   required
// // //                 >
// // //                   <option value="">Select project</option>
// // //                   <option value="Company Claim">Company Claim</option>
// // //                   {projects.map((proj, i) => (
// // //                     <option key={i} value={proj}>
// // //                       {proj}
// // //                     </option>
// // //                   ))}
// // //                 </select>

// // //                 <div className="rb-tabs">
// // //                   {claimTypes.map(({ icon, label }) => (
// // //                     <div
// // //                       key={label}
// // //                       className={`rb-tab ${
// // //                         formData.claim_type === label ? "active" : ""
// // //                       }`}
// // //                       onClick={() =>
// // //                         handleClaimTypeChange({ target: { value: label } })
// // //                       }
// // //                     >
// // //                       {icon} {label}
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //               </div>

// // //               {renderClaimSpecificFields()}

// // //               <div className="reimbursement-form-button">
// // //                 <button
// // //                   type="button"
// // //                   className="rb-close"
// // //                   onClick={() => setShowForm(false)}
// // //                 >
// // //                   Cancel
// // //                 </button>
// // //                 <button type="submit" className="rb-submit">
// // //                   {editingId ? "Update" : "Submit"}
// // //                 </button>
// // //               </div>
// // //             </form>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* Attachments modal */}
// // //       {isModalOpen && (
// // //         <div className="att-modal-overlay">
// // //           <div className="att-modal-content">
// // //             <div className="att-header">
// // //               <h2>Attachments</h2>
// // //               <MdOutlineCancel
// // //                 className="att-close"
// // //                 onClick={() => setIsModalOpen(false)}
// // //               />
// // //             </div>
// // //             <h4 className="att-files">
// // //               {selectedClaim?.claim_type
// // //                 ? `${selectedClaim.claim_type} Bills`
// // //                 : "Bills"}
// // //             </h4>
// // //             {selectedFiles.length > 0 ? (
// // //               selectedFiles.map((file, idx) => (
// // //                 <div className="att-files" key={idx}>
// // //                   <a href={file.url} target="_blank" rel="noopener noreferrer">
// // //                     {file.name}
// // //                   </a>
// // //                 </div>
// // //               ))
// // //             ) : (
// // //               <p>No attachments available</p>
// // //             )}
// // //             <button
// // //               className="att-close-btn"
// // //               onClick={() => setIsModalOpen(false)}
// // //             >
// // //               Close
// // //             </button>
// // //           </div>
// // //         </div>
// // //       )}

// // //       <Modal
// // //         isVisible={confirmModal.isVisible}
// // //         onClose={closeConfirm}
// // //         buttons={[
// // //           { label: "Cancel", onClick: closeConfirm },
// // //           { label: "Confirm", onClick: confirmModal.onConfirm },
// // //         ]}
// // //       >
// // //         <p>{confirmModal.message}</p>
// // //       </Modal>

// // //       <Modal
// // //         isVisible={alertModal.isVisible}
// // //         onClose={closeAlert}
// // //         buttons={[{ label: "OK", onClick: closeAlert }]}
// // //       >
// // //         <p>{alertModal.message}</p>
// // //       </Modal>
// // //     </div>
// // //   );
// // // };

// // // export default Reimbursement;


// // "use client";

// // import React, { useState, useEffect, useCallback, useRef } from "react";
// // import axios from "axios";
// // import { FaSearch } from "react-icons/fa";
// // import {
// //   MdOutlineEdit,
// //   MdDeleteOutline,
// //   MdOutlineCancel,
// //   MdEmojiTransportation,
// //   MdOutlinePhoneAndroid,
// //   MdOutlineRemoveRedEye,
// // } from "react-icons/md";
// // import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
// // import { TbTriangleSquareCircle } from "react-icons/tb";
// // import "./Reimbursement.css";
// // import Modal from "../Modal/Modal.client";
// // import { useAuth } from "../../context/AuthProvider.client";

// // const claimTypes = [
// //   {
// //     icon: <MdEmojiTransportation className="claim-icons" />,
// //     label: "Transportation",
// //   },
// //   { icon: <GiKnifeFork className="claim-icons" />, label: "Meals" },
// //   {
// //     icon: <MdOutlinePhoneAndroid className="claim-icons" />,
// //     label: "Telecommunication",
// //   },
// //   { icon: <GiPencilBrush className="claim-icons" />, label: "Stationary" },
// //   {
// //     icon: <TbTriangleSquareCircle className="claim-icons" />,
// //     label: "Miscellaneous",
// //   },
// // ];

// // const Reimbursement = () => {
// //   const { user } = useAuth();
// //   const orgId = user?.orgId || user?.org_id || null;
// //   const role = user?.role || " ";
// //   const authToken = user?.token;
// //   const employeeId = user?.employeeId;
// //   const departmentId = user?.department_id;

// //   const [reimbursements, setReimbursements] = useState([]);
// //   const [filteredReimbursements, setFilteredReimbursements] = useState([]);
// //   const [fromDate, setFromDate] = useState("");
// //   const [toDate, setToDate] = useState("");
// //   const [showForm, setShowForm] = useState(false);
// //   const [editingId, setEditingId] = useState(null);
// //   const [transportType, setTransportType] = useState("");
// //   const [noOfDaysType, setNoOfDaysType] = useState("");
// //   const [attachments, setAttachments] = useState({});
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [selectedFiles, setSelectedFiles] = useState([]);
// //   const [selectedClaim, setSelectedClaim] = useState(null);
// //   const [errorMessage, setErrorMessage] = useState("");
// //   const [updateErrorMessage, setUpdateErrorMessage] = useState("");
// //   const [submitErrorMessage, setSubmitErrorMessage] = useState("");
// //   const [projects, setProjects] = useState([]);
// //   const [statusFilter, setStatusFilter] = useState("pending");
// //   const [selectedSubType, setSelectedSubType] = useState("");

// //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
// //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// //   const fileInputRef = useRef(null);

// //   const [formData, setFormData] = useState({
// //     employeeId: employeeId,
// //     department_id: departmentId,
// //     claim_type: "",
// //     transport_type: "",
// //     transport_amount: "",
// //     da: "",
// //     fromDate: "",
// //     toDate: "",
// //     date: "",
// //     travel_from: "",
// //     travel_to: "",
// //     meals_objective: "",
// //     purpose: "",
// //     purchasing_item: "",
// //     accommodation_fees: "",
// //     no_of_days: "",
// //     total_amount: "",
// //     meal_type: "",
// //     stationary: "",
// //     service_provider: "",
// //     project: "",
// //     attachments: null,
// //   });

// //   const formatDisplayDate = (raw) => {
// //     if (!raw) return "N/A";
// //     const d = raw instanceof Date ? raw : new Date(raw);
// //     if (isNaN(d)) return raw;
// //     const day = String(d.getDate()).padStart(2, "0");
// //     const month = d.toLocaleString("en-GB", { month: "short" });
// //     const year = d.getFullYear();
// //     return `${day}-${month}-${year}`;
// //   };

// //   const [confirmModal, setConfirmModal] = useState({
// //     isVisible: false,
// //     message: "",
// //     onConfirm: null,
// //   });
// //   const showConfirm = (message, onConfirm) =>
// //     setConfirmModal({ isVisible: true, message, onConfirm });
// //   const closeConfirm = () =>
// //     setConfirmModal({ isVisible: false, message: "", onConfirm: null });

// //   const [alertModal, setAlertModal] = useState({
// //     isVisible: false,
// //     title: "",
// //     message: "",
// //   });
// //   const showAlert = (message, title = "") =>
// //     setAlertModal({ isVisible: true, title, message });
// //   const closeAlert = () =>
// //     setAlertModal({ isVisible: false, title: "", message: "" });

// //   const fetchReimbursements = useCallback(async () => {
// //     try {
// //       const response = await axios.get(
// //         `${BACKEND_URL}/reimbursement/${employeeId}`,
// //         {
// //           headers: {
// //             "x-api-key": API_KEY,
// //             "Content-Type": "application/json",
// //             Authorization: `Bearer ${authToken}`,
// //             "x-org-id": orgId,
// //           },
// //         }
// //       );

// //       const reimbursementsData = Array.isArray(response.data)
// //         ? response.data
// //         : response.data || [];
// //       setReimbursements(reimbursementsData);

// //       const attachmentsData = {};
// //       await Promise.all(
// //         reimbursementsData.map(async (claim) => {
// //           try {
// //             const claimId = claim.id;
// //             const attachmentResponse = await axios.get(
// //               `${BACKEND_URL}/reimbursement/${claimId}/attachments`,
// //               {
// //                 headers: {
// //                   "x-api-key": API_KEY,
// //                   Authorization: `Bearer ${authToken}`,
// //                   "x-org-id": orgId,
// //                 },
// //               }
// //             );

// //             attachmentsData[claimId] = (
// //               attachmentResponse.data.attachments || []
// //             ).map((file) => {
// //               // robustly extract org/year/month/empId from file_path
// //               const pathParts = (file.file_path || "")
// //                 .split("/")
// //                 .filter(Boolean);
// //               let orgSeg = "";
// //               let year = "";
// //               let month = "";
// //               let empId = claim.employee_id || claim.employeeId || "";
// //               const idx = pathParts.findIndex((p) => p === "reimbursement");
// //               if (idx !== -1 && pathParts.length >= idx + 5) {
// //                 orgSeg = pathParts[idx + 1];
// //                 year = pathParts[idx + 2];
// //                 month = pathParts[idx + 3];
// //                 empId = pathParts[idx + 4] || empId;
// //               } else {
// //                 // fallback to older layout (no orgId)
// //                 year = pathParts[pathParts.length - 4] || "";
// //                 month = pathParts[pathParts.length - 3] || "";
// //                 empId =
// //                   pathParts[pathParts.length - 2] ||
// //                   claim.employee_id ||
// //                   claim.employeeId ||
// //                   empId;
// //               }
// //               return {
// //                 ...file,
// //                 orgId: orgSeg,
// //                 year,
// //                 month,
// //                 employeeId: empId,
// //               };
// //             });
// //           } catch (err) {
// //             console.error(
// //               `Error fetching attachments for claim ${claim.id}`,
// //               err
// //             );
// //             attachmentsData[claim.id] = [];
// //           }
// //         })
// //       );

// //       setAttachments(attachmentsData);
// //     } catch (error) {
// //       console.error("Error fetching reimbursements:", error);
// //       setErrorMessage(
// //         error?.response?.data?.message ||
// //           "We ran into a problem fetching reimbursements."
// //       );
// //       showAlert(
// //         error?.response?.data?.message || "Error fetching reimbursements."
// //       );
// //     }
// //   }, [employeeId, authToken, orgId]);

// //   const fetchProjects = useCallback(async () => {
// //     try {
// //       const res = await axios.get(`${BACKEND_URL}/projectdrop`, {
// //         headers: { "x-api-key": API_KEY, "x-org-id": orgId },
// //       });
// //       setProjects(res.data || []);
// //     } catch (err) {
// //       console.error("Error fetching projects:", err);
// //     }
// //   }, [orgId]);

// //   useEffect(() => {
// //     if (!employeeId) return;
// //     fetchReimbursements();
// //     fetchProjects();
// //   }, [fetchReimbursements, fetchProjects, employeeId]);

// //   const tryParseDate = (s) => {
// //     if (!s && s !== 0) return null;
// //     if (s instanceof Date && !isNaN(s)) return s;
// //     if (typeof s === "number") {
// //       const d = new Date(s);
// //       return isNaN(d) ? null : d;
// //     }
// //     let str = String(s).trim();
// //     if (!str) return null;
// //     str = str.replace(/\s+to\s+/i, " - ");
// //     str = str.replace(/\u2013|\u2014/g, " - ");
// //     str = str.replace(/\//g, "-");
// //     let d = new Date(str);
// //     if (!isNaN(d)) return d;
// //     if (str.includes("T")) {
// //       const [dateOnly] = str.split("T");
// //       d = new Date(dateOnly);
// //       if (!isNaN(d)) return d;
// //     }
// //     const ddmmyyyy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
// //     if (ddmmyyyy) {
// //       const [, dd, mm, yyyy] = ddmmyyyy;
// //       d = new Date(`${yyyy}-${mm}-${dd}`);
// //       if (!isNaN(d)) return d;
// //     }
// //     return null;
// //   };

// //   const normalizeStartOfDay = (date) =>
// //     new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
// //   const normalizeEndOfDay = (date) =>
// //     new Date(
// //       date.getFullYear(),
// //       date.getMonth(),
// //       date.getDate(),
// //       23,
// //       59,
// //       59,
// //       999
// //     );

// //   const parseClaimRange = (claim) => {
// //     let start = null;
// //     let end = null;

// //     if (
// //       claim.date_range &&
// //       typeof claim.date_range === "string" &&
// //       (claim.date_range.includes(" - ") ||
// //         claim.date_range.toLowerCase().includes(" to ") ||
// //         claim.date_range.includes("–") ||
// //         claim.date_range.includes("—"))
// //     ) {
// //       const unified = claim.date_range
// //         .replace(/\s+to\s+/gi, " - ")
// //         .replace(/\u2013|\u2014/g, " - ");
// //       const parts = unified.split(" - ").map((p) => p.trim());
// //       if (parts.length >= 2) {
// //         const p0 = tryParseDate(parts[0]);
// //         const p1 = tryParseDate(parts[1]);
// //         start = p0 || null;
// //         end = p1 || null;
// //       }
// //     }

// //     if (!start && (claim.from_date || claim.fromDate)) {
// //       start = tryParseDate(claim.from_date || claim.fromDate);
// //     }
// //     if (!end && (claim.to_date || claim.toDate)) {
// //       end = tryParseDate(claim.to_date || claim.toDate);
// //     }

// //     if (!start && claim.date) {
// //       start = tryParseDate(claim.date);
// //       end = start;
// //     }

// //     if (!start && claim.created_at) {
// //       const t = tryParseDate(claim.created_at);
// //       start = t;
// //       end = t;
// //     }

// //     if (start && !end) end = start;

// //     if (start && end) {
// //       start = normalizeStartOfDay(start);
// //       end = normalizeEndOfDay(end);
// //     }
// //     return { start, end };
// //   };

// //   const applyFilters = useCallback(() => {
// //     const fRaw = fromDate ? tryParseDate(fromDate) : null;
// //     const tRaw = toDate ? tryParseDate(toDate) : null;
// //     const fStart = fRaw ? normalizeStartOfDay(fRaw) : null;
// //     const tEnd = tRaw ? normalizeEndOfDay(tRaw) : null;

// //     const filtered = reimbursements.filter((claim) => {
// //       if (
// //         statusFilter &&
// //         claim.status &&
// //         claim.status.toLowerCase() !== statusFilter.toLowerCase()
// //       ) {
// //         return false;
// //       }

// //       if (!fStart && !tEnd) return true;

// //       const { start, end } = parseClaimRange(claim);

// //       if (!start || !end) {
// //         return !fStart && !tEnd;
// //       }

// //       if (fStart && !tEnd) {
// //         return end.getTime() >= fStart.getTime();
// //       }
// //       if (!fStart && tEnd) {
// //         return start.getTime() <= tEnd.getTime();
// //       }
// //       if (fStart && tEnd) {
// //         if (end.getTime() < fStart.getTime()) return false;
// //         if (start.getTime() > tEnd.getTime()) return false;
// //         return true;
// //       }

// //       return true;
// //     });

// //     setFilteredReimbursements(filtered);
// //   }, [reimbursements, fromDate, toDate, statusFilter]);

// //   useEffect(() => {
// //     applyFilters();
// //   }, [reimbursements, fromDate, toDate, statusFilter, applyFilters]);

// //   const handleChange = (e) =>
// //     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

// //   const handleClaimTypeChange = (e) => {
// //     const value = e.target.value;
// //     setFormData((prev) => ({ ...prev, claim_type: value }));
// //     setSelectedFiles([]);
// //     setSelectedClaim(null);
// //     setSelectedSubType("");
// //   };

// //   const handleTransportSubTypeChange = (type) => {
// //     setFormData((prev) => ({ ...prev, transport_type: type }));
// //     setSelectedSubType(type);
// //     if (type === "Outstation") {
// //       setFormData((prev) => ({ ...prev, no_of_days: "" }));
// //     }
// //   };

// //   const handleNoOfDaysChange = (event) =>
// //     setFormData((prev) => ({ ...prev, no_of_days: event.target.value }));

// //   const handleFileUpload = (e) => {
// //     const files = Array.from(e.target.files || []);
// //     setSelectedFiles(files.map((file) => file.name));
// //     setFormData((prev) => ({ ...prev, attachments: files }));
// //   };

// //   const renderDateFields = () => {
// //     if (formData.transport_type === "Outstation") {
// //       return (
// //         <>
// //           <div className="rb-groups">
// //             <label>
// //               From Date<span className="asterisk">*</span>
// //             </label>
// //             <input
// //               type="date"
// //               name="fromDate"
// //               value={formData.fromDate}
// //               onChange={handleChange}
// //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// //             />
// //           </div>
// //           <div className="rb-groups">
// //             <label>
// //               To Date<span className="asterisk">*</span>
// //             </label>
// //             <input
// //               type="date"
// //               name="toDate"
// //               value={formData.toDate}
// //               onChange={handleChange}
// //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// //             />
// //           </div>
// //         </>
// //       );
// //     } else if (formData.no_of_days === "single") {
// //       return (
// //         <div className="rb-groups">
// //           <label>
// //             Date<span className="asterisk">*</span>
// //           </label>
// //           <input
// //             type="date"
// //             name="date"
// //             value={formData.date}
// //             onChange={handleChange}
// //             max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// //           />
// //         </div>
// //       );
// //     } else if (formData.no_of_days === "multiple") {
// //       return (
// //         <>
// //           <div className="rb-groups">
// //             <label>
// //               From Date<span className="asterisk">*</span>
// //             </label>
// //             <input
// //               type="date"
// //               name="fromDate"
// //               value={formData.fromDate}
// //               onChange={handleChange}
// //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// //             />
// //           </div>
// //           <div className="rb-groups">
// //             <label>
// //               To Date<span className="asterisk">*</span>
// //             </label>
// //             <input
// //               type="date"
// //               name="toDate"
// //               value={formData.toDate}
// //               onChange={handleChange}
// //               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// //             />
// //           </div>
// //         </>
// //       );
// //     }
// //     return null;
// //   };

// //   // const handleEdit = (claim) => {
// //   //   setEditingId(claim.id);
// //   //   setShowForm(true);
// //   //   const existingAttachments = attachments[claim.id] || [];
// //   //   setFormData({
// //   //     employeeId: claim.employeeId || claim.employee_id || employeeId,
// //   //     department_id: claim.department_id || departmentId,
// //   //     claim_type: claim.claim_type || "",
// //   //     transport_type: claim.transport_type || "",
// //   //     fromDate: claim.from_date
// //   //       ? claim.from_date.substring(0, 10)
// //   //       : claim.fromDate || "",
// //   //     toDate: claim.to_date
// //   //       ? claim.to_date.substring(0, 10)
// //   //       : claim.toDate || "",
// //   //     date: claim.date ? claim.date.substring(0, 10) : claim.date || "",
// //   //     travel_from: claim.travel_from || "",
// //   //     travel_to: claim.travel_to || "",
// //   //     meals_objective: claim.meals_objective || "",
// //   //     purpose: claim.purpose || "",
// //   //     purchasing_item: claim.purchasing_item || "",
// //   //     accommodation_fees: claim.accommodation_fees || "",
// //   //     transport_amount: claim.transport_amount || "",
// //   //     da: claim.da || "",
// //   //     no_of_days: claim.no_of_days || "",
// //   //     total_amount: claim.total_amount || "",
// //   //     meal_type: claim.meal_type || "",
// //   //     stationary: claim.stationary || "",
// //   //     comments: claim.comments || "",
// //   //     service_provider: claim.service_provider || "",
// //   //     project: claim.project || "",
// //   //     attachments: existingAttachments,
// //   //   });
// //   //   setSelectedFiles(
// //   //     existingAttachments.map((file) => file.file_name || file.name)
// //   //   );
// //   //   setSelectedSubType(claim.transport_type || "");
// //   // };
// // const handleEdit = (claim) => {
// //   setEditingId(claim.id);
// //   setShowForm(true);

// //   const existingAttachments = attachments[claim.id] || [];
// //   setFormData({
// //     employeeId: claim.employeeId || claim.employee_id || employeeId,
// //     department_id: claim.department_id || departmentId,
// //     claim_type: claim.claim_type || "",
// //     transport_type: claim.transport_type || "",
// //     fromDate: claim.from_date ? claim.from_date.substring(0, 10) : claim.fromDate || "",
// //     toDate: claim.to_date ? claim.to_date.substring(0, 10) : claim.toDate || "",
// //     date: claim.date ? claim.date.substring(0, 10) : claim.date || "",
// //     travel_from: claim.travel_from || "",
// //     travel_to: claim.travel_to || "",
// //     meals_objective: claim.meals_objective || "",
// //     purpose: claim.purpose || "",
// //     purchasing_item: claim.purchasing_item || "",
// //     accommodation_fees: claim.accommodation_fees || "",
// //     transport_amount: claim.transport_amount || "",
// //     da: claim.da || "",
// //     no_of_days: claim.no_of_days || "",
// //     total_amount: claim.total_amount || "",
// //     meal_type: claim.meal_type || "",
// //     stationary: claim.stationary || "",
// //     service_provider: claim.service_provider || "",
// //     project: claim.project || "",
// //     attachments: existingAttachments,
// //   });

// //   setSelectedFiles(existingAttachments.map((file) => file.file_name || file.name || ""));

// //   // Mobile: Fill stepper + smart step
// //   setMobileFormData({
// //     project: claim.project || "",
// //     claim_type: claim.claim_type || "",
// //     transport_type: claim.transport_type || "",
// //   });

// //   // Always start from Step 2 when editing
// //   setMobileStep(2);

// //   // Auto-jump to Step 4 if claim type is selected (and transport type if needed)
// //   if (claim.claim_type) {
// //     setTimeout(() => {
// //       if (claim.claim_type === "Transportation" && claim.transport_type) {
// //         setMobileStep(4);
// //       } else if (claim.claim_type !== "Transportation") {
// //         setMobileStep(4);
// //       }
// //     }, 300);
// //   }
// // };
// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setSubmitErrorMessage("");
// //     const wordCount = formData.purpose
// //       ? formData.purpose.trim().split(/\s+/).filter(Boolean).length
// //       : 0;
// //     if (wordCount < 10) {
// //       showAlert(
// //         `Purpose Details / Comments must be at least 10 words. You have ${wordCount}.`
// //       );
// //       return;
// //     }
// //     try {
// //       const fd = new FormData();
// //       Object.keys(formData).forEach((k) => {
// //         if (k === "attachments") return; // handled separately
// //         const val = formData[k];
// //         if (val !== null && val !== undefined) fd.append(k, val);
// //       });

// //       // append role + orgId
// //       fd.append("role", role);
// //       if (orgId) fd.append("orgId", orgId);

// //       if (formData.attachments && formData.attachments.length > 0) {
// //         formData.attachments.forEach((file) => {
// //           if (file instanceof File) {
// //             fd.append("attachments", file);
// //           }
// //         });
// //       }
// //       const config = {
// //         headers: {
// //           "x-api-key": API_KEY,
// //           "Content-Type": "multipart/form-data",
// //           Authorization: `Bearer ${authToken}`,
// //           "x-org-id": orgId,
// //         },
// //       };
// //       let response;
// //       if (editingId) {
// //         response = await axios.put(
// //           `${BACKEND_URL}/reimbursement/${editingId}`,
// //           fd,
// //           config
// //         );
// //       } else {
// //         response = await axios.post(`${BACKEND_URL}/reimbursement`, fd, config);
// //       }
// //       showAlert(
// //         response?.data?.message || "Reimbursement submitted successfully!"
// //       );
// //       // reset form
// //       setFormData({
// //         employeeId: employeeId,
// //         department_id: departmentId,
// //         claim_type: "",
// //         transport_type: "",
// //         fromDate: "",
// //         toDate: "",
// //         date: "",
// //         travel_from: "",
// //         travel_to: "",
// //         meals_objective: "",
// //         purpose: "",
// //         purchasing_item: "",
// //         accommodation_fees: "",
// //         no_of_days: "",
// //         total_amount: "",
// //         meal_type: "",
// //         stationary: "",
// //         service_provider: "",
// //         project: "",
// //         attachments: null,
// //       });
// //       setShowForm(false);
// //       setEditingId(null);
// //       setSelectedFiles([]);
// //       fetchReimbursements();
// //     } catch (error) {
// //       console.error("Error submitting reimbursement:", error);
// //       const msg =
// //         error?.response?.data?.error ||
// //         error?.response?.data?.message ||
// //         "An unexpected error occurred.";
// //       setSubmitErrorMessage(msg);
// //       showAlert(msg);
// //     }
// //   };

// //   const updateReimbursement = async (reimbursementId, updateData) => {
// //     try {
// //       const response = await axios.put(
// //         `${BACKEND_URL}/reimbursement/${reimbursementId}`,
// //         updateData,
// //         {
// //           headers: {
// //             "Content-Type": "application/json",
// //             "x-api-key": API_KEY,
// //             "x-org-id": orgId,
// //             Authorization: `Bearer ${authToken}`,
// //           },
// //         }
// //       );
// //       console.log("Update Response:", response.data);
// //       fetchReimbursements();
// //       return response.data;
// //     } catch (error) {
// //       console.error("Error updating reimbursement:", error);
// //       const msg =
// //         error?.response?.data?.message ||
// //         error.message ||
// //         "An unexpected error occurred.";
// //       setUpdateErrorMessage(msg);
// //       showAlert(msg);
// //       throw error;
// //     }
// //   };

// //   const deleteReimbursement = async (id) => {
// //     if (!id) {
// //       console.error("Error: Reimbursement ID is missing.");
// //       return;
// //     }
// //     showConfirm(
// //       "Are you sure you want to delete this reimbursement claim?",
// //       async () => {
// //         try {
// //           const response = await axios.delete(
// //             `${BACKEND_URL}/reimbursement/${id}`,
// //             {
// //               headers: {
// //                 "x-api-key": API_KEY,
// //                 "x-org-id": orgId,
// //                 Authorization: `Bearer ${authToken}`,
// //               },
// //             }
// //           );
// //           showAlert(
// //             response.data.message || "Reimbursement deleted successfully!"
// //           );
// //           fetchReimbursements();
// //         } catch (error) {
// //           console.error("Error deleting reimbursement:", error);
// //           showAlert("There was an issue deleting the reimbursement.");
// //         } finally {
// //           closeConfirm();
// //         }
// //       }
// //     );
// //   };

// //   const handleOpenAttachments = async (files, claim) => {
// //     try {
// //       const fetchedFiles = await Promise.all(
// //         (files || []).map(async (file) => {
// //           if (!file?.file_name && !file?.file_name) return null;
// //           const fname = file.file_name || file.fileName || file.name;
// //           const match = fname.match(/^(\d{4})-(\d{2})/);
// //           if (!match) return null;
// //           const [, year, month] = match;

// //           // org/year/month/emp/file_name layout: pick org from file.orgId if available,
// //           // otherwise try extracting from file_path similarly
// //           let fileOrg = file.orgId || "";
// //           if (!fileOrg && file.file_path) {
// //             const parts = (file.file_path || "").split("/").filter(Boolean);
// //             const idx = parts.findIndex((p) => p === "reimbursement");
// //             if (idx !== -1 && parts.length >= idx + 5) {
// //               fileOrg = parts[idx + 1];
// //             } else if (parts.length >= 5) {
// //               // fallback heuristic: org may be at -5
// //               fileOrg = parts[parts.length - 5] || "";
// //             }
// //           }
// //           // prefer the orgId we have in the client context if nothing extracted
// //           if (!fileOrg) fileOrg = orgId || "";

// //           const empId = claim.employee_id || claim.employeeId || "";
// //           const url = `${BACKEND_URL}/reimbursement/${fileOrg}/${year}/${month}/${empId}/${fname}`;

// //           const response = await axios.get(url, {
// //             headers: {
// //               "x-api-key": API_KEY,
// //               Authorization: `Bearer ${authToken}`,
// //               "x-org-id": fileOrg || orgId,
// //               "x-employee-id": employeeId,
// //             },
// //             responseType: "blob",
// //           });

// //           return {
// //             name: fname,
// //             url: URL.createObjectURL(
// //               new Blob([response.data], {
// //                 type: response.headers["content-type"],
// //               })
// //             ),
// //           };
// //         })
// //       );
// //       const validFiles = fetchedFiles.filter(Boolean);
// //       if (!validFiles.length)
// //         return showAlert("No valid attachments could be loaded.");
// //       setSelectedFiles(validFiles);
// //       setSelectedClaim(claim);
// //       setIsModalOpen(true);
// //     } catch (error) {
// //       console.error("Error fetching attachments:", error);
// //       showAlert("Could not load attachments. Please try again.");
// //     }
// //   };

// //   // Use filteredReimbursements (NOT reimbursements) for display and totals
// //   const filterClaims = filteredReimbursements || [];

// //   const totalAmount = (filteredReimbursements || []).reduce((sum, claim) => {
// //     const val = parseFloat(claim.total_amount);
// //     return sum + (isNaN(val) ? 0 : val);
// //   }, 0);
// //   const approvedAmount = (filteredReimbursements || [])
// //     .filter((c) => (c.status || "").toLowerCase() === "approved")
// //     .reduce((sum, claim) => {
// //       const val = parseFloat(claim.total_amount);
// //       return sum + (isNaN(val) ? 0 : val);
// //     }, 0);
// //   const rejectedAmount = (filteredReimbursements || [])
// //     .filter((c) => (c.status || "").toLowerCase() === "rejected")
// //     .reduce((sum, claim) => {
// //       const val = parseFloat(claim.total_amount);
// //       return sum + (isNaN(val) ? 0 : val);
// //     }, 0);


// //     const [mobileStep, setMobileStep] = useState(1); // 1=project, 2=claim type, 3=subtype, 4=form
// // const [mobileFormData, setMobileFormData] = useState({
// //   project: "",
// //   claim_type: "",
// //   transport_type: "",
// // });

// //   // const renderClaimSpecificFields = () => {
// //   //   switch (formData.claim_type) {
// //   //     case "Transportation":
// //   //       return (
// //   //         <>
// //   //           <div className="sub-tabs">
// //   //             {["Outstation", "Intercity", "Fuel"].map((type) => (
// //   //               <div
// //   //                 key={type}
// //   //                 className={`sub-tab ${
// //   //                   formData.transport_type === type ? "active" : ""
// //   //                 }`}
// //   //                 onClick={() => handleTransportSubTypeChange(type)}
// //   //               >
// //   //                 {type}
// //   //               </div>
// //   //             ))}
// //   //           </div>

// //   //           {(formData.transport_type === "Intercity" ||
// //   //             formData.transport_type === "Fuel") && (
// //   //             <div className="rb-radio">
// //   //               <label>Select no of days</label>
// //   //               <div className="rb-radio-options">
// //   //                 <label>
// //   //                   <input
// //   //                     type="radio"
// //   //                     name="no_of_days"
// //   //                     value="single"
// //   //                     checked={formData.no_of_days === "single"}
// //   //                     onChange={handleNoOfDaysChange}
// //   //                   />
// //   //                   Single
// //   //                 </label>

// //   //                 <label>
// //   //                   <input
// //   //                     type="radio"
// //   //                     name="no_of_days"
// //   //                     value="multiple"
// //   //                     checked={formData.no_of_days === "multiple"}
// //   //                     onChange={handleNoOfDaysChange}
// //   //                   />
// //   //                   Multiple
// //   //                 </label>
// //   //               </div>
// //   //             </div>
// //   //           )}

// //   //           {formData.transport_type && (
// //   //             <div className="rb-main-form">
// //   //               <div className="rb-form-grid">
// //   //                 {renderDateFields()}

// //   //                 <div className="rb-groups">
// //   //                   <label>
// //   //                     Travel From<span className="asterisk">*</span>
// //   //                   </label>
// //   //                   <input
// //   //                     type="text"
// //   //                     name="travel_from"
// //   //                     value={formData.travel_from}
// //   //                     onChange={handleChange}
// //   //                   />
// //   //                 </div>
// //   //                 <div className="rb-groups">
// //   //                   <label>
// //   //                     Travel To<span className="asterisk">*</span>
// //   //                   </label>
// //   //                   <input
// //   //                     type="text"
// //   //                     name="travel_to"
// //   //                     value={formData.travel_to}
// //   //                     onChange={handleChange}
// //   //                   />
// //   //                 </div>

// //   //                 {formData.transport_type === "Outstation" && (
// //   //                   <div className="rb-groups">
// //   //                     <label>Transport Amount</label>
// //   //                     <input
// //   //                       type="number"
// //   //                       name="transport_amount"
// //   //                       value={formData.transport_amount}
// //   //                       onChange={handleChange}
// //   //                     />
// //   //                   </div>
// //   //                 )}

// //   //                 {formData.transport_type === "Outstation" && (
// //   //                   <div className="rb-groups">
// //   //                     <label>Accommodation Fees</label>
// //   //                     <input
// //   //                       type="number"
// //   //                       name="accommodation_fees"
// //   //                       value={formData.accommodation_fees}
// //   //                       onChange={handleChange}
// //   //                     />
// //   //                   </div>
// //   //                 )}

// //   //                 {formData.transport_type === "Outstation" && (
// //   //                   <div className="rb-groups">
// //   //                     <label>DA</label>
// //   //                     <input
// //   //                       type="number"
// //   //                       name="da"
// //   //                       value={formData.da}
// //   //                       onChange={handleChange}
// //   //                     />
// //   //                   </div>
// //   //                 )}

// //   //                 <div className="rb-groups">
// //   //                   <label>
// //   //                     Total Amount<span className="asterisk">*</span>
// //   //                   </label>
// //   //                   <input
// //   //                     type="number"
// //   //                     name="total_amount"
// //   //                     value={formData.total_amount}
// //   //                     onChange={handleChange}
// //   //                   />
// //   //                 </div>
// //   //               </div>

// //   //               <div className="purpose-attachment">
// //   //                 <div className="pa-groups">
// //   //                   <label>
// //   //                     Purpose Details / Comments
// //   //                     <span className="asterisk">*</span>
// //   //                   </label>
// //   //                   <textarea
// //   //                     name="purpose"
// //   //                     value={formData.purpose}
// //   //                     onChange={handleChange}
// //   //                   />
// //   //                 </div>

// //   //                 <div className="pa-groups">
// //   //                   <label>Attachment</label>
// //   //                   <div className="attachment-wrapper">
// //   //                     <div className="file-links">
// //   //                       {selectedFiles.length > 0 ? (
// //   //                         selectedFiles.map((fileName, index) => (
// //   //                           <p key={index} className="file-name">
// //   //                             {fileName}
// //   //                           </p>
// //   //                         ))
// //   //                       ) : (
// //   //                         <p>No files selected</p>
// //   //                       )}
// //   //                     </div>

// //   //                     <div className="attachment-upload">
// //   //                       <input
// //   //                         type="file"
// //   //                         multiple
// //   //                         ref={fileInputRef}
// //   //                         onChange={handleFileUpload}
// //   //                         style={{ display: "none" }}
// //   //                       />
// //   //                       <button
// //   //                         type="button"
// //   //                         className="custom-file-upload"
// //   //                         onClick={() =>
// //   //                           fileInputRef.current && fileInputRef.current.click()
// //   //                         }
// //   //                       >
// //   //                         Browse
// //   //                       </button>
// //   //                     </div>
// //   //                   </div>
// //   //                 </div>
// //   //               </div>
// //   //             </div>
// //   //           )}
// //   //         </>
// //   //       );

// //   //     case "Meals":
// //   //       return (
// //   //         <div className="rb-main-form">
// //   //           <div className="rb-form1-grid">
// //   //             <div className="rb-groups">
// //   //               <label>
// //   //                 Date<span className="asterisk">*</span>
// //   //               </label>
// //   //               <input
// //   //                 type="date"
// //   //                 name="date"
// //   //                 value={formData.date}
// //   //                 onChange={handleChange}
// //   //                 max={new Date(Date.now() - 86400000).toLocaleDateString(
// //   //                   "en-CA"
// //   //                 )}
// //   //               />
// //   //             </div>
// //   //             <div className="rb-groups">
// //   //               <label>Meal Type</label>
// //   //               <select
// //   //                 name="meal_type"
// //   //                 value={formData.meal_type}
// //   //                 onChange={handleChange}
// //   //               >
// //   //                 <option value="">Select</option>
// //   //                 <option value="breakfast">Break Fast</option>
// //   //                 <option value="lunch">Lunch</option>
// //   //                 <option value="dinner">Dinner</option>
// //   //                 <option value="Full Day">Full Day</option>
// //   //               </select>
// //   //             </div>
// //   //             <div className="rb-groups">
// //   //               <label>Meal's objective</label>
// //   //               <select
// //   //                 name="meals_objective"
// //   //                 value={formData.meals_objective}
// //   //                 onChange={handleChange}
// //   //               >
// //   //                 <option value="">Select</option>
// //   //                 <option value="client_visit">Client Visit</option>
// //   //                 <option value="team_outing">Team Outing</option>
// //   //                 <option value="extended_work">Extended</option>
// //   //                 <option value="others">Others</option>
// //   //               </select>
// //   //             </div>

// //   //             <div className="rb-groups">
// //   //               <label>
// //   //                 Total Amount<span className="asterisk">*</span>
// //   //               </label>
// //   //               <input
// //   //                 type="number"
// //   //                 name="total_amount"
// //   //                 value={formData.total_amount}
// //   //                 onChange={handleChange}
// //   //               />
// //   //             </div>
// //   //           </div>

// //   //           <div className="purpose-attachment">
// //   //             <div className="pa-groups">
// //   //               <label>
// //   //                 Purpose Details / Comments<span className="asterisk">*</span>
// //   //               </label>
// //   //               <textarea
// //   //                 name="purpose"
// //   //                 value={formData.purpose}
// //   //                 onChange={handleChange}
// //   //               />
// //   //             </div>

// //   //             <div className="pa-groups">
// //   //               <label>Attachment</label>
// //   //               <div className="attachment-wrapper">
// //   //                 <div className="file-links">
// //   //                   {selectedFiles.length > 0 ? (
// //   //                     selectedFiles.map((fileName, index) => (
// //   //                       <p key={index} className="file-name">
// //   //                         {fileName}
// //   //                       </p>
// //   //                     ))
// //   //                   ) : (
// //   //                     <p>No files selected</p>
// //   //                   )}
// //   //                 </div>

// //   //                 <div className="attachment-upload">
// //   //                   <input
// //   //                     type="file"
// //   //                     multiple
// //   //                     ref={fileInputRef}
// //   //                     onChange={handleFileUpload}
// //   //                     style={{ display: "none" }}
// //   //                   />
// //   //                   <button
// //   //                     type="button"
// //   //                     className="custom-file-upload"
// //   //                     onClick={() =>
// //   //                       fileInputRef.current && fileInputRef.current.click()
// //   //                     }
// //   //                   >
// //   //                     Browse
// //   //                   </button>
// //   //                 </div>
// //   //               </div>
// //   //             </div>
// //   //           </div>
// //   //         </div>
// //   //       );

// //   //     case "Telecommunication":
// //   //       return (
// //   //         <div className="rb-main-form">
// //   //           <div className="rb-form2-grid">
// //   //             <div className="rb-groups">
// //   //               <label>
// //   //                 Date<span className="asterisk">*</span>
// //   //               </label>
// //   //               <input
// //   //                 type="date"
// //   //                 name="date"
// //   //                 value={formData.date}
// //   //                 onChange={handleChange}
// //   //                 max={new Date(Date.now() - 86400000).toLocaleDateString(
// //   //                   "en-CA"
// //   //                 )}
// //   //               />
// //   //             </div>
// //   //             <div className="rb-groups">
// //   //               <label>Service Provider</label>
// //   //               <input
// //   //                 type="text"
// //   //                 name="service_provider"
// //   //                 value={formData.service_provider}
// //   //                 onChange={handleChange}
// //   //               />
// //   //             </div>
// //   //             <div className="rb-groups">
// //   //               <label>
// //   //                 Total Amount<span className="asterisk">*</span>
// //   //               </label>
// //   //               <input
// //   //                 type="number"
// //   //                 name="total_amount"
// //   //                 value={formData.total_amount}
// //   //                 onChange={handleChange}
// //   //               />
// //   //             </div>
// //   //           </div>
// //   //           <div className="purpose-attachment">
// //   //             <div className="pa-groups">
// //   //               <label>
// //   //                 Purpose Details / Comments<span className="asterisk">*</span>
// //   //               </label>
// //   //               <textarea
// //   //                 name="purpose"
// //   //                 value={formData.purpose}
// //   //                 onChange={handleChange}
// //   //               />
// //   //             </div>

// //   //             <div className="pa-groups">
// //   //               <label>Attachment</label>
// //   //               <div className="attachment-wrapper">
// //   //                 <div className="file-links">
// //   //                   {selectedFiles.length > 0 ? (
// //   //                     selectedFiles.map((fileName, index) => (
// //   //                       <p key={index} className="file-name">
// //   //                         {fileName}
// //   //                       </p>
// //   //                     ))
// //   //                   ) : (
// //   //                     <p>No files selected</p>
// //   //                   )}
// //   //                 </div>

// //   //                 <div className="attachment-upload">
// //   //                   <input
// //   //                     type="file"
// //   //                     multiple
// //   //                     ref={fileInputRef}
// //   //                     onChange={handleFileUpload}
// //   //                     style={{ display: "none" }}
// //   //                   />
// //   //                   <button
// //   //                     type="button"
// //   //                     className="custom-file-upload"
// //   //                     onClick={() =>
// //   //                       fileInputRef.current && fileInputRef.current.click()
// //   //                     }
// //   //                   >
// //   //                     Browse
// //   //                   </button>
// //   //                 </div>
// //   //               </div>
// //   //             </div>
// //   //           </div>
// //   //         </div>
// //   //       );

// //   //     case "Stationary":
// //   //       return (
// //   //         <div className="rb-main-form">
// //   //           <div className="rb-form1-grid">
// //   //             <div className="rb-groups">
// //   //               <label>
// //   //                 Date<span className="asterisk">*</span>
// //   //               </label>
// //   //               <input
// //   //                 type="date"
// //   //                 name="date"
// //   //                 value={formData.date}
// //   //                 onChange={handleChange}
// //   //                 max={new Date(Date.now() - 86400000).toLocaleDateString(
// //   //                   "en-CA"
// //   //                 )}
// //   //               />
// //   //             </div>
// //   //             <div className="rb-groups">
// //   //               <label>Stationary</label>
// //   //               <select
// //   //                 name="stationary"
// //   //                 value={formData.stationary}
// //   //                 onChange={handleChange}
// //   //               >
// //   //                 <option value="">Select</option>
// //   //                 <option value="office equipments">Office Equipments</option>
// //   //                 <option value="general stationary">General Stationary</option>
// //   //               </select>
// //   //             </div>
// //   //             <div className="rb-groups">
// //   //               <label>Purchasing Items</label>
// //   //               <input
// //   //                 type="text"
// //   //                 name="purchasing_item"
// //   //                 value={formData.purchasing_item}
// //   //                 onChange={handleChange}
// //   //               />
// //   //             </div>

// //   //             <div className="rb-groups">
// //   //               <label>
// //   //                 Total Amount<span className="asterisk">*</span>
// //   //               </label>
// //   //               <input
// //   //                 type="number"
// //   //                 name="total_amount"
// //   //                 value={formData.total_amount}
// //   //                 onChange={handleChange}
// //   //               />
// //   //             </div>
// //   //           </div>

// //   //           <div className="purpose-attachment">
// //   //             <div className="pa-groups">
// //   //               <label>
// //   //                 Purpose Details / Comments<span className="asterisk">*</span>
// //   //               </label>
// //   //               <textarea
// //   //                 name="purpose"
// //   //                 value={formData.purpose}
// //   //                 onChange={handleChange}
// //   //               />
// //   //             </div>

// //   //             <div className="pa-groups">
// //   //               <label>Attachment</label>
// //   //               <div className="attachment-wrapper">
// //   //                 <div className="file-links">
// //   //                   {selectedFiles.length > 0 ? (
// //   //                     selectedFiles.map((fileName, index) => (
// //   //                       <p key={index} className="file-name">
// //   //                         {fileName}
// //   //                       </p>
// //   //                     ))
// //   //                   ) : (
// //   //                     <p>No files selected</p>
// //   //                   )}
// //   //                 </div>

// //   //                 <div className="attachment-upload">
// //   //                   <input
// //   //                     type="file"
// //   //                     multiple
// //   //                     ref={fileInputRef}
// //   //                     onChange={handleFileUpload}
// //   //                     style={{ display: "none" }}
// //   //                   />
// //   //                   <button
// //   //                     type="button"
// //   //                     className="custom-file-upload"
// //   //                     onClick={() =>
// //   //                       fileInputRef.current && fileInputRef.current.click()
// //   //                     }
// //   //                   >
// //   //                     Browse
// //   //                   </button>
// //   //                 </div>
// //   //               </div>
// //   //             </div>
// //   //           </div>
// //   //         </div>
// //   //       );

// //   //     case "Miscellaneous":
// //   //       return (
// //   //         <div className="rb-main-form">
// //   //           <div className="rb-form1-grid">
// //   //             <div className="rb-groups">
// //   //               <label>
// //   //                 Date<span className="asterisk">*</span>
// //   //               </label>
// //   //               <input
// //   //                 type="date"
// //   //                 name="date"
// //   //                 value={formData.date}
// //   //                 onChange={handleChange}
// //   //                 max={new Date(Date.now() - 86400000).toLocaleDateString(
// //   //                   "en-CA"
// //   //                 )}
// //   //               />
// //   //             </div>
// //   //             <div className="rb-groups">
// //   //               <label>
// //   //                 Total Amount<span className="asterisk">*</span>
// //   //               </label>
// //   //               <input
// //   //                 type="number"
// //   //                 name="total_amount"
// //   //                 value={formData.total_amount}
// //   //                 onChange={handleChange}
// //   //               />
// //   //             </div>
// //   //           </div>

// //   //           <div className="purpose-attachment">
// //   //             <div className="pa-groups">
// //   //               <label>
// //   //                 Purpose Details / Comments<span className="asterisk">*</span>
// //   //               </label>
// //   //               <textarea
// //   //                 name="purpose"
// //   //                 value={formData.purpose}
// //   //                 onChange={handleChange}
// //   //               />
// //   //             </div>

// //   //             <div className="pa-groups">
// //   //               <label>Attachment</label>
// //   //               <div className="attachment-wrapper">
// //   //                 <div className="file-links">
// //   //                   {selectedFiles.length > 0 ? (
// //   //                     selectedFiles.map((fileName, index) => (
// //   //                       <p key={index} className="file-name">
// //   //                         {fileName}
// //   //                       </p>
// //   //                     ))
// //   //                   ) : (
// //   //                     <p>No files selected</p>
// //   //                   )}
// //   //                 </div>

// //   //                 <div className="attachment-upload">
// //   //                   <input
// //   //                     type="file"
// //   //                     multiple
// //   //                     ref={fileInputRef}
// //   //                     onChange={handleFileUpload}
// //   //                     style={{ display: "none" }}
// //   //                   />
// //   //                   <button
// //   //                     type="button"
// //   //                     className="custom-file-upload"
// //   //                     onClick={() =>
// //   //                       fileInputRef.current && fileInputRef.current.click()
// //   //                     }
// //   //                   >
// //   //                     Browse
// //   //                   </button>
// //   //                 </div>
// //   //               </div>
// //   //             </div>
// //   //           </div>
// //   //         </div>
// //   //       );
// //   //     default:
// //   //       return null;
// //   //   }
// //   // };

// //   const renderClaimSpecificFields = () => {
// //   switch (formData.claim_type) {
// //     // ==================== TRANSPORTATION ====================
// //     case "Transportation":
// //       return (
// //         <>
// //           <div className="sub-tabs">
// //             {["Outstation", "Intercity", "Fuel"].map((type) => (
// //               <div
// //                 key={type}
// //                 className={`sub-tab ${formData.transport_type === type ? "active" : ""}`}
// //                 onClick={() => handleTransportSubTypeChange(type)}
// //               >
// //                 {type}
// //               </div>
// //             ))}
// //           </div>

// //           {(formData.transport_type === "Intercity" || formData.transport_type === "Fuel") && (
// //             <div className="rb-radio">
// //               <label>Select no of days</label>
// //               <div className="rb-radio-options">
// //                 <label>
// //                   <input
// //                     type="radio"
// //                     name="no_of_days"
// //                     value="single"
// //                     checked={formData.no_of_days === "single"}
// //                     onChange={handleNoOfDaysChange}
// //                   />
// //                   Single
// //                 </label>
// //                 <label>
// //                   <input
// //                     type="radio"
// //                     name="no_of_days"
// //                     value="multiple"
// //                     checked={formData.no_of_days === "multiple"}
// //                     onChange={handleNoOfDaysChange}
// //                   />
// //                   Multiple
// //                 </label>
// //               </div>
// //             </div>
// //           )}

// //           {formData.transport_type && renderDateFields()}

// //           {formData.transport_type && (
// //             <div className="rb-main-form">
// //               <div className="rb-form-grid">
// //                 <div className="rb-groups">
// //                   <label>Travel From<span className="asterisk">*</span></label>
// //                   <input type="text" name="travel_from" value={formData.travel_from} onChange={handleChange} />
// //                 </div>
// //                 <div className="rb-groups">
// //                   <label>Travel To<span className="asterisk">*</span></label>
// //                   <input type="text" name="travel_to" value={formData.travel_to} onChange={handleChange} />
// //                 </div>

// //                 {formData.transport_type === "Outstation" && (
// //                   <>
// //                     <div className="rb-groups">
// //                       <label>Transport Amount</label>
// //                       <input type="number" name="transport_amount" value={formData.transport_amount} onChange={handleChange} />
// //                     </div>
// //                     <div className="rb-groups">
// //                       <label>Accommodation Fees</label>
// //                       <input type="number" name="accommodation_fees" value={formData.accommodation_fees} onChange={handleChange} />
// //                     </div>
// //                     <div className="rb-groups">
// //                       <label>DA</label>
// //                       <input type="number" name="da" value={formData.da} onChange={handleChange} />
// //                     </div>
// //                   </>
// //                 )}

// //                 <div className="rb-groups">
// //                   <label>Total Amount<span className="asterisk">*</span></label>
// //                   <input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} />
// //                 </div>
// //               </div>

// //               <div className="purpose-attachment">
// //                 <div className="pa-groups">
// //                   <label>Purpose Details / Comments<span className="asterisk">*</span></label>
// //                   <textarea name="purpose" value={formData.purpose} onChange={handleChange} />
// //                 </div>
// //                 <div className="pa-groups">
// //                   <label>Attachment</label>
// //                   <div className="attachment-wrapper">
// //                     <div className="file-links">
// //                       {selectedFiles.length > 0 ? selectedFiles.map((f, i) => <p key={i} className="file-name">{f}</p>) : <p>No files selected</p>}
// //                     </div>
// //                     <div className="attachment-upload">
// //                       <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
// //                       <button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>
// //                         Browse
// //                       </button>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           )}
// //         </>
// //       );

// //     // ==================== MEALS ====================
// //     case "Meals":
// //       return (
// //         <div className="rb-main-form">
// //           <div className="rb-form1-grid">
// //             <div className="rb-groups">
// //               <label>Date<span className="asterisk">*</span></label>
// //               <input
// //                 type="date"
// //                 name="date"
// //                 value={formData.date}
// //                 onChange={handleChange}
// //                 max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// //               />
// //             </div>
// //             <div className="rb-groups">
// //               <label>Meal Type</label>
// //               <select name="meal_type" value={formData.meal_type} onChange={handleChange}>
// //                 <option value="">Select</option>
// //                 <option value="breakfast">Breakfast</option>
// //                 <option value="lunch">Lunch</option>
// //                 <option value="dinner">Dinner</option>
// //                 <option value="Full Day">Full Day</option>
// //               </select>
// //             </div>
// //             <div className="rb-groups">
// //               <label>Meal's Objective</label>
// //               <select name="meals_objective" value={formData.meals_objective} onChange={handleChange}>
// //                 <option value="">Select</option>
// //                 <option value="client_visit">Client Visit</option>
// //                 <option value="team_outing">Team Outing</option>
// //                 <option value="extended_work">Extended Work</option>
// //                 <option value="others">Others</option>
// //               </select>
// //             </div>
// //             <div className="rb-groups">
// //               <label>Total Amount<span className="asterisk">*</span></label>
// //               <input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} />
// //             </div>
// //           </div>

// //           <div className="purpose-attachment">
// //             <div className="pa-groups">
// //               <label>Purpose Details / Comments<span className="asterisk">*</span></label>
// //               <textarea name="purpose" value={formData.purpose} onChange={handleChange} />
// //             </div>
// //             <div className="pa-groups">
// //               <label>Attachment</label>
// //               <div className="attachment-wrapper">
// //                 <div className="file-links">
// //                   {selectedFiles.length > 0 ? selectedFiles.map((f, i) => <p key={i} className="file-name">{f}</p>) : <p>No files selected</p>}
// //                 </div>
// //                 <button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>
// //                   Browse
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       );

// //     // ==================== TELECOMMUNICATION ====================
// //     case "Telecommunication":
// //       return (
// //         <div className="rb-main-form">
// //           <div className="rb-form2-grid">
// //             <div className="rb-groups">
// //               <label>Date<span className="asterisk">*</span></label>
// //               <input
// //                 type="date"
// //                 name="date"
// //                 value={formData.date}
// //                 onChange={handleChange}
// //                 max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// //               />
// //             </div>
// //             <div className="rb-groups">
// //               <label>Service Provider</label>
// //               <input type="text" name="service_provider" value={formData.service_provider} onChange={handleChange} />
// //             </div>
// //             <div className="rb-groups">
// //               <label>Total Amount<span className="asterisk">*</span></label>
// //               <input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} />
// //             </div>
// //           </div>

// //           <div className="purpose-attachment">
// //             <div className="pa-groups">
// //               <label>Purpose Details / Comments<span className="asterisk">*</span></label>
// //               <textarea name="purpose" value={formData.purpose} onChange={handleChange} />
// //             </div>
// //             <div className="pa-groups">
// //               <label>Attachment</label>
// //               <div className="attachment-wrapper">
// //                 <div className="file-links">
// //                   {selectedFiles.length > 0 ? selectedFiles.map((f, i) => <p key={i} className="file-name">{f}</p>) : <p>No files selected</p>}
// //                 </div>
// //                 <button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>
// //                   Browse
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       );

// //     // ==================== STATIONARY ====================
// //     case "Stationary":
// //       return (
// //         <div className="rb-main-form">
// //           <div className="rb-form1-grid">
// //             <div className="rb-groups">
// //               <label>Date<span className="asterisk">*</span></label>
// //               <input
// //                 type="date"
// //                 name="date"
// //                 value={formData.date}
// //                 onChange={handleChange}
// //                 max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// //               />
// //             </div>
// //             <div className="rb-groups">
// //               <label>Stationary Type</label>
// //               <select name="stationary" value={formData.stationary} onChange={handleChange}>
// //                 <option value="">Select</option>
// //                 <option value="office equipments">Office Equipments</option>
// //                 <option value="general stationary">General Stationary</option>
// //               </select>
// //             </div>
// //             <div className="rb-groups">
// //               <label>Purchasing Items</label>
// //               <input type="text" name="purchasing_item" value={formData.purchasing_item} onChange={handleChange} />
// //             </div>
// //             <div className="rb-groups">
// //               <label>Total Amount<span className="asterisk">*</span></label>
// //               <input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} />
// //             </div>
// //           </div>

// //           <div className="purpose-attachment">
// //             <div className="pa-groups">
// //               <label>Purpose Details / Comments<span className="asterisk">*</span></label>
// //               <textarea name="purpose" value={formData.purpose} onChange={handleChange} />
// //             </div>
// //             <div className="pa-groups">
// //               <label>Attachment</label>
// //               <div className="attachment-wrapper">
// //                 <div className="file-links">
// //                   {selectedFiles.length > 0 ? selectedFiles.map((f, i) => <p key={i} className="file-name">{f}</p>) : <p>No files selected</p>}
// //                 </div>
// //                 <button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>
// //                   Browse
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       );

// //     // ==================== MISCELLANEOUS ====================
// //     case "Miscellaneous":
// //       return (
// //         <div className="rb-main-form">
// //           <div className="rb-form1-grid">
// //             <div className="rb-groups">
// //               <label>Date<span className="asterisk">*</span></label>
// //               <input
// //                 type="date"
// //                 name="date"
// //                 value={formData.date}
// //                 onChange={handleChange}
// //                 max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
// //               />
// //             </div>
// //             <div className="rb-groups">
// //               <label>Total Amount<span className="asterisk">*</span></label>
// //               <input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} />
// //             </div>
// //           </div>

// //           <div className="purpose-attachment">
// //             <div className="pa-groups">
// //               <label>Purpose Details / Comments<span className="asterisk">*</span></label>
// //               <textarea name="purpose" value={formData.purpose} onChange={handleChange} />
// //             </div>
// //             <div className="pa-groups">
// //               <label>Attachment</label>
// //               <div className="attachment-wrapper">
// //                 <div className="file-links">
// //                   {selectedFiles.length > 0 ? selectedFiles.map((f, i) => <p key={i} className="file-name">{f}</p>) : <p>No files selected</p>}
// //                 </div>
// //                 <button type="button" className="custom-file-upload" onClick={() => fileInputRef.current?.click()}>
// //                   Browse
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       );

// //     default:
// //       return null;
// //   }
// // };
// //   // ------------ Render ------------
// //   return (
// //     <div className="reimbursement-container">
// //       <div className="rb-form-header">
// //         {role !== "Manager" && role !== "Admin" && (
// //           <h2>Reimbursement Requests</h2>
// //         )}
// //       </div>

// //            {/* ORIGINAL FILTER CONTAINER - DESKTOP ONLY (100% unchanged) */}
// //       <div className="filter-container">
// //         <label>Status By</label>
// //         <select
// //           value={statusFilter}
// //           onChange={(e) => setStatusFilter(e.target.value)}
// //         >
// //           <option value="pending">Pending</option>
// //           <option value="approved">Approved</option>
// //           <option value="rejected">Rejected</option>
// //         </select>

// //         <label>Date From</label>
// //         <input
// //           type="date"
// //           value={fromDate}
// //           onChange={(e) => setFromDate(e.target.value)}
// //         />

// //         <label>To</label>
// //         <input
// //           type="date"
// //           value={toDate}
// //           onChange={(e) => setToDate(e.target.value)}
// //         />

// //         <button className="search-btn" onClick={applyFilters}>
// //           <FaSearch /> Search
// //         </button>

// //         <button
// //           className="apply-btn"
// //           onClick={() => {
// //             setSubmitErrorMessage("");
// //             setUpdateErrorMessage("");
// //             setSelectedFiles([]);
// //             setShowForm(true);
// //             setEditingId(null);
// //             setFormData({
// //               employeeId,
// //               department_id: departmentId,
// //               claim_type: "",
// //               transport_type: "",
// //               fromDate: "",
// //               toDate: "",
// //               date: "",
// //               travel_from: "",
// //               travel_to: "",
// //               meals_objective: "",
// //               purpose: "",
// //               purchasing_item: "",
// //               accommodation_fees: "",
// //               no_of_days: "",
// //               total_amount: "",
// //               meal_type: "",
// //               stationary: "",
// //               service_provider: "",
// //               project: "",
// //               attachments: null,
// //             });
// //           }}
// //         >
// //           Apply Claim
// //         </button>
// //       </div>

// //       {/* NEW MOBILE-ONLY TOP BAR - Completely separate */}
// //       <div className="mobile-only-top-bar">
// //         <select
// //           value={statusFilter}
// //           onChange={(e) => setStatusFilter(e.target.value)}
// //           className="mobile-status-dropdown"
// //         >
// //           <option value="pending">Pending</option>
// //           <option value="approved">Approved</option>
// //           <option value="rejected">Rejected</option>
// //         </select>

// //         <button
// //           className="mobile-apply-claim-btn"
// //           onClick={() => {
// //             setSubmitErrorMessage("");
// //             setUpdateErrorMessage("");
// //             setSelectedFiles([]);
// //             setShowForm(true);
// //             setEditingId(null);
// //             setFormData({
// //               employeeId,
// //               department_id: departmentId,
// //               claim_type: "",
// //               transport_type: "",
// //               fromDate: "",
// //               toDate: "",
// //               date: "",
// //               travel_from: "",
// //               travel_to: "",
// //               meals_objective: "",
// //               purpose: "",
// //               purchasing_item: "",
// //               accommodation_fees: "",
// //               no_of_days: "",
// //               total_amount: "",
// //               meal_type: "",
// //               stationary: "",
// //               service_provider: "",
// //               project: "",
// //               attachments: null,
// //             });
// //           }}
// //         >
// //           + Apply Claim
// //         </button>
// //       </div>

// //       {errorMessage && <p className="rb-error-message">{errorMessage}</p>}

// //       <div className="reimbursement-table-scroll">
// //         <table className="reimbursement-table">
// //           <thead>
// //             <tr>
// //               <th>Sl No</th>
// //               <th>Claim Type</th>
// //               <th>Date</th>
// //               <th>Purpose</th>
// //               <th>Amount</th>
// //               <th>Attachment</th>
// //               <th>Status</th>
// //               <th>Comments</th>
// //               <th>Payment Status</th>
// //               <th>Action</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {filterClaims.map((claim, index) => (
// //               <tr key={claim.id}>
// //                 <td>{index + 1}</td>
// //                 <td>{claim.claim_type}</td>
// //                 <td>
// //                   {claim.date_range
// //                     ? claim.date_range
// //                         .split(" - ")
// //                         .map(formatDisplayDate)
// //                         .join(" - ")
// //                     : claim.date
// //                     ? formatDisplayDate(claim.date)
// //                     : claim.from_date && claim.to_date
// //                     ? `${formatDisplayDate(
// //                         claim.from_date
// //                       )} - ${formatDisplayDate(claim.to_date)}`
// //                     : "N/A"}
// //                 </td>
// //                 <td>
// //                   <div className="rbadmin-comments">{claim.purpose}</div>
// //                 </td>
// //                 <td>{claim.total_amount}</td>
// //                 <td>
// //                   {attachments[claim.id]?.length > 0 ? (
// //                     <button
// //                       className="attachments-btn"
// //                       onClick={() =>
// //                         handleOpenAttachments(attachments[claim.id], claim)
// //                       }
// //                     >
// //                       <MdOutlineRemoveRedEye className="eye-icon" /> View
// //                     </button>
// //                   ) : (
// //                     "Not Attached"
// //                   )}
// //                 </td>
// //                 <td>
// //                   <span
// //                     className={`rb-status-label ${
// //                       claim.status === "approved"
// //                         ? "rb-approved"
// //                         : claim.status === "rejected"
// //                         ? "rb-rejected"
// //                         : ""
// //                     }`}
// //                   >
// //                     {claim.status}
// //                   </span>
// //                 </td>
// //                 <td>
// //                   <div className="rbadmin-comments">
// //                     {claim.approver_comments || "No comments"}
// //                   </div>
// //                 </td>
// //                 <td>{claim.payment_status}</td>
// //                 <td className="actions-column">
// //                   <MdOutlineEdit
// //                     className={`edit-icon ${
// //                       claim.status && claim.status.toLowerCase() !== "pending"
// //                         ? "disabled-icon"
// //                         : ""
// //                     }`}
// //                     onClick={() => {
// //                       if (
// //                         claim.status &&
// //                         claim.status.toLowerCase() === "pending"
// //                       ) {
// //                         handleEdit(claim);
// //                         setShowForm(true);
// //                       }
// //                     }}
// //                   />
// //                   <MdDeleteOutline
// //                     className={`delete-icon ${
// //                       claim.status && claim.status.toLowerCase() !== "pending"
// //                         ? "disabled-icon"
// //                         : ""
// //                     }`}
// //                     onClick={() => {
// //                       if (
// //                         claim.status &&
// //                         claim.status.toLowerCase() === "pending"
// //                       )
// //                         deleteReimbursement(claim.id);
// //                     }}
// //                   />
// //                 </td>
// //               </tr>
// //             ))}
// //           </tbody>
// //           <tfoot>
// //             <tr className="total-row">
// //               <td
// //                 colSpan="4"
// //                 style={{
// //                   textAlign: "right",
// //                   color: "#949494",
// //                   fontWeight: "bold",
// //                 }}
// //               >
// //                 Total Amount Claiming:{" "}
// //                 <span style={{ fontWeight: "bold", color: "black" }}>
// //                   Rs {totalAmount}
// //                 </span>
// //               </td>
// //               <td colSpan="3" style={{ textAlign: "right" }}>
// //                 Amount Approved: Rs{" "}
// //                 <span style={{ fontWeight: "bold" }}>{approvedAmount}</span>
// //               </td>
// //               <td colSpan="3" style={{ textAlign: "right" }}>
// //                 Amount Rejected: Rs{" "}
// //                 <span style={{ fontWeight: "bold" }}>{rejectedAmount}</span>
// //               </td>
// //             </tr>
// //           </tfoot>
// //         </table>

// //         {/* Mobile cards */}
// //         {/* Mobile cards */}
// //       {/* ULTRA CLEAN FLAT LIST - BANKING APP STYLE (NO CARDS, NO DOTS) */}
// //              {/* ==================== MOBILE-ONLY FLAT LIST ==================== */}
// //         <div className="rb-mobile-only">
// //           <div className="rb-flat-mobile">
// //             {filterClaims.length === 0 ? (
// //               <div className="rb-no-records">No reimbursement claims found</div>
// //             ) : (
// //               filterClaims.map((claim, index) => (
// //                 <div
// //                   key={claim.id}
// //                   className="rb-flat-row"
// //                   onClick={() => claim.status?.toLowerCase() === "pending" && handleEdit(claim)}
// //                 >
// //                   <div className="rb-flat-left">
// //                     <div className="rb-flat-header">
// //                       <span className="rb-claim-type">
// //                         {claim.claim_type === "Transportation" && (
// //                           <MdEmojiTransportation className="mobile-claim-icon" />
// //                         )}
// //                         {claim.claim_type === "Meals" && (
// //                           <GiKnifeFork className="mobile-claim-icon" />
// //                         )}
// //                         {claim.claim_type === "Telecommunication" && (
// //                           <MdOutlinePhoneAndroid className="mobile-claim-icon" />
// //                         )}
// //                         {claim.claim_type === "Stationary" && (
// //                           <GiPencilBrush className="mobile-claim-icon" />
// //                         )}
// //                         {claim.claim_type === "Miscellaneous" && (
// //                           <TbTriangleSquareCircle className="mobile-claim-icon" />
// //                         )}
// //                         {claim.claim_type}
// //                       </span>{' '}
// //                       <span className={`rb-status-tag ${claim.status?.toLowerCase()}`}>
// //                         {claim.status || "Pending"}
// //                       </span>
// //                     </div>
// //                     <div className="rb-flat-date">
// //                       {claim.date
// //                         ? formatDisplayDate(claim.date)
// //                         : claim.date_range
// //                         ? claim.date_range.split(" - ").map(formatDisplayDate).join(" to ")
// //                         : claim.from_date && claim.to_date
// //                         ? `${formatDisplayDate(claim.from_date)} to ${formatDisplayDate(claim.to_date)}`
// //                         : "N/A"}
// //                     </div>
// //                   </div>
// //                   <div className="rb-flat-right">
// //                     <div className="rb-flat-amount">₹{claim.total_amount}</div>
// //                     <div className="rb-flat-icons">
// //                       {attachments[claim.id]?.length > 0 && (
// //                         <MdOutlineRemoveRedEye
// //                           className="icon view"
// //                           onClick={(e) => {
// //                             e.stopPropagation();
// //                             handleOpenAttachments(attachments[claim.id], claim);
// //                           }}
// //                         />
// //                       )}
// //                       {claim.status?.toLowerCase() === "pending" && (
// //                         <>
// //                           <MdOutlineEdit
// //                             className="icon edit"
// //                             onClick={(e) => {
// //                               e.stopPropagation();
// //                               handleEdit(claim);
// //                             }}
// //                           />
// //                           <MdDeleteOutline
// //                             className="icon delete"
// //                             onClick={(e) => {
// //                               e.stopPropagation();
// //                               deleteReimbursement(claim.id);
// //                             }}
// //                           />
// //                         </>
// //                       )}
// //                     </div>
// //                   </div>
// //                 </div>
// //               ))
// //             )}
// //           </div>
// //         </div>

// //         {/* ==================== DESKTOP-ONLY TABLE ==================== */}
// //         <div className="rb-desktop-only">
// //           <table className="reimbursement-table">
// //             {/* ... your existing <thead>, <tbody>, <tfoot> ... */}
// //             {/* (keep everything exactly as it was) */}
// //           </table>
// //         </div>

// //       {/* Clean Fixed Bottom Bar */}
// //       <div className="rb-bottom-bar">
// //         <div>Total <strong>₹{totalAmount}</strong></div>
// //         <div>Approved <strong>₹{approvedAmount}</strong></div>
// //         <div>Rejected <strong>₹{rejectedAmount}</strong></div>
// //       </div>
             
// //       </div>

// //       {/* Form modal */}
// //            {/* ====================== FORM MODAL - Desktop vs Mobile ====================== */}
// //            {/* ====================== FORM MODAL - Desktop (unchanged) + Mobile (step-by-step) ====================== */}
// //       {showForm && (
// //         <>
// //           {/* =============== DESKTOP: ORIGINAL FULL FORM (unchanged) =============== */}
// //           <div className="rb-modal desktop-form-only">
// //             <div className="rb-modal-content">
// //               <div className="claim-form-header">
// //                 <h2 className="claim-form-title">
// //                   {editingId ? "Edit Reimbursement" : "New Reimbursement"}
// //                 </h2>
// //                 <MdOutlineCancel
// //                   className="claim-form-close"
// //                   onClick={() => {
// //                     setShowForm(false);
// //                     setMobileStep(1);
// //                     setMobileFormData({ project: "", claim_type: "", transport_type: "" });
// //                   }}
// //                 />
// //               </div>

// //               {submitErrorMessage && <p className="rb-error-message">{submitErrorMessage}</p>}
// //               {updateErrorMessage && <p className="rb-error-message">{updateErrorMessage}</p>}

// //               <form onSubmit={handleSubmit} className="reimbursement-form">
// //                 {/* YOUR FULL ORIGINAL FORM - UNCHANGED */}
// //                 <div className="claim-type">
// //                   <label>Project<span className="asterisk">*</span></label>
// //                   <select name="project" value={formData.project} onChange={handleChange} required>
// //                     <option value="">Select project</option>
// //                     <option value="Company Claim">Company Claim</option>
// //                     {projects.map((proj, i) => (
// //                       <option key={i} value={proj}>{proj}</option>
// //                     ))}
// //                   </select>

// //                   <div className="rb-tabs">
// //                     {claimTypes.map(({ icon, label }) => (
// //                       <div
// //                         key={label}
// //                         className={`rb-tab ${formData.claim_type === label ? "active" : ""}`}
// //                         onClick={() => setFormData(prev => ({ ...prev, claim_type: label }))}
// //                       >
// //                         {icon} {label}
// //                       </div>
// //                     ))}
// //                   </div>
// //                 </div>

// //                 {renderClaimSpecificFields()}

// //                 <div className="reimbursement-form-button">
// //                   <button type="button" className="rb-close" onClick={() => setShowForm(false)}>
// //                     Cancel
// //                   </button>
// //                   <button type="submit" className="rb-submit">
// //                     {editingId ? "Update" : "Submit"}
// //                   </button>
// //                 </div>
// //               </form>
// //             </div>
// //           </div>

// //           {/* =============== MOBILE ONLY: STEP-BY-STEP FORM (perfect mobile UX) =============== */}
// //           <div className="mbf-stepper-container">
// //             <div className="mbf-header">
// //               <button
// //                 className="mbf-back"
// //                 onClick={() => mobileStep > 1 ? setMobileStep(mobileStep - 1) : setShowForm(false)}
// //               >
// //                 Back
// //               </button>
// //               <h2>
// //                 {mobileStep === 1 && "Project"}
// //                 {mobileStep === 2 && "Claim Type"}
// //                 {mobileStep === 3 && "Transport"}
// //                 {mobileStep === 4 && "Details"}
// //               </h2>
// //               <button
// //                 className="mbf-close"
// //                 onClick={() => {
// //                   setShowForm(false);
// //                   setMobileStep(1);
// //                   setMobileFormData({ project: "", claim_type: "", transport_type: "" });
// //                 }}
// //               >
// //                 Close
// //               </button>
// //             </div>

// //             <div className="mbf-body">
// //               {/* Step 1: Project */}
// //               {mobileStep === 1 && (
// //                 <div className="mbf-center">
// //                   <select
// //                     className="mbf-select"
// //                     value={mobileFormData.project}
// //                     onChange={(e) => {
// //                       const val = e.target.value;
// //                       setMobileFormData(prev => ({ ...prev, project: val }));
// //                       setFormData(prev => ({ ...prev, project: val }));
// //                       setMobileStep(2);
// //                     }}
// //                   >
// //                     <option value="">Choose Project</option>
// //                     <option value="Company Claim">Company Claim</option>
// //                     {projects.map((p, i) => (
// //                       <option key={i} value={p}>{p}</option>
// //                     ))}
// //                   </select>
// //                 </div>
// //               )}

// //               {/* Step 2: Claim Type */}
// //               {mobileStep === 2 && (
// //                 <div className="mbf-grid">
// //                   {claimTypes.map(({ icon, label }) => (
// //                     <div
// //                       key={label}
// //                       className={`mbf-card ${mobileFormData.claim_type === label ? "mbf-selected" : ""}`}
// //                       onClick={() => {
// //                         setMobileFormData(prev => ({ ...prev, claim_type: label }));
// //                         setFormData(prev => ({ ...prev, claim_type: label }));
// //                         label === "Transportation" ? setMobileStep(3) : setMobileStep(4);
// //                       }}
// //                     >
// //                       {icon}
// //                       <span>{label}</span>
// //                     </div>
// //                   ))}
// //                 </div>
// //               )}

// //               {/* Step 3: Transport Type */}
// //               {mobileStep === 3 && (
// //                 <div className="mbf-column">
// //                   {["Outstation", "Intercity", "Fuel"].map(type => (
// //                     <div
// //                       key={type}
// //                       className={`mbf-card ${mobileFormData.transport_type === type ? "mbf-selected" : ""}`}
// //                       onClick={() => {
// //                         setMobileFormData(prev => ({ ...prev, transport_type: type }));
// //                         setFormData(prev => ({ ...prev, transport_type: type }));
// //                         setMobileStep(4);
// //                       }}
// //                     >
// //                       {type}
// //                     </div>
// //                   ))}
// //                 </div>
// //               )}

// //               {/* Step 4: Final Form - ONE FIELD PER LINE, CENTERED */}
// //               {mobileStep === 4 && (
// //                 <div className="mbf-final-form">
// //                   <div className="mbf-form-fields">
// //                     {/* Render each field one by one */}
// //                     {renderClaimSpecificFields()}
// //                   </div>

// //                   <div className="mbf-submit-bar">
// //                     <button
// //                       type="button"
// //                       className="mbf-cancel"
// //                       onClick={() => setShowForm(false)}
// //                     >
// //                       Cancel
// //                     </button>
// //                     <button
// //                       className="mbf-submit"
// //                       onClick={handleSubmit}
// //                     >
// //                       {editingId ? "Update" : "Submit"} Claim
// //                     </button>
// //                   </div>
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         </>
// //       )}
// //       {/* Attachments modal */}
// //       {isModalOpen && (
// //         <div className="att-modal-overlay">
// //           <div className="att-modal-content">
// //             <div className="att-header">
// //               <h2>Attachments</h2>
// //               <MdOutlineCancel
// //                 className="att-close"
// //                 onClick={() => setIsModalOpen(false)}
// //               />
// //             </div>
// //             <h4 className="att-files">
// //               {selectedClaim?.claim_type
// //                 ? `${selectedClaim.claim_type} Bills`
// //                 : "Bills"}
// //             </h4>
// //             {selectedFiles.length > 0 ? (
// //               selectedFiles.map((file, idx) => (
// //                 <div className="att-files" key={idx}>
// //                   <a href={file.url} target="_blank" rel="noopener noreferrer">
// //                     {file.name}
// //                   </a>
// //                 </div>
// //               ))
// //             ) : (
// //               <p>No attachments available</p>
// //             )}
// //             <button
// //               className="att-close-btn"
// //               onClick={() => setIsModalOpen(false)}
// //             >
// //               Close
// //             </button>
// //           </div>
// //         </div>
// //       )}

// //       <Modal
// //         isVisible={confirmModal.isVisible}
// //         onClose={closeConfirm}
// //         buttons={[
// //           { label: "Cancel", onClick: closeConfirm },
// //           { label: "Confirm", onClick: confirmModal.onConfirm },
// //         ]}
// //       >
// //         <p>{confirmModal.message}</p>
// //       </Modal>

// //       <Modal
// //         isVisible={alertModal.isVisible}
// //         onClose={closeAlert}
// //         buttons={[{ label: "OK", onClick: closeAlert }]}
// //       >
// //         <p>{alertModal.message}</p>
// //       </Modal>
// //     </div>
// //   );
// // };

// // export default Reimbursement;

// "use client";

// import React, { useState, useEffect, useCallback, useRef } from "react";
// import axios from "axios";
// import { FaSearch } from "react-icons/fa";
// import {
//   MdOutlineEdit,
//   MdDeleteOutline,
//   MdOutlineCancel,
//   MdEmojiTransportation,
//   MdOutlinePhoneAndroid,
//   MdOutlineRemoveRedEye,
// } from "react-icons/md";
// import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
// import { TbTriangleSquareCircle } from "react-icons/tb";
// import "./Reimbursement.css";
// import Modal from "../Modal/Modal.client";
// import { useAuth } from "../../context/AuthProvider.client";

// const claimTypes = [
//   {
//     icon: <MdEmojiTransportation className="claim-icons" />,
//     label: "Transportation",
//   },
//   { icon: <GiKnifeFork className="claim-icons" />, label: "Meals" },
//   {
//     icon: <MdOutlinePhoneAndroid className="claim-icons" />,
//     label: "Telecommunication",
//   },
//   { icon: <GiPencilBrush className="claim-icons" />, label: "Stationary" },
//   {
//     icon: <TbTriangleSquareCircle className="claim-icons" />,
//     label: "Miscellaneous",
//   },
// ];

// const Reimbursement = () => {
//   const { user } = useAuth();
//   const orgId = user?.orgId || user?.org_id || null;
//   const role = user?.role || " ";
//   const authToken = user?.token;
//   const employeeId = user?.employeeId;
//   const departmentId = user?.department_id;

//   const [reimbursements, setReimbursements] = useState([]);
//   const [filteredReimbursements, setFilteredReimbursements] = useState([]);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [showForm, setShowForm] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [transportType, setTransportType] = useState("");
//   const [noOfDaysType, setNoOfDaysType] = useState("");
//   const [attachments, setAttachments] = useState({});
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const [selectedClaim, setSelectedClaim] = useState(null);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [updateErrorMessage, setUpdateErrorMessage] = useState("");
//   const [submitErrorMessage, setSubmitErrorMessage] = useState("");
//   const [projects, setProjects] = useState([]);
//   const [statusFilter, setStatusFilter] = useState("pending");
//   const [selectedSubType, setSelectedSubType] = useState("");

//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const fileInputRef = useRef(null);

//   const [formData, setFormData] = useState({
//     employeeId: employeeId,
//     department_id: departmentId,
//     claim_type: "",
//     transport_type: "",
//     transport_amount: "",
//     da: "",
//     fromDate: "",
//     toDate: "",
//     date: "",
//     travel_from: "",
//     travel_to: "",
//     meals_objective: "",
//     purpose: "",
//     purchasing_item: "",
//     accommodation_fees: "",
//     no_of_days: "",
//     total_amount: "",
//     meal_type: "",
//     stationary: "",
//     service_provider: "",
//     project: "",
//     attachments: null,
//   });

//   // mobile detection
//   const [isMobile, setIsMobile] = useState(
//     typeof window !== "undefined" ? window.innerWidth <= 768 : false
//   );

//   useEffect(() => {
//     const onResize = () => setIsMobile(window.innerWidth <= 768);
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, []);

//   // stepper state for mobile flow
//   const [mobileStep, setMobileStep] = useState(1);

//   const formatDisplayDate = (raw) => {
//     if (!raw) return "N/A";
//     const d = raw instanceof Date ? raw : new Date(raw);
//     if (isNaN(d)) return raw;
//     const day = String(d.getDate()).padStart(2, "0");
//     const month = d.toLocaleString("en-GB", { month: "short" });
//     const year = d.getFullYear();
//     return `${day}-${month}-${year}`;
//   };

//   const [confirmModal, setConfirmModal] = useState({
//     isVisible: false,
//     message: "",
//     onConfirm: null,
//   });
//   const showConfirm = (message, onConfirm) =>
//     setConfirmModal({ isVisible: true, message, onConfirm });
//   const closeConfirm = () =>
//     setConfirmModal({ isVisible: false, message: "", onConfirm: null });

//   const [alertModal, setAlertModal] = useState({
//     isVisible: false,
//     title: "",
//     message: "",
//   });
//   const showAlert = (message, title = "") =>
//     setAlertModal({ isVisible: true, title, message });
//   const closeAlert = () =>
//     setAlertModal({ isVisible: false, title: "", message: "" });

//   const fetchReimbursements = useCallback(async () => {
//     try {
//       const response = await axios.get(
//         `${BACKEND_URL}/reimbursement/${employeeId}`,
//         {
//           headers: {
//             "x-api-key": API_KEY,
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${authToken}`,
//             "x-org-id": orgId,
//           },
//         }
//       );

//       const reimbursementsData = Array.isArray(response.data)
//         ? response.data
//         : response.data || [];
//       setReimbursements(reimbursementsData);

//       const attachmentsData = {};
//       await Promise.all(
//         reimbursementsData.map(async (claim) => {
//           try {
//             const claimId = claim.id;
//             const attachmentResponse = await axios.get(
//               `${BACKEND_URL}/reimbursement/${claimId}/attachments`,
//               {
//                 headers: {
//                   "x-api-key": API_KEY,
//                   Authorization: `Bearer ${authToken}`,
//                   "x-org-id": orgId,
//                 },
//               }
//             );

//             attachmentsData[claimId] = (
//               attachmentResponse.data.attachments || []
//             ).map((file) => {
//               const pathParts = (file.file_path || "").split("/").filter(Boolean);
//               let orgSeg = "";
//               let year = "";
//               let month = "";
//               let empId = claim.employee_id || claim.employeeId || "";
//               const idx = pathParts.findIndex((p) => p === "reimbursement");
//               if (idx !== -1 && pathParts.length >= idx + 5) {
//                 orgSeg = pathParts[idx + 1];
//                 year = pathParts[idx + 2];
//                 month = pathParts[idx + 3];
//                 empId = pathParts[idx + 4] || empId;
//               } else {
//                 year = pathParts[pathParts.length - 4] || "";
//                 month = pathParts[pathParts.length - 3] || "";
//                 empId =
//                   pathParts[pathParts.length - 2] ||
//                   claim.employee_id ||
//                   claim.employeeId ||
//                   empId;
//               }
//               return {
//                 ...file,
//                 orgId: orgSeg,
//                 year,
//                 month,
//                 employeeId: empId,
//               };
//             });
//           } catch (err) {
//             console.error(
//               `Error fetching attachments for claim ${claim.id}`,
//               err
//             );
//             attachmentsData[claim.id] = [];
//           }
//         })
//       );

//       setAttachments(attachmentsData);
//     } catch (error) {
//       console.error("Error fetching reimbursements:", error);
//       setErrorMessage(
//         error?.response?.data?.message ||
//           "We ran into a problem fetching reimbursements."
//       );
//       showAlert(
//         error?.response?.data?.message || "Error fetching reimbursements."
//       );
//     }
//   }, [employeeId, authToken, orgId]);

//   const fetchProjects = useCallback(async () => {
//     try {
//       const res = await axios.get(`${BACKEND_URL}/projectdrop`, {
//         headers: { "x-api-key": API_KEY, "x-org-id": orgId },
//       });
//       setProjects(res.data || []);
//     } catch (err) {
//       console.error("Error fetching projects:", err);
//     }
//   }, [orgId]);

//   useEffect(() => {
//     if (!employeeId) return;
//     fetchReimbursements();
//     fetchProjects();
//   }, [fetchReimbursements, fetchProjects, employeeId]);

//   const tryParseDate = (s) => {
//     if (!s && s !== 0) return null;
//     if (s instanceof Date && !isNaN(s)) return s;
//     if (typeof s === "number") {
//       const d = new Date(s);
//       return isNaN(d) ? null : d;
//     }
//     let str = String(s).trim();
//     if (!str) return null;
//     str = str.replace(/\s+to\s+/i, " - ");
//     str = str.replace(/\u2013|\u2014/g, " - ");
//     str = str.replace(/\//g, "-");
//     let d = new Date(str);
//     if (!isNaN(d)) return d;
//     if (str.includes("T")) {
//       const [dateOnly] = str.split("T");
//       d = new Date(dateOnly);
//       if (!isNaN(d)) return d;
//     }
//     const ddmmyyyy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
//     if (ddmmyyyy) {
//       const [, dd, mm, yyyy] = ddmmyyyy;
//       d = new Date(`${yyyy}-${mm}-${dd}`);
//       if (!isNaN(d)) return d;
//     }
//     return null;
//   };

//   const normalizeStartOfDay = (date) =>
//     new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
//   const normalizeEndOfDay = (date) =>
//     new Date(
//       date.getFullYear(),
//       date.getMonth(),
//       date.getDate(),
//       23,
//       59,
//       59,
//       999
//     );

//   const parseClaimRange = (claim) => {
//     let start = null;
//     let end = null;

//     if (
//       claim.date_range &&
//       typeof claim.date_range === "string" &&
//       (claim.date_range.includes(" - ") ||
//         claim.date_range.toLowerCase().includes(" to ") ||
//         claim.date_range.includes("–") ||
//         claim.date_range.includes("—"))
//     ) {
//       const unified = claim.date_range
//         .replace(/\s+to\s+/gi, " - ")
//         .replace(/\u2013|\u2014/g, " - ");
//       const parts = unified.split(" - ").map((p) => p.trim());
//       if (parts.length >= 2) {
//         const p0 = tryParseDate(parts[0]);
//         const p1 = tryParseDate(parts[1]);
//         start = p0 || null;
//         end = p1 || null;
//       }
//     }

//     if (!start && (claim.from_date || claim.fromDate)) {
//       start = tryParseDate(claim.from_date || claim.fromDate);
//     }
//     if (!end && (claim.to_date || claim.toDate)) {
//       end = tryParseDate(claim.to_date || claim.toDate);
//     }

//     if (!start && claim.date) {
//       start = tryParseDate(claim.date);
//       end = start;
//     }

//     if (!start && claim.created_at) {
//       const t = tryParseDate(claim.created_at);
//       start = t;
//       end = t;
//     }

//     if (start && !end) end = start;

//     if (start && end) {
//       start = normalizeStartOfDay(start);
//       end = normalizeEndOfDay(end);
//     }
//     return { start, end };
//   };

//   const applyFilters = useCallback(() => {
//     const fRaw = fromDate ? tryParseDate(fromDate) : null;
//     const tRaw = toDate ? tryParseDate(toDate) : null;
//     const fStart = fRaw ? normalizeStartOfDay(fRaw) : null;
//     const tEnd = tRaw ? normalizeEndOfDay(tRaw) : null;

//     const filtered = reimbursements.filter((claim) => {
//       if (
//         statusFilter &&
//         claim.status &&
//         claim.status.toLowerCase() !== statusFilter.toLowerCase()
//       ) {
//         return false;
//       }

//       if (!fStart && !tEnd) return true;

//       const { start, end } = parseClaimRange(claim);

//       if (!start || !end) {
//         return !fStart && !tEnd;
//       }

//       if (fStart && !tEnd) {
//         return end.getTime() >= fStart.getTime();
//       }
//       if (!fStart && tEnd) {
//         return start.getTime() <= tEnd.getTime();
//       }
//       if (fStart && tEnd) {
//         if (end.getTime() < fStart.getTime()) return false;
//         if (start.getTime() > tEnd.getTime()) return false;
//         return true;
//       }

//       return true;
//     });

//     setFilteredReimbursements(filtered);
//   }, [reimbursements, fromDate, toDate, statusFilter]);

//   useEffect(() => {
//     applyFilters();
//   }, [reimbursements, fromDate, toDate, statusFilter, applyFilters]);

//   const handleChange = (e) =>
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

//   const handleClaimTypeChange = (e) => {
//     const value = e.target.value || (e.target && e.target.value) || e;
//     setFormData((prev) => ({ ...prev, claim_type: value }));
//     setSelectedFiles([]);
//     setSelectedClaim(null);
//     setSelectedSubType("");
//   };

//   const handleTransportSubTypeChange = (type) => {
//     setFormData((prev) => ({ ...prev, transport_type: type }));
//     setSelectedSubType(type);
//     if (type === "Outstation") {
//       setFormData((prev) => ({ ...prev, no_of_days: "" }));
//     }
//   };

//   const handleNoOfDaysChange = (event) =>
//     setFormData((prev) => ({ ...prev, no_of_days: event.target.value }));

//   const handleFileUpload = (e) => {
//     const files = Array.from(e.target.files || []);
//     setSelectedFiles(files.map((file) => file.name));
//     setFormData((prev) => ({ ...prev, attachments: files }));
//   };

//   const renderDateFields = () => {
//     if (formData.transport_type === "Outstation") {
//       return (
//         <>
//           <div className="rb-groups">
//             <label>
//               From Date<span className="asterisk">*</span>
//             </label>
//             <input
//               type="date"
//               name="fromDate"
//               value={formData.fromDate}
//               onChange={handleChange}
//               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
//             />
//           </div>
//           <div className="rb-groups">
//             <label>
//               To Date<span className="asterisk">*</span>
//             </label>
//             <input
//               type="date"
//               name="toDate"
//               value={formData.toDate}
//               onChange={handleChange}
//               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
//             />
//           </div>
//         </>
//       );
//     } else if (formData.no_of_days === "single") {
//       return (
//         <div className="rb-groups">
//           <label>
//             Date<span className="asterisk">*</span>
//           </label>
//           <input
//             type="date"
//             name="date"
//             value={formData.date}
//             onChange={handleChange}
//             max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
//           />
//         </div>
//       );
//     } else if (formData.no_of_days === "multiple") {
//       return (
//         <>
//           <div className="rb-groups">
//             <label>
//               From Date<span className="asterisk">*</span>
//             </label>
//             <input
//               type="date"
//               name="fromDate"
//               value={formData.fromDate}
//               onChange={handleChange}
//               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
//             />
//           </div>
//           <div className="rb-groups">
//             <label>
//               To Date<span className="asterisk">*</span>
//             </label>
//             <input
//               type="date"
//               name="toDate"
//               value={formData.toDate}
//               onChange={handleChange}
//               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
//             />
//           </div>
//         </>
//       );
//     }
//     return null;
//   };

//   const handleEdit = (claim) => {
//     setEditingId(claim.id);
//     setShowForm(true);
//     const existingAttachments = attachments[claim.id] || [];
//     setFormData({
//       employeeId: claim.employeeId || claim.employee_id || employeeId,
//       department_id: claim.department_id || departmentId,
//       claim_type: claim.claim_type || "",
//       transport_type: claim.transport_type || "",
//       fromDate: claim.from_date
//         ? claim.from_date.substring(0, 10)
//         : claim.fromDate || "",
//       toDate: claim.to_date
//         ? claim.to_date.substring(0, 10)
//         : claim.toDate || "",
//       date: claim.date ? claim.date.substring(0, 10) : claim.date || "",
//       travel_from: claim.travel_from || "",
//       travel_to: claim.travel_to || "",
//       meals_objective: claim.meals_objective || "",
//       purpose: claim.purpose || "",
//       purchasing_item: claim.purchasing_item || "",
//       accommodation_fees: claim.accommodation_fees || "",
//       transport_amount: claim.transport_amount || "",
//       da: claim.da || "",
//       no_of_days: claim.no_of_days || "",
//       total_amount: claim.total_amount || "",
//       meal_type: claim.meal_type || "",
//       stationary: claim.stationary || "",
//       comments: claim.comments || "",
//       service_provider: claim.service_provider || "",
//       project: claim.project || "",
//       attachments: existingAttachments,
//     });
//     setSelectedFiles(
//       existingAttachments.map((file) => file.file_name || file.name)
//     );
//     setSelectedSubType(claim.transport_type || "");
//   };

//   const handleSubmit = async (e) => {
//     if (e && e.preventDefault) e.preventDefault();
//     setSubmitErrorMessage("");
//     const wordCount = formData.purpose
//       ? formData.purpose.trim().split(/\s+/).filter(Boolean).length
//       : 0;
//     if (wordCount < 10) {
//       showAlert(
//         `Purpose Details / Comments must be at least 10 words. You have ${wordCount}.`
//       );
//       return;
//     }
//     try {
//       const fd = new FormData();
//       Object.keys(formData).forEach((k) => {
//         if (k === "attachments") return; // handled separately
//         const val = formData[k];
//         if (val !== null && val !== undefined) fd.append(k, val);
//       });

//       // append role + orgId
//       fd.append("role", role);
//       if (orgId) fd.append("orgId", orgId);

//       if (formData.attachments && formData.attachments.length > 0) {
//         formData.attachments.forEach((file) => {
//           if (file instanceof File) {
//             fd.append("attachments", file);
//           }
//         });
//       }
//       const config = {
//         headers: {
//           "x-api-key": API_KEY,
//           "Content-Type": "multipart/form-data",
//           Authorization: `Bearer ${authToken}`,
//           "x-org-id": orgId,
//         },
//       };
//       let response;
//       if (editingId) {
//         response = await axios.put(
//           `${BACKEND_URL}/reimbursement/${editingId}`,
//           fd,
//           config
//         );
//       } else {
//         response = await axios.post(`${BACKEND_URL}/reimbursement`, fd, config);
//       }
//       showAlert(
//         response?.data?.message || "Reimbursement submitted successfully!"
//       );
//       // reset form
//       setFormData({
//         employeeId: employeeId,
//         department_id: departmentId,
//         claim_type: "",
//         transport_type: "",
//         fromDate: "",
//         toDate: "",
//         date: "",
//         travel_from: "",
//         travel_to: "",
//         meals_objective: "",
//         purpose: "",
//         purchasing_item: "",
//         accommodation_fees: "",
//         no_of_days: "",
//         total_amount: "",
//         meal_type: "",
//         stationary: "",
//         service_provider: "",
//         project: "",
//         attachments: null,
//       });
//       setShowForm(false);
//       setEditingId(null);
//       setSelectedFiles([]);
//       setMobileStep(1);
//       fetchReimbursements();
//     } catch (error) {
//       console.error("Error submitting reimbursement:", error);
//       const msg =
//         error?.response?.data?.error ||
//         error?.response?.data?.message ||
//         "An unexpected error occurred.";
//       setSubmitErrorMessage(msg);
//       showAlert(msg);
//     }
//   };

//   const updateReimbursement = async (reimbursementId, updateData) => {
//     try {
//       const response = await axios.put(
//         `${BACKEND_URL}/reimbursement/${reimbursementId}`,
//         updateData,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": API_KEY,
//             "x-org-id": orgId,
//             Authorization: `Bearer ${authToken}`,
//           },
//         }
//       );

//       fetchReimbursements();
//       return response.data;
//     } catch (error) {
//       console.error("Error updating reimbursement:", error);
//       const msg =
//         error?.response?.data?.message ||
//         error.message ||
//         "An unexpected error occurred.";
//       setUpdateErrorMessage(msg);
//       showAlert(msg);
//       throw error;
//     }
//   };

//   const deleteReimbursement = async (id) => {
//     if (!id) {
//       console.error("Error: Reimbursement ID is missing.");
//       return;
//     }
//     showConfirm(
//       "Are you sure you want to delete this reimbursement claim?",
//       async () => {
//         try {
//           const response = await axios.delete(
//             `${BACKEND_URL}/reimbursement/${id}`,
//             {
//               headers: {
//                 "x-api-key": API_KEY,
//                 "x-org-id": orgId,
//                 Authorization: `Bearer ${authToken}`,
//               },
//             }
//           );
//           showAlert(
//             response.data.message || "Reimbursement deleted successfully!"
//           );
//           fetchReimbursements();
//         } catch (error) {
//           console.error("Error deleting reimbursement:", error);
//           showAlert("There was an issue deleting the reimbursement.");
//         } finally {
//           closeConfirm();
//         }
//       }
//     );
//   };

//   const handleOpenAttachments = async (files, claim) => {
//     try {
//       const fetchedFiles = await Promise.all(
//         (files || []).map(async (file) => {
//           if (!file?.file_name && !file?.file_name) return null;
//           const fname = file.file_name || file.fileName || file.name;
//           const match = fname.match(/^(\d{4})-(\d{2})/);
//           if (!match) return null;
//           const [, year, month] = match;

//           let fileOrg = file.orgId || "";
//           if (!fileOrg && file.file_path) {
//             const parts = (file.file_path || "").split("/").filter(Boolean);
//             const idx = parts.findIndex((p) => p === "reimbursement");
//             if (idx !== -1 && parts.length >= idx + 5) {
//               fileOrg = parts[idx + 1];
//             } else if (parts.length >= 5) {
//               fileOrg = parts[parts.length - 5] || "";
//             }
//           }
//           if (!fileOrg) fileOrg = orgId || "";

//           const empId = claim.employee_id || claim.employeeId || "";
//           const url = `${BACKEND_URL}/reimbursement/${fileOrg}/${year}/${month}/${empId}/${fname}`;

//           const response = await axios.get(url, {
//             headers: {
//               "x-api-key": API_KEY,
//               Authorization: `Bearer ${authToken}`,
//               "x-org-id": fileOrg || orgId,
//               "x-employee-id": employeeId,
//             },
//             responseType: "blob",
//           });

//           return {
//             name: fname,
//             url: URL.createObjectURL(
//               new Blob([response.data], {
//                 type: response.headers["content-type"],
//               })
//             ),
//           };
//         })
//       );
//       const validFiles = fetchedFiles.filter(Boolean);
//       if (!validFiles.length)
//         return showAlert("No valid attachments could be loaded.");
//       setSelectedFiles(validFiles);
//       setSelectedClaim(claim);
//       setIsModalOpen(true);
//     } catch (error) {
//       console.error("Error fetching attachments:", error);
//       showAlert("Could not load attachments. Please try again.");
//     }
//   };

//   // Use filteredReimbursements (NOT reimbursements) for display and totals
//   const filterClaims = filteredReimbursements || [];

//   const totalAmount = (filteredReimbursements || []).reduce((sum, claim) => {
//     const val = parseFloat(claim.total_amount);
//     return sum + (isNaN(val) ? 0 : val);
//   }, 0);
//   const approvedAmount = (filteredReimbursements || [])
//     .filter((c) => (c.status || "").toLowerCase() === "approved")
//     .reduce((sum, claim) => {
//       const val = parseFloat(claim.total_amount);
//       return sum + (isNaN(val) ? 0 : val);
//     }, 0);
//   const rejectedAmount = (filteredReimbursements || [])
//     .filter((c) => (c.status || "").toLowerCase() === "rejected")
//     .reduce((sum, claim) => {
//       const val = parseFloat(claim.total_amount);
//       return sum + (isNaN(val) ? 0 : val);
//     }, 0);

//   const renderClaimSpecificFields = (compact = false) => {
//     // compact indicates mobile single-step preference (stacked)
//     switch (formData.claim_type) {
//       case "Transportation":
//         return (
//           <>
//             <div className={`sub-tabs ${compact ? "mobile-subtabs" : ""}`}>
//               {["Outstation", "Intercity", "Fuel"].map((type) => (
//                 <div
//                   key={type}
//                   className={`sub-tab ${
//                     formData.transport_type === type ? "active" : ""
//                   }`}
//                   onClick={() => handleTransportSubTypeChange(type)}
//                 >
//                   {type}
//                 </div>
//               ))}
//             </div>

//             {(formData.transport_type === "Intercity" ||
//               formData.transport_type === "Fuel") && (
//               <div className="rb-radio">
//                 <label>Select no of days</label>
//                 <div className="rb-radio-options">
//                   <label>
//                     <input
//                       type="radio"
//                       name="no_of_days"
//                       value="single"
//                       checked={formData.no_of_days === "single"}
//                       onChange={handleNoOfDaysChange}
//                     />
//                     Single
//                   </label>

//                   <label>
//                     <input
//                       type="radio"
//                       name="no_of_days"
//                       value="multiple"
//                       checked={formData.no_of_days === "multiple"}
//                       onChange={handleNoOfDaysChange}
//                     />
//                     Multiple
//                   </label>
//                 </div>
//               </div>
//             )}

//             {formData.transport_type && (
//               <div className="rb-main-form">
//                 <div className={`rb-form-grid ${compact ? "stacked-grid" : ""}`}>
//                   {renderDateFields()}

//                   <div className="rb-groups">
//                     <label>
//                       Travel From<span className="asterisk">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       name="travel_from"
//                       value={formData.travel_from}
//                       onChange={handleChange}
//                     />
//                   </div>
//                   <div className="rb-groups">
//                     <label>
//                       Travel To<span className="asterisk">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       name="travel_to"
//                       value={formData.travel_to}
//                       onChange={handleChange}
//                     />
//                   </div>

//                   {formData.transport_type === "Outstation" && (
//                     <div className="rb-groups">
//                       <label>Transport Amount</label>
//                       <input
//                         type="number"
//                         name="transport_amount"
//                         value={formData.transport_amount}
//                         onChange={handleChange}
//                       />
//                     </div>
//                   )}

//                   {formData.transport_type === "Outstation" && (
//                     <div className="rb-groups">
//                       <label>Accommodation Fees</label>
//                       <input
//                         type="number"
//                         name="accommodation_fees"
//                         value={formData.accommodation_fees}
//                         onChange={handleChange}
//                       />
//                     </div>
//                   )}

//                   {formData.transport_type === "Outstation" && (
//                     <div className="rb-groups">
//                       <label>DA</label>
//                       <input
//                         type="number"
//                         name="da"
//                         value={formData.da}
//                         onChange={handleChange}
//                       />
//                     </div>
//                   )}

//                   <div className="rb-groups">
//                     <label>
//                       Total Amount<span className="asterisk">*</span>
//                     </label>
//                     <input
//                       type="number"
//                       name="total_amount"
//                       value={formData.total_amount}
//                       onChange={handleChange}
//                     />
//                   </div>
//                 </div>

//                 <div className="purpose-attachment">
//                   <div className="pa-groups">
//                     <label>
//                       Purpose Details / Comments
//                       <span className="asterisk">*</span>
//                     </label>
//                     <textarea
//                       name="purpose"
//                       value={formData.purpose}
//                       onChange={handleChange}
//                     />
//                   </div>

//                   <div className="pa-groups">
//                     <label>Attachment</label>
//                     <div className="attachment-wrapper">
//                       <div className="file-links">
//                         {selectedFiles.length > 0 ? (
//                           selectedFiles.map((fileName, index) => (
//                             <p key={index} className="file-name">
//                               {fileName}
//                             </p>
//                           ))
//                         ) : (
//                           <p>No files selected</p>
//                         )}
//                       </div>

//                       <div className="attachment-upload">
//                         <input
//                           type="file"
//                           multiple
//                           ref={fileInputRef}
//                           onChange={handleFileUpload}
//                           style={{ display: "none" }}
//                         />
//                         <button
//                           type="button"
//                           className="custom-file-upload"
//                           onClick={() =>
//                             fileInputRef.current && fileInputRef.current.click()
//                           }
//                         >
//                           Browse
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </>
//         );

//       case "Meals":
//         return (
//           <div className="rb-main-form">
//             <div className={`rb-form1-grid ${compact ? "stacked-grid" : ""}`}>
//               <div className="rb-groups">
//                 <label>
//                   Date<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="date"
//                   value={formData.date}
//                   onChange={handleChange}
//                   max={new Date(Date.now() - 86400000).toLocaleDateString(
//                     "en-CA"
//                   )}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>Meal Type</label>
//                 <select
//                   name="meal_type"
//                   value={formData.meal_type}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select</option>
//                   <option value="breakfast">Break Fast</option>
//                   <option value="lunch">Lunch</option>
//                   <option value="dinner">Dinner</option>
//                   <option value="Full Day">Full Day</option>
//                 </select>
//               </div>
//               <div className="rb-groups">
//                 <label>Meal's objective</label>
//                 <select
//                   name="meals_objective"
//                   value={formData.meals_objective}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select</option>
//                   <option value="client_visit">Client Visit</option>
//                   <option value="team_outing">Team Outing</option>
//                   <option value="extended_work">Extended</option>
//                   <option value="others">Others</option>
//                 </select>
//               </div>

//               <div className="rb-groups">
//                 <label>
//                   Total Amount<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="total_amount"
//                   value={formData.total_amount}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="purpose-attachment">
//               <div className="pa-groups">
//                 <label>
//                   Purpose Details / Comments<span className="asterisk">*</span>
//                 </label>
//                 <textarea
//                   name="purpose"
//                   value={formData.purpose}
//                   onChange={handleChange}
//                 />
//               </div>

//               <div className="pa-groups">
//                 <label>Attachment</label>
//                 <div className="attachment-wrapper">
//                   <div className="file-links">
//                     {selectedFiles.length > 0 ? (
//                       selectedFiles.map((fileName, index) => (
//                         <p key={index} className="file-name">
//                           {fileName}
//                         </p>
//                       ))
//                     ) : (
//                       <p>No files selected</p>
//                     )}
//                   </div>

//                   <div className="attachment-upload">
//                     <input
//                       type="file"
//                       multiple
//                       ref={fileInputRef}
//                       onChange={handleFileUpload}
//                       style={{ display: "none" }}
//                     />
//                     <button
//                       type="button"
//                       className="custom-file-upload"
//                       onClick={() =>
//                         fileInputRef.current && fileInputRef.current.click()
//                       }
//                     >
//                       Browse
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       case "Telecommunication":
//         return (
//           <div className="rb-main-form">
//             <div className={`rb-form2-grid ${compact ? "stacked-grid" : ""}`}>
//               <div className="rb-groups">
//                 <label>
//                   Date<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="date"
//                   value={formData.date}
//                   onChange={handleChange}
//                   max={new Date(Date.now() - 86400000).toLocaleDateString(
//                     "en-CA"
//                   )}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>Service Provider</label>
//                 <input
//                   type="text"
//                   name="service_provider"
//                   value={formData.service_provider}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>
//                   Total Amount<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="total_amount"
//                   value={formData.total_amount}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//             <div className="purpose-attachment">
//               <div className="pa-groups">
//                 <label>
//                   Purpose Details / Comments<span className="asterisk">*</span>
//                 </label>
//                 <textarea
//                   name="purpose"
//                   value={formData.purpose}
//                   onChange={handleChange}
//                 />
//               </div>

//               <div className="pa-groups">
//                 <label>Attachment</label>
//                 <div className="attachment-wrapper">
//                   <div className="file-links">
//                     {selectedFiles.length > 0 ? (
//                       selectedFiles.map((fileName, index) => (
//                         <p key={index} className="file-name">
//                           {fileName}
//                         </p>
//                       ))
//                     ) : (
//                       <p>No files selected</p>
//                     )}
//                   </div>

//                   <div className="attachment-upload">
//                     <input
//                       type="file"
//                       multiple
//                       ref={fileInputRef}
//                       onChange={handleFileUpload}
//                       style={{ display: "none" }}
//                     />
//                     <button
//                       type="button"
//                       className="custom-file-upload"
//                       onClick={() =>
//                         fileInputRef.current && fileInputRef.current.click()
//                       }
//                     >
//                       Browse
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       case "Stationary":
//         return (
//           <div className="rb-main-form">
//             <div className={`rb-form1-grid ${compact ? "stacked-grid" : ""}`}>
//               <div className="rb-groups">
//                 <label>
//                   Date<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="date"
//                   value={formData.date}
//                   onChange={handleChange}
//                   max={new Date(Date.now() - 86400000).toLocaleDateString(
//                     "en-CA"
//                   )}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>Stationary</label>
//                 <select
//                   name="stationary"
//                   value={formData.stationary}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select</option>
//                   <option value="office equipments">Office Equipments</option>
//                   <option value="general stationary">General Stationary</option>
//                 </select>
//               </div>
//               <div className="rb-groups">
//                 <label>Purchasing Items</label>
//                 <input
//                   type="text"
//                   name="purchasing_item"
//                   value={formData.purchasing_item}
//                   onChange={handleChange}
//                 />
//               </div>

//               <div className="rb-groups">
//                 <label>
//                   Total Amount<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="total_amount"
//                   value={formData.total_amount}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="purpose-attachment">
//               <div className="pa-groups">
//                 <label>
//                   Purpose Details / Comments<span className="asterisk">*</span>
//                 </label>
//                 <textarea
//                   name="purpose"
//                   value={formData.purpose}
//                   onChange={handleChange}
//                 />
//               </div>

//               <div className="pa-groups">
//                 <label>Attachment</label>
//                 <div className="attachment-wrapper">
//                   <div className="file-links">
//                     {selectedFiles.length > 0 ? (
//                       selectedFiles.map((fileName, index) => (
//                         <p key={index} className="file-name">
//                           {fileName}
//                         </p>
//                       ))
//                     ) : (
//                       <p>No files selected</p>
//                     )}
//                   </div>

//                   <div className="attachment-upload">
//                     <input
//                       type="file"
//                       multiple
//                       ref={fileInputRef}
//                       onChange={handleFileUpload}
//                       style={{ display: "none" }}
//                     />
//                     <button
//                       type="button"
//                       className="custom-file-upload"
//                       onClick={() =>
//                         fileInputRef.current && fileInputRef.current.click()
//                       }
//                     >
//                       Browse
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       case "Miscellaneous":
//         return (
//           <div className="rb-main-form">
//             <div className={`rb-form1-grid ${compact ? "stacked-grid" : ""}`}>
//               <div className="rb-groups">
//                 <label>
//                   Date<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="date"
//                   value={formData.date}
//                   onChange={handleChange}
//                   max={new Date(Date.now() - 86400000).toLocaleDateString(
//                     "en-CA"
//                   )}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>
//                   Total Amount<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="total_amount"
//                   value={formData.total_amount}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="purpose-attachment">
//               <div className="pa-groups">
//                 <label>
//                   Purpose Details / Comments<span className="asterisk">*</span>
//                 </label>
//                 <textarea
//                   name="purpose"
//                   value={formData.purpose}
//                   onChange={handleChange}
//                 />
//               </div>

//               <div className="pa-groups">
//                 <label>Attachment</label>
//                 <div className="attachment-wrapper">
//                   <div className="file-links">
//                     {selectedFiles.length > 0 ? (
//                       selectedFiles.map((fileName, index) => (
//                         <p key={index} className="file-name">
//                           {fileName}
//                         </p>
//                       ))
//                     ) : (
//                       <p>No files selected</p>
//                     )}
//                   </div>

//                   <div className="attachment-upload">
//                     <input
//                       type="file"
//                       multiple
//                       ref={fileInputRef}
//                       onChange={handleFileUpload}
//                       style={{ display: "none" }}
//                     />
//                     <button
//                       type="button"
//                       className="custom-file-upload"
//                       onClick={() =>
//                         fileInputRef.current && fileInputRef.current.click()
//                       }
//                     >
//                       Browse
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
//       default:
//         return null;
//     }
//   };

//   // MOBILE: validators for steps
//   const validateStep = (step) => {
//     if (step === 1) {
//       if (!formData.project) {
//         showAlert("Please select a project before continuing.");
//         return false;
//       }
//       if (!formData.claim_type) {
//         showAlert("Please select a claim type before continuing.");
//         return false;
//       }
//       return true;
//     }
//     if (step === 2) {
//       // ensure at least total_amount exists for claim-specific types
//       const needsAmount = [
//         "Transportation",
//         "Meals",
//         "Telecommunication",
//         "Stationary",
//         "Miscellaneous",
//       ];
//       if (needsAmount.includes(formData.claim_type) && !formData.total_amount) {
//         showAlert("Please enter Total Amount before continuing.");
//         return false;
//       }
//       return true;
//     }
//     return true;
//   };

//   const nextMobileStep = () => {
//     if (!validateStep(mobileStep)) return;
//     setMobileStep((s) => Math.min(3, s + 1));
//   };

//   const prevMobileStep = () => setMobileStep((s) => Math.max(1, s - 1));

//   const submitFromMobile = async () => {
//     // perform last step validation: purpose word count
//     const wordCount = formData.purpose
//       ? formData.purpose.trim().split(/\s+/).filter(Boolean).length
//       : 0;
//     if (wordCount < 10) {
//       showAlert(
//         `Purpose Details / Comments must be at least 10 words. You have ${wordCount}.`
//       );
//       return;
//     }
//     await handleSubmit();
//   };

//   // ------------ Render ------------
//   return (
//     <div className="reimbursement-container">
//       <div className="rb-form-header">
//         {role !== "Manager" && role !== "Admin" && (
//           <h2>Reimbursement Requests</h2>
//         )}
//       </div>

//       <div className="filter-container">
//         <label>Status By</label>
//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//         >
//           <option value="pending">Pending</option>
//           <option value="approved">Approved</option>
//           <option value="rejected">Rejected</option>
//         </select>

//         <label>Date From</label>
//         <input
//           type="date"
//           value={fromDate}
//           onChange={(e) => setFromDate(e.target.value)}
//         />

//         <label>To</label>
//         <input
//           type="date"
//           value={toDate}
//           onChange={(e) => setToDate(e.target.value)}
//         />

//         <button className="search-btn" onClick={applyFilters}>
//           <FaSearch /> Search
//         </button>

//         <button
//           className="apply-btn"
//           onClick={() => {
//             setSubmitErrorMessage("");
//             setUpdateErrorMessage("");
//             setSelectedFiles([]);
//             setShowForm(true);
//             setEditingId(null);
//             setFormData({
//               employeeId,
//               department_id: departmentId,
//               claim_type: "",
//               transport_type: "",
//               fromDate: "",
//               toDate: "",
//               date: "",
//               travel_from: "",
//               travel_to: "",
//               meals_objective: "",
//               purpose: "",
//               purchasing_item: "",
//               accommodation_fees: "",
//               no_of_days: "",
//               total_amount: "",
//               meal_type: "",
//               stationary: "",
//               service_provider: "",
//               project: "",
//               attachments: null,
//             });
//             setMobileStep(1);
//           }}
//         >
//           Apply Claim
//         </button>
//       </div>

//       {errorMessage && <p className="rb-error-message">{errorMessage}</p>}

//       <div className="reimbursement-table-scroll">
//         <table className="reimbursement-table">
//           <thead>
//             <tr>
//               <th>Sl No</th>
//               <th>Claim Type</th>
//               <th>Date</th>
//               <th>Purpose</th>
//               <th>Amount</th>
//               <th>Attachment</th>
//               <th>Status</th>
//               <th>Comments</th>
//               <th>Payment Status</th>
//               <th>Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filterClaims.map((claim, index) => (
//               <tr key={claim.id}>
//                 <td>{index + 1}</td>
//                 <td>{claim.claim_type}</td>
//                 <td>
//                   {claim.date_range
//                     ? claim.date_range
//                         .split(" - ")
//                         .map(formatDisplayDate)
//                         .join(" - ")
//                     : claim.date
//                     ? formatDisplayDate(claim.date)
//                     : claim.from_date && claim.to_date
//                     ? `${formatDisplayDate(
//                         claim.from_date
//                       )} - ${formatDisplayDate(claim.to_date)}`
//                     : "N/A"}
//                 </td>
//                 <td>
//                   <div className="rbadmin-comments">{claim.purpose}</div>
//                 </td>
//                 <td>{claim.total_amount}</td>
//                 <td>
//                   {attachments[claim.id]?.length > 0 ? (
//                     <button
//                       className="attachments-btn"
//                       onClick={() =>
//                         handleOpenAttachments(attachments[claim.id], claim)
//                       }
//                     >
//                       <MdOutlineRemoveRedEye className="eye-icon" /> View
//                     </button>
//                   ) : (
//                     "Not Attached"
//                   )}
//                 </td>
//                 <td>
//                   <span
//                     className={`rb-status-label ${
//                       claim.status === "approved"
//                         ? "rb-approved"
//                         : claim.status === "rejected"
//                         ? "rb-rejected"
//                         : ""
//                     }`}
//                   >
//                     {claim.status}
//                   </span>
//                 </td>
//                 <td>
//                   <div className="rbadmin-comments">
//                     {claim.approver_comments || "No comments"}
//                   </div>
//                 </td>
//                 <td>{claim.payment_status}</td>
//                 <td className="actions-column">
//                   <MdOutlineEdit
//                     className={`edit-icon ${
//                       claim.status && claim.status.toLowerCase() !== "pending"
//                         ? "disabled-icon"
//                         : ""
//                     }`}
//                     onClick={() => {
//                       if (
//                         claim.status &&
//                         claim.status.toLowerCase() === "pending"
//                       ) {
//                         handleEdit(claim);
//                         setShowForm(true);
//                       }
//                     }}
//                   />
//                   <MdDeleteOutline
//                     className={`delete-icon ${
//                       claim.status && claim.status.toLowerCase() !== "pending"
//                         ? "disabled-icon"
//                         : ""
//                     }`}
//                     onClick={() => {
//                       if (
//                         claim.status &&
//                         claim.status.toLowerCase() === "pending"
//                       )
//                         deleteReimbursement(claim.id);
//                     }}
//                   />
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//           <tfoot>
//             <tr className="total-row">
//               <td
//                 colSpan="4"
//                 style={{
//                   textAlign: "right",
//                   color: "#949494",
//                   fontWeight: "bold",
//                 }}
//               >
//                 Total Amount Claiming:{" "}
//                 <span style={{ fontWeight: "bold", color: "black" }}>
//                   Rs {totalAmount}
//                 </span>
//               </td>
//               <td colSpan="3" style={{ textAlign: "right" }}>
//                 Amount Approved: Rs{" "}
//                 <span style={{ fontWeight: "bold" }}>{approvedAmount}</span>
//               </td>
//               <td colSpan="3" style={{ textAlign: "right" }}>
//                 Amount Rejected: Rs{" "}
//                 <span style={{ fontWeight: "bold" }}>{rejectedAmount}</span>
//               </td>
//             </tr>
//           </tfoot>
//         </table>

//         {/* Mobile cards */}
//         <div className="rb-reimbursement-cards">
//           {filterClaims.map((claim, index) => (
//             <div className="rb-reimbursement-card" key={claim.id}>
//               <div className="rb-card-header">
//                 <span className={`rb-status ${claim.status?.toLowerCase()}`}>
//                   {claim.status}
//                 </span>
//               </div>
//               <div className="rb-card-body">
//                 <p>
//                   <strong>Sl No:</strong> {index + 1}
//                 </p>
//                 <p>
//                   <strong>Claim Type:</strong> {claim.claim_type}
//                 </p>
//                 <p>
//                   <strong>Date:</strong>{" "}
//                   {claim.date ? formatDisplayDate(claim.date) : "N/A"}
//                 </p>
//                 <p>
//                   <strong>Purpose:</strong> {claim.purpose}
//                 </p>
//                 <p>
//                   <strong>Amount:</strong> Rs {claim.total_amount}
//                 </p>
//                 <p>
//                   <strong>Comments:</strong>{" "}
//                   {claim.approver_comments || "No comments"}
//                 </p>
//               </div>
//               <div className="rb-card-footer">
//                 {attachments[claim.id]?.length > 0 ? (
//                   <button
//                     className="rb-attachments-btn"
//                     onClick={() =>
//                       handleOpenAttachments(attachments[claim.id], claim)
//                     }
//                   >
//                     <MdOutlineRemoveRedEye className="rb-eye-icon" /> View
//                   </button>
//                 ) : (
//                   <span className="rb-no-attachment">No Attachment</span>
//                 )}
//                 {claim.status && claim.status.toLowerCase() === "pending" && (
//                   <div className="rb-card-actions">
//                     <MdOutlineEdit
//                       className="rb-edit-icon"
//                       onClick={() => {
//                         handleEdit(claim);
//                         setShowForm(true);
//                       }}
//                     />
//                     <MdDeleteOutline
//                       className="rb-delete-icon"
//                       onClick={() => deleteReimbursement(claim.id)}
//                     />
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Form modal for desktop or non-mobile */}
//       {showForm && !isMobile && (
//         <div className="rb-modal">
//           <div className="rb-modal-content">
//             <div className="claim-form-header">
//               <h2 className="claim-form-title">
//                 {editingId ? "Edit Reimbursement" : "New Reimbursement"}
//               </h2>
//               <MdOutlineCancel
//                 className="claim-form-close"
//                 onClick={() => setShowForm(false)}
//               />
//             </div>
//             {submitErrorMessage && (
//               <p className="rb-error-message">{submitErrorMessage}</p>
//             )}
//             {updateErrorMessage && (
//               <p className="rb-error-message">{updateErrorMessage}</p>
//             )}
//             <form className="reimbursement-form" onSubmit={handleSubmit}>
//               <div className="claim-type">
//                 <label>
//                   Project<span className="asterisk">*</span>
//                 </label>
//                 <select
//                   name="project"
//                   value={formData.project}
//                   onChange={handleChange}
//                   required
//                 >
//                   <option value="">Select project</option>
//                   <option value="Company Claim">Company Claim</option>
//                   {projects.map((proj, i) => (
//                     <option key={i} value={proj}>
//                       {proj}
//                     </option>
//                   ))}
//                 </select>

//                 <div className="rb-tabs">
//                   {claimTypes.map(({ icon, label }) => (
//                     <div
//                       key={label}
//                       className={`rb-tab ${
//                         formData.claim_type === label ? "active" : ""
//                       }`}
//                       onClick={() =>
//                         handleClaimTypeChange({ target: { value: label } })
//                       }
//                     >
//                       {icon} {label}
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {renderClaimSpecificFields()}

//               <div className="reimbursement-form-button">
//                 <button
//                   type="button"
//                   className="rb-close"
//                   onClick={() => setShowForm(false)}
//                 >
//                   Cancel
//                 </button>
//                 <button type="submit" className="rb-submit">
//                   {editingId ? "Update" : "Submit"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* MOBILE: full-screen stepper form */}
//       {showForm && isMobile && (
//         <div className="mobile-form-overlay">
//           <div className="mobile-form">
//             <div className="mobile-header">
//               <button
//                 className="mobile-close"
//                 onClick={() => {
//                   setShowForm(false);
//                   setMobileStep(1);
//                 }}
//               >
//                 Close
//               </button>
//               <div className="mobile-stepper">
//                 <div className={`step ${mobileStep >= 1 ? "active" : ""}`}>
//                   1
//                 </div>
//                 <div className={`step ${mobileStep >= 2 ? "active" : ""}`}>
//                   2
//                 </div>
//                 <div className={`step ${mobileStep >= 3 ? "active" : ""}`}>
//                   3
//                 </div>
//               </div>
//             </div>

//             <div className="mobile-body">
//               {mobileStep === 1 && (
//                 <div className="mobile-step-content">
//                   <h3>Select Project & Claim Type</h3>
//                   <label>Project</label>
//                   <select
//                     name="project"
//                     value={formData.project}
//                     onChange={handleChange}
//                   >
//                     <option value="">Select project</option>
//                     <option value="Company Claim">Company Claim</option>
//                     {projects.map((proj, i) => (
//                       <option key={i} value={proj}>
//                         {proj}
//                       </option>
//                     ))}
//                   </select>

//                   <label style={{ marginTop: 12 }}>Claim Type</label>
//                   <div className="mobile-claim-types">
//                     {claimTypes.map(({ icon, label }) => (
//                       <div
//                         key={label}
//                         className={`mobile-claim-card ${
//                           formData.claim_type === label ? "selected" : ""
//                         }`}
//                         onClick={() => handleClaimTypeChange(label)}
//                       >
//                         <div className="mobile-claim-icon">{icon}</div>
//                         <div className="mobile-claim-label">{label}</div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {mobileStep === 2 && (
//                 <div className="mobile-step-content">
//                   <h3>Claim Details</h3>
//                   {/* compact=true to make fields stacked and mobile friendly */}
//                   {renderClaimSpecificFields(true)}
//                 </div>
//               )}

//               {mobileStep === 3 && (
//                 <div className="mobile-step-content">
//                   <h3>Purpose & Attachments</h3>
//                   <div className="pa-groups">
//                     <label>
//                       Purpose Details / Comments<span className="asterisk">*</span>
//                     </label>
//                     <textarea
//                       name="purpose"
//                       value={formData.purpose}
//                       onChange={handleChange}
//                     />
//                   </div>

//                   <div className="pa-groups">
//                     <label>Attachment</label>
//                     <div className="attachment-wrapper">
//                       <div className="file-links">
//                         {selectedFiles.length > 0 ? (
//                           selectedFiles.map((fileName, index) => (
//                             <p key={index} className="file-name">
//                               {fileName}
//                             </p>
//                           ))
//                         ) : (
//                           <p>No files selected</p>
//                         )}
//                       </div>

//                       <div className="attachment-upload">
//                         <input
//                           type="file"
//                           multiple
//                           ref={fileInputRef}
//                           onChange={handleFileUpload}
//                           style={{ display: "none" }}
//                         />
//                         <button
//                           type="button"
//                           className="custom-file-upload"
//                           onClick={() =>
//                             fileInputRef.current && fileInputRef.current.click()
//                           }
//                         >
//                           Browse
//                         </button>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="mobile-review">
//                     <h4>Review</h4>
//                     <p>
//                       <strong>Project:</strong> {formData.project || "—"}
//                     </p>
//                     <p>
//                       <strong>Type:</strong> {formData.claim_type || "—"}
//                     </p>
//                     <p>
//                       <strong>Amount:</strong> {formData.total_amount || "—"}
//                     </p>
//                     <p>
//                       <strong>Purpose:</strong>{" "}
//                       {formData.purpose ? `${formData.purpose.slice(0, 120)}${formData.purpose.length>120?"...":""}` : "—"}
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="mobile-footer">
//               <div className="mobile-nav">
//                 {mobileStep > 1 ? (
//                   <button className="mobile-back" onClick={prevMobileStep}>
//                     Back
//                   </button>
//                 ) : (
//                   <div style={{ width: 90 }} />
//                 )}

//                 {mobileStep < 3 ? (
//                   <button className="mobile-next" onClick={nextMobileStep}>
//                     Next
//                   </button>
//                 ) : (
//                   <button className="mobile-submit" onClick={submitFromMobile}>
//                     Submit
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Attachments modal */}
//       {isModalOpen && (
//         <div className="att-modal-overlay">
//           <div className="att-modal-content">
//             <div className="att-header">
//               <h2>Attachments</h2>
//               <MdOutlineCancel
//                 className="att-close"
//                 onClick={() => setIsModalOpen(false)}
//               />
//             </div>
//             <h4 className="att-files">
//               {selectedClaim?.claim_type
//                 ? `${selectedClaim.claim_type} Bills`
//                 : "Bills"}
//             </h4>
//             {selectedFiles.length > 0 ? (
//               selectedFiles.map((file, idx) => (
//                 <div className="att-files" key={idx}>
//                   <a href={file.url} target="_blank" rel="noopener noreferrer">
//                     {file.name}
//                   </a>
//                 </div>
//               ))
//             ) : (
//               <p>No attachments available</p>
//             )}
//             <button
//               className="att-close-btn"
//               onClick={() => setIsModalOpen(false)}
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}

//       <Modal
//         isVisible={confirmModal.isVisible}
//         onClose={closeConfirm}
//         buttons={[
//           { label: "Cancel", onClick: closeConfirm },
//           { label: "Confirm", onClick: confirmModal.onConfirm },
//         ]}
//       >
//         <p>{confirmModal.message}</p>
//       </Modal>

//       <Modal
//         isVisible={alertModal.isVisible}
//         onClose={closeAlert}
//         buttons={[{ label: "OK", onClick: closeAlert }]}
//       >
//         <p>{alertModal.message}</p>
//       </Modal>
//     </div>
//   );
// };

// export default Reimbursement;


// "use client";
// import React, { useState, useEffect, useCallback, useRef } from "react";
// import axios from "axios";
// import { FaSearch } from "react-icons/fa";
// import {
//   MdOutlineEdit,
//   MdDeleteOutline,
//   MdOutlineCancel,
//   MdEmojiTransportation,
//   MdOutlinePhoneAndroid,
//   MdOutlineRemoveRedEye,
// } from "react-icons/md";
// import { GiKnifeFork, GiPencilBrush } from "react-icons/gi";
// import { TbTriangleSquareCircle } from "react-icons/tb";
// import "./Reimbursement.css";
// import Modal from "../Modal/Modal.client";
// import { useAuth } from "../../context/AuthProvider.client";
// const claimTypes = [
//   {
//     icon: <MdEmojiTransportation className="claim-icons" />,
//     label: "Transportation",
//   },
//   { icon: <GiKnifeFork className="claim-icons" />, label: "Meals" },
//   {
//     icon: <MdOutlinePhoneAndroid className="claim-icons" />,
//     label: "Telecommunication",
//   },
//   { icon: <GiPencilBrush className="claim-icons" />, label: "Stationary" },
//   {
//     icon: <TbTriangleSquareCircle className="claim-icons" />,
//     label: "Miscellaneous",
//   },
// ];
// const Reimbursement = () => {
//   const { user } = useAuth();
//   const orgId = user?.orgId || user?.org_id || null;
//   const role = user?.role || " ";
//   const authToken = user?.token;
//   const employeeId = user?.employeeId;
//   const departmentId = user?.department_id;
//   const [reimbursements, setReimbursements] = useState([]);
//   const [filteredReimbursements, setFilteredReimbursements] = useState([]);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [showForm, setShowForm] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [transportType, setTransportType] = useState("");
//   const [noOfDaysType, setNoOfDaysType] = useState("");
//   const [attachments, setAttachments] = useState({});
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const [selectedClaim, setSelectedClaim] = useState(null);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [updateErrorMessage, setUpdateErrorMessage] = useState("");
//   const [submitErrorMessage, setSubmitErrorMessage] = useState("");
//   const [projects, setProjects] = useState([]);
//   const [statusFilter, setStatusFilter] = useState("pending");
//   const [selectedSubType, setSelectedSubType] = useState("");
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const fileInputRef = useRef(null);
//   const [formData, setFormData] = useState({
//     employeeId: employeeId,
//     department_id: departmentId,
//     claim_type: "",
//     transport_type: "",
//     da: "",
//     fromDate: "",
//     toDate: "",
//     date: "",
//     travel_from: "",
//     travel_to: "",
//     meals_objective: "",
//     purpose: "",
//     purchasing_item: "",
//     accommodation_fees: "",
//     no_of_days: "",
//     total_amount: "",
//     meal_type: "",
//     stationary: "",
//     service_provider: "",
//     project: "",
//     attachments: null,
//   });
//   const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
//   const [currentStep, setCurrentStep] = useState(1);

//   useEffect(() => {
//     const handleResize = () => setIsMobile(window.innerWidth <= 768);
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   useEffect(() => {
//     if (showForm) {
//       setCurrentStep(1);
//     }
//   }, [showForm]);

//   const formatDisplayDate = (raw) => {
//     if (!raw) return "N/A";
//     const d = raw instanceof Date ? raw : new Date(raw);
//     if (isNaN(d)) return raw;
//     const day = String(d.getDate()).padStart(2, "0");
//     const month = d.toLocaleString("en-GB", { month: "short" });
//     const year = d.getFullYear();
//     return `${day}-${month}-${year}`;
//   };
//   const [confirmModal, setConfirmModal] = useState({
//     isVisible: false,
//     message: "",
//     onConfirm: null,
//   });
//   const showConfirm = (message, onConfirm) =>
//     setConfirmModal({ isVisible: true, message, onConfirm });
//   const closeConfirm = () =>
//     setConfirmModal({ isVisible: false, message: "", onConfirm: null });
//   const [alertModal, setAlertModal] = useState({
//     isVisible: false,
//     title: "",
//     message: "",
//   });
//   const showAlert = (message, title = "") =>
//     setAlertModal({ isVisible: true, title, message });
//   const closeAlert = () =>
//     setAlertModal({ isVisible: false, title: "", message: "" });
//   const fetchReimbursements = useCallback(async () => {
//     try {
//       const response = await axios.get(
//         `${BACKEND_URL}/reimbursement/${employeeId}`,
//         {
//           headers: {
//             "x-api-key": API_KEY,
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${authToken}`,
//             "x-org-id": orgId,
//           },
//         }
//       );
//       const reimbursementsData = Array.isArray(response.data)
//         ? response.data
//         : response.data || [];
//       setReimbursements(reimbursementsData);
//       const attachmentsData = {};
//       await Promise.all(
//         reimbursementsData.map(async (claim) => {
//           try {
//             const claimId = claim.id;
//             const attachmentResponse = await axios.get(
//               `${BACKEND_URL}/reimbursement/${claimId}/attachments`,
//               {
//                 headers: {
//                   "x-api-key": API_KEY,
//                   Authorization: `Bearer ${authToken}`,
//                   "x-org-id": orgId,
//                 },
//               }
//             );
//             attachmentsData[claimId] = (
//               attachmentResponse.data.attachments || []
//             ).map((file) => {
//               // robustly extract org/year/month/empId from file_path
//               const pathParts = (file.file_path || "")
//                 .split("/")
//                 .filter(Boolean);
//               let orgSeg = "";
//               let year = "";
//               let month = "";
//               let empId = claim.employee_id || claim.employeeId || "";
//               const idx = pathParts.findIndex((p) => p === "reimbursement");
//               if (idx !== -1 && pathParts.length >= idx + 5) {
//                 orgSeg = pathParts[idx + 1];
//                 year = pathParts[idx + 2];
//                 month = pathParts[idx + 3];
//                 empId = pathParts[idx + 4] || empId;
//               } else {
//                 // fallback to older layout (no orgId)
//                 year = pathParts[pathParts.length - 4] || "";
//                 month = pathParts[pathParts.length - 3] || "";
//                 empId =
//                   pathParts[pathParts.length - 2] ||
//                   claim.employee_id ||
//                   claim.employeeId ||
//                   empId;
//               }
//               return {
//                 ...file,
//                 orgId: orgSeg,
//                 year,
//                 month,
//                 employeeId: empId,
//               };
//             });
//           } catch (err) {
//             console.error(
//               `Error fetching attachments for claim ${claim.id}`,
//               err
//             );
//             attachmentsData[claim.id] = [];
//           }
//         })
//       );
//       setAttachments(attachmentsData);
//     } catch (error) {
//       console.error("Error fetching reimbursements:", error);
//       setErrorMessage(
//         error?.response?.data?.message ||
//           "We ran into a problem fetching reimbursements."
//       );
//       showAlert(
//         error?.response?.data?.message || "Error fetching reimbursements."
//       );
//     }
//   }, [employeeId, authToken, orgId]);
//   const fetchProjects = useCallback(async () => {
//     try {
//       const res = await axios.get(`${BACKEND_URL}/projectdrop`, {
//         headers: { "x-api-key": API_KEY, "x-org-id": orgId },
//       });
//       setProjects(res.data || []);
//     } catch (err) {
//       console.error("Error fetching projects:", err);
//     }
//   }, [orgId]);
//   useEffect(() => {
//     if (!employeeId) return;
//     fetchReimbursements();
//     fetchProjects();
//   }, [fetchReimbursements, fetchProjects, employeeId]);
//   const tryParseDate = (s) => {
//     if (!s && s !== 0) return null;
//     if (s instanceof Date && !isNaN(s)) return s;
//     if (typeof s === "number") {
//       const d = new Date(s);
//       return isNaN(d) ? null : d;
//     }
//     let str = String(s).trim();
//     if (!str) return null;
//     str = str.replace(/\s+to\s+/i, " - ");
//     str = str.replace(/\u2013|\u2014/g, " - ");
//     str = str.replace(/\//g, "-");
//     let d = new Date(str);
//     if (!isNaN(d)) return d;
//     if (str.includes("T")) {
//       const [dateOnly] = str.split("T");
//       d = new Date(dateOnly);
//       if (!isNaN(d)) return d;
//     }
//     const ddmmyyyy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
//     if (ddmmyyyy) {
//       const [, dd, mm, yyyy] = ddmmyyyy;
//       d = new Date(`${yyyy}-${mm}-${dd}`);
//       if (!isNaN(d)) return d;
//     }
//     return null;
//   };
//   const normalizeStartOfDay = (date) =>
//     new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
//   const normalizeEndOfDay = (date) =>
//     new Date(
//       date.getFullYear(),
//       date.getMonth(),
//       date.getDate(),
//       23,
//       59,
//       59,
//       999
//     );
//   const parseClaimRange = (claim) => {
//     let start = null;
//     let end = null;
//     if (
//       claim.date_range &&
//       typeof claim.date_range === "string" &&
//       (claim.date_range.includes(" - ") ||
//         claim.date_range.toLowerCase().includes(" to ") ||
//         claim.date_range.includes("–") ||
//         claim.date_range.includes("—"))
//     ) {
//       const unified = claim.date_range
//         .replace(/\s+to\s+/gi, " - ")
//         .replace(/\u2013|\u2014/g, " - ");
//       const parts = unified.split(" - ").map((p) => p.trim());
//       if (parts.length >= 2) {
//         const p0 = tryParseDate(parts[0]);
//         const p1 = tryParseDate(parts[1]);
//         start = p0 || null;
//         end = p1 || null;
//       }
//     }
//     if (!start && (claim.from_date || claim.fromDate)) {
//       start = tryParseDate(claim.from_date || claim.fromDate);
//     }
//     if (!end && (claim.to_date || claim.toDate)) {
//       end = tryParseDate(claim.to_date || claim.toDate);
//     }
//     if (!start && claim.date) {
//       start = tryParseDate(claim.date);
//       end = start;
//     }
//     if (!start && claim.created_at) {
//       const t = tryParseDate(claim.created_at);
//       start = t;
//       end = t;
//     }
//     if (start && !end) end = start;
//     if (start && end) {
//       start = normalizeStartOfDay(start);
//       end = normalizeEndOfDay(end);
//     }
//     return { start, end };
//   };
//   const applyFilters = useCallback(() => {
//     const fRaw = fromDate ? tryParseDate(fromDate) : null;
//     const tRaw = toDate ? tryParseDate(toDate) : null;
//     const fStart = fRaw ? normalizeStartOfDay(fRaw) : null;
//     const tEnd = tRaw ? normalizeEndOfDay(tRaw) : null;
//     const filtered = reimbursements.filter((claim) => {
//       if (
//         statusFilter &&
//         claim.status &&
//         claim.status.toLowerCase() !== statusFilter.toLowerCase()
//       ) {
//         return false;
//       }
//       if (!fStart && !tEnd) return true;
//       const { start, end } = parseClaimRange(claim);
//       if (!start || !end) {
//         return !fStart && !tEnd;
//       }
//       if (fStart && !tEnd) {
//         return end.getTime() >= fStart.getTime();
//       }
//       if (!fStart && tEnd) {
//         return start.getTime() <= tEnd.getTime();
//       }
//       if (fStart && tEnd) {
//         if (end.getTime() < fStart.getTime()) return false;
//         if (start.getTime() > tEnd.getTime()) return false;
//         return true;
//       }
//       return true;
//     });
//     setFilteredReimbursements(filtered);
//   }, [reimbursements, fromDate, toDate, statusFilter]);
//   useEffect(() => {
//     applyFilters();
//   }, [reimbursements, fromDate, toDate, statusFilter, applyFilters]);
//   const handleChange = (e) =>
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   const handleClaimTypeChange = (e) => {
//     const value = e.target.value;
//     setFormData((prev) => ({ ...prev, claim_type: value }));
//     setSelectedFiles([]);
//     setSelectedClaim(null);
//     setSelectedSubType("");
//   };
//   const handleTransportSubTypeChange = (type) => {
//     setFormData((prev) => ({ ...prev, transport_type: type }));
//     setSelectedSubType(type);
//     if (type === "Outstation") {
//       setFormData((prev) => ({ ...prev, no_of_days: "" }));
//     }
//   };
//   const handleNoOfDaysChange = (event) =>
//     setFormData((prev) => ({ ...prev, no_of_days: event.target.value }));
//   const handleFileUpload = (e) => {
//     const files = Array.from(e.target.files || []);
//     setSelectedFiles(files.map((file) => file.name));
//     setFormData((prev) => ({ ...prev, attachments: files }));
//   };
//   const renderDateFields = () => {
//     if (formData.transport_type === "Outstation") {
//       return (
//         <>
//           <div className="rb-groups">
//             <label>
//               From Date<span className="asterisk">*</span>
//             </label>
//             <input
//               type="date"
//               name="fromDate"
//               value={formData.fromDate}
//               onChange={handleChange}
//               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
//             />
//           </div>
//           <div className="rb-groups">
//             <label>
//               To Date<span className="asterisk">*</span>
//             </label>
//             <input
//               type="date"
//               name="toDate"
//               value={formData.toDate}
//               onChange={handleChange}
//               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
//             />
//           </div>
//         </>
//       );
//     } else if (formData.no_of_days === "single") {
//       return (
//         <div className="rb-groups">
//           <label>
//             Date<span className="asterisk">*</span>
//           </label>
//           <input
//             type="date"
//             name="date"
//             value={formData.date}
//             onChange={handleChange}
//             max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
//           />
//         </div>
//       );
//     } else if (formData.no_of_days === "multiple") {
//       return (
//         <>
//           <div className="rb-groups">
//             <label>
//               From Date<span className="asterisk">*</span>
//             </label>
//             <input
//               type="date"
//               name="fromDate"
//               value={formData.fromDate}
//               onChange={handleChange}
//               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
//             />
//           </div>
//           <div className="rb-groups">
//             <label>
//               To Date<span className="asterisk">*</span>
//             </label>
//             <input
//               type="date"
//               name="toDate"
//               value={formData.toDate}
//               onChange={handleChange}
//               max={new Date(Date.now() - 86400000).toLocaleDateString("en-CA")}
//             />
//           </div>
//         </>
//       );
//     }
//     return null;
//   };
//   const handleEdit = (claim) => {
//     setEditingId(claim.id);
//     setShowForm(true);
//     const existingAttachments = attachments[claim.id] || [];
//     setFormData({
//       employeeId: claim.employeeId || claim.employee_id || employeeId,
//       department_id: claim.department_id || departmentId,
//       claim_type: claim.claim_type || "",
//       transport_type: claim.transport_type || "",
//       fromDate: claim.from_date
//         ? claim.from_date.substring(0, 10)
//         : claim.fromDate || "",
//       toDate: claim.to_date
//         ? claim.to_date.substring(0, 10)
//         : claim.toDate || "",
//       date: claim.date ? claim.date.substring(0, 10) : claim.date || "",
//       travel_from: claim.travel_from || "",
//       travel_to: claim.travel_to || "",
//       meals_objective: claim.meals_objective || "",
//       purpose: claim.purpose || "",
//       purchasing_item: claim.purchasing_item || "",
//       accommodation_fees: claim.accommodation_fees || "",
//       transport_amount: claim.transport_amount || "",
//       da: claim.da || "",
//       no_of_days: claim.no_of_days || "",
//       total_amount: claim.total_amount || "",
//       meal_type: claim.meal_type || "",
//       stationary: claim.stationary || "",
//       comments: claim.comments || "",
//       service_provider: claim.service_provider || "",
//       project: claim.project || "",
//       attachments: existingAttachments,
//     });
//     setSelectedFiles(
//       existingAttachments.map((file) => file.file_name || file.name)
//     );
//     setSelectedSubType(claim.transport_type || "");
//   };
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitErrorMessage("");
//     const wordCount = formData.purpose
//       ? formData.purpose.trim().split(/\s+/).filter(Boolean).length
//       : 0;
//     if (wordCount < 10) {
//       showAlert(
//         `Purpose Details / Comments must be at least 10 words. You have ${wordCount}.`
//       );
//       return;
//     }
//     try {
//       const fd = new FormData();
//       Object.keys(formData).forEach((k) => {
//         if (k === "attachments") return; // handled separately
//         const val = formData[k];
//         if (val !== null && val !== undefined) fd.append(k, val);
//       });
//       // append role + orgId
//       fd.append("role", role);
//       if (orgId) fd.append("orgId", orgId);
//       if (formData.attachments && formData.attachments.length > 0) {
//         formData.attachments.forEach((file) => {
//           if (file instanceof File) {
//             fd.append("attachments", file);
//           }
//         });
//       }
//       const config = {
//         headers: {
//           "x-api-key": API_KEY,
//           "Content-Type": "multipart/form-data",
//           Authorization: `Bearer ${authToken}`,
//           "x-org-id": orgId,
//         },
//       };
//       let response;
//       if (editingId) {
//         response = await axios.put(
//           `${BACKEND_URL}/reimbursement/${editingId}`,
//           fd,
//           config
//         );
//       } else {
//         response = await axios.post(`${BACKEND_URL}/reimbursement`, fd, config);
//       }
//       showAlert(
//         response?.data?.message || "Reimbursement submitted successfully!"
//       );
//       // reset form
//       setFormData({
//         employeeId: employeeId,
//         department_id: departmentId,
//         claim_type: "",
//         transport_type: "",
//         fromDate: "",
//         toDate: "",
//         date: "",
//         travel_from: "",
//         travel_to: "",
//         meals_objective: "",
//         purpose: "",
//         purchasing_item: "",
//         accommodation_fees: "",
//         no_of_days: "",
//         total_amount: "",
//         meal_type: "",
//         stationary: "",
//         service_provider: "",
//         project: "",
//         attachments: null,
//       });
//       setShowForm(false);
//       setEditingId(null);
//       setSelectedFiles([]);
//       fetchReimbursements();
//     } catch (error) {
//       console.error("Error submitting reimbursement:", error);
//       const msg =
//         error?.response?.data?.error ||
//         error?.response?.data?.message ||
//         "An unexpected error occurred.";
//       setSubmitErrorMessage(msg);
//       showAlert(msg);
//     }
//   };
//   const handleStepSubmit = (e) => {
//     e.preventDefault();
//     if (currentStep < getTotalSteps()) {
//       setCurrentStep(currentStep + 1);
//     } else {
//       handleSubmit(e);
//     }
//   };
//   const getTotalSteps = () => {
//     if (!formData.claim_type) return 1;
//     return formData.claim_type === "Transportation" ? 4 : 3;
//   };
//   const updateReimbursement = async (reimbursementId, updateData) => {
//     try {
//       const response = await axios.put(
//         `${BACKEND_URL}/reimbursement/${reimbursementId}`,
//         updateData,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": API_KEY,
//             "x-org-id": orgId,
//             Authorization: `Bearer ${authToken}`,
//           },
//         }
//       );
//       fetchReimbursements();
//       return response.data;
//     } catch (error) {
//       console.error("Error updating reimbursement:", error);
//       const msg =
//         error?.response?.data?.message ||
//         error.message ||
//         "An unexpected error occurred.";
//       setUpdateErrorMessage(msg);
//       showAlert(msg);
//       throw error;
//     }
//   };
//   const deleteReimbursement = async (id) => {
//     if (!id) {
//       console.error("Error: Reimbursement ID is missing.");
//       return;
//     }
//     showConfirm(
//       "Are you sure you want to delete this reimbursement claim?",
//       async () => {
//         try {
//           const response = await axios.delete(
//             `${BACKEND_URL}/reimbursement/${id}`,
//             {
//               headers: {
//                 "x-api-key": API_KEY,
//                 "x-org-id": orgId,
//                 Authorization: `Bearer ${authToken}`,
//               },
//             }
//           );
//           showAlert(
//             response.data.message || "Reimbursement deleted successfully!"
//           );
//           fetchReimbursements();
//         } catch (error) {
//           console.error("Error deleting reimbursement:", error);
//           showAlert("There was an issue deleting the reimbursement.");
//         } finally {
//           closeConfirm();
//         }
//       }
//     );
//   };
//   const handleOpenAttachments = async (files, claim) => {
//     try {
//       const fetchedFiles = await Promise.all(
//         (files || []).map(async (file) => {
//           if (!file?.file_name && !file?.file_name) return null;
//           const fname = file.file_name || file.fileName || file.name;
//           const match = fname.match(/^(\d{4})-(\d{2})/);
//           if (!match) return null;
//           const [, year, month] = match;
//           // org/year/month/emp/file_name layout: pick org from file.orgId if available,
//           // otherwise try extracting from file_path similarly
//           let fileOrg = file.orgId || "";
//           if (!fileOrg && file.file_path) {
//             const parts = (file.file_path || "").split("/").filter(Boolean);
//             const idx = parts.findIndex((p) => p === "reimbursement");
//             if (idx !== -1 && parts.length >= idx + 5) {
//               fileOrg = parts[idx + 1];
//             } else if (parts.length >= 5) {
//               // fallback heuristic: org may be at -5
//               fileOrg = parts[parts.length - 5] || "";
//             }
//           }
//           // prefer the orgId we have in the client context if nothing extracted
//           if (!fileOrg) fileOrg = orgId || "";
//           const empId = claim.employee_id || claim.employeeId || "";
//           const url = `${BACKEND_URL}/reimbursement/${fileOrg}/${year}/${month}/${empId}/${fname}`;
//           const response = await axios.get(url, {
//             headers: {
//               "x-api-key": API_KEY,
//               Authorization: `Bearer ${authToken}`,
//               "x-org-id": fileOrg || orgId,
//               "x-employee-id": employeeId,
//             },
//             responseType: "blob",
//           });
//           return {
//             name: fname,
//             url: URL.createObjectURL(
//               new Blob([response.data], {
//                 type: response.headers["content-type"],
//               })
//             ),
//           };
//         })
//       );
//       const validFiles = fetchedFiles.filter(Boolean);
//       if (!validFiles.length)
//         return showAlert("No valid attachments could be loaded.");
//       setSelectedFiles(validFiles);
//       setSelectedClaim(claim);
//       setIsModalOpen(true);
//     } catch (error) {
//       console.error("Error fetching attachments:", error);
//       showAlert("Could not load attachments. Please try again.");
//     }
//   };
//   // Use filteredReimbursements (NOT reimbursements) for display and totals
//   const filterClaims = filteredReimbursements || [];
//   const totalAmount = (filteredReimbursements || []).reduce((sum, claim) => {
//     const val = parseFloat(claim.total_amount);
//     return sum + (isNaN(val) ? 0 : val);
//   }, 0);
//   const approvedAmount = (filteredReimbursements || [])
//     .filter((c) => (c.status || "").toLowerCase() === "approved")
//     .reduce((sum, claim) => {
//       const val = parseFloat(claim.total_amount);
//       return sum + (isNaN(val) ? 0 : val);
//     }, 0);
//   const rejectedAmount = (filteredReimbursements || [])
//     .filter((c) => (c.status || "").toLowerCase() === "rejected")
//     .reduce((sum, claim) => {
//       const val = parseFloat(claim.total_amount);
//       return sum + (isNaN(val) ? 0 : val);
//     }, 0);

//   const renderPurposeAttachment = () => (
//     <div className="purpose-attachment">
//       <div className="pa-groups">
//         <label>
//           Purpose Details / Comments
//           <span className="asterisk">*</span>
//         </label>
//         <textarea
//           name="purpose"
//           value={formData.purpose}
//           onChange={handleChange}
//         />
//       </div>
//       <div className="pa-groups">
//         <label>Attachment</label>
//         <div className="attachment-wrapper">
//           <div className="file-links">
//             {selectedFiles.length > 0 ? (
//               selectedFiles.map((fileName, index) => (
//                 <p key={index} className="file-name">
//                   {fileName}
//                 </p>
//               ))
//             ) : (
//               <p>No files selected</p>
//             )}
//           </div>
//           <div className="attachment-upload">
//             <input
//               type="file"
//               multiple
//               ref={fileInputRef}
//               onChange={handleFileUpload}
//               style={{ display: "none" }}
//             />
//             <button
//               type="button"
//               className="custom-file-upload"
//               onClick={() =>
//                 fileInputRef.current && fileInputRef.current.click()
//               }
//             >
//               Browse
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   const renderDetails = () => {
//     switch (formData.claim_type) {
//       case "Transportation":
//         return (
//           <div className="rb-main-form">
//             <div className="rb-form-grid">
//               {renderDateFields()}
//               <div className="rb-groups">
//                 <label>
//                   Travel From<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="travel_from"
//                   value={formData.travel_from}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>
//                   Travel To<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="travel_to"
//                   value={formData.travel_to}
//                   onChange={handleChange}
//                 />
//               </div>
//               {formData.transport_type === "Outstation" && (
//                 <div className="rb-groups">
//                   <label>Transport Amount</label>
//                   <input
//                     type="number"
//                     name="transport_amount"
//                     value={formData.transport_amount}
//                     onChange={handleChange}
//                   />
//                 </div>
//               )}
//               {formData.transport_type === "Outstation" && (
//                 <div className="rb-groups">
//                   <label>Accommodation Fees</label>
//                   <input
//                     type="number"
//                     name="accommodation_fees"
//                     value={formData.accommodation_fees}
//                     onChange={handleChange}
//                   />
//                 </div>
//               )}
//               {formData.transport_type === "Outstation" && (
//                 <div className="rb-groups">
//                   <label>DA</label>
//                   <input
//                     type="number"
//                     name="da"
//                     value={formData.da}
//                     onChange={handleChange}
//                   />
//                 </div>
//               )}
//               <div className="rb-groups">
//                 <label>
//                   Total Amount<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="total_amount"
//                   value={formData.total_amount}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>
//         );
//       case "Meals":
//         return (
//           <div className="rb-main-form">
//             <div className="rb-form1-grid">
//               <div className="rb-groups">
//                 <label>
//                   Date<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="date"
//                   value={formData.date}
//                   onChange={handleChange}
//                   max={new Date(Date.now() - 86400000).toLocaleDateString(
//                     "en-CA"
//                   )}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>Meal Type</label>
//                 <select
//                   name="meal_type"
//                   value={formData.meal_type}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select</option>
//                   <option value="breakfast">Break Fast</option>
//                   <option value="lunch">Lunch</option>
//                   <option value="dinner">Dinner</option>
//                   <option value="Full Day">Full Day</option>
//                 </select>
//               </div>
//               <div className="rb-groups">
//                 <label>Meal's objective</label>
//                 <select
//                   name="meals_objective"
//                   value={formData.meals_objective}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select</option>
//                   <option value="client_visit">Client Visit</option>
//                   <option value="team_outing">Team Outing</option>
//                   <option value="extended_work">Extended</option>
//                   <option value="others">Others</option>
//                 </select>
//               </div>
//               <div className="rb-groups">
//                 <label>
//                   Total Amount<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="total_amount"
//                   value={formData.total_amount}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>
//         );
//       case "Telecommunication":
//         return (
//           <div className="rb-main-form">
//             <div className="rb-form2-grid">
//               <div className="rb-groups">
//                 <label>
//                   Date<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="date"
//                   value={formData.date}
//                   onChange={handleChange}
//                   max={new Date(Date.now() - 86400000).toLocaleDateString(
//                     "en-CA"
//                   )}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>Service Provider</label>
//                 <input
//                   type="text"
//                   name="service_provider"
//                   value={formData.service_provider}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>
//                   Total Amount<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="total_amount"
//                   value={formData.total_amount}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>
//         );
//       case "Stationary":
//         return (
//           <div className="rb-main-form">
//             <div className="rb-form1-grid">
//               <div className="rb-groups">
//                 <label>
//                   Date<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="date"
//                   value={formData.date}
//                   onChange={handleChange}
//                   max={new Date(Date.now() - 86400000).toLocaleDateString(
//                     "en-CA"
//                   )}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>Stationary</label>
//                 <select
//                   name="stationary"
//                   value={formData.stationary}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select</option>
//                   <option value="office equipments">Office Equipments</option>
//                   <option value="general stationary">General Stationary</option>
//                 </select>
//               </div>
//               <div className="rb-groups">
//                 <label>Purchasing Items</label>
//                 <input
//                   type="text"
//                   name="purchasing_item"
//                   value={formData.purchasing_item}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>
//                   Total Amount<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="total_amount"
//                   value={formData.total_amount}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>
//         );
//       case "Miscellaneous":
//         return (
//           <div className="rb-main-form">
//             <div className="rb-form1-grid">
//               <div className="rb-groups">
//                 <label>
//                   Date<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="date"
//                   value={formData.date}
//                   onChange={handleChange}
//                   max={new Date(Date.now() - 86400000).toLocaleDateString(
//                     "en-CA"
//                   )}
//                 />
//               </div>
//               <div className="rb-groups">
//                 <label>
//                   Total Amount<span className="asterisk">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="total_amount"
//                   value={formData.total_amount}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>
//         );
//       default:
//         return null;
//     }
//   };

//   const renderClaimSpecificFields = () => {
//     switch (formData.claim_type) {
//       case "Transportation":
//         return (
//           <>
//             <div className="sub-tabs">
//               {["Outstation", "Intercity", "Fuel"].map((type) => (
//                 <div
//                   key={type}
//                   className={`sub-tab ${
//                     formData.transport_type === type ? "active" : ""
//                   }`}
//                   onClick={() => handleTransportSubTypeChange(type)}
//                 >
//                   {type}
//                 </div>
//               ))}
//             </div>
//             {(formData.transport_type === "Intercity" ||
//               formData.transport_type === "Fuel") && (
//               <div className="rb-radio">
//                 <label>Select no of days</label>
//                 <div className="rb-radio-options">
//                   <label>
//                     <input
//                       type="radio"
//                       name="no_of_days"
//                       value="single"
//                       checked={formData.no_of_days === "single"}
//                       onChange={handleNoOfDaysChange}
//                     />
//                     Single
//                   </label>
//                   <label>
//                     <input
//                       type="radio"
//                       name="no_of_days"
//                       value="multiple"
//                       checked={formData.no_of_days === "multiple"}
//                       onChange={handleNoOfDaysChange}
//                     />
//                     Multiple
//                   </label>
//                 </div>
//               </div>
//             )}
//             {formData.transport_type && renderDetails()}
//             {formData.transport_type && renderPurposeAttachment()}
//           </>
//         );
//       case "Meals":
//         return (
//           <>
//             {renderDetails()}
//             {renderPurposeAttachment()}
//           </>
//         );
//       case "Telecommunication":
//         return (
//           <>
//             {renderDetails()}
//             {renderPurposeAttachment()}
//           </>
//         );
//       case "Stationary":
//         return (
//           <>
//             {renderDetails()}
//             {renderPurposeAttachment()}
//           </>
//         );
//       case "Miscellaneous":
//         return (
//           <>
//             {renderDetails()}
//             {renderPurposeAttachment()}
//           </>
//         );
//       default:
//         return null;
//     }
//   };

//   const renderMobileStep = (step) => {
//     if (step === 1) {
//       return (
//         <div className="claim-type">
//           <label>
//             Project<span className="asterisk">*</span>
//           </label>
//           <select
//             name="project"
//             value={formData.project}
//             onChange={handleChange}
//             required
//           >
//             <option value="">Select project</option>
//             <option value="Company Claim">Company Claim</option>
//             {projects.map((proj, i) => (
//               <option key={i} value={proj}>
//                 {proj}
//               </option>
//             ))}
//           </select>
//           <div className="rb-tabs">
//             {claimTypes.map(({ icon, label }) => (
//               <div
//                 key={label}
//                 className={`rb-tab ${
//                   formData.claim_type === label ? "active" : ""
//                 }`}
//                 onClick={() =>
//                   handleClaimTypeChange({ target: { value: label } })
//                 }
//               >
//                 {icon} {label}
//               </div>
//             ))}
//           </div>
//         </div>
//       );
//     }

//     if (formData.claim_type === "Transportation") {
//       if (step === 2) {
//         return (
//           <>
//             <div className="sub-tabs">
//               {["Outstation", "Intercity", "Fuel"].map((type) => (
//                 <div
//                   key={type}
//                   className={`sub-tab ${
//                     formData.transport_type === type ? "active" : ""
//                   }`}
//                   onClick={() => handleTransportSubTypeChange(type)}
//                 >
//                   {type}
//                 </div>
//               ))}
//             </div>
//             {(formData.transport_type === "Intercity" ||
//               formData.transport_type === "Fuel") && (
//               <div className="rb-radio">
//                 <label>Select no of days</label>
//                 <div className="rb-radio-options">
//                   <label>
//                     <input
//                       type="radio"
//                       name="no_of_days"
//                       value="single"
//                       checked={formData.no_of_days === "single"}
//                       onChange={handleNoOfDaysChange}
//                     />
//                     Single
//                   </label>
//                   <label>
//                     <input
//                       type="radio"
//                       name="no_of_days"
//                       value="multiple"
//                       checked={formData.no_of_days === "multiple"}
//                       onChange={handleNoOfDaysChange}
//                     />
//                     Multiple
//                   </label>
//                 </div>
//               </div>
//             )}
//           </>
//         );
//       } else if (step === 3) {
//         return renderDetails();
//       } else if (step === 4) {
//         return renderPurposeAttachment();
//       }
//     } else {
//       if (step === 2) {
//         return renderDetails();
//       } else if (step === 3) {
//         return renderPurposeAttachment();
//       }
//     }
//     return null;
//   };
//   // ------------ Render ------------
//   return (
//     <div className="reimbursement-container">
//       <div className="rb-form-header">
//         {role !== "Manager" && role !== "Admin" && (
//           <h2>Reimbursement Requests</h2>
//         )}
//       </div>
//       <div className="filter-container">
//         <label>Status By</label>
//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//         >
//           <option value="pending">Pending</option>
//           <option value="approved">Approved</option>
//           <option value="rejected">Rejected</option>
//         </select>
//         <label>Date From</label>
//         <input
//           type="date"
//           value={fromDate}
//           onChange={(e) => setFromDate(e.target.value)}
//         />
//         <label>To</label>
//         <input
//           type="date"
//           value={toDate}
//           onChange={(e) => setToDate(e.target.value)}
//         />
//         <button className="search-btn" onClick={applyFilters}>
//           <FaSearch /> Search
//         </button>
//         <button
//           className="apply-btn"
//           onClick={() => {
//             setSubmitErrorMessage("");
//             setUpdateErrorMessage("");
//             setSelectedFiles([]);
//             setShowForm(true);
//             setEditingId(null);
//             setFormData({
//               employeeId,
//               department_id: departmentId,
//               claim_type: "",
//               transport_type: "",
//               fromDate: "",
//               toDate: "",
//               date: "",
//               travel_from: "",
//               travel_to: "",
//               meals_objective: "",
//               purpose: "",
//               purchasing_item: "",
//               accommodation_fees: "",
//               no_of_days: "",
//               total_amount: "",
//               meal_type: "",
//               stationary: "",
//               service_provider: "",
//               project: "",
//               attachments: null,
//             });
//           }}
//         >
//           Apply Claim
//         </button>
//       </div>
//       {errorMessage && <p className="rb-error-message">{errorMessage}</p>}
//       <div className="reimbursement-table-scroll">
//         <table className="reimbursement-table">
//           <thead>
//             <tr>
//               <th>Sl No</th>
//               <th>Claim Type</th>
//               <th>Date</th>
//               <th>Purpose</th>
//               <th>Amount</th>
//               <th>Attachment</th>
//               <th>Status</th>
//               <th>Comments</th>
//               <th>Payment Status</th>
//               <th>Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filterClaims.map((claim, index) => (
//               <tr key={claim.id}>
//                 <td>{index + 1}</td>
//                 <td>{claim.claim_type}</td>
//                 <td>
//                   {claim.date_range
//                     ? claim.date_range
//                         .split(" - ")
//                         .map(formatDisplayDate)
//                         .join(" - ")
//                     : claim.date
//                     ? formatDisplayDate(claim.date)
//                     : claim.from_date && claim.to_date
//                     ? `${formatDisplayDate(
//                         claim.from_date
//                       )} - ${formatDisplayDate(claim.to_date)}`
//                     : "N/A"}
//                 </td>
//                 <td>
//                   <div className="rbadmin-comments">{claim.purpose}</div>
//                 </td>
//                 <td>{claim.total_amount}</td>
//                 <td>
//                   {attachments[claim.id]?.length > 0 ? (
//                     <button
//                       className="attachments-btn"
//                       onClick={() =>
//                         handleOpenAttachments(attachments[claim.id], claim)
//                       }
//                     >
//                       <MdOutlineRemoveRedEye className="eye-icon" /> View
//                     </button>
//                   ) : (
//                     "Not Attached"
//                   )}
//                 </td>
//                 <td>
//                   <span
//                     className={`rb-status-label ${
//                       claim.status === "approved"
//                         ? "rb-approved"
//                         : claim.status === "rejected"
//                         ? "rb-rejected"
//                         : ""
//                     }`}
//                   >
//                     {claim.status}
//                   </span>
//                 </td>
//                 <td>
//                   <div className="rbadmin-comments">
//                     {claim.approver_comments || "No comments"}
//                   </div>
//                 </td>
//                 <td>{claim.payment_status}</td>
//                 <td className="actions-column">
//                   <MdOutlineEdit
//                     className={`edit-icon ${
//                       claim.status && claim.status.toLowerCase() !== "pending"
//                         ? "disabled-icon"
//                         : ""
//                     }`}
//                     onClick={() => {
//                       if (
//                         claim.status &&
//                         claim.status.toLowerCase() === "pending"
//                       ) {
//                         handleEdit(claim);
//                         setShowForm(true);
//                       }
//                     }}
//                   />
//                   <MdDeleteOutline
//                     className={`delete-icon ${
//                       claim.status && claim.status.toLowerCase() !== "pending"
//                         ? "disabled-icon"
//                         : ""
//                     }`}
//                     onClick={() => {
//                       if (
//                         claim.status &&
//                         claim.status.toLowerCase() === "pending"
//                       )
//                         deleteReimbursement(claim.id);
//                     }}
//                   />
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//           <tfoot>
//             <tr className="total-row">
//               <td
//                 colSpan="4"
//                 style={{
//                   textAlign: "right",
//                   color: "#949494",
//                   fontWeight: "bold",
//                 }}
//               >
//                 Total Amount Claiming:{" "}
//                 <span style={{ fontWeight: "bold", color: "black" }}>
//                   Rs {totalAmount}
//                 </span>
//               </td>
//               <td colSpan="3" style={{ textAlign: "right" }}>
//                 Amount Approved: Rs{" "}
//                 <span style={{ fontWeight: "bold" }}>{approvedAmount}</span>
//               </td>
//               <td colSpan="3" style={{ textAlign: "right" }}>
//                 Amount Rejected: Rs{" "}
//                 <span style={{ fontWeight: "bold" }}>{rejectedAmount}</span>
//               </td>
//             </tr>
//           </tfoot>
//         </table>
//         {/* Mobile cards */}
//         <div className="rb-reimbursement-cards">
//           {filterClaims.map((claim, index) => (
//             <div className="rb-reimbursement-card" key={claim.id}>
//               <div className="rb-card-header">
//                 <span className={`rb-status ${claim.status?.toLowerCase()}`}>
//                   {claim.status}
//                 </span>
//               </div>
//               <div className="rb-card-body">
//                 <p>
//                   <strong>Sl No:</strong> {index + 1}
//                 </p>
//                 <p>
//                   <strong>Claim Type:</strong> {claim.claim_type}
//                 </p>
//                 <p>
//                   <strong>Date:</strong>{" "}
//                   {claim.date ? formatDisplayDate(claim.date) : "N/A"}
//                 </p>
//                 <p>
//                   <strong>Purpose:</strong> {claim.purpose}
//                 </p>
//                 <p>
//                   <strong>Amount:</strong> Rs {claim.total_amount}
//                 </p>
//                 <p>
//                   <strong>Comments:</strong>{" "}
//                   {claim.approver_comments || "No comments"}
//                 </p>
//               </div>
//               <div className="rb-card-footer">
//                 {attachments[claim.id]?.length > 0 ? (
//                   <button
//                     className="rb-attachments-btn"
//                     onClick={() =>
//                       handleOpenAttachments(attachments[claim.id], claim)
//                     }
//                   >
//                     <MdOutlineRemoveRedEye className="rb-eye-icon" /> View
//                   </button>
//                 ) : (
//                   <span className="rb-no-attachment">No Attachment</span>
//                 )}
//                 {claim.status && claim.status.toLowerCase() === "pending" && (
//                   <div className="rb-card-actions">
//                     <MdOutlineEdit
//                       className="rb-edit-icon"
//                       onClick={() => {
//                         handleEdit(claim);
//                         setShowForm(true);
//                       }}
//                     />
//                     <MdDeleteOutline
//                       className="rb-delete-icon"
//                       onClick={() => deleteReimbursement(claim.id)}
//                     />
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//       {/* Form modal */}
//       {showForm && (
//         <div className="rb-modal">
//           <div className="rb-modal-content">
//             <div className="claim-form-header">
//               <h2 className="claim-form-title">
//                 {editingId ? "Edit Reimbursement" : "New Reimbursement"}
//               </h2>
//               <MdOutlineCancel
//                 className="claim-form-close"
//                 onClick={() => setShowForm(false)}
//               />
//             </div>
//             {submitErrorMessage && (
//               <p className="rb-error-message">{submitErrorMessage}</p>
//             )}
//             {updateErrorMessage && (
//               <p className="rb-error-message">{updateErrorMessage}</p>
//             )}
//             <form className="reimbursement-form" onSubmit={isMobile ? handleStepSubmit : handleSubmit}>
//               {!isMobile ? (
//                 <>
//                   <div className="claim-type">
//                     <label>
//                       Project<span className="asterisk">*</span>
//                     </label>
//                     <select
//                       name="project"
//                       value={formData.project}
//                       onChange={handleChange}
//                       required
//                     >
//                       <option value="">Select project</option>
//                       <option value="Company Claim">Company Claim</option>
//                       {projects.map((proj, i) => (
//                         <option key={i} value={proj}>
//                           {proj}
//                         </option>
//                       ))}
//                     </select>
//                     <div className="rb-tabs">
//                       {claimTypes.map(({ icon, label }) => (
//                         <div
//                           key={label}
//                           className={`rb-tab ${
//                             formData.claim_type === label ? "active" : ""
//                           }`}
//                           onClick={() =>
//                             handleClaimTypeChange({ target: { value: label } })
//                           }
//                         >
//                           {icon} {label}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                   {renderClaimSpecificFields()}
//                   <div className="reimbursement-form-button">
//                     <button
//                       type="button"
//                       className="rb-close"
//                       onClick={() => setShowForm(false)}
//                     >
//                       Cancel
//                     </button>
//                     <button type="submit" className="rb-submit">
//                       {editingId ? "Update" : "Submit"}
//                     </button>
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   {renderMobileStep(currentStep)}
//                   <div className="reimbursement-form-button">
//                     <button
//                       type="button"
//                       className="rb-close"
//                       onClick={() => setShowForm(false)}
//                     >
//                       Cancel
//                     </button>
//                     {currentStep > 1 && (
//                       <button
//                         type="button"
//                         className="rb-prev"
//                         onClick={() => setCurrentStep(currentStep - 1)}
//                       >
//                         Previous
//                       </button>
//                     )}
//                     <button type="submit" className="rb-submit">
//                       {currentStep < getTotalSteps() ? "Next" : (editingId ? "Update" : "Submit")}
//                     </button>
//                   </div>
//                 </>
//               )}
//             </form>
//           </div>
//         </div>
//       )}
//       {/* Attachments modal */}
//       {isModalOpen && (
//         <div className="att-modal-overlay">
//           <div className="att-modal-content">
//             <div className="att-header">
//               <h2>Attachments</h2>
//               <MdOutlineCancel
//                 className="att-close"
//                 onClick={() => setIsModalOpen(false)}
//               />
//             </div>
//             <h4 className="att-files">
//               {selectedClaim?.claim_type
//                 ? `${selectedClaim.claim_type} Bills`
//                 : "Bills"}
//             </h4>
//             {selectedFiles.length > 0 ? (
//               selectedFiles.map((file, idx) => (
//                 <div className="att-files" key={idx}>
//                   <a href={file.url} target="_blank" rel="noopener noreferrer">
//                     {file.name}
//                   </a>
//                 </div>
//               ))
//             ) : (
//               <p>No attachments available</p>
//             )}
//             <button
//               className="att-close-btn"
//               onClick={() => setIsModalOpen(false)}
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}
//       <Modal
//         isVisible={confirmModal.isVisible}
//         onClose={closeConfirm}
//         buttons={[
//           { label: "Cancel", onClick: closeConfirm },
//           { label: "Confirm", onClick: confirmModal.onConfirm },
//         ]}
//       >
//         <p>{confirmModal.message}</p>
//       </Modal>
//       <Modal
//         isVisible={alertModal.isVisible}
//         onClose={closeAlert}
//         buttons={[{ label: "OK", onClick: closeAlert }]}
//       >
//         <p>{alertModal.message}</p>
//       </Modal>
//     </div>
//   );
// };
// export default Reimbursement;


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
  const [expandedCard, setExpandedCard] = useState(null); // Add this line
  const [formData, setFormData] = useState({
    employeeId: employeeId,
    department_id: departmentId,
    claim_type: "",
    transport_type: "",
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
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showForm) {
      setCurrentStep(1);
    }
  }, [showForm]);

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
  const handleStepSubmit = (e) => {
    e.preventDefault();
    if (currentStep < getTotalSteps()) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit(e);
    }
  };
  const getTotalSteps = () => {
    if (!formData.claim_type) return 1;
    return formData.claim_type === "Transportation" ? 4 : 3;
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

  const renderPurposeAttachment = () => (
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
  );

  const renderDetails = () => {
    switch (formData.claim_type) {
      case "Transportation":
        return (
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
          </div>
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
          </div>
        );
      default:
        return null;
    }
  };

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
            {formData.transport_type && renderDetails()}
            {formData.transport_type && renderPurposeAttachment()}
          </>
        );
      case "Meals":
        return (
          <>
            {renderDetails()}
            {renderPurposeAttachment()}
          </>
        );
      case "Telecommunication":
        return (
          <>
            {renderDetails()}
            {renderPurposeAttachment()}
          </>
        );
      case "Stationary":
        return (
          <>
            {renderDetails()}
            {renderPurposeAttachment()}
          </>
        );
      case "Miscellaneous":
        return (
          <>
            {renderDetails()}
            {renderPurposeAttachment()}
          </>
        );
      default:
        return null;
    }
  };

  const renderMobileStep = (step) => {
    if (step === 1) {
      return (
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
            <option value="Company Claim">Company Claim</option>
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
      );
    }

    if (formData.claim_type === "Transportation") {
      if (step === 2) {
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
          </>
        );
      } else if (step === 3) {
        return renderDetails();
      } else if (step === 4) {
        return renderPurposeAttachment();
      }
    } else {
      if (step === 2) {
        return renderDetails();
      } else if (step === 3) {
        return renderPurposeAttachment();
      }
    }
    return null;
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
 
  <label>Filter by Status</label>
  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
    <option value="">All</option>
    <option value="pending">Pending</option>
    <option value="approved">Approved</option>
    <option value="rejected">Rejected</option>
  </select>

  <label>From Date</label>
  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

  <label>To Date</label>
  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

  <button className="search-btn" onClick={applyFilters}>
    Search
  </button>

  <button className="apply-btn" onClick={() => setShowForm(true)}>
    + Apply Claim
  </button>

  {/* This extra row appears ONLY on mobile */}
  <div className="mobile-only-filter-row">
    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
      <option value="">All</option>
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
    </select>

    <button className="apply-btn" onClick={() => setShowForm(true)}>
      + Apply Claim
    </button>
  </div>

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
       <div className="mobile-cards">
    {filteredReimbursements.map((claim) => (
      <div
        key={claim.id}
        className={`expense-card ${expandedCard === claim.id ? "open" : ""}`}
        onClick={() => setExpandedCard(expandedCard === claim.id ? null : claim.id)}
      >
        {/* Top Compact Row */}
        <div className="card-top">
          <div className="left">
            {/* Replace the .icon div with this – 100% working, no import needed */}
<div className="icon">
{claim.claim_type === "Transportation" && <MdEmojiTransportation />}
              {claim.claim_type === "Meals" && <GiKnifeFork />}
              {claim.claim_type === "Telecommunication" && <MdOutlinePhoneAndroid />}
              {claim.claim_type === "Stationary" && <GiPencilBrush />}
              {claim.claim_type === "Miscellaneous" && <TbTriangleSquareCircle />}
</div>
            <div>
              <div className="title">{claim.claim_type}</div>
              <div className="date">{formatDisplayDate(claim.date || claim.from_date)}</div>
            </div>
          </div>

          <div className="right">
            <div className="amount">₹{claim.total_amount}</div>
            <div className={`tag ${claim.status?.toLowerCase() || "pending"}`}>
              {claim.status || "Pending"}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        <div className="card-expand">
          <div className="info">
            <div><span>Purpose</span> <span>{claim.purpose || "—"}</span></div>
            <div><span>Comments</span> <span>{claim.approver_comments || "None"}</span></div>
          </div>

          <div className="card-bottom">
            <div>
              {attachments[claim.id]?.length > 0 ? (
                <button
                  className="bills-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAttachments(attachments[claim.id], claim);
                  }}
                >
                  View Bills ({attachments[claim.id].length})
                </button>
              ) : (
                <span className="no-bill">No bills attached</span>
              )}
            </div>

            {claim.status?.toLowerCase() === "pending" && (
              <div className="icons">
                <MdOutlineEdit
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(claim);
                    setShowForm(true);
                  }}
                />
                <MdDeleteOutline
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteReimbursement(claim.id);
                  }}
                />
              </div>
            )}
          </div>
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
            <form className="reimbursement-form" onSubmit={isMobile ? handleStepSubmit : handleSubmit}>
              {!isMobile ? (
                <>
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
                      <option value="Company Claim">Company Claim</option>
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
                </>
              ) : (
                <>
                  {renderMobileStep(currentStep)}
                  <div className="reimbursement-form-button">
                    <button
                      type="button"
                      className="rb-close"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                    {currentStep > 1 && (
                      <button
                        type="button"
                        className="rb-prev"
                        onClick={() => setCurrentStep(currentStep - 1)}
                      >
                        Previous
                      </button>
                    )}
                    <button type="submit" className="rb-submit">
                      {currentStep < getTotalSteps() ? "Next" : (editingId ? "Update" : "Submit")}
                    </button>
                  </div>
                </>
              )}
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