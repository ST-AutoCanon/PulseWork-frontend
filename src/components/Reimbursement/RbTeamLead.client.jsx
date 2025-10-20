"use client";

import React, { useState, useEffect } from "react";
import { FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { FaFileInvoice } from "react-icons/fa6";
import { MdOutlineCancel, MdOutlineRemoveRedEye } from "react-icons/md";
import axios from "axios";

import Reimbursement from "./Reimbursement.client";
import "./RbTeamLead.css";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

const RbTeamLead = () => {
  const { user } = useAuth();
  const orgId = user?.orgId;
  const teamLeadId = user?.employeeId;
  const departmentId = user?.dashboard.department_id || null;

  const [view, setView] = useState("team");
  const [employees, setEmployees] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [submittedFrom, setSubmittedFrom] = useState("");
  const [submittedTo, setSubmittedTo] = useState("");
  const [attachments, setAttachments] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [comments, setComments] = useState({});
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentClaim, setSelectedPaymentClaim] = useState(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectSelections, setProjectSelections] = useState({});
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const formatDisplayDate = (raw) => {
    if (!raw) return "N/A";
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d)) return raw;
    const dd = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleString("en-GB", { month: "short" });
    const yy = d.getFullYear();
    return `${dd}-${mon}-${yy}`;
  };

  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/projectdrop`, {
          headers: {
            "x-api-key": API_KEY,
            "x-org-id": orgId,
          },
        });
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, [BACKEND_URL, API_KEY, orgId]);

  useEffect(() => {
    if (view === "team") fetchEmployees();
  }, [view, submittedFrom, submittedTo, statusFilter]);

  const fetchEmployees = async () => {
    if (!teamLeadId) return;
    try {
      const response = await axios.get(
        `${BACKEND_URL}/team/${teamLeadId}/reimbursements`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
            "x-org-id": orgId,
            Authorization: `Bearer ${user?.token}`,
          },
          params: {
            departmentId,
            submittedFrom: submittedFrom || null,
            submittedTo: submittedTo || null,
          },
        }
      );

      const grouped = response.data.reduce((acc, claim) => {
        const empId = claim.employee_id;
        if (!acc[empId]) acc[empId] = { employee_id: empId, claims: [] };
        acc[empId].claims.push(claim);
        return acc;
      }, {});
      setEmployees(Object.values(grouped));

      const attachmentsMap = {};
      response.data.forEach((claim) => {
        attachmentsMap[claim.id] = claim.attachments || [];
      });
      setAttachments(attachmentsMap);
    } catch (error) {
      console.error("Error fetching employees:", error);
      showAlert("Error fetching employees.");
    }
  };

  const toggleRow = (employeeId) => {
    setExpandedRows((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }));
  };

  const handleOpenAttachments = async (files, claim) => {
    if (!files || files.length === 0) {
      showAlert("No attachments available.");
      return;
    }
    try {
      const fetchedFiles = await Promise.all(
        files.map(async (file) => {
          if (!file?.filename) return null;
          const match = file.filename.match(/^(\d{4})-(\d{2})-\d{2}/);
          if (!match) return null;
          const [year, month] = match.slice(1, 3);
          const fileUrl = `${BACKEND_URL}/reimbursement/${year}/${month}/${claim.employee_id}/${file.filename}`;
          const response = await axios.get(fileUrl, {
            headers: {
              "x-api-key": API_KEY,
              "x-org-id": orgId,
              Authorization: `Bearer ${user?.token}`,
            },
            responseType: "blob",
          });
          return {
            name: file.filename,
            url: URL.createObjectURL(
              new Blob([response.data], {
                type: response.headers["content-type"],
              })
            ),
          };
        })
      );
      setSelectedFiles(fetchedFiles.filter(Boolean));
      setSelectedClaim(claim);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      showAlert("No attachments found for this claim.");
    }
  };

  const handleStatusChange = (id, value) => {
    setStatusUpdates((prev) => ({ ...prev, [id]: value }));
  };

  const applyPaymentUpdateToState = (reimbursementId, update) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        const newClaims = emp.claims.map((c) =>
          String(c.id) === String(reimbursementId) ? { ...c, ...update } : c
        );
        return { ...emp, claims: newClaims };
      })
    );
  };

  const updateStatus = async (id) => {
    const updatedStatus = statusUpdates[id];
    if (!updatedStatus) return showAlert("Please select a status.");
    const project = projectSelections[id] || "";
    if (!project) return showAlert("Please select a project.");
    const approverId = user?.employeeId;
    if (!approverId) return showAlert("Approver ID is missing!");

    try {
      await axios.put(
        `${BACKEND_URL}/reimbursement/status/${id}`,
        {
          status: updatedStatus,
          approver_comments: comments?.[id] || "",
          approver_id: approverId,
          project,
        },
        {
          headers: {
            "x-api-key": API_KEY,
            "x-org-id": orgId,
          },
        }
      );
      showAlert(`Reimbursement ${updatedStatus} successfully.`);
      fetchEmployees();
    } catch (error) {
      console.error("Error updating status:", error);
      showAlert("Status update failed. Try again later.");
    }
  };

  const updatePaymentStatus = async (claimId, selectedOption) => {
    try {
      const res = await axios.put(
        `${BACKEND_URL}/reimbursement/payment-status/${claimId}`,
        {
          payment_status: selectedOption === "paid" ? "paid" : "pending",
          user_role: "Manager",
        },
        { headers: { "x-api-key": API_KEY, "x-org-id": orgId } }
      );

      const returned = (res.data && (res.data.data || res.data)) || {};

      const newStatus =
        returned.payment_status ||
        (selectedOption === "paid" ? "paid" : "pending");
      const paidDate = returned.paid_date || returned.paidDate || null;

      applyPaymentUpdateToState(claimId, {
        payment_status: newStatus,
        paid_date: paidDate,
      });

      showAlert("Payment status updated successfully.");
      return { success: true, returned };
    } catch (err) {
      console.error("Error updating payment status:", err);
      showAlert("Could not update payment status. Please try again.");
      return { success: false };
    }
  };

  const handleDownloadPDF = async (claim) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/download/${claim.id}`, {
        headers: { "x-api-key": API_KEY, "x-org-id": orgId },
        responseType: "blob",
      });
      let filename = `Reimbursement_${claim.id}.pdf`;
      const cd = response.headers["content-disposition"];
      if (cd) {
        const matches = /filename[^;=\n]*=(['"]?)([^;\n]*)\1/.exec(cd);
        if (matches && matches[2]) filename = matches[2];
      }
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading reimbursement PDF:", error);
      showAlert("There was an issue downloading the file.");
    }
  };

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
          <div className="rb-filters">
            <div className="rb-filter-group">
              <label>Status By</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="rb-filter-group">
              <label>Submitted From:</label>
              <input
                type="date"
                value={submittedFrom}
                onChange={(e) => setSubmittedFrom(e.target.value)}
              />
            </div>
            <div className="rb-filter-group">
              <label>Submitted To</label>
              <input
                type="date"
                value={submittedTo}
                onChange={(e) => setSubmittedTo(e.target.value)}
              />
            </div>
            <button className="rb-search" onClick={fetchEmployees}>
              <FaSearch /> Search
            </button>
          </div>

          <div className="rb-atable-container">
            {employees.map((employee) => {
              const filteredClaims = employee.claims.filter(
                (rb) =>
                  (rb.status || "").toLowerCase() === statusFilter.toLowerCase()
              );
              if (filteredClaims.length === 0) return null;
              return (
                <div key={employee.employee_id} className="employee-section">
                  <div
                    className="employee-row"
                    onClick={() => toggleRow(employee.employee_id)}
                  >
                    <div className="empId-rows">
                      <span>{employee.claims[0].employee_name}</span>
                      <span>{employee.employee_id}</span>
                    </div>
                    <div className="emp-rows">
                      Total Amount Claiming: Rs{" "}
                      <span>
                        {filteredClaims
                          .reduce(
                            (sum, claim) =>
                              sum + parseFloat(claim.total_amount || 0),
                            0
                          )
                          .toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="emp-rows">
                      Amount Approved: Rs{" "}
                      <span>
                        {filteredClaims
                          .filter((claim) => claim.status === "approved")
                          .reduce(
                            (sum, claim) =>
                              sum + parseFloat(claim.total_amount || 0),
                            0
                          )
                          .toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="toggle-btn">
                      {expandedRows[employee.employee_id] ? (
                        <FaChevronUp className="drop-icon" />
                      ) : (
                        <FaChevronDown className="drop-icon" />
                      )}
                    </div>
                  </div>
                  {expandedRows[employee.employee_id] && (
                    <div className="reimbursement-table-scroll">
                      <div className="rb-sub-container">
                        <table className="rb-sub-table">
                          <thead>
                            <tr>
                              <th>Sl No</th>
                              <th>Claim Type</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Purpose</th>
                              <th>Attachments</th>
                              <th>Status</th>
                              <th>Projects</th>
                              <th>Approver Comments</th>
                              <th>Payment Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClaims.map((rb, index) => (
                              <tr key={rb.id}>
                                <td>{index + 1}</td>
                                <td>{rb.claim_type}</td>
                                <td>
                                  {rb.date_range
                                    ? rb.date_range
                                        .split(" - ")
                                        .map(formatDisplayDate)
                                        .join(" - ")
                                    : rb.date
                                    ? formatDisplayDate(rb.date)
                                    : "N/A"}
                                </td>
                                <td>₹{rb.total_amount}</td>
                                <td className="purpose-cell" title={rb.purpose}>
                                  {rb.purpose}
                                </td>
                                <td>
                                  {attachments[rb.id] &&
                                  attachments[rb.id].length > 0 ? (
                                    <button
                                      className="attachments-btn"
                                      onClick={() =>
                                        handleOpenAttachments(
                                          attachments[rb.id],
                                          rb
                                        )
                                      }
                                    >
                                      <MdOutlineRemoveRedEye className="eye-icon" />{" "}
                                      View
                                    </button>
                                  ) : (
                                    "Not Attached"
                                  )}
                                </td>
                                <td>
                                  {rb.status === "approved" ||
                                  rb.status === "rejected" ? (
                                    <span
                                      className={`status-label ${rb.status}`}
                                    >
                                      <span className="status-dot"></span>
                                      {rb.status.charAt(0).toUpperCase() +
                                        rb.status.slice(1)}
                                    </span>
                                  ) : (
                                    <select
                                      className="rb-status-dropdown"
                                      value={statusUpdates[rb.id] || rb.status}
                                      onChange={(e) =>
                                        handleStatusChange(
                                          rb.id,
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="">Pending</option>
                                      <option value="approved">Approve</option>
                                      <option value="rejected">Reject</option>
                                    </select>
                                  )}
                                </td>
                                <td>
                                  {rb.status === "approved" ||
                                  rb.status === "rejected" ? (
                                    <div className="rbadmin-comments">
                                      {projectSelections[rb.id] || rb.project}
                                    </div>
                                  ) : (
                                    <select
                                      className="rb-status-dropdown"
                                      value={projectSelections[rb.id] || ""}
                                      onChange={(e) =>
                                        setProjectSelections((prev) => ({
                                          ...prev,
                                          [rb.id]: e.target.value,
                                        }))
                                      }
                                    >
                                      <option value="">Select</option>
                                      <option value="Company Claim">
                                        Company Claim
                                      </option>
                                      {projects.map((project, index) => (
                                        <option key={index} value={project}>
                                          {project}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </td>

                                <td>
                                  {rb.status === "approved" ||
                                  rb.status === "rejected" ? (
                                    <div className="rbadmin-comments">
                                      {rb.approver_comments || "No comments"}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder="Enter comments"
                                      value={comments[rb.id] || ""}
                                      onChange={(e) =>
                                        setComments((prev) => ({
                                          ...prev,
                                          [rb.id]: e.target.value,
                                        }))
                                      }
                                    />
                                  )}
                                </td>
                                <td>
                                  {rb.status?.toLowerCase().trim() ===
                                  "approved" ? (
                                    !rb.payment_status ||
                                    rb.payment_status?.toLowerCase().trim() ===
                                      "pending" ? (
                                      <button
                                        className="pending-payment-btn"
                                        onClick={() => {
                                          setSelectedPaymentClaim(rb);
                                          setSelectedPaymentOption("");
                                          setIsPaymentModalOpen(true);
                                        }}
                                      >
                                        Pending
                                      </button>
                                    ) : (
                                      <span>
                                        {rb.payment_status
                                          ? rb.payment_status
                                              .charAt(0)
                                              .toUpperCase() +
                                            rb.payment_status.slice(1)
                                          : "N/A"}
                                        {rb.paid_date
                                          ? ` (${formatDisplayDate(
                                              rb.paid_date
                                            )})`
                                          : ""}
                                      </span>
                                    )
                                  ) : (
                                    <span>{rb.payment_status}</span>
                                  )}
                                </td>
                                <td>
                                  <FaFileInvoice
                                    size={24}
                                    className="update-btn"
                                    onClick={() => updateStatus(rb.id)}
                                    disabled={
                                      rb.status === "approved" ||
                                      rb.status === "rejected"
                                    }
                                  />
                                  <FiDownload
                                    size={24}
                                    className="download-btn"
                                    onClick={() => handleDownloadPDF(rb)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Reimbursement />
      )}
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
              selectedFiles.map((file, index) => (
                <div className="att-files" key={index}>
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

      {isPaymentModalOpen && (
        <Modal
          isVisible={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          buttons={[]}
        >
          <div className="payment-modal-content">
            <div className="payment-header">
              <h3>Update Payment Status</h3>
              <button
                className="modal-cross-btn"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                ✖
              </button>
            </div>
            <div className="payment-options">
              <label>
                <input
                  type="radio"
                  name="paymentOption"
                  value="paid"
                  checked={selectedPaymentOption === "paid"}
                  onChange={(e) => setSelectedPaymentOption(e.target.value)}
                />
                Payable
              </label>
              <label style={{ marginLeft: "20px" }}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="pending"
                  checked={selectedPaymentOption === "pending"}
                  onChange={(e) => setSelectedPaymentOption(e.target.value)}
                />
                Pending
              </label>
            </div>
            <p>I'll make sure to process the payment today</p>
            <button
              className="submit-payment-btn"
              onClick={async () => {
                if (!selectedPaymentOption) {
                  showAlert("Please select an option.");
                  return;
                }
                try {
                  const result = await updatePaymentStatus(
                    selectedPaymentClaim.id,
                    selectedPaymentOption
                  );

                  if (result.success) {
                    setIsPaymentModalOpen(false);
                  }
                } catch (error) {
                  console.error("Error updating payment status:", error);
                  showAlert(
                    "Payment status couldn't be updated at the moment."
                  );
                }
              }}
            >
              Submit
            </button>
          </div>
        </Modal>
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
