
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import generatePayslipPDF from "../../utils/generatePayslipPDF";
import generatePayslipPDFDefault from "./generatePayslipPDFDefault";


import "./generate_payslip.css";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function GeneratePayslip() {
  const { user } = useAuth();

  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.org_id ??
    user?.Org_id ??
    user?.raw?.Org_id ??
    null;

  const meId = user?.employeeId ?? user?.id ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ;

  const getHeaders = (extra = {}) => {
    const base = {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
      ...extra,
    };

    if (orgId) base["x-org-id"] = String(orgId);
    if (meId) base["x-employee-id"] = String(meId);

    return base;
  };

  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [employeeData, setEmployeeData] = useState([]);
  const [filteredEmployeeData, setFilteredEmployeeData] = useState([]);
  const [formEmployeeList, setFormEmployeeList] = useState([]);

  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDetailsModal, setViewDetailsModal] = useState({
    isVisible: false,
    employee: null,
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [manualEmployeeId, setManualEmployeeId] = useState(false);

  const initialFormData = {
    employeeId: "PW-000001",
    employeeName: "",
    gender: "",
    designation: "",
    dateOfJoining: "",
    accountNo: "",
    workingDays: "",
    leavesTaken: "",
    uinNo: "",
    panNumber: "",
    esiNumber: "",
    pfNumber: "",
    basic: "",
    hra: "",
    otherAllowance: "",
    pf: "",
   esi: "",           // ← New
  insurance: "",     // ← New (replaces esiInsurance)
    professionalTax: "",
    tds: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });

  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const handleViewDetails = (employee) => {
    setViewDetailsModal({ isVisible: true, employee });
  };

  const closeViewDetails = () =>
    setViewDetailsModal({ isVisible: false, employee: null });

  // Helper function to safely extract YYYY-MM-DD date string (fixed timezone issue)
 // Helper function to safely extract YYYY-MM-DD (fixes timezone shift)
const extractDateOnly = (dateString) => {
  if (!dateString) return "";

  // Case 1: Already YYYY-MM-DD string
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Case 2: ISO string (with T or Z)
  if (typeof dateString === "string") {
    // Split at T or space and take only date part
    const datePart = dateString.split(/[T\s]/)[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }

  // Case 3: If it's a Date object or something else
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (e) {}

  return "";
};



// Helper function to safely extract YYYY-MM-DD date string (fixed timezone issue)


  const [templateHtml, setTemplateHtml] = useState(null);
  const [templateCss, setTemplateCss] = useState(null);
  const [headerImgSrc, setHeaderImgSrc] = useState(null);
  const [footerImgSrc, setFooterImgSrc] = useState(null);
  const [watermarkImgSrc, setWatermarkImgSrc] = useState(null);
  const [watermarkProps, setWatermarkProps] = useState({
    xPct: "50%",
    yPct: "50%",
    wPct: "60%",
    hPct: "60%",
    opacity: 0.12,
  });

  const protectedImgCache = new Map();

 const normalizeUploadUrl = (src) => {
  if (!src) return src;

  // already valid
  if (src.startsWith("blob:") || src.startsWith("data:") || src.startsWith("http")) {
    return src;
  }

  const backend = BACKEND_URL.replace(/\/$/, "");

  // if already api path
  if (src.startsWith("/api/")) {
  return BACKEND_URL.replace(/\/api$/, "") + src;
}


// if only filename stored in DB
  if (!src.includes("/")) {
    return `${backend}/api/orgs/${orgId}/uploads/${src}`;
  }

  return src;
};
  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const fetchProtectedImageDataUrl = async (src) => {
    if (!src) return null;
    if (src.startsWith("data:")) return src;

    const normalized = normalizeUploadUrl(src);
    if (protectedImgCache.has(normalized)) return protectedImgCache.get(normalized);

    try {
      const res = await axios.get(normalized, {
        responseType: "blob",
        headers: getHeaders(),
        withCredentials: true,
      });
      const dataUrl = await blobToDataUrl(res.data);
      protectedImgCache.set(normalized, dataUrl);
      return dataUrl;
    } catch (err) {
      console.warn("Image fetch failed:", err);
      return null;
    }
  };

  const replaceUploadUrlsInHtml = async (html = "") => {
    if (!html || typeof html !== "string") return html;
    const uploadRegex = /\/api\/orgs\/\d+\/uploads\/[A-Za-z0-9._-]+/g;
    const matches = html.match(uploadRegex);
    if (!matches || matches.length === 0) return html;

    const unique = Array.from(new Set(matches));
    const replacements = {};

    await Promise.all(
      unique.map(async (m) => {
        const dataUrl = await fetchProtectedImageDataUrl(m);
        replacements[m] = dataUrl || m;
      })
    );

    let out = html;
    Object.keys(replacements).forEach((orig) => {
      const safe = orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(safe, "g"), replacements[orig]);
    });
    return out;
  };
// Custom Template → Has Watermark (unchanged)
const handleDownloadWithCustomTemplate = async () => {
  const validationError = validateForm();
  if (validationError) return showAlert(validationError, "Validation Error");

  setIsLoading(true);
  try {
    const tableData = prepareManualPayslipData();
    const pdfBlob = await generatePdfWithTemplate(tableData);

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.employeeId}_Custom.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert("Downloaded with Custom Template (with Watermark)", "Success");
  } catch (e) {
    showAlert("Failed to generate Custom PDF", "Error");
  } finally {
    setIsLoading(false);
  }
};

