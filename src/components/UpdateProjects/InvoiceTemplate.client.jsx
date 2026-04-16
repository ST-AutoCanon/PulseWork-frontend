"use client";

import React from "react";
import "./InvoiceTemplate.css";
import { numberToWords } from "./numberToWords.client";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";

const InvoiceTemplate = React.forwardRef((props, ref) => {
  const {
    invoiceType = "",
    invoiceNumber = "",
    downloadDetails = {},
    orgId,
  } = props;

  const normalizedType = String(invoiceType || "")
    .trim()
    .toLowerCase();
  const isOrg32 = Number(orgId) === 32;
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
    totalExcludingTax,
    totalIncludingTax,
    roundOff,
    roundOffAmount,
    finalTotalAmount,
    terms,
  } = downloadDetails;

  const parsedLineItems =
    Array.isArray(lineItems) && lineItems.length > 0 ? lineItems : [];

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

  const fixedRows = 6;
  const emptyRowCount = fixedRows - parsedLineItems.length;
  const emptyRows =
    emptyRowCount > 0 ? Array.from({ length: emptyRowCount }) : [];

  const headerTitle = isCreditNote
    ? "CREDIT NOTE"
    : invoiceType
      ? invoiceType.toUpperCase()
      : "INVOICE";

  return (
    <div ref={ref} className={`emp-inv-container ${isOrg32 ? "org-32" : ""}`}>
      {isOrg32 ? (
        <header className="org32-header">
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
      ) : (
        <header className="emp-inv-header">
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
      )}

      <div className="emp-inv-title-section">
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

      <table className="emp-inv-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Item/Service Description</th>
            {isOrg32 && <th>Part No</th>}
            <th>HSN/SAC</th>
            <th>Amount</th>
            <th>Quantity</th>
            <th>Sub total</th>
            <th>GST ({gst}%)</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {parsedLineItems.map((item, idx) => {
            const lineGST = (Number(item.total || 0) * Number(gst || 0)) / 100;
            const lineGross = Number(item.total || 0) + lineGST;
            return (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{item.description || ""}</td>
                {isOrg32 && <td>{item.partNumber || ""}</td>}
                <td>{item.hsnSac || ""}</td>
                <td>₹ {Number(item.rate || 0).toLocaleString("en-IN")}</td>
                <td>{item.quantity || ""}</td>
                <td>₹ {Number(item.total || 0).toLocaleString("en-IN")}</td>
                <td>₹ {Number(lineGST.toFixed(2)).toLocaleString("en-IN")}</td>
                <td>
                  ₹ {Number(lineGross.toFixed(2)).toLocaleString("en-IN")}
                </td>
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
            <td>
              <strong>₹ {Number(totals.amount).toLocaleString("en-IN")}</strong>
            </td>
            <td>
              <strong>{totals.quantity}</strong>
            </td>
            <td>
              <strong>
                ₹ {Number(subtotalAmount).toLocaleString("en-IN")}
              </strong>
            </td>
            <td>
              <strong>
                ₹ {Number(totalGST.toFixed(2)).toLocaleString("en-IN")}
              </strong>
            </td>
            <td>
              <strong>₹ {Number(grossTotal).toLocaleString("en-IN")}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="emp-tax-section">
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
                <p>₹ {Number(subtotalAmount || 0).toLocaleString("en-IN")}</p>
                <p>{halfGSTRate}%</p>
                <p>₹ {Number(halfGSTAmount).toLocaleString("en-IN")}</p>
              </div>
              <div className="emp-tax-box-body">
                <p className="emp-tax-label">SGST</p>
                <p>₹ {Number(subtotalAmount || 0).toLocaleString("en-IN")}</p>
                <p>{halfGSTRate}%</p>
                <p>₹ {Number(halfGSTAmount).toLocaleString("en-IN")}</p>
              </div>
            </>
          ) : (
            <div className="emp-tax-box-body">
              <p className="emp-tax-label">IGST</p>
              <p>₹ {Number(subtotalAmount || 0).toLocaleString("en-IN")}</p>
              <p>{gst}%</p>
              <p>₹ {Number(gstAmount || 0).toLocaleString("en-IN")}</p>
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
                <div>₹ {Number(subtotalAmount).toLocaleString("en-IN")}</div>
              </div>
              <div className="emp-total-block">
                <div>Round Off</div>
                <div>
                  ₹{" "}
                  {Number(roundOff ? roundOffValue : 0).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <div className="emp-amounts-section">
              <div className="emp-total-block">
                <div className="emp-bold">Total</div>
                <div className="emp-bold">
                  ₹ {Number(displayTotal || grossTotal).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="emp-total-block">
                <div>Advance</div>
                <div>₹ {Number(advance || 0).toLocaleString("en-IN")}</div>
              </div>
            </div>

            <div className="emp-amounts-section">
              <div className="emp-total-block">
                <div>Payable Amount</div>
                <div>
                  ₹ {Number(displayTotal || grossTotal).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOrg32 ? (
        <footer className="org32-footer">
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
              <span>{`Plot No. 04, 2nd Cross, Prajwani Road, Near High Court, Belur Industrial Area, Dharwad - 580 011`}</span>
            </div>
          </div>
        </footer>
      ) : (
        <>
          <footer className="emp-inv-footer">
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

          <div className="emp-note">
            <p>
              Note: We are a registered MSME under the MSMED Act. As per Section
              15, kindly ensure payment within 45 days from the invoice date.
            </p>
            <p>Timely payment supports small businesses like ours.</p>
          </div>
        </>
      )}
    </div>
  );
});

export default InvoiceTemplate;
