// GeneratePayslip.client.jsx
"use client";

import React, { useState, useEffect } from "react";
import generatePayslipPDF from "../../utils/generatePayslipPDF";
import "./generate_payslip.css";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

export default function GeneratePayslip() {
  const { user } = useAuth();
  const meId = user?.employeeId ?? user?.id ?? null;

  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState([]);
  const [filteredEmployeeData, setFilteredEmployeeData] = useState([]);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDetailsModal, setViewDetailsModal] = useState({
    isVisible: false,
    employee: null,
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const headers = {
    "x-api-key": API_KEY,
    ...(meId ? { "x-employee-id": meId } : {}),
  };

  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "STS001",
    gender: "",
    designation: "",
    dateOfJoining: "",
    accountNo: "",
    workingDays: "",
    leavesTaken: "",
    uinNo: "",
    panNumber: "",
    esiNumber: "",
    pfNumber: "",
    basic: "",
    hra: "",
    otherAllowance: "",
    pf: "",
    esiInsurance: "",
    professionalTax: "",
    tds: "",
  });

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const handleViewDetails = (employee) => {
    setViewDetailsModal({ isVisible: true, employee });
  };

  const closeViewDetails = () =>
    setViewDetailsModal({ isVisible: false, employee: null });

  // Fetch employees list (old-employee list endpoint)
  useEffect(() => {
    let mounted = true;
    const fetchEmployeeData = async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/old-employee/list`, {
          headers,
        });
        if (!resp.ok) {
          const text = await resp.text().catch(() => null);
          throw new Error(text || `HTTP ${resp.status}`);
        }
        const data = await resp.json();
        if (!mounted) return;
        setEmployeeData(Array.isArray(data) ? data : data || []);
        setFilteredEmployeeData(Array.isArray(data) ? data : data || []);
      } catch (err) {
        console.error("Fetch error:", err);
        showAlert(
          "Error fetching employee data: " + (err.message || err),
          "Error"
        );
      }
    };

    fetchEmployeeData();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [BACKEND_URL, API_KEY, meId]);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      const q = (searchQuery || "").trim().toLowerCase();
      if (!q) {
        setFilteredEmployeeData(employeeData);
        return;
      }
      setFilteredEmployeeData(
        employeeData.filter(
          (emp) =>
            (emp.employee_name || "").toLowerCase().includes(q) ||
            (emp.employee_id || "").toLowerCase().includes(q)
        )
      );
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, employeeData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "employeeId") {
      const formattedValue = value.toUpperCase().startsWith("STS")
        ? value
        : `STS${value.replace(/\D/g, "")}`;
      setFormData((p) => ({ ...p, [name]: formattedValue }));
    } else if (name === "selectedMonth") {
      setSelectedMonth(value);
    } else if (name === "selectedYear") {
      setSelectedYear(value);
    } else if (name === "panNumber") {
      setFormData((p) => ({ ...p, [name]: (value || "").toUpperCase() }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const calculateSummary = () => {
    const earnings = [
      parseFloat(formData.basic) || 0,
      parseFloat(formData.hra) || 0,
      parseFloat(formData.otherAllowance) || 0,
    ];
    const deductions = [
      parseFloat(formData.pf) || 0,
      parseFloat(formData.esiInsurance) || 0,
      parseFloat(formData.professionalTax) || 0,
      parseFloat(formData.tds) || 0,
    ];
    const grossEarnings = earnings.reduce((s, v) => s + v, 0);
    const totalDeductions = deductions.reduce((s, v) => s + v, 0);
    const netSalary = grossEarnings - totalDeductions;
    return { grossEarnings, totalDeductions, netSalary };
  };

  const fieldLabels = {
    employeeName: "Employee Name",
    employeeId: "Employee ID",
    gender: "Gender",
    designation: "Designation",
    dateOfJoining: "Date of Joining",
    accountNo: "Account Number",
    workingDays: "Working Days",
    leavesTaken: "Leaves Taken",
    uinNo: "UIN No",
    panNumber: "PAN Number",
    esiNumber: "ESI Number",
    pfNumber: "PF Number",
    basic: "Basic",
    hra: "HRA",
    otherAllowance: "Other Allowance",
    pf: "PF",
    esiInsurance: "ESI/Insurance",
    professionalTax: "Professional Tax",
    tds: "TDS",
    grossEarnings: "Gross Earnings",
    totalDeductions: "Total Deductions",
    netSalary: "Net Salary",
    selectedMonth: "Month",
    selectedYear: "Year",
  };

  const validateForm = () => {
    const requiredFields = [
      "employeeName",
      "employeeId",
      "gender",
      "designation",
      "dateOfJoining",
      "accountNo",
      "workingDays",
      "leavesTaken",
      "uinNo",
      "panNumber",
      "basic",
      "hra",
      "otherAllowance",
      "tds",
    ];

    for (const field of requiredFields) {
      const val = (formData[field] || "").toString().trim();
      if (!val) return `Please fill in ${fieldLabels[field] || field}`;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (formData.dateOfJoining && !datePattern.test(formData.dateOfJoining))
      return "Date of Joining must be in YYYY-MM-DD format";

    const date = new Date(formData.dateOfJoining);
    if (formData.dateOfJoining && (isNaN(date.getTime()) || date > new Date()))
      return "Please enter a valid Date of Joining in YYYY-MM-DD format";

    const numericFields = [
      "workingDays",
      "leavesTaken",
      "basic",
      "hra",
      "otherAllowance",
      "pf",
      "esiInsurance",
      "professionalTax",
      "tds",
    ];
    for (const field of numericFields) {
      if (
        formData[field] &&
        (isNaN(parseFloat(formData[field])) || parseFloat(formData[field]) < 0)
      )
        return `${
          fieldLabels[field] || field
        } must be a valid non-negative number`;
    }

    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (formData.panNumber && !panPattern.test(formData.panNumber))
      return "PAN Number must be in the format AAAAA9999A (e.g., ABCDE1234F)";

    if (!["Male", "Female"].includes(formData.gender))
      return "Gender must be either Male or Female";

    if (!selectedMonth || selectedMonth < 1 || selectedMonth > 12)
      return "Please select a valid month (1-12)";
    if (
      !selectedYear ||
      selectedYear < 1900 ||
      selectedYear > new Date().getFullYear()
    )
      return "Please select a valid year";

    return null;
  };

  const prepareBackendData = () => {
    const { grossEarnings, totalDeductions, netSalary } = calculateSummary();
    return {
      employee_name: formData.employeeName || "",
      employee_id: formData.employeeId || "",
      gender: formData.gender || "",
      designation: formData.designation || "",
      date_of_joining: formData.dateOfJoining || "",
      account_no: formData.accountNo || "",
      working_days: parseInt(formData.workingDays) || 0,
      leaves_taken: parseInt(formData.leavesTaken) || 0,
      uin_no: formData.uinNo || "",
      pan_number: formData.panNumber || "",
      esi_number: formData.esiNumber || "",
      pf_number: formData.pfNumber || "",
      basic: parseFloat(formData.basic) || 0,
      hra: parseFloat(formData.hra) || 0,
      other_allowance: parseFloat(formData.otherAllowance) || 0,
      pf: parseFloat(formData.pf) || 0,
      esi_insurance: parseFloat(formData.esiInsurance) || 0,
      professional_tax: parseFloat(formData.professionalTax) || 0,
      tds: parseFloat(formData.tds) || 0,
      gross_earnings: grossEarnings || 0,
      total_deductions: totalDeductions || 0,
      net_salary: netSalary || 0,
      month: parseInt(selectedMonth) || 0,
      year: parseInt(selectedYear) || 0,
    };
  };

  const preparePayslipData = () => {
    const { grossEarnings, totalDeductions, netSalary } = calculateSummary();
    return {
      payrollData: {
        employee_name: formData.employeeName || "Unknown",
        employee_id: formData.employeeId || "STS001",
        designation: formData.designation || "N/A",
        joining_date:
          formData.dateOfJoining || new Date().toISOString().split("T")[0],
        uin_number: formData.uinNo || "N/A",
        basic_salary: parseFloat(formData.basic) || 0,
        hra: parseFloat(formData.hra) || 0,
        allowance: parseFloat(formData.otherAllowance) || 0,
        pf: parseFloat(formData.pf) || 0,
        insurance: parseFloat(formData.esiInsurance) || 0,
        pt: parseFloat(formData.professionalTax) || 0,
        tds: parseFloat(formData.tds) || 0,
        total_earnings: grossEarnings || 0,
        total_deductions: totalDeductions || 0,
        net_salary: netSalary || 0,
        special_allowance: 0,
        rnrbonus: 0,
        advance_taken: 0,
        advance_recovery: 0,
        salary_advance: 0,
      },
      selectedDate: {
        month: parseInt(selectedMonth) || 1,
        year: parseInt(selectedYear) || new Date().getFullYear(),
      },
      bankDetails: {
        account_number: formData.accountNo || "N/A",
        bank_name: "",
        esi_number: formData.esiNumber || "",
        pf_number: formData.pfNumber || "",
      },
      attendance: {
        total_working_days: parseInt(formData.workingDays) || 0,
        leave_count: parseInt(formData.leavesTaken) || 0,
      },
      employeeDetails: {
        gender: formData.gender || "N/A",
        pan_number: formData.panNumber || "N/A",
      },
    };
  };

  const handleEdit = (employee) => {
    setFormData({
      employeeName: employee.employee_name || "",
      employeeId: employee.employee_id || "STS001",
      gender: employee.gender || "",
      designation: employee.designation || "",
      dateOfJoining: employee.date_of_joining
        ? employee.date_of_joining.split("T")[0]
        : "",
      accountNo: employee.account_no || "",
      workingDays: employee.working_days
        ? employee.working_days.toString()
        : "",
      leavesTaken: employee.leaves_taken
        ? employee.leaves_taken.toString()
        : "",
      uinNo: employee.uin_no || "",
      panNumber: employee.pan_number || "",
      esiNumber: employee.esi_number || "",
      pfNumber: employee.pf_number || "",
      basic: employee.basic ? employee.basic.toString() : "",
      hra: employee.hra ? employee.hra.toString() : "",
      otherAllowance: employee.other_allowance
        ? employee.other_allowance.toString()
        : "",
      pf: employee.pf ? employee.pf.toString() : "",
      esiInsurance: employee.esi_insurance
        ? employee.esi_insurance.toString()
        : "",
      professionalTax: employee.professional_tax
        ? employee.professional_tax.toString()
        : "",
      tds: employee.tds ? employee.tds.toString() : "",
    });
    setSelectedMonth(employee.month || new Date().getMonth() + 1);
    setSelectedYear(employee.year || new Date().getFullYear());
    setEditingEmployeeId(employee.id);
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleSaveToBackend = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showAlert(validationError, "Validation Error");
      return;
    }

    if (!API_KEY || !BACKEND_URL) {
      showAlert(
        "API key or backend URL not configured.",
        "Configuration Error"
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const backendData = prepareBackendData();
    const isEditing = !!editingEmployeeId;
    const url = isEditing
      ? `${BACKEND_URL}/old-employee/edit`
      : `${BACKEND_URL}/old-employee/save`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const resp = await fetch(url, {
        method,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendData),
      });

      if (!resp.ok && resp.status !== 201) {
        const txt = await resp.text().catch(() => null);
        throw new Error(txt || `HTTP ${resp.status}`);
      }

      showAlert(
        isEditing
          ? "Employee data updated successfully!"
          : "Payslip data saved successfully!",
        "Success"
      );

      // refresh employee list
      const updatedResponse = await fetch(`${BACKEND_URL}/old-employee/list`, {
        headers,
      });
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setEmployeeData(
          Array.isArray(updatedData) ? updatedData : updatedData || []
        );
        setFilteredEmployeeData(
          Array.isArray(updatedData) ? updatedData : updatedData || []
        );
      } else {
        console.error("Failed to fetch updated employee list");
      }

      setShowModal(false);
      setFormData({
        employeeName: "",
        employeeId: "STS001",
        gender: "",
        designation: "",
        dateOfJoining: "",
        accountNo: "",
        workingDays: "",
        leavesTaken: "",
        uinNo: "",
        panNumber: "",
        esiNumber: "",
        pfNumber: "",
        basic: "",
        hra: "",
        otherAllowance: "",
        pf: "",
        esiInsurance: "",
        professionalTax: "",
        tds: "",
      });
      setSelectedMonth(new Date().getMonth() + 1);
      setSelectedYear(new Date().getFullYear());
      setEditingEmployeeId(null);
    } catch (err) {
      console.error("Save error:", err);
      showAlert(
        `Error ${isEditing ? "updating" : "saving"} employee data: ${
          err.message || err
        }`,
        "Error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showAlert(validationError, "Validation Error");
      return;
    }

    setError(null);
    setSuccess(null);
    const payslipData = preparePayslipData();

    try {
      const pdfBlob = await generatePayslipPDF(
        payslipData.payrollData,
        payslipData.selectedDate,
        payslipData.bankDetails,
        payslipData.attendance,
        payslipData.employeeDetails,
        false
      );

      if (
        !pdfBlob ||
        (!(pdfBlob instanceof Blob) && !(pdfBlob instanceof ArrayBuffer))
      ) {
        throw new Error(
          "Failed to generate PDF preview: pdfBlob is invalid or null"
        );
      }

      const url = URL.createObjectURL(
        pdfBlob instanceof Blob
          ? pdfBlob
          : new Blob([pdfBlob], { type: "application/pdf" })
      );
      setPdfUrl(url);
      setPreview(true);
      setShowModal(true);
    } catch (err) {
      console.error("Preview error:", err);
      setError("Failed to generate PDF preview: " + (err.message || err));
      showAlert(
        "Failed to generate PDF preview: " + (err.message || err),
        "Error"
      );
    }
  };

  const handleDownloadPDF = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showAlert(validationError, "Validation Error");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const payslipData = preparePayslipData();

    try {
      await generatePayslipPDF(
        payslipData.payrollData,
        payslipData.selectedDate,
        payslipData.bankDetails,
        payslipData.attendance,
        payslipData.employeeDetails,
        true
      );
      setSuccess("Payslip downloaded successfully!");
      showAlert("Payslip downloaded successfully!", "Success");
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download PDF: " + (err.message || err));
      showAlert("Failed to download PDF: " + (err.message || err), "Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadForEmployee = async (employee) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payslipData = {
        payrollData: {
          employee_id: employee.employee_id,
          employee_name: employee.employee_name,
          designation: employee.designation,
          basic: employee.basic,
          hra: employee.hra,
          other_allowance: employee.other_allowance,
          pf: employee.pf,
          esi_insurance: employee.esi_insurance,
          professional_tax: employee.professional_tax,
          tds: employee.tds,
        },
        selectedDate: {
          month: employee.month || new Date().getMonth() + 1,
          year: employee.year || new Date().getFullYear(),
        },
        bankDetails: {
          account_no: employee.account_no,
          uin_no: employee.uin_no,
          pan_number: employee.pan_number,
          esi_number: employee.esi_number,
          pf_number: employee.pf_number,
        },
        attendance: {
          working_days: employee.working_days,
          leaves_taken: employee.leaves_taken,
        },
        employeeDetails: {
          gender: employee.gender,
          date_of_joining: employee.date_of_joining,
        },
      };

      const pdfBlob = await generatePayslipPDF(
        payslipData.payrollData,
        payslipData.selectedDate,
        payslipData.bankDetails,
        payslipData.attendance,
        payslipData.employeeDetails,
        true
      );

      if (
        !pdfBlob ||
        (!(pdfBlob instanceof Blob) && !(pdfBlob instanceof ArrayBuffer))
      ) {
        throw new Error("Failed to generate a valid PDF");
      }

      const blob =
        pdfBlob instanceof Blob
          ? pdfBlob
          : new Blob([pdfBlob], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip_${employee.employee_id}_${payslipData.selectedDate.month}_${payslipData.selectedDate.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setSuccess(
        `Payslip for ${employee.employee_name} downloaded successfully!`
      );
      showAlert(
        `Payslip for ${employee.employee_name} downloaded successfully!`,
        "Success"
      );
    } catch (err) {
      console.error("Download error:", err);
      showAlert(
        `Error downloading payslip for ${employee.employee_name}: ${
          err.message || err
        }`,
        "Error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const detailFields = [
    "accountNo",
    "workingDays",
    "leavesTaken",
    "uinNo",
    "panNumber",
    "esiNumber",
    "pfNumber",
    "basic",
    "hra",
    "otherAllowance",
    "pf",
    "esiInsurance",
    "professionalTax",
    "tds",
    "grossEarnings",
    "totalDeductions",
    "netSalary",
  ];

  const tableHeaders = [
    "Employee Name",
    "Employee ID",
    "Gender",
    "Designation",
    "Date of Joining",
    "Bank Details",
    "Edit Data",
    "Download",
  ];

  // layout helper for form rows
  const fieldKeys = Object.keys(formData).concat([
    "selectedMonth",
    "selectedYear",
  ]);
  const rows = [];
  for (let i = 0; i < fieldKeys.length; i += 3)
    rows.push(fieldKeys.slice(i, i + 3));

  return (
    <div className="generatePayslip-container">
      <div className="generatePayslip-header">
        <div className="generatePayslip-search-container">
          <i className="fas fa-search generatePayslip-search-icon" />
          <input
            type="text"
            className="generatePayslip-search-input"
            placeholder="Search by name or employee ID"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <button
          className="generatePayslip-create-btn"
          onClick={() => {
            setShowModal(true);
            setPreview(false);
            setError(null);
            setSuccess(null);
            setEditingEmployeeId(null);
            setFormData({
              employeeName: "",
              employeeId: "STS001",
              gender: "",
              designation: "",
              dateOfJoining: "",
              accountNo: "",
              workingDays: "",
              leavesTaken: "",
              uinNo: "",
              panNumber: "",
              esiNumber: "",
              pfNumber: "",
              basic: "",
              hra: "",
              otherAllowance: "",
              pf: "",
              esiInsurance: "",
              professionalTax: "",
              tds: "",
            });
            setSelectedMonth(new Date().getMonth() + 1);
            setSelectedYear(new Date().getFullYear());
          }}
        >
          Create Payslip
        </button>
      </div>

      <div className="generatePayslip-table-container">
        <table className="generatePayslip-table">
          <thead>
            <tr>
              {tableHeaders.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredEmployeeData.map((employee) => (
              <tr key={employee.id || employee.employee_id}>
                <td>{employee.employee_name}</td>
                <td>{employee.employee_id}</td>
                <td>{employee.gender}</td>
                <td>{employee.designation}</td>
                <td>{(employee.date_of_joining || "").split("T")[0]}</td>
                <td>
                  <button
                    className="generatePayslip-view-btn"
                    onClick={() => handleViewDetails(employee)}
                    title="View Bank Details"
                  >
                    <i className="fas fa-eye" />
                  </button>
                </td>
                <td>
                  <button
                    className="generatePayslip-edit-btn"
                    onClick={() => handleEdit(employee)}
                    title="Edit Payslip"
                  >
                    <i className="fas fa-pencil-alt" />
                  </button>
                </td>
                <td>
                  <button
                    className="generatePayslip-download-btn"
                    onClick={() => handleDownloadForEmployee(employee)}
                    title="Download Payslip PDF"
                    disabled={isLoading}
                  >
                    <i className="fas fa-download" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="generatePayslip-popup-overlay">
          <div className="generatePayslip-popup-box">
            <button
              className="generatePayslip-popup-close-btn"
              onClick={() => {
                setShowModal(false);
                setPreview(false);
                setError(null);
                setSuccess(null);
                if (pdfUrl) {
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                }
                setEditingEmployeeId(null);
                setSelectedMonth(new Date().getMonth() + 1);
                setSelectedYear(new Date().getFullYear());
              }}
            >
              ×
            </button>

            <h3 className="generatePayslip-popup-title">
              {preview
                ? "Payslip Preview"
                : editingEmployeeId
                ? "Edit Payslip Details"
                : "Enter Payslip Details"}
            </h3>

            {error && <p className="generatePayslip-error">{error}</p>}
            {success && <p className="generatePayslip-success">{success}</p>}

            {preview ? (
              <div className="generatePayslip-preview">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    width="100%"
                    height="500px"
                    title="Payslip Preview"
                    style={{ border: "none" }}
                  />
                ) : (
                  <p>Loading preview...</p>
                )}
              </div>
            ) : (
              <div className="generatePayslip-popup-form">
                {rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="generatePayslip-form-row">
                    {row.map((field) => (
                      <div key={field} className="generatePayslip-form-group">
                        <label
                          htmlFor={field}
                          className="generatePayslip-form-label"
                        >
                          {fieldLabels[field]}
                          {[
                            "employeeName",
                            "employeeId",
                            "gender",
                            "designation",
                            "dateOfJoining",
                            "accountNo",
                            "workingDays",
                            "leavesTaken",
                            "uinNo",
                            "panNumber",
                            "basic",
                            "hra",
                            "otherAllowance",
                            "tds",
                          ].includes(field) && (
                            <span className="generatePayslip-required"> *</span>
                          )}
                        </label>

                        {field === "selectedMonth" ? (
                          <select
                            id="selectedMonth"
                            name="selectedMonth"
                            value={selectedMonth}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                          >
                            <option value="">Select Month</option>
                            {[...Array(12)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString("default", {
                                  month: "long",
                                })}
                              </option>
                            ))}
                          </select>
                        ) : field === "selectedYear" ? (
                          <input
                            id="selectedYear"
                            name="selectedYear"
                            value={selectedYear}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                            placeholder="Enter Year (e.g., 2025)"
                            type="number"
                          />
                        ) : field === "gender" ? (
                          <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        ) : field === "panNumber" ? (
                          <input
                            id="panNumber"
                            name="panNumber"
                            value={formData.panNumber}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                            placeholder="e.g., ABCDE1234F"
                            maxLength={10}
                            type="text"
                          />
                        ) : (
                          <input
                            id={field}
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            className="generatePayslip-popup-input"
                            placeholder={
                              field === "dateOfJoining"
                                ? "YYYY-MM-DD"
                                : field === "employeeId"
                                ? "STS001"
                                : `Enter ${fieldLabels[field]}`
                            }
                            type={
                              field === "dateOfJoining"
                                ? "text"
                                : [
                                    "workingDays",
                                    "leavesTaken",
                                    "basic",
                                    "hra",
                                    "otherAllowance",
                                    "pf",
                                    "esiInsurance",
                                    "professionalTax",
                                    "tds",
                                  ].includes(field)
                                ? "number"
                                : "text"
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="generatePayslip-form-buttons">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPreview(false);
                  setError(null);
                  setSuccess(null);
                  if (pdfUrl) {
                    URL.revokeObjectURL(pdfUrl);
                    setPdfUrl(null);
                  }
                  setEditingEmployeeId(null);
                  setSelectedMonth(new Date().getMonth() + 1);
                  setSelectedYear(new Date().getFullYear());
                }}
                className="generatePayslip-cancel-btn"
                disabled={isLoading}
              >
                Cancel
              </button>

              {preview ? (
                <>
                  <button
                    onClick={handleSaveToBackend}
                    className="generatePayslip-save-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="generatePayslip-download-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "Downloading..." : "Download"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveToBackend}
                    className="generatePayslip-save-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handlePreview}
                    className="generatePayslip-preview-btn"
                    disabled={isLoading}
                  >
                    Preview
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {viewDetailsModal.isVisible && viewDetailsModal.employee && (
        <Modal
          isVisible={viewDetailsModal.isVisible}
          onClose={closeViewDetails}
          buttons={[{ label: "Close", onClick: closeViewDetails }]}
        >
          <h3 className="generatePayslip-details-title">
            Bank and Salary Details for{" "}
            {viewDetailsModal.employee.employee_name}
          </h3>
          <div className="generatePayslip-details-container">
            <table className="generatePayslip-details-table">
              <thead>
                <tr>
                  <th className="generatePayslip-details-header">Field</th>
                  <th className="generatePayslip-details-header">Value</th>
                </tr>
              </thead>
              <tbody>
                {detailFields.map((field) => (
                  <tr key={field}>
                    <td className="generatePayslip-details-cell">
                      {fieldLabels[field]}
                    </td>
                    <td className="generatePayslip-details-cell">
                      {field === "accountNo" &&
                        (viewDetailsModal.employee.account_no || "-")}
                      {field === "workingDays" &&
                        (viewDetailsModal.employee.working_days || 0)}
                      {field === "leavesTaken" &&
                        (viewDetailsModal.employee.leaves_taken || 0)}
                      {field === "uinNo" &&
                        (viewDetailsModal.employee.uin_no || "-")}
                      {field === "panNumber" &&
                        (viewDetailsModal.employee.pan_number || "-")}
                      {field === "esiNumber" &&
                        (viewDetailsModal.employee.esi_number || "-")}
                      {field === "pfNumber" &&
                        (viewDetailsModal.employee.pf_number || "-")}
                      {field === "basic" &&
                        (viewDetailsModal.employee.basic || 0)}
                      {field === "hra" && (viewDetailsModal.employee.hra || 0)}
                      {field === "otherAllowance" &&
                        (viewDetailsModal.employee.other_allowance || 0)}
                      {field === "pf" && (viewDetailsModal.employee.pf || 0)}
                      {field === "esiInsurance" &&
                        (viewDetailsModal.employee.esi_insurance || 0)}
                      {field === "professionalTax" &&
                        (viewDetailsModal.employee.professional_tax || 0)}
                      {field === "tds" && (viewDetailsModal.employee.tds || 0)}
                      {field === "grossEarnings" &&
                        (viewDetailsModal.employee.gross_earnings || 0)}
                      {field === "totalDeductions" &&
                        (viewDetailsModal.employee.total_deductions || 0)}
                      {field === "netSalary" &&
                        (viewDetailsModal.employee.net_salary || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <h3>{alertModal.title}</h3>
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
}
