"use client";

import React, { useState, useEffect, useRef } from "react";
import "./MonthlyScheduleTable.css";
import { useAuth } from "../../context/AuthProvider.client";
import { FiDownload } from "react-icons/fi";

const getCurrentMonthYear = () => {
  const now = new Date();
  return now.toLocaleString("default", { month: "long", year: "numeric" });
};

const MonthlyScheduleTable = ({
  initialFinancialDetails = [],
  monthlyFixedAmount,
  service_description = "",
  onFinancialDetailsChange,
  onMonthlyFixedAmountChange,
  downloadAllAttachments,
  projectData,
  editable = false,
}) => {
  const { user } = useAuth();

  const rawRole = user?.role || user?.userRole || "";
  const userRole = String(rawRole).toLowerCase();
  const dashboardData = user?.dashboardData || user?.dashboard || {};
  const department = (dashboardData.department || "").toLowerCase();

  const allowed =
    userRole === "admin" ||
    (userRole === "manager" && department === "finance");

  if (!allowed)
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
        You do not have permission to view this section.
      </div>
    );

  const employeeId = user?.employeeId ?? user?.id ?? null;

  const [financialDetails, setFinancialDetails] = useState([]);
  const initRef = useRef(false);
  const currentMonthYear = getCurrentMonthYear();

  useEffect(() => {
    if (!initRef.current) {
      let source =
        Array.isArray(initialFinancialDetails) && initialFinancialDetails.length
          ? initialFinancialDetails
          : [];

      const currentExists = source.some(
        (row) => row.month_year === currentMonthYear
      );

      if (!currentExists) {
        source = [
          ...source,
          {
            month_year: currentMonthYear,
          },
        ];
      }

      const seeded = source.map((raw) => {
        const id = raw.id ?? null;
        const m_actual_amount = raw.m_actual_amount ?? 0;

        const m_tds_percentage =
          raw.m_tds_percentage != null
            ? raw.m_tds_percentage
            : m_actual_amount
            ? (Number(raw.m_tds_amount || 0) / m_actual_amount) * 100
            : 0;

        const m_tds_amount =
          raw.m_tds_amount != null
            ? raw.m_tds_amount
            : (m_actual_amount * (m_tds_percentage || 0)) / 100;

        const m_gst_percentage =
          raw.m_gst_percentage != null
            ? raw.m_gst_percentage
            : m_actual_amount
            ? (Number(raw.m_gst_amount || 0) / m_actual_amount) * 100
            : 0;

        const m_gst_amount =
          raw.m_gst_amount != null
            ? raw.m_gst_amount
            : (m_actual_amount * (m_gst_percentage || 0)) / 100;

        const m_total_amount =
          raw.m_total_amount != null
            ? raw.m_total_amount
            : m_actual_amount + (m_gst_amount || 0) - (m_tds_amount || 0);

        return {
          id,
          milestone_id: raw.milestone_id ?? null,
          month_year: raw.month_year || currentMonthYear,
          service_description: raw.service_description ?? "",
          monthly_fixed_amount:
            raw.monthly_fixed_amount ?? monthlyFixedAmount ?? 0,

          m_actual_amount,
          m_tds_percentage,
          m_tds_amount,
          m_gst_percentage,
          m_gst_amount,
          m_total_amount,

          status: raw.status ?? "Pending",
          completed_date: raw.completed_date ?? "",
        };
      });

      setFinancialDetails(seeded);
      initRef.current = true;
    }
  }, [initialFinancialDetails, monthlyFixedAmount, currentMonthYear]);

  useEffect(() => {
    if (initRef.current) {
      onFinancialDetailsChange?.(
        financialDetails,
        service_description,
        employeeId
      );
    }
  }, [
    financialDetails,
    service_description,
    employeeId,
    onFinancialDetailsChange,
  ]);

  useEffect(() => {
    setFinancialDetails((rows) =>
      rows.map((r) => {
        const m_actual_amount = Number(r.m_actual_amount || 0);
        const tdsPerc = Number(r.m_tds_percentage || 0);
        const gstPerc = Number(r.m_gst_percentage || 0);

        const m_tds_amount = (m_actual_amount * tdsPerc) / 100;
        const m_gst_amount = (m_actual_amount * gstPerc) / 100;
        const m_total_amount = m_actual_amount + m_gst_amount - m_tds_amount;

        return {
          ...r,
          monthly_fixed_amount: monthlyFixedAmount,
          m_tds_amount,
          m_gst_amount,
          m_total_amount,
        };
      })
    );
  }, [monthlyFixedAmount]);

  const updateFinancialDetails = (newDetails) => {
    setFinancialDetails(newDetails);
  };

  const handleInputChange = (idx, field, raw) => {
    if (!editable) return;

    const rows = [...financialDetails];
    const row = { ...rows[idx] };

    const isTextField = field === "service_description" || field === "status";
    const val = isTextField ? raw : parseFloat(raw) || 0;

    row[field] = val;

    const m_actual_amount = Number(row.m_actual_amount || 0);
    const tdsPerc = Number(row.m_tds_percentage || 0);
    const gstPerc = Number(row.m_gst_percentage || 0);

    row.m_tds_amount = (m_actual_amount * tdsPerc) / 100;
    row.m_gst_amount = (m_actual_amount * gstPerc) / 100;
    row.m_total_amount = m_actual_amount + row.m_gst_amount - row.m_tds_amount;

    if (field === "status" && val === "Received" && !row.completed_date) {
      row.completed_date = new Date().toISOString().split("T")[0];
    }

    rows[idx] = row;
    updateFinancialDetails(rows);
  };

  return (
    <div className="schedule-wrapper">
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="estimated-amount">
          <label>Monthly Fixed Amount</label>
          <input
            type="number"
            value={monthlyFixedAmount ?? ""}
            onChange={(e) => {
              if (!editable) return;
              const amt = parseFloat(e.target.value) || 0;
              onMonthlyFixedAmountChange?.(
                amt,
                service_description,
                employeeId
              );
            }}
            readOnly={!editable}
          />
        </div>

        {projectData && projectData.id && downloadAllAttachments && (
          <div style={{ marginLeft: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 16,
                fontWeight: "bold",
                opacity: 0.8,
              }}
            >
              Project Docs
            </label>
            <FiDownload
              className="pj-download"
              style={{ cursor: "pointer", fontSize: 22, marginLeft: 25 }}
              onClick={() => downloadAllAttachments(projectData.id, employeeId)}
              title="Download all project attachments"
            />
          </div>
        )}
      </div>

      <table className="schedule-table">
        <thead>
          <tr>
            <th>Sl No</th>
            <th>Month/Year</th>
            <th>Service Description</th>
            <th>Monthly Amount</th>
            <th>TDS</th>
            <th>GST</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Received Date</th>
          </tr>
        </thead>

        <tbody>
          {financialDetails.map((f, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{f.month_year}</td>
              <td>
                <input
                  type="text"
                  value={f.service_description || ""}
                  onChange={(e) =>
                    handleInputChange(
                      idx,
                      "service_description",
                      e.target.value
                    )
                  }
                  readOnly={!editable}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={f.m_actual_amount ?? ""}
                  onChange={(e) =>
                    handleInputChange(idx, "m_actual_amount", e.target.value)
                  }
                  readOnly={!editable}
                />
              </td>
              <td>
                <div className="monthly-group">
                  <input
                    type="number"
                    value={f.m_tds_percentage ?? ""}
                    onChange={(e) =>
                      handleInputChange(idx, "m_tds_percentage", e.target.value)
                    }
                    readOnly={!editable}
                  />{" "}
                  %<input readOnly type="number" value={f.m_tds_amount ?? ""} />
                </div>
              </td>
              <td>
                <div className="monthly-group">
                  <input
                    type="number"
                    value={f.m_gst_percentage ?? ""}
                    onChange={(e) =>
                      handleInputChange(idx, "m_gst_percentage", e.target.value)
                    }
                    readOnly={!editable}
                  />{" "}
                  %<input readOnly type="number" value={f.m_gst_amount ?? ""} />
                </div>
              </td>
              <td>
                <input readOnly type="number" value={f.m_total_amount ?? ""} />
              </td>
              <td>
                <select
                  value={f.status ?? "Pending"}
                  onChange={(e) =>
                    handleInputChange(idx, "status", e.target.value)
                  }
                  disabled={!editable}
                >
                  <option>Pending</option>
                  <option>Received</option>
                </select>
              </td>
              <td>
                <input readOnly type="date" value={f.completed_date ?? ""} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyScheduleTable;
