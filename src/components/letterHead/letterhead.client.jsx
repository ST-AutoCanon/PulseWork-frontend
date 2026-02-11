"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import generatePDF from "./generatepdfforletters";
import "./letterhead.css";
import { letterFields } from "../../utils/letterFields";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";

const BUILD_TEMPLATE_ROUTE = "/templates";
const protectedBlobCache = new Map();

function normalizeUploadUrl(src, backendBase) {
  if (!src) return src;
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;

  const backend = (backendBase || "").replace(/\/$/, "");
  if (src.startsWith("/api/")) {
    if (backend) return backend + src;
    return window.location.origin.replace(/\/$/, "") + src;
  }

  try {
    const url = new URL(src, window.location.origin);
    const frontendOrigin = window.location.origin.replace(/\/$/, "");
    if (backend && url.origin === frontendOrigin) {
      return backend + url.pathname + url.search + url.hash;
    }
    return src;
  } catch (e) {
    return src;
  }
}

async function fetchProtectedBlobUrl(src, apiKey, backendBase, orgId) {
  if (!src) return null;
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;

  const normalized = normalizeUploadUrl(src, backendBase);

  const cached = protectedBlobCache.get(normalized);
  if (cached) return cached;

  try {
    const res = await axios.get(normalized, {
      responseType: "blob",
      headers: { "x-api-key": apiKey || "", "x-org-id": orgId || "" },
      withCredentials: true,
    });
    const blob = res.data;
    const url = URL.createObjectURL(blob);
    protectedBlobCache.set(normalized, url);
    return url;
  } catch (err) {
    console.warn("fetchProtectedBlobUrl failed for", normalized, err?.message);
    return null;
  }
}

async function replaceUploadUrlsInHtml(
  html = "",
  apiKey,
  backendBase,
  orgId = null,
) {
  if (!html || typeof html !== "string") return html;

  const uploadRegex =
    /https?:\/\/[^"'()\s]*\/api\/orgs\/\d+\/uploads\/[A-Za-z0-9._-]+|\/api\/orgs\/\d+\/uploads\/[A-Za-z0-9._-]+/g;
  const matches = html.match(uploadRegex);
  if (!matches || matches.length === 0) return html;

  const unique = Array.from(new Set(matches));
  const replacements = {};

  await Promise.all(
    unique.map(async (m) => {
      let candidate = m;
      candidate = normalizeUploadUrl(m, backendBase);
      const blob = await fetchProtectedBlobUrl(
        candidate,
        apiKey,
        backendBase,
        orgId,
      );
      if (blob) replacements[m] = blob;
      else replacements[m] = candidate;
    }),
  );

  let out = html;
  Object.keys(replacements).forEach((orig) => {
    const safe = orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safe, "g"), replacements[orig]);
  });

  return out;
}

function ensurePercent(v) {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return `${v}%`;
  if (typeof v === "string") {
    return v.trim().endsWith("%") ? v.trim() : `${v.trim()}%`;
  }
  return String(v);
}

