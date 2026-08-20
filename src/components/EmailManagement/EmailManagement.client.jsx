"use client";

import { useMemo, useState } from "react";
import {
  REPORT_COMPONENT_OPTIONS as REPORT_TYPES,
  SUB_OPTIONS,
} from "../Report/ReportConstants";
import "./EmailManagement.css";

const CATEGORY_TEMPLATES = {
  leaves: [
    {
      id: "leave_summary",
      label: "Leave Summary",
      description: "Leave requests, dates, type and approval status.",
      fieldKeys: [
        "leave_id",
        "employee_id",
        "employee_name",
        "leave_type",
        "start_date",
        "end_date",
        "status",
      ],
    },
    {
      id: "leave_balance",
      label: "Leave Balance",
      description: "Compensated, deducted and loss-of-pay leave details.",
      fieldKeys: [
        "employee_id",
        "employee_name",
        "leave_type",
        "compensated_days",
        "deducted_days",
        "loss_of_pay_days",
        "preserved_leave_days",
      ],
    },
    {
      id: "custom",
      label: "Create Custom Report",
      description: "Choose any available leave fields and design your email.",
      isCustom: true,
    },
  ],
  reimbursements: [
    {
      id: "reimbursement_summary",
      label: "Reimbursement Summary",
      description: "Claims, amounts, travel details and approval status.",
      fieldKeys: [
        "id",
        "employee_id",
        "employee_name",
        "claim_type",
        "approval_status",
        "payment_status",
        "total_amount",
      ],
    },
    {
      id: "reimbursement_approvals",
      label: "Approval & Payment Status",
      description: "Approver, comments, approval and payment dates.",
      fieldKeys: [
        "id",
        "employee_name",
        "approval_status",
        "payment_status",
        "approver_name",
        "approver_comments",
        "approved_date",
        "paid_date",
      ],
    },
    {
      id: "custom",
      label: "Create Custom Report",
      description:
        "Choose any available reimbursement fields and design your email.",
      isCustom: true,
    },
  ],
  employees: [
    {
      id: "employee_directory",
      label: "Employee Directory",
      description: "Identity, contact, role and department details.",
      fieldKeys: [
        "employee_id",
        "employee_name",
        "email",
        "phone_number",
        "employee_type",
        "role",
        "department_name",
        "position",
        "status",
      ],
    },
    {
      id: "department",
      label: "Department Report",
      description: "Employees grouped by department and position.",
      fieldKeys: [
        "employee_id",
        "employee_name",
        "department_id",
        "department_name",
        "position",
        "supervisor_id",
        "status",
      ],
    },
    {
      id: "custom",
      label: "Create Custom Report",
      description:
        "Choose any available employee fields and design your email.",
      isCustom: true,
    },
  ],
  vendors: [
    {
      id: "vendor_directory",
      label: "Vendor Directory",
      description: "Company, contacts, tax and banking details.",
      fieldKeys: [
        "vendor_id",
        "company_name",
        "city",
        "state",
        "gst_number",
        "pan_number",
        "contact1_mobile",
        "contact1_email",
      ],
    },
    {
      id: "vendor_products",
      label: "Products & Experience",
      description: "Product categories and vendor experience details.",
      fieldKeys: [
        "vendor_id",
        "company_name",
        "company_type",
        "product_category",
        "years_of_experience",
        "created_at",
      ],
    },
    {
      id: "custom",
      label: "Create Custom Report",
      description: "Choose any available vendor fields and design your email.",
      isCustom: true,
    },
  ],
  assets: [
    {
      id: "asset_utilization",
      label: "Asset Utilization",
      description: "Assignment, category, valuation and current status.",
      fieldKeys: [
        "asset_id",
        "asset_code",
        "asset_name",
        "category",
        "sub_category",
        "assigned_to",
        "status",
      ],
    },
    {
      id: "asset_inventory",
      label: "Asset Inventory",
      description: "Asset configuration, valuation and inventory count.",
      fieldKeys: [
        "asset_id",
        "asset_code",
        "asset_name",
        "configuration",
        "category",
        "valuation_date",
        "count",
      ],
    },
    {
      id: "custom",
      label: "Create Custom Report",
      description: "Choose any available asset fields and design your email.",
      isCustom: true,
    },
  ],
  recruitment: [
    {
      id: "candidate_pipeline",
      label: "Candidate Pipeline",
      description: "Candidates, positions, skills and recruitment status.",
      fieldKeys: [
        "id",
        "name",
        "email",
        "phone",
        "applied_position",
        "department",
        "status",
      ],
    },
    {
      id: "offer_onboarding",
      label: "Offer & Onboarding",
      description: "Offer details, joining dates and candidate status.",
      fieldKeys: [
        "id",
        "name",
        "applied_position",
        "offer_ctc",
        "offer_letter_url",
        "joining_date",
        "status",
      ],
    },
    {
      id: "custom",
      label: "Create Custom Report",
      description:
        "Choose any available recruitment fields and design your email.",
      isCustom: true,
    },
  ],
  attendance: [
    {
      id: "attendance_summary",
      label: "Attendance Summary",
      description: "Punch times, devices, location and total login hours.",
      fieldKeys: [
        "punch_id",
        "employee_id",
        "employee_name",
        "punch_status",
        "punchin_time",
        "punchout_time",
        "total_login_hours",
      ],
    },
    {
      id: "late_login",
      label: "Late Login Report",
      description: "Employees who logged in after the allowed time.",
      fieldKeys: [
        "employee_id",
        "employee_name",
        "punchin_time",
        "punchin_device",
        "punchin_location",
      ],
    },
    {
      id: "custom",
      label: "Create Custom Report",
      description:
        "Choose any available attendance fields and design your email.",
      isCustom: true,
    },
  ],
  attendance_regularisation: [
    {
      id: "regularisation_status",
      label: "Regularisation Status",
      description: "Requests, dates, comments and approval status.",
      fieldKeys: [
        "id",
        "employee_id",
        "employee_name",
        "regularisation_type",
        "selected_dates",
        "status",
        "approver_name",
      ],
    },
    {
      id: "regularisation_approvals",
      label: "Approval Details",
      description: "Approver information and approval comments.",
      fieldKeys: [
        "id",
        "employee_name",
        "status",
        "approver_name",
        "approver_employee_id",
        "approver_comments",
        "updated_at",
      ],
    },
    {
      id: "custom",
      label: "Create Custom Report",
      description:
        "Choose any available regularisation fields and design your email.",
      isCustom: true,
    },
  ],
  tasks_employee: [
    {
      id: "task_progress",
      label: "Task Progress",
      description: "Weekly tasks, projects, status and ratings.",
      fieldKeys: [
        "task_date",
        "project_name",
        "task_name",
        "employee_name",
        "emp_status",
        "sup_status",
        "star_rating",
      ],
    },
    {
      id: "task_reviews",
      label: "Task Reviews",
      description: "Employee and supervisor comments and review status.",
      fieldKeys: [
        "task_name",
        "employee_name",
        "emp_comment",
        "sup_comment",
        "sup_review_status",
        "star_rating",
      ],
    },
    {
      id: "custom",
      label: "Create Custom Report",
      description: "Choose any available task fields and design your email.",
      isCustom: true,
    },
  ],
  tasks_supervisor: [
    {
      id: "task_progress",
      label: "Task Progress",
      description: "Assigned tasks, due dates, status and completion.",
      fieldKeys: [
        "task_id",
        "employee_id",
        "employee_name",
        "task_title",
        "start_date",
        "due_date",
        "status",
        "percentage",
      ],
    },
    {
      id: "status_update",
      label: "Status Update",
      description: "Task descriptions, progress and current status.",
      fieldKeys: [
        "task_id",
        "task_title",
        "description",
        "status",
        "percentage",
        "progress_percentage",
        "updated_at",
      ],
    },
    {
      id: "custom",
      label: "Create Custom Report",
      description: "Choose any available task fields and design your email.",
      isCustom: true,
    },
  ],
};

