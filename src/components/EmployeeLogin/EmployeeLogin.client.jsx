

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./EmployeeLogin.css";
import { Eye } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";
import SetWorkHoursModal from "../../components/EmployeeLogin/SetWorkHoursModal";

const EmployeeCardWithHover = ({ employeePunches, meIdFromAuth }) => { // NOSONAR
  const [hovered, setHovered] = useState(false);
  const [avatar, setAvatar] = useState("/images/smily.png");

  if (
    !employeePunches ||
    !Array.isArray(employeePunches) ||
    employeePunches.length === 0
  ) {
    return <div className="employee-card-hover">No punch data available</div>;
  }

  const sortedByPunchIn = [...employeePunches].sort(
    (a, b) => new Date(a.punchin_time) - new Date(b.punchin_time)
  );
  const firstPunchIn = sortedByPunchIn[0]?.punchin_time;

  const validPunchOuts = employeePunches.filter((p) => p.punchout_time);
  const sortedByPunchOut = [...validPunchOuts].sort(
    (a, b) => new Date(b.punchout_time) - new Date(a.punchout_time)
  );
  const latestPunchOut = sortedByPunchOut[0]?.punchout_time;

  const latest = employeePunches[employeePunches.length - 1];
  const firstName = latest.first_name || "Unknown";
  const lastName = latest.last_name || "";
  const photoUrl = latest.photo_url || null;

  const role = latest.role || "Employee";
  const gender = latest.gender || "Male";

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") || "";

  const meId = meIdFromAuth ?? null;
  const headers = { "x-api-key": API_KEY, "x-employee-id": meId ?? "" };

  const isOfficeHQ =
    (latest.punchin_location &&
      typeof latest.punchin_location === "string" &&
      latest.punchin_location.trim().toLowerCase().includes("office hq")) ||
    (latest.punchout_location &&
      typeof latest.punchout_location === "string" &&
      latest.punchout_location.trim().toLowerCase().includes("office hq"));

  const cardClass = isOfficeHQ
    ? "employee-card-hover bg-office-hq"
    : "employee-card-hover bg-default";

  useEffect(() => {
    let imageUrl = null;
    let cancelled = false;

    const setFallback = () => {
      if (cancelled) return;
      setAvatar(
        role === "Admin"
          ? "/images/smily.png"
          : gender === "Female"
          ? "/images/female-avatar.jpeg"
          : "/images/male-avatar.jpeg"
      );
    };

    if (photoUrl) {
      const url = BACKEND_URL
        ? `${BACKEND_URL}/${photoUrl.replace(/^\/+/, "")}`
        : photoUrl;
      axios
        .get(url, { withCredentials: true, headers, responseType: "blob" })
        .then((response) => {
          if (cancelled) return;
          imageUrl = URL.createObjectURL(response.data);
          setAvatar(imageUrl);
        })
        .catch((err) => {
          console.error("Error fetching photo:", err);
          setFallback();
        });
    } else {
      setFallback();
    }

    return () => {
      cancelled = true;
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [photoUrl, role, gender, firstName, lastName]);

  const formatTime = (time) => {
    if (!time) return "—";
    try {
      if (
        typeof time === "string" &&
        time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
      ) {
        return time.slice(11, 16);
      }
      const date = new Date(time);
      if (isNaN(date.getTime())) return "—";
      const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
      return istDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.error("Error formatting time:", time, error);
      return "—";
    }
  };

  const calculateTotalWorkHours = (punches) => {
    let totalMs = 0;

    punches.forEach((punch, index) => {
      if (punch.punchin_time) {
        const start = new Date(punch.punchin_time);
        const end = punch.punchout_time
          ? new Date(punch.punchout_time)
          : new Date();

        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
          totalMs += end - start;
        } else {
          console.warn(`Invalid punch pair at index ${index}:`, punch);
        }
      }
    });

    const totalMinutes = Math.round(totalMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const totalWorkHours = calculateTotalWorkHours(employeePunches);

  return (
    <div
      className={cardClass}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="hover-indicator">
        <Eye size={16} />
      </div>
      <div className="card-main">
        <div className="profile-section-admin">
          <img src={avatar} alt="Profile" className="profile-img1" />
          <div className="profile-info">
            <span className="profile-first-name">{firstName}</span>
            <span className="profile-last-name">{lastName}</span>
          </div>
        </div>
        <hr className="divider" />
        <div className="time-section-centered">
          <div className="in-time">
            <span className="label">In</span>
            <span className="green">{formatTime(firstPunchIn)}</span>
          </div>
          <div className="total-hours-centered">
            <span className="label">Totalhrs</span>
            <span className="hours">{totalWorkHours}</span>
          </div>
          <div className="out-time">
            <span className="label">Out</span>
            <span className="red">{formatTime(latestPunchOut)}</span>
          </div>
        </div>
        <hr className="divider" />
      </div>
      {hovered && (
        <div className="card-popup">
          <h4>Punch History</h4>
          <div className="punch-history">
            {employeePunches.map((entry, idx) => (
              <div
                className="punch-entry"
                key={`${entry.punchin_time || idx}-${
                  entry.punchout_time || idx
                }`}
              >
                <div className="punch-details-grid">
                  <div className="punch-detail">
                    <strong>Punch In Time:</strong>{" "}
                    {formatTime(entry.punchin_time)}
                  </div>
                  <div className="punch-detail">
                    <strong>Punch Out Time:</strong>{" "}
                    {formatTime(entry.punchout_time)}
                  </div>
                  <div className="punch-detail">
                    <strong>Punch In Device:</strong>{" "}
                    {entry.punchin_device || "—"}
                  </div>
                  <div className="punch-detail">
                    <strong>Punch Out Device:</strong>{" "}
                    {entry.punchout_device || "—"}
                  </div>
                  <div className="punch-detail">
                    <strong>Punch In Location:</strong>{" "}
                    {entry.punchin_location || "—"}
                  </div>
                  <div className="punch-detail">
                    <strong>Punch Out Location:</strong>{" "}
                    {entry.punchout_location || "—"}
                  </div>
                </div>
                <hr />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TimeSlotGroup = ({
  time,
  slotKey,
  employeesData = [],
  isOpen,
  setSlotOpen,
  meIdFromAuth,
}) => {
  const handleToggle = () => {
    setSlotOpen(slotKey, !isOpen);
  };

  const formatTimeSlot = (slot) => {
    const [startHour] = slot.split("-").map(Number);
    const endHour = startHour + 1;
    return `${startHour.toString().padStart(2, "0")}:00 - ${endHour
      .toString()
      .padStart(2, "0")}:00`;
  };

  return (
    <div className="time-group">
      <div className="time-header" onClick={handleToggle}>
        <h3>
          {formatTimeSlot(slotKey)} ({employeesData.length}{" "}
          {employeesData.length === 1 ? "employee" : "employees"})
          {time.includes("(Today)")
            ? " (Today)"
            : time.includes("(Yesterday)")
            ? " (Yesterday)"
            : ` (${time.split("(")[1]}`}
        </h3>
        <span className="expand-icon">{isOpen ? "˄" : "˅"}</span>
      </div>
      {isOpen && (
        <div className="card-row">
          {employeesData.map((empPunches, idx) => (
            <EmployeeCardWithHover
              key={idx}
              employeePunches={empPunches}
              meIdFromAuth={meIdFromAuth}
            />
          ))}
        </div>
      )}
      <hr className="time-divider" />
    </div>
  );
};

const EmployeeLogin = () => { // NOSONAR
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("today");
  const [punchData, setPunchData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [slotStates, setSlotStates] = useState({
    today: {},
    yesterday: {},
    select: {},
  });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateError, setDateError] = useState(null);
  const [showWorkHoursModal, setShowWorkHoursModal] = useState(false);

  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.org_id ??
    user?.Org_id ??
    user?.raw?.Org_id ??
    null;
  const meId = user?.employeeId ?? null;

  const validateDateRange = (from, to) => {
    if (!from || !to) return { valid: true };
    const fromDateObj = new Date(from);
    const toDateObj = new Date(to);

    if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
      return { valid: false, error: "Invalid date format." };
    }

    if (toDateObj < fromDateObj) {
      return {
        valid: false,
        error: "'To' date must be on or after 'From' date.",
      };
    }

    const diffTime = toDateObj - fromDateObj;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      return { valid: false, error: "Date range must not exceed 7 days." };
    }

    return { valid: true };
  };

  const groupByDayAndEmployee = (data, tab) => {
    const grouped = { Today: {}, Yesterday: {} };

    if (!Array.isArray(data)) return grouped;

    if (tab === "select") {
      data.forEach((record) => {
        if (!record.punchin_time || !record.employee_id) return;
        const date = new Date(record.punchin_time).toISOString().split("T")[0];
        const empId = record.employee_id;

        if (!grouped[date]) grouped[date] = {};
        if (!grouped[date][empId]) grouped[date][empId] = [];
        grouped[date][empId].push(record);
      });
    } else {
      data.forEach((record) => {
        if (!record.record_day || !record.employee_id) return;
        const day = record.record_day;
        const empId = record.employee_id;

        if (!grouped[day]) grouped[day] = {};
        if (!grouped[day][empId]) grouped[day][empId] = [];
        grouped[day][empId].push(record);
      });
    }

    return grouped;
  };

  const groupByHourSlots = (activeGroup) => {
    const slotMap = {};

    Object.entries(activeGroup).forEach(([empId, punches]) => {
      const sorted = [...punches].sort(
        (a, b) => new Date(a.punchin_time) - new Date(b.punchin_time)
      );
      const firstPunch = sorted[0];

      if (!firstPunch || !firstPunch.punchin_time) {
        console.warn(
          `Skipping punches for employee ${empId}: invalid punchin_time`
        );
        return;
      }

      const punchDate = new Date(firstPunch.punchin_time);
      if (isNaN(punchDate.getTime())) {
        console.warn(
          `Invalid punchin_time for employee ${empId}:`,
          firstPunch.punchin_time
        );
        return;
      }

      const hour = punchDate.getHours();
      const slotLabel = `${hour}-${hour + 1}`;

      if (!slotMap[slotLabel]) slotMap[slotLabel] = [];
      slotMap[slotLabel].push(sorted);
    });

    return slotMap;
  };

  const validateAndHandleEarlyReturns = () => {
    if (!orgId) {
      setError("Organization ID is missing. Please log in again.");
      setPunchData([]);
      setLoading(false);
      return false;
    }

    if (activeTab === "select" && (!fromDate || !toDate)) {
      setPunchData([]);
      setLoading(false);
      setError(null);
      return false;
    }

    if (activeTab === "select") {
      const validation = validateDateRange(fromDate, toDate);
      if (!validation.valid) {
        setError(validation.error);
        setPunchData([]);
        setLoading(false);
        return false;
      }
    }

    return true;
  };

  const buildApiUrl = () => {
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    if (!backendUrl) throw new Error("Backend URL is missing.");
    if (!meId) throw new Error("Employee ID is missing.");

    let url = `${backendUrl}/api/employeelogin/today-yesterday-punches?org_id=${encodeURIComponent(orgId)}`;

    if (activeTab === "select" && fromDate && toDate) {
      url += `&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
    }

    return { url, API_KEY };
  };

  const processResponseData = (response) => {
    let data = [];

    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (Array.isArray(response.data?.data)) {
      data = response.data.data;
    } else {
      console.warn("Unexpected response format:", response.data);
      data = [];
    }

    setPunchData(data);

    const grouped = groupByDayAndEmployee(data, activeTab);
    const activeGroup =
      activeTab === "today"
        ? grouped.Today
        : activeTab === "yesterday"
        ? grouped.Yesterday
        : grouped[fromDate] || {};

    const slots = groupByHourSlots(activeGroup);
    const slotKeys = Object.keys(slots);
    const newSlotStates = slotKeys.reduce(
      (acc, slot, idx) => ({ ...acc, [slot]: idx === 0 }),
      {}
    );

    setSlotStates((prev) => ({ ...prev, [activeTab]: newSlotStates }));
  };

  const handleApiError = (err) => {
    console.error("Error fetching punch data:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });

    let errorMessage =
      err.response?.data?.message ||
      err.message ||
      "Error fetching punch data.";

    if (err.response?.status === 400) {
      errorMessage = "Invalid request. Check date range or organization ID.";
    } else if (err.response?.status === 404) {
      errorMessage =
        activeTab === "select"
          ? "No punch data available for the selected date range and organization."
          : "No punch data available for the selected organization.";
    }

    setError(errorMessage);
    setPunchData([]);
  };

  useEffect(() => {
    const fetchPunchData = async () => {
      if (!validateAndHandleEarlyReturns()) return;

      setLoading(true);
      setError(null);
      setDateError(null);

      try {
        const { url, API_KEY } = buildApiUrl();

        const response = await axios.get(url, {
          withCredentials: true,
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": meId,
          },
          withCredentials: true,
        });

        processResponseData(response);
      } catch (err) {
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPunchData();
  }, [activeTab, fromDate, toDate, orgId, meId]);

  const setSlotOpen = (slot, isOpen) => {
    setSlotStates((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [slot]: isOpen,
      },
    }));
  };

  const handleDownload = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both "From" and "To" dates.');
      return;
    }

    if (!orgId) {
      setError("Organization ID is missing. Please log in again.");
      return;
    }

    const validation = validateDateRange(fromDate, toDate);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      if (!backendUrl) throw new Error("Backend URL is missing.");
      if (!meId) throw new Error("Employee ID is missing.");

      const url = `${backendUrl}/api/emp-excelsheet?from=${encodeURIComponent(
        fromDate
      )}&to=${encodeURIComponent(toDate)}&org_id=${encodeURIComponent(orgId)}`;

      const response = await axios.get(url, {
        withCredentials: true,
        headers: {
          "x-api-key": API_KEY,
          "x-employee-id": meId,
        },
        responseType: "blob",
      });

      const contentType = response.headers["content-type"];
      if (
        !contentType ||
        !contentType.includes(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
      ) {
        try {
          const text = new TextDecoder().decode(response.data);
          const parsed = JSON.parse(text);
          throw new Error(
            parsed.message ||
              "Unexpected response format. Expected an Excel file."
          );
        } catch (parseErr) {
          throw new Error(
            "Unexpected response format. Expected an Excel file."
          );
        }
      }

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `punch-data-${fromDate}-to-${toDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Error downloading Excel:", {
        message: err.message,
        status: err.response?.status,
        headers: err.response?.headers,
      });
      let errorMessage = err.message || "Failed to download punch data.";
      if (err.response?.status === 400) {
        errorMessage = "Invalid request. Check date range or organization ID.";
      } else if (err.response?.status === 404) {
        errorMessage =
          "No punch data available for the selected date range and organization.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value;
    setFromDate(newFromDate);
    if (toDate) {
      const validation = validateDateRange(newFromDate, toDate);
      setDateError(validation.error || null);
    } else {
      setDateError(null);
    }
  };

  const handleToDateChange = (e) => {
    const newToDate = e.target.value;
    setToDate(newToDate);
    if (fromDate) {
      const validation = validateDateRange(fromDate, newToDate);
      setDateError(validation.error || null);
    } else {
      setDateError(null);
    }
  };

  const groupedData = groupByDayAndEmployee(punchData, activeTab);
  const activeGroup =
    activeTab === "today"
      ? groupedData.Today
      : activeTab === "yesterday"
      ? groupedData.Yesterday
      : groupedData[fromDate] || {};
  const slotGroupedData = groupByHourSlots(activeGroup);

  return (
    <div className="employee-login">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 className="heading">Employee Punch Records</h2>

        <button
          onClick={() => setShowWorkHoursModal(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#79c42b",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "15px",
            fontWeight: "500",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          Set Work Hours
        </button>
      </div>

      <div className="tab-buttons">
        <button
          className={activeTab === "today" ? "active" : ""}
          onClick={() => setActiveTab("today")}
        >
          Today
        </button>
        <button
          className={activeTab === "yesterday" ? "active" : ""}
          onClick={() => setActiveTab("yesterday")}
        >
          Yesterday
        </button>
        <button
          className={activeTab === "select" ? "active" : ""}
          onClick={() => setActiveTab("select")}
        >
          Select
        </button>
      </div>

      {activeTab === "select" && (
        <div
          className="date-selection"
          style={{
            margin: "20px 0",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <div>
            <label htmlFor="fromDate" style={{ marginRight: "8px" }}>
              From:
            </label>
            <input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={handleFromDateChange}
              style={{ padding: "8px", fontSize: "16px" }}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div>
            <label htmlFor="toDate" style={{ marginRight: "8px" }}>
              To:
            </label>
            <input
              id="toDate"
              type="date"
              value={toDate}
              onChange={handleToDateChange}
              style={{ padding: "8px", fontSize: "16px" }}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <button
            onClick={handleDownload}
            disabled={loading || dateError || !fromDate || !toDate || !orgId}
            style={{
              padding: "8px 16px",
              backgroundColor:
                loading || dateError || !fromDate || !toDate || !orgId
                  ? "#ccc"
                  : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                loading || dateError || !fromDate || !toDate || !orgId
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading ? "Downloading..." : "Download Excel"}
          </button>
        </div>
      )}

      {dateError && (
        <p style={{ color: "red", fontWeight: "bold" }}>{dateError}</p>
      )}
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && !orgId ? (
        <p>Organization ID is missing. Please log in again.</p>
      ) : !loading &&
        !error &&
        activeTab === "select" &&
        (!fromDate || !toDate) ? (
        <p>Please select both "From" and "To" dates to view punch data.</p>
      ) : !loading &&
        !error &&
        Object.keys(slotGroupedData).length === 0 &&
        punchData.length === 0 ? (
        <p>
          No punch data available for the selected date range and organization.
        </p>
      ) : !loading && !error && Object.keys(slotGroupedData).length > 0 ? (
        Object.entries(slotGroupedData)
          .sort(([slotA], [slotB]) => {
            const hourA = parseInt(slotA.split("-")[0], 10) || 0;
            const hourB = parseInt(slotB.split("-")[0], 10) || 0;
            return hourA - hourB;
          })
          .map(([slot, empPunchesArr]) => (
            <TimeSlotGroup
              key={slot}
              time={`${slot} ${
                activeTab === "today"
                  ? "(Today)"
                  : activeTab === "yesterday"
                  ? "(Yesterday)"
                  : `(${fromDate})`
              }`}
              slotKey={slot}
              employeesData={empPunchesArr}
              isOpen={slotStates[activeTab][slot] || false}
              setSlotOpen={setSlotOpen}
              meIdFromAuth={meId}
            />
          ))
      ) : null}

      {/* This is the modal that opens when you click the button */}
      <SetWorkHoursModal
        isOpen={showWorkHoursModal}
        onClose={() => setShowWorkHoursModal(false)}
      />
    </div>
  );
};

export default EmployeeLogin;