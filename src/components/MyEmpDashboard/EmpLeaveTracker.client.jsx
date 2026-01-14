"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./EmpLeaveTracker.css";
import { useAuth } from "../../context/AuthProvider.client";

export default function EmpLeaveTracker() {
  const { user } = useAuth();
  const employeeIdFromUser =
    user?.employeeId ?? user?.employee_id ?? user?.id ?? null;

  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
    /\/$/,
    ""
  );

  function makeHeaders() {
    const headers = {};
    if (API_KEY) headers["x-api-key"] = API_KEY;
    if (employeeIdFromUser) headers["x-employee-id"] = employeeIdFromUser;

    const orgId = user?.orgId || user?.org_id || user?.organization_id;
    if (!orgId) {
      console.warn("orgId not found in user object!");
    } else {
      headers["x-org-id"] = orgId;
    }

    return headers;
  }

  useEffect(() => {
    let canceled = false;
    const fetchLeaveData = async () => {
      setLoading(true);
      setError(null);

      if (!employeeIdFromUser) {
        console.warn("EmpLeaveTracker: employeeId not available yet");
        setLoading(false);
        setLeaveData([]);
        return;
      }

      const apiUrl = `${BACKEND_URL}/leave-queries/${encodeURIComponent(
        employeeIdFromUser
      )}`;

      try {
        const response = await axios.get(apiUrl, {
          withCredentials: true,
          headers: makeHeaders(),
        });

        if (canceled) return;

        const payload = response?.data || {};
        const leaveQueries =
          Array.isArray(payload.leaveQueries) &&
          payload.leaveQueries.length >= 0
            ? payload.leaveQueries
            : Array.isArray(payload)
            ? payload
            : payload.data?.leaveQueries || payload.data || [];

        if (!Array.isArray(leaveQueries) || leaveQueries.length === 0) {
          setLeaveData([]);
        } else {
          const formattedData = leaveQueries.map((leave) => ({
            leaveType: leave["Leave Type"] ?? leave.leave_type ?? "N/A",
            startDate:
              leave["Start Date"] ??
              leave.start_date ??
              leave.startDate ??
              null,
            endDate:
              leave["End Date"] ?? leave.end_date ?? leave.endDate ?? null,
            halfOrFullDay:
              leave["Half/Full Day"] ?? leave.half_full_day ?? "N/A",
            reason: leave["Reason"] ?? leave.reason ?? "N/A",
            status: leave["Status"] ?? leave.status ?? "N/A",
            comments: leave["Comments"] ?? leave.comments ?? "",
          }));
          setLeaveData(formattedData);
        }
      } catch (err) {
        console.error("EmpLeaveTracker: error fetching leave data:", err);
        setError("Failed to load leave data. Please try again later.");
        setLeaveData([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchLeaveData();

    return () => {
      canceled = true;
    };
  }, [employeeIdFromUser, API_KEY, BACKEND_URL]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!Array.isArray(leaveData) || leaveData.length === 0)
    return <p>No leave records available.</p>;

  return (
    <div className="empleavetracker-container">
      <div className="empleavetracker-header"> Leave Tracker</div>
      <table className="empleavetracker-table">
        <thead>
          <tr>
            {[
              "Leave Type",
              "Start Date",
              "End Date",
              "Half/Full Day",
              "Reason",
              "Status",
              "Comments",
            ].map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leaveData.map((leave, index) => (
            <tr key={index}>
              <td>{leave.leaveType || "N/A"}</td>
              <td>{formatDate(leave.startDate)}</td>
              <td>{formatDate(leave.endDate)}</td>
              <td>{leave.halfOrFullDay || "N/A"}</td>
              <td className="reason-cell" title={leave.reason}>
                {leave.reason && leave.reason.length > 20
                  ? `${leave.reason.substring(0, 20)}...`
                  : leave.reason || "N/A"}
              </td>
              <td>
                <span
                  className={`empleavetracker-status-${(
                    leave.status || "default"
                  )
                    .toString()
                    .toLowerCase()}`}
                >
                  {leave.status || "N/A"}
                </span>
              </td>
              <td className="tooltip-cell" title={leave.comments}>
                {leave.comments && leave.comments.length > 20
                  ? `${leave.comments.substring(0, 20)}...`
                  : leave.comments || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
