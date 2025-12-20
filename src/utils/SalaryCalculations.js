

export const getCurrentYearMonth = () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; // e.g. "2025-09"
};


export const parseApplicableMonth = (monthStr) => {
  if (!monthStr || typeof monthStr !== "string") {
    console.log(`Invalid applicable_month format: ${monthStr}`);
    return null;
  }

  if (/^\d{4}-\d{2}$/.test(monthStr)) {
    const [year, month] = monthStr.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      console.log(`Invalid year or month in ${monthStr}`);
      return null;
    }
    return new Date(year, month - 1);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthIndex = monthNames.findIndex(
    (name) => name.toLowerCase() === monthStr.toLowerCase()
  );
  if (monthIndex !== -1) {
    return new Date(new Date().getFullYear(), monthIndex);
  }

  console.log(`Invalid applicable_month format: ${monthStr}`);
  return null;
};

export const parseWorkDate = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error(`Error parsing work date: ${dateStr}`, error);
    return null;
  }
};
export const getPayrollFilter = () => {
  const today = new Date();
  const currentYear = today.getFullYear();  // 2025
  const currentMonth = today.getMonth() + 1;  // 11 for Nov
  const currentDay = today.getDate();  // 4

  // Hardcode cutoff (fetch from API later if needed)
  const cutoffDate = 5;

  let targetMonth = currentMonth;
  let targetYear = currentYear;
  if (currentDay < cutoffDate) {
    targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    if (targetMonth === 12) targetYear--;
  }
  const targetMonthStr = targetMonth.toString().padStart(2, '0');  // "10" for Oct

  // Payroll window: From cutoff of target month to cutoff of current month (UTC for ISO dates)
  const windowStart = new Date(Date.UTC(targetYear, targetMonth - 1, cutoffDate));  // 2025-10-05 00:00:00 UTC
  const windowEnd = new Date(Date.UTC(currentYear, currentMonth - 1, cutoffDate));  // 2025-11-05 00:00:00 UTC

  return { targetMonthStr, targetYear, windowStart, windowEnd };
};
export const getWorkingDaysInMonth = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      workingDays++;
    }
  }
  return workingDays;
};

const formatCalculationBase = (base) => {
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Basic";
};

