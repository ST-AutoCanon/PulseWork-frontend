
"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./OvertimeDetails.css";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

const OvertimeDetails = () => {
  const { user, hydrated } = useAuth();

  const orgId = user?.orgId ?? user?.org_id ?? user?.raw?.org_id ?? null;
  const employeeId = user?.employeeId ?? user?.id ?? null;

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const isReady = () => !!BACKEND && !!user && !!hydrated && !!orgId && !!employeeId;

  const getHeaders = () => ({
    "x-api-key": API_KEY,
    "x-employee-id": String(employeeId),
    "x-org-id": String(orgId),
    "Content-Type": "application/json",
  });

  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [approvedSet, setApprovedSet] = useState(new Set());
  const [statusMap, setStatusMap] = useState({});
  const [edited, setEdited] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [rateMap, setRateMap] = useState({});
  const [defaultHoursMap, setDefaultHoursMap] = useState({});
  const [maxOverMap, setMaxOverMap] = useState({});
  const [tab, setTab] = useState("current");
  const [search, setSearch] = useState("");
  const [onlyOverDefault, setOnlyOverDefault] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const monthLabel = (offset) => {
    const d = new Date();
    d.setMonth(d.getMonth() - offset);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const toLocalDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const approveOne = (row) => {
  console.log("Approve clicked row:", row);
  console.log("Sessions:", row.sessions);
  console.log("Sessions length:", row.sessions?.length);

  const payload = buildPayload(row.sessions, "Approved", row);
  console.log("Payload built:", payload);

  bulkUpdate(payload, "approved");
};


  const fetchData = async () => {
    if (!isReady()) return;
    setLoading(true);
    try {
      const headers = getHeaders();

      // Fetch cutoff date
      const cutoffRes = await axios.get(`${BACKEND}/api/salaryCalculationperiods`, {
        withCredentials: true,
        headers,
      });
      const cutoff_date = cutoffRes.data?.data?.[0]?.cutoff_date || 31;

      const now = new Date();

      let selectedYear = now.getFullYear();
      let selectedMonth = now.getMonth();

      if (tab === "prev1") selectedMonth -= 1;
      else if (tab === "prev2") selectedMonth -= 2;

      if (selectedMonth < 0) {
        selectedMonth += 12;
        selectedYear -= 1;
      }

      let prevYear = selectedYear;
      let prevMonth = selectedMonth - 1;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
      }

      const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      const effectivePrevCutoff = Math.min(cutoff_date, daysInPrevMonth);

      const daysInThisMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const effectiveThisCutoff = Math.min(cutoff_date, daysInThisMonth);

      let startYear = prevYear;
      let startMonth = prevMonth;
      let startDay = effectivePrevCutoff + 1;

      if (startDay > daysInPrevMonth) {
        startDay = 1;
        startMonth += 1;
        if (startMonth > 11) {
          startMonth = 0;
          startYear += 1;
        }
      }

      const periodStart = new Date(startYear, startMonth, startDay);
      const periodEnd = new Date(selectedYear, selectedMonth, effectiveThisCutoff);

      const fmtYMD = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const startDate = fmtYMD(periodStart);
      const endDate = fmtYMD(periodEnd);

      const extraUrl = `${BACKEND}/api/compensation/employee-extra-hours?startDate=${startDate}&endDate=${endDate}`;

      const [extraRes, summaryRes, assignedRes, planListRes] = await Promise.all([
        axios.get(extraUrl, { withCredentials: true, headers }),
        axios.get(`${BACKEND}/api/compensation/overtime-status-summary`, { withCredentials: true, headers }),
        axios.get(`${BACKEND}/api/compensation/assigned`, { withCredentials: true, headers }),
        axios.get(`${BACKEND}/api/compensations/list`, { withCredentials: true, headers }),
      ]);

      // Summary map for project/supervisor fallback and approved status
      const summaryData = summaryRes.data?.data || [];
      const summaryMap = {};
      summaryData.forEach((item) => {
        summaryMap[item.employee_id] = {
          project:
            item.project ||
            item.projects ||
            item.project_name ||
            item.project_names ||
            item.projectNames ||
            "—",
          supervisor:
            item.supervisor ||
            item.supervisors ||
            item.supervisor_name ||
            item.supervisorName ||
            "—",
        };
      });

      // Rate map from assigned plans
      const rateObj = {};
      const assignedData = assignedRes.data?.data || assignedRes.data || [];
      assignedData.forEach((plan) => {
        const rate = parseFloat(plan.plan_data?.overtimePayAmount || "0") || 0;
        (plan.assigned_data || []).forEach((emp) => {
          rateObj[emp.employee_id] = rate;
        });
      });
      setRateMap(rateObj);

      // Default hours and max overtime from plans
      const hoursObj = {};
      const maxObj = {};
      const planList = planListRes.data?.data || [];

      const planHoursById = {};
      const planMaxById = {};
      const planHoursByName = {};
      const planMaxByName = {};
      planList.forEach((plan) => {
        const hours = parseFloat(plan.plan_data?.defaultWorkingHours) || 8;
        const planName = plan.compensation_plan_name || plan.compensationPlanName || plan.plan_data?.compensationPlanName || "";
        planHoursById[plan.id] = hours;
        if (planName) planHoursByName[planName] = hours;

        let maxH = null;
        if (plan.plan_data) {
          maxH = parseFloat(plan.plan_data.maxovertimeworkinghours) ||
                 parseFloat(plan.plan_data.max_overtime_working_hours) ||
                 parseFloat(plan.plan_data.maxOvertimeWorkingHours) || null;
        }
        const finalMax = !isNaN(maxH) && maxH > 0 ? maxH : hours / 2;
        planMaxById[plan.id] = finalMax;
        if (planName) planMaxByName[planName] = finalMax;
      });

      assignedData.forEach((assignment) => {
        let defaultHours = 8;
        let maxHours = null;
        if (assignment.plan_data) {
          defaultHours = parseFloat(assignment.plan_data.defaultWorkingHours) || 8;
          maxHours = parseFloat(assignment.plan_data.maxovertimeworkinghours) ||
                     parseFloat(assignment.plan_data.max_overtime_working_hours) ||
                     parseFloat(assignment.plan_data.maxOvertimeWorkingHours) || null;
          if (isNaN(maxHours) || maxHours <= 0) maxHours = defaultHours / 2;
        } else {
          const planId = assignment.plan_id || assignment.compensation_plan_id || null;
          const planName = assignment.compensation_plan_name || assignment.compensation_plan || null;
          defaultHours = (planId && planHoursById[planId]) || (planName && planHoursByName[planName]) || 8;
          maxHours = (planId && planMaxById[planId]) || (planName && planMaxByName[planName]) || defaultHours / 2;
        }

        (assignment.assigned_data || []).forEach((emp) => {
          hoursObj[emp.employee_id] = defaultHours;
          maxObj[emp.employee_id] = maxHours;
        });
      });
      setDefaultHoursMap(hoursObj);
      setMaxOverMap(maxObj);

      // Process raw extra hours data
      const rawData = (extraRes.data?.data || []).map((item) => {
        const localDate = toLocalDate(item.work_date || item.punchin_time);
        const totalHrs = parseFloat(item.total_hours_worked) || 0;
        const defaultHrs = hoursObj[item.employee_id] || 8;
        const planMax = maxObj[item.employee_id] || defaultHrs / 2;
        const rawExtra = totalHrs > defaultHrs ? totalHrs - defaultHrs : 0;
        const allowedExtra = Math.min(rawExtra, planMax);
        const exceeded = rawExtra > planMax;

        const sessionsWithCorrectedExtra = (item.sessions || []).map((s) => {
          const apportioned = parseFloat(s.apportioned_hours) || 0;
          return {
            ...s,
            extra_hours: (() => {
              const totalApportioned = (item.sessions || []).reduce(
                (sum, ss) => sum + (parseFloat(ss.apportioned_hours) || 0),
                0
              );
              if (totalApportioned <= 0) return 0..toFixed(2);
              const val = (apportioned / totalApportioned) * allowedExtra;
              return val.toFixed(2);
            })(),
          };
        });

        return {
          ...item,
          work_date: localDate,
          projects: item.projects || item.project || summaryMap[item.employee_id]?.project || "—",
          supervisors: item.supervisors || item.supervisor || summaryMap[item.employee_id]?.supervisor || "—",
          extra_hours: allowedExtra.toFixed(2),
          sessions: sessionsWithCorrectedExtra,
          defaultWorkingHours: defaultHrs,
          maxOvertimeHours: planMax,
          exceeded,
        };
      });

      // Merge multiple punches per day per employee
      const merged = {};
      rawData.forEach((it) => {
        const key = `${it.employee_id}-${it.work_date}`;
        if (!merged[key]) {
          merged[key] = { ...it, sessions: Array.from(it.sessions || []) };
        } else {
          const existing = merged[key];
          existing.sessions = existing.sessions.concat(it.sessions || []);
          existing.total_hours_worked = (
            (parseFloat(existing.total_hours_worked) || 0) +
            (parseFloat(it.total_hours_worked) || 0)
          ).toFixed(2);
          existing.extra_hours = Math.max(
            parseFloat(existing.extra_hours) || 0,
            parseFloat(it.extra_hours) || 0
          ).toFixed(2);
          existing.projects = [existing.projects, it.projects].filter(Boolean).join(", ").replace(/(,\s*)+/g, ", ");
          existing.supervisors = [existing.supervisors, it.supervisors].filter(Boolean).join(", ").replace(/(,\s*)+/g, ", ");
          existing.comments = [existing.comments, it.comments].filter(Boolean).join("; ");
          existing.exceeded = existing.exceeded || it.exceeded;
          existing.rate = existing.rate || it.rate || 0;
        }
      });

      const processedData = Object.values(merged);

      // Filter to exact period
      const parseYMD = (s) => {
        const [y, m, d] = (s || "").split("-").map((x) => parseInt(x, 10));
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d);
      };
      const sDate = parseYMD(startDate);
      const eDate = parseYMD(endDate);
      const inRange = processedData.filter((row) => {
        const dt = parseYMD(row.work_date);
        if (!dt || !sDate || !eDate) return false;
        return dt >= sDate && dt <= eDate;
      });

      setData(inRange);

      // Build status map and approved set from summary
      const sMap = {};
      const approved = new Set();
      summaryData.forEach((r) => {
        if (r.employee_id && r.work_date) {
          const localDate = toLocalDate(r.work_date);
          const key = `${r.employee_id}-${localDate}`;
          if (r.status) sMap[key] = String(r.status || "");
          if (String(r.status || "").toLowerCase() === "approved") {
            approved.add(key);
          }
        }
      });
      setStatusMap(sMap);
      setApprovedSet(approved);
    } catch (err) {
      console.error("Fetch error:", err);
      showAlert("Failed to load overtime data. Check network or server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady()) {
      fetchData();
    }
  }, [tab, user, hydrated, orgId, employeeId]);

  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase();
    return data.filter((r) => {
      if (onlyOverDefault) {
        const defaultHrs = parseFloat(r.defaultWorkingHours || defaultHoursMap[r.employee_id] || 0) || 0;
        const total = parseFloat(r.total_hours_worked) || 0;
        if (!(total > defaultHrs)) return false;
      }

      if (!q) return true;
      return (
        (r.employee_id || "").toLowerCase().includes(q) ||
        (r.employee_name || "").toLowerCase().includes(q) ||
        (r.work_date || "").includes(q)
      );
    });
  }, [data, search, onlyOverDefault, defaultHoursMap]);

  const rowKey = (item) => `${item.employee_id}-${item.work_date}`;

  const getRowStatus = (item) => {
    const key = rowKey(item);
    const mapped = statusMap[key];
    if (mapped) return String(mapped);
    const sessions = item.sessions || [];
    const found = sessions.find((s) => s && s.status);
    if (found) return String(found.status);
    return undefined;
  };

  const isProcessed = (item) => {
    return !!getRowStatus(item);
  };

  const isApproved = (item) => {
    const st = getRowStatus(item);
    return String(st || "").toLowerCase() === "approved";
  };

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

  const buildPayload = (sessions = [], status, parent) => {
  const groupKey = rowKey(parent);

  const effectiveRate =
    edited[groupKey]?.rate ??
    rateMap[parent.employee_id] ??
    parent.rate ??
    0;

  const effectiveComments =
    edited[groupKey]?.comments ?? (parent.comments || "");

  const defaultHrs =
    defaultHoursMap[parent.employee_id] ??
    parent.defaultWorkingHours ??
    8;

  const planMax =
    maxOverMap[parent.employee_id] ??
    parent.maxOvertimeHours ??
    defaultHrs / 2;

  const rawExtra = Math.max(
    0,
    (parseFloat(parent.total_hours_worked) || 0) - defaultHrs
  );

  const allowedExtra = Math.min(rawExtra, planMax || rawExtra);

  /* -----------------------------
     CASE 1: NO SESSIONS FOUND
     ----------------------------- */
  if (!sessions.length) {
    return [
      {
        punch_id: parent.punch_id || `${parent.employee_id}_${parent.work_date}`,
        work_date: parent.work_date,
        employee_id: parent.employee_id,
        extra_hours: Math.round(allowedExtra * 100) / 100,
        rate: effectiveRate,
        project: parent.projects || "",
        supervisor: parent.supervisors || "",
        comments: effectiveComments,
        status,
      },
    ];
  }

  /* -----------------------------
     CASE 2: SESSIONS EXIST
     ----------------------------- */
  const totalApportioned = sessions.reduce(
    (sum, s) => sum + (parseFloat(s.apportioned_hours) || 0),
    0
  );

  return sessions.map((s) => {
    let sessionExtra = 0;

    if (allowedExtra > 0 && totalApportioned > 0) {
      sessionExtra =
        ((parseFloat(s.apportioned_hours) || 0) / totalApportioned) *
        allowedExtra;
    }

    return {
      punch_id: s.punch_id,
      work_date: parent.work_date,
      employee_id: parent.employee_id,
      extra_hours: Math.round(sessionExtra * 100) / 100,
      rate: effectiveRate,
      project: parent.projects || "",
      supervisor: parent.supervisors || "",
      comments: effectiveComments,
      status,
    };
  });
};


