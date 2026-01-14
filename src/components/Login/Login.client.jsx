"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

const logoUrl = "/images/sukalpa_logo.png";
const MASTER_ORG_VALUE = "__MASTER__";
const ORGS_STORAGE_KEY = "login_orgs_v1";

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
    let aborted = false;

    async function loadOrgs() {
      try {
        const cached = localStorage.getItem(ORGS_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrgs(parsed);
          }
        }
      } catch {}

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
          localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(withMaster));
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
            parentLoginAsSuperAdmin
          );
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
    overrideLoginAsSuperAdmin
  ) {
    setFieldError(null);

    if (!usernameVal || !passwordVal) {
      const msg = "Username and password are required.";
      showAlert(msg);
      window.parent?.postMessage(
        { type: "login-failed", error: msg },
        parentOrigin || parentOriginRef.current || "*"
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
        parentOrigin || parentOriginRef.current || "*"
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
      };

      await login(minimalUser);
      closeModal();
      window.parent?.postMessage(
        { type: "login-success", payload: minimalUser },
        parentOrigin || parentOriginRef.current || "*"
      );

      router.push(
        usernameVal.toLowerCase() === "manish.p@yopmail.com" &&
          minimalUser.role.toLowerCase() === "general"
          ? "/FacePunch"
          : "/dashboard"
      );
    } catch (err) {
      showAlert(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isSubmitting) {
      handleParentLogin(username, password);
    }
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
