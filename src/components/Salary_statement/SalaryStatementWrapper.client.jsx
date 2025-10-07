"use client";

import React, { useState, useEffect, useRef } from "react";
import Salary_Statement from "./Salary_Statement.client";
import GeneratePayslip from "../generate_payslip/GeneratePayslip.client";
import { useAuth } from "../../context/AuthProvider.client"; // Adjust path

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div>Error in component: {this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

const SalaryStatementWrapper = () => {
  const { user, setUser } = useAuth();
  const [selectedView, setSelectedView] = useState(user?.selectedView || null);
  const [showPopup, setShowPopup] = useState(!user?.selectedView);
  const modalRef = useRef(null);
  const firstButtonRef = useRef(null);

  // Modal keyboard & focus management
  const handleKeyDown = (e) => {
    if (e.key === "Escape") setShowPopup(false);
  };

  const trapFocus = (e) => {
    if (!modalRef.current) return;
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  useEffect(() => {
    if (!showPopup || !modalRef.current || !firstButtonRef.current) return;
    firstButtonRef.current.focus();
    document.addEventListener("keydown", handleKeyDown);
    modalRef.current.addEventListener("keydown", trapFocus);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (modalRef.current)
        modalRef.current.removeEventListener("keydown", trapFocus);
    };
  }, [showPopup]);

  const handleSelection = (view) => {
    setSelectedView(view);
    setShowPopup(false);

    // Persist in Auth context
    setUser({ ...user, selectedView: view });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) setShowPopup(false);
  };

  return (
    <div style={styles.wrapper}>
      {/* Popup Modal */}
      {showPopup && (
        <div
          style={styles.overlay}
          onClick={handleBackdropClick}
          role="dialog"
          aria-labelledby="modal-heading"
          aria-modal="true"
        >
          <div style={styles.modal} ref={modalRef}>
            <h3 id="modal-heading" style={styles.modalHeading}>
              Select an Option
            </h3>
            <button
              type="button"
              style={styles.button}
              onClick={() => handleSelection("statement")}
              ref={firstButtonRef}
            >
              Salary Statement
            </button>
            <button
              type="button"
              style={styles.button}
              onClick={() => handleSelection("payslip")}
            >
              Generate Payslip
            </button>
          </div>
        </div>
      )}

      {/* Display selected content */}
      {selectedView === "statement" && (
        <ErrorBoundary>
          <Salary_Statement />
        </ErrorBoundary>
      )}
      {selectedView === "payslip" && (
        <ErrorBoundary>
          <GeneratePayslip />
        </ErrorBoundary>
      )}
    </div>
  );
};

const styles = {
  wrapper: { padding: "1rem", position: "relative", zIndex: 1 },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    color: "black",
    border: "3px solid green",
    borderRadius: "12px",
    padding: "30px",
    textAlign: "center",
    width: "300px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  modalHeading: { marginBottom: "20px", fontSize: "18px" },
  button: {
    padding: "10px 20px",
    margin: "10px",
    fontSize: "16px",
    backgroundColor: "#f0f0f0",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
  },
};

export default SalaryStatementWrapper;
