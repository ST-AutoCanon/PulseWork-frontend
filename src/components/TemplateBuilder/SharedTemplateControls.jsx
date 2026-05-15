import React, { useRef, useState, useEffect } from "react";
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
  showEditor = false,
  onSetActiveArea,
  activeArea = "header",
  showInsertControls = true,
  onPreviewA4,
  onSaveTemplate,
  onPreviewChange,
  headerFile,
  setHeaderFile,
  headerUrlProp,
  footerFile,
  setFooterFile,
  footerUrlProp,
}) {
  console.log("SharedTemplateControls props:", {
    headerUrlProp,
    footerUrlProp,
    watermarkUrlProp,
  });
  const fileInputRef = externalFileInputRef || useRef(null);
  const fileInputHeaderRef = useRef(null);
  const fileInputFooterRef = useRef(null);

  const [localActive, setLocalActive] = useState(
    String(activeArea || "header"),
  );

  useEffect(() => {
    setLocalActive(String(activeArea || "header"));
  }, [activeArea]);

  function onSelectHeader(e) {
    const f = e.target.files?.[0] || null;
    setHeaderFile && setHeaderFile(f);
  }

  function clearHeader() {
    setHeaderFile && setHeaderFile(null);
    if (fileInputHeaderRef.current) fileInputHeaderRef.current.value = "";
  }

  function onSelectFooter(e) {
    const f = e.target.files?.[0] || null;
    setFooterFile && setFooterFile(f);
  }

  function clearFooter() {
    setFooterFile && setFooterFile(null);
    if (fileInputFooterRef.current) fileInputFooterRef.current.value = "";
  }

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

  useEffect(() => {
    if (onPreviewChange) {
      onPreviewChange({
        headerUrl: headerFile ? URL.createObjectURL(headerFile) : null,
        footerUrl: footerFile ? URL.createObjectURL(footerFile) : null,
        watermarkUrl:
          watermarkUrlProp ||
          (watermarkFile ? URL.createObjectURL(watermarkFile) : null),
      });
    }
  }, [
    headerFile,
    footerFile,
    watermarkUrlProp,
    watermarkFile,
    onPreviewChange,
  ]);

  function handleWatermarkChangeFromPreview(next) {
    if (!next) return;
    if (typeof onWatermarkChange === "function") {
      onWatermarkChange(next);
    }
  }

  const effectiveWatermarkProps = watermarkProps || {
    xPct: "50%",
    yPct: "55%",
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

  return (
    <div className={styles?.sharedControls || stylesLocal.controls}>
      {/* ===== Header Controls ===== */}
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Header Image</label>
        <div style={{ marginTop: 8 }}>
          <input
            ref={fileInputHeaderRef}
            type="file"
            accept="image/*"
            onChange={onSelectHeader}
            className={styles?.fileInput || stylesLocal.fileInput}
          />
          {headerFile ? (
            <>
              <div style={{ fontSize: 13 }}>{headerFile.name}</div>
              <button
                type="button"
                className={styles?.clearBtn || stylesLocal.clearBtn}
                onClick={clearHeader}
              >
                Remove
              </button>
            </>
          ) : headerUrlProp ? (
            <div style={{ fontSize: 13, color: "#10b981" }}>
              ✓ Header loaded (click to replace)
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Choose an image for header
            </div>
          )}
        </div>
      </div>

      {/* ===== Footer Controls ===== */}
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>Footer Image</label>
        <div style={{ marginTop: 8 }}>
          <input
            ref={fileInputFooterRef}
            type="file"
            accept="image/*"
            onChange={onSelectFooter}
            className={styles?.fileInput || stylesLocal.fileInput}
          />
          {footerFile ? (
            <>
              <div style={{ fontSize: 13 }}>{footerFile.name}</div>
              <button
                type="button"
                className={styles?.clearBtn || stylesLocal.clearBtn}
                onClick={clearFooter}
              >
                Remove
              </button>
            </>
          ) : footerUrlProp ? (
            <div style={{ fontSize: 13, color: "#10b981" }}>
              ✓ Footer loaded (click to replace)
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Choose an image for footer
            </div>
          )}
        </div>
      </div>

      {/* ===== Watermark Controls ===== */}
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
                      yPct: "35%",
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

      {/* ===== Footer Controls ===== */}
      <div
        style={{
          paddingTop: 12,
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => onPreviewA4 && onPreviewA4()}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: "white",
            color: "black",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Preview on A4
        </button>

        <button
          type="button"
          onClick={() => onSaveTemplate && onSaveTemplate()}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(180deg, #77dd0d, #9ef04a)",
            color: "black",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Save as Template
        </button>
      </div>
    </div>
  );
}
