"use client";

import React, { useEffect, useState } from "react";
import EmpDashCards from "./EmpDashCards.client";
import EmpReImbursement from "./EmpReImbursement.client";
import EmpSessions from "./EmpSessions.client";
import EmpWorkDays from "./EmpWorkDays.client";
import EmpProjectTable from "./EmpProjectTable.client";
import EmpLeaveTracker from "./EmpLeaveTracker.client";
import MyDailyWorkHour from "./MyDailyWorkHour.client";
import SaveFaceData from "./SaveFaceData.client";
import "./MyEmpDashboard.css";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";

export default function MyEmpDashboard() {
  const { user } = useAuth(); // get current user from context
  const meId = user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // pending | registered | not-registered | error
  const [faceCheckStatus, setFaceCheckStatus] = useState("pending");

  // Helper to build headers
  function getHeaders() {
    const headers = {};
    if (API_KEY) headers["x-api-key"] = API_KEY;
    if (meId) headers["x-employee-id"] = meId;
    return headers;
  }

  // Check camera availability and then call API to decide whether to show face registration popup
  useEffect(() => {
    // only run on client
    if (typeof window === "undefined") return;

    if (!meId) {
      console.warn("MyEmpDashboard: meId not available; skipping face check");
      setFaceCheckStatus("error");
      return;
    }

    let mounted = true;
    const headers = getHeaders();

    async function checkAndMaybeShowPopup() {
      try {
        // 1) Check for camera devices (gracefully handle older browsers)
        let hasCamera = false;
        if (navigator?.mediaDevices?.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            hasCamera = devices.some((d) => d.kind === "videoinput");
          } catch (err) {
            console.warn("enumerateDevices failed:", err);
            hasCamera = false;
          }
        }

        if (!hasCamera) {
          // no camera — don't prompt
          if (!mounted) return;
          console.log("No camera found; skipping face registration popup.");
          // treat as registered/no-popup needed
          setFaceCheckStatus("registered");
          return;
        }

        // 2) Camera found — call backend to see whether face is registered
        const url = `${
          BACKEND_URL?.replace(/\/$/, "") || ""
        }/api/face/check/${encodeURIComponent(meId)}`;

        // Call backend
        const resp = await axios.get(url, { headers });
        if (!mounted) return;

        // Debug log (one-time) to inspect shape
        console.debug("face check response:", resp?.data);

        // Interpret many possible shapes; adapt to your backend
        const data = resp?.data ?? {};
        const isRegistered =
          Boolean(data?.isRegistered) ||
          Boolean(data?.registered) ||
          Boolean(data?.exists) ||
          (typeof data?.count === "number" && data.count > 0) ||
          Boolean(data?.data?.isRegistered) ||
          Boolean(data?.data?.exists) ||
          (typeof data?.data?.count === "number" && data.data.count > 0);

        if (isRegistered) {
          setFaceCheckStatus("registered");
        } else {
          setFaceCheckStatus("not-registered");
        }
      } catch (err) {
        console.error("Error checking face registration:", err);
        // network or unexpected failure — avoid annoying the user; treat as registered/no-popup
        setFaceCheckStatus("error");
      }
    }

    // kick off
    checkAndMaybeShowPopup();

    return () => {
      mounted = false;
    };
  }, [meId, BACKEND_URL, API_KEY]);

  return (
    <div>
      {/* Only show the SaveFaceData popup when we explicitly know the user is NOT registered */}
      {faceCheckStatus === "not-registered" && (
        <div className="reg-popup-overlay">
          <div className="reg-popup-content">
            <SaveFaceData
              onClose={() => {
                // when SaveFaceData closes (either saved or cancelled), mark as registered/closed
                setFaceCheckStatus("registered");
              }}
            />
          </div>
        </div>
      )}

      <div className="EmpDashCards1234">
        <EmpDashCards />
      </div>

      <div className="empcardcharts123">
        <EmpSessions />
        <EmpWorkDays />
        <EmpReImbursement />
      </div>

      <div className="mydailyworkhour123">
        <MyDailyWorkHour />
      </div>

      {/* Uncomment if you want project table */}
      {/* <div className="EmpProjectTable">
        <EmpProjectTable />
      </div> */}

      <div className="EmpLeaveTracker123">
        <EmpLeaveTracker />
      </div>
    </div>
  );
}
