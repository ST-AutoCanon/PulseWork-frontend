export const MAX_DOWNLOAD_FIELDS = 13;
export const PREVIEW_PAGE_SIZE = 10;
export const MAX_RANGE_DAYS = 62;

export const STATUS_OPTIONS = {
  leaves: ["All", "Pending", "Approved", "Rejected"],
  reimbursements: [
    "All",
    "Pending",
    "Approved",
    "Rejected",
    "Approved/Pending",
    "Approved/Paid",
  ],
  employees: ["All", "Active", "Inactive"],
  assets: ["All", "Assigned", "Unassigned", "Returned", "Decommissioned"],
  attendance: ["All", "Punch In", "Punch Out"],
  tasks_supervisor: [
    "All",
    "Completed",
    "Yet to Start",
    "In Progress",
    "on hold",
  ],
  tasks_employee: ["All", "Completed", "Not started", "Working"],
};

export const SUB_OPTIONS = {
  leaves: [
    { key: "leave_id", label: "Leave ID" },
    { key: "employee_id", label: "Employee ID" },
    { key: "employee_name", label: "Employee Name" },
    { key: "department_name", label: "Department" },
    { key: "leave_type", label: "Leave Type" },
    { key: "H_F_day", label: "Half/Full Day" },
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },
    { key: "status", label: "Status" },
    { key: "reason", label: "Reason" },
    { key: "comments", label: "Comments" },
    { key: "is_defaulted", label: "Is Defaulted" },
    { key: "compensated_days", label: "Compensated Days" },
    { key: "deducted_days", label: "Deducted Days" },
    { key: "loss_of_pay_days", label: "Loss of Pay (LOP)" },
    { key: "preserved_leave_days", label: "Preserved Leaves" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
  ],

  reimbursements: [
    { key: "id", label: "Reimbursement ID" },
    { key: "employee_id", label: "Employee ID" },
    { key: "employee_name", label: "Employee Name" },
    { key: "approval_status", label: "Approval Status" },
    { key: "payment_status", label: "Payment Status" },
    { key: "department_id", label: "Department ID" },
    { key: "department_name", label: "Department" },

    { key: "claim_type", label: "Claim Type" },
    { key: "transport_type", label: "Transport Type" },
    { key: "from_date", label: "From Date" },
    { key: "to_date", label: "To Date" },
    { key: "date", label: "Date" },
    { key: "travel_from", label: "Travel From" },
    { key: "travel_to", label: "Travel To" },
    { key: "purpose", label: "Purpose" },
    { key: "purchasing_item", label: "Purchasing Item" },
    { key: "accommodation_fees", label: "Accommodation Fees" },
    { key: "no_of_days", label: "No. of Days" },
    { key: "total_amount", label: "Total Amount" },
    { key: "meal_type", label: "Meal Type" },
    { key: "service_provider", label: "Service Provider" },

    { key: "approver_name", label: "Approver Name" },
    { key: "approver_designation", label: "Approver Designation" },
    { key: "approver_id", label: "Approver ID" },
    { key: "approver_comments", label: "Approver Comments" },
    { key: "approved_date", label: "Approved Date" },

    { key: "da", label: "DA" },
    { key: "transport_amount", label: "Transport Amount" },
    { key: "stationary", label: "Stationary" },
    { key: "paid_date", label: "Paid Date" },
    { key: "project", label: "Project" },
    { key: "meals_objective", label: "Meals Objective" },

    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
  ],

  employees: [
    { key: "employee_id", label: "Employee ID" },
    { key: "employee_name", label: "Employee Name" },
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone_number", label: "Phone" },

    { key: "status", label: "Status" },

    { key: "domain", label: "Domain" },
    { key: "employee_type", label: "Employee Type" },
    { key: "role", label: "Role" },
    { key: "department_id", label: "Department ID" },
    { key: "department_name", label: "Department" },
    { key: "position", label: "Position" },
    { key: "supervisor_id", label: "Supervisor ID" },
    { key: "joining_date", label: "Joining Date" },
    { key: "address", label: "Address" },
    { key: "gender", label: "Gender" },

    { key: "aadhaar_number", label: "Aadhaar Number" },

    { key: "created_at", label: "Created At" },
  ],

  vendors: [
    { key: "vendor_id", label: "Vendor ID" },
    { key: "company_name", label: "Company" },
    { key: "registered_address", label: "Registered Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "pin_code", label: "PIN Code" },
    { key: "gst_number", label: "GST Number" },
    { key: "pan_number", label: "PAN Number" },
    { key: "company_type", label: "Company Type" },
    { key: "contact1_mobile", label: "Contact Mobile" },
    { key: "contact1_email", label: "Contact Email" },
    { key: "bank_name", label: "Bank Name" },
    { key: "branch", label: "Bank Branch" },
    { key: "account_number", label: "Account Number" },
    { key: "ifsc_code", label: "IFSC Code" },
    { key: "product_category", label: "Product Category" },
    { key: "years_of_experience", label: "Years of Experience" },
    { key: "created_at", label: "Created At" },
  ],

  assets: [
    { key: "asset_id", label: "Asset ID" },
    { key: "asset_code", label: "Asset Code" },
    { key: "asset_name", label: "Asset Name" },
    { key: "configuration", label: "Configuration" },
    { key: "category", label: "Category" },
    { key: "sub_category", label: "Sub Category" },
    { key: "assigned_to", label: "Assigned To" },
    { key: "document_path", label: "Document Path" },
    { key: "valuation_date", label: "Valuation Date" },
    { key: "status", label: "Status" },
    { key: "count", label: "Count" },
    { key: "created_at", label: "Created At" },
  ],

  attendance: [
    { key: "punch_id", label: "Punch ID" },
    { key: "employee_id", label: "Employee ID" },
    { key: "employee_name", label: "Employee Name" },
    { key: "punch_status", label: "Status" },
    { key: "punchin_time", label: "Punch In Time" },
    { key: "punchin_device", label: "Punch In Device" },
    { key: "punchin_location", label: "Punch In Location" },
    { key: "punchout_time", label: "Punch Out Time" },
    { key: "punchout_device", label: "Punch Out Device" },
    { key: "punchout_location", label: "Punch Out Location" },
    { key: "punchmode", label: "Punch Mode" },
    { key: "created_at", label: "Created At" },
  ],

  tasks_supervisor: [
    { key: "task_id", label: "Task ID" },
    { key: "employee_id", label: "Employee ID" },
    { key: "employee_name", label: "Employee Name" },
    { key: "task_title", label: "Task Title" },
    { key: "description", label: "Description" },
    { key: "start_date", label: "Start Date" },
    { key: "due_date", label: "Due Date" },
    { key: "status", label: "Status" },
    { key: "percentage", label: "% Complete" },
    { key: "progress_percentage", label: "Progress %" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
  ],

  tasks_employee: [
    { key: "week_id", label: "Week ID" },
    { key: "task_date", label: "Task Date" },
    { key: "project_id", label: "Project ID" },
    { key: "project_name", label: "Project Name" },
    { key: "task_id", label: "Task ID" },
    { key: "task_name", label: "Weekly Task Name" },
    { key: "replacement_task", label: "Replacement Task" },
    { key: "employee_id", label: "Employee ID" },
    { key: "employee_name", label: "Employee Name" },
    { key: "emp_status", label: "Employee Status" },
    { key: "emp_comment", label: "Employee Comment" },
    { key: "sup_status", label: "Supervisor Status" },
    { key: "sup_comment", label: "Supervisor Comment" },
    { key: "sup_review_status", label: "Supervisor Review Status" },
    { key: "star_rating", label: "Star Rating" },
    { key: "parent_task_id", label: "Parent Task ID" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
  ],
};

export function getFieldDisplayMap(component) {
  const list = SUB_OPTIONS[component];
  if (!Array.isArray(list)) return {};
  const map = {};
  for (const it of list) {
    map[it.key] = it.label;
  }
  return map;
}

export function getFieldLabel(component, key, fallback = null) {
  const map = getFieldDisplayMap(component);
  if (map && typeof map[key] !== "undefined") return map[key];
  return fallback === null ? key : fallback;
}

export function getDefaultDownloadFields(component, max = MAX_DOWNLOAD_FIELDS) {
  const list = SUB_OPTIONS[component];
  if (!Array.isArray(list)) return [];
  return list.slice(0, max).map((i) => i.key);
}

export default {
  MAX_DOWNLOAD_FIELDS,
  PREVIEW_PAGE_SIZE,
  MAX_RANGE_DAYS,
  STATUS_OPTIONS,
  SUB_OPTIONS,
  getFieldDisplayMap,
  getFieldLabel,
  getDefaultDownloadFields,
};
