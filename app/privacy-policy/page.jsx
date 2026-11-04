import "./privacy-policy.css";
import PrintPolicyButton from "./PrintPolicyButton.client";

const LAST_UPDATED = "3 November 2026";

const employeeData = [
  "Personal and contact details, such as name, date of birth, email address, telephone number and address.",
  "Employment details, including employee ID, joining date, department, designation, reporting relationships and employment status.",
  "Identity and statutory details, such as PAN, Aadhaar or other identity information, where requested by the organisation or required for an enabled workflow.",
  "Bank, payroll, tax and reimbursement information, where the relevant modules are used.",
  "Attendance, punch records, work schedules, leave, regularisation requests and work-location information.",
  "Performance, training, project, task and workforce-management information.",
  "Documents submitted through the platform, such as identity proofs, resumes, certificates, forms and supporting records.",
  "Photographs or facial/biometric information, only where an organisation enables a relevant identity-verification or face-attendance feature.",
];

const vendorData = [
  "Company name, business address and contact details.",
  "Names and contact details of authorised representatives.",
  "Business registration and tax information, such as GST or PAN details, where collected for a business purpose.",
  "Bank account and payment-related details, where required for vendor or payment administration.",
  "Business contracts, purchase records, agreements and related correspondence.",
  "Documents such as licences, certificates, tax records and other supporting documents.",
];

const purposes = [
  {
    icon: "♙",
    title: "Employee management",
    text: "Employee records, onboarding, organisation structure and workforce administration.",
  },
  {
    icon: "▤",
    title: "HR operations",
    text: "Attendance, leave, travel, regularisation and other HR workflows.",
  },
  {
    icon: "₹",
    title: "Payroll and payments",
    text: "Payroll, reimbursements, benefits and vendor payment workflows, where enabled.",
  },
  {
    icon: "▣",
    title: "Performance and training",
    text: "Project, task, performance and training administration.",
  },
  {
    icon: "✉",
    title: "Communication",
    text: "Account activation, password reset, notices and service-related communication.",
  },
  {
    icon: "♧",
    title: "Vendor management",
    text: "Vendor onboarding, records, agreements and related administration.",
  },
  {
    icon: "▥",
    title: "Reporting and analytics",
    text: "Operational reports, audit support and workforce insights for authorised users.",
  },
];

const systems = [
  {
    icon: "▣",
    title: "PulseWork HRMS",
    text: "Core workforce-management application.",
  },
  {
    icon: "▤",
    title: "Formity / form builder",
    text: "Form submission and collection, where this integration is enabled.",
  },
  {
    icon: "✉",
    title: "Email service",
    text: "Activation, password reset and service notifications.",
  },
  {
    icon: "▦",
    title: "Database",
    text: "Application data storage and retrieval.",
  },
  {
    icon: "▥",
    title: "Analytics and reporting",
    text: "Operational insights and compliance reporting, where enabled.",
  },
  {
    icon: "⬡",
    title: "Security and monitoring",
    text: "Application and infrastructure logs, alerts and security monitoring, where configured.",
  },
];

const channels = [
  {
    icon: "▣",
    title: "HR / Admin portal",
    text: "Information entered by authorised HR personnel or administrators.",
  },
  {
    icon: "▤",
    title: "Employee self-service",
    text: "Profile updates, leave, attendance and other employee-submitted requests.",
  },
  {
    icon: "✉",
    title: "Email",
    text: "Account activation, password recovery and service communications.",
  },
  {
    icon: "▧",
    title: "Uploaded documents",
    text: "ID proofs, certificates, forms and other supporting files.",
  },
  {
    icon: "↗",
    title: "Integrations",
    text: "Information received from enabled third-party systems or services.",
  },
  {
    icon: "✎",
    title: "Authorised manual input",
    text: "Information entered by authorised users on behalf of an employee or vendor.",
  },
];

