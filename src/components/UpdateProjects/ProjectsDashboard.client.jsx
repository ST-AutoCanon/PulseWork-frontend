"use client";

import React, { useState, useEffect, useRef } from "react";
import "./ProjectsDashboard.css";
import ProjectForm from "./ProjectForm.client";
import InvoiceTemplate from "./InvoiceTemplate.client";
import DownloadForm from "./DownloadForm.client";
import CustomerForm from "./CustomerForm.client";
import Invoice from "./Invoice.client";
import { MdUpdate } from "react-icons/md";
import { FiDownload, FiEye } from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DownloadDetailsList from "./DownloadDetailsList.client";
import { useAuth } from "../../context/AuthProvider.client";

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
    case "Purchase Order":
      return "po";
    default:
      return "tax";
  }
};

const ProjectCard = ({
  projectData,
  onUpdate,
  onViewInvoices,
  userRole,
  canRaiseInvoice,
}) => {
  const { company, project, startDate, endDate, clientPOC, stsPOC, milestone } =
    projectData;

  return (
    <div className="add-project-card" style={{ cursor: "pointer" }}>
      <div className="company">
        <h3>{company}</h3>
        {(userRole === "Admin" ||
          userRole === "HR" ||
          userRole === "Manager" ||
          userRole === "Supervisor") && (
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
        {canRaiseInvoice && (
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
  const [currentScreen, setCurrentScreen] = useState("projects");
  const [showForm, setShowForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showDownloadForm, setShowDownloadForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("Current");
  const [selectedInvoiceType, setSelectedInvoiceType] = useState("Tax Invoice");
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [invoiceNumberDirect, setInvoiceNumberDirect] = useState("");
  const [invoiceSequence, setInvoiceSequence] = useState(1);
  const [downloadDetails, setDownloadDetails] = useState({});
  const [downloadDetailsRefreshKey, setDownloadDetailsRefreshKey] = useState(0);

  const { user } = useAuth();
  const userRole = user?.role ?? null;
  const dashboardData = user?.dashboardData || user?.dashboard || {};
  const userDepartment = (dashboardData.department || "").toLowerCase();
  const employeeId = user?.employeeId ?? user?.id ?? null;
  const containerRef = useRef(null);

  const normalizedRole = (userRole || "").trim();
  const normalizedDept = (userDepartment || "").trim().toLowerCase();

  const isAdmin = normalizedRole === "Admin" || normalizedRole === "HR";
  const isFinanceDept = normalizedDept === "finance";
  const isFinanceManager =
    isFinanceDept &&
    (normalizedRole === "Manager" || normalizedRole === "Financial Manager");

  const canAccessGeneralTemplates = isAdmin || isFinanceManager;

  const buildHeaders = () => {
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
    };
    if (employeeId) headers["x-employee-id"] = employeeId;

    const orgId =
      user?.orgId || user?.raw?.org_id || user?.org_id || user?.organization_id;
    if (orgId) headers["x-org-id"] = orgId;

    return headers;
  };

  const fetchCustomers = async () => {
    try {
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND}/customers`, {
        method: "GET",
        credentials: "include",
        headers: buildHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch customers");

      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const canSeeAllProjects = isAdmin || isFinanceManager;

      if (!canSeeAllProjects && !employeeId) {
        setProjects([]);
        return;
      }

      let url = "";
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

      if (canSeeAllProjects) {
        url = `${BACKEND}/projects`;
      } else {
        url = `${BACKEND}/projects/employeeProjects?employeeId=${encodeURIComponent(
          employeeId,
        )}`;
      }

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setProjects(data.projects || data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchCustomers();
  }, [userRole, employeeId]);

  const handleProjectAdded = () => {
    fetchProjects();
  };

  const handleCustomerAdded = () => {
    fetchCustomers();
    setShowCustomerForm(false);
  };

  const printRef = useRef(null);
  const invoiceTypeKey = getInvoiceTypeKey(selectedInvoiceType);

  useEffect(() => {
    fetchInvoiceSequence();
  }, [selectedInvoiceType]);

  useEffect(() => {
    if (invoiceTypeKey) {
      fetchInvoiceSequence();
    }
  }, [invoiceTypeKey]);

  const fetchInvoiceSequence = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/invoice/template-number?invoiceType=${invoiceTypeKey}`,
        { credentials: "include", headers: buildHeaders() },
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
          credentials: "include",
          headers: buildHeaders(),
          body: JSON.stringify({}),
        },
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

      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/download-details`, {
        method: "POST",
        credentials: "include",
        headers: buildHeaders(),
        body: JSON.stringify({
          invoiceType: invoiceTypeKey,
          invoiceNumber: invoiceNumberDirect,
          downloadDetails,
        }),
      });

      await updateInvoiceNumber();
      setDownloadDetailsRefreshKey((prev) => prev + 1);
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
    if (currentScreen !== "invoices") return;

    const isScrollable = (el) => {
      if (!el || el === document.body || el === document.documentElement) {
        return true;
      }
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const canScroll =
        overflowY === "auto" ||
        overflowY === "scroll" ||
        overflowY === "overlay";
      return canScroll && el.scrollHeight > el.clientHeight;
    };

    const findClosestScrollParent = (el) => {
      let node = el;
      while (
        node &&
        node !== document.body &&
        node !== document.documentElement
      ) {
        if (isScrollable(node)) return node;
        node = node.parentElement;
      }
      if (containerRef?.current && isScrollable(containerRef.current))
        return containerRef.current;
      return (
        document.scrollingElement || document.documentElement || document.body
      );
    };

    const scrollToInvoiceTop = (invoiceEl, scrollParent, headerOffset = 0) => {
      if (!invoiceEl || !scrollParent) return;

      if (
        scrollParent === document.scrollingElement ||
        scrollParent === document.documentElement ||
        scrollParent === document.body
      ) {
        const top =
          invoiceEl.getBoundingClientRect().top +
          window.pageYOffset -
          headerOffset;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        return;
      }

      const invoiceRect = invoiceEl.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();

      const target =
        invoiceRect.top -
        parentRect.top +
        scrollParent.scrollTop -
        headerOffset;
      scrollParent.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    };

    let attempts = 0;
    const maxAttempts = 12;
    const headerOffset = 0;

    const tryScroll = () => {
      attempts++;
      const invoiceEl = document.getElementById("invoiceScreen");
      if (invoiceEl) {
        const scrollParent = findClosestScrollParent(invoiceEl);
        scrollToInvoiceTop(invoiceEl, scrollParent, headerOffset);

        try {
          invoiceEl.focus && invoiceEl.focus({ preventScroll: true });
        } catch (e) {
          try {
            invoiceEl.focus && invoiceEl.focus();
          } catch (_) {}
        }
      } else if (attempts < maxAttempts) {
        requestAnimationFrame(tryScroll);
      } else {
        const fallback =
          containerRef?.current ||
          document.scrollingElement ||
          document.documentElement ||
          document.body;
        try {
          if (
            fallback === document.scrollingElement ||
            fallback === document.documentElement ||
            fallback === document.body
          ) {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            fallback.scrollTo({ top: 0, behavior: "smooth" });
          }
        } catch (e) {}
      }
    };

    requestAnimationFrame(tryScroll);
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
    <div className="project-dashboard" ref={containerRef}>
      {currentScreen === "projects" && (
        <>
          <div className="project-header">
            <h2>Update Projects</h2>
            {isAdmin && (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="add-project-button"
                  onClick={() => openForm()}
                >
                  + Add New Project
                </button>
                <button
                  className="add-project-button"
                  onClick={() => setShowCustomerForm(true)}
                >
                  + Add Customer
                </button>
              </div>
            )}
          </div>

          {showCustomerForm && (
            <div className="pj-modal">
              <div className="pj-modal-content">
                <CustomerForm
                  onClose={() => setShowCustomerForm(false)}
                  onSuccess={handleCustomerAdded}
                />
              </div>
            </div>
          )}

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
            {canAccessGeneralTemplates && (
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
                      canRaiseInvoice={canAccessGeneralTemplates}
                    />
                  ))
              ) : (
                <p>No projects available.</p>
              )}
            </div>
          )}

          {activeTab === "General Templates" && canAccessGeneralTemplates && (
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
                  <option value="Purchase Order">Purchase Order</option>
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
                    orgId={user?.orgId}
                  />
                </div>
              )}

              <DownloadDetailsList refreshKey={downloadDetailsRefreshKey} />
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
              customers={customers}
            />
          </div>
        </div>
      )}

      {currentScreen === "invoices" && (
        <div id="invoiceScreen" tabIndex={-1} style={{ outline: "none" }}>
          <Invoice
            project={selectedProject}
            onBack={() => setCurrentScreen("projects")}
          />
        </div>
      )}

      {showDownloadForm && activeTab === "General Templates" && (
        <div className="pj-modal">
          <div className="pj-modal-content">
            <DownloadForm
              onSubmit={handleDownloadFormSubmit}
              onCancel={() => setShowDownloadForm(false)}
              customers={customers}
              selectedProject={selectedProject}
            />
          </div>
        </div>
      )}

      <div style={{ position: "absolute", top: "-10000px", left: "-10000px" }}>
        <div ref={printRef}>
          <InvoiceTemplate
            invoiceType={selectedInvoiceType}
            invoiceNumber={invoiceNumberDirect}
            downloadDetails={downloadDetails}
            orgId={user?.orgId}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectsDashboard;
