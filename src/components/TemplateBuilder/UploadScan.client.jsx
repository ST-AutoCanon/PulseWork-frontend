"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./UploadScan.module.css";

export default function UploadScan({
  orgId,
  backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "",
  apiKey = process.env.NEXT_PUBLIC_API_KEY || "",
  onSaved,
  a4PreviewWidth = 360,
  onPreviewChange,
  controlsOnly = false,
}) {
  const [headerFile, setHeaderFile] = useState(null);
  const [footerFile, setFooterFile] = useState(null);
  const [headerUrl, setHeaderUrl] = useState(null);
  const [footerUrl, setFooterUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [saveName, setSaveName] = useState("");
  const fileInputHeaderRef = useRef(null);
  const fileInputFooterRef = useRef(null);

  useEffect(() => {
    if (headerFile) {
      const u = URL.createObjectURL(headerFile);
      setHeaderUrl(u);
      return () => URL.revokeObjectURL(u);
    } else {
      setHeaderUrl(null);
    }
  }, [headerFile]);

  useEffect(() => {
    if (footerFile) {
      const u = URL.createObjectURL(footerFile);
      setFooterUrl(u);
      return () => URL.revokeObjectURL(u);
    } else {
      setFooterUrl(null);
    }
  }, [footerFile]);

  useEffect(() => {
    if (typeof onPreviewChange === "function") {
      onPreviewChange({ headerUrl, footerUrl, headerFile, footerFile });
    }
  }, [headerUrl, footerUrl, headerFile, footerFile]);

  const a4Ratio = 297 / 210;
  const previewWidth = Number(a4PreviewWidth) || 360;
  const previewHeight = Math.round(previewWidth * a4Ratio);

  function onSelectHeader(e) {
    const f = e.target.files?.[0] || null;
    if (f) setHeaderFile(f);
    else setHeaderFile(null);
  }
  function onSelectFooter(e) {
    const f = e.target.files?.[0] || null;
    if (f) setFooterFile(f);
    else setFooterFile(null);
  }

  function clearHeader() {
    setHeaderFile(null);
    fileInputHeaderRef.current && (fileInputHeaderRef.current.value = "");
  }
  function clearFooter() {
    setFooterFile(null);
    fileInputFooterRef.current && (fileInputFooterRef.current.value = "");
  }

  async function handleSave() {
    setError("");
    if (!headerFile && !footerFile) {
      setError("Please select at least one image (header or footer).");
      return;
    }
    if (!orgId) {
      setError("Organization (orgId) is required to save.");
      return;
    }
    if (!saveName || !saveName.trim()) {
      setError("Please provide a name for the saved template.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (headerFile) fd.append("header", headerFile);
      if (footerFile) fd.append("footer", footerFile);
      fd.append("name", saveName.trim());

      const base = (backendUrl || "").replace(/\/$/, "");
      const url = base
        ? `${base}/api/orgs/${orgId}/templates/upload-scan`
        : `/api/orgs/${orgId}/templates/upload-scan`;

      const resp = await fetch(url, {
        method: "POST",
        headers: { "x-api-key": apiKey || "" },
        credentials: "include",
        body: fd,
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        const msg = (data && data.error) || `Upload failed (${resp.status})`;
        throw new Error(msg);
      }

      // Success: notify parent that save finished (no template payload)
      if (typeof onSaved === "function") onSaved();

      // reset UI
      setHeaderFile(null);
      setFooterFile(null);
      setSaveName("");
      setShowNamePrompt(false);
      fileInputHeaderRef.current && (fileInputHeaderRef.current.value = "");
      fileInputFooterRef.current && (fileInputFooterRef.current.value = "");
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const controls = (
    <>
      <div className={styles.fileRow}>
        <label className={styles.fileBox}>
          <div className={styles.fileLabel}>Header image</div>
          <input
            ref={fileInputHeaderRef}
            type="file"
            accept="image/*,image/svg+xml"
            onChange={onSelectHeader}
            className={styles.fileInput}
          />
          <div className={styles.fileInfo}>
            {headerFile ? (
              <>
                <div className={styles.fileName}>{headerFile.name}</div>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={clearHeader}
                >
                  Remove
                </button>
              </>
            ) : (
              <div className={styles.hint}>PNG / JPG / SVG recommended</div>
            )}
          </div>
        </label>

        <label className={styles.fileBox}>
          <div className={styles.fileLabel}>Footer image</div>
          <input
            ref={fileInputFooterRef}
            type="file"
            accept="image/*,image/svg+xml"
            onChange={onSelectFooter}
            className={styles.fileInput}
          />
          <div className={styles.fileInfo}>
            {footerFile ? (
              <>
                <div className={styles.fileName}>{footerFile.name}</div>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={clearFooter}
                >
                  Remove
                </button>
              </>
            ) : (
              <div className={styles.hint}>PNG / JPG / SVG recommended</div>
            )}
          </div>
        </label>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.previewBtn}
          type="button"
          onClick={() =>
            document
              .getElementById("a4-preview")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Preview on A4
        </button>

        <button
          className={styles.saveBtn}
          type="button"
          disabled={saving || (!headerFile && !footerFile)}
          onClick={() => setShowNamePrompt(true)}
        >
          {saving ? "Saving…" : "Save as Template"}
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </>
  );

  const previewBlock = (
    <div className={styles.previewArea}>
      <div
        id="a4-preview"
        className={styles.a4}
        style={{ width: previewWidth + "px", height: previewHeight + "px" }}
        role="img"
        aria-label="A4 preview"
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

  return (
    <div className={styles.uploadWrap}>
      <div className={styles.controls}>{controls}</div>

      {!controlsOnly && previewBlock}

      {showNamePrompt && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h4 className={styles.modalTitle}>Save template</h4>
            <p className={styles.modalText}>Enter a name for the template</p>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Template name (e.g. Invoice — Simple header)"
              className={styles.nameInput}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => {
                  setShowNamePrompt(false);
                  setError("");
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.modalSave}
                onClick={handleSave}
                disabled={saving}
                type="button"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            {error && <div className={styles.error}>{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
