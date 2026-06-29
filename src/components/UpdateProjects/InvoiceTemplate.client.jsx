"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import "./InvoiceTemplate.css";
import { numberToWords } from "./numberToWords.client";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";

const protectedImageCache = new Map();

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

const pickFirst = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
};

const resolveTemplateAssetUrl = (value, backendBase = "") => {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;

  if (/^(blob:|data:|https?:\/\/)/i.test(s)) return s;

  const base = String(backendBase || "").replace(/\/$/, "");
  if (!base) return s;

  if (s.startsWith("/api/")) return `${base}${s}`;
  if (s.startsWith("/")) return `${base}${s}`;

  return `${base}/${s}`;
};

async function fetchProtectedImage(src, apiKey, employeeId, backendBase = "") {
  if (!src) return null;

  if (
    src.startsWith("blob:") ||
    src.startsWith("data:") ||
    /^https?:\/\//i.test(src)
  ) {
    return src;
  }

  let resolvedSrc = src;
  if (resolvedSrc.startsWith("/api/") && backendBase) {
    resolvedSrc = `${backendBase.replace(/\/$/, "")}${resolvedSrc}`;
  } else if (!resolvedSrc.startsWith("/api/") && backendBase) {
    resolvedSrc = resolveTemplateAssetUrl(resolvedSrc, backendBase);
  }

  const cached = protectedImageCache.get(resolvedSrc);
  if (cached) return cached;

  try {
    const res = await fetch(resolvedSrc, {
      method: "GET",
      credentials: "include",
      headers: {
        "x-api-key": apiKey || "",
        "x-employee-id": employeeId || "",
      },
    });

    if (!res.ok) {
      console.warn("fetchProtectedImage failed:", resolvedSrc, res.status);
      return null;
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    protectedImageCache.set(resolvedSrc, blobUrl);
    return blobUrl;
  } catch (err) {
    console.warn(
      "fetchProtectedImage error:",
      resolvedSrc,
      err?.message || err,
    );
    return null;
  }
}

const extractTemplateArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.templates,
    payload?.data,
    payload?.items,
    payload?.result,
    payload?.message,
    payload?.records,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  if (
    payload?.headerUrl ||
    payload?.footerUrl ||
    payload?.watermarkUrl ||
    payload?.header ||
    payload?.footer ||
    payload?.grapes_json ||
    payload?.html
  ) {
    return [payload];
  }

  return [];
};

const normalizeTemplateRecord = (raw, index = 0, backendBase = "") => {
  const grapesJson =
    safeJsonParse(raw?.grapes_json ?? raw?.grapesJson ?? null, null) || {};

  const meta =
    safeJsonParse(
      raw?.meta ?? raw?.metadata ?? raw?.config ?? raw?.settings ?? null,
      {},
    ) || {};

  const uploads = meta?.uploads || grapesJson?.uploads || {};

  const watermarkPlacement =
    grapesJson?.watermark || meta?.watermarkPlacement || null;

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

  const headerSource = pickFirst(
    raw?.headerUrl,
    raw?.header,
    raw?.headerImageUrl,
    raw?.header_image,
    raw?.headerImage,
    grapesJson?.headerUrl,
    grapesJson?.header_url,
    meta?.headerUrl,
    meta?.header,
    uploads?.header,
  );

  const footerSource = pickFirst(
    raw?.footerUrl,
    raw?.footer,
    raw?.footerImageUrl,
    raw?.footer_image,
    raw?.footerImage,
    grapesJson?.footerUrl,
    grapesJson?.footer_url,
    meta?.footerUrl,
    meta?.footer,
    uploads?.footer,
  );

  const watermarkSource = pickFirst(
    raw?.watermarkUrl,
    raw?.watermark,
    raw?.watermarkImageUrl,
    raw?.watermark_image,
    raw?.watermarkImage,
    grapesJson?.watermark?.url,
    grapesJson?.watermarkUrl,
    grapesJson?.watermark,
    meta?.watermarkUrl,
    meta?.watermark,
    uploads?.watermark,
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
    headerUrl: resolveTemplateAssetUrl(headerSource, backendBase),
    footerUrl: resolveTemplateAssetUrl(footerSource, backendBase),
    watermarkUrl: resolveTemplateAssetUrl(watermarkSource, backendBase),
    watermarkProps: watermarkPlacement
      ? {
          xPct: watermarkPlacement.xPct ?? "50%",
          yPct: watermarkPlacement.yPct ?? "35%",
          wPct: watermarkPlacement.wPct ?? "24%",
          hPct: watermarkPlacement.hPct ?? "16%",
          opacity:
            typeof watermarkPlacement.opacity === "number"
              ? watermarkPlacement.opacity
              : 0.12,
        }
      : null,
    headerProps: meta?.headerProps ?? raw?.headerProps ?? null,
    footerProps: meta?.footerProps ?? raw?.footerProps ?? null,
    createdAt:
      raw?.createdAt ??
      raw?.created_at ??
      raw?.updatedAt ??
      raw?.updated_at ??
      null,
    raw,
  };
};

