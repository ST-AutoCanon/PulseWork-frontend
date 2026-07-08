
// export const getCurrentYearMonth = () => {
//   const year = new Date().getFullYear();
//   const month = String(new Date().getMonth() + 1).padStart(2, "0");
//   return `${year}-${month}`;
// };

// export const parseApplicableMonth = (monthStr) => {
//   if (!monthStr || typeof monthStr !== "string") {
//     return null;
//   }

//   if (/^\d{4}-\d{2}$/.test(monthStr)) {
//     const [year, month] = monthStr.split("-").map(Number);
//     if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
//       return null;
//     }
//     return new Date(year, month - 1);
//   }

//   const monthNames = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ];
//   const monthIndex = monthNames.findIndex(
//     (name) => name.toLowerCase() === monthStr.toLowerCase()
//   );
//   if (monthIndex !== -1) {
//     return new Date(new Date().getFullYear(), monthIndex);
//   }
//   return null;
// };

// export const parseWorkDate = (dateStr) => {
//   try {
//     const date = new Date(dateStr);
//     return isNaN(date.getTime()) ? null : date;
//   } catch (error) {
//     console.error(`Error parsing work date: ${dateStr}`, error);
//     return null;
//   }
// };

// export const getPayrollFilter = () => {
//   const today = new Date();
//   const currentYear = today.getFullYear();
//   const currentMonth = today.getMonth() + 1;
//   const currentDay = today.getDate();

//   const cutoffDate = 5;

//   let targetMonth = currentMonth;
//   let targetYear = currentYear;
//   if (currentDay < cutoffDate) {
//     targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
//     if (targetMonth === 12) targetYear--;
//   }
//   const targetMonthStr = targetMonth.toString().padStart(2, "0");

//   const windowStart = new Date(
//     Date.UTC(targetYear, targetMonth - 1, cutoffDate)
//   );
//   const windowEnd = new Date(
//     Date.UTC(currentYear, currentMonth - 1, cutoffDate)
//   );

//   return { targetMonthStr, targetYear, windowStart, windowEnd };
// };

// export const getWorkingDaysInMonth = (year, month) => {
//   const daysInMonth = new Date(year, month, 0).getDate();
//   let workingDays = 0;
//   for (let day = 1; day <= daysInMonth; day++) {
//     const date = new Date(year, month - 1, day);
//     if (date.getDay() !== 0 && date.getDay() !== 6) {
//       workingDays++;
//     }
//   }
//   return workingDays;
// };

// const formatCalculationBase = (base) => {
//   return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Basic";
// };
// const includedValue = (value, includeFlag) => {
//   return includeFlag ? Number(value || 0) : 0;
// };
// export const calculateSalaryDetails = (
//   ctc,
//   planData,
//   employeeId,
//   overtimeRecords = [],
//   bonusRecords = [],
//   advances = [],
//   employeeIncentiveData = {},
//   employeeLopData = {}
// ) => {
//   const safeOvertimeRecords = Array.isArray(overtimeRecords)
//     ? overtimeRecords
//     : [];
//   const safeBonusRecords = Array.isArray(bonusRecords) ? bonusRecords : [];
//   const safeAdvances = Array.isArray(advances) ? advances : [];

//   if (!employeeId) {
//     console.error(`Invalid employeeId (${employeeId})`);
//     return null;
//   }

//   if (!ctc || ctc <= 0 || isNaN(parseFloat(ctc))) {
//     console.warn(
//       `Invalid or missing CTC (${ctc}) for employee ${employeeId}. Using default CTC of 0.`
//     );
//     ctc = 0;
//   }

//   const now = new Date();
//   const currentYear = now.getFullYear();
//   const currentMonth = now.getMonth() + 1;
//   const currentMonthStr = currentMonth.toString().padStart(2, "0");
//   const monthlyCtc = ctc ? parseFloat(ctc) / 12 : 0;

//   let basicSalary = 0,
//     hra = 0,
//     ltaAllowance = 0,
//     overtimePay = 0,
//     recordBonusPay = 0,
//     statutoryBonus = 0,
//     statutoryBonusYearly = 0,

//     employeePF = 0,
//     employerPF = 0,

//     esic = 0,
//     esicEmployer = 0,

//     insurance = 0,
//     insuranceEmployer = 0,

//     gratuity = 0,
//     professionalTax = 0,
//     otherAllowances = 0,
//     advanceRecovery = 0,
//     grossSalary = 0,
//     incentivePay = 0,
//     lopDeduction = 0;
//   if (!planData || typeof planData !== "object") {
//     console.warn(
//       `Invalid or missing planData for employee ${employeeId}. Using default values.`
//     );
//     planData = {};
//   }

//   // Basic Salary - Fixed is monthly
//   if (
//     planData.isBasicSalary &&
//     planData.basicSalaryType === "percentage" &&
//     planData.basicSalary &&
//     !isNaN(parseFloat(planData.basicSalary))
//   ) {
//     basicSalary = monthlyCtc * (parseFloat(planData.basicSalary) / 100);
//   } else if (
//     planData.basicSalaryAmount &&
//     !isNaN(parseFloat(planData.basicSalaryAmount))
//   ) {
//     basicSalary = parseFloat(planData.basicSalaryAmount); // Monthly
//   } else {
//     basicSalary = monthlyCtc ? monthlyCtc * 0.4 : 0;
//     console.warn(
//       `Using default basicSalary (40% of CTC) for employee ${employeeId}`
//     );
//   }

//   // HRA - Fixed is monthly
//   if (
//     planData.isHouseRentAllowance &&
//     planData.houseRentAllowanceType === "percentage" &&
//     planData.houseRentAllowance &&
//     !isNaN(parseFloat(planData.houseRentAllowance))
//   ) {
//     hra = basicSalary * (parseFloat(planData.houseRentAllowance) / 100);
//   } else if (
//     planData.houseRentAllowanceAmount &&
//     !isNaN(parseFloat(planData.houseRentAllowanceAmount))
//   ) {
//     hra = parseFloat(planData.houseRentAllowanceAmount); // Monthly
//   } else {
//     hra = basicSalary * 0.5;
//   }

