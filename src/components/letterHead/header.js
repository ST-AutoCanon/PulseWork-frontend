

import {
  EMAIL_ICON_BASE64, 
  WEBSITE_ICON_BASE64,
  PHONE_ICON_BASE64,
  LOCATION_ICON_BASE64,
  AVINYA_PHONE_ICON_BASE64,
AVINYA_EMAIL_ICON_BASE64
} from "./../../utils/footerIconsBase64";

export const getOrgHeaderConfig = (orgId) => {

  const parsedOrgId = parseInt(orgId, 10);

  /* =========================================
     SUKALPA
  ========================================= */

  if (parsedOrgId === 1) {
    return {
      companyName: "Sukalpa Tech Solutions Pvt Ltd",
      subHeading: "Let us join to support you deserve",

      address:
        "#71, Sarathy Nagar, Near Sahyadri Nagar, Belagavi - 591108",

      phone: "+91 831 406 9203",

      email: "hr@sukalpatechsolutions.com",

      website: "https://sukalpatechsolutions.com",


      gstNo : "29ABCDE1234F1Z5",

      logo: "/images/OriginalLogo.png",

      themeColor: [15, 102, 121]
    };
  }

  /* =========================================
     AVINYA MOTORS
  ========================================= */

  if (parsedOrgId === 32) {
    return {

      companyName: "AVINYA MOTORS",

      subHeading: "MANUFACTURER OF AUTOMOBILE PARTS",

      address:
  "Plot No.4, 2nd Cross, Prajwani Road, Near High Court, Belur Industrial Area, Dharwad - 580011",
      phone: "+91 78928 59968",

      email: "info@avinyamotors.com",

      website: "https://avinyamotors.com",

      // regNo: "29ABCDE1234F1Z5",

      gstNo: "29ABCDE1234F1Z5",

      // ✅ JUST CHANGE THIS PATH
      logo: "/images/avinya-logo.png",

      themeColor: [0, 70, 140]
    };
  }

  /* =========================================
     DEFAULT
  ========================================= */

  return {
    companyName: "Default Company",
    subHeading: "Company Subheading",
    address: "Company Address",
    phone: "",
    email: "",
    website: "",
    // regNo: "",
    gstNo: "",
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

  console.log(`[PDF Header] Drawing header for orgId: ${orgId}`);

  const config = getOrgHeaderConfig(orgId);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  try {

    /* =========================================
       ORG 1 → SUKALPA OLD DESIGN
    ========================================= */

    if (parseInt(orgId) === 1) {

      /* ==============================
         LOGO BOX
      ============================== */

      doc.setFillColor(255, 255, 255);

      doc.rect(10.5, 10.5, 26, 26, "F");

      /* ==============================
         LOGO
      ============================== */

      const logoImg = await loadImage(config.logo);

      if (logoImg) {

        doc.addImage(
          logoImg,
          "PNG",
          11,
          11,
          24,
          24
        );

      } else {

        doc.setFont("helvetica", "bold");

        doc.setFontSize(14);

        doc.setTextColor(0, 0, 0);

        doc.text(
          config.companyName
            .substring(0, 2)
            .toUpperCase(),
          15.5,
          24
        );
      }

      /* ==============================
         COMPANY NAME
      ============================== */

      const companyNameHtml =
        await renderTextWithFont(
          config.companyName,
          16,
          "Insignia Roman",
          "#166279"
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

        doc.setTextColor(22, 98, 121);

        doc.text(
          config.companyName,
          40,
          21
        );
      }

      /* ==============================
         SUBHEADING
      ============================== */

      const subheadingHtml =
        await renderTextWithFont(
          "Let us join to support you deserve",
          8,
          "Insignia Roman"
        );

      if (subheadingHtml) {

        doc.addImage(
          subheadingHtml,
          "PNG",
          40,
          26,
          110,
          8
        );

      } else {

        doc.setFont("times", "roman");

        doc.setFontSize(8);

        doc.setTextColor(0, 0, 0);

        doc.text(
          "Let us join to support you deserve",
          40,
          34
        );
      }

      /* ==============================
         GREEN DOTTED LINE
      ============================== */

      const lineStartX = 10.5;

      const lineEndX = pageWidth - margin;

      const totalLength =
        lineEndX - lineStartX;

      const solidEndX =
        lineStartX +
        0.75 * totalLength;

      const greenLineY = 38;

      const blueLineY = 39.5;

      doc.setDrawColor(0, 128, 0);

      doc.setLineWidth(0.7);

      doc.line(
        lineStartX,
        greenLineY,
        solidEndX,
        greenLineY
      );

      doc.setLineCap(1);

      doc.setLineDashPattern(
        [0.6, 1.2],
        0
      );

      doc.line(
        solidEndX,
        greenLineY,
        lineEndX,
        greenLineY
      );

      doc.setLineDashPattern([], 0);

      doc.setLineCap(0);

      /* ==============================
         BLUE LINE
      ============================== */

      doc.setDrawColor(0, 70, 140);

      doc.setLineWidth(0.8);

      doc.line(
        10.5,
        blueLineY,
        pageWidth - margin,
        blueLineY
      );

      /* ==============================
         WATERMARK
      ============================== */

      if (logoImg) {

        try {

          const watermarkSize = 120;

          doc.setGState(
            new doc.GState({
              opacity: 0.08
            })
          );

          const x =
            (pageWidth - watermarkSize) / 2;

          const y =
            (pageHeight - watermarkSize) / 2 - 10;

          doc.addImage(
            logoImg,
            "PNG",
            x,
            y,
            watermarkSize,
            watermarkSize
          );

          doc.setGState(
            new doc.GState({
              opacity: 1
            })
          );

        } catch (wmErr) {

          console.warn(
            "Watermark could not be added:",
            wmErr
          );
        }
      }

      return;
    }

    /* =========================================
       ORG 32 → AVINYA DESIGN
    ========================================= */

    if (parseInt(orgId) === 32) {

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);

      doc.text(
        `GST NO : ${config.gstNo}`,
        pageWidth - 6,
        16,
        { align: "right" }
      );

      /* YELLOW BOX */

      doc.setFillColor(255, 204, 0);

      doc.rect(4, 20, 14, 14, "F");

      /* LOGO */

      const logoImg = await loadImage(config.logo);

      if (logoImg) {

        doc.addImage(
          logoImg,
          "PNG",
          20,
          8,
          28,
          28
        );
      }

      /* COMPANY NAME */

      doc.setFont("times", "bold");

      doc.setFontSize(26);

      doc.setTextColor(255, 204, 0);

      doc.text(
        config.companyName,
        48,
        24
      );

      /* SUBHEADING */

      doc.setFont("helvetica", "bold");

      doc.setFontSize(11);

      doc.setTextColor(40, 40, 40);

      doc.text(
        config.subHeading,
        48,
        32
      );

      /* BLUE CONTACT BOX */

      doc.setFillColor(0, 122, 204);

      doc.rect(
        130,
        18,
        78,
        18,
        "F"
      );

      /* PHONE */

      if (AVINYA_PHONE_ICON_BASE64) {

        doc.addImage(
          AVINYA_PHONE_ICON_BASE64,
          "PNG",
          132,
          23,
          5,
          5
        );
      }

      doc.setFontSize(9);

      doc.setTextColor(255, 255, 255);

      doc.text(
        config.phone,
        138,
        27
      );

      /* EMAIL */

      if (AVINYA_EMAIL_ICON_BASE64) {

        doc.addImage(
        AVINYA_EMAIL_ICON_BASE64,
          "PNG",
          168,
          23,
          5,
          5
        );
      }

      doc.setFontSize(8);

      doc.text(
        config.email,
        174,
        27
      );

      /* BOTTOM LINE */

      doc.setDrawColor(0, 0, 0);

      doc.setLineWidth(0.3);

      doc.line(
        0,
        40,
        pageWidth,
        40
      );

      /* WATERMARK */

      if (logoImg) {

        try {

          const watermarkSize = 100;

          const img = new Image();

          img.src = logoImg;

          await new Promise((resolve) => {
            img.onload = resolve;
          });

          const canvas =
            document.createElement("canvas");

          const ctx =
            canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;

          ctx.globalAlpha = 0.05;

          ctx.drawImage(img, 0, 0);

          const transparentImage =
            canvas.toDataURL("image/png");

          const x =
            (pageWidth - watermarkSize) / 2;

          const y = 90;

          doc.addImage(
            transparentImage,
            "PNG",
            x,
            y,
            watermarkSize,
            watermarkSize
          );

        } catch (err) {

          console.log(err);
        }
      }

      return;
    }

  } catch (err) {

    console.error(
      "[PDF Header] Error:",
      err
    );
  }
};
/* =========================
   DRAW WATERMARK (SAFE)
========================= */