//   const bulkUpdate = async (payload, status) => {
//    if (!payload.length) {
//   showAlert("No overtime data available to approve.");
//   return;
// }

//     try {
//       await axios.post(
//         `${BACKEND}/api/compensation/overtime-bulk`,
//         { data: payload },
//         { withCredentials: true, headers: getHeaders() }
//       );
//       const sessionsCount = payload.length;
//       const rowsCount = new Set(payload.map((p) => `${p.employee_id}-${p.work_date}`)).size;
//       showAlert(`Successfully ${status} ${sessionsCount} session(s) for ${rowsCount} row(s)`);
//       await fetchData();
//       setSelected(new Set());
//     } catch (err) {
//       console.error("Update error:", err.response?.data || err);
//       showAlert(`Failed: ${err.response?.data?.details || err.message}`);
//     }
//   };

  const bulkUpdate = async (payload, statusValue) => {
    if (!payload.length) {
      showAlert("No overtime data available to process.");
      return;
    }

    try {
      await axios.post(
        `${BACKEND}/api/compensation/overtime-bulk`,
        { data: payload },
        { withCredentials: true, headers: getHeaders() }
      );

      const sessionsCount = payload.length;
      const rowsCount = new Set(payload.map((p) => `${p.employee_id}-${p.work_date}`)).size;
      const action = String(statusValue || "").toLowerCase() === "approved" ? "approved" : "rejected";
      showAlert(`Successfully ${action} ${sessionsCount} session(s) for ${rowsCount} row(s)`);
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
    if (toApprove.length > 0) bulkUpdate(toApprove, "approved");
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
    if (toReject.length > 0) bulkUpdate(toReject, "rejected");
  };

  // const approveOne = (row) => {
  //   const payload = buildPayload(row.sessions, "Approved", row);
  //   bulkUpdate(payload, "approved");
  // };

  const rejectOne = (row) => {
    const payload = buildPayload(row.sessions, "Rejected", row);
    bulkUpdate(payload, "rejected");
  };

  const approveSession = (session, parent) => {
    const payload = buildPayload([session], "Approved", parent);
    bulkUpdate(payload, "approved");
  };

  const rejectSession = (session, parent) => {
    const payload = buildPayload([session], "Rejected", parent);
    bulkUpdate(payload, "rejected");
  };

  const toggleExpand = (key) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!isReady() || loading) return <div className="ot-loading">Loading…</div>;

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
        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginLeft: "12px" }}>
          <input
            type="checkbox"
            checked={onlyOverDefault}
            onChange={(e) => setOnlyOverDefault(e.target.checked)}
          />
          <span style={{ fontSize: "13px" }}>Only &gt; Default Hrs</span>
        </label>
        <div className="ot-bulk-actions">
          <button
            className="ot-btn ot-btn-approve"
            onClick={approveAll}
            disabled={selected.size === 0}
          >
            Approve Selected. 
          </button>
          <button
            className="ot-btn ot-btn-reject"
            onClick={rejectAll}
            disabled={selected.size === 0}
          >
            Reject Selected
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="ot-no-data">
          {data.length === 0
            ? "No attendance records found for this payroll period"
            : onlyOverDefault
            ? "No days exceeding default working hours"
            : "No records match the current search/filter"}
        </p>
      ) : (
        <div className="ot-table-wrapper">
          <table className="ot-table">
            <thead>
              <tr>
                <th className="ot-th ot-th-select">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                  />
                </th>
                <th className="ot-th">Date</th>
                <th className="ot-th">Employee ID</th>
                <th className="ot-th">Employee Name</th>
                <th className="ot-th ot-align-right">Default Hrs</th>
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
                const sel = isRowSelected(row);
                const groupKey = key;
                const defaultRate = rateMap[row.employee_id] ?? row.rate ?? 0;
                const statusLabel = getRowStatus(row);
                const isApprovedBool = String(statusLabel || "").toLowerCase() === "approved";
                const isRejectedBool = String(statusLabel || "").toLowerCase() === "rejected";
                const processed = isProcessed(row);

                return (
                  <React.Fragment key={key}>
                    <tr className={processed ? "ot-row-disabled" : ""}>
                      <td className="ot-td ot-td-select">
                        <input
                          type="checkbox"
                          checked={sel}
                          disabled={processed}
                          onChange={() => toggleRow(row)}
                        />
                      </td>
                      <td className="ot-td">{row.work_date}</td>
                      <td className="ot-td">{row.employee_id}</td>
                      <td className="ot-td">{row.employee_name || "—"}</td>
                      <td className="ot-td ot-align-right">
                        {Number(row.defaultWorkingHours || defaultHoursMap[row.employee_id] || 0).toFixed(2)}
                      </td>
                      <td className="ot-td ot-align-right">
                        {Number(row.total_hours_worked || 0).toFixed(2)}
                      </td>
                      <td className="ot-td ot-align-right">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                          {(() => {
                            const defaultHrs = Number(row.defaultWorkingHours || defaultHoursMap[row.employee_id] || 0);
                            const totalHrs = Number(row.total_hours_worked || 0);
                            const rawExtra = Math.max(0, totalHrs - defaultHrs);
                            const allowed = Number(row.extra_hours || 0);
                            const exceededBy = Math.max(0, rawExtra - allowed);
                            return (
                              <>
                                {/* <span>{allowed.toFixed(2)}</span> */}
                                <small style={{ color: '#666', fontSize: '12px', marginLeft: 6 }} title="Total extra hours worked">
                                   {rawExtra.toFixed(2)}
                                </small>
                                {row.exceeded && (
                                  <span style={{ color: "#c0392b", fontWeight: 700, fontSize: "12px", marginLeft: 8 }} title={`Raw extra exceeds max (${row.maxOvertimeHours})`}>
                                    Exc'ds by {exceededBy.toFixed(2)}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="ot-td ot-align-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                       value={Number(edited[groupKey]?.rate ?? defaultRate ?? 0).toFixed(2)}

                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEdited((prev) => ({
                              ...prev,
                              [groupKey]: {
                                ...(prev[groupKey] || {}),
                                rate: val,
                              },
                            }));
                          }}
                          disabled={processed}
                          className="ot-input-rate"
                        />
                      </td>
                      <td className="ot-td">
                        <div
                          className="ot-project-tooltip"
                          title={row.projects || "—"}
                          style={{
                            maxWidth: "50px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {(row.projects || "—").slice(0, 20)}...
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
                              [groupKey]: {
                                ...(prev[groupKey] || {}),
                                comments: e.target.value,
                              },
                            }));
                          }}
                          disabled={processed}
                          className="ot-input-comments"
                        />
                      </td>
                        <td className="ot-td">
                        <span className={`ot-status ot-status-${isApprovedBool ? "approved" : isRejectedBool ? "rejected" : "pending"}`}>
                          {isApprovedBool ? "Approved" : isRejectedBool ? "Rejected" : "Pending"}
                        </span>
                      </td>
                      <td className="ot-td ot-td-actions">
                        {/* <button
                          className="ot-btn-icon"
                          onClick={() => toggleExpand(key)}
                          title="Toggle sessions"
                        >
                          <i className={`fas ${expandedRows.has(key) ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                        </button> */}
                        {!processed && (
                          <>
                            <button
                              className="ot-btn-icon ot-btn-approve"
                              onClick={() => approveOne(row)}
                              title="Approve All Sessions"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              className="ot-btn-icon ot-btn-reject"
                              onClick={() => rejectOne(row)}
                              title="Reject All Sessions"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                    {expandedRows.has(key) && (
                      <tr key={`${key}-sessions`} className="ot-row-sessions">
                        <td colSpan={13} style={{ padding: 8 }}>
                          <div style={{ padding: 8 }}>
                            <strong>Sessions:</strong>
                            <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: "left" }}>Punch ID</th>
                                  <th style={{ textAlign: "right" }}>Apportioned Hrs</th>
                                  <th style={{ textAlign: "right" }}>Extra Hrs</th>
                                  <th style={{ textAlign: "left" }}>Status</th>
                                  <th style={{ textAlign: "center" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(row.sessions || []).map((s) => (
                                  <tr key={s.punch_id}>
                                    <td>{s.punch_id}</td>
                                    <td style={{ textAlign: "right" }}>{Number(s.apportioned_hours || 0).toFixed(2)}</td>
                                    <td style={{ textAlign: "right" }}>{Number(s.extra_hours || 0).toFixed(2)}</td>
                                    <td>{s.status || "Pending"}</td>
                                    <td style={{ textAlign: "center" }}>
                                      <button
                                        className="ot-btn-icon ot-btn-approve"
                                        onClick={() => approveSession(s, row)}
                                        disabled={String(s.status || "").toLowerCase() === "approved"}
                                        title="Approve"
                                      >
                                        <i className="fas fa-check"></i>
                                      </button>
                                      <button
                                        className="ot-btn-icon ot-btn-reject"
                                        onClick={() => rejectSession(s, row)}
                                        disabled={String(s.status || "").toLowerCase() === "rejected"}
                                        title="Reject"
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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