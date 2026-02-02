const SAMPLE_QR_URL = "/mnt/data/3e3b9c96-96d6-4428-ad2b-6056868e6b61.png";
const SEAL_URL = "/mnt/data/3e3b9c96-96d6-4428-ad2b-6056868e6b61.png";

export const BODY_TYPES = [
  { key: "letter", label: "Letter Head" },
  { key: "invoice", label: "Invoice" },
  { key: "quotation", label: "Quotation" },
  { key: "reimbursement", label: "Reimbursement" },
  { key: "salary", label: "Salary Statement" },
];

export const PRESET_FIELDS = {
  letter: [],
  invoice: [
    {
      name: "documentTitle",
      label: "Document Title",
      type: "label",
      content: "INVOICE",
      xPct: "5%",
      yPct: "1%",
      wPct: "90%",
      hPct: "4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
      },
    },

    {
      name: "billToHeader",
      label: "Bill To (label bar)",
      type: "label",
      content: "Bill To",
      xPct: "5%",
      yPct: "6%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        padding: 4,
        textAlign: "left",
      },
    },

    {
      name: "billTo_name",
      label: "Bill To - Name",
      type: "text",
      content: "[Company Name]",
      xPct: "6%",
      yPct: "9%",
      wPct: "48%",
      hPct: "4%",
      style: { background: "transparent", color: "#0f1724", fontSize: 11 },
    },
    {
      name: "billTo_address",
      label: "Bill To - Address",
      type: "text",
      content: "[Company Address]",
      xPct: "6%",
      yPct: "12%",
      wPct: "48%",
      hPct: "4%",
      style: { background: "transparent", color: "#0f1724", fontSize: 11 },
    },
    {
      name: "billTo_contact",
      label: "Bill To - Contact",
      type: "text",
      content: "Contact No: _______",
      xPct: "6%",
      yPct: "15%",
      wPct: "48%",
      hPct: "4%",
      style: { background: "transparent", color: "#0f1724", fontSize: 11 },
    },
    {
      name: "billTo_gstin",
      label: "Bill To - GSTIN",
      type: "text",
      content: "GSTIN: ____________",
      xPct: "6%",
      yPct: "18%",
      wPct: "48%",
      hPct: "4%",
      style: { background: "transparent", color: "#0f1724", fontSize: 11 },
    },
    {
      name: "billTo_state",
      label: "Bill To - State",
      type: "text",
      content: "State: ____________",
      xPct: "6%",
      yPct: "21%",
      wPct: "48%",
      hPct: "4%",
      style: { background: "transparent", color: "#0f1724", fontSize: 11 },
    },

    {
      name: "billDetailsHeader",
      label: "Bill Details (label bar)",
      type: "label",
      content: "Bill Details",
      xPct: "55%",
      yPct: "6%",
      wPct: "40%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        padding: 4,
        textAlign: "left",
      },
    },

    {
      name: "invoiceNo",
      label: "Invoice No",
      type: "text",
      content: "Invoice No: ______________",
      xPct: "56%",
      yPct: "9%",
      wPct: "40%",
      hPct: "4%",
      style: { background: "transparent", color: "#0f1724", fontSize: 11 },
    },
    {
      name: "invoiceDate",
      label: "Invoice Date",
      type: "text",
      content: "Invoice Date: ____________",
      xPct: "56%",
      yPct: "12%",
      wPct: "40%",
      hPct: "4%",
      style: { background: "transparent", color: "#0f1724", fontSize: 11 },
    },
    {
      name: "placeOfSupply",
      label: "Place of Supply",
      type: "text",
      content: "Place of Supply: _________",
      xPct: "56%",
      yPct: "15%",
      wPct: "40%",
      hPct: "4%",
      style: { background: "transparent", color: "#0f1724", fontSize: 11 },
    },
    {
      name: "poDate",
      label: "PO Date",
      type: "text",
      content: "PO Date: ________________",
      xPct: "56%",
      yPct: "18%",
      wPct: "40%",
      hPct: "4%",
      style: { background: "transparent", color: "#0f1724", fontSize: 11 },
    },
    {
      name: "poNumber",
      label: "PO Number",
      type: "text",
      content: "PO Number: _____________",
      xPct: "56%",
      yPct: "21%",
      wPct: "40%",
      hPct: "4%",
      style: { background: "transparent", color: "#0f1724", fontSize: 11 },
    },

    {
      name: "items",
      label: "Items Table",
      type: "table",
      xPct: "5%",
      yPct: "24%",
      wPct: "90%",
      hPct: "20%",
      tableHeaders: [
        "S.No.",
        "Items/Service Description",
        "Quantity",
        "Amount",
        "Sub Total",
        "GST(%)",
        "Total",
      ],
      tableRows: [
        ["1", "[Item / Service]", "1", "_____", "_____", "_____", "_____"],
        ["2", "", "", "", "", "", ""],
        ["3", "", "", "", "", "", ""],
      ],
      style: {
        headerBackground: "#000",
        headerColor: "#fff",
        rowBackground: "transparent",
        rowColor: "#0f1724",
        borderColor: "#cbd5e1",
        fontSize: 11,
      },
    },

    {
      name: "taxSummaryHeader",
      label: "Tax type",
      type: "label",
      content: " Tax type  Taxable Amount  Rate  Tax Amount",
      xPct: "5%",
      yPct: "44%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "taxSummary",
      label: "Tax Summary",
      type: "textarea",
      content: "[GST row here]",
      xPct: "5%",
      yPct: "47%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "amountsHeader",
      type: "label",
      content: " Amounts",
      xPct: "55%",
      yPct: "44%",
      wPct: "40%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "subTotal",
      label: "Sub Total",
      type: "text",
      content: "Sub Total: ______",
      xPct: "55%",
      yPct: "48%",
      wPct: "40%",
      hPct: "3.4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "grandTotal",
      label: "Grand Total",
      type: "text",
      content: "Total: ______",
      xPct: "55%",
      yPct: "52%",
      wPct: "40%",
      hPct: "4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontWeight: "700",
        fontSize: 12,
        textAlign: "left",
      },
    },

    {
      name: "orderInWordsHeader",
      label: "Order Amount in words",
      type: "label",
      content: " Order Amount in Words",
      xPct: "5%",
      yPct: "52%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "amountInWords",
      type: "textarea",
      content: "Order Amount in Words ",
      xPct: "5%",
      yPct: "56%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        fontStyle: "italic",
        textAlign: "left",
      },
    },

    {
      name: "advance",
      label: "Advance",
      type: "text",
      content: "Advance: ______",
      xPct: "55%",
      yPct: "56%",
      wPct: "40%",
      hPct: "3.4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },
    {
      name: "payable",
      label: "Payable Amount",
      type: "text",
      content: "Payable Amount: ______",
      xPct: "55%",
      yPct: "60%",
      wPct: "40%",
      hPct: "3.4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontWeight: "700",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "termsAndConditionsHeader",
      label: "Terms And Conditions",
      type: "label",
      content: " Terms And Conditions",
      xPct: "5%",
      yPct: "60%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "termsAndConditions",
      type: "textarea",
      content: "[terms and conditions] ",
      xPct: "5%",
      yPct: "64%",
      wPct: "48%",
      hPct: "6%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        fontStyle: "italic",
        textAlign: "left",
      },
    },

    {
      name: "bankDetailsHeader",
      label: "Bank Details",
      type: "label",
      content: " Bank Details",
      xPct: "5%",
      yPct: "72%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "qrCode",
      label: "QR Code",
      type: "image",
      content: SAMPLE_QR_URL,
      xPct: "5%",
      yPct: "76%",
      wPct: "16%",
      hPct: "12%",
      style: { background: "transparent" },
    },
    {
      name: "bankDetails",
      label: "Bank Details",
      type: "textarea",
      content:
        "Name: [Bank Name]\nAccount No: [Bank Account]\nIFSC: [Bank IFSC]\nAccount Holder: [Account Name]",
      xPct: "20%",
      yPct: "76%",
      wPct: "48%",
      hPct: "12%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "forCompany",
      label: "For Company",
      type: "text",
      content: "For: [Company Name]\nAuthorized Signatory:",
      xPct: "72%",
      yPct: "74%",
      wPct: "23%",
      hPct: "8%",
      style: {
        background: "transparent",
        color: "#0f1724",
        textAlign: "left",
      },
    },
    {
      name: "seal",
      label: "Seal",
      type: "image",
      content: SEAL_URL,
      xPct: "78%",
      yPct: "80%",
      wPct: "16%",
      hPct: "12%",
      style: { background: "transparent" },
    },
  ],

  quotation: [
    {
      name: "documentTitle",
      label: "Document Title",
      type: "label",
      content: "QUOTATION",
      xPct: "5%",
      yPct: "1%",
      wPct: "90%",
      hPct: "4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
      },
    },

    {
      name: "billToHeader",
      label: "Bill To (label bar)",
      type: "label",
      content: "Bill To",
      xPct: "5%",
      yPct: "6%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        padding: 4,
        textAlign: "left",
      },
    },
    {
      name: "billTo",
      label: "Bill To",
      type: "textarea",
      content:
        "[Company Name]\n[Company Address]\nContact No: _______\nGSTIN: ____________\nState: ____________",
      xPct: "6%",
      yPct: "9%",
      wPct: "48%",
      hPct: "18%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "billDetailsHeader",
      label: "Bill Details (label bar)",
      type: "label",
      content: "Bill Details",
      xPct: "55%",
      yPct: "6%",
      wPct: "40%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        padding: 4,
        textAlign: "left",
      },
    },
    {
      name: "billDetails",
      label: "Bill Details",
      type: "label",
      content:
        "Estimate No: ______________\nInvoice Date: ____________\nPlace of Supply: _________",
      xPct: "56%",
      yPct: "7%",
      wPct: "48%",
      hPct: "10%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "items",
      label: "Items Table",
      type: "table",
      xPct: "5%",
      yPct: "22%",
      wPct: "90%",
      hPct: "18%",
      tableHeaders: [
        "S.No.",
        "Items/Service Description",
        "Quantity",
        "Amount",
        "Sub Total",
        "GST(%)",
        "Total",
      ],
      tableRows: [
        ["1", "[Item / Service]", "1", "_____", "_____", "_____", "_____"],
        ["2", "", "", "", "", "", ""],
        ["3", "", "", "", "", "", ""],
      ],
      style: {
        headerBackground: "#000",
        headerColor: "#fff",
        rowBackground: "transparent",
        rowColor: "#0f1724",
        borderColor: "#cbd5e1",
        fontSize: 11,
      },
    },

    {
      name: "taxSummaryHeader",
      label: "Tax type",
      type: "label",
      content: " Tax type  Taxable Amount  Rate  Tax Amount",
      xPct: "5%",
      yPct: "40%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "taxSummary",
      label: "Tax Summary",
      type: "textarea",
      content: "[GST row here]",
      xPct: "5%",
      yPct: "44%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "amountsHeader",
      type: "label",
      content: " Amounts",
      xPct: "55%",
      yPct: "40%",
      wPct: "40%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "subTotal",
      label: "Sub Total",
      type: "text",
      content: "Sub Total: ______",
      xPct: "55%",
      yPct: "44%",
      wPct: "40%",
      hPct: "3.4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "grandTotal",
      label: "Grand Total",
      type: "text",
      content: "Total: ______",
      xPct: "55%",
      yPct: "48%",
      wPct: "40%",
      hPct: "4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontWeight: "700",
        fontSize: 12,
        textAlign: "left",
      },
    },

    {
      name: "orderInWordsHeader",
      label: "Order Amount in words",
      type: "label",
      content: " Order Amount in Words",
      xPct: "5%",
      yPct: "50%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "amountInWords",
      type: "textarea",
      content: "Order Amount in Words ",
      xPct: "5%",
      yPct: "54%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        fontStyle: "italic",
        textAlign: "left",
      },
    },

    {
      name: "advance",
      label: "Advance",
      type: "text",
      content: "Advance: ______",
      xPct: "55%",
      yPct: "52%",
      wPct: "40%",
      hPct: "3.4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },
    {
      name: "payable",
      label: "Payable Amount",
      type: "text",
      content: "Payable Amount: ______",
      xPct: "55%",
      yPct: "56%",
      wPct: "40%",
      hPct: "3.4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontWeight: "700",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "termsAndConditionsHeader",
      label: "Terms And Conditions",
      type: "label",
      content: " Terms And Conditions",
      xPct: "5%",
      yPct: "58%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "termsAndConditions",
      type: "textarea",
      content: "[terms and conditions] ",
      xPct: "5%",
      yPct: "62%",
      wPct: "48%",
      hPct: "6%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        fontStyle: "italic",
        textAlign: "left",
      },
    },

    {
      name: "bankDetailsHeader",
      label: "Bank Details",
      type: "label",
      content: " Bank Details",
      xPct: "5%",
      yPct: "70%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "qrCode",
      label: "QR Code",
      type: "image",
      content: SAMPLE_QR_URL,
      xPct: "5%",
      yPct: "74%",
      wPct: "16%",
      hPct: "12%",
      style: { background: "transparent" },
    },
    {
      name: "bankDetails",
      label: "Bank Details",
      type: "textarea",
      content:
        "Name: [Bank Name]\nAccount No: [Bank Account]\nIFSC: [Bank IFSC]\nAccount Holder: [Account Name]",
      xPct: "20%",
      yPct: "74%",
      wPct: "48%",
      hPct: "10%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "forCompany",
      label: "For Company",
      type: "text",
      content: "For: [Company Name]\nAuthorized Signatory:",
      xPct: "72%",
      yPct: "72%",
      wPct: "23%",
      hPct: "8%",
      style: {
        background: "transparent",
        color: "#0f1724",
        textAlign: "left",
      },
    },
    {
      name: "seal",
      label: "Seal",
      type: "image",
      content: SEAL_URL,
      xPct: "78%",
      yPct: "78%",
      wPct: "16%",
      hPct: "12%",
      style: { background: "transparent" },
    },
  ],

  reimbursement: [
    {
      name: "documentTitle",
      label: "Document Title",
      type: "label",
      content: "REIMBURSEMENT FORM",
      xPct: "5%",
      yPct: "1%",
      wPct: "90%",
      hPct: "4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
      },
    },

    {
      name: "employeeHeader",
      label: "Employee Details (label bar)",
      type: "label",
      content: "Employee Details",
      xPct: "5%",
      yPct: "6%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        padding: 4,
        textAlign: "left",
      },
    },
    {
      name: "employeeDetails",
      label: "Employee Details",
      type: "textarea",
      content:
        "Employee ID: [emp_id]\nEmployee Name: [emp_name]\nDepartment: [dept]\nDesignation: [designation]",
      xPct: "6%",
      yPct: "9%",
      wPct: "48%",
      hPct: "10%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "claimHeader",
      label: "Claim Details (label bar)",
      type: "label",
      content: "Claim Details",
      xPct: "55%",
      yPct: "6%",
      wPct: "40%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        padding: 4,
        textAlign: "left",
      },
    },
    {
      name: "claimDetails",
      label: "Claim Details",
      type: "label",
      content:
        "Claim Type: [claim_type]\nClaim Date: [date/from - to]\nClaim Period: [from_date - to_date]\nStatus: [status]",
      xPct: "56%",
      yPct: "9%",
      wPct: "40%",
      hPct: "10%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },

    {
      name: "expenses",
      label: "Expenses Table",
      type: "table",
      xPct: "5%",
      yPct: "22%",
      wPct: "90%",
      hPct: "18%",
      tableHeaders: ["Date", "Description", "Unit", "Price", "Amount"],
      tableRows: [
        ["01/01/2025", "[Description]", "1", "_____", "_____"],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
      ],
      style: {
        headerBackground: "#f8fafc",
        headerColor: "#0f1724",
        rowBackground: "#fff",
        rowColor: "#0f1724",
        borderColor: "#cbd5e1",
        fontSize: 11,
      },
    },

    {
      name: "amountsHeader",
      type: "label",
      content: " Amounts",
      xPct: "55%",
      yPct: "40%",
      wPct: "40%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "subTotal",
      label: "Sub Total",
      type: "text",
      content: "Sub Total: ______",
      xPct: "55%",
      yPct: "44%",
      wPct: "40%",
      hPct: "3.4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        textAlign: "left",
      },
    },
    {
      name: "totalAmount",
      label: "Total Amount",
      type: "text",
      content: "Total Amount: ______",
      xPct: "55%",
      yPct: "48%",
      wPct: "40%",
      hPct: "4%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontWeight: "700",
        fontSize: 12,
        textAlign: "left",
      },
    },

    {
      name: "amountInWordsHeader",
      label: "Amount in words header",
      type: "label",
      content: " Amount In Words",
      xPct: "5%",
      yPct: "40%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "amountInWords",
      type: "textarea",
      content: "Amount In Words: [amount_in_words]",
      xPct: "5%",
      yPct: "44%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        fontStyle: "italic",
        textAlign: "left",
      },
    },

    {
      name: "approvedByHeader",
      label: "Approved By (header)",
      type: "label",
      content: " Approved By",
      xPct: "5%",
      yPct: "50%",
      wPct: "48%",
      hPct: "3%",
      style: {
        background: "#000",
        color: "#fff",
        fontWeight: "700",
        textAlign: "left",
      },
    },
    {
      name: "approvedBy",
      label: "Approved By details",
      type: "textarea",
      content:
        "Name & Designation: [approver_name]\nApproved Date: [approved_date]\nRemarks: [approver_remarks]",
      xPct: "5%",
      yPct: "54%",
      wPct: "48%",
      hPct: "6%",
      style: {
        background: "transparent",
        color: "#0f1724",
        fontSize: 11,
        fontStyle: "italic",
        textAlign: "left",
      },
    },
  ],

  salary: [
    {
      name: "employee",
      label: "Employee",
      type: "text",
      wPct: "50%",
      hPct: "6%",
    },
    {
      name: "period",
      label: "Pay Period",
      type: "text",
      wPct: "50%",
      hPct: "6%",
    },
    {
      name: "earnings",
      label: "Earnings (table)",
      type: "table",
      wPct: "90%",
      hPct: "24%",
    },
    {
      name: "deductions",
      label: "Deductions (table)",
      type: "table",
      wPct: "90%",
      hPct: "24%",
    },
    { name: "netPay", label: "Net Pay", type: "text", wPct: "90%", hPct: "6%" },
  ],
};

