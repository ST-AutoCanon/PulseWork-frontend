// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import './SalaryDetails.css';
// import {
//   calculateSalaryDetails,
//   calculateTotals,
//   getMonthlySalary,
// } from "@/utils/SalaryCalculations";

// import { calculateLOPEffect } from "../../../utils/lopCalculations.js";
// import { calculateIncentives } from "../../../utils/IncentiveUtils.js";
// import Modal from "../Modal/Modal.client";

// const SalaryDetails = () => {
//   const [employees, setEmployees] = useState([]);
//   const [advances, setAdvances] = useState([]);
//   const [overtimeRecords, setOvertimeRecords] = useState([]);
//   const [bonusRecords, setBonusRecords] = useState([]);
//   const [employeeLopData, setEmployeeLopData] = useState({});
//   const [employeeIncentiveData, setEmployeeIncentiveData] = useState({});
//   const [personalMap, setPersonalMap] = useState({});
//   const [workingDays, setWorkingDays] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedEmployees, setSelectedEmployees] = useState(new Set());
//   const [showPreviewModal, setShowPreviewModal] = useState(false);
//   const [showBankReportOptions, setShowBankReportOptions] = useState(false);

//   // Track approved employee IDs
//   const [approvedIds, setApprovedIds] = useState([]);

//   const API_KEY = process.env.REACT_APP_API_KEY;
//   const BASE_URL = `${process.env.REACT_APP_BACKEND_URL}`;
//   const meId = JSON.parse(localStorage.getItem("dashboardData") || "{}").employeeId;
//   const requestHeaders = { 
//     "x-api-key": API_KEY, 
//     "x-employee-id": meId,
//     'Content-Type': 'application/json'
//   };

//   // Helper to check if credentials are valid
//   const hasValidCredentials = () => API_KEY && meId;

//   // Helper to check if employee is approved
//   const isApproved = (empId) => approvedIds.includes(String(empId));

//   // Helper to calculate monthly bonus pay (from DetailsTab logic)
//   const calculateMonthlyBonusPay = (empCtc, bonusRecords) => {
//     const currentDate = new Date();
//     const currentYear = currentDate.getFullYear();
//     const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
//     const monthlyCTC = parseFloat(empCtc) / 12;

//     const monthlyBonuses = bonusRecords.filter((bonus) => {
//       const date = parseApplicableMonth(bonus.applicable_month);
//       return (
//         date &&
//         date.getFullYear() === currentYear &&
//         (date.getMonth() + 1).toString().padStart(2, '0') === currentMonthStr
//       );
//     });

//     return monthlyBonuses.reduce((sum, bonus) => {
//       let bonusAmount = 0;
//       if (bonus.fixed_amount && !isNaN(parseFloat(bonus.fixed_amount))) {
//         bonusAmount = parseFloat(bonus.fixed_amount);
//       } else if (bonus.percentage_ctc && !isNaN(parseFloat(bonus.percentage_ctc))) {
//         bonusAmount = (parseFloat(bonus.percentage_ctc) / 100) * parseFloat(empCtc || 0);
//       } else if (bonus.percentage_monthly_salary && !isNaN(parseFloat(bonus.percentage_monthly_salary))) {
//         bonusAmount = parseFloat(bonus.percentage_monthly_salary) * monthlyCTC;
//       }
//       return sum + bonusAmount;
//     }, 0);
//   };

//   // Helper to calculate local gross and net for an employee (matching DetailsTab logic)
//   const calculateLocalGrossNet = (salaryDetails, monthlyBonusPay, lopDeduction, planData) => {
//     if (!salaryDetails) {
//       return { localGross: 0, localNet: 0 };
//     }
//     const monthlyEarningsSum = [
//       salaryDetails.basicSalary || 0,
//       salaryDetails.hra || 0,
//       salaryDetails.ltaAllowance || 0,
//       salaryDetails.otherAllowances || 0,
//       salaryDetails.incentivePay || 0,
//       salaryDetails.overtimePay || 0,
//       salaryDetails.statutoryBonus || 0,
//       monthlyBonusPay
//     ].reduce((sum, val) => sum + parseFloat(val || 0), 0);

//     let monthlyDeductionsSum = 0;
//     monthlyDeductionsSum += parseFloat(salaryDetails.advanceRecovery || 0);
//     monthlyDeductionsSum += parseFloat(salaryDetails.employeePF || 0);
//     if (planData.pfEmployerIncludeInCtc !== false) {
//       monthlyDeductionsSum += parseFloat(salaryDetails.employerPF || 0);
//     }
//     monthlyDeductionsSum += parseFloat(salaryDetails.esic || 0);
//     monthlyDeductionsSum += parseFloat(salaryDetails.gratuity || 0);
//     monthlyDeductionsSum += parseFloat(salaryDetails.professionalTax || 0);
//     monthlyDeductionsSum += parseFloat(salaryDetails.tds || 0);
//     monthlyDeductionsSum += parseFloat(salaryDetails.insurance || 0);
//     monthlyDeductionsSum += lopDeduction;

//     const localGross = monthlyEarningsSum;
//     const localNet = localGross - monthlyDeductionsSum;
//     return { localGross, localNet };
//   };

