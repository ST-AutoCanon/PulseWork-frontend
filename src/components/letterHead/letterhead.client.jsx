
// // 'use client';

// // import React, { useState, useEffect, useMemo } from 'react';
// // import dynamic from 'next/dynamic';
// // import axios from 'axios';
// // import './letterhead.css';

// // const ReactQuill = dynamic(
// //   () => import('react-quill-new'),
// //   { 
// //     ssr: false, 
// //     loading: () => <div className="letterhead-quill-loading">Loading editor...</div> 
// //   }
// // );

// // import 'react-quill-new/dist/quill.snow.css';
// // import html2pdf from "html2pdf.js";
// // import html2canvas from "html2canvas";
// // import jsPDF from "jspdf";


// // const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
// // import { getLetterheadDesign } from "./letterheadpdfdesign";
// // import { drawHeader, drawFooter } from "./header";
// // import { useAuth } from "../../context/AuthProvider.client";
// // const LetterheadClient = ({ orgId }) => {
// //   const { user, hydrated } = useAuth();
// //   const extractedOrgId =
// //     user?.orgId ??
// //     user?.org_id ??
// //     user?.raw?.org_id ??
// //     user?.Org_id ??
// //     user?.raw?.Org_id ??
// //     null;
// //   const [templates, setTemplates] = useState([]);
// //   const [selectedTemplate, setSelectedTemplate] = useState(null);
// //   const [quillContent, setQuillContent] = useState('');
// //   const [formData, setFormData] = useState({});
// //   const [loading, setLoading] = useState(true);
// //   const [generating, setGenerating] = useState(false);
// //   const [savedLetters, setSavedLetters] = useState([]);
// //   const [saving, setSaving] = useState(false);
// //   const [letterName, setLetterName] = useState('');


// //   // ← Add this log to debug
// //   useEffect(() => {
// //     console.log("[LetterheadClient] Extracted orgId from user:", extractedOrgId);
// //   }, [extractedOrgId]);
// //   // Fetch all templates
// //   useEffect(() => {
// //     const fetchTemplates = async () => {
// //       try {
// //         const res = await axios.get(`${BACKEND_URL}/api/templates/list`, {
// //           withCredentials: true,
// //         });
// //         setTemplates(res.data.data || []);
// //       } catch (error) {
// //         console.error("Failed to fetch templates:", error);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchTemplates();
// //   }, [orgId]);

// //   // Handle template selection
// //   const handleTemplateSelect = (e) => {
// //     const id = e.target.value;
// //     if (!id) {
// //       setSelectedTemplate(null);
// //       setQuillContent('');
// //       setFormData({});
// //       return;
// //     }

// //     const selected = templates.find(t => t.id === parseInt(id));
// //     if (selected) {
// //       setSelectedTemplate(selected);
// //       setQuillContent(selected.content || '');

// //       // Auto-detect all [Placeholder] fields
// //       const regex = /\[([^\]]+)\]/g;
// //       const matches = [...(selected.content || '').matchAll(regex)];
// //       const initialData = {};
// //       matches.forEach(match => {
// //         initialData[match[1].trim()] = '';
// //       });
// //       setFormData(initialData);
// //     }
// //   };

// //   const handleFieldChange = (key, value) => {
// //   const cleanKey = key
// //     .trim()
// //     .replace(/\s+/g, ' ');

// //   setFormData(prev => ({
// //     ...prev,
// //     [cleanKey]: value
// //   }));
// // };

// // const replacePlaceholders = (html, data) => {
// //   if (!html) {
// //     return '<p class="letterhead-no-content">Select a letter type to see preview</p>';
// //   }

// //   // STEP 1 — Remove HTML tags inside placeholders
// //   let cleanedHtml = html.replace(
// //     /\[([^\]]+)\]/g,
// //     (match) => match.replace(/<[^>]*>/g, '')
// //   );

// //   // STEP 2 — Normalize formData keys
// //   const normalizedData = {};

// //   Object.keys(data).forEach((key) => {
// //     const cleanKey = key
// //       .trim()
// //       .replace(/\s+/g, ' ')
// //       .toLowerCase();

