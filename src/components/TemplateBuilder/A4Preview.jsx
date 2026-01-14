"use client";

import React, { useRef, useEffect, useState } from "react";
import styles from "./UploadScan.module.css";

export default function A4Preview({
  headerUrl,
  footerUrl,
  watermarkUrl = null,
  watermarkProps = null,
  onWatermarkChange = null,
  editable = false,
  boxesEditable = false,
  bodyBoxes = [],
  onBoxesChange = null,
  onSelectBox = null,
  width = 420,
  selectedBoxId = null,
  pageStyle = { background: "transparent" },
}) {
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
    /\/$/,
    ""
  );

  const a4Ratio = 297 / 210;
  const w = Number(width) || 420;
  const h = Math.round(w * a4Ratio);

  const previewRef = useRef(null);
  const [hoveredBoxId, setHoveredBoxId] = useState(null);

  const pctToPx = (pct, size) =>
    (Number(String(pct).replace("%", "")) / 100) * size;
  const pxToPct = (px, size) => `${(px / size) * 100}%`;

  const wm = {
    xPct: (watermarkProps && watermarkProps.xPct) || "50%",
    yPct: (watermarkProps && watermarkProps.yPct) || "50%",
    wPct: (watermarkProps && watermarkProps.wPct) || "60%",
    hPct: (watermarkProps && watermarkProps.hPct) || "60%",
    opacity:
      watermarkProps && typeof watermarkProps.opacity === "number"
        ? watermarkProps.opacity
        : 0.12,
  };

  function resolveImgSrc(src) {
    if (!src || typeof src !== "string") return src || null;
    const s = src.trim();

    if (
      s.startsWith("blob:") ||
      s.startsWith("data:") ||
      /^https?:\/\//i.test(s)
    ) {
      return s;
    }

    if (s.startsWith("/api/")) {
      if (BACKEND_URL) return `${BACKEND_URL}${s}`;
      console.warn(
        "A4Preview: /api/ url present but NEXT_PUBLIC_BACKEND_URL is not set:",
        s
      );
      return s;
    }

    return s;
  }

  const watermarkDragState = useRef(null);
  const watermarkResizeState = useRef(null);
  function startWatermarkDrag(e) {
    if (!editable || !previewRef.current) return;
    if (e.target?.dataset?.resize) return;
    e.preventDefault();
    const rect = previewRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

    const startLeft =
      pctToPx(wm.xPct, rect.width) - pctToPx(wm.wPct, rect.width) / 2;
    const startTop =
      pctToPx(wm.yPct, rect.height) - pctToPx(wm.hPct, rect.height) / 2;

    watermarkDragState.current = {
      startLeft,
      startTop,
      startX: clientX,
      startY: clientY,
      rect,
    };

    window.addEventListener("mousemove", watermarkOnDrag);
    window.addEventListener("mouseup", watermarkStopDrag);
    window.addEventListener("touchmove", watermarkOnDrag, { passive: false });
    window.addEventListener("touchend", watermarkStopDrag);
  }
  function watermarkOnDrag(ev) {
    if (!watermarkDragState.current) return;
    if (ev.type === "touchmove") ev.preventDefault();
    const clientX = ev.clientX ?? (ev.touches && ev.touches[0].clientX);
    const clientY = ev.clientY ?? (ev.touches && ev.touches[0].clientY);
    const { startLeft, startTop, startX, startY, rect } =
      watermarkDragState.current;

    const dx = clientX - startX;
    const dy = clientY - startY;
    let newLeft = startLeft + dx;
    let newTop = startTop + dy;

    const wPx = pctToPx(wm.wPct, rect.width);
    const hPx = pctToPx(wm.hPct, rect.height);
    const minLeft = 0;
    const minTop = 0;
    const maxLeft = Math.max(0, rect.width - wPx);
    const maxTop = Math.max(0, rect.height - hPx);

    newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
    newTop = Math.max(minTop, Math.min(newTop, maxTop));

    const centerXpx = newLeft + wPx / 2;
    const centerYpx = newTop + hPx / 2;
    const next = {
      xPct: pxToPct(centerXpx, rect.width),
      yPct: pxToPct(centerYpx, rect.height),
      wPct: wm.wPct,
      hPct: wm.hPct,
      opacity: wm.opacity,
    };
    if (typeof onWatermarkChange === "function") onWatermarkChange(next);
  }
  function watermarkStopDrag() {
    watermarkDragState.current = null;
    window.removeEventListener("mousemove", watermarkOnDrag);
    window.removeEventListener("mouseup", watermarkStopDrag);
    window.removeEventListener("touchmove", watermarkOnDrag);
    window.removeEventListener("touchend", watermarkStopDrag);
  }

  function startWatermarkResize(e, corner) {
    if (!editable || !previewRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = previewRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

    const currentLeft =
      pctToPx(wm.xPct, rect.width) - pctToPx(wm.wPct, rect.width) / 2;
    const currentTop =
      pctToPx(wm.yPct, rect.height) - pctToPx(wm.hPct, rect.height) / 2;
    const currentW = pctToPx(wm.wPct, rect.width);
    const currentH = pctToPx(wm.hPct, rect.height);

    watermarkResizeState.current = {
      corner,
      startX: clientX,
      startY: clientY,
      startLeft: currentLeft,
      startTop: currentTop,
      startW: currentW,
      startH: currentH,
      rect,
    };

    window.addEventListener("mousemove", watermarkOnResize);
    window.addEventListener("mouseup", watermarkStopResize);
    window.addEventListener("touchmove", watermarkOnResize, { passive: false });
    window.addEventListener("touchend", watermarkStopResize);
  }
  function watermarkOnResize(ev) {
    if (!watermarkResizeState.current) return;
    if (ev.type === "touchmove") ev.preventDefault();
    const clientX = ev.clientX ?? (ev.touches && ev.touches[0].clientX);
    const clientY = ev.clientY ?? (ev.touches && ev.touches[0].clientY);

    const {
      corner,
      startX,
      startY,
      startLeft,
      startTop,
      startW,
      startH,
      rect,
    } = watermarkResizeState.current;

    const dx = clientX - startX;
    const dy = clientY - startY;

    let newLeft = startLeft;
    let newTop = startTop;
    let newW = startW;
    let newH = startH;

    if (corner === "se") {
      newW = startW + dx;
      newH = startH + dy;
    } else if (corner === "ne") {
      newW = startW + dx;
      newH = startH - dy;
      newTop = startTop + dy;
    } else if (corner === "sw") {
      newW = startW - dx;
      newH = startH + dy;
      newLeft = startLeft + dx;
    } else if (corner === "nw") {
      newW = startW - dx;
      newH = startH - dy;
      newLeft = startLeft + dx;
      newTop = startTop + dy;
    }

    const minPx = 20;
    newW = Math.max(minPx, newW);
    newH = Math.max(minPx, newH);

    if (newLeft < 0) {
      newW += newLeft;
      newLeft = 0;
    }
    if (newTop < 0) {
      newH += newTop;
      newTop = 0;
    }
    newW = Math.min(newW, rect.width - newLeft);
    newH = Math.min(newH, rect.height - newTop);

    const centerXpx = newLeft + newW / 2;
    const centerYpx = newTop + newH / 2;

    const next = {
      xPct: pxToPct(centerXpx, rect.width),
      yPct: pxToPct(centerYpx, rect.height),
      wPct: pxToPct(newW, rect.width),
      hPct: pxToPct(newH, rect.height),
      opacity: wm.opacity,
    };

    if (typeof onWatermarkChange === "function") onWatermarkChange(next);
  }
  function watermarkStopResize() {
    watermarkResizeState.current = null;
    window.removeEventListener("mousemove", watermarkOnResize);
    window.removeEventListener("mouseup", watermarkStopResize);
    window.removeEventListener("touchmove", watermarkOnResize);
    window.removeEventListener("touchend", watermarkStopResize);
  }

  const boxDragState = useRef(null);
  const boxResizeState = useRef(null);

  function startBoxDrag(e, box) {
    if (!boxesEditable || !previewRef.current) return;
    if (e.target?.dataset?.resize) return;
    e.preventDefault();
    e.stopPropagation();

    if (typeof onSelectBox === "function") onSelectBox(box.id);

    const rect = previewRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

    const startLeft = pctToPx(box.xPct, rect.width);
    const startTop = pctToPx(box.yPct, rect.height);

    boxDragState.current = {
      id: box.id,
      startLeft,
      startTop,
      startX: clientX,
      startY: clientY,
      rect,
      box,
    };

    window.addEventListener("mousemove", onBoxDrag);
    window.addEventListener("mouseup", stopBoxDrag);
    window.addEventListener("touchmove", onBoxDrag, { passive: false });
    window.addEventListener("touchend", stopBoxDrag);
  }
  function onBoxDrag(ev) {
    if (!boxDragState.current) return;
    if (ev.type === "touchmove") ev.preventDefault();
    const clientX = ev.clientX ?? (ev.touches && ev.touches[0].clientX);
    const clientY = ev.clientY ?? (ev.touches && ev.touches[0].clientY);
    const { startLeft, startTop, startX, startY, rect, id, box } =
      boxDragState.current;

    const dx = clientX - startX;
    const dy = clientY - startY;
    let newLeft = startLeft + dx;
    let newTop = startTop + dy;

    const wPx = pctToPx(box.wPct || "10%", rect.width);
    const hPx = pctToPx(box.hPct || "6%", rect.height);

    newLeft = Math.max(0, Math.min(newLeft, rect.width - wPx));
    newTop = Math.max(0, Math.min(newTop, rect.height - hPx));

    const nextBox = {
      ...box,
      xPct: pxToPct(newLeft, rect.width),
      yPct: pxToPct(newTop, rect.height),
    };

    if (typeof onBoxesChange === "function") {
      const next = bodyBoxes.map((b) => (b.id === id ? nextBox : b));
      onBoxesChange(next);
    }
  }
  function stopBoxDrag() {
    boxDragState.current = null;
    window.removeEventListener("mousemove", onBoxDrag);
    window.removeEventListener("mouseup", stopBoxDrag);
    window.removeEventListener("touchmove", onBoxDrag);
    window.removeEventListener("touchend", stopBoxDrag);
  }

  function startBoxResize(e, box, corner) {
    if (!boxesEditable || !previewRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = previewRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

    const currentLeft = pctToPx(box.xPct, rect.width);
    const currentTop = pctToPx(box.yPct, rect.height);
    const currentW = pctToPx(box.wPct, rect.width);
    const currentH = pctToPx(box.hPct, rect.height);

    boxResizeState.current = {
      id: box.id,
      corner,
      startX: clientX,
      startY: clientY,
      startLeft: currentLeft,
      startTop: currentTop,
      startW: currentW,
      startH: currentH,
      rect,
      box,
    };

    window.addEventListener("mousemove", onBoxResize);
    window.addEventListener("mouseup", stopBoxResize);
    window.addEventListener("touchmove", onBoxResize, { passive: false });
    window.addEventListener("touchend", stopBoxResize);
  }
  function onBoxResize(ev) {
    if (!boxResizeState.current) return;
    if (ev.type === "touchmove") ev.preventDefault();
    const clientX = ev.clientX ?? (ev.touches && ev.touches[0].clientX);
    const clientY = ev.clientY ?? (ev.touches && ev.touches[0].clientY);

    const {
      corner,
      startX,
      startY,
      startLeft,
      startTop,
      startW,
      startH,
      rect,
      id,
      box,
    } = boxResizeState.current;

    const dx = clientX - startX;
    const dy = clientY - startY;

    let newLeft = startLeft;
    let newTop = startTop;
    let newW = startW;
    let newH = startH;

    if (corner === "se") {
      newW = startW + dx;
      newH = startH + dy;
    } else if (corner === "ne") {
      newW = startW + dx;
      newH = startH - dy;
      newTop = startTop + dy;
    } else if (corner === "sw") {
      newW = startW - dx;
      newH = startH + dy;
      newLeft = startLeft + dx;
    } else if (corner === "nw") {
      newW = startW - dx;
      newH = startH - dy;
      newLeft = startLeft + dx;
      newTop = startTop + dy;
    }

    const minPx = 20;
    newW = Math.max(minPx, newW);
    newH = Math.max(minPx, newH);

    if (newLeft < 0) {
      newW += newLeft;
      newLeft = 0;
    }
    if (newTop < 0) {
      newH += newTop;
      newTop = 0;
    }
    newW = Math.min(newW, rect.width - newLeft);
    newH = Math.min(newH, rect.height - newTop);

    const nextBox = {
      ...box,
      xPct: pxToPct(newLeft, rect.width),
      yPct: pxToPct(newTop, rect.height),
      wPct: pxToPct(newW, rect.width),
      hPct: pxToPct(newH, rect.height),
    };

    if (typeof onBoxesChange === "function") {
      const next = bodyBoxes.map((b) => (b.id === id ? nextBox : b));
      onBoxesChange(next);
    }
  }
  function stopBoxResize() {
    boxResizeState.current = null;
    window.removeEventListener("mousemove", onBoxResize);
    window.removeEventListener("mouseup", stopBoxResize);
    window.removeEventListener("touchmove", onBoxResize);
    window.removeEventListener("touchend", stopBoxResize);
  }

  useEffect(() => {
    return () => {
      watermarkStopDrag();
      watermarkStopResize();
      stopBoxDrag();
      stopBoxResize();
    };
  }, []);

  const handleStyle = (pos) => {
    const base = {
      position: "absolute",
      width: 12,
      height: 12,
      background: "#fff",
      border: "1px solid #0f1724",
      borderRadius: 2,
      zIndex: 60,
      touchAction: "none",
    };
    if (pos === "nw")
      return { ...base, left: -6, top: -6, cursor: "nwse-resize" };
    if (pos === "ne")
      return { ...base, right: -6, top: -6, cursor: "nesw-resize" };
    if (pos === "se")
      return { ...base, right: -6, bottom: -6, cursor: "nwse-resize" };
    if (pos === "sw")
      return { ...base, left: -6, bottom: -6, cursor: "nesw-resize" };
    return base;
  };

  const wrapperStyleForWatermark = {
    position: "absolute",
    left: wm.xPct,
    top: wm.yPct,
    width: wm.wPct,
    height: wm.hPct,
    transform: "translate(-50%, -50%)",
    pointerEvents: editable ? "auto" : "none",
    display: watermarkUrl ? "block" : "none",
    zIndex: 55,
    userSelect: "none",
  };

  const renderTableBox = (box) => {
    const headers = Array.isArray(box.tableHeaders) ? box.tableHeaders : [];
    const rows = Array.isArray(box.tableRows) ? box.tableRows : [];

    const align = box.style?.textAlign || "left";

    const borderColor = box.style?.borderColor || "rgba(0,0,0,0.08)";
    const headerBackground = box.style?.headerBackground || "#f8fafc";
    const headerColor = box.style?.headerColor || "#0f1724";
    const rowBackground = box.style?.rowBackground || "transparent";
    const rowColor = box.style?.rowColor || "#0f1724";

    const cellBase = {
      padding: "6px 8px",
      fontSize: box.style?.fontSize || 11,
      whiteSpace: "normal",
      overflow: "hidden",
      textOverflow: "ellipsis",
      textAlign: align,
      verticalAlign: "top",
      border: `1px solid ${borderColor}`,
    };

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: box.style?.fontSize || 11,
            border: `1px solid ${borderColor}`,
          }}
        >
          <thead>
            <tr>
              {headers.map((h, idx) => (
                <th
                  key={idx}
                  style={{
                    ...cellBase,
                    background: headerBackground,
                    color: headerColor,
                    textAlign: "left",
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td
                    key={ci}
                    style={{
                      ...cellBase,
                      background:
                        rowBackground === "transparent"
                          ? "transparent"
                          : rowBackground,
                      color: rowColor,
                    }}
                  >
                    {String(r[ci] ?? "").trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const resolvedHeader = resolveImgSrc(headerUrl);
  const resolvedFooter = resolveImgSrc(footerUrl);
  const resolvedWatermark = resolveImgSrc(watermarkUrl);

  return (
    <div className={styles.previewArea}>
      <div
        id="a4-preview"
        className={styles.a4}
        style={{ width: w + "px", height: h + "px" }}
        ref={previewRef}
      >
        <div
          className={styles.paperInner}
          style={{
            background:
              pageStyle &&
              pageStyle.background &&
              pageStyle.background !== "transparent"
                ? pageStyle.background
                : "transparent",
          }}
        >
          <div className={styles.headerSlot}>
            {resolvedHeader ? (
              <img
                src={resolvedHeader}
                alt="Header preview"
                className={styles.slotImg}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div className={styles.slotPlaceholder}>
                Header will appear here
              </div>
            )}
          </div>

          <div
            className={styles.bodySlot}
            aria-hidden="true"
            style={{ position: "relative", overflow: "hidden" }}
          >
            {resolvedWatermark && (editable || watermarkProps) ? (
              <div
                style={wrapperStyleForWatermark}
                onMouseDown={startWatermarkDrag}
                onTouchStart={startWatermarkDrag}
                role={editable ? "button" : undefined}
                aria-label="Watermark"
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <img
                    src={resolvedWatermark}
                    alt="Watermark"
                    draggable={false}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      opacity: wm.opacity,
                      pointerEvents: "none",
                      display: "block",
                      userSelect: "none",
                    }}
                  />
                  {editable && (
                    <>
                      <div
                        data-resize="nw"
                        onMouseDown={(e) => startWatermarkResize(e, "nw")}
                        onTouchStart={(e) => startWatermarkResize(e, "nw")}
                        style={handleStyle("nw")}
                        title="Resize (NW)"
                      />
                      <div
                        data-resize="ne"
                        onMouseDown={(e) => startWatermarkResize(e, "ne")}
                        onTouchStart={(e) => startWatermarkResize(e, "ne")}
                        style={handleStyle("ne")}
                        title="Resize (NE)"
                      />
                      <div
                        data-resize="se"
                        onMouseDown={(e) => startWatermarkResize(e, "se")}
                        onTouchStart={(e) => startWatermarkResize(e, "se")}
                        style={handleStyle("se")}
                        title="Resize (SE)"
                      />
                      <div
                        data-resize="sw"
                        onMouseDown={(e) => startWatermarkResize(e, "sw")}
                        onTouchStart={(e) => startWatermarkResize(e, "sw")}
                        style={handleStyle("sw")}
                        title="Resize (SW)"
                      />
                    </>
                  )}
                </div>
              </div>
            ) : resolvedWatermark ? (
              <img
                src={resolvedWatermark}
                alt="Watermark preview"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  maxWidth: "60%",
                  maxHeight: "60%",
                  opacity: 0.12,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            ) : null}

            {Array.isArray(bodyBoxes) &&
              bodyBoxes.map((box) => {
                const s = box.style || {};
                const isTable = box.type === "table" && box.tableHeaders;
                const candidateImage = box.imageUrl || box.content || null;
                const resolvedBoxImg = resolveImgSrc(candidateImage);

                const isImage = box.type === "image" && resolvedBoxImg;
                const isLabel =
                  !!box.isLabel ||
                  (s.background && s.background !== "transparent");

                const bg = s.background || "transparent";
                const textColor =
                  s.color || (bg && bg !== "transparent" ? "#fff" : "#0f1724");

                const padding = s.padding ?? 6;
                const textAlign = (s.textAlign || "left").toLowerCase();

                const justifyContent =
                  textAlign === "center"
                    ? "center"
                    : textAlign === "right"
                    ? "flex-end"
                    : "flex-start";

                const isSelected = selectedBoxId && box.id === selectedBoxId;
                const showHandles =
                  boxesEditable && (isSelected || hoveredBoxId === box.id);

                const boxWrapperStyle = {
                  position: "absolute",
                  left: box.xPct || "5%",
                  top: box.yPct || "5%",
                  width: box.wPct || "90%",
                  height: box.hPct || "10%",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: isLabel ? "center" : "flex-start",
                  justifyContent,
                  padding: padding,
                  overflow: "hidden",
                  background: bg !== "transparent" ? bg : "transparent",
                  pointerEvents: "auto",
                  userSelect: boxesEditable ? "auto" : "none",
                  textAlign,
                  zIndex: 50,
                  outline: isSelected ? "2px solid #0f6679" : undefined,
                  outlineOffset: isSelected ? 0 : undefined,
                };

                return (
                  <div
                    key={box.id || Math.random()}
                    style={boxWrapperStyle}
                    onMouseDown={(e) => {
                      if (typeof onSelectBox === "function")
                        onSelectBox(box.id);
                      if (!boxesEditable) return;
                      startBoxDrag(e, box);
                    }}
                    onTouchStart={(e) => {
                      if (typeof onSelectBox === "function")
                        onSelectBox(box.id);
                      if (!boxesEditable) return;
                      startBoxDrag(e, box);
                    }}
                    onMouseEnter={() => setHoveredBoxId(box.id)}
                    onMouseLeave={() =>
                      setHoveredBoxId((cur) => (cur === box.id ? null : cur))
                    }
                    title={box.label || box.content || ""}
                    role={boxesEditable ? "button" : undefined}
                    aria-label={box.label || "field"}
                  >
                    {showHandles && (
                      <>
                        <div
                          data-resize="nw"
                          onMouseDown={(e) => startBoxResize(e, box, "nw")}
                          onTouchStart={(e) => startBoxResize(e, box, "nw")}
                          style={handleStyle("nw")}
                          title="Resize (NW)"
                        />
                        <div
                          data-resize="ne"
                          onMouseDown={(e) => startBoxResize(e, box, "ne")}
                          onTouchStart={(e) => startBoxResize(e, box, "ne")}
                          style={handleStyle("ne")}
                          title="Resize (NE)"
                        />
                        <div
                          data-resize="se"
                          onMouseDown={(e) => startBoxResize(e, box, "se")}
                          onTouchStart={(e) => startBoxResize(e, box, "se")}
                          style={handleStyle("se")}
                          title="Resize (SE)"
                        />
                        <div
                          data-resize="sw"
                          onMouseDown={(e) => startBoxResize(e, box, "sw")}
                          onTouchStart={(e) => startBoxResize(e, box, "sw")}
                          style={handleStyle("sw")}
                          title="Resize (SW)"
                        />
                      </>
                    )}

                    {isImage ? (
                      <img
                        src={resolvedBoxImg}
                        alt={box.label || "image"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          pointerEvents: "none",
                          display: "block",
                          userSelect: "none",
                        }}
                        onError={(e) => {
                          console.warn(
                            "A4Preview: image failed to load for box",
                            box.id,
                            resolvedBoxImg
                          );
                        }}
                      />
                    ) : isTable ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          overflow: "auto",
                        }}
                      >
                        {renderTableBox(box)}
                      </div>
                    ) : (
                      <div
                        style={{
                          color: textColor,
                          fontSize: s.fontSize || 11,
                          fontWeight: s.fontWeight || "normal",
                          textAlign,
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.2,
                          width: "100%",
                          overflow: "hidden",
                        }}
                      >
                        {box.content}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <div className={styles.footerSlot}>
            {resolvedFooter ? (
              <img
                src={resolvedFooter}
                alt="Footer preview"
                className={styles.slotImg}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div className={styles.slotPlaceholder}>
                Footer will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
