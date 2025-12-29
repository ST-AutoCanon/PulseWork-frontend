"use client";

import React from "react";
import { MdOutlineCancel } from "react-icons/md";

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
      aria-label="Attachments"
    >
      <div className="att-modal-content">
        <div className="att-header">
          <h2>{title}</h2>
          <MdOutlineCancel
            className="att-close"
            onClick={onClose}
            role="button"
            aria-label="Close attachments modal"
          />
        </div>

        <div style={{ padding: "12px 18px" }}>
          {files.length > 0 ? (
            files.map((file, idx) => (
              <div key={idx} className="att-files" style={{ padding: "8px 0" }}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.name}
                </a>
              </div>
            ))
          ) : (
            <p style={{ margin: 8 }}>No attachments available</p>
          )}
        </div>

        <div style={{ padding: "0 18px 18px" }}>
          <button className="att-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentsModal;