// //     normalizedData[cleanKey] = data[key];
// //   });

// //   // STEP 3 — Replace placeholders
// //   cleanedHtml = cleanedHtml.replace(
// //     /\[([^\]]+)\]/g,
// //     (match, placeholder) => {

// //       const cleanPlaceholder = placeholder
// //         .trim()
// //         .replace(/\s+/g, ' ')
// //         .toLowerCase();

// //       const value = normalizedData[cleanPlaceholder];

// //       console.log(
// //         `Replacing [${cleanPlaceholder}] →`,
// //         value
// //       );

// //       if (value !== undefined && value !== '') {
// //         return value;
// //       }

// //       return `<span class="letterhead-placeholder-missing">${match}</span>`;
// //     }
// //   );

// //   return cleanedHtml;
// // };

// //   // Live Preview with real-time placeholder replacement
// //   const livePreviewHtml = useMemo(() => {
// //     return replacePlaceholders(quillContent, formData);
// //   }, [quillContent, formData]);

// // // const generatePDF = async (download = false) => {

// // //   if (!selectedTemplate) {
// // //     alert("Please select a letter type first");
// // //     return;
// // //   }

// // //   setGenerating(true);

// // //   try {

// // //     const element =
// // //       document.querySelector(
// // //         ".letterhead-live-preview-box"
// // //       );

// // //     if (!element) {
// // //       alert("Preview not found");
// // //       return;
// // //     }

// // //     const opt = {

// // //       margin: 10,

// // //       filename:
// // //         `${selectedTemplate.letter_type || "letter"}.pdf`,

// // //       image: {
// // //         type: "jpeg",
// // //         quality: 0.98
// // //       },

// // //       html2canvas: {
// // //         scale: 2
// // //       },

// // //       jsPDF: {
// // //         unit: "mm",
// // //         format: "a4",
// // //         orientation: "portrait"
// // //       }

// // //     };

// // //     if (download) {

// // //       // Download directly
// // //       await html2pdf()
// // //         .set(opt)
// // //         .from(element)
// // //         .save();

// // //     } else {

// // //       // Preview PDF
// // //       const pdfBlob =
// // //         await html2pdf()
// // //           .set(opt)
// // //           .from(element)
// // //           .outputPdf("blob");

// // //       const url =
// // //         URL.createObjectURL(pdfBlob);

// // //       window.open(url);

// // //     }

// // //   } catch (error) {

// // //     console.error(
// // //       "Frontend PDF error:",
// // //       error
// // //     );

// // //     alert(
// // //       "Failed to generate PDF"
// // //     );

// // //   } finally {

// // //     setGenerating(false);

// // //   }

// // // };
// //   // Extract unique placeholder fields
 
// //   // FIXED generatePDF with better logging and fallback
// //   const generatePDF = async (download = false) => {

// //   console.log(
// //     `[PDF Generation] Starting PDF generation for orgId: ${extractedOrgId}`
// //   );

// //   if (!selectedTemplate) {
// //     alert("Please select a letter type first");
// //     return;
// //   }

// //   if (!extractedOrgId) {
// //     console.error(
// //       "[PDF Generation] orgId is missing! Using default header."
// //     );
// //   }

// //   setGenerating(true);

// //   try {

// //     /* ===============================
// //        CREATE TEMP CONTENT
// //     =============================== */

// //     const tempDiv = document.createElement('div');

// //     tempDiv.innerHTML = livePreviewHtml;

// //     tempDiv.style.width = '190mm';
// //     tempDiv.style.minHeight = '277mm';
// //     tempDiv.style.padding = '10mm';

// //     tempDiv.style.fontFamily = 'Arial, sans-serif';
// //     tempDiv.style.fontSize = '12px';
// //     tempDiv.style.lineHeight = '1.5';
// //     tempDiv.style.color = '#000';

// //     tempDiv.style.position = 'absolute';
// //     tempDiv.style.left = '-9999px';
// //     tempDiv.style.top = '-9999px';

// //     document.body.appendChild(tempDiv);

// //     await new Promise(resolve =>
// //       setTimeout(resolve, 100)
// //     );

