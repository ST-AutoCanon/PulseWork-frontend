"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  MdOutlineUpdate,
  MdSearch,
  MdOutlineEventAvailable,
} from "react-icons/md";
import { useAuth } from "../../context/AuthProvider.client";
import LeaveRegularisationModal from "./LeaveRegularisationModal.client";
import Modal from "../Modal/Modal.client";
import "./AttendanceRegularisation.css";

function parseSelectedDates(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDateOnly(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getApproverName(user) {
  return (
    user?.name ||
    user?.fullName ||
    user?.employeeName ||
    user?.raw?.name ||
    user?.raw?.fullName ||
    "NA"
  );
}

function getRole(user) {
  return String(user?.role || user?.designation || "")
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();
}

function isSuccessfulResponse(res) {
  return (
    res?.data?.success === true ||
    res?.data?.status === "success" ||
    res?.data?.code === 200 ||
    (typeof res?.status === "number" && res.status >= 200 && res.status < 300)
  );
}

export default function AttendanceRegularisation() {
  const { user } = useAuth();

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") || "";

  const employeeId =
    user?.employeeId ??
    user?.employee_id ??
    user?.raw?.employeeId ??
    user?.raw?.employee_id ??
    null;

  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.orgId ??
    user?.raw?.org_id ??
    null;

  const role = getRole(user);
  const approverName = getApproverName(user);

  const isAdmin = role === "admin";
  const canShowTabs =
    role === "hr" || role === "manager" || role === "supervisor";

  const [viewMode, setViewMode] = useState(isAdmin ? "all" : "self");
  const [selfRequests, setSelfRequests] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("Pending");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [drafts, setDrafts] = useState({});

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const headers = useMemo(
    () => ({
      "x-api-key": API_KEY,
      "x-employee-id": employeeId,
      "x-org-id": orgId,
      "x-role": user?.role || "",
      "Content-Type": "application/json",
    }),
    [API_KEY, employeeId, orgId, user?.role],
  );

  const selfListCandidates = useMemo(
    () => [`${BACKEND_URL}/api/leave-regularisation/my-requests`],
    [BACKEND_URL],
  );

  const teamListCandidates = useMemo(
    () => [
      `${BACKEND_URL}/api/leave-regularisation/team-requests`,
      `${BACKEND_URL}/api/leave-regularisation/admin-requests`,
      `${BACKEND_URL}/api/leave-regularisation/all-requests`,
      `${BACKEND_URL}/api/leave-regularisation/requests`,
    ],
    [BACKEND_URL],
  );

  const updateCandidates = useMemo(
    () => [
      (id) => `${BACKEND_URL}/api/leave-regularisation/${id}`,
      (id) => `${BACKEND_URL}/api/leave-regularisation/update/${id}`,
      (id) => `${BACKEND_URL}/api/leave-regularisation/${id}/status`,
    ],
    [BACKEND_URL],
  );

  const createEndpoint = `${BACKEND_URL}/api/leave-regularisation/submit`;

  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const showAlert = (message, title = "") => {
    setAlertModal({
      isVisible: true,
      title,
      message,
    });
  };

  const fetchWithFallback = async (urls, config = {}) => {
    let lastErr = null;

    for (const url of urls) {
      try {
        const res = await axios.get(url, {
          ...config,
          headers,
          withCredentials: true,
        });
        return res;
      } catch (err) {
        lastErr = err;
        if (err?.response?.status === 404) continue;
      }
    }

    throw lastErr || new Error("No endpoint available");
  };

  const fetchSelfRequests = async () => {
    if (!employeeId || !orgId || !BACKEND_URL) return [];
    const res = await fetchWithFallback(selfListCandidates);
    const rows = res.data?.data || res.data || [];
    setSelfRequests(Array.isArray(rows) ? rows : []);
    return Array.isArray(rows) ? rows : [];
  };

  const fetchTeamRequests = async () => {
    if (!employeeId || !orgId || !BACKEND_URL) return [];
    const res = await fetchWithFallback(teamListCandidates, {
      params: {
        scope: "team",
        role,
      },
    });
    const rows = res.data?.data || res.data || [];
    setTeamRequests(Array.isArray(rows) ? rows : []);
    return Array.isArray(rows) ? rows : [];
  };

  const fetchAllRequests = async () => {
    if (!employeeId || !orgId || !BACKEND_URL) return [];
    const res = await fetchWithFallback(teamListCandidates, {
      params: {
        scope: "all",
        role,
      },
    });
    const rows = res.data?.data || res.data || [];
    setAllRequests(Array.isArray(rows) ? rows : []);
    return Array.isArray(rows) ? rows : [];
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      if (isAdmin) {
        await fetchAllRequests();
      } else if (canShowTabs) {
        await Promise.all([fetchSelfRequests(), fetchTeamRequests()]);
      } else {
        await fetchSelfRequests();
      }
    } catch (err) {
      console.error("fetchRequests error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load attendance regularisation requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, orgId]);

  const activeRows = useMemo(() => {
    if (isAdmin) return allRequests;
    if (canShowTabs && viewMode === "team") return teamRequests;
    return selfRequests;
  }, [isAdmin, canShowTabs, viewMode, allRequests, teamRequests, selfRequests]);

  const filteredRows = useMemo(() => {
    const s = normalizeText(search);

    return (activeRows || []).filter((r) => {
      const rowStatus = String(r.status || "").toLowerCase();
      if (statusFilter && rowStatus !== statusFilter.toLowerCase())
        return false;

      const selectedDates = parseSelectedDates(r.selected_dates);
      const primary = String(r.primary_date || "").slice(0, 10);
      const rowDate = selectedDates[0] || primary;

      if (fromDate && rowDate && rowDate < fromDate) return false;
      if (toDate && rowDate && rowDate > toDate) return false;

      if (s) {
        const empName = normalizeText(
          r.employee_name || r.employeeName || r.full_name || r.name || "",
        );
        const empId = normalizeText(r.employee_id || r.employeeId || "");
        const reason = normalizeText(r.regularisation_type || "");
        const comment = normalizeText(r.comment || "");
        const approverComments = normalizeText(r.approver_comments || "");
        const haystack = `${empName} ${empId} ${reason} ${comment} ${approverComments}`;
        if (!haystack.includes(s)) return false;
      }

      return true;
    });
  }, [activeRows, statusFilter, fromDate, toDate, search]);

  const handleOpenCreate = () => {
    setEditingRow(null);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditingRow(row);
    setModalOpen(true);
  };

  const handleRowDraftChange = (rowId, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [key]: value,
      },
    }));
  };

  const handleSubmitCreate = async (payload) => {
    try {
      setModalLoading(true);
      setError("");

      const body = {
        regularisationType: payload.regularisationType,
        selectedDates: payload.selectedDates,
        comment: payload.comment,
        primaryDate: payload.primaryDate || payload.selectedDates?.[0] || null,
      };

      const res = await axios.post(createEndpoint, body, {
        headers,
        withCredentials: true,
      });

      if (isSuccessfulResponse(res)) {
        setModalOpen(false);
        setEditingRow(null);
        showAlert(
          res.data?.message || "Regularisation request submitted successfully.",
          "Success",
        );
        await fetchRequests();
      } else {
        setError(res.data?.message || "Submission failed.");
        showAlert(res.data?.message || "Submission failed.", "Error");
      }
    } catch (err) {
      console.error("Submit error:", err);
      const msg = err.response?.data?.message || "Submission failed.";
      setError(msg);
      showAlert(msg, "Error");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateRow = async (row) => {
    try {
      const rowId = row?.id || row?.leave_id || row?.request_id || null;
      if (!rowId) {
        setError("Missing request id.");
        return;
      }

      const draft = drafts[rowId] || {};
      const status = String(draft.status || row.status || "Pending").trim();
      const approverComments = String(
        draft.approver_comments ?? row.approver_comments ?? "",
      ).trim();

      if (!status) {
        setError("Please select a status.");
        return;
      }

      setLoading(true);
      setError("");

      const body = {
        status,
        approver_comments: approverComments,
        approver_name: approverName || "",
        approver_employee_id: employeeId || "",
      };

      let lastErr = null;

      for (const makeUrl of updateCandidates) {
        try {
          const res = await axios.put(makeUrl(rowId), body, {
            headers,
            withCredentials: true,
          });

          if (isSuccessfulResponse(res)) {
            setDrafts((prev) => {
              const next = { ...prev };
              delete next[rowId];
              return next;
            });

            showAlert(
              res.data?.message ||
                "Regularisation request updated successfully.",
              "Success",
            );
            await fetchRequests();
            return;
          }

          lastErr = new Error(res.data?.message || "Update failed.");
        } catch (err) {
          lastErr = err;
          if (err?.response?.status === 404) continue;
        }
      }

      throw lastErr || new Error("Update endpoint not available.");
    } catch (err) {
      console.error("Update error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to update regularisation request.";
      setError(msg);
      showAlert(msg, "Error");
    } finally {
      setLoading(false);
    }
  };

  const modalInitialDates = useMemo(() => {
    if (!editingRow) return [];
    return parseSelectedDates(editingRow.selected_dates);
  }, [editingRow]);

  const modalInitialReason = editingRow?.regularisation_type || "";
  const modalInitialComment = editingRow?.comment || "";
  const modalDefaultDate =
    editingRow?.primary_date || modalInitialDates?.[0] || null;

  const renderSelfFlow = () => (
    <section className="ar-self-card">
      {!isAdmin ? (
        <div className="ar-header">
          <div>
            <h2 className="ar-title">Attendance Regularisation</h2>
            <p className="ar-subtitle">
              Apply regularisation for your own attendance and track your
              requests.
            </p>
          </div>

          <button
            type="button"
            className="ar-primary-btn"
            onClick={handleOpenCreate}
          >
            <MdOutlineEventAvailable /> Attendance Regularisation
          </button>
        </div>
      ) : null}

      {error ? <div className="ar-error">{error}</div> : null}

      <div className="ar-table-card">
        <h3 className="ar-table-title">My Regularisation Requests</h3>

        {filteredRows.length === 0 ? (
          <p className="ar-empty">No requests found.</p>
        ) : (
          <div className="ar-table-wrap">
            <table className="ar-table">
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>Regularisation Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Comment</th>
                  <th>Approver Comments</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => {
                  const selectedDates = parseSelectedDates(row.selected_dates);
                  const rowDate =
                    selectedDates[0] || row.primary_date || row.created_at;

                  return (
                    <tr key={row.id || idx}>
                      <td>{idx + 1}</td>
                      <td>{row.regularisation_type || "-"}</td>
                      <td>{formatDateOnly(rowDate)}</td>
                      <td>{row.status || "Pending"}</td>
                      <td>{row.comment || "-"}</td>
                      <td>{row.approver_comments || "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="ar-update-btn"
                          onClick={() => handleEdit(row)}
                          title="Edit request"
                        >
                          <MdOutlineUpdate />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );

  const renderTeamOrAdminTable = () => (
    <>
      <div className="ar-filter-row">
        <select
          className="ar-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Pending">Pending</option>
          <option value="">All Status</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <input
          className="ar-input"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <input
          className="ar-input"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <input
          className="ar-search-input"
          type="text"
          placeholder="Search employee name, ID, reason, comments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          type="button"
          className="ar-search-btn"
          onClick={fetchRequests}
          disabled={loading}
        >
          <MdSearch /> Search
        </button>
      </div>

      <div className="ar-table-card">
        <h3 className="ar-table-title">
          {isAdmin
            ? "All Employees Attendance Regularisation"
            : "Team Attendance Regularisation"}
        </h3>

        {filteredRows.length === 0 ? (
          <p className="ar-empty">No requests found.</p>
        ) : (
          <div className="ar-table-wrap">
            <table className="ar-table">
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>Emp Name</th>
                  <th>Emp ID</th>
                  <th>Regularisation Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Comment</th>
                  <th>Approver Name</th>
                  <th>Approver Comments</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => {
                  const selectedDates = parseSelectedDates(row.selected_dates);
                  const draft = drafts[row.id] || {};
                  const empName =
                    row.employee_name ||
                    row.employeeName ||
                    row.full_name ||
                    row.name ||
                    "-";
                  const rowDate =
                    selectedDates[0] || row.primary_date || row.created_at;

                  const currentStatus = draft.status || row.status || "Pending";
                  const currentComment = draft.comment ?? row.comment ?? "";
                  const currentApproverComments =
                    draft.approver_comments ?? row.approver_comments ?? "";

                  return (
                    <tr key={row.id || idx}>
                      <td>{idx + 1}</td>
                      <td>{empName}</td>
                      <td>{row.employee_id || "-"}</td>
                      <td>{row.regularisation_type || "-"}</td>
                      <td>{formatDateOnly(rowDate)}</td>
                      <td>
                        <select
                          className="ar-status-select"
                          value={currentStatus}
                          onChange={(e) =>
                            handleRowDraftChange(
                              row.id,
                              "status",
                              e.target.value,
                            )
                          }
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="ar-table-input"
                          type="text"
                          value={currentComment}
                          onChange={(e) =>
                            handleRowDraftChange(
                              row.id,
                              "comment",
                              e.target.value,
                            )
                          }
                          placeholder="Comment"
                          disabled
                        />
                      </td>
                      <td>{approverName}</td>
                      <td>
                        <input
                          className="ar-table-input"
                          type="text"
                          value={currentApproverComments}
                          onChange={(e) =>
                            handleRowDraftChange(
                              row.id,
                              "approver_comments",
                              e.target.value,
                            )
                          }
                          placeholder="Approver comments"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ar-update-btn"
                          onClick={() => handleUpdateRow(row)}
                          title="Update status"
                        >
                          <MdOutlineUpdate />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="ar-page">
      {isAdmin ? (
        <>
          <div className="ar-header">
            <div>
              <h2 className="ar-title">Attendance Regularisation</h2>
              <p className="ar-subtitle">
                Review and update all employees' attendance regularisation
                requests.
              </p>
            </div>
          </div>

          {renderTeamOrAdminTable()}
        </>
      ) : canShowTabs ? (
        <>
          <div className="ar-tabs">
            <button
              type="button"
              className={`ar-tab ${viewMode === "self" ? "active" : ""}`}
              onClick={() => setViewMode("self")}
            >
              Self
            </button>
            <button
              type="button"
              className={`ar-tab ${viewMode === "team" ? "active" : ""}`}
              onClick={() => setViewMode("team")}
            >
              Team
            </button>
          </div>

          {viewMode === "self" ? (
            <>
              {renderSelfFlow()}
              <LeaveRegularisationModal
                isOpen={modalOpen}
                onClose={() => {
                  setModalOpen(false);
                  setEditingRow(null);
                }}
                onSubmit={handleSubmitCreate}
                loading={modalLoading}
                title={
                  editingRow
                    ? "Edit Attendance Regularisation"
                    : "Attendance Regularisation"
                }
                subtitle="Select a reason, choose eligible date(s), add your comment, and submit."
                initialReason={modalInitialReason}
                initialDates={modalInitialDates}
                initialComment={modalInitialComment}
                defaultDate={modalDefaultDate}
              />
            </>
          ) : (
            <>
              <div className="ar-header">
                <div>
                  <h2 className="ar-title">Team Regularisation</h2>
                  <p className="ar-subtitle">
                    Review and update regularisation requests for your team.
                  </p>
                </div>
              </div>

              {renderTeamOrAdminTable()}
            </>
          )}

          <LeaveRegularisationModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditingRow(null);
            }}
            onSubmit={handleSubmitCreate}
            loading={modalLoading}
            title={
              editingRow
                ? "Edit Attendance Regularisation"
                : "Attendance Regularisation"
            }
            subtitle="Select a reason, choose eligible date(s), add your comment, and submit."
            initialReason={modalInitialReason}
            initialDates={modalInitialDates}
            initialComment={modalInitialComment}
            defaultDate={modalDefaultDate}
          />
        </>
      ) : (
        <>
          {renderSelfFlow()}
          <LeaveRegularisationModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditingRow(null);
            }}
            onSubmit={handleSubmitCreate}
            loading={modalLoading}
            title={
              editingRow
                ? "Edit Attendance Regularisation"
                : "Attendance Regularisation"
            }
            subtitle="Select a reason, choose eligible date(s), add your comment, and submit."
            initialReason={modalInitialReason}
            initialDates={modalInitialDates}
            initialComment={modalInitialComment}
            defaultDate={modalDefaultDate}
          />
        </>
      )}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <div>{alertModal.message}</div>
      </Modal>
    </div>
  );
}
