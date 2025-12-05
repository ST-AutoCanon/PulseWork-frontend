"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./Purchase.module.css";

const OFFICE_ADDRESS = `Sukalpa Tech Solutions,
  3rd Floor, Sarathi Nagar,
  Plot no -71, Bauxite Road,
  Vidya Nagar, Sahyadri Nagar,
  Belagavi, Karnataka 590019`;
const OFFICE_EMAIL = "om@sukalpatechsolutions.com";
const OFFICE_PHONE = "+91-78928-59968";

export default function Purchase({ onClose }) {
  const router = useRouter();
  const [emailMenuOpen, setEmailMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setEmailMenuOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleClose = () => {
    if (typeof onClose === "function") onClose();
    router.push("/");
  };

  const mapEmbedSrc =
    "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d854.6890485211676!2d74.48380473920943!3d15.88685653851927!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTXCsDUzJzEyLjAiTiA3NMKwMjknMDMuOCJF!5e0!3m2!1sen!2sin!4v1734961256994!5m2!1sen!2sin";

  const subject = "Purchase Inquiry — PulseWork";
  const body =
    "Hi,\n\nI am interested in purchasing PulseWork. Please contact me with pricing and next steps.\n\nThanks,";
  const mailtoWithParams = `mailto:${OFFICE_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    OFFICE_EMAIL
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const outlookCompose = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(
    OFFICE_EMAIL
  )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const openMailClient = (evt) => {
    evt && evt.preventDefault();
    try {
      window.location.href = mailtoWithParams;
    } catch (err) {
      window.open(mailtoWithParams, "_self");
    }
    setEmailMenuOpen(false);
  };

  const openGmail = (evt) => {
    evt && evt.preventDefault();
    window.open(gmailCompose, "_blank", "noopener,noreferrer");
    setEmailMenuOpen(false);
  };

  const openOutlook = (evt) => {
    evt && evt.preventDefault();
    window.open(outlookCompose, "_blank", "noopener,noreferrer");
    setEmailMenuOpen(false);
  };

  const copyEmail = async (evt) => {
    evt && evt.preventDefault();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(OFFICE_EMAIL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        const tmp = document.createElement("input");
        tmp.value = OFFICE_EMAIL;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        document.body.removeChild(tmp);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      alert(`Couldn't copy email. Please use: ${OFFICE_EMAIL}`);
    } finally {
      setEmailMenuOpen(false);
    }
  };

  return (
    <div className={styles.purchaseRoot}>
      <iframe
        className={styles.mapIframe}
        src={mapEmbedSrc}
        allowFullScreen=""
        loading="lazy"
        title="Office Location"
      />

      <aside
        className={styles.contactPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-title"
      >
        <button
          className={styles.panelClose}
          aria-label="Close and go to home"
          onClick={handleClose}
          title="Close"
        >
          ×
        </button>

        <div className={styles.panelContent}>
          <h3 id="purchase-title">Let's get you set up</h3>

          <p className={styles.panelMessage}>
            Thanks for your interest — to purchase PulseWork (or schedule a
            demo), please contact our office and our team will help you with
            pricing, deployment options and next steps.
          </p>

          <div className={styles.contactLines}>
            <div>
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${OFFICE_EMAIL}`}
                onClick={(e) => {
                  e.preventDefault();
                  openMailClient();
                }}
                className={styles.contactLink}
              >
                {OFFICE_EMAIL}
              </a>
            </div>
            <div>
              <strong>Phone:</strong>{" "}
              <a href={`tel:${OFFICE_PHONE}`} className={styles.contactLink}>
                {OFFICE_PHONE}
              </a>
            </div>
            <div>
              <strong>Address:</strong> <span>{OFFICE_ADDRESS}</span>
            </div>
          </div>

          <div className={styles.panelActions}>
            <div ref={menuRef}>
              <button
                type="button"
                className={styles.btn}
                onClick={() => setEmailMenuOpen((s) => !s)}
                aria-expanded={emailMenuOpen}
                aria-haspopup="menu"
              >
                Email Us
              </button>

              {emailMenuOpen && (
                <div
                  role="menu"
                  aria-label="Email options"
                  style={{
                    position: "absolute",
                    right: 0,
                    marginTop: 8,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    padding: 8,
                    zIndex: 40,
                    minWidth: 220,
                  }}
                >
                  <button
                    role="menuitem"
                    onClick={openMailClient}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Open Mail Client
                  </button>

                  <button
                    role="menuitem"
                    onClick={openGmail}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    Open in Gmail
                  </button>

                  <button
                    role="menuitem"
                    onClick={openOutlook}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    Open in Outlook
                  </button>

                  <button
                    role="menuitem"
                    onClick={copyEmail}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    Copy Email Address
                  </button>
                </div>
              )}
            </div>

            <a
              className={`${styles.btn} ${styles.ghost}`}
              href={`tel:${OFFICE_PHONE}`}
            >
              Call Us
            </a>
          </div>

          {copied && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                background: "#e6ffe6",
                borderRadius: 8,
                fontSize: 13,
                color: "#064d00",
              }}
            >
              Email copied to clipboard — paste into your mail client.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
