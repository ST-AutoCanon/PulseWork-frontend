import jsPDF from "jspdf";

/* =========================================
   ORG BASED CONFIG
========================================= */

const getOrgConfig = (orgId) => {

  if (parseInt(orgId) === 1) {

    return {

      name: "STS Company Pvt Ltd",

      address1:
        "No 12, IT Park Road",

      address2:
        "Bangalore - 560100",

      phone:
        "+91 9876543210",

      email:
        "info@sts.com",

      website:
        "www.sts.com",

      logo:
        "/logo/org1-logo.png"

    };

  }

  // Default fallback

  return {

    name: "Default Company",

    address1:
      "Address Line 1",

    address2:
      "City - Pincode",

    phone:
      "Phone",

    email:
      "Email",

    website:
      "Website",

    logo:
      "/logo/default-logo.png"

  };

};


/* =========================================
   HEADER DESIGN
========================================= */

export const drawLetterheadHeader = async (
  doc,
  orgId,
  title = "LETTER"
) => {

  const company =
    getOrgConfig(orgId);

  const pageWidth =
    doc.internal.pageSize.getWidth();

  try {

    // ---------- LOGO ----------

    doc.addImage(
      company.logo,
      "PNG",
      10,
      8,
      25,
      25
    );

  } catch (err) {

    console.log(
      "Logo not loaded",
      err
    );

  }

  // ---------- COMPANY NAME ----------

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(16);

  doc.text(
    company.name,
    pageWidth / 2,
    15,
    { align: "center" }
  );

  // ---------- ADDRESS ----------

  doc.setFontSize(10);

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.text(
    company.address1,
    pageWidth / 2,
    21,
    { align: "center" }
  );

  doc.text(
    company.address2,
    pageWidth / 2,
    26,
    { align: "center" }
  );

  // ---------- CONTACT ----------

  doc.text(
    `${company.phone} | ${company.email} | ${company.website}`,
    pageWidth / 2,
    31,
    { align: "center" }
  );

  // ---------- LINE ----------

  doc.setLineWidth(0.5);

  doc.line(
    10,
    36,
    pageWidth - 10,
    36
  );

  // ---------- TITLE ----------

  doc.setFontSize(14);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.text(
    title,
    pageWidth / 2,
    44,
    { align: "center" }
  );

  // ---------- TITLE LINE ----------

  doc.line(
    10,
    48,
    pageWidth - 10,
    48
  );

};



/* =========================================
   FOOTER DESIGN
========================================= */

export const drawLetterheadFooter = (
  doc
) => {

  const pageHeight =
    doc.internal.pageSize.getHeight();

  const pageWidth =
    doc.internal.pageSize.getWidth();

  doc.setFontSize(9);

  doc.setTextColor(120);

  doc.text(
    "This is a system generated document",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

};



/* =========================================
   WATERMARK DESIGN
========================================= */

export const drawWatermark = (
  doc,
  orgId
) => {

  const company =
    getOrgConfig(orgId);

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  try {

    // Set transparency

    doc.setGState(
      new doc.GState({
        opacity: 0.05
      })
    );

    doc.addImage(
      company.logo,
      "PNG",
      pageWidth / 2 - 40,
      pageHeight / 2 - 40,
      80,
      80
    );

    // Reset opacity

    doc.setGState(
      new doc.GState({
        opacity: 1
      })
    );

  } catch (err) {

    console.log(
      "Watermark issue",
      err
    );

  }

};