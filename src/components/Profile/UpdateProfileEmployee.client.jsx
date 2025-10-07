"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import EmployeeFormEmployee from "./EmployeeFormEmployee.client";
import "./Profile.css";
import { MdOutlineCancel } from "react-icons/md";
import { useAuth } from "../../context/AuthProvider.client"; // adjust if needed

export default function UpdateProfileEmployee({
  profile,
  isVisible,
  onClose,
  onSaved,
  departments = [],
  employeeId: propEmployeeId,
}) {
  const { user } = useAuth(); // should provide user.employeeId and user.orgId
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // prefer explicit propEmployeeId, then authenticated user, then profile fallback
  const employeeId =
    propEmployeeId || user?.employeeId || profile?.employee_id || null;
  const orgId = user?.orgId || profile?.org_id || null;

  const [alert, setAlert] = useState({ isVisible: false, message: "" });
  const showAlert = (msg) => setAlert({ isVisible: true, message: msg });
  const closeAlert = () => setAlert({ isVisible: false, message: "" });

  // prevent body scroll when modal is open
  useEffect(() => {
    if (!isVisible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const handleSubmit = async (formData) => {
    try {
      const res = await axios.put(`${BASE_URL}/full/${employeeId}`, formData, {
        headers: {
          "x-api-key": API_KEY ?? "",
          "x-employee-id": employeeId ?? "",
          "x-org-id": orgId ?? "", // ✅ added organization ID here
        },
      });

      const updated = res.data?.data || null;

      if (onSaved) await onSaved(updated);
      return updated;
    } catch (err) {
      console.error("UpdateProfileEmployee submit error:", err);
      showAlert("Failed to update profile. Try again.");
      throw err;
    }
  };

  return (
    <div className="emp-form-overlay">
      <div className="emp-form-modal">
        <div className="employee-form">
          <div className="emp-form-title">
            <h3>
              Update Profile — {profile?.first_name || ""}{" "}
              {profile?.last_name || ""}
            </h3>
            <MdOutlineCancel
              className="emp-form-close-icon"
              onClick={onClose}
            />
          </div>

          {alert.isVisible && (
            <div style={{ padding: "0 5%", marginTop: 12 }}>
              <div className="error">{alert.message}</div>
            </div>
          )}

          <div>
            <EmployeeFormEmployee
              initialData={profile || {}}
              employeeId={
                propEmployeeId ||
                user?.employeeId ||
                profile?.employee_id ||
                null
              }
              onSubmit={handleSubmit}
              onCancel={onClose}
              departments={departments}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
