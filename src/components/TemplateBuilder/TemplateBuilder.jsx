import React, { useState, useRef, useEffect, useMemo } from "react";
import BasicTemplateEditor from "./BasicTemplateEditor";
import CustomTemplateEditor from "./CustomTemplateEditor";
import "./TemplateBuilder.css";

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
          if (/<[a-z][\s\S]*>/i.test(s)) {
            return textFromHtml(s);
          }
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
        if (c.html && typeof c.html === "string") {
          return textFromHtml(c.html);
        }
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
  const [mode, setMode] = useState("upload"); // upload | scratch | basic
  const [generated, setGenerated] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [basicTemplates, setBasicTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const headerRef = useRef();
  const bodyRef = useRef();
  const footerRef = useRef();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  useEffect(() => {
    const raw = localStorage.getItem("orgId");
    const parsed = raw ? parseInt(raw, 10) : NaN;
    if (!raw || Number.isNaN(parsed)) {
      return;
    }
    setOrgId(parsed);
    fetchBasicTemplates(parsed);
    fetchSavedTemplates(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveUrl = orgId ? `${BACKEND_URL}/api/orgs/${orgId}/templates` : null;

  async function fetchBasicTemplates(org) {
    setLoading(true);
    const localBase = (process.env.PUBLIC_URL || "") + "/commonTemplates/basic";
    try {
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
            const baseUrl =
              (process.env.PUBLIC_URL || "") + "/commonTemplates/basic/";
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
            return {
              ...entry,
              thumbnail,
              category,
            };
          });
          setBasicTemplates(normalized);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn(
        "Backend basic templates fetch failed, falling back to public manifest",
        e.message
      );
    }

    // fallback to local manifest
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

  // --- NEW: fetch saved templates from backend and prepend them to the list ---
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
        // parse grapes_json if it's a string
        let grapesJson = entry.grapes_json || entry.grapesJson || null;
        try {
          if (typeof grapesJson === "string" && grapesJson.trim())
            grapesJson = JSON.parse(grapesJson);
        } catch (e) {
          // leave as-is
        }

        // normalize thumbnail (if backend returned only filename)
        let thumbnail = entry.thumbnail_url || entry.thumbnail || null;
        if (thumbnail && !thumbnail.startsWith("http")) {
          try {
            const base = (BACKEND_URL || "").replace(/\/$/, "");
            thumbnail = `${base}/api/orgs/${org}/uploads/${thumbnail}`;
          } catch (e) {
            // leave as-is
          }
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

      // Prepend saved templates so user's templates appear first
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

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "all") return basicTemplates;
    return basicTemplates.filter((t) => t.category === selectedCategory);
  }, [basicTemplates, selectedCategory]);

  async function handleCustomSave(payload) {
    if (!saveUrl) {
      alert("No save URL (org missing).");
      return;
    }

    // If payload contains template_json (stringified), try parse it
    let parsedTemplate = null;
    if (payload && typeof payload.template_json === "string") {
      try {
        parsedTemplate = JSON.parse(payload.template_json);
      } catch (e) {
        parsedTemplate = null;
      }
    }

    // unify potential shapes from different editors
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
      // backend expects these names
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

      // refresh saved templates so the new template appears immediately
      fetchSavedTemplates(orgId);
    } catch (err) {
      console.error("save failed", err);
      alert("Save failed: " + (err.message || "error"));
    }
  }

  return (
    <div className="template-builder">
      <div className="left-panel">
        <h3>Choose mode</h3>
        <div>
          <button
            onClick={() => setMode("upload")}
            className={mode === "upload" ? "active" : ""}
          >
            Upload & Generate
          </button>
          <button
            onClick={buildFromScratch}
            className={mode === "scratch" ? "active" : ""}
          >
            Build from Scratch
          </button>
          <button
            onClick={() => setMode("basic")}
            className={mode === "basic" ? "active" : ""}
          >
            Basic Templates
          </button>
        </div>

        {mode === "upload" && (
          <>
            <h4>Upload scan</h4>
            <div>
              <div>
                Upload & Generate is coming soon — working on the scanner/ocr
                pipeline.
              </div>
              <button onClick={() => alert("Coming soon")}>Coming soon</button>
            </div>
          </>
        )}

        {mode === "basic" && (
          <>
            <h4>Basic templates</h4>

            <div>
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setSelectedCategory(c.key)}
                  className={
                    selectedCategory === c.key
                      ? "active category-btn"
                      : "category-btn"
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="templates-list">
              {loading && <div>Loading templates…</div>}
              {!loading && filteredTemplates.length === 0 && (
                <div>No templates found in this category</div>
              )}
              {!loading &&
                filteredTemplates.map((t) => (
                  <div
                    key={t.id || t.name}
                    className="template-card"
                    onClick={() => chooseBasic(t)}
                  >
                    <div className="thumb">
                      {t.thumbnail ? (
                        <img src={t.thumbnail} alt={t.name} />
                      ) : (
                        <div>T</div>
                      )}
                    </div>
                    <div className="meta">
                      <div className="title">{t.name || t.id}</div>
                      <div className="subtitle">{t.description || ""}</div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {mode === "scratch" && (
          <>
            <h4>Create blank template</h4>
            <p>
              You will open a blank canvas to design a template from scratch.
            </p>
            <button
              onClick={() => {
                setGenerated({ html: "", grapesJson: null, imageUrl: null });
                setMode("scratch");
              }}
            >
              Open Blank Editor
            </button>
          </>
        )}
      </div>

      <div className="editor-panel">
        <div
          className="editor-container"
          data-testid="template-editor-container"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* UPLOAD mode (server-generated HTML) */}
          {mode === "upload" && generated && generated.html && (
            <BasicTemplateEditor
              key={
                generated.imageUrl ||
                generated.id ||
                generated.previewText ||
                "upload"
              }
              initialHtml={generated.html}
              initialJson={generated.grapesJson}
              baseUrl={
                generated.baseUrl ||
                (process.env.PUBLIC_URL || "") + "/commonTemplates/basic/"
              }
            />
          )}

          {/* BASIC templates:
              - If template has .html content, OPEN IT with TemplateEditor (full HTML)
              - Otherwise fallback to CustomTemplateEditor (boxes)
          */}
          {mode === "basic" && generated && (
            <>
              {generated.html && generated.html.trim() ? (
                <BasicTemplateEditor
                  key={generated.id || generated.file || Math.random()}
                  initialHtml={generated.html}
                  baseUrl={
                    (process.env.PUBLIC_URL || "") + "/commonTemplates/basic/"
                  }
                  onSave={(payload) => {
                    // payload contains html + css + savedAt
                    // convert to the same POST you used before or call handleCustomSave
                    handleCustomSave({
                      ...payload,
                      templateId: generated.id || generated.name,
                    });
                  }}
                />
              ) : (
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
              )}
            </>
          )}

          {/* SCRATCH -> blank CustomTemplateEditor */}
          {mode === "scratch" && (
            <CustomTemplateEditor
              key={"scratch-" + Date.now()}
              background={null}
              initialBoxes={[]}
              onSave={handleCustomSave}
              canvasWidthPx={1000}
            />
          )}

          {!(
            (mode === "upload" && generated && generated.html) ||
            (mode === "basic" && generated) ||
            mode === "scratch"
          ) && (
            <div className="placeholder">
              Choose a mode and either upload an image, select a base template,
              or start from scratch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
