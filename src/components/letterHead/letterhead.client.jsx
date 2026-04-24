
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

// ✅ Append Annexure FIRST
if (selected.letter_type === "Offer Letter") {
  content += getAnnexureTableHtml();
}

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
    });

    return cleanedHtml.replace(/\[([^\]]+)\]/g, (match, placeholder) => {
      const cleanPlaceholder = placeholder.trim().replace(/\s+/g, ' ').toLowerCase();
      let value = normalizedData[cleanPlaceholder];

      if (cleanPlaceholder.includes("date") && value) {
        try {
          value = new Date(value).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        } catch {}
      }

      return value && value.trim() !== '' 
        ? value 
        : `<span class="letterhead-placeholder-missing">${match}</span>`;
    });
  };

  const livePreviewHtml = useMemo(() => {
    return replacePlaceholders(quillContent, formData);
  }, [quillContent, formData]);

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

    const regex = /\[([^\]]+)\]/g;
    const matches = [...(template.content || '').matchAll(regex)];

    const restoredFormData = {};

    matches.forEach(match => {
      const fieldName = match[1].trim();
      restoredFormData[fieldName] = '';
    });

    Object.keys(letter).forEach(dbKey => {
      if (['id', 'body', 'created_at', 'template_name', 'letterhead_code'].includes(dbKey)) return;

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
    setQuillContent(template.content || letter.body || '');
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

const generatePDF = async (download = false, savedLetter = null) => {

  setGenerating(true);

  try {

    let contentHtml =
  savedLetter
    ? savedLetter.body
    : livePreviewHtml;


// 🔍 LOG 1 — Raw HTML check
console.log(
  "Initial annexure occurrences:",
  (contentHtml.match(/Annexure-I/gi) || []).length
);


// ✅ Remove ANY annexure table (even if class missing)
contentHtml = contentHtml.replace(
  /<div class="annexure-break">[\s\S]*?<\/table>/gi,
  ''
);


// ✅ EXTRA CLEAN — remove Annexure table by heading text
contentHtml = contentHtml.replace(
  /<table[\s\S]*?Annexure-I[\s\S]*?<\/table>/gi,
  ''
);


// 🔍 LOG 2 — After cleaning
console.log(
  "After cleaning annexure occurrences:",
  (contentHtml.match(/Annexure-I/gi) || []).length
);


// Detect letter type
const letterType =
  savedLetter?.letter_type ||
  selectedTemplate?.letter_type;


// 🔍 LOG 3
console.log("Letter Type:", letterType);


// ✅ Append ONE annexure only
if (letterType === "Offer Letter") {

  const annexureHtml =
    getAnnexureTableHtml();

  console.log(
    "Appending annexure once"
  );

  contentHtml += annexureHtml;

}


// 🔍 LOG 4 — Final verification
console.log(
  "Final annexure count:",
  (contentHtml.match(/Annexure-I/gi) || []).length
);
    if (!contentHtml) {
      showAlert("No content available");
      return;
    }


    const tempDiv = document.createElement("div");

    tempDiv.innerHTML = contentHtml;

    tempDiv.style.width = "794px";
    tempDiv.style.padding = "40px";
    tempDiv.style.boxSizing = "border-box";
    tempDiv.style.fontFamily = "Arial";
    tempDiv.style.fontSize = "12px";
    tempDiv.style.lineHeight = "1.6";

    tempDiv.style.whiteSpace = "normal";
    tempDiv.style.wordWrap = "break-word";
    tempDiv.style.overflowWrap = "break-word";
    tempDiv.style.wordBreak = "break-word";

    tempDiv.style.pageBreakInside = "avoid";
    tempDiv.style.breakInside = "avoid";

    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";

    tempDiv.style.background = "#ffffff";

    document.body.appendChild(tempDiv);

    await new Promise(r => setTimeout(r, 400));


    // ✅ Detect Annexure Start Position
    const annexureElement =
      tempDiv.querySelector(".annexure-break");

    let annexureOffsetPx = null;

    if (annexureElement) {

      annexureOffsetPx =
        annexureElement.offsetTop;

    }


    const fullCanvas =
      await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });


    // Convert DOM px → canvas px
    if (annexureOffsetPx) {

      annexureOffsetPx =
        annexureOffsetPx * 2;

    }

    document.body.removeChild(tempDiv);


    const pdf =
      new jsPDF("p", "mm", "a4");

    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    const headerHeight = 45;
    const footerHeight = 60;

    const usableHeight =
      pageHeight - headerHeight - footerHeight;

    const imgWidth =
      pageWidth - 20;

    const pageCanvasHeight =
      usableHeight *
      (fullCanvas.width / imgWidth);


    let renderedHeight = 0;
    let pageNumber = 0;


    while (renderedHeight < fullCanvas.height) {

      if (pageNumber > 0)
        pdf.addPage();

      await drawHeader(
        pdf,
        extractedOrgId || 1
      );


      const pageCanvas =
        document.createElement("canvas");

      const context =
        pageCanvas.getContext("2d");

      pageCanvas.width =
        fullCanvas.width;


      let sliceHeight =
        Math.min(
          pageCanvasHeight,
          fullCanvas.height - renderedHeight
        );


      // 🔥 Force Annexure to Start on New Page
      if (
        annexureOffsetPx !== null &&
        renderedHeight < annexureOffsetPx &&
        renderedHeight + sliceHeight > annexureOffsetPx
      ) {

        sliceHeight =
          annexureOffsetPx - renderedHeight;

        if (sliceHeight <= 0) {

          sliceHeight =
            pageCanvasHeight;

        }

      }


      pageCanvas.height =
        sliceHeight;


      context.drawImage(
        fullCanvas,
        0,
        renderedHeight,
        fullCanvas.width,
        pageCanvas.height,
        0,
        0,
        fullCanvas.width,
        pageCanvas.height
      );


      const imgData =
        pageCanvas.toDataURL("image/png");

      const imgHeight =
        (pageCanvas.height * imgWidth) /
        pageCanvas.width;


      pdf.addImage(
        imgData,
        "PNG",
        10,
        headerHeight,
        imgWidth,
        imgHeight
      );


      await drawWatermark(
        pdf,
        extractedOrgId || 1
      );


      renderedHeight += sliceHeight;

      pageNumber++;

    }


    const totalPages =
      pdf.getNumberOfPages();


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

    }
    else {

      const blob =
        pdf.output("blob");

      window.open(
        URL.createObjectURL(blob),
        "_blank"
      );

    }

  }
  catch (error) {

    console.error(
      "PDF Error:",
      error
    );

    showAlert(
      "PDF generation failed"
    );

  }
  finally {

    setGenerating(false);

  }

};

  const placeholderFields = useMemo(() => {
    if (!selectedTemplate?.content) return [];
    const textOnly = selectedTemplate.content.replace(/<[^>]*>/g, '');
    const regex = /\[([^\]]+)\]/g;
    const matches = [...textOnly.matchAll(regex)];
    return [...new Set(matches.map(m => m[1].trim()))].sort();
  }, [selectedTemplate]);

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

                const niceLabel = field
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase());

                return (
                  <div key={field} className="letterhead-form-group">
                    <label>{niceLabel}</label>
                    <input
                      type={isDateField ? "date" : isEmailField ? "email" : "text"}
                      value={formData[field] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      placeholder={`Enter ${niceLabel}`}
                    />
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