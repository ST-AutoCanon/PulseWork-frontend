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
    DOC_CATEGORIES = [],
    selectedDocCategory,
    setSelectedDocCategory,
    query = "",
    setQuery = () => {},
    actions = {},
    uploadProps = {},
    extra = {},
    onPreviewA4,
    onSaveTemplate,
  } = props;

  function Thumb({ t }) {
    if (!t) return <div className={styles.placeholderIcon}>T</div>;
    if (t.thumbnail) {
      if (t.origin === "saved") {
        return (
          <ProtectedImg
            src={t.thumbnail}
            apiKey={process.env.NEXT_PUBLIC_API_KEY}
            alt={t.name}
            loading="lazy"
            className={styles.thumbImg}
          />
        );
      }
      return (
        <img
          src={t.thumbnail}
          alt={t.name}
          loading="lazy"
          className={styles.thumbImg}
        />
      );
    }
    return <div className={styles.placeholderIcon}>T</div>;
  }

  return (
    <aside className={styles.leftPanel}>
      <h3 className={styles.heading}>Templates</h3>

      <div className={styles.modeButtons}>
        <button
          className={`${styles.modeBtn} ${mode === "upload" ? styles.active : ""}`}
          onClick={() => {
            setAppMode && setAppMode("upload");
            setTemplateSource && setTemplateSource(null);
          }}
          aria-pressed={mode === "upload"}
          type="button"
        >
          Upload Scan
        </button>

        <button
          className={`${styles.modeBtn} ${mode === "scratch" ? styles.active : ""}`}
          onClick={() => {
            setAppMode && setAppMode("scratch");
            setTemplateSource && setTemplateSource(null);
          }}
          aria-pressed={mode === "scratch"}
          type="button"
        >
          Build from Scratch
        </button>

        <button
          className={`${styles.modeBtn} ${mode === "basic" ? styles.active : ""}`}
          onClick={() => {
            setAppMode && setAppMode("basic");
            setTemplateSource && setTemplateSource("public");
          }}
          aria-pressed={mode === "basic"}
          type="button"
        >
          Basic Templates
        </button>

        <button
          className={`${styles.modeBtn} ${
            mode === "saved" ||
            mode === "view" ||
            (mode === "basic" && templateSource === "saved")
              ? styles.active
              : ""
          }`}
          onClick={() => {
            setAppMode && setAppMode("saved");
            setTemplateSource && setTemplateSource("saved");
          }}
          aria-pressed={
            mode === "saved" ||
            mode === "view" ||
            (mode === "basic" && templateSource === "saved")
          }
          type="button"
        >
          Saved Templates
        </button>
      </div>

      {mode === "basic" && templateSource !== "saved" && (
        <div className={styles.templatesWrap}>
          <div className={styles.savedHeader}>
            <h4 className={styles.sectionTitle}>Basic templates</h4>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Choose a header+footer preset (body will be added from document
              body tools)
            </div>
          </div>

          <div className={styles.templatesList}>
            <div style={{ padding: "8px 12px" }}>
              <div className={styles.searchWrap}>
                <input
                  value={query || ""}
                  onChange={(e) => setQuery && setQuery(e.target.value)}
                  placeholder="Search templates..."
                  className={styles.search}
                  aria-label="Search templates"
                />
              </div>
            </div>

            {loading && <div className={styles.loading}>Loading…</div>}

            {!loading && (!filteredPublic || filteredPublic.length === 0) && (
              <div className={styles.empty}>No templates found</div>
            )}

            <div className={styles.grid}>
              {(filteredPublic || []).map((t) => (
                <button
                  key={t.id || t.name || Math.random()}
                  className={styles.card}
                  onClick={() => {
                    if (extra && typeof extra.chooseBasic === "function") {
                      extra.chooseBasic(t);
                    } else if (
                      extra &&
                      typeof extra.openPublicTemplate === "function"
                    ) {
                      extra.openPublicTemplate(t);
                    } else {
                      console.warn(
                        "chooseBasic/openPublicTemplate not provided to SidebarPanel",
                        t,
                        extra,
                      );
                    }
                  }}
                  title={t.name}
                  aria-label={`Choose ${t.name}`}
                  type="button"
                >
                  <div className={styles.thumb}>
                    <Thumb t={t} />
                  </div>

                  <div className={styles.meta}>
                    <div className={styles.title}>{t.name || t.id}</div>
                    <div className={styles.subtitle}>
                      {t.description || t.template_type || ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {(mode === "saved" ||
        mode === "view" ||
        (mode === "basic" && templateSource === "saved")) && (
        <div className={styles.templatesWrap}>
          <div className={styles.savedHeader}>
            <h4 className={styles.sectionTitle}>Saved templates</h4>
            <div className={styles.savedControls}>
              <div
                className={styles.smallChips}
                role="tablist"
                aria-label="Saved template categories"
              >
                {SAVED_CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() =>
                      setSelectedSavedCategory &&
                      setSelectedSavedCategory(c.key)
                    }
                    className={`${styles.chipSmall} ${
                      selectedSavedCategory === c.key ? styles.chipActive : ""
                    }`}
                    role="tab"
                    aria-selected={selectedSavedCategory === c.key}
                    type="button"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.templatesList}>
            {loading && <div className={styles.loading}>Loading…</div>}

            {!loading && (!filteredSaved || filteredSaved.length === 0) && (
              <div className={styles.empty}>No saved templates</div>
            )}

            <div className={styles.grid}>
              {(filteredSaved || []).map((t) => {
                const key = t.id || t.name || Math.random();
                const openFn =
                  extra && typeof extra.openSavedTemplate === "function"
                    ? () => extra.openSavedTemplate(t)
                    : () => console.warn("openSavedTemplate not provided", t);

                const editFn =
                  extra && typeof extra.editSavedTemplate === "function"
                    ? (entry) => extra.editSavedTemplate(entry)
                    : (entry) =>
                        console.warn("editSavedTemplate not provided", entry);

                const deleteFn =
                  extra && typeof extra.deleteSavedTemplate === "function"
                    ? (entry) => extra.deleteSavedTemplate(entry)
                    : (entry) =>
                        console.warn("deleteSavedTemplate not provided", entry);

                return (
                  <div
                    key={key}
                    className={styles.card}
                    role="button"
                    tabIndex={0}
                    onClick={openFn}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openFn();
                      }
                    }}
                    title={`Open ${t.name}`}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div className={styles.thumb} aria-hidden>
                      <Thumb t={t} />
                    </div>

                    <div
                      className={styles.meta}
                      style={{ flex: "1 1 auto", minWidth: 0 }}
                    >
                      <div
                        className={styles.title}
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.name || t.id}
                      </div>
                      <div
                        className={styles.subtitle}
                        style={{ fontSize: 12, color: "#6b7280" }}
                      >
                        {t.template_type || t.category || ""}
                      </div>
                    </div>

                    <div
                      className={styles.cardActions || ""}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginLeft: 12,
                        flexShrink: 0,
                      }}
                      aria-hidden={false}
                    >
                      <button
                        type="button"
                        className={styles.iconBtn || ""}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          editFn(t);
                        }}
                        title={`Edit ${t.name || t.id}`}
                        aria-label={`Edit ${t.name || t.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 34,
                          height: 34,
                          padding: 6,
                          borderRadius: 8,
                          border: "1px solid #e6e9eb",
                          background: "#fff",
                          cursor: "pointer",
                          color: "#0f6679",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className={styles.iconBtnDanger || ""}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteFn(t);
                        }}
                        title={`Delete ${t.name || t.id}`}
                        aria-label={`Delete ${t.name || t.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 34,
                          height: 34,
                          padding: 6,
                          borderRadius: 8,
                          border: "1px solid #fee2e2",
                          background: "#fff",
                          cursor: "pointer",
                          color: "#ef4444",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zm3.5-9h1v7h-1v-7zm4 0h1v7h-1v-7zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className={styles.toolsSection}>
        {mode === "upload" && (
          <div className={styles.toolsIntro}>
            <div className={styles.toolsIntroTitle}>Upload tools</div>
            <div className={styles.toolsIntroDesc}>
              Use the controls to pick header/footer images and preview A4.
            </div>
          </div>
        )}

        {mode === "scratch" && uploadProps && (
          <div style={{ marginBottom: 12 }}>
            <div className={styles.toolsTitle}>Insert into</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {["header", "footer"].map((a) => {
                const isActive = uploadProps && uploadProps.activeArea === a;
                return (
                  <button
                    key={a}
                    onClick={() =>
                      uploadProps.setActiveArea && uploadProps.setActiveArea(a)
                    }
                    type="button"
                    aria-pressed={isActive}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: isActive
                        ? "2px solid #0f6679"
                        : "1px solid #e6e9eb",
                      background: isActive ? "#f0f7f9" : "transparent",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#0f6679" : "#333",
                      minWidth: 64,
                      textAlign: "center",
                    }}
                  >
                    {a[0].toUpperCase() + a.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode === "scratch" && (
          <div className={styles.editorTools}>
            <div className={styles.toolsTitle}>Editor tools</div>
            <div className={styles.toolButtons}>
              <button
                className={styles.modeBtn}
                onClick={actions.actionAddText}
                type="button"
              >
                + Text
              </button>
              <button
                className={styles.modeBtn}
                onClick={actions.actionAddField}
                type="button"
              >
                + Field
              </button>
              <button
                className={styles.modeBtn}
                onClick={actions.actionAddLogo}
                type="button"
              >
                + Logo
              </button>
              <button
                className={styles.modeBtn}
                onClick={actions.actionAddTable}
                type="button"
              >
                + Table
              </button>

              <button
                className={styles.modeBtn}
                onClick={actions.actionDeleteSelected}
                type="button"
              >
                Delete
              </button>
              <button
                className={styles.modeBtn}
                onClick={() =>
                  actions.openSavePrompt && actions.openSavePrompt()
                }
                title="Save template (asks for a name)"
                type="button"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {(mode === "basic" || mode === "scratch") && uploadProps && (
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
          bodyType={uploadProps.bodyType}
          onBodyTypeChange={uploadProps.setBodyType}
          showEditor={uploadProps.showEditor}
          onSetActiveArea={uploadProps.setActiveArea}
          activeArea={uploadProps.activeArea}
          showInsertControls={mode === "basic"}
          onPreviewA4={onPreviewA4}
          onSaveTemplate={onSaveTemplate}
        />
      )}

      {mode === "upload" && (
        <UploadScan
          orgId={uploadProps.orgId}
          backendUrl={process.env.NEXT_PUBLIC_BACKEND_URL}
          apiKey={process.env.NEXT_PUBLIC_API_KEY}
          onPreviewChange={uploadProps.handlePreviewChange}
          onSaved={uploadProps.handleUploadSaved}
          a4PreviewWidth={420}
          initialHeaderUrl={uploadProps.previewHeaderUrl}
          initialFooterUrl={uploadProps.previewFooterUrl}
          controlsOnly={true}
          bodyType={uploadProps.bodyType}
          onBodyTypeChange={(bt) => uploadProps.setBodyType(bt)}
          bodyBoxes={uploadProps.bodyBoxes}
          setBodyBoxes={uploadProps.setBodyBoxes}
          showEditor={uploadProps.showEditor}
          setShowEditor={uploadProps.setShowEditor}
          watermarkUrl={uploadProps.previewWatermarkUrl}
          watermarkProps={uploadProps.watermarkProps}
          onWatermarkChange={uploadProps.handleWatermarkChange}
          watermarkEditable={
            uploadProps.watermarkEnabled || uploadProps.showEditor
          }
          useWatermarkInitial={uploadProps.watermarkEnabled}
          onSelectBox={uploadProps.setSelectedFieldId}
        />
      )}
    </aside>
  );
}
