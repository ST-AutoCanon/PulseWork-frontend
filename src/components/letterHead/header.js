

import {
  EMAIL_ICON_BASE64,
  WEBSITE_ICON_BASE64,
  PHONE_ICON_BASE64
} from "./../../utils/footerIconsBase64";

export const getOrgHeaderConfig = (orgId) => {
  const parsedOrgId = parseInt(orgId, 10);

  if (parsedOrgId === 1) {
    return {
      companyName: "Sukalpa Tech Solutions Pvt Ltd",
      address: "#71, Sarathy Nagar, Near Sahyadri Nagar, Belagavi - 591108",
      contact: "Phone: +91 831 406 9203  Email: hr@sukalpatechsolutions.com",
      logo: "/images/OriginalLogo.png",
      themeColor: [15, 102, 121]
    };
  }

  return {
    companyName: "Default Company",
    address: "Company Address",
    contact: "Phone | Email",
    logo: "/images/OriginalLogo.png",
    themeColor: [15, 102, 121]
  };
};

/* =========================================



   DRAW HEADER + WATERMARK
========================================= */

/* =========================================
   DRAW HEADER + WATERMARK
========================================= */

export const drawHeader = async (doc, orgId) => {
  console.log(`[PDF Header] Drawing header & watermark for orgId: ${orgId}`);

  const config = getOrgHeaderConfig(orgId);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  try {
    // 1. White box for Logo
    doc.setFillColor(255, 255, 255);
    doc.rect(10.5, 10.5, 26, 26, "F");

    // 2. Load and Draw Main Logo
    const logoImg = await loadImage(config.logo);
    if (logoImg) {
      doc.addImage(logoImg, "PNG", 11, 11, 24, 24);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(config.companyName.substring(0, 2).toUpperCase(), 15.5, 24);
    }

    // 3. Company Name (Main Header) - Insignia Roman
    const companyNameHtml =
  await renderTextWithFont(
    config.companyName,
    16,
    "Insignia Roman",
    "#166279"   // ✅ your color applied
  );

if (companyNameHtml) {

  doc.addImage(
    companyNameHtml,
    "PNG",
    40,
    13,
    150,
    12
  );

} else {

  doc.setFont("times", "roman");
  doc.setFontSize(16);

  // RGB version of #166279
  doc.setTextColor(22, 98, 121);

  doc.text(
    config.companyName,
    40,
    21
  );

}

    // 4. Subheading - Smaller size, reduced width, positioned below company name
    const subheadingHtml = await renderTextWithFont(
      "Let us join to support you deserve", 
      8,                    // Reduced font size
      "Insignia Roman"
    );

    if (subheadingHtml) {
doc.addImage(subheadingHtml, "PNG", 40, 26, 110, 8);    } else {
      doc.setFont("times", "roman");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("Let us join to support you deserve", 40, 34);
    }

    // 5. Green dotted line (moved upward)
const lineStartX = 10.5;
const lineEndX = pageWidth - margin;
const totalLength = lineEndX - lineStartX;
const solidEndX = lineStartX + 0.75 * totalLength;

// Move lines upward
const greenLineY = 38;   // moved up from 41
const blueLineY = 39.5;  // moved up from 43.5

// Solid green part
doc.setDrawColor(0, 128, 0);
doc.setLineWidth(0.7);   // slightly thicker

doc.line(
  lineStartX,
  greenLineY,
  solidEndX,
  greenLineY
);

// Dotted part (bigger dots)
doc.setLineWidth(0.7);

// Pattern meaning:
// [dot length, space length]
// Rounded dotted part
doc.setLineCap(1);

doc.setLineDashPattern([0.6, 1.2], 0);

doc.line(
  solidEndX,
  greenLineY,
  lineEndX,
  greenLineY
);

doc.setLineDashPattern([], 0);
doc.setLineCap(0);

// 6. Blue thick line (also moved upward)
// 6. Navy blue thick line (#00468c)
doc.setDrawColor(0, 70, 140);

// Reduced thickness
doc.setLineWidth(0.8);

doc.line(
  10.5,
  blueLineY,
  pageWidth - margin,
  blueLineY
);
    // ==================== WATERMARK ====================
    if (logoImg) {
      try {
        const watermarkSize = 120;
        const opacity = 0.08;

        doc.setGState(new doc.GState({ opacity: opacity }));

        const x = (pageWidth - watermarkSize) / 2;
        const y = (pageHeight - watermarkSize) / 2 - 10;

        doc.addImage(logoImg, "PNG", x, y, watermarkSize, watermarkSize);

        doc.setGState(new doc.GState({ opacity: 1 }));
      } catch (wmErr) {
        console.warn("Watermark could not be added:", wmErr);
      }
    }

    console.log(`[PDF Header] Header + Watermark added successfully`);

  } catch (err) {
    console.error("[PDF Header] Error:", err);
  }
};

/* =========================================
   DRAW FOOTER
========================================= */

/* ================================
   DRAW FOOTER - FIXED VERSION
================================ */

