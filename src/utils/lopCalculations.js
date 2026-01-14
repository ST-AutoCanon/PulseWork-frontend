"use client";
import axios from "axios";

const emptyLOPResult = () => ({
  currentMonth: { days: 0, value: "0.00", currency: "INR" },
  deferred: { days: 0, value: "0.00", currency: "INR" },
  nextMonth: { days: 0, value: "0.00", currency: "INR" },
  yearly: { days: 0, value: "0.00", currency: "INR" },
});

const fetchLOPData = async ({ employeeId, meId, orgId }) => {
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!BACKEND_URL) {
    console.warn("fetchLOPData: BACKEND_URL not configured");
    return {
      currentMonthLOP: [],
      yearlyLOP: [],
      deferredLOP: [],
      nextMonthLOP: [],
    };
  }

  const headers = {};
  if (API_KEY) headers["x-api-key"] = API_KEY;
  if (meId) headers["x-employee-id"] = meId;
  if (orgId) headers["x-org-id"] = orgId;

  const [currentMonthResponse, deferredResponse, nextMonthResponse] =
    await Promise.all([
      axios
        .get(`${BACKEND_URL}/api/lop/current-month-lop`, {
          withCredentials: true,
          headers,
        })
        .catch(() => ({ data: { data: [] } })),
      axios
        .get(`${BACKEND_URL}/api/lop/deferred-lop`, {
          withCredentials: true,
          headers,
        })
        .catch(() => ({ data: { data: [] } })),
      axios
        .get(`${BACKEND_URL}/api/lop/next-month-lop`, {
          withCredentials: true,
          headers,
        })
        .catch(() => ({ data: { data: [] } })),
    ]);

  const normalize = (v) => String(v || "").toUpperCase();

  return {
    currentMonthLOP: currentMonthResponse.data.data.filter(
      (lop) => normalize(lop.employee_id) === normalize(employeeId)
    ),
    yearlyLOP: currentMonthResponse.data.data.filter(
      (lop) => normalize(lop.employee_id) === normalize(employeeId)
    ),
    deferredLOP: deferredResponse.data.data.filter(
      (lop) => normalize(lop.employee_id) === normalize(employeeId)
    ),
    nextMonthLOP: nextMonthResponse.data.data.filter(
      (lop) => normalize(lop.employee_id) === normalize(employeeId)
    ),
  };
};

export const calculateLOPEffect = async ({
  employeeId,
  meId,
  orgId,
  referenceMonthYear = null,
}) => {
  if (!employeeId) return emptyLOPResult();

  let lopRecords;
  try {
    lopRecords = await fetchLOPData({ employeeId, meId, orgId });
  } catch (err) {
    console.warn(
      `calculateLOPEffect: failed to fetch LOP for ${employeeId}:`,
      err
    );
    return emptyLOPResult();
  }

  const today = new Date();
  let refMonth = today.getMonth() + 1;
  let refYear = today.getFullYear();

  if (referenceMonthYear) {
    const [year, month] = referenceMonthYear.split("-").map(Number);
    if (!isNaN(year) && !isNaN(month)) {
      refMonth = month;
      refYear = year;
    }
  }

  const employeeLOP = lopRecords.currentMonthLOP || [];
  const currentMonthFiltered = employeeLOP.filter(
    (lop) => Number(lop.month) === refMonth && Number(lop.year) === refYear
  );

  const effectiveLOP =
    currentMonthFiltered.length > 0
      ? currentMonthFiltered[0]
      : employeeLOP.slice(-1)[0] || {
          total_lop: 0,
          total_lop_value: "0.00",
          per_day_value: 0,
        };

  let valueStr = effectiveLOP.total_lop_value || "0.00";
  try {
    if ((!valueStr || valueStr === "0.00") && Number(effectiveLOP.total_lop)) {
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const headers = {
        "x-api-key": API_KEY || "",
        "x-employee-id": meId,
        ...(orgId ? { "x-org-id": orgId } : {}),
      };

      const [employeeRes, workingDaysRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/compensation/assigned`, {
          withCredentials: true,
          headers,
        }),
        axios
          .get(`${BACKEND_URL}/api/compensation/working-days`, {
            withCredentials: true,
            headers,
          })
          .catch(() => ({ data: { data: { totalWorkingDays: 22 } } })),
      ]);

      const employee = (employeeRes.data?.data || []).find(
        (e) => String(e.employee_id) === String(employeeId)
      );
      const workingDays = workingDaysRes.data?.data?.totalWorkingDays
        ? Number(workingDaysRes.data.data.totalWorkingDays)
        : 22;

      const monthlyCTC =
        employee && employee.ctc ? Number(employee.ctc) / 12 : 0;
      const lopPerDay = workingDays ? monthlyCTC / workingDays : 0;
      const computedValue = Number(effectiveLOP.total_lop || 0) * lopPerDay;
      valueStr = computedValue ? computedValue.toFixed(2) : valueStr;
    }
  } catch (e) {}

  return {
    currentMonth: {
      days: effectiveLOP.total_lop || 0,
      value: valueStr || "0.00",
      currency: "INR",
    },
    yearly: {
      days: effectiveLOP.total_lop || 0,
      value: valueStr || "0.00",
      currency: "INR",
    },
    deferred: lopRecords.deferredLOP || [],
    nextMonth: lopRecords.nextMonthLOP || [],
  };
};