const securitySummary = [
  {
    icon: "▣",
    title: "Encryption",
    text: "HTTPS for web traffic and TLS-protected application/database connections; encryption at rest where configured.",
  },
  {
    icon: "♙",
    title: "Access control",
    text: "Role-based permissions, least-privilege access and restricted administrative functions.",
  },
  {
    icon: "⌘",
    title: "Network security",
    text: "VPS firewall rules, restricted database exposure and controlled SSH access.",
  },
  {
    icon: "◷",
    title: "Monitoring and audit",
    text: "Security logs, access monitoring and periodic review of relevant controls.",
  },
  {
    icon: "▤",
    title: "Backup and recovery",
    text: "Scheduled database backups, restricted backup access and documented recovery procedures.",
  },
  {
    icon: "⬡",
    title: "Vulnerability management",
    text: "Security updates, configuration reviews and remediation of identified issues.",
  },
];

function BulletList({ items }) {
  return (
    <ul className="pdp-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function NumberedSection({
  number,
  id,
  title,
  intro,
  children,
  className = "",
}) {
  return (
    <section id={id} className={`pdp-section ${className}`}>
      <div className="pdp-section-heading">
        <span className="pdp-number">{number}</span>
        <div>
          <h2>{title}</h2>
          {intro ? <p className="pdp-section-intro">{intro}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <article className="pdp-info-card">
      <span className="pdp-card-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}

export const metadata = {
  title: "Privacy & Data Protection Policy | PulseWork",
  description:
    "Learn how Sukalpa Tech collects, uses, stores, transfers and protects personal information through PulseWork.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="pdp-page">
      <div className="pdp-shell">
        <header className="pdp-hero">
          <div className="pdp-hero-copy">
            <span className="pdp-eyebrow">SUKALPA TECH · PULSEWORK</span>
            <h1>Privacy &amp; Data Protection (PDP) Policy</h1>
            <p className="pdp-hero-subtitle">
              Our commitment to protecting your personal data.
            </p>
            <p className="pdp-hero-description">
              At PulseWork, we use personal information to provide workforce and
              HRMS services. This policy explains what information may be
              collected, how it is used, where it is processed, how it is
              protected and the choices available to individuals.
            </p>
          </div>
          <div className="pdp-hero-art" aria-hidden="true">
            <div className="pdp-art-cloud" />
            <div className="pdp-art-server">
              <i />
              <i />
              <i />
            </div>
            <div className="pdp-art-shield">✓</div>
            <div className="pdp-art-lock">⌑</div>
          </div>
        </header>

        <nav className="pdp-nav" aria-label="Privacy policy sections">
          <a href="#overview">Overview</a>
          <a href="#information">Information we collect</a>
          <a href="#channels">Channels</a>
          <a href="#purposes">Purposes</a>
          <a href="#systems">Applications &amp; tools</a>
          <a href="#security">Storage &amp; security</a>
          <a href="#transfers">Data transfers</a>
          <a href="#retention">Retention</a>
          <a href="#rights">Your rights</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="pdp-document">
          <NumberedSection
            number="1"
            id="overview"
            title="Policy overview"
            intro="We collect only information that is relevant to legitimate HRMS, business, security and support purposes."
          >
            <div className="pdp-overview-panel">
              <span className="pdp-overview-icon" aria-hidden="true">
                ✓
              </span>
              <p>
                This policy applies to visitors to the PulseWork website,
                prospective customers, customer organisations, employees and
                other authorised users, vendors and their representatives whose
                information is processed through PulseWork. Depending on the
                relationship, Sukalpa Tech may operate the platform and process
                information on behalf of a customer organisation, or may handle
                information for its own website, account, support and
                business-administration purposes.
              </p>
            </div>
            <p className="pdp-muted-note">
              A customer organisation is responsible for determining its own
              employment and workforce-management purposes and for ensuring that
              information it submits to PulseWork is collected and shared
              lawfully.
            </p>
          </NumberedSection>

          <NumberedSection
            number="2"
            id="information"
            title="What information do we collect?"
            intro="The information processed depends on the organisation, modules enabled and the way you interact with PulseWork."
          >
            <div className="pdp-two-column">
              <article className="pdp-data-card pdp-blue-card">
                <div className="pdp-data-card-title">
                  <span className="pdp-avatar">●</span>
                  <div>
                    <h3>Employee information</h3>
                    <p>Collected during onboarding and HRMS activities.</p>
                  </div>
                </div>
                <BulletList items={employeeData} />
              </article>
              <article className="pdp-data-card pdp-purple-card">
                <div className="pdp-data-card-title">
                  <span className="pdp-avatar pdp-purple-avatar">◆</span>
                  <div>
                    <h3>Vendor information</h3>
                    <p>
                      Collected during vendor registration and administration.
                    </p>
                  </div>
                </div>
                <BulletList items={vendorData} />
              </article>
            </div>
            <div className="pdp-note">
              <strong>Website enquiries and technical information:</strong> We
              may also receive names, business contact details, organisation
              details and messages submitted through demo, purchase or contact
              forms. Our systems may generate session identifiers, timestamps,
              browser/device details, access records and diagnostic logs needed
              to operate, secure and troubleshoot the service.
            </div>
          </NumberedSection>

          <NumberedSection
            number="3"
            id="channels"
            title="Through which channels is information collected?"
            intro="Information may be provided directly by you, by your organisation or through enabled integrations."
          >
            <div className="pdp-card-grid pdp-six-grid">
              {channels.map((item) => (
                <InfoCard key={item.title} {...item} />
              ))}
            </div>
          </NumberedSection>

          <NumberedSection
            number="4"
            id="purposes"
            title="How do we use the information?"
            intro="We use information for legitimate business, workforce-management, service-delivery and security purposes."
          >
            <div className="pdp-card-grid pdp-purpose-grid">
              {purposes.map((item) => (
                <InfoCard key={item.title} {...item} />
              ))}
            </div>
            <p className="pdp-muted-note">
              We do not use employee or vendor information for purposes
              unrelated to the service or the relevant organisation's
              instructions, except where permitted or required by law.
            </p>
          </NumberedSection>

          <NumberedSection
            number="5"
            id="systems"
            title="Which applications and tools may process the information?"
            intro="The following categories describe the application and service components that may be involved in providing PulseWork. Availability depends on the deployment and enabled integrations."
          >
            <div className="pdp-card-grid pdp-six-grid">
              {systems.map((item) => (
                <InfoCard key={item.title} {...item} />
              ))}
            </div>
            <div className="pdp-flow-block">
              <h3>Employee onboarding and access flow</h3>
              <p className="pdp-flow-caption">
                A typical account activation journey may work as follows:
              </p>
              <div className="pdp-flow" aria-label="Employee onboarding flow">
                <div className="pdp-flow-step">
                  <span>＋</span>
                  <strong>Add employee</strong>
                  <small>HR/Admin enters authorised employee details</small>
                </div>
                <b className="pdp-flow-arrow" aria-hidden="true">
                  →
                </b>
                <div className="pdp-flow-step">
                  <span>✉</span>
                  <strong>Activation email</strong>
                  <small>System sends an account activation message</small>
                </div>
                <b className="pdp-flow-arrow" aria-hidden="true">
                  →
                </b>
                <div className="pdp-flow-step">
                  <span>⌑</span>
                  <strong>Set password</strong>
                  <small>
                    Employee follows the secure account setup process
                  </small>
                </div>
                <b className="pdp-flow-arrow" aria-hidden="true">
                  →
                </b>
                <div className="pdp-flow-step">
                  <span>↗</span>
                  <strong>Access PulseWork</strong>
                  <small>
                    Employee signs in and sees role-permitted features
                  </small>
                </div>
              </div>
              <div className="pdp-access-strip">
                <strong>Access may include enabled modules such as:</strong>
                <span>Attendance</span>
                <span>Leave</span>
                <span>Payroll</span>
                <span>Employee records</span>
                <span>Performance</span>
                <span>Reports</span>
              </div>
            </div>
          </NumberedSection>

          <NumberedSection
            number="6"
            id="security"
            title="How do we protect information?"
            intro="We apply technical and organisational safeguards intended to protect personal and business information against unauthorised access, loss, misuse or disclosure."
          >
            <div className="pdp-card-grid pdp-security-grid">
              {securitySummary.map((item) => (
                <InfoCard key={item.title} {...item} />
              ))}
            </div>

            <div className="pdp-security-details">
              <article className="pdp-detail-card">
                <h3>6.1 Database access security</h3>
                <BulletList
                  items={[
                    "The database is not intended to be publicly accessible.",
                    "Database connections are permitted only from authorised application servers and approved administrative systems.",
                    "Dedicated database accounts are used for application connectivity.",
                    "Database permissions follow the principle of least privilege.",
                    "Administrative database access is restricted to authorised personnel.",
                    "Administrative configuration and policy-management functions are restricted to authorised personnel.",
                    "Strong passwords and secure credential-management practices are enforced.",
                    "Database user permissions are reviewed periodically.",
                    "Unauthorised database access attempts are monitored where logging and monitoring controls are available.",
                  ]}
                />
              </article>

              <article className="pdp-detail-card">
                <h3>6.2 Database encryption and data protection</h3>
                <BulletList
                  items={[
                    "Application-to-database connections are protected using TLS encryption.",
                    "Database storage is protected using encryption-at-rest controls where configured by the hosting environment.",
                    "Backup files are encrypted and access-restricted.",
                    "Sensitive credentials are not stored in plain text.",
                    "User passwords are stored using secure password hashing rather than reversible plain-text storage.",
                    "Sensitive employee and vendor information is accessible only to authorised users.",
                    "Data access is controlled through application roles and permissions.",
                    "Access to uploaded documents and sensitive personal data is restricted to users with the required permissions.",
                  ]}
                />
              </article>

              <article className="pdp-detail-card">
                <h3>6.3 Firewall and network protection</h3>
                <BulletList
                  items={[
                    "VPS firewall rules restrict access to approved services.",
                    "Database ports are not unnecessarily exposed to public networks.",
                    "SSH access is restricted to authorised administrators.",
                    "Application and database communication is limited to required network paths.",
                    "Unnecessary public-facing services are disabled.",
                    "Network access and firewall configurations are reviewed periodically.",
                  ]}
                />
              </article>

              <article className="pdp-detail-card">
                <h3>6.4 Backup and disaster recovery</h3>
                <BulletList
                  items={[
                    "Database backups are scheduled regularly.",
                    "Backup copies are protected from unauthorised access.",
                    "Offsite or separate backup storage is maintained where configured.",
                    "Backup retention periods are defined.",
                    "Database restoration tests are performed periodically.",
                    "Recovery procedures are documented to support service restoration.",
                    "Backup failures are monitored and investigated.",
                  ]}
                />
              </article>

              <article className="pdp-detail-card pdp-detail-wide">
                <h3>6.5 Secure server and SSH administration</h3>
                <BulletList
                  items={[
                    "SSH access is restricted to authorised administrators.",
                    "SSH key-based authentication is preferred.",
                    "Direct root SSH login is disabled.",
                    "Password-based SSH authentication is disabled where key-based access has been deployed and tested.",
                    "SSH connections are restricted using firewall rules and approved IP addresses where practical.",
                    "Individual administrator accounts are used rather than shared accounts.",
                    "Authorised SSH keys are reviewed periodically.",
                    "Access is removed promptly when an administrator no longer requires it.",
                    "Failed SSH login attempts are monitored.",
                    "Sensitive infrastructure details, credentials and internal network configurations are not exposed in public-facing materials.",
                  ]}
                />
              </article>

              <article className="pdp-detail-card pdp-detail-wide">
                <h3>6.6 Cloud hosting and infrastructure</h3>

                <BulletList
                  items={[
                    "PulseWork is hosted on a Virtual Private Server (VPS) provided by InterServer.",
                    "The PulseWork application and its database are hosted within the same InterServer VPS environment.",
                    "The database is not hosted on a separate cloud database provider.",
                    "The VPS provides the computing environment used to operate the application and store its database.",
                    "Access to the VPS and its underlying infrastructure is restricted to authorised administrators.",
                    "The physical hosting location is determined by the InterServer data centre assigned to the VPS.",
                    "The hosting provider's infrastructure and applicable service arrangements may affect the location and processing of information.",
                  ]}
                />
              </article>
            </div>
            <p className="pdp-security-caveat">
              Security controls can vary by hosting environment, customer
              configuration and enabled features. Controls described as “where
              configured” or “where practical” apply only when that control has
              been enabled for the relevant deployment. No internet-based system
              can be guaranteed to be completely secure.
            </p>
          </NumberedSection>

          <NumberedSection
            number="7"
            id="transfers"
            title="Where is information hosted and processed?"
            intro="PulseWork uses an InterServer VPS environment for application hosting and database storage."
          >
            <div className="pdp-transfer-panel">
              <div className="pdp-globe" aria-hidden="true">
                ◎
              </div>

              <div>
                <h3>InterServer VPS hosting</h3>

                <p>
                  PulseWork is hosted on a Virtual Private Server (VPS) provided
                  by InterServer. The PulseWork application and its database
                  operate within the same VPS environment.
                </p>

                <p>
                  The database is hosted on the same cloud server infrastructure
                  as the application and is not maintained on a separate cloud
                  database service.
                </p>

                <div className="pdp-hosting-details">
                  <div>
                    <strong>Cloud infrastructure provider</strong>
                    <span>InterServer</span>
                  </div>

                  <div>
                    <strong>Hosting environment</strong>
                    <span>Virtual Private Server (VPS)</span>
                  </div>

                  <div>
                    <strong>Application hosting</strong>
                    <span>InterServer VPS</span>
                  </div>

                  <div>
                    <strong>Database hosting</strong>
                    <span>Same InterServer VPS environment</span>
                  </div>

                  <div>
                    <strong>Physical hosting location</strong>
                    <span>
                      [Insert verified InterServer data centre location]
                    </span>
                  </div>
                </div>

                <h3>International data processing</h3>

                <p>
                  Personal information may be stored or processed in the country
                  where the InterServer VPS is physically located. The hosting
                  location is determined by the data centre assigned to our VPS
                  deployment.
                </p>

                <p>
                  Where information is processed outside India, such processing
                  and any applicable international transfers are subject to
                  relevant Indian laws, contractual safeguards and applicable
                  restrictions.
                </p>

                <ul className="pdp-check-list">
                  <li>
                    Application and database hosting are provided through the
                    same VPS environment.
                  </li>

                  <li>
                    Database access is restricted to authorised application and
                    administrative systems.
                  </li>

                  <li>
                    Hosting and infrastructure access is limited to authorised
                    personnel.
                  </li>

                  <li>
                    The physical data centre location should be verified against
                    the actual VPS deployment.
                  </li>
                </ul>
              </div>
            </div>
          </NumberedSection>

          <NumberedSection
            number="8"
            id="retention"
            title="How long do we retain information?"
            intro="We retain personal information only for as long as it is reasonably necessary for the stated purposes, subject to legal, contractual and operational requirements."
          >
            <div className="pdp-retention-grid">
              <div>
                <span className="pdp-retention-icon">◷</span>
                <h3>During the service</h3>
                <p>
                  Account and workforce records are retained while needed to
                  provide the service and administer the customer relationship.
                </p>
              </div>
              <div>
                <span className="pdp-retention-icon">▤</span>
                <h3>Legal and audit needs</h3>
                <p>
                  Some records may be retained for statutory compliance,
                  security, dispute resolution or audit purposes.
                </p>
              </div>
              <div>
                <span className="pdp-retention-icon">↻</span>
                <h3>Deletion and backups</h3>
                <p>
                  When information is no longer required, it is deleted,
                  de-identified or otherwise disposed of as appropriate. Backup
                  copies may remain until the applicable backup rotation or
                  retention period ends.
                </p>
              </div>
            </div>
            <p className="pdp-muted-note">
              For employee records managed by an organisation, retention and
              deletion may be determined by that organisation's instructions and
              its legal obligations.
            </p>
          </NumberedSection>

          <NumberedSection
            number="9"
            id="rights"
            title="Your rights and choices"
            intro="Depending on applicable law and the role of Sukalpa Tech or the customer organisation, you may be able to exercise rights relating to your personal information."
          >
            <div className="pdp-rights-grid">
              <div>
                <b>⌕</b>
                <span>
                  <strong>Access</strong>
                  <small>
                    Request information about personal data processed about you.
                  </small>
                </span>
              </div>
              <div>
                <b>✎</b>
                <span>
                  <strong>Correction</strong>
                  <small>
                    Request correction of inaccurate or incomplete information.
                  </small>
                </span>
              </div>
              <div>
                <b>▤</b>
                <span>
                  <strong>Erasure</strong>
                  <small>
                    Request deletion where applicable and legally permissible.
                  </small>
                </span>
              </div>
              <div>
                <b>⊘</b>
                <span>
                  <strong>Consent choices</strong>
                  <small>
                    Withdraw consent where processing is based on consent.
                  </small>
                </span>
              </div>
              <div>
                <b>♙</b>
                <span>
                  <strong>Objection or restriction</strong>
                  <small>
                    Raise a concern about processing where applicable under law.
                  </small>
                </span>
              </div>
              <div>
                <b>✉</b>
                <span>
                  <strong>Grievance</strong>
                  <small>
                    Submit a privacy-related question, concern or complaint.
                  </small>
                </span>
              </div>
            </div>
            <p className="pdp-muted-note">
              If your information is held by PulseWork on behalf of your
              employer or another customer organisation, we may direct your
              request to that organisation or assist it in responding, as
              appropriate. We may need to verify your identity before acting on
              a request.
            </p>
          </NumberedSection>

          <NumberedSection
            number="10"
            id="contact"
            title="Contact and grievance redressal"
            intro="For privacy-related questions, requests or complaints, contact the privacy/grievance contact below."
          >
            <div className="pdp-contact-card">
              <div className="pdp-contact-main">
                <span className="pdp-contact-symbol" aria-hidden="true">
                  ✉
                </span>
                <div>
                  <h3>Sukalpa Tech</h3>
                  <p>Privacy and Data Protection Contact</p>
                  <a href="mailto:privacy@sukalpatechsolutions.com">
                    privacy@sukalpatechsolutions.com
                  </a>
                </div>
              </div>
              <div className="pdp-contact-divider" />
              <div className="pdp-contact-officer">
                <strong>Data Protection / Grievance Officer</strong>
                <span>[Insert officer's full name and designation]</span>
                <span>
                  [Confirm official business address before publication]
                </span>
              </div>
            </div>
            <p className="pdp-muted-note">
              Please do not email passwords, full bank details, identity
              documents or other sensitive information unless we have provided a
              secure method for submitting it.
            </p>
          </NumberedSection>

          <section className="pdp-extra-section">
            <h2>Additional information</h2>
            <div className="pdp-extra-grid">
              <article>
                <h3>Information sharing</h3>
                <p>
                  Information may be made available to the relevant customer
                  organisation and its authorised administrators, and to
                  hosting, email, support, security or integration providers
                  where needed to operate PulseWork. We may also disclose
                  information where required by law or to protect the service
                  and individuals.
                </p>
              </article>
              <article>
                <h3>Cookies and session technologies</h3>
                <p>
                  PulseWork may use essential cookies, session identifiers and
                  browser storage to maintain sign-in sessions, protect accounts
                  and support platform features. Disabling essential cookies may
                  affect login and other functionality. Any non-essential
                  analytics or tracking technologies should be disclosed
                  according to the tools enabled on the relevant website.
                </p>
              </article>
              <article>
                <h3>Third-party websites</h3>
                <p>
                  PulseWork may link to or work with third-party websites or
                  services. Their privacy practices are governed by their own
                  policies, which users should review separately.
                </p>
              </article>
              <article>
                <h3>Policy updates</h3>
                <p>
                  We may revise this policy when our services, processing
                  activities or legal requirements change. The latest version
                  and revision date will be published on this page.
                </p>
              </article>
              <article>
                <h3>Organisation responsibilities</h3>
                <p>
                  Customer organisations are responsible for choosing
                  appropriate HRMS features, setting user permissions and
                  ensuring they have a lawful basis and required notices for
                  information they submit.
                </p>
              </article>
            </div>
          </section>

          <footer className="pdp-footer">
            <p>
              ⓘ This policy is reviewed periodically and may be updated to
              reflect applicable laws and business requirements.
            </p>
            <span>Last updated: {LAST_UPDATED}</span>
            <PrintPolicyButton />
          </footer>
        </div>

        <div className="pdp-bottom-footer">
          <span>© 2025 Sukalpa Tech. All Rights Reserved.</span>
          <a href="/">Back to PulseWork</a>
        </div>
      </div>
    </main>
  );
}
