"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Rnd } from "react-rnd";
import { v4 as uuidv4 } from "uuid";
import styles from "./CustomTemplateEditor.module.css";
import FieldPropertiesPanel from "./FieldPropertiesPanel";

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

const TableCell = ({ ...props }) => {
  const {
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
    boxStyle = {},
  } = props;
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

  const headerOnTop = table.__isHeader === true;
  const borderColor =
    table.borderColor || boxStyle.borderColor || "rgba(0,0,0,0.12)";
  const borderStyle = table.border ? `1px solid ${borderColor}` : "none";

  const cellBackground = headerOnTop
    ? table.headerBackground ||
      boxStyle.headerBackground ||
      table.cellBackground ||
      boxStyle.cellBackground ||
      "transparent"
    : table.rowBackground ||
      boxStyle.rowBackground ||
      table.cellBackground ||
      boxStyle.cellBackground ||
      "transparent";

  const cellColor = headerOnTop
    ? table.headerColor || boxStyle.headerColor || undefined
    : table.rowColor || boxStyle.rowColor || undefined;

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
        color: cellColor,
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
    initialBoxesAreBodyRelative = false,
    initialActiveArea = "body",
    initialBodyType = null,
    onUploadImage,
    canvasWidthPx = 1000,
    onSave,
    background = null,
    headerHeightPct = 10,
    footerHeightPct = 10,
    watermarkUrl = null,
    watermarkProps = null,
    watermarkEditable = false,
    onWatermarkChange = null,
    onBoxesChange = null,
  },
  ref,
) {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const innerCanvasRef = useRef(null);
  const createdUrlsRef = useRef([]);
  const lastInitialBodyTypeRef = useRef(initialBodyType);

  const imageInputRef = useRef(null);
  const [activeImageBoxId, setActiveImageBoxId] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [mode, setMode] = useState("select");
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editingTableMode, setEditingTableMode] = useState(null);
  const [canvasWidthActual, setCanvasWidthActual] = useState(canvasWidthPx);
  const [canvasHeightActual, setCanvasHeightActual] = useState(
    Math.round(canvasWidthPx * A4_RATIO),
  );
  const [pageBackground, setPageBackground] = useState("#ffffff");

  const pendingLogoTargetRef = useRef(null);

  const draggingRef = useRef(false);
  const dragEndedRef = useRef(null);
  const dragAllowMs = 300;

  const [activeArea, setActiveArea] = useState(initialActiveArea || "body");

  const [localWatermark, setLocalWatermark] = useState(
    watermarkProps || {
      xPct: "50%",
      yPct: "50%",
      wPct: "60%",
      hPct: "60%",
      opacity: 0.12,
    },
  );

  const [localWatermarkUrl, setLocalWatermarkUrl] = useState(
    watermarkUrl || null,
  );

  // if parent changes the requested active area we mirror it
  useEffect(() => {
    if (
      initialActiveArea &&
      initialActiveArea !== activeArea &&
      ["header", "body", "footer"].includes(initialActiveArea)
    ) {
      setActiveArea(initialActiveArea);
    }
  }, [initialActiveArea]);

  useEffect(() => {
    try {
      if (typeof onBoxesChange === "function") {
        onBoxesChange((boxes || []).map((b) => ({ ...b })));
      }
    } catch (e) {
      console.warn("onBoxesChange callback threw", e);
    }
  }, [boxes, onBoxesChange]);

  useEffect(() => {
    if (background) {
      setPageBackground(background);
    }
  }, [background]);

  useEffect(() => {
    if (watermarkProps) setLocalWatermark(watermarkProps);
  }, [watermarkProps]);

  useEffect(() => {
    setLocalWatermarkUrl(watermarkUrl || null);
  }, [watermarkUrl]);

  const bodyTopPct = Number(String(headerHeightPct).replace("%", "")) || 10;
  const bodyBottomPct =
    100 - (Number(String(footerHeightPct).replace("%", "")) || 10);
  const bodyHeightPct = bodyBottomPct - bodyTopPct;

  function areaFromTopPct(topNum, hPctNum) {
    const header = Number(String(headerHeightPct).replace("%", "")) || 10;
    const footer = Number(String(footerHeightPct).replace("%", "")) || 10;
    const bodyTop = header;
    const bodyBottom = 100 - footer;
    const center = topNum + hPctNum / 2;
    if (center <= header) return "header";
    if (center >= bodyBottom) return "footer";
    return "body";
  }

  useEffect(() => {
    // if initialBodyType changed, we're switching document types, so reset boxes
    const bodyTypeChanged = lastInitialBodyTypeRef.current !== initialBodyType;
    if (bodyTypeChanged) {
      lastInitialBodyTypeRef.current = initialBodyType;
    }

    // only skip if no boxes provided AND document type didn't change
    if (!Array.isArray(initialBoxes) || initialBoxes.length === 0) {
      if (!bodyTypeChanged) {
        return;
      }
      // if bodyTypeChanged, continue even with empty initialBoxes so we can
      // merge header/footer with the new (empty) body template like letter
    }

    const parsePct = (s) => {
      try {
        const str = String(s || "0").trim();
        if (str.endsWith("%")) return Number(str.replace("%", "")) || 0;
        const n = Number(str);
        return Number.isFinite(n) ? n : 0;
      } catch {
        return 0;
      }
    };

    function shiftBoxesToBody(src = []) {
      return src.map((b) => {
        const nb = { ...b };
        try {
          const yNum = parsePct(nb.yPct);
          const hNum = parsePct(nb.hPct || "0");

          nb.area = nb.area || areaFromTopPct(yNum, hNum);

          let candidateTop = yNum;

          if (initialBoxesAreBodyRelative && nb.area === "body") {
            candidateTop = yNum + bodyTopPct;
          }

          nb.yPct = `${candidateTop}%`;
        } catch (e) {}
        return nb;
      });
    }

    const normalized = shiftBoxesToBody(initialBoxes || []);

    setBoxes((prev) => {
      // if document type just changed, intelligently merge: keep header/footer,
      // replace body boxes only
      if (bodyTypeChanged && Array.isArray(prev) && prev.length > 0) {
        const headerFooterBoxes = prev.filter(
          (b) => b.area === "header" || b.area === "footer",
        );
        return [...headerFooterBoxes, ...normalized];
      }
      // otherwise only initialize if no boxes exist yet
      if (Array.isArray(prev) && prev.length > 0) {
        return prev;
      }
      return normalized;
    });

    return () => {
      createdUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch (e) {}
      });
      createdUrlsRef.current = [];
    };
  }, [
    JSON.stringify(initialBoxes),
    headerHeightPct,
    footerHeightPct,
    initialBoxesAreBodyRelative,
    initialBodyType,
  ]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function recompute() {
      const rect = el.getBoundingClientRect();

      const style = window.getComputedStyle(el);
      const padLeft = parseFloat(style.paddingLeft || "0") || 0;
      const padRight = parseFloat(style.paddingRight || "0") || 0;
      const available = Math.max(320, rect.width - padLeft - padRight - 0);
      const w = Math.min(canvasWidthPx, Math.floor(available));
      const h = Math.round(w * A4_RATIO);
      setCanvasWidthActual((prev) => (prev !== w ? w : prev));
      setCanvasHeightActual((prev) => (prev !== h ? h : prev));
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

  function clampToArea(yPctNum, hPctNum, area) {
    const header = Number(String(headerHeightPct).replace("%", "")) || 10;
    const footer = Number(String(footerHeightPct).replace("%", "")) || 10;
    const bodyTop = header;
    const bodyBottom = 100 - footer;

    if (area === "header") {
      const maxTop = Math.max(0, header - hPctNum - 0.5);
      return Math.min(Math.max(0.5, yPctNum), maxTop);
    }
    if (area === "footer") {
      const minTop = Math.max(bodyBottom, 100 - footer);
      const minAllowed = bodyBottom;
      const maxAllowed = 100 - hPctNum - 0.5;
      return Math.min(Math.max(minAllowed + 0.5, yPctNum), maxAllowed);
    }
    const minAllowed = bodyTop;
    const maxAllowed = bodyBottom - hPctNum - 0.5;
    return Math.min(
      Math.max(minAllowed + 0.5, yPctNum),
      Math.max(minAllowed + 0.5, maxAllowed),
    );
  }

  function addBox(type = "text") {
    if (!["header", "body", "footer"].includes(activeArea)) {
      return null;
    }

    const wPctNum = 20;
    const hPctNum = 8;
    const leftPct = 50 - wPctNum / 2;
    let topPct = 4;

    if (activeArea === "header") {
      topPct = Math.max(
        0.5,
        Number(String(headerHeightPct).replace("%", "")) / 2 - hPctNum / 2,
      );
    } else if (activeArea === "footer") {
      const footer = Number(String(footerHeightPct).replace("%", "")) || 10;
      topPct = 100 - footer + Math.max(0.5, footer / 2 - hPctNum / 2);
    } else {
      topPct = Math.max(
        0.5,
        Number(String(headerHeightPct).replace("%", "")) / 2 - hPctNum / 2,
      );
    }

    topPct = clampToArea(topPct, hPctNum, activeArea);

    const id = uuidv4();

    if (type === "table") {
      const rows = 3;
      const cols = 3;
      const data = Array.from({ length: rows }).map(() =>
        Array.from({ length: cols }).map(() => ""),
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
          textAlign: "left",
        },
        xPct: `${leftPct}%`,
        yPct: `${topPct}%`,
        wPct: `${wPctNum}%`,
        hPct: `${hPctNum}%`,
        area: activeArea,
        style: {
          fontFamily: "Arial, sans-serif",
          fontSize: 12,
          color: "#0f1724",
          background: "transparent",
          fontWeight: "400",
          fontStyle: "normal",
          textAlign: "left",
          headerBackground: "#f8fafc",
          headerColor: "#0f1724",
          rowBackground: "transparent",
          rowColor: "#0f1724",
          borderColor: "rgba(0,0,0,0.12)",
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
      wPct: `${wPctNum}%`,
      hPct: `${hPctNum}%`,
      area: activeArea,
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

  function normalizeTableForSave(b) {
    if (b.table && typeof b.table === "object") return b.table;
    const headers = Array.isArray(b.tableHeaders) ? b.tableHeaders : null;
    const rows = Array.isArray(b.tableRows) ? b.tableRows : null;
    if (!headers && !rows) return undefined;
    const cols =
      (headers && headers.length) || (rows && rows[0] ? rows[0].length : 0);
    const data = rows
      ? rows.map((r) => Array.from(r))
      : cols
        ? [Array.from({ length: cols }).map(() => "")]
        : [];
    return {
      rows: data.length,
      cols,
      data,
      header: !!(headers && headers.length),
      border: true,
      cellPadding: 6,
    };
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
        headerHeightPct,
        footerHeightPct,
      },
      boxes: boxes.map((b) => ({
        id: b.id,
        type: b.type,
        content: b.content,
        table: normalizeTableForSave(b),
        xPct: b.xPct,
        yPct: b.yPct,
        wPct: b.wPct,
        hPct: b.hPct,
        style: b.style || {},
        area: b.area || "body",
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

    try {
      const b = boxes.find((bx) => bx.id === id) || {};
      const hPctNum = Number(String(b.hPct || "6%").replace("%", "")) || 6;
      const topNum = Number(String(top).replace("%", "")) || 0;

      let area = b.area || "body";
      const headerEnd = Number(String(headerHeightPct).replace("%", "")) || 10;
      const footerStart =
        100 - (Number(String(footerHeightPct).replace("%", "")) || 10);

      if (!b.area) {
        const boxCenter = topNum + hPctNum / 2;
        if (boxCenter <= headerEnd) area = "header";
        else if (boxCenter >= footerStart) area = "footer";
        else area = "body";
      }

      const clampedTop = clampToArea(topNum, hPctNum, area);
      updateBox(id, { xPct: left, yPct: `${clampedTop}%`, area });
    } catch (err) {
      updateBox(id, { xPct: left, yPct: top });
    }
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
      innerCanvasRef.current,
    );

    try {
      const b = boxes.find((bx) => bx.id === id) || {};
      const hPctNum = Number(String(height).replace("%", "")) || 6;
      const topNum = Number(String(top).replace("%", "")) || 0;

      let area = b.area || "body";
      const headerEnd = Number(String(headerHeightPct).replace("%", "")) || 10;
      const footerStart =
        100 - (Number(String(footerHeightPct).replace("%", "")) || 10);

      if (!b.area) {
        const boxCenter = topNum + hPctNum / 2;
        if (boxCenter <= headerEnd) area = "header";
        else if (boxCenter >= footerStart) area = "footer";
        else area = "body";
      }

      const clampedTop = clampToArea(topNum, hPctNum, area);
      updateBox(id, {
        xPct: left,
        yPct: `${clampedTop}%`,
        wPct: width,
        hPct: height,
        area,
      });
    } catch (err) {
      updateBox(id, { xPct: left, yPct: top, wPct: width, hPct: height });
    }
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
    const targetId = pendingLogoTargetRef.current;

    if (!targetId) {
      pendingLogoTargetRef.current = null;
      return; // do NOT create new box
    }

    try {
      if (onUploadImage && typeof onUploadImage === "function") {
        const url = await onUploadImage(file);
        if (url) {
          updateBox(targetId, { content: url });
          pendingLogoTargetRef.current = null;
          return;
        }
      }
    } catch (err) {
      console.warn("onUploadImage failed:", err);
    }

    const objUrl = URL.createObjectURL(file);
    createdUrlsRef.current.push(objUrl);
    updateBox(targetId, { content: objUrl });
    pendingLogoTargetRef.current = null;
  }

  function handleReplaceImage(file, box) {
    if (!file || !box) return;

    const applyUrl = (url) => {
      setBoxes((prev) =>
        prev.map((b) =>
          String(b.id) === String(box.id) ? { ...b, content: url } : b,
        ),
      );
    };

    if (typeof onUploadImage === "function") {
      try {
        const result = onUploadImage(file, box);

        // If async uploader
        if (result && typeof result.then === "function") {
          result.then((url) => {
            if (url) applyUrl(url);
          });
          return;
        }

        // If sync uploader returning url
        if (typeof result === "string") {
          applyUrl(result);
          return;
        }
      } catch (err) {
        console.warn("onUploadImage failed", err);
      }
    }

    // fallback
    const localUrl = URL.createObjectURL(file);
    createdUrlsRef.current.push(localUrl);
    applyUrl(localUrl);
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
      }),
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
      }),
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
      }),
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
      }),
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
      }),
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
      padding: box.style?.padding ?? 6,
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
          contentRef.current.innerHTML = box.content || "";
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
                ? contentRef.current.innerHTML
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
          {!isEditing && (
            <div dangerouslySetInnerHTML={{ __html: box.content || "" }} />
          )}
        </div>
      );
    }

    if (box.type === "image" || box.type === "logo") {
      return (
        <img
          src={box.content}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            cursor: "pointer",
          }}
          onClick={(e) => {
            e.stopPropagation();
            openFilePickerForLogo(box.id);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            openFilePickerForLogo(box.id);
          }}
        />
      );
    }
    if (box.type === "table") {
      const legacyHeaders = box.tableHeaders || box.headers || null;
      const legacyRows = box.tableRows || box.rows || null;

      const tableFromLegacy =
        legacyHeaders || legacyRows
          ? (() => {
              const headers = Array.isArray(legacyHeaders) ? legacyHeaders : [];
              const rows = Array.isArray(legacyRows) ? legacyRows : [];

              const cols = headers.length || (rows[0] ? rows[0].length : 0);

              let data;
              if (rows.length) {
                data = rows.map((r) => Array.from(r));
              } else if (cols) {
                data = [Array.from({ length: cols }).map(() => "")];
              } else {
                data = [];
              }

              return {
                rows: data.length,
                cols: cols,
                data,
                header: headers.length > 0,
                border:
                  typeof box.table?.border !== "undefined"
                    ? box.table.border
                    : true,
                cellPadding: box.table?.cellPadding ?? 6,
                cellBackground: box.table?.cellBackground ?? "transparent",
                textAlign: box.table?.textAlign ?? "left",
                headerBackground: box.style?.headerBackground,
                headerColor: box.style?.headerColor,
                rowBackground: box.style?.rowBackground,
                rowColor: box.style?.rowColor,
                borderColor: box.style?.borderColor,
              };
            })()
          : null;

      const table = box.table
        ? { ...box.table }
        : tableFromLegacy || { rows: 0, cols: 0, data: [] };

      const tableProps = {
        ...table,
        headerBackground: table.headerBackground || box.style?.headerBackground,
        headerColor: table.headerColor || box.style?.headerColor,
        rowBackground: table.rowBackground || box.style?.rowBackground,
        rowColor: table.rowColor || box.style?.rowColor,
        borderColor: table.borderColor || box.style?.borderColor,
        cellBackground: table.cellBackground || box.style?.cellBackground,
        cellPadding: table.cellPadding || 6,
        textAlign: table.textAlign || box.style?.textAlign || "left",
      };

      let headersArr =
        table.headers ||
        (Array.isArray(box.tableHeaders) ? box.tableHeaders : null);
      let bodyRows = Array.isArray(table.data) ? table.data : [];

      if (
        !headersArr &&
        table.header &&
        Array.isArray(table.data) &&
        table.data.length > 0
      ) {
        headersArr = table.data[0];
        bodyRows = table.data.slice(1);
      }

      return (
        <div
          className={styles["table-box"]}
          onClick={(e) => e.stopPropagation()}
          style={{ width: "100%", height: "100%", overflow: "hidden" }}
        >
          <table
            className={styles["table-el"]}
            style={{
              borderCollapse: tableProps.border ? "collapse" : "separate",
              tableLayout: "fixed",
              fontFamily: box.style?.fontFamily || "Arial, sans-serif",
              fontSize: box.style?.fontSize
                ? `${box.style.fontSize}px`
                : undefined,
              color: box.style?.color || undefined,
              width: "100%",
              height: "auto",
            }}
          >
            {headersArr && (
              <thead>
                <tr>
                  {headersArr.map((h, idx) => (
                    <th
                      key={`h-${idx}`}
                      contentEditable={mode !== "preview"}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const val = e.target.textContent || "";

                        setBoxes((prev) =>
                          prev.map((b) => {
                            if (b.id !== box.id) return b;

                            const table = { ...b.table };
                            const data = table.data.map((r) => r.slice());

                            data[0][idx] = val; // header is row 0
                            table.data = data;

                            return { ...b, table };
                          }),
                        );
                      }}
                      style={{
                        padding: tableProps.cellPadding || 6,
                        textAlign: tableProps.textAlign || "left",
                        background:
                          tableProps.headerBackground || "transparent",
                        color: tableProps.headerColor || undefined,
                        border: tableProps.border
                          ? `1px solid ${tableProps.borderColor || "rgba(0,0,0,0.12)"}`
                          : "none",
                        fontWeight: 600,
                        verticalAlign: "top",
                        overflow: "hidden",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {String(h ?? "")}
                    </th>
                  ))}
                </tr>
              </thead>
            )}

            <tbody>
              {(bodyRows || []).map((row, rIdx) => {
                const realRowIndex =
                  headersArr && table.header ? rIdx + 1 : rIdx;

                return (
                  <tr key={`r-${realRowIndex}`}>
                    {(row || []).map((cell, cIdx) => (
                      <TableCell
                        key={`c-${realRowIndex}-${cIdx}`}
                        boxId={box.id}
                        rIdx={realRowIndex}
                        cIdx={cIdx}
                        cellValue={cell}
                        isEditingCell={
                          editingCell && editingCell.boxId === box.id
                            ? editingCell
                            : null
                        }
                        table={{
                          ...tableProps,
                          header: !!headersArr || !!table.header,
                        }}
                        mode={mode}
                        editingTableMode={editingTableMode}
                        updateTableCell={updateTableCell}
                        setEditingCell={setEditingCell}
                        boxStyle={box.style || {}}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return <div style={baseInline}>{box.content}</div>;
  }

  function updateSelectedFieldStyle(nextStyle) {
    if (!selectedId) return;
    setBoxes((prev) =>
      prev.map((b) =>
        b.id === selectedId
          ? { ...b, style: { ...(b.style || {}), ...(nextStyle || {}) } }
          : b,
      ),
    );
  }

  function updateSelectedFieldContent(nextContent) {
    if (!selectedId) return;
    setBoxes((prev) =>
      prev.map((b) =>
        b.id === selectedId ? { ...b, content: nextContent } : b,
      ),
    );
  }

  function updatePageStyle(nextPageStyle) {
    if (!nextPageStyle) return;
    setPageBackground(nextPageStyle.background || pageBackground);
  }

  useEffect(() => {
    return () => {
      wmDragRef.current = null;
      wmResizeRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    addText: () => addBox("text"),
    addField: () => addBox("placeholder"),
    addLogo: () => {
      const id = addBox("logo");
      if (id) {
        setSelectedId(id);
        setTimeout(() => openFilePickerForLogo(id), 50);
      }
    },
    addTable: () => addBox("table"),
    togglePreview: () =>
      setMode((m) => (m === "preview" ? "select" : "preview")),
    deleteSelected: () => removeSelected(),
    getData: () => saveTemplate(),
    getHtml: () => {
      return saveTemplate();
    },
    setActiveArea: (area) => {
      if (["header", "body", "footer"].includes(area)) setActiveArea(area);
    },
    setWatermark: (url, props) => {
      setLocalWatermarkUrl(url || null);
      if (props) {
        setLocalWatermark(props);
        if (typeof onWatermarkChange === "function") onWatermarkChange(props);
      }
    },
    clearWatermark: () => {
      setLocalWatermarkUrl(null);
      if (typeof onWatermarkChange === "function")
        onWatermarkChange({
          xPct: "50%",
          yPct: "50%",
          wPct: "60%",
          hPct: "60%",
          opacity: 0.12,
        });
    },
    applyStyleProp: (prop, value) => {
      if (!selectedId) return;
      const b = boxes.find((bx) => bx.id === selectedId);
      if (!b) return;
      const style = { ...(b.style || {}) };
      style[prop] = value;
      updateBox(selectedId, { style });
    },
    getBoxes: () => boxes,
    setBoxes: (next) => setBoxes(next),
    setSelectedId: (id) => setSelectedId(id),
  }));

  const wmDragRef = useRef(null);
  const wmResizeRef = useRef(null);
  const pendingWmRef = useRef(null);
  const prevWmRef = useRef(JSON.stringify(localWatermark));
  const watermarkElRef = useRef(null);

  const emitWatermarkIfChanged = useCallback(
    (next) => {
      const sNext = JSON.stringify(next);
      if (sNext === prevWmRef.current) return;
      prevWmRef.current = sNext;
      setLocalWatermark(next);
      if (typeof onWatermarkChange === "function") {
        try {
          onWatermarkChange(next);
        } catch (e) {
          console.warn("onWatermarkChange threw", e);
        }
      }
    },
    [onWatermarkChange],
  );

  function watermarkOnDrag(ev) {
    if (!wmDragRef.current) return;
    const info = wmDragRef.current;
    const dx = ev.clientX - info.startX;
    const dy = ev.clientY - info.startY;
    const rect = info.rect;
    const dxPct = (dx / rect.width) * 100;
    const dyPct = (dy / rect.height) * 100;
    const cur = { ...(info.initial || {}) };
    const xNum = Number(String(cur.xPct || "50%").replace("%", "")) || 50;
    const yNum = Number(String(cur.yPct || "50%").replace("%", "")) || 50;
    const newX = Math.min(Math.max(0, xNum + dxPct), 100);
    const newY = Math.min(Math.max(0, yNum + dyPct), 100);
    pendingWmRef.current = { ...cur, xPct: `${newX}%`, yPct: `${newY}%` };
    if (watermarkElRef.current) {
      const dxPx = (dxPct / 100) * rect.width;
      const dyPx = (dyPct / 100) * rect.height;
      watermarkElRef.current.style.transform = `translate(${dxPx}px, ${dyPx}px)`;
    }
  }

  function watermarkStopDrag() {
    wmDragRef.current = null;
    if (watermarkElRef.current) {
      watermarkElRef.current.style.transform = "";
    }
    if (pendingWmRef.current) {
      emitWatermarkIfChanged(pendingWmRef.current);
      pendingWmRef.current = null;
    }
    window.removeEventListener("mousemove", watermarkOnDrag);
    window.removeEventListener("mouseup", watermarkStopDrag);
    window.removeEventListener("touchmove", watermarkOnDrag);
    window.removeEventListener("touchend", watermarkStopDrag);
  }

  function watermarkOnResize(ev) {
    if (!wmResizeRef.current) return;
    const state = wmResizeRef.current;
    const dx = ev.clientX - state.startX;
    const dy = ev.clientY - state.startY;
    let newLeft = state.startLeft;
    let newTop = state.startTop;
    let newW = state.startW;
    let newH = state.startH;
    if (state.corner === "se") {
      newW = state.startW + dx;
      newH = state.startH + dy;
    } else if (state.corner === "ne") {
      newW = state.startW + dx;
      newH = state.startH - dy;
      newTop = state.startTop + dy;
    } else if (state.corner === "sw") {
      newW = state.startW - dx;
      newH = state.startH + dy;
      newLeft = state.startLeft + dx;
    } else if (state.corner === "nw") {
      newW = state.startW - dx;
      newH = state.startH - dy;
      newLeft = state.startLeft + dx;
      newTop = state.startTop + dy;
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
    newW = Math.min(newW, state.rect.width - newLeft);
    newH = Math.min(newH, state.rect.height - newTop);
    const centerXpx = newLeft + newW / 2;
    const centerYpx = newTop + newH / 2;
    pendingWmRef.current = {
      ...state.initial,
      xPct: `${(centerXpx / state.rect.width) * 100}%`,
      yPct: `${(centerYpx / state.rect.height) * 100}%`,
      wPct: `${(newW / state.rect.width) * 100}%`,
      hPct: `${(newH / state.rect.height) * 100}%`,
    };
    if (watermarkElRef.current) {
      const scale = newW / state.startW;
      watermarkElRef.current.style.transform = `translate(${newLeft - state.startLeft}px, ${newTop - state.startTop}px) scale(${scale})`;
    }
  }

  function watermarkStopResize() {
    wmResizeRef.current = null;
    if (watermarkElRef.current) {
      watermarkElRef.current.style.transform = "";
    }
    if (pendingWmRef.current) {
      emitWatermarkIfChanged(pendingWmRef.current);
      pendingWmRef.current = null;
    }
    window.removeEventListener("mousemove", watermarkOnResize);
    window.removeEventListener("mouseup", watermarkStopResize);
    window.removeEventListener("touchmove", watermarkOnResize);
    window.removeEventListener("touchend", watermarkStopResize);
  }

  function onWatermarkMouseDown(e) {
    if (!watermarkEditable) return;
    if (e.target?.dataset?.resize) return;
    e.stopPropagation();
    const rect = innerCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    wmDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      rect,
      initial: { ...(localWatermark || {}) },
    };
    pendingWmRef.current = null;
    window.addEventListener("mousemove", watermarkOnDrag);
    window.addEventListener("mouseup", watermarkStopDrag);
    window.addEventListener("touchmove", watermarkOnDrag, { passive: false });
    window.addEventListener("touchend", watermarkStopDrag);
  }

  function startWatermarkResize(e, corner) {
    if (!watermarkEditable) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = innerCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const localWm = localWatermark || {};
    const xNum = Number(String(localWm.xPct || "50%").replace("%", "")) || 50;
    const yNum = Number(String(localWm.yPct || "50%").replace("%", "")) || 50;
    const wNum = Number(String(localWm.wPct || "60%").replace("%", "")) || 60;
    const hNum = Number(String(localWm.hPct || "60%").replace("%", "")) || 60;
    const leftPx = ((xNum - wNum / 2) / 100) * rect.width;
    const topPx = ((yNum - hNum / 2) / 100) * rect.height;
    const wPx = (wNum / 100) * rect.width;
    const hPx = (hNum / 100) * rect.height;
    wmResizeRef.current = {
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: leftPx,
      startTop: topPx,
      startW: wPx,
      startH: hPx,
      rect,
      initial: { ...localWm },
    };
    pendingWmRef.current = null;
    window.addEventListener("mousemove", watermarkOnResize);
    window.addEventListener("mouseup", watermarkStopResize);
    window.addEventListener("touchmove", watermarkOnResize, { passive: false });
    window.addEventListener("touchend", watermarkStopResize);
  }

  const watermarkStyle = useMemo(() => {
    if (!localWatermark) return { display: "none" };
    const xNum =
      Number(String(localWatermark.xPct || "50%").replace("%", "")) || 50;
    const yNum =
      Number(String(localWatermark.yPct || "50%").replace("%", "")) || 50;
    const wNum =
      Number(String(localWatermark.wPct || "60%").replace("%", "")) || 60;
    const hNum =
      Number(String(localWatermark.hPct || "60%").replace("%", "")) || 60;
    const leftPct = xNum - wNum / 2;
    const topPct = yNum - hNum / 2;
    const leftPx = (leftPct / 100) * canvasWidthActual;
    const topPx = (topPct / 100) * canvasHeightActual;
    const wPx = (wNum / 100) * canvasWidthActual;
    const hPx = (hNum / 100) * canvasHeightActual;
    return {
      position: "absolute",
      left: leftPx,
      top: topPx,
      width: wPx,
      height: hPx,
      opacity:
        typeof localWatermark.opacity === "number"
          ? localWatermark.opacity
          : 0.12,
      pointerEvents: watermarkEditable ? "auto" : "none",
      cursor: watermarkEditable ? "move" : "default",
      userSelect: "none",
      touchAction: "none",
      objectFit: "contain",
      zIndex: 55,
    };
  }, [
    localWatermark,
    canvasWidthActual,
    canvasHeightActual,
    watermarkEditable,
  ]);

  function updateSelectedFieldTable(newTable) {
    if (!selectedId) return;

    setBoxes((prev) =>
      prev.map((b) =>
        String(b.id) === String(selectedId) ? { ...b, table: newTable } : b,
      ),
    );
  }

  return (
    <div className={styles["cte-root"]}>
      <div>
        <FieldPropertiesPanel
          selectedFieldId={selectedId}
          boxes={boxes}
          setSelectedFieldId={setSelectedId}
          updateSelectedFieldStyle={(next) => updateSelectedFieldStyle(next)}
          updateSelectedFieldTable={updateSelectedFieldTable}
          updateSelectedFieldContent={(next) =>
            updateSelectedFieldContent(next)
          }
          pageStyle={{ background: pageBackground }}
          updatePageStyle={(next) => updatePageStyle(next)}
          onUploadImage={onUploadImage}
        />
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
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: `${headerHeightPct}%`,
                borderBottom: "1px dashed rgba(0,0,0,0.06)",
                pointerEvents: "none",
                background: "transparent",
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: `${footerHeightPct}%`,
                borderTop: "1px dashed rgba(0,0,0,0.06)",
                pointerEvents: "none",
                background: "transparent",
              }}
            />

            {localWatermarkUrl && (
              <div
                style={watermarkStyle}
                onMouseDown={onWatermarkMouseDown}
                role={watermarkEditable ? "button" : undefined}
                aria-label="Watermark"
              >
                <img
                  src={localWatermarkUrl}
                  alt="watermark"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    pointerEvents: "none",
                    display: "block",
                    userSelect: "none",
                  }}
                />
                {watermarkEditable && (
                  <>
                    <div
                      data-resize="nw"
                      onMouseDown={(e) => startWatermarkResize(e, "nw")}
                      style={{
                        position: "absolute",
                        left: -6,
                        top: -6,
                        width: 12,
                        height: 12,
                        background: "#fff",
                        border: "1px solid #0f1724",
                        borderRadius: 2,
                        zIndex: 60,
                        touchAction: "none",
                        cursor: "nwse-resize",
                      }}
                      title="Resize (NW)"
                    />
                    <div
                      data-resize="ne"
                      onMouseDown={(e) => startWatermarkResize(e, "ne")}
                      style={{
                        position: "absolute",
                        right: -6,
                        top: -6,
                        width: 12,
                        height: 12,
                        background: "#fff",
                        border: "1px solid #0f1724",
                        borderRadius: 2,
                        zIndex: 60,
                        touchAction: "none",
                        cursor: "nesw-resize",
                      }}
                      title="Resize (NE)"
                    />
                    <div
                      data-resize="se"
                      onMouseDown={(e) => startWatermarkResize(e, "se")}
                      style={{
                        position: "absolute",
                        right: -6,
                        bottom: -6,
                        width: 12,
                        height: 12,
                        background: "#fff",
                        border: "1px solid #0f1724",
                        borderRadius: 2,
                        zIndex: 60,
                        touchAction: "none",
                        cursor: "nwse-resize",
                      }}
                      title="Resize (SE)"
                    />
                    <div
                      data-resize="sw"
                      onMouseDown={(e) => startWatermarkResize(e, "sw")}
                      style={{
                        position: "absolute",
                        left: -6,
                        bottom: -6,
                        width: 12,
                        height: 12,
                        background: "#fff",
                        border: "1px solid #0f1724",
                        borderRadius: 2,
                        zIndex: 60,
                        touchAction: "none",
                        cursor: "nesw-resize",
                      }}
                      title="Resize (SW)"
                    />
                  </>
                )}
              </div>
            )}

            {boxes.map((b) => {
              const parsePctNum = (val) => {
                try {
                  if (val === null || typeof val === "undefined") return 0;
                  const s = String(val).trim();
                  if (s.endsWith("%")) return Number(s.replace("%", "")) || 0;
                  const n = Number(s);
                  return Number.isFinite(n) ? n : 0;
                } catch (err) {
                  return 0;
                }
              };

              const rawYnum = parsePctNum(b.yPct);
              const rawHnum = parsePctNum(b.hPct || "0");

              const declaredArea = b.area || areaFromTopPct(rawYnum, rawHnum);

              const normalizedY =
                declaredArea === "body"
                  ? rawYnum
                  : clampToArea(rawYnum, rawHnum, declaredArea);

              const renderYPct = `${normalizedY}%`;

              const px = pctToPx(
                b.xPct,
                renderYPct,
                b.wPct,
                b.hPct,
                innerCanvasRef.current,
              );

              const pctToNumber = (val, total) => {
                if (val === null || typeof val === "undefined") return 0;
                const s = String(val).trim();
                if (s.endsWith("%"))
                  return (parseFloat(s.replace("%", "")) / 100) * total;
                const n = parseFloat(s);
                return Number.isFinite(n) ? n : 0;
              };

              const leftPx =
                typeof px.left === "number"
                  ? px.left
                  : pctToNumber(b.xPct || "0%", canvasWidthActual);

              const topPx =
                typeof px.top === "number"
                  ? px.top
                  : pctToNumber(
                      renderYPct || b.yPct || "0%",
                      canvasHeightActual,
                    );

              const widthPx =
                typeof px.width === "number"
                  ? px.width
                  : b.wPct
                    ? pctToNumber(b.wPct, canvasWidthActual)
                    : Math.max(160, canvasWidthActual * 0.2);

              const heightPx =
                typeof px.height === "number"
                  ? px.height
                  : b.hPct
                    ? pctToNumber(b.hPct, canvasHeightActual)
                    : Math.max(40, canvasHeightActual * 0.08);

              const kWidth = Math.max(1, widthPx);
              const kHeight = Math.max(1, heightPx);
              const kX = leftPx;
              const kY = topPx;

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
                    '.table-edit, .table-cell, [contenteditable="true"], input, textarea, select'
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
                    if (b.type === "logo" || b.type === "image")
                      openFilePickerForLogo(b.id);
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
