"use client";

import React, { useEffect, useRef, useState } from "react";
import "./CompensationPopup.css";

export default function CompensationPopup({ lopModal, setLopModal }) {
  const [loadingAction, setLoadingAction] = useState(null); // null | 'approve' | 'compensated' | 'deducted' | 'apply'
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (!lopModal?.isVisible) return null;

  const days = Number(lopModal.days) || Number(lopModal.deficit) || 0;
  const remaining = Number(lopModal.remaining) || 0;

  // -- helpers
  const toNumberSafe = (v) =>
    v === "" || v === null || v === undefined ? 0 : Number(v) || 0;

  // update one of the numeric fields in parent state, allow empty string so user can type
  const updateField = (key, value) => {
    if (value === "" || value === null || value === undefined) {
      setLopModal((m) => ({ ...m, [key]: "", error: "" }));
      return;
    }
    const parsed = parseFloat(String(value));
    const isNum = Number.isFinite(parsed);
    const base = isNum ? Math.max(0, parsed) : 0;

    let clamped = base;
    if (key === "compensatedDays") {
      clamped = Math.min(base, days);
    } else if (key === "deductedDays") {
      clamped = Math.min(base, days, remaining);
    } else if (key === "lopDays") {
      clamped = Math.min(base, days);
    }

    setLopModal((m) => ({ ...m, [key]: clamped, error: "" }));
  };

  const close = () =>
    setLopModal((m) => ({
      ...m,
      isVisible: false,
      error: "",
      compensatedDays: 0,
      deductedDays: Math.min(remaining, days),
      lopDays: Math.max(0, days - Math.min(remaining, days)),
    }));

  const sum =
    toNumberSafe(lopModal.compensatedDays) +
    toNumberSafe(lopModal.deductedDays) +
    toNumberSafe(lopModal.lopDays);

  const EPS = 1e-6;

  const validateBeforeApply = (c, d, l) => {
    if (Math.abs(c + d + l - days) > EPS) {
      return `Split must add up to total requested days (${days}). Current sum: ${
        c + d + l
      }.`;
    }
    if (d - remaining > EPS) {
      return `Deducted days (${d}) cannot exceed employee remaining (${remaining}).`;
    }
    return null;
  };

  const runHandler = async (actionKey, handler, ...args) => {
    if (typeof handler !== "function") {
      // fallback: close if handler missing
      close();
      return;
    }

    try {
      setLoadingAction(actionKey);
      const result = await handler(...args);

      if (!mountedRef.current) return;

      if (!result || result.ok === false) {
        // extract message from result
        let msg = "Action failed";
        if (result && result.body) {
          if (typeof result.body === "string") msg = result.body;
          else if (result.body.message) msg = result.body.message;
          else msg = JSON.stringify(result.body);
        } else if (result && result.message) msg = result.message;

        // only update parent's error if popup still visible
        if (lopModal.isVisible) {
          setLopModal((m) => ({ ...m, error: msg }));
        }
      } else {
        // success: Admin will typically close the popup & show global alert.
        // We don't force-close here; Admin.showAlert closes the popup first.
      }
    } catch (err) {
      console.error("[CompensationPopup] handler threw:", err);
      const msg = err && err.message ? err.message : "Unexpected error";
      if (lopModal.isVisible) {
        setLopModal((m) => ({ ...m, error: msg }));
      }
    } finally {
      if (mountedRef.current) setLoadingAction(null);
    }
  };

  // Whether to disable form controls while some action is running
  const anyRunning = Boolean(loadingAction);

  return (
    <div
      className="comp-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comp-popup-title"
      onMouseDown={close}
    >
      <div
        className="comp-card"
        role="document"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="comp-header">
          <h3 id="comp-popup-title">Process Deficit</h3>
          <button
            className="comp-close"
            aria-label="Close dialog"
            onClick={close}
            disabled={anyRunning}
          >
            ✕
          </button>
        </header>

        <div className="comp-body">
          <p className="comp-message">{lopModal.message}</p>

          <div className="comp-deficit-row">
            <strong>Total requested days:</strong>
            <span className="comp-deficit-value" style={{ marginLeft: 8 }}>
              {days}
            </span>
            <span style={{ marginLeft: 12, color: "#666" }}>
              (remaining balance: {remaining})
            </span>
          </div>

          <div className="comp-input-grid">
            <label className="comp-field">
              <span className="comp-label">Compensated days</span>
              <input
                type="number"
                min={0}
                max={days}
                step="any"
                value={lopModal.compensatedDays ?? ""}
                onChange={(e) => updateField("compensatedDays", e.target.value)}
                disabled={anyRunning}
              />
            </label>

            <label className="comp-field">
              <span className="comp-label">Deducted from balance</span>
              <input
                type="number"
                min={0}
                max={Math.min(days, remaining)}
                step="any"
                value={lopModal.deductedDays ?? ""}
                onChange={(e) => updateField("deductedDays", e.target.value)}
                disabled={anyRunning}
              />
              <small style={{ display: "block", marginTop: 6 }}>
                Max deductible: {remaining}
              </small>
            </label>

            <label className="comp-field">
              <span className="comp-label">Loss-of-Pay days</span>
              <input
                type="number"
                min={0}
                max={days}
                step="any"
                value={lopModal.lopDays ?? ""}
                onChange={(e) => updateField("lopDays", e.target.value)}
                disabled={anyRunning}
              />
            </label>
          </div>

          <div className="comp-sum-row">
            <small>
              Sum: <strong>{sum}</strong> / Total requested days:{" "}
              <strong>{days}</strong>
            </small>
          </div>

          <div className="comp-quick-row" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="comp-btn comp-btn-ghost"
              onClick={() =>
                setLopModal((m) => ({
                  ...m,
                  compensatedDays: 0,
                  deductedDays: 0,
                  lopDays: days,
                  error: "",
                }))
              }
              disabled={anyRunning}
            >
              Quick: All → LoP
            </button>

            <button
              type="button"
              className="comp-btn comp-btn-ghost"
              onClick={() =>
                setLopModal((m) => ({
                  ...m,
                  compensatedDays: days,
                  deductedDays: 0,
                  lopDays: 0,
                  error: "",
                }))
              }
              disabled={anyRunning}
            >
              Quick: All → Compensated
            </button>

            <button
              type="button"
              className="comp-btn comp-btn-ghost"
              onClick={() =>
                setLopModal((m) => ({
                  ...m,
                  compensatedDays: 0,
                  deductedDays: Math.min(remaining, days),
                  lopDays: Math.max(0, days - Math.min(remaining, days)),
                  error: "",
                }))
              }
              disabled={anyRunning}
            >
              Quick: Use Balance → Deducted
            </button>
          </div>

          <div className="comp-actions" style={{ marginTop: 16 }}>
            <button
              className="comp-btn comp-btn-muted"
              onClick={close}
              disabled={anyRunning}
            >
              Cancel
            </button>

            <button
              className="comp-btn comp-btn-danger"
              onClick={async () =>
                await runHandler(
                  "approve",
                  lopModal.approveDeficit,
                  lopModal.leaveId
                )
              }
              disabled={anyRunning}
            >
              {loadingAction === "approve"
                ? "Processing…"
                : `Approve ${days} LoP`}
            </button>

            <button
              className="comp-btn"
              onClick={async () =>
                await runHandler(
                  "compensated",
                  lopModal.setAllCompensated,
                  lopModal.leaveId
                )
              }
              disabled={anyRunning}
            >
              {loadingAction === "compensated"
                ? "Processing…"
                : "All Compensated"}
            </button>

            <button
              className="comp-btn"
              onClick={async () =>
                await runHandler(
                  "deducted",
                  lopModal.setAllDeducted,
                  lopModal.leaveId
                )
              }
              disabled={anyRunning}
            >
              {loadingAction === "deducted" ? "Processing…" : "All Deducted"}
            </button>

            <button
              className="comp-btn comp-btn-primary"
              onClick={async () => {
                const c = toNumberSafe(lopModal.compensatedDays);
                const d = toNumberSafe(lopModal.deductedDays);
                const l = toNumberSafe(lopModal.lopDays);

                const validation = validateBeforeApply(c, d, l);
                if (validation) {
                  setLopModal((m) => ({ ...m, error: validation }));
                  console.warn(
                    "[CompensationPopup] validation failed:",
                    validation
                  );
                  return;
                }

                // pass numeric values
                await runHandler(
                  "apply",
                  lopModal.applyFlexibleSplit,
                  Number(c),
                  Number(d),
                  Number(l)
                );
              }}
              disabled={anyRunning}
            >
              {loadingAction === "apply" ? "Processing…" : "Apply split"}
            </button>
          </div>

          <div className="comp-note" style={{ marginTop: 12 }}>
            <small>
              <em>Note:</em> Deducted days cannot exceed the employee's
              remaining balance ({remaining}). Sum must equal total requested
              days ({days}).
            </small>
          </div>

          {lopModal.error && (
            <div style={{ marginTop: 12, color: "crimson" }}>
              <strong>Error:</strong> {lopModal.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