// Default Template → With Watermark (same as Custom)
const handleDownloadWithDefaultTemplate = async () => {
  const validationError = validateForm();
  if (validationError) return showAlert(validationError, "Validation Error");

  setIsLoading(true);
  try {
    const tableData = prepareManualPayslipData();
    const pdfBlob = await generatePayslipPDFDefault(tableData, selectedMonth, selectedYear, watermarkImgSrc, watermarkProps);

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.employeeId}_Default.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert("Downloaded with Default Template (with Watermark)", "Success");
  } catch (e) {
    showAlert("Failed to generate Default PDF", "Error");
  } finally {
    setIsLoading(false);
  }
};
  const ensurePercent = (v, defaultVal = "50%") => {
    if (!v) return defaultVal;
    if (typeof v === "number") return `${v}%`;
    const str = String(v).trim();
    return str.endsWith("%") ? str : `${str}%`;
  };

  useEffect(() => {
    const fetchSelectedTemplate = async () => {
      if (!orgId) return;

      try {
        const prefsRes = await axios.get(`${BACKEND_URL}/api/salary-preferences`, {
          headers: getHeaders(),
          withCredentials: true,
        });

        const selectedId = prefsRes.data?.data?.[0]?.selected_template_id;
        if (!selectedId) return;

        const templatesRes = await axios.get(`${BACKEND_URL}/api/orgs/${orgId}/templates`, {
          headers: getHeaders(),
          withCredentials: true,
        });

        const templates = templatesRes.data || [];
        const selectedTemplate = templates.find((t) => t.id === selectedId);
        if (!selectedTemplate) return;

        let processedHtml = await replaceUploadUrlsInHtml(selectedTemplate.html || "");
        setTemplateHtml(processedHtml);
        setTemplateCss(selectedTemplate.css || "");

        let grapes = null;
        const grapesField = selectedTemplate.grapes_json || selectedTemplate.grapesJson;
        if (grapesField) {
          try {
            grapes = typeof grapesField === "string" ? JSON.parse(grapesField) : grapesField;
          } catch (e) {
            console.error("Failed to parse grapes_json", e);
          }
        }

        let headerSrc = null;
        let footerSrc = null;
        let wmUrl = null;
        let wp = { ...watermarkProps };

        if (grapes) {
          headerSrc = grapes.headerUrl || grapes.header_url;
          footerSrc = grapes.footerUrl || grapes.footer_url;
          if (grapes.watermark?.url) {
            wmUrl = grapes.watermark.url;
            wp = {
              xPct: ensurePercent(grapes.watermark.xPct || "50%"),
              yPct: ensurePercent(grapes.watermark.yPct || "50%"),
              wPct: ensurePercent(grapes.watermark.wPct || "60%"),
              hPct: ensurePercent(grapes.watermark.hPct || "60%"),
              opacity: grapes.watermark.opacity ?? 0.12,
            };
          }
        }

        let metaObj = null;
        if (selectedTemplate.meta) {
          try {
            metaObj = typeof selectedTemplate.meta === "string" ? JSON.parse(selectedTemplate.meta) : selectedTemplate.meta;
          } catch {}
        }
        if (metaObj?.uploads) {
          headerSrc = metaObj.uploads.header || headerSrc;
          footerSrc = metaObj.uploads.footer || footerSrc;
          wmUrl = metaObj.uploads.watermark || wmUrl;
        }

        if (!headerSrc && selectedTemplate.thumbnail_url) {
          headerSrc = `/api/orgs/${orgId}/uploads/${selectedTemplate.thumbnail_url}`;
        }

        if (headerSrc) {
          const dataUrl = await fetchProtectedImageDataUrl(headerSrc);
          if (dataUrl) setHeaderImgSrc(dataUrl);
        }
        if (footerSrc) {
          const dataUrl = await fetchProtectedImageDataUrl(footerSrc);
          if (dataUrl) setFooterImgSrc(dataUrl);
        }
        if (wmUrl) {
          const dataUrl = await fetchProtectedImageDataUrl(wmUrl);
          if (dataUrl) {
            setWatermarkImgSrc(dataUrl);
            setWatermarkProps(wp);
          }
        }
      } catch (err) {
        console.error("TEMPLATE FETCH ERROR:", err);
      }
    };

    fetchSelectedTemplate();
  }, [orgId, BACKEND_URL]);

  // ────────────────────────────────────────────────
  // Number to words (Indian style)
  // ────────────────────────────────────────────────

  const convertNumberToWords = (num) => {
    if (!num || num === 0) return "Zero Rupees Only";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const scales = ["", "Thousand", "Lakh", "Crore"];

    let words = "";
    let n = Math.floor(num);
    let i = 0;

    do {
      let part = n % 1000;
      if (part !== 0) {
        let partWords = "";
        if (part >= 100) {
          partWords += ones[Math.floor(part / 100)] + " Hundred ";
          part %= 100;
        }
        if (part >= 20) {
          partWords += tens[Math.floor(part / 10)] + (part % 10 ? " " + ones[part % 10] : "");
        } else if (part > 0) {
          partWords += ones[part];
        }
        if (i > 0) partWords += " " + scales[i];
        words = partWords + (words ? " " + words : "");
      }
      n = Math.floor(n / 1000);
      i++;
    } while (n > 0);

    return words.trim() + " Rupees Only";
  };

  // ────────────────────────────────────────────────
  // Build HTML content for PDF
  // ────────────────────────────────────────────────

  const buildDataTableHtml = (data) => {
    const {
      employeeName = "N/A",
      employeeId = "N/A",
      designation = "N/A",
      dateOfJoining = "N/A",
      accountNo = "N/A",
      bankName = "N/A",
      workingDays = 30,
      leavesTaken = 0,
      uinNo = "N/A",
      panNumber = "N/A",
      esiNumber = "N/A",
      pfNumber = "N/A",
      gender = "N/A",
      basic = 0,
      hra = 0,
      otherAllowance = 0,
      bonus = 0,
      pf = 0,
      esi = 0,           // ← New
  insurance = 0,     // ← New
      professionalTax = 0,
      tds = 0,
      grossEarnings = 0,
      totalDeductions = 0,
      netSalary = 0,
      monthYear = "",
      netSalaryWords = "Zero Rupees Only",
    } = data;

    const employeeDetailsHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; margin-bottom: 0px;">
        <div style="padding: 8px 0; text-align: center; font-weight: bold; font-size: 25px; color: #1a3c6d; margin-bottom: 40px;;">
          PAYSLIP FOR - ${monthYear.toUpperCase()}
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 20px;">
          <div style="flex: 1; min-width: 48%; box-sizing: border-box;">
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Employee Name:</strong>
              ${employeeName.toUpperCase()}
            </div>
            ${gender && gender !== "N/A" ? `
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Gender:</strong>
              ${gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()}
            </div>` : ''}
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Employee ID:</strong>
              ${employeeId}
            </div>
            ${designation && designation !== "N/A" ? `
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Designation:</strong>
              ${designation.toUpperCase()}
            </div>` : ''}
            ${pfNumber && pfNumber !== "N/A" ? `
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">PF No:</strong>
              ${pfNumber}
            </div>` : ''}
            ${esiNumber && esiNumber !== "N/A" ? `
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">ESI No:</strong>
              ${esiNumber}
            </div>` : ''}
          </div>

          <div style="flex: 1; min-width: 48%; box-sizing: border-box;">
            ${panNumber && panNumber !== "N/A" ? `
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">PAN:</strong>
              ${panNumber}
            </div>` : ''}
            ${uinNo && uinNo !== "N/A" ? `
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">UAN:</strong>
              ${uinNo}
            </div>` : ''}
            ${bankName && bankName !== "N/A" ? `
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Bank Name:</strong>
              ${bankName}
            </div>` : ''}
            ${accountNo && accountNo !== "N/A" ? `
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Account No:</strong>
              ${accountNo}
            </div>` : ''}
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Working Days:</strong>
              ${workingDays}
            </div>
            ${leavesTaken > 0 ? `
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Leaves taken </strong>
              ${leavesTaken}
            </div>` : ''}
            ${dateOfJoining && dateOfJoining !== "N/A" ? `
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Date of Joining:</strong>
              ${dateOfJoining}
            </div>` : ''}
          </div>
        </div>
      </div>
    `;

    const earnings = [];
    if (basic > 0) earnings.push({ name: "Basic Salary", amount: basic });
    if (hra > 0) earnings.push({ name: "HRA", amount: hra });
    if (otherAllowance > 0) earnings.push({ name: "Other Allowances", amount: otherAllowance });
    if (bonus > 0) earnings.push({ name: "Bonus", amount: bonus });

    const deductions = [];
    if (pf > 0) deductions.push({ name: "PF", amount: pf });
    if (data.esi > 0) deductions.push({ name: "ESI", amount: data.esi });
if (data.insurance > 0) deductions.push({ name: "Insurance", amount: data.insurance });
    if (professionalTax > 0) deductions.push({ name: "Professional Tax", amount: professionalTax });
    if (tds > 0) deductions.push({ name: "TDS", amount: tds });

    const maxRows = Math.max(earnings.length, deductions.length);

    let detailRows = "";
    for (let i = 0; i < maxRows; i++) {
      const earn = earnings[i] || { name: "", amount: 0 };
      const ded = deductions[i] || { name: "", amount: 0 };

      const earnName = earn.name || " ";
      const earnAmt = earn.amount > 0 ? earn.amount.toFixed(2) : "";
      const dedName = ded.name || " ";
      const dedAmt = ded.amount > 0 ? ded.amount.toFixed(2) : "";

      detailRows += `
        <tr>
          <td style="border: 1px solid #000; padding: 8px;">${earnName}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right;">${earnAmt}</td>
          <td style="border: 1px solid #000; padding: 8px;">${dedName}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right;">${dedAmt}</td>
        </tr>`;
    }

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Earnings</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: right;">Amount (₹)</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Deductions</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: right;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${detailRows}
          <tr style="background-color: #f0f0f0;">
            <td style="border: 1px solid #000; padding: 8px;"><strong>Gross Salary</strong></td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${grossEarnings.toFixed(2)}</strong></td>
            <td style="border: 1px solid #000; padding: 8px;"><strong>Total Deductions</strong></td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${totalDeductions.toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td colspan="4" style="height: 30px; border: none;"></td>
          </tr>
          <tr style="background-color: #e0e0e0; font-size: 15px;">
            <td colspan="2" style="border: 1px solid #000; padding: 15px 12px; text-align: left; font-weight: bold; color: #1a3c6d;">
              Net Salary Payable
            </td>
            <td colspan="2" style="border: 1px solid #000; padding: 15px 12px; text-align: right; font-weight: bold; color: #1a3c6d;">
              ₹${netSalary.toFixed(2)}
            </td>
          </tr>
          <tr style="background-color: #e0e0e0; font-size: 14px;">
            <td colspan="2" style="border: 1px solid #000; padding: 12px; text-align: left;">
              In Words:
            </td>
            <td colspan="2" style="border: 1px solid #000; padding: 12px; text-align: right;">
              ${netSalaryWords}
            </td>
          </tr>
        </tbody>
      </table>
    `;

    return employeeDetailsHtml + tableHtml;
  };

