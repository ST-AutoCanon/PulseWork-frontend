"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MdOutlineCalendarToday,
  MdOutlineEdit,
  MdDeleteOutline,
  MdOutlineCancel,
  MdOutlineRemoveRedEye,
} from "react-icons/md";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "../Modal/Modal.client";
import EmployeeForm from "./EmployeeForm.client";
import "./EmployeeDetails.css";
import { useAuth } from "../../context/AuthProvider.client";

function toUrlArray(maybe) {
  if (!maybe) return [];
  if (Array.isArray(maybe)) return maybe.filter(Boolean);
  if (typeof maybe === "string") {
    const s = maybe.trim();
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const p = JSON.parse(s);
        if (Array.isArray(p)) return p.filter(Boolean);
      } catch {}
    }
    if (s.includes(","))
      return s
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    return [s];
  }
  return [];
}

function formatSafeMonthYear(dateStr) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy");
  } catch {
    return dateStr.split("T")[0] || dateStr;
  }
}

function CustomPopup({ title, children, onClose }) {
  return (
    <div className="ed-popup-overlay">
      <div className="ed-popup-content">
        <header className="ed-popup-header">
          <h3>{title}</h3>
          <button className="ed-popup-close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="ed-popup-body">{children}</div>
      </div>
    </div>
  );
}

function TabbedPersonalDetails({ emp }) {
  const [tab, setTab] = useState("self");

  const fmt = (d) => {
    if (!d) return "—";
    try {
      return format(new Date(d), "dd MMM yyyy");
    } catch {
      return (d || "").split("T")[0] || "—";
    }
  };

  return (
    <div>
      <div className="ed-tab-panel">
        <button
          type="button"
          onClick={() => setTab("self")}
          className={tab === "self" ? "ed-tab-active" : "ed-tab"}
        >
          Self Details
        </button>
        <button
          type="button"
          onClick={() => setTab("gov")}
          className={tab === "gov" ? "ed-tab-active" : "ed-tab"}
        >
          Government Details
        </button>
        <button
          type="button"
          onClick={() => setTab("family")}
          className={tab === "family" ? "ed-tab-active" : "ed-tab"}
        >
          Family Details
        </button>
      </div>

      {tab === "self" && (
        <dl className="detail-list">
          <dt>Name</dt>
          <dd>{emp.name ?? "—"}</dd>

          <dt>Email</dt>
          <dd>{emp.email ?? "—"}</dd>

          <dt>Alternate Email</dt>
          <dd>{emp.alternate_email ?? "—"}</dd>

          <dt>Mobile</dt>
          <dd>{emp.phone_number ?? "—"}</dd>

          <dt>Alternate Mobile</dt>
          <dd>{emp.alternate_number ?? "—"}</dd>

          <dt>Address</dt>
          <dd>{emp.address ?? "—"}</dd>

          <dt>DOB</dt>
          <dd>{fmt(emp.dob)}</dd>

          <dt>Gender</dt>
          <dd>{emp.gender ?? "—"}</dd>

          <dt>Blood Group</dt>
          <dd>{emp.blood_group ?? "—"}</dd>

          <dt>Emergency</dt>
          <dd>
            {emp.emergency_name ? `${emp.emergency_name}` : "—"}
            {emp.emergency_contact_person
              ? ` (${emp.emergency_contact_person})`
              : ""}
            {emp.emergency_number ? ` (${emp.emergency_number})` : ""}
          </dd>

          <dt>Employee ID</dt>
          <dd>{emp.employee_id ?? "—"}</dd>

          <dt>Joining Date</dt>
          <dd>{fmt(emp.joining_date)}</dd>
        </dl>
      )}

      {tab === "gov" && (
        <dl className="detail-list">
          <dt>Aadhaar No</dt>
          <dd>{emp.aadhaar_number ?? "—"}</dd>

          <dt>PAN No</dt>
          <dd>{emp.pan_number ?? "—"}</dd>

          <dt>Passport No</dt>
          <dd>{emp.passport_number ?? "—"}</dd>

          <dt>Driving License</dt>
          <dd>{emp.driving_license_number ?? "—"}</dd>

          <dt>Voter ID</dt>
          <dd>{emp.voter_id ?? "—"}</dd>

          <dt>UAN</dt>
          <dd>{emp.uan_number ?? "—"}</dd>

          <dt>PF</dt>
          <dd>{emp.pf_number ?? "—"}</dd>

          <dt>ESI</dt>
          <dd>{emp.esi_number ?? "—"}</dd>
        </dl>
      )}

      {tab === "family" && (
        <dl className="detail-list">
          <dt>Father's Name</dt>
          <dd>{emp.father_name ?? "—"}</dd>

          <dt>Father's DOB</dt>
          <dd>{fmt(emp.father_dob)}</dd>

          <dt>Mother's Name</dt>
          <dd>{emp.mother_name ?? "—"}</dd>

          <dt>Mother's DOB</dt>
          <dd>{fmt(emp.mother_dob)}</dd>

          <dt>Marital Status</dt>
          <dd>{emp.marital_status ?? "—"}</dd>

          <dt>Spouse Name</dt>
          <dd>{emp.spouse_name ?? "—"}</dd>

          <dt>Spouse DOB</dt>
          <dd>{fmt(emp.spouse_dob)}</dd>

          <dt>Child 1</dt>
          <dd>
            {emp.child1_name
              ? `${emp.child1_name} (${fmt(emp.child1_dob)})`
              : "—"}
          </dd>

          <dt>Child 2</dt>
          <dd>
            {emp.child2_name
              ? `${emp.child2_name} (${fmt(emp.child2_dob)})`
              : "—"}
          </dd>

          <dt>Child 3</dt>
          <dd>
            {emp.child3_name
              ? `${emp.child3_name} (${fmt(emp.child3_dob)})`
              : "—"}
          </dd>
        </dl>
      )}
    </div>
  );
}

