import React from "react";
import "./DetailsTab.css";
import {
  parseApplicableMonth,
  parseWorkDate,
  getPayrollFilter,
  getCurrentYearMonth,
} from "../../../utils/SalaryCalculations";
// Duplicate of helper present in CreateCompensation for consistent Gross/Net
const calculateLocalGrossNet = (salaryDetails, planData) => {
  if (!salaryDetails) return { localGross: 0, localNet: 0 };

  const monthlyEarningsSum = [
    salaryDetails.basicSalary || 0,
    salaryDetails.hra || 0,
    salaryDetails.ltaAllowance || 0,
    salaryDetails.otherAllowances || 0,
    salaryDetails.incentivePay || 0,
    salaryDetails.overtimePay || 0,
    salaryDetails.statutoryBonus || 0,
  ].reduce((sum, val) => sum + parseFloat(val || 0), 0);

  const includedComponents = [
    { value: salaryDetails.employeePF, include: planData.pfEmployeeIncludeInCtc },
    { value: salaryDetails.employerPF, include: planData.pfEmployerIncludeInCtc },
    { value: salaryDetails.esic, include: planData.esicEmployeeIncludeInCtc },
    { value: salaryDetails.gratuity, include: planData.gratuityIncludeInCtc },
    { value: salaryDetails.professionalTax, include: planData.professionalTaxIncludeInCtc },
    { value: salaryDetails.insurance, include: planData.insuranceEmployeeIncludeInCtc },
  ];

  const includedAmount = includedComponents.reduce(
    (sum, item) => (item.include !== false ? sum + parseFloat(item.value || 0) : sum),
    0
  );

  const localGross = monthlyEarningsSum + includedAmount;

  // Only employee-side deductions reduce Net Salary
  const employeeDeductions = [
    { value: salaryDetails.employeePF, include: planData.pfEmployeeIncludeInCtc },
    { value: salaryDetails.esic, include: planData.esicEmployeeIncludeInCtc },
    { value: salaryDetails.professionalTax, include: planData.professionalTaxIncludeInCtc },
    { value: salaryDetails.insurance, include: planData.insuranceEmployeeIncludeInCtc },
  ].reduce(
    (sum, item) => (item.include !== false ? sum + parseFloat(item.value || 0) : sum),
    0
  );

  const localNet = localGross - employeeDeductions;

  return { localGross, localNet };
};