//   // LTA - Fixed is monthly
//   if (
//     planData.isLtaAllowance &&
//     planData.ltaAllowanceType === "percentage" &&
//     planData.ltaAllowance &&
//     !isNaN(parseFloat(planData.ltaAllowance))
//   ) {
//     ltaAllowance = monthlyCtc * (parseFloat(planData.ltaAllowance) / 100);
//   } else if (
//     planData.ltaAllowanceAmount &&
//     !isNaN(parseFloat(planData.ltaAllowanceAmount))
//   ) {
//     ltaAllowance = parseFloat(planData.ltaAllowanceAmount); // Monthly
//   } else {
//     ltaAllowance = 0;
//     console.warn(`No LTA Allowance defined for employee ${employeeId}`);
//   }

//   // Other Allowances - Fixed is monthly
//   // Other Allowances - Calculate as percentage of CTC when specified
// if (
//   planData.isOtherAllowance &&
//   planData.otherAllowanceType === "percentage" &&
//   planData.otherAllowance &&
//   !isNaN(parseFloat(planData.otherAllowance))
// ) {
//   // Calculate as percentage of monthly CTC (user's specified percentage)
//   otherAllowances = monthlyCtc * (parseFloat(planData.otherAllowance) / 100);
// } else if (
//   planData.otherAllowanceAmount &&
//   !isNaN(parseFloat(planData.otherAllowanceAmount))
// ) {
//   otherAllowances = parseFloat(planData.otherAllowanceAmount); // Monthly
// } else {
//   otherAllowances = 0;
// }

//   const { targetMonthStr, targetYear, windowStart, windowEnd } =
//     getPayrollFilter();

//   const employeeOvertime = safeOvertimeRecords.filter((ot) => {
//     const otDate = parseWorkDate(ot.work_date);
//     const updatedDate = new Date(ot.updated_at || ot.created_at);
//     const isInWindow = updatedDate >= windowStart && updatedDate < windowEnd;
//     const monthStr = String(otDate ? otDate.getMonth() + 1 : 0).padStart(
//       2,
//       "0"
//     );
//     const isValid =
//       ot.employee_id === employeeId &&
//       ot.status === "Approved" &&
//       otDate &&
//       otDate.getFullYear() === targetYear &&
//       (monthStr === targetMonthStr || isInWindow);
//     return isValid;
//   });

//   overtimePay = employeeOvertime.reduce((total, ot) => {
//     const hours = parseFloat(ot.extra_hours);
//     let rate = parseFloat(ot.rate);

//     if (!rate || isNaN(rate) || rate === 0) {
//       if (
//         planData.isOvertimePay &&
//         planData.overtimePayAmount &&
//         !isNaN(parseFloat(planData.overtimePayAmount))
//       ) {
//         rate = parseFloat(planData.overtimePayAmount);
//       } else {
//         rate = 500;
//         console.warn(
//           `No valid rate or overtimePayAmount for employee ${employeeId}; using default rate=₹${rate}/hour`
//         );
//       }
//     }

//     if (isNaN(hours) || hours <= 0) {
//       return total;
//     }

//     const pay = hours * rate;

//     return total + pay;
//   }, 0);

//   const employeeBonuses = safeBonusRecords.filter((bonus) => {
//     const date = parseApplicableMonth(bonus.applicable_month);
//     const isValid =
//       date &&
//       date.getFullYear() === currentYear &&
//       (date.getMonth() + 1).toString().padStart(2, "0") === currentMonthStr;

//     return isValid;
//   });

//   recordBonusPay = employeeBonuses.reduce((sum, bonus) => {
//     let bonusAmount = 0;

//     if (bonus.fixed_amount && !isNaN(parseFloat(bonus.fixed_amount))) {
//       bonusAmount = parseFloat(bonus.fixed_amount);
//     } else if (
//       bonus.percentage_ctc &&
//       !isNaN(parseFloat(bonus.percentage_ctc))
//     ) {
//       bonusAmount =
//         (parseFloat(bonus.percentage_ctc) / 100) * parseFloat(ctc || 0);
//     } else if (
//       bonus.percentage_monthly_salary &&
//       !isNaN(parseFloat(bonus.percentage_monthly_salary))
//     ) {
//       const multiplier = parseFloat(bonus.percentage_monthly_salary);
//       bonusAmount = multiplier * monthlyCtc;
//     }
//     return sum + bonusAmount;
//   }, 0);

//   statutoryBonusYearly = 0;
//   if (
//     planData.isStatutoryBonus &&
//     planData.statutoryBonusPercentage &&
//     !isNaN(parseFloat(planData.statutoryBonusPercentage))
//   ) {
//     statutoryBonusYearly =
//       (parseFloat(planData.statutoryBonusPercentage) / 100) * ctc;
//   } else if (
//     planData.isStatutoryBonus &&
//     planData.statutoryBonusAmount &&
//     !isNaN(parseFloat(planData.statutoryBonusAmount))
//   ) {
//     statutoryBonusYearly = parseFloat(planData.statutoryBonusAmount);
//   }

//   statutoryBonus = statutoryBonusYearly / 12;

//   const bonusPay = recordBonusPay + statutoryBonus;

//   const empId = String(employeeId).toUpperCase();
//   const matchedKey = Object.keys(employeeIncentiveData).find(
//     (key) => String(key).toUpperCase() === empId
//   );

//   if (matchedKey && employeeIncentiveData[matchedKey]) {
//     const incData = employeeIncentiveData[matchedKey];
//     const currentYm = getCurrentYearMonth();
//     const currentMonthIncentives = (incData.incentives || []).filter(
//       (inc) => inc.applicable_month === currentYm
//     );
//     incentivePay = currentMonthIncentives.reduce(
//       (sum, inc) => sum + parseFloat(inc.value || 0),
//       0
//     );
//   }

//   grossSalary =
//   basicSalary +
//   hra +
//   ltaAllowance +
//   overtimePay +
//   bonusPay +
//   incentivePay;


//   const pfBase =
//     planData.pfCalculationBase === "gross" ? grossSalary : basicSalary;

