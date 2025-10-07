// src/components/LeaveQueries/SelfTable.client.jsx
"use client";

import React from "react";
import { parseLocalDate } from "./leaveUtils.client";
import { MdOutlineEdit, MdDeleteOutline } from "react-icons/md";

export default function SelfTable({ leaveRequests, onEdit, onCancel }) {
  const sortedRequests = (leaveRequests.self || []).sort((a, b) =>
    String(b.start_date).localeCompare(String(a.start_date))
  );

  const isEditable = (status) => status !== "Approved" && status !== "Rejected";

  const renderStatusLabel = (status) => {
    const classes =
      status === "Approved"
        ? "leave-approved"
        : status === "Rejected"
        ? "leave-rejected"
        : "";
    return <span className={`leave-status-label ${classes}`}>{status}</span>;
  };

  return (
    <>
      <h4 className="my-leaves">My Leave Requests</h4>

      {/* Desktop table */}
      <div className="leave-request-table desktop-view">
        <table className="leave-requests">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Half/Full Day</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Comments</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.map((request) => (
              <tr key={request.id || request.leave_id}>
                <td>{request.leave_type}</td>
                <td>{parseLocalDate(request.start_date)}</td>
                <td>{parseLocalDate(request.end_date)}</td>
                <td>{request.H_F_day}</td>
                <td className="comment-col">
                  <div className="comment-preview">{request.reason}</div>
                </td>
                <td>{renderStatusLabel(request.status)}</td>
                <td className="comment-col">
                  <div className="comment-preview">{request.comments}</div>
                </td>
                <td>
                  <MdOutlineEdit
                    onClick={() =>
                      isEditable(request.status) && onEdit(request)
                    }
                    className={`action-button ${
                      !isEditable(request.status) ? "disabled" : ""
                    }`}
                  />
                  <MdDeleteOutline
                    onClick={() =>
                      isEditable(request.status) &&
                      onCancel(request.id || request.leave_id)
                    }
                    className={`action-button ${
                      !isEditable(request.status) ? "disabled" : ""
                    }`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-view">
        {sortedRequests.map((request) => (
          <div key={request.id || request.leave_id} className="leave-card">
            <div className="leave-header">
              <span className="leave-type">{request.leave_type}</span>
              {renderStatusLabel(request.status)}
            </div>
            <div className="leave-details">
              <p>
                <strong>Start:</strong> {parseLocalDate(request.start_date)}
              </p>
              <p>
                <strong>End:</strong> {parseLocalDate(request.end_date)}
              </p>
              <p>
                <strong>Day Type:</strong> {request.H_F_day}
              </p>
              <p>
                <strong>Reason:</strong> {request.reason}
              </p>
              <p>
                <strong>Comments:</strong> {request.comments}
              </p>
            </div>
            <div className="leave-actions">
              <MdOutlineEdit
                onClick={() => isEditable(request.status) && onEdit(request)}
                className={`action-button ${
                  !isEditable(request.status) ? "disabled" : ""
                }`}
              />
              <MdDeleteOutline
                onClick={() =>
                  isEditable(request.status) &&
                  onCancel(request.id || request.leave_id)
                }
                className={`action-button ${
                  !isEditable(request.status) ? "disabled" : ""
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
