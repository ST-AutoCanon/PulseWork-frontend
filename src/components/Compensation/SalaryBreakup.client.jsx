"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import debounce from "lodash/debounce";
import Modal from "../Modal/Modal.client";
import "./salaryBreakup.css";
import {
  calculateSalaryDetails,
  calculateTotals,
  getMonthlySalary,
} from "@/utils/SalaryCalculations";

import { calculateLOPEffect } from "@/utils/lopCalculations.client";
import {
  FaMoneyBillWave,
  FaChartLine,
  FaMoneyCheckAlt,
  FaHandHoldingUsd,
  FaClock,
  FaGift,
  FaShieldAlt,
  FaBriefcase,
  FaStethoscope,
  FaExclamationTriangle,
  FaSearch,
} from "react-icons/fa";

const SalaryBreakup = () => {
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [bonusRecords, setBonusRecords] = useState([]);
  const [employeeLopData, setEmployeeLopData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
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
  const [viewMode, setViewMode] = useState("main");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsTab, setShowDetailsTab] = useState(false);
  const [tableHeight, setTableHeight] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const tableRef = useRef(null);
  const rowsPerPage = 7;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const meId = (() => {
    try {
      const dash = JSON.parse(localStorage.getItem("dashboardData") || "{}");
      return dash.employeeId || dash.id || dash.employee_id || null;
    } catch (e) {
      return null;
    }
  })();

  const debouncedSetSearchTerm = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
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
  };

  const closeBonusModal = () => {
    setBonusModal({
      isVisible: false,
      percentageCtc: "",
      monthlySalaryCount: "",
      fixedAmount: "",
      selectedMonth: "",
      selectedYear: new Date().getFullYear().toString(),
      selectedOption: "",
      error: "",
    });
  };

  const openAdvanceModal = (employeeId, fullName) => {
    setAdvanceModal({
      isVisible: true,
      employeeId,
      fullName,
      advanceAmount: "",
      recoveryMonths: "",
      applicableMonth: "",
      error: "",
    });
  };

  const closeAdvanceModal = () => {
    setAdvanceModal({
      isVisible: false,
      employeeId: null,
      fullName: "",
      advanceAmount: "",
      recoveryMonths: "",
      applicableMonth: "",
      error: "",
    });
  };

  const openNoPlanModal = () => {
    setViewMode("noPlanDetails");
    setSearchTerm("");
  };

  const openMessageModal = (title, message, isError = false) => {
    setMessageModal({
      isVisible: true,
      title,
      message,
      isError,
    });
  };

  const closeMessageModal = () => {
    setMessageModal({
      isVisible: false,
      title: "",
      message: "",
      isError: false,
    });
  };

  const openAssignModal = async (employeeId, fullName) => {
    setIsLoading(true);
    try {
      const url = `${BACKEND_URL}/api/compensations/list`;
      const response = await axios.get(url, {
        headers: {
          withCredentials: true,
          "x-api-key": API_KEY,
          "x-employee-id": meId,
        },
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

  const closeAssignModal = () => {
    setAssignModal({
      isVisible: false,
      employeeId: null,
      fullName: "",
      compensationList: [],
      selectedCompensation: "",
      error: "",
    });
  };

  const handleViewAllDetails = () => {
    setViewMode("allDetails");
    setSearchQuery("");
    setCurrentPage(1);
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

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    setSearchQuery("");
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
    if (!selectedOption) {
      setBonusModal({
        ...bonusModal,
        error: "Please select one bonus option.",
      });
      return;
    }
    if (
      selectedOption === "percentageCtc" &&
      (!percentageCtc ||
        parseFloat(percentageCtc) <= 0 ||
        parseFloat(percentageCtc) > 100)
    ) {
      setBonusModal({
        ...bonusModal,
        error: "Please enter a valid CTC percentage (0-100).",
      });
      return;
    }
    if (
      selectedOption === "monthlySalaryCount" &&
      (!monthlySalaryCount ||
        parseInt(monthlySalaryCount) < 1 ||
        parseInt(monthlySalaryCount) > 10)
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
    const payload = {
      percentageCtc:
        selectedOption === "percentageCtc" ? parseFloat(percentageCtc) : null,
      percentageMonthlySalary:
        selectedOption === "monthlySalaryCount"
          ? parseFloat(monthlySalaryCount) * 100
          : null,
      fixedAmount:
        selectedOption === "fixedAmount" ? parseFloat(fixedAmount) : null,
      applicableMonth,
    };
    try {
      setIsLoading(true);
      const url = `${BACKEND_URL}/api/compensation/add-bonus-bulk`;
      const response = await axios.post(url, payload, {
        withCredentials: true,
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
          `${BACKEND_URL}/api/compensation/bonus-list`,
          {
            headers: { "x-api-key": API_KEY, "x-employee-id": meId },
          }
        );
        if (bonusResponse.data.success) {
          setBonusRecords(bonusResponse.data.data || []);
        }
        closeBonusModal();
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

  const handleAdvanceSubmit = async () => {
    const { advanceAmount, recoveryMonths, employeeId, applicableMonth } =
      advanceModal;
    if (!advanceAmount || parseFloat(advanceAmount) <= 0) {
      setAdvanceModal({
        ...advanceModal,
        error: "Please enter a valid advance amount greater than 0.",
      });
      return;
    }
    if (!recoveryMonths || parseInt(recoveryMonths) <= 0) {
      setAdvanceModal({
        ...advanceModal,
        error: "Please enter a valid number of iterations (greater than 0).",
      });
      return;
    }
    if (!applicableMonth) {
      setAdvanceModal({
        ...advanceModal,
        error: "Please select an applicable month.",
      });
      return;
    }
    const monthlySalary = getMonthlySalary(employeeId, employees);
    const threeMonthsSalary = monthlySalary * 3;
    if (parseFloat(advanceAmount) > threeMonthsSalary) {
      setAdvanceModal({
        ...advanceModal,
        error: `Advance amount (₹${parseFloat(
          advanceAmount
        ).toLocaleString()}) cannot exceed three months' salary (₹${threeMonthsSalary.toLocaleString()}).`,
      });
      return;
    }
    const [year, month] = applicableMonth.split("-").map(Number);
    const existingAdvances = advances.filter((adv) => {
      if (!adv.applicable_months) return false;
      const advDate = parseApplicableMonth(adv.applicable_months);
      if (!advDate) return false;
      const advYear = advDate.getFullYear();
      const advMonth = advDate.getMonth() + 1;
      const recoveryMonths = parseInt(adv.recovery_months);
      const startMonth = advMonth;
      const startYear = advYear;
      let endYear = startYear;
      let endMonth = startMonth + recoveryMonths - 1;
      if (endMonth > 12) {
        endYear += Math.floor((endMonth - 1) / 12);
        endMonth = ((endMonth - 1) % 12) + 1;
      }
      const inputDate = new Date(year, month - 1);
      const startDate = new Date(startYear, startMonth - 1);
      const endDate = new Date(endYear, endMonth - 1);
      return (
        adv.employee_id === employeeId &&
        (adv.applicable_months === applicableMonth ||
          (inputDate >= startDate && inputDate <= endDate))
      );
    });
    if (existingAdvances.length > 0) {
      const activeAdvance = existingAdvances[0];
      const advDate = parseApplicableMonth(activeAdvance.applicable_months);
      const recoveryMonths = parseInt(activeAdvance.recovery_months);
      const startMonth = advDate.getMonth() + 1;
      const startYear = advDate.getFullYear();
      let endMonth = startMonth + recoveryMonths - 1;
      let endYear = startYear;
      if (endMonth > 12) {
        endYear += Math.floor((endMonth - 1) / 12);
        endMonth = ((endMonth - 1) % 12) + 1;
      }
      const monthsLeft = (endYear - year) * 12 + (endMonth - month) + 1;
      setAdvanceModal({
        ...advanceModal,
        error: `An active advance of ₹${parseFloat(
          activeAdvance.advance_amount
        ).toLocaleString()} is already in progress for this employee starting ${
          activeAdvance.applicable_months
        }, with ${monthsLeft} iteration(s) left until ${new Date(
          endYear,
          endMonth - 1
        ).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        })}. No new advance can be added until the current one is fully recovered.`,
      });
      return;
    }
    try {
      setIsLoading(true);
      const url = `${BACKEND_URL}/api/compensation/advance`;
      const response = await axios.post(
        url,
        {
          employeeId,
          advanceAmount: parseFloat(advanceAmount),
          recoveryMonths: parseInt(recoveryMonths),
          applicableMonth,
        },
        {
          withCredentials: true,
          headers: { "x-api-key": API_KEY, "x-employee-id": meId },
        }
      );
      if (response.data.success) {
        openMessageModal(
          "Success",
          `Advance of ₹${parseFloat(
            advanceAmount
          ).toLocaleString()} added successfully for ${advanceModal.fullName}.`
        );
        const advancesResponse = await axios.get(
          `${BACKEND_URL}/api/compensation/advance-details`,
          {
            headers: {
              withCredentials: true,
              "x-api-key": API_KEY,
              "x-employee-id": meId,
            },
          }
        );
        if (advancesResponse.data.success) {
          setAdvances(advancesResponse.data.data || []);
        }
        closeAdvanceModal();
      } else {
        setAdvanceModal({
          ...advanceModal,
          error: response.data.message || "Failed to add advance",
        });
      }
    } catch (error) {
      setAdvanceModal({
        ...advanceModal,
        error:
          error.response?.data?.message || error.message || "Network error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignSubmit = async () => {
    const { selectedCompensation, employeeId, fullName } = assignModal;
    if (!selectedCompensation) {
      setAssignModal({
        ...assignModal,
        error: "Please select a compensation plan.",
      });
      return;
    }
    const compensation = assignModal.compensationList.find(
      (comp) => String(comp.id) === selectedCompensation
    );
    if (!compensation || isNaN(parseInt(selectedCompensation))) {
      setAssignModal({
        ...assignModal,
        error:
          "Invalid compensation plan selected. Please select a valid plan.",
      });
      return;
    }
    try {
      setIsLoading(true);
      const url = `${BACKEND_URL}/api/compensation/assigned`;
      const headers = { "x-api-key": API_KEY, "x-employee-id": meId };
      const response = await axios.get(url, { withCredentials: true, headers });
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch assigned employees"
        );
      }
      const assignedEmployees = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      const assignedEmployee = assignedEmployees.find(
        (emp) => emp.employee_id === employeeId
      );
      if (assignedEmployee) {
        setAssignModal({
          ...assignModal,
          error: `${fullName} already has a compensation plan assigned: ${assignedEmployee.compensation_plan_name}`,
        });
        return;
      }
      const assignUrl = `${BACKEND_URL}/api/compensation/assign`;
      const payload = {
        compensationId: parseInt(selectedCompensation),
        compensationPlanName: compensation.compensation_plan_name,
        employeeId: [employeeId],
        assignedBy: meId,
        assignedDate: new Date().toISOString().split("T")[0],
        departmentIds: [],
      };
      const assignResponse = await axios.post(assignUrl, payload, {
        withCredentials: true,
        headers,
      });
      if (assignResponse.data.success) {
        openMessageModal(
          "Success",
          `Compensation assigned successfully to ${fullName}!`
        );
        const compensationsResponse = await axios.get(
          `${BACKEND_URL}/api/compensations/list`,
          { withCredentials: true, headers }
        );
        const compensationMap = new Map();
        if (compensationsResponse.data.success) {
          compensationsResponse.data.data.forEach((comp) => {
            compensationMap.set(comp.compensation_plan_name, comp.plan_data);
          });
        }
        const employeesResponse = await axios.get(
          `${BACKEND_URL}/api/compensation/assigned`,
          { withCredentials: true, headers }
        );
        if (employeesResponse.data.success) {
          const enrichedEmployees = employeesResponse.data.data.map((emp) => ({
            ...emp,
            plan_data:
              compensationMap.get(emp.compensation_plan_name) || emp.plan_data,
          }));
          setEmployees(enrichedEmployees || []);
        }
        const allEmployeesResponse = await axios.get(
          `${BACKEND_URL}/api/employees/names`,
          { withCredentials: true, headers }
        );
        if (allEmployeesResponse.data.success) {
          setAllEmployees(allEmployeesResponse.data.data || []);
        }
        closeAssignModal();
      } else {
        throw new Error(
          assignResponse.data.message || "Assignment unsuccessful"
        );
      }
    } catch (error) {
      setAssignModal({
        ...assignModal,
        error: `Failed to assign compensation: ${
          error.response?.data?.message || error.message || "Network error"
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchSalaryBreakupData = async () => {
      try {
        setIsLoading(true);
        setBonusRecords([]);
        const baseUrl = BACKEND_URL;
        const headers = { "x-api-key": API_KEY, "x-employee-id": meId };

        const allEmployeesResponse = await axios.get(
          `${baseUrl}/api/employees/names`,
          { withCredentials: true, headers }
        );
        if (allEmployeesResponse.data.success) {
          const employeesList = allEmployeesResponse.data.data || [];
          setAllEmployees(employeesList);
        } else {
          throw new Error(
            allEmployeesResponse.data.message || "Failed to fetch all employees"
          );
        }

        const compensationsResponse = await axios.get(
          `${baseUrl}/api/compensations/list`,
          { withCredentials: true, headers }
        );
        const compensationMap = new Map();
        if (compensationsResponse.data.success) {
          compensationsResponse.data.data.forEach((comp) => {
            compensationMap.set(comp.compensation_plan_name, comp.plan_data);
          });
        } else {
          throw new Error(
            compensationsResponse.data.message ||
              "Failed to fetch compensations"
          );
        }

        const employeesResponse = await axios.get(
          `${baseUrl}/api/compensation/assigned`,
          { withCredentials: true, headers }
        );
        if (employeesResponse.data.success) {
          const enrichedEmployees = employeesResponse.data.data.map((emp) => ({
            ...emp,
            plan_data:
              compensationMap.get(emp.compensation_plan_name) || emp.plan_data,
          }));

          setEmployees(enrichedEmployees || []);

          const employeesWithoutPlans = allEmployeesResponse.data.data.filter(
            (emp) =>
              !enrichedEmployees.some(
                (assignedEmp) =>
                  String(assignedEmp.employee_id) === String(emp.employee_id)
              )
          );

          const lopDataPromises = enrichedEmployees.map((emp) =>
            calculateLOPEffect(emp.employee_id)
              .then((result) => {
                return {
                  employeeId: emp.employee_id,
                  lopData: result || {
                    currentMonth: { days: 0, value: "0.00", currency: "INR" },
                    deferred: { days: 0, value: "0.00", currency: "INR" },
                    nextMonth: { days: 0, value: "0.00", currency: "INR" },
                    yearly: { days: 0, value: "0.00", currency: "INR" },
                  },
                };
              })
              .catch((error) => {
                console.error(
                  `Error fetching LOP for ${emp.employee_id}:`,
                  error
                );
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
          const lopDataMap = lopDataResults.reduce(
            (acc, { employeeId, lopData }) => {
              acc[employeeId] = lopData;
              return acc;
            },
            {}
          );
          setEmployeeLopData(lopDataMap);
        } else {
          throw new Error(
            employeesResponse.data.message ||
              "Failed to fetch salary breakup data"
          );
        }

        const advancesResponse = await axios.get(
          `${baseUrl}/api/compensation/advance-details`,
          { withCredentials: true, headers }
        );
        if (advancesResponse.data.success) {
          setAdvances(advancesResponse.data.data || []);
        }

        const overtimeResponse = await axios.get(
          `${baseUrl}/api/compensation/overtime-details`,
          { withCredentials: true, headers }
        );
        if (overtimeResponse.data.success) {
          setOvertimeRecords(overtimeResponse.data.data || []);
        }

        const bonusResponse = await axios.get(
          `${baseUrl}/api/compensation/bonus-list`,
          { withCredentials: true, headers }
        );
        if (bonusResponse.data.success) {
          setBonusRecords(bonusResponse.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        openMessageModal(
          "Error",
          `Failed to fetch data: ${
            error.response?.data?.message || error.message || "Network error"
          }`,
          true
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (API_KEY && meId) {
      fetchSalaryBreakupData();
    } else {
      openMessageModal(
        "Error",
        "Authentication credentials are missing.",
        true
      );
      setIsLoading(false);
    }
  }, [API_KEY, meId, BACKEND_URL]);

  const getAvailableMonths = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    return [
      {
        value: `${currentYear}-${currentMonth.toString().padStart(2, "0")}`,
        label: new Date(currentYear, currentMonth - 1).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
      },
      {
        value: `${nextYear}-${nextMonth.toString().padStart(2, "0")}`,
        label: new Date(nextYear, nextMonth - 1).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
      },
    ];
  };

  const months = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];
  const monthlySalaryOptions = Array.from({ length: 10 }, (_, i) =>
    (i + 1).toString()
  );

  const employeesWithoutPlans = allEmployees.filter(
    (emp) =>
      !employees.some(
        (assignedEmp) =>
          String(assignedEmp.employee_id) === String(emp.employee_id)
      )
  );

  const totals =
    employees.length > 0
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
          totalLopDeduction: 0,
        };

  const totalLopDeduction = employees.reduce((sum, emp) => {
    const lopData = employeeLopData[emp.employee_id];

    return sum + (lopData ? parseFloat(lopData.currentMonth.value || 0) : 0);
  }, 0);
  totals.totalLopDeduction = totalLopDeduction;

  const getCompensationPlanDetail = (component, planData) => {
    if (!planData) return "N/A";
    const componentMap = {
      "Basic Salary": {
        isApplicable: "isBasicSalary",
        type: "basicSalaryType",
        percentage: "basicSalary",
        amount: "basicSalaryAmount",
      },
      HRA: {
        isApplicable: "isHouseRentAllowance",
        type: "houseRentAllowanceType",
        percentage: "houseRentAllowance",
        amount: "houseRentAllowanceAmount",
      },
      "LTA Allowance": {
        isApplicable: "isLtaAllowance",
        type: "ltaAllowanceType",
        percentage: "ltaAllowance",
        amount: "ltaAllowanceAmount",
      },
      "Other Allowances": {
        isApplicable: "isOtherAllowance",
        type: "otherAllowanceType",
        percentage: "otherAllowance",
        amount: "otherAllowanceAmount",
      },
      "Overtime Pay": {
        isApplicable: "isOvertimePay",
        type: null,
        percentage: null,
        amount: "overtimePayAmount",
      },
      Bonus: {
        isApplicable: null,
        type: null,
        percentage: null,
        amount: null,
      },
      "Advance Recovery": {
        isApplicable: null,
        type: null,
        percentage: null,
        amount: null,
      },
      "Employee PF": {
        isApplicable: "isPFApplicable",
        type: "pfType",
        percentage: "pfPercentage",
        amount: "pfAmount",
      },
      "Employer PF": {
        isApplicable: "isPfEmployer",
        type: "pfEmployerType",
        percentage: "pfEmployerCeilingPercentage",
        amount: "pfEmployerAmount",
      },
      ESIC: {
        isApplicable: "isESICApplicable",
        type: "esicType",
        percentage: "esicPercentage",
        amount: "esicAmount",
      },
      Gratuity: {
        isApplicable: "isGratuityApplicable",
        type: "gratuityType",
        percentage: "gratuityPercentage",
        amount: "gratuityAmount",
      },
      "Professional Tax": {
        isApplicable: "isProfessionalTax",
        type: "professionalTaxType",
        percentage: "professionalTax",
        amount: "professionalTaxAmount",
      },
      "Income Tax": {
        isApplicable: null,
        type: null,
        percentage: null,
        amount: null,
      },
      Insurance: {
        isApplicable: "isInsuranceApplicable",
        type: "insuranceType",
        percentage: "insurancePercentage",
        amount: "insuranceAmount",
      },
      "LOP Deduction": {
        isApplicable: null,
        type: null,
        percentage: null,
        amount: null,
      },
      "Gross Salary": {
        isApplicable: null,
        type: null,
        percentage: null,
        amount: null,
      },
      "Net Salary": {
        isApplicable: null,
        type: null,
        percentage: null,
        amount: null,
      },
      CTC: {
        isApplicable: null,
        type: null,
        percentage: null,
        amount: null,
      },
    };
    const config = componentMap[component];
    if (!config || !config.isApplicable || planData[config.isApplicable]) {
      if (
        config.type &&
        planData[config.type] === "percentage" &&
        planData[config.percentage]
      ) {
        return `${parseFloat(planData[config.percentage]).toLocaleString()}%`;
      } else if (config.amount && planData[config.amount]) {
        return `₹${parseFloat(planData[config.amount]).toLocaleString()}`;
      }
    }
    return "N/A";
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.employee_id
        .toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmployees2 = employeesWithoutPlans.filter(
    (emp) =>
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstRow,
    indexOfLastRow
  );
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="sb-sb-container">
      {viewMode === "main" && (
        <>
          {isLoading ? (
            <div className="sb-sb-loading">Loading...</div>
          ) : employees.length > 0 || allEmployees.length > 0 ? (
            <div className="sb-sb-table-container">
              <div className="sb-sb-heading">Salary Breakup</div>
              <div className="sb-sb-button-container">
                <div className="menu-icon" onClick={toggleMenu}>
                  &#9776;
                </div>
                {menuOpen && (
                  <div className="sb-dropdown-menu">
                    <button
                      className="sb-dropdown-item"
                      onClick={() => {
                        toggleMenu();
                        openNoPlanModal();
                      }}
                    >
                      View Employees Without Plans
                    </button>
                    <button
                      className="sb-dropdown-item"
                      onClick={() => {
                        toggleMenu();
                        openBonusModal();
                      }}
                    >
                      Add Bonus
                    </button>
                    <button
                      className="sb-dropdown-item"
                      onClick={() => {
                        toggleMenu();
                        handleViewAllDetails();
                      }}
                    >
                      View All Details
                    </button>
                  </div>
                )}
              </div>
              {totals && (
                <div className="sb-sb-totals-container">
                  <h2 className="sb-sb-total-payroll">
                    Total Payroll: ₹
                    {(totals.totalPayable - totalLopDeduction).toLocaleString()}
                  </h2>
                  <div className="sb-sb-totals-grid">
                    <div className="sb-sb-total-card sb-payable">
                      <FaMoneyBillWave className="sb-sb-card-icon" />
                      <div>
                        <span className="sb-sb-card-title">Total Payable</span>
                        <span className="sb-sb-card-value">
                          ₹
                          {(
                            totals.totalPayable - totalLopDeduction
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="sb-sb-total-card sb-gross">
                      <FaChartLine className="sb-sb-card-icon" />
                      <div>
                        <span className="sb-sb-card-title">Total Gross</span>
                        <span className="sb-sb-card-value">
                          ₹{totals.totalGross.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="sb-sb-total-card sb-tds">
                      <FaMoneyCheckAlt className="sb-sb-card-icon" />
                      <div>
                        <span className="sb-sb-card-title">Total TDS</span>
                        <span className="sb-sb-card-value">
                          ₹{totals.totalTDS.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="sb-sb-total-card sb-advance">
                      <FaHandHoldingUsd className="sb-sb-card-icon" />
                      <div>
                        <span className="sb-sb-card-title">Total Advance</span>
                        <span className="sb-sb-card-value">
                          ₹{totals.totalAdvance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="sb-sb-total-card sb-overtime">
                      <FaClock className="sb-sb-card-icon" />
                      <div>
                        <span className="sb-sb-card-title">Total Overtime</span>
                        <span className="sb-sb-card-value">
                          ₹{totals.totalOvertime.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="sb-sb-total-card sb-bonus">
                      <FaGift className="sb-sb-card-icon" />
                      <div>
                        <span className="sb-sb-card-title">Total Bonus</span>
                        <span className="sb-sb-card-value">
                          ₹{totals.totalBonus.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="sb-sb-total-card sb-pf-employee">
                      <FaShieldAlt className="sb-sb-card-icon" />
                      <div>
                        <span className="sb-sb-card-title">
                          Total PF Employee
                        </span>
                        <span className="sb-sb-card-value">
                          ₹{totals.totalEmployeePF.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="sb-sb-total-card sb-pf-employer">
                      <FaBriefcase className="sb-sb-card-icon" />
                      <div>
                        <span className="sb-sb-card-title">
                          Total PF Employer
                        </span>
                        <span className="sb-sb-card-value">
                          ₹{totals.totalEmployerPF.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="sb-sb-total-card sb-insurance">
                      <FaStethoscope className="sb-sb-card-icon" />
                      <div>
                        <span className="sb-sb-card-title">
                          Total Insurance
                        </span>
                        <span className="sb-sb-card-value">
                          ₹{totals.totalInsurance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="sb-sb-total-card sb-lop">
                      <FaExclamationTriangle className="sb-sb-card-icon" />
                      <div>
                        <span className="sb-sb-card-title">
                          Total LOP Deduction
                        </span>
                        <span className="sb-sb-card-value">
                          ₹{totalLopDeduction.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="sb-sb-table-header-container">
                <h2 className="sb-sb-table-heading">Employee Payslip List</h2>
                <div className="sb-sb-search-wrapper">
                  <input
                    type="text"
                    className="sb-sb-search-input"
                    placeholder="Search by Employee ID or Full Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <FaSearch className="sb-sb-search-icon" />
                </div>
              </div>
              <div className="sb-sb-main-content">
                <div
                  className={`sb-sb-table-wrapper ${
                    showDetailsTab ? "sb-sb-table-compressed" : ""
                  }`}
                  ref={tableRef}
                >
                  <table className="sb-sb-table">
                    <thead>
                      <tr>
                        <th className="sb-sb-table-header sb-sb-align-left">
                          Employee ID
                        </th>
                        <th className="sb-sb-table-header sb-sb-align-left">
                          Full Name
                        </th>
                        <th className="sb-sb-table-header sb-sb-align-left">
                          Compensation Plan
                        </th>
                        <th className="sb-sb-table-header sb-sb-align-left">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="sb-sb-table-body-wrapper">
                      {currentEmployees.map((emp) => (
                        <tr key={emp.employee_id}>
                          <td className="sb-sb-table-cell sb-sb-align-left">
                            {emp.employee_id}
                          </td>
                          <td className="sb-sb-table-cell sb-sb-align-left">
                            {emp.full_name}
                          </td>
                          <td className="sb-sb-table-cell sb-sb-align-left">
                            {emp.compensation_plan_name || "No Plan Assigned"}
                          </td>
                          <td className="sb-sb-table-cell sb-sb-align-center">
                            <div className="sb-sb-action-buttons">
                              <button
                                className="sb-sb-view-button"
                                onClick={() => handleViewSingleEmployee(emp)}
                              >
                                Annexure
                              </button>
                              <button
                                className="sb-sb-advance-button"
                                onClick={() =>
                                  openAdvanceModal(
                                    emp.employee_id,
                                    emp.full_name
                                  )
                                }
                              >
                                Add Advance
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="sb-sb-pagination">
                    <button
                      className="sb-sb-pagination-button"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="sb-sb-pagination-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="sb-sb-pagination-button"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
                {showDetailsTab && selectedEmployee && (
                  <div
                    className="sb-sb-details-tab"
                    style={{ height: `${tableHeight}px` }}
                  >
                    <div className="sb-sb-details-tab-header">
                      <h2>Salary Details</h2>
                      <button
                        className="sb-sb-details-tab-close"
                        onClick={handleCloseDetailsTab}
                      >
                        ×
                      </button>
                    </div>
                    <div className="sb-sb-details-tab-content">
                      <div className="sb-sb-employee-name">
                        {selectedEmployee.full_name || "N/A"}
                      </div>
                      <div className="sb-sb-ctc-info">
                        <div>
                          <strong>Comp. Plan:</strong>{" "}
                          {selectedEmployee.compensation_plan_name || "N/A"}
                        </div>
                        <div>
                          <strong>CTC (Yearly):</strong> ₹
                          {selectedEmployee.ctc
                            ? parseFloat(selectedEmployee.ctc).toLocaleString()
                            : "N/A"}
                        </div>
                        <div>
                          <strong>CTC (Monthly):</strong> ₹
                          {selectedEmployee.ctc
                            ? (
                                parseFloat(selectedEmployee.ctc) / 12
                              ).toLocaleString()
                            : "N/A"}
                        </div>
                      </div>
                      <div className="sb-sb-tab-buttons">
                        <button
                          className={`sb-sb-tab-button yearly ${
                            activeTab === "yearly" ? "active" : ""
                          }`}
                          onClick={() => setActiveTab("yearly")}
                        >
                          Yearly
                        </button>
                        <button
                          className={`sb-sb-tab-button monthly ${
                            activeTab === "monthly" ? "active" : ""
                          }`}
                          onClick={() => setActiveTab("monthly")}
                        >
                          Monthly
                        </button>
                      </div>
                      <div className="sb-sb-tab-details">
                        {(() => {
                          const salaryDetails = calculateSalaryDetails(
                            selectedEmployee.ctc,
                            selectedEmployee.plan_data,
                            selectedEmployee.employee_id,
                            overtimeRecords,
                            bonusRecords,
                            advances
                          );
                          const lopData = employeeLopData[
                            selectedEmployee.employee_id
                          ] || {
                            currentMonth: {
                              days: 0,
                              value: "0.00",
                              currency: "INR",
                            },
                            deferred: {
                              days: 0,
                              value: "0.00",
                              currency: "INR",
                            },
                            nextMonth: {
                              days: 0,
                              value: "0.00",
                              currency: "INR",
                            },
                            yearly: { days: 0, value: "0.00", currency: "INR" },
                          };

                          if (!salaryDetails || !selectedEmployee.employee_id) {
                            return <p>No valid employee data provided</p>;
                          }
                          if (
                            !selectedEmployee.ctc ||
                            selectedEmployee.ctc <= 0
                          ) {
                            return (
                              <p>No valid CTC provided for this employee</p>
                            );
                          }
                          const planData = selectedEmployee.plan_data || {};
                          const components = [
                            {
                              label: "Basic Salary",
                              planDetail:
                                planData.isBasicSalary &&
                                planData.basicSalaryType === "percentage" &&
                                planData.basicSalary
                                  ? `${planData.basicSalary}% of CTC`
                                  : planData.basicSalaryAmount
                                  ? `₹${parseFloat(
                                      planData.basicSalaryAmount
                                    ).toLocaleString()}`
                                  : "N/A",
                              yearly: salaryDetails.basicSalary * 12,
                              monthly: salaryDetails.basicSalary,
                              isDeduction: false,
                            },
                          ];

                          const totalEarningsMonthly = components
                            .filter((comp) => !comp.isDeduction)
                            .reduce(
                              (sum, comp) => sum + (comp.monthly || 0),
                              0
                            );
                          const totalDeductionsMonthly = components
                            .filter((comp) => comp.isDeduction)
                            .reduce(
                              (sum, comp) => sum + (comp.monthly || 0),
                              0
                            );
                          const netSalaryMonthly =
                            totalEarningsMonthly - totalDeductionsMonthly;
                          const totalEarningsYearly = components
                            .filter((comp) => !comp.isDeduction)
                            .reduce((sum, comp) => sum + (comp.yearly || 0), 0);
                          const totalDeductionsYearly = components
                            .filter((comp) => comp.isDeduction)
                            .reduce((sum, comp) => sum + (comp.yearly || 0), 0);
                          const netSalaryYearly =
                            totalEarningsYearly - totalDeductionsYearly;
                          return (
                            <table className="sb-sb-table sb-sb-single-details-table">
                              <thead>
                                <tr>
                                  <th className="sb-sb-table-header sb-sb-align-left">
                                    Component
                                  </th>
                                  <th className="sb-sb-table-header sb-sb-align-left">
                                    Comp.Plan
                                  </th>
                                  <th className="sb-sb-table-header sb-sb-align-right">
                                    {activeTab === "yearly"
                                      ? "Yearly Amount"
                                      : "Monthly Amount"}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="sb-sb-table-body-wrapper">
                                {components.map((item, index) => (
                                  <tr key={index}>
                                    <td className="sb-sb-table-cell sb-sb-align-left">
                                      {item.label}
                                    </td>
                                    <td className="sb-sb-table-cell sb-sb-align-left">
                                      {item.planDetail}
                                    </td>
                                    <td className="sb-sb-table-cell sb-sb-align-right">
                                      {(activeTab === "yearly"
                                        ? item.yearly
                                        : item.monthly) > 0
                                        ? `₹${parseFloat(
                                            activeTab === "yearly"
                                              ? item.yearly
                                              : item.monthly
                                          ).toLocaleString()}`
                                        : "N/A"}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="sb-sb-total-row">
                                  <td className="sb-sb-table-cell sb-sb-align-left">
                                    <strong>Earnings</strong>
                                  </td>
                                  <td className="sb-sb-table-cell sb-sb-align-left">
                                    N/A
                                  </td>
                                  <td className="sb-sb-table-cell sb-sb-align-right">
                                    <strong>
                                      ₹
                                      {parseFloat(
                                        activeTab === "yearly"
                                          ? totalEarningsYearly
                                          : totalEarningsMonthly
                                      ).toLocaleString()}
                                    </strong>
                                  </td>
                                </tr>
                                <tr className="sb-sb-total-row">
                                  <td className="sb-sb-table-cell sb-sb-align-left">
                                    <strong>Deductions</strong>
                                  </td>
                                  <td className="sb-sb-table-cell sb-sb-align-left">
                                    N/A
                                  </td>
                                  <td className="sb-sb-table-cell sb-sb-align-right">
                                    <strong>
                                      ₹
                                      {parseFloat(
                                        activeTab === "yearly"
                                          ? totalDeductionsYearly
                                          : totalDeductionsMonthly
                                      ).toLocaleString()}
                                    </strong>
                                  </td>
                                </tr>
                                <tr className="sb-sb-total-row">
                                  <td className="sb-sb-table-cell sb-sb-align-left">
                                    <strong>Gross Salary</strong>
                                  </td>
                                  <td className="sb-sb-table-cell sb-sb-align-left">
                                    N/A
                                  </td>
                                  <td className="sb-sb-table-cell sb-sb-align-right">
                                    <strong>
                                      ₹
                                      {parseFloat(
                                        activeTab === "yearly"
                                          ? salaryDetails.grossSalary * 12
                                          : salaryDetails.grossSalary
                                      ).toLocaleString()}
                                    </strong>
                                  </td>
                                </tr>
                                <tr className="sb-sb-total-row">
                                  <td className="sb-sb-table-cell sb-sb-align-left">
                                    <strong>Net Salary</strong>
                                  </td>
                                  <td className="sb-sb-table-cell sb-sb-align-left">
                                    N/A
                                  </td>
                                  <td className="sb-sb-table-cell sb-sb-align-right">
                                    <strong>
                                      ₹
                                      {parseFloat(
                                        activeTab === "yearly"
                                          ? netSalaryYearly
                                          : netSalaryMonthly
                                      ).toLocaleString()}
                                    </strong>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p>No employee data available</p>
          )}
        </>
      )}
      {viewMode === "allDetails" && (
        <div className="esd-container">
          <div className="esd-header">
            <button className="esd-back-button" onClick={handleBackToMain}>
              <svg
                className="esd-back-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="esd-header-title">Employee Salary Overview</div>
          </div>
          <div className="esd-search-container">
            <input
              type="text"
              className="esd-search-input"
              placeholder="Search by ID or Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {filteredEmployees.length > 0 ? (
            <div className="esd-table-container">
              <div className="esd-table-wrapper">
                <table className="esd-table">
                  <thead>
                    <tr>
                      <th className="esd-table-header esd-align-left esd-id-column">
                        ID
                      </th>
                      <th className="esd-table-header esd-align-left esd-name-column">
                        Name
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Annual CTC
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Basic Salary
                      </th>
                      <th className="esd-table-header esd-align-right">HRA</th>
                      <th className="esd-table-header esd-align-right">LTA</th>
                      <th className="esd-table-header esd-align-right">
                        Other Allow.
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Overtime
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Bonus
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Advance Rec.
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Emp. PF
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Employer PF
                      </th>
                      <th className="esd-table-header esd-align-right">ESIC</th>
                      <th className="esd-table-header esd-align-right">
                        Gratuity
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Prof. Tax
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Income Tax
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Insurance
                      </th>
                      <th className="esd-table-header esd-align-right">
                        LOP Days
                      </th>
                      <th className="esd-table-header esd-align-right">
                        LOP Ded.
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Gross Salary
                      </th>
                      <th className="esd-table-header esd-align-right">
                        Net Salary
                      </th>
                    </tr>
                  </thead>
                  <tbody className="esd-table-body">
                    {filteredEmployees.map((emp) => {
                      const salaryDetails = calculateSalaryDetails(
                        emp.ctc,
                        emp.plan_data,
                        emp.employee_id,
                        overtimeRecords,
                        bonusRecords,
                        advances
                      );
                      const lopData = employeeLopData[emp.employee_id] || {
                        currentMonth: {
                          days: 0,
                          value: "0.00",
                          currency: "INR",
                        },
                        deferred: { days: 0, value: "0.00", currency: "INR" },
                        nextMonth: { days: 0, value: "0.00", currency: "INR" },
                        yearly: { days: 0, value: "0.00", currency: "INR" },
                      };
                      const netSalary = salaryDetails
                        ? salaryDetails.netSalary -
                          (lopData
                            ? parseFloat(lopData.currentMonth.value || 0)
                            : 0)
                        : 0;
                      return (
                        <tr key={emp.employee_id}>
                          <td className="esd-table-cell esd-align-left esd-id-column">
                            {emp.employee_id}
                          </td>
                          <td className="esd-table-cell esd-align-left esd-name-column">
                            {emp.full_name}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {emp.ctc
                              ? `₹${parseFloat(emp.ctc).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.basicSalary
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.hra
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.ltaAllowance
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.otherAllowances
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.overtimePay
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.bonusPay
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.advanceRecovery
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.employeePF
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.employerPF
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.esic
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.gratuity
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.professionalTax
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.tds
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.insurance
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {lopData && lopData.currentMonth.days > 0
                              ? lopData.currentMonth.days
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {lopData && lopData.currentMonth.value !== "0.00"
                              ? `₹${parseFloat(
                                  lopData.currentMonth.value
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(
                                  salaryDetails.grossSalary
                                ).toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="esd-table-cell esd-align-right">
                            {salaryDetails
                              ? `₹${parseFloat(netSalary).toLocaleString()}`
                              : "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="esd-no-data">No employee data available.</p>
          )}
        </div>
      )}
      {viewMode === "noPlanDetails" && (
        <div className="sb-no-plan-details-container">
          {isLoading ? (
            <p className="sb-no-plan-message">Loading...</p>
          ) : allEmployees.length === 0 ? (
            <p className="sb-no-plan-message">
              No employee data available. Please check the system or contact
              support.
            </p>
          ) : (
            <>
              <div className="sb-no-plan-details-header">
                <button
                  className="sb-no-plan-back-button"
                  onClick={handleBackToMain}
                >
                  <svg
                    className="sb-no-plan-back-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11 1.5a.5.5 0 0 1 0 .707L5.707 8 11 13.293a.5.5 0 0 1-.707.707l-6-6a.5.5 0 0 1 0-.707l6-6a.5.5 0 0 1 .707 0z"
                    />
                  </svg>
                </button>
                <div className="sb-no-plan-title">
                  Employees Without Compensation Plans
                </div>
              </div>
              <div className="sb-no-plan-search-container">
                <input
                  type="text"
                  className="sb-no-plan-search-input"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                />
              </div>
              {filteredEmployees2.length > 0 ? (
                <div className="sb-no-plan-table-wrapper">
                  <table className="sb-no-plan-table">
                    <thead>
                      <tr>
                        <th className="sb-no-plan-align-left sb-no-plan-sticky-column">
                          Employee ID
                        </th>
                        <th className="sb-no-plan-align-left sb-no-plan-sticky-column">
                          Full Name
                        </th>
                        <th className="sb-no-plan-align-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees2.map((emp) => (
                        <tr key={emp.employee_id}>
                          <td className="sb-no-plan-align-left sb-no-plan-sticky-column">
                            {emp.employee_id}
                          </td>
                          <td className="sb-no-plan-align-left sb-no-plan-sticky-column">
                            {emp.full_name}
                          </td>
                          <td className="sb-no-plan-align-center">
                            <button
                              className="sb-no-plan-assign-button"
                              onClick={() =>
                                openAssignModal(emp.employee_id, emp.full_name)
                              }
                            >
                              Assign
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="sb-no-plan-message">
                  No employees without compensation plans found.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {bonusModal.isVisible && (
        <div className="sb-sb-modal-overlay">
          <div className="sb-sb-modal">
            <div className="sb-sb-modal-header">
              <h2>Add Bonus</h2>
              <button className="sb-sb-close-button" onClick={closeBonusModal}>
                &times;
              </button>
            </div>
            <div className="sb-sb-bonus-form">
              <p className="sb-sb-bonus-info">
                The specified bonus details will be recorded for the selected
                month and year. Select one option below:
              </p>
              {bonusModal.error && (
                <p className="sb-sb-error-message">{bonusModal.error}</p>
              )}
              <div className="sb-sb-bonus-field">
                <input
                  type="radio"
                  id="percentageCtcOption"
                  name="bonusOption"
                  value="percentageCtc"
                  checked={bonusModal.selectedOption === "percentageCtc"}
                  onChange={(e) =>
                    setBonusModal({
                      ...bonusModal,
                      selectedOption: e.target.value,
                      error: "",
                    })
                  }
                />
                <label htmlFor="percentageCtc">CTC Percentage (%):</label>
                <input
                  type="number"
                  id="percentageCtc"
                  value={bonusModal.percentageCtc}
                  onChange={(e) =>
                    setBonusModal({
                      ...bonusModal,
                      percentageCtc: e.target.value,
                      error: "",
                    })
                  }
                  placeholder="Enter CTC percentage"
                  min="0"
                  max="100"
                  step="0.01"
                  className="sb-sb-bonus-input"
                  disabled={bonusModal.selectedOption !== "percentageCtc"}
                />
              </div>

              <div className="sb-sb-bonus-field">
                <input
                  type="radio"
                  id="monthlySalaryCountOption"
                  name="bonusOption"
                  value="monthlySalaryCount"
                  checked={bonusModal.selectedOption === "monthlySalaryCount"}
                  onChange={(e) =>
                    setBonusModal({
                      ...bonusModal,
                      selectedOption: e.target.value,
                      error: "",
                    })
                  }
                />
                <label htmlFor="monthlySalaryCount">
                  No of Monthly Salary:
                </label>
                <div className="sb-sb-monthly-salary-container">
                  <select
                    id="monthlySalaryCount"
                    value={bonusModal.monthlySalaryCount}
                    onChange={(e) =>
                      setBonusModal({
                        ...bonusModal,
                        monthlySalaryCount: e.target.value,
                        error: "",
                      })
                    }
                    className="sb-sb-bonus-input"
                    disabled={
                      bonusModal.selectedOption !== "monthlySalaryCount"
                    }
                  >
                    <option value="">Select Number</option>
                    {monthlySalaryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span className="sb-sb-month-label">Month(s)</span>
                </div>
              </div>

              <div className="sb-sb-bonus-field">
                <input
                  type="radio"
                  id="fixedAmountOption"
                  name="bonusOption"
                  value="fixedAmount"
                  checked={bonusModal.selectedOption === "fixedAmount"}
                  onChange={(e) =>
                    setBonusModal({
                      ...bonusModal,
                      selectedOption: e.target.value,
                      error: "",
                    })
                  }
                />
                <label htmlFor="fixedAmount">Fixed Amount (₹):</label>
                <input
                  type="number"
                  id="fixedAmount"
                  value={bonusModal.fixedAmount}
                  onChange={(e) =>
                    setBonusModal({
                      ...bonusModal,
                      fixedAmount: e.target.value,
                      error: "",
                    })
                  }
                  placeholder="Enter fixed amount"
                  min="0"
                  step="1"
                  className="sb-sb-bonus-input"
                  disabled={bonusModal.selectedOption !== "fixedAmount"}
                />
              </div>

              <div className="sb-sb-bonus-field-row">
                <div className="sb-sb-bonus-field">
                  <label htmlFor="bonusMonth">Month:</label>
                  <select
                    id="bonusMonth"
                    value={bonusModal.selectedMonth}
                    onChange={(e) =>
                      setBonusModal({
                        ...bonusModal,
                        selectedMonth: e.target.value,
                        error: "",
                      })
                    }
                    className="sb-sb-bonus-input"
                  >
                    <option value="">Select Month</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, parseInt(m) - 1).toLocaleString(
                          "en-US",
                          { month: "long" }
                        )}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sb-sb-bonus-field">
                  <label htmlFor="bonusYear">Year:</label>
                  <input
                    id="bonusYear"
                    type="text"
                    value={bonusModal.selectedYear}
                    onChange={(e) =>
                      setBonusModal({
                        ...bonusModal,
                        selectedYear: e.target.value,
                        error: "",
                      })
                    }
                    className="sb-sb-bonus-input"
                  />
                </div>
              </div>

              <div className="sb-sb-modal-footer">
                <button
                  className="sb-sb-modal-button sb-sb-cancel"
                  onClick={closeBonusModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="sb-sb-modal-button sb-sb-submit"
                  onClick={handleBonusSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {assignModal.isVisible && (
        <div className="sb-sb-modal-overlay">
          <div className="sb-sb-modal">
            <div className="sb-sb-modal-header">
              <h2>Assign Compensation Plan to {assignModal.fullName}</h2>
              <button className="sb-sb-close-button" onClick={closeAssignModal}>
                &times;
              </button>
            </div>
            <div className="sb-sb-assign-form">
              {assignModal.error && (
                <p className="sb-sb-error-message">{assignModal.error}</p>
              )}
              <div className="sb-sb-assign-field">
                <label htmlFor="compensationPlan">Compensation Plan:</label>
                <select
                  id="compensationPlan"
                  value={assignModal.selectedCompensation}
                  onChange={(e) =>
                    setAssignModal({
                      ...assignModal,
                      selectedCompensation: e.target.value,
                      error: "",
                    })
                  }
                  className="sb-sb-assign-input"
                >
                  <option value="">Select Compensation Plan</option>
                  {assignModal.compensationList.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.compensation_plan_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sb-sb-modal-footer">
                <button
                  className="sb-sb-modal-button sb-sb-cancel"
                  onClick={closeAssignModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="sb-sb-modal-button sb-sb-submit"
                  onClick={handleAssignSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Assigning..." : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {messageModal.isVisible && (
        <Modal
          title={messageModal.title}
          message={messageModal.message}
          isError={messageModal.isError}
          onClose={closeMessageModal}
        />
      )}
    </div>
  );
};

export default SalaryBreakup;
