"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
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
  width = 794,
  selectedBoxId = null,
  pageStyle = { background: "transparent" },

  previewHeaderUrl,
  previewFooterUrl,
  previewWatermarkUrl,

  headerHeightPct = 15,
  footerHeightPct = 10,
  editableHeader = false,
  editableFooter = false,
  onHeaderChange = null,
  onFooterChange = null,
  initialHeaderProps = null,
  initialFooterProps = null,
}) {
  const resolvedHeaderProp = headerUrl ?? previewHeaderUrl ?? null;
  const resolvedFooterProp = footerUrl ?? previewFooterUrl ?? null;
  const resolvedWatermarkProp = watermarkUrl ?? previewWatermarkUrl ?? null;

  const a4Ratio = 297 / 210;
  const w = Number(width) || 794;
  const h = Math.round(w * a4Ratio);

  const previewRef = useRef(null);
  const headerSlotRef = useRef(null);
  const footerSlotRef = useRef(null);
  const [hoveredBoxId, setHoveredBoxId] = useState(null);

  const [localHeader, setLocalHeader] = useState(
    initialHeaderProps || {
      xPct: "50%",
      yPct: "50%",
      wPct: "100%",
      hPct: "100%",
    },
  );
  const [localFooter, setLocalFooter] = useState(
    initialFooterProps || {
      xPct: "50%",
      yPct: "50%",
      wPct: "100%",
      hPct: "100%",
    },
  );

  const pctToPx = (pct, size) =>
    (Number(String(pct).replace("%", "")) / 100) * size;
  const pxToPct = (px, size) => `${(px / size) * 100}%`;

  const resolveImgSrc = (src) => {
    if (!src || typeof src !== "string") return null;
    const s = src.trim();
    if (
      s.startsWith("blob:") ||
      s.startsWith("data:") ||
      /^https?:\/\//i.test(s)
    )
      return s;
    return s;
  };

  useEffect(() => {
    setLocalWatermark((cur) => ({
      xPct: watermarkProps?.xPct ?? cur.xPct,
      yPct: watermarkProps?.yPct ?? cur.yPct,
      wPct: watermarkProps?.wPct ?? cur.wPct,
      hPct: watermarkProps?.hPct ?? cur.hPct,
      opacity:
        typeof watermarkProps?.opacity === "number"
          ? watermarkProps.opacity
          : cur.opacity,
    }));
  }, [
    watermarkProps?.xPct,
    watermarkProps?.yPct,
    watermarkProps?.wPct,
    watermarkProps?.hPct,
    watermarkProps?.opacity,
  ]);

  const watermarkDragState = useRef(null);
  const watermarkResizeState = useRef(null);

  const headerDragState = useRef(null);
  const headerResizeState = useRef(null);
  const footerDragState = useRef(null);
  const footerResizeState = useRef(null);

  function startWatermarkDrag(e) {
    if (!editable || !previewRef.current) return;
    if (e.target?.dataset?.resize) return;
    e.preventDefault();
    const rect = previewRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    const startLeft =
      pctToPx(localWatermark.xPct, rect.width) -
      pctToPx(localWatermark.wPct, rect.width) / 2;
    const startTop =
      pctToPx(localWatermark.yPct, rect.height) -
      pctToPx(localWatermark.hPct, rect.height) / 2;
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
    const wPx = pctToPx(localWatermark.wPct, rect.width);
    const hPx = pctToPx(localWatermark.hPct, rect.height);
    newLeft = Math.max(0, Math.min(newLeft, rect.width - wPx));
    newTop = Math.max(0, Math.min(newTop, rect.height - hPx));
    const centerXpx = newLeft + wPx / 2;
    const centerYpx = newTop + hPx / 2;
    emitWatermarkIfChanged({
      xPct: pxToPct(centerXpx, rect.width),
      yPct: pxToPct(centerYpx, rect.height),
      wPct: localWatermark.wPct,
      hPct: localWatermark.hPct,
      opacity: localWatermark.opacity,
    });
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
      pctToPx(localWatermark.xPct, rect.width) -
      pctToPx(localWatermark.wPct, rect.width) / 2;
    const currentTop =
      pctToPx(localWatermark.yPct, rect.height) -
      pctToPx(localWatermark.hPct, rect.height) / 2;
    const currentW = pctToPx(localWatermark.wPct, rect.width);
    const currentH = pctToPx(localWatermark.hPct, rect.height);
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
    let newLeft = startLeft,
      newTop = startTop,
      newW = startW,
      newH = startH;
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
    emitWatermarkIfChanged({
      xPct: pxToPct(centerXpx, rect.width),
      yPct: pxToPct(centerYpx, rect.height),
      wPct: pxToPct(newW, rect.width),
      hPct: pxToPct(newH, rect.height),
      opacity: localWatermark.opacity,
    });
  }
  function watermarkStopResize() {
    watermarkResizeState.current = null;
    window.removeEventListener("mousemove", watermarkOnResize);
    window.removeEventListener("mouseup", watermarkStopResize);
    window.removeEventListener("touchmove", watermarkOnResize);
    window.removeEventListener("touchend", watermarkStopResize);
  }

  function startHeaderDrag(e) {
    if (!editableHeader || !headerSlotRef.current) return;
    e.preventDefault();
    const rect = headerSlotRef.current.getBoundingClientRect();
    const mouseX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const mouseY = e.clientY ?? (e.touches && e.touches[0].clientY);
    const currentXPct = pctToPx(localHeader.xPct, rect.width);
    const currentYPct = pctToPx(localHeader.yPct, rect.height);
    headerDragState.current = {
      startMouseX: mouseX,
      startMouseY: mouseY,
      startXPct: currentXPct,
      startYPct: currentYPct,
      rect,
    };
    document.addEventListener("mousemove", headerOnDrag);
    document.addEventListener("mouseup", headerStopDrag);
    document.addEventListener("touchmove", headerOnDrag, { passive: false });
    document.addEventListener("touchend", headerStopDrag);
  }

  function headerOnDrag(ev) {
    if (!headerDragState.current) return;
    if (ev.type === "touchmove") ev.preventDefault();
    const clientX = ev.clientX ?? (ev.touches && ev.touches[0].clientX);
    const clientY = ev.clientY ?? (ev.touches && ev.touches[0].clientY);
    const { startMouseX, startMouseY, startXPct, startYPct, rect } =
      headerDragState.current;
    const deltaX = clientX - startMouseX;
    const deltaY = clientY - startMouseY;
    const newXPct = Math.max(0, Math.min(rect.width, startXPct + deltaX));
    const newYPct = Math.max(0, Math.min(rect.height, startYPct + deltaY));
    const newXPctStr = pxToPct(newXPct, rect.width);
    const newYPctStr = pxToPct(newYPct, rect.height);
    setLocalHeader((prev) => ({ ...prev, xPct: newXPctStr, yPct: newYPctStr }));
  }

  function headerStopDrag() {
    if (onHeaderChange) {
      onHeaderChange(localHeader);
    }
    headerDragState.current = null;
    document.removeEventListener("mousemove", headerOnDrag);
    document.removeEventListener("mouseup", headerStopDrag);
    document.removeEventListener("touchmove", headerOnDrag);
    document.removeEventListener("touchend", headerStopDrag);
  }

  function startHeaderResize(e, corner) {
    if (!editableHeader || !headerSlotRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = headerSlotRef.current.getBoundingClientRect();
    headerResizeState.current = {
      corner,
      startMouseX: e.clientX ?? (e.touches && e.touches[0].clientX),
      startMouseY: e.clientY ?? (e.touches && e.touches[0].clientY),
      startWidth: pctToPx(localHeader.wPct, rect.width),
      startHeight: pctToPx(localHeader.hPct, rect.height),
      startXPct: pctToPx(localHeader.xPct, rect.width),
      startYPct: pctToPx(localHeader.yPct, rect.height),
      rect,
    };
    document.addEventListener("mousemove", headerOnResize);
    document.addEventListener("mouseup", headerStopResize);
    document.addEventListener("touchmove", headerOnResize, { passive: false });
    document.addEventListener("touchend", headerStopResize);
  }

  function headerOnResize(ev) {
    if (!headerResizeState.current) return;
    if (ev.type === "touchmove") ev.preventDefault();
    const clientX = ev.clientX ?? (ev.touches && ev.touches[0].clientX);
    const clientY = ev.clientY ?? (ev.touches && ev.touches[0].clientY);
    const {
      corner,
      startMouseX,
      startMouseY,
      startWidth,
      startHeight,
      startXPct,
      startYPct,
      rect,
    } = headerResizeState.current;
    const deltaX = clientX - startMouseX;
    const deltaY = clientY - startMouseY;
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newXPct = startXPct;
    let newYPct = startYPct;
    if (corner.includes("e")) newWidth = Math.max(10, startWidth + deltaX);
    if (corner.includes("w")) {
      const dw = -deltaX;
      newWidth = Math.max(10, startWidth + dw);
      newXPct = startXPct + deltaX / 2;
    }
    if (corner.includes("s")) newHeight = Math.max(10, startHeight + deltaY);
    if (corner.includes("n")) {
      const dh = -deltaY;
      newHeight = Math.max(10, startHeight + dh);
      newYPct = startYPct + deltaY / 2;
    }
    newXPct = Math.max(0, Math.min(rect.width, newXPct));
    newYPct = Math.max(0, Math.min(rect.height, newYPct));
    newWidth = Math.min(newWidth, rect.width);
    newHeight = Math.min(newHeight, rect.height);
    const newWPct = pxToPct(newWidth, rect.width);
    const newHPct = pxToPct(newHeight, rect.height);
    const newXPctStr = pxToPct(newXPct, rect.width);
    const newYPctStr = pxToPct(newYPct, rect.height);
    setLocalHeader((prev) => ({
      ...prev,
      wPct: newWPct,
      hPct: newHPct,
      xPct: newXPctStr,
      yPct: newYPctStr,
    }));
  }

  function headerStopResize() {
    if (onHeaderChange) {
      onHeaderChange(localHeader);
    }
    headerResizeState.current = null;
    document.removeEventListener("mousemove", headerOnResize);
    document.removeEventListener("mouseup", headerStopResize);
    document.removeEventListener("touchmove", headerOnResize);
    document.removeEventListener("touchend", headerStopResize);
  }

  function startFooterDrag(e) {
    if (!editableFooter || !footerSlotRef.current) return;
    e.preventDefault();
    const rect = footerSlotRef.current.getBoundingClientRect();
    const mouseX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const mouseY = e.clientY ?? (e.touches && e.touches[0].clientY);
    const currentXPct = pctToPx(localFooter.xPct, rect.width);
    const currentYPct = pctToPx(localFooter.yPct, rect.height);
    footerDragState.current = {
      startMouseX: mouseX,
      startMouseY: mouseY,
      startXPct: currentXPct,
      startYPct: currentYPct,
      rect,
    };
    document.addEventListener("mousemove", footerOnDrag);
    document.addEventListener("mouseup", footerStopDrag);
    document.addEventListener("touchmove", footerOnDrag, { passive: false });
    document.addEventListener("touchend", footerStopDrag);
  }

  function footerOnDrag(ev) {
    if (!footerDragState.current) return;
    if (ev.type === "touchmove") ev.preventDefault();
    const clientX = ev.clientX ?? (ev.touches && ev.touches[0].clientX);
    const clientY = ev.clientY ?? (ev.touches && ev.touches[0].clientY);
    const { startMouseX, startMouseY, startXPct, startYPct, rect } =
      footerDragState.current;
    const deltaX = clientX - startMouseX;
    const deltaY = clientY - startMouseY;
    const newXPct = Math.max(0, Math.min(rect.width, startXPct + deltaX));
    const newYPct = Math.max(0, Math.min(rect.height, startYPct + deltaY));
    const newXPctStr = pxToPct(newXPct, rect.width);
    const newYPctStr = pxToPct(newYPct, rect.height);
    setLocalFooter((prev) => ({ ...prev, xPct: newXPctStr, yPct: newYPctStr }));
  }

  function footerStopDrag() {
    if (onFooterChange) {
      onFooterChange(localFooter);
    }
    footerDragState.current = null;
    document.removeEventListener("mousemove", footerOnDrag);
    document.removeEventListener("mouseup", footerStopDrag);
    document.removeEventListener("touchmove", footerOnDrag);
    document.removeEventListener("touchend", footerStopDrag);
  }

  function startFooterResize(e, corner) {
    if (!editableFooter || !footerSlotRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = footerSlotRef.current.getBoundingClientRect();
    footerResizeState.current = {
      corner,
      startMouseX: e.clientX ?? (e.touches && e.touches[0].clientX),
      startMouseY: e.clientY ?? (e.touches && e.touches[0].clientY),
      startWidth: pctToPx(localFooter.wPct, rect.width),
      startHeight: pctToPx(localFooter.hPct, rect.height),
      startXPct: pctToPx(localFooter.xPct, rect.width),
      startYPct: pctToPx(localFooter.yPct, rect.height),
      rect,
    };
    document.addEventListener("mousemove", footerOnResize);
    document.addEventListener("mouseup", footerStopResize);
    document.addEventListener("touchmove", footerOnResize, { passive: false });
    document.addEventListener("touchend", footerStopResize);
  }

  function footerOnResize(ev) {
    if (!footerResizeState.current) return;
    if (ev.type === "touchmove") ev.preventDefault();
    const clientX = ev.clientX ?? (ev.touches && ev.touches[0].clientX);
    const clientY = ev.clientY ?? (ev.touches && ev.touches[0].clientY);
    const {
      corner,
      startMouseX,
      startMouseY,
      startWidth,
      startHeight,
      startXPct,
      startYPct,
      rect,
    } = footerResizeState.current;
    const deltaX = clientX - startMouseX;
    const deltaY = clientY - startMouseY;
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newXPct = startXPct;
    let newYPct = startYPct;
    if (corner.includes("e")) newWidth = Math.max(10, startWidth + deltaX);
    if (corner.includes("w")) {
      const dw = -deltaX;
      newWidth = Math.max(10, startWidth + dw);
      newXPct = startXPct + deltaX / 2;
    }
    if (corner.includes("s")) newHeight = Math.max(10, startHeight + deltaY);
    if (corner.includes("n")) {
      const dh = -deltaY;
      newHeight = Math.max(10, startHeight + dh);
      newYPct = startYPct + deltaY / 2;
    }
    newXPct = Math.max(0, Math.min(rect.width, newXPct));
    newYPct = Math.max(0, Math.min(rect.height, newYPct));
    newWidth = Math.min(newWidth, rect.width);
    newHeight = Math.min(newHeight, rect.height);
    const newWPct = pxToPct(newWidth, rect.width);
    const newHPct = pxToPct(newHeight, rect.height);
    const newXPctStr = pxToPct(newXPct, rect.width);
    const newYPctStr = pxToPct(newYPct, rect.height);
    setLocalFooter((prev) => ({
      ...prev,
      wPct: newWPct,
      hPct: newHPct,
      xPct: newXPctStr,
      yPct: newYPctStr,
    }));
  }

  function footerStopResize() {
    if (onFooterChange) {
      onFooterChange(localFooter);
    }
    footerResizeState.current = null;
    document.removeEventListener("mousemove", footerOnResize);
    document.removeEventListener("mouseup", footerStopResize);
    document.removeEventListener("touchmove", footerOnResize);
    document.removeEventListener("touchend", footerStopResize);
  }

  const boxDragState = useRef(null);
  const boxResizeState = useRef(null);

  const isDraggingRef = useRef(false);
  const dragThreshold = 3;

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

    isDraggingRef.current = false;

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

    if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
      isDraggingRef.current = true;
    }

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
      try {
        onBoxesChange(
          (bodyBoxes || []).map((b) => (b.id === id ? nextBox : b)),
        );
      } catch (e) {
        console.warn("onBoxesChange threw", e);
      }
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
    let newLeft = startLeft,
      newTop = startTop,
      newW = startW,
      newH = startH;
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
      try {
        onBoxesChange(
          (bodyBoxes || []).map((b) => (b.id === id ? nextBox : b)),
        );
      } catch (e) {
        console.warn("onBoxesChange threw", e);
      }
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

  useEffect(() => {
    const handleGlobalClick = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("click", handleGlobalClick);

    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const resolvedHeader = resolveImgSrc(resolvedHeaderProp);
  const resolvedFooter = resolveImgSrc(resolvedFooterProp);
  const resolvedWatermark = resolveImgSrc(resolvedWatermarkProp);

  const headerPct = Number(String(headerHeightPct).replace("%", "")) || 15;
  const footerPct = Number(String(footerHeightPct).replace("%", "")) || 10;
  const bodyPct = Math.max(2, 100 - headerPct - footerPct);
  const gridTemplateRows = `${headerPct}% ${bodyPct}% ${footerPct}%`;

  const bodyCenterYPct = headerPct + bodyPct / 2;

  const defaultWm = {
    xPct: (watermarkProps && watermarkProps.xPct) || "50%",
    yPct: (watermarkProps && watermarkProps.yPct) || "55%",
    wPct: (watermarkProps && watermarkProps.wPct) || "60%",
    hPct: (watermarkProps && watermarkProps.hPct) || "60%",
    opacity:
      watermarkProps && typeof watermarkProps.opacity === "number"
        ? watermarkProps.opacity
        : 0.12,
  };
  const [localWatermark, setLocalWatermark] = useState(defaultWm);

  const prevWmRef = useRef(JSON.stringify(localWatermark));
  const emitWatermarkIfChanged = useCallback(
    (next) => {
      const sNext = JSON.stringify(next || {});
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
    const leftPx = (leftPct / 100) * w;
    const topPx = (topPct / 100) * h;
    const wPx = (wNum / 100) * w;
    const hPx = (hNum / 100) * h;
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
      pointerEvents: editable ? "auto" : "none",
      cursor: editable ? "move" : "default",
      userSelect: "none",
      touchAction: "none",
      objectFit: "contain",
      zIndex: 55,
    };
  }, [localWatermark, w, h, editable]);

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
            background: pageStyle?.background || "transparent",
            gridTemplateRows,
          }}
        >
          <div
            className={styles.headerSlot}
            ref={headerSlotRef}
            style={{
              position: "relative",
              overflow: "hidden",
              border: "1px dashed #ccc",
            }}
            aria-hidden
          >
            {resolvedHeader ? (
              <div
                style={{
                  position: "absolute",
                  top: localHeader.yPct,
                  left: localHeader.xPct,
                  transform: "translate(-50%, -50%)",
                  width: localHeader.wPct,
                  height: localHeader.hPct,
                  cursor: editableHeader ? "move" : "default",
                }}
                onMouseDown={editableHeader ? startHeaderDrag : undefined}
                onTouchStart={editableHeader ? startHeaderDrag : undefined}
              >
                <img
                  src={resolvedHeader}
                  alt="Header preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                />
                {editableHeader && (
                  <>
                    <div
                      data-resize="nw"
                      onMouseDown={(e) => startHeaderResize(e, "nw")}
                      onTouchStart={(e) => startHeaderResize(e, "nw")}
                      style={handleStyle("nw")}
                      title="Resize (NW)"
                    />
                    <div
                      data-resize="ne"
                      onMouseDown={(e) => startHeaderResize(e, "ne")}
                      onTouchStart={(e) => startHeaderResize(e, "ne")}
                      style={handleStyle("ne")}
                      title="Resize (NE)"
                    />
                    <div
                      data-resize="se"
                      onMouseDown={(e) => startHeaderResize(e, "se")}
                      onTouchStart={(e) => startHeaderResize(e, "se")}
                      style={handleStyle("se")}
                      title="Resize (SE)"
                    />
                    <div
                      data-resize="sw"
                      onMouseDown={(e) => startHeaderResize(e, "sw")}
                      onTouchStart={(e) => startHeaderResize(e, "sw")}
                      style={handleStyle("sw")}
                      title="Resize (SW)"
                    />
                  </>
                )}
              </div>
            ) : (
              <div
                className={styles.slotPlaceholder}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                Header will appear here
              </div>
            )}
          </div>

          <div
            className={styles.bodySlot}
            aria-hidden="true"
            style={{ position: "relative", overflow: "hidden" }}
          >
            {resolvedWatermark && (
              <div
                style={watermarkStyle}
                onMouseDown={startWatermarkDrag}
                onTouchStart={startWatermarkDrag}
                role={editable ? "button" : undefined}
                aria-label="Watermark"
              >
                <img
                  src={resolvedWatermark}
                  alt="Watermark"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: localWatermark.opacity,
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
            )}

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
                const isSelected =
                  selectedBoxId && String(box.id) === String(selectedBoxId);
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
                  padding,
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
                    onClick={(e) => {
                      if (isDraggingRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }

                      if (typeof onSelectBox === "function") {
                        onSelectBox(box.id);
                      }
                    }}
                    onMouseDown={(e) => {
                      if (!boxesEditable) return;
                      startBoxDrag(e, box);
                    }}
                    onTouchStart={(e) => {
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
                    ) : isTable ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          overflow: "auto",
                        }}
                      >
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: box.style?.fontSize || 11,
                            border: `1px solid ${box.style?.borderColor || "rgba(0,0,0,0.08)"}`,
                          }}
                        >
                          <thead>
                            <tr>
                              {(box.tableHeaders || []).map((h, i) => (
                                <th
                                  key={i}
                                  style={{
                                    padding: 6,
                                    border: `1px solid ${box.style?.borderColor || "rgba(0,0,0,0.08)"}`,
                                    background:
                                      box.style?.headerBackground || "#f8fafc",
                                    color: box.style?.headerColor || "#0f1724",
                                    fontWeight: 600,
                                  }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(box.tableRows || []).map((r, ri) => (
                              <tr key={ri}>
                                {(box.tableHeaders || []).map((_, ci) => (
                                  <td
                                    key={ci}
                                    style={{
                                      padding: 6,
                                      border: `1px solid ${box.style?.borderColor || "rgba(0,0,0,0.08)"}`,
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {String(r[ci] ?? "")}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
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

          <div
            className={styles.footerSlot}
            ref={footerSlotRef}
            style={{
              position: "relative",
              overflow: "hidden",
              border: "1px dashed #ccc",
            }}
          >
            {resolvedFooter ? (
              <div
                style={{
                  position: "absolute",
                  top: localFooter.yPct,
                  left: localFooter.xPct,
                  transform: "translate(-50%, -50%)",
                  width: localFooter.wPct,
                  height: localFooter.hPct,
                  cursor: editableFooter ? "move" : "default",
                }}
                onMouseDown={editableFooter ? startFooterDrag : undefined}
                onTouchStart={editableFooter ? startFooterDrag : undefined}
              >
                <img
                  src={resolvedFooter}
                  alt="Footer preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                />
                {editableFooter && (
                  <>
                    <div
                      data-resize="nw"
                      onMouseDown={(e) => startFooterResize(e, "nw")}
                      onTouchStart={(e) => startFooterResize(e, "nw")}
                      style={handleStyle("nw")}
                      title="Resize (NW)"
                    />
                    <div
                      data-resize="ne"
                      onMouseDown={(e) => startFooterResize(e, "ne")}
                      onTouchStart={(e) => startFooterResize(e, "ne")}
                      style={handleStyle("ne")}
                      title="Resize (NE)"
                    />
                    <div
                      data-resize="se"
                      onMouseDown={(e) => startFooterResize(e, "se")}
                      onTouchStart={(e) => startFooterResize(e, "se")}
                      style={handleStyle("se")}
                      title="Resize (SE)"
                    />
                    <div
                      data-resize="sw"
                      onMouseDown={(e) => startFooterResize(e, "sw")}
                      onTouchStart={(e) => startFooterResize(e, "sw")}
                      style={handleStyle("sw")}
                      title="Resize (SW)"
                    />
                  </>
                )}
              </div>
            ) : (
              <div
                className={styles.slotPlaceholder}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                Footer will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
