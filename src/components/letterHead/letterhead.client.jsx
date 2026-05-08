
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import './letterhead.css';

const ReactQuill = dynamic(
  () => import('react-quill-new'),
  { 
    ssr: false, 
    loading: () => <div className="letterhead-quill-loading">Loading editor...</div> 
  }
);

import 'react-quill-new/dist/quill.snow.css';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

import { drawHeader, drawFooter, drawWatermark } from "./header";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";
import { getAnnexureTableHtml } from "./../../utils/annexureTable";

const LetterheadClient = () => {
  const { user } = useAuth();
  
  const extractedOrgId = 
    user?.orgId ?? user?.org_id ?? user?.raw?.org_id ?? user?.Org_id ?? user?.raw?.Org_id ?? null;

  // States
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [quillContent, setQuillContent] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [letterName, setLetterName] = useState('');

  const [alertModal, setAlertModal] = useState({ isVisible: false, title: "", message: "" });
  const [errors, setErrors] = useState({});

  // Saved Letters
  const [savedLetters, setSavedLetters] = useState([]);
  
  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Field Mapping (Display name → DB column)
  const FIELD_MAPPING = {
    // Common Fields
    "recipient name": "recipient_name",
    "employee name": "employee_name",
    "position": "position",
    "designation": "designation",

    // Contact
    "mobile number": "mobile_number",
    "phone number": "phone_number",
    "contact number": "contact_number",
    "email": "email",

    // Dates
    "date": "date",
    "date of appointment": "date_of_appointment",
    "date of birth": "date_of_birth",
    "relieving date": "relieving_date",
    "resignation date": "resignation_date",

    // Company
    "company name": "company_name",
    "company address": "company_address",

    // HR Fields
    "employee id": "employee_id",
    "full name": "employee_name",
    "full_name": "employee_name",
    "authorized signatory name": "authorized_signatory_name",

    // Letter fields
    "subject purpose": "subject_purpose",
    "details message body": "details_message_body",
    "title": "title",
    "residential address": "residential_address"
  };

  // Fetch Templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/templates/list`, { withCredentials: true });
        setTemplates(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Fetch Saved Letters
  const fetchSavedLetters = async () => {
    if (!extractedOrgId) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/letterheads/list`, {
        withCredentials: true,
        headers: { 'x-org-id': extractedOrgId }
      });
      setSavedLetters(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch saved letters:", error);
    }
  };

  useEffect(() => {
    fetchSavedLetters();
  }, [extractedOrgId]);

  // Show Alert
  const showAlert = (message, title = "Alert") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  // Handle Template Selection
  const handleTemplateSelect = (e) => {
    const id = e.target.value;
    if (!id) {
      resetForm();
      return;
    }

    const selected = templates.find(t => t.id === parseInt(id));
    if (selected) {
      setSelectedTemplate(selected);
     let content = selected.content || '';

// ✅ Set full content
setQuillContent(content);
setLetterName(selected.letter_type || '');

// ✅ Scan placeholders from FULL content
const regex = /\[([^\]]+)\]/g;
const matches = [...content.matchAll(regex)];

const initialData = {};

matches.forEach(match => {
  const field = match[1].trim();
  initialData[field] = '';
});

setFormData(initialData);
setIsEditing(false);
setEditingId(null);
      
     
    }
  };

  const handleFieldChange = (displayKey, value) => {
    const lowerKey = displayKey.toLowerCase().trim();
    let processedValue = value;
    let errorMsg = '';

    if (lowerKey.includes('email') || lowerKey.includes('mail')) {
      processedValue = value.replace(/[^a-zA-Z0-9@._-]/g, '');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (processedValue && !emailRegex.test(processedValue)) {
        errorMsg = 'Invalid email format';
      }
    } else if (lowerKey.includes('mobile') || lowerKey.includes('phone') || lowerKey.includes('contact')) {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData(prev => ({ ...prev, [displayKey]: processedValue }));
    setErrors(prev => ({ ...prev, [displayKey]: errorMsg }));
  };

  const replacePlaceholders = (html, data) => {
    if (!html) return '<p class="letterhead-no-content">Select a letter type to see preview</p>';

    let cleanedHtml = html.replace(/\[([^\]]+)\]/g, match => match.replace(/<[^>]*>/g, ''));

    const normalizedData = {};
    Object.keys(data).forEach(key => {
      const cleanKey = key.trim().replace(/\s+/g, ' ').toLowerCase();
      normalizedData[cleanKey] = data[key];
      normalizedData[cleanKey.replace(/ /g, '_')] = data[key];
    });

    return cleanedHtml.replace(/\[([^\]]+)\]/g, (match, placeholder) => {
      const cleanPlaceholder = placeholder.trim().replace(/\s+/g, ' ').toLowerCase();
      let value = normalizedData[cleanPlaceholder];
      if (value === undefined) {
        value = normalizedData[cleanPlaceholder.replace(/ /g, '_')];
      }

      if (cleanPlaceholder.includes("date") && value) {
        try {
          value = new Date(value).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        } catch {}
      }

      return value !== undefined && value !== null && `${value}`.trim() !== ''
        ? value
        : `<span class="letterhead-placeholder-missing">${match}</span>`;
    });
  };

  const livePreviewHtml = useMemo(() => {
    let html = replacePlaceholders(quillContent, formData);
    if (selectedTemplate?.letter_type === "Offer Letter") {
      html += replacePlaceholders(getAnnexureTableHtml(), formData);
    }
    return html;
  }, [quillContent, formData, selectedTemplate]);

  const resetForm = () => {
    setSelectedTemplate(null);
    setQuillContent('');
    setFormData({});
    setLetterName('');
    setIsEditing(false);
    setEditingId(null);
    setErrors({});
  };

  const handleEditLetter = (letter) => {
    const template = templates.find(t => t.letter_type === letter.letter_type);
    if (!template) {
      showAlert("Template not found for this letter.");
      return;
    }

    setSelectedTemplate(template);
    setLetterName(letter.template_name || letter.letter_type || '');
    setEditingId(letter.id);
    setIsEditing(true);

    let initialContent = letter.raw_content || template.content || '';
    setQuillContent(initialContent);

    let contentForMatches = initialContent;
    if (template.letter_type === "Offer Letter") {
      contentForMatches += getAnnexureTableHtml();
    }

    const regex = /\[([^\]]+)\]/g;
    const matches = [...contentForMatches.matchAll(regex)];

    const restoredFormData = {};

    matches.forEach(match => {
      const fieldName = match[1].trim();
      restoredFormData[fieldName] = '';
    });

    Object.keys(letter).forEach(dbKey => {
      if (['id', 'body', 'raw_content', 'created_at', 'template_name', 'letterhead_code'].includes(dbKey)) return;

      const dbNormalized = dbKey.toLowerCase().replace(/_/g, ' ').trim();
      const matchedField = Object.keys(restoredFormData).find(field =>
        field.toLowerCase().replace(/_/g, ' ').trim() === dbNormalized
      );

      if (matchedField) {
        restoredFormData[matchedField] = dbKey.includes('date') 
          ? (letter[dbKey] ? letter[dbKey].split('T')[0] : '') 
          : letter[dbKey];
      }
    });

    setFormData(restoredFormData);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveOrUpdate = async () => {
    if (!selectedTemplate || !extractedOrgId) {
      showAlert("Please select a template and ensure you are logged in.");
      return;
    }
    if (!letterName.trim()) {
      showAlert("Please enter a letter name");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        letter_type: selectedTemplate.letter_type,
        template_name: letterName.trim(),
        body: livePreviewHtml,
        raw_content: quillContent,
        subject: formData["Subject"] || formData["subject"] || selectedTemplate.letter_type,
      };

      Object.entries(formData).forEach(([displayKey, value]) => {
        if (!value) return;
        const normalizedKey = displayKey.toLowerCase().trim().replace(/\s+/g, ' ');
        const dbColumn = FIELD_MAPPING[normalizedKey] || normalizedKey.replace(/\s+/g, '_');
        payload[dbColumn] = value;
      });

      let res;
      if (isEditing && editingId) {
        res = await axios.put(`${BACKEND_URL}/api/letterheads/update/${editingId}`, payload, {
          withCredentials: true,
          headers: { 'x-org-id': extractedOrgId }
        });
        showAlert("Letter updated successfully!");
      } else {
        res = await axios.post(`${BACKEND_URL}/api/letterheads/add`, payload, {
          withCredentials: true,
          headers: { 'x-org-id': extractedOrgId }
        });
        showAlert("Letter saved successfully!");
      }

      resetForm();
      fetchSavedLetters();
    } catch (error) {
      console.error("Save/Update error:", error);
      showAlert("Failed to save letter. Please try again.");
    } finally {
      setSaving(false);
    }
  };
const isCanvasSliceEmpty = (canvas) => {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;

  try {
    const imageData = ctx.getImageData(0, 0, width, height).data;

    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];

      // if pixel is NOT white → content exists
      if (!(r > 240 && g > 240 && b > 240)) {
        return false;
      }
    }

    return true; // fully empty
  } catch (e) {
    return false; // fail safe → don't skip
  }
};
const generatePDF = async (download = false, savedLetter = null) => {

  setGenerating(true);

  try {

    let contentHtml =
      savedLetter
        ? savedLetter.body
        : livePreviewHtml;

    if (!contentHtml) {
      showAlert("No content available");
      return;
    }

  const pdfStyles = `
<style>

.pdf-outer-wrapper {
  width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  white-space: normal !important;
  page-break-inside: auto !important;
  break-inside: auto !important;
}

/* Paragraph Fix */
.pdf-outer-wrapper p,
.pdf-outer-wrapper span,
.pdf-outer-wrapper div,
.pdf-outer-wrapper td,
.pdf-outer-wrapper th,
.pdf-outer-wrapper li {
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  white-space: normal !important;
  max-width: 100% !important;
}

/* Table Fix */
.pdf-outer-wrapper > table {
  width: 100% !important;
  border-collapse: collapse !important;
  table-layout: fixed !important;
}

.pdf-outer-wrapper > table > thead > tr > th,
.pdf-outer-wrapper > table > tbody > tr > td {
  border: 1px solid #2b2b2b !important;
  padding: 5px !important;
  text-align: left !important;
  vertical-align: top !important;
}

.pdf-outer-wrapper table table {
  border: none !important;
  table-layout: auto !important;
  width: auto !important;
}

</style>
`;

    const tempDiv = document.createElement("div");

    tempDiv.innerHTML =
      pdfStyles +
      `<div class="pdf-outer-wrapper">
        ${contentHtml}
      </div>`;

    tempDiv.style.width = "794px";
    tempDiv.style.padding = "40px";
    tempDiv.style.boxSizing = "border-box";
    tempDiv.style.fontFamily = "Arial";
    tempDiv.style.fontSize = "12px";
    tempDiv.style.lineHeight = "1.6";
    tempDiv.style.wordWrap = "break-word";
tempDiv.style.overflowWrap = "break-word";
tempDiv.style.whiteSpace = "normal";
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.background = "#ffffff";

    document.body.appendChild(tempDiv);

    await new Promise(r => setTimeout(r, 400));

    // Annexure detection
    const annexureElement = tempDiv.querySelector(".annexure-break");
    let annexureOffsetPx = annexureElement ? annexureElement.offsetTop : null;

    const fullCanvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    if (annexureOffsetPx) annexureOffsetPx *= 2;

    document.body.removeChild(tempDiv);

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const headerHeight = 45;
    const footerHeight = 60;

    const usableHeight = pageHeight - headerHeight - footerHeight;

    const imgWidth = pageWidth - 20;

    const pageCanvasHeight =
      usableHeight * (fullCanvas.width / imgWidth);

    let renderedHeight = 0;
    let pageNumber = 0;

    // ✅ Safe break finder
    const findSafeBreakPoint = (canvas, startY, maxHeight) => {
      try {
        const ctx = canvas.getContext("2d");
        if (!ctx) return maxHeight;

        const width = canvas.width;

        for (let y = startY + maxHeight; y > startY; y -= 10) {
          if (y <= 0 || y >= canvas.height) continue;

          const imageData = ctx.getImageData(0, y, width, 5).data;

          let isWhite = true;

          for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];

            if (!(r > 240 && g > 240 && b > 240)) {
              isWhite = false;
              break;
            }
          }

          if (isWhite) return y - startY;
        }

        return maxHeight;

      } catch {
        return maxHeight;
      }
    };

    // ✅ Empty slice checker
    const isCanvasSliceEmpty = (canvas) => {
      try {
        const ctx = canvas.getContext("2d");
        if (!ctx) return false;

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        for (let i = 0; i < data.length; i += 4) {
          if (!(data[i] > 240 && data[i+1] > 240 && data[i+2] > 240)) {
            return false;
          }
        }
        return true;
      } catch {
        return false;
      }
    };

    // 🔥 MAIN LOOP
    while (renderedHeight < fullCanvas.height) {

      let maxSliceHeight = Math.min(
        pageCanvasHeight,
        fullCanvas.height - renderedHeight
      );

      let sliceHeight = findSafeBreakPoint(
        fullCanvas,
        renderedHeight,
        maxSliceHeight
      );

      if (!sliceHeight || sliceHeight < 50) {
        sliceHeight = maxSliceHeight;
      }

      // Annexure page break
      if (
        annexureOffsetPx !== null &&
        renderedHeight < annexureOffsetPx &&
        renderedHeight + sliceHeight > annexureOffsetPx
      ) {
        sliceHeight = annexureOffsetPx - renderedHeight;
      }

      if (renderedHeight + sliceHeight > fullCanvas.height) {
        sliceHeight = fullCanvas.height - renderedHeight;
      }

      // Create slice
      const pageCanvas = document.createElement("canvas");
      const context = pageCanvas.getContext("2d");

      pageCanvas.width = fullCanvas.width;
      pageCanvas.height = sliceHeight;

      context.drawImage(
        fullCanvas,
        0,
        renderedHeight,
        fullCanvas.width,
        sliceHeight,
        0,
        0,
        fullCanvas.width,
        sliceHeight
      );

      // 🚨 SKIP EMPTY PAGE
      if (isCanvasSliceEmpty(pageCanvas)) {
        renderedHeight += sliceHeight;
        continue;
      }

      // ✅ Add page only if needed
      if (pageNumber > 0) {
        pdf.addPage();
      }

      await drawHeader(pdf, extractedOrgId || 1);

      const imgData = pageCanvas.toDataURL("image/png");

      const imgHeight =
        (sliceHeight * imgWidth) / fullCanvas.width;

      pdf.addImage(
        imgData,
        "PNG",
        10,
        headerHeight,
        imgWidth,
        imgHeight
      );

      await drawWatermark(pdf, extractedOrgId || 1);

      renderedHeight += sliceHeight;
      pageNumber++;
    }

    const totalPages = pdf.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      await drawFooter(
        pdf,
        extractedOrgId || 1,
        i,
        totalPages
      );
    }

    const filename =
      savedLetter
        ? `${savedLetter.template_name || 'letter'}.pdf`
        : `${letterName || "letter"}.pdf`;

    if (download) {
      pdf.save(filename);
    } else {
      const blob = pdf.output("blob");
      window.open(URL.createObjectURL(blob), "_blank");
    }

  } catch (error) {
    console.error("PDF Error:", error);
    showAlert("PDF generation failed");
  } finally {
    setGenerating(false);
  }
};

  const placeholderFields = useMemo(() => {
    if (!quillContent) return [];
    let textOnly = quillContent.replace(/<[^>]*>/g, '');
    if (selectedTemplate?.letter_type === "Offer Letter") {
      textOnly += getAnnexureTableHtml().replace(/<[^>]*>/g, '');
    }
    const regex = /\[([^\]]+)\]/g;
    const matches = [...textOnly.matchAll(regex)];
    return [...new Set(matches.map(m => m[1].trim()))].sort();
  }, [quillContent, selectedTemplate]);

  if (loading) return <div className="letterhead-no-template">Loading letter templates...</div>;

  return (
    <div className="letterhead-main">
      <div className="letterhead-content-vertical">

        {/* Template Selection */}
        <div className="letterhead-top-section">
          <h3>Select Letter Type</h3>
          <select onChange={handleTemplateSelect} className="letterhead-template-select" defaultValue="">
            <option value="">-- Select Letter Type --</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.letter_type}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Fields */}
        {selectedTemplate && placeholderFields.length > 0 && (
          <div className="letterhead-fields-section">
            <h3>Fill Details</h3>
            <div className="letterhead-dynamic-form">
              {placeholderFields.map(field => {
                const lowerField = field.toLowerCase();
                const isDateField = lowerField.includes("date");
                const isEmailField = lowerField.includes("email") || lowerField.includes("mail");
                const isTitleField = lowerField.includes("title");
                

  const isGenderField =
  lowerField.includes("gender_pronoun");

const isGenderPossessiveField =
  lowerField.includes("gender_possessive");

                const niceLabel = field
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase());

                return (
                  <div key={field} className="letterhead-form-group">
                    <label>{niceLabel}</label>
                    {isTitleField ? (

  <select
    value={formData[field] || ''}
    onChange={(e) => handleFieldChange(field, e.target.value)}
  >
    <option value="">Select Title</option>
    <option value="Mr">Mr</option>
    <option value="Mrs">Mrs</option>
    <option value="Ms">Ms</option>
  </select>

) : isGenderField ? (

  <select
    value={formData[field] || ''}
    onChange={(e) => handleFieldChange(field, e.target.value)}
  >
    <option value="">Select</option>
    <option value="He">He</option>
    <option value="She">She</option>
  </select>

) : isGenderPossessiveField ? (

  <select
    value={formData[field] || ''}
    onChange={(e) => handleFieldChange(field, e.target.value)}
  >
    <option value="">Select</option>
    <option value="his">his</option>
    <option value="her">her</option>
  </select>

) : (

  <input
    type={isDateField ? "date" : isEmailField ? "email" : "text"}
    value={formData[field] || ''}
    onChange={(e) => handleFieldChange(field, e.target.value)}
    placeholder={`Enter ${niceLabel}`}
  />

)}
                    {errors[field] && <span style={{ color: "red", fontSize: "12px" }}>{errors[field]}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Editor + Preview + Actions */}
        {selectedTemplate && (
          <div className="letterhead-editor-vertical">
            <div className="letterhead-editor-header">
              <h2>{selectedTemplate.letter_type} {isEditing && '(Editing)'}</h2>
              <div className="letterhead-action-buttons">
                <input
                  type="text"
                  placeholder="Letter Name"
                  value={letterName}
                  onChange={(e) => setLetterName(e.target.value)}
                  className="letterhead-save-input"
                />
                <button 
                  onClick={handleSaveOrUpdate}
                  disabled={saving || !letterName.trim()}
                  className="letterhead-btn letterhead-btn-save"
                >
                  {saving ? 'Saving...' : isEditing ? 'Update Letter' : 'Save Letter'}
                </button>
                <button 
                  onClick={() => generatePDF(false)}
                  disabled={generating}
                  className="letterhead-btn letterhead-btn-preview"
                >
                  Preview PDF
                </button>
                <button 
                  onClick={() => generatePDF(true)}
                  disabled={generating}
                  className="letterhead-btn letterhead-btn-download"
                >
                  Download PDF
                </button>
              </div>
            </div>

            <div className="letterhead-quill-wrapper">
              <ReactQuill
                value={quillContent}
                onChange={setQuillContent}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ background: [] }],
                    [{ align: [] }],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['clean']
                  ]
                }}
              />
            </div>

            <div className="letterhead-preview-section">
              <h3>Live Preview</h3>
              <div 
                className="letterhead-live-preview-box ql-editor"
                dangerouslySetInnerHTML={{ __html: livePreviewHtml }}
              />
            </div>
          </div>
        )}

        {/* Saved Letters Table - Updated with Letterhead Code */}
        <div className="letterhead-saved-section">
          <h3>Saved Letters ({savedLetters.length})</h3>
          {savedLetters.length === 0 ? (
            <div className="letterhead-no-saved">No letters saved yet.</div>
          ) : (
            <table className="letterhead-saved-table">
              <thead>
                <tr>
                  <th>Letterhead Code</th>   {/* ← New Column */}
                  <th>Letter Name</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedLetters.map(letter => (
                  <tr key={letter.id}>
                    <td>
                      <strong>{letter.letterhead_code || 'N/A'}</strong>
                    </td>
                    <td>{letter.template_name}</td>
                    <td>{letter.letter_type}</td>
                    <td className="letterhead-table-actions">
                      <button 
                        onClick={() => generatePDF(false, letter)} 
                        className="letterhead-table-btn letterhead-table-btn-preview"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => generatePDF(true, letter)} 
                        className="letterhead-table-btn letterhead-table-btn-download"
                      >
                        Download
                      </button>
                      <button 
                        onClick={() => handleEditLetter(letter)}
                        className="letterhead-table-btn"
                        style={{ backgroundColor: '#79c42b', color: 'white' }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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

export default LetterheadClient;