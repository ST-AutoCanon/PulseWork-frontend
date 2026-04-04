"use client";

import React from "react";
import A4Preview from "./A4Preview";

export default function EditorPanel(props) {
  const {
    styles,
    mode,
    previewUrls,
    watermarkProps,
    handleWatermarkChange,
    viewingTemplate,
    editorRefs,
    editableHeader = false,
    editableFooter = false,
  } = props;

  const { editorWrapperRef } = editorRefs || {};

  return (
    <main className={styles.editorPanel}>
      <div className={styles.editorContainer} ref={editorWrapperRef}>
        <A4Preview
          headerUrl={
            mode === "view"
              ? viewingTemplate?.headerUrl
              : previewUrls?.previewHeaderUrl
          }
          footerUrl={
            mode === "view"
              ? viewingTemplate?.footerUrl
              : previewUrls?.previewFooterUrl
          }
          watermarkUrl={
            mode === "view"
              ? viewingTemplate?.watermarkUrl
              : previewUrls?.previewWatermarkUrl
          }
          watermarkProps={watermarkProps}
          onWatermarkChange={handleWatermarkChange}
          editable={true}
          editableHeader={editableHeader}
          editableFooter={editableFooter}
        />
      </div>
    </main>
  );
}
