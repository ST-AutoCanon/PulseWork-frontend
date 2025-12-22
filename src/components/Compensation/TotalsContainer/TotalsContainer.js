import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
} from "react-icons/fa";
import "./TotalsContainer.css";
import {
  calculateSalaryDetails,
  parseApplicableMonth,
} from "../../../utils/SalaryCalculations.js"; // Adjusted import (removed parseWorkDate as it's no longer used)
import { calculateLOPEffect } from "../../../utils/lopCalculations.client.jsx"; // Adjust path if needed
import { calculateIncentives } from "../../../utils/IncentiveUtils.js"; // Adjust path if needed

const TotalsContainer = () => {
  const [totals, setTotals] = useState({
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
  });
  const [isLoading, setIsLoading] = useState(true);
  const API_KEY = process.env.REACT_APP_API_KEY;
  const BASE_URL = `${process.env.REACT_APP_BACKEND_URL}`;
const { user } = useAuth();
  const meId = user?.employeeId ?? user?.id ?? user?.employee_id ?? null;
  // Helper function to calculate monthly bonus pay (copied from SalaryDetails)
  const calculateMonthlyBonusPay = (empCtc, bonusRecords) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const monthlyCTC = parseFloat(empCtc) / 12;

    const monthlyBonuses = bonusRecords.filter((bonus) => {
      const date = parseApplicableMonth(bonus.applicable_month);
      return (
        date &&
        date.getFullYear() === currentYear &&
        (date.getMonth() + 1).toString().padStart(2, '0') === currentMonthStr
      );
    });

    return monthlyBonuses.reduce((sum, bonus) => {
      let bonusAmount = 0;
      if (bonus.fixed_amount && !isNaN(parseFloat(bonus.fixed_amount))) {
        bonusAmount = parseFloat(bonus.fixed_amount);
      } else if (bonus.percentage_ctc && !isNaN(parseFloat(bonus.percentage_ctc))) {
        bonusAmount = (parseFloat(bonus.percentage_ctc) / 100) * parseFloat(empCtc || 0);
      } else if (bonus.percentage_monthly_salary && !isNaN(parseFloat(bonus.percentage_monthly_salary))) {
        bonusAmount = parseFloat(bonus.percentage_monthly_salary) * monthlyCTC;
      }
      return sum + bonusAmount;
    }, 0);
  };

  // Helper to calculate local gross and net for an employee (copied from SalaryDetails)
  const calculateLocalGrossNet = (salaryDetails, monthlyBonusPay, lopDeduction, planData) => {
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
      monthlyBonusPay
    ].reduce((sum, val) => sum + parseFloat(val || 0), 0);

    let monthlyDeductionsSum = 0;
    monthlyDeductionsSum += parseFloat(salaryDetails.advanceRecovery || 0);
    monthlyDeductionsSum += parseFloat(salaryDetails.employeePF || 0);
    if (planData.pfEmployerIncludeInCtc !== false) {
      monthlyDeductionsSum += parseFloat(salaryDetails.employerPF || 0);
    }
    monthlyDeductionsSum += parseFloat(salaryDetails.esic || 0);
    monthlyDeductionsSum += parseFloat(salaryDetails.gratuity || 0);
    monthlyDeductionsSum += parseFloat(salaryDetails.professionalTax || 0);
    monthlyDeductionsSum += parseFloat(salaryDetails.tds || 0);
    monthlyDeductionsSum += parseFloat(salaryDetails.insurance || 0);
    monthlyDeductionsSum += lopDeduction;

    const localGross = monthlyEarningsSum;
    const localNet = localGross - monthlyDeductionsSum;
    return { localGross, localNet };
  };

  useEffect(() => {
    const fetchTotalsData = async () => {
      console.log("Environment Variables:", {
        API_KEY: process.env.REACT_APP_API_KEY,
        BASE_URL: process.env.REACT_APP_BACKEND_URL,
        meId,
      });
      if (!process.env.REACT_APP_API_KEY || !meId) {
        console.error("Missing credentials: API_KEY or meId");
        setIsLoading(false);
        return;
      }
      const headers = { "x-api-key": API_KEY, "x-employee-id": meId };
      console.log("Fetching data with headers:", headers);
      try {
        setIsLoading(true);
        const [
          compensationsRes,
          employeesRes,
          advancesRes,
          overtimeRes,
          bonusRes,
        ] = await Promise.all([
          axios.get(`${BASE_URL}/api/compensations/list`, { headers }).catch(err => {
            console.error("Error fetching compensations/list:", err);
            throw err;
          }),
          axios.get(`${BASE_URL}/api/compensation/assigned`, { headers }).catch(err => {
            console.error("Error fetching compensation/assigned:", err);
            throw err;
          }),
          axios.get(`${BASE_URL}/api/compensation/advance-details`, { headers }).catch(err => {
            console.error("Error fetching compensation/advance-details:", err);
            throw err;
          }),
          axios.get(`${BASE_URL}/api/compensation/overtime-status-summary`, { headers }).catch(err => {
            console.error("Error fetching compensation/overtime-status-summary:", err);
            throw err;
          }),
          axios.get(`${BASE_URL}/api/compensation/bonus-list`, { headers }).catch(err => {
            console.error("Error fetching compensation/bonus-list:", err);
            throw err;
          }),
        ]);
        console.log("API Responses:", {
          compensations: compensationsRes.data,
          employees: employeesRes.data,
          advances: advancesRes.data,
          overtime: overtimeRes.data,
          bonus: bonusRes.data,
        });
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
        const advances = advancesRes.data.data || [];
        const overtimeRecords = overtimeRes.data.data || [];
        const bonusRecords = bonusRes.data.data || [];
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
            const key = String(employeeId).toUpperCase();
            if (!acc[key] || parseFloat(incentiveData.totalIncentive.value) > 0) {
              acc[key] = incentiveData;
            }
            return acc;
          },
          {}
        );
        // Compute totals
        let totalGross = 0;
        let totalPayable = 0;
        let totalTDS = 0;
        let totalAdvance = 0;
        let totalOvertime = 0;
        let totalBonus = 0;
        let totalEmployeePF = 0;
        let totalEmployerPF = 0;
        let totalInsurance = 0;
        let totalLopDeduction = 0;
        enrichedEmployees.forEach((emp) => {
          const salaryDetails = calculateSalaryDetails(
            emp.ctc,
            emp.plan_data,
            emp.employee_id,
            overtimeRecords || [],
            bonusRecords || [],
            advances || [],
            incentiveDataMap || {},
            lopDataMap
          );
          const lopData =
            lopDataMap && emp.employee_id ? lopDataMap[emp.employee_id] || {
              currentMonth: { days: 0, value: '0.00', currency: 'INR' },
              deferred: { days: 0, value: '0.00', currency: 'INR' },
              nextMonth: { days: 0, value: '0.00', currency: 'INR' },
              yearly: { days: 0, value: '0.00', currency: 'INR' },
            } : {
              currentMonth: { days: 0, value: '0.00', currency: 'INR' },
              deferred: { days: 0, value: '0.00', currency: 'INR' },
              nextMonth: { days: 0, value: '0.00', currency: 'INR' },
              yearly: { days: 0, value: '0.00', currency: 'INR' },
            };
          const lopDeduction = parseFloat(lopData.yearly ? lopData.yearly.value : '0');
          // Calculate monthly bonus pay
          const monthlyBonusPay = calculateMonthlyBonusPay(emp.ctc, bonusRecords);
          // Calculate local gross and net (aligned with SalaryDetails)
          const { localGross, localNet } = calculateLocalGrossNet(salaryDetails, monthlyBonusPay, lopDeduction, emp.plan_data);
          const netSalary = localNet > 0 ? localNet : 0;
          // Extract components for other totals
          const advanceRecovery = salaryDetails ? parseFloat(salaryDetails.advanceRecovery) : 0;
          const employeePF = salaryDetails ? parseFloat(salaryDetails.employeePF) : 0;
          const employerPF = salaryDetails ? parseFloat(salaryDetails.employerPF) : 0;
          const esic = salaryDetails ? parseFloat(salaryDetails.esic) : 0;
          const gratuity = salaryDetails ? parseFloat(salaryDetails.gratuity) : 0;
          const professionalTax = salaryDetails ? parseFloat(salaryDetails.professionalTax) : 0;
          const tds = salaryDetails ? parseFloat(salaryDetails.tds) : 0;
          const insurance = salaryDetails ? parseFloat(salaryDetails.insurance) : 0;
          const overtimePay = salaryDetails ? parseFloat(salaryDetails.overtimePay) : 0;
          // Round to 2 decimal places to avoid precision issues
          const roundedGross = Math.round(localGross * 100) / 100;
          const roundedPayable = Math.round(netSalary * 100) / 100;
          const roundedTDS = Math.round(tds * 100) / 100;
          const roundedAdvance = Math.round(advanceRecovery * 100) / 100;
          const roundedOvertime = Math.round(overtimePay * 100) / 100;
          const roundedBonus = Math.round(monthlyBonusPay * 100) / 100;
          const roundedEmployeePF = Math.round(employeePF * 100) / 100;
          const roundedEmployerPF = Math.round(employerPF * 100) / 100;
          const roundedInsurance = Math.round(insurance * 100) / 100;
          const roundedLopDeduction = Math.round(lopDeduction * 100) / 100;
          // Accumulate totals
          totalGross += roundedGross;
          totalPayable += roundedPayable;
          totalTDS += roundedTDS;
          totalAdvance += roundedAdvance;
          totalOvertime += roundedOvertime;
          totalBonus += roundedBonus;
          totalEmployeePF += roundedEmployeePF;
          totalEmployerPF += roundedEmployerPF;
          totalInsurance += roundedInsurance;
          totalLopDeduction += roundedLopDeduction;
        });
        setTotals({
          totalPayable,
          totalGross,
          totalTDS,
          totalAdvance,
          totalOvertime,
          totalBonus,
          totalEmployeePF,
          totalEmployerPF,
          totalInsurance,
          totalLopDeduction,
        });
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTotalsData();
  }, []);

  // Helper to format currency (round to 2 decimals and locale string)
  const formatCurrency = (value) => {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  };

  if (isLoading) {
    return <div className="sb-loading">Loading totals...</div>;
  }
  return (
    <div className="sb-totals-container">
      <h2 className="sb-totals-total-payroll">
        Total Payroll: ₹{formatCurrency(totals.totalPayable)}
      </h2>
      <div className="sb-totals-grid">
        <div className="sb-totals-card sb-payable">
          <FaMoneyBillWave className="sb-totals-card-icon" />
          <div>
            <span className="sb-totals-card-title">Total Payable</span>
            <span className="sb-totals-card-value">
              ₹{formatCurrency(totals.totalPayable)}
            </span>
          </div>
        </div>
        <div className="sb-totals-card sb-gross">
          <FaChartLine className="sb-totals-card-icon" />
          <div>
            <span className="sb-totals-card-title">Total Gross</span>
            <span className="sb-totals-card-value">₹{formatCurrency(totals.totalGross)}</span>
          </div>
        </div>
        <div className="sb-totals-card sb-tds">
          <FaMoneyCheckAlt className="sb-totals-card-icon" />
          <div>
            <span className="sb-totals-card-title">Total TDS</span>
            <span className="sb-totals-card-value">₹{formatCurrency(totals.totalTDS)}</span>
          </div>
        </div>
        <div className="sb-totals-card sb-advance">
          <FaHandHoldingUsd className="sb-totals-card-icon" />
          <div>
            <span className="sb-totals-card-title">Total Advance</span>
            <span className="sb-totals-card-value">₹{formatCurrency(totals.totalAdvance)}</span>
          </div>
        </div>
        <div className="sb-totals-card sb-overtime">
          <FaClock className="sb-totals-card-icon" />
          <div>
            <span className="sb-totals-card-title">Total Overtime</span>
            <span className="sb-totals-card-value">₹{formatCurrency(totals.totalOvertime)}</span>
          </div>
        </div>
        <div className="sb-totals-card sb-bonus">
          <FaGift className="sb-totals-card-icon" />
          <div>
            <span className="sb-totals-card-title">Total Bonus</span>
            <span className="sb-totals-card-value">₹{formatCurrency(totals.totalBonus)}</span>
          </div>
        </div>
        <div className="sb-totals-card sb-pf-employee">
          <FaShieldAlt className="sb-totals-card-icon" />
          <div>
            <span className="sb-totals-card-title">Total PF Employee</span>
            <span className="sb-totals-card-value">₹{formatCurrency(totals.totalEmployeePF)}</span>
          </div>
        </div>
        <div className="sb-totals-card sb-pf-employer">
          <FaBriefcase className="sb-totals-card-icon" />
          <div>
            <span className="sb-totals-card-title">Total PF Employer</span>
            <span className="sb-totals-card-value">₹{formatCurrency(totals.totalEmployerPF)}</span>
          </div>
        </div>
        <div className="sb-totals-card sb-insurance">
          <FaStethoscope className="sb-totals-card-icon" />
          <div>
            <span className="sb-totals-card-title">Total Insurance</span>
            <span className="sb-totals-card-value">₹{formatCurrency(totals.totalInsurance)}</span>
          </div>
        </div>
        <div className="sb-totals-card sb-lop">
          <FaExclamationTriangle className="sb-totals-card-icon" />
          <div>
            <span className="sb-totals-card-title">Total LOP Deduction</span>
            <span className="sb-totals-card-value">₹{formatCurrency(totals.totalLopDeduction)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalsContainer;