
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

import "./EmpSessions.css";
import { useAuth } from "../../context/AuthProvider.client";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const SECONDS_IN_DAY = 86400;

const EmpSessions = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [totalWorkSeconds, setTotalWorkSeconds] = useState(0);
  const [totalIdleSeconds, setTotalIdleSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(SECONDS_IN_DAY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const employeeId = user?.employeeId ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  const headers = {
    "x-api-key": API_KEY ?? "",
    "x-employee-id": String(employeeId ?? ""),
  };

  const formatTime = (seconds) => {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const buildChartFromSegments = (segments) => ({
    labels: segments.map((s) => s.label),
    datasets: [
      {
        data: segments.map((s) => s.value),
        backgroundColor: segments.map((s) => s.color),
        hoverBackgroundColor: segments.map((s) => s.color),
      },
    ],
  });

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSessionData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!API_KEY) throw new Error("API Key is missing.");
        if (!BACKEND) throw new Error("Backend URL is missing.");
        const apiUrl = `${BACKEND.replace(/\/$/, "")}/today-punch/${encodeURIComponent(employeeId)}`;
        const { data } = await axios.get(apiUrl, { headers });

        if (cancelled) return;

        if (data?.success) {
          const punchData = data.data || [];
          const now = new Date();

          const segments = [];
          let lastPunchOut = null;
          let workSec = 0;
          let idleSec = 0;

          if (punchData.length > 0) {
            const firstIn = punchData[0].punchin_time ? new Date(punchData[0].punchin_time) : null;
            if (firstIn) {
              const midnight = new Date(firstIn);
              midnight.setHours(0, 0, 0, 0);
              if (firstIn > midnight) {
                const idle = Math.round((firstIn - midnight) / 1000);
                idleSec += idle;
                segments.push({ label: "Idle", value: idle, color: "#82DAFE" });
              }
            }
          }

          punchData.forEach((rec) => {
            const inT = rec.punchin_time ? new Date(rec.punchin_time) : null;
            const outT = rec.punchout_time ? new Date(rec.punchout_time) : null;

            if (inT && lastPunchOut) {
              const idle = Math.round((inT - lastPunchOut) / 1000);
              if (idle > 0) {
                idleSec += idle;
                segments.push({ label: "Idle", value: idle, color: "#82DAFE" });
              }
            }

            if (inT && outT) {
              const work = Math.round((outT - inT) / 1000);
              workSec += work;
              segments.push({ label: "Work", value: work, color: "#004DC6" });
              lastPunchOut = outT;
            } else if (inT && !outT) {
              const work = Math.round((new Date() - inT) / 1000);
              workSec += work;
              segments.push({ label: "Work", value: work, color: "#004DC6" });
              lastPunchOut = new Date();
            }
          });

          const remaining = Math.max(0, SECONDS_IN_DAY - (workSec + idleSec));
          segments.push({ label: "Remaining", value: remaining, color: "#E8E9EA" });

          const merged = [];
          for (const seg of segments) {
            const last = merged[merged.length - 1];
            if (last && last.label === seg.label) {
              last.value = Math.max(0, last.value + seg.value);
            } else {
              merged.push({ ...seg });
            }
          }

          setTotalWorkSeconds(workSec);
          setTotalIdleSeconds(idleSec);
          setRemainingSeconds(remaining);
          setChartData(buildChartFromSegments(merged));
        } else {
          setChartData(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
    const interval = setInterval(fetchSessionData, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [employeeId]);

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
            layout: { padding: { top: 20, bottom: 20 } },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const raw = ctx.raw ?? 0;
                    return `${ctx.label}: ${formatTime(raw)}`;
                  },
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