"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "./TotalEmployee.css";
import { useAuth } from "../../context/AuthProvider.client";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export default function TotalEmployee() {
  const { user } = useAuth();

  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const emptyData = useMemo(
    () => ({
      labels: [],
      datasets: [{ data: [], backgroundColor: [], hoverBackgroundColor: [] }],
    }),
    []
  );

  useEffect(() => {
    const dash = user?.dashboard ?? user?.raw?.dashboard ?? null;
    if (!dash) return;

    const candidate =
      Array.isArray(dash.categories) && dash.categories.length
        ? dash.categories
        : Array.isArray(dash.attendanceCount?.categories) &&
          dash.attendanceCount.categories.length
        ? dash.attendanceCount.categories
        : Array.isArray(dash.attendance_count) && dash.attendance_count.length
        ? dash.attendance_count
        : null;

    if (!candidate) return;

    try {
      const categories = candidate.filter((c) => c && (c.label || c.name));
      if (!categories.length) return;

      const labels = categories.map((c) => c.label ?? c.name ?? "");
      const values = categories.map((c) => Number(c.count ?? c.value ?? 0));
      const colors = categories.map(
        (c) =>
          c.color ?? c.backgroundColor ?? `hsl(${Math.random() * 360} 70% 50%)`
      );

      const safe = {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            hoverBackgroundColor: colors,
            borderWidth: 1,
          },
        ],
      };

      setChartData(safe);
    } catch (err) {
      console.warn("TotalEmployee prefill parse error", err);
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

    async function fetchTotalEmployeeData() {
      try {
        setLoading(true);
        setError(null);

        const meId = user?.employeeId ?? user?.id ?? null;
        const headers = {
          "x-api-key": API_KEY || "",
          ...(meId ? { "x-employee-id": meId } : {}),
        };

        const res = await fetch(`${BACKEND}/attendance-status`, {
          method: "GET",
          credentials: "include",
          headers,
          signal: controller.signal,
        });

        if (!mounted) return;
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

        const jsonData = await res.json();

        let categories =
          Array.isArray(jsonData?.message?.categories) &&
          jsonData.message.categories.length
            ? jsonData.message.categories
            : Array.isArray(jsonData?.categories) && jsonData.categories.length
            ? jsonData.categories
            : Array.isArray(jsonData?.data?.categories) &&
              jsonData.data.categories.length
            ? jsonData.data.categories
            : null;

        if (!categories && Array.isArray(jsonData)) {
          categories = jsonData;
        }

        if (!categories) {
          if (Array.isArray(jsonData?.message)) categories = jsonData.message;
        }

        if (!Array.isArray(categories)) {
          throw new Error("Invalid API response: missing categories array");
        }

        const filtered = categories.filter((c) => c && (c.label || c.name));
        const labels = filtered.map((c) => String(c.label ?? c.name ?? ""));
        const dataValues = filtered.map((c) => Number(c.count ?? c.value ?? 0));
        const colors = filtered.map(
          (c) =>
            c.color ??
            c.backgroundColor ??
            `hsl(${(Math.random() * 360) | 0} 70% 50%)`
        );

        if (mounted) {
          setChartData({
            labels,
            datasets: [
              {
                data: dataValues,
                backgroundColor: colors,
                hoverBackgroundColor: colors,
                borderWidth: 1,
              },
            ],
          });
        }
      } catch (err) {
        if (err.name === "AbortError") {
        } else {
          console.error("Error fetching total employee data:", err);
          if (mounted) setError(err.message || "Unknown error");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTotalEmployeeData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [API_KEY, BACKEND, user?.employeeId, user?.id]);

  if (loading && !chartData) return <p>Loading...</p>;
  if (error && !chartData) return <p className="error">Error: {error}</p>;

  const safeData = chartData ?? emptyData;
  const totalEmployees =
    safeData.datasets?.[0]?.data?.reduce((a, b) => a + (Number(b) || 0), 0) ??
    0;

  const centerTextPlugin = {
    id: "centerText",
    beforeDraw: (chart) => {
      const { ctx, chartArea } = chart;
      if (!chartArea) return; // defensive: chartArea may be undefined early

      ctx.save();

      // compute center of the actual chart area (the donut itself)
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;

      // base font size on the chart-area inner dimension so it scales nicely
      const innerWidth = chartArea.right - chartArea.left;
      const innerHeight = chartArea.bottom - chartArea.top;
      const fontSize = Math.max(
        Math.round(Math.min(innerWidth, innerHeight) / 10),
        14
      );

      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(`${totalEmployees} Employees`, centerX, centerY);

      ctx.restore();
    },
  };

  const options = {
    cutout: "70%",
    layout: {
      padding: {
        bottom: 30,
      },
    },
    plugins: {
      legend: {
        position: "bottom",
        align: "center",
        labels: {
          boxWidth: 15,
          padding: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const dataset = tooltipItem.dataset;
            const total = dataset.data.reduce(
              (acc, value) => acc + (Number(value) || 0),
              0
            );
            const currentValue = Number(
              dataset.data[tooltipItem.dataIndex] || 0
            );
            const percentage =
              total > 0 ? ((currentValue / total) * 100).toFixed(1) : "0.0";
            return `${currentValue} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        display: true,
        color: "black",
        anchor: "center",
        align: "center",
        font: { size: 12, weight: "bold" },
        formatter: (value) =>
          Number.isFinite(Number(value)) ? Number(value) : value,
        clip: false,
      },
    },
  };

  return (
    <div className="total-employees">
      <h3>Total Employees</h3>
      <div className="admindashtotalemployee-chart" style={{ minHeight: 220 }}>
        <Doughnut
          data={safeData}
          options={options}
          plugins={[ChartDataLabels, centerTextPlugin]}
        />
      </div>
      {error && <p className="error">Error: {error}</p>}
    </div>
  );
}
