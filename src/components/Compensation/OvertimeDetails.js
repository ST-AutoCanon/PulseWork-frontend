
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./OvertimeDetails.css";
import Modal from "../Modal/Modal";

const OvertimeDetails = () => {
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [approvedSet, setApprovedSet] = useState(new Set());
  const [edited, setEdited] = useState({});
  const [rateMap, setRateMap] = useState({});
  const [defaultHoursMap, setDefaultHoursMap] = useState({});
  const [tab, setTab] = useState("current");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const API_KEY = process.env.REACT_APP_API_KEY;
  const BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const meId = JSON.parse(localStorage.getItem("dashboardData") || "{}").employeeId;

  const headers = {
    "x-api-key": API_KEY,
    "x-employee-id": meId,
    "Content-Type": "application/json",
  };

  // ---------- DATE HELPERS ----------
  const monthLabel = (offset) => {
    const d = new Date();
    d.setMonth(d.getMonth() - offset);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Convert UTC ISO string to local YYYY-MM-DD (IST)
  const toLocalDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
 const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };
  // ---------- FETCH ----------
  const fetchData = async () => {
    if (!API_KEY || !meId) return;
    setLoading(true);
    try {
      // 1. Get cutoff date
      const cutoffRes = await axios.get(`${BASE_URL}/api/salaryCalculationperiods`, { headers });
      const cutoff_date = cutoffRes.data?.data?.[0]?.cutoff_date || 5;

      // 2. Calculate start & end date
      const now = new Date();
      let currentMonth = now.getMonth();
      let currentYear = now.getFullYear();
      if (tab === "prev1") currentMonth -= 1;
      else if (tab === "prev2") currentMonth -= 2;
      while (currentMonth < 0) {
        currentMonth += 12;
        currentYear -= 1;
      }
      const periodEnd = new Date(currentYear, currentMonth, cutoff_date);
      const periodStart = new Date(currentYear, currentMonth - 1, cutoff_date);
      const startDate = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, "0")}-${String(
        periodStart.getDate()
      ).padStart(2, "0")}`;
      const endDate = `${periodEnd.getFullYear()}-${String(periodEnd.getMonth() + 1).padStart(2, "0")}-${String(
        periodEnd.getDate()
      ).padStart(2, "0")}`;

      // 3. Fetch all required data
      const [extraRes, summaryRes, assignedRes, planListRes] = await Promise.all([
        axios.get(
          `${BASE_URL}/api/compensation/employee-extra-hours?startDate=${startDate}&endDate=${endDate}`,
          { headers }
        ),
        axios.get(`${BASE_URL}/api/compensation/overtime-status-summary`, { headers }),
        axios.get(`${BASE_URL}/api/compensation/assigned`, { headers }),
        axios.get(`${BASE_URL}/api/compensations/list`, { headers }),
      ]);

      // --- Build Summary Map (Project & Supervisor) ---
      const summaryData = summaryRes.data?.data || [];
      const summaryMap = {};
      summaryData.forEach((item) => {
        summaryMap[item.employee_id] = {
          project: item.project || item.projects || "—",
          supervisor: item.supervisor || item.supervisors || "—",
        };
      });

      // --- Build Rate Map ---
      const rateObj = {};
      const assignedData = assignedRes.data?.data || assignedRes.data || [];
      assignedData.forEach((plan) => {
        const rate = parseFloat(plan.plan_data?.overtimePayAmount || "0") || 0;
        (plan.assigned_data || []).forEach((emp) => {
          rateObj[emp.employee_id] = rate;
        });
      });
      setRateMap(rateObj);

      // --- Build Default Working Hours Map ---
      const hoursObj = {};
      const planList = planListRes.data?.data || [];
      const planHoursMap = {};
      planList.forEach((plan) => {
        const hours = parseFloat(plan.plan_data?.defaultWorkingHours) || 8;
        planHoursMap[plan.id] = hours;
      });
      assignedData.forEach((assignment) => {
        const planId = assignment.id;
        const defaultHours = planHoursMap[planId] || 8;
        (assignment.assigned_data || []).forEach((emp) => {
          hoursObj[emp.employee_id] = defaultHours;
        });
      });
      setDefaultHoursMap(hoursObj);

      // --- Process Main Data with LOCAL DATE ---
      const mainData = (extraRes.data?.data || []).map((item) => {
        const localDate = toLocalDate(item.work_date); // ← Critical: normalize
        const totalHrs = parseFloat(item.total_hours_worked) || 0;
        const defaultHrs = hoursObj[item.employee_id] || 8;
        const recalculatedExtra = totalHrs > defaultHrs ? totalHrs - defaultHrs : 0;

        const sessionsWithCorrectedExtra = (item.sessions || []).map((s) => ({
          ...s,
          extra_hours: item.sessions.length > 0 ? (recalculatedExtra / item.sessions.length).toFixed(2) : "0.00",
        }));

        return {
          ...item,
          work_date: localDate, // ← override with local date
          projects:
            item.projects ||
            item.project ||
            summaryMap[item.employee_id]?.project ||
            "—",
          supervisors:
            item.supervisors ||
            item.supervisor ||
            summaryMap[item.employee_id]?.supervisor ||
            "—",
          extra_hours: recalculatedExtra.toFixed(2),
          sessions: sessionsWithCorrectedExtra,
        };
      });
      setData(mainData);

      // --- Build Approved Set using LOCAL DATE ---
      const approved = new Set();
      summaryData.forEach((r) => {
        if (r.employee_id && r.work_date) {
          const localDate = toLocalDate(r.work_date);
          approved.add(`${r.employee_id}-${localDate}`);
        }
      });
      setApprovedSet(approved);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  // ---------- FILTER ----------
  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (r) =>
        r.employee_id?.toLowerCase().includes(q) ||
        r.employee_name?.toLowerCase().includes(q) ||
        r.work_date?.includes(q)
    );
  }, [data, search]);

  // ---------- SELECTION (per day) ----------
  const rowKey = (item) => `${item.employee_id}-${item.work_date}`;

  const isApproved = (item) => approvedSet.has(rowKey(item));
  const isRowSelected = (item) => selected.has(rowKey(item));

  const getAllSelectableKeys = () => {
    const keys = new Set();
    filtered.forEach((r) => {
      if (!isApproved(r)) {
        keys.add(rowKey(r));
      }
    });
    return Array.from(keys);
  };

  const toggleRow = (item) => {
    if (isApproved(item)) return;
    const key = rowKey(item);
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const toggleAll = () => {
    const allKeys = getAllSelectableKeys();
    setSelected((prev) => {
      if (allKeys.every((k) => prev.has(k))) return new Set();
      return new Set(allKeys);
    });
  };

  const isAllSelected = (() => {
    const allKeys = getAllSelectableKeys();
    return allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  })();

  // ---------- BULK UPDATE ----------
  const buildPayload = (sessions, status, parent) => {
    const groupKey = rowKey(parent);
    const effectiveRate = edited[groupKey]?.rate ?? (rateMap[parent.employee_id] ?? parent.rate ?? 0);
    const effectiveComments = edited[groupKey]?.comments ?? (parent.comments || "");

    return sessions.map((s) => ({
      punch_id: s.punch_id,
      work_date: parent.work_date, // ← already local date
      employee_id: parent.employee_id,
      extra_hours: parseFloat(s.extra_hours) || 0,
      rate: effectiveRate,
      project: parent.projects || "",
      supervisor: parent.supervisors || "",
      comments: effectiveComments,
      status,
    }));
  };

  const bulkUpdate = async (payload, status) => {
    if (!payload.length) return;
    try {
      await axios.post(`${BASE_URL}/api/compensation/overtime-bulk`, { data: payload }, { headers });
      showAlert(`Successfully ${status.toLowerCase()} ${payload.length} record(s)`);
      await fetchData();
      setSelected(new Set());
    } catch (err) {
      console.error("Update error:", err.response?.data || err);
      showAlert(`Failed: ${err.response?.data?.details || err.message}`);
    }
  };

  const approveAll = () => {
    const toApprove = [];
    const processed = new Set();

    filtered.forEach((r) => {
      const key = rowKey(r);
      if (selected.has(key) && !processed.has(key)) {
        processed.add(key);
        toApprove.push(...buildPayload(r.sessions, "Approved", r));
      }
    });

    if (toApprove.length > 0) bulkUpdate(toApprove, "Approved");
  };

  const rejectAll = () => {
    const toReject = [];
    const processed = new Set();

    filtered.forEach((r) => {
      const key = rowKey(r);
      if (selected.has(key) && !processed.has(key)) {
        processed.add(key);
        toReject.push(...buildPayload(r.sessions, "Rejected", r));
      }
    });

    if (toReject.length > 0) bulkUpdate(toReject, "Rejected");
  };

  const approveOne = (row) => {
    const payload = buildPayload(row.sessions, "Approved", row);
    bulkUpdate(payload, "Approved");
  };

  const rejectOne = (row) => {
    const payload = buildPayload(row.sessions, "Rejected", row);
    bulkUpdate(payload, "Rejected");
  };

  // ---------- RENDER ----------
  if (loading) return <div className="ot-loading">Loading…</div>;

  return (
    <div className="ot-container">
      <div className="ot-tabs">
        {["prev2", "prev1", "current"].map((t) => (
          <button
            key={t}
            className={tab === t ? "ot-tab active" : "ot-tab"}
            onClick={() => setTab(t)}
          >
            {monthLabel(t === "prev2" ? 2 : t === "prev1" ? 1 : 0)}
          </button>
        ))}
      </div>

      <div className="ot-controls">
        <input
          type="text"
          placeholder="Search by ID, Name, Date..."
          className="ot-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ot-bulk-actions">
          <button className="ot-btn ot-btn-approve" onClick={approveAll} disabled={selected.size === 0}>
            Approve All
          </button>
          <button className="ot-btn ot-btn-reject" onClick={rejectAll} disabled={selected.size === 0}>
            Reject All
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="ot-no-data">No overtime records found</p>
      ) : (
        <div className="ot-table-wrapper">
          <table className="ot-table">
            <thead>
              <tr>
                <th className="ot-th ot-th-select">
                  <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
                </th>
                <th className="ot-th">Date</th>
                <th className="ot-th">Employee ID</th>
                <th className="ot-th">Employee Name</th>
                <th className="ot-th ot-align-right">Total Hrs</th>
                <th className="ot-th ot-align-right">Extra Hrs</th>
                <th className="ot-th ot-align-right">Rate</th>
                <th className="ot-th">Project</th>
                <th className="ot-th">Supervisor</th>
                <th className="ot-th">Comments</th>
                <th className="ot-th">Status</th>
                <th className="ot-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const key = rowKey(row);
                const approved = isApproved(row);
                const sel = isRowSelected(row);
                const groupKey = key;
                const defaultRate = rateMap[row.employee_id] ?? row.rate ?? 0;

                return (
                  <tr key={key} className={approved ? "ot-row-disabled" : ""}>
                    <td className="ot-td ot-td-select">
                      <input
                        type="checkbox"
                        checked={sel}
                        disabled={approved}
                        onChange={() => toggleRow(row)}
                      />
                    </td>
                    <td className="ot-td">{row.work_date}</td>
                    <td className="ot-td">{row.employee_id}</td>
                    <td className="ot-td">{row.employee_name || "—"}</td>
                    <td className="ot-td ot-align-right">
                      {Number(row.total_hours_worked || 0).toFixed(2)}
                    </td>
                    <td className="ot-td ot-align-right">
                      {parseFloat(row.extra_hours || 0).toFixed(2)}
                    </td>
                    <td className="ot-td ot-align-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={(edited[groupKey]?.rate ?? defaultRate).toFixed(2)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEdited((prev) => ({
                            ...prev,
                            [groupKey]: { ...(prev[groupKey] || {}), rate: val },
                          }));
                        }}
                        disabled={approved}
                        className="ot-input-rate"
                      />
                    </td>
                    <td className="ot-td">
                      <div
                        className="ot-project-tooltip"
                        title={
                          Array.isArray(row.projects)
                            ? row.projects.join(", ")
                            : row.projects || "—"
                        }
                        style={{
                          display: "inline-block",
                          maxWidth: "150px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          verticalAlign: "middle",
                          cursor: "help",
                        }}
                      >
                        {Array.isArray(row.projects)
                          ? row.projects[0]?.slice(0, 8)
                          : (row.projects || "—").slice(0, 8)}
                        {Array.isArray(row.projects) && row.projects.length > 1 && (
                          <span
                            className="ot-tooltip-icon"
                            style={{
                              marginLeft: "6px",
                              color: "#555",
                              fontSize: "12px",
                            }}
                          >
                            i
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="ot-td">{row.supervisors || "—"}</td>
                    <td className="ot-td">
                      <input
                        type="text"
                        value={edited[groupKey]?.comments ?? (row.comments || "")}
                        onChange={(e) => {
                          setEdited((prev) => ({
                            ...prev,
                            [groupKey]: { ...(prev[groupKey] || {}), comments: e.target.value },
                          }));
                        }}
                        disabled={approved}
                        className="ot-input-comments"
                      />
                    </td>
                    <td className="ot-td">
                      <span
                        className={`ot-status ot-status-${approved ? "approved" : "pending"}`}
                      >
                        {approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="ot-td ot-td-actions">
                      {!approved && (
                        <>
                          <button
                            className="ot-btn-icon ot-btn-approve"
                            onClick={() => approveOne(row)}
                            title="Approve"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            className="ot-btn-icon ot-btn-reject"
                            onClick={() => rejectOne(row)}
                            title="Reject"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
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

export default OvertimeDetails;