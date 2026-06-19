
export const calculatePreviewBreakdown = (ctcInput, formData, salaryDetails) => {
  const annualCTC = parseFloat(ctcInput) || 100000;
  
  const calc = salaryDetails || {};

  console.log("=== calculatePreviewBreakdown START ===");
  console.log("Input CTC:", annualCTC);
  console.log("salaryDetails keys:", Object.keys(calc));
  console.log("ESIC Employee (calc.esic):", calc.esic);
  console.log("ESIC Employer (calc.esicEmployer):", calc.esicEmployer);
  console.log("FormData ESIC flags:", {
    isESICEmployee: formData.isESICEmployee,
    isESICEmployer: formData.isESICEmployer,
  });

  const basic = Number(calc.basicSalary || 0);
  const hra = Number(calc.hra || 0);
  const lta = Number(calc.ltaAllowance || 0);
  const other = Number(calc.otherAllowances || 0);
  const incentive = Number(calc.incentivePay || 0);
  const overtime = Number(calc.overtimePay || 0);
  const statutoryBonus = Number(calc.statutoryBonus || 0);

  const employeePF = Number(calc.employeePF || 0);
  const employerPF = Number(calc.employerPF || 0);
  const esicEmployee = Number(calc.esic || 0);
  const esicEmployer = Number(calc.esicEmployer || 0);
  const insuranceEmployee = Number(calc.insurance || 0);
  const insuranceEmployer = Number(calc.insuranceEmployer || 0);
  const gratuity = Number(calc.gratuity || 0);
  const profTax = Number(calc.professionalTax || 0);

  const totalEarningsMonthly = [basic, hra, lta, other, incentive, overtime, statutoryBonus]
    .reduce((sum, v) => sum + v, 0);

  const employeeDeductionsMonthly = [employeePF, esicEmployee, profTax, insuranceEmployee]
    .reduce((sum, v) => sum + v, 0);

  const employerContributionsMonthly = [employerPF, gratuity, insuranceEmployer, esicEmployer]
    .reduce((sum, v) => sum + v, 0);

  const grossSalaryMonthly = totalEarningsMonthly;
  const netSalaryMonthly = totalEarningsMonthly - employeeDeductionsMonthly;
  const finalCTCMonthly = grossSalaryMonthly + employerContributionsMonthly;

  const breakdown = {
    monthlyCTC: annualCTC / 12,
    annualCTC,
    employeeEarnings: {
      basic,
      hra,
      lta,
      otherAllowance: other,
      incentivePay: incentive,
      overtimePay: overtime,
      statutoryBonus,
      total: totalEarningsMonthly,
    },
    employeeDeductions: {
      employeePF,
      esicEmployee,
      professionalTax: profTax,
      insuranceEmployee,
      total: employeeDeductionsMonthly,
    },
    employerContributions: {
      employerPF,
      gratuity,
      insuranceEmployer,
      esicEmployer,
      total: employerContributionsMonthly,
    },
    summary: {
      grossSalaryMonthly,
      netSalaryMonthly,
      finalCTCMonthly,
    },
  };

  console.log("=== Final Preview Breakdown ===");
  console.log("Employee Earnings:", breakdown.employeeEarnings);
  console.log("Employee Deductions:", breakdown.employeeDeductions);
  console.log("Employer Contributions:", breakdown.employerContributions);
  console.log("Summary:", breakdown.summary);
  console.log("=== calculatePreviewBreakdown END ===");

  return breakdown;
};