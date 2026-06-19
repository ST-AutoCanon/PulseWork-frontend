"use client";

import React, { useState, useEffect, useRef } from "react";
import "./DownloadDetailsList.css";
import { useAuth } from "../../context/AuthProvider.client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvoiceTemplate from "./InvoiceTemplate.client";
import DownloadForm from "./DownloadForm.client";
import { FiEye, FiDownload } from "react-icons/fi";
import { MdOutlineEdit } from "react-icons/md";
import { Country } from "country-state-city";
import Modal from "../Modal/Modal.client";
import { FiMoreVertical } from "react-icons/fi";

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

const normalizeInvoiceTypeLabel = (value) => {
  const t = String(value || "")
    .trim()
    .toLowerCase();

  switch (t) {
    case "tax":
    case "tax invoice":
      return "Tax Invoice";
    case "proforma":
    case "proforma invoice":
      return "Proforma Invoice";
    case "quotation":
      return "Quotation";
    case "po":
    case "purchase order":
      return "Purchase Order";
    case "credit":
    case "credit note":
      return "Credit Note";
    default:
      return "Tax Invoice";
  }
};

const normalizeInvoiceTypeKey = (value) => {
  const t = String(value || "")
    .trim()
    .toLowerCase();

  if (t.includes("proforma")) return "proforma";
  if (t.includes("quotation")) return "quotation";
  if (t.includes("purchase order") || t === "po") return "po";
  if (t.includes("credit note") || t === "credit") return "credit";
  return "tax";
};

const normalizeLineItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    description: item?.description || item?.name || "",
    partNumber: item?.partNumber || item?.part_number || "",
    hsnSac: item?.hsnSac || item?.hsn || "",
    quantity: item?.quantity ?? item?.qty ?? 0,
    rate: item?.rate ?? item?.unitPrice ?? 0,
    total: item?.total ?? item?.amount ?? 0,
  }));
};

const getCountryDisplayName = (value) => {
  const code = String(value || "").trim();
  if (!code) return "—";

  const match = Country.getCountryByCode(code);
  return match?.name || code;
};

