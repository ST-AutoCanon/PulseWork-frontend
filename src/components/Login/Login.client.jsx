
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

const logoUrl = "/images/sukalpa_logo.png";
const MASTER_ORG_VALUE = "__MASTER__";

const toDateKey = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Returns true → do NOT show / queue the missed-punch alert.
 * Conditions: Sunday | holiday | leave applied | regularisation already submitted
 */
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

  // 2. Holiday – matches HolidayCalendar response shape (message or data)
  try {
    const holRes = await fetch(`${base}/holidays`, {
      credentials: "include",
      headers,
    });
    if (holRes.ok) {
      const body = await holRes.json().catch(() => null);
      const list = Array.isArray(body?.message)
        ? body.message
        : Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];
      const isHoliday = list.some((h) => {
        if (!h?.date) return false;
        return new Date(h.date).toDateString() === targetDate.toDateString();
      });
      if (isHoliday) return true;
    }
  } catch (_) {}

  // 3. Leave applied for the date
  //    If 404, try: `${base}/leave/employee/leave/${encodeURIComponent(employeeId)}`
  try {
    const leaveRes = await fetch(
      `${base}/employee/leave/${encodeURIComponent(employeeId)}`,
      { credentials: "include", headers },
    );
    if (leaveRes.ok) {
      const body = await leaveRes.json().catch(() => null);
      const leaves = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.message)
          ? body.message
          : Array.isArray(body)
            ? body
            : [];

      const onLeave = leaves.some((l) => {
        const status = String(
          l?.status ?? l?.leave_status ?? l?.leaveStatus ?? "",
        ).toLowerCase();
        if (["rejected", "cancelled", "canceled", "denied"].includes(status)) {
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
    }
  } catch (_) {}

  // 4. Regularisation already submitted
  try {
    const regRes = await fetch(`${base}/api/leave-regularisation/my-requests`, {
      credentials: "include",
      headers,
    });
    if (regRes.ok) {
      const body = await regRes.json().catch(() => null);
      const regs = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.message)
          ? body.message
          : Array.isArray(body)
            ? body
            : [];

      const hasReg = regs.some((r) => {
        const status = String(r?.status ?? r?.regularisation_status ?? "")
          .trim()
          .toLowerCase();
        if (!status || !status.includes("pending")) return false;

        const dateValues = [
          r?.selected_dates,
          r?.selectedDates,
          r?.selected_dates_json,
          r?.primary_date,
          r?.primaryDate,
          r?.date,
          r?.attendance_date,
          r?.attendanceDate,
          r?.target_date,
          r?.targetDate,
          r?.from_date,
          r?.fromDate,
        ];

        return dateValues.some((value) => {
          if (Array.isArray(value)) {
            return value.some((v) => String(v).slice(0, 10) === dateKey);
          }
          if (typeof value === "string") {
            const parsed = value.trim();
            if (!parsed) return false;
            try {
              const arr = JSON.parse(parsed);
              if (Array.isArray(arr)) {
                return arr.some((v) => String(v).slice(0, 10) === dateKey);
              }
            } catch {}
            return String(parsed).slice(0, 10) === dateKey;
          }
          return false;
        });
      });
      if (hasReg) return true;
    }
  } catch (_) {}

  return false;
}

