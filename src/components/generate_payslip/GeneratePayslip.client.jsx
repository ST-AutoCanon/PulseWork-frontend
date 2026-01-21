// "use client";

// import React, { useState, useEffect } from "react";
// import generatePayslipPDF from "../../utils/generatePayslipPDF";
// import "./generate_payslip.css";
// import Modal from "../Modal/Modal.client";
// import { useAuth } from "../../context/AuthProvider.client";

// export default function GeneratePayslip() {
//   const { user } = useAuth();

//   const orgId =
//     user?.orgId ??
//     user?.org_id ??
//     user?.raw?.org_id ??
//     user?.Org_id ??
//     user?.raw?.Org_id ??
//     null;

//   const meId = user?.employeeId ?? user?.id ?? null;

//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

//   const getHeaders = (extra = {}) => {
//     const base = {
//       "x-api-key": API_KEY,
//       "Content-Type": "application/json",
//       ...extra,
//     };

//     if (orgId) base["x-org-id"] = String(orgId);
//     if (meId) base["x-employee-id"] = String(meId);

//     return base;
//   };

//   const [showModal, setShowModal] = useState(false);
//   const [preview, setPreview] = useState(false);
//   const [pdfUrl, setPdfUrl] = useState(null);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);

//   const [employeeData, setEmployeeData] = useState([]);
//   const [filteredEmployeeData, setFilteredEmployeeData] = useState([]);
//   const [formEmployeeList, setFormEmployeeList] = useState([]);

//   const [editingEmployeeId, setEditingEmployeeId] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [viewDetailsModal, setViewDetailsModal] = useState({
//     isVisible: false,
//     employee: null,
//   });

//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [manualEmployeeId, setManualEmployeeId] = useState(false);

//   const initialFormData = {
//     employeeId: "PW-000001",
//     employeeName: "",
//     gender: "",
//     designation: "",
//     dateOfJoining: "",
//     accountNo: "",
//     workingDays: "",
//     leavesTaken: "",
//     uinNo: "",
//     panNumber: "",
//     esiNumber: "",
//     pfNumber: "",
//     basic: "",
//     hra: "",
//     otherAllowance: "",
//     pf: "",
//     esiInsurance: "",
//     professionalTax: "",
//     tds: "",
//   };

//   const [formData, setFormData] = useState(initialFormData);

//   const [alertModal, setAlertModal] = useState({
//     isVisible: false,
//     title: "",
//     message: "",
//   });

//   const showAlert = (message, title = "") =>
//     setAlertModal({ isVisible: true, title, message });
//   const closeAlert = () =>
//     setAlertModal({ isVisible: false, title: "", message: "" });

//   const handleViewDetails = (employee) => {
//     setViewDetailsModal({ isVisible: true, employee });
//   };

//   const closeViewDetails = () =>
//     setViewDetailsModal({ isVisible: false, employee: null });

//   useEffect(() => {
//     let mounted = true;

//     const fetchEmployeeData = async () => {
//       if (!orgId || !BACKEND_URL) return;

//       try {
//         const resp = await fetch(`${BACKEND_URL}/old-employee/list`, {
//           credentials: "include",
//           headers: getHeaders(),
//         });

//         if (!resp.ok) {
//           const text = await resp.text().catch(() => "");
//           throw new Error(text || `HTTP ${resp.status}`);
//         }

//         const data = await resp.json();
//         if (!mounted) return;

//         const list = Array.isArray(data) ? data : [];
//         setEmployeeData(list);
//         setFilteredEmployeeData(list);
//       } catch (err) {
//         console.error("Fetch payslip list error:", err);
//         showAlert(
//           "Failed to load payslip data: " + (err.message || err),
//           "Error"
//         );
//       }
//     };

//     fetchEmployeeData();

//     return () => {
//       mounted = false;
//     };
//   }, [BACKEND_URL, orgId]);

//   useEffect(() => {
//     let mounted = true;
//     if (!user?.orgId) {
//       console.warn("OrgId not available yet, skipping API call");
//       return;
//     }
//     const fetchFormEmployees = async () => {
//       if (!orgId || !BACKEND_URL) return;

//       try {
//         const resp = await fetch(`${BACKEND_URL}/payslip/employees`, {
//           credentials: "include",
//           headers: getHeaders(),
//         });

//         if (!resp.ok) {
//           const text = await resp.text().catch(() => "");
//           throw new Error(text || `HTTP ${resp.status}`);
//         }

//         const data = await resp.json();
//         if (!mounted) return;

//         let list = [];
//         if (Array.isArray(data)) list = data;
//         else if (Array.isArray(data.data)) list = data.data;
//         else if (Array.isArray(data.message?.data)) list = data.message.data;

//         const normalized = list.map((item) => ({
//           employee_id: item.employee_id || item.employeeId || "",
//           employee_name:
//             item.employee_name || item.employeeName || item.name || "",
//           gender: item.gender || "",
//           designation: item.position || item.designation || "",
//           department_name:
//             item.department_name ||
//             item.departmentName ||
//             item.department ||
//             "",
//           date_of_joining:
//             item.joining_date ||
//             item.date_of_joining ||
//             item.joiningDate ||
//             null,
//           account_no:
//             item.account_number || item.account_no || item.accountNo || "",
//           uin_no: item.uan_number || item.uan || item.uanNumber || "",
//           pan_number: item.pan_number || item.panNumber || "",
//           esi_number: item.esi_number || item.esiNumber || "",
//           pf_number: item.pf_number || item.pfNumber || "",
//           id: item.id || item.employee_id || null,
//         }));

//         setFormEmployeeList(normalized);
//       } catch (err) {
//         console.error("Employee dropdown fetch error:", err);
//         showAlert(
//           "Failed to load employee list for form: " + (err.message || err),
//           "Warning"
//         );
//       }
//     };

//     fetchFormEmployees();

//     return () => {
//       mounted = false;
//     };
//   }, [BACKEND_URL, orgId]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       const q = (searchQuery || "").trim().toLowerCase();
//       if (!q) {
//         setFilteredEmployeeData(employeeData);
//         return;
//       }
//       setFilteredEmployeeData(
//         employeeData.filter(
//           (emp) =>
//             (emp.employee_name || "").toLowerCase().includes(q) ||
//             (emp.employee_id || "").toLowerCase().includes(q)
//         )
//       );
//     }, 300);
//     return () => clearTimeout(timer);
//   }, [searchQuery, employeeData]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "employeeId") {
//       if (manualEmployeeId) {
//         setFormData((p) => ({ ...p, employeeId: value }));
//         return;
//       }

//       const selected = formEmployeeList.find(
//         (emp) => (emp.employee_id || emp.employeeId || "") === value
//       );

//       if (selected) {
//         setFormData((p) => ({
//           ...p,
//           employeeId: value,
//           employeeName: selected.employee_name || "",
//           gender: selected.gender || "",
//           designation:
//             (selected.position || selected.designation || "") +
//             (selected.department_name ? ` (${selected.department_name})` : ""),
//           dateOfJoining: selected.date_of_joining
//             ? selected.date_of_joining.split("T")[0]
//             : "",
//           accountNo: selected.account_no || "",
//           uinNo: selected.uin_no || "",
//           panNumber: selected.pan_number || "",
//           esiNumber: selected.esi_number || "",
//           pfNumber: selected.pf_number || "",
//         }));
//       } else {
//         setFormData((p) => ({ ...p, employeeId: value }));
//       }
//     } else if (name === "selectedMonth") {
//       setSelectedMonth(value);
//     } else if (name === "selectedYear") {
//       setSelectedYear(value);
//     } else if (name === "panNumber") {
//       setFormData((p) => ({ ...p, [name]: (value || "").toUpperCase() }));
//     } else {
//       setFormData((p) => ({ ...p, [name]: value }));
//     }
//   };

//   const handleSearchChange = (e) => setSearchQuery(e.target.value);

//   const calculateSummary = () => {
//     const earnings = [
//       parseFloat(formData.basic) || 0,
//       parseFloat(formData.hra) || 0,
//       parseFloat(formData.otherAllowance) || 0,
//     ];
//     const deductions = [
//       parseFloat(formData.pf) || 0,
//       parseFloat(formData.esiInsurance) || 0,
//       parseFloat(formData.professionalTax) || 0,
//       parseFloat(formData.tds) || 0,
//     ];
//     const grossEarnings = earnings.reduce((s, v) => s + v, 0);
//     const totalDeductions = deductions.reduce((s, v) => s + v, 0);
//     const netSalary = grossEarnings - totalDeductions;
//     return { grossEarnings, totalDeductions, netSalary };
//   };

//   const fieldLabels = {
//     employeeName: "Employee Name",
//     employeeId: "Employee ID",
//     gender: "Gender",
//     designation: "Designation",
//     dateOfJoining: "Date of Joining",
//     accountNo: "Account Number",
//     workingDays: "Working Days",
//     leavesTaken: "Leaves Taken",
//     uinNo: "UIN No",
//     panNumber: "PAN Number",
//     esiNumber: "ESI Number",
//     pfNumber: "PF Number",
//     basic: "Basic",
//     hra: "HRA",
//     otherAllowance: "Other Allowance",
//     pf: "PF",
//     esiInsurance: "ESI/Insurance",
//     professionalTax: "Professional Tax",
//     tds: "TDS",
//     grossEarnings: "Gross Earnings",
//     totalDeductions: "Total Deductions",
//     netSalary: "Net Salary",
//     selectedMonth: "Month",
//     selectedYear: "Year",
//   };

