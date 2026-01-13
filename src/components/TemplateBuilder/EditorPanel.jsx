import React, { useEffect } from "react";
import A4Preview from "./A4Preview";
import TemplateEditor from "./TemplateEditor";
import BasicTemplateEditor from "./BasicTemplateEditor.client";
import CustomTemplateEditor from "./CustomTemplateEditor.client";
import SharedTemplateControls from "./SharedTemplateControls";
import { PRESET_FIELDS, fieldsToBoxes } from "./templatePresets";

export default function EditorPanel(props) {
  const {
    styles,
    mode,
    generated,
    bodyType,
    setBodyType,
    bodyBoxes,
    setBodyBoxes,
    watermarkEnabled,
    setWatermarkEnabled,
    watermarkProps,
    handleWatermarkChange,
    viewingTemplate,
    editorRefs,
    handlers,
    previewUrls,
    extras,
    selectedFieldId = null,
    setSelectedFieldId = null,
    showEditor = false,
  } = props;

  const {
    editorWrapperRef,
    basicEditorRef,
    scratchEditorRef,
    headerImgRef,
    footerImgRef,
  } = editorRefs || {};

  const {
    toggleEditor,
    resetToPreset,
    handleCustomSave,
    onHeaderLoad,
    onFooterLoad,
  } = handlers || {};

  // Decide whether we will mount a dedicated editor component (BasicTemplateEditor or CustomTemplateEditor)
  // If so, don't render the inline A4Preview editor — otherwise user sees two editors.
  const shouldMountDedicatedEditor =
    (mode === "basic" && generated && !viewingTemplate) || mode === "scratch";

  // Show A4Preview only when not mounting a dedicated editor
  const showA4Preview =
    (mode === "basic" || mode === "scratch") && !shouldMountDedicatedEditor;

  return (
    <main className={styles.editorPanel}>
      <div
        className={styles.editorContainer}
        data-testid="template-editor-container"
        ref={editorWrapperRef}
      >
        {/* Only render A4Preview when no dedicated editor will be mounted */}
        {showA4Preview && (
          <A4Preview
            headerUrl={previewUrls?.headerUrl}
            footerUrl={previewUrls?.footerUrl}
            watermarkUrl={previewUrls?.watermarkUrl}
            watermarkProps={watermarkProps}
            bodyBoxes={bodyBoxes}
            // Only editable when A4Preview is the active editing surface
            editable={true}
            boxesEditable={true}
            onBoxesChange={setBodyBoxes}
            onWatermarkChange={handleWatermarkChange}
            selectedBoxId={selectedFieldId}
          />
        )}

        {/* When a generated template is opened for editing in "basic" mode, mount the corresponding editor */}
        {mode === "basic" && generated && !viewingTemplate && (
          <div style={{ position: "relative" }}>
            {generated._headerBlob && (
              <img
                ref={headerImgRef}
                src={generated._headerBlob}
                alt="Header"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onLoad={onHeaderLoad}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  width: "100%",
                  display: "block",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            )}

            <div style={{ paddingTop: 0, paddingBottom: 0 }}>
              {generated.html && generated.html.trim() ? (
                <BasicTemplateEditor
                  ref={basicEditorRef}
                  key={generated.id || generated.file || Math.random()}
                  initialHtml={generated.html}
                  initialJson={generated.grapesJson}
                  initialFields={PRESET_FIELDS[bodyType] || null}
                  baseUrl={"/commonTemplates/basic/"}
                  onSave={(payload) =>
                    handleCustomSave({
                      ...payload,
                      templateId: generated.id || generated.name,
                    })
                  }
                />
              ) : (
                <CustomTemplateEditor
                  ref={basicEditorRef}
                  key={generated.id || generated.name || Math.random()}
                  background={generated.thumbnail || generated.imageUrl || null}
                  initialBoxes={(function () {
                    try {
                      if (generated.layout) {
                        if (typeof generated.layout === "string")
                          return JSON.parse(generated.layout);
                        return generated.layout;
                      } else if (generated.layout_json) {
                        if (typeof generated.layout_json === "string")
                          return JSON.parse(generated.layout_json);
                        return generated.layout_json;
                      } else if (generated.initialBoxes) {
                        return generated.initialBoxes;
                      } else {
                        return (
                          extras.templateToBoxes(generated) ||
                          fieldsToBoxes(PRESET_FIELDS[bodyType] || [])
                        );
                      }
                    } catch (e) {
                      return (
                        extras.templateToBoxes(generated) ||
                        fieldsToBoxes(PRESET_FIELDS[bodyType] || [])
                      );
                    }
                  })()}
                  onSave={handleCustomSave}
                  canvasWidthPx={794}
                  watermarkUrl={previewUrls?.watermarkUrl}
                  watermarkProps={watermarkProps}
                  watermarkEditable={watermarkEnabled || showEditor}
                  onWatermarkChange={handleWatermarkChange}
                />
              )}
            </div>

            {generated._footerBlob && (
              <img
                ref={footerImgRef}
                src={generated._footerBlob}
                alt="Footer"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onLoad={onFooterLoad}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  width: "100%",
                  display: "block",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            )}
          </div>
        )}

        {/* When nothing generated yet in basic mode */}
        {!generated && mode === "basic" && (
          <div className={styles.placeholder}>
            Choose a template from the left to open it here.
          </div>
        )}

        {/* Scratch mode mounts the custom template editor (dedicated editor) */}
        {mode === "scratch" && (
          <CustomTemplateEditor
            ref={scratchEditorRef}
            key={"scratch-" + Date.now()}
            background={null}
            initialBoxes={fieldsToBoxes(PRESET_FIELDS[bodyType] || [])}
            initialBodyType={bodyType}
            onSave={handleCustomSave}
            canvasWidthPx={794}
            watermarkUrl={previewUrls?.watermarkUrl}
            watermarkProps={watermarkProps}
            watermarkEditable={watermarkEnabled || showEditor}
            onWatermarkChange={handleWatermarkChange}
          />
        )}
      </div>
    </main>
  );
}
