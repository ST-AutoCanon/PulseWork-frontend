"use client";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import Modal from "../Modal/Modal.client";
import { VALID_SALARY_HEADERS } from "../constants/salarystatement";
import { useAuth } from "../../context/AuthProvider.client"; // Adjust path if needed
import "./Salary_Statement.css";

const Salary_Statement = () => {
  const { user } = useAuth();
  const meId = user?.employeeId ?? null;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ""; // <-- added
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const headers = {
    "x-api-key": API_KEY || "",
    "x-employee-id": String(meId || ""),
  };

  // --- States that were missing or mismatched in your snippet
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");
  const [tableData, setTableData] = useState([]); // array of rows (array)
  const [tableHeaders, setTableHeaders] = useState([]); // replaces `header` / setHeader
  const [invalidCells, setInvalidCells] = useState(new Map());
  const [updatedCells, setUpdatedCells] = useState(new Map());
  const [previousData, setPreviousData] = useState(null);
  const [prevTableData, setPrevTableData] = useState([]); // <-- added, used by readExcel/validate
  const [error, setError] = useState("");
  const [salaryData, setSalaryData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]); // <-- added
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [isMonthYearSelected, setIsMonthYearSelected] = useState(false);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const [uploadMessage, setUploadMessage] = useState(""); // <-- added
  const [selectedMonthYearData, setSelectedMonthYearData] = useState([]); // <-- added because you call setSelectedMonthYearData
  const templateUrl = "/templates/Statement_Template.xlsx";
  const [excelData, setExcelData] = useState([]);
  const [showNote, setShowNote] = useState(true);

  // ----------------------------
  // Helper functions
  // ----------------------------
  const parseNumeric = (val) => {
    if (val === "" || val === null || val === undefined) return 0;
    return isNaN(Number(val)) ? 0 : Number(val);
  };

  const getCurrentMonthYear = () => {
    const date = new Date();
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return { month, year };
  };

  const validateHeaders = (uploadedHeaders) => {
    if (!uploadedHeaders || uploadedHeaders.length === 0) {
      setError("❌ No headers found in the uploaded file.");
      return false;
    }
    const formattedUploadedHeaders = uploadedHeaders.map((header) =>
      header ? header.trim().toLowerCase() : ""
    );
    const formattedValidHeaders = VALID_SALARY_HEADERS.map((header) =>
      header.trim().toLowerCase()
    );
    return (
      formattedUploadedHeaders.length === formattedValidHeaders.length &&
      formattedUploadedHeaders.every(
        (header, index) => header === formattedValidHeaders[index]
      )
    );
  };

  // ----------------------------
  // File handling + parsing
  // ----------------------------
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      setFileName("No file chosen");
      setError("");
      setShowNote(true);
      return;
    }
    setShowNote(false);
    event.target.value = "";
    const { month, year } = getCurrentMonthYear();
    const fileNameLower = selectedFile.name.toLowerCase();
    if (!fileNameLower.includes(year.toString())) {
      setError(`❌ Wrong year in filename. Expected: ${year}`);
      setFileName("Invalid file");
      setTableData([]);
      setInvalidCells(new Map());
      setUpdatedCells(new Map());
      return;
    }
    if (!fileNameLower.includes(month.toLowerCase())) {
      setError(`❌ Wrong month in filename. Expected: ${month}`);
      setFileName("Invalid file");
      setTableData([]);
      setInvalidCells(new Map());
      setUpdatedCells(new Map());
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError("");
    readExcel(selectedFile);
  };

  const cleanKeys = (obj) => {
    const cleaned = {};
    Object.keys(obj).forEach((key) => {
      const trimmedKey = key?.trim?.() ?? key;
      cleaned[trimmedKey] = obj[key];
    });
    return cleaned;
  };

  const convertExcelDate = (serial) => {
    // keep your robust conversion but guard for non-number
    if (serial === null || serial === undefined) return serial;
    if (typeof serial === "string") {
      // already a string, maybe ISO or Excel formatted string
      return serial;
    }
    if (typeof serial !== "number" || !isFinite(serial)) {
      console.warn("⚠️ Skipped date conversion for:", serial);
      return serial;
    }
    try {
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(
        excelEpoch.setDate(excelEpoch.getDate() + serial - 2)
      );
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("❌ Error converting date for:", serial, error);
      return serial;
    }
  };

  const readExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      // parsedRows preserves keys (object per row)
      const parsedRows = rows.map((row) => {
        const cleaned = cleanKeys(row);
        const rawDate = cleaned["Joining Date"];
        const joiningDate = convertExcelDate(rawDate);
        return {
          ...cleaned,
          "Joining Date": joiningDate,
          PT: cleaned["PT"] ?? 0,
          ESI: cleaned["ESI"] ?? 0,
          TDS: cleaned["TDS"] ?? 0,
          "Advance recovery": cleaned["Advance recovery"] ?? 0,
          "Total Deductions": cleaned["Total Deductions"] ?? 0,
          "Net Salary": cleaned["Net Salary"] ?? 0,
        };
      });

      if (!jsonData || jsonData.length === 0) {
        setError("❌ Empty file or invalid format");
        setTableData([]);
        setInvalidCells(new Map());
        setUpdatedCells(new Map());
        return;
      }

      const extractedHeaders = jsonData[0].map((h) =>
        typeof h === "string" ? h.trim() : h
      ); // normalized header row
      if (!validateHeaders(extractedHeaders)) {
        setError("❌ Headers not matched");
        setTableData([]);
        setInvalidCells(new Map());
        setUpdatedCells(new Map());
        return;
      }

      const validData = jsonData
        .slice(1)
        .filter((row) => row && row.length > 0);
      // use prevTableData state (if exists)
      const prevDataForCompare = prevTableData.length
        ? prevTableData
        : validData;

      const { invalidCells: invalidMap, updatedCells: updatedMap } =
        validateData(validData, extractedHeaders, prevDataForCompare);

      setTableHeaders(extractedHeaders);
      const cleanedTableData = parsedRows.map((row) =>
        extractedHeaders.map((header) => row[header] ?? "")
      );
      setTableData(cleanedTableData);
      setPrevTableData(validData);
      setExcelData(parsedRows);
      setInvalidCells(invalidMap);
      setUpdatedCells(updatedMap);
      setFilteredData(cleanedTableData); // initialize filtered view
    };
    reader.readAsArrayBuffer(file);
  };

  // ----------------------------
  // Data validation
  // ----------------------------
  const detectColumnTypes = (headers) => {
    if (!Array.isArray(headers)) return [];
    return headers.map((header) => {
      const h = (header ?? "").toString().toLowerCase().trim();
      if (h === "joining date") return "date";
      if (
        [
          "uin number",
          "basic salary",
          "hra",
          "allowance",
          "special allowance",
          "rnr/bonus",
          "total",
          "salary advance",
          "pf",
          "esi",
          "pt",
          "advance recovery",
          "tds",
          "total deductions",
          "net payable",
        ].includes(h)
      ) {
        return "number";
      }
      return "string";
    });
  };

  const normalizeHeaders = (headers) => {
    if (!headers) return [];
    return headers.map((h) =>
      typeof h === "string" ? h.trim().toLowerCase() : h
    );
  };

  // Use tableHeaders (not `header`) here:
  const actualHeaders = normalizeHeaders(tableHeaders);

  const validateData = (jsonData, headers, prevData = []) => {
    const invalidCells = new Map();
    const updatedCells = new Map();

    if (!Array.isArray(jsonData)) return { invalidCells, updatedCells };

    jsonData.forEach((row, rowIndex) => {
      if (!row || !Array.isArray(row)) return;
      row.forEach((cell, colIndex) => {
        let isInvalid = false;
        let isUpdated = false;
        let formattedCell = cell;
        const columnName = headers?.[colIndex];

        if (columnName === "Employee ID") {
          const empIdPattern = /^STS\d{3}$/;
          if (!empIdPattern.test(String(cell))) {
            isInvalid = true;
          }
        }

        if (
          ["Employee Name", "Department", "Designation"].includes(columnName)
        ) {
          const namePattern = /^[A-Za-z\s.]+$/;
          if (!namePattern.test(String(cell)) || String(cell).trim() === "") {
            isInvalid = true;
          }
        }

        if (
          [
            "UIN Number",
            "Basic Salary",
            "HRA",
            "Allowance",
            "Special Allowance",
            "RNR/Bonus",
            "Total",
            "Salary Advance",
            "Total Earnings",
            "PF",
            "Insurance",
            "PT",
            "ESI",
            "Advance recovery",
            "TDS",
            "Total Deductions",
            "Net Salary",
          ].includes(columnName)
        ) {
          if (isNaN(cell) || cell === "") {
            isInvalid = true;
          }
        }

        if (columnName === "Joining Date") {
          const originalValue = cell;
          formattedCell = convertExcelDate(cell);
          if (!formattedCell || !/^\d{4}-\d{2}-\d{2}$/.test(formattedCell)) {
            isInvalid = true;
          } else {
            row[colIndex] = formattedCell;
          }
        }

        if (prevData[rowIndex]) {
          let prevCell = prevData[rowIndex][colIndex];
          if (
            columnName === "Joining Date" &&
            !/^\d{4}-\d{2}-\d{2}$/.test(prevCell)
          ) {
            prevCell = convertExcelDate(prevCell);
          }
          if (prevCell !== formattedCell) {
            isUpdated = true;
          }
        }

        if (isInvalid) {
          if (!invalidCells.has(rowIndex))
            invalidCells.set(rowIndex, new Set());
          invalidCells.get(rowIndex).add(colIndex);
        }

        if (isUpdated) {
          if (!updatedCells.has(rowIndex))
            updatedCells.set(rowIndex, new Set());
          updatedCells.get(rowIndex).add(colIndex);
        }
      });
    });

    return { invalidCells, updatedCells };
  };

  // ----------------------------
  // Upload / API calls
  // ----------------------------
  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  const handleUpload = async () => {
    console.log("📂 handleUpload() called. File:", file?.name);
    if (!file) {
      setError("❌ Please select a valid file to upload!");
      setTableData([]);
      setSelectedMonthYearData([]);
      setSelectedMonth("");
      setSelectedYear("");
      setIsMonthYearSelected(false);
      setTableData([]);
      showAlert("❌ Please select a valid file to upload!", "No File Selected");
      return;
    }

    // Verify no invalid cells
    console.log("🔍 Checking invalidCells:", invalidCells);
    if (invalidCells.size > 0) {
      let errorMessage =
        "❌ Cannot save due to invalid data in the following cells:\n";
      invalidCells.forEach((colSet, rowIndex) => {
        colSet.forEach((colIndex) => {
          const columnName = tableHeaders[colIndex] || `Column ${colIndex + 1}`;
          errorMessage += `- Row ${rowIndex + 2}, ${columnName}\n`;
        });
      });
      errorMessage +=
        "Please correct the highlighted (red) cells in the table and try again.";
      setError(errorMessage);
      showAlert(errorMessage, "Invalid Data Detected");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      console.log("📤 Sending FormData with file:", file.name);

      const response = await axios.post(
        `${BACKEND_URL}/salary/upload`,
        formData,
        { headers: { ...headers, "Content-Type": "multipart/form-data" } }
      );
      console.log("📥 Backend Response:", response.data);

      if (response.data.message) {
        const successMessage = response.data.message;
        setError("");
        showAlert(successMessage, "Upload Successful");
        setIsFileUploaded(true);
        setIsMonthYearSelected(false);
        setFile(null);
        setFileName("No file chosen");
        setTableData([]);
        setTableHeaders([]); // replaced setHeader
        setInvalidCells(new Map());
        setUpdatedCells(new Map());
        setExcelData([]);
        setPrevTableData([]);
        setShowNote(true);
        setUploadMessage(successMessage);
      } else if (response.data.error) {
        const errorMsg = response.data.error;
        setError(`❌ Upload failed: ${errorMsg}`);
        showAlert(`❌ Upload failed: ${errorMsg}`, "Upload Error");
      } else {
        const errorMsg = "Unexpected response from server";
        setError(`❌ Upload failed: ${errorMsg}`);
        showAlert(`❌ Upload failed: ${errorMsg}`, "Upload Error");
      }
    } catch (err) {
      console.error("❌ Error uploading file:", err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Unknown server error";
      setError(`❌ Upload failed: ${errorMsg}`);
      showAlert(`❌ Upload failed: ${errorMsg}`, "Upload Error");
    }
  };

  const calculateTotalSalary = () => {
    if (
      !tableData ||
      tableData.length === 0 ||
      !tableHeaders ||
      tableHeaders.length === 0
    ) {
      return 0;
    }
    const netSalaryIndex = tableHeaders.findIndex(
      (header) => header?.trim?.().toLowerCase() === "net salary"
    );
    if (netSalaryIndex === -1) {
      return 0;
    }
    let total = 0;
    tableData.forEach((row) => {
      const salary = parseFloat(
        String(row[netSalaryIndex] ?? "").replace(/,/g, "")
      );
      if (!isNaN(salary)) {
        total += salary;
      }
    });
    return total;
  };

  const calculateTotalNetSalary = () => {
    if (!salaryData || salaryData.length === 0) {
      return "0.00";
    }
    const totalSalary = salaryData.reduce((total, row) => {
      let salary = row["Net Salary"] || row["net_salary"] || row["netSalary"];
      if (salary) {
        salary = parseFloat(String(salary).replace(/,/g, "")) || 0;
        return total + salary;
      }
      return total;
    }, 0);
    return totalSalary.toFixed(2);
  };

  // ----------------------------
  // Month/year UI helpers + fetchers
  // ----------------------------
  const generateMonthYearOptions = () => {
    const options = [];
    const current = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      options.push({
        label: `${month} ${year}`,
        value: `${month}_${year}`,
      });
    }
    return options;
  };

  const handleMonthYearChange = async (event) => {
    const [month, year] = event.target.value.split("_");
    setSelectedMonth(month);
    setSelectedYear(year);
    setIsMonthYearSelected(true);
    setIsFileUploaded(false);
    setError("");
    await fetchSalaryStatement(month, year);
  };

  const fetchSalaryStatement = async (month, year) => {
    if (!month || !year) return;
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/salary-statement/${month.toLowerCase()}/${year}`,
        { headers }
      );
      console.log("Salary statement response:", response.data);
      if (response.data && response.data.length > 0) {
        setTableData(response.data);
        setTableHeaders(Object.keys(response.data[0]));
        setError("");
      } else {
        setTableData([]);
        setTableHeaders([]);
      }
    } catch (err) {
      console.error("Error fetching salary statement:", err);
    }
  };

  useEffect(() => {
    const { month, year } = (() => {
      const date = new Date();
      const lastMonthDate = new Date(
        date.getFullYear(),
        date.getMonth() - 1,
        1
      );
      const month = lastMonthDate.toLocaleString("default", { month: "short" });
      const year = lastMonthDate.getFullYear();
      return { month, year };
    })();

    setSelectedMonth(month);
    setSelectedYear(year);
    setIsMonthYearSelected(true);
    fetchSalaryStatement(month, year);
  }, []);

  // fetchSalaryData uses the selectedMonth/selectedYear (fixed)
  const fetchSalaryData = async (
    month = selectedMonth,
    year = selectedYear
  ) => {
    if (!month || !year) return;
    console.log("Fetching Salary Data for:", month, year);
    try {
      const apiUrl = `${BACKEND_URL}/api/salary-statement/${month.toLowerCase()}/${year}`;
      console.log("API Request URL:", apiUrl);
      const response = await axios.get(apiUrl, { headers });
      console.log("Full API Response:", response.data);
      if (
        response.data &&
        response.data.salary_statement &&
        response.data.salary_statement.length > 0
      ) {
        setSalaryData(response.data.salary_statement);
        setFilteredData(response.data.salary_statement);
        console.log("Salary Data Set:", response.data.salary_statement);
      } else {
        setSalaryData([]);
        setFilteredData([]);
        console.warn("⚠ Debug: No salary data found");
      }
    } catch (error) {
      console.error(
        "Error fetching salary data:",
        error.response?.data || error.message
      );
      setSalaryData([]);
      setFilteredData([]);
    }
  };

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchSalaryData(selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear]);

  // ----------------------------
  // Search / filter handlers (fixed to use filteredData state)
  // ----------------------------
  const filterSalaryData = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    const filtered = salaryData.filter((row) =>
      Object.values(row).some((cell) =>
        String(cell ?? "")
          .toLowerCase()
          .includes(searchValue)
      )
    );
    setFilteredData(filtered);
  };

  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    if (!searchValue) {
      setFilteredData(tableData);
      return;
    }
    const employeeIdIndex = tableHeaders.indexOf("Employee ID");
    const employeeNameIndex = tableHeaders.indexOf("Employee Name");
    const filtered = tableData.filter((row) =>
      row.some((cell, index) => {
        const cellValue = String(cell ?? "").toLowerCase();
        if (index === employeeIdIndex || index === employeeNameIndex) {
          return cellValue.includes(searchValue);
        }
        return false;
      })
    );
    setFilteredData(filtered);
  };

  const formatHeader = (header) => {
    const h = String(header ?? "");
    return h.charAt(0).toUpperCase() + h.slice(1).toLowerCase();
  };

  // ----------------------------
  // JSX
  // ----------------------------
  return (
    <div className="salary-container">
      <div className="upload-container">
        {showNote && (
          <p className="file-note">
            📌 Filename format should include <strong>Month-Year</strong> (e.g.,{" "}
            <strong>EmpDetails_MAR_2025.xlsx</strong>).
          </p>
        )}
        <div className="upload-box-payslip">
          <label className="file-label">
            <div className="upload-text">
              <p className="upload-title">Upload a Salary Sheet</p>
              <p className="file-name">{fileName || "No file chosen"}</p>
            </div>
            <img
              src="/images/upload.png"
              alt="Upload Icon"
              className="upload-icon"
            />
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileChange}
              hidden
            />
          </label>
        </div>

        <div className="salary-month-year-selector-box">
          <div className="salary-month-year-selector">
            <label>Select Month & Year:</label>
            {selectedMonth && selectedYear && (
              <select
                value={`${selectedMonth}_${selectedYear}`}
                onChange={handleMonthYearChange}
                className="salary-month-year-dropdown"
              >
                {generateMonthYearOptions().map((option, index) => (
                  <option key={index} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div
          style={{ minHeight: "30px", display: "flex", alignItems: "center" }}
        >
          {error && (
            <p
              className="error-message-for-uploadfile"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="reference-container">
        <div className="reference-box">
          <p className="reference-text">Template For Your Reference</p>
          <button
            className="download-template-btn"
            onClick={() => {
              const link = document.createElement("a");
              link.href = templateUrl;
              link.download = "Salary_Statement_Template.xlsx";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            📥 Download
          </button>
        </div>
      </div>

      {tableData.length > 0 ? (
        <div className="salary-table-container">
          <div className="table-scroll-wrapper">
            <div className="table-header">
              <h2 className="table-heading">Employee Data</h2>
              <input
                type="text"
                placeholder="Search Employee..."
                value={searchTerm}
                onChange={handleSearch}
                className="admin-search-box"
              />
              <button className="upload-btn" onClick={handleUpload}>
                Save Data
              </button>
            </div>

            <div className="salary-table-wrapper">
              <table className="salary-table">
                <thead>
                  <tr>
                    {tableHeaders.map((hdr, index) => (
                      <th key={index}>{hdr}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(searchTerm ? filteredData : tableData).map(
                    (row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => {
                          const isInvalid =
                            invalidCells.has(rowIndex) &&
                            invalidCells.get(rowIndex).has(colIndex);
                          const isUpdated =
                            updatedCells.has(rowIndex) &&
                            updatedCells.get(rowIndex).has(colIndex);
                          return (
                            <td
                              key={colIndex}
                              style={{
                                backgroundColor: isInvalid
                                  ? "red"
                                  : isUpdated
                                  ? "lightgreen"
                                  : "white",
                              }}
                            >
                              {cell}
                            </td>
                          );
                        })}
                      </tr>
                    )
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={tableHeaders.length} className="sticky-footer">
                      Total Amount: {calculateTotalSalary()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : salaryData.length > 0 ? (
        <div>
          <div className="admin-table-container">
            <div className="table-scroll-wrapper">
              <div className="table-header">
                <h2 className="table-title">
                  Salary Statement - {selectedMonth?.toUpperCase()}{" "}
                  {selectedYear}
                </h2>
                <input
                  type="text"
                  className="salary-search-box"
                  placeholder="Search..."
                  onChange={filterSalaryData}
                />
              </div>

              <div className="adminsalary-table-container">
                <table className="adminsalary-table">
                  <thead>
                    <tr>
                      {Object.keys(salaryData[0] || {}).map((key) => (
                        <th key={key}>{formatHeader(key)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(searchTerm ? filteredData : salaryData).map(
                      (row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, idx) => (
                            <td key={idx}>{value ?? "N/A"}</td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colSpan={Object.keys(salaryData[0] || {}).length}
                        className="net-salary-row"
                      >
                        Total Amount: ₹ {Math.floor(calculateTotalNetSalary())}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <Modal
            isVisible={alertModal.isVisible}
            onClose={closeAlert}
            buttons={[{ label: "OK", onClick: closeAlert }]}
          >
            <p>{alertModal.message}</p>
          </Modal>
        </div>
      ) : null}

      {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
    </div>
  );
};

export default Salary_Statement;
