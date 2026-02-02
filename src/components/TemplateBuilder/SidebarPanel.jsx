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
    SAVED_CATEGORIES,
    selectedSavedCategory,
    setSelectedSavedCategory,
    filteredSaved,
    filteredPublic,
    loading,
    DOC_CATEGORIES,
    selectedDocCategory,
    setSelectedDocCategory,
    query,
    setQuery,
    actions,
    uploadProps,
    extra = {},
  } = props;

  return (
    <aside className={styles.leftPanel}>
      <h3 className={styles.heading}>Templates</h3>

      <div className={styles.modeButtons}>
        <button
          className={`${styles.modeBtn} ${
            mode === "upload" ? styles.active : ""
          }`}
          onClick={() => setAppMode("upload")}
          aria-pressed={mode === "upload"}
        >
          Upload Scan
        </button>
        <button
          className={`${styles.modeBtn} ${
            mode === "scratch" ? styles.active : ""
          }`}
          onClick={() => setAppMode("scratch")}
          aria-pressed={mode === "scratch"}
        >
          Build from Scratch
        </button>
        <button
          className={`${styles.modeBtn} ${mode === "basic" ? styles.active : ""}`}
          onClick={() => setAppMode("basic")}
          aria-pressed={mode === "basic"}
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
            setAppMode("saved");
            setTemplateSource("saved");
          }}
        >
          Saved Templates
        </button>
      </div>

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
                    onClick={() => setSelectedSavedCategory(c.key)}
                    className={`${styles.chipSmall} ${
                      selectedSavedCategory === c.key ? styles.chipActive : ""
                    }`}
                    role="tab"
                    aria-selected={selectedSavedCategory === c.key}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.templatesList}>
            {loading && <div className={styles.loading}>Loading…</div>}
            {!loading && filteredSaved.length === 0 && (
              <div className={styles.empty}>No saved templates</div>
            )}
            <div className={styles.grid}>
              {filteredSaved.map((t) => (
                <button
                  key={t.id || t.name || Math.random()}
                  className={styles.card}
                  onClick={() => {
                    if (
                      extra &&
                      typeof extra.openSavedTemplate === "function"
                    ) {
                      extra.openSavedTemplate(t);
                    } else {
                      console.warn(
                        "openSavedTemplate not provided to SidebarPanel",
                        extra,
                      );
                    }
                  }}
                  title={t.name}
                  aria-label={`Choose ${t.name}`}
                >
                  <div className={styles.thumb}>
                    {t.thumbnail ? (
                      t.origin === "saved" ? (
                        <ProtectedImg
                          src={t.thumbnail}
                          apiKey={process.env.NEXT_PUBLIC_API_KEY}
                          alt={t.name}
                          loading="lazy"
                          className={styles.thumbImg}
                        />
                      ) : (
                        <img
                          src={t.thumbnail}
                          alt={t.name}
                          loading="lazy"
                          className={styles.thumbImg}
                        />
                      )
                    ) : (
                      <div className={styles.placeholderIcon}>T</div>
                    )}
                  </div>
                  <div className={styles.meta}>
                    <div className={styles.title}>{t.name || t.id}</div>
                    <div className={styles.subtitle}>
                      {t.template_type || t.category || ""}
                    </div>
                  </div>
                </button>
              ))}
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

        {(mode === "basic" || mode === "scratch") && (
          <div className={styles.editorTools}>
            <div className={styles.toolsTitle}>Editor tools</div>

            <div className={styles.toolButtons}>
              <button
                className={styles.modeBtn}
                onClick={actions.actionAddText}
              >
                + Text
              </button>
              <button
                className={styles.modeBtn}
                onClick={actions.actionAddField}
              >
                + Field
              </button>
              <button
                className={styles.modeBtn}
                onClick={actions.actionAddLogo}
              >
                + Logo
              </button>
              <button
                className={styles.modeBtn}
                onClick={actions.actionAddTable}
              >
                + Table
              </button>

              <button
                className={styles.modeBtn}
                onClick={actions.actionDeleteSelected}
              >
                Delete
              </button>
              <button
                className={styles.modeBtn}
                onClick={() =>
                  actions.openSavePrompt && actions.openSavePrompt()
                }
                title="Save template (asks for a name)"
              >
                Save
              </button>
            </div>

            {mode === "basic" && (
              <div className={styles.toolsSearchWrap}>
                <div className={styles.searchWrap}>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search templates..."
                    className={styles.search}
                    aria-label="Search templates"
                  />
                </div>

                <div
                  className={styles.chips}
                  role="tablist"
                  aria-label="Template categories"
                >
                  {DOC_CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setSelectedDocCategory(c.key)}
                      className={`${styles.chip} ${
                        selectedDocCategory === c.key ? styles.chipActive : ""
                      }`}
                      role="tab"
                      aria-selected={selectedDocCategory === c.key}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {(mode === "basic" || mode === "scratch") && (
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