//   useEffect(() => {
//     const fetchSalaryBreakupData = async () => {
//       if (!hasValidCredentials()) {
//         console.error("Missing credentials: API_KEY or meId");
//         setIsLoading(false);
//         return;
//       }

//       try {
//         setIsLoading(true);

//         const [
//           compensationsRes,
//           employeesRes,
//           advancesRes,
//           overtimeRes,
//           bonusRes,
//           workingDaysRes,
//           approvedRes,
//         ] = await Promise.all([
//           axios.get(`${BASE_URL}/api/compensations/list`, { headers: requestHeaders }).catch(err => { throw err; }),
//           axios.get(`${BASE_URL}/api/compensation/assigned`, { headers: requestHeaders }).catch(err => { throw err; }),
//           axios.get(`${BASE_URL}/api/compensation/advance-details`, { headers: requestHeaders }).catch(err => { throw err; }),
//           axios.get(`${BASE_URL}/api/compensation/overtime-status-summary`, { headers: requestHeaders }).catch(err => { throw err; }),
//           axios.get(`${BASE_URL}/api/compensation/bonus-list`, { headers: requestHeaders }).catch(err => { throw err; }),
//           axios.get(`${BASE_URL}/api/compensation/working-days`, { headers: requestHeaders }).catch(() => ({ data: { data: { totalWorkingDays: 'N/A' } } })),
//           axios.get(`${BASE_URL}/api/salary-details/approved-ids`, { headers: requestHeaders }).catch(() => ({ data: { approvedIds: [] } })),
//         ]);

//         setApprovedIds(approvedRes.data.approvedIds || []);

//         const wd = workingDaysRes.data?.data?.totalWorkingDays ?? 'N/A';
//         setWorkingDays(wd);

//         const compensationMap = new Map();
//         (compensationsRes.data?.data || []).forEach((comp) => {
//           compensationMap.set(comp.compensation_plan_name, comp.plan_data);
//         });

//         const enrichedEmployeesMap = new Map();
//         (employeesRes.data?.data || []).forEach((emp) => {
//           if (!enrichedEmployeesMap.has(emp.employee_id)) {
//             enrichedEmployeesMap.set(emp.employee_id, {
//               ...emp,
//               plan_data: compensationMap.get(emp.compensation_plan_name) || emp.plan_data,
//             });
//           }
//         });

//         const enrichedEmployees = Array.from(enrichedEmployeesMap.values());
//         setEmployees(enrichedEmployees);
//         setAdvances(advancesRes.data?.data || []);
//         setOvertimeRecords(overtimeRes.data?.data || []);
//         setBonusRecords(bonusRes.data?.data || []);

//         const lopDataPromises = enrichedEmployees.map((emp) =>
//           calculateLOPEffect(emp.employee_id)
//             .then(result => ({ employeeId: emp.employee_id, lopData: result }))
//             .catch(() => ({
//               employeeId: emp.employee_id,
//               lopData: { currentMonth: { days: 0, value: "0.00", currency: "INR" }, deferred: { days: 0, value: "0.00", currency: "INR" }, nextMonth: { days: 0, value: "0.00", currency: "INR" }, yearly: { days: 0, value: "0.00", currency: "INR" } },
//             }))
//         );
//         const lopDataResults = await Promise.all(lopDataPromises);
//         const lopDataMap = lopDataResults.reduce((acc, { employeeId, lopData }) => {
//           acc[employeeId] = lopData;
//           return acc;
//         }, {});
//         setEmployeeLopData(lopDataMap);

//         const incentiveDataPromises = enrichedEmployees.map((emp) =>
//           calculateIncentives(emp.employee_id)
//             .then(result => ({ employeeId: emp.employee_id, incentiveData: result }))
//             .catch(() => ({
//               employeeId: emp.employee_id,
//               incentiveData: { ctcIncentive: { value: "0.00", currency: "INR" }, salesIncentive: { value: "0.00", currency: "INR" }, totalIncentive: { value: "0.00", currency: "INR" } },
//             }))
//         );
//         const incentiveDataResults = await Promise.all(incentiveDataPromises);
//         const incentiveDataMap = incentiveDataResults.reduce((acc, { employeeId, incentiveData }) => {
//           const key = String(employeeId).toUpperCase();
//           if (!acc[key] || parseFloat(incentiveData.totalIncentive.value) > 0) {
//             acc[key] = incentiveData;
//           }
//           return acc;
//         }, {});
//         setEmployeeIncentiveData(incentiveDataMap);

//       } catch (error) {
//         console.error("Fetch error:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchSalaryBreakupData();
//   }, []);

//   const filteredEmployees = (employees || []).filter(
//     (emp) =>
//       emp.employee_id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
//       emp.full_name.toLowerCase().includes(searchQuery.toLowerCase())
//   );
//   const [alertModal, setAlertModal] = useState({
//     isVisible: false,
//     title: "",
//     message: "",
//   });

//   const showAlert = (message, title = "") => {
//     setAlertModal({ isVisible: true, title, message });
//   };

//   const closeAlert = () => {
//     setAlertModal({ isVisible: false, title: "", message: "" });
//   };
//   const handleRowSelect = (employeeId) => {
//     if (isApproved(employeeId)) return;

