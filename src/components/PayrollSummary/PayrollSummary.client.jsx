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
  const [headerBlob, setHeaderBlob] = useState(null);
  const [footerBlob, setFooterBlob] = useState(null);
  const [watermarkBlob, setWatermarkBlob] = useState(null);
  const [watermarkProps, setWatermarkProps] = useState({
    xPct: "50%",
    yPct: "50%",
    wPct: "60%",
    hPct: "60%",
    opacity: 0.12,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
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

  async function fetchProtectedBlobUrl(
    src,
    apiKey = API_KEY,
    backendBase = BACKEND_URL
  ) {
    if (!src) return null;
    if (src.startsWith("blob:") || src.startsWith("data:")) return src;

    const normalized = normalizeUploadUrl(src, backendBase);
    console.log("🔍 [BLOB FETCH] Trying URL:", normalized);

    try {
      const res = await axios.get(normalized, {
        responseType: "blob",
        headers: { "x-api-key": apiKey || "" },
        withCredentials: true,
      });
      const blobUrl = URL.createObjectURL(res.data);
      console.log("✅ [BLOB FETCH] SUCCESS with auth headers:", blobUrl);
      return blobUrl;
    } catch (err) {
      console.warn(
        "⚠️ [BLOB FETCH] Auth headers failed:",
        err?.response?.status || err.message
      );
    }

    try {
      const res = await fetch(normalized, { credentials: "include" });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      console.log("✅ [BLOB FETCH] SUCCESS with simple fetch:", blobUrl);
      return blobUrl;
    } catch (err) {
      console.error(
        "❌ [BLOB FETCH] Simple fetch also FAILED:",
        err.message || err
      );
      return null;
    }
  }

  async function replaceUploadUrlsInHtml(
    html = "",
    apiKey = API_KEY,
    backendBase = BACKEND_URL
  ) {
    if (!html || typeof html !== "string") return html;
    const uploadRegex = /\/api\/orgs\/\d+\/uploads\/[A-Za-z0-9._-]+/g;
    const matches = html.match(uploadRegex);
    if (!matches || matches.length === 0) return html;

    const unique = Array.from(new Set(matches));
    const replacements = {};

    await Promise.all(
      unique.map(async (m) => {
        const normalized = normalizeUploadUrl(m, backendBase);
        const blobUrl = await fetchProtectedBlobUrl(
          normalized,
          apiKey,
          backendBase
        );
        replacements[m] = blobUrl || normalized;
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
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
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

  const handleDateChange = (event) => {
    const [year, month] = event.target.value.split("-");
    setSelectedDate({
      month: parseInt(month, 10),
      year: parseInt(year, 10),
    });
  };

  const handleDownload = async () => {
    try {
      if (!payrollData) {
        alert("No payroll data available to download.");
        return;
      }

      console.log("🚀 DOWNLOAD STARTED");
      console.log("Watermark blob:", !!watermarkBlob ? "YES" : "NO");
      console.log("Watermark props:", watermarkProps);
      console.log("Header blob:", !!headerBlob ? "YES" : "NO");
      console.log("Footer blob:", !!footerBlob ? "YES" : "NO");

      const employeeName =
        payrollData.full_name || employeeDetails?.name || "N/A";
      const empId = payrollData.employee_id || employeeId || "N/A";
      const designation =
        payrollData.designation || employeeDetails?.designation || "N/A";

      const basicSalary = Number(payrollData.basic_salary || 0);
      const hra = Number(payrollData.hra || 0);
      const allowance = Number(payrollData.other_allowances || 0);
      const bonus = Number(payrollData.bonus || 0);
      const advanceRecovery = Number(payrollData.advance_recovery || 0);
      const lopDeduction = Number(payrollData.lop_deduction || 0);
      const pf = Number(payrollData.employee_pf || payrollData.pf || 0);
      const esic = Number(payrollData.esic || 0);
      const professionalTax = Number(payrollData.professional_tax || 0);
      const tds = Number(payrollData.tds || 0);
      const insurance = Number(payrollData.insurance || 0);
      const grossSalary = Number(payrollData.gross_salary || 0);

      const totalDeductions =
        pf +
        esic +
        professionalTax +
        tds +
        insurance +
        advanceRecovery +
        lopDeduction;

      const netSalary = Number(
        payrollData.net_salary || grossSalary - totalDeductions
      );

      const leavesTaken = Number(payrollData.lop_days || 0);
      const totalWorkingDays =
        attendance?.total_working_days ||
        (leavesTaken > 0 ? 30 - leavesTaken : 30);

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const monthYear = `${monthNames[selectedDate.month - 1]} ${
        selectedDate.year
      }`;

      const convertNumberToWords = (num) => {
        if (!num || num === 0) return "Zero Only";
        const ones = [
          "",
          "One",
          "Two",
          "Three",
          "Four",
          "Five",
          "Six",
          "Seven",
          "Eight",
          "Nine",
          "Ten",
          "Eleven",
          "Twelve",
          "Thirteen",
          "Fourteen",
          "Fifteen",
          "Sixteen",
          "Seventeen",
          "Eighteen",
          "Nineteen",
        ];
        const tens = [
          "",
          "",
          "Twenty",
          "Thirty",
          "Forty",
          "Fifty",
          "Sixty",
          "Seventy",
          "Eighty",
          "Ninety",
        ];
        const scales = ["", "Thousand", "Lakh", "Crore"];
        let words = "";
        let i = 0;
        let n = Math.round(num);
        while (n > 0) {
          let part = n % 100;
          if (part > 19) {
            words =
              tens[Math.floor(part / 10)] +
              (part % 10 ? " " + ones[part % 10] : "") +
              (i > 0 ? " " + scales[i] : "") +
              " " +
              words;
          } else if (part > 0) {
            words = ones[part] + (i > 0 ? " " + scales[i] : "") + " " + words;
          }
          n = Math.floor(n / 100);
          i += 2;
        }
        return words.trim() + " Only";
      };

      const netSalaryWords = convertNumberToWords(netSalary);

      const dataTableHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; margin-bottom: 25px;">

  <!-- Optional subtle header (you can remove this div if you don't want any header) -->
  <div style="padding: 8px 0; text-align: center; font-weight: bold; font-size: 13px; color: #1a3c6d; margin-bottom: 12px;">
    EMPLOYEE DETAILS - ${monthYear.toUpperCase()}
  </div>

  <!-- Two column content - no border -->
  <div style="display: flex; flex-wrap: wrap; gap: 20px;">
    <!-- Left column -->
    <div style="flex: 1; min-width: 48%; box-sizing: border-box;">
      <div style="margin-bottom: 10px;">
        <strong style="display: inline-block; width: 130px; color: #333;">Employee Name:</strong>
        ${employeeName.toUpperCase()}
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="display: inline-block; width: 130px; color: #333;">Employee ID:</strong>
        ${empId}
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="display: inline-block; width: 130px; color: #333;">Designation:</strong>
        ${designation.toUpperCase() || "N/A"}
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="display: inline-block; width: 130px; color: #333;">PF No:</strong>
        ${bankDetails?.pf_number || payrollData?.pf_number || "N/A"}
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="display: inline-block; width: 130px; color: #333;">ESI No:</strong>
        ${bankDetails?.esi_number || payrollData?.esi_number || "N/A"}
      </div>
    </div>

    <!-- Right column -->
    <div style="flex: 1; min-width: 48%; box-sizing: border-box;">
      <div style="margin-bottom: 10px;">
        <strong style="display: inline-block; width: 130px; color: #333;">PAN:</strong>
        ${bankDetails?.pan_number || employeeDetails?.pan_number || "N/A"}
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="display: inline-block; width: 130px; color: #333;">UAN:</strong>
        ${bankDetails?.uin_number || employeeDetails?.uan_number || "N/A"}
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="display: inline-block; width: 130px; color: #333;">Bank Name:</strong>
        ${bankDetails?.bank_name || "N/A"}
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="display: inline-block; width: 130px; color: #333;">Account No:</strong>
        ${bankDetails?.account_number || "N/A"}
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="display: inline-block; width: 130px; color: #333;">Working Days:</strong>
        ${totalWorkingDays}
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="display: inline-block; width: 130px; color: #333;">LOP Days:</strong>
        ${leavesTaken}
      </div>
    </div>
  </div>
</div>

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Earnings</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right;">Amount (₹)</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Deductions</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">Basic Salary</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${basicSalary.toFixed(
                  2
                )}</td>
                <td style="border: 1px solid #000; padding: 8px;">PF</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${pf.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">HRA</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${hra.toFixed(
                  2
                )}</td>
                <td style="border: 1px solid #000; padding: 8px;">ESIC</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${esic.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">Other Allowances</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${allowance.toFixed(
                  2
                )}</td>
                <td style="border: 1px solid #000; padding: 8px;">Professional Tax</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${professionalTax.toFixed(
                  2
                )}</td>
              </tr>
              ${
                bonus > 0
                  ? `
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">Bonus</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${bonus.toFixed(
                  2
                )}</td>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px;"></td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"><strong>Gross Salary</strong></td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${grossSalary.toFixed(
                  2
                )}</strong></td>
                <td style="border: 1px solid #000; padding: 8px;">TDS</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${tds.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px;">Insurance</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${insurance.toFixed(
                  2
                )}</td>
              </tr>
              ${
                advanceRecovery > 0
                  ? `
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px;">Advance Recovery</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${advanceRecovery.toFixed(
                  2
                )}</td>
              </tr>`
                  : ""
              }
              ${
                lopDeduction > 0
                  ? `
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px;">LOP Deduction</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${lopDeduction.toFixed(
                  2
                )}</td>
              </tr>`
                  : ""
              }
              <tr style="background-color: #f0f0f0;">
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px;"></td>
                <td style="border: 1px solid #000; padding: 8px;"><strong>Total Deductions</strong></td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${totalDeductions.toFixed(
                  2
                )}</strong></td>
              </tr>
              <tr style="background-color: #e0e0e0; font-size: 14px;">
                <td style="border: 1px solid #000; padding: 12px; text-align: center;" colSpan="4">
                  <strong>Net Salary: ₹${netSalary.toFixed(
                    2
                  )} (${netSalaryWords})</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      let processedTemplate = null;
      if (templateHtml) {
        let htmlWithCss = templateHtml;
        if (templateCss) {
          htmlWithCss = `<style>${templateCss}</style>${htmlWithCss}`;
        }

        const parser = new DOMParser();
        let doc = parser.parseFromString(htmlWithCss, "text/html");
        const pageContainer = doc.querySelector(".template-page") || doc.body;

        pageContainer.style.position = "relative";
        pageContainer.style.minHeight = "100vh";

        const bodyDiv = doc.querySelector(".template-body") || pageContainer;
        bodyDiv.innerHTML = dataTableHtml;
        bodyDiv.style.padding = "20px 40px";
        bodyDiv.style.minHeight = "auto";

        if (headerBlob) {
          doc.querySelectorAll(".template-header").forEach((el) => el.remove());
          const headerDiv = doc.createElement("div");
          headerDiv.className = "template-header";
          const img = doc.createElement("img");
          img.src = headerBlob;
          img.style.maxWidth = "100%";
          img.style.display = "block";
          headerDiv.appendChild(img);
          pageContainer.insertBefore(headerDiv, pageContainer.firstChild);
        }

        if (footerBlob) {
          doc.querySelectorAll(".template-footer").forEach((el) => el.remove());
          const footerDiv = doc.createElement("div");
          footerDiv.className = "template-footer";
          const img = doc.createElement("img");
          img.src = footerBlob;
          img.style.maxWidth = "100%";
          img.style.display = "block";
          footerDiv.appendChild(img);
          pageContainer.appendChild(footerDiv);
        }

        if (watermarkBlob) {
          console.log("✅ INJECTING WATERMARK");
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
          img.src = watermarkBlob;
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "contain";

          wmWrapper.appendChild(img);
          pageContainer.insertBefore(wmWrapper, pageContainer.firstChild);
        } else {
          console.log("❌ NO WATERMARK BLOB - SKIPPING INJECTION");
        }

        let processedHtml = doc.documentElement.outerHTML;
        processedHtml = await inlineAllImages(processedHtml);

        processedTemplate = {
          html: processedHtml,
          css: "",
        };
      }

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
      a.download = `Payslip_${empId}_${selectedDate.month
        .toString()
        .padStart(2, "0")}_${selectedDate.year}.pdf`;
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
      if (!orgId) {
        console.log("No orgId - skipping template fetch");
        return;
      }

      console.log("🔄 TEMPLATE FETCH STARTED for orgId:", orgId);

      try {
        const prefsRes = await axios.get(
          `${BACKEND_URL}/api/salary-preferences`,
          {
            headers,
            withCredentials: true,
          }
        );

        const selectedId = prefsRes.data?.data?.[0]?.selected_template_id;
        if (!selectedId) {
          console.log("⚠️ NO SELECTED TEMPLATE ID");
          return;
        }

        console.log("Selected template ID:", selectedId);

        const templatesRes = await axios.get(
          `${BACKEND_URL}/api/orgs/${orgId}/templates`,
          {
            headers,
            withCredentials: true,
          }
        );

        const templates = templatesRes.data || [];
        const selectedTemplate = templates.find((t) => t.id === selectedId);

        if (!selectedTemplate) {
          console.log(`Template ${selectedId} not found in list`);
          return;
        }

        console.log("✅ Using template:", selectedTemplate.name);

        let processedHtml = await replaceUploadUrlsInHtml(
          selectedTemplate.html || ""
        );
        setTemplateHtml(processedHtml);
        setTemplateCss(selectedTemplate.css || "");

        let headerSrc = null;
        let footerSrc = null;

        if (selectedTemplate.html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(
            selectedTemplate.html,
            "text/html"
          );
          const headerImg = doc.querySelector(".template-header img");
          if (headerImg) headerSrc = headerImg.getAttribute("src");
          const footerImg = doc.querySelector(".template-footer img");
          if (footerImg) footerSrc = footerImg.getAttribute("src");
        }

        if (headerSrc) {
          const blobUrl = await fetchProtectedBlobUrl(headerSrc);
          if (blobUrl) setHeaderBlob(blobUrl);
        }

        if (footerSrc) {
          const blobUrl = await fetchProtectedBlobUrl(footerSrc);
          if (blobUrl) setFooterBlob(blobUrl);
        }

        let wmUrl = null;
        let wp = { ...watermarkProps };

        const grapesField =
          selectedTemplate.grapes_json || selectedTemplate.grapesJson;
        if (grapesField) {
          try {
            const grapes =
              typeof grapesField === "string"
                ? JSON.parse(grapesField)
                : grapesField;
            if (grapes?.watermark?.url) {
              wmUrl = grapes.watermark.url;
              wp = {
                xPct: ensurePercent(grapes.watermark.xPct),
                yPct: ensurePercent(grapes.watermark.yPct),
                wPct: ensurePercent(grapes.watermark.wPct),
                hPct: ensurePercent(grapes.watermark.hPct),
                opacity: grapes.watermark.opacity ?? 0.12,
              };
              console.log("✅ WATERMARK FROM grapes_json:", wmUrl, wp);
            }
          } catch (e) {
            console.error("❌ GRAPES PARSE ERROR:", e);
          }
        }

        if (!wmUrl && selectedTemplate.meta) {
          try {
            const meta =
              typeof selectedTemplate.meta === "string"
                ? JSON.parse(selectedTemplate.meta)
                : selectedTemplate.meta;
            if (meta?.watermarkPlacement) {
              wp = {
                ...wp,
                ...meta.watermarkPlacement,
                xPct: ensurePercent(meta.watermarkPlacement.xPct),
                yPct: ensurePercent(meta.watermarkPlacement.yPct),
                wPct: ensurePercent(meta.watermarkPlacement.wPct),
                hPct: ensurePercent(meta.watermarkPlacement.hPct),
              };
            }
          } catch (e) {
            console.warn("Meta parse error", e);
          }
        }

        if (wmUrl) {
          const blobUrl = await fetchProtectedBlobUrl(wmUrl);
          if (blobUrl) {
            setWatermarkBlob(blobUrl);
            setWatermarkProps(wp);
            console.log("✅ WATERMARK BLOB SET SUCCESSFULLY");
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
      [headerBlob, footerBlob, watermarkBlob].forEach((url) => {
        if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [headerBlob, footerBlob, watermarkBlob]);

  useEffect(() => {
    if (!employeeId || !orgId) {
      setError("Missing employee ID or organization. Please log in again.");
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      setPayrollData(null);

      try {
        const empRes = await axios.get(
          `${BACKEND_URL}/api/employee-details/${employeeId}`,
          {
            headers,
            withCredentials: true,
          }
        );
        setEmployeeDetails(empRes.data || null);
        setAttendance(empRes.data?.attendanceStats || null);

        try {
          const bankRes = await axios.get(
            `${BACKEND_URL}/api/bank-details/${employeeId}`,
            {
              headers,
              withCredentials: true,
            }
          );
          setBankDetails(bankRes.data || {});
        } catch {
          setBankDetails({});
        }

        try {
          const salaryRes = await axios.get(
            `${BACKEND_URL}/api/salary-slip?employee_id=${employeeId}&month=${selectedDate.month}&year=${selectedDate.year}`,
            { headers, withCredentials: true }
          );
          setPayrollData(salaryRes.data || null);
        } catch (salaryErr) {
          if (
            salaryErr.response?.status === 404 ||
            salaryErr.response?.data?.error === "Not found"
          ) {
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

  const previewName = payrollData?.full_name || employeeDetails?.name || "N/A";
  const previewDesignation =
    payrollData?.designation || employeeDetails?.designation || "N/A";
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
    previewPf +
    previewEsic +
    previewPt +
    previewTds +
    previewInsurance +
    previewAdvanceRecovery +
    previewLopDeduction;
  const previewNet = Number(
    payrollData?.net_salary || previewGross - previewTotalDed
  );

  return (
    <div className="payroll-container">
      <h1 className="payroll-title">Employee Payslip</h1>

      <div className="payroll-controls">
        <label className="payroll-label">Select Month & Year:</label>
        <select
          value={`${selectedDate.year}-${selectedDate.month
            .toString()
            .padStart(2, "0")}`}
          onChange={handleDateChange}
          className="payroll-select"
        >
          {[...Array(12)].map((_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthNum = date.getMonth() + 1;
            const yearNum = date.getFullYear();
            return (
              <option
                key={i}
                value={`${yearNum}-${monthNum.toString().padStart(2, "0")}`}
              >
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
            Payslip for{" "}
            {new Date(selectedDate.year, selectedDate.month - 1).toLocaleString(
              "default",
              { month: "long", year: "numeric" }
            )}
          </h2>

          <table
            style={{
              width: "100%",
              marginBottom: "20px",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "8px" }}>
                  <strong>Employee Name:</strong> {previewName}
                </td>
                <td style={{ padding: "8px" }}>
                  <strong>Employee ID:</strong> {employeeId}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px" }}>
                  <strong>Bank:</strong> {bankDetails?.bank_name || "N/A"}
                </td>
                <td style={{ padding: "8px" }}>
                  <strong>Account No:</strong>{" "}
                  {bankDetails?.account_number || "N/A"}
                </td>
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
                <td>
                  <strong>Gross Salary</strong>
                </td>
                <td>
                  <strong>₹{previewGross.toFixed(2)}</strong>
                </td>
                <td>TDS</td>
                <td>₹{previewTds.toFixed(2)}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>Insurance</td>
                <td>₹{previewInsurance.toFixed(2)}</td>
              </tr>
              {previewAdvanceRecovery > 0 && (
                <tr>
                  <td></td>
                  <td></td>
                  <td>Advance Recovery</td>
                  <td>₹{previewAdvanceRecovery.toFixed(2)}</td>
                </tr>
              )}
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
                <td>
                  <strong>Total Deductions</strong>
                </td>
                <td>
                  <strong>₹{previewTotalDed.toFixed(2)}</strong>
                </td>
              </tr>
              <tr className="net-salary-row">
                <td colSpan="2">
                  <strong>Net Salary</strong>
                </td>
                <td colSpan="2">
                  <strong>₹{previewNet.toFixed(2)}</strong>
                </td>
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
