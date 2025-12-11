// Login.client.jsx (or .tsx if you prefer)
"use client";

import React, { useState, useEffect } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleShowPassword = () => setShowPassword((p) => !p);

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });

  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const closeModal = () => {
    setIsModalOpen(false);
    if (onClose) onClose();
  };

  useEffect(() => {
    if (typeof router.prefetch === "function") {
      router.prefetch("/dashboard");
      router.prefetch("/FacePunch");
    }
  }, [router]);

  // parent (HRMS) origin listening to the child: 1574
  const EXPECTED_PARENT_ORIGIN = "http://localhost:1574";

  useEffect(() => {
    function onMessage(ev) {
      // only accept messages from the trusted parent origin
      if (ev.origin !== EXPECTED_PARENT_ORIGIN) return;
      const msg = ev.data || {};
      if (msg.type === "parent-login") {
        performLogin(msg.username, msg.password);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function performLogin(usernameVal, passwordVal) {
    setErrorMessage("");
    if (!usernameVal || !passwordVal) {
      setErrorMessage("Username and password are required.");
      // inform parent about failure
      if (window.parent && window.parent !== window.self) {
        window.parent.postMessage(
          {
            type: "login-failed",
            error: "Username and password are required.",
          },
          EXPECTED_PARENT_ORIGIN
        );
      }
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
          body: JSON.stringify({ email: usernameVal, password: passwordVal }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errMsg = data.message || "Invalid credentials.";
        setErrorMessage(errMsg);
        // inform parent about failure
        if (window.parent && window.parent !== window.self) {
          window.parent.postMessage(
            { type: "login-failed", error: errMsg },
            EXPECTED_PARENT_ORIGIN
          );
        }
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

      // use your app's login function (from AuthProvider)
      await login(minimalUser);
      closeModal();

      // notify parent that login succeeded
      if (window.parent && window.parent !== window.self) {
        window.parent.postMessage(
          { type: "login-success", payload: minimalUser },
          EXPECTED_PARENT_ORIGIN
        );
      }

      // continue with your navigation behavior
      if (
        (usernameVal || "").toLowerCase() === "manish.p@yopmail.com" &&
        (minimalUser.role || "").toLowerCase() === "general"
      ) {
        router.push("/FacePunch");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("login error", err);
      setErrorMessage("An unexpected error occurred.");
      if (window.parent && window.parent !== window.self) {
        window.parent.postMessage(
          { type: "login-failed", error: "An unexpected error occurred." },
          EXPECTED_PARENT_ORIGIN
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

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

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(data.message || "Invalid credentials.");
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

      if (
        username.toLowerCase() === "manish.p@yopmail.com" &&
        (minimalUser.role || "").toLowerCase() === "general"
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
            {errorMessage && <p className="error-msg">{errorMessage}</p>}

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