//     setSelectedEmployees((prev) => {
//       const newSet = new Set(prev);
//       if (newSet.has(employeeId)) {
//         newSet.delete(employeeId);
//       } else {
//         newSet.add(employeeId);
//       }
//       return newSet;
//     });
//   };

//   const handleSelectAll = () => {
//     const selectable = filteredEmployees
//       .filter(emp => !isApproved(emp.employee_id))
//       .map(emp => emp.employee_id);

//     if (selectedEmployees.size === selectable.length) {
//       setSelectedEmployees(new Set());
//     } else {
//       setSelectedEmployees(new Set(selectable));
//     }
//   };

//   const isAllSelected = selectedEmployees.size === filteredEmployees.filter(e => !isApproved(e.employee_id)).length && filteredEmployees.length > 0;

//   const getSelectedEmployees = () => employees.filter(emp => selectedEmployees.has(emp.employee_id));

//   const handleProceed = async () => {
//     if (!hasValidCredentials()) {
//       showAlert("Missing credentials. Please log in again.");
//       return;
//     }
//     if (selectedEmployees.size === 0) {
//       showAlert("Please select at least one employee.");
//       return;
//     }
//     try {
//       const employeeIds = Array.from(selectedEmployees);
//       const personalRes = await axios.post(
//         `${BASE_URL}/api/compensation/employee-personal-details`,
//         { employeeIds },
//         { headers: requestHeaders }
//       );
//       setPersonalMap(personalRes.data.data || {});
//       setShowPreviewModal(true);
//     } catch (error) {
//       console.error('Error fetching personal details for preview:', error);
//       if (error.response?.status === 400 || error.response?.status === 401) {
//         showAlert('Authentication failed. Please log in again.');
//       } else {
//         showAlert('Failed to fetch employee details for preview');
//       }
//     }
//   };

//   const handleCloseModal = () => {
//     setShowPreviewModal(false);
//     setPersonalMap({});
//     setShowBankReportOptions(false);
//   };

//   const downloadExcel = (employeesToExport = filteredEmployees) => {
//     if (employeesToExport.length === 0) return;

//     const rows = employeesToExport.map((emp) => {
//       let salaryDetails;
//       try {
//         salaryDetails = calculateSalaryDetails(
//           emp.ctc, emp.plan_data, emp.employee_id, overtimeRecords || [], bonusRecords || [],
//           advances || [], employeeIncentiveData || {}, employeeLopData
//         );
//       } catch (e) {
//         console.error(`Error calculating salary details for ${emp.employee_id}:`, e);
//         salaryDetails = null;
//       }

//       if (!salaryDetails) {
//         return Array(23).fill('N/A'); // Fallback row
//       }

//       // Local bonus calculation for monthly (override if needed)
//       const monthlyBonusPay = calculateMonthlyBonusPay(emp.ctc, bonusRecords);

//       const lopData = employeeLopData[emp.employee_id] || {
//         currentMonth: { days: 0, value: '0.00', currency: 'INR' },
//       };
//       // Use yearly LOP to match DetailsTab
//       const lopDays = parseFloat(lopData.yearly?.days || 0);
//       const lopDeduction = parseFloat(lopData.yearly?.value || '0.00');

//       const { localGross, localNet } = calculateLocalGrossNet(salaryDetails, monthlyBonusPay, lopDeduction, emp.plan_data);

//       return [
//         emp.employee_id, emp.full_name,
//         emp.ctc ? parseFloat(emp.ctc) : 0,
//         salaryDetails.basicSalary || 0, salaryDetails.hra || 0, salaryDetails.ltaAllowance || 0, salaryDetails.otherAllowances || 0,
//         salaryDetails.incentivePay || 0, salaryDetails.overtimePay || 0, salaryDetails.statutoryBonus || 0, monthlyBonusPay,  // Use local bonus
//         salaryDetails.advanceRecovery || 0, salaryDetails.employeePF || 0,
//         salaryDetails.employerPF || 0,
//         salaryDetails.esic || 0, salaryDetails.gratuity || 0, salaryDetails.professionalTax || 0, salaryDetails.tds || 0, salaryDetails.insurance || 0,
//         lopDays,  // LOP Days: Yearly to match DetailsTab
//         lopDeduction,  // LOP Value: Yearly to match DetailsTab
//         localGross,
//         localNet > 0 ? localNet : 0  // Local Net: Matches DetailsTab
//       ];
//     });

//     const headers = [
//       'ID', 'Name', 'Annual CTC', 'Basic Salary', 'HRA', 'LTA', 'Other Allowances',
//       'Incentives', 'Overtime', 'Statutory Bonus', 'Bonus', 'Advance Recovery',
//       'Employee PF', 'Employer PF', 'ESIC', 'Gratuity', 'Professional Tax',
//       'TDS', 'Insurance', 'LOP Days', 'LOP Deduction', 'Gross Salary', 'Net Salary'
//     ];

//     const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
//     ws['!cols'] = [
//       { wch: 8 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 8 },
//       { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
//       { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
//       { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
//     ];
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Salary Details");
//     XLSX.writeFile(wb, 'salary-details.xlsx');
//   };

