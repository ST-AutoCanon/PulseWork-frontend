"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useAuth } from "../../context/AuthProvider.client";

import "./EmpSessions.css";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const SECONDS_IN_DAY = 86400;

const EmpSessions = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState(null);

  // base numbers computed at last successful fetch
  const [baseWorkSeconds, setBaseWorkSeconds] = useState(0);
  const [baseIdleSeconds, setBaseIdleSeconds] = useState(0);

  // derived (displayed) numbers that may be updated every second when an open session exists
  const [displayWorkSeconds, setDisplayWorkSeconds] = useState(0);
  const [displayIdleSeconds, setDisplayIdleSeconds] = useState(0);
  const [displayRemainingSeconds, setDisplayRemainingSeconds] =
    useState(SECONDS_IN_DAY);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const employeeId = user?.employeeId ?? null;

  const [hasOpenSession, setHasOpenSession] = useState(false);
  const lastFetchAtRef = useRef(Date.now());
  const baseSegmentsRef = useRef([]); // keep the last computed sessionSegments (integers)

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  const headers = {
    "x-api-key": API_KEY ?? "",
    "x-employee-id": String(employeeId ?? ""),
  };

  // helper to format seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const buildChartFromSegments = (segments) => {
    return {
      labels: segments.map((seg) => seg.label),
      datasets: [
        {
          data: segments.map((seg) => seg.value),
          backgroundColor: segments.map((seg) => seg.color),
          hoverBackgroundColor: segments.map((seg) => seg.color),
        },
      ],
    };
  };

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

        const apiUrl = `${BACKEND.replace(
          /\/$/,
          ""
        )}/today-punch/${encodeURIComponent(employeeId)}`;
        const response = await axios.get(apiUrl, { headers });

        if (cancelled) return;

        if (response.status === 200 && response.data?.success) {
          const punchData = response.data.data || [];
          const now = new Date();
          let sessionSegments = [];
          let lastPunchOut = null;
          let totalWorkedSeconds = 0;
          let totalIdleSeconds = 0;
          let openSessionFound = false;

          // Idle from midnight to first punch-in
          if (punchData.length > 0) {
            const firstPunchInTime = punchData[0].punchin_time
              ? new Date(punchData[0].punchin_time)
              : null;
            if (firstPunchInTime) {
              const midnight = new Date(firstPunchInTime);
              midnight.setHours(0, 0, 0, 0);
              if (firstPunchInTime > midnight) {
                const idleSecondsFromMidnight = Math.round(
                  (firstPunchInTime - midnight) / 1000
                );
                totalIdleSeconds += idleSecondsFromMidnight;
                sessionSegments.push({
                  label: "Idle",
                  value: idleSecondsFromMidnight,
                  color: "#82DAFE",
                });
              }
            }
          }

          // iterate punches
          punchData.forEach((record) => {
            const punchInTime = record.punchin_time
              ? new Date(record.punchin_time)
              : null;
            const punchOutTime = record.punchout_time
              ? new Date(record.punchout_time)
              : null;

            if (punchInTime && lastPunchOut) {
              const idleSeconds = Math.round(
                (punchInTime - lastPunchOut) / 1000
              );
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
              const workSeconds = Math.round(
                (punchOutTime - punchInTime) / 1000
              );
              if (workSeconds > 0) {
                totalWorkedSeconds += workSeconds;
                sessionSegments.push({
                  label: "Work",
                  value: workSeconds,
                  color: "#004DC6",
                });
              }
              lastPunchOut = punchOutTime;
            } else if (punchInTime && !punchOutTime) {
              // open session: count up to now
              const workSeconds = Math.round((now - punchInTime) / 1000);
              totalWorkedSeconds += workSeconds;
              sessionSegments.push({
                label: "Work",
                value: workSeconds,
                color: "#004DC6",
              });
              lastPunchOut = now;
              openSessionFound = true;
            }
          });

          // remaining seconds (clamped >= 0)
          const remainingSeconds = Math.max(
            0,
            Math.round(SECONDS_IN_DAY - (totalWorkedSeconds + totalIdleSeconds))
          );

          // push remaining
          sessionSegments.push({
            label: "Remaining",
            value: remainingSeconds,
            color: "#E8E9EA",
          });

          // coalesce consecutive same-label segments for cleaner chart (optional)
          const mergedSegments = [];
          for (const seg of sessionSegments) {
            const last = mergedSegments[mergedSegments.length - 1];
            if (last && last.label === seg.label) {
              last.value = Math.max(0, last.value + seg.value);
            } else {
              mergedSegments.push({ ...seg });
            }
          }

          // Save base numbers and segments (integers)
          setBaseWorkSeconds(totalWorkedSeconds);
          setBaseIdleSeconds(totalIdleSeconds);
          baseSegmentsRef.current = mergedSegments.map((s) => ({ ...s }));
          setChartData(buildChartFromSegments(mergedSegments));

          // set derived / displayed immediately (will be updated by ticking effect if open)
          setDisplayWorkSeconds(totalWorkedSeconds);
          setDisplayIdleSeconds(totalIdleSeconds);
          setDisplayRemainingSeconds(remainingSeconds);
          setHasOpenSession(openSessionFound);
          lastFetchAtRef.current = Date.now();
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

    const refetchInterval = setInterval(fetchSessionData, 30000);
    return () => {
      cancelled = true;
      clearInterval(refetchInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  // Ticker: when there is an open session, update displayed numbers every second so UI doesn't appear stale.
  useEffect(() => {
    let tickId = null;
    const tick = () => {
      // base values as-of last fetch
      const baseWork = Number(baseWorkSeconds) || 0;
      const baseIdle = Number(baseIdleSeconds) || 0;
      const nowMs = Date.now();
      const secondsSinceFetch = Math.floor(
        (nowMs - lastFetchAtRef.current) / 1000
      );

      // If there's an open session, the "work" should grow by secondsSinceFetch
      const displayWork = baseWork + (hasOpenSession ? secondsSinceFetch : 0);
      const displayIdle = baseIdle; // idle doesn't grow if open session is ongoing (unless you want to attribute differently)
      const displayRemaining = Math.max(
        0,
        SECONDS_IN_DAY - (displayWork + displayIdle)
      );

      setDisplayWorkSeconds(displayWork);
      setDisplayIdleSeconds(displayIdle);
      setDisplayRemainingSeconds(displayRemaining);

      // also update chart last Work segment in real-time (cheap update)
      if (baseSegmentsRef.current && baseSegmentsRef.current.length) {
        const segs = baseSegmentsRef.current.map((s) => ({ ...s })); // clone
        // find last Work segment (often before 'Remaining')
        let workIdx = -1;
        for (let i = segs.length - 1; i >= 0; i--) {
          if (segs[i].label === "Work") {
            workIdx = i;
            break;
          }
        }
        if (workIdx >= 0) {
          // set it to base value + secondsSinceFetch (if open), otherwise base value
          segs[workIdx].value = Math.max(
            0,
            Math.round(
              segs[workIdx].value + (hasOpenSession ? secondsSinceFetch : 0)
            )
          );
        }
        // recompute remaining segment if exists
        const remIdx = segs.findIndex((s) => s.label === "Remaining");
        if (remIdx >= 0) {
          segs[remIdx].value = Math.max(
            0,
            Math.round(SECONDS_IN_DAY - (displayWork + displayIdle))
          );
        }
        setChartData(buildChartFromSegments(segs));
      }
    };

    // initial tick (set immediate)
    tick();
    // run every second for smooth update
    tickId = setInterval(tick, 1000);

    return () => {
      if (tickId) clearInterval(tickId);
    };
  }, [baseWorkSeconds, baseIdleSeconds, hasOpenSession]);

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
                  label: (context) => {
                    const raw = context.raw ?? 0;
                    return `${context.label}: ${formatTime(raw)}`;
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
          {/* show dynamic work time (updates every second if open session exists) */}
          <p>{formatTime(displayWorkSeconds)}</p>
        </div>
      </div>
    </div>
  );
};

export default EmpSessions;
