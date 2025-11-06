"use client";

import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./Modal.css";

export default function Modal({
  className = "",
  customClass = "",
  title,
  isVisible = false,
  onClose,
  children,
  buttons = [],
  id = "app-modal",
}) {
  const modalRef = useRef(null);
  const previousActiveRef = useRef(null);

  useEffect(() => {
    if (!isVisible) return;

    previousActiveRef.current = document.activeElement;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = modalRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (focusable || modalRef.current)?.focus?.();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      } else if (e.key === "Tab") {
        const focusableEls = modalRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (!firstEl) {
          e.preventDefault();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      try {
        previousActiveRef.current?.focus?.();
      } catch {}
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const content = (
    <div
      className={`custom-modal-overlay ${className}`}
      onClick={() => onClose?.()}
      aria-hidden={false}
      data-testid="modal-overlay"
    >
      <div
        id={id}
        ref={modalRef}
        className={`custom-modal-content ${customClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${id}-title` : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2 id={`${id}-title`} className="modal-title">
              {title}
            </h2>
            <button
              aria-label="Close"
              className="modal-close-btn"
              onClick={() => onClose?.()}
            >
              ✕
            </button>
          </div>
        )}

        <div className="modal-body">{children}</div>

        {buttons && buttons.length > 0 && (
          <div
            className="modal-buttons"
            role="toolbar"
            aria-label="Modal actions"
          >
            {buttons.map((button, index) => (
              <button
                key={index}
                onClick={() => {
                  try {
                    (button.onClick || onClose || (() => {}))();
                  } catch (err) {
                    console.error("Modal button handler error:", err);
                  }
                }}
                className={button.className || "modal-btn"}
                type={button.type || "button"}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}
