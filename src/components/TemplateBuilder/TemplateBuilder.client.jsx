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
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";
import BasicTemplateEditor from "./BasicTemplateEditor.client";
import CustomTemplateEditor from "./CustomTemplateEditor.client";
import styles from "./TemplateBuilder.module.css";
import A4PreviewModal from "../Modal/A4PreviewModal.client";

function dataURLToBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

async function uploadBlob(blob, orgId, BACKEND_URL, API_KEY, employeeId) {
  const formData = new FormData();
  formData.append("file", blob);
  const res = await fetch(`${BACKEND_URL}/api/orgs/${orgId}/uploads`, {
    method: "POST",
    credentials: "include",
    headers: {
      "x-api-key": API_KEY || "",
      "x-employee-id": employeeId || "",
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

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

const protectedImageCache = new Map();

async function fetchProtectedImage(src, apiKey, employeeId) {
  if (!src) return null;
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;

  const cached = protectedImageCache.get(src);
  if (cached) return cached;

  try {
    const res = await fetch(src, {
      method: "GET",
      credentials: "include",
      headers: {
        "x-api-key": apiKey || "",
        "x-employee-id": employeeId || "",
      },
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

async function replaceUploadUrlsInHtml(
  html = "",
  apiKey,
  backendBase,
  employeeId,
) {
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
      if (!blobUrl) {
        img.setAttribute("src", "");
        return;
      }

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
  employeeId,
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
    "qrUrl",
    "sealUrl",
    "qr_url",
    "seal_url",
    "header",
    "footer",
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
        if (blob) {
          t[field] = blob;
        } else {
          t[field] = null;
        }
      }
    }),
  );

  if (
    typeof t.html === "string" &&
    /\/api\/orgs\/\d+\/uploads\//.test(t.html)
  ) {
    t.html = await replaceUploadUrlsInHtml(
      t.html,
      apiKey,
      backendBase,
      employeeId,
    );
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
          } else {
            node.attributes.src = "";
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
            else node[k] = "";
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
  const HEADER_HEIGHT_PCT = 15;
  const FOOTER_HEIGHT_PCT = 10;
  const canvasWidthPx = 794;
  const canvasHeightPx = Math.round(canvasWidthPx * (297 / 210));
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [headerFile, setHeaderFile] = useState(null);
  const [footerFile, setFooterFile] = useState(null);
  const [watermarkFile, setWatermarkFile] = useState(null);
  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [showA4Preview, setShowA4Preview] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const headerImgRef = useRef(null);
  const footerImgRef = useRef(null);
  const editorWrapperRef = useRef(null);
  const fileInputFieldRef = useRef(null);
  const fileInputWatermarkRef = useRef(null);
  const basicEditorRef = useRef(null);
  const scratchEditorRef = useRef(null);
  const [currentPayload, setCurrentPayload] = useState(null);
  const [editingUploadTemplateId, setEditingUploadTemplateId] = useState(null);
  const [activeArea, setActiveArea] = useState("header");
  const [existingHeaderUrl, setExistingHeaderUrl] = useState(null);
  const [existingFooterUrl, setExistingFooterUrl] = useState(null);
  const [existingWatermarkUrl, setExistingWatermarkUrl] = useState(null);
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

  const [modalConfig, setModalConfig] = useState({
    isVisible: false,
    title: "",
    content: null,
    buttons: [],
  });

  const closeModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const showError = useCallback(
    (message, title = "Error") => {
      setModalConfig({
        isVisible: true,
        title,
        content: <div style={{ color: "#b91c1c" }}>{message}</div>,
        buttons: [
          {
            label: "OK",
            className: "ac-modal-btn primary",
            onClick: closeModal,
          },
        ],
      });
    },
    [closeModal],
  );

  const showSuccess = useCallback(
    (message, title = "Success") => {
      setModalConfig({
        isVisible: true,
        title,
        content: <div style={{ color: "#065f46" }}>{message}</div>,
        buttons: [
          {
            label: "OK",
            className: "ac-modal-btn primary",
            onClick: closeModal,
          },
        ],
      });
    },
    [closeModal],
  );

  const showConfirm = useCallback(
    (message, onConfirm, title = "Confirm Action") => {
      setModalConfig({
        isVisible: true,
        title,
        content: <div>{message}</div>,
        buttons: [
          {
            label: "Cancel",
            className: "ac-modal-btn",
            onClick: closeModal,
          },
          {
            label: "Confirm",
            className: "ac-modal-btn danger",
            onClick: async () => {
              try {
                await onConfirm?.();
              } finally {
                closeModal();
              }
            },
          },
        ],
      });
    },
    [closeModal],
  );

  const hydratingSavedTemplateRef = useRef(false);

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

  function handlePreviewA4() {
    setShowA4Preview(true);
  }

  useEffect(() => {
    if (!watermarkFile) {
      setPreviewWatermarkUrl(null);
      return;
    }
    const u = URL.createObjectURL(watermarkFile);
    setPreviewWatermarkUrl(u);
    return () => {
      try {
        URL.revokeObjectURL(u);
      } catch (e) {}
    };
  }, [watermarkFile]);

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

    if (newMode === "upload") {
      if (!hydratingSavedTemplateRef.current) {
        setEditingUploadTemplateId(null);

        setPreviewHeaderUrl(null);
        setPreviewFooterUrl(null);
        setPreviewWatermarkUrl(null);

        // Clear persisted asset references when starting a NEW upload
        setExistingHeaderUrl(null);
        setExistingFooterUrl(null);
        setExistingWatermarkUrl(null);
      }
    }

    if (newMode !== "view" && newMode !== "saved") {
      setViewingTemplate(null);
    }

    if (newMode === "saved" || newMode === "view") {
      setShowSavedPane(true);
    } else {
      setShowSavedPane(false);
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

      const entries = Array.isArray(manifest)
        ? manifest
        : Array.isArray(manifest.templates)
          ? manifest.templates
          : [];

      const loaded = await Promise.all(
        entries.map(async (entry) => {
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

    setTemplateSource(template.origin === "saved" ? "saved" : "public");

    const resolved =
      template.origin === "saved"
        ? await resolveTemplateProtectedAssets(
            template,
            API_KEY,
            BACKEND_URL,
            employeeId,
          )
        : template;

    const header =
      resolved.header_url ||
      resolved.headerUrl ||
      resolved.grapesJson?.headerUrl ||
      resolved.header ||
      null;

    const footer =
      resolved.footer_url ||
      resolved.footerUrl ||
      resolved.grapesJson?.footerUrl ||
      resolved.footer ||
      null;

    setPreviewHeaderUrl(header || null);
    setPreviewFooterUrl(footer || null);

    setGenerated(resolved);
    setMode("basic");
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
        if (typeof grapesJson === "string" && grapesJson.trim()) {
          grapesJson = JSON.parse(grapesJson);
        }
      } catch (e) {
        console.warn("handleUploadSaved: grapesJson parse failed", e);
      }

      let thumbnail = entry.thumbnail_url || entry.thumbnail || null;
      if (thumbnail && !thumbnail.startsWith("http") && BACKEND_URL && orgId) {
        try {
          const base = BACKEND_URL.replace(/\/$/, "");
          thumbnail = `${base}/api/orgs/${orgId}/uploads/${thumbnail}`;
        } catch (e) {
          console.warn("thumbnail normalize failed", e);
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
          if (exists) {
            return prev.map((t) =>
              String(t.id) === String(normalized.id) ? normalized : t,
            );
          }
          return [normalized, ...prev];
        } catch (e) {
          console.warn("setSavedTemplates failed", e);
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
          /^[^\/\\]+\.(png|jpe?g|svg|gif|webp)$/i.test(src)
        ) {
          if (BACKEND_URL && orgId) {
            src = `${BACKEND_URL.replace(
              /\/$/,
              "",
            )}/api/orgs/${orgId}/uploads/${src}`;
          }
        }

        if (src.startsWith("/api/") && BACKEND_URL) {
          src = `${BACKEND_URL.replace(/\/$/, "")}${src}`;
        }

        try {
          const blobUrl = await fetchProtectedImage(src, API_KEY, employeeId);
          return blobUrl || src;
        } catch (e) {
          console.warn("ensureBlobUrl failed", src, e);
          return src;
        }
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
        resolved.imageUrl,
        resolved.cleanedUrl,
        resolved.thumbnail,
        entry.footer_url,
        entry.footerUrl,
        entry.footer,
        resolved.grapesJson?.footerUrl,
        resolved.meta?.uploads?.footer,
        entry.grapesJson?.footerUrl,
        entry.meta?.uploads?.footer,
      ];

      let headerRaw =
        headerCandidates.find((x) => typeof x === "string" && x) || null;

      let footerRaw =
        footerCandidates.find((x) => typeof x === "string" && x) || null;

      console.log("headerRaw:", headerRaw, "footerRaw:", footerRaw);

      let watermarkUrl = null;
      let watermarkPlacementProps = null;

      if (resolved.grapesJson?.watermark) {
        const wm = resolved.grapesJson.watermark;
        watermarkUrl = wm?.url || null;
        watermarkPlacementProps = {
          xPct: wm?.xPct || "50%",
          yPct: wm?.yPct || "50%",
          wPct: wm?.wPct || "60%",
          hPct: wm?.hPct || "60%",
          opacity: typeof wm?.opacity === "number" ? wm.opacity : 0.12,
        };
      } else if (resolved.meta?.watermark) {
        watermarkUrl =
          typeof resolved.meta.watermark === "string"
            ? resolved.meta.watermark
            : null;

        const wp = resolved.meta.watermarkPlacement;
        if (wp) {
          watermarkPlacementProps = {
            xPct: wp.xPct || "50%",
            yPct: wp.yPct || "50%",
            wPct: wp.wPct || "60%",
            hPct: wp.hPct || "60%",
            opacity: typeof wp.opacity === "number" ? wp.opacity : 0.12,
          };
        }
      }

      const headerUrlResolved = await ensureBlobUrl(headerRaw);
      const footerUrlResolved = await ensureBlobUrl(footerRaw);
      const watermarkUrlResolved = watermarkUrl
        ? await ensureBlobUrl(watermarkUrl)
        : null;

      console.log(
        "headerUrlResolved:",
        headerUrlResolved,
        "footerUrlResolved:",
        footerUrlResolved,
        "watermarkUrlResolved:",
        watermarkUrlResolved,
      );

      let finalHeaderUrl = headerUrlResolved;
      let finalFooterUrl = footerUrlResolved;

      if (watermarkUrlResolved && finalHeaderUrl === watermarkUrlResolved) {
        finalHeaderUrl = null;
      }

      if (watermarkUrlResolved && finalFooterUrl === watermarkUrlResolved) {
        finalFooterUrl = null;
      }

      if (
        finalHeaderUrl &&
        finalFooterUrl &&
        finalHeaderUrl === finalFooterUrl
      ) {
        finalFooterUrl = null;
      }

      console.log("Setting viewingTemplate with:", {
        finalHeaderUrl,
        finalFooterUrl,
        watermarkUrlResolved,
      });

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
        html: normalized.html || null,
      });

      setAppMode("view");
      setShowSavedPane(true);
      setSavedModalVisible(true);

      return;
    } catch (err) {
      console.error("handleUploadSaved failed", err);
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

      if (src.startsWith("/api/") && BACKEND_URL) {
        src = `${BACKEND_URL.replace(/\/$/, "")}${src}`;
      }

      try {
        const blobUrl = await fetchProtectedImage(src, API_KEY, employeeId);
        if (blobUrl) return blobUrl;
      } catch (e) {
        console.warn("ensureBlobUrl failed for", src, e);
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
          employeeId,
        );
      } catch (e) {
        console.warn(
          "openSavedTemplate: resolveTemplateProtectedAssets failed",
          e,
        );
      }

      // ✅ HEADER
      const headerCandidates = [
        resolved.header_url,
        resolved.headerUrl,
        resolved.header,
        resolved.grapesJson?.headerUrl,
        resolved.meta?.uploads?.header,
        resolved.thumbnail,
      ].filter(Boolean);

      // ✅ FOOTER
      const footerCandidates = [
        resolved.footer_url,
        resolved.footerUrl,
        resolved.footer,
        resolved.grapesJson?.footerUrl,
        resolved.meta?.uploads?.footer,
      ].filter(Boolean);

      // ✅ WATERMARK
      let watermarkUrl =
        resolved.grapesJson?.watermark?.url ||
        resolved.meta?.uploads?.watermark ||
        resolved.meta?.watermark ||
        null;

      let watermarkPlacementProps = resolved.grapesJson?.watermark ||
        resolved.meta?.watermarkPlacement || {
          xPct: "50%",
          yPct: "50%",
          wPct: "60%",
          hPct: "60%",
          opacity: 0.12,
        };

      let rawHeader = headerCandidates[0] || null;
      let rawFooter = footerCandidates[0] || null;

      // fallback: scan object for images
      function collectUploadStrings(obj, out = new Set()) {
        if (!obj) return out;

        if (typeof obj === "string") {
          if (
            /\/api\/orgs\/\d+\/uploads\//.test(obj) ||
            /\.(png|jpe?g|svg|gif|webp)$/i.test(obj)
          ) {
            out.add(obj);
          }
          return out;
        }

        if (Array.isArray(obj)) {
          obj.forEach((v) => collectUploadStrings(v, out));
          return out;
        }

        if (typeof obj === "object") {
          Object.values(obj).forEach((v) => collectUploadStrings(v, out));
        }

        return out;
      }

      if (!rawHeader || !rawFooter || !watermarkUrl) {
        const found = Array.from(collectUploadStrings(resolved));

        if (!rawHeader && found.length >= 1) rawHeader = found[0];
        if (!rawFooter && found.length >= 2) rawFooter = found[1];

        if (!watermarkUrl && found.length >= 3) {
          watermarkUrl = found[2];
        }
      }

      let headerBlobUrl = rawHeader ? await ensureBlobUrl(rawHeader) : null;
      let footerBlobUrl = rawFooter ? await ensureBlobUrl(rawFooter) : null;
      const watermarkBlobUrl = watermarkUrl
        ? await ensureBlobUrl(watermarkUrl)
        : null;

      // avoid duplicates
      if (headerBlobUrl && headerBlobUrl === watermarkBlobUrl) {
        headerBlobUrl = null;
      }
      if (footerBlobUrl && footerBlobUrl === watermarkBlobUrl) {
        footerBlobUrl = null;
      }
      if (headerBlobUrl && footerBlobUrl && headerBlobUrl === footerBlobUrl) {
        footerBlobUrl = null;
      }

      setViewingTemplate({
        name: template.name,
        headerUrl: headerBlobUrl,
        footerUrl: footerBlobUrl,
        watermarkUrl: watermarkBlobUrl,
        watermarkProps: watermarkPlacementProps,
        html: template.html || null,
      });

      // Set heights for viewing
      const canvasHeightPx = Math.round(794 * (297 / 210));
      let hHeight =
        template.meta?.headerHeightPx ||
        template.header_height ||
        HEADER_HEIGHT_PCT;
      if (hHeight > 100) hHeight = (hHeight / canvasHeightPx) * 100;
      let fHeight =
        template.meta?.footerHeightPx ||
        template.footer_height ||
        FOOTER_HEIGHT_PCT;
      if (fHeight > 100) fHeight = (fHeight / canvasHeightPx) * 100;
      setHeaderHeight(hHeight);
      setFooterHeight(fHeight);

      setGenerated(null);
      setAppMode("view");

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

  useEffect(() => {
    setWatermarkEnabled(false);
    setWatermarkFile(null);
    setHeaderHeight(0);
    setFooterHeight(0);

    const r = getActiveEditorRef();
    if (r?.current?.setActiveArea) {
      try {
        r.current.setActiveArea(activeArea);
      } catch (e) {
        console.warn("failed to sync activeArea on mode change", e);
      }
    }
  }, [mode]);

  async function handleCustomSave(payload) {
    const saveUrl = orgId ? `${BACKEND_URL}/api/orgs/${orgId}/templates` : null;

    if (!saveUrl) {
      showError("Organization not found. Cannot save template.");
      return;
    }

    let processedBoxes = payload.boxes || [];
    if (processedBoxes.length > 0) {
      processedBoxes = await Promise.all(
        processedBoxes.map(async (box) => {
          if (box.content && box.content.startsWith("data:")) {
            const blob = dataURLToBlob(box.content);
            const url = await uploadBlob(
              blob,
              orgId,
              BACKEND_URL,
              API_KEY,
              employeeId,
            );
            return { ...box, content: url };
          }
          return box;
        }),
      );

      // Build simple HTML from boxes
      let html = `<div style="width: 210mm; height: 297mm; position: relative; background: ${payload.page?.background || "#ffffff"};">`;
      processedBoxes.forEach((box) => {
        const style = `position: absolute; left: ${box.xPct}; top: ${box.yPct}; width: ${box.wPct}; height: ${box.hPct}; ${
          box.style
            ? Object.entries(box.style)
                .map(
                  ([k, v]) =>
                    `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}:${v}`,
                )
                .join(";")
            : ""
        }`;
        if (box.type === "text") {
          html += `<div style="${style}">${box.content || ""}</div>`;
        } else if (box.type === "image" || box.type === "logo") {
          html += `<img src="${box.content}" style="${style}" alt="logo" />`;
        } else if (box.type === "table") {
          // simple table
          const tableData = box.table?.data || [];
          html += `<table style="${style}"><tbody>`;
          tableData.forEach((row) => {
            html += "<tr>";
            row.forEach((cell) => {
              html += `<td>${cell || ""}</td>`;
            });
            html += "</tr>";
          });
          html += "</tbody></table>";
        }
        // add more types if needed
      });
      html += "</div>";

      payload.html = html;
      payload.grapesJson = null; // or build proper grapes
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

    const bodyPayload = {
      name: payload.meta?.name || payload.name || "Untitled Template",
      template_type: "custom",
      grapes_json: grapesJson ? JSON.stringify(grapesJson) : null,
      html: html || null,
      css: css || null,
      thumbnail_url: thumbnail_url || null,
      layout: null,
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

      // Reset category filter to "all" so newly saved template is visible
      setSelectedSavedCategory("all");

      if (orgId) {
        try {
          await fetchSavedTemplates(orgId);
        } catch (e) {
          console.warn("Failed to refresh saved templates after save", e);
        }
      }

      try {
        await openSavedTemplate(normalized);
      } catch (err) {
        console.warn("Failed to open newly saved template", err);
        setAppMode("saved");
      }
    } catch (err) {
      console.error("save failed", err);
      showError("Save failed: " + (err.message || "error"));
    }
  }

  function getActiveEditorRef() {
    if (mode === "basic") return basicEditorRef;
    if (mode === "scratch") return scratchEditorRef;
    return null;
  }

  function ensureEditorAreaSynced() {
    const r = getActiveEditorRef();
    if (r?.current?.setActiveArea) {
      try {
        r.current.setActiveArea(activeArea);
      } catch (e) {}
    }
  }

  useEffect(() => {
    const r = getActiveEditorRef();
    if (r?.current?.setActiveArea) {
      try {
        r.current.setActiveArea(activeArea);
      } catch (e) {
        console.warn("failed to sync activeArea from effect", e);
      }
    }
  }, [activeArea]);

  useEffect(() => {
    const r = getActiveEditorRef();
    if (r?.current?.setActiveArea) {
      try {
        r.current.setActiveArea(activeArea);
      } catch (e) {
        console.warn("failed to sync activeArea from effect", e);
      }
    }
  }, [activeArea]);

  function actionAddText() {
    ensureEditorAreaSynced();
    const r = getActiveEditorRef();
    if (r?.current?.addText) r.current.addText();
  }
  function actionAddField() {
    ensureEditorAreaSynced();
    const r = getActiveEditorRef();
    if (r?.current?.addField) r.current.addField();
  }
  function actionAddLogo() {
    ensureEditorAreaSynced();
    const r = getActiveEditorRef();
    if (r?.current?.addLogo) r.current.addLogo();
  }
  function actionAddTable() {
    ensureEditorAreaSynced();
    const r = getActiveEditorRef();
    if (r?.current?.addTable) r.current.addTable();
  }
  function actionTogglePreview() {
    const r = getActiveEditorRef();
    if (r?.current?.togglePreview) r.current.togglePreview();
  }
  function actionDeleteSelected() {
    ensureEditorAreaSynced();
    const r = getActiveEditorRef();
    if (r?.current?.deleteSelected) r.current.deleteSelected();
  }

  function openSavePrompt() {
    if (!editingUploadTemplateId) {
      const stamp = new Date().toLocaleString();
      setSaveName(`Template ${stamp}`);
    }

    if (mode === "scratch" || mode === "basic") {
      const r = getActiveEditorRef();
      if (r && r.current && r.current.getData) {
        const data = r.current.getData();
        setCurrentPayload(data);
      } else {
        showError("Editor not ready. Please try again.");
        return;
      }
    } else {
      setCurrentPayload(null);
    }
    setSaveModalOpen(true);
  }

  async function editSavedTemplate(entry) {
    if (!entry) return;

    let resolved = null;

    console.log("========================================");
    console.log("[EDIT TEMPLATE] Original entry:", entry);
    console.log("========================================");

    try {
      try {
        resolved = await resolveTemplateProtectedAssets(
          entry,
          API_KEY,
          BACKEND_URL,
          employeeId,
        );
      } catch (e) {
        console.warn(
          "[EDIT TEMPLATE] resolveTemplateProtectedAssets failed:",
          e,
        );
        resolved = entry;
      }

      console.log("[EDIT TEMPLATE] Resolved object:", resolved);

      const cat = entry.category || inferCategory(entry);

      const isUpload =
        cat === "saved_uploads" ||
        String(entry.template_type || "").toLowerCase() === "scan";

      if (isUpload) {
        try {
          setSaveName(entry.name || "");

          // ============================================================
          // HEADER
          // ============================================================

          const headerCandidates = [
            resolved.header_url,
            resolved.headerUrl,
            resolved.header,
            resolved.grapesJson?.headerUrl,
            resolved.meta?.uploads?.header,
            resolved.thumbnail,
            resolved._headerBlob,
            resolved.imageUrl,
            resolved.cleanedUrl,

            // Original entry fallbacks
            entry.header_url,
            entry.headerUrl,
            entry.header,
            entry.grapesJson?.headerUrl,
            entry.meta?.uploads?.header,
          ].filter(Boolean);

          // ============================================================
          // FOOTER
          // ============================================================

          const footerCandidates = [
            resolved.footer_url,
            resolved.footerUrl,
            resolved.footer,
            resolved.grapesJson?.footerUrl,
            resolved.meta?.uploads?.footer,
            resolved._footerBlob,

            // Original entry fallbacks
            entry.footer_url,
            entry.footerUrl,
            entry.footer,
            entry.grapesJson?.footerUrl,
            entry.meta?.uploads?.footer,
          ].filter(Boolean);

          console.log("[EDIT TEMPLATE] Header candidates:", headerCandidates);
          console.log("[EDIT TEMPLATE] Footer candidates:", footerCandidates);

          let rawHeader = headerCandidates[0] || null;
          let rawFooter = footerCandidates[0] || null;

          // ============================================================
          // FALLBACK: SEARCH ENTIRE OBJECT FOR UPLOAD FILES
          // ============================================================

          function collectUploadStrings(obj, out = new Set()) {
            if (!obj) return out;

            if (typeof obj === "string") {
              if (
                /\/api\/orgs\/\d+\/uploads\//.test(obj) ||
                /\.(png|jpe?g|svg|gif|webp)$/i.test(obj)
              ) {
                out.add(obj);
              }

              return out;
            }

            if (Array.isArray(obj)) {
              obj.forEach((v) => collectUploadStrings(v, out));
              return out;
            }

            if (typeof obj === "object") {
              Object.values(obj).forEach((v) => collectUploadStrings(v, out));
            }

            return out;
          }

          if (!rawHeader || !rawFooter) {
            const found = Array.from(collectUploadStrings(resolved));

            console.log(
              "[EDIT TEMPLATE] Fallback upload strings found:",
              found,
            );

            if (!rawHeader && found.length >= 1) {
              rawHeader = found[0];
            }

            if (!rawFooter && found.length >= 2) {
              rawFooter = found[1];
            }
          }

          // ============================================================
          // HELPER: CONVERT ORIGINAL URL INTO BLOB URL FOR PREVIEW ONLY
          // ============================================================

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
              /^[^\/\\]+\.(png|jpe?g|svg|gif|webp)$/i.test(src)
            ) {
              if (BACKEND_URL && orgId) {
                src = `${BACKEND_URL.replace(
                  /\/$/,
                  "",
                )}/api/orgs/${orgId}/uploads/${src}`;
              }
            }

            if (src.startsWith("/api/") && BACKEND_URL) {
              src = `${BACKEND_URL.replace(/\/$/, "")}${src}`;
            }

            try {
              const blobUrl = await fetchProtectedImage(
                src,
                API_KEY,
                employeeId,
              );

              return blobUrl || src;
            } catch (e) {
              console.warn("[EDIT TEMPLATE] ensureBlobUrl failed:", src, e);

              return src;
            }
          }

          // ============================================================
          // IMPORTANT:
          // SAVE THE ORIGINAL URL SEPARATELY.
          //
          // previewHeaderUrl / previewFooterUrl are ONLY for display.
          // existingHeaderUrl / existingFooterUrl are used when saving.
          // ============================================================

          setExistingHeaderUrl(rawHeader);
          setExistingFooterUrl(rawFooter);

          console.log("[EDIT TEMPLATE] Existing persisted assets:", {
            existingHeaderUrl: rawHeader,
            existingFooterUrl: rawFooter,
          });

          // ============================================================
          // CREATE BLOB URLS FOR PREVIEW
          // ============================================================

          const headerUrlResolved = await ensureBlobUrl(rawHeader);
          const footerUrlResolved = await ensureBlobUrl(rawFooter);

          console.log("[EDIT TEMPLATE] Preview URLs:", {
            headerUrlResolved,
            footerUrlResolved,
          });

          setPreviewHeaderUrl(headerUrlResolved);
          setPreviewFooterUrl(footerUrlResolved);

          // ============================================================
          // WATERMARK
          // ============================================================

          let watermarkUrl = null;
          let watermarkPlacementProps = null;

          if (resolved.grapesJson?.watermark) {
            const wm = resolved.grapesJson.watermark;

            watermarkUrl = wm?.url || null;

            watermarkPlacementProps = {
              xPct: wm?.xPct || "50%",
              yPct: wm?.yPct || "50%",
              wPct: wm?.wPct || "60%",
              hPct: wm?.hPct || "60%",
              opacity: typeof wm?.opacity === "number" ? wm.opacity : 0.12,
            };
          } else if (resolved.meta?.watermark) {
            watermarkUrl =
              typeof resolved.meta.watermark === "string"
                ? resolved.meta.watermark
                : null;

            const wp = resolved.meta.watermarkPlacement;

            if (wp) {
              watermarkPlacementProps = {
                xPct: wp.xPct || "50%",
                yPct: wp.yPct || "50%",
                wPct: wp.wPct || "60%",
                hPct: wp.hPct || "60%",
                opacity: typeof wp.opacity === "number" ? wp.opacity : 0.12,
              };
            }
          }

          // Also check other possible watermark locations
          if (!watermarkUrl) {
            watermarkUrl =
              resolved.watermark_url ||
              resolved.watermarkUrl ||
              resolved.meta?.uploads?.watermark ||
              entry.watermark_url ||
              entry.watermarkUrl ||
              entry.meta?.uploads?.watermark ||
              null;
          }

          // Save original watermark URL
          setExistingWatermarkUrl(watermarkUrl);

          const watermarkUrlResolved = watermarkUrl
            ? await ensureBlobUrl(watermarkUrl)
            : null;

          console.log("[EDIT TEMPLATE] Watermark:", {
            existingWatermarkUrl: watermarkUrl,
            previewWatermarkUrl: watermarkUrlResolved,
          });

          setPreviewHeaderUrl(headerUrlResolved);
          setPreviewFooterUrl(footerUrlResolved);
          setPreviewWatermarkUrl(watermarkUrlResolved);

          if (watermarkPlacementProps) {
            setWatermarkProps(watermarkPlacementProps);
          }

          if (watermarkUrlResolved) {
            setWatermarkEnabled(true);
          } else {
            setWatermarkEnabled(false);
          }

          // ============================================================
          // ENTER EDIT MODE
          // ============================================================

          setEditingUploadTemplateId(entry.id);

          setViewingTemplate(null);
          setShowSavedPane(false);
          setMode("upload");

          console.log("[EDIT TEMPLATE] Edit mode initialized successfully");

          return;
        } catch (err) {
          console.warn(
            "[EDIT TEMPLATE] Upload branch failed, falling back to basic:",
            err,
          );
        }
      }

      setGenerated(resolved || entry);
      setAppMode("basic");
    } catch (err) {
      console.error("[EDIT TEMPLATE] Top-level failure:", err, {
        entry,
        resolved,
      });

      if (resolved || entry) {
        setGenerated(resolved || entry);
        setAppMode("basic");
      }
    }
  }

  async function deleteSavedTemplate(entry) {
    if (!entry || !orgId) return;

    const id = entry.id || entry._id || entry.template_id;

    if (!id) {
      showError("Cannot delete: missing template id.");
      return;
    }

    showConfirm(
      `Delete template "${entry.name || id}"? This cannot be undone.`,
      async () => {
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

          if (!res.ok) {
            throw new Error(`Delete failed (${res.status})`);
          }

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

          showSuccess("Template deleted successfully.");
        } catch (err) {
          console.error("deleteSavedTemplate failed", err);
          showError("Failed to delete template: " + (err.message || "error"));
        }
      },
    );
  }

  async function confirmSaveFromEditor() {
    let data = null;

    if (mode === "upload") {
      const hasExistingImage =
        !!previewHeaderUrl || !!previewFooterUrl || !!previewWatermarkUrl;

      const hasNewImage = !!headerFile || !!footerFile || !!watermarkFile;

      if (!hasExistingImage && !hasNewImage) {
        showError(
          "Please select at least one image (header, footer or watermark).",
        );
        setSaveModalOpen(false);
        return;
      }

      if (!orgId) {
        showError("Organization not found. Cannot save template.");
        return;
      }

      if (!saveName || !saveName.trim()) {
        showError("Please provide a name for the saved template.");
        return;
      }

      try {
        const fd = new FormData();

        // ============================================================
        // HEADER
        // ============================================================

        if (headerFile) {
          // User selected a NEW header
          fd.append("header", headerFile);
          console.log("[SAVE TEMPLATE] Using NEW header file");
        } else if (existingHeaderUrl) {
          // User did NOT replace header, preserve existing header
          fd.append("existingHeaderUrl", existingHeaderUrl);
          console.log(
            "[SAVE TEMPLATE] Preserving EXISTING header:",
            existingHeaderUrl,
          );
        }

        // ============================================================
        // FOOTER
        // ============================================================

        if (footerFile) {
          // User selected a NEW footer
          fd.append("footer", footerFile);
          console.log("[SAVE TEMPLATE] Using NEW footer file");
        } else if (existingFooterUrl) {
          // User did NOT replace footer, preserve existing footer
          fd.append("existingFooterUrl", existingFooterUrl);
          console.log(
            "[SAVE TEMPLATE] Preserving EXISTING footer:",
            existingFooterUrl,
          );
        }

        // ============================================================
        // WATERMARK
        // ============================================================

        if (watermarkFile && watermarkEnabled) {
          // User selected a NEW watermark
          fd.append("watermark", watermarkFile);
          console.log("[SAVE TEMPLATE] Using NEW watermark file");
        } else if (watermarkEnabled && existingWatermarkUrl) {
          // User did NOT replace watermark, preserve existing watermark
          fd.append("existingWatermarkUrl", existingWatermarkUrl);
          console.log(
            "[SAVE TEMPLATE] Preserving EXISTING watermark:",
            existingWatermarkUrl,
          );
        }

        fd.append("name", saveName.trim());

        if (editingUploadTemplateId) {
          fd.append("templateId", editingUploadTemplateId);
        }

        fd.append(
          "meta",
          JSON.stringify({
            watermark: !!(
              watermarkEnabled &&
              (watermarkFile || previewWatermarkUrl)
            ),
            watermarkPlacement: watermarkProps,
          }),
        );

        const base = BACKEND_URL.replace(/\/$/, "");
        const url = `${base}/api/orgs/${orgId}/templates/upload-scan`;

        const resp = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "x-api-key": API_KEY || "" },
          body: fd,
        });

        const data = await resp.json().catch(() => null);
        if (!resp.ok) {
          const msg = (data && data.error) || `Upload failed (${resp.status})`;
          throw new Error(msg);
        }

        // Handle saved
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

        try {
          await openSavedTemplate(normalized);
          setEditingUploadTemplateId(null);
        } catch (e) {
          console.warn("openSavedTemplate failed for newly saved template", e);
          if (orgId) await fetchSavedTemplates(orgId);
          setAppMode("saved");
        }

        // Clear files
        setHeaderFile(null);
        setFooterFile(null);
        setWatermarkFile(null);
        if (fileInputWatermarkRef.current)
          fileInputWatermarkRef.current.value = "";
      } catch (err) {
        console.error("upload save failed", err);
        showError("Save failed: " + (err.message || "error"));
      } finally {
        setSaveModalOpen(false);
      }
      return;
    } else {
      const r = getActiveEditorRef();
      if (!r || !r.current) {
        showError("No editor available to save from.");
        setSaveModalOpen(false);
        return;
      }

      try {
        if (mode === "scratch") {
          // For scratch mode, use currentPayload
          data = currentPayload;
        } else if (r.current.getData) {
          data = await r.current.getData();
        } else if (r.current.getHtml) {
          const html = await r.current.getHtml();
          data = { html, meta: { name: saveName } };
        } else {
          data = { html: null, meta: { name: saveName } };
        }
      } catch (err) {
        console.error("getData/getHtml failed", err);
        showError("Failed to read data from editor.");
        setSaveModalOpen(false);
        return;
      }
    }

    if (!data) {
      setSaveModalOpen(false);
      return;
    }

    data.meta = { ...(data.meta || {}), name: saveName };

    try {
      await handleCustomSave(data);
    } finally {
      setSaveModalOpen(false);
    }
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
    handleWatermarkChange,
    handlePreviewChange,
    handleUploadSaved,
    activeArea,
    headerFile,
    setHeaderFile,
    footerFile,
    setFooterFile,
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
        onPreviewA4={handlePreviewA4}
        onSaveTemplate={openSavePrompt}
        activeArea={activeArea}
        onSetActiveArea={setActiveArea}
      />

      {(mode === "saved" || mode === "view") && (
        <main className={styles.editorPanel}>
          {mode === "view" && viewingTemplate && (
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
              Viewing: {viewingTemplate.name}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flex: 1,
              minHeight: 0,
            }}
          >
            {(() => {
              // Calculate header/footer height percent from template meta if available
              const canvasWidthPx = 794;
              const canvasHeightPx = Math.round(canvasWidthPx * (297 / 210));
              let headerHeight = HEADER_HEIGHT_PCT;
              let footerHeight = FOOTER_HEIGHT_PCT;
              if (viewingTemplate) {
                let hPx =
                  viewingTemplate.headerHeight ||
                  viewingTemplate.meta?.headerHeightPx;
                let fPx =
                  viewingTemplate.footerHeight ||
                  viewingTemplate.meta?.footerHeightPx;
                if (hPx && hPx > 1) {
                  headerHeight = hPx > 100 ? (hPx / canvasHeightPx) * 100 : hPx;
                }
                if (fPx && fPx > 1) {
                  footerHeight = fPx > 100 ? (fPx / canvasHeightPx) * 100 : fPx;
                }
              }
              return (
                <A4Preview
                  headerUrl={
                    mode === "view"
                      ? viewingTemplate?.headerUrl
                      : previewHeaderUrl
                  }
                  footerUrl={
                    mode === "view"
                      ? viewingTemplate?.footerUrl
                      : previewFooterUrl
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
                  width={794}
                  headerHeightPct={headerHeight}
                  footerHeightPct={footerHeight}
                  bodyHtml={mode === "view" ? viewingTemplate?.html : null}
                  initialHeaderProps={viewingTemplate?.meta?.headerProps}
                  initialFooterProps={viewingTemplate?.meta?.footerProps}
                />
              );
            })()}
          </div>
        </main>
      )}

      {mode === "upload" && (
        <EditorPanel
          styles={styles}
          mode={mode}
          generated={generated}
          watermarkEnabled={watermarkEnabled}
          setWatermarkEnabled={setWatermarkEnabled}
          watermarkProps={watermarkProps}
          handleWatermarkChange={handleWatermarkChange}
          viewingTemplate={viewingTemplate}
          editableHeader={mode === "upload"}
          editableFooter={mode === "upload"}
          editorRefs={{
            editorWrapperRef,
            basicEditorRef,
            scratchEditorRef,
            headerImgRef,
            footerImgRef,
          }}
          handlers={{
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
            setGenerated,
            setViewingTemplate,
          }}
          watermarkFile={watermarkFile}
          setWatermarkFile={setWatermarkFile}
          fileInputWatermarkRef={fileInputWatermarkRef}
          headerHeightPct={HEADER_HEIGHT_PCT}
          footerHeightPct={FOOTER_HEIGHT_PCT}
          editorCanvasWidth={794}
        />
      )}
      {mode === "basic" && (
        <BasicTemplateEditor
          ref={basicEditorRef}
          initialHtml={generated?.html || ""}
          onUploadImage={handleUploadSaved}
          canvasWidthPx={794}
          initialBodyType={generated?.bodyType}
          initialHeaderHeightPx={(HEADER_HEIGHT_PCT / 100) * canvasHeightPx}
          initialFooterHeightPx={(FOOTER_HEIGHT_PCT / 100) * canvasHeightPx}
          watermarkUrl={previewWatermarkUrl}
          watermarkProps={watermarkProps}
          watermarkEditable={true}
          onWatermarkChange={handleWatermarkChange}
          baseUrl={BACKEND_URL}
          onSelectField={null}
          selectedFieldId={null}
          onUpdateFieldStyle={null}
          onUpdateFieldContent={null}
          onBoxesChange={null}
        />
      )}
      {mode === "scratch" && (
        <CustomTemplateEditor
          ref={scratchEditorRef}
          initialBoxes={[]}
          initialBoxesAreBodyRelative={false}
          initialActiveArea="header"
          initialBodyType={null}
          onUploadImage={handleUploadSaved}
          canvasWidthPx={794}
          onSave={handleCustomSave}
          background={null}
          headerHeightPct={HEADER_HEIGHT_PCT}
          footerHeightPct={FOOTER_HEIGHT_PCT}
          watermarkUrl={previewWatermarkUrl}
          watermarkProps={watermarkProps}
          watermarkEditable={true}
          onWatermarkChange={handleWatermarkChange}
          onBoxesChange={null}
        />
      )}
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

      <A4PreviewModal
        isOpen={showA4Preview}
        onClose={() => setShowA4Preview(false)}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
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
            width={600}
            pageStyle={{ background: "white" }}
            headerHeightPct={HEADER_HEIGHT_PCT}
            footerHeightPct={FOOTER_HEIGHT_PCT}
            bodyHtml={mode === "view" ? viewingTemplate?.html : null}
          />
        </div>
      </A4PreviewModal>

      <Modal
        isVisible={modalConfig.isVisible}
        title={modalConfig.title}
        onClose={closeModal}
        buttons={modalConfig.buttons}
      >
        {modalConfig.content}
      </Modal>
    </div>
  );
}
