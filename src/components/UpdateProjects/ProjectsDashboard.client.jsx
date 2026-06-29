"use client";

import React, { useState, useEffect, useRef } from "react";
import "./ProjectsDashboard.css";
import ProjectForm from "./ProjectForm.client";
import InvoiceTemplate from "./InvoiceTemplate.client";
import DownloadForm from "./DownloadForm.client";
import CustomerForm from "./CustomerForm.client";
import Invoice from "./Invoice.client";
import Modal from "../Modal/Modal.client";
import { MdUpdate, MdOutlineEdit } from "react-icons/md";
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
    case "Credit Note":
      return "credit";
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
  orgPrefix,
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
      <p className="project-label">{orgPrefix} POC</p>
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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState("Current");
  const [selectedInvoiceType, setSelectedInvoiceType] = useState("Tax Invoice");
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [invoiceNumberDirect, setInvoiceNumberDirect] = useState("");
  const [invoiceSequence, setInvoiceSequence] = useState(1);
  const [downloadDetails, setDownloadDetails] = useState({});
  const [downloadDetailsRefreshKey, setDownloadDetailsRefreshKey] = useState(0);
  const [downloadFormInitialData, setDownloadFormInitialData] = useState(null);
  const [customerNotice, setCustomerNotice] = useState({
    isVisible: false,
    message: "",
    title: "Success",
  });

  const { user } = useAuth();
  const userRole = user?.role ?? null;
  const dashboardData = user?.dashboardData || user?.dashboard || {};
  const userDepartment = (dashboardData.department || "").toLowerCase();
  const employeeId = user?.employeeId ?? user?.id ?? null;
  const orgPrefix = user?.orgPrefix ?? null;
  const containerRef = useRef(null);

  const normalizedRole = (userRole || "").trim();
  const normalizedDept = (userDepartment || "").trim().toLowerCase();

  const isAdmin = normalizedRole === "Admin" || normalizedRole === "HR";
  const isFinanceDept = normalizedDept === "finance";
  const isFinanceManager =
    isFinanceDept &&
    (normalizedRole === "Manager" || normalizedRole === "Financial Manager");

  const canAccessGeneralTemplates = isAdmin || isFinanceManager;

  const [selectedTemplateKey, setSelectedTemplateKey] = useState("__default__");
  const [pdfReady, setPdfReady] = useState(false);

  const [templateSelected, setTemplateSelected] = useState(false);
  const [downloadWarning, setDownloadWarning] = useState({
    isVisible: false,
    title: "Template Required",
    message: "",
  });

  const openDownloadForm = (initialData = null) => {
    setSelectedProject(null);
    setDownloadFormInitialData(initialData);

    setShowTemplatePreview(false);

    setTemplateSelected(false);
    setSelectedTemplateKey("__default__");

    setShowDownloadForm(true);
  };

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

  const openCustomerForm = (customer = null) => {
    setSelectedCustomer(customer);
    setShowCustomerForm(true);
  };

  const closeCustomerForm = () => {
    setShowCustomerForm(false);
    setSelectedCustomer(null);
  };

  const handleCustomerSaved = async (payload = {}) => {
    await fetchCustomers();
    setShowCustomerForm(false);
    setSelectedCustomer(null);
    setCustomerNotice({
      isVisible: true,
      title: "Success",
      message: payload?.message || "Customer saved successfully.",
    });
  };

  const closeCustomerNotice = () => {
    setCustomerNotice({ isVisible: false, message: "", title: "Success" });
  };

  const printRef = useRef(null);
  const invoiceTypeKey = getInvoiceTypeKey(selectedInvoiceType);

  useEffect(() => {
    setTemplateSelected(false);
    setSelectedTemplateKey("__default__");
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
      const nextNo = data?.invoiceNo || "";
      if (nextNo) setInvoiceNumberDirect(nextNo);
      return nextNo;
    } catch (error) {
      console.error("Error fetching invoice number:", error);
      return "";
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
    if (!templateSelected) {
      setDownloadWarning({
        isVisible: true,
        title: "Template Required",
        message:
          "Please preview and select an invoice template before downloading.",
      });
      return;
    }
    if (!printRef.current) return;

    try {
      const currentInvoiceNo = await fetchInvoiceSequence();

      if (!pdfReady) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      pdf.save(`${currentInvoiceNo || invoiceNumberDirect || "invoice"}.pdf`);

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/download-details`,
        {
          method: "POST",
          credentials: "include",
          headers: buildHeaders(),
          body: JSON.stringify({
            invoiceType: invoiceTypeKey,
            invoiceNumber: currentInvoiceNo || invoiceNumberDirect,
            downloadDetails,
          }),
        },
      );

      if (!resp.ok) {
        throw new Error(`Download save failed (${resp.status})`);
      }

      await updateInvoiceNumber();
      const nextInvoiceNo = await fetchInvoiceSequence();
      if (nextInvoiceNo) setInvoiceNumberDirect(nextInvoiceNo);

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

  const handleCancelDownloadRecord = async (record) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
      };

      if (employeeId) headers["x-employee-id"] = String(employeeId);

      const orgId =
        user?.orgId ||
        user?.raw?.org_id ||
        user?.org_id ||
        user?.organization_id;

      if (orgId) headers["x-org-id"] = orgId;

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/download-details/${record.id}/cancel`,
        {
          method: "PATCH",
          credentials: "include",
          headers,
        },
      );

      if (!resp.ok) throw new Error(`Cancel failed (${resp.status})`);

      setDownloadDetailsRefreshKey((prev) => prev + 1);

      setCustomerNotice({
        isVisible: true,
        title: "Success",
        message: "Record cancelled successfully.",
      });
    } catch (err) {
      console.error("Cancel failed:", err);
      setCustomerNotice({
        isVisible: true,
        title: "Error",
        message: err.message || "Failed to cancel record.",
      });
    }
  };

  const handleDownloadFormSubmit = (formData) => {
    setDownloadDetails(formData);
    setShowDownloadForm(false);
    setDownloadFormInitialData(null);
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
                  onClick={() => openCustomerForm()}
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
                  onClose={closeCustomerForm}
                  onSuccess={handleCustomerSaved}
                  initialData={selectedCustomer}
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
              <>
                <span
                  className={
                    activeTab === "General Templates" ? "active-tab" : ""
                  }
                  onClick={() => setActiveTab("General Templates")}
                >
                  General Templates
                </span>
                <span
                  className={
                    activeTab === "Saved Customers" ? "active-tab" : ""
                  }
                  onClick={() => setActiveTab("Saved Customers")}
                >
                  Saved Customers
                </span>
              </>
            )}
          </div>

          {activeTab === "Saved Customers" && canAccessGeneralTemplates && (
            <div className="general-templates-section">
              <div
                className="download-details-container"
                style={{ marginTop: 0 }}
              >
                <h2>Saved Customers</h2>

                {customers.length === 0 ? (
                  <p>No customers saved yet.</p>
                ) : (
                  <table className="download-table">
                    <thead>
                      <tr>
                        <th>Sl No.</th>
                        <th>Company</th>
                        <th>GSTIN</th>
                        <th>PAN</th>
                        <th>Address</th>
                        <th>Country</th>
                        <th>State</th>
                        <th>POC</th>
                        <th>Contact</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer, idx) => (
                        <tr key={customer.id ?? idx}>
                          <td>{idx + 1}</td>
                          <td>{customer.company_name || "—"}</td>
                          <td>{customer.company_gst || "—"}</td>
                          <td>{customer.company_pan || "—"}</td>
                          <td>{customer.company_address || "—"}</td>
                          <td>{customer.country || "—"}</td>
                          <td>{customer.state || "—"}</td>
                          <td>{customer.project_poc_name || "—"}</td>
                          <td>{customer.project_poc_contact || "—"}</td>
                          <td>
                            <div className="invoice-action-buttons">
                              <MdOutlineEdit
                                className="in-edit-icon"
                                onClick={() => openCustomerForm(customer)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab !== "General Templates" &&
            activeTab !== "Saved Customers" && (
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
                        orgPrefix={orgPrefix}
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
                  <option value="Credit Note">Credit Note</option>
                </select>
                <button
                  className="download-form-button"
                  onClick={() => openDownloadForm(null)}
                >
                  Add Details
                </button>
                <button
                  className="view-template-button"
                  onClick={() => {
                    setShowTemplatePreview((prev) => {
                      const next = !prev;

                      if (!next) {
                        setTemplateSelected(false);
                        setSelectedTemplateKey("__default__");
                      }

                      return next;
                    });

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
                    selectedTemplateKey={selectedTemplateKey}
                    onSelectedTemplateKeyChange={(key) => {
                      setSelectedTemplateKey(key);
                      setTemplateSelected(key && key !== "__default__");
                    }}
                  />
                </div>
              )}

              <DownloadDetailsList
                refreshKey={downloadDetailsRefreshKey}
                customers={customers}
                onDuplicate={(record) => openDownloadForm(record)}
                onCancelRecord={handleCancelDownloadRecord}
              />
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
              onCancel={() => {
                setShowDownloadForm(false);
                setDownloadFormInitialData(null);
              }}
              customers={customers}
              selectedProject={selectedProject}
              initialData={downloadFormInitialData}
              invoiceType={selectedInvoiceType}
            />
          </div>
        </div>
      )}

      {customerNotice.isVisible && (
        <Modal
          isVisible={customerNotice.isVisible}
          title={customerNotice.title}
          onClose={closeCustomerNotice}
          buttons={[
            {
              label: "OK",
              className: "confirm-btn",
              onClick: closeCustomerNotice,
            },
          ]}
        >
          <p>{customerNotice.message}</p>
        </Modal>
      )}

      <div style={{ position: "absolute", top: "-10000px", left: "-10000px" }}>
        <div ref={printRef}>
          <InvoiceTemplate
            invoiceType={selectedInvoiceType}
            invoiceNumber={invoiceNumberDirect}
            downloadDetails={downloadDetails}
            orgId={user?.orgId}
            showTemplateToolbar={false}
            selectedTemplateKey={selectedTemplateKey}
            onSelectedTemplateKeyChange={(key) => {
              setSelectedTemplateKey(key);
              setTemplateSelected(key && key !== "__default__");
            }}
            onTemplateReady={setPdfReady}
          />
        </div>
      </div>

      <Modal
        isVisible={downloadWarning.isVisible}
        title={downloadWarning.title}
        onClose={() =>
          setDownloadWarning({
            isVisible: false,
            title: "",
            message: "",
          })
        }
        buttons={[
          {
            label: "OK",
            className: "confirm-btn",
            onClick: () =>
              setDownloadWarning({
                isVisible: false,
                title: "",
                message: "",
              }),
          },
        ]}
      >
        <p>{downloadWarning.message}</p>
      </Modal>
    </div>
  );
};

export default ProjectsDashboard;
