"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import "./vendorRegistration.css";

const initialForm = {
  company_name: "", registered_address: "", branch_address: "", city: "", state: "", pin_code: "",
  gst_number: "", pan_number: "", company_type: "", msme_status: "Not Applicable",
  contact1_name: "", contact1_designation: "", contact1_mobile: "", contact1_email: "",
  contact2_name: "", contact2_designation: "", contact2_mobile: "", contact2_email: "",
  contact3_name: "", contact3_designation: "", contact3_mobile: "", contact3_email: "",
  bank_name: "", branch: "", account_number: "", ifsc_code: "", nature_of_business: "",
  product_category: "", years_of_experience: "",
};

const fieldGroups = [
  { title: "Company Details", fields: ["company_name", "registered_address", "branch_address", "city", "state", "pin_code", "gst_number", "pan_number", "company_type", "msme_status"] },
  { title: "Contact Details - 1", fields: ["contact1_name", "contact1_designation", "contact1_mobile", "contact1_email"] },
  { title: "Contact Details - 2", fields: ["contact2_name", "contact2_designation", "contact2_mobile", "contact2_email"] },
  { title: "Contact Details - 3", fields: ["contact3_name", "contact3_designation", "contact3_mobile", "contact3_email"] },
  { title: "Bank Details", fields: ["bank_name", "branch", "account_number", "ifsc_code"] },
  { title: "Business Information", fields: ["nature_of_business", "product_category", "years_of_experience"] },
];

const documentFields = [
  { name: "gst_certificate", label: "GST Certificate", required: true },
  { name: "pan_card", label: "PAN Card", required: true },
  { name: "cancelled_cheque", label: "Cancelled Cheque" },
  { name: "msme_certificate", label: "MSME Certificate (if applicable)" },
  { name: "incorporation_certificate", label: "Company Incorporation Certificate" },
];

const fieldLabels = {
  company_name: "Company Name", registered_address: "Registered Address",
  branch_address: "Branch / Manufacturing Address", city: "City", state: "State",
  pin_code: "Pin Code", gst_number: "GST Number", pan_number: "PAN Number",
  company_type: "Company Type", msme_status: "MSME Status", contact1_name: "Contact Person Name",
  contact2_name: "Contact Person Name", contact3_name: "Contact Person Name",
  contact1_designation: "Designation", contact2_designation: "Designation", contact3_designation: "Designation",
  contact1_mobile: "Mobile Number", contact2_mobile: "Mobile Number", contact3_mobile: "Mobile Number",
  contact1_email: "Email ID", contact2_email: "Email ID", contact3_email: "Email ID",
  bank_name: "Bank Name", branch: "Branch", account_number: "Account Number", ifsc_code: "IFSC Code",
  nature_of_business: "Nature of Business", product_category: "Category of Products",
  years_of_experience: "Years of Experience",
};

const fieldLabel = (field) => fieldLabels[field] || field.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const requiredFields = ["company_name", "registered_address", "city", "state", "pin_code", "gst_number", "pan_number", "company_type", "msme_status", "contact1_name", "contact1_designation", "contact1_mobile", "contact1_email", "bank_name", "branch", "account_number", "ifsc_code", "nature_of_business", "product_category", "years_of_experience"];

