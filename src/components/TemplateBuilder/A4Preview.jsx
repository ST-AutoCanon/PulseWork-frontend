import React from "react";
import styles from "./UploadScan.module.css";

export default function A4Preview({ headerUrl, footerUrl, width = 420 }) {
  const a4Ratio = 297 / 210;
  const w = Number(width) || 420;
  const h = Math.round(w * a4Ratio);

  return (
    <div className={styles.previewArea}>
      <div
        id="a4-preview"
        className={styles.a4}
        style={{ width: w + "px", height: h + "px" }}
      >
        <div className={styles.paperInner}>
          <div className={styles.headerSlot}>
            {headerUrl ? (
              <img
                src={headerUrl}
                alt="Header preview"
                className={styles.slotImg}
              />
            ) : (
              <div className={styles.slotPlaceholder}>
                Header will appear here
              </div>
            )}
          </div>
          <div className={styles.bodySlot} aria-hidden="true">
            <div className={styles.pageRuler}>A4 (210 × 297 mm)</div>
          </div>
          <div className={styles.footerSlot}>
            {footerUrl ? (
              <img
                src={footerUrl}
                alt="Footer preview"
                className={styles.slotImg}
              />
            ) : (
              <div className={styles.slotPlaceholder}>
                Footer will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
