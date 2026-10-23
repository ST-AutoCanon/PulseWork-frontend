

"use client";

import React, { useCallback, useEffect, useState } from "react";
import "./CommonLoginForm.css";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";
import { MdOutlineEdit, MdCheckCircle, MdBlock } from "react-icons/md";
const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"
).replace(/\/+$/, "");

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
const API_URL = `${BACKEND_URL}/api/common-login`;

const INITIAL_FORM = {
  name: "",
  email: "",
  location: "",
  pincode: "",
  password: "",
  confirmPassword: "",
  isActive: true,
};

function isRecordActive(record) {
  return (
    record?.is_active === true ||
    record?.is_active === 1 ||
    record?.is_active === "1" ||
    record?.isActive === true ||
    record?.isActive === 1 ||
    record?.isActive === "1"
  );
}

function getErrorMessage(data, fallback) {
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.message?.message === "string") {
    return data.message.message;
  }
  return fallback;
}

export default function CommonLoginForm() {
  const auth = useAuth() || {};

  const orgId =
    auth.orgId ||
    auth.org_id ||
    auth.raw?.orgId ||
    auth.raw?.org_id ||
    auth.user?.orgId ||
    auth.user?.org_id ||
    auth.user?.organisation_id ||
    "";

  const employeeId =
    auth.employeeId ||
    auth.employee_id ||
    auth.id ||
    auth.raw?.employeeId ||
    auth.raw?.employee_id ||
    auth.user?.employeeId ||
    auth.user?.employee_id ||
    "";

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [records, setRecords] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState(null);
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const [search, setSearch] = useState("");

  const resolvedOrgId = String(orgId || "").trim();

  const showAlert = (alertMessage, type = "success") => {
    setAlertModal({
      isVisible: true,
      message: alertMessage,
      type,
    });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, message: "", type: "success" });
  };

  const getHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "x-employee-id": String(employeeId || "0"),
      "x-org-id": resolvedOrgId,
    }),
    [employeeId, resolvedOrgId]
  );

  const request = useCallback(
    async (url, options = {}) => {
      const response = await fetch(url, {
        credentials: "include",
        ...options,
        headers: {
          ...getHeaders(),
          ...(options.headers || {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `Request failed (${response.status})`
          )
        );
      }

      return data;
    },
    [getHeaders]
  );

  // ------------------------------------------------------------
  // LOAD EXISTING COMMON LOGINS
  // ------------------------------------------------------------

  const loadRecords = useCallback(async () => {
    if (!resolvedOrgId) {
      setRecords([]);
      return;
    }

    try {
      setLoadingList(true);

      const data = await request(API_URL, {
        method: "GET",
      });

      const result =
        Array.isArray(data?.message)
          ? data.message
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.records)
              ? data.records
              : Array.isArray(data?.message?.records)
                ? data.message.records
                : [];

      setRecords(result);
    } catch (error) {
      console.error("[CommonLogin] List error:", error);

      setMessage({
        type: "error",
        text: error.message || "Unable to load common login records.",
      });
    } finally {
      setLoadingList(false);
    }
  }, [request, resolvedOrgId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showForm]);

  // ------------------------------------------------------------
  // FORM INPUTS
  // ------------------------------------------------------------

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMessage({ type: "", text: "" });
  };

