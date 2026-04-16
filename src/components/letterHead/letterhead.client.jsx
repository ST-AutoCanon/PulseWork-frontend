
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

import { drawHeader, drawFooter,drawWatermark } from "./header";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";
const LetterheadClient = () => {
  const { user } = useAuth();
  const [errors, setErrors] = useState({});
  
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
const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };
  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  // Bi-directional field mapping: display -> db field
  const FIELD_MAPPING = {
    "recipient name": "recipient_name",
    "employee name": "employee_name",
    "position": "position",
    "mobile number": "mobile_number",
    "phone number": "phone_number",
    "contact number": "contact_number",
    "email": "email",
    "mail": "email",
    "date": "date",
    "title": "title",
    "subject": "subject",
    "address": "address",
    "signature": "signature",
    "annual salary": "annual_salary",
    "date of appointment": "date_of_appointment",
    "effective date": "effective_date",
    "place": "place",
    "company name": "company_name",
    "company address": "company_address",
    "company address line2": "company_address_line2",
    "gstin number": "gstin_number",
    "cin number": "cin_number"
  };

  // Saved Letters
  const [savedLetters, setSavedLetters] = useState([]);
  
  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
      setQuillContent(selected.content || '');

      const regex = /\[([^\]]+)\]/g;
      const matches = [...(selected.content || '').matchAll(regex)];
      const initialData = {};
      matches.forEach(match => {
        initialData[match[1].trim()] = '';
      });
      setFormData(initialData);
      setLetterName(selected.letter_type || '');
    }
  };

const handleFieldChange = (displayKey, value) => {
  const lowerKey = displayKey.toLowerCase();
  let processedValue = value;
  let errorMsg = '';

  /* ================= EMAIL ================= */
  if (lowerKey.includes('email') || lowerKey.includes('mail')) {
    processedValue = value.replace(/[^a-zA-Z0-9@._-]/g, '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (processedValue && !emailRegex.test(processedValue)) {
      errorMsg = 'Invalid email format';
    }
  }
  /* ================= MOBILE ================= */
  else if (
    lowerKey.includes('mobile') ||
    lowerKey.includes('phone') ||
    lowerKey.includes('contact')
  ) {
    processedValue = value.replace(/\D/g, '').slice(0, 10);
  }
  /* ================= DATE ================= */
  else if (lowerKey.includes('date')) {
    processedValue = value;
  }

  setFormData(prev => ({
    ...prev,
    [displayKey]: processedValue
  }));

  setErrors(prev => ({
    ...prev,
    [displayKey]: errorMsg
  }));
};

  // Replace Placeholders
 const replacePlaceholders = (html, data) => {
  if (!html) return '<p class="letterhead-no-content">Select a letter type to see preview</p>';

  let cleanedHtml = html.replace(/\[([^\]]+)\]/g, match => match.replace(/<[^>]*>/g, ''));

  const normalizedData = {};
  Object.keys(data).forEach(key => {
    let cleanKey = key.trim().replace(/\s+/g, ' ').toLowerCase();
    cleanKey = cleanKey.replace(/_/g, ' ');   // ← Added this line
    normalizedData[cleanKey] = data[key];
  });

  return cleanedHtml.replace(/\[([^\]]+)\]/g, (match, placeholder) => {
    let cleanPlaceholder = placeholder.trim().replace(/\s+/g, ' ').toLowerCase();
    cleanPlaceholder = cleanPlaceholder.replace(/_/g, ' ');   // ← Added this line

    let value = normalizedData[cleanPlaceholder];

    // Format date for preview/PDF
    if (cleanPlaceholder.includes("date") && value) {
      value = new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

    return value && value.trim() !== ''
      ? value
      : `<span class="letterhead-placeholder-missing">${match}</span>`;
  });
};

  const livePreviewHtml = useMemo(() => {
    return replacePlaceholders(quillContent, formData);
  }, [quillContent, formData]);

  // Reset Form
  const resetForm = () => {
    setSelectedTemplate(null);
    setQuillContent('');
    setFormData({});
    setLetterName('');
    setIsEditing(false);
    setEditingId(null);
  };

  // Load Letter for Editing
  // Load Letter for Editing - FIXED
// Load Letter for Editing - FIXED & IMPROVED
// ==================== FIXED handleEditLetter ====================