//   const validateForm = () => {
//     const requiredFields = [
//       "employeeName",
//       "employeeId",
//       "gender",
//       "designation",
//       "dateOfJoining",
//       "accountNo",
//       "workingDays",
//       "leavesTaken",
//       "uinNo",
//       "panNumber",
//       "basic",
//       "hra",
//       "otherAllowance",
//       "tds",
//     ];

//     for (const field of requiredFields) {
//       const val = (formData[field] || "").toString().trim();
//       if (!val) return `Please fill in ${fieldLabels[field] || field}`;
//     }

//     const datePattern = /^\d{4}-\d{2}-\d{2}$/;
//     if (formData.dateOfJoining && !datePattern.test(formData.dateOfJoining))
//       return "Date of Joining must be in YYYY-MM-DD format";

//     const date = new Date(formData.dateOfJoining);
//     if (formData.dateOfJoining && (isNaN(date.getTime()) || date > new Date()))
//       return "Please enter a valid Date of Joining in YYYY-MM-DD format";

//     const numericFields = [
//       "workingDays",
//       "leavesTaken",
//       "basic",
//       "hra",
//       "otherAllowance",
//       "pf",
//       "esiInsurance",
//       "professionalTax",
//       "tds",
//     ];
//     for (const field of numericFields) {
//       if (
//         formData[field] &&
//         (isNaN(parseFloat(formData[field])) || parseFloat(formData[field]) < 0)
//       )
//         return `${
//           fieldLabels[field] || field
//         } must be a valid non-negative number`;
//     }

//     const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
//     if (formData.panNumber && !panPattern.test(formData.panNumber))
//       return "PAN Number must be in the format AAAAA9999A (e.g., ABCDE1234F)";

//     if (!["Male", "Female"].includes(formData.gender))
//       return "Gender must be either Male or Female";

//     if (!selectedMonth || selectedMonth < 1 || selectedMonth > 12)
//       return "Please select a valid month (1-12)";
//     if (
//       !selectedYear ||
//       selectedYear < 1900 ||
//       selectedYear > new Date().getFullYear() + 1
//     )
//       return "Please select a valid year";

//     return null;
//   };

//   const prepareBackendData = () => {
//     const { grossEarnings, totalDeductions, netSalary } = calculateSummary();
//     return {
//       employee_name: formData.employeeName || "",
//       employee_id: formData.employeeId || "",
//       gender: formData.gender || "",
//       designation: formData.designation || "",
//       date_of_joining: formData.dateOfJoining || "",
//       account_no: formData.accountNo || "",
//       working_days: parseInt(formData.workingDays) || 0,
//       leaves_taken: parseInt(formData.leavesTaken) || 0,
//       uin_no: formData.uinNo || "",
//       pan_number: formData.panNumber || "",
//       esi_number: formData.esiNumber || "",
//       pf_number: formData.pfNumber || "",
//       basic: parseFloat(formData.basic) || 0,
//       hra: parseFloat(formData.hra) || 0,
//       other_allowance: parseFloat(formData.otherAllowance) || 0,
//       pf: parseFloat(formData.pf) || 0,
//       esi_insurance: parseFloat(formData.esiInsurance) || 0,
//       professional_tax: parseFloat(formData.professionalTax) || 0,
//       tds: parseFloat(formData.tds) || 0,
//       gross_earnings: grossEarnings || 0,
//       total_deductions: totalDeductions || 0,
//       net_salary: netSalary || 0,
//       month: parseInt(selectedMonth) || 0,
//       year: parseInt(selectedYear) || 0,
//     };
//   };

//   const preparePayslipData = () => {
//     const { grossEarnings, totalDeductions, netSalary } = calculateSummary();
//     return {
//       payrollData: {
//         employee_name: formData.employeeName || "Unknown",
//         employee_id: formData.employeeId || "PW-000001",
//         designation: formData.designation || "N/A",
//         joining_date:
//           formData.dateOfJoining || new Date().toISOString().split("T")[0],
//         uin_number: formData.uinNo || "N/A",
//         basic_salary: parseFloat(formData.basic) || 0,
//         hra: parseFloat(formData.hra) || 0,
//         allowance: parseFloat(formData.otherAllowance) || 0,
//         pf: parseFloat(formData.pf) || 0,
//         insurance: parseFloat(formData.esiInsurance) || 0,
//         pt: parseFloat(formData.professionalTax) || 0,
//         tds: parseFloat(formData.tds) || 0,
//         total_earnings: grossEarnings || 0,
//         total_deductions: totalDeductions || 0,
//         net_salary: netSalary || 0,
//         special_allowance: 0,
//         rnrbonus: 0,
//         advance_taken: 0,
//         advance_recovery: 0,
//         salary_advance: 0,
//       },
//       selectedDate: {
//         month: parseInt(selectedMonth) || 1,
//         year: parseInt(selectedYear) || new Date().getFullYear(),
//       },
//       bankDetails: {
//         account_number: formData.accountNo || "N/A",
//         bank_name: "",
//         esi_number: formData.esiNumber || "",
//         pf_number: formData.pfNumber || "",
//       },
//       attendance: {
//         total_working_days: parseInt(formData.workingDays) || 0,
//         leave_count: parseInt(formData.leavesTaken) || 0,
//       },
//       employeeDetails: {
//         gender: formData.gender || "N/A",
//         pan_number: formData.panNumber || "N/A",
//       },
//     };
//   };

//   const handleEdit = (employee) => {
//     setFormData({
//       employeeId: employee.employee_id || "PW-000001",
//       employeeName: employee.employee_name || "",
//       gender: employee.gender || "",
//       designation:
//         (employee.designation || employee.position || "") +
//         (employee.department_name ? ` (${employee.department_name})` : ""),
//       dateOfJoining: employee.date_of_joining
//         ? employee.date_of_joining.split("T")[0]
//         : "",
//       accountNo: employee.account_no || "",
//       workingDays: employee.working_days
//         ? employee.working_days.toString()
//         : "",
//       leavesTaken: employee.leaves_taken
//         ? employee.leaves_taken.toString()
//         : "",
//       uinNo: employee.uin_no || "",
//       panNumber: employee.pan_number || "",
//       esiNumber: employee.esi_number || "",
//       pfNumber: employee.pf_number || "",
//       basic: employee.basic ? employee.basic.toString() : "",
//       hra: employee.hra ? employee.hra.toString() : "",
//       otherAllowance: employee.other_allowance
//         ? employee.other_allowance.toString()
//         : "",
//       pf: employee.pf ? employee.pf.toString() : "",
//       esiInsurance: employee.esi_insurance
//         ? employee.esi_insurance.toString()
//         : "",
//       professionalTax: employee.professional_tax
//         ? employee.professional_tax.toString()
//         : "",
//       tds: employee.tds ? employee.tds.toString() : "",
//     });
//     setSelectedMonth(employee.month || new Date().getMonth() + 1);
//     setSelectedYear(employee.year || new Date().getFullYear());
//     setEditingEmployeeId(employee.id);
//     setShowModal(true);
//     setError(null);
//     setSuccess(null);
//   };

//   const handleSaveToBackend = async () => {
//     const validationError = validateForm();
//     if (validationError) {
//       setError(validationError);
//       showAlert(validationError, "Validation Error");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);
//     setSuccess(null);

//     const backendData = prepareBackendData();
//     const isEditing = !!editingEmployeeId;
//     const url = isEditing
//       ? `${BACKEND_URL}/old-employee/edit`
//       : `${BACKEND_URL}/old-employee/save`;
//     const method = isEditing ? "PUT" : "POST";

//     try {
//       const resp = await fetch(url, {
//         method,
//         credentials: "include",
//         headers: getHeaders(),
//         body: JSON.stringify(backendData),
//       });

//       if (!resp.ok) {
//         const txt = await resp.text().catch(() => "");
//         throw new Error(txt || `HTTP ${resp.status}`);
//       }

//       showAlert(
//         isEditing
//           ? "Payslip updated successfully!"
//           : "Payslip saved successfully!",
//         "Success"
//       );

//       const refreshed = await fetch(`${BACKEND_URL}/old-employee/list`, {
//         credentials: "include",
//         headers: getHeaders(),
//       });
//       if (refreshed.ok) {
//         const data = await refreshed.json();
//         const list = Array.isArray(data) ? data : [];
//         setEmployeeData(list);
//         setFilteredEmployeeData(list);
//       }

//       setShowModal(false);
//       setFormData(initialFormData);
//       setSelectedMonth(new Date().getMonth() + 1);
//       setSelectedYear(new Date().getFullYear());
//       setEditingEmployeeId(null);
//     } catch (err) {
//       console.error("Save error:", err);
//       showAlert(`Error saving payslip: ${err.message || err}`, "Error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePreview = async () => {
//     const validationError = validateForm();
//     if (validationError) {
//       setError(validationError);
//       showAlert(validationError, "Validation Error");
//       return;
//     }

//     setError(null);
//     const payslipData = preparePayslipData();

//     try {
//       const pdfBlob = await generatePayslipPDF(
//         payslipData.payrollData,
//         payslipData.selectedDate,
//         payslipData.bankDetails,
//         payslipData.attendance,
//         payslipData.employeeDetails,
//         false
//       );

