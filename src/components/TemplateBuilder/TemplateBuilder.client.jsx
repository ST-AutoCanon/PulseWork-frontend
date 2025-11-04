"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import BasicTemplateEditor from "./BasicTemplateEditor";
import CustomTemplateEditor from "./CustomTemplateEditor";
import UploadScan from "./UploadScan.client";
import A4Preview from "./A4Preview";
import { useAuth } from "../../context/AuthProvider.client";
import styles from "./TemplateBuilder.module.css";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "invoices", label: "Invoices" },
  { key: "letterheads", label: "Letterheads" },
  { key: "reimbursements", label: "Reimbursements" },
  { key: "receipts", label: "Receipts" },
];

function inferCategory(entry) {
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

export default function TemplateBuilder() {
  const { user } = useAuth();
  const [mode, setMode] = useState("upload");
  const [generated, setGenerated] = useState(null);
  const [basicTemplates, setBasicTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [previewHeaderUrl, setPreviewHeaderUrl] = useState(null);
  const [previewFooterUrl, setPreviewFooterUrl] = useState(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
  const orgId = user?.orgId ?? user?.org_id ?? null;

  useEffect(() => {
    if (!orgId) return;
    const parsed = Number(orgId);
    if (Number.isNaN(parsed)) return;
    fetchBasicTemplates(parsed);
    fetchSavedTemplates(parsed);
  }, [orgId]);

  const saveUrl = orgId ? `${BACKEND_URL}/api/orgs/${orgId}/templates` : null;

  async function fetchBasicTemplates(org) {
    setLoading(true);
    const localBase = "/commonTemplates/basic";
    try {
      if (org) {
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
          if (Array.isArray(data) && data.length) {
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
              const category = inferCategory(entry);
              return { ...entry, thumbnail, category };
            });
            setBasicTemplates(normalized);
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
          const category = inferCategory(entry);
          return {
            id: entry.id,
            name: entry.name,
            description: entry.description || "",
            html,
            grapesJson,
            thumbnail,
            category,
            rawEntry: entry,
          };
        })
      );

      setBasicTemplates(loaded);
    } catch (err) {
      console.warn(
        "No local templates manifest found or failed to load templates",
        err.message
      );
      setBasicTemplates([]);
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
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn("Unexpected saved templates response:", data);
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
        };
      });

      setBasicTemplates((prev) => [...normalized, ...prev]);
    } catch (err) {
      console.error("fetchSavedTemplates failed", err);
    } finally {
      setLoading(false);
    }
  }

  async function uploadScan() {
    if (!orgId) return alert("Organization not found. Please login again.");
    const headerFile = headerRef.current?.files?.[0];
    const bodyFile = bodyRef.current?.files?.[0];
    const footerFile = footerRef.current?.files?.[0];

    if (!bodyFile) return alert("Please select the body image (required).");

    const fd = new FormData();
    if (headerFile) fd.append("header", headerFile);
    fd.append("body", bodyFile);
    if (footerFile) fd.append("footer", footerFile);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/orgs/${orgId}/templates/upload-scan`,
        {
          method: "POST",
          headers: { "x-api-key": API_KEY },
          body: fd,
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "upload failed");
      setGenerated(data);
      setMode("upload");
    } catch (err) {
      alert(err.message || "Error");
    }
  }

  function buildFromScratch() {
    setGenerated(null);
    setMode("scratch");
  }

  function chooseBasic(template) {
    setGenerated(template);
    setMode("basic");
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
      alert("Template saved: " + (data.id || "ok"));

      fetchSavedTemplates(orgId);
    } catch (err) {
      console.error("save failed", err);
      alert("Save failed: " + (err.message || "error"));
    }
  }

  function chooseBasic(template) {
    setGenerated(template);
    setMode("basic");
  }

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = basicTemplates;
    if (selectedCategory !== "all")
      list = list.filter((t) => t.category === selectedCategory);
    if (q)
      list = list.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.id || "").toLowerCase().includes(q)
      );
    return list;
  }, [basicTemplates, selectedCategory, query]);

  return (
    <div className={styles.container}>
      <aside className={styles.leftPanel}>
        <div className={styles.headerRow}>
          <h3 className={styles.heading}>Templates</h3>
          <div className={styles.modeButtons}>
            <button
              className={`${styles.modeBtn} ${
                mode === "upload" ? styles.active : ""
              }`}
              onClick={() => setMode("upload")}
              aria-pressed={mode === "upload"}
            >
              Upload
            </button>
            <button
              className={`${styles.modeBtn} ${
                mode === "scratch" ? styles.active : ""
              }`}
              onClick={() => setMode("scratch")}
              aria-pressed={mode === "scratch"}
            >
              Scratch
            </button>
            <button
              className={`${styles.modeBtn} ${
                mode === "basic" ? styles.active : ""
              }`}
              onClick={() => setMode("basic")}
              aria-pressed={mode === "basic"}
            >
              Basic
            </button>
          </div>
        </div>

        {/* Upload controls shown only in upload mode (left panel) */}
        {mode === "upload" && (
          <UploadScan
            orgId={orgId}
            backendUrl={process.env.NEXT_PUBLIC_BACKEND_URL}
            apiKey={process.env.NEXT_PUBLIC_API_KEY}
            controlsOnly={true}
            // keep parent informed about preview images so preview can render in main area
            onPreviewChange={({ headerUrl, footerUrl }) => {
              setPreviewHeaderUrl(headerUrl || null);
              setPreviewFooterUrl(footerUrl || null);
            }}
            onSaved={(resp) => {
              setGenerated(resp);
              setMode("basic");
              // optional: fetchSavedTemplates(orgId);
            }}
            a4PreviewWidth={420}
          />
        )}

        {/* Basic mode controls: search, chips and templates list */}
        {mode === "basic" && (
          <>
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
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setSelectedCategory(c.key)}
                  className={`${styles.chip} ${
                    selectedCategory === c.key ? styles.chipActive : ""
                  }`}
                  role="tab"
                  aria-selected={selectedCategory === c.key}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className={styles.templatesList}>
              {loading && (
                <div className={styles.loading}>Loading templates…</div>
              )}
              {!loading && filteredTemplates.length === 0 && (
                <div className={styles.empty}>No templates found</div>
              )}

              <div className={styles.grid}>
                {filteredTemplates.map((t) => (
                  <button
                    key={t.id || t.name}
                    className={styles.card}
                    onClick={() => chooseBasic(t)}
                    title={t.name}
                    aria-label={`Choose ${t.name}`}
                  >
                    <div className={styles.thumb}>
                      {t.thumbnail ? (
                        <img src={t.thumbnail} alt={t.name} loading="lazy" />
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
          </>
        )}
      </aside>

      <main className={styles.editorPanel}>
        <div
          className={styles.editorContainer}
          data-testid="template-editor-container"
        >
          {/* show preview in main when uploading (uses preview urls from UploadScan controls) */}
          {mode === "upload" && (previewHeaderUrl || previewFooterUrl) && (
            <A4Preview
              headerUrl={previewHeaderUrl}
              footerUrl={previewFooterUrl}
              width={560}
            />
          )}

          {/* if no preview yet, show placeholder */}
          {mode === "upload" && !previewHeaderUrl && !previewFooterUrl && (
            <div className={styles.placeholder}>
              Use the Upload controls on the left to select header and footer —
              preview will appear here.
            </div>
          )}

          {/* Basic / generated handling remains unchanged */}
          {mode === "upload" && generated && generated.html && (
            <BasicTemplateEditor
              key={generated.id || "upload"}
              initialHtml={generated.html}
              initialJson={generated.grapesJson}
              baseUrl={generated.baseUrl || "/commonTemplates/basic/"}
            />
          )}

          {mode === "basic" &&
            generated &&
            (generated.html && generated.html.trim() ? (
              <BasicTemplateEditor
                key={generated.id || generated.file || Math.random()}
                initialHtml={generated.html}
                baseUrl={"/commonTemplates/basic/"}
                onSave={(payload) =>
                  handleCustomSave({
                    ...payload,
                    templateId: generated.id || generated.name,
                  })
                }
              />
            ) : generated ? (
              <CustomTemplateEditor
                key={
                  generated.id ||
                  generated.name ||
                  generated.file ||
                  Math.random()
                }
                background={generated.thumbnail || generated.imageUrl || null}
                initialBoxes={templateToBoxes(generated)}
                onSave={handleCustomSave}
                canvasWidthPx={1000}
              />
            ) : null)}

          {mode === "scratch" && (
            <CustomTemplateEditor
              key={"scratch-" + Date.now()}
              background={null}
              initialBoxes={[]}
              onSave={handleCustomSave}
              canvasWidthPx={1000}
            />
          )}
        </div>
      </main>
    </div>
  );
}