//   const generateBankReportData = (selectedData) => {
//     const rows = selectedData.map((emp) => {
//       let salaryDetails;
//       try {
//         salaryDetails = calculateSalaryDetails(
//           emp.ctc, emp.plan_data, emp.employee_id, overtimeRecords || [], bonusRecords || [],
//           advances || [], employeeIncentiveData || {}, employeeLopData
//         );
//       } catch (e) {
//         console.error(`Error calculating salary details for ${emp.employee_id}:`, e);
//         salaryDetails = null;
//       }

//       if (!salaryDetails) {
//         return { row: Array(5).fill('N/A'), netSalary: 0 };
//       }

//       // Local bonus and LOP
//       const monthlyBonusPay = calculateMonthlyBonusPay(emp.ctc, bonusRecords);
//       const lopData = employeeLopData[emp.employee_id] || {
//         currentMonth: { days: 0, value: '0.00', currency: 'INR' },
//       };
//       const lopDeduction = parseFloat(lopData.yearly?.value || '0.00');

//       const { localNet } = calculateLocalGrossNet(salaryDetails, monthlyBonusPay, lopDeduction, emp.plan_data);
//       const netSalary = localNet > 0 ? localNet : 0;

//       const personalDetails = personalMap[emp.employee_id] || { pan_number: 'N/A', uan_number: 'N/A' };
//       return {
//         row: [
//           emp.employee_id,
//           emp.full_name,
//           personalDetails.pan_number,
//           personalDetails.uan_number,
//           netSalary > 0 ? `₹${netSalary.toLocaleString()}` : 'N/A'
//         ],
//         netSalary
//       };
//     });

//     const headers = ['ID', 'Name', 'PAN Number', 'UAN Number', 'Net Payable'];
//     return { headers, rows };
//   };

//   const downloadBankReportExcel = () => {
//     const selectedData = getSelectedEmployees();
//     if (selectedData.length === 0) return;
//     const { headers, rows } = generateBankReportData(selectedData);
//     const ws = XLSX.utils.aoa_to_sheet([headers, ...rows.map(r => r.row)]);
//     ws['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Bank Report");
//     XLSX.writeFile(wb, 'bank-report.xlsx');
//   };

//   const downloadBankReportPDF = () => {
//     const selectedData = getSelectedEmployees();
//     if (selectedData.length === 0) return;
//     const { headers, rows } = generateBankReportData(selectedData);
//     // Clean net salary values: remove rupee symbol and corrupted characters
//     const cleanedRows = rows.map(r => {
//       const formattedRow = r.row.map((cell, idx) => {
//         if (idx === 4) { // Net Salary column index
//           if (typeof cell === "string") {
//             // Remove corrupted characters and rupee symbol, keep only the number or N/A
//             let cleanValue = cell
//               .replace(/₹/g, "") // remove ₹ if exists
//               .replace(/¹/g, "") // remove corrupted symbol
//               .trim();
//             return cleanValue; // Return without rupee symbol
//           }
//         }
//         return cell;
//       });
//       return { row: formattedRow };
//     });
//     const doc = new jsPDF("portrait");
//     let y = 20;
//     doc.setFontSize(16);
//     doc.text("Bank Report", 105, y, { align: "center" });
//     y += 10;
//     doc.setFontSize(10);
//     doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, y);
//     doc.text(`Total Selected: ${selectedData.length}`, 190, y, { align: "right" });
//     y += 14;
//     autoTable(doc, {
//       head: [headers],
//       body: cleanedRows.map(r => r.row),
//       startY: y,
//       theme: "grid",
//       styles: {
//         fontSize: 8,
//         cellPadding: 2,
//         overflow: "linebreak",
//         halign: "center",
//         valign: "middle",
//       },
//       headStyles: {
//         fillColor: [248, 249, 250],
//         textColor: [73, 80, 87],
//         fontStyle: "bold",
//       },
//       columnStyles: {
//         0: { halign: "center", cellWidth: 20 }, // ID
//         1: { halign: "left", cellWidth: 60 }, // Name
//         2: { halign: "center", cellWidth: 30 }, // PAN Number
//         3: { halign: "center", cellWidth: 30 }, // UAN Number
//         4: { halign: "right", cellWidth: 40 }, // Net Payable (increased width to prevent overflow)
//       },
//       margin: { top: y },
//     });
//     doc.save(`bank-report-${new Date().toISOString().split("T")[0]}.pdf`);
//   };

//   const handleDownloadBankReport = async (format) => {
//     if (!hasValidCredentials()) {
//       showAlert("Missing credentials. Please log in again.");
//       return;
//     }
//     const selectedData = getSelectedEmployees();
//     if (selectedData.length === 0) {
//       showAlert('No employees selected.');
//       return;
//     }
//     try {
//       const employeeIds = selectedData.map(emp => emp.employee_id);
//       const personalRes = await axios.post(
//         `${BASE_URL}/api/compensation/employee-personal-details`,
//         { employeeIds },
//         { headers: requestHeaders }
//       );
//       setPersonalMap(personalRes.data.data || {});
//       if (format === 'excel') await downloadBankReportExcel();
//       else if (format === 'pdf') await downloadBankReportPDF();
//       else if (format === 'both') { await downloadBankReportExcel(); await downloadBankReportPDF(); }
//       setShowBankReportOptions(false);
//       setShowPreviewModal(false);
//     } catch (error) {
//       console.error('Error fetching personal details for bank report:', error);
//       if (error.response?.status === 400 || error.response?.status === 401) {
//         showAlert('Authentication failed. Please log in again.');
//       } else {
//         showAlert('Failed to fetch employee details for bank report');
//       }
//     }
//   };

