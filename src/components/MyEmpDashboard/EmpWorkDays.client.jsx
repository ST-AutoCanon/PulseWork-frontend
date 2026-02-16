// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import { Doughnut } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
// import ChartDataLabels from "chartjs-plugin-datalabels";
// import axios from "axios";
// import { useAuth } from "../../context/AuthProvider.client";
// import "./EmpWorkDays.css";

// ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// export default function EmpWorkDays() {
//   const { user } = useAuth();
//   const meId = user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
//   const orgId = user?.orgId ?? user?.org_id ?? null;
//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

//   const [chartData, setChartData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const mountedRef = useRef(true);
//   useEffect(() => {
//     mountedRef.current = true;
//     return () => {
//       mountedRef.current = false;
//     };
//   }, []);

//   useEffect(() => {
//     if (!meId) {
//       setLoading(false);
//       setError("User not authenticated");
//       return;
//     }

//     let cancelled = false;
//     const controller = new AbortController();

//     const fetchWorkDaysData = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         const apiUrl = `${BACKEND_URL.replace(
//           /\/$/,
//           ""
//         )}/attendance/${encodeURIComponent(meId)}`;

//         const headers = {
//           "x-api-key": API_KEY,
//         };
//         if (meId) headers["x-employee-id"] = meId;
//         if (orgId) headers["x-org-id"] = orgId;

//         const response = await axios.get(apiUrl, {
//           withCredentials: true,
//           headers,
//           signal: controller.signal,
//         });

//         if (cancelled || !mountedRef.current) return;

//         if (
//           response.status === 200 &&
//           response.data &&
//           response.data.attendanceStats
//         ) {
//           const stats = response.data.attendanceStats;
//           const total_working_days = stats.total_working_days ?? 0;
//           const leave_count = stats.leave_count ?? 0;
//           const present_count = stats.present_count ?? 0;
//           const absent_count = stats.absent_count ?? 0;

//           if (mountedRef.current && !cancelled) {
//             setChartData({
//               labels: ["Leaves", "Present", "Absent"],
//               data: [leave_count, present_count, absent_count],
//               backgroundColors: ["#82DAFE", "#004DC6", "#E8E9EA"],
//               hoverColors: ["#82DAFE", "#004DC6", "#E8E9EA"],
//               centerTextWorkDays: `${total_working_days} Days`,
//             });
//           }
//         } else {
//           if (mountedRef.current && !cancelled) {
//             setChartData(null);
//             setError("No attendance stats available.");
//           }
//         }
//       } catch (err) {
//         if (axios.isCancel && axios.isCancel(err)) {
//           return;
//         }
//         if (!cancelled && mountedRef.current) {
//           console.error("Error fetching workdays:", err);
//           setError(
//             err.response?.data?.message || err.message || "Failed to load data."
//           );
//           setChartData(null);
//         }
//       } finally {
//         if (!cancelled && mountedRef.current) setLoading(false);
//       }
//     };

//     fetchWorkDaysData();

//     return () => {
//       cancelled = true;
//       controller.abort();
//     };
//   }, [meId, BACKEND_URL, API_KEY, orgId]);

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p className="error">{error}</p>;
//   if (!chartData) return <p>No data available.</p>;

//   const data = {
//     labels: chartData.labels,
//     datasets: [
//       {
//         data: chartData.data,
//         backgroundColor: chartData.backgroundColors,
//         hoverBackgroundColor: chartData.hoverColors,
//       },
//     ],
//   };

//   const options = {
//     maintainAspectRatio: false,
//     responsive: true,
//     cutout: "70%",
//     layout: {
//       padding: {
//         top: 15,
//         bottom: 15,
//       },
//     },
//     plugins: {
//       legend: { display: false },
//       datalabels: {
//         color: "#000",
//         anchor: "end",
//         align: "end",
//         offset: 0,
//         font: { weight: "bold", size: 12 },
//         formatter: (value) => `${value}`,
//       },
//     },
//   };

//   const centerTextPluginWorkDays = {
//     id: "centerTextWorkDays",
//     afterDraw: (chart) => {
//       if (!chartData || !chartData.centerTextWorkDays) return;

//       const { width, height } = chart;
//       const ctx = chart.ctx;
//       ctx.save();

//       const centerText = chartData.centerTextWorkDays;
//       const parts = centerText.split(" ");
//       const number = parts[0] || "";
//       const unit = parts.slice(1).join(" ") || "";

//       ctx.font = "bold 26px sans-serif";
//       ctx.textBaseline = "middle";
//       ctx.textAlign = "center";
//       ctx.fillStyle = "#000";
//       ctx.fillText(number, width / 2, height / 2 - 10);

//       ctx.font = "14px sans-serif";
//       ctx.fillText(unit, width / 2, height / 2 + 10);

//       ctx.restore();
//     },
//   };

//   return (
//     <div className="emp-workdays">
//       <h3>Work Days</h3>
//       <p>
//         {new Date().toLocaleDateString("en-GB", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         })}
//       </p>

