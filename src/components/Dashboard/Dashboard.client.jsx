"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar.client";
import Topbar from "./Topbar.client";
import "./Dashboard.css";
import axios from "axios";
import BirthdayCard from "../BirthdayCard/BirthdayCard.client";
import { isBirthdayToday } from "../../utils/checkBirthday";
import { ContentContext } from "./Context.client";
import { useAuth } from "../../context/AuthProvider.client";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeContent, setActiveContent] = useState(null);
  const [showBirthday, setShowBirthday] = useState(false);
  const [employeeName, setEmployeeName] = useState("");

  const email =
    user?.raw?.email ?? user?.dashboard?.email ?? user?.email ?? null;
  const meId = user?.employeeId ?? user?.id ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const headers = meId
    ? { "x-api-key": API_KEY, "x-employee-id": meId }
    : { "x-api-key": API_KEY };

  useEffect(() => {
    let cancelled = false;
    const fetchBirthday = async () => {
      if (!email) return;
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/employee/birthday/${email}`,
          { headers }
        );
        const { full_name, first_name, dob } = response.data || {};
        const nameToUse = full_name || first_name || "there";
        if (isBirthdayToday(dob) && !cancelled) {
          setEmployeeName(nameToUse);
          setShowBirthday(true);
          setTimeout(() => setShowBirthday(false), 25000);
        }
      } catch (error) {
        console.error("❌ Error fetching birthday:", error);
      }
    };

    fetchBirthday();
    return () => {
      cancelled = true;
    };
  }, [email, BACKEND_URL, headers]);

  const renderContent = () => (
    <div className="content-container-design">
      <div>{activeContent}</div>
    </div>
  );

  return (
    <ContentContext.Provider value={{ setActiveContent }}>
      <div className="Dashboard123">
        <div className="Dashboarddesign">
          <div className="dashboard">
            {showBirthday && <BirthdayCard name={employeeName} />}
            <Topbar />
            <div className="content-container">
              <Sidebar setActiveContent={setActiveContent} />
              <div className="main-content">{renderContent()}</div>
            </div>
          </div>
        </div>
      </div>
    </ContentContext.Provider>
  );
};

export default Dashboard;
