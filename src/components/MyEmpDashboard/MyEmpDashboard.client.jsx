// "use client";

// import React, { useEffect, useState } from "react";
// import EmpDashCards from "./EmpDashCards.client";
// import EmpReImbursement from "./EmpReImbursement.client";
// import EmpSessions from "./EmpSessions.client";
// import EmpWorkDays from "./EmpWorkDays.client";
// import EmpProjectTable from "./EmpProjectTable.client";
// import EmpLeaveTracker from "./EmpLeaveTracker.client";
// import MyDailyWorkHour from "./MyDailyWorkHour.client";
// import SaveFaceData from "./SaveFaceData.client";
// import "./MyEmpDashboard.css";
// import axios from "axios";
// import { useAuth } from "../../context/AuthProvider.client";

// export default function MyEmpDashboard() {
//   const { user } = useAuth();
//   const meId = user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

//   const [faceCheckStatus, setFaceCheckStatus] = useState("pending");

//   function getHeaders() {
//     const headers = {};
//     if (API_KEY) headers["x-api-key"] = API_KEY;
//     if (meId) headers["x-employee-id"] = meId;
//     return headers;
//   }

//   useEffect(() => {
//     if (typeof window === "undefined") return;

//     if (!meId) {
//       console.warn("MyEmpDashboard: meId not available; skipping face check");
//       setFaceCheckStatus("error");
//       return;
//     }

//     let mounted = true;
//     const headers = getHeaders();

//     async function checkAndMaybeShowPopup() {
//       try {
//         let hasCamera = false;
//         if (navigator?.mediaDevices?.enumerateDevices) {
//           try {
//             const devices = await navigator.mediaDevices.enumerateDevices();
//             hasCamera = devices.some((d) => d.kind === "videoinput");
//           } catch (err) {
//             console.warn("enumerateDevices failed:", err);
//             hasCamera = false;
//           }
//         }

//         if (!hasCamera) {
//           if (!mounted) return;

//           setFaceCheckStatus("registered");
//           return;
//         }

//         const url = `${
//           BACKEND_URL?.replace(/\/$/, "") || ""
//         }/api/face/check/${encodeURIComponent(meId)}`;

//         const resp = await axios.get(url, { withCredentials: true, headers });
//         if (!mounted) return;

//         console.debug("face check response:", resp?.data);

//         const data = resp?.data ?? {};
//         const isRegistered =
//           Boolean(data?.isRegistered) ||
//           Boolean(data?.registered) ||
//           Boolean(data?.exists) ||
//           (typeof data?.count === "number" && data.count > 0) ||
//           Boolean(data?.data?.isRegistered) ||
//           Boolean(data?.data?.exists) ||
//           (typeof data?.data?.count === "number" && data.data.count > 0);

//         if (isRegistered) {
//           setFaceCheckStatus("registered");
//         } else {
//           setFaceCheckStatus("not-registered");
//         }
//       } catch (err) {
//         console.error("Error checking face registration:", err);
//         setFaceCheckStatus("error");
//       }
//     }

//     checkAndMaybeShowPopup();

//     return () => {
//       mounted = false;
//     };
//   }, [meId, BACKEND_URL, API_KEY]);

//   return (
//     <div>
//       {faceCheckStatus === "not-registered" && (
//         <div className="reg-popup-overlay">
//           <div className="reg-popup-content">
//             <SaveFaceData
//               onClose={() => {
//                 setFaceCheckStatus("registered");
//               }}
//             />
//           </div>
//         </div>
//       )}

//       <div className="EmpDashCards1234">
//         <EmpDashCards />
//       </div>

//       <div className="empcardcharts123">
//         <EmpSessions />
//         <EmpWorkDays />
//         <EmpReImbursement />
//       </div>

//       <div className="mydailyworkhour123">
//         <MyDailyWorkHour />
//       </div>

//       <div className="EmpLeaveTracker123">
//         <EmpLeaveTracker />
//       </div>
//     </div>
//   );
// }


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
  const { user } = useAuth();
  const meId = user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [faceCheckStatus, setFaceCheckStatus] = useState("pending");

  function getHeaders() {
    const headers = {};
    if (API_KEY) headers["x-api-key"] = API_KEY;
    if (meId) headers["x-employee-id"] = meId;
    if (orgId) headers["x-org-id"] = orgId;
    return headers;
  }

  useEffect(() => {
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
          if (!mounted) return;

          setFaceCheckStatus("registered");
          return;
        }

        const url = `${
          BACKEND_URL?.replace(/\/$/, "") || ""
        }/api/face/check/${encodeURIComponent(meId)}`;

        const resp = await axios.get(url, { withCredentials: true, headers });
        if (!mounted) return;

        console.debug("face check response:", resp?.data);

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
        setFaceCheckStatus("error");
      }
    }

    checkAndMaybeShowPopup();

    return () => {
      mounted = false;
    };
  }, [meId, BACKEND_URL, API_KEY]);

  return (
    <div>
      {faceCheckStatus === "not-registered" && (
        <div className="reg-popup-overlay">
          <div className="reg-popup-content">
            <SaveFaceData
              onClose={() => {
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

      <div className="EmpLeaveTracker123">
        <EmpLeaveTracker />
      </div>
    </div>
  );
}