//   const handleDownloadSelected = () => {
//     const selectedData = getSelectedEmployees();
//     downloadExcel(selectedData);
//     setShowPreviewModal(false);
//   };

//   const getAbbrevMonth = (date) => {
//     const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
//     return months[date.getMonth()];
//   };

//   const handleSaveData = async () => {
//     if (!hasValidCredentials()) {
//       showAlert("Missing credentials. Please log in again.");
//       return;
//     }
//     try {
//       const selectedData = getSelectedEmployees();
//       if (selectedData.length === 0) {
//         showAlert('No employees selected.');
//         return;
//       }

//       const currentDate = new Date();
//       const currentYear = currentDate.getFullYear();
//       const currentMonthAbbrev = getAbbrevMonth(currentDate);
//       const currentMonthNum = currentDate.getMonth() + 1;
//       const currentMonthStr = String(currentMonthNum).padStart(2, '0');

//       const fullSalaryData = selectedData.map((emp) => {
//         try {
//           let salaryDetails;
//           try {
//             salaryDetails = calculateSalaryDetails(
//               emp.ctc, emp.plan_data, emp.employee_id, overtimeRecords || [], bonusRecords || [],
//               advances || [], employeeIncentiveData || {}, employeeLopData
//             );
//           } catch (calcError) {
//             console.error(`Error calculating salary details for ${emp.employee_id}:`, calcError);
//             salaryDetails = null;
//           }

//           if (!salaryDetails) {
//             return null;
//           }

//           // Local bonus calculation for monthly (override if needed)
//           const monthlyBonusPay = calculateMonthlyBonusPay(emp.ctc, bonusRecords);

//           const lopData = employeeLopData[emp.employee_id] || {
//             currentMonth: { days: 0, value: '0.00', currency: 'INR' },
//           };
//           // Use yearly LOP to match DetailsTab
//           const lopDays = parseFloat(lopData.yearly?.days || 0);
//           const lopDeduction = parseFloat(lopData.yearly?.value || '0.00');

//           const { localGross, localNet } = calculateLocalGrossNet(salaryDetails, monthlyBonusPay, lopDeduction, emp.plan_data);

//           return {
//             employee_id: emp.employee_id,
//             full_name: emp.full_name,
//             annual_ctc: emp.ctc,
//             basic_salary: salaryDetails.basicSalary || 0,
//             hra: salaryDetails.hra || 0,
//             lta: salaryDetails.ltaAllowance || 0,
//             other_allowances: salaryDetails.otherAllowances || 0,
//             incentives: salaryDetails.incentivePay || 0,
//             overtime: salaryDetails.overtimePay || 0,
//             statutory_bonus: salaryDetails.statutoryBonus || 0,
//             bonus: monthlyBonusPay,  // Use local bonus
//             advance_recovery: salaryDetails.advanceRecovery || 0,
//             employee_pf: salaryDetails.employeePF || 0,
//             employer_pf: salaryDetails.employerPF || 0,
//             esic: salaryDetails.esic || 0,
//             gratuity: salaryDetails.gratuity || 0,
//             professional_tax: salaryDetails.professionalTax || 0,
//             income_tax: salaryDetails.tds || 0,
//             insurance: salaryDetails.insurance || 0,
//             lop_days: lopDays,  // LOP Days: Yearly to match DetailsTab
//             lop_deduction: lopDeduction,  // LOP Value: Yearly to match DetailsTab
//             gross_salary: localGross,
//             net_salary: localNet > 0 ? localNet : 0,  // Local Net: Matches DetailsTab
//             status: 'Approved',
//             payslip_generation: 'disabled'
//           };
//         } catch (empError) {
//           console.error(`Error processing employee ${emp.employee_id} for save:`, empError);
//           return null;
//         }
//       }).filter(data => data !== null);

//       if (fullSalaryData.length === 0) {
//         showAlert('Failed to generate salary data for any selected employees. Check console for errors.');
//         return;
//       }

//       const response = await axios.post(
//         `${BASE_URL}/api/salary-details/save`,
//         { salaryData: fullSalaryData, month: currentMonthAbbrev, year: currentYear },
//         { headers: requestHeaders }
//       );

//       if (response.data.success) {
//         showAlert(`Data saved successfully in table: ${response.data.tableName} (${response.data.rowsInserted} rows)`);

//         // Refetch approved IDs
//         const approvedRes = await axios.get(`${BASE_URL}/api/salary-details/approved-ids`, { headers: requestHeaders });
//         const newApprovedIds = approvedRes.data.approvedIds || [];
//         setApprovedIds(newApprovedIds);

