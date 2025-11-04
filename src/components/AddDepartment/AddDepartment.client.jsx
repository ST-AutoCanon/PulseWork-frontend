"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider.client";
import "./AddDepartment.css";
import { IoMdAddCircleOutline } from "react-icons/io";
import { MdOutlineCancel } from "react-icons/md";
import Modal from "../Modal/Modal.client";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const AddDepartment = () => {
  const { user } = useAuth();
  const orgId = user?.orgId ?? user?.raw?.org_id;
  const employeeId = user?.employeeId;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(null);
  const [message, setMessage] = useState("");
  const [departments, setDepartments] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const fetchDepartments = async () => {
    if (!orgId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/departments?orgId=${orgId}`,
        {
          method: "GET",
          headers: {
            "x-api-key": API_KEY,
            "x-org-id": orgId,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        const departmentsWithImages = await Promise.all(
          result.departments.map(async (dept) => {
            if (dept.icon) {
              try {
                const imgResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}${dept.icon}`,
                  {
                    headers: {
                      "x-api-key": API_KEY,
                      "x-org-id": orgId,
                      "x-employee-id": employeeId,
                    },
                  }
                );

                if (imgResponse.ok) {
                  const blob = await imgResponse.blob();
                  dept.iconUrl = URL.createObjectURL(blob);
                } else {
                  dept.iconUrl = "/images/default-icon.png";
                }
              } catch (error) {
                console.error("Error fetching image:", error);
                dept.iconUrl = "/images/default-icon.png";
              }
            }
            return dept;
          })
        );

        setDepartments(departmentsWithImages);
      } else {
        setMessage(result.message || "Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setMessage("An error occurred");
    }
  };

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

  useEffect(() => {
    fetchDepartments();
  }, [orgId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      setMessage("Department name is required");
      return;
    }
    if (!icon) {
      setMessage("Please upload an icon");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("icon", icon);
    formData.append("orgId", orgId); // send orgId to backend

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/departments/add`,
        {
          method: "POST",
          headers: {
            "x-api-key": API_KEY,
            "x-org-id": orgId,
          },
          body: formData,
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMessage("");
        setName("");
        setIcon(null);
        setShowPopup(false);
        fetchDepartments();
        showAlert(result.message || "Department added successfully!");
      } else {
        setMessage(result.message || "Failed to add department");
      }
    } catch (error) {
      console.error("Error adding department:", error);
      setMessage(error.message || "An error occurred");
    }
  };

  return (
    <div className="department-container">
      <div className="dp-header">
        <h2>Add Department</h2>
        <button className="add-dp" onClick={() => setShowPopup(true)}>
          <i className="add-icon">+</i> <span>Add Department</span>
        </button>
      </div>

      <div className="department-section">
        <div className="department-list">
          {departments.length > 0 ? (
            departments.map((dept) => (
              <div key={dept.id} className="department-card">
                <img
                  src={dept.iconUrl || "/images/default-icon.png"}
                  alt={dept.name}
                  className="department-icon"
                />
                <div className="dp-name">{dept.name}</div>
              </div>
            ))
          ) : (
            <p>No departments found</p>
          )}

          <div className="add-new" onClick={() => setShowPopup(true)}>
            <div className="addDp-name">
              <IoMdAddCircleOutline className="dp-icon" /> Add new <br />
              Department
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h3>Add New Department</h3>
              <MdOutlineCancel
                className="close-popup"
                onClick={() => setShowPopup(false)}
              />
            </div>
            {message && <p className="dp-error-message">{message}</p>}
            <form
              className="dp-form"
              onSubmit={handleSubmit}
              encType="multipart/form-data"
            >
              <div className="input-group">
                <label className="ad-label">Department Name</label>
                <input
                  type="text"
                  placeholder="Enter Department Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="name-input"
                />
              </div>
              <div className="input-group">
                <div className="file-upload">
                  <label className="ad-label">Upload Icon</label>
                  <div className="file-input-container">
                    <input
                      type="text"
                      value={icon ? icon.name : ""}
                      placeholder="Select Icon"
                      readOnly
                      className="file-name-input"
                    />
                    <label htmlFor="fileInput" className="custom-file-button">
                      Upload Icon
                    </label>
                    <input
                      type="file"
                      id="fileInput"
                      accept="image/*"
                      onChange={(e) => setIcon(e.target.files[0])}
                      style={{ display: "none" }}
                    />
                  </div>
                  <span className="size">Note: Icon Size should be 32×32</span>
                </div>
                <button
                  type="button"
                  className="dp-cancel"
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
                </button>
                <button className="add-button" type="submit">
                  Submit
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
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default AddDepartment;
