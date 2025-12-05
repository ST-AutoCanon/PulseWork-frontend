export const parseLocalDate = (dateStr) => {
  if (!dateStr) return "";
  if (typeof dateStr === "string" && dateStr.length === 10) return dateStr;

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export const parseDateOnly = (isoDate) => {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (!isNaN(d.getTime()))
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const parts = String(isoDate).split("-");
  if (parts.length >= 3) {
    const [y, m, day] = parts;
    return new Date(Number(y), Number(m) - 1, Number(day));
  }
  return null;
};

export const calculateDays = (startDate, endDate, h_f_day = "") => {
  const s = parseDateOnly(startDate);
  const e = parseDateOnly(endDate);
  if (!s || !e || e < s) return 0;

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((e - s) / msPerDay) + 1;

  if (
    String(h_f_day).toLowerCase().includes("half") &&
    s.getTime() === e.getTime()
  ) {
    return 0.5;
  }

  return diffDays;
};

export const getAdvanceNoticeDays = (setting) => {
  if (!setting) return 0;

  const raw =
    setting?.advance_notice_days ??
    setting?.advanceNoticeDays ??
    setting?.advance_notice ??
    setting?.advanceNotice ??
    0;

  const num = Number(raw);
  return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
};

export const computeRequestedDays = (start, end, h_f_day) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;

  const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  if (String(h_f_day).toLowerCase() === "half day") return 0.5;

  return diff;
};

export const defaultLeaveSettings = [
  {
    type: "casual",
    label: "Casual Leave",
    value: 0,
    carry_forward: 0,
    enabled: true,
    advance_notice_days: 3,
  },
  {
    type: "vacation",
    label: "Vacation",
    value: 0,
    carry_forward: 0,
    enabled: true,
    advance_notice_days: 3,
  },
  {
    type: "sick",
    label: "Sick Leave",
    value: 0,
    carry_forward: 0,
    enabled: true,
    advance_notice_days: 0,
  },
  {
    type: "other",
    label: "Other",
    value: 0,
    carry_forward: 0,
    enabled: true,
    advance_notice_days: 3,
  },
];

export const monthName = (m, year) =>
  new Date(year, m - 1, 1).toLocaleString(undefined, { month: "short" });
