import React from "react";
import "./InvoicePrint.css";
import { numberToWords } from "./numberToWords.client";

const fmtINR = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "₹ 0.00";
  return `₹ ${n.toLocaleString("en-IN", {
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
  if (Array.isArray(raw))
    return raw.map((it) => ({
      description: it?.description ?? it?.name ?? "",
      quantity: safeNumber(it?.quantity ?? it?.qty ?? 0),
      rate: safeNumber(it?.rate ?? it?.unitPrice ?? 0),
      total: safeNumber(
        it?.total ?? safeNumber(it?.quantity) * safeNumber(it?.rate)
      ),
    }));
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

const ensurePercent = (v) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return `${v}%`;
  if (typeof v === "string") {
    const t = v.trim();
    return t.endsWith("%") ? t : `${t}%`;
  }
  return String(v);
};

const mapFieldValue = (fieldName, invoiceData = {}, project = {}) => {
  const ld = (k) => invoiceData[k] ?? invoiceData[k.toLowerCase()] ?? "";
  switch ((fieldName || "").toString()) {
    case "invoiceNo":
    case "invoice_no":
    case "invoiceNoBox":
      return (
        ld("invoiceNo") ||
        ld("invoice_no") ||
        invoiceData.invoiceNo ||
        invoiceData.invoice_number ||
        ""
      );
    case "invoiceDate":
    case "invoice_date":
      return (
        ld("invoiceDate") ||
        invoiceData.invoiceDate ||
        invoiceData.invoice_date ||
        ""
      );
    case "placeOfSupply":
      return (
        ld("placeOfSupply") ||
        project.service ||
        invoiceData.placeOfSupply ||
        ""
      );
    case "poDate":
    case "po_date":
      return (
        ld("poDate") || invoiceData.referenceDate || invoiceData.poDate || ""
      );
    case "poNumber":
    case "po_number":
      return (
        ld("poNumber") || invoiceData.referenceId || invoiceData.poNumber || ""
      );
    case "billTo_name":
      return (
        ld("billTo_name") ||
        project.company ||
        project.companyName ||
        project.name ||
        ""
      );
    case "billTo_address":
      return ld("billTo_address") || project.address || "";
    case "billTo_contact":
      return (
        ld("billTo_contact") || project.clientNumber || project.contact || ""
      );
    case "billTo_gstin":
      return ld("billTo_gstin") || project.gst || "";
    case "billTo_state":
      return ld("billTo_state") || project.state || "";
    case "subTotal":
      return ld("subTotal") || invoiceData.subTotal || "";
    case "grandTotal":
    case "total":
      return (
        ld("grandTotal") ||
        invoiceData.totalAmount ||
        invoiceData.totalIncludingTax ||
        invoiceData.total ||
        ""
      );
    case "advance":
      return ld("advance") || invoiceData.advance || "";
    case "amountInWords":
      return (
        ld("amountInWords") ||
        numberToWords(
          Math.round(
            invoiceData.totalIncludingTax || invoiceData.totalAmount || 0
          )
        )
      );
    case "termsAndConditions":
      return ld("termsAndConditions") || invoiceData.terms || "";
    case "bankDetails":
      return (
        ld("bankDetails") ||
        invoiceData.bankDetails ||
        project.bankDetails ||
        ""
      );
    default:
      return ld(fieldName) || "";
  }
};

function renderBox(b, invoiceData, project, keyIndex) {
  if (!b || typeof b !== "object") return null;
  const style = b.style || {};
  const x = b.xPct || b.x || style.xPct;
  const y = b.yPct || b.y || style.yPct;
  const w = b.wPct || b.w || style.wPct;
  const h = b.hPct || b.h || style.hPct;

  const inline = {
    position: "absolute",
    left: ensurePercent(x) || "0%",
    top: ensurePercent(y) || "0%",
    width: ensurePercent(w) || "auto",
    height: ensurePercent(h) || "auto",
    overflow: "hidden",
    boxSizing: "border-box",
    whiteSpace: "pre-wrap",
    ...mapGrapesToCss(style),
  };

  if (b.type === "image" || b.fieldType === "image") {
    const src =
      b.imageUrl ||
      b.content ||
      b.src ||
      (b.attributes && b.attributes.src) ||
      "";
    const url = src || "";
    return (
      <div
        key={keyIndex}
        style={inline}
        className={`tpl-box tpl-image ${b.fieldName || ""}`}
      >
        {url ? (
          <img
            src={url}
            alt={b.label || b.fieldName || "img"}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : null}
      </div>
    );
  }

  if (b.type === "table" || b.fieldType === "table") {
    const headers = b.tableHeaders || b.headers || [];
    const templateRows = b.tableRows || [];
    const items = invoiceData.lineItems
      ? safeParseLineItems(invoiceData.lineItems)
      : null;
    return (
      <div
        key={keyIndex}
        style={{ ...inline }}
        className={`tpl-box tpl-table ${b.fieldName || ""}`}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    border: "1px solid #ddd",
                    padding: 6,
                    textAlign: "left",
                    background: style.headerBackground || "#eee",
                    color: style.headerColor || "#000",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items && items.length
              ? items.map((it, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}>
                      {idx + 1}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}>
                      {it.description || "—"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: 6,
                        textAlign: "center",
                      }}
                    >
                      {it.quantity}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}>
                      {fmtINR(it.rate)}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}>
                      {fmtINR(it.total)}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}></td>
                    <td style={{ border: "1px solid #ddd", padding: 6 }}>
                      {fmtINR(it.total)}
                    </td>
                  </tr>
                ))
              : templateRows && templateRows.length
              ? templateRows.map((r, idx) => (
                  <tr key={idx}>
                    {r.map((cell, cidx) => (
                      <td
                        key={cidx}
                        style={{ border: "1px solid #ddd", padding: 6 }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    );
  }

  const content =
    b.content ||
    b.label ||
    mapFieldValue(b.fieldName, invoiceData, project) ||
    "";
  return (
    <div
      key={keyIndex}
      style={inline}
      className={`tpl-box tpl-field ${b.fieldName || ""}`}
    >
      <div
        dangerouslySetInnerHTML={{
          __html: escapeHtml(String(content || "")).replace(/\n/g, "<br/>"),
        }}
      />
    </div>
  );
}

function mapGrapesToCss(style = {}) {
  const css = {};
  if (!style) return css;
  if (style.background) css.background = style.background;
  if (style.color) css.color = style.color;
  if (style.fontSize)
    css.fontSize =
      typeof style.fontSize === "number"
        ? `${style.fontSize}px`
        : style.fontSize;
  if (style.fontWeight) css.fontWeight = style.fontWeight;
  if (style.textAlign) css.textAlign = style.textAlign;
  if (style.padding !== undefined)
    css.padding =
      typeof style.padding === "number" ? `${style.padding}px` : style.padding;
  if (style.borderColor) css.border = `1px solid ${style.borderColor}`;
  if (style.fontStyle) css.fontStyle = style.fontStyle;
  if (style.fontFamily) css.fontFamily = style.fontFamily;
  return css;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const InvoicePrint = React.forwardRef(
  (
    {
      invoiceData = {},
      templateHtml = null,
      templateCss = null,
      grapesJson = null,
      watermarkUrl = null,
      watermarkProps = null,
    },
    ref
  ) => {
    const {
      withSeal = false,
      invoiceType = "",
      invoiceNo = "",
      invoiceDate = "",
      referenceId = "",
      referenceDate = "",
      totalExcludingTax: rawTotalExcl = 0,
      gstAmount: rawGstAmount = 0,
      terms = "",
      gst: rawGst = 0,
      totalIncludingTax: rawTotalIncl = 0,
      advance: rawRawAdvance = 0,
      project = {},
      headerUrl = null,
      footerUrl = null,
    } = invoiceData;

    let grapesObj =
      grapesJson || invoiceData.grapesJson || invoiceData.grapes_json || null;
    if (typeof grapesObj === "string") {
      try {
        grapesObj = JSON.parse(grapesObj);
      } catch (e) {}
    }

    let metaObj = invoiceData.meta || invoiceData.meta_data || null;
    if (typeof metaObj === "string") {
      try {
        metaObj = JSON.parse(metaObj);
      } catch (e) {
        metaObj = invoiceData.meta;
      }
    }

    const resolvedQr =
      invoiceData.qrUrl ||
      invoiceData.qr ||
      (metaObj && metaObj.uploads && metaObj.uploads.qr) ||
      null;
    const resolvedSeal =
      invoiceData.sealUrl ||
      invoiceData.seal ||
      (metaObj && metaObj.uploads && metaObj.uploads.seal) ||
      null;

    const gst = safeNumber(rawGst);
    const gstAmount = safeNumber(rawGstAmount);
    const totalExcludingTax = safeNumber(rawTotalExcl);
    const totalIncludingTax = safeNumber(rawTotalIncl);
    const advance = safeNumber(rawRawAdvance);

    const parsedLineItems = safeParseLineItems(invoiceData.lineItems);

    const totals = parsedLineItems.reduce(
      (acc, item) => {
        acc.quantity += safeNumber(item.quantity);
        acc.amount += safeNumber(item.rate);
        acc.total += safeNumber(item.total);
        return acc;
      },
      { quantity: 0, amount: 0, total: 0 }
    );

    const totalGSTFromLines = parsedLineItems.reduce(
      (acc, item) => acc + (safeNumber(item.total) * gst) / 100,
      0
    );

    const effectiveGstAmount =
      gstAmount || Number(totalGSTFromLines.toFixed(2));
    const grossTotal = totals.total + effectiveGstAmount;
    const halfGSTRate = (gst / 2).toFixed(2);
    const halfGSTAmount = (effectiveGstAmount / 2).toFixed(2);

    let finalWatermarkUrl =
      watermarkUrl ||
      (grapesObj && grapesObj.watermark && grapesObj.watermark.url) ||
      (metaObj && metaObj.uploads && metaObj.uploads.watermark) ||
      null;
    let finalWatermarkProps = watermarkProps ||
      (grapesObj && grapesObj.watermark) ||
      (metaObj && metaObj.watermarkPlacement) || {
        xPct: "50%",
        yPct: "50%",
        wPct: "60%",
        hPct: "60%",
        opacity: 0.12,
      };

    const buildBodyFromLayout = () => {
      const layout =
        (grapesObj && Array.isArray(grapesObj.layout) && grapesObj.layout) ||
        (invoiceData.layout &&
          (typeof invoiceData.layout === "string"
            ? safeParseJson(invoiceData.layout)
            : invoiceData.layout)) ||
        null;
      if (!layout || !Array.isArray(layout)) return null;

      const containerStyle = {
        position: "relative",
        width: "100%",
        minHeight: "100px",
      };
      return (
        <div className="template-layout-wrapper" style={containerStyle}>
          {layout.map((b, idx) => {
            if (b && typeof b.content === "string") {
              b.content = replacePlaceholdersInString(
                b.content,
                invoiceData,
                project
              );
            }
            return renderBox(b, invoiceData, project, `box-${idx}`);
          })}
        </div>
      );
    };

    const safeParseJson = (s) => {
      try {
        return typeof s === "string" ? JSON.parse(s) : s;
      } catch {
        return null;
      }
    };

    const replacePlaceholdersInString = (s = "", inv = {}, proj = {}) => {
      try {
        return s
          .replace(/{{\s*invoiceNo\s*}}/gi, inv.invoiceNo || "")
          .replace(
            /{{\s*invoiceDate\s*}}/gi,
            inv.invoiceDate ? formatDate(inv.invoiceDate) : ""
          )
          .replace(/{{\s*placeOfSupply\s*}}/gi, proj.service || "")
          .replace(/{{\s*poNumber\s*}}/gi, inv.referenceId || "")
          .replace(
            /{{\s*poDate\s*}}/gi,
            inv.referenceDate ? formatDate(inv.referenceDate) : ""
          );
      } catch {
        return s;
      }
    };

    return (
      <div
        ref={ref}
        className="invoice-print-container"
        style={{ position: "relative" }}
      >
        {templateCss ? (
          <style dangerouslySetInnerHTML={{ __html: templateCss }} />
        ) : null}

        {finalWatermarkUrl ? (
          <img
            src={finalWatermarkUrl}
            alt="Watermark"
            className="invoice-watermark"
            style={{
              position: "absolute",
              left: ensurePercent(finalWatermarkProps.xPct) || "50%",
              top: ensurePercent(finalWatermarkProps.yPct) || "50%",
              width: ensurePercent(finalWatermarkProps.wPct) || "60%",
              height: finalWatermarkProps.hPct
                ? ensurePercent(finalWatermarkProps.hPct)
                : "auto",
              transform: "translate(-50%, -50%)",
              opacity: String(finalWatermarkProps.opacity ?? 0.12),
              pointerEvents: "none",
              zIndex: 0,
              objectFit: "contain",
            }}
          />
        ) : null}

        {headerUrl ? (
          <div
            className="invoice-print-header custom-header"
            style={{ zIndex: 3, position: "relative" }}
          >
            <img
              src={headerUrl}
              alt="Custom header"
              style={{ width: "100%", display: "block", objectFit: "contain" }}
            />
          </div>
        ) : null}

        <div style={{ position: "relative", zIndex: 4 }}>
          {templateHtml || invoiceData.html ? (
            <div
              className="invoice-body-from-html"
              dangerouslySetInnerHTML={{
                __html: templateHtml || invoiceData.html || "",
              }}
            />
          ) : (
            buildBodyFromLayout() || (
              <div>
                <div className="invoice-title-section">
                  <div className="invoice-title-block">
                    {(invoiceType === "tax"
                      ? "Tax Invoice"
                      : invoiceType === "proforma"
                      ? "Proforma Invoice"
                      : invoiceType || ""
                    ).toUpperCase()}
                  </div>
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
                        <span className="label">Invoice No</span>:{" "}
                        <strong>{invoiceNo || "—"}</strong>
                      </p>
                      <p>
                        <span className="label">Invoice Date</span>:{" "}
                        <strong>
                          {invoiceDate ? formatDate(invoiceDate) : "—"}
                        </strong>
                      </p>
                      <p>
                        <span className="label">Place of supply</span>:{" "}
                        <strong>{project.service || "—"}</strong>
                      </p>
                      <p>
                        <span className="label">PO Date</span>:{" "}
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
                      <th>Quantity</th>
                      <th>Amount</th>
                      <th>Sub total</th>
                      <th>GST ({gst}%)</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedLineItems.map((item, idx) => {
                      const lineTotal = safeNumber(item.total);
                      const lineGST = (lineTotal * gst) / 100;
                      const lineGross = lineTotal + lineGST;
                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{item.description || "—"}</td>
                          <td>{item.quantity}</td>
                          <td>{fmtINR(item.rate)}</td>
                          <td>{fmtINR(lineTotal)}</td>
                          <td>{fmtINR(Number(lineGST.toFixed(2)))}</td>
                          <td>{fmtINR(Number(lineGross.toFixed(2)))}</td>
                        </tr>
                      );
                    })}

                    {(() => {
                      const fixedRows = 4;
                      const emptyRowCount = Math.max(
                        0,
                        fixedRows - parsedLineItems.length
                      );
                      return emptyRowCount > 0
                        ? Array.from({ length: emptyRowCount }).map((_, i) => (
                            <tr key={`empty-${i}`}>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                            </tr>
                          ))
                        : null;
                    })()}

                    <tr className="totals-row">
                      <td></td>
                      <td>
                        <strong>Totals</strong>
                      </td>
                      <td>
                        <strong>{totals.quantity}</strong>
                      </td>
                      <td>
                        <strong>{fmtINR(totals.amount)}</strong>
                      </td>
                      <td>
                        <strong>{fmtINR(totals.total)}</strong>
                      </td>
                      <td>
                        <strong>{fmtINR(effectiveGstAmount)}</strong>
                      </td>
                      <td>
                        <strong>{fmtINR(grossTotal)}</strong>
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
                          <p>{fmtINR(totalExcludingTax)}</p>
                          <p>{halfGSTRate}%</p>
                          <p>{fmtINR(halfGSTAmount)}</p>
                        </div>
                        <div className="tax-box-body">
                          <p className="tax-gst">SGST</p>
                          <p>{fmtINR(totalExcludingTax)}</p>
                          <p>{halfGSTRate}%</p>
                          <p>{fmtINR(halfGSTAmount)}</p>
                        </div>
                      </>
                    ) : (
                      <div className="tax-box-body">
                        <p className="tax-gst">IGST</p>
                        <p>{fmtINR(totalExcludingTax)}</p>
                        <p>{gst}%</p>
                        <p>{fmtINR(effectiveGstAmount)}</p>
                      </div>
                    )}

                    <p className="amount-in-words">
                      <strong>Order Amount in words</strong>
                    </p>
                    <div className="amount-in-words-text">
                      {numberToWords(
                        Math.round(totalIncludingTax || grossTotal)
                      )}
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
                          <p>{fmtINR(grossTotal)}</p>
                        </div>
                      </div>
                      <div className="amounts-section">
                        <div className="total-block">
                          <p className="bold">Total</p>
                          <p className="bold">{fmtINR(grossTotal)}</p>
                        </div>
                        <div className="total-block">
                          <p>Advance</p>
                          <p>{fmtINR(advance)}</p>
                        </div>
                      </div>
                      <div className="amounts-section">
                        <div className="total-block">
                          <p>Payable Amount</p>
                          <p>{fmtINR(totalIncludingTax || grossTotal)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <footer className="invoice-footer">
                  <div className="footer-partition">
                    <strong>
                      <h4>Bank Details</h4>
                    </strong>
                    <div className="bank-details">
                      <div className="qr-code">
                        <img
                          src={resolvedQr || "/images/upi-qr-code.png"}
                          alt="UPI QR Code"
                        />
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
                        Account holder's name: Sukalpa Tech Solutions Pvt Ltd
                      </p>
                    </div>
                  </div>
                  <div className="seal-signs">
                    <p>For: Sukalpa Tech Solutions Pvt Ltd</p>
                    {withSeal ? (
                      <div className="seal">
                        <img
                          src={resolvedSeal || "/images/seal.png"}
                          alt="SEAL"
                          style={{
                            maxWidth: 150,
                            maxHeight: 150,
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="no-seal" />
                    )}
                    <strong>
                      <p className="authorized">Authorized Signatory</p>
                    </strong>
                  </div>
                </footer>
              </div>
            )
          )}
        </div>

        {footerUrl ? (
          <footer
            className="invoice-footer custom-footer"
            style={{ zIndex: 3, position: "relative" }}
          >
            <img
              src={footerUrl}
              alt="Custom footer"
              style={{ width: "100%", display: "block", objectFit: "contain" }}
            />
          </footer>
        ) : null}
      </div>
    );
  }
);

InvoicePrint.displayName = "InvoicePrint";

export default InvoicePrint;
