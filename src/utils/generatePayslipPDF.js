import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const convertNumberToWords = (num) => {
  if (!num) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const thousands = ["", "Thousand", "Lakh", "Crore"];

  let words = "";
  const getWords = (n, index) => {
    if (n > 0) {
      if (n < 10) words += ones[n] + " ";
      else if (n < 20) words += teens[n - 11] + " ";
      else words += tens[Math.floor(n / 10)] + " " + (n % 10 ? ones[n % 10] + " " : "");
      if (index > 0) words += thousands[index] + " ";
    }
  };

  getWords(Math.floor(num / 10000000), 3); // Crore
  getWords(Math.floor((num % 10000000) / 100000), 2); // Lakh
  getWords(Math.floor((num % 100000) / 1000), 1); // Thousand
  getWords(Math.floor(num % 1000), 0); // Hundreds and below

  return words.trim() + " only";
};

// Helper to wait for all images in an element to load
const waitForImagesToLoad = (element, timeout = 10000) => {
  const imgs = Array.from(element.querySelectorAll("img"));
  if (imgs.length === 0) return Promise.resolve();

  return Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          console.warn("Image load timeout:", img.src.substring(0, 100));
          resolve(); // Resolve anyway to avoid hanging forever
        }, timeout);

        img.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timer);
          console.warn("Image failed to load:", img.src.substring(0, 100));
          resolve();
        };
      });
    })
  );
};

const generatePayslipPDF = async (
  payrollData = {},
  selectedDate = {},
  bankDetails = {},
  attendance = {},
  employeeDetails = {},
  template = null
) => {
  if (!payrollData || !selectedDate) {
    console.error("Missing required data");
    return null;
  }

  const employeeName = payrollData.full_name || "N/A";
  const employeeId = payrollData.employee_id || "N/A";
  const designation = payrollData.designation || employeeDetails?.designation || "N/A";

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
  const totalDeductions = pf + esic + professionalTax + tds + insurance + advanceRecovery + lopDeduction;
  const netSalary = Number(payrollData.net_salary || grossSalary - totalDeductions);

  const totalWorkingDays = attendance?.total_working_days || (payrollData.lop_days ? 30 - payrollData.lop_days : 30);
  const leavesTaken = payrollData.lop_days || 0;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthYear = `${monthNames[selectedDate.month - 1]} ${selectedDate.year}`;

  const netSalaryWords = convertNumberToWords(Math.round(netSalary));

  const accountNumber = bankDetails.account_number || "";
  const bankName = bankDetails.bank_name || "";
  const uin = bankDetails.uin_number || employeeDetails?.uan_number || "";
  const esiNumber = bankDetails.esi_number || payrollData.esi_number || "";
  const pfNumber = bankDetails.pf_number || payrollData.pf_number || "";
  const panNumber = bankDetails.pan_number || employeeDetails?.pan_number || "";

  const joiningDate = employeeDetails?.date_of_joining?.split("T")[0] || "N/A";

  // Always use the template branch (we always pass a template with html)
  if (template && template.html) {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.width = "210mm"; // A4 width
    container.style.minHeight = "297mm"; // A4 height
    container.style.padding = "15mm";
    container.style.background = "#fff";
    container.style.boxSizing = "border-box";
    container.style.fontFamily = "Arial, sans-serif";

    let html = template.html;
    if (template.css) {
      html = `<style>${template.css}</style>${html}`;
    }

    // Optional placeholder replacement (kept for compatibility with designed templates)
    const placeholders = {
      "{{employee_name}}": employeeName.toUpperCase(),
      "{{employee_id}}": employeeId,
      "{{designation}}": designation.toUpperCase(),
      "{{joining_date}}": joiningDate,
      "{{uin}}": uin,
      "{{esi_number}}": esiNumber,
      "{{pf_number}}": pfNumber,
      "{{pan_number}}": panNumber,
      "{{bank_name}}": bankName,
      "{{account_number}}": accountNumber,
      "{{working_days}}": totalWorkingDays,
      "{{leaves_taken}}": leavesTaken,
      "{{basic_salary}}": basicSalary.toFixed(2),
      "{{hra}}": hra.toFixed(2),
      "{{allowance}}": allowance.toFixed(2),
      "{{bonus}}": bonus.toFixed(2),
      "{{advance_recovery}}": advanceRecovery.toFixed(2),
      "{{lop_deduction}}": lopDeduction.toFixed(2),
      "{{pf}}": pf.toFixed(2),
      "{{esic}}": esic.toFixed(2),
      "{{professional_tax}}": professionalTax.toFixed(2),
      "{{tds}}": tds.toFixed(2),
      "{{insurance}}": insurance.toFixed(2),
      "{{gross_salary}}": grossSalary.toFixed(2),
      "{{total_deductions}}": totalDeductions.toFixed(2),
      "{{net_salary}}": netSalary.toFixed(2),
      "{{net_salary_words}}": netSalaryWords,
      "{{month_year}}": monthYear,
    };

    Object.entries(placeholders).forEach(([key, value]) => {
      html = html.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), value || "N/A");
    });

    container.innerHTML = html;
    document.body.appendChild(container);

    // CRITICAL: Wait for all images (header/footer/watermark) to fully load before capturing
    await waitForImagesToLoad(container);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        useCORS: true, // For any remaining external images
        allowTaint: true, // Safety for data URLs
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = Math.min(pdfWidth / canvasWidth * 2, pdfHeight / canvasHeight * 2); // Adjust for scale=2

      const imgWidth = canvasWidth * ratio / 2;
      const imgHeight = canvasHeight * ratio / 2;

      pdf.addImage(imgData, "PNG", (pdfWidth - imgWidth) / 2, 0, imgWidth, imgHeight);

      // If content is taller than one page, add more pages (basic support)
      if (imgHeight > pdfHeight) {
        let position = pdfHeight;
        while (position < imgHeight) {
          pdf.addPage();
          pdf.addImage(imgData, "PNG", (pdfWidth - imgWidth) / 2, -position, imgWidth, imgHeight);
          position += pdfHeight;
        }
      }

      return pdf.output("blob");
    } catch (err) {
      console.error("html2canvas failed:", err);
      return null;
    } finally {
      document.body.removeChild(container);
    }
  }

  // Fallback (should never be used now, but kept for safety)
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  const body = [
    ["Basic Salary", basicSalary.toFixed(2), "PF", pf.toFixed(2)],
    ["HRA", hra.toFixed(2), "ESIC", esic.toFixed(2)],
    ["Other Allowances", allowance.toFixed(2), "Professional Tax", professionalTax.toFixed(2)],
    ["Bonus", bonus.toFixed(2), "TDS", tds.toFixed(2)],
    ["", "", "Insurance", insurance.toFixed(2)],
    ["", "", "Advance Recovery", advanceRecovery.toFixed(2)],
    ["", "", "LOP Deduction", lopDeduction.toFixed(2)],
    ["Gross Salary", grossSalary.toFixed(2), "Total Deductions", totalDeductions.toFixed(2)],
  ];

  autoTable(doc, {
    startY: 120,
    head: [["Earnings", "Amount (₹)", "Deductions", "Amount (₹)"]],
    body,
    theme: "grid",
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14).setFont("helvetica", "bold");
  doc.text(`Net Salary: ₹${netSalary.toFixed(2)}`, margin, finalY);
  doc.setFontSize(10).text(`In words: ${netSalaryWords}`, margin, finalY + 8);

  return doc.output("blob");
};

export default generatePayslipPDF;