const AVAILABLE_PROJECTS = ["Project Alpha", "Project Omega", "Project Nova"];
const AVAILABLE_DEPARTMENTS = ["Finance", "Operations", "HR", "Sales"];
const SEND_TO_TYPES = [
  "Specific Users",
  "Groups",
  "Departments",
  "All Employees",
];
const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Monthly"];
const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const REPORT_TYPES_PER_PAGE = 3;
const CATEGORIES_PER_PAGE = 3;

const REPORT_OPTION_CONFIG = {
  project_status: {
    scopeLabel: "Report Scope",
    projectLabel: "Select Projects to Review",
    departmentLabel: "Select Departments (Optional)",
    showProjects: true,
    showDepartments: true,
  },
  reimbursement: {
    scopeLabel: "Report Scope",
    projectLabel: "Select Projects (Optional)",
    departmentLabel: "Select Departments (Optional)",
    showProjects: true,
    showDepartments: true,
  },
  asset_details: {
    scopeLabel: "Asset Scope",
    projectLabel: "Select Asset Categories (Optional)",
    departmentLabel: "Select Departments / Locations",
    showProjects: false,
    showDepartments: true,
  },
  task_time_frame: {
    scopeLabel: "Task Scope",
    projectLabel: "Select Task Projects",
    departmentLabel: "Select Departments (Optional)",
    showProjects: true,
    showDepartments: true,
  },
  status_update: {
    scopeLabel: "Status Scope",
    projectLabel: "Select Projects to Track",
    departmentLabel: "Select Departments (Optional)",
    showProjects: true,
    showDepartments: true,
  },
  department: {
    scopeLabel: "Department Scope",
    projectLabel: "Select Projects (Optional)",
    departmentLabel: "Select Departments to Include",
    showProjects: false,
    showDepartments: true,
  },
  general: {
    scopeLabel: "Report Scope",
    projectLabel: "Select Projects (Optional)",
    departmentLabel: "Select Departments (Optional)",
    showProjects: true,
    showDepartments: true,
  },
};

