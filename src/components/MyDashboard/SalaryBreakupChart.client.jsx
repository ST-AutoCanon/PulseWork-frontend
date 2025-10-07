"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "./SalaryBreakupChart.css";
import { useAuth } from "../../context/AuthProvider.client";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export default function EmployeeSalaryBreakup() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const emptyData = useMemo(
    () => ({
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
          hoverBackgroundColor: [],
        },
      ],
    }),
    []
  );

  useEffect(() => {
    const dash = user?.dashboard ?? user?.raw?.dashboard ?? null;
    if (!dash) return;

    const candidate =
      (dash.salary_breakup &&
        typeof dash.salary_breakup === "object" &&
        dash.salary_breakup) ||
      (dash.salaryBreakup &&
        typeof dash.salaryBreakup === "object" &&
        dash.salaryBreakup) ||
      null;

    if (!candidate) return;

    try {
      const labels = Array.isArray(candidate.labels) ? candidate.labels : [];
      const datasets = Array.isArray(candidate.datasets)
        ? candidate.datasets
        : [];

      if (labels.length && datasets.length) {
        setData({
          labels,
          datasets: datasets.map((ds) => ({
            data: Array.isArray(ds.data)
              ? ds.data.map((n) => Number(n || 0))
              : [],
            backgroundColor: Array.isArray(ds.backgroundColor)
              ? ds.backgroundColor
              : [],
            label: ds.label ?? "",
          })),
        });
      }
    } catch (err) {
      console.warn("SalaryBreakup prefill parse error", err);
    }
  }, [user?.dashboard, user?.raw]);

  useEffect(() => {
    if (!BACKEND) {
      setError("Missing NEXT_PUBLIC_BACKEND_URL");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let mounted = true;

    async function fetchSalaryRanges() {
      try {
        setLoading(true);
        setError(null);

        const meId = user?.employeeId ?? user?.id ?? null;
        const headers = {
          "x-api-key": API_KEY || "",
          ...(meId ? { "x-employee-id": meId } : {}),
        };

        const res = await fetch(`${BACKEND}/salary-ranges`, {
          method: "GET",
          headers,
          signal: controller.signal,
        });

        if (!mounted) return;
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

        const json = await res.json();

        const payload = json?.message ?? json ?? null;

        if (
          payload &&
          Array.isArray(payload.labels) &&
          Array.isArray(payload.datasets)
        ) {
          const safeDatasets = payload.datasets.map((ds) => ({
            label: ds.label ?? "",
            data: Array.isArray(ds.data)
              ? ds.data.map((n) => Number(n ?? 0))
              : [],
            backgroundColor: Array.isArray(ds.backgroundColor)
              ? ds.backgroundColor
              : undefined,
          }));

          if (mounted)
            setData({ labels: payload.labels, datasets: safeDatasets });
          return;
        }

        if (
          payload &&
          Array.isArray(payload.labels) &&
          Array.isArray(payload.data) &&
          payload.data.length === payload.labels.length
        ) {
          const background =
            Array.isArray(payload.colors) &&
            payload.colors.length === payload.labels.length
              ? payload.colors
              : undefined;

          if (mounted)
            setData({
              labels: payload.labels,
              datasets: [
                {
                  data: payload.data.map((n) => Number(n ?? 0)),
                  backgroundColor: background,
                  label: payload.label ?? "Salary breakup",
                },
              ],
            });
          return;
        }

        if (payload && typeof payload === "object" && !Array.isArray(payload)) {
          const keys = Object.keys(payload).filter(
            (k) => !["status", "code", "message"].includes(k)
          );
          const numericPairs = keys.filter(
            (k) => typeof payload[k] === "number" || !isNaN(Number(payload[k]))
          );
          if (numericPairs.length > 0) {
            const labels = numericPairs;
            const values = numericPairs.map((k) => Number(payload[k] ?? 0));
            if (mounted)
              setData({
                labels,
                datasets: [
                  {
                    data: values,
                    backgroundColor: labels.map(
                      (_, i) => `hsl(${(i * 60) % 360} 70% 50%)`
                    ),
                    label: "Salary breakup",
                  },
                ],
              });
            return;
          }
        }

        if (mounted) setData(emptyData);
      } catch (err) {
        if (err.name === "AbortError") {
        } else {
          console.error("Error fetching salary ranges:", err);
          if (mounted) setError(err.message || "Failed to fetch salary ranges");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchSalaryRanges();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [BACKEND, API_KEY, user?.employeeId, user?.id, emptyData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, padding: 8 },
      },
      datalabels: {
        color: "#fff",
        anchor: "center",
        align: "center",
        font: { weight: "bold", size: 12 },
        formatter: (value) => {
          try {
            return `${value}`;
          } catch {
            return value;
          }
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed ?? ctx.raw ?? 0;
            return `${ctx.label ?? ""}: ${val}`;
          },
        },
      },
    },
  };

  return (
    <div className="salary-breakup-chart">
      <h3>Employee Salary Breakup</h3>
      <div className="chart-container-for-employee" style={{ minHeight: 250 }}>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error">Error: {error}</p>
        ) : (
          <Pie data={data ?? emptyData} options={options} />
        )}
      </div>
    </div>
  );
}
