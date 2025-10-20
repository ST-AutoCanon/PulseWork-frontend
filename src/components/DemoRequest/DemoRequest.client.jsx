"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./DemoRequest.module.css";

export default function DemoRequest({ onClose: externalOnClose } = {}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
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

  // Use this wrapper to close either via provided onClose or internal state.
  const closeModal = () => {
    if (typeof externalOnClose === "function") {
      externalOnClose();
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (alertModal.isVisible)
          setAlertModal({ isVisible: false, title: "", message: "" });
        else setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [alertModal.isVisible]);

  const openModal = () => setIsOpen(true);

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

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
    e?.preventDefault();
    if (isSubmitting) return;

    const err = validate();
    if (err) {
      showAlert(err, "Validation error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/demo-request`,
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

      const data = await response.json();
      if (!response.ok) {
        showAlert(data.message || "Failed to send demo request", "Error");
        return;
      }

      showAlert(
        "Your demo request has been sent. We'll contact you shortly.",
        "Success"
      );
      setForm({
        name: "",
        email: "",
        organization: "",
        phone: "",
        message: "",
        preferredDate: "",
      });
      closeModal();
    } catch (err) {
      console.error("Demo request error", err);
      showAlert("An unexpected error occurred.", "Error");
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
            if (e.target === e.currentTarget) closeModal();
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
                onClick={closeModal}
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
                    type="submit"
                    className={styles.primaryBtn}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Request"}
                  </button>

                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>

                <p className={styles.helper}>
                  We’ll get back to you within 1–2 business days.
                </p>
              </form>
            </div>

            <div className={styles.decor} aria-hidden></div>
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