/* Soft color accents for report-type cards (cycles if more than 6) */
const REPORT_TYPE_COLORS = ["purple", "teal", "blue", "orange", "pink", "cyan"];

function formatDateLabel(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseChips(rawValue) {
  return rawValue
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getReportCategories(reportType) {
  return CATEGORY_TEMPLATES[reportType] || CATEGORY_TEMPLATES.employees;
}

function getReportFields(reportType, categoryId) {
  const fields = SUB_OPTIONS[reportType] || [];
  const category = getReportCategories(reportType).find(
    (item) => item.id === categoryId,
  );
  if (!category?.fieldKeys) return fields;
  const keys = new Set(category.fieldKeys);
  const filtered = fields.filter((field) => keys.has(field.key));
  return filtered.length > 0 ? filtered : fields;
}

export default function EmailManagement() {
  const [selectedReportType, setSelectedReportType] = useState("attendance");
  const [reportTypePage, setReportTypePage] = useState(0);
  const [selectedCategory, setSelectedCategory] =
    useState("attendance_summary");
  const [categoryPage, setCategoryPage] = useState(0);
  const [selectedFields, setSelectedFields] = useState(
    getReportFields("attendance", "attendance_summary")
      .slice(0, 7)
      .map((field) => field.key),
  );
  const [selectedReportScope, setSelectedReportScope] =
    useState("All Employees");
  const [selectedProjects, setSelectedProjects] = useState([
    AVAILABLE_PROJECTS[0],
  ]);
  const [selectedDepartments, setSelectedDepartments] = useState([
    AVAILABLE_DEPARTMENTS[0],
  ]);
  const [sendToType, setSendToType] = useState("Specific Users");
  const [sendToValues, setSendToValues] = useState([
    "finance.head@company.com",
    "account.manager@company.com",
  ]);
  const [sendToInput, setSendToInput] = useState("");
  const [ccValues, setCcValues] = useState(["ceo@company.com"]);
  const [ccInput, setCcInput] = useState("");
  const [bccValues, setBccValues] = useState([]);
  const [bccInput, setBccInput] = useState("");
  const [frequency, setFrequency] = useState("Weekly");
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [repeatOn, setRepeatOn] = useState("Monday");
  const [time, setTime] = useState("09:00");
  const [startDate, setStartDate] = useState("2025-05-20");
  const [endDate, setEndDate] = useState("");
  const [endAfterOccurrences, setEndAfterOccurrences] = useState(10);
  const [noEndDate, setNoEndDate] = useState(true);
  const [previewEmail] = useState("john.doe@company.com");
  const [emailSubject, setEmailSubject] = useState("Weekly Attendance Report");
  const [emailBody, setEmailBody] = useState(
    "Please find attached the selected report fields for the scheduled period.",
  );
  const [sendingEnabled, setSendingEnabled] = useState(true);

  /* ── Report types pagination ── */
  const totalReportPages = Math.max(
    1,
    Math.ceil((REPORT_TYPES?.length || 0) / REPORT_TYPES_PER_PAGE),
  );

  const visibleReportTypes = useMemo(() => {
    const list = REPORT_TYPES || [];
    const start = reportTypePage * REPORT_TYPES_PER_PAGE;
    return list.slice(start, start + REPORT_TYPES_PER_PAGE).map((type, i) => ({
      ...type,
      colorKey:
        REPORT_TYPE_COLORS[
          (reportTypePage * REPORT_TYPES_PER_PAGE + i) %
            REPORT_TYPE_COLORS.length
        ],
    }));
  }, [reportTypePage]);

  const reportCategories = useMemo(
    () => getReportCategories(selectedReportType),
    [selectedReportType],
  );

  const totalCategoryPages = Math.max(
    1,
    Math.ceil(reportCategories.length / CATEGORIES_PER_PAGE),
  );

  const visibleCategories = useMemo(() => {
    const start = categoryPage * CATEGORIES_PER_PAGE;
    return reportCategories.slice(start, start + CATEGORIES_PER_PAGE);
  }, [categoryPage, reportCategories]);

  const categoryLabel = useMemo(() => {
    const found = reportCategories.find((item) => item.id === selectedCategory);
    return found?.label || reportCategories[0]?.label || "Report";
  }, [reportCategories, selectedCategory]);

  const selectedCategoryTemplate = reportCategories.find(
    (item) => item.id === selectedCategory,
  );

  const availableReportFields = useMemo(
    () => getReportFields(selectedReportType, selectedCategory),
    [selectedReportType, selectedCategory],
  );

  const selectedFieldDetails = useMemo(
    () =>
      availableReportFields.filter((field) =>
        selectedFields.includes(field.key),
      ),
    [availableReportFields, selectedFields],
  );

  const reportOptionConfig = REPORT_OPTION_CONFIG[selectedCategory] || {
    scopeLabel: "Report Scope",
    projectLabel: "Select Projects (Optional)",
    departmentLabel: "Select Departments (Optional)",
    showProjects: selectedReportType.includes("tasks"),
    showDepartments: true,
  };

  const handleReportTypeChange = (reportType) => {
    const nextCategories = getReportCategories(reportType);
    const nextCategory = nextCategories[0];
    setSelectedReportType(reportType);
    setSelectedCategory(nextCategory.id);
    setCategoryPage(0);
    setSelectedFields(
      getReportFields(reportType, nextCategory.id)
        .slice(0, 7)
        .map((field) => field.key),
    );
    setEmailSubject(
      `${REPORT_TYPES.find((item) => item.value === reportType)?.label || "Report"} Report`,
    );
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedFields(
      getReportFields(selectedReportType, categoryId)
        .slice(0, 7)
        .map((field) => field.key),
    );
  };

  const toggleReportField = (fieldKey) => {
    setSelectedFields((current) =>
      current.includes(fieldKey)
        ? current.filter((key) => key !== fieldKey)
        : [...current, fieldKey],
    );
  };

  const previewSubject = useMemo(() => {
    const report = (REPORT_TYPES || []).find(
      (item) =>
        item.id === selectedReportType || item.value === selectedReportType,
    );
    const reportLabel = report?.label || "Report";
    return `${emailSubject || reportLabel} — ${formatDateLabel(startDate)}${
      endDate ? ` to ${formatDateLabel(endDate)}` : ""
    }`;
  }, [selectedReportType, emailSubject, startDate, endDate]);

  const summaryItems = useMemo(() => {
    switch (selectedCategory) {
      case "project_status":
        return [
          { label: "Active Projects", value: "12" },
          { label: "Delayed Tasks", value: "18" },
          { label: "Completed Milestones", value: "42" },
          { label: "Pending Reviews", value: "8" },
        ];
      case "asset_details":
        return [
          { label: "Total Assets", value: "1,240" },
          { label: "In Use", value: "842" },
          { label: "Under Maintenance", value: "114" },
          { label: "Unused Assets", value: "284" },
        ];
      case "task_time_frame":
        return [
          { label: "Tasks Completed", value: "128" },
          { label: "Average Time", value: "3.2 days" },
          { label: "High Priority", value: "34" },
          { label: "Overdue", value: "9" },
        ];
      case "status_update":
        return [
          { label: "Open Issues", value: "15" },
          { label: "Resolved", value: "74" },
          { label: "In Review", value: "9" },
          { label: "Pending", value: "12" },
        ];
      case "department":
        return [
          { label: "Department Goals", value: "3" },
          { label: "Ongoing Initiatives", value: "7" },
          { label: "Approvals Pending", value: "4" },
          { label: "Team Members", value: "38" },
        ];
      case "general":
        return [
          { label: "Selected Metrics", value: "6" },
          { label: "Filters Active", value: "4" },
          { label: "Custom Views", value: "2" },
          { label: "Scheduled Runs", value: "1" },
        ];
      default:
        return [
          { label: "Total Reimbursements", value: "₹ 1,45,230" },
          { label: "Travel Reimbursement", value: "₹ 82,450 (57%)" },
          { label: "Meals Reimbursement", value: "₹ 18,720 (13%)" },
          { label: "Purchase Reimbursement", value: "₹ 32,800 (23%)" },
          { label: "Other Reimbursement", value: "₹ 11,260 (7%)" },
          { label: "Pending Approvals", value: "₹ 15,400" },
        ];
    }
  }, [selectedCategory]);

  const handleToggleOption = (value, currentValues, setValues) => {
    setValues((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const handleRemoveChip = (value, setValues) => {
    setValues((prev) => prev.filter((item) => item !== value));
  };

  const renderChips = (items, removeFn) => (
    <div className="em-chip-list">
      {items.map((item) => (
        <div key={item} className="em-chip">
          <span>{item}</span>
          <button type="button" onClick={() => removeFn(item)}>
            &times;
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="em-page">
      <div className="em-header">
        <div>
          <h1>Email Report Configuration</h1>
          <p>
            Configure and schedule automated emails for any report to
            individuals, groups or all employees.
          </p>
        </div>
        <div className="em-actions">
          <button
            className="em-btn em-btn-secondary"
            disabled={!sendingEnabled}
          >
            Test Email
          </button>
          <button className="em-btn em-btn-primary">
            {sendingEnabled ? "Save Configuration" : "Save (Sending Stopped)"}
          </button>
        </div>
      </div>

      <div className="em-grid">
        <div className="em-form-panel">
          {/* ── 1. Select Report Type ── */}
          <section className="em-section">
            <div className="em-step-number">1</div>
            <div className="em-section-header">
              <h2>Select Report Type</h2>
            </div>

            <div className="em-report-type-wrap">
              <div className="em-report-type-grid">
                {visibleReportTypes.map((type) => {
                  const typeId = type.id ?? type.value;
                  return (
                    <button
                      key={typeId}
                      type="button"
                      className={`em-option-card color-${type.colorKey} ${
                        selectedReportType === typeId ? "selected" : ""
                      }`}
                      onClick={() => handleReportTypeChange(type.value)}
                    >
                      <div className="em-option-card-top">
                        <span
                          className={`em-option-dot dot-${type.colorKey}`}
                        />
                        <span className="em-option-label">{type.label}</span>
                      </div>
                      <span className="em-option-subtitle">
                        {type.subtitle || type.description || ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              {totalReportPages > 1 && (
                <div className="em-report-type-nav">
                  <span className="em-report-type-nav-info">
                    {reportTypePage + 1} / {totalReportPages}
                  </span>
                  <div className="em-report-type-nav-btns">
                    <button
                      type="button"
                      className="em-nav-btn"
                      disabled={reportTypePage === 0}
                      onClick={() =>
                        setReportTypePage((p) => Math.max(0, p - 1))
                      }
                      aria-label="Previous report types"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="em-nav-btn"
                      disabled={reportTypePage >= totalReportPages - 1}
                      onClick={() =>
                        setReportTypePage((p) =>
                          Math.min(totalReportPages - 1, p + 1),
                        )
                      }
                      aria-label="Next report types"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── 2. Choose Custom Report Category ── */}
          <section className="em-section">
            <div className="em-step-number">2</div>
            <div className="em-section-header">
              <h2>Choose Custom Report Category</h2>
            </div>

            <div className="em-category-wrap">
              <div className="em-category-grid">
                {visibleCategories.map((category) => {
                  const isNew = category.isCustom;
                  const isSelected = selectedCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={`em-category-card ${
                        isSelected ? "selected" : ""
                      } ${isNew ? "em-new-category" : ""}`}
                      onClick={() => {
                        handleCategoryChange(category.id);
                      }}
                    >
                      <div className="em-category-card-top">
                        <span
                          className={`em-category-dot ${
                            isNew ? "dot-new" : `dot-${category.id}`
                          }`}
                        />
                        <strong>{category.label}</strong>
                      </div>
                      <p>{category.description}</p>
                    </button>
                  );
                })}
              </div>

              {totalCategoryPages > 1 && (
                <div className="em-report-type-nav">
                  <span className="em-report-type-nav-info">
                    {categoryPage + 1} / {totalCategoryPages}
                  </span>
                  <div className="em-report-type-nav-btns">
                    <button
                      type="button"
                      className="em-nav-btn"
                      disabled={categoryPage === 0}
                      onClick={() => setCategoryPage((p) => Math.max(0, p - 1))}
                      aria-label="Previous categories"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="em-nav-btn"
                      disabled={categoryPage >= totalCategoryPages - 1}
                      onClick={() =>
                        setCategoryPage((p) =>
                          Math.min(totalCategoryPages - 1, p + 1),
                        )
                      }
                      aria-label="Next categories"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── 3. Report Options ── */}
          <section className="em-section">
            <div className="em-step-number">3</div>
            <div className="em-section-header">
              <h2>Report Options</h2>
            </div>

            <div className="em-field-row">
              <label>
                Available Report Fields
                <span className="em-field-count">
                  {selectedFieldDetails.length} selected
                </span>
              </label>
              <div className="em-report-fields-grid">
                {availableReportFields.map((field) => (
                  <label
                    key={field.key}
                    className={`em-report-field-option ${
                      selectedFields.includes(field.key) ? "selected" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.key)}
                      onChange={() => toggleReportField(field.key)}
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedCategoryTemplate?.isCustom && (
              <div className="em-email-editor">
                <div className="em-editor-heading">
                  <div>
                    <h3>Design Custom Email</h3>
                    <p>
                      Write the subject and message that recipients will
                      receive.
                    </p>
                  </div>
                  <label className="em-send-toggle">
                    <input
                      type="checkbox"
                      checked={sendingEnabled}
                      onChange={(event) =>
                        setSendingEnabled(event.target.checked)
                      }
                    />
                    <span>
                      {sendingEnabled ? "Sending enabled" : "Sending stopped"}
                    </span>
                  </label>
                </div>
                <div className="em-editor-grid">
                  <div className="em-editor-form">
                    <label>
                      Subject
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(event) =>
                          setEmailSubject(event.target.value)
                        }
                        placeholder="Enter email subject"
                      />
                    </label>
                    <label>
                      Email message
                      <textarea
                        value={emailBody}
                        onChange={(event) => setEmailBody(event.target.value)}
                        rows={6}
                        placeholder="Write your email message"
                      />
                    </label>
                  </div>
                  <div className="em-editor-mini-preview">
                    <span className="em-editor-preview-label">
                      Live preview
                    </span>
                    <strong>{emailSubject || "Untitled report email"}</strong>
                    <p>{emailBody || "Your email message will appear here."}</p>
                    <small>
                      {sendingEnabled
                        ? "This configuration will send automatically."
                        : "Sending is currently stopped."}
                    </small>
                  </div>
                </div>
              </div>
            )}

            <div className="em-field-row">
              <label>{reportOptionConfig.scopeLabel}</label>
              <select
                value={selectedReportScope}
                onChange={(e) => setSelectedReportScope(e.target.value)}
              >
                <option>All Employees</option>
                <option>Selected Departments</option>
                <option>Selected Projects</option>
              </select>
            </div>

            {reportOptionConfig.showProjects && (
              <div className="em-field-row">
                <label>{reportOptionConfig.projectLabel}</label>
                <div className="em-option-chip-row">
                  {AVAILABLE_PROJECTS.map((project) => (
                    <button
                      key={project}
                      type="button"
                      className={`em-chip-button ${
                        selectedProjects.includes(project) ? "selected" : ""
                      }`}
                      onClick={() =>
                        handleToggleOption(
                          project,
                          selectedProjects,
                          setSelectedProjects,
                        )
                      }
                    >
                      {project}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {reportOptionConfig.showDepartments && (
              <div className="em-field-row">
                <label>{reportOptionConfig.departmentLabel}</label>
                <div className="em-option-chip-row">
                  {AVAILABLE_DEPARTMENTS.map((department) => (
                    <button
                      key={department}
                      type="button"
                      className={`em-chip-button ${
                        selectedDepartments.includes(department)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleToggleOption(
                          department,
                          selectedDepartments,
                          setSelectedDepartments,
                        )
                      }
                    >
                      {department}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── 4. Send To ── */}
          <section className="em-section">
            <div className="em-step-number">4</div>
            <div className="em-section-header">
              <h2>Send To</h2>
            </div>
            <div className="em-field-row em-radio-group">
              {SEND_TO_TYPES.map((option) => (
                <label key={option} className="em-radio-option">
                  <input
                    type="radio"
                    name="sendToType"
                    value={option}
                    checked={sendToType === option}
                    onChange={() => setSendToType(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <div className="em-field-row">
              <label>Select Users / Groups / Departments</label>
              <div className="em-input-chip-box em-chip-input-group">
                {renderChips(sendToValues, (item) =>
                  handleRemoveChip(item, setSendToValues),
                )}
                <input
                  type="text"
                  value={sendToInput}
                  onChange={(e) => setSendToInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (() => {
                      e.preventDefault();
                      const parsed = parseChips(sendToInput);
                      if (parsed.length) {
                        setSendToValues((prev) =>
                          Array.from(new Set([...prev, ...parsed])),
                        );
                        setSendToInput("");
                      }
                    })()
                  }
                  onBlur={() => {
                    const parsed = parseChips(sendToInput);
                    if (parsed.length) {
                      setSendToValues((prev) =>
                        Array.from(new Set([...prev, ...parsed])),
                      );
                      setSendToInput("");
                    }
                  }}
                  placeholder="Type email or group and press Enter"
                />
              </div>
            </div>
            <div className="em-field-row">
              <label>CC (Optional)</label>
              <div className="em-input-chip-box em-chip-input-group">
                {renderChips(ccValues, (item) =>
                  handleRemoveChip(item, setCcValues),
                )}
                <input
                  type="text"
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (() => {
                      e.preventDefault();
                      const parsed = parseChips(ccInput);
                      if (parsed.length) {
                        setCcValues((prev) =>
                          Array.from(new Set([...prev, ...parsed])),
                        );
                        setCcInput("");
                      }
                    })()
                  }
                  onBlur={() => {
                    const parsed = parseChips(ccInput);
                    if (parsed.length) {
                      setCcValues((prev) =>
                        Array.from(new Set([...prev, ...parsed])),
                      );
                      setCcInput("");
                    }
                  }}
                  placeholder="Add CC email and press Enter"
                />
              </div>
            </div>
            <div className="em-field-row">
              <label>BCC (Optional)</label>
              <div className="em-input-chip-box em-chip-input-group">
                {renderChips(bccValues, (item) =>
                  handleRemoveChip(item, setBccValues),
                )}
                <input
                  type="text"
                  value={bccInput}
                  onChange={(e) => setBccInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (() => {
                      e.preventDefault();
                      const parsed = parseChips(bccInput);
                      if (parsed.length) {
                        setBccValues((prev) =>
                          Array.from(new Set([...prev, ...parsed])),
                        );
                        setBccInput("");
                      }
                    })()
                  }
                  onBlur={() => {
                    const parsed = parseChips(bccInput);
                    if (parsed.length) {
                      setBccValues((prev) =>
                        Array.from(new Set([...prev, ...parsed])),
                      );
                      setBccInput("");
                    }
                  }}
                  placeholder="Add BCC email and press Enter"
                />
              </div>
            </div>
          </section>

          {/* ── 5. Schedule ── */}
          <section className="em-section">
            <div className="em-step-number">5</div>
            <div className="em-section-header">
              <h2>Schedule</h2>
            </div>
            <div className="em-field-row em-field-grid">
              <div>
                <label>Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Repeat Every</label>
                <input
                  type="number"
                  min="1"
                  value={repeatEvery}
                  onChange={(e) => setRepeatEvery(Number(e.target.value))}
                />
              </div>
              <div>
                <label>On</label>
                <select
                  value={repeatOn}
                  onChange={(e) => setRepeatOn(e.target.value)}
                >
                  {WEEK_DAYS.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <div className="em-field-row em-field-grid">
              <div>
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label>End</label>
                <select
                  value={noEndDate ? "no_end" : "after_occurrences"}
                  onChange={(e) => setNoEndDate(e.target.value === "no_end")}
                >
                  <option value="no_end">No End Date</option>
                  <option value="after_occurrences">End After</option>
                </select>
                {!noEndDate && (
                  <div className="em-end-after">
                    <input
                      type="number"
                      min="1"
                      value={endAfterOccurrences}
                      onChange={(e) =>
                        setEndAfterOccurrences(Number(e.target.value))
                      }
                    />
                    <span>occurrences</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ── Preview Panel ── */}
        <aside className="em-preview-panel">
          <div className="em-preview-header">
            <div>
              <p className="em-status-pill">
                {sendingEnabled ? "Active" : "Sending stopped"}
              </p>
              <p className="em-preview-title">Email Preview</p>
              <p className="em-preview-subtitle">Preview as {previewEmail}</p>
            </div>
          </div>

          <div className="em-preview-card">
            <div className="em-preview-subject">Subject: {previewSubject}</div>
            <div className="em-preview-body">
              <div className="em-preview-brand">
                <span>PulseWork</span>
                <small>Smart Reports, Better Decisions</small>
              </div>
              <p>Dear John Doe,</p>
              <p>
                Please find attached the {categoryLabel} Report for{" "}
                {formatDateLabel(startDate)} to{" "}
                {formatDateLabel(endDate || startDate)}.
              </p>
              <div className="em-preview-summary">
                {summaryItems.map((item) => (
                  <div key={item.label} className="em-preview-summary-row">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div className="em-preview-fields">
                <div className="em-preview-fields-header">
                  <strong>{categoryLabel} Fields</strong>
                  <span>{selectedFieldDetails.length} selected</span>
                </div>
                <div className="em-preview-field-list">
                  {selectedFieldDetails.map((field) => (
                    <span key={field.key} className="em-preview-field-chip">
                      {field.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="em-preview-footer">
                {selectedCategoryTemplate?.isCustom && <p>{emailBody}</p>}
                <p>Report Scope: {selectedReportScope}</p>
                <p>
                  Report Period: {formatDateLabel(startDate)} -{" "}
                  {formatDateLabel(endDate || startDate)}
                </p>
                <p>Regards,</p>
                <p>WorkPulse System</p>
              </div>
            </div>
          </div>

          <div className="em-preview-attachment">
            <div>
              <strong>{categoryLabel.replace(/\s+/g, "_")}_Report.xlsx</strong>
              <span>248 KB</span>
            </div>
            <button type="button">Download</button>
          </div>

          <div className="em-preview-summary-card">
            <h3>Configuration Summary</h3>
            <div className="em-summary-row">
              <span>Report Type</span>
              <strong>
                {(REPORT_TYPES || []).find(
                  (item) =>
                    item.id === selectedReportType ||
                    item.value === selectedReportType,
                )?.label || "Custom Report"}
              </strong>
            </div>
            <div className="em-summary-row">
              <span>Category</span>
              <strong>{categoryLabel}</strong>
            </div>
            <div className="em-summary-row">
              <span>Fields</span>
              <strong>{selectedFieldDetails.length} selected</strong>
            </div>
            <div className="em-summary-row">
              <span>Scope</span>
              <strong>{selectedReportScope}</strong>
            </div>
            <div className="em-summary-row">
              <span>Send To</span>
              <strong>
                {sendToType === "All Employees"
                  ? "All Employees"
                  : `${sendToValues.length} recipient${
                      sendToValues.length === 1 ? "" : "s"
                    }`}
              </strong>
            </div>
            <div className="em-summary-row">
              <span>CC</span>
              <strong>
                {ccValues.length} Email{ccValues.length === 1 ? "" : "s"}
              </strong>
            </div>
            <div className="em-summary-row">
              <span>Frequency</span>
              <strong>
                {frequency} on {repeatOn} at {time}
              </strong>
            </div>
            <div className="em-summary-row">
              <span>Start Date</span>
              <strong>{formatDateLabel(startDate)}</strong>
            </div>
            <div className="em-summary-row">
              <span>End Date</span>
              <strong>
                {noEndDate
                  ? "No End Date"
                  : `After ${endAfterOccurrences} occurrences`}
              </strong>
            </div>
            <div className="em-summary-row">
              <span>Status</span>
              <strong>{sendingEnabled ? "Active" : "Sending stopped"}</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
