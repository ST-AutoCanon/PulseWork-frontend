
import "./ClearanceModal.css";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
import React, { useState, useEffect, useMemo } from "react";
import Modal from "../Modal/Modal.client";

// ── Safe date parser - prevents +5:30 IST shift (one day back issue) ──
const cleanDateForInput = (rawDate) => {
  if (!rawDate) return "";
  return String(rawDate).split("T")[0];
};

export default function ClearanceModal({
  isOpen,
  onClose,
  ktPlans,
  assets,
  onAddKT,
  onAddAsset,
  onFinalize,
  loading,
  exitCompleted,
  newKtForm,
  setNewKtForm,
  newAssetForm,
  setNewAssetForm,
  isHr = false,
  viewFile,
  downloadFile,
  onRefresh,
}) {
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };
  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };
  const [activeTab, setActiveTab] = useState("kt");
  const [showKTModal, setShowKTModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);

  // ── Added: loading state for adding asset to show "Saving…" and prevent double-clicks ──
  const [isSavingAsset, setIsSavingAsset] = useState(false);

  const { user } = useAuth();
  const headers = useMemo(() => {
    return {
      "x-api-key": API_KEY ?? "",
      ...(user?.employeeId ? { "x-employee-id": user.employeeId } : {}),
      ...(user?.orgId ? { "x-org-id": user.orgId } : {}),
    };
  }, [API_KEY, user?.employeeId, user?.orgId]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingKt, setEditingKt] = useState(null);
  const [editKtForm, setEditKtForm] = useState({
    topic: "",
    description: "",
    documents: [],
    filesToDelete: [],
    status: "pending",
    completedDate: "",
  });
  if (!isOpen) return null;

  // ── Start editing a KT plan ────────────────────────────────────────
  const startEditKt = (kt) => {
    const cleanCompletedDate = cleanDateForInput(
      kt.actual_completed_date || kt.planned_date || ""
    );

    console.log("[startEditKt] Raw backend date:", kt.actual_completed_date);
    console.log("[startEditKt] Cleaned for input:", cleanCompletedDate);

    setEditingKt(kt);
    setEditKtForm({
      topic: kt.title || "",
      description: kt.description || "",
      documents: [],
      filesToDelete: [],
      status: kt.status || "pending",
      completedDate: cleanCompletedDate,
    });
    setShowKTModal(true);
  };

  // ── Handle Add KT ──────────────────────────────────────────────────
  const handleAddKt = async () => {
    if (!newKtForm.topic.trim() || !newKtForm.description.trim()) {
      showAlert("Topic and description are required");
      return;
    }
    await onAddKT();
    setNewKtForm({
      topic: "",
      description: "",
      documents: [],
      status: "pending",
      completedDate: "",
    });
    setShowKTModal(false);
    if (onRefresh) onRefresh();
  };

  // ── Handle Update KT ───────────────────────────────────────────────
  const handleUpdateKt = async () => {
    if (!editKtForm.topic.trim() || !editKtForm.description.trim()) {
      showAlert("Topic and description are required");
      return;
    }
    try {
      if (!editingKt?.id) {
        throw new Error("No KT ID available");
      }
      const exitIdValue =
        editingKt.exit_id ||
        editingKt.exit_request_id ||
        editingKt.exitId ||
        editingKt.exit_request ||
        "";
      const formData = new FormData();
      formData.append("exitId", exitIdValue);
      formData.append("title", editKtForm.topic);
      formData.append("description", editKtForm.description);
      formData.append("status", editKtForm.status);
      formData.append("completedDate", editKtForm.completedDate || "");
      editKtForm.documents.forEach((file) => formData.append("files", file));
      formData.append("filesToDelete", JSON.stringify(editKtForm.filesToDelete || []));
      const url = `${BACKEND_URL}/api/clearance/item/${editingKt.id}`;
      console.log("=== ATTEMPTING KT UPDATE ===");
      console.log("URL:", url);
      console.log("exitId sent:", exitIdValue);
      console.log("FormData entries:");
      for (const [key, val] of formData.entries()) {
        console.log(` ${key} →`, val instanceof Blob ? `File (${val.name || "unnamed"})` : val);
      }
      console.log("Headers:", headers);
      const response = await axios.put(url, formData, {
        withCredentials: true,
        headers,
      });
      showAlert("KT Plan updated successfully!");
      if (onRefresh) onRefresh();
      setEditingKt(null);
      setShowKTModal(false);
    } catch (err) {
      console.error("KT update failed:", {
        message: err.message,
        status: err.response?.status,
        responseData: err.response?.data,
      });
      showAlert("Update failed: " + (err.response?.data?.error || err.message));
    }
  };

  // ── Handle Add Asset ───────────────────────────────────────────────
  const handleAddAsset = async () => {
    if (!newAssetForm.name.trim() || !newAssetForm.returnDate) {
      return showAlert("Asset name and return date are required");
    }

    setIsSavingAsset(true);

    try {
      await onAddAsset();
      setNewAssetForm({ name: "", returnDate: "" });
      setShowAddAssetModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error adding asset:", err);
      showAlert("Failed to add asset. Please try again.");
    } finally {
      setIsSavingAsset(false);
    }
  };
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "pending";

    case "completed":
      return "completed";

    case "in_progress":
    case "in-progress":
      return "in-progress";

    default:
      return "pending";
  }
};
  

  return (
    <>
      {/* Main Clearance Modal */}
      <div className="exf-clearance-modal-backdrop" onClick={onClose}>
        <div className="exf-clearance-modal-content" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="exf-clearance-modal-header">
            <h2 className="exf-clearance-modal-title">Exit Clearance</h2>
            <button className="exf-clearance-modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          {/* Tabs */}
          <div className="exf-clearance-tabs-wrapper">
            <div className="exf-clearance-tabs">
              <button
                className={`exf-clearance-tab ${activeTab === "kt" ? "exf-clearance-tab--active" : ""}`}
                onClick={() => setActiveTab("kt")}
              >
                📚 Knowledge Transfer
              </button>
              <button
                className={`exf-clearance-tab ${activeTab === "assets" ? "exf-clearance-tab--active" : ""}`}
                onClick={() => setActiveTab("assets")}
              >
                📦 Assets
              </button>
            </div>
          </div>
          {/* Body */}
          <div className="exf-clearance-modal-body">
            {exitCompleted ? (
              <div className="exf-clearance-empty-state">
                <div className="exf-clearance-empty-icon">✓</div>
                <h3 className="exf-clearance-empty-title">Exit Flow Completed!</h3>
                <p className="exf-clearance-empty-text">All the best for your future endeavors!</p>
              </div>
            ) : activeTab === "kt" ? (
              <div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ margin: "0 0 1rem 0", color: "#111827" }}>
                    Knowledge Transfer Plans
                  </h3>
                  {ktPlans?.length > 0 ? (
                    <div className="exf-clearance-items-list">
                      {ktPlans.map((kt) => (
                        <div key={kt.id} className="exf-clearance-item-card">
                          <div className="exf-clearance-item-header">
                            <h4 className="exf-clearance-item-title">{kt.title}</h4>
                          </div>
                          <p className="exf-clearance-item-description">{kt.description}</p>
                          {/* Show cleaned dates */}
                         <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#4b5563" }}>
  {kt.status === "completed"
    ? `Completed Date: ${
        cleanDateForInput(
          kt.actual_completed_date ||
          kt.completed_date ||
          kt.completedDate
        )
      }`
    : kt.planned_date
    ? `completed Date: ${cleanDateForInput(kt.planned_date)}`
    : ""}
</p>

<div style={{ marginTop: "0.3rem" }}>
  <span className={`exf-status-badge ${getStatusColor(kt.status)}`}>
    {kt.status?.replace("_", " ").toUpperCase()}
  </span>
</div>
                          <div className="exf-approvals mt-3 flex flex-col gap-2 text-sm">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!kt.supervisor_approved}
                                disabled={true}
                                className="h-4 w-4 text-green-600 cursor-not-allowed"
                              />
                              <span className={kt.supervisor_approved ? "text-green-700 font-medium" : "text-gray-600"}>
                                Supervisor Approved
                              </span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!kt.hr_approved}
                                disabled={true}
                                className="h-4 w-4 text-green-600 cursor-not-allowed"
                              />
                              <span className={kt.hr_approved ? "text-green-700 font-medium" : "text-gray-600"}>
                                HR/Admin Approved
                              </span>
                            </label>
                          </div>
                          {kt.attached_files?.length > 0 && (
                            <div className="exf-clearance-files-section mt-3">
                              <label className="exf-clearance-files-label">
                                📄 Files ({kt.attached_files.length})
                              </label>
                              <div className="exf-clearance-files-list">
                                {kt.attached_files.map((file, idx) => {
                                  const fileName = file.split("/").pop();
                                  return (
                                    <div key={idx} className="exf-clearance-file-row">
                                      <span className="exf-clearance-file-name">📄 {fileName}</span>
                                      <div className="exf-clearance-file-actions">
                                        <button
                                          className="exf-clearance-file-btn exf-clearance-file-btn--view"
                                          onClick={() => viewFile(file)}
                                        >
                                          View
                                        </button>
                                        <button
                                          className="exf-clearance-file-btn exf-clearance-file-btn--download"
                                          onClick={() => downloadFile(file, fileName)}
                                        >
                                          Download
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {!exitCompleted && !isHr && (
                            <div className="exf-clearance-actions mt-3">
                              <button
                                className="exf-clearance-edit-btn"
                                onClick={() => startEditKt(kt)}
                              >
                                ✏️ Edit
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="exf-clearance-empty-state">
                      <div className="exf-clearance-empty-icon">📚</div>
                      <h4 className="exf-clearance-empty-title">No KT Plans Yet</h4>
                      <p className="exf-clearance-empty-text">
                        Add your handover topics and upload related documents.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ margin: "0 0 1rem 0", color: "#111827" }}>
                    Assets to Return
                  </h3>
                  {assets?.length > 0 ? (
                    <div className="exf-clearance-items-list">
                      {assets.map((asset) => (
                        <div key={asset.id} className="exf-clearance-item-card">
                          <div className="exf-clearance-item-header">
                            <h4 className="exf-clearance-item-title">{asset.title}</h4>
                          </div>
                          <p className="exf-clearance-item-description">
                            Return Date: {cleanDateForInput(asset.planned_date) || "—"}
                          </p>
                          <div className="exf-approvals mt-3 flex flex-col gap-2 text-sm">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!asset.supervisor_approved}
                                disabled={true}
                                className="h-4 w-4 text-green-600 cursor-not-allowed"
                              />
                              <span className={asset.supervisor_approved ? "text-green-700 font-medium" : "text-gray-600"}>
                                Supervisor Approved
                              </span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!asset.hr_approved}
                                disabled={true}
                                className="h-4 w-4 text-green-600 cursor-not-allowed"
                              />
                              <span className={asset.hr_approved ? "text-green-700 font-medium" : "text-gray-600"}>
                                HR/Admin Approved
                              </span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="exf-clearance-empty-state">
                      <div className="exf-clearance-empty-icon">📦</div>
                      <h4 className="exf-clearance-empty-title">No Assets Registered</h4>
                      <p className="exf-clearance-empty-text">
                        Add your assets that need to be returned.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Footer */}
          <div className="exf-clearance-modal-footer">
            {!exitCompleted && (
              <button
                className="exf-clearance-add-btn"
                onClick={() => (activeTab === "kt" ? setShowKTModal(true) : setShowAddAssetModal(true))}
                disabled={loading}
              >
                + Add {activeTab === "kt" ? "KT Plan" : "Asset"}
              </button>
            )}
            <button className="exf-clearance-close-btn" onClick={onClose} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Shared Add / Edit KT Modal */}
      {showKTModal && (
        <div className="exf-clearance-modal-backdrop" onClick={() => {
          setShowKTModal(false);
          setEditingKt(null);
        }}>
          <div className="exf-clearance-modal-content" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="exf-clearance-modal-header">
              <h2 className="exf-clearance-modal-title">
                {editingKt ? "Edit Knowledge Transfer Plan" : "Add Knowledge Transfer Plan"}
              </h2>
              <button
                className="exf-clearance-modal-close"
                onClick={() => {
                  setShowKTModal(false);
                  setEditingKt(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="exf-clearance-modal-body">
              {/* Topic */}
              <div className="exf-form-group">
                <label className="exf-form-label required">Topic </label>
                <input
                  type="text"
                  className="exf-form-input"
                  value={editingKt ? editKtForm.topic : newKtForm.topic}
                  onChange={(e) =>
                    editingKt
                      ? setEditKtForm({ ...editKtForm, topic: e.target.value })
                      : setNewKtForm({ ...newKtForm, topic: e.target.value })
                  }
                  placeholder="e.g. CRM Dashboard Training"
                />
              </div>
              {/* Description */}
              <div className="exf-form-group">
                <label className="exf-form-label required">Description </label>
                <textarea
                  className="exf-form-textarea"
                  rows={5}
                  value={editingKt ? editKtForm.description : newKtForm.description}
                  onChange={(e) =>
                    editingKt
                      ? setEditKtForm({ ...editKtForm, description: e.target.value })
                      : setNewKtForm({ ...newKtForm, description: e.target.value })
                  }
                  placeholder="Detailed notes about what needs to be handed over..."
                />
              </div>
              {/* Upload Documents */}
              <div className="exf-form-group">
                <label className="exf-form-label">Upload Documents (multiple allowed)</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    if (editingKt) {
                      setEditKtForm({ ...editKtForm, documents: [...editKtForm.documents, ...selected] });
                    } else {
                      setNewKtForm({ ...newKtForm, documents: [...newKtForm.documents, ...selected] });
                    }
                  }}
                  className="exf-file-input"
                />
              </div>
              {/* New Files Preview */}
              {(editingKt ? editKtForm.documents : newKtForm.documents).length > 0 && (
                <div className="exf-form-group">
                  <label className="exf-form-label">
                    New Files ({(editingKt ? editKtForm.documents : newKtForm.documents).length})
                  </label>
                  <div className="exf-file-list">
                    {(editingKt ? editKtForm.documents : newKtForm.documents).map((file, idx) => (
                      <div key={idx} className="exf-file-item">
                        <span className="exf-file-name">{file.name}</span>
                        <button
                          type="button"
                          className="exf-file-remove"
                          onClick={() => {
                            if (editingKt) {
                              const updated = editKtForm.documents.filter((_, i) => i !== idx);
                              setEditKtForm({ ...editKtForm, documents: updated });
                            } else {
                              const updated = newKtForm.documents.filter((_, i) => i !== idx);
                              setNewKtForm({ ...newKtForm, documents: updated });
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Existing Files (Edit mode only) */}
              {editingKt && ktPlans.find(k => k.id === editingKt.id)?.attached_files?.length > 0 && (
                <div className="exf-form-group">
                  <label className="exf-form-label">Current Files</label>
                  <div className="exf-file-list">
                    {ktPlans.find(k => k.id === editingKt.id).attached_files.map((rawPath, idx) => {
                      const fileName = rawPath.split('/').pop();
                      const isMarkedDelete = editKtForm.filesToDelete.includes(rawPath);
                      return (
                        <div key={idx} className={`exf-file-item ${isMarkedDelete ? 'deleted' : ''}`}>
                          <span className="exf-file-name">{fileName}</span>
                          <button
                            type="button"
                            className={isMarkedDelete ? "exf-file-keep" : "exf-file-remove"}
                            onClick={() => {
                              setEditKtForm(prev => ({
                                ...prev,
                                filesToDelete: isMarkedDelete
                                  ? prev.filesToDelete.filter(p => p !== rawPath)
                                  : [...prev.filesToDelete, rawPath]
                              }));
                            }}
                          >
                            {isMarkedDelete ? "Keep" : "Remove"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Status & Completed Date */}
              <div className="exf-form-row">
                <div className="exf-form-group half">
                  <label className="exf-form-label">Status</label>
                  <select
                    className="exf-form-select"
                    value={editingKt ? editKtForm.status : newKtForm.status}
                    onChange={(e) =>
                      editingKt
                        ? setEditKtForm({ ...editKtForm, status: e.target.value })
                        : setNewKtForm({ ...newKtForm, status: e.target.value })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="exf-form-group half">
                  <label className="exf-form-label">Completed Date</label>
                  <input
                    type="date"
                    className="exf-form-input"
                    value={editingKt ? editKtForm.completedDate : newKtForm.completedDate}
                    onChange={(e) =>
                      editingKt
                        ? setEditKtForm({ ...editKtForm, completedDate: e.target.value })
                        : setNewKtForm({ ...newKtForm, completedDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="exf-clearance-modal-footer">
              <button
                className="exf-clearance-close-btn"
                onClick={() => {
                  setShowKTModal(false);
                  setEditingKt(null);
                }}
              >
                Cancel
              </button>
              <button
                className="exf-clearance-add-btn"
                onClick={editingKt ? handleUpdateKt : handleAddKt}
              >
                {editingKt ? "Update KT Plan" : "Add KT Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddAssetModal && (
        <div className="exf-clearance-modal-backdrop" onClick={() => {
          if (!isSavingAsset) setShowAddAssetModal(false);
        }}>
          <div
            className="exf-clearance-modal-content"
            style={{ maxWidth: "500px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="exf-clearance-modal-header">
              <h2 className="exf-clearance-modal-title">Add Asset</h2>
              <button 
                className="exf-clearance-modal-close" 
                onClick={() => {
                  if (!isSavingAsset) setShowAddAssetModal(false);
                }}
                disabled={isSavingAsset}
              >
                ×
              </button>
            </div>
            <div className="exf-clearance-modal-body">
              <div style={{ marginBottom: "1rem" }}>
                <label className="exf-label">
  Asset Name <span className="required-star">*</span>
</label>
                <input
                  type="text"
                  value={newAssetForm.name}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                  }}
                  placeholder="e.g., Laptop, Phone"
                  disabled={isSavingAsset}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="exf-label">
  Return Date <span className="required-star">*</span>
</label>
                <input
                  type="date"
                  value={newAssetForm.returnDate}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, returnDate: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                  }}
                  disabled={isSavingAsset}
                />
              </div>
            </div>
            <div className="exf-clearance-modal-footer">
              <button 
                className="exf-clearance-close-btn" 
                onClick={() => {
                  if (!isSavingAsset) setShowAddAssetModal(false);
                }}
                disabled={isSavingAsset}
              >
                Cancel
              </button>
              <button
                className="exf-clearance-add-btn"
                onClick={handleAddAsset}
                disabled={isSavingAsset}
              >
                {isSavingAsset ? "Saving..." : "Add Asset"}
              </button>
            </div>
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
    </>
  );
}