// //     const canvas = await html2canvas(
// //       tempDiv,
// //       {
// //         scale: 2,
// //         useCORS: true,
// //         backgroundColor: null,
// //         width: 794,
// //         height: 1123,
// //       }
// //     );

// //     document.body.removeChild(tempDiv);

// //     const imgData =
// //       canvas.toDataURL("image/png");

// //     const doc =
// //       new jsPDF("p", "mm", "a4");

// //     /* ===============================
// //        DRAW HEADER
// //     =============================== */

// //     await drawHeader(
// //       doc,
// //       extractedOrgId
// //     );

// //     const pageWidth =
// //       doc.internal.pageSize.getWidth();

// //     const marginLeft = 10;

// //     const contentWidth =
// //       pageWidth - 20;

// //     const imgWidth =
// //       contentWidth;

// //     const imgHeight =
// //       (canvas.height * imgWidth) /
// //       canvas.width;

// //     const startY = 50;

// //     doc.addImage(
// //       imgData,
// //       "PNG",
// //       marginLeft,
// //       startY,
// //       imgWidth,
// //       imgHeight
// //     );

// //     /* ===============================
// //        ⭐ ADD FOOTER HERE (CRITICAL)
// //     =============================== */

// //     const totalPages =
// //       doc.getNumberOfPages();

// //    for (let i = 1; i <= totalPages; i++) {

// //   doc.setPage(i);

// //   drawFooter(
// //     doc,
// //     extractedOrgId,
// //     i,
// //     totalPages
// //   );

// // }

// //     /* ===============================
// //        SAVE OR PREVIEW
// //     =============================== */

// //     const filename =
// //       `${selectedTemplate.letter_type || "letter"}.pdf`;

// //     if (download) {

// //       doc.save(filename);

// //     } else {

// //       const pdfBlob =
// //         doc.output("blob");

// //       const url =
// //         URL.createObjectURL(pdfBlob);

// //       window.open(url, "_blank");

// //     }

// //     console.log(
// //       `[PDF Generation] PDF generated successfully`
// //     );

// //   } catch (error) {

// //     console.error(
// //       "PDF Generation Error:",
// //       error
// //     );

// //     alert(
// //       "Failed to generate PDF. Check console for details."
// //     );

// //   } finally {

// //     setGenerating(false);

// //   }

// // };
// //   const placeholderFields = useMemo(() => {
// //   if (!selectedTemplate?.content) return [];

// //   // Remove HTML tags first
// //   const textOnly = selectedTemplate.content.replace(/<[^>]*>/g, '');

// //   const regex = /\[([^\]]+)\]/g;
// //   const matches = [...textOnly.matchAll(regex)];

// //   const fields = matches.map(m =>
// //     m[1]
// //       .trim()
// //       .replace(/\s+/g, ' ')
// //   );

// //   return [...new Set(fields)];
// // }, [selectedTemplate]);

// //   if (loading) {
// //     return <div className="letterhead-no-template">Loading letter templates...</div>;
// //   }

// //   return (
// //     <div className="letterhead-main">
// //       <div className="letterhead-header">
// //         <h1>Letterhead Editor</h1>
// //         <p>Create and customize professional business letters</p>
// //       </div>

// //       <div className="letterhead-content-vertical">

// //   {/* SELECT LETTER TYPE */}
// //   <div className="letterhead-top-section">

// //     <h3>Select Letter Type</h3>

// //     <select 
// //       onChange={handleTemplateSelect}
// //       className="letterhead-template-select"
// //       defaultValue=""
// //     >
// //       <option value="">-- Select Letter Type --</option>

// //       {templates.map((t) => (
// //         <option key={t.id} value={t.id}>
// //           {t.letter_type}
// //         </option>
// //       ))}

// //     </select>

// //   </div>


// //   {/* DYNAMIC FIELDS */}
// //   {selectedTemplate && placeholderFields.length > 0 && (

// //     <div className="letterhead-fields-section">

// //       <h3>Fill Details</h3>

// //       <div className="letterhead-dynamic-form">

// //         {placeholderFields.map((field) => (

