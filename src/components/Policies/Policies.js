// "use client";

// import React from "react";
// import "./Policies.css";
// import {
//   MdLocalTaxi,
//   MdHotel,
//   MdRestaurant,
//   MdLaptopMac,
//   MdMedicalServices,
//   MdFlight,
// } from "react-icons/md";

// const policies = [
//   {
//     title: "Travel Reimbursement",
//     icon: <MdFlight />,
//     description:
//       "Employees can claim travel expenses for official business trips with valid bills and approvals.",
//   },
//   {
//     title: "Food & Meals",
//     icon: <MdRestaurant />,
//     description:
//       "Meal expenses during client meetings or official travel are eligible for reimbursement.",
//   },
//   {
//     title: "Cab & Transportation",
//     icon: <MdLocalTaxi />,
//     description:
//       "Cab charges for office work, late-night shifts, or client visits can be reimbursed.",
//   },
//   {
//     title: "Accommodation",
//     icon: <MdHotel />,
//     description:
//       "Hotel expenses during approved business travel will be reimbursed as per company policy.",
//   },
//   {
//     title: "Medical Reimbursement",
//     icon: <MdMedicalServices />,
//     description:
//       "Employees can submit medical bills for reimbursement according to annual limits.",
//   },
//   {
//     title: "Work Equipment",
//     icon: <MdLaptopMac />,
//     description:
//       "Official work-related equipment purchases require manager approval for reimbursement.",
//   },
// ];

// const Policies = () => {
//   return (
//     <div className="policies-container">
//       <div className="policies-header">
//         <h2>Company Policies</h2>
//         <p>Reimbursement and employee benefit policies</p>
//       </div>

//       <div className="policies-grid">
//         {policies.map((policy, index) => (
//           <div className="policy-card" key={index}>
//             <div className="policy-icon">{policy.icon}</div>

//             <h3>{policy.title}</h3>

//             <p>{policy.description}</p>

//             <button className="policy-btn">
//               View Policy
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Policies;


import React, { useEffect, useState } from "react";
import axios from "axios";
import "./createPolicies.css";

