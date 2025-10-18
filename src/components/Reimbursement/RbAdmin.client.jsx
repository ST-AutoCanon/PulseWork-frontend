"use client";

import React, { useEffect, useState } from "react";
import "./RbAdmin.css";
import { MdOutlineRemoveRedEye, MdOutlineCancel } from "react-icons/md";
import { FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { FaFileInvoice } from "react-icons/fa6";
import axios from "axios";
import Reimbursement from "./Reimbursement.client";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

const RbAdmin = () => {
  const { user } = useAuth();
  const orgId = user?.orgId || user?.org_id || null;
  const employeeId = user?.employeeId;

  const [employees, setEmployees] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [submittedFrom, setSubmittedFrom] = useState("");
  const [submittedTo, setSubmittedTo] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [paymentStatusUpdates, setPaymentStatusUpdates] = useState({});
  const [comments, setComments] = useState({});
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentClaim, setSelectedPaymentClaim] = useState(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("");
  const [view, setView] = useState("all");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projectSelections, setProjectSelections] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const formatDisplayDate = (raw) => {
    if (!raw) return "N/A";
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d)) return raw;
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleString("en-GB", { month: "short" });
    const year = d.getFullYear();
    return `${day}-${mon}-${year}`;
  };

  const filteredEmployees = employees
    .map((emp) => ({
      ...emp,
      claims: emp.claims.filter((claim) => {
        const status = claim.status?.toLowerCase().trim();
        const pay = claim.payment_status?.toLowerCase().trim();

        switch (statusFilter) {
          case "approved":
            return status === "approved";
          case "rejected":
            return status === "rejected";
          case "pending":
            return status === "pending";
          case "approved_pending":
            return status === "approved" && pay === "pending";
          case "approved_paid":
            return status === "approved" && pay === "paid";
          default:
            return false;
        }
      }),
    }))
    .filter((emp) => emp.claims.length > 0)
    .filter((emp) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const name = (emp.claims[0]?.employee_name || "").toLowerCase();
      const idStr = String(emp.employee_id).toLowerCase();
      return name.includes(q) || idStr.includes(q);
    });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const headers = {
          "x-api-key": API_KEY,
          ...(orgId ? { "x-org-id": orgId } : {}),
        };
        const response = await axios.get(`${BACKEND_URL}/projectdrop`, {
          headers,
        });
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, [BACKEND_URL, API_KEY]);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  useEffect(() => {
    if (!employeeId) return;
    fetchEmployees();
  }, [employeeId, submittedFrom, submittedTo, orgId, user]);

  const fetchEmployees = async () => {
    try {
      const params = {
        submittedFrom: submittedFrom || null,
        submittedTo: submittedTo || null,
        ...(orgId ? { orgId } : {}),
      };
      const headers = {
        "x-api-key": API_KEY,
        ...(orgId ? { "x-org-id": orgId } : {}),
      };

      const response = await axios.get(`${BACKEND_URL}/reimbursements`, {
        headers,
        params,
      });
      setEmployees(response.data);

      const attachmentsMap = {};
      const initialProjects = {};
      response.data.forEach((emp) =>
        emp.claims.forEach((claim) => {
          attachmentsMap[claim.id] = claim.attachments || [];
          if (claim.project) initialProjects[claim.id] = claim.project;
        })
      );
      setAttachments(attachmentsMap);
      setProjectSelections(initialProjects);
    } catch (error) {
      console.error(error);
      showAlert("Error fetching employees.");
    }
  };

  const toggleRow = (employeeId) =>
    setExpandedRows((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }));

  const handleOpenAttachments = async (files, claim) => {
    if (!files || files.length === 0)
      return showAlert("No attachments available.");
    try {
      const authToken = user?.token;
      const fetchedFiles = await Promise.all(
        files.map(async (file) => {
          if (!file?.filename) return null;
          const match = file.filename.match(/^(\d{4})-(\d{2})-\d{2}/);
          if (!match) return null;
          const year = match[1];
          const month = match[2];
          const fileUrl = `${BACKEND_URL}/reimbursement/${orgId}/${year}/${month}/${claim.employee_id}/${file.filename}`;
          const response = await axios.get(fileUrl, {
            headers: {
              "x-api-key": API_KEY,
              "x-employee-id": employeeId,
              Authorization: `Bearer ${authToken}`,
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
      console.error(error);
      showAlert("No attachments found for this claim.");
    }
  };

  const totalAmount = employees.reduce(
    (sum, employee) =>
      sum +
      employee.claims.reduce(
        (claimSum, claim) => claimSum + parseFloat(claim.total_amount || 0),
        0
      ),
    0
  );

  const approvedAmount = employees.reduce(
    (sum, employee) =>
      sum +
      employee.claims
        .filter((claim) => claim.status === "approved")
        .reduce(
          (claimSum, claim) => claimSum + parseFloat(claim.total_amount || 0),
          0
        ),
    0
  );

  const handleStatusChange = (id, value) => {
    setStatusUpdates((prev) => ({ ...prev, [id]: value }));
  };

  const handlePaymentStatusChange = (id, value) => {
    setPaymentStatusUpdates((prev) => ({ ...prev, [id]: value }));
  };

  const updateStatus = async (id) => {
    if (!statusUpdates[id]) {
      showAlert("Please select a status.");
      return;
    }

    const project = projectSelections[id] || "";
    if (!project) {
      showAlert("Please select a project.");
      return;
    }

    const updatedStatus = statusUpdates[id];
    const approverComment = comments?.[id] || "";

    try {
      await axios.put(
        `${BACKEND_URL}/reimbursement/status/${id}`,
        {
          status: updatedStatus,
          approver_comments: approverComment,
          approver_id: employeeId,
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
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => ({
          ...emp,
          claims: emp.claims.map((claim) =>
            claim.id === id
              ? {
                  ...claim,
                  status: updatedStatus,
                  approver_comments: approverComment,
                }
              : claim
          ),
        }))
      );
    } catch (error) {
      console.error("Error updating reimbursement status:", error);
      showAlert("Status update was not successful. Try again later.");
    }
  };

  const updatePaymentStatus = async (id) => {
    if (!paymentStatusUpdates[id]) {
      showAlert("Please select a payment status.");
      return;
    }
    const updatedPaymentStatus = paymentStatusUpdates[id];
    try {
      await axios.put(
        `${BACKEND_URL}/reimbursement/payment-status/${id}`,
        {
          payment_status: updatedPaymentStatus,
          user_role: "admin",
        },
        {
          headers: {
            "x-api-key": API_KEY,
            "x-org-id": orgId,
          },
        }
      );
      showAlert("Payment status updated successfully.");
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => ({
          ...emp,
          claims: emp.claims.map((claim) =>
            claim.id === id
              ? { ...claim, payment_status: updatedPaymentStatus }
              : claim
          ),
        }))
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
      showAlert("Payment status couldn't be updated at the moment.");
    }
  };

  const handleDownloadPDF = async (claim) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/download/${claim.id}`, {
        headers: {
          "x-api-key": API_KEY,
          "x-org-id": orgId,
        },
        responseType: "blob",
      });

      const cd = response.headers["content-disposition"];
      console.log("Content-Disposition:", cd);

      let filename = "";

      if (cd) {
        const filenameRegex = /filename[^;=\n]*=(['"]?)([^;\n]*)\1/;
        const matches = filenameRegex.exec(cd);
        if (matches != null && matches[2]) {
          filename = matches[2];
        }
      }

      if (!filename) {
        filename = `Reimbursement_${claim.id}.pdf`;
      }

      if (!filename.toLowerCase().endsWith(".pdf")) {
        filename += ".pdf";
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

  const handleToggleChange = (e) => {
    setView(e.target.checked ? "self" : "all");
  };

  const downloadExcel = async () => {
    try {
      const params = {
        submittedFrom: submittedFrom || null,
        submittedTo: submittedTo || null,
        ...(orgId ? { orgId } : {}),
      };
      const headers = {
        "x-api-key": API_KEY,
        ...(orgId ? { "x-org-id": orgId } : {}),
      };

      const resp = await axios.get(`${BACKEND_URL}/reimbursements/export`, {
        headers,
        params,
        responseType: "blob",
      });
      const cd = resp.headers["content-disposition"];
      let filename = "reimbursements.xlsx";
      if (cd) {
        const match = cd.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }
      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      showAlert("Failed to download Excel. Please try again.");
    }
  };

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
        <>
          <div className="rb-filters">
            <div className="rb-filter-group">
              <input
                type="text"
                placeholder="Search by Name or ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="rb-filter-group">
              <label>Status By</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
                <option value="approved_pending">Approved/Pending</option>
                <option value="approved_paid">Approved/Paid</option>
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
              <label>To:</label>
              <input
                type="date"
                value={submittedTo}
                onChange={(e) => setSubmittedTo(e.target.value)}
              />
            </div>
            <button className="rb-search" onClick={fetchEmployees}>
              <FaSearch /> Search
            </button>
            <button
              className="rb-search"
              onClick={downloadExcel}
              style={{ marginLeft: "8px" }}
            >
              <FiDownload /> Export
            </button>
          </div>
          <div className="rb-atable-container">
            {filteredEmployees.map((employee) => {
              const filteredClaims = employee.claims;
              if (!filteredClaims.length) return null;
              return (
                <div key={employee.employee_id} className="employee-section">
                  <div
                    className="employee-row"
                    onClick={() => toggleRow(employee.employee_id)}
                  >
                    <div className="empId-rows">
                      <span className="employee-name">
                        {employee.claims[0]?.employee_name} -
                      </span>
                      <span className="employee-id">
                        [{employee.employee_id}]
                      </span>
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
                            {filteredClaims.map((claim, index) => (
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
                                    : "N/A"}
                                </td>
                                <td>₹{claim.total_amount}</td>
                                <td
                                  className="purpose-cell"
                                  title={claim.purpose}
                                >
                                  {claim.purpose}
                                </td>
                                <td>
                                  {attachments[claim.id] &&
                                  attachments[claim.id].length > 0 ? (
                                    <button
                                      className="attachments-btn"
                                      onClick={() =>
                                        handleOpenAttachments(
                                          attachments[claim.id],
                                          claim
                                        )
                                      }
                                    >
                                      <MdOutlineRemoveRedEye className="eye-icon" />{" "}
                                      View
                                    </button>
                                  ) : (
                                    "No Attachments"
                                  )}
                                </td>
                                <td>
                                  {claim.status === "approved" ||
                                  claim.status === "rejected" ? (
                                    <span
                                      className={`status-label ${claim.status}`}
                                    >
                                      <span className="status-dot"></span>
                                      {claim.status.charAt(0).toUpperCase() +
                                        claim.status.slice(1)}
                                    </span>
                                  ) : (
                                    <select
                                      className="rb-status-dropdown"
                                      value={
                                        statusUpdates[claim.id] || claim.status
                                      }
                                      onChange={(e) =>
                                        handleStatusChange(
                                          claim.id,
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
                                  {claim.status === "approved" ||
                                  claim.status === "rejected" ? (
                                    <div className="rbadmin-comments">
                                      {projectSelections[claim.id] ||
                                        claim.project}
                                    </div>
                                  ) : (
                                    <select
                                      className="rb-status-dropdown"
                                      value={projectSelections[claim.id] || ""}
                                      onChange={(e) =>
                                        setProjectSelections((prev) => ({
                                          ...prev,
                                          [claim.id]: e.target.value,
                                        }))
                                      }
                                    >
                                      <option value="">Select</option>
                                      <option value="STS CLAIM">
                                        STS CLAIM
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
                                  {claim.status === "approved" ||
                                  claim.status === "rejected" ? (
                                    <div className="rbadmin-comments">
                                      {claim.approver_comments || "No comments"}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder="Enter comments"
                                      value={comments[claim.id] || ""}
                                      onChange={(e) =>
                                        setComments((prev) => ({
                                          ...prev,
                                          [claim.id]: e.target.value,
                                        }))
                                      }
                                    />
                                  )}
                                </td>
                                <td>
                                  {claim.status?.toLowerCase().trim() ===
                                  "approved" ? (
                                    !claim.payment_status ||
                                    claim.payment_status
                                      ?.toLowerCase()
                                      .trim() === "pending" ? (
                                      <button
                                        className="pending-payment-btn"
                                        onClick={() => {
                                          setSelectedPaymentClaim(claim);
                                          setSelectedPaymentOption("");
                                          setIsPaymentModalOpen(true);
                                        }}
                                      >
                                        Pending
                                      </button>
                                    ) : (
                                      <span>
                                        {claim.payment_status
                                          ? claim.payment_status
                                              .charAt(0)
                                              .toUpperCase() +
                                            claim.payment_status.slice(1)
                                          : "N/A"}
                                        {claim.paid_date
                                          ? ` (${formatDisplayDate(
                                              claim.paid_date
                                            )})`
                                          : ""}
                                      </span>
                                    )
                                  ) : (
                                    <span>{claim.payment_status}</span>
                                  )}
                                </td>
                                <td>
                                  <FaFileInvoice
                                    size={24}
                                    className="update-btn"
                                    onClick={() => updateStatus(claim.id)}
                                    disabled={
                                      claim.status === "approved" ||
                                      claim.status === "rejected"
                                    }
                                  />
                                  <FiDownload
                                    size={24}
                                    className="download-btn"
                                    onClick={() => handleDownloadPDF(claim)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="total-row">
                              <td
                                colSpan="6"
                                style={{
                                  textAlign: "right",
                                  color: "#949494",
                                  fontWeight: "bold",
                                }}
                              >
                                Total Amount Claiming:{" "}
                                <span
                                  style={{ fontWeight: "bold", color: "black" }}
                                >
                                  Rs {totalAmount}
                                </span>
                              </td>
                              <td colSpan="5" style={{ textAlign: "right" }}>
                                Amount Approved: Rs{" "}
                                <span style={{ fontWeight: "bold" }}>
                                  {approvedAmount}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <Reimbursement />
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
                  value="rejected"
                  checked={selectedPaymentOption === "rejected"}
                  onChange={(e) => setSelectedPaymentOption(e.target.value)}
                />
                Reject
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
              <label style={{ marginLeft: "20px" }}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="paid"
                  checked={selectedPaymentOption === "paid"}
                  onChange={(e) => setSelectedPaymentOption(e.target.value)}
                />
                Payable
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
                  await axios.put(
                    `${BACKEND_URL}/reimbursement/payment-status/${selectedPaymentClaim.id}`,
                    {
                      payment_status: selectedPaymentOption,
                      user_role: "admin",
                    },
                    {
                      headers: {
                        "x-api-key": API_KEY,
                        "x-org-id": orgId,
                      },
                    }
                  );
                  showAlert("Payment status updated successfully.");
                  setIsPaymentModalOpen(false);
                  fetchEmployees();
                } catch (error) {
                  console.error("Error updating payment status:", error);
                  showAlert(
                    "Could not update payment status. Please try again."
                  );
                }
              }}
            >
              Submit
            </button>
          </div>
        </Modal>
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

export default RbAdmin;
