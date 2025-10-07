"use client";

import React, { useEffect, useState } from "react";
import "./EmpProjectTable.css";

export default function EmpProjectTable() {
  const [previousProjects, setPreviousProjects] = useState([]);
  const [currentProjects, setCurrentProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("current");

  useEffect(() => {
    let cancelled = false;
    fetch("/currentProjectsData.json")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setCurrentProjects(data.projects || []);
      })
      .catch((error) =>
        console.error("Error fetching current projects data:", error)
      );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/previousProjectsData.json")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setPreviousProjects(data.projects || []);
      })
      .catch((error) =>
        console.error("Error fetching previous projects data:", error)
      );
    return () => {
      cancelled = true;
    };
  }, []);

  const list = activeTab === "previous" ? previousProjects : currentProjects;

  return (
    <div className="emp-projects-container">
      <div className="emp-tabs">
        <div
          className={`emp-tab ${activeTab === "previous" ? "emp-active" : ""}`}
          onClick={() => setActiveTab("previous")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("previous")}
        >
          Previous Projects
        </div>
        <div
          className={`emp-tab ${activeTab === "current" ? "emp-active" : ""}`}
          onClick={() => setActiveTab("current")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("current")}
        >
          Current Projects
        </div>
      </div>

      <div className="emp-projects-table">
        <h3 className="emp-sub-heading">
          {activeTab === "previous" ? "Previous Projects" : "Current Projects"}
        </h3>
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Department</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No projects found
                </td>
              </tr>
            ) : (
              list.map((project, index) => (
                <tr key={index}>
                  <td>{project.projectName}</td>
                  <td>{project.dept}</td>
                  <td>{project.startDate}</td>
                  <td>{project.endDate}</td>
                  <td>{project.comments}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
