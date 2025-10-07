"use client";

import React from "react";
import LoginChart from "./LoginChart.client";
import TotalEmployee from "./TotalEmployee.client";
import EmployeeByDepartment from "./EmployeeByDepartment.client";
import SalaryBreakupChart from "./SalaryBreakupChart.client";
import Dashboardcard from "./Dashboardcard.client";
import "./MyDashboard.css";

export default function MyDashboard() {
  return (
    <div>
      <div className="dashboard-logingraph">
        <LoginChart />
      </div>

      <div className="admindashboardpiecharts">
        <TotalEmployee />
        <EmployeeByDepartment />
        <SalaryBreakupChart />
      </div>

      <div className="dashboard-card-containers">
        <Dashboardcard />
      </div>
    </div>
  );
}