//   // Employee PF - Fixed is monthly
//   if (
//     planData.isPFApplicable &&
//     planData.isPFEmployee &&
//     planData.pfEmployeeType === "percentage" &&
//     planData.pfEmployeePercentage &&
//     !isNaN(parseFloat(planData.pfEmployeePercentage))
//   ) {
//     employeePF = pfBase * (parseFloat(planData.pfEmployeePercentage) / 100);
//     planData.pfEmployeeText = `${
//       planData.pfEmployeePercentage
//     }% of ${formatCalculationBase(planData.pfCalculationBase)}`;
//   } else if (
//     planData.pfEmployeeAmount &&
//     !isNaN(parseFloat(planData.pfEmployeeAmount))
//   ) {
//     employeePF = parseFloat(planData.pfEmployeeAmount); // Monthly
//     planData.pfEmployeeText = `₹${planData.pfEmployeeAmount} (Fixed)`;
//   } else {
//     employeePF = 0;
//     planData.pfEmployeeText = `Not Applicable`;
//     console.warn(`No Employee PF defined for employee ${employeeId}`);
//   }

//   // Employer PF - Fixed is monthly
//   if (
//     planData.isPFApplicable &&
//     planData.isPFEmployer &&
//     planData.pfEmployerType === "percentage" &&
//     planData.pfEmployerPercentage &&
//     !isNaN(parseFloat(planData.pfEmployerPercentage))
//   ) {
//     employerPF = pfBase * (parseFloat(planData.pfEmployerPercentage) / 100);
//     planData.pfEmployerText = `${
//       planData.pfEmployerPercentage
//     }% of ${formatCalculationBase(planData.pfCalculationBase)}`;
//   } else if (
//     planData.pfEmployerAmount &&
//     !isNaN(parseFloat(planData.pfEmployerAmount))
//   ) {
//     employerPF = parseFloat(planData.pfEmployerAmount); // Monthly
//     planData.pfEmployerText = `₹${planData.pfEmployerAmount} (Fixed)`;
//   } else {
//     employerPF = 0;
//     planData.pfEmployerText = `Not Applicable`;
//     console.warn(`No Employer PF defined for employee ${employeeId}`);
//   }

//   const medicalBase =
//     planData.medicalCalculationBase === "gross" ? grossSalary : basicSalary;

   

//   // ==================== Insurance (Employee & Employer) ====================
//   // Insurance Employee
//   if (
//     planData.isInsuranceEmployee &&
//     planData.insuranceEmployeeType === "percentage" &&
//     planData.insuranceEmployeePercentage &&
//     !isNaN(parseFloat(planData.insuranceEmployeePercentage))
//   ) {
//     insurance = medicalBase * (parseFloat(planData.insuranceEmployeePercentage) / 100);
//     planData.insuranceEmployeeText = `${
//       planData.insuranceEmployeePercentage
//     }% of ${formatCalculationBase(planData.medicalCalculationBase || "basic")}`;
//   } else if (
//     planData.insuranceEmployeeAmount &&
//     !isNaN(parseFloat(planData.insuranceEmployeeAmount))
//   ) {
//     insurance = parseFloat(planData.insuranceEmployeeAmount);
//     planData.insuranceEmployeeText = `₹${planData.insuranceEmployeeAmount} (Fixed)`;
//   } else {
//     insurance = 0;
//     planData.insuranceEmployeeText = "Not Applicable";
//   }

//   // Insurance Employer
//   if (
//     planData.isInsuranceEmployer &&
//     planData.insuranceEmployerType === "percentage" &&
//     planData.insuranceEmployerPercentage &&
//     !isNaN(parseFloat(planData.insuranceEmployerPercentage))
//   ) {
//     insuranceEmployer = medicalBase * (parseFloat(planData.insuranceEmployerPercentage) / 100);
//     planData.insuranceEmployerText = `${
//       planData.insuranceEmployerPercentage
//     }% of ${formatCalculationBase(planData.medicalCalculationBase || "basic")}`;
//   } else if (
//     planData.insuranceEmployerAmount &&
//     !isNaN(parseFloat(planData.insuranceEmployerAmount))
//   ) {
//     insuranceEmployer = parseFloat(planData.insuranceEmployerAmount);
//     planData.insuranceEmployerText = `₹${planData.insuranceEmployerAmount} (Fixed)`;
//   } else {
//     insuranceEmployer = 0;
//     planData.insuranceEmployerText = "Not Applicable";
//   }
//   // Gratuity - Fixed is annual → monthly provision
//   if (
//     planData.isGratuityApplicable &&
//     planData.gratuityType === "percentage" &&
//     planData.gratuityPercentage &&
//     !isNaN(parseFloat(planData.gratuityPercentage))
//   ) {
//     gratuity = basicSalary * (parseFloat(planData.gratuityPercentage) / 100);
//   } else if (
//     planData.gratuityAmount &&
//     !isNaN(parseFloat(planData.gratuityAmount))
//   ) {
//     gratuity = parseFloat(planData.gratuityAmount) / 12; // Annual → monthly
//   } else {
//     gratuity = basicSalary * 0;
//     console.warn(
//       `Using default gratuity (4.81% of basicSalary) for employee ${employeeId}`
//     );
//   }

//   // Professional Tax - Fixed is monthly
//   professionalTax = 0;
//   if (planData.isProfessionalTax) {
//     if (
//       planData.professionalTaxType === "percentage" &&
//       planData.professionalTax &&
//       !isNaN(parseFloat(planData.professionalTax))
//     ) {
//       professionalTax =
//         monthlyCtc * (parseFloat(planData.professionalTax) / 100);
//       planData.professionalTaxText = `${planData.professionalTax}% of CTC`;
//     } else if (
//       planData.professionalTaxAmount &&
//       !isNaN(parseFloat(planData.professionalTaxAmount))
//     ) {
//       professionalTax = parseFloat(planData.professionalTaxAmount); // Monthly
//       planData.professionalTaxText = `₹${planData.professionalTaxAmount} (Fixed)`;
//     } else {
//       professionalTax = 0;
//       planData.professionalTaxText = "Not Set";
//       console.warn(
//         `No Professional Tax value set for employee ${employeeId}; using 0`
//       );
//     }
//   } else {
//     planData.professionalTaxText = "Not Applicable";
//   }