const buildProcessedTemplate = (tableHtml) => {
  let baseHtml = templateHtml || `<div class="template-page"><div class="template-body"></div></div>`;
  if (templateCss) baseHtml = `<style>${templateCss}</style>${baseHtml}`;

  const parser = new DOMParser();
  const doc = parser.parseFromString(baseHtml, "text/html");

  let pageContainer = doc.querySelector(".template-page") || doc.body;

  // Make sure container can hold watermark properly
  pageContainer.style.position = "relative";
  pageContainer.style.minHeight = "297mm";
  pageContainer.style.width = "210mm";
  pageContainer.style.margin = "0 auto";
  pageContainer.style.boxSizing = "border-box";
  pageContainer.style.overflow = "hidden";

  let bodyDiv = doc.querySelector(".template-body") || pageContainer;
  bodyDiv.innerHTML = tableHtml;
  bodyDiv.style.padding = "20px 40px";

  // Header
  if (headerImgSrc) {
    const headerDiv = doc.createElement("div");
    headerDiv.className = "template-header";
    headerDiv.style.textAlign = "center";
    headerDiv.style.marginBottom = "20px";
    const img = doc.createElement("img");
    img.src = headerImgSrc;
    img.style.maxWidth = "100%";
    headerDiv.appendChild(img);
    pageContainer.insertBefore(headerDiv, bodyDiv);
  }

  // Footer
  if (footerImgSrc) {
    const footerDiv = doc.createElement("div");
    footerDiv.className = "template-footer";
    footerDiv.style.textAlign = "center";
    footerDiv.style.marginTop = "20px";
    const img = doc.createElement("img");
    img.src = footerImgSrc;
    img.style.maxWidth = "100%";
    footerDiv.appendChild(img);
    pageContainer.appendChild(footerDiv);
  }

  // ==================== WATERMARK - FIXED VERSION ====================
  if (watermarkImgSrc) {
    doc.querySelectorAll(".pdf-watermark").forEach(el => el.remove());

    const wmWrapper = doc.createElement("div");
    wmWrapper.className = "pdf-watermark";
    wmWrapper.style.position = "absolute";
    wmWrapper.style.top = "50%";
    wmWrapper.style.left = "50%";
    wmWrapper.style.width = "70%";
    wmWrapper.style.height = "70%";
    wmWrapper.style.transform = "translate(-50%, -50%)";
    wmWrapper.style.opacity = "3.65";           // Adjust opacity here
    wmWrapper.style.zIndex = "0";
    wmWrapper.style.pointerEvents = "none";
    wmWrapper.style.overflow = "hidden";

    const img = doc.createElement("img");
    img.src = watermarkImgSrc;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    wmWrapper.appendChild(img);

    // Insert as FIRST child so it stays behind everything
    pageContainer.insertBefore(wmWrapper, pageContainer.firstChild);
  }

  return doc.documentElement.outerHTML;
};

  // ────────────────────────────────────────────────
  // Data preparation
  // ────────────────────────────────────────────────

  const prepareManualPayslipData = () => {
    const { grossEarnings, totalDeductions, netSalary } = calculateSummary();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthYear = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

    const netSalaryWords = convertNumberToWords(Math.round(netSalary));

    return {
      employeeName: formData.employeeName || "N/A",
      employeeId: formData.employeeId || "N/A",
      designation: formData.designation || "N/A",
      dateOfJoining: formData.dateOfJoining || "N/A",
      accountNo: formData.accountNo || "N/A",
      bankName: "",
      workingDays: parseFloat(formData.workingDays) || 30,
      leavesTaken: parseFloat(formData.leavesTaken) || 0,
      uinNo: formData.uinNo || "N/A",
      panNumber: formData.panNumber || "N/A",
      esiNumber: formData.esiNumber || "N/A",
      pfNumber: formData.pfNumber || "N/A",
      gender: formData.gender || "N/A",
      basic: parseFloat(formData.basic) || 0,
      hra: parseFloat(formData.hra) || 0,
      otherAllowance: parseFloat(formData.otherAllowance) || 0,
      bonus: 0,
      pf: parseFloat(formData.pf) || 0,
      esi: parseFloat(formData.esi) || 0,           // ← New
    insurance: parseFloat(formData.insurance) || 0, // ← New
      professionalTax: parseFloat(formData.professionalTax) || 0,
      tds: parseFloat(formData.tds) || 0,
      grossEarnings,
      totalDeductions,
      netSalary,
      monthYear,
      netSalaryWords,
    };
  };

  const prepareSavedPayslipData = (employee) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthYear = `${monthNames[(employee.month || new Date().getMonth() + 1) - 1]} ${employee.year || new Date().getFullYear()}`;

    const netSalary = parseFloat(employee.net_salary || 0);
    const netSalaryWords = convertNumberToWords(Math.round(netSalary));

    return {
      employeeName: employee.employee_name || "N/A",
      employeeId: employee.employee_id || "N/A",
      designation: (employee.designation || employee.position || "") + (employee.department_name ? ` (${employee.department_name})` : ""),
      dateOfJoining: extractDateOnly(employee.date_of_joining) || "N/A",
      accountNo: employee.account_no || "N/A",
      bankName: "",
      workingDays: parseFloat(employee.working_days || 30),
      leavesTaken: parseFloat(employee.leaves_taken || 0),
      uinNo: employee.uin_no || "N/A",
      panNumber: employee.pan_number || "N/A",
      esiNumber: employee.esi_number || "N/A",
      pfNumber: employee.pf_number || "N/A",
      gender: employee.gender || "N/A",
      basic: parseFloat(employee.basic || 0),
      hra: parseFloat(employee.hra || 0),
      otherAllowance: parseFloat(employee.other_allowance || 0),
      bonus: 0,
      pf: parseFloat(employee.pf || 0),
    esi: parseFloat(employee.esi || 0),                    // ← New (adjust backend field name if needed)
    insurance: parseFloat(employee.insurance || 0),        // ← New
      professionalTax: parseFloat(employee.professional_tax || 0),
      tds: parseFloat(employee.tds || 0),
      grossEarnings: parseFloat(employee.gross_earnings || 0),
      totalDeductions: parseFloat(employee.total_deductions || 0),
      netSalary,
      monthYear,
      netSalaryWords,
    };
  };

