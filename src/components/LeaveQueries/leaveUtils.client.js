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

/**
 * Default leave settings (client fallback).
 * Added "earned" because other components (PolicyModal, etc.) expect it.
 * These are used only as a fallback when no active policy exists.
 */
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
    type: "earned",
    label: "Earned Leave",
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

export function normalizeLeaveTypes(arr = []) {
  if (!Array.isArray(arr)) return [];
  return arr.map((t) => {
    if (typeof t === "string") {
      const k = String(t).trim().toLowerCase();
      return { key: k, label: t, gender: "all" };
    }
    const key = (
      t.key ||
      t.type ||
      t.type_key ||
      t.typeKey ||
      t.typeKey ||
      t.type_name ||
      t.name ||
      ""
    )
      .toString()
      .trim();
    const label =
      t.label || t.display_name || t.name || key || String(t).toString();
    const gender = (t.gender || t.sex || "all").toString();
    const min_age = t.min_age ?? t.minAge ?? t.min ?? null;
    const max_age = t.max_age ?? t.maxAge ?? t.max ?? null;
    return {
      key: String(key).toLowerCase(),
      label,
      gender,
      min_age,
      max_age,
      ...t,
    };
  });
}

export const getTypeKey = (t) => {
  if (!t) return "";
  if (typeof t === "string") return t;
  return t.key ?? t.type ?? t.type_key ?? t.name ?? "";
};

export const getTypeLabel = (t) => {
  if (!t) return "";
  if (typeof t === "string") return t;
  return t.label ?? t.display_name ?? t.name ?? getTypeKey(t) ?? "";
};

export const monthName = (m, year) =>
  new Date(year, m - 1, 1).toLocaleString(undefined, { month: "short" });
