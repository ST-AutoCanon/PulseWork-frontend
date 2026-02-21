"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import styles from "./CustomTemplateEditor.module.css";
import { PRESET_FIELDS } from "./templatePresets";

function ensureDataField(el, prefix = "field") {
  if (!el || !el.setAttribute) return;
  if (!el.getAttribute("data-field")) {
    el.setAttribute(
      "data-field",
      `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    );
  }
}

const createTableHtml = (rows = 3, cols = 4, opts = {}) => {
  const {
    header = true,
    border = true,
    cellPadding = 6,
    cellBackground = "transparent",
  } = opts;
  let html = `<table class="bte-table" style="width:100%; border-collapse:${
    border ? "collapse" : "separate"
  }; table-layout:fixed;" data-bte-table='true' data-rows="${rows}" data-cols="${cols}" data-header="${header}" data-border="${border}" data-cell-padding="${cellPadding}" data-cell-bg="${cellBackground}">`;
  if (header) {
    html += "<thead><tr>";
    for (let c = 0; c < cols; c++) {
      html += `<th class="table-cell" style="border:${
        border ? "1px solid #e6e9ef" : "none"
      }; padding:${cellPadding}px; vertical-align:top; min-height:20px;">Header</th>`;
    }
    html += "</tr></thead>";
  }
  html += "<tbody>";
  const bodyRows = header ? rows - 1 : rows;
  for (let r = 0; r < bodyRows; r++) {
    html += "<tr>";
    for (let c = 0; c < cols; c++) {
      html += `<td class="table-cell" style="border:${
        border ? "1px solid #e6e9ef" : "none"
      }; padding:${cellPadding}px; vertical-align:top; min-height:20px;"></td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table>";
  return html;
};

const BasicTemplateEditor = forwardRef(function BasicTemplateEditor(
  {
    initialHtml = "",
    onUploadImage,
    canvasWidthPx = 794,
    initialBodyType = null,
    initialHeaderHeightPx = null,
    initialFooterHeightPx = null,
    watermarkUrl = null,
    watermarkProps = {},
    watermarkEditable = false,
    onWatermarkChange = null,
    baseUrl = "/",
    onSelectField = null,
    selectedFieldId = null,
    onUpdateFieldStyle = null,
    onUpdateFieldContent = null,
    onBoxesChange = null,
  },
  ref,
) {
  const LOCK_LAYOUT = true;
  const A4_RATIO = 297 / 210;
  const canvasHeightPx = Math.round(canvasWidthPx * A4_RATIO);

  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const logoFileRef = useRef(null);
  const watermarkFileRef = useRef(null);

  const lastRequestedImageTargetRef = useRef(null);

  const [mode, setMode] = useState("select");
  const [pageBg, setPageBg] = useState("#ffffff");
  const [headerHeightPx, setHeaderHeightPx] = useState(
    typeof initialHeaderHeightPx === "number"
      ? initialHeaderHeightPx
      : Math.round(canvasHeightPx * 0.12),
  );
  const [footerHeightPx, setFooterHeightPx] = useState(
    typeof initialFooterHeightPx === "number"
      ? initialFooterHeightPx
      : Math.round(canvasHeightPx * 0.12),
  );

  const [localWatermark, setLocalWatermark] = useState({
    url: watermarkUrl || null,
    props: {
      xPct: watermarkProps.xPct ?? "50%",
      yPct: watermarkProps.yPct ?? "50%",
      wPct: watermarkProps.wPct ?? "60%",
      hPct: watermarkProps.hPct ?? null,
      opacity: watermarkProps.opacity ?? 0.12,
      rotate: watermarkProps.rotate ?? 0,
      scale: watermarkProps.scale ?? 1,
    },
  });

  const delegatedClickRef = useRef(null);

  useEffect(() => {
    setLocalWatermark((s) => ({
      ...s,
      url: watermarkUrl || null,
      props: {
        ...s.props,
        xPct: watermarkProps.xPct ?? s.props.xPct,
        yPct: watermarkProps.yPct ?? s.props.yPct,
        wPct: watermarkProps.wPct ?? s.props.wPct,
        hPct: watermarkProps.hPct ?? s.props.hPct,
        opacity: watermarkProps.opacity ?? s.props.opacity,
        rotate: watermarkProps.rotate ?? s.props.rotate,
        scale: watermarkProps.scale ?? s.props.scale,
      },
    }));
  }, [watermarkUrl, watermarkProps]);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "bte-selected-style";
    style.innerHTML = `
      .bte-selected { outline: 2px dashed rgba(17,94,202,0.85) !important; outline-offset: 2px; }
      .bte-content-editable[contenteditable="true"] { caret-color: auto; }
      .bte-table td { background: transparent; }
      .bte-footer-spacer { display:block; width:100% }
      .bte-img-clickable img { cursor: pointer; }
      .bte-table td:focus { outline: 1px dashed rgba(0,0,0,0.12); }
      .table-edit { outline: none; }
      .table-cell { min-height:16px; pointer-events:auto; cursor:text; }
      .page { box-sizing: border-box; } 
      .page .header-area, .page .footer-area { pointer-events: auto; }
      .bte-watermark { position:absolute; transform:translate(-50%,-50%); z-index:12; pointer-events:none; }
      .bte-watermark.editable { pointer-events:auto; }
      .bte-watermark .resize-handle { position:absolute; width:14px; height:14px; right:-8px; bottom:-8px; background:#fff; border:1px solid #ccc; border-radius:2px; cursor:se-resize; z-index:13;}
      .bte-watermark img { display:block; max-width:100%; height:auto; user-select:none; -webkit-user-drag:none;}
    `;
    document.head.appendChild(style);
    return () => document.getElementById("bte-selected-style")?.remove();
  }, []);

  useEffect(() => {
    const id = "bte-forced-size";
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const forced = document.createElement("style");
    forced.id = id;
    forced.textContent = `
      .page { width: ${canvasWidthPx}px !important; height: ${canvasHeightPx}px !important; max-width: ${canvasWidthPx}px !important; min-width: ${canvasWidthPx}px !important; position:relative; box-sizing:border-box; }
      .page * { box-sizing: border-box; }
      .page .header-area { min-height: ${headerHeightPx}px; height: ${headerHeightPx}px; }
      .page .footer-area { min-height: ${footerHeightPx}px; height: ${footerHeightPx}px; }
    `;
    document.head.appendChild(forced);
    return () => document.getElementById(id)?.remove();
  }, [canvasWidthPx, canvasHeightPx, headerHeightPx, footerHeightPx]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const existingPage = el.querySelector(".page") || el;
    if (existingPage && delegatedClickRef.current) {
      try {
        existingPage.removeEventListener("click", delegatedClickRef.current);
      } catch (e) {}
    }
    el.innerHTML = "";

    function normalizePage(pageEl) {
      if (!pageEl) return;
      pageEl.style.width = `${canvasWidthPx}px`;
      pageEl.style.height = `${canvasHeightPx}px`;
      pageEl.style.maxWidth = `${canvasWidthPx}px`;
      pageEl.style.minWidth = `${canvasWidthPx}px`;
      pageEl.style.margin = "0 auto";
      pageEl.style.boxSizing = "border-box";
      pageEl.style.position = pageEl.style.position || "relative";
      pageEl.style.background = "#fff";
    }

    function buildEmpty() {
      const page = document.createElement("div");
      page.className = "page";

      const header = document.createElement("div");
      header.className = "header-area bte-content-editable";
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.style.justifyContent = "center";
      header.setAttribute("data-field", "header");
      header.setAttribute("data-bte-type", "image-or-text");
      header.contentEditable = true;
      header.innerHTML =
        "<div style='opacity:.6'>Header (edit or double-click image)</div>";

      const body = document.createElement("div");
      body.className = "body-area";
      body.style.padding = "12px";
      body.style.minHeight = `${Math.max(40, canvasHeightPx - headerHeightPx - footerHeightPx)}px`;
      body.setAttribute("data-field", "body");

      const footer = document.createElement("div");
      footer.className = "footer-area bte-content-editable";
      footer.style.display = "flex";
      footer.style.alignItems = "center";
      footer.style.justifyContent = "center";
      footer.setAttribute("data-field", "footer");
      footer.setAttribute("data-bte-type", "text");
      footer.contentEditable = true;
      footer.innerHTML = "<div style='opacity:.6'>Footer (edit here)</div>";

      page.append(header, body, footer);
      return page;
    }

    if (!initialHtml || !initialHtml.trim()) {
      const page = buildEmpty();
      el.appendChild(page);
      normalizePage(page);
      setupEditableFields();
      discoverBodyBoxes();
      adjustFooters(true);
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(initialHtml, "text/html");

      const rawPage = doc.querySelector(".page") || doc.body;

      const headerNode =
        doc.querySelector('[data-field="header"]') ||
        doc.querySelector(".header-area") ||
        rawPage.querySelector("header");

      const footerNode =
        doc.querySelector('[data-field="footer"]') ||
        doc.querySelector(".footer-area") ||
        rawPage.querySelector("footer");

      let bodyNode =
        doc.querySelector('[data-field="body"]') ||
        doc.querySelector(".body-area") ||
        rawPage.querySelector("main");

      const page = buildEmpty();
      const header = page.querySelector(".header-area");
      const body = page.querySelector(".body-area");
      const footer = page.querySelector(".footer-area");

      if (headerNode && headerNode.innerHTML && headerNode.innerHTML.trim()) {
        header.innerHTML = headerNode.innerHTML;
      } else {
        const maybeHeader = rawPage.querySelector(".header-area, header");
        if (maybeHeader) header.innerHTML = maybeHeader.innerHTML;
      }

      if (footerNode && footerNode.innerHTML && footerNode.innerHTML.trim()) {
        footer.innerHTML = footerNode.innerHTML;
      } else {
        const maybeFooter = rawPage.querySelector(".footer-area, footer");
        if (maybeFooter) footer.innerHTML = maybeFooter.innerHTML;
      }

      if (bodyNode && bodyNode.innerHTML && bodyNode.innerHTML.trim()) {
        body.innerHTML = bodyNode.innerHTML;
      } else {
        const frag = document.createElement("div");
        Array.from(rawPage.children).forEach((ch) => {
          const isHeaderLike =
            ch.matches &&
            (ch.matches('[data-field="header"]') ||
              ch.matches(".header-area") ||
              ch.matches("header"));
          const isFooterLike =
            ch.matches &&
            (ch.matches('[data-field="footer"]') ||
              ch.matches(".footer-area") ||
              ch.matches("footer"));
          if (isHeaderLike || isFooterLike) return;
          if (ch.tagName && /^(SCRIPT|STYLE)$/i.test(ch.tagName)) return;
          frag.appendChild(ch.cloneNode(true));
        });
        if (frag.innerHTML && frag.innerHTML.trim()) {
          body.innerHTML = frag.innerHTML;
        } else {
          body.innerHTML =
            doc.body && doc.body.innerHTML ? doc.body.innerHTML : "";
        }
      }

      el.appendChild(page);
      normalizePage(page);
      setupEditableFields();
      discoverBodyBoxes();
      adjustFooters(true);
    } catch (err) {
      el.innerHTML = initialHtml;
      setTimeout(() => {
        setupEditableFields();
        discoverBodyBoxes();
        adjustFooters(true);
      }, 0);
    }
  }, [initialHtml, canvasWidthPx, headerHeightPx, footerHeightPx]);

  const selectField = (fieldId, elNode = null, triggerExternal = true) => {
    if (!elNode && fieldId) {
      const page = innerRef.current;
      elNode = page && page.querySelector(`[data-field="${fieldId}"]`);
    }
    clearSelection();
    if (elNode) elNode.classList && elNode.classList.add("bte-selected");
    if (triggerExternal && typeof onSelectField === "function") {
      try {
        onSelectField(fieldId);
      } catch (e) {
        console.warn("onSelectField threw", e);
      }
    }
  };

  const clearSelection = () => {
    const page = innerRef.current;
    if (!page) return;
    const cur = page.querySelector(".bte-selected");
    if (cur) cur.classList.remove("bte-selected");
    if (typeof onSelectField === "function") onSelectField(null);
  };

  useEffect(() => {
    if (!selectedFieldId) {
      clearSelection();
      return;
    }
    const page = innerRef.current;
    if (!page) return;
    const el = page.querySelector(`[data-field="${selectedFieldId}"]`);
    if (el) {
      Array.from(page.querySelectorAll(".bte-selected")).forEach((s) =>
        s.classList.remove("bte-selected"),
      );
      el.classList.add("bte-selected");
      try {
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      } catch (e) {}
    }
  }, [selectedFieldId]);

  function discoverBodyBoxes() {
    const page = innerRef.current;
    if (!page) return;
    const body = page.querySelector(".body-area") || page;
    const els = Array.from(body.querySelectorAll("[data-field]"));
    const boxes = els.map((el) => {
      const rect = el.getBoundingClientRect();
      const pageRect = page.getBoundingClientRect();
      const rel = {
        id: el.getAttribute("data-field"),
        type:
          el.getAttribute("data-type") ||
          el.getAttribute("data-bte-type") ||
          guessTypeFromNode(el),
        left: Math.max(0, rect.left - pageRect.left),
        top: Math.max(0, rect.top - pageRect.top),
        width: rect.width,
        height: rect.height,
        text: el.textContent || "",
        style: extractInlineStyle(el),
      };
      return rel;
    });
    if (typeof onBoxesChange === "function") {
      try {
        onBoxesChange(boxes);
      } catch (e) {
        console.warn("onBoxesChange threw", e);
      }
    }
    return boxes;
  }

  function guessTypeFromNode(el) {
    if (!el) return "text";
    if (el.querySelector && el.querySelector("img")) return "image";
    if (/table/i.test(el.tagName)) return "table";
    return "text";
  }

  function extractInlineStyle(el) {
    if (!el) return {};
    const cs = window.getComputedStyle(el);
    return {
      fontSize: cs.fontSize,
      color: cs.color,
      background: cs.backgroundColor,
      fontWeight: cs.fontWeight,
      textAlign: cs.textAlign,
      padding: cs.padding,
    };
  }

  function setupEditableFields() {
    const el = innerRef.current;
    if (!el) return;
    const page = el.querySelector(".page") || el;

    // remove previous delegated handler if present (clean up)
    try {
      if (delegatedClickRef.current) {
        page.removeEventListener("click", delegatedClickRef.current);
      }
    } catch (e) {}

    // ensure body-area has data-field so discovery/selection works reliably
    const bodyEl = page.querySelector(".body-area");
    if (bodyEl && !bodyEl.getAttribute("data-field")) {
      bodyEl.setAttribute("data-field", "body");
    }

    // add classes / contentEditable & other per-field initialization
    Array.from(page.querySelectorAll("[data-field]")).forEach((f) => {
      f.classList.add("bte-content-editable");
      const tag = f.tagName.toLowerCase();
      const isImage = !!(f.querySelector && f.querySelector("img"));
      const fieldName = (f.getAttribute("data-field") || "").toString();
      const editableText =
        /company|address|email|phone|footer|note|body|title/i.test(fieldName);
      const editableImage = /logo|image|photo/i.test(fieldName);

      if (isImage) {
        f.setAttribute("data-bte-type", "image");
        f.contentEditable = false;
        f.classList.add("bte-img-clickable");
        f.style.pointerEvents = editableImage ? "auto" : "none";
      } else {
        f.setAttribute("data-bte-type", "text");
        f.contentEditable = editableText ? true : false;
        f.style.pointerEvents = editableText ? "auto" : "none";
        if (f.contentEditable && !f.hasAttribute("tabindex"))
          f.setAttribute("tabindex", "0");
      }
    });

    Array.from(page.querySelectorAll("img")).forEach((img) => {
      const container = img.closest("[data-field]") || img.parentElement;
      if (container && !container.getAttribute("data-field"))
        ensureDataField(container, "imgwrap");
      const containerField =
        (container && container.getAttribute("data-field")) || "";
      const editableImage = /logo|image|photo/i.test(containerField);
      img.ondblclick = null;
      if (editableImage) {
        img.addEventListener("dblclick", (ev) => {
          ev.stopPropagation();
          const elToSelect = img.closest("[data-field]") || img;
          lastRequestedImageTargetRef.current = elToSelect;
          if (typeof onSelectField === "function") {
            try {
              onSelectField(elToSelect.getAttribute("data-field"));
            } catch (e) {}
          }
          openFilePickerForLogo();
        });
      }
    });

    // delegated click: keep a stable reference so we can remove it later
    const delegated = function delegatedHandler(ev) {
      const df = ev.target.closest("[data-field]");
      // If click is outside any data-field we let it bubble normally
      if (!df) {
        if (typeof onSelectField === "function") onSelectField(null);
        return;
      }

      // If in preview mode, ignore (do not block other handlers)
      if (mode === "preview") return;

      // We only prevent default/stopPropagation when we actively handle selection/focus,
      // otherwise we must not block outer UI (important).
      const dtype = df.getAttribute("data-bte-type");
      if (dtype === "text" && df.contentEditable) {
        // handle selection and focus
        try {
          selectField(df.getAttribute("data-field"), df, true);
        } catch (e) {}
        try {
          df.focus();
          const sel = window.getSelection();
          sel.removeAllRanges();
          const range = document.createRange();
          range.selectNodeContents(df);
          range.collapse(false);
          sel.addRange(range);
        } catch (err) {}
        ev.stopPropagation();
        ev.preventDefault();
      } else if (dtype === "image" && df.style.pointerEvents !== "none") {
        // select image field (click should also not bubble)
        try {
          selectField(df.getAttribute("data-field"), df, true);
        } catch (e) {}
        ev.stopPropagation();
        ev.preventDefault();
      } else {
        // For other types, we do not stop propagation so other UI can respond
        if (typeof onSelectField === "function") onSelectField(null);
        // intentionally do NOT call preventDefault/stopPropagation here
      }
    };

    delegatedClickRef.current = delegated;
    page.addEventListener("click", delegated);
  }

  function openFilePickerForLogo() {
    if (!logoFileRef.current) {
      const el = document.createElement("input");
      el.type = "file";
      el.accept = "image/*";
      el.style.display = "none";
      el.onchange = async (ev) => {
        const f = ev.target.files?.[0];
        if (f) await handleImageSelectedForField(f);
      };
      document.body.appendChild(el);
      logoFileRef.current = el;
    }
    try {
      logoFileRef.current.value = "";
    } catch (e) {}
    logoFileRef.current.click();
  }

  async function handleImageSelectedForField(file) {
    const page = innerRef.current;
    let target =
      lastRequestedImageTargetRef.current ||
      (page && page.querySelector(`[data-field="${selectedFieldId}"]`)) ||
      findLikelyLogo();
    lastRequestedImageTargetRef.current = null;
    if (!target) {
      alert("Select the logo/image area first.");
      return;
    }

    try {
      if (onUploadImage && typeof onUploadImage === "function") {
        const url = await onUploadImage(file);
        if (url) {
          applyImageToField(target, url);
          if (typeof onUpdateFieldContent === "function") {
            try {
              onUpdateFieldContent(target.getAttribute("data-field"), url);
            } catch (e) {}
          }
          discoverBodyBoxes();
          return;
        }
      }
    } catch (e) {
      console.warn("onUploadImage failed", e);
    }

    const url = URL.createObjectURL(file);
    applyImageToField(target, url);
    if (typeof onUpdateFieldContent === "function") {
      try {
        onUpdateFieldContent(target.getAttribute("data-field"), url);
      } catch (e) {}
    }
    discoverBodyBoxes();
  }

  function applyImageToField(target, url) {
    if (!target) return;
    if (target.tagName && target.tagName.toLowerCase() === "img") {
      target.src = url;
      return;
    }
    const img = target.querySelector && target.querySelector("img");
    if (img) {
      img.src = url;
      return;
    }
    const newImg = document.createElement("img");
    newImg.src = url;
    newImg.alt = "logo";
    newImg.style.maxWidth = "100%";
    newImg.style.height = "auto";
    target.insertBefore(newImg, target.firstChild);
  }

  function findLikelyLogo() {
    const el = innerRef.current;
    if (!el) return null;
    let node =
      el.querySelector('[data-field="logo"]') ||
      el.querySelector('[data-field^="logo"]') ||
      el.querySelector(".logo[data-field]") ||
      el.querySelector(".logo") ||
      el.querySelector("img");
    if (!node) return null;
    if (node.tagName && node.tagName.toLowerCase() === "img") {
      return node.closest("[data-field]") || node;
    }
    return node;
  }

  const watermarkRef = useRef(null);
  const dragStateRef = useRef(null);

  function updateLocalWatermark(next) {
    setLocalWatermark((cur) => {
      const merged = {
        url: cur.url,
        props: { ...cur.props, ...(next.props || {}) },
      };
      if (typeof next.url !== "undefined") merged.url = next.url;
      if (onWatermarkChange) {
        try {
          onWatermarkChange({ ...merged.props, url: merged.url });
        } catch (e) {
          console.warn("onWatermarkChange threw", e);
        }
      }
      return merged;
    });
  }

  function attachOrUpdateWatermark() {
    const el = innerRef.current;
    if (!el) return;
    const page = el.querySelector(".page");
    if (!page) return;

    if (!localWatermark.url) {
      const old = page.querySelector(".bte-watermark");
      if (old) old.remove();
      return;
    }

    let wm = page.querySelector(".bte-watermark");
    if (!wm) {
      wm = document.createElement("div");
      wm.className = "bte-watermark";
      wm.style.transform = "translate(-50%,-50%)";
      wm.style.position = "absolute";
      wm.style.zIndex = 12;
      page.appendChild(wm);
    }

    wm.style.left = localWatermark.props.xPct || "50%";
    wm.style.top = localWatermark.props.yPct || "50%";
    wm.style.opacity = String(localWatermark.props.opacity ?? 0.12);
    if (watermarkEditable) wm.classList.add("editable");
    else wm.classList.remove("editable");

    wm.innerHTML = "";
    const img = document.createElement("img");
    img.src = localWatermark.url;
    img.alt = "watermark";
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.display = "block";
    img.style.userSelect = "none";
    img.style.webkitUserDrag = "none";
    img.style.pointerEvents = "none";
    wm.appendChild(img);

    if (localWatermark.props.wPct) {
      wm.style.width = localWatermark.props.wPct;
      wm.style.height = "auto";
    } else if (localWatermark.props.hPct) {
      wm.style.height = localWatermark.props.hPct;
      wm.style.width = "auto";
    } else {
      wm.style.width = localWatermark.props.wPct || "60%";
    }

    img.style.transform = `rotate(${localWatermark.props.rotate || 0}deg) scale(${localWatermark.props.scale || 1})`;

    if (watermarkEditable) {
      let handle = wm.querySelector(".bte-wm-resize");
      if (!handle) {
        handle = document.createElement("div");
        handle.className = "bte-wm-resize";
        Object.assign(handle.style, {
          position: "absolute",
          right: "6px",
          bottom: "6px",
          width: "14px",
          height: "14px",
          background: "#fff",
          border: "1px solid #c8ccd6",
          borderRadius: "2px",
          cursor: "se-resize",
          zIndex: 30,
          boxSizing: "border-box",
        });
        wm.appendChild(handle);
      }

      function onPointerDown(ev) {
        ev.preventDefault();
        const rect = page.getBoundingClientRect();
        const start = {
          type: ev.currentTarget === handle ? "resize" : "drag",
          startX: ev.clientX,
          startY: ev.clientY,
          startLeftPx: parsePercentOrPx(
            wm.style.left || "50%",
            page.clientWidth,
          ),
          startTopPx: parsePercentOrPx(
            wm.style.top || "50%",
            page.clientHeight,
          ),
          startW: wm.clientWidth,
          startH: wm.clientHeight,
        };
        dragStateRef.current = start;

        const onPointerMove = (moveEv) => {
          if (!dragStateRef.current) return;
          const ds = dragStateRef.current;
          const dx = moveEv.clientX - ds.startX;
          const dy = moveEv.clientY - ds.startY;

          if (ds.type === "drag") {
            const newLeftPx = ds.startLeftPx + dx;
            const newTopPx = ds.startTopPx + dy;
            const xPct =
              Math.round((newLeftPx / page.clientWidth) * 10000) / 100;
            const yPct =
              Math.round((newTopPx / page.clientHeight) * 10000) / 100;
            wm.style.left = `${xPct}%`;
            wm.style.top = `${yPct}%`;
            updateLocalWatermark({
              props: { xPct: `${xPct}%`, yPct: `${yPct}%` },
            });
          } else {
            const newW = Math.max(24, ds.startW + dx);
            const wPct = Math.round((newW / page.clientWidth) * 10000) / 100;
            wm.style.width = `${wPct}%`;
            updateLocalWatermark({ props: { wPct: `${wPct}%` } });
          }
        };

        const onPointerUp = () => {
          dragStateRef.current = null;
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
      }

      wm.onpointerdown = onPointerDown;
      handle.onpointerdown = onPointerDown;
    } else {
      const handle = wm.querySelector(".bte-wm-resize");
      if (handle) handle.remove();
      wm.onpointerdown = null;
    }
  }

  function parsePercentOrPx(value, totalPx) {
    if (!value) return 0;
    if (typeof value === "string" && value.endsWith("%")) {
      const p = Number(value.replace("%", "")) || 0;
      return (p / 100) * totalPx;
    }
    return parseFloat(value) || 0;
  }

  useEffect(() => {
    attachOrUpdateWatermark();
  }, [localWatermark.url, localWatermark.props, watermarkEditable]);

  useEffect(() => {
    attachOrUpdateWatermark();
  }, [watermarkUrl, watermarkProps]);

  function convertTextNodesToEditable() {
    const el = innerRef.current;
    if (!el) return;
    const page = el.querySelector(".page") || el;
    const tags = [
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "strong",
      "em",
      "span",
      "label",
      "td",
      "th",
      "div",
    ];
    tags.forEach((tag) => {
      Array.from(page.querySelectorAll(tag)).forEach((node) => {
        if (
          node.querySelector &&
          node.querySelector("input, textarea, button, a")
        )
          return;
        const childElements = node.children ? node.children.length : 0;
        if (!node.getAttribute("data-field") && childElements <= 2)
          ensureDataField(node, "auto");
        if (!node.querySelector("img")) {
          node.classList.add("bte-content-editable");
          node.setAttribute("data-bte-type", "text");
          node.contentEditable = mode === "select";
          if (!node.hasAttribute("tabindex"))
            node.setAttribute("tabindex", "0");
        } else {
          node.setAttribute("data-bte-type", "image");
          node.contentEditable = false;
        }
      });
    });
  }

  function ensureTableCellsEditable() {
    const el = innerRef.current;
    if (!el) return;
    const page = el.querySelector(".page") || el;

    Array.from(page.querySelectorAll("tbody[data-field]")).forEach((tbody) => {
      Array.from(tbody.querySelectorAll("tr")).forEach((tr, rIdx) => {
        Array.from(tr.children).forEach((cell, cIdx) => {
          if (!cell.getAttribute("data-field")) {
            const parent = tbody.getAttribute("data-field") || "tbody";
            cell.setAttribute("data-field", `${parent}_r${rIdx}_c${cIdx}`);
          }
          cell.classList.add("bte-content-editable");
          cell.classList.add("table-cell");
          cell.setAttribute("data-bte-type", "text");
          cell.contentEditable = !LOCK_LAYOUT && mode === "select";
          if (!cell.hasAttribute("tabindex"))
            cell.setAttribute("tabindex", "0");
        });
      });
    });

    Array.from(page.querySelectorAll("thead th")).forEach((th) => {
      if (!th.getAttribute("data-field")) ensureDataField(th, "th");
      th.classList.add("bte-content-editable");
      th.classList.add("table-cell");
      th.setAttribute("data-bte-type", "text");
      th.contentEditable = !LOCK_LAYOUT && mode === "select";
      if (!th.hasAttribute("tabindex")) th.setAttribute("tabindex", "0");
    });
  }

  function adjustFooters(preserveAbsolute = true) {
    const el = innerRef.current;
    if (!el) return;
    const page = el.querySelector(".page") || el;
    if (!page) return;

    const all = Array.from(page.querySelectorAll("*"));
    const footers = all.filter((node) => {
      const cls = (node.className || "").toString();
      const df = (node.getAttribute && node.getAttribute("data-field")) || "";
      const cs = window.getComputedStyle(node);
      const isAbsoluteBottom =
        cs.position === "absolute" && cs.bottom !== "auto";
      const nameLooksLikeFooter = /footer|note|notes|terms/i.test(
        cls + " " + df,
      );
      return isAbsoluteBottom || nameLooksLikeFooter;
    });

    if (footers.length === 0) {
      const prev = page.querySelector(".bte-footer-spacer");
      prev && prev.remove();
      return;
    }

    setTimeout(() => {
      let maxH = 0;
      footers.forEach((f) => {
        try {
          const r = f.getBoundingClientRect();
          maxH = Math.max(maxH, Math.ceil(r.height || 0));
        } catch (e) {}
      });
      const needed = maxH + 48;
      let spacer = page.querySelector(".bte-footer-spacer");
      if (!spacer) {
        spacer = document.createElement("div");
        spacer.className = "bte-footer-spacer";
        page.appendChild(spacer);
      }
      spacer.style.height = needed + "px";

      footers.forEach((f) => {
        if (!f.getAttribute("data-field")) ensureDataField(f, "footer");
        if (preserveAbsolute) {
          f.style.position = "absolute";
          f.style.pointerEvents = "auto";
          f.style.zIndex = 20;
        } else {
          f.style.position = "relative";
          f.style.bottom = "auto";
        }
        if (!f.style.width || f.style.width === "") {
          f.style.width = f.style.width || `calc(100% - 36mm)`;
          f.style.margin = f.style.margin || "0 auto";
        }
        if (!f.classList.contains("bte-content-editable")) {
          f.classList.add("bte-content-editable");
          f.setAttribute("data-bte-type", "text");
          f.contentEditable = mode === "select";
          if (!f.hasAttribute("tabindex")) f.setAttribute("tabindex", "0");
        }
      });

      if (containerRef.current) {
        const cur =
          parseInt(containerRef.current.style.paddingBottom || "0", 10) || 0;
        containerRef.current.style.paddingBottom =
          Math.max(cur, needed + 40) + "px";
      }
    }, 12);
  }

  function applyStyleToField(fieldId, styleDelta = {}) {
    const page = innerRef.current;
    if (!page || !fieldId) return;
    const el = page.querySelector(`[data-field="${fieldId}"]`);
    if (!el) return;
    Object.keys(styleDelta).forEach((k) => {
      try {
        el.style[k] = styleDelta[k];
      } catch (e) {}
    });
    discoverBodyBoxes();
  }

  useImperativeHandle(ref, () => ({
    getHtml: () => {
      const el = innerRef.current;
      if (!el) return "";
      const page = el.querySelector(".page");
      return page ? page.outerHTML : el.innerHTML;
    },
    getData: () => {
      const el = innerRef.current;
      if (!el) return null;
      const page = el.querySelector(".page");
      const html = page ? page.outerHTML : el.innerHTML;
      return {
        html,
        meta: {
          savedAt: new Date().toISOString(),
          headerHeightPx,
          footerHeightPx,
          watermark: localWatermark.url,
          watermarkProps: localWatermark.props,
        },
      };
    },
  }));

  useEffect(() => {
    setTimeout(() => {
      convertTextNodesToEditable();
      ensureTableCellsEditable();
      setupEditableFields();
      discoverBodyBoxes();
      attachOrUpdateWatermark();
      adjustFooters(true);
    }, 50);
  }, []);

  useEffect(() => {
    if (!selectedFieldId || !onUpdateFieldStyle) return;
  }, [selectedFieldId, onUpdateFieldStyle]);

  return (
    <div
      className={styles["cte-root"]}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div className={styles["cte-toolbar"]} style={{ display: "none" }} />

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: "100%",
            maxWidth: canvasWidthPx + 40,
            border: "1px solid #e5e7eb",
            padding: 0,
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            ref={containerRef}
            style={{
              minHeight: canvasHeightPx,
              padding: 0,
              background: pageBg,
              paddingBottom: 20,
              display: "flex",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              ref={innerRef}
              style={{
                width: `${canvasWidthPx}px`,
                height: `${canvasHeightPx}px`,
                minHeight: canvasHeightPx,
                background: "#fff",
                position: "relative",
                overflow: "visible",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default BasicTemplateEditor;
