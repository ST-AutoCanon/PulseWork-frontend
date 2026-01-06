"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "./HolidayCalendar.module.css";
import axios from "axios";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { useAuth } from "../../context/AuthProvider.client";
import { FiUpload, FiDownload } from "react-icons/fi";
import { BsFileEarmarkSpreadsheet } from "react-icons/bs";
import * as XLSX from "xlsx";

const HolidayCalendar = ({ closeCalendar }) => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [date, setDate] = useState(new Date());
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileNote, setFileNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [validatedRowCount, setValidatedRowCount] = useState(0);
  const fileInputRef = useRef(null);
  const parsedRowsRef = useRef(null);

  const currentYear = new Date().getFullYear();

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const role = user?.role || "Employee";

  const headers = useMemo(() => {
    return {
      "x-api-key": API_KEY ?? "",
      ...(user?.employeeId ? { "x-employee-id": user.employeeId } : {}),
      ...(user?.orgId ? { "x-org-id": user.orgId } : {}),
    };
  }, [API_KEY, user?.employeeId, user?.orgId]);

  const fetchHolidays = async (cancelToken) => {
    try {
      const config = { withCredentials: true, headers };
      if (cancelToken) config.cancelToken = cancelToken;
      const res = await axios.get(`${BACKEND_URL}/holidays`, config);
      const data = res?.data?.message ?? res?.data ?? [];
      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("Error fetching holidays:", err);
      if (Array.isArray(user?.holidays) && user.holidays.length > 0) {
        setHolidays(user.holidays);
        return;
      }
      setHolidays([]);
    }
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    fetchHolidays(source.token);

    return () => {
      source.cancel("HolidayCalendar unmounted");
    };
  }, [BACKEND_URL, headers]);

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchWithCancel = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/holidays${orgQuery}`, {
          withCredentials: true,
          headers,
          cancelToken: source.token,
        });
        const data = res?.data?.message ?? res?.data ?? [];
        setHolidays(Array.isArray(data) ? data : []);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Error fetching holidays:", err);
        if (Array.isArray(user?.holidays) && user.holidays.length > 0) {
          setHolidays(user.holidays);
          return;
        }
        setHolidays([]);
      }
    };

    fetchWithCancel();
    return () => {
      source.cancel("HolidayCalendar unmounted");
    };
  }, [BACKEND_URL, user?.orgId, user?.holidays]);

  const getHoliday = (d) =>
    holidays.find(
      (h) => new Date(h.date).toDateString() === new Date(d).toDateString()
    );

  const hasOptionalHolidays = holidays.some((h) => h.type === "Optional");
  const hasCompanyHolidays = holidays.some((h) => h.type === "Company");
  const showLegend = hasOptionalHolidays && hasCompanyHolidays;

  const tileClassName = ({ date: tileDate, view }) => {
    if (view !== "month") return null;
    const holiday = getHoliday(tileDate);
    if (holiday) {
      return holiday.type === "Optional"
        ? styles.optionalHoliday
        : styles.companyHoliday;
    }
    return null;
  };

  const handleChange = (newDate) => {
    if (newDate.getFullYear() === currentYear) setDate(newDate);
  };

  const tileContent = ({ date: tileDate, view }) => {
    if (view !== "month") return null;

    const isSunday = tileDate.getDay() === 0;
    const holiday = getHoliday(tileDate);
    const hasTooltip = Boolean(holiday) || isSunday;
    if (!hasTooltip) return null;

    const tooltipContent = holiday?.occasion || (isSunday ? "Sunday" : "");

    return (
      <div
        className={styles.tileTooltipOverlay}
        data-tooltip-id="holiday-tooltip"
        data-tooltip-content={tooltipContent}
        onClick={() => handleChange(tileDate)}
      >
        {!holiday && isSunday && <div className={styles.sundayDot} />}
        {holiday && holiday.type === "Optional" && (
          <div className={`${styles.holidayDot} ${styles.optionalDot}`} />
        )}
        {holiday && holiday.type === "Company" && (
          <div className={`${styles.holidayDot} ${styles.companyDot}`} />
        )}
      </div>
    );
  };

  const REQUIRED_HEADERS = ["date", "occasion", "type"];
  const ALLOWED_TYPES = ["company", "optional"];

  const handleFileChange = async (e) => {
    setErrorMessage("");
    setFileNote("");
    setValidatedRowCount(0);
    parsedRowsRef.current = null;
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setSelectedFile(null);
      return;
    }

    const allowedExts = [".xlsx", ".xls", ".csv"];
    const ext = "." + f.name.split(".").pop();
    if (!allowedExts.includes(ext.toLowerCase())) {
      setErrorMessage("Only .xlsx, .xls or .csv files are allowed.");
      setSelectedFile(null);
      return;
    }

    try {
      const arrayBuffer = await f.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
        cellDates: true,
      });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!rows || rows.length === 0) {
        setErrorMessage("File contains no rows.");
        setSelectedFile(null);
        return;
      }

      const incomingHeaders = Object.keys(rows[0]).map((h) =>
        String(h).trim().toLowerCase()
      );
      const incomingSet = new Set(incomingHeaders);
      const requiredSet = new Set(REQUIRED_HEADERS);
      if (
        incomingSet.size !== requiredSet.size ||
        !REQUIRED_HEADERS.every((h) => incomingSet.has(h))
      ) {
        setErrorMessage(
          `Invalid columns. Template must have exactly these columns (case-insensitive, any order): ${REQUIRED_HEADERS.join(
            ", "
          )}. Found: ${incomingHeaders.join(", ")}`
        );
        setSelectedFile(null);
        return;
      }

      const invalidRows = [];
      const maxErrorsToShow = 10;
      const normalizedRows = [];

      rows.forEach((r, idx) => {
        const row = {};
        Object.entries(r).forEach(([k, v]) => {
          row[String(k).trim().toLowerCase()] = v;
        });

        let dateCell = row.date;
        let isDateValid = false;
        if (dateCell instanceof Date && !isNaN(dateCell.getTime())) {
          isDateValid = true;
        } else if (typeof dateCell === "number") {
          const converted = XLSX.SSF.parse_date_code(dateCell);
          if (converted && converted.y) {
            isDateValid = true;
            dateCell = new Date(
              Date.UTC(converted.y, converted.m - 1, converted.d)
            );
          }
        } else if (typeof dateCell === "string") {
          const parsed = new Date(dateCell);
          if (!isNaN(parsed.getTime())) {
            isDateValid = true;
            dateCell = parsed;
          }
        }

        const occasionCell = String(row.occasion ?? "").trim();
        const typeCellRaw = String(row.type ?? "").trim();
        const typeCell = typeCellRaw.toLowerCase();

        const rowErrors = [];
        if (!isDateValid) rowErrors.push("invalid date");
        if (!occasionCell) rowErrors.push("empty occasion");
        if (!ALLOWED_TYPES.includes(typeCell))
          rowErrors.push(`type must be one of: ${ALLOWED_TYPES.join(", ")}`);

        if (rowErrors.length > 0) {
          if (invalidRows.length < maxErrorsToShow) {
            invalidRows.push({
              rowNumber: idx + 2,
              errors: rowErrors,
              raw: row,
            });
          } else {
            invalidRows.push({
              rowNumber: idx + 2,
              errors: ["...more errors omitted"],
            });
          }
        } else {
          const isoDate =
            dateCell instanceof Date
              ? dateCell.toISOString().slice(0, 10)
              : new Date(dateCell).toISOString().slice(0, 10);
          normalizedRows.push({
            date: isoDate,
            occasion: occasionCell,
            type: typeCell === "company" ? "Company" : "Optional",
          });
        }
      });

      if (invalidRows.length > 0) {
        const sample = invalidRows
          .slice(0, 10)
          .map((r) => `Row ${r.rowNumber}: ${r.errors.join("; ")}`)
          .join(" | ");
        setErrorMessage(`Validation failed. Problems: ${sample}`);
        setSelectedFile(null);
        parsedRowsRef.current = null;
        setValidatedRowCount(0);
        return;
      }

      parsedRowsRef.current = normalizedRows;
      setValidatedRowCount(normalizedRows.length);
      setSelectedFile(f);
      setFileNote(
        `File valid — ${normalizedRows.length} row(s). Ready to upload.`
      );
      setErrorMessage("");
    } catch (err) {
      console.error("Parse/validation error:", err);
      setErrorMessage(
        "Failed to parse file. Ensure it's a valid Excel (.xls/.xlsx) or CSV with columns: date, occasion, type."
      );
      setSelectedFile(null);
      parsedRowsRef.current = null;
      setValidatedRowCount(0);
    }
  };

  const handleUpload = async () => {
    setErrorMessage("");
    if (!selectedFile) {
      setErrorMessage("Please select a valid file first.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadHeaders = {
        ...(user?.orgId ? { "x-org-id": user.user?.orgId ?? user.orgId } : {}),
        ...(user?.employeeId ? { "x-employee-id": user.employeeId } : {}),
        "x-api-key": API_KEY ?? "",
      };

      const res = await axios.post(`${BACKEND_URL}/holidays/upload`, formData, {
        withCredentials: true,
        headers: uploadHeaders,
      });

      const respData = res?.data ?? {};
      const msg = respData?.message || "Upload successful";
      const affected =
        respData?.affectedRows ?? respData?.inserted ?? respData?.insertedCount;
      setFileNote(affected ? `${msg} — ${affected} row(s)` : msg);

      setSelectedFile(null);
      parsedRowsRef.current = null;
      setValidatedRowCount(0);
      if (fileInputRef.current) fileInputRef.current.value = "";

      await fetchHolidays();
    } catch (err) {
      console.error("Upload error:", err);
      const serverMsg = err?.response?.data;

      if (serverMsg?.details && Array.isArray(serverMsg.details)) {
        const sample = serverMsg.details
          .slice(0, 5)
          .map((d) => `Row ${d.row}: ${(d.errors || []).join(", ")}`)
          .join(" | ");
        setErrorMessage(`Validation failed: ${sample}`);
      } else if (serverMsg?.message) {
        setErrorMessage(serverMsg.message);
      } else {
        setErrorMessage("Failed to upload. Try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleUploadIconClick = async () => {
    if (uploading) return;
    if (!selectedFile) {
      handleFileClick();
    } else {
      await handleUpload();
    }
  };

  const handleFileClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleDownloadTemplate = async () => {
    setErrorMessage("");
    try {
      const resp = await axios.get(`${BACKEND_URL}/holidays/template`, {
        withCredentials: true,
        responseType: "blob",
        headers: {
          "x-api-key": API_KEY ?? "",
          ...(user?.orgId ? { "x-org-id": user.orgId } : {}),
        },
      });

      const blob = new Blob([resp.data], {
        type: resp.data.type || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = resp.headers["content-disposition"];
      let filename = "holiday_template.csv";
      if (cd) {
        const match = cd.match(/filename="?(.+?)"?($|;)/);
        if (match) filename = match[1];
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn(
        "Template download from backend failed, falling back to CSV template",
        err
      );
      const headersCsv = ["date", "occasion", "type"].join(",") + "\n";
      const sampleRow =
        ["2025-01-26", "Republic Day", "Company"].join(",") + "\n";
      const blob = new Blob([headersCsv + sampleRow], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "holiday_template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      className={`${styles.calendarContainer} ${
        role === "Admin" ? styles.admin : ""
      }`}
    >
      <button
        className={styles.closeBtn}
        onClick={closeCalendar}
        aria-label="Close"
      >
        X
      </button>

      <div className={styles.calendarWrapper}>
        <Calendar
          onChange={handleChange}
          value={date}
          minDate={new Date(currentYear, 0, 1)}
          maxDetail="month"
          tileDisabled={({ date }) => date.getFullYear() !== currentYear}
          tileClassName={tileClassName}
          tileContent={tileContent}
          prev2Label={null}
          next2Label={null}
        />

        <Tooltip id="holiday-tooltip" place="top" />
        <Tooltip id="admin-tooltip" place="top" />

        {showLegend && (
          <div className={styles.holidayLegendTop}>
            <div className={styles.legendItem}>
              <div className={`${styles.colorBox} ${styles.optional}`} />
              <span>Optional</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.colorBox} ${styles.company}`} />
              <span>Company</span>
            </div>
          </div>
        )}
      </div>
      {role === "Admin" && (
        <div className={styles.adminButtons}>
          {fileNote && <div className={styles.fileNote}>{fileNote}</div>}
          {errorMessage && (
            <div className={styles.errorMessageForUploadfile}>
              {errorMessage}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            style={{ display: "none" }}
            aria-hidden
          />

          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleUploadIconClick}
            disabled={uploading}
            data-tooltip-id="admin-tooltip"
            data-tooltip-content={
              uploading
                ? "Uploading..."
                : selectedFile
                ? "Click to start upload"
                : "Upload Excel (choose file)"
            }
            aria-label={selectedFile ? "Start upload" : "Upload Excel"}
          >
            <FiUpload size={18} />
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleDownloadTemplate}
            data-tooltip-id="admin-tooltip"
            data-tooltip-content="Download Excel Template (columns: date, occasion, type)"
            aria-label="Download template"
          >
            <FiDownload size={18} />
          </button>

          <div
            className={styles.templateIcon}
            data-tooltip-id="admin-tooltip"
            data-tooltip-content="Template columns: date, occasion, type"
            aria-hidden
          >
            <BsFileEarmarkSpreadsheet size={18} />
          </div>
          <div className={styles.templateNote}>
            Template contains an INSTRUCTIONS sheet — use only "Company" or
            "Optional" in the Type column.
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendar;