//         // Deselect approved employees
//         setSelectedEmployees(prev => {
//           const newSet = new Set(prev);
//           newApprovedIds.forEach(id => newSet.delete(String(id)));
//           return newSet;
//         });
//       } else {
//         showAlert(`Error: ${response.data.error}`);
//       }
//     } catch (error) {
//       console.error("Save error:", error);
//       if (error.response?.status === 400 || error.response?.status === 401) {
//         showAlert(`Authentication failed: ${error.response?.data?.error || 'Please log in again.'}`);
//       } else {
//         showAlert(`Failed to save data: ${error.response?.data?.error || error.message}`);
//       }
//     }
//     setShowPreviewModal(false);
//   };

//   const renderTableRows = (employeesToRender) => {
//     return (
//       <tbody className="sd-table-body">
//         {employeesToRender.map((emp) => {
//           let salaryDetails;
//           try {
//             salaryDetails = calculateSalaryDetails(
//               emp.ctc, emp.plan_data, emp.employee_id, overtimeRecords || [], bonusRecords || [],
//               advances || [], employeeIncentiveData || {}, employeeLopData
//             );
//           } catch (e) {
//             console.error(`Error calculating salary details for ${emp.employee_id}:`, e);
//             salaryDetails = null;
//           }

//           if (!salaryDetails) {
//             // Fallback row with N/A
//             return (
//               <tr key={emp.employee_id} className={isApproved(emp.employee_id) ? "sd-row-disabled" : ""}>
//                 <td className="sd-table-cell sd-align-center sd-select-column sd-sticky-col sd-sticky-checkbox" style={{ left: 0, borderRight: '1px solid #dee2e6', zIndex: 10 }}>
//                   <input type="checkbox" checked={false} disabled={true} />
//                 </td>
//                 <td className="sd-table-cell sd-align-left sd-id-column sd-sticky-col sd-sticky-id" style={{ left: '40px', borderRight: '1px solid #dee2e6', zIndex: 10 }}>{emp.employee_id}</td>
//                 <td className="sd-table-cell sd-align-left sd-name-column sd-sticky-col sd-sticky-name" style={{ left: '110px', borderRight: '1px solid #dee2e6', zIndex: 10 }}>{emp.full_name}</td>
//                 <td className="sd-table-cell sd-align-right sd-sticky-col sd-sticky-ctc" style={{ left: '260px', borderRight: '1px solid #dee2e6', zIndex: 10 }}>{emp.ctc ? `₹${parseFloat(emp.ctc).toLocaleString()}` : 'N/A'}</td>
//                 {Array(20).fill().map((_, i) => <td key={i} className="sd-table-cell sd-align-right">N/A</td>)}
//               </tr>
//             );
//           }

//           // Local bonus calculation for monthly (override if needed)
//           const monthlyBonusPay = calculateMonthlyBonusPay(emp.ctc, bonusRecords);

//           const lopData = employeeLopData[emp.employee_id] || {
//             currentMonth: { days: 0, value: '0.00', currency: 'INR' },
//           };
//           // Use yearly LOP to match DetailsTab
//           const lopDays = parseFloat(lopData.yearly?.days || 0);
//           const lopDeduction = parseFloat(lopData.yearly?.value || '0.00');
//           const isSelected = selectedEmployees.has(emp.employee_id);

//           const { localGross, localNet } = calculateLocalGrossNet(salaryDetails, monthlyBonusPay, lopDeduction, emp.plan_data);

//           return (
//             <tr
//               key={emp.employee_id}
//               className={isApproved(emp.employee_id) ? "sd-row-disabled" : ""}
//             >
//               <td className="sd-table-cell sd-align-center sd-select-column sd-sticky-col sd-sticky-checkbox" style={{ left: 0, borderRight: '1px solid #dee2e6', zIndex: 10 }}>
//                 <input
//                   type="checkbox"
//                   checked={isSelected}
//                   disabled={isApproved(emp.employee_id)}
//                   onChange={() => handleRowSelect(emp.employee_id)}
//                 />
//               </td>
//               <td className="sd-table-cell sd-align-left sd-id-column sd-sticky-col sd-sticky-id" style={{ left: '40px', borderRight: '1px solid #dee2e6', zIndex: 10 }}>
//                 {emp.employee_id}
//               </td>
//               <td className="sd-table-cell sd-align-left sd-name-column sd-sticky-col sd-sticky-name" style={{ left: '110px', borderRight: '1px solid #dee2e6', zIndex: 10 }}>
//                 {emp.full_name}
//               </td>
//               <td className="sd-table-cell sd-align-right sd-sticky-col sd-sticky-ctc" style={{ left: '260px', borderRight: '1px solid #dee2e6', zIndex: 10 }}>
//                 {emp.ctc ? `₹${parseFloat(emp.ctc).toLocaleString()}` : 'N/A'}
//               </td>
//               <td className="sd-table-cell sd-align-right">{salaryDetails.basicSalary > 0 ? `₹${salaryDetails.basicSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right">{salaryDetails.hra > 0 ? `₹${salaryDetails.hra.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right">{salaryDetails.ltaAllowance > 0 ? `₹${salaryDetails.ltaAllowance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right">{salaryDetails.otherAllowances > 0 ? `₹${salaryDetails.otherAllowances.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right">{salaryDetails.incentivePay > 0 ? `₹${salaryDetails.incentivePay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right">{salaryDetails.overtimePay > 0 ? `₹${salaryDetails.overtimePay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right">{salaryDetails.statutoryBonus > 0 ? `₹${salaryDetails.statutoryBonus.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right">{monthlyBonusPay > 0 ? `₹${monthlyBonusPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>  {/* Local Bonus: Monthly Accurate */}
//               <td className="sd-table-cell sd-align-right sd-deduction">{salaryDetails.advanceRecovery > 0 ? `₹${salaryDetails.advanceRecovery.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right sd-deduction">{salaryDetails.employeePF > 0 ? `₹${salaryDetails.employeePF.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right sd-deduction">{salaryDetails.employerPF > 0 ? `₹${salaryDetails.employerPF.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right sd-deduction">{salaryDetails.esic > 0 ? `₹${salaryDetails.esic.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right sd-deduction">{salaryDetails.gratuity > 0 ? `₹${salaryDetails.gratuity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right sd-deduction">{salaryDetails.professionalTax > 0 ? `₹${salaryDetails.professionalTax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right sd-deduction">{salaryDetails.tds > 0 ? `₹${salaryDetails.tds.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right sd-deduction">{salaryDetails.insurance > 0 ? `₹${salaryDetails.insurance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right sd-deduction">{lopDays > 0 ? lopDays.toFixed(0) : 'N/A'}</td>  {/* LOP Days: Yearly to match DetailsTab */}
//               <td className="sd-table-cell sd-align-right sd-deduction">{lopDeduction > 0 ? `₹${lopDeduction.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>  {/* LOP Value: Yearly to match DetailsTab */}
//               <td className="sd-table-cell sd-align-right">{localGross > 0 ? `₹${localGross.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>
//               <td className="sd-table-cell sd-align-right">{localNet > 0 ? `₹${localNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</td>  {/* Local Net: Matches DetailsTab */}
//             </tr>
//           );
//         })}
//       </tbody>
//     );
//   };

