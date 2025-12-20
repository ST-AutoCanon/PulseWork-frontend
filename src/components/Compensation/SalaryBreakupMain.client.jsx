"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import debounce from "lodash/debounce";
import { useAuth } from "../../context/AuthProvider.client";
import Header from "./Header/Header.client";

import TotalsContainer from "./TotalsContainer/TotalsContainer.client";
import EmployeeTable from "./EmployeeTable/EmployeeTable.client";
import SalaryDetails from "./SalaryDetails/SalaryDetails.js";
import AllDetailsView from "./AllDetailsView/AllDetailsView.client";
import NoPlanDetails from "./NoPlanDetails/NoPlanDetails.client";
import BonusModal from "./BonusModal/BonusModal.client";
import AdvanceModal from "./AdvanceModal/AdvanceModal.client";
import IncentivesModal from "./incentivesModal/incentivesModal.js";
import AssignModal from "./AssignModal/AssignModal.js";
import MessageModal from "./../Modal/Modal.client";
import "./SalaryBreakupMain.css";
import {
  calculateSalaryDetails,
  calculateTotals,
  getMonthlySalary,
} from "../../utils/SalaryCalculations.js";
import { calculateLOPEffect } from "../../utils/lopCalculations.client.jsx";
import { calculateIncentives } from "../../utils/IncentiveUtils.js";

const SalaryBreakupMain = () => {
  console.log("SalaryBreakupMain mounted");

  const { user } = useAuth();
  console.log("User from auth:", user);


  const meId = user?.employeeId ?? user?.id ?? user?.employee_id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Core states
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [bonusRecords, setBonusRecords] = useState([]);
  const [employeeLopData, setEmployeeLopData] = useState({});
  const [employeeIncentiveData, setEmployeeIncentiveData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("yearly");
  const [menuOpen, setMenuOpen] = useState(false);

  // Modal states
  const [bonusModal, setBonusModal] = useState({
    isVisible: false,
    percentageCtc: "",
    monthlySalaryCount: "",
    fixedAmount: "",
    selectedMonth: "",
    selectedYear: new Date().getFullYear().toString(),
    selectedOption: "",
    error: "",
  });

  const [advanceModal, setAdvanceModal] = useState({
    isVisible: false,
    employeeId: null,
    fullName: "",
    advanceAmount: "",
    recoveryMonths: "",
    applicableMonth: "",
    error: "",
    threeMonthsSalary: 0,
  });

  const [incentivesModal, setIncentivesModal] = useState({
    isVisible: false,
    employeeId: null,
    fullName: "",
    incentiveType: "ctc",
    ctcPercentage: "",
    salesAmount: "",
    applicableMonth: "",
    error: "",
  });

  const [messageModal, setMessageModal] = useState({
    isVisible: false,
    title: "",
    message: "",
    isError: false,
  });

  const [assignModal, setAssignModal] = useState({
    isVisible: false,
    employeeId: null,
    fullName: "",
    compensationList: [],
    selectedCompensation: "",
    error: "",
  });

  // View and UI states
  const [viewMode, setViewMode] = useState("main");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsTab, setShowDetailsTab] = useState(false);
  const [tableHeight, setTableHeight] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Refs and constants
  const tableRef = useRef(null);
  const rowsPerPage = 7;
  const debouncedSetSearchTerm = useCallback(debounce((value) => setSearchTerm(value), 300), []);

  // Endpoints (inspired by reference structure)
  const ENDPOINTS = {
    employeesNames: `${BASE_URL}/api/employees/names`,
    compensationsList: `${BASE_URL}/api/compensations/list`,
    assigned: `${BASE_URL}/api/compensation/assigned`,
    advanceDetails: `${BASE_URL}/api/compensation/advance-details`,
    overtimeSummary: `${BASE_URL}/api/compensation/overtime-status-summary`,
    bonusList: `${BASE_URL}/api/compensation/bonus-list`,
    addBonusBulk: `${BASE_URL}/api/compensation/add-bonus-bulk`,
    incentivesList: `${BASE_URL}/api/incentives`,
    addIncentives: `${BASE_URL}/api/incentives`,
    addAdvance: `${BASE_URL}/api/compensation/advance`,
    assignCompensation: `${BASE_URL}/api/compensation/assign`,
  };

 const headers = {
  "x-api-key": API_KEY,
  "x-employee-id": meId,
  "x-org-id": user?.orgId ?? user?.raw?.org_id, // ✅ FORCE SEND
};

  // Utility functions
  const convertToMonthYear = (monthYearStr) => {
    if (!monthYearStr) return null;

    if (/^\d{4}-\d{2}$/.test(monthYearStr)) {
      const [year, month] = monthYearStr.split('-');
      const monthNum = parseInt(month, 10);
      if (monthNum >= 1 && monthNum <= 12 && parseInt(year, 10) >= 1900 && parseInt(year, 10) <= 2100) {
        return monthYearStr;
      }
    }

    let parts = monthYearStr.split(" ");
    if (parts.length === 2) {
      const monthName = parts[0].trim().toLowerCase();
      const yearStr = parts[1].trim();
      const year = parseInt(yearStr, 10);
      if (!isNaN(year) && year >= 1900 && year <= 2100) {
        const monthMap = {
          'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3, 'april': 4, 'apr': 4,
          'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7, 'august': 8, 'aug': 8,
          'september': 9, 'sept': 9, 'sep': 9, 'october': 10, 'oct': 10, 'november': 11, 'nov': 11,
          'december': 12, 'dec': 12
        };
        const monthNum = monthMap[monthName];
        if (monthNum) {
          return `${year}-${monthNum.toString().padStart(2, '0')}`;
        }
      }
    }

    parts = monthYearStr.split("-");
    if (parts.length === 2) {
      const [monthName, yearStr] = parts.map(p => p.trim().toLowerCase());
      const year = parseInt(yearStr, 10);
      if (!isNaN(year) && year >= 1900 && year <= 2100) {
        const monthMap = {
          'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3, 'april': 4, 'apr': 4,
          'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7, 'august': 8, 'aug': 8,
          'september': 9, 'sept': 9, 'sep': 9, 'october': 10, 'oct': 10, 'november': 11, 'nov': 11,
          'december': 12, 'dec': 12
        };
        const monthNum = monthMap[monthName];
        if (monthNum) {
          return `${year}-${monthNum.toString().padStart(2, '0')}`;
        }
      }
    }

    return null;
  };

  const getAvailableMonths = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    return [
      {
        value: `${currentYear}-${currentMonth.toString().padStart(2, "0")}`,
        label: new Date(currentYear, currentMonth - 1).toLocaleString("en-US", { month: "long", year: "numeric" }),
      },
      {
        value: `${nextYear}-${nextMonth.toString().padStart(2, "0")}`,
        label: new Date(nextYear, nextMonth - 1).toLocaleString("en-US", { month: "long", year: "numeric" }),
      },
    ];
  };

  // Modal handlers
  const openBonusModal = () => {
    setBonusModal({
      isVisible: true,
      percentageCtc: "",
      monthlySalaryCount: "",
      fixedAmount: "",
      selectedMonth: "",
      selectedYear: new Date().getFullYear().toString(),
      selectedOption: "",
      error: "",
    });
    setMenuOpen(false);
  };
