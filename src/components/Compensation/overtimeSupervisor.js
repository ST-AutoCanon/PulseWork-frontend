import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./overtimeSupervisor.css";
import Modal from "../../../src/components/Modal/Modal.client.jsx";
import { useAuth } from "../../context/AuthProvider.client";

const OvertimeSupervisor = () => {
  const { user, hydrated } = useAuth();
  
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [statusMap, setStatusMap] = useState({}); 
  const [edited, setEdited] = useState({});
  const [rateMap, setRateMap] = useState({});
  const [defaultHoursMap, setDefaultHoursMap] = useState({});
  const [tab, setTab] = useState("current");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const meId = user?.employeeId ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.org_id ?? null;
  const myName = user?.name ?? "";

  const headers = {
    "x-api-key": API_KEY,
    "x-employee-id": meId,
    "x-org-id": orgId,
    "Content-Type": "application/json",
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

  const monthLabel = (offset) => {
    const d = new Date();
    d.setMonth(d.getMonth() - offset);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const toLocalDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const fetchData = async () => {
  if (!hydrated || !meId || !orgId || !BASE_URL) {
    console.warn("Missing required data:", { hydrated, meId, orgId, BASE_URL });
    setError("Missing employee ID, organization, or API configuration");
    setLoading(false);
    return;
  }
  
  setLoading(true);
  setError(null);

  try {
    const cutoffRes = await axios.get(
      `${BASE_URL}/api/salaryCalculationperiods`,
      { withCredentials: true, headers }
    );
    const cutoff_date = cutoffRes.data?.data?.[0]?.cutoff_date || 28;

    const now = new Date();
    let selectedYear = now.getFullYear();
    let selectedMonth = now.getMonth(); // 0-based
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

   
    let startYear = selectedYear;
    let startMonth = selectedMonth;
    let startDay;

    const nowDay = now.getDate();

    if (nowDay <= cutoff_date) {
  
      startMonth = prevMonth;
      startYear = prevYear;
      startDay = effectivePrevCutoff + 1;
    } else {
     
      startMonth = prevMonth;
      startYear = prevYear;
      startDay = effectivePrevCutoff + 1;

  
      if (startDay > daysInPrevMonth) {
        startDay -= daysInPrevMonth;
        startMonth = selectedMonth;
        startYear = selectedYear;
      }
    }

    let periodEndDay = nowDay <= cutoff_date 
      ? effectiveThisCutoff 
      : nowDay;

    const periodStart = new Date(startYear, startMonth, startDay);
    const periodEnd = new Date(selectedYear, selectedMonth, periodEndDay);

    const fmtYMD = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    
    const startDate = fmtYMD(periodStart);
    const endDate = fmtYMD(periodEnd);

    console.log("Cutoff Date:", cutoff_date);
    console.log("Period:", startDate, "to", endDate);
    console.log("Debug info:", {
      tab,
      today: now.toISOString().split("T")[0],
      nowDay,
      cutoff_date,
      selectedMonth: selectedMonth + 1,
      selectedYear,
      startDay,
      periodEndDay,
      effectivePrevCutoff,
      effectiveThisCutoff,
      daysInPrevMonth,
      daysInThisMonth
    });

    const extraUrl = `${BASE_URL}/api/compensation/employee-extra-hours?startDate=${startDate}&endDate=${endDate}`;
    console.log("Fetching extra-hours URL:", extraUrl);

    const [extraRes, summaryRes, assignedRes, planListRes, teamRes] =
      await Promise.all([
        axios.get(extraUrl, { withCredentials: true, headers }),
        axios.get(`${BASE_URL}/api/compensation/overtime-status-summary`, {
          withCredentials: true,
          headers,
        }),
        axios.get(`${BASE_URL}/api/compensation/assigned`, {
          withCredentials: true,
          headers,
        }),
        axios.get(`${BASE_URL}/api/compensations/list`, {
          withCredentials: true,
          headers,
        }),
        axios.get(`${BASE_URL}/api/overtime-summary/${meId}`, {
          withCredentials: true,
          headers,
        }),
      ]);

    console.log("[DEBUG] Full response from employee-extra-hours:", extraRes.data);

    const teamEmployeeIds = new Set(
      (teamRes.data?.data || []).map((e) => e.employee_id)
    );

    const rateObj = {};
    const hoursObj = {};
    const assignedData = assignedRes.data?.data || [];
    const planList = planListRes.data?.data || [];
    const planHoursMap = {};
    planList.forEach((p) => {
      planHoursMap[p.id] = parseFloat(p.plan_data?.defaultWorkingHours) || 8;
    });
    assignedData.forEach((a) => {
      const rate = parseFloat(a.plan_data?.overtimePayAmount || 0);
      const defHrs = planHoursMap[a.id] || 8;
      (a.assigned_data || []).forEach((emp) => {
        rateObj[emp.employee_id] = rate;
        hoursObj[emp.employee_id] = defHrs;
      });
    });
    setRateMap(rateObj);
    setDefaultHoursMap(hoursObj);

    const rawMain = (extraRes.data?.data || []).filter((item) =>
      teamEmployeeIds.has(item.employee_id)
    );

    // ───────────────────────────────────────────────────────────────
    // Debug: show raw work_date values coming from backend
    // ───────────────────────────────────────────────────────────────
    if (rawMain.length > 0) {
      console.log(`[DEBUG] Received ${rawMain.length} extra-hours records`);
      rawMain.forEach((item, i) => {
        console.log(
          `  Record ${i + 1}: employee=${item.employee_id || '?'}, ` +
          `work_date="${item.work_date}", type=${typeof item.work_date}`
        );
      });
    } else {
      console.log("[DEBUG] Backend returned ZERO extra-hours records for this period");
    }

    // More tolerant date parser
    const parseYMD = (s) => {
      if (!s) return null;
      // Remove time part if present (ISO format)
      let datePart = s.split('T')[0].split(' ')[0];
      // Replace other separators
      datePart = datePart.replace(/[-/.]/g, '-');
      const parts = datePart.split('-');
      if (parts.length !== 3) return null;

      let [y, m, d] = parts.map(p => parseInt(p, 10));
      
      // Detect DD-MM-YYYY and swap
      if (y < 100 && m <= 12 && d >= 1 && d <= 31) {
        [y, m, d] = [2000 + y, d, m]; // assuming 20xx
      }

      if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) {
        return null;
      }

      return new Date(y, m - 1, d);
    };

    const mainData = rawMain
      .map((item) => {
        const localDate = toLocalDate(item.work_date);
        const totalHrs = parseFloat(item.total_hours_worked) || 0;
        const defHrs = hoursObj[item.employee_id] || 8;
        const extra = totalHrs > defHrs ? totalHrs - defHrs : 0;

        const sessions = (item.sessions || []).map((s) => ({
          ...s,
          extra_hours:
            item.sessions.length > 0
              ? (extra / item.sessions.length).toFixed(2)
              : "0.00",
        }));

        return {
          ...item,
          work_date: localDate,
          extra_hours: extra.toFixed(2),
          sessions,
          employee_name: item.employee_name || "—",
        };
      })
      .filter((row) => {
        const sDate = parseYMD(startDate);
        const eDate = parseYMD(endDate);
        const dt = parseYMD(row.work_date);

        const isValid = dt && sDate && eDate && dt >= sDate && dt <= eDate;

        // Extra debug for filtered rows
        if (!isValid && row.work_date) {
          console.log(
            `[FILTERED OUT] work_date="${row.work_date}" → parsed=`,
            dt ? dt.toISOString().split('T')[0] : "INVALID",
            `  (range: ${startDate} – ${endDate})`
          );
        }

        return isValid;
      });

    if (mainData.length !== rawMain.length) {
      console.log(
        "Supervisor view: filtered out",
        rawMain.length - mainData.length,
        "out-of-range rows"
      );
    }

    setData(mainData);

    const statusMap = {};
    const summaryData = summaryRes.data?.data || [];
    summaryData.forEach((r) => {
      if (
        r.employee_id &&
        r.work_date &&
        teamEmployeeIds.has(r.employee_id)
      ) {
        const key = `${r.employee_id}-${toLocalDate(r.work_date)}`;
        // Store actual status (Approved, Rejected, or undefined for pending)
        if (r.status) {
          statusMap[key] = r.status;
        }
      }
    });
    setStatusMap(statusMap);
  } catch (err) {
    console.error("Fetch error:", err);
    const errorMsg = err.response?.data?.error || err.message || "Failed to load data";
    setError(errorMsg);
    showAlert(errorMsg);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    if (!hydrated || !meId) {
      console.log("Waiting for hydration and user data...", { hydrated, meId });
      return;
    }
    fetchData();
  }, [tab, hydrated, meId]);

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

  const rowKey = (item) => `${item.employee_id}-${item.work_date}`;
  const getRowStatus = (item) => statusMap[rowKey(item)];
  const isProcessed = (item) => statusMap[rowKey(item)] !== undefined; // Approved or Rejected
  const isRowSelected = (item) => selected.has(rowKey(item));

  const toggleRow = (item) => {
    if (isProcessed(item)) return; // Disable if approved or rejected
    const key = rowKey(item);
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const toggleAll = () => {
    const keys = filtered.filter((r) => !isProcessed(r)).map(rowKey);
    setSelected((prev) =>
      keys.every((k) => prev.has(k)) ? new Set() : new Set(keys)
    );
  };

  const isAllSelected =
    filtered.filter((r) => !isProcessed(r)).length > 0 &&
    filtered
      .filter((r) => !isProcessed(r))
      .every((r) => selected.has(rowKey(r)));

  // const buildPayload = (status, parent) => {
  //   const groupKey = rowKey(parent);

  //   const effectiveRate =
  //     edited[groupKey]?.rate !== undefined
  //       ? parseFloat(edited[groupKey].rate)
  //       : rateMap[parent.employee_id] ?? 0;

  //   const effectiveComments = edited[groupKey]?.comments ?? "";

  //   return [
  //     {
  //       punch_id: `${parent.employee_id}_${parent.work_date}`,
  //       work_date: parent.work_date,
  //       employee_id: parent.employee_id,
  //       extra_hours: parseFloat(parent.extra_hours) || 0,
  //       rate: effectiveRate ? parseFloat(effectiveRate.toFixed(2)) : 0,

  //       project: parent.project_name?.trim() || "",

  //       supervisor: myName.trim() || meId,

  //       comments: effectiveComments,
  //       status: status,
  //     },
  //   ];
  // };
const buildPayload = (status, row) => {
  const key = rowKey(row);
  const rateToSend =
    edited[key]?.rate !== undefined
      ? edited[key].rate
      : (rateMap[row.employee_id] ?? 0);

  return [
    {
      punch_id: `${row.employee_id}_${row.work_date}`,
      work_date: row.work_date,
      employee_id: row.employee_id,
      extra_hours: parseFloat(row.extra_hours) || 0,
      rate: parseFloat(rateToSend.toFixed(2)),
      project: row.project_name?.trim() || "",
      supervisor: myName.trim() || meId,
      comments: edited[key]?.comments ?? "",
      status,
    },
  ];
};

  const bulkUpdate = async (payload, action) => {
    if (!payload.length) return;

    try {
      const res = await axios.post(
       `${BASE_URL}/api/compensation/overtime-bulk`,
        { data: payload },
        { withCredentials: true, headers }
      );

      showAlert(`Successfully ${action} ${payload.length} record(s)`);

      await fetchData();
      setSelected(new Set());
      setEdited({});
    } catch (err) {
      console.error("Update error:", err.response?.data || err);
      showAlert(`Failed: ${err.response?.data?.details || err.message}`);
    }
  };

  const approveAll = () => {
    const payload = [];
    filtered.forEach((r) => {
      if (selected.has(rowKey(r))) {
        payload.push(...buildPayload("Approved", r));
      }
    });

    if (payload.length) bulkUpdate(payload, "Approved");
  };

  const rejectAll = () => {
    const payload = [];
    filtered.forEach((r) => {
      if (selected.has(rowKey(r))) {
        payload.push(...buildPayload("Rejected", r));
      }
    });

    if (payload.length) bulkUpdate(payload, "Rejected");
  };

  // const approveOne = (row) =>
  //   bulkUpdate(buildPayload("Approved", row), "Approved");
const approveOne = (row) => {
  const key = rowKey(row);

  const rateToUse =
    edited[key]?.rate !== undefined
      ? edited[key].rate
      : (rateMap[row.employee_id] ?? 0);

  console.log("Approving → rate sent:", rateToUse);

  const payload = buildPayload("Approved", row); // will use rateToUse

  bulkUpdate(payload, "Approved").then(() => {
    // After successful update → patch local data
    setData((prevData) =>
      prevData.map((item) =>
        rowKey(item) === key
          ? { ...item, approved_rate: rateToUse } // ← new field
          : item
      )
    );

    // Also clear edited state for this row
    setEdited((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  });
};


  const rejectOne = (row) =>
    bulkUpdate(buildPayload("Rejected", row), "Rejected");

  if (loading) return <div className="ot-loading">Loading…</div>;

  return (
    <div className="ot-container">
      <h1>Supervisor Overtime Approval</h1>

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
          <button
            className="ot-btn ot-btn-approve"
            onClick={approveAll}
            disabled={selected.size === 0}
          >
            Approve Selected
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
        <p className="ot-no-data">No overtime records found for your team</p>
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
                <th className="ot-th">Name</th>
                <th className="ot-th ot-align-right">Total Hrs</th>
                <th className="ot-th ot-align-right">Extra Hrs</th>
                <th className="ot-th ot-align-right">Rate</th>
                <th className="ot-th">Status</th>
                <th className="ot-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const key = rowKey(row);
                const status = getRowStatus(row);
                const isDisabled = isProcessed(row);
                const sel = isRowSelected(row);
                const defaultRate = rateMap[row.employee_id] ?? 0;

                return (
                  <tr key={key} className={isDisabled ? "ot-row-disabled" : ""}>
                    <td className="ot-td ot-td-select">
                      <input
                        type="checkbox"
                        checked={sel}
                        disabled={isDisabled}
                        onChange={() => toggleRow(row)}
                      />
                    </td>
                    <td className="ot-td">{row.work_date}</td>
                    <td className="ot-td">{row.employee_id}</td>
                    <td className="ot-td">{row.employee_name}</td>
                    <td className="ot-td ot-align-right">
                      {Number(row.total_hours_worked || 0).toFixed(2)}
                    </td>
                    <td className="ot-td ot-align-right">
                      {parseFloat(row.extra_hours || 0).toFixed(2)}
                    </td>
                   <td className="ot-td ot-align-right">
  {getRowStatus(row) === "Approved" ? (
    <span className="ot-approved-rate">
      {(row.approved_rate ?? rateMap[row.employee_id] ?? 0).toFixed(2)}
    </span>
  ) : (
    <input
      type="number"
      step="0.01"
      min="0"
      value={
        edited[key]?.rate !== undefined
          ? edited[key].rate.toFixed(2)
          : (rateMap[row.employee_id] ?? 0).toFixed(2)
      }
      disabled={isDisabled}
      className="ot-input-rate"
      onChange={(e) => {
        const val = parseFloat(e.target.value) || 0;
        setEdited((prev) => ({
          ...prev,
          [key]: { ...(prev[key] || {}), rate: val },
        }));
      }}
      onBlur={(e) => {
        const val = parseFloat(e.target.value) || 0;
        setEdited((prev) => ({
          ...prev,
          [key]: { ...(prev[key] || {}), rate: val },
        }));
      }}
    />
  )}
</td>
  <td className="ot-td">
                      <span
                        className={`ot-status ot-status-${
                          status === "Approved" ? "approved" : status === "Rejected" ? "rejected" : "pending"
                        }`}
                      >
                        {status || "Pending"}
                      </span>
                    </td>
                    <td className="ot-td ot-td-actions">
                      {!isDisabled && (
                        <>
                          <button
  className="ot-btn-icon ot-btn-approve"
  onClick={() =>
    approveOne(
      row,
      edited[key]?.rate ?? defaultRate
    )
  }
>

                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            className="ot-btn-icon ot-btn-reject"
                            onClick={() => rejectOne(row)}
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

export default OvertimeSupervisor;
