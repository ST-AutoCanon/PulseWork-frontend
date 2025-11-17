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
import { FiDownload } from "react-icons/fi";
import { GrStatusGood } from "react-icons/gr";
import { FiEye } from "react-icons/fi";
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
      err && err.message
    );
    return src;
  }
}

const Invoice = ({ onBack, project }) => {
  const { user } = useAuth();
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
    /\/$/,
    ""
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
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [appliedHeaderUrl, setAppliedHeaderUrl] = useState(null);
  const [appliedFooterUrl, setAppliedFooterUrl] = useState(null);

  const [downloadAfterApply, setDownloadAfterApply] = useState(false);

  const [terms, setTerms] = useState(
    `1) Payment Terms:
  a) Initial Invoice: 15% of the total cost
  b) Second Payment: 25%
  c) Third Payment: 30%
  d) Final Payment: 30%
2) Taxes & Duties: IGST will be applicable as per prevailing tax laws.`
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
          headers: buildHeaders(),
        }
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

  const fetchSavedTemplates = async () => {
    if (!BACKEND_URL || !orgId) return;
    setTemplatesLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orgs/${orgId}/templates`, {
        method: "GET",
        headers: { "x-api-key": API_KEY || "" },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Templates fetch failed (${res.status})`);
      const data = await res.json();
      const arr = Array.isArray(data)
        ? data
        : data.templates || data.data || [];
      setSavedTemplates(arr);
    } catch (err) {
      console.error("fetchSavedTemplates failed", err);
      showAlert("Failed to load saved templates.");
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchSavedTemplates();
  }, [orgId, BACKEND_URL]);

  function normalizeUploadUrl(src) {
    if (!src) return src;
    if (src.startsWith("blob:") || src.startsWith("data:")) return src;
    try {
      const url = new URL(src, window.location.origin);
      if (url.protocol === "http:" || url.protocol === "https:") {
        const frontendOrigin = window.location.origin.replace(/\/$/, "");
        if (BACKEND_URL && url.origin === frontendOrigin) {
          return BACKEND_URL + url.pathname + url.search + url.hash;
        }
        return src;
      }
    } catch (e) {}
    if (src.startsWith("/api/") && BACKEND_URL) {
      return `${BACKEND_URL}${src}`;
    }
    if (
      /^[^\/\\]+\.(png|jpe?g|svg|gif|webp)$/i.test(src) &&
      BACKEND_URL &&
      orgId
    ) {
      return `${BACKEND_URL}/api/orgs/${orgId}/uploads/${src}`;
    }
    return src;
  }

  async function replaceUploadUrlsInHtml(html = "") {
    if (!html || typeof html !== "string") return html;

    const uploadRegex =
      /https?:\/\/[^"'()\s]*\/api\/orgs\/\d+\/uploads\/[A-Za-z0-9._-]+|\/api\/orgs\/\d+\/uploads\/[A-Za-z0-9._-]+/g;
    const matches = html.match(uploadRegex);
    if (!matches || matches.length === 0) return html;

    const unique = Array.from(new Set(matches));
    const replacements = {};

    await Promise.all(
      unique.map(async (m) => {
        try {
          const normalized = normalizeUploadUrl(m);
          const blob = await fetchProtectedImageAsBlobUrl(normalized, API_KEY);
          replacements[m] = blob || normalized;
        } catch (err) {
          replacements[m] = m;
        }
      })
    );

    let out = html;
    Object.keys(replacements).forEach((orig) => {
      const safe = orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(safe, "g"), replacements[orig]);
    });

    return out;
  }

  async function resolveHeaderFooterUrlsFromTemplate(tpl) {
    if (!tpl) return { headerUrl: null, footerUrl: null };

    const headerCandidates = [
      tpl.header_url,
      tpl.headerUrl,
      tpl.header,
      tpl._headerBlob,
      tpl.imageUrl,
      tpl.cleanedUrl,
      tpl.thumbnail,
    ];
    const footerCandidates = [
      tpl.footer_url,
      tpl.footerUrl,
      tpl.footer,
      tpl._footerBlob,
    ];

    const pickFirst = (arr) =>
      arr.find((x) => typeof x === "string" && x && x.length) || null;

    let rawHeader = pickFirst(headerCandidates);
    let rawFooter = pickFirst(footerCandidates);

    const contentHtml = tpl.html || tpl.content || tpl.template || "";
    if (
      (!rawHeader || !rawFooter) &&
      typeof contentHtml === "string" &&
      contentHtml
    ) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(contentHtml, "text/html");
        const imgs = Array.from(doc.querySelectorAll("img"));

        if (!rawHeader && imgs.length > 0) {
          const headerImg =
            imgs.find((i) => (i.alt || "").toLowerCase().includes("header")) ||
            imgs[0];
          if (headerImg) rawHeader = headerImg.getAttribute("src");
        }

        if (!rawFooter && imgs.length > 0) {
          const footerImg =
            imgs
              .slice()
              .reverse()
              .find((i) => (i.alt || "").toLowerCase().includes("footer")) ||
            imgs[imgs.length - 1];
          if (footerImg) rawFooter = footerImg.getAttribute("src");
        }
      } catch (e) {}
    }

    const normalize = (src) => {
      if (!src) return null;
      if (
        src.startsWith("http") ||
        src.startsWith("blob:") ||
        src.startsWith("data:")
      )
        return src;
      return normalizeUploadUrl(src);
    };

    rawHeader = normalize(rawHeader);
    rawFooter = normalize(rawFooter);

    const headerUrl = rawHeader
      ? await fetchProtectedImageAsBlobUrl(rawHeader, API_KEY)
      : null;
    const footerUrl = rawFooter
      ? await fetchProtectedImageAsBlobUrl(rawFooter, API_KEY)
      : null;

    return { headerUrl, footerUrl };
  }

  const applyTemplateToInvoice = async (tpl) => {
    if (!tpl) {
      setAppliedHeaderUrl(null);
      setAppliedFooterUrl(null);
      showAlert("No template selected.");
      return;
    }

    try {
      let contentHtml = tpl.html || tpl.content || tpl.template || "";
      if (
        typeof contentHtml === "string" &&
        /\/api\/orgs\/\d+\/uploads\//.test(contentHtml)
      ) {
        contentHtml = await replaceUploadUrlsInHtml(contentHtml);
      }

      const { headerUrl, footerUrl } =
        await resolveHeaderFooterUrlsFromTemplate({
          ...tpl,
          html: contentHtml,
        });

      setAppliedHeaderUrl(headerUrl);
      setAppliedFooterUrl(footerUrl);

      setShowTemplatesModal(false);
      showAlert("Applied template header/footer to invoice.");

      if (downloadAfterApply) {
        setDownloadAfterApply(false);
        setTimeout(() => {
          try {
            if (selectedInvoice) {
              handleDownloadInvoice(selectedInvoice);
            } else {
              showAlert("No invoice selected to download.");
            }
          } catch (err) {
            console.error("Auto-download failed", err);
            showAlert("Auto-download failed.");
          }
        }, 350);
      }
    } catch (err) {
      console.error("applyTemplateToInvoice failed", err);
      showAlert("Failed to apply template.");
    }
  };

  const removeAppliedTemplate = () => {
    setAppliedHeaderUrl(null);
    setAppliedFooterUrl(null);
    showAlert("Custom header/footer removed. Default header/footer restored.");
  };

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
    if (!BACKEND_URL) {
      showAlert("Backend not configured");
      return;
    }

    const combinedDescription = lineItems
      .map(
        (item, idx) =>
          `Line ${idx + 1}: ${item.description} (Qty: ${item.quantity}, Rate: ${
            item.rate
          })`
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
          headers: buildHeaders(),
          body: JSON.stringify(newInvoice),
        });
      } else {
        response = await fetch(`${BACKEND_URL}/invoice`, {
          method: "POST",
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
          prev.map((inv) => (inv.id === editingInvoiceId ? savedInvoice : inv))
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
          : "Invoice created successfully."
      );
    } catch (error) {
      console.error(error);
      showAlert("Failed to save invoice.");
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoiceId(invoice.id);
    setInvoiceType(invoice.invoiceType);
    setInvoiceDate(
      invoice.invoiceDate
        ? new Date(invoice.invoiceDate).toISOString().split("T")[0]
        : ""
    );
    setInvoiceNo(invoice.invoiceNo || "");
    setReferenceId(invoice.referenceId || "");
    setReferenceDate(
      invoice.referenceDate ? invoice.referenceDate.split("T")[0] : ""
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
          : [{ description: "", quantity: 1, rate: 0, total: 0 }]
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
          headers: buildHeaders(),
          body: JSON.stringify(updatedInvoice),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const updatedRecord = await response.json();

      setInvoiceList((prevList) =>
        prevList.map((inv) => (inv.id === invoice.id ? updatedRecord : inv))
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

  const openTemplatesModal = (invoice, forDownload = false) => {
    setSelectedInvoice(invoice || null);
    setDownloadAfterApply(Boolean(forDownload));
    if (orgId) fetchSavedTemplates();
    setShowTemplatesModal(true);
  };

  const closeTemplatesModal = () => {
    setShowTemplatesModal(false);
    setDownloadAfterApply(false);
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
                          e.target.value
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
                            e.target.value
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
                        onClick={() => {
                          openTemplatesModal(inv, false);
                        }}
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
                        onClick={() => {
                          openTemplatesModal(inv, true);
                        }}
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
                headerUrl: appliedHeaderUrl,
                footerUrl: appliedFooterUrl,
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

      {showTemplatesModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="templates-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeTemplatesModal();
          }}
        >
          <div className="templates-modal">
            <div className="templates-modal-header">
              <div className="templates-modal-title">
                Choose saved template (applies header & footer)
              </div>
              <div className="templates-modal-close-container">
                <button
                  className="modeBtn templates-close-btn"
                  onClick={closeTemplatesModal}
                  aria-label="Close templates modal"
                >
                  X
                </button>
              </div>
            </div>

            <div className="templates-modal-body">
              {templatesLoading ? (
                <div className="templates-loading">Loading templates…</div>
              ) : savedTemplates.length === 0 ? (
                <div className="templates-empty">No saved templates found.</div>
              ) : (
                <div className="templates-grid">
                  {savedTemplates.map((tpl) => (
                    <div
                      key={tpl.id || tpl.name || Math.random()}
                      className="template-card"
                    >
                      <div className="template-title">
                        {tpl.name || tpl.id || "Untitled"}
                      </div>
                      <div className="template-desc">
                        {tpl.description || tpl.template_type || ""}
                      </div>

                      <div className="template-actions">
                        <button
                          className="modeBtn template-apply-btn"
                          onClick={async () => {
                            await applyTemplateToInvoice(tpl);
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                                e.target.value
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
                                e.target.value
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
                                e.target.value
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
                <button className="cancel-btn" onClick={handleCancelForm}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={handleSubmit}>
                  Submit
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
