"use client";

import React, { useState } from "react";
import SalaryBreakupMain from "./SalaryBreakupMain.client";
import SalaryDetails from "./SalaryDetails/SalaryDetails.client";
import CreateCompensation from "./CreateCompensation.client";
import AssignCompensation from "./AssignCompensation.client";

import "./CompensationWrapper.css";

const CompensationWrapper = () => {
  const [currentView, setCurrentView] = useState("home");

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const renderContent = () => {
    switch (currentView) {
      case "breakup":
        return <SalaryBreakupMain />;

      case "details":
        return <SalaryDetails />;

      case "create":
        return <CreateCompensation />;

      case "assign":
        return <AssignCompensation />;

      case "home":
      default:
        return (
          <div className="home-view">
            <h2 className="title">Compensation Management</h2>
            <p className="subtitle">Select an option to proceed:</p>
            <div className="buttons-container">
              <button
                className="compensation-btn"
                onClick={() => handleNavigation("create")}
              >
                Create Compensation Plan
              </button>

              <button
                className="compensation-btn"
                onClick={() => handleNavigation("assign")}
              >
                Assign Compensation Plan
              </button>

              <button
                className="compensation-btn primary"
                onClick={() => handleNavigation("breakup")}
              >
                Salary Breakup
              </button>

              <button
                className="compensation-btn"
                onClick={() => handleNavigation("details")}
              >
                Salary Details
              </button>
            </div>
          </div>
        );
    }
  };

  const showBackButton = currentView !== "home";

  return (
    <div className="compensation-wrapper">
      {showBackButton && (
        <div className="back-button-container">
          <button className="back-btn" onClick={() => handleNavigation("home")}>
            ← Back to Menu
          </button>
        </div>
      )}

      <div className="content-area">{renderContent()}</div>
    </div>
  );
};

export default CompensationWrapper;
