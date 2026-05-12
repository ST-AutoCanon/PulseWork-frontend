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

const PAGE_SIZE = 10;

const REGULARISATION_TYPE_LABELS = {
  missed_punch_out: "Missed Punch Out",
  late_login: "Late Login",
  missed_apply_leave: "Missed Apply Leave / Missed Punch In",
};

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

function formatSelectedDates(value) {
  const dates = parseSelectedDates(value);
  if (!dates.length) return "-";
  return dates.map((d) => formatDateOnly(d)).join(", ");
}

function formatRegularisationType(value) {
  if (!value) return "-";

  const key = String(value).trim().toLowerCase();
  if (REGULARISATION_TYPE_LABELS[key]) {
    return REGULARISATION_TYPE_LABELS[key];
  }

  return String(value)
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
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

function getRowId(row) {
  return row?.id || row?.leave_id || row?.request_id || null;
}

function getApiErrorMessage(err, fallback = "Something went wrong.") {
  const data = err?.response?.data;

  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (typeof first === "string") return first;
    if (first?.message) return first.message;
  }

  return err?.message || fallback;
}

function normalizeRowForUi(row) {
  const selectedDates = parseSelectedDates(
    row?.selected_dates ?? row?.selectedDates ?? row?.selected_dates_json,
  );

  return {
    ...row,
    selectedDates,
    selected_dates: selectedDates,
    selected_dates_json: JSON.stringify(selectedDates || []),
  };
}

function mergeRowsWithOverrides(rows, overrides) {
  return (rows || []).map((row) => {
    const rowId = getRowId(row);
    const override = rowId != null ? overrides[String(rowId)] : null;
    return normalizeRowForUi({
      ...row,
      ...(override || {}),
    });
  });
}

function buildCreatePayload(payload) {
  return {
    regularisationType: payload.regularisationType,
    regularisation_type: payload.regularisationType,
    selectedDates: payload.selectedDates,
    selected_dates: payload.selectedDates,
    selected_dates_json: JSON.stringify(payload.selectedDates || []),
    comment: payload.comment,
    primaryDate: payload.primaryDate || payload.selectedDates?.[0] || null,
    primary_date: payload.primaryDate || payload.selectedDates?.[0] || null,
    status: "Pending",
  };
}

function buildUpdatePayload(payload, row) {
  const rowStatus = String(row?.status || "Pending").trim() || "Pending";

  return {
    id: getRowId(row),
    status: rowStatus,
    regularisationType: payload.regularisationType,
    regularisation_type: payload.regularisationType,
    selectedDates: payload.selectedDates,
    selected_dates: payload.selectedDates,
    selected_dates_json: JSON.stringify(payload.selectedDates || []),
    comment: payload.comment,
    primaryDate: payload.primaryDate || payload.selectedDates?.[0] || null,
    primary_date: payload.primaryDate || payload.selectedDates?.[0] || null,
    employeeId: row?.employee_id || row?.employeeId || undefined,
    employee_id: row?.employee_id || row?.employeeId || undefined,
    orgId: row?.org_id || row?.orgId || undefined,
    org_id: row?.org_id || row?.orgId || undefined,
  };
}

