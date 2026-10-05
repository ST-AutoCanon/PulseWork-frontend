

"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar.client";
import Topbar from "./Topbar.client";
import "./Dashboard.css";
import { ContentContext } from "./Context.client";
import { useAuth } from "../../context/AuthProvider.client";

const Dashboard = () => {
  const { user, hydrated } = useAuth();

  const [activeContent, setActiveContent] = useState(null);

  /*
   * Keep auth context available here because Dashboard
   * depends on the logged-in user/session.
   *
   * Birthday API handling is now completely handled by
   * BirthdayCard inside the employee dashboard.
   */
  void user;
  void hydrated;

  /*
   * ---------------------------------------------------------
   * Render dashboard content
   * ---------------------------------------------------------
   */
  const renderContent = () => (
    <div className="content-container-design">
      <div>{activeContent}</div>
    </div>
  );

  return (
    <ContentContext.Provider
      value={{ setActiveContent }}
    >
      <div className="Dashboard123">
        <div className="Dashboarddesign">
          <div className="dashboard">
            <Topbar />

            <div className="content-container">
              <Sidebar
                setActiveContent={setActiveContent}
              />

              <div className="main-content">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentContext.Provider>
  );
};

export default Dashboard;