//       <div className="chart-container1" style={{ paddingTop: "50px" }}>
//         <Doughnut
//           data={data}
//           options={options}
//           plugins={[centerTextPluginWorkDays]}
//         />
//       </div>

//       <div className="custom-legend">
//         {chartData.labels.map((label, index) => (
//           <div key={index} className="legend-item">
//             <span
//               className="legend-color"
//               style={{ backgroundColor: chartData.backgroundColors[index] }}
//             />
//             <span className="legend-text">
//               {label}: {chartData.data[index]}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useState, useRef } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";
import "./EmpWorkDays.css";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export default function EmpWorkDays() {
  const { user } = useAuth();
  const meId = user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.org_id ?? null;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    let cancelled = false;
    const controller = new AbortController();

    const fetchWorkDaysData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAttendanceAPI(
          meId,
          orgId,
          API_KEY,
          BACKEND_URL,
          controller
        );

        if (cancelled || !mountedRef.current) return;

        if (isValidAttendanceResponse(response)) {
          const stats = response.data.attendanceStats;
          const result = buildWorkDaysStats(stats);

          if (mountedRef.current && !cancelled) {
            setChartData(result);
          }
        } else {
          handleNoData(cancelled, mountedRef, setChartData, setError);
        }
      } catch (err) {
        handleWorkDaysError(err, cancelled, mountedRef, setError, setChartData);
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    };

    fetchWorkDaysData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [meId, BACKEND_URL, API_KEY, orgId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!chartData) return <p>No data available.</p>;

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.data,
        backgroundColor: chartData.backgroundColors,
        hoverBackgroundColor: chartData.hoverColors,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    cutout: "70%",
    layout: {
      padding: {
        top: 15,
        bottom: 15,
      },
    },
    plugins: {
      legend: { display: false },
      datalabels: {
        color: "#000",
        anchor: "end",
        align: "end",
        offset: 0,
        font: { weight: "bold", size: 12 },
        formatter: (value) => `${value}`,
      },
    },
  };

  const centerTextPluginWorkDays = {
    id: "centerTextWorkDays",
    afterDraw: (chart) => {
      if (!chartData || !chartData.centerTextWorkDays) return;

      const { width, height } = chart;
      const ctx = chart.ctx;
      ctx.save();

      const centerText = chartData.centerTextWorkDays;
      const parts = centerText.split(" ");
      const number = parts[0] || "";
      const unit = parts.slice(1).join(" ") || "";

      ctx.font = "bold 26px sans-serif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillStyle = "#000";
      ctx.fillText(number, width / 2, height / 2 - 10);

      ctx.font = "14px sans-serif";
      ctx.fillText(unit, width / 2, height / 2 + 10);

      ctx.restore();
    },
  };

  return (
    <div className="emp-workdays">
      <h3>Work Days</h3>
      <p>
        {new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>

      <div className="chart-container1" style={{ paddingTop: "50px" }}>
        <Doughnut
          data={data}
          options={options}
          plugins={[centerTextPluginWorkDays]}
        />
      </div>

      <div className="custom-legend">
        {chartData.labels.map((label, index) => (
          <div key={index} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: chartData.backgroundColors[index] }}
            />
            <span className="legend-text">
              {label}: {chartData.data[index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   Helper functions below
   ========================= */

async function fetchAttendanceAPI(
  meId,
  orgId,
  API_KEY,
  BACKEND_URL,
  controller
) {
  const apiUrl = `${BACKEND_URL.replace(
    /\/$/,
    ""
  )}/attendance/${encodeURIComponent(meId)}`;

  const headers = { "x-api-key": API_KEY };
  if (meId) headers["x-employee-id"] = meId;
  if (orgId) headers["x-org-id"] = orgId;

  return axios.get(apiUrl, {
    withCredentials: true,
    headers,
    signal: controller.signal,
  });
}

function isValidAttendanceResponse(response) {
  return (
    response.status === 200 &&
    response.data &&
    response.data.attendanceStats
  );
}

function buildWorkDaysStats(stats) {
  const total_working_days = stats.total_working_days ?? 0;
  const leave_count = stats.leave_count ?? 0;
  const present_count = stats.present_count ?? 0;
  const absent_count = stats.absent_count ?? 0;

  return {
    labels: ["Leaves", "Present", "Absent"],
    data: [leave_count, present_count, absent_count],
    backgroundColors: ["#82DAFE", "#004DC6", "#E8E9EA"],
    hoverColors: ["#82DAFE", "#004DC6", "#E8E9EA"],
    centerTextWorkDays: `${total_working_days} Days`,
  };
}

function handleNoData(cancelled, mountedRef, setChartData, setError) {
  if (mountedRef.current && !cancelled) {
    setChartData(null);
    setError("No attendance stats available.");
  }
}

function handleWorkDaysError(
  err,
  cancelled,
  mountedRef,
  setError,
  setChartData
) {
  if (axios.isCancel && axios.isCancel(err)) return;

  if (!cancelled && mountedRef.current) {
    console.error("Error fetching workdays:", err);
    setError(
      err.response?.data?.message || err.message || "Failed to load data."
    );
    setChartData(null);
  }
}
