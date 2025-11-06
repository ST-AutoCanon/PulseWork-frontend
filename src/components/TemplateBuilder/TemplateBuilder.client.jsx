"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import BasicTemplateEditor from "./BasicTemplateEditor.client";
import CustomTemplateEditor from "./CustomTemplateEditor.client";
import UploadScan from "./UploadScan.client";
import A4Preview from "./A4Preview";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";
import styles from "./TemplateBuilder.module.css";
import ProtectedImg from "./ProtectedImg.client";

// (Your DOC_CATEGORIES, SAVED_CATEGORIES, inferCategory, textFromHtml, templateToBoxes
//  and fetchProtectedImage implementations remain unchanged — truncated here for brevity)
// For completeness I include them as in your file:

const DOC_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "invoices", label: "Invoices" },
  { key: "letterheads", label: "Letterheads" },
  { key: "reimbursements", label: "Reimbursements" },
  { key: "receipts", label: "Receipts" },
];

const SAVED_CATEGORIES = [
  { key: "all", label: "All saved" },
  { key: "saved_uploads", label: "Uploads" },
  { key: "saved_scratch", label: "Scratch" },
  { key: "saved_basic", label: "Basic" },
];

function inferCategory(entry) {
  const t =
    (entry && (entry.template_type || entry.templateType || entry.type)) || "";
  const lowerType = String(t).toLowerCase();

  if (lowerType === "scan") return "saved_uploads";
  if (lowerType === "custom" || lowerType === "scratch") return "saved_scratch";
  if (lowerType === "generic" || lowerType === "basic") return "saved_basic";

  const s =
    (entry.id || "") + " " + (entry.file || "") + " " + (entry.name || "");
  const lower = s.toLowerCase();
  if (/\binvoice\b/.test(lower) || lower.includes("invoice")) return "invoices";
  if (/\bletterhead\b/.test(lower) || lower.includes("letterhead"))
    return "letterheads";
  if (
    /\breimburse\b/.test(lower) ||
    /\bexpense\b/.test(lower) ||
    lower.includes("reimbursement")
  )
    return "reimbursements";
  if (/\breceipt\b/.test(lower) || lower.includes("receipt")) return "receipts";
  return "others";
}

function textFromHtml(html = "") {
  try {
    const p = new DOMParser().parseFromString(html || "", "text/html");
    return p.body ? p.body.textContent || "" : html;
  } catch (e) {
    return html;
  }
}

function templateToBoxes(template) {
  let content = "";
  if (template?.html && String(template.html).trim()) {
    content = textFromHtml(template.html);
  } else if (
    template?.grapesJson &&
    Array.isArray(template.grapesJson.components)
  ) {
    const parts = template.grapesJson.components
      .map((c) => {
        if (typeof c.content === "string") {
          const s = c.content;
          if (/<[a-z][\s\S]*>/i.test(s)) return textFromHtml(s);
          return s;
        }
        if (c.components && Array.isArray(c.components)) {
          return c.components
            .map((cc) => {
              if (typeof cc.content === "string") {
                const s2 = cc.content;
                if (/<[a-z][\s\S]*>/i.test(s2)) return textFromHtml(s2);
                return s2;
              }
              return "";
            })
            .join(" ");
        }
        if (c.html && typeof c.html === "string") return textFromHtml(c.html);
        return "";
      })
      .filter(Boolean);
    content = parts.join("\n").trim();
  }
  if (!content) content = template?.name || "[Template]";
  const id = "box-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
  const box = {
    id,
    type: "text",
    content,
    xPct: "5%",
    yPct: "5%",
    wPct: "90%",
    hPct: "10%",
    style: { fontSize: 14, color: "#0f1724", background: "transparent" },
  };
  return [box];
}

const protectedImageCache = new Map();

