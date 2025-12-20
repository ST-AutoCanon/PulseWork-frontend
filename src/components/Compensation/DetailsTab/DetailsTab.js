
import React from 'react';
import './DetailsTab.css';
import { parseApplicableMonth, parseWorkDate, getPayrollFilter, getCurrentYearMonth } from '../../../utils/SalaryCalculations';

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
    basicSalary: { percentage: '40', type: 'percentage' },
    hra: { percentage: '50', type: 'percentage' },
    lta: { percentage: '0', type: 'percentage' },
    otherAllowance: { percentage: 'fill', type: 'percentage' },
    variablePay: { percentage: '0', type: 'percentage' },
    statutoryBonus: { percentage: '0', type: 'percentage' },
    professionalTax: { amount: '200', type: 'amount' },
    pfEmployee: { percentage: '0', type: 'percentage' },
    pfEmployer: { percentage: '0', type: 'percentage' },
    esicEmployee: { percentage: '0', type: 'percentage' },
    insuranceEmployee: { percentage: '0', type: 'percentage' },
    gratuity: { percentage: '4.81', type: 'percentage' },
    tds: { percentage: '0', type: 'percentage' },
    advanceRecovery: { amount: '0', type: 'amount' },
  };

  const getDisplayDayStatus = (status) => {
    switch(status) {
      case 'fullDay': return 'Full Day';
      case 'halfDay': return 'Half Day';
      case 'weekOff': return 'Week Off';
      default: return status;
    }
  };

  const formatWorkingDays = (workingDays) => {
    if (!workingDays || typeof workingDays !== 'object') return ['None'];
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return Object.entries(workingDays)
      .sort(([dayA], [dayB]) => dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB))
      .map(([day, status]) => `${day}: ${getDisplayDayStatus(status)}`);
  };

  const formatTdsSlabs = (slabs) => {
    if (!Array.isArray(slabs) || slabs.length === 0) return 'None';
    return slabs
      .map((slab) => `From ₹${slab.from || '0'} to ₹${slab.to || '∞'}: ${slab.percentage || '0'}%`)
      .join('; ');
  };

  // Helper to find and format the applied TDS slab
  const getAppliedTdsSlab = (ctc, tdsSlabs) => {
    if (!Array.isArray(tdsSlabs) || tdsSlabs.length === 0 || !ctc) return null;
    const annualCtc = parseFloat(ctc);
    const sortedSlabs = [...tdsSlabs].sort((a, b) => parseInt(a.from) - parseInt(b.from));
    for (const slab of sortedSlabs) {
      const lower = parseInt(slab.from) || 0;
      const upper = parseInt(slab.to) || Infinity;
      const rate = parseFloat(slab.percentage) / 100 || 0;
      if (annualCtc >= lower && (upper === Infinity || annualCtc <= upper) && rate > 0) {
        return `From ₹${lower} to ₹${upper === Infinity ? '∞' : upper}: ${slab.percentage}% (applied to Annual CTC)`;
      }
    }
    return null;
  };

  if (!selectedEmployee || !selectedEmployee.employee_id || !selectedEmployee.ctc || selectedEmployee.ctc <= 0) {
    console.error('Invalid employee data:', { employee_id: selectedEmployee?.employee_id, ctc: selectedEmployee?.ctc });
    return <p>No valid employee data provided</p>;
  }

  const planData = selectedEmployee.plan_data || {};
  const monthlyCTC = selectedEmployee.ctc / 12;
  const salaryDetails = calculateSalaryDetails(
    selectedEmployee.ctc,
    planData,
    selectedEmployee.employee_id,
    overtimeRecords,
    bonusRecords,
    advances,
    employeeIncentiveData,
    employeeLopData
  );

  // Calculate total overtime hours, rate, and pay
 // Import helper at top of file (after existing imports)

// In component (after salaryDetails = calculateSalaryDetails(...))
const { targetMonthStr, targetYear, windowStart, windowEnd } = getPayrollFilter();
const employeeOvertime = overtimeRecords.filter((ot) => {
  const workDate = parseWorkDate(ot.work_date);
  const updatedDate = new Date(ot.updated_at || ot.created_at);
  const isInWindow = updatedDate >= windowStart && updatedDate < windowEnd;
  const monthStr = String(workDate ? workDate.getMonth() + 1 : 0).padStart(2, '0');
  return (
    ot.employee_id === selectedEmployee.employee_id &&
    ot.status === 'Approved' &&
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
      rate = 500; // Fallback default rate
    }
  }
  return isNaN(hours) || hours <= 0 ? sum : sum + (hours * rate);
}, 0);