const Policies = () => {
  const [showForm, setShowForm] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [editingPolicyId, setEditingPolicyId] = useState(null);

  const [formData, setFormData] = useState({
  policyName: "",

  document: null,
  ppt: null,
  video: null,

  documentAcknowledgement: false,
  pptAcknowledgement: false,
  videoAcknowledgement: false,

  // NEW: Acknowledgement Messages
  documentAcknowledgementMessage: "",
  pptAcknowledgementMessage: "",
  videoAcknowledgementMessage: "",

  allowView: true,
  allowDownload: false,
});

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/policies/list",
        {
          headers: {
            "x-org-id": localStorage.getItem("org_id"),
          },
        }
      );

      setPolicies(response.data.data || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;

    setFormData({
      ...formData,
      [name]: files[0],
    });
  };

  const resetForm = () => {
  setFormData({
    policyName: "",

    document: null,
    ppt: null,
    video: null,

    documentAcknowledgement: false,
    pptAcknowledgement: false,
    videoAcknowledgement: false,

    // NEW
    documentAcknowledgementMessage: "",
    pptAcknowledgementMessage: "",
    videoAcknowledgementMessage: "",

    allowView: true,
    allowDownload: false,
  });

  setEditingPolicyId(null);
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
    

    const payload = new FormData();

payload.append("policy_name", formData.policyName);

payload.append("document_acknowledgement", formData.documentAcknowledgement);
payload.append("ppt_acknowledgement", formData.pptAcknowledgement);
payload.append("video_acknowledgement", formData.videoAcknowledgement);

// NEW: Send messages
payload.append("document_acknowledgement_message", formData.documentAcknowledgementMessage || "");
payload.append("ppt_acknowledgement_message", formData.pptAcknowledgementMessage || "");
payload.append("video_acknowledgement_message", formData.videoAcknowledgementMessage || "");

payload.append("allow_view", formData.allowView);
payload.append("allow_download", formData.allowDownload);


      if (formData.document) {
        payload.append("document", formData.document);
      }

      if (formData.ppt) {
        payload.append("ppt", formData.ppt);
      }

      if (formData.video) {
        payload.append("video", formData.video);
      }

      if (editingPolicyId) {
        await axios.put(
          `http://localhost:5001/api/policies/update/${editingPolicyId}`,
          payload,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "x-org-id": localStorage.getItem("org_id"),
            },
          }
        );

        alert("Policy Updated Successfully");
      } else {
        await axios.post(
          "http://localhost:5001/api/policies/create",
          payload,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "x-org-id": localStorage.getItem("org_id"),
            },
          }
        );

        alert("Policy Created Successfully");
      }

      fetchPolicies();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving policy:", error);
      alert("Failed to save policy");
    }
  };

 const handleEdit = (policy) => {
  setShowForm(true);
  setEditingPolicyId(policy.id);

  setFormData({
    policyName: policy.policy_name || "",

    document: null,
    ppt: null,
    video: null,

    documentAcknowledgement:
      policy.document_acknowledgement === 1 || policy.document_acknowledgement === true,

    pptAcknowledgement:
      policy.ppt_acknowledgement === 1 || policy.ppt_acknowledgement === true,

    videoAcknowledgement:
      policy.video_acknowledgement === 1 || policy.video_acknowledgement === true,

    // NEW: Load messages from backend
    documentAcknowledgementMessage: policy.document_acknowledgement_message || "",
    pptAcknowledgementMessage: policy.ppt_acknowledgement_message || "",
    videoAcknowledgementMessage: policy.video_acknowledgement_message || "",

    allowView: policy.allow_view === 1 || policy.allow_view === true,
    allowDownload: policy.allow_download === 1 || policy.allow_download === true,
  });
};
  return (
    <div className="create-policy-container">
      <div className="policy-header">
        <h2>Policies</h2>

        {!showForm && (
          <button
            className="create-policy-btn"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Create Policy
          </button>
        )}
      </div>

      {/* POLICY LIST */}

      <div className="policy-list-grid">
        {policies.map((policy) => (
          <div className="policy-list-card" key={policy.id}>
            <div className="policy-card-top">
              <h3>{policy.policy_name}</h3>

              <button
                className="edit-policy-btn"
                onClick={() => handleEdit(policy)}
              >
                Edit
              </button>
            </div>

            <div className="policy-files-section">
              {policy.document_path && (
                <a
                  href={`http://localhost:5001${policy.document_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="policy-file-link"
                >
                  View Document
                </a>
              )}

              {policy.ppt_path && (
                <a
                  href={`http://localhost:5001${policy.ppt_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="policy-file-link"
                >
                  View PPT
                </a>
              )}

              {policy.video_path && (
                <a
                  href={`http://localhost:5001${policy.video_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="policy-file-link"
                >
                  View Video
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT FORM */}

      {showForm && (
        <div className="policy-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group medium-field">
              <label>Policy Name</label>

              <input
                type="text"
                name="policyName"
                placeholder="Enter Policy Name"
                value={formData.policyName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="upload-section">
              <h3>Upload Policy Files</h3>

              <div className="upload-grid">
                {/* DOCUMENT */}

                <div className="upload-box">
  <label className="upload-title">Policy PPT Upload</label>

  <input
    type="file"
    name="ppt"
    accept=".ppt,.pptx"
    onChange={handleFileChange}
  />

  <label className="checkbox-item upload-checkbox">
    <input
      type="checkbox"
      name="pptAcknowledgement"
      checked={formData.pptAcknowledgement}
      onChange={handleChange}
    />
    <span>Require Acknowledgement For PPT</span>
  </label>

  {/* NEW */}
  {formData.pptAcknowledgement && (
    <div className="message-input">
      <label>Enter acknowledgement message for this PPT</label>
      <textarea
        name="pptAcknowledgementMessage"
        placeholder="Users must agree to this before accessing the PPT..."
        value={formData.pptAcknowledgementMessage}
        onChange={handleChange}
        rows={3}
      />
    </div>
  )}
</div>

                {/* PPT */}

               <div className="upload-box">
  <label className="upload-title">Policy Video Upload</label>

  <input
    type="file"
    name="video"
    accept="video/*"
    onChange={handleFileChange}
  />

  <label className="checkbox-item upload-checkbox">
    <input
      type="checkbox"
      name="videoAcknowledgement"
      checked={formData.videoAcknowledgement}
      onChange={handleChange}
    />
    <span>Require Acknowledgement For Video</span>
  </label>

  {/* NEW */}
  {formData.videoAcknowledgement && (
    <div className="message-input">
      <label>Enter acknowledgement message for this video</label>
      <textarea
        name="videoAcknowledgementMessage"
        placeholder="Users must agree to this before watching the video..."
        value={formData.videoAcknowledgementMessage}
        onChange={handleChange}
        rows={3}
      />
    </div>
  )}
</div>

                {/* VIDEO */}

                <div className="upload-box">
                  <label className="upload-title">Policy Video Upload</label>

                  <input
                    type="file"
                    name="video"
                    accept="video/*"
                    onChange={handleFileChange}
                  />

                  <label className="checkbox-item upload-checkbox">
                    <input
                      type="checkbox"
                      name="videoAcknowledgement"
                      checked={formData.videoAcknowledgement}
                      onChange={handleChange}
                    />

                    <span>Require Acknowledgement For Video</span>
                  </label>
                </div>
              </div>
            </div>

            {/* PERMISSIONS */}

            <div className="permissions-section">
              <h3>Permissions</h3>

              <div className="checkbox-grid">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    name="allowView"
                    checked={formData.allowView}
                    onChange={handleChange}
                  />

                  <span>Allow View</span>
                </label>

                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    name="allowDownload"
                    checked={formData.allowDownload}
                    onChange={handleChange}
                  />

                  <span>Allow Download</span>
                </label>
              </div>
            </div>

            {/* BUTTONS */}

            <div className="button-group">
              <button type="submit" className="submit-btn">
                {editingPolicyId ? "Update Policy" : "Save Policy"}
              </button>

              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
const ViewPolicyModal = (props) => {
  return (
    <div className="policy-modal">
      <div className="policy-modal-content">
        <h2>View Policy</h2>

        <button onClick={() => props.setViewPolicy(null)}>
          Close
        </button>
      </div>
    </div>
  );
};
export default Policies;
