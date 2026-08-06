

import React, { useState, useEffect } from "react";
import "./employeePolicies.css";
import { renderAsync } from "docx-preview";
import axios from "axios";
import { useAuth } from "../../../context/AuthProvider.client";
import {
  FaBookOpen,
  FaFilePdf,
  FaFileWord,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFilePowerpoint,
  FaFileAlt,
  FaShieldAlt,
  FaUserCheck,
  FaLaptop,
  FaHeartbeat,
  FaBalanceScale,
  FaLock,
  FaUsers,
  FaClipboardList,
  FaChevronRight,FaDownload,
} from "react-icons/fa";

export default function EmployeePolicies() {
  const { user, hydrated } = useAuth();

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
const [activeTab, setActiveTab] = useState("all"); // "all" | "pending" | "acknowledged"
  const [fileUrl, setFileUrl] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);

  // helpers
  const getFileName = (file) =>
    file?.original_file_name || file?.file_name || "";

  const isImage = (fileName = "") =>
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);

  const isPdf = (fileName = "") => /\.pdf$/i.test(fileName);

  const isVideo = (fileName = "") =>
    /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(fileName);

  const isAudio = (fileName = "") =>
    /\.(mp3|wav|ogg|m4a)$/i.test(fileName);

  const isDocx = (fileName = "") => /\.docx$/i.test(fileName);

  const isPpt = (fileName = "") => /\.(ppt|pptx)$/i.test(fileName);

  // ----- Policy icon based on name -----
  const getPolicyIcon = (policyName = "") => {
    const name = policyName.toLowerCase();

    if (name.includes("security") || name.includes("data") || name.includes("privacy"))
      return <FaLock className="policy-icon" />;
    if (name.includes("leave") || name.includes("attendance") || name.includes("hr"))
      return <FaUserCheck className="policy-icon" />;
    if (name.includes("it") || name.includes("device") || name.includes("laptop") || name.includes("code"))
      return <FaLaptop className="policy-icon" />;
    if (name.includes("health") || name.includes("safety") || name.includes("medical"))
      return <FaHeartbeat className="policy-icon" />;
    if (name.includes("conduct") || name.includes("ethic") || name.includes("discipline"))
      return <FaBalanceScale className="policy-icon" />;
    if (name.includes("team") || name.includes("culture") || name.includes("people"))
      return <FaUsers className="policy-icon" />;
    if (name.includes("policy") || name.includes("guideline") || name.includes("rule"))
      return <FaClipboardList className="policy-icon" />;

    // fallback rotation so every card is not the same
    const fallbacks = [FaBookOpen, FaShieldAlt, FaClipboardList, FaUsers];
    const index = Math.abs(
      policyName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    ) % fallbacks.length;
    const Icon = fallbacks[index];
    return <Icon className="policy-icon" />;
  };

  // ----- File type icon -----
  const getFileIcon = (file) => {
    const name = getFileName(file);

    if (isPdf(name)) return <FaFilePdf className="file-icon pdf" />;
    if (isDocx(name) || /\.doc$/i.test(name))
      return <FaFileWord className="file-icon word" />;
    if (isImage(name)) return <FaFileImage className="file-icon image" />;
    if (isVideo(name)) return <FaFileVideo className="file-icon video" />;
    if (isAudio(name)) return <FaFileAudio className="file-icon audio" />;
    if (isPpt(name)) return <FaFilePowerpoint className="file-icon ppt" />;

    return <FaFileAlt className="file-icon generic" />;
  };

  // Clean up previous object URL
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const loadFile = async (file) => {
    if (!file || !user) return;

    setLoadingFile(true);

    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }

    try {
      const response = await axios.get(
        `${BACKEND}/api/policies/employee-policy/view/${file.id}`,
        {
          withCredentials: true,
          headers: getHeaders(),
          responseType: "blob",
        }
      );

      const fileName = getFileName(file);
      let contentType = response.headers["content-type"];

      if (!contentType || contentType === "application/octet-stream") {
        if (isImage(fileName)) contentType = "image/png";
        else if (isPdf(fileName)) contentType = "application/pdf";
        else if (isVideo(fileName)) contentType = "video/mp4";
        else if (isAudio(fileName)) contentType = "audio/mpeg";
        else if (isDocx(fileName))
          contentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else contentType = "application/octet-stream";
      }

      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      setFileUrl(url);

     if (isDocx(fileName)) {
  setTimeout(() => {
    const container = document.getElementById("docx-preview-container");
    if (container) {
      container.innerHTML = "";
      renderAsync(blob, container, null, {
        className: "docx-preview",
        inWrapper: true,
        ignoreWidth: true,
        ignoreHeight: true,
        breakPages: true,
        useBase64URL: true,
        renderHeaders: false,
        renderFooters: false,
      }).catch((err) => console.error("docx-preview error:", err));
    }
  }, 50);
}
    } catch (err) {
      console.error("Failed to load file:", err.response?.data || err);
      setFileUrl(null);
    } finally {
      setLoadingFile(false);
    }
  };

  useEffect(() => {
    if (selectedFile) {
      loadFile(selectedFile);
    } else {
      setFileUrl(null);
    }
  }, [selectedFile]);

  const getHeaders = () => {
    const headers = {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    };
    if (user?.employeeId) headers["x-employee-id"] = user.employeeId;
    if (user?.orgId) headers["x-org-id"] = user.orgId;
    return headers;
  };

  const fetchPolicyFiles = async (policyId) => {
    try {
      const response = await axios.get(`${BACKEND}/api/policies/employee/${policyId}/files`, {
        withCredentials: true,
        headers: getHeaders(),
      });
      return response.data.data || [];
    } catch (err) {
      console.error("Error fetching policy files", err);
      return [];
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await axios.get(`${BACKEND}/api/policies/employee`, {
        withCredentials: true,
        headers: getHeaders(),
      });

      const data = response.data.data || [];

      // Preload file metadata for each policy so the tabs can evaluate pending / acknowledged status.
      const policiesWithFiles = await Promise.all(
        data.map(async (policy) => ({
          ...policy,
          files: await fetchPolicyFiles(policy.policy_id),
        }))
      );

      setPolicies(policiesWithFiles);
    } catch (err) {
      console.error("Error fetching policies:", err);
    }
  };

  useEffect(() => {
    if (!hydrated || !user) return;
    fetchPolicies();
  }, [hydrated, user]);

  const handlePolicy = async (policy) => {
    if (selectedPolicy?.policy_id === policy.policy_id) {
      setSelectedPolicy(null);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(null);

    let updatedPolicy = policy;
    if (!policy.files) {
      const files = await fetchPolicyFiles(policy.policy_id);
      updatedPolicy = { ...policy, files };
    }

    setSelectedPolicy(updatedPolicy);

    // Also update the main policies list so tabs can filter correctly
    setPolicies((prev) =>
      prev.map((p) =>
        p.policy_id === policy.policy_id ? updatedPolicy : p
      )
    );
  };
const handleDownload = async (file) => {
  if (!file || !user) return;

  try {
    const response = await axios.get(
      `${BACKEND}/api/policies/employee-policy/view/${file.id}`,
      {
        withCredentials: true,
        headers: getHeaders(),
        responseType: "blob",
      }
    );

    const fileName = getFileName(file);
    const blob = new Blob([response.data]);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err.response?.data || err);
    alert("Failed to download file");
  }
};
const filteredPolicies = policies.filter((policy) => {
  if (activeTab === "all") return true;

  const files = policy.files || [];

  const hasPending = files.some(
    (f) => Number(f.acknowledgement_required) === 1 && Number(f.is_acknowledged) === 0
  );

  const hasAcknowledged = files.some(
    (f) => Number(f.acknowledgement_required) === 1 && Number(f.is_acknowledged) === 1
  );

  if (activeTab === "pending") return hasPending;
  if (activeTab === "acknowledged") return hasAcknowledged;

  return true;
});
const handleAcknowledgement = async () => {
  try {
    await axios.post(
      `${BACKEND}/api/policies/employee-policy/acknowledgement`,
      {
        policyId: selectedPolicy.policy_id,
        policyFileId: pendingFile.id,
      },
      {
        withCredentials: true,
        headers: getHeaders(),
      }
    );

    // Update the file in selectedPolicy so UI updates immediately
    const updatedFiles = selectedPolicy.files.map((f) =>
      f.id === pendingFile.id
        ? { ...f, is_acknowledged: 1 }
        : f
    );

    setSelectedPolicy({
      ...selectedPolicy,
      files: updatedFiles,
    });

    setSelectedFile({ ...pendingFile, is_acknowledged: 1 });
    setPendingFile(null);

    alert("Acknowledgement saved successfully.");
  } catch (err) {
    console.error("Acknowledgement Error:", err.response?.data || err);
    alert(err.response?.data?.message || "Failed to save acknowledgement.");
  }
};

