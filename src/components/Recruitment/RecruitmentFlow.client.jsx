"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthProvider.client";
import AdminRecruitmentDashboard from "./AdminRecruitmentDashboard.client";
import InterviewerRecruitmentDashboard from "./InterviewerRecruitmentDashboard.client";

export default function RecruitmentFlow() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("board");

  const role = String(user?.role || user?.raw?.role || "").toLowerCase();

  const isAdmin = role === "admin" || role === "superadmin";
  const isHR = role === "hr" || role === "superadmin";

  if (isHR) {
    return (
      <div>
        <div
          className="rf-view-switcher"
          role="tablist"
          aria-label="Recruitment views"
        >
          <button
            type="button"
            className={`rf-view-tab ${activeView === "board" ? "active" : ""}`}
            onClick={() => setActiveView("board")}
          >
            Recruitment Board
          </button>
          <button
            type="button"
            className={`rf-view-tab ${activeView === "interviewer" ? "active" : ""}`}
            onClick={() => setActiveView("interviewer")}
          >
            Interviewer Queue
          </button>
        </div>

        {activeView === "board" ? (
          <AdminRecruitmentDashboard />
        ) : (
          <InterviewerRecruitmentDashboard />
        )}
      </div>
    );
  }

  if (isAdmin) {
    return <AdminRecruitmentDashboard />;
  }

  return <InterviewerRecruitmentDashboard />;
}
