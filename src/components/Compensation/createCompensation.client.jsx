"use client";
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./createCompensation.css";
import { FaEye, FaPencilAlt } from "react-icons/fa";
import Modal from "../Modal/Modal.client";
import { calculateSalaryDetails } from "../../utils/SalaryCalculations";
import SalaryCalculationPeriod from "./salaryCalculationPeriod/salaryCalculationPeriod.client";
import { useAuth } from "../../context/AuthProvider.client";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const DEFAULT_CTC = 100000;

// Duplicate of helper present in SalaryDetails/TotalsContainer; used here for
// preview so gross/net matches the same include-in-CTC rules.
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
    // note: recordBonusPay is already included in statutoryBonus or separately?
    0,
  ].reduce((sum, val) => sum + parseFloat(val || 0), 0);

  let monthlyDeductionsSum = 0;
  monthlyDeductionsSum += parseFloat(salaryDetails.advanceRecovery || 0);
  monthlyDeductionsSum += parseFloat(salaryDetails.tds || 0);
  // lop deduction is not available here (requires external data) so skip

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

const CTC_BASED_FIELDS = [
  'basicSalary',
  'otherAllowance',
      'ltaAllowance',             // direct CTC (clean name)
  'incentives',
  'variablePay',
];

const BASIC_BASED_FIELDS = [
  'houseRentAllowance',              // HRA – % of Basic
  'houseRentAllowancePercentage',   // HRA – % of Basic
                    // LTA – % of Basic
  'ltaAllowancePercentage',         // LTA – % of Basic
  'pfEmployee',
  'pfEmployeePercentage',
  'pfEmployer',
  'pfEmployerPercentage',
  'gratuity',
  'gratuityPercentage',
  'esicEmployee',
  'esicEmployeePercentage',
  'statutoryBonus',
  'statutoryBonusPercentage',
  'insuranceEmployee',
  'insuranceEmployeePercentage',
];

const GROSS_BASED_FIELDS = [
 
];



const FIXED_AMOUNT_FIELDS = [
  'professionalTax',
];

const getEffectiveCtcPercentage = (fieldName, formData, ctc = DEFAULT_CTC) => {
  let cleanField = fieldName.replace('Percentage', '');

  const rawPct = parseFloat(formData[fieldName]) || 0;
  if (rawPct <= 0) return 0;

  const basicPct = parseFloat(formData.basicSalary) || 0;

 
  const includeFieldMap = {
    pfEmployee: 'pfEmployeeIncludeInCtc',
    pfEmployer: 'pfEmployerIncludeInCtc',
    esicEmployee: 'esicEmployeeIncludeInCtc',
    insuranceEmployee: 'insuranceEmployeeIncludeInCtc',
    gratuity: 'gratuityIncludeInCtc',
    variablePay: 'variablePayIncludeInCtc',              // ← critical for Variable Pay
    statutoryBonus: 'statutoryBonusIncludeInCtc',        // ← critical for Statutory Bonus
   
  };

  const includeKey = includeFieldMap[cleanField];
  if (includeKey && !formData[includeKey]) {
    return 0; // Checkbox unchecked → 0 contribution
  }

  // Direct CTC-based (no × basicPct)
  if (CTC_BASED_FIELDS.includes(cleanField)) {
    return rawPct;
  }

  // Basic-based → convert
  if (BASIC_BASED_FIELDS.includes(cleanField)) {
    return (rawPct / 100) * basicPct;
  }

  // Gross-based
  if (GROSS_BASED_FIELDS.includes(cleanField)) {
    return rawPct;
  }

  return rawPct;
};


// Optional: helper to quickly know the calculation base of any field
// function getCalculationBase(field) {
//   if (CTC_BASED_FIELDS.includes(field))    return 'ctc';
//   if (BASIC_BASED_FIELDS.includes(field))   return 'basic';
//   if (GROSS_BASED_FIELDS.includes(field))   return 'gross';
//   if (FIXED_AMOUNT_FIELDS.includes(field))  return 'fixed';
//   return 'other';
// }

function getCalculationBase(field) {
  const cleanField = field.replace('Percentage', '').replace('Amount', '');

  if (CTC_BASED_FIELDS.includes(cleanField)) {
    return 'ctc';
  }
  if (BASIC_BASED_FIELDS.includes(cleanField)) {
    return 'basic';
  }
  if (GROSS_BASED_FIELDS.includes(cleanField)) {
    return 'gross';
  }
  if (FIXED_AMOUNT_FIELDS.includes(cleanField)) {
    return 'fixed';
  }

  // Special cases / fallbacks
  if (['variablePay', 'statutoryBonus', 'incentives'].includes(cleanField)) {
    return 'ctc'; // most common treatment
  }
  if (['professionalTax'].includes(cleanField)) {
    return 'ctc'; // or 'fixed' if always amount
  }

  return 'other';
}

const getBaseLabel = (fieldName, formData) => {
  const base = getCalculationBase(fieldName);

  if (base === 'basic') {
    return '(based on Basic Salary)';
  }
  if (base === 'ctc') {
    return '(based on CTC)';
  }
  if (base === 'gross') {
    return '(based on Gross Salary)';
  }
  if (base === 'fixed') {
    return '(fixed amount)';
  }

  // Special logic for percentage vs amount mode
  const typeField = `${fieldName.replace('Percentage', '')}Type`;
  if (formData[typeField] === 'amount') {
    return '(fixed amount)';
  }

  return ''; // nothing shown for unknown cases
};


const allowancePercentageFields = [
  {
    field: "basicSalary",
    enable: "isBasicSalary",
    type: "basicSalaryType",
    amountField: "basicSalaryAmount",
  },
  {
    field: "houseRentAllowance",
    enable: "isHouseRentAllowance",
    type: "houseRentAllowanceType",
    amountField: "houseRentAllowanceAmount",
  },
  {
    field: "ltaAllowance",
    enable: "isLtaAllowance",
    type: "ltaAllowanceType",
    amountField: "ltaAllowanceAmount",
  },
  {
    field: "otherAllowance",
    enable: "isOtherAllowance",
    type: "otherAllowanceType",
    amountField: "otherAllowanceAmount",
  },
  {
    field: "pfEmployeePercentage",
    enable: "isPFEmployee",
    type: "pfEmployeeType",
    amountField: "pfEmployeeAmount",
    include: "pfEmployeeIncludeInCtc",
  },
  {
    field: "pfEmployerPercentage",
    enable: "isPFEmployer",
    type: "pfEmployerType",
    amountField: "pfEmployerAmount",
    include: "pfEmployerIncludeInCtc",
  },
  {
    field: "esicEmployeePercentage",
    enable: "isESICEmployee",
    type: "esicEmployeeType",
    amountField: "esicEmployeeAmount",
    include: "esicEmployeeIncludeInCtc",
  },
  {
    field: "insuranceEmployeePercentage",
    enable: "isInsuranceEmployee",
    type: "insuranceEmployeeType",
    amountField: "insuranceEmployeeAmount",
    include: "insuranceEmployeeIncludeInCtc",
  },
  {
    field: "gratuityPercentage",
    enable: "isGratuityApplicable",
    type: "gratuityType",
    amountField: "gratuityAmount",
    include: "gratuityIncludeInCtc",
  },
  {
    field: "professionalTax",
    enable: "isProfessionalTax",
    type: "professionalTaxType",
    amountField: "professionalTaxAmount",
    include: "professionalTaxIncludeInCtc",
  },
  {
    field: "variablePay",
    enable: "isVariablePay",
    type: "variablePayType",
    amountField: "variablePayAmount",
    include: "variablePayIncludeInCtc",
  },
  {
    field: "statutoryBonusPercentage",
    enable: "isStatutoryBonus",
    type: "statutoryBonusType",
    amountField: "statutoryBonusAmount",
    include: "statutoryBonusIncludeInCtc",
  },
  {
    field: "incentives",
    enable: "isIncentives",
    type: "incentivesType",
    amountField: "incentivesAmount",
    include: "incentivesIncludeInCtc",
  },
];

const defaultFormData = {
  compensationPlanName: "",
  isPFApplicable: false,
  pfCalculationBase: "",
  pfPercentage: "",
  pfAmount: "",
  pfType: "percentage",
  isPFEmployer: false,
  pfEmployerPercentage: "",
  pfEmployerAmount: "",
  pfEmployerType: "percentage",
  pfEmployerIncludeInCtc: false,
  isPFEmployee: false,
  pfEmployeePercentage: "",
  pfEmployeeAmount: "",
  pfEmployeeType: "percentage",
  pfEmployeeIncludeInCtc: false,
  isMedicalApplicable: false,
  medicalCalculationBase: "",
  isESICEmployee: false,
  esicEmployeePercentage: "",
  esicEmployeeAmount: "",
  esicEmployeeType: "percentage",
  esicEmployeeIncludeInCtc: false,
  isInsuranceEmployee: false,
  insuranceEmployeePercentage: "",
  insuranceEmployeeAmount: "",
  insuranceEmployeeType: "percentage",
  insuranceEmployeeIncludeInCtc: false,
  isGratuityApplicable: false,
  gratuityPercentage: "",
  gratuityAmount: "",
  gratuityType: "percentage",
  gratuityIncludeInCtc: false,
  isProfessionalTax: false,
  professionalTax: "",
  professionalTaxAmount: "",
  professionalTaxType: "percentage",
  professionalTaxIncludeInCtc: false,
  isVariablePay: false,
  variablePay: "",
  variablePayAmount: "",
  variablePayType: "percentage",
  variablePayIncludeInCtc: false,
  isStatutoryBonus: false,
  statutoryBonusPercentage: "",
  statutoryBonusAmount: "",
  statutoryBonusType: "percentage",
  statutoryBonusIncludeInCtc: false,
  isBasicSalary: false,
  basicSalary: "",
  basicSalaryAmount: "",
  basicSalaryType: "amount",
  isHouseRentAllowance: false,
  houseRentAllowance: "",
  houseRentAllowanceAmount: "",
  houseRentAllowanceType: "amount",
  isLtaAllowance: false,
  ltaAllowance: "",
  ltaAllowanceAmount: "",
  ltaAllowanceType: "amount",
  isOtherAllowance: false,
  otherAllowance: "",
  otherAllowanceAmount: "",
  otherAllowanceType: "amount",
  isStatutoryBonusAmount: false,
  statutoryBonus: "",
  statutoryBonusFixedAmount: "",
  statutoryBonusFixedType: "amount",
  isVariablePayAmount: false,
  variablePayAmount: "",
  variablePayFixedAmount: "",
  variablePayFixedType: "amount",
  isOvertimePay: false,
  overtimePayType: "hourly",
  overtimePayAmount: "",
  overtimePayUnits: "",
  isIncentives: false,
  incentives: "",
  incentivesAmount: "",
  incentivesType: "amount",
  isDefaultWorkingHours: false,
  defaultWorkingHours: "",
  isDefaultWorkingDays: false,
  defaultWorkingDays: {
    Sunday: "weekOff",
    Monday: "fullDay",
    Tuesday: "fullDay",
    Wednesday: "fullDay",
    Thursday: "fullDay",
    Friday: "fullDay",
    Saturday: "weekOff",
  },
  isTDSApplicable: false,
  tdsSlabs: [],
};

const calculationDefaults = {
  basicSalary: { percentage: "40", type: "percentage" },
  hra: { percentage: "20", type: "percentage" },
  lta: { percentage: "0", type: "percentage" },
  otherAllowance: { percentage: "fill", type: "percentage" },
  variablePay: { percentage: "0", type: "percentage" },
  statutoryBonus: { percentage: "0", type: "percentage" },
  incentives: { amount: "0", type: "amount" },
  professionalTax: { amount: "0", type: "amount" },
  pfEmployee: { percentage: "0", type: "percentage" },
  pfEmployer: { percentage: "0", type: "percentage" },
  esicEmployee: { percentage: "0", type: "percentage" },
  insuranceEmployee: { percentage: "0", type: "percentage" },
  gratuity: { percentage: "4.81", type: "percentage" },
  tds: { percentage: "0", type: "percentage" },

};

const salaryFieldToFormDataMap = {
  basicSalary: {
    amount: "basicSalaryAmount",
    percentage: "basicSalary",
    type: "basicSalaryType",
    enable: "isBasicSalary",
    default: calculationDefaults.basicSalary,
  },
  hra: {
    amount: "houseRentAllowanceAmount",
    percentage: "houseRentAllowance",
    type: "houseRentAllowanceType",
    enable: "isHouseRentAllowance",
    default: calculationDefaults.hra,
  },
  ltaAllowance: {
    amount: "ltaAllowanceAmount",
    percentage: "ltaAllowance",
    type: "ltaAllowanceType",
    enable: "isLtaAllowance",
    default: calculationDefaults.lta,
  },
  otherAllowances: {
    amount: "otherAllowanceAmount",
    percentage: "otherAllowance",
    type: "otherAllowanceType",
    enable: "isOtherAllowance",
    default: calculationDefaults.otherAllowance,
  },
  variablePay: {
    amount: "variablePayAmount",
    percentage: "variablePay",
    type: "variablePayType",
    enable: "isVariablePay",
    default: calculationDefaults.variablePay,
  },
  statutoryBonus: {
    amount: "statutoryBonusAmount",
    percentage: "statutoryBonusPercentage",
    type: "statutoryBonusType",
    enable: "isStatutoryBonus",
    default: calculationDefaults.statutoryBonus,
  },
  bonusPay: {
    amount: "statutoryBonusAmount",
    percentage: "statutoryBonusPercentage",
    type: "statutoryBonusType",
    enable: "isStatutoryBonus",
    default: calculationDefaults.statutoryBonus,
  },
  incentives: {
    amount: "incentivesAmount",
    percentage: "incentives",
    type: "incentivesType",
    enable: "isIncentives",
    default: calculationDefaults.incentives,
  },
  professionalTax: {
    amount: "professionalTaxAmount",
    percentage: "professionalTax",
    type: "professionalTaxType",
    enable: "isProfessionalTax",
    default: calculationDefaults.professionalTax,
    text: "professionalTaxText",
  },
  employeePF: {
    amount: "pfEmployeeAmount",
    percentage: "pfEmployeePercentage",
    type: "pfEmployeeType",
    enable: "isPFEmployee",
    default: calculationDefaults.pfEmployee,
  },
  employerPF: {
    amount: "pfEmployerAmount",
    percentage: "pfEmployerPercentage",
    type: "pfEmployerType",
    enable: "isPFEmployer",
    default: calculationDefaults.pfEmployer,
  },
  pfCalculationBase: { field: "pfCalculationBase", default: "" },
  esic: {
    amount: "esicEmployeeAmount",
    percentage: "esicEmployeePercentage",
    type: "esicEmployeeType",
    enable: "isESICEmployee",
    default: calculationDefaults.esicEmployee,
  },
  insurance: {
    amount: "insuranceEmployeeAmount",
    percentage: "insuranceEmployeePercentage",
    type: "insuranceEmployeeType",
    enable: "isInsuranceEmployee",
    default: calculationDefaults.insuranceEmployee,
  },
  gratuity: {
    amount: "gratuityAmount",
    percentage: "gratuityPercentage",
    type: "gratuityType",
    enable: "isGratuityApplicable",
    default: calculationDefaults.gratuity,
  },
  medicalCalculationBase: { field: "medicalCalculationBase", default: "" },
  tds: { enable: "isTDSApplicable", default: calculationDefaults.tds },

  overtimePay: {
    amount: "overtimePayAmount",
    type: "overtimePayType",
    enable: "isOvertimePay",
    units: "overtimePayUnits",
    default: { amount: "0", type: "hourly" },
  },
};

const convertAmountToPercentage = (amount, baseCtc = DEFAULT_CTC) => {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) return 0;
  return (parsedAmount / baseCtc) * 100;
};