const LetterHead = () => {
  const { user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [letterType, setLetterType] = useState("");
  const [letterheads, setLetterheads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsPopup, setShowDetailsPopup] = useState(null);
  const contentRef = useRef(null);
  const letterRef = useRef(null);

  const headerBlobRef = useRef(null);
  const footerBlobRef = useRef(null);

  const watermarkBlobRef = useRef(null);
  const watermarkSourceRef = useRef(null);

  const originalLogo = null;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
    /\/$/,
    "",
  );
  const meId = user?.employeeId;
  const orgId = user?.orgId ?? user?.org_id ?? null;
  const headers = {
    "x-api-key": API_KEY,
    "x-employee-id": meId,
    "x-org-id": orgId,
  };

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });
  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const [formData, setFormData] = useState({
    letterhead_code: "",
    template_name: "",
    letter_type: "",
    subject: "",
    body: "",
    recipient_name: "",
    title: "",
    mobile_number: "",
    email: "",
    address: "",
    date: "",
    signature: "",
    employee_name: "",
    position: "",
    annual_salary: "",
    effective_date: "",
    date_of_appointment: "",
    company_name: "",
    company_address: "",
    company_address_line2: "",
    gstin_number: "",
    cin_number: "",
    place: "",
  });

  const [headerBlobUrl, setHeaderBlobUrl] = useState(null);
  const [footerBlobUrl, setFooterBlobUrl] = useState(null);
  const [watermarkBlobUrl, setWatermarkBlobUrl] = useState(null);
  const [watermarkPropsState, setWatermarkPropsState] = useState({
    xPct: "50%",
    yPct: "50%",
    wPct: "60%",
    hPct: "60%",
    opacity: 0.12,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const parseTemplateToHTML = (content) => {
    if (!content || typeof content !== "string") return "";
    if (
      content.includes("<h1") ||
      content.includes("<h2") ||
      content.includes("<p") ||
      content.includes("<img")
    ) {
      return content;
    }
    const lines = content.split("\n").filter((line) => line.trim());
    let htmlContent = "";
    lines.forEach((line) => {
      if (line.startsWith("# ")) {
        htmlContent += `<h1 style="font-weight: bold;">${line
          .slice(2)
          .trim()}</h1>`;
      } else if (line.startsWith("## ")) {
        htmlContent += `<h2 style="font-weight: bold;">${line
          .slice(3)
          .trim()}</h2>`;
      } else {
        htmlContent += `<p>${line.trim()}</p>`;
      }
    });
    return htmlContent;
  };

  useEffect(() => {
    if (showPopup && contentRef.current) {
      contentRef.current.innerHTML = formData.body || "";
    }
  }, [showPopup]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const templatesResp = await axios
          .get(`${BACKEND_URL}/api/templates/list`, {
            withCredentials: true,
            headers,
          })
          .catch(() => ({ data: { data: [] } }));

        const letterheadsResp = await axios
          .get(`${BACKEND_URL}/api/letterheads/list`, {
            withCredentials: true,
            headers,
          })
          .catch(() => ({ data: { data: [] } }));

        let saved = [];
        if (orgId) {
          const savedResp = await axios.get(
            `${BACKEND_URL}/api/orgs/${orgId}/templates`,
            { withCredentials: true, headers },
          );
          saved = Array.isArray(savedResp.data)
            ? savedResp.data
            : savedResp.data?.data || [];
        }

        if (!mounted) return;

        setTemplates(templatesResp.data.data || []);
        setLetterheads(letterheadsResp.data.data || []);
        setSavedTemplates(saved || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        showAlert(
          "Failed to fetch data: " +
            (error?.response?.data?.error || error.message || "unknown"),
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [orgId]);

  const revokeIfBlob = (url) => {
    try {
      if (url && typeof url === "string" && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    } catch (e) {}
  };

  const editorContainsWrapper = (className) => {
    try {
      if (!contentRef.current) return false;
      return !!contentRef.current.querySelector(`.${className}`);
    } catch (e) {
      return false;
    }
  };

  const mergeBodyKeepingHeaderFooter = (newBodyHtml) => {
    if (!contentRef.current) return;
    const container = contentRef.current;
    const nodes = Array.from(container.childNodes);
    const headerParts = [];
    const footerParts = [];

    const isHeaderNode = (n) => {
      if (!n || n.nodeType !== 1) return false;
      const tag = n.tagName.toLowerCase();
      const cls = (n.className || "").toString().toLowerCase();
      const id = (n.id || "").toString().toLowerCase();
      const alt = (n.alt || "").toString().toLowerCase();
      const src = (n.src || "").toString().toLowerCase();
      if (
        tag === "img" &&
        (alt.includes("header") ||
          cls.includes("header") ||
          id.includes("header") ||
          src.includes("header"))
      )
        return true;
      if (tag === "div" && (cls.includes("header") || id.includes("header")))
        return true;
      if (cls.includes("template-header") || id.includes("template-header"))
        return true;
      return false;
    };

    const isFooterNode = (n) => {
      if (!n || n.nodeType !== 1) return false;
      const tag = n.tagName.toLowerCase();
      const cls = (n.className || "").toString().toLowerCase();
      const id = (n.id || "").toString().toLowerCase();
      const alt = (n.alt || "").toString().toLowerCase();
      const src = (n.src || "").toString().toLowerCase();
      if (
        tag === "img" &&
        (alt.includes("footer") ||
          cls.includes("footer") ||
          id.includes("footer") ||
          src.includes("footer"))
      )
        return true;
      if (tag === "div" && (cls.includes("footer") || id.includes("footer")))
        return true;
      if (cls.includes("template-footer") || id.includes("template-footer"))
        return true;
      return false;
    };

    let i = 0;
    while (i < nodes.length && isHeaderNode(nodes[i])) {
      headerParts.push(nodes[i].outerHTML);
      i++;
    }

    let j = nodes.length - 1;
    while (j >= i && isFooterNode(nodes[j])) {
      footerParts.unshift(nodes[j].outerHTML);
      j--;
    }

    let headerHtml = headerParts.join("");
    if (!headerHtml && headerBlobRef.current) {
      headerHtml = `<div class="template-header"><img src="${headerBlobRef.current}" alt="Header" style="max-width:100%;height:auto;" /></div>`;
    }

    let footerHtml = footerParts.join("");
    if (!footerHtml && footerBlobRef.current) {
      footerHtml = `<div class="template-footer"><img src="${footerBlobRef.current}" alt="Footer" style="max-width:100%;height:auto;" /></div>`;
    }

    container.innerHTML = `${headerHtml}${newBodyHtml || ""}${footerHtml}`;

    setFormData((prev) => ({ ...prev, body: container.innerHTML }));
  };

  const extractHeaderFooterFromHtml = (html) => {
    if (!html) return { headerHtml: "", bodyHtml: "", footerHtml: "" };
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        `<div id="tmp">${html}</div>`,
        "text/html",
      );
      const container = doc.getElementById("tmp");
      const children = Array.from(container.children);

      let headerHtml = "";
      let footerHtml = "";

      if (children.length > 0) {
        const first = children[0];
        const firstTag = first.tagName.toLowerCase();
        if (
          firstTag === "img" ||
          (first.className && /header/i.test(first.className)) ||
          (first.id && /header/i.test(first.id))
        ) {
          headerHtml = first.outerHTML;
          first.remove();
        }
      }

      const afterHeaderChildren = Array.from(container.children);
      if (afterHeaderChildren.length > 0) {
        const last = afterHeaderChildren[afterHeaderChildren.length - 1];
        const lastTag = last.tagName.toLowerCase();
        if (
          lastTag === "img" ||
          (last.className && /footer/i.test(last.className)) ||
          (last.id && /footer/i.test(last.id))
        ) {
          footerHtml = last.outerHTML;
          last.remove();
        }
      }

      const bodyHtml = container.innerHTML;
      return { headerHtml, bodyHtml, footerHtml };
    } catch (e) {
      return { headerHtml: "", bodyHtml: html, footerHtml: "" };
    }
  };

  const findFooterNode = (container) => {
    if (!container) return null;
    const selectors = [
      ".template-footer",
      'img[alt="Footer"]',
      'img[class*="footer"]',
      'div[class*="footer"]',
      '[id*="footer"]',
    ];
    const nodes = [];
    selectors.forEach((sel) => {
      nodes.push(...Array.from(container.querySelectorAll(sel)));
    });
    if (nodes.length === 0) return null;
    return nodes[nodes.length - 1];
  };

  const replaceEditorBody = (newBodyHtml = "") => {
    if (!contentRef.current) return;
    const editor = contentRef.current;

    const headerNode =
      editor.querySelector(".template-header") ||
      editor.querySelector('img[alt="Header"]') ||
      editor.querySelector('img[class*="header"]') ||
      null;

    const footerNode = findFooterNode(editor);

    let headerHtml = "";
    let footerHtml = "";

    if (headerNode) {
      const headerWrapper = headerNode.closest
        ? headerNode.closest(".template-header") || headerNode
        : headerNode;
      try {
        headerHtml = headerWrapper.outerHTML;
        if (headerWrapper.parentElement && editor.contains(headerWrapper)) {
          headerWrapper.remove();
        }
      } catch (e) {}
    } else if (headerBlobRef.current) {
      headerHtml = `<div class="template-header"><img src="${headerBlobRef.current}" alt="Header" style="max-width:100%;height:auto;" /></div>`;
    }

    if (footerNode) {
      const footerWrapper = footerNode.closest
        ? footerNode.closest(".template-footer") || footerNode
        : footerNode;
      try {
        footerHtml = footerWrapper.outerHTML;
        if (footerWrapper.parentElement && editor.contains(footerWrapper)) {
          footerWrapper.remove();
        }
      } catch (e) {}
    } else if (footerBlobRef.current) {
      footerHtml = `<div class="template-footer"><img src="${footerBlobRef.current}" alt="Footer" style="max-width:100%;height:auto;" /></div>`;
    }

    const bodyHtml = (newBodyHtml || "").toString().trim();

    editor.innerHTML = `${headerHtml}${bodyHtml}${footerHtml}`;

    setFormData((prev) => ({ ...prev, body: editor.innerHTML }));
  };

  const extractHeaderFooterFromEditor = () => {
    try {
      if (!contentRef.current) {
        const h = headerBlobRef.current
          ? `<div class="template-header"><img src="${headerBlobRef.current}" alt="Header" style="max-width:100%;height:auto;" /></div>`
          : "";
        const f = footerBlobRef.current
          ? `<div class="template-footer"><img src="${footerBlobRef.current}" alt="Footer" style="max-width:100%;height:auto;" /></div>`
          : "";
        return { headerHtml: h, footerHtml: f };
      }

      const html = contentRef.current.innerHTML || "";
      const { headerHtml, footerHtml } = extractHeaderFooterFromHtml(html);
      const headerOut =
        headerHtml ||
        (headerBlobRef.current
          ? `<div class="template-header"><img src="${headerBlobRef.current}" alt="Header" style="max-width:100%;height:auto;" /></div>`
          : "");
      const footerOut =
        footerHtml ||
        (footerBlobRef.current
          ? `<div class="template-footer"><img src="${footerBlobRef.current}" alt="Footer" style="max-width:100%;height:auto;" /></div>`
          : "");
      return { headerHtml: headerOut, footerHtml: footerOut };
    } catch (e) {
      return { headerHtml: "", footerHtml: "" };
    }
  };

  const applySavedTemplate = async (templateId) => {
    const template = savedTemplates.find(
      (t) => String(t.id) === String(templateId),
    );
    if (!template) {
      revokeIfBlob(headerBlobRef.current);
      revokeIfBlob(footerBlobRef.current);
      headerBlobRef.current = null;
      footerBlobRef.current = null;
      setSelectedTemplate(null);
      setSelectedTemplateId("");
      setHeaderBlobUrl(null);
      setFooterBlobUrl(null);
      setWatermarkBlobUrl(null);
      return;
    }

    setSelectedTemplateId(String(templateId));
    setSelectedTemplate(template);

    revokeIfBlob(headerBlobRef.current);
    revokeIfBlob(footerBlobRef.current);
    headerBlobRef.current = null;
    footerBlobRef.current = null;
    setHeaderBlobUrl(null);
    setFooterBlobUrl(null);
    setWatermarkBlobUrl(null);

    try {
      const grapesRaw = template.grapesJson || template.grapes_json || null;
      let grapesObj = grapesRaw;
      if (grapesObj && typeof grapesObj === "string") {
        try {
          grapesObj = JSON.parse(grapesObj);
        } catch (e) {
          grapesObj = grapesObj;
        }
      }

      function collectUploadStrings(obj, out = new Set()) {
        if (!obj) return out;
        if (typeof obj === "string") {
          if (
            /\/api\/orgs\/\d+\/uploads\/[A-Za-z0-9._-]+/i.test(obj) ||
            /^[^\/\\]+\.(png|jpe?g|svg|gif|webp)$/i.test(obj) ||
            /^[0-9]{6,}_[A-Za-z0-9._-]+/.test(obj)
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
          if (obj.attributes && typeof obj.attributes.src === "string") {
            collectUploadStrings(obj.attributes.src, out);
          }
          for (const k of Object.keys(obj)) {
            try {
              collectUploadStrings(obj[k], out);
            } catch (e) {}
          }
        }
        return out;
      }

      async function pickAndFetch(candidates = []) {
        for (const raw of candidates) {
          if (!raw) continue;
          if (typeof raw !== "string") continue;
          const normalized = normalizeUploadUrl(raw, BACKEND_URL);
          try {
            const blob = await fetchProtectedBlobUrl(
              normalized,
              API_KEY,
              BACKEND_URL,
              orgId,
            );
            if (blob) return blob;
            return normalized;
          } catch (e) {
            continue;
          }
        }
        return null;
      }

      const metaUploads = (template.meta && template.meta.uploads) || {};
      const explicitHeaderCandidates = [
        grapesObj && (grapesObj.headerUrl || grapesObj.header_url),
        metaUploads.header,
        template.header_url,
        template.headerUrl,
        template.thumbnail,
        template.thumbnail_url,
        template.imageUrl,
        template.cleanedUrl,
        template.cleaned_url,
      ].filter(Boolean);

      const explicitFooterCandidates = [
        grapesObj && (grapesObj.footerUrl || grapesObj.footer_url),
        metaUploads.footer,
        template.footer_url,
        template.footerUrl,
        template.cleanedUrl,
        template.cleaned_url,
      ].filter(Boolean);

      const explicitWatermarkCandidates = [
        grapesObj && grapesObj.watermark && grapesObj.watermark.url,
        metaUploads.watermark,
        template.meta && typeof template.meta.watermark === "string"
          ? template.meta.watermark
          : null,
      ].filter(Boolean);

      const excludeSet = new Set(
        [
          template?.meta?.qr,
          template?.meta?.seal,
          template?.meta?.qrUrl,
          template?.meta?.sealUrl,
          template?.meta?.uploads && template?.meta?.uploads.qr,
          template?.meta?.uploads && template?.meta?.uploads.seal,
        ].filter(Boolean),
      );

      const sanitizeCandidates = (arr) =>
        arr.filter((c) => c && !excludeSet.has(c));

      let headerBlob = await pickAndFetch(
        sanitizeCandidates(explicitHeaderCandidates),
      );
      let footerBlob = await pickAndFetch(
        sanitizeCandidates(explicitFooterCandidates),
      );
      let watermarkBlob = await pickAndFetch(
        sanitizeCandidates(explicitWatermarkCandidates),
      );

      const htmlToScan = template.html || template.content || "";
      function extractImgSrcsFromHtml(html) {
        const out = [];
        if (!html || typeof html !== "string") return out;
        try {
          const re = /<img[^>]+src=(["'])([^"']+)\1/gi;
          let m;
          while ((m = re.exec(html))) {
            out.push(m[2]);
          }
        } catch (e) {}
        return out;
      }

      if (!headerBlob || !footerBlob || !watermarkBlob) {
        const foundSet = collectUploadStrings(grapesObj);
        extractImgSrcsFromHtml(htmlToScan).forEach((s) => foundSet.add(s));
        try {
          const uploadRegex =
            /\/api\/orgs\/\d+\/uploads\/[A-Za-z0-9._-]+|[0-9]{6,}_[A-Za-z0-9._-]+/g;
          const matches = (htmlToScan && htmlToScan.match(uploadRegex)) || [];
          matches.forEach((m) => foundSet.add(m));
        } catch (e) {}

        const found = Array.from(foundSet).filter(
          (f) => f && !excludeSet.has(f),
        );
        if (!headerBlob && found.length) {
          headerBlob = await pickAndFetch([
            found[0],
            ...(explicitHeaderCandidates || []),
          ]);
        }
        if (!footerBlob && found.length > 1) {
          footerBlob = await pickAndFetch([
            found[1],
            ...(explicitFooterCandidates || []),
          ]);
        }
        if (!watermarkBlob && found.length) {
          const candid = found.find(
            (u) => u !== headerBlob && u !== footerBlob,
          );
          if (candid)
            watermarkBlob = await pickAndFetch([
              candid,
              ...(explicitWatermarkCandidates || []),
            ]);
        }
      }

      const lastResortNormalize = async (val) => {
        if (!val || typeof val !== "string") return null;
        try {
          const normalized = normalizeUploadUrl(val, BACKEND_URL);
          return normalized;
        } catch (e) {
          return val;
        }
      };

      if (!headerBlob) {
        const fallback = explicitHeaderCandidates.find(Boolean) || null;
        headerBlob = fallback ? await lastResortNormalize(fallback) : null;
      }
      if (!footerBlob) {
        const fallback = explicitFooterCandidates.find(Boolean) || null;
        footerBlob = fallback ? await lastResortNormalize(fallback) : null;
      }
      if (!watermarkBlob) {
        const fallback = explicitWatermarkCandidates.find(Boolean) || null;
        watermarkBlob = fallback ? await lastResortNormalize(fallback) : null;
      }

      if (watermarkBlob) {
        if (headerBlob && headerBlob === watermarkBlob) {
          console.warn(
            "applySavedTemplate: clearing header because it matched watermark",
          );
          headerBlob = null;
        }
        if (footerBlob && footerBlob === watermarkBlob) {
          console.warn(
            "applySavedTemplate: clearing footer because it matched watermark",
          );
          footerBlob = null;
        }
      }

      if (headerBlob && footerBlob && headerBlob === footerBlob) {
        footerBlob = null;
      }

      headerBlobRef.current = headerBlob || null;
      footerBlobRef.current = footerBlob || null;
      setHeaderBlobUrl(headerBlobRef.current || null);
      setFooterBlobUrl(footerBlobRef.current || null);

      if (watermarkBlob) {
        setWatermarkBlobUrl(watermarkBlob);
        let wp = null;
        if (grapesObj && grapesObj.watermark) {
          const gm = grapesObj.watermark;
          wp = {
            xPct: gm.xPct || gm.x || gm.left || "50%",
            yPct: gm.yPct || gm.y || gm.top || "50%",
            wPct: gm.wPct || gm.w || gm.width || "60%",
            hPct: gm.hPct || gm.h || gm.height || "60%",
            opacity: typeof gm.opacity === "number" ? gm.opacity : 0.12,
          };
        }
        if (!wp && template.meta && template.meta.watermarkPlacement) {
          const pm = template.meta.watermarkPlacement;
          wp = {
            xPct: pm.xPct || "50%",
            yPct: pm.yPct || "50%",
            wPct: pm.wPct || "60%",
            hPct: pm.hPct || "60%",
            opacity: typeof pm.opacity === "number" ? pm.opacity : 0.12,
          };
        }
        if (!wp) wp = watermarkPropsState;
        setWatermarkPropsState(wp);
      } else {
        setWatermarkBlobUrl(null);
      }

      let contentHtml = template.html || template.content || "";
      if (
        typeof contentHtml === "string" &&
        /\/api\/orgs\/\d+\/uploads\//.test(contentHtml)
      ) {
        contentHtml = await replaceUploadUrlsInHtml(
          contentHtml,
          API_KEY,
          BACKEND_URL,
          orgId,
        );
      }

      const { headerHtml, bodyHtml, footerHtml } =
        extractHeaderFooterFromHtml(contentHtml);

      let finalBodyHtml = contentHtml;
      const wrappedHeaderHtml = headerHtml
        ? `<div class="template-header">${headerHtml}</div>`
        : headerBlobRef.current
          ? `<div class="template-header"><img src="${headerBlobRef.current}" alt="Header" style="max-width:100%;height:auto;" /></div>`
          : "";
      const wrappedFooterHtml = footerHtml
        ? `<div class="template-footer">${footerHtml}</div>`
        : footerBlobRef.current
          ? `<div class="template-footer"><img src="${footerBlobRef.current}" alt="Footer" style="max-width:100%;height:auto;" /></div>`
          : "";

      if (bodyHtml !== undefined) {
        finalBodyHtml = `${wrappedHeaderHtml}${
          bodyHtml || ""
        }${wrappedFooterHtml}`;
      } else {
        if (wrappedHeaderHtml || wrappedFooterHtml) {
          finalBodyHtml = `${wrappedHeaderHtml}${
            contentHtml || ""
          }${wrappedFooterHtml}`;
        } else {
          finalBodyHtml = contentHtml || "";
        }
      }

      if (contentRef.current) {
        contentRef.current.innerHTML = finalBodyHtml || "";
        setFormData((prev) => ({
          ...prev,
          body: contentRef.current.innerHTML,
        }));
      } else {
        setFormData((prev) => ({ ...prev, body: finalBodyHtml || "" }));
      }
    } catch (err) {
      console.error("applySavedTemplate error:", err);
      showAlert(
        "Failed to apply saved template: " + (err?.message || "unknown"),
      );
    }
  };

  const formatDateToDDMMMYYYY = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
  };

  const handleDownload = async (filename) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/letterheads/download/${filename}`,
        { withCredentials: true, headers, responseType: "blob" },
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      showAlert(error.response?.data?.message || "Failed to download file");
    }
  };

  const injectHeaderFooterIntoLetterRef = () => {
    const el = letterRef.current;
    if (!el) return () => {};
    const temps = [];

    try {
      const hasHeader =
        !!el.querySelector?.(".template-header") ||
        !!el.querySelector?.('img[alt="Header"]');
      if (!hasHeader && headerBlobRef.current) {
        const headerWrapper = document.createElement("div");
        headerWrapper.className = "template-header";
        const img = document.createElement("img");
        img.src = headerBlobRef.current;
        img.alt = "Header";
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        headerWrapper.appendChild(img);
        el.insertBefore(headerWrapper, el.firstChild);
        temps.push(headerWrapper);
      }

      const hasFooter =
        !!el.querySelector?.(".template-footer") ||
        !!el.querySelector?.('img[alt="Footer"]');
      if (!hasFooter && footerBlobRef.current) {
        const footerWrapper = document.createElement("div");
        footerWrapper.className = "template-footer";
        const img = document.createElement("img");
        img.src = footerBlobRef.current;
        img.alt = "Footer";
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        footerWrapper.appendChild(img);
        el.appendChild(footerWrapper);
        temps.push(footerWrapper);
      }
    } catch (err) {
      console.warn("injectHeaderFooterIntoLetterRef error", err);
    }

    return () => {
      try {
        temps.forEach((n) => n.remove());
      } catch (e) {}
    };
  };

  const injectWatermarkIntoLetterRef = () => {
    const el = letterRef.current;
    if (!el || !watermarkBlobUrl) return () => {};

    if (el.querySelector(".pdf-watermark")) return () => {};

    const wm = document.createElement("img");
    wm.src = watermarkBlobUrl;
    wm.alt = "Watermark";
    wm.className = "pdf-watermark";
    wm.style.position = "absolute";
    wm.style.left = ensurePercent(watermarkPropsState.xPct) || "50%";
    wm.style.top = ensurePercent(watermarkPropsState.yPct) || "50%";
    wm.style.width = ensurePercent(watermarkPropsState.wPct) || "60%";
    wm.style.height = watermarkPropsState.hPct
      ? ensurePercent(watermarkPropsState.hPct)
      : "auto";
    wm.style.transform = "translate(-50%, -50%)";
    wm.style.opacity = String(watermarkPropsState.opacity ?? 0.12);
    wm.style.pointerEvents = "none";
    wm.style.zIndex = "1";
    el.style.position = "relative";
    el.appendChild(wm);

    return () => {
      wm.remove();
    };
  };

  const handleEdit = (letterhead) => {
    setIsEditing(true);
    setEditingId(letterhead.id);
    setLetterType(letterhead.letter_type || "");
    const body = letterhead.body || "";
    setFormData((prev) => ({
      ...prev,
      letterhead_code: letterhead.letterhead_code || "",
      template_name: letterhead.template_name || "",
      letter_type: letterhead.letter_type || "",
      subject: letterhead.subject || "",
      body: body,
      recipient_name: letterhead.recipient_name || "",
      title: letterhead.title || "",
      mobile_number: letterhead.mobile_number || "",
      email: letterhead.email || "",
      address: letterhead.address || "",
      date: letterhead.date ? letterhead.date.split("T")[0] : "",
      signature: letterhead.signature || "",
      employee_name: letterhead.employee_name || "",
      position: letterhead.position || "",
      annual_salary: letterhead.annual_salary || "",
      effective_date: letterhead.effective_date
        ? letterhead.effective_date.split("T")[0]
        : "",
      date_of_appointment: letterhead.date_of_appointment
        ? letterhead.date_of_appointment.split("T")[0]
        : "",
      company_name: letterhead.company_name || "",
      company_address: letterhead.company_address || "",
      company_address_line2: letterhead.company_address_line2 || "",
      gstin_number: letterhead.gstin_number || "",
      cin_number: letterhead.cin_number || "",
      place: letterhead.place || "",
    }));

    setTimeout(() => {
      if (contentRef.current) {
        mergeBodyKeepingHeaderFooter(body || "");
      }
    }, 50);

    setShowPopup(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!letterRef.current || !contentRef.current) {
      showAlert("Form is not ready. Please try again.");
      return;
    }
    const {
      letterhead_code,
      template_name,
      letter_type,
      subject,
      recipient_name,
      title,
      mobile_number,
      email,
      address,
      date,
      signature,
      employee_name,
      position,
      annual_salary,
      effective_date,
      date_of_appointment,
      company_name,
      company_address,
      company_address_line2,
      gstin_number,
      cin_number,
      place,
    } = formData;
    const body = contentRef.current.innerHTML || "";

    if (!letter_type || letter_type.trim() === "") {
      showAlert("Letter type is required");
      return;
    }
    if (!subject || subject.trim() === "") {
      showAlert("Subject is required");
      return;
    }
    if (!body || body.trim() === "") {
      showAlert("Letter body is required");
      return;
    }

    if (letter_type === "Offer Letter") {
      if (!title || title.trim() === "") {
        showAlert("Title (Mr/Miss/Mrs) is required for Offer Letter");
        return;
      }
      if (!recipient_name || recipient_name.trim() === "") {
        showAlert("Recipient name is required for Offer Letter");
        return;
      }
      if (!position || position.trim() === "") {
        showAlert("Position is required for Offer Letter");
        return;
      }
      if (!annual_salary || annual_salary.trim() === "") {
        showAlert("Annual salary is required for Offer Letter");
        return;
      }
      if (!date_of_appointment || date_of_appointment.trim() === "") {
        showAlert("Date of appointment is required for Offer Letter");
        return;
      }
    }
    if (["Bank Details", "Bank Details Request Letter"].includes(letter_type)) {
      if (!title || title.trim() === "") {
        showAlert("Title (Mr/Mrs) is required for " + letter_type);
        return;
      }
      if (!recipient_name || recipient_name.trim() === "") {
        showAlert("Recipient name is required for " + letter_type);
        return;
      }
      if (!date || date.trim() === "") {
        showAlert("Date is required for " + letter_type);
        return;
      }

      if (!date_of_appointment || date_of_appointment.trim() === "") {
        showAlert("Date of joining is required for " + letter_type);
        return;
      }
    }

    let pdfFile;
    try {
      const cleanup = injectHeaderFooterIntoLetterRef();
      try {
        await waitForImagesToLoad(letterRef.current);

        setIsGenerating(true);
        const pdfBlob = await generatePDF(
          letterRef.current,
          letter_type,
          originalLogo,
          recipient_name,
          employee_name,
          position,
          effective_date,
          company_name,
          gstin_number,
          cin_number,
          address,
          true,
        );
        pdfFile = new File([pdfBlob], `letterhead-${Date.now()}.pdf`, {
          type: "application/pdf",
        });
      } finally {
        cleanup();
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      setIsGenerating(false);
      showAlert(`Failed to generate PDF: ${error.message}`);
      return;
    } finally {
      setIsGenerating(false);
    }

    const formDataToSend = new FormData();
    formDataToSend.append("letterhead_code", letterhead_code || "");
    formDataToSend.append("template_name", template_name || "");
    formDataToSend.append("letter_type", letter_type || "");
    formDataToSend.append("subject", subject || "");
    formDataToSend.append("body", body);
    formDataToSend.append("recipient_name", recipient_name || "");
    formDataToSend.append("title", title || "");
    formDataToSend.append("mobile_number", mobile_number || "");
    formDataToSend.append("email", email || "");
    formDataToSend.append("address", address || "");
    formDataToSend.append(
      "date",
      date ? new Date(date).toISOString().split("T")[0] : "",
    );
    formDataToSend.append("signature", signature || "");
    formDataToSend.append(
      "employee_name",
      letter_type === "Relieving Letter" ? employee_name : "",
    );
    formDataToSend.append(
      "position",
      [
        "Relieving Letter",
        "Offer Letter",
        "Bank Details Request Letter",
      ].includes(letter_type)
        ? position
        : "",
    );
    formDataToSend.append(
      "annual_salary",
      letter_type === "Offer Letter" ? annual_salary : "",
    );
    formDataToSend.append(
      "effective_date",
      effective_date
        ? new Date(effective_date).toISOString().split("T")[0]
        : "",
    );
    formDataToSend.append(
      "date_of_appointment",
      date_of_appointment
        ? new Date(date_of_appointment).toISOString().split("T")[0]
        : "",
    );
    formDataToSend.append("company_name", company_name || "");
    formDataToSend.append("company_address", company_address || "");
    formDataToSend.append("company_address_line2", company_address_line2 || "");
    formDataToSend.append("gstin_number", gstin_number || "");
    formDataToSend.append("cin_number", cin_number || "");
    formDataToSend.append(
      "place",
      ["Bank Details", "Bank Details Request Letter"].includes(letter_type)
        ? place
        : "",
    );
    formDataToSend.append("letterhead_file", pdfFile);

    try {
      let response;
      if (isEditing) {
        response = await axios.put(
          `${BACKEND_URL}/api/letterheads/update/${editingId}`,
          formDataToSend,
          {
            withCredentials: true,
            headers: { ...headers, "Content-Type": "multipart/form-data" },
          },
        );
        showAlert("Letterhead updated successfully!");
        setIsEditing(false);
        setEditingId(null);
      } else {
        response = await axios.post(
          `${BACKEND_URL}/api/letterheads/add`,
          formDataToSend,
          {
            withCredentials: true,
            headers: { ...headers, "Content-Type": "multipart/form-data" },
          },
        );
        showAlert("Letterhead saved successfully!");
      }
      const updatedResponse = await axios.get(
        `${BACKEND_URL}/api/letterheads/list`,
        { withCredentials: true, headers },
      );
      setLetterheads(updatedResponse.data.data || []);
      setShowPopup(false);

      setFormData({
        letterhead_code: "",
        template_name: "",
        letter_type: "",
        subject: "",
        body: "",
        recipient_name: "",
        title: "",
        mobile_number: "",
        email: "",
        address: "",
        date: "",
        signature: "",
        employee_name: "",
        position: "",
        annual_salary: "",
        effective_date: "",
        date_of_appointment: "",
        company_name: "",
        company_address: "",
        company_address_line2: "",
        gstin_number: "",
        cin_number: "",
        place: "",
      });
      setLetterType("");
      if (contentRef.current) contentRef.current.innerHTML = "";
      revokeIfBlob(headerBlobRef.current);
      revokeIfBlob(footerBlobRef.current);
      headerBlobRef.current = null;
      footerBlobRef.current = null;
      setHeaderBlobUrl(null);
      setFooterBlobUrl(null);
      setSelectedTemplate(null);
      setSelectedTemplateId("");
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      console.error(
        "Error:",
        isEditing ? "updating" : "saving",
        "letterhead:",
        error,
      );
      showAlert(
        `Failed to ${isEditing ? "update" : "save"} letterhead: ${errorMessage}`,
      );
    }
  };

  const handleLetterTypeChange = (e) => {
    const selectedType = e.target.value;
    setLetterType(selectedType);

    setFormData((prev) => ({
      ...prev,
      letter_type: selectedType,
      subject: "",
    }));

    const selectedTemplateItem = templates.find(
      (template) => template.letter_type === selectedType,
    );

    const newBodyHtml = selectedTemplateItem
      ? parseTemplateToHTML(selectedTemplateItem.content || "")
      : "";

    const editorHasHeader =
      !!contentRef.current &&
      !!contentRef.current.querySelector(".template-header");
    const editorHasFooter =
      !!contentRef.current &&
      !!contentRef.current.querySelector(".template-footer");
    const haveBlobHeader = !!headerBlobRef.current;
    const haveBlobFooter = !!footerBlobRef.current;

    if (
      contentRef.current &&
      (editorHasHeader || editorHasFooter || haveBlobHeader || haveBlobFooter)
    ) {
      replaceEditorBody(newBodyHtml);
      setFormData((prev) => ({
        ...prev,
        letter_type: selectedType,
        subject: selectedTemplateItem?.subject || "",
        body: contentRef.current.innerHTML,
        company_name: selectedTemplateItem?.company_name || prev.company_name,
        company_address:
          selectedTemplateItem?.company_address || prev.company_address,
        company_address_line2:
          selectedTemplateItem?.company_address_line2 ||
          prev.company_address_line2,
        gstin_number: selectedTemplateItem?.gstin_number || prev.gstin_number,
        cin_number: selectedTemplateItem?.cin_number || prev.cin_number,
      }));
    } else {
      if (contentRef.current) {
        mergeBodyKeepingHeaderFooter(newBodyHtml);
        setFormData((prev) => ({
          ...prev,
          letter_type: selectedType,
          subject: selectedTemplateItem?.subject || "",
          body: contentRef.current.innerHTML,
          company_name: selectedTemplateItem?.company_name || prev.company_name,
          company_address:
            selectedTemplateItem?.company_address || prev.company_address,
          company_address_line2:
            selectedTemplateItem?.company_address_line2 ||
            prev.company_address_line2,
          gstin_number: selectedTemplateItem?.gstin_number || prev.gstin_number,
          cin_number: selectedTemplateItem?.cin_number || prev.cin_number,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          letter_type: selectedType,
          subject: selectedTemplateItem?.subject || "",
          body: newBodyHtml,
        }));
      }
    }
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
    setFormData((prev) => ({
      ...prev,
      body: contentRef.current?.innerHTML || prev.body,
    }));
  };

  const handleContentChange = () => {
    setFormData((prev) => ({
      ...prev,
      body: contentRef.current?.innerHTML || "",
    }));
  };

  const escapeRegExp = (s) => (s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const updateContentWithFormData = (fieldName, value) => {
    if (!contentRef.current) return;
    try {
      const html = contentRef.current.innerHTML || "";
      const camel = fieldName.replace(/_([a-z])/g, (m, p) => p.toUpperCase());
      const patterns = [
        new RegExp(`{{\\s*${escapeRegExp(fieldName)}\\s*}}`, "g"),
        new RegExp(`{{\\s*${escapeRegExp(camel)}\\s*}}`, "g"),
        new RegExp(`\\[\\[\\s*${escapeRegExp(fieldName)}\\s*\\]\\]`, "g"),
      ];
      let out = html;
      patterns.forEach((p) => (out = out.replace(p, value || "")));
      if (out !== html) {
        contentRef.current.innerHTML = out;
        setFormData((prev) => ({
          ...prev,
          body: contentRef.current.innerHTML,
        }));
      }
    } catch (e) {
      console.warn("updateContentWithFormData failed", e);
    }
  };

  const waitForImagesToLoad = (container, timeout = 7000) => {
    if (!container) return Promise.resolve();
    const imgs = Array.from(container.querySelectorAll("img"));
    if (imgs.length === 0) return Promise.resolve();

    return new Promise((resolve) => {
      let settled = 0;
      const onSettled = () => {
        settled += 1;
        if (settled === imgs.length) resolve();
      };

      imgs.forEach((img) => {
        if (img.complete) {
          onSettled();
        } else {
          const t = setTimeout(() => {
            try {
              img.removeEventListener("load", onSettled);
              img.removeEventListener("error", onSettled);
            } catch (e) {}
            onSettled();
          }, timeout);

          const wrapped = () => {
            clearTimeout(t);
            onSettled();
          };
          img.addEventListener("load", wrapped, { once: true });
          img.addEventListener("error", wrapped, { once: true });
        }
      });
    });
  };

  const handleGenerate = async () => {
    if (!letterRef.current || !contentRef.current) {
      showAlert("Form is not ready. Please try again.");
      return;
    }
    try {
      setIsGenerating(true);
      const cleanup = injectHeaderFooterIntoLetterRef();
      try {
        await waitForImagesToLoad(letterRef.current);
        await generatePDF(
          letterRef.current,
          letterType,
          originalLogo,
          formData.recipient_name,
          formData.employee_name,
          formData.position,
          formData.effective_date,
          formData.company_name,
          formData.gstin_number,
          formData.cin_number,
          formData.address,
        );
        setFormData((prev) => ({
          ...prev,
          body: contentRef.current.innerHTML,
        }));
      } finally {
        cleanup();
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      showAlert(`Failed to generate PDF: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewDetails = (letterhead, type) => {
    setShowDetailsPopup({ letterhead, type });
  };
  const handleCloseDetailsPopup = () => setShowDetailsPopup(null);

  const handlePreview = async () => {
    if (!letterRef.current || !contentRef.current) {
      showAlert("Form is not ready. Please try again.");
      return;
    }
    try {
      setIsGenerating(true);
      const cleanup = injectHeaderFooterIntoLetterRef();
      const cleanupWatermark = injectWatermarkIntoLetterRef();
      try {
        await waitForImagesToLoad(letterRef.current);
        const pdfBlob = await generatePDF(
          letterRef.current,
          letterType,
          originalLogo,
          formData.recipient_name,
          formData.employee_name,
          formData.position,
          formData.effective_date,
          formData.company_name,
          formData.gstin_number,
          formData.cin_number,
          formData.address,
          true,
        );
        const pdfUri = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUri);
        setShowPreview(true);
        setFormData((prev) => ({
          ...prev,
          body: contentRef.current.innerHTML,
        }));
      } finally {
        cleanup();
        cleanupWatermark();
      }
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      showAlert(`Failed to generate PDF preview: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClosePreview = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setShowPreview(false);
  };

  const handleCancel = () => {
    setShowPopup(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      letterhead_code: "",
      template_name: "",
      letter_type: "",
      subject: "",
      body: "",
      recipient_name: "",
      title: "",
      mobile_number: "",
      email: "",
      address: "",
      date: "",
      signature: "",
      employee_name: "",
      position: "",
      annual_salary: "",
      effective_date: "",
      date_of_appointment: "",
      company_name: "",
      company_address: "",
      company_address_line2: "",
      gstin_number: "",
      cin_number: "",
      place: "",
    });
    setLetterType("");
    if (contentRef.current) contentRef.current.innerHTML = "";
    revokeIfBlob(headerBlobRef.current);
    revokeIfBlob(footerBlobRef.current);
    headerBlobRef.current = null;
    footerBlobRef.current = null;
    setHeaderBlobUrl(null);
    setFooterBlobUrl(null);
    setSelectedTemplateId("");
    setSelectedTemplate(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const newParagraph = document.createElement("p");
      newParagraph.innerHTML = "<br>";
      range.insertNode(newParagraph);
      range.selectNodeContents(newParagraph);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      contentRef.current?.focus();
      setFormData((prev) => ({
        ...prev,
        body: contentRef.current?.innerHTML || prev.body,
      }));
    }
  };

  useEffect(() => {
    return () => {
      revokeIfBlob(headerBlobRef.current);
      revokeIfBlob(footerBlobRef.current);
      headerBlobRef.current = null;
      footerBlobRef.current = null;
    };
  }, []);

  if (loading) return <div>Loading templates...</div>;

  const showExternalHeader =
    !!headerBlobUrl && !editorContainsWrapper("template-header");
  const showExternalFooter =
    !!footerBlobUrl && !editorContainsWrapper("template-footer");

  return (
    <div className="letterhead-letterhead-container">
      <div className="letterhead-button-wrapper">
        <button
          onClick={() => setShowPopup(true)}
          className="letterhead-open-popup-btn"
        >
          Create Letter
        </button>
      </div>

      <div className="letterhead-table-container">
        <h3>Letterheads</h3>
        {letterheads.length > 0 ? (
          <table className="letterhead-table">
            <thead>
              <tr>
                <th>Letterhead Code</th>
                <th>Letter Type</th>
                <th>Relieving Letter</th>
                <th>General Letter</th>
                <th>Bank Details Request</th>
                <th>Offer Letter Details</th>
                <th>Download</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {letterheads.map((letterhead) => (
                <tr key={letterhead.id}>
                  <td>{letterhead.letterhead_code || "-"}</td>
                  <td>{letterhead.letter_type || "-"}</td>
                  <td>
                    {letterhead.letter_type === "Relieving Letter" ? (
                      <i
                        className="fa fa-eye"
                        style={{ cursor: "pointer", color: "#7FBD2C" }}
                        onClick={() =>
                          handleViewDetails(letterhead, "Relieving Letter")
                        }
                        aria-label="View relieving letter details"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {letterhead.letter_type === "Letter" ? (
                      <i
                        className="fa fa-eye"
                        style={{ cursor: "pointer", color: "#7FBD2C" }}
                        onClick={() =>
                          handleViewDetails(letterhead, "General Letter")
                        }
                        aria-label="View general letter details"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {letterhead.letter_type ===
                    "Bank Details Request Letter" ? (
                      <i
                        className="fa fa-eye"
                        style={{ cursor: "pointer", color: "#7FBD2C" }}
                        onClick={() =>
                          handleViewDetails(
                            letterhead,
                            "Bank Details Request Letter",
                          )
                        }
                        aria-label="View bank details request letter"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {letterhead.letter_type === "Offer Letter" ? (
                      <i
                        className="fa fa-eye"
                        style={{ cursor: "pointer", color: "#7FBD2C" }}
                        onClick={() =>
                          handleViewDetails(letterhead, "Offer Letter")
                        }
                        aria-label="View offer letter details"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {letterhead.attachment ? (
                      <span
                        onClick={() => handleDownload(letterhead.attachment)}
                        style={{
                          cursor: "pointer",
                          color: "#7FBD2C",
                          textDecoration: "underline",
                        }}
                      >
                        Download
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <i
                      className="fa fa-pencil"
                      style={{ cursor: "pointer", color: "#7FBD2C" }}
                      onClick={() => handleEdit(letterhead)}
                      aria-label="Edit letterhead"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No letterheads found.</p>
        )}
      </div>

      {showDetailsPopup && (
        <div className="letterhead-popup-overlay">
          <div
            className="letterhead-popup-content"
            style={{ maxWidth: "500px", padding: "20px" }}
          >
            <h3>{showDetailsPopup.type} Details</h3>
            <button
              onClick={handleCloseDetailsPopup}
              className="letterhead-close-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="letterhead-popup-overlay">
          <div
            className="letterhead-popup-content"
            ref={letterRef}
            style={{ position: "relative" }}
          >
            {showExternalHeader ? (
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <img
                  src={headerBlobUrl}
                  alt="Header"
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>
            ) : null}
            <div
              className="letterhead-letterhead-header"
              style={{ display: "none" }}
              aria-hidden
            />

            <div className="letterhead-letter-form">
              <div className="letterhead-form-row">
                <div className="letterhead-form-group">
                  <label htmlFor="savedTemplateSelect">
                    Letterhead Template (header/footer)
                  </label>
                  <div className="letterhead-input-container">
                    {savedTemplates && savedTemplates.length > 0 ? (
                      <select
                        id="savedTemplateSelect"
                        value={selectedTemplateId || ""}
                        onChange={async (e) => {
                          const val = e.target.value;
                          if (!val) {
                            revokeIfBlob(headerBlobRef.current);
                            revokeIfBlob(footerBlobRef.current);
                            headerBlobRef.current = null;
                            footerBlobRef.current = null;
                            setSelectedTemplate(null);
                            setSelectedTemplateId("");
                            setHeaderBlobUrl(null);
                            setFooterBlobUrl(null);
                            if (contentRef.current)
                              contentRef.current.innerHTML = "";
                            setFormData((prev) => ({ ...prev, body: "" }));
                            return;
                          }
                          setSelectedTemplateId(val);
                          await applySavedTemplate(val);
                        }}
                        className="letterhead-input-field"
                      >
                        <option value="">
                          — Choose saved template (header/footer) —
                        </option>
                        {savedTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name || t.template_name || t.id}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span>No saved templates for this org.</span>

                        <button
                          onClick={() => {
                            console.log("Build Template clicked");
                            window.dispatchEvent(
                              new CustomEvent("app:navigate", {
                                detail: { path: "/TemplateBuilder" },
                              }),
                            );
                          }}
                          className="letterhead-open-popup-btn"
                        >
                          Build Template
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="letterhead-form-row">
                <div className="letterhead-form-group">
                  <label htmlFor="letterType">Letter Type</label>
                  <div className="letterhead-input-container">
                    <select
                      id="letterType"
                      value={letterType}
                      onChange={handleLetterTypeChange}
                      className="letterhead-letter-type-select letterhead-highlighted-select"
                    >
                      <option value="">Select letter type</option>
                      {templates.length > 0 &&
                        templates.map((template) => (
                          <option
                            key={template.letter_type}
                            value={template.letter_type}
                          >
                            {template.letter_type}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {letterFields[letterType]?.map((field) => {
                if (field.type === "select") {
                  return (
                    <div className="letterhead-form-row" key={field.id}>
                      <div className="letterhead-form-group">
                        <label htmlFor={field.id}>{field.label}</label>
                        <div className="letterhead-input-container">
                          <select
                            id={field.id}
                            value={formData[field.name] || ""}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                [field.name]: e.target.value,
                              }));
                              if (field.updateContent)
                                updateContentWithFormData(
                                  field.name,
                                  e.target.value,
                                );
                            }}
                            className="letterhead-input-field"
                          >
                            <option value="">Select</option>
                            {field.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="letterhead-form-row" key={field.id}>
                    <div className="letterhead-form-group">
                      <label htmlFor={field.id}>{field.label}</label>
                      <div className="letterhead-input-container">
                        <input
                          id={field.id}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ""}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }));
                            if (field.updateContent)
                              updateContentWithFormData(
                                field.name,
                                e.target.value,
                              );
                          }}
                          className="letterhead-input-field"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="letterhead-form-row">
                <div className="letterhead-form-group">
                  <label htmlFor="content">Content</label>
                  <div className="letterhead-input-container">
                    <div className="letterhead-formatting-buttons">
                      <button
                        onClick={() => applyFormat("bold")}
                        className="letterhead-format-btn"
                        aria-label="Bold text"
                      >
                        B
                      </button>
                      <button
                        onClick={() => applyFormat("underline")}
                        className="letterhead-format-btn"
                        aria-label="Underline text"
                      >
                        U
                      </button>
                      <button
                        onClick={() => applyFormat("italic")}
                        className="letterhead-format-btn"
                        aria-label="Italic text"
                      >
                        I
                      </button>
                      <button
                        onClick={() => applyFormat("hiliteColor", "#ffff00")}
                        className="letterhead-format-btn"
                        aria-label="Highlight text"
                      >
                        H
                      </button>
                    </div>
                    <div
                      id="content"
                      ref={contentRef}
                      contentEditable
                      className="letterhead-content-area"
                      aria-label="Letter content editor"
                      onKeyDown={handleKeyDown}
                      onInput={handleContentChange}
                      suppressContentEditableWarning
                    />
                  </div>
                </div>
              </div>
            </div>

            {showExternalFooter ? (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <img
                  src={footerBlobUrl}
                  alt="Footer"
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>
            ) : null}

            <div className="letterhead-popup-actions">
              <button onClick={handleCancel} className="letterhead-cancel-btn">
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (!letterRef.current || !contentRef.current) {
                    showAlert("Form is not ready. Please try again.");
                    return;
                  }
                  try {
                    setIsGenerating(true);

                    const clone = letterRef.current.cloneNode(true);

                    clone.style.position = "absolute";
                    clone.style.left = "-9999px";
                    clone.style.top = "-9999px";
                    clone.style.visibility = "visible";
                    document.body.appendChild(clone);

                    clone.querySelectorAll &&
                      clone
                        .querySelectorAll(".pdf-watermark")
                        ?.forEach((n) => n.remove());

                    if (watermarkBlobUrl) {
                      try {
                        const wm = document.createElement("img");
                        wm.src = watermarkBlobUrl;
                        wm.alt = "Watermark";
                        wm.className = "pdf-watermark";
                        wm.style.position = "absolute";
                        wm.style.left =
                          ensurePercent(watermarkPropsState.xPct) || "50%";
                        wm.style.top =
                          ensurePercent(watermarkPropsState.yPct) || "50%";
                        wm.style.width =
                          ensurePercent(watermarkPropsState.wPct) || "60%";
                        wm.style.height = watermarkPropsState.hPct
                          ? ensurePercent(watermarkPropsState.hPct)
                          : "auto";
                        wm.style.transform = "translate(-50%, -50%)";
                        wm.style.opacity = String(
                          watermarkPropsState.opacity ?? 0.12,
                        );
                        wm.style.pointerEvents = "none";
                        wm.style.zIndex = "9999";
                        if (getComputedStyle(clone).position === "static") {
                          clone.style.position = "relative";
                        }
                        clone.appendChild(wm);
                      } catch (e) {
                        console.warn(
                          "Failed to inject watermark into clone:",
                          e,
                        );
                      }
                    }

                    await waitForImagesToLoad(clone);

                    const pdfBlob = await generatePDF(
                      clone,
                      letterType,
                      originalLogo,
                      formData.recipient_name,
                      formData.employee_name,
                      formData.position,
                      formData.effective_date,
                      formData.company_name,
                      formData.gstin_number,
                      formData.cin_number,
                      formData.address,
                      true,
                    );

                    try {
                      document.body.removeChild(clone);
                    } catch (e) {}

                    const pdfUri = URL.createObjectURL(pdfBlob);
                    setPdfUrl(pdfUri);
                    setShowPreview(true);
                    setFormData((prev) => ({
                      ...prev,
                      body: contentRef.current.innerHTML,
                    }));
                  } catch (error) {
                    console.error(
                      "Error generating PDF preview (clone):",
                      error,
                    );
                    showAlert(
                      `Failed to generate PDF preview: ${
                        error?.message || error
                      }`,
                    );
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                className="letterhead-preview-btn"
                disabled={isGenerating}
              >
                {isGenerating ? "Preparing preview..." : "Preview"}
              </button>

              <button
                onClick={async () => {
                  if (!letterRef.current || !contentRef.current) {
                    showAlert("Form is not ready. Please try again.");
                    return;
                  }
                  try {
                    setIsGenerating(true);

                    const clone = letterRef.current.cloneNode(true);
                    clone.style.position = "absolute";
                    clone.style.left = "-9999px";
                    clone.style.top = "-9999px";
                    clone.style.visibility = "visible";
                    document.body.appendChild(clone);

                    clone.querySelectorAll &&
                      clone
                        .querySelectorAll(".pdf-watermark")
                        ?.forEach((n) => n.remove());

                    if (watermarkBlobUrl) {
                      try {
                        const wm = document.createElement("img");
                        wm.src = watermarkBlobUrl;
                        wm.alt = "Watermark";
                        wm.className = "pdf-watermark";
                        wm.style.position = "absolute";
                        wm.style.left =
                          ensurePercent(watermarkPropsState.xPct) || "50%";
                        wm.style.top =
                          ensurePercent(watermarkPropsState.yPct) || "50%";
                        wm.style.width =
                          ensurePercent(watermarkPropsState.wPct) || "60%";
                        wm.style.height = watermarkPropsState.hPct
                          ? ensurePercent(watermarkPropsState.hPct)
                          : "auto";
                        wm.style.transform = "translate(-50%, -50%)";
                        wm.style.opacity = String(
                          watermarkPropsState.opacity ?? 0.12,
                        );
                        wm.style.pointerEvents = "none";
                        wm.style.zIndex = "9999";
                        if (getComputedStyle(clone).position === "static") {
                          clone.style.position = "relative";
                        }
                        clone.appendChild(wm);
                      } catch (e) {
                        console.warn(
                          "Failed to inject watermark into clone for generate:",
                          e,
                        );
                      }
                    }

                    await waitForImagesToLoad(clone);

                    await generatePDF(
                      clone,
                      letterType,
                      originalLogo,
                      formData.recipient_name,
                      formData.employee_name,
                      formData.position,
                      formData.effective_date,
                      formData.company_name,
                      formData.gstin_number,
                      formData.cin_number,
                      formData.address,
                    );

                    try {
                      document.body.removeChild(clone);
                    } catch (e) {}

                    setFormData((prev) => ({
                      ...prev,
                      body: contentRef.current.innerHTML,
                    }));
                  } catch (error) {
                    console.error("Error generating PDF (clone):", error);
                    showAlert(
                      `Failed to generate PDF: ${error?.message || error}`,
                    );
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                className="letterhead-save-btn"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate PDF"}
              </button>

              <button
                onClick={handleSave}
                className="letterhead-save-btn"
                disabled={isGenerating}
              >
                {isGenerating
                  ? isEditing
                    ? "Updating..."
                    : "Saving..."
                  : isEditing
                    ? "Update"
                    : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="letterhead-preview-overlay">
          <div className="letterhead-preview-content">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="PDF Preview"
                style={{ width: "100%", height: "80vh", border: "none" }}
              />
            ) : (
              <p>Loading PDF preview...</p>
            )}
            <button
              onClick={handleClosePreview}
              className="letterhead-close-btn"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
};

export default LetterHead;