const fetchSavedTemplates = async ({ backendUrl = "", apiKey = "", orgId }) => {
  const base = String(backendUrl || "").replace(/\/$/, "");
  const org = encodeURIComponent(String(orgId));

  const candidates = [
    `${base}/api/orgs/${org}/templates`,
    `${base}/api/orgs/${org}/templates/list`,
    `${base}/api/orgs/${org}/document-templates`,
    `${base}/api/orgs/${org}/document-template`,
    `${base}/api/templates?orgId=${org}`,
    `/api/orgs/${org}/templates`,
    `/api/templates?orgId=${org}`,
  ].filter(Boolean);

  for (const url of candidates) {
    try {
      const resp = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "x-api-key": apiKey || "",
          "x-org-id": String(orgId),
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) continue;

      const json = await resp.json().catch(() => null);
      const rawList = extractTemplateArray(json);
      const normalized = rawList
        .map((item, index) => normalizeTemplateRecord(item, index, base))
        .filter(Boolean);

      if (normalized.length > 0) return normalized;
    } catch {
      // next candidate
    }
  }

  return [];
};

const InvoiceTemplate = React.forwardRef((props, ref) => {
  const {
    invoiceType = "",
    invoiceNumber = "",
    downloadDetails = {},
    orgId,
    showTemplateToolbar = true,
    selectedTemplateKey: selectedTemplateKeyProp,
    onSelectedTemplateKeyChange = null,
    onTemplateReady = null,
    backendUrl: backendUrlProp = process.env.NEXT_PUBLIC_BACKEND_URL || "",
    apiKey: apiKeyProp = process.env.NEXT_PUBLIC_API_KEY || "",
  } = props;

  const backendUrl = backendUrlProp || "";
  const apiKey = apiKeyProp || "";

  const normalizedType = String(invoiceType || "")
    .trim()
    .toLowerCase();
  const isCreditNote =
    normalizedType === "credit note" || normalizedType === "credit";
  const isQuotation = normalizedType === "quotation";
  const isPO = normalizedType === "purchase order" || normalizedType === "po";

  const {
    to,
    address,
    contact,
    companyGst,
    state,
    invoiceDate,
    referenceDate,
    referenceId,
    placeOfSupply,
    withSeal,
    lineItems,
    subTotal,
    gst,
    gstAmount,
    advance,
    totalIncludingTax,
    roundOff,
    roundOffAmount,
    finalTotalAmount,
    terms,
    isCancelled,
    currency,
  } = downloadDetails;

  const parsedLineItems =
    Array.isArray(lineItems) && lineItems.length > 0 ? lineItems : [];

  const currentOrgId = Number(orgId);
  const isOrg32 = currentOrgId === 32;
  const isOrg1 = currentOrgId === 1;

  const [internalTemplateKey, setInternalTemplateKey] = useState("__default__");
  const selectedTemplateKey =
    typeof selectedTemplateKeyProp === "string"
      ? selectedTemplateKeyProp
      : internalTemplateKey;

  const [savedTemplates, setSavedTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [resolvedTemplateAssets, setResolvedTemplateAssets] = useState({
    headerUrl: null,
    footerUrl: null,
    watermarkUrl: null,
    watermarkProps: null,
  });

  const [headerLoaded, setHeaderLoaded] = useState(false);
  const [footerLoaded, setFooterLoaded] = useState(false);
  const [watermarkLoaded, setWatermarkLoaded] = useState(false);

  const templateStorageKey = useMemo(
    () => (currentOrgId ? `invoice-template-selection:${currentOrgId}` : ""),
    [currentOrgId],
  );

  const activeTemplate = useMemo(() => {
    if (!selectedTemplateKey || selectedTemplateKey === "__default__") {
      return null;
    }
    return (
      savedTemplates.find((item) => item.key === selectedTemplateKey) || null
    );
  }, [savedTemplates, selectedTemplateKey]);

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      if (!currentOrgId) {
        setSavedTemplates([]);
        if (typeof selectedTemplateKeyProp !== "string") {
          setInternalTemplateKey("__default__");
        }
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

        if (typeof selectedTemplateKeyProp !== "string") {
          const storedKey =
            typeof window !== "undefined" && templateStorageKey
              ? window.localStorage.getItem(templateStorageKey)
              : null;

          const preferredKey =
            storedKey && templates.some((item) => item.key === storedKey)
              ? storedKey
              : templates[0]?.key || "__default__";

          setInternalTemplateKey(preferredKey);
        }
      } catch (error) {
        if (cancelled) return;
        setSavedTemplates([]);
        if (typeof selectedTemplateKeyProp !== "string") {
          setInternalTemplateKey("__default__");
        }
        setTemplatesError(
          error?.message || "Unable to load saved templates for this invoice.",
        );
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    };

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, [
    backendUrl,
    apiKey,
    currentOrgId,
    templateStorageKey,
    selectedTemplateKeyProp,
  ]);

  useEffect(() => {
    if (!templateStorageKey || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(templateStorageKey, selectedTemplateKey);
    } catch {
      // ignore storage errors
    }
  }, [selectedTemplateKey, templateStorageKey]);

  useEffect(() => {
    let cancelled = false;

    const resolveAssets = async () => {
      const tpl = activeTemplate;

      setHeaderLoaded(false);
      setFooterLoaded(false);
      setWatermarkLoaded(false);

      if (!tpl) {
        setResolvedTemplateAssets({
          headerUrl: null,
          footerUrl: null,
          watermarkUrl: null,
          watermarkProps: null,
        });
        return;
      }

      const [headerUrl, footerUrl, watermarkUrl] = await Promise.all([
        fetchProtectedImage(tpl.headerUrl, apiKey, null, backendUrl),
        fetchProtectedImage(tpl.footerUrl, apiKey, null, backendUrl),
        fetchProtectedImage(tpl.watermarkUrl, apiKey, null, backendUrl),
      ]);

      if (cancelled) return;

      setResolvedTemplateAssets({
        headerUrl: headerUrl || tpl.headerUrl || null,
        footerUrl: footerUrl || tpl.footerUrl || null,
        watermarkUrl: watermarkUrl || tpl.watermarkUrl || null,
        watermarkProps: tpl.watermarkProps || null,
      });
    };

    resolveAssets();

    return () => {
      cancelled = true;
    };
  }, [activeTemplate, apiKey, backendUrl]);

  const templateReady = useMemo(() => {
    if (!activeTemplate) return true;

    const headerOk = !resolvedTemplateAssets.headerUrl || headerLoaded;
    const footerOk = !resolvedTemplateAssets.footerUrl || footerLoaded;
    const watermarkOk = !resolvedTemplateAssets.watermarkUrl || watermarkLoaded;

    return headerOk && footerOk && watermarkOk;
  }, [
    activeTemplate,
    resolvedTemplateAssets.headerUrl,
    resolvedTemplateAssets.footerUrl,
    resolvedTemplateAssets.watermarkUrl,
    headerLoaded,
    footerLoaded,
    watermarkLoaded,
  ]);

  useEffect(() => {
    if (typeof onTemplateReady === "function") {
      try {
        onTemplateReady(templateReady);
      } catch (e) {
        console.warn("onTemplateReady threw", e);
      }
    }
  }, [templateReady, onTemplateReady]);

  const updateSelectedTemplateKey = useCallback(
    (nextKey) => {
      if (typeof onSelectedTemplateKeyChange === "function") {
        onSelectedTemplateKeyChange(nextKey);
      } else {
        setInternalTemplateKey(nextKey);
      }
    },
    [onSelectedTemplateKeyChange],
  );

  const totals = parsedLineItems.reduce(
    (acc, item) => {
      acc.quantity += Number(item.quantity || 0);
      acc.amount += Number(item.rate || 0);
      acc.total += Number(item.total || 0);
      return acc;
    },
    { quantity: 0, amount: 0, total: 0 },
  );

  const subtotalAmount = Number(subTotal || totals.total || 0);

  const totalGST = parsedLineItems.reduce(
    (acc, item) => acc + (Number(item.total || 0) * Number(gst || 0)) / 100,
    0,
  );

  const grossTotal = subtotalAmount + totalGST;
  const roundOffValue = Number(roundOffAmount || 0);
  const displayTotal = Number(
    finalTotalAmount ?? totalIncludingTax ?? grossTotal,
  );

  const halfGSTRate =
    gst && Number(gst) > 0 ? (Number(gst) / 2).toFixed(2) : "0.00";
  const halfGSTAmount =
    gstAmount && Number(gstAmount) > 0
      ? (Number(gstAmount) / 2).toFixed(2)
      : (totalGST / 2).toFixed(2);

  const gstDisplayAmount = Number(gstAmount || totalGST || 0);

  const fixedRows = 6;
  const emptyRowCount = fixedRows - parsedLineItems.length;
  const emptyRows =
    emptyRowCount > 0 ? Array.from({ length: emptyRowCount }) : [];

  const headerTitle = isCreditNote
    ? "CREDIT NOTE"
    : invoiceType
      ? invoiceType.toUpperCase()
      : "INVOICE";

  const selectedHeaderUrl = resolvedTemplateAssets.headerUrl || null;
  const selectedFooterUrl = resolvedTemplateAssets.footerUrl || null;
  const selectedWatermarkUrl = resolvedTemplateAssets.watermarkUrl || null;
  const selectedWatermarkProps = resolvedTemplateAssets.watermarkProps || null;

  const handleTemplateSelection = useCallback(
    (event) => {
      updateSelectedTemplateKey(event.target.value);
    },
    [updateSelectedTemplateKey],
  );

  const openTemplateBuilder = useCallback(() => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: { path: "/TemplateBuilder" },
      }),
    );
  }, []);

  const watermarkStyle = useMemo(() => {
    if (!selectedWatermarkUrl) return null;

    const pct = (value, fallback) => {
      const n = Number(String(value ?? fallback).replace("%", ""));
      return Number.isFinite(n) ? n : fallback;
    };

    const xPct = pct(selectedWatermarkProps?.xPct, 50);
    const yPct = pct(selectedWatermarkProps?.yPct, 35);
    const wPct = pct(selectedWatermarkProps?.wPct, 24);
    const hPct = pct(selectedWatermarkProps?.hPct, 16);
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

  const renderOrgHeader = () => {
    if (selectedHeaderUrl) {
      return (
        <header
          className="emp-inv-header"
          style={{
            position: "relative",
            zIndex: 1,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <img
            src={selectedHeaderUrl}
            alt={activeTemplate?.name || "Header preview"}
            onLoad={() => setHeaderLoaded(true)}
            onError={() => setHeaderLoaded(true)}
            style={{
              width: "100%",
              display: "block",
              objectFit: "contain",
            }}
          />
        </header>
      );
    }

    if (isOrg32) {
      return (
        <header
          className="org32-header"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="org32-gst-line">GST Reg. No. : 29CRGPG2296B1ZU</div>
          <div className="org32-top-row">
            <div className="org32-left-accent" />
            <div className="org32-brand-area">
              <div className="org32-brand-left">
                <img
                  src="/images/avinya-logo.png"
                  alt="AVINYA MOTORS"
                  className="org32-logo"
                />
                <div className="org32-brand-text">
                  <h2 className="org32-company-name">AVINYA MOTORS</h2>
                  <p className="org32-tagline">
                    Manufacturer of Automobile parts
                  </p>
                </div>
              </div>
            </div>

            <div className="org32-contact-row">
              <div className="org32-contact-item">
                <FiPhone className="org32-contact-icon" />
                <span>+91 9243236748</span>
              </div>
              <div className="org32-contact-item">
                <FiMail className="org32-contact-icon" />
                <span>enquiryavinya@gmail.com</span>
              </div>
            </div>
          </div>
        </header>
      );
    }

    if (isOrg1) {
      return (
        <header
          className="emp-inv-header"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="emp-inv-logo">
            <img src="/images/company-logo.png" alt="Company Logo" />
          </div>
          <div className="emp-inv-address">
            <h2 className="emp-inv-name">Sukalpa Tech Solutions Pvt Ltd</h2>
            <p>MSME/Udyam No: UDYAM-KR-04-0106460</p>
            <p>#71, Sarathi Nagar, Near Sahyadri Nagar, Belagavi -591108</p>
            <p>State: 29-Karnataka</p>
            <p>Phone no.: 9686465612</p>
            <p>Email: om@sukalpatechsolutions.com</p>
            <p>GSTIN: 29ABICS7525C1Z6</p>
            <p>PAN: ABICS7525C</p>
          </div>
        </header>
      );
    }

    return (
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          marginBottom: "12px",
          color: "#64748b",
          fontWeight: 500,
          padding: "10px 0",
        }}
      >
        No template configured for this organization.
      </div>
    );
  };

  const renderOrgFooter = () => {
    if (selectedFooterUrl) {
      return (
        <footer
          className="emp-inv-footer"
          style={{
            position: "relative",
            zIndex: 1,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <img
            src={selectedFooterUrl}
            alt={activeTemplate?.name || "Footer preview"}
            onLoad={() => setFooterLoaded(true)}
            onError={() => setFooterLoaded(true)}
            style={{
              width: "100%",
              display: "block",
              objectFit: "contain",
            }}
          />
        </footer>
      );
    }

    if (isOrg32) {
      return (
        <footer
          className="org32-footer"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div
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
              <div className="emp-footer-partition" style={{ width: "49%" }}>
                <h4
                  style={{
                    background: "#000",
                    color: "#fff",
                    margin: 0,
                    padding: "10px 14px",
                  }}
                >
                  Bank Details
                </h4>
                <div className="emp-bank-details" style={{ gap: "12px" }}>
                  <div className="emp-qr-code" style={{ margin: "1% 2% 0 0" }}>
                    <img
                      src="/images/qr_avinya.png"
                      alt="AVINYA QR Code"
                      style={{ width: "150px", height: "150px" }}
                    />
                  </div>
                  <p style={{ fontSize: "medium" }}>
                    Name: INDIAN OVERSEAS BANK
                    <br />
                    <br />
                    Account No: 030802000003462
                    <br />
                    <br />
                    IFSC code: IOBA0000308
                    <br />
                    <br />
                    Account holder&apos;s name: AVINYA MOTORS
                  </p>
                </div>
              </div>

              <div
                className="emp-seal-signs"
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
                  <div className="emp-seal">
                    <img
                      src="/images/avinya_seal.jpeg"
                      alt="SEAL"
                      style={{ width: "200px", height: "150px" }}
                    />
                  </div>
                ) : (
                  <div
                    className="emp-no-seal"
                    style={{ width: "200px", height: "150px" }}
                  />
                )}
                <strong>
                  <p className="emp-authorized" style={{ margin: 0 }}>
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
              <span>
                Plot No. 04, 2nd Cross, Prajwani Road, Near High Court, Belur
                Industrial Area, Dharwad - 580 011
              </span>
            </div>
          </div>
        </footer>
      );
    }

    if (isOrg1) {
      return (
        <>
          <footer
            className="emp-inv-footer"
            style={{ position: "relative", zIndex: 1 }}
          >
            <div className="emp-footer-partition">
              <h4>Bank Details</h4>
              <div className="emp-bank-details">
                <div className="emp-qr-code">
                  <img src="/images/upi-qr-code.png" alt="UPI QR Code" />
                </div>
                <div>
                  <p>
                    Name: HDFC BANK, BELGAUM
                    <br />
                    Account No: 50200089573214
                    <br />
                    IFSC code: HDFC0000253
                    <br />
                    Account holder&apos;s name: Sukalpa Tech Solutions Pvt Ltd
                  </p>
                </div>
              </div>
            </div>

            <div className="emp-seal-signs">
              <p>For: Sukalpa Tech Solutions Pvt Ltd</p>
              {withSeal ? (
                <div className="emp-seal">
                  <img src="/images/seal.png" alt="SEAL" />
                </div>
              ) : (
                <div className="emp-no-seal" />
              )}
              <strong>
                <p className="emp-authorized">Authorized Signatory</p>
              </strong>
            </div>
          </footer>

          <div className="emp-note" style={{ position: "relative", zIndex: 1 }}>
            <p>
              Note: We are a registered MSME under the MSMED Act. As per Section
              15, kindly ensure payment within 45 days from the invoice date.
            </p>
            <p>Timely payment supports small businesses like ours.</p>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div
      ref={ref}
      data-template-ready={templateReady ? "true" : "false"}
      data-template-key={selectedTemplateKey}
      className={`emp-inv-container ${isOrg32 ? "org-32" : ""}`}
      style={{ position: "relative" }}
    >
      {showTemplateToolbar && (
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
            zIndex: 2,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}
            >
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
            {!savedTemplates.length && !templatesLoading && (
              <span style={{ fontSize: "12px", color: "#b45309" }}>
                No saved templates found for this organization.
              </span>
            )}
          </div>
        </div>
      )}

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
            zIndex: 2,
          }}
        >
          {templatesError}
        </div>
      )}

      {Boolean(isCancelled) && (
        <div className="cancelled-watermark">CANCELLED</div>
      )}

      {selectedWatermarkUrl && (
        <img
          src={selectedWatermarkUrl}
          alt={activeTemplate?.name || "Watermark"}
          onLoad={() => setWatermarkLoaded(true)}
          onError={() => setWatermarkLoaded(true)}
          style={watermarkStyle || undefined}
        />
      )}

      {renderOrgHeader()}

      <div
        className="emp-inv-title-section"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="emp-inv-title-block">{headerTitle}</div>

        <div className={`emp-bill-header ${isOrg32 ? "org32-black" : ""}`}>
          <h4>
            {isCreditNote
              ? "Return From"
              : isQuotation
                ? "Estimate For"
                : isPO
                  ? "Order To"
                  : "Bill To"}
          </h4>

          <h4>
            {isCreditNote
              ? "Return Details"
              : isQuotation
                ? "Estimate Details"
                : isPO
                  ? "Order Details"
                  : "Bill Details"}
          </h4>
        </div>

        <div className="emp-bill-data">
          <div className="emp-bill-to">
            <strong>
              <p className="emp-project-company">{to || "_________"}</p>
            </strong>
            <p className="emp-project-address">{address || "_________"}</p>
            <p>Contact No. : {contact || "_________"}</p>
            <p>GSTIN : {companyGst || "_________"}</p>
            <p>State: {state || "_________"}</p>
          </div>

          <div className="emp-inv-details">
            <p>
              <span className="temp-label">
                {isCreditNote
                  ? "Return No"
                  : isQuotation
                    ? "Estimate No"
                    : isPO
                      ? "Order No"
                      : "Invoice No"}
              </span>
              : <strong>{invoiceNumber}</strong>
            </p>

            <p>
              <span className="temp-label">
                {isCreditNote
                  ? "Credit Note Date"
                  : isQuotation || isPO
                    ? "Date"
                    : "Invoice Date"}
              </span>
              :{" "}
              <strong>
                {invoiceDate
                  ? new Date(invoiceDate)
                      .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      .replace(/ /g, "-")
                  : "_________"}
              </strong>
            </p>

            <p>
              <span className="temp-label">Place of supply</span>:{" "}
              <strong>{placeOfSupply || "_________"}</strong>
            </p>

            {isCreditNote ? (
              <>
                <p>
                  <span className="temp-label">Invoice Date</span>:{" "}
                  <strong>
                    {referenceDate
                      ? new Date(referenceDate)
                          .toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          .replace(/ /g, "-")
                      : "_________"}
                  </strong>
                </p>

                <p>
                  <span className="temp-label">Invoice No</span>:{" "}
                  <strong>{referenceId || "_________"}</strong>
                </p>
              </>
            ) : (
              !isQuotation && (
                <>
                  <p>
                    <span className="temp-label">
                      {isPO ? "Reference Date" : "PO Date"}
                    </span>
                    :{" "}
                    <strong>
                      {referenceDate
                        ? new Date(referenceDate)
                            .toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                            .replace(/ /g, "-")
                        : "_________"}
                    </strong>
                  </p>

                  <p>
                    <span className="temp-label">
                      {isPO ? "Reference ID" : "PO Number"}
                    </span>
                    : <strong>{referenceId || "_________"}</strong>
                  </p>
                </>
              )
            )}
          </div>
        </div>
      </div>

      <table
        className="emp-inv-table"
        style={{ position: "relative", zIndex: 1 }}
      >
        <thead>
          <tr>
            <th>S.No</th>
            <th>Item/Service Description</th>
            {isOrg32 && <th>Part No</th>}
            <th>Currency</th>
            <th>HSN/SAC</th>
            <th>Amount</th>
            <th>Quantity</th>
            <th>Sub total</th>
          </tr>
        </thead>
        <tbody>
          {parsedLineItems.map((item, idx) => {
            return (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{item.description || ""}</td>
                {isOrg32 && <td>{item.partNumber || ""}</td>}
                <td>{currency || ""}</td>
                <td>{item.hsnSac || ""}</td>
                <td>{Number(item.rate || 0).toLocaleString("en-IN")}</td>
                <td>{item.quantity || ""}</td>
                <td>{Number(item.total || 0).toLocaleString("en-IN")}</td>
              </tr>
            );
          })}

          {emptyRows.map((_, index) => (
            <tr key={`empty-${index}`}>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              {isOrg32 && <td>&nbsp;</td>}
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ))}

          <tr className="emp-totals-row">
            <td></td>
            <td>
              <strong>Totals</strong>
            </td>
            {isOrg32 && <td></td>}
            <td></td>
            <td></td>
            <td>
              <strong>{Number(totals.amount).toLocaleString("en-IN")}</strong>
            </td>
            <td>
              <strong>{totals.quantity}</strong>
            </td>
            <td>
              <strong>{Number(subtotalAmount).toLocaleString("en-IN")}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        className="emp-tax-section"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="emp-partition">
          <div className={`emp-tax-box ${isOrg32 ? "org32-black" : ""}`}>
            <p>Tax type</p>
            <p>Taxable amount</p>
            <p>Rate</p>
            <p>Tax amount</p>
          </div>

          {state && state.toLowerCase() === "karnataka" ? (
            <>
              <div className="emp-tax-box-body">
                <p className="emp-tax-label">CGST</p>
                <p>{Number(subtotalAmount || 0).toLocaleString("en-IN")}</p>
                <p>{halfGSTRate}%</p>
                <p>{Number(halfGSTAmount).toLocaleString("en-IN")}</p>
              </div>
              <div className="emp-tax-box-body">
                <p className="emp-tax-label">SGST</p>
                <p>{Number(subtotalAmount || 0).toLocaleString("en-IN")}</p>
                <p>{halfGSTRate}%</p>
                <p>{Number(halfGSTAmount).toLocaleString("en-IN")}</p>
              </div>
            </>
          ) : (
            <div className="emp-tax-box-body">
              <p className="emp-tax-label">IGST</p>
              <p>{Number(subtotalAmount || 0).toLocaleString("en-IN")}</p>
              <p>{gst}%</p>
              <p>{Number(gstAmount || 0).toLocaleString("en-IN")}</p>
            </div>
          )}

          <p className={`emp-amount-in-words ${isOrg32 ? "org32-black" : ""}`}>
            <strong>
              {isCreditNote
                ? "Credit Note Amount in words"
                : "Order Amount in words"}
            </strong>
          </p>
          <div className="emp-amount-in-words-text">
            {numberToWords(Math.round(displayTotal || grossTotal))}
          </div>

          <p className={`emp-amount-in-words ${isOrg32 ? "org32-black" : ""}`}>
            <strong>Terms and Conditions</strong>
          </p>
          <div>
            <p className="emp-terms">{terms || ""}</p>
          </div>
        </div>

        <div className="emp-partition">
          <div className={`emp-amounts ${isOrg32 ? "org32-black" : ""}`}>
            <strong>Amounts</strong>
          </div>

          <div className="emp-amounts-container">
            <div className="emp-amounts-section">
              <div className="emp-total-block">
                <div>Sub Total</div>
                <div>{Number(subtotalAmount).toLocaleString("en-IN")}</div>
              </div>

              <div className="emp-total-block">
                <div>GST</div>
                <div>
                  {Number(gstDisplayAmount.toFixed(2)).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <div className="emp-amounts-section">
              <div className="emp-total-block">
                <div className="emp-bold">Total</div>
                <div className="emp-bold">
                  {Number(grossTotal).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="emp-total-block">
                <div>Round Off</div>
                <div>
                  {Number(roundOff ? roundOffValue : 0).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="emp-total-block">
                <div>Advance</div>
                <div>{Number(advance || 0).toLocaleString("en-IN")}</div>
              </div>
            </div>

            <div className="emp-amounts-section">
              <div className="emp-total-block">
                <div className="emp-bold">Payable Amount</div>
                <div className="emp-bold">
                  {Number(displayTotal || grossTotal).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderOrgFooter()}
    </div>
  );
});

export default InvoiceTemplate;
