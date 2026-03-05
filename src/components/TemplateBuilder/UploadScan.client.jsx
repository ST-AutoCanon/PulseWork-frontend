"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "./UploadScan.module.css";
import A4Preview from "./A4Preview";
import {
  PRESET_FIELDS,
  BODY_TYPES,
  fieldsToBoxes,
  fillPlaceholdersInFields,
} from "./templatePresets";

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
  initialBodyType = "letter",
  bodyType: bodyTypeProp = null,
  onBodyTypeChange = null,
  bodyBoxes = null,
  setBodyBoxes = null,
  onSelectBox = null,
  showEditor = false,
  setShowEditor = null,
  selectedFieldId = null,
  setSelectedFieldId = null,
  updateSelectedBoxStyle = null,
  updateSelectedBoxContent = null,
  onUploadImage = null,
  watermarkUrl: watermarkUrlProp = null,
  watermarkProps: watermarkPropsProp = null,
  onWatermarkChange = null,
  watermarkEditable = false,
  useWatermarkInitial = false,
}) {
  const [headerFile, setHeaderFile] = useState(null);
  const [footerFile, setFooterFile] = useState(null);
  const [headerUrl, setHeaderUrl] = useState(null);
  const [footerUrl, setFooterUrl] = useState(null);

  const [watermarkFile, setWatermarkFile] = useState(null);
  const [watermarkUrl, setWatermarkUrl] = useState(null);

  const [qrFile, setQrFile] = useState(null);
  const [sealFile, setSealFile] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [sealUrl, setSealUrl] = useState(null);

  const [watermarkX, setWatermarkX] = useState("20%");
  const [watermarkY, setWatermarkY] = useState("30%");
  const [watermarkW, setWatermarkW] = useState("40%");
  const [watermarkH, setWatermarkH] = useState("40%");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.12);

  const [useWatermark, setUseWatermark] = useState(useWatermarkInitial);

  const [templateFields, setTemplateFields] = useState(null);
  const [templateBoxes, setTemplateBoxes] = useState(null);

  const [localBodyType, setLocalBodyType] = useState(
    bodyTypeProp ?? initialBodyType ?? "letter",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showFillModal, setShowFillModal] = useState(false);

  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [companyName, setCompanyName] = useState("");

  const isLoadingFromPropsRef = useRef(false);
  const fileInputHeaderRef = useRef(null);
  const fileInputFooterRef = useRef(null);
  const fileInputWatermarkRef = useRef(null);
  const fileInputQrRef = useRef(null);
  const fileInputSealRef = useRef(null);

  const getBoxes = () => {
    if (Array.isArray(templateBoxes)) return templateBoxes;
    if (Array.isArray(bodyBoxes)) return bodyBoxes;
    const preset = (PRESET_FIELDS && PRESET_FIELDS[localBodyType]) || [];
    return fieldsToBoxes(preset || []);
  };

  useEffect(() => {
    if (Array.isArray(bodyBoxes)) {
      setTemplateBoxes(bodyBoxes.map((b) => ({ ...b })));
    }
  }, [bodyBoxes]);

  useEffect(() => {
    if (bodyTypeProp !== undefined && bodyTypeProp !== null) {
      setLocalBodyType(bodyTypeProp);
      setTemplateBoxes(null);

      const newPreset = (PRESET_FIELDS && PRESET_FIELDS[bodyTypeProp]) || [];
      const newBoxes = fieldsToBoxes(newPreset || []);
      if (typeof setBodyBoxes === "function") {
        try {
          setBodyBoxes(newBoxes);
        } catch (e) {
          console.warn("setBodyBoxes threw during body type change", e);
        }
      }
    }
  }, [bodyTypeProp, setBodyBoxes]);

  // When the user selects a local file we create a blob URL exactly once.
  // Do not regenerate it merely because the parent later echoes it back via
  // initialHeaderUrl; that causes an infinite feedback loop.
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

  // same logic for footer: don't recreate blob on prop updates
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
    if (!qrFile) {
      setQrUrl(null);
      return;
    }
    const u = URL.createObjectURL(qrFile);
    setQrUrl(u);
    return () => {
      try {
        URL.revokeObjectURL(u);
      } catch (e) {}
    };
  }, [qrFile]);

  useEffect(() => {
    if (!sealFile) {
      setSealUrl(null);
      return;
    }
    const u = URL.createObjectURL(sealFile);
    setSealUrl(u);
    return () => {
      try {
        URL.revokeObjectURL(u);
      } catch (e) {}
    };
  }, [sealFile]);

  useEffect(() => {
    if (typeof onPreviewChange !== "function") return;
    try {
      // only forward the header/footer URLs when a file is present;
      // otherwise send null so parent preview state is cleared and no
      // network fetches occur for stale URLs.
      onPreviewChange({
        headerUrl: headerFile ? headerUrl : null,
        footerUrl: footerFile ? footerUrl : null,
        headerFile,
        footerFile,
        watermarkUrl: watermarkFile ? watermarkUrl : watermarkUrlProp,
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
    onPreviewChange,
  ]);

  function onSelectHeader(e) {
    const f = e.target.files?.[0] || null;
    if (f) setHeaderFile(f);
    else setHeaderFile(null);
    if (!f && typeof onPreviewChange === "function") {
      onPreviewChange({
        headerUrl: null,
        footerUrl,
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
        footerUrl: null,
        headerUrl,
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
  function onSelectQr(e) {
    const f = e.target.files?.[0] || null;
    if (f) setQrFile(f);
    else setQrFile(null);
  }
  function onSelectSeal(e) {
    const f = e.target.files?.[0] || null;
    if (f) setSealFile(f);
    else setSealFile(null);
  }

  function clearHeader() {
    setHeaderFile(null);
    if (fileInputHeaderRef.current) fileInputHeaderRef.current.value = "";
    if (typeof onPreviewChange === "function") {
      onPreviewChange({
        headerUrl: null,
        footerUrl,
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
        headerUrl,
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
  function clearQr() {
    setQrFile(null);
    if (fileInputQrRef.current) fileInputQrRef.current.value = "";
    setQrUrl(null);
  }
  function clearSeal() {
    setSealFile(null);
    if (fileInputSealRef.current) fileInputSealRef.current.value = "";
    setSealUrl(null);
  }

  const handleUpdateSelectedBoxStyle = useCallback(
    (newStyle) => {
      if (typeof updateSelectedBoxStyle === "function") {
        try {
          updateSelectedBoxStyle(newStyle);
        } catch (e) {
          console.warn("updateSelectedBoxStyle prop threw", e);
        }
        return;
      }

      if (!selectedFieldId) return;
      const boxes = getBoxes().map((b) =>
        String(b.id) === String(selectedFieldId)
          ? { ...b, style: { ...(b.style || {}), ...(newStyle || {}) } }
          : b,
      );
      setTemplateBoxes(boxes);
      if (typeof setBodyBoxes === "function") {
        try {
          setBodyBoxes(boxes);
        } catch (e) {
          console.warn("setBodyBoxes threw", e);
        }
      }
    },
    [
      selectedFieldId,
      templateBoxes,
      bodyBoxes,
      updateSelectedBoxStyle,
      setBodyBoxes,
    ],
  );

  const handleUpdateSelectedBoxContent = useCallback(
    (nextContentOrBoxPatch) => {
      if (typeof updateSelectedBoxContent === "function") {
        try {
          updateSelectedBoxContent(nextContentOrBoxPatch);
        } catch (e) {
          console.warn("updateSelectedBoxContent prop threw", e);
        }
        return;
      }

      if (!selectedFieldId) return;
      const boxes = getBoxes().map((b) => {
        if (String(b.id) !== String(selectedFieldId)) return b;
        if (typeof nextContentOrBoxPatch === "string") {
          return { ...b, content: nextContentOrBoxPatch };
        } else if (
          typeof nextContentOrBoxPatch === "object" &&
          nextContentOrBoxPatch !== null
        ) {
          return { ...b, ...nextContentOrBoxPatch };
        }
        return b;
      });
      setTemplateBoxes(boxes);
      if (typeof setBodyBoxes === "function") {
        try {
          setBodyBoxes(boxes);
        } catch (e) {
          console.warn("setBodyBoxes threw", e);
        }
      }
    },
    [selectedFieldId, updateSelectedBoxContent, setBodyBoxes],
  );

  const handleBoxesChangeFromPreview = useCallback(
    (nextBoxes) => {
      setTemplateBoxes(nextBoxes);
      if (typeof setBodyBoxes === "function") {
        try {
          setBodyBoxes(nextBoxes);
        } catch (e) {
          console.warn("setBodyBoxes threw", e);
        }
      }
    },
    [setBodyBoxes],
  );

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

  const effectiveWatermarkProps = React.useMemo(() => {
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
      if (qrFile) fd.append("qr", qrFile);
      if (sealFile) fd.append("seal", sealFile);

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
          bodyType: localBodyType,
          watermark: !!(useWatermark && (watermarkFile || watermarkUrlProp)),
          watermarkPlacement: wp,
        }),
      );

      if (useWatermark && watermarkUrlProp && !watermarkFile) {
        fd.append("existingWatermarkUrl", watermarkUrlProp);
      }

      const layoutToSend = (getBoxes() || []).map((box) => ({
        ...box,
        // Ensure style object is preserved and complete
        style: {
          ...box.style,
        },
      }));

      let grapesJsonToSend = null;
      if (
        templateFields &&
        typeof templateFields === "object" &&
        templateFields.components
      ) {
        grapesJsonToSend = { ...templateFields };
        try {
          grapesJsonToSend.layout = layoutToSend;
        } catch (e) {}
      } else {
        grapesJsonToSend = {
          id: `client-${Date.now()}`,
          components: [],
          layout: layoutToSend,
        };
      }

      try {
        fd.append("layout", JSON.stringify(layoutToSend || []));
        fd.append("grapes_json", JSON.stringify(grapesJsonToSend));
      } catch (err) {
        console.warn("Failed to stringify layout/grapes_json for upload:", err);
      }

      // Upload QR as file if not already provided
      if (!qrFile) {
        const qrBox = (layoutToSend || []).find(
          (b) =>
            String(b.fieldName || "")
              .toLowerCase()
              .includes("qr") ||
            String(b.id || "")
              .toLowerCase()
              .includes("qr"),
        );
        if (
          qrBox &&
          qrBox.content &&
          String(qrBox.content).startsWith("blob:")
        ) {
          try {
            const blobRes = await fetch(qrBox.content);
            const qrBlob = await blobRes.blob();
            fd.append("qr", qrBlob, "qr_image.png");
            console.log("📤 Uploading QR blob URL as file");
          } catch (e) {
            console.warn("Failed to upload QR blob URL:", e);
          }
        }
      }

      // Upload Seal as file if not already provided
      if (!sealFile) {
        const sealBox = (layoutToSend || []).find((b) =>
          /seal|stamp|logo|companyseal/i.test(
            String(b.fieldName || "") || String(b.id || ""),
          ),
        );
        if (
          sealBox &&
          sealBox.content &&
          String(sealBox.content).startsWith("blob:")
        ) {
          try {
            const blobRes = await fetch(sealBox.content);
            const sealBlob = await blobRes.blob();
            fd.append("seal", sealBlob, "seal_image.png");
            console.log("📤 Uploading Seal blob URL as file");
          } catch (e) {
            console.warn("Failed to upload Seal blob URL:", e);
          }
        }
      } else {
        // Send empty fileMap flag to indicate no explicit mapping was found
        // This allows backend to use heuristic matching
        fd.append("useHeuristic", "true");
      }

      // Note: Removed complex fileMap logic - the backend now uses simple heuristic matching
      // which is more reliable and easier to maintain

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
      setQrFile(null);
      setSealFile(null);
      setSaveName("");
      setShowNamePrompt(false);
      if (fileInputHeaderRef.current) fileInputHeaderRef.current.value = "";
      if (fileInputFooterRef.current) fileInputFooterRef.current.value = "";
      if (fileInputWatermarkRef.current)
        fileInputWatermarkRef.current.value = "";
      if (fileInputQrRef.current) fileInputQrRef.current.value = "";
      if (fileInputSealRef.current) fileInputSealRef.current.value = "";
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function FieldPropertiesPanel({
    selectedFieldId,
    bodyBoxes,
    setSelectedFieldId,
    updateSelectedBoxStyle,
    onUploadImageProp,
  }) {
    if (!Array.isArray(bodyBoxes) || !selectedFieldId) {
      return (
        <div style={{ padding: 8, fontSize: 13, color: "#64748b" }}>
          Select a field on the preview to edit its style
        </div>
      );
    }

    const sel =
      bodyBoxes.find((b) => String(b.id) === String(selectedFieldId)) || null;
    if (!sel) {
      return (
        <div style={{ padding: 8, fontSize: 13, color: "#64748b" }}>
          Selected field not found
        </div>
      );
    }

    const s = sel.style || {};
    const currentColor = s.color || "#0f1724";
    const bgIsShown = s.background && s.background !== "transparent";
    const currentBg = bgIsShown ? s.background : "#ffffff";
    const fontSizeVal = s.fontSize || 11;
    const fontWeightIsBold = String(s.fontWeight) === "700";
    const paddingVal =
      typeof s.padding === "number" ? s.padding : (s.padding ?? 6);

    const isImageField =
      sel.type === "image" ||
      /qr|seal|logo|stamp/i.test(sel.fieldName || sel.name || "");

    const fileRef = React.createRef();

    return (
      <div>
        <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
          Field properties
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Text color</div>
          <input
            type="color"
            value={currentColor}
            onChange={(e) =>
              updateSelectedBoxStyle &&
              updateSelectedBoxStyle({ ...s, color: e.target.value })
            }
            aria-label="Text color"
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Background</div>
          <input
            type="color"
            value={currentBg}
            onChange={(e) =>
              updateSelectedBoxStyle &&
              updateSelectedBoxStyle({ ...s, background: e.target.value })
            }
            aria-label="Background color"
          />
          <label style={{ marginLeft: 8 }}>
            <input
              type="checkbox"
              checked={bgIsShown}
              onChange={(e) =>
                updateSelectedBoxStyle &&
                updateSelectedBoxStyle({
                  ...s,
                  background: e.target.checked
                    ? s.background || "#ffffff"
                    : "transparent",
                })
              }
            />{" "}
            show background
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Alignment</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["left", "center", "right"].map((al) => (
              <button
                key={al}
                type="button"
                onClick={() =>
                  updateSelectedBoxStyle &&
                  updateSelectedBoxStyle({ ...s, textAlign: al })
                }
                style={{
                  padding: "6px 8px",
                  borderRadius: 6,
                  border:
                    (s.textAlign || "left") === al
                      ? "2px solid #0f6679"
                      : "1px solid #e6e9eb",
                  background:
                    (s.textAlign || "left") === al ? "#f0f7f9" : "transparent",
                  cursor: "pointer",
                }}
              >
                {al}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Font size</div>
          <input
            type="number"
            min={6}
            max={72}
            value={fontSizeVal}
            onChange={(e) =>
              updateSelectedBoxStyle &&
              updateSelectedBoxStyle({
                ...s,
                fontSize: Number(e.target.value) || 11,
              })
            }
            style={{ width: 80 }}
          />
          <label style={{ marginLeft: 12 }}>
            <input
              type="checkbox"
              checked={fontWeightIsBold}
              onChange={(e) =>
                updateSelectedBoxStyle &&
                updateSelectedBoxStyle({
                  ...s,
                  fontWeight: e.target.checked ? 700 : 400,
                })
              }
            />{" "}
            Bold
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Padding (px)</div>
          <input
            type="number"
            min={0}
            max={200}
            value={paddingVal}
            onChange={(e) =>
              updateSelectedBoxStyle &&
              updateSelectedBoxStyle({
                ...s,
                padding: Number(e.target.value) || 0,
              })
            }
            style={{ width: 90 }}
          />
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginLeft: 8,
              display: "inline-block",
            }}
          >
            Visual padding inside the box.
          </div>
        </div>

        {isImageField && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Replace image</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,image/svg+xml"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                if (!f) return;
                if (typeof onUploadImageProp === "function") {
                  try {
                    onUploadImageProp(f, sel);
                  } catch (err) {
                    console.warn("onUploadImage threw", err);
                  }
                } else if (typeof onUploadImage === "function") {
                  try {
                    onUploadImage(f, sel);
                  } catch (err) {
                    console.warn("onUploadImage prop threw", err);
                  }
                } else {
                  handleUpdateSelectedBoxContent({
                    imageUrl: URL.createObjectURL(f),
                    content: URL.createObjectURL(f),
                  });
                }
                try {
                  e.target.value = "";
                } catch (e) {}
              }}
            />
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
              Upload an image to replace this field's image (QR, seal, logo
              etc). The actual upload/handling happens in the parent editor.
            </div>
          </div>
        )}

        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              if (typeof setSelectedFieldId === "function")
                setSelectedFieldId(null);
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const previewBoxes = getBoxes();

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

        <button
          className={styles.modeBtn}
          type="button"
          onClick={() => setShowFillModal(true)}
        >
          Fill bank & company details
        </button>

        {showFillModal && (
          <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
            <div className={styles.modal}>
              <h4>Fill bank & company details</h4>

              <label>
                Company name
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </label>

              <label>
                Bank name
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </label>

              <label>
                Account no
                <input
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                />
              </label>

              <label>
                IFSC
                <input value={ifsc} onChange={(e) => setIfsc(e.target.value)} />
              </label>

              <label>
                Account holder
                <input
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                />
              </label>

              <hr style={{ margin: "12px 0" }} />

              <label>QR code image</label>
              <div>
                <input
                  ref={fileInputQrRef}
                  type="file"
                  accept="image/*,image/svg+xml"
                  onChange={onSelectQr}
                  className={styles.fileInput}
                />
                {qrFile || qrUrl ? (
                  <>
                    <div style={{ fontSize: 13 }}>
                      {qrFile ? qrFile.name : "Using existing QR image"}
                    </div>
                    <button type="button" onClick={clearQr}>
                      Remove
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    Upload a bank QR image
                  </div>
                )}
              </div>

              <label>Seal image</label>
              <div>
                <input
                  ref={fileInputSealRef}
                  type="file"
                  accept="image/*,image/svg+xml"
                  onChange={onSelectSeal}
                  className={styles.fileInput}
                />
                {sealFile || sealUrl ? (
                  <>
                    <div style={{ fontSize: 13 }}>
                      {sealFile ? sealFile.name : "Using existing seal image"}
                    </div>
                    <button type="button" onClick={clearSeal}>
                      Remove
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    Upload a company seal image
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowFillModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const placeholders = {
                      bankName: (bankName || "").trim(),
                      accountNo: (accountNo || "").trim(),
                      ifsc: (ifsc || "").trim(),
                      accountHolder: (accountHolder || "").trim(),
                      companyName: (companyName || "").trim(),
                      qrUrl: qrUrl || null,
                      sealUrl: sealUrl || null,
                    };

                    function escRx(s = "") {
                      return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    }

                    const tokenMap = {
                      "bank name": placeholders.bankName,
                      "bank account": placeholders.accountNo,
                      "bank ifsc": placeholders.ifsc || placeholders.IFSC || "",
                      "account name": placeholders.accountHolder,
                      "company name": placeholders.companyName,
                    };

                    function replaceTokensInString(str) {
                      if (typeof str !== "string") return str;
                      let out = str;
                      for (const [token, value] of Object.entries(tokenMap)) {
                        if (!value) continue;
                        const re = new RegExp(
                          "\\[\\s*" + escRx(token) + "\\s*\\]",
                          "gi",
                        );
                        out = out.replace(re, value);
                      }
                      return out;
                    }

                    const currentBoxes = getBoxes() || [];
                    const updatedBoxes = (currentBoxes || []).map((b) => {
                      const nb = { ...b };

                      if (typeof nb.content === "string") {
                        nb.content = replaceTokensInString(nb.content);
                      }

                      if (Array.isArray(nb.tableRows)) {
                        nb.tableRows = nb.tableRows.map((row) =>
                          row.map((cell) =>
                            typeof cell === "string"
                              ? replaceTokensInString(cell)
                              : cell,
                          ),
                        );
                      }

                      const fname = String(
                        nb.fieldName || nb.name || "",
                      ).toLowerCase();
                      if (
                        /(^|[^a-z])(qr|qrcode|qr_code)([^a-z]|$)/i.test(
                          fname,
                        ) ||
                        /\bqr\b/i.test(fname)
                      ) {
                        if (placeholders.qrUrl) {
                          nb.imageUrl = placeholders.qrUrl;
                          nb.content = placeholders.qrUrl;
                        }
                      }
                      if (/(seal|stamp|companyseal|logo)/i.test(fname)) {
                        if (placeholders.sealUrl) {
                          nb.imageUrl = placeholders.sealUrl;
                          nb.content = placeholders.sealUrl;
                        }
                      }

                      nb.style = { ...(nb.style || {}) };

                      return nb;
                    });

                    try {
                      setTemplateBoxes(updatedBoxes.map((b) => ({ ...b })));
                    } catch (e) {
                      console.warn("setTemplateBoxes failed", e);
                    }
                    if (typeof setBodyBoxes === "function") {
                      try {
                        setBodyBoxes(updatedBoxes.map((b) => ({ ...b })));
                      } catch (e) {
                        console.warn("setBodyBoxes threw", e);
                      }
                    }

                    setShowFillModal(false);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
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
                if (fileInputWatermarkRef.current)
                  fileInputWatermarkRef.current.value = "";
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

      {typeof onBodyTypeChange === "function" && (
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
                onClick={() => onBodyTypeChange(b.key)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border:
                    bodyTypeProp === b.key
                      ? "2px solid #0f6679"
                      : "1px solid #e6e9eb",
                  background:
                    bodyTypeProp === b.key ? "#f0f7f9" : "transparent",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: bodyTypeProp === b.key ? "600" : "400",
                  color: bodyTypeProp === b.key ? "#0f6679" : "#333",
                }}
                type="button"
                title={`Create ${b.label}`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
      <FieldPropertiesPanel
        selectedFieldId={selectedFieldId}
        bodyBoxes={previewBoxes}
        setSelectedFieldId={setSelectedFieldId}
        updateSelectedBoxStyle={handleUpdateSelectedBoxStyle}
        onUploadImage={onUploadImage}
      />

      <div className={styles.previewArea}>
        <A4Preview
          headerUrl={headerUrl}
          footerUrl={footerUrl}
          watermarkUrl={watermarkUrlProp ?? watermarkUrl}
          watermarkProps={effectiveWatermarkProps}
          onWatermarkChange={handleWatermarkChangeFromPreview}
          editable={watermarkEditable || useWatermark}
          boxesEditable={!!showEditor}
          onBoxesChange={(nextBoxes) => handleBoxesChangeFromPreview(nextBoxes)}
          onSelectBox={(boxId) => {
            if (typeof onSelectBox === "function") onSelectBox(boxId);
            if (typeof setSelectedFieldId === "function")
              setSelectedFieldId(boxId);
            if (typeof setShowEditor === "function") setShowEditor(true);
          }}
          bodyBoxes={previewBoxes}
          width={Number(a4PreviewWidth) || 360}
          selectedBoxId={selectedFieldId}
          headerHeightPct={10}
          footerHeightPct={10}
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
