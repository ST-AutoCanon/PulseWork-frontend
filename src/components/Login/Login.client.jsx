"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";

const logoUrl = "/images/sukalpa_logo.png";

export default function Login({ onClose }) {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // <<< NEW

  const toggleShowPassword = () => setShowPassword((p) => !p);

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });

  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const closeModal = () => {
    setIsModalOpen(false);
    if (onClose) onClose();
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

      const data = await response.json();
      if (response.ok) showAlert("Password reset email sent!");
      else setErrorMessage(data.message || "Request failed");
    } catch (err) {
      console.error("forgot-password error", err);
      setErrorMessage("An unexpected error occurred.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (isSubmitting) return;

    if (!username || !password) {
      setErrorMessage("Username and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
          body: JSON.stringify({ email: username, password }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || "Invalid credentials.");
        return;
      }

      const payload = data.message || {};
      const serverUser = {
        id: payload.id ?? payload.employeeId ?? payload.employee_id ?? null,
        employeeId:
          payload.dashboard?.employeeId ??
          payload.employeeId ??
          payload.employee_id ??
          null,
        role: payload.role ?? "",
        name: payload.name ?? payload.dashboard?.name ?? "",
        departmentId:
          payload.department_id ?? payload.dashboard?.department_id ?? "",
        gender: payload.gender ?? payload.dashboard?.gender ?? null,
        orgId: payload.org_id ?? payload.orgId ?? payload.Org_id ?? null,
        dashboard: payload.dashboard ?? {},
        sidebarMenu: payload.sidebarMenu ?? [],
        raw: payload,
      };

      await login(serverUser);
      closeModal();

      if (
        username.toLowerCase() === "manish.p@yopmail.com" &&
        (serverUser.role || "").toLowerCase() === "general"
      ) {
        router.push("/FacePunch");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("login error", err);
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    isModalOpen && (
      <div className="login-container">
        <div className="top-tabs-bar">
          <span className="tab-link">Overview</span>
          <span className="tab-link">Demo Request</span>
          <button className="purchase-btn">Purchase</button>
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
              PUNCH IN PUNCH OUT with Geolocation and face detection App
              Categorized Recruitment approval process with related...
            </p>
            <div className="section-circles">
              <div className="circle circle1" />
              <div className="circle circle2" />
            </div>
          </div>

          <div className="login-right">
            <h2>Log In</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group-login">
                <input
                  type="text"
                  placeholder="Your user name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                    handleForgotPassword();
                  }}
                >
                  Forget Password?
                </a>
              </div>

              {errorMessage && <p className="error-msg">{errorMessage}</p>}

              <button
                type="submit"
                className="login-btn"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                aria-disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Log In"}
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
            <p>{alertModal.message}</p>
          </Modal>
        )}
      </div>
    )
  );
}
