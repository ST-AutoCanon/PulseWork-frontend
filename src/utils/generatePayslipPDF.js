
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Function to convert number to words
const convertNumberToWords = (num) => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const thousands = ["", "Thousand", "Lakh", "Crore"];

  if (num === 0) return "Zero";

  let words = "";

  const getWords = (n, index) => {
    if (n > 0) {
      if (n < 10) words += ones[n] + " ";
      else if (n < 20) words += teens[n - 11] + " ";
      else words += tens[Math.floor(n / 10)] + " " + ones[n % 10] + " ";
      words += thousands[index] + " ";
    }
  };

  getWords(Math.floor(num / 10000000), 3); // Crore
  getWords(Math.floor((num % 10000000) / 100000), 2); // Lakh
  getWords(Math.floor((num % 100000) / 1000), 1); // Thousand
  getWords(Math.floor((num % 1000) / 100), 0); // Hundreds

  if (num % 100 > 0) getWords(num % 100, 0);

  return words.trim() + " only";
};

function generatePayslipPDF(payrollData, selectedDate, bankDetails, attendance, employeeDetails, download = false) {
  // Validate inputs
  if (!payrollData || !selectedDate || !bankDetails || !attendance || !employeeDetails) {
    console.error("Missing required input data:", { payrollData, selectedDate, bankDetails, attendance, employeeDetails });
    alert("No payroll data available.");
    return null;
  }

  // Format net salary and ensure it's a valid number
  const netSalary = parseFloat(payrollData.net_salary) || 0;
  const formattedNetSalary = netSalary.toFixed(0);
  const netSalaryWords = convertNumberToWords(parseInt(formattedNetSalary));

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm for A4
  const margin = 10;
  const maxWidth = pageWidth - 2 * margin; // 190mm

  doc.setFontSize(12);

  // Draw header box
  doc.setFillColor(15, 102, 121);
  doc.rect(margin, 10, maxWidth, 25, "F");

  // Add company logo
  doc.setFillColor(255, 255, 255);
  doc.rect(10.5, 10.5, 25, 24, "F");
   const logoBase64  = "data:image/png;base64,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";
  doc.addImage(logoBase64, "PNG", 11, 11, 23, 23);

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16).setFont("helvetica", "bold");
  doc.text("Sukalpa Tech Solutions Pvt Ltd", pageWidth - margin-5, 20, { align: "right" });
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text("#71, Sarathy Nagar, Near Sahyadri Nagar, Belagavi - 591108", pageWidth - margin -5, 27, { align: "right" });
  doc.text("Phone no.: +91 831 406 9203  Email: hr@sukalpatechsolutions.com", pageWidth - margin-5, 34, { align: "right" });
  doc.setTextColor(0, 0, 0);

  // Payslip title
  doc.setFontSize(14).setFont("helvetica", "bold");
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const formattedMonthYear = `${monthNames[(selectedDate.month || 1) - 1]} ${selectedDate.year || new Date().getFullYear()}`;
  doc.text(`Payslip for ${formattedMonthYear}`, pageWidth / 2, 60, { align: "center" });

  // Employee Details
  doc.setFontSize(10).setFont("helvetica", "bold");
  // Left side
  doc.text("Employee Name:", 20, 75);
  doc.setFont("helvetica", "normal").text(`${(payrollData.employee_name || "N/A").toUpperCase().substring(0, 30)}`, 60, 75);
  doc.setFont("helvetica", "bold").text("Gender:", 20, 82);
  doc.setFont("helvetica", "normal").text(`${(employeeDetails.gender || "N/A").toUpperCase()}`, 60, 82);
  doc.setFont("helvetica", "bold").text("Date of Joining:", 20, 89);
  doc.setFont("helvetica", "normal").text(`${payrollData.joining_date || "N/A"}`, 60, 89);
  doc.setFont("helvetica", "bold").text("No. of Working Days:", 20, 96);
  doc.setFont("helvetica", "normal").text(`${attendance.total_working_days || "N/A"}`, 60, 96);
  doc.setFont("helvetica", "bold").text("UAN No:", 20, 103);
  doc.setFont("helvetica", "normal").text(`${payrollData.uin_number || "N/A"}`, 60, 103);
  doc.setFont("helvetica", "bold").text("ESI Number:", 20, 110);
  doc.setFont("helvetica", "normal").text(`${bankDetails.esi_number || "N/A"}`, 60, 110);

  // Right side
  // Right side (shifted two more steps right)
doc.setFont("helvetica", "bold").text("Employee ID:", 125, 75);
doc.setFont("helvetica", "normal").text(`${payrollData.employee_id || "N/A"}`, 155, 75);

doc.setFont("helvetica", "bold").text("Designation:", 125, 82);
doc.setFont("helvetica", "normal").text(`${(payrollData.designation || "N/A").toUpperCase().substring(0, 30)}`, 155, 82);