const DownloadDetailsList = ({
  refreshKey,
  customers = [],
  onDuplicate,
  onCancelRecord,
}) => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [redownloadDetails, setRedownloadDetails] = useState({});
  const [redownloadInvoiceType, setRedownloadInvoiceType] =
    useState("Tax Invoice");
  const [redownloadInvoiceNumber, setRedownloadInvoiceNumber] = useState("");
  const [pendingRedownloadId, setPendingRedownloadId] = useState(null);
  const [successNotice, setSuccessNotice] = useState({
    isVisible: false,
    title: "Success",
    message: "",
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const closeSuccessNotice = () => {
    setSuccessNotice({ isVisible: false, title: "Success", message: "" });
  };
  const [viewTemplateRecord, setViewTemplateRecord] = useState(null);
  const [showViewTemplateModal, setShowViewTemplateModal] = useState(false);
  const [pendingCancelRecord, setPendingCancelRecord] = useState(null);
  const printRef = useRef(null);
  const [filterInvoiceType, setFilterInvoiceType] = useState("All");
  const [filterInvoiceNumber, setFilterInvoiceNumber] = useState("");
  const [filterToValue, setFilterToValue] = useState("");
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const orgId =
    user?.orgId || user?.raw?.org_id || user?.org_id || user?.organization_id;

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

        if (mounted) {
          setRecords(Array.isArray(downloadDetails) ? downloadDetails : []);
        }
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
  }, [user, BACKEND_URL, API_KEY, refreshKey, orgId]);

  const toggleRow = (id) =>
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );

  const buildDownloadDetails = (record) => {
    const lineItems = Array.isArray(record.lineItems) ? record.lineItems : [];

    return {
      invoiceNumber: record.invoiceNumber || "",
      invoiceType: record.invoiceType || "tax",
      isCancelled: Boolean(record.isCancelled),
      selectedCustomerId: "",
      to: record.toName || record.to || "",
      address: record.address || "",
      companyGst: record.companyGst || "",
      contact: record.contact || "",
      country: record.country || "",
      state: record.state || "",
      currency: record.currency || "",
      invoiceDate: record.invoiceDate,
      referenceDate: record.referenceDate,
      referenceId: record.referenceId,
      placeOfSupply: record.placeOfSupply,
      withSeal: record.withSeal,
      lineItems: lineItems.map((item) => ({
        description: item?.description || "",
        partNumber: item?.partNumber || item?.part_number || "",
        hsnSac: item?.hsnSac || item?.hsn || "",
        quantity: item?.quantity ?? 0,
        rate: item?.rate ?? 0,
        total: item?.total ?? 0,
      })),
      subTotal: record.subTotal,
      gst: record.gst,
      gstAmount: record.gstAmount,
      advance: record.advance,
      totalExcludingTax: record.totalExcludingTax,
      totalIncludingTax: record.totalIncludingTax,
      roundOff: Boolean(record.roundOff),
      roundOffAmount: record.roundOffAmount,
      finalTotalAmount: record.finalTotalAmount,
      terms: record.terms,
    };
  };

  const handleRedownload = async (record) => {
    setRedownloadDetails(buildDownloadDetails(record));
    setRedownloadInvoiceType(normalizeInvoiceTypeLabel(record.invoiceType));
    setRedownloadInvoiceNumber(record.invoiceNumber || "");
    setPendingRedownloadId(record.id ?? `${Date.now()}`);
  };

  const handleViewTemplate = (record) => {
    const details = buildDownloadDetails(record);
    setViewTemplateRecord({
      ...details,
      isCancelled: Boolean(record.isCancelled),
    });
    setShowViewTemplateModal(true);
  };

  const handleEdit = (record) => {
    const normalizedType = normalizeInvoiceTypeKey(record.invoiceType);

    setEditingRecord({
      id: record.id,
      invoiceType: normalizedType,
      invoiceNumber: record.invoiceNumber,
      selectedCustomerId: "",
      to: record.toName || record.to || "",
      address: record.address || "",
      contact: record.contact || "",
      companyGst: record.companyGst || "",
      country: record.country || "",
      state: record.state || "",
      currency: record.currency || "",
      invoiceDate: record.invoiceDate || "",
      referenceDate: record.referenceDate || "",
      referenceId: record.referenceId || "",
      placeOfSupply: record.placeOfSupply || "",
      withSeal: Boolean(record.withSeal),
      lineItems: Array.isArray(record.lineItems) ? record.lineItems : [],
      subTotal: record.subTotal || 0,
      gst: record.gst || 0,
      gstAmount: record.gstAmount || 0,
      advance: record.advance || 0,
      totalExcludingTax: record.totalExcludingTax || 0,
      totalIncludingTax: record.totalIncludingTax || 0,
      roundOff: Boolean(record.roundOff),
      roundOffAmount: record.roundOffAmount || 0,
      finalTotalAmount:
        record.finalTotalAmount || record.totalIncludingTax || 0,
      terms: record.terms || "",
    });

    setShowEditModal(true);
  };

  const handleSaveEdit = async (payload) => {
    if (!editingRecord?.id) return;

    try {
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY || "",
      };
      if (orgId) headers["x-org-id"] = orgId;
      const meId = user?.employeeId ?? user?.id ?? null;
      if (meId) headers["x-employee-id"] = String(meId);

      const resp = await fetch(
        `${BACKEND_URL}/download-details/${editingRecord.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers,
          body: JSON.stringify({
            invoiceType: normalizeInvoiceTypeKey(
              payload.invoiceType || editingRecord.invoiceType,
            ),
            invoiceNumber: editingRecord.invoiceNumber,
            to: payload.to,
            address: payload.address,
            contact: payload.contact,
            companyGst: payload.companyGst,
            country: payload.country,
            state: payload.state,
            currency: payload.currency,
            invoiceDate: payload.invoiceDate,
            referenceDate: payload.referenceDate,
            referenceId: payload.referenceId,
            placeOfSupply: payload.placeOfSupply,
            withSeal: payload.withSeal,
            lineItems: payload.lineItems,
            subTotal: payload.subTotal,
            gst: payload.gst,
            gstAmount: payload.gstAmount,
            advance: payload.advance,
            totalExcludingTax: payload.totalExcludingTax,
            totalIncludingTax: payload.totalIncludingTax,
            roundOff: payload.roundOff,
            roundOffAmount: payload.roundOffAmount,
            finalTotalAmount: payload.finalTotalAmount,
            terms: payload.terms,
          }),
        },
      );

      if (!resp.ok) {
        throw new Error(`Update failed (${resp.status})`);
      }

      const refreshed = await resp.json();
      const updatedRecord =
        refreshed?.downloadDetail || refreshed?.record || null;

      if (updatedRecord) {
        setRecords((prev) =>
          prev.map((r) => (r.id === editingRecord.id ? updatedRecord : r)),
        );
      } else {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === editingRecord.id
              ? {
                  ...r,
                  ...payload,
                  invoiceType: normalizeInvoiceTypeKey(
                    payload.invoiceType || editingRecord.invoiceType,
                  ),
                }
              : r,
          ),
        );
      }

      setShowEditModal(false);
      setEditingRecord(null);

      setSuccessNotice({
        isVisible: true,
        title: "Success",
        message: "Download details updated successfully.",
      });
    } catch (err) {
      console.error("Edit download details failed:", err);
      setError(err.message || "Failed to update");
    }
  };

  useEffect(() => {
    if (!pendingRedownloadId) return;

    const run = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (!printRef.current) return;

        const canvas = await html2canvas(printRef.current, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

        const filename = `${redownloadInvoiceNumber || "invoice"}.pdf`;
        pdf.save(filename);
      } catch (error) {
        console.error("Error generating PDF", error);
      } finally {
        setPendingRedownloadId(null);
      }
    };

    run();
  }, [
    pendingRedownloadId,
    redownloadDetails,
    redownloadInvoiceType,
    redownloadInvoiceNumber,
    orgId,
  ]);

  if (loading) return <p>Loading download records…</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  const filteredRecords = records.filter((r) => {
    const typeLabel = normalizeInvoiceTypeLabel(r.invoiceType);
    const invoiceNo = String(r.invoiceNumber || "").toLowerCase();
    const toValue = String(r.toName || r.to || "").toLowerCase();

    const matchesType =
      filterInvoiceType === "All" || typeLabel === filterInvoiceType;

    const matchesInvoiceNo = invoiceNo.includes(
      filterInvoiceNumber.trim().toLowerCase(),
    );

    const matchesToValue = toValue.includes(filterToValue.trim().toLowerCase());

    return matchesType && matchesInvoiceNo && matchesToValue;
  });

  return (
    <div className="download-details-container">
      <h2>Download Details</h2>

      <div className="download-filters">
        <select
          value={filterInvoiceType}
          onChange={(e) => setFilterInvoiceType(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="Tax Invoice">Tax Invoice</option>
          <option value="Proforma Invoice">Proforma Invoice</option>
          <option value="Quotation">Quotation</option>
          <option value="Purchase Order">Purchase Order</option>
          <option value="Credit Note">Credit Note</option>
        </select>

        <input
          type="text"
          placeholder="Search invoice no."
          value={filterInvoiceNumber}
          onChange={(e) => setFilterInvoiceNumber(e.target.value)}
        />

        <input
          type="text"
          placeholder="Search customer / to"
          value={filterToValue}
          onChange={(e) => setFilterToValue(e.target.value)}
        />

        <button
          type="button"
          className="download-form-button"
          onClick={() => {
            setFilterInvoiceType("All");
            setFilterInvoiceNumber("");
            setFilterToValue("");
          }}
        >
          Clear
        </button>
      </div>

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
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.map((r, idx) => {
              const totalInc = safeNumber(r.totalIncludingTax);
              const lineItems = Array.isArray(r.lineItems) ? r.lineItems : [];
              const rowType = normalizeInvoiceTypeKey(r.invoiceType);
              const typeLabel = normalizeInvoiceTypeLabel(r.invoiceType);

              return (
                <React.Fragment key={r.id ?? `${idx}-${r.invoiceNumber || ""}`}>
                  <tr className={r.isCancelled ? "cancelled-row" : ""}>
                    <td>{idx + 1}</td>
                    <td>{r.invoiceNumber ?? "—"}</td>
                    <td>{typeLabel}</td>
                    <td>{r.toName ?? r.to ?? "—"}</td>
                    <td>{formatDateIST(r.invoiceDate)}</td>
                    <td>{totalInc.toFixed(2)}</td>
                    <td>{formatDateIST(r.createdAt, true)}</td>
                    <td>
                      <button
                        className="d-icon-btn"
                        title={expandedRows.includes(r.id) ? "Hide" : "View"}
                        aria-label={
                          expandedRows.includes(r.id) ? "Hide" : "View"
                        }
                        onClick={() => toggleRow(r.id)}
                        type="button"
                      >
                        <FiEye />
                      </button>
                    </td>
                    <td>
                      <div className="d-actions">
                        <button
                          className="d-icon-btn"
                          title="Edit"
                          aria-label="Edit"
                          onClick={() => handleEdit(r)}
                          type="button"
                        >
                          <MdOutlineEdit />
                        </button>
                        <button
                          className="d-icon-btn"
                          title="Redownload"
                          aria-label="Redownload"
                          onClick={() => handleRedownload(r)}
                          type="button"
                        >
                          <FiDownload />
                        </button>
                        <button
                          className="d-icon-btn"
                          onClick={() =>
                            setOpenMenuId((prev) =>
                              prev === r.id ? null : r.id,
                            )
                          }
                        >
                          <FiMoreVertical />
                        </button>

                        {openMenuId === r.id && (
                          <div className="d-dropdown">
                            <button
                              type="button"
                              onClick={() => {
                                onDuplicate?.(r);
                                setOpenMenuId(null);
                              }}
                              className="d-dropdown-item"
                            >
                              Duplicate
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleViewTemplate(r);
                                setOpenMenuId(null);
                              }}
                              className="d-dropdown-item"
                            >
                              View Template
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPendingCancelRecord(r);
                                setOpenMenuId(null);
                              }}
                              className="d-dropdown-item cancel"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expandedRows.includes(r.id) && (
                    <tr className="expanded-content">
                      <td colSpan={9}>
                        <strong>
                          {rowType === "credit"
                            ? "Return Details:"
                            : rowType === "po"
                              ? "Order Details:"
                              : rowType === "quotation"
                                ? "Estimate Details:"
                                : "Invoice Details:"}
                        </strong>
                        <table className="line-items-table">
                          <thead>
                            <tr>
                              <th>Sl. No.</th>
                              <th>Description</th>
                              <th>Part No.</th>
                              <th>HSN/SAC</th>
                              <th>Qty</th>
                              <th>Rate</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lineItems.length === 0 ? (
                              <tr>
                                <td colSpan={7}>No line items</td>
                              </tr>
                            ) : (
                              lineItems.map((item, i) => (
                                <tr key={i}>
                                  <td>{i + 1}</td>
                                  <td>
                                    {item.description ?? item.name ?? "—"}
                                  </td>
                                  <td>
                                    {item.partNumber ?? item.part_number ?? "—"}
                                  </td>
                                  <td>{item.hsnSac ?? item.hsn ?? "—"}</td>
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
                          <strong>
                            {rowType === "credit"
                              ? "Return From:"
                              : rowType === "po"
                                ? "Order To:"
                                : rowType === "quotation"
                                  ? "Estimate For:"
                                  : "Bill To:"}
                          </strong>
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
                              <strong>Country:</strong>{" "}
                              {getCountryDisplayName(r.country)}
                            </li>
                            <li>
                              <strong>State:</strong> {r.state ?? "—"}
                            </li>
                            <li>
                              <strong>
                                {rowType === "credit"
                                  ? "Invoice:"
                                  : rowType === "po"
                                    ? "Reference:"
                                    : "Reference:"}
                              </strong>{" "}
                              {r.referenceId ?? "—"}
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
                              <strong>Currency:</strong>
                              {r.currency || "—"}
                            </li>
                            <li>
                              <strong>Sub Total:</strong>{" "}
                              {safeNumber(r.subTotal).toFixed(2)}
                            </li>
                            <li>
                              <strong>Round Off:</strong>{" "}
                              {r.roundOff ? "Yes" : "No"}{" "}
                              {r.roundOff
                                ? `(${safeNumber(r.roundOffAmount).toFixed(2)})`
                                : ""}
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
                              <strong>Total Incl. Tax:</strong>{" "}
                              {safeNumber(
                                r.finalTotalAmount ?? r.totalIncludingTax,
                              ).toFixed(2)}
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

      {showEditModal && editingRecord && (
        <div className="pj-modal">
          <div className="pj-modal-content">
            <DownloadForm
              initialData={editingRecord}
              isEditMode={true}
              customers={customers}
              onSubmit={handleSaveEdit}
              onCancel={() => {
                setShowEditModal(false);
                setEditingRecord(null);
              }}
            />
          </div>
        </div>
      )}

      {successNotice.isVisible && (
        <Modal
          isVisible={successNotice.isVisible}
          title={successNotice.title}
          onClose={closeSuccessNotice}
          buttons={[
            {
              label: "OK",
              className: "confirm-btn",
              onClick: closeSuccessNotice,
            },
          ]}
        >
          <p>{successNotice.message}</p>
        </Modal>
      )}

      {showViewTemplateModal && viewTemplateRecord && (
        <div className="pj-modal">
          <div className="pj-modal-content" style={{ maxWidth: "1100px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                backgroundColor: "#00468c",
              }}
            >
              <h3 className="preview">Template Preview</h3>
              <button
                type="button"
                className="pj-close-button"
                onClick={() => {
                  setShowViewTemplateModal(false);
                  setViewTemplateRecord(null);
                }}
              >
                X
              </button>
            </div>

            <InvoiceTemplate
              invoiceType={normalizeInvoiceTypeLabel(
                viewTemplateRecord.invoiceType,
              )}
              invoiceNumber={viewTemplateRecord.invoiceNumber || ""}
              downloadDetails={viewTemplateRecord}
              orgId={orgId}
            />
          </div>
        </div>
      )}

      {pendingCancelRecord && (
        <Modal
          isVisible={true}
          title="Confirm Cancel"
          onClose={() => setPendingCancelRecord(null)}
          buttons={[
            {
              label: "No",
              className: "confirm-btn",
              onClick: () => setPendingCancelRecord(null),
            },
            {
              label: "Yes, Cancel",
              className: "confirm-btn",
              onClick: async () => {
                await onCancelRecord?.(pendingCancelRecord);
                setPendingCancelRecord(null);
              },
            },
          ]}
        >
          <p>Are you sure you want to cancel this record?</p>
        </Modal>
      )}

      <div style={{ position: "absolute", top: "-10000px", left: "-10000px" }}>
        <div ref={printRef}>
          <InvoiceTemplate
            invoiceType={redownloadInvoiceType}
            invoiceNumber={redownloadInvoiceNumber}
            downloadDetails={redownloadDetails}
            orgId={orgId}
            showTemplateToolbar={false}
          />
        </div>
      </div>
    </div>
  );
};

export default DownloadDetailsList;