const formatFieldName = (key) => {
  const fieldNames = {
    basicSalary: "Basic Salary",
    hra: "HRA",
    ltaAllowance: "LTA Allowance",
    overtimePay: "Overtime Pay",
    bonusPay: "Statutory Bonus",
    employeePF: "Employee PF",
    employerPF: "Employer PF",
    esic: "ESIC Employee",
    gratuity: "Gratuity",
    professionalTax: "Professional Tax",
    otherAllowances: "Other Allowances",
    tds: "TDS",
   
    insurance: "Insurance",
    grossSalary: "Gross Salary",
    netSalary: "Net Salary",
    isESICEmployee: "Is ESIC Employee",
    isMedicalApplicable: "Is Medical Applicable",
    esicEmployeePercentage: "ESIC Employee Percentage",
    recordBonusPay: null,
    recordBonusPayYearly: null,
  };
  return (
    fieldNames[key] ||
    key
      .replace(/([A-Z][a-z]+)/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  );
};

const validateTotalPercentage = (formData, ctc = DEFAULT_CTC) => {
  let totalPercentage = 0;
  const components = [];
  const ctcBase = ctc || DEFAULT_CTC;
  allowancePercentageFields.forEach(
    ({ field, enable, type, amount, includeCtc }) => {
      if (
        formData[enable] &&
        (includeCtc === undefined || formData[includeCtc])
      ) {
        if (formData[type] === "percentage") {
          const value = parseFloat(formData[field]) || 0;
          if (value > 0) {
            totalPercentage += value;
            components.push({
              name: formatFieldName(field.replace("Percentage", "")),
              value: `${value}%`,
              type: "percentage",
            });
          }
        } else if (formData[type] === "amount" && formData[amount]) {
          const amountValue = parseFloat(formData[amount]) || 0;
          if (amountValue > 0) {
            const percentage = convertAmountToPercentage(amountValue, ctcBase);
            totalPercentage += percentage;
            components.push({
              name: formatFieldName(field.replace("Percentage", "")),
              value: `₹${amountValue.toLocaleString(
                "en-IN"
              )} (${percentage.toFixed(2)}%)`,
              type: "amount",
            });
          }
        }
      }
    }
  );
  const isValid = Math.abs(totalPercentage - 100) <= 0.01;
  return {
    isValid,
    totalPercentage: totalPercentage.toFixed(2),
    components,
  };
};

const CreateCompensation = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCompensationId, setEditingCompensationId] = useState(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [ctcInput, setCtcInput] = useState("");
  const [salaryDetails, setSalaryDetails] = useState(null);

  // whenever salaryDetails or CTC input changes, log the sum of effective percentages
  useEffect(() => {
    if (salaryDetails) {
      const salaryDetailsKeyMap = {
        "Basic Salary": "basicSalary",
        "House Rent Allowance (HRA)": "hra",
        "Leave Travel Allowance (LTA)": "ltaAllowance",
        "Other Allowance": "otherAllowances",
        "Provident Fund (PF - Employee)": "employeePF",
        "Provident Fund (PF - Employer)": "employerPF",
        "Employee State Insurance (ESIC - Employee)": "esic",
        "Insurance (Employee)": "insurance",
        "Professional Tax": "professionalTax",
        "Statutory Bonus": "statutoryBonus",
        "Variable Pay / Bonus": "variablePay",
        "Gratuity": "gratuity",
      };

      const totalCTC = parseFloat(ctcInput) || DEFAULT_CTC;
      let sum = 0;
      Object.values(salaryDetailsKeyMap).forEach((key) => {
        const monthlyCalc = Number(salaryDetails[key]) || 0;
        sum += (monthlyCalc * 12) / totalCTC * 100;
      });
      // round and clamp to 100
      sum = parseFloat(sum.toFixed(4));
      if (sum > 100) sum = 100;
      console.log(`Preview TOTAL % from salaryDetails = ${sum.toFixed(4)}%`);
    }
  }, [salaryDetails, ctcInput]);
  const [previewAllocation, setPreviewAllocation] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [compensations, setCompensations] = useState([]);

  const [isSalaryPeriodModalOpen, setIsSalaryPeriodModalOpen] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    isVisible: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
  });
  const [viewExecCompensation, setViewExecCompensation] = useState(null);
  const [errors, setErrors] = useState({});
  const [salaryPeriods, setSalaryPeriods] = useState([]);
  const [isOtherAllowanceAutoFilled, setIsOtherAllowanceAutoFilled] = useState(false);
  const [isOtherAllowanceManuallyEdited, setIsOtherAllowanceManuallyEdited] = useState(false);

  const { user } = useAuth();
  const meId = user?.employeeId ?? user?.id ?? user?.employee_id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
  const getHeaders = (opts = {}) => {
    const base = {
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
      "Content-Type": "application/json",
    };

    if (meId) base["x-employee-id"] = String(meId);
    if (orgId) base["x-org-id"] = String(orgId);

    return { ...base, ...opts };
  };
 
//  const allocationInfo = useMemo(() => {
//   let totalAllocated = 0;
//   const components = [];

//   allowancePercentageFields.forEach(
//     ({ field, enable, type, amountField, include }) => {
//       const isEnabled = formData[enable];
//       if (!isEnabled) return;

//       // For fields that have "Include in CTC?" checkbox, respect it
//       let isIncludedInCtc = true;
//       if (include) {
//         isIncludedInCtc = formData[include] === true;
//       }

//       // Skip if not included in CTC
//       if (!isIncludedInCtc) return;

//       if (formData[type] === "percentage") {
//         const pctValue = parseFloat(formData[field]) || 0;
//         if (pctValue > 0) {
//           const effectivePct = getEffectiveCtcPercentage(field, formData);
//           totalAllocated += effectivePct;

//           components.push({
//             name: formatFieldName(field.replace("Percentage", "")),
//             raw: pctValue,
//             effective: effectivePct.toFixed(2),
//             type: "percentage",
//           });
//         }
//       } else if (formData[type] === "amount" && formData[amountField]) {
//   const amt = parseFloat(formData[amountField]) || 0;
//   if (amt > 0) {
//     const ctc = parseFloat(ctcInput) || DEFAULT_CTC;
//     const effectivePct = (amt * 12 / ctc) * 100;
//     totalAllocated += effectivePct;
//     components.push({
//       name: formatFieldName(field.replace("Percentage", "")),
//       raw: amt,
//       effective: effectivePct.toFixed(2),
//       type: "amount",
//     });
//   }

//       }
//     }
//   );

//   const remaining = Math.max(0, 100 - totalAllocated);
//   const exceeds = totalAllocated > 100 ? (totalAllocated - 100) : 0;

//   return {
//     totalAllocated: totalAllocated.toFixed(2),
//     remaining: remaining.toFixed(2),
//     exceeds: exceeds.toFixed(2),
//     components,
//     isValid: Math.abs(totalAllocated - 100) <= 0.5,
//   };
// }, [formData, ctcInput]);

const allocationInfo = useMemo(() => {
  let totalAllocated = 0;
  const components = [];
  const ctc = parseFloat(ctcInput) || DEFAULT_CTC;
  const validCtc = !isNaN(ctc) && ctc > 0 ? ctc : DEFAULT_CTC;

  allowancePercentageFields.forEach(
    ({ field, enable, type, amountField, include }) => {
      // 1. Is this component even enabled?
      const isEnabled = formData[enable];
      if (!isEnabled) return;

      // 2. Does it have "Include in CTC?" and is it checked?
      let isIncludedInCtc = true;
      if (include) {
        isIncludedInCtc = formData[include] === true;
      }
      if (!isIncludedInCtc) return;

      // 3. Get value depending on whether it's percentage or fixed amount
      if (formData[type] === "percentage") {
        const pctValue = parseFloat(formData[field]) || 0;
        if (pctValue <= 0) return;

        // Use the smart function that knows CTC-based vs Basic-based etc.
        const effectivePct = getEffectiveCtcPercentage(field, formData, validCtc);

        if (effectivePct > 0) {
          totalAllocated += effectivePct;
          components.push({
            name: formatFieldName(field.replace("Percentage", "")),
            raw: pctValue,
            effective: effectivePct,           // ← NO toFixed here
            type: "percentage",
            display: `${pctValue}% ≈ ${effectivePct}% effective`, 
          });
        }
      }
      else if (formData[type] === "amount" && formData[amountField]) {
        const amount = parseFloat(formData[amountField]) || 0;
        if (amount <= 0) return;

        // Special fields (Professional Tax, Insurance) are monthly amounts, not annual
        const isMonthlyAmount =
          field === "professionalTax" ||
          field === "professionalTaxAmount" ||
          field === "insuranceEmployeeAmount";

        let effectivePct;
        if (isMonthlyAmount) {
          // Monthly amount → convert to annual CTC percentage
          effectivePct = (amount * 12 / validCtc) * 100;
        } else {
          // Fixed annual amount → convert to % of CTC
          effectivePct = (amount / validCtc) * 100;
        }

        totalAllocated += effectivePct;
        components.push({
          name: formatFieldName(field.replace("Percentage", "")),
          raw: amount,
          effective: effectivePct,           // ← NO toFixed here
          type: "amount",
          display: `₹${amount.toLocaleString("en-IN")}${isMonthlyAmount ? '/month' : ''} ≈ ${effectivePct}%`, 
        });
      }
    }
  );

  // Final calculations — NO rounding here either
  const remaining = 100 - totalAllocated;
  const exceeds = totalAllocated > 100 ? (totalAllocated - 100) : 0;

  // We keep full precision
  return {
    totalAllocated,           // ← full precision number
    remaining,                // ← full precision
    exceeds,                  // ← full precision
    components,
    isValid: Math.abs(totalAllocated - 100) <= 0.8,
    isOver: exceeds > 0.5,
    isUnder: remaining > 1.2,
  };
}, [formData, ctcInput]);
useEffect(() => {
    if (!meId || !orgId) {
      console.warn("Skipping fetches – missing meId or orgId", { meId, orgId });
      showAlert(
        "Loading user data... Please wait or refresh if this persists."
      );
      setSalaryPeriods([]);
      setCompensations([]);
      return;
    }

    fetchCompensations();
    fetchSalaryPeriods();
  }, [meId, orgId]);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const headers = {
    "x-api-key": API_KEY,
    ...(user?.employeeId ? { "x-employee-id": user.employeeId } : {}),
    ...(user?.role ? { "x-role": user.role } : {}),
    ...(orgId ? { "x-org-id": orgId } : {}),
  };

  const logHeaders = {
    ...headers,
    "x-api-key": headers["x-api-key"] ? "[REDACTED]" : "MISSING",
  };

  const allowancePercentageFieldsInternal = [
    {
      field: "basicSalary",
      enable: "isBasicSalary",
      type: "basicSalaryType",
      amountField: "basicSalaryAmount",
    },
    {
      field: "houseRentAllowance",
      enable: "isHouseRentAllowance",
      type: "houseRentAllowanceType",
      amountField: "houseRentAllowanceAmount",
    },
    {
      field: "ltaAllowance",
      enable: "isLtaAllowance",
      type: "ltaAllowanceType",
      amountField: "ltaAllowanceAmount",
    },
    {
      field: "otherAllowance",
      enable: "isOtherAllowance",
      type: "otherAllowanceType",
      amountField: "otherAllowanceAmount",
    },
    {
      field: "pfEmployeePercentage",
      enable: "isPFEmployee",
      type: "pfEmployeeType",
      amountField: "pfEmployeeAmount",
      include: "pfEmployeeIncludeInCtc",
    },
    {
      field: "pfEmployerPercentage",
      enable: "isPFEmployer",
      type: "pfEmployerType",
      amountField: "pfEmployerAmount",
      include: "pfEmployerIncludeInCtc",
    },
    {
      field: "esicEmployeePercentage",
      enable: "isESICEmployee",
      type: "esicEmployeeType",
      amountField: "esicEmployeeAmount",
      include: "esicEmployeeIncludeInCtc",
    },
    {
      field: "insuranceEmployeePercentage",
      enable: "isInsuranceEmployee",
      type: "insuranceEmployeeType",
      amountField: "insuranceEmployeeAmount",
      include: "insuranceEmployeeIncludeInCtc",
    },
    {
      field: "gratuityPercentage",
      enable: "isGratuityApplicable",
      type: "gratuityType",
      amountField: "gratuityAmount",
      include: "gratuityIncludeInCtc",
    },
    {
      field: "professionalTax",
      enable: "isProfessionalTax",
      type: "professionalTaxType",
      amountField: "professionalTaxAmount",
      include: "professionalTaxIncludeInCtc",
    },
    {
      field: "variablePay",
      enable: "isVariablePay",
      type: "variablePayType",
      amountField: "variablePayAmount",
      include: "variablePayIncludeInCtc",
    },
    {
      field: "statutoryBonusPercentage",
      enable: "isStatutoryBonus",
      type: "statutoryBonusType",
      amountField: "statutoryBonusAmount",
      include: "statutoryBonusIncludeInCtc",
    },
    {
      field: "incentives",
      enable: "isIncentives",
      type: "incentivesType",
      amountField: "incentivesAmount",
      include: "incentivesIncludeInCtc",
    },
  ];



