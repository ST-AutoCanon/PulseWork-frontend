"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../../context/AuthProvider.client";
import "./SalaryDetails.css";
import {
  calculateSalaryDetails,
  parseApplicableMonth,calculateBaseNetSalary,
} from "../../../utils/SalaryCalculations.js";
import { calculateLOPEffect } from "../../../utils/lopCalculations.client.jsx";
import { calculateIncentives } from "../../../utils/IncentiveUtils.js";
import Modal from "../../Modal/Modal.client";
import AttendanceDeductionCells, {
  getAttendanceDeductionAmounts,
  getAttendanceDeductionExportValues,
} from "./AttendanceDeductionCells.client";

const SalaryDetails = () => {
  const { user } = useAuth();
  const meId = user?.employeeId ?? user?.id ?? user?.employee_id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [employees, setEmployees] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [bonusRecords, setBonusRecords] = useState([]);
  const [employeeLopData, setEmployeeLopData] = useState({});
  const [attendanceDeductionData, setAttendanceDeductionData] = useState({});
  const [attendanceDeductionLoading, setAttendanceDeductionLoading] = useState(false);
  const [attendanceDeductionError, setAttendanceDeductionError] = useState("");
  const [employeeIncentiveData, setEmployeeIncentiveData] = useState({});
  const [personalMap, setPersonalMap] = useState({});
  const [validSelectedEmployees, setValidSelectedEmployees] = useState([]);
  const [workingDays, setWorkingDays] = useState(null);
  const [payrollPeriod, setPayrollPeriod] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showBankReportOptions, setShowBankReportOptions] = useState(false);
  const [approvedIds, setApprovedIds] = useState([]);

  const requestHeaders = {
    "x-employee-id": meId,
    ...(orgId ? { "x-org-id": orgId } : {}),
    "Content-Type": "application/json",
  };

  const hasValidCredentials = () => Boolean(meId && orgId);

  const isApproved = (empId) => approvedIds.includes(String(empId));
  const calculateMonthlyBonusPay = (empCtc, bonusRecords) => {
    if (!empCtc) return 0;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
    const monthlyCTC = parseFloat(empCtc) / 12;

    const monthlyBonuses = bonusRecords.filter((bonus) => {
      const date = parseApplicableMonth(bonus.applicable_month);
      return (
        date &&
        date.getFullYear() === currentYear &&
        (date.getMonth() + 1).toString().padStart(2, "0") === currentMonthStr
      );
    });

    return monthlyBonuses.reduce((sum, bonus) => {
      let bonusAmount = 0;
      if (bonus.fixed_amount && !isNaN(parseFloat(bonus.fixed_amount))) {
        bonusAmount = parseFloat(bonus.fixed_amount);
      } else if (bonus.percentage_ctc && !isNaN(parseFloat(bonus.percentage_ctc))) {
        bonusAmount = (parseFloat(bonus.percentage_ctc) / 100) * parseFloat(empCtc || 0);
      } else if (bonus.percentage_monthly_salary && !isNaN(parseFloat(bonus.percentage_monthly_salary))) {
        bonusAmount = parseFloat(bonus.percentage_monthly_salary) * monthlyCTC;
      }
      return sum + bonusAmount;
    }, 0);
  };

    // ====================== CONSISTENT GROSS/NET LOGIC (Same as DetailsTab) ======================
   // ====================== FINAL GROSS/NET LOGIC (Consistent with Preview) ======================
    // ====================== FINAL GROSS/NET LOGIC (Consistent with Preview & DetailsTab) ======================
     // ====================== FINAL GROSS/NET LOGIC (Consistent with Preview & DetailsTab) ======================
 const calculateLocalGrossNet = (salaryDetails, planData, lopDeduction = 0, advanceRecovery = 0) => {
  if (!salaryDetails) return { localGross: 0, localNet: 0 };

  // FIX: Prevent crash when planData is null or undefined
  const safePlanData = planData || {};

  // === ALL Earnings (matches DetailsTab) ===
  const earningsSum = [
    salaryDetails.basicSalary || 0,
    salaryDetails.hra || 0,
    salaryDetails.ltaAllowance || 0,
    salaryDetails.otherAllowances || 0,
    salaryDetails.incentivePay || 0,
    salaryDetails.overtimePay || 0,
    salaryDetails.statutoryBonus || 0,
    salaryDetails.bonusPay || 0,           // Important
  ].reduce((sum, val) => sum + parseFloat(val || 0), 0);

  // Fixed deductions from plan
  let employeeDeductions = 0;

  if (safePlanData.pfEmployeeIncludeInCtc !== false)
    employeeDeductions += parseFloat(salaryDetails.employeePF || 0);
  if (safePlanData.esicEmployeeIncludeInCtc !== false)
    employeeDeductions += parseFloat(salaryDetails.esic || 0);
  if (safePlanData.professionalTaxIncludeInCtc !== false)
    employeeDeductions += parseFloat(salaryDetails.professionalTax || 0);
  if (safePlanData.insuranceEmployeeIncludeInCtc !== false)
    employeeDeductions += parseFloat(salaryDetails.insurance || 0);

  // Variable deductions
  employeeDeductions += parseFloat(advanceRecovery || 0);
  employeeDeductions += parseFloat(lopDeduction || 0);

  const localGross = earningsSum;
  const localNet = Math.max(0, earningsSum - employeeDeductions);

  return { localGross, localNet };
};
  // ============================================================================================

  useEffect(() => {
    const fetchSalaryBreakupData = async () => {
      if (!meId || !orgId) {
        console.warn("Auth not ready yet. Waiting...", { meId, orgId });
        return;
      }

      const headers = {
        "x-employee-id": meId,
        "x-org-id": orgId,
        "Content-Type": "application/json",
      };

      try {
        setIsLoading(true);

        const [
          compensationsRes,
          employeesRes,
          advancesRes,
          overtimeRes,
          bonusRes,
          workingDaysRes,
          approvedRes,
        ] = await Promise.all([
          axios.get(`${BASE_URL}/api/compensations/list`, {
            withCredentials: true,
            headers,
          }),
          axios.get(`${BASE_URL}/api/compensation/assigned`, {
            withCredentials: true,
            headers,
          }),
          axios.get(`${BASE_URL}/api/compensation/advance-details`, {
            withCredentials: true,
            headers,
          }),
          axios.get(`${BASE_URL}/api/compensation/overtime-status-summary`, {
            withCredentials: true,
            headers,
          }),
          axios.get(`${BASE_URL}/api/compensation/bonus-list`, {
            withCredentials: true,
            headers,
          }),
          axios
            .get(`${BASE_URL}/api/compensation/working-days`, {
              withCredentials: true,
              headers,
            })
            .catch(() => ({ data: { data: { totalWorkingDays: "N/A" } } })),
          axios
            .get(`${BASE_URL}/api/salary-details/approved-ids`, {
              withCredentials: true,
              headers,
            })
            .catch(() => ({ data: { approvedIds: [] } })),
        ]);

        setApprovedIds(approvedRes.data.approvedIds || []);
        setWorkingDays(workingDaysRes.data?.data?.totalWorkingDays ?? "N/A");

        const compensationMap = new Map();
        (compensationsRes.data?.data || []).forEach((comp) => {
          compensationMap.set(comp.compensation_plan_name, comp.plan_data);
        });

        const enrichedEmployeesMap = new Map();
        (employeesRes.data?.data || []).forEach((emp) => {
          if (!enrichedEmployeesMap.has(emp.employee_id)) {
            enrichedEmployeesMap.set(emp.employee_id, {
              ...emp,
              plan_data:
                compensationMap.get(emp.compensation_plan_name) ||
                emp.plan_data,
            });
          }
        });

        const enrichedEmployees = Array.from(enrichedEmployeesMap.values());
        setEmployees(enrichedEmployees);
        setAdvances(advancesRes.data?.data || []);
        setOvertimeRecords(overtimeRes.data?.data || []);
        setBonusRecords(bonusRes.data?.data || []);
      } catch (error) {
        console.error("SalaryDetails fetch failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalaryBreakupData();
  }, [meId, orgId]);

  useEffect(() => {
    if (!employees.length || !hasValidCredentials()) return;

    let isActive = true;
    const fetchAttendanceDeductions = async () => {
      setAttendanceDeductionLoading(true);
      setAttendanceDeductionError("");
      try {
        const now = new Date();
        const response = await axios.post(
          `${BASE_URL}/api/salary-attendance-deductions/calculate`,
          {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            employees: employees.map((emp) => ({
              employee_id: emp.employee_id,
              annual_ctc: emp.ctc,
            })),
          },
          { withCredentials: true, headers: requestHeaders }
        );
        if (isActive) {
          const deductionData = response.data?.data || {};
          setAttendanceDeductionData(deductionData);
          setPayrollPeriod(
            Object.values(deductionData).find((employeeData) => employeeData?.period)
              ?.period || null
          );
        }
      } catch (error) {
        console.error("Attendance salary deductions fetch failed:", error);
        if (isActive) {
          setAttendanceDeductionError(
            error.response?.data?.error || "Failed to calculate attendance deductions."
          );
        }
      } finally {
        if (isActive) setAttendanceDeductionLoading(false);
      }
    };

    fetchAttendanceDeductions();
    return () => {
      isActive = false;
    };
  }, [employees, meId, orgId]);

  useEffect(() => {
    if (!employees.length || !meId) return;

    const loadAllLOP = async () => {
      const lopMap = {};

      for (const emp of employees) {
        const lopResult = await calculateLOPEffect({
          employeeId: emp.employee_id,
          meId,
          orgId,
          referenceMonthYear: payrollPeriod?.endDate?.slice(0, 7) || null,
        });

        lopMap[emp.employee_id] = lopResult;
      }

      setEmployeeLopData(lopMap);
    };

    loadAllLOP();
  }, [employees, meId, orgId, payrollPeriod]);

  const filteredEmployees = (employees || []).filter(
    (emp) =>
      emp.employee_id
        .toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  const handleRowSelect = (employeeId) => {
    if (isApproved(employeeId)) return;

    setSelectedEmployees((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const selectable = filteredEmployees
      .filter((emp) => !isApproved(emp.employee_id))
      .map((emp) => emp.employee_id);

    if (selectedEmployees.size === selectable.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(selectable));
    }
  };

  const isAllSelected =
    selectedEmployees.size ===
      filteredEmployees.filter((e) => !isApproved(e.employee_id)).length &&
    filteredEmployees.length > 0;

  const getSelectedEmployees = () =>
    employees.filter((emp) => selectedEmployees.has(emp.employee_id));

  const handleProceed = async () => {
  if (!hasValidCredentials()) {
    showAlert("Missing credentials. Please log in again.");
    return;
  }
  if (attendanceDeductionLoading || attendanceDeductionError) {
    showAlert(
      attendanceDeductionError ||
        "Please wait for attendance deductions to finish calculating."
    );
    return;
  }
  if (selectedEmployees.size === 0) {
    showAlert("Please select at least one employee.");
    return;
  }

  try {
    const employeeIds = Array.from(selectedEmployees);
    const personalRes = await axios.post(
      `${BASE_URL}/api/compensation/employee-personal-details`,
      { employeeIds },
      { withCredentials: true, headers: requestHeaders }
    );
    setPersonalMap(personalRes.data.data || {});

    const allSelected = getSelectedEmployees();
    
    // More lenient validation
    const validEmployees = allSelected.filter((emp) => {
      try {
        const lopData = employeeLopData[emp.employee_id];
        // Allow proceeding even if LOP data is missing (treat as 0)
        const salaryDetails = calculateSalaryDetails(
          emp.ctc,
          emp.plan_data,
          emp.employee_id,
          overtimeRecords || [],
          bonusRecords || [],
          advances || [],
          employeeIncentiveData || {},
          employeeLopData
        );
        return !!salaryDetails; // only reject if calculation completely fails
      } catch (e) {
        console.warn(`Validation failed for ${emp.employee_id}:`, e);
        return false;
      }
    });

    if (validEmployees.length === 0) {
      showAlert(
        "None of the selected employees could be processed. Please check console for details."
      );
      return;
    }

    if (validEmployees.length < allSelected.length) {
      showAlert(
        `${validEmployees.length} of ${allSelected.length} employees are valid. Proceeding with valid ones.`
      );
    }

    setValidSelectedEmployees(validEmployees);
    setShowPreviewModal(true);
  } catch (error) {
    console.error("Error fetching personal details:", error);
    showAlert(
      error.response?.status === 401
        ? "Authentication failed. Please log in again."
        : "Failed to load employee details for preview."
    );
  }
};

  const handleCloseModal = () => {
    setShowPreviewModal(false);
    setValidSelectedEmployees([]);
    setPersonalMap({});
    setShowBankReportOptions(false);
  };

  const downloadExcel = (employeesToExport = filteredEmployees) => {
    if (!employeesToExport || employeesToExport.length === 0) return;

    try {
      const rows = employeesToExport.map((emp) => {
        let salaryDetails;
        try {
          salaryDetails = calculateSalaryDetails(
            emp.ctc,
            emp.plan_data,
            emp.employee_id,
            overtimeRecords || [],
            bonusRecords || [],
            advances || [],
            employeeIncentiveData || {},
            employeeLopData
          );
        } catch (e) {
          console.error(
            `Error calculating salary details for ${emp.employee_id}:`,
            e
          );
          salaryDetails = null;
        }

        if (!salaryDetails) {
          return Array(31).fill("N/A");
        }

        const monthlyBonusPay = calculateMonthlyBonusPay(emp.ctc, bonusRecords);
        const lopData = employeeLopData[emp.employee_id] || {
          yearly: { days: 0, value: "0.00" },
        };
        const lopDays = Number.parseFloat(lopData.yearly?.days || 0);
        const lopDeduction = Number.parseFloat(lopData.yearly?.value || "0.00");
        const advanceRecovery = Number.parseFloat(salaryDetails.advanceRecovery || 0);

        const { localGross, localNet } = calculateLocalGrossNet(
          salaryDetails,
          emp.plan_data,
          lopDeduction,
          advanceRecovery
        );
        const attendanceDeductions = attendanceDeductionData[emp.employee_id] || {};
        const deductionAmounts = getAttendanceDeductionAmounts(attendanceDeductions);
        const attendanceExportValues =
          getAttendanceDeductionExportValues(attendanceDeductions);
        const newNetSalary = Math.max(
          0,
          localNet -
            deductionAmounts.lateLogin -
            deductionAmounts.missPunchOut -
            deductionAmounts.lessLoginHours
        );

        return [
          emp.employee_id,
          emp.full_name,
          emp.ctc ? Number.parseFloat(emp.ctc) : 0,
          salaryDetails.basicSalary || 0,
          salaryDetails.hra || 0,
          salaryDetails.ltaAllowance || 0,
          salaryDetails.otherAllowances || 0,
          salaryDetails.incentivePay || 0,
          salaryDetails.overtimePay || 0,
          salaryDetails.statutoryBonus || 0,
          monthlyBonusPay,
          salaryDetails.advanceRecovery || 0,
          salaryDetails.employeePF || 0,
          salaryDetails.employerPF || 0,
          salaryDetails.esic || 0,
          salaryDetails.esicEmployer || 0,
          salaryDetails.gratuity || 0,
          salaryDetails.professionalTax || 0,
          salaryDetails.tds || 0,
          salaryDetails.insurance || 0,
          salaryDetails.insuranceEmployer || 0,
          calculateBaseNetSalary(emp.ctc, emp.plan_data, emp.employee_id),
          salaryDetails.finalCTC || emp.ctc || 0,
          localGross,
          Math.max(localNet, 0),
          attendanceExportValues[0],
          attendanceExportValues[1],
          `${Number(attendanceDeductions.approvedLeaveCount || 0)} (${lopDays.toFixed(2)})`,
          lopDeduction,
          ...attendanceExportValues.slice(2),
          newNetSalary,
        ];
      });

      const headers = [
        "ID",
        "Name",
        "Annual CTC",
        "Basic Salary",
        "HRA",
        "LTA",
        "Other Allowances",
        "Incentives",
        "Overtime",
        "Statutory Bonus",
        "Bonus",
        "Advance Recovery",
        "Employee PF",
        "Employer PF",
        "ESIC",
        "ESIC Employer",
        "Gratuity",
        "Professional Tax",
        "TDS",
        "Insurance",
        "Insurance Employer",
        "Base Net Salary",
        "Final CTC",
        "Gross Salary",
        "Net Salary",
        "Late Login Eligible Count (Total Violations)",
        "Late Login Amount",
        "Approved Leave Count (LOP Days)",
        "LOP Deduction",
        "Miss Punch Out Eligible Count (Total Violations)",
        "Miss Punch Out Amount",
        "Less Login Hours Eligible Count (Total Violations)",
        "Less Login Hours Amount",
        "Net Salary After Attendance Deductions",
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [
        { wch: 8 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 8 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 8 },
        { wch: 8 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 8 },
        { wch: 10 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 8 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 18 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Salary Details");
      XLSX.writeFile(wb, "salary-details.xlsx");
    } catch (error) {
      console.error("Excel export failed:", error);
      showAlert("Excel export failed. Please check the console for details.");
    }
  };

  const generateBankReportData = (selectedData) => {
    const rows = selectedData.map((emp) => {
      let salaryDetails;
      try {
        salaryDetails = calculateSalaryDetails(
          emp.ctc,
          emp.plan_data,
          emp.employee_id,
          overtimeRecords || [],
          bonusRecords || [],
          advances || [],
          employeeIncentiveData || {},
          employeeLopData
        );
      } catch (e) {
        console.error(
          `Error calculating salary details for ${emp.employee_id}:`,
          e
        );
        salaryDetails = null;
      }

      if (!salaryDetails) {
        return { row: Array(5).fill("N/A"), netSalary: 0 };
      }

      const monthlyBonusPay = calculateMonthlyBonusPay(emp.ctc, bonusRecords);
      const lopData = employeeLopData[emp.employee_id] || {
        currentMonth: { days: 0, value: "0.00", currency: "INR" },
      };
     const lopDeduction = parseFloat(lopData.yearly?.value || "0.00");
const advanceRecovery = parseFloat(salaryDetails.advanceRecovery || 0);

const { localNet } = calculateLocalGrossNet(
  salaryDetails,
  emp.plan_data,
  lopDeduction,
  advanceRecovery
);
      const netSalary = localNet > 0 ? localNet : 0;
      const attendanceDeductions = attendanceDeductionData[emp.employee_id] || {};
      const deductionAmounts = getAttendanceDeductionAmounts(attendanceDeductions);
      const adjustedNetSalary = Math.max(
        0,
        netSalary -
          deductionAmounts.lateLogin -
          deductionAmounts.missPunchOut -
          deductionAmounts.lessLoginHours
      );

      const personalDetails = personalMap[emp.employee_id] || {
        pan_number: "N/A",
        uan_number: "N/A",
      };
      return {
        row: [
          emp.employee_id,
          emp.full_name,
          personalDetails.pan_number,
          personalDetails.uan_number,
          adjustedNetSalary > 0 ? `₹${adjustedNetSalary.toLocaleString()}` : "N/A",
        ],
        netSalary,
      };
    });

    const headers = ["ID", "Name", "PAN Number", "UAN Number", "Net Payable"];
    return { headers, rows };
  };

  const downloadBankReportExcel = () => {
    if (validSelectedEmployees.length === 0) return;
    const { headers, rows } = generateBankReportData(validSelectedEmployees);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows.map((r) => r.row)]);
    ws["!cols"] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bank Report");
    XLSX.writeFile(wb, "bank-report.xlsx");
  };

  const downloadBankReportPDF = () => {
    if (validSelectedEmployees.length === 0) return;
    const { headers, rows } = generateBankReportData(validSelectedEmployees);
    const cleanedRows = rows.map((r) => {
      const formattedRow = r.row.map((cell, idx) => {
        if (idx === 4 && typeof cell === "string") {
          return cell.replace(/₹/g, "").replace(/¹/g, "").trim();
        }
        return cell;
      });
      return { row: formattedRow };
    });
    const doc = new jsPDF("portrait");
    let y = 20;
    doc.setFontSize(16);
    doc.text("Bank Report", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, y);
    doc.text(`Total Selected: ${validSelectedEmployees.length}`, 190, y, {
      align: "right",
    });
    y += 14;
    autoTable(doc, {
      head: [headers],
      body: cleanedRows.map((r) => r.row),
      startY: y,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [248, 249, 250],
        textColor: [73, 80, 87],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 20 },
        1: { halign: "left", cellWidth: 60 },
        2: { halign: "center", cellWidth: 30 },
        3: { halign: "center", cellWidth: 30 },
        4: { halign: "right", cellWidth: 40 },
      },
      margin: { top: y },
    });
    doc.save(`bank-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleDownloadBankReport = (format) => {
    if (!hasValidCredentials()) {
      showAlert("Missing credentials. Please log in again.");
      return;
    }
    if (validSelectedEmployees.length === 0) {
      showAlert("No valid employees selected.");
      return;
    }
    if (format === "excel") downloadBankReportExcel();
    else if (format === "pdf") downloadBankReportPDF();
    else if (format === "both") {
      downloadBankReportExcel();
      downloadBankReportPDF();
    }
    setShowBankReportOptions(false);
    setShowPreviewModal(false);
  };

  const handleDownloadSelected = () => {
    downloadExcel(validSelectedEmployees);
    setShowPreviewModal(false);
  };

  const getAbbrevMonth = (date) => {
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    return months[date.getMonth()];
  };

 const handleSaveData = async () => {
  if (!hasValidCredentials()) {
    showAlert("Missing credentials. Please log in again.");
    return;
  }
  if (attendanceDeductionLoading || attendanceDeductionError) {
    showAlert(
      attendanceDeductionError ||
        "Please wait for attendance deductions to finish calculating."
    );
    return;
  }

  try {
    if (validSelectedEmployees.length === 0) {
      showAlert("No valid employees selected.");
      return;
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthAbbrev = getAbbrevMonth(currentDate);

    const fullSalaryData = validSelectedEmployees
      .map((emp) => {
        try {
          const salaryDetails = calculateSalaryDetails(
            emp.ctc,
            emp.plan_data,
            emp.employee_id,
            overtimeRecords || [],
            bonusRecords || [],
            advances || [],
            employeeIncentiveData || {},
            employeeLopData
          );

          if (!salaryDetails) return null;

         const monthlyBonusPay = calculateMonthlyBonusPay(emp.ctc, bonusRecords);
const lopData = employeeLopData[emp.employee_id] || { yearly: { days: 0, value: "0.00" } };
const lopDays = parseFloat(lopData.yearly?.days || 0);
const lopDeduction = parseFloat(lopData.yearly?.value || "0.00");
const advanceRecovery = Number(salaryDetails.advanceRecovery || 0);

const { localGross, localNet } = calculateLocalGrossNet(
  salaryDetails, 
  emp.plan_data, 
  lopDeduction, 
  advanceRecovery
);
const attendanceDeductions = attendanceDeductionData[emp.employee_id] || {};
const deductionAmounts = getAttendanceDeductionAmounts(attendanceDeductions);
const adjustedNetSalary = Math.max(
  0,
  localNet -
    deductionAmounts.lateLogin -
    deductionAmounts.missPunchOut -
    deductionAmounts.lessLoginHours
);

const finalCTC = localGross +
  Number(salaryDetails.employerPF || 0) +
  Number(salaryDetails.gratuity || 0) +
  Number(salaryDetails.insuranceEmployer || 0) +
  Number(salaryDetails.esicEmployer || 0);

          return {
            employee_id: emp.employee_id,
            full_name: emp.full_name,
            annual_ctc: emp.ctc || 0,
            basic_salary: Number(salaryDetails.basicSalary || 0),
            hra: Number(salaryDetails.hra || 0),
            lta: Number(salaryDetails.ltaAllowance || 0),
            other_allowances: Number(salaryDetails.otherAllowances || 0),
            incentives: Number(salaryDetails.incentivePay || 0),
            overtime: Number(salaryDetails.overtimePay || 0),
            statutory_bonus: Number(salaryDetails.statutoryBonus || 0),
            bonus: Number(monthlyBonusPay || 0),
            advance_recovery: Number(salaryDetails.advanceRecovery || 0),
            employee_pf: Number(salaryDetails.employeePF || 0),
            employer_pf: Number(salaryDetails.employerPF || 0),

            // ✅ Correct column names matching backend
            esic_employee: Number(salaryDetails.esic || 0),
            esic_employer: Number(salaryDetails.esicEmployer || 0),

            gratuity: Number(salaryDetails.gratuity || 0),
            professional_tax: Number(salaryDetails.professionalTax || 0),
            tds: Number(salaryDetails.tds || 0),

            insurance_employee: Number(salaryDetails.insurance || 0),
            insurance_employer: Number(salaryDetails.insuranceEmployer || 0),

            lop_days: lopDays,
            lop_deduction: lopDeduction,
            approved_leave_count: Number(attendanceDeductions.approvedLeaveCount || 0),
            base_net_salary: Number(calculateBaseNetSalary(emp.ctc, emp.plan_data, emp.employee_id) || 0),
            late_login_count: Number(attendanceDeductions.lateLogin?.count || 0),
            late_login_deduction: deductionAmounts.lateLogin,
            miss_punch_out_count: Number(attendanceDeductions.missPunchOut?.count || 0),
            miss_punch_out_deduction: deductionAmounts.missPunchOut,
            less_login_hours_count: Number(attendanceDeductions.lessLoginHours?.count || 0),
            less_login_hours_deduction: deductionAmounts.lessLoginHours,
            gross_salary: Number(localGross || 0),
            final_ctc: Number(finalCTC || 0),
            net_salary: Number(localNet > 0 ? localNet : 0),
            net_salary_after_attendance_deduction: adjustedNetSalary,

            status: "Approved",
            payslip_generation: "disabled",
            payslip_generated: 0
          };
        } catch (empError) {
          console.error(`Error processing employee ${emp.employee_id}:`, empError);
          return null;
        }
      })
      .filter((data) => data !== null);

    // Use fullSalaryData instead of undefined salaryDataToSave
    const salaryDataToSave = fullSalaryData;

    const response = await axios.post(
      `${BASE_URL}/api/salary-details/save`,
      {
        salaryData: salaryDataToSave,
        month: currentMonthAbbrev,
        year: currentYear,
      },
      {
        withCredentials: true,
        headers: {
          "x-employee-id": meId,
          "x-org-id": orgId,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      const rowsInserted =
        response.data.rowsInserted || salaryDataToSave.length;
      showAlert(
        `Data saved successfully in table: ${response.data.tableName} (${rowsInserted} rows)`
      );

      const approvedRes = await axios.get(
        `${BASE_URL}/api/salary-details/approved-ids`,
        {
          withCredentials: true,
          headers: {
            "x-employee-id": meId,
            "x-org-id": orgId,
            "Content-Type": "application/json",
          },
        }
      );
      const newApprovedIds = approvedRes.data.approvedIds || [];
      setApprovedIds(newApprovedIds);
      setSelectedEmployees((prev) => {
        const newSet = new Set(prev);
        newApprovedIds.forEach((id) => newSet.delete(String(id)));
        return newSet;
      });
    } else {
      showAlert(`Error: ${response.data.error}`);
    }
  } catch (error) {
    console.error("Save error:", error);
    if (error.response?.status === 400 || error.response?.status === 401) {
      showAlert(
        `Authentication failed: ${
          error.response?.data?.error || "Please log in again."
        }`
      );
    } else {
      showAlert(
        `Failed to save data: ${error.response?.data?.error || error.message}`
      );
    }
  }
  setShowPreviewModal(false);
};

const renderTableRows = (employeesToRender) => {
  return (
    <tbody className="sd-table-body">
      {employeesToRender.map((emp) => {
        let salaryDetails;
        try {
          salaryDetails = calculateSalaryDetails(
            emp.ctc,
            emp.plan_data,
            emp.employee_id,
            overtimeRecords || [],
            bonusRecords || [],
            advances || [],
            employeeIncentiveData || {},
            employeeLopData
          );
        } catch (e) {
          console.error(`Error calculating salary for ${emp.employee_id}:`, e);
          salaryDetails = null;
        }

        if (!salaryDetails) {
          return (
            <tr key={emp.employee_id} className={isApproved(emp.employee_id) ? "sd-row-disabled" : ""}>
              {/* Fallback row with sticky columns */}
              <td className="sd-table-cell sd-align-center sd-select-column sd-sticky-col sd-sticky-checkbox" style={{ left: 0, zIndex: 10 }}>
                <input type="checkbox" disabled />
              </td>
              <td className="sd-table-cell sd-align-left sd-id-column sd-sticky-col sd-sticky-id" style={{ left: "40px", zIndex: 10 }}>{emp.employee_id}</td>
              <td className="sd-table-cell sd-align-left sd-name-column sd-sticky-col sd-sticky-name" style={{ left: "110px", zIndex: 10 }}>{emp.full_name}</td>
              <td className="sd-table-cell sd-align-right sd-sticky-col sd-sticky-ctc" style={{ left: "260px", zIndex: 10 }}>
                {emp.ctc ? `₹${parseFloat(emp.ctc).toLocaleString()}` : "N/A"}
              </td>
              <td colSpan="31" className="sd-table-cell">Calculation Error</td>
            </tr>
          );
        }

        const monthlyBonusPay = calculateMonthlyBonusPay(emp.ctc, bonusRecords);
        const lopData = employeeLopData[emp.employee_id] || { yearly: { days: 0, value: "0.00" } };
        const lopDays = parseFloat(lopData.yearly?.days || 0);
        const lopDeduction = parseFloat(lopData.yearly?.value || 0);

const advanceRecovery = Number(salaryDetails.advanceRecovery || 0);
// ===== NEW: Base Net Salary (stable, no OT/Bonus/LOP/Advance) =====
const baseNetSalary = calculateBaseNetSalary(
  emp.ctc,
  emp.plan_data,
  emp.employee_id
);
const { localGross, localNet } =
    calculateLocalGrossNet(
        salaryDetails,
        emp.plan_data,
        lopDeduction,
        advanceRecovery
    );
        const attendanceDeductions = attendanceDeductionData[emp.employee_id] || {};
        const deductionAmounts = getAttendanceDeductionAmounts(attendanceDeductions);
        const adjustedNetSalary = Math.max(
          0,
          localNet -
            deductionAmounts.lateLogin -
            deductionAmounts.missPunchOut -
            deductionAmounts.lessLoginHours
        );
        const finalCTC = localGross +
          (salaryDetails.employerPF || 0) +
          (salaryDetails.gratuity || 0) +
          (salaryDetails.insuranceEmployer || 0) +
          (salaryDetails.esicEmployer || 0);

        return (
          <tr key={emp.employee_id} className={isApproved(emp.employee_id) ? "sd-row-disabled" : ""}>
            {/* Sticky Columns */}
            <td className="sd-table-cell sd-align-center sd-select-column sd-sticky-col sd-sticky-checkbox" style={{ left: 0, zIndex: 10 }}>
              <input
                type="checkbox"
                checked={selectedEmployees.has(emp.employee_id)}
                disabled={isApproved(emp.employee_id)}
                onChange={() => handleRowSelect(emp.employee_id)}
              />
            </td>
            <td className="sd-table-cell sd-align-left sd-id-column sd-sticky-col sd-sticky-id" style={{ left: "40px", zIndex: 10 }}>
              {emp.employee_id}
            </td>
            <td className="sd-table-cell sd-align-left sd-name-column sd-sticky-col sd-sticky-name" style={{ left: "110px", zIndex: 10 }}>
              {emp.full_name}
            </td>
            <td className="sd-table-cell sd-align-right sd-sticky-col sd-sticky-ctc" style={{ left: "260px", zIndex: 10 }}>
              {emp.ctc ? `₹${parseFloat(emp.ctc).toLocaleString()}` : "N/A"}
            </td>

           {/* Employee Earnings */}
<td className="sd-table-cell sd-align-right">₹{Number(salaryDetails.basicSalary || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right">₹{Number(salaryDetails.hra || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right">₹{Number(salaryDetails.ltaAllowance || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right">₹{Number(salaryDetails.otherAllowances || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right">₹{Number(salaryDetails.incentivePay || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right">₹{Number(salaryDetails.overtimePay || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right">₹{Number(salaryDetails.statutoryBonus || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right">₹{monthlyBonusPay.toFixed(2)}</td>
{/* ❌ REMOVE Base Net from here */}

{/* Employer Contributions */}
<td className="sd-table-cell sd-align-right sd-deduction">₹{Number(salaryDetails.employerPF || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right sd-deduction">₹{Number(salaryDetails.gratuity || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right sd-deduction">₹{Number(salaryDetails.insuranceEmployer || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right sd-deduction">₹{Number(salaryDetails.esicEmployer || 0).toFixed(2)}</td>

{/* Employee Deductions */}
<td className="sd-table-cell sd-align-right sd-deduction">₹{Number(salaryDetails.advanceRecovery || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right sd-deduction">₹{Number(salaryDetails.employeePF || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right sd-deduction">₹{Number(salaryDetails.esic || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right sd-deduction">₹{Number(salaryDetails.professionalTax || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right sd-deduction">₹{Number(salaryDetails.tds || 0).toFixed(2)}</td>
<td className="sd-table-cell sd-align-right sd-deduction">₹{Number(salaryDetails.insurance || 0).toFixed(2)}</td>

{/* Totals */}
<td className="sd-table-cell sd-align-right"><strong>₹{localGross.toFixed(2)}</strong></td>
<td className="sd-table-cell sd-align-right"><strong>₹{finalCTC.toFixed(2)}</strong></td>
<td className="sd-table-cell sd-align-right"><strong>₹{localNet.toFixed(2)}</strong></td>
{/* ✅ Base Net Salary at the end — matches header */}
<td className="sd-table-cell sd-align-right">
  <strong>₹{baseNetSalary.toFixed(2)}</strong>
</td>
<AttendanceDeductionCells
  deductions={attendanceDeductions}
  approvedLeaveCount={attendanceDeductions.approvedLeaveCount}
  lopDays={lopDays}
  lopDeduction={lopDeduction}
/>
<td className="sd-table-cell sd-align-right">
  <strong>₹{adjustedNetSalary.toFixed(2)}</strong>
</td>
          </tr>
        );
      })}
    </tbody>
  );
};

  const renderPreviewTableRows = (employeesToRender) => {
    return (
      <tbody>
        {employeesToRender.map((emp) => {
          const monthlyBonusPay = calculateMonthlyBonusPay(
            emp.ctc,
            bonusRecords
          );
          const lopData = employeeLopData[emp.employee_id] || {
            currentMonth: { days: 0, value: "0.00", currency: "INR" },
          };
          const lopDeduction = parseFloat(lopData.yearly?.value || "0.00");

          const salaryDetails = calculateSalaryDetails(
            emp.ctc,
            emp.plan_data,
            emp.employee_id,
            overtimeRecords || [],
            bonusRecords || [],
            advances || [],
            employeeIncentiveData || {},
            employeeLopData
          );

                 const advanceRecovery = Number(salaryDetails.advanceRecovery || 0);

const { localNet } = calculateLocalGrossNet(
    salaryDetails,
    emp.plan_data,
    lopDeduction,
    advanceRecovery
);
          const netSalary = localNet > 0 ? localNet : 0;
          const attendanceDeductions = attendanceDeductionData[emp.employee_id] || {};
          const deductionAmounts = getAttendanceDeductionAmounts(attendanceDeductions);
          const adjustedNetSalary = Math.max(
            0,
            netSalary -
              deductionAmounts.lateLogin -
              deductionAmounts.missPunchOut -
              deductionAmounts.lessLoginHours
          );

          return (
            <tr key={emp.employee_id}>
              <td className="sd-preview-table-cell">{emp.employee_id}</td>
              <td className="sd-preview-table-cell">{emp.full_name}</td>
              <td className="sd-preview-table-cell">
                {personalMap[emp.employee_id]?.pan_number || "N/A"}
              </td>
              <td className="sd-preview-table-cell">
                {personalMap[emp.employee_id]?.uan_number || "N/A"}
              </td>
              <td className="sd-preview-table-cell sd-align-right">
                {adjustedNetSalary > 0 ? `₹${adjustedNetSalary.toLocaleString()}` : "N/A"}
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  const formatPayrollPeriodDate = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(`${dateValue}T00:00:00Z`);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        });
  };
  const payrollPeriodLabel =
    payrollPeriod?.startDate && payrollPeriod?.endDate
      ? `${formatPayrollPeriodDate(payrollPeriod.startDate)} to ${formatPayrollPeriodDate(payrollPeriod.endDate)}`
      : null;

  if (isLoading) {
    return <div className="sd-loading">Loading...</div>;
  }

  return (
    <div className="sd-container">
      <div className="sd-header">
        <div className="sd-header-title">Employee Salary Overview</div>
      </div>
      <div className="sd-info-bar">
        <div className="sd-period-details">
          <div className="sd-working-days">
            Total Working Days: {workingDays !== null ? workingDays : "N/A"}
          </div>
          <div className="sd-payroll-period-note">
            Attendance deductions shown are based on records from{" "}
            {payrollPeriodLabel || "the configured payroll period"}.
          </div>
        </div>
        {attendanceDeductionLoading && (
          <div className="sd-working-days">Calculating attendance deductions...</div>
        )}
        {attendanceDeductionError && (
          <div className="sd-deduction-error" role="alert">
            {attendanceDeductionError}
          </div>
        )}
        <div className="sd-controls-right">
          <div className="sd-search-container">
            <input
              type="text"
              className="sd-search-input"
              placeholder="Search by ID or Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="sd-proceed-button"
            onClick={handleProceed}
            disabled={
              !hasValidCredentials() ||
              attendanceDeductionLoading ||
              Boolean(attendanceDeductionError)
            }
          >
            Proceed to Report
          </button>
        </div>
      </div>
      {filteredEmployees.length > 0 ? (
        <div className="sd-table-section">
          <div className="sd-table-container">
            <div className="sd-table-wrapper">
              <table className="sd-table">
              <thead className="sd-table-head">
  <tr>
    {/* === STICKY COLUMNS (Preserved) === */}
    <th
  className="sd-table-header sd-align-center sd-select-column sd-sticky-col sd-sticky-checkbox"
  style={{ left: 0, borderRight: "1px solid #dee2e6", zIndex: 13 }}
>
  <input
    type="checkbox"
    checked={isAllSelected}
    onChange={handleSelectAll}
    disabled={filteredEmployees.length === 0}
  />
  
</th>
    <th 
      className="sd-table-header sd-align-left sd-id-column sd-sticky-col sd-sticky-id"
      style={{ left: "40px", borderRight: "1px solid #dee2e6", zIndex: 13 }}
    >
      ID
    </th>
    <th 
      className="sd-table-header sd-align-left sd-name-column sd-sticky-col sd-sticky-name"
      style={{ left: "110px", borderRight: "1px solid #dee2e6", zIndex: 13 }}
    >
      Name
    </th>
    <th 
      className="sd-table-header sd-align-right sd-sticky-col sd-sticky-ctc"
      style={{ left: "260px", borderRight: "1px solid #dee2e6", zIndex: 13 }}
    >
      Annual CTC
    </th>

    {/* === EMPLOYEE EARNINGS === */}
    <th className="sd-table-header sd-align-right">Basic Salary</th>
    <th className="sd-table-header sd-align-right">HRA</th>
    <th className="sd-table-header sd-align-right">LTA</th>
    <th className="sd-table-header sd-align-right">Other Allowances</th>
    <th className="sd-table-header sd-align-right">Incentives</th>
    <th className="sd-table-header sd-align-right">Overtime</th>
    <th className="sd-table-header sd-align-right">Statutory Bonus</th>
    <th className="sd-table-header sd-align-right">Bonus</th>

    {/* === EMPLOYER CONTRIBUTIONS === */}
    <th className="sd-table-header sd-align-right">Employer PF</th>
    <th className="sd-table-header sd-align-right">Gratuity</th>
    <th className="sd-table-header sd-align-right">Insurance (Emplyr)</th>
    <th className="sd-table-header sd-align-right">ESIC (Emplyr)</th>

    {/* === EMPLOYEE DEDUCTIONS === */}
    <th className="sd-table-header sd-align-right">Advance Recovery</th>
    <th className="sd-table-header sd-align-right">Employee PF</th>
    <th className="sd-table-header sd-align-right">ESIC (Emp)</th>
    <th className="sd-table-header sd-align-right">Prof. Tax</th>
    <th className="sd-table-header sd-align-right">TDS</th>
    <th className="sd-table-header sd-align-right">Insurance (Emp)</th>

    {/* === TOTALS === */}
    <th className="sd-table-header sd-align-right">Gross Salary</th>
    <th className="sd-table-header sd-align-right">Final CTC</th>
    <th className="sd-table-header sd-align-right">Net Salary</th>
    <th className="sd-table-header sd-align-right">Base Net Salary</th>
    <th className="sd-table-header sd-align-right">Late Login Eligible Count (Total Violations)</th>
    <th className="sd-table-header sd-align-right">Late Login Amount</th>
    <th className="sd-table-header sd-align-right">Approved Leave Count (LOP Days)</th>
    <th className="sd-table-header sd-align-right">LOP Deduction</th>
    <th className="sd-table-header sd-align-right">Miss Punch Out Eligible Count (Total Violations)</th>
    <th className="sd-table-header sd-align-right">Miss Punch Out Amount</th>
    <th className="sd-table-header sd-align-right">Less Login Hours Eligible Count (Total Violations)</th>
    <th className="sd-table-header sd-align-right">Less Login Hours Amount</th>
    <th className="sd-table-header sd-align-right">Net Salary After Attendance Deductions</th>
  </tr>
</thead>
                {renderTableRows(filteredEmployees)}
              </table>
            </div>
          </div>
        </div>
      ) : (
        <p className="sd-no-data">No employees found</p>
      )}

      {showPreviewModal && (
        <div className="sd-preview-modal">
          <div className="sd-preview-overlay" onClick={handleCloseModal}></div>
          <div className="sd-preview-content">
            <div className="sd-preview-header">
              <h2>
                Selected Employees Salary Preview (
                {validSelectedEmployees.length} valid selected)
              </h2>
              <button className="sd-close-button" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="sd-preview-table-wrapper">
              <table className="sd-preview-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>PAN Number</th>
                    <th>UAN Number</th>
                    <th className="sd-align-right">Net Payable</th>
                  </tr>
                </thead>
                {renderPreviewTableRows(validSelectedEmployees)}
              </table>
            </div>
            <div className="sd-preview-footer">
              <button
                className="sd-download-button"
                onClick={handleDownloadSelected}
              >
                Generate Excel Sheet
              </button>
              <button
                className="sd-save-button"
                onClick={handleSaveData}
                disabled={!hasValidCredentials()}
              >
                Save Data
              </button>
              <button
                className="sd-bank-button"
                onClick={() => setShowBankReportOptions(!showBankReportOptions)}
                disabled={!hasValidCredentials()}
              >
                Generate Bank Report
              </button>
              {showBankReportOptions && (
                <div className="sd-bank-report-options">
                  <button
                    onClick={() => handleDownloadBankReport("excel")}
                    disabled={!hasValidCredentials()}
                  >
                    Excel Only
                  </button>
                  <button
                    onClick={() => handleDownloadBankReport("pdf")}
                    disabled={!hasValidCredentials()}
                  >
                    PDF Only
                  </button>
                  <button
                    onClick={() => handleDownloadBankReport("both")}
                    disabled={!hasValidCredentials()}
                  >
                    Both Excel & PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default SalaryDetails;
