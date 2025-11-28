"use client";

import React, { useRef, useEffect } from "react";
import styles from "./UploadScan.module.css";

export default function A4Preview({
  headerUrl,
  footerUrl,
  watermarkUrl = null,
  watermarkProps = null,
  onWatermarkChange = null,
  editable = false,
  bodyBoxes = [],
  width = 420,
}) {
  const a4Ratio = 297 / 210;
  const w = Number(width) || 420;
  const h = Math.round(w * a4Ratio);

  const previewRef = useRef(null);
  const dragState = useRef(null);
  const resizeState = useRef(null);

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

  function startDrag(e) {
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

    dragState.current = {
      startLeft,
      startTop,
      startX: clientX,
      startY: clientY,
      rect,
    };

    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", onDrag, { passive: false });
    window.addEventListener("touchend", stopDrag);
  }

  function onDrag(ev) {
    if (!dragState.current) return;
    if (ev.type === "touchmove") ev.preventDefault();
    const clientX = ev.clientX ?? (ev.touches && ev.touches[0].clientX);
    const clientY = ev.clientY ?? (ev.touches && ev.touches[0].clientY);
    const { startLeft, startTop, startX, startY, rect } = dragState.current;

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

  function stopDrag() {
    dragState.current = null;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", stopDrag);
    window.removeEventListener("touchmove", onDrag);
    window.removeEventListener("touchend", stopDrag);
  }

  function startResize(e, corner) {
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

    resizeState.current = {
      corner,
      startX: clientX,
      startY: clientY,
      startLeft: currentLeft,
      startTop: currentTop,
      startW: currentW,
      startH: currentH,
      rect,
    };

    window.addEventListener("mousemove", onResize);
    window.addEventListener("mouseup", stopResize);
    window.addEventListener("touchmove", onResize, { passive: false });
    window.addEventListener("touchend", stopResize);
  }

  function onResize(ev) {
    if (!resizeState.current) return;
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
    } = resizeState.current;

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

  function stopResize() {
    resizeState.current = null;
    window.removeEventListener("mousemove", onResize);
    window.removeEventListener("mouseup", stopResize);
    window.removeEventListener("touchmove", onResize);
    window.removeEventListener("touchend", stopResize);
  }

  useEffect(() => {
    return () => {
      stopDrag();
      stopResize();
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

  const wrapperStyle = {
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

    const cellStyle = {
      padding: "4px 6px",
      border: "1px solid rgba(0,0,0,0.08)",
      fontSize: 11,
      whiteSpace: "normal",
      overflow: "hidden",
      textOverflow: "ellipsis",
      textAlign: align,
      verticalAlign: "top",
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
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}
        >
          <thead>
            <tr>
              {headers.map((h, idx) => (
                <th
                  key={idx}
                  style={{
                    ...cellStyle,
                    background: box.style?.headerBackground || "#f8fafc",
                    color: box.style?.headerColor || "#0f1724",
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
                      ...cellStyle,
                      background: box.style?.rowBackground || "#fff",
                      color: box.style?.rowColor || "#0f1724",
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

  return (
    <div className={styles.previewArea}>
      <div
        id="a4-preview"
        className={styles.a4}
        style={{ width: w + "px", height: h + "px" }}
        ref={previewRef}
      >
        <div className={styles.paperInner}>
          <div className={styles.headerSlot}>
            {headerUrl ? (
              <img
                src={headerUrl}
                alt="Header preview"
                className={styles.slotImg}
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
            {watermarkUrl && (editable || watermarkProps) ? (
              <div
                style={wrapperStyle}
                onMouseDown={startDrag}
                onTouchStart={startDrag}
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
                    src={watermarkUrl}
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
                        onMouseDown={(e) => startResize(e, "nw")}
                        onTouchStart={(e) => startResize(e, "nw")}
                        style={handleStyle("nw")}
                        title="Resize (NW)"
                      />
                      <div
                        data-resize="ne"
                        onMouseDown={(e) => startResize(e, "ne")}
                        onTouchStart={(e) => startResize(e, "ne")}
                        style={handleStyle("ne")}
                        title="Resize (NE)"
                      />
                      <div
                        data-resize="se"
                        onMouseDown={(e) => startResize(e, "se")}
                        onTouchStart={(e) => startResize(e, "se")}
                        style={handleStyle("se")}
                        title="Resize (SE)"
                      />
                      <div
                        data-resize="sw"
                        onMouseDown={(e) => startResize(e, "sw")}
                        onTouchStart={(e) => startResize(e, "sw")}
                        style={handleStyle("sw")}
                        title="Resize (SW)"
                      />
                    </>
                  )}
                </div>
              </div>
            ) : watermarkUrl ? (
              <img
                src={watermarkUrl}
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
                const isImage = box.type === "image" && box.imageUrl;
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

                return (
                  <div
                    key={box.id || Math.random()}
                    style={{
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
                      pointerEvents: "none",
                      userSelect: "none",
                      textAlign,
                    }}
                  >
                    {isImage ? (
                      <img
                        src={box.imageUrl}
                        alt={box.label || "image"}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                          pointerEvents: "none",
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
            {footerUrl ? (
              <img
                src={footerUrl}
                alt="Footer preview"
                className={styles.slotImg}
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