export function fieldsToBoxes(fields = [], startYPct = 5) {
  const boxes = [];
  let curY = Number(String(startYPct).replace("%", "")) || 5;

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];

    const id = f.id || `field-${f.name}-${i}`;

    const wPct = f.wPct || "90%";
    const hPct = f.hPct || "6%";
    const numericH = Number(String(hPct).replace("%", "")) || 6;
    const xPct = f.xPct || "5%";

    let numericY;
    if (f.yPct) {
      numericY = Number(String(f.yPct).replace("%", "")) || curY;
    } else {
      numericY = curY;
    }

    if (numericY + numericH > 94) {
      numericY = Math.max(5, 94 - numericH);
    }
    const yPct = `${numericY}%`;

    const box = {
      id,
      type:
        f.type === "table" ? "table" : f.type === "image" ? "image" : "field",
      fieldName: f.name,
      label: f.label || f.name || "",
      fieldType: f.type || "text",
      content:
        f.type === "label"
          ? (f.content ?? f.label ?? "")
          : f.type === "image"
            ? (f.content ?? "")
            : (f.content ?? ""),
      xPct,
      yPct,
      wPct,
      hPct,
      locked: false,
      style: f.style || {
        fontSize: 11,
        color: "#0f1724",
        background: "transparent",
        textAlign: "left",
        padding: 6,
      },
      tableHeaders: f.tableHeaders || null,
      tableRows: f.tableRows || null,
      imageUrl: f.type === "image" ? f.content || null : null,
      isLabel: f.type === "label",
      area: "body",
    };

    boxes.push(box);

    curY = numericY + numericH + 1.5;
  }

  return boxes;
}

export function fillPlaceholdersInFields(fields = [], placeholders = {}) {
  const p = placeholders || {};
  return (fields || []).map((f) => {
    if (!f || typeof f !== "object") return f;
    const clone = { ...f };

    if (typeof clone.content === "string") {
      let content = clone.content;

      if (p.bankName) content = content.replace(/\[Bank Name\]/g, p.bankName);
      if (p.accountNo)
        content = content.replace(/\[Bank Account\]/g, p.accountNo);
      if (p.IFSC) content = content.replace(/\[Bank IFSC\]/g, p.IFSC);
      if (p.accountHolder)
        content = content.replace(/\[Account Name\]/g, p.accountHolder);
      if (p.companyName)
        content = content.replace(/\[Company Name\]/g, p.companyName);

      clone.content = content;
    }

    return clone;
  });
}