//   const renderPreviewTableRows = (employeesToRender) => {
//     return (
//       <tbody>
//         {employeesToRender.map((emp) => {
//           let salaryDetails;
//           try {
//             salaryDetails = calculateSalaryDetails(
//               emp.ctc, emp.plan_data, emp.employee_id, overtimeRecords || [], bonusRecords || [],
//               advances || [], employeeIncentiveData || {}, employeeLopData
//             );
//           } catch (e) {
//             console.error(`Error calculating salary details for ${emp.employee_id}:`, e);
//             salaryDetails = null;
//           }

//           if (!salaryDetails) {
//             return (
//               <tr key={emp.employee_id}>
//                 <td className="sd-preview-table-cell">N/A</td>
//                 <td className="sd-preview-table-cell">{emp.full_name}</td>
//                 <td className="sd-preview-table-cell">N/A</td>
//                 <td className="sd-preview-table-cell">N/A</td>
//                 <td className="sd-preview-table-cell sd-align-right">N/A</td>
//               </tr>
//             );
//           }

//           // Local bonus and LOP
//           const monthlyBonusPay = calculateMonthlyBonusPay(emp.ctc, bonusRecords);
//           const lopData = employeeLopData[emp.employee_id] || {
//             currentMonth: { days: 0, value: '0.00', currency: 'INR' },
//           };
//           const lopDeduction = parseFloat(lopData.yearly?.value || '0.00');

//           const { localNet } = calculateLocalGrossNet(salaryDetails, monthlyBonusPay, lopDeduction, emp.plan_data);
//           const netSalary = localNet > 0 ? localNet : 0;

//           return (
//             <tr key={emp.employee_id}>
//               <td className="sd-preview-table-cell">{emp.employee_id}</td>
//               <td className="sd-preview-table-cell">{emp.full_name}</td>
//               <td className="sd-preview-table-cell">{personalMap[emp.employee_id]?.pan_number || 'N/A'}</td>
//               <td className="sd-preview-table-cell">{personalMap[emp.employee_id]?.uan_number || 'N/A'}</td>
//               <td className="sd-preview-table-cell sd-align-right">
//                 {netSalary > 0 ? `₹${netSalary.toLocaleString()}` : 'N/A'}  {/* Local Net: Matches DetailsTab */}
//               </td>
//             </tr>
//           );
//         })}
//       </tbody>
//     );
//   };

//   if (isLoading) {
//     return <div className="sd-loading">Loading...</div>;
//   }

//   const selectedData = getSelectedEmployees();

