
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthProvider.client";
import "./createPolicies.css";

// ====================== CREATE POLICY FORM ======================
// ====================== CREATE POLICY FORM ======================
const CreatePolicyForm = ({
  formData,
  setFormData,
  selectedEmployees,
  setSelectedEmployees,
  selectedDepartments,
  setSelectedDepartments,
  employeeList,
  departmentList,
  searchTerm,
  setSearchTerm,
  departmentSearchTerm,
  setDepartmentSearchTerm,
  handleSubmit,
  loading,
  onCancel,
  user,
  orgId,
  newFile,
  setNewFile,
  newFilesToAdd,
  handleAddNewFile,
  handleRemoveNewFile,selectionType,        // ← add
  setSelectionType,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [employeesByDepartment, setEmployeesByDepartment] = useState({});

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const meId = user?.employeeId ?? user?.id ?? user?.employee_id ?? null;

  const headers = {
    "x-api-key": API_KEY,
    "x-employee-id": meId,
    ...(orgId ? { "x-org-id": orgId } : {}),
  };

  // Filtered lists
  const filteredEmployees = employeeList.filter(emp =>
    emp?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDepartments = departmentList.filter(dept =>
    dept?.name?.toLowerCase().includes(departmentSearchTerm.toLowerCase())
  );

  // ==================== DEPARTMENT DOUBLE CLICK ====================
  const handleDepartmentDoubleClick = async () => {
    if (!selectedDepartment || selectionType !== "department") {
      alert("Please select a department");
      return;
    }

    const department = departmentList.find(d => String(d.id) === String(selectedDepartment));
    if (!department) return alert("Invalid department");

    if (selectedDepartments.some(d => d.id === department.id)) {
      return alert("Department already selected");
    }

    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/compensations/employees/by-department/${selectedDepartment}`,
        { withCredentials: true, headers }
      );

      if (response.data.success) {
        const employees = Array.isArray(response.data.data) ? response.data.data : [];
        if (employees.length === 0) {
          alert("No employees found in this department.");
          return;
        }

        setSelectedDepartments(prev => [department, ...prev]);
        setEmployeesByDepartment(prev => ({
          ...prev,
          [department.id]: employees,
        }));
        setSelectedDepartment("");
      }
    } catch (error) {
      console.error("Department fetch error:", error);
      alert("Failed to load employees for this department.");
    }
  };
const appendFilesToFormData = (filesArray, formData) => {
  filesArray.forEach((nf, index) => {
    // ALWAYS use the same field name so multer can accept everything
    formData.append("file", nf.file);                    // ← change to whatever your backend expects
    // or formData.append("files", nf.file); if you use array

    formData.append(`file_type_${index}`, nf.file_type);
    formData.append(`acknowledgement_${index}`, nf.acknowledgement ? "true" : "false");
    formData.append(`acknowledgement_message_${index}`, nf.acknowledgementMessage || "");
  });
};
  const handleEmployeeDoubleClick = () => {
    if (!selectedEmployee || selectionType !== "employee") return;

    const employee = employeeList.find(emp => String(emp.employee_id) === String(selectedEmployee));
    if (employee && !selectedEmployees.some(e => e.employee_id === employee.employee_id)) {
      setSelectedEmployees(prev => [employee, ...prev]);
      setSelectedEmployee("");
    }
  };

  const removeEmployee = (employeeId) => {
    setSelectedEmployees(prev => prev.filter(emp => emp.employee_id !== employeeId));
  };

  const removeDepartment = (departmentId) => {
    setSelectedDepartments(prev => prev.filter(d => d.id !== departmentId));
    setEmployeesByDepartment(prev => {
      const updated = { ...prev };
      delete updated[departmentId];
      return updated;
    });
  };

  const removeEmployeeFromDepartment = (departmentId, employeeId) => {
    setEmployeesByDepartment(prev => {
      const updated = { ...prev };
      if (updated[departmentId]) {
        updated[departmentId] = updated[departmentId].filter(emp => emp.employee_id !== employeeId);
        
        // If no employees left, remove the department
        if (updated[departmentId].length === 0) {
          removeDepartment(departmentId);
        }
      }
      return updated;
    });
  };

  return (
  <div className="admin-policy-card">
    {/* ===== DARK BLUE HEADER ===== */}
    <div className="admin-policy-header">
      <h3 className="admin-policy-form-title">Create New Policy</h3>
      <button
        type="button"
        className="admin-policy-close-btn"
        onClick={onCancel}
        aria-label="Close"
      >
        ✕
      </button>
    </div>

    {/* ===== BODY ===== */}
    <div className="admin-policy-body">
      <form onSubmit={handleSubmit}>
        {/* Policy Name */}
        <div className="admin-policy-form-group">
          <label>Policy Name <span className="required">*</span></label>
          <input
            type="text"
            value={formData.policyName}
            onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
            required
            placeholder="Enter policy name"
          />
        </div>
        {/* Policy Description */}
<div className="admin-policy-form-group">
  <label>Description</label>
  <textarea
    value={formData.description || ""}
    onChange={(e) =>
      setFormData({ ...formData, description: e.target.value })
    }
    placeholder="Enter a short description about this policy..."
    rows={4}
    style={{ width: "100%", resize: "vertical" }}
  />
</div>

        {/* Permissions */}
        <div className="admin-policy-permissions-section">
          <h4 className="admin-policy-section-subtitle">Permissions</h4>
          <div className="admin-policy-checkbox-group">
            <label className="admin-policy-checkbox-label">
              <input
                type="checkbox"
                checked={formData.allowView}
                onChange={(e) => setFormData({ ...formData, allowView: e.target.checked })}
              />
              Allow View
            </label>
            <label className="admin-policy-checkbox-label">
              <input
                type="checkbox"
                checked={formData.allowDownload}
                onChange={(e) => setFormData({ ...formData, allowDownload: e.target.checked })}
              />
              Allow Download
            </label>
          </div>
        </div>

        {/* Selection Type */}
        {/* Selection Type */}
<div className="admin-policy-selection-type">
  <h4 className="admin-policy-section-subtitle">Assign To</h4>
  <div className="admin-policy-radio-group">
    <label className="admin-policy-radio-label">
      <input
        type="radio"
        checked={selectionType === "employee"}
        onChange={() => {
          setSelectionType("employee");
          setSelectedDepartments([]);
          setEmployeesByDepartment({});
        }}
      />
      Individual Employees
    </label>

    <label className="admin-policy-radio-label">
      <input
        type="radio"
        checked={selectionType === "department"}
        onChange={() => {
          setSelectionType("department");
          setSelectedEmployees([]);
        }}
      />
      Departments (with employees)
    </label>

    <label className="admin-policy-radio-label">
      <input
        type="radio"
        checked={selectionType === "all"}
        onChange={() => {
          setSelectionType("all");
          setSelectedEmployees([]);
          setSelectedDepartments([]);
          setEmployeesByDepartment({});
        }}
      />
      Assign to All
    </label>
  </div>
</div>

        {/* Employees Section */}
        {selectionType === "employee" && (
          <div className="admin-policy-section">
            <h4 className="admin-policy-section-subtitle">Select Employees</h4>
            <input
              type="text"
              className="admin-policy-search-input"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="admin-policy-selection-dropdown"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              onDoubleClick={handleEmployeeDoubleClick}
              size={6}
            >
              <option value="" disabled>Select an employee</option>
              {filteredEmployees.map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name}
                </option>
              ))}
            </select>

            <h4 className="admin-policy-selected-title">
              Selected Employees ({selectedEmployees.length})
            </h4>
            {selectedEmployees.length > 0 ? (
              <div className="admin-policy-selected-list">
                {selectedEmployees.map(emp => (
                  <div key={emp.employee_id} className="admin-policy-selected-item">
                    <span>{emp.full_name}</span>
                    <span
                      onClick={() => removeEmployee(emp.employee_id)}
                      className="admin-policy-remove-btn"
                    >
                      ✕
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-policy-empty-state">No employees selected yet</p>
            )}
          </div>
        )}

        {/* Departments Section */}
        {selectionType === "department" && (
          <div className="admin-policy-section">
            <h4 className="admin-policy-section-subtitle">Select Departments</h4>
            <input
              type="text"
              className="admin-policy-search-input"
              placeholder="Search department..."
              value={departmentSearchTerm}
              onChange={(e) => setDepartmentSearchTerm(e.target.value)}
            />
            <select
              className="admin-policy-selection-dropdown"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              onDoubleClick={handleDepartmentDoubleClick}
              size={6}
            >
              <option value="" disabled>Select a department</option>
              {filteredDepartments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            <h4 className="admin-policy-selected-title">
              Selected Departments ({selectedDepartments.length})
            </h4>
            {selectedDepartments.length > 0 ? (
              <div className="admin-policy-selected-departments-list">
                {selectedDepartments.map(dept => (
                  <div key={dept.id} className="admin-policy-department-card">
                    <div className="admin-policy-department-header">
                      <strong>{dept.name}</strong>
                      <span
                        onClick={() => removeDepartment(dept.id)}
                        className="admin-policy-remove-btn"
                      >
                        ✕
                      </span>
                    </div>

                    {employeesByDepartment[dept.id]?.length > 0 && (
                      <div className="admin-policy-employees-under-dept">
                        {employeesByDepartment[dept.id].map(emp => (
                          <div key={emp.employee_id} className="admin-policy-employee-under-dept">
                            <span>{emp.full_name}</span>
                            <span
                              onClick={() => removeEmployeeFromDepartment(dept.id, emp.employee_id)}
                              className="admin-policy-remove-btn"
                            >
                              ✕
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-policy-empty-state">No departments selected yet</p>
            )}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="admin-policy-button-group">
          <button type="button" className="admin-policy-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="admin-policy-submit-btn" disabled={loading}>
            {loading ? "Creating Policy..." : "Create Policy"}
          </button>
        </div>
      </form>
    </div>
  </div>
);
};

// ====================== VIEW POLICY MODAL ======================
// ====================== PROFESSIONAL VIEW / EDIT MODAL ======================
// ====================== VIEW POLICY MODAL ======================
// ====================== VIEW POLICY MODAL ======================
const ViewPolicyModal = ({
  viewPolicy,
  setViewPolicy,
  newFile,
  setNewFile,
  newFilesToAdd,
  handleAddNewFile,
  handleRemoveNewFile,
  handleSaveEdits,
  handleDeleteFile,
  handleEditFile,
  editingFile,
  setEditingFile,
  handleSaveFileEdit,
  loading,

  // ==================== NEW PROPS FOR REPLACE ====================
  replacingFile,
  setReplacingFile,
  replaceNewFile,
  setReplaceNewFile,
  handleReplaceFile,
  handleSaveReplace,
}) => {
 return (
  <div className="admin-policy-modal-overlay" onClick={() => setViewPolicy(null)}>
    <div className="admin-policy-view-modal" onClick={(e) => e.stopPropagation()}>

      {/* ===== DARK BLUE HEADER ===== */}
      <div className="admin-policy-header">
        <h2 className="admin-policy-form-title">
          Manage Policy: {viewPolicy.policy_name}
        </h2>
        <button
          type="button"
          className="admin-policy-close-btn"
          onClick={() => setViewPolicy(null)}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
<div className="admin-policy-form-group">
  <label>Description</label>
  <textarea
    value={viewPolicy.description || ""}
    onChange={(e) =>
      setViewPolicy((p) => ({ ...p, description: e.target.value }))
    }
    placeholder="Enter policy description..."
    rows={4}
    style={{ width: "100%", resize: "vertical" }}
  />
</div>
      {/* ===== BODY ===== */}
      <div className="admin-policy-view-body">

        {/* Policy Details */}
        <div className="admin-policy-section">
          <h3 className="admin-policy-section-title">Policy Details</h3>
          <div className="admin-policy-form-group">
            <label>Policy Name</label>
            <input
              type="text"
              value={viewPolicy.policy_name || ""}
              onChange={(e) =>
                setViewPolicy((p) => ({ ...p, policy_name: e.target.value }))
              }
              placeholder="Enter policy name"
            />
          </div>
        </div>

        {/* Existing Files */}
        <div className="admin-policy-section">
          <h3 className="admin-policy-section-title">
            Existing Files ({viewPolicy.files?.length || 0})
          </h3>

          <div className="admin-policy-files-grid">
            {viewPolicy.files?.length > 0 ? (
              viewPolicy.files.map((file) => (
                <div key={file.id} className="admin-policy-file-card">
                  <div className="admin-policy-file-left">
                    <span className="admin-policy-file-icon">📄</span>
                    <div className="admin-policy-file-info">
                      <div className="admin-policy-file-name">
                        {file.original_file_name || file.file_name}
                      </div>
                      <div className="admin-policy-file-type">{file.file_type}</div>

                      {file.acknowledgement_required === 1 && (
                        <div className="admin-policy-ack-badge">
                          ✓ Acknowledgement Required
                        </div>
                      )}

                      {file.acknowledgement_message && (
                        <div className="admin-policy-ack-message">
                          “
                          {file.acknowledgement_message.substring(0, 60)}
                          {file.acknowledgement_message.length > 60 ? "..." : ""}
                          ”
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-policy-file-actions">
                    <button
                      className="admin-policy-btn admin-policy-btn-replace"
                      onClick={() => handleReplaceFile(file)}
                    >
                      Replace
                    </button>
                    <button
                      className="admin-policy-btn admin-policy-btn-edit"
                      onClick={() => handleEditFile(file)}
                    >
                      Edit
                    </button>
                    <button
                      className="admin-policy-btn admin-policy-btn-delete"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="admin-policy-empty-state">No files uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Add New Files */}
        <div className="admin-policy-upload-card">
          <h3 className="admin-policy-section-title">Add New Files</h3>

          <div className="admin-policy-upload-row">
            <select
              className="admin-policy-upload-select"
              value={newFile.file_type}
              onChange={(e) =>
                setNewFile((prev) => ({
                  ...prev,
                  file_type: e.target.value,
                  file: null,
                }))
              }
            >
              <option value="document">Document (PDF / Word)</option>
              <option value="ppt">PPT</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
            </select>

            <input
              className="admin-policy-upload-input"
              type="file"
              key={newFile.file_type}
              onChange={(e) =>
                setNewFile((prev) => ({
                  ...prev,
                  file: e.target.files?.[0] || null,
                }))
              }
              accept={
                newFile.file_type === "document"
                  ? ".pdf,.doc,.docx"
                  : newFile.file_type === "ppt"
                  ? ".ppt,.pptx"
                  : newFile.file_type === "video"
                  ? ".mp4,.avi,.mov,.webm"
                  : ".jpg,.jpeg,.png,.gif,.webp"
              }
            />

            <label className="admin-policy-upload-checkbox">
              <input
                type="checkbox"
                checked={newFile.acknowledgement || false}
                onChange={(e) =>
                  setNewFile((prev) => ({
                    ...prev,
                    acknowledgement: e.target.checked,
                  }))
                }
              />
              Require Acknowledgement
            </label>
          </div>
{(newFile.file_type === "document" || newFile.file_type === "ppt") && (
  <div className="admin-policy-convert-notice">
    <span className="admin-policy-convert-icon">ℹ️</span>
    <span>
      Word / PowerPoint files will be <strong>automatically converted to PDF</strong> when you save.
    </span>
  </div>
)}
          {newFile.acknowledgement && (
            <textarea
              className="admin-policy-upload-message"
              placeholder="Enter acknowledgement message for employees..."
              value={newFile.acknowledgementMessage || ""}
              onChange={(e) =>
                setNewFile((prev) => ({
                  ...prev,
                  acknowledgementMessage: e.target.value,
                }))
              }
            />
          )}

          <button
            type="button"
            onClick={handleAddNewFile}
            className="admin-policy-upload-add-btn"
          >
            + Add to Upload List
          </button>

          {/* Files Ready to Upload */}
          {newFilesToAdd.length > 0 && (
            <div className="admin-policy-new-files">
              <h4>Files Ready to Upload ({newFilesToAdd.length})</h4>
              {newFilesToAdd.map((fileItem, index) => (
                <div key={index} className="admin-policy-new-file-card">
                  <div className="admin-policy-new-file-header">
                    <div>
                      <div className="admin-policy-new-file-name">
                        {fileItem.file.name}
                      </div>
                      <div className="admin-policy-new-file-type">
                        ({fileItem.file_type})
                      </div>
                    </div>
                    {fileItem.acknowledgement && (
                      <span className="admin-policy-ack-badge">✓ Ack Required</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveNewFile(index)}
                    className="admin-policy-remove-file-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="admin-policy-footer">
        <button
          className="admin-policy-cancel-btn"
          onClick={() => setViewPolicy(null)}
        >
          Cancel
        </button>
        <button
          className="admin-policy-submit-btn"
          onClick={handleSaveEdits}
          disabled={loading}
        >
          {loading ? "Uploading..." : `Save & Upload (${newFilesToAdd.length})`}
        </button>
      </div>

      {/* ==================== FILE EDIT MODAL ==================== */}
      {editingFile && (
        <div className="admin-policy-modal-overlay" onClick={() => setEditingFile(null)}>
          <div className="admin-policy-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-policy-header">
              <h3 className="admin-policy-form-title">
                Edit File: {editingFile.original_file_name || editingFile.file_name}
              </h3>
              <button
                type="button"
                className="admin-policy-close-btn"
                onClick={() => setEditingFile(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-policy-edit-body">
              <div className="admin-policy-ack-edit-section">
                <label className="admin-policy-checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingFile.acknowledgement_required === 1}
                    onChange={(e) =>
                      setEditingFile((prev) => ({
                        ...prev,
                        acknowledgement_required: e.target.checked ? 1 : 0,
                      }))
                    }
                  />
                  Require Acknowledgement
                </label>

                {editingFile.acknowledgement_required === 1 && (
                  <div className="admin-policy-form-group" style={{ marginTop: 16 }}>
                    <label>
                      Acknowledgement Message <span className="required">*</span>
                    </label>
                    <textarea
                      placeholder="Employees must acknowledge this message before viewing..."
                      value={editingFile.acknowledgement_message || ""}
                      onChange={(e) =>
                        setEditingFile((prev) => ({
                          ...prev,
                          acknowledgement_message: e.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="admin-policy-footer">
              <button
                className="admin-policy-cancel-btn"
                onClick={() => setEditingFile(null)}
              >
                Cancel
              </button>
              <button
                className="admin-policy-submit-btn"
                onClick={handleSaveFileEdit}
                disabled={loading}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== REPLACE FILE MODAL ==================== */}
      {replacingFile && (
        <div
          className="admin-policy-modal-overlay"
          style={{ zIndex: 2100 }}
          onClick={() => setReplacingFile(null)}
        >
          <div className="admin-policy-replace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-policy-header">
              <div>
                <h3 className="admin-policy-form-title">Replace File</h3>
                <p className="admin-policy-replace-subtitle">
                  {replacingFile.original_file_name || replacingFile.file_name}
                </p>
              </div>
              <button
                type="button"
                className="admin-policy-close-btn"
                onClick={() => setReplacingFile(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-policy-replace-body">
              <div className="admin-policy-form-group">
                <label>File Type</label>
                <select
                  value={replaceNewFile?.file_type || "document"}
                  onChange={(e) =>
                    setReplaceNewFile((prev) => ({
                      ...prev,
                      file_type: e.target.value,
                    }))
                  }
                >
                  <option value="document">Document</option>
                  <option value="ppt">PPT</option>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                </select>
              </div>

              <div className="admin-policy-form-group">
                <label>New File</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setReplaceNewFile((prev) => ({
                      ...prev,
                      file: e.target.files?.[0],
                      file_type: prev?.file_type || "document",
                    }))
                  }
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.jpg,.jpeg,.png"
                />
              </div>

              <label className="admin-policy-upload-checkbox">
                <input
                  type="checkbox"
                  checked={replaceNewFile?.acknowledgement || false}
                  onChange={(e) =>
                    setReplaceNewFile((prev) => ({
                      ...prev,
                      acknowledgement: e.target.checked,
                    }))
                  }
                />
                Require Acknowledgement
              </label>

              {replaceNewFile?.acknowledgement && (
                <textarea
                  className="admin-policy-upload-message"
                  placeholder="Enter acknowledgement message..."
                  value={replaceNewFile.acknowledgementMessage || ""}
                  onChange={(e) =>
                    setReplaceNewFile((prev) => ({
                      ...prev,
                      acknowledgementMessage: e.target.value,
                    }))
                  }
                  rows={3}
                />
              )}
            </div>

            <div className="admin-policy-footer">
              <button
                className="admin-policy-cancel-btn"
                onClick={() => setReplacingFile(null)}
              >
                Cancel
              </button>
              <button
                className="admin-policy-submit-btn"
                onClick={handleSaveReplace}
                disabled={!replaceNewFile?.file || loading}
              >
                {loading ? "Replacing..." : "Replace File"}
              </button>
            </div>
          </div>
          {(replaceNewFile?.file_type === "document" || replaceNewFile?.file_type === "ppt") && (
  <div className="admin-policy-convert-notice">
    <span className="admin-policy-convert-icon">ℹ️</span>
    <span>
      Word / PowerPoint files will be <strong>automatically converted to PDF</strong> when you replace.
    </span>
  </div>
)}
        </div>
      )}
    </div>
  </div>
);
};
// ====================== MAIN COMPONENT ======================
const CreatePolicies = () => {
  const { user, hydrated } = useAuth();
  const orgId = user?.orgId ?? user?.org_id ?? user?.raw?.org_id ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  // States
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [viewPolicy, setViewPolicy] = useState(null);

  const [newFile, setNewFile] = useState({
    file: null,
    file_type: "document",
    acknowledgement: false,
    acknowledgementMessage: "",
  });

  const [newFilesToAdd, setNewFilesToAdd] = useState([]);

  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [departmentList, setDepartmentList] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    policyName: "",
    description: "",
    description: "",
    allowView: true,
    allowDownload: false,
  });
const [selectionType, setSelectionType] = useState("employee");
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const showAlert = (message, title = "Success") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  // Auth Headers
  useEffect(() => {
    const baseHeaders = { "x-api-key": API_KEY };
    const actorId = user?.employeeId ?? user?.id ?? null;
    const resolvedOrg = orgId;

    if (actorId) baseHeaders["x-employee-id"] = String(actorId);
    if (resolvedOrg && hydrated) baseHeaders["x-org-id"] = String(resolvedOrg);

    axios.defaults.headers.common = { ...axios.defaults.headers.common, ...baseHeaders };
  }, [user, hydrated, API_KEY, orgId]);

  // Fetch Data
  useEffect(() => {
    if (hydrated && orgId) {
      fetchPolicies();
      fetchEmployees();
      fetchDepartments();
    }
  }, [hydrated, orgId]);
// ==================== FILE EDIT STATES & HANDLERS ====================
const [editingFile, setEditingFile] = useState(null);

const handleEditFile = (file) => {
  setEditingFile({
    ...file,
    acknowledgement_required: file.acknowledgement_required || 0,
    acknowledgement_message: file.acknowledgement_message || ""
  });
};
// ==================== REPLACE FILE STATES & HANDLERS ====================
const [replacingFile, setReplacingFile] = useState(null);
const [replaceNewFile, setReplaceNewFile] = useState(null);

const handleReplaceFile = (file) => {
  setReplacingFile(file);
  setReplaceNewFile({
    file_type: file.file_type || "document",
    file: null,
    acknowledgement: file.acknowledgement_required === 1,
    acknowledgementMessage: file.acknowledgement_message || ""
  });
};

const handleSaveReplace = async () => {
  if (!replacingFile || !replaceNewFile?.file) {
    return showAlert("Please select a new file to replace", "Error");
  }

  setLoading(true);
  try {
    const formData = new FormData();

    const fieldName = getFieldName(replaceNewFile.file_type);
    formData.append(fieldName, replaceNewFile.file);
    formData.append("acknowledgement", replaceNewFile.acknowledgement);
    formData.append("acknowledgementMessage", replaceNewFile.acknowledgementMessage || "");

    await axios.put(
      `${BACKEND}/api/policies/file/replace/${viewPolicy.id}/${replacingFile.id}`,
      formData,
      {
        withCredentials: true,
        headers: { "x-org-id": orgId },
      }
    );

    const latestFiles = await fetchPolicyFiles(viewPolicy.id);
    setViewPolicy((prev) => ({ ...prev, files: latestFiles }));

    showAlert("File replaced successfully!");

    setReplacingFile(null);
    setReplaceNewFile(null);
  } catch (err) {
    console.error(err);
    showAlert(err.response?.data?.message || "Failed to replace file", "Error");
  } finally {
    setLoading(false);
  }
};

const getFieldName = (type) => {
  if (type === "image") return "image";
  if (type === "video") return "video";
  if (type === "ppt") return "ppt";
  return "document"; // default for pdf, doc, docx etc.
};

const handleSaveFileEdit = async () => {
  if (!editingFile || !viewPolicy) return;

  setLoading(true);
  try {
    await axios.put(
      `${BACKEND}/api/policies/file/${editingFile.id}`,
      {
        acknowledgement_required: editingFile.acknowledgement_required,
        acknowledgement_message: editingFile.acknowledgement_message,
      },
      {
        withCredentials: true,
        headers: { "x-org-id": orgId }
      }
    );

    // Refresh files
    const latestFiles = await fetchPolicyFiles(viewPolicy.id);
    setViewPolicy(prev => ({ ...prev, files: latestFiles }));

    setEditingFile(null);
    showAlert("File updated successfully!");
  } catch (err) {
    console.error(err);
    showAlert(err.response?.data?.message || "Failed to update file", "Error");
  } finally {
    setLoading(false);
  }
};
  const fetchPolicies = async () => {
    try {
      const resp = await axios.get(`${BACKEND}/api/policies/list`, {
        withCredentials: true,
        headers: { "x-org-id": orgId },
      });
      setPolicies(Array.isArray(resp.data?.data) ? resp.data.data : []);
    } catch (error) {
      console.error("Error fetching policies:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${BACKEND}/api/compensations/employees/names`, {
        withCredentials: true,
        headers: {
          "x-api-key": API_KEY,
          "x-employee-id": user?.employeeId ?? user?.id ?? user?.employee_id,
          "x-org-id": orgId,
        },
      });
      if (response.data.success) {
        const emps = response.data.data || [];
        setEmployeeList(emps);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${BACKEND}/api/compensations/departments/names`, {
        withCredentials: true,
        headers: {
          "x-api-key": API_KEY,
          "x-employee-id": user?.employeeId ?? user?.id ?? user?.employee_id,
          "x-org-id": orgId,
        },
      });
      if (response.data.success) {
        const depts = response.data.data || [];
        setDepartmentList(depts);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchPolicyFiles = async (policyId) => {
    try {
      const resp = await axios.get(`${BACKEND}/api/policies/files/${policyId}`, {
        withCredentials: true,
        headers: { "x-org-id": orgId },
      });
      const files = resp.data?.data || [];
      return files;
    } catch (err) {
      console.error("Error fetching files", err);
      return [];
    }
  };

  const handleUploadAndView = async (policy) => {
    try {
      const files = await fetchPolicyFiles(policy.id);
      setViewPolicy({ ...policy, files });
      setNewFilesToAdd([]);
    } catch (err) {
      showAlert("Unable to load files", "Error");
    }
  };
// const handleAddNewFile = () => {
//   console.log("🚨🚨🚨 handleAddNewFile BUTTON CLICKED 🚨🚨🚨");
//   console.log("Current newFile:", newFile);

//   if (!newFile || !newFile.file) {
//     console.log("❌ No file selected");
//     return showAlert("Please select a file", "Error");
//   }

//   const fileToAdd = {
//     id: Date.now(),
//     file: newFile.file,
//     file_type: newFile.file_type,
//     acknowledgement: Boolean(newFile.acknowledgement),
//     acknowledgementMessage: newFile.acknowledgementMessage || "",
//   };

//   console.log("Adding file:", fileToAdd.file.name);

//   setNewFilesToAdd(prev => {
//     const updated = [...prev, fileToAdd];
//     console.log("✅ newFilesToAdd updated successfully. Count now:", updated.length);
//     return updated;
//   });

//   // Reset
//   setNewFile({
//     file: null,
//     file_type: "document",
//     acknowledgement: false,
//     acknowledgementMessage: "",
//   });
// };
const handleAddNewFile = () => {
  if (!newFile.file) {
    return showAlert("Please select a file", "Error");
  }

  const fileToAdd = {
    id: Date.now(),
    file: newFile.file,
    file_type: newFile.file_type,
    acknowledgement: Boolean(newFile.acknowledgement),
    acknowledgementMessage: newFile.acknowledgementMessage || "",
  };

  setNewFilesToAdd(prev => [...prev, fileToAdd]);

  // Reset only the file input, keep other fields if needed
  setNewFile({
    file: null,
    file_type: newFile.file_type,           // Keep selected type
    acknowledgement: false,
    acknowledgementMessage: "",
  });
};
  const handleRemoveNewFile = (index) => {
    setNewFilesToAdd(prev => prev.filter((_, i) => i !== index));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.policyName.trim()) {
    return showAlert("Policy name is required", "Error");
  }

  setLoading(true);
  try {
    const createResp = await axios.post(
      `${BACKEND}/api/policies/create`,
      {
        policy_name: formData.policyName,
        description: formData.description || "",
        allow_view: formData.allowView,
        allow_download: formData.allowDownload,
        employeeIds:
          selectionType === "employee"
            ? selectedEmployees.map((emp) => emp.employee_id || emp.id)
            : [],
        departmentIds:
          selectionType === "department"
            ? selectedDepartments.map((dept) => dept.id)
            : [],
        assign_to_all: selectionType === "all" ? 1 : 0,
        created_by: user?.name || user?.email || "System",
      },
      {
        withCredentials: true,
        headers: { "x-org-id": orgId },
      }
    );

    const policyId = createResp.data?.data?.id;

    if (newFilesToAdd.length > 0 && policyId) {
      const fileFormData = new FormData();

      newFilesToAdd.forEach((nf, index) => {
        const fieldName = getFieldName(nf.file_type);
        fileFormData.append(fieldName, nf.file);
        fileFormData.append(`acknowledgement_${index}`, nf.acknowledgement);
        fileFormData.append(
          `acknowledgement_message_${index}`,
          nf.acknowledgementMessage || ""
        );
      });

      await axios.post(
        `${BACKEND}/api/policies/upload-files/${policyId}`,
        fileFormData,
        {
          withCredentials: true,
          headers: { "x-org-id": orgId },
        }
      );
    }

    showAlert("Policy created successfully!");
    resetForm();
    setShowForm(false);
    fetchPolicies();
  } catch (error) {
    showAlert(
      error.response?.data?.message || "Failed to create policy",
      "Error"
    );
  } finally {
    setLoading(false);
  }
};

  const resetForm = () => {
    setFormData({ policyName: "", allowView: true, allowDownload: false });
    setSelectedEmployees([]);
    setSelectedDepartments([]);
    setNewFilesToAdd([]);
    setNewFile({ file: null, file_type: "document", acknowledgement: false, acknowledgementMessage: "" });
    setSearchTerm("");
    setDepartmentSearchTerm("");
    setSelectionType("employee");
  };

const handleSaveEdits = async () => {
  if (!viewPolicy) return;
  setLoading(true);

  try {
    console.log("=== SAVE EDITS STARTED ===");

    // Update Policy Details
    await axios.put(`${BACKEND}/api/policies/update/${viewPolicy.id}`, {
      policy_name: viewPolicy.policy_name,
      description: viewPolicy.description || "",
      allow_view: viewPolicy.allow_view,
      allow_download: viewPolicy.allow_download,
    }, { withCredentials: true, headers: { "x-org-id": orgId } });

    // === COLLECT ALL FILES TO UPLOAD ===
    const filesToUpload = [...newFilesToAdd];

    // If user selected a file but didn't click "Add to List", include it now
    if (newFile.file) {
      filesToUpload.push({
        id: Date.now(),
        file: newFile.file,
        file_type: newFile.file_type,
        acknowledgement: Boolean(newFile.acknowledgement),
        acknowledgementMessage: newFile.acknowledgementMessage || "",
      });
    }

    console.log(`Uploading ${filesToUpload.length} file(s)`);

    // Upload Files (if any)
if (filesToUpload.length > 0) {
  const fileFormData = new FormData();

  filesToUpload.forEach((nf, index) => {
    const fieldName = getFieldName(nf.file_type);
    fileFormData.append(fieldName, nf.file);
    fileFormData.append(`acknowledgement_${index}`, nf.acknowledgement);
    fileFormData.append(`acknowledgement_message_${index}`, nf.acknowledgementMessage || "");
  });

  const uploadRes = await axios.post(
    `${BACKEND}/api/policies/upload-files/${viewPolicy.id}`,
    fileFormData,
    { withCredentials: true, headers: { "x-org-id": orgId } }
  );

  console.log("Upload Response:", uploadRes.data);
}
    // Refresh files
    const latestFiles = await fetchPolicyFiles(viewPolicy.id);
    setViewPolicy(prev => ({ ...prev, files: latestFiles }));

    // Reset upload states
    setNewFilesToAdd([]);
    setNewFile({
      file: null,
      file_type: "document",
      acknowledgement: false,
      acknowledgementMessage: "",
    });

    showAlert("Policy updated successfully!");
  } catch (err) {
    console.error("❌ Save Edits Error:", err.response?.data || err.message);
    showAlert(err.response?.data?.message || "Failed to save changes", "Error");
  } finally {
    setLoading(false);
  }
};

  const handleDeleteFile = async (fileId) => {
  if (!confirm("Are you sure you want to delete this file?")) return;

  setLoading(true);
  try {
    await axios.delete(`${BACKEND}/api/policies/file/${fileId}`, {
      withCredentials: true,
      headers: { "x-org-id": orgId }
    });

    // Refresh files
    const latestFiles = await fetchPolicyFiles(viewPolicy.id);
    setViewPolicy(prev => ({ ...prev, files: latestFiles }));

    showAlert("File deleted successfully!");
  } catch (err) {
    console.error(err);
    showAlert(err.response?.data?.message || "Failed to delete file", "Error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="create-policy-container">
      <div className="policy-header">
        <h2>Manage Policies</h2>
        {!showForm && (
          <button className="create-policy-btn" onClick={() => setShowForm(true)}>
            + Create New Policy
          </button>
        )}
      </div>

    {showForm && (
  <div className="admin-policy-modal-overlay" onClick={() => { setShowForm(false); resetForm(); }}>
    <div className="admin-policy-modal" onClick={(e) => e.stopPropagation()}>
      <CreatePolicyForm
        formData={formData}
        setFormData={setFormData}
        newFile={newFile}
        setNewFile={setNewFile}
        newFilesToAdd={newFilesToAdd}
        handleAddNewFile={handleAddNewFile}
        handleRemoveNewFile={handleRemoveNewFile}
        selectedEmployees={selectedEmployees}
        setSelectedEmployees={setSelectedEmployees}
        selectedDepartments={selectedDepartments}
        setSelectedDepartments={setSelectedDepartments}
        employeeList={employeeList}
        departmentList={departmentList}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        departmentSearchTerm={departmentSearchTerm}
        setDepartmentSearchTerm={setDepartmentSearchTerm}
        handleSubmit={handleSubmit}
        loading={loading}
        onCancel={() => { setShowForm(false); resetForm(); }}
        user={user}
        orgId={orgId}
        selectionType={selectionType}
  setSelectionType={setSelectionType}
      />
    </div>
  </div>
)}

      <div className="policies-list">
        <h3>Existing Policies ({policies.length})</h3>
        <div className="policies-grid">
          {policies.map((policy) => (
            <div key={policy.id} className="policy-card-item">
              <h4>{policy.policy_name}</h4>
              {policy.description && (
    <p className="policy-description" style={{ fontSize: "13px", color: "#666" }}>
      {policy.description.length > 80
        ? policy.description.substring(0, 80) + "..."
        : policy.description}
    </p>
  )}
              <div className="policy-meta">
                Created: {new Date(policy.created_at).toLocaleDateString()}
              </div>
              <button className="upload-view-btn" onClick={() => handleUploadAndView(policy)}>
                Upload & View Documents
              </button>
            </div>
          ))}
        </div>
      </div>

      {viewPolicy && (
  <ViewPolicyModal
    viewPolicy={viewPolicy}
    setViewPolicy={setViewPolicy}
    newFile={newFile}
    setNewFile={setNewFile}
    newFilesToAdd={newFilesToAdd}
    handleAddNewFile={handleAddNewFile}
    handleRemoveNewFile={handleRemoveNewFile}
    handleSaveEdits={handleSaveEdits}
    handleDeleteFile={handleDeleteFile}
    handleEditFile={handleEditFile}
    editingFile={editingFile}
    setEditingFile={setEditingFile}
    handleSaveFileEdit={handleSaveFileEdit}
    loading={loading}
    // Replace Props
    replacingFile={replacingFile}
    setReplacingFile={setReplacingFile}
    replaceNewFile={replaceNewFile}
    setReplaceNewFile={setReplaceNewFile}
    handleReplaceFile={handleReplaceFile}
    handleSaveReplace={handleSaveReplace}
  />
)}

     {/* Alert Modal - Always on Top */}
{alertModal.isVisible && (
  <div 
    className="alert-modal-overlay" 
    onClick={closeAlert}
    style={{ zIndex: 99999 }}
  >
    <div 
      className="alert-modal" 
      onClick={e => e.stopPropagation()}
      style={{ zIndex: 100000 }}
    >
      <h2>{alertModal.title}</h2>
      <p>{alertModal.message}</p>
      <button onClick={closeAlert}>Close</button>
    </div>
  </div>
)}
    </div>
  );
};

export default CreatePolicies;
