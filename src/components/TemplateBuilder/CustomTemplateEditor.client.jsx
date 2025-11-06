"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Rnd } from "react-rnd";
import { v4 as uuidv4 } from "uuid";
import styles from "./CustomTemplateEditor.module.css";

const A4_RATIO = 297 / 210;

function pxToPct(xPx, yPx, wPx, hPx, el) {
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
function pctToPx(leftPct, topPct, wPct, hPct, el) {
  if (!el) return {};
  const rect = el.getBoundingClientRect();
  const left = (parseFloat(leftPct || "0") / 100) * rect.width;
  const top = (parseFloat(topPct || "0") / 100) * rect.height;
  const w = (parseFloat(wPct || "0") / 100) * rect.width;
  const h = (parseFloat(hPct || "0") / 100) * rect.height;
  return { left, top, width: w, height: h };
}

const TableCell = ({
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
}) => {
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
      {isEditingCell && isEditingCell.r === rIdx && isEditingCell.c === cIdx ? (
        <div
          ref={editingCellRef}
          className={styles["table-edit"]}
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
        >
          {cellValue}
        </div>
      ) : (
        <div
          className={styles["table-cell"]}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ minHeight: 16 }}
        >
          {cellValue}
        </div>
      )}
    </td>
  );
};

const CustomTemplateEditor = forwardRef(function CustomTemplateEditor(
  {
    initialBoxes = [],
    onUploadImage,
    canvasWidthPx = 1000,
    onSave,
    background = null,
  },
  ref
) {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const innerCanvasRef = useRef(null);
  const createdUrlsRef = useRef([]);

  const [boxes, setBoxes] = useState(initialBoxes || []);
  const [mode, setMode] = useState("select");
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editingTableMode, setEditingTableMode] = useState(null);
  const [canvasWidthActual, setCanvasWidthActual] = useState(canvasWidthPx);
  const [canvasHeightActual, setCanvasHeightActual] = useState(
    Math.round(canvasWidthPx * A4_RATIO)
  );
  // page background state (editable from props bar)
  const [pageBackground, setPageBackground] = useState("#ffffff");

  const pendingLogoTargetRef = useRef(null);

  const draggingRef = useRef(false);
  const dragEndedRef = useRef(null);
  const dragAllowMs = 300;

  // initialize pageBackground from incoming prop `background` if provided
  useEffect(() => {
    if (background) {
      setPageBackground(background);
    }
  }, [background]);

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
  }, [initialBoxes]);

  function addBox(type = "text") {
    const wPct = 20;
    const hPct = 8;
    const leftPct = 50 - wPct / 2;
    const topPct = 4;
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
      return id;
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
    return id;
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
    if (onSave) onSave(payload);
    return payload;
  }

  function handleDragStart(id) {
    draggingRef.current = true;
    setEditingId(null);
    dragEndedRef.current = null;
    setSelectedId(id);
  }

  function handleDragStop(id, e, d) {
    draggingRef.current = false;
    const { left, top } = pxToPct(d.x, d.y, 0, 0, innerCanvasRef.current);
    updateBox(id, { xPct: left, yPct: top });
    dragEndedRef.current = { id, ts: Date.now() };
  }

  function handleResizeStop(id, e, direction, ref, delta, pos) {
    const wPx = ref.offsetWidth;
    const hPx = ref.offsetHeight;
    const leftPx = pos.x;
    const topPx = pos.y;
    const { left, top, width, height } = pxToPct(
      leftPx,
      topPx,
      wPx,
      hPx,
      innerCanvasRef.current
    );
    updateBox(id, { xPct: left, yPct: top, wPct: width, hPct: height });
    dragEndedRef.current = { id, ts: Date.now() };
  }

  function openFilePickerForLogo(targetBoxId = null) {
    pendingLogoTargetRef.current = targetBoxId || selectedId || null;

    if (!fileInputRef.current) return;

    try {
      fileInputRef.current.value = "";
    } catch (e) {}

    try {
      fileInputRef.current.click();
    } catch (e) {
      setTimeout(() => {
        try {
          fileInputRef.current && fileInputRef.current.click();
        } catch (err) {}
      }, 50);
    }
  }

  async function handleFileSelected(file) {
    let targetId = pendingLogoTargetRef.current || selectedId;

    if (!targetId) {
      const id = addBox("logo");
      targetId = id;
      pendingLogoTargetRef.current = id;
    }

    try {
      if (onUploadImage && typeof onUploadImage === "function") {
        const url = await onUploadImage(file);
        if (url) {
          updateBox(targetId, { content: url, type: "logo" });
          pendingLogoTargetRef.current = null;
          return;
        }
      }
    } catch (err) {
      console.warn("onUploadImage failed:", err);
    }

    const obj = URL.createObjectURL(file);
    createdUrlsRef.current.push(obj);
    updateBox(targetId, { content: obj, type: "logo" });
    pendingLogoTargetRef.current = null;
  }

  function updateTableCell(boxId, r, c, value) {
    setBoxes((prev) =>
      prev.map((b) => {
        if (b.id !== boxId) return b;
        const table = b.table ? { ...b.table } : { rows: 0, cols: 0, data: [] };
        const data = (table.data || []).map((row) => row.slice());
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

  function BoxContent({ box }) {
    const isSelected = box.id === selectedId;
    const isEditing = editingId === box.id;
    const contentRef = useRef(null);

    const baseInline = {
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
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setSelectedId(box.id);
            setEditingId(box.id);
          }}
          style={baseInline}
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
          className={styles["logo-box-inner"]}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedId(box.id);
            openFilePickerForLogo(box.id);
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(box.id);
          }}
        >
          {src ? (
            <img
              data-no-drag="true"
              src={src}
              alt="logo"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className={styles["logo-img"]}
            />
          ) : (
            <div className={styles["logo-placeholder"]} data-no-drag="true">
              <div>Logo (double-click or Upload)</div>
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
          className={styles["table-box"]}
          onClick={(e) => e.stopPropagation()}
        >
          <table
            className={styles["table-el"]}
            style={{
              borderCollapse: table.border ? "collapse" : "separate",
              tableLayout: "fixed",
              fontFamily: box.style?.fontFamily || "Arial, sans-serif",
              fontSize: box.style?.fontSize
                ? `${box.style.fontSize}px`
                : undefined,
              color: box.style?.color || undefined,
              width: "100%",
              height: "100%",
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

    return <div style={baseInline}>{box.content}</div>;
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

  useImperativeHandle(ref, () => ({
    addText: () => addBox("text"),
    addField: () => addBox("placeholder"),
    addLogo: () => {
      const id = addBox("logo");
      setSelectedId(id);
      setTimeout(() => openFilePickerForLogo(id), 50);
    },
    addTable: () => addBox("table"),
    togglePreview: () =>
      setMode((m) => (m === "preview" ? "select" : "preview")),
    deleteSelected: () => removeSelected(),
    getData: () => saveTemplate(),
    getHtml: () => {
      return saveTemplate();
    },
  }));

  return (
    <div className={styles["cte-root"]}>
      <div className={styles["props-bar"]}>
        {!selectedBox ? (
          <>
            <div className={styles["props-empty"]}>
              Select a box to edit its properties.
            </div>

            {/* Page background control visible even when no box is selected */}
            <div
              className={styles["props-section"]}
              style={{ marginLeft: "auto" }}
            >
              <div className={styles["props-subtitle"]}>Page</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    className={styles["props-label"]}
                    style={{ margin: 0 }}
                  >
                    Page background
                  </label>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div
                      className={styles["color-swatch"]}
                      style={{ background: pageBackground }}
                    />
                    <input
                      className={styles["props-color"]}
                      type="color"
                      value={pageBackground || "#ffffff"}
                      onChange={(e) => setPageBackground(e.target.value)}
                      title="Page background color"
                    />
                    <button
                      className={styles["control-btn"]}
                      onClick={() => setPageBackground("#ffffff")}
                      title="Reset page background"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* LEFT: main text properties */}
            <div
              className={styles["props-left"] + " " + styles["props-section"]}
            >
              <div>
                <div className={styles["props-subtitle"]}>Typography</div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label className={styles["props-label"]}>font family</label>
                    <select
                      className={styles["props-select"]}
                      value={
                        selectedBox.style?.fontFamily || "Arial, sans-serif"
                      }
                      onChange={(e) =>
                        applyStyleProp("fontFamily", e.target.value)
                      }
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Helvetica, sans-serif">Helvetica</option>
                      <option value="'Times New Roman', serif">Times</option>
                      <option value="'Roboto', sans-serif">Roboto</option>
                      <option value="'Montserrat', sans-serif">
                        Montserrat
                      </option>
                    </select>
                  </div>

                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label className={styles["props-label"]}>Size</label>
                      <input
                        className={styles["props-input"]}
                        type="number"
                        value={selectedBox.style?.fontSize || 14}
                        onChange={(e) =>
                          applyStyleProp(
                            "fontSize",
                            parseInt(e.target.value || 14, 10)
                          )
                        }
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label className={styles["props-label"]}>Color</label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <input
                          className={styles["props-color"]}
                          type="color"
                          value={selectedBox.style?.color || "#0f1724"}
                          onChange={(e) =>
                            applyStyleProp("color", e.target.value)
                          }
                          title="Text color"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <button
                    className={styles["control-btn"]}
                    onClick={toggleBold}
                  >
                    {selectedBox.style?.fontWeight === "700"
                      ? "Unbold"
                      : "Bold"}
                  </button>
                  <button
                    className={styles["control-btn"]}
                    onClick={toggleItalic}
                  >
                    {selectedBox.style?.fontStyle === "italic"
                      ? "Unitalic"
                      : "Italic"}
                  </button>

                  <div
                    style={{
                      marginLeft: 8,
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <label
                      className={styles["props-label"]}
                      style={{ margin: 0 }}
                    >
                      Align
                    </label>
                    <select
                      className={styles["props-select"]}
                      value={selectedBox.style?.textAlign || "left"}
                      onChange={(e) =>
                        applyStyleProp("textAlign", e.target.value)
                      }
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                      <option value="justify">Justify</option>
                    </select>
                  </div>
                </div>
              </div>

              <label className={styles["props-label"]}>Background</label>
              <div style={{ display: "flex", marginTop: -16 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className={styles["props-color"]}
                    type="color"
                    value={
                      selectedBox.style?.background
                        ? selectedBox.style.background
                        : "#00000000"
                    }
                    onChange={(e) =>
                      applyStyleProp("background", e.target.value)
                    }
                    title="Box background"
                  />
                  <div className={styles["helper"]}>Box background</div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div />
                  <input
                    className={styles["props-color"]}
                    type="color"
                    value={pageBackground || "#ffffff"}
                    onChange={(e) => setPageBackground(e.target.value)}
                    title="Page background color"
                  />
                  <div className={styles["helper"]}>Page background</div>
                  <button
                    className={styles["control-btn"]}
                    onClick={() => setPageBackground("#ffffff")}
                    title="Reset page background"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: per-type actions */}
            <div className={styles["props-right"]}>
              {/* Logo actions */}
              {selectedBox.type === "logo" && (
                <div
                  className={styles["props-section"]}
                  style={{ minWidth: 220 }}
                >
                  <div className={styles["props-subtitle"]}>Logo</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className={styles["control-btn"]}
                      onClick={() => openFilePickerForLogo(selectedBox.id)}
                    >
                      Upload Logo
                    </button>
                    <button
                      className={styles["control-btn"]}
                      onClick={() =>
                        updateBox(selectedBox.id, { content: "", type: "logo" })
                      }
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Table tools (improved UI) */}
              {selectedBox.type === "table" && (
                <div
                  className={styles["props-section"]}
                  style={{ minWidth: 260 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div className={styles["props-subtitle"]}>Table</div>
                    <div className={styles["badge"]}>
                      <div>Rows: {selectedBox.table?.rows || 0}</div>
                      <div
                        style={{
                          width: 1,
                          height: 18,
                          background: "#e6edf3",
                          margin: "0 8px",
                        }}
                      />
                      <div>Cols: {selectedBox.table?.cols || 0}</div>
                    </div>
                  </div>

                  <div
                    className={styles["toolbar-grid"]}
                    style={{ marginTop: 8 }}
                  >
                    <div className={styles["helper"]}>Rows</div>
                    <button
                      title="Add row"
                      onClick={() => addTableRow(selectedBox.id)}
                      className={styles["icon-btn"]}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 5v14M5 12h14"
                          stroke="#0f1724"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <button
                      title="Remove row"
                      onClick={() => removeTableRow(selectedBox.id)}
                      className={styles["icon-btn"]}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 12h12"
                          stroke="#ef4444"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <div className={styles["helper"]}>Columns</div>
                    <button
                      title="Add column"
                      onClick={() => addTableCol(selectedBox.id)}
                      className={styles["icon-btn"]}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 5v14M5 12h14"
                          stroke="#0f1724"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      title="Remove column"
                      onClick={() => removeTableCol(selectedBox.id)}
                      className={styles["icon-btn"]}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 12h12"
                          stroke="#ef4444"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <label
                        className={styles["props-subtitle"]}
                        style={{ margin: 0 }}
                      >
                        Header
                      </label>
                      <div className={styles["toggle"]}>
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
                      </div>
                    </div>

                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <label
                        className={styles["props-subtitle"]}
                        style={{ margin: 0 }}
                      >
                        Border
                      </label>
                      <div className={styles["toggle"]}>
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
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div className={styles["color-preview"]}>
                      <label
                        className={styles["props-subtitle"]}
                        style={{ margin: 0 }}
                      >
                        Cell BG
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <div
                          className={styles["color-swatch"]}
                          style={{
                            background:
                              selectedBox.table?.cellBackground ||
                              "transparent",
                          }}
                        />
                        <input
                          className={styles["props-color"]}
                          type="color"
                          value={
                            selectedBox.table?.cellBackground || "#ffffff00"
                          }
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
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <label
                        className={styles["props-subtitle"]}
                        style={{ margin: 0 }}
                      >
                        Edit Cells
                      </label>
                      <input
                        type="checkbox"
                        checked={editingTableMode === selectedBox.id}
                        onChange={(e) =>
                          setEditingTableMode(
                            e.target.checked ? selectedBox.id : null
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Text / placeholder actions */}
              {(selectedBox.type === "text" ||
                selectedBox.type === "placeholder") && (
                <div
                  className={styles["props-section"]}
                  style={{ minWidth: 220 }}
                >
                  <div className={styles["props-subtitle"]}>Actions</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className={styles["control-btn"]}
                      onClick={() => startEditingSelected()}
                    >
                      Edit
                    </button>
                    <button
                      className={styles["control-btn"]}
                      onClick={() => removeSelected()}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className={styles["canvas-wrap"]}>
        <div
          ref={containerRef}
          className={styles["cte-canvas"]}
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
            className={styles["template-inner"]}
            style={{
              width: `${canvasWidthActual}px`,
              height: `${canvasHeightActual}px`,
              background: pageBackground || background || "white",
            }}
          >
            {boxes.map((b) => {
              const px = pctToPx(
                b.xPct,
                b.yPct,
                b.wPct,
                b.hPct,
                innerCanvasRef.current
              );
              const kWidth = px.width || Math.max(160, canvasWidthActual * 0.2);
              const kHeight =
                px.height || Math.max(40, canvasHeightActual * 0.08);
              const kX =
                typeof px.left === "number" ? px.left : canvasWidthActual * 0.4;
              const kY =
                typeof px.top === "number" ? px.top : canvasHeightActual * 0.04;
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
                  cancel={
                    '.table-edit, .table-cell, [data-no-drag], [contenteditable="true"], input, textarea, select'
                  }
                  className={`${styles["cte-box"]} ${
                    isSelected ? styles.selected : ""
                  }`}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelectedId(b.id);
                    dragEndedRef.current = null;
                  }}
                  onDoubleClick={(ev) => {
                    ev.stopPropagation();
                    setSelectedId(b.id);
                    if (b.type === "logo") openFilePickerForLogo(b.id);
                    if (b.type === "text" || b.type === "placeholder")
                      setEditingId(b.id);
                  }}
                  style={{ zIndex: isSelected ? 100 : 20 }}
                  minWidth={40}
                  minHeight={24}
                >
                  <div
                    className={styles["box-inner"]}
                    data-box-id={b.id}
                    onMouseDown={(e) => {
                      if (editingCell && editingCell.boxId === b.id)
                        e.stopPropagation();
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
                          className={styles["edit-btn"]}
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            try {
              await handleFileSelected(f);
            } catch (err) {
              console.warn("file handler error", err);
            } finally {
              try {
                e.target.value = "";
              } catch (err) {}
            }
          } else {
            pendingLogoTargetRef.current = null;
            try {
              e.target.value = "";
            } catch (err) {}
          }
        }}
      />
    </div>
  );
});

export default CustomTemplateEditor;