export default function PublicVendorRegistration() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const orgId = searchParams.get("orgId");
  const [vendorName, setVendorName] = useState("");
  const [form, setForm] = useState(initialForm);
  const [documents, setDocuments] = useState({});
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [status, setStatus] = useState("Enter the username and password from your email.");
  const [valid, setValid] = useState(false);
  const [submissionState, setSubmissionState] = useState("idle");

  useEffect(() => {
    if (!token || !orgId) {
      setStatus("This registration link is invalid.");
    }
  }, [token, orgId]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateCredentials = (event) => setCredentials((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateDocument = (event) => setDocuments((current) => ({ ...current, [event.target.name]: event.target.files?.[0] || null }));
 const login = async (event) => {
  event.preventDefault();
  setStatus("Checking credentials...");

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  console.log("[PublicVendorRegistration] login attempt", {
    backendUrl,
    token,
    orgId,
    username: credentials.username,
  });

  try {
    const { data } = await axios.post(
      `${backendUrl}/vendors/public-registration/login`,
      {
        token,
        orgId,
        ...credentials,
      }
    );
    console.log("[PublicVendorRegistration] login success", data);
    setVendorName(data.vendorName);
    setForm((current) => ({ ...current, company_name: data.vendorName }));
    setValid(true);
    setSubmissionState("idle");
    setStatus("");
  } catch (error) {
    console.error("[PublicVendorRegistration] login error", {
      message: error.message,
      code: error.code,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      hasRequest: !!error.request,
    });
    if (error.response?.status === 409) setSubmissionState("already-submitted");
    setStatus(
      error.response?.data?.message ||
        (error.request
          ? "Could not reach the registration server. Please try again after the backend is running."
          : "Could not verify the registration credentials.")
    );
  }
};
  const submit = async (event) => {
    event.preventDefault();
    if (!/^\d+$/.test(String(form.years_of_experience)) || Number(form.years_of_experience) < 1) {
      setStatus("Years of experience must be a whole number greater than 0.");
      return;
    }
    setStatus("Submitting...");
    try {
      const payload = new FormData();
      Object.entries({ ...form, ...credentials, token, orgId }).forEach(([name, value]) => payload.append(name, value ?? ""));
      Object.entries(documents).forEach(([name, file]) => { if (file) payload.append(name, file); });
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/vendors/public-registration`, {
        method: "POST",
        body: payload,
      });
      const responseData = await response.json();
      if (!response.ok) {
        const error = new Error(responseData.message || "Could not submit the registration.");
        error.status = response.status;
        throw error;
      }
      setValid(false);
      setSubmissionState("success");
      
    } catch (error) {
      if (error.status === 409) setSubmissionState("already-submitted");
      setStatus(error.response?.data?.message || error.message || "Could not submit the registration.");
    }
  };

  const closeConfirmation = () => {
    if (window.history.length > 1) window.history.back();
    else window.close();
  };

  if (!valid) return (
    <main className="vendr0registration-public">
      <section className="vendr0registration-card vendr0registration-login-card">
        <div className="vendr0registration-brandbar">
          <div><span className="vendr0registration-eyebrow">PulseWork vendor portal</span><h1>Vendor Registration</h1></div>
        </div>
        <div className="vendr0registration-copy">
          <h2>{submissionState === "already-submitted" ? "Registration already submitted" : "Access your invitation"}</h2>
          <p>{status}</p>
        </div>
      {submissionState === "already-submitted" ? (
        <div className="vendr0registration-confirmation"><span className="vendr0registration-success-icon">✓</span><strong>Your registration is already submitted.</strong><span>The vendor team will review your details and contact you if anything else is required.</span><button type="button" className="vendr0registration-submit" onClick={closeConfirmation}>Close</button></div>
      ) : submissionState === "success" ? (
        <div className="vendr0registration-confirmation"><span className="vendr0registration-success-icon">✓</span><strong>Your vendor registration was submitted successfully.</strong><span>Your details have been sent to the vendor team for review.</span><button type="button" className="vendr0registration-submit" onClick={closeConfirmation}>Close</button></div>
      ) : token && orgId && (
        <form onSubmit={login}>
          <label className="vendr0registration-field">Username
            <input name="username" value={credentials.username} onChange={updateCredentials} required autoComplete="username" />
          </label>
          <label className="vendr0registration-field">Password
            <input name="password" type="password" value={credentials.password} onChange={updateCredentials} required autoComplete="current-password" />
          </label>
          <button className="vendr0registration-submit" type="submit">Continue to registration <span aria-hidden="true">→</span></button>
        </form>
      )}
      </section>
    </main>
  );
  return (
    <main className="vendr0registration-public">
      <section className="vendr0registration-card">
        <div className="vendr0registration-brandbar">
          <div><span className="vendr0registration-eyebrow">PulseWork vendor portal</span><h1>Vendor Registration</h1></div>
        </div>
        <div className="vendr0registration-copy"><h2>Company information</h2><p>Complete the details for <strong>{vendorName}</strong>. All fields use the same names as the vendor record.</p></div>
      <form onSubmit={submit}>
        {fieldGroups.map((group) => (
          <fieldset className="vendr0registration-section" key={group.title}>
            <legend>{group.title}</legend>
            <div className="vendr0registration-grid">
              {group.fields.map((name) => (
                <label className={`vendr0registration-field ${name.includes("address") ? "vendr0registration-wide" : ""}`} key={name}>{fieldLabel(name)}{requiredFields.includes(name) && <span className="vendr0registration-required">*</span>}
                  {name === "msme_status" ? (
                    <select name={name} value={form[name]} onChange={update}><option>Not Applicable</option><option>Applicable</option></select>
                  ) : (
                    <input name={name} type={name === "years_of_experience" ? "number" : name.includes("email") ? "email" : "text"} min={name === "years_of_experience" ? "1" : undefined} value={form[name]} onChange={update} required={requiredFields.includes(name)} />
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <fieldset className="vendr0registration-section">
          <legend>Documents Required (Attach Copies)</legend>
          <div className="vendr0registration-documents">
            {documentFields.map(({ name, label, required }) => (
              <label className="vendr0registration-field" key={name}>{label}{required && <span className="vendr0registration-required">*</span>}
                <input className="vendr0registration-file" name={name} type="file" onChange={updateDocument} accept=".pdf,.jpg,.jpeg,.png" required={required} />
              </label>
            ))}
          </div>
        </fieldset>
        <div className="vendr0registration-actions"><span>Review your details before submitting.</span><button className="vendr0registration-submit" type="submit">Submit Registration <span aria-hidden="true">→</span></button></div>
      </form>
      </section>
    </main>
  );
}