export const drawFooter = async (
  doc,
  orgId,
  pageNumber = 1,
  totalPages = 1
) => {
  console.log(`[PDF Footer] Drawing footer for page ${pageNumber}`);

  const config = getOrgHeaderConfig(orgId);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  try {
    /* ==================== LINES (moved upward) ==================== */
    const lineStartX = margin;
    const lineEndX = pageWidth - margin;
    const totalLength = lineEndX - lineStartX;
    const solidEndX = lineStartX + 0.75 * totalLength;

    // Green line
    const greenLineY = pageHeight - 38;   // ← Increased gap from bottom
    doc.setDrawColor(0, 128, 0);
    doc.setLineWidth(0.7);
    doc.line(lineStartX, greenLineY, solidEndX, greenLineY);

    // Dotted part
    doc.setLineCap(1);
    doc.setLineDashPattern([0.6, 1.2], 0);
    doc.line(solidEndX, greenLineY, lineEndX, greenLineY);
    doc.setLineDashPattern([], 0);
    doc.setLineCap(0);

    // Blue line
    const blueLineY = pageHeight - 36;    // ← Slightly above green
    doc.setDrawColor(0, 70, 140);
    doc.setLineWidth(0.8);
    doc.line(lineStartX, blueLineY, lineEndX, blueLineY);

    /* ==================== CONTACT LINE WITH ICONS ==================== */
    const contactY = pageHeight - 27;     // ← Moved up so it doesn't get cut off

const iconSize = 6;    const textSize = 7.5;
    const spacing = 10;
    const iconTextGap = 4.5;

    const items = [
  {
    icon: EMAIL_ICON_BASE64,
    text: "admin@sukalpatechsolutions.com"
  },
  {
    icon: WEBSITE_ICON_BASE64,
    text: "https://sukalpatechsolutions.com"
  },
  {
    icon: PHONE_ICON_BASE64,
    text: "+91 78928-59968"
  }
];

    // Preload all icons first
    const loadedIcons = items.map((item) => ({
  ...item,
  image: item.icon
}));

    // Calculate total width for perfect centering
    let totalWidth = 0;
    loadedIcons.forEach((item) => {
      const textWidth = doc.getTextWidth(item.text);
      totalWidth += iconSize + iconTextGap + textWidth + spacing;
    });
    totalWidth -= spacing;

let currentX = (pageWidth - totalWidth) / 2 + 55;
    for (const item of loadedIcons) {
      // Draw Icon
      if (item.image) {
        doc.addImage(
          item.image,
          "PNG",
          currentX,
          contactY - iconSize / 2 + 0.8,   // vertical center
          iconSize,
          iconSize
        );
      } else {
        // Fallback circle + letter
        doc.setDrawColor(15, 102, 121);
        doc.circle(currentX + iconSize / 2, contactY + 0.5, 4, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(15, 102, 121);
        const letter = item.iconPath.includes("email") ? "E" : 
                       item.iconPath.includes("phone") ? "P" : "W";
        doc.text(letter, currentX + iconSize / 2 - 1.8, contactY + 2.2);
      }

      // Draw Text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(textSize);
      doc.setTextColor(0, 0, 0);
      doc.text(item.text, currentX + iconSize + iconTextGap, contactY + 2.8);

      currentX += iconSize + iconTextGap + doc.getTextWidth(item.text) + spacing;
    }

    /* ==================== ADDRESS ==================== */
    const addressText = "Sukalpa Tech Solutions Pvt Ltd. | #71, Bauxite Road, Sarathi Nagar, Belagavi -591108";
    doc.setFontSize(8);
    doc.text(addressText, pageWidth / 2, pageHeight - 15, { align: "center" });

    /* ==================== PAGE NUMBER ==================== */
    const pageText = `Page ${pageNumber} of ${totalPages}`;
    doc.setFontSize(8);
    doc.text(pageText, pageWidth - margin - 2, pageHeight - 8, { align: "right" });

    /* ==================== SMALL LOGO (optional) ==================== */
    const smallLogo = await loadImage(config.logo);
    if (smallLogo) {
      doc.addImage(smallLogo, "PNG", margin + 2, pageHeight - 29, 11, 11);
    }

    console.log(`[PDF Footer] Footer added successfully for page ${pageNumber}`);

  } catch (err) {
    console.error("[PDF Footer] Error:", err);
  }
};

/* Safe Image Loader */
const loadImage = (src) => {

  return new Promise((resolve) => {

    if (!src) return resolve(null);

    const img = new Image();

    img.crossOrigin = "anonymous";

    img.onload = () => {

      try {

        // Convert to Base64
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const dataURL =
          canvas.toDataURL("image/png");

        resolve(dataURL);   // ✅ return Base64

      } catch (err) {

        console.error(
          "Canvas conversion failed:",
          err
        );

        resolve(null);
      }

    };

    img.onerror = () => {

      console.error(
        "❌ Failed to load:",
        src
      );

      resolve(null);

    };

    img.src = src;

  });

};

/* Render Text with Custom Font as Image */
const renderTextWithFont = async (
  text,
  fontSize,
  fontFamily,
  color = "#000000"   // ✅ added color parameter
) => {

  try {

    // Dynamically import html2canvas
    const html2canvas =
      (await import('html2canvas')).default;

    // Create temporary div
    const tempElement =
      document.createElement('div');

    tempElement.innerHTML = `<div style="
      font-family: '${fontFamily}', 'Times New Roman', serif;
      font-size: ${fontSize}px;
      color: ${color};   /* ✅ dynamic color */
      white-space: nowrap;
      padding: 2px 4px;
    ">${text}</div>`;

    tempElement.style.position = 'absolute';
    tempElement.style.left = '-9999px';
    tempElement.style.top = '-9999px';

    document.body.appendChild(tempElement);

    // Convert to canvas
    const canvas = await html2canvas(
      tempElement,
      {
        backgroundColor: null,
        scale: 4,
        useCORS: true,
        allowTaint: false,
      }
    );

    // Clean up
    document.body.removeChild(tempElement);

    // Return image
    return canvas.toDataURL('image/png');

  } catch (error) {

    console.error(
      'Error rendering text with font:',
      error
    );

    return null;

  }

};
