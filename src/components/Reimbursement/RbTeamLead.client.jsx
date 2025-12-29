"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { FaFileInvoice } from "react-icons/fa6";
import { MdOutlineCancel, MdOutlineRemoveRedEye } from "react-icons/md";

import "./RbTeamLead.css";
import Modal from "../Modal/Modal.client";
import Reimbursement from "./Reimbursement.client";
import ParticipantSelection from "./ParticipantSelection.client";
import { useAuth } from "../../context/AuthProvider.client";

const RbTeamLead = () => {
  const { user, hydrated } = useAuth();

  const teamLeadId = user?.employeeId || null;
  const departmentId = user?.orgId || user?.department_id || null;

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const axiosConfig = {
    withCredentials: true,
    headers: {
      "x-api-key": API_KEY || "",
      ...(teamLeadId ? { "x-employee-id": String(teamLeadId) } : {}),
    },
  };

  const [view, setView] = useState("team");
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentClaim, setSelectedPaymentClaim] = useState(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("");
  const [projects, setProjects] = useState([]);

  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [participantsForEdit, setParticipantsForEdit] = useState([]);
  const [participantsSaving, setParticipantsSaving] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  /* ---------------- DATA FETCH ---------------- */

  useEffect(() => {
    if (!hydrated) return;

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

    fetchProjects();
    fetchEmployeeOptions();
  }, [hydrated]);

  const fetchEmployees = async () => {
    if (!hydrated || !teamLeadId) return;

    try {
      const res = await axios.get(
        `${BACKEND}/team/${teamLeadId}/reimbursements`,
        {
          ...axiosConfig,
          params: {
            departmentId,
            submittedFrom: submittedFrom || null,
            submittedTo: submittedTo || null,
          },
        }
      );

      const flat = res.data || [];

      const grouped = flat
        .filter((c) => String(c.employee_id) !== String(teamLeadId))
        .reduce((acc, c) => {
          acc[c.employee_id] ||= {
            employee_id: c.employee_id,
            claims: [],
          };
          acc[c.employee_id].claims.push(c);
          return acc;
        }, {});

      setEmployees(Object.values(grouped));

      const att = {};
      flat.forEach((c) => (att[c.id] = c.attachments || []));
      setAttachments(att);
    } catch (e) {
      console.error(e);
      showAlert("Failed to fetch reimbursements.");
    }
  };

  useEffect(() => {
    if (view === "team") fetchEmployees();
  }, [view]);

  /* ---------------- HELPERS ---------------- */

  const toggleRow = (id) => setExpandedRows((p) => ({ ...p, [id]: !p[id] }));

  const toggleClaimExpand = (id) =>
    setExpandedClaims((p) => ({ ...p, [id]: !p[id] }));

  const parseAmount = (v) =>
    Number(
      String(v || 0)
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, "")
    ) || 0;

  const getClaimAmount = (c) =>
    parseAmount(c.aggregated_total ?? c.total_amount ?? c.total ?? 0);

  /* ---------------- ACTIONS ---------------- */

  const updateStatus = async (id) => {
    if (!statusUpdates[id]) {
      showAlert("Select a status");
      return;
    }

    try {
      await axios.put(
        `${BACKEND}/reimbursement/status/${id}`,
        {
          status: statusUpdates[id],
          approver_comments: comments[id] || "",
          approver_id: teamLeadId,
        },
        axiosConfig
      );
      showAlert("Status updated");
      fetchEmployees();
    } catch (e) {
      showAlert("Failed to update status");
    }
  };

  const handleDownloadPDF = async (claim) => {
    try {
      const res = await axios.get(`${BACKEND}/download/${claim.id}`, {
        ...axiosConfig,
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reimbursement_${claim.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showAlert("Download failed");
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="rb-admin">
      <h2>Reimbursement Requests</h2>

      <div className="tabs-container">
        <button
          className={`tab ${view === "team" ? "active" : ""}`}
          onClick={() => setView("team")}
        >
          Team
        </button>
        <button
          className={`tab ${view === "self" ? "active" : ""}`}
          onClick={() => setView("self")}
        >
          Self
        </button>
      </div>

      {view === "team" ? (
        <div className="rb-main">
          <button className="rb-search" onClick={fetchEmployees}>
            <FaSearch /> Search
          </button>

          <div className="rb-atable-container">
            {employees.map((emp) => (
              <div key={emp.employee_id} className="employee-section">
                <div
                  className="employee-row"
                  onClick={() => toggleRow(emp.employee_id)}
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
                      <FaFileInvoice onClick={() => updateStatus(c.id)} />
                      <FiDownload onClick={() => handleDownloadPDF(c)} />
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Reimbursement />
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

export default RbTeamLead;
