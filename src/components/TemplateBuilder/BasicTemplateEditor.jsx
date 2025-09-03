import React, { useEffect, useRef, useState } from "react";
import "./CustomTemplateEditor.css";

/*
 BasicTemplateEditor:
 - initialHtml: HTML string (full page or .page wrapper)
 - onSave({ html, savedAt })
 - onUploadImage(file) optional uploader -> URL
*/

const createTableHtml = (rows = 3, cols = 4, opts = {}) => {
  const {
    header = true,
    border = true,
    cellPadding = 6,
    cellBackground = "transparent",
  } = opts;
  // produce a table with explicit thead / tbody and cells that use the same
  // class names the editor expects ("table-cell") so handlers & CSS apply.
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
  const startRow = header ? 1 : 0;
  const bodyRows = header ? rows - 1 : rows;
  for (let r = 0; r < bodyRows; r++) {
    html += "<tr>";
    for (let c = 0; c < cols; c++) {
      html += `<td class="table-cell" style="border:${
        border ? "1px solid #e6e9ef" : "none"
      }; padding:${cellPadding}px; vertical-align:top; min-height:20px;">${""}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody>";

  html += "</table>";
  return html;
};

function ensureDataField(el, prefix = "field") {
  if (!el.getAttribute("data-field")) {
    el.setAttribute(
      "data-field",
      `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    );
  }
}