function getDisplayApproverName(row, fallbackName = "") {
  const candidates = [
    row?.approver_name,
    row?.approverName,
    row?.approved_by,
    row?.approvedBy,
    row?.approver_employee_name,
    row?.approverEmployeeName,
    row?.approver_full_name,
    row?.approverFullName,
  ];

  const found = candidates.find(
    (v) => typeof v === "string" && v.trim() && v.trim() !== "-",
  );

  if (found) return found;

  const status = String(row?.status || "")
    .trim()
    .toLowerCase();

  if (status !== "pending" && fallbackName) {
    return fallbackName;
  }

  return "-";
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
  const isHr = role === "hr";
  const isManagerOrSupervisor = role === "manager" || role === "supervisor";
  const canShowTabs = isHr || isManagerOrSupervisor;

  const [viewMode, setViewMode] = useState(isAdmin ? "all" : "self");
  const [selfRequests, setSelfRequests] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);

  const [rowOverrides, setRowOverrides] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("Pending");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const [pagination, setPagination] = useState({
    self: 1,
    team: 1,
    all: 1,
  });

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

  const closeModal = () => {
    setModalOpen(false);
    setEditingRow(null);
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

  const refreshRowsForUiAfterEdit = (rowId, payload, row) => {
    const key = String(rowId);

    const nextOverride = normalizeRowForUi({
      ...(row || {}),
      id: rowId,
      status: row?.status || "Pending",
      regularisationType: payload.regularisationType,
      regularisation_type: payload.regularisationType,
      selectedDates: payload.selectedDates,
      selected_dates: payload.selectedDates,
      selected_dates_json: JSON.stringify(payload.selectedDates || []),
      comment: payload.comment,
      primaryDate: payload.primaryDate || payload.selectedDates?.[0] || null,
      primary_date: payload.primaryDate || payload.selectedDates?.[0] || null,
    });

    setRowOverrides((prev) => ({
      ...prev,
      [key]: nextOverride,
    }));
  };

  const refreshRowsForUiAfterCreate = (createdRow) => {
    const rowId = getRowId(createdRow);
    if (!rowId) return;

    const key = String(rowId);
    setRowOverrides((prev) => ({
      ...prev,
      [key]: normalizeRowForUi(createdRow),
    }));
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      if (isAdmin) {
        await fetchAllRequests();
        return;
      }

      if (canShowTabs) {
        if (viewMode === "team") {
          if (isHr) {
            await fetchAllRequests();
          } else {
            await fetchTeamRequests();
          }
        } else {
          await fetchSelfRequests();
        }
        return;
      }

      await fetchSelfRequests();
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
  }, [employeeId, orgId, viewMode, role]);

  const selfRequestsUi = useMemo(
    () => mergeRowsWithOverrides(selfRequests, rowOverrides),
    [selfRequests, rowOverrides],
  );

  const teamRequestsUi = useMemo(() => {
    const merged = mergeRowsWithOverrides(teamRequests, rowOverrides);
    if (isManagerOrSupervisor) {
      return merged.filter((row) => {
        const rowEmployeeId =
          row?.employee_id ?? row?.employeeId ?? row?.employeeID ?? "";
        return String(rowEmployeeId) !== String(employeeId || "");
      });
    }
    return merged;
  }, [teamRequests, rowOverrides, isManagerOrSupervisor, employeeId]);

  const allRequestsUi = useMemo(
    () => mergeRowsWithOverrides(allRequests, rowOverrides),
    [allRequests, rowOverrides],
  );

  const activeRows = useMemo(() => {
    if (isAdmin) return allRequestsUi;

    if (canShowTabs && viewMode === "team") {
      if (isHr) return allRequestsUi;
      return teamRequestsUi;
    }

    return selfRequestsUi;
  }, [
    isAdmin,
    canShowTabs,
    viewMode,
    isHr,
    allRequestsUi,
    teamRequestsUi,
    selfRequestsUi,
  ]);

  const filteredRows = useMemo(() => {
    const s = normalizeText(search);

    return (activeRows || []).filter((r) => {
      const rowStatus = String(r.status || "").toLowerCase();
      if (statusFilter && rowStatus !== statusFilter.toLowerCase()) {
        return false;
      }

      const selectedDates = parseSelectedDates(r.selected_dates);
      const primary = String(r.primary_date || "").slice(0, 10);
      const rowDate = selectedDates[0] || primary;

      if (fromDate && rowDate && rowDate < fromDate) return false;
      if (toDate && rowDate && rowDate > toDate) return false;

      if (s && (isAdmin || (canShowTabs && viewMode === "team"))) {
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
  }, [
    activeRows,
    statusFilter,
    fromDate,
    toDate,
    search,
    isAdmin,
    canShowTabs,
    viewMode,
  ]);

  const currentViewKey = useMemo(() => {
    if (isAdmin) return "all";
    if (canShowTabs && viewMode === "team") {
      return isHr ? "all" : "team";
    }
    return "self";
  }, [isAdmin, canShowTabs, viewMode, isHr]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(pagination[currentViewKey] || 1, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    setPagination((prev) => {
      const current = prev[currentViewKey] || 1;
      if (current === 1) return prev;
      return {
        ...prev,
        [currentViewKey]: 1,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, fromDate, toDate, search]);

  useEffect(() => {
    setPagination((prev) => {
      const current = prev[currentViewKey] || 1;
      if (current <= totalPages) return prev;

      return {
        ...prev,
        [currentViewKey]: totalPages,
      };
    });
  }, [currentViewKey, totalPages]);

  const goToPage = (page) => {
    const safe = Math.max(1, Math.min(page, totalPages));
    setPagination((prev) => ({
      ...prev,
      [currentViewKey]: safe,
    }));
  };

  const renderPagination = () => {
    if (filteredRows.length === 0) return null;

    const startItem = (currentPage - 1) * PAGE_SIZE + 1;
    const endItem = Math.min(currentPage * PAGE_SIZE, filteredRows.length);

    return (
      <div className="ar-pagination">
        <div className="ar-pagination-info">
          Showing {startItem}-{endItem} of {filteredRows.length}
        </div>

        <div className="ar-pagination-controls">
          <button
            type="button"
            className="ar-page-btn"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          <span className="ar-page-label">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            className="ar-page-btn"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

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

      const body = buildCreatePayload(payload);

      const res = await axios.post(createEndpoint, body, {
        headers,
        withCredentials: true,
      });

      if (isSuccessfulResponse(res)) {
        const createdRow = res.data?.data || res.data || null;
        if (createdRow) refreshRowsForUiAfterCreate(createdRow);

        closeModal();
        showAlert(
          res.data?.message || "Regularisation request submitted successfully.",
          "Success",
        );
        await fetchRequests();
      } else {
        const msg = res.data?.message || "Submission failed.";
        setError(msg);
        showAlert(msg, "Error");
      }
    } catch (err) {
      console.error("Submit error:", err);
      const msg = getApiErrorMessage(err, "Submission failed.");
      setError(msg);
      showAlert(msg, "Error");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmitEdit = async (row, payload) => {
    try {
      const rowId = getRowId(row);
      if (!rowId) {
        setError("Missing request id.");
        return;
      }

      setModalLoading(true);
      setError("");

      const body = buildUpdatePayload(payload, row);

      const updateUrl = `${BACKEND_URL}/api/leave-regularisation/${rowId}`;
      const res = await axios.put(updateUrl, body, {
        headers,
        withCredentials: true,
      });

      if (isSuccessfulResponse(res)) {
        refreshRowsForUiAfterEdit(rowId, payload, row);

        setDrafts((prev) => {
          const next = { ...prev };
          delete next[rowId];
          return next;
        });

        closeModal();
        showAlert(
          res.data?.message || "Regularisation request updated successfully.",
          "Success",
        );
        await fetchRequests();
        return;
      }

      const msg = res.data?.message || "Update failed.";
      setError(msg);
      showAlert(msg, "Error");
    } catch (err) {
      console.error("Edit submit error:", err);
      const msg = getApiErrorMessage(
        err,
        "Failed to update regularisation request.",
      );
      setError(msg);
      showAlert(msg, "Error");
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalSubmit = async (payload) => {
    if (editingRow) {
      await handleSubmitEdit(editingRow, payload);
      return;
    }

    await handleSubmitCreate(payload);
  };

  const modalInitialDates = useMemo(() => {
    if (!editingRow) return [];
    return parseSelectedDates(editingRow.selected_dates);
  }, [editingRow]);

  const modalInitialReason = editingRow?.regularisation_type || "";
  const modalInitialComment = editingRow?.comment || "";
  const modalDefaultDate =
    editingRow?.primary_date || modalInitialDates?.[0] || null;

  const handleUpdateRow = async (row) => {
    try {
      const rowId = getRowId(row);
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

      const updateUrl = `${BACKEND_URL}/api/leave-regularisation/${rowId}`;
      const res = await axios.put(updateUrl, body, {
        headers,
        withCredentials: true,
      });

      if (isSuccessfulResponse(res)) {
        setRowOverrides((prev) => ({
          ...prev,
          [String(rowId)]: normalizeRowForUi({
            ...(row || {}),
            id: rowId,
            status,
            approver_comments: approverComments,
            approver_name:
              row?.approver_name || row?.approverName || approverName || null,
            approverName:
              row?.approverName || row?.approver_name || approverName || null,
            approver_employee_id: employeeId || null,
            approverEmployeeId: employeeId || null,
          }),
        }));

        setDrafts((prev) => {
          const next = { ...prev };
          delete next[rowId];
          return next;
        });

        showAlert(
          res.data?.message || "Regularisation request updated successfully.",
          "Success",
        );
        await fetchRequests();
        return;
      }

      const msg = res.data?.message || "Update failed.";
      setError(msg);
      showAlert(msg, "Error");
    } catch (err) {
      console.error("Update error:", err);
      const msg = getApiErrorMessage(
        err,
        "Failed to update regularisation request.",
      );
      setError(msg);
      showAlert(msg, "Error");
    } finally {
      setLoading(false);
    }
  };

  const renderFilters = ({ showSearch = false } = {}) => (
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

      {showSearch ? (
        <>
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
        </>
      ) : null}
    </div>
  );

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

      {renderFilters({ showSearch: false })}

      {error ? <div className="ar-error">{error}</div> : null}

      <div className="ar-table-card">
        <h3 className="ar-table-title">My Regularisation Requests</h3>

        {filteredRows.length === 0 ? (
          <p className="ar-empty">No requests found.</p>
        ) : (
          <>
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
                  {paginatedRows.map((row, idx) => {
                    const selectedDates = parseSelectedDates(
                      row.selected_dates,
                    );
                    const datesText = formatSelectedDates(selectedDates);
                    const approverText = row.approver_comments || "-";

                    return (
                      <tr key={row.id || idx}>
                        <td>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                        <td>
                          {formatRegularisationType(row.regularisation_type)}
                        </td>
                        <td className="ar-tooltip-cell" title={datesText}>
                          {datesText}
                        </td>
                        <td>{row.status || "Pending"}</td>
                        <td>{row.comment || "-"}</td>
                        <td className="ar-tooltip-cell" title={approverText}>
                          {approverText}
                        </td>
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

            {renderPagination()}
          </>
        )}
      </div>
    </section>
  );

  const renderTeamOrAdminTable = () => (
    <>
      {renderFilters({ showSearch: true })}

      <div className="ar-table-card">
        <h3 className="ar-table-title">
          {isAdmin
            ? "All Employees Attendance Regularisation"
            : isHr && viewMode === "team"
              ? "All Employees Attendance Regularisation"
              : "Team Attendance Regularisation"}
        </h3>

        {filteredRows.length === 0 ? (
          <p className="ar-empty">No requests found.</p>
        ) : (
          <>
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
                  {paginatedRows.map((row, idx) => {
                    const selectedDates = parseSelectedDates(
                      row.selected_dates,
                    );
                    const datesText = formatSelectedDates(selectedDates);
                    const draft = drafts[row.id] || {};
                    const empName =
                      row.employee_name ||
                      row.employeeName ||
                      row.full_name ||
                      row.name ||
                      "-";

                    const currentStatus =
                      draft.status || row.status || "Pending";
                    const currentComment = draft.comment ?? row.comment ?? "";
                    const currentApproverComments =
                      draft.approver_comments ?? row.approver_comments ?? "";
                    const statusLocked =
                      (isAdmin || isManagerOrSupervisor) &&
                      String(row.status || "").toLowerCase() !== "pending";

                    return (
                      <tr key={row.id || idx}>
                        <td>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                        <td>{empName}</td>
                        <td>{row.employee_id || "-"}</td>
                        <td>
                          {formatRegularisationType(row.regularisation_type)}
                        </td>
                        <td className="ar-tooltip-cell" title={datesText}>
                          {datesText}
                        </td>
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
                            disabled={statusLocked}
                            title={
                              statusLocked
                                ? "Status locked after update"
                                : "Change status"
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
                        <td>{getDisplayApproverName(row, approverName)}</td>
                        <td
                          className="ar-tooltip-cell"
                          title={currentApproverComments || "-"}
                        >
                          <input
                            className="ar-table-input ar-approver-input"
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

            {renderPagination()}
          </>
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
            renderSelfFlow()
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
        </>
      ) : (
        renderSelfFlow()
      )}
      <LeaveRegularisationModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
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
        existingRequests={selfRequestsUi}
        excludeRequestId={editingRow?.id || null}
      />

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
