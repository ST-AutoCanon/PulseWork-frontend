// "use client";

// import { useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "../../context/AuthProvider.client";

// const IDLE_TIMEOUT = 5 * 60 * 1000;
// const CHECK_INTERVAL = 60 * 1000;

// export default function ProtectedLayout({ children }) {
//   const router = useRouter();
//   const { user, logout, hydrated } = useAuth();
//   const lastActivityRef = useRef(Date.now());

//   const updateActivity = () => {
//     lastActivityRef.current = Date.now();
//     try {
//       sessionStorage.setItem("lastActivity", String(lastActivityRef.current));
//     } catch {}
//   };

//   const syncFromStorage = () => {
//     try {
//       const v = sessionStorage.getItem("lastActivity");
//       if (!v) return;
//       const stored = parseInt(v, 10);
//       if (!isNaN(stored) && stored > lastActivityRef.current) {
//         lastActivityRef.current = stored;
//       }
//     } catch {}
//   };

//   useEffect(() => {
//     const events = [
//       "mousemove",
//       "keydown",
//       "click",
//       "touchstart",
//       "scroll",
//       "focus",
//     ];
//     events.forEach((ev) => window.addEventListener(ev, updateActivity, true));

//     const onVisibility = () => {
//       if (!document.hidden) updateActivity();
//     };
//     document.addEventListener("visibilitychange", onVisibility);

//     const onStorage = (e) => {
//       if (e.key === "lastActivity") syncFromStorage();
//     };
//     window.addEventListener("storage", onStorage);

//     updateActivity();

//     const doCheck = async () => {
//       if (!hydrated || !user) return;

//       syncFromStorage();

//       if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT) {
//         try {
//           try {
//             sessionStorage.setItem("loggedOutDueToInactivity", "true");
//           } catch {}
//           await logout({ redirect: true, reason: "idle" });
//         } catch (err) {
//           console.warn("idle logout failed", err);
//         }
//       }
//     };

//     doCheck();
//     const id = setInterval(doCheck, CHECK_INTERVAL);

//     return () => {
//       events.forEach((ev) =>
//         window.removeEventListener(ev, updateActivity, true)
//       );
//       document.removeEventListener("visibilitychange", onVisibility);
//       window.removeEventListener("storage", onStorage);
//       clearInterval(id);
//     };
//   }, [user, hydrated, logout]);

//   return <>{children}</>;
// }

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";

const IDLE_TIMEOUT = 5 * 60 * 1000;
const CHECK_INTERVAL = 60 * 1000;

const toDateKey = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Returns true → do NOT show the missed-punch alert.
 * Conditions: Sunday | holiday | leave applied | regularisation already submitted
 */
const getProfessionalMissedPunchMessage = () =>
  "A missed punch was detected for yesterday. A leave request or attendance regularisation has already been submitted. Please connect with your manager or higher management for guidance.";

const normalizeStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isPendingRequestStatus = (value) => {
  const status = normalizeStatus(value);
  if (!status) return false;
  if (status === "pending") return true;
  if (status.includes("pending")) return true;
  return ["submitted", "in review", "awaiting approval", "processing"].includes(
    status,
  );
};

const isApprovedRequestStatus = (value) => {
  const status = normalizeStatus(value);
  if (!status) return false;
  if (["rejected", "cancelled", "canceled", "denied"].includes(status)) {
    return false;
  }
  if (status.includes("approved")) return true;
  if (status.includes("accept")) return true;
  return ["approved", "accepted", "processed", "completed"].includes(status);
};

const isSuppressibleRequestStatus = (value) => {
  const status = normalizeStatus(value);
  if (!status) return false;
  if (["rejected", "cancelled", "canceled", "denied"].includes(status)) {
    return false;
  }
  return isPendingRequestStatus(status) || isApprovedRequestStatus(status);
};

const getDateKeysFromValue = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry ?? "").slice(0, 10))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => String(entry ?? "").slice(0, 10))
          .filter(Boolean);
      }
    } catch {
      // ignore non-JSON string values
    }

    const trimmed = value.trim();
    return trimmed ? [String(trimmed).slice(0, 10)] : [];
  }

  return [];
};

