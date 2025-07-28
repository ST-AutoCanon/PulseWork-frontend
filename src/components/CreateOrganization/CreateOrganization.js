// // // // // // // // // // // // import React, { useState } from "react";
// // // // // // // // // // // // import "./CreateOrganization.css";

// // // // // // // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // // // // // // //   const [name, setName] = useState("");
// // // // // // // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // // // // // // //   const [message, setMessage] = useState("");

// // // // // // // // // // // //   const handleSubmit = async (e) => {
// // // // // // // // // // // //     e.preventDefault();
// // // // // // // // // // // //     setMessage("");

// // // // // // // // // // // //     try {
// // // // // // // // // // // //       const response = await fetch(
// // // // // // // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // // // // // // //         {
// // // // // // // // // // // //           method: "POST",
// // // // // // // // // // // //           headers: {
// // // // // // // // // // // //             "Content-Type": "application/json",
// // // // // // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // // // // // //             "x-employee-id": employeeId, // ✅ using from props
// // // // // // // // // // // //           },
// // // // // // // // // // // //           body: JSON.stringify({
// // // // // // // // // // // //             Name: name,
// // // // // // // // // // // //             subdomain: subdomain,
// // // // // // // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // // // // // // //           }),
// // // // // // // // // // // //         }
// // // // // // // // // // // //       );

// // // // // // // // // // // //       const data = await response.json();

// // // // // // // // // // // //       if (response.ok) {
// // // // // // // // // // // //         setMessage(data.message || "Organization created successfully.");
// // // // // // // // // // // //         setName("");
// // // // // // // // // // // //         setSubdomain("");
// // // // // // // // // // // //         setNoEmployees("");
// // // // // // // // // // // //         setShowForm(false);
// // // // // // // // // // // //       } else {
// // // // // // // // // // // //         setMessage(data.error || "Failed to create organization.");
// // // // // // // // // // // //       }
// // // // // // // // // // // //     } catch (error) {
// // // // // // // // // // // //       console.error("Create organization error:", error);
// // // // // // // // // // // //       setMessage("Server error. Please try again later.");
// // // // // // // // // // // //     }
// // // // // // // // // // // //   };

// // // // // // // // // // // //   return (
// // // // // // // // // // // //     <div className="create-org-wrapper">
// // // // // // // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(!showForm)}>
// // // // // // // // // // // //         {showForm ? "Close Form" : "➕ Add Organization"}
// // // // // // // // // // // //       </button>

// // // // // // // // // // // //       {showForm && (
// // // // // // // // // // // //         <div className="create-org-container">
// // // // // // // // // // // //           <h2>Create New Organization</h2>
// // // // // // // // // // // //           <form className="org-form" onSubmit={handleSubmit}>
// // // // // // // // // // // //             <label>Organization Name:</label>
// // // // // // // // // // // //             <input
// // // // // // // // // // // //               type="text"
// // // // // // // // // // // //               value={name}
// // // // // // // // // // // //               onChange={(e) => setName(e.target.value)}
// // // // // // // // // // // //               placeholder="e.g. Sukalpa Tech"
// // // // // // // // // // // //               required
// // // // // // // // // // // //             />

// // // // // // // // // // // //             <label>Subdomain:</label>
// // // // // // // // // // // //             <input
// // // // // // // // // // // //               type="text"
// // // // // // // // // // // //               value={subdomain}
// // // // // // // // // // // //               onChange={(e) => setSubdomain(e.target.value)}
// // // // // // // // // // // //               placeholder="e.g. sukalpa"
// // // // // // // // // // // //               required
// // // // // // // // // // // //             />

// // // // // // // // // // // //             <label>Number of Employees:</label>
// // // // // // // // // // // //             <input
// // // // // // // // // // // //               type="number"
// // // // // // // // // // // //               value={noEmployees}
// // // // // // // // // // // //               onChange={(e) => setNoEmployees(e.target.value)}
// // // // // // // // // // // //               placeholder="e.g. 50"
// // // // // // // // // // // //               required
// // // // // // // // // // // //             />

// // // // // // // // // // // //             <button type="submit" className="submit-btn">
// // // // // // // // // // // //               Create Organization
// // // // // // // // // // // //             </button>
// // // // // // // // // // // //           </form>

// // // // // // // // // // // //           {message && <p className="message">{message}</p>}
// // // // // // // // // // // //         </div>
// // // // // // // // // // // //       )}
// // // // // // // // // // // //     </div>
// // // // // // // // // // // //   );
// // // // // // // // // // // // };

// // // // // // // // // // // // export default CreateOrganization;

// // // // // // // // // // // import React, { useState } from "react";
// // // // // // // // // // // import "./CreateOrganization.css";

// // // // // // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // // // // // //   const [name, setName] = useState("");
// // // // // // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // // // // // //   const [message, setMessage] = useState("");

// // // // // // // // // // //   const handleSubmit = async (e) => {
// // // // // // // // // // //     e.preventDefault();
// // // // // // // // // // //     setMessage("");

// // // // // // // // // // //     try {
// // // // // // // // // // //       const response = await fetch(
// // // // // // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // // // // // //         {
// // // // // // // // // // //           method: "POST",
// // // // // // // // // // //           headers: {
// // // // // // // // // // //             "Content-Type": "application/json",
// // // // // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // // // // //             "x-employee-id": employeeId, // ✅ Using from props
// // // // // // // // // // //           },
// // // // // // // // // // //           body: JSON.stringify({
// // // // // // // // // // //             Name: name,
// // // // // // // // // // //             subdomain: subdomain,
// // // // // // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // // // // // //           }),
// // // // // // // // // // //         }
// // // // // // // // // // //       );

// // // // // // // // // // //       const data = await response.json();

// // // // // // // // // // //       if (response.ok) {
// // // // // // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // // // // // //         setName("");
// // // // // // // // // // //         setSubdomain("");
// // // // // // // // // // //         setNoEmployees("");
// // // // // // // // // // //         // ✅ Form remains open
// // // // // // // // // // //       } else {
// // // // // // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // // // // // //       }
// // // // // // // // // // //     } catch (error) {
// // // // // // // // // // //       console.error("Create organization error:", error);
// // // // // // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // // // // // //     }
// // // // // // // // // // //   };

// // // // // // // // // // //   return (
// // // // // // // // // // //     <div className="create-org-wrapper">
// // // // // // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(!showForm)}>
// // // // // // // // // // //         {showForm ? "Close Form" : "➕ Add Organization"}
// // // // // // // // // // //       </button>

// // // // // // // // // // //       {showForm && (
// // // // // // // // // // //         <div className="create-org-container">
// // // // // // // // // // //           <h2>Create New Organization</h2>
// // // // // // // // // // //           <form className="org-form" onSubmit={handleSubmit}>
// // // // // // // // // // //             <label>Organization Name:</label>
// // // // // // // // // // //             <input
// // // // // // // // // // //               type="text"
// // // // // // // // // // //               value={name}
// // // // // // // // // // //               onChange={(e) => setName(e.target.value)}
// // // // // // // // // // //               placeholder="e.g. Sukalpa Tech"
// // // // // // // // // // //               required
// // // // // // // // // // //             />

// // // // // // // // // // //             <label>Subdomain:</label>
// // // // // // // // // // //             <input
// // // // // // // // // // //               type="text"
// // // // // // // // // // //               value={subdomain}
// // // // // // // // // // //               onChange={(e) => setSubdomain(e.target.value)}
// // // // // // // // // // //               placeholder="e.g. sukalpa"
// // // // // // // // // // //               required
// // // // // // // // // // //             />

// // // // // // // // // // //             <label>Number of Employees:</label>
// // // // // // // // // // //             <input
// // // // // // // // // // //               type="number"
// // // // // // // // // // //               value={noEmployees}
// // // // // // // // // // //               onChange={(e) => setNoEmployees(e.target.value)}
// // // // // // // // // // //               placeholder="e.g. 50"
// // // // // // // // // // //               required
// // // // // // // // // // //             />

// // // // // // // // // // //             <button type="submit" className="submit-btn">
// // // // // // // // // // //               Create Organization
// // // // // // // // // // //             </button>
// // // // // // // // // // //           </form>

// // // // // // // // // // //           {message && <p className="message">{message}</p>}
// // // // // // // // // // //         </div>
// // // // // // // // // // //       )}
// // // // // // // // // // //     </div>
// // // // // // // // // // //   );
// // // // // // // // // // // };

// // // // // // // // // // // export default CreateOrganization;

// // // // // // // // // // import React, { useState } from "react";
// // // // // // // // // // import "./CreateOrganization.css";

// // // // // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // // // // //   const [name, setName] = useState("");
// // // // // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // // // // //   const [message, setMessage] = useState("");

// // // // // // // // // //   const handleSubmit = async (e) => {
// // // // // // // // // //     e.preventDefault();
// // // // // // // // // //     setMessage("");

// // // // // // // // // //     try {
// // // // // // // // // //       const response = await fetch(
// // // // // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // // // // //         {
// // // // // // // // // //           method: "POST",
// // // // // // // // // //           headers: {
// // // // // // // // // //             "Content-Type": "application/json",
// // // // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // // // //             "x-employee-id": employeeId,
// // // // // // // // // //           },
// // // // // // // // // //           body: JSON.stringify({
// // // // // // // // // //             Name: name,
// // // // // // // // // //             subdomain: subdomain,
// // // // // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // // // // //           }),
// // // // // // // // // //         }
// // // // // // // // // //       );

// // // // // // // // // //       const data = await response.json();

// // // // // // // // // //       if (response.ok) {
// // // // // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // // // // //         setName("");
// // // // // // // // // //         setSubdomain("");
// // // // // // // // // //         setNoEmployees("");
// // // // // // // // // //       } else {
// // // // // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // // // // //       }
// // // // // // // // // //     } catch (error) {
// // // // // // // // // //       console.error("Create organization error:", error);
// // // // // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // // // // //     }
// // // // // // // // // //   };

// // // // // // // // // //   return (
// // // // // // // // // //     <div className="create-org-wrapper">
// // // // // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // // // // //         ➕ Add Organization
// // // // // // // // // //       </button>

// // // // // // // // // //       {showForm && (
// // // // // // // // // //         <div className="create-org-container">
// // // // // // // // // //           <div className="form-header">
// // // // // // // // // //             <h2>Create New Organization</h2>
// // // // // // // // // //             <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // // // // // //               ✖
// // // // // // // // // //             </span>
// // // // // // // // // //           </div>

// // // // // // // // // //           <form className="org-form" onSubmit={handleSubmit}>
// // // // // // // // // //             <label>Organization Name:</label>
// // // // // // // // // //             <input
// // // // // // // // // //               type="text"
// // // // // // // // // //               value={name}
// // // // // // // // // //               onChange={(e) => setName(e.target.value)}
// // // // // // // // // //               placeholder="e.g. Sukalpa Tech"
// // // // // // // // // //               required
// // // // // // // // // //             />

// // // // // // // // // //             <label>Subdomain:</label>
// // // // // // // // // //             <input
// // // // // // // // // //               type="text"
// // // // // // // // // //               value={subdomain}
// // // // // // // // // //               onChange={(e) => setSubdomain(e.target.value)}
// // // // // // // // // //               placeholder="e.g. sukalpa"
// // // // // // // // // //               required
// // // // // // // // // //             />

// // // // // // // // // //             <label>Number of Employees:</label>
// // // // // // // // // //             <input
// // // // // // // // // //               type="number"
// // // // // // // // // //               value={noEmployees}
// // // // // // // // // //               onChange={(e) => setNoEmployees(e.target.value)}
// // // // // // // // // //               placeholder="e.g. 50"
// // // // // // // // // //               required
// // // // // // // // // //             />

// // // // // // // // // //             <button type="submit" className="submit-btn">
// // // // // // // // // //               Create Organization
// // // // // // // // // //             </button>
// // // // // // // // // //           </form>

// // // // // // // // // //           {message && <p className="message">{message}</p>}
// // // // // // // // // //         </div>
// // // // // // // // // //       )}
// // // // // // // // // //     </div>
// // // // // // // // // //   );
// // // // // // // // // // };

// // // // // // // // // // export default CreateOrganization;

// // // // // // // // // // import React, { useState } from "react";
// // // // // // // // // // import "./CreateOrganization.css";

// // // // // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // // // // //   const [name, setName] = useState("");
// // // // // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // // // // //   const [message, setMessage] = useState("");

// // // // // // // // // //   const handleSubmit = async (e) => {
// // // // // // // // // //     e.preventDefault();
// // // // // // // // // //     setMessage("");

// // // // // // // // // //     try {
// // // // // // // // // //       const response = await fetch(
// // // // // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // // // // //         {
// // // // // // // // // //           method: "POST",
// // // // // // // // // //           headers: {
// // // // // // // // // //             "Content-Type": "application/json",
// // // // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // // // //             "x-employee-id": employeeId,
// // // // // // // // // //           },
// // // // // // // // // //           body: JSON.stringify({
// // // // // // // // // //             Name: name,
// // // // // // // // // //             subdomain: subdomain,
// // // // // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // // // // //             company_address: companyAddress,
// // // // // // // // // //             c_pan_no: cPanNo,
// // // // // // // // // //             admin_email: adminEmail,
// // // // // // // // // //             contact_email_id: contactEmail,
// // // // // // // // // //             contact_phone_no: contactPhone,
// // // // // // // // // //             start_date: startDate,
// // // // // // // // // //             end_date: endDate,
// // // // // // // // // //           }),
// // // // // // // // // //         }
// // // // // // // // // //       );

// // // // // // // // // //       const data = await response.json();

// // // // // // // // // //       if (response.ok) {
// // // // // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // // // // //         setName("");
// // // // // // // // // //         setSubdomain("");
// // // // // // // // // //         setNoEmployees("");
// // // // // // // // // //         setCompanyAddress("");
// // // // // // // // // //         setCPanNo("");
// // // // // // // // // //         setAdminEmail("");
// // // // // // // // // //         setContactEmail("");
// // // // // // // // // //         setContactPhone("");
// // // // // // // // // //         setStartDate("");
// // // // // // // // // //         setEndDate("");
// // // // // // // // // //       } else {
// // // // // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // // // // //       }
// // // // // // // // // //     } catch (error) {
// // // // // // // // // //       console.error("Create organization error:", error);
// // // // // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // // // // //     }
// // // // // // // // // //   };

// // // // // // // // // //   return (
// // // // // // // // // //     <div className="create-org-wrapper">
// // // // // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // // // // //         ➕ Add Organization
// // // // // // // // // //       </button>

// // // // // // // // // //       {showForm && (
// // // // // // // // // //         <div className="create-org-container">
// // // // // // // // // //           <div className="form-header">
// // // // // // // // // //             <h2>Create New Organization</h2>
// // // // // // // // // //             <span className="close-icon" onClick={() => setShowForm(false)}>✖</span>
// // // // // // // // // //           </div>

// // // // // // // // // //           <form className="org-form" onSubmit={handleSubmit}>
// // // // // // // // // //             <label>Organization Name:</label>
// // // // // // // // // //             <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

// // // // // // // // // //            <label>Display Name:</label>
// // // // // // // // // // <input
// // // // // // // // // //   type="text"
// // // // // // // // // //   value={subdomain}
// // // // // // // // // //   onChange={(e) => setSubdomain(e.target.value)}
// // // // // // // // // //   placeholder="e.g. sukalpa"
// // // // // // // // // //   required
// // // // // // // // // // />

// // // // // // // // // //             <label>Number of Employees:</label>
// // // // // // // // // //             <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />

// // // // // // // // // //             <label>Company Address:</label>
// // // // // // // // // //             <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />

// // // // // // // // // //             <label>Company PAN No:</label>
// // // // // // // // // //             <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />

// // // // // // // // // //             <label>Admin Email ID:</label>
// // // // // // // // // //             <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />

// // // // // // // // // //             <label>Contact Email ID:</label>
// // // // // // // // // //             <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />

// // // // // // // // // //             <label>Contact Phone No:</label>
// // // // // // // // // //             <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />

// // // // // // // // // //             <label>Start Date:</label>
// // // // // // // // // //             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />

// // // // // // // // // //             <label>End Date:</label>
// // // // // // // // // //             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />

// // // // // // // // // //             <button type="submit" className="submit-btn">
// // // // // // // // // //               Create Organization
// // // // // // // // // //             </button>
// // // // // // // // // //           </form>

// // // // // // // // // //           {message && <p className="message">{message}</p>}
// // // // // // // // // //         </div>
// // // // // // // // // //       )}
// // // // // // // // // //     </div>
// // // // // // // // // //   );
// // // // // // // // // // };

// // // // // // // // // // export default CreateOrganization;

// // // // // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // // // // import "./CreateOrganization.css";

// // // // // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // // // // //   const [name, setName] = useState("");
// // // // // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // // // // //   const [roles, setRoles] = useState([]); // ✅ fetched roles
// // // // // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // // // // //   const [message, setMessage] = useState("");

// // // // // // // // // //   useEffect(() => {
// // // // // // // // // //   const fetchRoles = async () => {
// // // // // // // // // //     try {
// // // // // // // // // //       const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // // // // //         method: "GET",
// // // // // // // // // //         headers: {
// // // // // // // // // //           "Content-Type": "application/json",
// // // // // // // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // // // //           "x-employee-id": employeeId,
// // // // // // // // // //         },
// // // // // // // // // //       });

// // // // // // // // // //       if (!res.ok) {
// // // // // // // // // //         throw new Error("Failed to fetch roles: " + res.status);
// // // // // // // // // //       }

// // // // // // // // // //       const data = await res.json();

// // // // // // // // // //       if (!Array.isArray(data)) {
// // // // // // // // // //         throw new Error("Invalid response format");
// // // // // // // // // //       }

// // // // // // // // // //       const uniqueRoles = [...new Set(data.map((r) => r.role_name))];
// // // // // // // // // //       setRoles(uniqueRoles);
// // // // // // // // // //     } catch (err) {
// // // // // // // // // //       console.error("Role fetch error:", err);
// // // // // // // // // //     }
// // // // // // // // // //   };

// // // // // // // // // //   fetchRoles();
// // // // // // // // // // }, [employeeId]);


// // // // // // // // // //   const handleRoleToggle = (role) => {
// // // // // // // // // //     setSelectedRoles((prev) =>
// // // // // // // // // //       prev.includes(role)
// // // // // // // // // //         ? prev.filter((r) => r !== role)
// // // // // // // // // //         : [...prev, role]
// // // // // // // // // //     );
// // // // // // // // // //   };

// // // // // // // // // //   const handleSubmit = async (e) => {
// // // // // // // // // //     e.preventDefault();
// // // // // // // // // //     setMessage("");

// // // // // // // // // //     try {
// // // // // // // // // //       const response = await fetch(
// // // // // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // // // // //         {
// // // // // // // // // //           method: "POST",
// // // // // // // // // //           headers: {
// // // // // // // // // //             "Content-Type": "application/json",
// // // // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // // // //             "x-employee-id": employeeId,
// // // // // // // // // //           },
// // // // // // // // // //           body: JSON.stringify({
// // // // // // // // // //             Name: name,
// // // // // // // // // //             subdomain,
// // // // // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // // // // //             company_address: companyAddress,
// // // // // // // // // //             c_pan_no: cPanNo,
// // // // // // // // // //             admin_email: adminEmail,
// // // // // // // // // //             contact_email_id: contactEmail,
// // // // // // // // // //             contact_phone_no: contactPhone,
// // // // // // // // // //             start_date: startDate,
// // // // // // // // // //             end_date: endDate,
// // // // // // // // // //             roles: selectedRoles, // ✅ send selected roles
// // // // // // // // // //           }),
// // // // // // // // // //         }
// // // // // // // // // //       );

// // // // // // // // // //       const data = await response.json();
// // // // // // // // // //       if (response.ok) {
// // // // // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // // // // //         setName("");
// // // // // // // // // //         setSubdomain("");
// // // // // // // // // //         setNoEmployees("");
// // // // // // // // // //         setCompanyAddress("");
// // // // // // // // // //         setCPanNo("");
// // // // // // // // // //         setAdminEmail("");
// // // // // // // // // //         setContactEmail("");
// // // // // // // // // //         setContactPhone("");
// // // // // // // // // //         setStartDate("");
// // // // // // // // // //         setEndDate("");
// // // // // // // // // //         setSelectedRoles([]);
// // // // // // // // // //       } else {
// // // // // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // // // // //       }
// // // // // // // // // //     } catch (error) {
// // // // // // // // // //       console.error("Create organization error:", error);
// // // // // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // // // // //     }
// // // // // // // // // //   };

// // // // // // // // // //   return (
// // // // // // // // // //     <div className="create-org-wrapper">
// // // // // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // // // // //         ➕ Add Organization
// // // // // // // // // //       </button>

// // // // // // // // // //       {showForm && (
// // // // // // // // // //         <div className="create-org-container">
// // // // // // // // // //           <div className="form-header">
// // // // // // // // // //             <h2>Create New Organization</h2>
// // // // // // // // // //             <span className="close-icon" onClick={() => setShowForm(false)}>✖</span>
// // // // // // // // // //           </div>

// // // // // // // // // //           <form className="org-form" onSubmit={handleSubmit}>
// // // // // // // // // //             <label>Organization Name:</label>
// // // // // // // // // //             <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

// // // // // // // // // //             <label>Display Name:</label>
// // // // // // // // // //             <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />

// // // // // // // // // //             <label>Number of Employees:</label>
// // // // // // // // // //             <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />

// // // // // // // // // //             <label>Company Address:</label>
// // // // // // // // // //             <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />

// // // // // // // // // //             <label>Company PAN No:</label>
// // // // // // // // // //             <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />

// // // // // // // // // //             <label>Admin Email ID:</label>
// // // // // // // // // //             <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />

// // // // // // // // // //             <label>Contact Email ID:</label>
// // // // // // // // // //             <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />

// // // // // // // // // //             <label>Contact Phone No:</label>
// // // // // // // // // //             <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />

// // // // // // // // // //             <label>Start Date:</label>
// // // // // // // // // //             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />

// // // // // // // // // //             <label>End Date:</label>
// // // // // // // // // //             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />

// // // // // // // // // //             {/* ✅ Roles Checkbox Section */}
// // // // // // // // // //             <label>Assign Roles:</label>
// // // // // // // // // //             <div className="roles-checkbox-group">
// // // // // // // // // //               {roles.length > 0 ? (
// // // // // // // // // //                 roles.map((role) => (
// // // // // // // // // //                   <label key={role} className="role-option">
// // // // // // // // // //                     <input
// // // // // // // // // //                       type="checkbox"
// // // // // // // // // //                       checked={selectedRoles.includes(role)}
// // // // // // // // // //                       onChange={() => handleRoleToggle(role)}
// // // // // // // // // //                     />
// // // // // // // // // //                     {role}
// // // // // // // // // //                   </label>
// // // // // // // // // //                 ))
// // // // // // // // // //               ) : (
// // // // // // // // // //                 <p style={{ fontSize: "14px", color: "#666" }}>No roles found.</p>
// // // // // // // // // //               )}
// // // // // // // // // //             </div>

// // // // // // // // // //             <button type="submit" className="submit-btn">Create Organization</button>
// // // // // // // // // //           </form>

// // // // // // // // // //           {message && <p className="message">{message}</p>}
// // // // // // // // // //         </div>
// // // // // // // // // //       )}
// // // // // // // // // //     </div>
// // // // // // // // // //   );
// // // // // // // // // // };

// // // // // // // // // // export default CreateOrganization;


// // // // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // // // import "./CreateOrganization.css";

// // // // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // // // //   const [name, setName] = useState("");
// // // // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // // // //   const [roles, setRoles] = useState([]); // fetched roles
// // // // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // // // //   const [message, setMessage] = useState("");

// // // // // // // // //   useEffect(() => {
// // // // // // // // //     const fetchRoles = async () => {
// // // // // // // // //       try {
// // // // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // // // //           method: "GET",
// // // // // // // // //           headers: {
// // // // // // // // //             "Content-Type": "application/json",
// // // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // // //             "x-employee-id": employeeId,
// // // // // // // // //           },
// // // // // // // // //         });

// // // // // // // // //         if (!res.ok) {
// // // // // // // // //           throw new Error("Failed to fetch roles: " + res.status);
// // // // // // // // //         }

// // // // // // // // //         const data = await res.json();

// // // // // // // // //         if (!Array.isArray(data)) {
// // // // // // // // //           throw new Error("Invalid response format");
// // // // // // // // //         }

// // // // // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // // // // //         setRoles(uniqueRoles);
// // // // // // // // //       } catch (err) {
// // // // // // // // //         console.error("Role fetch error:", err);
// // // // // // // // //       }
// // // // // // // // //     };

// // // // // // // // //     fetchRoles();
// // // // // // // // //   }, [employeeId]);

// // // // // // // // //   const handleRoleToggle = (role) => {
// // // // // // // // //     setSelectedRoles((prev) =>
// // // // // // // // //       prev.includes(role)
// // // // // // // // //         ? prev.filter((r) => r !== role)
// // // // // // // // //         : [...prev, role]
// // // // // // // // //     );
// // // // // // // // //   };

// // // // // // // // //   const handleSubmit = async (e) => {
// // // // // // // // //     e.preventDefault();
// // // // // // // // //     setMessage("");

// // // // // // // // //     try {
// // // // // // // // //       const response = await fetch(
// // // // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // // // //         {
// // // // // // // // //           method: "POST",
// // // // // // // // //           headers: {
// // // // // // // // //             "Content-Type": "application/json",
// // // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // // //             "x-employee-id": employeeId,
// // // // // // // // //           },
// // // // // // // // //           body: JSON.stringify({
// // // // // // // // //             Name: name,
// // // // // // // // //             subdomain,
// // // // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // // // //             company_address: companyAddress,
// // // // // // // // //             c_pan_no: cPanNo,
// // // // // // // // //             admin_email: adminEmail,
// // // // // // // // //             contact_email_id: contactEmail,
// // // // // // // // //             contact_phone_no: contactPhone,
// // // // // // // // //             start_date: startDate,
// // // // // // // // //             end_date: endDate,
// // // // // // // // //             roles: selectedRoles,
// // // // // // // // //           }),
// // // // // // // // //         }
// // // // // // // // //       );

// // // // // // // // //       const data = await response.json();

// // // // // // // // //       if (response.ok) {
// // // // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // // // //         setName("");
// // // // // // // // //         setSubdomain("");
// // // // // // // // //         setNoEmployees("");
// // // // // // // // //         setCompanyAddress("");
// // // // // // // // //         setCPanNo("");
// // // // // // // // //         setAdminEmail("");
// // // // // // // // //         setContactEmail("");
// // // // // // // // //         setContactPhone("");
// // // // // // // // //         setStartDate("");
// // // // // // // // //         setEndDate("");
// // // // // // // // //         setSelectedRoles([]);
// // // // // // // // //       } else {
// // // // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // // // //       }
// // // // // // // // //     } catch (error) {
// // // // // // // // //       console.error("Create organization error:", error);
// // // // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   return (
    
// // // // // // // // //     <div className="create-org-wrapper">
// // // // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // // // //         ➕ Add Organization
// // // // // // // // //       </button>

// // // // // // // // //       {showForm && (
// // // // // // // // //         <div className="create-org-container">
// // // // // // // // //           <div className="form-header">
// // // // // // // // //             <h2>Create New Organization</h2>
// // // // // // // // //             <span className="close-icon" onClick={() => setShowForm(false)}>✖</span>
// // // // // // // // //           </div>

// // // // // // // // //           {/* <form className="org-form" onSubmit={handleSubmit}>
// // // // // // // // //             <label>Organization Name:</label>
// // // // // // // // //             <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

// // // // // // // // //             <label>Display Name:</label>
// // // // // // // // //             <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />

// // // // // // // // //             <label>Number of Employees:</label>
// // // // // // // // //             <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />

// // // // // // // // //             <label>Company Address:</label>
// // // // // // // // //             <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />

// // // // // // // // //             <label>Company PAN No:</label>
// // // // // // // // //             <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />

// // // // // // // // //             <label>Admin Email ID:</label>
// // // // // // // // //             <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />

// // // // // // // // //             <label>Contact Email ID:</label>
// // // // // // // // //             <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />

// // // // // // // // //             <label>Contact Phone No:</label>
// // // // // // // // //             <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />

// // // // // // // // //             <label>Start Date:</label>
// // // // // // // // //             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />

// // // // // // // // //             <label>End Date:</label>
// // // // // // // // //             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />

// // // // // // // // //             <label>Assign Roles:</label>
// // // // // // // // //             <div className="roles-checkbox-group">
// // // // // // // // //               {roles.length > 0 ? (
// // // // // // // // //                 roles.map((role) => (
// // // // // // // // //                   <label key={role} className="role-option">
// // // // // // // // //                     <input
// // // // // // // // //                       type="checkbox"
// // // // // // // // //                       checked={selectedRoles.includes(role)}
// // // // // // // // //                       onChange={() => handleRoleToggle(role)}
// // // // // // // // //                     />
// // // // // // // // //                     {role}
// // // // // // // // //                   </label>
// // // // // // // // //                 ))
// // // // // // // // //               ) : (
// // // // // // // // //                 <p style={{ fontSize: "14px", color: "#666" }}>No roles found.</p>
// // // // // // // // //               )}
// // // // // // // // //             </div>

// // // // // // // // //             <button type="submit" className="submit-btn">Create Organization</button>
// // // // // // // // //           </form> */}
// // // // // // // // //           <form className="org-form" onSubmit={handleSubmit}>
// // // // // // // // //   <div className="form-field">
// // // // // // // // //     <label>Organization Name:</label>
// // // // // // // // //     <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // // // // // //   </div>
// // // // // // // // //   <div className="form-field">
// // // // // // // // //     <label>Display Name:</label>
// // // // // // // // //     <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // // // // // //   </div>
// // // // // // // // //   <div className="form-field">
// // // // // // // // //     <label>Number of Employees:</label>
// // // // // // // // //     <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // // // // // //   </div>
// // // // // // // // //   <div className="form-field">
// // // // // // // // //     <label>Company Address:</label>
// // // // // // // // //     <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // // // // // //   </div>
// // // // // // // // //   <div className="form-field">
// // // // // // // // //     <label>Company PAN No:</label>
// // // // // // // // //     <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />
// // // // // // // // //   </div>
// // // // // // // // //   <div className="form-field">
// // // // // // // // //     <label>Admin Email ID:</label>
// // // // // // // // //     <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // // // // // //   </div>
// // // // // // // // //   <div className="form-field">
// // // // // // // // //     <label>Contact Email ID:</label>
// // // // // // // // //     <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // // // // // //   </div>
// // // // // // // // //   <div className="form-field">
// // // // // // // // //     <label>Contact Phone No:</label>
// // // // // // // // //     <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
// // // // // // // // //   </div>
// // // // // // // // //   <div className="form-field">
// // // // // // // // //     <label>Start Date:</label>
// // // // // // // // //     <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
// // // // // // // // //   </div>
// // // // // // // // //   <div className="form-field">
// // // // // // // // //     <label>End Date:</label>
// // // // // // // // //     <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
// // // // // // // // //   </div>
// // // // // // // // //   <div className="roles-checkbox-group">
// // // // // // // // //     <label>Assign Roles:</label>
// // // // // // // // //     {roles.length > 0 ? (
// // // // // // // // //       roles.map((role) => (
// // // // // // // // //         <label key={role} className="role-option">
// // // // // // // // //           <input
// // // // // // // // //             type="checkbox"
// // // // // // // // //             checked={selectedRoles.includes(role)}
// // // // // // // // //             onChange={() => handleRoleToggle(role)}
// // // // // // // // //           />
// // // // // // // // //           {role}
// // // // // // // // //         </label>
// // // // // // // // //       ))
// // // // // // // // //     ) : (
// // // // // // // // //       <p style={{ fontSize: "14px", color: "#666" }}>No roles found.</p>
// // // // // // // // //     )}
// // // // // // // // //   </div>
// // // // // // // // //   <button type="submit" className="submit-btn">Create Organization</button>
// // // // // // // // // </form>

// // // // // // // // //           {message && <p className="message">{message}</p>}
// // // // // // // // //         </div>
// // // // // // // // //       )}
// // // // // // // // //     </div>
// // // // // // // // //   );
// // // // // // // // // };

// // // // // // // // // export default CreateOrganization;




// // // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // // import "./CreateOrganization.css";

// // // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // // //   // State declarations
// // // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // // //   const [name, setName] = useState("");
// // // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // // //   const [roles, setRoles] = useState([]);
// // // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // // //   const [message, setMessage] = useState("");

// // // // // // // //   // Fetch roles on component mount
// // // // // // // //   useEffect(() => {
// // // // // // // //     const fetchRoles = async () => {
// // // // // // // //       try {
// // // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // // //           method: "GET",
// // // // // // // //           headers: {
// // // // // // // //             "Content-Type": "application/json",
// // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // //             "x-employee-id": employeeId,
// // // // // // // //           },
// // // // // // // //         });

// // // // // // // //         if (!res.ok) {
// // // // // // // //           throw new Error("Failed to fetch roles: " + res.status);
// // // // // // // //         }

// // // // // // // //         const data = await res.json();
// // // // // // // //         if (!Array.isArray(data)) {
// // // // // // // //           throw new Error("Invalid response format");
// // // // // // // //         }

// // // // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // // // //         setRoles(uniqueRoles);
// // // // // // // //       } catch (err) {
// // // // // // // //         console.error("Role fetch error:", err);
// // // // // // // //       }
// // // // // // // //     };

// // // // // // // //     fetchRoles();
// // // // // // // //   }, [employeeId]);

// // // // // // // //   // Handle role toggle
// // // // // // // //   const handleRoleToggle = (role) => {
// // // // // // // //     setSelectedRoles((prev) =>
// // // // // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // // // // //     );
// // // // // // // //   };

// // // // // // // //   // Handle form submission
// // // // // // // //   const handleSubmit = async (e) => {
// // // // // // // //     e.preventDefault();
// // // // // // // //     setMessage("");

// // // // // // // //     try {
// // // // // // // //       const response = await fetch(
// // // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // // //         {
// // // // // // // //           method: "POST",
// // // // // // // //           headers: {
// // // // // // // //             "Content-Type": "application/json",
// // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // //             "x-employee-id": employeeId,
// // // // // // // //           },
// // // // // // // //           body: JSON.stringify({
// // // // // // // //             Name: name,
// // // // // // // //             subdomain,
// // // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // // //             company_address: companyAddress,
// // // // // // // //             c_pan_no: cPanNo,
// // // // // // // //             admin_email: adminEmail,
// // // // // // // //             contact_email_id: contactEmail,
// // // // // // // //             contact_phone_no: contactPhone,
// // // // // // // //             start_date: startDate,
// // // // // // // //             end_date: endDate,
// // // // // // // //             roles: selectedRoles,
// // // // // // // //           }),
// // // // // // // //         }
// // // // // // // //       );

// // // // // // // //       const data = await response.json();

// // // // // // // //       if (response.ok) {
// // // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // // //         setName("");
// // // // // // // //         setSubdomain("");
// // // // // // // //         setNoEmployees("");
// // // // // // // //         setCompanyAddress("");
// // // // // // // //         setCPanNo("");
// // // // // // // //         setAdminEmail("");
// // // // // // // //         setContactEmail("");
// // // // // // // //         setContactPhone("");
// // // // // // // //         setStartDate("");
// // // // // // // //         setEndDate("");
// // // // // // // //         setSelectedRoles([]);
// // // // // // // //       } else {
       
// // // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // // //       }
// // // // // // // //     } catch (error) {
// // // // // // // //       console.error("Create organization error:", error);
// // // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   return (
// // // // // // // //     <div className="create-org-wrapper">
// // // // // // // //       {/* Open form button */}
// // // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // // //         ➕ Add Organization
// // // // // // // //       </button>

// // // // // // // //       {/* Form container */}
// // // // // // // //       {showForm && (
// // // // // // // //         <div className="create-org-container">
// // // // // // // //           <div className="form-header">
// // // // // // // //             <h2>Create New Organization</h2>
// // // // // // // //             <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // // // //               ✕
// // // // // // // //             </span>
// // // // // // // //           </div>

// // // // // // // //           {/* Organization form */}
// // // // // // // //           <form className="org-form" onSubmit={handleSubmit}>
// // // // // // // //             <div className="form-field">
// // // // // // // //               <label>Organization Name:</label>
// // // // // // // //               <input
// // // // // // // //                 type="text"
// // // // // // // //                 value={name}
// // // // // // // //                 onChange={(e) => setName(e.target.value)}
// // // // // // // //                 required
// // // // // // // //               />
// // // // // // // //             </div>
// // // // // // // //             <div className="form-field">
// // // // // // // //               <label>Display Name:</label>
// // // // // // // //               <input
// // // // // // // //                 type="text"
// // // // // // // //                 value={subdomain}
// // // // // // // //                 onChange={(e) => setSubdomain(e.target.value)}
// // // // // // // //                 required
// // // // // // // //               />
// // // // // // // //             </div>
// // // // // // // //             <div className="form-field">
// // // // // // // //               <label>Number of Employees:</label>
// // // // // // // //               <input
// // // // // // // //                 type="number"
// // // // // // // //                 value={noEmployees}
// // // // // // // //                 onChange={(e) => setNoEmployees(e.target.value)}
// // // // // // // //                 required
// // // // // // // //               />
// // // // // // // //             </div>
// // // // // // // //             <div className="form-field">
// // // // // // // //               <label>Company Address:</label>
// // // // // // // //               <input
// // // // // // // //                 type="text"
// // // // // // // //                 value={companyAddress}
// // // // // // // //                 onChange={(e) => setCompanyAddress(e.target.value)}
// // // // // // // //                 required
// // // // // // // //               />
// // // // // // // //             </div>
// // // // // // // //             <div className="form-field">
// // // // // // // //               <label>Company PAN No:</label>
// // // // // // // //               <input
// // // // // // // //                 type="text"
// // // // // // // //                 value={cPanNo}
// // // // // // // //                 onChange={(e) => setCPanNo(e.target.value)}
// // // // // // // //                 required
// // // // // // // //               />
// // // // // // // //             </div>
// // // // // // // //             <div className="form-field">
// // // // // // // //               <label>Admin Email ID:</label>
// // // // // // // //               <input
// // // // // // // //                 type="email"
// // // // // // // //                 value={adminEmail}
// // // // // // // //                 onChange={(e) => setAdminEmail(e.target.value)}
// // // // // // // //                 required
// // // // // // // //               />
// // // // // // // //             </div>
// // // // // // // //             <div className="form-field">
// // // // // // // //               <label>Contact Email ID:</label>
// // // // // // // //               <input
// // // // // // // //                 type="email"
// // // // // // // //                 value={contactEmail}
// // // // // // // //                 onChange={(e) => setContactEmail(e.target.value)}
// // // // // // // //                 required
// // // // // // // //               />
// // // // // // // //             </div>
// // // // // // // //             <div className="form-field">
// // // // // // // //               <label>Contact Phone No:</label>
// // // // // // // //               <input
// // // // // // // //                 type="tel"
// // // // // // // //                 value={contactPhone}
// // // // // // // //                 onChange={(e) => setContactPhone(e.target.value)}
// // // // // // // //                 required
// // // // // // // //               />
// // // // // // // //             </div>
// // // // // // // //             <div className="date-fields-container">
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Start Date:</label>
// // // // // // // //                 <input
// // // // // // // //                   type="date"
// // // // // // // //                   value={startDate}
// // // // // // // //                   onChange={(e) => setStartDate(e.target.value)}
// // // // // // // //                   required
// // // // // // // //                 />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>End Date:</label>
// // // // // // // //                 <input
// // // // // // // //                   type="date"
// // // // // // // //                   value={endDate}
// // // // // // // //                   onChange={(e) => setEndDate(e.target.value)}
// // // // // // // //                   required
// // // // // // // //                 />
// // // // // // // //               </div>
// // // // // // // //             </div>
// // // // // // // //             <div className="roles-checkbox-group">
// // // // // // // //               <label>Assign Roles:</label>
// // // // // // // //               {roles.length > 0 ? (
// // // // // // // //                 roles.map((role) => (
// // // // // // // //                   <label key={role} className="role-option">
// // // // // // // //                     <input
// // // // // // // //                       type="checkbox"
// // // // // // // //                       checked={selectedRoles.includes(role)}
// // // // // // // //                       onChange={() => handleRoleToggle(role)}
// // // // // // // //                     />
// // // // // // // //                     {role}
// // // // // // // //                   </label>
// // // // // // // //                 ))
// // // // // // // //               ) : (
// // // // // // // //                 <p style={{ fontSize: "12px", color: "#666" }}>
// // // // // // // //                   No roles found.
// // // // // // // //                 </p>
// // // // // // // //               )}
// // // // // // // //             </div>
// // // // // // // //             <button type="submit" className="submit-btn">
// // // // // // // //               Create Organization
// // // // // // // //             </button>
// // // // // // // //           </form>

// // // // // // // //           {/* Success/Error message */}
// // // // // // // //           {message && <p className="message">{message}</p>}
// // // // // // // //         </div>
// // // // // // // //       )}
// // // // // // // //     </div>
// // // // // // // //   );
// // // // // // // // };

// // // // // // // // export default CreateOrganization;

// // // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // // import "./CreateOrganization.css";

// // // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // // //   // State declarations
// // // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // // //   const [name, setName] = useState("");
// // // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // // //   const [roles, setRoles] = useState([]);
// // // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // // //   const [message, setMessage] = useState("");

// // // // // // // //   // Fetch roles on component mount
// // // // // // // //   useEffect(() => {
// // // // // // // //     const fetchRoles = async () => {
// // // // // // // //       try {
// // // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // // //           method: "GET",
// // // // // // // //           headers: {
// // // // // // // //             "Content-Type": "application/json",
// // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // //             "x-employee-id": employeeId,
// // // // // // // //           },
// // // // // // // //         });

// // // // // // // //         if (!res.ok) {
// // // // // // // //           throw new Error("Failed to fetch roles: " + res.status);
// // // // // // // //         }

// // // // // // // //         const data = await res.json();
// // // // // // // //         if (!Array.isArray(data)) {
// // // // // // // //           throw new Error("Invalid response format");
// // // // // // // //         }

// // // // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // // // //         setRoles(uniqueRoles);
// // // // // // // //       } catch (err) {
// // // // // // // //         console.error("Role fetch error:", err);
// // // // // // // //       }
// // // // // // // //     };

// // // // // // // //     fetchRoles();
// // // // // // // //   }, [employeeId]);

// // // // // // // //   // Handle role toggle
// // // // // // // //   const handleRoleToggle = (role) => {
// // // // // // // //     setSelectedRoles((prev) =>
// // // // // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // // // // //     );
// // // // // // // //   };

// // // // // // // //   // Handle form submission
// // // // // // // //   const handleSubmit = async (e) => {
// // // // // // // //     e.preventDefault();
// // // // // // // //     setMessage("");

// // // // // // // //     try {
// // // // // // // //       const response = await fetch(
// // // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // // //         {
// // // // // // // //           method: "POST",
// // // // // // // //           headers: {
// // // // // // // //             "Content-Type": "application/json",
// // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // //             "x-employee-id": employeeId,
// // // // // // // //           },
// // // // // // // //           body: JSON.stringify({
// // // // // // // //             Name: name,
// // // // // // // //             subdomain,
// // // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // // //             company_address: companyAddress,
// // // // // // // //             c_pan_no: cPanNo,
// // // // // // // //             admin_email: adminEmail,
// // // // // // // //             contact_email_id: contactEmail,
// // // // // // // //             contact_phone_no: contactPhone,
// // // // // // // //             start_date: startDate,
// // // // // // // //             end_date: endDate,
// // // // // // // //             roles: selectedRoles,
// // // // // // // //           }),
// // // // // // // //         }
// // // // // // // //       );

// // // // // // // //       const data = await response.json();

// // // // // // // //       if (response.ok) {
// // // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // // //         setName("");
// // // // // // // //         setSubdomain("");
// // // // // // // //         setNoEmployees("");
// // // // // // // //         setCompanyAddress("");
// // // // // // // //         setCPanNo("");
// // // // // // // //         setAdminEmail("");
// // // // // // // //         setContactEmail("");
// // // // // // // //         setContactPhone("");
// // // // // // // //         setStartDate("");
// // // // // // // //         setEndDate("");
// // // // // // // //         setSelectedRoles([]);
// // // // // // // //       } else {
// // // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // // //       }
// // // // // // // //     } catch (error) {
// // // // // // // //       console.error("Create organization error:", error);
// // // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   return (
// // // // // // // //     <div className="create-org-wrapper">
// // // // // // // //       {/* Open form button */}
// // // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // // //         ➕ Add Organization
// // // // // // // //       </button>

// // // // // // // //       {/* Form container */}
// // // // // // // //       {showForm && (
// // // // // // // //         <div className="create-org-container">
// // // // // // // //           <div className="form-header">
// // // // // // // //             <h2>Create New Organization</h2>
// // // // // // // //             <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // // // //               ✕
// // // // // // // //             </span>
// // // // // // // //           </div>

// // // // // // // //           {/* Organization form */}
// // // // // // // //           <form className="org-form" onSubmit={handleSubmit}>
// // // // // // // //             {/* Row 1: Organization Name, Display Name, Number of Employees */}
// // // // // // // //             <div className="form-row">
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Organization Name *</label>
// // // // // // // //                 <input
// // // // // // // //                   type="text"
// // // // // // // //                   value={name}
// // // // // // // //                   onChange={(e) => setName(e.target.value)}
// // // // // // // //                   required
// // // // // // // //                 />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Display Name *</label>
// // // // // // // //                 <input
// // // // // // // //                   type="text"
// // // // // // // //                   value={subdomain}
// // // // // // // //                   onChange={(e) => setSubdomain(e.target.value)}
// // // // // // // //                   required
// // // // // // // //                 />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Number of Employees *</label>
// // // // // // // //                 <input
// // // // // // // //                   type="number"
// // // // // // // //                   value={noEmployees}
// // // // // // // //                   onChange={(e) => setNoEmployees(e.target.value)}
// // // // // // // //                   required
// // // // // // // //                 />
// // // // // // // //               </div>
// // // // // // // //             </div>

// // // // // // // //             {/* Row 2: Company Address, Company PAN No, Admin Email ID */}
// // // // // // // //             <div className="form-row">
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Company Address *</label>
// // // // // // // //                 <input
// // // // // // // //                   type="text"
// // // // // // // //                   value={companyAddress}
// // // // // // // //                   onChange={(e) => setCompanyAddress(e.target.value)}
// // // // // // // //                   required
// // // // // // // //                 />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Company PAN No *</label>
// // // // // // // //                 <input
// // // // // // // //                   type="text"
// // // // // // // //                   value={cPanNo}
// // // // // // // //                   onChange={(e) => setCPanNo(e.target.value)}
// // // // // // // //                   required
// // // // // // // //                 />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Admin Email ID *</label>
// // // // // // // //                 <input
// // // // // // // //                   type="email"
// // // // // // // //                   value={adminEmail}
// // // // // // // //                   onChange={(e) => setAdminEmail(e.target.value)}
// // // // // // // //                   required
// // // // // // // //                 />
// // // // // // // //               </div>
// // // // // // // //             </div>

// // // // // // // //             {/* Row 3: Contact Email ID, Contact Phone No, Empty */}
// // // // // // // //             <div className="form-row">
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Contact Email ID *</label>
// // // // // // // //                 <input
// // // // // // // //                   type="email"
// // // // // // // //                   value={contactEmail}
// // // // // // // //                   onChange={(e) => setContactEmail(e.target.value)}
// // // // // // // //                   required
// // // // // // // //                 />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Contact Phone No *</label>
// // // // // // // //                 <input
// // // // // // // //                   type="tel"
// // // // // // // //                   value={contactPhone}
// // // // // // // //                   onChange={(e) => setContactPhone(e.target.value)}
// // // // // // // //                   required
// // // // // // // //                 />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field" />
// // // // // // // //             </div>

// // // // // // // //             {/* Row 4: Start Date, End Date, Empty */}
// // // // // // // //             <div className="form-row">
// // // // // // // //               <div className="date-fields-container">
// // // // // // // //                 <div className="form-field">
// // // // // // // //                   <label>Start Date *</label>
// // // // // // // //                   <input
// // // // // // // //                     type="date"
// // // // // // // //                     value={startDate}
// // // // // // // //                     onChange={(e) => setStartDate(e.target.value)}
// // // // // // // //                     required
// // // // // // // //                   />
// // // // // // // //                 </div>
// // // // // // // //                 <div className="form-field">
// // // // // // // //                   <label>End Date *</label>
// // // // // // // //                   <input
// // // // // // // //                     type="date"
// // // // // // // //                     value={endDate}
// // // // // // // //                     onChange={(e) => setEndDate(e.target.value)}
// // // // // // // //                     required
// // // // // // // //                   />
// // // // // // // //                 </div>
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field" />
// // // // // // // //             </div>

// // // // // // // //             {/* Row 5: Assign Roles */}
// // // // // // // //             <div className="form-row">
// // // // // // // //               <div className="roles-checkbox-group">
// // // // // // // //                 <label>Assign Roles *</label>
// // // // // // // //                 <div className="checkbox-list">
// // // // // // // //                   {roles.length > 0 ? (
// // // // // // // //                     roles.map((role) => (
// // // // // // // //                       <div key={role} className="checkbox-item">
// // // // // // // //                         <input
// // // // // // // //                           type="checkbox"
// // // // // // // //                           id={`role-${role}`}
// // // // // // // //                           checked={selectedRoles.includes(role)}
// // // // // // // //                           onChange={() => handleRoleToggle(role)}
// // // // // // // //                         />
// // // // // // // //                         <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // // // // //                           {role}
// // // // // // // //                         </label>
// // // // // // // //                       </div>
// // // // // // // //                     ))
// // // // // // // //                   ) : (
// // // // // // // //                     <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // // // // //                   )}
// // // // // // // //                 </div>
// // // // // // // //               </div>
// // // // // // // //             </div>

// // // // // // // //             {/* Row 6: Buttons */}
// // // // // // // //             <div className="form-actions">
// // // // // // // //               <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // // // // //                 Cancel
// // // // // // // //               </button>
// // // // // // // //               <button type="submit" className="save-btn">
// // // // // // // //                 Save
// // // // // // // //               </button>
// // // // // // // //             </div>
// // // // // // // //           </form>

// // // // // // // //           {/* Success/Error message */}
// // // // // // // //           {message && <p className="message">{message}</p>}
// // // // // // // //         </div>
// // // // // // // //       )}
// // // // // // // //     </div>
// // // // // // // //   );
// // // // // // // // };

// // // // // // // // export default CreateOrganization;

// // // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // // import "./CreateOrganization.css";

// // // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // // //   const [name, setName] = useState("");
// // // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // // //   const [roles, setRoles] = useState([]);
// // // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // // //   const [message, setMessage] = useState("");
// // // // // // // //   const [orgTableData, setOrgTableData] = useState([]);

// // // // // // // //   useEffect(() => {
// // // // // // // //     const fetchRoles = async () => {
// // // // // // // //       try {
// // // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // // //           method: "GET",
// // // // // // // //           headers: {
// // // // // // // //             "Content-Type": "application/json",
// // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // //             "x-employee-id": employeeId,
// // // // // // // //           },
// // // // // // // //         });

// // // // // // // //         if (!res.ok) throw new Error("Failed to fetch roles: " + res.status);

// // // // // // // //         const data = await res.json();
// // // // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // // // //         setRoles(uniqueRoles);
// // // // // // // //       } catch (err) {
// // // // // // // //         console.error("Role fetch error:", err);
// // // // // // // //       }
// // // // // // // //     };

// // // // // // // //     const fetchOrganizations = async () => {
// // // // // // // //       try {
// // // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // // // //   headers: {
// // // // // // // //     "Content-Type": "application/json",
// // // // // // // //     "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // //     "x-employee-id": employeeId,
// // // // // // // //   },
// // // // // // // // });


// // // // // // // //         const data = await res.json();
// // // // // // // //         setOrgTableData(data);
// // // // // // // //       } catch (err) {
// // // // // // // //         console.error("Organization table fetch error:", err);
// // // // // // // //       }
// // // // // // // //     };

// // // // // // // //     fetchRoles();
// // // // // // // //     fetchOrganizations();
// // // // // // // //   }, [employeeId]);

// // // // // // // //   const handleRoleToggle = (role) => {
// // // // // // // //     setSelectedRoles((prev) =>
// // // // // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // // // // //     );
// // // // // // // //   };

// // // // // // // //   const handleSubmit = async (e) => {
// // // // // // // //     e.preventDefault();
// // // // // // // //     setMessage("");

// // // // // // // //     try {
// // // // // // // //       const response = await fetch(
// // // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // // //         {
// // // // // // // //           method: "POST",
// // // // // // // //           headers: {
// // // // // // // //             "Content-Type": "application/json",
// // // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // // //             "x-employee-id": employeeId,
// // // // // // // //           },
// // // // // // // //           body: JSON.stringify({
// // // // // // // //             Name: name,
// // // // // // // //             subdomain,
// // // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // // //             company_address: companyAddress,
// // // // // // // //             c_pan_no: cPanNo,
// // // // // // // //             admin_email: adminEmail,
// // // // // // // //             contact_email_id: contactEmail,
// // // // // // // //             contact_phone_no: contactPhone,
// // // // // // // //             start_date: startDate,
// // // // // // // //             end_date: endDate,
// // // // // // // //             roles: selectedRoles,
// // // // // // // //           }),
// // // // // // // //         }
// // // // // // // //       );

// // // // // // // //       const data = await response.json();

// // // // // // // //       if (response.ok) {
// // // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // // //         setName("");
// // // // // // // //         setSubdomain("");
// // // // // // // //         setNoEmployees("");
// // // // // // // //         setCompanyAddress("");
// // // // // // // //         setCPanNo("");
// // // // // // // //         setAdminEmail("");
// // // // // // // //         setContactEmail("");
// // // // // // // //         setContactPhone("");
// // // // // // // //         setStartDate("");
// // // // // // // //         setEndDate("");
// // // // // // // //         setSelectedRoles([]);
// // // // // // // //       } else {
// // // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // // //       }
// // // // // // // //     } catch (error) {
// // // // // // // //       console.error("Create organization error:", error);
// // // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   return (
// // // // // // // //     <div className="create-org-wrapper">
// // // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // // //         ➕ Add Organization
// // // // // // // //       </button>

// // // // // // // //       {showForm && (
// // // // // // // //         <div className="create-org-container">
// // // // // // // //           <div className="form-header">
// // // // // // // //             <h2>Create New Organization</h2>
// // // // // // // //             <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // // // //               ✕
// // // // // // // //             </span>
// // // // // // // //           </div>

// // // // // // // //           <form className="org-form" onSubmit={handleSubmit}>
// // // // // // // //             <div className="form-row">
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Organization Name *</label>
// // // // // // // //                 <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Display Name *</label>
// // // // // // // //                 <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Number of Employees *</label>
// // // // // // // //                 <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // // // // //               </div>
// // // // // // // //             </div>

// // // // // // // //             <div className="form-row">
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Company Address *</label>
// // // // // // // //                 <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Company PAN No *</label>
// // // // // // // //                 <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Admin Email ID *</label>
// // // // // // // //                 <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // // // // //               </div>
// // // // // // // //             </div>

// // // // // // // //             <div className="form-row">
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Contact Email ID *</label>
// // // // // // // //                 <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field">
// // // // // // // //                 <label>Contact Phone No *</label>
// // // // // // // //                 <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field" />
// // // // // // // //             </div>

// // // // // // // //             <div className="form-row">
// // // // // // // //               <div className="date-fields-container">
// // // // // // // //                 <div className="form-field">
// // // // // // // //                   <label>Start Date *</label>
// // // // // // // //                   <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
// // // // // // // //                 </div>
// // // // // // // //                 <div className="form-field">
// // // // // // // //                   <label>End Date *</label>
// // // // // // // //                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
// // // // // // // //                 </div>
// // // // // // // //               </div>
// // // // // // // //               <div className="form-field" />
// // // // // // // //             </div>

// // // // // // // //             <div className="form-row">
// // // // // // // //               <div className="roles-checkbox-group">
// // // // // // // //                 <label>Assign Roles *</label>
// // // // // // // //                 <div className="checkbox-list">
// // // // // // // //                   {roles.length > 0 ? (
// // // // // // // //                     roles.map((role) => (
// // // // // // // //                       <div key={role} className="checkbox-item">
// // // // // // // //                         <input
// // // // // // // //                           type="checkbox"
// // // // // // // //                           id={`role-${role}`}
// // // // // // // //                           checked={selectedRoles.includes(role)}
// // // // // // // //                           onChange={() => handleRoleToggle(role)}
// // // // // // // //                         />
// // // // // // // //                         <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // // // // //                           {role}
// // // // // // // //                         </label>
// // // // // // // //                       </div>
// // // // // // // //                     ))
// // // // // // // //                   ) : (
// // // // // // // //                     <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // // // // //                   )}
// // // // // // // //                 </div>
// // // // // // // //               </div>
// // // // // // // //             </div>

// // // // // // // //             <div className="form-actions">
// // // // // // // //               <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // // // // //                 Cancel
// // // // // // // //               </button>
// // // // // // // //               <button type="submit" className="save-btn">Save</button>
// // // // // // // //             </div>
// // // // // // // //           </form>

// // // // // // // //           {message && <p className="message">{message}</p>}
// // // // // // // //         </div>
// // // // // // // //       )}

// // // // // // // //       {/* Organization Table Display */}
// // // // // // // //       {orgTableData.length > 0 && (
// // // // // // // //         <div className="org-table-container">
// // // // // // // //           <h3>Existing Organizations</h3>
// // // // // // // //           <table className="org-table">
// // // // // // // //             <thead>
// // // // // // // //               <tr>
// // // // // // // //                 <th>ID</th>
// // // // // // // //                 <th>Name</th>
// // // // // // // //                 <th>Subdomain</th>
// // // // // // // //                 <th>No. Employees</th>
// // // // // // // //                 <th>Company Address</th>
// // // // // // // //                 <th>Admin Email</th>
// // // // // // // //                 <th>Contact Email</th>
// // // // // // // //                 <th>Contact Phone</th>
// // // // // // // //                 <th>Start Date</th>
// // // // // // // //                 <th>End Date</th>
// // // // // // // //               </tr>
// // // // // // // //             </thead>
// // // // // // // //             <tbody>
// // // // // // // //               {orgTableData.map((org) => (
// // // // // // // //                 <tr key={org.id}>
// // // // // // // //                   <td>{org.id}</td>
// // // // // // // //                   <td>{org.Name}</td>
// // // // // // // //                   <td>{org.subdomain}</td>
// // // // // // // //                   <td>{org.no_employees}</td>
// // // // // // // //                   <td>{org.company_address}</td>
// // // // // // // //                   <td>{org.admin_email}</td>
// // // // // // // //                   <td>{org.contact_email_id}</td>
// // // // // // // //                   <td>{org.contact_phone_no}</td>
// // // // // // // //                   <td>{org.start_date}</td>
// // // // // // // //                   <td>{org.end_date}</td>
// // // // // // // //                 </tr>
// // // // // // // //               ))}
// // // // // // // //             </tbody>
// // // // // // // //           </table>
// // // // // // // //         </div>
// // // // // // // //       )}
// // // // // // // //     </div>
// // // // // // // //   );
// // // // // // // // };

// // // // // // // // export default CreateOrganization;

// // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // import "./CreateOrganization.css";

// // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // //   const [name, setName] = useState("");
// // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // //   const [roles, setRoles] = useState([]);
// // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // //   const [message, setMessage] = useState("");
// // // // // // //   const [orgTableData, setOrgTableData] = useState([]);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRoles = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // //           method: "GET",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });

// // // // // // //         if (!res.ok) throw new Error("Failed to fetch roles: " + res.status);

// // // // // // //         const data = await res.json();
// // // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // // //         setRoles(uniqueRoles);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role fetch error:", err);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     const fetchOrganizations = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });

// // // // // // //         const data = await res.json();
// // // // // // //         setOrgTableData(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Organization table fetch error:", err);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRoles();
// // // // // // //     fetchOrganizations();
// // // // // // //   }, [employeeId]);

// // // // // // //   const handleRoleToggle = (role) => {
// // // // // // //     setSelectedRoles((prev) =>
// // // // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // // // //     );
// // // // // // //   };

// // // // // // //   const handleSubmit = async (e) => {
// // // // // // //     e.preventDefault();
// // // // // // //     setMessage("");

// // // // // // //     try {
// // // // // // //       const response = await fetch(
// // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // //         {
// // // // // // //           method: "POST",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //           body: JSON.stringify({
// // // // // // //             Name: name,
// // // // // // //             subdomain,
// // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // //             company_address: companyAddress,
// // // // // // //             c_pan_no: cPanNo,
// // // // // // //             admin_email: adminEmail,
// // // // // // //             contact_email_id: contactEmail,
// // // // // // //             contact_phone_no: contactPhone,
// // // // // // //             start_date: startDate,
// // // // // // //             end_date: endDate,
// // // // // // //             roles: selectedRoles,
// // // // // // //           }),
// // // // // // //         }
// // // // // // //       );

// // // // // // //       const data = await response.json();

// // // // // // //       if (response.ok) {
// // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // //         setName("");
// // // // // // //         setSubdomain("");
// // // // // // //         setNoEmployees("");
// // // // // // //         setCompanyAddress("");
// // // // // // //         setCPanNo("");
// // // // // // //         setAdminEmail("");
// // // // // // //         setContactEmail("");
// // // // // // //         setContactPhone("");
// // // // // // //         setStartDate("");
// // // // // // //         setEndDate("");
// // // // // // //         setSelectedRoles([]);
// // // // // // //         setShowForm(false); // Close modal on success
// // // // // // //       } else {
// // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Create organization error:", error);
// // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleCloseModal = (e) => {
// // // // // // //     if (e.target.className.includes("modal-overlay")) {
// // // // // // //       setShowForm(false);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="create-org-wrapper">
// // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // //         ➕ Add Organization
// // // // // // //       </button>

// // // // // // //       {showForm && (
// // // // // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // // // // //           <div className="create-org-container">
// // // // // // //             <div className="form-header">
// // // // // // //               <h2>Create New Organization</h2>
// // // // // // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // // //                 ✕
// // // // // // //               </span>
// // // // // // //             </div>

// // // // // // //             <form className="org-form" onSubmit={handleSubmit}>
// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Organization Name *</label>
// // // // // // //                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Display Name *</label>
// // // // // // //                   <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Number of Employees *</label>
// // // // // // //                   <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company Address *</label>
// // // // // // //                   <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company PAN No *</label>
// // // // // // //                   <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Admin Email ID *</label>
// // // // // // //                   <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Email ID *</label>
// // // // // // //                   <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Phone No *</label>
// // // // // // //                   <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field" />
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="date-fields-container">
// // // // // // //                   <div className="form-field">
// // // // // // //                     <label>Start Date *</label>
// // // // // // //                     <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
// // // // // // //                   </div>
// // // // // // //                   <div className="form-field">
// // // // // // //                     <label>End Date *</label>
// // // // // // //                     <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field" />
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="roles-checkbox-group">
// // // // // // //                   <label>Assign Roles *</label>
// // // // // // //                   <div className="checkbox-list">
// // // // // // //                     {roles.length > 0 ? (
// // // // // // //                       roles.map((role) => (
// // // // // // //                         <div key={role} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             id={`role-${role}`}
// // // // // // //                             checked={selectedRoles.includes(role)}
// // // // // // //                             onChange={() => handleRoleToggle(role)}
// // // // // // //                           />
// // // // // // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // // // //                             {role}
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))
// // // // // // //                     ) : (
// // // // // // //                       <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // // // //                     )}
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-actions">
// // // // // // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // // // //                   Cancel
// // // // // // //                 </button>
// // // // // // //                 <button type="submit" className="save-btn">Save</button>
// // // // // // //               </div>
// // // // // // //             </form>

// // // // // // //             {message && <p className="message">{message}</p>}
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       )}

// // // // // // //       {orgTableData.length > 0 && (
// // // // // // //         <div className="org-table-container">
// // // // // // //           <h3>Existing Organizations</h3>
// // // // // // //           <table className="org-table">
// // // // // // //             <thead>
// // // // // // //               <tr>
// // // // // // //                 <th>ID</th>
// // // // // // //                 <th>Name</th>
// // // // // // //                 <th>Subdomain</th>
// // // // // // //                 <th>No. Employees</th>
// // // // // // //                 <th>Company Address</th>
// // // // // // //                 <th>Admin Email</th>
// // // // // // //                 <th>Contact Email</th>
// // // // // // //                 <th>Contact Phone</th>
// // // // // // //                 <th>Start Date</th>
// // // // // // //                 <th>End Date</th>
// // // // // // //               </tr>
// // // // // // //             </thead>
// // // // // // //             <tbody>
// // // // // // //               {orgTableData.map((org) => (
// // // // // // //                 <tr key={org.id}>
// // // // // // //                   <td>{org.id}</td>
// // // // // // //                   <td>{org.Name}</td>
// // // // // // //                   <td>{org.subdomain}</td>
// // // // // // //                   <td>{org.no_employees}</td>
// // // // // // //                   <td>{org.company_address}</td>
// // // // // // //                   <td>{org.admin_email}</td>
// // // // // // //                   <td>{org.contact_email_id}</td>
// // // // // // //                   <td>{org.contact_phone_no}</td>
// // // // // // //                   <td>{org.start_date}</td>
// // // // // // //                   <td>{org.end_date}</td>
// // // // // // //                 </tr>
// // // // // // //               ))}
// // // // // // //             </tbody>
// // // // // // //           </table>
// // // // // // //         </div>
// // // // // // //       )}
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default CreateOrganization;

// // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // import "./CreateOrganization.css";

// // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // //   const [name, setName] = useState("");
// // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // //   const [roles, setRoles] = useState([]);
// // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // //   const [message, setMessage] = useState("");
// // // // // // //   const [orgTableData, setOrgTableData] = useState([]);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRoles = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // //           method: "GET",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });

// // // // // // //         if (!res.ok) throw new Error("Failed to fetch roles: " + res.status);

// // // // // // //         const data = await res.json();
// // // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // // //         setRoles(uniqueRoles);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role fetch error:", err);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     const fetchOrganizations = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });

// // // // // // //         const data = await res.json();
// // // // // // //         setOrgTableData(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Organization table fetch error:", err);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRoles();
// // // // // // //     fetchOrganizations();
// // // // // // //   }, [employeeId]);

// // // // // // //   const handleRoleToggle = (role) => {
// // // // // // //     setSelectedRoles((prev) =>
// // // // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // // // //     );
// // // // // // //   };

// // // // // // //   const handleSubmit = async (e) => {
// // // // // // //     e.preventDefault();
// // // // // // //     setMessage("");

// // // // // // //     try {
// // // // // // //       const response = await fetch(
// // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // //         {
// // // // // // //           method: "POST",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //           body: JSON.stringify({
// // // // // // //             Name: name,
// // // // // // //             subdomain,
// // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // //             company_address: companyAddress,
// // // // // // //             c_pan_no: cPanNo,
// // // // // // //             admin_email: adminEmail,
// // // // // // //             contact_email_id: contactEmail,
// // // // // // //             contact_phone_no: contactPhone,
// // // // // // //             start_date: startDate,
// // // // // // //             end_date: endDate,
// // // // // // //             roles: selectedRoles,
// // // // // // //           }),
// // // // // // //         }
// // // // // // //       );

// // // // // // //       const data = await response.json();

// // // // // // //       if (response.ok) {
// // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // //         setName("");
// // // // // // //         setSubdomain("");
// // // // // // //         setNoEmployees("");
// // // // // // //         setCompanyAddress("");
// // // // // // //         setCPanNo("");
// // // // // // //         setAdminEmail("");
// // // // // // //         setContactEmail("");
// // // // // // //         setContactPhone("");
// // // // // // //         setStartDate("");
// // // // // // //         setEndDate("");
// // // // // // //         setSelectedRoles([]);
// // // // // // //         setShowForm(false); // Close modal on success
// // // // // // //       } else {
// // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Create organization error:", error);
// // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleCloseModal = (e) => {
// // // // // // //     if (e.target.className.includes("modal-overlay")) {
// // // // // // //       setShowForm(false);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   // Function to format date to IST (date only)
// // // // // // //   const formatToIST = (dateString) => {
// // // // // // //     try {
// // // // // // //       const date = new Date(dateString);
// // // // // // //       if (isNaN(date.getTime())) {
// // // // // // //         return dateString; // Return original string if invalid date
// // // // // // //       }
// // // // // // //       return date.toLocaleString("en-IN", {
// // // // // // //         timeZone: "Asia/Kolkata",
// // // // // // //         year: "numeric",
// // // // // // //         month: "2-digit",
// // // // // // //         day: "2-digit",
// // // // // // //       });
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Date formatting error:", error);
// // // // // // //       return dateString; // Fallback to original string
// // // // // // //     }
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="create-org-wrapper">
// // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // //         ➕ Add Organization
// // // // // // //       </button>

// // // // // // //       {showForm && (
// // // // // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // // // // //           <div className="create-org-container">
// // // // // // //             <div className="form-header">
// // // // // // //               <h2>Create New Organization</h2>
// // // // // // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // // //                 ✕
// // // // // // //               </span>
// // // // // // //             </div>

// // // // // // //             <form className="org-form" onSubmit={handleSubmit}>
// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Organization Name *</label>
// // // // // // //                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Display Name *</label>
// // // // // // //                   <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Number of Employees *</label>
// // // // // // //                   <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company Address *</label>
// // // // // // //                   <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company PAN No *</label>
// // // // // // //                   <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Admin Email ID *</label>
// // // // // // //                   <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row form-row-four">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Email ID *</label>
// // // // // // //                   <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Phone No *</label>
// // // // // // //                   <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Start Date *</label>
// // // // // // //                   <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>End Date *</label>
// // // // // // //                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="roles-checkbox-group">
// // // // // // //                   <label>Assign Roles *</label>
// // // // // // //                   <div className="checkbox-list">
// // // // // // //                     {roles.length > 0 ? (
// // // // // // //                       roles.map((role) => (
// // // // // // //                         <div key={role} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             id={`role-${role}`}
// // // // // // //                             checked={selectedRoles.includes(role)}
// // // // // // //                             onChange={() => handleRoleToggle(role)}
// // // // // // //                           />
// // // // // // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // // // //                             {role}
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))
// // // // // // //                     ) : (
// // // // // // //                       <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // // // //                     )}
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-actions">
// // // // // // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // // // //                   Cancel
// // // // // // //                 </button>
// // // // // // //                 <button type="submit" className="save-btn">Save</button>
// // // // // // //               </div>
// // // // // // //             </form>

// // // // // // //             {message && <p className="message">{message}</p>}
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       )}

// // // // // // //       {orgTableData.length > 0 && (
// // // // // // //         <div className="org-table-container">
// // // // // // //           <h3>Existing Organizations</h3>
// // // // // // //           <table className="org-table">
// // // // // // //             <thead>
// // // // // // //               <tr>
// // // // // // //                 <th>ID</th>
// // // // // // //                 <th>Name</th>
// // // // // // //                 <th>Subdomain</th>
// // // // // // //                 <th>No. Employees</th>
// // // // // // //                 <th>Company Address</th>
// // // // // // //                 <th>Admin Email</th>
// // // // // // //                 <th>Contact Email</th>
// // // // // // //                 <th>Contact Phone</th>
// // // // // // //                 <th>Start Date</th>
// // // // // // //                 <th>End Date</th>
// // // // // // //               </tr>
// // // // // // //             </thead>
// // // // // // //             <tbody>
// // // // // // //               {orgTableData.map((org) => (
// // // // // // //                 <tr key={org.id}>
// // // // // // //                   <td>{org.id}</td>
// // // // // // //                   <td>{org.Name}</td>
// // // // // // //                   <td>{org.subdomain}</td>
// // // // // // //                   <td>{org.no_employees}</td>
// // // // // // //                   <td>{org.company_address}</td>
// // // // // // //                   <td>{org.admin_email}</td>
// // // // // // //                   <td>{org.contact_email_id}</td>
// // // // // // //                   <td>{org.contact_phone_no}</td>
// // // // // // //                   <td>{formatToIST(org.start_date)}</td>
// // // // // // //                   <td>{formatToIST(org.end_date)}</td>
// // // // // // //                 </tr>
// // // // // // //               ))}
// // // // // // //             </tbody>
// // // // // // //           </table>
// // // // // // //         </div>
// // // // // // //       )}
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default CreateOrganization;

// // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // import "./CreateOrganization.css";

// // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // //   const [name, setName] = useState("");
// // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // //   const [roles, setRoles] = useState([]);
// // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // //   const [rolePages, setRolePages] = useState([]);
// // // // // // //   const [selectedPages, setSelectedPages] = useState([]);
// // // // // // //   const [message, setMessage] = useState("");
// // // // // // //   const [orgTableData, setOrgTableData] = useState([]);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRoles = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // //           method: "GET",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });

// // // // // // //         if (!res.ok) throw new Error("Failed to fetch roles: " + res.status);

// // // // // // //         const data = await res.json();
// // // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // // //         setRoles(uniqueRoles);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role fetch error:", err);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     const fetchOrganizations = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });

// // // // // // //         const data = await res.json();
// // // // // // //         setOrgTableData(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Organization table fetch error:", err);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRoles();
// // // // // // //     fetchOrganizations();
// // // // // // //   }, [employeeId]);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRolePages = async () => {
// // // // // // //       if (selectedRoles.length === 0) {
// // // // // // //         setRolePages([]);
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       try {
// // // // // // //         const rolesQuery = selectedRoles.join(",");
// // // // // // //         const res = await fetch(
// // // // // // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // // // // // //           {
// // // // // // //             method: "GET",
// // // // // // //             headers: {
// // // // // // //               "Content-Type": "application/json",
// // // // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //               "x-employee-id": employeeId,
// // // // // // //             },
// // // // // // //           }
// // // // // // //         );

// // // // // // //         if (!res.ok) throw new Error("Failed to fetch role pages: " + res.status);

// // // // // // //         const data = await res.json();
// // // // // // //         setRolePages(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role pages fetch error:", err);
// // // // // // //         setRolePages([]);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRolePages();
// // // // // // //   }, [selectedRoles, employeeId]);

// // // // // // //   const handleRoleToggle = (role) => {
// // // // // // //     setSelectedRoles((prev) =>
// // // // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // // // //     );
// // // // // // //   };

// // // // // // //   const handlePageToggle = (pageName) => {
// // // // // // //     setSelectedPages((prev) =>
// // // // // // //       prev.includes(pageName)
// // // // // // //         ? prev.filter((p) => p !== pageName)
// // // // // // //         : [...prev, pageName]
// // // // // // //     );
// // // // // // //   };

// // // // // // //   const handleSubmit = async (e) => {
// // // // // // //     e.preventDefault();
// // // // // // //     setMessage("");

// // // // // // //     try {
// // // // // // //       const response = await fetch(
// // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/create-organization`,
// // // // // // //         {
// // // // // // //           method: "POST",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //           body: JSON.stringify({
// // // // // // //             Name: name,
// // // // // // //             subdomain,
// // // // // // //             no_employees: parseInt(noEmployees),
// // // // // // //             company_address: companyAddress,
// // // // // // //             c_pan_no: cPanNo,
// // // // // // //             admin_email: adminEmail,
// // // // // // //             contact_email_id: contactEmail,
// // // // // // //             contact_phone_no: contactPhone,
// // // // // // //             start_date: startDate,
// // // // // // //             end_date: endDate,
// // // // // // //             roles: selectedRoles,
// // // // // // //             selectedPages,
// // // // // // //           }),
// // // // // // //         }
// // // // // // //       );

// // // // // // //       const data = await response.json();

// // // // // // //       if (response.ok) {
// // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // //         setName("");
// // // // // // //         setSubdomain("");
// // // // // // //         setNoEmployees("");
// // // // // // //         setCompanyAddress("");
// // // // // // //         setCPanNo("");
// // // // // // //         setAdminEmail("");
// // // // // // //         setContactEmail("");
// // // // // // //         setContactPhone("");
// // // // // // //         setStartDate("");
// // // // // // //         setEndDate("");
// // // // // // //         setSelectedRoles([]);
// // // // // // //         setSelectedPages([]);
// // // // // // //         setShowForm(false);
// // // // // // //       } else {
// // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Create organization error:", error);
// // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleCloseModal = (e) => {
// // // // // // //     if (e.target.className.includes("modal-overlay")) {
// // // // // // //       setShowForm(false);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const formatToIST = (dateString) => {
// // // // // // //     try {
// // // // // // //       const date = new Date(dateString);
// // // // // // //       if (isNaN(date.getTime())) {
// // // // // // //         return dateString;
// // // // // // //       }
// // // // // // //       return date.toLocaleString("en-IN", {
// // // // // // //         timeZone: "Asia/Kolkata",
// // // // // // //         year: "numeric",
// // // // // // //         month: "2-digit",
// // // // // // //         day: "2-digit",
// // // // // // //       });
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Date formatting error:", error);
// // // // // // //       return dateString;
// // // // // // //     }
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="create-org-wrapper">
// // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // //         ➕ Add Organization
// // // // // // //       </button>

// // // // // // //       {showForm && (
// // // // // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // // // // //           <div className="create-org-container">
// // // // // // //             <div className="form-header">
// // // // // // //               <h2>Create New Organization</h2>
// // // // // // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // // //                 ✕
// // // // // // //               </span>
// // // // // // //             </div>

// // // // // // //             <form className="org-form" onSubmit={handleSubmit}>
// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Organization Name *</label>
// // // // // // //                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Display Name *</label>
// // // // // // //                   <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Number of Employees *</label>
// // // // // // //                   <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company Address *</label>
// // // // // // //                   <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company PAN No *</label>
// // // // // // //                   <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Admin Email ID *</label>
// // // // // // //                   <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row form-row-four">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Email ID *</label>
// // // // // // //                   <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Phone No *</label>
// // // // // // //                   <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Start Date *</label>
// // // // // // //                   <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>End Date *</label>
// // // // // // //                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="roles-checkbox-group">
// // // // // // //                   <label>Assign Roles *</label>
// // // // // // //                   <div className="checkbox-list">
// // // // // // //                     {roles.length > 0 ? (
// // // // // // //                       roles.map((role) => (
// // // // // // //                         <div key={role} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             id={`role-${role}`}
// // // // // // //                             checked={selectedRoles.includes(role)}
// // // // // // //                             onChange={() => handleRoleToggle(role)}
// // // // // // //                           />
// // // // // // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // // // //                             {role}
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))
// // // // // // //                     ) : (
// // // // // // //                       <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // // // //                     )}
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               {rolePages.length > 0 && (
// // // // // // //                 <div className="form-row">
// // // // // // //                   <div className="roles-checkbox-group">
// // // // // // //                     <label>Assign Pages to Roles</label>
// // // // // // //                     <div className="checkbox-list">
// // // // // // //                       {rolePages.map((page) => (
// // // // // // //                         <div key={`${page.page_name}-${page.role_name}`} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             checked={selectedPages.includes(page.page_name)}
// // // // // // //                             onChange={() => handlePageToggle(page.page_name)}
// // // // // // //                           />
// // // // // // //                           <label className="checkbox-label">
// // // // // // //                             {page.page_name} ({page.role_name})
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))}
// // // // // // //                     </div>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               )}

// // // // // // //               <div className="form-actions">
// // // // // // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // // // //                   Cancel
// // // // // // //                 </button>
// // // // // // //                 <button type="submit" className="save-btn">Save</button>
// // // // // // //               </div>
// // // // // // //             </form>

// // // // // // //             {message && <p className="message">{message}</p>}
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       )}

// // // // // // //       {orgTableData.length > 0 && (
// // // // // // //         <div className="org-table-container">
// // // // // // //           <h3>Existing Organizations</h3>
// // // // // // //           <table className="org-table">
// // // // // // //             <thead>
// // // // // // //               <tr>
// // // // // // //                 <th>ID</th>
// // // // // // //                 <th>Name</th>
// // // // // // //                 <th>Subdomain</th>
// // // // // // //                 <th>No. Employees</th>
// // // // // // //                 <th>Company Address</th>
// // // // // // //                 <th>Admin Email</th>
// // // // // // //                 <th>Contact Email</th>
// // // // // // //                 <th>Contact Phone</th>
// // // // // // //                 <th>Start Date</th>
// // // // // // //                 <th>End Date</th>
// // // // // // //               </tr>
// // // // // // //             </thead>
// // // // // // //             <tbody>
// // // // // // //               {orgTableData.map((org) => (
// // // // // // //                 <tr key={org.id}>
// // // // // // //                   <td>{org.id}</td>
// // // // // // //                   <td>{org.Name}</td>
// // // // // // //                   <td>{org.subdomain}</td>
// // // // // // //                   <td>{org.no_employees}</td>
// // // // // // //                   <td>{org.company_address}</td>
// // // // // // //                   <td>{org.admin_email}</td>
// // // // // // //                   <td>{org.contact_email_id}</td>
// // // // // // //                   <td>{org.contact_phone_no}</td>
// // // // // // //                   <td>{formatToIST(org.start_date)}</td>
// // // // // // //                   <td>{formatToIST(org.end_date)}</td>
// // // // // // //                 </tr>
// // // // // // //               ))}
// // // // // // //             </tbody>
// // // // // // //           </table>
// // // // // // //         </div>
// // // // // // //       )}
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default CreateOrganization;


// // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // import "./CreateOrganization.css";

// // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // //   const [name, setName] = useState("");
// // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // //   const [roles, setRoles] = useState([]);
// // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // //   const [rolePages, setRolePages] = useState([]);
// // // // // // //   const [selectedPages, setSelectedPages] = useState([]);
// // // // // // //   const [message, setMessage] = useState("");
// // // // // // //   const [orgTableData, setOrgTableData] = useState([]);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRoles = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // //           method: "GET",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });
// // // // // // //         if (!res.ok) throw new Error("Failed to fetch roles");
// // // // // // //         const data = await res.json();
// // // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // // //         setRoles(uniqueRoles);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role fetch error:", err);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     const fetchOrganizations = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });
// // // // // // //         const data = await res.json();
// // // // // // //         setOrgTableData(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Organization table fetch error:", err);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRoles();
// // // // // // //     fetchOrganizations();
// // // // // // //   }, [employeeId]);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRolePages = async () => {
// // // // // // //       if (selectedRoles.length === 0) {
// // // // // // //         setRolePages([]);
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       try {
// // // // // // //         const rolesQuery = selectedRoles.join(",");
// // // // // // //         const res = await fetch(
// // // // // // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // // // // // //           {
// // // // // // //             method: "GET",
// // // // // // //             headers: {
// // // // // // //               "Content-Type": "application/json",
// // // // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //               "x-employee-id": employeeId,
// // // // // // //             },
// // // // // // //           }
// // // // // // //         );
// // // // // // //         if (!res.ok) throw new Error("Failed to fetch role pages");
// // // // // // //         const data = await res.json();
// // // // // // //         setRolePages(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role pages fetch error:", err);
// // // // // // //         setRolePages([]);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRolePages();
// // // // // // //   }, [selectedRoles, employeeId]);

// // // // // // //   const handleRoleToggle = (role) => {
// // // // // // //     setSelectedRoles((prev) =>
// // // // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // // // //     );
// // // // // // //   };

// // // // // // //   const handlePageToggle = (page) => {
// // // // // // //     setSelectedPages((prev) => {
// // // // // // //       const exists = prev.some(
// // // // // // //         (p) => p.page_name === page.page_name && p.path === page.path
// // // // // // //       );
// // // // // // //       return exists
// // // // // // //         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// // // // // // //         : [...prev, page];
// // // // // // //     });
// // // // // // //   };

// // // // // // //   const handleSubmit = async (e) => {
// // // // // // //     e.preventDefault();
// // // // // // //     setMessage("");

// // // // // // //     try {
// // // // // // //       const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/create-organization`, {
// // // // // // //         method: "POST",
// // // // // // //         headers: {
// // // // // // //           "Content-Type": "application/json",
// // // // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //           "x-employee-id": employeeId,
// // // // // // //         },
// // // // // // //         body: JSON.stringify({
// // // // // // //           Name: name,
// // // // // // //           subdomain,
// // // // // // //           no_employees: parseInt(noEmployees),
// // // // // // //           company_address: companyAddress,
// // // // // // //           c_pan_no: cPanNo,
// // // // // // //           admin_email: adminEmail,
// // // // // // //           contact_email_id: contactEmail,
// // // // // // //           contact_phone_no: contactPhone,
// // // // // // //           start_date: startDate,
// // // // // // //           end_date: endDate,
// // // // // // //           roles: selectedRoles,
// // // // // // //           selectedPages: selectedPages,
// // // // // // //         }),
// // // // // // //       });

// // // // // // //       const data = await response.json();

// // // // // // //       if (response.ok) {
// // // // // // //         setMessage(data.message || "✅ Organization created successfully.");
// // // // // // //         setName("");
// // // // // // //         setSubdomain("");
// // // // // // //         setNoEmployees("");
// // // // // // //         setCompanyAddress("");
// // // // // // //         setCPanNo("");
// // // // // // //         setAdminEmail("");
// // // // // // //         setContactEmail("");
// // // // // // //         setContactPhone("");
// // // // // // //         setStartDate("");
// // // // // // //         setEndDate("");
// // // // // // //         setSelectedRoles([]);
// // // // // // //         setSelectedPages([]);
// // // // // // //         setShowForm(false);
// // // // // // //       } else {
// // // // // // //         setMessage(data.error || "❌ Failed to create organization.");
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Create organization error:", error);
// // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleCloseModal = (e) => {
// // // // // // //     if (e.target.className.includes("modal-overlay")) {
// // // // // // //       setShowForm(false);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const formatToIST = (dateString) => {
// // // // // // //     try {
// // // // // // //       const date = new Date(dateString);
// // // // // // //       if (isNaN(date.getTime())) return dateString;
// // // // // // //       return date.toLocaleString("en-IN", {
// // // // // // //         timeZone: "Asia/Kolkata",
// // // // // // //         year: "numeric",
// // // // // // //         month: "2-digit",
// // // // // // //         day: "2-digit",
// // // // // // //       });
// // // // // // //     } catch (error) {
// // // // // // //       return dateString;
// // // // // // //     }
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="create-org-wrapper">
// // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // //         ➕ Add Organization
// // // // // // //       </button>

// // // // // // //       {showForm && (
// // // // // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // // // // //           <div className="create-org-container">
// // // // // // //             <div className="form-header">
// // // // // // //               <h2>Create New Organization</h2>
// // // // // // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // // //                 ✕
// // // // // // //               </span>
// // // // // // //             </div>

// // // // // // //             <form className="org-form" onSubmit={handleSubmit}>
// // // // // // //               {/* Organization fields */}
// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Organization Name *</label>
// // // // // // //                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Display Name *</label>
// // // // // // //                   <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Number of Employees *</label>
// // // // // // //                   <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company Address *</label>
// // // // // // //                   <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company PAN No *</label>
// // // // // // //                   <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Admin Email ID *</label>
// // // // // // //                   <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row form-row-four">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Email ID *</label>
// // // // // // //                   <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Phone No *</label>
// // // // // // //                   <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Start Date *</label>
// // // // // // //                   <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>End Date *</label>
// // // // // // //                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               {/* Role selection */}
// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="roles-checkbox-group">
// // // // // // //                   <label>Assign Roles *</label>
// // // // // // //                   <div className="checkbox-list">
// // // // // // //                     {roles.length > 0 ? (
// // // // // // //                       roles.map((role) => (
// // // // // // //                         <div key={role} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             id={`role-${role}`}
// // // // // // //                             checked={selectedRoles.includes(role)}
// // // // // // //                             onChange={() => handleRoleToggle(role)}
// // // // // // //                           />
// // // // // // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // // // //                             {role}
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))
// // // // // // //                     ) : (
// // // // // // //                       <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // // // //                     )}
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               {/* Page selection */}
// // // // // // //               {rolePages.length > 0 && (
// // // // // // //                 <div className="form-row">
// // // // // // //                   <div className="roles-checkbox-group">
// // // // // // //                     <label>Assign Pages to Roles</label>
// // // // // // //                     <div className="checkbox-list">
// // // // // // //                       {rolePages.map((page, index) => (
// // // // // // //                         <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             checked={selectedPages.some(
// // // // // // //                               (p) => p.page_name === page.page_name && p.path === page.path
// // // // // // //                             )}
// // // // // // //                             onChange={() => handlePageToggle(page)}
// // // // // // //                           />
// // // // // // //                           <label className="checkbox-label">
// // // // // // //                             {page.page_name} ({page.role_name})
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))}
// // // // // // //                     </div>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               )}

// // // // // // //               <div className="form-actions">
// // // // // // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // // // //                   Cancel
// // // // // // //                 </button>
// // // // // // //                 <button type="submit" className="save-btn">Save</button>
// // // // // // //               </div>
// // // // // // //             </form>

// // // // // // //             {message && <p className="message">{message}</p>}
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       )}

// // // // // // //       {orgTableData.length > 0 && (
// // // // // // //         <div className="org-table-container">
// // // // // // //           <h3>Existing Organizations</h3>
// // // // // // //           <table className="org-table">
// // // // // // //             <thead>
// // // // // // //               <tr>
// // // // // // //                 <th>ID</th>
// // // // // // //                 <th>Name</th>
// // // // // // //                 <th>Subdomain</th>
// // // // // // //                 <th>No. Employees</th>
// // // // // // //                 <th>Company Address</th>
// // // // // // //                 <th>Admin Email</th>
// // // // // // //                 <th>Contact Email</th>
// // // // // // //                 <th>Contact Phone</th>
// // // // // // //                 <th>Start Date</th>
// // // // // // //                 <th>End Date</th>
// // // // // // //               </tr>
// // // // // // //             </thead>
// // // // // // //             <tbody>
// // // // // // //               {orgTableData.map((org) => (
// // // // // // //                 <tr key={org.id}>
// // // // // // //                   <td>{org.id}</td>
// // // // // // //                   <td>{org.Name}</td>
// // // // // // //                   <td>{org.subdomain}</td>
// // // // // // //                   <td>{org.no_employees}</td>
// // // // // // //                   <td>{org.company_address}</td>
// // // // // // //                   <td>{org.admin_email}</td>
// // // // // // //                   <td>{org.contact_email_id}</td>
// // // // // // //                   <td>{org.contact_phone_no}</td>
// // // // // // //                   <td>{formatToIST(org.start_date)}</td>
// // // // // // //                   <td>{formatToIST(org.end_date)}</td>
// // // // // // //                 </tr>
// // // // // // //               ))}
// // // // // // //             </tbody>
// // // // // // //           </table>
// // // // // // //         </div>
// // // // // // //       )}
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default CreateOrganization;

// // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // import "./CreateOrganization.css";

// // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // //   const [isEditing, setIsEditing] = useState(false);
// // // // // // //   const [currentOrgId, setCurrentOrgId] = useState(null);
// // // // // // //   const [name, setName] = useState("");
// // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // //   const [roles, setRoles] = useState([]);
// // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // //   const [rolePages, setRolePages] = useState([]);
// // // // // // //   const [selectedPages, setSelectedPages] = useState([]);
// // // // // // //   const [message, setMessage] = useState("");
// // // // // // //   const [orgTableData, setOrgTableData] = useState([]);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRoles = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // //           method: "GET",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });
// // // // // // //         if (!res.ok) throw new Error("Failed to fetch roles");
// // // // // // //         const data = await res.json();
// // // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // // //         setRoles(uniqueRoles);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role fetch error:", err);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     const fetchOrganizations = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });
// // // // // // //         const data = await res.json();
// // // // // // //         setOrgTableData(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Organization table fetch error:", err);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRoles();
// // // // // // //     fetchOrganizations();
// // // // // // //   }, [employeeId]);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRolePages = async () => {
// // // // // // //       if (selectedRoles.length === 0) {
// // // // // // //         setRolePages([]);
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       try {
// // // // // // //         const rolesQuery = selectedRoles.join(",");
// // // // // // //         const res = await fetch(
// // // // // // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // // // // // //           {
// // // // // // //             method: "GET",
// // // // // // //             headers: {
// // // // // // //               "Content-Type": "application/json",
// // // // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //               "x-employee-id": employeeId,
// // // // // // //             },
// // // // // // //           }
// // // // // // //         );
// // // // // // //         if (!res.ok) throw new Error("Failed to fetch role pages");
// // // // // // //         const data = await res.json();
// // // // // // //         setRolePages(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role pages fetch error:", err);
// // // // // // //         setRolePages([]);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRolePages();
// // // // // // //   }, [selectedRoles, employeeId]);

// // // // // // //   const handleRoleToggle = (role) => {
// // // // // // //     setSelectedRoles((prev) =>
// // // // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // // // //     );
// // // // // // //   };

// // // // // // //   const handlePageToggle = (page) => {
// // // // // // //     setSelectedPages((prev) => {
// // // // // // //       const exists = prev.some(
// // // // // // //         (p) => p.page_name === page.page_name && p.path === page.path
// // // // // // //       );
// // // // // // //       return exists
// // // // // // //         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// // // // // // //         : [...prev, page];
// // // // // // //     });
// // // // // // //   };

// // // // // // //   const handleEdit = (org) => {
// // // // // // //     setIsEditing(true);
// // // // // // //     setCurrentOrgId(org.id);
// // // // // // //     setName(org.Name);
// // // // // // //     setSubdomain(org.subdomain);
// // // // // // //     setNoEmployees(org.no_employees);
// // // // // // //     setCompanyAddress(org.company_address);
// // // // // // //     setCPanNo(org.c_pan_no);
// // // // // // //     setAdminEmail(org.admin_email);
// // // // // // //     setContactEmail(org.contact_email_id);
// // // // // // //     setContactPhone(org.contact_phone_no);
// // // // // // //     setStartDate(org.start_date.split("T")[0]);
// // // // // // //     setEndDate(org.end_date.split("T")[0]);
// // // // // // //     setShowForm(true);
// // // // // // //   };

// // // // // // //   const handleDelete = async (orgId) => {
// // // // // // //     if (!window.confirm("Are you sure you want to delete this organization?")) return;

// // // // // // //     try {
// // // // // // //       const response = await fetch(
// // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
// // // // // // //         {
// // // // // // //           method: "DELETE",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         }
// // // // // // //       );

// // // // // // //       const data = await response.json();

// // // // // // //       if (response.ok) {
// // // // // // //         setMessage(data.message || "✅ Organization deleted successfully.");
// // // // // // //         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
// // // // // // //       } else {
// // // // // // //         setMessage(data.error || "❌ Failed to delete organization.");
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Delete organization error:", error);
// // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleSubmit = async (e) => {
// // // // // // //     e.preventDefault();
// // // // // // //     setMessage("");

// // // // // // //     const orgData = {
// // // // // // //       Name: name,
// // // // // // //       subdomain,
// // // // // // //       no_employees: parseInt(noEmployees),
// // // // // // //       company_address: companyAddress,
// // // // // // //       c_pan_no: cPanNo,
// // // // // // //       admin_email: adminEmail,
// // // // // // //       contact_email_id: contactEmail,
// // // // // // //       contact_phone_no: contactPhone,
// // // // // // //       start_date: startDate,
// // // // // // //       end_date: endDate,
// // // // // // //       roles: selectedRoles,
// // // // // // //       selectedPages: selectedPages,
// // // // // // //     };

// // // // // // //     try {
// // // // // // //       const url = isEditing
// // // // // // //         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
// // // // // // //         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;

// // // // // // //       const method = isEditing ? "PUT" : "POST";

// // // // // // //       const response = await fetch(url, {
// // // // // // //         method,
// // // // // // //         headers: {
// // // // // // //           "Content-Type": "application/json",
// // // // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //           "x-employee-id": employeeId,
// // // // // // //         },
// // // // // // //         body: JSON.stringify(orgData),
// // // // // // //       });

// // // // // // //       const data = await response.json();

// // // // // // //       if (response.ok) {
// // // // // // //         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
// // // // // // //         if (isEditing) {
// // // // // // //           setOrgTableData((prev) =>
// // // // // // //             prev.map((org) =>
// // // // // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // // // // //             )
// // // // // // //           );
// // // // // // //         } else {
// // // // // // //           // Refresh the organization list
// // // // // // //           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // // //             headers: {
// // // // // // //               "Content-Type": "application/json",
// // // // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //               "x-employee-id": employeeId,
// // // // // // //             },
// // // // // // //           });
// // // // // // //           const newData = await res.json();
// // // // // // //           setOrgTableData(newData);
// // // // // // //         }
// // // // // // //         // Reset form
// // // // // // //         setName("");
// // // // // // //         setSubdomain("");
// // // // // // //         setNoEmployees("");
// // // // // // //         setCompanyAddress("");
// // // // // // //         setCPanNo("");
// // // // // // //         setAdminEmail("");
// // // // // // //         setContactEmail("");
// // // // // // //         setContactPhone("");
// // // // // // //         setStartDate("");
// // // // // // //         setEndDate("");
// // // // // // //         setSelectedRoles([]);
// // // // // // //         setSelectedPages([]);
// // // // // // //         setShowForm(false);
// // // // // // //         setIsEditing(false);
// // // // // // //         setCurrentOrgId(null);
// // // // // // //       } else {
// // // // // // //         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
// // // // // // //       setMessage("❌ Server error. Please try again later.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleCloseModal = (e) => {
// // // // // // //     if (e.target.className.includes("modal-overlay")) {
// // // // // // //       setShowForm(false);
// // // // // // //       setIsEditing(false);
// // // // // // //       setCurrentOrgId(null);
// // // // // // //       // Reset form fields
// // // // // // //       setName("");
// // // // // // //       setSubdomain("");
// // // // // // //       setNoEmployees("");
// // // // // // //       setCompanyAddress("");
// // // // // // //       setCPanNo("");
// // // // // // //       setAdminEmail("");
// // // // // // //       setContactEmail("");
// // // // // // //       setContactPhone("");
// // // // // // //       setStartDate("");
// // // // // // //       setEndDate("");
// // // // // // //       setSelectedRoles([]);
// // // // // // //       setSelectedPages([]);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const formatToIST = (dateString) => {
// // // // // // //     try {
// // // // // // //       const date = new Date(dateString);
// // // // // // //       if (isNaN(date.getTime())) return dateString;
// // // // // // //       return date.toLocaleString("en-IN", {
// // // // // // //         timeZone: "Asia/Kolkata",
// // // // // // //         year: "numeric",
// // // // // // //         month: "2-digit",
// // // // // // //         day: "2-digit",
// // // // // // //       });
// // // // // // //     } catch (error) {
// // // // // // //       return dateString;
// // // // // // //     }
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="create-org-wrapper">
// // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // //         ➕ Add Organization
// // // // // // //       </button>

// // // // // // //       {showForm && (
// // // // // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // // // // //           <div className="create-org-container">
// // // // // // //             <div className="form-header">
// // // // // // //               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
// // // // // // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // // //                 ✕
// // // // // // //               </span>
// // // // // // //             </div>

// // // // // // //             <form className="org-form" onSubmit={handleSubmit}>
// // // // // // //               {/* Organization fields */}
// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Organization Name *</label>
// // // // // // //                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Display Name *</label>
// // // // // // //                   <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Number of Employees *</label>
// // // // // // //                   <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company Address *</label>
// // // // // // //                   <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company PAN No *</label>
// // // // // // //                   <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Admin Email ID *</label>
// // // // // // //                   <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row form-row-four">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Email ID *</label>
// // // // // // //                   <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Phone No *</label>
// // // // // // //                   <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Start Date *</label>
// // // // // // //                   <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>End Date *</label>
// // // // // // //                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               {/* Role selection */}
// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="roles-checkbox-group">
// // // // // // //                   <label>Assign Roles *</label>
// // // // // // //                   <div className="checkbox-list">
// // // // // // //                     {roles.length > 0 ? (
// // // // // // //                       roles.map((role) => (
// // // // // // //                         <div key={role} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             id={`role-${role}`}
// // // // // // //                             checked={selectedRoles.includes(role)}
// // // // // // //                             onChange={() => handleRoleToggle(role)}
// // // // // // //                           />
// // // // // // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // // // //                             {role}
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))
// // // // // // //                     ) : (
// // // // // // //                       <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // // // //                     )}
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               {/* Page selection */}
// // // // // // //               {rolePages.length > 0 && (
// // // // // // //                 <div className="form-row">
// // // // // // //                   <div className="roles-checkbox-group">
// // // // // // //                     <label>Assign Pages to Roles</label>
// // // // // // //                     <div className="checkbox-list">
// // // // // // //                       {rolePages.map((page, index) => (
// // // // // // //                         <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             checked={selectedPages.some(
// // // // // // //                               (p) => p.page_name === page.page_name && p.path === page.path
// // // // // // //                             )}
// // // // // // //                             onChange={() => handlePageToggle(page)}
// // // // // // //                           />
// // // // // // //                           <label className="checkbox-label">
// // // // // // //                             {page.page_name} ({page.role_name})
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))}
// // // // // // //                     </div>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               )}

// // // // // // //               <div className="form-actions">
// // // // // // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // // // //                   Cancel
// // // // // // //                 </button>
// // // // // // //                 <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
// // // // // // //               </div>
// // // // // // //             </form>

// // // // // // //             {message && <p className="message">{message}</p>}
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       )}

// // // // // // //       {orgTableData.length > 0 && (
// // // // // // //         <div className="org-table-container">
// // // // // // //           <h3>Existing Organizations</h3>
// // // // // // //           <table className="org-table">
// // // // // // //             <thead>
// // // // // // //               <tr>
// // // // // // //                 <th>ID</th>
// // // // // // //                 <th>Name</th>
// // // // // // //                 <th>Subdomain</th>
// // // // // // //                 <th>No. Employees</th>
// // // // // // //                 <th>Company Address</th>
// // // // // // //                 <th>Admin Email</th>
// // // // // // //                 <th>Contact Email</th>
// // // // // // //                 <th>Contact Phone</th>
// // // // // // //                 <th>Start Date</th>
// // // // // // //                 <th>End Date</th>
// // // // // // //                 <th>Actions</th>
// // // // // // //               </tr>
// // // // // // //             </thead>
// // // // // // //             <tbody>
// // // // // // //               {orgTableData.map((org) => (
// // // // // // //                 <tr key={org.id}>
// // // // // // //                   <td>{org.id}</td>
// // // // // // //                   <td>{org.Name}</td>
// // // // // // //                   <td>{org.subdomain}</td>
// // // // // // //                   <td>{org.no_employees}</td>
// // // // // // //                   <td>{org.company_address}</td>
// // // // // // //                   <td>{org.admin_email}</td>
// // // // // // //                   <td>{org.contact_email_id}</td>
// // // // // // //                   <td>{org.contact_phone_no}</td>
// // // // // // //                   <td>{formatToIST(org.start_date)}</td>
// // // // // // //                   <td>{formatToIST(org.end_date)}</td>
// // // // // // //                   <td>
// // // // // // //                     <button
// // // // // // //                       className="edit-btn"
// // // // // // //                       onClick={() => handleEdit(org)}
// // // // // // //                       style={{ marginRight: "10px", padding: "5px 10px" }}
// // // // // // //                     >
// // // // // // //                       Edit
// // // // // // //                     </button>
// // // // // // //                     <button
// // // // // // //                       className="delete-btn"
// // // // // // //                       onClick={() => handleDelete(org.id)}
// // // // // // //                       style={{ padding: "5px 10px" }}
// // // // // // //                     >
// // // // // // //                       Delete
// // // // // // //                     </button>
// // // // // // //                   </td>
// // // // // // //                 </tr>
// // // // // // //               ))}
// // // // // // //             </tbody>
// // // // // // //           </table>
// // // // // // //         </div>
// // // // // // //       )}
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default CreateOrganization;

// // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // import "./CreateOrganization.css";

// // // // // // // const CreateOrganization = ({ employeeId }) => {
// // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // //   const [isEditing, setIsEditing] = useState(false);
// // // // // // //   const [currentOrgId, setCurrentOrgId] = useState(null);
// // // // // // //   const [name, setName] = useState("");
// // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // //   const [roles, setRoles] = useState([]);
// // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // //   const [rolePages, setRolePages] = useState([]);
// // // // // // //   const [selectedPages, setSelectedPages] = useState([]);
// // // // // // //   const [message, setMessage] = useState("");
// // // // // // //   const [orgTableData, setOrgTableData] = useState([]);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRoles = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // //           method: "GET",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });
// // // // // // //         if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
// // // // // // //         const data = await res.json();
// // // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // // //         setRoles(uniqueRoles);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role fetch error:", err);
// // // // // // //         setMessage("❌ Failed to fetch roles.");
// // // // // // //       }
// // // // // // //     };

// // // // // // //     const fetchOrganizations = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });
// // // // // // //         if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // // // // //         const data = await res.json();
// // // // // // //         setOrgTableData(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Organization table fetch error:", err);
// // // // // // //         setMessage("❌ Failed to fetch organizations.");
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRoles();
// // // // // // //     fetchOrganizations();
// // // // // // //   }, [employeeId]);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRolePages = async () => {
// // // // // // //       if (selectedRoles.length === 0) {
// // // // // // //         setRolePages([]);
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       try {
// // // // // // //         const rolesQuery = selectedRoles.join(",");
// // // // // // //         const res = await fetch(
// // // // // // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // // // // // //           {
// // // // // // //             method: "GET",
// // // // // // //             headers: {
// // // // // // //               "Content-Type": "application/json",
// // // // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //               "x-employee-id": employeeId,
// // // // // // //             },
// // // // // // //           }
// // // // // // //         );
// // // // // // //         if (!res.ok) throw new Error(`Failed to fetch role pages: ${res.status}`);
// // // // // // //         const data = await res.json();
// // // // // // //         setRolePages(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role pages fetch error:", err);
// // // // // // //         setRolePages([]);
// // // // // // //         setMessage("❌ Failed to fetch role pages.");
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRolePages();
// // // // // // //   }, [selectedRoles, employeeId]);

// // // // // // //   const handleRoleToggle = (role) => {
// // // // // // //     setSelectedRoles((prev) =>
// // // // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // // // //     );
// // // // // // //   };

 
// // // // // // //   const handlePageToggle = (page) => {
// // // // // // //   setSelectedPages((prev) => {
// // // // // // //     const exists = prev.some(
// // // // // // //       (p) => p.page_name === page.page_name && p.path === page.path
// // // // // // //     );
// // // // // // //     return exists
// // // // // // //       ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// // // // // // //       : [...prev, { ...page, role_id: page.role_id || 0 }]; // Include role_id
// // // // // // //   });
// // // // // // // };

  
// // // // // // //   const handleEdit = async (org) => {
// // // // // // //   setIsEditing(true);
// // // // // // //   setCurrentOrgId(org.id);
// // // // // // //   setName(org.Name || "");
// // // // // // //   setSubdomain(org.subdomain || "");
// // // // // // //   setNoEmployees(org.no_employees || "");
// // // // // // //   setCompanyAddress(org.company_address || "");
// // // // // // //   setCPanNo(org.c_pan_no || "");
// // // // // // //   setAdminEmail(org.admin_email || "");
// // // // // // //   setContactEmail(org.contact_email_id || "");
// // // // // // //   setContactPhone(org.contact_phone_no || "");
// // // // // // //   setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
// // // // // // //   setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
// // // // // // //   setSelectedRoles([]); // Reset roles initially
// // // // // // //   setSelectedPages([]); // Reset pages initially

// // // // // // //   try {
// // // // // // //     const url = `${process.env.REACT_APP_BACKEND_URL}/organization-details/${org.id}`;
// // // // // // //     console.log("Fetching roles and pages from:", url);
// // // // // // //     console.log("Headers:", {
// // // // // // //       "Content-Type": "application/json",
// // // // // // //       "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //       "x-employee-id": employeeId,
// // // // // // //     });
// // // // // // //     console.log("Org ID:", org.id);

// // // // // // //     const res = await fetch(url, {
// // // // // // //       method: "GET",
// // // // // // //       headers: {
// // // // // // //         "Content-Type": "application/json",
// // // // // // //         "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //         "x-employee-id": employeeId,
// // // // // // //       },
// // // // // // //     });

// // // // // // //     console.log("Response Status:", res.status);
// // // // // // //     const text = await res.text();
// // // // // // //     console.log("Raw Response:", text);

// // // // // // //     if (!res.ok) {
// // // // // // //       throw new Error(`Failed to fetch organization roles and pages: ${res.status} - ${text}`);
// // // // // // //     }

// // // // // // //     let data;
// // // // // // //     try {
// // // // // // //       data = JSON.parse(text);
// // // // // // //       console.log("Parsed Response Data:", data);
// // // // // // //     } catch (parseError) {
// // // // // // //       console.error("JSON Parse Error:", parseError);
// // // // // // //       throw new Error(`Invalid JSON response: ${text}`);
// // // // // // //     }

// // // // // // //     setSelectedRoles(data.roles ? data.roles.map((r) => r.role_name) : []);
// // // // // // //     setSelectedPages(data.pages || []);
// // // // // // //   } catch (err) {
// // // // // // //     console.error("Error fetching org roles and pages:", err);
// // // // // // //     setMessage(`❌ Failed to load organization roles and pages: ${err.message}`);
// // // // // // //   }

// // // // // // //   setShowForm(true);
// // // // // // // };

// // // // // // //   const handleDelete = async (orgId) => {
// // // // // // //     if (!window.confirm("Are you sure you want to delete this organization?")) return;

// // // // // // //     try {
// // // // // // //       const response = await fetch(
// // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
// // // // // // //         {
// // // // // // //           method: "DELETE",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         }
// // // // // // //       );

// // // // // // //       console.log("Delete Response Status:", response.status);
// // // // // // //       const text = await response.text();
// // // // // // //       console.log("Delete Raw Response:", text);

// // // // // // //       let data;
// // // // // // //       try {
// // // // // // //         data = JSON.parse(text);
// // // // // // //       } catch (parseError) {
// // // // // // //         console.error("JSON Parse Error:", parseError);
// // // // // // //         setMessage(`❌ Server returned invalid response (Status: ${response.status})`);
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       if (response.ok) {
// // // // // // //         setMessage(data.message || "✅ Organization deleted successfully.");
// // // // // // //         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
// // // // // // //       } else {
// // // // // // //         setMessage(data.error || "❌ Failed to delete organization.");
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Delete organization error:", error);
// // // // // // //       setMessage(`❌ Server error: ${error.message}`);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleSubmit = async (e) => {
// // // // // // //     e.preventDefault();
// // // // // // //     setMessage("");

// // // // // // //     const orgData = {
// // // // // // //       Name: name,
// // // // // // //       subdomain,
// // // // // // //       no_employees: parseInt(noEmployees) || 0,
// // // // // // //       company_address: companyAddress,
// // // // // // //       c_pan_no: cPanNo,
// // // // // // //       admin_email: adminEmail,
// // // // // // //       contact_email_id: contactEmail,
// // // // // // //       contact_phone_no: contactPhone,
// // // // // // //       start_date: startDate,
// // // // // // //       end_date: endDate,
// // // // // // //       roles: selectedRoles,
// // // // // // //       selectedPages: selectedPages,
// // // // // // //     };

// // // // // // //     try {
// // // // // // //       const url = isEditing
// // // // // // //         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
// // // // // // //         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;
// // // // // // //       const method = isEditing ? "PUT" : "POST";

// // // // // // //       console.log("Request URL:", url);
// // // // // // //       console.log("Request Method:", method);
// // // // // // //       console.log("Request Data:", orgData);
// // // // // // //       console.log("Headers:", {
// // // // // // //         "Content-Type": "application/json",
// // // // // // //         "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //         "x-employee-id": employeeId,
// // // // // // //       });

// // // // // // //       const response = await fetch(url, {
// // // // // // //         method,
// // // // // // //         headers: {
// // // // // // //           "Content-Type": "application/json",
// // // // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //           "x-employee-id": employeeId,
// // // // // // //         },
// // // // // // //         body: JSON.stringify(orgData),
// // // // // // //       });

// // // // // // //       console.log("Response Status:", response.status);
// // // // // // //       const text = await response.text();
// // // // // // //       console.log("Raw Response:", text);

// // // // // // //       let data;
// // // // // // //       try {
// // // // // // //         data = JSON.parse(text);
// // // // // // //       } catch (parseError) {
// // // // // // //         console.error("JSON Parse Error:", parseError);
// // // // // // //         setMessage(`❌ Server returned invalid response (Status: ${response.status})`);
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       if (response.ok) {
// // // // // // //         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
// // // // // // //         if (isEditing) {
// // // // // // //           setOrgTableData((prev) =>
// // // // // // //             prev.map((org) =>
// // // // // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // // // // //             )
// // // // // // //           );
// // // // // // //         } else {
// // // // // // //           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // // //             headers: {
// // // // // // //               "Content-Type": "application/json",
// // // // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //               "x-employee-id": employeeId,
// // // // // // //             },
// // // // // // //           });
// // // // // // //           if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // // // // //           const newData = await res.json();
// // // // // // //           setOrgTableData(newData);
// // // // // // //         }
// // // // // // //         setName("");
// // // // // // //         setSubdomain("");
// // // // // // //         setNoEmployees("");
// // // // // // //         setCompanyAddress("");
// // // // // // //         setCPanNo("");
// // // // // // //         setAdminEmail("");
// // // // // // //         setContactEmail("");
// // // // // // //         setContactPhone("");
// // // // // // //         setStartDate("");
// // // // // // //         setEndDate("");
// // // // // // //         setSelectedRoles([]);
// // // // // // //         setSelectedPages([]);
// // // // // // //         setShowForm(false);
// // // // // // //         setIsEditing(false);
// // // // // // //         setCurrentOrgId(null);
// // // // // // //       } else {
// // // // // // //         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
// // // // // // //       setMessage(`❌ Server error: ${error.message}`);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleCloseModal = (e) => {
// // // // // // //     if (e.target.className.includes("modal-overlay")) {
// // // // // // //       setShowForm(false);
// // // // // // //       setIsEditing(false);
// // // // // // //       setCurrentOrgId(null);
// // // // // // //       setName("");
// // // // // // //       setSubdomain("");
// // // // // // //       setNoEmployees("");
// // // // // // //       setCompanyAddress("");
// // // // // // //       setCPanNo("");
// // // // // // //       setAdminEmail("");
// // // // // // //       setContactEmail("");
// // // // // // //       setContactPhone("");
// // // // // // //       setStartDate("");
// // // // // // //       setEndDate("");
// // // // // // //       setSelectedRoles([]);
// // // // // // //       setSelectedPages([]);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const formatToIST = (dateString) => {
// // // // // // //     try {
// // // // // // //       const date = new Date(dateString);
// // // // // // //       if (isNaN(date.getTime())) return dateString;
// // // // // // //       return date.toLocaleString("en-IN", {
// // // // // // //         timeZone: "Asia/Kolkata",
// // // // // // //         year: "numeric",
// // // // // // //         month: "2-digit",
// // // // // // //         day: "2-digit",
// // // // // // //       });
// // // // // // //     } catch (error) {
// // // // // // //       return dateString;
// // // // // // //     }
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="create-org-wrapper">
// // // // // // //       <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // //         ➕ Add Organization
// // // // // // //       </button>

// // // // // // //       {showForm && (
// // // // // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // // // // //           <div className="create-org-container">
// // // // // // //             <div className="form-header">
// // // // // // //               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
// // // // // // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // // //                 ✕
// // // // // // //               </span>
// // // // // // //             </div>

// // // // // // //             <form className="org-form" onSubmit={handleSubmit}>
// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Organization Name *</label>
// // // // // // //                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Display Name *</label>
// // // // // // //                   <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Number of Employees *</label>
// // // // // // //                   <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company Address *</label>
// // // // // // //                   <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company PAN No *</label>
// // // // // // //                   <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Admin Email ID *</label>
// // // // // // //                   <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row form-row-four">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Email ID *</label>
// // // // // // //                   <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Phone No *</label>
// // // // // // //                   <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Start Date *</label>
// // // // // // //                   <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>End Date *</label>
// // // // // // //                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="roles-checkbox-group">
// // // // // // //                   <label>Assign Roles *</label>
// // // // // // //                   <div className="checkbox-list">
// // // // // // //                     {roles.length > 0 ? (
// // // // // // //                       roles.map((role) => (
// // // // // // //                         <div key={role} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             id={`role-${role}`}
// // // // // // //                             checked={selectedRoles.includes(role)}
// // // // // // //                             onChange={() => handleRoleToggle(role)}
// // // // // // //                           />
// // // // // // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // // // //                             {role}
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))
// // // // // // //                     ) : (
// // // // // // //                       <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // // // //                     )}
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               {rolePages.length > 0 && (
// // // // // // //                 <div className="form-row">
// // // // // // //                   <div className="roles-checkbox-group">
// // // // // // //                     <label>Assign Pages to Roles</label>
// // // // // // //                     <div className="checkbox-list">
// // // // // // //                       {rolePages.map((page, index) => (
// // // // // // //                         <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             checked={selectedPages.some(
// // // // // // //                               (p) => p.page_name === page.page_name && p.path === page.path
// // // // // // //                             )}
// // // // // // //                             onChange={() => handlePageToggle(page)}
// // // // // // //                           />
// // // // // // //                           <label className="checkbox-label">
// // // // // // //                             {page.page_name}
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))}
// // // // // // //                     </div>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               )}

// // // // // // //               <div className="form-actions">
// // // // // // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // // // //                   Cancel
// // // // // // //                 </button>
// // // // // // //                 <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
// // // // // // //               </div>
// // // // // // //             </form>

// // // // // // //             {message && <p className="message">{message}</p>}
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       )}

// // // // // // //       {orgTableData.length > 0 && (
// // // // // // //         <div className="org-table-container">
// // // // // // //           <h3>Existing Organizations</h3>
// // // // // // //           <table className="org-table">
// // // // // // //             <thead>
// // // // // // //               <tr>
// // // // // // //                 <th>ID</th>
// // // // // // //                 <th>Name</th>
// // // // // // //                 <th>Subdomain</th>
// // // // // // //                 <th>No. Employees</th>
// // // // // // //                 <th>Company Address</th>
// // // // // // //                 <th>Admin Email</th>
// // // // // // //                 <th>Contact Email</th>
// // // // // // //                 <th>Contact Phone</th>
// // // // // // //                 <th>Start Date</th>
// // // // // // //                 <th>End Date</th>
// // // // // // //                 <th>Actions</th>
// // // // // // //               </tr>
// // // // // // //             </thead>
// // // // // // //             <tbody>
// // // // // // //               {orgTableData.map((org) => (
// // // // // // //                 <tr key={org.id}>
// // // // // // //                   <td>{org.id}</td>
// // // // // // //                   <td>{org.Name}</td>
// // // // // // //                   <td>{org.subdomain}</td>
// // // // // // //                   <td>{org.no_employees}</td>
// // // // // // //                   <td>{org.company_address}</td>
// // // // // // //                   <td>{org.admin_email}</td>
// // // // // // //                   <td>{org.contact_email_id}</td>
// // // // // // //                   <td>{org.contact_phone_no}</td>
// // // // // // //                   <td>{formatToIST(org.start_date)}</td>
// // // // // // //                   <td>{formatToIST(org.end_date)}</td>
// // // // // // //                   <td>
// // // // // // //                     <button
// // // // // // //                       className="edit-btn"
// // // // // // //                       onClick={() => handleEdit(org)}
// // // // // // //                       style={{ marginRight: "10px", padding: "5px 10px" }}
// // // // // // //                     >
// // // // // // //                       Edit
// // // // // // //                     </button>
// // // // // // //                     <button
// // // // // // //                       className="delete-btn"
// // // // // // //                       onClick={() => handleDelete(org.id)}
// // // // // // //                       style={{ padding: "5px 10px" }}
// // // // // // //                     >
// // // // // // //                       Delete
// // // // // // //                     </button>
// // // // // // //                   </td>
// // // // // // //                 </tr>
// // // // // // //               ))}
// // // // // // //             </tbody>
// // // // // // //           </table>
// // // // // // //         </div>
// // // // // // //       )}
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default CreateOrganization;

// // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // import "./CreateOrganization.css";

// // // // // // // // Custom debounce hook
// // // // // // // const useDebounce = (value, delay) => {
// // // // // // //   const [debouncedValue, setDebouncedValue] = useState(value);

// // // // // // //   useEffect(() => {
// // // // // // //     const handler = setTimeout(() => {
// // // // // // //       setDebouncedValue(value);
// // // // // // //     }, delay);

// // // // // // //     return () => {
// // // // // // //       clearTimeout(handler);
// // // // // // //     };
// // // // // // //   }, [value, delay]);

// // // // // // //   return debouncedValue;
// // // // // // // };

// // // // // // // const CreateOrganization = ({ employeeId = "default-employee-id" }) => {
// // // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // // //   const [isEditing, setIsEditing] = useState(false);
// // // // // // //   const [currentOrgId, setCurrentOrgId] = useState(null);
// // // // // // //   const [name, setName] = useState("");
// // // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // // //   const [startDate, setStartDate] = useState("");
// // // // // // //   const [endDate, setEndDate] = useState("");
// // // // // // //   const [roles, setRoles] = useState([]);
// // // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // // //   const [rolePages, setRolePages] = useState([]);
// // // // // // //   const [selectedPages, setSelectedPages] = useState([]);
// // // // // // //   const [message, setMessage] = useState("");
// // // // // // //   const [orgTableData, setOrgTableData] = useState([]);
// // // // // // //   const [searchTerm, setSearchTerm] = useState("");
// // // // // // //   const [searchField, setSearchField] = useState("Name"); // Default to Name
// // // // // // //   const [filteredOrgData, setFilteredOrgData] = useState([]);

// // // // // // //   const debouncedSearchTerm = useDebounce(searchTerm, 300);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRoles = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // // //           method: "GET",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });
// // // // // // //         if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
// // // // // // //         const data = await res.json();
// // // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // // //         setRoles(uniqueRoles);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role fetch error:", err);
// // // // // // //         setMessage("❌ Failed to fetch roles.");
// // // // // // //       }
// // // // // // //     };

// // // // // // //     const fetchOrganizations = async () => {
// // // // // // //       try {
// // // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         });
// // // // // // //         if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // // // // //         const data = await res.json();
// // // // // // //         setOrgTableData(data);
// // // // // // //         setFilteredOrgData(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Organization table fetch error:", err);
// // // // // // //         setMessage("❌ Failed to fetch organizations.");
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRoles();
// // // // // // //     fetchOrganizations();
// // // // // // //   }, [employeeId]);

// // // // // // //   useEffect(() => {
// // // // // // //     const fetchRolePages = async () => {
// // // // // // //       if (selectedRoles.length === 0) {
// // // // // // //         setRolePages([]);
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       try {
// // // // // // //         const rolesQuery = selectedRoles.join(",");
// // // // // // //         const res = await fetch(
// // // // // // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // // // // // //           {
// // // // // // //             method: "GET",
// // // // // // //             headers: {
// // // // // // //               "Content-Type": "application/json",
// // // // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //               "x-employee-id": employeeId,
// // // // // // //             },
// // // // // // //           }
// // // // // // //         );
// // // // // // //         if (!res.ok) throw new Error(`Failed to fetch role pages: ${res.status}`);
// // // // // // //         const data = await res.json();
// // // // // // //         setRolePages(data);
// // // // // // //       } catch (err) {
// // // // // // //         console.error("Role pages fetch error:", err);
// // // // // // //         setRolePages([]);
// // // // // // //         setMessage("❌ Failed to fetch role pages.");
// // // // // // //       }
// // // // // // //     };

// // // // // // //     fetchRolePages();
// // // // // // //   }, [selectedRoles, employeeId]);

// // // // // // //   // Real-time search filtering based on selected field
// // // // // // //   useEffect(() => {
// // // // // // //     const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
// // // // // // //     const filtered = orgTableData.filter((org) => {
// // // // // // //       if (!lowerCaseSearchTerm) return true;
// // // // // // //       switch (searchField) {
// // // // // // //         case "Name":
// // // // // // //           return org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // // // //                  org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm);
// // // // // // //         case "ID":
// // // // // // //           return org.id.toString().includes(lowerCaseSearchTerm);
// // // // // // //         case "Date":
// // // // // // //           return org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // // // //                  org.end_date?.toLowerCase().includes(lowerCaseSearchTerm);
// // // // // // //         case "Contact":
// // // // // // //           return org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // // // //                  org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm);
// // // // // // //         default:
// // // // // // //           return true;
// // // // // // //       }
// // // // // // //     });
// // // // // // //     setFilteredOrgData(filtered);
// // // // // // //   }, [debouncedSearchTerm, searchField, orgTableData]);

// // // // // // //   const handleSearchInputChange = (e) => {
// // // // // // //     setSearchTerm(e.target.value);
// // // // // // //   };

// // // // // // //   const handleSearchFieldChange = (e) => {
// // // // // // //     setSearchField(e.target.value);
// // // // // // //   };

// // // // // // //   const handleRoleToggle = (role) => {
// // // // // // //     setSelectedRoles((prev) =>
// // // // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // // // //     );
// // // // // // //   };

// // // // // // //   const handlePageToggle = (page) => {
// // // // // // //     setSelectedPages((prev) => {
// // // // // // //       const exists = prev.some(
// // // // // // //         (p) => p.page_name === page.page_name && p.path === page.path
// // // // // // //       );
// // // // // // //       return exists
// // // // // // //         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// // // // // // //         : [...prev, { ...page, role_id: page.role_id || 0, role_name: page.role_name || null }];
// // // // // // //     });
// // // // // // //   };

// // // // // // //   const handleEdit = async (org) => {
// // // // // // //     setIsEditing(true);
// // // // // // //     setCurrentOrgId(org.id);
// // // // // // //     setName(org.Name || "");
// // // // // // //     setSubdomain(org.subdomain || "");
// // // // // // //     setNoEmployees(org.no_employees || "");
// // // // // // //     setCompanyAddress(org.company_address || "");
// // // // // // //     setCPanNo(org.c_pan_no || "");
// // // // // // //     setAdminEmail(org.admin_email || "");
// // // // // // //     setContactEmail(org.contact_email_id || "");
// // // // // // //     setContactPhone(org.contact_phone_no || "");
// // // // // // //     setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
// // // // // // //     setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
// // // // // // //     setSelectedRoles([]);
// // // // // // //     setSelectedPages([]);

// // // // // // //     try {
// // // // // // //       const url = `${process.env.REACT_APP_BACKEND_URL}/organization-details/${org.id}`;
// // // // // // //       console.log("Fetching roles and pages from:", url);
// // // // // // //       console.log("Headers:", {
// // // // // // //         "Content-Type": "application/json",
// // // // // // //         "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //         "x-employee-id": employeeId,
// // // // // // //       });
// // // // // // //       console.log("Org ID:", org.id);

// // // // // // //       const res = await fetch(url, {
// // // // // // //         method: "GET",
// // // // // // //         headers: {
// // // // // // //           "Content-Type": "application/json",
// // // // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //           "x-employee-id": employeeId,
// // // // // // //         },
// // // // // // //       });

// // // // // // //       console.log("Response Status:", res.status);
// // // // // // //       const text = await res.text();
// // // // // // //       console.log("Raw Response:", text);

// // // // // // //       if (!res.ok) {
// // // // // // //         throw new Error(`Failed to fetch organization roles and pages: ${res.status} - ${text}`);
// // // // // // //       }

// // // // // // //       let data;
// // // // // // //       try {
// // // // // // //         data = JSON.parse(text);
// // // // // // //         console.log("Parsed Response Data:", data);
// // // // // // //       } catch (parseError) {
// // // // // // //         console.error("JSON Parse Error:", parseError);
// // // // // // //         throw new Error(`Invalid JSON response: ${text}`);
// // // // // // //       }

// // // // // // //       setSelectedRoles(data.roles ? data.roles.map((r) => r.role_name) : []);
// // // // // // //       setSelectedPages(data.pages ? data.pages.map((p) => ({ ...p, role_id: p.role_id || 0, role_name: p.role_name || null })) : []);
// // // // // // //     } catch (err) {
// // // // // // //       console.error("Error fetching org roles and pages:", err);
// // // // // // //       setMessage(`❌ Failed to load organization roles and pages: ${err.message}`);
// // // // // // //     }

// // // // // // //     setShowForm(true);
// // // // // // //   };

// // // // // // //   const handleDelete = async (orgId) => {
// // // // // // //     if (!window.confirm("Are you sure you want to delete this organization?")) return;

// // // // // // //     try {
// // // // // // //       const response = await fetch(
// // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
// // // // // // //         {
// // // // // // //           method: "DELETE",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //             "x-employee-id": employeeId,
// // // // // // //           },
// // // // // // //         }
// // // // // // //       );

// // // // // // //       console.log("Delete Response Status:", response.status);
// // // // // // //       const text = await response.text();
// // // // // // //       console.log("Delete Raw Response:", text);

// // // // // // //       let data;
// // // // // // //       try {
// // // // // // //         data = JSON.parse(text);
// // // // // // //       } catch (parseError) {
// // // // // // //         console.error("JSON Parse Error:", parseError);
// // // // // // //         setMessage(`❌ Server returned invalid response (Status: ${response.status})`);
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       if (response.ok) {
// // // // // // //         setMessage(data.message || "✅ Organization deleted successfully.");
// // // // // // //         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
// // // // // // //         setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
// // // // // // //       } else {
// // // // // // //         setMessage(data.error || "❌ Failed to delete organization.");
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Delete organization error:", error);
// // // // // // //       setMessage(`❌ Server error: ${error.message}`);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleSubmit = async (e) => {
// // // // // // //     e.preventDefault();
// // // // // // //     setMessage("");

// // // // // // //     const orgData = {
// // // // // // //       Name: name,
// // // // // // //       subdomain,
// // // // // // //       no_employees: parseInt(noEmployees) || 0,
// // // // // // //       company_address: companyAddress,
// // // // // // //       c_pan_no: cPanNo,
// // // // // // //       admin_email: adminEmail,
// // // // // // //       contact_email_id: contactEmail,
// // // // // // //       contact_phone_no: contactPhone,
// // // // // // //       start_date: startDate,
// // // // // // //       end_date: endDate,
// // // // // // //       roles: selectedRoles,
// // // // // // //       selectedPages: selectedPages.map((p) => ({
// // // // // // //         page_name: p.page_name,
// // // // // // //         path: p.path,
// // // // // // //         icon_name: p.icon_name,
// // // // // // //         role_id: p.role_id || 0,
// // // // // // //         role_name: p.role_name || null,
// // // // // // //       })),
// // // // // // //     };

// // // // // // //     try {
// // // // // // //       const url = isEditing
// // // // // // //         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
// // // // // // //         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;
// // // // // // //       const method = isEditing ? "PUT" : "POST";

// // // // // // //       console.log("Request URL:", url);
// // // // // // //       console.log("Request Method:", method);
// // // // // // //       console.log("Request Data:", JSON.stringify(orgData, null, 2));
// // // // // // //       console.log("Headers:", {
// // // // // // //         "Content-Type": "application/json",
// // // // // // //         "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //         "x-employee-id": employeeId,
// // // // // // //       });

// // // // // // //       const response = await fetch(url, {
// // // // // // //         method,
// // // // // // //         headers: {
// // // // // // //           "Content-Type": "application/json",
// // // // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //           "x-employee-id": employeeId,
// // // // // // //         },
// // // // // // //         body: JSON.stringify(orgData),
// // // // // // //       });

// // // // // // //       console.log("Response Status:", response.status);
// // // // // // //       const text = await response.text();
// // // // // // //       console.log("Raw Response:", text);

// // // // // // //       let data;
// // // // // // //       try {
// // // // // // //         data = JSON.parse(text);
// // // // // // //       } catch (parseError) {
// // // // // // //         console.error("JSON Parse Error:", parseError);
// // // // // // //         setMessage(`❌ Server returned invalid response (Status: ${response.status})`);
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       if (response.ok) {
// // // // // // //         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
// // // // // // //         if (isEditing) {
// // // // // // //           setOrgTableData((prev) =>
// // // // // // //             prev.map((org) =>
// // // // // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // // // // //             )
// // // // // // //           );
// // // // // // //           setFilteredOrgData((prev) =>
// // // // // // //             prev.map((org) =>
// // // // // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // // // // //             )
// // // // // // //           );
// // // // // // //         } else {
// // // // // // //           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // // //             headers: {
// // // // // // //               "Content-Type": "application/json",
// // // // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //               "x-employee-id": employeeId,
// // // // // // //             },
// // // // // // //           });
// // // // // // //           if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // // // // //           const newData = await res.json();
// // // // // // //           setOrgTableData(newData);
// // // // // // //           setFilteredOrgData(newData);
// // // // // // //         }
// // // // // // //         setName("");
// // // // // // //         setSubdomain("");
// // // // // // //         setNoEmployees("");
// // // // // // //         setCompanyAddress("");
// // // // // // //         setCPanNo("");
// // // // // // //         setAdminEmail("");
// // // // // // //         setContactEmail("");
// // // // // // //         setContactPhone("");
// // // // // // //         setStartDate("");
// // // // // // //         setEndDate("");
// // // // // // //         setSelectedRoles([]);
// // // // // // //         setSelectedPages([]);
// // // // // // //         setShowForm(false);
// // // // // // //         setIsEditing(false);
// // // // // // //         setCurrentOrgId(null);
// // // // // // //       } else {
// // // // // // //         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
// // // // // // //       setMessage(`❌ Server error: ${error.message}`);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleCloseModal = (e) => {
// // // // // // //     if (e.target.className.includes("modal-overlay")) {
// // // // // // //       setShowForm(false);
// // // // // // //       setIsEditing(false);
// // // // // // //       setCurrentOrgId(null);
// // // // // // //       setName("");
// // // // // // //       setSubdomain("");
// // // // // // //       setNoEmployees("");
// // // // // // //       setCompanyAddress("");
// // // // // // //       setCPanNo("");
// // // // // // //       setAdminEmail("");
// // // // // // //       setContactEmail("");
// // // // // // //       setContactPhone("");
// // // // // // //       setStartDate("");
// // // // // // //       setEndDate("");
// // // // // // //       setSelectedRoles([]);
// // // // // // //       setSelectedPages([]);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const formatToIST = (dateString) => {
// // // // // // //     try {
// // // // // // //       const date = new Date(dateString);
// // // // // // //       if (isNaN(date.getTime())) return dateString;
// // // // // // //       return date.toLocaleString("en-IN", {
// // // // // // //         timeZone: "Asia/Kolkata",
// // // // // // //         year: "numeric",
// // // // // // //         month: "2-digit",
// // // // // // //         day: "2-digit",
// // // // // // //       });
// // // // // // //     } catch (error) {
// // // // // // //       return dateString;
// // // // // // //     }
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="create-org-wrapper">
// // // // // // //       <div className="table-header">
// // // // // // //         <div className="search-container">
// // // // // // //           <label className="search-label">Search by:</label>
         
// // // // // // //           <input
// // // // // // //             type="text"
// // // // // // //             value={searchTerm}
// // // // // // //             onChange={handleSearchInputChange}
// // // // // // //             placeholder="Name, Id, Email, Date"
// // // // // // //             className="search-input"
// // // // // // //           />
// // // // // // //         </div>
// // // // // // //         <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // // //           ➕ Add Organization
// // // // // // //         </button>
// // // // // // //       </div>

// // // // // // //       {showForm && (
// // // // // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // // // // //           <div className="create-org-container">
// // // // // // //             <div className="form-header">
// // // // // // //               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
// // // // // // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // // //                 ✕
// // // // // // //               </span>
// // // // // // //             </div>

// // // // // // //             <form className="org-form" onSubmit={handleSubmit}>
// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Organization Name *</label>
// // // // // // //                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Display Name *</label>
// // // // // // //                   <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Number of Employees *</label>
// // // // // // //                   <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company Address *</label>
// // // // // // //                   <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Company PAN No *</label>
// // // // // // //                   <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Admin Email ID *</label>
// // // // // // //                   <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row form-row-four">
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Email ID *</label>
// // // // // // //                   <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Contact Phone No *</label>
// // // // // // //                   <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>Start Date *</label>
// // // // // // //                   <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-field">
// // // // // // //                   <label>End Date *</label>
// // // // // // //                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               <div className="form-row">
// // // // // // //                 <div className="roles-checkbox-group">
// // // // // // //                   <label>Assign Roles *</label>
// // // // // // //                   <div className="checkbox-list">
// // // // // // //                     {roles.length > 0 ? (
// // // // // // //                       roles.map((role) => (
// // // // // // //                         <div key={role} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             id={`role-${role}`}
// // // // // // //                             checked={selectedRoles.includes(role)}
// // // // // // //                             onChange={() => handleRoleToggle(role)}
// // // // // // //                           />
// // // // // // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // // // //                             {role}
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))
// // // // // // //                     ) : (
// // // // // // //                       <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // // // //                     )}
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>

// // // // // // //               {rolePages.length > 0 && (
// // // // // // //                 <div className="form-row">
// // // // // // //                   <div className="roles-checkbox-group">
// // // // // // //                     <label>Assign Pages to Roles</label>
// // // // // // //                     <div className="checkbox-list">
// // // // // // //                       {rolePages.map((page, index) => (
// // // // // // //                         <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// // // // // // //                           <input
// // // // // // //                             type="checkbox"
// // // // // // //                             checked={selectedPages.some(
// // // // // // //                               (p) => p.page_name === page.page_name && p.path === page.path
// // // // // // //                             )}
// // // // // // //                             onChange={() => handlePageToggle(page)}
// // // // // // //                           />
// // // // // // //                           <label className="checkbox-label">
// // // // // // //                             {page.page_name}
// // // // // // //                           </label>
// // // // // // //                         </div>
// // // // // // //                       ))}
// // // // // // //                     </div>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               )}

// // // // // // //               <div className="form-actions">
// // // // // // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // // // //                   Cancel
// // // // // // //                 </button>
// // // // // // //                 <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
// // // // // // //               </div>
// // // // // // //             </form>

// // // // // // //             {message && <p className="message">{message}</p>}
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       )}

// // // // // // //       {filteredOrgData.length > 0 && (
// // // // // // //         <div className="org-table-container">
// // // // // // //           <h3>Existing Organizations</h3>
// // // // // // //           <table className="org-table">
// // // // // // //             <thead>
// // // // // // //               <tr>
// // // // // // //                 <th>ID</th>
// // // // // // //                 <th>Name</th>
// // // // // // //                 <th>Subdomain</th>
// // // // // // //                 <th>No. Employees</th>
// // // // // // //                 <th>Company Address</th>
// // // // // // //                 <th>Admin Email</th>
// // // // // // //                 <th>Contact Email</th>
// // // // // // //                 <th>Contact Phone</th>
// // // // // // //                 <th>Start Date</th>
// // // // // // //                 <th>End Date</th>
// // // // // // //                 <th>Actions</th>
// // // // // // //               </tr>
// // // // // // //             </thead>
// // // // // // //             <tbody>
// // // // // // //               {filteredOrgData.map((org) => (
// // // // // // //                 <tr key={org.id}>
// // // // // // //                   <td>{org.id}</td>
// // // // // // //                   <td>{org.Name}</td>
// // // // // // //                   <td>{org.subdomain}</td>
// // // // // // //                   <td>{org.no_employees}</td>
// // // // // // //                   <td>{org.company_address}</td>
// // // // // // //                   <td>{org.admin_email}</td>
// // // // // // //                   <td>{org.contact_email_id}</td>
// // // // // // //                   <td>{org.contact_phone_no}</td>
// // // // // // //                   <td>{formatToIST(org.start_date)}</td>
// // // // // // //                   <td>{formatToIST(org.end_date)}</td>
// // // // // // //                   <td>
// // // // // // //                     <button
// // // // // // //                       className="edit-btn"
// // // // // // //                       onClick={() => handleEdit(org)}
// // // // // // //                       style={{ marginRight: "10px", padding: "5px 10px" }}
// // // // // // //                     >
// // // // // // //                       Edit
// // // // // // //                     </button>
// // // // // // //                     <button
// // // // // // //                       className="delete-btn"
// // // // // // //                       onClick={() => handleDelete(org.id)}
// // // // // // //                       style={{ padding: "5px 10px" }}
// // // // // // //                     >
// // // // // // //                       Delete
// // // // // // //                     </button>
// // // // // // //                   </td>
// // // // // // //                 </tr>
// // // // // // //               ))}
// // // // // // //             </tbody>
// // // // // // //           </table>
// // // // // // //         </div>
// // // // // // //       )}
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default CreateOrganization;

// // // // // // import React, { useEffect, useState } from "react";
// // // // // // import "./CreateOrganization.css";

// // // // // // // Custom debounce hook
// // // // // // const useDebounce = (value, delay) => {
// // // // // //   const [debouncedValue, setDebouncedValue] = useState(value);

// // // // // //   useEffect(() => {
// // // // // //     const handler = setTimeout(() => {
// // // // // //       setDebouncedValue(value);
// // // // // //     }, delay);

// // // // // //     return () => {
// // // // // //       clearTimeout(handler);
// // // // // //     };
// // // // // //   }, [value, delay]);

// // // // // //   return debouncedValue;
// // // // // // };

// // // // // // const CreateOrganization = ({ employeeId = "default-employee-id" }) => {
// // // // // //   const [showForm, setShowForm] = useState(false);
// // // // // //   const [isEditing, setIsEditing] = useState(false);
// // // // // //   const [currentOrgId, setCurrentOrgId] = useState(null);
// // // // // //   const [name, setName] = useState("");
// // // // // //   const [subdomain, setSubdomain] = useState("");
// // // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // // //   const [startDate, setStartDate] = useState("");
// // // // // //   const [endDate, setEndDate] = useState("");
// // // // // //   const [roles, setRoles] = useState([]);
// // // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // // //   const [rolePages, setRolePages] = useState([]);
// // // // // //   const [selectedPages, setSelectedPages] = useState([]);
// // // // // //   const [message, setMessage] = useState("");
// // // // // //   const [orgTableData, setOrgTableData] = useState([]);
// // // // // //   const [searchTerm, setSearchTerm] = useState("");
// // // // // //   const [filteredOrgData, setFilteredOrgData] = useState([]);

// // // // // //   const debouncedSearchTerm = useDebounce(searchTerm, 300);

// // // // // //   useEffect(() => {
// // // // // //     const fetchRoles = async () => {
// // // // // //       try {
// // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // // //           method: "GET",
// // // // // //           headers: {
// // // // // //             "Content-Type": "application/json",
// // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // //             "x-employee-id": employeeId,
// // // // // //           },
// // // // // //         });
// // // // // //         if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
// // // // // //         const data = await res.json();
// // // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // // //         setRoles(uniqueRoles);
// // // // // //       } catch (err) {
// // // // // //         console.error("Role fetch error:", err);
// // // // // //         setMessage("❌ Failed to fetch roles.");
// // // // // //       }
// // // // // //     };

// // // // // //     const fetchOrganizations = async () => {
// // // // // //       try {
// // // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // //           headers: {
// // // // // //             "Content-Type": "application/json",
// // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // //             "x-employee-id": employeeId,
// // // // // //           },
// // // // // //         });
// // // // // //         if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // // // //         const data = await res.json();
// // // // // //         setOrgTableData(data);
// // // // // //         setFilteredOrgData(data);
// // // // // //       } catch (err) {
// // // // // //         console.error("Organization table fetch error:", err);
// // // // // //         setMessage("❌ Failed to fetch organizations.");
// // // // // //       }
// // // // // //     };

// // // // // //     fetchRoles();
// // // // // //     fetchOrganizations();
// // // // // //   }, [employeeId]);

// // // // // //   useEffect(() => {
// // // // // //     const fetchRolePages = async () => {
// // // // // //       if (selectedRoles.length === 0) {
// // // // // //         setRolePages([]);
// // // // // //         return;
// // // // // //       }

// // // // // //       try {
// // // // // //         const rolesQuery = selectedRoles.join(",");
// // // // // //         const res = await fetch(
// // // // // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // // // // //           {
// // // // // //             method: "GET",
// // // // // //             headers: {
// // // // // //               "Content-Type": "application/json",
// // // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // //               "x-employee-id": employeeId,
// // // // // //             },
// // // // // //           }
// // // // // //         );
// // // // // //         if (!res.ok) throw new Error(`Failed to fetch role pages: ${res.status}`);
// // // // // //         const data = await res.json();
// // // // // //         setRolePages(data);
// // // // // //       } catch (err) {
// // // // // //         console.error("Role pages fetch error:", err);
// // // // // //         setRolePages([]);
// // // // // //         setMessage("❌ Failed to fetch role pages.");
// // // // // //       }
// // // // // //     };

// // // // // //     fetchRolePages();
// // // // // //   }, [selectedRoles, employeeId]);

// // // // // //   // Real-time search filtering across multiple fields
// // // // // //   useEffect(() => {
// // // // // //     const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
// // // // // //     const filtered = orgTableData.filter((org) => {
// // // // // //       if (!lowerCaseSearchTerm) return true;
// // // // // //       return (
// // // // // //         org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // // //         org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // // //         org.id.toString().includes(lowerCaseSearchTerm) ||
// // // // // //         org.admin_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // // //         org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // // //         org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // // //         org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // // //         org.end_date?.toLowerCase().includes(lowerCaseSearchTerm)
// // // // // //       );
// // // // // //     });
// // // // // //     setFilteredOrgData(filtered);
// // // // // //   }, [debouncedSearchTerm, orgTableData]);

// // // // // //   const handleSearchInputChange = (e) => {
// // // // // //     setSearchTerm(e.target.value);
// // // // // //   };

// // // // // //   const handleRoleToggle = (role) => {
// // // // // //     setSelectedRoles((prev) =>
// // // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // // //     );
// // // // // //   };

// // // // // //   const handlePageToggle = (page) => {
// // // // // //     setSelectedPages((prev) => {
// // // // // //       const exists = prev.some(
// // // // // //         (p) => p.page_name === page.page_name && p.path === page.path
// // // // // //       );
// // // // // //       return exists
// // // // // //         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// // // // // //         : [...prev, { ...page, role_id: page.role_id || 0, role_name: page.role_name || null }];
// // // // // //     });
// // // // // //   };

// // // // // //   const handleEdit = async (org) => {
// // // // // //     setIsEditing(true);
// // // // // //     setCurrentOrgId(org.id);
// // // // // //     setName(org.Name || "");
// // // // // //     setSubdomain(org.subdomain || "");
// // // // // //     setNoEmployees(org.no_employees || "");
// // // // // //     setCompanyAddress(org.company_address || "");
// // // // // //     setCPanNo(org.c_pan_no || "");
// // // // // //     setAdminEmail(org.admin_email || "");
// // // // // //     setContactEmail(org.contact_email_id || "");
// // // // // //     setContactPhone(org.contact_phone_no || "");
// // // // // //     setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
// // // // // //     setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
// // // // // //     setSelectedRoles([]);
// // // // // //     setSelectedPages([]);

// // // // // //     try {
// // // // // //       const url = `${process.env.REACT_APP_BACKEND_URL}/organization-details/${org.id}`;
// // // // // //       console.log("Fetching roles and pages from:", url);
// // // // // //       console.log("Headers:", {
// // // // // //         "Content-Type": "application/json",
// // // // // //         "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // //         "x-employee-id": employeeId,
// // // // // //       });
// // // // // //       console.log("Org ID:", org.id);

// // // // // //       const res = await fetch(url, {
// // // // // //         method: "GET",
// // // // // //         headers: {
// // // // // //           "Content-Type": "application/json",
// // // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // //           "x-employee-id": employeeId,
// // // // // //         },
// // // // // //       });

// // // // // //       console.log("Response Status:", res.status);
// // // // // //       const text = await res.text();
// // // // // //       console.log("Raw Response:", text);

// // // // // //       if (!res.ok) {
// // // // // //         throw new Error(`Failed to fetch organization roles and pages: ${res.status} - ${text}`);
// // // // // //       }

// // // // // //       let data;
// // // // // //       try {
// // // // // //         data = JSON.parse(text);
// // // // // //         console.log("Parsed Response Data:", data);
// // // // // //       } catch (parseError) {
// // // // // //         console.error("JSON Parse Error:", parseError);
// // // // // //         throw new Error(`Invalid JSON response: ${text}`);
// // // // // //       }

// // // // // //       setSelectedRoles(data.roles ? data.roles.map((r) => r.role_name) : []);
// // // // // //       setSelectedPages(data.pages ? data.pages.map((p) => ({ ...p, role_id: p.role_id || 0, role_name: p.role_name || null })) : []);
// // // // // //     } catch (err) {
// // // // // //       console.error("Error fetching org roles and pages:", err);
// // // // // //       setMessage(`❌ Failed to load organization roles and pages: ${err.message}`);
// // // // // //     }

// // // // // //     setShowForm(true);
// // // // // //   };

// // // // // //   const handleDelete = async (orgId) => {
// // // // // //     if (!window.confirm("Are you sure you want to delete this organization?")) return;

// // // // // //     try {
// // // // // //       const response = await fetch(
// // // // // //         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
// // // // // //         {
// // // // // //           method: "DELETE",
// // // // // //           headers: {
// // // // // //             "Content-Type": "application/json",
// // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // //             "x-employee-id": employeeId,
// // // // // //           },
// // // // // //         }
// // // // // //       );

// // // // // //       console.log("Delete Response Status:", response.status);
// // // // // //       const text = await response.text();
// // // // // //       console.log("Delete Raw Response:", text);

// // // // // //       let data;
// // // // // //       try {
// // // // // //         data = JSON.parse(text);
// // // // // //       } catch (parseError) {
// // // // // //         console.error("JSON Parse Error:", parseError);
// // // // // //         setMessage(`❌ Server returned invalid response (Status: ${response.status})`);
// // // // // //         return;
// // // // // //       }

// // // // // //       if (response.ok) {
// // // // // //         setMessage(data.message || "✅ Organization deleted successfully.");
// // // // // //         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
// // // // // //         setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
// // // // // //       } else {
// // // // // //         setMessage(data.error || "❌ Failed to delete organization.");
// // // // // //       }
// // // // // //     } catch (error) {
// // // // // //       console.error("Delete organization error:", error);
// // // // // //       setMessage(`❌ Server error: ${error.message}`);
// // // // // //     }
// // // // // //   };

// // // // // //   const handleSubmit = async (e) => {
// // // // // //     e.preventDefault();
// // // // // //     setMessage("");

// // // // // //     const orgData = {
// // // // // //       Name: name,
// // // // // //       subdomain,
// // // // // //       no_employees: parseInt(noEmployees) || 0,
// // // // // //       company_address: companyAddress,
// // // // // //       c_pan_no: cPanNo,
// // // // // //       admin_email: adminEmail,
// // // // // //       contact_email_id: contactEmail,
// // // // // //       contact_phone_no: contactPhone,
// // // // // //       start_date: startDate,
// // // // // //       end_date: endDate,
// // // // // //       roles: selectedRoles,
// // // // // //       selectedPages: selectedPages.map((p) => ({
// // // // // //         page_name: p.page_name,
// // // // // //         path: p.path,
// // // // // //         icon_name: p.icon_name,
// // // // // //         role_id: p.role_id || 0,
// // // // // //         role_name: p.role_name || null,
// // // // // //       })),
// // // // // //     };

// // // // // //     try {
// // // // // //       const url = isEditing
// // // // // //         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
// // // // // //         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;
// // // // // //       const method = isEditing ? "PUT" : "POST";

// // // // // //       console.log("Request URL:", url);
// // // // // //       console.log("Request Method:", method);
// // // // // //       console.log("Request Data:", JSON.stringify(orgData, null, 2));
// // // // // //       console.log("Headers:", {
// // // // // //         "Content-Type": "application/json",
// // // // // //         "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // //         "x-employee-id": employeeId,
// // // // // //       });

// // // // // //       const response = await fetch(url, {
// // // // // //         method,
// // // // // //         headers: {
// // // // // //           "Content-Type": "application/json",
// // // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // //           "x-employee-id": employeeId,
// // // // // //         },
// // // // // //         body: JSON.stringify(orgData),
// // // // // //       });

// // // // // //       console.log("Response Status:", response.status);
// // // // // //       const text = await response.text();
// // // // // //       console.log("Raw Response:", text);

// // // // // //       let data;
// // // // // //       try {
// // // // // //         data = JSON.parse(text);
// // // // // //       } catch (parseError) {
// // // // // //         console.error("JSON Parse Error:", parseError);
// // // // // //         setMessage(`❌ Server returned invalid response (Status: ${response.status})`);
// // // // // //         return;
// // // // // //       }

// // // // // //       if (response.ok) {
// // // // // //         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
// // // // // //         if (isEditing) {
// // // // // //           setOrgTableData((prev) =>
// // // // // //             prev.map((org) =>
// // // // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // // // //             )
// // // // // //           );
// // // // // //           setFilteredOrgData((prev) =>
// // // // // //             prev.map((org) =>
// // // // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // // // //             )
// // // // // //           );
// // // // // //         } else {
// // // // // //           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // // //             headers: {
// // // // // //               "Content-Type": "application/json",
// // // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // //               "x-employee-id": employeeId,
// // // // // //             },
// // // // // //           });
// // // // // //           if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // // // //           const newData = await res.json();
// // // // // //           setOrgTableData(newData);
// // // // // //           setFilteredOrgData(newData);
// // // // // //         }
// // // // // //         setName("");
// // // // // //         setSubdomain("");
// // // // // //         setNoEmployees("");
// // // // // //         setCompanyAddress("");
// // // // // //         setCPanNo("");
// // // // // //         setAdminEmail("");
// // // // // //         setContactEmail("");
// // // // // //         setContactPhone("");
// // // // // //         setStartDate("");
// // // // // //         setEndDate("");
// // // // // //         setSelectedRoles([]);
// // // // // //         setSelectedPages([]);
// // // // // //         setShowForm(false);
// // // // // //         setIsEditing(false);
// // // // // //         setCurrentOrgId(null);
// // // // // //       } else {
// // // // // //         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
// // // // // //       }
// // // // // //     } catch (error) {
// // // // // //       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
// // // // // //       setMessage(`❌ Server error: ${error.message}`);
// // // // // //     }
// // // // // //   };

// // // // // //   const handleCloseModal = (e) => {
// // // // // //     if (e.target.className.includes("modal-overlay")) {
// // // // // //       setShowForm(false);
// // // // // //       setIsEditing(false);
// // // // // //       setCurrentOrgId(null);
// // // // // //       setName("");
// // // // // //       setSubdomain("");
// // // // // //       setNoEmployees("");
// // // // // //       setCompanyAddress("");
// // // // // //       setCPanNo("");
// // // // // //       setAdminEmail("");
// // // // // //       setContactEmail("");
// // // // // //       setContactPhone("");
// // // // // //       setStartDate("");
// // // // // //       setEndDate("");
// // // // // //       setSelectedRoles([]);
// // // // // //       setSelectedPages([]);
// // // // // //     }
// // // // // //   };

// // // // // //   const formatToIST = (dateString) => {
// // // // // //     try {
// // // // // //       const date = new Date(dateString);
// // // // // //       if (isNaN(date.getTime())) return dateString;
// // // // // //       return date.toLocaleString("en-IN", {
// // // // // //         timeZone: "Asia/Kolkata",
// // // // // //         year: "numeric",
// // // // // //         month: "2-digit",
// // // // // //         day: "2-digit",
// // // // // //       });
// // // // // //     } catch (error) {
// // // // // //       return dateString;
// // // // // //     }
// // // // // //   };

// // // // // //   return (
// // // // // //     <div className="create-org-wrapper">
// // // // // //       <div className="table-header">
// // // // // //         <div className="search-container">
// // // // // //           <label className="search-label">Search by:</label>
// // // // // //           <input
// // // // // //             type="text"
// // // // // //             value={searchTerm}
// // // // // //             onChange={handleSearchInputChange}
// // // // // //             placeholder="Name, Id, Email, Date"
// // // // // //             className="search-input"
// // // // // //           />
// // // // // //         </div>
// // // // // //         <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // // //           ➕ Add Organization
// // // // // //         </button>
// // // // // //       </div>

// // // // // //       {showForm && (
// // // // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // // // //           <div className="create-org-container">
// // // // // //             <div className="form-header">
// // // // // //               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
// // // // // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // // //                 ✕
// // // // // //               </span>
// // // // // //             </div>

// // // // // //             <form className="org-form" onSubmit={handleSubmit}>
// // // // // //               <div className="form-row">
// // // // // //                 <div className="form-field">
// // // // // //                   <label>Organization Name *</label>
// // // // // //                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // // //                 </div>
// // // // // //                 <div className="form-field">
// // // // // //                   <label>Display Name *</label>
// // // // // //                   <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // // //                 </div>
// // // // // //                 <div className="form-field">
// // // // // //                   <label>Number of Employees *</label>
// // // // // //                   <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // // //                 </div>
// // // // // //               </div>

// // // // // //               <div className="form-row">
// // // // // //                 <div className="form-field">
// // // // // //                   <label>Company Address *</label>
// // // // // //                   <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // // //                 </div>
// // // // // //                 <div className="form-field">
// // // // // //                   <label>Company PAN No *</label>
// // // // // //                   <input type="text" value={cPanNo} onChange={(e) => setCPanNo(e.target.value)} required />
// // // // // //                 </div>
// // // // // //                 <div className="form-field">
// // // // // //                   <label>Admin Email ID *</label>
// // // // // //                   <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // // //                 </div>
// // // // // //               </div>

// // // // // //               <div className="form-row form-row-four">
// // // // // //                 <div className="form-field">
// // // // // //                   <label>Contact Email ID *</label>
// // // // // //                   <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // // //                 </div>
// // // // // //                 <div className="form-field">
// // // // // //                   <label>Contact Phone No *</label>
// // // // // //                   <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
// // // // // //                 </div>
// // // // // //                 <div className="form-field">
// // // // // //                   <label>Start Date *</label>
// // // // // //                   <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
// // // // // //                 </div>
// // // // // //                 <div className="form-field">
// // // // // //                   <label>End Date *</label>
// // // // // //                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
// // // // // //                 </div>
// // // // // //               </div>

// // // // // //               <div className="form-row">
// // // // // //                 <div className="roles-checkbox-group">
// // // // // //                   <label>Assign Roles *</label>
// // // // // //                   <div className="checkbox-list">
// // // // // //                     {roles.length > 0 ? (
// // // // // //                       roles.map((role) => (
// // // // // //                         <div key={role} className="checkbox-item">
// // // // // //                           <input
// // // // // //                             type="checkbox"
// // // // // //                             id={`role-${role}`}
// // // // // //                             checked={selectedRoles.includes(role)}
// // // // // //                             onChange={() => handleRoleToggle(role)}
// // // // // //                           />
// // // // // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // // //                             {role}
// // // // // //                           </label>
// // // // // //                         </div>
// // // // // //                       ))
// // // // // //                     ) : (
// // // // // //                       <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // // //                     )}
// // // // // //                   </div>
// // // // // //                 </div>
// // // // // //               </div>

// // // // // //               {rolePages.length > 0 && (
// // // // // //                 <div className="form-row">
// // // // // //                   <div className="roles-checkbox-group">
// // // // // //                     <label>Assign Pages to Roles</label>
// // // // // //                     <div className="checkbox-list">
// // // // // //                       {rolePages.map((page, index) => (
// // // // // //                         <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// // // // // //                           <input
// // // // // //                             type="checkbox"
// // // // // //                             checked={selectedPages.some(
// // // // // //                               (p) => p.page_name === page.page_name && p.path === page.path
// // // // // //                             )}
// // // // // //                             onChange={() => handlePageToggle(page)}
// // // // // //                           />
// // // // // //                           <label className="checkbox-label">
// // // // // //                             {page.page_name}
// // // // // //                           </label>
// // // // // //                         </div>
// // // // // //                       ))}
// // // // // //                     </div>
// // // // // //                   </div>
// // // // // //                 </div>
// // // // // //               )}

// // // // // //               <div className="form-actions">
// // // // // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // // //                   Cancel
// // // // // //                 </button>
// // // // // //                 <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
// // // // // //               </div>
// // // // // //             </form>

// // // // // //             {message && <p className="message">{message}</p>}
// // // // // //           </div>
// // // // // //         </div>
// // // // // //       )}

// // // // // //       {filteredOrgData.length > 0 && (
// // // // // //         <div className="org-table-container">
// // // // // //           <h3>Existing Organizations</h3>
// // // // // //           <table className="org-table">
// // // // // //             <thead>
// // // // // //               <tr>
// // // // // //                 <th>ID</th>
// // // // // //                 <th>Name</th>
// // // // // //                 <th>Subdomain</th>
// // // // // //                 <th>No. Employees</th>
// // // // // //                 <th>Company Address</th>
// // // // // //                 <th>Admin Email</th>
// // // // // //                 <th>Contact Email</th>
// // // // // //                 <th>Contact Phone</th>
// // // // // //                 <th>Start Date</th>
// // // // // //                 <th>End Date</th>
// // // // // //                 <th>Actions</th>
// // // // // //               </tr>
// // // // // //             </thead>
// // // // // //             <tbody>
// // // // // //               {filteredOrgData.map((org) => (
// // // // // //                 <tr key={org.id}>
// // // // // //                   <td><span className="tooltip" title={org.id}>{org.id}</span></td>
// // // // // //                   <td><span className="tooltip" title={org.Name}>{org.Name}</span></td>
// // // // // //                   <td><span className="tooltip" title={org.subdomain}>{org.subdomain}</span></td>
// // // // // //                   <td><span className="tooltip" title={org.no_employees}>{org.no_employees}</span></td>
// // // // // //                   <td><span className="tooltip" title={org.company_address}>{org.company_address}</span></td>
// // // // // //                   <td><span className="tooltip" title={org.admin_email}>{org.admin_email}</span></td>
// // // // // //                   <td><span className="tooltip" title={org.contact_email_id}>{org.contact_email_id}</span></td>
// // // // // //                   <td><span className="tooltip" title={org.contact_phone_no}>{org.contact_phone_no}</span></td>
// // // // // //                   <td><span className="tooltip" title={formatToIST(org.start_date)}>{formatToIST(org.start_date)}</span></td>
// // // // // //                   <td><span className="tooltip" title={formatToIST(org.end_date)}>{formatToIST(org.end_date)}</span></td>
// // // // // //                   <td>
// // // // // //                     <button
// // // // // //                       className="edit-btn"
// // // // // //                       onClick={() => handleEdit(org)}
// // // // // //                     >
// // // // // //                       Edit
// // // // // //                     </button>
// // // // // //                     <button
// // // // // //                       className="delete-btn"
// // // // // //                       onClick={() => handleDelete(org.id)}
// // // // // //                     >
// // // // // //                       Delete
// // // // // //                     </button>
// // // // // //                   </td>
// // // // // //                 </tr>
// // // // // //               ))}
// // // // // //             </tbody>
// // // // // //           </table>
// // // // // //         </div>
// // // // // //       )}
// // // // // //     </div>
// // // // // //   );
// // // // // // };

// // // // // // export default CreateOrganization;

// // // // // import React, { useEffect, useState } from "react";
// // // // // import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
// // // // // import "./CreateOrganization.css";

// // // // // // Custom debounce hook
// // // // // const useDebounce = (value, delay) => {
// // // // //   const [debouncedValue, setDebouncedValue] = useState(value);

// // // // //   useEffect(() => {
// // // // //     const handler = setTimeout(() => {
// // // // //       setDebouncedValue(value);
// // // // //     }, delay);

// // // // //     return () => {
// // // // //       clearTimeout(handler);
// // // // //     };
// // // // //   }, [value, delay]);

// // // // //   return debouncedValue;
// // // // // };

// // // // // const CreateOrganization = ({ employeeId = "default-employee-id" }) => {
// // // // //   const [showForm, setShowForm] = useState(false);
// // // // //   const [isEditing, setIsEditing] = useState(false);
// // // // //   const [currentOrgId, setCurrentOrgId] = useState(null);
// // // // //   const [name, setName] = useState("");
// // // // //   const [subdomain, setSubdomain] = useState("");
// // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // //   const [startDate, setStartDate] = useState("");
// // // // //   const [endDate, setEndDate] = useState("");
// // // // //   const [roles, setRoles] = useState([]);
// // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // //   const [rolePages, setRolePages] = useState([]);
// // // // //   const [selectedPages, setSelectedPages] = useState([]);
// // // // //   const [message, setMessage] = useState("");
// // // // //   const [orgTableData, setOrgTableData] = useState([]);
// // // // //   const [searchTerm, setSearchTerm] = useState("");
// // // // //   const [filteredOrgData, setFilteredOrgData] = useState([]);
// // // // //   const [showDetailsPopup, setShowDetailsPopup] = useState(false);
// // // // //   const [popupData, setPopupData] = useState(null);
// // // // //   const [errors, setErrors] = useState({});

// // // // //   const debouncedSearchTerm = useDebounce(searchTerm, 300);

// // // // //   // Validation functions
// // // // //   const validateMobileNumber = (phone) => {
// // // // //     const regex = /^[6-9]\d{9}$/;
// // // // //     return regex.test(phone) ? "" : "Please enter a valid 10-digit Indian mobile number.";
// // // // //   };

// // // // //   const validatePanNumber = (pan) => {
// // // // //     const regex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
// // // // //     return regex.test(pan) ? "" : "Please enter a valid PAN number (e.g., ABCDE1234F).";
// // // // //   };

// // // // //   const validateDates = (start, end) => {
// // // // //     if (!start || !end) return "";
// // // // //     const startDateObj = new Date(start);
// // // // //     const endDateObj = new Date(end);
// // // // //     return endDateObj >= startDateObj ? "" : "End date cannot be before start date.";
// // // // //   };

// // // // //   // Validate all fields
// // // // //   const validateForm = () => {
// // // // //     const newErrors = {
// // // // //       contactPhone: validateMobileNumber(contactPhone),
// // // // //       cPanNo: validatePanNumber(cPanNo),
// // // // //       endDate: validateDates(startDate, endDate),
// // // // //     };
// // // // //     setErrors(newErrors);
// // // // //     return Object.values(newErrors).every((error) => error === "");
// // // // //   };

// // // // //   useEffect(() => {
// // // // //     const fetchRoles = async () => {
// // // // //       try {
// // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // //           method: "GET",
// // // // //           headers: {
// // // // //             "Content-Type": "application/json",
// // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //             "x-employee-id": employeeId,
// // // // //           },
// // // // //         });
// // // // //         if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
// // // // //         const data = await res.json();
// // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // //         setRoles(uniqueRoles);
// // // // //       } catch (err) {
// // // // //         console.error("Role fetch error:", err);
// // // // //         setMessage("❌ Failed to fetch roles.");
// // // // //       }
// // // // //     };

// // // // //     const fetchOrganizations = async () => {
// // // // //       try {
// // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // //           headers: {
// // // // //             "Content-Type": "application/json",
// // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //             "x-employee-id": employeeId,
// // // // //           },
// // // // //         });
// // // // //         if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // // //         const data = await res.json();
// // // // //         setOrgTableData(data);
// // // // //         setFilteredOrgData(data);
// // // // //       } catch (err) {
// // // // //         console.error("Organization table fetch error:", err);
// // // // //         setMessage("❌ Failed to fetch organizations.");
// // // // //       }
// // // // //     };

// // // // //     fetchRoles();
// // // // //     fetchOrganizations();
// // // // //   }, [employeeId]);

// // // // //   useEffect(() => {
// // // // //     const fetchRolePages = async () => {
// // // // //       if (selectedRoles.length === 0) {
// // // // //         setRolePages([]);
// // // // //         return;
// // // // //       }

// // // // //       try {
// // // // //         const rolesQuery = selectedRoles.join(",");
// // // // //         const res = await fetch(
// // // // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // // // //           {
// // // // //             method: "GET",
// // // // //             headers: {
// // // // //               "Content-Type": "application/json",
// // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //               "x-employee-id": employeeId,
// // // // //             },
// // // // //           }
// // // // //         );
// // // // //         if (!res.ok) throw new Error(`Failed to fetch role pages: ${res.status}`);
// // // // //         const data = await res.json();
// // // // //         setRolePages(data);
// // // // //       } catch (err) {
// // // // //         console.error("Role pages fetch error:", err);
// // // // //         setRolePages([]);
// // // // //         setMessage("❌ Failed to fetch role pages.");
// // // // //       }
// // // // //     };

// // // // //     fetchRolePages();
// // // // //   }, [selectedRoles, employeeId]);

// // // // //   // Real-time search filtering across multiple fields
// // // // //   useEffect(() => {
// // // // //     const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
// // // // //     const filtered = orgTableData.filter((org) => {
// // // // //       if (!lowerCaseSearchTerm) return true;
// // // // //       return (
// // // // //         org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.id.toString().includes(lowerCaseSearchTerm) ||
// // // // //         org.admin_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.end_date?.toLowerCase().includes(lowerCaseSearchTerm)
// // // // //       );
// // // // //     });
// // // // //     setFilteredOrgData(filtered);
// // // // //   }, [debouncedSearchTerm, orgTableData]);

// // // // //   const handleSearchInputChange = (e) => {
// // // // //     setSearchTerm(e.target.value);
// // // // //   };

// // // // //   const handleRoleToggle = (role) => {
// // // // //     setSelectedRoles((prev) =>
// // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // //     );
// // // // //   };

// // // // //   const handlePageToggle = (page) => {
// // // // //     setSelectedPages((prev) => {
// // // // //       const exists = prev.some(
// // // // //         (p) => p.page_name === page.page_name && p.path === page.path
// // // // //       );
// // // // //       return exists
// // // // //         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// // // // //         : [...prev, { ...page, role_id: page.role_id || 0, role_name: page.role_name || null }];
// // // // //     });
// // // // //   };

// // // // //   const handleEdit = async (org) => {
// // // // //     setIsEditing(true);
// // // // //     setCurrentOrgId(org.id);
// // // // //     setName(org.Name || "");
// // // // //     setSubdomain(org.subdomain || "");
// // // // //     setNoEmployees(org.no_employees || "");
// // // // //     setCompanyAddress(org.company_address || "");
// // // // //     setCPanNo(org.c_pan_no || "");
// // // // //     setAdminEmail(org.admin_email || "");
// // // // //     setContactEmail(org.contact_email_id || "");
// // // // //     setContactPhone(org.contact_phone_no || "");
// // // // //     setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
// // // // //     setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
// // // // //     setSelectedRoles([]);
// // // // //     setSelectedPages([]);
// // // // //     setErrors({});

// // // // //     try {
// // // // //       const url = `${process.env.REACT_APP_BACKEND_URL}/organization-details/${org.id}`;
// // // // //       console.log("Fetching roles and pages from:", url);
// // // // //       console.log("Headers:", {
// // // // //         "Content-Type": "application/json",
// // // // //         "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //         "x-employee-id": employeeId,
// // // // //       });
// // // // //       console.log("Org ID:", org.id);

// // // // //       const res = await fetch(url, {
// // // // //         method: "GET",
// // // // //         headers: {
// // // // //           "Content-Type": "application/json",
// // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //           "x-employee-id": employeeId,
// // // // //         },
// // // // //       });

// // // // //       console.log("Response Status:", res.status);
// // // // //       const text = await res.text();
// // // // //       console.log("Raw Response:", text);

// // // // //       if (!res.ok) {
// // // // //         throw new Error(`Failed to fetch organization roles and pages: ${res.status} - ${text}`);
// // // // //       }

// // // // //       let data;
// // // // //       try {
// // // // //         data = JSON.parse(text);
// // // // //         console.log("Parsed Response Data:", data);
// // // // //       } catch (parseError) {
// // // // //         console.error("JSON Parse Error:", parseError);
// // // // //         throw new Error(`Invalid JSON response: ${text}`);
// // // // //       }

// // // // //       setSelectedRoles(data.roles ? data.roles.map((r) => r.role_name) : []);
// // // // //       setSelectedPages(data.pages ? data.pages.map((p) => ({ ...p, role_id: p.role_id || 0, role_name: p.role_name || null })) : []);
// // // // //     } catch (err) {
// // // // //       console.error("Error fetching org roles and pages:", err);
// // // // //       setMessage(`❌ Failed to load organization roles and pages: ${err.message}`);
// // // // //     }

// // // // //     setShowForm(true);
// // // // //   };

// // // // //   const handleDelete = async (orgId) => {
// // // // //     if (!window.confirm("Are you sure you want to delete this organization?")) return;

// // // // //     try {
// // // // //       const response = await fetch(
// // // // //         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
// // // // //         {
// // // // //           method: "DELETE",
// // // // //           headers: {
// // // // //             "Content-Type": "application/json",
// // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //             "x-employee-id": employeeId,
// // // // //           },
// // // // //         }
// // // // //       );

// // // // //       console.log("Delete Response Status:", response.status);
// // // // //       const text = await response.text();
// // // // //       console.log("Delete Raw Response:", text);

// // // // //       let data;
// // // // //       try {
// // // // //         data = JSON.parse(text);
// // // // //       } catch (parseError) {
// // // // //         console.error("JSON Parse Error:", parseError);
// // // // //         setMessage(`❌ Server returned invalid response (Status: ${response.status})`);
// // // // //         return;
// // // // //       }

// // // // //       if (response.ok) {
// // // // //         setMessage(data.message || "✅ Organization deleted successfully.");
// // // // //         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
// // // // //         setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
// // // // //       } else {
// // // // //         setMessage(data.error || "❌ Failed to delete organization.");
// // // // //       }
// // // // //     } catch (error) {
// // // // //       console.error("Delete organization error:", error);
// // // // //       setMessage(`❌ Server error: ${error.message}`);
// // // // //     }
// // // // //   };

// // // // //   const handleSubmit = async (e) => {
// // // // //     e.preventDefault();
// // // // //     setMessage("");

// // // // //     if (!validateForm()) {
// // // // //       setMessage("❌ Please fix the errors in the form.");
// // // // //       return;
// // // // //     }

// // // // //     const orgData = {
// // // // //       Name: name,
// // // // //       subdomain,
// // // // //       no_employees: parseInt(noEmployees) || 0,
// // // // //       company_address: companyAddress,
// // // // //       c_pan_no: cPanNo,
// // // // //       admin_email: adminEmail,
// // // // //       contact_email_id: contactEmail,
// // // // //       contact_phone_no: contactPhone,
// // // // //       start_date: startDate,
// // // // //       end_date: endDate,
// // // // //       roles: selectedRoles,
// // // // //       selectedPages: selectedPages.map((p) => ({
// // // // //         page_name: p.page_name,
// // // // //         path: p.path,
// // // // //         icon_name: p.icon_name,
// // // // //         role_id: p.role_id || 0,
// // // // //         role_name: p.role_name || null,
// // // // //       })),
// // // // //     };

// // // // //     try {
// // // // //       const url = isEditing
// // // // //         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
// // // // //         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;
// // // // //       const method = isEditing ? "PUT" : "POST";

// // // // //       console.log("Request URL:", url);
// // // // //       console.log("Request Method:", method);
// // // // //       console.log("Request Data:", JSON.stringify(orgData, null, 2));
// // // // //       console.log("Headers:", {
// // // // //         "Content-Type": "application/json",
// // // // //         "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //         "x-employee-id": employeeId,
// // // // //       });

// // // // //       const response = await fetch(url, {
// // // // //         method,
// // // // //         headers: {
// // // // //           "Content-Type": "application/json",
// // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //           "x-employee-id": employeeId,
// // // // //         },
// // // // //         body: JSON.stringify(orgData),
// // // // //       });

// // // // //       console.log("Response Status:", response.status);
// // // // //       const text = await response.text();
// // // // //       console.log("Raw Response:", text);

// // // // //       let data;
// // // // //       try {
// // // // //         data = JSON.parse(text);
// // // // //       } catch (parseError) {
// // // // //         console.error("JSON Parse Error:", parseError);
// // // // //         setMessage(`❌ Server returned invalid response (Status: ${response.status})`);
// // // // //         return;
// // // // //       }

// // // // //       if (response.ok) {
// // // // //         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
// // // // //         if (isEditing) {
// // // // //           setOrgTableData((prev) =>
// // // // //             prev.map((org) =>
// // // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // // //             )
// // // // //           );
// // // // //           setFilteredOrgData((prev) =>
// // // // //             prev.map((org) =>
// // // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // // //             )
// // // // //           );
// // // // //         } else {
// // // // //           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // //             headers: {
// // // // //               "Content-Type": "application/json",
// // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //               "x-employee-id": employeeId,
// // // // //             },
// // // // //           });
// // // // //           if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // // //           const newData = await res.json();
// // // // //           setOrgTableData(newData);
// // // // //           setFilteredOrgData(newData);
// // // // //         }
// // // // //         setName("");
// // // // //         setSubdomain("");
// // // // //         setNoEmployees("");
// // // // //         setCompanyAddress("");
// // // // //         setCPanNo("");
// // // // //         setAdminEmail("");
// // // // //         setContactEmail("");
// // // // //         setContactPhone("");
// // // // //         setStartDate("");
// // // // //         setEndDate("");
// // // // //         setSelectedRoles([]);
// // // // //         setSelectedPages([]);
// // // // //         setShowForm(false);
// // // // //         setIsEditing(false);
// // // // //         setCurrentOrgId(null);
// // // // //         setErrors({});
// // // // //       } else {
// // // // //         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
// // // // //       }
// // // // //     } catch (error) {
// // // // //       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
// // // // //       setMessage(`❌ Server error: ${error.message}`);
// // // // //     }
// // // // //   };

// // // // //   const handleCloseModal = (e) => {
// // // // //     if (e.target.className.includes("modal-overlay")) {
// // // // //       setShowForm(false);
// // // // //       setIsEditing(false);
// // // // //       setCurrentOrgId(null);
// // // // //       setName("");
// // // // //       setSubdomain("");
// // // // //       setNoEmployees("");
// // // // //       setCompanyAddress("");
// // // // //       setCPanNo("");
// // // // //       setAdminEmail("");
// // // // //       setContactEmail("");
// // // // //       setContactPhone("");
// // // // //       setStartDate("");
// // // // //       setEndDate("");
// // // // //       setSelectedRoles([]);
// // // // //       setSelectedPages([]);
// // // // //       setErrors({});
// // // // //     }
// // // // //   };

// // // // //   const formatToIST = (dateString) => {
// // // // //     try {
// // // // //       const date = new Date(dateString);
// // // // //       if (isNaN(date.getTime())) return dateString;
// // // // //       return date.toLocaleString("en-IN", {
// // // // //         timeZone: "Asia/Kolkata",
// // // // //         year: "numeric",
// // // // //         month: "2-digit",
// // // // //         day: "2-digit",
// // // // //       });
// // // // //     } catch (error) {
// // // // //       return dateString;
// // // // //     }
// // // // //   };

// // // // //   const handleShowDetails = (org) => {
// // // // //     setPopupData({
// // // // //       company_address: org.company_address,
// // // // //       admin_email: org.admin_email,
// // // // //       contact_email_id: org.contact_email_id,
// // // // //       contact_phone_no: org.contact_phone_no,
// // // // //       start_date: formatToIST(org.start_date),
// // // // //       end_date: formatToIST(org.end_date),
// // // // //     });
// // // // //     setShowDetailsPopup(true);
// // // // //   };

// // // // //   const handleCloseDetailsPopup = (e) => {
// // // // //     if (e.target.className.includes("details-overlay")) {
// // // // //       setShowDetailsPopup(false);
// // // // //       setPopupData(null);
// // // // //     }
// // // // //   };

// // // // //   return (
// // // // //     <div className="create-org-wrapper">
// // // // //       <div className="table-header">
// // // // //         <div className="search-container">
// // // // //           <label className="search-label">Search by:</label>
// // // // //           <input
// // // // //             type="text"
// // // // //             value={searchTerm}
// // // // //             onChange={handleSearchInputChange}
// // // // //             placeholder="Name, Id, Email, Date"
// // // // //             className="search-input"
// // // // //           />
// // // // //         </div>
// // // // //         <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // //           ➕ Add Organization
// // // // //         </button>
// // // // //       </div>

// // // // //       {showForm && (
// // // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // // //           <div className="create-org-container">
// // // // //             <div className="form-header">
// // // // //               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
// // // // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // //                 ✕
// // // // //               </span>
// // // // //             </div>

// // // // //             <form className="org-form" onSubmit={handleSubmit}>
// // // // //               <div className="form-row">
// // // // //                 <div className="form-field">
// // // // //                   <label>Organization Name *</label>
// // // // //                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // //                 </div>
// // // // //                 <div className="form-field">
// // // // //                   <label>Display Name *</label>
// // // // //                   <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // //                 </div>
// // // // //                 <div className="form-field">
// // // // //                   <label>Number of Employees *</label>
// // // // //                   <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // //                 </div>
// // // // //               </div>

// // // // //               <div className="form-row">
// // // // //                 <div className="form-field">
// // // // //                   <label>Company Address *</label>
// // // // //                   <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // //                 </div>
// // // // //                 <div className="form-field">
// // // // //                   <label>Company PAN No *</label>
// // // // //                   <input
// // // // //                     type="text"
// // // // //                     value={cPanNo}
// // // // //                     onChange={(e) => {
// // // // //                       setCPanNo(e.target.value.toUpperCase());
// // // // //                       setErrors((prev) => ({ ...prev, cPanNo: validatePanNumber(e.target.value.toUpperCase()) }));
// // // // //                     }}
// // // // //                     required
// // // // //                   />
// // // // //                   {errors.cPanNo && <span className="error-message">{errors.cPanNo}</span>}
// // // // //                 </div>
// // // // //                 <div className="form-field">
// // // // //                   <label>Admin Email ID *</label>
// // // // //                   <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // //                 </div>
// // // // //               </div>

// // // // //               <div className="form-row form-row-four">
// // // // //                 <div className="form-field">
// // // // //                   <label>Contact Email ID *</label>
// // // // //                   <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // //                 </div>
// // // // //                 <div className="form-field">
// // // // //                   <label>Contact Phone No *</label>
// // // // //                   <input
// // // // //                     type="tel"
// // // // //                     value={contactPhone}
// // // // //                     onChange={(e) => {
// // // // //                       setContactPhone(e.target.value);
// // // // //                       setErrors((prev) => ({ ...prev, contactPhone: validateMobileNumber(e.target.value) }));
// // // // //                     }}
// // // // //                     required
// // // // //                   />
// // // // //                   {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
// // // // //                 </div>
// // // // //                 <div className="form-field date-field">
// // // // //                   <label>Start Date *</label>
// // // // //                   <input
// // // // //                     type="date"
// // // // //                     value={startDate}
// // // // //                     onChange={(e) => {
// // // // //                       setStartDate(e.target.value);
// // // // //                       setErrors((prev) => ({ ...prev, endDate: validateDates(e.target.value, endDate) }));
// // // // //                     }}
// // // // //                     required
// // // // //                   />
// // // // //                 </div>
// // // // //                 <div className="form-field date-field">
// // // // //                   <label>End Date *</label>
// // // // //                   <input
// // // // //                     type="date"
// // // // //                     value={endDate}
// // // // //                     onChange={(e) => {
// // // // //                       setEndDate(e.target.value);
// // // // //                       setErrors((prev) => ({ ...prev, endDate: validateDates(startDate, e.target.value) }));
// // // // //                     }}
// // // // //                     required
// // // // //                   />
// // // // //                   {errors.endDate && <span className="error-message">{errors.endDate}</span>}
// // // // //                 </div>
// // // // //               </div>

// // // // //               <div className="form-row">
// // // // //                 <div className="roles-checkbox-group">
// // // // //                   <label>Assign Roles *</label>
// // // // //                   <div className="checkbox-list">
// // // // //                     {roles.length > 0 ? (
// // // // //                       roles.map((role) => (
// // // // //                         <div key={role} className="checkbox-item">
// // // // //                           <input
// // // // //                             type="checkbox"
// // // // //                             id={`role-${role}`}
// // // // //                             checked={selectedRoles.includes(role)}
// // // // //                             onChange={() => handleRoleToggle(role)}
// // // // //                           />
// // // // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // //                             {role}
// // // // //                           </label>
// // // // //                         </div>
// // // // //                       ))
// // // // //                     ) : (
// // // // //                       <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // //                     )}
// // // // //                   </div>
// // // // //                 </div>
// // // // //               </div>

// // // // //               {rolePages.length > 0 && (
// // // // //                 <div className="form-row">
// // // // //                   <div className="roles-checkbox-group">
// // // // //                     <label>Assign Pages to Roles</label>
// // // // //                     <div className="checkbox-list">
// // // // //                       {rolePages.map((page, index) => (
// // // // //                         <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// // // // //                           <input
// // // // //                             type="checkbox"
// // // // //                             checked={selectedPages.some(
// // // // //                               (p) => p.page_name === page.page_name && p.path === page.path
// // // // //                             )}
// // // // //                             onChange={() => handlePageToggle(page)}
// // // // //                           />
// // // // //                           <label className="checkbox-label">
// // // // //                             {page.page_name}
// // // // //                           </label>
// // // // //                         </div>
// // // // //                       ))}
// // // // //                     </div>
// // // // //                   </div>
// // // // //                 </div>
// // // // //               )}

// // // // //               <div className="form-actions">
// // // // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // //                   Cancel
// // // // //                 </button>
// // // // //                 <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
// // // // //               </div>
// // // // //             </form>

// // // // //             {message && <p className="message">{message}</p>}
// // // // //           </div>
// // // // //         </div>
// // // // //       )}

// // // // //       {showDetailsPopup && popupData && (
// // // // //         <div className="details-overlay" onClick={handleCloseDetailsPopup}>
// // // // //           <div className="details-popup">
// // // // //             <div className="form-header">
// // // // //               <h2>Details</h2>
// // // // //               <span className="close-icon" onClick={() => setShowDetailsPopup(false)}>
// // // // //                 ✕
// // // // //               </span>
// // // // //             </div>
// // // // //             <div className="details-content">
// // // // //               <p><strong>Address:</strong> {popupData.company_address}</p>
// // // // //               <p><strong>Admin Email:</strong> {popupData.admin_email}</p>
// // // // //               <p><strong>Contact Email:</strong> {popupData.contact_email_id}</p>
// // // // //               <p><strong>Contact Phone:</strong> {popupData.contact_phone_no}</p>
// // // // //               <p><strong>Start Date:</strong> {popupData.start_date}</p>
// // // // //               <p><strong>End Date:</strong> {popupData.end_date}</p>
// // // // //             </div>
// // // // //           </div>
// // // // //         </div>
// // // // //       )}

// // // // //       {filteredOrgData.length > 0 && (
// // // // //         <div className="org-table-container">
// // // // //           <h3>Existing Organizations</h3>
// // // // //           <table className="org-table">
// // // // //             <thead>
// // // // //               <tr>
// // // // //                 <th>ID</th>
// // // // //                 <th>Name</th>
// // // // //                 <th>Subdomain</th>
// // // // //                 <th>No. Employees</th>
// // // // //                 <th>CommonDetails</th>
// // // // //                 <th>Actions</th>
// // // // //               </tr>
// // // // //             </thead>
// // // // //             <tbody>
// // // // //               {filteredOrgData.map((org) => (
// // // // //                 <tr key={org.id}>
// // // // //                   <td><span className="tooltip" title={org.id}>{org.id}</span></td>
// // // // //                   <td><span className="tooltip" title={org.Name}>{org.Name}</span></td>
// // // // //                   <td><span className="tooltip" title={org.subdomain}>{org.subdomain}</span></td>
// // // // //                   <td><span className="tooltip" title={org.no_employees}>{org.no_employees}</span></td>
// // // // //                   <td>
// // // // //                     <button
// // // // //                       className="view-btn"
// // // // //                       onClick={() => handleShowDetails(org)}
// // // // //                       title="View Details"
// // // // //                     >
// // // // //                       <FaEye />
// // // // //                     </button>
// // // // //                   </td>
// // // // //                   <td>
// // // // //                     <button
// // // // //                       className="edit-btn"
// // // // //                       onClick={() => handleEdit(org)}
// // // // //                       title="Edit"
// // // // //                     >
// // // // //                       <FaEdit />
// // // // //                     </button>
// // // // //                     <button
// // // // //                       className="delete-btn"
// // // // //                       onClick={() => handleDelete(org.id)}
// // // // //                       title="Delete"
// // // // //                     >
// // // // //                       <FaTrash />
// // // // //                     </button>
// // // // //                   </td>
// // // // //                 </tr>
// // // // //               ))}
// // // // //             </tbody>
// // // // //           </table>
// // // // //         </div>
// // // // //       )}
// // // // //     </div>
// // // // //   );
// // // // // };

// // // // // export default CreateOrganization;

// // // // // import React, { useEffect, useState } from "react";
// // // // // import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
// // // // // import { MdOutlineCalendarToday } from "react-icons/md";
// // // // // import "./CreateOrganization.css";
// // // // // import { MdEdit } from "react-icons/md"; 
// // // // // // Custom debounce hook
// // // // // const useDebounce = (value, delay) => {
// // // // //   const [debouncedValue, setDebouncedValue] = useState(value);

// // // // //   useEffect(() => {
// // // // //     const handler = setTimeout(() => {
// // // // //       setDebouncedValue(value);
// // // // //     }, delay);

// // // // //     return () => {
// // // // //       clearTimeout(handler);
// // // // //     };
// // // // //   }, [value, delay]);

// // // // //   return debouncedValue;
// // // // // };

// // // // // const CreateOrganization = ({ employeeId = "default-employee-id" }) => {
// // // // //   const [showForm, setShowForm] = useState(false);
// // // // //   const [isEditing, setIsEditing] = useState(false);
// // // // //   const [currentOrgId, setCurrentOrgId] = useState(null);
// // // // //   const [name, setName] = useState("");
// // // // //   const [subdomain, setSubdomain] = useState("");
// // // // //   const [noEmployees, setNoEmployees] = useState("");
// // // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // // //   const [cPanNo, setCPanNo] = useState("");
// // // // //   const [adminEmail, setAdminEmail] = useState("");
// // // // //   const [contactEmail, setContactEmail] = useState("");
// // // // //   const [contactPhone, setContactPhone] = useState("");
// // // // //   const [startDate, setStartDate] = useState("");
// // // // //   const [endDate, setEndDate] = useState("");
// // // // //   const [roles, setRoles] = useState([]);
// // // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // // //   const [rolePages, setRolePages] = useState([]);
// // // // //   const [selectedPages, setSelectedPages] = useState([]);
// // // // //   const [message, setMessage] = useState("");
// // // // //   const [orgTableData, setOrgTableData] = useState([]);
// // // // //   const [searchTerm, setSearchTerm] = useState("");
// // // // //   const [filteredOrgData, setFilteredOrgData] = useState([]);
// // // // //   const [showDetailsPopup, setShowDetailsPopup] = useState(false);
// // // // //   const [popupData, setPopupData] = useState(null);
// // // // //   const [errors, setErrors] = useState({});

// // // // //   const debouncedSearchTerm = useDebounce(searchTerm, 300);

// // // // //   // Validation functions
// // // // //   const validateMobileNumber = (phone) => {
// // // // //     const regex = /^[6-9]\d{9}$/;
// // // // //     return regex.test(phone) ? "" : "Please enter a valid 10-digit Indian mobile number.";
// // // // //   };

// // // // //   const validatePanNumber = (pan) => {
// // // // //     const regex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
// // // // //     return regex.test(pan) ? "" : "Please enter a valid PAN number (e.g., ABCDE1234F).";
// // // // //   };

// // // // //   const validateDates = (start, end) => {
// // // // //     if (!start || !end) return "";
// // // // //     const startDateObj = new Date(start);
// // // // //     const endDateObj = new Date(end);
// // // // //     return endDateObj >= startDateObj ? "" : "End date cannot be before start date.";
// // // // //   };

// // // // //   // Validate all fields
// // // // //   const validateForm = () => {
// // // // //     const newErrors = {
// // // // //       contactPhone: validateMobileNumber(contactPhone),
// // // // //       cPanNo: validatePanNumber(cPanNo),
// // // // //       endDate: validateDates(startDate, endDate),
// // // // //     };
// // // // //     setErrors(newErrors);
// // // // //     return Object.values(newErrors).every((error) => error === "");
// // // // //   };

// // // // //   useEffect(() => {
// // // // //     const fetchRoles = async () => {
// // // // //       try {
// // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // // //           method: "GET",
// // // // //           headers: {
// // // // //             "Content-Type": "application/json",
// // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //             "x-employee-id": employeeId,
// // // // //           },
// // // // //         });
// // // // //         if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
// // // // //         const data = await res.json();
// // // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // // //         setRoles(uniqueRoles);
// // // // //       } catch (err) {
// // // // //         console.error("Role fetch error:", err);
// // // // //         setMessage("❌ Failed to fetch roles.");
// // // // //       }
// // // // //     };

// // // // //     const fetchOrganizations = async () => {
// // // // //       try {
// // // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // //           headers: {
// // // // //             "Content-Type": "application/json",
// // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //             "x-employee-id": employeeId,
// // // // //           },
// // // // //         });
// // // // //         if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // // //         const data = await res.json();
// // // // //         setOrgTableData(data);
// // // // //         setFilteredOrgData(data);
// // // // //       } catch (err) {
// // // // //         console.error("Organization table fetch error:", err);
// // // // //         setMessage("❌ Failed to fetch organizations.");
// // // // //       }
// // // // //     };

// // // // //     fetchRoles();
// // // // //     fetchOrganizations();
// // // // //   }, [employeeId]);

// // // // //   useEffect(() => {
// // // // //     const fetchRolePages = async () => {
// // // // //       if (selectedRoles.length === 0) {
// // // // //         setRolePages([]);
// // // // //         return;
// // // // //       }

// // // // //       try {
// // // // //         const rolesQuery = selectedRoles.join(",");
// // // // //         const res = await fetch(
// // // // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // // // //           {
// // // // //             method: "GET",
// // // // //             headers: {
// // // // //               "Content-Type": "application/json",
// // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //               "x-employee-id": employeeId,
// // // // //             },
// // // // //           }
// // // // //         );
// // // // //         if (!res.ok) throw new Error(`Failed to fetch role pages: ${res.status}`);
// // // // //         const data = await res.json();
// // // // //         setRolePages(data);
// // // // //       } catch (err) {
// // // // //         console.error("Role pages fetch error:", err);
// // // // //         setRolePages([]);
// // // // //         setMessage("❌ Failed to fetch role pages.");
// // // // //       }
// // // // //     };

// // // // //     fetchRolePages();
// // // // //   }, [selectedRoles, employeeId]);

// // // // //   // Real-time search filtering across multiple fields
// // // // //   useEffect(() => {
// // // // //     const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
// // // // //     const filtered = orgTableData.filter((org) => {
// // // // //       if (!lowerCaseSearchTerm) return true;
// // // // //       return (
// // // // //         org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.id.toString().includes(lowerCaseSearchTerm) ||
// // // // //         org.admin_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // // //         org.end_date?.toLowerCase().includes(lowerCaseSearchTerm)
// // // // //       );
// // // // //     });
// // // // //     setFilteredOrgData(filtered);
// // // // //   }, [debouncedSearchTerm, orgTableData]);

// // // // //   const handleSearchInputChange = (e) => {
// // // // //     setSearchTerm(e.target.value);
// // // // //   };

// // // // //   const handleRoleToggle = (role) => {
// // // // //     setSelectedRoles((prev) =>
// // // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // // //     );
// // // // //   };

// // // // //   const handlePageToggle = (page) => {
// // // // //     setSelectedPages((prev) => {
// // // // //       const exists = prev.some(
// // // // //         (p) => p.page_name === page.page_name && p.path === page.path
// // // // //       );
// // // // //       return exists
// // // // //         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// // // // //         : [...prev, { ...page, role_id: page.role_id || 0, role_name: page.role_name || null }];
// // // // //     });
// // // // //   };

// // // // //   const handleEdit = async (org) => {
// // // // //     setIsEditing(true);
// // // // //     setCurrentOrgId(org.id);
// // // // //     setName(org.Name || "");
// // // // //     setSubdomain(org.subdomain || "");
// // // // //     setNoEmployees(org.no_employees || "");
// // // // //     setCompanyAddress(org.company_address || "");
// // // // //     setCPanNo(org.c_pan_no || "");
// // // // //     setAdminEmail(org.admin_email || "");
// // // // //     setContactEmail(org.contact_email_id || "");
// // // // //     setContactPhone(org.contact_phone_no || "");
// // // // //     setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
// // // // //     setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
// // // // //     setSelectedRoles([]);
// // // // //     setSelectedPages([]);
// // // // //     setErrors({});

// // // // //     try {
// // // // //       const url = `${process.env.REACT_APP_BACKEND_URL}/organization-details/${org.id}`;
// // // // //       console.log("Fetching roles and pages from:", url);
// // // // //       console.log("Headers:", {
// // // // //         "Content-Type": "application/json",
// // // // //         "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //         "x-employee-id": employeeId,
// // // // //       });
// // // // //       console.log("Org ID:", org.id);

// // // // //       const res = await fetch(url, {
// // // // //         method: "GET",
// // // // //         headers: {
// // // // //           "Content-Type": "application/json",
// // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //           "x-employee-id": employeeId,
// // // // //         },
// // // // //       });

// // // // //       console.log("Response Status:", res.status);
// // // // //       const text = await res.text();
// // // // //       console.log("Raw Response:", text);

// // // // //       if (!res.ok) {
// // // // //         throw new Error(`Failed to fetch organization roles and pages: ${res.status} - ${text}`);
// // // // //       }

// // // // //       let data;
// // // // //       try {
// // // // //         data = JSON.parse(text);
// // // // //         console.log("Parsed Response Data:", data);
// // // // //       } catch (parseError) {
// // // // //         console.error("JSON Parse Error:", parseError);
// // // // //         throw new Error(`Invalid JSON response: ${text}`);
// // // // //       }

// // // // //       setSelectedRoles(data.roles ? data.roles.map((r) => r.role_name) : []);
// // // // //       setSelectedPages(data.pages ? data.pages.map((p) => ({ ...p, role_id: p.role_id || 0, role_name: p.role_name || null })) : []);
// // // // //     } catch (err) {
// // // // //       console.error("Error fetching org roles and pages:", err);
// // // // //       setMessage(`❌ Failed to load organization roles and pages: ${err.message}`);
// // // // //     }

// // // // //     setShowForm(true);
// // // // //   };

// // // // //   const handleDelete = async (orgId) => {
// // // // //     if (!window.confirm("Are you sure you want to delete this organization?")) return;

// // // // //     try {
// // // // //       const response = await fetch(
// // // // //         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
// // // // //         {
// // // // //           method: "DELETE",
// // // // //           headers: {
// // // // //             "Content-Type": "application/json",
// // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //             "x-employee-id": employeeId,
// // // // //           },
// // // // //         }
// // // // //       );

// // // // //       console.log("Delete Response Status:", response.status);
// // // // //       const text = await response.text();
// // // // //       console.log("Delete Raw Response:", text);

// // // // //       let data;
// // // // //       try {
// // // // //         data = JSON.parse(text);
// // // // //       } catch (parseError) {
// // // // //         console.error("JSON Parse Error:", parseError);
// // // // //         setMessage(`❌ Server returned invalid response (Status: ${response.status})`);
// // // // //         return;
// // // // //       }

// // // // //       if (response.ok) {
// // // // //         setMessage(data.message || "✅ Organization deleted successfully.");
// // // // //         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
// // // // //         setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
// // // // //       } else {
// // // // //         setMessage(data.error || "❌ Failed to delete organization.");
// // // // //       }
// // // // //     } catch (error) {
// // // // //       console.error("Delete organization error:", error);
// // // // //       setMessage(`❌ Server error: ${error.message}`);
// // // // //     }
// // // // //   };

// // // // //   const handleSubmit = async (e) => {
// // // // //     e.preventDefault();
// // // // //     setMessage("");

// // // // //     if (!validateForm()) {
// // // // //       setMessage("❌ Please fix the errors in the form.");
// // // // //       return;
// // // // //     }

// // // // //     const orgData = {
// // // // //       Name: name,
// // // // //       subdomain,
// // // // //       no_employees: parseInt(noEmployees) || 0,
// // // // //       company_address: companyAddress,
// // // // //       c_pan_no: cPanNo,
// // // // //       admin_email: adminEmail,
// // // // //       contact_email_id: contactEmail,
// // // // //       contact_phone_no: contactPhone,
// // // // //       start_date: startDate,
// // // // //       end_date: endDate,
// // // // //       roles: selectedRoles,
// // // // //       selectedPages: selectedPages.map((p) => ({
// // // // //         page_name: p.page_name,
// // // // //         path: p.path,
// // // // //         icon_name: p.icon_name,
// // // // //         role_id: p.role_id || 0,
// // // // //         role_name: p.role_name || null,
// // // // //       })),
// // // // //     };

// // // // //     try {
// // // // //       const url = isEditing
// // // // //         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
// // // // //         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;
// // // // //       const method = isEditing ? "PUT" : "POST";

// // // // //       console.log("Request URL:", url);
// // // // //       console.log("Request Method:", method);
// // // // //       console.log("Request Data:", JSON.stringify(orgData, null, 2));
// // // // //       console.log("Headers:", {
// // // // //         "Content-Type": "application/json",
// // // // //         "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //         "x-employee-id": employeeId,
// // // // //       });

// // // // //       const response = await fetch(url, {
// // // // //         method,
// // // // //         headers: {
// // // // //           "Content-Type": "application/json",
// // // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //           "x-employee-id": employeeId,
// // // // //         },
// // // // //         body: JSON.stringify(orgData),
// // // // //       });

// // // // //       console.log("Response Status:", response.status);
// // // // //       const text = await response.text();
// // // // //       console.log("Raw Response:", text);

// // // // //       let data;
// // // // //       try {
// // // // //         data = JSON.parse(text);
// // // // //       } catch (parseError) {
// // // // //         console.error("JSON Parse Error:", parseError);
// // // // //         setMessage(`❌ Server returned invalid response (Status: ${response.status})`);
// // // // //         return;
// // // // //       }

// // // // //       if (response.ok) {
// // // // //         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
// // // // //         if (isEditing) {
// // // // //           setOrgTableData((prev) =>
// // // // //             prev.map((org) =>
// // // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // // //             )
// // // // //           );
// // // // //           setFilteredOrgData((prev) =>
// // // // //             prev.map((org) =>
// // // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // // //             )
// // // // //           );
// // // // //         } else {
// // // // //           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // // //             headers: {
// // // // //               "Content-Type": "application/json",
// // // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //               "x-employee-id": employeeId,
// // // // //             },
// // // // //           });
// // // // //           if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // // //           const newData = await res.json();
// // // // //           setOrgTableData(newData);
// // // // //           setFilteredOrgData(newData);
// // // // //         }
// // // // //         setName("");
// // // // //         setSubdomain("");
// // // // //         setNoEmployees("");
// // // // //         setCompanyAddress("");
// // // // //         setCPanNo("");
// // // // //         setAdminEmail("");
// // // // //         setContactEmail("");
// // // // //         setContactPhone("");
// // // // //         setStartDate("");
// // // // //         setEndDate("");
// // // // //         setSelectedRoles([]);
// // // // //         setSelectedPages([]);
// // // // //         setShowForm(false);
// // // // //         setIsEditing(false);
// // // // //         setCurrentOrgId(null);
// // // // //         setErrors({});
// // // // //       } else {
// // // // //         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
// // // // //       }
// // // // //     } catch (error) {
// // // // //       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
// // // // //       setMessage(`❌ Server error: ${error.message}`);
// // // // //     }
// // // // //   };

// // // // //   const handleCloseModal = (e) => {
// // // // //     if (e.target.className.includes("modal-overlay")) {
// // // // //       setShowForm(false);
// // // // //       setIsEditing(false);
// // // // //       setCurrentOrgId(null);
// // // // //       setName("");
// // // // //       setSubdomain("");
// // // // //       setNoEmployees("");
// // // // //       setCompanyAddress("");
// // // // //       setCPanNo("");
// // // // //       setAdminEmail("");
// // // // //       setContactEmail("");
// // // // //       setContactPhone("");
// // // // //       setStartDate("");
// // // // //       setEndDate("");
// // // // //       setSelectedRoles([]);
// // // // //       setSelectedPages([]);
// // // // //       setErrors({});
// // // // //     }
// // // // //   };

// // // // //   const formatToIST = (dateString) => {
// // // // //     try {
// // // // //       const date = new Date(dateString);
// // // // //       if (isNaN(date.getTime())) return dateString;
// // // // //       return date.toLocaleString("en-IN", {
// // // // //         timeZone: "Asia/Kolkata",
// // // // //         year: "numeric",
// // // // //         month: "2-digit",
// // // // //         day: "2-digit",
// // // // //       });
// // // // //     } catch (error) {
// // // // //       return dateString;
// // // // //     }
// // // // //   };

// // // // //   const handleShowDetails = (org) => {
// // // // //     setPopupData({
// // // // //       company_address: org.company_address,
// // // // //       admin_email: org.admin_email,
// // // // //       contact_email_id: org.contact_email_id,
// // // // //       contact_phone_no: org.contact_phone_no,
// // // // //       start_date: formatToIST(org.start_date),
// // // // //       end_date: formatToIST(org.end_date),
// // // // //     });
// // // // //     setShowDetailsPopup(true);
// // // // //   };

// // // // //   const handleCloseDetailsPopup = (e) => {
// // // // //     if (e.target.className.includes("details-overlay")) {
// // // // //       setShowDetailsPopup(false);
// // // // //       setPopupData(null);
// // // // //     }
// // // // //   };

// // // // //   return (
// // // // //     <div className="create-org-wrapper">
// // // // //       <div className="table-header">
// // // // //         <div className="search-container">
// // // // //           <label className="search-label">Search by:</label>
// // // // //           <input
// // // // //             type="text"
// // // // //             value={searchTerm}
// // // // //             onChange={handleSearchInputChange}
// // // // //             placeholder="Name, Id, Email, Date"
// // // // //             className="search-input"
// // // // //           />
// // // // //         </div>
// // // // //         <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // // //           + Add Organization
// // // // //         </button>
// // // // //       </div>

// // // // //       {showForm && (
// // // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // // //           <div className="create-org-container">
// // // // //             <div className="form-header">
// // // // //               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
// // // // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // // // //                 ✕
// // // // //               </span>
// // // // //             </div>

// // // // //             <form className="org-form" onSubmit={handleSubmit}>
// // // // //               <div className="form-row">
// // // // //                 <div className="form-field">
// // // // //                   <label>Organization Name *</label>
// // // // //                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // // //                 </div>
// // // // //                 <div className="form-field">
// // // // //                   <label>Display Name *</label>
// // // // //                   <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // // //                 </div>
// // // // //                 <div className="form-field">
// // // // //                   <label>Number of Employees *</label>
// // // // //                   <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // // //                 </div>
// // // // //               </div>

// // // // //               <div className="form-row">
// // // // //                 <div className="form-field">
// // // // //                   <label>Company Address *</label>
// // // // //                   <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // // //                 </div>
// // // // //                 <div className="form-field">
// // // // //                   <label>Company PAN No *</label>
// // // // //                   <input
// // // // //                     type="text"
// // // // //                     value={cPanNo}
// // // // //                     onChange={(e) => {
// // // // //                       setCPanNo(e.target.value.toUpperCase());
// // // // //                       setErrors((prev) => ({ ...prev, cPanNo: validatePanNumber(e.target.value.toUpperCase()) }));
// // // // //                     }}
// // // // //                     required
// // // // //                   />
// // // // // {errors.cPanNo && <span className="error-message">{errors.cPanNo}</span>}
// // // // //                 </div>
// // // // //                 <div className="form-field">
// // // // //                   <label>Admin Email ID *</label>
// // // // //                   <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // // //                 </div>
// // // // //               </div>

// // // // //               <div className="form-row form-row-four">
// // // // //                 <div className="form-field">
// // // // //                   <label>Contact Email ID *</label>
// // // // //                   <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // // //                 </div>
// // // // //                 <div className="form-field">
// // // // //                   <label>Contact Phone No *</label>
// // // // //                   <input
// // // // //                     type="tel"
// // // // //                     value={contactPhone}
// // // // //                     onChange={(e) => {
// // // // //                       setContactPhone(e.target.value);
// // // // //                       setErrors((prev) => ({ ...prev, contactPhone: validateMobileNumber(e.target.value) }));
// // // // //                     }}
// // // // //                     required
// // // // //                   />
// // // // //                   {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
// // // // //                 </div>
// // // // //                 <div className="form-field date-field">
// // // // //                   <label>Start Date *</label>
// // // // //                   <div className="date-input-container">
// // // // //                     <input
// // // // //                       type="date"
// // // // //                       value={startDate}
// // // // //                       onChange={(e) => {
// // // // //                         setStartDate(e.target.value);
// // // // //                         setErrors((prev) => ({ ...prev, endDate: validateDates(e.target.value, endDate) }));
// // // // //                       }}
// // // // //                       required
// // // // //                     />
// // // // //                     <MdOutlineCalendarToday className="date-icon" />
// // // // //                   </div>
// // // // //                 </div>
// // // // //                 <div className="form-field date-field">
// // // // //                   <label>End Date *</label>
// // // // //                   <div className="date-input-container">
// // // // //                     <input
// // // // //                       type="date"
// // // // //                       value={endDate}
// // // // //                       onChange={(e) => {
// // // // //                         setEndDate(e.target.value);
// // // // //                         setErrors((prev) => ({ ...prev, endDate: validateDates(startDate, e.target.value) }));
// // // // //                       }}
// // // // //                       required
// // // // //                     />
// // // // //                     <MdOutlineCalendarToday className="date-icon" />
// // // // //                   </div>
// // // // //                   {errors.endDate && <span className="error-message">{errors.endDate}</span>}
// // // // //                 </div>
// // // // //               </div>

// // // // //               <div className="form-row">
// // // // //                 <div className="roles-checkbox-group">
// // // // //                   <label>Assign Roles *</label>
// // // // //                   <div className="checkbox-list">
// // // // //                     {roles.length > 0 ? (
// // // // //                       roles.map((role) => (
// // // // //                         <div key={role} className="checkbox-item">
// // // // //                           <input
// // // // //                             type="checkbox"
// // // // //                             id={`role-${role}`}
// // // // //                             checked={selectedRoles.includes(role)}
// // // // //                             onChange={() => handleRoleToggle(role)}
// // // // //                           />
// // // // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // // // //                             {role}
// // // // //                           </label>
// // // // //                         </div>
// // // // //                       ))
// // // // //                     ) : (
// // // // //                       <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // // //                     )}
// // // // //                   </div>
// // // // //                 </div>
// // // // //               </div>

// // // // //               {rolePages.length > 0 && (
// // // // //                 <div className="form-row">
// // // // //                   <div className="roles-checkbox-group">
// // // // //                     <label>Assign Pages to Roles</label>
// // // // //                     <div className="checkbox-list">
// // // // //                       {rolePages.map((page, index) => (
// // // // //                         <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// // // // //                           <input
// // // // //                             type="checkbox"
// // // // //                             checked={selectedPages.some(
// // // // //                               (p) => p.page_name === page.page_name && p.path === page.path
// // // // //                             )}
// // // // //                             onChange={() => handlePageToggle(page)}
// // // // //                           />
// // // // //                           <label className="checkbox-label">
// // // // //                             {page.page_name}
// // // // //                           </label>
// // // // //                         </div>
// // // // //                       ))}
// // // // //                     </div>
// // // // //                   </div>
// // // // //                 </div>
// // // // //               )}

// // // // //               <div className="form-actions">
// // // // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // // //                   Cancel
// // // // //                 </button>
// // // // //                 <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
// // // // //               </div>
// // // // //             </form>

// // // // //             {message && <p className="message">{message}</p>}
// // // // //           </div>
// // // // //         </div>
// // // // //       )}

// // // // //       {showDetailsPopup && popupData && (
// // // // //         <div className="details-overlay" onClick={handleCloseDetailsPopup}>
// // // // //           <div className="details-popup">
// // // // //             <div className="form-header">
// // // // //               <h2>Details</h2>
// // // // //               <span className="close-icon" onClick={() => setShowDetailsPopup(false)}>
// // // // //                 ✕
// // // // //               </span>
// // // // //             </div>
// // // // //             <div className="details-content">
// // // // //               <p><strong>Address:</strong> {popupData.company_address}</p>
// // // // //               <p><strong>Admin Email:</strong> {popupData.admin_email}</p>
// // // // //               <p><strong>Contact Email:</strong> {popupData.contact_email_id}</p>
// // // // //               <p><strong>Contact Phone:</strong> {popupData.contact_phone_no}</p>
// // // // //               <p><strong>Start Date:</strong> {popupData.start_date}</p>
// // // // //               <p><strong>End Date:</strong> {popupData.end_date}</p>
// // // // //             </div>
// // // // //           </div>
// // // // //         </div>
// // // // //       )}
// // // // // {/* Mobile view: Card layout */}
// // // // // {filteredOrgData.length > 0 && (
// // // // //   <div className="mobile-cards">
// // // // //     {filteredOrgData.map((org) => (
// // // // //       <div className="org-card" key={org.id}>
// // // // //         <div className="org-card-header">{org.Name}</div>
// // // // //         <div className="org-card-content"><strong>ID:</strong> {org.id}</div>
// // // // //         <div className="org-card-content"><strong>Subdomain:</strong> {org.subdomain}</div>
// // // // //         <div className="org-card-content"><strong>No. Employees:</strong> {org.no_employees}</div>

// // // // //         <div className="org-card-actions">
// // // // //           <button className="view-btn" onClick={() => handleShowDetails(org)} title="View Details">
// // // // //             <FaEye />
// // // // //           </button>
// // // // //           <button className="edit-btn" onClick={() => handleEdit(org)} title="Edit">
// // // // //             <MdEdit />
// // // // //           </button>
// // // // //           <button className="delete-btn" onClick={() => handleDelete(org.id)} title="Delete">
// // // // //             <FaTrash />
// // // // //           </button>
// // // // //         </div>
// // // // //       </div>
// // // // //     ))}
// // // // //   </div>
// // // // // )}

// // // // //       {filteredOrgData.length > 0 && (
// // // // //         <div className="org-table-container">
// // // // //           {/* <h3>Existing Organizations</h3> */}
// // // // //           <table className="org-table">
// // // // //             <thead>
// // // // //               <tr>
// // // // //                 <th>ID</th>
// // // // //                 <th>Name</th>
// // // // //                 <th>Subdomain</th>
// // // // //                 <th>No. Employees</th>
// // // // //                 <th>CommonDetails</th>
// // // // //                 <th>Actions</th>
// // // // //               </tr>
// // // // //             </thead>
// // // // //             <tbody>
// // // // //               {filteredOrgData.map((org) => (
// // // // //                 <tr key={org.id}>
// // // // //                   <td><span className="tooltip" title={org.id}>{org.id}</span></td>
// // // // //                   <td><span className="tooltip" title={org.Name}>{org.Name}</span></td>
// // // // //                   <td><span className="tooltip" title={org.subdomain}>{org.subdomain}</span></td>
// // // // //                   <td><span className="tooltip" title={org.no_employees}>{org.no_employees}</span></td>
// // // // //                   <td>
// // // // //                     <button
// // // // //                       className="view-btn"
// // // // //                       onClick={() => handleShowDetails(org)}
// // // // //                       title="View Details"
// // // // //                     >
// // // // //                       <FaEye />
// // // // //                     </button>
// // // // //                   </td>
// // // // //                   <td>
// // // // //                     <button
// // // // //                       className="edit-btn"
// // // // //                       onClick={() => handleEdit(org)}
// // // // //                       title="Edit"
// // // // //                     >
// // // // //                      <MdEdit />
// // // // //                     </button>
// // // // //                     <button
// // // // //                       className="delete-btn"
// // // // //                       onClick={() => handleDelete(org.id)}
// // // // //                       title="Delete"
// // // // //                     >
// // // // //                       <FaTrash />
// // // // //                     </button>
// // // // //                   </td>
// // // // //                 </tr>
// // // // //               ))}
// // // // //             </tbody>
// // // // //           </table>
// // // // //         </div>
// // // // //       )}
// // // // //     </div>
// // // // //   );
// // // // // };

// // // // // export default CreateOrganization;


// // // // import React, { useEffect, useState } from "react";
// // // // import { FaEye, FaTrash } from "react-icons/fa";
// // // // import { MdOutlineCalendarToday, MdEdit } from "react-icons/md";
// // // // import "./CreateOrganization.css";

// // // // // Custom debounce hook
// // // // const useDebounce = (value, delay) => {
// // // //   const [debouncedValue, setDebouncedValue] = useState(value);

// // // //   useEffect(() => {
// // // //     const handler = setTimeout(() => {
// // // //       setDebouncedValue(value);
// // // //     }, delay);

// // // //     return () => {
// // // //       clearTimeout(handler);
// // // //     };
// // // //   }, [value, delay]);

// // // //   return debouncedValue;
// // // // };

// // // // const CreateOrganization = ({ employeeId = "default-employee-id" }) => {
// // // //   const [showForm, setShowForm] = useState(false);
// // // //   const [isEditing, setIsEditing] = useState(false);
// // // //   const [currentOrgId, setCurrentOrgId] = useState(null);
// // // //   const [name, setName] = useState("");
// // // //   const [subdomain, setSubdomain] = useState("");
// // // //   const [noEmployees, setNoEmployees] = useState("");
// // // //   const [companyAddress, setCompanyAddress] = useState("");
// // // //   const [cPanNo, setCPanNo] = useState("");
// // // //   const [adminEmail, setAdminEmail] = useState("");
// // // //   const [contactEmail, setContactEmail] = useState("");
// // // //   const [contactPhone, setContactPhone] = useState("");
// // // //   const [startDate, setStartDate] = useState("");
// // // //   const [endDate, setEndDate] = useState("");
// // // //   const [roles, setRoles] = useState([]);
// // // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // // //   const [rolePages, setRolePages] = useState([]);
// // // //   const [selectedPages, setSelectedPages] = useState([]);
// // // //   const [message, setMessage] = useState("");
// // // //   const [orgTableData, setOrgTableData] = useState([]);
// // // //   const [searchTerm, setSearchTerm] = useState("");
// // // //   const [filteredOrgData, setFilteredOrgData] = useState([]);
// // // //   const [showDetailsPopup, setShowDetailsPopup] = useState(false);
// // // //   const [popupData, setPopupData] = useState(null);
// // // //   const [errors, setErrors] = useState({});

// // // //   const debouncedSearchTerm = useDebounce(searchTerm, 300);

// // // //   // Validation functions
// // // //   const validateMobileNumber = (phone) => {
// // // //     const regex = /^[6-9]\d{9}$/;
// // // //     return regex.test(phone) ? "" : "Please enter a valid 10-digit Indian mobile number.";
// // // //   };

// // // //   const validatePanNumber = (pan) => {
// // // //     const regex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
// // // //     return regex.test(pan) ? "" : "Please enter a valid PAN number (e.g., ABCDE1234F).";
// // // //   };

// // // //   const validateDates = (start, end) => {
// // // //     if (!start || !end) return "";
// // // //     const startDateObj = new Date(start);
// // // //     const endDateObj = new Date(end);
// // // //     return endDateObj >= startDateObj ? "" : "End date cannot be before start date.";
// // // //   };

// // // //   // Validate all fields
// // // //   const validateForm = () => {
// // // //     const newErrors = {
// // // //       contactPhone: validateMobileNumber(contactPhone),
// // // //       cPanNo: validatePanNumber(cPanNo),
// // // //       endDate: validateDates(startDate, endDate),
// // // //     };
// // // //     setErrors(newErrors);
// // // //     return Object.values(newErrors).every((error) => error === "");
// // // //   };

// // // //   useEffect(() => {
// // // //     const fetchRoles = async () => {
// // // //       try {
// // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // // //           method: "GET",
// // // //           headers: {
// // // //             "Content-Type": "application/json",
// // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // //             "x-employee-id": employeeId,
// // // //           },
// // // //         });
// // // //         if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
// // // //         const data = await res.json();
// // // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // // //         setRoles(uniqueRoles);
// // // //       } catch (err) {
// // // //         console.error("Role fetch error:", err);
// // // //         setMessage("❌ Failed to fetch roles.");
// // // //       }
// // // //     };

// // // //     const fetchOrganizations = async () => {
// // // //       try {
// // // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // //           headers: {
// // // //             "Content-Type": "application/json",
// // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // //             "x-employee-id": employeeId,
// // // //           },
// // // //         });
// // // //         if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // //         const data = await res.json();
// // // //         setOrgTableData(data);
// // // //         setFilteredOrgData(data);
// // // //       } catch (err) {
// // // //         console.error("Organization table fetch error:", err);
// // // //         setMessage("❌ Failed to fetch organizations.");
// // // //       }
// // // //     };

// // // //     fetchRoles();
// // // //     fetchOrganizations();
// // // //   }, [employeeId]);

// // // //   useEffect(() => {
// // // //     const fetchRolePages = async () => {
// // // //       if (selectedRoles.length === 0) {
// // // //         setRolePages([]);
// // // //         return;
// // // //       }

// // // //       try {
// // // //         const rolesQuery = selectedRoles.join(",");
// // // //         const res = await fetch(
// // // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // // //           {
// // // //             method: "GET",
// // // //             headers: {
// // // //               "Content-Type": "application/json",
// // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // //               "x-employee-id": employeeId,
// // // //             },
// // // //           }
// // // //         );
// // // //         if (!res.ok) throw new Error(`Failed to fetch role pages: ${res.status}`);
// // // //         const data = await res.json();
// // // //         setRolePages(data);
// // // //       } catch (err) {
// // // //         console.error("Role pages fetch error:", err);
// // // //         setRolePages([]);
// // // //         setMessage("❌ Failed to fetch role pages.");
// // // //       }
// // // //     };

// // // //     fetchRolePages();
// // // //   }, [selectedRoles, employeeId]);

// // // //   // Real-time search filtering across multiple fields
// // // //   useEffect(() => {
// // // //     const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
// // // //     const filtered = orgTableData.filter((org) => {
// // // //       if (!lowerCaseSearchTerm) return true;
// // // //       return (
// // // //         org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // //         org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // //         org.id.toString().includes(lowerCaseSearchTerm) ||
// // // //         org.admin_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // //         org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // //         org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // //         org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // // //         org.end_date?.toLowerCase().includes(lowerCaseSearchTerm)
// // // //       );
// // // //     });
// // // //     setFilteredOrgData(filtered);
// // // //   }, [debouncedSearchTerm, orgTableData]);

// // // //   const handleSearchInputChange = (e) => {
// // // //     setSearchTerm(e.target.value);
// // // //   };

// // // //   const handleRoleToggle = (role) => {
// // // //     setSelectedRoles((prev) =>
// // // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // // //     );
// // // //   };

// // // //   const handlePageToggle = (page) => {
// // // //     setSelectedPages((prev) => {
// // // //       const exists = prev.some(
// // // //         (p) => p.page_name === page.page_name && p.path === page.path
// // // //       );
// // // //       return exists
// // // //         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// // // //         : [...prev, { ...page, role_id: page.role_id || 0, role_name: page.role_name || null }];
// // // //     });
// // // //   };

// // // //   const handleEdit = async (org) => {
// // // //     setIsEditing(true);
// // // //     setCurrentOrgId(org.id);
// // // //     setName(org.Name || "");
// // // //     setSubdomain(org.subdomain || "");
// // // //     setNoEmployees(org.no_employees || "");
// // // //     setCompanyAddress(org.company_address || "");
// // // //     setCPanNo(org.c_pan_no || "");
// // // //     setAdminEmail(org.admin_email || "");
// // // //     setContactEmail(org.contact_email_id || "");
// // // //     setContactPhone(org.contact_phone_no || "");
// // // //     setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
// // // //     setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
// // // //     setSelectedRoles([]);
// // // //     setSelectedPages([]);
// // // //     setErrors({});

// // // //     try {
// // // //       const url = `${process.env.REACT_APP_BACKEND_URL}/organization-details/${org.id}`;
// // // //       const res = await fetch(url, {
// // // //         method: "GET",
// // // //         headers: {
// // // //           "Content-Type": "application/json",
// // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // //           "x-employee-id": employeeId,
// // // //         },
// // // //       });

// // // //       if (!res.ok) {
// // // //         throw new Error(`Failed to fetch organization roles and pages: ${res.status}`);
// // // //       }

// // // //       const data = await res.json();
// // // //       setSelectedRoles(data.roles ? data.roles.map((r) => r.role_name) : []);
// // // //       setSelectedPages(data.pages ? data.pages.map((p) => ({ ...p, role_id: p.role_id || 0, role_name: p.role_name || null })) : []);
// // // //     } catch (err) {
// // // //       console.error("Error fetching org roles and pages:", err);
// // // //       setMessage(`❌ Failed to load organization roles and pages: ${err.message}`);
// // // //     }

// // // //     setShowForm(true);
// // // //   };

// // // //   const handleDelete = async (orgId) => {
// // // //     if (!window.confirm("Are you sure you want to delete this organization?")) return;

// // // //     try {
// // // //       const response = await fetch(
// // // //         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
// // // //         {
// // // //           method: "DELETE",
// // // //           headers: {
// // // //             "Content-Type": "application/json",
// // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // //             "x-employee-id": employeeId,
// // // //           },
// // // //         }
// // // //       );

// // // //       const data = await response.json();
// // // //       if (response.ok) {
// // // //         setMessage(data.message || "✅ Organization deleted successfully.");
// // // //         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
// // // //         setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
// // // //       } else {
// // // //         setMessage(data.error || "❌ Failed to delete organization.");
// // // //       }
// // // //     } catch (error) {
// // // //       console.error("Delete organization error:", error);
// // // //       setMessage(`❌ Server error: ${error.message}`);
// // // //     }
// // // //   };

// // // //   const handleSubmit = async (e) => {
// // // //     e.preventDefault();
// // // //     setMessage("");

// // // //     if (!validateForm()) {
// // // //       setMessage("❌ Please fix the errors in the form.");
// // // //       return;
// // // //     }

// // // //     const orgData = {
// // // //       Name: name,
// // // //       subdomain,
// // // //       no_employees: parseInt(noEmployees) || 0,
// // // //       company_address: companyAddress,
// // // //       c_pan_no: cPanNo,
// // // //       admin_email: adminEmail,
// // // //       contact_email_id: contactEmail,
// // // //       contact_phone_no: contactPhone,
// // // //       start_date: startDate,
// // // //       end_date: endDate,
// // // //       roles: selectedRoles,
// // // //       selectedPages: selectedPages.map((p) => ({
// // // //         page_name: p.page_name,
// // // //         path: p.path,
// // // //         icon_name: p.icon_name,
// // // //         role_id: p.role_id || 0,
// // // //         role_name: p.role_name || null,
// // // //       })),
// // // //     };

// // // //     try {
// // // //       const url = isEditing
// // // //         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
// // // //         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;
// // // //       const method = isEditing ? "PUT" : "POST";

// // // //       const response = await fetch(url, {
// // // //         method,
// // // //         headers: {
// // // //           "Content-Type": "application/json",
// // // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // // //           "x-employee-id": employeeId,
// // // //         },
// // // //         body: JSON.stringify(orgData),
// // // //       });

// // // //       const data = await response.json();
// // // //       if (response.ok) {
// // // //         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
// // // //         if (isEditing) {
// // // //           setOrgTableData((prev) =>
// // // //             prev.map((org) =>
// // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // //             )
// // // //           );
// // // //           setFilteredOrgData((prev) =>
// // // //             prev.map((org) =>
// // // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // // //             )
// // // //           );
// // // //         } else {
// // // //           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // // //             headers: {
// // // //               "Content-Type": "application/json",
// // // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // // //               "x-employee-id": employeeId,
// // // //             },
// // // //           });
// // // //           if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // // //           const newData = await res.json();
// // // //           setOrgTableData(newData);
// // // //           setFilteredOrgData(newData);
// // // //         }
// // // //         setName("");
// // // //         setSubdomain("");
// // // //         setNoEmployees("");
// // // //         setCompanyAddress("");
// // // //         setCPanNo("");
// // // //         setAdminEmail("");
// // // //         setContactEmail("");
// // // //         setContactPhone("");
// // // //         setStartDate("");
// // // //         setEndDate("");
// // // //         setSelectedRoles([]);
// // // //         setSelectedPages([]);
// // // //         setShowForm(false);
// // // //         setIsEditing(false);
// // // //         setCurrentOrgId(null);
// // // //         setErrors({});
// // // //       } else {
// // // //         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
// // // //       }
// // // //     } catch (error) {
// // // //       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
// // // //       setMessage(`❌ Server error: ${error.message}`);
// // // //     }
// // // //   };

// // // //   const handleCloseModal = (e) => {
// // // //     if (e.target.className.includes("modal-overlay")) {
// // // //       setShowForm(false);
// // // //       setIsEditing(false);
// // // //       setCurrentOrgId(null);
// // // //       setName("");
// // // //       setSubdomain("");
// // // //       setNoEmployees("");
// // // //       setCompanyAddress("");
// // // //       setCPanNo("");
// // // //       setAdminEmail("");
// // // //       setContactEmail("");
// // // //       setContactPhone("");
// // // //       setStartDate("");
// // // //       setEndDate("");
// // // //       setSelectedRoles([]);
// // // //       setSelectedPages([]);
// // // //       setErrors({});
// // // //     }
// // // //   };

// // // //   const formatToIST = (dateString) => {
// // // //     try {
// // // //       const date = new Date(dateString);
// // // //       if (isNaN(date.getTime())) return dateString;
// // // //       return date.toLocaleString("en-IN", {
// // // //         timeZone: "Asia/Kolkata",
// // // //         year: "numeric",
// // // //         month: "2-digit",
// // // //         day: "2-digit",
// // // //       });
// // // //     } catch (error) {
// // // //       return dateString;
// // // //     }
// // // //   };

// // // //   const handleShowDetails = (org) => {
// // // //     setPopupData({
// // // //       company_address: org.company_address,
// // // //       admin_email: org.admin_email,
// // // //       contact_email_id: org.contact_email_id,
// // // //       contact_phone_no: org.contact_phone_no,
// // // //       start_date: formatToIST(org.start_date),
// // // //       end_date: formatToIST(org.end_date),
// // // //     });
// // // //     setShowDetailsPopup(true);
// // // //   };

// // // //   const handleCloseDetailsPopup = (e) => {
// // // //     if (e.target.className.includes("details-overlay")) {
// // // //       setShowDetailsPopup(false);
// // // //       setPopupData(null);
// // // //     }
// // // //   };

// // // //   // Group role pages by role_name
// // // //   const groupedRolePages = rolePages.reduce((acc, page) => {
// // // //     const roleName = page.role_name || "Unassigned";
// // // //     if (!acc[roleName]) {
// // // //       acc[roleName] = [];
// // // //     }
// // // //     acc[roleName].push(page);
// // // //     return acc;
// // // //   }, {});

// // // //   return (
// // // //     <div className="create-org-wrapper">
// // // //       <div className="table-header">
// // // //         <div className="search-container">
// // // //           <label className="search-label">Search by:</label>
// // // //           <input
// // // //             type="text"
// // // //             value={searchTerm}
// // // //             onChange={handleSearchInputChange}
// // // //             placeholder="Name, Id, Email, Date"
// // // //             className="search-input"
// // // //           />
// // // //         </div>
// // // //         <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // // //           + Add Organization
// // // //         </button>
// // // //       </div>

// // // //       {showForm && (
// // // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // // //           <div className="create-org-container">
// // // //             <div className="form-header">
// // // //               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
// // // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // // //                 ✕
// // // //               </span>
// // // //             </div>

// // // //             <form className="org-form" onSubmit={handleSubmit}>
// // // //               {/* Section 1: Organization Details */}
// // // //               <div className="form-section">
// // // //                 <h3>Organization Details</h3>
// // // //                 <div className="form-row">
// // // //                   <div className="form-field">
// // // //                     <label>Organization Name *</label>
// // // //                     <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // // //                   </div>
// // // //                   <div className="form-field">
// // // //                     <label>Display Name *</label>
// // // //                     <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // // //                   </div>
// // // //                   <div className="form-field">
// // // //                     <label>Number of Employees *</label>
// // // //                     <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // // //                   </div>
// // // //                 </div>

// // // //                 <div className="form-row">
// // // //                   <div className="form-field">
// // // //                     <label>Company Address *</label>
// // // //                     <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // // //                   </div>
// // // //                   <div className="form-field">
// // // //                     <label>Company PAN No *</label>
// // // //                     <input
// // // //                       type="text"
// // // //                       value={cPanNo}
// // // //                       onChange={(e) => {
// // // //                         setCPanNo(e.target.value.toUpperCase());
// // // //                         setErrors((prev) => ({ ...prev, cPanNo: validatePanNumber(e.target.value.toUpperCase()) }));
// // // //                       }}
// // // //                       required
// // // //                     />
// // // //                     {errors.cPanNo && <span className="error-message">{errors.cPanNo}</span>}
// // // //                   </div>
// // // //                   <div className="form-field">
// // // //                     <label>Admin Email ID *</label>
// // // //                     <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // // //                   </div>
// // // //                 </div>

// // // //                 <div className="form-row form-row-four">
// // // //                   <div className="form-field">
// // // //                     <label>Contact Email ID *</label>
// // // //                     <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // // //                   </div>
// // // //                   <div className="form-field">
// // // //                     <label>Contact Phone No *</label>
// // // //                     <input
// // // //                       type="tel"
// // // //                       value={contactPhone}
// // // //                       onChange={(e) => {
// // // //                         setContactPhone(e.target.value);
// // // //                         setErrors((prev) => ({ ...prev, contactPhone: validateMobileNumber(e.target.value) }));
// // // //                       }}
// // // //                       required
// // // //                     />
// // // //                     {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
// // // //                   </div>
// // // //                   <div className="form-field date-field">
// // // //                     <label>Start Date *</label>
// // // //                     <div className="date-input-container">
// // // //                       <input
// // // //                         type="date"
// // // //                         value={startDate}
// // // //                         onChange={(e) => {
// // // //                           setStartDate(e.target.value);
// // // //                           setErrors((prev) => ({ ...prev, endDate: validateDates(e.target.value, endDate) }));
// // // //                         }}
// // // //                         required
// // // //                       />
// // // //                       <MdOutlineCalendarToday className="date-icon" />
// // // //                     </div>
// // // //                   </div>
// // // //                   <div className="form-field date-field">
// // // //                     <label>End Date *</label>
// // // //                     <div className="date-input-container">
// // // //                       <input
// // // //                         type="date"
// // // //                         value={endDate}
// // // //                         onChange={(e) => {
// // // //                           setEndDate(e.target.value);
// // // //                           setErrors((prev) => ({ ...prev, endDate: validateDates(startDate, e.target.value) }));
// // // //                         }}
// // // //                         required
// // // //                       />
// // // //                       <MdOutlineCalendarToday className="date-icon" />
// // // //                     </div>
// // // //                     {errors.endDate && <span className="error-message">{errors.endDate}</span>}
// // // //                   </div>
// // // //                 </div>
// // // //               </div>

// // // //               {/* Section 2: Roles and Permissions */}
// // // //               <div className="form-section">
// // // //                 <h3>Roles and Permissions</h3>
// // // //                 <div className="form-row">
// // // //                   <div className="roles-checkbox-group">
// // // //                     <label>Assign Roles *</label>
// // // //                     <div className="checkbox-list">
// // // //                       {roles.length > 0 ? (
// // // //                         roles.map((role) => (
// // // //                           <div key={role} className="checkbox-item">
// // // //                             <input
// // // //                               type="checkbox"
// // // //                               id={`role-${role}`}
// // // //                               checked={selectedRoles.includes(role)}
// // // //                               onChange={() => handleRoleToggle(role)}
// // // //                             />
// // // //                             <label htmlFor={`role-${role}`} className="checkbox-label">
// // // //                               {role}
// // // //                             </label>
// // // //                           </div>
// // // //                         ))
// // // //                       ) : (
// // // //                         <p style={{ fontSize: "12px", color: "#666" }}>No roles found.</p>
// // // //                       )}
// // // //                     </div>
// // // //                   </div>
// // // //                 </div>

// // // //                 {Object.keys(groupedRolePages).length > 0 && (
// // // //                   <div className="form-row">
// // // //                     <div className="roles-checkbox-group">
// // // //                       <label>Assign Pages to Roles</label>
// // // //                       {Object.entries(groupedRolePages).map(([roleName, pages]) => (
// // // //                         <div key={roleName} className="role-pages-group">
// // // //                           <h4>{roleName}</h4>
// // // //                           <div className="checkbox-list">
// // // //                             {pages.map((page, index) => (
// // // //                               <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// // // //                                 <input
// // // //                                   type="checkbox"
// // // //                                   checked={selectedPages.some(
// // // //                                     (p) => p.page_name === page.page_name && p.path === page.path
// // // //                                   )}
// // // //                                   onChange={() => handlePageToggle(page)}
// // // //                                 />
// // // //                                 <label className="checkbox-label">
// // // //                                   {page.page_name} ({page.path})
// // // //                                 </label>
// // // //                               </div>
// // // //                             ))}
// // // //                           </div>
// // // //                         </div>
// // // //                       ))}
// // // //                     </div>
// // // //                   </div>
// // // //                 )}
// // // //               </div>

// // // //               <div className="form-actions">
// // // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // // //                   Cancel
// // // //                 </button>
// // // //                 <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
// // // //               </div>
// // // //             </form>

// // // //             {message && <p className="message">{message}</p>}
// // // //           </div>
// // // //         </div>
// // // //       )}

// // // //       {showDetailsPopup && popupData && (
// // // //         <div className="details-overlay" onClick={handleCloseDetailsPopup}>
// // // //           <div className="details-popup">
// // // //             <div className="form-header">
// // // //               <h2>Details</h2>
// // // //               <span className="close-icon" onClick={() => setShowDetailsPopup(false)}>
// // // //                 ✕
// // // //               </span>
// // // //             </div>
// // // //             <div className="details-content">
// // // //               <p><strong>Address:</strong> {popupData.company_address}</p>
// // // //               <p><strong>Admin Email:</strong> {popupData.admin_email}</p>
// // // //               <p><strong>Contact Email:</strong> {popupData.contact_email_id}</p>
// // // //               <p><strong>Contact Phone:</strong> {popupData.contact_phone_no}</p>
// // // //               <p><strong>Start Date:</strong> {popupData.start_date}</p>
// // // //               <p><strong>End Date:</strong> {popupData.end_date}</p>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       )}

// // // //       {/* Mobile view: Card layout */}
// // // //       {filteredOrgData.length > 0 && (
// // // //         <div className="mobile-cards">
// // // //           {filteredOrgData.map((org) => (
// // // //             <div className="org-card" key={org.id}>
// // // //               <div className="org-card-header">{org.Name}</div>
// // // //               <div className="org-card-content"><strong>ID:</strong> {org.id}</div>
// // // //               <div className="org-card-content"><strong>Subdomain:</strong> {org.subdomain}</div>
// // // //               <div className="org-card-content"><strong>No. Employees:</strong> {org.no_employees}</div>
// // // //               <div className="org-card-actions">
// // // //                 <button className="view-btn" onClick={() => handleShowDetails(org)} title="View Details">
// // // //                   <FaEye />
// // // //                 </button>
// // // //                 <button className="edit-btn" onClick={() => handleEdit(org)} title="Edit">
// // // //                   <MdEdit />
// // // //                 </button>
// // // //                 <button className="delete-btn" onClick={() => handleDelete(org.id)} title="Delete">
// // // //                   <FaTrash />
// // // //                 </button>
// // // //               </div>
// // // //             </div>
// // // //           ))}
// // // //         </div>
// // // //       )}

// // // //       {filteredOrgData.length > 0 && (
// // // //         <div className="org-table-container">
// // // //           <table className="org-table">
// // // //             <thead>
// // // //               <tr>
// // // //                 <th>ID</th>
// // // //                 <th>Name</th>
// // // //                 <th>Subdomain</th>
// // // //                 <th>No. Employees</th>
// // // //                 <th>CommonDetails</th>
// // // //                 <th>Actions</th>
// // // //               </tr>
// // // //             </thead>
// // // //             <tbody>
// // // //               {filteredOrgData.map((org) => (
// // // //                 <tr key={org.id}>
// // // //                   <td><span className="tooltip" title={org.id}>{org.id}</span></td>
// // // //                   <td><span className="tooltip" title={org.Name}>{org.Name}</span></td>
// // // //                   <td><span className="tooltip" title={org.subdomain}>{org.subdomain}</span></td>
// // // //                   <td><span className="tooltip" title={org.no_employees}>{org.no_employees}</span></td>
// // // //                   <td>
// // // //                     <button
// // // //                       className="view-btn"
// // // //                       onClick={() => handleShowDetails(org)}
// // // //                       title="View Details"
// // // //                     >
// // // //                       <FaEye />
// // // //                     </button>
// // // //                   </td>
// // // //                   <td>
// // // //                     <button
// // // //                       className="edit-btn"
// // // //                       onClick={() => handleEdit(org)}
// // // //                       title="Edit"
// // // //                     >
// // // //                       <MdEdit />
// // // //                     </button>
// // // //                     <button
// // // //                       className="delete-btn"
// // // //                       onClick={() => handleDelete(org.id)}
// // // //                       title="Delete"
// // // //                     >
// // // //                       <FaTrash />
// // // //                     </button>
// // // //                   </td>
// // // //                 </tr>
// // // //               ))}
// // // //             </tbody>
// // // //           </table>
// // // //         </div>
// // // //       )}
// // // //     </div>
// // // //   );
// // // // };

// // // // export default CreateOrganization;

// // // import React, { useEffect, useState } from "react";
// // // import { FaEye, FaTrash } from "react-icons/fa";
// // // import { MdOutlineCalendarToday, MdEdit } from "react-icons/md";
// // // import "./CreateOrganization.css";

// // // // Custom debounce hook
// // // const useDebounce = (value, delay) => {
// // //   const [debouncedValue, setDebouncedValue] = useState(value);

// // //   useEffect(() => {
// // //     const handler = setTimeout(() => {
// // //       setDebouncedValue(value);
// // //     }, delay);

// // //     return () => {
// // //       clearTimeout(handler);
// // //     };
// // //   }, [value, delay]);

// // //   return debouncedValue;
// // // };

// // // const CreateOrganization = ({ employeeId = "default-employee-id" }) => {
// // //   const [showForm, setShowForm] = useState(false);
// // //   const [isEditing, setIsEditing] = useState(false);
// // //   const [currentOrgId, setCurrentOrgId] = useState(null);
// // //   const [name, setName] = useState("");
// // //   const [subdomain, setSubdomain] = useState("");
// // //   const [noEmployees, setNoEmployees] = useState("");
// // //   const [companyAddress, setCompanyAddress] = useState("");
// // //   const [cPanNo, setCPanNo] = useState("");
// // //   const [adminEmail, setAdminEmail] = useState("");
// // //   const [contactEmail, setContactEmail] = useState("");
// // //   const [contactPhone, setContactPhone] = useState("");
// // //   const [startDate, setStartDate] = useState("");
// // //   const [endDate, setEndDate] = useState("");
// // //   const [roles, setRoles] = useState([]);
// // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // //   const [rolePages, setRolePages] = useState([]);
// // //   const [selectedPages, setSelectedPages] = useState([]);
// // //   const [message, setMessage] = useState("");
// // //   const [orgTableData, setOrgTableData] = useState([]);
// // //   const [searchTerm, setSearchTerm] = useState("");
// // //   const [filteredOrgData, setFilteredOrgData] = useState([]);
// // //   const [showDetailsPopup, setShowDetailsPopup] = useState(false);
// // //   const [popupData, setPopupData] = useState(null);
// // //   const [errors, setErrors] = useState({});

// // //   const debouncedSearchTerm = useDebounce(searchTerm, 300);

// // //   // Validation functions
// // //   const validateMobileNumber = (phone) => {
// // //     const regex = /^[6-9]\d{9}$/;
// // //     return regex.test(phone) ? "" : "Please enter a valid 10-digit Indian mobile number.";
// // //   };

// // //   const validatePanNumber = (pan) => {
// // //     const regex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
// // //     return regex.test(pan) ? "" : "Please enter a valid PAN number (e.g., ABCDE1234F).";
// // //   };

// // //   const validateDates = (start, end) => {
// // //     if (!start || !end) return "";
// // //     const startDateObj = new Date(start);
// // //     const endDateObj = new Date(end);
// // //     return endDateObj >= startDateObj ? "" : "End date cannot be before start date.";
// // //   };

// // //   // Validate all fields
// // //   const validateForm = () => {
// // //     const newErrors = {
// // //       contactPhone: validateMobileNumber(contactPhone),
// // //       cPanNo: validatePanNumber(cPanNo),
// // //       endDate: validateDates(startDate, endDate),
// // //     };
// // //     setErrors(newErrors);
// // //     return Object.values(newErrors).every((error) => error === "");
// // //   };

// // //   useEffect(() => {
// // //     const fetchRoles = async () => {
// // //       try {
// // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // //           method: "GET",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // //             "x-employee-id": employeeId,
// // //           },
// // //         });
// // //         if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
// // //         const data = await res.json();
// // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // //         setRoles(uniqueRoles);
// // //       } catch (err) {
// // //         console.error("Role fetch error:", err);
// // //         setMessage("❌ Failed to fetch roles.");
// // //       }
// // //     };

// // //     const fetchOrganizations = async () => {
// // //       try {
// // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // //             "x-employee-id": employeeId,
// // //           },
// // //         });
// // //         if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // //         const data = await res.json();
// // //         setOrgTableData(data);
// // //         setFilteredOrgData(data);
// // //       } catch (err) {
// // //         console.error("Organization table fetch error:", err);
// // //         setMessage("❌ Failed to fetch organizations.");
// // //       }
// // //     };

// // //     fetchRoles();
// // //     fetchOrganizations();
// // //   }, [employeeId]);

// // //   useEffect(() => {
// // //     const fetchRolePages = async () => {
// // //       if (selectedRoles.length === 0) {
// // //         setRolePages([]);
// // //         return;
// // //       }

// // //       try {
// // //         const rolesQuery = selectedRoles.join(",");
// // //         const res = await fetch(
// // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // //           {
// // //             method: "GET",
// // //             headers: {
// // //               "Content-Type": "application/json",
// // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // //               "x-employee-id": employeeId,
// // //             },
// // //           }
// // //         );
// // //         if (!res.ok) throw new Error(`Failed to fetch role pages: ${res.status}`);
// // //         const data = await res.json();
// // //         setRolePages(data);
// // //       } catch (err) {
// // //         console.error("Role pages fetch error:", err);
// // //         setRolePages([]);
// // //         setMessage("❌ Failed to fetch role pages.");
// // //       }
// // //     };

// // //     fetchRolePages();
// // //   }, [selectedRoles, employeeId]);

// // //   // Real-time search filtering across multiple fields
// // //   useEffect(() => {
// // //     const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
// // //     const filtered = orgTableData.filter((org) => {
// // //       if (!lowerCaseSearchTerm) return true;
// // //       return (
// // //         org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.id.toString().includes(lowerCaseSearchTerm) ||
// // //         org.admin_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.end_date?.toLowerCase().includes(lowerCaseSearchTerm)
// // //       );
// // //     });
// // //     setFilteredOrgData(filtered);
// // //   }, [debouncedSearchTerm, orgTableData]);

// // //   const handleSearchInputChange = (e) => {
// // //     setSearchTerm(e.target.value);
// // //   };

// // //   const handleRoleToggle = (role) => {
// // //     setSelectedRoles((prev) =>
// // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // //     );
// // //   };

// // //   const handlePageToggle = (page) => {
// // //     setSelectedPages((prev) => {
// // //       const exists = prev.some(
// // //         (p) => p.page_name === page.page_name && p.path === page.path
// // //       );
// // //       return exists
// // //         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// // //         : [...prev, { ...page, role_id: page.role_id || 0, role_name: page.role_name || null }];
// // //     });
// // //   };

// // //   const handleEdit = async (org) => {
// // //     setIsEditing(true);
// // //     setCurrentOrgId(org.id);
// // //     setName(org.Name || "");
// // //     setSubdomain(org.subdomain || "");
// // //     setNoEmployees(org.no_employees || "");
// // //     setCompanyAddress(org.company_address || "");
// // //     setCPanNo(org.c_pan_no || "");
// // //     setAdminEmail(org.admin_email || "");
// // //     setContactEmail(org.contact_email_id || "");
// // //     setContactPhone(org.contact_phone_no || "");
// // //     setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
// // //     setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
// // //     setSelectedRoles([]);
// // //     setSelectedPages([]);
// // //     setErrors({});

// // //     try {
// // //       const url = `${process.env.REACT_APP_BACKEND_URL}/organization-details/${org.id}`;
// // //       const res = await fetch(url, {
// // //         method: "GET",
// // //         headers: {
// // //           "Content-Type": "application/json",
// // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // //           "x-employee-id": employeeId,
// // //         },
// // //       });

// // //       if (!res.ok) {
// // //         throw new Error(`Failed to fetch organization roles and pages: ${res.status}`);
// // //       }

// // //       const data = await res.json();
// // //       setSelectedRoles(data.roles ? data.roles.map((r) => r.role_name) : []);
// // //       setSelectedPages(data.pages ? data.pages.map((p) => ({ ...p, role_id: p.role_id || 0, role_name: p.role_name || null })) : []);
// // //     } catch (err) {
// // //       console.error("Error fetching org roles and pages:", err);
// // //       setMessage(`❌ Failed to load organization roles and pages: ${err.message}`);
// // //     }

// // //     setShowForm(true);
// // //   };

// // //   const handleDelete = async (orgId) => {
// // //     if (!window.confirm("Are you sure you want to delete this organization?")) return;

// // //     try {
// // //       const response = await fetch(
// // //         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
// // //         {
// // //           method: "DELETE",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // //             "x-employee-id": employeeId,
// // //           },
// // //         }
// // //       );

// // //       const data = await response.json();
// // //       if (response.ok) {
// // //         setMessage(data.message || "✅ Organization deleted successfully.");
// // //         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
// // //         setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
// // //       } else {
// // //         setMessage(data.error || "❌ Failed to delete organization.");
// // //       }
// // //     } catch (error) {
// // //       console.error("Delete organization error:", error);
// // //       setMessage(`❌ Server error: ${error.message}`);
// // //     }
// // //   };

// // //   const handleSubmit = async (e) => {
// // //     e.preventDefault();
// // //     setMessage("");

// // //     if (!validateForm()) {
// // //       setMessage("❌ Please fix the errors in the form.");
// // //       return;
// // //     }

// // //     const orgData = {
// // //       Name: name,
// // //       subdomain,
// // //       no_employees: parseInt(noEmployees) || 0,
// // //       company_address: companyAddress,
// // //       c_pan_no: cPanNo,
// // //       admin_email: adminEmail,
// // //       contact_email_id: contactEmail,
// // //       contact_phone_no: contactPhone,
// // //       start_date: startDate,
// // //       end_date: endDate,
// // //       roles: selectedRoles,
// // //       selectedPages: selectedPages.map((p) => ({
// // //         page_name: p.page_name,
// // //         path: p.path,
// // //         icon_name: p.icon_name,
// // //         role_id: p.role_id || 0,
// // //         role_name: p.role_name || null,
// // //       })),
// // //     };

// // //     try {
// // //       const url = isEditing
// // //         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
// // //         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;
// // //       const method = isEditing ? "PUT" : "POST";

// // //       const response = await fetch(url, {
// // //         method,
// // //         headers: {
// // //           "Content-Type": "application/json",
// // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // //           "x-employee-id": employeeId,
// // //         },
// // //         body: JSON.stringify(orgData),
// // //       });

// // //       const data = await response.json();
// // //       if (response.ok) {
// // //         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
// // //         if (isEditing) {
// // //           setOrgTableData((prev) =>
// // //             prev.map((org) =>
// // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // //             )
// // //           );
// // //           setFilteredOrgData((prev) =>
// // //             prev.map((org) =>
// // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // //             )
// // //           );
// // //         } else {
// // //           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // //             headers: {
// // //               "Content-Type": "application/json",
// // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // //               "x-employee-id": employeeId,
// // //             },
// // //           });
// // //           if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // //           const newData = await res.json();
// // //           setOrgTableData(newData);
// // //           setFilteredOrgData(newData);
// // //         }
// // //         setName("");
// // //         setSubdomain("");
// // //         setNoEmployees("");
// // //         setCompanyAddress("");
// // //         setCPanNo("");
// // //         setAdminEmail("");
// // //         setContactEmail("");
// // //         setContactPhone("");
// // //         setStartDate("");
// // //         setEndDate("");
// // //         setSelectedRoles([]);
// // //         setSelectedPages([]);
// // //         setShowForm(false);
// // //         setIsEditing(false);
// // //         setCurrentOrgId(null);
// // //         setErrors({});
// // //       } else {
// // //         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
// // //       }
// // //     } catch (error) {
// // //       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
// // //       setMessage(`❌ Server error: ${error.message}`);
// // //     }
// // //   };

// // //   const handleCloseModal = (e) => {
// // //     if (e.target.className.includes("modal-overlay")) {
// // //       setShowForm(false);
// // //       setIsEditing(false);
// // //       setCurrentOrgId(null);
// // //       setName("");
// // //       setSubdomain("");
// // //       setNoEmployees("");
// // //       setCompanyAddress("");
// // //       setCPanNo("");
// // //       setAdminEmail("");
// // //       setContactEmail("");
// // //       setContactPhone("");
// // //       setStartDate("");
// // //       setEndDate("");
// // //       setSelectedRoles([]);
// // //       setSelectedPages([]);
// // //       setErrors({});
// // //     }
// // //   };

// // //   const formatToIST = (dateString) => {
// // //     try {
// // //       const date = new Date(dateString);
// // //       if (isNaN(date.getTime())) return dateString;
// // //       return date.toLocaleString("en-IN", {
// // //         timeZone: "Asia/Kolkata",
// // //         year: "numeric",
// // //         month: "2-digit",
// // //         day: "2-digit",
// // //       });
// // //     } catch (error) {
// // //       return dateString;
// // //     }
// // //   };

// // //   const handleShowDetails = (org) => {
// // //     setPopupData({
// // //       company_address: org.company_address,
// // //       admin_email: org.admin_email,
// // //       contact_email_id: org.contact_email_id,
// // //       contact_phone_no: org.contact_phone_no,
// // //       start_date: formatToIST(org.start_date),
// // //       end_date: formatToIST(org.end_date),
// // //     });
// // //     setShowDetailsPopup(true);
// // //   };

// // //   const handleCloseDetailsPopup = (e) => {
// // //     if (e.target.className.includes("details-overlay")) {
// // //       setShowDetailsPopup(false);
// // //       setPopupData(null);
// // //     }
// // //   };

// // //   // Group role pages by role_name
// // //   const groupedRolePages = rolePages.reduce((acc, page) => {
// // //     const roleName = page.role_name || "Unassigned";
// // //     if (!acc[roleName]) {
// // //       acc[roleName] = [];
// // //     }
// // //     acc[roleName].push(page);
// // //     return acc;
// // //   }, {});

// // //   return (
// // //     <div className="create-org-wrapper">
// // //       <div className="table-header">
// // //         <div className="search-container">
// // //           <label className="search-label">Search by:</label>
// // //           <input
// // //             type="text"
// // //             value={searchTerm}
// // //             onChange={handleSearchInputChange}
// // //             placeholder="Name, Id, Email, Date"
// // //             className="search-input"
// // //           />
// // //         </div>
// // //         <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // //           + Add Organization
// // //         </button>
// // //       </div>

// // //       {showForm && (
// // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // //           <div className="create-org-container">
// // //             <div className="form-header">
// // //               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
// // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // //                 ✕
// // //               </span>
// // //             </div>

// // //             <form className="org-form" onSubmit={handleSubmit}>
// // //               {/* Section 1: Organization Details */}
// // //               <div className="form-section">
// // //                 <h3>Organization Details</h3>
// // //                 <div className="form-row">
// // //                   <div className="form-field">
// // //                     <label>Organization Name *</label>
// // //                     <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // //                   </div>
// // //                   <div className="form-field">
// // //                     <label>Display Name *</label>
// // //                     <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // //                   </div>
// // //                   <div className="form-field">
// // //                     <label>Number of Employees *</label>
// // //                     <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // //                   </div>
// // //                 </div>

// // //                 <div className="form-row">
// // //                   <div className="form-field">
// // //                     <label>Company Address *</label>
// // //                     <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // //                   </div>
// // //                   <div className="form-field">
// // //                     <label>Company PAN No *</label>
// // //                     <input
// // //                       type="text"
// // //                       value={cPanNo}
// // //                       onChange={(e) => {
// // //                         setCPanNo(e.target.value.toUpperCase());
// // //                         setErrors((prev) => ({ ...prev, cPanNo: validatePanNumber(e.target.value.toUpperCase()) }));
// // //                       }}
// // //                       required
// // //                     />
// // //                     {errors.cPanNo && <span className="error-message">{errors.cPanNo}</span>}
// // //                   </div>
// // //                   <div className="form-field">
// // //                     <label>Admin Email ID *</label>
// // //                     <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // //                   </div>
// // //                 </div>

// // //                 <div className="form-row form-row-four">
// // //                   <div className="form-field">
// // //                     <label>Contact Email ID *</label>
// // //                     <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // //                   </div>
// // //                   <div className="form-field">
// // //                     <label>Contact Phone No *</label>
// // //                     <input
// // //                       type="tel"
// // //                       value={contactPhone}
// // //                       onChange={(e) => {
// // //                         setContactPhone(e.target.value);
// // //                         setErrors((prev) => ({ ...prev, contactPhone: validateMobileNumber(e.target.value) }));
// // //                       }}
// // //                       required
// // //                     />
// // //                     {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
// // //                   </div>
// // //                   <div className="form-field date-field">
// // //                     <label>Start Date *</label>
// // //                     <div className="date-input-container">
// // //                       <input
// // //                         type="date"
// // //                         value={startDate}
// // //                         onChange={(e) => {
// // //                           setStartDate(e.target.value);
// // //                           setErrors((prev) => ({ ...prev, endDate: validateDates(e.target.value, endDate) }));
// // //                         }}
// // //                         required
// // //                       />
// // //                       <MdOutlineCalendarToday className="date-icon" />
// // //                     </div>
// // //                   </div>
// // //                   <div className="form-field date-field">
// // //                     <label>End Date *</label>
// // //                     <div className="date-input-container">
// // //                       <input
// // //                         type="date"
// // //                         value={endDate}
// // //                         onChange={(e) => {
// // //                           setEndDate(e.target.value);
// // //                           setErrors((prev) => ({ ...prev, endDate: validateDates(startDate, e.target.value) }));
// // //                         }}
// // //                         required
// // //                       />
// // //                       <MdOutlineCalendarToday className="date-icon" />
// // //                     </div>
// // //                     {errors.endDate && <span className="error-message">{errors.endDate}</span>}
// // //                   </div>
// // //                 </div>
// // //               </div>

// // //               {/* Section 2: Assign Roles */}
// // //               <div className="form-section">
// // //                 <h3>Assign Roles</h3>
// // //                 <div className="roles-checkbox-group">
// // //                   <div className="checkbox-list">
// // //                     {roles.length > 0 ? (
// // //                       roles.map((role) => (
// // //                         <div key={role} className="checkbox-item">
// // //                           <input
// // //                             type="checkbox"
// // //                             id={`role-${role}`}
// // //                             checked={selectedRoles.includes(role)}
// // //                             onChange={() => handleRoleToggle(role)}
// // //                           />
// // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // //                             {role}
// // //                           </label>
// // //                         </div>
// // //                       ))
// // //                     ) : (
// // //                       <p className="no-data">No roles found.</p>
// // //                     )}
// // //                   </div>
// // //                 </div>
// // //               </div>

// // //               {/* Section 3: Assign Pages to Roles */}
// // //               <div className="form-section">
// // //                 <h3>Assign Pages to Roles</h3>
// // //                 {Object.keys(groupedRolePages).length > 0 ? (
// // //                   Object.entries(groupedRolePages).map(([roleName, pages]) => (
// // //                     <div key={roleName} className="role-pages-group">
// // //                       <h4>{roleName}</h4>
// // //                       <div className="checkbox-list">
// // //                         {pages.map((page, index) => (
// // //                           <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// // //                             <input
// // //                               type="checkbox"
// // //                               checked={selectedPages.some(
// // //                                 (p) => p.page_name === page.page_name && p.path === page.path
// // //                               )}
// // //                               onChange={() => handlePageToggle(page)}
// // //                             />
// // //                             <label className="checkbox-label">
// // //                               {page.page_name} ({page.path})
// // //                             </label>
// // //                           </div>
// // //                         ))}
// // //                       </div>
// // //                     </div>
// // //                   ))
// // //                 ) : (
// // //                   <p className="no-data">No pages available. Select roles to view associated pages.</p>
// // //                 )}
// // //               </div>

// // //               <div className="form-actions">
// // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // //                   Cancel
// // //                 </button>
// // //                 <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
// // //               </div>
// // //             </form>

// // //             {message && <p className="message">{message}</p>}
// // //           </div>
// // //         </div>
// // //       )}

// // //       {showDetailsPopup && popupData && (
// // //         <div className="details-overlay" onClick={handleCloseDetailsPopup}>
// // //           <div className="details-popup">
// // //             <div className="form-header">
// // //               <h2>Details</h2>
// // //               <span className="close-icon" onClick={() => setShowDetailsPopup(false)}>
// // //                 ✕
// // //               </span>
// // //             </div>
// // //             <div className="details-content">
// // //               <p><strong>Address:</strong> {popupData.company_address}</p>
// // //               <p><strong>Admin Email:</strong> {popupData.admin_email}</p>
// // //               <p><strong>Contact Email:</strong> {popupData.contact_email_id}</p>
// // //               <p><strong>Contact Phone:</strong> {popupData.contact_phone_no}</p>
// // //               <p><strong>Start Date:</strong> {popupData.start_date}</p>
// // //               <p><strong>End Date:</strong> {popupData.end_date}</p>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* Mobile view: Card layout */}
// // //       {filteredOrgData.length > 0 && (
// // //         <div className="mobile-cards">
// // //           {filteredOrgData.map((org) => (
// // //             <div className="org-card" key={org.id}>
// // //               <div className="org-card-header">{org.Name}</div>
// // //               <div className="org-card-content"><strong>ID:</strong> {org.id}</div>
// // //               <div className="org-card-content"><strong>Subdomain:</strong> {org.subdomain}</div>
// // //               <div className="org-card-content"><strong>No. Employees:</strong> {org.no_employees}</div>
// // //               <div className="org-card-actions">
// // //                 <button className="view-btn" onClick={() => handleShowDetails(org)} title="View Details">
// // //                   <FaEye />
// // //                 </button>
// // //                 <button className="edit-btn" onClick={() => handleEdit(org)} title="Edit">
// // //                   <MdEdit />
// // //                 </button>
// // //                 <button className="delete-btn" onClick={() => handleDelete(org.id)} title="Delete">
// // //                   <FaTrash />
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           ))}
// // //         </div>
// // //       )}

// // //       {filteredOrgData.length > 0 && (
// // //         <div className="org-table-container">
// // //           <table className="org-table">
// // //             <thead>
// // //               <tr>
// // //                 <th>ID</th>
// // //                 <th>Name</th>
// // //                 <th>Subdomain</th>
// // //                 <th>No. Employees</th>
// // //                 <th>CommonDetails</th>
// // //                 <th>Actions</th>
// // //               </tr>
// // //             </thead>
// // //             <tbody>
// // //               {filteredOrgData.map((org) => (
// // //                 <tr key={org.id}>
// // //                   <td><span className="tooltip" title={org.id}>{org.id}</span></td>
// // //                   <td><span className="tooltip" title={org.Name}>{org.Name}</span></td>
// // //                   <td><span className="tooltip" title={org.subdomain}>{org.subdomain}</span></td>
// // //                   <td><span className="tooltip" title={org.no_employees}>{org.no_employees}</span></td>
// // //                   <td>
// // //                     <button
// // //                       className="view-btn"
// // //                       onClick={() => handleShowDetails(org)}
// // //                       title="View Details"
// // //                     >
// // //                       <FaEye />
// // //                     </button>
// // //                   </td>
// // //                   <td>
// // //                     <button
// // //                       className="edit-btn"
// // //                       onClick={() => handleEdit(org)}
// // //                       title="Edit"
// // //                     >
// // //                       <MdEdit />
// // //                     </button>
// // //                     <button
// // //                       className="delete-btn"
// // //                       onClick={() => handleDelete(org.id)}
// // //                       title="Delete"
// // //                     >
// // //                       <FaTrash />
// // //                     </button>
// // //                   </td>
// // //                 </tr>
// // //               ))}
// // //             </tbody>
// // //           </table>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default CreateOrganization;

// // // import React, { useEffect, useState } from "react";
// // // import { FaEye, FaTrash } from "react-icons/fa";
// // // import { MdOutlineCalendarToday, MdEdit } from "react-icons/md";
// // // import "./CreateOrganization.css";

// // // // Custom debounce hook
// // // const useDebounce = (value, delay) => {
// // //   const [debouncedValue, setDebouncedValue] = useState(value);

// // //   useEffect(() => {
// // //     const handler = setTimeout(() => {
// // //       setDebouncedValue(value);
// // //     }, delay);

// // //     return () => {
// // //       clearTimeout(handler);
// // //     };
// // //   }, [value, delay]);

// // //   return debouncedValue;
// // // };

// // // const CreateOrganization = ({ employeeId = "default-employee-id" }) => {
// // //   const [showForm, setShowForm] = useState(false);
// // //   const [isEditing, setIsEditing] = useState(false);
// // //   const [currentOrgId, setCurrentOrgId] = useState(null);
// // //   const [name, setName] = useState("");
// // //   const [subdomain, setSubdomain] = useState("");
// // //   const [noEmployees, setNoEmployees] = useState("");
// // //   const [companyAddress, setCompanyAddress] = useState("");
// // //   const [cPanNo, setCPanNo] = useState("");
// // //   const [adminEmail, setAdminEmail] = useState("");
// // //   const [contactEmail, setContactEmail] = useState("");
// // //   const [contactPhone, setContactPhone] = useState("");
// // //   const [startDate, setStartDate] = useState("");
// // //   const [endDate, setEndDate] = useState("");
// // //   const [roles, setRoles] = useState([]);
// // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // //   const [rolePages, setRolePages] = useState([]);
// // //   const [selectedPages, setSelectedPages] = useState([]);
// // //   const [message, setMessage] = useState("");
// // //   const [orgTableData, setOrgTableData] = useState([]);
// // //   const [searchTerm, setSearchTerm] = useState("");
// // //   const [filteredOrgData, setFilteredOrgData] = useState([]);
// // //   const [showDetailsPopup, setShowDetailsPopup] = useState(false);
// // //   const [popupData, setPopupData] = useState(null);
// // //   const [errors, setErrors] = useState({});

// // //   const debouncedSearchTerm = useDebounce(searchTerm, 300);

// // //   // Validation functions
// // //   const validateMobileNumber = (phone) => {
// // //     const regex = /^[6-9]\d{9}$/;
// // //     return regex.test(phone) ? "" : "Please enter a valid 10-digit Indian mobile number.";
// // //   };

// // //   const validatePanNumber = (pan) => {
// // //     const regex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
// // //     return regex.test(pan) ? "" : "Please enter a valid PAN number (e.g., ABCDE1234F).";
// // //   };

// // //   const validateDates = (start, end) => {
// // //     if (!start || !end) return "";
// // //     const startDateObj = new Date(start);
// // //     const endDateObj = new Date(end);
// // //     return endDateObj >= startDateObj ? "" : "End date cannot be before start date.";
// // //   };

// // //   // Validate all fields
// // //   const validateForm = () => {
// // //     const newErrors = {
// // //       contactPhone: validateMobileNumber(contactPhone),
// // //       cPanNo: validatePanNumber(cPanNo),
// // //       endDate: validateDates(startDate, endDate),
// // //     };
// // //     setErrors(newErrors);
// // //     return Object.values(newErrors).every((error) => error === "");
// // //   };

// // //   useEffect(() => {
// // //     const fetchRoles = async () => {
// // //       try {
// // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // //           method: "GET",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // //             "x-employee-id": employeeId,
// // //           },
// // //         });
// // //         if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
// // //         const data = await res.json();
// // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // //         setRoles(uniqueRoles);
// // //       } catch (err) {
// // //         console.error("Role fetch error:", err);
// // //         setMessage("❌ Failed to fetch roles.");
// // //       }
// // //     };

// // //     const fetchOrganizations = async () => {
// // //       try {
// // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // //             "x-employee-id": employeeId,
// // //           },
// // //         });
// // //         if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // //         const data = await res.json();
// // //         setOrgTableData(data);
// // //         setFilteredOrgData(data);
// // //       } catch (err) {
// // //         console.error("Organization table fetch error:", err);
// // //         setMessage("❌ Failed to fetch organizations.");
// // //       }
// // //     };

// // //     fetchRoles();
// // //     fetchOrganizations();
// // //   }, [employeeId]);

// // //   useEffect(() => {
// // //     const fetchRolePages = async () => {
// // //       if (selectedRoles.length === 0) {
// // //         setRolePages([]);
// // //         return;
// // //       }

// // //       try {
// // //         const rolesQuery = selectedRoles.join(",");
// // //         const res = await fetch(
// // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // //           {
// // //             method: "GET",
// // //             headers: {
// // //               "Content-Type": "application/json",
// // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // //               "x-employee-id": employeeId,
// // //             },
// // //           }
// // //         );
// // //         if (!res.ok) throw new Error(`Failed to fetch role pages: ${res.status}`);
// // //         const data = await res.json();
// // //         setRolePages(data);
// // //       } catch (err) {
// // //         console.error("Role pages fetch error:", err);
// // //         setRolePages([]);
// // //         setMessage("❌ Failed to fetch role pages.");
// // //       }
// // //     };

// // //     fetchRolePages();
// // //   }, [selectedRoles, employeeId]);

// // //   // Real-time search filtering across multiple fields
// // //   useEffect(() => {
// // //     const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
// // //     const filtered = orgTableData.filter((org) => {
// // //       if (!lowerCaseSearchTerm) return true;
// // //       return (
// // //         org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.id.toString().includes(lowerCaseSearchTerm) ||
// // //         org.admin_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.end_date?.toLowerCase().includes(lowerCaseSearchTerm)
// // //       );
// // //     });
// // //     setFilteredOrgData(filtered);
// // //   }, [debouncedSearchTerm, orgTableData]);

// // //   const handleSearchInputChange = (e) => {
// // //     setSearchTerm(e.target.value);
// // //   };

// // //   const handleRoleToggle = (role) => {
// // //     setSelectedRoles((prev) =>
// // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // //     );
// // //   };

// // //   const handlePageToggle = (page) => {
// // //     setSelectedPages((prev) => {
// // //       const exists = prev.some(
// // //         (p) => p.page_name === page.page_name && p.path === page.path
// // //       );
// // //       return exists
// // //         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// // //         : [...prev, { ...page, role_id: page.role_id || 0, role_name: page.role_name || null }];
// // //     });
// // //   };

// // //   const handleEdit = async (org) => {
// // //     setIsEditing(true);
// // //     setCurrentOrgId(org.id);
// // //     setName(org.Name || "");
// // //     setSubdomain(org.subdomain || "");
// // //     setNoEmployees(org.no_employees || "");
// // //     setCompanyAddress(org.company_address || "");
// // //     setCPanNo(org.c_pan_no || "");
// // //     setAdminEmail(org.admin_email || "");
// // //     setContactEmail(org.contact_email_id || "");
// // //     setContactPhone(org.contact_phone_no || "");
// // //     setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
// // //     setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
// // //     setSelectedRoles([]);
// // //     setSelectedPages([]);
// // //     setErrors({});

// // //     try {
// // //       const url = `${process.env.REACT_APP_BACKEND_URL}/organization-details/${org.id}`;
// // //       const res = await fetch(url, {
// // //         method: "GET",
// // //         headers: {
// // //           "Content-Type": "application/json",
// // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // //           "x-employee-id": employeeId,
// // //         },
// // //       });

// // //       if (!res.ok) {
// // //         throw new Error(`Failed to fetch organization roles and pages: ${res.status}`);
// // //       }

// // //       const data = await res.json();
// // //       setSelectedRoles(data.roles ? data.roles.map((r) => r.role_name) : []);
// // //       setSelectedPages(data.pages ? data.pages.map((p) => ({ ...p, role_id: p.role_id || 0, role_name: p.role_name || null })) : []);
// // //     } catch (err) {
// // //       console.error("Error fetching org roles and pages:", err);
// // //       setMessage(`❌ Failed to load organization roles and pages: ${err.message}`);
// // //     }

// // //     setShowForm(true);
// // //   };

// // //   const handleDelete = async (orgId) => {
// // //     if (!window.confirm("Are you sure you want to delete this organization?")) return;

// // //     try {
// // //       const response = await fetch(
// // //         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
// // //         {
// // //           method: "DELETE",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // //             "x-employee-id": employeeId,
// // //           },
// // //         }
// // //       );

// // //       const data = await response.json();
// // //       if (response.ok) {
// // //         setMessage(data.message || "✅ Organization deleted successfully.");
// // //         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
// // //         setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
// // //       } else {
// // //         setMessage(data.error || "❌ Failed to delete organization.");
// // //       }
// // //     } catch (error) {
// // //       console.error("Delete organization error:", error);
// // //       setMessage(`❌ Server error: ${error.message}`);
// // //     }
// // //   };

// // //   const handleSubmit = async (e) => {
// // //     e.preventDefault();
// // //     setMessage("");

// // //     if (!validateForm()) {
// // //       setMessage("❌ Please fix the errors in the form.");
// // //       return;
// // //     }

// // //     const orgData = {
// // //       Name: name,
// // //       subdomain,
// // //       no_employees: parseInt(noEmployees) || 0,
// // //       company_address: companyAddress,
// // //       c_pan_no: cPanNo,
// // //       admin_email: adminEmail,
// // //       contact_email_id: contactEmail,
// // //       contact_phone_no: contactPhone,
// // //       start_date: startDate,
// // //       end_date: endDate,
// // //       roles: selectedRoles,
// // //       selectedPages: selectedPages.map((p) => ({
// // //         page_name: p.page_name,
// // //         path: p.path,
// // //         icon_name: p.icon_name,
// // //         role_id: p.role_id || 0,
// // //         role_name: p.role_name || null,
// // //       })),
// // //     };

// // //     try {
// // //       const url = isEditing
// // //         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
// // //         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;
// // //       const method = isEditing ? "PUT" : "POST";

// // //       const response = await fetch(url, {
// // //         method,
// // //         headers: {
// // //           "Content-Type": "application/json",
// // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // //           "x-employee-id": employeeId,
// // //         },
// // //         body: JSON.stringify(orgData),
// // //       });

// // //       const data = await response.json();
// // //       if (response.ok) {
// // //         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
// // //         if (isEditing) {
// // //           setOrgTableData((prev) =>
// // //             prev.map((org) =>
// // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // //             )
// // //           );
// // //           setFilteredOrgData((prev) =>
// // //             prev.map((org) =>
// // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // //             )
// // //           );
// // //         } else {
// // //           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // //             headers: {
// // //               "Content-Type": "application/json",
// // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // //               "x-employee-id": employeeId,
// // //             },
// // //           });
// // //           if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // //           const newData = await res.json();
// // //           setOrgTableData(newData);
// // //           setFilteredOrgData(newData);
// // //         }
// // //         setName("");
// // //         setSubdomain("");
// // //         setNoEmployees("");
// // //         setCompanyAddress("");
// // //         setCPanNo("");
// // //         setAdminEmail("");
// // //         setContactEmail("");
// // //         setContactPhone("");
// // //         setStartDate("");
// // //         setEndDate("");
// // //         setSelectedRoles([]);
// // //         setSelectedPages([]);
// // //         setShowForm(false);
// // //         setIsEditing(false);
// // //         setCurrentOrgId(null);
// // //         setErrors({});
// // //       } else {
// // //         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
// // //       }
// // //     } catch (error) {
// // //       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
// // //       setMessage(`❌ Server error: ${error.message}`);
// // //     }
// // //   };

// // //   const handleCloseModal = (e) => {
// // //     if (e.target.className.includes("modal-overlay")) {
// // //       setShowForm(false);
// // //       setIsEditing(false);
// // //       setCurrentOrgId(null);
// // //       setName("");
// // //       setSubdomain("");
// // //       setNoEmployees("");
// // //       setCompanyAddress("");
// // //       setCPanNo("");
// // //       setAdminEmail("");
// // //       setContactEmail("");
// // //       setContactPhone("");
// // //       setStartDate("");
// // //       setEndDate("");
// // //       setSelectedRoles([]);
// // //       setSelectedPages([]);
// // //       setErrors({});
// // //     }
// // //   };

// // //   const formatToIST = (dateString) => {
// // //     try {
// // //       const date = new Date(dateString);
// // //       if (isNaN(date.getTime())) return dateString;
// // //       return date.toLocaleString("en-IN", {
// // //         timeZone: "Asia/Kolkata",
// // //         year: "numeric",
// // //         month: "2-digit",
// // //         day: "2-digit",
// // //       });
// // //     } catch (error) {
// // //       return dateString;
// // //     }
// // //   };

// // //   const handleShowDetails = (org) => {
// // //     setPopupData({
// // //       company_address: org.company_address,
// // //       admin_email: org.admin_email,
// // //       contact_email_id: org.contact_email_id,
// // //       contact_phone_no: org.contact_phone_no,
// // //       start_date: formatToIST(org.start_date),
// // //       end_date: formatToIST(org.end_date),
// // //     });
// // //     setShowDetailsPopup(true);
// // //   };

// // //   const handleCloseDetailsPopup = (e) => {
// // //     if (e.target.className.includes("details-overlay")) {
// // //       setShowDetailsPopup(false);
// // //       setPopupData(null);
// // //     }
// // //   };

// // //   // Group role pages by role_name
// // //   const groupedRolePages = rolePages.reduce((acc, page) => {
// // //     const roleName = page.role_name || "Unassigned";
// // //     if (!acc[roleName]) {
// // //       acc[roleName] = [];
// // //     }
// // //     acc[roleName].push(page);
// // //     return acc;
// // //   }, {});

// // //   return (
// // //     <div className="create-org-wrapper">
// // //       <div className="table-header">
// // //         <div className="search-container">
// // //           <label className="search-label">Search by:</label>
// // //           <input
// // //             type="text"
// // //             value={searchTerm}
// // //             onChange={handleSearchInputChange}
// // //             placeholder="Name, Id, Email, Date"
// // //             className="search-input"
// // //           />
// // //         </div>
// // //         <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // //           + Add Organization
// // //         </button>
// // //       </div>

// // //       {showForm && (
// // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // //           <div className="create-org-container">
// // //             <div className="form-header">
// // //               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
// // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // //                 ✕
// // //               </span>
// // //             </div>

// // //             <form className="org-form" onSubmit={handleSubmit}>
// // //               {/* Section 1: Organization Details */}
// // //               <div className="form-section">
// // //                 <h3>Organization Details</h3>
// // //                 <div className="form-row">
// // //                   <div className="form-field">
// // //                     <label>Organization Name *</label>
// // //                     <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
// // //                   </div>
// // //                   <div className="form-field">
// // //                     <label>Display Name *</label>
// // //                     <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} required />
// // //                   </div>
// // //                   <div className="form-field">
// // //                     <label>Number of Employees *</label>
// // //                     <input type="number" value={noEmployees} onChange={(e) => setNoEmployees(e.target.value)} required />
// // //                   </div>
// // //                 </div>

// // //                 <div className="form-row">
// // //                   <div className="form-field">
// // //                     <label>Company Address *</label>
// // //                     <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} required />
// // //                   </div>
// // //                   <div className="form-field">
// // //                     <label>Company PAN No *</label>
// // //                     <input
// // //                       type="text"
// // //                       value={cPanNo}
// // //                       onChange={(e) => {
// // //                         setCPanNo(e.target.value.toUpperCase());
// // //                         setErrors((prev) => ({ ...prev, cPanNo: validatePanNumber(e.target.value.toUpperCase()) }));
// // //                       }}
// // //                       required
// // //                     />
// // //                     {errors.cPanNo && <span className="error-message">{errors.cPanNo}</span>}
// // //                   </div>
// // //                   <div className="form-field">
// // //                     <label>Admin Email ID *</label>
// // //                     <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
// // //                   </div>
// // //                 </div>

// // //                 <div className="form-row form-row-four">
// // //                   <div className="form-field">
// // //                     <label>Contact Email ID *</label>
// // //                     <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
// // //                   </div>
// // //                   <div className="form-field">
// // //                     <label>Contact Phone No *</label>
// // //                     <input
// // //                       type="tel"
// // //                       value={contactPhone}
// // //                       onChange={(e) => {
// // //                         setContactPhone(e.target.value);
// // //                         setErrors((prev) => ({ ...prev, contactPhone: validateMobileNumber(e.target.value) }));
// // //                       }}
// // //                       required
// // //                     />
// // //                     {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
// // //                   </div>
// // //                   <div className="form-field date-field">
// // //                     <label>Start Date *</label>
// // //                     <div className="date-input-container">
// // //                       <input
// // //                         type="date"
// // //                         value={startDate}
// // //                         onChange={(e) => {
// // //                           setStartDate(e.target.value);
// // //                           setErrors((prev) => ({ ...prev, endDate: validateDates(e.target.value, endDate) }));
// // //                         }}
// // //                         required
// // //                       />
// // //                       <MdOutlineCalendarToday className="date-icon" />
// // //                     </div>
// // //                   </div>
// // //                   <div className="form-field date-field">
// // //                     <label>End Date *</label>
// // //                     <div className="date-input-container">
// // //                       <input
// // //                         type="date"
// // //                         value={endDate}
// // //                         onChange={(e) => {
// // //                           setEndDate(e.target.value);
// // //                           setErrors((prev) => ({ ...prev, endDate: validateDates(startDate, e.target.value) }));
// // //                         }}
// // //                         required
// // //                       />
// // //                       <MdOutlineCalendarToday className="date-icon" />
// // //                     </div>
// // //                     {errors.endDate && <span className="error-message">{errors.endDate}</span>}
// // //                   </div>
// // //                 </div>
// // //               </div>

// // //               {/* Section 2: Roles and Permissions */}
// // //               <div className="form-section">
// // //                 <h3>Roles and Permissions</h3>
// // //                 <div className="roles-checkbox-group">
// // //                   <label>Assign Roles *</label>
// // //                   <div className="checkbox-list">
// // //                     {roles.length > 0 ? (
// // //                       roles.map((role) => (
// // //                         <div key={role} className="checkbox-item">
// // //                           <input
// // //                             type="checkbox"
// // //                             id={`role-${role}`}
// // //                             checked={selectedRoles.includes(role)}
// // //                             onChange={() => handleRoleToggle(role)}
// // //                           />
// // //                           <label htmlFor={`role-${role}`} className="checkbox-label">
// // //                             {role}
// // //                           </label>
// // //                         </div>
// // //                       ))
// // //                     ) : (
// // //                       <p className="no-data">No roles found.</p>
// // //                     )}
// // //                   </div>
// // //                 </div>

// // //                 {Object.keys(groupedRolePages).length > 0 ? (
// // //                   <div className="roles-checkbox-group">
// // //                     <label>Assign Pages to Roles</label>
// // //                     <div className="checkbox-list">
// // //                       {Object.entries(groupedRolePages).map(([roleName, pages]) => (
// // //                         <div key={roleName} className="role-pages-group">
// // //                           <h4>{roleName}</h4>
// // //                           {pages.map((page, index) => (
// // //                             <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// // //                               <input
// // //                                 type="checkbox"
// // //                                 checked={selectedPages.some(
// // //                                   (p) => p.page_name === page.page_name && p.path === page.path
// // //                                 )}
// // //                                 onChange={() => handlePageToggle(page)}
// // //                               />
// // //                               <label className="checkbox-label">
// // //                                 {page.page_name} ({page.path})
// // //                               </label>
// // //                             </div>
// // //                           ))}
// // //                         </div>
// // //                       ))}
// // //                     </div>
// // //                   </div>
// // //                 ) : (
// // //                   <p className="no-data">No pages available. Select roles to view associated pages.</p>
// // //                 )}
// // //               </div>

// // //               <div className="form-actions">
// // //                 <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // //                   Cancel
// // //                 </button>
// // //                 <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
// // //               </div>
// // //             </form>

// // //             {message && <p className="message">{message}</p>}
// // //           </div>
// // //         </div>
// // //       )}

// // //       {showDetailsPopup && popupData && (
// // //         <div className="details-overlay" onClick={handleCloseDetailsPopup}>
// // //           <div className="details-popup">
// // //             <div className="form-header">
// // //               <h2>Details</h2>
// // //               <span className="close-icon" onClick={() => setShowDetailsPopup(false)}>
// // //                 ✕
// // //               </span>
// // //             </div>
// // //             <div className="details-content">
// // //               <p><strong>Address:</strong> {popupData.company_address}</p>
// // //               <p><strong>Admin Email:</strong> {popupData.admin_email}</p>
// // //               <p><strong>Contact Email:</strong> {popupData.contact_email_id}</p>
// // //               <p><strong>Contact Phone:</strong> {popupData.contact_phone_no}</p>
// // //               <p><strong>Start Date:</strong> {popupData.start_date}</p>
// // //               <p><strong>End Date:</strong> {popupData.end_date}</p>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* Mobile view: Card layout */}
// // //       {filteredOrgData.length > 0 && (
// // //         <div className="mobile-cards">
// // //           {filteredOrgData.map((org) => (
// // //             <div className="org-card" key={org.id}>
// // //               <div className="org-card-header">{org.Name}</div>
// // //               <div className="org-card-content"><strong>ID:</strong> {org.id}</div>
// // //               <div className="org-card-content"><strong>Subdomain:</strong> {org.subdomain}</div>
// // //               <div className="org-card-content"><strong>No. Employees:</strong> {org.no_employees}</div>
// // //               <div className="org-card-actions">
// // //                 <button className="view-btn" onClick={() => handleShowDetails(org)} title="View Details">
// // //                   <FaEye />
// // //                 </button>
// // //                 <button className="edit-btn" onClick={() => handleEdit(org)} title="Edit">
// // //                   <MdEdit />
// // //                 </button>
// // //                 <button className="delete-btn" onClick={() => handleDelete(org.id)} title="Delete">
// // //                   <FaTrash />
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           ))}
// // //         </div>
// // //       )}

// // //       {filteredOrgData.length > 0 && (
// // //         <div className="org-table-container">
// // //           <table className="org-table">
// // //             <thead>
// // //               <tr>
// // //                 <th>ID</th>
// // //                 <th>Name</th>
// // //                 <th>Subdomain</th>
// // //                 <th>No. Employees</th>
// // //                 <th>CommonDetails</th>
// // //                 <th>Actions</th>
// // //               </tr>
// // //             </thead>
// // //             <tbody>
// // //               {filteredOrgData.map((org) => (
// // //                 <tr key={org.id}>
// // //                   <td><span className="tooltip" title={org.id}>{org.id}</span></td>
// // //                   <td><span className="tooltip" title={org.Name}>{org.Name}</span></td>
// // //                   <td><span className="tooltip" title={org.subdomain}>{org.subdomain}</span></td>
// // //                   <td><span className="tooltip" title={org.no_employees}>{org.no_employees}</span></td>
// // //                   <td>
// // //                     <button
// // //                       className="view-btn"
// // //                       onClick={() => handleShowDetails(org)}
// // //                       title="View Details"
// // //                     >
// // //                       <FaEye />
// // //                     </button>
// // //                   </td>
// // //                   <td>
// // //                     <button
// // //                       className="edit-btn"
// // //                       onClick={() => handleEdit(org)}
// // //                       title="Edit"
// // //                     >
// // //                       <MdEdit />
// // //                     </button>
// // //                     <button
// // //                       className="delete-btn"
// // //                       onClick={() => handleDelete(org.id)}
// // //                       title="Delete"
// // //                     >
// // //                       <FaTrash />
// // //                     </button>
// // //                   </td>
// // //                 </tr>
// // //               ))}
// // //             </tbody>
// // //           </table>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default CreateOrganization;

// // // import React, { useEffect, useState } from "react";
// // // import { FaEye, FaTrash } from "react-icons/fa";
// // // import { MdOutlineCalendarToday, MdEdit } from "react-icons/md";
// // // import "./CreateOrganization.css";

// // // // Custom debounce hook
// // // const useDebounce = (value, delay) => {
// // //   const [debouncedValue, setDebouncedValue] = useState(value);

// // //   useEffect(() => {
// // //     const handler = setTimeout(() => {
// // //       setDebouncedValue(value);
// // //     }, delay);

// // //     return () => {
// // //       clearTimeout(handler);
// // //     };
// // //   }, [value, delay]);

// // //   return debouncedValue;
// // // };

// // // const CreateOrganization = ({ employeeId = "default-employee-id" }) => {
// // //   const [showForm, setShowForm] = useState(false);
// // //   const [isEditing, setIsEditing] = useState(false);
// // //   const [currentOrgId, setCurrentOrgId] = useState(null);
// // //   const [step, setStep] = useState(1);
// // //   const [name, setName] = useState("");
// // //   const [subdomain, setSubdomain] = useState("");
// // //   const [noEmployees, setNoEmployees] = useState("");
// // //   const [companyAddress, setCompanyAddress] = useState("");
// // //   const [cPanNo, setCPanNo] = useState("");
// // //   const [adminEmail, setAdminEmail] = useState("");
// // //   const [contactEmail, setContactEmail] = useState("");
// // //   const [contactPhone, setContactPhone] = useState("");
// // //   const [startDate, setStartDate] = useState("");
// // //   const [endDate, setEndDate] = useState("");
// // //   const [roles, setRoles] = useState([]);
// // //   const [selectedRoles, setSelectedRoles] = useState([]);
// // //   const [rolePages, setRolePages] = useState([]);
// // //   const [selectedPages, setSelectedPages] = useState([]);
// // //   const [message, setMessage] = useState("");
// // //   const [orgTableData, setOrgTableData] = useState([]);
// // //   const [searchTerm, setSearchTerm] = useState("");
// // //   const [filteredOrgData, setFilteredOrgData] = useState([]);
// // //   const [showDetailsPopup, setShowDetailsPopup] = useState(false);
// // //   const [popupData, setPopupData] = useState(null);
// // //   const [errors, setErrors] = useState({});

// // //   const debouncedSearchTerm = useDebounce(searchTerm, 300);

// // //   // Validation functions
// // //   const validateEmail = (email) => {
// // //     const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// // //     return regex.test(email) ? "" : "Please enter a valid email address.";
// // //   };

// // //   const validateMobileNumber = (phone) => {
// // //     const regex = /^[6-9]\d{9}$/;
// // //     return regex.test(phone) ? "" : "Please enter a valid 10-digit Indian mobile number.";
// // //   };

// // //   const validatePanNumber = (pan) => {
// // //     const regex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
// // //     return regex.test(pan) ? "" : "Please enter a valid PAN number (e.g., ABCDE1234F).";
// // //   };

// // //   const validateDates = (start, end) => {
// // //     if (!start || !end) return "";
// // //     const startDateObj = new Date(start);
// // //     const endDateObj = new Date(end);
// // //     return endDateObj >= startDateObj ? "" : "End date cannot be before start date.";
// // //   };

// // //   // Validate fields based on step
// // //   const validateForm = (currentStep) => {
// // //     const newErrors = {};
// // //     let errorMessages = [];

// // //     if (currentStep === 1) {
// // //       newErrors.name = name ? "" : "Organization Name is required.";
// // //       newErrors.subdomain = subdomain ? "" : "Display Name is required.";
// // //       newErrors.noEmployees = noEmployees ? "" : "Number of Employees is required.";
// // //       newErrors.companyAddress = companyAddress ? "" : "Company Address is required.";
// // //       newErrors.cPanNo = validatePanNumber(cPanNo);
// // //       newErrors.adminEmail = adminEmail ? validateEmail(adminEmail) : "Admin Email ID is required.";
// // //       newErrors.contactEmail = contactEmail ? validateEmail(contactEmail) : "Contact Email ID is required.";
// // //       newErrors.contactPhone = validateMobileNumber(contactPhone);
// // //       newErrors.startDate = startDate ? "" : "Start Date is required.";
// // //       newErrors.endDate = validateDates(startDate, endDate) || (endDate ? "" : "End Date is required.");

// // //       errorMessages = Object.entries(newErrors)
// // //         .filter(([_, error]) => error)
// // //         .map(([key, error]) => {
// // //           const fieldNames = {
// // //             name: "Organization Name",
// // //             subdomain: "Display Name",
// // //             noEmployees: "Number of Employees",
// // //             companyAddress: "Company Address",
// // //             cPanNo: "Company PAN No",
// // //             adminEmail: "Admin Email ID",
// // //             contactEmail: "Contact Email ID",
// // //             contactPhone: "Contact Phone No",
// // //             startDate: "Start Date",
// // //             endDate: "End Date",
// // //           };
// // //           return `${fieldNames[key]}: ${error}`;
// // //         });
// // //     } else if (currentStep === 2) {
// // //       newErrors.selectedRoles = selectedRoles.length > 0 ? "" : "At least one role must be selected.";
// // //       if (newErrors.selectedRoles) {
// // //         errorMessages.push("Roles: At least one role must be selected.");
// // //       }
// // //     }

// // //     setErrors(newErrors);
// // //     setMessage(errorMessages.length > 0 ? `❌ Please fix the following errors:\n${errorMessages.join("\n")}` : "");
// // //     return Object.values(newErrors).every((error) => error === "");
// // //   };

// // //   useEffect(() => {
// // //     const fetchRoles = async () => {
// // //       try {
// // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// // //           method: "GET",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // //             "x-employee-id": employeeId,
// // //           },
// // //         });
// // //         if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
// // //         const data = await res.json();
// // //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// // //         setRoles(uniqueRoles);
// // //       } catch (err) {
// // //         console.error("Role fetch error:", err);
// // //         setMessage("❌ Failed to fetch roles.");
// // //       }
// // //     };

// // //     const fetchOrganizations = async () => {
// // //       try {
// // //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // //             "x-employee-id": employeeId,
// // //           },
// // //         });
// // //         if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // //         const data = await res.json();
// // //         setOrgTableData(data);
// // //         setFilteredOrgData(data);
// // //       } catch (err) {
// // //         console.error("Organization table fetch error:", err);
// // //         setMessage("❌ Failed to fetch organizations.");
// // //       }
// // //     };

// // //     fetchRoles();
// // //     fetchOrganizations();
// // //   }, [employeeId]);

// // //   useEffect(() => {
// // //     const fetchRolePages = async () => {
// // //       if (selectedRoles.length === 0) {
// // //         setRolePages([]);
// // //         return;
// // //       }

// // //       try {
// // //         const rolesQuery = selectedRoles.join(",");
// // //         const res = await fetch(
// // //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// // //           {
// // //             method: "GET",
// // //             headers: {
// // //               "Content-Type": "application/json",
// // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // //               "x-employee-id": employeeId,
// // //             },
// // //           }
// // //         );
// // //         if (!res.ok) throw new Error(`Failed to fetch role pages: ${res.status}`);
// // //         const data = await res.json();
// // //         setRolePages(data);
// // //       } catch (err) {
// // //         console.error("Role pages fetch error:", err);
// // //         setRolePages([]);
// // //         setMessage("❌ Failed to fetch role pages.");
// // //       }
// // //     };

// // //     fetchRolePages();
// // //   }, [selectedRoles, employeeId]);

// // //   useEffect(() => {
// // //     const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
// // //     const filtered = orgTableData.filter((org) => {
// // //       if (!lowerCaseSearchTerm) return true;
// // //       return (
// // //         org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.id.toString().includes(lowerCaseSearchTerm) ||
// // //         org.admin_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
// // //         org.end_date?.toLowerCase().includes(lowerCaseSearchTerm)
// // //       );
// // //     });
// // //     setFilteredOrgData(filtered);
// // //   }, [debouncedSearchTerm, orgTableData]);

// // //   const handleSearchInputChange = (e) => {
// // //     setSearchTerm(e.target.value);
// // //   };

// // //   const handleRoleToggle = (role) => {
// // //     setSelectedRoles((prev) =>
// // //       prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
// // //     );
// // //   };

// // //   const handlePageToggle = (page) => {
// // //     setSelectedPages((prev) => {
// // //       const exists = prev.some(
// // //         (p) => p.page_name === page.page_name && p.path === page.path
// // //       );
// // //       return exists
// // //         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// // //         : [...prev, { ...page, role_id: page.role_id || 0, role_name: page.role_name || null }];
// // //     });
// // //   };

// // //   const handleEdit = async (org) => {
// // //     setIsEditing(true);
// // //     setCurrentOrgId(org.id);
// // //     setName(org.Name || "");
// // //     setSubdomain(org.subdomain || "");
// // //     setNoEmployees(org.no_employees || "");
// // //     setCompanyAddress(org.company_address || "");
// // //     setCPanNo(org.c_pan_no || "");
// // //     setAdminEmail(org.admin_email || "");
// // //     setContactEmail(org.contact_email_id || "");
// // //     setContactPhone(org.contact_phone_no || "");
// // //     setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
// // //     setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
// // //     setSelectedRoles([]);
// // //     setSelectedPages([]);
// // //     setErrors({});
// // //     setStep(1);

// // //     try {
// // //       const url = `${process.env.REACT_APP_BACKEND_URL}/organization-details/${org.id}`;
// // //       const res = await fetch(url, {
// // //         method: "GET",
// // //         headers: {
// // //           "Content-Type": "application/json",
// // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // //           "x-employee-id": employeeId,
// // //         },
// // //       });

// // //       if (!res.ok) {
// // //         throw new Error(`Failed to fetch organization roles and pages: ${res.status}`);
// // //       }

// // //       const data = await res.json();
// // //       setSelectedRoles(data.roles ? data.roles.map((r) => r.role_name) : []);
// // //       setSelectedPages(data.pages ? data.pages.map((p) => ({ ...p, role_id: p.role_id || 0, role_name: p.role_name || null })) : []);
// // //     } catch (err) {
// // //       console.error("Error fetching org roles and pages:", err);
// // //       setMessage(`❌ Failed to load organization roles and pages: ${err.message}`);
// // //     }

// // //     setShowForm(true);
// // //   };

// // //   const handleDelete = async (orgId) => {
// // //     if (!window.confirm("Are you sure you want to delete this organization?")) return;

// // //     try {
// // //       const response = await fetch(
// // //         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
// // //         {
// // //           method: "DELETE",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // //             "x-employee-id": employeeId,
// // //           },
// // //         }
// // //       );

// // //       const data = await response.json();
// // //       if (response.ok) {
// // //         setMessage(data.message || "✅ Organization deleted successfully.");
// // //         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
// // //         setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
// // //       } else {
// // //         setMessage(data.error || "❌ Failed to delete organization.");
// // //       }
// // //     } catch (error) {
// // //       console.error("Delete organization error:", error);
// // //       setMessage(`❌ Server error: ${error.message}`);
// // //     }
// // //   };

// // //   const handleNextStep = (e) => {
// // //     e.preventDefault();
// // //     if (validateForm(1)) {
// // //       setStep(2);
// // //     }
// // //   };

// // //   const handlePrevStep = (e) => {
// // //     e.preventDefault();
// // //     setStep(1);
// // //   };

// // //   const handleSubmit = async (e) => {
// // //     e.preventDefault();
// // //     setMessage("");

// // //     if (!validateForm(1) || !validateForm(2)) {
// // //       return;
// // //     }

// // //     const orgData = {
// // //       Name: name,
// // //       subdomain,
// // //       no_employees: parseInt(noEmployees) || 0,
// // //       company_address: companyAddress,
// // //       c_pan_no: cPanNo,
// // //       admin_email: adminEmail,
// // //       contact_email_id: contactEmail,
// // //       contact_phone_no: contactPhone,
// // //       start_date: startDate,
// // //       end_date: endDate,
// // //       roles: selectedRoles,
// // //       selectedPages: selectedPages.map((p) => ({
// // //         page_name: p.page_name,
// // //         path: p.path,
// // //         icon_name: p.icon_name,
// // //         role_id: p.role_id || 0,
// // //         role_name: p.role_name || null,
// // //       })),
// // //     };

// // //     try {
// // //       const url = isEditing
// // //         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
// // //         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;
// // //       const method = isEditing ? "PUT" : "POST";

// // //       const response = await fetch(url, {
// // //         method,
// // //         headers: {
// // //           "Content-Type": "application/json",
// // //           "x-api-key": process.env.REACT_APP_API_KEY,
// // //           "x-employee-id": employeeId,
// // //         },
// // //         body: JSON.stringify(orgData),
// // //       });

// // //       const data = await response.json();
// // //       if (response.ok) {
// // //         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
// // //         if (isEditing) {
// // //           setOrgTableData((prev) =>
// // //             prev.map((org) =>
// // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // //             )
// // //           );
// // //           setFilteredOrgData((prev) =>
// // //             prev.map((org) =>
// // //               org.id === currentOrgId ? { ...org, ...orgData } : org
// // //             )
// // //           );
// // //         } else {
// // //           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// // //             headers: {
// // //               "Content-Type": "application/json",
// // //               "x-api-key": process.env.REACT_APP_API_KEY,
// // //               "x-employee-id": employeeId,
// // //             },
// // //           });
// // //           if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// // //           const newData = await res.json();
// // //           setOrgTableData(newData);
// // //           setFilteredOrgData(newData);
// // //         }
// // //         setName("");
// // //         setSubdomain("");
// // //         setNoEmployees("");
// // //         setCompanyAddress("");
// // //         setCPanNo("");
// // //         setAdminEmail("");
// // //         setContactEmail("");
// // //         setContactPhone("");
// // //         setStartDate("");
// // //         setEndDate("");
// // //         setSelectedRoles([]);
// // //         setSelectedPages([]);
// // //         setShowForm(false);
// // //         setIsEditing(false);
// // //         setCurrentOrgId(null);
// // //         setStep(1);
// // //         setErrors({});
// // //       } else {
// // //         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
// // //       }
// // //     } catch (error) {
// // //       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
// // //       setMessage(`❌ Server error: ${error.message}`);
// // //     }
// // //   };

// // //   const handleCloseModal = (e) => {
// // //     if (e.target.className.includes("modal-overlay")) {
// // //       setShowForm(false);
// // //       setIsEditing(false);
// // //       setCurrentOrgId(null);
// // //       setName("");
// // //       setSubdomain("");
// // //       setNoEmployees("");
// // //       setCompanyAddress("");
// // //       setCPanNo("");
// // //       setAdminEmail("");
// // //       setContactEmail("");
// // //       setContactPhone("");
// // //       setStartDate("");
// // //       setEndDate("");
// // //       setSelectedRoles([]);
// // //       setSelectedPages([]);
// // //       setStep(1);
// // //       setErrors({});
// // //       setMessage("");
// // //     }
// // //   };

// // //   const formatToIST = (dateString) => {
// // //     try {
// // //       const date = new Date(dateString);
// // //       if (isNaN(date.getTime())) return dateString;
// // //       return date.toLocaleString("en-IN", {
// // //         timeZone: "Asia/Kolkata",
// // //         year: "numeric",
// // //         month: "2-digit",
// // //         day: "2-digit",
// // //       });
// // //     } catch (error) {
// // //       return dateString;
// // //     }
// // //   };

// // //   const handleShowDetails = (org) => {
// // //     setPopupData({
// // //       company_address: org.company_address,
// // //       admin_email: org.admin_email,
// // //       contact_email_id: org.contact_email_id,
// // //       contact_phone_no: org.contact_phone_no,
// // //       start_date: formatToIST(org.start_date),
// // //       end_date: formatToIST(org.end_date),
// // //     });
// // //     setShowDetailsPopup(true);
// // //   };

// // //   const handleCloseDetailsPopup = (e) => {
// // //     if (e.target.className.includes("details-overlay")) {
// // //       setShowDetailsPopup(false);
// // //       setPopupData(null);
// // //     }
// // //   };

// // //   const groupedRolePages = rolePages.reduce((acc, page) => {
// // //     const roleName = page.role_name || "Unassigned";
// // //     if (!acc[roleName]) {
// // //       acc[roleName] = [];
// // //     }
// // //     acc[roleName].push(page);
// // //     return acc;
// // //   }, {});

// // //   return (
// // //     <div className="create-org-wrapper">
// // //       <div className="table-header">
// // //         <div className="search-container">
// // //           <label className="search-label">Search by:</label>
// // //           <input
// // //             type="text"
// // //             value={searchTerm}
// // //             onChange={handleSearchInputChange}
// // //             placeholder="Name, Id, Email, Date"
// // //             className="search-input"
// // //           />
// // //         </div>
// // //         <button className="open-form-btn" onClick={() => setShowForm(true)}>
// // //           + Add Organization
// // //         </button>
// // //       </div>

// // //       {showForm && (
// // //         <div className="modal-overlay" onClick={handleCloseModal}>
// // //           <div className="create-org-container">
// // //             <div className="form-header">
// // //               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
// // //               <span className="close-icon" onClick={() => setShowForm(false)}>
// // //                 ✕
// // //               </span>
// // //             </div>

// // //             <form className="org-form" onSubmit={handleSubmit}>
// // //               {step === 1 && (
// // //                 <div className="form-section">
// // //                   <h3>Organization Details</h3>
// // //                   <div className="form-row">
// // //                     <div className="form-field">
// // //                       <label>Organization Name *</label>
// // //                       <input
// // //                         type="text"
// // //                         value={name}
// // //                         onChange={(e) => setName(e.target.value)}
// // //                         required
// // //                       />
// // //                       {errors.name && <span className="error-message">{errors.name}</span>}
// // //                     </div>
// // //                     <div className="form-field">
// // //                       <label>Display Name *</label>
// // //                       <input
// // //                         type="text"
// // //                         value={subdomain}
// // //                         onChange={(e) => setSubdomain(e.target.value)}
// // //                         required
// // //                       />
// // //                       {errors.subdomain && <span className="error-message">{errors.subdomain}</span>}
// // //                     </div>
// // //                     <div className="form-field">
// // //                       <label>Number of Employees *</label>
// // //                       <input
// // //                         type="number"
// // //                         value={noEmployees}
// // //                         onChange={(e) => setNoEmployees(e.target.value)}
// // //                         required
// // //                       />
// // //                       {errors.noEmployees && <span className="error-message">{errors.noEmployees}</span>}
// // //                     </div>
// // //                   </div>
// // //                   <div className="form-row">
// // //                     <div className="form-field">
// // //                       <label>Company Address *</label>
// // //                       <input
// // //                         type="text"
// // //                         value={companyAddress}
// // //                         onChange={(e) => setCompanyAddress(e.target.value)}
// // //                         required
// // //                       />
// // //                       {errors.companyAddress && <span className="error-message">{errors.companyAddress}</span>}
// // //                     </div>
// // //                     <div className="form-field">
// // //                       <label>Company PAN No *</label>
// // //                       <input
// // //                         type="text"
// // //                         value={cPanNo}
// // //                         onChange={(e) => {
// // //                           setCPanNo(e.target.value.toUpperCase());
// // //                           setErrors((prev) => ({ ...prev, cPanNo: validatePanNumber(e.target.value.toUpperCase()) }));
// // //                         }}
// // //                         required
// // //                       />
// // //                       {errors.cPanNo && <span className="error-message">{errors.cPanNo}</span>}
// // //                     </div>
// // //                     <div className="form-field">
// // //                       <label>Admin Email ID *</label>
// // //                       <input
// // //                         type="email"
// // //                         value={adminEmail}
// // //                         onChange={(e) => {
// // //                           setAdminEmail(e.target.value);
// // //                           setErrors((prev) => ({ ...prev, adminEmail: validateEmail(e.target.value) }));
// // //                         }}
// // //                         required
// // //                       />
// // //                       {errors.adminEmail && <span className="error-message">{errors.adminEmail}</span>}
// // //                     </div>
// // //                   </div>
// // //                   <div className="form-row form-row-four">
// // //                     <div className="form-field">
// // //                       <label>Contact Email ID *</label>
// // //                       <input
// // //                         type="email"
// // //                         value={contactEmail}
// // //                         onChange={(e) => {
// // //                           setContactEmail(e.target.value);
// // //                           setErrors((prev) => ({ ...prev, contactEmail: validateEmail(e.target.value) }));
// // //                         }}
// // //                         required
// // //                       />
// // //                       {errors.contactEmail && <span className="error-message">{errors.contactEmail}</span>}
// // //                     </div>
// // //                     <div className="form-field">
// // //                       <label>Contact Phone No *</label>
// // //                       <input
// // //                         type="tel"
// // //                         value={contactPhone}
// // //                         onChange={(e) => {
// // //                           setContactPhone(e.target.value);
// // //                           setErrors((prev) => ({ ...prev, contactPhone: validateMobileNumber(e.target.value) }));
// // //                         }}
// // //                         required
// // //                       />
// // //                       {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
// // //                     </div>
// // //                     <div className="form-field date-field">
// // //                       <label>Start Date *</label>
// // //                       <div className="date-input-container">
// // //                         <input
// // //                           type="date"
// // //                           value={startDate}
// // //                           onChange={(e) => {
// // //                             setStartDate(e.target.value);
// // //                             setErrors((prev) => ({ ...prev, endDate: validateDates(e.target.value, endDate) }));
// // //                           }}
// // //                           required
// // //                         />
// // //                         <MdOutlineCalendarToday className="date-icon" />
// // //                       </div>
// // //                       {errors.startDate && <span className="error-message">{errors.startDate}</span>}
// // //                     </div>
// // //                     <div className="form-field date-field">
// // //                       <label>End Date *</label>
// // //                       <div className="date-input-container">
// // //                         <input
// // //                           type="date"
// // //                           value={endDate}
// // //                           onChange={(e) => {
// // //                             setEndDate(e.target.value);
// // //                             setErrors((prev) => ({ ...prev, endDate: validateDates(startDate, e.target.value) }));
// // //                           }}
// // //                           required
// // //                         />
// // //                         <MdOutlineCalendarToday className="date-icon" />
// // //                       </div>
// // //                       {errors.endDate && <span className="error-message">{errors.endDate}</span>}
// // //                     </div>
// // //                   </div>
// // //                   <div className="form-actions">
// // //                     <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// // //                       Cancel
// // //                     </button>
// // //                     <button type="button" className="next-btn" onClick={handleNextStep}>
// // //                       Next
// // //                     </button>
// // //                   </div>
// // //                 </div>
// // //               )}

// // //               {step === 2 && (
// // //                 <div className="form-section">
// // //                   <h3>Roles and Permissions</h3>
// // //                   <div className="roles-checkbox-group">
// // //                     <label>Assign Roles *</label>
// // //                     <div className="checkbox-list">
// // //                       {roles.length > 0 ? (
// // //                         roles.map((role) => (
// // //                           <div key={role} className="checkbox-item">
// // //                             <input
// // //                               type="checkbox"
// // //                               id={`role-${role}`}
// // //                               checked={selectedRoles.includes(role)}
// // //                               onChange={() => handleRoleToggle(role)}
// // //                             />
// // //                             <label htmlFor={`role-${role}`} className="checkbox-label">
// // //                               {role}
// // //                             </label>
// // //                           </div>
// // //                         ))
// // //                       ) : (
// // //                         <p className="no-data">No roles found.</p>
// // //                       )}
// // //                     </div>
// // //                     {errors.selectedRoles && <span className="error-message">{errors.selectedRoles}</span>}
// // //                   </div>

// // //                   {Object.keys(groupedRolePages).length > 0 ? (
// // //                     <div className="roles-checkbox-group">
// // //                       <label>Assign Pages to Roles</label>
// // //                       <div className="checkbox-list">
// // //                         {Object.entries(groupedRolePages).map(([roleName, pages]) => (
// // //                           <div key={roleName} className="role-pages-group">
// // //                             <h4>{roleName}</h4>
// // //                             {pages.map((page, index) => (
// // //                               <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// // //                                 <input
// // //                                   type="checkbox"
// // //                                   checked={selectedPages.some(
// // //                                     (p) => p.page_name === page.page_name && p.path === page.path
// // //                                   )}
// // //                                   onChange={() => handlePageToggle(page)}
// // //                                 />
// // //                                 <label className="checkbox-label">
// // //                                   {page.page_name} ({page.path})
// // //                                 </label>
// // //                               </div>
// // //                             ))}
// // //                           </div>
// // //                         ))}
// // //                       </div>
// // //                     </div>
// // //                   ) : (
// // //                     <p className="no-data">No pages available. Select roles to view associated pages.</p>
// // //                   )}
// // //                   <div className="form-actions">
// // //                     <button type="button" className="prev-btn" onClick={handlePrevStep}>
// // //                       Previous
// // //                     </button>
// // //                     <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
// // //                   </div>
// // //                 </div>
// // //               )}

// // //               {message && <p className="message">{message}</p>}
// // //             </form>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {showDetailsPopup && popupData && (
// // //         <div className="details-overlay" onClick={handleCloseDetailsPopup}>
// // //           <div className="details-popup">
// // //             <div className="form-header">
// // //               <h2>Details</h2>
// // //               <span className="close-icon" onClick={() => setShowDetailsPopup(false)}>
// // //                 ✕
// // //               </span>
// // //             </div>
// // //             <div className="details-content">
// // //               <p><strong>Address:</strong> {popupData.company_address}</p>
// // //               <p><strong>Admin Email:</strong> {popupData.admin_email}</p>
// // //               <p><strong>Contact Email:</strong> {popupData.contact_email_id}</p>
// // //               <p><strong>Contact Phone:</strong> {popupData.contact_phone_no}</p>
// // //               <p><strong>Start Date:</strong> {popupData.start_date}</p>
// // //               <p><strong>End Date:</strong> {popupData.end_date}</p>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {filteredOrgData.length > 0 && (
// // //         <div className="mobile-cards">
// // //           {filteredOrgData.map((org) => (
// // //             <div className="org-card" key={org.id}>
// // //               <div className="org-card-header">{org.Name}</div>
// // //               <div className="org-card-content"><strong>ID:</strong> {org.id}</div>
// // //               <div className="org-card-content"><strong>Subdomain:</strong> {org.subdomain}</div>
// // //               <div className="org-card-content"><strong>No. Employees:</strong> {org.no_employees}</div>
// // //               <div className="org-card-actions">
// // //                 <button className="view-btn" onClick={() => handleShowDetails(org)} title="View Details">
// // //                   <FaEye />
// // //                 </button>
// // //                 <button className="edit-btn" onClick={() => handleEdit(org)} title="Edit">
// // //                   <MdEdit />
// // //                 </button>
// // //                 <button className="delete-btn" onClick={() => handleDelete(org.id)} title="Delete">
// // //                   <FaTrash />
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           ))}
// // //         </div>
// // //       )}

// // //       {filteredOrgData.length > 0 && (
// // //         <div className="org-table-container">
// // //           <table className="org-table">
// // //             <thead>
// // //               <tr>
// // //                 <th>ID</th>
// // //                 <th>Name</th>
// // //                 <th>Subdomain</th>
// // //                 <th>No. Employees</th>
// // //                 <th>CommonDetails</th>
// // //                 <th>Actions</th>
// // //               </tr>
// // //             </thead>
// // //             <tbody>
// // //               {filteredOrgData.map((org) => (
// // //                 <tr key={org.id}>
// // //                   <td><span className="tooltip" title={org.id}>{org.id}</span></td>
// // //                   <td><span className="tooltip" title={org.Name}>{org.Name}</span></td>
// // //                   <td><span className="tooltip" title={org.subdomain}>{org.subdomain}</span></td>
// // //                   <td><span className="tooltip" title={org.no_employees}>{org.no_employees}</span></td>
// // //                   <td>
// // //                     <button
// // //                       className="view-btn"
// // //                       onClick={() => handleShowDetails(org)}
// // //                       title="View Details"
// // //                     >
// // //                       <FaEye />
// // //                     </button>
// // //                   </td>
// // //                   <td>
// // //                     <button
// // //                       className="edit-btn"
// // //                       onClick={() => handleEdit(org)}
// // //                       title="Edit"
// // //                     >
// // //                       <MdEdit />
// // //                     </button>
// // //                     <button
// // //                       className="delete-btn"
// // //                       onClick={() => handleDelete(org.id)}
// // //                       title="Delete"
// // //                     >
// // //                       <FaTrash />
// // //                     </button>
// // //                   </td>
// // //                 </tr>
// // //               ))}
// // //             </tbody>
// // //           </table>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default CreateOrganization;

// // import React, { useEffect, useState } from "react";
// // import { FaEye, FaTrash } from "react-icons/fa";
// // import { MdOutlineCalendarToday, MdEdit } from "react-icons/md";
// // import "./CreateOrganization.css";

// // // Custom debounce hook
// // const useDebounce = (value, delay) => {
// //   const [debouncedValue, setDebouncedValue] = useState(value);

// //   useEffect(() => {
// //     const handler = setTimeout(() => {
// //       setDebouncedValue(value);
// //     }, delay);

// //     return () => {
// //       clearTimeout(handler);
// //     };
// //   }, [value, delay]);

// //   return debouncedValue;
// // };

// // const CreateOrganization = ({ employeeId = "default-employee-id" }) => {
// //   const [showForm, setShowForm] = useState(false);
// //   const [isEditing, setIsEditing] = useState(false);
// //   const [currentOrgId, setCurrentOrgId] = useState(null);
// //   const [step, setStep] = useState(1);
// //   const [name, setName] = useState("");
// //   const [subdomain, setSubdomain] = useState("");
// //   const [noEmployees, setNoEmployees] = useState("");
// //   const [companyAddress, setCompanyAddress] = useState("");
// //   const [cPanNo, setCPanNo] = useState("");
// //   const [adminEmail, setAdminEmail] = useState("");
// //   const [contactEmail, setContactEmail] = useState("");
// //   const [contactPhone, setContactPhone] = useState("");
// //   const [startDate, setStartDate] = useState("");
// //   const [endDate, setEndDate] = useState("");
// //   const [roles, setRoles] = useState([]);
// //   const [selectedRoles, setSelectedRoles] = useState([]);
// //   const [rolePages, setRolePages] = useState([]);
// //   const [selectedPages, setSelectedPages] = useState([]);
// //   const [message, setMessage] = useState("");
// //   const [orgTableData, setOrgTableData] = useState([]);
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filteredOrgData, setFilteredOrgData] = useState([]);
// //   const [showDetailsPopup, setShowDetailsPopup] = useState(false);
// //   const [popupData, setPopupData] = useState(null);
// //   const [errors, setErrors] = useState({});
// //   const [shouldValidate, setShouldValidate] = useState(false);

// //   const debouncedSearchTerm = useDebounce(searchTerm, 300);

// //   // Validation functions
// //   const validateEmail = (email) => {
// //     const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// //     return email ? (regex.test(email) ? "" : "Please enter a valid email address.") : "";
// //   };

// //   const validateMobileNumber = (phone) => {
// //     const regex = /^[6-9]\d{9}$/;
// //     return phone ? (regex.test(phone) ? "" : "Please enter a valid 10-digit Indian mobile number.") : "";
// //   };

// //   const validatePanNumber = (pan) => {
// //     const regex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
// //     return pan ? (regex.test(pan) ? "" : "Please enter a valid PAN number (e.g., ABCDE1234F).") : "";
// //   };

// //   const validateDates = (start, end) => {
// //     if (!start || !end) return "";
// //     const startDateObj = new Date(start);
// //     const endDateObj = new Date(end);
// //     return endDateObj >= startDateObj ? "" : "End date cannot be before start date.";
// //   };

// //   // Validate fields based on step
// //   const validateForm = (currentStep) => {
// //     const newErrors = {};
// //     let errorMessages = [];

// //     if (currentStep === 1) {
// //       newErrors.name = name ? "" : "Organization Name is required.";
// //       newErrors.subdomain = subdomain ? "" : "Display Name is required.";
// //       newErrors.noEmployees = noEmployees ? "" : "Number of Employees is required.";
// //       newErrors.companyAddress = companyAddress ? "" : "Company Address is required.";
// //       newErrors.cPanNo = validatePanNumber(cPanNo);
// //       newErrors.adminEmail = validateEmail(adminEmail) || (adminEmail ? "" : "Admin Email ID is required.");
// //       newErrors.contactEmail = validateEmail(contactEmail) || (contactEmail ? "" : "Contact Email ID is required.");
// //       newErrors.contactPhone = validateMobileNumber(contactPhone) || (contactPhone ? "" : "Contact Phone No is required.");
// //       newErrors.startDate = startDate ? "" : "Start Date is required.";
// //       newErrors.endDate = validateDates(startDate, endDate) || (endDate ? "" : "End Date is required.");

// //       errorMessages = Object.entries(newErrors)
// //         .filter(([_, error]) => error)
// //         .map(([key, error]) => {
// //           const fieldNames = {
// //             name: "Organization Name",
// //             subdomain: "Display Name",
// //             noEmployees: "Number of Employees",
// //             companyAddress: "Company Address",
// //             cPanNo: "Company PAN No",
// //             adminEmail: "Admin Email ID",
// //             contactEmail: "Contact Email ID",
// //             contactPhone: "Contact Phone No",
// //             startDate: "Start Date",
// //             endDate: "End Date",
// //           };
// //           return `${fieldNames[key]}: ${error}`;
// //         });
// //     } else if (currentStep === 2) {
// //       newErrors.selectedRoles = selectedRoles.length > 0 ? "" : "At least one role must be selected.";
// //       if (newErrors.selectedRoles) {
// //         errorMessages.push("Roles: At least one role must be selected.");
// //       }
// //     }

// //     setErrors(newErrors);
// //     setMessage(errorMessages.length > 0 ? `❌ Please fix the following errors:\n${errorMessages.join("\n")}` : "");
// //     return Object.values(newErrors).every((error) => error === "");
// //   };

// //   // Real-time validation for individual fields
// //   const updateFieldError = (field, value) => {
// //     let error = "";
// //     switch (field) {
// //       case "name":
// //         error = value ? "" : "Organization Name is required.";
// //         break;
// //       case "subdomain":
// //         error = value ? "" : "Display Name is required.";
// //         break;
// //       case "noEmployees":
// //         error = value ? "" : "Number of Employees is required.";
// //         break;
// //       case "companyAddress":
// //         error = value ? "" : "Company Address is required.";
// //         break;
// //       case "cPanNo":
// //         error = validatePanNumber(value);
// //         break;
// //       case "adminEmail":
// //         error = validateEmail(value);
// //         break;
// //       case "contactEmail":
// //         error = validateEmail(value);
// //         break;
// //       case "contactPhone":
// //         error = validateMobileNumber(value);
// //         break;
// //       case "startDate":
// //         error = value ? "" : "Start Date is required.";
// //         break;
// //       case "endDate":
// //         error = validateDates(startDate, value) || (value ? "" : "End Date is required.");
// //         break;
// //       case "selectedRoles":
// //         error = value.length > 0 ? "" : "At least one role must be selected.";
// //         break;
// //       default:
// //         break;
// //     }
// //     setErrors((prev) => ({ ...prev, [field]: error }));
// //   };

// //   // Reset form when opening for creation
// //   useEffect(() => {
// //     if (showForm && !isEditing) {
// //       setStep(1);
// //       setName("");
// //       setSubdomain("");
// //       setNoEmployees("");
// //       setCompanyAddress("");
// //       setCPanNo("");
// //       setAdminEmail("");
// //       setContactEmail("");
// //       setContactPhone("");
// //       setStartDate("");
// //       setEndDate("");
// //       setSelectedRoles([]);
// //       setSelectedPages([]);
// //       setErrors({});
// //       setMessage("");
// //       setCurrentOrgId(null);
// //       setShouldValidate(false);
// //     }
// //   }, [showForm, isEditing]);

// //   useEffect(() => {
// //     const fetchRoles = async () => {
// //       try {
// //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
// //           method: "GET",
// //           headers: {
// //             "Content-Type": "application/json",
// //             "x-api-key": process.env.REACT_APP_API_KEY,
// //             "x-employee-id": employeeId,
// //           },
// //         });
// //         if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
// //         const data = await res.json();
// //         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
// //         setRoles(uniqueRoles);
// //       } catch (err) {
// //         console.error("Role fetch error:", err);
// //         setMessage("❌ Failed to fetch roles.");
// //       }
// //     };

// //     const fetchOrganizations = async () => {
// //       try {
// //         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// //           headers: {
// //             "Content-Type": "application/json",
// //             "x-api-key": process.env.REACT_APP_API_KEY,
// //             "x-employee-id": employeeId,
// //           },
// //         });
// //         if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// //         const data = await res.json();
// //         setOrgTableData(data);
// //         setFilteredOrgData(data);
// //       } catch (err) {
// //         console.error("Organization table fetch error:", err);
// //         setMessage("❌ Failed to fetch organizations.");
// //       }
// //     };

// //     fetchRoles();
// //     fetchOrganizations();
// //   }, [employeeId]);

// //   useEffect(() => {
// //     const fetchRolePages = async () => {
// //       if (selectedRoles.length === 0) {
// //         setRolePages([]);
// //         return;
// //       }

// //       try {
// //         const rolesQuery = selectedRoles.join(",");
// //         const res = await fetch(
// //           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
// //           {
// //             method: "GET",
// //             headers: {
// //               "Content-Type": "application/json",
// //               "x-api-key": process.env.REACT_APP_API_KEY,
// //               "x-employee-id": employeeId,
// //             },
// //           }
// //         );
// //         if (!res.ok) throw new Error(`Failed to fetch role pages: ${res.status}`);
// //         const data = await res.json();
// //         setRolePages(data);
// //       } catch (err) {
// //         console.error("Role pages fetch error:", err);
// //         setRolePages([]);
// //         setMessage("❌ Failed to fetch role pages.");
// //       }
// //     };

// //     fetchRolePages();
// //   }, [selectedRoles, employeeId]);

// //   useEffect(() => {
// //     const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
// //     const filtered = orgTableData.filter((org) => {
// //       if (!lowerCaseSearchTerm) return true;
// //       return (
// //         org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
// //         org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm) ||
// //         org.id.toString().includes(lowerCaseSearchTerm) ||
// //         org.admin_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
// //         org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
// //         org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
// //         org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
// //         org.end_date?.toLowerCase().includes(lowerCaseSearchTerm)
// //       );
// //     });
// //     setFilteredOrgData(filtered);
// //   }, [debouncedSearchTerm, orgTableData]);

// //   const handleSearchInputChange = (e) => {
// //     setSearchTerm(e.target.value);
// //   };

// //   const handleRoleToggle = (role) => {
// //     setSelectedRoles((prev) => {
// //       const newRoles = prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role];
// //       if (step === 2 && shouldValidate) {
// //         updateFieldError("selectedRoles", newRoles);
// //       }
// //       return newRoles;
// //     });
// //   };

// //   const handlePageToggle = (page) => {
// //     setSelectedPages((prev) => {
// //       const exists = prev.some(
// //         (p) => p.page_name === page.page_name && p.path === page.path
// //       );
// //       return exists
// //         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
// //         : [...prev, { ...page, role_id: page.role_id || 0, role_name: page.role_name || null }];
// //     });
// //   };

// //   const handleEdit = async (org) => {
// //     setIsEditing(true);
// //     setCurrentOrgId(org.id);
// //     setName(org.Name || "");
// //     setSubdomain(org.subdomain || "");
// //     setNoEmployees(org.no_employees || "");
// //     setCompanyAddress(org.company_address || "");
// //     setCPanNo(org.c_pan_no || "");
// //     setAdminEmail(org.admin_email || "");
// //     setContactEmail(org.contact_email_id || "");
// //     setContactPhone(org.contact_phone_no || "");
// //     setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
// //     setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
// //     setSelectedRoles([]);
// //     setSelectedPages([]);
// //     setErrors({});
// //     setMessage("");
// //     setStep(1);
// //     setShouldValidate(true);

// //     try {
// //       const url = `${process.env.REACT_APP_BACKEND_URL}/organization-details/${org.id}`;
// //       const res = await fetch(url, {
// //         method: "GET",
// //         headers: {
// //           "Content-Type": "application/json",
// //           "x-api-key": process.env.REACT_APP_API_KEY,
// //           "x-employee-id": employeeId,
// //         },
// //       });

// //       if (!res.ok) {
// //         throw new Error(`Failed to fetch organization roles and pages: ${res.status}`);
// //       }

// //       const data = await res.json();
// //       setSelectedRoles(data.roles ? data.roles.map((r) => r.role_name) : []);
// //       setSelectedPages(data.pages ? data.pages.map((p) => ({ ...p, role_id: p.role_id || 0, role_name: p.role_name || null })) : []);

// //       // Validate pre-filled fields in edit mode
// //       setErrors({
// //         name: name ? "" : "Organization Name is required.",
// //         subdomain: subdomain ? "" : "Display Name is required.",
// //         noEmployees: noEmployees ? "" : "Number of Employees is required.",
// //         companyAddress: companyAddress ? "" : "Company Address is required.",
// //         cPanNo: validatePanNumber(cPanNo),
// //         adminEmail: validateEmail(adminEmail) || (adminEmail ? "" : "Admin Email ID is required."),
// //         contactEmail: validateEmail(contactEmail) || (contactEmail ? "" : "Contact Email ID is required."),
// //         contactPhone: validateMobileNumber(contactPhone) || (contactPhone ? "" : "Contact Phone No is required."),
// //         startDate: startDate ? "" : "Start Date is required.",
// //         endDate: validateDates(startDate, endDate) || (endDate ? "" : "End Date is required."),
// //       });
// //     } catch (err) {
// //       console.error("Error fetching org roles and pages:", err);
// //       setMessage(`❌ Failed to load organization roles and pages: ${err.message}`);
// //     }

// //     setShowForm(true);
// //   };

// //   const handleDelete = async (orgId) => {
// //     if (!window.confirm("Are you sure you want to delete this organization?")) return;

// //     try {
// //       const response = await fetch(
// //         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
// //         {
// //           method: "DELETE",
// //           headers: {
// //             "Content-Type": "application/json",
// //             "x-api-key": process.env.REACT_APP_API_KEY,
// //             "x-employee-id": employeeId,
// //           },
// //         }
// //       );

// //       const data = await response.json();
// //       if (response.ok) {
// //         setMessage(data.message || "✅ Organization deleted successfully.");
// //         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
// //         setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
// //       } else {
// //         setMessage(data.error || "❌ Failed to delete organization.");
// //       }
// //     } catch (error) {
// //       console.error("Delete organization error:", error);
// //       setMessage(`❌ Server error: ${error.message}`);
// //     }
// //   };

// //   const handleOpenForm = () => {
// //     setShowForm(true);
// //     setIsEditing(false);
// //     setCurrentOrgId(null);
// //     setStep(1);
// //     setName("");
// //     setSubdomain("");
// //     setNoEmployees("");
// //     setCompanyAddress("");
// //     setCPanNo("");
// //     setAdminEmail("");
// //     setContactEmail("");
// //     setContactPhone("");
// //     setStartDate("");
// //     setEndDate("");
// //     setSelectedRoles([]);
// //     setSelectedPages([]);
// //     setErrors({});
// //     setMessage("");
// //     setShouldValidate(false);
// //   };

// //   const handleNextStep = (e) => {
// //     e.preventDefault();
// //     setShouldValidate(true);
// //     if (validateForm(1)) {
// //       setStep(2);
// //     }
// //   };

// //   const handlePrevStep = (e) => {
// //     e.preventDefault();
// //     setStep(1);
// //     setShouldValidate(true);
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setMessage("");
// //     setShouldValidate(true);

// //     if (!validateForm(1) || !validateForm(2)) {
// //       return;
// //     }

// //     const orgData = {
// //       Name: name,
// //       subdomain,
// //       no_employees: parseInt(noEmployees) || 0,
// //       company_address: companyAddress,
// //       c_pan_no: cPanNo,
// //       admin_email: adminEmail,
// //       contact_email_id: contactEmail,
// //       contact_phone_no: contactPhone,
// //       start_date: startDate,
// //       end_date: endDate,
// //       roles: selectedRoles,
// //       selectedPages: selectedPages.map((p) => ({
// //         page_name: p.page_name,
// //         path: p.path,
// //         icon_name: p.icon_name,
// //         role_id: p.role_id || 0,
// //         role_name: p.role_name || null,
// //       })),
// //     };

// //     try {
// //       const url = isEditing
// //         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
// //         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;
// //       const method = isEditing ? "PUT" : "POST";

// //       const response = await fetch(url, {
// //         method,
// //         headers: {
// //           "Content-Type": "application/json",
// //           "x-api-key": process.env.REACT_APP_API_KEY,
// //           "x-employee-id": employeeId,
// //         },
// //         body: JSON.stringify(orgData),
// //       });

// //       const data = await response.json();
// //       if (response.ok) {
// //         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
// //         if (isEditing) {
// //           setOrgTableData((prev) =>
// //             prev.map((org) =>
// //               org.id === currentOrgId ? { ...org, ...orgData } : org
// //             )
// //           );
// //           setFilteredOrgData((prev) =>
// //             prev.map((org) =>
// //               org.id === currentOrgId ? { ...org, ...orgData } : org
// //             )
// //           );
// //         } else {
// //           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
// //             headers: {
// //               "Content-Type": "application/json",
// //               "x-api-key": process.env.REACT_APP_API_KEY,
// //               "x-employee-id": employeeId,
// //             },
// //           });
// //           if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
// //           const newData = await res.json();
// //           setOrgTableData(newData);
// //           setFilteredOrgData(newData);
// //         }
// //         setShowForm(false);
// //         setIsEditing(false);
// //         setCurrentOrgId(null);
// //         setStep(1);
// //         setName("");
// //         setSubdomain("");
// //         setNoEmployees("");
// //         setCompanyAddress("");
// //         setCPanNo("");
// //         setAdminEmail("");
// //         setContactEmail("");
// //         setContactPhone("");
// //         setStartDate("");
// //         setEndDate("");
// //         setSelectedRoles([]);
// //         setSelectedPages([]);
// //         setErrors({});
// //         setMessage("");
// //         setShouldValidate(false);
// //       } else {
// //         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
// //       }
// //     } catch (error) {
// //       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
// //       setMessage(`❌ Server error: ${error.message}`);
// //     }
// //   };

// //   const handleCloseModal = (e) => {
// //     if (e.target.className.includes("modal-overlay")) {
// //       setShowForm(false);
// //       setIsEditing(false);
// //       setCurrentOrgId(null);
// //       setStep(1);
// //       setName("");
// //       setSubdomain("");
// //       setNoEmployees("");
// //       setCompanyAddress("");
// //       setCPanNo("");
// //       setAdminEmail("");
// //       setContactEmail("");
// //       setContactPhone("");
// //       setStartDate("");
// //       setEndDate("");
// //       setSelectedRoles([]);
// //       setSelectedPages([]);
// //       setErrors({});
// //       setMessage("");
// //       setShouldValidate(false);
// //     }
// //   };

// //   const formatToIST = (dateString) => {
// //     try {
// //       const date = new Date(dateString);
// //       if (isNaN(date.getTime())) return dateString;
// //       return date.toLocaleString("en-IN", {
// //         timeZone: "Asia/Kolkata",
// //         year: "numeric",
// //         month: "2-digit",
// //         day: "2-digit",
// //       });
// //     } catch (error) {
// //       return dateString;
// //     }
// //   };

// //   const handleShowDetails = (org) => {
// //     setPopupData({
// //       company_address: org.company_address,
// //       admin_email: org.admin_email,
// //       contact_email_id: org.contact_email_id,
// //       contact_phone_no: org.contact_phone_no,
// //       start_date: formatToIST(org.start_date),
// //       end_date: formatToIST(org.end_date),
// //     });
// //     setShowDetailsPopup(true);
// //   };

// //   const handleCloseDetailsPopup = (e) => {
// //     if (e.target.className.includes("details-overlay")) {
// //       setShowDetailsPopup(false);
// //       setPopupData(null);
// //     }
// //   };

// //   const groupedRolePages = rolePages.reduce((acc, page) => {
// //     const roleName = page.role_name || "Unassigned";
// //     if (!acc[roleName]) {
// //       acc[roleName] = [];
// //     }
// //     acc[roleName].push(page);
// //     return acc;
// //   }, {});

// //   return (
// //     <div className="create-org-wrapper">
// //       <div className="table-header">
// //         <div className="search-container">
// //           <label className="search-label">Search by:</label>
// //           <input
// //             type="text"
// //             value={searchTerm}
// //             onChange={handleSearchInputChange}
// //             placeholder="Name, Id, Email, Date"
// //             className="search-input"
// //           />
// //         </div>
// //         <button className="open-form-btn" onClick={handleOpenForm}>
// //           + Add Organization
// //         </button>
// //       </div>

// //       {showForm && (
// //         <div className="modal-overlay" onClick={handleCloseModal}>
// //           <div className="create-org-container">
// //             <div className="form-header">
// //               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
// //               <span className="close-icon" onClick={() => setShowForm(false)}>
// //                 ✕
// //               </span>
// //             </div>

// //             <form className="org-form" onSubmit={handleSubmit}>
// //               {step === 1 && (
// //                 <div className="form-section">
// //                   <h3>Organization Details</h3>
// //                   <div className="form-row">
// //                     <div className="form-field">
// //                       <label>Organization Name *</label>
// //                       <input
// //                         type="text"
// //                         value={name}
// //                         onChange={(e) => {
// //                           setName(e.target.value);
// //                           updateFieldError("name", e.target.value);
// //                         }}
// //                       />
// //                       {errors.name && <span className="error-message">{errors.name}</span>}
// //                     </div>
// //                     <div className="form-field">
// //                       <label>Display Name *</label>
// //                       <input
// //                         type="text"
// //                         value={subdomain}
// //                         onChange={(e) => {
// //                           setSubdomain(e.target.value);
// //                           updateFieldError("subdomain", e.target.value);
// //                         }}
// //                       />
// //                       {errors.subdomain && <span className="error-message">{errors.subdomain}</span>}
// //                     </div>
// //                     <div className="form-field">
// //                       <label>Number of Employees *</label>
// //                       <input
// //                         type="number"
// //                         value={noEmployees}
// //                         onChange={(e) => {
// //                           setNoEmployees(e.target.value);
// //                           updateFieldError("noEmployees", e.target.value);
// //                         }}
// //                       />
// //                       {errors.noEmployees && <span className="error-message">{errors.noEmployees}</span>}
// //                     </div>
// //                   </div>
// //                   <div className="form-row">
// //                     <div className="form-field">
// //                       <label>Company Address *</label>
// //                       <input
// //                         type="text"
// //                         value={companyAddress}
// //                         onChange={(e) => {
// //                           setCompanyAddress(e.target.value);
// //                           updateFieldError("companyAddress", e.target.value);
// //                         }}
// //                       />
// //                       {errors.companyAddress && <span className="error-message">{errors.companyAddress}</span>}
// //                     </div>
// //                     <div className="form-field">
// //                       <label>Company PAN No *</label>
// //                       <input
// //                         type="text"
// //                         value={cPanNo}
// //                         onChange={(e) => {
// //                           setCPanNo(e.target.value.toUpperCase());
// //                           updateFieldError("cPanNo", e.target.value.toUpperCase());
// //                         }}
// //                       />
// //                       {errors.cPanNo && <span className="error-message">{errors.cPanNo}</span>}
// //                     </div>
// //                     <div className="form-field">
// //                       <label>Admin Email ID *</label>
// //                       <input
// //                         type="email"
// //                         value={adminEmail}
// //                         onChange={(e) => {
// //                           setAdminEmail(e.target.value);
// //                           updateFieldError("adminEmail", e.target.value);
// //                         }}
// //                       />
// //                       {errors.adminEmail && <span className="error-message">{errors.adminEmail}</span>}
// //                     </div>
// //                   </div>
// //                   <div className="form-row form-row-four">
// //                     <div className="form-field">
// //                       <label>Contact Email ID *</label>
// //                       <input
// //                         type="email"
// //                         value={contactEmail}
// //                         onChange={(e) => {
// //                           setContactEmail(e.target.value);
// //                           updateFieldError("contactEmail", e.target.value);
// //                         }}
// //                       />
// //                       {errors.contactEmail && <span className="error-message">{errors.contactEmail}</span>}
// //                     </div>
// //                     <div className="form-field">
// //                       <label>Contact Phone No *</label>
// //                       <input
// //                         type="tel"
// //                         value={contactPhone}
// //                         onChange={(e) => {
// //                           setContactPhone(e.target.value);
// //                           updateFieldError("contactPhone", e.target.value);
// //                         }}
// //                       />
// //                       {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
// //                     </div>
// //                     <div className="form-field date-field">
// //                       <label>Start Date *</label>
// //                       <div className="date-input-container">
// //                         <input
// //                           type="date"
// //                           value={startDate}
// //                           onChange={(e) => {
// //                             setStartDate(e.target.value);
// //                             updateFieldError("startDate", e.target.value);
// //                             updateFieldError("endDate", endDate);
// //                           }}
// //                         />
// //                         <MdOutlineCalendarToday className="date-icon" />
// //                       </div>
// //                       {errors.startDate && <span className="error-message">{errors.startDate}</span>}
// //                     </div>
// //                     <div className="form-field date-field">
// //                       <label>End Date *</label>
// //                       <div className="date-input-container">
// //                         <input
// //                           type="date"
// //                           value={endDate}
// //                           onChange={(e) => {
// //                             setEndDate(e.target.value);
// //                             updateFieldError("endDate", e.target.value);
// //                           }}
// //                         />
// //                         <MdOutlineCalendarToday className="date-icon" />
// //                       </div>
// //                       {errors.endDate && <span className="error-message">{errors.endDate}</span>}
// //                     </div>
// //                   </div>
// //                   <div className="form-actions">
// //                     <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
// //                       Cancel
// //                     </button>
// //                     <button type="button" className="next-btn" onClick={handleNextStep}>
// //                       Next
// //                     </button>
// //                   </div>
// //                 </div>
// //               )}

// //               {step === 2 && (
// //                 <div className="form-section">
// //                   <h3>Roles and Permissions</h3>
// //                   <div className="roles-checkbox-group">
// //                     <label>Assign Roles *</label>
// //                     <div className="checkbox-list">
// //                       {roles.length > 0 ? (
// //                         roles.map((role) => (
// //                           <div key={role} className="checkbox-item">
// //                             <input
// //                               type="checkbox"
// //                               id={`role-${role}`}
// //                               checked={selectedRoles.includes(role)}
// //                               onChange={() => handleRoleToggle(role)}
// //                             />
// //                             <label htmlFor={`role-${role}`} className="checkbox-label">
// //                               {role}
// //                             </label>
// //                           </div>
// //                         ))
// //                       ) : (
// //                         <p className="no-data">No roles found.</p>
// //                       )}
// //                     </div>
// //                     {errors.selectedRoles && <span className="error-message">{errors.selectedRoles}</span>}
// //                   </div>

// //                   {Object.keys(groupedRolePages).length > 0 ? (
// //                     <div className="roles-checkbox-group">
// //                       <label>Assign Pages to Roles</label>
// //                       <div className="checkbox-list">
// //                         {Object.entries(groupedRolePages).map(([roleName, pages]) => (
// //                           <div key={roleName} className="role-pages-group">
// //                             <h4>{roleName}</h4>
// //                             {pages.map((page, index) => (
// //                               <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
// //                                 <input
// //                                   type="checkbox"
// //                                   checked={selectedPages.some(
// //                                     (p) => p.page_name === page.page_name && p.path === page.path
// //                                   )}
// //                                   onChange={() => handlePageToggle(page)}
// //                                 />
// //                                 <label className="checkbox-label">
// //                                   {page.page_name} ({page.path})
// //                                 </label>
// //                               </div>
// //                             ))}
// //                           </div>
// //                         ))}
// //                       </div>
// //                     </div>
// //                   ) : (
// //                     <p className="no-data">No pages available. Select roles to view associated pages.</p>
// //                   )}
// //                   <div className="form-actions">
// //                     <button type="button" className="prev-btn" onClick={handlePrevStep}>
// //                       Previous
// //                     </button>
// //                     <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
// //                   </div>
// //                 </div>
// //               )}

// //               {message && <p className="message">{message}</p>}
// //             </form>
// //           </div>
// //         </div>
// //       )}

// //       {showDetailsPopup && popupData && (
// //         <div className="details-overlay" onClick={handleCloseDetailsPopup}>
// //           <div className="details-popup">
// //             <div className="form-header">
// //               <h2>Details</h2>
// //               <span className="close-icon" onClick={() => setShowDetailsPopup(false)}>
// //                 ✕
// //               </span>
// //             </div>
// //             <div className="details-content">
// //               <p><strong>Address:</strong> {popupData.company_address}</p>
// //               <p><strong>Admin Email:</strong> {popupData.admin_email}</p>
// //               <p><strong>Contact Email:</strong> {popupData.contact_email_id}</p>
// //               <p><strong>Contact Phone:</strong> {popupData.contact_phone_no}</p>
// //               <p><strong>Start Date:</strong> {popupData.start_date}</p>
// //               <p><strong>End Date:</strong> {popupData.end_date}</p>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {filteredOrgData.length > 0 ? (
// //         <>
// //           <div className="mobile-cards">
// //             {filteredOrgData.map((org) => (
// //               <div className="org-card" key={org.id}>
// //                 <div className="org-card-header">{org.Name}</div>
// //                 <div className="org-card-content"><strong>ID:</strong> {org.id}</div>
// //                 <div className="org-card-content"><strong>Subdomain:</strong> {org.subdomain}</div>
// //                 <div className="org-card-content"><strong>No. Employees:</strong> {org.no_employees}</div>
// //                 <div className="org-card-actions">
// //                   <button className="view-btn" onClick={() => handleShowDetails(org)} title="View Details">
// //                     <FaEye />
// //                   </button>
// //                   <button className="edit-btn" onClick={() => handleEdit(org)} title="Edit">
// //                     <MdEdit />
// //                   </button>
// //                   <button className="delete-btn" onClick={() => handleDelete(org.id)} title="Delete">
// //                     <FaTrash />
// //                   </button>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //           <div className="org-table-container">
// //             <table className="org-table">
// //               <thead>
// //                 <tr>
// //                   <th>ID</th>
// //                   <th>Name</th>
// //                   <th>Subdomain</th>
// //                   <th>No. Employees</th>
// //                   <th>CommonDetails</th>
// //                   <th>Actions</th>
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 {filteredOrgData.map((org) => (
// //                   <tr key={org.id}>
// //                     <td><span className="tooltip" title={org.id}>{org.id}</span></td>
// //                     <td><span className="tooltip" title={org.Name}>{org.Name}</span></td>
// //                     <td><span className="tooltip" title={org.subdomain}>{org.subdomain}</span></td>
// //                     <td><span className="tooltip" title={org.no_employees}>{org.no_employees}</span></td>
// //                     <td>
// //                       <button
// //                         className="view-btn"
// //                         onClick={() => handleShowDetails(org)}
// //                         title="View Details"
// //                       >
// //                         <FaEye />
// //                       </button>
// //                     </td>
// //                     <td>
// //                       <button
// //                         className="edit-btn"
// //                         onClick={() => handleEdit(org)}
// //                         title="Edit"
// //                       >
// //                         <MdEdit />
// //                       </button>
// //                       <button
// //                         className="delete-btn"
// //                         onClick={() => handleDelete(org.id)}
// //                         title="Delete"
// //                       >
// //                         <FaTrash />
// //                       </button>
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         </>
// //       ) : (
// //         <div className="no-data-message">
// //           <p>No organizations found.</p>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default CreateOrganization;

// import React, { useEffect, useState } from "react";
// import { FaEye, FaTrash } from "react-icons/fa";
// import { MdOutlineCalendarToday, MdEdit } from "react-icons/md";
// import "./CreateOrganization.css";

// // Custom debounce hook
// const useDebounce = (value, delay) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   return debouncedValue;
// };

// const CreateOrganization = ({ employeeId = "default-employee-id" }) => {
//   const [showForm, setShowForm] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [currentOrgId, setCurrentOrgId] = useState(null);
//   const [step, setStep] = useState(1);
//   const [name, setName] = useState("");
//   const [subdomain, setSubdomain] = useState("");
//   const [noEmployees, setNoEmployees] = useState("");
//   const [companyAddress, setCompanyAddress] = useState("");
//   const [cPanNo, setCPanNo] = useState("");
//   const [adminEmail, setAdminEmail] = useState("");
//   const [contactEmail, setContactEmail] = useState("");
//   const [contactPhone, setContactPhone] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [roles, setRoles] = useState([]);
//   const [selectedRoles, setSelectedRoles] = useState([]);
//   const [rolePages, setRolePages] = useState([]);
//   const [selectedPages, setSelectedPages] = useState([]);
//   const [message, setMessage] = useState("");
//   const [orgTableData, setOrgTableData] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredOrgData, setFilteredOrgData] = useState([]);
//   const [showDetailsPopup, setShowDetailsPopup] = useState(false);
//   const [popupData, setPopupData] = useState(null);
//   const [errors, setErrors] = useState({});
//   const [shouldValidate, setShouldValidate] = useState(false);

//   const debouncedSearchTerm = useDebounce(searchTerm, 300);

//   // Validation functions
//   const validateEmail = (email) => {
//     const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return email ? (regex.test(email) ? "" : "Please enter a valid email address.") : "";
//   };

//   const validateMobileNumber = (phone) => {
//     const regex = /^[6-9]\d{9}$/;
//     return phone ? (regex.test(phone) ? "" : "Please enter a valid 10-digit Indian mobile number.") : "";
//   };

//   const validatePanNumber = (pan) => {
//     const regex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
//     return pan ? (regex.test(pan) ? "" : "Please enter a valid PAN number (e.g., ABCDE1234F).") : "";
//   };

//   const validateDates = (start, end) => {
//     if (!start || !end) return "";
//     const startDateObj = new Date(start);
//     const endDateObj = new Date(end);
//     return endDateObj >= startDateObj ? "" : "End date cannot be before start date.";
//   };

//   // Validate fields based on step
//   const validateForm = (currentStep) => {
//     const newErrors = {};
//     let errorMessages = [];

//     if (currentStep === 1) {
//       newErrors.name = name ? "" : "Organization Name is required.";
//       newErrors.subdomain = subdomain ? "" : "Display Name is required.";
//       newErrors.noEmployees = noEmployees ? "" : "Number of Employees is required.";
//       newErrors.companyAddress = companyAddress ? "" : "Company Address is required.";
//       newErrors.cPanNo = validatePanNumber(cPanNo);
//       newErrors.adminEmail = validateEmail(adminEmail) || (adminEmail ? "" : "Admin Email ID is required.");
//       newErrors.contactEmail = validateEmail(contactEmail) || (contactEmail ? "" : "Contact Email ID is required.");
//       newErrors.contactPhone = validateMobileNumber(contactPhone) || (contactPhone ? "" : "Contact Phone No is required.");
//       newErrors.startDate = startDate ? "" : "Start Date is required.";
//       newErrors.endDate = validateDates(startDate, endDate) || (endDate ? "" : "End Date is required.");

//       errorMessages = Object.entries(newErrors)
//         .filter(([_, error]) => error)
//         .map(([key, error]) => {
//           const fieldNames = {
//             name: "Organization Name",
//             subdomain: "Display Name",
//             noEmployees: "Number of Employees",
//             companyAddress: "Company Address",
//             cPanNo: "Company PAN No",
//             adminEmail: "Admin Email ID",
//             contactEmail: "Contact Email ID",
//             contactPhone: "Contact Phone No",
//             startDate: "Start Date",
//             endDate: "End Date",
//           };
//           return `${fieldNames[key]}: ${error}`;
//         });
//     } else if (currentStep === 2) {
//       newErrors.selectedRoles = selectedRoles.length > 0 ? "" : "At least one role must be selected.";
//       if (newErrors.selectedRoles) {
//         errorMessages.push("Roles: At least one role must be selected.");
//       }
//     }

//     setErrors(newErrors);
//     setMessage(errorMessages.length > 0 ? `❌ Please fix the following errors:\n${errorMessages.join("\n")}` : "");
//     return Object.values(newErrors).every((error) => error === "");
//   };

//   // Real-time validation for individual fields
//   const updateFieldError = (field, value) => {
//     let error = "";
//     switch (field) {
//       case "name":
//         error = value ? "" : "Organization Name is required.";
//         break;
//       case "subdomain":
//         error = value ? "" : "Display Name is required.";
//         break;
//       case "noEmployees":
//         error = value ? "" : "Number of Employees is required.";
//         break;
//       case "companyAddress":
//         error = value ? "" : "Company Address is required.";
//         break;
//       case "cPanNo":
//         error = validatePanNumber(value);
//         break;
//       case "adminEmail":
//         error = validateEmail(value);
//         break;
//       case "contactEmail":
//         error = validateEmail(value);
//         break;
//       case "contactPhone":
//         error = validateMobileNumber(value);
//         break;
//       case "startDate":
//         error = value ? "" : "Start Date is required.";
//         break;
//       case "endDate":
//         error = validateDates(startDate, value) || (value ? "" : "End Date is required.");
//         break;
//       case "selectedRoles":
//         error = value.length > 0 ? "" : "At least one role must be selected.";
//         break;
//       default:
//         break;
//     }
//     setErrors((prev) => ({ ...prev, [field]: error }));
//   };

//   // Reset form when opening for creation
//   useEffect(() => {
//     if (showForm && !isEditing) {
//       setStep(1);
//       setName("");
//       setSubdomain("");
//       setNoEmployees("");
//       setCompanyAddress("");
//       setCPanNo("");
//       setAdminEmail("");
//       setContactEmail("");
//       setContactPhone("");
//       setStartDate("");
//       setEndDate("");
//       setSelectedRoles([]);
//       setSelectedPages([]);
//       setErrors({});
//       setMessage("");
//       setCurrentOrgId(null);
//       setShouldValidate(false);
//     }
//   }, [showForm, isEditing]);

//   useEffect(() => {
//     const fetchRoles = async () => {
//       try {
//         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-org-roles`, {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": process.env.REACT_APP_API_KEY,
//             "x-employee-id": employeeId,
//           },
//         });
//         if (!res.ok) throw new Error(`Failed to fetch roles: ${res.status}`);
//         const data = await res.json();
//         const uniqueRoles = [...new Set(data.map((r) => r.role_name || r.role))];
//         setRoles(uniqueRoles);
//       } catch (err) {
//         console.error("Role fetch error:", err);
//         setMessage("❌ Failed to fetch roles.");
//       }
//     };

//     const fetchOrganizations = async () => {
//       try {
//         const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": process.env.REACT_APP_API_KEY,
//             "x-employee-id": employeeId,
//           },
//         });
//         if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
//         const data = await res.json();
//         setOrgTableData(data);
//         setFilteredOrgData(data);
//       } catch (err) {
//         console.error("Organization table fetch error:", err);
//         setMessage("❌ Failed to fetch organizations.");
//       }
//     };

//     fetchRoles();
//     fetchOrganizations();
//   }, [employeeId]);

//   useEffect(() => {
//     const fetchRolePages = async () => {
//       if (selectedRoles.length === 0) {
//         setRolePages([]);
//         return;
//       }

//       try {
//         const rolesQuery = selectedRoles.join(",");
//         const res = await fetch(
//           `${process.env.REACT_APP_BACKEND_URL}/get-role-pages?roles=${rolesQuery}`,
//           {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/json",
//               "x-api-key": process.env.REACT_APP_API_KEY,
//               "x-employee-id": employeeId,
//             },
//           }
//         );
//         if (!res.ok) throw new Error(`Failed to fetch role pages: ${res.status}`);
//         const data = await res.json();
//         setRolePages(data);
//       } catch (err) {
//         console.error("Role pages fetch error:", err);
//         setRolePages([]);
//         setMessage("❌ Failed to fetch role pages.");
//       }
//     };

//     fetchRolePages();
//   }, [selectedRoles, employeeId]);

//   useEffect(() => {
//     const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
//     const filtered = orgTableData.filter((org) => {
//       if (!lowerCaseSearchTerm) return true;
//       return (
//         org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
//         org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm) ||
//         org.id.toString().includes(lowerCaseSearchTerm) ||
//         org.admin_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
//         org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
//         org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
//         org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
//         org.end_date?.toLowerCase().includes(lowerCaseSearchTerm)
//       );
//     });
//     setFilteredOrgData(filtered);
//   }, [debouncedSearchTerm, orgTableData]);

//   const handleSearchInputChange = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const handleRoleToggle = (role) => {
//     setSelectedRoles((prev) => {
//       const newRoles = prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role];
//       if (step === 2 && shouldValidate) {
//         updateFieldError("selectedRoles", newRoles);
//       }
//       return newRoles;
//     });
//   };

//   const handlePageToggle = (page) => {
//     setSelectedPages((prev) => {
//       const exists = prev.some(
//         (p) => p.page_name === page.page_name && p.path === page.path
//       );
//       return exists
//         ? prev.filter((p) => !(p.page_name === page.page_name && p.path === page.path))
//         : [...prev, { ...page, role_id: page.role_id || 0, role_name: page.role_name || null }];
//     });
//   };

//   const handleEdit = async (org) => {
//     setIsEditing(true);
//     setCurrentOrgId(org.id);
//     setName(org.Name || "");
//     setSubdomain(org.subdomain || "");
//     setNoEmployees(org.no_employees || "");
//     setCompanyAddress(org.company_address || "");
//     setCPanNo(org.c_pan_no || "");
//     setAdminEmail(org.admin_email || "");
//     setContactEmail(org.contact_email_id || "");
//     setContactPhone(org.contact_phone_no || "");
//     setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
//     setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
//     setSelectedRoles([]);
//     setSelectedPages([]);
//     setErrors({});
//     setMessage("");
//     setStep(1);
//     setShouldValidate(true);

//     try {
//       const url = `${process.env.REACT_APP_BACKEND_URL}/organization-details/${org.id}`;
//       const res = await fetch(url, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           "x-api-key": process.env.REACT_APP_API_KEY,
//           "x-employee-id": employeeId,
//         },
//       });

//       if (!res.ok) {
//         throw new Error(`Failed to fetch organization roles and pages: ${res.status}`);
//       }

//       const data = await res.json();
//       setSelectedRoles(data.roles ? data.roles.map((r) => r.role_name) : []);
//       setSelectedPages(data.pages ? data.pages.map((p) => ({ ...p, role_id: p.role_id || 0, role_name: p.role_name || null })) : []);
//     } catch (err) {
//       console.error("Error fetching org roles and pages:", err);
//       setMessage(`❌ Failed to load organization roles and pages: ${err.message}`);
//     }

//     setShowForm(true);
//   };

//   const handleDelete = async (orgId) => {
//     if (!window.confirm("Are you sure you want to delete this organization?")) return;

//     try {
//       const response = await fetch(
//         `${process.env.REACT_APP_BACKEND_URL}/delete-organization/${orgId}`,
//         {
//           method: "DELETE",
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": process.env.REACT_APP_API_KEY,
//             "x-employee-id": employeeId,
//           },
//         }
//       );

//       const data = await response.json();
//       if (response.ok) {
//         setMessage(data.message || "✅ Organization deleted successfully.");
//         setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
//         setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
//       } else {
//         setMessage(data.error || "❌ Failed to delete organization.");
//       }
//     } catch (error) {
//       console.error("Delete organization error:", error);
//       setMessage(`❌ Server error: ${error.message}`);
//     }
//   };

//   const handleOpenForm = () => {
//     setShowForm(true);
//     setIsEditing(false);
//     setCurrentOrgId(null);
//     setStep(1);
//     setName("");
//     setSubdomain("");
//     setNoEmployees("");
//     setCompanyAddress("");
//     setCPanNo("");
//     setAdminEmail("");
//     setContactEmail("");
//     setContactPhone("");
//     setStartDate("");
//     setEndDate("");
//     setSelectedRoles([]);
//     setSelectedPages([]);
//     setErrors({});
//     setMessage("");
//     setShouldValidate(false);
//   };

//   const handleNextStep = (e) => {
//     e.preventDefault();
//     setShouldValidate(true);
//     if (validateForm(1)) {
//       setStep(2);
//     }
//   };

//   const handlePrevStep = (e) => {
//     e.preventDefault();
//     setStep(1);
//     setShouldValidate(true);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage("");
//     setShouldValidate(true);

//     if (!validateForm(1) || !validateForm(2)) {
//       return;
//     }

//     const orgData = {
//       Name: name,
//       subdomain,
//       no_employees: parseInt(noEmployees) || 0,
//       company_address: companyAddress,
//       c_pan_no: cPanNo,
//       admin_email: adminEmail,
//       contact_email_id: contactEmail,
//       contact_phone_no: contactPhone,
//       start_date: startDate,
//       end_date: endDate,
//       roles: selectedRoles,
//       selectedPages: selectedPages.map((p) => ({
//         page_name: p.page_name,
//         path: p.path,
//         icon_name: p.icon_name,
//         role_id: p.role_id || 0,
//         role_name: p.role_name || null,
//       })),
//     };

//     try {
//       const url = isEditing
//         ? `${process.env.REACT_APP_BACKEND_URL}/update-organization/${currentOrgId}`
//         : `${process.env.REACT_APP_BACKEND_URL}/create-organization`;
//       const method = isEditing ? "PUT" : "POST";

//       const response = await fetch(url, {
//         method,
//         headers: {
//           "Content-Type": "application/json",
//           "x-api-key": process.env.REACT_APP_API_KEY,
//           "x-employee-id": employeeId,
//         },
//         body: JSON.stringify(orgData),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
//         if (isEditing) {
//           setOrgTableData((prev) =>
//             prev.map((org) =>
//               org.id === currentOrgId ? { ...org, ...orgData } : org
//             )
//           );
//           setFilteredOrgData((prev) =>
//             prev.map((org) =>
//               org.id === currentOrgId ? { ...org, ...orgData } : org
//             )
//           );
//         } else {
//           const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
//             headers: {
//               "Content-Type": "application/json",
//               "x-api-key": process.env.REACT_APP_API_KEY,
//               "x-employee-id": employeeId,
//             },
//           });
//           if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
//           const newData = await res.json();
//           setOrgTableData(newData);
//           setFilteredOrgData(newData);
//         }
//         setShowForm(false);
//         setIsEditing(false);
//         setCurrentOrgId(null);
//         setStep(1);
//         setName("");
//         setSubdomain("");
//         setNoEmployees("");
//         setCompanyAddress("");
//         setCPanNo("");
//         setAdminEmail("");
//         setContactEmail("");
//         setContactPhone("");
//         setStartDate("");
//         setEndDate("");
//         setSelectedRoles([]);
//         setSelectedPages([]);
//         setErrors({});
//         setMessage("");
//         setShouldValidate(false);
//       } else {
//         setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
//       }
//     } catch (error) {
//       console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
//       setMessage(`❌ Server error: ${error.message}`);
//     }
//   };

//   const handleCloseModal = (e) => {
//     if (e.target.className.includes("modal-overlay")) {
//       setShowForm(false);
//       setIsEditing(false);
//       setCurrentOrgId(null);
//       setStep(1);
//       setName("");
//       setSubdomain("");
//       setNoEmployees("");
//       setCompanyAddress("");
//       setCPanNo("");
//       setAdminEmail("");
//       setContactEmail("");
//       setContactPhone("");
//       setStartDate("");
//       setEndDate("");
//       setSelectedRoles([]);
//       setSelectedPages([]);
//       setErrors({});
//       setMessage("");
//       setShouldValidate(false);
//     }
//   };

//   const formatToIST = (dateString) => {
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date.getTime())) return dateString;
//       return date.toLocaleString("en-IN", {
//         timeZone: "Asia/Kolkata",
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//       });
//     } catch (error) {
//       return dateString;
//     }
//   };

//   const handleShowDetails = (org) => {
//     setPopupData({
//       company_address: org.company_address,
//       admin_email: org.admin_email,
//       contact_email_id: org.contact_email_id,
//       contact_phone_no: org.contact_phone_no,
//       start_date: formatToIST(org.start_date),
//       end_date: formatToIST(org.end_date),
//     });
//     setShowDetailsPopup(true);
//   };

//   const handleCloseDetailsPopup = (e) => {
//     if (e.target.className.includes("details-overlay")) {
//       setShowDetailsPopup(false);
//       setPopupData(null);
//     }
//   };

//   const groupedRolePages = rolePages.reduce((acc, page) => {
//     const roleName = page.role_name || "Unassigned";
//     if (!acc[roleName]) {
//       acc[roleName] = [];
//     }
//     acc[roleName].push(page);
//     return acc;
//   }, {});

//   return (
//     <div className="create-org-wrapper">
//       <div className="table-header">
//         <div className="search-container">
//           <label className="search-label">Search by:</label>
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={handleSearchInputChange}
//             placeholder="Name, Id, Email, Date"
//             className="search-input"
//           />
//         </div>
//         <button className="open-form-btn" onClick={handleOpenForm}>
//           + Add Organization
//         </button>
//       </div>

//       {showForm && (
//         <div className="modal-overlay" onClick={handleCloseModal}>
//           <div className="create-org-container">
//             <div className="form-header">
//               <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
//               <span className="close-icon" onClick={() => setShowForm(false)}>
//                 ✕
//               </span>
//             </div>

//             <form className="org-form" onSubmit={handleSubmit}>
//               {step === 1 && (
//                 <div className="form-section">
//                   <h3>Organization Details</h3>
//                   <div className="form-row">
//                     <div className="form-field">
//                       <label>Organization Name *</label>
//                       <input
//                         type="text"
//                         value={name}
//                         onChange={(e) => {
//                           setName(e.target.value);
//                           updateFieldError("name", e.target.value);
//                         }}
//                       />
//                       {errors.name && <span className="error-message">{errors.name}</span>}
//                     </div>
//                     <div className="form-field">
//                       <label>Display Name *</label>
//                       <input
//                         type="text"
//                         value={subdomain}
//                         onChange={(e) => {
//                           setSubdomain(e.target.value);
//                           updateFieldError("subdomain", e.target.value);
//                         }}
//                       />
//                       {errors.subdomain && <span className="error-message">{errors.subdomain}</span>}
//                     </div>
//                     <div className="form-field">
//                       <label>Number of Employees *</label>
//                       <input
//                         type="number"
//                         value={noEmployees}
//                         onChange={(e) => {
//                           setNoEmployees(e.target.value);
//                           updateFieldError("noEmployees", e.target.value);
//                         }}
//                       />
//                       {errors.noEmployees && <span className="error-message">{errors.noEmployees}</span>}
//                     </div>
//                   </div>
//                   <div className="form-row">
//                     <div className="form-field">
//                       <label>Company Address *</label>
//                       <input
//                         type="text"
//                         value={companyAddress}
//                         onChange={(e) => {
//                           setCompanyAddress(e.target.value);
//                           updateFieldError("companyAddress", e.target.value);
//                         }}
//                       />
//                       {errors.companyAddress && <span className="error-message">{errors.companyAddress}</span>}
//                     </div>
//                     <div className="form-field">
//                       <label>Company PAN No *</label>
//                       <input
//                         type="text"
//                         value={cPanNo}
//                         onChange={(e) => {
//                           setCPanNo(e.target.value.toUpperCase());
//                           updateFieldError("cPanNo", e.target.value.toUpperCase());
//                         }}
//                       />
//                       {errors.cPanNo && <span className="error-message">{errors.cPanNo}</span>}
//                     </div>
//                     <div className="form-field">
//                       <label>Admin Email ID *</label>
//                       <input
//                         type="email"
//                         value={adminEmail}
//                         onChange={(e) => {
//                           setAdminEmail(e.target.value);
//                           updateFieldError("adminEmail", e.target.value);
//                         }}
//                       />
//                       {errors.adminEmail && <span className="error-message">{errors.adminEmail}</span>}
//                     </div>
//                   </div>
//                   <div className="form-row form-row-four">
//                     <div className="form-field">
//                       <label>Contact Email ID *</label>
//                       <input
//                         type="email"
//                         value={contactEmail}
//                         onChange={(e) => {
//                           setContactEmail(e.target.value);
//                           updateFieldError("contactEmail", e.target.value);
//                         }}
//                       />
//                       {errors.contactEmail && <span className="error-message">{errors.contactEmail}</span>}
//                     </div>
//                     <div className="form-field">
//                       <label>Contact Phone No *</label>
//                       <input
//                         type="tel"
//                         value={contactPhone}
//                         onChange={(e) => {
//                           setContactPhone(e.target.value);
//                           updateFieldError("contactPhone", e.target.value);
//                         }}
//                       />
//                       {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
//                     </div>
//                     <div className="form-field date-field">
//                       <label>Start Date *</label>
//                       <div className="date-input-container">
//                         <input
//                           type="date"
//                           value={startDate}
//                           onChange={(e) => {
//                             setStartDate(e.target.value);
//                             updateFieldError("startDate", e.target.value);
//                             updateFieldError("endDate", endDate);
//                           }}
//                         />
//                         <MdOutlineCalendarToday className="date-icon" />
//                       </div>
//                       {errors.startDate && <span className="error-message">{errors.startDate}</span>}
//                     </div>
//                     <div className="form-field date-field">
//                       <label>End Date *</label>
//                       <div className="date-input-container">
//                         <input
//                           type="date"
//                           value={endDate}
//                           onChange={(e) => {
//                             setEndDate(e.target.value);
//                             updateFieldError("endDate", e.target.value);
//                           }}
//                         />
//                         <MdOutlineCalendarToday className="date-icon" />
//                       </div>
//                       {errors.endDate && <span className="error-message">{errors.endDate}</span>}
//                     </div>
//                   </div>
//                   <div className="form-actions">
//                     <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
//                       Cancel
//                     </button>
//                     <button type="button" className="next-btn" onClick={handleNextStep}>
//                       Next
//                     </button>
//                   </div>
//                 </div>
//               )}

//               {step === 2 && (
//                 <div className="form-section">
//                   <h3>Roles and Permissions</h3>
//                   <div className="roles-checkbox-group">
//                     <label>Assign Roles *</label>
//                     <div className="checkbox-list">
//                       {roles.length > 0 ? (
//                         roles.map((role) => (
//                           <div key={role} className="checkbox-item">
//                             <input
//                               type="checkbox"
//                               id={`role-${role}`}
//                               checked={selectedRoles.includes(role)}
//                               onChange={() => handleRoleToggle(role)}
//                             />
//                             <label htmlFor={`role-${role}`} className="checkbox-label">
//                               {role}
//                             </label>
//                           </div>
//                         ))
//                       ) : (
//                         <p className="no-data">No roles found.</p>
//                       )}
//                     </div>
//                     {errors.selectedRoles && <span className="error-message">{errors.selectedRoles}</span>}
//                   </div>

//                   {Object.keys(groupedRolePages).length > 0 ? (
//                     <div className="roles-checkbox-group">
//                       <label>Assign Pages to Roles</label>
//                       <div className="checkbox-list">
//                         {Object.entries(groupedRolePages).map(([roleName, pages]) => (
//                           <div key={roleName} className="role-pages-group">
//                             <h4>{roleName}</h4>
//                             {pages.map((page, index) => (
//                               <div key={`${page.page_name}-${page.path}-${index}`} className="checkbox-item">
//                                 <input
//                                   type="checkbox"
//                                   checked={selectedPages.some(
//                                     (p) => p.page_name === page.page_name && p.path === page.path
//                                   )}
//                                   onChange={() => handlePageToggle(page)}
//                                 />
//                                 <label className="checkbox-label">
//                                   {page.page_name}
//                                 </label>
//                               </div>
//                             ))}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   ) : (
//                     <p className="no-data">No pages available. Select roles to view associated pages.</p>
//                   )}
//                   <div className="form-actions">
//                     <button type="button" className="prev-btn" onClick={handlePrevStep}>
//                       Previous
//                     </button>
//                     <button type="submit" className="save-btn">{isEditing ? "Update" : "Save"}</button>
//                   </div>
//                 </div>
//               )}

//               {message && <p className="message">{message}</p>}
//             </form>
//           </div>
//         </div>
//       )}

//       {showDetailsPopup && popupData && (
//         <div className="details-overlay" onClick={handleCloseDetailsPopup}>
//           <div className="details-popup">
//             <div className="form-header">
//               <h2>Details</h2>
//               <span className="close-icon" onClick={() => setShowDetailsPopup(false)}>
//                 ✕
//               </span>
//             </div>
//             <div className="details-content">
//               <p><strong>Address:</strong> {popupData.company_address}</p>
//               <p><strong>Admin Email:</strong> {popupData.admin_email}</p>
//               <p><strong>Contact Email:</strong> {popupData.contact_email_id}</p>
//               <p><strong>Contact Phone:</strong> {popupData.contact_phone_no}</p>
//               <p><strong>Start Date:</strong> {popupData.start_date}</p>
//               <p><strong>End Date:</strong> {popupData.end_date}</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {filteredOrgData.length > 0 ? (
//         <>
//           <div className="mobile-cards">
//             {filteredOrgData.map((org) => (
//               <div className="org-card" key={org.id}>
//                 <div className="org-card-header">{org.Name}</div>
//                 <div className="org-card-content"><strong>ID:</strong> {org.id}</div>
//                 <div className="org-card-content"><strong>Subdomain:</strong> {org.subdomain}</div>
//                 <div className="org-card-content"><strong>No. Employees:</strong> {org.no_employees}</div>
//                 <div className="org-card-actions">
//                   <button className="view-btn" onClick={() => handleShowDetails(org)} title="View Details">
//                     <FaEye />
//                   </button>
//                   <button className="edit-btn" onClick={() => handleEdit(org)} title="Edit">
//                     <MdEdit />
//                   </button>
//                   <button className="delete-btn" onClick={() => handleDelete(org.id)} title="Delete">
//                     <FaTrash />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="org-table-container">
//             <table className="org-table">
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Name</th>
//                   <th>Subdomain</th>
//                   <th>No. Employees</th>
//                   <th>CommonDetails</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredOrgData.map((org) => (
//                   <tr key={org.id}>
//                     <td><span className="tooltip" title={org.id}>{org.id}</span></td>
//                     <td><span className="tooltip" title={org.Name}>{org.Name}</span></td>
//                     <td><span className="tooltip" title={org.subdomain}>{org.subdomain}</span></td>
//                     <td><span className="tooltip" title={org.no_employees}>{org.no_employees}</span></td>
//                     <td>
//                       <button
//                         className="view-btn"
//                         onClick={() => handleShowDetails(org)}
//                         title="View Details"
//                       >
//                         <FaEye />
//                       </button>
//                     </td>
//                     <td>
//                       <button
//                         className="edit-btn"
//                         onClick={() => handleEdit(org)}
//                         title="Edit"
//                       >
//                         <MdEdit />
//                       </button>
//                       <button
//                         className="delete-btn"
//                         onClick={() => handleDelete(org.id)}
//                         title="Delete"
//                       >
//                         <FaTrash />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </>
//       ) : (
//         <div className="no-data-message">
//           <p>No organizations found.</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CreateOrganization;


import React, { useEffect, useState } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import { MdOutlineCalendarToday, MdEdit } from "react-icons/md";
import "./CreateOrganization.css";

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// Multi-select checkbox dropdown component
const MultiSelectCheckbox = ({ options, selectedValues, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter((val) => val !== option)
      : [...selectedValues, option];
    onChange(newValues);
  };

  return (
    <div className={`multi-select-container ${disabled ? "disabled" : ""}`}>
      <div
        className="multi-select-header"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => !disabled && e.key === "Enter" && setIsOpen(!isOpen)}
      >
        {selectedValues.length > 0 ? selectedValues.join(", ") : "Select Roles"}
      </div>
      {isOpen && (
        <div className="multi-select-options">
          {options.map((option) => (
            <label key={option} className="multi-select-option">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => toggleOption(option)}
                disabled={disabled}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateOrganization = ({ employeeId = "default-employee-id" }) => {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOrgId, setCurrentOrgId] = useState(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [noEmployees, setNoEmployees] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [cPanNo, setCPanNo] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sidebarItems, setSidebarItems] = useState([]);
  const [sidebarAccess, setSidebarAccess] = useState([]); // Array of { sidebar_item_id, roles: [] }
  const [message, setMessage] = useState("");
  const [orgTableData, setOrgTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrgData, setFilteredOrgData] = useState([]);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [errors, setErrors] = useState({});
  const [shouldValidate, setShouldValidate] = useState(false);

  const roles = ["Admin", "Manager", "Employee", "General"];
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Validation functions
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email ? (regex.test(email) ? "" : "Please enter a valid email address.") : "";
  };

  const validateMobileNumber = (phone) => {
    const regex = /^[6-9]\d{9}$/;
    return phone ? (regex.test(phone) ? "" : "Please enter a valid 10-digit Indian mobile number.") : "";
  };

  const validatePanNumber = (pan) => {
    const regex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
    return pan ? (regex.test(pan) ? "" : "Please enter a valid PAN number (e.g., ABCDE1234F).") : "";
  };

  const validateDates = (start, end) => {
    if (!start || !end) return "";
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    return endDateObj >= startDateObj ? "" : "End date cannot be before start date.";
  };

  const validateForm = (currentStep) => {
    const newErrors = {};
    let errorMessages = [];

    if (currentStep === 1) {
      newErrors.name = name ? "" : "Organization Name is required.";
      newErrors.subdomain = subdomain ? "" : "Display Name is required.";
      newErrors.noEmployees = noEmployees ? "" : "Number of Employees is required.";
      newErrors.companyAddress = companyAddress ? "" : "Company Address is required.";
      newErrors.cPanNo = validatePanNumber(cPanNo);
      newErrors.adminEmail = validateEmail(adminEmail) || (adminEmail ? "" : "Admin Email ID is required.");
      newErrors.contactEmail = validateEmail(contactEmail) || (contactEmail ? "" : "Contact Email ID is required.");
      newErrors.contactPhone = validateMobileNumber(contactPhone) || (contactPhone ? "" : "Contact Phone No is required.");
      newErrors.startDate = startDate ? "" : "Start Date is required.";
      newErrors.endDate = validateDates(startDate, endDate) || (endDate ? "" : "End Date is required.");

      errorMessages = Object.entries(newErrors)
        .filter(([_, error]) => error)
        .map(([key, error]) => {
          const fieldNames = {
            name: "Organization Name",
            subdomain: "Display Name",
            noEmployees: "Number of Employees",
            companyAddress: "Company Address",
            cPanNo: "Company PAN No",
            adminEmail: "Admin Email ID",
            contactEmail: "Contact Email ID",
            contactPhone: "Contact Phone No",
            startDate: "Start Date",
            endDate: "End Date",
          };
          return `${fieldNames[key]}: ${error}`;
        });
    } else if (currentStep === 2) {
      newErrors.sidebarAccess = sidebarAccess.some((access) => access.roles.length > 0)
        ? ""
        : "At least one sidebar item must have a role assigned.";
      if (newErrors.sidebarAccess) {
        errorMessages.push("Sidebar Access: At least one sidebar item must have a role assigned.");
      }
    }

    setErrors(newErrors);
    setMessage(errorMessages.length > 0 ? `❌ Please fix the following errors:\n${errorMessages.join("\n")}` : "");
    return Object.values(newErrors).every((error) => error === "");
  };

  const updateFieldError = (field, value) => {
    let error = "";
    switch (field) {
      case "name":
        error = value ? "" : "Organization Name is required.";
        break;
      case "subdomain":
        error = value ? "" : "Display Name is required.";
        break;
      case "noEmployees":
        error = value ? "" : "Number of Employees is required.";
        break;
      case "companyAddress":
        error = value ? "" : "Company Address is required.";
        break;
      case "cPanNo":
        error = validatePanNumber(value);
        break;
      case "adminEmail":
        error = validateEmail(value);
        break;
      case "contactEmail":
        error = validateEmail(value);
        break;
      case "contactPhone":
        error = validateMobileNumber(value);
        break;
      case "startDate":
        error = value ? "" : "Start Date is required.";
        break;
      case "endDate":
        error = validateDates(startDate, value) || (value ? "" : "End Date is required.");
        break;
      case "sidebarAccess":
        error = value.some((access) => access.roles.length > 0)
          ? ""
          : "At least one sidebar item must have a role assigned.";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  useEffect(() => {
    if (showForm && !isEditing) {
      setStep(1);
      setName("");
      setSubdomain("");
      setNoEmployees("");
      setCompanyAddress("");
      setCPanNo("");
      setAdminEmail("");
      setContactEmail("");
      setContactPhone("");
      setStartDate("");
      setEndDate("");
      setSidebarAccess([]);
      setErrors({});
      setMessage("");
      setCurrentOrgId(null);
      setShouldValidate(false);
    }
  }, [showForm, isEditing]);

  // Fetch sidebar menu items
  useEffect(() => {
    const fetchSidebarItems = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/sidebar-menu`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
            "x-employee-id": employeeId,
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch sidebar menu items: ${res.status}`);
        }
        const data = await res.json();
        setSidebarItems(data);
        if (!isEditing || sidebarAccess.length === 0) {
          setSidebarAccess(data.map((item) => ({ sidebar_item_id: item.id, roles: [] })));
        }
      } catch (err) {
        console.error("Sidebar menu fetch error:", err);
        setMessage("❌ Failed to fetch sidebar menu items. Please try again or contact support.");
        setSidebarItems([]);
        setSidebarAccess([]);
      }
    };

    if (showForm && (step === 2 || isEditing)) {
      fetchSidebarItems();
    }
  }, [showForm, step, isEditing, employeeId]);

  // Fetch sidebar access for editing
  useEffect(() => {
    const fetchSidebarAccess = async () => {
      if (isEditing && currentOrgId && sidebarItems.length > 0) {
        try {
          const res = await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/api/sidebar-access?orgId=${currentOrgId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.REACT_APP_API_KEY,
                "x-employee-id": employeeId,
              },
            }
          );
          if (!res.ok) {
            throw new Error(`Failed to fetch sidebar access: ${res.status}`);
          }
          const data = await res.json();
          const updatedAccess = sidebarItems.map((item) => {
            const accessRoles = data
              .filter((acc) => acc.sidebar_item_id === item.id)
              .map((acc) => acc.role);
            return {
              sidebar_item_id: item.id,
              roles: accessRoles,
            };
          });
          setSidebarAccess(updatedAccess);
        } catch (err) {
          console.error("Sidebar access fetch error:", err);
          setMessage("❌ Failed to fetch sidebar access. Please try again or contact support.");
        }
      }
    };

    fetchSidebarAccess();
  }, [isEditing, currentOrgId, sidebarItems, employeeId]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
            "x-employee-id": employeeId,
          },
        });
        if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
        const data = await res.json();
        setOrgTableData(data);
        setFilteredOrgData(data);
      } catch (err) {
        console.error("Organization table fetch error:", err);
        setMessage("❌ Failed to fetch organizations.");
      }
    };

    fetchOrganizations();
  }, [employeeId]);

  useEffect(() => {
    const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
    const filtered = orgTableData.filter((org) => {
      if (!lowerCaseSearchTerm) return true;
      return (
        org.Name?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.subdomain?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.id.toString().includes(lowerCaseSearchTerm) ||
        org.admin_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.contact_email_id?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.contact_phone_no?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.start_date?.toLowerCase().includes(lowerCaseSearchTerm) ||
        org.end_date?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    });
    setFilteredOrgData(filtered);
  }, [debouncedSearchTerm, orgTableData]);

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSidebarRoleChange = (sidebarItemId, selectedRoles) => {
    setSidebarAccess((prev) =>
      prev.map((access) =>
        access.sidebar_item_id === sidebarItemId ? { ...access, roles: selectedRoles } : access
      )
    );
    if (shouldValidate) {
      updateFieldError("sidebarAccess", [
        ...sidebarAccess.map((access) =>
          access.sidebar_item_id === sidebarItemId ? { ...access, roles: selectedRoles } : access
        ),
      ]);
    }
  };

  const handleEdit = async (org) => {
    setIsEditing(true);
    setCurrentOrgId(org.id);
    setName(org.Name || "");
    setSubdomain(org.subdomain || "");
    setNoEmployees(org.no_employees || "");
    setCompanyAddress(org.company_address || "");
    setCPanNo(org.c_pan_no || "");
    setAdminEmail(org.admin_email || "");
    setContactEmail(org.contact_email_id || "");
    setContactPhone(org.contact_phone_no || "");
    setStartDate(org.start_date ? org.start_date.split("T")[0] : "");
    setEndDate(org.end_date ? org.end_date.split("T")[0] : "");
    setErrors({});
    setMessage("");
    setStep(1);
    setShouldValidate(true);
    setShowForm(true);
  };

  const handleDelete = async (orgId) => {
    if (!window.confirm("Are you sure you want to delete this organization?")) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/organizations/${orgId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
            "x-employee-id": employeeId,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || "✅ Organization deleted successfully.");
        setOrgTableData((prev) => prev.filter((org) => org.id !== orgId));
        setFilteredOrgData((prev) => prev.filter((org) => org.id !== orgId));
      } else {
        setMessage(data.error || "❌ Failed to delete organization.");
      }
    } catch (error) {
      console.error("Delete organization error:", error);
      setMessage(`❌ Server error: ${error.message}`);
    }
  };

  const handleOpenForm = () => {
    setShowForm(true);
    setIsEditing(false);
    setCurrentOrgId(null);
    setStep(1);
    setName("");
    setSubdomain("");
    setNoEmployees("");
    setCompanyAddress("");
    setCPanNo("");
    setAdminEmail("");
    setContactEmail("");
    setContactPhone("");
    setStartDate("");
    setEndDate("");
    setSidebarAccess([]);
    setErrors({});
    setMessage("");
    setShouldValidate(false);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setShouldValidate(true);
    if (validateForm(1)) {
      setStep(2);
    }
  };

  const handlePrevStep = (e) => {
    e.preventDefault();
    setStep(1);
    setShouldValidate(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setShouldValidate(true);

    if (!validateForm(1) || !validateForm(2)) {
      return;
    }

    const orgData = {
      Name: name,
      subdomain,
      no_employees: parseInt(noEmployees) || 0,
      company_address: companyAddress,
      c_pan_no: cPanNo,
      admin_email: adminEmail,
      contact_email_id: contactEmail,
      contact_phone_no: contactPhone,
      start_date: startDate,
      end_date: endDate,
    };

    const sidebarAccessData = sidebarAccess
      .flatMap((access) =>
        access.roles.map((role) => ({
          sidebar_item_id: access.sidebar_item_id,
          role,
        }))
      );

    try {
      const url = isEditing
        ? `${process.env.REACT_APP_BACKEND_URL}/api/organizations/${currentOrgId}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/organizations`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
          "x-employee-id": employeeId,
        },
        body: JSON.stringify({ orgData, sidebarAccess: sidebarAccessData }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || `✅ Organization ${isEditing ? "updated" : "created"} successfully.`);
        if (isEditing) {
          setOrgTableData((prev) =>
            prev.map((org) =>
              org.id === currentOrgId ? { ...org, ...orgData } : org
            )
          );
          setFilteredOrgData((prev) =>
            prev.map((org) =>
              org.id === currentOrgId ? { ...org, ...orgData } : org
            )
          );
        } else {
          const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organizations`, {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.REACT_APP_API_KEY,
              "x-employee-id": employeeId,
            },
          });
          if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.status}`);
          const newData = await res.json();
          setOrgTableData(newData);
          setFilteredOrgData(newData);
        }
        setShowForm(false);
        setIsEditing(false);
        setCurrentOrgId(null);
        setStep(1);
        setName("");
        setSubdomain("");
        setNoEmployees("");
        setCompanyAddress("");
        setCPanNo("");
        setAdminEmail("");
        setContactEmail("");
        setContactPhone("");
        setStartDate("");
        setEndDate("");
        setSidebarAccess([]);
        setErrors({});
        setMessage("");
        setShouldValidate(false);
      } else {
        setMessage(data.error || `❌ Failed to ${isEditing ? "update" : "create"} organization.`);
      }
    } catch (error) {
      console.error(`${isEditing ? "Update" : "Create"} organization error:`, error);
      setMessage(`❌ Server error: ${error.message}`);
    }
  };

  const handleCloseModal = (e) => {
    if (e.target.className.includes("modal-overlay")) {
      setShowForm(false);
      setIsEditing(false);
      setCurrentOrgId(null);
      setStep(1);
      setName("");
      setSubdomain("");
      setNoEmployees("");
      setCompanyAddress("");
      setCPanNo("");
      setAdminEmail("");
      setContactEmail("");
      setContactPhone("");
      setStartDate("");
      setEndDate("");
      setSidebarAccess([]);
      setErrors({});
      setMessage("");
      setShouldValidate(false);
    }
  };

  const formatToIST = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleShowDetails = (org) => {
    setPopupData({
      company_address: org.company_address,
      admin_email: org.admin_email,
      contact_email_id: org.contact_email_id,
      contact_phone_no: org.contact_phone_no,
      start_date: formatToIST(org.start_date),
      end_date: formatToIST(org.end_date),
    });
    setShowDetailsPopup(true);
  };

  const handleCloseDetailsPopup = (e) => {
    if (e.target.className.includes("modal-overlay")) {
      setShowDetailsPopup(false);
      setPopupData(null);
    }
  };

  return (
    <div className="create-org-wrapper">
      <div className="table-header">
        <div className="search-container">
          <label className="search-label">Search by:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchInputChange}
            placeholder="Name, Id, Email, Date"
            className="search-input"
          />
        </div>
        <button className="open-form-btn" onClick={handleOpenForm}>
          + Add Organization
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="create-org-container">
            <div className="form-header">
              <h2>{isEditing ? "Edit Organization" : "Create New Organization"}</h2>
              <span className="close-icon" onClick={() => setShowForm(false)}>
                ✕
              </span>
            </div>

            <form className="org-form" onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="form-section">
                  <h3>Organization Details</h3>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Organization Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          updateFieldError("name", e.target.value);
                        }}
                      />
                      {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>
                    <div className="form-field">
                      <label>Display Name *</label>
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => {
                          setSubdomain(e.target.value);
                          updateFieldError("subdomain", e.target.value);
                        }}
                      />
                      {errors.subdomain && <span className="error-message">{errors.subdomain}</span>}
                    </div>
                    <div className="form-field">
                      <label>Number of Employees *</label>
                      <input
                        type="number"
                        value={noEmployees}
                        onChange={(e) => {
                          setNoEmployees(e.target.value);
                          updateFieldError("noEmployees", e.target.value);
                        }}
                      />
                      {errors.noEmployees && <span className="error-message">{errors.noEmployees}</span>}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Company Address *</label>
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => {
                          setCompanyAddress(e.target.value);
                          updateFieldError("companyAddress", e.target.value);
                        }}
                      />
                      {errors.companyAddress && <span className="error-message">{errors.companyAddress}</span>}
                    </div>
                    <div className="form-field">
                      <label>Company PAN No *</label>
                      <input
                        type="text"
                        value={cPanNo}
                        onChange={(e) => {
                          setCPanNo(e.target.value.toUpperCase());
                          updateFieldError("cPanNo", e.target.value.toUpperCase());
                        }}
                      />
                      {errors.cPanNo && <span className="error-message">{errors.cPanNo}</span>}
                    </div>
                    <div className="form-field">
                      <label>Admin Email ID *</label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => {
                          setAdminEmail(e.target.value);
                          updateFieldError("adminEmail", e.target.value);
                        }}
                      />
                      {errors.adminEmail && <span className="error-message">{errors.adminEmail}</span>}
                    </div>
                  </div>
                  <div className="form-row form-row-four">
                    <div className="form-field">
                      <label>Contact Email ID *</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => {
                          setContactEmail(e.target.value);
                          updateFieldError("contactEmail", e.target.value);
                        }}
                      />
                      {errors.contactEmail && <span className="error-message">{errors.contactEmail}</span>}
                    </div>
                    <div className="form-field">
                      <label>Contact Phone No *</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => {
                          setContactPhone(e.target.value);
                          updateFieldError("contactPhone", e.target.value);
                        }}
                      />
                      {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
                    </div>
                    <div className="form-field date-field">
                      <label>Start Date *</label>
                      <div className="date-input-container">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            updateFieldError("startDate", e.target.value);
                            updateFieldError("endDate", endDate);
                          }}
                        />
                        {/* <MdOutlineCalendarToday className="date-icon" /> */}
                      </div>
                      {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                    </div>
                    <div className="form-field date-field">
                      <label>End Date *</label>
                      <div className="date-input-container">
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            updateFieldError("endDate", e.target.value);
                          }}
                        />
                        {/* <MdOutlineCalendarToday className="date-icon" /> */}
                      </div>
                      {errors.endDate && <span className="error-message">{errors.endDate}</span>}
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                    <button type="button" className="next-btn" onClick={handleNextStep}>
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="form-section split-view">
                  <div className="left-section">
                    {/* <h3>Organization Details (Review)</h3>
                    <div className="review-details">
                      <p><strong>Name:</strong> {name}</p>
                      <p><strong>Display Name:</strong> {subdomain}</p>
                      <p><strong>No. Employees:</strong> {noEmployees}</p>
                      <p><strong>Company Address:</strong> {companyAddress}</p>
                      <p><strong>PAN No:</strong> {cPanNo}</p>
                      <p><strong>Admin Email:</strong> {adminEmail}</p>
                      <p><strong>Contact Email:</strong> {contactEmail}</p>
                      <p><strong>Contact Phone:</strong> {contactPhone}</p>
                      <p><strong>Start Date:</strong> {formatToIST(startDate)}</p>
                      <p><strong>End Date:</strong> {formatToIST(endDate)}</p>
                    </div> */}
                  </div>
                  <div className="right-section">
                    <h3>Sidebar Menu Access</h3>
                    <div className="sidebar-access-group">
                      <label>Assign Roles to Sidebar Items *</label>
                      {sidebarItems.length > 0 ? (
                        <div className="sidebar-list">
                          {sidebarItems.map((item) => {
                            const selectedRoles = sidebarAccess.find(
                              (access) => access.sidebar_item_id === item.id
                            )?.roles || [];
                            return (
                              <div key={item.id} className="sidebar-item">
                                <span className="sidebar-label">{item.label}</span>
                                <MultiSelectCheckbox
                                  options={roles}
                                  selectedValues={selectedRoles}
                                  onChange={(newRoles) => handleSidebarRoleChange(item.id, newRoles)}
                                  disabled={message.includes("Failed to fetch sidebar menu items")}
                                />
                                {selectedRoles.length > 0 && (
                                  <span className="selected-role-indicator">
                                    Selected: {selectedRoles.join(", ")}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="no-data">
                          {message.includes("Failed to fetch sidebar menu items")
                            ? "Unable to load sidebar items. Please try again or contact support."
                            : "No sidebar items found."}
                        </p>
                      )}
                      {errors.sidebarAccess && (
                        <span className="error-message">{errors.sidebarAccess}</span>
                      )}
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="prev-btn" onClick={handlePrevStep}>
                      Previous
                    </button>
                    <button
                      type="submit"
                      className="save-btn"
                      disabled={message.includes("Failed to fetch sidebar menu items")}
                    >
                      {isEditing ? "Update" : "Save"}
                    </button>
                  </div>
                </div>
              )}

              {message && <p className="message">{message}</p>}
            </form>
          </div>
        </div>
      )}

      {showDetailsPopup && popupData && (
        <div className="modal-overlay" onClick={handleCloseDetailsPopup}>
          <div className="create-org-container details-container">
            <div className="form-header">
              <h2>Organization Details</h2>
              <span className="close-icon" onClick={() => setShowDetailsPopup(false)}>
                ✕
              </span>
            </div>
            <div className="details-content">
              <p><strong>Address:</strong> {popupData.company_address || "N/A"}</p>
              <p><strong>Admin Email:</strong> {popupData.admin_email || "N/A"}</p>
              <p><strong>Contact Email:</strong> {popupData.contact_email_id || "N/A"}</p>
              <p><strong>Contact Phone:</strong> {popupData.contact_phone_no || "N/A"}</p>
              <p><strong>Start Date:</strong> {popupData.start_date || "N/A"}</p>
              <p><strong>End Date:</strong> {popupData.end_date || "N/A"}</p>
            </div>
          </div>
        </div>
      )}

      {filteredOrgData.length > 0 ? (
        <>
          <div className="mobile-cards">
            {filteredOrgData.map((org) => (
              <div className="org-card" key={org.id}>
                <div className="org-card-header">{org.Name}</div>
                <div className="org-card-content"><strong>ID:</strong> {org.id}</div>
                <div className="org-card-content"><strong>Subdomain:</strong> {org.subdomain}</div>
                <div className="org-card-content"><strong>No. Employees:</strong> {org.no_employees}</div>
                <div className="org-card-actions">
                  <button className="view-btn" onClick={() => handleShowDetails(org)} title="View Details">
                    <FaEye />
                  </button>
                  <button className="edit-btn" onClick={() => handleEdit(org)} title="Edit">
                    <MdEdit />
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(org.id)} title="Delete">
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="org-table-container">
            <table className="org-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Subdomain</th>
                  <th>No. Employees</th>
                  <th>CommonDetails</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgData.map((org) => (
                  <tr key={org.id}>
                    <td><span className="tooltip" title={org.id}>{org.id}</span></td>
                    <td><span className="tooltip" title={org.Name}>{org.Name}</span></td>
                    <td><span className="tooltip" title={org.subdomain}>{org.subdomain}</span></td>
                    <td><span className="tooltip" title={org.no_employees}>{org.no_employees}</span></td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleShowDetails(org)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                    </td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(org)}
                        title="Edit"
                      >
                        <MdEdit />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(org.id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="no-data-message">
          <p>No organizations found.</p>
        </div>
      )}
    </div>
  );
};

export default CreateOrganization;