doc.setFont("helvetica", "bold").text("Account No:", 125, 89);
doc.setFont("helvetica", "normal").text(`${bankDetails.account_number || "N/A"} (${bankDetails.bank_name || "N/A"})`, 155, 89);

doc.setFont("helvetica", "bold").text("Leaves Taken:", 125, 96);
doc.setFont("helvetica", "normal").text(`${attendance.leave_count || "0"}`, 155, 96);

doc.setFont("helvetica", "bold").text("PAN Number:", 125, 103);
doc.setFont("helvetica", "normal").text(`${employeeDetails.pan_number || "N/A"}`, 155, 103);

doc.setFont("helvetica", "bold").text("PF Number:", 125, 110);
doc.setFont("helvetica", "normal").text(`${bankDetails.pf_number || "N/A"}`, 155, 110);


  // Earnings and Deductions Table
  const earningsRows = [
    ["Basic", `${parseFloat(payrollData.basic_salary || 0).toFixed(2)}`, "PF", `${parseFloat(payrollData.pf || 0).toFixed(2)}`],
    ["HRA", `${parseFloat(payrollData.hra )}`, "ESI/Insurance", `${parseFloat(payrollData.insurance || 0).toFixed(2)}`],
    ["Other Allowance", `${parseFloat(payrollData.allowance || 0).toFixed(2)}`, "Professional Tax", `${parseFloat(payrollData.pt || 0).toFixed(2)}`],
  ];

  if (payrollData.special_allowance && payrollData.special_allowance != 0) {
    earningsRows.push(["Bonus", `${parseFloat(payrollData.special_allowance).toFixed(2)}`, "", ""]);
  }
  if (payrollData.rnrbonus && payrollData.rnrbonus != 0) {
    earningsRows.push(["Rewards And Recognition", `${parseFloat(payrollData.rnrbonus).toFixed(2)}`, "", ""]);
  }
  if (payrollData.advance_taken && payrollData.advance_taken != 0) {
    earningsRows.push(["", "", "Advance Taken", `${parseFloat(payrollData.advance_taken).toFixed(2)}`]);
  }
  if (payrollData.advance_recovery && payrollData.advance_recovery != 0) {
    earningsRows.push(["", "", "Advance Recovery", `${parseFloat(payrollData.advance_recovery).toFixed(2)}`]);
  }
  earningsRows.push(
    ["", "", "TDS", `${parseFloat(payrollData.tds || 0).toFixed(2)}`],
    ["Gross Earnings", `${parseFloat(payrollData.total_earnings || 0).toFixed(2)}`, "Total Deductions", `${parseFloat(payrollData.total_deductions || 0).toFixed(2)}`]
  );

  autoTable(doc, {
    startY: 115,
    head: [["Earnings", "Amount", "Deductions", "Amount"]],
    body: earningsRows,
    theme: "grid",
    styles: { fontSize: 9, lineColor: [0, 0, 0], lineWidth: 0.3, overflow: "linebreak" },
    headStyles: { fillColor: [15, 102, 121], textColor: [255, 255, 255], fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50 }, // Earnings
      1: { cellWidth: 40, halign: "right" }, // Amount (Earnings)
      2: { cellWidth: 50 }, // Deductions
      3: { cellWidth: 50, halign: "right" }, // Amount (Deductions)
    },
    margin: { left: margin, right: margin },
  });

  // Advance Table (if applicable)
  if (payrollData.advance_taken || payrollData.advance_recovery) {
    const advanceRows = [
      ["Advance Taken", `${parseFloat(payrollData.salary_advance || 0).toFixed(2)}`],
      ["Advance Recovery", `${parseFloat(payrollData.advance_recovery || 0).toFixed(2)}`],
    ];
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 4,
      body: advanceRows,
      theme: "grid",
      styles: { fontSize: 9, fontStyle: "bold", lineColor: [0, 0, 0], lineWidth: 0.3, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 140, halign: "right" },
      },
      margin: { left: margin },
    });
  }

  // Net Salary Table
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 4,
    body: [
      ["Net Salary", `${formattedNetSalary}`],
      ["Net Salary (in words)", netSalaryWords.substring(0, 100)], // Truncate to avoid overflow
    ],
    theme: "grid",
    styles: { fontSize: 9, fontStyle: "bold", lineColor: [0, 0, 0], lineWidth: 0.3, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 140 },
    },
    margin: { left: margin },
  });

  // Footer
  doc.setFontSize(9).text("This is a system-generated payslip, no signature required.", margin, doc.lastAutoTable.finalY + 10);

  // Return Blob for preview or save for download
  if (download) {
    doc.save(`Payslip_${payrollData.employee_id || "unknown"}.pdf`);
    return null;
  } else {
    return doc.output("blob");
  }
}

export default generatePayslipPDF;