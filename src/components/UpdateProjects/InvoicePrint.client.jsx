"use client";

import React from "react";
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

  const lineItemColumnCount = isOrg32 ? 8 : 7;

  return (
    <div
      ref={ref}
      className={`invoice-print-container ${isOrg32 ? "org-32" : "org-1"}`}
    >
      {Boolean(isCancelled) && (
        <div className="cancelled-watermark">CANCELLED</div>
      )}
      {isOrg32 ? (
        <header className="invoice-print-header org32-header">
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
      ) : (
        <header className="invoice-print-header">
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
      )}

      <div className="invoice-content">
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
      ) : (
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
      )}

      {!isOrg32 && (
        <p className="note">
          Note: We are a registered MSME under the MSMED Act. As per Section 15,
          kindly ensure payment within 45 days from the invoice date. <br />
          Timely payment supports small businesses like ours
        </p>
      )}

      {!isOrg32 && !isOrg1 && (
        <div className="invoice-print-placeholder">
          No print template configured for this organization.
        </div>
      )}
    </div>
  );
});

InvoicePrint.displayName = "InvoicePrint";

export default InvoicePrint;