export const calculateSalaryDetails = (
  ctc,
  planData,
  employeeId,
  overtimeRecords = [],
  bonusRecords = [],
  advances = [],
  employeeIncentiveData = {},
  employeeLopData = {} // Added for LOP
) => {
  console.log(
    `calculateSalaryDetails called for employeeId=${employeeId} at ${new Date().toISOString()}`
  );

  const safeOvertimeRecords = Array.isArray(overtimeRecords) ? overtimeRecords : [];
  const safeBonusRecords = Array.isArray(bonusRecords) ? bonusRecords : [];
  const safeAdvances = Array.isArray(advances) ? advances : [];

  if (!employeeId) {
    console.error(`Invalid employeeId (${employeeId})`);
    return null;
  }

  if (!ctc || ctc <= 0 || isNaN(parseFloat(ctc))) {
    console.warn(`Invalid or missing CTC (${ctc}) for employee ${employeeId}. Using default CTC of 0.`);
    ctc = 0;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentMonthStr = currentMonth.toString().padStart(2, "0");
  const monthlyCtc = ctc ? parseFloat(ctc) / 12 : 0;

  let basicSalary = 0,
    hra = 0,
    ltaAllowance = 0,
    overtimePay = 0,
    recordBonusPay = 0,
    recordBonusPayYearly = 0,
    statutoryBonus = 0,
    statutoryBonusYearly = 0,
    employeePF = 0,
    employerPF = 0,
    esic = 0,
    gratuity = 0,
    professionalTax = 0,
    otherAllowances = 0,
    advanceRecovery = 0,
    insurance = 0,
    grossSalary = 0,
    incentivePay = 0,
    lopDeduction = 0; // Added for LOP

  if (!planData || typeof planData !== "object") {
    console.warn(`Invalid or missing planData for employee ${employeeId}. Using default values.`);
    planData = {};
  }

  // Basic Salary
  if (
    planData.isBasicSalary &&
    planData.basicSalaryType === "percentage" &&
    planData.basicSalary &&
    !isNaN(parseFloat(planData.basicSalary))
  ) {
    basicSalary = (monthlyCtc * (parseFloat(planData.basicSalary) / 100));
  } else if (planData.basicSalaryAmount && !isNaN(parseFloat(planData.basicSalaryAmount))) {
    basicSalary = (parseFloat(planData.basicSalaryAmount) / 12);
  } else {
    basicSalary = monthlyCtc ? (monthlyCtc * 0.4) : 0;
    console.warn(`Using default basicSalary (40% of CTC) for employee ${employeeId}`);
  }
  console.log(`Basic Salary (monthly): ₹${basicSalary}`);

  // HRA
  if (
    planData.isHouseRentAllowance &&
    planData.houseRentAllowanceType === "percentage" &&
    planData.houseRentAllowance &&
    !isNaN(parseFloat(planData.houseRentAllowance))
  ) {
    hra = (basicSalary * (parseFloat(planData.houseRentAllowance) / 100));
  } else if (planData.houseRentAllowanceAmount && !isNaN(parseFloat(planData.houseRentAllowanceAmount))) {
    hra = (parseFloat(planData.houseRentAllowanceAmount) / 12);
  } else {
    hra = (basicSalary * 0.5); // default 50% of basic
  }

  // LTA Allowance
  if (
    planData.isLtaAllowance &&
    planData.ltaAllowanceType === "percentage" &&
    planData.ltaAllowance &&
    !isNaN(parseFloat(planData.ltaAllowance))
  ) {
    ltaAllowance = monthlyCtc * (parseFloat(planData.ltaAllowance) / 100);
    console.log(
      `LTA Allowance (monthly, ${planData.ltaAllowance}% of CTC): ₹${ltaAllowance.toFixed(2)}`
    );
  } else if (planData.ltaAllowanceAmount && !isNaN(parseFloat(planData.ltaAllowanceAmount))) {
    ltaAllowance = parseFloat(planData.ltaAllowanceAmount) / 12;
    console.log(`LTA Allowance (monthly, fixed amount): ₹${ltaAllowance.toFixed(2)}`);
  } else {
    ltaAllowance = 0;
    console.warn(`No LTA Allowance defined for employee ${employeeId}`);
  }

  // Other Allowances
  if (
    planData.isOtherAllowance &&
    planData.otherAllowanceType === "percentage" &&
    planData.otherAllowance &&
    !isNaN(parseFloat(planData.otherAllowance))
  ) {
    otherAllowances = (monthlyCtc * (parseFloat(planData.otherAllowance) / 100));
  } else if (planData.otherAllowanceAmount && !isNaN(parseFloat(planData.otherAllowanceAmount))) {
    otherAllowances = (parseFloat(planData.otherAllowanceAmount) / 12);
  } else {
    otherAllowances = 0;
    console.warn(`Using default otherAllowances (0) for employee ${employeeId}`);
  }
  console.log(`Other Allowances (monthly): ₹${otherAllowances}`);

  // Overtime Pay
 // Overtime Pay
const { targetMonthStr, targetYear, windowStart, windowEnd } = getPayrollFilter();
console.log(`Filtering overtime records for employee ${employeeId}, targetYear=${targetYear}, targetMonth=${targetMonthStr}, window=${windowStart.toISOString().split('T')[0]} to ${windowEnd.toISOString().split('T')[0]}`);

const employeeOvertime = safeOvertimeRecords.filter((ot) => {
  const otDate = parseWorkDate(ot.work_date);
  const updatedDate = new Date(ot.updated_at || ot.created_at);  // Fallback to created_at
  const isInWindow = updatedDate >= windowStart && updatedDate < windowEnd;
  const monthStr = String(otDate ? otDate.getMonth() + 1 : 0).padStart(2, '0');
  const isValid =
    ot.employee_id === employeeId &&
    ot.status === 'Approved' &&
    otDate &&
    otDate.getFullYear() === targetYear &&
    (monthStr === targetMonthStr || isInWindow);  // Base OR window
  console.log(`Overtime record:`, JSON.stringify(ot), `isValid: ${isValid}`);
  return isValid;
});

if (employeeOvertime.length === 0) {
  console.log(`No approved overtime records found for employee ${employeeId} in payroll period`);
} else {
  console.log(`Found ${employeeOvertime.length} overtime records for employee ${employeeId}`);
}

overtimePay = employeeOvertime.reduce((total, ot) => {
  const hours = parseFloat(ot.extra_hours);
  let rate = parseFloat(ot.rate);
  console.log(`Processing overtime: punch_id=${ot.punch_id}, hours=${hours}, rate=${rate}`);

  if (!rate || isNaN(rate) || rate === 0) {
    if (
      planData.isOvertimePay &&
      planData.overtimePayAmount &&
      !isNaN(parseFloat(planData.overtimePayAmount))
    ) {
      rate = parseFloat(planData.overtimePayAmount);
      console.log(`Using planData.overtimePayAmount: ₹${rate}/hour`);
    } else {
      rate = 500; // Fallback default rate (₹500/hour)
      console.warn(`No valid rate or overtimePayAmount for employee ${employeeId}; using default rate=₹${rate}/hour`);
    }
  }

  if (isNaN(hours) || hours <= 0) {
    console.log(`Invalid hours for overtime record: ${ot.punch_id}, hours=${ot.extra_hours}`);
    return total;
  }

  const pay = hours * rate;
  console.log(`Overtime pay for punch_id ${ot.punch_id}: ${hours} hours * ₹${rate}/hour = ₹${pay}`);
  return total + pay;
}, 0);

console.log(`Total overtimePay for employee ${employeeId}: ₹${overtimePay}`);
  // Bonus Pay from Records (company-wide, full amount paid in the applicable month)
  console.log(`Filtering bonus records for current month ${currentYear}-${currentMonthStr}`);

  const monthlyBonuses = safeBonusRecords.filter((bonus) => {
    const date = parseApplicableMonth(bonus.applicable_month);
    const isValid = date && date.getFullYear() === currentYear && String(date.getMonth() + 1).padStart(2, "0") === currentMonthStr;
    console.log(`Bonus ID ${bonus.id || 'N/A'}: applicable_month=${bonus.applicable_month}, employee_id=${bonus.employee_id ?? 'N/A'}, isValid=${isValid}`);
    return isValid;
  });

  recordBonusPay = monthlyBonuses.reduce((sum, bonus) => {
    let amount = 0;
    if (bonus.fixed_amount) {
      amount = parseFloat(bonus.fixed_amount || 0);
    } else if (bonus.percentage_ctc) {
      amount = (parseFloat(bonus.percentage_ctc || 0) / 100) * ctc;
    } else if (bonus.percentage_monthly_salary) {
      amount = parseFloat(bonus.percentage_monthly_salary || 0) * monthlyCtc;
    }
    console.log(`Adding bonus amount ₹${amount} (monthly full) from bonus ID ${bonus.id || 'N/A'}`);
    return sum + amount;
  }, 0);

  // Yearly bonus (sum of all bonuses in the current year)
  const yearlyBonuses = safeBonusRecords.filter((bonus) => {
    const date = parseApplicableMonth(bonus.applicable_month);
    return date && date.getFullYear() === currentYear;
  });

  recordBonusPayYearly = yearlyBonuses.reduce((sum, bonus) => {
    let amount = 0;
    if (bonus.fixed_amount) amount = parseFloat(bonus.fixed_amount || 0);
    else if (bonus.percentage_ctc) amount = (parseFloat(bonus.percentage_ctc || 0) / 100) * ctc;
    else if (bonus.percentage_monthly_salary) amount = parseFloat(bonus.percentage_monthly_salary || 0) * monthlyCtc;
    return sum + amount;
  }, 0);

  console.log(`recordBonusPay (monthly full) for employee ${employeeId}: ₹${recordBonusPay}`);
  console.log(`recordBonusPayYearly for employee ${employeeId}: ₹${recordBonusPayYearly}`);

  // Total bonusPay (monthly) = ad-hoc (full in month) + statutory (averaged)
  const bonusPay = recordBonusPay + statutoryBonus;
  console.log(`✅ Total bonusPay (monthly) for employee ${employeeId}: ₹${bonusPay}`);
  // Incentive Pay
  // Incentive Pay (filtered to current month)
  const empId = String(employeeId).toUpperCase();
  const matchedKey = Object.keys(employeeIncentiveData).find(key => String(key).toUpperCase() === empId);

  if (matchedKey && employeeIncentiveData[matchedKey]) {
    const incData = employeeIncentiveData[matchedKey];
    const currentYm = getCurrentYearMonth(); // e.g., "2025-10"
    const currentMonthIncentives = (incData.incentives || []).filter(
      (inc) => inc.applicable_month === currentYm
    );
    incentivePay = currentMonthIncentives.reduce(
      (sum, inc) => sum + parseFloat(inc.value || 0),
      0
    );
  }
  console.log(`Incentive Pay (monthly, current month only) for employee ${employeeId}: ₹${incentivePay}`);
  // Calculate Gross Salary
grossSalary = basicSalary + hra + ltaAllowance + overtimePay + recordBonusPay + otherAllowances + incentivePay + statutoryBonus;  console.log(`Gross Salary (monthly): ₹${grossSalary}`);

  // Employee PF
  const pfBase = planData.pfCalculationBase === "gross" ? grossSalary : basicSalary;
  if (
    planData.isPFApplicable &&
    planData.isPFEmployee &&
    planData.pfEmployeeType === "percentage" &&
    planData.pfEmployeePercentage &&
    !isNaN(parseFloat(planData.pfEmployeePercentage))
  ) {
    employeePF = (pfBase * (parseFloat(planData.pfEmployeePercentage) / 100));
    planData.pfEmployeeText = `${planData.pfEmployeePercentage}% of ${formatCalculationBase(
      planData.pfCalculationBase
    )}`;
  } else if (planData.pfEmployeeAmount && !isNaN(parseFloat(planData.pfEmployeeAmount))) {
    employeePF = (parseFloat(planData.pfEmployeeAmount) / 12);
    planData.pfEmployeeText = `₹${planData.pfEmployeeAmount} (Fixed)`;
  } else {
    employeePF = 0;
    planData.pfEmployeeText = `Not Applicable`;
    console.warn(`No Employee PF defined for employee ${employeeId}`);
  }
  console.log(
    `Employee PF (monthly, based on ${formatCalculationBase(planData.pfCalculationBase)}): ₹${employeePF}`
  );

  // Employer PF
  if (
    planData.isPFApplicable &&
    planData.isPFEmployer &&
    planData.pfEmployerType === "percentage" &&
    planData.pfEmployerPercentage &&
    !isNaN(parseFloat(planData.pfEmployerPercentage))
  ) {
    employerPF = (pfBase * (parseFloat(planData.pfEmployerPercentage) / 100));
    planData.pfEmployerText = `${planData.pfEmployerPercentage}% of ${formatCalculationBase(
      planData.pfCalculationBase
    )}`;
  } else if (planData.pfEmployerAmount && !isNaN(parseFloat(planData.pfEmployerAmount))) {
    employerPF = (parseFloat(planData.pfEmployerAmount) / 12);
    planData.pfEmployerText = `₹${planData.pfEmployerAmount} (Fixed)`;
  } else {
    employerPF = 0;
    planData.pfEmployerText = `Not Applicable`;
    console.warn(`No Employer PF defined for employee ${employeeId}`);
  }
  console.log(
    `Employer PF (monthly, based on ${formatCalculationBase(planData.pfCalculationBase)}): ₹${employerPF}`
  );

  // Medical Allowances (ESIC and Insurance)
  const medicalBase = planData.medicalCalculationBase === "gross" ? grossSalary : basicSalary;

  // ESIC
  if (
    planData.isMedicalApplicable &&
    planData.isESICEmployee &&
    planData.esicEmployeeType === "percentage" &&
    planData.esicEmployeePercentage &&
    !isNaN(parseFloat(planData.esicEmployeePercentage))
  ) {
    esic = (medicalBase * (parseFloat(planData.esicEmployeePercentage) / 100));
    planData.esicEmployeeText = `${planData.esicEmployeePercentage}% of ${formatCalculationBase(
      planData.medicalCalculationBase
    )}`;
  } else if (planData.esicEmployeeAmount && !isNaN(parseFloat(planData.esicEmployeeAmount))) {
    esic = (parseFloat(planData.esicEmployeeAmount) / 12);
    planData.esicEmployeeText = `₹${planData.esicEmployeeAmount} (Fixed)`;
  } else {
    esic = 0;
    planData.esicEmployeeText = `Not Applicable`;
    console.warn(`No ESIC defined for employee ${employeeId}`);
  }
  console.log(
    `ESIC (monthly, based on ${formatCalculationBase(planData.medicalCalculationBase)}): ₹${esic}`
  );

  // Insurance
  if (
    planData.isMedicalApplicable &&
    planData.isInsuranceEmployee &&
    planData.insuranceEmployeeType === "percentage" &&
    planData.insuranceEmployeePercentage &&
    !isNaN(parseFloat(planData.insuranceEmployeePercentage))
  ) {
    insurance = (medicalBase * (parseFloat(planData.insuranceEmployeePercentage) / 100));
    planData.insuranceEmployeeText = `${planData.insuranceEmployeePercentage}% of ${formatCalculationBase(
      planData.medicalCalculationBase
    )}`;
  } else if (planData.insuranceEmployeeAmount && !isNaN(parseFloat(planData.insuranceEmployeeAmount))) {
    insurance = (parseFloat(planData.insuranceEmployeeAmount) / 12);
    planData.insuranceEmployeeText = `₹${planData.insuranceEmployeeAmount} (Fixed)`;
  } else {
    insurance = 0;
    planData.insuranceEmployeeText = `Not Applicable`;
    console.warn(`No insurance defined for employee ${employeeId}`);
  }
  console.log(
    `Insurance (monthly, based on ${formatCalculationBase(planData.medicalCalculationBase)}): ₹${insurance}`
  );

  // Gratuity
  if (
    planData.isGratuityApplicable &&
    planData.gratuityType === "percentage" &&
    planData.gratuityPercentage &&
    !isNaN(parseFloat(planData.gratuityPercentage))
  ) {
    gratuity = (basicSalary * (parseFloat(planData.gratuityPercentage) / 100));
  } else if (planData.gratuityAmount && !isNaN(parseFloat(planData.gratuityAmount))) {
    gratuity = (parseFloat(planData.gratuityAmount) / 12);
  } else {
    gratuity =(basicSalary * 0);
    console.warn(`Using default gratuity (4.81% of basicSalary) for employee ${employeeId}`);
  }
  console.log(`Gratuity (monthly): ₹${gratuity}`);

  // Professional Tax
 // Professional Tax
professionalTax = 0;
if (planData.isProfessionalTax) {
  if (
    planData.professionalTaxType === "percentage" &&
    planData.professionalTax &&
    !isNaN(parseFloat(planData.professionalTax))
  ) {
    professionalTax = (monthlyCtc * (parseFloat(planData.professionalTax) / 100));
    planData.professionalTaxText = `${planData.professionalTax}% of CTC`;
  } else if (planData.professionalTaxAmount && !isNaN(parseFloat(planData.professionalTaxAmount))) {
    professionalTax = (parseFloat(planData.professionalTaxAmount) / 12);
    planData.professionalTaxText = `₹${planData.professionalTaxAmount} (Fixed)`;
  } else {
    // CHANGED: No default 200—stay at 0
    professionalTax = 0;
    planData.professionalTaxText = 'Not Set';  // CHANGED: Explicit no-default text
    console.warn(`No Professional Tax value set for employee ${employeeId}; using 0`);
  }
} else {
  planData.professionalTaxText = 'Not Applicable';
  console.log(`Professional Tax not applicable for employee ${employeeId}`);
}
console.log(`Professional Tax (monthly): ₹${professionalTax} | Plan Text: ${planData.professionalTaxText}`);

  // Advance Recovery
  const employeeAdvances = safeAdvances.filter((adv) => {
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
    const isValid =
      adv.employee_id === employeeId && currentDate >= startDate && currentDate <= endDate;
    console.log(
      `Advance check: employeeId=${adv.employee_id}, applicable_months=${
        adv.applicable_months
      }, recovery_months=${adv.recovery_months}, isValid=${isValid}`
    );
    return isValid;
  });

  advanceRecovery = employeeAdvances.reduce((total, adv) => {
    const amount = parseFloat(adv.advance_amount);
    const months = parseInt(adv.recovery_months);
    const recovery = months > 0 ? amount / months : 0;
    console.log(
      `Advance recovery: amount=₹${amount}, months=${months}, recovery=₹${recovery}`
    );
    return total + recovery;
  }, 0);
  console.log(`Total Advance Recovery (monthly): ₹${advanceRecovery}`);

  // TDS
 // TDS (UPDATED: Flat rate per slab)
let tds = 0;
if (planData.isTDSApplicable && Array.isArray(planData.tdsSlabs) && planData.tdsSlabs.length > 0) {
  const annualCtc = parseFloat(ctc);
  let applicableRate = 0;
  for (let slab of planData.tdsSlabs) {
    const from = parseFloat(slab.from) || 0;
    const to = parseFloat(slab.to) || Infinity;
    if (annualCtc >= from && annualCtc <= to) {
      applicableRate = parseFloat(slab.percentage) || 0;
      break;
    }
  }
  const annualTDS = annualCtc * (applicableRate / 100);
  tds = Math.round((annualTDS / 12) * 100) / 100;
  console.log(`Flat TDS for CTC ₹${annualCtc.toLocaleString('en-IN')}: ${applicableRate}% → ₹${annualTDS.toLocaleString('en-IN')} annual → ₹${tds.toFixed(2)} monthly`);
} else {
  console.log(`No valid TDS slabs or TDS not applicable for employee ${employeeId}, setting TDS to 0`);
  tds = 0;
}

  

  // Calculate Net Salary (MODIFIED: Conditional deductions based on IncludeInCtc flags)
  let conditionalDeductions = 0;
  if (planData.pfEmployeeIncludeInCtc !== false) {
    conditionalDeductions += employeePF;
    console.log(`Deducting Employee PF (included in CTC): ₹${employeePF}`);
  } else {
    console.log(`Skipping Employee PF deduction (not included in CTC): ₹${employeePF}`);
  }
  if (planData.esicEmployeeIncludeInCtc !== false) {
    conditionalDeductions += esic;
    console.log(`Deducting ESIC (included in CTC): ₹${esic}`);
  } else {
    console.log(`Skipping ESIC deduction (not included in CTC): ₹${esic}`);
  }
  if (planData.insuranceEmployeeIncludeInCtc !== false) {
    conditionalDeductions += insurance;
    console.log(`Deducting Insurance (included in CTC): ₹${insurance}`);
  } else {
    console.log(`Skipping Insurance deduction (not included in CTC): ₹${insurance}`);
  }
  if (planData.professionalTaxIncludeInCtc !== false) {
    conditionalDeductions += professionalTax;
    console.log(`Deducting Professional Tax (included in CTC): ₹${professionalTax}`);
  } else {
    console.log(`Skipping Professional Tax deduction (not included in CTC): ₹${professionalTax}`);
  }
if (planData.pfEmployerIncludeInCtc !== false) {
  conditionalDeductions += employerPF;
}
if (planData.gratuityIncludeInCtc !== false) {
  conditionalDeductions += gratuity;
}


  const netSalary = grossSalary - conditionalDeductions - tds - advanceRecovery ;
  console.log(`Conditional Deductions total: ₹${conditionalDeductions}`);
  console.log(`Net Salary (after conditional deductions + TDS + Advance + LOP): ₹${netSalary}`);

  const salaryDetails = {
    basicSalary: (basicSalary),
    hra: (hra),
    ltaAllowance: (ltaAllowance),
    overtimePay: (overtimePay),
    recordBonusPay: (recordBonusPay),
    recordBonusPayYearly: (recordBonusPayYearly),
    statutoryBonus: (statutoryBonus),
    statutoryBonusYearly: (statutoryBonusYearly),
    bonusPay: (bonusPay),
    employeePF: (employeePF),
    employerPF:(employerPF),
    esic: (esic),
    gratuity: (gratuity),
    professionalTax: (professionalTax),
    otherAllowances:(otherAllowances),
    tds:(tds),
    advanceRecovery: (advanceRecovery),
    insurance: (insurance),
    grossSalary: (grossSalary),
    netSalary:(netSalary),
    incentivePay: (incentivePay),
    lopDeduction: (lopDeduction), // Added for LOP
  };

  console.log(`Final salary details for employee ${employeeId}:`, JSON.stringify(salaryDetails, null, 2));
  return salaryDetails;
};

export const calculateTotals = (employees, overtimeRecords, bonusRecords, advances, incentivesData, employeeLopData) => {
  if (!Array.isArray(employees)) {
    console.error("Invalid employees array in calculateTotals");
    return {
      totalPayable: 0,
      totalGross: 0,
      totalTDS: 0,
      totalAdvance: 0,
      totalOvertime: 0,
      totalBonus: 0,
      totalEmployeePF: 0,
      totalEmployerPF: 0,
      totalInsurance: 0,
      totalIncentives: 0,
      totalLopDeduction: 0, // Added for LOP
    };
  }

  return employees.reduce(
    (totals, emp) => {
      const salaryDetails = calculateSalaryDetails(
        emp.ctc,
        emp.plan_data,
        emp.employee_id,
        overtimeRecords,
        bonusRecords,
        advances,
        incentivesData,
        employeeLopData // Pass LOP data
      );
      if (!salaryDetails) {
        console.warn(`No salary details for employee ${emp.employee_id}`);
        return totals;
      }

      return {
        totalPayable: totals.totalPayable + salaryDetails.netSalary,
        totalGross: totals.totalGross + salaryDetails.grossSalary,
        totalTDS: totals.totalTDS + salaryDetails.tds,
        totalAdvance: totals.totalAdvance + salaryDetails.advanceRecovery,
        totalOvertime: totals.totalOvertime + salaryDetails.overtimePay,
        totalBonus: totals.totalBonus + salaryDetails.bonusPay,
        totalEmployeePF: totals.totalEmployeePF + salaryDetails.employeePF,
        totalEmployerPF: totals.totalEmployerPF + salaryDetails.employerPF,
        totalInsurance: totals.totalInsurance + salaryDetails.insurance,
        totalIncentives: totals.totalIncentives + salaryDetails.incentivePay,
        totalLopDeduction: totals.totalLopDeduction + salaryDetails.lopDeduction, // Added for LOP
      };
    },
    {
      totalPayable: 0,
      totalGross: 0,
      totalTDS: 0,
      totalAdvance: 0,
      totalOvertime: 0,
      totalBonus: 0,
      totalEmployeePF: 0,
      totalEmployerPF: 0,
      totalInsurance: 0,
      totalIncentives: 0,
      totalLopDeduction: 0, // Added for LOP
    }
  );
};

export const getMonthlySalary = (employeeId, employees) => {
  const employee = employees.find((emp) => emp.employee_id === employeeId);
  if (!employee || !employee.ctc) return 0;
  return Math.round(parseFloat(employee.ctc) / 12);
};