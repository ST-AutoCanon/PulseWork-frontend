"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useAuth } from "../../context/AuthProvider.client"; // adjust this path to your auth provider
import "./MyDailyWorkHour.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

export default function MyDailyWorkHour() {
  const { user } = useAuth();
  const meId = user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.org_id ?? null;

  const [view, setView] = useState("Daily");
  const [workHourData, setWorkHourData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  // mounted guard to avoid setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!meId) {
      setLoading(false);
      setError("User not authenticated");
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const fetchWorkHourData = async () => {
      setLoading(true);
      setError(null);

      if (!API_KEY) {
        if (mountedRef.current && !cancelled) {
          setError("API Key is missing.");
          setLoading(false);
        }
        return;
      }

      try {
        const url = `${BACKEND_URL.replace(
          /\/$/,
          ""
        )}/api/work-hour-summary/${encodeURIComponent(meId)}`;

        const headers = { "x-api-key": API_KEY };
        if (meId) headers["x-employee-id"] = meId;
        if (orgId) headers["x-org-id"] = orgId;

        const res = await axios.get(url, {
          headers,
          signal: controller.signal,
        });

        if (cancelled || !mountedRef.current) return;

        // Expecting array like in original code — reduce to map keyed by view
        if (res.status === 200 && Array.isArray(res.data)) {
          const dataMap = res.data.reduce((acc, item) => {
            acc[item.view] = item.data;
            return acc;
          }, {});
          if (mountedRef.current && !cancelled) setWorkHourData(dataMap);
        } else if (res.status === 200 && typeof res.data === "object") {
          // if backend returns object structure directly
          const dataMap =
            Array.isArray(res.data) === false ? res.data : { Daily: res.data };
          if (mountedRef.current && !cancelled) setWorkHourData(dataMap);
        } else {
          if (mountedRef.current && !cancelled) {
            setWorkHourData(null);
            setError("No work-hour data available.");
          }
        }
      } catch (err) {
        if (axios.isCancel && axios.isCancel(err)) {
          return;
        }
        if (!cancelled && mountedRef.current) {
          console.error("Error fetching work hour data:", err);
          setError(
            err.response?.data?.message || err.message || "Failed to load data."
          );
          setWorkHourData(null);
        }
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    };

    fetchWorkHourData();

    // cleanup
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [meId, BACKEND_URL, API_KEY, orgId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!workHourData) return <p>No work-hour data available.</p>;

  const chartData = workHourData[view] || { labels: [], values: [] };

  const formatTime = (hours) => {
    if (hours === null || hours === undefined) return "--:--";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  const generateData = () => ({
    labels: chartData.labels || [],
    datasets: [
      {
        label: "Work Hours",
        data: (chartData.values || []).map((v) =>
          v !== null && v !== undefined ? v : 0
        ),
        backgroundColor: (chartData.values || []).map((value) =>
          value === null || value === undefined
            ? "#d3d3d3"
            : value >= 9
            ? "#0033cc"
            : "#99ccff"
        ),
        barThickness: view === "Daily" ? 30 : view === "Weekly" ? 40 : 10,
      },
    ],
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return formatTime(tooltipItem.raw);
          },
        },
      },
      datalabels: {
        color: "#fff",
        anchor: "end",
        align: "top",
        formatter: (value) => formatTime(value),
        font: { weight: "bold", size: 14 },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        max: view === "Weekly" ? 48 : 10,
        ticks: {
          callback: function (value) {
            return formatTime(value);
          },
          stepSize: view === "Weekly" ? 8 : 1,
        },
      },
    },
  };

  return (
    <div className="work-hour-container">
      <div className="work-hour-header">
        <h3>My daily work hours</h3>
        <div className="work-hour-view-options">
          {["Daily", "Weekly", "Monthly"].map((option) => (
            <button
              key={option}
              className={view === option ? "active" : ""}
              onClick={() => setView(option)}
            >
              {option === "Monthly" ? "Prev-Month" : option}
            </button>
          ))}
        </div>
        <div className="work-hour-legend">
          {view === "Weekly" ? (
            <>
              <span className="work-hour-legend-item">
                <span className="work-hour-box blue" /> 48+ hours
              </span>
              <span className="work-hour-legend-item">
                <span className="work-hour-box light-blue" /> Less than 48 hours
              </span>
            </>
          ) : (
            <>
              <span className="work-hour-legend-item">
                <span className="work-hour-box blue" /> 9+ hours
              </span>
              <span className="work-hour-legend-item">
                <span className="work-hour-box light-blue" /> Less than 9 hours
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ width: "100%", height: "260px", margin: "0 auto" }}>
        <Bar data={generateData()} options={options} />
      </div>
    </div>
  );
}