export default function Login({ onClose }) {
  const { login } = useAuth();
  const router = useRouter();

  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFramed, setIsFramed] = useState(null);

  const parentOriginRef = useRef(null);

  const toggleShowPassword = () => setShowPassword((p) => !p);
  const showAlert = (message, title = " ") =>
    setAlertModal({
      isVisible: true,
      title,
      message:
        message && typeof message === "object"
          ? JSON.stringify(message, null, 2)
          : String(message || ""),
    });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });
  const closeModal = () => {
    setIsModalOpen(false);
    if (onClose) onClose();
  };

  const postToParent = (msg, origin) => {
    try {
      window.parent?.postMessage(msg, origin || parentOriginRef.current || "*");
    } catch {}
  };

  useEffect(() => {
    let aborted = false;

    async function loadOrgs() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orgs`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
          credentials: "include",
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok || !Array.isArray(body?.message)) return;

        const withMaster = [
          { id: MASTER_ORG_VALUE, name: "Login as Super Admin" },
          ...body.message,
        ];

        if (!aborted) {
          setOrgs(withMaster);
        }
      } catch (err) {
        console.warn("Failed to refresh orgs:", err);
      }
    }

    loadOrgs();
    return () => {
      aborted = true;
    };
  }, []);

  const allowedOrigins = useMemo(() => {
    return (process.env.NEXT_PUBLIC_ALLOWED_IFRAME_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, []);

  useEffect(() => {
    try {
      setIsFramed(window.parent !== window.self);
    } catch {
      setIsFramed(false);
    }
  }, []);

  useEffect(() => {
    function onMessage(ev) {
      try {
        if (!ev?.origin) return;
        if (allowedOrigins.length && !allowedOrigins.includes(ev.origin))
          return;

        parentOriginRef.current = ev.origin;
        const msg = ev.data || {};

        if (msg.type === "parent-handshake") {
          window.parent?.postMessage({ type: "child-ready" }, ev.origin);
          return;
        }

        if (msg.type === "parent-login") {
          const parentOrgId =
            msg.orgId !== undefined ? String(msg.orgId) : undefined;
          const parentLoginAsSuperAdmin = !!msg.loginAsSuperAdmin;

          if (parentOrgId !== undefined) {
            setSelectedOrgId(parentOrgId);
          } else if (parentLoginAsSuperAdmin) {
            setSelectedOrgId(MASTER_ORG_VALUE);
          }

          handleParentLogin(
            msg.username,
            msg.password,
            ev.origin,
            parentOrgId,
            parentLoginAsSuperAdmin,
          );
        }

        if (msg.type === "parent-forgot-password") {
          const parentOrgId =
            msg.orgId !== undefined ? String(msg.orgId) : undefined;
          if (parentOrgId !== undefined) {
            setSelectedOrgId(parentOrgId);
          }

          handleParentForgotPassword(msg.username, ev.origin, parentOrgId);
        }
      } catch {}
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [allowedOrigins]);

  async function handleParentLogin(
    usernameVal,
    passwordVal,
    parentOrigin,
    overrideOrgId,
    overrideLoginAsSuperAdmin,
  ) {
    // Prevent concurrent logins
    if (isSubmitting) return;

    setFieldError(null);

    if (!usernameVal || !passwordVal) {
      const msg = "Username and password are required.";
      showAlert(msg);
      window.parent?.postMessage(
        { type: "login-failed", error: msg },
        parentOrigin || parentOriginRef.current || "*",
      );
      return;
    }

    const orgToUse =
      overrideOrgId !== undefined ? overrideOrgId : selectedOrgId;
    const isSuperAdmin =
      overrideLoginAsSuperAdmin !== undefined
        ? overrideLoginAsSuperAdmin
        : orgToUse === MASTER_ORG_VALUE;

    if (!isSuperAdmin && !orgToUse) {
      const msg = "Organization selection is required.";
      setFieldError(msg);
      showAlert(msg);
      window.parent?.postMessage(
        { type: "login-failed", error: msg },
        parentOrigin || parentOriginRef.current || "*",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        email: usernameVal,
        password: passwordVal,
        ...(isSuperAdmin ? { loginAsSuperAdmin: true } : { orgId: orgToUse }),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Invalid credentials");

      const u = data.message || {};
      const minimalUser = {
        id: u.id ?? u.employeeId ?? u.employee_id ?? null,
        employeeId: u.employeeId ?? u.employee_id ?? u.id ?? null,
        role: u.role ?? "",
        name: u.name ?? u.dashboard?.name ?? "",
        orgId: u.org_id ?? u.orgId ?? null,
        orgPrefix: u.org_prefix ?? u.orgPrefix ?? null,
      };

      await login(minimalUser);

      try {
        const employeeId = minimalUser?.employeeId || minimalUser?.id;
        const orgId = minimalUser?.orgId || minimalUser?.org_id;
        const role = String(minimalUser?.role ?? "")
          .trim()
          .toLowerCase();
        const isAdminLikeUser = ["admin", "super admin", "superadmin"].includes(
          role,
        );

        if (!isAdminLikeUser && employeeId && orgId) {
          const attendanceHeaders = {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
            "x-org-id": String(orgId),
            "x-employee-id": String(employeeId),
          };

          const yesterday = new Date();
          yesterday.setHours(0, 0, 0, 0);
          yesterday.setDate(yesterday.getDate() - 1);

          // Suppress reminder on Sunday / holiday / leave / regularisation
          const suppress = await shouldSuppressMissedPunchAlert({
            employeeId,
            orgId,
            targetDate: yesterday,
            headers: attendanceHeaders,
          });

          if (!suppress) {
            const attendanceUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/employee/${encodeURIComponent(employeeId)}`;
            const historyResponse = await fetch(attendanceUrl, {
              credentials: "include",
              headers: attendanceHeaders,
            });
            const historyResult = await historyResponse
              .json()
              .catch(() => null);
            const hasPriorAttendance =
              historyResponse.ok && Array.isArray(historyResult?.data)
                ? historyResult.data.length > 0
                : true;

            const ymd = toDateKey(yesterday);

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/employee/${encodeURIComponent(employeeId)}/punch-records?date=${encodeURIComponent(ymd)}`,
              {
                credentials: "include",
                headers: attendanceHeaders,
              },
            );

            const isCachedEmptyResponse = response.status === 304;
            const result =
              response.ok || isCachedEmptyResponse
                ? await response.json().catch(() => null)
                : null;
            const payload = result?.data || result || {};
            const records = Array.isArray(payload.records)
              ? payload.records
              : Array.isArray(payload)
                ? payload
                : [];

            if (
              response.ok ||
              isCachedEmptyResponse ||
              response.status === 404 ||
              response.status === 400
            ) {
              const normalizeText = (value) =>
                String(value ?? "")
                  .trim()
                  .toLowerCase();

              const isAutomaticPunchOut = (record) => {
                const punchMode = normalizeText(
                  record?.punchmode ?? record?.punchMode,
                );
                const punchOutDevice = normalizeText(
                  record?.punchout_device ?? record?.punchoutDevice,
                );
                const punchOutLocation = normalizeText(
                  record?.punchout_location ?? record?.punchoutLocation,
                );

                return (
                  punchMode === "automatic" ||
                  punchOutDevice === "automatic" ||
                  punchOutLocation === "automatic"
                );
              };

              const normalizeStatus = (value) =>
                String(value ?? "")
                  .trim()
                  .toLowerCase();

              const isPendingRequestStatus = (value) => {
                const status = normalizeStatus(value);
                if (!status) return false;
                if (status === "pending") return true;
                if (status.includes("pending")) return true;
                return [
                  "submitted",
                  "in review",
                  "awaiting approval",
                  "processing",
                ].includes(status);
              };

              const isApprovedRequestStatus = (value) => {
                const status = normalizeStatus(value);
                if (!status) return false;
                if (
                  ["rejected", "cancelled", "canceled", "denied"].includes(
                    status,
                  )
                ) {
                  return false;
                }
                if (status.includes("approved")) return true;
                if (status.includes("accept")) return true;
                return [
                  "approved",
                  "accepted",
                  "processed",
                  "completed",
                ].includes(status);
              };

              const isSuppressibleRequestStatus = (value) => {
                const status = normalizeStatus(value);
                if (!status) return false;
                if (
                  ["rejected", "cancelled", "canceled", "denied"].includes(
                    status,
                  )
                ) {
                  return false;
                }
                return (
                  isPendingRequestStatus(status) ||
                  isApprovedRequestStatus(status)
                );
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

              const hasRelatedRequestForYesterday = async () => {
                try {
                  const dateKey = toDateKey(yesterday);
                  const [leaveResult, regularisationResult] = await Promise.all(
                    [
                      fetch(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/employee/leave/${encodeURIComponent(employeeId)}`,
                        {
                          credentials: "include",
                          headers: attendanceHeaders,
                        },
                      ).then((r) => r.json().catch(() => null)),
                      fetch(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/leave-regularisation/my-requests`,
                        {
                          credentials: "include",
                          headers: attendanceHeaders,
                        },
                      ).then((r) => r.json().catch(() => null)),
                    ],
                  );

                  const leaveList = Array.isArray(leaveResult?.data)
                    ? leaveResult.data
                    : Array.isArray(leaveResult?.message)
                      ? leaveResult.message
                      : Array.isArray(leaveResult)
                        ? leaveResult
                        : [];

                  if (
                    leaveList.some((item) => {
                      const status = normalizeStatus(
                        item?.status ??
                          item?.leave_status ??
                          item?.leaveStatus ??
                          item?.approval_status ??
                          item?.approvalStatus ??
                          "",
                      );
                      if (!isSuppressibleRequestStatus(status)) {
                        return false;
                      }

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
                    })
                  ) {
                    return true;
                  }

                  const regList = Array.isArray(regularisationResult?.data)
                    ? regularisationResult.data
                    : Array.isArray(regularisationResult?.message)
                      ? regularisationResult.message
                      : Array.isArray(regularisationResult)
                        ? regularisationResult
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
                    if (!isSuppressibleRequestStatus(status)) {
                      return false;
                    }

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
              };

              const hasRelatedRequest = await hasRelatedRequestForYesterday();
              const queueProfessionalAlert = () =>
                queueAttendanceReminder(
                  "A missed punch was detected for yesterday. A leave request or attendance regularisation has already been submitted. Please connect with your manager or higher management for guidance.",
                  "Professional alert",
                );

              if (!records.length) {
                if (hasRelatedRequest) {
                  queueProfessionalAlert();
                } else {
                  queueAttendanceReminder(
                    "Punch-in missed for yesterday. Please raise attendance regularisation.",
                  );
                }
              } else {
                const hasPunchIn = records.some(
                  (record) => !!(record?.punchin_time || record?.punchinTime),
                );
                const hasOpenPunch = records.some((record) => {
                  const status = String(record?.punch_status ?? "").trim();
                  const punchinTime =
                    record?.punchin_time || record?.punchinTime;
                  const punchoutTime =
                    record?.punchout_time || record?.punchoutTime;

                  return (
                    status === "Punch In" ||
                    (!!punchinTime && !punchoutTime) ||
                    (!!punchinTime && isAutomaticPunchOut(record))
                  );
                });

                if (hasPunchIn && hasOpenPunch) {
                  if (hasRelatedRequest) {
                    queueProfessionalAlert();
                  } else {
                    queueAttendanceReminder(
                      "Punch-out missed. Please raise attendance regularisation.",
                    );
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("Attendance reminder check after login failed:", err);
      }

      closeModal();
      window.parent?.postMessage(
        { type: "login-success", payload: minimalUser },
        parentOrigin || parentOriginRef.current || "*",
      );

      const role = minimalUser.role?.toLowerCase();

      if (role === "general") {
        router.push("/FacePunch");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      const message = err?.message || "Login failed";

      showAlert(message);

      window.parent?.postMessage(
        {
          type: "login-failed",
          error: message,
        },
        parentOrigin || parentOriginRef.current || "*",
      );
    } finally {
      // ALWAYS clear submitting state so UI resets after failure or success
      setIsSubmitting(false);
    }
  }

  const queueAttendanceReminder = (message, title = "Attendance reminder") => {
    try {
      sessionStorage.setItem(
        "attendanceReminder",
        JSON.stringify({ title, message }),
      );
    } catch {}
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isSubmitting) {
      handleParentLogin(username, password);
    }
  };

  const doForgotPassword = async ({ usernameVal, orgId, parentOrigin }) => {
    setFieldError(null);

    if (!usernameVal) {
      const msg = "Please enter your email to reset your password.";
      setFieldError(msg);
      showAlert(msg);
      if (parentOrigin || isFramed) {
        postToParent(
          { type: "forgot-password-failed", error: msg },
          parentOrigin,
        );
      }
      return;
    }

    const orgToUse = orgId !== undefined ? orgId : selectedOrgId;
    if (!orgToUse) {
      const msg = "Please select your organization before resetting password.";
      setFieldError(msg);
      showAlert(msg);
      if (parentOrigin || isFramed) {
        postToParent(
          { type: "forgot-password-failed", error: msg },
          parentOrigin,
        );
      }
      return;
    }

    const payload = { email: usernameVal };
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
    };

    // Only send orgId when not logging in as super admin
    if (orgToUse && orgToUse !== MASTER_ORG_VALUE) {
      payload.orgId = orgToUse;
      headers["x-org-id"] = orgToUse;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forgot-password`,
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Unable to send reset email");

      const successMessage =
        data?.message || "Password reset link has been sent to your email.";
      showAlert(successMessage, "Success");

      if (parentOrigin || isFramed) {
        postToParent(
          { type: "forgot-password-success", message: successMessage },
          parentOrigin,
        );
      }
    } catch (err) {
      const message =
        err?.message || "Failed to send reset email. Please try again.";
      showAlert(message, "Error");
      if (parentOrigin || isFramed) {
        postToParent(
          { type: "forgot-password-failed", error: message },
          parentOrigin,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParentForgotPassword = (
    usernameVal,
    parentOrigin,
    overrideOrgId,
  ) => {
    doForgotPassword({
      usernameVal,
      orgId: overrideOrgId,
      parentOrigin,
    });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    await doForgotPassword({ usernameVal: username, orgId: selectedOrgId });
  };

  if (isFramed === null || isFramed) return null;

  return (
    isModalOpen && (
      <div className="login-container">
        <div className="top-tabs-bar">
          <button className="tab-link">Overview</button>
          <button
            className="tab-link"
            onClick={() => router.push("/demo-request")}
            aria-haspopup="dialog"
          >
            Demo Request
          </button>
          <button
            className="purchase-btn"
            onClick={() => router.push("/purchase")}
            aria-label="Purchase - open contact and location"
          >
            Purchase
          </button>
        </div>

        <div className="login-card">
          <img src={logoUrl} alt="Logo" className="card-logo" />
          <div className="login-left">
            <h1>Welcome to</h1>
            <h2 className="pulse-title">
              <span className="pulse-big">Pulse</span>
              <span className="pulse-small">work</span>
            </h2>
            <p>
              Redefining Workforce Management through Identity-Verified
              Attendance, Task Orchestration, and End-to-End Project & HRMS
              Integration.
            </p>
            <div className="section-circles">
              <div className="circle circle1" />
              <div className="circle circle2" />
            </div>
          </div>

          <div className="login-right">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group-login">
                <select
                  className={`org-select ${fieldError ? "input-error" : ""}`}
                  value={selectedOrgId}
                  onChange={(e) => {
                    setSelectedOrgId(e.target.value);
                    if (fieldError) setFieldError(null);
                  }}
                  aria-label="Select organization"
                  aria-required="true"
                  aria-invalid={!!fieldError}
                >
                  <option value="">-- Select organization --</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group-login">
                <input
                  type="text"
                  placeholder="Your user name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-label="Username or email"
                />
              </div>

              <div
                className="input-group-login"
                style={{ position: "relative" }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-label="Password"
                />
                <span
                  className="toggle-password-icon"
                  onClick={toggleShowPassword}
                  role="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      toggleShowPassword();
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="form-options">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleForgotPassword(e);
                  }}
                >
                  Forget Password?
                </a>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                aria-disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="section-circles1">
              <div className="circle circle4" />
            </div>
          </div>
        </div>

        <div className="footer-text">
          © 2025 Sukalpa Tech. All Rights Reserved.
        </div>

        {alertModal.isVisible && (
          <Modal
            isVisible={alertModal.isVisible}
            onClose={closeAlert}
            buttons={[{ label: "OK", onClick: closeAlert }]}
          >
            {alertModal.title && <h3>{alertModal.title}</h3>}
            <p>{alertModal.message}</p>
          </Modal>
        )}
      </div>
    )
  );
}
