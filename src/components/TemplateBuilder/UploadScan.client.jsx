"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import styles from "./UploadScan.module.css";
import A4Preview from "./A4Preview";

export default function UploadScan({
  orgId,
  backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "",
  apiKey = process.env.NEXT_PUBLIC_API_KEY || "",
  onSaved,
  a4PreviewWidth = 360,
  onPreviewChange,
  controlsOnly = false,
  initialHeaderUrl = null,
  initialFooterUrl = null,
  watermarkUrl: watermarkUrlProp = null,
  watermarkProps: watermarkPropsProp = null,
  onWatermarkChange = null,
  watermarkEditable = false,
  useWatermarkInitial = false,
  initialHeaderProps = null,
  initialFooterProps = null,
}) {
  const [headerFile, setHeaderFile] = useState(null);
  const [footerFile, setFooterFile] = useState(null);
  const [headerUrl, setHeaderUrl] = useState(null);
  const [footerUrl, setFooterUrl] = useState(null);

  const [watermarkFile, setWatermarkFile] = useState(null);
  const [watermarkUrl, setWatermarkUrl] = useState(null);

  const [watermarkX, setWatermarkX] = useState("20%");
  const [watermarkY, setWatermarkY] = useState("30%");
  const [watermarkW, setWatermarkW] = useState("40%");
  const [watermarkH, setWatermarkH] = useState("40%");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.12);

  const [useWatermark, setUseWatermark] = useState(useWatermarkInitial);

  const [headerProps, setHeaderProps] = useState(
    initialHeaderProps || {
      xPct: "50%",
      yPct: "50%",
      wPct: "100%",
      hPct: "100%",
    },
  );
  const [footerProps, setFooterProps] = useState(
    initialFooterProps || {
      xPct: "50%",
      yPct: "50%",
      wPct: "100%",
      hPct: "100%",
    },
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [saveName, setSaveName] = useState("");

  const isLoadingFromPropsRef = useRef(false);
  const fileInputHeaderRef = useRef(null);
  const fileInputFooterRef = useRef(null);
  const fileInputWatermarkRef = useRef(null);

  useEffect(() => {
    if (headerFile) {
      const u = URL.createObjectURL(headerFile);
      setHeaderUrl(u);
      return () => {
        try {
          URL.revokeObjectURL(u);
        } catch (e) {}
      };
    }
  }, [headerFile]);

  useEffect(() => {
    if (!headerFile) {
      setHeaderUrl(initialHeaderUrl ?? null);
    }
  }, [initialHeaderUrl, headerFile]);

  useEffect(() => {
    if (footerFile) {
      const u = URL.createObjectURL(footerFile);
      setFooterUrl(u);
      return () => {
        try {
          URL.revokeObjectURL(u);
        } catch (e) {}
      };
    }
  }, [footerFile]);

  useEffect(() => {
    if (!footerFile) {
      setFooterUrl(initialFooterUrl ?? null);
    }
  }, [initialFooterUrl, footerFile]);

  useEffect(() => {
    if (!watermarkFile) return;
    const u = URL.createObjectURL(watermarkFile);
    setWatermarkUrl(u);

    setWatermarkX("50%");
    setWatermarkY("50%");
    setWatermarkW("60%");
    setWatermarkH("60%");
    setWatermarkOpacity(0.12);

    return () => {
      try {
        URL.revokeObjectURL(u);
      } catch (e) {}
    };
  }, [watermarkFile]);

  useEffect(() => {
    if (typeof onPreviewChange !== "function") return;

    try {
      onPreviewChange({
        headerUrl: headerFile
          ? headerUrl
          : (headerUrl ?? initialHeaderUrl ?? null),
        footerUrl: footerFile
          ? footerUrl
          : (footerUrl ?? initialFooterUrl ?? null),
        headerFile,
        footerFile,
        watermarkUrl: watermarkFile ? watermarkUrl : (watermarkUrlProp ?? null),
        watermarkFile,
      });
    } catch (e) {
      console.warn("onPreviewChange handler threw", e);
    }
  }, [
    headerUrl,
    footerUrl,
    headerFile,
    footerFile,
    watermarkFile,
    watermarkUrl,
    watermarkUrlProp,
    initialHeaderUrl,
    initialFooterUrl,
    onPreviewChange,
  ]);

  function onSelectHeader(e) {
    const f = e.target.files?.[0] || null;
    if (f) setHeaderFile(f);
    else setHeaderFile(null);

    if (!f && typeof onPreviewChange === "function") {
      onPreviewChange({
        headerUrl: initialHeaderUrl ?? null,
        footerUrl: footerUrl ?? initialFooterUrl ?? null,
        headerFile: null,
        footerFile,
        watermarkUrl: watermarkFile ? watermarkUrl : watermarkUrlProp,
        watermarkFile,
      });
    }
  }

  function onSelectFooter(e) {
    const f = e.target.files?.[0] || null;
    if (f) setFooterFile(f);
    else setFooterFile(null);

    if (!f && typeof onPreviewChange === "function") {
      onPreviewChange({
        footerUrl: initialFooterUrl ?? null,
        headerUrl: headerUrl ?? initialHeaderUrl ?? null,
        footerFile: null,
        headerFile,
        watermarkUrl: watermarkFile ? watermarkUrl : watermarkUrlProp,
        watermarkFile,
      });
    }
  }

  function onSelectWatermark(e) {
    const f = e.target.files?.[0] || null;
    if (f) setWatermarkFile(f);
    else setWatermarkFile(null);
  }

  function clearHeader() {
    setHeaderFile(null);
    if (fileInputHeaderRef.current) fileInputHeaderRef.current.value = "";
    if (typeof onPreviewChange === "function") {
      onPreviewChange({
        headerUrl: null,
        footerUrl: footerUrl ?? initialFooterUrl ?? null,
        headerFile: null,
        footerFile,
        watermarkUrl: watermarkFile ? watermarkUrl : watermarkUrlProp,
        watermarkFile,
      });
    }
  }

  function clearFooter() {
    setFooterFile(null);
    if (fileInputFooterRef.current) fileInputFooterRef.current.value = "";
    if (typeof onPreviewChange === "function") {
      onPreviewChange({
        footerUrl: null,
        headerUrl: headerUrl ?? initialHeaderUrl ?? null,
        footerFile: null,
        headerFile,
        watermarkUrl: watermarkFile ? watermarkUrl : watermarkUrlProp,
        watermarkFile,
      });
    }
  }

  function clearWatermark() {
    setWatermarkFile(null);
    setUseWatermark(false);
    if (fileInputWatermarkRef.current) fileInputWatermarkRef.current.value = "";
    setWatermarkX("20%");
    setWatermarkY("30%");
    setWatermarkW("40%");
    setWatermarkH("40%");
    setWatermarkOpacity(0.12);
  }

  const handleWatermarkChangeFromPreview = useCallback(
    (next) => {
      if (!next) return;
      if (typeof onWatermarkChange === "function") {
        try {
          onWatermarkChange(next);
        } catch (e) {
          console.warn("onWatermarkChange threw", e);
        }
      } else {
        if (next.xPct) setWatermarkX(next.xPct);
        if (next.yPct) setWatermarkY(next.yPct);
        if (next.wPct) setWatermarkW(next.wPct);
        if (next.hPct) setWatermarkH(next.hPct);
        if (typeof next.opacity === "number") setWatermarkOpacity(next.opacity);
      }
    },
    [onWatermarkChange],
  );

  const handleHeaderChange = useCallback((next) => {
    if (next) {
      setHeaderProps(next);
    }
  }, []);

  const handleFooterChange = useCallback((next) => {
    if (next) {
      setFooterProps(next);
    }
  }, []);

  const effectiveWatermarkProps = useMemo(() => {
    if (watermarkPropsProp) {
      return {
        xPct: watermarkPropsProp.xPct ?? "50%",
        yPct: watermarkPropsProp.yPct ?? "50%",
        wPct: watermarkPropsProp.wPct ?? "60%",
        hPct: watermarkPropsProp.hPct ?? "60%",
        opacity:
          typeof watermarkPropsProp.opacity === "number"
            ? watermarkPropsProp.opacity
            : 0.12,
      };
    }
    return {
      xPct: watermarkX,
      yPct: watermarkY,
      wPct: watermarkW,
      hPct: watermarkH,
      opacity: watermarkOpacity,
    };
  }, [
    watermarkPropsProp?.xPct,
    watermarkPropsProp?.yPct,
    watermarkPropsProp?.wPct,
    watermarkPropsProp?.hPct,
    watermarkPropsProp?.opacity,
    watermarkX,
    watermarkY,
    watermarkW,
    watermarkH,
    watermarkOpacity,
  ]);

  async function handleSave() {
    setError("");

    if (!headerFile && !footerFile && !watermarkFile && !watermarkUrlProp) {
      setError(
        "Please select at least one image (header, footer or watermark).",
      );
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

      if (watermarkFile && useWatermark) {
        fd.append("watermark", watermarkFile);
      }

      fd.append("name", saveName.trim());

      const wp = watermarkPropsProp
        ? watermarkPropsProp
        : {
            xPct: watermarkX,
            yPct: watermarkY,
            wPct: watermarkW,
            hPct: watermarkH,
            opacity: watermarkOpacity,
          };

      fd.append(
        "meta",
        JSON.stringify({
          watermark: !!(useWatermark && (watermarkFile || watermarkUrlProp)),
          watermarkPlacement: wp,
          headerProps: headerProps,
          footerProps: footerProps,
        }),
      );

      if (useWatermark && watermarkUrlProp && !watermarkFile) {
        fd.append("existingWatermarkUrl", watermarkUrlProp);
      }

      const base = (backendUrl || "").replace(/\/$/, "");
      const url = base
        ? `${base}/api/orgs/${orgId}/templates/upload-scan`
        : `/api/orgs/${orgId}/templates/upload-scan`;

      const resp = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "x-api-key": apiKey || "" },
        body: fd,
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        const msg = (data && data.error) || `Upload failed (${resp.status})`;
        throw new Error(msg);
      }

      if (typeof onSaved === "function") onSaved(data || null);

      setHeaderFile(null);
      setFooterFile(null);
      setWatermarkFile(null);
      setSaveName("");
      setShowNamePrompt(false);

      if (fileInputHeaderRef.current) fileInputHeaderRef.current.value = "";
      if (fileInputFooterRef.current) fileInputFooterRef.current.value = "";
      if (fileInputWatermarkRef.current)
        fileInputWatermarkRef.current.value = "";
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

      <div
        style={{ marginTop: 12, borderTop: "1px solid #f1f5f9", paddingTop: 8 }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={useWatermark}
            onChange={(e) => {
              const val = !!e.target.checked;
              setUseWatermark(val);
              if (!val && !isLoadingFromPropsRef.current) {
                setWatermarkFile(null);
                if (fileInputWatermarkRef.current) {
                  fileInputWatermarkRef.current.value = "";
                }
              }
              isLoadingFromPropsRef.current = false;
            }}
          />
          Add watermark
        </label>

        {useWatermark && (
          <div style={{ marginTop: 8 }}>
            <label className={styles.fileLabel} style={{ marginBottom: 6 }}>
              Watermark image
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={fileInputWatermarkRef}
                type="file"
                accept="image/*,image/svg+xml"
                onChange={onSelectWatermark}
                className={styles.fileInput}
              />
              {watermarkFile ? (
                <>
                  <div style={{ fontSize: 13 }}>{watermarkFile.name}</div>
                  <button
                    type="button"
                    className={styles.clearBtn}
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

            {(watermarkUrlProp ?? watermarkUrl) && (
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
                    setWatermarkOpacity(v);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    handleWatermarkChangeFromPreview({
                      ...effectiveWatermarkProps,
                      wPct: "60%",
                      hPct: "60%",
                    });
                    setWatermarkW("60%");
                    setWatermarkH("60%");
                  }}
                >
                  Reset size
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleWatermarkChangeFromPreview({
                      ...effectiveWatermarkProps,
                      xPct: "50%",
                      yPct: "50%",
                    });
                    setWatermarkX("50%");
                    setWatermarkY("50%");
                  }}
                >
                  Center
                </button>
              </div>
            )}
          </div>
        )}
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
          disabled={
            saving ||
            (!headerFile && !footerFile && !(watermarkFile && useWatermark))
          }
          onClick={() => setShowNamePrompt(true)}
        >
          {saving ? "Saving…" : "Save as Template"}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </>
  );

  const previewBlock = (
    <main className={`${styles.uploadEditorPanel}`}>
      <div className={styles.previewArea}>
        <A4Preview
          headerUrl={headerUrl}
          footerUrl={footerUrl}
          watermarkUrl={watermarkUrlProp ?? watermarkUrl}
          watermarkProps={effectiveWatermarkProps}
          onWatermarkChange={handleWatermarkChangeFromPreview}
          editable={watermarkEditable || useWatermark}
          editableHeader={true}
          editableFooter={true}
          onHeaderChange={handleHeaderChange}
          onFooterChange={handleFooterChange}
          initialHeaderProps={headerProps}
          initialFooterProps={footerProps}
          boxesEditable={false}
          bodyBoxes={[]}
          width={Number(a4PreviewWidth) || 360}
          headerHeightPct={30}
          footerHeightPct={20}
        />
      </div>
    </main>
  );

  return (
    <div className={styles.uploadWrap}>
      <div className={styles.controls}>{controls}</div>

      {!controlsOnly && previewBlock}

      {showNamePrompt && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.templateModal}>
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
