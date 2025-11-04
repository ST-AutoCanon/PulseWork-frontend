import React, { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { v4 as uuidv4 } from "uuid";
import "./CustomTemplateEditor.css";

export default function CustomTemplateEditor({
  initialBoxes = [],

  onUploadImage,
  canvasWidthPx = 1000,
}) {
  const containerRef = useRef(null);
  const innerCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const createdUrlsRef = useRef([]);

  const [boxes, setBoxes] = useState(initialBoxes || []);
  const [mode, setMode] = useState("select");
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editingTableMode, setEditingTableMode] = useState(null);
  const [canvasWidthActual, setCanvasWidthActual] = useState(canvasWidthPx);
  const [canvasHeightActual, setCanvasHeightActual] = useState(
    Math.round(canvasWidthPx * (297 / 210))
  );
  const [pageBackground, setPageBackground] = useState("#ffffff");

  const A4_RATIO = 297 / 210;

  const draggingRef = useRef(false);
  const dragEndedRef = useRef(null);
  const dragAllowMs = 300;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function recompute() {
      const rect = el.getBoundingClientRect();
      const available = Math.max(320, rect.width - 24);
      const w = Math.min(canvasWidthPx, Math.floor(available));
      const h = Math.round(w * A4_RATIO);
      setCanvasWidthActual(w);
      setCanvasHeightActual(h);
    }

    recompute();
    const obs = new ResizeObserver(() => recompute());
    obs.observe(el);
    if (el.parentElement) obs.observe(el.parentElement);
    window.addEventListener("resize", recompute);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [canvasWidthPx]);

  useEffect(() => {
    if (initialBoxes && initialBoxes.length) setBoxes(initialBoxes);

    return () => {
      createdUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch (e) {}
      });
      createdUrlsRef.current = [];
    };
  }, []);

  function pxToPct(xPx, yPx, wPx, hPx) {
    const el = innerCanvasRef.current;
    if (!el) return {};
    const rect = el.getBoundingClientRect();
    const left = (xPx / rect.width) * 100;
    const top = (yPx / rect.height) * 100;
    const w = (wPx / rect.width) * 100;
    const h = (hPx / rect.height) * 100;
    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${w}%`,
      height: `${h}%`,
    };
  }

  function pctToPx(leftPct, topPct, wPct, hPct) {
    const el = innerCanvasRef.current;
    if (!el) return {};
    const rect = el.getBoundingClientRect();
    const left = (parseFloat(leftPct || "0") / 100) * rect.width;
    const top = (parseFloat(topPct || "0") / 100) * rect.height;
    const w = (parseFloat(wPct || "0") / 100) * rect.width;
    const h = (parseFloat(hPct || "0") / 100) * rect.height;
    return { left, top, width: w, height: h };
  }

  function addBox(type = "text") {
    const wPct = 20;
    const hPct = 8;
    const leftPct = 40;
    const topPct = 40;
    const id = uuidv4();

    if (type === "table") {
      const rows = 3;
      const cols = 3;
      const data = Array.from({ length: rows }).map(() =>
        Array.from({ length: cols }).map(() => "")
      );
      const box = {
        id,
        type: "table",
        content: "",
        table: {
          rows,
          cols,
          data,
          header: true,
          border: true,
          cellPadding: 6,
          cellBackground: "transparent",
        },
        xPct: `${leftPct}%`,
        yPct: `${topPct}%`,
        wPct: `${wPct}%`,
        hPct: `${hPct}%`,
        style: {
          fontFamily: "Arial, sans-serif",
          fontSize: 12,
          color: "#0f1724",
          background: "transparent",
          fontWeight: "400",
          fontStyle: "normal",
          textAlign: "left",
        },
      };
      setBoxes((prev) => [...prev, box]);
      setSelectedId(id);
      return;
    }

    const box = {
      id,
      type,
      content:
        type === "text"
          ? "Editable text"
          : type === "placeholder"
          ? "[[FIELD_NAME]]"
          : "",
      xPct: `${leftPct}%`,
      yPct: `${topPct}%`,
      wPct: `${wPct}%`,
      hPct: `${hPct}%`,
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
        color: "#0f1724",
        background: "transparent",
        fontWeight: "400",
        fontStyle: "normal",
        textAlign: "left",
      },
    };
    setBoxes((prev) => [...prev, box]);
    setSelectedId(id);
    if (type === "text" || type === "placeholder") setEditingId(id);
  }

  function updateBox(id, patch) {
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function removeSelected() {
    if (!selectedId) return;
    setBoxes((prev) => prev.filter((b) => b.id !== selectedId));
    setSelectedId(null);
    if (editingId === selectedId) setEditingId(null);
    if (editingCell && editingCell.boxId === selectedId) setEditingCell(null);
    if (editingTableMode === selectedId) setEditingTableMode(null);
  }

  function saveTemplate() {
    const payload = {
      page: {
        format: "A4",
        orientation: "portrait",
        units: "mm",
        width: 210,
        height: 297,
        background: pageBackground,
      },
      boxes: boxes.map((b) => ({
        id: b.id,
        type: b.type,
        content: b.content,
        table: b.table || undefined,
        xPct: b.xPct,
        yPct: b.yPct,
        wPct: b.wPct,
        hPct: b.hPct,
        style: b.style || {},
      })),
      meta: { savedAt: new Date().toISOString() },
    };
    onSave(payload);
  }

  function handleDragStart(id) {
    draggingRef.current = true;
    setEditingId(null);
    dragEndedRef.current = null;
    setSelectedId(id);
  }

  function handleDragStop(id, e, d) {
    draggingRef.current = false;
    const { left, top } = pxToPct(d.x, d.y, 0, 0);
    updateBox(id, { xPct: left, yPct: top });
    dragEndedRef.current = { id, ts: Date.now() };
  }

  function handleResizeStop(id, e, direction, ref, delta, pos) {
    const wPx = ref.offsetWidth;
    const hPx = ref.offsetHeight;
    const leftPx = pos.x;
    const topPx = pos.y;
    const { left, top, width, height } = pxToPct(leftPx, topPx, wPx, hPx);
    updateBox(id, { xPct: left, yPct: top, wPct: width, hPct: height });
    dragEndedRef.current = { id, ts: Date.now() };
  }

  function openFilePickerForLogo() {
    if (!fileInputRef.current) {
      const el = document.createElement("input");
      el.type = "file";
      el.accept = "image/*";
      el.style.display = "none";
      el.onchange = async (ev) => {
        const f = ev.target.files?.[0];
        if (f) await handleFileSelected(f);
      };
      document.body.appendChild(el);
      fileInputRef.current = el;
    }
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }

  async function handleFileSelected(file) {
    let targetId = selectedId;
    if (!targetId) {
      const id = uuidv4();
      const box = {
        id,
        type: "logo",
        content: "",
        xPct: "40%",
        yPct: "40%",
        wPct: "20%",
        hPct: "12%",
        style: {},
      };
      setBoxes((prev) => [...prev, box]);
      targetId = id;
      setSelectedId(id);
    }

    try {
      if (onUploadImage && typeof onUploadImage === "function") {
        const url = await onUploadImage(file);
        if (url) {
          updateBox(targetId, { content: url, type: "logo" });
          return;
        }
      }
    } catch (err) {
      console.warn("onUploadImage failed:", err);
    }

    const obj = URL.createObjectURL(file);
    createdUrlsRef.current.push(obj);
    updateBox(targetId, { content: obj, type: "logo" });
  }

  function updateTableCell(boxId, r, c, value) {
    setBoxes((prev) =>
      prev.map((b) => {
        if (b.id !== boxId) return b;
        const table = b.table ? { ...b.table } : { rows: 0, cols: 0, data: [] };
        const data = table.data.map((row) => row.slice());
        data[r][c] = value;
        table.data = data;
        return { ...b, table };
      })
    );
  }

  function addTableRow(boxId) {
    setBoxes((prev) =>
      prev.map((b) => {
        if (b.id !== boxId) return b;
        const table = { ...b.table };
        table.rows = (table.rows || 0) + 1;
        const newRow = Array.from({ length: table.cols || 1 }).map(() => "");
        table.data = [...(table.data || []), newRow];
        return { ...b, table };
      })
    );
  }

  function removeTableRow(boxId) {
    setBoxes((prev) =>
      prev.map((b) => {
        if (b.id !== boxId) return b;
        const table = { ...b.table };
        if ((table.rows || 0) <= 1) return b;
        table.rows = (table.rows || 0) - 1;
        table.data = (table.data || []).slice(0, table.rows);
        return { ...b, table };
      })
    );
  }

  function addTableCol(boxId) {
    setBoxes((prev) =>
      prev.map((b) => {
        if (b.id !== boxId) return b;
        const table = { ...b.table };
        table.cols = (table.cols || 0) + 1;
        table.data = (table.data || []).map((row) => [...row, ""]);
        return { ...b, table };
      })
    );
  }

  function removeTableCol(boxId) {
    setBoxes((prev) =>
      prev.map((b) => {
        if (b.id !== boxId) return b;
        const table = { ...b.table };
        if ((table.cols || 0) <= 1) return b;
        table.cols = (table.cols || 0) - 1;
        table.data = (table.data || []).map((row) => row.slice(0, table.cols));
        return { ...b, table };
      })
    );
  }

  function TableCell({
    boxId,
    rIdx,
    cIdx,
    cellValue,
    isEditingCell,
    table,
    mode,
    editingTableMode,
    updateTableCell,
    setEditingCell,
  }) {
    const editingCellRef = useRef(null);

    useEffect(() => {
      if (
        editingCellRef.current &&
        isEditingCell &&
        isEditingCell.r === rIdx &&
        isEditingCell.c === cIdx
      ) {
        setTimeout(() => {
          try {
            editingCellRef.current.focus();
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editingCellRef.current);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          } catch (err) {}
        }, 0);
      }
    }, [isEditingCell, rIdx, cIdx]);

    const startEditing = (ev) => {
      ev.stopPropagation();
      if (mode === "preview") return;
      setEditingCell({ boxId, r: rIdx, c: cIdx });
    };

    const onBlur = (ev) => {
      const val = ev.target.textContent || "";
      updateTableCell(boxId, rIdx, cIdx, val);
      setEditingCell(null);
    };

    const borderStyle = table.border ? "1px solid rgba(0,0,0,0.12)" : "none";
    const cellBackground = table.cellBackground || "transparent";

    return (
      <td
        onDoubleClick={(ev) => {
          ev.stopPropagation();
          startEditing(ev);
        }}
        onClick={(ev) => {
          ev.stopPropagation();
          if (mode === "preview") return;
          if (editingTableMode === boxId) {
            startEditing(ev);
          }
        }}
        style={{
          border: borderStyle,
          padding: table.cellPadding || 6,
          verticalAlign: "top",
          textAlign: table.textAlign || "left",
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          background: cellBackground,
        }}
      >
        {isEditingCell &&
        isEditingCell.r === rIdx &&
        isEditingCell.c === cIdx ? (
          <div
            ref={editingCellRef}
            className="table-edit"
            contentEditable={true}
            suppressContentEditableWarning
            onBlur={onBlur}
            tabIndex={0}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{ minHeight: 16, outline: "none", cursor: "text" }}
          >
            {cellValue}
          </div>
        ) : (
          <div
            className="table-cell"
            style={{ minHeight: 16, pointerEvents: "auto", cursor: "text" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {cellValue}
          </div>
        )}
      </td>
    );
  }

  function BoxContent({ box }) {
    const isSelected = box.id === selectedId;
    const isEditing = editingId === box.id;
    const contentRef = useRef(null);

    const baseStyle = {
      width: "100%",
      height: "100%",
      outline: isSelected ? "2px dashed rgba(17,94,202,0.7)" : "none",
      padding: "6px",
      boxSizing: "border-box",
      cursor: mode === "select" ? "move" : "text",
      fontSize:
        box.style && box.style.fontSize ? `${box.style.fontSize}px` : "13px",
      color: box.style?.color || "#0f1724",
      background: box.style?.background || "transparent",
      fontFamily: box.style?.fontFamily || "Arial, sans-serif",
      fontWeight: box.style?.fontWeight || "400",
      fontStyle: box.style?.fontStyle || "normal",
      textAlign: box.style?.textAlign || "left",
      overflow: "hidden",
      userSelect: isEditing ? "text" : "auto",
      pointerEvents: "auto",
      whiteSpace: "pre-wrap",
    };

    useEffect(() => {
      if (isEditing && contentRef.current) {
        try {
          contentRef.current.textContent = box.content || "";
          contentRef.current.focus();
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(contentRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (err) {}
      }
    }, [isEditing, box.content]);

    if (box.type === "text" || box.type === "placeholder") {
      return (
        <div
          data-content-editable="true"
          ref={contentRef}
          contentEditable={isEditing && mode !== "preview"}
          suppressContentEditableWarning
          onBlur={() => {
            try {
              const final = contentRef.current
                ? contentRef.current.textContent
                : box.content;
              updateBox(box.id, { content: final });
            } catch (err) {}
            setEditingId(null);
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(box.id);
            if (!editingId) {
              const drag = dragEndedRef.current;
              const now = Date.now();
              if (!drag || now - drag.ts > dragAllowMs) {
                setTimeout(() => {
                  setEditingId(box.id);
                }, 0);
              }
            }
            dragEndedRef.current = null;
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setSelectedId(box.id);
            setEditingId(box.id);
          }}
          style={baseStyle}
          role="textbox"
          aria-label={box.type === "text" ? "Text box" : "Placeholder box"}
        >
          {!isEditing && (box.content || "")}
        </div>
      );
    }

    if (box.type === "logo") {
      const src = box.content || "";
      return (
        <div
          style={{
            ...baseStyle,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            background: box.style?.background || baseStyle.background,
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setSelectedId(box.id);
            openFilePickerForLogo();
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(box.id);
          }}
        >
          {src ? (
            <img
              src={src}
              alt="logo"
              style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
          ) : (
            <div>
              <div>Logo (double-click or use Upload)</div>
            </div>
          )}
        </div>
      );
    }

    if (box.type === "table") {
      const table = box.table || { rows: 0, cols: 0, data: [] };
      const isEditingCell =
        editingCell && editingCell.boxId === box.id ? editingCell : null;

      return (
        <div
          style={{
            ...baseStyle,
            overflow: "auto",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "stretch",
            background: box.style?.background || baseStyle.background,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(box.id);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setSelectedId(box.id);
          }}
        >
          <table
            style={{
              width: "100%",
              height: "100%",
              borderCollapse: table.border ? "collapse" : "separate",
              tableLayout: "fixed",
              fontFamily: box.style?.fontFamily || "Arial, sans-serif",
              fontSize: box.style?.fontSize
                ? `${box.style.fontSize}px`
                : undefined,
              color: box.style?.color || undefined,
            }}
          >
            <tbody>
              {(table.data || []).map((row, rIdx) => (
                <tr key={`r-${rIdx}`}>
                  {row.map((cell, cIdx) => {
                    return (
                      <TableCell
                        key={`c-${rIdx}-${cIdx}`}
                        boxId={box.id}
                        rIdx={rIdx}
                        cIdx={cIdx}
                        cellValue={cell}
                        isEditingCell={isEditingCell}
                        table={table}
                        mode={mode}
                        editingTableMode={editingTableMode}
                        updateTableCell={updateTableCell}
                        setEditingCell={setEditingCell}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return <div style={baseStyle}>{box.content}</div>;
  }

  const selectedBox = boxes.find((b) => b.id === selectedId) || null;

  function applyStyleProp(prop, value) {
    if (!selectedBox) return;
    const style = { ...(selectedBox.style || {}) };
    style[prop] = value;
    updateBox(selectedBox.id, { style });
  }
  function toggleBold() {
    if (!selectedBox) return;
    const cur = selectedBox.style?.fontWeight || "400";
    applyStyleProp("fontWeight", cur === "700" ? "400" : "700");
  }
  function toggleItalic() {
    if (!selectedBox) return;
    const cur = selectedBox.style?.fontStyle || "normal";
    applyStyleProp("fontStyle", cur === "italic" ? "normal" : "italic");
  }

  function startEditingSelected() {
    if (!selectedId) return;
    const box = boxes.find((b) => b.id === selectedId);
    if (!box) return;
    if (box.type === "text" || box.type === "placeholder") {
      setEditingId(box.id);
    }
  }

  return (
    <div
      className="cte-root"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div
        className="cte-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className={mode === "select" ? "active" : ""}
            onClick={() => {
              setMode("select");
              setEditingId(null);
            }}
          >
            Select/Move
          </button>
          <button
            className={mode === "preview" ? "active" : ""}
            onClick={() => setMode(mode === "preview" ? "select" : "preview")}
          >
            {mode === "preview" ? "Exit Preview" : "Preview"}
          </button>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              marginLeft: 12,
            }}
          >
            <div style={{ fontSize: 12 }}>Page BG</div>
            <input
              type="color"
              value={pageBackground}
              onChange={(e) => setPageBackground(e.target.value)}
              title="Set page background"
            />
            <button onClick={() => setPageBackground("transparent")}>
              Clear BG
            </button>
          </div>
        </div>
        <div>
          <button onClick={() => addBox("text")}>Add Text</button>
          <button onClick={() => addBox("placeholder")}>Add Field</button>
          <button
            onClick={() => {
              addBox("logo");
              setTimeout(() => openFilePickerForLogo(), 50);
            }}
          >
            Add Logo
          </button>
          <button
            onClick={startEditingSelected}
            disabled={
              !selectedBox ||
              !["text", "placeholder"].includes(selectedBox.type)
            }
            title="Edit selected box"
          >
            Edit
          </button>
          <button onClick={removeSelected} disabled={!selectedId}>
            Delete
          </button>
          <button onClick={saveTemplate}>Save</button>
          <button onClick={() => addBox("table")} style={{ marginLeft: 8 }}>
            Add Table
          </button>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          padding: "8px 12px",
          border: "1px solid #eee",
          borderRadius: 6,
        }}
      >
        {!selectedBox ? (
          <div style={{ color: "#6b7280" }}>
            Select a box to edit its properties.
          </div>
        ) : (
          <>
            <div style={{ minWidth: 140 }}>
              <div style={{ fontSize: 12 }}>Font</div>
              <select
                value={selectedBox.style?.fontFamily || "Arial, sans-serif"}
                onChange={(e) => applyStyleProp("fontFamily", e.target.value)}
              >
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
                <option value="'Times New Roman', serif">Times</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="'Montserrat', sans-serif">Montserrat</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12 }}>Size</div>
                <input
                  type="number"
                  value={selectedBox.style?.fontSize || 14}
                  onChange={(e) =>
                    applyStyleProp(
                      "fontSize",
                      parseInt(e.target.value || 14, 10)
                    )
                  }
                  style={{ width: 72 }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12 }}>Color</div>
                <input
                  type="color"
                  value={selectedBox.style?.color || "#0f1724"}
                  onChange={(e) => applyStyleProp("color", e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={toggleBold}>
                  {selectedBox.style?.fontWeight === "700" ? "Unbold" : "Bold"}
                </button>
                <button onClick={toggleItalic}>
                  {selectedBox.style?.fontStyle === "italic"
                    ? "Unitalic"
                    : "Italic"}
                </button>
              </div>
              <div>
                <div style={{ fontSize: 12 }}>Align</div>
                <select
                  value={selectedBox.style?.textAlign || "left"}
                  onChange={(e) => applyStyleProp("textAlign", e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12 }}>Background</div>
                <input
                  type="color"
                  value={selectedBox.style?.background || "#00000000"}
                  onChange={(e) => applyStyleProp("background", e.target.value)}
                />
              </div>
            </div>
            {selectedBox.type === "logo" && (
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <button onClick={() => openFilePickerForLogo()}>
                  Upload Logo
                </button>
                <button
                  onClick={() =>
                    updateBox(selectedBox.id, { content: "", type: "logo" })
                  }
                >
                  Clear
                </button>
              </div>
            )}
            {selectedBox.type === "table" && (
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, textAlign: "center" }}>
                  Rows: {selectedBox.table?.rows || 0}
                </div>
                <div style={{ fontSize: 12, textAlign: "center" }}>
                  Cols: {selectedBox.table?.cols || 0}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => addTableRow(selectedBox.id)}>
                    + Row
                  </button>
                  <button onClick={() => removeTableRow(selectedBox.id)}>
                    - Row
                  </button>
                  <button onClick={() => addTableCol(selectedBox.id)}>
                    + Col
                  </button>
                  <button onClick={() => removeTableCol(selectedBox.id)}>
                    - Col
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={!!selectedBox.table?.header}
                      onChange={(e) =>
                        updateBox(selectedBox.id, {
                          table: {
                            ...selectedBox.table,
                            header: e.target.checked,
                          },
                        })
                      }
                    />
                    Header
                  </label>
                  <label style={{ fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={!!selectedBox.table?.border}
                      onChange={(e) =>
                        updateBox(selectedBox.id, {
                          table: {
                            ...selectedBox.table,
                            border: e.target.checked,
                          },
                        })
                      }
                    />
                    Border
                  </label>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ fontSize: 12 }}>Cell BG</div>
                  <input
                    type="color"
                    value={selectedBox.table?.cellBackground || "#ffffff00"}
                    onChange={(e) =>
                      updateBox(selectedBox.id, {
                        table: {
                          ...selectedBox.table,
                          cellBackground: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={editingTableMode === selectedBox.id}
                      onChange={(e) =>
                        setEditingTableMode(
                          e.target.checked ? selectedBox.id : null
                        )
                      }
                    />
                    Edit Cells (single click)
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
        <div
          ref={containerRef}
          className="cte-canvas"
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            position: "relative",
            border: "1px solid #e5e7eb",
            background: pageBackground || "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            overflow: "auto",
            padding: 12,
          }}
          onMouseDown={(e) => {
            if (editingId) return;
            if (editingCell) return;
            const clickInsideBox =
              e.target &&
              e.target.closest &&
              !!e.target.closest("[data-box-id]");
            if (!clickInsideBox) setSelectedId(null);
          }}
        >
          <div
            ref={innerCanvasRef}
            className="template-inner"
            style={{
              position: "relative",
              width: `${canvasWidthActual}px`,
              height: `${canvasHeightActual}px`,
              boxSizing: "border-box",
              background: "white",
              margin: "0 auto",
              transformOrigin: "top left",
              overflow: "hidden",
            }}
          >
            {boxes.map((b) => {
              const px = pctToPx(b.xPct, b.yPct, b.wPct, b.hPct);
              const kWidth = px.width || Math.max(160, canvasWidthActual * 0.2);
              const kHeight =
                px.height || Math.max(40, canvasHeightActual * 0.08);
              const kX = px.left || 20;
              const kY = px.top || 20;
              const isSelected = selectedId === b.id;
              const isEditing = editingId === b.id;
              const disableDragForCell =
                editingCell && editingCell.boxId === b.id ? true : false;

              return (
                <Rnd
                  data-box-id={b.id}
                  key={b.id}
                  size={{ width: kWidth, height: kHeight }}
                  position={{ x: kX, y: kY }}
                  bounds="parent"
                  onDragStart={() => handleDragStart(b.id)}
                  onDragStop={(e, d) => handleDragStop(b.id, e, d)}
                  onResizeStop={(e, dir, ref, delta, pos) =>
                    handleResizeStop(b.id, e, dir, ref, delta, pos)
                  }
                  enableResizing={mode !== "preview"}
                  disableDragging={
                    mode === "preview" || isEditing || disableDragForCell
                  }
                  // <<< ADD this prop so react-draggable will not start drag on these elements:
                  cancel={".table-edit, .table-cell, [contenteditable]"}
                  className={`cte-box ${isSelected ? "selected" : ""}`}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelectedId(b.id);
                    dragEndedRef.current = null;
                    setTimeout(() => {
                      if (
                        !editingId &&
                        (b.type === "text" || b.type === "placeholder")
                      ) {
                        setEditingId(b.id);
                      }
                    }, 0);
                  }}
                  style={{
                    zIndex: isSelected ? 100 : 20,
                    background: isSelected
                      ? "rgba(255,255,255,0.06)"
                      : undefined,
                  }}
                  minWidth={40}
                  minHeight={24}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                    }}
                    data-box-id={b.id}
                    onMouseDown={(e) => {
                      if (editingCell && editingCell.boxId === b.id) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    {isSelected &&
                      !isEditing &&
                      (b.type === "text" || b.type === "placeholder") && (
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setEditingId(b.id);
                          }}
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            zIndex: 300,
                            padding: "2px 6px",
                            fontSize: 12,
                            cursor: "pointer",
                            borderRadius: 4,
                            border: "1px solid rgba(0,0,0,0.08)",
                            background: "#fff",
                          }}
                          title="Edit"
                        >
                          Edit
                        </button>
                      )}
                    <BoxContent box={b} />
                  </div>
                </Rnd>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