// //           <div key={field} className="letterhead-form-group">

// //             <label>{field}</label>

// //             <input
// //               type="text"
// //               value={formData[field] || ''}
// //               onChange={(e) =>
// //                 handleFieldChange(field, e.target.value)
// //               }
// //               placeholder={`Enter ${field}`}
// //             />

// //           </div>

// //         ))}

// //       </div>

// //     </div>

// //   )}


// //   {/* EDITOR */}
// //   {selectedTemplate ? (

// //     <div className="letterhead-editor-vertical">

// //       <div className="letterhead-editor-header">

// //         <h2>{selectedTemplate.letter_type}</h2>

// //         <div className="letterhead-action-buttons">

// //           <button 
// //             onClick={() => generatePDF(false)} 
// //             disabled={generating}
// //             className="letterhead-btn letterhead-btn-preview"
// //           >
// //             {generating ? 'Generating...' : 'Preview PDF'}
// //           </button>

// //           <button 
// //             onClick={() => generatePDF(true)} 
// //             disabled={generating}
// //             className="letterhead-btn letterhead-btn-download"
// //           >
// //             Download PDF
// //           </button>

// //         </div>

// //       </div>


// //       {/* QUILL */}
// //       <div className="letterhead-quill-wrapper">

// //         <ReactQuill
// //           value={quillContent}
// //           onChange={setQuillContent}
// //           modules={{
// //             toolbar: [
// //               [{ header: [1, 2, 3, false] }],
// //               ['bold', 'italic', 'underline'],
// //               [{ background: [] }],
// //               [{ align: [] }],
// //               [{ list: 'ordered' }, { list: 'bullet' }],
// //               ['clean']
// //             ]
// //           }}
// //         />

// //       </div>


// //       {/* LIVE PREVIEW */}
// //       <div className="letterhead-preview-section">

// //         <h3>Live Preview</h3>

// //         <div 
// //           className="letterhead-live-preview-box"
// //           dangerouslySetInnerHTML={{ __html: livePreviewHtml }}
// //         />

// //       </div>

// //     </div>

// //   ) : (

// //     <div className="letterhead-no-template">
// //       <h3>Select a letter type to begin</h3>
// //     </div>

// //   )}

// // </div>
// //     </div>
// //   );
// // };

// // export default LetterheadClient;
// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';
// import dynamic from 'next/dynamic';
// import axios from 'axios';
// import './letterhead.css';

// const ReactQuill = dynamic(
//   () => import('react-quill-new'),
//   { 
//     ssr: false, 
//     loading: () => <div className="letterhead-quill-loading">Loading editor...</div> 
//   }
// );

// import 'react-quill-new/dist/quill.snow.css';
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// import { drawHeader, drawFooter } from "./header";
// import { useAuth } from "../../context/AuthProvider.client";

// const LetterheadClient = () => {
//   const { user } = useAuth();
  
//   const extractedOrgId = 
//     user?.orgId ?? 
//     user?.org_id ?? 
//     user?.raw?.org_id ?? 
//     user?.Org_id ?? 
//     user?.raw?.Org_id ?? 
//     null;

//   // States
//   const [templates, setTemplates] = useState([]);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [quillContent, setQuillContent] = useState('');
//   const [formData, setFormData] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [generating, setGenerating] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [letterName, setLetterName] = useState('');

//   // Saved Letters
//   const [savedLetters, setSavedLetters] = useState([]);

//   // Debug log
//   useEffect(() => {
//     console.log("[LetterheadClient] Extracted orgId:", extractedOrgId);
//   }, [extractedOrgId]);

//   // Fetch Templates
//   useEffect(() => {
//     const fetchTemplates = async () => {
//       try {
//         const res = await axios.get(`${BACKEND_URL}/api/templates/list`, {
//           withCredentials: true,
//         });
//         setTemplates(res.data.data || []);
//       } catch (error) {
//         console.error("Failed to fetch templates:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchTemplates();
//   }, []);

