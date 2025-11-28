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
      <div className="self-compact-list">
  {sortedRequests.map((request) => (
    <details key={request.id || request.leave_id} className="compact-item">
      <summary className="compact-summary">
        <div className="compact-main">
          <strong>{request.leave_type}</strong>
          <span className="compact-dates">
            {parseLocalDate(request.start_date)} - {parseLocalDate(request.end_date)}
          </span>
        </div>
        {renderStatusLabel(request.status)}
      </summary>
      <div className="compact-details">
        <div><strong>Type:</strong> {request.H_F_day}</div>
        {request.reason && <div><strong>Reason:</strong> {request.reason}</div>}
        {request.comments && <div><strong>Comments:</strong> {request.comments}</div>}
        <div className="compact-actions">
          <button disabled={!isEditable(request.status)} onClick={() => onEdit(request)}>Edit</button>
          <button disabled={!isEditable(request.status)} onClick={() => onCancel(request.id || request.leave_id)}>Cancel</button>
        </div>
      </div>
    </details>
  ))}
</div>
    </>
  );
}
