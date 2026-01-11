"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

const logoUrl = "/images/sukalpa_logo.png";
const MASTER_ORG_VALUE = "__MASTER__";

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
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });
  const closeModal = () => {
    setIsModalOpen(false);
    if (onClose) onClose();
  };

  useEffect(() => {
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
        if (res.ok && body && body.message) {
          const fetched = Array.isArray(body.message) ? body.message : [];
          const withMaster = [
            { id: MASTER_ORG_VALUE, name: "Login as Super Admin" },
            ...fetched,
          ];
          setOrgs(withMaster);
        } else {
          setOrgs([{ id: MASTER_ORG_VALUE, name: "Login as Super Admin" }]);
        }
      } catch (err) {
        console.warn("Failed to load orgs for login dropdown:", err);
        setOrgs([{ id: MASTER_ORG_VALUE, name: "Login as Super Admin" }]);
      }
    }
    loadOrgs();
  }, []);

  // allowed parent origins (comma-separated)
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

  // ---------- MESSAGE HANDLER: respond to parent-handshake and parent-login ----------
  useEffect(() => {
    function onMessage(ev) {
      try {
        if (!ev?.origin) return;
        if (allowedOrigins.length && !allowedOrigins.includes(ev.origin)) {
          return;
        }

        parentOriginRef.current = ev.origin;
        const msg = ev.data || {};

        if (msg.type === "parent-handshake") {
          try {
            window.parent?.postMessage({ type: "child-ready" }, ev.origin);
          } catch {}
          return;
        }

        if (msg.type === "parent-login") {
          // parent may provide orgId or loginAsSuperAdmin
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
            parentLoginAsSuperAdmin
          );
        }

        if (msg.type === "request-navigate" && msg.path) {
          try {
            window.location.assign(msg.path);
          } catch {}
        }
      } catch (err) {
        // swallow
      }
    }

    window.addEventListener("message", onMessage, false);
    return () => window.removeEventListener("message", onMessage, false);
  }, [allowedOrigins]);

  /**
   * handleParentLogin:
   * - overrideOrgId, overrideLoginAsSuperAdmin: optional values passed by parent to avoid relying on state updates
   */
  async function handleParentLogin(
    usernameVal,
    passwordVal,
    parentOrigin,
    overrideOrgId,
    overrideLoginAsSuperAdmin
  ) {
    setFieldError(null);

    if (!usernameVal || !passwordVal) {
      const msg = "Username and password are required.";
      showAlert(msg);
      try {
        window.parent?.postMessage(
          { type: "login-failed", error: msg },
          parentOrigin || parentOriginRef.current || "*"
        );
      } catch {}
      return;
    }

    const orgToUse =
      overrideOrgId !== undefined ? overrideOrgId : selectedOrgId;
    const isSuperAdmin =
      overrideLoginAsSuperAdmin !== undefined
        ? overrideLoginAsSuperAdmin
        : orgToUse === MASTER_ORG_VALUE;

    if (!isSuperAdmin && (!orgToUse || orgToUse === "")) {
      const msg = "Organization selection is required.";
      setFieldError(msg);
      showAlert(msg);
      try {
        window.parent?.postMessage(
          { type: "login-failed", error: msg },
          parentOrigin || parentOriginRef.current || "*"
        );
      } catch {}
      return;
    }

    setIsSubmitting(true);
    try {
      const bodyPayload = {
        email: usernameVal,
        password: passwordVal,
      };

      if (isSuperAdmin) {
        bodyPayload.loginAsSuperAdmin = true;
      } else {
        bodyPayload.orgId = orgToUse;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
          body: JSON.stringify(bodyPayload),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errMsg = data.message || "Invalid credentials.";
        showAlert(errMsg);
        try {
          window.parent?.postMessage(
            { type: "login-failed", error: errMsg },
            parentOrigin || parentOriginRef.current || "*"
          );
        } catch {}
        return;
      }

      const payload = data.message || {};
      const minimalUser = {
        id: payload.id ?? payload.employeeId ?? payload.employee_id ?? null,
        employeeId:
          payload.employeeId ?? payload.employee_id ?? payload.id ?? null,
        role: payload.role ?? "",
        name: payload.name ?? payload.dashboard?.name ?? "",
        orgId: payload.org_id ?? payload.orgId ?? payload.Org_id ?? null,
      };

      await login(minimalUser);
      closeModal();

      try {
        window.parent?.postMessage(
          { type: "login-success", payload: minimalUser },
          parentOrigin || parentOriginRef.current || "*"
        );
      } catch {}

     const roleValue = String(payload.role || "").trim().toLowerCase();

console.log("NORMALIZED ROLE:", roleValue);

if (roleValue === "general" ) {
  router.replace("/FacePunch");
} else {
  router.replace("/dashboard");
}

    } catch (err) {
      console.error("login error", err);
      showAlert("An unexpected error occurred. Please try again.");
      try {
        window.parent?.postMessage(
          { type: "login-failed", error: "An unexpected error occurred." },
          parentOrigin || parentOriginRef.current || "*"
        );
      } catch {}
    } finally {
      setIsSubmitting(false);
    }
  }

  // local manual UI submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFieldError(null);

    if (!username || !password) {
      showAlert("Username and password are required.");
      return;
    }

    const isSuperAdmin = selectedOrgId === MASTER_ORG_VALUE;
    if (!isSuperAdmin && (!selectedOrgId || selectedOrgId === "")) {
      const msg =
        "Please select an organization or choose 'Login as Super Admin'.";
      setFieldError(msg);
      showAlert(msg);
      return;
    }

    await handleParentLogin(
      username,
      password,
      undefined,
      undefined,
      undefined
    );
  };

  const handleForgotPassword = async (e) => {
    e?.preventDefault();
    if (!username) {
      showAlert("Email ID is required to reset the password.");
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
          body: JSON.stringify({ email: username }),
          credentials: "include",
        }
      );
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        showAlert("Password reset email sent!", "Success");
      } else {
        showAlert(data.message || "Request failed");
      }
    } catch (err) {
      showAlert("An unexpected error occurred.");
    }
  };

  if (isFramed === null) return null;
  if (isFramed) return null;

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