//   // Fetch Saved Letters
//   const fetchSavedLetters = async () => {
//     if (!extractedOrgId) return;
//     try {
//       const res = await axios.get(`${BACKEND_URL}/api/letterheads/list`, {
//         withCredentials: true,
//         headers: { 'x-org-id': extractedOrgId }
//       });
//       setSavedLetters(res.data.data || []);
//     } catch (error) {
//       console.error("Failed to fetch saved letters:", error);
//     }
//   };

//   useEffect(() => {
//     fetchSavedLetters();
//   }, [extractedOrgId]);

//   // Handle Template Selection
//   const handleTemplateSelect = (e) => {
//     const id = e.target.value;
//     if (!id) {
//       setSelectedTemplate(null);
//       setQuillContent('');
//       setFormData({});
//       setLetterName('');
//       return;
//     }

//     const selected = templates.find(t => t.id === parseInt(id));
//     if (selected) {
//       setSelectedTemplate(selected);
//       setQuillContent(selected.content || '');

//       // Auto-detect placeholders
//       const regex = /\[([^\]]+)\]/g;
//       const matches = [...(selected.content || '').matchAll(regex)];
//       const initialData = {};
//       matches.forEach(match => {
//         initialData[match[1].trim()] = '';
//       });
//       setFormData(initialData);
//       setLetterName(selected.letter_type || 'New Letter');
//     }
//   };

//   const handleFieldChange = (key, value) => {
//     const cleanKey = key.trim().replace(/\s+/g, ' ');
//     setFormData(prev => ({
//       ...prev,
//       [cleanKey]: value
//     }));
//   };

//   // Replace Placeholders for Live Preview
//   const replacePlaceholders = (html, data) => {
//     if (!html) {
//       return '<p class="letterhead-no-content">Select a letter type to see preview</p>';
//     }

//     let cleanedHtml = html.replace(
//       /\[([^\]]+)\]/g,
//       (match) => match.replace(/<[^>]*>/g, '')
//     );

//     const normalizedData = {};
//     Object.keys(data).forEach((key) => {
//       const cleanKey = key.trim().replace(/\s+/g, ' ').toLowerCase();
//       normalizedData[cleanKey] = data[key];
//     });

//     cleanedHtml = cleanedHtml.replace(
//       /\[([^\]]+)\]/g,
//       (match, placeholder) => {
//         const cleanPlaceholder = placeholder.trim().replace(/\s+/g, ' ').toLowerCase();
//         const value = normalizedData[cleanPlaceholder];
//         return value && value.trim() !== '' 
//           ? value 
//           : `<span class="letterhead-placeholder-missing">${match}</span>`;
//       }
//     );

//     return cleanedHtml;
//   };

//   const livePreviewHtml = useMemo(() => {
//     return replacePlaceholders(quillContent, formData);
//   }, [quillContent, formData]);

//   // Save Letter
//   const handleSaveLetter = async () => {
//     if (!selectedTemplate || !extractedOrgId) {
//       alert("Please select a template first and make sure you are logged in.");
//       return;
//     }
//     if (!letterName.trim()) {
//       alert("Please enter a name for this letter");
//       return;
//     }

//     setSaving(true);

//     try {
//       const payload = {
//         letter_type: selectedTemplate.letter_type,
//         template_name: letterName.trim(),
//         body: livePreviewHtml,                    // Final rendered HTML
//         subject: formData.Subject || formData.subject || selectedTemplate.letter_type,
//         ...formData
//       };

//       await axios.post(`${BACKEND_URL}/api/letterheads/add`, payload, {
//         withCredentials: true,
//         headers: { 'x-org-id': extractedOrgId }
//       });

//       alert("Letter saved successfully!");
//       setLetterName('');
//       fetchSavedLetters(); // Refresh table
//     } catch (error) {
//       console.error("Save letter error:", error);
//       alert("Failed to save letter. Please check console.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Generate PDF Function
//   const generatePDF = async (download = false, savedLetter = null) => {
//     console.log(`[PDF Generation] Starting for ${savedLetter ? 'saved letter' : 'live preview'}`);

//     setGenerating(true);

//     try {
//       let contentHtml = savedLetter ? savedLetter.body : livePreviewHtml;

//       if (!contentHtml) {
//         alert("No content available for PDF generation");
//         return;
//       }

