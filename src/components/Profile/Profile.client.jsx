"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdOutlineCancel } from "react-icons/md";
import "./Profile.css";
import Modal from "../Modal/Modal.client";
import UpdateProfile from "./UpdateProfileEmployee.client";
import { useAuth } from "../../context/AuthProvider.client";

const TABS = ["Personal Info", "Professional Info"];

const Profile = ({ onClose, notificationId = null }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState("");
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    message: "",
    missingFields: [],
  });
  const [activeTab, setActiveTab] = useState(0);

  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const REQUIRED_FIELDS = {
    personal: [
      { key: "first_name", label: "First name" },
      { key: "last_name", label: "Last name" },
      { key: "phone_number", label: "Mobile" },
      { key: "email", label: "Email" },
      { key: "dob", label: "Date of birth" },
      { key: "gender", label: "Gender" },
      { key: "emergency_name", label: "Emergency Contact Name" },
      { key: "emergency_number", label: "Emergency Contact Number" },
    ],
    government_docs: [
      { key: "aadhaar_number", label: "Aadhaar Number" },
      { key: "aadhaar_doc_url", label: "Aadhaar Copy" },
      { key: "pan_number", label: "Pan Number" },
      { key: "pan_doc_url", label: "Pan Copy" },
    ],
    education: [
      { key: "tenth_institution", label: "SSLC(10th) Institution" },
      { key: "tenth_year", label: "SSLC(10th) Year" },
      { key: "tenth_board", label: "SSLC(10th) Board" },
      { key: "tenth_score", label: "SSLC(10th) Score (%)" },
      { key: "tenth_cert_url", label: "SSLC(10th) Certificate" },
      { key: "twelfth_institution", label: "12th/Diploma Institution" },
      { key: "twelfth_year", label: "12th/Diploma Year" },
      { key: "twelfth_board", label: "12th/Diploma Board" },
      { key: "twelfth_score", label: "12th/Diploma Score (%)" },
      { key: "twelfth_cert_url", label: "12th/Diploma Certificate" },
    ],
    professional: [{ key: "resume_url", label: "Resume Upload" }],
    bank_details: [
      { key: "bank_name", label: "Bank Name" },
      { key: "account_number", label: "Account Number" },
      { key: "ifsc_code", label: "IFSC Code" },
      { key: "branch_name", label: "Branch" },
    ],
    family_details: [{ key: "marital_status", label: "Marital Status" }],
  };

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const employeeId = user?.employeeId ?? null;

  const normalizeInputUrl = (maybe) => {
    if (maybe === undefined || maybe === null) return null;

    if (typeof maybe === "string") {
      return maybe;
    }

    if (Array.isArray(maybe)) {
      if (maybe.length === 0) return null;
      return normalizeInputUrl(maybe[0]);
    }

    if (typeof maybe === "object") {
      if (typeof maybe.url === "string" && maybe.url) return maybe.url;
      if (typeof maybe.path === "string" && maybe.path) return maybe.path;
      if (typeof maybe.file === "string" && maybe.file) return maybe.file;
      if (Object.keys(maybe).length === 0) return null;
      for (const k of ["link", "href", "download"]) {
        if (typeof maybe[k] === "string" && maybe[k]) return maybe[k];
      }
      return null;
    }
    try {
      return String(maybe);
    } catch {
      return null;
    }
  };

  const isMissing = (val) => {
    if (val === undefined || val === null) return true;
    if (typeof val === "string" && val.trim() === "") return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (typeof val === "object" && !Array.isArray(val)) {
      if (Object.keys(val).length === 0) return true;
    }
    return false;
  };

  const hasValue = (maybe) => {
    const norm = normalizeInputUrl(maybe);
    if (norm === null || norm === undefined) return false;
    if (typeof norm === "string" && norm.trim() === "") return false;
    return true;
  };

  const getSafeFilename = (maybeUrl) => {
    const u = normalizeInputUrl(maybeUrl);
    if (!u) return "document";

    try {
      if (u.startsWith("http://") || u.startsWith("https://")) {
        try {
          const pathname = new URL(u).pathname || "";
          return decodeURIComponent(pathname.split("/").pop() || "document");
        } catch (e) {}
      }
      const last = u.split("/").pop() || "document";
      return decodeURIComponent(last.replace(/[?#].*$/, ""));
    } catch (e) {
      return "document";
    }
  };

  const buildFetchUrl = (maybeUrl) => {
    const u = normalizeInputUrl(maybeUrl);
    if (!u) return null;

    if (u.startsWith("http://") || u.startsWith("https://")) return u;

    if (u.startsWith("/docs")) {
      return `${BASE_URL}${u}`;
    }

    const path = u.startsWith("/") ? u : `/${u}`;
    return `${BASE_URL}/docs${path}`;
  };

  const fetchBlob = async (url) => {
    const fetchUrl = buildFetchUrl(url);
    if (!fetchUrl) throw new Error("Invalid URL for fetchBlob");
    const res = await axios.get(fetchUrl, {
      headers: {
        "x-api-key": API_KEY ?? "",
        ...(employeeId ? { "x-employee-id": employeeId } : {}),
      },
      responseType: "blob",
    });
    return new Blob([res.data], { type: res.headers["content-type"] });
  };

  const getMissingFields = (p = {}) => {
    if (!p) return [...REQUIRED_FIELDS.personal.map((f) => f.label)];
    const missing = [];

    const all = [
      ...REQUIRED_FIELDS.personal,
      ...REQUIRED_FIELDS.government_docs,
      ...REQUIRED_FIELDS.education,
      ...REQUIRED_FIELDS.professional,
      ...REQUIRED_FIELDS.bank_details,
      ...REQUIRED_FIELDS.family_details,
    ];

    all.forEach((f) => {
      const v = p[f.key];
      if (isMissing(v)) {
        missing.push(f.label);
      }
    });

    return missing;
  };

  const viewDoc = async (maybeUrl) => {
    const raw = normalizeInputUrl(maybeUrl);
    if (!raw) return showAlert("No document URL");

    try {
      const fetchUrl = buildFetchUrl(maybeUrl);
      if (!fetchUrl) return showAlert("Invalid document URL");

      const resp = await axios.get(fetchUrl, {
        responseType: "arraybuffer",
        headers: {
          "x-api-key": API_KEY ?? "",
          ...(employeeId ? { "x-employee-id": employeeId } : {}),
        },
      });

      const contentType =
        resp.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([resp.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      console.error("viewDoc error:", err, { maybeUrl });
      showAlert("Failed to view document");
    }
  };

  const downloadDoc = async (maybeUrl) => {
    const raw = normalizeInputUrl(maybeUrl);
    if (!raw) return showAlert("No document URL");

    try {
      const fetchUrl = buildFetchUrl(maybeUrl);
      if (!fetchUrl) return showAlert("Invalid document URL");

      const resp = await axios.get(fetchUrl, {
        responseType: "arraybuffer",
        headers: {
          "x-api-key": API_KEY ?? "",
          ...(employeeId ? { "x-employee-id": employeeId } : {}),
        },
      });

      const contentType =
        resp.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([resp.data], { type: contentType });
      const objectUrl = URL.createObjectURL(blob);

      const filename = getSafeFilename(maybeUrl);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);

      a.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );

      a.remove();
      setTimeout(() => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch (e) {}
      }, 60_000);
    } catch (err) {
      console.error("downloadDoc error:", err, { maybeUrl });
      showAlert("Failed to download document");
    }
  };

  const getDefaultAvatar = (gender) =>
    gender === "Female"
      ? "/images/female-avatar.jpeg"
      : "/images/male-avatar.jpeg";

  const markNotificationReadById = async (id) => {
    if (!id) return;
    try {
      await axios.put(
        `${BASE_URL}/api/notifications/${id}/read`,
        {},
        {
          headers: {
            "x-api-key": API_KEY ?? "",
            ...(employeeId ? { "x-employee-id": employeeId } : {}),
          },
        }
      );

      try {
        window.dispatchEvent(
          new CustomEvent("notification-read", { detail: { id } })
        );
      } catch (e) {
        console.warn("notification-read event dispatch failed", e);
      }
    } catch (err) {
      console.error("Error marking profile notification read:", err);
    }
  };

  const showAlert = (message, missingFields = []) =>
    setAlertModal({ isVisible: true, message, missingFields });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, message: "", missingFields: [] });

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const r = await axios.get(`${BASE_URL}/full/${employeeId}`, {
          headers: {
            "x-api-key": API_KEY ?? "",
            "Content-Type": "application/json",
            ...(employeeId ? { "x-employee-id": employeeId } : {}),
          },
        });
        const data = r.data.data;
        setProfile(data);

        const missing = getMissingFields(data);
        if (missing.length > 0) {
          setAlertModal({
            isVisible: true,
            message: "Your profile is missing required fields:",
            missingFields: missing,
          });
        }

        if (notificationId && missing.length > 0) {
          setShowUpdateModal(true);
        }

        if (hasValue(data.photo_url)) {
          try {
            const blob = await fetchBlob(data.photo_url);
            setAvatar(URL.createObjectURL(blob));
          } catch {
            setAvatar(getDefaultAvatar(data.gender));
          }
        } else {
          setAvatar(getDefaultAvatar(data.gender));
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        showAlert("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    const fetchAssets = async () => {
      try {
        const r = await axios.get(
          `${BASE_URL}/assets/assigned-assets/${employeeId}`,
          {
            headers: {
              "x-api-key": API_KEY ?? "",
              ...(employeeId ? { "x-employee-id": employeeId } : {}),
            },
          }
        );
        setAssignedAssets(r.data.data || []);
      } catch (err) {
        console.error("Failed to load assets:", err);
        showAlert("Failed to load assets");
      }
    };

    fetchProfile();
    fetchAssets();
  }, [employeeId, notificationId]);

  const handleProfileSaved = async (updatedProfile) => {
    if (updatedProfile && typeof updatedProfile === "object") {
      setProfile(updatedProfile);
    }

    if (notificationId) {
      try {
        await markNotificationReadById(notificationId);
      } catch (err) {
        console.error(
          "Failed to mark notification read after saving profile:",
          err
        );
      }
    }

    setShowUpdateModal(false);
    setAlertModal({
      isVisible: true,
      message: "Profile updated successfully.",
      missingFields: [],
    });
  };

  if (loading) return <div className="profile-popup">Loading...</div>;
  if (!profile) return <div className="profile-popup">No data.</div>;

  return (
    <div className="profile-popup">
      <div className="profile-content">
        <div className="profile-header">
          <img src={avatar} alt="profile-photo" className="profile-photo" />
          <div className="profile-name">
            <h3>{`${profile.first_name || ""} ${profile.last_name || ""}`}</h3>
            <p className="info-secondary">
              {profile.position} - {profile.department}
            </p>
            <p className="info-secondary">ID: {profile.employee_id}</p>
          </div>
          <MdOutlineCancel className="profile-close" onClick={onClose} />
        </div>

        <div className="tabs">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === i ? "active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 0 ? (
          <div className="tab-panel personal-grid">
            <div className="update-profile-btn-wrapper">
              <button
                className="update-profile-btn"
                onClick={() => setShowUpdateModal(true)}
              >
                Update Profile
              </button>
            </div>

            <div className="field-pair">
              <div className="field-row">
                <span className="field-label">Mobile</span>
                <span className="field-value">{profile.phone_number}</span>
              </div>
              <div className="field-row">
                <span className="field-label">DOB</span>
                <span className="field-value">
                  {profile.dob
                    ? new Date(profile.dob).toLocaleDateString()
                    : ""}
                </span>
              </div>
              <div className="field-row">
                <span className="field-label">Gender</span>
                <span className="field-value">{profile.gender}</span>
              </div>
              <div className="field-row">
                <span className="field-label">Marital Status</span>
                <span className="field-value">{profile.marital_status}</span>
              </div>

              {profile.marital_status === "Married" && (
                <>
                  <div className="field-row">
                    <span className="field-label">Spouse</span>
                    <span className="field-value">{profile.spouse_name}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Anniversary</span>
                    <span className="field-value">
                      {profile.marriage_date
                        ? new Date(profile.marriage_date).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </>
              )}

              <div className="field-row">
                <span className="field-label">Father's Name</span>
                <span className="field-value">{profile.father_name}</span>
              </div>
              <div className="field-row">
                <span className="field-label">Mother's Name</span>
                <span className="field-value">{profile.mother_name}</span>
              </div>
            </div>

            <div className="field-row full-width">
              <span className="field-label">Email</span>
              <span className="field-value">{profile.email}</span>
            </div>
            <div className="field-row full-width">
              <span className="field-label">Address</span>
              <span className="field-value">{profile.address}</span>
            </div>
          </div>
        ) : (
          <div className="tab-panel">
            <div className="sub-block">
              <div className="field-row">
                <span className="field-label">Assigned Supervisor</span>
                <span className="field-value">
                  {profile.supervisor_name || "not yet assigned"}
                </span>
              </div>
              <div className="field-row assets-row">
                <span className="field-label">Assigned Assets</span>
                <span className="field-value assets-list">
                  {assignedAssets.length > 0
                    ? assignedAssets.map((a) => a.asset_code).join(", ")
                    : "None"}
                </span>
              </div>
            </div>
            <div className="sub-block docs-block">
              <span className="documents">
                <strong>Documents</strong>
              </span>

              {[
                ["Aadhaar", profile.aadhaar_doc_url],
                ["PAN", profile.pan_doc_url],
                ["Insurance", profile.insurance_doc],
              ].map(([label, url]) => (
                <div className="field-row docs-row" key={label}>
                  <span className="field-label">{label}</span>

                  {hasValue(url) ? (
                    <span className="doc-actions">
                      <button onClick={() => viewDoc(url)}>View</button>
                      <button onClick={() => downloadDoc(url)}>Download</button>
                    </span>
                  ) : label === "Insurance" ? (
                    <span className="field-value">Not Available</span>
                  ) : label === "Aadhaar" || label === "PAN" ? (
                    <span className="field-value">Not Uploaded</span>
                  ) : (
                    <span className="field-value">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {alertModal.isVisible && (
        <Modal
          isVisible
          onClose={closeAlert}
          buttons={[{ label: "OK", onClick: closeAlert }]}
        >
          <div className="alert-modal-content">
            <p>{alertModal.message}</p>

            {alertModal.missingFields?.length > 0 && (
              <div className="missing-fields">
                {alertModal.missingFields.map((field) => (
                  <span key={field} className="missing-bubble">
                    {field}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {showUpdateModal && (
        <UpdateProfile
          profile={profile}
          isVisible={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onSaved={handleProfileSaved}
          employeeId={employeeId}
        />
      )}
    </div>
  );
};

export default Profile;