//   const employeeAdvances = safeAdvances.filter((adv) => {
//     if (!adv.applicable_months || !adv.recovery_months) return false;
//     const advDate = parseApplicableMonth(adv.applicable_months);
//     if (!advDate) return false;
//     const advYear = advDate.getFullYear();
//     const advMonth = advDate.getMonth() + 1;
//     const recoveryMonths = parseInt(adv.recovery_months);
//     const startMonth = advMonth;
//     const startYear = advYear;
//     let endYear = startYear;
//     let endMonth = startMonth + recoveryMonths - 1;
//     if (endMonth > 12) {
//       endYear += Math.floor((endMonth - 1) / 12);
//       endMonth = ((endMonth - 1) % 12) + 1;
//     }
//     const currentDate = new Date(currentYear, parseInt(currentMonthStr) - 1);
//     const startDate = new Date(startYear, startMonth - 1);
//     const endDate = new Date(endYear, endMonth - 1);
//     const isValid =
//       adv.employee_id === employeeId &&
//       currentDate >= startDate &&
//       currentDate <= endDate;

//     return isValid;
//   });

//   advanceRecovery = employeeAdvances.reduce((total, adv) => {
//     const amount = parseFloat(adv.advance_amount);
//     const months = parseInt(adv.recovery_months);
//     const recovery = months > 0 ? amount / months : 0;

//     return total + recovery;
//   }, 0);

//   let tds = 0;
//   if (
//     planData.isTDSApplicable &&
//     Array.isArray(planData.tdsSlabs) &&
//     planData.tdsSlabs.length > 0
//   ) {
//     const annualCtc = parseFloat(ctc);
//     let applicableRate = 0;
//     for (let slab of planData.tdsSlabs) {
//       const from = parseFloat(slab.from) || 0;
//       const to = parseFloat(slab.to) || Infinity;
//       if (annualCtc >= from && annualCtc <= to) {
//         applicableRate = parseFloat(slab.percentage) || 0;
//         break;
//       }
//     }
//     const annualTDS = annualCtc * (applicableRate / 100);
//     tds = Math.round((annualTDS / 12) * 100) / 100;
//   } else {
//     tds = 0;
//   }

//   // ✅ FORCE OTHER ALLOWANCE AS BALANCING COMPONENT

// const fixedDeductions =
//   includedValue(employeePF, planData.pfEmployeeIncludeInCtc) +

//   includedValue(employerPF, planData.pfEmployerIncludeInCtc) +

//   includedValue(esic, planData.esicEmployeeIncludeInCtc) +

//   includedValue(
//     esicEmployer,
//     planData.esicEmployerIncludeInCtc
//   ) +

//   includedValue(
//     insurance,
//     planData.insuranceEmployeeIncludeInCtc
//   ) +

//   includedValue(
//     insuranceEmployer,
//     planData.insuranceEmployerIncludeInCtc
//   ) +

//   includedValue(
//     gratuity,
//     planData.gratuityIncludeInCtc
//   ) +

//   includedValue(
//     professionalTax,
//     planData.professionalTaxIncludeInCtc
//   );
// // Monthly CTC should equal full cost
//   // ==================== OTHER ALLOWANCE - NEW LOGIC ====================
//   // New Requirement: Other Allowance = Monthly CTC - (Basic + HRA + LTA + Employer Contributions)

//   let employerContributionsForBalancing = 
//     employerPF + 
//     gratuity + 
//     insuranceEmployer + 
//     esicEmployer;

//   // Calculate Other Allowance as balancing figure
//   if (planData.isOtherAllowance) {
//     const knownFixed = basicSalary + hra + ltaAllowance + employerContributionsForBalancing;
    
//     otherAllowances = monthlyCtc - knownFixed;

//     // Prevent negative value
//     if (otherAllowances < 0) {
//       console.warn(`Other Allowance became negative for employee ${employeeId}. Setting to 0.`);
//       otherAllowances = 0;
//     }

//     planData.otherAllowanceText = `Balancing Component (CTC - Basic - HRA - LTA - Employer Contributions)`;
//   } else {
//     otherAllowances = 0;
//   }

//   // ==================== RECALCULATE GROSS SALARY ====================
//   grossSalary =
//     basicSalary +
//     hra +
//     ltaAllowance +
//     otherAllowances +
//     overtimePay +
//     bonusPay +
//     incentivePay;



// // Prevent negative
// if (otherAllowances < 0) {
//   otherAllowances = 0;
// }

// // Now add Other back to gross
// grossSalary =
//   basicSalary +
//   hra +
//   ltaAllowance +
//   otherAllowances +
//   overtimePay +
//   bonusPay +
//   incentivePay;

//   lopDeduction = parseFloat(
//     employeeLopData[employeeId]?.currentMonth?.value || 0
//   );

//   // ONLY employee-side deductions are subtracted for net salary (take-home pay)
//   // Employer PF and Gratuity are employer costs — they are NOT deducted from employee's pay
// const employeeDeductions =
//   includedValue(
//     employeePF,
//     planData.pfEmployeeIncludeInCtc
//   ) +

//   includedValue(
//     esic,
//     planData.esicEmployeeIncludeInCtc
//   ) +

//   includedValue(
//     insurance,
//     planData.insuranceEmployeeIncludeInCtc
//   ) +

//   includedValue(
//     professionalTax,
//     planData.professionalTaxIncludeInCtc
//   ) +

//   tds +
//   advanceRecovery +
//   lopDeduction;
// const netSalary = grossSalary - employeeDeductions;
//   // ==================== ESIC (Employee & Employer) ====================
//   // IMPORTANT: Other Allowance must be calculated BEFORE this block

//   // Base = Basic + HRA + Other Allowance
//   const grossForESI = 
//     Number(basicSalary || 0) + 
//     Number(hra || 0) + 
//     Number(otherAllowances || 0);

//   // ESIC Employee
//   if (
//     planData.isESICEmployee &&
//     planData.esicEmployeeType === "percentage" &&
//     planData.esicEmployeePercentage
//   ) {
//     const rate = parseFloat(planData.esicEmployeePercentage) / 100;
//     esic = grossForESI * rate;
//     planData.esicEmployeeText = `${planData.esicEmployeePercentage}% of (Basic + HRA + Other Allowance)`;
//   } else if (planData.esicEmployeeAmount) {
//     esic = parseFloat(planData.esicEmployeeAmount);
//   } else {
//     esic = 0;
//   }