//       const tempDiv = document.createElement('div');
//       tempDiv.innerHTML = contentHtml;
//       tempDiv.style.width = '190mm';
//       tempDiv.style.minHeight = '277mm';
//       tempDiv.style.padding = '10mm';
//       tempDiv.style.fontFamily = 'Arial, sans-serif';
//       tempDiv.style.fontSize = '12px';
//       tempDiv.style.lineHeight = '1.5';
//       tempDiv.style.position = 'absolute';
//       tempDiv.style.left = '-9999px';
//       tempDiv.style.top = '-9999px';

//       document.body.appendChild(tempDiv);
//       await new Promise(resolve => setTimeout(resolve, 100));

//       const canvas = await html2canvas(tempDiv, {
//         scale: 2,
//         useCORS: true,
//         backgroundColor: '#ffffff',
//         width: 794,
//         height: 1123,
//       });

//       document.body.removeChild(tempDiv);

//       const imgData = canvas.toDataURL("image/png");
//       const doc = new jsPDF("p", "mm", "a4");

//       // Draw Header
//       if (extractedOrgId) {
//         await drawHeader(doc, extractedOrgId);
//       }

//       const pageWidth = doc.internal.pageSize.getWidth();
//       const marginLeft = 10;
//       const contentWidth = pageWidth - 20;
//       const imgWidth = contentWidth;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
//       const startY = 50;

//       doc.addImage(imgData, "PNG", marginLeft, startY, imgWidth, imgHeight);

//       // Draw Footer on all pages
//       const totalPages = doc.getNumberOfPages();
//       for (let i = 1; i <= totalPages; i++) {
//         doc.setPage(i);
//         drawFooter(doc, extractedOrgId, i, totalPages);
//       }

//       const filename = savedLetter 
//         ? `${savedLetter.template_name || 'letter'}.pdf`
//         : `${selectedTemplate?.letter_type || "letter"}.pdf`;

//       if (download) {
//         doc.save(filename);
//       } else {
//         const pdfBlob = doc.output("blob");
//         const url = URL.createObjectURL(pdfBlob);
//         window.open(url, "_blank");
//       }

//     } catch (error) {
//       console.error("PDF Generation Error:", error);
//       alert("Failed to generate PDF. Check console for details.");
//     } finally {
//       setGenerating(false);
//     }
//   };

//   // Extract Placeholder Fields
//   const placeholderFields = useMemo(() => {
//     if (!selectedTemplate?.content) return [];
//     const textOnly = selectedTemplate.content.replace(/<[^>]*>/g, '');
//     const regex = /\[([^\]]+)\]/g;
//     const matches = [...textOnly.matchAll(regex)];
//     return [...new Set(matches.map(m => m[1].trim().replace(/\s+/g, ' ')))];
//   }, [selectedTemplate]);

//   if (loading) {
//     return <div className="letterhead-no-template">Loading letter templates...</div>;
//   }

//   return (
//     <div className="letterhead-main">
//       <div className="letterhead-header">
//         <h1>Letterhead Editor</h1>
//         <p>Create and customize professional business letters</p>
//       </div>

//       <div className="letterhead-content-vertical">