export default function BasicTemplateEditor({
  initialHtml = "",
  onSave = (payload) => console.log("Saved:", payload),
  onUploadImage,
}) {
  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedEl, setSelectedEl] = useState(null);
  const [mode, setMode] = useState("select"); // select | preview
  const [pageBg, setPageBg] = useState("#ffffff");
  const [editingTableMode, setEditingTableMode] = useState(null); // data-field id of table where single-click edits cells
  const lastRequestedImageTargetRef = useRef(null);

  // a small CSS injection for selection outlines and helpers
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
    `;
    document.head.appendChild(style);
    return () => document.getElementById("bte-selected-style")?.remove();
  }, []);

  // Inject HTML into the innerRef (prefer .page element if present)
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.innerHTML = "";

    function normalizePage(pageEl) {
      if (!pageEl) return;
      const inlineWidth =
        pageEl.style.width || pageEl.getAttribute("width") || "";
      if (!inlineWidth) {
        pageEl.style.width = "100%";
        pageEl.style.maxWidth = "900px";
        pageEl.style.margin = "0 auto";
      } else {
        pageEl.style.margin = pageEl.style.margin || "0 auto";
      }
      pageEl.style.boxSizing = "border-box";
      pageEl.style.position = pageEl.style.position || "relative";
    }

    if (!initialHtml || !initialHtml.trim()) {
      const page = document.createElement("div");
      page.className = "page";
      page.style.width = "100%";
      page.style.minHeight = "640px";
      page.style.position = "relative";
      page.style.boxSizing = "border-box";
      el.appendChild(page);
      normalizePage(page);
      setupEditableFields();
      adjustFooters(true);
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(initialHtml, "text/html");
      const page = doc.querySelector(".page") || doc.body;
      // gather styles from head and inject so template CSS applies inside editor
      const headStyles = Array.from(doc.querySelectorAll("style"))
        .map((s) => s.textContent)
        .join("\n");

      const pageClone = page.cloneNode(true);

      if (headStyles) {
        const s = document.createElement("style");
        s.textContent = headStyles;
        el.appendChild(s);
      }

      el.appendChild(pageClone);
      normalizePage(pageClone);

      // make bottom area available so footers aren't overlapped by UI chrome
      if (containerRef.current)
        containerRef.current.style.paddingBottom = "220px";
    } catch (err) {
      el.innerHTML = initialHtml;
    }

    // after insertion, set up editable fields, table editing etc.
    setTimeout(() => {
      setupEditableFields();
      convertTextNodesToEditable();
      ensureTableCellsEditable();
      adjustFooters(true);
    }, 0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHtml]);

  // Convert a set of tags to editable if they don't have data-field already
  function convertTextNodesToEditable() {
    const el = innerRef.current;
    if (!el) return;
    const page = el.querySelector(".page") || el;
    const tags = [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
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

  // Turn tbody[data-field] line_items and thead th and table td into individually editable cells
  function ensureTableCellsEditable() {
    const el = innerRef.current;
    if (!el) return;
    const page = el.querySelector(".page") || el;

    // tbody with data-field -> make each cell its own data-field and editable
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
          cell.contentEditable = mode === "select";
          if (!cell.hasAttribute("tabindex"))
            cell.setAttribute("tabindex", "0");
          // attach dblclick to edit
          attachCellHandlers(cell);
        });
      });
    });

    // thead th
    Array.from(page.querySelectorAll("thead th")).forEach((th, i) => {
      if (!th.getAttribute("data-field")) ensureDataField(th, "th");
      th.classList.add("bte-content-editable");
      th.classList.add("table-cell");
      th.setAttribute("data-bte-type", "text");
      th.contentEditable = mode === "select";
      if (!th.hasAttribute("tabindex")) th.setAttribute("tabindex", "0");
      attachCellHandlers(th);
    });

    // tables created by addTable contain marker data-bte-table="true"
    Array.from(page.querySelectorAll("table[data-bte-table='true']")).forEach(
      (table) => {
        // ensure each td has handlers
        Array.from(table.querySelectorAll("td, th")).forEach((td) => {
          td.classList.add("table-cell");
          attachCellHandlers(td);
        });
      }
    );
  }

  // attach dblclick handler to cells for editing (idempotent)
  function attachCellHandlers(cell) {
    if (!cell) return;
    if (cell._bteAttached) return;

    // mousedown early stopPropagation when table is in single-click edit mode
    const earlyMouseDown = (ev) => {
      try {
        const table = cell.closest("table[data-bte-table='true']");
        const tableDataField = table
          ?.closest("[data-field]")
          ?.getAttribute("data-field");
        if (editingTableMode && editingTableMode === tableDataField) {
          // stop ancestor click handlers from stealing focus
          ev.stopPropagation();
        }
      } catch (e) {}
    };

    cell.addEventListener("mousedown", earlyMouseDown);

    const dbl = (ev) => {
      ev.stopPropagation();
      if (mode === "preview") return;
      // make this cell editable and focus (temporarily)
      cell.contentEditable = true;
      cell.classList.add("table-edit");
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(cell);
        range.collapse(false);
        sel.addRange(range);
      } catch (e) {}
      // on blur commit:
      const onBlur = () => {
        cell.classList.remove("table-edit");
        cell.contentEditable = mode === "select";
        cell.removeEventListener("blur", onBlur);
      };
      cell.addEventListener("blur", onBlur);
      // focus in next tick to avoid race with other handlers
      setTimeout(() => cell.focus(), 0);
    };
    cell.addEventListener("dblclick", dbl);

    // single-click editing when editingTableMode is set to this table
    const click = (ev) => {
      const table = cell.closest("table[data-bte-table='true']");
      if (!table) return;
      const tableDataField = table
        .closest("[data-field]")
        ?.getAttribute("data-field");
      if (
        editingTableMode &&
        editingTableMode === tableDataField &&
        mode !== "preview"
      ) {
        // begin editing this cell
        // stop propagation so delegated page-click does not steal focus/selection
        ev.stopPropagation();
        cell.contentEditable = true;
        cell.classList.add("table-edit");
        // keep them editable while editingTableMode is enabled
        const onBlur = () => {
          // if editingTableMode is active, keep editable; otherwise revert
          if (!editingTableMode || editingTableMode !== tableDataField) {
            cell.contentEditable = mode === "select";
            cell.classList.remove("table-edit");
          }
          cell.removeEventListener("blur", onBlur);
        };
        cell.addEventListener("blur", onBlur);
        setTimeout(() => cell.focus(), 0);
      }
    };
    cell.addEventListener("click", click);

    // mark attached
    cell._bteAttached = true;
  }

  // delegated selection & image handling
  function setupEditableFields() {
    const el = innerRef.current;
    if (!el) return;
    const page = el.querySelector(".page") || el;

    // clear previous delegated click/handlers by re-creating page event handlers (simple approach)
    page.onclick = null;

    // ensure all nodes that have data-field are labelled editable
    Array.from(page.querySelectorAll("[data-field]")).forEach((f) => {
      f.classList.add("bte-content-editable");
      const tag = f.tagName.toLowerCase();
      if (tag === "img" || (f.querySelector && f.querySelector("img"))) {
        f.setAttribute("data-bte-type", "image");
        f.contentEditable = false;
        f.classList.add("bte-img-clickable");
      } else {
        f.setAttribute("data-bte-type", "text");
        f.contentEditable = mode === "select";
      }
      if (
        !f.hasAttribute("tabindex") &&
        f.getAttribute("data-bte-type") === "text"
      )
        f.setAttribute("tabindex", "0");
    });

    // make images double-clickable to upload
    Array.from(page.querySelectorAll("img")).forEach((img) => {
      // ensure wrapper has a data-field
      const container = img.closest("[data-field]") || img.parentElement;
      if (container && !container.getAttribute("data-field"))
        ensureDataField(container, "imgwrap");
      const dbl = (ev) => {
        ev.stopPropagation();
        const elToSelect = img.closest("[data-field]") || img;
        lastRequestedImageTargetRef.current = elToSelect;
        selectElement(elToSelect);
        openFilePickerForLogo();
      };
      // avoid multiple attaches: remove then add
      img.ondblclick = null;
      img.addEventListener("dblclick", dbl);
    });

    // delegated click for selecting nearest [data-field]
    page.addEventListener(
      "click",
      function delegated(ev) {
        const df = ev.target.closest("[data-field]");
        if (!df) {
          clearSelection();
          return;
        }
        if (mode === "preview") return;
        // If click originated from a cell and that cell is being edited (editingTableMode), do nothing here
        // (cells will stopPropagation themselves when appropriate)
        ev.stopPropagation();
        ev.preventDefault();
        selectElement(df);
        // if text, focus and put caret at end
        if (df.getAttribute("data-bte-type") === "text") {
          try {
            df.focus();
            const sel = window.getSelection();
            sel.removeAllRanges();
            const range = document.createRange();
            range.selectNodeContents(df);
            range.collapse(false);
            sel.addRange(range);
          } catch (err) {}
        }
      },
      { once: false }
    );
  }

  function selectElement(el) {
    if (!el) return;
    if (selectedEl && selectedEl !== el) {
      selectedEl.classList && selectedEl.classList.remove("bte-selected");
    }
    setSelectedEl(el);
    el.classList && el.classList.add("bte-selected");
    // if we select a table container, ensure table cells are setup and editingTableMode preserved
    if (el.querySelector && el.querySelector("table[data-bte-table='true']")) {
      ensureTableCellsEditable();
    }
  }

  function clearSelection() {
    if (!selectedEl) return;
    selectedEl.classList && selectedEl.classList.remove("bte-selected");
    setSelectedEl(null);
    setEditingTableMode((s) => s); // keep editing table mode as-is (no auto-turn-off)
  }

  // FOOTER handling: find footer-like nodes and add a spacer so absolute footer doesn't overlap editor chrome
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
        cls + " " + df
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

  // IMAGE upload
  function openFilePickerForLogo() {
    if (!fileInputRef.current) {
      const el = document.createElement("input");
      el.type = "file";
      el.accept = "image/*";
      el.style.display = "none";
      el.onchange = async (ev) => {
        const f = ev.target.files?.[0];
        if (f) await handleImageSelected(f);
      };
      document.body.appendChild(el);
      fileInputRef.current = el;
    }
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }

  async function handleImageSelected(file) {
    // pick target: lastRequestedImageTargetRef or selectedEl or try heuristic
    const el = innerRef.current;
    if (!el) return;
    let target =
      lastRequestedImageTargetRef.current || selectedEl || findLikelyLogo();
    if (!target) {
      return alert("Select the logo container first (click the logo region).");
    }
    lastRequestedImageTargetRef.current = null;

    try {
      if (onUploadImage && typeof onUploadImage === "function") {
        const url = await onUploadImage(file);
        if (url) {
          setImageOnSelected(target, url);
          return;
        }
      }
    } catch (err) {
      console.warn("onUploadImage failed", err);
    }
    const url = URL.createObjectURL(file);
    setImageOnSelected(target, url);
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
    if (node.tagName.toLowerCase() === "img") {
      return node.closest("[data-field]") || node;
    }
    return node;
  }

  function setImageOnSelected(target, url) {
    if (!target) return;
    if (target.tagName && target.tagName.toLowerCase() === "img") {
      target.src = url;
      selectElement(target.closest("[data-field]") || target);
      return;
    }
    const img = target.querySelector && target.querySelector("img");
    if (img) {
      img.src = url;
      selectElement(target);
      return;
    }
    const newImg = document.createElement("img");
    newImg.src = url;
    newImg.alt = "logo";
    newImg.style.maxWidth = "100%";
    newImg.style.height = "auto";
    target.insertBefore(newImg, target.firstChild);
    selectElement(target);
  }

  // ADD TABLE and table operations
  function addTable(rows = 3, cols = 4) {
    const wrapper =
      innerRef.current?.querySelector(".page") || innerRef.current;
    if (!wrapper) return;
    const container = document.createElement("div");
    const df = `table_${Date.now()}`;
    container.setAttribute("data-field", df);
    container.className = "bte-content-editable";
    container.style.margin = "8px 0";
    container.innerHTML = createTableHtml(rows, cols, {
      header: true,
      border: true,
    });
    // mark tbody with a data-field so per-cell data-field generation works
    const tbl = container.querySelector("table");
    if (tbl) {
      const tb = tbl.querySelector("tbody");
      if (tb) tb.setAttribute("data-field", df + "_tbody");
    }
    wrapper.appendChild(container);
    // run setup to attach handlers and mark cells editable
    setupEditableFields();
    ensureTableCellsEditable();
    selectElement(container);
    // open table edit in properties panel
    setEditingTableMode(df);
  }

  function getSelectedTableContainer() {
    if (!selectedEl) return null;
    // selectedEl might be cell or table - prefer the container that has data-bte-table
    if (
      selectedEl.getAttribute &&
      selectedEl.getAttribute("data-bte-table") === "true"
    ) {
      return selectedEl.closest("table[data-bte-table='true']")
        ? selectedEl
        : null;
    }
    const table =
      selectedEl.querySelector &&
      selectedEl.querySelector("table[data-bte-table='true']");
    if (table) return selectedEl;
    // otherwise, if selectedEl is a table wrapper (container with table inside)
    const tbl =
      selectedEl.closest && selectedEl.closest("table[data-bte-table='true']");
    if (tbl) return tbl.closest("[data-field]") || null;
    // lastly, try selecting a data-field container that contains a table
    const el = innerRef.current;
    const wrapper = el.querySelector(".page") || el;
    const container = wrapper.querySelector("[data-field^='table_']");
    return container || null;
  }

  function readTableMeta(container) {
    const table = container.querySelector("table[data-bte-table='true']");
    if (!table) return null;
    const rows =
      parseInt(
        table.getAttribute("data-rows") ||
          table.dataset.rows ||
          table.rows.length,
        10
      ) || table.rows.length;
    const cols = parseInt(
      table.getAttribute("data-cols") ||
        table.dataset.cols ||
        (table.rows[0] ? table.rows[0].cells.length : 0),
      10
    );
    const header =
      (table.getAttribute("data-header") ||
        table.dataset.header ||
        table.getAttribute("data-header") === "true") === "true" ||
      table.dataset.header === "true" ||
      (table.rows[0] &&
        Array.from(table.rows[0].cells).every(
          (c) => c.textContent.trim() !== ""
        ));
    const border =
      (table.getAttribute("data-border") || table.dataset.border) === "true" ||
      table.style.borderCollapse === "collapse";
    const cellPadding = parseInt(
      table.getAttribute("data-cell-padding") || table.dataset.cellPadding || 6,
      10
    );
    const cellBg =
      table.getAttribute("data-cell-bg") ||
      table.dataset.cellBg ||
      "transparent";
    return { table, rows, cols, header, border, cellPadding, cellBg };
  }

  function writeTableMeta(table, meta) {
    if (!table) return;
    if (typeof meta.rows !== "undefined")
      table.setAttribute("data-rows", meta.rows);
    if (typeof meta.cols !== "undefined")
      table.setAttribute("data-cols", meta.cols);
    if (typeof meta.header !== "undefined")
      table.setAttribute("data-header", !!meta.header);
    if (typeof meta.border !== "undefined")
      table.setAttribute("data-border", !!meta.border);
    if (typeof meta.cellPadding !== "undefined")
      table.setAttribute("data-cell-padding", meta.cellPadding);
    if (typeof meta.cellBackground !== "undefined")
      table.setAttribute("data-cell-bg", meta.cellBackground);
    // apply border/collapse/padding visually
    table.style.borderCollapse = meta.border ? "collapse" : "separate";
    Array.from(table.querySelectorAll("td, th")).forEach((cell) => {
      cell.style.border = meta.border ? "1px solid #e6e9ef" : "none";
      cell.style.padding = `${meta.cellPadding}px`;
      cell.style.background = meta.cellBackground || "transparent";
    });
  }

  function addTableRow(container) {
    if (!container) return;
    const meta = readTableMeta(container);
    if (!meta) return;
    const table = meta.table;
    const tr = document.createElement("tr");
    for (let c = 0; c < meta.cols; c++) {
      const td = document.createElement("td");
      td.style.border = meta.border ? "1px solid #e6e9ef" : "none";
      td.style.padding = `${meta.cellPadding}px`;
      td.style.verticalAlign = "top";
      td.style.minHeight = "20px";
      td.textContent = "";
      tr.appendChild(td);
    }
    table.appendChild(tr);
    const newRows = (meta.rows || table.rows.length) + 1;
    table.setAttribute("data-rows", newRows);
    ensureTableCellsEditable();
    selectElement(container);
  }

  function removeTableRow(container) {
    if (!container) return;
    const meta = readTableMeta(container);
    if (!meta) return;
    const table = meta.table;
    if (table.rows.length <= 1) return;
    table.deleteRow(-1);
    table.setAttribute(
      "data-rows",
      Math.max(0, (meta.rows || table.rows.length) - 1)
    );
    selectElement(container);
  }

  function addTableCol(container) {
    if (!container) return;
    const meta = readTableMeta(container);
    if (!meta) return;
    const table = meta.table;
    Array.from(table.rows).forEach((row) => {
      const td = document.createElement(
        row.rowIndex === 0 && meta.header ? "th" : "td"
      );
      td.style.border = meta.border ? "1px solid #e6e9ef" : "none";
      td.style.padding = `${meta.cellPadding}px`;
      td.style.verticalAlign = "top";
      td.style.minHeight = "20px";
      td.textContent = row.rowIndex === 0 && meta.header ? "Header" : "";
      row.appendChild(td);
      attachCellHandlers(td);
    });
    table.setAttribute("data-cols", meta.cols || table.rows[0].cells.length);
    selectElement(container);
  }

  function removeTableCol(container) {
    if (!container) return;
    const meta = readTableMeta(container);
    if (!meta) return;
    const table = meta.table;
    if (!table.rows[0] || table.rows[0].cells.length <= 1) return;
    Array.from(table.rows).forEach((row) => {
      row.deleteCell(-1);
    });
    table.setAttribute(
      "data-cols",
      Math.max(0, meta.cols || table.rows[0].cells.length)
    );
    selectElement(container);
  }

  function toggleTableHeader(container) {
    if (!container) return;
    const meta = readTableMeta(container);
    if (!meta) return;
    const table = meta.table;
    const isHeader = !meta.header;
    table.setAttribute("data-header", !!isHeader);
    // If enabling header and table has at least one row, convert first row cells to <th>
    if (isHeader && table.rows.length > 0) {
      const first = table.rows[0];
      Array.from(first.cells).forEach((cell, idx) => {
        const th = document.createElement("th");
        th.innerHTML = cell.innerHTML;
        th.style.cssText = cell.style.cssText;
        first.replaceChild(th, cell);
        attachCellHandlers(th);
      });
    } else if (!isHeader && table.rows.length > 0) {
      // convert th back to td
      const first = table.rows[0];
      Array.from(first.cells).forEach((cell) => {
        if (cell.tagName.toLowerCase() === "th") {
          const td = document.createElement("td");
          td.innerHTML = cell.innerHTML;
          td.style.cssText = cell.style.cssText;
          first.replaceChild(td, cell);
          attachCellHandlers(td);
        }
      });
    }
    ensureTableCellsEditable();
    selectElement(container);
  }

  function toggleTableBorder(container) {
    if (!container) return;
    const meta = readTableMeta(container);
    if (!meta) return;
    const table = meta.table;
    const newBorder = !meta.border;
    writeTableMeta(table, { border: newBorder });
    selectElement(container);
  }

  function setTableCellBackground(container, color) {
    if (!container) return;
    const meta = readTableMeta(container);
    if (!meta) return;
    const table = meta.table;
    writeTableMeta(table, { cellBackground: color });
    selectElement(container);
  }

  // remove selected element
  function deleteSelected() {
    if (!selectedEl) return;
    if (!window.confirm("Remove the selected element from the template?"))
      return;
    const next = selectedEl.nextSibling || selectedEl.previousSibling;
    selectedEl.remove();
    setSelectedEl(null);
    if (next && next.nodeType === 1) selectElement(next);
  }

  // save: prefer returning the .page outerHTML if present
  function save() {
    const el = innerRef.current;
    if (!el) return;
    const page = el.querySelector(".page");
    const html = page ? page.outerHTML : el.innerHTML;
    onSave({ html, savedAt: new Date().toISOString() });
  }

  // toggle preview
  function togglePreview() {
    const wrapper =
      innerRef.current?.querySelector(".page") || innerRef.current;
    if (!wrapper) return;
    if (mode === "preview") {
      // re-enable editing
      Array.from(wrapper.querySelectorAll("[data-field]")).forEach((f) => {
        if (f.getAttribute("data-bte-type") === "text")
          f.contentEditable = true;
      });
      wrapper.style.pointerEvents = "auto";
      setMode("select");
    } else {
      Array.from(wrapper.querySelectorAll("[data-field]")).forEach(
        (f) => (f.contentEditable = false)
      );
      wrapper.style.pointerEvents = "none";
      setMode("preview");
      setSelectedEl(null);
    }
  }

  // keyboard delete/backspace to clear selected element content or image
  useEffect(() => {
    const onKey = (ev) => {
      if (!selectedEl) return;
      if (ev.key === "Delete" || ev.key === "Backspace") {
        // if focus is inside an input/textarea or any contentEditable node, allow normal behavior
        const active = document.activeElement;
        if (
          active &&
          (active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.isContentEditable)
        ) {
          return;
        }
        ev.preventDefault();
        if (selectedEl.getAttribute("data-bte-type") === "image") {
          const img =
            selectedEl.tagName.toLowerCase() === "img"
              ? selectedEl
              : selectedEl.querySelector("img");
          if (img) img.src = "";
        } else {
          selectedEl.textContent = "";
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedEl]);

  // ---------- Render ----------
  // determine selected table container for property panel
  const selectedTableContainer =
    selectedEl &&
    (selectedEl.getAttribute("data-field") || "").startsWith("table_")
      ? selectedEl
      : selectedEl &&
        selectedEl.querySelector &&
        selectedEl.querySelector("table[data-bte-table='true']")
      ? selectedEl
      : null;

  // get table meta for UI state
  const selectedTableMeta = selectedTableContainer
    ? readTableMeta(selectedTableContainer)
    : null;

  return (
    <div
      className="cte-root"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      {/* Toolbar */}
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
            onClick={() => setMode("select")}
          >
            Select/Edit
          </button>
          <button
            className={mode === "preview" ? "active" : ""}
            onClick={togglePreview}
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
              value={pageBg}
              onChange={(e) => {
                setPageBg(e.target.value);
                const wrapper =
                  innerRef.current?.querySelector(".page") || innerRef.current;
                if (wrapper) wrapper.style.background = e.target.value;
              }}
              title="Set page background"
            />
            <button
              onClick={() => {
                setPageBg("transparent");
                const wrapper =
                  innerRef.current?.querySelector(".page") || innerRef.current;
                if (wrapper) wrapper.style.background = "transparent";
              }}
            >
              Clear BG
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={() => {
              const wrapper =
                innerRef.current?.querySelector(".page") || innerRef.current;
              if (!wrapper) return;
              const div = document.createElement("div");
              div.setAttribute("data-field", "custom_text_" + Date.now());
              div.className = "bte-content-editable";
              div.contentEditable = true;
              div.textContent = "New text";
              div.style.padding = "4px";
              wrapper.appendChild(div);
              setupEditableFields();
              selectElement(div);
            }}
          >
            Add Text
          </button>

          <button
            onClick={() => {
              const wrapper =
                innerRef.current?.querySelector(".page") || innerRef.current;
              if (!wrapper) return;
              const span = document.createElement("span");
              span.setAttribute(
                "data-field",
                "custom_placeholder_" + Date.now()
              );
              span.className = "bte-content-editable placeholder";
              span.contentEditable = true;
              span.textContent = "[[FIELD]]";
              wrapper.appendChild(span);
              setupEditableFields();
              selectElement(span);
            }}
          >
            Add Field
          </button>

          <button
            onClick={() => {
              const wrapper =
                innerRef.current?.querySelector(".page") || innerRef.current;
              if (!wrapper) return;
              const container = document.createElement("div");
              container.setAttribute("data-field", "logo_" + Date.now());
              container.style.textAlign = "right";
              const img = document.createElement("img");
              img.alt = "logo";
              img.style.maxWidth = "120px";
              img.style.height = "auto";
              container.appendChild(img);
              wrapper.appendChild(container);
              setupEditableFields();
              selectElement(container);
              lastRequestedImageTargetRef.current = container;
              openFilePickerForLogo();
            }}
          >
            Add Logo
          </button>

          <button
            onClick={() => {
              // attempt to auto-select a logo region if nothing selected
              if (!selectedEl) {
                const auto = findLikelyLogo();
                if (auto) selectElement(auto);
              }
              if (!selectedEl) return alert("Select an element first");
              if (selectedEl.getAttribute("data-bte-type") === "image") {
                lastRequestedImageTargetRef.current = selectedEl;
                openFilePickerForLogo();
              } else {
                alert("Selected element is not an image container");
              }
            }}
          >
            Upload Logo
          </button>

          <button onClick={() => deleteSelected()} disabled={!selectedEl}>
            Delete
          </button>

          <button onClick={() => addTable(3, 4)}>Add Table</button>

          <button onClick={save}>Save</button>
        </div>
      </div>

      {/* Properties panel */}
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
        {!selectedEl ? (
          <div style={{ color: "#6b7280" }}>
            Select an element inside the template to edit its properties.
          </div>
        ) : selectedTableContainer ? (
          // Table-specific controls
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              width: "100%",
            }}
          >
            <div style={{ minWidth: 140 }}>
              <div style={{ fontSize: 12 }}>Table rows / cols</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => addTableRow(selectedTableContainer)}>
                  + Row
                </button>
                <button onClick={() => removeTableRow(selectedTableContainer)}>
                  - Row
                </button>
                <button onClick={() => addTableCol(selectedTableContainer)}>
                  + Col
                </button>
                <button onClick={() => removeTableCol(selectedTableContainer)}>
                  - Col
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <label>
                <input
                  type="checkbox"
                  checked={!!(selectedTableMeta && selectedTableMeta.header)}
                  onChange={() => toggleTableHeader(selectedTableContainer)}
                />{" "}
                Header
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!(selectedTableMeta && selectedTableMeta.border)}
                  onChange={() => toggleTableBorder(selectedTableContainer)}
                />{" "}
                Border
              </label>
            </div>

            <div>
              <div style={{ fontSize: 12 }}>Cell BG</div>
              <input
                type="color"
                value={
                  (selectedTableMeta && selectedTableMeta.cellBg) || "#ffffff"
                }
                onChange={(e) =>
                  setTableCellBackground(selectedTableContainer, e.target.value)
                }
              />
            </div>

            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <label>
                <input
                  type="checkbox"
                  checked={
                    editingTableMode ===
                    selectedTableContainer.getAttribute("data-field")
                  }
                  onChange={(e) =>
                    setEditingTableMode(
                      e.target.checked
                        ? selectedTableContainer.getAttribute("data-field")
                        : null
                    )
                  }
                />{" "}
                Edit Cells (single click)
              </label>
            </div>
          </div>
        ) : (
          // generic text/image properties
          <>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 12 }}>Font</div>
              <select
                value={(selectedEl && selectedEl.style.fontFamily) || ""}
                onChange={(e) =>
                  applyStyleToSelected("fontFamily", e.target.value)
                }
              >
                <option value="">(inherited)</option>
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
                  defaultValue={parseInt(
                    (selectedEl &&
                      (selectedEl.style.fontSize ||
                        window.getComputedStyle(selectedEl).fontSize)) ||
                      "14px",
                    10
                  )}
                  onBlur={(e) =>
                    applyStyleToSelected("fontSize", `${e.target.value}px`)
                  }
                  style={{ width: 72 }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12 }}>Color</div>
                <input
                  type="color"
                  defaultValue={rgbToHex(
                    window.getComputedStyle(selectedEl).color
                  )}
                  onChange={(e) =>
                    applyStyleToSelected("color", e.target.value)
                  }
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => toggleBoldSelected()}>
                  {window.getComputedStyle(selectedEl).fontWeight === "700" ||
                  selectedEl.style.fontWeight === "700"
                    ? "Unbold"
                    : "Bold"}
                </button>
                <button onClick={() => toggleItalicSelected()}>
                  {window.getComputedStyle(selectedEl).fontStyle === "italic" ||
                  selectedEl.style.fontStyle === "italic"
                    ? "Unitalic"
                    : "Italic"}
                </button>
              </div>

              <div>
                <div style={{ fontSize: 12 }}>Align</div>
                <select
                  defaultValue={
                    window.getComputedStyle(selectedEl).textAlign || "left"
                  }
                  onChange={(e) =>
                    applyStyleToSelected("textAlign", e.target.value)
                  }
                >
                  <option value="">(inherited)</option>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Canvas */}
      <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            border: "1px solid #e5e7eb",
            padding: 8,
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            ref={containerRef}
            style={{
              minHeight: 640,
              padding: 12,
              background: pageBg,
              paddingBottom: 220,
            }}
          >
            <div ref={innerRef} style={{ width: "100%", minHeight: 640 }} />
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------- helper functions for props panel ----------------
  function applyStyleToSelected(prop, value) {
    if (!selectedEl) return;
    selectedEl.style[prop] = value;
  }
  function toggleBoldSelected() {
    if (!selectedEl) return;
    const cur =
      selectedEl.style.fontWeight ||
      window.getComputedStyle(selectedEl).fontWeight ||
      "400";
    selectedEl.style.fontWeight =
      cur === "700" || cur === "bold" ? "400" : "700";
  }
  function toggleItalicSelected() {
    if (!selectedEl) return;
    const cur =
      selectedEl.style.fontStyle ||
      window.getComputedStyle(selectedEl).fontStyle ||
      "normal";
    selectedEl.style.fontStyle = cur === "italic" ? "normal" : "italic";
  }

  // rgb->hex helper
  function rgbToHex(rgb) {
    if (!rgb) return "#000000";
    const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return "#000000";
    const r = parseInt(m[1], 10),
      g = parseInt(m[2], 10),
      b = parseInt(m[3], 10);
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
}
