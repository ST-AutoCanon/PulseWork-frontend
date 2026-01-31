export const VALID_SALARY_HEADERS = [
  "Employee ID",            // → employee_id          (varchar(50) NOT NULL, UNIQUE)
  "Full Name",              // → full_name            (varchar(100))
  "Annual CTC",             // → annual_ctc           (decimal(15,2))
  "Basic Salary",           // → basic_salary         (decimal(15,2))
  "HRA",                    // → hra                  (decimal(15,2))
  "LTA",                    // → lta                  (decimal(15,2))
  "Other Allowances",       // → other_allowances     (decimal(15,2))
  "Incentives",             // → incentives           (decimal(15,2))
  "Overtime",               // → overtime             (decimal(15,2))
  "Statutory Bonus",        // → statutory_bonus      (decimal(15,2))
  "Bonus",                  // → bonus                (decimal(15,2))
  "Advance Recovery",       // → advance_recovery     (decimal(15,2))
  "Employee PF",            // → employee_pf          (decimal(15,2))
  "Employer PF",            // → employer_pf          (decimal(15,2))
  "ESIC",                   // → esic                 (decimal(15,2))
  "Gratuity",               // → gratuity             (decimal(15,2))
  "Professional Tax",       // → professional_tax     (decimal(15,2))
  "TDS",                    // → tds                  (decimal(12,2))
  "Insurance",              // → insurance            (decimal(12,2))
  "LOP Days",               // → lop_days             (int)
  "LOP Deduction",          // → lop_deduction        (decimal(12,2))
  "Gross Salary",           // → gross_salary         (decimal(15,2))
  "Net Salary",             // → net_salary           (decimal(15,2))
  "Payslip Generated",      // → payslip_generated    (int DEFAULT 0)
  "Status",                 // → status               (varchar(20) DEFAULT 'Approved')
  "Payslip Generation",     // → payslip_generation   (varchar(20) DEFAULT 'disabled')
  
  // Optional / auto-managed columns (usually not in Excel upload):
  // "id"              → auto-increment PK, do NOT include in upload
  // "created_at"      → timestamp DEFAULT CURRENT_TIMESTAMP, do NOT include
];