//         {/* Select Letter Type */}
//         <div className="letterhead-top-section">
//           <h3>Select Letter Type</h3>
//           <select 
//             onChange={handleTemplateSelect}
//             className="letterhead-template-select"
//             defaultValue=""
//           >
//             <option value="">-- Select Letter Type --</option>
//             {templates.map((t) => (
//               <option key={t.id} value={t.id}>
//                 {t.letter_type}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Dynamic Form Fields */}
//         {selectedTemplate && placeholderFields.length > 0 && (
//           <div className="letterhead-fields-section">
//             <h3>Fill Details</h3>
//             <div className="letterhead-dynamic-form">
//               {placeholderFields.map((field) => (
//                 <div key={field} className="letterhead-form-group">
//                   <label>{field}</label>
//                   <input
//                     type="text"
//                     value={formData[field] || ''}
//                     onChange={(e) => handleFieldChange(field, e.target.value)}
//                     placeholder={`Enter ${field}`}
//                   />
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Editor Section */}
//         {selectedTemplate ? (
//           <div className="letterhead-editor-vertical">
//             <div className="letterhead-editor-header">
//               <h2>{selectedTemplate.letter_type}</h2>
//               <div className="letterhead-action-buttons">
//                 <input
//                   type="text"
//                   placeholder="Enter Letter Name (e.g. Offer Letter - John)"
//                   value={letterName}
//                   onChange={(e) => setLetterName(e.target.value)}
//                   className="letterhead-save-input"
//                 />
//                 <button 
//                   onClick={handleSaveLetter}
//                   disabled={saving || !letterName.trim()}
//                   className="letterhead-btn letterhead-btn-save"
//                 >
//                   {saving ? 'Saving...' : 'Save Letter'}
//                 </button>
//                 <button 
//                   onClick={() => generatePDF(false)}
//                   disabled={generating}
//                   className="letterhead-btn letterhead-btn-preview"
//                 >
//                   {generating ? 'Generating...' : 'Preview PDF'}
//                 </button>
//                 <button 
//                   onClick={() => generatePDF(true)}
//                   disabled={generating}
//                   className="letterhead-btn letterhead-btn-download"
//                 >
//                   Download PDF
//                 </button>
//               </div>
//             </div>

//             {/* Quill Editor */}
//             <div className="letterhead-quill-wrapper">
//               <ReactQuill
//                 value={quillContent}
//                 onChange={setQuillContent}
//                 modules={{
//                   toolbar: [
//                     [{ header: [1, 2, 3, false] }],
//                     ['bold', 'italic', 'underline'],
//                     [{ background: [] }],
//                     [{ align: [] }],
//                     [{ list: 'ordered' }, { list: 'bullet' }],
//                     ['clean']
//                   ]
//                 }}
//               />
//             </div>

//             {/* Live Preview */}
//             <div className="letterhead-preview-section">
//               <h3>Live Preview</h3>
//               <div 
//                 className="letterhead-live-preview-box"
//                 dangerouslySetInnerHTML={{ __html: livePreviewHtml }}
//               />
//             </div>
//           </div>
//         ) : (
//           <div className="letterhead-no-template">
//             <h3>Select a letter type to begin</h3>
//           </div>
//         )}

//         {/* Saved Letters Table */}
//         <div className="letterhead-saved-section">
//           <h3>Saved Letters ({savedLetters.length})</h3>
          
//           {savedLetters.length === 0 ? (
//             <div className="letterhead-no-saved">
//               No letters saved yet. Create and save your first letter!
//             </div>
//           ) : (
//             <table className="letterhead-saved-table">
//               <thead>
//                 <tr>
//                   <th>Letter Name</th>
//                   <th>Type</th>
//                   <th>Saved On</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {savedLetters.map((letter) => (
//                   <tr key={letter.id}>
//                     <td>{letter.template_name}</td>
//                     <td>{letter.letter_type}</td>
//                     <td>
//                       {new Date(letter.created_at || letter.updated_at).toLocaleDateString('en-IN')}
//                     </td>
//                     <td className="letterhead-table-actions">
//                       <button 
//                         onClick={() => generatePDF(false, letter)}
//                         className="letterhead-table-btn letterhead-table-btn-preview"
//                       >
//                         Preview
//                       </button>
//                       <button 
//                         onClick={() => generatePDF(true, letter)}
//                         className="letterhead-table-btn letterhead-table-btn-download"
//                       >
//                         Download
//                       </button>
//                       <button 
//                         onClick={() => alert('Edit feature coming soon!')}
//                         className="letterhead-table-btn"
//                         style={{ backgroundColor: '#8b5cf6', color: 'white' }}
//                       >
//                         Edit
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>

//       </div>
//     </div>
//   );
// };

// export default LetterheadClient;
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

