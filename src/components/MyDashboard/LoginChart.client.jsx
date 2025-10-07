"use client";

import React, { useEffect, useState, useMemo } from "react";
import "./LoginChart.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useAuth } from "../../context/AuthProvider.client";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function LoginChart() {
  const { user } = useAuth();

  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const dash = user?.dashboard;
    if (!dash) return;

    const source =
      Array.isArray(dash.login_timer_graph) && dash.login_timer_graph.length
        ? dash.login_timer_graph
        : Array.isArray(dash.login_timer) && dash.login_timer.length
        ? dash.login_timer
        : Array.isArray(dash.loginDataCount) && dash.loginDataCount.length
        ? dash.loginDataCount
        : null;

    if (!source) return;

    try {
      if (
        Array.isArray(source) &&
        source.length &&
        typeof source[0] === "object"
      ) {
        const labels = source.map(
          (s) => s.punchin_label ?? s.label ?? String(s.name ?? "")
        );
        const daily = source.map((s) => Number(s.daily_count ?? s.daily ?? 0));
        const weekly = source.map((s) =>
          Number(s.weekly_count ?? s.weekly ?? 0)
        );
        const monthly = source.map((s) =>
          Number(s.monthly_count ?? s.monthly ?? 0)
        );

        const hasData =
          daily.some((v) => v) ||
          weekly.some((v) => v) ||
          monthly.some((v) => v);
        if (!hasData) return;

        setChartData({
          labels,
          datasets: [
            {
              label: "Daily",
              data: daily,
              borderColor: "green",
              backgroundColor: "rgba(0, 128, 0, 0.5)",
              borderWidth: 2,
              tension: 0.4,
            },
            {
              label: "Weekly",
              data: weekly,
              borderColor: "blue",
              backgroundColor: "rgba(0, 0, 255, 0.5)",
              borderWidth: 2,
              tension: 0.4,
            },
            {
              label: "Monthly",
              data: monthly,
              borderColor: "black",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderWidth: 2,
              tension: 0.4,
            },
          ],
        });
      }
    } catch (err) {
      console.warn("LoginChart: prefill parse error", err);
    }
  }, [user?.dashboard]);

  useEffect(() => {
    if (!BACKEND) {
      setError("Missing NEXT_PUBLIC_BACKEND_URL");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const meId = user?.employeeId ?? user?.id ?? null;
        const headers = {
          "x-api-key": API_KEY || "",
          ...(meId ? { "x-employee-id": meId } : {}),
        };

        const res = await fetch(`${BACKEND}/login-data-count`, {
          method: "GET",
          headers,
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

        const json = await res.json();

        const payload =
          json?.data ?? json ?? (json?.message ? json.message : null);

        const labels = Array.isArray(payload?.labels) ? payload.labels : [];
        const daily = Array.isArray(payload?.daily) ? payload.daily : [];
        const weekly = Array.isArray(payload?.weekly) ? payload.weekly : [];
        const monthly = Array.isArray(payload?.monthly) ? payload.monthly : [];

        if (
          (!labels.length ||
            (!daily.length && !weekly.length && !monthly.length)) &&
          Array.isArray(payload)
        ) {
          const arr = payload;
          const normLabels = arr.map(
            (s) => s.punchin_label ?? s.label ?? String(s.name ?? "")
          );
          const normDaily = arr.map((s) =>
            Number(s.daily_count ?? s.daily ?? 0)
          );
          const normWeekly = arr.map((s) =>
            Number(s.weekly_count ?? s.weekly ?? 0)
          );
          const normMonthly = arr.map((s) =>
            Number(s.monthly_count ?? s.monthly ?? 0)
          );

          if (normLabels.length) {
            if (!cancelled) {
              setChartData({
                labels: normLabels,
                datasets: [
                  {
                    label: "Daily",
                    data: normDaily,
                    borderColor: "green",
                    backgroundColor: "rgba(0, 128, 0, 0.5)",
                    borderWidth: 2,
                    tension: 0.4,
                  },
                  {
                    label: "Weekly",
                    data: normWeekly,
                    borderColor: "blue",
                    backgroundColor: "rgba(0, 0, 255, 0.5)",
                    borderWidth: 2,
                    tension: 0.4,
                  },
                  {
                    label: "Monthly",
                    data: normMonthly,
                    borderColor: "black",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    borderWidth: 2,
                    tension: 0.4,
                  },
                ],
              });
            }
            return;
          }
        }

        const safeLabels = Array.isArray(labels) ? labels : [];
        const safeDaily = Array.isArray(daily)
          ? daily.map((n) => Number(n ?? 0))
          : [];
        const safeWeekly = Array.isArray(weekly)
          ? weekly.map((n) => Number(n ?? 0))
          : [];
        const safeMonthly = Array.isArray(monthly)
          ? monthly.map((n) => Number(n ?? 0))
          : [];

        if (!cancelled) {
          setChartData({
            labels: safeLabels,
            datasets: [
              {
                label: "Daily",
                data: safeDaily,
                borderColor: "green",
                backgroundColor: "rgba(0, 128, 0, 0.5)",
                borderWidth: 2,
                tension: 0.4,
              },
              {
                label: "Weekly",
                data: safeWeekly,
                borderColor: "blue",
                backgroundColor: "rgba(0, 0, 255, 0.5)",
                borderWidth: 2,
                tension: 0.4,
              },
              {
                label: "Monthly",
                data: safeMonthly,
                borderColor: "black",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                borderWidth: 2,
                tension: 0.4,
              },
            ],
          });
        }
      } catch (err) {
        if (err.name === "AbortError") {
        } else {
          console.error("Error fetching the chart data:", err);
          if (!cancelled) setError(err.message || "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [API_KEY, BACKEND, user?.employeeId, user?.id]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "end",
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: { display: false },
        ticks: { stepSize: 10 },
      },
    },
  };

  return (
    <div className="dashboardlogin-chart-container">
      <div className="dashboardloginchartgray-box">
        <div className="dashboardlogin-chart">
          <h3>Login Timer</h3>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <Line data={chartData} options={options} />
          )}
        </div>
      </div>
    </div>
  );
}