async function fetchProtectedImage(src, apiKey) {
  if (!src) return null;
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;

  const cached = protectedImageCache.get(src);
  if (cached) return cached;

  try {
    const res = await fetch(src, {
      method: "GET",
      headers: { "x-api-key": apiKey || "" },
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`Image fetch failed (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    protectedImageCache.set(src, url);
    return url;
  } catch (err) {
    console.warn("fetchProtectedImage error", src, err && err.message);
    return null;
  }
}

/* -------------------------
   HTML and grapesJson resolution helpers
   (keep your previous implementations but note we extract header/footer blobs later)
   ------------------------- */

async function replaceUploadUrlsInHtml(html = "", apiKey, backendBase) {
  if (!html) return html;
  if (!backendBase) {
    console.warn(
      "replaceUploadUrlsInHtml: backendBase required for relative /api/ urls"
    );
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const imgs = Array.from(doc.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      let src = img.getAttribute("src") || "";
      if (!/\/api\/orgs\/\d+\/uploads\//.test(src)) return;

      if (src.startsWith("/api/")) src = backendBase.replace(/\/$/, "") + src;

      const blobUrl = await fetchProtectedImage(src, apiKey);
      if (!blobUrl) return;

      // replace + lock image (non-interactive)
      img.setAttribute("src", blobUrl);
      img.setAttribute("draggable", "false");
      img.setAttribute("data-locked", "true");

      // preserve existing style and add non-interactive hints
      const existing = img.getAttribute("style") || "";
      const extra = "pointer-events: none; user-select: none;";
      img.setAttribute("style", (existing ? existing + ";" : "") + extra);
    })
  );

  return doc.body ? doc.body.innerHTML : html;
}

async function resolveTemplateProtectedAssets(
  template = {},
  apiKey,
  backendBase
) {
  if (!template || !apiKey) return template;

  const t = { ...template };

  const candidateFields = [
    "imageUrl",
    "cleanedUrl",
    "header_url",
    "footer_url",
    "thumbnail",
    "cleaned_url",
    "headerUrl",
    "footerUrl",
  ];

  // replace any top-level candidate fields with blob URLs
  await Promise.all(
    candidateFields.map(async (field) => {
      const val = t[field];
      if (typeof val === "string" && /\/api\/orgs\/\d+\/uploads\//.test(val)) {
        let src = val;
        if (src.startsWith("/api/")) {
          if (!backendBase) {
            console.warn(
              "resolveTemplateProtectedAssets: backendBase required for relative /api/ urls",
              src
            );
            return;
          }
          const base = backendBase.replace(/\/$/, "");
          src = base + src;
        }
        const blob = await fetchProtectedImage(src, apiKey);
        if (blob) {
          t[field] = blob;
        }
      }
    })
  );

  // if HTML contains upload URLs, replace with blobs and lock images
  if (
    typeof t.html === "string" &&
    /\/api\/orgs\/\d+\/uploads\//.test(t.html)
  ) {
    t.html = await replaceUploadUrlsInHtml(t.html, apiKey, backendBase);
  }

  // walk grapesJson and replace srcs
  if (t.grapesJson && typeof t.grapesJson === "object") {
    try {
      const copy = JSON.parse(JSON.stringify(t.grapesJson));
      async function walk(node) {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) {
          for (const c of node) await walk(c);
          return;
        }

        // attributes.src
        if (
          node.attributes &&
          typeof node.attributes.src === "string" &&
          /\/api\/orgs\/\d+\/uploads\//.test(node.attributes.src)
        ) {
          let src = node.attributes.src;
          if (src.startsWith("/api/")) {
            if (!backendBase) {
              console.warn(
                "resolveTemplateProtectedAssets: backendBase required for relative /api/ urls in grapesJson",
                src
              );
            } else {
              const base = backendBase.replace(/\/$/, "");
              src = base + src;
            }
          }
          const blob = await fetchProtectedImage(src, apiKey);
          if (blob) {
            node.attributes.src = blob;
            // mark locked & non-interactive
            node.attributes["draggable"] = "false";
            node.attributes["data-locked"] = "true";
            node.attributes["style"] =
              (node.attributes["style"] || "") +
              ";pointer-events:none;user-select:none;";
          }
        }

        // any other string properties in the node that are upload URLs
        for (const k of Object.keys(node)) {
          if (
            typeof node[k] === "string" &&
            /\/api\/orgs\/\d+\/uploads\//.test(node[k])
          ) {
            let src = node[k];
            if (src.startsWith("/api/")) {
              if (!backendBase) {
                console.warn(
                  "resolveTemplateProtectedAssets: backendBase required for relative /api/ urls in grapesJson property",
                  src
                );
                continue;
              }
              const base = backendBase.replace(/\/$/, "");
              src = base + src;
            }
            const blob = await fetchProtectedImage(src, apiKey);
            if (blob) node[k] = blob;
          } else if (typeof node[k] === "object") {
            await walk(node[k]);
          }
        }
      }
      await walk(copy);
      t.grapesJson = copy;
    } catch (err) {
      console.warn(
        "resolveTemplateProtectedAssets: grapesJson processing failed",
        err
      );
    }
  }

  return t;
}

/* -------------------------
   Component start
   ------------------------- */

export default function TemplateBuilder() {
  const { user } = useAuth();
  const [mode, setMode] = useState("upload");
  const [generated, setGenerated] = useState(null);

  const [publicTemplates, setPublicTemplates] = useState([]);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedDocCategory, setSelectedDocCategory] = useState("all");
  const [selectedSavedCategory, setSelectedSavedCategory] = useState("all");
  const [showSavedPane, setShowSavedPane] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [previewHeaderUrl, setPreviewHeaderUrl] = useState(null);
  const [previewFooterUrl, setPreviewFooterUrl] = useState(null);
  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
  const orgId = user?.orgId ?? user?.org_id ?? null;

  const basicEditorRef = useRef(null);
  const scratchEditorRef = useRef(null);

  useEffect(() => {
    if (!orgId) return;
    const parsed = Number(orgId);
    if (Number.isNaN(parsed)) return;
    fetchPublicBasicTemplates(parsed);
    fetchSavedTemplates(parsed);
  }, [orgId]);

  const saveUrl = orgId ? `${BACKEND_URL}/api/orgs/${orgId}/templates` : null;

  function setAppMode(newMode) {
    setMode((cur) => (cur === newMode ? cur : newMode));
    if (newMode !== "basic") {
      setGenerated(null);
    }
    if (newMode !== "upload") {
      setPreviewHeaderUrl(null);
      setPreviewFooterUrl(null);
    }
  }

  /* -------------------------
     Fetch functions (same as yours)
     ------------------------- */

  async function fetchPublicBasicTemplates(org) {
    setLoading(true);
    const localBase = "/commonTemplates/basic";
    try {
      if (org) {
        if (!BACKEND_URL)
          console.warn(
            "fetchPublicBasicTemplates: NEXT_PUBLIC_BACKEND_URL is not set"
          );
        const res = await fetch(
          `${BACKEND_URL}/api/orgs/${org}/templates/basic`,
          {
            method: "GET",
            headers: { "x-api-key": API_KEY },
            credentials: "include",
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const normalized = data.map((entry) => {
              const baseUrl = "/commonTemplates/basic/";
              const thumbnail = entry.thumbnail
                ? entry.thumbnail.startsWith("http")
                  ? entry.thumbnail
                  : (() => {
                      try {
                        return new URL(entry.thumbnail, baseUrl).href;
                      } catch (e) {
                        return baseUrl + entry.thumbnail;
                      }
                    })()
                : null;
              return { ...entry, thumbnail, origin: "public" };
            });
            setPublicTemplates(normalized);
            setLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn(
        "Backend basic templates fetch failed, falling back to public manifest",
        e.message
      );
    }

    try {
      const manifestUrl = `${localBase}/manifest.json`;
      const mRes = await fetch(manifestUrl);
      if (!mRes.ok) throw new Error("No local manifest");
      const manifest = await mRes.json();

      const loaded = await Promise.all(
        manifest.map(async (entry) => {
          const fileUrl = `${localBase}/${entry.file}`;
          let html = "";
          try {
            const r = await fetch(fileUrl);
            if (r.ok) html = await r.text();
          } catch (err) {
            console.warn("Failed to fetch template html", fileUrl, err);
          }
          const thumbnail = entry.thumbnail
            ? `${localBase}/${entry.thumbnail}`
            : null;
          const grapesJson = null;
          return {
            id: entry.id,
            name: entry.name,
            description: entry.description || "",
            html,
            grapesJson,
            thumbnail,
            origin: "public",
            rawEntry: entry,
          };
        })
      );

      setPublicTemplates(loaded);
    } catch (err) {
      console.warn(
        "No local templates manifest found or failed to load templates",
        err.message
      );
      setPublicTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSavedTemplates(org) {
    if (!org) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orgs/${org}/templates`, {
        method: "GET",
        headers: { "x-api-key": API_KEY || "" },
        credentials: "include",
      });
      if (!res.ok) {
        console.warn("Failed to fetch saved templates", res.status);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn("Unexpected saved templates response:", data);
        setLoading(false);
        return;
      }

      const normalized = data.map((entry) => {
        let grapesJson = entry.grapes_json || entry.grapesJson || null;
        try {
          if (typeof grapesJson === "string" && grapesJson.trim())
            grapesJson = JSON.parse(grapesJson);
        } catch (e) {}

        let thumbnail = entry.thumbnail_url || entry.thumbnail || null;
        if (thumbnail && !thumbnail.startsWith("http")) {
          try {
            const base = BACKEND_URL.replace(/\/$/, "");
            thumbnail = `${base}/api/orgs/${org}/uploads/${thumbnail}`;
          } catch (e) {}
        }

        const category = inferCategory(entry);

        return {
          ...entry,
          grapesJson,
          html: entry.html || null,
          thumbnail,
          category,
          origin: "saved",
        };
      });

      setSavedTemplates(normalized);
    } catch (err) {
      console.error("fetchSavedTemplates failed", err);
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------
     When opening saved template: resolve assets, then extract header/footer blobs
     ------------------------- */

  async function chooseBasic(template) {
    if (!template) return;
    if (template.origin === "saved") {
      try {
        const resolved = await resolveTemplateProtectedAssets(
          template,
          API_KEY,
          BACKEND_URL
        );

        // Extract header/footer blobs into well-known properties
        // backend field names we check: header_url, footer_url, headerUrl, footerUrl
        const headerCandidates = [
          resolved.header_url,
          resolved.headerUrl,
          resolved.header,
        ];
        const footerCandidates = [
          resolved.footer_url,
          resolved.footerUrl,
          resolved.footer,
        ];

        // _headerBlob / _footerBlob will be used by this component to render non-editable overlays
        const headerBlob = headerCandidates.find(
          (x) => typeof x === "string" && x
        );
        const footerBlob = footerCandidates.find(
          (x) => typeof x === "string" && x
        );

        if (headerBlob) resolved._headerBlob = headerBlob;
        if (footerBlob) resolved._footerBlob = footerBlob;

        // Optionally remove the in-template references so editor won't render them itself
        // (safer as we render them separately)
        if (headerBlob) {
          if (resolved.header_url) resolved.header_url = null;
          if (resolved.headerUrl) resolved.headerUrl = null;
          if (resolved.header) resolved.header = null;
        }
        if (footerBlob) {
          if (resolved.footer_url) resolved.footer_url = null;
          if (resolved.footerUrl) resolved.footerUrl = null;
          if (resolved.footer) resolved.footer = null;
        }

        setGenerated(resolved);
        setAppMode("basic");
        return;
      } catch (err) {
        console.warn("chooseBasic: resolveTemplateProtectedAssets failed", err);
      }
    }
    setGenerated(template);
    setAppMode("basic");
  }

  /* -------------------------
     Save handling (same as your file)
     ------------------------- */

  function handleUploadSaved() {
    if (!orgId) {
      setSavedModalVisible(true);
      return;
    }
    fetchSavedTemplates(orgId);
    setShowSavedPane(true);
    setSavedModalVisible(true);
  }

  async function handleCustomSave(payload) {
    if (!saveUrl) {
      alert("No save URL (org missing).");
      return;
    }

    let parsedTemplate = null;
    if (payload && typeof payload.template_json === "string") {
      try {
        parsedTemplate = JSON.parse(payload.template_json);
      } catch (e) {
        parsedTemplate = null;
      }
    }

    const grapesJson =
      payload.grapesJson ||
      payload.grapes_json ||
      (parsedTemplate &&
        (parsedTemplate.grapesJson || parsedTemplate.grapes_json)) ||
      null;

    const html =
      payload.html ||
      (parsedTemplate &&
        (parsedTemplate.html ||
          parsedTemplate.templateHtml ||
          parsedTemplate.template_html)) ||
      null;

    const css = payload.css || (parsedTemplate && parsedTemplate.css) || null;
    const thumbnail_url = payload.thumbnail || payload.thumbnail_url || null;

    const bodyPayload = {
      name: payload.meta?.name || payload.name || "Untitled Template",
      template_type: "custom",
      grapes_json: grapesJson ? JSON.stringify(grapesJson) : null,
      html: html || null,
      css: css || null,
      thumbnail_url: thumbnail_url || null,
    };

    try {
      const resp = await fetch(saveUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY || "",
        },
        credentials: "include",
        body: JSON.stringify(bodyPayload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Save failed");

      setSavedModalVisible(true);
      setShowSavedPane(true);
      fetchSavedTemplates(orgId);
    } catch (err) {
      console.error("save failed", err);
      alert("Save failed: " + (err.message || "error"));
    }
  }

  /* -------------------------
     Filters and editor helpers (same)
     ------------------------- */

  const filteredPublic = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = publicTemplates;
    if (selectedDocCategory !== "all") {
      list = list.filter((t) => {
        const cat = inferCategory(t);
        return cat === selectedDocCategory;
      });
    }
    if (q) {
      list = list.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.id || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [publicTemplates, selectedDocCategory, query]);

  const filteredSaved = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = savedTemplates;
    if (selectedSavedCategory !== "all") {
      list = list.filter((t) => t.category === selectedSavedCategory);
    }
    if (q) {
      list = list.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          String(t.id || "")
            .toLowerCase()
            .includes(q)
      );
    }
    return list;
  }, [savedTemplates, selectedSavedCategory, query]);

  function getActiveEditorRef() {
    if (mode === "basic") return basicEditorRef;
    if (mode === "scratch") return scratchEditorRef;
    return null;
  }

  function actionAddText() {
    const r = getActiveEditorRef();
    if (r?.current?.addText) r.current.addText();
  }
  function actionAddField() {
    const r = getActiveEditorRef();
    if (r?.current?.addField) r.current.addField();
  }
  function actionAddLogo() {
    const r = getActiveEditorRef();
    if (r?.current?.addLogo) r.current.addLogo();
  }
  function actionAddTable() {
    const r = getActiveEditorRef();
    if (r?.current?.addTable) r.current.addTable();
  }
  function actionTogglePreview() {
    const r = getActiveEditorRef();
    if (r?.current?.togglePreview) r.current.togglePreview();
  }
  function actionDeleteSelected() {
    const r = getActiveEditorRef();
    if (r?.current?.deleteSelected) r.current.deleteSelected();
  }

  function openSavePrompt() {
    const stamp = new Date().toLocaleString();
    setSaveName(`Template ${stamp}`);
    setSaveModalOpen(true);
  }

  async function confirmSaveFromEditor() {
    const r = getActiveEditorRef();
    if (!r || !r.current) {
      alert("No editor available to save from.");
      setSaveModalOpen(false);
      return;
    }
    let data = null;
    try {
      if (r.current.getData) {
        data = await r.current.getData();
      } else if (r.current.getHtml) {
        const html = await r.current.getHtml();
        data = { html, meta: { name: saveName } };
      } else {
        data = { html: null, meta: { name: saveName } };
      }
    } catch (err) {
      console.error("getData/getHtml failed", err);
      alert("Failed to read data from editor.");
    } finally {
      setSaveModalOpen(false);
    }

    if (!data) return;
    data.meta = { ...(data.meta || {}), name: saveName };
    handleCustomSave(data);
  }

  /* -------------------------
     Render
     ------------------------- */

  return (
    <div className={styles.container}>
      <aside className={styles.leftPanel}>
        <h3 className={styles.heading}>Templates</h3>

        <div className={styles.modeButtons}>
          <button
            className={`${styles.modeBtn} ${
              mode === "upload" ? styles.active : ""
            }`}
            onClick={() => setAppMode("upload")}
            aria-pressed={mode === "upload"}
          >
            Upload Scan
          </button>
          <button
            className={`${styles.modeBtn} ${
              mode === "scratch" ? styles.active : ""
            }`}
            onClick={() => setAppMode("scratch")}
            aria-pressed={mode === "scratch"}
          >
            Build from Scratch
          </button>
          <button
            className={`${styles.modeBtn} ${
              mode === "basic" ? styles.active : ""
            }`}
            onClick={() => setAppMode("basic")}
            aria-pressed={mode === "basic"}
          >
            Basic Templates
          </button>

          <button
            className={`${styles.modeBtn} ${
              showSavedPane ? styles.active : ""
            }`}
            onClick={() => {
              setShowSavedPane((s) => !s);
              if (!showSavedPane) fetchSavedTemplates(orgId);
            }}
            aria-pressed={showSavedPane}
            title="Toggle saved templates"
          >
            Saved Templates
          </button>
        </div>

        {showSavedPane && (
          <div className={styles.templatesWrap}>
            <div className={styles.savedHeader}>
              <h4 className={styles.sectionTitle}>Saved templates</h4>
              <div className={styles.savedControls}>
                <div
                  className={styles.smallChips}
                  role="tablist"
                  aria-label="Saved template categories"
                >
                  {SAVED_CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setSelectedSavedCategory(c.key)}
                      className={`${styles.chipSmall} ${
                        selectedSavedCategory === c.key ? styles.chipActive : ""
                      }`}
                      role="tab"
                      aria-selected={selectedSavedCategory === c.key}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.templatesList}>
              {loading && <div className={styles.loading}>Loading…</div>}
              {!loading && filteredSaved.length === 0 && (
                <div className={styles.empty}>No saved templates</div>
              )}
              <div className={styles.grid}>
                {filteredSaved.map((t) => (
                  <button
                    key={t.id || t.name || Math.random()}
                    className={styles.card}
                    onClick={() => chooseBasic(t)}
                    title={t.name}
                    aria-label={`Choose ${t.name}`}
                  >
                    <div className={styles.thumb}>
                      {t.thumbnail ? (
                        t.origin === "saved" ? (
                          <ProtectedImg
                            src={t.thumbnail}
                            apiKey={API_KEY}
                            alt={t.name}
                            loading="lazy"
                            className={styles.thumbImg}
                          />
                        ) : (
                          <img
                            src={t.thumbnail}
                            alt={t.name}
                            loading="lazy"
                            className={styles.thumbImg}
                          />
                        )
                      ) : (
                        <div className={styles.placeholderIcon}>T</div>
                      )}
                    </div>
                    <div className={styles.meta}>
                      <div className={styles.title}>{t.name || t.id}</div>
                      <div className={styles.subtitle}>
                        {t.template_type || t.category || ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={styles.toolsSection}>
          {mode === "upload" && (
            <div className={styles.toolsIntro}>
              <div className={styles.toolsIntroTitle}>Upload tools</div>
              <div className={styles.toolsIntroDesc}>
                Use the controls to pick header/footer images and preview A4.
              </div>
            </div>
          )}

          {(mode === "basic" || mode === "scratch") && (
            <div className={styles.editorTools}>
              <div className={styles.toolsTitle}>Editor tools</div>

              <div className={styles.toolButtons}>
                <button className={styles.modeBtn} onClick={actionAddText}>
                  + Text
                </button>
                <button className={styles.modeBtn} onClick={actionAddField}>
                  + Field
                </button>
                <button className={styles.modeBtn} onClick={actionAddLogo}>
                  + Logo
                </button>
                <button className={styles.modeBtn} onClick={actionAddTable}>
                  + Table
                </button>
                <button
                  className={styles.modeBtn}
                  onClick={actionTogglePreview}
                >
                  Toggle Preview
                </button>
                <button
                  className={styles.modeBtn}
                  onClick={actionDeleteSelected}
                >
                  Delete
                </button>
                <button
                  className={styles.modeBtn}
                  onClick={() => openSavePrompt()}
                  title="Save template (asks for a name)"
                >
                  Save
                </button>
              </div>

              {mode === "basic" && (
                <div className={styles.toolsSearchWrap}>
                  <div className={styles.searchWrap}>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search templates..."
                      className={styles.search}
                      aria-label="Search templates"
                    />
                  </div>

                  <div
                    className={styles.chips}
                    role="tablist"
                    aria-label="Template categories"
                  >
                    {DOC_CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setSelectedDocCategory(c.key)}
                        className={`${styles.chip} ${
                          selectedDocCategory === c.key ? styles.chipActive : ""
                        }`}
                        role="tab"
                        aria-selected={selectedDocCategory === c.key}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {mode === "upload" && (
          <UploadScan
            orgId={orgId}
            backendUrl={process.env.NEXT_PUBLIC_BACKEND_URL}
            apiKey={process.env.NEXT_PUBLIC_API_KEY}
            controlsOnly={true}
            onPreviewChange={({ headerUrl, footerUrl }) => {
              setPreviewHeaderUrl(headerUrl || null);
              setPreviewFooterUrl(footerUrl || null);
            }}
            onSaved={handleUploadSaved}
            a4PreviewWidth={420}
          />
        )}

        {mode === "basic" && (
          <div className={styles.templatesWrap}>
            <h4 className={styles.sectionTitle}>Basic templates</h4>
            <div className={styles.templatesList}>
              {loading && <div className={styles.loading}>Loading…</div>}
              {!loading && filteredPublic.length === 0 && (
                <div className={styles.empty}>No basic templates</div>
              )}
              <div className={styles.grid}>
                {filteredPublic.map((t) => (
                  <button
                    key={t.id || t.name || Math.random()}
                    className={styles.card}
                    onClick={() => chooseBasic(t)}
                    title={t.name}
                    aria-label={`Choose ${t.name}`}
                  >
                    <div className={styles.thumb}>
                      {t.thumbnail ? (
                        <img
                          src={t.thumbnail}
                          alt={t.name}
                          loading="lazy"
                          className={styles.thumbImg}
                        />
                      ) : (
                        <div className={styles.placeholderIcon}>T</div>
                      )}
                    </div>
                    <div className={styles.meta}>
                      <div className={styles.title}>{t.name || t.id}</div>
                      <div className={styles.subtitle}>
                        {t.description || ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className={styles.editorPanel}>
        <div
          className={styles.editorContainer}
          data-testid="template-editor-container"
        >
          {mode === "upload" && (previewHeaderUrl || previewFooterUrl) && (
            <A4Preview
              headerUrl={previewHeaderUrl}
              footerUrl={previewFooterUrl}
              width={560}
            />
          )}

          {mode === "upload" && !previewHeaderUrl && !previewFooterUrl && (
            <div className={styles.placeholder}>
              Use the Upload controls on the left to select header and footer —
              preview will appear here.
            </div>
          )}

          {mode === "basic" &&
            generated &&
            (generated.html && generated.html.trim() ? (
              // Wrap BasicTemplateEditor with a non-editable header/footer overlay
              <div style={{ position: "relative" }}>
                {/* non-editable header overlay */}
                {generated._headerBlob && (
                  <img
                    src={generated._headerBlob}
                    alt="Header"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      width: "100%",
                      display: "block",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                )}

                <BasicTemplateEditor
                  ref={basicEditorRef}
                  key={generated.id || generated.file || Math.random()}
                  initialHtml={generated.html}
                  initialJson={generated.grapesJson}
                  baseUrl={"/commonTemplates/basic/"}
                  onSave={(payload) =>
                    handleCustomSave({
                      ...payload,
                      templateId: generated.id || generated.name,
                    })
                  }
                />

                {/* non-editable footer overlay */}
                {generated._footerBlob && (
                  <img
                    src={generated._footerBlob}
                    alt="Footer"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      width: "100%",
                      display: "block",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                )}
              </div>
            ) : generated ? (
              // CustomTemplateEditor (non-html / grapes JSON)
              <div style={{ position: "relative" }}>
                {generated._headerBlob && (
                  <img
                    src={generated._headerBlob}
                    alt="Header"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      width: "100%",
                      display: "block",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                )}

                <CustomTemplateEditor
                  ref={basicEditorRef}
                  key={
                    generated.id ||
                    generated.name ||
                    generated.file ||
                    Math.random()
                  }
                  background={generated.thumbnail || generated.imageUrl || null}
                  initialBoxes={templateToBoxes(generated)}
                  onSave={handleCustomSave}
                  canvasWidthPx={794}
                />

                {generated._footerBlob && (
                  <img
                    src={generated._footerBlob}
                    alt="Footer"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      width: "100%",
                      display: "block",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                )}
              </div>
            ) : (
              <div className={styles.placeholder}>
                Choose a template from the left to open it here.
              </div>
            ))}

          {mode === "scratch" && (
            <CustomTemplateEditor
              ref={scratchEditorRef}
              key={"scratch-" + Date.now()}
              background={null}
              initialBoxes={[]}
              onSave={handleCustomSave}
              canvasWidthPx={794}
            />
          )}
        </div>
      </main>

      {saveModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Save template</h3>
            <label className={styles.modalLabel}>Name</label>
            <input
              className={styles.modalInput}
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Template name"
            />
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => setSaveModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={styles.modalSave}
                onClick={confirmSaveFromEditor}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {savedModalVisible && (
        <Modal
          isVisible={savedModalVisible}
          buttons={[
            {
              label: "OK",
              onClick: () => setSavedModalVisible(false),
              className: "modal-btn",
            },
          ]}
        >
          <p>
            Template saved successfully. The saved templates list has been
            updated.
          </p>
        </Modal>
      )}
    </div>
  );
}
