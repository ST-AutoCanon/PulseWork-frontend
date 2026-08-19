"use client";

import { useMemo, useState } from "react";
import { REPORT_COMPONENT_OPTIONS as REPORT_TYPES } from "../Report/ReportConstants";
import "./EmailManagement.css";

const CATEGORY_OPTIONS = [
  {
    id: "project_status",
    label: "Project Status Report",
    description: "Overall status of projects, tasks, milestones and progress.",
  },
  {
    id: "reimbursement",
    label: "Reimbursement Details",
    description: "Employee reimbursement requests and approvals.",
  },
  {
    id: "asset_details",
    label: "Asset Details & Utilization",
    description: "IT/hardware assets and utilization summary.",
  },
  {
    id: "task_time_frame",
    label: "Time Frame Task Report",
    description: "Tasks completed within a selected time frame.",
  },
  {
    id: "status_update",
    label: "Status Update Report",
    description: "Overall status updates for projects or tasks.",
  },
  {
    id: "department",
    label: "Department Report",
    description: "General report for a specific department.",
  },
  {
    id: "general",
    label: "General / Other Report",
    description: "Create a custom report with selected fields and filters.",
  },
];

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

export default function EmailManagement() {
  const [selectedReportType, setSelectedReportType] = useState("custom");
  const [reportTypePage, setReportTypePage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("reimbursement");
  const [categoryPage, setCategoryPage] = useState(0);
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

  /* ── Categories pagination (includes Create New) ── */
  const ALL_CATEGORY_ITEMS = useMemo(
    () => [
      ...CATEGORY_OPTIONS,
      {
        id: "__new__",
        label: "Create New Custom Report",
        description: "Build your own report from available data and filters.",
        isNew: true,
      },
    ],
    [],
  );

  const totalCategoryPages = Math.max(
    1,
    Math.ceil(ALL_CATEGORY_ITEMS.length / CATEGORIES_PER_PAGE),
  );

  const visibleCategories = useMemo(() => {
    const start = categoryPage * CATEGORIES_PER_PAGE;
    return ALL_CATEGORY_ITEMS.slice(start, start + CATEGORIES_PER_PAGE);
  }, [categoryPage, ALL_CATEGORY_ITEMS]);

  const categoryLabel = useMemo(() => {
    const found = CATEGORY_OPTIONS.find((item) => item.id === selectedCategory);
    return found?.label || "Reimbursement Details";
  }, [selectedCategory]);

  const reportOptionConfig =
    REPORT_OPTION_CONFIG[selectedCategory] ||
    REPORT_OPTION_CONFIG.reimbursement;

  const previewSubject = useMemo(() => {
    const report = (REPORT_TYPES || []).find(
      (item) =>
        item.id === selectedReportType || item.value === selectedReportType,
    );
    const reportLabel = report?.label || "Custom Report";
    return `${reportLabel} Scheduled Email: ${formatDateLabel(startDate)}${
      endDate ? ` to ${formatDateLabel(endDate)}` : ""
    }`;
  }, [selectedReportType, startDate, endDate]);

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
          <button className="em-btn em-btn-secondary">Test Email</button>
          <button className="em-btn em-btn-primary">Save Configuration</button>
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
                      onClick={() => setSelectedReportType(typeId)}
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
                  const isNew = category.isNew;
                  const isSelected = !isNew && selectedCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={`em-category-card ${
                        isSelected ? "selected" : ""
                      } ${isNew ? "em-new-category" : ""}`}
                      onClick={() => {
                        if (!isNew) setSelectedCategory(category.id);
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
              <p className="em-status-pill">Active</p>
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
              <div className="em-preview-footer">
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
              <strong>Active</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
