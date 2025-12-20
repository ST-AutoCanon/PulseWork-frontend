
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./overtimeSupervisor.css";
import Modal from "../Modal/Modal";

const API_KEY = process.env.REACT_APP_API_KEY;

const OvertimeSupervisor = () => {
  const [employees, setEmployees] = useState([]);
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [compensationData, setCompensationData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("current");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const getLocalDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

 const getMonthName = (offset) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const targetMonth = currentMonth - offset;
  const year = today.getFullYear() + Math.floor(targetMonth / 12);
  const adjustedTargetMonth = (targetMonth % 12 + 12) % 12;
  const date = new Date(year, adjustedTargetMonth, 1);
  const monthName = date.toLocaleString("en-US", { month: "long", year: "numeric" });
  console.log(`getMonthName(offset: ${offset}, targetMonth: ${targetMonth}): ${monthName}`);
  return monthName;
};

  const [monthOptions] = useState([
    { type: "current", offset: 0, label: getMonthName(0) },
    { type: "last", offset: 1, label: getMonthName(1) },
    { type: "twoMonthsAgo", offset: 2, label: getMonthName(2) },
  ]);
  const [cutoffDate, setCutoffDate] = useState(30);

  const meId = JSON.parse(
    localStorage.getItem("dashboardData") || "{}"
  ).employeeId;
  const headers = { "x-api-key": API_KEY, "x-employee-id": meId };

  console.log("Supervisor ID (meId):", meId);

  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  const fetchCutoffDate = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/salaryCalculationperiods`,
        { headers }
      );
      const fetchedCutoff = response.data.data[0]?.cutoff_date || 30;
      setCutoffDate(fetchedCutoff);
      console.log(`Fetched cutoff date: ${fetchedCutoff}`);
      return fetchedCutoff;
    } catch (error) {
      console.error("Error fetching cutoff date:", error);
      return 30;
    }
  };

 const getDateRange = (type, cutoff) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let startDate, endDate;

  if (type === "current") {
    startDate = new Date(currentYear, currentMonth - 1, cutoff);
    endDate = new Date(currentYear, currentMonth, cutoff);
  } else if (type === "last") {
    startDate = new Date(currentYear, currentMonth - 2, cutoff);
    endDate = new Date(currentYear, currentMonth - 1, cutoff);
  } else if (type === "twoMonthsAgo") {
    startDate = new Date(currentYear, currentMonth - 3, cutoff);
    endDate = new Date(currentYear, currentMonth - 2, cutoff);
  }

  const nextDayEnd = new Date(endDate);
  nextDayEnd.setDate(nextDayEnd.getDate() + 1);

  const range = {
    startDate: getLocalDateStr(startDate),
    endDate: getLocalDateStr(nextDayEnd),
  };
  console.log(`getDateRange(${type}, cutoff: ${cutoff}): ${range.startDate} to ${range.endDate} (includes full ${getLocalDateStr(endDate)} via next-day end)`);
  return range;
};

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/overtime-summary/${meId}`,
        { headers }
      );
      console.log("Employee List API Response:", JSON.stringify(response.data, null, 2));
      if (response.data.success) {
        setEmployees(response.data.data);
        console.log("Employees set:", JSON.stringify(response.data.data, null, 2));
        if (response.data.data.length === 0) {
          setError("No employees found for this supervisor.");
          console.warn("No employees found for supervisor:", meId);
        }
      } else {
        setError("Failed to fetch employee data: Invalid response");
        showAlert("Failed to fetch employee data");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError(`Failed to fetch employee data: ${error.message}`);
      showAlert(`Failed to fetch employee data: ${error.message}`);
    }
  };

  const fetchCompensationData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/compensation/assigned`,
        { headers }
      );
      console.log("Compensation Data API Response:", JSON.stringify(response.data, null, 2));
      if (response.data.success) {
        // Validate and parse plan_data for each compensation record
        const validatedData = response.data.data.map(comp => {
          let planData = {};
          if (comp.plan_data) {
            try {
              planData = typeof comp.plan_data === 'string' ? JSON.parse(comp.plan_data) : comp.plan_data;
            } catch (e) {
              console.warn(`Invalid JSON in plan_data for employee_id ${comp.employee_id}:`, comp.plan_data);
              planData = {};
            }
          }
          return { ...comp, plan_data: planData };
        });
        setCompensationData(validatedData);
        console.log("Compensation data set:", JSON.stringify(validatedData, null, 2));
      } else {
        console.warn("Failed to fetch compensation data: Invalid response");
        // Don't set error, proceed with defaults
      }
    } catch (error) {
      console.error("Error fetching compensation data:", error);
      // Don't set error, proceed with defaults
      console.warn(`Failed to fetch compensation data: ${error.message}, using defaults`);
    }
  };

 const fetchOvertimeData = async () => {
  setLoading(true);
  const selectedMonthOption = monthOptions.find(
    (option) => option.type === selectedMonth
  );
  if (!selectedMonthOption) {
    console.warn("No selected month option found for:", selectedMonth);
    setLoading(false);
    return;
  }

  const { startDate, endDate } = getDateRange(selectedMonth, cutoffDate);
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/api/compensation/employee-extra-hours?startDate=${startDate}&endDate=${endDate}`,
      { headers }
    );
    console.log("Overtime Data API Response:", response.data);
    if (response.data.success) {
      const employeeIds = employees.map(emp => emp.employee_id);
      console.log("Employee IDs under supervisor:", employeeIds);
      let rawData = response.data.data || [];
      
      // Filter by employees AND date range (new: excludes pre-start like Aug 31)
      const originalEndDate = new Date(endDate + 'T00:00:00'); // Parse endDate as local midnight
      originalEndDate.setDate(originalEndDate.getDate() - 1); // Previous day for <= filter
      const originalEndStr = getLocalDateStr(originalEndDate);
      const filteredRaw = rawData.filter(item => 
        employeeIds.includes(item.employee_id) && 
        item.work_date >= startDate && 
        item.work_date <= originalEndStr
      );
      console.log(`Filtered raw data to supervisor employees + date range (${startDate} to ${originalEndStr}): ${filteredRaw.length} items`);
      
      const processedRecords = filteredRaw.map(item => {
        const comp = compensationData.find(c => c.employee_id === item.employee_id);
        const defaultHours = parseFloat(comp?.plan_data?.defaultWorkingHours) || 8;
        let totalHours;
        let sessions;
        if (item.sessions && item.total_hours_worked !== undefined) {
          // Grouped data
          totalHours = parseFloat(item.total_hours_worked) || 0;
          sessions = [...(item.sessions || [])];
        } else {
          // Legacy per-punch data
          totalHours = parseFloat(item.hours_worked) || 0;
          sessions = [{ punch_id: item.punch_id, apportioned_hours: totalHours }];
        }
        const extraHours = Math.max(0, totalHours - defaultHours);
        const totalApportioned = sessions.reduce((sum, s) => sum + (parseFloat(s.apportioned_hours) || 0), 0);
        sessions.forEach(s => {
          s.extra_hours = totalApportioned > 0 ? ((parseFloat(s.apportioned_hours) || 0) / totalApportioned) * extraHours : 0;
        });
        const id = item.work_date ? `${item.employee_id}-${item.work_date}` : `temp-${item.employee_id}-${Math.random().toString(36).substr(2, 9)}`;
        if (totalHours > 24) {
          console.warn(`Unusually high total_hours for ${id}: ${totalHours}`);
        }
        if (extraHours > 14) {
          console.warn(`Unusually high extra_hours for ${id}: ${extraHours}`);
        }
        let rate = parseFloat(item.rate) || 0; // Fallback rate
        if (comp && comp.plan_data && comp.plan_data.overtimePayAmount) {
          rate = parseFloat(comp.plan_data.overtimePayAmount) || 0;
        } else if (comp) {
          console.warn(`No overtimePayAmount for employee_id ${item.employee_id}`);
        } else {
          console.warn(`No compensation data for employee_id ${item.employee_id}, using fallback rate`);
        }
        return {
          id,
          date: item.work_date ? item.work_date : item.punch_in_time ? new Date(item.punch_in_time).toISOString().split("T")[0] : "Unknown",
          employee_id: item.employee_id || "Unknown",
          hours: extraHours,
          hours_worked: totalHours,
          rate,
          project: item.project || item.projects || "",
          supervisor: item.supervisor || item.supervisors || employees.find(emp => emp.employee_id === item.employee_id)?.supervisor_name || "Unknown",
          comments: item.comments || "",
          status: item.status || "Pending",
          sessions,
        };
      }).filter(item => item.hours > 0);
      const uniqueRecords = Array.from(
        new Map(processedRecords.map(item => [item.id, item])).values()
      );
      setOvertimeRecords(uniqueRecords);
      console.log("Overtime records set:", JSON.stringify(uniqueRecords, null, 2));
      if (uniqueRecords.length === 0) {
        console.warn("No overtime records returned for employees with extra hours > 0 in this date range");
        setError("No overtime records found for employees with extra hours in this period.");
      } else {
        setError("");
      }
    } else {
      setError(`Failed to fetch overtime data: ${response.data.error || "Invalid response"}`);
      showAlert(`Failed to fetch overtime data: ${response.data.error || "Invalid response"}`);
    }
  } catch (error) {
    console.error("Error fetching overtime data:", error);
    const errorMessage = error.response?.data?.error || error.message || "Network error";
    setError(`Failed to fetch overtime data: ${errorMessage}`);
    showAlert(`Failed to fetch overtime data: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
};

  const handleInputChange = (id, field, value) => {
    if (field !== "rate") return;
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      showAlert("Rate must be a positive number", "Error");
      return;
    }
    setOvertimeRecords((prevData) =>
      prevData.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
    console.log(`Updated ${field} for record ${id}: ${value}`);
  };

  const handleStatusChange = async (recordId, status) => {
    try {
      setLoading(true);
      const row = overtimeRecords.find((row) => row.id === recordId);
      if (!row) {
        throw new Error("Row not found for recordId: " + recordId);
      }
      if (row.status !== "Pending") {
        throw new Error(`Cannot change status of row with status: ${row.status}`);
      }
      if (row.sessions.every(s => (parseFloat(s.extra_hours) || 0) === 0)) {
        throw new Error("No extra hours to approve/reject.");
      }

      const payload = {
        data: row.sessions.map((s) => ({
          punch_id: s.punch_id,
          work_date: row.date,
          employee_id: row.employee_id,
          extra_hours: parseFloat(s.extra_hours) || 0,
          rate: parseFloat(row.rate) || 0,
          project: row.project || "",
          supervisor: row.supervisor || "",
          comments: row.comments || "",
          status: status,
        })),
      };

      console.log("Sending status update payload:", JSON.stringify(payload, null, 2));
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/compensation/overtime-bulk`,
        payload,
        {
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": meId,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Status update response:", JSON.stringify(response.data, null, 2));

      showAlert(`Overtime record ${status.toLowerCase()} successfully`, "Success");

      setOvertimeRecords((prevData) =>
        prevData.map((row) =>
          row.id === recordId ? { ...row, status } : row
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      showAlert(
        error.response?.data?.error || error.message || "Network error",
        "Error"
      );
    } finally {
      setLoading(false);
    }
  };

  const initData = async () => {
    if (!meId) {
      setError("Supervisor ID not found in localStorage.");
      setLoading(false);
      console.error("No meId found in localStorage");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await fetchEmployees();

      try {
        await fetchCompensationData();
      } catch (compError) {
        console.warn("Compensation fetch failed, proceeding with defaults:", compError);
        // Compensation data remains empty, fallbacks will be used
      }

      await fetchCutoffDate();

      // Overtime data fetch is now handled by useEffect
    } catch (error) {
      console.error("Error in fetching data:", error);
      setError(`Failed to fetch data: ${error.message}`);
      showAlert(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, [meId]);

  useEffect(() => {
    if (loading || employees.length === 0 || monthOptions.length === 0) return;
    fetchOvertimeData();
  }, [selectedMonth, cutoffDate, employees, compensationData]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    console.log("Search term:", e.target.value);
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setError("");
    console.log("Selected month:", e.target.value);
  };

  const filteredRecords = overtimeRecords.filter((record) => {
    const employee = employees.find(emp => emp.employee_id === record.employee_id);
    const matchesSearch = employee && employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch && employee) {
      console.log(`Record for ${employee.employee_name} (${record.employee_id}) filtered out due to search term: ${searchTerm}`);
    }
    return matchesSearch || !searchTerm;
  });
  console.log("Filtered records:", JSON.stringify(filteredRecords, null, 2));

  return (
    <div className="employees-container">
      <h1>Employee Overtime Summary</h1>
      <div className="header-container">
        <div className="employee-search-container">
          <input
            type="text"
            placeholder="Search by Employee Name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <i className="fas fa-search search-icon"></i>
        </div>
        <div className="month-selector-container">
          <label htmlFor="monthSelector">Select Month: </label>
          <select
            id="monthSelector"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="month-selector"
          >
            {monthOptions.map((option) => (
              <option key={option.type} value={option.type}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading overtime records...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredRecords.length === 0 ? (
        <div>No overtime records found for employees with extra hours in this period.</div>
      ) : (
        <div className="table-scroll-wrapper">
          <table className="employee-table">
            <thead>
              <tr className="header-row">
                <th>Employee ID</th>
                <th>Employee Name</th>
                
                <th>Date</th>
                <th> Hours Worked</th>
                <th>Extra Hours</th>
                <th>Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const employee = employees.find(emp => emp.employee_id === record.employee_id);
                return (
                  <tr key={record.id}>
                    <td>{record.employee_id}</td>
                    <td>{employee ? employee.employee_name : record.employee_id}</td>
                    
                    <td>{record.date}</td>
                    <td>{record.hours_worked.toFixed(2)} hours</td>
                    <td>{record.hours.toFixed(2)} hours</td>
                    <td>
                      <input
                        type="number"
                        value={record.rate}
                        onChange={(e) => handleInputChange(record.id, "rate", e.target.value)}
                        className="rate-input"
                        disabled={record.status === "Approved" || record.status === "Rejected" || loading}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className={`status-${record.status.toLowerCase()}`}>{record.status}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleStatusChange(record.id, "Approved")}
                          className="approve-button"
                          disabled={record.status !== "Pending" || loading}
                        >
                          <svg className="action-icon" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                            />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(record.id, "Rejected")}
                          className="reject-button"
                          disabled={record.status !== "Pending" || loading}
                        >
                          <svg className="action-icon" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"
                            />
                          </svg>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default OvertimeSupervisor;