import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import SidebarPanel from "./SidebarPanel";
import EditorPanel from "./EditorPanel";
import A4Preview from "./A4Preview";
import FieldPropertiesPanel from "./FieldPropertiesPanel";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";
import styles from "./TemplateBuilder.module.css";
import {
  PRESET_FIELDS,
  fieldsToBoxes,
  fillPlaceholdersInFields,
} from "./templatePresets";

const DOC_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "invoices", label: "Invoices" },
  { key: "letterheads", label: "Letterheads" },
  { key: "reimbursements", label: "Reimbursements" },
  { key: "receipts", label: "Receipts" },
];

const SAVED_CATEGORIES = [
  { key: "all", label: "All" },
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

async function ensureBoxesBlobUrls(boxes = []) {
  if (!Array.isArray(boxes) || boxes.length === 0) return boxes;
  return await Promise.all(
    boxes.map(async (b) => {
      if (!b || typeof b !== "object") return b;
      const nb = { ...b };

      const candidates = [
        { key: "imageUrl", val: nb.imageUrl },
        { key: "content", val: nb.content },
      ];

      for (const cand of candidates) {
        let src = cand.val;
        if (!src || typeof src !== "string") continue;

        if (
          src.startsWith("blob:") ||
          src.startsWith("data:") ||
          /^https?:\/\//i.test(src)
        ) {
          continue;
        }

        if (
          /^[^\/\\]+\.(png|jpe?g|svg|gif|webp)$/i.test(src) &&
          typeof BACKEND_URL === "string" &&
          BACKEND_URL &&
          typeof orgId !== "undefined" &&
          orgId
        ) {
          src = `${String(BACKEND_URL).replace(
            /\/$/,
            "",
          )}/api/orgs/${orgId}/uploads/${src}`;
        }

        if (
          src.startsWith("/api/") &&
          typeof BACKEND_URL === "string" &&
          BACKEND_URL
        ) {
          src = `${String(BACKEND_URL).replace(/\/$/, "")}${src}`;
        }

        try {
          const blobUrl = await fetchProtectedImage(src, API_KEY, employeeId);
          if (blobUrl) {
            if (cand.key === "imageUrl") nb.imageUrl = blobUrl;
            if (cand.key === "content") nb.content = blobUrl;
            if (!nb.imageUrl && blobUrl) nb.imageUrl = blobUrl;
            continue;
          }
        } catch (e) {
          console.warn(
            "ensureBoxesBlobUrls: fetchProtectedImage failed for",
            src,
            e,
          );
        }

        if (!/^https?:\/\//i.test(src) && src.startsWith("/")) {
          if (typeof BACKEND_URL === "string" && BACKEND_URL) {
            const abs = `${String(BACKEND_URL).replace(/\/$/, "")}${src}`;
            if (cand.key === "imageUrl") nb.imageUrl = abs;
            if (cand.key === "content") nb.content = abs;
            if (!nb.imageUrl) nb.imageUrl = abs;
          }
        } else {
        }
      }

      return nb;
    }),
  );
}

async function fetchProtectedImage(src, apiKey) {
  if (!src) return null;
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;

  const cached = protectedImageCache.get(src);
  if (cached) return cached;

  try {
    const res = await fetch(src, {
      method: "GET",
      credentials: "include",
      headers: { "x-api-key": apiKey || "", "x-employee-id": employeeId || "" },
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

async function replaceUploadUrlsInHtml(html = "", apiKey, backendBase) {
  if (!html) return html;
  if (!backendBase) {
    console.warn(
      "replaceUploadUrlsInHtml: backendBase required for relative /api/ urls",
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

      const blobUrl = await fetchProtectedImage(src, apiKey, employeeId);
      if (!blobUrl) return;

      img.setAttribute("src", blobUrl);
      img.setAttribute("draggable", "false");
      img.setAttribute("data-locked", "true");

      const existing = img.getAttribute("style") || "";
      const extra = "pointer-events: none; user-select: none;";
      img.setAttribute("style", (existing ? existing + ";" : "") + extra);
    }),
  );

  return doc.body ? doc.body.innerHTML : html;
}

async function resolveTemplateProtectedAssets(
  template = {},
  apiKey,
  backendBase,
) {
  if (!template) return template;

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

  await Promise.all(
    candidateFields.map(async (field) => {
      const val = t[field];
      if (typeof val === "string" && /\/api\/orgs\/\d+\/uploads\//.test(val)) {
        let src = val;
        if (src.startsWith("/api/")) {
          if (!backendBase) {
            console.warn(
              "resolveTemplateProtectedAssets: backendBase required for relative /api/ urls",
              src,
            );
            return;
          }
          const base = backendBase.replace(/\/$/, "");
          src = base + src;
        }
        const blob = await fetchProtectedImage(src, apiKey, employeeId);
        if (blob) t[field] = blob;
      }
    }),
  );

  if (
    typeof t.html === "string" &&
    /\/api\/orgs\/\d+\/uploads\//.test(t.html)
  ) {
    t.html = await replaceUploadUrlsInHtml(t.html, apiKey, backendBase);
  }

  if (t.grapesJson && typeof t.grapesJson === "object") {
    try {
      const copy = JSON.parse(JSON.stringify(t.grapesJson));
      async function walk(node) {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) {
          for (const c of node) await walk(c);
          return;
        }
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
                src,
              );
            } else {
              const base = backendBase.replace(/\/$/, "");
              src = base + src;
            }
          }
          const blob = await fetchProtectedImage(src, apiKey, employeeId);
          if (blob) {
            node.attributes.src = blob;
            node.attributes["draggable"] = "false";
            node.attributes["data-locked"] = "true";
            node.attributes["style"] =
              (node.attributes["style"] || "") +
              ";pointer-events:none;user-select:none;";
          }
        }
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
                  src,
                );
                continue;
              }
              const base = backendBase.replace(/\/$/, "");
              src = base + src;
            }
            const blob = await fetchProtectedImage(src, apiKey, employeeId);
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
        err,
      );
    }
  }

  return t;
}