const resetForm = () => {
  setForm({ ...INITIAL_FORM });
  setEditingId(null);
  setShowForm(false);
  setMessage({ type: "", text: "" });
  setShowPassword(false);
  setShowConfirmPassword(false);
};

  const handleCreateClick = () => {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
    setShowForm(true);
    setMessage({ type: "", text: "" });
  };

  // ------------------------------------------------------------
  // EDIT EXISTING RECORD
  // ------------------------------------------------------------

  const handleEdit = (record) => {
    const id = record.id ?? record.common_login_id;

    if (id == null) {
      setMessage({
        type: "error",
        text: "This record does not contain a login ID.",
      });
      return;
    }

    setEditingId(id);
    setShowForm(true);

    setForm({
      name: record.name || "",
      email: record.email || "",
      location: record.location || "",
      pincode: String(record.pincode || ""),
      password: "",
      confirmPassword: "",
      isActive: isRecordActive(record),
    });

    setMessage({ type: "", text: "" });
  };

  // ------------------------------------------------------------
  // CREATE OR UPDATE
  // ------------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage({ type: "", text: "" });

    if (!resolvedOrgId) {
      setMessage({
        type: "error",
        text: "Organization ID is missing. Please log in again.",
      });
      return;
    }

    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Name is required." });
      return;
    }

    if (!form.email.trim()) {
      setMessage({ type: "error", text: "Email is required." });
      return;
    }

    if (!form.location.trim()) {
      setMessage({ type: "error", text: "Location is required." });
      return;
    }

    const normalizedPincode = form.pincode.trim();

    if (!/^\d{6}$/.test(normalizedPincode)) {
      setMessage({
        type: "error",
        text: "Pincode must contain exactly 6 digits.",
      });
      return;
    }

    if (!editingId && !form.password) {
      setMessage({ type: "error", text: "Password is required." });
      return;
    }

    if (form.password && form.password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must contain at least 6 characters.",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }

    const payload = {
      orgId: resolvedOrgId,
      name: form.name.trim(),
      email: form.email.trim(),
      location: form.location.trim(),
      pincode: normalizedPincode,
      isActive: form.isActive,
    };

    if (form.password) {
      payload.password = form.password;
    }

    try {
      setSaving(true);

      const isEditing = editingId !== null;
      const url = isEditing
        ? `${API_URL}/${encodeURIComponent(editingId)}`
        : API_URL;

      const data = await request(url, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setMessage({ type: "", text: "" });
      showAlert(
        isEditing
          ? "Common login details updated successfully."
          : "Common login details created successfully."
      );

      setForm({ ...INITIAL_FORM });
      setEditingId(null);
      setShowForm(false);

      await loadRecords();

      console.log("[CommonLogin] Save successful:", data);
    } catch (error) {
      console.error("[CommonLogin] Save error:", error);

      setMessage({ type: "", text: "" });
      showAlert(
        error.message || "Unable to save common login details.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------
  // ACTIVATE / DEACTIVATE LOGIN
  // ------------------------------------------------------------

  const handleToggleStatus = async (record) => {
    const id = record.id ?? record.common_login_id;

    if (id == null) return;

    const currentlyActive = isRecordActive(record);
    const action = currentlyActive ? "disable" : "enable";

    try {
      setChangingStatusId(id);
      setMessage({ type: "", text: "" });

      await request(`${API_URL}/${encodeURIComponent(id)}/${action}`, {
        method: "PATCH",
        body: JSON.stringify({ orgId: resolvedOrgId }),
      });

      setMessage({ type: "", text: "" });
      showAlert(
        currentlyActive
          ? "Common login deactivated successfully."
          : "Common login activated successfully."
      );

      await loadRecords();
    } catch (error) {
      console.error("[CommonLogin] Status update error:", error);

      setMessage({ type: "", text: "" });
      showAlert(error.message || "Unable to update login status.", "error");
    } finally {
      setChangingStatusId(null);
    }
  };

  // ------------------------------------------------------------
  // FILTER LIST
  // ------------------------------------------------------------

  const filteredRecords = records.filter((record) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      record.name,
      record.email,
      record.location,
      record.pincode,
    ].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );
  });

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------

  return (
    <div className="common-login-page">
      {/* LIST — always visible */}
      <div className="common-login-list-card">
        <div className="common-login-list-header">
          <div>
            <h2>Common Login List</h2>
            <p>View and manage created login accounts.</p>
          </div>

          <div className="common-login-list-header-actions">
            <button
              type="button"
              className="common-login-refresh"
              onClick={loadRecords}
              disabled={loadingList || !resolvedOrgId}
            >
              {loadingList ? "Loading..." : "Refresh"}
            </button>

            <button
              type="button"
              className="common-login-create"
              onClick={handleCreateClick}
              disabled={saving}
            >
              Create Common Login Credentials
            </button>
          </div>
        </div>

        {message.text && !showForm && (
          <div
            role="alert"
            className={`common-login-list-message ${
              message.type === "success" ? "success" : "error"
            }`}
          >
            {message.text}
          </div>
        )}

      <div className="common-login-list-toolbar">
  <div className="common-login-search-wrapper">
    <svg
      className="common-login-search-icon"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <input
      type="text"                          /* changed from search */
      aria-label="Search common logins"
      placeholder="Search name, email, location or pincode"
      value={search}
      onChange={(event) => setSearch(event.target.value)}
    />
  </div>

  <span>{filteredRecords.length} record(s)</span>
</div>

        <div className="common-login-table-wrapper">
          <table className="common-login-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Pincode</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loadingList && records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="common-login-empty">
                    Loading common logins...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="common-login-empty">
                    {search
                      ? "No matching common logins found."
                      : "No common login records found."}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const id = record.id ?? record.common_login_id;
                  const active = isRecordActive(record);

                  return (
                    <tr key={id}>
                      <td>{record.name || "—"}</td>
                      <td>{record.email || "—"}</td>
                      <td>{record.location || "—"}</td>
                      <td>{record.pincode || "—"}</td>
                      <td>
                        <span
                          className={`common-login-status-badge ${
                            active ? "active" : "inactive"
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                       <div className="common-login-row-actions">
  <button
    type="button"
    className="common-login-edit"
    onClick={() => handleEdit(record)}
    disabled={saving || changingStatusId !== null}
  >
    <MdOutlineEdit size={15} />
    Edit
  </button>

  <button
    type="button"
    className={
      active
        ? "common-login-deactivate"
        : "common-login-activate"
    }
    onClick={() => handleToggleStatus(record)}
    disabled={
      saving ||
      changingStatusId === id ||
      changingStatusId !== null
    }
  >
    {changingStatusId === id ? (
      "Updating..."
    ) : active ? (
      <>
        <MdBlock size={15} />
        Deactivate
      </>
    ) : (
      <>
        <MdCheckCircle size={15} />
        Activate
      </>
    )}
  </button>
</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL */}
      {showForm && (
        <div
          className="common-login-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              resetForm();
            }
          }}
        >
          <div className="common-login-modal">
            <div className="common-login-header">
              <div>
                <h2>
                  {editingId !== null
                    ? "Edit Common Login"
                    : "Create Common Login Credentials"}
                </h2>
                <p>
                  {editingId !== null
                    ? "Update the selected login details"
                    : "Create common login credentials"}
                </p>
              </div>

              <button
                type="button"
                className="common-login-modal-close"
                onClick={resetForm}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {message.text && (
              <div
                role="alert"
                className={`common-login-message ${
                  message.type === "success" ? "success" : "error"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="common-login-grid">
                <div className="common-login-field">
                  <label htmlFor="common-login-name">
                    Name <span>*</span>
                  </label>
                  <input
                    id="common-login-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter name"
                    disabled={saving}
                    autoComplete="name"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="common-login-field">
                  <label htmlFor="common-login-email">
                    Email <span>*</span>
                  </label>
                  <input
                    id="common-login-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    disabled={saving}
                    autoComplete="email"
                    maxLength={255}
                    required
                  />
                </div>
              </div>

              <div className="common-login-grid">
                <div className="common-login-field">
                  <label htmlFor="common-login-location">
                    Location <span>*</span>
                  </label>
                  <input
                    id="common-login-location"
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Enter city or location"
                    disabled={saving}
                    autoComplete="address-level2"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="common-login-field">
                  <label htmlFor="common-login-pincode">
                    Pincode <span>*</span>
                  </label>
                  <input
                    id="common-login-pincode"
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={(event) => {
                      const value = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                      setForm((previous) => ({
                        ...previous,
                        pincode: value,
                      }));

                      setMessage({ type: "", text: "" });
                    }}
                    placeholder="Enter 6-digit pincode"
                    disabled={saving}
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                  />
                </div>
              </div>

             <div className="common-login-grid">
  {/* Password */}
  <div className="common-login-field">
    <label htmlFor="common-login-password">
      Password {editingId === null && <span>*</span>}
    </label>
    <div className="common-login-password-wrapper">
      <input
        id="common-login-password"
        type={showPassword ? "text" : "password"}
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder={
          editingId !== null
            ? "Leave blank to keep current password"
            : "Enter password"
        }
        disabled={saving}
        autoComplete="new-password"
        minLength={6}
        required={editingId === null}
      />
      <button
        type="button"
        className="common-login-password-toggle"
        onClick={() => setShowPassword((prev) => !prev)}
        tabIndex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  </div>

  {/* Confirm Password */}
  <div className="common-login-field">
    <label htmlFor="common-login-confirm-password">
      Confirm Password {editingId === null && <span>*</span>}
    </label>
    <div className="common-login-password-wrapper">
      <input
        id="common-login-confirm-password"
        type={showConfirmPassword ? "text" : "password"}
        name="confirmPassword"
        value={form.confirmPassword}
        onChange={handleChange}
        placeholder={
          editingId !== null
            ? "Confirm new password if changing"
            : "Confirm password"
        }
        disabled={saving}
        autoComplete="new-password"
        minLength={6}
        required={editingId === null || Boolean(form.password)}
      />
      <button
        type="button"
        className="common-login-password-toggle"
        onClick={() => setShowConfirmPassword((prev) => !prev)}
        tabIndex={-1}
        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
      >
        {showConfirmPassword ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  </div>
</div>

              <div className="common-login-status">
                <label className="common-login-switch">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <span className="common-login-slider"></span>
                </label>

                <div>
                  <strong>Active Login</strong>
                  <p>Allow this user to use the common login.</p>
                </div>
              </div>

              <div className="common-login-actions">
                <button
                  type="button"
                  className="common-login-reset"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="common-login-save"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save Changes"
                      : "Save Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p
          style={{
            textAlign: "center",
            fontSize: "16px",
            padding: "10px 0",
            color: alertModal.type === "error" ? "#dc2626" : "#111827",
          }}
        >
          {alertModal.message}
        </p>
      </Modal>
    </div>
  );
}