"use client";

import React from "react";
import { MdAddCircleOutline, MdAssignmentInd, MdPieChart, MdDescription } from "react-icons/md";

const CompensationOptions = ({ onSelect }) => {
  const options = [
    { label: "Create Compensation", path: "/compensation/create", icon: <MdAddCircleOutline /> },
    { label: "Assign Compensation", path: "/compensation/assign", icon: <MdAssignmentInd /> },
    { label: "Salary Breakup", path: "/compensation/breakup", icon: <MdPieChart /> },
    { label: "Salary Details", path: "/compensation/details", icon: <MdDescription /> },
  ];

  return (
    <div className="comp-options-container">
      <h2>Select Compensation Action</h2>

      <div className="comp-options-grid">
        {options.map((item, i) => (
          <div
            key={i}
            className="comp-option-card"
            onClick={() => onSelect(item.path)}
          >
            <div className="icon">{item.icon}</div>
            <p>{item.label}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .comp-options-container {
          padding: 20px;
        }
        .comp-options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .comp-option-card {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 10px;
          cursor: pointer;
          text-align: center;
          transition: 0.2s;
        }
        .comp-option-card:hover {
          background: #f4f4f4;
          border-color: green;
        }
        .icon {
          font-size: 35px;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
};

export default CompensationOptions;
