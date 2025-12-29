"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  MdFileDownload,
  MdPictureAsPdf,
  MdDateRange,
  MdOutlineAssessment,
} from "react-icons/md";

import "./ReportPanel.css";
import Modal from "../Modal/Modal.client";
import EmployeeTypeahead from "./EmployeeTypeahead.client";
import FieldsGrid from "./FieldsGrid.client";
import Pagination from "./Pagination.client";

import { getApiBase } from "./ReportUtils";
import {
  STATUS_OPTIONS,
  SUB_OPTIONS,
  MAX_DOWNLOAD_FIELDS,
  PREVIEW_PAGE_SIZE,
  MAX_RANGE_DAYS,
} from "./ReportConstants";

import { useAuth } from "../../context/AuthProvider.client";

/* ------------------------------------------------------------- */
/* helpers                                                       */
/* ------------------------------------------------------------- */

function formatDateLocal(d) {
  if (!d || !(d instanceof Date)) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function deriveLifecycleFromAssignedTo(raw) {
  if (!raw) return "Unassigned";
  if (Array.isArray(raw) && raw.length === 0) return "Unassigned";

  const arr = Array.isArray(raw) ? raw : [raw];
  let anyActive = false;
  let anyDecom = false;

  for (const e of arr) {
    const status = String(
      e?.status || e?.assignment_status || ""
    ).toLowerCase();

    if (status.includes("decommission")) anyDecom = true;
    if (!status.includes("returned") && !status.includes("decommission"))
      anyActive = true;
  }

  if (anyActive) return "assigned";
  if (anyDecom) return "decommissioned";
  return "returned";
}

/* ------------------------------------------------------------- */

export default function ReportPanel() {
  const { user, hydrated } = useAuth();

  if (!hydrated) return null;

  const employeeId = user?.employeeId || null;
  const userRole = user?.role || null;

  const isTeamRole =
    userRole &&
    ["manager", "supervisor", "team lead", "teamlead", "lead"].some((r) =>
      userRole.toLowerCase().includes(r)
    );

  const BACKEND = getApiBase();
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

  /* ---------------------------- state ---------------------------- */

  const [component, setComponent] = useState("select");
  const [status, setStatus] = useState("All");
  const [statusOptions, setStatusOptions] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);

  const [filterEmployeeId, setFilterEmployeeId] = useState(null);
  const [filterEmployeeName, setFilterEmployeeName] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState(null);
  const [isTypingSearch, setIsTypingSearch] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewError, setPreviewError] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  /* ---------------------------- derived ---------------------------- */

  const componentIsSelected = component && component !== "select";

  const allSelected =
    availableFields.length > 0 &&
    selectedFields.length === availableFields.length;

  const someSelected =
    selectedFields.length > 0 && selectedFields.length < availableFields.length;

  const keyToLabel = useMemo(() => {
    const map = {};
    availableFields.forEach((f) => (map[f.key] = f.label));
    return map;
  }, [availableFields]);

  const componentOptions = [
    { value: "leaves", label: "Leaves" },
    { value: "reimbursements", label: "Reimbursements" },
    { value: "employees", label: "Employees" },
    ...(isTeamRole ? [] : [{ value: "vendors", label: "Vendors" }]),
    ...(isTeamRole ? [] : [{ value: "assets", label: "Assets" }]),
    { value: "attendance", label: "Attendance" },
    { value: "tasks_employee", label: "Tasks (Employee Driven)" },
    { value: "tasks_supervisor", label: "Tasks (Supervisor Driven)" },
  ];

  /* ---------------------------- helpers ---------------------------- */

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });

  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const validateDates = () => {
    if (!startDate && !endDate) return true;
    if (!startDate || !endDate) {
      showAlert("Please provide both start and end dates.");
      return false;
    }

    const s = new Date(startDate);
    const e = new Date(endDate);

    if (s > e) {
      showAlert("Start date cannot be after end date.");
      return false;
    }

    const days =
      Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (days > MAX_RANGE_DAYS) {
      showAlert(
        `Maximum allowed range is ${MAX_RANGE_DAYS} days. Selected ${days}.`
      );
      return false;
    }

    return true;
  };

  const toggleField = (key) =>
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const selectAllFields = () =>
    setSelectedFields(availableFields.map((f) => f.key));

  const clearAllFields = () => setSelectedFields([]);

  const presetRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    setStartDate(formatDateLocal(start));
    setEndDate(formatDateLocal(end));
  };

  const thisMonth = () => {
    const now = new Date();
    setStartDate(
      formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1))
    );
    setEndDate(
      formatDateLocal(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    );
  };

  /* ---------------------------- effects ---------------------------- */

  useEffect(() => {
    if (!componentIsSelected) {
      setAvailableFields([]);
      setSelectedFields([]);
      setStatusOptions([]);
      return;
    }

    setStatusOptions(STATUS_OPTIONS[component] || ["All"]);
    const fields = SUB_OPTIONS[component] || [];
    setAvailableFields(fields);
    setSelectedFields(fields.map((f) => f.key));
  }, [component, componentIsSelected]);

  /* ---------------------------- preview ---------------------------- */

  const fetchPreview = async () => {
    if (!validateDates()) return;
    if (!selectedFields.length) {
      showAlert("Please select at least one field.");
      return;
    }

    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewRows([]);
    setPreviewMessage("");

    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (status && status !== "All") params.append("status", status);
      if (filterEmployeeId) params.append("employee_id", filterEmployeeId);
      if (filterDepartmentId)
        params.append("department_id", filterDepartmentId);
      params.append("preview", "true");

      const endpoint =
        component === "tasks_supervisor"
          ? "tasks/supervisor"
          : component === "tasks_employee"
          ? "tasks/employee"
          : component;

      const res = await axios.get(
        `${BACKEND}/api/report/${endpoint}?${params.toString()}`,
        {
          withCredentials: true,
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": employeeId,
          },
        }
      );

      const rows = res.data?.rows || res.data || [];
      setPreviewRows(rows.slice(0, 200));

      if (!rows.length) {
        setPreviewMessage("No data available for selected filters.");
      }
    } catch (e) {
      setPreviewError("Failed to load preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  /* ---------------------------- pagination ---------------------------- */

  const totalPages = Math.max(
    1,
    Math.ceil(previewRows.length / PREVIEW_PAGE_SIZE)
  );

  const currentPageData = previewRows.slice(
    (previewPage - 1) * PREVIEW_PAGE_SIZE,
    previewPage * PREVIEW_PAGE_SIZE
  );

  /* ---------------------------- render ---------------------------- */

  return (
    <div className="rp-container">
      {/* HEADER */}
      <header className="rp-header">
        <div className="rp-title">
          <MdOutlineAssessment size={28} />
          <div>
            <h2>Reports</h2>
            <p className="rp-sub">
              Export Leaves, Reimbursements, Employees, Vendors, Assets,
              Attendance, Tasks — Excel and PDF
            </p>
          </div>
        </div>
      </header>

      {/* MAIN CARD */}
      <section className="rp-card">
        {/* COMPONENT */}
        <div className="rp-row">
          <label className="rp-label">Component</label>
          <select
            className="rep-select"
            value={component}
            onChange={(e) => setComponent(e.target.value)}
          >
            <option value="select" disabled>
              Select
            </option>
            {componentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* FIELDS */}
        <div className="rp-row rp-fields-row">
          <label className="rp-label">Fields</label>

          <div className="rp-fields-wrap">
            <div className="rp-fields-actions">
              <button
                type="button"
                className="rp-chip small"
                onClick={selectAllFields}
                disabled={!componentIsSelected}
              >
                Select all
              </button>
              <button
                type="button"
                className="rp-chip small"
                onClick={clearAllFields}
                disabled={!componentIsSelected}
              >
                Clear
              </button>
              {componentIsSelected && (
                <span
                  className="rp-fields-limit-summary"
                  style={{
                    color:
                      selectedFields.length > MAX_DOWNLOAD_FIELDS
                        ? "crimson"
                        : "#666",
                  }}
                >
                  {selectedFields.length} selected (max {MAX_DOWNLOAD_FIELDS})
                </span>
              )}
            </div>

            <FieldsGrid
              availableFields={availableFields}
              selectedFields={selectedFields}
              toggleField={toggleField}
              disabled={!componentIsSelected}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="rp-actions">
          <button
            className="rp-btn preview"
            onClick={fetchPreview}
            disabled={!componentIsSelected || previewLoading}
          >
            Preview
          </button>
        </div>

        {/* PREVIEW */}
        {previewOpen && (
          <div className="rp-preview-panel">
            {!previewLoading && !previewError && previewRows.length === 0 && (
              <div className="rp-preview-empty">{previewMessage}</div>
            )}

            {!previewLoading && previewRows.length > 0 && (
              <>
                <table className="rp-preview-table">
                  <thead>
                    <tr>
                      {selectedFields.map((k) => (
                        <th key={k}>{keyToLabel[k] || k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageData.map((row, idx) => (
                      <tr key={idx}>
                        {selectedFields.map((k) => (
                          <td key={k}>
                            {component === "assets" && k === "status"
                              ? deriveLifecycleFromAssignedTo(row.assigned_to)
                              : String(row?.[k] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <Pagination
                    totalPages={totalPages}
                    currentPage={previewPage}
                    onPageChange={setPreviewPage}
                  />
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* ALERT */}
      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        {alertModal.title && <h4>{alertModal.title}</h4>}
        <div style={{ whiteSpace: "pre-wrap" }}>{alertModal.message}</div>
      </Modal>
    </div>
  );
}
