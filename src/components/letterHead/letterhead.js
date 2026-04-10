import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import generatePDF from './generatepdfforletters';
import './letterhead.css';
import { letterFields } from "./../../utils/letterFeilds"
import Modal from "../Modal/Modal";

const LetterHead = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [letterType, setLetterType] = useState('Letter');
  const [letterheads, setLetterheads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsPopup, setShowDetailsPopup] = useState(null);
  const contentRef = useRef(null);
  const letterRef = useRef(null);

  const originalLogo = '/images/OriginalLogo.png';
  const API_KEY = process.env.REACT_APP_API_KEY;
  const meId = JSON.parse(localStorage.getItem("dashboardData") || "{}").employeeId;
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

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };
  const [formData, setFormData] = useState({
    letterhead_code: '',
    template_name: '',
    letter_type: 'Letter',
    subject: '',
    body: '',
    recipient_name: '',
    title: '',
    mobile_number: '',
    email: '',
    address: '',
    date: '',
    signature: '',
    employee_name: '',
    position: '',
    annual_salary: '',
    effective_date: '',
    date_of_appointment: '',
    company_name: '',
    company_address: '',
    company_address_line2: '',
    gstin_number: '',
    cin_number: '',
    place: '',
  });

  const fallbackTemplate = `
    <h1 style="font-weight: bold;">General Letter</h1>
    <p>Dear [Recipient Name],</p>
    <h2 style="font-weight: bold;">Introduction</h2>
    <p>This is a general letter template. Please edit the content as needed to suit your requirements.</p>
    <h2 style="font-weight: bold;">Conclusion</h2>
    <p>Thank you.</p>
    <p>Regards,</p>
  `;

  const bankDetailsTemplate = `
    <h1 style="font-weight: bold;">Bank Details Letter</h1>
    <p>[Place], [Date]</p>
    <p>Dear [Title] [Recipient Name],</p>
    <h2 style="font-weight: bold;">Introduction</h2>
    <p>We are pleased to provide the bank details for [Recipient Name], who joined our organization on [Date of Appointment].</p>
    <h2 style="font-weight: bold;">Bank Details</h2>
    <p>Please update the following details in your records.</p>
    <p>Regards,</p>
  `;

  const bankDetailsRequestTemplate = `
    <h1 style="font-weight: bold;">Bank Details Request Letter</h1>
    <p>[Place], [Date]</p>
    <p>Dear [Title] [Recipient Name],</p>
    <h2 style="font-weight: bold;">Introduction</h2>
    <p>We kindly request [Recipient Name] to provide their bank details for our records, effective from [Date of Appointment].</p>
    <h2 style="font-weight: bold;">Details Required</h2>
    <p>Please submit the required bank details at your earliest convenience.</p>
    <p>Regards,</p>
  `;

  const parseTemplateToHTML = (content) => {
    if (!content || typeof content !== 'string') return fallbackTemplate;
    if (content.includes('<h1') || content.includes('<h2') || content.includes('<p')) {
      return content;
    }
    const lines = content.split('\n').filter(line => line.trim());
    let htmlContent = '';
    lines.forEach(line => {
      if (line.startsWith('# ')) {
        htmlContent += `<h1 style="font-weight: bold;">${line.slice(2).trim()}</h1>`;
      } else if (line.startsWith('## ')) {
        htmlContent += `<h2 style="font-weight: bold;">${line.slice(3).trim()}</h2>`;
      } else {
        htmlContent += `<p>${line.trim()}</p>`;
      }
    });
    return htmlContent || fallbackTemplate;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [templatesResponse, letterheadsResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/templates/list`, { headers }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/letterheads/list`, { headers }),
        ]);
        setTemplates(templatesResponse.data.data || []);
        setLetterheads(letterheadsResponse.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        showAlert('Failed to fetch data: ' + (error.response?.data?.error || error.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDateToDDMMMYYYY = (dateString) => {
    if (!dateString) return '[Date]';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).replace(/ /g, '-');
  };

  const handleDownload = async (filename) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/letterheads/download/${filename}`,
        { headers, responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('File downloaded successfully:', filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      showAlert(error.response?.data?.message || 'Failed to download file');
    }
  };

  const handleEdit = (letterhead) => {
    setIsEditing(true);
    setEditingId(letterhead.id);
    setLetterType(letterhead.letter_type);
    const templateContent = letterhead.letter_type === 'Bank Details' ? bankDetailsTemplate : 
                           letterhead.letter_type === 'Bank Details Request Letter' ? bankDetailsRequestTemplate : 
                           fallbackTemplate;
    const body = letterhead.body || (templates.find((t) => t.letter_type === letterhead.letter_type)?.content || templateContent);
    setFormData({
      letterhead_code: letterhead.letterhead_code || '',
      template_name: letterhead.template_name || '',
      letter_type: letterhead.letter_type || 'Letter',
      subject: letterhead.subject || '',
      body: parseTemplateToHTML(body),
      recipient_name: letterhead.recipient_name || '',
      title: letterhead.title || '',
      mobile_number: letterhead.mobile_number || '',
      email: letterhead.email || '',
      address: letterhead.address || '',
      date: letterhead.date ? letterhead.date.split('T')[0] : '',
      signature: letterhead.signature || '',
      employee_name: letterhead.employee_name || '',
      position: letterhead.position || '',
      annual_salary: letterhead.annual_salary || '',
      effective_date: letterhead.effective_date ? letterhead.effective_date.split('T')[0] : '',
      date_of_appointment: letterhead.date_of_appointment ? letterhead.date_of_appointment.split('T')[0] : '',
      company_name: letterhead.company_name || '',
      company_address: letterhead.company_address || '',
      company_address_line2: letterhead.company_address_line2 || '',
      gstin_number: letterhead.gstin_number || '',
      cin_number: letterhead.cin_number || '',
      place: letterhead.place || '',
    });
    if (contentRef.current) {
      let content = parseTemplateToHTML(body);
      content = content
        .replace('[Recipient Name]', letterhead.recipient_name || '[Recipient Name]')
        .replace('[Title]', letterhead.title || '[Title]')
        .replace('[Mobile Number]', letterhead.mobile_number || '[Mobile Number]')
        .replace('[Email]', letterhead.email || '[Email]')
        .replace(/\[Employee Name\]/g, letterhead.employee_name || '[Employee Name]')
        .replace(/\[Position\]/g, letterhead.position || '[Position]')
        .replace(/\[Date\]/g, letterhead.date ? formatDateToDDMMMYYYY(letterhead.date) : '[Date]')
        .replace('[Date of Appointment]', letterhead.date_of_appointment ? formatDateToDDMMMYYYY(letterhead.date_of_appointment) : '[Date of Appointment]')
        .replace('[Annual Salary]', letterhead.annual_salary || '[Annual Salary]')
        .replace('[Company Name]', letterhead.company_name || '[Company Name]')
        .replace('[Place]', letterhead.place || '[Place]');
      contentRef.current.innerHTML = content;
    }
    setShowPopup(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!letterRef.current || !contentRef.current) {
      showAlert('Form is not ready. Please try again.');
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
    const body = contentRef.current.innerHTML;

    if (!letter_type || letter_type.trim() === '') {
      showAlert('Letter type is required');
      return;
    }
    if (!subject || subject.trim() === '') {
      showAlert('Subject is required');
      return;
    }
    if (!body || body.trim() === '') {
      showAlert('Letter body is required');
      return;
    }
    if (letter_type === 'Offer Letter') {
      if (!title || title.trim() === '') {
        showAlert('Title (Mr/Miss/Mrs) is required for Offer Letter');
        return;
      }
      if (!recipient_name || recipient_name.trim() === '') {
        showAlert('Recipient name is required for Offer Letter');
        return;
      }
      if (!position || position.trim() === '') {
        showAlert('Position is required for Offer Letter');
        return;
      }
      if (!annual_salary || annual_salary.trim() === '') {
        showAlert('Annual salary is required for Offer Letter');
        return;
      }
      if (!date_of_appointment || date_of_appointment.trim() === '') {
        showAlert('Date of appointment is required for Offer Letter');
        return;
      }
    }
    if (['Bank Details', 'Bank Details Request Letter'].includes(letter_type)) {
      if (!title || title.trim() === '') {
        showAlert('Title (Mr/Mrs) is required for ' + letter_type);
        return;
      }
      if (!recipient_name || recipient_name.trim() === '') {
        showAlert('Recipient name is required for ' + letter_type);
        return;
      }
      if (!date || date.trim() === '') {
        showAlert('Date is required for ' + letter_type);
        return;
      }
      
      if (!date_of_appointment || date_of_appointment.trim() === '') {
        showAlert('Date of joining is required for ' + letter_type);
        return;
      }
    }

    let pdfFile;
    try {
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
      pdfFile = new File([pdfBlob], `letterhead-${Date.now()}.pdf`, { type: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlert(`Failed to generate PDF: ${error.message}`);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('letterhead_code', letterhead_code || '');
    formDataToSend.append('template_name', template_name);
    formDataToSend.append('letter_type', letter_type);
    formDataToSend.append('subject', subject);
    formDataToSend.append('body', body);
    formDataToSend.append('recipient_name', recipient_name || '');
    formDataToSend.append('title', title || '');
    formDataToSend.append('mobile_number', mobile_number || '');
    formDataToSend.append('email', email || '');
    formDataToSend.append('address', address || '');
    formDataToSend.append('date', date ? new Date(date).toISOString().split('T')[0] : '');
    formDataToSend.append('signature', signature || '');
    formDataToSend.append('employee_name', letter_type === 'Relieving Letter' ? employee_name : '');
    formDataToSend.append('position', ['Relieving Letter', 'Offer Letter', 'Bank Details Request Letter'].includes(letter_type) ? position : '');
    formDataToSend.append('annual_salary', letter_type === 'Offer Letter' ? annual_salary : '');
    formDataToSend.append('effective_date', effective_date ? new Date(effective_date).toISOString().split('T')[0] : '');
    formDataToSend.append('date_of_appointment', date_of_appointment ? new Date(date_of_appointment).toISOString().split('T')[0] : '');
    formDataToSend.append('company_name', company_name || '');
    formDataToSend.append('company_address', company_address || '');
    formDataToSend.append('company_address_line2', company_address_line2 || '');
    formDataToSend.append('gstin_number', gstin_number || '');
    formDataToSend.append('cin_number', cin_number || '');
    formDataToSend.append('place', ['Bank Details', 'Bank Details Request Letter'].includes(letter_type) ? place : '');
    formDataToSend.append('letterhead_file', pdfFile);

    try {
      let response;
      if (isEditing) {
        response = await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/letterheads/update/${editingId}`,
          formDataToSend,
          { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
        );
        showAlert('Letterhead updated successfully!');
        setIsEditing(false);
        setEditingId(null);
      } else {
        response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/letterheads/add`,
          formDataToSend,
          { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
        );
        showAlert('Letterhead saved successfully!');
      }
      const updatedResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/letterheads/list`, { headers });
      setLetterheads(updatedResponse.data.data || []);
      setShowPopup(false);
      setFormData({
        letterhead_code: '',
        template_name: '',
        letter_type: 'Letter',
        subject: '',
        body: '',
        recipient_name: '',
        title: '',
        mobile_number: '',
        email: '',
        address: '',
        date: '',
        signature: '',
        employee_name: '',
        position: '',
        annual_salary: '',
        effective_date: '',
        date_of_appointment: '',
        company_name: '',
        company_address: '',
        company_address_line2: '',
        gstin_number: '',
        cin_number: '',
        place: '',
      });
      setLetterType('Letter');
      if (contentRef.current) {
        contentRef.current.innerHTML = parseTemplateToHTML(fallbackTemplate);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      console.error('Error:', isEditing ? 'updating' : 'saving', 'letterhead:', error);
      showAlert(`Failed to ${isEditing ? 'update' : 'save'} letterhead: ${errorMessage}`);
    }
  };

  const handleLetterTypeChange = (e) => {
    const selectedType = e.target.value;
    setLetterType(selectedType);
    setFormData((prev) => ({
      ...prev,
      letter_type: selectedType,
      subject: '',
      body: '',
      recipient_name: '',
      title: '',
      mobile_number: '',
      email: '',
      address: '',
      date: '',
      signature: '',
      employee_name: '',
      position: '',
      annual_salary: '',
      effective_date: '',
      date_of_appointment: '',
      company_name: '',
      company_address: '',
      company_address_line2: '',
      gstin_number: '',
      cin_number: '',
      place: '',
    }));

    const selectedTemplate = templates.find((template) => template.letter_type === selectedType);
    const templateContent = selectedType === 'Bank Details' ? bankDetailsTemplate : 
                           selectedType === 'Bank Details Request Letter' ? bankDetailsRequestTemplate : 
                           fallbackTemplate;
    if (selectedTemplate && contentRef.current) {
      const content = parseTemplateToHTML(selectedTemplate.content || templateContent);
      setFormData((prev) => ({
        ...prev,
        letter_type: selectedType,
        subject: selectedTemplate.subject || '',
        body: content,
        company_name: selectedTemplate.company_name || '',
        company_address: selectedTemplate.company_address || '',
        company_address_line2: selectedTemplate.company_address_line2 || '',
        gstin_number: selectedTemplate.gstin_number || '',
        cin_number: selectedTemplate.cin_number || '',
      }));
      contentRef.current.innerHTML = content;
    } else if (contentRef.current) {
      const content = parseTemplateToHTML(templateContent);
      contentRef.current.innerHTML = content;
      setFormData((prev) => ({
        ...prev,
        letter_type: selectedType,
        subject: selectedType === 'Letter' ? '' : selectedType,
        body: content,
      }));
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
    setFormData(prev => ({
      ...prev,
      body: contentRef.current?.innerHTML || '',
    }));
  };

  const handleGenerate = async () => {
    if (!letterRef.current || !contentRef.current) {
      showAlert('Form is not ready. Please try again.');
      return;
    }
    try {
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
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlert(`Failed to generate PDF: ${error.message}`);
    }
  };
const handleViewDetails = (letterhead, type) => {
  setShowDetailsPopup({ letterhead, type });
};

const handleCloseDetailsPopup = () => {
  setShowDetailsPopup(null);
};
  const handlePreview = async () => {
    if (!letterRef.current || !contentRef.current) {
      showAlert('Form is not ready. Please try again.');
      return;
    }
    try {
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
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      showAlert(`Failed to generate PDF preview: ${error.message}`);
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
      letterhead_code: '',
      template_name: '',
      letter_type: 'Letter',
      subject: '',
      body: '',
      recipient_name: '',
      title: '',
      mobile_number: '',
      email: '',
      address: '',
      date: '',
      signature: '',
      employee_name: '',
      position: '',
      annual_salary: '',
      effective_date: '',
      date_of_appointment: '',
      company_name: '',
      company_address: '',
      company_address_line2: '',
      gstin_number: '',
      cin_number: '',
      place: '',
    });
    setLetterType('Letter');
    if (contentRef.current) {
      contentRef.current.innerHTML = parseTemplateToHTML(fallbackTemplate);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const newParagraph = document.createElement('p');
      newParagraph.innerHTML = '<br>';
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

  const [originalTemplate, setOriginalTemplate] = useState('');

  useEffect(() => {
    const html = parseTemplateToHTML(
      formData.body || 
      (letterType === 'Bank Details' ? bankDetailsTemplate : 
       letterType === 'Bank Details Request Letter' ? bankDetailsRequestTemplate : 
       fallbackTemplate)
    );
    setOriginalTemplate(html);
    if (contentRef.current && showPopup) {
      contentRef.current.innerHTML = html;
      setFormData((prev) => ({
        ...prev,
        body: html,
      }));
      // Update content with formData values
      ['title', 'recipient_name', 'position', 'date_of_appointment', 'employee_name', 'date', 'mobile_number', 'email', 'annual_salary', 'place'].forEach(field => {
        if (formData[field]) {
          updateContentWithFormData(field, formData[field]);
        }
      });
    }
  }, [letterType, showPopup]);

  const updateContentWithFormData = (field, value) => {
    if (!originalTemplate || !contentRef.current) return;

    const replacements = {
      title: ['[Title]', formData.title || '[Title]'],
      recipient_name: ['[Recipient Name]', formData.recipient_name || '[Recipient Name]'],
      position: ['[Position]', formData.position || '[Position]'],
      date_of_appointment: [
        '[Date of Appointment]',
        formData.date_of_appointment ? formatDateToDDMMMYYYY(formData.date_of_appointment) : '[Date of Appointment]',
      ],
      employee_name: ['[Employee Name]', formData.employee_name || '[Employee Name]'],
      employee_id: ['[Employee ID]', formData.employee_id || '[Employee ID]'],
      date_of_birth: [
        '[Date of Birth]',
        formData.date_of_birth ? formatDateToDDMMMYYYY(formData.date_of_birth) : '[Date of Birth]',
      ],
      contact_number: ['[Contact Number]', formData.contact_number || '[Contact Number]'],
      residential_address: ['[Residential Address]', formData.residential_address || '[Residential Address]'],
      date: ['[Date]', formData.date ? formatDateToDDMMMYYYY(formData.date) : '[Date]'],
      signature: ['[Signature]', formData.signature || '[Signature]'],
      mobile_number: ['[Mobile Number]', formData.mobile_number || '[Mobile Number]'],
      email: ['[Email]', formData.email || '[Email]'],
      annual_salary: ['[Annual Salary]', formData.annual_salary || '[Annual Salary]'],
      place: ['[Place]', formData.place || '[Place]'],
    };

    if (!replacements[field]) {
      console.warn(`Field ${field} not found in replacements object`);
      return;
    }

    replacements[field][1] = value;

    let updatedContent = originalTemplate;

    Object.values(replacements).forEach(([placeholder, replacement]) => {
      const regex = new RegExp(placeholder.replace(/\[|\]/g, '\\$&'), 'g');
      updatedContent = updatedContent.replace(regex, replacement);
    });

    contentRef.current.innerHTML = updatedContent;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
      body: updatedContent,
    }));
  };

  const renderField = (field) => {
    if (field.type === 'select') {
      return (
        <div className="letterhead-form-row" key={field.id}>
          <div className="letterhead-form-group">
            <label htmlFor={field.id}>{field.label}</label>
            <div className="letterhead-input-container">
              <select
                id={field.id}
                value={formData[field.name]}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, [field.name]: e.target.value }));
                  if (field.updateContent) {
                    updateContentWithFormData(field.name, e.target.value);
                  }
                }}
                className="letterhead-input-field"
              >
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
              value={formData[field.name]}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, [field.name]: e.target.value }));
                if (field.updateContent) {
                  updateContentWithFormData(field.name, e.target.value);
                }
              }}
              className="letterhead-input-field"
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="letterhead-letterhead-container">
      <div class="letterhead-button-wrapper">
      <button onClick={() => setShowPopup(true)} className="letterhead-open-popup-btn">
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
            <td>{letterhead.letterhead_code || '-'}</td>
            <td>{letterhead.letter_type || '-'}</td>
            <td>
              {letterhead.letter_type === 'Relieving Letter' ? (
                <i
                  className="fa fa-eye"
                  style={{ cursor: 'pointer', color: '#7FBD2C' }}
                  onClick={() => handleViewDetails(letterhead, 'Relieving Letter')}
                  aria-label="View relieving letter details"
                ></i>
              ) : '-'}
            </td>
            <td>
              {letterhead.letter_type === 'Letter' ? (
                <i
                  className="fa fa-eye"
                  style={{ cursor: 'pointer', color: '#7FBD2C' }}
                  onClick={() => handleViewDetails(letterhead, 'General Letter')}
                  aria-label="View general letter details"
                ></i>
              ) : '-'}
            </td>
            <td>
              {letterhead.letter_type === 'Bank Details Request Letter' ? (
                <i
                  className="fa fa-eye"
                  style={{ cursor: 'pointer', color: '#7FBD2C' }}
                  onClick={() => handleViewDetails(letterhead, 'Bank Details Request Letter')}
                  aria-label="View bank details request letter"
                ></i>
              ) : '-'}
            </td>
            <td>
              {letterhead.letter_type === 'Offer Letter' ? (
                <i
                  className="fa fa-eye"
                  style={{ cursor: 'pointer', color: '#7FBD2C' }}
                  onClick={() => handleViewDetails(letterhead, 'Offer Letter')}
                  aria-label="View offer letter details"
                ></i>
              ) : '-'}
            </td>
            <td>
              {letterhead.attachment ? (
                <span
                  onClick={() => handleDownload(letterhead.attachment)}
                  style={{ cursor: 'pointer', color: '#7FBD2C', textDecoration: 'underline' }}
                >
                  Download
                </span>
              ) : '-'}
            </td>
            <td>
              <i
                className="fa fa-pencil"
                style={{ cursor: 'pointer', color: '#7FBD2C' }}
                onClick={() => handleEdit(letterhead)}
                aria-label="Edit letterhead"
              ></i>
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
    <div className="letterhead-popup-content" style={{ maxWidth: '500px', padding: '20px' }}>
      <h3>{showDetailsPopup.type} Details</h3>
      {showDetailsPopup.type === 'Relieving Letter' && (
        <div>
          <p><strong>Employee Name:</strong> {showDetailsPopup.letterhead.employee_name || '-'}</p>
          <p><strong>Position:</strong> {showDetailsPopup.letterhead.position || '-'}</p>
          <p><strong>Effective Date:</strong> {showDetailsPopup.letterhead.effective_date ? showDetailsPopup.letterhead.effective_date.split('T')[0] : '-'}</p>
        </div>
      )}
      {showDetailsPopup.type === 'General Letter' && (
        <div>
          <p><strong>Subject:</strong> {showDetailsPopup.letterhead.subject || '-'}</p>
          <p><strong>Recipient Name:</strong> {showDetailsPopup.letterhead.recipient_name || '-'}</p>
          <p><strong>Body Preview:</strong> {showDetailsPopup.letterhead.body ? showDetailsPopup.letterhead.body.substring(0, 100) + (showDetailsPopup.letterhead.body.length > 100 ? '...' : '') : '-'}</p>
        </div>
      )}
      {showDetailsPopup.type === 'Bank Details Request Letter' && (
        <div>
          <p><strong>Recipient Name:</strong> {showDetailsPopup.letterhead.recipient_name || '-'}</p>
          <p><strong>Title:</strong> {showDetailsPopup.letterhead.title || '-'}</p>
          <p><strong>Date:</strong> {showDetailsPopup.letterhead.date ? showDetailsPopup.letterhead.date.split('T')[0] : '-'}</p>
          <p><strong>Place:</strong> {showDetailsPopup.letterhead.place || '-'}</p>
          <p><strong>Date of Joining:</strong> {showDetailsPopup.letterhead.date_of_appointment ? showDetailsPopup.letterhead.date_of_appointment.split('T')[0] : '-'}</p>
          <p><strong>Position:</strong> {showDetailsPopup.letterhead.position || '-'}</p>
        </div>
      )}
      {showDetailsPopup.type === 'Offer Letter' && (
        <div>
          <p><strong>Recipient Name:</strong> {showDetailsPopup.letterhead.recipient_name || '-'}</p>
          <p><strong>Title:</strong> {showDetailsPopup.letterhead.title || '-'}</p>
          <p><strong>Mobile Number:</strong> {showDetailsPopup.letterhead.mobile_number || '-'}</p>
          <p><strong>Email:</strong> {showDetailsPopup.letterhead.email || '-'}</p>
          <p><strong>Position:</strong> {showDetailsPopup.letterhead.position || '-'}</p>
          <p><strong>Annual Salary:</strong> {showDetailsPopup.letterhead.annual_salary || '-'}</p>
          <p><strong>Date of Appointment:</strong> {showDetailsPopup.letterhead.date_of_appointment ? showDetailsPopup.letterhead.date_of_appointment.split('T')[0] : '-'}</p>
        </div>
      )}
      <button onClick={handleCloseDetailsPopup} className="letterhead-close-btn">
        Close
      </button>
    </div>
  </div>
)}
      {showPopup && (
        <div className="letterhead-popup-overlay">
          <div className="letterhead-popup-content" ref={letterRef}>
            <div className="letterhead-letterhead-header">
              <img src={originalLogo} alt="Company Logo" className="letterhead-watermark" />
              <h2 className="letterhead-letterhead-title">{formData.company_name || '[Company Name]'}</h2>
              <p className="letterhead-letterhead-subtitle">
                {formData.company_address_line2 || '[Company Address Line 2]'} | 
                GSTIN: {formData.gstin_number || '[GSTIN Number]'} | 
                CIN: {formData.cin_number || '[CIN Number]'}
              </p>
              <hr />
            </div>

            <div className="letterhead-letter-form">
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
                      {templates.map((template) => (
                        <option key={template.letter_type} value={template.letter_type}>
                          {template.letter_type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {letterFields[letterType]?.map((field) => renderField(field))}

              <div className="letterhead-form-row">
                <div className="letterhead-form-group">
                  <label htmlFor="content">Content</label>
                  <div className="letterhead-input-container">
                    <div className="letterhead-formatting-buttons">
                      <button
                        onClick={() => applyFormat('bold')}
                        className="letterhead-format-btn"
                        aria-label="Bold text"
                      >
                        B
                      </button>
                      <button
                        onClick={() => applyFormat('underline')}
                        className="letterhead-format-btn"
                        aria-label="Underline text"
                      >
                        U
                      </button>
                      <button
                        onClick={() => applyFormat('italic')}
                        className="letterhead-format-btn"
                        aria-label="Italic text"
                      >
                        I
                      </button>
                      <button
                        onClick={() => applyFormat('hiliteColor', '#ffff00')}
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
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="letterhead-popup-actions">
              <button onClick={handleCancel} className="letterhead-cancel-btn">
                Cancel
              </button>
              <button onClick={handlePreview} className="letterhead-preview-btn">
                Preview
              </button>
              <button onClick={handleGenerate} className="letterhead-save-btn">
                Generate PDF
              </button>
              <button onClick={handleSave} className="letterhead-save-btn">
                {isEditing ? 'Update' : 'Save'}
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
                style={{ width: '100%', height: '80vh', border: 'none' }}
              />
            ) : (
              <p>Loading PDF preview...</p>
            )}
            <button onClick={handleClosePreview} className="letterhead-close-btn">
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