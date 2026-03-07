"use client";

import jsPDF from "jspdf";
import logoBase64Data from "./logo-base64.js";

const {
  insigniaRomanFont,
  logoBase64,
  emailIconBase64,
  websiteIconBase64,
  phoneIconBase64,
} = logoBase64Data || {};

const fetchUrlToDataUrl = async (url) => {
  if (!url) return null;
  if (
    typeof url === "string" &&
    (url.startsWith("data:") || url.startsWith("blob:"))
  )
    return url;

  try {
    const resp = await fetch(url, { credentials: "include" });
    if (!resp.ok) throw new Error(`Image fetch failed: ${resp.status}`);
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed reading blob"));
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("fetchUrlToDataUrl error for", url, err && err.message);
    return null;
  }
};

const loadImageElement = (dataUrl) =>
  new Promise((resolve) => {
    if (!dataUrl) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.warn("Image load failed", e);
      resolve(null);
    };
    img.src = dataUrl;
  });

const imgElementToDataUrl = async (imgEl) => {
  if (!imgEl) return null;
  if (imgEl.tagName && imgEl.tagName.toLowerCase() === "img" && imgEl.src) {
    try {
      if (imgEl.src.startsWith("data:") || imgEl.src.startsWith("blob:"))
        return imgEl.src;
      return await fetchUrlToDataUrl(imgEl.src);
    } catch (err) {
      console.warn("imgElementToDataUrl failed", err);
      return null;
    }
  }

  const innerImg = imgEl.querySelector && imgEl.querySelector("img");
  if (innerImg && innerImg.src) {
    try {
      if (innerImg.src.startsWith("data:") || innerImg.src.startsWith("blob:"))
        return innerImg.src;
      return await fetchUrlToDataUrl(innerImg.src);
    } catch (err) {
      console.warn("imgElementToDataUrl failed for inner image", err);
      return null;
    }
  }

  return null;
};

const findHeaderFooterElements = (container, contentEl) => {
  if (!container) return { headerEl: null, footerEl: null };

  const directHeader =
    container.querySelector('img[alt="Header"]') ||
    container.querySelector(".template-header") ||
    container.querySelector('img[class*="template-header"]');
  const directFooter =
    container.querySelector('img[alt="Footer"]') ||
    container.querySelector(".template-footer") ||
    container.querySelector('img[class*="template-footer"]');

  if (directHeader || directFooter) {
    return { headerEl: directHeader, footerEl: directFooter };
  }

  const isHeaderLike = (el) => {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName.toLowerCase();
    const cls = (el.className || "").toString().toLowerCase();
    const id = (el.id || "").toString().toLowerCase();
    const alt = (el.alt || "").toString().toLowerCase();
    const src = (el.src || "").toString().toLowerCase();
    if (
      tag === "img" &&
      (alt.includes("header") ||
        cls.includes("header") ||
        id.includes("header") ||
        src.includes("header"))
    )
      return true;
    if (cls.includes("template-header") || id.includes("template-header"))
      return true;
    if (tag === "div" && el.querySelector && el.querySelector("img"))
      return true;
    return false;
  };
  const isFooterLike = (el) => {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName.toLowerCase();
    const cls = (el.className || "").toString().toLowerCase();
    const id = (el.id || "").toString().toLowerCase();
    const alt = (el.alt || "").toString().toLowerCase();
    const src = (el.src || "").toString().toLowerCase();
    if (
      tag === "img" &&
      (alt.includes("footer") ||
        cls.includes("footer") ||
        id.includes("footer") ||
        src.includes("footer"))
    )
      return true;
    if (cls.includes("template-footer") || id.includes("template-footer"))
      return true;
    if (tag === "div" && el.querySelector && el.querySelector("img"))
      return true;
    return false;
  };

  let headerEl = null;
  let footerEl = null;

  if (contentEl) {
    let prev = contentEl.previousElementSibling;
    while (prev) {
      if (isHeaderLike(prev)) {
        headerEl = prev;
        break;
      }
      if (
        prev.matches &&
        prev.matches(
          ".letterhead-content-area, .letterhead-letter-form, .letterhead-form-group, .letterhead-content",
        )
      )
        break;
      prev = prev.previousElementSibling;
    }

    let next = contentEl.nextElementSibling;
    while (next) {
      if (isFooterLike(next)) {
        footerEl = next;
        break;
      }
      if (
        next.matches &&
        next.matches(".letterhead-popup-actions, .letterhead-popup-footer")
      )
        break;
      next = next.nextElementSibling;
    }
  }

  if (!headerEl) {
    const imgs = container.querySelectorAll("img");
    if (imgs && imgs.length > 0) headerEl = imgs[0];
  }
  if (!footerEl) {
    const imgs = container.querySelectorAll("img");
    if (imgs && imgs.length > 0) footerEl = imgs[imgs.length - 1];
  }

  return { headerEl, footerEl };
};

