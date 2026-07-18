

"use client";

import React, { useState, useEffect } from "react";
import {
  MdAdd,
  MdSearch,
  MdLocationOn,
  MdPeople,
  MdEdit,
  MdDelete,
} from "react-icons/md";
import "./OfficeLocations.css";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";

const OfficeLocations = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingOfficeId, setEditingOfficeId] = useState(null);

  // Employee assignment modal states
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  // Custom Alert Modal State
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  // Form Error State
  const [formError, setFormError] = useState("");

  const { user } = useAuth();
  const orgId = user?.orgId;

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const [formData, setFormData] = useState({
    officeName: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: 100,
    status: "Active",
  });

  const showAlert = (message, type = "success") => {
    setAlertModal({ isVisible: true, message, type });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, message: "", type: "success" });
  };

  const filteredLocations = locations.filter(
    (item) =>
      item.office?.toLowerCase().includes(search.toLowerCase()) ||
      item.address?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEmployees = allEmployees.filter((emp) => {
    const q = employeeSearch.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.employee_id?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setFormData({
      officeName: "",
      address: "",
      latitude: "",
      longitude: "",
      radius: 100,
      status: "Active",
    });
    setEditingOfficeId(null);
    setFormError("");
  };

  const resetEmployeesModal = () => {
    setShowEmployeesModal(false);
    setSelectedOffice(null);
    setAllEmployees([]);
    setSelectedEmployeeIds([]);
    setEmployeeSearch("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formError) setFormError("");
  };

  const fetchOfficeLocations = async () => {
    if (!orgId || !API_BASE) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/office-locations/list?orgId=${orgId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(API_KEY ? { "x-api-key": API_KEY } : {}),
          },
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch office locations");
      }

      const formattedLocations = (result.data || []).map((item) => ({
        id: item.id,
        office: item.office_name || item.office || "",
        address: item.address || "",
        radius: Number(item.radius) || 0,
        employees: Number(item.employees) || 0,
        status: item.status || "Active",
        latitude: item.latitude ? parseFloat(item.latitude) : "",
        longitude: item.longitude ? parseFloat(item.longitude) : "",
      }));

      setLocations(formattedLocations);
    } catch (error) {
      console.error("Fetch office locations error:", error);
      showAlert(error.message || "Failed to fetch office locations", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchOfficeLocations();
    }
  }, [orgId]);

  const handleSave = async () => {
    setFormError("");

    if (
      !formData.officeName?.trim() ||
      !formData.address?.trim() ||
      !formData.latitude ||
      !formData.longitude
    ) {
      setFormError("Please fill Office Name, Address, Latitude and Longitude.");
      return;
    }

    if (!orgId) {
      showAlert("Organization ID not found", "error");
      return;
    }

    if (!API_BASE) {
      showAlert("NEXT_PUBLIC_BACKEND_URL is missing in frontend .env", "error");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        orgId,
        officeName: formData.officeName.trim(),
        address: formData.address.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        radius: Number(formData.radius),
        status: formData.status,
      };

      const isEdit = !!editingOfficeId;

      const url = isEdit
        ? `${API_BASE}/api/office-locations/update/${editingOfficeId}`
        : `${API_BASE}/api/office-locations/create`;

      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            (isEdit ? "Failed to update office location" : "Failed to create office location")
        );
      }

      const savedOffice = {
        id: result.data?.id || editingOfficeId,
        office: result.data?.office_name || result.data?.office || payload.officeName,
        address: result.data?.address || payload.address,
        radius: Number(result.data?.radius ?? payload.radius),
        employees: isEdit
          ? locations.find((loc) => loc.id === editingOfficeId)?.employees || 0
          : Number(result.data?.employees) || 0,
        status: result.data?.status || payload.status,
        latitude: parseFloat(result.data?.latitude ?? payload.latitude),
        longitude: parseFloat(result.data?.longitude ?? payload.longitude),
      };

      if (isEdit) {
        setLocations((prev) =>
          prev.map((item) => (item.id === editingOfficeId ? savedOffice : item))
        );
      } else {
        setLocations((prev) => [savedOffice, ...prev]);
      }

      setShowModal(false);
      resetForm();
      showAlert(isEdit ? "Office location updated successfully" : "Office location created successfully");
    } catch (error) {
      console.error("Save office location error:", error);
      showAlert(error.message || (editingOfficeId ? "Failed to update" : "Failed to create"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location) => {
    setEditingOfficeId(location.id);
    setFormData({
      officeName: location.office || "",
      address: location.address || "",
      latitude: location.latitude ? String(location.latitude) : "",
      longitude: location.longitude ? String(location.longitude) : "",
      radius: location.radius || 100,
      status: location.status || "Active",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleDelete = async (officeId) => {
    if (!orgId) {
      showAlert("Organization ID not found", "error");
      return;
    }

    if (typeof window !== "undefined") {
      if (!window.confirm("Are you sure you want to delete this office location?")) {
        return;
      }
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/office-locations/delete/${officeId}?orgId=${orgId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(API_KEY ? { "x-api-key": API_KEY } : {}),
          },
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete office location");
      }

      setLocations((prev) => prev.filter((item) => item.id !== officeId));
      showAlert("Office location deleted successfully");
    } catch (error) {
      console.error("Delete office location error:", error);
      showAlert(error.message || "Failed to delete office location", "error");
    } finally {
      setLoading(false);
    }
  };

  // Employee Assignment Logic
  const fetchAllEmployees = async () => {
    const response = await fetch(
      `${API_BASE}/api/office-location-employees/employees?orgId=${orgId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        },
        credentials: "include",
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Failed to fetch employees");
    return result.data || [];
  };

  const fetchAssignedEmployees = async (officeId) => {
    const response = await fetch(
      `${API_BASE}/api/office-location-employees/${officeId}/employees?orgId=${orgId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        },
        credentials: "include",
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Failed to fetch assigned employees");
    return result.data || [];
  };

  const handleOpenEmployeesModal = async (office) => {
    if (!orgId || !API_BASE) {
      showAlert("Configuration missing", "error");
      return;
    }

    try {
      setEmployeeLoading(true);
      setSelectedOffice(office);
      setShowEmployeesModal(true);

      const [employeesList, assignedEmployees] = await Promise.all([
        fetchAllEmployees(),
        fetchAssignedEmployees(office.id),
      ]);

      const normalizedEmployees = employeesList.map((emp) => ({
        employee_id: emp.employee_id,
        name: emp.name || [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(" "),
        email: emp.email || "",
        phone_number: emp.phone_number || "",
        status: emp.status || "Active",
      }));

      setAllEmployees(normalizedEmployees);
      setSelectedEmployeeIds(assignedEmployees.map((emp) => String(emp.employee_id)));
    } catch (error) {
      console.error("Open employees modal error:", error);
      showAlert(error.message || "Failed to load employees", "error");
      resetEmployeesModal();
    } finally {
      setEmployeeLoading(false);
    }
  };

  const handleEmployeeCheckbox = (employeeId) => {
    setSelectedEmployeeIds((prev) => {
      const stringId = String(employeeId);
      if (prev.includes(stringId)) {
        return prev.filter((id) => id !== stringId);
      }
      return [...prev, stringId];
    });
  };

  const handleSaveEmployees = async () => {
    if (!selectedOffice?.id) {
      showAlert("Office not selected", "error");
      return;
    }

    if (!orgId || !API_BASE) {
      showAlert("Configuration missing", "error");
      return;
    }

    try {
      setEmployeeLoading(true);

      const endpoint = `${API_BASE}/api/office-location-employees/${selectedOffice.id}/sync-employees`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          orgId,
          employeeIds: selectedEmployeeIds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update employees");
      }

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === selectedOffice.id
            ? { ...loc, employees: selectedEmployeeIds.length }
            : loc
        )
      );

      showAlert(result.message || "Employees assignment updated successfully");
      resetEmployeesModal();
    } catch (error) {
      console.error(error);
      showAlert(error.message || "Failed to update employees assignment", "error");
    } finally {
      setEmployeeLoading(false);
    }
  };

  return (
    <div className="office_loc-office-page">
      <div className="office_loc-office-header">
        <div>
          <h2>Office Locations</h2>
          <p>Manage office locations used for Login and Punch In / Punch Out.</p>
        </div>

        <button
          className="office_loc-create-btn"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <MdAdd size={22} />
          Create Office Location
        </button>
      </div>

      <div className="office_loc-office-search">
        <div className="office_loc-search-box">
          <MdSearch className="office_loc-search-icon" />
          <input
            type="text"
            placeholder="Search Office..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="office_loc-location-count">
          Total Locations : <strong>{filteredLocations.length}</strong>
        </div>
      </div>

      {loading && <div style={{ marginBottom: "12px", color: "#666" }}>Loading...</div>}

      <div className="office_loc-office-grid">
        {filteredLocations.map((location) => (
          <div className="office_loc-office-card" key={location.id}>
            <div className="office_loc-office-card-header">
              <div className="office_loc-office-icon">
                <MdLocationOn size={30} />
              </div>
              <div>
                <h3>{location.office}</h3>
                <p>{location.address}</p>
              </div>
            </div>

            <div className="office_loc-office-details">
              <div className="office_loc-detail-box">
                <span>Radius</span>
                <strong>{location.radius} m</strong>
              </div>
              <div className="office_loc-detail-box">
                <span>Employees</span>
                <strong>{location.employees}</strong>
              </div>
              <div className="office_loc-detail-box">
                <span>Status</span>
                <label
                  className={
                    location.status === "Active"
                      ? "office_loc-status office_loc-active"
                      : "office_loc-status office_loc-inactive"
                  }
                >
                  {location.status}
                </label>
              </div>
            </div>

            <div className="office_loc-office-actions">
              <button className="office_loc-emp-btn" onClick={() => handleOpenEmployeesModal(location)}>
                <MdPeople /> Employees
              </button>
              <button className="office_loc-edit-btn" onClick={() => handleEdit(location)}>
                <MdEdit /> Edit
              </button>
              <button className="office_loc-delete-btn" onClick={() => handleDelete(location.id)}>
                <MdDelete /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="office_loc-office-modal-overlay">
          <div className="office_loc-office-modal">
            <div className="office_loc-office-modal-header">
              <h2>
                {editingOfficeId ? "Edit Office Location" : "Create Office Location"}
              </h2>
              <button
                className="office_loc-close-btn"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

            <div className="office_loc-office-modal-body">
              {formError && (
                <div style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  fontSize: "14px",
                  border: "1px solid #fca5a5"
                }}>
                  {formError}
                </div>
              )}

              {/* Instructions for Latitude & Longitude */}
              <div style={{
                background: "#e0f2fe",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
                borderLeft: "4px solid #0ea5e9"
              }}>
                <strong>How to get Latitude &amp; Longitude:</strong><br />
                1. Go to <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" style={{ color: "#0369a1" }}>
                  Google Maps
                </a><br />
                2. Search or click on the exact location<br />
                3. Right-click on the map → Click <strong>"What's here?"</strong><br />
                4. Copy the coordinates shown at the bottom
              </div>

              <div className="office_loc-office-form-group">
                <label>Office Name</label>
                <input
                  type="text"
                  name="officeName"
                  placeholder="Enter office name"
                  value={formData.officeName}
                  onChange={handleChange}
                />
              </div>

              <div className="office_loc-office-form-group">
                <label>Office Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="office_loc-office-row">
                <div className="office_loc-office-form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="latitude"
                    placeholder="e.g. 28.6139"
                    value={formData.latitude}
                    onChange={handleChange}
                  />
                </div>
                <div className="office_loc-office-form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="longitude"
                    placeholder="e.g. 77.2090"
                    value={formData.longitude}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="office_loc-office-row">
                <div className="office_loc-office-form-group">
                  <label>Radius (Meters)</label>
                  <input
                    type="number"
                    name="radius"
                    value={formData.radius}
                    onChange={handleChange}
                  />
                </div>

                <div className="office_loc-office-form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="office_loc-office-modal-footer">
              <button
                className="office_loc-cancel-btn"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button className="office_loc-save-btn" onClick={handleSave}>
                {editingOfficeId ? "Update Location" : "Save Location"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE ASSIGNMENT MODAL */}
      {showEmployeesModal && (
        <div className="office_loc-office-modal-overlay">
          <div className="office_loc-office-modal" style={{ maxWidth: "850px", width: "95%" }}>
            <div className="office_loc-office-modal-header">
              <div>
                <h2>Assign Employees</h2>
                <p style={{ margin: "4px 0 0", color: "#666", fontSize: "14px" }}>
                  {selectedOffice?.office || "Office"}
                </p>
              </div>
              <button className="office_loc-close-btn" onClick={resetEmployeesModal}>
                ✕
              </button>
            </div>

            <div className="office_loc-office-modal-body">
              <div className="office_loc-office-form-group" style={{ marginBottom: "16px" }}>
                <label>Search Employee</label>
                <input
                  type="text"
                  placeholder="Search by employee ID, name or email"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                />
              </div>

              {employeeLoading ? (
                <div style={{ padding: "20px 0", color: "#666" }}>Loading employees...</div>
              ) : filteredEmployees.length === 0 ? (
                <div style={{ padding: "20px 0", color: "#666" }}>No employees found.</div>
              ) : (
                <div style={{ maxHeight: "420px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "10px" }}>
                  {filteredEmployees.map((employee) => {
                    const checked = selectedEmployeeIds.includes(String(employee.employee_id));
                    return (
                      <label
                        key={employee.employee_id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          padding: "14px 16px",
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleEmployeeCheckbox(employee.employee_id)}
                          style={{ marginTop: "4px" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                            {employee.name || employee.employee_id}
                          </div>
                          <div style={{ fontSize: "13px", color: "#6b7280", display: "flex", flexWrap: "wrap", gap: "14px" }}>
                            <span>ID: {employee.employee_id}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="office_loc-office-modal-footer">
              <div style={{ marginRight: "auto", color: "#555", fontSize: "14px" }}>
                Selected Employees: <strong>{selectedEmployeeIds.length}</strong>
              </div>
              <button className="office_loc-cancel-btn" onClick={resetEmployeesModal}>Cancel</button>
              <button className="office_loc-save-btn" onClick={handleSaveEmployees} disabled={employeeLoading}>
                Save Employees
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p style={{ 
          textAlign: "center", 
          fontSize: "16px", 
          padding: "10px 0",
          color: alertModal.type === "error" ? "#dc2626" : "#111827" 
        }}>
          {alertModal.message}
        </p>
      </Modal>
    </div>
  );
};

export default OfficeLocations;