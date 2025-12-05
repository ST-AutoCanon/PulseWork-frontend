"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import "./ResetPassword.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams?.get?.("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setError("");
    } else {
      setError("Invalid or missing token");
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "password") {
      setPassword(value);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/password-reset`,
        { resetToken: token, newPassword: password },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
        }
      );

      if (response.status === 200) {
        setSuccess(true);
        setError("");
        setTimeout(() => router.push("/"), 1500);
      } else {
        setError("Failed to reset password. Please try again.");
        setSuccess(false);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to reset password. Please try again.";
      setError(msg);
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-password-container">
        <div className="reset-header">
          <h2>Reset Your Password</h2>
        </div>

        {success ? (
          <div className="success-message">
            Password reset successfully! Redirecting to login...
          </div>
        ) : (
          error && <div className="re-error-message">{error}</div>
        )}

        <form className="reset-form" onSubmit={handleSubmit}>
          <div className="reset-group">
            <label htmlFor="password">New Password:</label>
            <input
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>
          <div className="reset-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>
          <div className="reset-button">
            <button className="submit-reset" type="submit" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
