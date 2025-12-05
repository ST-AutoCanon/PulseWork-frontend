"use client";

import React, { useState, useEffect } from "react";
import "./DownloadDetailsList.css";
import { useAuth } from "../../context/AuthProvider.client";

const formatDateIST = (dateString, withTime = false) => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString || "—";
    if (withTime) {
      return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    }
    return d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch {
    return dateString || "—";
  }
};

const safeNumber = (v) => {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
};

const DownloadDetailsList = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!BACKEND_URL) throw new Error("Backend URL not configured");
        const headers = {
          "Content-Type": "application/json",
          "x-api-key": API_KEY || "",
        };
        const orgId =
          user?.orgId ||
          user?.raw?.org_id ||
          user?.org_id ||
          user?.organization_id;
        if (orgId) headers["x-org-id"] = orgId;
        const meId = user?.employeeId ?? user?.id ?? null;
        if (meId) headers["x-employee-id"] = String(meId);

        const resp = await fetch(`${BACKEND_URL}/download-details`, {
          credentials: "include",
          headers,
        });
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const json = await resp.json();

        const downloadDetails =
          json?.downloadDetails ?? json?.message ?? json ?? [];

        if (mounted)
          setRecords(Array.isArray(downloadDetails) ? downloadDetails : []);
      } catch (err) {
        console.error("Fetch download details failed:", err);
        if (mounted) setError(err.message || "Failed to fetch records");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      mounted = false;
    };
  }, [user, BACKEND_URL, API_KEY]);

  const toggleRow = (id) =>
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );

  if (loading) return <p>Loading download records…</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div className="download-details-container">
      <h2>Download Details</h2>

      {records.length === 0 ? (
        <p>No download records found.</p>
      ) : (
        <table className="download-table">
          <thead>
            <tr>
              <th>Sl No.</th>
              <th>Invoice No.</th>
              <th>Type</th>
              <th>To</th>
              <th>Date</th>
              <th>Total (Incl. Tax)</th>
              <th>Downloaded At</th>
              <th>Details</th>
            </tr>
          </thead>

          <tbody>
            {records.map((r, idx) => {
              const totalInc = safeNumber(r.totalIncludingTax);
              const lineItems = Array.isArray(r.lineItems) ? r.lineItems : [];

              return (
                <React.Fragment key={r.id ?? `${idx}-${r.invoiceNumber || ""}`}>
                  <tr>
                    <td>{idx + 1}</td>
                    <td>{r.invoiceNumber ?? "—"}</td>
                    <td>{r.invoiceType ?? "—"}</td>
                    <td>{r.toName ?? r.to ?? "—"}</td>
                    <td>{formatDateIST(r.invoiceDate)}</td>
                    <td>{totalInc.toFixed(2)}</td>
                    <td>{formatDateIST(r.createdAt, true)}</td>
                    <td>
                      <button
                        className="d-toggle-btn"
                        onClick={() => toggleRow(r.id)}
                      >
                        {expandedRows.includes(r.id) ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>

                  {expandedRows.includes(r.id) && (
                    <tr className="expanded-content">
                      <td colSpan={8}>
                        <strong>Items:</strong>
                        <table className="line-items-table">
                          <thead>
                            <tr>
                              <th>Sl. No.</th>
                              <th>Description</th>
                              <th>Qty</th>
                              <th>Rate</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lineItems.length === 0 ? (
                              <tr>
                                <td colSpan={5}>No line items</td>
                              </tr>
                            ) : (
                              lineItems.map((item, i) => (
                                <tr key={i}>
                                  <td>{i + 1}</td>
                                  <td>
                                    {item.description ?? item.name ?? "—"}
                                  </td>
                                  <td>{item.quantity ?? item.qty ?? "—"}</td>
                                  <td>
                                    {Number(item.rate ?? item.unitPrice ?? 0)
                                      .toFixed(2)
                                      .toString()}
                                  </td>
                                  <td>
                                    {Number(item.total ?? item.amount ?? 0)
                                      .toFixed(2)
                                      .toString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>

                        <div className="order-details">
                          <strong>Order Details:</strong>
                          <ul className="other-info-list">
                            <li>
                              <strong>Address:</strong> {r.address ?? "—"}
                            </li>
                            <li>
                              <strong>Contact:</strong> {r.contact ?? "—"}
                            </li>
                            <li>
                              <strong>GSTIN:</strong> {r.companyGst ?? "—"}
                            </li>
                            <li>
                              <strong>State:</strong> {r.state ?? "—"}
                            </li>
                            <li>
                              <strong>Reference:</strong> {r.referenceId ?? "—"}
                              {r.referenceDate
                                ? ` on ${formatDateIST(r.referenceDate)}`
                                : ""}
                            </li>
                            <li>
                              <strong>Place of Supply:</strong>{" "}
                              {r.placeOfSupply ?? "—"}
                            </li>
                            <li>
                              <strong>With Seal:</strong>{" "}
                              {r.withSeal ? "Yes" : "No"}
                            </li>
                            <li>
                              <strong>Sub Total:</strong>{" "}
                              {safeNumber(r.subTotal).toFixed(2)}
                            </li>
                            <li>
                              <strong>Advance:</strong>{" "}
                              {safeNumber(r.advance).toFixed(2)}
                            </li>
                            <li>
                              <strong>GST %:</strong> {r.gst ?? "—"}
                            </li>
                            <li>
                              <strong>GST Amount:</strong>{" "}
                              {safeNumber(r.gstAmount).toFixed(2)}
                            </li>
                            <li>
                              <strong>Total Excl. Tax:</strong>{" "}
                              {safeNumber(r.totalExcludingTax).toFixed(2)}
                            </li>
                            <li>
                              <strong>Terms:</strong> {r.terms ?? "—"}
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DownloadDetailsList;