//   // ESIC Employer
//   if (
//     planData.isESICEmployer &&
//     planData.esicEmployerType === "percentage" &&
//     planData.esicEmployerPercentage
//   ) {
//     const rate = parseFloat(planData.esicEmployerPercentage) / 100;
//     esicEmployer = grossForESI * rate;
//     planData.esicEmployerText = `${planData.esicEmployerPercentage}% of (Basic + HRA + Other Allowance)`;
//   } else if (planData.esicEmployerAmount) {
//     esicEmployer = parseFloat(planData.esicEmployerAmount);
//   } else {
//     esicEmployer = 0;
//   }
// const salaryDetails = {

//   basicSalary,
//   hra,

//   ltaAllowance,

//   overtimePay,

//   recordBonusPay,

//   statutoryBonus,

//   statutoryBonusYearly,

//   bonusPay,

//   employeePF,

//   employerPF,

//   esic,

//   esicEmployer,

//   insurance,

//   insuranceEmployer,

//   gratuity,

//   professionalTax,

//   otherAllowances,

//   tds,

//   advanceRecovery,

//   grossSalary,

//   netSalary,

//   incentivePay,

//   lopDeduction,
// };

//   return salaryDetails;
// };

// export const calculateTotals = (
//   employees,
//   overtimeRecords,
//   bonusRecords,
//   advances,
//   incentivesData,
//   employeeLopData
// ) => {
//   if (!Array.isArray(employees)) {
//     console.error("Invalid employees array in calculateTotals");
//     return {
//       totalPayable: 0,
//       totalGross: 0,
//       totalTDS: 0,
//       totalAdvance: 0,
//       totalOvertime: 0,
//       totalBonus: 0,
//       totalEmployeePF: 0,
//       totalEmployerPF: 0,
//       totalInsurance: 0,
//       totalIncentives: 0,
//       totalLopDeduction: 0,
//     };
//   }

//   return employees.reduce(
//     (totals, emp) => {
//       const salaryDetails = calculateSalaryDetails(
//         emp.ctc,
//         emp.plan_data,
//         emp.employee_id,
//         overtimeRecords,
//         bonusRecords,
//         advances,
//         incentivesData,
//         employeeLopData
//       );
//       if (!salaryDetails) {
//         console.warn(`No salary details for employee ${emp.employee_id}`);
//         return totals;
//       }

//       return {
//         totalPayable: totals.totalPayable + salaryDetails.netSalary,
//         totalGross: totals.totalGross + salaryDetails.grossSalary,
//         totalTDS: totals.totalTDS + salaryDetails.tds,
//         totalAdvance: totals.totalAdvance + salaryDetails.advanceRecovery,
//         totalOvertime: totals.totalOvertime + salaryDetails.overtimePay,
//         totalBonus: totals.totalBonus + salaryDetails.bonusPay,
//         totalEmployeePF: totals.totalEmployeePF + salaryDetails.employeePF,
//         totalEmployerPF: totals.totalEmployerPF + salaryDetails.employerPF,
//         totalInsurance: totals.totalInsurance + salaryDetails.insurance,
//         totalIncentives: totals.totalIncentives + salaryDetails.incentivePay,
//         totalLopDeduction:
//           totals.totalLopDeduction + salaryDetails.lopDeduction,
//       };
//     },
//     {
//       totalPayable: 0,
//       totalGross: 0,
//       totalTDS: 0,
//       totalAdvance: 0,
//       totalOvertime: 0,
//       totalBonus: 0,
//       totalEmployeePF: 0,
//       totalEmployerPF: 0,
//       totalInsurance: 0,
//       totalIncentives: 0,
//       totalLopDeduction: 0,
//     }
//   );
// };

// export const getMonthlySalary = (employeeId, employees) => {
//   const employee = employees.find((emp) => emp.employee_id === employeeId);
//   if (!employee || !employee.ctc) return 0;
//   return Math.round(parseFloat(employee.ctc) / 12);
// };



