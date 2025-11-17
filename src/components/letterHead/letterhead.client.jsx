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

async function fetchProtectedBlobUrl(src, apiKey, backendBase) {
  if (!src) return null;
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;

  const normalized = normalizeUploadUrl(src, backendBase);

  const cached = protectedBlobCache.get(normalized);
  if (cached) return cached;

  try {
    const res = await axios.get(normalized, {
      responseType: "blob",
      headers: { "x-api-key": apiKey || "" },
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

async function replaceUploadUrlsInHtml(html = "", apiKey, backendBase) {
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
      const blob = await fetchProtectedBlobUrl(candidate, apiKey, backendBase);
      if (blob) replacements[m] = blob;
      else replacements[m] = candidate;
    })
  );

  let out = html;
  Object.keys(replacements).forEach((orig) => {
    const safe = orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safe, "g"), replacements[orig]);
  });

  return out;
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

  const originalLogo = null;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
    /\/$/,
    ""
  );
  const meId = user?.employeeId;
  const orgId = user?.orgId ?? user?.org_id ?? null;
  const headers = {
    "x-api-key": API_KEY,
    "x-employee-id": meId,
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
          .get(`${BACKEND_URL}/api/templates/list`, { headers })
          .catch(() => ({ data: { data: [] } }));

        const letterheadsResp = await axios
          .get(`${BACKEND_URL}/api/letterheads/list`, { headers })
          .catch(() => ({ data: { data: [] } }));

        let saved = [];
        if (orgId) {
          const savedResp = await axios.get(
            `${BACKEND_URL}/api/orgs/${orgId}/templates`,
            { headers }
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
            (error?.response?.data?.error || error.message || "unknown")
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
        "text/html"
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
      (t) => String(t.id) === String(templateId)
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
      return;
    }

    setSelectedTemplateId(String(templateId));
    setSelectedTemplate(template);

    try {
      const candidateFields = [
        "header_url",
        "footer_url",
        "thumbnail",
        "imageUrl",
        "cleaned_url",
        "cleanedUrl",
      ];
      const resolved = { ...template };

      await Promise.all(
        candidateFields.map(async (field) => {
          const val = template[field] || template[field.toLowerCase()] || null;
          if (
            typeof val === "string" &&
            /\/api\/orgs\/\d+\/uploads\//.test(val)
          ) {
            const normalized = normalizeUploadUrl(val, BACKEND_URL);
            const blob = await fetchProtectedBlobUrl(
              normalized,
              API_KEY,
              BACKEND_URL
            );
            if (blob) resolved[field] = blob;
            else resolved[field] = normalized;
          } else if (typeof val === "string" && val.startsWith("/api/")) {
            const normalized = normalizeUploadUrl(val, BACKEND_URL);
            const blob = await fetchProtectedBlobUrl(
              normalized,
              API_KEY,
              BACKEND_URL
            );
            if (blob) resolved[field] = blob;
            else resolved[field] = normalized;
          } else {
            resolved[field] = val;
          }
        })
      );

      let contentHtml = template.html || template.content || "";
      if (
        typeof contentHtml === "string" &&
        /\/api\/orgs\/\d+\/uploads\//.test(contentHtml)
      ) {
        contentHtml = await replaceUploadUrlsInHtml(
          contentHtml,
          API_KEY,
          BACKEND_URL
        );
      }

      const headerVal =
        resolved.header_url ||
        resolved.headerUrl ||
        template.header_url ||
        template.headerUrl ||
        null;
      const footerVal =
        resolved.footer_url ||
        resolved.footerUrl ||
        template.footer_url ||
        template.footerUrl ||
        null;

      revokeIfBlob(headerBlobRef.current);
      revokeIfBlob(footerBlobRef.current);
      headerBlobRef.current = null;
      footerBlobRef.current = null;
      setHeaderBlobUrl(null);
      setFooterBlobUrl(null);

      if (headerVal) {
        if (typeof headerVal === "string") {
          if (
            /\/api\/orgs\/\d+\/uploads\//.test(headerVal) ||
            headerVal.startsWith("/api/")
          ) {
            const normalized = normalizeUploadUrl(headerVal, BACKEND_URL);
            const blob = await fetchProtectedBlobUrl(
              normalized,
              API_KEY,
              BACKEND_URL
            );
            headerBlobRef.current = blob || normalized;
          } else {
            headerBlobRef.current = headerVal;
          }
        } else {
          headerBlobRef.current = headerVal;
        }
      }

      if (footerVal) {
        if (typeof footerVal === "string") {
          if (
            /\/api\/orgs\/\d+\/uploads\//.test(footerVal) ||
            footerVal.startsWith("/api/")
          ) {
            const normalizedF = normalizeUploadUrl(footerVal, BACKEND_URL);
            const blobF = await fetchProtectedBlobUrl(
              normalizedF,
              API_KEY,
              BACKEND_URL
            );
            footerBlobRef.current = blobF || normalizedF;
          } else {
            footerBlobRef.current = footerVal;
          }
        } else {
          footerBlobRef.current = footerVal;
        }
      }

      const { headerHtml, bodyHtml, footerHtml } =
        extractHeaderFooterFromHtml(contentHtml);

      if (!headerVal && headerHtml) {
        const m = headerHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (m && m[1]) {
          const src = m[1];
          const normalized = normalizeUploadUrl(src, BACKEND_URL);
          const blob = await fetchProtectedBlobUrl(
            normalized,
            API_KEY,
            BACKEND_URL
          );
          headerBlobRef.current = blob || normalized;
        }
      }

      if (!footerVal && footerHtml) {
        const m = footerHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (m && m[1]) {
          const src = m[1];
          const normalized = normalizeUploadUrl(src, BACKEND_URL);
          const blob = await fetchProtectedBlobUrl(
            normalized,
            API_KEY,
            BACKEND_URL
          );
          footerBlobRef.current = blob || normalized;
        }
      }

      const wrappedHeaderHtml = headerHtml
        ? `<div class="template-header">${headerHtml}</div>`
        : "";
      const wrappedFooterHtml = footerHtml
        ? `<div class="template-footer">${footerHtml}</div>`
        : "";

      let finalBodyHtml = contentHtml;
      if (
        (headerBlobRef.current || footerBlobRef.current) &&
        bodyHtml !== undefined
      ) {
        finalBodyHtml = `${wrappedHeaderHtml}${
          bodyHtml || ""
        }${wrappedFooterHtml}`;
      } else {
        if (headerHtml || footerHtml) {
          finalBodyHtml = `${wrappedHeaderHtml}${
            bodyHtml || ""
          }${wrappedFooterHtml}`;
        } else {
          finalBodyHtml = contentHtml;
        }
      }

      if (contentRef.current) {
        contentRef.current.innerHTML = finalBodyHtml || "";
        setFormData((prev) => ({
          ...prev,
          body: contentRef.current.innerHTML,
        }));
        setHeaderBlobUrl(null);
        setFooterBlobUrl(null);
      } else {
        setFormData((prev) => ({
          ...prev,
          body: (finalBodyHtml || "").toString(),
        }));
        setHeaderBlobUrl(null);
        setFooterBlobUrl(null);
      }
    } catch (err) {
      console.error("applySavedTemplate error:", err);
      showAlert(
        "Failed to apply saved template: " + (err?.message || "unknown")
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
        {
          headers,
          responseType: "blob",
        }
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
          true
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
      date ? new Date(date).toISOString().split("T")[0] : ""
    );
    formDataToSend.append("signature", signature || "");
    formDataToSend.append(
      "employee_name",
      letter_type === "Relieving Letter" ? employee_name : ""
    );
    formDataToSend.append(
      "position",
      [
        "Relieving Letter",
        "Offer Letter",
        "Bank Details Request Letter",
      ].includes(letter_type)
        ? position
        : ""
    );
    formDataToSend.append(
      "annual_salary",
      letter_type === "Offer Letter" ? annual_salary : ""
    );
    formDataToSend.append(
      "effective_date",
      effective_date ? new Date(effective_date).toISOString().split("T")[0] : ""
    );
    formDataToSend.append(
      "date_of_appointment",
      date_of_appointment
        ? new Date(date_of_appointment).toISOString().split("T")[0]
        : ""
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
        : ""
    );
    formDataToSend.append("letterhead_file", pdfFile);

    try {
      let response;
      if (isEditing) {
        response = await axios.put(
          `${BACKEND_URL}/api/letterheads/update/${editingId}`,
          formDataToSend,
          {
            headers: { ...headers, "Content-Type": "multipart/form-data" },
          }
        );
        showAlert("Letterhead updated successfully!");
        setIsEditing(false);
        setEditingId(null);
      } else {
        response = await axios.post(
          `${BACKEND_URL}/api/letterheads/add`,
          formDataToSend,
          {
            headers: { ...headers, "Content-Type": "multipart/form-data" },
          }
        );
        showAlert("Letterhead saved successfully!");
      }
      const updatedResponse = await axios.get(
        `${BACKEND_URL}/api/letterheads/list`,
        { headers }
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
        error
      );
      showAlert(
        `Failed to ${isEditing ? "update" : "save"} letterhead: ${errorMessage}`
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
      (template) => template.letter_type === selectedType
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
          formData.address
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
          true
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
                            "Bank Details Request Letter"
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
          <div className="letterhead-popup-content" ref={letterRef}>
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
                          onClick={() =>
                            (window.location.href = BUILD_TEMPLATE_ROUTE)
                          }
                          className="letterhead-build-template-btn"
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
                                  e.target.value
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
                                e.target.value
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
                onClick={handlePreview}
                className="letterhead-preview-btn"
                disabled={isGenerating}
              >
                {isGenerating ? "Preparing preview..." : "Preview"}
              </button>
              <button
                onClick={handleGenerate}
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
