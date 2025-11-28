"use client";

import React, { useEffect, useRef, useState } from "react";

export default function TemplateEditor({ boxes = [], onChange, width = 420 }) {
  const a4Ratio = 297 / 210;
  const w = Number(width) || 420;
  const h = Math.round(w * a4Ratio);

  const [localBoxes, setLocalBoxes] = useState([]);
  const [activeBoxId, setActiveBoxId] = useState(null);
  const editorRef = useRef(null);
  const dragState = useRef(null);

  const prevBoxesJson = useRef(null);
  useEffect(() => {
    const incomingJson = JSON.stringify(boxes || []);
    if (prevBoxesJson.current !== incomingJson) {
      setLocalBoxes(JSON.parse(JSON.stringify(boxes || [])));
      prevBoxesJson.current = incomingJson;
    }
  }, [boxes]);

  const pctToPx = (pct, size) =>
    (Number(String(pct).replace("%", "")) / 100) * size;
  const pxToPct = (px, size) => `${(px / size) * 100}%`;

  function startDrag(e, box) {
    try {
      if (e.target && e.target.closest && e.target.closest("[data-no-drag]")) {
        return;
      }
    } catch (err) {}

    if (e.type === "mousedown" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = editorRef.current.getBoundingClientRect();
    const mouseX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const mouseY = e.clientY ?? (e.touches && e.touches[0].clientY);

    const boxLeft = pctToPx(box.xPct || "0%", rect.width);
    const boxTop = pctToPx(box.yPct || "0%", rect.height);
    const boxW = pctToPx(box.wPct || "0%", rect.width);
    const boxH = pctToPx(box.hPct || "0%", rect.height);

    dragState.current = {
      startMouseX: mouseX,
      startMouseY: mouseY,
      startLeft: boxLeft,
      startTop: boxTop,
      boxId: box.id,
      rect,
      boxW,
      boxH,
    };

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag, { passive: false });
    document.addEventListener("touchend", stopDrag);
  }

  function onDrag(evt) {
    if (!dragState.current) return;
    if (evt.type === "touchmove") evt.preventDefault();

    const {
      startMouseX,
      startMouseY,
      startLeft,
      startTop,
      boxId,
      rect,
      boxW,
      boxH,
    } = dragState.current;
    const clientX = evt.clientX ?? (evt.touches && evt.touches[0].clientX);
    const clientY = evt.clientY ?? (evt.touches && evt.touches[0].clientY);
    const dx = clientX - startMouseX;
    const dy = clientY - startMouseY;
    let newLeft = startLeft + dx;
    let newTop = startTop + dy;

    newLeft = Math.max(
      0,
      Math.min(newLeft, Math.max(0, rect.width - (boxW || 0)))
    );
    newTop = Math.max(
      0,
      Math.min(newTop, Math.max(0, rect.height - (boxH || 0)))
    );

    setLocalBoxes((prev) =>
      prev.map((b) =>
        b.id === boxId
          ? {
              ...b,
              xPct: pxToPct(newLeft, rect.width),
              yPct: pxToPct(newTop, rect.height),
            }
          : b
      )
    );
  }

  function stopDrag() {
    if (!dragState.current) return;
    const updated = JSON.parse(JSON.stringify(localBoxes));
    dragState.current = null;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);
    if (typeof onChange === "function") onChange(updated);
  }

  function changeStyle(boxId, prop, value) {
    setLocalBoxes((prev) => {
      const next = prev.map((b) =>
        b.id === boxId
          ? { ...b, style: { ...(b.style || {}), [prop]: value } }
          : b
      );
      if (typeof onChange === "function")
        onChange(JSON.parse(JSON.stringify(next)));
      return next;
    });
  }

  function renderTablePreview(box, s) {
    const cellAlign = s.textAlign || "left";
    return (
      <div
        style={{
          marginTop: 6,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${s.borderColor || "#7e7e7e"}`,
            background: s.headerBackground || "#0f1724",
            color: s.headerColor || "#fff",
            padding: "4px 6px",
            fontSize: 11,
            gap: 4,
          }}
        >
          {(box.tableHeaders || []).map((h, i) => (
            <div
              key={i}
              style={{
                flex: i === 1 ? 3 : 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: cellAlign,
              }}
            >
              {h}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, fontSize: 11 }}>
          {new Array(2).fill(0).map((_, rIndex) => (
            <div key={rIndex} style={{ display: "flex", width: "100%" }}>
              {(box.tableHeaders || []).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: i === 1 ? 3 : 1,
                    padding: "2px 6px",
                    borderRight:
                      i < (box.tableHeaders || []).length - 1
                        ? `1px solid ${s.borderColor || "#ececec"}`
                        : "none",
                    background: s.rowBackground || "#fff",
                    color: s.rowColor || "#0f1724",
                    fontSize: 11,
                    textAlign: cellAlign,
                    whiteSpace: "normal",
                  }}
                >
                  {i === 0 ? rIndex + 1 : "..."}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: w,
        height: h,
        border: "1px solid #e2e8f0",
        position: "relative",
        background: "#ffffff",
        overflow: "hidden",
      }}
      ref={editorRef}
      aria-label="Template editor"
      onClick={() => setActiveBoxId(null)}
    >
      {localBoxes.map((box) => {
        const s = box.style || {};
        const isTable = box.fieldType === "table";
        const isImage = box.type === "image" && box.imageUrl;
        const isLabel =
          !!box.isLabel || (s.background && s.background !== "transparent");

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
            key={box.id}
            onMouseDown={(e) => startDrag(e, box)}
            onTouchStart={(e) => startDrag(e, box)}
            onClick={(e) => {
              e.stopPropagation();
              setActiveBoxId((id) => (id === box.id ? null : box.id));
            }}
            style={{
              position: "absolute",
              left: box.xPct || "5%",
              top: box.yPct || "5%",
              width: box.wPct || "90%",
              height: box.hPct || "8%",
              boxSizing: "border-box",
              border: isTable
                ? `1px solid ${s.borderColor || "#7e7e7e"}`
                : "1px dashed rgba(2,6,23,0.08)",
              background: s.background || "transparent",
              color: s.color || "#0f1724",
              display: "flex",
              flexDirection: "column",
              cursor: "move",
              padding: padding,
              userSelect: "none",
              alignItems: "stretch",
              justifyContent: isLabel ? "center" : justifyContent,
              textAlign,
            }}
          >
            {isLabel ? (
              <div
                style={{
                  width: "100%",
                  fontWeight: s.fontWeight || 700,
                  fontSize: s.fontSize || 12,
                  color: s.color || "#fff",
                  textAlign,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.2,
                }}
              >
                {box.content}
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    textAlign,
                    width: "100%",
                  }}
                >
                  {box.label}
                </div>

                {isTable ? (
                  <div
                    style={{ width: "100%", height: "100%", overflow: "auto" }}
                  >
                    {renderTablePreview(box, s)}
                  </div>
                ) : isImage ? (
                  <img
                    src={box.imageUrl}
                    alt={box.label || "image"}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      color: s.color || "#0f1724",
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
              </>
            )}

            {activeBoxId === box.id && (
              <div
                data-no-drag="true"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  right: -2,
                  top: "100%",
                  marginTop: 6,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  padding: 8,
                  zIndex: 50,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                  minWidth: 220,
                }}
              >
                <label style={{ fontSize: 12 }}>Bg</label>
                <input
                  data-no-drag="true"
                  type="color"
                  value={(s && s.background) || "#ffffff"}
                  onChange={(e) =>
                    changeStyle(box.id, "background", e.target.value)
                  }
                />

                <label style={{ fontSize: 12 }}>Txt</label>
                <input
                  data-no-drag="true"
                  type="color"
                  value={(s && s.color) || "#0f1724"}
                  onChange={(e) => changeStyle(box.id, "color", e.target.value)}
                />

                <label style={{ fontSize: 12 }}>Pad</label>
                <input
                  data-no-drag="true"
                  type="range"
                  min={0}
                  max={24}
                  value={s.padding ?? 6}
                  onChange={(e) =>
                    changeStyle(box.id, "padding", Number(e.target.value))
                  }
                />

                <label style={{ fontSize: 12 }}>Align</label>
                <select
                  data-no-drag="true"
                  value={s.textAlign || "left"}
                  onChange={(e) =>
                    changeStyle(box.id, "textAlign", e.target.value)
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>

                {isTable && (
                  <>
                    <label style={{ fontSize: 12 }}>Hdr</label>
                    <input
                      data-no-drag="true"
                      type="color"
                      value={(s && s.headerBackground) || "#0f1724"}
                      onChange={(e) =>
                        changeStyle(box.id, "headerBackground", e.target.value)
                      }
                    />
                    <label style={{ fontSize: 12 }}>HdrTxt</label>
                    <input
                      data-no-drag="true"
                      type="color"
                      value={(s && s.headerColor) || "#ffffff"}
                      onChange={(e) =>
                        changeStyle(box.id, "headerColor", e.target.value)
                      }
                    />
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
