"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./InvoicePrint.css";
import { numberToWords } from "./numberToWords.client";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";

const ORG_1 = 1;
const ORG_32 = 32;

const ORG32_HEADER = {
  gstText: "GST Reg. No. : 29CRGPG2296B1ZU",
  phone: "+91 9243236748",
  email: "enquiryavinya@gmail.com",
  companyName: "AVINYA MOTORS",
  tagline: "Manufacturer of Automobile parts",
  logoSrc: "/images/avinya-logo.png",
};

const ORG32_FOOTER = {
  address:
    "Plot No. 04, 2nd Cross, Prajwani Road, Near High Court, Belur Industrial Area, Dharwad - 580 011",
  bankName: "INDIAN OVERSEAS BANK",
  accountNo: "030802000003462",
  ifsc: "IOBA0000308",
  accountHolder: "AVINYA MOTORS",
  qrSrc: "/images/qr_avinya.png",
  sealSrc: "/images/avinya_seal.jpeg",
};

const safeJsonParse = (value, fallback = null) => {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const resolveTemplateAssetUrl = (value, backendBase = "") => {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (/^(blob:|data:|https?:\/\/)/i.test(s)) return s;
  if (
    s.startsWith("/images/") ||
    s.startsWith("/static/") ||
    s.startsWith("/assets/")
  ) {
    return s;
  }
  const base = String(backendBase || "").replace(/\/$/, "");
  if (!base) return s;
  return s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
};

const normalizeTemplateRecord = (raw, index = 0, backendBase = "") => {
  const meta =
    safeJsonParse(
      raw?.meta ?? raw?.metadata ?? raw?.config ?? raw?.settings ?? null,
      {},
    ) || {};
  const key = String(
    raw?.id ??
      raw?._id ??
      raw?.templateId ??
      raw?.template_id ??
      raw?.name ??
      raw?.title ??
      raw?.templateName ??
      index,
  );

  return {
    key,
    id: raw?.id ?? raw?._id ?? raw?.templateId ?? raw?.template_id ?? key,
    name:
      raw?.name ??
      raw?.title ??
      raw?.templateName ??
      meta?.name ??
      `Template ${index + 1}`,
    headerUrl: resolveTemplateAssetUrl(
      raw?.headerUrl ??
        raw?.header ??
        raw?.headerImageUrl ??
        raw?.header_image ??
        raw?.headerImage ??
        meta?.headerUrl ??
        meta?.header ??
        null,
      backendBase,
    ),
    footerUrl: resolveTemplateAssetUrl(
      raw?.footerUrl ??
        raw?.footer ??
        raw?.footerImageUrl ??
        raw?.footer_image ??
        raw?.footerImage ??
        meta?.footerUrl ??
        meta?.footer ??
        null,
      backendBase,
    ),
    watermarkUrl: resolveTemplateAssetUrl(
      raw?.watermarkUrl ??
        raw?.watermark ??
        raw?.watermarkImageUrl ??
        raw?.watermark_image ??
        raw?.watermarkImage ??
        meta?.watermarkUrl ??
        meta?.watermark ??
        null,
      backendBase,
    ),
    watermarkProps:
      meta?.watermarkPlacement ??
      raw?.watermarkProps ??
      meta?.watermarkProps ??
      null,
    headerProps: meta?.headerProps ?? raw?.headerProps ?? null,
    footerProps: meta?.footerProps ?? raw?.footerProps ?? null,
    createdAt:
      raw?.createdAt ??
      raw?.created_at ??
      raw?.updatedAt ??
      raw?.updated_at ??
      null,
  };
};

const extractTemplateArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.templates)) return payload.templates;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.message)) return payload.message;
  return [];
};

const fetchSavedTemplates = async ({ backendUrl = "", orgId }) => {
  const base = String(backendUrl || "").replace(/\/$/, "");
  const orgPart = encodeURIComponent(String(orgId));
  const candidates = [`${base}/api/orgs/${org}/templates`].filter(Boolean);

  for (const url of candidates) {
    try {
      const resp = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { "x-api-key": apiKey || "" },
      });

      if (!resp.ok) continue;

      const json = await resp.json().catch(() => null);
      const rawList = extractTemplateArray(json);
      const normalized = rawList.map((item, index) =>
        normalizeTemplateRecord(item, index, base),
      );
      if (normalized.length > 0) {
        return normalized;
      }
    } catch (error) {
      // Try the next endpoint candidate.
    }
  }

  return [];
};

