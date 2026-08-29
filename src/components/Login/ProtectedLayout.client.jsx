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
    try {
      const queued = sessionStorage.getItem("attendanceReminder");
      if (queued) {
        const parsed = JSON.parse(queued);
        if (parsed?.message) {
          setPunchAlert({
            title: parsed.title || "Attendance reminder",
            message: parsed.message,
          });
          sessionStorage.removeItem("attendanceReminder");
        }
      }
    } catch {}

    const employeeId = user?.employeeId || user?.id || user?.employee_id;
    const orgId = user?.orgId || user?.org_id || user?.Org_id;

    if (!employeeId || !orgId) {
      punchAlertKeyRef.current = null;
      return;
    }

    const loginKey = `${orgId}:${employeeId}`;
    if (punchAlertKeyRef.current === loginKey) return;
    punchAlertKeyRef.current = loginKey;

    let cancelled = false;

    const checkPunchStatus = async () => {
      try {
        const dateHeaders = {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          "x-org-id": String(orgId),
          "x-employee-id": String(employeeId),
        };

        const toDateKey = (dateObj) => {
          const y = dateObj.getFullYear();
          const m = String(dateObj.getMonth() + 1).padStart(2, "0");
          const d = String(dateObj.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };

        const recentDates = Array.from({ length: 5 }, (_, index) => {
          const date = new Date();
          date.setHours(0, 0, 0, 0);
          date.setDate(date.getDate() - index);
          return toDateKey(date);
        });

        const getRecords = async (dateKey) => {
          try {
            const response = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/employee/${encodeURIComponent(employeeId)}/punch-records?date=${encodeURIComponent(dateKey)}`,
              { withCredentials: true, headers: dateHeaders },
            );

            const payload = response?.data?.data || {};
            const records = Array.isArray(payload.records)
              ? payload.records
              : Array.isArray(payload)
                ? payload
                : [];

            return {
              date: dateKey,
              records,
              hasPunchIn: records.some((record) => {
                const raw = record?.punchin_time ?? record?.punchinTime ?? null;
                return Boolean(raw);
              }),
              hasPunchOut: records.some((record) => {
                const raw =
                  record?.punchout_time ?? record?.punchoutTime ?? null;
                return Boolean(raw);
              }),
              hasOpenPunch: records.some((record) => {
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
              }),
            };
          } catch (error) {
            if (error?.response?.status === 404) {
              return {
                date: dateKey,
                records: [],
                hasPunchIn: false,
                hasPunchOut: false,
                hasOpenPunch: false,
              };
            }

            if (error?.response?.status === 400) {
              return {
                date: dateKey,
                records: [],
                hasPunchIn: false,
                hasPunchOut: false,
                hasOpenPunch: false,
              };
            }

            console.error(`Failed to fetch attendance for ${dateKey}:`, error);
            return {
              date: dateKey,
              records: [],
              hasPunchIn: false,
              hasPunchOut: false,
              hasOpenPunch: false,
            };
          }
        };

        const settledDates = await Promise.allSettled(
          recentDates.map((dateKey) => getRecords(dateKey)),
        );

        if (cancelled) return;

        const messages = [];

        settledDates.forEach((result) => {
          if (result.status !== "fulfilled") return;

          const status = result.value || {
            date: "",
            records: [],
            hasPunchIn: false,
            hasPunchOut: false,
            hasOpenPunch: false,
          };
          if (!status.records?.length) {
            messages.push(
              "Punch-in missed for this date. Please raise attendance regularisation.",
            );
            return;
          }

          if (!status.hasPunchIn) {
            messages.push(
              "Punch-in missed. Please raise attendance regularisation.",
            );
          }

          const missedPunchOut = status.records.some((record) => {
            const punchinTime =
              record?.punchin_time ?? record?.punchinTime ?? null;
            const punchoutTime =
              record?.punchout_time ?? record?.punchoutTime ?? null;
            const punchMode = String(
              record?.punchmode ?? record?.punchMode ?? "",
            )
              .trim()
              .toLowerCase();
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
              Boolean(punchinTime) &&
              (punchMode === "automatic" ||
                punchoutDevice === "automatic" ||
                punchoutLocation === "automatic" ||
                (!punchoutTime && status.hasOpenPunch))
            );
          });

          if ((status.hasOpenPunch && !status.hasPunchOut) || missedPunchOut) {
            messages.push(
              "Punch-out missed. Please raise attendance regularisation.",
            );
          }
        });

        if (!messages.length) {
          const todayOnly =
            settledDates[0]?.status === "fulfilled"
              ? settledDates[0].value
              : null;
          const emptyPayload =
            !todayOnly?.records?.length &&
            !todayOnly?.hasPunchIn &&
            !todayOnly?.hasPunchOut &&
            !todayOnly?.hasOpenPunch;
          if (emptyPayload) {
            messages.push(
              "Punch-in missed for this date. Please raise attendance regularisation.",
            );
          }
        }

        if (messages.length) {
          const uniqueMessages = [...new Set(messages)];
          const message =
            uniqueMessages.length > 1
              ? "Punch-in or punch-out missed. Please raise attendance regularisation."
              : uniqueMessages[0];

          setPunchAlert({
            title: "Attendance reminder",
            message,
          });
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
    user?.employeeId,
    user?.id,
    user?.employee_id,
    user?.orgId,
    user?.org_id,
    user?.Org_id,
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
