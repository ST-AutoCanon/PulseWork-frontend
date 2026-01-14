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
  parseApplicableMonth,
} from "../../../utils/SalaryCalculations.js";
import { calculateLOPEffect } from "../../../utils/lopCalculations.client.jsx";
import { calculateIncentives } from "../../../utils/IncentiveUtils.js";
import Modal from "../../Modal/Modal.client";

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
  const [employeeIncentiveData, setEmployeeIncentiveData] = useState({});
  const [personalMap, setPersonalMap] = useState({});
  const [validSelectedEmployees, setValidSelectedEmployees] = useState([]);
  const [workingDays, setWorkingDays] = useState(null);
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
      } else if (
        bonus.percentage_ctc &&
        !isNaN(parseFloat(bonus.percentage_ctc))
      ) {
        bonusAmount =
          (parseFloat(bonus.percentage_ctc) / 100) * parseFloat(empCtc || 0);
      } else if (
        bonus.percentage_monthly_salary &&
        !isNaN(parseFloat(bonus.percentage_monthly_salary))
      ) {
        bonusAmount = parseFloat(bonus.percentage_monthly_salary) * monthlyCTC;
      }
      return sum + bonusAmount;
    }, 0);
  };

  const calculateLocalGrossNet = (
    salaryDetails,
    monthlyBonusPay,
    lopDeduction,
    planData
  ) => {
    if (!salaryDetails) {
      return { localGross: 0, localNet: 0 };
    }
    const monthlyEarningsSum = [
      salaryDetails.basicSalary || 0,
      salaryDetails.hra || 0,
      salaryDetails.ltaAllowance || 0,
      salaryDetails.otherAllowances || 0,
      salaryDetails.incentivePay || 0,
      salaryDetails.overtimePay || 0,
      salaryDetails.statutoryBonus || 0,
      monthlyBonusPay,
    ].reduce((sum, val) => sum + parseFloat(val || 0), 0);

    let monthlyDeductionsSum = 0;

    monthlyDeductionsSum += parseFloat(salaryDetails.advanceRecovery || 0);
    monthlyDeductionsSum += parseFloat(salaryDetails.tds || 0);
    monthlyDeductionsSum += lopDeduction;

    if (planData.pfEmployeeIncludeInCtc !== false) {
      monthlyDeductionsSum += parseFloat(salaryDetails.employeePF || 0);
    }
    if (planData.pfEmployerIncludeInCtc !== false) {
      monthlyDeductionsSum += parseFloat(salaryDetails.employerPF || 0);
    }
    if (planData.esicEmployeeIncludeInCtc !== false) {
      monthlyDeductionsSum += parseFloat(salaryDetails.esic || 0);
    }
    if (planData.gratuityIncludeInCtc !== false) {
      monthlyDeductionsSum += parseFloat(salaryDetails.gratuity || 0);
    }
    if (planData.professionalTaxIncludeInCtc !== false) {
      monthlyDeductionsSum += parseFloat(salaryDetails.professionalTax || 0);
    }
    if (planData.insuranceEmployeeIncludeInCtc !== false) {
      monthlyDeductionsSum += parseFloat(salaryDetails.insurance || 0);
    }

    const localGross = monthlyEarningsSum;
    const localNet = localGross - monthlyDeductionsSum;
    return { localGross, localNet };
  };

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
    if (!employees.length || !meId) return;

    const loadAllLOP = async () => {
      const lopMap = {};

      for (const emp of employees) {
        const lopResult = await calculateLOPEffect({
          employeeId: emp.employee_id,
          meId,
          orgId,
        });

        lopMap[emp.employee_id] = lopResult;
      }

      setEmployeeLopData(lopMap);
    };

    loadAllLOP();
  }, [employees, meId, orgId]);

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
    if (selectedEmployees.size === 0) {
      showAlert("Please select at least one employee.");
      return;
    }
    try {
      const employeeIds = Array.from(selectedEmployees);
      const personalRes = await axios.post(
        `${BASE_URL}/api/compensation/employee-personal-details`,
        { employeeIds },
        {
          withCredentials: true,
          headers: {
            "x-employee-id": meId,
            "x-org-id": orgId,
            "Content-Type": "application/json",
          },
        }
      );
      setPersonalMap(personalRes.data.data || {});

      const allSelected = getSelectedEmployees();
      const validEmployees = allSelected.filter((emp) => {
        try {
          if (!employeeLopData || !employeeLopData[emp.employee_id]) {
            return false;
          }

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

          return !!salaryDetails;
        } catch (e) {
          console.error(
            `Error calculating salary details for ${emp.employee_id}:`,
            e
          );
          return false;
        }
      });

      if (validEmployees.length === 0) {
        showAlert(
          "No valid employees selected for processing. Please check the selected employees."
        );
        return;
      }

      setValidSelectedEmployees(validEmployees);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error fetching personal details for preview:", error);
      if (error.response?.status === 400 || error.response?.status === 401) {
        showAlert("Authentication failed. Please log in again.");
      } else {
        showAlert("Failed to fetch employee details for preview");
      }
    }
  };

  const handleCloseModal = () => {
    setShowPreviewModal(false);
    setValidSelectedEmployees([]);
    setPersonalMap({});
    setShowBankReportOptions(false);
  };

  const downloadExcel = (employeesToExport = filteredEmployees) => {
    if (employeesToExport.length === 0) return;

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
        return Array(23).fill("N/A");
      }

      const monthlyBonusPay = calculateMonthlyBonusPay(emp.ctc, bonusRecords);

      const lopData = employeeLopData[emp.employee_id] || {
        currentMonth: { days: 0, value: "0.00", currency: "INR" },
      };
      const lopDays = parseFloat(lopData.yearly?.days || 0);
      const lopDeduction = parseFloat(lopData.yearly?.value || "0.00");

      const { localGross, localNet } = calculateLocalGrossNet(
        salaryDetails,
        monthlyBonusPay,
        lopDeduction,
        emp.plan_data
      );

      return [
        emp.employee_id,
        emp.full_name,
        emp.ctc ? parseFloat(emp.ctc) : 0,
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
        salaryDetails.gratuity || 0,
        salaryDetails.professionalTax || 0,
        salaryDetails.tds || 0,
        salaryDetails.insurance || 0,
        lopDays,
        lopDeduction,
        localGross,
        localNet > 0 ? localNet : 0,
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
      "Gratuity",
      "Professional Tax",
      "TDS",
      "Insurance",
      "LOP Days",
      "LOP Deduction",
      "Gross Salary",
      "Net Salary",
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
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salary Details");
    XLSX.writeFile(wb, "salary-details.xlsx");
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

      const { localNet } = calculateLocalGrossNet(
        salaryDetails,
        monthlyBonusPay,
        lopDeduction,
        emp.plan_data
      );
      const netSalary = localNet > 0 ? localNet : 0;

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
          netSalary > 0 ? `₹${netSalary.toLocaleString()}` : "N/A",
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

            const monthlyBonusPay = calculateMonthlyBonusPay(
              emp.ctc,
              bonusRecords
            );

            const lopData = employeeLopData[emp.employee_id] || {
              currentMonth: { days: 0, value: "0.00", currency: "INR" },
            };
            const lopDays = parseFloat(lopData.yearly?.days || 0);
            const lopDeduction = parseFloat(lopData.yearly?.value || "0.00");

            const { localGross, localNet } = calculateLocalGrossNet(
              salaryDetails,
              monthlyBonusPay,
              lopDeduction,
              emp.plan_data
            );

            return {
              employee_id: emp.employee_id,
              full_name: emp.full_name,
              annual_ctc: emp.ctc,
              basic_salary: salaryDetails.basicSalary || 0,
              hra: salaryDetails.hra || 0,
              lta: salaryDetails.ltaAllowance || 0,
              other_allowances: salaryDetails.otherAllowances || 0,
              incentives: salaryDetails.incentivePay || 0,
              overtime: salaryDetails.overtimePay || 0,
              statutory_bonus: salaryDetails.statutoryBonus || 0,
              bonus: monthlyBonusPay,
              advance_recovery: salaryDetails.advanceRecovery || 0,
              employee_pf: salaryDetails.employeePF || 0,
              employer_pf: salaryDetails.employerPF || 0,
              esic: salaryDetails.esic || 0,
              gratuity: salaryDetails.gratuity || 0,
              professional_tax: salaryDetails.professionalTax || 0,
              tds: salaryDetails.tds || 0,
              insurance: salaryDetails.insurance || 0,
              lop_days: lopDays,
              lop_deduction: lopDeduction,
              gross_salary: localGross,
              net_salary: localNet > 0 ? localNet : 0,

              status: "Approved",
              payslip_generation: "disabled",
            };
          } catch (empError) {
            console.error(
              `Error processing employee ${emp.employee_id} for save:`,
              empError
            );
            return null;
          }
        })
        .filter((data) => data !== null);

      if (fullSalaryData.length === 0) {
        showAlert(
          "Failed to generate salary data for any selected employees. Check console for errors."
        );
        return;
      }

      let salaryDataToSave = fullSalaryData;
      try {
        const existingRes = await axios.get(
          `${BASE_URL}/api/salary-details/get-monthly`,
          {
            withCredentials: true,
            params: { month: currentMonthAbbrev, year: currentYear },
            headers: {
              "x-employee-id": meId,
              "x-org-id": orgId,
              "Content-Type": "application/json",
            },
          }
        );
        const existingSalaryData = existingRes.data.data || [];
        const mergedSalaryData = [...existingSalaryData];
        fullSalaryData.forEach((newItem) => {
          const index = mergedSalaryData.findIndex(
            (item) => item.employee_id === newItem.employee_id
          );
          if (index > -1) {
            mergedSalaryData[index] = {
              ...mergedSalaryData[index],
              ...newItem,
            };
          } else {
            mergedSalaryData.push(newItem);
          }
        });
        salaryDataToSave = mergedSalaryData;
      } catch (fetchError) {
        console.warn(
          "Could not fetch existing data, proceeding with new data only:",
          fetchError
        );
      }

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
            console.error(
              `Error calculating salary details for ${emp.employee_id}:`,
              e
            );
            salaryDetails = null;
          }

          if (!salaryDetails) {
            return (
              <tr
                key={emp.employee_id}
                className={isApproved(emp.employee_id) ? "sd-row-disabled" : ""}
              >
                <td
                  className="sd-table-cell sd-align-center sd-select-column sd-sticky-col sd-sticky-checkbox"
                  style={{
                    left: 0,
                    borderRight: "1px solid #dee2e6",
                    zIndex: 10,
                  }}
                >
                  <input type="checkbox" checked={false} disabled={true} />
                </td>
                <td
                  className="sd-table-cell sd-align-left sd-id-column sd-sticky-col sd-sticky-id"
                  style={{
                    left: "40px",
                    borderRight: "1px solid #dee2e6",
                    zIndex: 10,
                  }}
                >
                  {emp.employee_id}
                </td>
                <td
                  className="sd-table-cell sd-align-left sd-name-column sd-sticky-col sd-sticky-name"
                  style={{
                    left: "110px",
                    borderRight: "1px solid #dee2e6",
                    zIndex: 10,
                  }}
                >
                  {emp.full_name}
                </td>
                <td
                  className="sd-table-cell sd-align-right sd-sticky-col sd-sticky-ctc"
                  style={{
                    left: "260px",
                    borderRight: "1px solid #dee2e6",
                    zIndex: 10,
                  }}
                >
                  {emp.ctc ? `₹${parseFloat(emp.ctc).toLocaleString()}` : "N/A"}
                </td>
                {Array(20)
                  .fill()
                  .map((_, i) => (
                    <td key={i} className="sd-table-cell sd-align-right">
                      N/A
                    </td>
                  ))}
              </tr>
            );
          }

          const monthlyBonusPay = calculateMonthlyBonusPay(
            emp.ctc,
            bonusRecords
          );

          const lopData = employeeLopData[emp.employee_id] || {
            currentMonth: { days: 0, value: "0.00", currency: "INR" },
          };
          const lopDays = parseFloat(lopData.yearly?.days || 0);
          const lopDeduction = parseFloat(lopData.yearly?.value || "0.00");
          const isSelected = selectedEmployees.has(emp.employee_id);

          const { localGross, localNet } = calculateLocalGrossNet(
            salaryDetails,
            monthlyBonusPay,
            lopDeduction,
            emp.plan_data
          );

          return (
            <tr
              key={emp.employee_id}
              className={isApproved(emp.employee_id) ? "sd-row-disabled" : ""}
            >
              <td
                className="sd-table-cell sd-align-center sd-select-column sd-sticky-col sd-sticky-checkbox"
                style={{
                  left: 0,
                  borderRight: "1px solid #dee2e6",
                  zIndex: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isApproved(emp.employee_id)}
                  onChange={() => handleRowSelect(emp.employee_id)}
                />
              </td>
              <td
                className="sd-table-cell sd-align-left sd-id-column sd-sticky-col sd-sticky-id"
                style={{
                  left: "40px",
                  borderRight: "1px solid #dee2e6",
                  zIndex: 10,
                }}
              >
                {emp.employee_id}
              </td>
              <td
                className="sd-table-cell sd-align-left sd-name-column sd-sticky-col sd-sticky-name"
                style={{
                  left: "110px",
                  borderRight: "1px solid #dee2e6",
                  zIndex: 10,
                }}
              >
                {emp.full_name}
              </td>
              <td
                className="sd-table-cell sd-align-right sd-sticky-col sd-sticky-ctc"
                style={{
                  left: "260px",
                  borderRight: "1px solid #dee2e6",
                  zIndex: 10,
                }}
              >
                {emp.ctc ? `₹${parseFloat(emp.ctc).toLocaleString()}` : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right">
                {salaryDetails.basicSalary > 0
                  ? `₹${salaryDetails.basicSalary.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right">
                {salaryDetails.hra > 0
                  ? `₹${salaryDetails.hra.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right">
                {salaryDetails.ltaAllowance > 0
                  ? `₹${salaryDetails.ltaAllowance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right">
                {salaryDetails.otherAllowances > 0
                  ? `₹${salaryDetails.otherAllowances.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right">
                {salaryDetails.incentivePay > 0
                  ? `₹${salaryDetails.incentivePay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right">
                {salaryDetails.overtimePay > 0
                  ? `₹${salaryDetails.overtimePay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right">
                {salaryDetails.statutoryBonus > 0
                  ? `₹${salaryDetails.statutoryBonus.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right">
                {monthlyBonusPay > 0
                  ? `₹${monthlyBonusPay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right sd-deduction">
                {salaryDetails.advanceRecovery > 0
                  ? `₹${salaryDetails.advanceRecovery.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right sd-deduction">
                {salaryDetails.employeePF > 0
                  ? `₹${salaryDetails.employeePF.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right sd-deduction">
                {salaryDetails.employerPF > 0
                  ? `₹${salaryDetails.employerPF.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right sd-deduction">
                {salaryDetails.esic > 0
                  ? `₹${salaryDetails.esic.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right sd-deduction">
                {salaryDetails.gratuity > 0
                  ? `₹${salaryDetails.gratuity.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right sd-deduction">
                {salaryDetails.professionalTax > 0
                  ? `₹${salaryDetails.professionalTax.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right sd-deduction">
                {salaryDetails.tds > 0
                  ? `₹${salaryDetails.tds.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right sd-deduction">
                {salaryDetails.insurance > 0
                  ? `₹${salaryDetails.insurance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right sd-deduction">
                {lopDays > 0 ? lopDays.toFixed(0) : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right sd-deduction">
                {lopDeduction > 0
                  ? `₹${lopDeduction.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right">
                {localGross > 0
                  ? `₹${localGross.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
              </td>
              <td className="sd-table-cell sd-align-right">
                {localNet > 0
                  ? `₹${localNet.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "N/A"}
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

          const { localNet } = calculateLocalGrossNet(
            salaryDetails,
            monthlyBonusPay,
            lopDeduction,
            emp.plan_data
          );
          const netSalary = localNet > 0 ? localNet : 0;

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
                {netSalary > 0 ? `₹${netSalary.toLocaleString()}` : "N/A"}
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  if (isLoading) {
    return <div className="sd-loading">Loading...</div>;
  }

  return (
    <div className="sd-container">
      <div className="sd-header">
        <div className="sd-header-title">Employee Salary Overview</div>
      </div>
      <div className="sd-info-bar">
        <div className="sd-working-days">
          Total Working Days: {workingDays !== null ? workingDays : "N/A"}
        </div>
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
            disabled={!hasValidCredentials()}
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
                    <th
                      className="sd-table-header sd-align-center sd-select-column sd-sticky-col sd-sticky-checkbox"
                      style={{
                        left: 0,
                        borderRight: "1px solid #dee2e6",
                        zIndex: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th
                      className="sd-table-header sd-align-left sd-id-column sd-sticky-col sd-sticky-id"
                      style={{
                        left: "40px",
                        borderRight: "1px solid #dee2e6",
                        zIndex: 13,
                      }}
                    >
                      ID
                    </th>
                    <th
                      className="sd-table-header sd-align-left sd-name-column sd-sticky-col sd-sticky-name"
                      style={{
                        left: "110px",
                        borderRight: "1px solid #dee2e6",
                        zIndex: 13,
                      }}
                    >
                      Name
                    </th>
                    <th
                      className="sd-table-header sd-align-right sd-sticky-col sd-sticky-ctc"
                      style={{
                        left: "260px",
                        borderRight: "1px solid #dee2e6",
                        zIndex: 13,
                      }}
                    >
                      Annual CTC
                    </th>
                    <th className="sd-table-header sd-align-right">
                      Basic Salary
                    </th>
                    <th className="sd-table-header sd-align-right">HRA</th>
                    <th className="sd-table-header sd-align-right">LTA</th>
                    <th className="sd-table-header sd-align-right">
                      Other Allowances
                    </th>
                    <th className="sd-table-header sd-align-right">
                      Incentives
                    </th>
                    <th className="sd-table-header sd-align-right">Overtime</th>
                    <th className="sd-table-header sd-align-right">
                      Statutory Bonus
                    </th>
                    <th className="sd-table-header sd-align-right">Bonus</th>
                    <th className="sd-table-header sd-align-right sd-deduction">
                      Advance Recovery
                    </th>
                    <th className="sd-table-header sd-align-right sd-deduction">
                      Employee PF
                    </th>
                    <th className="sd-table-header sd-align-right sd-deduction">
                      Employer PF
                    </th>
                    <th className="sd-table-header sd-align-right sd-deduction">
                      ESIC
                    </th>
                    <th className="sd-table-header sd-align-right sd-deduction">
                      Gratuity
                    </th>
                    <th className="sd-table-header sd-align-right sd-deduction">
                      Professional Tax
                    </th>
                    <th className="sd-table-header sd-align-right sd-deduction">
                      TDS
                    </th>
                    <th className="sd-table-header sd-align-right sd-deduction">
                      Insurance
                    </th>
                    <th className="sd-table-header sd-align-right sd-deduction">
                      LOP Days
                    </th>
                    <th className="sd-table-header sd-align-right sd-deduction">
                      LOP Deduction
                    </th>
                    <th className="sd-table-header sd-align-right">
                      Gross Salary
                    </th>
                    <th className="sd-table-header sd-align-right">
                      Net Salary
                    </th>
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
