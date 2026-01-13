"use client";

import React from "react";
import { MdOutlineCancel } from "react-icons/md";
import "./Reimbursement.css";
const AttachmentsModal = ({
  isOpen,
  title = "Attachments",
  files = [],
  onClose = () => {},
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="att-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Attachments"}
    >
      <div className="att-modal-content">
        <div className="att-header">
          <h2>{title}</h2>
          <MdOutlineCancel
            className="att-close"
            onClick={onClose}
            role="button"
            aria-label="Close attachments"
            tabIndex={0}
          />
        </div>

        <div style={{ padding: "12px 18px" }}>
          {Array.isArray(files) && files.length > 0 ? (
            files.map((f, idx) => (
              <div key={idx} className="att-files" style={{ padding: "8px 0" }}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="att-file-link"
                >
                  {f.name}
                </a>
              </div>
            ))
          ) : (
            <p style={{ margin: 8 }}>No attachments available</p>
          )}
        </div>

        <div style={{ padding: "0 18px 18px 18px" }}>
          <button
            type="button"
            className="att-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentsModal;