//       const url = URL.createObjectURL(
//         pdfBlob instanceof Blob
//           ? pdfBlob
//           : new Blob([pdfBlob], { type: "application/pdf" })
//       );
//       setPdfUrl(url);
//       setPreview(true);
//       setShowModal(true);
//     } catch (err) {
//       console.error("Preview error:", err);
//       showAlert("Failed to generate preview: " + (err.message || err), "Error");
//     }
//   };

//   const handleDownloadPDF = async () => {
//     const validationError = validateForm();
//     if (validationError) {
//       showAlert(validationError, "Validation Error");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const payslipData = preparePayslipData();

//       const pdfBlob = await generatePayslipPDF(
//         payslipData.payrollData,
//         payslipData.selectedDate,
//         payslipData.bankDetails,
//         payslipData.attendance,
//         payslipData.employeeDetails,
//         false
//       );

//       const blob =
//         pdfBlob instanceof Blob
//           ? pdfBlob
//           : new Blob([pdfBlob], { type: "application/pdf" });

//       const url = window.URL.createObjectURL(blob);

//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `${formData.employeeId}_${selectedMonth}_${selectedYear}_Payslip.pdf`;
//       document.body.appendChild(a);
//       a.click();

//       a.remove();
//       window.URL.revokeObjectURL(url);

//       showAlert("Payslip downloaded successfully!", "Success");
//     } catch (err) {
//       console.error(err);
//       showAlert("Failed to download PDF: " + (err.message || err), "Error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDownloadForEmployee = async (employee) => {
//     setIsLoading(true);

//     try {
//       const payslipData = {
//         payrollData: {
//           employee_id: employee.employee_id,
//           employee_name: employee.employee_name,
//           designation: employee.designation,
//           basic_salary: employee.basic,
//           hra: employee.hra,
//           allowance: employee.other_allowance,
//           pf: employee.pf,
//           insurance: employee.esi_insurance,
//           pt: employee.professional_tax,
//           tds: employee.tds,
//           total_earnings: employee.gross_earnings,
//           total_deductions: employee.total_deductions,
//           net_salary: employee.net_salary,
//         },
//         selectedDate: {
//           month: employee.month || new Date().getMonth() + 1,
//           year: employee.year || new Date().getFullYear(),
//         },
//         bankDetails: {
//           account_number: employee.account_no,
//           esi_number: employee.esi_number,
//           pf_number: employee.pf_number,
//         },
//         attendance: {
//           total_working_days: employee.working_days,
//           leave_count: employee.leaves_taken,
//         },
//         employeeDetails: {
//           gender: employee.gender,
//           joining_date: employee.date_of_joining,
//           pan_number: employee.pan_number,
//           uin_number: employee.uin_no,
//         },
//       };

//       const pdfBlob = await generatePayslipPDF(
//         payslipData.payrollData,
//         payslipData.selectedDate,
//         payslipData.bankDetails,
//         payslipData.attendance,
//         payslipData.employeeDetails,
//         false
//       );

//       const blob =
//         pdfBlob instanceof Blob
//           ? pdfBlob
//           : new Blob([pdfBlob], { type: "application/pdf" });

//       const url = window.URL.createObjectURL(blob);

//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `${employee.employee_id}_${payslipData.selectedDate.month}_${payslipData.selectedDate.year}_Payslip.pdf`;

//       document.body.appendChild(a);
//       a.click();
//       a.remove();

//       window.URL.revokeObjectURL(url);

//       showAlert(`Payslip for ${employee.employee_name} downloaded!`, "Success");
//     } catch (err) {
//       console.error(err);
//       showAlert(`Download failed: ${err.message || err}`, "Error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     return () => {
//       if (pdfUrl) URL.revokeObjectURL(pdfUrl);
//     };
//   }, [pdfUrl]);

//   const detailFields = [
//     "accountNo",
//     "workingDays",
//     "leavesTaken",
//     "uinNo",
//     "panNumber",
//     "esiNumber",
//     "pfNumber",
//     "basic",
//     "hra",
//     "otherAllowance",
//     "pf",
//     "esiInsurance",
//     "professionalTax",
//     "tds",
//     "grossEarnings",
//     "totalDeductions",
//     "netSalary",
//   ];

//   const tableHeaders = [
//     "Employee Name",
//     "Employee ID",
//     "Gender",
//     "Designation",
//     "Date of Joining",
//     "Bank Details",
//     "Edit Data",
//     "Download",
//   ];

//   const fieldOrder = [
//     "employeeId",
//     "employeeName",
//     "gender",
//     "designation",
//     "dateOfJoining",
//     "accountNo",
//     "workingDays",
//     "leavesTaken",
//     "uinNo",
//     "panNumber",
//     "esiNumber",
//     "pfNumber",
//     "basic",
//     "hra",
//     "otherAllowance",
//     "pf",
//     "esiInsurance",
//     "professionalTax",
//     "tds",
//   ];

//   const fieldsForRows = fieldOrder.concat(["selectedMonth", "selectedYear"]);
//   const rows = [];
//   for (let i = 0; i < fieldsForRows.length; i += 3)
//     rows.push(fieldsForRows.slice(i, i + 3));

//   return (
//     <div className="generatePayslip-container">
//       <div className="generatePayslip-header">
//         <div className="generatePayslip-search-container">
//           <i className="fas fa-search generatePayslip-search-icon" />
//           <input
//             type="text"
//             className="generatePayslip-search-input"
//             placeholder="Search by name or employee ID"
//             value={searchQuery}
//             onChange={handleSearchChange}
//           />
//         </div>
//         <button
//           className="generatePayslip-create-btn"
//           onClick={() => {
//             setShowModal(true);
//             setPreview(false);
//             setError(null);
//             setSuccess(null);
//             setEditingEmployeeId(null);
//             setFormData(initialFormData);
//             setSelectedMonth(new Date().getMonth() + 1);
//             setSelectedYear(new Date().getFullYear());
//           }}
//         >
//           Create Payslip
//         </button>
//       </div>