const waitForImagesToLoad = async (container, timeout = 10000) => {
    const imgs = Array.from(container.querySelectorAll("img"));
    if (imgs.length === 0) return Promise.resolve();

    return new Promise((resolve) => {
      let settled = 0;
      const onSettled = () => {
        settled += 1;
        if (settled === imgs.length) resolve();
      };

      imgs.forEach((img) => {
        if (img.complete && img.naturalHeight > 0) {
          onSettled();
        } else {
          const t = setTimeout(onSettled, timeout);
          const wrapped = () => {
            clearTimeout(t);
            onSettled();
          };
          img.addEventListener("load", wrapped, { once: true });
          img.addEventListener("error", wrapped, { once: true });
        }
      });
    });
  };

const generatePdfWithTemplate = async (tableData) => {
  const tableHtml = buildDataTableHtml(tableData);
  const finalHtml = buildProcessedTemplate(tableHtml);

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "210mm";
  container.style.minHeight = "297mm";
  container.style.backgroundColor = "#ffffff";
  document.body.appendChild(container);

  container.innerHTML = finalHtml;

  // Wait for all images (including watermark)
  await waitForImagesToLoad(container, 15000);

  const html2canvas = (await import("html2canvas")).default;

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: container.offsetWidth,
    height: container.offsetHeight,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png", 1.0);

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  document.body.removeChild(container);
  return pdf.output("blob");
};

  // ────────────────────────────────────────────────
  // Data fetching
  // ────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const fetchEmployeeData = async () => {
      if (!orgId || !BACKEND_URL) return;

      try {
        const resp = await fetch(`${BACKEND_URL}/old-employee/list`, {
          credentials: "include",
          headers: getHeaders(),
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data = await resp.json();
        if (!mounted) return;

        const list = Array.isArray(data) ? data : [];
        setEmployeeData(list);
        setFilteredEmployeeData(list);
      } catch (err) {
        console.error("Fetch payslip list error:", err);
        showAlert("Failed to load payslip data", "Error");
      }
    };

    fetchEmployeeData();

    return () => { mounted = false; };
  }, [BACKEND_URL, orgId]);

  useEffect(() => {
    let mounted = true;

    const fetchFormEmployees = async () => {
      if (!orgId || !BACKEND_URL) return;

      try {
        const resp = await fetch(`${BACKEND_URL}/payslip/employees`, {
          credentials: "include",
          headers: getHeaders(),
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data = await resp.json();
        if (!mounted) return;

        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data.data)) list = data.data;
        else if (Array.isArray(data.message?.data)) list = data.message.data;

        const normalized = list.map((item) => ({
          employee_id: item.employee_id || item.employeeId || "",
          employee_name: item.employee_name || item.employeeName || item.name || "",
          gender: item.gender || "",
          designation: item.position || item.designation || "",
          department_name: item.department_name || item.departmentName || item.department || "",
          date_of_joining: item.joining_date || item.date_of_joining || item.joiningDate || null,
          account_no: item.account_number || item.account_no || item.accountNo || "",
          uin_no: item.uan_number || item.uan || item.uanNumber || "",
          pan_number: item.pan_number || item.panNumber || "",
          esi_number: item.esi_number || item.esiNumber || "",
          pf_number: item.pf_number || item.pfNumber || "",
          id: item.id || item.employee_id || null,
        }));

        setFormEmployeeList(normalized);
      } catch (err) {
        console.error("Employee dropdown fetch error:", err);
        showAlert("Failed to load employee list for form", "Warning");
      }
    };

    fetchFormEmployees();

    return () => { mounted = false; };
  }, [BACKEND_URL, orgId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = (searchQuery || "").trim().toLowerCase();
      if (!q) {
        setFilteredEmployeeData(employeeData);
        return;
      }
      setFilteredEmployeeData(
        employeeData.filter(
          (emp) =>
            (emp.employee_name || "").toLowerCase().includes(q) ||
            (emp.employee_id || "").toLowerCase().includes(q)
        )
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, employeeData]);

  // ────────────────────────────────────────────────
  // Form handlers
  // ────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "employeeId") {
      if (manualEmployeeId) {
        setFormData((p) => ({ ...p, employeeId: value }));
        return;
      }

      const selected = formEmployeeList.find(
        (emp) => (emp.employee_id || emp.employeeId || "") === value
      );

      if (selected) {
        setFormData((p) => ({
          ...p,
          employeeId: value,
          employeeName: selected.employee_name || "",
          gender: selected.gender || "",
          designation:
            (selected.position || selected.designation || "") +
            (selected.department_name ? ` (${selected.department_name})` : ""),
          dateOfJoining: extractDateOnly(selected.date_of_joining) || "",
          accountNo: selected.account_no || "",
          uinNo: selected.uin_no || "",
          panNumber: selected.pan_number || "",
          esiNumber: selected.esi_number || "",
          pfNumber: selected.pf_number || "",
        }));
      } else {
        setFormData((p) => ({ ...p, employeeId: value }));
      }
    } else if (name === "selectedMonth") {
      setSelectedMonth(value);
    } else if (name === "selectedYear") {
      setSelectedYear(value);
    } else if (name === "panNumber") {
      setFormData((p) => ({ ...p, [name]: (value || "").toUpperCase() }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const calculateSummary = () => {
    const earnings = [
      parseFloat(formData.basic) || 0,
      parseFloat(formData.hra) || 0,
      parseFloat(formData.otherAllowance) || 0,
    ];
    const deductions = [
      parseFloat(formData.pf) || 0,
      parseFloat(formData.esi) || 0,         // ← Changed
    parseFloat(formData.insurance) || 0,   // ← New
      parseFloat(formData.professionalTax) || 0,
      parseFloat(formData.tds) || 0,
    ];
    const grossEarnings = earnings.reduce((s, v) => s + v, 0);
    const totalDeductions = deductions.reduce((s, v) => s + v, 0);
    const netSalary = grossEarnings - totalDeductions;
    return { grossEarnings, totalDeductions, netSalary };
  };

const fieldLabels = {
    employeeName: "Employee Name",
    employeeId: "Employee ID",
    gender: "Gender",
    designation: "Designation",
    dateOfJoining: "Date of Joining",
    accountNo: "Account Number",
    workingDays: "Working Days",
    leavesTaken: "Leaves Taken",
    uinNo: "UAN No",
    panNumber: "PAN Number",
    esiNumber: "ESI Number",
    pfNumber: "PF Number",
    basic: "Basic",
    hra: "HRA",
    otherAllowance: "Other Allowance",
    pf: "PF",
    esi: "ESI",                    // ← New
  insurance: "Insurance",        // ← New
    professionalTax: "Professional Tax",
    tds: "TDS",
    selectedMonth: "Month",
    selectedYear: "Year",
  };

  const validateForm = () => {
    const requiredFields = [
      "employeeName", "employeeId", "gender", "designation",
      "dateOfJoining", "accountNo", "workingDays", "leavesTaken",
      "uinNo", "panNumber", "basic", "hra", "otherAllowance", "tds",
    ];

    for (const field of requiredFields) {
      const val = (formData[field] || "").toString().trim();
      if (!val) return `Please fill ${fieldLabels[field] || field}`;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (formData.dateOfJoining && !datePattern.test(formData.dateOfJoining))
      return "Date of Joining must be YYYY-MM-DD";

    const date = new Date(formData.dateOfJoining);
    if (formData.dateOfJoining && (isNaN(date.getTime()) || date > new Date()))
      return "Invalid Date of Joining";

    const numericFields = ["workingDays", "leavesTaken", "basic", "hra", "otherAllowance", "pf", "esi", "insurance", "professionalTax", "tds"];
    for (const field of numericFields) {
      if (formData[field] && (isNaN(parseFloat(formData[field])) || parseFloat(formData[field]) < 0))
        return `${fieldLabels[field] || field} must be non-negative number`;
    }

    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (formData.panNumber && !panPattern.test(formData.panNumber))
      return "Invalid PAN format (ABCDE1234F)";

    if (!["Male", "Female"].includes(formData.gender))
      return "Gender must be Male or Female";

    if (!selectedMonth || selectedMonth < 1 || selectedMonth > 12)
      return "Invalid month";

    if (!selectedYear || selectedYear < 1900 || selectedYear > new Date().getFullYear() + 1)
      return "Invalid year";

    return null;
  };

  const prepareBackendData = () => {
  const { grossEarnings, totalDeductions, netSalary } = calculateSummary();

  return {
    employee_name: formData.employeeName || "",
    employee_id: formData.employeeId || "",
    gender: formData.gender || "",
    designation: formData.designation || "",
    date_of_joining: formData.dateOfJoining || "",

    account_no: formData.accountNo || "",
    working_days: parseInt(formData.workingDays) || 0,
    leaves_taken: parseInt(formData.leavesTaken) || 0,

    uin_no: formData.uinNo || "",
    pan_number: formData.panNumber || "",
    esi_number: formData.esiNumber || "",
    pf_number: formData.pfNumber || "",

    basic: parseFloat(formData.basic) || 0,
    hra: parseFloat(formData.hra) || 0,
    other_allowance: parseFloat(formData.otherAllowance) || 0,

    pf: parseFloat(formData.pf) || 0,
    esi: parseFloat(formData.esi) || 0,               // ← New
    insurance: parseFloat(formData.insurance) || 0,   // ← New

    professional_tax: parseFloat(formData.professionalTax) || 0,
    tds: parseFloat(formData.tds) || 0,

    gross_earnings: grossEarnings || 0,
    total_deductions: totalDeductions || 0,
    net_salary: netSalary || 0,

    month: parseInt(selectedMonth) || 0,
    year: parseInt(selectedYear) || 0,
  };
};

  const handleEdit = (employee) => {
    setFormData({
      employeeId: employee.employee_id || "PW-000001",
      employeeName: employee.employee_name || "",
      gender: employee.gender || "",
      designation:
        (employee.designation || employee.position || "") +
        (employee.department_name ? ` (${employee.department_name})` : ""),
      dateOfJoining: extractDateOnly(employee.date_of_joining) || "",
      accountNo: employee.account_no || "",
      workingDays: employee.working_days
        ? employee.working_days.toString()
        : "",
      leavesTaken: employee.leaves_taken
        ? employee.leaves_taken.toString()
        : "",
      uinNo: employee.uin_no || "",
      panNumber: employee.pan_number || "",
      esiNumber: employee.esi_number || "",
      pfNumber: employee.pf_number || "",
      basic: employee.basic ? employee.basic.toString() : "",
      hra: employee.hra ? employee.hra.toString() : "",
      otherAllowance: employee.other_allowance
        ? employee.other_allowance.toString()
        : "",
      pf: employee.pf ? employee.pf.toString() : "",
      esi: employee.esi ? employee.esi.toString() : "",           // ← New
    insurance: employee.insurance ? employee.insurance.toString() : "", // ← New
      professionalTax: employee.professional_tax
        ? employee.professional_tax.toString()
        : "",
      tds: employee.tds ? employee.tds.toString() : "",
    });
    setSelectedMonth(employee.month || new Date().getMonth() + 1);
    setSelectedYear(employee.year || new Date().getFullYear());
    setEditingEmployeeId(employee.id);
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleSaveToBackend = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showAlert(validationError, "Validation Error");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const backendData = prepareBackendData();
    const isEditing = !!editingEmployeeId;
    const url = isEditing
      ? `${BACKEND_URL}/old-employee/edit`
      : `${BACKEND_URL}/old-employee/save`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const resp = await fetch(url, {
        method,
        credentials: "include",
        headers: getHeaders(),
        body: JSON.stringify(backendData),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || `HTTP ${resp.status}`);
      }

      showAlert(
        isEditing ? "Payslip updated!" : "Payslip saved!",
        "Success"
      );

      // Refresh list
      const refreshed = await fetch(`${BACKEND_URL}/old-employee/list`, {
        credentials: "include",
        headers: getHeaders(),
      });
      if (refreshed.ok) {
        const data = await refreshed.json();
        const list = Array.isArray(data) ? data : [];
        setEmployeeData(list);
        setFilteredEmployeeData(list);
      }

      setShowModal(false);
      setFormData(initialFormData);
      setSelectedMonth(new Date().getMonth() + 1);
      setSelectedYear(new Date().getFullYear());
      setEditingEmployeeId(null);
    } catch (err) {
      console.error("Save error:", err);
      showAlert(`Error: ${err.message}`, "Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showAlert(validationError, "Validation Error");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tableData = prepareManualPayslipData();
      const pdfBlob = await generatePdfWithTemplate(tableData);

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setPreview(true);
    } catch (err) {
      console.error("Preview error:", err);
      showAlert("Failed to generate preview", "Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const validationError = validateForm();
    if (validationError) {
      showAlert(validationError, "Validation Error");
      return;
    }

    setIsLoading(true);

    try {
      const tableData = prepareManualPayslipData();
      const pdfBlob = await generatePdfWithTemplate(tableData);

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.employeeId}_${selectedMonth}_${selectedYear}_Payslip.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      showAlert("Payslip downloaded!", "Success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to download PDF", "Error");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleDownloadForEmployee = async (employee) => {
  //   setIsLoading(true);

  
const handleDownloadForEmployee = async (employee) => {
  setIsLoading(true);
  try {
    const tableData = prepareSavedPayslipData(employee);

    // ← CHANGED: Use Default Template instead of Custom
    const pdfBlob = await generatePayslipPDFDefault(
      tableData, 
      employee.month || selectedMonth, 
      employee.year || selectedYear
    );

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${employee.employee_id || employee.employeeId}_${employee.month || selectedMonth}_${employee.year || selectedYear}_Payslip.pdf`;
    a.click();
    URL.revokeObjectURL(url);

    showAlert(`Default Payslip downloaded for ${employee.employee_name}`, "Success");
  } catch (err) {
    console.error("Default download error:", err);
    showAlert("Failed to download Default Payslip", "Error");
  } finally {
    setIsLoading(false);
  }
};
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      protectedImgCache.clear();
    };
  }, [pdfUrl]);

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────

  const detailFields = [
    "accountNo", "workingDays", "leavesTaken", "uinNo", "panNumber",
    "esiNumber", "pfNumber", "basic", "hra", "otherAllowance",
    "pf", "esiInsurance", "professionalTax", "tds",
    "grossEarnings", "totalDeductions", "netSalary"
  ];

  const tableHeaders = [
    "Employee Name",
    "Employee ID",
    "Gender",
    "Designation",
    "Date of Joining",
    "Bank Details",
    "Edit Data",
    "Download"
  ];

const fieldOrder = [
    "employeeId", "employeeName", "gender", "designation",
    "dateOfJoining", "accountNo", "workingDays", "leavesTaken",
    "uinNo", "panNumber", "esiNumber", "pfNumber",
    "basic", "hra", "otherAllowance", "pf", "esi", "insurance",
    "professionalTax", "tds",
    "selectedMonth", "selectedYear"
  ];

  const rows = [];
  for (let i = 0; i < fieldOrder.length; i += 3) {
    rows.push(fieldOrder.slice(i, i + 3));
  }

  return (
    <div className="generatePayslip-container">
      <div className="generatePayslip-header">
        <div className="generatePayslip-search-container">
          <i className="fas fa-search generatePayslip-search-icon" />
          <input
            type="text"
            className="generatePayslip-search-input"
            placeholder="Search by name or employee ID"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <button
          className="generatePayslip-create-btn"
          onClick={() => {
            setShowModal(true);
            setPreview(false);
            setError(null);
            setSuccess(null);
            setEditingEmployeeId(null);
            setFormData(initialFormData);
            setSelectedMonth(new Date().getMonth() + 1);
            setSelectedYear(new Date().getFullYear());
          }}
        >
          Create Payslip
        </button>
      </div>

      <div className="generatePayslip-table-container">
        <table className="generatePayslip-table">
          <thead>
            <tr>
              {tableHeaders.map((h, i) => (
                <th key={i} className="generatePayslip-table-header">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredEmployeeData.length === 0 ? (
              <tr>
                <td colSpan={tableHeaders.length} style={{ textAlign: "center" }}>
                  No payslip data found
                </td>
              </tr>
            ) : (
              filteredEmployeeData.map((employee) => (
                <tr key={employee.id || employee.employee_id}>
                  <td className="generatePayslip-table-cell">
                    {employee.employee_name}
                  </td>
                  <td className="generatePayslip-table-cell">
                    {employee.employee_id}
                  </td>
                  <td className="generatePayslip-table-cell">
                    {employee.gender || "-"}
                  </td>
                  <td className="generatePayslip-table-cell">
                    {(employee.designation || employee.position || "") +
                      (employee.department_name ? ` (${employee.department_name})` : "")}
                  </td>
                  <td className="generatePayslip-table-cell">
                    {extractDateOnly(employee.date_of_joining) || "-"}
                  </td>
                  <td className="generatePayslip-table-cell generatePayslip-action-cell">
                    <button
                      type="button"
                      className="generatePayslip-view-btn action-btn"
                      onClick={() => handleViewDetails(employee)}
                      title="View Details"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                  <td className="generatePayslip-table-cell generatePayslip-action-cell">
                    <button
                      type="button"
                      className="generatePayslip-edit-btn action-btn"
                      onClick={() => handleEdit(employee)}
                      title="Edit Payslip"
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                  </td>
                  <td className="generatePayslip-table-cell generatePayslip-action-cell">
                    <button
                      type="button"
                      className="generatePayslip-download-btn action-btn"
                      onClick={() => handleDownloadForEmployee(employee)}
                      title="Download PDF"
                      disabled={isLoading}
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="generatePayslip-popup-overlay">
          <div className="generatePayslip-popup-box">
            <button
              className="generatePayslip-popup-close-btn"
              onClick={() => {
                setShowModal(false);
                setPreview(false);
                setFormData(initialFormData);
                setSelectedMonth(new Date().getMonth() + 1);
                setSelectedYear(new Date().getFullYear());
                setEditingEmployeeId(null);
                setError(null);
                setSuccess(null);
                if (pdfUrl) {
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                }
              }}
            >
              ×
            </button>

            <h3 className="generatePayslip-popup-title">
              {preview
                ? "Payslip Preview"
                : editingEmployeeId
                ? "Edit Payslip Details"
                : "Enter Payslip Details"}
            </h3>

            {error && <p className="generatePayslip-error">{error}</p>}
            {success && <p className="generatePayslip-success">{success}</p>}

            {preview ? (
              <div className="generatePayslip-preview">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    width="100%"
                    height="500px"
                    title="Payslip Preview"
                    style={{ border: "none" }}
                  />
                ) : (
                  <p>Loading preview...</p>
                )}
              </div>
            ) : (
              <div className="generatePayslip-popup-form">
                {rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="generatePayslip-form-row">
                    {row.map((field) => (
                      <div key={field} className="generatePayslip-form-group">
                        <label
                          htmlFor={field}
                          className="generatePayslip-form-label"
                        >
                          {fieldLabels[field] || field}
                        {[
                          "employeeName", "employeeId", "gender", "designation",
                          "dateOfJoining", "accountNo", "workingDays", "leavesTaken",
                          "uinNo", "panNumber", "basic", "hra", "otherAllowance", "tds"
                        ].includes(field) && (
                          <span className="generatePayslip-required"> *</span>
                        )}
                        </label>

                        {field === "employeeId" ? (
                          <>
                            {!manualEmployeeId ? (
                              <select
                                id="employeeId"
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleChange}
                                className="generatePayslip-popup-input"
                              >
                                <option value="">Select Employee ID</option>
                                {formEmployeeList.map((emp) => (
                                  <option
                                    key={emp.employee_id || emp.id}
                                    value={emp.employee_id || emp.employeeId}
                                  >
                                    {`${emp.employee_id || emp.employeeId} - ${emp.employee_name || ""}`}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleChange}
                                className="generatePayslip-popup-input"
                                placeholder="Enter Employee ID manually"
                              />
                            )}

                            <small
                              style={{
                                cursor: "pointer",
                                color: "#007bff",
                                marginTop: "4px",
                                display: "inline-block",
                              }}
                              onClick={() => {
                                setManualEmployeeId((p) => !p);
                                setFormData((p) => ({
                                  ...p,
                                  employeeId: "",
                                  employeeName: "",
                                }));
                              }}
                            >
                              {manualEmployeeId
                                ? "Select from list"
                                : "Enter manually"}
                            </small>
                          </>
                        ) : field === "selectedMonth" ? (
                          <select
                            id="selectedMonth"
                            name="selectedMonth"
                            value={selectedMonth}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                          >
                            <option value="">Select Month</option>
                            {[...Array(12)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString("default", { month: "long" })}
                              </option>
                            ))}
                          </select>
                        ) : field === "selectedYear" ? (
                          <input
                            type="number"
                            id="selectedYear"
                            name="selectedYear"
                            value={selectedYear}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                            placeholder="Year"
                          />
                        ) : field === "gender" ? (
                          <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        ) : field === "panNumber" ? (
                          <input
                            id="panNumber"
                            name="panNumber"
                            value={formData.panNumber}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                            placeholder="ABCDE1234F"
                            maxLength={10}
                          />
                        ) : (
                          <input
                            id={field}
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                           type={
  ["workingDays", "leavesTaken", "basic", "hra", "otherAllowance",
   "pf", "esi", "insurance", "professionalTax", "tds"].includes(field)  // ← Updated
    ? "number"
    : field === "dateOfJoining" ? "date" : "text"
}
                            placeholder={field === "dateOfJoining" ? "YYYY-MM-DD" : undefined}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

       <div className="generatePayslip-form-buttons">
  <button
    onClick={() => {
      if (preview) {
        // ← We're in preview mode → go back to form (stay in modal)
        setPreview(false);
        // Optional: clear preview URL to free memory
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
        }
      } else {
        // ← Normal mode (form) → really close the modal
        setShowModal(false);
        setPreview(false);
        setFormData(initialFormData);
        setSelectedMonth(new Date().getMonth() + 1);
        setSelectedYear(new Date().getFullYear());
        setEditingEmployeeId(null);
        setError(null);
        setSuccess(null);
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
        }
      }
    }}
    className="generatePayslip-cancel-btn"
    disabled={isLoading}
  >
    {preview ? "Back" : "Cancel"}
  </button>

  {preview ? (
    <>
      <button 
        onClick={handleSaveToBackend} 
        className="generatePayslip-save-btn" 
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save to Database"}
      </button>

      {/* Disabled Quick Custom Button */}
      <button
        onClick={handleDownloadWithCustomTemplate}
        className="generatePayslip-download-btn"
        disabled={true}           // ← DISABLED
        style={{ opacity: 0.6, cursor: "not-allowed" }}
      >
        Quick Custom (Disabled)
      </button>

      <button
        onClick={handleDownloadWithDefaultTemplate}
        className="generatePayslip-download-btn"
        style={{ backgroundColor: "#28a745", color: "white" }}
        disabled={isLoading}
      >
        {isLoading ? "Downloading..." : "Download with Default Template"}
      </button>
    </>
  ) : (
    <>
      <button 
        onClick={handleSaveToBackend} 
        className="generatePayslip-save-btn" 
        disabled={isLoading}
      >
        Save
      </button>

      <button 
        onClick={handlePreview} 
        className="generatePayslip-preview-btn" 
        disabled={isLoading}
      >
        Preview
      </button>

      {/* Disabled Quick Custom Button - Non-Preview Mode */}
      <button
        onClick={handleDownloadWithCustomTemplate}
        className="generatePayslip-download-btn"
        disabled={true}           // ← DISABLED
        style={{ opacity: 0.6, cursor: "not-allowed" }}
      >
        Using buildtemplate (Disabled)
      </button>

      <button
        onClick={handleDownloadWithDefaultTemplate}
        className="generatePayslip-download-btn"
        style={{ backgroundColor: "#28a745" }}
        disabled={isLoading}
      >
        Quick Default
      </button>
    </>
  )}
</div>
          </div>
        </div>
      )}

      {viewDetailsModal.isVisible && viewDetailsModal.employee && (
  <Modal
    isVisible={viewDetailsModal.isVisible}
    onClose={closeViewDetails}
    buttons={[{ label: "Close", onClick: closeViewDetails }]}
    title={`Payslip Details — ${viewDetailsModal.employee.employee_name || "Employee"}`}
  >
    <div className="employee-details-professional-wrapper">

      {/* Header Section */}
      <div className="details-header-section">
        <h4 className="employee-name-title">
          {viewDetailsModal.employee.employee_name || "—"}
        </h4>
        <div className="employee-id-line">
          Employee ID: <strong>{viewDetailsModal.employee.employee_id || "—"}</strong>
        </div>
        <div className="month-year-line">
          Month/Year: <strong>
            {viewDetailsModal.employee.month ? `${new Date(0, viewDetailsModal.employee.month - 1).toLocaleString('default', { month: 'long' })} ${viewDetailsModal.employee.year || "—"}` : "—"}
          </strong>
        </div>
      </div>

      <div className="details-grid-container">

        {/* Personal & Identity Information */}
        <div className="details-card">
          <h5 className="card-title">Personal Details</h5>
          <dl className="details-grid">
            <dt>Gender</dt>             <dd>{viewDetailsModal.employee.gender || "—"}</dd>
            <dt>Designation</dt>         <dd>{viewDetailsModal.employee.designation || viewDetailsModal.employee.position || "—"}</dd>
            <dt>Date of Joining</dt>     <dd>{viewDetailsModal.employee.date_of_joining?.split("T")[0] || "—"}</dd>
            <dt>PAN Number</dt>          <dd className="mono">{viewDetailsModal.employee.pan_number || "—"}</dd>
            <dt>UAN </dt>           <dd className="mono">{viewDetailsModal.employee.uin_no || "—"}</dd>
            <dt>PF Number</dt>           <dd className="mono">{viewDetailsModal.employee.pf_number || "—"}</dd>
            <dt>ESI Number</dt>          <dd className="mono">{viewDetailsModal.employee.esi_number || "—"}</dd>
          </dl>
        </div>

        {/* Bank & Attendance */}
        <div className="details-card">
          <h5 className="card-title">Bank & Attendance</h5>
          <dl className="details-grid">
            <dt>Bank Account No</dt>     <dd className="mono">{viewDetailsModal.employee.account_no || "—"}</dd>
            <dt>Working Days</dt>        <dd>{viewDetailsModal.employee.working_days || "30"}</dd>
            <dt>LOP Days</dt>            <dd>{viewDetailsModal.employee.leaves_taken || "0"}</dd>
          </dl>
        </div>

        {/* Salary Breakdown */}
        <div className="details-card salary-breakdown-card">
          <h5 className="card-title">Salary Details</h5>
          <dl className="details-grid salary-grid">
            <dt className="earning">Basic</dt>              <dd className="amount">{viewDetailsModal.employee.basic?.toLocaleString('en-IN') || "0.00"}</dd>
            <dt className="earning">HRA</dt>                <dd className="amount">{viewDetailsModal.employee.hra?.toLocaleString('en-IN') || "0.00"}</dd>
            <dt className="earning">Other Allowance</dt>    <dd className="amount">{viewDetailsModal.employee.other_allowance?.toLocaleString('en-IN') || "0.00"}</dd>

            <dt className="deduction">PF</dt>               <dd className="amount deduction">{viewDetailsModal.employee.pf?.toLocaleString('en-IN') || "0.00"}</dd>
<dt className="deduction">ESI</dt>             
<dd className="amount deduction">{viewDetailsModal.employee.esi?.toLocaleString('en-IN') || "0.00"}</dd>

<dt className="deduction">Insurance</dt>       
<dd className="amount deduction">{viewDetailsModal.employee.insurance?.toLocaleString('en-IN') || "0.00"}</dd>            <dt className="deduction">Professional Tax</dt> <dd className="amount deduction">{viewDetailsModal.employee.professional_tax?.toLocaleString('en-IN') || "0.00"}</dd>
            <dt className="deduction">TDS</dt>              <dd className="amount deduction">{viewDetailsModal.employee.tds?.toLocaleString('en-IN') || "0.00"}</dd>

            <dt className="total">Gross Earnings</dt>       <dd className="amount total">{viewDetailsModal.employee.gross_earnings?.toLocaleString('en-IN') || "0.00"}</dd>
            <dt className="total">Total Deductions</dt>     <dd className="amount deduction total">{viewDetailsModal.employee.total_deductions?.toLocaleString('en-IN') || "0.00"}</dd>
            <dt className="net">Net Salary</dt>             <dd className="amount net">{viewDetailsModal.employee.net_salary?.toLocaleString('en-IN') || "0.00"}</dd>
          </dl>
        </div>

      </div>
    </div>
  </Modal>
)}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <h3>{alertModal.title || "Alert"}</h3>
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
}