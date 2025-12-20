

import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import debounce from "lodash/debounce";
import Header from "./Header/Header.js";
import TotalsContainer from "./TotalsContainer/TotalsContainer.js";
import EmployeeTable from "./EmployeeTable/EmployeeTable.js";
import SalaryDetails from "./SalaryDetails/SalaryDetails.js"; // NEW: Import SalaryDetails
import AllDetailsView from "./AllDetailsView/AllDetailsView.js";
import NoPlanDetails from "./NoPlanDetails/NoPlanDetails.js";
import BonusModal from "./BonusModal/BonusModal.js";
import AdvanceModal from "./AdvanceModal/AdvanceModal.js";
import IncentivesModal from "./incentivesModal/incentivesModal.js"; // 🔹 Add import
import AssignModal from "./AssignModal/AssignModal.js";
import MessageModal from "./../Modal/Modal.client.jsx";
import "./SalaryBreakupMain.css";
import {
  calculateSalaryDetails,
  calculateTotals,
  getMonthlySalary,
} from "../../utils/SalaryCalculations.js";
import { calculateLOPEffect } from "../../utils/lopCalculations.client.jsx";
import { calculateIncentives } from "../../utils/IncentiveUtils.js";

const SalaryBreakupMain = () => {
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

  const [incentivesModal, setIncentivesModal] = useState({ // 🔹 Add state
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
// NEW: Handler to switch to SalaryDetails view
const handleViewSalaryDetails = () => {
  setViewMode("salaryDetails"); // NEW: Switch to new view mode
  setSearchQuery(""); // NEW: Reset search
  setCurrentPage(1); // NEW: Reset pagination if needed
  setMenuOpen(false); // NEW: Close menu if open
};
  const [viewMode, setViewMode] = useState("main");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsTab, setShowDetailsTab] = useState(false);
  const [tableHeight, setTableHeight] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const tableRef = useRef(null);
  const rowsPerPage = 7;

    const API_KEY = process.env.REACT_APP_API_KEY;

  const BASE_URL = `${process.env.REACT_APP_BACKEND_URL}`;
  const meId = JSON.parse(localStorage.getItem("dashboardData") || "{}")
    .employeeId;

  const debouncedSetSearchTerm = useCallback(
    debounce((value) => setSearchTerm(value), 300),
    []
  );

  const toggleMenu = () => setMenuOpen(!menuOpen);

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

  const openIncentiveModal = (employeeId, fullName) => { // 🔹 Add handler
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
  const handleBonusSubmit = async () => {
    const {
      percentageCtc,
      monthlySalaryCount,
      fixedAmount,
      selectedMonth,
      selectedYear,
      selectedOption,
    } = bonusModal;
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

    // Existing validations
    if (!selectedOption) {
      setBonusModal({ ...bonusModal, error: "Please select one bonus option." });
      return;
    }
    if (
      selectedOption === "percentageCtc" &&
      (!percentageCtc || parseFloat(percentageCtc) <= 0 || parseFloat(percentageCtc) > 100)
    ) {
      setBonusModal({ ...bonusModal, error: "Please enter a valid CTC percentage (0-100)." });
      return;
    }
    if (
      selectedOption === "monthlySalaryCount" &&
      (!monthlySalaryCount || parseInt(monthlySalaryCount) < 1 || parseInt(monthlySalaryCount) > 10)
    ) {
      setBonusModal({
        ...bonusModal,
        error: "Please select a valid number of monthly salaries (1-10).",
      });
      return;
    }
    if (
      selectedOption === "fixedAmount" &&
      (!fixedAmount || parseFloat(fixedAmount) <= 0)
    ) {
      setBonusModal({
        ...bonusModal,
        error: "Please enter a valid fixed amount greater than 0.",
      });
      return;
    }
    if (!selectedMonth || !months.includes(selectedMonth)) {
      setBonusModal({ ...bonusModal, error: "Please select a valid month." });
      return;
    }
    if (!selectedYear || !/^\d{4}$/.test(selectedYear)) {
      setBonusModal({ ...bonusModal, error: "Please enter a valid year." });
      return;
    }

    const applicableMonth = `${selectedYear}-${selectedMonth.padStart(2, "0")}`;

    // Check for existing bonus for the same month
    try {
      setIsLoading(true);
      const response = await axios.get(`${BASE_URL}/api/compensation/bonus-list`, {withCredentials: true,
        headers: { "x-api-key": API_KEY, "x-employee-id": meId },
      });
      if (response.data.success) {
        const existingBonus = response.data.data.find(
          (bonus) => bonus.applicable_month === applicableMonth
        );
        if (existingBonus) {
          const bonusType =
            existingBonus.percentage_ctc ? `${existingBonus.percentage_ctc}% CTC` :
            existingBonus.percentage_monthly_salary ? `${existingBonus.percentage_monthly_salary / 100} months' salary` :
            `₹${existingBonus.fixed_amount} fixed`;
          setBonusModal({
            ...bonusModal,
            error: `A bonus of ${bonusType} already exists for ${applicableMonth}. Multiple bonuses for the same month are not allowed.`,
          });
          return;
        }
      } else {
        setBonusModal({
          ...bonusModal,
          error: "Failed to verify existing bonuses.",
        });
        return;
      }
    } catch (error) {
      setBonusModal({
        ...bonusModal,
        error: error.response?.data?.error || "Network error while checking existing bonuses.",
      });
      return;
    } finally {
      setIsLoading(false);
    }

    // Proceed with bonus submission
    const payload = {
  percentageCtc:
    selectedOption === "percentageCtc"
      ? parseFloat(percentageCtc)
      : null,
  percentageMonthlySalary:
    selectedOption === "monthlySalaryCount"
      ? parseFloat(monthlySalaryCount)
      : null,
  fixedAmount:
    selectedOption === "fixedAmount"
      ? parseFloat(fixedAmount)
      : null,
  applicableMonth,
};


    try {
      setIsLoading(true);
      const url = `${BASE_URL}/api/compensation/add-bonus-bulk`;
      const response = await axios.post(url, payload, {withCredentials: true,
        headers: {
          "x-api-key": API_KEY,
          "x-employee-id": meId,
        },
      });
      if (response.data.success) {
        openMessageModal(
          "Success",
          `Bonus successfully added for ${selectedMonth} ${selectedYear}.`
        );
        const bonusResponse = await axios.get(
          `${BASE_URL}/api/compensation/bonus-list`,
          {withCredentials: true,
            headers: {
              "x-api-key": API_KEY,
              "x-employee-id": meId,
            },
          }
        );
        if (bonusResponse.data.success) {
          setBonusRecords(bonusResponse.data.data || []);
        }
        setBonusModal({ ...bonusModal, isVisible: false });
      } else {
        setBonusModal({
          ...bonusModal,
          error: response.data.error || "Failed to add bonus",
        });
      }
    } catch (error) {
      setBonusModal({
        ...bonusModal,
        error: error.response?.data?.error || error.message || "Network error",
      });
    } finally {
      setIsLoading(false);
    }
  };

const handleAssignSubmit = async () => {
  const { selectedCompensation, employeeId, fullName } = assignModal;
  if (!selectedCompensation) {
    console.log("No compensation selected. Available compensation plans:", assignModal.compensationList);
    setAssignModal({ ...assignModal, error: "Please select a compensation plan." });
    return;
  }
  const compensation = assignModal.compensationList.find(
    (comp) => String(comp.id) === selectedCompensation
  );
  if (!compensation || isNaN(parseInt(selectedCompensation))) {
    console.log("Invalid compensation selected. Selected ID:", selectedCompensation, "Available plans:", assignModal.compensationList);
    setAssignModal({
      ...assignModal,
      error: "Invalid compensation plan selected. Please select a valid plan.",
    });
    return;
  }
  try {
    setIsLoading(true);
    const url = `${BASE_URL}/api/compensation/assigned`;
    const headers = { "x-api-key": API_KEY, "x-employee-id": meId };
    const response = await axios.get(url, { withCredentials: true,headers });
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch assigned employees");
    }
    const assignedEmployees = Array.isArray(response.data.data) ? response.data.data : [];
    const assignedEmployee = assignedEmployees.find((emp) => emp.employee_id === employeeId);
    if (assignedEmployee) {
      setAssignModal({
        ...assignModal,
        error: `${fullName} already has a compensation plan assigned: ${assignedEmployee.compensation_plan_name}`,
      });
      return;
    }
    const assignUrl = `${BASE_URL}/api/compensation/assign`;
    const payload = {
      compensationId: parseInt(selectedCompensation),
      compensationPlanName: compensation.compensation_plan_name,
      employeeId: [employeeId],  // Array format (matches backend expectation)
      assignedBy: meId,
      assignedDate: new Date().toISOString().split("T")[0],
      departmentIds: [],
    };
    const assignResponse = await axios.post(assignUrl, payload, { headers });
    if (assignResponse.data.success) {
      openMessageModal("Success", `Compensation assigned successfully to ${fullName}!`);
      const compensationsResponse = await axios.get(
        `${BASE_URL}/api/compensations/list`,
        { withCredentials: true,headers }
      );
      const compensationMap = new Map();
      if (compensationsResponse.data.success) {
        compensationsResponse.data.data.forEach((comp) => {
          compensationMap.set(comp.compensation_plan_name, comp.plan_data);
        });
      }
      const employeesResponse = await axios.get(
        `${BASE_URL}/api/compensation/assigned`,
        {withCredentials: true, headers }
      );
      if (employeesResponse.data.success) {
        const enrichedEmployees = employeesResponse.data.data.map((emp) => ({
          ...emp,
          plan_data: compensationMap.get(emp.compensation_plan_name) || emp.plan_data,
        }));
        setEmployees(enrichedEmployees || []);
      }
      const allEmployeesResponse = await axios.get(
        `${BASE_URL}/api/employees/names`,
        { withCredentials: true,headers }
      );
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

const handleAdvanceSubmit = async () => {
    const { employeeId, advanceAmount, recoveryMonths, applicableMonth, threeMonthsSalary } = advanceModal;

    // Validation checks
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

    // Check for existing advance for the same employee and month
    const existingAdvance = advances.find(
      (advance) =>
        advance.employee_id === employeeId &&
        advance.applicable_months === applicableMonth
    );
    if (existingAdvance) {
      setAdvanceModal({
        ...advanceModal,
        error: `An advance of ₹${existingAdvance.advance_amount} already exists for ${employeeId} in ${applicableMonth}. Multiple advances for the same month are not allowed.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        employeeId,
        advanceAmount,
        recoveryMonths,
        applicableMonth,
      };

      const response = await axios.post(`${BASE_URL}/api/compensation/advance`, payload, {withCredentials: true,
        headers: { "x-api-key": API_KEY, "x-employee-id": meId, "Content-Type": "application/json" },
      });

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
        const advancesRes = await axios.get(`${BASE_URL}/api/compensation/advance-details`, { withCredentials: true,headers: { "x-api-key": API_KEY, "x-employee-id": meId } });
        setAdvances(advancesRes.data.data || []);
      } else {
        setAdvanceModal({
          ...advanceModal,
          error: response.data.message || "Failed to add advance.",
        });
      }
    } catch (error) {
      setAdvanceModal({
        ...advanceModal,
        error: error.response?.data?.message || "Network error.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  
  
  
const convertToMonthYear = (monthYearStr) => {
  console.log(`🔍 Input to convert: "${monthYearStr}"`);
  if (!monthYearStr) return null;
  
  // Handle YYYY-MM format directly (common from selects)
  if (/^\d{4}-\d{2}$/.test(monthYearStr)) {
    const [year, month] = monthYearStr.split('-');
    const monthNum = parseInt(month, 10);
    if (monthNum >= 1 && monthNum <= 12 && parseInt(year, 10) >= 1900 && parseInt(year, 10) <= 2100) {
      console.log(`🔄 Already valid YYYY-MM: "${monthYearStr}"`);
      return monthYearStr;
    }
  }
  
  // Fallback: Parse "Month Year" (space-separated)
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
        const monthStr = monthNum.toString().padStart(2, '0');
        const result = `${year}-${monthStr}`;
        console.log(`🔄 Converted name-based "${monthYearStr}" → "${result}"`);
        return result;
      }
    }
  }
  
  // Optional: Handle "Month-YYYY" (dash-separated name)
  parts = monthYearStr.split("-");
  if (parts.length === 2) {
    const [monthName, yearStr] = parts.map(p => p.trim().toLowerCase());
    const year = parseInt(yearStr, 10);
    if (!isNaN(year) && year >= 1900 && year <= 2100) {
      const monthMap = { /* same as above */ };
      const monthNum = monthMap[monthName];
      if (monthNum) {
        const monthStr = monthNum.toString().padStart(2, '0');
        const result = `${year}-${monthStr}`;
        console.log(`🔄 Converted dash-name "${monthYearStr}" → "${result}"`);
        return result;
      }
    }
  }
  
  console.warn("Invalid format:", monthYearStr);
  return null;
};

const handleIncentiveSubmit = async () => {
    const { employeeId, incentiveType, ctcPercentage, salesAmount, applicableMonth } = incentivesModal;

    // Existing validations
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
      setIncentivesModal({ ...incentivesModal, error: "Invalid month selected. Check console." });
      return;
    }

    // Fetch latest incentives to check for duplicates
    try {
      setIsLoading(true);
      const response = await axios.get(`${BASE_URL}/api/incentives`, {withCredentials: true,
        headers: { "x-api-key": API_KEY, "x-employee-id": meId },
      });
      if (response.data.success) {
        const existingIncentive = response.data.data.find(
          (incentive) =>
            incentive.employee_id === employeeId &&
            incentive.applicable_month === convertedApplicableMonth
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
      } else {
        setIncentivesModal({
          ...incentivesModal,
          error: "Failed to verify existing incentives.",
        });
        return;
      }
    } catch (error) {
      setIncentivesModal({
        ...incentivesModal,
        error: error.response?.data?.message || "Network error while checking existing incentives.",
      });
      return;
    } finally {
      setIsLoading(false);
    }

    setIsLoading(true);
    try {
      const payload = {
        employeeId,
        incentiveType,
        ctcPercentage: incentiveType === "ctc" ? ctcPercentage : null,
        salesAmount: incentiveType === "sales" ? salesAmount : null,
        applicableMonth: convertedApplicableMonth,
      };

      console.log("🔍 Payload to backend:", payload);

      const response = await axios.post(`${BASE_URL}/api/incentives`, payload, {withCredentials: true,
        headers: { "x-api-key": API_KEY, "x-employee-id": meId, "Content-Type": "application/json" },
      });

      if (response.data.success || response.data.message === "Incentive added successfully") {
        const targetEmployeeId = employeeId;
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
        try {
          const updatedIncentive = await calculateIncentives(targetEmployeeId);
          setEmployeeIncentiveData(prev => ({ ...prev, [targetEmployeeId]: updatedIncentive }));
          console.log(`🔄 Updated incentive for ${targetEmployeeId}:`, updatedIncentive);
        } catch (err) {
          console.warn("⚠️ Refetch incentive failed:", err);
        }
      } else {
        setIncentivesModal({
          ...incentivesModal,
          error: response.data.message || "Failed to add incentive.",
        });
      }
    } catch (error) {
      setIncentivesModal({
        ...incentivesModal,
        error: error.response?.data?.message || "Network error.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const openNoPlanModal = () => {
    setViewMode("noPlanDetails");
    setSearchTerm("");
    setMenuOpen(false);
  };

  const openMessageModal = (title, message, isError = false) => {
    setMessageModal({
      isVisible: true,
      title,
      message,
      isError,
    });
  };

  const openAssignModal = async (employeeId, fullName) => {
    setIsLoading(true);
    try {
      const url = `${BASE_URL}/api/compensations/list`;
      const response = await axios.get(url, {withCredentials: true,
        headers: { "x-api-key": API_KEY, "x-employee-id": meId },
      });
      if (response.data.success) {
        const validCompensations = Array.isArray(response.data.data)
          ? response.data.data.filter(
              (comp) =>
                comp &&
                typeof comp.compensation_plan_name === "string" &&
                comp.id &&
                !isNaN(parseInt(comp.id))
            )
          : [];
        if (validCompensations.length === 0) {
          throw new Error("No valid compensation plans available to assign.");
        }
        setAssignModal({
          isVisible: true,
          employeeId,
          fullName,
          compensationList: validCompensations,
          selectedCompensation: "",
          error: "",
        });
      } else {
        throw new Error(
          response.data.message || "Failed to fetch compensations"
        );
      }
    } catch (error) {
      openMessageModal(
        "Error",
        `Failed to fetch compensations: ${error.message || "Network error"}`,
        true
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAllDetails = () => {
    setViewMode("allDetails");
    setSearchQuery("");
    setCurrentPage(1);
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

  useEffect(() => {
  const fetchSalaryBreakupData = async () => {
    console.log("Environment Variables:", {
      API_KEY: process.env.REACT_APP_API_KEY,
      BASE_URL: process.env.REACT_APP_BACKEND_URL,
      meId,
    });

    if (!process.env.REACT_APP_API_KEY || !meId) {
      console.error("Missing credentials: API_KEY or meId");
      openMessageModal(
        "Error",
        "Authentication credentials are missing. Please check environment variables or login status.",
        true
      );
      setIsLoading(false);
      return;
    }

    const API_KEY = process.env.REACT_APP_API_KEY;
    const BASE_URL = process.env.REACT_APP_BACKEND_URL;

    try {
      setIsLoading(true);
      const headers = { "x-api-key": API_KEY, "x-employee-id": meId };
      console.log("Fetching data with headers:", headers);

      const [
        allEmployeesRes,
        compensationsRes,
        employeesRes,
        advancesRes,
        overtimeRes,
        bonusRes,
      ] = await Promise.all([
        axios.get(`${BASE_URL}/api/employees/names`, { withCredentials: true,headers }).catch(err => {
          console.error("Error fetching employees/names:", err);
          throw err;
        }),
        axios.get(`${BASE_URL}/api/compensations/list`, {withCredentials: true, headers }).catch(err => {
          console.error("Error fetching compensations/list:", err);
          throw err;
        }),
        axios.get(`${BASE_URL}/api/compensation/assigned`, { withCredentials: true,headers }).catch(err => {
          console.error("Error fetching compensation/assigned:", err);
          throw err;
        }),
        axios.get(`${BASE_URL}/api/compensation/advance-details`, {withCredentials: true, headers }).catch(err => {
          console.error("Error fetching compensation/advance-details:", err);
          throw err;
        }),
        axios.get(`${BASE_URL}/api/compensation/overtime-status-summary`, { withCredentials: true,headers }).catch(err => {
          console.error("Error fetching compensation/overtime-status-summary:", err);
          throw err;
        }),
        axios.get(`${BASE_URL}/api/compensation/bonus-list`, {withCredentials: true, headers }).catch(err => {
          console.error("Error fetching compensation/bonus-list:", err);
          throw err;
        }),
      ]);

      console.log("API Responses:", {
        allEmployees: allEmployeesRes.data,
        compensations: compensationsRes.data,
        employees: employeesRes.data,
        advances: advancesRes.data,
        overtime: overtimeRes.data,
        bonus: bonusRes.data,
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
        } else {
          console.warn(`Duplicate employee_id found: ${emp.employee_id}`);
        }
      });
      const enrichedEmployees = Array.from(enrichedEmployeesMap.values());
      setEmployees(enrichedEmployees);
      setAdvances(advancesRes.data.data || []);
      setOvertimeRecords(overtimeRes.data.data || []);
      setBonusRecords(bonusRes.data.data || []);

      const lopDataPromises = enrichedEmployees.map((emp) =>
        calculateLOPEffect(emp.employee_id)
          .then((result) => ({
            employeeId: emp.employee_id,
            lopData: result,
          }))
          .catch((err) => {
            console.warn(`LOP fetch failed for ${emp.employee_id}:`, err);
            return {
              employeeId: emp.employee_id,
              lopData: {
                currentMonth: { days: 0, value: "0.00", currency: "INR" },
                deferred: { days: 0, value: "0.00", currency: "INR" },
                nextMonth: { days: 0, value: "0.00", currency: "INR" },
                yearly: { days: 0, value: "0.00", currency: "INR" },
              },
            };
          })
      );

      const lopDataResults = await Promise.all(lopDataPromises);
      const lopDataMap = lopDataResults.reduce((acc, { employeeId, lopData }) => {
        acc[employeeId] = lopData;
        return acc;
      }, {});
      setEmployeeLopData(lopDataMap);

      const incentiveDataPromises = enrichedEmployees.map((emp) =>
        calculateIncentives(emp.employee_id)
          .then((result) => ({
            employeeId: emp.employee_id,
            incentiveData: result,
          }))
          .catch((err) => {
            console.warn(`Incentive fetch failed for ${emp.employee_id}:`, err);
            return {
              employeeId: emp.employee_id,
              incentiveData: {
                ctcIncentive: { value: "0.00", currency: "INR" },
                salesIncentive: { value: "0.00", currency: "INR" },
                totalIncentive: { value: "0.00", currency: "INR" },
              },
            };
          })
      );

      const incentiveDataResults = await Promise.all(incentiveDataPromises);
      const incentiveDataMap = incentiveDataResults.reduce(
        (acc, { employeeId, incentiveData }) => {
          if (!acc[employeeId] || parseFloat(incentiveData.totalIncentive.value) > 0) {
            acc[employeeId] = incentiveData;
          }
          return acc;
        },
        {}
      );
      setEmployeeIncentiveData(incentiveDataMap);

    } catch (error) {
      console.error("Fetch error:", error);
      openMessageModal(
        "Error",
        `Failed to fetch data: ${error.message || "Network error"}`,
        true
      );
    } finally {
      setIsLoading(false);
    }
  };

  fetchSalaryBreakupData();
}, []);
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
    (emp) =>
      !employees.some(
        (assignedEmp) =>
          String(assignedEmp.employee_id) === String(emp.employee_id)
      )
  );

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

  return (
    <div className="sb-main-container">
      {isLoading ? (
        <div className="sb-main-loading">Loading...</div>
      ) : (
        <>
          {viewMode === "main" && (
            <>
              {(employees.length > 0 || allEmployees.length > 0) && (
                <div className="sb-main-table-container">
                  <Header
                    menuOpen={menuOpen}
                    toggleMenu={toggleMenu}
                    openNoPlanModal={openNoPlanModal}
                    openBonusModal={openBonusModal}
                    handleViewAllDetails={handleViewAllDetails}
                    handleViewSalaryDetails={handleViewSalaryDetails}
                  />
                  <TotalsContainer
                    totals={totals}
                    totalLopDeduction={totalLopDeduction}
                  />
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
                    openIncentiveModal={openIncentiveModal} // 🔹 Add prop
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
                  
                </div>
              )}
            </>
          )}
          {viewMode === "salaryDetails" && ( // NEW: Conditional render for SalaryDetails
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
    allEmployees={allEmployees}                    // 🔧 Add this
    employees={employees}                          // 🔧 Add this
    searchTerm={searchTerm}                        // 🔧 Add this
    debouncedSetSearchTerm={debouncedSetSearchTerm} // 🔧 Add this
    handleBackToMain={handleBackToMain}            // ✅ Already passed
    openAssignModal={openAssignModal}              // 🔧 Add this
    isLoading={isLoading}                          // 🔧 Add this
  />
)}
          {bonusModal.isVisible && (
            <BonusModal bonusModal={bonusModal}
             setBonusModal={setBonusModal}
             handleBonusSubmit={handleBonusSubmit}  />
            
          )}
          {advanceModal.isVisible && (
            <AdvanceModal
              advanceModal={advanceModal}
              setAdvanceModal={setAdvanceModal}
              handleAdvanceSubmit={handleAdvanceSubmit} // 🔹 Add prop
              getAvailableMonths={getAvailableMonths}
              isLoading={isLoading}
              threeMonthsSalary={advanceModal.threeMonthsSalary} // 🔹 Add prop
            />
          )}
          {incentivesModal.isVisible && ( // 🔹 Add modal
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
            <MessageModal
              messageModal={messageModal}
              setMessageModal={setMessageModal}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SalaryBreakupMain;
