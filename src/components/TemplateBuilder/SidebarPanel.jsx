"use client";

import React from "react";
import UploadScan from "./UploadScan.client";
import ProtectedImg from "./ProtectedImg.client";
import SharedTemplateControls from "./SharedTemplateControls";

export default function SidebarPanel(props) {
  const {
    styles,
    mode,
    setAppMode,
    templateSource,
    setTemplateSource,
    SAVED_CATEGORIES = [],
    selectedSavedCategory,
    setSelectedSavedCategory,
    filteredSaved = [],
    filteredPublic = [],
    loading = false,
    query = "",
    setQuery = () => {},
    extra = {},
    uploadProps = {},
    onPreviewA4,
    onSaveTemplate,
    actions = {},
    activeArea = "body",
    onSetActiveArea,
  } = props;

  function Thumb({ t }) {
    if (!t) {
      return (
        <div className={styles.thumb}>
          <div className={styles.placeholderIcon}>T</div>
        </div>
      );
    }

    if (t.thumbnail) {
      return (
        <div className={styles.thumb}>
          {t.origin === "saved" ? (
            <ProtectedImg
              src={t.thumbnail}
              apiKey={process.env.NEXT_PUBLIC_API_KEY}
              alt={t.name}
              className={styles.thumbImg}
            />
          ) : (
            <img src={t.thumbnail} alt={t.name} className={styles.thumbImg} />
          )}
        </div>
      );
    }

    return (
      <div className={styles.thumb}>
        <div className={styles.placeholderIcon}>T</div>
      </div>
    );
  }

  return (
    <aside className={styles.leftPanel}>
      <h3 className={styles.heading}>Templates</h3>

      <div className={styles.modeButtons}>
        <button
          className={`${styles.modeBtn} ${mode === "upload" ? styles.active : ""}`}
          onClick={() => {
            setAppMode("upload");
            setTemplateSource(null);
          }}
        >
          Upload Scan
        </button>

        <button
          className={`${styles.modeBtn} ${mode === "scratch" ? styles.active : ""}`}
          onClick={() => {
            setAppMode("scratch");
            setTemplateSource(null);
          }}
        >
          Build from Scratch
        </button>

        <button
          className={`${styles.modeBtn} ${mode === "basic" ? styles.active : ""}`}
          onClick={() => {
            setAppMode("basic");
            setTemplateSource("public");
          }}
        >
          Basic Templates
        </button>

        <button
          className={`${styles.modeBtn} ${
            mode === "saved" || mode === "view" ? styles.active : ""
          }`}
          onClick={() => {
            setAppMode("saved");
            setTemplateSource("saved");
          }}
        >
          Saved Templates
        </button>
      </div>

      {/* ===== BASIC TEMPLATES ===== */}
      {mode === "basic" && templateSource !== "saved" && (
        <div className={styles.templatesWrap}>
          <h4 className={styles.sectionTitle}>Basic templates</h4>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates..."
            className={styles.search}
          />

          {loading && <div>Loading…</div>}
          {!loading && filteredPublic.length === 0 && <div>No templates</div>}

          <div className={styles.grid}>
            {filteredPublic.map((t) => (
              <button
                key={t.id}
                className={styles.card}
                onClick={() => extra.chooseBasic?.(t)}
              >
                <Thumb t={t} />
                <div>{t.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== SAVED ===== */}
      {(mode === "saved" || mode === "view") && (
        <div className={styles.templatesWrap}>
          <h4 className={styles.sectionTitle}>Saved templates</h4>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved templates..."
            className={styles.search}
          />

          <div className={styles.chips}>
            {SAVED_CATEGORIES.map((category) => (
              <button
                key={category.key}
                type="button"
                className={`${styles.chip} ${
                  selectedSavedCategory === category.key
                    ? styles.chipActive
                    : ""
                }`}
                onClick={() => setSelectedSavedCategory(category.key)}
              >
                {category.label}
              </button>
            ))}
          </div>

          {loading && <div className={styles.loading}>Loading…</div>}
          {!loading && filteredSaved.length === 0 && (
            <div className={styles.empty}>No saved templates found.</div>
          )}

          <div className={styles.grid}>
            {filteredSaved.map((t) => (
              <div key={t.id} className={styles.card}>
                <button
                  type="button"
                  className={styles.cardBody}
                  onClick={() => extra.openSavedTemplate?.(t)}
                >
                  <Thumb t={t} />
                  <div className={styles.meta}>
                    <div className={styles.title}>{t.name}</div>
                    {(t.category || t.origin) && (
                      <div className={styles.subtitle}>
                        {String(t.category || t.origin)}
                      </div>
                    )}
                  </div>
                </button>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    title={`Edit ${t.name}`}
                    aria-label={`Edit ${t.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      extra.editSavedTemplate?.(t);
                    }}
                  >
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <path
                        d="M4 14.5V17h2.5l7.54-7.54-2.5-2.5L4 14.5Zm11.04-7.04a1.12 1.12 0 0 0 0-1.58l-1.92-1.92a1.12 1.12 0 0 0-1.58 0l-1.4 1.4 3.5 3.5 1.4-1.4Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    title={`Delete ${t.name}`}
                    aria-label={`Delete ${t.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      extra.deleteSavedTemplate?.(t);
                    }}
                  >
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <path
                        d="M6 7h8m-7 0v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V7m-6 0V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CONTROLS ===== */}
      {mode === "scratch" && (
        <div className={styles.templatesWrap}>
          <h4 className={styles.sectionTitle}>Editor Controls</h4>

          {/* Area Selection */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                display: "block",
              }}
            >
              Active Area
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className={`${styles.modeBtn} ${activeArea === "header" ? styles.active : ""}`}
                onClick={() => onSetActiveArea && onSetActiveArea("header")}
                style={{ padding: "8px 12px", fontSize: 12 }}
              >
                Header
              </button>
              <button
                className={`${styles.modeBtn} ${activeArea === "footer" ? styles.active : ""}`}
                onClick={() => onSetActiveArea && onSetActiveArea("footer")}
                style={{ padding: "8px 12px", fontSize: 12 }}
              >
                Footer
              </button>
            </div>
          </div>

          {/* Editor Tools */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                display: "block",
              }}
            >
              Add Elements
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => actions.actionAddText && actions.actionAddText()}
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  background: "#f0f9ff",
                  border: "1px solid #0ea5e9",
                  color: "#0ea5e9",
                }}
              >
                Add Text
              </button>
              <button
                onClick={() =>
                  actions.actionAddTable && actions.actionAddTable()
                }
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  background: "#f0f9ff",
                  border: "1px solid #0ea5e9",
                  color: "#0ea5e9",
                }}
              >
                Add Table
              </button>
              <button
                onClick={() => actions.actionAddLogo && actions.actionAddLogo()}
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  background: "#f0f9ff",
                  border: "1px solid #0ea5e9",
                  color: "#0ea5e9",
                }}
              >
                Add Logo
              </button>
            </div>
          </div>

          {/* Watermark Controls */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                display: "block",
              }}
            >
              Watermark
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <input
                type="checkbox"
                checked={!!uploadProps.watermarkEnabled}
                onChange={(e) => {
                  const val = !!e.target.checked;
                  uploadProps.setWatermarkEnabled &&
                    uploadProps.setWatermarkEnabled(val);
                }}
              />
              Add watermark
            </label>

            {uploadProps.watermarkEnabled && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <input
                    ref={uploadProps.fileInputWatermarkRef}
                    type="file"
                    accept="image/*,image/svg+xml"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f) {
                        uploadProps.setWatermarkFile &&
                          uploadProps.setWatermarkFile(f);
                        uploadProps.setWatermarkEnabled &&
                          uploadProps.setWatermarkEnabled(true);
                      } else {
                        uploadProps.setWatermarkFile &&
                          uploadProps.setWatermarkFile(null);
                      }
                    }}
                    style={{ fontSize: 12, padding: "4px" }}
                  />

                  {uploadProps.watermarkFile ? (
                    <>
                      <div style={{ fontSize: 13 }}>
                        {uploadProps.watermarkFile.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          uploadProps.setWatermarkFile &&
                            uploadProps.setWatermarkFile(null);
                          uploadProps.setWatermarkEnabled &&
                            uploadProps.setWatermarkEnabled(false);
                          if (uploadProps.fileInputWatermarkRef?.current)
                            uploadProps.fileInputWatermarkRef.current.value =
                              "";
                        }}
                        style={{ fontSize: 12, padding: "4px 8px" }}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      Choose image
                    </div>
                  )}
                </div>

                {(uploadProps.previewWatermarkUrl ||
                  (uploadProps.watermarkFile
                    ? URL.createObjectURL(uploadProps.watermarkFile)
                    : null)) && (
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
                      value={uploadProps.watermarkProps?.opacity || 0.12}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        uploadProps.handleWatermarkChange &&
                          uploadProps.handleWatermarkChange({
                            ...uploadProps.watermarkProps,
                            opacity: v,
                          });
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        uploadProps.handleWatermarkChange &&
                        uploadProps.handleWatermarkChange({
                          ...uploadProps.watermarkProps,
                          wPct: "60%",
                          hPct: "60%",
                        })
                      }
                      style={{ fontSize: 12, padding: "4px 8px" }}
                    >
                      Reset size
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        uploadProps.handleWatermarkChange &&
                        uploadProps.handleWatermarkChange({
                          ...uploadProps.watermarkProps,
                          xPct: "50%",
                          yPct: "35%",
                        })
                      }
                      style={{ fontSize: 12, padding: "4px 8px" }}
                    >
                      Center
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() =>
                  actions.actionDeleteSelected && actions.actionDeleteSelected()
                }
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  background: "#fef2f2",
                  border: "1px solid #dc2626",
                  color: "#dc2626",
                }}
              >
                Delete Selected
              </button>
            </div>
          </div>

          {/* Preview and Save */}
          <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
            <button
              onClick={() => onPreviewA4 && onPreviewA4()}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                background: "white",
                color: "black",
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid #e5e7eb",
              }}
            >
              Preview on A4
            </button>
            <button
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
      )}

      {(mode === "upload" || mode === "basic") && (
        <SharedTemplateControls
          styles={styles}
          watermarkFile={uploadProps.watermarkFile}
          setWatermarkFile={uploadProps.setWatermarkFile}
          watermarkUrlProp={uploadProps.previewWatermarkUrl}
          useWatermark={uploadProps.watermarkEnabled}
          setUseWatermark={uploadProps.setWatermarkEnabled}
          watermarkProps={uploadProps.watermarkProps}
          onWatermarkChange={uploadProps.handleWatermarkChange}
          fileInputWatermarkRef={uploadProps.fileInputWatermarkRef}
          onPreviewA4={onPreviewA4}
          onSaveTemplate={onSaveTemplate}
          onPreviewChange={uploadProps.handlePreviewChange}
          headerFile={uploadProps.headerFile}
          setHeaderFile={uploadProps.setHeaderFile}
          footerFile={uploadProps.footerFile}
          setFooterFile={uploadProps.setFooterFile}
        />
      )}

      {mode === "upload" && (
        <div style={{ padding: 16, fontSize: 14, color: "#64748b" }}>
          Upload and configure header, footer, and watermark images above.
        </div>
      )}
    </aside>
  );
}