export const drawWatermark = async (doc, orgId) => {
  const config = getOrgHeaderConfig(orgId);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  try {
    const logoImg = await loadImage(config.logo);
    if (!logoImg) return;

    const watermarkSize = 110;

    const x = (pageWidth - watermarkSize) / 2;
    const y = (pageHeight - watermarkSize) / 2 - 5;

    /* =========================
       🔥 MAKE IMAGE TRANSPARENT
    ========================= */

    const img = new Image();
    img.src = logoImg;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;

    // ⭐ THIS IS THE KEY LINE
    ctx.globalAlpha = 0.08;  // adjust (0.05 - 0.15)

    ctx.drawImage(img, 0, 0);

    const transparentImage = canvas.toDataURL("image/png");

    /* =========================
       ADD TO PDF
    ========================= */

    doc.addImage(
      transparentImage,
      "PNG",
      x,
      y,
      watermarkSize,
      watermarkSize
    );

  } catch (err) {
    console.error("Watermark error:", err);
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

  /* 🔥 HARD RESET (fix for first page issue) */
  if (doc.GState) {
    doc.setGState(new doc.GState({ opacity: 1 }));
  }

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const config = getOrgHeaderConfig(orgId);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  try {

    /* ==================== FIXED BASELINE ==================== */
    const footerBaseY = pageHeight - 30;

    const lineStartX = margin;
    const lineEndX = pageWidth - margin;
    const totalLength = lineEndX - lineStartX;
    const solidEndX = lineStartX + 0.75 * totalLength;

    /* ==================== GREEN LINE ==================== */
   /* =========================================
   AVINYA → SINGLE BLACK LINE
========================================= */


    /* ==================== CONTACT ==================== */

const contactY = footerBaseY + 2;

const iconSize = 6;
const textSize = 7.5;
const spacing = 10;
const iconTextGap = 4.5;

let items = [];

/* =========================================
   AVINYA → ONLY LOCATION
========================================= */

/* =========================================
   AVINYA FOOTER DESIGN
========================================= */

if (parseInt(orgId) === 32) {

  const footerBoxY = footerBaseY - 4;
  const footerBoxHeight = 18;

  /* FULL WIDTH BLUE BACKGROUND */

  doc.setFillColor(0, 122, 204);

  doc.rect(
    0,
    footerBoxY,
    pageWidth,
    footerBoxHeight,
    "F"
  );

  /* LOCATION ICON */

  const iconX = 8;
  const iconY = footerBoxY + 6;

  if (LOCATION_ICON_BASE64) {

    doc.addImage(
      LOCATION_ICON_BASE64,
      "PNG",
      iconX,
      iconY,
      6,
      6
    );
  }

  /* ADDRESS TEXT */

  doc.setFont("helvetica", "bold");

  doc.setFontSize(10);

  doc.setTextColor(255, 255, 255);

  doc.text(
    config.address,
    18,
    footerBoxY + 11
  );

  /* PAGE NUMBER */

  doc.setFont("helvetica", "bold");

  doc.setFontSize(9);

  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth - 8,
    footerBoxY + 11,
    { align: "right" }
  );

}

/* =========================================
   LOAD ICONS
========================================= */

const loadedIcons = items.map((item) => ({
  ...item,
  image: item.icon
}));

/* =========================================
   CALCULATE TOTAL WIDTH
========================================= */

let totalWidth = 0;

loadedIcons.forEach((item) => {

  const textWidth =
    doc.getTextWidth(item.text);

  totalWidth +=
    iconSize +
    iconTextGap +
    textWidth +
    spacing;

});

totalWidth -= spacing;

/* =========================================
   START POSITION
========================================= */

let currentX =
  (pageWidth - totalWidth) / 2;

/* =========================================
   DRAW ICONS + TEXT
========================================= */

for (const item of loadedIcons) {

  /* ICON */

  if (
    item.image &&
    item.image.startsWith("data:image")
  ) {

    doc.addImage(
      item.image,
      "PNG",
      currentX,
      contactY - iconSize / 2 + 0.8,
      iconSize,
      iconSize
    );

  } else {

    console.warn(
      "Invalid icon:",
      item.text
    );
  }

  /* TEXT */

  doc.setFontSize(textSize);

  doc.setTextColor(0, 0, 0);

  doc.text(
    item.text,
    currentX + iconSize + iconTextGap,
    contactY + 2.8
  );

  /* MOVE X */

  currentX +=
    iconSize +
    iconTextGap +
    doc.getTextWidth(item.text) +
    spacing;
}

/* =========================================
   ADDRESS FOR NON-AVINYA ONLY
========================================= */

if (parseInt(orgId) !== 32) {

  doc.setFontSize(8);

  doc.text(
    config.companyName +
      " | " +
      config.address,
    pageWidth / 2,
    footerBaseY + 10,
    { align: "center" }
  );
}
      

  /* ==================== ADDRESS ==================== */

if (parseInt(orgId) !== 32) {

  doc.setFontSize(8);

  doc.text(
    config.companyName + " | " + config.address,
    pageWidth / 2,
    footerBaseY + 10,
    { align: "center" }
  );

}

    /* ==================== PAGE NUMBER ==================== */
    doc.setFontSize(8);
    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth - margin - 2,
      footerBaseY + 17,
      { align: "right" }
    );

   

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