const formatDateForInput = (dateValue) => {

  if (!dateValue) return "";

  try {

    const date = new Date(dateValue);

    if (isNaN(date)) return "";

    return date.toISOString().split("T")[0];

  } catch (error) {

    return "";

  }

};
const handleEditLetter = (letter) => {

  console.log("Letter Data:", letter);

  const template = templates.find(
    t => t.letter_type === letter.letter_type
  );

  if (!template) {
    showAlert("Template not found.");
    return;
  }

  setSelectedTemplate(template);

  setLetterName(
    letter.template_name ||
    letter.letter_type ||
    ""
  );

  setEditingId(letter.id);
  setIsEditing(true);

  const restoredFormData = {};

  /* ================================
     DATE FIELDS
  ================================ */

  const formatDate = (value) => {

    if (!value) return "";

    try {

      const d = new Date(value);

      if (isNaN(d.getTime()))
        return "";

      return d.toISOString().slice(0, 10);

    } catch {

      return "";

    }

  };

  restoredFormData["Date"] =
    formatDate(letter.date);

  restoredFormData["Date Of Appointment"] =
    formatDate(
      letter.date_of_appointment
    );

  restoredFormData["Effective Date"] =
    formatDate(
      letter.effective_date
    );

  /* ================================
     SUBJECT (NEW FIX)
  ================================ */

  if (letter.subject) {

    restoredFormData["Subject"] =
      letter.subject;

  }

  /* ================================
     NAME FIELDS
  ================================ */

  if (letter.recipient_name) {

    restoredFormData["Recipient Name"] =
      letter.recipient_name;

  }

  if (letter.employee_name) {

    restoredFormData["Employee Name"] =
      letter.employee_name;

  }

  /* ================================
     MOBILE
  ================================ */

  if (letter.mobile_number) {

    restoredFormData["Mobile Number"] =
      letter.mobile_number;

    restoredFormData["Contact Number"] =
      letter.mobile_number;

  }

  /* ================================
     EMAIL
  ================================ */

  if (letter.email) {

    restoredFormData["Email"] =
      letter.email;

    restoredFormData["Mail"] =
      letter.email;

  }

  /* ================================
     POSITION
  ================================ */

  if (letter.position) {

    restoredFormData["Position"] =
      letter.position;

  }

  /* ================================
     COMPANY NAME
  ================================ */

  if (letter.company_name) {

    restoredFormData["Company Name"] =
      letter.company_name;

  }

  /* ================================
     ADDRESS
  ================================ */

  if (letter.address) {

    restoredFormData["Address"] =
      letter.address;

  }

  /* ================================
     PLACE
  ================================ */

  if (letter.place) {

    restoredFormData["Place"] =
      letter.place;

  }

  /* ================================
     TITLE
  ================================ */

  if (letter.title) {

    restoredFormData["Title"] =
      letter.title;

  }

  /* ================================
     SALARY
  ================================ */

  if (letter.annual_salary) {

    restoredFormData["Annual Salary"] =
      letter.annual_salary;

  }

  console.log(
    "Restored Form Data:",
    restoredFormData
  );

  setFormData(restoredFormData);

  /* ================================
     LOAD EDITOR CONTENT
  ================================ */

  setTimeout(() => {

    setQuillContent(
      template.content ||
      letter.body ||
      ""
    );

  }, 100);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

};

  // Save or Update Letter
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
    // Inside handleSaveOrUpdate
const payload = {
  letter_type: selectedTemplate.letter_type,
  template_name: letterName.trim(),
  body: livePreviewHtml,
  subject: formData["Subject"] || formData["subject"] || selectedTemplate.letter_type,
};