//       <div className="generatePayslip-table-container">
//         <table className="generatePayslip-table">
//           <thead>
//             <tr>
//               {tableHeaders.map((h, i) => (
//                 <th key={i} className="generatePayslip-table-header">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {filteredEmployeeData.length === 0 ? (
//               <tr>
//                 <td
//                   colSpan={tableHeaders.length}
//                   style={{ textAlign: "center" }}
//                 >
//                   No payslip data found
//                 </td>
//               </tr>
//             ) : (
//               filteredEmployeeData.map((employee) => (
//                 <tr key={employee.id || employee.employee_id}>
//                   <td className="generatePayslip-table-cell">
//                     {employee.employee_name}
//                   </td>
//                   <td className="generatePayslip-table-cell">
//                     {employee.employee_id}
//                   </td>
//                   <td className="generatePayslip-table-cell">
//                     {employee.gender}
//                   </td>
//                   <td className="generatePayslip-table-cell">
//                     {(employee.designation || employee.position || "") +
//                       (employee.department_name
//                         ? ` (${employee.department_name})`
//                         : "")}
//                   </td>
//                   <td className="generatePayslip-table-cell">
//                     {(employee.date_of_joining || "").split("T")[0]}
//                   </td>
//                   <td className="generatePayslip-table-cell">
//                     <button
//                       className="generatePayslip-view-btn"
//                       onClick={() => handleViewDetails(employee)}
//                       title="View Bank Details"
//                     >
//                       <i className="fas fa-eye" />
//                     </button>
//                   </td>
//                   <td className="generatePayslip-table-cell">
//                     <button
//                       className="generatePayslip-edit-btn"
//                       onClick={() => handleEdit(employee)}
//                       title="Edit Payslip"
//                     >
//                       <i className="fas fa-pencil-alt" />
//                     </button>
//                   </td>
//                   <td className="generatePayslip-table-cell">
//                     <button
//                       className="generatePayslip-download-btn"
//                       onClick={() => handleDownloadForEmployee(employee)}
//                       title="Download Payslip PDF"
//                       disabled={isLoading}
//                     >
//                       <i className="fas fa-download" />
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {showModal && (
//         <div className="generatePayslip-popup-overlay">
//           <div className="generatePayslip-popup-box">
//             <button
//               className="generatePayslip-popup-close-btn"
//               onClick={() => {
//                 setShowModal(false);
//                 setPreview(false);
//                 setError(null);
//                 setSuccess(null);
//                 if (pdfUrl) {
//                   URL.revokeObjectURL(pdfUrl);
//                   setPdfUrl(null);
//                 }
//                 setEditingEmployeeId(null);
//               }}
//             >
//               ×
//             </button>

//             <h3 className="generatePayslip-popup-title">
//               {preview
//                 ? "Payslip Preview"
//                 : editingEmployeeId
//                 ? "Edit Payslip Details"
//                 : "Enter Payslip Details"}
//             </h3>

//             {error && <p className="generatePayslip-error">{error}</p>}
//             {success && <p className="generatePayslip-success">{success}</p>}

//             {preview ? (
//               <div className="generatePayslip-preview">
//                 {pdfUrl ? (
//                   <iframe
//                     src={pdfUrl}
//                     width="100%"
//                     height="500px"
//                     title="Payslip Preview"
//                     style={{ border: "none" }}
//                   />
//                 ) : (
//                   <p>Loading preview...</p>
//                 )}
//               </div>
//             ) : (
//               <div className="generatePayslip-popup-form">
//                 {rows.map((row, rowIndex) => (
//                   <div key={rowIndex} className="generatePayslip-form-row">
//                     {row.map((field) => (
//                       <div key={field} className="generatePayslip-form-group">
//                         <label
//                           htmlFor={field}
//                           className="generatePayslip-form-label"
//                         >
//                           {fieldLabels[field]}
//                           {[
//                             "employeeName",
//                             "employeeId",
//                             "gender",
//                             "designation",
//                             "dateOfJoining",
//                             "accountNo",
//                             "workingDays",
//                             "leavesTaken",
//                             "uinNo",
//                             "panNumber",
//                             "basic",
//                             "hra",
//                             "otherAllowance",
//                             "tds",
//                           ].includes(field) && (
//                             <span className="generatePayslip-required"> *</span>
//                           )}
//                         </label>

//                         {field === "employeeId" ? (
//                           <>
//                             {!manualEmployeeId ? (
//                               <select
//                                 id="employeeId"
//                                 name="employeeId"
//                                 value={formData.employeeId}
//                                 onChange={handleChange}
//                                 className="generatePayslip-popup-input"
//                               >
//                                 <option value="">Select Employee ID</option>
//                                 {formEmployeeList.map((emp) => (
//                                   <option
//                                     key={emp.employee_id || emp.id}
//                                     value={emp.employee_id || emp.employeeId}
//                                   >
//                                     {`${emp.employee_id || emp.employeeId} - ${
//                                       emp.employee_name || emp.name || ""
//                                     }`}
//                                   </option>
//                                 ))}
//                               </select>
//                             ) : (
//                               <input
//                                 type="text"
//                                 name="employeeId"
//                                 value={formData.employeeId}
//                                 onChange={handleChange}
//                                 className="generatePayslip-popup-input"
//                                 placeholder="Enter Employee ID manually"
//                               />
//                             )}

//                             <small
//                               style={{
//                                 cursor: "pointer",
//                                 color: "#007bff",
//                                 marginTop: "4px",
//                                 display: "inline-block",
//                               }}
//                               onClick={() => {
//                                 setManualEmployeeId((p) => !p);
//                                 setFormData((p) => ({
//                                   ...p,
//                                   employeeId: "",
//                                   employeeName: "",
//                                 }));
//                               }}
//                             >
//                               {manualEmployeeId
//                                 ? "Select from employee list"
//                                 : "Enter employee ID manually"}
//                             </small>
//                           </>
//                         ) : field === "selectedMonth" ? (
//                           <select
//                             id="selectedMonth"
//                             name="selectedMonth"
//                             value={selectedMonth}
//                             onChange={handleChange}
//                             className="generatePayslip-popup-input"
//                           >
//                             <option value="">Select Month</option>
//                             {[...Array(12)].map((_, i) => (
//                               <option key={i + 1} value={i + 1}>
//                                 {new Date(0, i).toLocaleString("default", {
//                                   month: "long",
//                                 })}
//                               </option>
//                             ))}
//                           </select>
//                         ) : field === "selectedYear" ? (
//                           <input
//                             type="number"
//                             id="selectedYear"
//                             name="selectedYear"
//                             value={selectedYear}
//                             onChange={handleChange}
//                             className="generatePayslip-popup-input"
//                             placeholder="Year"
//                           />
//                         ) : field === "gender" ? (
//                           <select
//                             id="gender"
//                             name="gender"
//                             value={formData.gender}
//                             onChange={handleChange}
//                             className="generatePayslip-popup-input"
//                           >
//                             <option value="">Select Gender</option>
//                             <option value="Male">Male</option>
//                             <option value="Female">Female</option>
//                           </select>
//                         ) : field === "panNumber" ? (
//                           <input
//                             id="panNumber"
//                             name="panNumber"
//                             value={formData.panNumber}
//                             onChange={handleChange}
//                             className="generatePayslip-popup-input"
//                             placeholder="ABCDE1234F"
//                             maxLength={10}
//                           />
//                         ) : (
//                           <input
//                             id={field}
//                             name={field}
//                             value={formData[field]}
//                             onChange={handleChange}
//                             className="generatePayslip-popup-input"
//                             type={
//                               [
//                                 "workingDays",
//                                 "leavesTaken",
//                                 "basic",
//                                 "hra",
//                                 "otherAllowance",
//                                 "pf",
//                                 "esiInsurance",
//                                 "professionalTax",
//                                 "tds",
//                               ].includes(field)
//                                 ? "number"
//                                 : field === "dateOfJoining"
//                                 ? "text"
//                                 : "text"
//                             }
//                             placeholder={
//                               field === "dateOfJoining"
//                                 ? "YYYY-MM-DD"
//                                 : undefined
//                             }
//                           />
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 ))}
//               </div>
//             )}

//             <div className="generatePayslip-form-buttons">
//               <button
//                 onClick={() => {
//                   setShowModal(false);
//                   setPreview(false);
//                   setError(null);
//                   setSuccess(null);
//                   if (pdfUrl) URL.revokeObjectURL(pdfUrl);
//                   setEditingEmployeeId(null);
//                 }}
//                 className="generatePayslip-cancel-btn"
//                 disabled={isLoading}
//               >
//                 Cancel
//               </button>

//               {preview ? (
//                 <>
//                   <button
//                     onClick={handleSaveToBackend}
//                     className="generatePayslip-save-btn"
//                     disabled={isLoading}
//                   >
//                     {isLoading ? "Saving..." : "Save to Database"}
//                   </button>
//                   <button
//                     onClick={handleDownloadPDF}
//                     className="generatePayslip-download-btn"
//                     disabled={isLoading}
//                   >
//                     {isLoading ? "Downloading..." : "Download PDF"}
//                   </button>
//                 </>
//               ) : (
//                 <>
//                   <button
//                     onClick={handleSaveToBackend}
//                     className="generatePayslip-save-btn"
//                     disabled={isLoading}
//                   >
//                     {isLoading
//                       ? "Saving..."
//                       : editingEmployeeId
//                       ? "Update"
//                       : "Save"}
//                   </button>
//                   <button
//                     onClick={handlePreview}
//                     className="generatePayslip-preview-btn"
//                     disabled={isLoading}
//                   >
//                     Preview PDF
//                   </button>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {viewDetailsModal.isVisible && viewDetailsModal.employee && (
//         <Modal
//           isVisible={viewDetailsModal.isVisible}
//           onClose={closeViewDetails}
//           buttons={[{ label: "Close", onClick: closeViewDetails }]}
//         >
//           <h3 className="generatePayslip-details-title">
//             Details for {viewDetailsModal.employee.employee_name}
//           </h3>
//           <div className="generatePayslip-details-container">
//             <table className="generatePayslip-details-table">
//               <thead>
//                 <tr>
//                   <th>Field</th>
//                   <th>Value</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {detailFields.map((field) => (
//                   <tr key={field}>
//                     <td>{fieldLabels[field]}</td>
//                     <td>
//                       {field === "accountNo" &&
//                         (viewDetailsModal.employee.account_no || "-")}
//                       {field === "workingDays" &&
//                         (viewDetailsModal.employee.working_days || 0)}
//                       {field === "leavesTaken" &&
//                         (viewDetailsModal.employee.leaves_taken || 0)}
//                       {field === "uinNo" &&
//                         (viewDetailsModal.employee.uin_no || "-")}
//                       {field === "panNumber" &&
//                         (viewDetailsModal.employee.pan_number || "-")}
//                       {field === "esiNumber" &&
//                         (viewDetailsModal.employee.esi_number || "-")}
//                       {field === "pfNumber" &&
//                         (viewDetailsModal.employee.pf_number || "-")}
//                       {field === "basic" &&
//                         (viewDetailsModal.employee.basic || 0)}
//                       {field === "hra" && (viewDetailsModal.employee.hra || 0)}
//                       {field === "otherAllowance" &&
//                         (viewDetailsModal.employee.other_allowance || 0)}
//                       {field === "pf" && (viewDetailsModal.employee.pf || 0)}
//                       {field === "esiInsurance" &&
//                         (viewDetailsModal.employee.esi_insurance || 0)}
//                       {field === "professionalTax" &&
//                         (viewDetailsModal.employee.professional_tax || 0)}
//                       {field === "tds" && (viewDetailsModal.employee.tds || 0)}
//                       {field === "grossEarnings" &&
//                         (viewDetailsModal.employee.gross_earnings || 0)}
//                       {field === "totalDeductions" &&
//                         (viewDetailsModal.employee.total_deductions || 0)}
//                       {field === "netSalary" &&
//                         (viewDetailsModal.employee.net_salary || 0)}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </Modal>
//       )}

//       <Modal
//         isVisible={alertModal.isVisible}
//         onClose={closeAlert}
//         buttons={[{ label: "OK", onClick: closeAlert }]}
//       >
//         <h3>{alertModal.title || "Alert"}</h3>
//         <p>{alertModal.message}</p>
//       </Modal>
//     </div>
//   );
// }
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import generatePayslipPDF from "../../utils/generatePayslipPDF";
import "./generate_payslip.css";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

