"use client";

import React from "react";
import { useAuth } from "../../context/AuthProvider.client";
import "./AuthLoadingOverlay.css";

export default function AuthLoadingOverlay() {
  const { hydrated, isLoggingOut } = useAuth();

  if (hydrated && !isLoggingOut) return null;

  return (
    <div className="auth-loading-overlay" role="status" aria-live="polite">
      <div className="auth-loading-inner" aria-hidden="true">
        <span className="auth-loading-emoji">🔄</span>
      </div>
    </div>
  );
}
