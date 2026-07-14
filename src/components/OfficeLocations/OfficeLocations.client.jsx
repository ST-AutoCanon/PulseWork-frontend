"use client";

import React, { useState, useRef, useEffect } from "react";
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

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);

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
  };

  const updateCoordinates = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  // Load Leaflet only on client
  useEffect(() => {
    let L;
    let markerIcon2x, markerIcon, markerShadow;

    import("leaflet").then((leafletModule) => {
      L = leafletModule.default;
      import("leaflet/dist/images/marker-icon-2x.png").then((mod) => { markerIcon2x = mod.default; });
      import("leaflet/dist/images/marker-icon.png").then((mod) => { markerIcon = mod.default; });
      import("leaflet/dist/images/marker-shadow.png").then((mod) => { markerShadow = mod.default; });

      // Fix default icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x,
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
      });
    });
  }, []);

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
      alert(error.message || "Failed to fetch office locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchOfficeLocations();
    }
  }, [orgId]);

  useEffect(() => {
    if (!showModal) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;

      const defaultLat =
        formData.latitude !== "" ? parseFloat(formData.latitude) : 12.9716;
      const defaultLng =
        formData.longitude !== "" ? parseFloat(formData.longitude) : 77.5946;

      mapInstanceRef.current = L.map(mapRef.current).setView(
        [defaultLat, defaultLng],
        13
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current);

      markerRef.current = L.marker([defaultLat, defaultLng], {
        draggable: true,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup("Drag me or click anywhere on map");

      mapInstanceRef.current.on("click", (e) => {
        const { lat, lng } = e.latlng;
        updateCoordinates(lat, lng);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
      });

      markerRef.current.on("dragend", (e) => {
        const { lat, lng } = e.target.getLatLng();
        updateCoordinates(lat, lng);
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showModal, formData.latitude, formData.longitude]);

  const handleSave = async () => { /* unchanged */
    if (
      !formData.officeName?.trim() ||
      !formData.address?.trim() ||
      formData.latitude === "" ||
      formData.longitude === ""
    ) {
      alert("Please fill Office Name, Address and select location on map.");
      return;
    }

    if (!orgId) {
      alert("Organization ID not found");
      return;
    }

    if (!API_BASE) {
      alert("NEXT_PUBLIC_BACKEND_URL is missing in frontend .env");
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
            (isEdit
              ? "Failed to update office location"
              : "Failed to create office location")
        );
      }

      const savedOffice = {
        id: result.data?.id,
        office: result.data?.office_name || result.data?.office || payload.officeName,
        address: result.data?.address || payload.address,
        radius: Number(result.data?.radius ?? payload.radius),
        employees: Number(result.data?.employees) || 0,
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
    } catch (error) {
      console.error("Save office location error:", error);
      alert(
        error.message ||
          (editingOfficeId
            ? "Failed to update office location"
            : "Failed to create office location")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location) => {
    setEditingOfficeId(location.id);
    setFormData({
      officeName: location.office || "",
      address: location.address || "",
      latitude: location.latitude !== "" && location.latitude !== null ? String(location.latitude) : "",
      longitude: location.longitude !== "" && location.longitude !== null ? String(location.longitude) : "",
      radius: location.radius || 100,
      status: location.status || "Active",
    });
    setShowModal(true);
  };

  const handleDelete = async (officeId) => {
    if (!orgId) {
      alert("Organization ID not found");
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
    } catch (error) {
      console.error("Delete office location error:", error);
      alert(error.message || "Failed to delete office location");
    } finally {
      setLoading(false);
    }
  };

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

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch employees");
    }

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

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch assigned employees");
    }

    return result.data || [];
  };

  const handleOpenEmployeesModal = async (office) => {
    if (!orgId) {
      alert("Organization ID not found");
      return;
    }

    if (!API_BASE) {
      alert("NEXT_PUBLIC_BACKEND_URL is missing in frontend .env");
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
      alert(error.message || "Failed to load employees");
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
      alert("Office not selected");
      return;
    }

    if (!orgId) {
      alert("Organization ID not found");
      return;
    }

    if (!API_BASE) {
      alert("NEXT_PUBLIC_BACKEND_URL is missing in frontend .env");
      return;
    }

    try {
      setEmployeeLoading(true);

      const endpoint = `${API_BASE}/api/office-location-employees/${selectedOffice.id}/assign-employees`;

      let response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          orgId,
          employeeIds: selectedEmployeeIds,
          forceAssign: false,
        }),
      });

      let result;
      const rawText = await response.text();

      try {
        result = JSON.parse(rawText);
      } catch {
        console.error("assign-employees non-JSON response:", rawText);
        throw new Error("Expected JSON but got HTML/text response from assign-employees API");
      }

      if (response.status === 409 && result.requiresConfirmation) {
        const conflictMessage = (result.conflictEmployees || [])
          .map((emp) => {
            const officeNames = (emp.existing_offices || [])
              .map((office) => office.office_name)
              .join(", ");
            return `${emp.name || emp.employee_id} (${emp.employee_id}) is already assigned to: ${officeNames}`;
          })
          .join("\n\n");

        const alreadyMappedMessage = (result.alreadyMappedEmployees || []).length > 0
          ? `\n\nAlready assigned in this office:\n${result.alreadyMappedEmployees
              .map((emp) => `${emp.name || emp.employee_id} (${emp.employee_id})`)
              .join("\n")}`
          : "";

        let confirmAssign = false;
        if (typeof window !== "undefined") {
          confirmAssign = window.confirm(
            `${conflictMessage}${alreadyMappedMessage}\n\nDo you want to allow these employee(s) in "${selectedOffice.office}" also?`
          );
        }

        if (!confirmAssign) {
          setEmployeeLoading(false);
          return;
        }

        response = await fetch(endpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(API_KEY ? { "x-api-key": API_KEY } : {}),
          },
          credentials: "include",
          body: JSON.stringify({
            orgId,
            employeeIds: selectedEmployeeIds,
            forceAssign: true,
          }),
        });

        const secondRawText = await response.text();

        try {
          result = JSON.parse(secondRawText);
        } catch {
          console.error("force assign non-JSON response:", secondRawText);
          throw new Error("Expected JSON but got HTML/text response from force assign API");
        }
      }

      if (!response.ok) {
        throw new Error(result.message || "Failed to assign employees");
      }

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === selectedOffice.id
            ? { ...loc, employees: result.count ?? selectedEmployeeIds.length }
            : loc
        )
      );

      alert(result.message || "Employees assigned successfully");
      resetEmployeesModal();
    } catch (error) {
      console.error("Save employees error:", error);
      alert(error.message || "Failed to assign employees");
    } finally {
      setEmployeeLoading(false);
    }
  };

  return (
    <div className="office-page">
      {/* Your existing return JSX remains exactly the same */}
      <div className="office-header">
        <div>
          <h2>Office Locations</h2>
          <p>Manage office locations used for Login and Punch In / Punch Out.</p>
        </div>

        <button
          className="create-btn"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <MdAdd size={22} />
          Create Office Location
        </button>
      </div>

      <div className="office-search">
        <div className="search-box">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search Office..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="location-count">
          Total Locations : <strong>{filteredLocations.length}</strong>
        </div>
      </div>

      {loading && <div style={{ marginBottom: "12px", color: "#666" }}>Loading...</div>}

      <div className="office-grid">
        {filteredLocations.map((location) => (
          <div className="office-card" key={location.id}>
            <div className="office-card-header">
              <div className="office-icon">
                <MdLocationOn size={30} />
              </div>
              <div>
                <h3>{location.office}</h3>
                <p>{location.address}</p>
              </div>
            </div>

            <div className="office-details">
              <div className="detail-box">
                <span>Radius</span>
                <strong>{location.radius} m</strong>
              </div>
              <div className="detail-box">
                <span>Employees</span>
                <strong>{location.employees}</strong>
              </div>
              <div className="detail-box">
                <span>Status</span>
                <label className={location.status === "Active" ? "status active" : "status inactive"}>
                  {location.status}
                </label>
              </div>
            </div>

            <div className="office-actions">
              <button className="emp-btn" onClick={() => handleOpenEmployeesModal(location)}>
                <MdPeople /> Employees
              </button>
              <button className="edit-btn" onClick={() => handleEdit(location)}>
                <MdEdit /> Edit
              </button>
              <button className="delete-btn" onClick={() => handleDelete(location.id)}>
                <MdDelete /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals remain unchanged */}
      {showModal && (
        <div className="office-modal-overlay">
          <div className="office-modal">
            <div className="office-modal-header">
              <h2>{editingOfficeId ? "Edit Office Location" : "Create Office Location"}</h2>
              <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
            </div>
            <div className="office-modal-body">
              <div className="office-form-group">
                <label>Office Name</label>
                <input type="text" name="officeName" placeholder="Enter office name" value={formData.officeName} onChange={handleChange} />
              </div>
              <div className="office-form-group">
                <label>Office Address</label>
                <input type="text" name="address" placeholder="Enter full address" value={formData.address} onChange={handleChange} />
              </div>

              <div ref={mapRef} style={{ width: "100%", height: "320px", margin: "15px 0", borderRadius: "8px", border: "1px solid #ddd" }} />

              <p style={{ marginTop: "4px", fontSize: "13px", color: "#666" }}>
                Click on the map or drag the marker to set exact location.
              </p>

              <div className="office-row">
                <div className="office-form-group">
                  <label>Latitude</label>
                  <input type="text" value={formData.latitude} readOnly />
                </div>
                <div className="office-form-group">
                  <label>Longitude</label>
                  <input type="text" value={formData.longitude} readOnly />
                </div>
              </div>

              <div className="office-row">
                <div className="office-form-group">
                  <label>Radius (Meters)</label>
                  <input type="number" name="radius" value={formData.radius} onChange={handleChange} />
                </div>
                <div className="office-form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="office-modal-footer">
              <button className="cancel-btn" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
              <button className="save-btn" onClick={handleSave}>
                {editingOfficeId ? "Update Location" : "Save Location"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmployeesModal && (
        <div className="office-modal-overlay">
          <div className="office-modal" style={{ maxWidth: "850px", width: "95%" }}>
            {/* Employee modal content - unchanged */}
            <div className="office-modal-header">
              <div>
                <h2>Assign Employees</h2>
                <p style={{ margin: "4px 0 0", color: "#666", fontSize: "14px" }}>{selectedOffice?.office || "Office"}</p>
              </div>
              <button className="close-btn" onClick={resetEmployeesModal}>✕</button>
            </div>
            {/* ... rest of employee modal (same as before) ... */}
            <div className="office-modal-body">
              <div className="office-form-group" style={{ marginBottom: "16px" }}>
                <label>Search Employee</label>
                <input type="text" placeholder="Search by employee ID, name or email" value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} />
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
                      <label key={employee.employee_id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>
                        <input type="checkbox" checked={checked} onChange={() => handleEmployeeCheckbox(employee.employee_id)} style={{ marginTop: "4px" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                            {employee.name || employee.employee_id}
                          </div>
                          <div style={{ fontSize: "13px", color: "#6b7280", display: "flex", flexWrap: "wrap", gap: "14px" }}>
                            <span>ID: {employee.employee_id}</span>
                            {employee.email && <span>{employee.email}</span>}
                            {employee.phone_number && <span>{employee.phone_number}</span>}
                            <span>Status: {employee.status}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="office-modal-footer">
              <div style={{ marginRight: "auto", color: "#555", fontSize: "14px" }}>
                Selected Employees: <strong>{selectedEmployeeIds.length}</strong>
              </div>
              <button className="cancel-btn" onClick={resetEmployeesModal}>Cancel</button>
              <button className="save-btn" onClick={handleSaveEmployees} disabled={employeeLoading}>
                Save Employees
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeLocations;