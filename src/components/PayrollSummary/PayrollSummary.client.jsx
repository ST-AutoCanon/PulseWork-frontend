


"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import generatePayslipPDF from "../../utils/generatePayslipPDF";
import { useAuth } from "../../context/AuthProvider.client";
import "./PayrollSummary.css";

const PayrollSummary = () => {
  const { user } = useAuth();

  const getCurrentMonthYear = () => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentMonthYear());
  const [payrollData, setPayrollData] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
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
  const [advances, setAdvances] = useState([]);
  const [advanceDetailText, setAdvanceDetailText] = useState("None");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const employeeId = user?.employeeId;
  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.org_id ??
    user?.Org_id ??
    user?.raw?.Org_id ??
    null;

  const headers = {
    "x-api-key": API_KEY ?? "",
    "x-employee-id": employeeId ?? "",
    "x-org-id": orgId ?? "",
  };

  const protectedImgCache = new Map();
const buildAdvanceDetailText = (
  advances,
  employeeId,
  selectedMonth,
  selectedYear
) => {
  if (!Array.isArray(advances) || advances.length === 0) return "None";

  const currentDate = new Date(selectedYear, selectedMonth - 1);

  const employeeAdvances = advances.filter(
    (adv) => String(adv.employee_id) === String(employeeId)
  );

  if (employeeAdvances.length === 0) return "None";

  const details = [];

  employeeAdvances.forEach((adv) => {
    if (!adv.applicable_months || !adv.recovery_months) return;

    const [startYear, startMonth] = adv.applicable_months.split("-");
    const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1);

    const totalMonths = parseInt(adv.recovery_months);
    const totalAmount = parseFloat(adv.advance_amount);

    if (totalMonths <= 0 || totalAmount <= 0) return;

    // Calculate which installment month this is
    const monthsElapsed =
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
      (currentDate.getMonth() - startDate.getMonth()) +
      1;

    // Only show if this month is within recovery period
    if (monthsElapsed < 1 || monthsElapsed > totalMonths) return;

    const monthlyAmount = totalAmount / totalMonths;

    const suffix =
      monthsElapsed === 1
        ? "st"
        : monthsElapsed === 2
        ? "nd"
        : monthsElapsed === 3
        ? "rd"
        : "th";

    const text = `(${monthsElapsed}${suffix} month of ${totalMonths}, from ${adv.applicable_months})`;

    details.push(text);
  });

  return details.length > 0 ? details.join(", ") : "None";
};

  function normalizeUploadUrl(src, backendBase = BACKEND_URL) {
    if (!src) return src;
    if (src.startsWith("blob:") || src.startsWith("data:")) return src;
    const backend = backendBase.replace(/\/$/, "");
    if (src.startsWith("/api/")) {
      return backend + src;
    }
    try {
      const url = new URL(src, window.location.origin);
      const frontendOrigin = window.location.origin.replace(/\/$/, "");
      if (backend && url.origin === frontendOrigin) {
        return backend + url.pathname + url.search + url.hash;
      }
      return src;
    } catch (e) {
      return src;
    }
  }

  const blobToDataUrl = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  async function fetchProtectedImageDataUrl(src, backendBase = BACKEND_URL) {
    if (!src) return null;
    if (src.startsWith("data:")) return src;
    const normalized = normalizeUploadUrl(src, backendBase);
    const cached = protectedImgCache.get(normalized);
    if (cached) {
      return cached;
    }
    try {
      const res = await axios.get(normalized, {
        responseType: "blob",
        headers,
        withCredentials: true,
      });
      const dataUrl = await blobToDataUrl(res.data);
      protectedImgCache.set(normalized, dataUrl);
      return dataUrl;
    } catch (err) {}
    try {
      const res = await fetch(normalized, { credentials: "include" });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const blob = await res.blob();
      const dataUrl = await blobToDataUrl(blob);
      protectedImgCache.set(normalized, dataUrl);
      return dataUrl;
    } catch (err) {
      console.error("❌ [IMAGE FETCH] FAILED:", err.message || err);
      return null;
    }
  }

  async function replaceUploadUrlsInHtml(html = "", backendBase = BACKEND_URL) {
    if (!html || typeof html !== "string") return html;
    const uploadRegex = /\/api\/orgs\/\d+\/uploads\/[A-Za-z0-9._-]+/g;
    const matches = html.match(uploadRegex);
    if (!matches || matches.length === 0) return html;
    const unique = Array.from(new Set(matches));
    const replacements = {};
    await Promise.all(
      unique.map(async (m) => {
        const normalized = normalizeUploadUrl(m, backendBase);
        const dataUrl = await fetchProtectedImageDataUrl(normalized, backendBase);
        replacements[m] = dataUrl || normalized;
      })
    );
    let out = html;
    Object.keys(replacements).forEach((orig) => {
      const safe = orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(safe, "g"), replacements[orig]);
    });
    return out;
  }

  async function inlineAllImages(htmlString) {
    if (!htmlString) return htmlString;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const imgs = doc.querySelectorAll("img");
    await Promise.all(
      Array.from(imgs).map(async (img) => {
        let src = img.getAttribute("src");
        if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
        try {
          const res = await fetch(src);
          if (!res.ok) throw new Error();
          const blob = await res.blob();
          const dataUrl = await blobToDataUrl(blob);
          img.setAttribute("src", dataUrl);
        } catch (err) {
          console.warn("Failed to inline image", src);
          img.remove();
        }
      })
    );
    return doc.documentElement.outerHTML;
  }

  function ensurePercent(v, defaultVal = "50%") {
    if (!v) return defaultVal;
    if (typeof v === "number") return `${v}%`;
    const str = String(v).trim();
    return str.endsWith("%") ? str : `${str}%`;
  }

  const parseApplicableMonth = (monthString) => {
    if (!monthString || typeof monthString !== "string") return null;
    const parts = monthString.split("-");
    if (parts.length !== 2) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (isNaN(year) || isNaN(month)) return null;
    return new Date(year, month - 1, 1);
  };

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const handleDateChange = (event) => {
    const [year, month] = event.target.value.split("-");
    setSelectedDate({
      month: parseInt(month, 10),
      year: parseInt(year, 10),
    });
  };

 useEffect(() => {
  console.log("━━━━━━━━ ADVANCE DETAIL CALCULATION ━━━━━━━━");
  console.log("Selected:", selectedDate);
  console.log("employeeId:", employeeId);
  console.log("payrollData?.advance_recovery:", payrollData?.advance_recovery);
  console.log("advances:", advances);

  const advanceAmount = Number(payrollData?.advance_recovery || 0);

  if (advanceAmount <= 0 || advances.length === 0) {
    console.log("EARLY EXIT → no amount or no advances");
    setAdvanceDetailText("None");
    return;
  }

  const text = buildAdvanceDetailText(
    advances,
    employeeId,
    selectedDate.month,
    selectedDate.year
  );

  console.log("FINAL ADVANCE TEXT:", text);
  setAdvanceDetailText(text);
}, [payrollData, advances, selectedDate, employeeId]);


  const handleDownload = async () => {
    try {
      if (!payrollData) {
        alert("No payroll data available to download.");
        return;
      }
      console.log("🚀 DOWNLOAD STARTED");
      console.log("Header data URL present:", !!headerImgSrc);
      console.log("Footer data URL present:", !!footerImgSrc);
      console.log("Watermark data URL present:", !!watermarkImgSrc);
      console.log("Watermark props:", watermarkProps);

      const employeeName = payrollData.full_name || employeeDetails?.full_name || employeeDetails?.name || "N/A";
      const empId = payrollData.employee_id || employeeId || "N/A";
      const designation = payrollData.designation || employeeDetails?.designation || "N/A";
      const gender = employeeDetails?.gender || "N/A";
      const dojRaw = employeeDetails?.joining_date || "N/A";
      const doj = dojRaw !== "N/A"
        ? new Date(dojRaw).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "N/A";

      const pfNo = employeeDetails?.pf_number || bankDetails?.pf_number || payrollData?.pf_number || "N/A";
      const esiNo = employeeDetails?.esi_number || bankDetails?.esi_number || payrollData?.esi_number || "N/A";
      const panNo = employeeDetails?.pan_number || bankDetails?.pan_number || "N/A";
      const uanNo = employeeDetails?.uan_number || bankDetails?.uin_number || "N/A";
      const accountNo = bankDetails?.account_number || "N/A";
      const bankName = bankDetails?.bank_name || "N/A";

      const basicSalary = Number(payrollData.basic_salary || 0);
      const hra = Number(payrollData.hra || 0);
      const lta = Number(payrollData.lta || payrollData.lta_allowance || 0);
      const allowance = Number(payrollData.other_allowances || 0);
      const incentives = Number(payrollData.incentives || payrollData.incentivePay || 0);
      const overtime = Number(payrollData.overtime || payrollData.overtimePay || 0);
      const statutoryBonus = Number(payrollData.statutory_bonus || payrollData.statutoryBonus || 0);
      const bonus = Number(payrollData.bonus || 0);
      const advanceRecovery = Number(payrollData.advance_recovery || 0);
      const lopDeduction = Number(payrollData.lop_deduction || 0);
      const employeePf = Number(payrollData.employee_pf || payrollData.pf || 0);
      const employerPf = Number(payrollData.employer_pf || payrollData.employerPF || 0);
      const esic = Number(payrollData.esic || 0);
      const gratuity = Number(payrollData.gratuity || 0);
      const professionalTax = Number(payrollData.professional_tax || 0);
      const tds = Number(payrollData.tds || 0);
      const insurance = Number(payrollData.insurance || 0);
      const grossSalary = Number(payrollData.gross_salary || 0);

      const totalDeductions =
        employeePf + esic + professionalTax + tds + insurance + advanceRecovery + lopDeduction;

      const netSalary = Number(payrollData.net_salary || grossSalary - totalDeductions);

      const leavesTaken = Number(payrollData.lop_days || 0);
      const totalWorkingDays =
        attendance?.total_working_days || (leavesTaken > 0 ? 30 - leavesTaken : 30);

      const monthNames = [
        "January", "February", "March", "April", "May", "June", "July", "August",
        "September", "October", "November", "December",
      ];
      const monthYear = `${monthNames[selectedDate.month - 1]} ${selectedDate.year}`;

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

      const netSalaryWords = convertNumberToWords(netSalary);

      const employeeDetailsHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; margin-bottom: 25px;">
          <div style="padding: 8px 0; text-align: center; font-weight: bold; font-size: 13px; color: #1a3c6d; margin-bottom: 12px;">
            PAYSLIP FOR - ${monthYear.toUpperCase()}
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            <div style="flex: 1; min-width: 48%; box-sizing: border-box;">
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">Employee Name:</strong>
                ${employeeName.toUpperCase()}
              </div>
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">Employee ID:</strong>
                ${empId}
              </div>
              ${designation && designation !== "N/A" ? `
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">Designation:</strong>
                ${designation.toUpperCase()}
              </div>` : ''}
              ${pfNo && pfNo !== "N/A" ? `
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">PF No:</strong>
                ${pfNo}
              </div>` : ''}
              ${esiNo && esiNo !== "N/A" ? `
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">ESI No:</strong>
                ${esiNo}
              </div>` : ''}
              ${gender && gender !== "N/A" ? `
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">Gender:</strong>
                ${gender}
              </div>` : ''}
            </div>
            <div style="flex: 1; min-width: 48%; box-sizing: border-box;">
              ${panNo && panNo !== "N/A" ? `
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">PAN:</strong>
                ${panNo}
              </div>` : ''}
              ${uanNo && uanNo !== "N/A" ? `
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">UAN:</strong>
                ${uanNo}
              </div>` : ''}
              ${accountNo && accountNo !== "N/A" ? `
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">Account No:</strong>
                ${accountNo}${bankName && bankName !== "N/A" ? ` (${bankName})` : ''}
              </div>` : ''}
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">Working Days:</strong>
                ${totalWorkingDays}
              </div>
              ${leavesTaken > 0 ? `
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">LOP Days:</strong>
                ${leavesTaken}
              </div>` : ''}
              ${doj && doj !== "N/A" ? `
              <div style="margin-bottom: 10px;">
                <strong style="display: inline-block; width: 130px; color: #333;">Date of Joining:</strong>
                ${doj}
              </div>` : ''}
            </div>
          </div>
        </div>
      `;

      const earnings = [];
      if (basicSalary > 0) earnings.push({ name: "Basic Salary", amount: basicSalary });
      if (hra > 0) earnings.push({ name: "HRA", amount: hra });
      if (lta > 0) earnings.push({ name: "LTA", amount: lta });
      if (allowance > 0) earnings.push({ name: "Other Allowances", amount: allowance });
      if (incentives > 0) earnings.push({ name: "Incentives", amount: incentives });
      if (overtime > 0) earnings.push({ name: "Overtime", amount: overtime });
      if (statutoryBonus > 0) earnings.push({ name: "Statutory Bonus", amount: statutoryBonus });
      if (bonus > 0) earnings.push({ name: "Bonus", amount: bonus });

      const deductions = [];
      if (employeePf > 0) deductions.push({ name: "Employee PF", amount: employeePf });
      if (employerPf > 0) deductions.push({ name: "Employer PF", amount: employerPf });
      if (esic > 0) deductions.push({ name: "ESIC", amount: esic });
      if (gratuity > 0) deductions.push({ name: "Gratuity", amount: gratuity });
      if (professionalTax > 0) deductions.push({ name: "Professional Tax", amount: professionalTax });
      if (tds > 0) deductions.push({ name: "TDS", amount: tds });
      if (insurance > 0) deductions.push({ name: "Insurance", amount: insurance });
      if (lopDeduction > 0) deductions.push({ name: "LOP Deduction", amount: lopDeduction });

      const maxRows = Math.max(earnings.length, deductions.length);
      let detailRows = "";
      for (let i = 0; i < maxRows; i++) {
        const earn = earnings[i] || { name: "", amount: 0 };
        const ded = deductions[i] || { name: "", amount: 0 };
        const earnName = earn.name || "&nbsp;";
        const earnAmt = earn.amount > 0 ? earn.amount.toFixed(2) : "";
        const dedName = ded.name || "&nbsp;";
        const dedAmt = ded.amount > 0 ? ded.amount.toFixed(2) : "";
        detailRows += `
          <tr>
            <td style="border: 1px solid #000; padding: 8px;">${earnName}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${earnAmt}</td>
            <td style="border: 1px solid #000; padding: 8px;">${dedName}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${dedAmt}</td>
          </tr>`;
      }

      let advanceBlockHtml = "";
      if (advanceRecovery > 0) {
        const detailPart = advanceDetailText !== "None" ? advanceDetailText : "";
        advanceBlockHtml = `
          <tr>
            <td colspan="4" style="height: 30px; border: none;"></td>
          </tr>
          <tr style="background-color: #e0e0e0; font-size: 15px;">
            <td colspan="2" style="border: 1px solid #000; padding: 15px 12px; text-align: left; font-weight: bold; color: #1a3c6d;">
              Advance Recovery ${detailPart}
            </td>
            <td colspan="2" style="border: 1px solid #000; padding: 15px 12px; text-align: right; font-weight: bold; color: #1a3c6d;">
              ₹${advanceRecovery.toFixed(2)}
            </td>
          </tr>
        `;
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
              <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${grossSalary.toFixed(2)}</strong></td>
              <td style="border: 1px solid #000; padding: 8px;"><strong>Total Deductions</strong></td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${totalDeductions.toFixed(2)}</strong></td>
            </tr>
            ${advanceBlockHtml}
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
                Net Salary In Words:
              </td>
              <td colspan="2" style="border: 1px solid #000; padding: 12px; text-align: right;">
                ${netSalaryWords}
              </td>
            </tr>
          </tbody>
        </table>
      `;

      const dataTableHtml = employeeDetailsHtml + tableHtml;

      let baseHtml = templateHtml || `<div class="template-page"><div class="template-body"></div></div>`;
      if (templateCss) {
        baseHtml = `<style>${templateCss}</style>${baseHtml}`;
      }

      const parser = new DOMParser();
      let doc = parser.parseFromString(baseHtml, "text/html");

      let pageContainer = doc.querySelector(".template-page") || doc.body;
      pageContainer.style.position = "relative";
      pageContainer.style.minHeight = "100vh";
      pageContainer.style.boxSizing = "border-box";

      let bodyDiv = doc.querySelector(".template-body") || pageContainer;
      bodyDiv.innerHTML = dataTableHtml;
      bodyDiv.style.padding = "20px 40px";

      if (headerImgSrc && !doc.querySelector(".template-header")) {
        const headerDiv = doc.createElement("div");
        headerDiv.className = "template-header";
        headerDiv.style.marginBottom = "20px";
        headerDiv.style.textAlign = "center";
        const img = doc.createElement("img");
        img.src = headerImgSrc;
        img.style.maxWidth = "100%";
        img.style.display = "block";
        headerDiv.appendChild(img);
        pageContainer.insertBefore(headerDiv, bodyDiv);
      }

      if (footerImgSrc && !doc.querySelector(".template-footer")) {
        const footerDiv = doc.createElement("div");
        footerDiv.className = "template-footer";
        footerDiv.style.marginTop = "20px";
        footerDiv.style.textAlign = "center";
        const img = doc.createElement("img");
        img.src = footerImgSrc;
        img.style.maxWidth = "100%";
        img.style.display = "block";
        footerDiv.appendChild(img);
        pageContainer.appendChild(footerDiv);
      }

      if (watermarkImgSrc) {
        doc.querySelectorAll(".pdf-watermark").forEach((el) => el.remove());
        const wmWrapper = doc.createElement("div");
        wmWrapper.className = "pdf-watermark";
        wmWrapper.style.position = "absolute";
        wmWrapper.style.top = watermarkProps.yPct;
        wmWrapper.style.left = watermarkProps.xPct;
        wmWrapper.style.width = watermarkProps.wPct;
        wmWrapper.style.height = watermarkProps.hPct;
        wmWrapper.style.transform = "translate(-50%, -50%)";
        wmWrapper.style.opacity = watermarkProps.opacity;
        wmWrapper.style.pointerEvents = "none";
        wmWrapper.style.zIndex = "-1";
        const img = doc.createElement("img");
        img.src = watermarkImgSrc;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        wmWrapper.appendChild(img);
        pageContainer.insertBefore(wmWrapper, pageContainer.firstChild);
      }

      let finalHtml = doc.documentElement.outerHTML;
      finalHtml = await inlineAllImages(finalHtml);

      const processedTemplate = {
        html: finalHtml,
        css: "",
      };

      const blob = await generatePayslipPDF(
        payrollData,
        selectedDate,
        bankDetails || {},
        attendance || {},
        employeeDetails || {},
        processedTemplate
      );

      if (!blob) {
        alert("Failed to generate PDF. Please try again.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payslip_${empId}_${selectedDate.month.toString().padStart(2, "0")}_${selectedDate.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download payslip:", err);
      alert("Error generating PDF. Check console for details.");
    }
  };

  useEffect(() => {
    const fetchSelectedTemplate = async () => {
      if (!orgId) return;
      try {
        const prefsRes = await axios.get(`${BACKEND_URL}/api/salary-preferences`, {
          headers,
          withCredentials: true,
        });
        const selectedId = prefsRes.data?.data?.[0]?.selected_template_id;
        if (!selectedId) return;

        const templatesRes = await axios.get(`${BACKEND_URL}/api/orgs/${orgId}/templates`, {
          headers,
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
          headerSrc = grapes.headerUrl || grapes.header_url || headerSrc;
          footerSrc = grapes.footerUrl || grapes.footer_url || footerSrc;
          if (grapes.watermark?.url) {
            wmUrl = grapes.watermark.url;
            wp = {
              xPct: ensurePercent(grapes.watermark.xPct || grapes.watermark.x || "50%"),
              yPct: ensurePercent(grapes.watermark.yPct || grapes.watermark.y || "50%"),
              wPct: ensurePercent(grapes.watermark.wPct || grapes.watermark.w || "60%"),
              hPct: ensurePercent(grapes.watermark.hPct || grapes.watermark.h || "60%"),
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

        if (selectedTemplate.html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(selectedTemplate.html, "text/html");
          const headerImg = doc.querySelector(".template-header img");
          const footerImg = doc.querySelector(".template-footer img");
          if (headerImg && !headerImgSrc) {
            const dataUrl = await fetchProtectedImageDataUrl(headerImg.getAttribute("src"));
            if (dataUrl) setHeaderImgSrc(dataUrl);
          }
          if (footerImg && !footerImgSrc) {
            const dataUrl = await fetchProtectedImageDataUrl(footerImg.getAttribute("src"));
            if (dataUrl) setFooterImgSrc(dataUrl);
          }
        }
      } catch (err) {
        console.error("TEMPLATE FETCH ERROR:", err);
      }
    };

    fetchSelectedTemplate();
  }, [orgId]);

  useEffect(() => {
    return () => {
      protectedImgCache.clear();
    };
  }, []);

  useEffect(() => {
    if (!employeeId || !orgId) {
      setError("Missing employee ID or organization. Please log in again.");
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      setPayrollData(null);
      setAdvances([]);

      try {
        const empRes = await axios.get(`${BACKEND_URL}/api/employee-details/${employeeId}`, {
          headers,
          withCredentials: true,
        });
        setEmployeeDetails(empRes.data || null);
        setAttendance(empRes.data?.attendanceStats || null);

        try {
          const bankRes = await axios.get(`${BACKEND_URL}/api/bank-details/${employeeId}`, {
            headers,
            withCredentials: true,
          });
          setBankDetails(bankRes.data || {});
        } catch {
          setBankDetails({});
        }

       try {
  const advRes = await axios.get(
    `${BACKEND_URL}/api/compensation/advance-details`,
    {
      headers,
      withCredentials: true,
    }
  );

  console.log("RAW ADVANCE DETAILS RESPONSE:", advRes.data);

  const allAdvances = Array.isArray(advRes.data)
    ? advRes.data
    : advRes.data?.data || [];

  const employeeAdvances = allAdvances.filter(
    (adv) => String(adv.employee_id) === String(employeeId)
  );

  console.log("FILTERED EMPLOYEE ADVANCES:", employeeAdvances);

  setAdvances(employeeAdvances);
} catch (err) {
  console.warn("Advance details fetch failed:", err);
  setAdvances([]);
}


        try {
          const salaryRes = await axios.get(
            `${BACKEND_URL}/api/salary-slip?employee_id=${employeeId}&month=${selectedDate.month}&year=${selectedDate.year}`,
            { headers, withCredentials: true }
          );
          setPayrollData(salaryRes.data || null);
        } catch (salaryErr) {
          if (salaryErr.response?.status === 404 || salaryErr.response?.data?.error === "Not found") {
            setPayrollData(null);
          } else {
            throw salaryErr;
          }
        }
      } catch (err) {
        console.error("Data load failed:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [selectedDate, employeeId, orgId]);

  const previewName = payrollData?.full_name || employeeDetails?.full_name || employeeDetails?.name || "N/A";
  const previewBasic = Number(payrollData?.basic_salary || 0);
  const previewHra = Number(payrollData?.hra || 0);
  const previewAllowance = Number(payrollData?.other_allowances || 0);
  const previewBonus = Number(payrollData?.bonus || 0);
  const previewPf = Number(payrollData?.employee_pf || payrollData?.pf || 0);
  const previewEsic = Number(payrollData?.esic || 0);
  const previewPt = Number(payrollData?.professional_tax || 0);
  const previewTds = Number(payrollData?.tds || 0);
  const previewInsurance = Number(payrollData?.insurance || 0);
  const previewAdvanceRecovery = Number(payrollData?.advance_recovery || 0);
  const previewLopDeduction = Number(payrollData?.lop_deduction || 0);
  const previewGross = Number(payrollData?.gross_salary || 0);
  const previewTotalDed =
    previewPf + previewEsic + previewPt + previewTds + previewInsurance + previewAdvanceRecovery + previewLopDeduction;
  const previewNet = Number(payrollData?.net_salary || previewGross - previewTotalDed);

  return (
    <div className="payroll-container">
      <h1 className="payroll-title">Employee Payslip</h1>

      <div className="payroll-controls">
        <label className="payroll-label">Select Month & Year:</label>
        <select
          value={`${selectedDate.year}-${selectedDate.month.toString().padStart(2, "0")}`}
          onChange={handleDateChange}
          className="payroll-select"
        >
          {[...Array(12)].map((_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthNum = date.getMonth() + 1;
            const yearNum = date.getFullYear();
            return (
              <option key={i} value={`${yearNum}-${monthNum.toString().padStart(2, "0")}`}>
                {date.toLocaleString("default", { month: "long" })} {yearNum}
              </option>
            );
          })}
        </select>
      </div>

      {loading && <p>Loading payroll data...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && payrollData ? (
        <div className="payslip">
          <h2>
            Payslip for {new Date(selectedDate.year, selectedDate.month - 1).toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>

          <table style={{ width: "100%", marginBottom: "20px", borderCollapse: "collapse", fontSize: "14px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "8px" }}><strong>Employee Name:</strong> {previewName}</td>
                <td style={{ padding: "8px" }}><strong>Employee ID:</strong> {employeeId}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px" }}><strong>Bank:</strong> {bankDetails?.bank_name || "N/A"}</td>
                <td style={{ padding: "8px" }}><strong>Account No:</strong> {bankDetails?.account_number || "N/A"}</td>
              </tr>
            </tbody>
          </table>

          <table className="payslip-table">
            <thead>
              <tr>
                <th>Earnings</th>
                <th>Amount (₹)</th>
                <th>Deductions</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Salary</td>
                <td>₹{previewBasic.toFixed(2)}</td>
                <td>PF</td>
                <td>₹{previewPf.toFixed(2)}</td>
              </tr>
              <tr>
                <td>HRA</td>
                <td>₹{previewHra.toFixed(2)}</td>
                <td>ESIC</td>
                <td>₹{previewEsic.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Other Allowances</td>
                <td>₹{previewAllowance.toFixed(2)}</td>
                <td>Professional Tax</td>
                <td>₹{previewPt.toFixed(2)}</td>
              </tr>
              {previewBonus > 0 && (
                <tr>
                  <td>Bonus</td>
                  <td>₹{previewBonus.toFixed(2)}</td>
                  <td></td>
                  <td></td>
                </tr>
              )}
              <tr>
                <td><strong>Gross Salary</strong></td>
                <td><strong>₹{previewGross.toFixed(2)}</strong></td>
                <td>TDS</td>
                <td>₹{previewTds.toFixed(2)}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>Insurance</td>
                <td>₹{previewInsurance.toFixed(2)}</td>
              </tr>
              {previewLopDeduction > 0 && (
                <tr>
                  <td></td>
                  <td></td>
                  <td>LOP Deduction</td>
                  <td>₹{previewLopDeduction.toFixed(2)}</td>
                </tr>
              )}
              <tr className="total-row">
                <td colSpan="2"></td>
                <td><strong>Total Deductions</strong></td>
                <td><strong>₹{previewTotalDed.toFixed(2)}</strong></td>
              </tr>

              {previewAdvanceRecovery > 0 && (
                <>
                  <tr>
                    <td colSpan="4" style={{ height: "30px", border: "none" }}></td>
                  </tr>
                  <tr style={{ backgroundColor: "#e0e0e0", fontSize: "15px" }}>
                    <td colSpan="2" style={{ padding: "15px 12px", fontWeight: "bold", color: "#1a3c6d" }}>
                      Advance Recovery {advanceDetailText !== "None" ? advanceDetailText : ""}
                    </td>
                    <td colSpan="2" style={{ padding: "15px 12px", textAlign: "right", fontWeight: "bold", color: "#1a3c6d" }}>
                      ₹{previewAdvanceRecovery.toFixed(2)}
                    </td>
                  </tr>
                </>
              )}

              <tr className="net-salary-row">
                <td colSpan="2"><strong>Net Salary</strong></td>
                <td colSpan="2"><strong>₹{previewNet.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>

          <button onClick={handleDownload} className="payroll-download-btn">
            Download PDF
          </button>
        </div>
      ) : (
        !loading && !error && <p>No payroll data available for this month.</p>
      )}
    </div>
  );
};

export default PayrollSummary;