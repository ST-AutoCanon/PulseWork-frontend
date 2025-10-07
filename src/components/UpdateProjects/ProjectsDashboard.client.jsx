"use client";

import React, { useState, useEffect, useRef } from "react";
import "./ProjectsDashboard.css";
import ProjectForm from "./ProjectForm.client";
import InvoiceTemplate from "./InvoiceTemplate.client";
import DownloadForm from "./DownloadForm.client";
import Invoice from "./Invoice.client";
import { MdUpdate } from "react-icons/md";
import { FiDownload, FiEye } from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DownloadDetailsList from "./DownloadDetailsList.client";
import { useAuth } from "../../context/AuthProvider.client"; // adjust path if needed

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-GB", options);
};

const getInvoiceTypeKey = (type) => {
  switch (type) {
    case "Tax Invoice":
      return "tax";
    case "Proforma Invoice":
      return "proforma";
    case "Quotation":
      return "quotation";
    default:
      return "tax";
  }
};

const getFormattedInvoiceNumber = (typeKey, sequence) => {
  const padded = sequence.toString().padStart(4, "0");
  switch (typeKey) {
    case "tax":
      return `STS/25-26/${padded}`;
    case "proforma":
      return `STS/25-26/PI/${padded}`;
    case "quotation":
      return `STS-Q-${padded}`;
    default:
      return `STS/25-26/${padded}`;
  }
};

const ProjectCard = ({ projectData, onUpdate, onViewInvoices, userRole }) => {
  const { company, project, startDate, endDate, clientPOC, stsPOC, milestone } =
    projectData;

  return (
    <div className="add-project-card" style={{ cursor: "pointer" }}>
      <div className="company">
        <h3>{company}</h3>
        {userRole !== "Employee" && (
          <MdUpdate
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(projectData);
            }}
            className="pj-update-icon"
          />
        )}
      </div>
      <p className="project-label">Project Name</p>
      <p className="project-value">{project}</p>
      <p className="project-label">Project Start Date</p>
      <p className="project-value">{formatDate(startDate)}</p>
      <p className="project-label">Project End Date</p>
      <p className="project-value">{formatDate(endDate)}</p>
      <p className="project-label">Client POC</p>
      <p className="project-value">{clientPOC}</p>
      <p className="project-label">STS POC</p>
      <p className="project-value">{stsPOC}</p>
      <p className="project-label">Milestone Status</p>
      <p className="project-value">Phase {milestone}</p>
      <p className="project-value">
        {userRole !== "Employee" && userRole !== "Team Lead" && (
          <button
            className="add-project-button"
            onClick={() => onViewInvoices(projectData)}
          >
            + Raise Invoice
          </button>
        )}
      </p>
    </div>
  );
};