// Auto-fill Other Allowance percentage when appropriate
useEffect(() => {
  // Only show when Other Allowance is enabled & percentage mode
  if (
    !formData.isOtherAllowance ||
    formData.otherAllowanceType !== "percentage"
  ) {
    if (isOtherAllowanceAutoFilled) {
      setIsOtherAllowanceAutoFilled(false);
    }
    return;
  }

  // Never override if user manually typed a value
  if (isOtherAllowanceManuallyEdited) {
    return;
  }

  let totalAllocated = 0;
  const ctc = DEFAULT_CTC; // ignore preview CTC input

  allowancePercentageFields.forEach(
    ({ field, enable, type, amountField, include }) => {
      if (field === "otherAllowance") return;
      if (!formData[enable]) return;
      let isIncludedInCtc = true;
      if (include) {
        isIncludedInCtc = formData[include] === true;
      }
      if (!isIncludedInCtc) return;

      if (formData[type] === "percentage") {
        const pctValue = parseFloat(formData[field]) || 0;
        if (pctValue > 0) {
          totalAllocated += getEffectiveCtcPercentage(field, formData, ctc);
        }
      } else if (formData[type] === "amount" && formData[amountField]) {
        const amount = parseFloat(formData[amountField]) || 0;
        if (amount > 0) {
          const isMonthlyAmount =
            field === "professionalTax" ||
            field === "professionalTaxAmount" ||
            field === "insuranceEmployeeAmount";
          let eff;
          if (isMonthlyAmount) {
            eff = (amount * 12 / ctc) * 100;
          } else {
            eff = (amount / ctc) * 100;
          }
          totalAllocated += eff;
        }
      }
    }
  );

  const newOtherPct = Math.max(0, 100 - totalAllocated).toFixed(4);
  setFormData((prev) => {
    if (parseFloat(prev.otherAllowance) !== parseFloat(newOtherPct)) {
      setIsOtherAllowanceAutoFilled(true);
      return { ...prev, otherAllowance: newOtherPct };
    }
    return prev;
  });
}, [
  formData.isOtherAllowance,
  formData.otherAllowanceType,
  formData.isBasicSalary,
  formData.basicSalary,
  formData.basicSalaryAmount,
  formData.isHouseRentAllowance,
  formData.houseRentAllowance,
  formData.houseRentAllowanceAmount,
  formData.isLtaAllowance,
  formData.ltaAllowance,
  formData.ltaAllowanceAmount,
  formData.isPFEmployee,
  formData.pfEmployeePercentage,
  formData.pfEmployeeAmount,
  formData.pfEmployeeIncludeInCtc,
  formData.isPFEmployer,
  formData.pfEmployerPercentage,
  formData.pfEmployerAmount,
  formData.pfEmployerIncludeInCtc,
  formData.isESICEmployee,
  formData.esicEmployeePercentage,
  formData.esicEmployeeAmount,
  formData.esicEmployeeIncludeInCtc,
  formData.isInsuranceEmployee,
  formData.insuranceEmployeePercentage,
  formData.insuranceEmployeeAmount,
  formData.insuranceEmployeeIncludeInCtc,
  formData.isGratuityApplicable,
  formData.gratuityPercentage,
  formData.gratuityAmount,
  formData.gratuityIncludeInCtc,
  formData.isProfessionalTax,
  formData.professionalTax,
  formData.professionalTaxAmount,
  formData.professionalTaxIncludeInCtc,
  formData.isVariablePay,
  formData.variablePay,
  formData.variablePayAmount,
  formData.variablePayIncludeInCtc,
  formData.isStatutoryBonus,
  formData.statutoryBonusPercentage,
  formData.statutoryBonusAmount,
  formData.statutoryBonusIncludeInCtc,
  formData.incentivesIncludeInCtc,
  isOtherAllowanceManuallyEdited,
]);

  const renderCategoryField = ({
    label,
    field,
    percentageField,
    amountField,
    typeField,
    includeCtcField,
    required = false,
    type,
    options = [],
    validation,
  }) => {
    const totalCTC = ctcInput ? parseFloat(ctcInput) : DEFAULT_CTC;
    const percentageValue =
      formData[percentageField] ||
      (formData[typeField] === "amount" && formData[amountField]
        ? convertAmountToPercentage(formData[amountField], totalCTC).toFixed(2)
        : "");
   
    // Helper: effective remaining with tolerance for floating-point precision
    // Values less than 0.01 are treated as 0 (fully allocated)
    const effectiveRemaining = parseFloat(allocationInfo.remaining) < 0.01
      ? 0
      : parseFloat(allocationInfo.remaining);
    const effectiveExceeds = parseFloat(allocationInfo.exceeds) < 0.01
      ? 0
      : parseFloat(allocationInfo.exceeds);
   
    return (
      <div key={field} className="compensation-form-group">
        <span className="compensation-label-text">
          {label}
          {required && <span style={{ color: "#f44336" }}>*</span>}
        </span>
        {type === "dropdown" ? (
          <div className="compensation-input-group">
            <select
              value={formData[field] || ""}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="compensation-select"
            >
              <option value="">-- Select --</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className="compensation-checkbox-group">
              <label className="compensation-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData[field] || false}
                  onChange={() =>
                    handleCheckboxChange(field, formData[field] ? "no" : "yes")
                  }
                  className="compensation-checkbox"
                />
                <span>Yes</span>
              </label>
              <label className="compensation-checkbox-label">
                <input
                  type="checkbox"
                  checked={!formData[field] && formData[field] !== undefined}
                  onChange={() =>
                    handleCheckboxChange(field, formData[field] ? "no" : "yes")
                  }
                  className="compensation-checkbox"
                />
                <span>No</span>
              </label>
            </div>
            {formData[field] && percentageField && (!amountField || !typeField) && (
              <div className="compensation-input-group">
                <div className="percentage-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="xx.xx"
                    value={formData[percentageField] || ""}
                    onChange={(e) => handleInputChange(percentageField, e.target.value)}
                    className="compensation-percentage-input"
                    required={required}
                  />
                  <span style={{ fontWeight: 500 }}>%</span>

                  <span style={{ color: '#555', fontSize: '0.92rem' }}>
                    {(() => {
                      const eff = getEffectiveCtcPercentage(percentageField, formData);
                      if (eff < 0.1) return null;
                      return `≈ ${eff.toFixed(1)}% of CTC`;
                    })()}
                  </span>

                  <span style={{
                    color: '#777',
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    marginLeft: '8px'
                  }}>
                    {getBaseLabel(percentageField, formData)}
                  </span>

                  <span
                    className="remaining-note"
                    style={{
                      marginLeft: 'auto',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontWeight: effectiveExceeds > 0 ? 'bold' : 'normal',
                      color:
                        effectiveExceeds > 0.3 ? '#d32f2f' :
                        effectiveRemaining > 5 ? '#f57c00' :
                        effectiveRemaining > 0.01 ? '#1976d2' :
                        '#388e3c',
                      backgroundColor:
                        effectiveExceeds > 0.3 ? '#ffebee' :
                        effectiveRemaining > 5 ? '#fff3e0' :
                        effectiveRemaining > 0.01 ? '#e3f2fd' :
                        '#e8f5e9',
                    }}
                  >
                    {effectiveExceeds > 0.3
                      ? `Exceeds by ${effectiveExceeds.toFixed(2)}% — Reduce some values`
                      : effectiveRemaining > 0.01
                        ? `Remaining: ${effectiveRemaining.toFixed(2)}%`
                        : "100% allocated ✓"}
                  </span>
                </div>
              </div>
            )}
            {formData[field] && percentageField && amountField && typeField && (
              <div className="compensation-input-group">
                <select
                  value={formData[typeField] || "percentage"}
                  onChange={(e) => handleInputChange(typeField, e.target.value)}
                  className="compensation-select"
                >
                  <option value="percentage">Percentage</option>
                  <option value="amount">Fixed Amount</option>
                </select>
                {formData[typeField] === "percentage" ? (
  <div className="percentage-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
    <input
      type="number"
      step="0.01"
      placeholder="xx.xx"
      value={formData[percentageField] || ""}
      onChange={(e) => handleInputChange(percentageField, e.target.value)}
      className="compensation-percentage-input"
      required={required}
    />
    <span style={{ fontWeight: 500 }}>%</span>

    {/* Effective % of CTC */}
    <span style={{ color: '#555', fontSize: '0.92rem' }}>
      {(() => {
        const eff = getEffectiveCtcPercentage(percentageField, formData);
        if (eff < 0.1) return null;
        return `≈ ${eff.toFixed(1)}% of CTC`;
      })()}
    </span>
{/* ────────────── ADD THIS NEW PART ────────────── */}
    <span style={{
      color: '#777',
      fontSize: '0.85rem',
      fontStyle: 'italic',
      marginLeft: '8px'
    }}>
      {getBaseLabel(percentageField, formData)}
    </span>

    {/* Real-time remaining / exceeds warning – show on every field for visibility */}
    <span
      className="remaining-note"
      style={{
        marginLeft: 'auto',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.9rem',
        fontWeight: effectiveExceeds > 0 ? 'bold' : 'normal',
        color:
          effectiveExceeds > 0.3 ? '#d32f2f' :          // red for exceeds
          effectiveRemaining > 5 ? '#f57c00' :         // orange for large remaining
          effectiveRemaining > 0.01 ? '#1976d2' :       // blue for small remaining (but not zero)
          '#388e3c',                                                  // green for perfect (0 or near 0)
        backgroundColor:
          effectiveExceeds > 0.3 ? '#ffebee' :
          effectiveRemaining > 5 ? '#fff3e0' :
          effectiveRemaining > 0.01 ? '#e3f2fd' :
          '#e8f5e9',
      }}
    >
      {effectiveExceeds > 0.3
        ? `Exceeds by ${effectiveExceeds.toFixed(2)}% — Reduce some values`
        : effectiveRemaining > 0.01
          ? `Remaining: ${effectiveRemaining.toFixed(2)}%`
          : "100% allocated ✓"}
    </span>

   
   
  </div>
                ) : (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <input
        type="number"
        placeholder="Annual Amount"
        value={formData[amountField] || ""}
        onChange={(e) => handleInputChange(amountField, e.target.value)}
        className="compensation-number-input"
        required={required}
      />

      {/* Accurate CTC % for fixed amount */}
      {(() => {
        const amt = parseFloat(formData[amountField]) || 0;
        if (amt <= 0) return null;

        const totalCtc = parseFloat(ctcInput) || DEFAULT_CTC;
        const annualPct = (amt / totalCtc) * 100;
        const monthlyAmt = amt / 12;

        return (
          <span style={{ color: "#555", fontSize: "0.92rem", whiteSpace: "nowrap" }}>
            ≈ {annualPct.toFixed(2)}% of CTC          </span>
        );

        <span style={{
        color: '#777',
        fontSize: '0.85rem',
        fontStyle: 'italic',
        marginLeft: '12px'
      }}>
        {getBaseLabel(amountField, formData)}
      </span>
      })()}
    </div>

    {/* Remaining/exceeds note */}
    {allowancePercentageFields.some((f) => f.field === percentageField) && (
      <span
        className="remaining-note"
        style={{
          color:
            effectiveExceeds > 0.3 ? "red" :
            effectiveRemaining > 1 ? "orange" :
            "green",
        }}
      >
        {effectiveExceeds > 0.3
          ? `Exceeds by ${effectiveExceeds.toFixed(2)}%`
          : effectiveRemaining > 0.01
            ? `${effectiveRemaining.toFixed(2)}% remaining`
            : "100% allocated"}
      </span>
    )}
  </div>
)}
                {includeCtcField && (
                  <div style={{ marginTop: "10px" }}>
                    <label className="compensation-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData[includeCtcField] || false}
                        onChange={(e) =>
                          handleInputChange(includeCtcField, e.target.checked)
                        }
                        className="compensation-checkbox"
                      />
                      <span>Include in CTC?</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const performSave = async () => {
    if (!orgId) {
      showAlert("Organization ID missing. Please login again.");
      return;
    }

    if (!meId) {
      showAlert("Please login to continue");
      return;
    }

    const payload = {
      compensationPlanName: formData.compensationPlanName,
      formData: { ...formData },
      org_id: orgId,
    };

    try {
      let response;
      if (isEditing && editingCompensationId) {
        response = await axios.put(
          `${BACKEND_URL}/api/compensations/update/${editingCompensationId}`,
          payload,
          { withCredentials: true, headers: getHeaders() }
        );
        showAlert("Compensation updated successfully!");
      } else {
        response = await axios.post(
          `${BACKEND_URL}/api/compensations/add`,
          payload,
          { withCredentials: true, headers: getHeaders() }
        );
        showAlert("Compensation created successfully!");
      }

      togglePopup();
      fetchCompensations();
    } catch (error) {
      console.error("Error saving compensation plan:", error);
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      showAlert(
        `Failed to ${isEditing ? "update" : "create"} compensation: ${msg}`
      );
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({});

  // Check if salary periods exist
  if (salaryPeriods.length === 0) {
    showAlert(
      "Please add a salary calculation period first before creating a compensation plan."
    );
    setIsSalaryPeriodModalOpen(true);
    return;
  }

  // Check if plan name is provided
  if (!formData.compensationPlanName.trim()) {
    setErrors({ compensationPlanName: "Compensation Plan Name is required" });
    showAlert("Compensation Plan Name is required and cannot be empty");
    return;
  }

  // ────────────────────────────────────────────────
  // Validation using allocationInfo (no remainingPercentage)
  // ────────────────────────────────────────────────

  // Case 1: Exceeds 100%
  if (parseFloat(allocationInfo.exceeds) > 0.5) {
    setErrors({
      totalPercentage: `Total percentage exceeds 100% by ${allocationInfo.exceeds}%`,
    });
    showAlert(
      `Total percentage exceeds 100% by ${allocationInfo.exceeds}%. Please reduce some component values.`
    );
    return;
  }

  // Case 2: Still remaining (not fully allocated)
  if (parseFloat(allocationInfo.remaining) > 1.0) {
    const currentAllocated = (100 - parseFloat(allocationInfo.remaining)).toFixed(2);
    setErrors({
      totalPercentage: `Total allocated is ${currentAllocated}%. Still ${allocationInfo.remaining}% remaining.`,
    });
    showAlert(
      `Total allocated is ${currentAllocated}%. Still ${allocationInfo.remaining}% remaining. Please allocate the remaining percentage (e.g. in Other Allowance).`
    );
    return;
  }

  // If we reach here → allocation is valid (±0.5% tolerance)

  // Proceed with save / update
  if (!isEditing) {
    showConfirm(
      "Do you want to save this compensation plan?",
      "Confirm Save",
      async () => {
        try {
          await performSave();
          closeConfirm();
        } catch (error) {
          closeConfirm();
        }
      }
    );
  } else {
    await performSave();
  }
};
  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const showConfirm = (
    message,
    title = "Confirm",
    onConfirm,
    onCancel = () => {}
  ) => {
    setConfirmModal({
      isVisible: true,
      title,
      message,
      onConfirm,
      onCancel,
    });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  const closeConfirm = () => {
    if (confirmModal.onCancel) {
      confirmModal.onCancel();
    }
    setConfirmModal({
      isVisible: false,
      title: "",
      message: "",
      onConfirm: null,
      onCancel: null,
    });
  };

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
    setIsEditing(false);
    setEditingCompensationId(null);
    setCurrentStep(1);
    setFormData(defaultFormData);
    setErrors({});
    setIsOtherAllowanceAutoFilled(false);
    setIsOtherAllowanceManuallyEdited(false);
  };

  const handleCheckboxChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value === "yes" };
      const updatedErrors = { ...errors };
      if (value !== "yes") {
        if (field === "isBasicSalary") {
          newData.basicSalary = "";
          newData.basicSalaryAmount = "";
          newData.basicSalaryType = "percentage";
          updatedErrors.basicSalary = "";
        }
        if (field === "isHouseRentAllowance") {
          newData.houseRentAllowance = "";
          newData.houseRentAllowanceAmount = "";
          newData.houseRentAllowanceType = "percentage";
          updatedErrors.houseRentAllowance = "";
        }
        if (field === "isLtaAllowance") {
          newData.ltaAllowance = "";
          newData.ltaAllowanceAmount = "";
          newData.ltaAllowanceType = "percentage";
          updatedErrors.ltaAllowance = "";
        }
        if (field === "isOtherAllowance") {
          newData.otherAllowance = "";
          newData.otherAllowanceAmount = "";
          newData.otherAllowanceType = "percentage";
          updatedErrors.otherAllowance = "";
          setIsOtherAllowanceManuallyEdited(false);
        }
        if (field === "isPFEmployee") {
          newData.pfEmployeePercentage = "";
          newData.pfEmployeeAmount = "";
          newData.pfEmployeeType = "percentage";
          newData.pfEmployeeIncludeInCtc = false;
          updatedErrors.pfEmployeePercentage = "";
        }
        if (field === "isPFEmployer") {
          newData.pfEmployerPercentage = "";
          newData.pfEmployerAmount = "";
          newData.pfEmployerType = "percentage";
          newData.pfEmployerIncludeInCtc = false;
          updatedErrors.pfEmployerPercentage = "";
        }
        if (field === "isESICEmployee") {
          newData.esicEmployeePercentage = "";
          newData.esicEmployeeAmount = "";
          newData.esicEmployeeType = "percentage";
          newData.esicEmployeeIncludeInCtc = false;
          updatedErrors.esicEmployeePercentage = "";
        }
        if (field === "isInsuranceEmployee") {
          newData.insuranceEmployeePercentage = "";
          newData.insuranceEmployeeAmount = "";
          newData.insuranceEmployeeType = "percentage";
          newData.insuranceEmployeeIncludeInCtc = false;
          updatedErrors.insuranceEmployeePercentage = "";
        }
        if (field === "isGratuityApplicable") {
          newData.gratuityPercentage = "";
          newData.gratuityAmount = "";
          newData.gratuityType = "percentage";
          newData.gratuityIncludeInCtc = false;
          updatedErrors.gratuityPercentage = "";
        }
        if (field === "isProfessionalTax") {
          newData.professionalTax = "";
          newData.professionalTaxAmount = "";
          newData.professionalTaxType = "percentage";
          newData.professionalTaxIncludeInCtc = false;
          newData.professionalTaxIncludeInCtc = true;
          updatedErrors.professionalTax = "";
        }
        if (field === "isVariablePay") {
          newData.variablePay = "";
          newData.variablePayAmount = "";
          newData.variablePayType = "percentage";
          newData.variablePayIncludeInCtc = false;
          updatedErrors.variablePay = "";
        }
        if (field === "isStatutoryBonus") {
          newData.statutoryBonusPercentage = "";
          newData.statutoryBonusAmount = "";
          newData.statutoryBonusType = "percentage";
          newData.statutoryBonusIncludeInCtc = false;
          updatedErrors.statutoryBonusPercentage = "";
        }
        if (field === "isIncentives") {
          newData.incentives = "";
          newData.incentivesAmount = "";
          newData.incentivesType = "percentage";
          newData.incentivesIncludeInCtc = false;
          updatedErrors.incentives = "";
        }
      } else {
        if (field === "isBasicSalary") {
          newData.basicSalaryType = "percentage";
          newData.basicSalary = newData.basicSalary || "40";
        }
        if (field === "isHouseRentAllowance") {
          newData.houseRentAllowanceType = "percentage";
          newData.houseRentAllowance = newData.houseRentAllowance || "20";
        }
        if (field === "isLtaAllowance") {
          newData.ltaAllowanceType = "percentage";
          newData.ltaAllowance = newData.ltaAllowance || "10";
        }
        if (field === "isOtherAllowance") {
          newData.otherAllowanceType = "percentage";
          newData.otherAllowance = newData.otherAllowance || ""; // let effect fill remaining
          setIsOtherAllowanceManuallyEdited(false);
        }
        if (field === "isPFEmployee") {
          newData.pfEmployeeType = "percentage";
          newData.pfEmployeePercentage = newData.pfEmployeePercentage || "12";
          newData.pfEmployeeIncludeInCtc = true;
        }
        if (field === "isPFEmployer") {
          newData.pfEmployerType = "percentage";
          newData.pfEmployerPercentage = newData.pfEmployerPercentage || "12";
          newData.pfEmployerIncludeInCtc = true;
        }
        if (field === "isESICEmployee") {
          newData.esicEmployeeType = "percentage";
          newData.esicEmployeePercentage =
            newData.esicEmployeePercentage || "0.75";
          newData.esicEmployeeIncludeInCtc = true;
        }
        if (field === "isInsuranceEmployee") {
          newData.insuranceEmployeeType = "percentage";
          newData.insuranceEmployeePercentage =
            newData.insuranceEmployeePercentage || "0";
          newData.insuranceEmployeeIncludeInCtc = true;
        }
        if (field === "isGratuityApplicable") {
          newData.gratuityType = "percentage";
          newData.gratuityPercentage = newData.gratuityPercentage || "4.81";
          newData.gratuityIncludeInCtc = true;
        }
        if (field === "isProfessionalTax") {
          newData.professionalTaxType = "amount";
          newData.professionalTaxAmount =
            newData.professionalTaxAmount || "200";
          newData.professionalTaxIncludeInCtc = true;
        }
        if (field === "isVariablePay") {
          newData.variablePayType = "percentage";
          newData.variablePay = newData.variablePay || "0";
          newData.variablePayIncludeInCtc = true;
        }
        if (field === "isStatutoryBonus") {
          newData.statutoryBonusType = "percentage";
          newData.statutoryBonusPercentage =
            newData.statutoryBonusPercentage || "0";
          newData.statutoryBonusIncludeInCtc = true;
        }
        if (field === "isIncentives") {
          newData.incentivesType = "percentage";
          newData.incentives = newData.incentives || "0";
          newData.incentivesIncludeInCtc = true;
        }
      }
      setErrors(updatedErrors);
      return newData;
    });
  };

  const handleInputChange = (field, value) => {
    // track manual edit on other allowance
    if (field === "otherAllowance") {
      if (value !== "") {
        setIsOtherAllowanceManuallyEdited(true);
      } else {
        setIsOtherAllowanceManuallyEdited(false);
      }
      setIsOtherAllowanceAutoFilled(false);
    }
    const newFormData = { ...formData, [field]: value };
    const totalCTC = ctcInput ? parseFloat(ctcInput) : DEFAULT_CTC;

    if (field.endsWith("Type")) {
      const baseField = field.replace("Type", "");
      const percentageField = baseField;
      const amountField = `${baseField}Amount`;
      if (value === "percentage") {
        newFormData[percentageField] = newFormData[percentageField] || "0";
        newFormData[amountField] = "";
      } else if (value === "amount") {
        newFormData[amountField] = newFormData[amountField] || "0";
        newFormData[percentageField] = "";
      }
    }

    allowancePercentageFields.forEach(
      ({ field: percentageField, amountField, typeField }) => {
        if (
          field === amountField &&
          newFormData[typeField] === "amount" &&
          value
        ) {
          const percentage = convertAmountToPercentage(value, totalCTC);
          newFormData[percentageField] = percentage.toFixed(2);
        }
      }
    );
    setFormData(newFormData);

    const fieldConfig = categories
      .flatMap((category) => category.fields)
      .find((f) => f.percentageField === field || f.amountField === field);
    if (
      fieldConfig &&
      fieldConfig.validation &&
      field === fieldConfig.percentageField
    ) {
      const error = validateField(field, value, fieldConfig, newFormData);
      setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
    }
  };

  const handleSlabChange = (index, slabField, value) => {
    setFormData((prev) => {
      const newSlabs = [...prev.tdsSlabs];
      newSlabs[index][slabField] = value;
      return { ...prev, tdsSlabs: newSlabs };
    });
  };

  const handleAddSlab = () => {
    if (formData.tdsSlabs.length < 4) {
      setFormData((prev) => ({
        ...prev,
        tdsSlabs: [...prev.tdsSlabs, { from: "", to: "", percentage: "" }],
      }));
    }
  };

  const handleRemoveSlab = (index) => {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= formData.tdsSlabs.length
    ) {
      console.warn(`Invalid index ${index} for removing TDS slab`);
      showAlert("Cannot remove slab: Invalid index");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tdsSlabs: Array.isArray(prev.tdsSlabs)
        ? prev.tdsSlabs.filter((_, i) => i !== index)
        : [],
    }));
  };

  const handleWorkingDayChange = (day, value) => {
    setFormData((prev) => ({
      ...prev,
      defaultWorkingDays: {
        ...prev.defaultWorkingDays,
        [day]: value,
      },
    }));
  };

  const fetchCompensations = async () => {
    if (!BACKEND_URL || !meId || !orgId) {
      showAlert("Please login to continue");
      setCompensations([]);
      return;
    }

    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/compensations/list?org_id=${orgId}`,
        { withCredentials: true, headers: getHeaders(), withCredentials: true }
      );

      if (response.data.success) {
        const plans = response.data.data || [];

        setCompensations(plans);
      } else {
        setCompensations([]);
        showAlert("No compensations found for this organization");
      }
    } catch (error) {
      console.error("Compensations fetch error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Unknown error";
      if (error.response?.status === 401) {
        showAlert("Unauthorized—please log in again");
      } else {
        showAlert(`Failed to load compensations: ${errorMessage}`);
      }
      setCompensations([]);
    }
  };

  const fetchSalaryPeriods = async () => {
    try {
      const headers = getHeaders();

      const response = await axios.get(
        `${BACKEND_URL}/api/salaryCalculationperiods`,
        {
          headers,
          withCredentials: true,
        }
      );

      setSalaryPeriods(response.data?.data || []);
    } catch (error) {
      console.error("[Salary Periods Error]", {
        status: error.response?.status,
        data: error.response?.data,
        headers_sent: getHeaders(),
      });
      showAlert("Failed to load salary periods.");
      setSalaryPeriods([]);
    }
  };

  useEffect(() => {
    if (meId) {
      fetchCompensations();
      fetchSalaryPeriods();
    }
  }, [meId]);

  const handleEdit = (compensation) => {
    setIsEditing(true);
    setEditingCompensationId(compensation.id);
    setFormData({
      compensationPlanName: compensation.compensation_plan_name || "",
      isPFApplicable: compensation.plan_data?.isPFApplicable || false,
      pfPercentage: compensation.plan_data?.pfPercentage || "",
      pfAmount: compensation.plan_data?.pfAmount || "",
      pfType: compensation.plan_data?.pfType || "percentage",
      isPFEmployer: compensation.plan_data?.isPFEmployer || false,
      pfEmployerPercentage: compensation.plan_data?.pfEmployerPercentage || "",
      pfEmployerAmount: compensation.plan_data?.pfEmployerAmount || "",
      pfEmployerType: compensation.plan_data?.pfEmployerType || "percentage",
      pfEmployerIncludeInCtc:
        compensation.plan_data?.pfEmployerIncludeInCtc || false,
      isPFEmployee: compensation.plan_data?.isPFEmployee || false,
      pfEmployeePercentage: compensation.plan_data?.pfEmployeePercentage || "",
      pfCalculationBase: compensation.plan_data?.pfCalculationBase || "",
      pfEmployeeAmount: compensation.plan_data?.pfEmployeeAmount || "",
      pfEmployeeType: compensation.plan_data?.pfEmployeeType || "percentage",
      pfEmployeeIncludeInCtc:
        compensation.plan_data?.pfEmployeeIncludeInCtc || false,
      isMedicalApplicable: compensation.plan_data?.isMedicalApplicable || false,
      medicalCalculationBase:
        compensation.plan_data?.medicalCalculationBase || "",
      isESICEmployee: compensation.plan_data?.isESICEmployee || false,
      esicEmployeePercentage:
        compensation.plan_data?.esicEmployeePercentage || "",
      esicEmployeeAmount: compensation.plan_data?.esicEmployeeAmount || "",
      esicEmployeeType:
        compensation.plan_data?.esicEmployeeType || "percentage",
      esicEmployeeIncludeInCtc:
        compensation.plan_data?.esicEmployeeIncludeInCtc || false,
      isInsuranceEmployee: compensation.plan_data?.isInsuranceEmployee || false,
      insuranceEmployeePercentage:
        compensation.plan_data?.insuranceEmployeePercentage || "",
      insuranceEmployeeAmount:
        compensation.plan_data?.insuranceEmployeeAmount || "",
      insuranceEmployeeType:
        compensation.plan_data?.insuranceEmployeeType || "percentage",
      insuranceEmployeeIncludeInCtc:
        compensation.plan_data?.insuranceEmployeeIncludeInCtc || false,
      isGratuityApplicable:
        compensation.plan_data?.isGratuityApplicable || false,
      gratuityPercentage: compensation.plan_data?.gratuityPercentage || "",
      gratuityAmount: compensation.plan_data?.gratuityAmount || "",
      gratuityType: compensation.plan_data?.gratuityType || "percentage",
      gratuityIncludeInCtc:
        compensation.plan_data?.gratuityIncludeInCtc || false,
      isProfessionalTax: compensation.plan_data?.isProfessionalTax || false,
      professionalTax: compensation.plan_data?.professionalTax || "",
      professionalTaxAmount:
        compensation.plan_data?.professionalTaxAmount || "",
      professionalTaxType:
        compensation.plan_data?.professionalTaxType || "percentage",
      professionalTaxIncludeInCtc:
        compensation.plan_data?.professionalTaxIncludeInCtc || false,
      isVariablePay: compensation.plan_data?.isVariablePay || false,
      variablePay: compensation.plan_data?.variablePay || "",
      variablePayAmount: compensation.plan_data?.variablePayAmount || "",
      variablePayType: compensation.plan_data?.variablePayType || "percentage",
      variablePayIncludeInCtc:
        compensation.plan_data?.variablePayIncludeInCtc || false,
      isStatutoryBonus: compensation.plan_data?.isStatutoryBonus || false,
      statutoryBonusPercentage:
        compensation.plan_data?.statutoryBonusPercentage || "",
      statutoryBonusAmount: compensation.plan_data?.statutoryBonusAmount || "",
      statutoryBonusType:
        compensation.plan_data?.statutoryBonusType || "percentage",
      statutoryBonusIncludeInCtc:
        compensation.plan_data?.statutoryBonusIncludeInCtc || false,
      isBasicSalary: compensation.plan_data?.isBasicSalary || false,
      basicSalary: compensation.plan_data?.basicSalary || "",
      basicSalaryAmount: compensation.plan_data?.basicSalaryAmount || "",
      basicSalaryType: compensation.plan_data?.basicSalaryType || "amount",
      isHouseRentAllowance:
        compensation.plan_data?.isHouseRentAllowance || false,
      houseRentAllowance: compensation.plan_data?.houseRentAllowance || "",
      houseRentAllowanceAmount:
        compensation.plan_data?.houseRentAllowanceAmount || "",
      houseRentAllowanceType:
        compensation.plan_data?.houseRentAllowanceType || "amount",
      isLtaAllowance: compensation.plan_data?.isLtaAllowance || false,
      ltaAllowance: compensation.plan_data?.ltaAllowance || "",
      ltaAllowanceAmount: compensation.plan_data?.ltaAllowanceAmount || "",
      ltaAllowanceType: compensation.plan_data?.ltaAllowanceType || "amount",
      isOtherAllowance: compensation.plan_data?.isOtherAllowance || false,
      otherAllowance: compensation.plan_data?.otherAllowance || "",
      otherAllowanceAmount: compensation.plan_data?.otherAllowanceAmount || "",
      otherAllowanceType:
        compensation.plan_data?.otherAllowanceType || "amount",
      isStatutoryBonusAmount:
        compensation.plan_data?.isStatutoryBonusAmount || false,
      statutoryBonus: compensation.plan_data?.statutoryBonus || "",
      statutoryBonusFixedAmount:
        compensation.plan_data?.statutoryBonusFixedAmount || "",
      statutoryBonusFixedType:
        compensation.plan_data?.statutoryBonusFixedType || "amount",
      isVariablePayAmount: compensation.plan_data?.isVariablePayAmount || false,
      variablePayAmount: compensation.plan_data?.variablePayAmount || "",
      variablePayFixedAmount:
        compensation.plan_data?.variablePayFixedAmount || "",
      variablePayFixedType:
        compensation.plan_data?.variablePayFixedType || "amount",
      isOvertimePay: compensation.plan_data?.isOvertimePay || false,
      overtimePayType: compensation.plan_data?.overtimePayType || "hourly",
      overtimePayAmount: compensation.plan_data?.overtimePayAmount || "",
      overtimePayUnits: compensation.plan_data?.overtimePayUnits || "",
      isIncentives: compensation.plan_data?.isIncentives || false,
      incentives: compensation.plan_data?.incentives || "",
      incentivesAmount: compensation.plan_data?.incentivesAmount || "",
      incentivesType: compensation.plan_data?.incentivesType || "amount",
      isDefaultWorkingHours:
        compensation.plan_data?.isDefaultWorkingHours || false,
      defaultWorkingHours: compensation.plan_data?.defaultWorkingHours || "",
      isDefaultWorkingDays:
        compensation.plan_data?.isDefaultWorkingDays || false,
      defaultWorkingDays:
        compensation.plan_data?.defaultWorkingDays ||
        defaultFormData.defaultWorkingDays,
      isTDSApplicable: compensation.plan_data?.isTDSApplicable || false,
      tdsSlabs:
        compensation.plan_data?.tdsSlabs ||
        (compensation.plan_data?.tdsFrom
          ? [
              {
                from: compensation.plan_data.tdsFrom,
                to: compensation.plan_data.tdsTo,
                percentage: compensation.plan_data.tdsPercentage,
              },
            ]
          : []),
    });
    setIsPopupOpen(true);
    setCurrentStep(1);
    setErrors({});
    setIsOtherAllowanceAutoFilled(false);
    setIsOtherAllowanceManuallyEdited(false);
  };

  const validateField = (name, value, fieldConfig, formData) => {
    const { validation } = fieldConfig;
    if (!validation) return "";
    if (validation.appliesWhen) {
      if (
        !formData[validation.appliesWhen.field] ||
        formData[validation.appliesWhen.field] !== validation.appliesWhen.value
      ) {
        return "";
      }
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return "Please enter a valid number.";
    }
    if (numValue < validation.min || numValue > validation.max) {
      return validation.message;
    }
    return "";
  };

  const handleViewPopup = async (planData, planId) => {
    if (planData && typeof planData === "object" && !Array.isArray(planData)) {
      try {
        let defaultWorkingDays = defaultFormData.defaultWorkingDays;
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (backendUrl && meId) {
          try {
            const workingDaysResponse = await axios.get(
              `${backendUrl}/api/compensations/working-days/${planId}`,
              { withCredentials: true, headers }
            );
            if (
              workingDaysResponse.data.success &&
              workingDaysResponse.data.data.length > 0
            ) {
              const workingDays = workingDaysResponse.data.data[0];
              defaultWorkingDays = {
                Sunday: workingDays.sunday,
                Monday: workingDays.monday,
                Tuesday: workingDays.tuesday,
                Wednesday: workingDays.wednesday,
                Thursday: workingDays.thursday,
                Friday: workingDays.friday,
                Saturday: workingDays.saturday,
              };
            } else {
              console.warn(
                `No working days found for plan ID ${planId}, using defaults`
              );
            }
          } catch (error) {
            console.warn(
              `Failed to fetch working days for plan ID ${planId}:`,
              error.response?.data?.error || error.message
            );
          }
        }
        const mappedData = {
          compensationPlanName: planData.compensation_plan_name || "",
          isPFApplicable:
            planData.is_pf_applicable || planData.isPFApplicable || false,
          pfPercentage: planData.pf_percentage || planData.pfPercentage || "",
          pfAmount: planData.pf_amount || planData.pfAmount || "",
          pfType: planData.pf_type || planData.pfType || "percentage",
          isPFEmployer:
            planData.is_pf_employer || planData.isPFEmployer || false,
          pfEmployerPercentage:
            planData.pf_employer_percentage ||
            planData.pfEmployerPercentage ||
            "",
          pfEmployerAmount:
            planData.pf_employer_amount || planData.pfEmployerAmount || "",
          pfEmployerType:
            planData.pf_employer_type ||
            planData.pfEmployerType ||
            "percentage",
          pfEmployerIncludeInCtc: planData.pfEmployerIncludeInCtc || false,
          isPFEmployee:
            planData.is_pf_employee || planData.isPFEmployee || false,
          pfEmployeePercentage:
            planData.pf_employee_percentage ||
            planData.pfEmployeePercentage ||
            "",
          pfCalculationBase:
            planData.pf_calculation_base ||
            planData.pfCalculationBase ||
            "basicSalary",
          pfEmployeeAmount:
            planData.pf_employee_amount || planData.pfEmployeeAmount || "",
          pfEmployeeType:
            planData.pf_employee_type ||
            planData.pfEmployeeType ||
            "percentage",
          pfEmployeeIncludeInCtc: planData.pfEmployeeIncludeInCtc || false,
          isMedicalApplicable:
            planData.is_medical_applicable ||
            planData.isMedicalApplicable ||
            false,
          medicalCalculationBase:
            planData.medical_calculation_base ||
            planData.medicalCalculationBase ||
            "basicSalary",
          isESICEmployee:
            planData.is_esic_employee || planData.isESICEmployee || false,
          esicEmployeePercentage:
            planData.esic_employee_percentage ||
            planData.esicEmployeePercentage ||
            "",
          esicEmployeeAmount:
            planData.esic_employee_amount || planData.esicEmployeeAmount || "",
          esicEmployeeType:
            planData.esic_employee_type ||
            planData.esicEmployeeType ||
            "percentage",
          esicEmployeeIncludeInCtc: planData.esicEmployeeIncludeInCtc || false,
          isInsuranceEmployee:
            planData.is_insurance_employee ||
            planData.isInsuranceEmployee ||
            false,
          insuranceEmployeePercentage:
            planData.insurance_employee_percentage ||
            planData.insuranceEmployeePercentage ||
            "",
          insuranceEmployeeAmount:
            planData.insurance_employee_amount ||
            planData.insuranceEmployeeAmount ||
            "",
          insuranceEmployeeType:
            planData.insurance_employee_type ||
            planData.insuranceEmployeeType ||
            "percentage",
          insuranceEmployeeIncludeInCtc:
            planData.insuranceEmployeeIncludeInCtc || false,
          isGratuityApplicable:
            planData.is_gratuity_applicable ||
            planData.isGratuityApplicable ||
            false,
          gratuityPercentage:
            planData.gratuity_percentage || planData.gratuityPercentage || "",
          gratuityAmount:
            planData.gratuity_amount || planData.gratuityAmount || "",
          gratuityType:
            planData.gratuity_type || planData.gratuityType || "percentage",
          gratuityIncludeInCtc: planData.gratuityIncludeInCtc || false,
          isProfessionalTax:
            planData.is_professional_tax || planData.isProfessionalTax || false,
          professionalTax:
            planData.professional_tax || planData.professionalTax || "",
          professionalTaxAmount:
            planData.professional_tax_amount ||
            planData.professionalTaxAmount ||
            "",
          professionalTaxType:
            planData.professional_tax_type ||
            planData.professionalTaxType ||
            "percentage",
          professionalTaxIncludeInCtc:
            planData.professionalTaxIncludeInCtc || false,
          isVariablePay:
            planData.is_variable_pay || planData.isVariablePay || false,
          variablePay: planData.variable_pay || planData.variablePay || "",
          variablePayAmount:
            planData.variable_pay_amount || planData.variablePayAmount || "",
          variablePayType:
            planData.variable_pay_type ||
            planData.variablePayType ||
            "percentage",
          variablePayIncludeInCtc: planData.variablePayIncludeInCtc || false,
          isStatutoryBonus:
            planData.is_statutory_bonus || planData.isStatutoryBonus || false,
          statutoryBonusPercentage:
            planData.statutory_bonus_percentage ||
            planData.statutoryBonusPercentage ||
            "",
          statutoryBonusAmount:
            planData.statutory_bonus_amount ||
            planData.statutoryBonusAmount ||
            "",
          statutoryBonusType:
            planData.statutory_bonus_type ||
            planData.statutoryBonusType ||
            "percentage",
          statutoryBonusIncludeInCtc:
            planData.statutoryBonusIncludeInCtc || false,
          isBasicSalary:
            planData.is_basic_salary || planData.isBasicSalary || false,
          basicSalary: planData.basic_salary || planData.basicSalary || "",
          basicSalaryAmount:
            planData.basic_salary_amount || planData.basicSalaryAmount || "",
          basicSalaryType:
            planData.basic_salary_type || planData.basicSalaryType || "amount",
          isHouseRentAllowance:
            planData.is_house_rent_allowance ||
            planData.isHouseRentAllowance ||
            false,
          houseRentAllowance:
            planData.house_rent_allowance || planData.houseRentAllowance || "",
          houseRentAllowanceAmount:
            planData.house_rent_allowance_amount ||
            planData.houseRentAllowanceAmount ||
            "",
          houseRentAllowanceType:
            planData.house_rent_allowance_type ||
            planData.houseRentAllowanceType ||
            "amount",
          isLtaAllowance:
            planData.is_lta_allowance || planData.isLtaAllowance || false,
          ltaAllowance: planData.lta_allowance || planData.ltaAllowance || "",
          ltaAllowanceAmount:
            planData.lta_allowance_amount || planData.ltaAllowanceAmount || "",
          ltaAllowanceType:
            planData.lta_allowance_type ||
            planData.ltaAllowanceType ||
            "amount",
          isOtherAllowance:
            planData.is_other_allowance || planData.isOtherAllowance || false,
          otherAllowance:
            planData.other_allowance || planData.otherAllowance || "",
          otherAllowanceAmount:
            planData.other_allowance_amount ||
            planData.otherAllowanceAmount ||
            "",
          otherAllowanceType:
            planData.other_allowance_type ||
            planData.otherAllowanceType ||
            "amount",
          isStatutoryBonusAmount:
            planData.is_statutory_bonus_amount ||
            planData.isStatutoryBonusAmount ||
            false,
          statutoryBonus:
            planData.statutory_bonus || planData.statutoryBonus || "",
          statutoryBonusFixedAmount:
            planData.statutory_bonus_fixed_amount ||
            planData.statutoryBonusFixedAmount ||
            "",
          statutoryBonusFixedType:
            planData.statutory_bonus_fixed_type ||
            planData.statutoryBonusFixedType ||
            "amount",
          isVariablePayAmount:
            planData.is_variable_pay_amount ||
            planData.isVariablePayAmount ||
            false,
          variablePayAmount:
            planData.variable_pay_amount || planData.variablePayAmount || "",
          variablePayFixedAmount:
            planData.variable_pay_fixed_amount ||
            planData.variablePayFixedAmount ||
            "",
          variablePayFixedType:
            planData.variable_pay_fixed_type ||
            planData.variablePayFixedType ||
            "amount",
          isOvertimePay:
            planData.is_overtime_pay || planData.isOvertimePay || false,
          overtimePayType:
            planData.overtime_pay_type || planData.overtimePayType || "hourly",
          overtimePayAmount:
            planData.overtime_pay_amount || planData.overtimePayAmount || "",
          overtimePayUnits:
            planData.overtime_pay_units || planData.overtimePayUnits || "",
          isIncentives:
            planData.is_incentives || planData.isIncentives || false,
          incentives: planData.incentives || "",
          incentivesAmount: planData.incentivesAmount || "",
          incentivesType:
            planData.incentives_type || planData.incentivesType || "amount",
          isDefaultWorkingHours:
            planData.is_default_working_hours ||
            planData.isDefaultWorkingHours ||
            false,
          defaultWorkingHours:
            planData.default_working_hours ||
            planData.defaultWorkingHours ||
            "",
          isDefaultWorkingDays:
            planData.is_default_working_days ||
            planData.isDefaultWorkingDays ||
            false,
          defaultWorkingDays: defaultWorkingDays,
          isTDSApplicable:
            planData.is_tds_applicable || planData.isTDSApplicable || false,
          tdsSlabs:
            planData.tds_slabs ||
            planData.tdsSlabs ||
            (planData.tds_from || planData.tdsFrom
              ? [
                  {
                    from: planData.tds_from || planData.tdsFrom,
                    to: planData.tds_to || planData.tdsTo,
                    percentage:
                      planData.tds_percentage || planData.tdsPercentage,
                  },
                ]
              : []),
        };
        // remove stale percentage/amount values for any field that has a corresponding type
        Object.keys(mappedData).forEach((k) => {
          if (k.endsWith("Type")) {
            const base = k.replace(/Type$/, "");
            const typeVal = mappedData[k];
            if (typeVal === "amount") {
              const percKey = `${base}Percentage`;
              if (mappedData.hasOwnProperty(percKey)) mappedData[percKey] = "";
            } else if (typeVal === "percentage") {
              const amtKey = `${base}Amount`;
              if (mappedData.hasOwnProperty(amtKey)) mappedData[amtKey] = "";
            }
          }
        });
        setViewExecCompensation(mappedData);
      } catch (error) {
        console.error("Error processing compensation details:", error);
        showAlert(
          "Failed to display compensation details: Invalid data format"
        );
      }
    } else {
      showAlert("Failed to display compensation details: Invalid data format");
    }
  };

  const handlePreview = () => {
    setPreviewModal(true);
    setCtcInput("");
    setSalaryDetails(null);
  };

  const closePreview = () => {
    setPreviewModal(false);
    setCtcInput("");
    setSalaryDetails(null);
  };

  const isDefaultValue = (key, value) => {
    const defaultValue = defaultFormData[key];
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value) === JSON.stringify(defaultValue);
    }
    return value === defaultValue;
  };

  const shouldDisplayField = (key, value, formData) => {
    const excludedFields = [
      "pfEmployeeText",
      "pfEmployerText",
      "esicEmployeeText",
      "insuranceEmployeeText",
      "recordBonusPay",
      "recordBonusPayYearly",
      "bonusPay",
    ];
    if (excludedFields.includes(key)) {
      return false;
    }
    if (isDefaultValue(key, value)) {
      return false;
    }
    const fieldEnableMap = {
      overtimePayAmount: "isOvertimePay",
      overtimePayUnits: "isOvertimePay",
      isDefaultWorkingDays: true,
      defaultWorkingDays: "isDefaultWorkingDays",
      basicSalary: "isBasicSalary",
      basicSalaryAmount: "isBasicSalary",
      houseRentAllowance: "isHouseRentAllowance",
      houseRentAllowanceAmount: "isHouseRentAllowance",
      ltaAllowance: "isLtaAllowance",
      ltaAllowanceAmount: "isLtaAllowance",
      otherAllowance: "isOtherAllowance",
      otherAllowanceAmount: "isOtherAllowance",
      variablePay: "isVariablePay",
      variablePayAmount: "isVariablePay",
      statutoryBonusPercentage: "isStatutoryBonus",
      statutoryBonusAmount: "isStatutoryBonus",
      incentives: "isIncentives",
      incentivesAmount: "isIncentives",
      professionalTax: "isProfessionalTax",
      professionalTaxAmount: "isProfessionalTax",
      pfEmployeePercentage: "isPFEmployee",
      pfEmployeeAmount: "isPFEmployee",
      pfEmployerPercentage: "isPFEmployer",
      pfEmployerAmount: "isPFEmployer",
      esicEmployeePercentage: "isESICEmployee",
      esicEmployeeAmount: "isESICEmployee",
      insuranceEmployeePercentage: "isInsuranceEmployee",
      insuranceEmployeeAmount: "isInsuranceEmployee",
      gratuityPercentage: "isGratuityApplicable",
      gratuityAmount: "isGratuityApplicable",
      basicSalary: "isBasicSalary",
      hra: "isHouseRentAllowance",
      ltaAllowance: "isLtaAllowance",
      otherAllowances: "isOtherAllowance",
      variablePay: "isVariablePay",
      statutoryBonus: "isStatutoryBonus",
      incentives: "isIncentives",
      professionalTax: "isProfessionalTax",
      employeePF: "isPFEmployee",
      employerPF: "isPFEmployer",
      esic: "isESICEmployee",
      insurance: "isInsuranceEmployee",
      gratuity: "isGratuityApplicable",
      overtimePay: "isOvertimePay",
      tds: "isTDSApplicable",
      grossSalary: true,
      netSalary: true,
      defaultWorkingHours: "isDefaultWorkingHours",
      tdsSlabs: "isTDSApplicable",
    };
    const enableField = fieldEnableMap[key];
    if (enableField) {
      if (enableField === true) {
        return true;
      }
      if (formData[enableField]) {
        return true;
      }
    }
    const typeDependentFields = {
      pfEmployeePercentage: {
        typeField: "pfEmployeeType",
        showWhen: "percentage",
        enableField: "isPFEmployee",
      },
      pfEmployeeAmount: {
        typeField: "pfEmployeeType",
        showWhen: "amount",
        enableField: "isPFEmployee",
      },
      pfEmployerPercentage: {
        typeField: "pfEmployerType",
        showWhen: "percentage",
        enableField: "isPFEmployer",
      },
      pfEmployerAmount: {
        typeField: "pfEmployerType",
        showWhen: "amount",
        enableField: "isPFEmployer",
      },
      esicEmployeePercentage: {
        typeField: "esicEmployeeType",
        showWhen: "percentage",
        enableField: "isESICEmployee",
      },
      esicEmployeeAmount: {
        typeField: "esicEmployeeType",
        showWhen: "amount",
        enableField: "isESICEmployee",
      },
      insuranceEmployeePercentage: {
        typeField: "insuranceEmployeeType",
        showWhen: "percentage",
        enableField: "isInsuranceEmployee",
      },
      insuranceEmployeeAmount: {
        typeField: "insuranceEmployeeType",
        showWhen: "amount",
        enableField: "isInsuranceEmployee",
      },
      gratuityPercentage: {
        typeField: "gratuityType",
        showWhen: "percentage",
        enableField: "isGratuityApplicable",
      },
      gratuityAmount: {
        typeField: "gratuityType",
        showWhen: "amount",
        enableField: "isGratuityApplicable",
      },
      professionalTax: {
        typeField: "professionalTaxType",
        showWhen: "percentage",
        enableField: "isProfessionalTax",
      },
      professionalTaxAmount: {
        typeField: "professionalTaxType",
        showWhen: "amount",
        enableField: "isProfessionalTax",
      },
      variablePay: {
        typeField: "variablePayType",
        showWhen: "percentage",
        enableField: "isVariablePay",
      },
      variablePayAmount: {
        typeField: "variablePayType",
        showWhen: "amount",
        enableField: "isVariablePay",
      },
      statutoryBonusPercentage: {
        typeField: "statutoryBonusType",
        showWhen: "percentage",
        enableField: "isStatutoryBonus",
      },
      statutoryBonusAmount: {
        typeField: "statutoryBonusType",
        showWhen: "amount",
        enableField: "isStatutoryBonus",
      },
      basicSalary: {
        typeField: "basicSalaryType",
        showWhen: "percentage",
        enableField: "isBasicSalary",
      },
      basicSalaryAmount: {
        typeField: "basicSalaryType",
        showWhen: "amount",
        enableField: "isBasicSalary",
      },
      houseRentAllowance: {
        typeField: "houseRentAllowanceType",
        showWhen: "percentage",
        enableField: "isHouseRentAllowance",
      },
      houseRentAllowanceAmount: {
        typeField: "houseRentAllowanceType",
        showWhen: "amount",
        enableField: "isHouseRentAllowance",
      },
      ltaAllowance: {
        typeField: "ltaAllowanceType",
        showWhen: "percentage",
        enableField: "isLtaAllowance",
      },
      ltaAllowanceAmount: {
        typeField: "ltaAllowanceType",
        showWhen: "amount",
        enableField: "isLtaAllowance",
      },
      otherAllowance: {
        typeField: "otherAllowanceType",
        showWhen: "percentage",
        enableField: "isOtherAllowance",
      },
      otherAllowanceAmount: {
        typeField: "otherAllowanceType",
        showWhen: "amount",
        enableField: "isOtherAllowance",
      },
      incentives: {
        typeField: "incentivesType",
        showWhen: "percentage",
        enableField: "isIncentives",
      },
      incentivesAmount: {
        typeField: "incentivesType",
        showWhen: "amount",
        enableField: "isIncentives",
      },
    };
    if (typeDependentFields[key]) {
      const { typeField, showWhen, enableField } = typeDependentFields[key];
      return (
        formData[enableField] &&
        formData[typeField] === showWhen &&
        value !== ""
      );
    }
    return false;
  };

 
const getPlanValue = (calcField, formData) => {
  const mapping = salaryFieldToFormDataMap[calcField];
  if (!mapping) return { value: "-", basis: "N/A" };

  const { enable, amount, percentage, type, default: defaultConfig } = mapping;

  if (enable && !formData[enable]) return { value: "Not Applicable", basis: "N/A" };

  const currentType = formData[type] || defaultConfig?.type || "percentage";
  const valueField = currentType === "percentage" ? percentage : amount;
  const rawValue = formData[valueField];

  if (!rawValue || rawValue === "") return { value: "-", basis: "N/A" };

  const parsed = parseFloat(rawValue);
  let display = "";
  let basisText = currentType === "amount" ? "Fixed Annual Amount" : "CTC";

  let effPct = 0;

  if (currentType === "percentage") {
    // percentage typed by user (may be based on basic salary)
    effPct = getEffectiveCtcPercentage(valueField, formData);
    display = `${parsed.toFixed(2)}% ≈ ${effPct.toFixed(4)}% of CTC`;
  } else {
    const ctc = parseFloat(ctcInput) || DEFAULT_CTC;
    effPct = (rawValue * 12 / ctc) * 100;   // convert annual amount to CTC %
    const isMonthly = [
      "basicSalaryAmount",
      "houseRentAllowanceAmount",
      "ltaAllowanceAmount",
      "otherAllowanceAmount",
      "pfEmployeeAmount",
      "pfEmployerAmount",
      "esicEmployeeAmount",
      "insuranceEmployeeAmount",
      "professionalTaxAmount",
    ].includes(valueField);
    const unit = isMonthly ? "/mo" : "/yr";
    display = `₹${rawValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${unit} ≈ ${effPct.toFixed(4)}% of CTC`;
  }

  // Basis override
  if (BASIC_BASED_FIELDS.includes(calcField.replace(/Percentage$/, ''))) {
    basisText = "Basic Salary";
  }
  if (calcField === "professionalTax") {
    basisText = currentType === "amount" ? "Fixed Annual" : "CTC";
  }
  if (calcField === "insurance") {
    basisText = currentType === "amount" ? "Fixed Annual" : "CTC";
  }

  return { value: display, basis: basisText };
};

  const handleStepChange = (step) => {
    const newStep = Math.max(1, Math.min(step, categories.length));
    setCurrentStep(newStep);
  };

const handleCalculate = () => {
  const annualCTC = parseFloat(ctcInput);

  if (!ctcInput || isNaN(annualCTC) || annualCTC <= 0) {
    showAlert("Please enter a valid CTC amount");
    return;
  }

  const planDataCopy = { ...formData };

  const calculatedDetails = calculateSalaryDetails(
    annualCTC,
    planDataCopy,
    "preview-employee",
    [],
    [],
    []
  );

  if (!calculatedDetails) {
    showAlert("Failed to calculate salary details");
    return;
  }

  // compute local gross/net according to include-in-CTC flags (see SalaryDetails)
  const { localGross, localNet } = calculateLocalGrossNet(calculatedDetails, planDataCopy);
  calculatedDetails.localGross = localGross;
  calculatedDetails.localNet = localNet;

  console.log("CTC ALLOCATION - Annual CTC:", annualCTC);
  console.log("Calculation Bases - basicSalary:", formData.basicSalary);
  console.log(`Local gross/net computed: ₹${localGross.toFixed(2)} / ₹${localNet.toFixed(2)}`);

  let totalAnnualAllocated = 0;

const componentLog = [];

Object.keys(calculatedDetails).forEach((key) => {
  // skip the additional localGross/localNet we added
  if (key === "localGross" || key === "localNet") return;

  const monthlyValue = Number(calculatedDetails[key]) || 0;

  // Skip summary fields
  if (
    key === "netSalary" ||
    key === "grossSalary" ||
    key === "tds" ||
    key === "recordBonusPay" ||
    key === "bonusPay"
  ) return;

  // exclude items that are not included in CTC
  const includeMap = {
    employeePF: 'pfEmployeeIncludeInCtc',
    employerPF: 'pfEmployerIncludeInCtc',
    esic: 'esicEmployeeIncludeInCtc',
    insurance: 'insuranceEmployeeIncludeInCtc',
    professionalTax: 'professionalTaxIncludeInCtc',
    gratuity: 'gratuityIncludeInCtc',
  };
  if (includeMap[key] && formData[includeMap[key]] === false) {
    return;
  }

  if (monthlyValue > 0) {
    const annualValue = monthlyValue * 12;
    const pctOfCtc = (annualValue / annualCTC) * 100;
    componentLog.push(`${key}: ₹${monthlyValue.toFixed(2)}/mo ≈ ₹${annualValue.toFixed(2)}/yr ≈ ${pctOfCtc.toFixed(4)}% CTC`);
    totalAnnualAllocated += annualValue;
  }
});

console.log("Component Allocations:", componentLog);

const totalPct = (totalAnnualAllocated / annualCTC) * 100;
const roundedTotal = parseFloat(totalPct.toFixed(2));
const remainingAnnual = annualCTC - totalAnnualAllocated;
const remainingPct = (remainingAnnual / annualCTC) * 100;
let remainingPercentage = parseFloat(remainingPct.toFixed(2));

console.log(`Total Allocated Annual: ₹${totalAnnualAllocated.toFixed(2)} (${roundedTotal.toFixed(2)}% of CTC)`);
console.log(`Remaining Annual: ₹${remainingAnnual.toFixed(2)} (${remainingPercentage.toFixed(2)}% of CTC)`);
console.log("=====================================\n");

  // UPDATE STATE
  // ────────────────────────────────────────────────

  setSalaryDetails({
    ...calculatedDetails,
  });
};


  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayRows = [
    daysOfWeek.slice(0, 2),
    daysOfWeek.slice(2, 4),
    daysOfWeek.slice(4, 6),
    daysOfWeek.slice(6),
  ];
  const slabOptions = Array.from({ length: 50 }, (_, i) => {
    const val = (i + 1) * 100000;
    return { value: val.toString(), label: `${i + 1} Lac` };
  });
  const categories = [
    {
      title: "Plan Details",
      fields: [
        {
          component: (
            <div className="compensation-form-group">
              <span className="compensation-label-text">
                Compensation Plan Name{" "}
                <span style={{ color: "#f44336" }}>*</span>
              </span>
              <div
                className="compensation-input-group"
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #dee2e6",
                  fontWeight: "500",
                }}
              >
                {salaryPeriods.length > 0
                  ? `Used cutoff: ${salaryPeriods[0].cutoff_date}th of the month`
                  : "No period set (add via Salary Calculation Period)"}
              </div>
              <input
                type="text"
                placeholder="Enter Plan Name"
                value={formData.compensationPlanName}
                onChange={(e) =>
                  handleInputChange("compensationPlanName", e.target.value)
                }
                className="compensation-highlighted-input"
                required
              />
            </div>
          ),
        },
        {
          component: (
            <div className="compensation-form-group">
              <span className="compensation-label-text">
                Default Working Hours (Excluding Lunch/Breaks){" "}
                <span style={{ color: "#f44336" }}>*</span>
              </span>
              <div className="compensation-checkbox-group">
                <label className="compensation-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isDefaultWorkingHours}
                    onChange={() =>
                      handleCheckboxChange("isDefaultWorkingHours", "yes")
                    }
                    className="compensation-checkbox"
                  />
                  <span>Yes</span>
                </label>
                <label className="compensation-checkbox-label">
                  <input
                    type="checkbox"
                    checked={
                      !formData.isDefaultWorkingHours &&
                      formData.isDefaultWorkingHours !== undefined
                    }
                    onChange={() =>
                      handleCheckboxChange("isDefaultWorkingHours", "no")
                    }
                    className="compensation-checkbox"
                  />
                  <span>No</span>
                </label>
              </div>
              {formData.isDefaultWorkingHours && (
                <div className="compensation-input-group">
                  <input
                    type="number"
                    placeholder="Hours"
                    value={formData.defaultWorkingHours}
                    onChange={(e) =>
                      handleInputChange("defaultWorkingHours", e.target.value)
                    }
                    className="compensation-number-input-hour"
                    required
                  />
                </div>
              )}
            </div>
          ),
        },
        {
          component: (
            <div className="compensation-form-group">
              <span className="compensation-label-text">
                Default Working Days
              </span>
              <div className="compensation-checkbox-group">
                <label className="compensation-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isDefaultWorkingDays}
                    onChange={() =>
                      handleCheckboxChange("isDefaultWorkingDays", "yes")
                    }
                    className="compensation-checkbox"
                  />
                  <span>Yes</span>
                </label>
                <label className="compensation-checkbox-label">
                  <input
                    type="checkbox"
                    checked={
                      !formData.isDefaultWorkingDays &&
                      formData.isDefaultWorkingDays !== undefined
                    }
                    onChange={() =>
                      handleCheckboxChange("isDefaultWorkingDays", "no")
                    }
                    className="compensation-checkbox"
                  />
                  <span>No</span>
                </label>
              </div>
              {formData.isDefaultWorkingDays && (
                <div className="compensation-working-days-container">
                  {dayRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="working-day-row">
                      {row.map((day) => (
                        <div key={day} className="working-day-selector">
                          <span className="working-day-label">{day}</span>
                          <select
                            value={formData.defaultWorkingDays[day]}
                            onChange={(e) =>
                              handleWorkingDayChange(day, e.target.value)
                            }
                            className="compensation-select"
                          >
                            <option value="fullDay">Full Day</option>
                            <option value="halfDay">Half Day</option>
                            <option value="weekOff">Week Off</option>
                          </select>
                        </div>
                      ))}
                      {row.length < 2 && (
                        <div className="working-day-selector-placeholder"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
        },
        {
          component: (
            <div className="compensation-form-group">
              <span className="compensation-label-text">TDS Applicable</span>
              <div className="compensation-checkbox-group">
                <label className="compensation-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isTDSApplicable}
                    onChange={() =>
                      handleCheckboxChange("isTDSApplicable", "yes")
                    }
                    className="compensation-checkbox"
                  />
                  <span>Yes</span>
                </label>
                <label className="compensation-checkbox-label">
                  <input
                    type="checkbox"
                    checked={
                      !formData.isTDSApplicable &&
                      formData.isTDSApplicable !== undefined
                    }
                    onChange={() =>
                      handleCheckboxChange("isTDSApplicable", "no")
                    }
                    className="compensation-checkbox"
                  />
                  <span>No</span>
                </label>
              </div>
              {formData.isTDSApplicable && (
                <div>
                  {formData.tdsSlabs.map((slab, index) => (
                    <div
                      key={index}
                      className="compensation-input-group"
                      style={{ marginBottom: "10px" }}
                    >
                      <select
                        value={slab.from}
                        onChange={(e) =>
                          handleSlabChange(index, "from", e.target.value)
                        }
                        className="compensation-select"
                      >
                        <option value="">From Amount</option>
                        {slabOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={slab.to}
                        onChange={(e) =>
                          handleSlabChange(index, "to", e.target.value)
                        }
                        className="compensation-select"
                      >
                        <option value="">To Amount</option>
                        {slabOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Percentage"
                        value={slab.percentage}
                        onChange={(e) =>
                          handleSlabChange(index, "percentage", e.target.value)
                        }
                        className="compensation-number-input-ot"
                      />
                      {index > 0 && (
                        <button
                          onClick={() => handleRemoveSlab(index)}
                          className="compensation-remove-button"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.tdsSlabs.length < 4 && (
                    <button
                      onClick={handleAddSlab}
                      className="compensation-add-slab-button"
                    >
                      Add Slab
                    </button>
                  )}
                </div>
              )}
            </div>
          ),
        },
      ],
    },
    {
      title: "Allowances",
      fields: [
        {
          label: "Basic Salary",
          field: "isBasicSalary",
          percentageField: "basicSalary",
          validation: {
            min: 30,
            max: 60,
            message: "Basic Salary percentage must be between 30% and 60%.",
          },
        },
        {
          label: "House Rent Allowance",
          field: "isHouseRentAllowance",
          percentageField: "houseRentAllowance",
          amountField: "houseRentAllowanceAmount",
          typeField: "houseRentAllowanceType",
        },
        {
          label: "LTA Allowance",
          field: "isLtaAllowance",
          percentageField: "ltaAllowance",
          amountField: "ltaAllowanceAmount",
          typeField: "ltaAllowanceType",
        },
        {
          label: "Other Allowance",
          field: "isOtherAllowance",
          percentageField: "otherAllowance",
          amountField: "otherAllowanceAmount",
          typeField: "otherAllowanceType",
        },
      ],
    },
    {
      title: "PF and Medical Contributions",
      fields: [
        {
          label: "PF Applicable",
          field: "isPFApplicable",
        },
        ...(formData.isPFApplicable
          ? [
              {
                label: "Calculation Based On",
                field: "pfCalculationBase",
                component: (
                  <div className="compensation-form-group">
                    <span className="compensation-label-text">
                      Calculation Based On
                    </span>
                    <div className="compensation-input-group">
                      <select
                        value={formData.pfCalculationBase || ""}
                        onChange={(e) =>
                          handleInputChange("pfCalculationBase", e.target.value)
                        }
                        className="compensation-select"
                      >
                        <option value="">Select</option>
                        <option value="basic">Basic Salary</option>
                        {/* <option value="gross">Gross Salary</option> */}
                      </select>
                    </div>
                  </div>
                ),
              },
              {
                label: "PF of Employee",
                field: "isPFEmployee",
                percentageField: "pfEmployeePercentage",
                amountField: "pfEmployeeAmount",
                typeField: "pfEmployeeType",
                includeCtcField: "pfEmployeeIncludeInCtc",
              },
              {
                label: "PF of Employer",
                field: "isPFEmployer",
                percentageField: "pfEmployerPercentage",
                amountField: "pfEmployerAmount",
                typeField: "pfEmployerType",
                includeCtcField: "pfEmployerIncludeInCtc",
              },
            ]
          : []),
        {
          label: "Medical Applicable",
          field: "isMedicalApplicable",
        },
        ...(formData.isMedicalApplicable
          ? [
              {
                label: "Calculation Based On",
                field: "medicalCalculationBase",
                component: (
                  <div className="compensation-form-group">
                    <span className="compensation-label-text">
                      Calculation Based On
                    </span>
                    <div className="compensation-input-group">
                      <select
                        value={formData.medicalCalculationBase || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "medicalCalculationBase",
                            e.target.value
                          )
                        }
                        className="compensation-select"
                      >
                        <option value="">Select</option>
                        <option value="basic">Basic Salary</option>
                        {/* <option value="gross">Gross Salary</option> */}
                      </select>
                    </div>
                  </div>
                ),
              },
              {
                label: "Esic of Employee",
                field: "isESICEmployee",
                percentageField: "esicEmployeePercentage",
                amountField: "esicEmployeeAmount",
                typeField: "esicEmployeeType",
                includeCtcField: "esicEmployeeIncludeInCtc",
              },
              {
                label: "Insurance of Employee",
                field: "isInsuranceEmployee",
                percentageField: "insuranceEmployeePercentage",
                amountField: "insuranceEmployeeAmount",
                typeField: "insuranceEmployeeType",
                includeCtcField: "insuranceEmployeeIncludeInCtc",
              },
            ]
          : []),
      ],
    },
    {
      title: "Statutory Components",
      fields: [
        {
          label: "Gratuity Applicable",
          field: "isGratuityApplicable",
          percentageField: "gratuityPercentage",
          amountField: "gratuityAmount",
          typeField: "gratuityType",
          includeCtcField: "gratuityIncludeInCtc",
        },
        {
          label: "Professional Tax (Monthly)",
          field: "isProfessionalTax",
          percentageField: "professionalTax",
          amountField: "professionalTaxAmount",
          typeField: "professionalTaxType",
          includeCtcField: "professionalTaxIncludeInCtc",
        },
        {
          label: "Variable Pay / Bonus (Yearly)",
          field: "isVariablePay",
          percentageField: "variablePay",
          amountField: "variablePayAmount",
          typeField: "variablePayType",
          includeCtcField: "variablePayIncludeInCtc",
        },
        {
          label: "Statutory Bonus",
          field: "isStatutoryBonus",
          percentageField: "statutoryBonusPercentage",
          amountField: "statutoryBonusAmount",
          typeField: "statutoryBonusType",
          includeCtcField: "statutoryBonusIncludeInCtc",
        },
        {
          label: "Incentives",
          field: "isIncentives",
        },
        {
          component: (
            <div className="compensation-form-group">
              <span className="compensation-label-text">Overtime Pay</span>
              <div className="compensation-checkbox-group">
                <label className="compensation-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isOvertimePay}
                    onChange={() =>
                      handleCheckboxChange("isOvertimePay", "yes")
                    }
                    className="compensation-checkbox"
                  />
                  <span>Yes</span>
                </label>
                <label className="compensation-checkbox-label">
                  <input
                    type="checkbox"
                    checked={
                      !formData.isOvertimePay &&
                      formData.isOvertimePay !== undefined
                    }
                    onChange={() => handleCheckboxChange("isOvertimePay", "no")}
                    className="compensation-checkbox"
                  />
                  <span>No</span>
                </label>
              </div>
              {formData.isOvertimePay && (
                <div className="compensation-input-group">
                  <select
                    value={formData.overtimePayType}
                    onChange={(e) =>
                      handleInputChange("overtimePayType", e.target.value)
                    }
                    className="compensation-select"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="per unit">Per Unit</option>
                  </select>
                  <input
                    type="number"
                    placeholder={
                      formData.overtimePayType === "hourly"
                        ? "Rate per Hour"
                        : formData.overtimePayType === "daily"
                        ? "Rate per Day"
                        : "Rate per Unit"
                    }
                    value={formData.overtimePayAmount}
                    onChange={(e) =>
                      handleInputChange("overtimePayAmount", e.target.value)
                    }
                    className="compensation-number-input-ot"
                  />
                  <input
                    type="number"
                    placeholder={
                      formData.overtimePayType === "hourly"
                        ? "Hours"
                        : formData.overtimePayType === "daily"
                        ? "Days"
                        : "Units"
                    }
                    value={formData.overtimePayUnits}
                    onChange={(e) =>
                      handleInputChange("overtimePayUnits", e.target.value)
                    }
                    className="compensation-number-input-ot"
                  />
                </div>
              )}
            </div>
          ),
        },
      ],
    },
  ];

  const formatStatus = (status) => {
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

  const renderViewCompensationTable = (compensationData) => {
    const totalCTC = ctcInput ? parseFloat(ctcInput) : DEFAULT_CTC;

    const fieldOrder = [
      "compensationPlanName",
      "isDefaultWorkingHours",
      "defaultWorkingHours",
      "isDefaultWorkingDays",
      "defaultWorkingDays",
      "isTDSApplicable",
      "tdsSlabs",
      "isBasicSalary",
      "basicSalary",
      "basicSalaryAmount",
      "basicSalaryType",
      "isHouseRentAllowance",
      "houseRentAllowance",
      "houseRentAllowanceAmount",
      "houseRentAllowanceType",
      "isLtaAllowance",
      "ltaAllowance",
      "ltaAllowanceAmount",
      "ltaAllowanceType",
      "isOtherAllowance",
      "otherAllowance",
      "otherAllowanceAmount",
      "otherAllowanceType",
      "isPFApplicable",
      "pfCalculationBase",
      "isPFEmployee",
      "pfEmployeePercentage",
      "pfEmployeeAmount",
      "pfEmployeeType",
      "pfEmployeeIncludeInCtc",
      "isPFEmployer",
      "pfEmployerPercentage",
      "pfEmployerAmount",
      "pfEmployerType",
      "pfEmployerIncludeInCtc",
      "isMedicalApplicable",
      "medicalCalculationBase",
      "isESICEmployee",
      "esicEmployeePercentage",
      "esicEmployeeAmount",
      "esicEmployeeType",
      "esicEmployeeIncludeInCtc",
      "isInsuranceEmployee",
      "insuranceEmployeePercentage",
      "insuranceEmployeeAmount",
      "insuranceEmployeeType",
      "insuranceEmployeeIncludeInCtc",
      "isGratuityApplicable",
      "gratuityPercentage",
      "gratuityAmount",
      "gratuityType",
      "gratuityIncludeInCtc",
      "isProfessionalTax",
      "professionalTax",
      "professionalTaxAmount",
      "professionalTaxType",
      "professionalTaxIncludeInCtc",
      "isVariablePay",
      "variablePay",
      "variablePayAmount",
      "variablePayType",
      "variablePayIncludeInCtc",
      "isStatutoryBonus",
      "statutoryBonusPercentage",
      "statutoryBonusAmount",
      "statutoryBonusType",
      "statutoryBonusIncludeInCtc",
      "isIncentives",
      "incentives",
      "incentivesAmount",
      "incentivesType",
      "incentivesIncludeInCtc",
      "isOvertimePay",
      "overtimePayType",
      "overtimePayAmount",
      "overtimePayUnits",
    ];

    // For fields that have a corresponding "Type" (e.g. insuranceEmployeeType, gratuityType etc.)
    // we will dynamically infer the base field and hide the irrelevant percentage/amount
    // row in the table rather than maintaining a large static map.
    return (
      <tbody>
        {fieldOrder
          .filter((key) => {
            // first standard visibility check
            if (!shouldDisplayField(key, compensationData[key], compensationData)) {
              return false;
            }
            // dynamic type/amount filtering: if a field has a sibling "Type" field,
            // hide the irrelevant counterpart.
            const base = key.replace(/(?:Percentage|Amount)$/, "");
            const typeKey = `${base}Type`;
            if (compensationData.hasOwnProperty(typeKey)) {
              const typeValue = compensationData[typeKey];
              if (typeValue === "amount" && key.endsWith("Percentage")) {
                return false;
              }
              if (typeValue === "percentage" && key.endsWith("Amount")) {
                return false;
              }
            }
            return true;
          })
          .map((key) => {
            const value = compensationData[key];
            // derive associated "Type" field if present (e.g. insuranceEmployeeType)
            let typeField = null;
            let typeValue = null;
            const base = key.replace(/(?:Percentage|Amount)$/, "");
            const typeKey = `${base}Type`;
            if (compensationData.hasOwnProperty(typeKey)) {
              typeField = typeKey;
              typeValue = compensationData[typeKey];
            }
            let displayValue = "";
            if (typeof value === "boolean") {
              displayValue = value ? "Yes" : "No";
            } else if (typeof value === "object" && value !== null) {
              if (Array.isArray(value)) {
                displayValue =
                  value.length > 0
                    ? value.map((slab, i) => (
                        <div key={i}>
                          From: {slab.from}, To: {slab.to}, %: {slab.percentage}
                        </div>
                      ))
                    : "-";
              } else {
                displayValue = Object.entries(value).map(([day, status]) => (
                  <div key={day}>{`${day}: ${formatStatus(status)}`}</div>
                ));
              }
            } else if (value !== "" && value !== undefined) {
              if (isNaN(value)) {
                displayValue = value;
              } else {
                displayValue = Number(value).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                if (
                  typeField &&
                  key.endsWith("Amount") &&
                  typeValue === "amount"
                ) {
                  const calculatedPercentage = convertAmountToPercentage(
                    value,
                    totalCTC
                  ).toFixed(2);
                  displayValue += ` (${calculatedPercentage}%)`;
                } else if (typeField && typeValue === "percentage") {
                  displayValue += " (Percentage)";
                }
              }
            } else {
              displayValue = "-";
            }
            return (
              <tr key={key}>
                <td>{formatFieldName(key)}</td>
                <td>{displayValue}</td>
              </tr>
            );
          })}
      </tbody>
    );
  };

  return (
    <div className="compensation-container">
      <div className="header-container">
        <button className="compensation-create-button" onClick={togglePopup}>
          Create Compensation
        </button>
        <button
          className="compensation-create-button"
          onClick={() => setIsSalaryPeriodModalOpen(true)}
          style={{ marginLeft: "10px" }}
        >
          Salary Calculation Period
        </button>
      </div>
      <div className="table-scroll-wrapper">
        <table className="compensation-table">
          <thead>
            <tr className="header-row">
              <th>ID</th>
              <th>Compensation Plan Name</th>
              <th>All Details</th>
              <th>Last Updated</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {compensations.map((comp) => (
              <tr key={comp.id}>
                <td>{comp.id}</td>
                <td>{comp.compensation_plan_name}</td>
                <td>
                  <button
                    className="vendor-view-doc-btn"
                    onClick={() => handleViewPopup(comp.plan_data, comp.id)}
                  >
                    <FaEye size={16} style={{ marginRight: "5px" }} /> View
                  </button>
                </td>
                <td>
                  {comp.created_at
                    ? new Date(comp.created_at).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <button
                    className="vendor-edit-btn"
                    onClick={() => handleEdit(comp)}
                    title="Edit Compensation"
                  >
                    <FaPencilAlt size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isPopupOpen && categories[currentStep - 1] && (
        <div className="compensation-popup-overlay">
          <div className="compensation-popup">
            <div className="compensation-popup-header">
              <h2>{isEditing ? "Edit Compensation" : "Create Compensation"}</h2>
              <button
                onClick={togglePopup}
                className="compensation-close-button"
              >
                ×
              </button>
            </div>
            <div className="compensation-progress-bar">
              {categories.map((category, index) => (
                <React.Fragment key={index}>
                  <div
                    className={`progress-step ${
                      currentStep === index + 1 ? "active" : ""
                    }`}
                    onClick={() => handleStepChange(index + 1)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="step-number">{index + 1}</span>
                    <span className="step-label">{category.title}</span>
                  </div>
                  {index < categories.length - 1 && (
                    <div className="progress-connector">
                      <span className="progress-line"></span>
                      <span className="progress-dot"></span>
                      <span className="progress-line"></span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="compensation-popup-content">
              <div className="compensation-form-section">
                <div className="compensation-category">
                  <h3>{categories[currentStep - 1].title}</h3>
                  {categories[currentStep - 1].fields.map((field, idx) =>
                    field.component ? (
                      <React.Fragment key={idx}>
                        {field.component}
                      </React.Fragment>
                    ) : (
                      renderCategoryField(field)
                    )
                  )}
                </div>
                <div className="compensation-button-container">
                  <button
                    className="compensation-back-button"
                    onClick={() => handleStepChange(currentStep - 1)}
                    disabled={currentStep === 1}
                  >
                    Back
                  </button>
                  {currentStep < categories.length && (
                    <button
                      className="compensation-add-button"
                      onClick={() => handleStepChange(currentStep + 1)}
                    >
                      Next
                    </button>
                  )}
                  {currentStep === categories.length && (
  <>
    {isOtherAllowanceAutoFilled && (
      <div
        style={{
          marginBottom: '12px',
          padding: '10px',
          backgroundColor: '#fffbea',
          borderLeft: '4px solid #ffc107',
          borderRadius: '4px',
          color: '#856404',
          fontSize: '0.95rem',
          textAlign: 'center',
        }}
      >
        ℹ️ Remaining percentage has been automatically added to the Other Allowance field.
      </div>
    )}

    <button
      className="compensation-preview-button"
      onClick={handlePreview}
      disabled={Number(allocationInfo.exceeds) > 0.3 || !allocationInfo.isValid}
      style={{ opacity: Number(allocationInfo.exceeds) > 0.3 || !allocationInfo.isValid ? 0.6 : 1 }}
    >
      Preview Compensation
    </button>

    <button
      className="compensation-add-button"
      onClick={handleSubmit}
      disabled={Number(allocationInfo.exceeds) > 0.3 || !allocationInfo.isValid}
      style={{ opacity: Number(allocationInfo.exceeds) > 0.3 || !allocationInfo.isValid ? 0.6 : 1 }}
    >
      {isEditing ? "Update Compensation" : "Save Compensation"}
    </button>

    {/* Warning message below buttons */}
    {(Number(allocationInfo.exceeds) > 0.3 || Number(allocationInfo.remaining) > 1) && (
      <div
        style={{
          marginTop: '12px',
          padding: '10px',
          backgroundColor: Number(allocationInfo.exceeds) > 0.3 ? '#ffebee' : '#fff3e0',
          borderRadius: '6px',
          color: Number(allocationInfo.exceeds) > 0.3 ? '#c62828' : '#f57c00',
          fontSize: '0.95rem',
          textAlign: 'center',
        }}
      >
        {Number(allocationInfo.exceeds) > 0.3
          ? `Total exceeds 100% by ${allocationInfo.exceeds}% — Please adjust values`
          : `Still ${allocationInfo.remaining}% remaining — Fill in Other Allowance or adjust`}
      </div>
    )}
  </>
)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {viewExecCompensation && (
        <div className="compensation-popup-overlay">
          <div className="compensation-popup">
            <div className="compensation-popup-header">
              <h2>Compensation Details</h2>
              <button
                onClick={() => setViewExecCompensation(null)}
                className="compensation-close-button"
              >
                ×
              </button>
            </div>
            <div className="compensation-popup-content">
              <table className="compensation-preview-table">
                <thead>
                  <tr className="header-row">
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                {renderViewCompensationTable(viewExecCompensation)}
              </table>
            </div>
          </div>
        </div>
      )}
      {previewModal && (
        <div className="create-compensation-popup-overlay">
          <div className="create-compensation-popup">
            <div className="create-compensation-popup-header">
              <h2>Preview Compensation</h2>
              <button
                onClick={closePreview}
                className="create-compensation-close-button"
              >
                ×
              </button>
            </div>
            <div className="create-compensation-popup-content">
              <div className="create-compensation-form-group">
                <span className="create-compensation-label-text">
                  Enter Annual CTC (₹)
                </span>
                <div className="create-compensation-input-group">
                  <input
                    type="number"
                    placeholder="Enter CTC"
                    value={ctcInput}
                    onChange={(e) => setCtcInput(e.target.value)}
                    className="create-compensation-number-input"
                  />
                  <button
                    className="create-compensation-add-button"
                    onClick={handleCalculate}
                  >
                    Calculate
                  </button>
                </div>
              </div>
              <div className="create-preview-columns">
                <div className="create-preview-left">
                  <table className="create-compensation-preview-table">
                    <thead>
                      <tr className="create-header-row">
                        <th>Field</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          label: "Basic Salary",
                          amountField: "basicSalaryAmount",
                          percentageField: "basicSalary",
                          typeField: "basicSalaryType",
                          enableField: "isBasicSalary",
                        },
                        {
                          label: "House Rent Allowance (HRA)",
                          amountField: "houseRentAllowanceAmount",
                          percentageField: "houseRentAllowance",
                          typeField: "houseRentAllowanceType",
                          enableField: "isHouseRentAllowance",
                        },
                        {
                          label: "Leave Travel Allowance (LTA)",
                          amountField: "ltaAllowanceAmount",
                          percentageField: "ltaAllowance",
                          typeField: "ltaAllowanceType",
                          enableField: "isLtaAllowance",
                        },
                        {
                          label: "Other Allowance",
                          amountField: "otherAllowanceAmount",
                          percentageField: "otherAllowance",
                          typeField: "otherAllowanceType",
                          enableField: "isOtherAllowance",
                        },
                        {
                          label: "Provident Fund (PF - Employee)",
                          amountField: "pfEmployeeAmount",
                          percentageField: "pfEmployeePercentage",
                          typeField: "pfEmployeeType",
                          enableField: "isPFEmployee",
                        },
                        {
                          label: "Provident Fund (PF - Employer)",
                          amountField: "pfEmployerAmount",
                          percentageField: "pfEmployerPercentage",
                          typeField: "pfEmployerType",
                          enableField: "isPFEmployer",
                        },
                        {
                          label: "Employee State Insurance (ESIC - Employee)",
                          amountField: "esicEmployeeAmount",
                          percentageField: "esicEmployeePercentage",
                          typeField: "esicEmployeeType",
                          enableField: "isESICEmployee",
                        },
                        {
                          label: "Insurance (Employee)",
                          amountField: "insuranceEmployeeAmount",
                          percentageField: "insuranceEmployeePercentage",
                          typeField: "insuranceEmployeeType",
                          enableField: "isInsuranceEmployee",
                        },
                        {
                          label: "Professional Tax",
                          amountField: "professionalTaxAmount",
                          percentageField: "professionalTax",
                          typeField: "professionalTaxType",
                          enableField: "isProfessionalTax",
                        },
                        {
                          label: "Statutory Bonus",
                          amountField: "statutoryBonusAmount",
                          percentageField: "statutoryBonusPercentage",
                          typeField: "statutoryBonusType",
                          enableField: "isStatutoryBonus",
                        },
                        {
                          label: "Incentives",
                          amountField: "incentivesAmount",
                          percentageField: "incentives",
                          typeField: "incentivesType",
                          enableField: "isIncentives",
                        },
                        {
                          label: "Variable Pay / Bonus",
                          amountField: "variablePayAmount",
                          percentageField: "variablePay",
                          typeField: "variablePayType",
                          enableField: "isVariablePay",
                        },
                        {
                          label: "Gratuity",
                          amountField: "gratuityAmount",
                          percentageField: "gratuityPercentage",
                          typeField: "gratuityType",
                          enableField: "isGratuityApplicable",
                        },
                        {
                          label: "Overtime Pay",
                          values: {
                            Type: formData.overtimePayType,
                            Rate: formData.overtimePayAmount,
                            Units: formData.overtimePayUnits,
                          },
                          enableField: "isOvertimePay",
                        },
                        {
                          label: "Default Working Days",
                          values: formData.defaultWorkingDays || {},
                          enableField: "isDefaultWorkingDays",
                        },
                        {
                          label: "TDS Slabs",
                          values: { Slabs: formData.tdsSlabs || [] },
                          enableField: "isTDSApplicable",
                        },
                      ]
                        .map((field, idx) => {
                          if (!formData[field.enableField]) return null;
                          const totalCTC = ctcInput
                            ? parseFloat(ctcInput)
                            : DEFAULT_CTC;
                          let displayValue = "";
                          if (field.label === "Default Working Days") {
                            displayValue = Object.entries(field.values).map(
                              ([day, status]) => (
                                <div key={day}>{`${day}: ${formatStatus(
                                  status
                                )}`}</div>
                              )
                            );
                          } else if (field.label === "TDS Slabs") {
                            displayValue =
                              field.values.Slabs.length > 0 ? (
                                field.values.Slabs.map((slab, i) => (
                                  <div key={i}>
                                    From: {slab.from}, To: {slab.to}, %:{" "}
                                    {slab.percentage}
                                  </div>
                                ))
                              ) : (
                                <span>-</span>
                              );
                          } else if (field.label === "Overtime Pay") {
                            const { Type, Rate, Units } = field.values;
                            displayValue =
                              Rate && Units
                                ? `${Number(Rate).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} / ${
                                    Type === "hourly"
                                      ? "hour"
                                      : Type === "daily"
                                      ? "day"
                                      : "unit"
                                  } (${Units} ${
                                    Type === "hourly"
                                      ? "hours"
                                      : Type === "daily"
                                      ? "days"
                                      : "units"
                                  })`
                                : "-";
                          } else {
  const typeValue = formData[field.typeField];
  let value = typeValue === "amount" ? formData[field.amountField] : formData[field.percentageField];
  const basicSalary = parseFloat(formData.basicSalary) || 0;

  if (value !== "" && value !== undefined) {
    const numValue = parseFloat(value);
    
    // If salaryDetails exist (post-Calculate), compute effective CTC % from actual calculated values
    if (salaryDetails) {
      // Map field labels to salaryDetails keys
      const salaryDetailsKeyMap = {
        "Basic Salary": "basicSalary",
        "House Rent Allowance (HRA)": "hra",
        "Leave Travel Allowance (LTA)": "ltaAllowance",
        "Other Allowance": "otherAllowances",
        "Provident Fund (PF - Employee)": "employeePF",
        "Provident Fund (PF - Employer)": "employerPF",
        "Employee State Insurance (ESIC - Employee)": "esic",
        "Insurance (Employee)": "insurance",
        "Professional Tax": "professionalTax",
        "Statutory Bonus": "statutoryBonus",
        "Variable Pay / Bonus": "variablePay",
        "Gratuity": "gratuity",
      };
      const includeMap = {
        employeePF: 'pfEmployeeIncludeInCtc',
        employerPF: 'pfEmployerIncludeInCtc',
        esic: 'esicEmployeeIncludeInCtc',
        insurance: 'insuranceEmployeeIncludeInCtc',
        professionalTax: 'professionalTaxIncludeInCtc',
        gratuity: 'gratuityIncludeInCtc',
      };

      const salaryKey = salaryDetailsKeyMap[field.label];
      let monthlyCalc = salaryKey ? (Number(salaryDetails[salaryKey]) || 0) : 0;
      // apply include-flag: if explicitly false, treat as zero
      if (salaryKey && includeMap[salaryKey] && formData[includeMap[salaryKey]] === false) {
        monthlyCalc = 0;
      }
      
      if (monthlyCalc > 0) {
        const annualCalc = monthlyCalc * 12;
        const totalCTC = parseFloat(ctcInput) || DEFAULT_CTC;
        const effPct = (annualCalc / totalCTC) * 100;
        console.log(`Preview [${field.label}]: Using calculated value from salaryDetails[${salaryKey}] = ₹${monthlyCalc.toFixed(2)}/mo ≈ ${effPct.toFixed(4)}% of CTC`);
        
        if (typeValue === "amount") {
          // Amount mode: show monthly amount and effective CTC %
          displayValue = `₹${monthlyCalc.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo ≈ ${effPct.toFixed(4)}% of CTC`;
        } else {
          // Percentage mode: show form value ≈ effective CTC %
          displayValue = `${numValue.toFixed(2)}% ≈ ${effPct.toFixed(4)}% of CTC`;
        }
      } else {
        displayValue = "-";
      }
    } else {
      // Fallback: compute from form values when salaryDetails not available
      if (typeValue === "amount") {
        // Determine if monthly or annual
        const monthlyFields = ["basicSalaryAmount", "houseRentAllowanceAmount", "ltaAllowanceAmount", "otherAllowanceAmount", "pfEmployeeAmount", "pfEmployerAmount", "esicEmployeeAmount", "insuranceEmployeeAmount", "professionalTaxAmount"];
        const isMonthly = monthlyFields.includes(field.amountField);
        const annualValue = isMonthly ? (Number(value) * 12) : Number(value);
        const timeUnit = isMonthly ? "/mo" : "/yr";
        const totalCTC = parseFloat(ctcInput) || DEFAULT_CTC;
        const effPct = (annualValue / totalCTC * 100).toFixed(4);
        displayValue = `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${timeUnit} ≈ ${effPct}% of CTC`;
      } else {
        // Percentage mode - show effective CTC percentage
        let effectivePct = numValue;
        const fieldBase = field.percentageField.replace("Percentage", "");
        if (BASIC_BASED_FIELDS.includes(fieldBase) && basicSalary > 0) {
          effectivePct = (numValue / 100) * basicSalary;
        }
        displayValue = Math.abs(effectivePct - numValue) < 0.01 
          ? `${numValue.toFixed(2)}%` 
          : `${numValue.toFixed(2)}% ≈ ${effectivePct.toFixed(4)}% of CTC`;
      }
    }
  } else {
    displayValue = "-";
  }
}
                          return (
                            <tr key={idx}>
                              <td>{field.label}</td>
                              <td>{displayValue}</td>
                            </tr>
                          );
                        })
                        .filter((row) => row !== null)}
                    </tbody>
                  </table>

                  {previewAllocation && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: Math.abs(previewAllocation.remaining) < 0.01 ? '#2e7d32' : (previewAllocation.total > 100 ? '#c62828' : '#f57c00')
                    }}>
                      <div>Total CTC allocation: <strong>{previewAllocation.total.toFixed(4)}%</strong></div>
                      {Math.abs(previewAllocation.remaining) >= 0.01 && (
                        <div style={{ marginTop: '4px', color: '#f57c00' }}>
                          Remaining: <strong>{previewAllocation.remaining.toFixed(4)}%</strong>
                        </div>
                      )}
                      {Math.abs(previewAllocation.remaining) < 0.01 && (
                        <div style={{ marginTop: '4px', color: '#2e7d32' }}>
                          ✓ Fully allocated to 100.0000%
                        </div>
                      )}
                    </div>
                  )}

                </div>
               {salaryDetails && (
  <div className="create-preview-right">
    <h3>Calculated Salary (Monthly)</h3>
    <table className="create-compensation-preview-table">
      <thead>
        <tr className="create-header-row">
          <th>Component</th>
          <th>Amount (₹)</th>
          <th>Plan Value</th>
        </tr>
      </thead>
      <tbody>
        {(() => {
          const includeMap = {
            employeePF: 'pfEmployeeIncludeInCtc',
            employerPF: 'pfEmployerIncludeInCtc',
            esic: 'esicEmployeeIncludeInCtc',
            insurance: 'insuranceEmployeeIncludeInCtc',
            professionalTax: 'professionalTaxIncludeInCtc',
            gratuity: 'gratuityIncludeInCtc',
          };
          const entries = Object.entries(salaryDetails).filter(
            ([key, value]) => {
              // hide internal metadata and original gross/net rows
              if (key === "_enhancedPlanDescriptions" || key === "grossSalary" || key === "netSalary") {
                return false;
              }
              if (!shouldDisplayField(key, value, formData)) {
                return false;
              }
              // exclude if include flag unchecked
              if (includeMap[key] && formData[includeMap[key]] === false) {
                return false;
              }
              return true;
            }
          );
          let totalEff = entries.reduce((sum, [key, val]) => {
            const monthlyCalc = Number(val) || 0;
            const annualCalc = monthlyCalc * 12;
            const totalCTC = parseFloat(ctcInput) || DEFAULT_CTC;
            return sum + (annualCalc / totalCTC) * 100;
          }, 0);
          totalEff = parseFloat(totalEff.toFixed(4));
          if (totalEff > 100) totalEff = 100;

          return (
            <>
              {entries.map(([key, value]) => {
                const monthlyCalc = Number(value) || 0;
                const annualCalc = monthlyCalc * 12;
                const totalCTC = parseFloat(ctcInput) || DEFAULT_CTC;
                const effPct = (annualCalc / totalCTC) * 100;

                let planText = "-";
                const mapping = salaryFieldToFormDataMap[key];
                if (mapping) {
                  const currentType =
                    formData[mapping.type] || mapping.default?.type || "percentage";
                  if (currentType === "amount") {
                    planText = `₹${monthlyCalc.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo ≈ ${effPct.toFixed(4)}% of CTC`;
                  } else {
                    // percentage entry -> show effective CTC percentage only
                    planText = `${effPct.toFixed(4)}% of CTC`;
                  }
                }

                if (key === "otherAllowances" && planText.includes("Remaining")) {
                  planText = <strong style={{ color: "#2e7d32" }}>{planText}</strong>;
                }

                return (
                  <tr key={key}>
                    <td>{formatFieldName(key)}</td>
                    <td>
                      {typeof value === "number"
                        ? value.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : value}
                    </td>
                    <td>{planText}</td>
                  </tr>
                );
              })}
              {/* insert local gross/net rows before total */}
              {salaryDetails.localGross !== undefined && (
                <tr>
                  <td>Total Gross</td>
                  <td>{salaryDetails.localGross.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{((salaryDetails.localGross*12)/(parseFloat(ctcInput)||DEFAULT_CTC)*100).toFixed(4)}% of CTC</td>
                </tr>
              )}
              {salaryDetails.localNet !== undefined && (
                <tr>
                  <td>Total Net</td>
                  <td>{salaryDetails.localNet.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{((salaryDetails.localNet*12)/(parseFloat(ctcInput)||DEFAULT_CTC)*100).toFixed(4)}% of CTC</td>
                </tr>
              )}
              <tr>
                <td><strong>Total</strong></td>
                <td></td>
                <td><strong>{totalEff.toFixed(4)}% of CTC</strong></td>
              </tr>
            </>
          );
        })()}
      </tbody>
    </table>
  </div>
)}
              </div>
            </div>
          </div>
        </div>
      )}
      {isSalaryPeriodModalOpen && (
        <div>
          <SalaryCalculationPeriod
            onClose={() => {
              setIsSalaryPeriodModalOpen(false);
              fetchSalaryPeriods();
            }}
            showAlert={showAlert}
          />
        </div>
      )}
      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>
      <Modal
        isVisible={confirmModal.isVisible}
        onClose={closeConfirm}
        buttons={[
          { label: "No", onClick: closeConfirm },
          { label: "Yes", onClick: confirmModal.onConfirm || closeConfirm },
        ]}
      >
        <p>{confirmModal.message}</p>
      </Modal>
    </div>
  );
};

export default CreateCompensation;
