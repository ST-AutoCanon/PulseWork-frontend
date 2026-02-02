import React, { useRef, useState, useEffect } from "react";
import { BODY_TYPES } from "./templatePresets";
import stylesLocal from "./UploadScan.module.css";

export default function SharedTemplateControls({
  styles,
  watermarkFile,
  setWatermarkFile,
  watermarkUrlProp,
  useWatermark,
  setUseWatermark,
  watermarkProps,
  onWatermarkChange,
  fileInputWatermarkRef: externalFileInputRef,
  bodyType,
  onBodyTypeChange,
  showEditor = false,
  onSetActiveArea,
  activeArea = "header",
}) {
  const fileInputRef = externalFileInputRef || useRef(null);

  const [localActive, setLocalActive] = useState(
    String(activeArea || "header"),
  );

  useEffect(() => {
    setLocalActive(String(activeArea || "header"));
  }, [activeArea]);

  function onSelectWatermark(e) {
    const f = e.target.files?.[0] || null;
    if (f) {
      setWatermarkFile && setWatermarkFile(f);
      setUseWatermark && setUseWatermark(true);
    } else {
      setWatermarkFile && setWatermarkFile(null);
    }
  }

  function clearWatermark() {
    setWatermarkFile && setWatermarkFile(null);
    setUseWatermark && setUseWatermark(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (typeof onWatermarkChange === "function") {
      onWatermarkChange({
        xPct: "20%",
        yPct: "30%",
        wPct: "40%",
        hPct: "40%",
        opacity: 0.12,
      });
    }
  }

  function handleWatermarkChangeFromPreview(next) {
    if (!next) return;
    if (typeof onWatermarkChange === "function") {
      onWatermarkChange(next);
    }
  }

  const effectiveWatermarkProps = watermarkProps || {
    xPct: "50%",
    yPct: "50%",
    wPct: "60%",
    hPct: "60%",
    opacity: 0.12,
  };

  function handleSetActiveArea(area) {
    setLocalActive(area);

    if (typeof onSetActiveArea === "function") {
      try {
        onSetActiveArea(area);
      } catch (e) {
        console.warn("onSetActiveArea threw", e);
      }
    }
  }

  const baseBtnStyle = {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #e6e9eb",
    background: "transparent",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 400,
    color: "#333",
    transition: "all 0.15s ease-in-out",
    minWidth: 64,
    textAlign: "center",
  };

  const activeBtnStyle = {
    border: "2px solid #0f6679",
    background: "#f0f7f9",
    color: "#0f6679",
    fontWeight: 600,
    boxShadow: "0 1px 0 rgba(15,102,121,0.12)",
  };

  const hoverStyle = {};

  return (
    <div className={styles?.sharedControls || stylesLocal.controls}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, marginBottom: 6 }}>Insert into</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["header", "footer"].map((a) => {
            const isActive = String(localActive || "header") === a;

            return (
              <button
                key={a}
                onClick={() => handleSetActiveArea(a)}
                type="button"
                aria-pressed={isActive}
                style={{ ...baseBtnStyle, ...(isActive ? activeBtnStyle : {}) }}
              >
                {a[0].toUpperCase() + a.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{ marginTop: 12, borderTop: "1px solid #f1f5f9", paddingTop: 8 }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={!!useWatermark}
            onChange={(e) => {
              const val = !!e.target.checked;
              setUseWatermark && setUseWatermark(val);
            }}
          />
          Add watermark
        </label>

        {useWatermark && (
          <div style={{ marginTop: 8 }}>
            <label
              className={styles?.fileLabel || stylesLocal.fileLabel}
              style={{ marginBottom: 6 }}
            >
              Watermark image
            </label>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,image/svg+xml"
                onChange={onSelectWatermark}
                className={styles?.fileInput || stylesLocal.fileInput}
              />
              {watermarkFile ? (
                <>
                  <div style={{ fontSize: 13 }}>{watermarkFile.name}</div>
                  <button
                    type="button"
                    className={styles?.clearBtn || stylesLocal.clearBtn}
                    onClick={clearWatermark}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  Choose an image to use as watermark
                </div>
              )}
            </div>

            {(watermarkUrlProp ??
              (watermarkFile ? URL.createObjectURL(watermarkFile) : null)) && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <label style={{ fontSize: 13 }}>Opacity</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={effectiveWatermarkProps.opacity}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    handleWatermarkChangeFromPreview({
                      ...effectiveWatermarkProps,
                      opacity: v,
                    });
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    handleWatermarkChangeFromPreview({
                      ...effectiveWatermarkProps,
                      wPct: "60%",
                      hPct: "60%",
                    })
                  }
                >
                  Reset size
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleWatermarkChangeFromPreview({
                      ...effectiveWatermarkProps,
                      xPct: "50%",
                      yPct: "50%",
                    })
                  }
                >
                  Center
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          margin: "8px 0",
          borderTop: "1px solid #f1f5f9",
          paddingTop: 8,
        }}
      >
        <div style={{ fontSize: 13, marginBottom: 6 }}>Document body</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {BODY_TYPES.map((b) => (
            <button
              key={b.key}
              onClick={() => onBodyTypeChange && onBodyTypeChange(b.key)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border:
                  bodyType === b.key
                    ? "2px solid #0f6679"
                    : "1px solid #e6e9eb",
                background: bodyType === b.key ? "#f0f7f9" : "transparent",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: bodyType === b.key ? "600" : "400",
                color: bodyType === b.key ? "#0f6679" : "#333",
              }}
              type="button"
              title={`Create ${b.label}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