const DetailsTab = ({
  selectedEmployee,
  activeTab,
  setActiveTab,
  handleCloseDetailsTab,
  calculateSalaryDetails,
  employeeLopData = {},
  overtimeRecords = [],
  bonusRecords = [],
  advances = [],
  employeeIncentiveData = {},
}) => {
  const calculationDefaults = {
    basicSalary: { percentage: "40", type: "percentage" },
    hra: { percentage: "50", type: "percentage" },
    lta: { percentage: "0", type: "percentage" },
    otherAllowance: { percentage: "fill", type: "percentage" },
    variablePay: { percentage: "0", type: "percentage" },
    statutoryBonus: { percentage: "0", type: "percentage" },
    professionalTax: { amount: "200", type: "amount" },
    pfEmployee: { percentage: "0", type: "percentage" },
    pfEmployer: { percentage: "0", type: "percentage" },
    esicEmployee: { percentage: "0", type: "percentage" },
    insuranceEmployee: { percentage: "0", type: "percentage" },
    gratuity: { percentage: "4.81", type: "percentage" },
    tds: { percentage: "0", type: "percentage" },
    advanceRecovery: { amount: "0", type: "amount" },
  };

  const getDisplayDayStatus = (status) => {
    switch (status) {
      case "fullDay":
        return "Full Day";
      case "halfDay":
        return "Half Day";
      case "weekOff":
        return "Week Off";
      default:
        return status;
    }
  };

  const formatWorkingDays = (workingDays) => {
    if (!workingDays || typeof workingDays !== "object") return ["None"];
    const dayOrder = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    return Object.entries(workingDays)
      .sort(([dayA], [dayB]) => dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB))
      .map(([day, status]) => `${day}: ${getDisplayDayStatus(status)}`);
  };

  const formatTdsSlabs = (slabs) => {
    if (!Array.isArray(slabs) || slabs.length === 0) return "None";
    return slabs
      .map(
        (slab) =>
          `From ₹${slab.from || "0"} to ₹${slab.to || "∞"}: ${
            slab.percentage || "0"
          }%`
      )
      .join("; ");
  };

  const getAppliedTdsSlab = (ctc, tdsSlabs) => {
    if (!Array.isArray(tdsSlabs) || tdsSlabs.length === 0 || !ctc) return null;
    const annualCtc = parseFloat(ctc);
    const sortedSlabs = [...tdsSlabs].sort(
      (a, b) => parseInt(a.from) - parseInt(b.from)
    );
    for (const slab of sortedSlabs) {
      const lower = parseInt(slab.from) || 0;
      const upper = parseInt(slab.to) || Infinity;
      const rate = parseFloat(slab.percentage) / 100 || 0;
      if (
        annualCtc >= lower &&
        (upper === Infinity || annualCtc <= upper) &&
        rate > 0
      ) {
        return `From ₹${lower} to ₹${upper === Infinity ? "∞" : upper}: ${
          slab.percentage
        }% (applied to Annual CTC)`;
      }
    }
    return null;
  };

  if (
    !selectedEmployee ||
    !selectedEmployee.employee_id ||
    !selectedEmployee.ctc ||
    selectedEmployee.ctc <= 0
  ) {
    console.error("Invalid employee data:", {
      employee_id: selectedEmployee?.employee_id,
      ctc: selectedEmployee?.ctc,
    });
    return <p>No valid employee data provided</p>;
  }

  const planData = selectedEmployee.plan_data || {};

  const salaryDetailsRaw = calculateSalaryDetails(
    selectedEmployee.ctc,
    planData,
    selectedEmployee.employee_id,
    overtimeRecords,
    bonusRecords,
    advances,
    employeeIncentiveData,
    employeeLopData
  );

  // Apply same Gross/Net logic as CreateCompensation Preview
  const { localGross, localNet } = calculateLocalGrossNet(salaryDetailsRaw, planData);

  const salaryDetails = {
    ...salaryDetailsRaw,
    localGross,
    localNet,
  };

  const monthlyCTC = parseFloat(selectedEmployee.ctc || 0) / 12;



  const { targetMonthStr, targetYear, windowStart, windowEnd } =
    getPayrollFilter();
  const employeeOvertime = overtimeRecords.filter((ot) => {
    const workDate = parseWorkDate(ot.work_date);
    const updatedDate = new Date(ot.updated_at || ot.created_at);
    const isInWindow = updatedDate >= windowStart && updatedDate < windowEnd;
    const monthStr = String(workDate ? workDate.getMonth() + 1 : 0).padStart(
      2,
      "0"
    );
    return (
      ot.employee_id === selectedEmployee.employee_id &&
      ot.status === "Approved" &&
      workDate &&
      workDate.getFullYear() === targetYear &&
      (monthStr === targetMonthStr || isInWindow)
    );
  });

  const totalOvertimeHours = employeeOvertime.reduce((sum, ot) => {
    const hours = parseFloat(ot.extra_hours);
    return isNaN(hours) || hours <= 0 ? sum : sum + hours;
  }, 0);

  const totalOvertimePay = employeeOvertime.reduce((sum, ot) => {
    const hours = parseFloat(ot.extra_hours);
    let rate = parseFloat(ot.rate);
    if (isNaN(rate) || rate <= 0) {
      if (
        planData.isOvertimePay &&
        planData.overtimePayAmount &&
        !isNaN(parseFloat(planData.overtimePayAmount))
      ) {
        rate = parseFloat(planData.overtimePayAmount);
      } else {
        rate = 500;
      }
    }
    return isNaN(hours) || hours <= 0 ? sum : sum + hours * rate;
  }, 0);

  const yearlyOvertimeRecords = overtimeRecords.filter((ot) => {
    const workDate = parseWorkDate(ot.work_date);
    return (
      ot.employee_id === selectedEmployee.employee_id &&
      ot.status === "Approved" &&
      workDate &&
      workDate.getFullYear() === new Date().getFullYear()
    );
  });

  const yearlyTotalOvertimeHours = yearlyOvertimeRecords.reduce((sum, ot) => {
    const hours = parseFloat(ot.extra_hours);
    return isNaN(hours) || hours <= 0 ? sum : sum + hours;
  }, 0);

  const yearlyTotalOvertimePay = yearlyOvertimeRecords.reduce((sum, ot) => {
    const hours = parseFloat(ot.extra_hours);
    let rate = parseFloat(ot.rate);
    if (isNaN(rate) || rate <= 0) {
      if (
        planData.isOvertimePay &&
        planData.overtimePayAmount &&
        !isNaN(parseFloat(planData.overtimePayAmount))
      ) {
        rate = parseFloat(planData.overtimePayAmount);
      } else {
        rate = 500;
      }
    }
    return isNaN(hours) || hours <= 0 ? sum : sum + hours * rate;
  }, 0);

  let overtimeRate = 0;
  if (employeeOvertime.length > 0 && totalOvertimeHours > 0) {
    overtimeRate = totalOvertimePay / totalOvertimeHours;
  } else if (employeeOvertime.length > 0) {
    const firstRecord = employeeOvertime[0];
    overtimeRate = parseFloat(firstRecord.rate);
    if (isNaN(overtimeRate) || overtimeRate <= 0) {
      if (
        planData.isOvertimePay &&
        planData.overtimePayAmount &&
        !isNaN(parseFloat(planData.overtimePayAmount))
      ) {
        overtimeRate = parseFloat(planData.overtimePayAmount);
      } else {
        overtimeRate = 500;
        console.warn(
          `No valid rate or overtimePayAmount for employee ${selectedEmployee.employee_id}; using default rate=₹500/hour`
        );
      }
    }
  }

  const getOvertimePlanDetail = (tab) => {
    let otRecords =
      tab === "monthly" ? employeeOvertime : yearlyOvertimeRecords;
    let totalHours =
      tab === "monthly" ? totalOvertimeHours : yearlyTotalOvertimeHours;
    let totalPay =
      tab === "monthly" ? totalOvertimePay : yearlyTotalOvertimePay;
    if (totalHours <= 0) return "No overtime records";
    let rate = 0;
    if (otRecords.length > 0 && totalHours > 0) {
      rate = totalPay / totalHours;
    } else if (otRecords.length > 0) {
      const firstRecord = otRecords[0];
      rate = parseFloat(firstRecord.rate);
      if (isNaN(rate) || rate <= 0) {
        rate =
          planData.isOvertimePay && planData.overtimePayAmount
            ? parseFloat(planData.overtimePayAmount)
            : 500;
      }
    }
    return `${totalHours.toFixed(2)} hours at ₹${rate.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}/hour`;
  };

  const currentYm = getCurrentYearMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, "0");
  const empId = String(selectedEmployee.employee_id).toUpperCase();

  const formatMonthYear = (monthString) => {
    if (!monthString) return "";
    const [year, month] = monthString.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const incentiveObj = employeeIncentiveData[empId] || null;
  let monthlyIncentiveData = 0;
  let yearlyIncentiveData = 0;
  let monthlyIncentivePlanDetail = "None";
  let yearlyIncentivePlanDetail = "None";
  if (incentiveObj) {
    const currentMonthIncentives = (incentiveObj.incentives || []).filter(
      (inc) => inc.applicable_month === currentYm
    );
    if (currentMonthIncentives.length > 0) {
      monthlyIncentivePlanDetail = currentMonthIncentives
        .map((inc) => {
          const typeLabel = inc.incentive_type === "ctc" ? "CTC" : "Sales";
          const value = parseFloat(inc.value || 0).toLocaleString();
          return `${formatMonthYear(
            inc.applicable_month
          )}: ₹${value} (${typeLabel} ${inc.ctc_percentage || ""}%)`;
        })
        .join(", ");
      monthlyIncentiveData = currentMonthIncentives.reduce(
        (sum, inc) => sum + parseFloat(inc.value || 0),
        0
      );
    }
    const currentYearIncentives = (incentiveObj.incentives || []).filter(
      (inc) =>
        new Date(inc.applicable_month + "-01").getFullYear() === currentYear
    );
    if (currentYearIncentives.length > 0) {
      yearlyIncentivePlanDetail = currentYearIncentives
        .map((inc) => {
          const typeLabel = inc.incentive_type === "ctc" ? "CTC" : "Sales";
          const value = parseFloat(inc.value || 0).toLocaleString();
          return `${formatMonthYear(
            inc.applicable_month
          )}: ₹${value} (${typeLabel} ${inc.ctc_percentage || ""}%)`;
        })
        .join(", ");
      yearlyIncentiveData = currentYearIncentives.reduce(
        (sum, inc) => sum + parseFloat(inc.value || 0),
        0
      );
    }
  }

  const lopData = employeeLopData[selectedEmployee.employee_id] || {
    currentMonth: { days: 0, value: "0.00", currency: "INR" },
    deferred: { days: 0, value: "0.00", currency: "INR" },
    nextMonth: { days: 0, value: "0.00", currency: "INR" },
    yearly: { days: 0, value: "0.00", currency: "INR" },
  };

  const getLopPlanDetail = (tab) => {
    if (!lopData) return "None";
    let days = parseFloat(lopData.yearly?.days || 0);
    let value = parseFloat(lopData.yearly?.value || 0);
    if (tab === "monthly") {
      days = parseFloat(lopData.yearly?.days || 0);
      value = parseFloat(lopData.yearly?.value || 0);
    } else if (tab === "yearly") {
      days = parseFloat(lopData.yearly?.days || 0);
      value = parseFloat(lopData.yearly?.value || 0);
    }
    if (days === 0 && value === 0) return "None";
    return `${days} day${days !== 1 ? "s" : ""} – ₹${value.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatCalculationBase = (base) => {
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Basic";
  };

  const monthlyBonuses = bonusRecords.filter((bonus) => {
    const date = parseApplicableMonth(bonus.applicable_month);
    return (
      date &&
      date.getFullYear() === currentYear &&
      (date.getMonth() + 1).toString().padStart(2, "0") === currentMonthStr
    );
  });

  const monthlyBonusPay = monthlyBonuses.reduce((sum, bonus) => {
    let bonusAmount = 0;
    if (bonus.fixed_amount && !isNaN(parseFloat(bonus.fixed_amount))) {
      bonusAmount = parseFloat(bonus.fixed_amount);
    } else if (
      bonus.percentage_ctc &&
      !isNaN(parseFloat(bonus.percentage_ctc))
    ) {
      bonusAmount =
        (parseFloat(bonus.percentage_ctc) / 100) *
        parseFloat(selectedEmployee.ctc || 0);
    } else if (
      bonus.percentage_monthly_salary &&
      !isNaN(parseFloat(bonus.percentage_monthly_salary))
    ) {
      bonusAmount = parseFloat(bonus.percentage_monthly_salary) * monthlyCTC;
    }
    return sum + bonusAmount;
  }, 0);

  const yearlyBonuses = bonusRecords.filter((bonus) => {
    const date = parseApplicableMonth(bonus.applicable_month);
    return date && date.getFullYear() === currentYear;
  });

  const yearlyBonusPay = yearlyBonuses.reduce((sum, bonus) => {
    let bonusAmount = 0;
    if (bonus.fixed_amount && !isNaN(parseFloat(bonus.fixed_amount))) {
      bonusAmount = parseFloat(bonus.fixed_amount);
    } else if (
      bonus.percentage_ctc &&
      !isNaN(parseFloat(bonus.percentage_ctc))
    ) {
      bonusAmount =
        (parseFloat(bonus.percentage_ctc) / 100) *
        parseFloat(selectedEmployee.ctc || 0);
    } else if (
      bonus.percentage_monthly_salary &&
      !isNaN(parseFloat(bonus.percentage_monthly_salary))
    ) {
      bonusAmount = parseFloat(bonus.percentage_monthly_salary) * monthlyCTC;
    }
    return sum + bonusAmount;
  }, 0);

  const getBonusPlanDetail = (tab) => {
    const bonuses = tab === "monthly" ? monthlyBonuses : yearlyBonuses;
    if (bonuses.length === 0) return "None";
    return (
      bonuses
        .map((bonus) => {
          const monthYear = formatMonthYear(bonus.applicable_month);
          if (bonus.fixed_amount && !isNaN(parseFloat(bonus.fixed_amount))) {
            return `₹${parseFloat(
              bonus.fixed_amount
            ).toLocaleString()} (Fixed for ${monthYear})`;
          } else if (
            bonus.percentage_ctc &&
            !isNaN(parseFloat(bonus.percentage_ctc))
          ) {
            return `${bonus.percentage_ctc}% of CTC (for ${monthYear})`;
          } else if (
            bonus.percentage_monthly_salary &&
            !isNaN(parseFloat(bonus.percentage_monthly_salary))
          ) {
            return `${bonus.percentage_monthly_salary} times of Monthly Salary (for ${monthYear})`;
          }
          return null;
        })
        .filter(Boolean)
        .join(", ") || "Multiple Bonuses"
    );
  };

  const components = [
  // ====================== EARNINGS ======================
  {
    label: "Basic Salary",
    planDetail: planData.isBasicSalary && planData.basicSalary ? 
      `${planData.basicSalary}% of CTC` : "40% of CTC (default)",
    yearly: salaryDetails.basicSalary * 12,
    monthly: salaryDetails.basicSalary,
    isDeduction: false,
    category: "Earnings",
  },
  {
    label: "HRA",
    planDetail: planData.isHouseRentAllowance && planData.houseRentAllowance ? 
      `${planData.houseRentAllowance}% of Basic` : "50% of Basic (default)",
    yearly: salaryDetails.hra * 12,
    monthly: salaryDetails.hra,
    isDeduction: false,
    category: "Earnings",
  },
  {
    label: "LTA Allowance",
    planDetail: planData.isLtaAllowance && planData.ltaAllowance ? 
      `${planData.ltaAllowance}% of CTC` : "5% of CTC (default)",
    yearly: salaryDetails.ltaAllowance * 12,
    monthly: salaryDetails.ltaAllowance,
    isDeduction: false,
    category: "Earnings",
  },
  {
    label: "Other Allowances",
    planDetail: planData.otherAllowanceText || "Balancing Component",
    yearly: salaryDetails.otherAllowances * 12,
    monthly: salaryDetails.otherAllowances,
    isDeduction: false,
    category: "Earnings",
  },
  {
    label: "Incentives",
    planDetail: activeTab === "monthly" ? monthlyIncentivePlanDetail : yearlyIncentivePlanDetail,
    yearly: yearlyIncentiveData,
    monthly: monthlyIncentiveData,
    isDeduction: false,
    category: "Earnings",
  },
  {
    label: "Overtime Pay",
    planDetail: getOvertimePlanDetail(activeTab),
    yearly: yearlyTotalOvertimePay,
    monthly: totalOvertimePay,
    isDeduction: false,
    category: "Earnings",
  },
  {
    label: "Statutory Bonus",
    planDetail: planData.isStatutoryBonus ? 
      `${planData.statutoryBonusPercentage || 0}% of CTC` : "0%",
    yearly: salaryDetails.statutoryBonusYearly,
    monthly: salaryDetails.statutoryBonus,
    isDeduction: false,
    category: "Earnings",
  },
  {
    label: "Bonus Pay",
    planDetail: getBonusPlanDetail(activeTab),
    yearly: yearlyBonusPay,
    monthly: monthlyBonusPay,
    isDeduction: false,
    category: "Earnings",
  },

  // ====================== EMPLOYER CONTRIBUTIONS ======================
  {
    label: "Employer PF",
    planDetail: planData.pfEmployerText || "12% of Basic (Employer)",
    yearly: salaryDetails.employerPF * 12,
    monthly: salaryDetails.employerPF,
    isDeduction: true,
    category: "Deductions",
    deductedFromNet: false,
  },
  {
    label: "Gratuity",
    planDetail: planData.gratuityPercentage ? 
      `${planData.gratuityPercentage}% of Basic (Employer)` : "4.81% of Basic (Employer)",
    yearly: salaryDetails.gratuity * 12,
    monthly: salaryDetails.gratuity,
    isDeduction: true,
    category: "Deductions",
    deductedFromNet: false,
  },
  {
    label: "Insurance",
    planDetail: planData.insuranceEmployerText || "Insurance (Employer)",
    yearly: salaryDetails.insuranceEmployer * 12,
    monthly: salaryDetails.insuranceEmployer,
    isDeduction: true,
    category: "Deductions",
    deductedFromNet: false,
  },
  {
    label: "ESIC",
    planDetail: planData.esicEmployerText || "ESIC (Employer)",
    yearly: salaryDetails.esicEmployer * 12,
    monthly: salaryDetails.esicEmployer,
    isDeduction: true,
    category: "Deductions",
    deductedFromNet: false,
  },

  // ====================== EMPLOYEE DEDUCTIONS ======================
  {
    label: "Employee PF",
    planDetail: planData.pfEmployeeText || "12% of Basic",
    yearly: salaryDetails.employeePF * 12,
    monthly: salaryDetails.employeePF,
    isDeduction: true,
    category: "Deductions",
    deductedFromNet: true,
  },
  {
    label: "ESIC",
    planDetail: planData.esicEmployeeText || "ESIC (Employee)",
    yearly: salaryDetails.esic * 12,
    monthly: salaryDetails.esic,
    isDeduction: true,
    category: "Deductions",
    deductedFromNet: true,
  },
  {
    label: "Professional Tax",
    planDetail: planData.professionalTaxText || "Professional Tax",
    yearly: salaryDetails.professionalTax * 12,
    monthly: salaryDetails.professionalTax,
    isDeduction: true,
    category: "Deductions",
    deductedFromNet: true,
  },
  {
    label: "Insurance",
    planDetail: planData.insuranceEmployeeText || "Insurance (Employee)",
    yearly: salaryDetails.insurance * 12,
    monthly: salaryDetails.insurance,
    isDeduction: true,
    category: "Deductions",
    deductedFromNet: true,
  },
  {
    label: "TDS",
    planDetail: "Calculated based on CTC",
    yearly: salaryDetails.tds * 12,
    monthly: salaryDetails.tds,
    isDeduction: true,
    category: "Deductions",
    deductedFromNet: true,
  },
  {
    label: "LOP Deduction",
    planDetail: getLopPlanDetail(activeTab),
    yearly: parseFloat(lopData.yearly?.value || 0),
    monthly: parseFloat(lopData.currentMonth?.value || 0),
    isDeduction: true,
    category: "Deductions",
    deductedFromNet: true,
  },
  {
    label: "Advance Recovery",
    planDetail: "Advance Recovery",
    yearly: salaryDetails.advanceRecovery * 12,
    monthly: salaryDetails.advanceRecovery,
    isDeduction: true,
    category: "Deductions",
    deductedFromNet: true,
  },
];

 const getAmountForTab = (comp, tab) =>
    tab === "yearly" ? comp.yearly || 0 : comp.monthly || 0;
    // ====================== FIXED CALCULATION LOGIC ======================
  console.log("=== DetailsTab Debug ===");
  console.log("Active Tab:", activeTab);
  console.log("Monthly CTC:", monthlyCTC);
  console.log("Local Gross (Monthly):", salaryDetails.localGross);
  console.log("Local Net (Monthly):", salaryDetails.localNet);

  // Scale for Yearly view
  const displayedGross = activeTab === "yearly" 
    ? (salaryDetails.localGross || 0) * 12 
    : (salaryDetails.localGross || 0);

  const displayedNet = activeTab === "yearly" 
    ? (salaryDetails.localNet || 0) * 12 
    : (salaryDetails.localNet || 0);

  console.log("Displayed Gross:", displayedGross);
  console.log("Displayed Net:", displayedNet);
  // ==================================================================

  // Gross is always full Monthly CTC
  const grossAmount = monthlyCTC;

  // All components that reduce Net Salary
  const allDeductionsForNet = components.filter((comp) => {
    if (!comp.isDeduction) return false;
    const amount = parseFloat(getAmountForTab(comp, activeTab) || 0);
    return amount > 0;
  });

  const totalDeductions = allDeductionsForNet.reduce((sum, comp) => {
    return sum + parseFloat(getAmountForTab(comp, activeTab) || 0);
  }, 0);

  const netAmount = Math.max(0, grossAmount - totalDeductions);

  console.log("Gross Amount (should be 41666.67):", grossAmount);
  console.log("Total Deductions:", totalDeductions);
  console.log("Net Amount:", netAmount);
  console.log("All Deductions Count:", allDeductionsForNet.length);
  console.log("Components labels:", components.map(c => c.label));
  // ==================================================================


 const filteredEarnings = components.filter((comp) => {
    if (comp.category !== "Earnings") return false;
    const amount = parseFloat(getAmountForTab(comp, activeTab) || 0);
    return amount > 0;
  });

  const totalEarnings = filteredEarnings.reduce((sum, comp) => {
    return sum + parseFloat(getAmountForTab(comp, activeTab) || 0);
  }, 0);

  // 2. Employee Deductions that reduce Net Salary (PF Emp, ESIC, PT, Insurance)
  const employeeDeductionsForNet = components.filter((comp) => {
    if (!comp.isDeduction) return false;
    if (!["Employee PF", "ESIC", "Professional Tax", "Insurance"].includes(comp.label)) {
      return false;
    }
    const amount = parseFloat(getAmountForTab(comp, activeTab) || 0);
    return amount > 0 && comp.deductedFromNet !== false;
  });

  const totalEmployeeDeductions = employeeDeductionsForNet.reduce((sum, comp) => {
    return sum + parseFloat(getAmountForTab(comp, activeTab) || 0);
  }, 0);

  // Final Calculations (This is what you wanted)
  const finalGross = totalEarnings;
  const finalNet = Math.max(0, totalEarnings - totalEmployeeDeductions);

  console.log("Final Gross (Earnings Only):", finalGross);
  console.log("Final Net (Earnings - Employee Deductions):", finalNet);
  // ==================================================================

  // Employer Contributions
// Employer Contributions Filter
const employerContributions = components.filter((comp) => 
  ["Employer PF", "Gratuity", "Insurance", "ESIC"].includes(comp.label) &&
  parseFloat(getAmountForTab(comp, activeTab) || 0) > 0
);

// Employee Deductions Filter (only those that reduce Net Salary)
const deductedComponents = components.filter((comp) => 
  comp.deductedFromNet === true &&
  parseFloat(getAmountForTab(comp, activeTab) || 0) > 0 &&
  !["Employer PF", "Gratuity"].includes(comp.label)
);

  const filteredOther = components.filter((comp) => comp.category === "Other");

// const deductedComponents = components.filter((comp) => {
//   const amount = parseFloat(getAmountForTab(comp, activeTab) || 0);
//   if (amount <= 0) return false;

//   if (comp.label === "LOP Deduction" && activeTab === "yearly") return false;
//   if (comp.label === "TDS" && amount <= 0) return false;

//   return (
//     comp.category === "Deductions" &&
//     comp.deductedFromNet === true &&                    // Only employee side
//     !["Employer PF", "Gratuity", "Insurance", "ESIC"].includes(comp.label)
//   );
// });

 // Improved Employer Contributions Filter
const employerComponents = components.filter((comp) => {
  const amount = parseFloat(getAmountForTab(comp, activeTab) || 0);
  if (amount <= 0) return false;

  return (
    (comp.label === "Employer PF" ||
     comp.label === "Gratuity" ||
     comp.label === "Insurance" ||           // ← Added
     comp.label === "ESIC") &&               // ← Added
    !comp.deductedFromNet                    // Only employer side
  );
});

  // const filteredOther = components.filter((comp) => comp.category === "Other");

  const calculateDisplayedGross = (tab) => {
    const amounts = filteredEarnings.map((comp) => getAmountForTab(comp, tab));
    return amounts.reduce((sum, amt) => sum + parseFloat(amt || 0), 0);
  };

  const grossMonthly = calculateDisplayedGross("monthly");
  const grossYearly = calculateDisplayedGross("yearly");

  const adjustGrossBasedDeductions = () => {
    const pfEmployeeComp = components.find((c) => c.label === "Employee PF");
    if (pfEmployeeComp) {
      const rate =
        planData.isPFApplicable &&
        planData.isPFEmployee &&
        planData.pfEmployeeType === "percentage"
          ? parseFloat(planData.pfEmployeePercentage || 0) / 100
          : 0;
      const base = planData.pfCalculationBase;
      if (rate > 0 && base === "gross") {
        pfEmployeeComp.monthly = rate * grossMonthly;
        pfEmployeeComp.yearly = rate * grossYearly;
      }
    }

    const pfEmployerComp = components.find((c) => c.label === "Employer PF");
    if (pfEmployerComp) {
      const rate =
        planData.isPFApplicable &&
        planData.isPFEmployer &&
        planData.pfEmployerType === "percentage"
          ? parseFloat(planData.pfEmployerPercentage || 0) / 100
          : 0;
      const base = planData.pfCalculationBase;
      if (rate > 0 && base === "gross") {
        pfEmployerComp.monthly = rate * grossMonthly;
        pfEmployerComp.yearly = rate * grossYearly;
      }
    }

    const esicComp = components.find((c) => c.label === "ESIC");
    if (esicComp) {
      const rate =
        planData.isMedicalApplicable &&
        planData.isESICEmployee &&
        planData.esicEmployeeType === "percentage"
          ? parseFloat(planData.esicEmployeePercentage || 0) / 100
          : 0;
      const base = planData.medicalCalculationBase;
      if (rate > 0 && base === "gross") {
        esicComp.monthly = rate * grossMonthly;
        esicComp.yearly = rate * grossYearly;
      }
    }

    const insuranceComp = components.find((c) => c.label === "Insurance");
    if (insuranceComp) {
      const rate =
        planData.isMedicalApplicable &&
        planData.isInsuranceEmployee &&
        planData.insuranceEmployeeType === "percentage"
          ? parseFloat(planData.insuranceEmployeePercentage || 0) / 100
          : 0;
      const base = planData.medicalCalculationBase;
      if (rate > 0 && base === "gross") {
        insuranceComp.monthly = rate * grossMonthly;
        insuranceComp.yearly = rate * grossYearly;
      }
    }
  };

  adjustGrossBasedDeductions();

  const calculateDisplayedNet = (tab) => {
    const gross = tab === "yearly" ? grossYearly : grossMonthly;
    const deductionAmounts = deductedComponents.map((comp) =>
      getAmountForTab(comp, tab)
    );
    const deductions = deductionAmounts.reduce(
      (sum, amt) => sum + parseFloat(amt || 0),
      0
    );
    return gross - deductions;
  };

  const netMonthly = calculateDisplayedNet("monthly");
  const netYearly = calculateDisplayedNet("yearly");

    const renderAmount = (item, tab) => {
    const amount = getAmountForTab(item, tab);
    if (amount != null && amount >= 0) {
      return `₹${parseFloat(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return "N/A";
  };
  return (
    <div className="sb-details-tab">
      <div className="sb-details-tab-header">
        <h2>Salary Details</h2>
        <button
          className="sb-details-tab-close"
          onClick={handleCloseDetailsTab}
        >
          ×
        </button>
      </div>
      <div className="sb-details-tab-content">
        <div className="sb-details-employee-name">
          {selectedEmployee.full_name || "N/A"}
        </div>
        <div className="sb-details-ctc-info">
          <div>
            <strong>Comp. Plan:</strong>{" "}
            {selectedEmployee.compensation_plan_name || "N/A"}
          </div>
          <div>
            <strong>CTC (Yearly):</strong> ₹
            {selectedEmployee.ctc
              ? parseFloat(selectedEmployee.ctc).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "N/A"}
          </div>
          <div>
            <strong>CTC (Monthly):</strong> ₹
            {selectedEmployee.ctc
              ? (parseFloat(selectedEmployee.ctc) / 12).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )
              : "N/A"}
          </div>
        </div>
        <div className="sb-details-tab-buttons">
          <button
            className={`sb-details-tab-button yearly ${
              activeTab === "yearly" ? "active" : ""
            }`}
            onClick={() => setActiveTab("yearly")}
          >
            Yearly
          </button>
          <button
            className={`sb-details-tab-button monthly ${
              activeTab === "monthly" ? "active" : ""
            }`}
            onClick={() => setActiveTab("monthly")}
          >
            Monthly
          </button>
        </div>
        <div className="sb-details-tab-details">
       <table className="sb-details-table">
  <thead>
    <tr>
      <th className="sb-details-table-header sb-details-align-left">Component</th>
      <th className="sb-details-table-header sb-details-align-left">Comp. Plan</th>
      <th className="sb-details-table-header sb-details-align-right">
        {activeTab === "yearly" ? "Yearly (₹)" : "Monthly (₹)"}
      </th>
    </tr>
  </thead>
  <tbody>

    {/* Employee Earnings */}
    <tr className="sb-details-section-header">
      <td colSpan="3" className="sb-details-section-title">Employee Earnings</td>
    </tr>
    {filteredEarnings.map((item, index) => (
      <tr key={`earnings-${index}`} className="sb-details-earnings-row">
        <td>{item.label}</td>
        <td>{item.planDetail}</td>
        <td className="sb-details-align-right">{renderAmount(item, activeTab)}</td>
      </tr>
    ))}
    <tr className="sb-details-total-row">
      <td><strong>Total Earnings (A)</strong></td>
      <td></td>
      <td className="sb-details-align-right">
        <strong>₹{(activeTab === "yearly" ? grossYearly : grossMonthly).toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong>
      </td>
    </tr>

    {/* Employer Contributions */}
    {employerComponents.length > 0 && (
      <>
        <tr className="sb-details-section-header">
          <td colSpan="3" className="sb-details-section-title">Employer Contributions</td>
        </tr>
        {employerComponents.map((item, index) => (
          <tr key={`emp-contrib-${index}`}>
            <td>{item.label}</td>
            <td>{item.planDetail} (Employer)</td>
            <td className="sb-details-align-right">{renderAmount(item, activeTab)}</td>
          </tr>
        ))}
        <tr className="sb-details-total-row">
          <td><strong>Total Employer Contribution (B)</strong></td>
          <td></td>
          <td className="sb-details-align-right">
            <strong>₹{employerComponents.reduce((sum, item) => sum + parseFloat(getAmountForTab(item, activeTab) || 0), 0)
              .toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong>
          </td>
        </tr>
      </>
    )}

    {/* Final CTC Validation */}
    <tr className="sb-details-section-header">
      <td colSpan="3" className="sb-details-section-title">Final CTC Validation</td>
    </tr>
    <tr className="sb-details-total-row">
      <td><strong>Gross Salary (A)</strong></td>
      <td></td>
      <td className="sb-details-align-right">
        <strong>₹{(activeTab === "yearly" ? grossYearly : grossMonthly).toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong>
      </td>
    </tr>
    {employerComponents.length > 0 && (
      <tr className="sb-details-total-row">
        <td><strong>Total Employer Contribution (B)</strong></td>
        <td></td>
        <td className="sb-details-align-right">
          <strong>₹{employerComponents.reduce((sum, item) => sum + parseFloat(getAmountForTab(item, activeTab) || 0), 0)
            .toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong>
        </td>
      </tr>
    )}
    <tr className="sb-details-total-row">
      <td><strong>Final CTC (A + B)</strong></td>
      <td></td>
      <td className="sb-details-align-right">
        <strong>₹{(
          (activeTab === "yearly" ? grossYearly : grossMonthly) +
          employerComponents.reduce((sum, item) => sum + parseFloat(getAmountForTab(item, activeTab) || 0), 0)
        ).toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong>
      </td>
    </tr>

    {/* Employee Deductions */}
    <tr className="sb-details-section-header">
      <td colSpan="3" className="sb-details-section-title">Employee Deductions</td>
    </tr>
    {deductedComponents.map((item, index) => (
      <tr key={`ded-${index}`}>
        <td>{item.label}</td>
        <td>{item.planDetail}</td>
        <td className="sb-details-align-right">{renderAmount(item, activeTab)}</td>
      </tr>
    ))}
    <tr className="sb-details-total-row">
      <td><strong>Total Deduction (C)</strong></td>
      <td></td>
      <td className="sb-details-align-right">
        <strong>₹{deductedComponents.reduce((sum, item) => sum + parseFloat(getAmountForTab(item, activeTab) || 0), 0)
          .toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong>
      </td>
    </tr>

    {/* Net Salary */}
    <tr className="sb-details-total-row" style={{ backgroundColor: "#f0f9f0", fontWeight: "bold" }}>
      <td><strong>Net Salary</strong></td>
      <td>Earnings - Employee Deductions</td>
      <td className="sb-details-align-right">
        <strong>₹{(activeTab === "yearly" ? netYearly : netMonthly).toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong>
      </td>
    </tr>

  </tbody>
</table>
        </div>
      </div>
    </div>
  );
};

export default DetailsTab;