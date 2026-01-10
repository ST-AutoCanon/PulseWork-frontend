// "use client";

// import React from "react";
// import "./BirthdayCard.css";

// const BirthdayCard = ({ name }) => {
//   const blast = Array.from({ length: 1000 }, (_, i) => (
//     <div key={i} className="blast-piece" style={{ "--i": i }} />
//   ));

//   return (
//     <div className="birthday-card">
//       <div className="birthday-blast-container">{blast}</div>
//       <div className="sparkles">🎉🎂🎉</div>
//       <h2>🎉 Happy Birthday, {name}! 🎉</h2>
//       <p>
//         sukalpatechsolutions Wishing you a day filled with joy, success, and
//         celebration. 🎂🎈
//       </p>
//     </div>
//   );
// };

// export default BirthdayCard;

"use client";

import React, { useEffect, useState } from "react";
import "./BirthdayCard.css";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";

const BirthdayCard = ({ name }) => {
  const { user, hydrated } = useAuth();
  const [orgName, setOrgName] = useState("Loading...");

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const meId = user?.employeeId ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

  useEffect(() => {
    let mounted = true;
    if (!hydrated || !orgId) return;

    const fetchOrgName = async () => {
      try {
        const resp = await axios.get(`${BACKEND_URL}/org/${orgId}`, {
          withCredentials: true,
          headers: { "x-api-key": API_KEY || "", "x-employee-id": meId || "0" },
        });
        if (!mounted) return;
        const org = resp?.data?.subdomain || resp?.data?.name || "Your Organization";
        setOrgName(org);
      } catch (err) {
        if (mounted) setOrgName("Your Organization");
        console.error("Error fetching organization name:", err);
      }
    };

    fetchOrgName();
    return () => (mounted = false);
  }, [hydrated, orgId, BACKEND_URL, API_KEY, meId]);

  const blast = Array.from({ length: 1000 }, (_, i) => (
    <div key={i} className="blast-piece" style={{ "--i": i }} />
  ));

  return (
    <div className="birthday-card">
      <div className="birthday-blast-container">{blast}</div>
      <div className="sparkles">🎉🎂🎉</div>
      <h2>🎉 Happy Birthday, {name}! 🎉</h2>
      <p>
        {orgName} wishes you a day filled with joy, success, and celebration. 🎂🎈
      </p>
    </div>
  );
};

export default BirthdayCard;
