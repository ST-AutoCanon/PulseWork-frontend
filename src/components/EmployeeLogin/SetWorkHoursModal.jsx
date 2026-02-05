

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";

export default function SetWorkHoursModal({ isOpen, onClose }) {
  const { user } = useAuth();

  const [hours, setHours] = useState("8"); // ← string to avoid NaN issues during typing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const dashboardData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("dashboardData") || "{}")
      : {};

  const headers = useMemo(
    () => ({
      "x-api-key": API_KEY,
      "x-employee-id": dashboardData.employeeId || user?.employeeId || "",
      "x-org-id": dashboardData.orgId || user?.orgId || "",
    }),
    [API_KEY, dashboardData, user]
  );

  // Fetch current work hours
 useEffect(() => {
  if (!isOpen || !BACKEND_URL) return;

  const fetchWorkHours = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${BACKEND_URL}/api/org/work-hours`, {
        headers,
        withCredentials: true,
      });

      const value = res.data?.data?.work_hours ?? res.data?.work_hours ?? 8;
      setHours(String(value));
    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Could not load current hours");
    } finally {
      setLoading(false);
    }
  };

  fetchWorkHours();
}, [isOpen]);   // ← ONLY THIS


  const handleSave = async () => {
    const num = Number(hours);
    if (isNaN(num) || num < 1 || num > 24) {
      setError("Please enter a number between 1 and 24");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await axios.post(
        `${BACKEND_URL}/api/org/work-hours`,
        { work_hours: num },
        { headers, withCredentials: true }
      );

      onClose();
    } catch (err) {
      console.error("Save failed:", err.response?.data || err.message);
      setError("Failed to save work hours");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0 }}>Set Work Hours</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        {error && <p style={{ color: "red", marginBottom: "16px", textAlign: "center" }}>{error}</p>}

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
            Hours per day (1–24)
          </label>
          <input
            type="text" // ← use text instead of number → prevents browser arrow spinners & native validation issues
            inputMode="numeric"
            pattern="[0-9]*"
            value={hours}
            onChange={(e) => {
              const val = e.target.value.trim();
              // Allow empty or only digits
              if (val === "" || /^\d+$/.test(val)) {
                setHours(val);
              }
              // Do NOT convert to number here → prevents loop
            }}
            onBlur={() => {
              // On blur: validate & clean up
              const num = Number(hours);
              if (isNaN(num) || num < 1 || num > 24) {
                setHours("8");
              } else {
                setHours(String(num));
              }
            }}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "10px 20px",
              border: "1px solid #d1d5db",
              background: "white",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading || !hours.trim() || Number(hours) < 1 || Number(hours) > 24}
            style={{
              padding: "10px 24px",
              backgroundColor: loading ? "#a5b4fc" : "#79c42b",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 500,
            }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}