// Yearly overtime calculation
const yearlyOvertimeRecords = overtimeRecords.filter((ot) => {
  const workDate = parseWorkDate(ot.work_date);
  return (
    ot.employee_id === selectedEmployee.employee_id &&
    ot.status === 'Approved' &&
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
      rate = 500; // Fallback default rate
    }
  }
  return isNaN(hours) || hours <= 0 ? sum : sum + (hours * rate);
}, 0);

let overtimeRate = 0;
if (employeeOvertime.length > 0 && totalOvertimeHours > 0) {
  // Use average rate for display
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
      overtimeRate = 500; // Fallback default rate
      console.warn(`No valid rate or overtimePayAmount for employee ${selectedEmployee.employee_id}; using default rate=₹500/hour`);
    }
  }
}

const getOvertimePlanDetail = (tab) => {
  let otRecords = tab === 'monthly' ? employeeOvertime : yearlyOvertimeRecords;
  let totalHours = tab === 'monthly' ? totalOvertimeHours : yearlyTotalOvertimeHours;
  let totalPay = tab === 'monthly' ? totalOvertimePay : yearlyTotalOvertimePay;
  if (totalHours <= 0) return 'No overtime records';
  let rate = 0;
  if (otRecords.length > 0 && totalHours > 0) {
    rate = totalPay / totalHours;
  } else if (otRecords.length > 0) {
    const firstRecord = otRecords[0];
    rate = parseFloat(firstRecord.rate);
    if (isNaN(rate) || rate <= 0) {
      rate = planData.isOvertimePay && planData.overtimePayAmount ? parseFloat(planData.overtimePayAmount) : 500;
    }
  }
  return `${totalHours.toFixed(2)} hours at ₹${rate.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}/hour`;
};

