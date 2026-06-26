"use client";
import styles from "./A4PreviewModal.module.css";

export default function A4PreviewModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className={styles.a4Overlay}>
      <div className={styles.a4Modal}>
        <div className={styles.a4Header}>
          <h3>A4 Preview</h3>

          <button onClick={onClose}>✕</button>
        </div>

        <div className={styles.a4Content}>{children}</div>
      </div>
    </div>
  );
}
