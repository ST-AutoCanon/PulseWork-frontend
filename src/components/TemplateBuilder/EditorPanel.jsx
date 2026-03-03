"use client";

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
    headerHeightPct = 10,
    footerHeightPct = 10,
    editorCanvasWidth = 794,
    activeArea = "header",
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

  const shouldMountDedicatedEditor =
    (mode === "basic" && generated && !viewingTemplate) || mode === "scratch";

  const hasBodyBoxes = Array.isArray(bodyBoxes) && bodyBoxes.length > 0;
  const showA4Preview =
    !shouldMountDedicatedEditor &&
    (mode === "scratch" ||
      (mode === "basic" && (Boolean(generated) || hasBodyBoxes)));

  const CANVAS_WIDTH = editorCanvasWidth || 794;
  const A4_RATIO = 297 / 210;
  const canvasHeightPx = Math.round(CANVAS_WIDTH * A4_RATIO);

  const headerPx = Math.round(
    ((Number(headerHeightPct) || 10) / 100) * canvasHeightPx,
  );
  const footerPx = Math.round(
    ((Number(footerHeightPct) || 10) / 100) * canvasHeightPx,
  );

  return (
    <main className={styles.editorPanel} key={`editor-root-${mode}`}>
      <div
        className={styles.editorContainer}
        data-testid="template-editor-container"
        ref={editorWrapperRef}
      >
        {showA4Preview && (
          <A4Preview
            headerUrl={previewUrls?.previewHeaderUrl}
            footerUrl={previewUrls?.previewFooterUrl}
            watermarkUrl={previewUrls?.previewWatermarkUrl}
            watermarkProps={watermarkProps}
            bodyBoxes={bodyBoxes}
            editable={true}
            boxesEditable={true}
            onBoxesChange={setBodyBoxes}
            onWatermarkChange={handleWatermarkChange}
            selectedBoxId={selectedFieldId}
            headerHeightPct={headerHeightPct}
            footerHeightPct={footerHeightPct}
            width={CANVAS_WIDTH}
          />
        )}

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
                  key={`basic-${mode}-${generated?.id || generated?.file || "generated"}`}
                  onBoxesChange={setBodyBoxes}
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
                  canvasWidthPx={CANVAS_WIDTH}
                  watermarkUrl={previewUrls?.previewWatermarkUrl}
                  watermarkProps={watermarkProps}
                  watermarkEditable={watermarkEnabled || showEditor}
                  onWatermarkChange={handleWatermarkChange}
                  initialHeaderHeightPx={headerPx}
                  initialFooterHeightPx={footerPx}
                  onUploadImage={extras?.onUploadImage}
                  selectedFieldId={selectedFieldId}
                  onSelectField={(fid) =>
                    setSelectedFieldId && setSelectedFieldId(fid)
                  }
                  onUpdateFieldStyle={(fid, styleDelta) => {}}
                  onUpdateFieldContent={(fid, content) => {}}
                />
              ) : (
                <CustomTemplateEditor
                  ref={basicEditorRef}
                  key={`basic-custom-${mode}-${generated?.id || generated?.name || "generated"}`}
                  onBoxesChange={setBodyBoxes}
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
                  initialBoxesAreBodyRelative={true}
                  onSave={handleCustomSave}
                  onUploadImage={extras?.onUploadImage}
                  canvasWidthPx={CANVAS_WIDTH}
                  watermarkUrl={previewUrls?.previewWatermarkUrl}
                  watermarkProps={watermarkProps}
                  watermarkEditable={watermarkEnabled || showEditor}
                  onWatermarkChange={handleWatermarkChange}
                  headerHeightPct={headerHeightPct}
                  footerHeightPct={footerHeightPct}
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

        {mode === "scratch" && (
          <div style={{ position: "relative" }}>
            {previewUrls?.previewHeaderUrl && (
              <img
                ref={headerImgRef}
                src={previewUrls.previewHeaderUrl}
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

            <CustomTemplateEditor
              ref={scratchEditorRef}
              initialActiveArea={activeArea}
              key={`scratch-${mode}`}
              onBoxesChange={setBodyBoxes}
              background={null}
              initialBoxes={fieldsToBoxes(PRESET_FIELDS[bodyType] || [])}
              initialBoxesAreBodyRelative={true}
              initialBodyType={bodyType}
              onSave={handleCustomSave}
              onUploadImage={extras?.onUploadImage}
              canvasWidthPx={794}
              watermarkUrl={previewUrls?.previewWatermarkUrl}
              watermarkProps={watermarkProps}
              watermarkEditable={watermarkEnabled || showEditor}
              onWatermarkChange={handleWatermarkChange}
              headerHeightPct={headerHeightPct}
              footerHeightPct={footerHeightPct}
            />

            {previewUrls?.previewFooterUrl && (
              <img
                ref={footerImgRef}
                src={previewUrls.previewFooterUrl}
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
      </div>
    </main>
  );
}