async function hasRelatedRequestForYesterday({
  employeeId,
  targetDate,
  headers,
}) {
  const dateKey = toDateKey(targetDate);
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;

  try {
    const [leaveRes, regRes] = await Promise.all([
      axios.get(`${base}/employee/leave/${encodeURIComponent(employeeId)}`, {
        withCredentials: true,
        headers,
      }),
      axios.get(`${base}/api/leave-regularisation/my-requests`, {
        withCredentials: true,
        headers,
      }),
    ]);

    const leaveBody = leaveRes?.data;
    const leaveList = Array.isArray(leaveBody?.data)
      ? leaveBody.data
      : Array.isArray(leaveBody?.message)
        ? leaveBody.message
        : Array.isArray(leaveBody)
          ? leaveBody
          : [];

    const hasLeave = leaveList.some((item) => {
      const status = normalizeStatus(
        item?.status ??
          item?.leave_status ??
          item?.leaveStatus ??
          item?.approval_status ??
          item?.approvalStatus ??
          "",
      );
      if (!isPendingRequestStatus(status)) return false;

      const from = String(
        item?.from_date ??
          item?.fromDate ??
          item?.start_date ??
          item?.startDate ??
          item?.primary_date ??
          item?.primaryDate ??
          "",
      ).slice(0, 10);
      const to = String(
        item?.to_date ??
          item?.toDate ??
          item?.end_date ??
          item?.endDate ??
          from,
      ).slice(0, 10);
      return from && to && dateKey >= from && dateKey <= to;
    });

    if (hasLeave) return true;

    const regBody = regRes?.data;
    const regList = Array.isArray(regBody?.data)
      ? regBody.data
      : Array.isArray(regBody?.message)
        ? regBody.message
        : Array.isArray(regBody)
          ? regBody
          : [];

    return regList.some((item) => {
      const status = normalizeStatus(
        item?.status ??
          item?.regularisation_status ??
          item?.regularisationStatus ??
          item?.approval_status ??
          item?.approvalStatus ??
          "",
      );
      if (!isPendingRequestStatus(status)) return false;

      const dates = new Set([
        ...getDateKeysFromValue(
          item?.selected_dates ??
            item?.selectedDates ??
            item?.selected_dates_json ??
            item?.primary_date ??
            item?.primaryDate ??
            item?.date ??
            item?.attendance_date ??
            item?.attendanceDate ??
            item?.target_date ??
            item?.targetDate ??
            item?.from_date ??
            item?.fromDate ??
            [],
        ),
      ]);

      return dates.has(dateKey);
    });
  } catch {
    return false;
  }
}