const handleFileClick = (file) => {
  setSelectedFile(file);

  if (Number(file.acknowledgement_required) === 1 && Number(file.is_acknowledged) === 0) {
    setPendingFile(file);
  } else {
    setPendingFile(null);
  }
};

 return (
  <div className="employee-policy-page">
    {/* ========== HEADER + TABS ========== */}
   <div className="policies-header">
  <h1 className="policies-title-emp">Policies</h1>

  <div className="policies-tabs">
    <div
      className={`tab-item ${activeTab === "all" ? "active" : ""}`}
      onClick={() => setActiveTab("all")}
    >
      All Policies
      {activeTab === "all" && <div className="active-line" />}
    </div>

    <div
      className={`tab-item ${activeTab === "pending" ? "active" : ""}`}
      onClick={() => setActiveTab("pending")}
    >
      Acknowledgement Pending
      {activeTab === "pending" && <div className="active-line" />}
    </div>

    <div
      className={`tab-item ${activeTab === "acknowledged" ? "active" : ""}`}
      onClick={() => setActiveTab("acknowledged")}
    >
      Policies Acknowledged
      {activeTab === "acknowledged" && <div className="active-line" />}
    </div>
  </div>
</div>

    {/* ========== EXISTING GRID ========== */}
    <div
      className={`policy-grid ${
        selectedFile
          ? "layout-three"
          : selectedPolicy
          ? "layout-two"
          : "layout-one"
      }`}
    >
      {/* LEFT – Policies */}
      <div className="policy-section">
        <div className="section-title">Employee Policies</div>
        <div className={`policy-cards ${selectedPolicy ? "two-col" : "four-col"}`}>
          {filteredPolicies.map((policy) => {
            const hasPending = policy.files?.some(
              (f) => Number(f.acknowledgement_required) === 1 && Number(f.is_acknowledged) === 0
            );
            const hasAcknowledged = policy.files?.some(
              (f) => Number(f.acknowledgement_required) === 1 && Number(f.is_acknowledged) === 1
            );
            const fileCount = policy.files?.length || 0;
            return (
              <div
                key={policy.policy_id}
                className={`policy-card ${
                  selectedPolicy?.policy_id === policy.policy_id ? "active-card" : ""
                }`}
                onClick={() => handlePolicy(policy)}
              >
                <div className="policy-card-header">
                  <div className="policy-card-icon">{getPolicyIcon(policy.policy_name)}</div>
                  <div className="policy-card-info">
                    <span className="policy-name">{policy.policy_name}</span>
                    {policy.policy_description && (
                      <p className="policy-description">{policy.policy_description}</p>
                    )}
                  </div>
                </div>
                <div className="policy-card-divider" />
                <div className="policy-card-footer">
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b" }}>
                    <FaFilePdf style={{ fontSize: "14px" }} />
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{fileCount} file{fileCount !== 1 ? "s" : ""}</span>
                  </div>
                  {(hasPending || hasAcknowledged) && (
                    <span className={`policy-status-badge ${hasPending ? "pending" : "acknowledged"}`}>
                      {hasPending ? "Pending" : "Acknowledged"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MIDDLE – Files (only when a policy is selected) */}
      {selectedPolicy && (
        <div className="file-section">
          <div className="section-title-with-close">
          <span className="section-title">Files</span>
          <button
            className="close-panel-btn"
            onClick={() => {
              setSelectedPolicy(null);
              setSelectedFile(null);
            }}
            aria-label="Close files panel"
          >
            ×
          </button>
        </div>
         {selectedPolicy.files && selectedPolicy.files.length > 0 ? (
  <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
    {selectedPolicy.files.map((file) => {
      const canView = Number(file.allow_view) === 1;
      const canDownload = Number(file.allow_download) === 1;

      return (
        <div
          key={file.id}
          className={`file-card ${
            selectedFile?.id === file.id ? "active-file" : ""
          }`}
        >
          <div
            className="file-card-main"
            onClick={() => {
              if (canView) handleFileClick(file);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flex: 1,
              cursor: canView ? "pointer" : "not-allowed",
              opacity: canView ? 1 : 0.6,
            }}
          >
            {getFileIcon(file)}
            <span>{getFileName(file)}</span>

            {!canView && (
              <span
                style={{
                  fontSize: 12,
                  color: "#ef4444",
                  marginLeft: "auto",
                }}
              >
                Not allowed to view
              </span>
            )}
          </div>

          {canView && <FaChevronRight className="arrow" />}
        </div>
      );
    })}
  </div>
) : (
  <p style={{ padding: 16, color: "#64748b", fontSize: 14 }}>
    No files available for this policy.
  </p>
)}
        </div>
      )}

      {/* RIGHT – Viewer (only when a file is selected) */}
      {selectedFile && (
        <div className="viewer-section">
          <div className="viewer-header">
            <span>{getFileName(selectedFile) || "No File Selected"}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {Number(selectedFile.allow_download) === 1 && (
                <button
                  className="viewer-download-btn"
                  onClick={() => handleDownload(selectedFile)}
                  title="Download file"
                >
                  <FaDownload /> Download
                </button>
              )}
              <button
                className="close-panel-btn"
                onClick={() => setSelectedFile(null)}
                aria-label="Close file viewer"
              >
                ×
              </button>
            </div>
          </div>
          <div className="viewer-body">
            {Number(selectedFile.allow_view) !== 1 ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: 40,
                textAlign: "center"
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                <h3 style={{ color: "#1f2937", fontSize: 18, marginBottom: 8 }}>Access Restricted</h3>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
                  This file is not available for viewing. Please contact your administrator if you need access to this document.
                </p>
              </div>
            ) : loadingFile ? (
              <p>Loading...</p>
            ) : fileUrl && selectedFile ? (
              (() => {
                const name = getFileName(selectedFile);
                if (isImage(name)) {
                  return (
                    <img
                      src={fileUrl}
                      alt={name}
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  );
                }
                if (isPdf(name)) {
                  return (
                    <iframe
                      src={`${fileUrl}#toolbar=0&navpanes=0`}
                      title="Policy PDF"
                      width="100%"
                      height="100%"
                      style={{ border: "none" }}
                    />
                  );
                }
                if (isVideo(name)) {
                  return (
                    <video src={fileUrl} controls style={{ maxWidth: "100%", maxHeight: "100%" }}>
                      Your browser does not support the video tag.
                    </video>
                  );
                }
                if (isAudio(name)) {
                  return (
                    <audio src={fileUrl} controls style={{ width: "100%" }}>
                      Your browser does not support the audio element.
                    </audio>
                  );
                }
                if (isDocx(name)) {
                  return (
                    <div className="docx-viewer-wrapper">
                      <div id="docx-preview-container" className="docx-preview-container" />
                    </div>
                  );
                }
                return (
                  <div style={{ padding: 32, textAlign: "center" }}>
                    <p style={{ fontSize: 16, marginBottom: 8 }}>
                      Preview is not available for this file type.
                    </p>
                    <p style={{ color: "#64748b", marginBottom: 24 }}>
                      Please download the file to view it.
                    </p>
                    <a
                      href={fileUrl}
                      download={name}
                      style={{
                        display: "inline-block",
                        padding: "12px 24px",
                        background: "#2563eb",
                        color: "white",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      Download {name}
                    </a>
                  </div>
                );
              })()
            ) : (
              <p>No file available.</p>
            )}

            {/* Floating acknowledgement – now correctly overlays the file */}
            {Number(selectedFile.allow_view) === 1 && pendingFile && (
              <div className="ack-message-box floating-ack">
                <div className="ack-message-title">Acknowledgement required</div>
                <p>
                  {pendingFile?.acknowledgement_message ||
                    "This file requires acknowledgement before it can be marked as read."}
                </p>
                <button
                  className="ac-modal-btn ac-modal-btn-primary"
                  onClick={handleAcknowledgement}
                >
                  Acknowledge
                </button>
              </div>
            )}
            {pendingFile && (
              <div className="ack-message-box floating-ack">
                <div className="ack-message-title">Acknowledgement required</div>
                <p>
                  {pendingFile?.acknowledgement_message ||
                    "This file requires acknowledgement before it can be marked as read."}
                </p>
                <button
                  className="ac-modal-btn ac-modal-btn-primary"
                  onClick={handleAcknowledgement}
                >
                  Acknowledge
                </button>
              </div>
            )}
          </div>

          {/* Footer is a sibling of viewer-body, not inside it */}
          <div className="viewer-footer">
            <div className="viewer-footer-text">
              Viewing file: <strong>{getFileName(selectedFile)}</strong>
              {Number(selectedFile.acknowledgement_required) === 1 && (
                <span> — Acknowledgement required</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

  </div>
);
    

}