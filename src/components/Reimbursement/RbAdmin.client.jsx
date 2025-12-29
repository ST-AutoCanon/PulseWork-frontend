"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./RbAdmin.css";

import { MdOutlineRemoveRedEye, MdOutlineCancel } from "react-icons/md";
import { FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { FaFileInvoice } from "react-icons/fa6";

import Reimbursement from "./Reimbursement.client";
import Modal from "../Modal/Modal.client";
import ParticipantSelection from "./ParticipantSelection.client";
import { useAuth } from "../../context/AuthProvider.client";

/* ------------------------------------------------------- */

const RbAdmin = () => {
  const { user, hydrated } = useAuth();

  const employeeId = user?.employeeId || null;
  const userRole = user?.role?.toLowerCase?.() || "";
  const isHR = userRole === "hr";

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const axiosConfig = {
    withCredentials: true,
    headers: {
      "x-api-key": API_KEY || "",
      ...(employeeId ? { "x-employee-id": String(employeeId) } : {}),
    },
  };

  /* ---------------- STATE ---------------- */

  const [employees, setEmployees] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedClaims, setExpandedClaims] = useState({});
  const [submittedFrom, setSubmittedFrom] = useState("");
  const [submittedTo, setSubmittedTo] = useState("");
  const [attachments, setAttachments] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const [statusUpdates, setStatusUpdates] = useState({});
  const [comments, setComments] = useState({});
  const [paymentStatusUpdates, setPaymentStatusUpdates] = useState({});
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const [view, setView] = useState("all");
  const [projects, setProjects] = useState([]);
  const [projectSelections, setProjectSelections] = useState({});

  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [participantsForEdit, setParticipantsForEdit] = useState([]);
  const [participantsSaving, setParticipantsSaving] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentClaim, setSelectedPaymentClaim] = useState(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("");

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  /* ---------------- HELPERS ---------------- */

  const formatDisplayDate = (raw) => {
    if (!raw) return " ";
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return `${String(d.getDate()).padStart(2, "0")}-${d.toLocaleString(
      "en-GB",
      { month: "short" }
    )}-${d.getFullYear()}`;
  };

  const parseAmount = (v) =>
    Number(
      String(v || "")
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, "")
    ) || 0;

  const getClaimAmount = (claim) =>
    parseAmount(
      claim?.aggregated_total ?? claim?.total_amount ?? claim?.total ?? 0
    );

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    if (!hydrated) return;

    fetchEmployees();
    fetchProjects();
    fetchEmployeeOptions();
  }, [hydrated]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${BACKEND}/projectdrop`, axiosConfig);
      setProjects(res.data || []);
    } catch (e) {
      console.error("Project fetch failed", e);
    }
  };

  const fetchEmployeeOptions = async () => {
    try {
      const res = await axios.get(
        `${BACKEND}/reimbursement/employees`,
        axiosConfig
      );
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setEmployeeOptions(
        list.map((r) => ({
          employee_id: r.employee_id || r.id || r.employeeId,
          name:
            r.name ||
            r.employee_name ||
            `${r.first_name || ""} ${r.last_name || ""}`.trim(),
        }))
      );
    } catch {
      setEmployeeOptions([]);
    }
  };

  const fetchEmployees = async () => {
    if (!hydrated) return;

    try {
      const res = await axios.get(`${BACKEND}/reimbursements`, {
        ...axiosConfig,
        params: {
          submittedFrom: submittedFrom || null,
          submittedTo: submittedTo || null,
        },
      });

      setEmployees(res.data || []);

      const att = {};
      (res.data || []).forEach((emp) =>
        emp.claims?.forEach((c) => (att[c.id] = c.attachments || []))
      );
      setAttachments(att);
    } catch (e) {
      console.error(e);
      showAlert("Failed to fetch reimbursements.");
    }
  };

  /* ---------------- ATTACHMENTS ---------------- */

  const handleOpenAttachments = async (files, claim) => {
    try {
      const fetched = await Promise.all(
        (files || []).map(async (f) => {
          const name = f.filename || f.file_name;
          if (!name) return null;

          const m = name.match(/^(\d{4})-(\d{2})/);
          if (!m) return null;

          const url = `${BACKEND}/reimbursement/${m[1]}/${m[2]}/${claim.employee_id}/${name}`;
          const res = await axios.get(url, {
            ...axiosConfig,
            responseType: "blob",
          });

          return {
            name,
            url: URL.createObjectURL(res.data),
          };
        })
      );

      setSelectedFiles(fetched.filter(Boolean));
      setSelectedClaim(claim);
      setIsModalOpen(true);
    } catch {
      showAlert("Unable to load attachments.");
    }
  };

  /* ---------------- STATUS ---------------- */

  const updateStatus = async (id) => {
    if (!statusUpdates[id]) {
      showAlert("Select a status.");
      return;
    }

    try {
      await axios.put(
        `${BACKEND}/reimbursement/status/${id}`,
        {
          status: statusUpdates[id],
          approver_comments: comments[id] || "",
          approver_id: employeeId,
          project: projectSelections[id],
        },
        axiosConfig
      );
      showAlert("Status updated.");
      fetchEmployees();
    } catch {
      showAlert("Failed to update status.");
    }
  };

  const handleDownloadPDF = async (claim) => {
    try {
      const res = await axios.get(`${BACKEND}/download/${claim.id}`, {
        ...axiosConfig,
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reimbursement_${claim.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showAlert("Download failed.");
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="rb-admin">
      <h2>Reimbursement Requests</h2>

      <div className="tabs-container">
        <button
          className={`tab ${view === "all" ? "active" : ""}`}
          onClick={() => setView("all")}
        >
          All
        </button>
        <button
          className={`tab ${view === "self" ? "active" : ""}`}
          onClick={() => setView("self")}
        >
          Self
        </button>
      </div>

      {view === "all" ? (
        <div className="rb-atable-container">
          {employees.map((emp) => (
            <div key={emp.employee_id} className="employee-section">
              <div
                className="employee-row"
                onClick={() =>
                  setExpandedRows((p) => ({
                    ...p,
                    [emp.employee_id]: !p[emp.employee_id],
                  }))
                }
              >
                <span>{emp.employee_id}</span>
                {expandedRows[emp.employee_id] ? (
                  <FaChevronUp />
                ) : (
                  <FaChevronDown />
                )}
              </div>

              {expandedRows[emp.employee_id] &&
                emp.claims.map((c, i) => (
                  <div key={c.id} className="claim-main-row">
                    #{i + 1} – ₹{getClaimAmount(c)}
                    <FaFileInvoice
                      onClick={() => !isHR && updateStatus(c.id)}
                    />
                    <FiDownload onClick={() => handleDownloadPDF(c)} />
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <Reimbursement />
      )}

      {/* Alerts */}
      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>

      {/* Attachments */}
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
            {selectedFiles.map((f, i) => (
              <div key={i} className="att-files">
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  {f.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RbAdmin;