export default function GeneratePayslip() {
  const { user } = useAuth();

  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.org_id ??
    user?.Org_id ??
    user?.raw?.Org_id ??
    null;

  const meId = user?.employeeId ?? user?.id ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

  const getHeaders = (extra = {}) => {
    const base = {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
      ...extra,
    };

    if (orgId) base["x-org-id"] = String(orgId);
    if (meId) base["x-employee-id"] = String(meId);

    return base;
  };

  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [employeeData, setEmployeeData] = useState([]);
  const [filteredEmployeeData, setFilteredEmployeeData] = useState([]);
  const [formEmployeeList, setFormEmployeeList] = useState([]);

  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDetailsModal, setViewDetailsModal] = useState({
    isVisible: false,
    employee: null,
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [manualEmployeeId, setManualEmployeeId] = useState(false);

  const initialFormData = {
    employeeId: "PW-000001",
    employeeName: "",
    gender: "",
    designation: "",
    dateOfJoining: "",
    accountNo: "",
    workingDays: "",
    leavesTaken: "",
    uinNo: "",
    panNumber: "",
    esiNumber: "",
    pfNumber: "",
    basic: "",
    hra: "",
    otherAllowance: "",
    pf: "",
    esiInsurance: "",
    professionalTax: "",
    tds: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const handleViewDetails = (employee) => {
    setViewDetailsModal({ isVisible: true, employee });
  };

  const closeViewDetails = () =>
    setViewDetailsModal({ isVisible: false, employee: null });

  // Template states (data URLs)
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

  const protectedImgCache = new Map();

  const normalizeUploadUrl = (src) => {
    if (!src) return src;
    if (src.startsWith("blob:") || src.startsWith("data:")) return src;
    const backend = BACKEND_URL.replace(/\/$/, "");
    if (src.startsWith("/api/")) return backend + src;
    return src;
  };

  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const fetchProtectedImageDataUrl = async (src) => {
    if (!src) return null;
    if (src.startsWith("data:")) return src;

    const normalized = normalizeUploadUrl(src);
    if (protectedImgCache.has(normalized)) return protectedImgCache.get(normalized);

    try {
      const res = await axios.get(normalized, {
        responseType: "blob",
        headers: getHeaders(),
        withCredentials: true,
      });
      const dataUrl = await blobToDataUrl(res.data);
      protectedImgCache.set(normalized, dataUrl);
      return dataUrl;
    } catch (err) {
      console.warn("Image fetch failed:", err);
      return null;
    }
  };

  const replaceUploadUrlsInHtml = async (html = "") => {
    if (!html || typeof html !== "string") return html;
    const uploadRegex = /\/api\/orgs\/\d+\/uploads\/[A-Za-z0-9._-]+/g;
    const matches = html.match(uploadRegex);
    if (!matches || matches.length === 0) return html;

    const unique = Array.from(new Set(matches));
    const replacements = {};

    await Promise.all(
      unique.map(async (m) => {
        const dataUrl = await fetchProtectedImageDataUrl(m);
        replacements[m] = dataUrl || m;
      })
    );

    let out = html;
    Object.keys(replacements).forEach((orig) => {
      const safe = orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(safe, "g"), replacements[orig]);
    });
    return out;
  };

  const ensurePercent = (v, defaultVal = "50%") => {
    if (!v) return defaultVal;
    if (typeof v === "number") return `${v}%`;
    const str = String(v).trim();
    return str.endsWith("%") ? str : `${str}%`;
  };

  // Fetch selected salary template
  useEffect(() => {
    const fetchSelectedTemplate = async () => {
      if (!orgId) return;

      try {
        const prefsRes = await axios.get(`${BACKEND_URL}/api/salary-preferences`, {
          headers: getHeaders(),
          withCredentials: true,
        });

        const selectedId = prefsRes.data?.data?.[0]?.selected_template_id;
        if (!selectedId) return;

        const templatesRes = await axios.get(`${BACKEND_URL}/api/orgs/${orgId}/templates`, {
          headers: getHeaders(),
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
          headerSrc = grapes.headerUrl || grapes.header_url;
          footerSrc = grapes.footerUrl || grapes.footer_url;
          if (grapes.watermark?.url) {
            wmUrl = grapes.watermark.url;
            wp = {
              xPct: ensurePercent(grapes.watermark.xPct || "50%"),
              yPct: ensurePercent(grapes.watermark.yPct || "50%"),
              wPct: ensurePercent(grapes.watermark.wPct || "60%"),
              hPct: ensurePercent(grapes.watermark.hPct || "60%"),
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
      } catch (err) {
        console.error("TEMPLATE FETCH ERROR:", err);
      }
    };

    fetchSelectedTemplate();
  }, [orgId]);

  // Build data table HTML
  const buildDataTableHtml = (data) => {
    const {
      employeeName = "N/A",
      employeeId = "N/A",
      designation = "N/A",
      dateOfJoining = "N/A",
      accountNo = "N/A",
      bankName = "N/A",
      workingDays = 30,
      leavesTaken = 0,
      uinNo = "N/A",
      panNumber = "N/A",
      esiNumber = "N/A",
      pfNumber = "N/A",
      basic = 0,
      hra = 0,
      otherAllowance = 0,
      bonus = 0,
      pf = 0,
      esiInsurance = 0,
      professionalTax = 0,
      tds = 0,
      insurance = 0,
      advanceRecovery = 0,
      lopDeduction = 0,
      grossEarnings = 0,
      totalDeductions = 0,
      netSalary = 0,
      monthYear = "",
      netSalaryWords = "Zero Only",
    } = data;

    return `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; margin-bottom: 25px;">
        <div style="padding: 8px 0; text-align: center; font-weight: bold; font-size: 13px; color: #1a3c6d; margin-bottom: 12px;">
          EMPLOYEE DETAILS - ${monthYear.toUpperCase()}
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 20px;">
          <div style="flex: 1; min-width: 48%; box-sizing: border-box;">
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Employee Name:</strong>
              ${employeeName.toUpperCase()}
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Employee ID:</strong>
              ${employeeId}
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Designation:</strong>
              ${designation.toUpperCase() || "N/A"}
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">PF No:</strong>
              ${pfNumber || "N/A"}
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">ESI No:</strong>
              ${esiNumber || "N/A"}
            </div>
          </div>

          <div style="flex: 1; min-width: 48%; box-sizing: border-box;">
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">PAN:</strong>
              ${panNumber || "N/A"}
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">UAN:</strong>
              ${uinNo || "N/A"}
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Bank Name:</strong>
              ${bankName || "N/A"}
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Account No:</strong>
              ${accountNo || "N/A"}
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="display: inline-block; width: 130px; color: #333;">Working Days:</strong>
              ${workingDays}
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
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${parseFloat(basic).toFixed(2)}</td>
            <td style="border: 1px solid #000; padding: 8px;">PF</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${parseFloat(pf).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px;">HRA</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${parseFloat(hra).toFixed(2)}</td>
            <td style="border: 1px solid #000; padding: 8px;">ESIC</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${parseFloat(esiInsurance).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px;">Other Allowances</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${parseFloat(otherAllowance).toFixed(2)}</td>
            <td style="border: 1px solid #000; padding: 8px;">Professional Tax</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${parseFloat(professionalTax).toFixed(2)}</td>
          </tr>
          ${bonus > 0 ? `
          <tr>
            <td style="border: 1px solid #000; padding: 8px;">Bonus</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${parseFloat(bonus).toFixed(2)}</td>
            <td></td>
            <td></td>
          </tr>` : ""}
          <tr>
            <td style="border: 1px solid #000; padding: 8px;"><strong>Gross Salary</strong></td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${grossEarnings.toFixed(2)}</strong></td>
            <td style="border: 1px solid #000; padding: 8px;">TDS</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${parseFloat(tds).toFixed(2)}</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td style="border: 1px solid #000; padding: 8px;">Insurance</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${parseFloat(insurance).toFixed(2)}</td>
          </tr>
          ${advanceRecovery > 0 ? `
          <tr>
            <td></td>
            <td></td>
            <td style="border: 1px solid #000; padding: 8px;">Advance Recovery</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${parseFloat(advanceRecovery).toFixed(2)}</td>
          </tr>` : ""}
          ${lopDeduction > 0 ? `
          <tr>
            <td></td>
            <td></td>
            <td style="border: 1px solid #000; padding: 8px;">LOP Deduction</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;">${parseFloat(lopDeduction).toFixed(2)}</td>
          </tr>` : ""}
          <tr style="background-color: #f0f0f0;">
            <td></td>
            <td></td>
            <td style="border: 1px solid #000; padding: 8px;"><strong>Total Deductions</strong></td>
            <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${totalDeductions.toFixed(2)}</strong></td>
          </tr>
          <tr style="background-color: #e0e0e0; font-size: 14px;">
            <td style="border: 1px solid #000; padding: 12px; text-align: center;" colSpan="4">
              <strong>Net Salary: ₹${netSalary.toFixed(2)} (${netSalaryWords})</strong>
            </td>
          </tr>
        </tbody>
      </table>
    `;
  };

  // Build final HTML with template + images + table
  const buildProcessedTemplate = (tableHtml) => {
    let baseHtml = templateHtml || `<div class="template-page"><div class="template-body"></div></div>`;
    if (templateCss) baseHtml = `<style>${templateCss}</style>${baseHtml}`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(baseHtml, "text/html");
    let pageContainer = doc.querySelector(".template-page") || doc.body;
    pageContainer.style.position = "relative";
    pageContainer.style.minHeight = "100vh";
    pageContainer.style.boxSizing = "border-box";

    let bodyDiv = doc.querySelector(".template-body") || pageContainer;
    bodyDiv.innerHTML = tableHtml;
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

    return doc.documentElement.outerHTML;
  };

  // Convert number to words
  const convertNumberToWords = (num) => {
    if (!num || num === 0) return "Zero Only";
    const ones = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
      "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
      "Seventeen", "Eighteen", "Nineteen",
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
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

  // Prepare data for manual form
  const prepareManualPayslipData = () => {
    const { grossEarnings, totalDeductions, netSalary } = calculateSummary();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthYear = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

    const netSalaryWords = convertNumberToWords(Math.round(netSalary));

    return {
      employeeName: formData.employeeName || "N/A",
      employeeId: formData.employeeId || "N/A",
      designation: formData.designation || "N/A",
      dateOfJoining: formData.dateOfJoining || "N/A",
      accountNo: formData.accountNo || "N/A",
      bankName: "",
      workingDays: parseInt(formData.workingDays) || 30,
      leavesTaken: parseInt(formData.leavesTaken) || 0,
      uinNo: formData.uinNo || "N/A",
      panNumber: formData.panNumber || "N/A",
      esiNumber: formData.esiNumber || "N/A",
      pfNumber: formData.pfNumber || "N/A",
      basic: parseFloat(formData.basic) || 0,
      hra: parseFloat(formData.hra) || 0,
      otherAllowance: parseFloat(formData.otherAllowance) || 0,
      bonus: 0,
      pf: parseFloat(formData.pf) || 0,
      esiInsurance: parseFloat(formData.esiInsurance) || 0,
      professionalTax: parseFloat(formData.professionalTax) || 0,
      tds: parseFloat(formData.tds) || 0,
      insurance: 0,
      advanceRecovery: 0,
      lopDeduction: 0,
      grossEarnings,
      totalDeductions,
      netSalary,
      monthYear,
      netSalaryWords,
    };
  };

  // Prepare data for saved payslip from list
  const prepareSavedPayslipData = (employee) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthYear = `${monthNames[(employee.month || new Date().getMonth() + 1) - 1]} ${employee.year || new Date().getFullYear()}`;

    const netSalaryWords = convertNumberToWords(Math.round(employee.net_salary || 0));

    return {
      employeeName: employee.employee_name || "N/A",
      employeeId: employee.employee_id || "N/A",
      designation: (employee.designation || employee.position || "") + (employee.department_name ? ` (${employee.department_name})` : ""),
      dateOfJoining: employee.date_of_joining ? employee.date_of_joining.split("T")[0] : "N/A",
      accountNo: employee.account_no || "N/A",
      bankName: "",
      workingDays: employee.working_days || 30,
      leavesTaken: employee.leaves_taken || 0,
      uinNo: employee.uin_no || "N/A",
      panNumber: employee.pan_number || "N/A",
      esiNumber: employee.esi_number || "N/A",
      pfNumber: employee.pf_number || "N/A",
      basic: employee.basic || 0,
      hra: employee.hra || 0,
      otherAllowance: employee.other_allowance || 0,
      bonus: 0,
      pf: employee.pf || 0,
      esiInsurance: employee.esi_insurance || 0,
      professionalTax: employee.professional_tax || 0,
      tds: employee.tds || 0,
      insurance: 0,
      advanceRecovery: 0,
      lopDeduction: 0,
      grossEarnings: employee.gross_earnings || 0,
      totalDeductions: employee.total_deductions || 0,
      netSalary: employee.net_salary || 0,
      monthYear,
      netSalaryWords,
    };
  };

  // Generate PDF using template
  const generatePdfWithTemplate = async (tableData) => {
    const tableHtml = buildDataTableHtml(tableData);
    const finalHtml = buildProcessedTemplate(tableHtml);

    const pdfBlob = await generatePayslipPDF(
      {}, // dummy payrollData
      { month: selectedMonth, year: selectedYear },
      {},
      {},
      {},
      { html: finalHtml }
    );

    return pdfBlob;
  };

  useEffect(() => {
    let mounted = true;

    const fetchEmployeeData = async () => {
      if (!orgId || !BACKEND_URL) return;

      try {
        const resp = await fetch(`${BACKEND_URL}/old-employee/list`, {
          credentials: "include",
          headers: getHeaders(),
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(text || `HTTP ${resp.status}`);
        }

        const data = await resp.json();
        if (!mounted) return;

        const list = Array.isArray(data) ? data : [];
        setEmployeeData(list);
        setFilteredEmployeeData(list);
      } catch (err) {
        console.error("Fetch payslip list error:", err);
        showAlert(
          "Failed to load payslip data: " + (err.message || err),
          "Error"
        );
      }
    };

    fetchEmployeeData();

    return () => {
      mounted = false;
    };
  }, [BACKEND_URL, orgId]);

  useEffect(() => {
    let mounted = true;
    if (!user?.orgId) {
      console.warn("OrgId not available yet, skipping API call");
      return;
    }
    const fetchFormEmployees = async () => {
      if (!orgId || !BACKEND_URL) return;

      try {
        const resp = await fetch(`${BACKEND_URL}/payslip/employees`, {
          credentials: "include",
          headers: getHeaders(),
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(text || `HTTP ${resp.status}`);
        }

        const data = await resp.json();
        if (!mounted) return;

        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data.data)) list = data.data;
        else if (Array.isArray(data.message?.data)) list = data.message.data;

        const normalized = list.map((item) => ({
          employee_id: item.employee_id || item.employeeId || "",
          employee_name:
            item.employee_name || item.employeeName || item.name || "",
          gender: item.gender || "",
          designation: item.position || item.designation || "",
          department_name:
            item.department_name ||
            item.departmentName ||
            item.department ||
            "",
          date_of_joining:
            item.joining_date ||
            item.date_of_joining ||
            item.joiningDate ||
            null,
          account_no:
            item.account_number || item.account_no || item.accountNo || "",
          uin_no: item.uan_number || item.uan || item.uanNumber || "",
          pan_number: item.pan_number || item.panNumber || "",
          esi_number: item.esi_number || item.esiNumber || "",
          pf_number: item.pf_number || item.pfNumber || "",
          id: item.id || item.employee_id || null,
        }));

        setFormEmployeeList(normalized);
      } catch (err) {
        console.error("Employee dropdown fetch error:", err);
        showAlert(
          "Failed to load employee list for form: " + (err.message || err),
          "Warning"
        );
      }
    };

    fetchFormEmployees();

    return () => {
      mounted = false;
    };
  }, [BACKEND_URL, orgId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = (searchQuery || "").trim().toLowerCase();
      if (!q) {
        setFilteredEmployeeData(employeeData);
        return;
      }
      setFilteredEmployeeData(
        employeeData.filter(
          (emp) =>
            (emp.employee_name || "").toLowerCase().includes(q) ||
            (emp.employee_id || "").toLowerCase().includes(q)
        )
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, employeeData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "employeeId") {
      if (manualEmployeeId) {
        setFormData((p) => ({ ...p, employeeId: value }));
        return;
      }

      const selected = formEmployeeList.find(
        (emp) => (emp.employee_id || emp.employeeId || "") === value
      );

      if (selected) {
        setFormData((p) => ({
          ...p,
          employeeId: value,
          employeeName: selected.employee_name || "",
          gender: selected.gender || "",
          designation:
            (selected.position || selected.designation || "") +
            (selected.department_name ? ` (${selected.department_name})` : ""),
          dateOfJoining: selected.date_of_joining
            ? selected.date_of_joining.split("T")[0]
            : "",
          accountNo: selected.account_no || "",
          uinNo: selected.uin_no || "",
          panNumber: selected.pan_number || "",
          esiNumber: selected.esi_number || "",
          pfNumber: selected.pf_number || "",
        }));
      } else {
        setFormData((p) => ({ ...p, employeeId: value }));
      }
    } else if (name === "selectedMonth") {
      setSelectedMonth(value);
    } else if (name === "selectedYear") {
      setSelectedYear(value);
    } else if (name === "panNumber") {
      setFormData((p) => ({ ...p, [name]: (value || "").toUpperCase() }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const calculateSummary = () => {
    const earnings = [
      parseFloat(formData.basic) || 0,
      parseFloat(formData.hra) || 0,
      parseFloat(formData.otherAllowance) || 0,
    ];
    const deductions = [
      parseFloat(formData.pf) || 0,
      parseFloat(formData.esiInsurance) || 0,
      parseFloat(formData.professionalTax) || 0,
      parseFloat(formData.tds) || 0,
    ];
    const grossEarnings = earnings.reduce((s, v) => s + v, 0);
    const totalDeductions = deductions.reduce((s, v) => s + v, 0);
    const netSalary = grossEarnings - totalDeductions;
    return { grossEarnings, totalDeductions, netSalary };
  };

  const fieldLabels = {
    employeeName: "Employee Name",
    employeeId: "Employee ID",
    gender: "Gender",
    designation: "Designation",
    dateOfJoining: "Date of Joining",
    accountNo: "Account Number",
    workingDays: "Working Days",
    leavesTaken: "Leaves Taken",
    uinNo: "UIN No",
    panNumber: "PAN Number",
    esiNumber: "ESI Number",
    pfNumber: "PF Number",
    basic: "Basic",
    hra: "HRA",
    otherAllowance: "Other Allowance",
    pf: "PF",
    esiInsurance: "ESI/Insurance",
    professionalTax: "Professional Tax",
    tds: "TDS",
  };

  const validateForm = () => {
    const requiredFields = [
      "employeeName",
      "employeeId",
      "gender",
      "designation",
      "dateOfJoining",
      "accountNo",
      "workingDays",
      "leavesTaken",
      "uinNo",
      "panNumber",
      "basic",
      "hra",
      "otherAllowance",
      "tds",
    ];

    for (const field of requiredFields) {
      const val = (formData[field] || "").toString().trim();
      if (!val) return `Please fill in ${fieldLabels[field] || field}`;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (formData.dateOfJoining && !datePattern.test(formData.dateOfJoining))
      return "Date of Joining must be in YYYY-MM-DD format";

    const date = new Date(formData.dateOfJoining);
    if (formData.dateOfJoining && (isNaN(date.getTime()) || date > new Date()))
      return "Please enter a valid Date of Joining in YYYY-MM-DD format";

    const numericFields = [
      "workingDays",
      "leavesTaken",
      "basic",
      "hra",
      "otherAllowance",
      "pf",
      "esiInsurance",
      "professionalTax",
      "tds",
    ];
    for (const field of numericFields) {
      if (
        formData[field] &&
        (isNaN(parseFloat(formData[field])) || parseFloat(formData[field]) < 0)
      )
        return `${
          fieldLabels[field] || field
        } must be a valid non-negative number`;
    }

    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (formData.panNumber && !panPattern.test(formData.panNumber))
      return "PAN Number must be in the format AAAAA9999A (e.g., ABCDE1234F)";

    if (!["Male", "Female"].includes(formData.gender))
      return "Gender must be either Male or Female";

    if (!selectedMonth || selectedMonth < 1 || selectedMonth > 12)
      return "Please select a valid month (1-12)";
    if (
      !selectedYear ||
      selectedYear < 1900 ||
      selectedYear > new Date().getFullYear() + 1
    )
      return "Please select a valid year";

    return null;
  };

  const prepareBackendData = () => {
    const { grossEarnings, totalDeductions, netSalary } = calculateSummary();
    return {
      employee_name: formData.employeeName || "",
      employee_id: formData.employeeId || "",
      gender: formData.gender || "",
      designation: formData.designation || "",
      date_of_joining: formData.dateOfJoining || "",
      account_no: formData.accountNo || "",
      working_days: parseInt(formData.workingDays) || 0,
      leaves_taken: parseInt(formData.leavesTaken) || 0,
      uin_no: formData.uinNo || "",
      pan_number: formData.panNumber || "",
      esi_number: formData.esiNumber || "",
      pf_number: formData.pfNumber || "",
      basic: parseFloat(formData.basic) || 0,
      hra: parseFloat(formData.hra) || 0,
      other_allowance: parseFloat(formData.otherAllowance) || 0,
      pf: parseFloat(formData.pf) || 0,
      esi_insurance: parseFloat(formData.esiInsurance) || 0,
      professional_tax: parseFloat(formData.professionalTax) || 0,
      tds: parseFloat(formData.tds) || 0,
      gross_earnings: grossEarnings || 0,
      total_deductions: totalDeductions || 0,
      net_salary: netSalary || 0,
      month: parseInt(selectedMonth) || 0,
      year: parseInt(selectedYear) || 0,
    };
  };

  const handleEdit = (employee) => {
    setFormData({
      employeeId: employee.employee_id || "PW-000001",
      employeeName: employee.employee_name || "",
      gender: employee.gender || "",
      designation:
        (employee.designation || employee.position || "") +
        (employee.department_name ? ` (${employee.department_name})` : ""),
      dateOfJoining: employee.date_of_joining
        ? employee.date_of_joining.split("T")[0]
        : "",
      accountNo: employee.account_no || "",
      workingDays: employee.working_days
        ? employee.working_days.toString()
        : "",
      leavesTaken: employee.leaves_taken
        ? employee.leaves_taken.toString()
        : "",
      uinNo: employee.uin_no || "",
      panNumber: employee.pan_number || "",
      esiNumber: employee.esi_number || "",
      pfNumber: employee.pf_number || "",
      basic: employee.basic ? employee.basic.toString() : "",
      hra: employee.hra ? employee.hra.toString() : "",
      otherAllowance: employee.other_allowance
        ? employee.other_allowance.toString()
        : "",
      pf: employee.pf ? employee.pf.toString() : "",
      esiInsurance: employee.esi_insurance
        ? employee.esi_insurance.toString()
        : "",
      professionalTax: employee.professional_tax
        ? employee.professional_tax.toString()
        : "",
      tds: employee.tds ? employee.tds.toString() : "",
    });
    setSelectedMonth(employee.month || new Date().getMonth() + 1);
    setSelectedYear(employee.year || new Date().getFullYear());
    setEditingEmployeeId(employee.id);
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleSaveToBackend = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showAlert(validationError, "Validation Error");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const backendData = prepareBackendData();
    const isEditing = !!editingEmployeeId;
    const url = isEditing
      ? `${BACKEND_URL}/old-employee/edit`
      : `${BACKEND_URL}/old-employee/save`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const resp = await fetch(url, {
        method,
        credentials: "include",
        headers: getHeaders(),
        body: JSON.stringify(backendData),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || `HTTP ${resp.status}`);
      }

      showAlert(
        isEditing
          ? "Payslip updated successfully!"
          : "Payslip saved successfully!",
        "Success"
      );

      const refreshed = await fetch(`${BACKEND_URL}/old-employee/list`, {
        credentials: "include",
        headers: getHeaders(),
      });
      if (refreshed.ok) {
        const data = await refreshed.json();
        const list = Array.isArray(data) ? data : [];
        setEmployeeData(list);
        setFilteredEmployeeData(list);
      }

      setShowModal(false);
      setFormData(initialFormData);
      setSelectedMonth(new Date().getMonth() + 1);
      setSelectedYear(new Date().getFullYear());
      setEditingEmployeeId(null);
    } catch (err) {
      console.error("Save error:", err);
      showAlert(`Error saving payslip: ${err.message || err}`, "Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showAlert(validationError, "Validation Error");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tableData = prepareManualPayslipData();
      const pdfBlob = await generatePdfWithTemplate(tableData);

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setPreview(true);
    } catch (err) {
      console.error("Preview error:", err);
      showAlert("Failed to generate preview: " + (err.message || err), "Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const validationError = validateForm();
    if (validationError) {
      showAlert(validationError, "Validation Error");
      return;
    }

    setIsLoading(true);

    try {
      const tableData = prepareManualPayslipData();
      const pdfBlob = await generatePdfWithTemplate(tableData);

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.employeeId}_${selectedMonth}_${selectedYear}_Payslip.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      showAlert("Payslip downloaded successfully!", "Success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to download PDF: " + (err.message || err), "Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadForEmployee = async (employee) => {
    setIsLoading(true);

    try {
      const tableData = prepareSavedPayslipData(employee);
      const pdfBlob = await generatePdfWithTemplate(tableData);

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${employee.employee_id}_${employee.month}_${employee.year}_Payslip.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      showAlert(`Payslip for ${employee.employee_name} downloaded!`, "Success");
    } catch (err) {
      console.error(err);
      showAlert(`Download failed: ${err.message || err}`, "Error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      protectedImgCache.clear();
    };
  }, [pdfUrl]);

  const detailFields = [
    "accountNo",
    "workingDays",
    "leavesTaken",
    "uinNo",
    "panNumber",
    "esiNumber",
    "pfNumber",
    "basic",
    "hra",
    "otherAllowance",
    "pf",
    "esiInsurance",
    "professionalTax",
    "tds",
    "grossEarnings",
    "totalDeductions",
    "netSalary",
  ];

  const tableHeaders = [
    "Employee Name",
    "Employee ID",
    "Gender",
    "Designation",
    "Date of Joining",
    "Bank Details",
    "Edit Data",
    "Download",
  ];

  const fieldOrder = [
    "employeeId",
    "employeeName",
    "gender",
    "designation",
    "dateOfJoining",
    "accountNo",
    "workingDays",
    "leavesTaken",
    "uinNo",
    "panNumber",
    "esiNumber",
    "pfNumber",
    "basic",
    "hra",
    "otherAllowance",
    "pf",
    "esiInsurance",
    "professionalTax",
    "tds",
  ];

  const fieldsForRows = fieldOrder.concat(["selectedMonth", "selectedYear"]);
  const rows = [];
  for (let i = 0; i < fieldsForRows.length; i += 3)
    rows.push(fieldsForRows.slice(i, i + 3));

  return (
    <div className="generatePayslip-container">
      <div className="generatePayslip-header">
        <div className="generatePayslip-search-container">
          <i className="fas fa-search generatePayslip-search-icon" />
          <input
            type="text"
            className="generatePayslip-search-input"
            placeholder="Search by name or employee ID"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <button
          className="generatePayslip-create-btn"
          onClick={() => {
            setShowModal(true);
            setPreview(false);
            setError(null);
            setSuccess(null);
            setEditingEmployeeId(null);
            setFormData(initialFormData);
            setSelectedMonth(new Date().getMonth() + 1);
            setSelectedYear(new Date().getFullYear());
          }}
        >
          Create Payslip
        </button>
      </div>

      <div className="generatePayslip-table-container">
        <table className="generatePayslip-table">
          <thead>
            <tr>
              {tableHeaders.map((h, i) => (
                <th key={i} className="generatePayslip-table-header">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredEmployeeData.length === 0 ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  style={{ textAlign: "center" }}
                >
                  No payslip data found
                </td>
              </tr>
            ) : (
              filteredEmployeeData.map((employee) => (
                <tr key={employee.id || employee.employee_id}>
                  <td className="generatePayslip-table-cell">
                    {employee.employee_name}
                  </td>
                  <td className="generatePayslip-table-cell">
                    {employee.employee_id}
                  </td>
                  <td className="generatePayslip-table-cell">
                    {employee.gender}
                  </td>
                  <td className="generatePayslip-table-cell">
                    {(employee.designation || employee.position || "") +
                      (employee.department_name
                        ? ` (${employee.department_name})`
                        : "")}
                  </td>
                  <td className="generatePayslip-table-cell">
                    {(employee.date_of_joining || "").split("T")[0]}
                  </td>
                  <td className="generatePayslip-table-cell">
                    <button
                      className="generatePayslip-view-btn"
                      onClick={() => handleViewDetails(employee)}
                      title="View Bank Details"
                    >
                      <i className="fas fa-eye" />
                    </button>
                  </td>
                  <td className="generatePayslip-table-cell">
                    <button
                      className="generatePayslip-edit-btn"
                      onClick={() => handleEdit(employee)}
                      title="Edit Payslip"
                    >
                      <i className="fas fa-pencil-alt" />
                    </button>
                  </td>
                  <td className="generatePayslip-table-cell">
                    <button
                      className="generatePayslip-download-btn"
                      onClick={() => handleDownloadForEmployee(employee)}
                      title="Download Payslip PDF"
                      disabled={isLoading}
                    >
                      <i className="fas fa-download" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="generatePayslip-popup-overlay">
          <div className="generatePayslip-popup-box">
            <button
              className="generatePayslip-popup-close-btn"
              onClick={() => {
                setShowModal(false);
                setPreview(false);
                setError(null);
                setSuccess(null);
                if (pdfUrl) {
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                }
                setEditingEmployeeId(null);
              }}
            >
              ×
            </button>

            <h3 className="generatePayslip-popup-title">
              {preview
                ? "Payslip Preview"
                : editingEmployeeId
                ? "Edit Payslip Details"
                : "Enter Payslip Details"}
            </h3>

            {error && <p className="generatePayslip-error">{error}</p>}
            {success && <p className="generatePayslip-success">{success}</p>}

            {preview ? (
              <div className="generatePayslip-preview">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    width="100%"
                    height="500px"
                    title="Payslip Preview"
                    style={{ border: "none" }}
                  />
                ) : (
                  <p>Loading preview...</p>
                )}
              </div>
            ) : (
              <div className="generatePayslip-popup-form">
                {rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="generatePayslip-form-row">
                    {row.map((field) => (
                      <div key={field} className="generatePayslip-form-group">
                        <label
                          htmlFor={field}
                          className="generatePayslip-form-label"
                        >
                          {fieldLabels[field]}
                          {[
                            "employeeName",
                            "employeeId",
                            "gender",
                            "designation",
                            "dateOfJoining",
                            "accountNo",
                            "workingDays",
                            "leavesTaken",
                            "uinNo",
                            "panNumber",
                            "basic",
                            "hra",
                            "otherAllowance",
                            "tds",
                          ].includes(field) && (
                            <span className="generatePayslip-required"> *</span>
                          )}
                        </label>

                        {field === "employeeId" ? (
                          <>
                            {!manualEmployeeId ? (
                              <select
                                id="employeeId"
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleChange}
                                className="generatePayslip-popup-input"
                              >
                                <option value="">Select Employee ID</option>
                                {formEmployeeList.map((emp) => (
                                  <option
                                    key={emp.employee_id || emp.id}
                                    value={emp.employee_id || emp.employeeId}
                                  >
                                    {`${emp.employee_id || emp.employeeId} - ${
                                      emp.employee_name || emp.name || ""
                                    }`}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleChange}
                                className="generatePayslip-popup-input"
                                placeholder="Enter Employee ID manually"
                              />
                            )}

                            <small
                              style={{
                                cursor: "pointer",
                                color: "#007bff",
                                marginTop: "4px",
                                display: "inline-block",
                              }}
                              onClick={() => {
                                setManualEmployeeId((p) => !p);
                                setFormData((p) => ({
                                  ...p,
                                  employeeId: "",
                                  employeeName: "",
                                }));
                              }}
                            >
                              {manualEmployeeId
                                ? "Select from employee list"
                                : "Enter employee ID manually"}
                            </small>
                          </>
                        ) : field === "selectedMonth" ? (
                          <select
                            id="selectedMonth"
                            name="selectedMonth"
                            value={selectedMonth}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                          >
                            <option value="">Select Month</option>
                            {[...Array(12)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString("default", {
                                  month: "long",
                                })}
                              </option>
                            ))}
                          </select>
                        ) : field === "selectedYear" ? (
                          <input
                            type="number"
                            id="selectedYear"
                            name="selectedYear"
                            value={selectedYear}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                            placeholder="Year"
                          />
                        ) : field === "gender" ? (
                          <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        ) : field === "panNumber" ? (
                          <input
                            id="panNumber"
                            name="panNumber"
                            value={formData.panNumber}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                            placeholder="ABCDE1234F"
                            maxLength={10}
                          />
                        ) : (
                          <input
                            id={field}
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                            type={
                              [
                                "workingDays",
                                "leavesTaken",
                                "basic",
                                "hra",
                                "otherAllowance",
                                "pf",
                                "esiInsurance",
                                "professionalTax",
                                "tds",
                              ].includes(field)
                                ? "number"
                                : field === "dateOfJoining"
                                ? "text"
                                : "text"
                            }
                            placeholder={
                              field === "dateOfJoining"
                                ? "YYYY-MM-DD"
                                : undefined
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="generatePayslip-form-buttons">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPreview(false);
                  setError(null);
                  setSuccess(null);
                  if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                  setEditingEmployeeId(null);
                }}
                className="generatePayslip-cancel-btn"
                disabled={isLoading}
              >
                Cancel
              </button>

              {preview ? (
                <>
                  <button
                    onClick={handleSaveToBackend}
                    className="generatePayslip-save-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save to Database"}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="generatePayslip-download-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "Downloading..." : "Download PDF"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveToBackend}
                    className="generatePayslip-save-btn"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Saving..."
                      : editingEmployeeId
                      ? "Update"
                      : "Save"}
                  </button>
                  <button
                    onClick={handlePreview}
                    className="generatePayslip-preview-btn"
                    disabled={isLoading}
                  >
                    Preview PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {viewDetailsModal.isVisible && viewDetailsModal.employee && (
        <Modal
          isVisible={viewDetailsModal.isVisible}
          onClose={closeViewDetails}
          buttons={[{ label: "Close", onClick: closeViewDetails }]}
        >
          <h3 className="generatePayslip-details-title">
            Details for {viewDetailsModal.employee.employee_name}
          </h3>
          <div className="generatePayslip-details-container">
            <table className="generatePayslip-details-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {detailFields.map((field) => (
                  <tr key={field}>
                    <td>{fieldLabels[field]}</td>
                    <td>
                      {field === "accountNo" &&
                        (viewDetailsModal.employee.account_no || "-")}
                      {field === "workingDays" &&
                        (viewDetailsModal.employee.working_days || 0)}
                      {field === "leavesTaken" &&
                        (viewDetailsModal.employee.leaves_taken || 0)}
                      {field === "uinNo" &&
                        (viewDetailsModal.employee.uin_no || "-")}
                      {field === "panNumber" &&
                        (viewDetailsModal.employee.pan_number || "-")}
                      {field === "esiNumber" &&
                        (viewDetailsModal.employee.esi_number || "-")}
                      {field === "pfNumber" &&
                        (viewDetailsModal.employee.pf_number || "-")}
                      {field === "basic" &&
                        (viewDetailsModal.employee.basic || 0)}
                      {field === "hra" && (viewDetailsModal.employee.hra || 0)}
                      {field === "otherAllowance" &&
                        (viewDetailsModal.employee.other_allowance || 0)}
                      {field === "pf" && (viewDetailsModal.employee.pf || 0)}
                      {field === "esiInsurance" &&
                        (viewDetailsModal.employee.esi_insurance || 0)}
                      {field === "professionalTax" &&
                        (viewDetailsModal.employee.professional_tax || 0)}
                      {field === "tds" && (viewDetailsModal.employee.tds || 0)}
                      {field === "grossEarnings" &&
                        (viewDetailsModal.employee.gross_earnings || 0)}
                      {field === "totalDeductions" &&
                        (viewDetailsModal.employee.total_deductions || 0)}
                      {field === "netSalary" &&
                        (viewDetailsModal.employee.net_salary || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <h3>{alertModal.title || "Alert"}</h3>
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
}