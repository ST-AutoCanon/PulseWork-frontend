"use client";

import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./HolidayCalendar.css";
import axios from "axios";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { useAuth } from "../../context/AuthProvider.client"; // adjust path if needed

const HolidayCalendar = ({ closeCalendar }) => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [date, setDate] = useState(new Date());
  const currentYear = new Date().getFullYear();

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // include employee and org info from auth in headers if available
  const headers = {
    "x-api-key": API_KEY ?? "",
    "Content-Type": "application/json",
    ...(user?.employeeId ? { "x-employee-id": user.employeeId } : {}),
    ...(user?.orgId ? { "x-org-id": user.orgId } : {}),
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchHolidays = async () => {
      try {
        // include org_id query param if we have it from auth (keeps API consistent with other changes)
        const orgQuery = user?.orgId
          ? `?org_id=${encodeURIComponent(user.orgId)}`
          : "";
        const res = await axios.get(`${BACKEND_URL}/holidays${orgQuery}`, {
          headers,
          cancelToken: source.token,
        });
        // the API historically returned in message or top-level — preserve that behavior
        const data = res?.data?.message ?? res?.data ?? [];
        setHolidays(Array.isArray(data) ? data : []);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Error fetching holidays:", err);
        // if auth contains a cached holidays payload (optional), use that as a fallback
        try {
          if (Array.isArray(user?.holidays) && user.holidays.length > 0) {
            setHolidays(user.holidays);
            return;
          }
        } catch (e) {
          // ignore
        }
        setHolidays([]);
      }
    };

    fetchHolidays();
    return () => {
      source.cancel("HolidayCalendar unmounted");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [BACKEND_URL, user?.orgId, user?.holidays]);

  const getHoliday = (d) =>
    holidays.find(
      (h) => new Date(h.date).toDateString() === new Date(d).toDateString()
    );

  const tileClassName = ({ date: tileDate, view }) => {
    if (view !== "month") return null;
    const holiday = getHoliday(tileDate);
    if (holiday) {
      return holiday.type === "Optional"
        ? "optional-holiday"
        : "company-holiday";
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
    const hasTooltip = isSunday || Boolean(holiday);
    if (!hasTooltip) return null;

    const tooltipContent = isSunday ? "Sunday" : holiday?.occasion || "";

    return (
      <div
        className="tile-tooltip-overlay"
        data-tooltip-id="holiday-tooltip"
        data-tooltip-content={tooltipContent}
        onClick={() => handleChange(tileDate)}
      >
        {!holiday && isSunday && <div className="sunday-dot" />}
        {holiday && holiday.type === "Optional" && (
          <div className="holiday-dot optional-dot" />
        )}
        {holiday && holiday.type === "Company" && (
          <div className="holiday-dot company-dot" />
        )}
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <button className="close-btn" onClick={closeCalendar}>
        X
      </button>

      <div className="calendar-wrapper">
        <Calendar
          onChange={handleChange}
          value={date}
          minDate={new Date(currentYear, 0, 1)}
          maxDate={new Date(currentYear, 11, 31)}
          maxDetail="month"
          tileDisabled={({ date }) => date.getFullYear() !== currentYear}
          tileClassName={tileClassName}
          tileContent={tileContent}
          prev2Label={null}
          next2Label={null}
        />

        <Tooltip id="holiday-tooltip" place="top" />

        <div className="holiday-legend-top">
          <div className="legend-item">
            <div className="color-box optional" />
            <span>Optional</span>
          </div>
          <div className="legend-item">
            <div className="color-box company" />
            <span>Company</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayCalendar;