// Add all form fields
Object.entries(formData).forEach(([display, value]) => {
  if (value) {
    const lowerDisplay = display.toLowerCase().trim();
    const dbKey = FIELD_MAPPING[lowerDisplay];
    
    if (dbKey) {
      payload[dbKey] = value;
    } else {
      // For completely new fields like bank_name, employee_id, etc.
      const snakeKey = lowerDisplay.replace(/\s+/g, '_');
      payload[snakeKey] = value;
    }
  }
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

  // Generate PDF
const generatePDF = async (
  download = false,
  savedLetter = null
) => {

  setGenerating(true);

  try {

    let contentHtml =
      savedLetter
        ? savedLetter.body
        : livePreviewHtml;

   if (!contentHtml) {
  showAlert("No content available");
  setGenerating(false); // ⭐ FIX
  return;
}

    /* =========================
       CREATE TEMP CONTENT
    ========================= */

    const tempDiv =
      document.createElement("div");

    tempDiv.innerHTML = contentHtml;

    tempDiv.style.width = "190mm";
    tempDiv.style.padding = "10mm";
    tempDiv.style.fontFamily = "Arial";
    tempDiv.style.fontSize = "12px";
    tempDiv.style.lineHeight = "1.6";
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.background = "#ffffff";

    document.body.appendChild(tempDiv);

    await new Promise(r =>
      setTimeout(r, 400)
    );

    /* =========================
       FULL CANVAS
    ========================= */

    const fullCanvas =
      await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

    document.body.removeChild(tempDiv);

    /* =========================
       PDF SETUP
    ========================= */

    const pdf =
      new jsPDF("p", "mm", "a4");

    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    /* =========================
       SAFE SPACING
    ========================= */

    const headerHeight = 42;

    // ⭐ Bigger gap above footer
    const footerHeight = 60;

    const usableHeight =
      pageHeight -
      headerHeight -
      footerHeight;

    const imgWidth =
      pageWidth - 20;

    const pageCanvasHeight =
      usableHeight *
      (fullCanvas.width / imgWidth);

    let renderedHeight = 0;

    let pageNumber = 0;

    /* =========================
       PAGE LOOP
    ========================= */

    while (
      renderedHeight <
      fullCanvas.height
    ) {

      // Add new page except first
      if (pageNumber > 0) {
        pdf.addPage();
      }

      /* =========================
         DRAW HEADER
         (WATERMARK HERE)
      ========================= */

      await drawHeader(
        pdf,
        extractedOrgId || 1
      );

      /* =========================
         SLICE PAGE CONTENT
      ========================= */

      const pageCanvas =
        document.createElement("canvas");

      const context =
        pageCanvas.getContext("2d");

      pageCanvas.width =
        fullCanvas.width;

      pageCanvas.height =
        Math.min(
          pageCanvasHeight,
          fullCanvas.height -
          renderedHeight
        );

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
        (pageCanvas.height *
          imgWidth) /
        pageCanvas.width;

      /* =========================
         ADD PAGE CONTENT
      ========================= */

     pdf.addImage(
  imgData,
  "PNG",
  10,
  headerHeight,
  imgWidth,
  imgHeight
);

// ⭐ ADD WATERMARK AFTER CONTENT
await drawWatermark(
  pdf,
  extractedOrgId || 1
);

      renderedHeight +=
        pageCanvasHeight;

      pageNumber++;

    }

    /* =========================
       DRAW FOOTERS
       (ALL PAGES)
    ========================= */

   /* =========================
   DRAW FOOTERS (FIXED)
========================= */

const totalPages = pdf.getNumberOfPages();

for (let i = 1; i <= totalPages; i++) {

  pdf.setPage(i);

  /* 🔥 RESET EVERYTHING (CRITICAL FIX FOR PAGE 1) */
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.2);

  // 🔥 RESET TRANSPARENCY (VERY IMPORTANT)
  if (pdf.GState) {
    pdf.setGState(new pdf.GState({ opacity: 1 }));
  }

  await drawFooter(
    pdf,
    extractedOrgId || 1,
    i,
    totalPages
  );
}

    /* =========================
       SAVE OR PREVIEW
    ========================= */

    const filename =
      savedLetter
        ? `${savedLetter.template_name}.pdf`
        : `${letterName || "letter"}.pdf`;

    if (download) {

      pdf.save(filename);

    } else {

      const blob =
        pdf.output("blob");

      window.open(
        URL.createObjectURL(blob),
        "_blank"
      );

    }

  } catch (error) {

    console.error(
      "PDF Error:",
      error
    );

    showAlert(
      "PDF generation failed"
    );

  } finally {

    setGenerating(false);

  }

};

  const placeholderFields = useMemo(() => {
    if (!selectedTemplate?.content) return [];

    const textOnly = selectedTemplate.content.replace(/<[^>]*>/g, '');
    const regex = /\[([^\]]+)\]/g;
    const matches = [...textOnly.matchAll(regex)];
    
    const uniquePlaceholders = [...new Set(matches.map(m => m[1].trim().toLowerCase()))];

    // Filter mappings that match template placeholders
    return Object.entries(FIELD_MAPPING)
      .filter(([displayLower]) => 
        uniquePlaceholders.some(ph => 
          ph.replace(/_/g, ' ').toLowerCase().includes(displayLower) ||
          displayLower.includes(ph.replace(/_/g, ' '))
        )
      )
      .map(([displayLower, dbKey]) => ({
        display: displayLower.replace(/\b\w/g, l => l.toUpperCase()),
        dbKey
      }));
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
{(placeholderFields || []).map(({display: field}) => {

  const lowerField = field.toLowerCase();

  const isDateField = lowerField.includes("date");
  const isMobileField =
    lowerField.includes("mobile") ||
    lowerField.includes("phone") ||
    lowerField.includes("contact");

  const isEmailField =
    lowerField.includes("email") ||
    lowerField.includes("mail");

  return (
    <div key={field} className="letterhead-form-group">
      <label>{field}</label>

      <input
        type={
          isDateField ? "date" :
          isEmailField ? "email" :
          "text"
        }
        value={formData[field] || ''}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        placeholder={`Enter ${field}`}
      />

      {errors[field] && (
        <span style={{ color: "red", fontSize: "12px" }}>
          {errors[field]}
        </span>
      )}
    </div>
  );
})}
            </div>
          </div>
        )}

        {/* Editor */}
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

        {/* Saved Letters Table */}
        <div className="letterhead-saved-section">
          <h3>Saved Letters ({savedLetters.length})</h3>
          {savedLetters.length === 0 ? (
            <div className="letterhead-no-saved">No letters saved yet.</div>
          ) : (
            <table className="letterhead-saved-table">
              <thead>
                <tr>
                  <th>Letter Name</th>
                  <th>Type</th>
                  
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedLetters.map(letter => (
                  <tr key={letter.id}>
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