import { drawHeader, drawFooter } from "./header";
import { useAuth } from "../../context/AuthProvider.client";

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

  const handleFieldChange = (key, value) => {
    const cleanKey = key.trim().replace(/\s+/g, ' ');
    setFormData(prev => ({ ...prev, [cleanKey]: value }));
  };

  // Replace Placeholders
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
      const value = normalizedData[cleanPlaceholder];
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
  const handleEditLetter = (letter) => {
    // Find matching template
    const template = templates.find(t => t.letter_type === letter.letter_type);
    
    if (!template) {
      alert("Template for this letter not found. Please create a new one.");
      return;
    }

    setSelectedTemplate(template);
    setQuillContent(template.content || letter.body || '');
    setLetterName(letter.template_name || '');
    setEditingId(letter.id);
    setIsEditing(true);

    // Extract placeholders and fill formData from saved body (simple approach)
    const regex = /\[([^\]]+)\]/g;
    const matches = [...(template.content || '').matchAll(regex)];
    const initialData = {};
    
    matches.forEach(match => {
      const fieldName = match[1].trim();
      initialData[fieldName] = ''; // Will be filled better if you store field values separately
    });

    // Try to restore values from saved body (basic)
    setFormData(initialData);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save or Update Letter
  const handleSaveOrUpdate = async () => {
    if (!selectedTemplate || !extractedOrgId) {
      alert("Please select a template and ensure you are logged in.");
      return;
    }
    if (!letterName.trim()) {
      alert("Please enter a letter name");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        letter_type: selectedTemplate.letter_type,
        template_name: letterName.trim(),
        body: livePreviewHtml,
        subject: formData.Subject || formData.subject || '',
        ...formData
      };

      let res;
      if (isEditing && editingId) {
        // Update existing letter
        res = await axios.put(`${BACKEND_URL}/api/letterheads/update/${editingId}`, payload, {
          withCredentials: true,
          headers: { 'x-org-id': extractedOrgId }
        });
        alert("Letter updated successfully!");
      } else {
        // Create new letter
        res = await axios.post(`${BACKEND_URL}/api/letterheads/add`, payload, {
          withCredentials: true,
          headers: { 'x-org-id': extractedOrgId }
        });
        alert("Letter saved successfully!");
      }

      resetForm();
      fetchSavedLetters();
    } catch (error) {
      console.error("Save/Update error:", error);
      alert("Failed to save letter. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Generate PDF
  const generatePDF = async (download = false, savedLetter = null) => {
    setGenerating(true);
    try {
      let contentHtml = savedLetter ? savedLetter.body : livePreviewHtml;
      if (!contentHtml) {
        alert("No content available");
        return;
      }

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentHtml;
      tempDiv.style.width = '190mm';
      tempDiv.style.minHeight = '277mm';
      tempDiv.style.padding = '10mm';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.5';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';

      document.body.appendChild(tempDiv);
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF("p", "mm", "a4");

      if (extractedOrgId) await drawHeader(doc, extractedOrgId);

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginLeft = 10;
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      doc.addImage(imgData, "PNG", marginLeft, 50, imgWidth, imgHeight);

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(doc, extractedOrgId, i, totalPages);
      }

      const filename = savedLetter 
        ? `${savedLetter.template_name}.pdf` 
        : `${letterName || selectedTemplate?.letter_type || "letter"}.pdf`;

      if (download) {
        doc.save(filename);
      } else {
        const pdfBlob = doc.output("blob");
        window.open(URL.createObjectURL(pdfBlob), "_blank");
      }
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  const placeholderFields = useMemo(() => {
    if (!selectedTemplate?.content) return [];
    const textOnly = selectedTemplate.content.replace(/<[^>]*>/g, '');
    const regex = /\[([^\]]+)\]/g;
    const matches = [...textOnly.matchAll(regex)];
    return [...new Set(matches.map(m => m[1].trim().replace(/\s+/g, ' ')))];
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
              {placeholderFields.map(field => (
                <div key={field} className="letterhead-form-group">
                  <label>{field}</label>
                  <input
                    type="text"
                    value={formData[field] || ''}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    placeholder={`Enter ${field}`}
                  />
                </div>
              ))}
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
                className="letterhead-live-preview-box"
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
                        style={{ backgroundColor: '#8b5cf6', color: 'white' }}
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
    </div>
  );
};

export default LetterheadClient;