export default function TemplateBuilder() {
  const { user } = useAuth();
  const [mode, setMode] = useState("upload");
  const [viewingTemplate, setViewingTemplate] = useState(null);
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
  const [previewWatermarkUrl, setPreviewWatermarkUrl] = useState(null);
  const [templateSource, setTemplateSource] = useState(null);
  const [watermarkProps, setWatermarkProps] = useState({
    xPct: "50%",
    yPct: "50%",
    wPct: "60%",
    hPct: "60%",
    opacity: 0.12,
  });
  const HEADER_HEIGHT_PCT = 10;
  const FOOTER_HEIGHT_PCT = 10;
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkFile, setWatermarkFile] = useState(null);
  const fileInputWatermarkRef = useRef(null);
  const [bodyType, setBodyType] = useState("letter");
  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const headerImgRef = useRef(null);
  const footerImgRef = useRef(null);
  const editorWrapperRef = useRef(null);
  const fileInputFieldRef = useRef(null);
  const basicEditorRef = useRef(null);
  const scratchEditorRef = useRef(null);
  const [activeArea, setActiveArea] = useState("body");

  const [bodyBoxes, setBodyBoxes] = useState(() =>
    (fieldsToBoxes(PRESET_FIELDS["letter"] || []) || []).map((b) => ({
      ...b,
      locked: false,
    })),
  );

  const [showEditor, setShowEditor] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [placeholders, setPlaceholders] = useState({
    companyName: "",
    bankName: "",
    accountNo: "",
    IFSC: "",
    accountHolder: "",
  });
  const [qrUrl, setQrUrl] = useState(null);
  const [sealUrl, setSealUrl] = useState(null);
  const [pageStyle, setPageStyle] = useState({ background: "transparent" });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.org_id ??
    user?.Org_id ??
    user?.raw?.Org_id ??
    null;
  const employeeId =
    user?.employeeId || user?.employee_id || user?.raw?.employee_id || null;

  useEffect(() => {
    if (mode === "view") {
      setShowSavedPane(true);
    }
  }, [mode]);

  useEffect(() => {
    const parsedOrg = orgId ? Number(orgId) : null;
    if (orgId && Number.isNaN(parsedOrg)) return;
    fetchPublicBasicTemplates();
    if (parsedOrg) fetchSavedTemplates(parsedOrg);
  }, [orgId]);

  function applyPlaceholdersToString(content = "", ph = {}) {
    if (typeof content !== "string") return content;
    let out = content;
    if (ph.bankName) out = out.replace(/\[Bank Name\]/g, ph.bankName);
    if (ph.accountNo) out = out.replace(/\[Bank Account\]/g, ph.accountNo);
    if (ph.IFSC) out = out.replace(/\[Bank IFSC\]/g, ph.IFSC);
    if (ph.accountHolder)
      out = out.replace(/\[Account Name\]/g, ph.accountHolder);
    if (ph.companyName) out = out.replace(/\[Company Name\]/g, ph.companyName);
    return out;
  }

  function applyPlaceholdersToBoxes(ph = {}) {
    setBodyBoxes((prev) =>
      (prev || []).map((b) => {
        if (!b) return b;
        const newBox = { ...b };
        if (typeof newBox.content === "string") {
          newBox.content = applyPlaceholdersToString(newBox.content, ph);
        }
        if (Array.isArray(newBox.tableRows)) {
          newBox.tableRows = newBox.tableRows.map((row) =>
            row.map((cell) =>
              typeof cell === "string"
                ? applyPlaceholdersToString(cell, ph)
                : cell,
            ),
          );
        }
        return { ...newBox, locked: false };
      }),
    );
  }

  function applyImageOverrides({ qr, seal }) {
    setBodyBoxes((prev) =>
      (prev || []).map((b) => {
        const newBox = { ...b };
        const name =
          ((newBox.fieldName || "") + "").toLowerCase() ||
          (newBox.name || "").toLowerCase();
        if (qr && /(qrcode|qr|qr_code)/.test(name)) {
          newBox.imageUrl = qr;
          newBox.content = qr;
        }
        if (seal && /(seal|companyseal|stamp)/.test(name)) {
          newBox.imageUrl = seal;
          newBox.content = seal;
        }
        return { ...newBox, locked: false };
      }),
    );
  }

  function updateFieldById(id, patch = {}) {
    setBodyBoxes((prev) =>
      (prev || []).map((b) => {
        if (!b || b.id !== id) return b;
        const mergedStyle = { ...(b.style || {}), ...(patch.style || {}) };
        const merged = {
          ...b,
          ...patch,
          style: mergedStyle,
          locked: false,
        };
        if (patch.hasOwnProperty("imageUrl")) merged.imageUrl = patch.imageUrl;
        if (patch.hasOwnProperty("content")) merged.content = patch.content;
        return merged;
      }),
    );
  }

  function updateSelectedFieldStyle(stylePatch = {}) {
    if (!selectedFieldId) return;
    updateFieldById(selectedFieldId, { style: stylePatch });
  }

  function updateSelectedFieldContent(content) {
    if (!selectedFieldId) return;
    updateFieldById(selectedFieldId, { content });
  }

  function handleQrUpload(file, targetBoxId = null) {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setQrUrl(u);
    if (targetBoxId) {
      updateFieldById(targetBoxId, { imageUrl: u, content: u, locked: false });
      return;
    }
    applyImageOverrides({ qr: u, seal: null });
  }

  function handleSealUpload(file, targetBoxId = null) {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setSealUrl(u);
    if (targetBoxId) {
      updateFieldById(targetBoxId, { imageUrl: u, content: u, locked: false });
      return;
    }
    applyImageOverrides({ qr: null, seal: u });
  }

  function idsEqual(a = [], b = []) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (String(a[i]?.id) !== String(b[i]?.id)) return false;
    }
    return true;
  }

  useEffect(() => {
    try {
      const preset = PRESET_FIELDS[bodyType] || [];
      const presetBoxes = fieldsToBoxes(
        preset || [],
        HEADER_HEIGHT_PCT + 1,
      ).map((b) => ({
        ...b,
        locked: false,
        style: { ...(b.style || {}) },
      }));

      setBodyBoxes((prev) => {
        if (showEditor) return prev || presetBoxes;

        if (!prev || !prev.length) return presetBoxes;

        if (idsEqual(prev, presetBoxes)) return prev;

        return prev;
      });
    } catch (e) {
      console.warn("rebuilding boxes from bodyType failed", e);
    }
  }, [bodyType, showEditor]);

  useEffect(() => {
    if (!bodyBoxes || bodyBoxes.length === 0) {
      console.warn(
        "TemplateBuilder: bodyBoxes is empty (possible overwrite).",
        { mode, showEditor },
      );
    }
  }, [bodyBoxes]);

  useEffect(() => {
    applyPlaceholdersToBoxes(placeholders);
  }, [placeholders]);

  useEffect(() => {
    if (qrUrl || sealUrl) applyImageOverrides({ qr: qrUrl, seal: sealUrl });
  }, [qrUrl, sealUrl]);

  const lastTapRef = useRef({ id: null, time: 0 });
  const singleTapTimerRef = useRef(null);
  const DOUBLE_TAP_MS = 350;

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
    };
  }, []);

  function setAppMode(newMode) {
    setMode(newMode);

    if (newMode === "upload" || newMode === "scratch") {
      setTemplateSource(null);
    }

    if (newMode === "saved" || newMode === "view") {
      setShowSavedPane(true);
    } else if (newMode !== "basic" || templateSource !== "saved") {
      setShowSavedPane(false);
    }

    if (newMode !== "basic") {
      setGenerated(null);
    }
    if (newMode !== "upload" && newMode !== "view") {
      setPreviewHeaderUrl(null);
      setPreviewFooterUrl(null);
      setPreviewWatermarkUrl(null);
    }
    if (newMode !== "view") {
      setViewingTemplate(null);
    }
  }

  async function fetchPublicBasicTemplates() {
    setLoading(true);
    const localBase = "/commonTemplates/basic";
    const thumbBase = "/commonTemplates/thumbnails";

    try {
      const manifestUrl = `${localBase}/manifest.json`;

      const mRes = await fetch(manifestUrl);
      if (!mRes.ok) throw new Error(`manifest not found (${mRes.status})`);
      const manifest = await mRes.json();

      const loaded = await Promise.all(
        manifest.map(async (entry) => {
          const fileUrl = `${localBase}/${entry.file}`;
          let html = "";
          try {
            const r = await fetch(fileUrl);
            if (r.ok) html = await r.text();
          } catch (err) {
            console.warn(
              "[fetchPublicBasicTemplates] failed to fetch template html",
              fileUrl,
              err,
            );
          }
          let thumbnail = null;
          if (entry.thumbnail) {
            try {
              let t = String(entry.thumbnail).trim();
              t = t.replace(/^(\.\/)+/, "");
              t = t.replace(/^(\.\.\/)+/, "");
              const parts = t.split("/").filter(Boolean);
              const fname = parts.length ? parts[parts.length - 1] : t;
              thumbnail = `${thumbBase}/${fname}`.replace(/\/+/g, "/");
            } catch (e) {
              console.warn(
                "[fetchPublicBasicTemplates] thumbnail normalize failed",
                entry.thumbnail,
                e,
              );
            }
          }

          return {
            id: entry.id,
            name: entry.name,
            description: entry.description || "",
            html,
            grapesJson: null,
            thumbnail,
            origin: "public",
            rawEntry: entry,
          };
        }),
      );

      setPublicTemplates(loaded);
      return;
    } catch (err) {
      console.warn(
        "[fetchPublicBasicTemplates] failed to load local basic templates:",
        err && err.message,
      );
      setPublicTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSavedTemplates(org) {
    if (!org) return [];
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orgs/${org}/templates`, {
        method: "GET",
        credentials: "include",
        headers: {
          "x-api-key": API_KEY || "",
          "x-employee-id": employeeId || "",
        },
      });
      if (!res.ok) {
        console.warn("Failed to fetch saved templates", res.status);
        setLoading(false);
        return [];
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn("Unexpected saved templates response:", data);
        setLoading(false);
        return [];
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
      return normalized;
    } catch (err) {
      console.error("fetchSavedTemplates failed", err);
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function chooseBasic(template) {
    if (!template) return;
    if (template.origin === "saved") {
      setTemplateSource("saved");
      try {
        const resolved = await resolveTemplateProtectedAssets(
          template,
          API_KEY,
          BACKEND_URL,
        );

        try {
          const rawLayout =
            resolved.layout ||
            resolved.layout_json ||
            (resolved.meta &&
              (resolved.meta.layout || resolved.meta.layout_json));
          if (rawLayout) {
            let parsed = null;
            if (typeof rawLayout === "string") parsed = JSON.parse(rawLayout);
            else parsed = rawLayout;
            if (Array.isArray(parsed)) setBodyBoxes(parsed);
          } else {
            setBodyBoxes(fieldsToBoxes(PRESET_FIELDS[bodyType] || []));
          }
        } catch (e) {}

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

        const headerBlob = headerCandidates.find(
          (x) => typeof x === "string" && x,
        );
        const footerBlob = footerCandidates.find(
          (x) => typeof x === "string" && x,
        );

        if (headerBlob) resolved._headerBlob = headerBlob;
        if (footerBlob) resolved._footerBlob = footerBlob;

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
    setTemplateSource("public");
    setGenerated(template);
    setAppMode("basic");
  }

  async function handleUploadSaved(savedData) {
    if (!savedData) {
      console.warn("handleUploadSaved: no savedData provided");
      return;
    }

    if (!orgId) {
      setSavedModalVisible(true);
      setShowSavedPane(true);
      return;
    }

    try {
      const entry = savedData;
      let grapesJson = entry.grapes_json || entry.grapesJson || null;
      try {
        if (typeof grapesJson === "string" && grapesJson.trim())
          grapesJson = JSON.parse(grapesJson);
      } catch (e) {
        console.warn("handleUploadSaved: grapesJson parse failed", e);
      }

      let thumbnail = entry.thumbnail_url || entry.thumbnail || null;
      if (thumbnail && !thumbnail.startsWith("http") && BACKEND_URL && orgId) {
        try {
          const base = BACKEND_URL.replace(/\/$/, "");
          thumbnail = `${base}/api/orgs/${orgId}/uploads/${thumbnail}`;
        } catch (e) {
          console.warn("handleUploadSaved: thumbnail normalize failed", e);
        }
      }

      const normalized = {
        ...entry,
        grapesJson,
        html: entry.html || null,
        thumbnail,
        template_type: entry.template_type || entry.templateType || "scan",
        category: entry.category || inferCategory(entry) || "saved_uploads",
        origin: "saved",
      };

      setSavedTemplates((prev) => {
        try {
          const exists = prev.some(
            (t) => String(t.id) === String(normalized.id),
          );
          if (exists)
            return prev.map((t) =>
              String(t.id) === String(normalized.id) ? normalized : t,
            );
          return [normalized, ...prev];
        } catch (e) {
          console.warn("handleUploadSaved: setSavedTemplates failed", e);
          return prev;
        }
      });

      setSavedModalVisible(true);
      setShowSavedPane(true);

      const resolved = await resolveTemplateProtectedAssets(
        normalized,
        API_KEY,
        BACKEND_URL,
      );

      let parsedBodyBoxes = null;
      try {
        const rawLayout =
          resolved.layout ||
          resolved.layout_json ||
          (resolved.meta &&
            (resolved.meta.layout || resolved.meta.layout_json));
        if (rawLayout) {
          parsedBodyBoxes =
            typeof rawLayout === "string" ? JSON.parse(rawLayout) : rawLayout;
          if (!Array.isArray(parsedBodyBoxes)) parsedBodyBoxes = null;
        }
      } catch (e) {
        console.warn("handleUploadSaved: layout parse failed", e);
        parsedBodyBoxes = null;
      }
      if (!parsedBodyBoxes) {
        parsedBodyBoxes = fieldsToBoxes(PRESET_FIELDS[bodyType] || []);
      }

      async function ensureBlobUrl(src) {
        if (!src) return null;
        if (
          src.startsWith("blob:") ||
          src.startsWith("data:") ||
          /^https?:\/\//i.test(src)
        ) {
          return src;
        }

        if (
          !src.startsWith("/api/") &&
          !/^https?:\/\//i.test(src) &&
          /^[^\/\\]+\.(png|jpe?g|svg|gif|webp)$/i.test(src)
        ) {
          if (BACKEND_URL && orgId) {
            src = `${BACKEND_URL.replace(
              /\/$/,
              "",
            )}/api/orgs/${orgId}/uploads/${src}`;
          }
        }

        if (src.startsWith("/api/")) {
          if (BACKEND_URL) src = `${BACKEND_URL.replace(/\/$/, "")}${src}`;
        }

        try {
          const blobUrl = await fetchProtectedImage(src, API_KEY, employeeId);
          if (blobUrl) return blobUrl;
        } catch (e) {
          console.warn("handleUploadSaved: ensureBlobUrl fetch failed", src, e);
        }
        return src;
      }

      const headerCandidates = [
        resolved.header_url,
        resolved.headerUrl,
        resolved.header,
        resolved._headerBlob,
        resolved.imageUrl,
        resolved.cleanedUrl,
        resolved.thumbnail,
      ];
      const footerCandidates = [
        resolved.footer_url,
        resolved.footerUrl,
        resolved.footer,
        resolved._footerBlob,
      ];

      let headerRaw =
        headerCandidates.find((x) => typeof x === "string" && x) || null;
      let footerRaw =
        footerCandidates.find((x) => typeof x === "string" && x) || null;

      let watermarkUrl = null;
      let watermarkPlacementProps = null;
      if (resolved.grapesJson && resolved.grapesJson.watermark) {
        const wm = resolved.grapesJson.watermark;
        watermarkUrl = wm?.url || null;
        watermarkPlacementProps = {
          xPct: wm?.xPct || "50%",
          yPct: wm?.yPct || "50%",
          wPct: wm?.wPct || "60%",
          hPct: wm?.hPct || "60%",
          opacity: typeof wm?.opacity === "number" ? wm.opacity : 0.12,
        };
      } else if (resolved.meta && resolved.meta.watermark) {
        watermarkUrl =
          typeof resolved.meta.watermark === "string"
            ? resolved.meta.watermark
            : null;
        const wp = resolved.meta.watermarkPlacement;
        if (wp)
          watermarkPlacementProps = {
            xPct: wp.xPct || "50%",
            yPct: wp.yPct || "50%",
            wPct: wp.wPct || "60%",
            hPct: wp.hPct || "60%",
            opacity: typeof wp.opacity === "number" ? wp.opacity : 0.12,
          };
      }

      function collectUploadStrings(obj, out = new Set()) {
        if (!obj) return out;
        if (typeof obj === "string") {
          if (
            /\/api\/orgs\/\d+\/uploads\/[^"'\s]+/i.test(obj) ||
            /^[^\/\\]+\.(png|jpe?g|svg|gif|webp)$/i.test(obj)
          ) {
            out.add(obj);
          }
          return out;
        }
        if (Array.isArray(obj)) {
          for (const v of obj) collectUploadStrings(v, out);
          return out;
        }
        if (typeof obj === "object") {
          for (const k of Object.keys(obj)) {
            try {
              collectUploadStrings(obj[k], out);
            } catch (e) {}
          }
        }
        return out;
      }

      const foundAll = Array.from(collectUploadStrings(resolved));
      const excludeMeta = new Set(
        [
          resolved?.meta?.qr,
          resolved?.meta?.seal,
          resolved?.meta?.qrUrl,
          resolved?.meta?.sealUrl,
          resolved?.meta?.qr_url,
          resolved?.meta?.seal_url,
          resolved?.meta?.uploads?.qr,
          resolved?.meta?.uploads?.seal,
        ].filter(Boolean),
      );

      const filtered = foundAll.filter((u) => {
        if (!u) return false;
        if (excludeMeta.has(u)) return false;
        if (headerRaw && u === headerRaw) return false;
        if (footerRaw && u === footerRaw) return false;
        if (watermarkUrl && u === watermarkUrl) return false;
        return true;
      });

      if (!headerRaw && filtered.length >= 1) headerRaw = filtered[0];
      if (!footerRaw && filtered.length >= 2) footerRaw = filtered[1];
      if (!watermarkUrl && filtered.length) {
        const candid = filtered.find((u) => u !== headerRaw && u !== footerRaw);
        if (candid) watermarkUrl = candid;
      }

      const headerUrlResolved = await ensureBlobUrl(headerRaw);
      const footerUrlResolved = await ensureBlobUrl(footerRaw);
      const watermarkUrlResolved = watermarkUrl
        ? await ensureBlobUrl(watermarkUrl)
        : null;

      let finalHeaderUrl = headerUrlResolved;
      let finalFooterUrl = footerUrlResolved;
      if (
        watermarkUrlResolved &&
        finalHeaderUrl &&
        finalHeaderUrl === watermarkUrlResolved
      ) {
        finalHeaderUrl = null;
      }
      if (
        watermarkUrlResolved &&
        finalFooterUrl &&
        finalFooterUrl === watermarkUrlResolved
      ) {
        finalFooterUrl = null;
      }
      if (
        finalHeaderUrl &&
        finalFooterUrl &&
        finalHeaderUrl === finalFooterUrl
      ) {
        finalFooterUrl = null;
      }

      setBodyBoxes(parsedBodyBoxes);
      setViewingTemplate({
        name: normalized.name || normalized.meta?.name || "",
        headerUrl: finalHeaderUrl,
        footerUrl: finalFooterUrl,
        watermarkUrl: watermarkUrlResolved,
        watermarkProps: watermarkPlacementProps ||
          watermarkProps || {
            xPct: "50%",
            yPct: "50%",
            wPct: "60%",
            hPct: "60%",
            opacity: 0.12,
          },
        bodyBoxes: parsedBodyBoxes,
      });

      setAppMode("view");
      setShowSavedPane(true);
      setSavedModalVisible(true);

      return;
    } catch (err) {
      console.error("handleUploadSaved/openSavedTemplate failed", err);
      if (orgId) fetchSavedTemplates(orgId);
      setSavedModalVisible(true);
      setShowSavedPane(true);
    }
  }

  async function openSavedTemplate(templateOrId) {
    let template = templateOrId;
    if (!template) {
      console.warn("openSavedTemplate: called with empty value");
      return;
    }

    if (typeof template === "string" || typeof template === "number") {
      const idStr = String(template);
      const found = (savedTemplates || []).find(
        (t) => String(t.id) === idStr || String(t._id) === idStr,
      );
      if (!found) {
        console.warn(
          "openSavedTemplate: template id not found in savedTemplates:",
          idStr,
        );
        return;
      }
      template = found;
    }

    setTemplateSource("saved");
    setShowSavedPane(true);

    const cat = template.category || inferCategory(template);
    const isUpload =
      cat === "saved_uploads" ||
      String(template.template_type || "").toLowerCase() === "scan";

    async function ensureBlobUrl(src) {
      if (!src) return null;
      if (
        src.startsWith("blob:") ||
        src.startsWith("data:") ||
        /^https?:\/\//i.test(src)
      ) {
        return src;
      }
      if (
        !src.startsWith("/api/") &&
        !/^https?:\/\//i.test(src) &&
        /^[^\/\\]+\.(png|jpe?g|svg|gif|webp)$/i.test(src)
      ) {
        if (BACKEND_URL && orgId) {
          src = `${BACKEND_URL.replace(
            /\/$/,
            "",
          )}/api/orgs/${orgId}/uploads/${src}`;
        }
      }
      if (src.startsWith("/api/")) {
        if (BACKEND_URL) {
          src = `${BACKEND_URL.replace(/\/$/, "")}${src}`;
        } else {
          console.warn("ensureBlobUrl: BACKEND_URL missing for", src);
        }
      }
      try {
        const blobUrl = await fetchProtectedImage(src, API_KEY, employeeId);
        if (blobUrl) return blobUrl;
      } catch (e) {
        console.warn("ensureBlobUrl: fetchProtectedImage failed for", src, e);
      }
      return src;
    }

    try {
      let resolved = template;
      try {
        resolved = await resolveTemplateProtectedAssets(
          template,
          API_KEY,
          BACKEND_URL,
        );
      } catch (e) {
        console.warn(
          "openSavedTemplate: resolveTemplateProtectedAssets failed",
          e,
        );
      }

      let parsedBodyBoxes = null;
      try {
        const rawLayout =
          resolved.layout ||
          resolved.layout_json ||
          (resolved.meta &&
            (resolved.meta.layout || resolved.meta.layout_json));
        if (rawLayout) {
          parsedBodyBoxes =
            typeof rawLayout === "string" ? JSON.parse(rawLayout) : rawLayout;
          if (!Array.isArray(parsedBodyBoxes)) parsedBodyBoxes = null;
        }
      } catch (e) {
        console.warn("openSavedTemplate: layout parse failed", e);
        parsedBodyBoxes = null;
      }
      if (!parsedBodyBoxes)
        parsedBodyBoxes = fieldsToBoxes(PRESET_FIELDS[bodyType] || []);
      setBodyBoxes(parsedBodyBoxes);

      const explicitHeaderCandidates = [
        resolved.header_url,
        resolved.headerUrl,
        resolved.header,
        resolved.grapesJson && resolved.grapesJson.headerUrl,
        resolved.meta && resolved.meta.uploads && resolved.meta.uploads.header,
        resolved.thumbnail,
        resolved.thumbnail_url,
      ].filter(Boolean);

      const explicitFooterCandidates = [
        resolved.footer_url,
        resolved.footerUrl,
        resolved.footer,
        resolved.grapesJson && resolved.grapesJson.footerUrl,
        resolved.meta && resolved.meta.uploads && resolved.meta.uploads.footer,
      ].filter(Boolean);

      let watermarkUrl = null;
      let watermarkPlacementProps = null;
      if (resolved.grapesJson && resolved.grapesJson.watermark) {
        const wmData = resolved.grapesJson.watermark;
        if (wmData && wmData.url) {
          watermarkUrl = wmData.url;
          watermarkPlacementProps = {
            xPct: wmData.xPct || "50%",
            yPct: wmData.yPct || "50%",
            wPct: wmData.wPct || "60%",
            hPct: wmData.hPct || "60%",
            opacity: typeof wmData.opacity === "number" ? wmData.opacity : 0.12,
          };
        }
      }
      if (
        !watermarkUrl &&
        resolved.meta &&
        resolved.meta.uploads &&
        resolved.meta.uploads.watermark
      ) {
        watermarkUrl = resolved.meta.uploads.watermark;
      }
      if (
        !watermarkUrl &&
        resolved.meta &&
        resolved.meta.watermark &&
        typeof resolved.meta.watermark === "string"
      ) {
        watermarkUrl = resolved.meta.watermark;
      }
      if (
        !watermarkPlacementProps &&
        resolved.meta &&
        resolved.meta.watermarkPlacement
      ) {
        const wp = resolved.meta.watermarkPlacement;
        watermarkPlacementProps = {
          xPct: wp.xPct || "50%",
          yPct: wp.yPct || "50%",
          wPct: wp.wPct || "60%",
          hPct: wp.hPct || "60%",
          opacity: typeof wp.opacity === "number" ? wp.opacity : 0.12,
        };
      }

      let rawHeader =
        explicitHeaderCandidates.length > 0
          ? explicitHeaderCandidates[0]
          : null;
      let rawFooter =
        explicitFooterCandidates.length > 0
          ? explicitFooterCandidates[0]
          : null;

      function collectUploadStrings(obj, out = new Set()) {
        if (!obj) return out;
        if (typeof obj === "string") {
          if (
            /\/api\/orgs\/\d+\/uploads\/[^"'\s]+/i.test(obj) ||
            /^[^\/\\]+\.(png|jpe?g|svg|gif|webp)$/i.test(obj)
          ) {
            out.add(obj);
          }
          return out;
        }
        if (Array.isArray(obj)) {
          for (const v of obj) collectUploadStrings(v, out);
          return out;
        }
        if (typeof obj === "object") {
          for (const k of Object.keys(obj)) {
            try {
              collectUploadStrings(obj[k], out);
            } catch (e) {}
          }
        }
        return out;
      }

      if (!rawHeader || !rawFooter || !watermarkUrl) {
        const found = Array.from(collectUploadStrings(resolved));

        const excludeMeta = new Set(
          [
            resolved?.meta?.qr,
            resolved?.meta?.seal,
            resolved?.meta?.qrUrl,
            resolved?.meta?.sealUrl,
            resolved?.meta?.qr_url,
            resolved?.meta?.seal_url,
            resolved?.meta?.uploads && resolved?.meta?.uploads.qr,
            resolved?.meta?.uploads && resolved?.meta?.uploads.seal,
            rawHeader,
            rawFooter,
            watermarkUrl,
          ].filter(Boolean),
        );

        const filtered = found.filter((u) => {
          if (!u) return false;
          if (excludeMeta.has(u)) return false;
          return true;
        });

        if (!rawHeader && filtered.length >= 1) rawHeader = filtered[0];
        if (!rawFooter && filtered.length >= 2) rawFooter = filtered[1];

        if (!watermarkUrl && filtered.length) {
          const candid = filtered.find(
            (u) => u !== rawHeader && u !== rawFooter,
          );
          if (candid) watermarkUrl = candid;
        }
      }

      let headerBlobUrl = rawHeader ? await ensureBlobUrl(rawHeader) : null;
      let footerBlobUrl = rawFooter ? await ensureBlobUrl(rawFooter) : null;
      const watermarkBlobUrl = watermarkUrl
        ? await ensureBlobUrl(watermarkUrl)
        : null;

      if (watermarkBlobUrl) {
        if (headerBlobUrl && headerBlobUrl === watermarkBlobUrl) {
          console.warn(
            "openSavedTemplate: clearing header because it matched watermark",
          );
          headerBlobUrl = null;
        }
        if (footerBlobUrl && footerBlobUrl === watermarkBlobUrl) {
          console.warn(
            "openSavedTemplate: clearing footer because it matched watermark",
          );
          footerBlobUrl = null;
        }
      }

      if (headerBlobUrl && footerBlobUrl && headerBlobUrl === footerBlobUrl) {
        try {
          const allFound = Array.from(collectUploadStrings(resolved));
          const prefer = allFound.filter((u) => {
            if (!u) return false;
            if (watermarkUrl && u === watermarkUrl) return false;
            if (rawHeader && u === rawHeader) return false;
            if (rawFooter && u === rawFooter) return false;
            return true;
          });
          for (const cand of prefer) {
            try {
              const candBlob = await ensureBlobUrl(cand);
              if (!candBlob) continue;
              if (candBlob !== headerBlobUrl && candBlob !== watermarkBlobUrl) {
                footerBlobUrl = candBlob;
                break;
              }
            } catch (e) {}
          }
        } catch (e) {}
        if (headerBlobUrl && footerBlobUrl && headerBlobUrl === footerBlobUrl) {
          footerBlobUrl = null;
        }
      }

      setViewingTemplate({
        name: template.name,
        headerUrl: headerBlobUrl,
        footerUrl: footerBlobUrl,
        watermarkUrl: watermarkBlobUrl,
        watermarkProps: watermarkPlacementProps || {
          xPct: "50%",
          yPct: "50%",
          wPct: "60%",
          hPct: "60%",
          opacity: 0.12,
        },
        bodyBoxes: parsedBodyBoxes,
      });
      setGenerated(null);
      setAppMode("view");
      setShowEditor(false);
      if (orgId) fetchSavedTemplates(orgId);

      return;
    } catch (err) {
      console.warn("openSavedTemplate: unexpected error", err);
      return chooseBasic(template);
    }
  }

  useEffect(() => {
    if (previewWatermarkUrl && !watermarkEnabled) setWatermarkEnabled(true);
  }, [previewWatermarkUrl, watermarkEnabled]);

  useEffect(() => {
    if (viewingTemplate && viewingTemplate.watermarkUrl) {
      setWatermarkEnabled(true);
    }
  }, [viewingTemplate]);

  async function handleCustomSave(payload) {
    const saveUrl = orgId ? `${BACKEND_URL}/api/orgs/${orgId}/templates` : null;

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

    const explicitLayout =
      payload.layout ||
      (payload.meta && (payload.meta.layout || payload.meta.layout_json));

    let layoutToPersist = null;
    try {
      if (explicitLayout) {
        layoutToPersist =
          typeof explicitLayout === "string"
            ? explicitLayout
            : JSON.stringify(explicitLayout);
      } else {
        layoutToPersist = JSON.stringify(bodyBoxes || []);
      }
    } catch (e) {
      layoutToPersist = JSON.stringify(bodyBoxes || []);
    }

    const bodyPayload = {
      name: payload.meta?.name || payload.name || "Untitled Template",
      template_type: "custom",
      grapes_json: grapesJson ? JSON.stringify(grapesJson) : null,
      html: html || null,
      css: css || null,
      thumbnail_url: thumbnail_url || null,
      layout: layoutToPersist,
    };

    try {
      const resp = await fetch(saveUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY || "",
          "x-employee-id": employeeId || "",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Save failed");

      const normalized = (function (entry) {
        if (!entry) return entry;
        let grapesJson = entry.grapes_json || entry.grapesJson || null;
        try {
          if (typeof grapesJson === "string" && grapesJson.trim())
            grapesJson = JSON.parse(grapesJson);
        } catch (e) {}

        let thumbnail = entry.thumbnail_url || entry.thumbnail || null;
        if (
          thumbnail &&
          !thumbnail.startsWith("http") &&
          BACKEND_URL &&
          orgId
        ) {
          try {
            const base = BACKEND_URL.replace(/\/$/, "");
            thumbnail = `${base}/api/orgs/${orgId}/uploads/${thumbnail}`;
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
      })(data);

      setSavedModalVisible(true);
      setShowSavedPane(true);

      setSavedTemplates((prev) => {
        try {
          if (!normalized) return prev;
          const exists = prev.some(
            (t) => String(t.id) === String(normalized.id),
          );
          if (exists)
            return prev.map((t) =>
              String(t.id) === String(normalized.id) ? normalized : t,
            );
          return [normalized, ...prev];
        } catch (e) {
          return prev;
        }
      });

      if (orgId) {
        try {
          const refreshed = await fetchSavedTemplates(orgId);
          const idToFind = normalized?.id || data?.id;
          const found = Array.isArray(refreshed)
            ? refreshed.find((t) => String(t.id) === String(idToFind))
            : null;
          if (found) {
            setAppMode("saved");
            await openSavedTemplate(found);
            return;
          }
        } catch (e) {
          console.warn("Opening saved template after refresh failed", e);
        }
      }

      setAppMode("saved");
      try {
        await openSavedTemplate(normalized);
      } catch (e) {
        console.warn("openSavedTemplate failed for newly saved template", e);
        if (orgId) fetchSavedTemplates(orgId);
      }
    } catch (err) {
      console.error("save failed", err);
      alert("Save failed: " + (err.message || "error"));
    }
  }

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

  async function editSavedTemplate(entry) {
    if (!entry) return;
    try {
      const resolved = await resolveTemplateProtectedAssets(
        entry,
        API_KEY,
        BACKEND_URL,
      );

      const cat = entry.category || inferCategory(entry);
      const isUpload =
        cat === "saved_uploads" ||
        String(entry.template_type || "").toLowerCase() === "scan";

      if (isUpload) {
        const headerCandidates = [
          resolved.header_url,
          resolved.headerUrl,
          resolved.header,
          resolved._headerBlob,
          resolved.imageUrl,
          resolved.cleanedUrl,
          resolved.thumbnail,
        ];
        const footerCandidates = [
          resolved.footer_url,
          resolved.footerUrl,
          resolved.footer,
          resolved._footerBlob,
        ];

        const headerRaw =
          headerCandidates.find((x) => typeof x === "string" && x) || null;
        const footerRaw =
          footerCandidates.find((x) => typeof x === "string" && x) || null;

        setPreviewHeaderUrl(headerRaw);
        setPreviewFooterUrl(footerRaw);

        let watermarkUrl = null;
        let watermarkPlacementProps = null;
        if (resolved.grapesJson && resolved.grapesJson.watermark) {
          const wm = resolved.grapesJson.watermark;
          watermarkUrl = wm?.url || null;
          watermarkPlacementProps = {
            xPct: wm?.xPct || "50%",
            yPct: wm?.yPct || "50%",
            wPct: wm?.wPct || "60%",
            hPct: wm?.hPct || "60%",
            opacity: typeof wm?.opacity === "number" ? wm.opacity : 0.12,
          };
        } else if (resolved.meta && resolved.meta.watermark) {
          watermarkUrl =
            typeof resolved.meta.watermark === "string"
              ? resolved.meta.watermark
              : null;
          const wp = resolved.meta.watermarkPlacement;
          if (wp)
            watermarkPlacementProps = {
              xPct: wp.xPct || "50%",
              yPct: wp.yPct || "50%",
              wPct: wp.wPct || "60%",
              hPct: wp.hPct || "60%",
              opacity: typeof wp.opacity === "number" ? wp.opacity : 0.12,
            };
        }

        setPreviewWatermarkUrl(watermarkUrl);
        if (watermarkPlacementProps) setWatermarkProps(watermarkPlacementProps);

        setBodyBoxes((prev) => {
          try {
            const rawLayout =
              resolved.layout ||
              resolved.layout_json ||
              resolved.meta?.layout ||
              resolved.meta?.layout_json;
            if (rawLayout) {
              return typeof rawLayout === "string"
                ? JSON.parse(rawLayout)
                : rawLayout;
            }
          } catch (e) {}
          return prev;
        });

        setAppMode("upload");
        setShowEditor(true);
        return;
      }

      setGenerated(resolved || entry);
      setAppMode("basic");
      setShowEditor(true);
    } catch (err) {
      console.error("editSavedTemplate failed", err);
      alert("Failed to open template for editing.");
    }
  }

  async function deleteSavedTemplate(entry) {
    if (!entry || !orgId) return;
    const id = entry.id || entry._id || entry.template_id;
    if (!id) {
      alert("Cannot delete: missing template id");
      return;
    }
    if (
      !confirm(`Delete template "${entry.name || id}"? This cannot be undone.`)
    )
      return;
    try {
      const base = BACKEND_URL.replace(/\/$/, "");
      const url = `${base}/api/orgs/${orgId}/templates/${id}`;
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-api-key": API_KEY || "",
          "x-employee-id": employeeId || "",
        },
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setSavedTemplates((prev) =>
        prev.filter((t) => String(t.id || t._id) !== String(id)),
      );
      if (
        viewingTemplate &&
        (String(viewingTemplate.id) === String(id) ||
          viewingTemplate.name === entry.name)
      ) {
        setViewingTemplate(null);
        setAppMode("upload");
      }
    } catch (err) {
      console.error("deleteSavedTemplate failed", err);
      alert("Failed to delete template: " + (err.message || "error"));
    }
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

    try {
      data.layout =
        data.layout || data.meta.layout || JSON.stringify(bodyBoxes || []);
    } catch (e) {
      data.layout = JSON.stringify(bodyBoxes || []);
    }

    handleCustomSave(data);
  }

  function onHeaderLoad(e) {
    const img = e.target;
    if (!editorWrapperRef.current) return;
    const wrapperWidth =
      editorWrapperRef.current.clientWidth || img.clientWidth;
    const ratio = img.naturalHeight / img.naturalWidth || 0;
    const h = Math.round(wrapperWidth * ratio);
    setHeaderHeight(h);
  }
  function onFooterLoad(e) {
    const img = e.target;
    if (!editorWrapperRef.current) return;
    const wrapperWidth =
      editorWrapperRef.current.clientWidth || img.clientWidth;
    const ratio = img.naturalHeight / img.naturalWidth || 0;
    const h = Math.round(wrapperWidth * ratio);
    setFooterHeight(h);
  }

  function toggleEditor() {
    setShowEditor((s) => !s);
  }
  function resetToPreset() {
    setBodyBoxes(
      fieldsToBoxes(PRESET_FIELDS[bodyType] || []).map((b) => ({
        ...b,
        locked: false,
      })),
    );
    setShowEditor(false);
  }

  const handleWatermarkChange = useCallback((next) => {
    setWatermarkProps((prev) => ({ ...prev, ...(next || {}) }));
  }, []);

  const handlePreviewChange = useCallback(
    ({ headerUrl, footerUrl, watermarkUrl }) => {
      setPreviewHeaderUrl((prev) =>
        prev === headerUrl ? prev : headerUrl || null,
      );
      setPreviewFooterUrl((prev) =>
        prev === footerUrl ? prev : footerUrl || null,
      );
      setPreviewWatermarkUrl((prev) => {
        const newVal = watermarkUrl || null;
        return prev === newVal ? prev : newVal;
      });
    },
    [],
  );

  const sharedUploadProps = {
    orgId,
    previewHeaderUrl,
    previewFooterUrl,
    previewWatermarkUrl,
    watermarkProps,
    watermarkEnabled,
    setWatermarkEnabled,
    watermarkFile,
    setWatermarkFile,
    fileInputWatermarkRef,
    bodyType,
    bodyBoxes,
    showEditor,
    setShowEditor,
    handleWatermarkChange,
    setBodyBoxes,
    setBodyType,
    handlePreviewChange,
    handleUploadSaved,
    selectedFieldId,
    pageStyle,
    updatePageStyle: (next) =>
      setPageStyle((p) => ({ ...(p || {}), ...(next || {}) })),
    setSelectedFieldId,
    updateFieldById,
    updateSelectedFieldStyle,
    updateSelectedFieldContent,
    setPlaceholders,
    placeholders,
    handleQrUpload,
    handleSealUpload,
    qrUrl,
    sealUrl,
    setActiveArea: (area) => {
      const r = getActiveEditorRef();
      if (r?.current?.setActiveArea) r.current.setActiveArea(area);
    },
    activeArea,
  };

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
          (t.id || "").toLowerCase().includes(q),
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
            .includes(q),
      );
    }
    return list;
  }, [savedTemplates, selectedSavedCategory, query]);

  function handleUploadImage(file, box) {
    if (!file || !box) return;

    const blobUrl = URL.createObjectURL(file);

    const name = String(box.fieldName || box.name || "").toLowerCase();

    if (/qr|qrcode|qr_code/.test(name)) {
      updateFieldById(box.id, {
        imageUrl: blobUrl,
        content: blobUrl,
        locked: false,
      });
      setQrUrl(blobUrl);
      return;
    }

    if (/seal|stamp|companyseal/.test(name)) {
      updateFieldById(box.id, {
        imageUrl: blobUrl,
        content: blobUrl,
        locked: false,
      });
      setSealUrl(blobUrl);
      return;
    }

    updateFieldById(box.id, {
      imageUrl: blobUrl,
      content: blobUrl,
      locked: false,
    });
  }

  function openFieldImagePicker(box) {
    if (!fileInputFieldRef?.current) return;
    fileInputFieldRef.current._targetBoxId = box?.id;
    fileInputFieldRef.current.click();
  }

  function handleFieldImageChange(e) {
    const f = e.target.files?.[0] || null;
    try {
      e.target.value = "";
    } catch (err) {}

    if (!f) return;
    const boxId = e.target._targetBoxId || null;
    const box = (bodyBoxes || []).find((b) => String(b.id) === String(boxId));

    if (box) {
      handleUploadImage(f, box);
      return;
    }

    if (typeof handleUploadImage === "function") {
      try {
        handleUploadImage(f, null);
        return;
      } catch (err) {
        console.warn("handleUploadImage threw", err);
      }
    }

    const name = (box?.fieldName || box?.name || "").toLowerCase();
    if (
      name &&
      /qr|qrcode|qr_code/.test(name) &&
      typeof handleQrUpload === "function"
    ) {
      handleQrUpload(f);
      return;
    }
    if (
      name &&
      /seal|stamp|companyseal/.test(name) &&
      typeof handleSealUpload === "function"
    ) {
      handleSealUpload(f);
      return;
    }

    try {
      const url = URL.createObjectURL(f);
      if (selectedFieldId && typeof updateFieldById === "function") {
        updateFieldById(selectedFieldId, {
          imageUrl: url,
          content: url,
          locked: false,
        });
      }
    } catch (err) {
      console.warn("failed to set image blob url", err);
    }
  }

  function handlePreviewSelectBox(id) {
    const now = Date.now();
    const last = lastTapRef.current || { id: null, time: 0 };

    const box = (bodyBoxes || []).find((b) => String(b.id) === String(id));

    if (last.id && last.id === id && now - last.time <= DOUBLE_TAP_MS) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapRef.current = { id: null, time: 0 };

      if (box && box.type === "image") {
        openFieldImagePicker(box);
        setSelectedFieldId(id);
        return;
      }

      setSelectedFieldId(id);
      setShowEditor(true);
      return;
    }

    lastTapRef.current = { id, time: now };
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }

    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      setSelectedFieldId(id);
      if (box && box.type !== "image") {
        setShowEditor(true);
      }
    }, DOUBLE_TAP_MS);
  }

  return (
    <div className={styles.container}>
      <SidebarPanel
        styles={styles}
        mode={mode}
        setAppMode={setAppMode}
        templateSource={templateSource}
        setTemplateSource={setTemplateSource}
        SAVED_CATEGORIES={SAVED_CATEGORIES}
        selectedSavedCategory={selectedSavedCategory}
        setSelectedSavedCategory={setSelectedSavedCategory}
        filteredSaved={filteredSaved}
        filteredPublic={filteredPublic}
        loading={loading}
        DOC_CATEGORIES={DOC_CATEGORIES}
        selectedDocCategory={selectedDocCategory}
        setSelectedDocCategory={setSelectedDocCategory}
        query={query}
        setQuery={setQuery}
        actions={{
          actionAddText,
          actionAddField,
          actionAddLogo,
          actionAddTable,
          actionTogglePreview,
          actionDeleteSelected,
          openSavePrompt,
        }}
        uploadProps={sharedUploadProps}
        extra={{
          editSavedTemplate,
          deleteSavedTemplate,
          chooseBasic,
          setAppMode,
          setGenerated,
          setViewingTemplate,
          openSavedTemplate,
          handleUploadSaved,
        }}
      />

      {(mode === "upload" || mode === "view") && (
        <div
          style={{
            marginLeft: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {mode === "upload" && (
            <FieldPropertiesPanel
              selectedFieldId={selectedFieldId}
              bodyBoxes={bodyBoxes}
              setSelectedFieldId={setSelectedFieldId}
              updateSelectedFieldStyle={updateSelectedFieldStyle}
              updateSelectedFieldContent={updateSelectedFieldContent}
              onUploadImage={(file, box) => handleUploadImage(file, box)}
              pageStyle={pageStyle}
              updatePageStyle={(next) =>
                setPageStyle((p) => ({ ...(p || {}), ...(next || {}) }))
              }
            />
          )}

          {mode === "view" && viewingTemplate && (
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
              Viewing: {viewingTemplate.name}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <A4Preview
              headerUrl={
                mode === "view" ? viewingTemplate?.headerUrl : previewHeaderUrl
              }
              footerUrl={
                mode === "view" ? viewingTemplate?.footerUrl : previewFooterUrl
              }
              watermarkUrl={
                mode === "view"
                  ? viewingTemplate?.watermarkUrl
                  : previewWatermarkUrl
              }
              watermarkProps={
                mode === "view"
                  ? (viewingTemplate?.watermarkProps ?? watermarkProps)
                  : watermarkProps
              }
              onWatermarkChange={handleWatermarkChange}
              editable={
                mode === "upload" ? watermarkEnabled || showEditor : false
              }
              boxesEditable={mode === "upload" ? showEditor : false}
              onBoxesChange={(next) => {
                if (mode === "upload") {
                  setBodyBoxes(next.map((b) => ({ ...b, locked: false })));
                }
              }}
              pageStyle={pageStyle}
              onSelectBox={handlePreviewSelectBox}
              bodyBoxes={
                mode === "view"
                  ? Array.isArray(viewingTemplate?.bodyBoxes) &&
                    viewingTemplate.bodyBoxes.length
                    ? viewingTemplate.bodyBoxes
                    : bodyBoxes
                  : bodyBoxes
              }
              width={700}
              headerHeightPct={HEADER_HEIGHT_PCT}
              footerHeightPct={FOOTER_HEIGHT_PCT}
            />
          </div>
        </div>
      )}

      <EditorPanel
        styles={styles}
        mode={mode}
        generated={generated}
        bodyType={bodyType}
        setBodyType={setBodyType}
        bodyBoxes={bodyBoxes}
        setBodyBoxes={setBodyBoxes}
        watermarkEnabled={watermarkEnabled}
        setWatermarkEnabled={setWatermarkEnabled}
        watermarkProps={watermarkProps}
        handleWatermarkChange={handleWatermarkChange}
        viewingTemplate={viewingTemplate}
        editorRefs={{
          editorWrapperRef,
          basicEditorRef,
          scratchEditorRef,
          headerImgRef,
          footerImgRef,
        }}
        handlers={{
          toggleEditor,
          resetToPreset,
          handleCustomSave,
          onHeaderLoad,
          onFooterLoad,
        }}
        previewUrls={{
          previewHeaderUrl,
          previewFooterUrl,
          previewWatermarkUrl,
        }}
        extras={{
          templateToBoxes,
          setGenerated,
          setViewingTemplate,
          setShowEditor,
        }}
        watermarkFile={watermarkFile}
        setWatermarkFile={setWatermarkFile}
        fileInputWatermarkRef={fileInputWatermarkRef}
        selection={{
          selectedFieldId,
          setSelectedFieldId,
          updateFieldById,
          updateSelectedFieldStyle,
          updateSelectedFieldContent,
          placeholders,
          setPlaceholders,
          handleQrUpload,
          handleSealUpload,
          qrUrl,
          sealUrl,
        }}
        headerHeightPct={HEADER_HEIGHT_PCT}
        footerHeightPct={FOOTER_HEIGHT_PCT}
      />
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
      <input
        ref={fileInputFieldRef}
        type="file"
        accept="image/*,image/svg+xml"
        style={{ display: "none" }}
        onChange={handleFieldImageChange}
      />
    </div>
  );
}