const ProjectsDashboard = () => {
  // "projects" or "invoices" controls the view.
  const [currentScreen, setCurrentScreen] = useState("projects");
  const [showForm, setShowForm] = useState(false);
  const [showDownloadForm, setShowDownloadForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("Current");
  const [selectedInvoiceType, setSelectedInvoiceType] = useState("Tax Invoice");
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [invoiceNumberDirect, setInvoiceNumberDirect] = useState("");
  const [invoiceSequence, setInvoiceSequence] = useState(1);
  const [downloadDetails, setDownloadDetails] = useState({});

  const { user } = useAuth();
  const userRole = user?.role ?? "Employee";
  const employeeId = user?.employeeId ?? user?.id ?? null;

  // ---------- buildHeaders helper (includes x-org-id if available) ----------
  const buildHeaders = () => {
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
    };
    if (employeeId) headers["x-employee-id"] = employeeId;

    // derive org id from same places used elsewhere
    const orgId =
      user?.orgId || user?.raw?.org_id || user?.org_id || user?.organization_id;
    if (orgId) headers["x-org-id"] = orgId;

    return headers;
  };

  const fetchProjects = async () => {
    try {
      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects`;
      if (userRole === "Employee" || userRole === "Team Lead") {
        url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/employeeProjects?employeeId=${employeeId}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: buildHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, employeeId]);

  const handleProjectAdded = () => {
    fetchProjects();
  };

  const printRef = useRef(null);
  const invoiceTypeKey = getInvoiceTypeKey(selectedInvoiceType);
  const invoiceNumber = getFormattedInvoiceNumber(
    invoiceTypeKey,
    invoiceSequence
  );

  useEffect(() => {
    fetchInvoiceSequence(); // Fetch invoice sequence whenever selectedInvoiceType changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInvoiceType]);

  const fetchInvoiceSequence = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/invoice/template-number?invoiceType=${invoiceTypeKey}`,
        {
          headers: buildHeaders(),
        }
      );
      if (!response.ok) throw new Error("Failed to fetch invoice number");
      const data = await response.json();
      if (data && data.invoiceNo) {
        setInvoiceNumberDirect(data.invoiceNo);
      }
    } catch (error) {
      console.error("Error fetching invoice number:", error);
    }
  };

  const updateInvoiceNumber = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/invoice/sequence/${invoiceTypeKey}`,
        {
          method: "PUT",
          headers: buildHeaders(),
          body: JSON.stringify({}),
        }
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data && data.updatedSequence) {
        setInvoiceSequence(data.updatedSequence);
      }
    } catch (error) {
      console.error("Error updating invoice number:", error);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!printRef.current) return;

    try {
      await fetchInvoiceSequence();

      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const filename = `${invoiceNumberDirect}.pdf`;
      pdf.save(filename);

      // 1) record the download in our DB:
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/download-details`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          invoiceType: invoiceTypeKey,
          invoiceNumber: invoiceNumberDirect,
          downloadDetails,
        }),
      });

      await updateInvoiceNumber();
    } catch (error) {
      console.error("Error generating PDF", error);
    }
  };

  const openForm = (project = null) => {
    setSelectedProject(project);
    setShowForm(true);
  };

  const openInvoiceScreen = (project) => {
    setSelectedProject(project);
    setCurrentScreen("invoices");
  };

  useEffect(() => {
    if (currentScreen === "invoices") {
      setTimeout(() => {
        const invoiceScreen = document.getElementById("invoiceScreen");
        if (invoiceScreen) {
          invoiceScreen.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 50);
    }
  }, [currentScreen]);

  const filteredProjects = projects.filter((proj) => {
    if (activeTab === "Completed") return proj.status === "Completed";
    if (activeTab === "Pending") return proj.status === "Pending";
    if (activeTab === "Current") {
      const currentStatuses = ["Active", "Yet to Start", "On Hold"];
      return currentStatuses.includes(proj.status);
    }
    return false;
  });

  const handleDownloadFormSubmit = (formData) => {
    setDownloadDetails(formData);
    setShowDownloadForm(false);
  };

  return (
    <div className="project-dashboard">
      {currentScreen === "projects" && (
        <>
          <div className="project-header">
            <h2>Update Projects</h2>
            {userRole === "Admin" && (
              <button className="add-project-button" onClick={() => openForm()}>
                + Add New Project
              </button>
            )}
          </div>

          <div className="project-tabs">
            <span
              className={activeTab === "Current" ? "active-tab" : ""}
              onClick={() => setActiveTab("Current")}
            >
              Current
            </span>
            <span
              className={activeTab === "Completed" ? "active-tab" : ""}
              onClick={() => setActiveTab("Completed")}
            >
              Completed
            </span>
            <span
              className={activeTab === "Pending" ? "active-tab" : ""}
              onClick={() => setActiveTab("Pending")}
            >
              Pending
            </span>
            {(userRole === "Admin" || userRole === "Financial Manager") && (
              <span
                className={
                  activeTab === "General Templates" ? "active-tab" : ""
                }
                onClick={() => setActiveTab("General Templates")}
              >
                General Templates
              </span>
            )}
          </div>

          {activeTab !== "General Templates" && (
            <div className="project-cards-container">
              {filteredProjects.length > 0 ? (
                [...filteredProjects]
                  .sort((a, b) => b.id - a.id)
                  .map((proj) => (
                    <ProjectCard
                      key={proj.id}
                      projectData={proj}
                      onUpdate={openForm}
                      onViewInvoices={openInvoiceScreen}
                      userRole={userRole}
                    />
                  ))
              ) : (
                <p>No projects available.</p>
              )}
            </div>
          )}

          {activeTab === "General Templates" &&
            (userRole === "Admin" || userRole === "Financial Manager") && (
              <div className="general-templates-section">
                <div className="template-controls">
                  <label htmlFor="invoiceTypeSelect">Invoice Type: </label>
                  <select
                    id="invoiceTypeSelect"
                    value={selectedInvoiceType}
                    onChange={(e) => setSelectedInvoiceType(e.target.value)}
                  >
                    <option value="Tax Invoice">Tax Invoice</option>
                    <option value="Proforma Invoice">Proforma Invoice</option>
                    <option value="Quotation">Quotation</option>
                  </select>
                  <button
                    className="download-form-button"
                    onClick={() => {
                      setShowTemplatePreview(false);
                      setShowDownloadForm(true);
                    }}
                  >
                    Add Details
                  </button>
                  <button
                    className="view-template-button"
                    onClick={() => {
                      setShowTemplatePreview((prev) => !prev);
                      setShowDownloadForm(false);
                    }}
                  >
                    {showTemplatePreview ? "Hide" : "View"}{" "}
                    <FiEye className="template-icons" />
                  </button>
                  <button
                    className="download-template-button"
                    onClick={handleDownloadTemplate}
                  >
                    Download <FiDownload className="template-icons" />
                  </button>
                </div>
                {showTemplatePreview && (
                  <div className="template-preview">
                    <InvoiceTemplate
                      invoiceType={selectedInvoiceType}
                      invoiceNumber={invoiceNumberDirect}
                      downloadDetails={downloadDetails}
                    />
                  </div>
                )}
                <DownloadDetailsList />
              </div>
            )}
        </>
      )}

      {showForm && (
        <div className="pj-modal">
          <div className="pj-modal-content">
            <ProjectForm
              projectData={selectedProject}
              onClose={() => setShowForm(false)}
              onProjectAdded={handleProjectAdded}
            />
          </div>
        </div>
      )}

      {currentScreen === "invoices" && (
        <Invoice
          project={selectedProject}
          onBack={() => setCurrentScreen("projects")}
        />
      )}

      {currentScreen === "projects" &&
        showDownloadForm &&
        activeTab === "General Templates" && (
          <DownloadForm
            onSubmit={handleDownloadFormSubmit}
            onCancel={() => setShowDownloadForm(false)}
          />
        )}

      <div style={{ position: "absolute", top: "-10000px", left: "-10000px" }}>
        <div ref={printRef}>
          <InvoiceTemplate
            invoiceType={selectedInvoiceType}
            invoiceNumber={invoiceNumberDirect}
            downloadDetails={downloadDetails}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectsDashboard;
