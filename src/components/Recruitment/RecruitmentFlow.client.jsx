"use client";

import React from "react";
import { useAuth } from "../../context/AuthProvider.client";
import AdminRecruitmentDashboard from "./AdminRecruitmentDashboard.client";
import InterviewerRecruitmentDashboard from "./InterviewerRecruitmentDashboard.client";

export default function RecruitmentFlow() {
  const { user } = useAuth();

  const role = String(user?.role || user?.raw?.role || "").toLowerCase();

  const isAdminOrHR =
    role === "admin" || role === "hr" || role === "superadmin";

  return isAdminOrHR ? (
    <AdminRecruitmentDashboard />
  ) : (
    <InterviewerRecruitmentDashboard />
  );
}