const fmtINR = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0.00";
  return `${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safeParseLineItems = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((it) => ({
      description: it?.description ?? it?.name ?? "",
      partNumber: it?.partNumber ?? "",
      hsnSac: it?.hsnSac ?? it?.hsn ?? "",
      quantity: safeNumber(it?.quantity ?? it?.qty ?? 0),
      rate: safeNumber(it?.rate ?? it?.unitPrice ?? 0),
      total: safeNumber(
        it?.total ?? safeNumber(it?.quantity) * safeNumber(it?.rate),
      ),
    }));
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return safeParseLineItems(parsed);
      return [];
    } catch {
      return [];
    }
  }
  return [];
};

const formatDate = (dateString) => {
  try {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
  } catch {
    return String(dateString || "");
  }
};

const InvoicePrint = React.forwardRef(({ invoiceData = {}, orgId }, ref) => {
  const {
    withSeal = false,
    invoiceType = "",
    invoiceNo = "",
    invoiceDate = "",
    referenceId = "",
    referenceDate = "",
    currency = "",
    totalExcludingTax: rawTotalExcl = 0,
    gstAmount: rawGstAmount = 0,
    terms = "",
    gst: rawGst = 0,
    totalIncludingTax: rawTotalIncl = 0,
    totalBeforeRoundOff: rawTotalBeforeRoundOff = 0,
    roundOff = false,
    roundOffAmount: rawRoundOffAmount = 0,
    advance: rawAdvance = 0,
    project = {},
    isCancelled = false,
  } = invoiceData;

  const gst = safeNumber(rawGst);
  const gstAmount = safeNumber(rawGstAmount);
  const totalExcludingTax = safeNumber(rawTotalExcl);
  const totalIncludingTax = safeNumber(rawTotalIncl);
  const totalBeforeRoundOff = safeNumber(rawTotalBeforeRoundOff);
  const roundOffAmount = safeNumber(rawRoundOffAmount);
  const advance = safeNumber(rawAdvance);

  const parsedLineItems = safeParseLineItems(invoiceData.lineItems);
  const currentOrgId = Number(orgId);
  const isOrg32 = currentOrgId === ORG_32;
  const isOrg1 = currentOrgId === ORG_1;

  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("__default__");
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");

  const templateStorageKey = useMemo(
    () => (currentOrgId ? `invoice-template-selection:${currentOrgId}` : ""),
    [currentOrgId],
  );

  const activeTemplate = useMemo(() => {
    if (!selectedTemplateKey || selectedTemplateKey === "__default__")
      return null;
    return (
      savedTemplates.find((item) => item.key === selectedTemplateKey) || null
    );
  }, [savedTemplates, selectedTemplateKey]);

  const selectedHeaderUrl = activeTemplate?.headerUrl || null;
  const selectedFooterUrl = activeTemplate?.footerUrl || null;
  const selectedWatermarkUrl = activeTemplate?.watermarkUrl || null;
  const selectedWatermarkProps = activeTemplate?.watermarkProps || null;
  const hasSavedTemplates = savedTemplates.length > 0;

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      if (!currentOrgId) {
        setSavedTemplates([]);
        setSelectedTemplateKey("__default__");
        return;
      }

      setTemplatesLoading(true);
      setTemplatesError("");

      try {
        const templates = await fetchSavedTemplates({
          backendUrl,
          apiKey,
          orgId: currentOrgId,
        });

        if (cancelled) return;

        setSavedTemplates(templates);

        const storedKey =
          typeof window !== "undefined"
            ? window.localStorage.getItem(templateStorageKey)
            : null;

        const preferredKey =
          storedKey && templates.some((item) => item.key === storedKey)
            ? storedKey
            : templates[0]?.key || "__default__";

        setSelectedTemplateKey(preferredKey);
      } catch (error) {
        if (cancelled) return;
        setSavedTemplates([]);
        setSelectedTemplateKey("__default__");
        setTemplatesError(
          error?.message ||
            "Unable to load saved templates for this organization.",
        );
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    };

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, [apiKey, backendUrl, currentOrgId, templateStorageKey]);

  useEffect(() => {
    if (!templateStorageKey || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(templateStorageKey, selectedTemplateKey);
    } catch {
      // ignore storage errors
    }
  }, [selectedTemplateKey, templateStorageKey]);

  const titleText =
    invoiceType === "tax"
      ? "Tax Invoice"
      : invoiceType === "proforma"
        ? "Proforma Invoice"
        : invoiceType || "";

  const totals = parsedLineItems.reduce(
    (acc, item) => {
      const qty = safeNumber(item.quantity);
      const rate = safeNumber(item.rate);
      const lineTotal = safeNumber(item.total) || qty * rate;

      acc.quantity += qty;
      acc.amount += lineTotal;
      acc.total += lineTotal;

      return acc;
    },
    { quantity: 0, amount: 0, total: 0 },
  );

  const subtotalAmount = totals.total;

  const totalGSTFromLines = parsedLineItems.reduce(
    (acc, item) => acc + (safeNumber(item.total) * gst) / 100,
    0,
  );

  const effectiveGstAmount = gstAmount || Number(totalGSTFromLines.toFixed(2));
  const roundOffValue = roundOff ? safeNumber(rawRoundOffAmount) : 0;

  const totalAmountBeforeAdvance = Number(
    (subtotalAmount + effectiveGstAmount + roundOffValue).toFixed(2),
  );

  const finalPayableAmount = Number(
    (totalAmountBeforeAdvance - advance).toFixed(2),
  );

  const halfGSTRate =
    gst && Number(gst) > 0 ? (Number(gst) / 2).toFixed(2) : "0.00";
  const halfGSTAmount =
    gstAmount && Number(gstAmount) > 0
      ? (Number(gstAmount) / 2).toFixed(2)
      : (totalGSTFromLines / 2).toFixed(2);

  const fixedRows = 6;
  const emptyRowCount = fixedRows - parsedLineItems.length;
  const emptyRows =
    emptyRowCount > 0 ? Array.from({ length: emptyRowCount }) : [];

  const headerTitle = invoiceType ? invoiceType.toUpperCase() : "INVOICE";

  const handleTemplateSelection = useCallback((event) => {
    setSelectedTemplateKey(event.target.value);
  }, []);

  const openTemplateBuilder = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/TemplateBuilder";
    }
  }, []);

  const templateHeaderStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      objectFit: "contain",
      display: "block",
    }),
    [],
  );

  const templateFooterStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      objectFit: "contain",
      display: "block",
    }),
    [],
  );

  const watermarkStyle = useMemo(() => {
    if (!selectedWatermarkUrl) return null;

    const pct = (value, fallback) => {
      const n = Number(String(value ?? fallback).replace("%", ""));
      return Number.isFinite(n) ? n : fallback;
    };

    const xPct = pct(selectedWatermarkProps?.xPct, 50);
    const yPct = pct(selectedWatermarkProps?.yPct, 55);
    const wPct = pct(selectedWatermarkProps?.wPct, 60);
    const hPct = pct(selectedWatermarkProps?.hPct, 60);
    const opacity =
      typeof selectedWatermarkProps?.opacity === "number"
        ? selectedWatermarkProps.opacity
        : 0.12;

    return {
      position: "absolute",
      left: `${xPct - wPct / 2}%`,
      top: `${yPct - hPct / 2}%`,
      width: `${wPct}%`,
      height: `${hPct}%`,
      opacity,
      pointerEvents: "none",
      zIndex: 0,
      objectFit: "contain",
      userSelect: "none",
    };
  }, [selectedWatermarkProps, selectedWatermarkUrl]);

  const lineItemColumnCount = isOrg32 ? 8 : 7;

  return (
    <div
      ref={ref}
      className={`invoice-print-container ${isOrg32 ? "org-32" : "org-1"}`}
      style={{ position: "relative" }}
    >
      {Boolean(isCancelled) && (
        <div className="cancelled-watermark">CANCELLED</div>
      )}

      {selectedWatermarkUrl && (
        <img
          src={selectedWatermarkUrl}
          alt={activeTemplate?.name || "Watermark"}
          style={watermarkStyle || undefined}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          margin: "0 0 12px",
          padding: "10px 12px",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          background: "#fff",
          position: "relative",
          zIndex: 1,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
            Saved templates
          </span>
          <select
            value={selectedTemplateKey}
            onChange={handleTemplateSelection}
            disabled={templatesLoading}
            style={{
              minWidth: "240px",
              padding: "8px 10px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#fff",
              fontSize: "14px",
            }}
          >
            <option value="__default__">Default invoice layout</option>
            {savedTemplates.map((template) => (
              <option key={template.key} value={template.key}>
                {template.name}
              </option>
            ))}
          </select>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            {templatesLoading
              ? "Loading saved templates..."
              : activeTemplate
                ? `Applying: ${activeTemplate.name}`
                : "No saved template selected"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            type="button"
            onClick={openTemplateBuilder}
            style={{
              padding: "9px 14px",
              borderRadius: "10px",
              border: "none",
              background: "#111827",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Build Template
          </button>
          {!hasSavedTemplates && !templatesLoading && (
            <span style={{ fontSize: "12px", color: "#b45309" }}>
              No saved templates found for this organization.
            </span>
          )}
        </div>
      </div>

      {templatesError && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "#fff7ed",
            color: "#9a3412",
            border: "1px solid #fdba74",
            position: "relative",
            zIndex: 1,
          }}
        >
          {templatesError}
        </div>
      )}
      {selectedHeaderUrl ? (
        <header
          className="invoice-print-header"
          style={{ position: "relative", zIndex: 1 }}
        >
          <img
            src={selectedHeaderUrl}
            alt={activeTemplate?.name || "Selected template header"}
            style={templateHeaderStyle}
          />
        </header>
      ) : isOrg32 ? (
        <header
          className="invoice-print-header org32-header"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="org32-gst-text">{ORG32_HEADER.gstText}</div>
          <div className="org32-header-top">
            <div className="org32-left-accent" />
            <div className="org32-brand-block">
              <div className="org32-brand-left">
                <img
                  src={ORG32_HEADER.logoSrc}
                  alt={ORG32_HEADER.companyName}
                  className="org32-logo"
                />
                <div className="org32-brand-text">
                  <h2 className="org32-company-name">
                    {ORG32_HEADER.companyName}
                  </h2>
                  <p className="org32-tagline">{ORG32_HEADER.tagline}</p>
                </div>
              </div>
            </div>

            <div className="org32-contact-bar">
              <div className="org32-contact-item">
                <FiPhone className="org32-contact-icon" />
                <span>{ORG32_HEADER.phone}</span>
              </div>
              <div className="org32-contact-item">
                <FiMail className="org32-contact-icon" />
                <span>{ORG32_HEADER.email}</span>
              </div>
            </div>
          </div>
        </header>
      ) : isOrg1 ? (
        <header
          className="invoice-print-header"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="invoice-logo-section">
            <img src="/images/company-logo.png" alt="Company Logo" />
          </div>
          <div className="in-company-address">
            <h2 className="in-company-name">Sukalpa Tech Solutions Pvt Ltd</h2>
            <p>MSME/Udyam No: : UDYAM-KR-04-0106460</p>
            <p>#71,Sarathi Nagar, Near Sahyadri Nagar,Belagavi -591108</p>
            <p>State:29-Karnataka</p>
            <p>Phone no.: 9686465612</p>
            <p>Email: om@sukalpatechsolutions.com</p>
            <p>GSTIN: 29ABICS7525C1Z6</p>
            <p>PAN: ABICS7525C</p>
          </div>
        </header>
      ) : (
        <div
          className="invoice-print-placeholder"
          style={{ position: "relative", zIndex: 1 }}
        >
          No print template configured for this organization.
        </div>
      )}

      <div
        className="invoice-content"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="invoice-title-section">
          <div className="invoice-title-block">{titleText.toUpperCase()}</div>
          <div className="bill-header">
            <h4>Bill To</h4>
            <h4>Bill Details</h4>
          </div>
          <div className="bill-data">
            <div className="bill-to">
              <p className="project-company">
                <strong>{project.company || "Client Company"}</strong>
              </p>
              <p className="project-address">
                {project.address || "Client Address"}
              </p>
              <p>Contact No. : {project.clientNumber || "—"}</p>
              <p>GSTIN : {project.gst || "—"}</p>
              <p>State: {project.state || "—"}</p>
            </div>
            <div className="invoice-details">
              <p>
                <span className="label">Invoice No</span>:
                <strong>{invoiceNo || "—"}</strong>
              </p>
              <p>
                <span className="label">Invoice Date</span>:
                <strong>{invoiceDate ? formatDate(invoiceDate) : "—"}</strong>
              </p>
              <p>
                <span className="label">Place of supply</span>:{" "}
                <strong>{project.service || "—"}</strong>
              </p>
              <p>
                <span className="label">PO Date</span>:
                <strong>
                  {referenceDate ? formatDate(referenceDate) : "—"}
                </strong>
              </p>
              <p>
                <span className="label">PO Number</span>:{" "}
                <strong>{referenceId || "—"}</strong>
              </p>
            </div>
          </div>
        </div>

        <table className="in-print-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item/Service Description</th>
              {isOrg32 && <th>Parts Number</th>}
              <th>Currency</th>
              <th>HSN/SAC</th>
              <th>Amount</th>
              <th>Quantity</th>
              <th>Sub total</th>
            </tr>
          </thead>
          <tbody>
            {parsedLineItems.map((item, idx) => {
              const lineTotal = safeNumber(item.total);
              return (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.description || "—"}</td>
                  {isOrg32 && <td>{item.partNumber || "—"}</td>}
                  <td>{currency}</td>
                  <td>{item.hsnSac || "—"}</td>
                  <td>{fmtINR(item.rate)}</td>
                  <td>{item.quantity}</td>
                  <td>{fmtINR(lineTotal)}</td>
                </tr>
              );
            })}

            {emptyRows.map((_, index) => (
              <tr key={`empty-${index}`}>
                {Array.from({ length: lineItemColumnCount }).map(
                  (__, colIdx) => (
                    <td key={`empty-${index}-${colIdx}`}>&nbsp;</td>
                  ),
                )}
              </tr>
            ))}

            <tr className="totals-row">
              <td></td>
              <td>
                <strong>Totals</strong>
              </td>
              {isOrg32 && <td></td>}
              <td></td>
              <td></td>
              <td>
                <strong>{fmtINR(totals.amount)}</strong>
              </td>
              <td>
                <strong>{totals.quantity}</strong>
              </td>
              <td>
                <strong>{fmtINR(subtotalAmount)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="tax-section">
          <div className="partition">
            <div className="tax-box">
              <p>Tax type</p>
              <p>Taxable amount</p>
              <p>Rate</p>
              <p>Tax amount</p>
            </div>

            {String(project.state || "")
              .toLowerCase()
              .includes("karnataka") ? (
              <>
                <div className="tax-box-body">
                  <p className="tax-gst">CGST</p>
                  <p>{fmtINR(subtotalAmount)}</p>
                  <p>{halfGSTRate}%</p>
                  <p>{fmtINR(halfGSTAmount)}</p>
                </div>
                <div className="tax-box-body">
                  <p className="tax-gst">SGST</p>
                  <p>{fmtINR(subtotalAmount)}</p>
                  <p>{halfGSTRate}%</p>
                  <p>{fmtINR(halfGSTAmount)}</p>
                </div>
              </>
            ) : (
              <div className="tax-box-body">
                <p className="tax-gst">IGST</p>
                <p>{fmtINR(subtotalAmount)}</p>
                <p>{gst}%</p>
                <p>{fmtINR(effectiveGstAmount)}</p>
              </div>
            )}

            <p className="amount-in-words">
              <strong>Order Amount in words</strong>
            </p>
            <div className="amount-in-words-text">
              {numberToWords(Math.round(finalPayableAmount || 0))}
            </div>

            <p className="amount-in-words">
              <strong>Terms and Conditions</strong>
            </p>
            <div>
              <p className="terms">{terms || "—"}</p>
            </div>
          </div>

          <div className="partition">
            <p className="amounts">
              <strong>Amounts</strong>
            </p>
            <div>
              <div className="amounts-section">
                <div className="total-block">
                  <p>Sub Total</p>
                  <p>{fmtINR(subtotalAmount)}</p>
                </div>
                <div className="total-block">
                  <p>GST</p>
                  <p>{fmtINR(effectiveGstAmount)}</p>
                </div>
              </div>

              <div className="amounts-section">
                <div className="total-block">
                  <p className="bold">Total</p>
                  <p className="bold">{fmtINR(totalAmountBeforeAdvance)}</p>
                </div>
                <div className="total-block">
                  <p>Round Off</p>
                  <p>{fmtINR(roundOffValue)}</p>
                </div>
                <div className="total-block">
                  <p>Advance</p>
                  <p>{fmtINR(advance)}</p>
                </div>
              </div>

              <div className="amounts-section">
                <div className="total-block">
                  <p className="bold">Payable Amount</p>
                  <p className="bold">{fmtINR(finalPayableAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOrg32 ? (
        <footer
          className="invoice-footer org32-footer"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              alignItems: "stretch",
            }}
          >
            <div className="footer-partition" style={{ width: "49%" }}>
              <h4 style={{ background: "#000", color: "#fff", margin: 0 }}>
                Bank Details
              </h4>
              <div className="bank-details" style={{ gap: "12px" }}>
                <div className="qr-code" style={{ margin: "1% 2% 0 0" }}>
                  <img
                    src={ORG32_FOOTER.qrSrc}
                    alt="AVINYA QR Code"
                    style={{ width: "150px", height: "150px" }}
                  />
                </div>
                <p style={{ fontSize: "medium" }}>
                  Name: {ORG32_FOOTER.bankName}
                  <br />
                  <br />
                  Account No: {ORG32_FOOTER.accountNo}
                  <br />
                  <br />
                  IFSC code: {ORG32_FOOTER.ifsc}
                  <br />
                  <br />
                  Account holder&apos;s name: {ORG32_FOOTER.accountHolder}
                </p>
              </div>
            </div>

            <div
              className="seal-signs"
              style={{
                width: "49%",
                textAlign: "center",
                margin: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p style={{ margin: 0 }}>For: AVINYA MOTORS</p>
              {withSeal ? (
                <div className="seal">
                  <img
                    src={ORG32_FOOTER.sealSrc}
                    alt="SEAL"
                    style={{ width: "200px", height: "150px" }}
                  />
                </div>
              ) : (
                <div
                  className="no-seal"
                  style={{ width: "200px", height: "150px" }}
                />
              )}
              <strong>
                <p className="authorized" style={{ margin: 0 }}>
                  Authorized Signatory
                </p>
              </strong>
            </div>
          </div>

          <div className="org32-footer-bar">
            <FiMapPin
              className="org32-footer-icon"
              style={{ fontSize: "18px" }}
            />
            <span>{ORG32_FOOTER.address}</span>
          </div>
        </footer>
      ) : isOrg1 ? (
        <footer className="invoice-footer">
          <div className="footer-partition">
            <strong>
              <h4>Bank Details</h4>
            </strong>
            <div className="bank-details">
              <div className="qr-code">
                <img src="/images/upi-qr-code.png" alt="UPI QR Code" />
              </div>
              <p>
                Name: HDFC BANK, BELGAUM
                <br />
                <br />
                Account No: 50200089573214
                <br />
                <br />
                IFSC code: HDFC0000253
                <br />
                <br />
                Account holder&apos;s name: Sukalpa Tech Solutions Pvt Ltd
              </p>
            </div>
          </div>

          <div className="seal-signs">
            <p>For: Sukalpa Tech Solutions Pvt Ltd</p>
            {withSeal ? (
              <div className="seal">
                <img src="/images/seal.png" alt="SEAL" />
              </div>
            ) : (
              <div className="no-seal" />
            )}
            <strong>
              <p className="authorized">Authorized Signatory</p>
            </strong>
          </div>
        </footer>
      ) : null}

      {isOrg1 && (
        <p className="note">
          Note: We are a registered MSME under the MSMED Act. As per Section 15,
          kindly ensure payment within 45 days from the invoice date. <br />
          Timely payment supports small businesses like ours
        </p>
      )}
    </div>
  );
});

InvoicePrint.displayName = "InvoicePrint";

export default InvoicePrint;