//   return (
//     <div className="sd-container">
//       <div className="sd-header">
//         <div className="sd-header-title">Employee Salary Overview</div>
//       </div>
//       <div className="sd-info-bar">
//         <div className="sd-working-days">
//           Total Working Days: {workingDays !== null ? workingDays : 'N/A'}
//         </div>
//         <div className="sd-controls-right">
//           <div className="sd-search-container">
//             <input
//               type="text"
//               className="sd-search-input"
//               placeholder="Search by ID or Name"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//           <button 
//             className="sd-proceed-button" 
//             onClick={handleProceed}
//             disabled={!hasValidCredentials()}
//           >
//             Proceed to Report
//           </button>
//         </div>
//       </div>
//       {filteredEmployees.length > 0 ? (
//         <div className="sd-table-section">
//           <div className="sd-table-container">
//             <div className="sd-table-wrapper">
//               <table className="sd-table">
//                 <thead className="sd-table-head">
//                   <tr>
//                     <th className="sd-table-header sd-align-center sd-select-column sd-sticky-col sd-sticky-checkbox" style={{ left: 0, borderRight: '1px solid #dee2e6', zIndex: 13 }}>
//                       <input
//                         type="checkbox"
//                         checked={isAllSelected}
//                         onChange={handleSelectAll}
//                       />
//                     </th>
//                     <th className="sd-table-header sd-align-left sd-id-column sd-sticky-col sd-sticky-id" style={{ left: '40px', borderRight: '1px solid #dee2e6', zIndex: 13 }}>ID</th>
//                     <th className="sd-table-header sd-align-left sd-name-column sd-sticky-col sd-sticky-name" style={{ left: '110px', borderRight: '1px solid #dee2e6', zIndex: 13 }}>Name</th>
//                     <th className="sd-table-header sd-align-right sd-sticky-col sd-sticky-ctc" style={{ left: '260px', borderRight: '1px solid #dee2e6', zIndex: 13 }}>Annual CTC</th>
//                     <th className="sd-table-header sd-align-right">Basic Salary</th>
//                     <th className="sd-table-header sd-align-right">HRA</th>
//                     <th className="sd-table-header sd-align-right">LTA</th>
//                     <th className="sd-table-header sd-align-right">Other Allowances</th>
//                     <th className="sd-table-header sd-align-right">Incentives</th>
//                     <th className="sd-table-header sd-align-right">Overtime</th>
//                     <th className="sd-table-header sd-align-right">Statutory Bonus</th>
//                     <th className="sd-table-header sd-align-right">Bonus</th>
//                     <th className="sd-table-header sd-align-right sd-deduction">Advance Recovery</th>
//                     <th className="sd-table-header sd-align-right sd-deduction">Employee PF</th>
//                     <th className="sd-table-header sd-align-right sd-deduction">Employer PF</th>
//                     <th className="sd-table-header sd-align-right sd-deduction">ESIC</th>
//                     <th className="sd-table-header sd-align-right sd-deduction">Gratuity</th>
//                     <th className="sd-table-header sd-align-right sd-deduction">Professional Tax</th>
//                     <th className="sd-table-header sd-align-right sd-deduction">TDS</th>
//                     <th className="sd-table-header sd-align-right sd-deduction">Insurance</th>
//                     <th className="sd-table-header sd-align-right sd-deduction">LOP Days</th>
//                     <th className="sd-table-header sd-align-right sd-deduction">LOP Deduction</th>
//                     <th className="sd-table-header sd-align-right">Gross Salary</th>
//                     <th className="sd-table-header sd-align-right">Net Salary</th>
//                   </tr>
//                 </thead>
//                 {renderTableRows(filteredEmployees)}
//               </table>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <p className="sd-no-data">No employees found</p>
//       )}

//       {showPreviewModal && (
//         <div className="sd-preview-modal">
//           <div className="sd-preview-overlay" onClick={handleCloseModal}></div>
//           <div className="sd-preview-content">
//             <div className="sd-preview-header">
//               <h2>Selected Employees Salary Preview ({selectedData.length} selected)</h2>
//               <button className="sd-close-button" onClick={handleCloseModal}>×</button>
//             </div>
//             <div className="sd-preview-table-wrapper">
//               <table className="sd-preview-table">
//                 <thead>
//                   <tr>
//                     <th>ID</th>
//                     <th>Name</th>
//                     <th>PAN Number</th>
//                     <th>UAN Number</th>
//                     <th className="sd-align-right">Net Payable</th>
//                   </tr>
//                 </thead>
//                 {renderPreviewTableRows(selectedData)}
//               </table>
//             </div>
//             <div className="sd-preview-footer">
//               <button className="sd-download-button" onClick={handleDownloadSelected}>
//                 Generate Excel Sheet
//               </button>
//               <button 
//                 className="sd-save-button" 
//                 onClick={handleSaveData}
//                 disabled={!hasValidCredentials()}
//               >
//                 Save Data
//               </button>
//               <button
//                 className="sd-bank-button"
//                 onClick={() => setShowBankReportOptions(!showBankReportOptions)}
//                 disabled={!hasValidCredentials()}
//               >
//                 Generate Bank Report
//               </button>
//               {showBankReportOptions && (
//                 <div className="sd-bank-report-options">
//                   <button onClick={() => handleDownloadBankReport('excel')} disabled={!hasValidCredentials()}>
//                     Excel Only
//                   </button>
//                   <button onClick={() => handleDownloadBankReport('pdf')} disabled={!hasValidCredentials()}>
//                     PDF Only
//                   </button>
//                   <button onClick={() => handleDownloadBankReport('both')} disabled={!hasValidCredentials()}>
//                     Both Excel & PDF
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//        <Modal
//                         isVisible={alertModal.isVisible}
//                         onClose={closeAlert}
//                         buttons={[{ label: "OK", onClick: closeAlert }]}
//                       >
//                         <p>{alertModal.message}</p>
//                       </Modal>
//     </div>
    
//   );
// };

// export default SalaryDetails;