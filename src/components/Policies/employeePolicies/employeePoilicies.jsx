

import React, { useState, useEffect } from "react";
import "./employeePolicies.css";
import { renderAsync } from "docx-preview";
import axios from "axios";
import Modal from "../../Modal/Modal.client";
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
  const [showAcknowledgement, setShowAcknowledgement] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

const [showSuccessModal, setShowSuccessModal] = useState(false);   // ← add this
  const [fileUrl, setFileUrl] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
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

  const fetchPolicies = async () => {
    try {
      const response = await axios.get(`${BACKEND}/api/policies/employee`, {
        withCredentials: true,
        headers: getHeaders(),
      });

      const data = response.data.data || [];
      setPolicies(data);

      if (data.length > 0) {
        setSelectedPolicy(data[0]);
        if (data[0].files?.length > 0) {
          setSelectedFile(data[0].files[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching policies:", err);
    }
  };

  useEffect(() => {
    if (!hydrated || !user) return;
    fetchPolicies();
  }, [hydrated, user]);

  const handlePolicy = async (policy) => {
    setSelectedPolicy(policy);

    try {
      const response = await axios.get(
        `${BACKEND}/api/policies/employee/${policy.policy_id}/files`,
        {
          withCredentials: true,
          headers: getHeaders(),
        }
      );

      const files = response.data.data || [];

      setSelectedPolicy({
        ...policy,
        files,
      });

      if (files.length > 0) {
        setSelectedFile(files[0]);
      } else {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error(err);
      setSelectedFile(null);
    }
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

    setSelectedFile(pendingFile);
    setShowAcknowledgement(false);
    setPendingFile(null);

    // same style as Assets
    showAlert("Acknowledgement saved successfully.", "Success");
  } catch (err) {
    console.error("Acknowledgement Error:", err.response?.data || err);
    showAlert(
      err.response?.data?.message || "Failed to save acknowledgement.",
      "Error"
    );
  }
};

  const handleFileClick = (file) => {
    if (file.acknowledgement_required) {
      setPendingFile(file);
      setShowAcknowledgement(true);
      return;
    }
    setSelectedFile(file);
  };

  return (
    <div className="employee-policy-page">
      <div className="policy-grid">
        {/* Left – Policies */}
        <div className="policy-section">
          <div className="section-title">Employee Policies</div>

          <div className="policy-cards">
            {policies.map((policy) => (
              <div
                key={policy.policy_id}
                className={`policy-card ${
                  selectedPolicy?.policy_id === policy.policy_id
                    ? "active-card"
                    : ""
                }`}
                onClick={() => handlePolicy(policy)}
              >
                {getPolicyIcon(policy.policy_name)}
                <span className="policy-name">{policy.policy_name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle – Files */}
        {/* Middle – Files */}
<div className="file-section">
  <div className="section-title">Files</div>

  {selectedPolicy &&
  (selectedPolicy.allow_view === 1 || selectedPolicy.allow_download === 1) ? (
    selectedPolicy.files?.map((file) => (
      <div
        key={file.id}
        className={`file-card ${
          selectedFile?.id === file.id ? "active-file" : ""
        }`}
      >
        {/* Clickable area – only when view is allowed */}
        <div
          className="file-card-main"
          onClick={() => {
            if (selectedPolicy.allow_view === 1) {
              handleFileClick(file);
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flex: 1,
            cursor: selectedPolicy.allow_view === 1 ? "pointer" : "default",
            opacity: selectedPolicy.allow_view === 1 ? 1 : 0.75,
          }}
        >
          {getFileIcon(file)}
          <span>{file.file_name}</span>
        </div>

        {/* Download button – only when download is allowed */}
      {selectedPolicy.allow_download === 1 && (
  <button
    className="download-btn"
    onClick={(e) => {
      e.stopPropagation();
      handleDownload(file);
    }}
    title="Download file"
  >
    <FaDownload style={{ marginRight: 6 }} />
  </button>
)}

        {selectedPolicy.allow_view === 1 && (
          <FaChevronRight className="arrow" />
        )}
      </div>
    ))
  ) : (
    <p style={{ padding: 16, color: "#64748b", fontSize: 14 }}>
      No files available for this policy.
    </p>
  )}
</div>

        {/* Right – Viewer */}
        <div className="viewer-section">
          <div className="viewer-header">
            {selectedFile?.file_name || "No File Selected"}
          </div>

          <div className="viewer-body">
            {loadingFile ? (
              <p>Loading...</p>
            ) : fileUrl && selectedFile ? (
              (() => {
                const name = getFileName(selectedFile);

                if (isImage(name)) {
                  return (
                    <img
                      src={fileUrl}
                      alt={name}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  );
                }

                if (isPdf(name)) {
                  return (
                    <iframe
                      src={fileUrl}
                      title="Policy PDF"
                      width="100%"
                      height="100%"
                      style={{ border: "none" }}
                    />
                  );
                }

                if (isVideo(name)) {
                  return (
                    <video
                      src={fileUrl}
                      controls
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    >
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
          </div>
        </div>
      </div>

     {/* Policy Acknowledgement Modal */}
<Modal
  isVisible={showAcknowledgement}
  onClose={() => {
    setShowAcknowledgement(false);
    setPendingFile(null);
  }}
  title="Policy Acknowledgement"
  id="policy-ack-modal"
  buttons={[
    {
      label: "Yes, I have read all the rules",
      className: "ac-modal-btn ac-modal-btn-primary",
      onClick: handleAcknowledgement,
    },
    {
      label: "Cancel",
      className: "ac-modal-btn ac-modal-btn-secondary",
      onClick: () => {
        setShowAcknowledgement(false);
        setPendingFile(null);
      },
    },
  ]}
>
  <p>
    {pendingFile?.acknowledgement_message ||
      "Please read and acknowledge this policy."}
  </p>
</Modal>

{/* Success Modal (after acknowledgement is saved) */}
{/* Policy Acknowledgement Modal */}
<Modal
  isVisible={showAcknowledgement}
  onClose={() => {
    setShowAcknowledgement(false);
    setPendingFile(null);
  }}
  title="Policy Acknowledgement"
  id="policy-ack-modal"
  buttons={[
    {
      label: "Yes, I have read all the rules",
      className: "ac-modal-btn ac-modal-btn-primary",
      onClick: handleAcknowledgement,
    },
    {
      label: "Cancel",
      className: "ac-modal-btn ac-modal-btn-secondary",
      onClick: () => {
        setShowAcknowledgement(false);
        setPendingFile(null);
      },
    },
  ]}
>
  <p>
    {pendingFile?.acknowledgement_message ||
      "Please read and acknowledge this policy."}
  </p>
</Modal>

{/* Success / Error alert – same as Assets */}
<Modal
  isVisible={alertModal.isVisible}
  onClose={closeAlert}
  title={alertModal.title || undefined}
  buttons={[{ label: "OK", onClick: closeAlert }]}
>
  <p>{alertModal.message}</p>
</Modal>
    </div>
    
  );
}