"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./DemoRequest.module.css";

/**
 * DemoRequest
 * - On success alert OK: navigate to home (or call externalOnClose if provided)
 * - On modal close (×) and Cancel: navigate to home
 * - Dispatches "demoRequest:submitted" on success before navigation
 */
export default function DemoRequest({ onClose: externalOnClose } = {}) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
    isSuccess: false,
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    phone: "",
    message: "",
    preferredDate: "",
  });

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // helper: prefer externalOnClose (parent hook) otherwise client-side navigate
  const navigateHome = () => {
    if (typeof externalOnClose === "function") {
      try {
        externalOnClose();
      } catch (err) {
        console.error("[DemoRequest] externalOnClose threw:", err);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  // close modal and navigate home (for header × and Cancel)
  const closeModalAndNavigate = () => {
    console.log("[DemoRequest] closeModalAndNavigate()");
    setIsOpen(false);
    navigateHome();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (alertModal.isVisible) {
          setAlertModal({
            isVisible: false,
            title: "",
            message: "",
            isSuccess: false,
          });
        } else {
          closeModalAndNavigate();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [alertModal.isVisible]);

  const openModal = () => setIsOpen(true);

  const showAlert = (message, title = "", isSuccess = false) =>
    setAlertModal({ isVisible: true, title, message, isSuccess });

  // Dismiss alert. If it was a success alert, dispatch event then navigate home.
  const closeAlert = () => {
    const wasSuccess = alertModal.isSuccess;
    console.log("[DemoRequest] closeAlert() called; wasSuccess =", wasSuccess);

    // Close the alert UI immediately
    setAlertModal({
      isVisible: false,
      title: "",
      message: "",
      isSuccess: false,
    });

    if (wasSuccess) {
      // dispatch event so parent can react if desired
      try {
        const detail = { message: alertModal.message || "submitted" };
        window.dispatchEvent(
          new CustomEvent("demoRequest:submitted", { detail })
        );
        console.log("[DemoRequest] dispatched demoRequest:submitted", detail);
      } catch (err) {
        console.error(
          "[DemoRequest] failed to dispatch demoRequest:submitted",
          err
        );
      }

      // close modal and navigate home
      setIsOpen(false);
      navigateHome();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.message.trim())
      return "Please tell us what you'd like to see in the demo.";
    return null;
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    console.log("[DemoRequest] handleSubmit called", { isSubmitting });
    if (isSubmitting) return;

    const err = validate();
    if (err) {
      showAlert(err, "Validation error", false);
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("[DemoRequest] sending request", {
        payload: { ...form, messageLength: form.message.length },
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
          credentials: "include",
          body: JSON.stringify(form),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error("[DemoRequest] failed to parse JSON response", parseErr);
        showAlert("Unexpected server response.", "Error", false);
        return;
      }

      console.log("[DemoRequest] response", {
        ok: response.ok,
        status: response.status,
        data,
      });

      if (!response.ok) {
        showAlert(
          data.message || "Failed to send demo request",
          "Error",
          false
        );
        return;
      }

      // SUCCESS: show alert and mark isSuccess true.
      showAlert(
        data.message ||
          "Your demo request has been sent. We'll contact you shortly.",
        "Success",
        true
      );

      // clear local form (modal will close when user dismisses success alert)
      setForm({
        name: "",
        email: "",
        organization: "",
        phone: "",
        message: "",
        preferredDate: "",
      });

      console.log(
        "[DemoRequest] success: alert shown (waiting for user dismissal)"
      );
    } catch (err) {
      console.error("[DemoRequest] request error", err);
      showAlert("An unexpected error occurred.", "Error", false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.triggerButton}
        onClick={openModal}
        aria-haspopup="dialog"
      >
        Demo Request
      </button>

      {isOpen && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            // If an alert is visible, ignore outside clicks so that nothing accidentally closes the modal
            if (e.target === e.currentTarget && !alertModal.isVisible)
              closeModalAndNavigate();
          }}
        >
          <div
            className={styles.modal}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <h3 className={styles.title}>Request a Demo</h3>
              <button
                className={styles.closeBtn}
                onClick={closeModalAndNavigate}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={styles.body}>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Full name</label>
                  <input
                    className={styles.input}
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Email address</label>
                  <input
                    className={styles.input}
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroupSmall}>
                    <label className={styles.label}>Organization</label>
                    <input
                      className={styles.input}
                      name="organization"
                      placeholder="Company (optional)"
                      value={form.organization}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.inputGroupSmall}>
                    <label className={styles.label}>Phone</label>
                    <input
                      className={styles.input}
                      name="phone"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Message</label>
                  <textarea
                    className={styles.textarea}
                    name="message"
                    placeholder="What would you like to see in the demo?"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? "Sending..." : "Send Request"}
                  </button>

                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={closeModalAndNavigate}
                  >
                    Cancel
                  </button>
                </div>

                <p className={styles.helper}>
                  We’ll get back to you within 1–2 business days.
                </p>
              </form>
            </div>

            <div className={styles.decor} aria-hidden />
          </div>
        </div>
      )}

      {alertModal.isVisible && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAlert();
          }}
        >
          <div
            className={styles.alert}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.alertHeader}>
              <h4 className={styles.alertTitle}>{alertModal.title || ""}</h4>
              <button
                className={styles.closeBtn}
                onClick={closeAlert}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className={styles.alertBody}>
              <p>{alertModal.message}</p>
              <div className={styles.alertActions}>
                <button className={styles.primaryBtn} onClick={closeAlert}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