function DocsPopup({ sections, onOpen, onDownload, onClose }) {
  const [tab, setTab] = useState(sections?.[0]?.title || "Personal");

  return (
    <div>
      <div className="ed-tab-panel">
        {sections.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setTab(s.title)}
            className={tab === s.title ? "ed-tab-active" : "ed-tab"}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div>
        {sections.map(({ title, docs }) =>
          title !== tab ? null : (
            <div key={title}>
              {docs && docs.length ? (
                docs.map((doc, idx) => (
                  <div key={idx}>
                    <dl className="detail-list">
                      <dt>{doc.label}</dt>
                      <dd>
                        <button
                          type="button"
                          className="doc-link"
                          onClick={() => onOpen(doc.url)}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          className="doc-link"
                          onClick={() => onDownload(doc.url)}
                        >
                          Download
                        </button>
                      </dd>
                    </dl>
                  </div>
                ))
              ) : (
                <p>No documents.</p>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default function EmployeeDetails() {
  const { user } = useAuth();
  const meId = user?.employeeId ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupContent, setPopupContent] = useState(null);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState(null);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    message: "",
  });
  const [docsModal, setDocsModal] = useState({
    visible: false,
    docs: [],
    employeeName: "",
  });

  const [formMode, setFormMode] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const headers = { "x-api-key": API_KEY };
        if (meId) headers["x-employee-id"] = meId;
        if (orgId) headers["x-org-id"] = orgId;

        let url = `${BASE_URL}/departments`;
        if (orgId) {
          const sep = url.includes("?") ? "&" : "?";
          url = `${url}${sep}orgId=${encodeURIComponent(orgId)}`;
        }

        const res = await axios.get(url, { withCredentials: true, headers });
        setDepartments(res.data.departments || []);
      } catch (err) {
        console.error("Failed to load departments:", err);
      }
    };

    loadDepartments();
  }, [BASE_URL, API_KEY, meId, orgId]);

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, fromDate, toDate, orgId, meId]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError("");
    try {
      let url = `${BASE_URL}/admin/employees`;
      const params = [];

      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (fromDate) params.push(`fromDate=${format(fromDate, "yyyy-MM-dd")}`);
      if (toDate) params.push(`toDate=${format(toDate, "yyyy-MM-dd")}`);
      if (orgId) params.push(`orgId=${encodeURIComponent(orgId)}`);
      if (params.length) url += `?${params.join("&")}`;
      const headers = { "x-api-key": API_KEY };
      if (meId) headers["x-employee-id"] = meId;
      if (orgId) headers["x-org-id"] = orgId;

      const res = await axios.get(url, { withCredentials: true, headers });
      const list =
        res.data?.message?.data ||
        res.data?.message ||
        res.data?.data ||
        res.data?.employees ||
        res.data ||
        [];

      setEmployees(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("fetchEmployees error:", err);
      setError("Failed to fetch employees.");
    } finally {
      setIsLoading(false);
    }
  };

  const openPopup = (title, content) => {
    setPopupTitle(title);
    setPopupContent(content);
    setPopupVisible(true);
  };
  const closePopup = () => setPopupVisible(false);

  const showAlert = (message) => setAlertModal({ isVisible: true, message });
  const closeAlert = () => setAlertModal({ isVisible: false, message: "" });

  async function fetchDocBlob(fullUrl, headers) {
    const resp = await axios.get(fullUrl, {
      responseType: "blob",
      withCredentials: true,
      headers,
    });
    return {
      blob: new Blob([resp.data], {
        type: resp.headers["content-type"] || "application/octet-stream",
      }),
      filename: fullUrl.split("/").pop(),
    };
  }

  async function openDocument(url, deps) {
    const { BASE_URL, API_KEY, meId, orgId, showAlert } = deps;
    if (!url) return showAlert?.("No document URL");
    try {
      const headers = {
        "x-api-key": API_KEY,
        ...(meId ? { "x-employee-id": meId } : {}),
        ...(orgId ? { "x-org-id": orgId } : {}),
      };
      const { blob } = await fetchDocBlob(`${BASE_URL}/docs${url}`, headers);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000 * 60);
    } catch (err) {
      console.error("openDoc error:", err);
      showAlert?.("Failed to open document");
    }
  }

  async function downloadDocument(url, deps) {
    const { BASE_URL, API_KEY, meId, orgId, showAlert } = deps;
    if (!url) return showAlert?.("No document URL");
    try {
      const headers = {
        "x-api-key": API_KEY,
        ...(meId ? { "x-employee-id": meId } : {}),
        ...(orgId ? { "x-org-id": orgId } : {}),
      };
      const { blob, filename } = await fetchDocBlob(
        `${BASE_URL}/docs${url}`,
        headers,
      );
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000 * 60);
    } catch (err) {
      console.error("downloadDoc error:", err);
      showAlert?.("Failed to download document");
    }
  }

  const handleViewDocs = async (empId) => {
    try {
      const headers = { "x-api-key": API_KEY };
      if (meId) headers["x-employee-id"] = meId;
      if (orgId) headers["x-org-id"] = orgId;

      const res = await axios.get(`${BASE_URL}/full/${empId}`, {
        withCredentials: true,
        headers,
      });
      const d = res.data.data || {};

      const personal = [
        ...toUrlArray(d.photo_url).map((u) => ({ label: "Photo", url: u })),
        ...toUrlArray(d.aadhaar_doc_url).map((u) => ({
          label: "Aadhaar",
          url: u,
        })),
        ...toUrlArray(d.pan_doc_url).map((u) => ({ label: "PAN", url: u })),
        ...toUrlArray(d.passport_doc_url).map((u) => ({
          label: "Passport",
          url: u,
        })),
        ...toUrlArray(d.voter_id_doc_url).map((u) => ({
          label: "Voter Id",
          url: u,
        })),
        ...toUrlArray(d.driving_license_doc_url).map((u) => ({
          label: "Driving License",
          url: u,
        })),
      ];

      const education = [
        ...toUrlArray(d.tenth_cert_url).map((u) => ({
          label: "10th Certificate",
          url: u,
        })),
        ...toUrlArray(d.twelfth_cert_url).map((u) => ({
          label: "12th Certificate",
          url: u,
        })),
        ...toUrlArray(d.ug_cert_url).map((u) => ({
          label: "UG Certificate",
          url: u,
        })),
        ...toUrlArray(d.pg_cert_url).map((u) => ({
          label: "PG Certificate",
          url: u,
        })),
      ];

      const professional = [
        ...toUrlArray(d.resume_url).map((u) => ({ label: "Resume", url: u })),
      ];

      if (Array.isArray(d.experience)) {
        d.experience.forEach((exp, idx) => {
          const desc = exp.company
            ? `Experience: ${exp.company}`
            : `Experience #${idx + 1}`;
          const candidateKeys = [exp.files, exp.doc_urls, exp.doc, exp.doc_url];
          candidateKeys.forEach((k) => {
            toUrlArray(k).forEach((u) =>
              professional.push({ label: desc, url: u }),
            );
          });
        });
      }

      professional.push(
        ...toUrlArray(d.other_docs).map((u, i) => ({
          label: `Other #${i + 1}`,
          url: u,
        })),
      );

      if (Array.isArray(d.additional_certs)) {
        d.additional_certs.forEach((c, idx) => {
          const title = c.name
            ? `Cert: ${c.name}`
            : `Additional Cert #${idx + 1}`;
          toUrlArray(c.files || c.file_urls || c.file_url || c.file).forEach(
            (u) => education.push({ label: title, url: u }),
          );
        });
      }

      const family = [
        ...toUrlArray(d.father_gov_doc_url).map((u, i) => ({
          label: `Father Doc #${i + 1}`,
          url: u,
        })),
        ...toUrlArray(d.mother_gov_doc_url).map((u, i) => ({
          label: `Mother Doc #${i + 1}`,
          url: u,
        })),
        ...toUrlArray(d.spouse_gov_doc_url).map((u, i) => ({
          label: `Spouse Doc #${i + 1}`,
          url: u,
        })),
        ...toUrlArray(d.child1_gov_doc_url).map((u, i) => ({
          label: `Child1 Doc #${i + 1}`,
          url: u,
        })),
        ...toUrlArray(d.child2_gov_doc_url).map((u, i) => ({
          label: `Child2 Doc #${i + 1}`,
          url: u,
        })),
        ...toUrlArray(d.child3_gov_doc_url).map((u, i) => ({
          label: `Child3 Doc #${i + 1}`,
          url: u,
        })),
      ];

      const sections = [
        { title: "Personal", docs: personal },
        { title: "Educational", docs: education },
        { title: "Professional", docs: professional },
        { title: "Family", docs: family },
      ];

      const deps = { BASE_URL, API_KEY, meId, orgId, showAlert };

      openPopup(
        "Documents",
        <DocsPopup
          sections={sections}
          onOpen={(url) => openDocument(url, deps)}
          onDownload={(url) => downloadDocument(url, deps)}
          onClose={closePopup}
        />,
      );
    } catch (err) {
      console.error("handleViewDocs error:", err);
      openPopup("Documents", <p>Unable to load documents.</p>);
    }
  };

  const handleAdd = async (data) => {
    try {
      const baseHeaders = { "x-api-key": API_KEY };
      if (meId) baseHeaders["x-employee-id"] = meId;
      if (orgId) baseHeaders["x-org-id"] = orgId;

      if (typeof FormData !== "undefined" && data instanceof FormData) {
        if (orgId && !data.has("orgId")) {
          data.append("orgId", orgId);
        }
        await axios.post(`${BASE_URL}/full`, data, {
          withCredentials: true,
          headers: baseHeaders,
        });
      } else {
        const body = { ...(data || {}) };
        if (orgId) body.orgId = orgId;
        await axios.post(`${BASE_URL}/full`, body, {
          withCredentials: true,
          headers: { ...baseHeaders, "Content-Type": "application/json" },
        });
      }

      showAlert("Employee added successfully.");
      closeForm();
      fetchEmployees();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to add employee. Please try again.";
      throw new Error(msg);
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      const baseHeaders = { "x-api-key": API_KEY };
      if (meId) baseHeaders["x-employee-id"] = meId;
      if (orgId) baseHeaders["x-org-id"] = orgId;

      if (typeof FormData !== "undefined" && formData instanceof FormData) {
        if (orgId && !formData.has("orgId")) {
          formData.append("orgId", orgId);
        }
        await axios.put(`${BASE_URL}/full/${id}`, formData, {
          withCredentials: true,
          headers: baseHeaders,
        });
      } else {
        const body = { ...(formData || {}) };
        if (orgId) body.orgId = orgId;
        await axios.put(`${BASE_URL}/full/${id}`, body, {
          withCredentials: true,
          headers: { ...baseHeaders, "Content-Type": "application/json" },
        });
      }

      showAlert("Employee updated successfully.");
      closeForm();
      fetchEmployees();
    } catch (err) {
      console.error("update employee error:", err);
      showAlert("Failed to update employee. Please try again.");
    }
  };

  const handleEditClick = async (id) => {
    try {
      const headers = { "x-api-key": API_KEY };
      if (meId) headers["x-employee-id"] = meId;
      if (orgId) headers["x-org-id"] = orgId;

      const res = await axios.get(`${BASE_URL}/full/${id}`, {
        withCredentials: true,
        headers,
      });
      setSelectedEmployee(res.data.data);
      setFormMode("edit");
    } catch (err) {
      console.error("handleEditClick error:", err);
      showAlert("Failed to load employee data.");
    }
  };

  const handleDeactivateEmployee = async () => {
    if (!deleteEmployeeId) return;

    try {
      const headers = {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      };
      if (meId) headers["x-employee-id"] = meId;
      if (orgId) headers["x-org-id"] = orgId;

      await axios.put(
        `${BASE_URL}/admin/employees/${deleteEmployeeId}/deactivate`,
        {},
        { withCredentials: true, headers },
      );

      setDeleteEmployeeId(null);
      showAlert("Employee Deactivated successfully.");
      fetchEmployees();
    } catch (err) {
      console.error("Deactivate error:", err);
      setError("Failed to deactivate employee");
    } finally {
      setModalVisible(false);
    }
  };

  const closeForm = () => {
    setFormMode(null);
    setSelectedEmployee(null);
  };

  const handleSearchClick = () => {
    fetchEmployees();
  };

  return (
    <div className="employee-details-container">
      <h2>Employee Details</h2>
      <div className="ed-header-container">
        <div className="search-container">
          <label>
            <strong>Search by</strong>
          </label>
          <div className="search-box">
            <input
              type="text"
              className="ed-search-input"
              placeholder="Name, EmpID, Email, Dept"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="calendar-input-group">
          <label className="calendar-label">
            <strong>Date From:</strong>
          </label>
          <div className="calendar-input-wrapper">
            <DatePicker
              selected={fromDate}
              onChange={(date) => setFromDate(date)}
              dateFormat="dd-MM-yyyy"
              isClearable
              customInput={
                <div className="custom-calendar-input">
                  <input
                    type="text"
                    value={fromDate ? format(fromDate, "dd-MM-yyyy") : ""}
                    readOnly
                    placeholder="Select Date"
                  />
                  <MdOutlineCalendarToday className="calendar-icon" />
                </div>
              }
            />
          </div>
        </div>

        <div className="calendar-input-group">
          <label className="calendar-label">
            <strong>To:</strong>
          </label>
          <div className="calendar-input-wrapper">
            <DatePicker
              selected={toDate}
              onChange={(date) => setToDate(date)}
              dateFormat="dd-MM-yyyy"
              isClearable
              customInput={
                <div className="custom-calendar-input">
                  <input
                    type="text"
                    value={toDate ? format(toDate, "dd-MM-yyyy") : ""}
                    readOnly
                    placeholder="Select Date"
                  />
                  <MdOutlineCalendarToday className="calendar-icon" />
                </div>
              }
            />
          </div>
        </div>

        <div className="button-search">
          <button className="emp-search-text" onClick={handleSearchClick}>
            <i className="fas fa-search ed-search-icon"></i> Search
          </button>
        </div>

        <button
          onClick={() => setFormMode("add")}
          className="add-employee-button"
        >
          + Add Employee
        </button>
      </div>

      {formMode && (
        <div className="emp-form-overlay">
          <div className="emp-form-modal">
            <div className="emp-form-title">
              <h3>
                {formMode === "add" ? "Add New Employee" : "Update Employee"}
              </h3>
              <MdOutlineCancel
                onClick={closeForm}
                className="emp-form-close-icon"
              />
            </div>
            {formMode && (
              <EmployeeForm
                initialData={formMode === "edit" ? selectedEmployee : {}}
                onSubmit={
                  formMode === "edit"
                    ? (fd) => handleUpdate(selectedEmployee.employee_id, fd)
                    : handleAdd
                }
                onCancel={closeForm}
                departments={departments}
              />
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="employee-table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Emp Name</th>
                <th>DOJ</th>
                <th>Status</th>
                <th>Personal</th>
                <th>Education</th>
                <th>Professional</th>
                <th>Bank</th>
                <th>Docs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="10">No employees found</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td>
                      <strong>{emp.employee_id}</strong>
                    </td>
                    <td>{emp.name}</td>
                    <td>
                      {emp.joining_date
                        ? format(new Date(emp.joining_date), "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td
                      className={
                        emp.status === "Active"
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {emp.status}
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() =>
                          openPopup(
                            "Personal Details",
                            <TabbedPersonalDetails emp={emp} />,
                          )
                        }
                      >
                        <MdOutlineRemoveRedEye className="view-btn-icon" />
                        View
                      </button>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() =>
                          openPopup(
                            "Education Details",
                            <dl className="detail-list">
                              <dt>10th:</dt>
                              <dd>
                                {emp.tenth_board} ({emp.tenth_year}) -{" "}
                                {emp.tenth_score}%
                              </dd>
                              <dt>12th:</dt>
                              <dd>
                                {emp.twelfth_board} ({emp.twelfth_year}) -{" "}
                                {emp.twelfth_score}%
                              </dd>
                              <dt>UG:</dt>
                              <dd>
                                {emp.ug_board} ({emp.ug_year}) - {emp.ug_score}%
                              </dd>
                              <dt>PG:</dt>
                              <dd>
                                {emp.pg_board} ({emp.pg_year}) - {emp.pg_score}%
                              </dd>
                              <dt>Additional Certifications:</dt>
                              <dd>
                                {(emp.additional_certs || []).length === 0 ? (
                                  "—"
                                ) : (
                                  <div>
                                    {(emp.additional_certs || []).map(
                                      (c, i) => (
                                        <dd key={i}>
                                          <strong>
                                            {c.name ||
                                              c.cert_name ||
                                              "Untitled"}
                                          </strong>
                                          {c.institution
                                            ? ` — ${c.institution}`
                                            : ""}
                                          {c.year ? ` (${c.year})` : ""}
                                        </dd>
                                      ),
                                    )}
                                  </div>
                                )}
                              </dd>
                            </dl>,
                          )
                        }
                      >
                        <MdOutlineRemoveRedEye className="view-btn-icon" />
                        View
                      </button>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() =>
                          openPopup(
                            "Professional Details",
                            <dl className="detail-list">
                              <dt>Employee Type:</dt>
                              <dd>{emp.employee_type}</dd>
                              <dt>Department:</dt>
                              <dd>{emp.department}</dd>
                              <dt>Position:</dt>
                              <dd>{emp.position}</dd>
                              <dt>Role:</dt>
                              <dd>{emp.role}</dd>
                              <dt>Supervisor:</dt>
                              <dd>{emp.supervisor_name}</dd>
                              <dt>Salary:</dt>
                              <dd>{emp.salary}</dd>
                              <dt>Joining Date:</dt>
                              <dd>{emp.joining_date}</dd>
                              <dt>Experience:</dt>
                              <dd>
                                {(emp.experience || []).length === 0 ? (
                                  "—"
                                ) : (
                                  <dl>
                                    {(emp.experience || []).map((exp, i) => {
                                      const role =
                                        exp.role ||
                                        exp.designation ||
                                        exp.title ||
                                        "—";
                                      const s = exp.start_date
                                        ? formatSafeMonthYear(exp.start_date)
                                        : "—";
                                      const e = exp.end_date
                                        ? formatSafeMonthYear(exp.end_date)
                                        : "Present";
                                      return (
                                        <dd key={i}>
                                          {exp.company
                                            ? `${exp.company}: `
                                            : ""}
                                          {s} - {e} ({role})
                                        </dd>
                                      );
                                    })}
                                  </dl>
                                )}
                              </dd>
                            </dl>,
                          )
                        }
                      >
                        <MdOutlineRemoveRedEye className="view-btn-icon" />
                        View
                      </button>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() =>
                          openPopup(
                            "Bank Details",
                            <dl className="detail-list">
                              <dt>Bank:</dt>
                              <dd>{emp.bank_name}</dd>
                              <dt>Account No:</dt>
                              <dd>{emp.account_number}</dd>
                              <dt>IFSC:</dt>
                              <dd>{emp.ifsc_code}</dd>
                              <dt>Branch:</dt>
                              <dd>{emp.branch_name}</dd>
                            </dl>,
                          )
                        }
                      >
                        <MdOutlineRemoveRedEye className="view-btn-icon" />
                        View
                      </button>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewDocs(emp.employee_id)}
                      >
                        <MdOutlineRemoveRedEye className="view-btn-icon" />
                        View
                      </button>
                    </td>
                    <td>
                      <MdOutlineEdit
                        className={`edit${emp.status === "Inactive" ? " disabled" : ""}`}
                        onClick={() => handleEditClick(emp.employee_id)}
                      />

                      <MdDeleteOutline
                        className={`deactivate${emp.status === "Inactive" ? " disabled" : ""}`}
                        onClick={() => {
                          setDeleteEmployeeId(emp.employee_id);
                          setModalVisible(true);
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {popupVisible && (
        <CustomPopup title={popupTitle} onClose={closePopup}>
          {popupContent}
        </CustomPopup>
      )}

      {modalVisible && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h2>Confirm Deactivation</h2>
            <p>
              Deactivating this employee will immediately freeze their account:
              they will no longer be able to log in, access company resources,
              or receive system notifications.
            </p>
            <p>Do you really want to proceed?</p>
            <div className="delete-buttons">
              <button
                onClick={() => setModalVisible(false)}
                className="delete-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateEmployee}
                className="delete-modal-delete"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {alertModal.isVisible && (
        <Modal
          isVisible
          onClose={closeAlert}
          buttons={[{ label: "OK", onClick: closeAlert }]}
        >
          <p>{alertModal.message}</p>
        </Modal>
      )}
    </div>
  );
}
