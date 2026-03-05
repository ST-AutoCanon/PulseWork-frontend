"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvoicePrint from "./InvoicePrint.client";
import "./Invoice.css";
import {
  MdOutlineCancel,
  MdOutlineKeyboardBackspace,
  MdOutlineEdit,
} from "react-icons/md";
import { FiDownload, FiEye } from "react-icons/fi";
import { GrStatusGood } from "react-icons/gr";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

const protectedImageCache = new Map();
async function fetchProtectedImageAsBlobUrl(src, apiKey) {
  if (!src) return null;
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;
  const cached = protectedImageCache.get(src);
  if (cached) return cached;
  try {
    const res = await fetch(src, {
      method: "GET",
      credentials: "include",
      headers: { "x-api-key": apiKey || "" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Image fetch failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    protectedImageCache.set(src, url);
    return url;
  } catch (err) {
    console.warn(
      "fetchProtectedImageAsBlobUrl failed",
      src,
      err && err.message,
    );
    return src;
  }
}

const Invoice = ({ onBack, project }) => {
  const { user } = useAuth();
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
    /\/$/,
    "",
  );
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const orgId = user?.orgId ?? user?.org_id ?? null;

  const buildHeaders = () => {
    const h = {
      "Content-Type": "application/json",
      "x-api-key": API_KEY || "",
      "x-org-id": orgId,
    };
    const meId = user?.employeeId ?? user?.id ?? null;
    if (meId) h["x-employee-id"] = String(meId);
    return h;
  };

  const [invoiceList, setInvoiceList] = useState([]);
  const [invoiceUpdates, setInvoiceUpdates] = useState({});
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceType, setInvoiceType] = useState("tax");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [terms, setTerms] = useState(
    `1) Payment Terms:
  a) Initial Invoice: 15% of the total cost
  b) Second Payment: 25%
  c) Third Payment: 30%
  d) Final Payment: 30%
2) Taxes & Duties: IGST will be applicable as per prevailing tax laws.`,
  );

  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [referenceDate, setReferenceDate] = useState("");

  const [lineItems, setLineItems] = useState([
    { description: "", quantity: 1, rate: 0, total: 0 },
  ]);

  const [gst, setGST] = useState("18");
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);

  const [subTotal, setSubTotal] = useState(0);
  const [gstAmount, setGSTAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [totalExcludingTax, setTotalExcludingTax] = useState(0);
  const [totalIncludingTax, setTotalIncludingTax] = useState(0);
  const [showTdsModal, setShowTdsModal] = useState(false);
  const [tdsForInvoiceId, setTdsForInvoiceId] = useState(null);
  const [isTdsDeducted, setIsTdsDeducted] = useState(false);
  const [tdsAmount, setTdsAmount] = useState("");
  const [showSealModal, setShowSealModal] = useState(false);
  const [withSeal, setWithSeal] = useState(false);

  const [activeTab, setActiveTab] = useState("tax");

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  const fetchInvoices = async () => {
    if (!BACKEND_URL || !project?.id) return;
    try {
      const response = await fetch(
        `${BACKEND_URL}/invoice?projectId=${project.id}`,
        {
          method: "GET",
          credentials: "include",
          headers: buildHeaders(),
        },
      );
      if (!response.ok) {
        throw new Error("Error fetching invoices");
      }
      const data = await response.json();
      const invoices = data.invoices ?? data.message ?? data ?? [];
      setInvoiceList(Array.isArray(invoices) ? invoices : []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      showAlert("Failed to fetch invoices.");
    }
  };

  useEffect(() => {
    if (project?.id) fetchInvoices();
  }, [project?.id, user?.employeeId, BACKEND_URL]);

  async function resolveHeaderFooterUrlsFromTemplate(tpl) {
    if (!tpl) return {};

    let grapesObj = tpl.grapesJson || tpl.grapes_json || null;
    if (grapesObj && typeof grapesObj === "string") {
      try {
        grapesObj = JSON.parse(grapesObj);
      } catch (e) {}
    }

    const meta =
      tpl.meta ||
      (tpl.meta && typeof tpl.meta === "string"
        ? JSON.parse(tpl.meta)
        : tpl.meta) ||
      {};
    const uploads = meta.uploads || {};

    const fetchIfNeeded = async (src) => {
      if (!src) return null;
      const normalized = normalizeUploadUrl(src);
      try {
        const blob = await fetchProtectedImageAsBlobUrl(normalized, API_KEY);
        return blob || normalized;
      } catch (e) {
        return normalized;
      }
    };

    const candidateHeader =
      uploads.header ||
      tpl.header_url ||
      tpl.headerUrl ||
      tpl.header ||
      tpl.thumbnail ||
      tpl.imageUrl ||
      tpl.cleanedUrl ||
      tpl.cleaned_url ||
      null;
    const candidateFooter =
      uploads.footer ||
      tpl.footer_url ||
      tpl.footerUrl ||
      tpl.footer ||
      tpl.cleanedUrl ||
      tpl.cleaned_url ||
      null;
    const candidateWatermark =
      uploads.watermark ||
      (grapesObj && grapesObj.watermark && grapesObj.watermark.url) ||
      (meta && typeof meta.watermark === "string" ? meta.watermark : null) ||
      null;

    const contentHtml = tpl.html || tpl.content || tpl.template || "";
    function extractFirstImageSrcsFromHtml(html) {
      const out = [];
      if (!html || typeof html !== "string") return out;
      try {
        const re = /<img[^>]+src=(["'])([^"']+)\1/gi;
        let m;
        while ((m = re.exec(html))) {
          out.push(m[2]);
        }
      } catch (e) {}
      return out;
    }
    const imgSrcs = extractFirstImageSrcsFromHtml(contentHtml);

    let headerUrl = await fetchIfNeeded(candidateHeader);
    let footerUrl = await fetchIfNeeded(candidateFooter);
    let watermarkUrl = await fetchIfNeeded(candidateWatermark);

    if (!headerUrl && imgSrcs.length) {
      headerUrl = await fetchIfNeeded(imgSrcs[0]);
    }
    if (!footerUrl && imgSrcs.length > 1) {
      footerUrl = await fetchIfNeeded(imgSrcs[imgSrcs.length - 1]);
    }

    if ((!headerUrl || !footerUrl) && grapesObj) {
      const found = [];
      const collect = (o) => {
        if (!o) return;
        if (typeof o === "string") {
          if (
            /\/api\/orgs\/\d+\/uploads\//.test(o) ||
            /^[0-9]{6,}_[A-Za-z0-9._-]+/.test(o)
          )
            found.push(o);
          return;
        }
        if (Array.isArray(o)) return o.forEach(collect);
        if (typeof o === "object") {
          if (o.attributes && typeof o.attributes.src === "string")
            collect(o.attributes.src);
          Object.keys(o).forEach((k) => collect(o[k]));
        }
      };
      collect(grapesObj);
      if (!headerUrl && found.length) headerUrl = await fetchIfNeeded(found[0]);
      if (!footerUrl && found.length > 1)
        footerUrl = await fetchIfNeeded(found[found.length - 1]);
      if (
        !watermarkUrl &&
        grapesObj &&
        grapesObj.watermark &&
        grapesObj.watermark.url
      ) {
        watermarkUrl = await fetchIfNeeded(grapesObj.watermark.url);
      }
    }

    let watermarkProps = null;
    if (grapesObj && grapesObj.watermark) {
      const gm = grapesObj.watermark;
      watermarkProps = {
        xPct: gm.xPct || gm.x || "50%",
        yPct: gm.yPct || gm.y || "50%",
        wPct: gm.wPct || gm.w || "60%",
        hPct: gm.hPct || gm.h || "60%",
        opacity:
          typeof gm.opacity === "number"
            ? gm.opacity
            : meta && meta.watermarkPlacement && meta.watermarkPlacement.opacity
              ? meta.watermarkPlacement.opacity
              : 0.12,
      };
    } else if (meta && meta.watermarkPlacement) {
      const wp = meta.watermarkPlacement;
      watermarkProps = {
        xPct: wp.xPct || "50%",
        yPct: wp.yPct || "50%",
        wPct: wp.wPct || "60%",
        hPct: wp.hPct || "60%",
        opacity: typeof wp.opacity === "number" ? wp.opacity : 0.12,
      };
    }

    const fieldsMap = {};
    try {
      const layoutArr =
        tpl.layout ||
        tpl.layout_json ||
        (grapesObj && grapesObj.layout) ||
        null;
      let layout = null;
      if (typeof layoutArr === "string") {
        try {
          layout = JSON.parse(layoutArr);
        } catch (e) {
          layout = null;
        }
      } else layout = layoutArr;

      if (Array.isArray(layout)) {
        for (const b of layout) {
          try {
            const key = (b.fieldName || b.id || b.name || "").toString();
            if (!key) continue;
            if (b.content) fieldsMap[key] = b.content;
            if (b.imageUrl) fieldsMap[key] = b.imageUrl;
            if (b.tableRows) fieldsMap[key] = b.tableRows;
          } catch (e) {}
        }
      }
    } catch (e) {}

    const css = tpl.css || tpl.styles || null;
    const bodyType = (meta && meta.bodyType) || tpl.bodyType || null;

    return {
      headerUrl,
      footerUrl,
      watermarkUrl,
      watermarkProps,
      css,
      bodyType,
      fieldsMap,
    };
  }

  useEffect(() => {
    let newSubTotal = 0;
    const updated = lineItems.map((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const total = qty * rate;
      newSubTotal += total;
      return { ...item, total };
    });
    setSubTotal(newSubTotal);
    setLineItems(updated);
  }, [lineItems.map((li) => `${li.quantity}:${li.rate}`).join("|")]);

  useEffect(() => {
    const base = parseFloat(subTotal) || 0;
    const gstPerc = parseFloat(gst) || 0;
    const computedGST = base * (gstPerc / 100);
    setGSTAmount(Number(computedGST.toFixed(2)));
    setTotalAmount(Number((base + computedGST).toFixed(2)));
  }, [subTotal, gst]);

  useEffect(() => {
    const sub = parseFloat(subTotal) || 0;
    const adv = parseFloat(advance) || 0;
    const gstAmt = parseFloat(gstAmount) || 0;
    const excl = sub - adv;
    setTotalExcludingTax(excl);
    setTotalIncludingTax(excl + gstAmt);
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

  const handleAddInvoice = () => {
    setShowInvoiceForm(true);
  };

  const handleCancelForm = () => {
    setShowInvoiceForm(false);
    resetFormFields();
  };

  const resetFormFields = () => {
    setInvoiceType("tax");
    setInvoiceDate("");
    setInvoiceNo("");
    setReferenceId("");
    setReferenceDate("");
    setLineItems([{ description: "", quantity: 1, rate: 0, total: 0 }]);
    setGST("18");
    setSubTotal(0);
    setGSTAmount(0);
    setTotalAmount(0);
    setAdvance(0);
    setTotalExcludingTax(0);
    setTotalIncludingTax(0);
    setEditingInvoiceId(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // 🔒 prevent double click

    if (!BACKEND_URL) {
      showAlert("Backend not configured");
      return;
    }

    setIsSubmitting(true); // 🔒 lock button

    const combinedDescription = lineItems
      .map(
        (item, idx) =>
          `Line ${idx + 1}: ${item.description} (Qty: ${item.quantity}, Rate: ${
            item.rate
          })`,
      )
      .join("; ");

    const newInvoice = {
      projectId: project.id,
      invoiceType,
      invoiceDate,
      invoiceNo,
      referenceId,
      referenceDate,
      terms,
      lineItems,
      subTotal,
      advance,
      totalExcludingTax,
      gst,
      gstAmount,
      totalAmount,
      totalIncludingTax,
      workDescription: combinedDescription,
    };

    try {
      let response;

      if (editingInvoiceId) {
        response = await fetch(`${BACKEND_URL}/invoice/${editingInvoiceId}`, {
          method: "PUT",
          credentials: "include",
          headers: buildHeaders(),
          body: JSON.stringify(newInvoice),
        });
      } else {
        response = await fetch(`${BACKEND_URL}/invoice`, {
          method: "POST",
          credentials: "include",
          headers: buildHeaders(),
          body: JSON.stringify(newInvoice),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to submit invoice");
      }

      const savedInvoice = await response.json();

      if (editingInvoiceId) {
        setInvoiceList((prev) =>
          prev.map((inv) => (inv.id === editingInvoiceId ? savedInvoice : inv)),
        );
      } else {
        setInvoiceList((prev) => [...prev, savedInvoice]);
        await fetchInvoices();
      }

      setShowInvoiceForm(false);
      resetFormFields();
      setEditingInvoiceId(null);

      showAlert(
        editingInvoiceId
          ? "Invoice updated successfully."
          : "Invoice created successfully.",
      );
    } catch (error) {
      console.error(error);
      showAlert("Failed to save invoice.");
    } finally {
      setIsSubmitting(false); // 🔓 always unlock
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoiceId(invoice.id);
    setInvoiceType(invoice.invoiceType);
    setInvoiceDate(
      invoice.invoiceDate
        ? new Date(invoice.invoiceDate).toISOString().split("T")[0]
        : "",
    );
    setInvoiceNo(invoice.invoiceNo || "");
    setReferenceId(invoice.referenceId || "");
    setReferenceDate(
      invoice.referenceDate ? invoice.referenceDate.split("T")[0] : "",
    );

    if (invoice.lineItems) {
      let parsedItems = invoice.lineItems;
      if (typeof parsedItems === "string") {
        try {
          parsedItems = JSON.parse(parsedItems);
        } catch (err) {
          parsedItems = [];
        }
      }
      if (!Array.isArray(parsedItems)) parsedItems = [];
      setLineItems(
        parsedItems.length
          ? parsedItems
          : [{ description: "", quantity: 1, rate: 0, total: 0 }],
      );
    } else {
      setLineItems([{ description: "", quantity: 1, rate: 0, total: 0 }]);
    }

    setGST(invoice.gst ?? "18");
    setSubTotal(invoice.subTotal ?? 0);
    setAdvance(invoice.advance ?? 0);
    setGSTAmount(invoice.gstAmount ?? 0);
    setTotalExcludingTax(invoice.totalExcludingTax ?? 0);
    setTotalIncludingTax(invoice.totalIncludingTax ?? 0);
    setTotalAmount(invoice.totalAmount ?? 0);
    setTerms(invoice.terms ?? "");
    setShowInvoiceForm(true);
  };

  const handleDownloadClick = (invoice) => {
    setSelectedInvoice(invoice);
    setShowSealModal(true);
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      setSelectedInvoice(invoice || null);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const element = document.getElementById("printableArea");
      if (!element) {
        console.error("Printable area not found");
        showAlert("Printable area not found");
        return;
      }

      const waitForImagesToLoad = (rootEl, timeout = 7000) =>
        new Promise((resolve) => {
          const imgs = Array.from(rootEl.querySelectorAll("img"));
          if (imgs.length === 0) return resolve();

          let loaded = 0;
          const onLoadOrError = () => {
            loaded++;
            if (loaded >= imgs.length) resolve();
          };

          imgs.forEach((img) => {
            if (img.complete && img.naturalWidth !== 0) {
              onLoadOrError();
            } else {
              try {
                img.crossOrigin = "anonymous";
              } catch (e) {}
              img.addEventListener("load", onLoadOrError);
              img.addEventListener("error", onLoadOrError);
            }
          });

          setTimeout(resolve, timeout);
        });

      await waitForImagesToLoad(element, 7000);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgWidth = pdfWidth - 20;
      const ratio = imgWidth / canvasWidth;
      const imgHeight = canvasHeight * ratio;

      const pageInnerHeight = pdfHeight - 20;

      if (imgHeight <= pageInnerHeight) {
        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let pageCount = 0;
        while (heightLeft > 0) {
          const y = 10 - pageCount * pageInnerHeight;
          pdf.addImage(imgData, "PNG", 10, y, imgWidth, imgHeight);
          heightLeft -= pageInnerHeight;
          pageCount++;
          if (heightLeft > 0) pdf.addPage();
        }
      }

      pdf.save(`Invoice-${invoice.invoiceNo || Date.now()}.pdf`);
      showAlert("Invoice PDF downloaded.");
    } catch (err) {
      console.error("Error generating PDF", err);
      showAlert("Failed to generate PDF.");
    }
  };

  const filteredInvoices = invoiceList.filter((inv) => {
    if (activeTab === "tax") return inv.invoiceType === "tax";
    if (activeTab === "proforma") return inv.invoiceType === "proforma";
    return true;
  });

  const handleDropdownChange = (invoiceId, fieldName, value) => {
    setInvoiceUpdates((prevUpdates) => ({
      ...prevUpdates,
      [invoiceId]: {
        ...prevUpdates[invoiceId],
        [fieldName]: value,
      },
    }));
  };

  const handleStatusChange = (invoiceId, statusVal) => {
    if (statusVal === "Amount Recieved") {
      setTdsForInvoiceId(invoiceId);
      setIsTdsDeducted(false);
      setTdsAmount("");
      setShowTdsModal(true);
    } else {
      setInvoiceUpdates((prevUpdates) => ({
        ...prevUpdates,
        [invoiceId]: {
          ...prevUpdates[invoiceId],
          status: statusVal,
          tdsDeducted: false,
          tdsAmount: 0,
        },
      }));
    }
  };

  const handleConfirmTds = () => {
    if (tdsForInvoiceId) {
      setInvoiceUpdates((prevUpdates) => ({
        ...prevUpdates,
        [tdsForInvoiceId]: {
          ...prevUpdates[tdsForInvoiceId],
          status: "Amount Recieved",
          tdsDeducted: isTdsDeducted,
          tdsAmount: isTdsDeducted ? tdsAmount : 0,
        },
      }));
    }
    setShowTdsModal(false);
    setTdsForInvoiceId(null);
    showAlert("TDS details saved.");
  };

  const handleUpdateInvoice = async (invoice) => {
    const updateData = invoiceUpdates[invoice.id] || {};

    const val = (field) =>
      typeof updateData[field] !== "undefined"
        ? updateData[field]
        : invoice[field];

    const updatedInvoice = {
      ...invoice,

      gstPayment: val("gstPayment"),
      milestoneId: val("milestoneId"),
      status: val("status"),
      tdsDeducted: val("tdsDeducted"),
      tdsAmount: val("tdsAmount"),
    };

    try {
      const response = await fetch(
        `${BACKEND_URL}/invoice-extra/${invoice.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: buildHeaders(),
          body: JSON.stringify(updatedInvoice),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const updatedRecord = await response.json();

      setInvoiceList((prevList) =>
        prevList.map((inv) => (inv.id === invoice.id ? updatedRecord : inv)),
      );

      setInvoiceUpdates((prev) => {
        const { [invoice.id]: removed, ...rest } = prev;
        return rest;
      });

      showAlert("Invoice status updated successfully.");
    } catch (error) {
      console.error("Error updating invoice", error);
      showAlert("Failed to update invoice.");
    }
  };

  const MAX_WORDS = 100;

  const handleTermsChange = (e) => {
    const value = e.target.value;
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount <= MAX_WORDS) {
      setTerms(value);
    } else {
      const trimmedWords = value.trim().split(/\s+/).slice(0, MAX_WORDS);
      setTerms(trimmedWords.join(" "));
    }
  };

  return (
    <div id="invoiceScreen" className="invoice-page">
      <MdOutlineKeyboardBackspace className="in-back-btn" onClick={onBack} />
      <div className="project-header">
        <h2>{project?.company}</h2>
        <button className="add-project-button" onClick={handleAddInvoice}>
          + Raise New Invoice
        </button>
      </div>

      <div className="project-tabs">
        <span
          className={activeTab === "tax" ? "active-tab" : ""}
          onClick={() => setActiveTab("tax")}
        >
          Invoice
        </span>
        <span
          className={activeTab === "proforma" ? "active-tab" : ""}
          onClick={() => setActiveTab("proforma")}
        >
          Proforma Invoice
        </span>
      </div>

      <div className="invoice-list">
        {filteredInvoices.length > 0 ? (
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>GST</th>
                <th>Total</th>
                <th>GST Paid</th>
                <th>Milestones</th>
                <th>Status</th>
                <th>Update/View</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNo}</td>
                  <td>
                    {inv.invoiceDate
                      ? new Date(inv.invoiceDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td>
                    {inv.lineItems ? (
                      <div className="description-cell">
                        {(() => {
                          let items = inv.lineItems;
                          if (typeof items === "string") {
                            try {
                              items = JSON.parse(items);
                            } catch (error) {
                              console.error("Error parsing lineItems:", error);
                              items = [];
                            }
                          }
                          if (!Array.isArray(items)) {
                            items = [];
                          }
                          return items.map((item, idx) => (
                            <div key={idx}>
                              {idx + 1}] {item.description} (Qty:{" "}
                              {item.quantity}, Rate: {item.rate})
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <div className="description-cell">
                        {inv.workDescription}
                      </div>
                    )}
                  </td>
                  <td>{inv.totalExcludingTax}</td>
                  <td>{inv.gstAmount}</td>
                  <td>{inv.totalAmount}</td>
                  <td>
                    <select
                      value={
                        (invoiceUpdates[inv.id] &&
                          invoiceUpdates[inv.id].gstPayment) ||
                        inv.gstPayment ||
                        "Yet to Pay"
                      }
                      onChange={(e) =>
                        handleDropdownChange(
                          inv.id,
                          "gstPayment",
                          e.target.value,
                        )
                      }
                    >
                      <option value="Yet to Pay">Yet to Pay</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>

                  <td>
                    {inv.milestones && Array.isArray(inv.milestones) ? (
                      <select
                        value={
                          (invoiceUpdates[inv.id] &&
                            invoiceUpdates[inv.id].milestoneId) ||
                          inv.milestoneId ||
                          ""
                        }
                        onChange={(e) =>
                          handleDropdownChange(
                            inv.id,
                            "milestoneId",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">milestone</option>
                        {inv.milestones.map((ms) => (
                          <option
                            key={ms.id}
                            value={ms.id}
                            data-source={ms.source}
                          >
                            {ms.month_year || ms.milestone_details}
                          </option>
                        ))}
                      </select>
                    ) : (
                      "No milestones"
                    )}
                  </td>
                  <td>
                    <select
                      value={invoiceUpdates[inv.id]?.status ?? inv.status ?? ""}
                      onChange={(e) =>
                        handleStatusChange(inv.id, e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      <option value="Invoice Sent">Invoice Sent</option>
                      <option value="Amount Pending">Amount Pending</option>
                      <option value="Amount Recieved">Amount Recieved</option>
                    </select>
                  </td>
                  <td>
                    <div className="invoice-action-buttons">
                      <GrStatusGood
                        className="in-update-icon"
                        onClick={() => handleUpdateInvoice(inv)}
                      />
                      <FiEye
                        className="in-view-icon"
                        onClick={() => setSelectedInvoice(inv)}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="invoice-action-buttons">
                      <MdOutlineEdit
                        className="in-edit-icon"
                        onClick={() => handleEditInvoice(inv)}
                      />
                      <FiDownload
                        className="in-download-icon"
                        onClick={() => handleDownloadClick(inv)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No invoices available.</p>
        )}

        <div id="printableArea">
          {selectedInvoice && (
            <InvoicePrint
              invoiceData={{
                ...selectedInvoice,
                project,
                withSeal,
              }}
            />
          )}
        </div>
      </div>

      {showTdsModal && (
        <div className="tds-modal-overlay">
          <div className="tds-modal-content">
            <h3>TDS Deduction</h3>
            <p>Has TDS been deducted?</p>
            <div className="tds-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={isTdsDeducted}
                  onChange={(e) => setIsTdsDeducted(e.target.checked)}
                />{" "}
                Yes
              </label>
            </div>
            {isTdsDeducted && (
              <div>
                <label>
                  Enter TDS Amount:{" "}
                  <input
                    type="number"
                    value={tdsAmount}
                    onChange={(e) => setTdsAmount(e.target.value)}
                  />
                </label>
              </div>
            )}
            <button className="tds-save" onClick={handleConfirmTds}>
              Confirm
            </button>
            <button
              className="tds-cancel"
              onClick={() => setShowTdsModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showSealModal && (
        <div className="tds-modal-overlay">
          <div className="tds-modal-content">
            <h3>Download Invoice</h3>
            <p>Choose seal option:</p>
            <div className="seal-options">
              <button
                className="seal-btn"
                onClick={() => {
                  setWithSeal(true);
                  setShowSealModal(false);
                  handleDownloadInvoice(selectedInvoice);
                }}
              >
                With Seal
              </button>
              <button
                className="seal-btn"
                onClick={() => {
                  setWithSeal(false);
                  setShowSealModal(false);
                  handleDownloadInvoice(selectedInvoice);
                }}
              >
                Without Seal
              </button>
            </div>
            <button
              className="tds-cancel"
              onClick={() => setShowSealModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showInvoiceForm && (
        <div className="invoice-form-modal">
          <div className="invoice-form-content">
            <div className="invoice-card">
              <div className="invoice-header">
                <h2>New Invoice</h2>
                <MdOutlineCancel
                  onClick={handleCancelForm}
                  className="invoice-close-btn"
                />
              </div>

              <div className="invoice-section">
                <h3>Select Invoice Type</h3>
                <div className="in-radio-group">
                  <label>
                    <input
                      type="radio"
                      name="invoiceType"
                      value="tax"
                      checked={invoiceType === "tax"}
                      onChange={() => setInvoiceType("tax")}
                    />
                    Invoice
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="invoiceType"
                      value="proforma"
                      checked={invoiceType === "proforma"}
                      onChange={() => setInvoiceType("proforma")}
                    />
                    Proforma Invoice
                  </label>
                </div>
              </div>

              <div className="invoice-form">
                <div className="invoice-input-group">
                  <div>
                    <label>Invoice Date</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Invoice No</label>
                    <input
                      type="text"
                      value={invoiceNo}
                      placeholder="Auto-generated"
                      readOnly
                    />
                  </div>
                  <div>
                    <label>PO/Ref Id</label>
                    <input
                      type="text"
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>PO/Ref Date</label>
                    <input
                      type="date"
                      value={referenceDate}
                      onChange={(e) => setReferenceDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="line-items-wrapper">
                  <div className="line-items-section">
                    {lineItems.map((item, index) => (
                      <div key={index} className="line-item-row">
                        <div className="serial-number-field">
                          <label>Sl No.</label>
                          <input type="text" value={index + 1} readOnly />
                        </div>
                        <div className="description-field">
                          <label>Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="qty-field">
                          <label>Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="amount-field">
                          <label>Amount</label>
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                "rate",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="total-field">
                          <label>Total</label>
                          <input type="number" value={item.total} readOnly />
                        </div>
                        {index === lineItems.length - 1 && (
                          <div className="add-button-cell">
                            <button
                              type="button"
                              className="add-line-item-btn"
                              onClick={handleAddLineItem}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="invoice-summary">
                  <div className="terms-conditions">
                    <h4>Terms and Conditions</h4>
                    <textarea
                      value={terms}
                      onChange={handleTermsChange}
                      placeholder={`Enter terms (max ${MAX_WORDS} words)`}
                      rows={6}
                    />
                    <div className="char-counter">
                      {terms.trim().split(/\s+/).filter(Boolean).length} /{" "}
                      {MAX_WORDS} words
                    </div>
                  </div>
                  <div className="totals">
                    <div className="summary-excluding">
                      <h4>Invoice Summary</h4>
                      <div className="in-input-group">
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
                          <input
                            type="number"
                            value={totalExcludingTax}
                            readOnly
                          />
                        </div>
                        <div>
                          <label>GST</label>
                          <div className="in-gst-group">
                            <div className="in-input">
                              <input
                                type="number"
                                name="gst_percentage"
                                value={gst}
                                onChange={(e) => setGST(e.target.value)}
                              />
                            </div>
                            <span className="in-percent">%</span>
                            <input type="number" value={gstAmount} readOnly />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="summary-including">
                      <div className="in-input-group">
                        <div>
                          <label>Total Including Tax</label>
                          <input
                            type="number"
                            value={totalIncludingTax}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="invoice-buttons">
                <button
                  className="cancel-btn"
                  onClick={handleCancelForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? editingInvoiceId
                      ? "Updating..."
                      : "Submitting..."
                    : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isVisible={alertModal.isVisible}
        title={alertModal.title}
        onClose={closeAlert}
        buttons={[
          { label: "OK", className: "confirm-btn", onClick: closeAlert },
        ]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default Invoice;
