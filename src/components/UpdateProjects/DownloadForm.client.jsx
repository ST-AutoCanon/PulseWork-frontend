"use client";

import React, { useState, useEffect } from "react";
import "./DownloadForm.css";
import { useAuth } from "../../context/AuthProvider.client";

const MAX_WORDS = 100;

const toNumber = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const DownloadForm = ({ onSubmit, onCancel }) => {
  const { user } = useAuth();

  const createdBy = user?.employeeId ?? user?.id ?? null;
  const createdByOrg = user?.orgId ?? user?.raw?.org_id ?? null;

  const [to, setTo] = useState("");
  const [address, setAddress] = useState("");
  const [companyGst, setCompanyGst] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [referenceDate, setReferenceDate] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [withSeal, setWithSeal] = useState(false);

  const [lineItems, setLineItems] = useState([
    { description: "", quantity: 1, rate: 0, total: 0 },
  ]);

  const [subTotal, setSubTotal] = useState(0);
  const [gst, setGST] = useState(0);
  const [gstAmount, setGSTAmount] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [totalExcludingTax, setTotalExcludingTax] = useState(0);
  const [totalIncludingTax, setTotalIncludingTax] = useState(0);
  const [terms, setTerms] = useState("");

  useEffect(() => {
    let newSubTotal = 0;
    const updated = lineItems.map((item) => {
      const qty = toNumber(item.quantity);
      const rate = toNumber(item.rate);
      const total = Number((qty * rate).toFixed(2));
      newSubTotal += total;
      return { ...item, total };
    });

    const needUpdate =
      updated.some((u, i) => u.total !== (lineItems[i]?.total ?? 0)) ||
      updated.length !== lineItems.length;

    if (needUpdate) {
      setLineItems(updated);
    }
    setSubTotal(Number(newSubTotal.toFixed(2)));
  }, [lineItems.map((li) => `${li.quantity}:${li.rate}`).join("|")]);

  useEffect(() => {
    const base = toNumber(subTotal);
    const gstPerc = toNumber(gst);
    const computedGST = base * (gstPerc / 100);
    setGSTAmount(Number(computedGST.toFixed(2)));
  }, [subTotal, gst]);

  useEffect(() => {
    const sub = toNumber(subTotal);
    const adv = toNumber(advance);
    const gstAmt = toNumber(gstAmount);
    const excl = Number((sub - adv).toFixed(2));
    setTotalExcludingTax(excl);
    setTotalIncludingTax(Number((excl + gstAmt).toFixed(2)));
  }, [subTotal, advance, gstAmount]);

  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, rate: 0, total: 0 },
    ]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleTermsChange = (e) => {
    const raw = e.target.value;
    const words = raw.trim().split(/\s+/).filter(Boolean);
    if (words.length <= MAX_WORDS) {
      setTerms(raw);
    } else {
      setTerms(words.slice(0, MAX_WORDS).join(" "));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      to: to || null,
      address: address || null,
      contact: contact || null,
      companyGst: companyGst || null,
      state: state || null,
      invoiceDate: invoiceDate || null,
      referenceDate: referenceDate || null,
      referenceId: referenceId || null,
      placeOfSupply: placeOfSupply || null,
      withSeal: Boolean(withSeal),
      lineItems: (lineItems || []).map((li) => ({
        description: li.description || "",
        quantity: toNumber(li.quantity),
        rate: toNumber(li.rate),
        total: toNumber(li.total),
      })),
      subTotal: toNumber(subTotal),
      gst: toNumber(gst),
      gstAmount: toNumber(gstAmount),
      advance: toNumber(advance),
      totalExcludingTax: toNumber(totalExcludingTax),
      totalIncludingTax: toNumber(totalIncludingTax),
      terms: terms || "",
      createdBy,
      createdByOrg,
      createdAt: new Date().toISOString(),
    };

    if (onSubmit) onSubmit(payload);
  };

  return (
    <form className="download-form" onSubmit={handleSubmit}>
      <div className="download-title">
        <h2>Invoice Details</h2>
        <button className="pj-close-button" type="button" onClick={onCancel}>
          X
        </button>
      </div>
      <div className="download-form-grid">
        <div className="download-form-group">
          <label>To:</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="download-form-group">
          <label>Address:</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="download-form-group">
          <label>Contact:</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        <div className="download-form-group">
          <label>GSTIN:</label>
          <input
            type="text"
            value={companyGst}
            onChange={(e) => setCompanyGst(e.target.value)}
          />
        </div>
        <div className="download-form-group">
          <label>State:</label>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>
        <div className="download-form-group">
          <label>Invoice Date:</label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
        <div className="download-form-group">
          <label>Reference Date:</label>
          <input
            type="date"
            value={referenceDate}
            onChange={(e) => setReferenceDate(e.target.value)}
          />
        </div>
        <div className="download-form-group">
          <label>Reference ID:</label>
          <input
            type="text"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
          />
        </div>
        <div className="download-form-group">
          <label>Place of Supply:</label>
          <input
            type="text"
            value={placeOfSupply}
            onChange={(e) => setPlaceOfSupply(e.target.value)}
          />
        </div>
      </div>

      <div className="download-line-items-wrapper">
        <div className="download-line-items-section">
          {lineItems.map((item, index) => (
            <div key={index} className="download-line-item-row">
              <div className="download-serial-number-field">
                <label>Sl No.</label>
                <input type="text" value={index + 1} readOnly />
              </div>
              <div className="download-description-field">
                <label>Description</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    handleLineItemChange(index, "description", e.target.value)
                  }
                />
              </div>
              <div className="download-qty-field">
                <label>Qty</label>
                <input
                  type="number"
                  min="0"
                  value={item.quantity}
                  onChange={(e) =>
                    handleLineItemChange(index, "quantity", e.target.value)
                  }
                />
              </div>
              <div className="download-amount-field">
                <label>Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) =>
                    handleLineItemChange(index, "rate", e.target.value)
                  }
                />
              </div>
              <div className="download-total-field">
                <label>Total</label>
                <input type="number" value={item.total} readOnly />
              </div>
              <div className="download-remove-button-cell">
                <button
                  type="button"
                  className="download-remove-line-item-btn"
                  onClick={() => handleRemoveLineItem(index)}
                >
                  -
                </button>
              </div>
              <div className="download-add-button-cell">
                {index === lineItems.length - 1 && (
                  <button
                    type="button"
                    className="download-add-line-item-btn"
                    onClick={handleAddLineItem}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="download-invoice-summary">
        <div className="download-terms-conditions">
          <h4>Terms and Conditions</h4>
          <textarea
            value={terms}
            onChange={handleTermsChange}
            placeholder={`Enter terms (max ${MAX_WORDS} words)`}
            rows={6}
          />
          <div className="download-char-counter">
            {terms.trim().split(/\s+/).filter(Boolean).length} / {MAX_WORDS}{" "}
            words
          </div>
        </div>

        <div className="download-totals">
          <div className="download-summary-excluding">
            <h4>Invoice Summary</h4>
            <div className="download-input-group">
              <div>
                <label>Sub Total</label>
                <input type="number" value={subTotal} readOnly />
              </div>
              <div>
                <label>Advance Paid</label>
                <input
                  type="number"
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                />
              </div>
              <div>
                <label>Total Excluding Tax</label>
                <input type="number" value={totalExcludingTax} readOnly />
              </div>
              <div>
                <label>GST</label>
                <div className="download-gst-group">
                  <div className="download-input">
                    <input
                      type="number"
                      value={gst}
                      onChange={(e) => setGST(e.target.value)}
                    />
                  </div>
                  <span className="download-percent">%</span>
                  <input type="number" value={gstAmount} readOnly />
                </div>
              </div>
              <div>
                <label>Total Including Tax</label>
                <input type="number" value={totalIncludingTax} readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="download-checkbox-group">
        <input
          type="checkbox"
          checked={withSeal}
          onChange={(e) => setWithSeal(e.target.checked)}
        />
        <label>With Seal</label>
      </div>

      <div className="download-form-actions">
        <button type="submit">Save Details</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DownloadForm;
