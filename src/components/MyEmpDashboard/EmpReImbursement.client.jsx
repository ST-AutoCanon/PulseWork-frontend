"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";
import { useAuth } from "../../context/AuthProvider.client";
import "./EmpReImbursement.css";

ChartJS.register(ArcElement, Tooltip, Legend, Colors);

export default function EmpReImbursement() {
  const { user } = useAuth();
  const meId = user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || null;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const [currentMonthData, setCurrentMonthData] = useState(null);
  const [previousMonthData, setPreviousMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("current");

  useEffect(() => {
    if (!meId) {
      setLoading(false);
      setError("User not authenticated");
      return;
    }

    let cancelled = false;
    const fetchReimbursementData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = `${BACKEND_URL}/reimbursement/stats/${encodeURIComponent(
          meId
        )}`;

        const headers = {
          "x-api-key": API_KEY,
        };
        if (meId) headers["x-employee-id"] = meId;
        if (user?.orgId) headers["x-org-id"] = user.orgId;

        const response = await axios.get(apiUrl, {
          withCredentials: true,
          headers,
        });

        if (cancelled) return;

        if (response.status === 200 && response.data) {
          const data = response.data;

          const formatData = (dataset) => {
            if (!dataset || !Array.isArray(dataset.labels)) return null;
            return {
              labels: dataset.labels,
              datasets: [
                {
                  data: dataset.data.map((v) => Number(v) || 0),
                  backgroundColor: dataset.backgroundColor || [
                    "#82DAFE",
                    "#004DC6",
                    "#E8E9EA",
                  ],
                  hoverBackgroundColor: dataset.hoverBackgroundColor || [
                    "#82DAFE",
                    "#004DC6",
                    "#E8E9EA",
                  ],
                },
              ],
            };
          };

          setCurrentMonthData(formatData(data.currentMonth));
          setPreviousMonthData(formatData(data.previousMonth));
        } else {
          setCurrentMonthData(null);
          setPreviousMonthData(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err.message ||
              "Failed to load data."
          );
          setCurrentMonthData(null);
          setPreviousMonthData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReimbursementData();

    return () => {
      cancelled = true;
    };
  }, [meId, BACKEND_URL, API_KEY, user?.orgId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  if (!currentMonthData || !previousMonthData) {
    return <p>No reimbursement records available.</p>;
  }

  const CustomLegend = ({ chartData }) => {
    if (!chartData || !chartData.labels) return null;
    return (
      <div className="custom-legend">
        {chartData.labels.map((label, index) => (
          <div key={index} className="legend-item">
            <span
              className="legend-color"
              style={{
                backgroundColor:
                  chartData.datasets?.[0]?.backgroundColor?.[index] || "#ccc",
              }}
            />
            <span className="legend-label">{label}</span>
          </div>
        ))}
      </div>
    );
  };

  const chartData =
    activeTab === "previous" ? previousMonthData : currentMonthData;

  return (
    <div className="emp-reimbursement">
      <h3>Reimbursement Status</h3>
      <p>
        {new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>
      <div className="reimbursement-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "current"}
          className={`tab-item ${activeTab === "current" ? "active" : ""}`}
          onClick={() => setActiveTab("current")}
        >
          Current Month
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "previous"}
          className={`tab-item ${activeTab === "previous" ? "active" : ""}`}
          onClick={() => setActiveTab("previous")}
        >
          Prev Month
        </button>
      </div>
      <div className="chart-container-reimbursement" style={{ height: 260 }}>
        <Pie
          data={chartData}
          options={{
            plugins: { legend: { display: false } },
            responsive: true,
            maintainAspectRatio: false,
          }}
        />
      </div>
    </div>
  );
}