const handleBonusSubmit = async () => {
  const {
    percentageCtc,
    monthlySalaryCount,
    fixedAmount,
    selectedMonth,
    selectedYear,
    selectedOption,
  } = bonusModal;

  const validMonths = [
    "01","02","03","04","05","06",
    "07","08","09","10","11","12"
  ];

  /* ---------------- VALIDATIONS ---------------- */

  if (!selectedOption) {
    setBonusModal(prev => ({
      ...prev,
      error: "Please select one bonus option.",
    }));
    return;
  }

  if (
    selectedOption === "percentageCtc" &&
    (!percentageCtc || percentageCtc <= 0 || percentageCtc > 100)
  ) {
    setBonusModal(prev => ({
      ...prev,
      error: "CTC percentage must be between 1 and 100.",
    }));
    return;
  }

  if (
    selectedOption === "monthlySalaryCount" &&
    (!monthlySalaryCount || monthlySalaryCount < 1 || monthlySalaryCount > 10)
  ) {
    setBonusModal(prev => ({
      ...prev,
      error: "Monthly salary count must be between 1 and 10.",
    }));
    return;
  }

  if (
    selectedOption === "fixedAmount" &&
    (!fixedAmount || fixedAmount <= 0)
  ) {
    setBonusModal(prev => ({
      ...prev,
      error: "Fixed amount must be greater than 0.",
    }));
    return;
  }

  if (!selectedMonth || !validMonths.includes(selectedMonth)) {
    setBonusModal(prev => ({
      ...prev,
      error: "Please select a valid month.",
    }));
    return;
  }

  if (!selectedYear || !/^\d{4}$/.test(selectedYear)) {
    setBonusModal(prev => ({
      ...prev,
      error: "Please select a valid year.",
    }));
    return;
  }

  const applicableMonth = `${selectedYear}-${selectedMonth}`;

  /* ---------------- DUPLICATE CHECK ---------------- */

  try {
    setIsLoading(true);

    const listRes = await axios.get(ENDPOINTS.bonusList, {withCredentials: true, headers });

    if (listRes.data?.success) {
      const exists = listRes.data.data?.some(
        b => b.applicable_month === applicableMonth
      );

      if (exists) {
        setBonusModal(prev => ({
          ...prev,
          error: `Bonus already exists for ${applicableMonth}`,
        }));
        return;
      }
    }
  } catch (err) {
    setBonusModal(prev => ({
      ...prev,
      error: "Failed to check existing bonus.",
    }));
    return;
  } finally {
    setIsLoading(false);
  }

  /* ---------------- PAYLOAD ---------------- */

  const payload = {
    percentageCtc:
      selectedOption === "percentageCtc"
        ? Number(percentageCtc)
        : null,

    percentageMonthlySalary:
      selectedOption === "monthlySalaryCount"
        ? Number(monthlySalaryCount) * 100
        : null,

    fixedAmount:
      selectedOption === "fixedAmount"
        ? Number(fixedAmount)
        : null,

    applicableMonth,
  };

  /* ---------------- SUBMIT ---------------- */

  try {
    setIsLoading(true);

    const response = await axios.post(
      ENDPOINTS.addBonusBulk,
      payload,
      {withCredentials: true, headers }
    );

    if (response.data?.success) {
      // ✅ SHOW SUCCESS MODAL
      openMessageModal(
        "Success",
        `Bonus added successfully for ${selectedMonth}-${selectedYear}`
      );

      // ✅ REFRESH BONUS LIST
      const refreshed = await axios.get(ENDPOINTS.bonusList, { withCredentials: true,headers });
      setBonusRecords(refreshed.data.data || []);

      // ✅ CLOSE BONUS MODAL (AFTER MESSAGE)
      setTimeout(() => {
        setBonusModal(prev => ({
          ...prev,
          isVisible: false,
          error: "",
        }));
      }, 300);
    } else {
      setBonusModal(prev => ({
        ...prev,
        error: response.data?.error || "Failed to add bonus.",
      }));
    }
  } catch (error) {
    setBonusModal(prev => ({
      ...prev,
      error: error.response?.data?.error || "Network error.",
    }));
  } finally {
    setIsLoading(false);
  }
};

 
  const openAdvanceModal = (employeeId, fullName) => {
    const monthlySalary = getMonthlySalary(employeeId, employees);
    const threeMonthsSalary = monthlySalary * 3;
    setAdvanceModal({
      isVisible: true,
      employeeId,
      fullName,
      advanceAmount: "",
      recoveryMonths: "",
      applicableMonth: "",
      error: "",
      threeMonthsSalary,
    });
  };

  const handleAdvanceSubmit = async () => {
    const { employeeId, advanceAmount, recoveryMonths, applicableMonth, threeMonthsSalary } = advanceModal;

    // Validations
    if (!employeeId) {
      setAdvanceModal({ ...advanceModal, error: "Employee ID missing." });
      return;
    }
    if (!advanceAmount || parseFloat(advanceAmount) <= 0) {
      setAdvanceModal({ ...advanceModal, error: "Enter a valid advance amount." });
      return;
    }
    if (parseFloat(advanceAmount) > threeMonthsSalary) {
      setAdvanceModal({ ...advanceModal, error: "Advance cannot exceed three months' salary." });
      return;
    }
    if (!recoveryMonths || parseInt(recoveryMonths) <= 0) {
      setAdvanceModal({ ...advanceModal, error: "Enter valid recovery months." });
      return;
    }
    if (!applicableMonth) {
      setAdvanceModal({ ...advanceModal, error: "Select applicable month." });
      return;
    }

    // Check existing advance
    const existingAdvance = advances.find(
      (advance) => advance.employee_id === employeeId && advance.applicable_months === applicableMonth
    );
    if (existingAdvance) {
      setAdvanceModal({
        ...advanceModal,
        error: `An advance of ₹${existingAdvance.advance_amount} already exists for ${employeeId} in ${applicableMonth}. Multiple advances for the same month are not allowed.`,
      });
      return;
    }

    const payload = { employeeId, advanceAmount, recoveryMonths, applicableMonth };

    try {
      setIsLoading(true);
      const response = await axios.post(ENDPOINTS.addAdvance, payload, { withCredentials: true, headers, "Content-Type": "application/json" });
      if (response.data.success || response.data.message === "Advance added successfully") {
        setAdvanceModal({
          isVisible: false,
          employeeId: null,
          fullName: "",
          advanceAmount: "",
          recoveryMonths: "",
          applicableMonth: "",
          error: "",
          threeMonthsSalary: 0,
        });
        openMessageModal("Success", "Advance added successfully!", false);
        const advancesRes = await axios.get(ENDPOINTS.advanceDetails, {withCredentials: true, headers });
        setAdvances(advancesRes.data.data || []);
      } else {
        setAdvanceModal({ ...advanceModal, error: response.data.message || "Failed to add advance." });
      }
    } catch (error) {
      setAdvanceModal({ ...advanceModal, error: error.response?.data?.message || "Network error." });
    } finally {
      setIsLoading(false);
    }
  };

  const openIncentiveModal = (employeeId, fullName) => {
    setIncentivesModal({
      isVisible: true,
      employeeId,
      fullName,
      incentiveType: "ctc",
      ctcPercentage: "",
      salesAmount: "",
      applicableMonth: "",
      error: "",
    });
  };

  const handleIncentiveSubmit = async () => {
    const { employeeId, incentiveType, ctcPercentage, salesAmount, applicableMonth } = incentivesModal;

    // Validations
    if (!employeeId) {
      setIncentivesModal({ ...incentivesModal, error: "Employee ID missing." });
      return;
    }
    if (!incentiveType) {
      setIncentivesModal({ ...incentivesModal, error: "Select incentive type." });
      return;
    }
    if (incentiveType === "ctc" && (!ctcPercentage || parseFloat(ctcPercentage) <= 0)) {
      setIncentivesModal({ ...incentivesModal, error: "Enter a valid CTC percentage." });
      return;
    }
    if (incentiveType === "sales" && (!salesAmount || parseFloat(salesAmount) <= 0)) {
      setIncentivesModal({ ...incentivesModal, error: "Enter a valid sales amount." });
      return;
    }
    if (!applicableMonth) {
      setIncentivesModal({ ...incentivesModal, error: "Select applicable month." });
      return;
    }

    const convertedApplicableMonth = convertToMonthYear(applicableMonth);
    if (!convertedApplicableMonth) {
      setIncentivesModal({ ...incentivesModal, error: "Invalid month selected." });
      return;
    }

    // Check existing incentive
    try {
      setIsLoading(true);
      const response = await axios.get(ENDPOINTS.incentivesList, {withCredentials: true, headers });
      if (response.data.success) {
        const existingIncentive = response.data.data.find(
          (incentive) => incentive.employee_id === employeeId && incentive.applicable_month === convertedApplicableMonth
        );
        if (existingIncentive) {
          const amount = existingIncentive.incentive_type === "ctc"
            ? `${existingIncentive.ctc_percentage}% CTC`
            : `₹${existingIncentive.sales_amount} Sales`;
          setIncentivesModal({
            ...incentivesModal,
            error: `An incentive of ${amount} already exists for ${employeeId} in ${convertedApplicableMonth}. Multiple incentives for the same month are not allowed.`,
          });
          return;
        }
      }
    } catch (error) {
      setIncentivesModal({ ...incentivesModal, error: error.response?.data?.message || "Network error while checking existing incentives." });
      return;
    } finally {
      setIsLoading(false);
    }

    // Submit incentive
    const payload = {
      employeeId,
      incentiveType,
      ctcPercentage: incentiveType === "ctc" ? ctcPercentage : null,
      salesAmount: incentiveType === "sales" ? salesAmount : null,
      applicableMonth: convertedApplicableMonth,
    };

    try {
      setIsLoading(true);
      const response = await axios.post(ENDPOINTS.addIncentives, payload, {withCredentials: true, headers, "Content-Type": "application/json" });
      if (response.data.success || response.data.message === "Incentive added successfully") {
        setIncentivesModal({
          isVisible: false,
          employeeId: null,
          fullName: "",
          incentiveType: "ctc",
          ctcPercentage: "",
          salesAmount: "",
          applicableMonth: "",
          error: "",
        });
        openMessageModal("Success", "Incentive added successfully!", false);
        const updatedIncentive = await calculateIncentives(employeeId);
        setEmployeeIncentiveData(prev => ({ ...prev, [employeeId]: updatedIncentive }));
      } else {
        setIncentivesModal({ ...incentivesModal, error: response.data.message || "Failed to add incentive." });
      }
    } catch (error) {
      setIncentivesModal({ ...incentivesModal, error: error.response?.data?.message || "Network error." });
    } finally {
      setIsLoading(false);
    }
  };

  const openAssignModal = async (employeeId, fullName) => {
  try {
    setIsLoading(true);
    const response = await axios.get(ENDPOINTS.compensationsList, { withCredentials: true,headers });
    console.log("Compensation API response:", response.data); // debug

    const validCompensations = Array.isArray(response.data.data) ? response.data.data : [];
    if (validCompensations.length === 0) {
      throw new Error("No compensation plans returned from API.");
    }

    setAssignModal({
      isVisible: true,
      employeeId,
      fullName,
      compensationList: validCompensations,
      selectedCompensation: "",
      error: "",
    });
  } catch (error) {
    openMessageModal("Error", `Failed to fetch compensations: ${error.message}`, true);
  } finally {
    setIsLoading(false);
  }
};


  const handleAssignSubmit = async () => {
    const { selectedCompensation, employeeId, fullName } = assignModal;
    if (!selectedCompensation) {
      setAssignModal({ ...assignModal, error: "Please select a compensation plan." });
      return;
    }
    const compensation = assignModal.compensationList.find((comp) => String(comp.id) === selectedCompensation);
    if (!compensation || isNaN(parseInt(selectedCompensation))) {
      setAssignModal({ ...assignModal, error: "Invalid compensation plan selected. Please select a valid plan." });
      return;
    }

    try {
      setIsLoading(true);
      const assignedResponse = await axios.get(ENDPOINTS.assigned, { withCredentials: true,headers });
      if (!assignedResponse.data.success) {
        throw new Error(assignedResponse.data.message || "Failed to fetch assigned employees");
      }
      const assignedEmployees = Array.isArray(assignedResponse.data.data) ? assignedResponse.data.data : [];
      const assignedEmployee = assignedEmployees.find((emp) => emp.employee_id === employeeId);
      if (assignedEmployee) {
        setAssignModal({
          ...assignModal,
          error: `${fullName} already has a compensation plan assigned: ${assignedEmployee.compensation_plan_name}`,
        });
        return;
      }

      const payload = {
        compensationId: parseInt(selectedCompensation),
        compensationPlanName: compensation.compensation_plan_name,
        employeeId: [employeeId],
        assignedBy: meId,
        assignedDate: new Date().toISOString().split("T")[0],
        departmentIds: [],
      };
      const assignResponse = await axios.post(ENDPOINTS.assignCompensation, payload, {withCredentials: true, headers });
      if (assignResponse.data.success) {
        openMessageModal("Success", `Compensation assigned successfully to ${fullName}!`);
        const compensationsResponse = await axios.get(ENDPOINTS.compensationsList, {withCredentials: true, headers });
        const compensationMap = new Map();
        if (compensationsResponse.data.success) {
          compensationsResponse.data.data.forEach((comp) => {
            compensationMap.set(comp.compensation_plan_name, comp.plan_data);
          });
        }
        const employeesResponse = await axios.get(ENDPOINTS.assigned, { withCredentials: true,headers });
        if (employeesResponse.data.success) {
          const enrichedEmployees = employeesResponse.data.data.map((emp) => ({
            ...emp,
            plan_data: compensationMap.get(emp.compensation_plan_name) || emp.plan_data,
          }));
          setEmployees(enrichedEmployees || []);
        }
        const allEmployeesResponse = await axios.get(ENDPOINTS.employeesNames, {withCredentials: true, headers });
        if (allEmployeesResponse.data.success) {
          setAllEmployees(allEmployeesResponse.data.data || []);
        }
        setAssignModal({ ...assignModal, isVisible: false });
      } else {
        throw new Error(assignResponse.data.message || "Assignment unsuccessful");
      }
    } catch (error) {
      setAssignModal({
        ...assignModal,
        error: `Failed to assign compensation: ${error.response?.data?.message || error.message || "Network error"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // UI handlers
  const toggleMenu = () => setMenuOpen(!menuOpen);

  const openMessageModal = (title, message, isError = false) => {
    setMessageModal({ isVisible: true, title, message, isError });
  };

  const handleViewSalaryDetails = () => {
    setViewMode("salaryDetails");
    setSearchQuery("");
    setCurrentPage(1);
    setMenuOpen(false);
  };

  const handleViewAllDetails = () => {
    setViewMode("allDetails");
    setSearchQuery("");
    setCurrentPage(1);
    setMenuOpen(false);
  };

  const openNoPlanModal = () => {
    setViewMode("noPlanDetails");
    setSearchTerm("");
    setMenuOpen(false);
  };

  const handleViewSingleEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsTab(true);
    if (tableRef.current) {
      setTableHeight(tableRef.current.offsetHeight);
    }
  };

  const handleCloseDetailsTab = () => {
    setShowDetailsTab(false);
    setSelectedEmployee(null);
  };

  const handleBackToMain = () => {
    setViewMode("main");
    setSelectedEmployee(null);
    setSearchQuery("");
    setCurrentPage(1);
    setShowDetailsTab(false);
    setSearchTerm("");
  };
const getCurrentPayrollMonth = () => {
  const now = new Date();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();
  // If payroll processing is for the current month (December 2025 in your case)
  // or next month, adjust here. For testing December 2025:
  // return "2025-12";
  return `${year}-${String(month).padStart(2, '0')}`;
};
  // Data fetching (structured like reference)
 const fetchSalaryBreakupData = async () => {
  console.log('1. fetchSalaryBreakupData STARTED', {
    meId,
    orgId,
    hasAPIKey: !!API_KEY,
    API_KEY_preview: API_KEY ? `${API_KEY.slice(0, 5)}...${API_KEY.slice(-5)}` : 'undefined/missing',
    hasBaseUrl: !!BASE_URL,
    BASE_URL_value: BASE_URL || 'undefined',
    sampleEndpoint: ENDPOINTS.employeesNames || 'undefined',
    fullEndpoints: ENDPOINTS,
  });

  if (!meId) {
    console.log('2. HIT CREDENTIAL GUARD - skipping fetch', {
      API_KEY_missing: !API_KEY,
      meId_missing: !meId,
    });
    openMessageModal("Error", "Authentication credentials are missing. Please check environment variables or login status.", true);
    setIsLoading(false);
    return;
  }

  console.log('3. PASSED credential check - proceeding to fetch');

  setIsLoading(true);

  try {
    console.log('4. ABOUT TO SEND bulk API requests', {
      endpoints: {
        employeesNames: ENDPOINTS.employeesNames,
        compensationsList: ENDPOINTS.compensationsList,
        assigned: ENDPOINTS.assigned,
        advanceDetails: ENDPOINTS.advanceDetails,
        overtimeSummary: ENDPOINTS.overtimeSummary,
        bonusList: ENDPOINTS.bonusList,
      },
      headers: {
        'x-api-key': headers['x-api-key'] ? 'present' : 'missing',
        'x-employee-id': headers['x-employee-id'],
        'x-org-id': headers['x-org-id'],
      },
    });

    const [
      allEmployeesRes,
      compensationsRes,
      employeesRes,
      advancesRes,
      overtimeRes,
      bonusRes,
    ] = await Promise.all([
      axios.get(ENDPOINTS.employeesNames, { withCredentials: true, headers }),
      axios.get(ENDPOINTS.compensationsList, { withCredentials: true, headers }),
      axios.get(ENDPOINTS.assigned, { withCredentials: true, headers }),
      axios.get(ENDPOINTS.advanceDetails, { withCredentials: true, headers }),
      axios.get(ENDPOINTS.overtimeSummary, { withCredentials: true, headers }),
      axios.get(ENDPOINTS.bonusList, { withCredentials: true, headers }),
    ]);

    console.log('5. BULK requests SUCCESSFUL', {
      allEmployeesCount: allEmployeesRes.data?.data?.length ?? 'no data',
      compensationsCount: compensationsRes.data?.data?.length ?? 'no data',
      assignedEmployeesCount: employeesRes.data?.data?.length ?? 'no data',
      advancesCount: advancesRes.data?.data?.length ?? 'no data',
      overtimeCount: overtimeRes.data?.data?.length ?? 'no data',
      bonusCount: bonusRes.data?.data?.length ?? 'no data',
    });

    setAllEmployees(allEmployeesRes.data.data || []);
    const compensationMap = new Map();
    (compensationsRes.data.data || []).forEach((comp) => {
      compensationMap.set(comp.compensation_plan_name, comp.plan_data);
    });

    const enrichedEmployeesMap = new Map();
    (employeesRes.data.data || []).forEach((emp) => {
      if (!enrichedEmployeesMap.has(emp.employee_id)) {
        enrichedEmployeesMap.set(emp.employee_id, {
          ...emp,
          plan_data: compensationMap.get(emp.compensation_plan_name) || emp.plan_data,
        });
      }
    });
    const enrichedEmployees = Array.from(enrichedEmployeesMap.values());
    setEmployees(enrichedEmployees);

    setAdvances(advancesRes.data.data || []);
    setOvertimeRecords(overtimeRes.data.data || []);
    setBonusRecords(bonusRes.data.data || []);

    console.log('6. Starting per-employee LOP & Incentive fetches', {
      employeeCount: enrichedEmployees.length,
    });

    // Fetch LOP data
    const payrollMonthYear = getCurrentPayrollMonth();
    const lopDataPromises = enrichedEmployees.map((emp) =>
  calculateLOPEffect({
    employeeId: emp.employee_id,
    meId,
    orgId,
    referenceMonthYear: payrollMonthYear, // Pass this!
  })
    .catch((err) => {
      console.warn(`LOP fetch failed for ${emp.employee_id}:`, err);
      return emptyLOPResult();
    })
    .then((result) => ({ employeeId: emp.employee_id, lopData: result }))
);
    const lopDataResults = await Promise.all(lopDataPromises);
    setEmployeeLopData(
      lopDataResults.reduce((acc, { employeeId, lopData }) => {
        acc[employeeId] = lopData;
        return acc;
      }, {})
    );

    // Fetch Incentive data
    const incentiveDataPromises = enrichedEmployees.map((emp) =>
      calculateIncentives(emp.employee_id)
        .catch((err) => {
          console.warn(`Incentive fetch failed for ${emp.employee_id}:`, err);
          return {
            ctcIncentive: { value: "0.00", currency: "INR" },
            salesIncentive: { value: "0.00", currency: "INR" },
            totalIncentive: { value: "0.00", currency: "INR" },
          };
        })
        .then((result) => ({ employeeId: emp.employee_id, incentiveData: result }))
    );
    const incentiveDataResults = await Promise.all(incentiveDataPromises);
    setEmployeeIncentiveData(
      incentiveDataResults.reduce((acc, { employeeId, incentiveData }) => {
        if (!acc[employeeId] || parseFloat(incentiveData.totalIncentive.value) > 0) {
          acc[employeeId] = incentiveData;
        }
        return acc;
      }, {})
    );

    console.log('7. All data fetched and states updated successfully');

  } catch (error) {
    console.error('8. FETCH ERROR caught:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : 'no response',
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
      } : 'no config',
    });
    openMessageModal("Error", `Failed to fetch data: ${error.message || "Network error"}`, true);
  } finally {
    console.log('9. FINALLY - setting isLoading false');
    setIsLoading(false);
  }
};


 useEffect(() => {
  console.log('0. useEffect triggered - meId/orgId ready, calling fetchSalaryBreakupData', {
    user,
    meId,
    orgId,
    hasAPIKey: !!API_KEY,
    hasBaseUrl: !!BASE_URL,
  });

  fetchSalaryBreakupData();  // ← THIS IS THE MISSING CALL
}, [meId, orgId]);  // Re-run if meId or orgId changes (safe even if user object changes)

  // Derived data
  const totals = employees.length
    ? calculateTotals(employees, overtimeRecords, bonusRecords, advances)
    : {
        totalPayable: 0,
        totalGross: 0,
        totalTDS: 0,
        totalAdvance: 0,
        totalOvertime: 0,
        totalBonus: 0,
        totalEmployeePF: 0,
        totalEmployerPF: 0,
        totalInsurance: 0,
      };

  const totalLopDeduction = employees.reduce((sum, emp) => {
    const lopData = employeeLopData[emp.employee_id];
    return sum + (lopData ? parseFloat(lopData.currentMonth.value || 0) : 0);
  }, 0);
  totals.totalLopDeduction = totalLopDeduction;

  const employeesWithoutPlans = allEmployees.filter(
    (emp) => !employees.some((assignedEmp) => String(assignedEmp.employee_id) === String(emp.employee_id))
  );

  // Render
  if (isLoading && employees.length === 0) {
    return <div className="sb-main-loading">Loading...</div>;
  }

  return (
    <div className="sb-main-container">
    {viewMode === "main" && (
  <div className="sb-main-table-container">
    <Header
      menuOpen={menuOpen}
      toggleMenu={toggleMenu}
      openNoPlanModal={openNoPlanModal}
      openBonusModal={openBonusModal}
      handleViewAllDetails={handleViewAllDetails}
      handleViewSalaryDetails={handleViewSalaryDetails}
    />
    <TotalsContainer totals={totals} totalLopDeduction={totalLopDeduction} />

    {employees.length === 0 ? (
      <div className="no-data-message">
        <p>No employees have assigned compensation plans yet.</p>
        <p>Use the menu to assign plans or view unassigned employees.</p>
      </div>
    ) : (
      <EmployeeTable
        employees={employees}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        rowsPerPage={rowsPerPage}
        tableRef={tableRef}
        handleViewSingleEmployee={handleViewSingleEmployee}
        openAdvanceModal={openAdvanceModal}
        openIncentiveModal={openIncentiveModal}
        showDetailsTab={showDetailsTab}
        selectedEmployee={selectedEmployee}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tableHeight={tableHeight}
        handleCloseDetailsTab={handleCloseDetailsTab}
        calculateSalaryDetails={calculateSalaryDetails}
        employeeLopData={employeeLopData}
        employeeIncentiveData={employeeIncentiveData}
        overtimeRecords={overtimeRecords}
        bonusRecords={bonusRecords}
        advances={advances}
      />
    )}
  </div>
)}
      {viewMode === "salaryDetails" && (
        <SalaryDetails
          employees={employees}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleBackToMain={handleBackToMain}
          calculateSalaryDetails={calculateSalaryDetails}
          employeeLopData={employeeLopData}
          employeeIncentiveData={employeeIncentiveData}
          overtimeRecords={overtimeRecords}
          bonusRecords={bonusRecords}
          advances={advances}
        />
      )}
      {viewMode === "allDetails" && (
        <AllDetailsView
          employees={employees}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleBackToMain={handleBackToMain}
          calculateSalaryDetails={calculateSalaryDetails}
          employeeLopData={employeeLopData}
          employeeIncentiveData={employeeIncentiveData}
          overtimeRecords={overtimeRecords}
          bonusRecords={bonusRecords}
          advances={advances}
        />
      )}
      {viewMode === "noPlanDetails" && (
        <NoPlanDetails
          allEmployees={allEmployees}
          employees={employees}
          searchTerm={searchTerm}
          debouncedSetSearchTerm={debouncedSetSearchTerm}
          handleBackToMain={handleBackToMain}
          openAssignModal={openAssignModal}
          isLoading={isLoading}
        />
      )}
      {bonusModal.isVisible && (
        <BonusModal
          bonusModal={bonusModal}
          setBonusModal={setBonusModal}
          handleBonusSubmit={handleBonusSubmit}
        />
      )}
      {advanceModal.isVisible && (
        <AdvanceModal
          advanceModal={advanceModal}
          setAdvanceModal={setAdvanceModal}
          handleAdvanceSubmit={handleAdvanceSubmit}
          getAvailableMonths={getAvailableMonths}
          isLoading={isLoading}
          threeMonthsSalary={advanceModal.threeMonthsSalary}
        />
      )}
      {incentivesModal.isVisible && (
        <IncentivesModal
          incentivesModal={incentivesModal}
          setIncentivesModal={setIncentivesModal}
          handleIncentiveSubmit={handleIncentiveSubmit}
          isLoading={isLoading}
          getAvailableMonths={getAvailableMonths}
        />
      )}
      {assignModal.isVisible && (
        <AssignModal
          assignModal={assignModal}
          setAssignModal={setAssignModal}
          handleAssignSubmit={handleAssignSubmit}
        />
      )}
      {messageModal.isVisible && (
        <MessageModal messageModal={messageModal} setMessageModal={setMessageModal} />
      )}
    </div>
  );
};

export default SalaryBreakupMain;