export const getCurrentYearMonth = () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const parseApplicableMonth = (monthStr) => {
  if (!monthStr || typeof monthStr !== "string") {
    return null;
  }

  if (/^\d{4}-\d{2}$/.test(monthStr)) {
    const [year, month] = monthStr.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return null;
    }
    return new Date(year, month - 1);
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthIndex = monthNames.findIndex(
    (name) => name.toLowerCase() === monthStr.toLowerCase()
  );
  if (monthIndex !== -1) {
    return new Date(new Date().getFullYear(), monthIndex);
  }
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
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const cutoffDate = 5;

  let targetMonth = currentMonth;
  let targetYear = currentYear;
  if (currentDay < cutoffDate) {
    targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    if (targetMonth === 12) targetYear--;
  }
  const targetMonthStr = targetMonth.toString().padStart(2, "0");

  const windowStart = new Date(
    Date.UTC(targetYear, targetMonth - 1, cutoffDate)
  );
  const windowEnd = new Date(
    Date.UTC(currentYear, currentMonth - 1, cutoffDate)
  );

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
const includedValue = (value, includeFlag) => {
  return includeFlag ? Number(value || 0) : 0;
};

export const calculateSalaryDetails = (
  ctc,
  planData,
  employeeId,
  overtimeRecords = [],
  bonusRecords = [],
  advances = [],
  employeeIncentiveData = {},
  employeeLopData = {}
) => {
  const safeOvertimeRecords = Array.isArray(overtimeRecords)
    ? overtimeRecords
    : [];
  const safeBonusRecords = Array.isArray(bonusRecords) ? bonusRecords : [];
  const safeAdvances = Array.isArray(advances) ? advances : [];

  if (!employeeId) {
    console.error(`Invalid employeeId (${employeeId})`);
    return null;
  }

  if (!ctc || ctc <= 0 || isNaN(parseFloat(ctc))) {
    console.warn(
      `Invalid or missing CTC (${ctc}) for employee ${employeeId}. Using default CTC of 0.`
    );
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
    statutoryBonus = 0,
    statutoryBonusYearly = 0,

    employeePF = 0,
    employerPF = 0,

    esic = 0,
    esicEmployer = 0,

    insurance = 0,
    insuranceEmployer = 0,

    gratuity = 0,
    professionalTax = 0,
    otherAllowances = 0,
    advanceRecovery = 0,
    grossSalary = 0,
    incentivePay = 0,
    lopDeduction = 0;

  if (!planData || typeof planData !== "object") {
    console.warn(
      `Invalid or missing planData for employee ${employeeId}. Using default values.`
    );
    planData = {};
  }

  // Basic Salary - Fixed is monthly
  if (
    planData.isBasicSalary &&
    planData.basicSalaryType === "percentage" &&
    planData.basicSalary &&
    !isNaN(parseFloat(planData.basicSalary))
  ) {
    basicSalary = monthlyCtc * (parseFloat(planData.basicSalary) / 100);
  } else if (
    planData.basicSalaryAmount &&
    !isNaN(parseFloat(planData.basicSalaryAmount))
  ) {
    basicSalary = parseFloat(planData.basicSalaryAmount); // Monthly
  } else {
    basicSalary = monthlyCtc ? monthlyCtc * 0.4 : 0;
    console.warn(
      `Using default basicSalary (40% of CTC) for employee ${employeeId}`
    );
  }

  // HRA - Fixed is monthly
  if (
    planData.isHouseRentAllowance &&
    planData.houseRentAllowanceType === "percentage" &&
    planData.houseRentAllowance &&
    !isNaN(parseFloat(planData.houseRentAllowance))
  ) {
    hra = basicSalary * (parseFloat(planData.houseRentAllowance) / 100);
  } else if (
    planData.houseRentAllowanceAmount &&
    !isNaN(parseFloat(planData.houseRentAllowanceAmount))
  ) {
    hra = parseFloat(planData.houseRentAllowanceAmount); // Monthly
  } else {
    hra = basicSalary * 0.5;
  }

  // LTA - Fixed is monthly
  if (
    planData.isLtaAllowance &&
    planData.ltaAllowanceType === "percentage" &&
    planData.ltaAllowance &&
    !isNaN(parseFloat(planData.ltaAllowance))
  ) {
    ltaAllowance = monthlyCtc * (parseFloat(planData.ltaAllowance) / 100);
  } else if (
    planData.ltaAllowanceAmount &&
    !isNaN(parseFloat(planData.ltaAllowanceAmount))
  ) {
    ltaAllowance = parseFloat(planData.ltaAllowanceAmount); // Monthly
  } else {
    ltaAllowance = 0;
    console.warn(`No LTA Allowance defined for employee ${employeeId}`);
  }

  // Other Allowances - Fixed is monthly (initial)
  if (
    planData.isOtherAllowance &&
    planData.otherAllowanceType === "percentage" &&
    planData.otherAllowance &&
    !isNaN(parseFloat(planData.otherAllowance))
  ) {
    otherAllowances = monthlyCtc * (parseFloat(planData.otherAllowance) / 100);
  } else if (
    planData.otherAllowanceAmount &&
    !isNaN(parseFloat(planData.otherAllowanceAmount))
  ) {
    otherAllowances = parseFloat(planData.otherAllowanceAmount); // Monthly
  } else {
    otherAllowances = 0;
  }

  const { targetMonthStr, targetYear, windowStart, windowEnd } =
    getPayrollFilter();

  const employeeOvertime = safeOvertimeRecords.filter((ot) => {
    const otDate = parseWorkDate(ot.work_date);
    const updatedDate = new Date(ot.updated_at || ot.created_at);
    const isInWindow = updatedDate >= windowStart && updatedDate < windowEnd;
    const monthStr = String(otDate ? otDate.getMonth() + 1 : 0).padStart(
      2,
      "0"
    );
    const isValid =
      ot.employee_id === employeeId &&
      ot.status === "Approved" &&
      otDate &&
      otDate.getFullYear() === targetYear &&
      (monthStr === targetMonthStr || isInWindow);
    return isValid;
  });

  overtimePay = employeeOvertime.reduce((total, ot) => {
    const hours = parseFloat(ot.extra_hours);
    let rate = parseFloat(ot.rate);

    if (!rate || isNaN(rate) || rate === 0) {
      if (
        planData.isOvertimePay &&
        planData.overtimePayAmount &&
        !isNaN(parseFloat(planData.overtimePayAmount))
      ) {
        rate = parseFloat(planData.overtimePayAmount);
      } else {
        rate = 500;
        console.warn(
          `No valid rate or overtimePayAmount for employee ${employeeId}; using default rate=₹${rate}/hour`
        );
      }
    }

    if (isNaN(hours) || hours <= 0) {
      return total;
    }

    const pay = hours * rate;
    return total + pay;
  }, 0);

  const employeeBonuses = safeBonusRecords.filter((bonus) => {
    const date = parseApplicableMonth(bonus.applicable_month);
    const isValid =
      date &&
      date.getFullYear() === currentYear &&
      (date.getMonth() + 1).toString().padStart(2, "0") === currentMonthStr;

    return isValid;
  });

  recordBonusPay = employeeBonuses.reduce((sum, bonus) => {
    let bonusAmount = 0;

    if (bonus.fixed_amount && !isNaN(parseFloat(bonus.fixed_amount))) {
      bonusAmount = parseFloat(bonus.fixed_amount);
    } else if (
      bonus.percentage_ctc &&
      !isNaN(parseFloat(bonus.percentage_ctc))
    ) {
      bonusAmount =
        (parseFloat(bonus.percentage_ctc) / 100) * parseFloat(ctc || 0);
    } else if (
      bonus.percentage_monthly_salary &&
      !isNaN(parseFloat(bonus.percentage_monthly_salary))
    ) {
      const multiplier = parseFloat(bonus.percentage_monthly_salary);
      bonusAmount = multiplier * monthlyCtc;
    }
    return sum + bonusAmount;
  }, 0);

  statutoryBonusYearly = 0;
  if (
    planData.isStatutoryBonus &&
    planData.statutoryBonusPercentage &&
    !isNaN(parseFloat(planData.statutoryBonusPercentage))
  ) {
    statutoryBonusYearly =
      (parseFloat(planData.statutoryBonusPercentage) / 100) * ctc;
  } else if (
    planData.isStatutoryBonus &&
    planData.statutoryBonusAmount &&
    !isNaN(parseFloat(planData.statutoryBonusAmount))
  ) {
    statutoryBonusYearly = parseFloat(planData.statutoryBonusAmount);
  }

  statutoryBonus = statutoryBonusYearly / 12;

  const bonusPay = recordBonusPay + statutoryBonus;

  const empId = String(employeeId).toUpperCase();
  const matchedKey = Object.keys(employeeIncentiveData).find(
    (key) => String(key).toUpperCase() === empId
  );

  if (matchedKey && employeeIncentiveData[matchedKey]) {
    const incData = employeeIncentiveData[matchedKey];
    const currentYm = getCurrentYearMonth();
    const currentMonthIncentives = (incData.incentives || []).filter(
      (inc) => inc.applicable_month === currentYm
    );
    incentivePay = currentMonthIncentives.reduce(
      (sum, inc) => sum + parseFloat(inc.value || 0),
      0
    );
  }

  grossSalary =
    basicSalary +
    hra +
    ltaAllowance +
    overtimePay +
    bonusPay +
    incentivePay;

  const pfBase =
    planData.pfCalculationBase === "gross" ? grossSalary : basicSalary;

  // Employee PF
  if (
    planData.isPFApplicable &&
    planData.isPFEmployee &&
    planData.pfEmployeeType === "percentage" &&
    planData.pfEmployeePercentage &&
    !isNaN(parseFloat(planData.pfEmployeePercentage))
  ) {
    employeePF = pfBase * (parseFloat(planData.pfEmployeePercentage) / 100);
    planData.pfEmployeeText = `${
      planData.pfEmployeePercentage
    }% of ${formatCalculationBase(planData.pfCalculationBase)}`;
  } else if (
    planData.pfEmployeeAmount &&
    !isNaN(parseFloat(planData.pfEmployeeAmount))
  ) {
    employeePF = parseFloat(planData.pfEmployeeAmount);
    planData.pfEmployeeText = `₹${planData.pfEmployeeAmount} (Fixed)`;
  } else {
    employeePF = 0;
    planData.pfEmployeeText = `Not Applicable`;
  }

  // Employer PF
  if (
    planData.isPFApplicable &&
    planData.isPFEmployer &&
    planData.pfEmployerType === "percentage" &&
    planData.pfEmployerPercentage &&
    !isNaN(parseFloat(planData.pfEmployerPercentage))
  ) {
    employerPF = pfBase * (parseFloat(planData.pfEmployerPercentage) / 100);
    planData.pfEmployerText = `${
      planData.pfEmployerPercentage
    }% of ${formatCalculationBase(planData.pfCalculationBase)}`;
  } else if (
    planData.pfEmployerAmount &&
    !isNaN(parseFloat(planData.pfEmployerAmount))
  ) {
    employerPF = parseFloat(planData.pfEmployerAmount);
    planData.pfEmployerText = `₹${planData.pfEmployerAmount} (Fixed)`;
  } else {
    employerPF = 0;
    planData.pfEmployerText = `Not Applicable`;
  }

  const medicalBase =
    planData.medicalCalculationBase === "gross" ? grossSalary : basicSalary;

  // Insurance Employee
  if (
    planData.isInsuranceEmployee &&
    planData.insuranceEmployeeType === "percentage" &&
    planData.insuranceEmployeePercentage &&
    !isNaN(parseFloat(planData.insuranceEmployeePercentage))
  ) {
    insurance = medicalBase * (parseFloat(planData.insuranceEmployeePercentage) / 100);
    planData.insuranceEmployeeText = `${
      planData.insuranceEmployeePercentage
    }% of ${formatCalculationBase(planData.medicalCalculationBase || "basic")}`;
  } else if (
    planData.insuranceEmployeeAmount &&
    !isNaN(parseFloat(planData.insuranceEmployeeAmount))
  ) {
    insurance = parseFloat(planData.insuranceEmployeeAmount);
    planData.insuranceEmployeeText = `₹${planData.insuranceEmployeeAmount} (Fixed)`;
  } else {
    insurance = 0;
    planData.insuranceEmployeeText = "Not Applicable";
  }

  // Insurance Employer
  if (
    planData.isInsuranceEmployer &&
    planData.insuranceEmployerType === "percentage" &&
    planData.insuranceEmployerPercentage &&
    !isNaN(parseFloat(planData.insuranceEmployerPercentage))
  ) {
    insuranceEmployer = medicalBase * (parseFloat(planData.insuranceEmployerPercentage) / 100);
    planData.insuranceEmployerText = `${
      planData.insuranceEmployerPercentage
    }% of ${formatCalculationBase(planData.medicalCalculationBase || "basic")}`;
  } else if (
    planData.insuranceEmployerAmount &&
    !isNaN(parseFloat(planData.insuranceEmployerAmount))
  ) {
    insuranceEmployer = parseFloat(planData.insuranceEmployerAmount);
    planData.insuranceEmployerText = `₹${planData.insuranceEmployerAmount} (Fixed)`;
  } else {
    insuranceEmployer = 0;
    planData.insuranceEmployerText = "Not Applicable";
  }

  // Gratuity
  if (
    planData.isGratuityApplicable &&
    planData.gratuityType === "percentage" &&
    planData.gratuityPercentage &&
    !isNaN(parseFloat(planData.gratuityPercentage))
  ) {
    gratuity = basicSalary * (parseFloat(planData.gratuityPercentage) / 100);
  } else if (
    planData.gratuityAmount &&
    !isNaN(parseFloat(planData.gratuityAmount))
  ) {
    gratuity = parseFloat(planData.gratuityAmount) / 12;
  } else {
    gratuity = basicSalary * 0;
    console.warn(
      `Using default gratuity (4.81% of basicSalary) for employee ${employeeId}`
    );
  }

  // Professional Tax
  professionalTax = 0;
  if (planData.isProfessionalTax) {
    if (
      planData.professionalTaxType === "percentage" &&
      planData.professionalTax &&
      !isNaN(parseFloat(planData.professionalTax))
    ) {
      professionalTax =
        monthlyCtc * (parseFloat(planData.professionalTax) / 100);
      planData.professionalTaxText = `${planData.professionalTax}% of CTC`;
    } else if (
      planData.professionalTaxAmount &&
      !isNaN(parseFloat(planData.professionalTaxAmount))
    ) {
      professionalTax = parseFloat(planData.professionalTaxAmount);
      planData.professionalTaxText = `₹${planData.professionalTaxAmount} (Fixed)`;
    } else {
      professionalTax = 0;
      planData.professionalTaxText = "Not Set";
    }
  } else {
    planData.professionalTaxText = "Not Applicable";
  }

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
      adv.employee_id === employeeId &&
      currentDate >= startDate &&
      currentDate <= endDate;

    return isValid;
  });

  advanceRecovery = employeeAdvances.reduce((total, adv) => {
    const amount = parseFloat(adv.advance_amount);
    const months = parseInt(adv.recovery_months);
    const recovery = months > 0 ? amount / months : 0;
    return total + recovery;
  }, 0);

  let tds = 0;
  if (
    planData.isTDSApplicable &&
    Array.isArray(planData.tdsSlabs) &&
    planData.tdsSlabs.length > 0
  ) {
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
  }

    // ==================== OTHER ALLOWANCE - BALANCING LOGIC ====================
  // Calculate Other Allowance so that Monthly CTC = Earnings + Employer Contributions
 // ==================== OTHER ALLOWANCE - BALANCING LOGIC ====================
    // ==================== OTHER ALLOWANCE - BALANCING LOGIC (LTA EXCLUDED) ====================
    // Other Allowance = CTC - (Basic + HRA + Employer Contributions)
    // LTA is NOT deducted from Other Allowance calculation

if (planData.isOtherAllowance) {

  const fixedComponents =   // ← LTA is removed here
    basicSalary +
    hra +
    // ltaAllowance +     // ← Commented out / removed
    employerPF +
    gratuity +
    insuranceEmployer;

  // Assume ESIC is applicable only if gross <= 21000
  const baseSalary = basicSalary + hra;

  if (
    planData.isESICEmployer &&
    baseSalary <= 21000
  ) {

    const esicRate =
      parseFloat(planData.esicEmployerPercentage || 0) / 100;

    const remaining =
      monthlyCtc -
      fixedComponents -
      (baseSalary * esicRate);

    otherAllowances = remaining / (1 + esicRate);

    esicEmployer =
      (baseSalary + otherAllowances) * esicRate;

  } else {

    otherAllowances =
      monthlyCtc - fixedComponents;   // LTA is not subtracted

    esicEmployer = 0;
  }

  otherAllowances = Math.max(0, otherAllowances);

  planData.otherAllowanceText = `Balancing Component (CTC - Basic - HRA - Employer Contributions) [LTA Excluded]`;

} else {
  otherAllowances = 0;
}

  // ==================== RECALCULATE GROSS SALARY ====================
  grossSalary =
    basicSalary +
    hra +
    ltaAllowance +
    otherAllowances +
    overtimePay +
    bonusPay +
    incentivePay;

  // Rest of the function remains the same...

  // ==================== GROSS FOR ESI (EXCLUDING LTA) ====================
  // IMPORTANT: LTA is deliberately excluded from ESI base as per requirement
  const grossForESI =
    Number(basicSalary || 0) +
    Number(hra || 0) +
    Number(otherAllowances || 0);
  // Note: ltaAllowance is NOT added here

  // ==================== ESIC (Employee & Employer) ====================
  if (
    planData.isESICEmployee &&
    planData.esicEmployeeType === "percentage" &&
    planData.esicEmployeePercentage
  ) {
    const rate = parseFloat(planData.esicEmployeePercentage) / 100;
    esic = grossForESI * rate;
    planData.esicEmployeeText = `${planData.esicEmployeePercentage}% of (Basic + HRA + Other Allowance)`;
  } else if (planData.esicEmployeeAmount) {
    esic = parseFloat(planData.esicEmployeeAmount);
  } else {
    esic = 0;
  }

  // if (
  //   planData.isESICEmployer &&
  //   planData.esicEmployerType === "percentage" &&
  //   planData.esicEmployerPercentage
  // ) {
  //   const rate = parseFloat(planData.esicEmployerPercentage) / 100;
  //   esicEmployer = grossForESI * rate;
  //   planData.esicEmployerText = `${planData.esicEmployerPercentage}% of (Basic + HRA + Other Allowance)`;
  // } else if (planData.esicEmployerAmount) {
  //   esicEmployer = parseFloat(planData.esicEmployerAmount);
  // } else {
  //   esicEmployer = 0;
  // }

  // ==================== RECALCULATE GROSS SALARY ====================
  grossSalary =
    basicSalary +
    hra +
    ltaAllowance +        // LTA is included in gross salary / take-home
    otherAllowances +
    overtimePay +
    bonusPay +
    incentivePay;


  lopDeduction = parseFloat(
    employeeLopData[employeeId]?.currentMonth?.value || 0
  );

  // Employee Deductions
  const employeeDeductions =
    includedValue(employeePF, planData.pfEmployeeIncludeInCtc) +
    includedValue(esic, planData.esicEmployeeIncludeInCtc) +
    includedValue(insurance, planData.insuranceEmployeeIncludeInCtc) +
    includedValue(professionalTax, planData.professionalTaxIncludeInCtc) +
    tds +
    advanceRecovery +
    lopDeduction;

  const netSalary = grossSalary - employeeDeductions;

  const salaryDetails = {
    basicSalary,
    hra,
    ltaAllowance,
    overtimePay,
    recordBonusPay,
    statutoryBonus,
    statutoryBonusYearly,
    bonusPay,
    employeePF,
    employerPF,
    esic,
    esicEmployer,
    insurance,
    insuranceEmployer,
    gratuity,
    professionalTax,
    otherAllowances,
    tds,
    advanceRecovery,
    grossSalary,
    netSalary,
    incentivePay,
    lopDeduction,
    grossForESI,           // Added for debugging / display
  };

  return salaryDetails;
};

export const calculateTotals = (
  employees,
  overtimeRecords,
  bonusRecords,
  advances,
  incentivesData,
  employeeLopData
) => {
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
      totalLopDeduction: 0,
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
        employeeLopData
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
        totalLopDeduction:
          totals.totalLopDeduction + salaryDetails.lopDeduction,
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
      totalLopDeduction: 0,
    }
  );
};

export const getMonthlySalary = (employeeId, employees) => {
  const employee = employees.find((emp) => emp.employee_id === employeeId);
  if (!employee || !employee.ctc) return 0;
  return Math.round(parseFloat(employee.ctc) / 12);
};