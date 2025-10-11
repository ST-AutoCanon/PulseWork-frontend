"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import "./EmployeeByDepartment.css";
import { useAuth } from "../../context/AuthProvider.client";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function EmployeeByDepartment() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const emptyData = useMemo(() => ({ labels: [], datasets: [] }), []);

  useEffect(() => {
    const dash = user?.dashboard;
    if (!dash || !Array.isArray(dash.department_distribution)) return;

    try {
      const depts = dash.department_distribution.filter(
        (d) => d.department_name
      );
      const labels = depts.map((d) => d.department_name);
      const men = depts.map((d) => Number(d.men ?? 0));
      const women = depts.map((d) => Number(d.women ?? 0));

      const hasValues = men.some((v) => v) || women.some((v) => v);
      if (!hasValues) return;

      setData({
        labels,
        datasets: [
          {
            label: "Men",
            data: men,
            backgroundColor: "#007bff",
          },
          {
            label: "Women",
            data: women,
            backgroundColor: "lightblue",
          },
        ],
      });
    } catch (err) {}
  }, [user?.dashboard]);

  useEffect(() => {
    if (!BACKEND) {
      setError("Missing NEXT_PUBLIC_BACKEND_URL");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const meId = user?.employeeId ?? user?.id ?? null;
    const headers = {
      "x-api-key": API_KEY || "",
      ...(meId ? { "x-employee-id": meId } : {}),
    };

    (async () => {
      try {
        const res = await fetch(`${BACKEND}/employee-count-by-department`, {
          method: "GET",
          credentials: "include",
          headers,
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const jsonData = await res.json();

        const categories = Array.isArray(jsonData?.categories)
          ? jsonData.categories
          : Array.isArray(jsonData?.message?.categories)
          ? jsonData.message.categories
          : null;

        if (!categories) {
          throw new Error("Invalid API response: missing categories array");
        }

        const depts = categories.filter((d) => d && d.department_name);
        const labels = depts.map((d) => String(d.department_name));
        const menData = depts.map((d) => Math.round(Number(d.men ?? 0)));
        const womenData = depts.map((d) => Math.round(Number(d.women ?? 0)));

        setData({
          labels,
          datasets: [
            {
              label: "Men",
              data: menData,
              backgroundColor: "#007bff",
            },
            {
              label: "Women",
              data: womenData,
              backgroundColor: "lightblue",
            },
          ],
        });
      } catch (err) {
        if (err.name === "AbortError") {
        } else {
          console.error("Error fetching employee count:", err);
          setError(err.message || "Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [BACKEND, API_KEY, user?.employeeId, user?.id]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        align: "center",
        labels: { boxWidth: 15, padding: 10 },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          color: "black",
          callback: function (value) {
            const label = this.getLabelForValue(value) || "";
            const words = String(label).split(" ");
            if (words.length > 1) {
              const mid = Math.ceil(words.length / 2);
              return (
                words.slice(0, mid).join(" ") +
                "\n" +
                words.slice(mid).join(" ")
              );
            }
            return label;
          },
          font: { size: 8 },
          padding: 6,
        },
        categoryPercentage: 0.3,
        barPercentage: 0.3,
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: {
          beginAtZero: true,
          stepSize: 1,
          callback: (v) => (Number.isInteger(v) ? v : ""),
        },
      },
    },
    elements: { bar: { maxBarThickness: 3, borderRadius: 5 } },
  };

  return (
    <div className="employee-department">
      <h3>Employees by Department (Men & Women)</h3>
      <div className="chart-container-bydepartment" style={{ minHeight: 220 }}>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <Bar data={data || emptyData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}
