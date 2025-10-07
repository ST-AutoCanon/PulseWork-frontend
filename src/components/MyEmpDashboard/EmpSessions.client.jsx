"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useAuth } from "../../context/AuthProvider.client"; // adjust path if your provider is elsewhere

import "./EmpSessions.css";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const EmpSessions = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [totalWorkSeconds, setTotalWorkSeconds] = useState(0);
  const [totalIdleSeconds, setTotalIdleSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // employeeId is derived from auth user
  const employeeId = user?.employeeId ?? null;
  const [remainingTime, setRemainingTime] = useState("00:00:00");

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  const meId = employeeId;
  const headers = { "x-api-key": API_KEY, "x-employee-id": meId ?? "" };

  useEffect(() => {
    if (!employeeId) return;

    const fetchSessionData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!API_KEY) {
          setError("API Key is missing.");
          setLoading(false);
          return;
        }
        if (!BACKEND) {
          setError("Backend URL is missing.");
          setLoading(false);
          return;
        }

        const apiUrl = `${BACKEND}/today-punch/${employeeId}`;
        const response = await axios.get(apiUrl, {
          headers,
        });

        if (response.status === 200 && response.data.success) {
          const punchData = response.data.data || [];
          const now = new Date();
          let sessionSegments = [];
          let lastPunchOut = null;
          let totalWorkedSeconds = 0;
          let totalIdleSeconds = 0;

          if (punchData.length > 0) {
            const firstPunchInTime = punchData[0].punchin_time
              ? new Date(punchData[0].punchin_time)
              : null;
            if (firstPunchInTime) {
              const midnight = new Date(firstPunchInTime);
              midnight.setHours(0, 0, 0, 0);

              if (firstPunchInTime > midnight) {
                const idleSecondsFromMidnight =
                  (firstPunchInTime - midnight) / 1000;
                totalIdleSeconds += idleSecondsFromMidnight;
                sessionSegments.push({
                  label: "Idle",
                  value: idleSecondsFromMidnight,
                  color: "#82DAFE",
                });
              }
            }
          }

          punchData.forEach((record) => {
            const punchInTime = record.punchin_time
              ? new Date(record.punchin_time)
              : null;
            const punchOutTime = record.punchout_time
              ? new Date(record.punchout_time)
              : null;

            if (punchInTime && lastPunchOut) {
              const idleSeconds = (punchInTime - lastPunchOut) / 1000;
              if (idleSeconds > 0) {
                totalIdleSeconds += idleSeconds;
                sessionSegments.push({
                  label: "Idle",
                  value: idleSeconds,
                  color: "#82DAFE",
                });
              }
            }

            if (punchInTime && punchOutTime) {
              const workSeconds = (punchOutTime - punchInTime) / 1000;
              totalWorkedSeconds += workSeconds;
              sessionSegments.push({
                label: "Work",
                value: workSeconds,
                color: "#004DC6",
              });
              lastPunchOut = punchOutTime;
            } else if (punchInTime && !punchOutTime) {
              const workSeconds = (now - punchInTime) / 1000;
              totalWorkedSeconds += workSeconds;
              sessionSegments.push({
                label: "Work",
                value: workSeconds,
                color: "#004DC6",
              });
              lastPunchOut = now;
            }
          });

          const remainingSeconds =
            86400 - (totalWorkedSeconds + totalIdleSeconds);
          setRemainingTime(formatTime(remainingSeconds));

          sessionSegments.push({
            label: "Remaining",
            value: remainingSeconds,
            color: "#E8E9EA",
          });

          setChartData({
            labels: sessionSegments.map((seg) => seg.label),
            datasets: [
              {
                data: sessionSegments.map((seg) => seg.value),
                backgroundColor: sessionSegments.map((seg) => seg.color),
                hoverBackgroundColor: sessionSegments.map((seg) => seg.color),
              },
            ],
          });

          setTotalWorkSeconds(totalWorkedSeconds);
          setTotalIdleSeconds(totalIdleSeconds);
        } else {
          setChartData(null);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || "Failed to load data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
    const interval = setInterval(fetchSessionData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, API_KEY, BACKEND]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!chartData) return <p>No session data available.</p>;

  return (
    <div className="emp-sessions">
      <h3>Work Session Status</h3>
      <p className="current-time">
        {new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>
      <div className="chart-container">
        <Doughnut
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            layout: {
              padding: { top: 20, bottom: 20 },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (tooltipItem) =>
                    `${tooltipItem.label}: ${formatTime(tooltipItem.raw)}`,
                },
              },
              datalabels: {
                color: "#000",
                font: { size: 10, weight: "bold" },
                anchor: "end",
                align: "end",
                offset: 6,
                formatter: (value) => (value <= 0 ? "" : formatTime(value)),
              },
            },
          }}
        />
        <div className="chart-center-label">
          <p>{formatTime(totalWorkSeconds)}</p>
        </div>
      </div>
    </div>
  );
};

export default EmpSessions;