const currentYm = getCurrentYearMonth();
const currentYear = new Date().getFullYear();
const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');
const empId = String(selectedEmployee.employee_id).toUpperCase();

  const formatMonthYear = (monthString) => {
    if (!monthString) return "";
    const [year, month] = monthString.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" }); // e.g. October 2025
  };

  // empId already defined
  const incentiveObj = employeeIncentiveData[empId] || null;
  let monthlyIncentiveData = 0;
  let yearlyIncentiveData = 0;
  let monthlyIncentivePlanDetail = "None";
  let yearlyIncentivePlanDetail = "None";
  if (incentiveObj) {
    // Monthly incentives
    const currentMonthIncentives = (incentiveObj.incentives || []).filter(
      (inc) => inc.applicable_month === currentYm
    );
    if (currentMonthIncentives.length > 0) {
      monthlyIncentivePlanDetail = currentMonthIncentives
        .map((inc) => {
          const typeLabel = inc.incentive_type === "ctc" ? "CTC" : "Sales";
          const value = parseFloat(inc.value || 0).toLocaleString();
          return `${formatMonthYear(inc.applicable_month)}: ₹${value} (${typeLabel} ${inc.ctc_percentage || ""}%)`;
        })
        .join(", ");
      monthlyIncentiveData = currentMonthIncentives.reduce(
        (sum, inc) => sum + parseFloat(inc.value || 0),
        0
      );
    }
    // Yearly incentives
    const currentYearIncentives = (incentiveObj.incentives || []).filter(
      (inc) => new Date(inc.applicable_month + "-01").getFullYear() === currentYear
    );
    if (currentYearIncentives.length > 0) {
      yearlyIncentivePlanDetail = currentYearIncentives
        .map((inc) => {
          const typeLabel = inc.incentive_type === "ctc" ? "CTC" : "Sales";
          const value = parseFloat(inc.value || 0).toLocaleString();
          return `${formatMonthYear(inc.applicable_month)}: ₹${value} (${typeLabel} ${inc.ctc_percentage || ""}%)`;
        })
        .join(", ");
      yearlyIncentiveData = currentYearIncentives.reduce(
        (sum, inc) => sum + parseFloat(inc.value || 0),
        0
      );
    }
  }

  const lopData = employeeLopData[selectedEmployee.employee_id] || {
    currentMonth: { days: 0, value: '0.00', currency: 'INR' },
    deferred: { days: 0, value: '0.00', currency: 'INR' },
    nextMonth: { days: 0, value: '0.00', currency: 'INR' },
    yearly: { days: 0, value: '0.00', currency: 'INR' },
  };

  const getLopPlanDetail = (tab) => {
    if (!lopData) return 'None';
    let days = parseFloat(lopData.yearly?.days || 0);
    let value = parseFloat(lopData.yearly?.value || 0);
    if (tab === 'monthly') {
      days = parseFloat(lopData.yearly?.days || 0);
      value = parseFloat(lopData.yearly?.value || 0);
    } else if (tab === 'yearly') {
      days = parseFloat(lopData.yearly?.days || 0);
      value = parseFloat(lopData.yearly?.value || 0);
    }
    if (days === 0 && value === 0) return 'None';
    return `${days} day${days !== 1 ? 's' : ''} – ₹${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatCalculationBase = (base) => {
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Basic';
  };

  // Monthly bonuses
  const monthlyBonuses = bonusRecords.filter((bonus) => {
    const date = parseApplicableMonth(bonus.applicable_month);
    return (
      date &&
      date.getFullYear() === currentYear &&
      (date.getMonth() + 1).toString().padStart(2, '0') === currentMonthStr
    );
  });

  const monthlyBonusPay = monthlyBonuses.reduce((sum, bonus) => {
    let bonusAmount = 0;
    if (bonus.fixed_amount && !isNaN(parseFloat(bonus.fixed_amount))) {
      bonusAmount = parseFloat(bonus.fixed_amount);
    } else if (bonus.percentage_ctc && !isNaN(parseFloat(bonus.percentage_ctc))) {
      bonusAmount = (parseFloat(bonus.percentage_ctc) / 100) * parseFloat(selectedEmployee.ctc || 0);
    } else if (bonus.percentage_monthly_salary && !isNaN(parseFloat(bonus.percentage_monthly_salary))) {
      bonusAmount = parseFloat(bonus.percentage_monthly_salary) * monthlyCTC;
    }
    return sum + bonusAmount;
  }, 0);

  // Yearly bonuses
  const yearlyBonuses = bonusRecords.filter((bonus) => {
    const date = parseApplicableMonth(bonus.applicable_month);
    return date && date.getFullYear() === currentYear;
  });

  const yearlyBonusPay = yearlyBonuses.reduce((sum, bonus) => {
    let bonusAmount = 0;
    if (bonus.fixed_amount && !isNaN(parseFloat(bonus.fixed_amount))) {
      bonusAmount = parseFloat(bonus.fixed_amount);
    } else if (bonus.percentage_ctc && !isNaN(parseFloat(bonus.percentage_ctc))) {
      bonusAmount = (parseFloat(bonus.percentage_ctc) / 100) * parseFloat(selectedEmployee.ctc || 0);
    } else if (bonus.percentage_monthly_salary && !isNaN(parseFloat(bonus.percentage_monthly_salary))) {
      bonusAmount = parseFloat(bonus.percentage_monthly_salary) * monthlyCTC;
    }
    return sum + bonusAmount;
  }, 0);

  const getBonusPlanDetail = (tab) => {
    const bonuses = tab === 'monthly' ? monthlyBonuses : yearlyBonuses;
    if (bonuses.length === 0) return 'None';
    return bonuses
      .map((bonus) => {
        const monthYear = formatMonthYear(bonus.applicable_month);
        if (bonus.fixed_amount && !isNaN(parseFloat(bonus.fixed_amount))) {
          return `₹${parseFloat(bonus.fixed_amount).toLocaleString()} (Fixed for ${monthYear})`;
        } else if (bonus.percentage_ctc && !isNaN(parseFloat(bonus.percentage_ctc))) {
          return `${bonus.percentage_ctc}% of CTC (for ${monthYear})`;
        } else if (bonus.percentage_monthly_salary && !isNaN(parseFloat(bonus.percentage_monthly_salary))) {
          return `${bonus.percentage_monthly_salary} times of Monthly Salary (for ${monthYear})`;
        }
        return null;
      })
      .filter(Boolean)
      .join(', ') || 'Multiple Bonuses';
  };

  const components = [
    // Earnings Components
    {
      label: 'Basic Salary',
      planDetail: planData.isBasicSalary && planData.basicSalaryType === 'percentage' && planData.basicSalary
        ? `${planData.basicSalary}% of CTC`
        : planData.isBasicSalary && planData.basicSalaryType === 'amount' && planData.basicSalaryAmount
        ? `₹${parseFloat(planData.basicSalaryAmount).toLocaleString()}`
        : `${calculationDefaults.basicSalary.percentage}% of CTC (default)`,
      yearly: salaryDetails.basicSalary * 12,
      monthly: salaryDetails.basicSalary,
      isDeduction: false,
      category: 'Earnings',
    },
    {
      label: 'HRA',
      planDetail: planData.isHouseRentAllowance && planData.houseRentAllowanceType === 'percentage' && planData.houseRentAllowance
        ? `${planData.houseRentAllowance}% of Basic`
        : planData.isHouseRentAllowance && planData.houseRentAllowanceType === 'amount' && planData.houseRentAllowanceAmount
        ? `₹${parseFloat(planData.houseRentAllowanceAmount).toLocaleString()}`
        : `${calculationDefaults.hra.percentage}% of Basic (default)`,
      yearly: salaryDetails.hra * 12,
      monthly: salaryDetails.hra,
      isDeduction: false,
      category: 'Earnings',
    },
    {
      label: 'LTA Allowance',
      planDetail: planData.isLtaAllowance && planData.ltaAllowanceType === 'percentage' && planData.ltaAllowance
        ? `${planData.ltaAllowance}% of CTC`
        : planData.isLtaAllowance && planData.ltaAllowanceType === 'amount' && planData.ltaAllowanceAmount
        ? `₹${parseFloat(planData.ltaAllowanceAmount).toLocaleString()}`
        : `${calculationDefaults.lta.percentage}% of CTC (default)`,
      yearly: salaryDetails.ltaAllowance * 12,
      monthly: salaryDetails.ltaAllowance,
      isDeduction: false,
      category: 'Earnings',
    },
    {
      label: 'Other Allowances',
      planDetail: planData.isOtherAllowance && planData.otherAllowanceType === 'percentage' && planData.otherAllowance
        ? `${planData.otherAllowance}% of CTC`
        : planData.isOtherAllowance && planData.otherAllowanceType === 'amount' && planData.otherAllowanceAmount
        ? `₹${parseFloat(planData.otherAllowanceAmount).toLocaleString()}`
        : salaryDetails.otherAllowances > 0 && monthlyCTC > 0
        ? `${((salaryDetails.otherAllowances / monthlyCTC) * 100).toFixed(2)}% of CTC (calculated)`
        : `${calculationDefaults.otherAllowance.percentage}% of CTC (default)`,
      yearly: salaryDetails.otherAllowances * 12,
      monthly: salaryDetails.otherAllowances,
      isDeduction: false,
      category: 'Earnings',
    },
    {
      label: 'Incentives',
      planDetail: activeTab === 'monthly' ? monthlyIncentivePlanDetail : yearlyIncentivePlanDetail,
      yearly: yearlyIncentiveData,
      monthly: monthlyIncentiveData,
      isDeduction: false,
      category: 'Earnings',
    },
    {
      label: 'Overtime Pay',
      planDetail: getOvertimePlanDetail(activeTab),
      yearly: yearlyTotalOvertimePay,
      monthly: totalOvertimePay,
      isDeduction: false,
      category: 'Earnings',
    },
    {
      label: 'Statutory Bonus',
      planDetail: planData.isStatutoryBonus && planData.statutoryBonusType === 'percentage' && planData.statutoryBonusPercentage
        ? `${planData.statutoryBonusPercentage}% of CTC`
        : planData.isStatutoryBonus && planData.statutoryBonusType === 'amount' && planData.statutoryBonusAmount
        ? `₹${parseFloat(planData.statutoryBonusAmount).toLocaleString()} (Fixed)`
        : `${calculationDefaults.statutoryBonus.percentage}% of CTC (default)`,
      yearly: salaryDetails.statutoryBonusYearly,
      monthly: salaryDetails.statutoryBonus,
      isDeduction: false,
      category: 'Earnings',
    },
    {
      label: 'Bonus Pay',
      planDetail: getBonusPlanDetail(activeTab),
      yearly: yearlyBonusPay,
      monthly: monthlyBonusPay,
      isDeduction: false,
      category: 'Earnings',
    },
    // Deduction Components
    {
      label: 'Employee PF',
      planDetail: planData.isPFApplicable && planData.isPFEmployee && planData.pfEmployeeType === 'percentage' && planData.pfEmployeePercentage
        ? `${planData.pfEmployeePercentage}% of ${formatCalculationBase(planData.pfCalculationBase)}`
        : planData.isPFApplicable && planData.isPFEmployee && planData.pfEmployeeType === 'amount' && planData.pfEmployeeAmount
        ? `₹${parseFloat(planData.pfEmployeeAmount).toLocaleString()}`
        : `${calculationDefaults.pfEmployee.percentage}% of Basic (default)`,
      yearly: salaryDetails.employeePF * 12,
      monthly: salaryDetails.employeePF,
      isDeduction: true,
      category: 'Deductions',
      deductedFromNet: planData.pfEmployeeIncludeInCtc !== false,
    },
    {
      label: 'Employer PF',
      planDetail: planData.isPFApplicable && planData.isPFEmployer && planData.pfEmployerType === 'percentage' && planData.pfEmployerPercentage
        ? `${planData.pfEmployerPercentage}% of ${formatCalculationBase(planData.pfCalculationBase)}`
        : planData.isPFApplicable && planData.isPFEmployer && planData.pfEmployerType === 'amount' && planData.pfEmployerAmount
        ? `₹${parseFloat(planData.pfEmployerAmount).toLocaleString()}`
        : `${calculationDefaults.pfEmployer.percentage}% of Basic (default)`,
      yearly: salaryDetails.employerPF * 12,
      monthly: salaryDetails.employerPF,
      isDeduction: true,
      category: 'Deductions',
      deductedFromNet: planData.pfEmployerIncludeInCtc !== false,
    },
    {
      label: 'ESIC',
      planDetail: planData.isMedicalApplicable && planData.isESICEmployee && planData.esicEmployeeType === 'percentage' && planData.esicEmployeePercentage
        ? `${planData.esicEmployeePercentage}% of ${formatCalculationBase(planData.medicalCalculationBase)}`
        : planData.isMedicalApplicable && planData.isESICEmployee && planData.esicEmployeeType === 'amount' && planData.esicEmployeeAmount
        ? `₹${parseFloat(planData.esicEmployeeAmount).toLocaleString()}`
        : `${calculationDefaults.esicEmployee.percentage}% of Basic (default)`,
      yearly: salaryDetails.esic * 12,
      monthly: salaryDetails.esic,
      isDeduction: true,
      category: 'Deductions',
      deductedFromNet: planData.esicEmployeeIncludeInCtc !== false,
    },
    {
      label: 'Gratuity',
      planDetail: planData.isGratuityApplicable && planData.gratuityType === 'percentage' && planData.gratuityPercentage
        ? `${planData.gratuityPercentage}% of Basic`
        : planData.isGratuityApplicable && planData.gratuityType === 'amount' && planData.gratuityAmount
        ? `₹${parseFloat(planData.gratuityAmount).toLocaleString()}`
        : `${calculationDefaults.gratuity.percentage}% of Basic (default)`,
      yearly: salaryDetails.gratuity * 12,
      monthly: salaryDetails.gratuity,
      isDeduction: true,
      category: 'Deductions',
      deductedFromNet: planData.gratuityIncludeInCtc !== false,
    },
   {
  label: 'Professional Tax',
  planDetail: (() => {
    if (planData.isProfessionalTax && planData.professionalTaxType === 'percentage' && planData.professionalTax) {
      return `${planData.professionalTax}% of CTC (based on monthly salary slab)`;
    }
    if (planData.isProfessionalTax && planData.professionalTaxType === 'amount' && planData.professionalTaxAmount) {
      return `₹${parseFloat(planData.professionalTaxAmount).toLocaleString()} (Fixed monthly)`;
    }
    if (planData.isProfessionalTax) {
      if (monthlyCTC <= 15000) {
        return `₹0 (default - below ₹15,000 monthly CTC threshold)`;
      } else {
        return `₹${calculationDefaults.professionalTax.amount} (default - standard slab for monthly CTC > ₹15,000)`;
      }
    }
    return 'Not Applicable';
  })(),
  yearly: salaryDetails.professionalTax * 12,
  monthly: salaryDetails.professionalTax,
  isDeduction: true,
  category: 'Deductions',
  deductedFromNet: planData.professionalTaxIncludeInCtc !== false,
},
    {
  label: 'TDS',
  planDetail: (() => {
    const appliedSlab = getAppliedTdsSlab(selectedEmployee.ctc, planData.tdsSlabs || []);
    if (appliedSlab) {
      return `${appliedSlab} (calculated based on CTC)`;
    }
    if (planData.isTDSApplicable && Array.isArray(planData.tdsSlabs) && planData.tdsSlabs.length > 0) {
      return `${formatTdsSlabs(planData.tdsSlabs)} (calculated based on CTC)`;
    }
    return `${calculationDefaults.tds.percentage}% (default)`;
  })(),
  yearly: salaryDetails.tds * 12,
  monthly: salaryDetails.tds,
  isDeduction: true,
  category: 'Deductions',
  deductedFromNet: true,
},
    {
      label: 'Insurance',
      planDetail: planData.isMedicalApplicable && planData.isInsuranceEmployee && planData.insuranceEmployeeType === 'percentage' && planData.insuranceEmployeePercentage
        ? `${planData.insuranceEmployeePercentage}% of ${formatCalculationBase(planData.medicalCalculationBase)}`
        : planData.isMedicalApplicable && planData.isInsuranceEmployee && planData.insuranceEmployeeType === 'amount' && planData.insuranceEmployeeAmount
        ? `₹${parseFloat(planData.insuranceEmployeeAmount).toLocaleString()}`
        : `${calculationDefaults.insuranceEmployee.percentage}% of Basic (default)`,
      yearly: salaryDetails.insurance * 12,
      monthly: salaryDetails.insurance,
      isDeduction: true,
      category: 'Deductions',
      deductedFromNet: planData.insuranceEmployeeIncludeInCtc !== false,
    },
    {
      label: 'LOP Deduction',
      planDetail: getLopPlanDetail(activeTab),
      yearly: parseFloat(lopData.yearly?.value || 0),
      monthly: parseFloat(lopData.yearly?.value || 0),
      isDeduction: true,
      category: 'Deductions',
      deductedFromNet: true,
    },
    {
      label: 'Advance Recovery',
      planDetail: (() => {
        const employeeAdvances = advances.filter((adv) => {
          if (!adv.applicable_months || !adv.recovery_months) return false;
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
          const currentDate = new Date(currentYear, parseInt(currentMonthStr) - 1);
          const startDate = new Date(startYear, startMonth - 1);
          const endDate = new Date(endYear, endMonth - 1);
          return (
            adv.employee_id === selectedEmployee.employee_id &&
            currentDate >= startDate &&
            currentDate <= endDate
          );
        });
        if (employeeAdvances.length > 0) {
          return employeeAdvances
            .map((adv) => {
              const amount = parseFloat(adv.advance_amount);
              const months = parseInt(adv.recovery_months);
              const monthlyRecovery = months > 0 ? amount / months : 0;
              const advDate = parseApplicableMonth(adv.applicable_months);
              if (!advDate) return null;
              const currentDate = new Date(new Date().getFullYear(), new Date().getMonth());
              const startMonth = advDate.getMonth();
              const startYear = advDate.getFullYear();
              const monthsElapsed =
                (currentDate.getFullYear() - startYear) * 12 +
                (currentDate.getMonth() - startMonth) + 1;
              const deductionMonth = monthsElapsed > 0 && monthsElapsed <= months ? monthsElapsed : 1;
              return `₹${monthlyRecovery.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} (${deductionMonth}${deductionMonth === 1 ? 'st' : deductionMonth === 2 ? 'nd' : 'th'} month of ${months}, from ${adv.applicable_months})`;
            })
            .filter(Boolean)
            .join(', ');
        }
        return `${calculationDefaults.advanceRecovery.amount} (default)`;
      })(),
      yearly: salaryDetails.advanceRecovery * 12,
      monthly: salaryDetails.advanceRecovery,
      isDeduction: true,
      category: 'Deductions',
      deductedFromNet: true,
    },
    {
      label: 'Default Working Hours',
      planDetail: planData.isDefaultWorkingHours && planData.defaultWorkingHours
        ? `${planData.defaultWorkingHours} hours`
        : 'None',
      yearly: null,
      monthly: null,
      isDeduction: false,
      category: 'Other',
    },
    {
      label: 'Default Working Days',
      planDetail: planData.isDefaultWorkingDays && planData.defaultWorkingDays
        ? formatWorkingDays(planData.defaultWorkingDays)
        : 'None',
      yearly: null,
      monthly: null,
      isDeduction: false,
      category: 'Other',
    },
  ];

  // Filter components to show only those with positive amounts for the active tab (except for Other category)
  // Always include Overtime Pay and LOP Deduction
  const getAmountForTab = (comp, tab) => tab === 'yearly' ? (comp.yearly || 0) : (comp.monthly || 0);

  const filteredEarnings = components.filter((comp) => {
    if (comp.label === 'Overtime Pay' || comp.label === 'Incentives') return true;
    const amount = getAmountForTab(comp, activeTab);
    return comp.category === 'Earnings' && parseFloat(amount) > 0;
  });

  const deductedComponents = components.filter((comp) => {
    if (comp.label === 'LOP Deduction' || comp.label === 'TDS' || comp.label === 'Advance Recovery') return comp.deductedFromNet; // Always true for these
    if (comp.label === 'LOP Deduction') return true; // always show, we'll handle display inside planDetail
    const amount = getAmountForTab(comp, activeTab);
    return comp.category === 'Deductions' && comp.deductedFromNet && parseFloat(amount) > 0;
  });

  const employerComponents = components.filter((comp) => {
    if (comp.label === 'TDS' || comp.label === 'LOP Deduction' || comp.label === 'Advance Recovery') return false; // Never employer
    const amount = getAmountForTab(comp, activeTab);
    return comp.category === 'Deductions' && !comp.deductedFromNet && parseFloat(amount) > 0;
  });

  const filteredOther = components.filter((comp) => comp.category === 'Other');

  // Calculate Gross and Net based on displayed components (for consistency with table)
  const calculateDisplayedGross = (tab) => {
    const amounts = filteredEarnings.map(comp => getAmountForTab(comp, tab));
    return amounts.reduce((sum, amt) => sum + parseFloat(amt || 0), 0);
  };

  const grossMonthly = calculateDisplayedGross('monthly');
  const grossYearly = calculateDisplayedGross('yearly');

  // Adjust deduction amounts for components that are percentage of gross
  // This ensures consistency: total deduction = rate * total gross for the period
  const adjustGrossBasedDeductions = () => {
    // Employee PF
    const pfEmployeeComp = components.find(c => c.label === 'Employee PF');
    if (pfEmployeeComp) {
      const rate = planData.isPFApplicable && planData.isPFEmployee && planData.pfEmployeeType === 'percentage' 
        ? parseFloat(planData.pfEmployeePercentage || 0) / 100 
        : 0;
      const base = planData.pfCalculationBase;
      if (rate > 0 && base === 'gross') {
        pfEmployeeComp.monthly = rate * grossMonthly;
        pfEmployeeComp.yearly = rate * grossYearly;
      }
    }

    // Employer PF
    const pfEmployerComp = components.find(c => c.label === 'Employer PF');
    if (pfEmployerComp) {
      const rate = planData.isPFApplicable && planData.isPFEmployer && planData.pfEmployerType === 'percentage' 
        ? parseFloat(planData.pfEmployerPercentage || 0) / 100 
        : 0;
      const base = planData.pfCalculationBase;
      if (rate > 0 && base === 'gross') {
        pfEmployerComp.monthly = rate * grossMonthly;
        pfEmployerComp.yearly = rate * grossYearly;
      }
    }

    // ESIC
    const esicComp = components.find(c => c.label === 'ESIC');
    if (esicComp) {
      const rate = planData.isMedicalApplicable && planData.isESICEmployee && planData.esicEmployeeType === 'percentage' 
        ? parseFloat(planData.esicEmployeePercentage || 0) / 100 
        : 0;
      const base = planData.medicalCalculationBase;
      if (rate > 0 && base === 'gross') {
        esicComp.monthly = rate * grossMonthly;
        esicComp.yearly = rate * grossYearly;
      }
    }

    // Insurance
    const insuranceComp = components.find(c => c.label === 'Insurance');
    if (insuranceComp) {
      const rate = planData.isMedicalApplicable && planData.isInsuranceEmployee && planData.insuranceEmployeeType === 'percentage' 
        ? parseFloat(planData.insuranceEmployeePercentage || 0) / 100 
        : 0;
      const base = planData.medicalCalculationBase;
      if (rate > 0 && base === 'gross') {
        insuranceComp.monthly = rate * grossMonthly;
        insuranceComp.yearly = rate * grossYearly;
      }
    }
  };

  adjustGrossBasedDeductions();

  // Recalculate gross after adjustments (though deductions don't affect gross)
  // But net needs updated deduction amounts
  const calculateDisplayedNet = (tab) => {
    const gross = tab === 'yearly' ? grossYearly : grossMonthly;
    const deductionAmounts = deductedComponents.map(comp => getAmountForTab(comp, tab));
    const deductions = deductionAmounts.reduce((sum, amt) => sum + parseFloat(amt || 0), 0);
    return gross - deductions;
  };

  const netMonthly = calculateDisplayedNet('monthly');
  const netYearly = calculateDisplayedNet('yearly');

  const renderAmount = (item, tab) => {
    const amount = getAmountForTab(item, tab);
    if (amount != null && amount >= 0) {
      return `₹${parseFloat(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return 'N/A';
  };

  return (
    <div className="sb-details-tab">
      <div className="sb-details-tab-header">
        <h2>Salary Details</h2>
        <button className="sb-details-tab-close" onClick={handleCloseDetailsTab}>
          ×
        </button>
      </div>
      <div className="sb-details-tab-content">
        <div className="sb-details-employee-name">{selectedEmployee.full_name || 'N/A'}</div>
        <div className="sb-details-ctc-info">
          <div>
            <strong>Comp. Plan:</strong> {selectedEmployee.compensation_plan_name || 'N/A'}
          </div>
          <div>
            <strong>CTC (Yearly):</strong>{' '}
            ₹{selectedEmployee.ctc ? parseFloat(selectedEmployee.ctc).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
          </div>
          <div>
            <strong>CTC (Monthly):</strong>{' '}
            ₹{selectedEmployee.ctc ? (parseFloat(selectedEmployee.ctc) / 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
          </div>
        </div>
        <div className="sb-details-tab-buttons">
          <button
            className={`sb-details-tab-button yearly ${activeTab === 'yearly' ? 'active' : ''}`}
            onClick={() => setActiveTab('yearly')}
          >
            Yearly
          </button>
          <button
            className={`sb-details-tab-button monthly ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
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
                  {activeTab === 'yearly' ? 'Y.Amount' : 'M.Amount'}
                </th>
              </tr>
            </thead>
            <tbody className="sb-details-table-body-wrapper">
              {/* Earnings Section */}
              <tr className="sb-details-section-header">
                <td colSpan="3" className="sb-details-section-title">Earnings</td>
              </tr>
              {filteredEarnings.map((item, index) => (
                <tr key={`earnings-${index}`} className="sb-details-earnings-row">
                  <td className="sb-details-table-cell sb-details-align-left">{item.label}</td>
                  <td className="sb-details-table-cell sb-details-align-left">{item.planDetail}</td>
                  <td className="sb-details-table-cell sb-details-align-right">
                    {renderAmount(item, activeTab)}
                  </td>
                </tr>
              ))}
              {/* Deductions Section (only deducted from net and >0) */}
              <tr className="sb-details-section-header">
                <td colSpan="3" className="sb-details-section-title">Deductions</td>
              </tr>
              {deductedComponents.map((item, index) => (
                <tr key={`deductions-${index}`} className="sb-details-deduction-row">
                  <td className="sb-details-table-cell sb-details-align-left">{item.label}</td>
                  <td className="sb-details-table-cell sb-details-align-left">{item.planDetail}</td>
                  <td className="sb-details-table-cell sb-details-align-right">
                    {renderAmount(item, activeTab)}
                  </td>
                </tr>
              ))}
              {/* Other Employer Contributions Section (not deducted from net and >0) */}
              {employerComponents.length > 0 && (
                <>
                  <tr className="sb-details-section-header">
                    <td colSpan="3" className="sb-details-section-title">Other Employer Contributions</td>
                  </tr>
                  {employerComponents.map((item, index) => (
                    <tr key={`employer-contrib-${index}`} className="sb-details-deduction-row">
                      <td className="sb-details-table-cell sb-details-align-left">{item.label}</td>
                      <td className="sb-details-table-cell sb-details-align-left">{`${item.planDetail} (Employer Contribution)`}</td>
                      <td className="sb-details-table-cell sb-details-align-right">
                        {renderAmount(item, activeTab)}
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {/* Other Components */}
              <tr className="sb-details-section-header">
                <td colSpan="3" className="sb-details-section-title">Other</td>
              </tr>
              {filteredOther.map((item, index) => (
                <tr key={`other-${index}`}>
                  <td className="sb-details-table-cell sb-details-align-left">{item.label}</td>
                  <td className="sb-details-table-cell sb-details-align-left">
                    {Array.isArray(item.planDetail)
                      ? item.planDetail.map((line, idx) => <div key={idx}>{line}</div>)
                      : item.planDetail}
                  </td>
                  <td className="sb-details-table-cell sb-details-align-right">
                    {typeof getAmountForTab(item, activeTab) === 'number' && getAmountForTab(item, activeTab) !== null
                      ? `₹${parseFloat(getAmountForTab(item, activeTab)).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : '-'}
                  </td>
                </tr>
              ))}
              {/* Totals */}
              <tr className="sb-details-total-row">
              
              </tr>
              <tr className="sb-details-total-row">
              
              </tr>
              <tr className="sb-details-total-row">
                <td className="sb-details-table-cell sb-details-align-left">
                  <strong>Gross Salary</strong>
                </td>
                <td className="sb-details-table-cell sb-details-align-left">N/A</td>
                <td className="sb-details-table-cell sb-details-align-right">
                  <strong>
                    ₹{parseFloat(activeTab === 'yearly' ? grossYearly : grossMonthly).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </strong>
                </td>
              </tr>
              <tr className="sb-details-total-row">
                <td className="sb-details-table-cell sb-details-align-left">
                  <strong>Net Salary</strong>
                </td>
                <td className="sb-details-table-cell sb-details-align-left">N/A</td>
                <td className="sb-details-table-cell sb-details-align-right">
                  <strong>
                    ₹{parseFloat(activeTab === 'yearly' ? netYearly : netMonthly).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
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