async function shouldSuppressMissedPunchAlert({
  employeeId,
  orgId,
  targetDate,
  headers,
}) {
  // 1. Sunday (local time)
  if (targetDate.getDay() === 0) return true;

  const dateKey = toDateKey(targetDate);
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;

  // 2. Holiday – matches HolidayCalendar: res.data.message or res.data
  try {
    const holRes = await axios.get(`${base}/holidays`, {
      withCredentials: true,
      headers,
    });
    const body = holRes?.data;
    const list = Array.isArray(body?.message)
      ? body.message
      : Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body)
          ? body
          : [];
    const isHoliday = list.some((h) => {
      if (!h?.date) return false;
      // same comparison style as HolidayCalendar
      return new Date(h.date).toDateString() === targetDate.toDateString();
    });
    if (isHoliday) return true;
  } catch (_) {}

  // 3. Leave applied for the date
  try {
    const leaveRes = await axios.get(
      `${base}/employee/leave/${encodeURIComponent(employeeId)}`,
      { withCredentials: true, headers },
    );
    const body = leaveRes?.data;
    const leaves = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body?.message)
        ? body.message
        : Array.isArray(body)
          ? body
          : [];

    const onLeave = leaves.some((l) => {
      const status = normalizeStatus(
        l?.status ??
          l?.leave_status ??
          l?.leaveStatus ??
          l?.approval_status ??
          l?.approvalStatus ??
          "",
      );
      if (!isSuppressibleRequestStatus(status)) {
        return false;
      }
      const from = String(
        l?.from_date ?? l?.fromDate ?? l?.start_date ?? l?.startDate ?? "",
      ).slice(0, 10);
      const to = String(
        l?.to_date ?? l?.toDate ?? l?.end_date ?? l?.endDate ?? from,
      ).slice(0, 10);
      return from && to && dateKey >= from && dateKey <= to;
    });
    if (onLeave) return true;
  } catch (_) {}

  // 4. Regularisation already submitted
  try {
    const regRes = await axios.get(
      `${base}/api/leave-regularisation/my-requests`,
      {
        withCredentials: true,
        headers,
      },
    );
    const body = regRes?.data;
    const regs = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body?.message)
        ? body.message
        : Array.isArray(body)
          ? body
          : [];

    const hasReg = regs.some((r) => {
      const status = normalizeStatus(
        r?.status ??
          r?.regularisation_status ??
          r?.regularisationStatus ??
          r?.approval_status ??
          r?.approvalStatus ??
          "",
      );
      if (!isSuppressibleRequestStatus(status)) {
        return false;
      }

      const dates = new Set([
        ...getDateKeysFromValue(
          r?.selected_dates ??
            r?.selectedDates ??
            r?.selected_dates_json ??
            r?.primary_date ??
            r?.primaryDate ??
            r?.date ??
            r?.attendance_date ??
            r?.attendanceDate ??
            r?.target_date ??
            r?.targetDate ??
            r?.from_date ??
            r?.fromDate ??
            [],
        ),
      ]);

      return dates.has(dateKey);
    });
    if (hasReg) return true;
  } catch (_) {}

  return false;
}

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const { user, logout, hydrated } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const punchAlertKeyRef = useRef(null);
  const [punchAlert, setPunchAlert] = useState(null);

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
    try {
      sessionStorage.setItem("lastActivity", String(lastActivityRef.current));
    } catch {}
  };

  const syncFromStorage = () => {
    try {
      const v = sessionStorage.getItem("lastActivity");
      if (!v) return;
      const stored = parseInt(v, 10);
      if (!isNaN(stored) && stored > lastActivityRef.current) {
        lastActivityRef.current = stored;
      }
    } catch {}
  };

  useEffect(() => {
    const events = [
      "mousemove",
      "keydown",
      "click",
      "touchstart",
      "scroll",
      "focus",
    ];
    events.forEach((ev) => window.addEventListener(ev, updateActivity, true));

    const onVisibility = () => {
      if (!document.hidden) updateActivity();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onStorage = (e) => {
      if (e.key === "lastActivity") syncFromStorage();
    };
    window.addEventListener("storage", onStorage);

    updateActivity();

    const doCheck = async () => {
      if (!hydrated || !user) return;

      syncFromStorage();

      if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT) {
        try {
          try {
            sessionStorage.setItem("loggedOutDueToInactivity", "true");
          } catch {}
          await logout({ redirect: true, reason: "idle" });
        } catch (err) {
          console.warn("idle logout failed", err);
        }
      }
    };

    doCheck();
    const id = setInterval(doCheck, CHECK_INTERVAL);

    return () => {
      events.forEach((ev) =>
        window.removeEventListener(ev, updateActivity, true),
      );
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
  }, [user, hydrated, logout]);

  useEffect(() => {
    if (!hydrated) return;

    const employeeId = user?.employeeId || user?.id || user?.employee_id;
    const orgId = user?.orgId || user?.org_id || user?.Org_id;
    const normalizedRole = String(user?.role ?? "")
      .trim()
      .toLowerCase();
    const isAdminLikeUser = ["admin", "super admin", "superadmin"].includes(
      normalizedRole,
    );

    if (isAdminLikeUser) {
      punchAlertKeyRef.current = null;
      setPunchAlert(null);
      try {
        sessionStorage.removeItem("attendanceReminder");
      } catch {}
      return;
    }

    if (!employeeId || !orgId) {
      punchAlertKeyRef.current = null;
      return;
    }

    const loginKey = `${orgId}:${employeeId}`;
    punchAlertKeyRef.current = loginKey;

    let cancelled = false;

    const checkPunchStatus = async () => {
      try {
        const dateHeaders = {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          "x-org-id": String(orgId),
          "x-employee-id": String(employeeId),
        };

        const yesterday = new Date();
        yesterday.setHours(0, 0, 0, 0);
        yesterday.setDate(yesterday.getDate() - 1);
        const targetDateKey = toDateKey(yesterday);

        // Always evaluate suppress first (covers queued reminder from Login too)
        const suppress = await shouldSuppressMissedPunchAlert({
          employeeId,
          orgId,
          targetDate: yesterday,
          headers: dateHeaders,
        });

        if (suppress) {
          const hasRelatedRequest = await hasRelatedRequestForYesterday({
            employeeId,
            targetDate: yesterday,
            headers: dateHeaders,
          });

          if (hasRelatedRequest) {
            setPunchAlert({
              title: "Professional alert",
              message: getProfessionalMissedPunchMessage(),
            });
          }

          try {
            sessionStorage.removeItem("attendanceReminder");
          } catch {}
          return;
        }

        if (cancelled) return;

        // Show any reminder that Login already queued (only if not suppressed)
        try {
          const queued = sessionStorage.getItem("attendanceReminder");
          if (queued) {
            const parsed = JSON.parse(queued);
            if (parsed?.message) {
              const hasRelatedRequest = await hasRelatedRequestForYesterday({
                employeeId,
                targetDate: yesterday,
                headers: dateHeaders,
              });
              setPunchAlert({
                title: hasRelatedRequest
                  ? "Professional alert"
                  : parsed.title || "Attendance reminder",
                message: hasRelatedRequest
                  ? getProfessionalMissedPunchMessage()
                  : parsed.message,
              });
              sessionStorage.removeItem("attendanceReminder");
              return;
            }
          }
        } catch {}

        try {
          const response = await axios
            .get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/employee/${encodeURIComponent(employeeId)}/punch-records?date=${encodeURIComponent(targetDateKey)}`,
              { withCredentials: true, headers: dateHeaders },
            )
            .catch((error) => {
              if (error?.response?.status === 304) {
                return {
                  data: {
                    data: {
                      date: targetDateKey,
                      records: [],
                      hasPunchIn: false,
                      hasPunchOut: false,
                      hasOpenPunch: false,
                    },
                  },
                };
              }
              throw error;
            });

          const payload = response?.data?.data || response?.data || {};
          const records = Array.isArray(payload.records)
            ? payload.records
            : Array.isArray(payload)
              ? payload
              : [];

          if (cancelled) return;

          if (!records.length) {
            console.info(
              "[missed-punch] no records for yesterday; showing punch-in reminder",
              { employeeId, targetDateKey },
            );
            setPunchAlert({
              title: "Attendance reminder",
              message:
                "Punch-in missed for yesterday. Please raise attendance regularisation.",
            });
            return;
          }

          const hasPunchIn = records.some((record) => {
            const raw = record?.punchin_time ?? record?.punchinTime ?? null;
            return Boolean(raw);
          });

          const hasOpenPunch = records.some((record) => {
            const status = String(record?.punch_status ?? "").trim();
            const punchMode = String(
              record?.punchmode ?? record?.punchMode ?? "",
            )
              .trim()
              .toLowerCase();
            const punchoutTime =
              record?.punchout_time ?? record?.punchoutTime ?? null;
            const punchinTime =
              record?.punchin_time ?? record?.punchinTime ?? null;
            const punchoutDevice = String(
              record?.punchout_device ?? record?.punchoutDevice ?? "",
            )
              .trim()
              .toLowerCase();
            const punchoutLocation = String(
              record?.punchout_location ?? record?.punchoutLocation ?? "",
            )
              .trim()
              .toLowerCase();

            return (
              status === "Punch In" ||
              (!!punchinTime && !punchoutTime) ||
              (!!punchinTime &&
                (punchMode === "automatic" ||
                  punchoutDevice === "automatic" ||
                  punchoutLocation === "automatic"))
            );
          });

          if (hasPunchIn && hasOpenPunch) {
            setPunchAlert({
              title: "Attendance reminder",
              message:
                "Punch-out missed. Please raise attendance regularisation.",
            });
          }
        } catch (error) {
          if (
            error?.response?.status === 304 ||
            error?.response?.status === 404 ||
            error?.response?.status === 400
          ) {
            if (cancelled) return;
            setPunchAlert({
              title: "Attendance reminder",
              message:
                "Punch-in missed for yesterday. Please raise attendance regularisation.",
            });
            return;
          }

          console.error(
            `Failed to fetch attendance for ${targetDateKey}:`,
            error,
          );
        }
      } catch (error) {
        console.error("Unable to check punch status after login:", error);
      }
    };

    checkPunchStatus();

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    user?.employeeId,
    user?.id,
    user?.employee_id,
    user?.orgId,
    user?.org_id,
    user?.Org_id,
    user?.role,
  ]);

  return (
    <>
      {children}
      <Modal
        isVisible={Boolean(punchAlert)}
        title={punchAlert?.title}
        onClose={() => setPunchAlert(null)}
        buttons={[{ label: "OK", onClick: () => setPunchAlert(null) }]}
      >
        <p style={{ whiteSpace: "pre-line" }}>{punchAlert?.message}</p>
      </Modal>
    </>
  );
}