const parseLength = (val, reference) => {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return val;
  const s = String(val).trim();
  if (s === "" || s === "auto") return null;
  if (s.endsWith("%")) {
    const pct = parseFloat(s.slice(0, -1));
    if (!isNaN(pct)) return (reference * pct) / 100;
    return null;
  }
  if (s.endsWith("px")) {
    const px = parseFloat(s.slice(0, -2));
    if (!isNaN(px)) return px;
    return null;
  }
  const num = parseFloat(s);
  if (!isNaN(num)) return num;
  return null;
};

const generatePDF = async (
  element,
  letterType,
  logoUrl,
  recipientName,
  title,
  employeeName,
  position,
  effectiveDate,
  companyName,
  gstinNumber,
  cinNumber,
  address,
  preview = false,
) => {
  if (typeof window === "undefined") {
    throw new Error("generatePDF must run in the browser environment.");
  }

  try {
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
      orientation: "portrait",
    });

    let fontLoaded = false;
    try {
      if (
        insigniaRomanFont &&
        typeof insigniaRomanFont === "string" &&
        insigniaRomanFont.length > 0
      ) {
        doc.addFileToVFS("InsigniaRoman.ttf", insigniaRomanFont);
        doc.addFont("InsigniaRoman.ttf", "InsigniaRoman", "normal");
        doc.setFont("InsigniaRoman", "normal");
        fontLoaded = true;
      }
    } catch (error) {
      console.error("Error adding Insignia Roman font:", error);
    }

    let logoImage = logoBase64 || null;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const footerHeight = 80;
    const baseLineHeight = 14;
    const paragraphSpacing = 15;

    const contentElement =
      element?.querySelector?.(".letterhead-content-area") ||
      element?.querySelector('[contenteditable="true"]') ||
      element?.querySelector("textarea") ||
      null;

    const { headerEl: foundHeaderEl, footerEl: foundFooterEl } =
      findHeaderFooterElements(element, contentElement);

    let headerImageDataUrl = null;
    let footerImageDataUrl = null;
    try {
      if (foundHeaderEl)
        headerImageDataUrl = await imgElementToDataUrl(foundHeaderEl);
      if (foundFooterEl)
        footerImageDataUrl = await imgElementToDataUrl(foundFooterEl);

      if (!headerImageDataUrl && logoUrl) {
        const fetched = await fetchUrlToDataUrl(logoUrl);
        if (fetched) headerImageDataUrl = fetched;
      }
    } catch (err) {
      console.warn("header/footer load failed:", err);
    }

    // Prefer the embedded logo as the default watermark/header logo.
    logoImage = logoImage || headerImageDataUrl;

    const setGStateSafe = (opacity) => {
      try {
        if (doc.GState) {
          doc.setGState(new doc.GState({ opacity }));
        } else if (doc.setGState) {
          try {
            doc.setGState({ opacity });
          } catch {}
        }
      } catch {}
    };

    const addWatermark = () => {
      if (
        logoImage &&
        typeof logoImage === "string" &&
        logoImage.startsWith("data:image")
      ) {
        try {
          setGStateSafe(0.15);
          const watermarkSize = 240;
          doc.addImage(
            logoImage,
            "PNG",
            (pageWidth - watermarkSize) / 2,
            (pageHeight - watermarkSize) / 2,
            watermarkSize,
            watermarkSize,
            undefined,
            "FAST",
          );
        } catch (error) {
          console.error("Error adding watermark:", error);
        } finally {
          setGStateSafe(1);
        }
      }
    };

    const addHeader = () => {
      const logoWidth = 80;
      const logoHeight = 80;
      const logoTop = margin - 10;

      if (logoImage && logoImage.startsWith("data:image")) {
        try {
          doc.addImage(
            logoImage,
            "PNG",
            margin,
            logoTop,
            logoWidth,
            logoHeight,
          );
        } catch (error) {
          console.error("Error adding header logo:", error);
        }
      }

      try {
        doc.setFont(fontLoaded ? "InsigniaRoman" : "helvetica", "normal");
        doc.setFontSize(26);
        doc.setTextColor("#0F6679");
        const companyNameText =
          companyName || "Sukalpa Tech Solutions Pvt. Ltd.";
        const logoRightEdge = margin + logoWidth + 10;
        doc.text(companyNameText, logoRightEdge, margin + 25);

        doc.setFont(fontLoaded ? "InsigniaRoman" : "helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        const taglineText = "Let us join to support you deserve";
        doc.text(taglineText, logoRightEdge, margin + 60);
      } catch (error) {
        console.error("Error adding heading:", error);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(20);
        doc.setTextColor("#0F6679");
        doc.text(
          companyName || "Sukalpa Tech Solutions Pvt. Ltd.",
          margin + 90,
          margin + 25,
        );
      }

      const headerBottom = margin + Math.max(logoHeight, 55) + 15;
      doc.setDrawColor(145, 219, 69);
      doc.setLineWidth(1);
      const lineLength = pageWidth - 2 * margin;
      const solidLength = lineLength * 0.75;
      doc.line(margin, headerBottom, margin + solidLength, headerBottom);
      doc.setLineDash([2, 2], 0);
      doc.line(
        margin + solidLength,
        headerBottom,
        pageWidth - margin,
        headerBottom,
      );
      doc.setLineDash();
      doc.setDrawColor(0, 40, 111);
      doc.setLineWidth(3);
      doc.line(margin, headerBottom + 4, pageWidth - margin, headerBottom + 4);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.setLineDash();
      return headerBottom + baseLineHeight;
    };

    const addFooter = (pageNumber, totalPages) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);

      const contactInfo = {
        email: "admin@sukalpatechsolutions.com",
        website: "https://sukalpatechsolutions.com",
        phone: "+91 78928-59968",
      };
      const addressText = companyName
        ? `${companyName} | #71, Bauxite Road, Sarathi Nagar, Belagavi -591108`
        : "Sukalpa Tech Solutions Pvt Ltd. | #71, Bauxite Road, Sarathi Nagar, Belagavi -591108";
      const pageInfo = `Page ${pageNumber} of ${totalPages}`;

      const footerY = pageHeight - footerHeight;
      const centerX = pageWidth / 2;
      const gapBetweenItems = 20;
      const iconSize = 8;
      const iconTextGap = 5;
      const iconVerticalOffset = 2;

      const lineWidth = 450;
      const lineSpacing = 4;
      const lineY = footerY - 5;

      doc.setDrawColor(145, 219, 69);
      doc.setLineWidth(1);
      const solidLength = lineWidth * 0.75;
      doc.line(
        centerX - lineWidth / 2,
        lineY,
        centerX - lineWidth / 2 + solidLength,
        lineY,
      );
      doc.setLineDash([2, 2], 0);
      doc.line(
        centerX - lineWidth / 2 + solidLength,
        lineY,
        centerX + lineWidth / 2,
        lineY,
      );
      doc.setLineDash();

      doc.setDrawColor(0, 40, 111);
      doc.setLineWidth(3);
      doc.line(
        centerX - lineWidth / 2,
        lineY + lineSpacing,
        centerX + lineWidth / 2,
        lineY + lineSpacing,
      );

      const contactY = footerY + 15;
      const contactItems = [
        { icon: emailIconBase64, text: contactInfo.email },
        { icon: websiteIconBase64, text: contactInfo.website },
        { icon: phoneIconBase64, text: contactInfo.phone },
      ];

      let totalContactWidth = 0;
      const itemWidths = contactItems.map((item) => {
        const textWidth = doc.getTextWidth(item.text);
        const itemWidth = (item.icon ? iconSize + iconTextGap : 0) + textWidth;
        totalContactWidth +=
          itemWidth + (totalContactWidth > 0 ? gapBetweenItems : 0);
        return itemWidth;
      });

      let contactX = centerX - totalContactWidth / 2;

      contactItems.forEach(({ icon, text }, index) => {
        try {
          if (icon) {
            const iconY = contactY - iconSize / 2 + iconVerticalOffset;
            const textY = iconY + iconSize / 2 + 2;
            doc.addImage(icon, "PNG", contactX, iconY, iconSize, iconSize);
            doc.text(text, contactX + iconSize + iconTextGap, textY);
            contactX += itemWidths[index] + gapBetweenItems;
          } else {
            doc.text(text, contactX, contactY);
            contactX += itemWidths[index] + gapBetweenItems;
          }
        } catch (error) {
          console.error(`Error adding contact icon for ${text}:`, error);
          doc.text(text, contactX, contactY);
          contactX += itemWidths[index] + gapBetweenItems;
        }
      });

      const addressY = contactY + 15;
      doc.text(addressText, centerX, addressY, { align: "center" });
      doc.text(pageInfo, centerX, addressY + 15, { align: "center" });
    };

    const checkPageOverflow = (yPos, requiredHeight) => {
      const remainingSpace = pageHeight - yPos - footerHeight;
      return remainingSpace >= requiredHeight;
    };

    const addNewPage = () => {
      addFooter(doc.getNumberOfPages(), doc.getNumberOfPages());
      doc.addPage();
      addWatermark();
      const headerBottomNew = addHeader();
      return headerBottomNew + 20;
    };

    addWatermark();
    const headerBottom = addHeader();
    let yPosition = headerBottom + 20;

    if (element) {
      const dateInput =
        element.querySelector?.(
          '.letterhead-input-field[placeholder="Date"]',
        ) || element.querySelector?.('input[name="date"], input[id="date"]');
      const dateVal =
        (dateInput && dateInput.value) ||
        new Date().toISOString().split("T")[0];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      try {
        doc.text(`Date: ${dateVal}`, pageWidth - margin, yPosition, {
          align: "right",
        });
      } catch (err) {}
      yPosition += baseLineHeight + paragraphSpacing;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const subjectInput =
      element?.querySelector(
        '.letterhead-input-field[placeholder="Subject"]',
      ) || element?.querySelector('input[name="subject"], input[id="subject"]');
    const subjectText = subjectInput?.value || "";
    if (subjectText) {
      const subjectLines = doc.splitTextToSize(
        subjectText,
        pageWidth - margin * 2,
      );
      doc.text(subjectLines, pageWidth / 2, yPosition, { align: "center" });
      yPosition += subjectLines.length * baseLineHeight + paragraphSpacing;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const titleInput =
      element?.querySelector('.letterhead-input-field[placeholder="Title"]') ||
      element?.querySelector('input[name="title"]');
    const recipientNameVal =
      (titleInput?.value ? titleInput.value + " " : "") +
      (recipientName ||
        element?.querySelector(
          '.letterhead-input-field[placeholder="Recipient Name"]',
        )?.value ||
        "");
    if (recipientNameVal && recipientNameVal.trim()) {
      doc.text("To:", margin, yPosition);
      yPosition += baseLineHeight;
      const recipientLines = doc.splitTextToSize(
        recipientNameVal,
        pageWidth - margin * 2,
      );
      doc.text(recipientLines, margin, yPosition);
      yPosition += recipientLines.length * baseLineHeight + paragraphSpacing;
    }

    const addressVal =
      address ||
      element?.querySelector('.letterhead-input-field[placeholder="Address"]')
        ?.value;
    if (addressVal && addressVal.trim()) {
      doc.text("Address:", margin, yPosition);
      yPosition += baseLineHeight;
      const addressLines = doc.splitTextToSize(
        addressVal,
        pageWidth - margin * 2,
      );
      doc.text(addressLines, margin, yPosition);
      yPosition += addressLines.length * baseLineHeight + paragraphSpacing;
    }

    let htmlContent = "";
    if (contentElement) htmlContent = contentElement.innerHTML || "";

    const looksLikeEmptyOrLetterType =
      !htmlContent ||
      htmlContent.trim() === "" ||
      htmlContent.trim() === (letterType || "").trim();

    if (looksLikeEmptyOrLetterType) {
      const altSelectors = [
        ".template-body",
        ".template-content",
        "[data-template-body]",
        "textarea[name='body']",
        "textarea[id='body']",
      ];
      for (const sel of altSelectors) {
        const n = element.querySelector?.(sel);
        if (n && (n.innerHTML || n.value)) {
          htmlContent = n.innerHTML || n.value || "";
          break;
        }
      }

      if (
        (!htmlContent || htmlContent.trim() === "") &&
        element.querySelector
      ) {
        const savedSelect = element.querySelector("#savedTemplateSelect");
        if (
          savedSelect &&
          savedSelect.selectedOptions &&
          savedSelect.selectedOptions[0]
        ) {
          const opt = savedSelect.selectedOptions[0];
          if (opt.dataset && opt.dataset.content) {
            htmlContent = opt.dataset.content;
          }
        }
      }
    }

    if (!htmlContent || htmlContent.trim() === "") {
      htmlContent = "<p></p>";
    }

    const replacements = {
      "\\[Recipient Name\\]": recipientName || "",
      "\\[Title\\]": title || "",
      "\\[Employee Name\\]": employeeName || "",
      "\\[Position\\]": position || "",
      "\\[Date\\]": effectiveDate || "",
      "\\[Company Name\\]": companyName || "",
      "\\[GSTIN Number\\]": gstinNumber || "",
      "\\[CIN Number\\]": cinNumber || "",
      "\\[Address\\]": address || "",
    };
    Object.keys(replacements).forEach((ph) => {
      const val = replacements[ph];
      if (val && val.trim()) {
        htmlContent = htmlContent.replace(new RegExp(ph, "g"), val);
      }
    });

    const parser = new DOMParser();
    const docHTML = parser.parseFromString(
      `<div>${htmlContent || ""}</div>`,
      "text/html",
    );
    const contentNodes = docHTML.querySelector("div").childNodes;

    const contentSegments = [];
    const processNode = (node, inheritedStyles = {}) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\s+/g, " ").trim();
        if (text)
          contentSegments.push({ text, styles: { ...inheritedStyles } });
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const styles = { ...inheritedStyles };
        const tag = node.tagName.toUpperCase();
        if (tag === "H1") {
          styles.fontSize = 16;
          styles.bold = true;
        } else if (tag === "H2") {
          styles.fontSize = 14;
          styles.bold = true;
        } else if (tag === "P" || tag === "DIV") {
          styles.fontSize = 11;
        } else if (tag === "STRONG" || tag === "B") {
          styles.bold = true;
        } else if (tag === "I" || tag === "EM") {
          styles.italic = true;
        } else if (tag === "U") {
          styles.underline = true;
        } else if (tag === "TABLE") {
          contentSegments.push({ table: node, styles });
          return;
        }

        Array.from(node.childNodes).forEach((ch) => processNode(ch, styles));

        if (["P", "DIV", "H1", "H2", "BR"].includes(tag)) {
          contentSegments.push({ isBreak: true });
        }
        return;
      }
    };

    contentNodes.forEach((n) => processNode(n));

    for (let i = 0; i < contentSegments.length; i++) {
      const seg = contentSegments[i];
      if (seg.isBreak) {
        yPosition += paragraphSpacing;
        continue;
      }
      if (seg.table) {
        const table = seg.table;
        const rows = [];
        const thead = table.querySelector("thead");
        const tbody = table.querySelector("tbody");
        if (thead) {
          thead.querySelectorAll("tr").forEach((tr) => {
            const cells = [];
            tr.querySelectorAll("th").forEach((th) =>
              cells.push({ text: th.textContent.trim(), isHeader: true }),
            );
            rows.push(cells);
          });
        }
        if (tbody) {
          tbody.querySelectorAll("tr").forEach((tr) => {
            const cells = [];
            tr.querySelectorAll("td").forEach((td) =>
              cells.push({ text: td.textContent.trim() }),
            );
            rows.push(cells);
          });
        }
        const colCount = rows.reduce((m, r) => Math.max(m, r.length), 0);
        const colWidths = new Array(colCount).fill(
          (pageWidth - margin * 2) / colCount,
        );

        const rowHeight = 20;
        let rowIndex = 0;
        while (rowIndex < rows.length) {
          const remainingSpace = pageHeight - yPosition - footerHeight;
          const rowsPerPage = Math.floor(remainingSpace / rowHeight) || 1;
          const rowsToRender = rows.slice(rowIndex, rowIndex + rowsPerPage);
          let y = yPosition;
          rowsToRender.forEach((r) => {
            let x = margin;
            r.forEach((cell, cIdx) => {
              doc.setFont("helvetica", cell.isHeader ? "bold" : "normal");
              doc.setFontSize(11);
              doc.rect(x, y, colWidths[cIdx], rowHeight);
              const textLines = doc.splitTextToSize(
                cell.text || "",
                colWidths[cIdx] - 6,
              );
              doc.text(textLines, x + 4, y + 14);
              x += colWidths[cIdx];
            });
            y += rowHeight;
          });
          yPosition = y;
          rowIndex += rowsToRender.length;
          if (rowIndex < rows.length) {
            yPosition = addNewPage();
          }
        }
        yPosition += paragraphSpacing;
        continue;
      }

      doc.setFont("helvetica", seg.styles?.bold ? "bold" : "normal");
      doc.setFontSize(seg.styles?.fontSize || 11);
      const words = seg.text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      for (const w of words) {
        const textLines = doc.splitTextToSize(w, pageWidth - margin * 2);
        if (!checkPageOverflow(yPosition, textLines.length * baseLineHeight)) {
          yPosition = addNewPage();
        }
        doc.text(textLines, margin, yPosition);
        yPosition += textLines.length * baseLineHeight;
      }
      yPosition += paragraphSpacing;
    }

    const sigField = element?.querySelector?.(
      '.letterhead-input-field[placeholder="Signature (Your Name, Designation)"]',
    );
    if (sigField && sigField.value && sigField.value.trim()) {
      const sigLines = doc.splitTextToSize(
        sigField.value.trim(),
        pageWidth - margin * 2,
      );
      if (
        !checkPageOverflow(yPosition, sigLines.length * baseLineHeight + 20)
      ) {
        yPosition = addNewPage();
      }
      doc.text(sigLines, margin, yPosition);
      yPosition += sigLines.length * baseLineHeight + paragraphSpacing;
    }

    addFooter(doc.getNumberOfPages(), doc.getNumberOfPages());

    if (preview) {
      return doc.output("blob");
    } else {
      const filenameSafe = (letterType || "Letter").replace(/\s+/g, "_");
      doc.save(`${filenameSafe}_${new Date().toISOString().slice(0, 10)}.pdf`);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

export default generatePDF;
