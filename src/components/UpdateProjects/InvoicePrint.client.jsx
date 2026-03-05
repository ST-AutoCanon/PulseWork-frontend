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
        it?.total ?? safeNumber(it?.quantity) * safeNumber(it?.rate),
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

const InvoicePrint = React.forwardRef(({ invoiceData = {} }, ref) => {
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
    advance: rawAdvance = 0,
    project = {},
  } = invoiceData;

  const gst = safeNumber(rawGst);
  const gstAmount = safeNumber(rawGstAmount);
  const totalExcludingTax = safeNumber(rawTotalExcl);
  const totalIncludingTax = safeNumber(rawTotalIncl);
  const advance = safeNumber(rawAdvance);

  const parsedLineItems = safeParseLineItems(invoiceData.lineItems);

  const totals = parsedLineItems.reduce(
    (acc, item) => {
      acc.quantity += safeNumber(item.quantity);
      acc.amount += safeNumber(item.rate);
      acc.total += safeNumber(item.total);
      return acc;
    },
    { quantity: 0, amount: 0, total: 0 },
  );

  const totalGSTFromLines = parsedLineItems.reduce(
    (acc, item) => acc + (safeNumber(item.total) * gst) / 100,
    0,
  );

  // Prefer explicit gstAmount (server-side) but fall back to computed
  const effectiveGstAmount = gstAmount || Number(totalGSTFromLines.toFixed(2));
  const grossTotal = totals.total + effectiveGstAmount;

  const halfGSTRate = (gst / 2).toFixed(2);
  const halfGSTAmount = (effectiveGstAmount / 2).toFixed(2);

  return (
    <div ref={ref} className="invoice-print-container">
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
              <strong>{referenceDate ? formatDate(referenceDate) : "—"}</strong>
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
              fixedRows - parsedLineItems.length,
            );
            return emptyRowCount > 0
              ? Array.from({ length: emptyRowCount }).map((_, index) => (
                  <tr key={`empty-${index}`}>
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
            {numberToWords(Math.round(totalIncludingTax || grossTotal))}
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
              Account holder's name: Sukalpa Tech Solutions Pvt Ltd
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

      <p className="note">
        Note: We are a registered MSME under the MSMED Act. As per Section 15,
        kindly ensure payment within 45 days from the invoice date. <br />
        Timely payment supports small businesses like ours
      </p>
    </div>
  );
});

InvoicePrint.displayName = "InvoicePrint";

export default InvoicePrint;
