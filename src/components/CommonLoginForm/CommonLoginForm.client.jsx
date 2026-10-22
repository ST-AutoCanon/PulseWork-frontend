// // // "use client";

// // // import React, { useEffect, useState } from "react";
// // // import "./CommonLoginForm.css";
// // // import { useAuth } from "../../context/AuthProvider.client";

// // // const BACKEND_URL =
// // //   process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

// // // const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

// // // export default function CommonLoginForm() {
// // //   const { employeeId, orgId } = useAuth();

// // //   const [employees, setEmployees] = useState([]);
// // //   const [loadingEmployees, setLoadingEmployees] = useState(false);
// // //   const [saving, setSaving] = useState(false);

// // //   const [selectedEmployee, setSelectedEmployee] = useState(null);

// // //   const [form, setForm] = useState({
// // //     employeeId: "",
// // //     name: "",
// // //     email: "",
// // //     password: "",
// // //     confirmPassword: "",
// // //     isActive: true,
// // //   });

// // //   const [message, setMessage] = useState({
// // //     type: "",
// // //     text: "",
// // //   });

// // //   // ============================================================
// // //   // LOAD EMPLOYEES
// // //   // ============================================================

// // //   useEffect(() => {
// // //     if (!orgId) return;

// // //     loadEmployees();
// // //   }, [orgId]);

// // //   const loadEmployees = async () => {
// // //     try {
// // //       setLoadingEmployees(true);
// // //       setMessage({ type: "", text: "" });

// // //       const response = await fetch(
// // //         `${BACKEND_URL}/api/employees`,
// // //         {
// // //           method: "GET",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": API_KEY,
// // //             "x-employee-id": employeeId || "0",
// // //             "x-org-id": orgId,
// // //           },
// // //           credentials: "include",
// // //         }
// // //       );

// // //       if (!response.ok) {
// // //         throw new Error(`Failed to load employees (${response.status})`);
// // //       }

// // //       const data = await response.json();

// // //       const employeeList =
// // //         data?.employees ||
// // //         data?.data ||
// // //         data ||
// // //         [];

// // //       setEmployees(Array.isArray(employeeList) ? employeeList : []);
// // //     } catch (error) {
// // //       console.error("Load employees error:", error);

// // //       setMessage({
// // //         type: "error",
// // //         text: "Unable to load employees.",
// // //       });
// // //     } finally {
// // //       setLoadingEmployees(false);
// // //     }
// // //   };

// // //   // ============================================================
// // //   // EMPLOYEE SELECT
// // //   // ============================================================

// // //   const handleEmployeeChange = (event) => {
// // //     const id = event.target.value;

// // //     setMessage({ type: "", text: "" });

// // //     if (!id) {
// // //       setSelectedEmployee(null);

// // //       setForm({
// // //         employeeId: "",
// // //         name: "",
// // //         email: "",
// // //         password: "",
// // //         confirmPassword: "",
// // //         isActive: true,
// // //       });

// // //       return;
// // //     }

// // //     const employee = employees.find(
// // //       (item) =>
// // //         String(
// // //           item.employee_id ??
// // //             item.employeeId ??
// // //             item.id
// // //         ) === String(id)
// // //     );

// // //     if (!employee) return;

// // //     const firstName =
// // //       employee.first_name ||
// // //       employee.firstName ||
// // //       "";

// // //     const middleName =
// // //       employee.middle_name ||
// // //       employee.middleName ||
// // //       "";

// // //     const lastName =
// // //       employee.last_name ||
// // //       employee.lastName ||
// // //       "";

// // //     const fullName =
// // //       employee.name ||
// // //       `${firstName} ${middleName} ${lastName}`
// // //         .replace(/\s+/g, " ")
// // //         .trim();

// // //     const email =
// // //       employee.email ||
// // //       employee.employee_email ||
// // //       "";

// // //     const employeeIdValue =
// // //       employee.employee_id ||
// // //       employee.employeeId ||
// // //       employee.id;

// // //     setSelectedEmployee(employee);

// // //     setForm((previous) => ({
// // //       ...previous,
// // //       employeeId: employeeIdValue,
// // //       name: fullName,
// // //       email,
// // //     }));
// // //   };

// // //   // ============================================================
// // //   // INPUT CHANGE
// // //   // ============================================================

// // //   const handleChange = (event) => {
// // //     const { name, value, type, checked } = event.target;

// // //     setForm((previous) => ({
// // //       ...previous,
// // //       [name]: type === "checkbox" ? checked : value,
// // //     }));

// // //     setMessage({ type: "", text: "" });
// // //   };

// // //   // ============================================================
// // //   // CREATE COMMON LOGIN
// // //   // ============================================================

// // //   const handleSubmit = async (event) => {
// // //     event.preventDefault();

// // //     setMessage({ type: "", text: "" });

// // //     if (!form.employeeId) {
// // //       setMessage({
// // //         type: "error",
// // //         text: "Please select an employee.",
// // //       });
// // //       return;
// // //     }

// // //     if (!form.email.trim()) {
// // //       setMessage({
// // //         type: "error",
// // //         text: "Email is required.",
// // //       });
// // //       return;
// // //     }

// // //     if (!form.password) {
// // //       setMessage({
// // //         type: "error",
// // //         text: "Password is required.",
// // //       });
// // //       return;
// // //     }

// // //     if (form.password.length < 6) {
// // //       setMessage({
// // //         type: "error",
// // //         text: "Password must contain at least 6 characters.",
// // //       });
// // //       return;
// // //     }

// // //     if (form.password !== form.confirmPassword) {
// // //       setMessage({
// // //         type: "error",
// // //         text: "Passwords do not match.",
// // //       });
// // //       return;
// // //     }

// // //     try {
// // //       setSaving(true);

// // //       const response = await fetch(
// // //         `${BACKEND_URL}/api/common-login`,
// // //         {
// // //           method: "POST",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": API_KEY,
// // //             "x-employee-id": employeeId || "0",
// // //             "x-org-id": orgId,
// // //           },
// // //           credentials: "include",
// // //           body: JSON.stringify({
// // //             orgId,
// // //             employeeId: form.employeeId,
// // //             name: form.name.trim(),
// // //             email: form.email.trim(),
// // //             password: form.password,
// // //             isActive: form.isActive,
// // //           }),
// // //         }
// // //       );

// // //       const data = await response.json().catch(() => ({}));

// // //       if (!response.ok) {
// // //         throw new Error(
// // //           data?.message ||
// // //             data?.error ||
// // //             `Failed to create common login (${response.status})`
// // //         );
// // //       }

// // //       setMessage({
// // //         type: "success",
// // //         text: "Common login details saved successfully.",
// // //       });

// // //       setForm((previous) => ({
// // //         ...previous,
// // //         password: "",
// // //         confirmPassword: "",
// // //       }));
// // //     } catch (error) {
// // //       console.error("Create common login error:", error);

// // //       setMessage({
// // //         type: "error",
// // //         text:
// // //           error?.message ||
// // //           "Unable to save common login details.",
// // //       });
// // //     } finally {
// // //       setSaving(false);
// // //     }
// // //   };

// // //   // ============================================================
// // //   // RESET
// // //   // ============================================================

// // //   const handleReset = () => {
// // //     setSelectedEmployee(null);

// // //     setForm({
// // //       employeeId: "",
// // //       name: "",
// // //       email: "",
// // //       password: "",
// // //       confirmPassword: "",
// // //       isActive: true,
// // //     });

// // //     setMessage({
// // //       type: "",
// // //       text: "",
// // //     });
// // //   };

// // //   return (
// // //     <div className="common-login-page">
// // //       <div className="common-login-card">

// // //         {/* HEADER */}
// // //         <div className="common-login-header">
// // //           <div>
// // //             <h2>Common Login</h2>
// // //             <p>
// // //               Create common login credentials for an employee
// // //             </p>
// // //           </div>
// // //         </div>

// // //         {/* MESSAGE */}
// // //         {message.text && (
// // //           <div
// // //             className={`common-login-message ${
// // //               message.type === "success"
// // //                 ? "success"
// // //                 : "error"
// // //             }`}
// // //           >
// // //             {message.text}
// // //           </div>
// // //         )}

// // //         {/* FORM */}
// // //         <form onSubmit={handleSubmit}>

// // //           {/* EMPLOYEE */}
// // //           <div className="common-login-field">
// // //             <label>
// // //               Employee <span>*</span>
// // //             </label>

// // //             <select
// // //               value={form.employeeId}
// // //               onChange={handleEmployeeChange}
// // //               disabled={loadingEmployees || saving}
// // //             >
// // //               <option value="">
// // //                 {loadingEmployees
// // //                   ? "Loading employees..."
// // //                   : "Select employee"}
// // //               </option>

// // //               {employees.map((employee) => {
// // //                 const id =
// // //                   employee.employee_id ||
// // //                   employee.employeeId ||
// // //                   employee.id;

// // //                 const firstName =
// // //                   employee.first_name ||
// // //                   employee.firstName ||
// // //                   "";

// // //                 const lastName =
// // //                   employee.last_name ||
// // //                   employee.lastName ||
// // //                   "";

// // //                 const name =
// // //                   employee.name ||
// // //                   `${firstName} ${lastName}`
// // //                     .replace(/\s+/g, " ")
// // //                     .trim();

// // //                 return (
// // //                   <option key={id} value={id}>
// // //                     {name || id} ({id})
// // //                   </option>
// // //                 );
// // //               })}
// // //             </select>
// // //           </div>

// // //           {/* NAME + EMAIL */}
// // //           <div className="common-login-grid">

// // //             <div className="common-login-field">
// // //               <label>
// // //                 Name
// // //               </label>

// // //               <input
// // //                 type="text"
// // //                 name="name"
// // //                 value={form.name}
// // //                 onChange={handleChange}
// // //                 placeholder="Employee name"
// // //                 disabled={!selectedEmployee || saving}
// // //               />
// // //             </div>

// // //             <div className="common-login-field">
// // //               <label>
// // //                 Email <span>*</span>
// // //               </label>

// // //               <input
// // //                 type="email"
// // //                 name="email"
// // //                 value={form.email}
// // //                 onChange={handleChange}
// // //                 placeholder="Employee email"
// // //                 disabled={!selectedEmployee || saving}
// // //               />
// // //             </div>

// // //           </div>

// // //           {/* EMPLOYEE ID */}
// // //           <div className="common-login-field">
// // //             <label>
// // //               Employee ID
// // //             </label>

// // //             <input
// // //               type="text"
// // //               value={form.employeeId}
// // //               readOnly
// // //               placeholder="Employee ID"
// // //             />
// // //           </div>

// // //           {/* PASSWORD */}
// // //           <div className="common-login-grid">

// // //             <div className="common-login-field">
// // //               <label>
// // //                 Password <span>*</span>
// // //               </label>

// // //               <input
// // //                 type="password"
// // //                 name="password"
// // //                 value={form.password}
// // //                 onChange={handleChange}
// // //                 placeholder="Enter password"
// // //                 disabled={!selectedEmployee || saving}
// // //                 autoComplete="new-password"
// // //               />
// // //             </div>

// // //             <div className="common-login-field">
// // //               <label>
// // //                 Confirm Password <span>*</span>
// // //               </label>

// // //               <input
// // //                 type="password"
// // //                 name="confirmPassword"
// // //                 value={form.confirmPassword}
// // //                 onChange={handleChange}
// // //                 placeholder="Confirm password"
// // //                 disabled={!selectedEmployee || saving}
// // //                 autoComplete="new-password"
// // //               />
// // //             </div>

// // //           </div>

// // //           {/* STATUS */}
// // //           <div className="common-login-status">
// // //             <label className="common-login-switch">
// // //               <input
// // //                 type="checkbox"
// // //                 name="isActive"
// // //                 checked={form.isActive}
// // //                 onChange={handleChange}
// // //                 disabled={!selectedEmployee || saving}
// // //               />

// // //               <span className="common-login-slider"></span>
// // //             </label>

// // //             <div>
// // //               <strong>Active Login</strong>
// // //               <p>
// // //                 Allow this employee to use the common login.
// // //               </p>
// // //             </div>
// // //           </div>

// // //           {/* ACTIONS */}
// // //           <div className="common-login-actions">

// // //             <button
// // //               type="button"
// // //               className="common-login-reset"
// // //               onClick={handleReset}
// // //               disabled={saving}
// // //             >
// // //               Reset
// // //             </button>

// // //             <button
// // //               type="submit"
// // //               className="common-login-save"
// // //               disabled={
// // //                 saving ||
// // //                 loadingEmployees ||
// // //                 !selectedEmployee
// // //               }
// // //             >
// // //               {saving ? "Saving..." : "Save Login"}
// // //             </button>

// // //           </div>

// // //         </form>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // "use client";

// // import React, { useState } from "react";
// // import "./CommonLoginForm.css";
// // import { useAuth } from "../../context/AuthProvider.client";

// // const BACKEND_URL =
// //   process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

// // const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

// // export default function CommonLoginForm() {
// //   const { employeeId, orgId } = useAuth();

// //   const [saving, setSaving] = useState(false);

// //   const [form, setForm] = useState({
// //     employeeId: "",
// //     name: "",
// //     email: "",
// //     password: "",
// //     confirmPassword: "",
// //     isActive: true,
// //   });

// //   const [message, setMessage] = useState({
// //     type: "",
// //     text: "",
// //   });

// //   // ============================================================
// //   // INPUT CHANGE
// //   // ============================================================

// //   const handleChange = (event) => {
// //     const { name, value, type, checked } = event.target;

// //     setForm((previous) => ({
// //       ...previous,
// //       [name]: type === "checkbox" ? checked : value,
// //     }));

// //     setMessage({
// //       type: "",
// //       text: "",
// //     });
// //   };

// //   // ============================================================
// //   // CREATE COMMON LOGIN
// //   // ============================================================

// //   const handleSubmit = async (event) => {
// //     event.preventDefault();

// //     setMessage({
// //       type: "",
// //       text: "",
// //     });

// //     if (!orgId) {
// //       setMessage({
// //         type: "error",
// //         text: "Organization ID is required.",
// //       });
// //       return;
// //     }

// //     if (!form.employeeId.trim()) {
// //       setMessage({
// //         type: "error",
// //         text: "Employee ID is required.",
// //       });
// //       return;
// //     }

// //     if (!form.name.trim()) {
// //       setMessage({
// //         type: "error",
// //         text: "Name is required.",
// //       });
// //       return;
// //     }

// //     if (!form.email.trim()) {
// //       setMessage({
// //         type: "error",
// //         text: "Email is required.",
// //       });
// //       return;
// //     }

// //     if (!form.password) {
// //       setMessage({
// //         type: "error",
// //         text: "Password is required.",
// //       });
// //       return;
// //     }

// //     if (form.password.length < 6) {
// //       setMessage({
// //         type: "error",
// //         text: "Password must contain at least 6 characters.",
// //       });
// //       return;
// //     }

// //     if (form.password !== form.confirmPassword) {
// //       setMessage({
// //         type: "error",
// //         text: "Passwords do not match.",
// //       });
// //       return;
// //     }

// //     try {
// //       setSaving(true);

// //       const response = await fetch(
// //         `${BACKEND_URL}/api/common-login`,
// //         {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //             "x-api-key": API_KEY,
// //             "x-employee-id": employeeId || "0",
// //             "x-org-id": orgId,
// //           },
// //           credentials: "include",
// //           body: JSON.stringify({
// //             orgId,
// //             employeeId: form.employeeId.trim(),
// //             name: form.name.trim(),
// //             email: form.email.trim(),
// //             password: form.password,
// //             isActive: form.isActive,
// //           }),
// //         }
// //       );

// //       const data = await response.json().catch(() => ({}));

// //       if (!response.ok) {
// //         throw new Error(
// //           data?.message ||
// //             data?.error ||
// //             `Failed to create common login (${response.status})`
// //         );
// //       }

// //       setMessage({
// //         type: "success",
// //         text: "Common login details saved successfully.",
// //       });

// //       setForm({
// //         employeeId: "",
// //         name: "",
// //         email: "",
// //         password: "",
// //         confirmPassword: "",
// //         isActive: true,
// //       });
// //     } catch (error) {
// //       console.error("Create common login error:", error);

// //       setMessage({
// //         type: "error",
// //         text:
// //           error?.message ||
// //           "Unable to save common login details.",
// //       });
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

// //   // ============================================================
// //   // RESET
// //   // ============================================================

// //   const handleReset = () => {
// //     setForm({
// //       employeeId: "",
// //       name: "",
// //       email: "",
// //       password: "",
// //       confirmPassword: "",
// //       isActive: true,
// //     });

// //     setMessage({
// //       type: "",
// //       text: "",
// //     });
// //   };

// //   return (
// //     <div className="common-login-page">
// //       <div className="common-login-card">

// //         {/* HEADER */}
// //         <div className="common-login-header">
// //           <div>
// //             <h2>Common Login</h2>
// //             <p>
// //               Create common login credentials for an employee
// //             </p>
// //           </div>
// //         </div>

// //         {/* MESSAGE */}
// //         {message.text && (
// //           <div
// //             className={`common-login-message ${
// //               message.type === "success"
// //                 ? "success"
// //                 : "error"
// //             }`}
// //           >
// //             {message.text}
// //           </div>
// //         )}

// //         {/* FORM */}
// //         <form onSubmit={handleSubmit}>

// //           {/* EMPLOYEE ID */}
// //           <div className="common-login-field">
// //             <label>
// //               Employee ID <span>*</span>
// //             </label>

// //             <input
// //               type="text"
// //               name="employeeId"
// //               value={form.employeeId}
// //               onChange={handleChange}
// //               placeholder="Enter employee ID"
// //               disabled={saving}
// //               autoComplete="off"
// //             />
// //           </div>

// //           {/* NAME + EMAIL */}
// //           <div className="common-login-grid">

// //             <div className="common-login-field">
// //               <label>
// //                 Name <span>*</span>
// //               </label>

// //               <input
// //                 type="text"
// //                 name="name"
// //                 value={form.name}
// //                 onChange={handleChange}
// //                 placeholder="Enter employee name"
// //                 disabled={saving}
// //               />
// //             </div>

// //             <div className="common-login-field">
// //               <label>
// //                 Email <span>*</span>
// //               </label>

// //               <input
// //                 type="email"
// //                 name="email"
// //                 value={form.email}
// //                 onChange={handleChange}
// //                 placeholder="Enter employee email"
// //                 disabled={saving}
// //               />
// //             </div>

// //           </div>

// //           {/* PASSWORD */}
// //           <div className="common-login-grid">

// //             <div className="common-login-field">
// //               <label>
// //                 Password <span>*</span>
// //               </label>

// //               <input
// //                 type="password"
// //                 name="password"
// //                 value={form.password}
// //                 onChange={handleChange}
// //                 placeholder="Enter password"
// //                 disabled={saving}
// //                 autoComplete="new-password"
// //               />
// //             </div>

// //             <div className="common-login-field">
// //               <label>
// //                 Confirm Password <span>*</span>
// //               </label>

// //               <input
// //                 type="password"
// //                 name="confirmPassword"
// //                 value={form.confirmPassword}
// //                 onChange={handleChange}
// //                 placeholder="Confirm password"
// //                 disabled={saving}
// //                 autoComplete="new-password"
// //               />
// //             </div>

// //           </div>

// //           {/* STATUS */}
// //           <div className="common-login-status">
// //             <label className="common-login-switch">
// //               <input
// //                 type="checkbox"
// //                 name="isActive"
// //                 checked={form.isActive}
// //                 onChange={handleChange}
// //                 disabled={saving}
// //               />

// //               <span className="common-login-slider"></span>
// //             </label>

// //             <div>
// //               <strong>Active Login</strong>
// //               <p>
// //                 Allow this employee to use the common login.
// //               </p>
// //             </div>
// //           </div>

// //           {/* ACTIONS */}
// //           <div className="common-login-actions">

// //             <button
// //               type="button"
// //               className="common-login-reset"
// //               onClick={handleReset}
// //               disabled={saving}
// //             >
// //               Reset
// //             </button>

// //             <button
// //               type="submit"
// //               className="common-login-save"
// //               disabled={saving}
// //             >
// //               {saving ? "Saving..." : "Save Login"}
// //             </button>

// //           </div>

// //         </form>
// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import React, { useState } from "react";
// import "./CommonLoginForm.css";
// import { useAuth } from "../../context/AuthProvider.client";

// const BACKEND_URL =
//   process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

// const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

// export default function CommonLoginForm() {
//   const auth = useAuth() || {};

//   // Resolve authentication details without requiring organization selection.
//   const employeeId =
//     auth.employeeId ||
//     auth.employee_id ||
//     auth.id ||
//     auth.raw?.employeeId ||
//     auth.raw?.employee_id ||
//     auth.user?.employeeId ||
//     auth.user?.employee_id ||
//     "";

//   const orgId =
//     auth.orgId ||
//     auth.org_id ||
//     auth.raw?.orgId ||
//     auth.raw?.org_id ||
//     auth.user?.orgId ||
//     auth.user?.org_id ||
//     auth.user?.organisation_id ||
//     "";

//   const [saving, setSaving] = useState(false);

//   const [form, setForm] = useState({
//     employeeId: "",
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     isActive: true,
//   });

//   const [message, setMessage] = useState({
//     type: "",
//     text: "",
//   });

//   // ============================================================
//   // INPUT CHANGE
//   // ============================================================

//   const handleChange = (event) => {
//     const { name, value, type, checked } = event.target;

//     setForm((previous) => ({
//       ...previous,
//       [name]: type === "checkbox" ? checked : value,
//     }));

//     setMessage({
//       type: "",
//       text: "",
//     });
//   };

//   // ============================================================
//   // CREATE COMMON LOGIN
//   // ============================================================

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     setMessage({
//       type: "",
//       text: "",
//     });

//     const resolvedOrgId = String(orgId || "").trim();

//     if (!resolvedOrgId) {
//       console.error(
//         "[CommonLogin] Organization ID missing from auth context.",
//         {
//           orgId: auth.orgId,
//           org_id: auth.org_id,
//           raw: auth.raw,
//           user: auth.user,
//         }
//       );

//       setMessage({
//         type: "error",
//         text:
//           "Organization ID is missing from your login session. " +
//           "Please refresh the page and log in again.",
//       });

//       return;
//     }

//     if (!form.employeeId.trim()) {
//       setMessage({
//         type: "error",
//         text: "Employee ID is required.",
//       });
//       return;
//     }

//     if (!form.name.trim()) {
//       setMessage({
//         type: "error",
//         text: "Name is required.",
//       });
//       return;
//     }

//     if (!form.email.trim()) {
//       setMessage({
//         type: "error",
//         text: "Email is required.",
//       });
//       return;
//     }

//     if (!form.password) {
//       setMessage({
//         type: "error",
//         text: "Password is required.",
//       });
//       return;
//     }

//     if (form.password.length < 6) {
//       setMessage({
//         type: "error",
//         text: "Password must contain at least 6 characters.",
//       });
//       return;
//     }

//     if (form.password !== form.confirmPassword) {
//       setMessage({
//         type: "error",
//         text: "Passwords do not match.",
//       });
//       return;
//     }

//     try {
//       setSaving(true);

//       console.log("[CommonLogin] Creating login", {
//         orgId: resolvedOrgId,
//         employeeId: form.employeeId.trim(),
//         email: form.email.trim(),
//       });

//       const response = await fetch(
//         `${BACKEND_URL}/api/common-login`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": API_KEY,
//             "x-employee-id": String(employeeId || "0"),
//             "x-org-id": resolvedOrgId,
//           },
//           credentials: "include",
//           body: JSON.stringify({
//             orgId: resolvedOrgId,
//             employeeId: form.employeeId.trim(),
//             name: form.name.trim(),
//             email: form.email.trim(),
//             password: form.password,
//             isActive: form.isActive,
//           }),
//         }
//       );

//       const data = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         const errorMessage =
//           typeof data.message === "string"
//             ? data.message
//             : typeof data.error === "string"
//               ? data.error
//               : `Failed to create common login (${response.status})`;

//         throw new Error(errorMessage);
//       }

//       setMessage({
//         type: "success",
//         text: "Common login details saved successfully.",
//       });

//       setForm({
//         employeeId: "",
//         name: "",
//         email: "",
//         password: "",
//         confirmPassword: "",
//         isActive: true,
//       });
//     } catch (error) {
//       console.error("[CommonLogin] Create error:", error);

//       setMessage({
//         type: "error",
//         text:
//           error?.message ||
//           "Unable to save common login details.",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ============================================================
//   // RESET
//   // ============================================================

//   const handleReset = () => {
//     setForm({
//       employeeId: "",
//       name: "",
//       email: "",
//       password: "",
//       confirmPassword: "",
//       isActive: true,
//     });

//     setMessage({
//       type: "",
//       text: "",
//     });
//   };

//   // ============================================================
//   // UI
//   // ============================================================

//   return (
//     <div className="common-login-page">
//       <div className="common-login-card">
//         {/* HEADER */}
//         <div className="common-login-header">
//           <div>
//             <h2>Common Login</h2>
//             <p>
//               Create common login credentials for an employee
//             </p>
//           </div>
//         </div>

//         {/* MESSAGE */}
//         {message.text && (
//           <div
//             role="alert"
//             className={`common-login-message ${
//               message.type === "success"
//                 ? "success"
//                 : "error"
//             }`}
//           >
//             {message.text}
//           </div>
//         )}

//         {/* FORM */}
//         <form onSubmit={handleSubmit}>
//           {/* EMPLOYEE ID */}
//           <div className="common-login-field">
//             <label htmlFor="common-login-employee-id">
//               Employee ID <span>*</span>
//             </label>

//             <input
//               id="common-login-employee-id"
//               type="text"
//               name="employeeId"
//               value={form.employeeId}
//               onChange={handleChange}
//               placeholder="Enter employee ID"
//               disabled={saving}
//               autoComplete="off"
//               required
//             />
//           </div>

//           {/* NAME + EMAIL */}
//           <div className="common-login-grid">
//             <div className="common-login-field">
//               <label htmlFor="common-login-name">
//                 Name <span>*</span>
//               </label>

//               <input
//                 id="common-login-name"
//                 type="text"
//                 name="name"
//                 value={form.name}
//                 onChange={handleChange}
//                 placeholder="Enter employee name"
//                 disabled={saving}
//                 autoComplete="name"
//                 required
//               />
//             </div>

//             <div className="common-login-field">
//               <label htmlFor="common-login-email">
//                 Email <span>*</span>
//               </label>

//               <input
//                 id="common-login-email"
//                 type="email"
//                 name="email"
//                 value={form.email}
//                 onChange={handleChange}
//                 placeholder="Enter employee email"
//                 disabled={saving}
//                 autoComplete="email"
//                 required
//               />
//             </div>
//           </div>

//           {/* PASSWORD */}
//           <div className="common-login-grid">
//             <div className="common-login-field">
//               <label htmlFor="common-login-password">
//                 Password <span>*</span>
//               </label>

//               <input
//                 id="common-login-password"
//                 type="password"
//                 name="password"
//                 value={form.password}
//                 onChange={handleChange}
//                 placeholder="Enter password"
//                 disabled={saving}
//                 autoComplete="new-password"
//                 minLength={6}
//                 required
//               />
//             </div>

//             <div className="common-login-field">
//               <label htmlFor="common-login-confirm-password">
//                 Confirm Password <span>*</span>
//               </label>

//               <input
//                 id="common-login-confirm-password"
//                 type="password"
//                 name="confirmPassword"
//                 value={form.confirmPassword}
//                 onChange={handleChange}
//                 placeholder="Confirm password"
//                 disabled={saving}
//                 autoComplete="new-password"
//                 minLength={6}
//                 required
//               />
//             </div>
//           </div>

//           {/* STATUS */}
//           <div className="common-login-status">
//             <label className="common-login-switch">
//               <input
//                 type="checkbox"
//                 name="isActive"
//                 checked={form.isActive}
//                 onChange={handleChange}
//                 disabled={saving}
//               />

//               <span className="common-login-slider"></span>
//             </label>

//             <div>
//               <strong>Active Login</strong>
//               <p>
//                 Allow this employee to use the common login.
//               </p>
//             </div>
//           </div>

//           {/* ACTIONS */}
//           <div className="common-login-actions">
//             <button
//               type="button"
//               className="common-login-reset"
//               onClick={handleReset}
//               disabled={saving}
//             >
//               Reset
//             </button>

//             <button
//               type="submit"
//               className="common-login-save"
//               disabled={saving}
//             >
//               {saving ? "Saving..." : "Save Login"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }


// "use client";

// import React, { useState } from "react";
// import "./CommonLoginForm.css";
// import { useAuth } from "../../context/AuthProvider.client";

// const BACKEND_URL =
//   process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

// const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

// const INITIAL_FORM = {
//   name: "",
//   email: "",
//   location: "",
//   pincode: "",
//   password: "",
//   confirmPassword: "",
//   isActive: true,
// };

// export default function CommonLoginForm() {
//   const auth = useAuth() || {};

//   // Resolve organization from the current authentication context.
//   const orgId =
//     auth.orgId ||
//     auth.org_id ||
//     auth.raw?.orgId ||
//     auth.raw?.org_id ||
//     auth.user?.orgId ||
//     auth.user?.org_id ||
//     auth.user?.organisation_id ||
//     "";

//   const employeeId =
//     auth.employeeId ||
//     auth.employee_id ||
//     auth.id ||
//     auth.raw?.employeeId ||
//     auth.raw?.employee_id ||
//     auth.user?.employeeId ||
//     auth.user?.employee_id ||
//     "";

//   const [saving, setSaving] = useState(false);
//   const [form, setForm] = useState({ ...INITIAL_FORM });

//   const [message, setMessage] = useState({
//     type: "",
//     text: "",
//   });

//   // ============================================================
//   // INPUT CHANGE
//   // ============================================================

//   const handleChange = (event) => {
//     const { name, value, type, checked } = event.target;

//     setForm((previous) => ({
//       ...previous,
//       [name]: type === "checkbox" ? checked : value,
//     }));

//     setMessage({
//       type: "",
//       text: "",
//     });
//   };

//   // ============================================================
//   // CREATE COMMON LOGIN
//   // ============================================================

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     setMessage({
//       type: "",
//       text: "",
//     });

//     const resolvedOrgId = String(orgId || "").trim();

//     if (!resolvedOrgId) {
//       console.error(
//         "[CommonLogin] Organization ID missing from auth context",
//         {
//           orgId: auth.orgId,
//           org_id: auth.org_id,
//           raw: auth.raw,
//           user: auth.user,
//         }
//       );

//       setMessage({
//         type: "error",
//         text:
//           "Organization ID is missing from your login session. " +
//           "Please refresh the page and log in again.",
//       });

//       return;
//     }

//     if (!form.name.trim()) {
//       setMessage({
//         type: "error",
//         text: "Name is required.",
//       });
//       return;
//     }

//     if (!form.email.trim()) {
//       setMessage({
//         type: "error",
//         text: "Email is required.",
//       });
//       return;
//     }

//     if (!form.location.trim()) {
//       setMessage({
//         type: "error",
//         text: "Location is required.",
//       });
//       return;
//     }

//     const normalizedPincode = form.pincode.trim();

//     if (!/^\d{6}$/.test(normalizedPincode)) {
//       setMessage({
//         type: "error",
//         text: "Pincode must contain exactly 6 digits.",
//       });
//       return;
//     }

//     if (!form.password) {
//       setMessage({
//         type: "error",
//         text: "Password is required.",
//       });
//       return;
//     }

//     if (form.password.length < 6) {
//       setMessage({
//         type: "error",
//         text: "Password must contain at least 6 characters.",
//       });
//       return;
//     }

//     if (form.password !== form.confirmPassword) {
//       setMessage({
//         type: "error",
//         text: "Passwords do not match.",
//       });
//       return;
//     }

//     try {
//       setSaving(true);

//       console.log("[CommonLogin] Creating login", {
//         orgId: resolvedOrgId,
//         email: form.email.trim(),
//         location: form.location.trim(),
//         pincode: normalizedPincode,
//       });

//       const response = await fetch(
//         `${BACKEND_URL}/api/common-login`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": API_KEY,
//             "x-employee-id": String(employeeId || "0"),
//             "x-org-id": resolvedOrgId,
//           },
//           credentials: "include",
//           body: JSON.stringify({
//             orgId: resolvedOrgId,
//             name: form.name.trim(),
//             email: form.email.trim(),
//             location: form.location.trim(),
//             pincode: normalizedPincode,
//             password: form.password,
//             isActive: form.isActive,
//           }),
//         }
//       );

//       const data = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         const errorMessage =
//           typeof data.message === "string"
//             ? data.message
//             : typeof data.error === "string"
//               ? data.error
//               : typeof data.message?.message === "string"
//                 ? data.message.message
//                 : `Failed to create common login (${response.status})`;

//         throw new Error(errorMessage);
//       }

//       setMessage({
//         type: "success",
//         text: "Common login details saved successfully.",
//       });

//       setForm({ ...INITIAL_FORM });
//     } catch (error) {
//       console.error("[CommonLogin] Create error:", error);

//       setMessage({
//         type: "error",
//         text:
//           error?.message ||
//           "Unable to save common login details.",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ============================================================
//   // RESET
//   // ============================================================

//   const handleReset = () => {
//     setForm({ ...INITIAL_FORM });

//     setMessage({
//       type: "",
//       text: "",
//     });
//   };

//   // ============================================================
//   // UI
//   // ============================================================

//   return (
//     <div className="common-login-page">
//       <div className="common-login-card">
//         {/* HEADER */}
//         <div className="common-login-header">
//           <div>
//             <h2>Common Login</h2>
//             <p>
//               Create common login credentials
//             </p>
//           </div>
//         </div>

//         {/* MESSAGE */}
//         {message.text && (
//           <div
//             role="alert"
//             className={`common-login-message ${
//               message.type === "success"
//                 ? "success"
//                 : "error"
//             }`}
//           >
//             {message.text}
//           </div>
//         )}

//         {/* FORM */}
//         <form onSubmit={handleSubmit}>
//           {/* NAME + EMAIL */}
//           <div className="common-login-grid">
//             <div className="common-login-field">
//               <label htmlFor="common-login-name">
//                 Name <span>*</span>
//               </label>

//               <input
//                 id="common-login-name"
//                 type="text"
//                 name="name"
//                 value={form.name}
//                 onChange={handleChange}
//                 placeholder="Enter name"
//                 disabled={saving}
//                 autoComplete="name"
//                 required
//               />
//             </div>

//             <div className="common-login-field">
//               <label htmlFor="common-login-email">
//                 Email <span>*</span>
//               </label>

//               <input
//                 id="common-login-email"
//                 type="email"
//                 name="email"
//                 value={form.email}
//                 onChange={handleChange}
//                 placeholder="Enter email"
//                 disabled={saving}
//                 autoComplete="email"
//                 required
//               />
//             </div>
//           </div>

//           {/* LOCATION + PINCODE */}
//           <div className="common-login-grid">
//             <div className="common-login-field">
//               <label htmlFor="common-login-location">
//                 Location <span>*</span>
//               </label>

//               <input
//                 id="common-login-location"
//                 type="text"
//                 name="location"
//                 value={form.location}
//                 onChange={handleChange}
//                 placeholder="Enter city or location"
//                 disabled={saving}
//                 autoComplete="address-level2"
//                 maxLength={255}
//                 required
//               />
//             </div>

//             <div className="common-login-field">
//               <label htmlFor="common-login-pincode">
//                 Pincode <span>*</span>
//               </label>

//               <input
//                 id="common-login-pincode"
//                 type="text"
//                 name="pincode"
//                 value={form.pincode}
//                 onChange={(event) => {
//                   const value = event.target.value
//                     .replace(/\D/g, "")
//                     .slice(0, 6);

//                   setForm((previous) => ({
//                     ...previous,
//                     pincode: value,
//                   }));

//                   setMessage({
//                     type: "",
//                     text: "",
//                   });
//                 }}
//                 placeholder="Enter 6-digit pincode"
//                 disabled={saving}
//                 autoComplete="postal-code"
//                 inputMode="numeric"
//                 maxLength={6}
//                 pattern="[0-9]{6}"
//                 required
//               />
//             </div>
//           </div>

//           {/* PASSWORD */}
//           <div className="common-login-grid">
//             <div className="common-login-field">
//               <label htmlFor="common-login-password">
//                 Password <span>*</span>
//               </label>

//               <input
//                 id="common-login-password"
//                 type="password"
//                 name="password"
//                 value={form.password}
//                 onChange={handleChange}
//                 placeholder="Enter password"
//                 disabled={saving}
//                 autoComplete="new-password"
//                 minLength={6}
//                 required
//               />
//             </div>

//             <div className="common-login-field">
//               <label htmlFor="common-login-confirm-password">
//                 Confirm Password <span>*</span>
//               </label>

//               <input
//                 id="common-login-confirm-password"
//                 type="password"
//                 name="confirmPassword"
//                 value={form.confirmPassword}
//                 onChange={handleChange}
//                 placeholder="Confirm password"
//                 disabled={saving}
//                 autoComplete="new-password"
//                 minLength={6}
//                 required
//               />
//             </div>
//           </div>

//           {/* STATUS */}
//           <div className="common-login-status">
//             <label className="common-login-switch">
//               <input
//                 type="checkbox"
//                 name="isActive"
//                 checked={form.isActive}
//                 onChange={handleChange}
//                 disabled={saving}
//               />

//               <span className="common-login-slider"></span>
//             </label>

//             <div>
//               <strong>Active Login</strong>
//               <p>
//                 Allow this user to use the common login.
//               </p>
//             </div>
//           </div>

//           {/* ACTIONS */}
//           <div className="common-login-actions">
//             <button
//               type="button"
//               className="common-login-reset"
//               onClick={handleReset}
//               disabled={saving}
//             >
//               Reset
//             </button>

//             <button
//               type="submit"
//               className="common-login-save"
//               disabled={saving}
//             >
//               {saving ? "Saving..." : "Save Login"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }


// "use client";

// import React, { useCallback, useEffect, useState } from "react";
// import "./CommonLoginForm.css";
// import { useAuth } from "../../context/AuthProvider.client";

// const BACKEND_URL = (
//   process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"
// ).replace(/\/+$/, "");

// const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
// const API_URL = `${BACKEND_URL}/api/common-login`;

// const INITIAL_FORM = {
//   name: "",
//   email: "",
//   location: "",
//   pincode: "",
//   password: "",
//   confirmPassword: "",
//   isActive: true,
// };

// function isRecordActive(record) {
//   return (
//     record?.is_active === true ||
//     record?.is_active === 1 ||
//     record?.is_active === "1" ||
//     record?.isActive === true ||
//     record?.isActive === 1 ||
//     record?.isActive === "1"
//   );
// }

// function getErrorMessage(data, fallback) {
//   if (typeof data?.message === "string") return data.message;
//   if (typeof data?.error === "string") return data.error;
//   if (typeof data?.message?.message === "string") {
//     return data.message.message;
//   }
//   return fallback;
// }

// export default function CommonLoginForm() {
//   const auth = useAuth() || {};

//   const orgId =
//     auth.orgId ||
//     auth.org_id ||
//     auth.raw?.orgId ||
//     auth.raw?.org_id ||
//     auth.user?.orgId ||
//     auth.user?.org_id ||
//     auth.user?.organisation_id ||
//     "";

//   const employeeId =
//     auth.employeeId ||
//     auth.employee_id ||
//     auth.id ||
//     auth.raw?.employeeId ||
//     auth.raw?.employee_id ||
//     auth.user?.employeeId ||
//     auth.user?.employee_id ||
//     "";

//   const [form, setForm] = useState({ ...INITIAL_FORM });
//   const [editingId, setEditingId] = useState(null);

//   const [records, setRecords] = useState([]);
//   const [loadingList, setLoadingList] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [changingStatusId, setChangingStatusId] = useState(null);

//   const [message, setMessage] = useState({
//     type: "",
//     text: "",
//   });

//   const [search, setSearch] = useState("");

//   const resolvedOrgId = String(orgId || "").trim();

//   const getHeaders = useCallback(
//     () => ({
//       "Content-Type": "application/json",
//       "x-api-key": API_KEY,
//       "x-employee-id": String(employeeId || "0"),
//       "x-org-id": resolvedOrgId,
//     }),
//     [employeeId, resolvedOrgId]
//   );

//   const request = useCallback(
//     async (url, options = {}) => {
//       const response = await fetch(url, {
//         credentials: "include",
//         ...options,
//         headers: {
//           ...getHeaders(),
//           ...(options.headers || {}),
//         },
//       });

//       const data = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         throw new Error(
//           getErrorMessage(
//             data,
//             `Request failed (${response.status})`
//           )
//         );
//       }

//       return data;
//     },
//     [getHeaders]
//   );

//   // ------------------------------------------------------------
//   // LOAD EXISTING COMMON LOGINS
//   // ------------------------------------------------------------

//   const loadRecords = useCallback(async () => {
//     if (!resolvedOrgId) {
//       setRecords([]);
//       return;
//     }

//     try {
//       setLoadingList(true);

//       const data = await request(API_URL, {
//         method: "GET",
//       });

//       const result =
//         Array.isArray(data?.message)
//           ? data.message
//           : Array.isArray(data?.data)
//             ? data.data
//             : Array.isArray(data?.records)
//               ? data.records
//               : Array.isArray(data?.message?.records)
//                 ? data.message.records
//                 : [];

//       setRecords(result);
//     } catch (error) {
//       console.error("[CommonLogin] List error:", error);

//       setMessage({
//         type: "error",
//         text: error.message || "Unable to load common login records.",
//       });
//     } finally {
//       setLoadingList(false);
//     }
//   }, [request, resolvedOrgId]);

//   useEffect(() => {
//     loadRecords();
//   }, [loadRecords]);

//   // ------------------------------------------------------------
//   // FORM INPUTS
//   // ------------------------------------------------------------

//   const handleChange = (event) => {
//     const { name, value, type, checked } = event.target;

//     setForm((previous) => ({
//       ...previous,
//       [name]: type === "checkbox" ? checked : value,
//     }));

//     setMessage({ type: "", text: "" });
//   };

//   const resetForm = () => {
//     setForm({ ...INITIAL_FORM });
//     setEditingId(null);
//     setMessage({ type: "", text: "" });
//   };

//   // ------------------------------------------------------------
//   // EDIT EXISTING RECORD
//   // ------------------------------------------------------------

//   const handleEdit = (record) => {
//     const id = record.id ?? record.common_login_id;

//     if (id == null) {
//       setMessage({
//         type: "error",
//         text: "This record does not contain a login ID.",
//       });
//       return;
//     }

//     setEditingId(id);

//     setForm({
//       name: record.name || "",
//       email: record.email || "",
//       location: record.location || "",
//       pincode: String(record.pincode || ""),
//       password: "",
//       confirmPassword: "",
//       isActive: isRecordActive(record),
//     });

//     setMessage({ type: "", text: "" });

//     if (typeof window !== "undefined") {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   // ------------------------------------------------------------
//   // CREATE OR UPDATE
//   // ------------------------------------------------------------

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     setMessage({ type: "", text: "" });

//     if (!resolvedOrgId) {
//       setMessage({
//         type: "error",
//         text: "Organization ID is missing. Please log in again.",
//       });
//       return;
//     }

//     if (!form.name.trim()) {
//       setMessage({ type: "error", text: "Name is required." });
//       return;
//     }

//     if (!form.email.trim()) {
//       setMessage({ type: "error", text: "Email is required." });
//       return;
//     }

//     if (!form.location.trim()) {
//       setMessage({ type: "error", text: "Location is required." });
//       return;
//     }

//     const normalizedPincode = form.pincode.trim();

//     if (!/^\d{6}$/.test(normalizedPincode)) {
//       setMessage({
//         type: "error",
//         text: "Pincode must contain exactly 6 digits.",
//       });
//       return;
//     }

//     // Password is required for creation, optional for editing.
//     if (!editingId && !form.password) {
//       setMessage({ type: "error", text: "Password is required." });
//       return;
//     }

//     if (form.password && form.password.length < 6) {
//       setMessage({
//         type: "error",
//         text: "Password must contain at least 6 characters.",
//       });
//       return;
//     }

//     if (form.password !== form.confirmPassword) {
//       setMessage({
//         type: "error",
//         text: "Passwords do not match.",
//       });
//       return;
//     }

//     const payload = {
//       orgId: resolvedOrgId,
//       name: form.name.trim(),
//       email: form.email.trim(),
//       location: form.location.trim(),
//       pincode: normalizedPincode,
//       isActive: form.isActive,
//     };

//     // Do not send a blank password when editing.
//     if (form.password) {
//       payload.password = form.password;
//     }

//     try {
//       setSaving(true);

//       const isEditing = editingId !== null;
//       const url = isEditing
//         ? `${API_URL}/${encodeURIComponent(editingId)}`
//         : API_URL;

//       const data = await request(url, {
//         method: isEditing ? "PUT" : "POST",
//         body: JSON.stringify(payload),
//       });

//       setMessage({
//         type: "success",
//         text: isEditing
//           ? "Common login details updated successfully."
//           : "Common login details created successfully.",
//       });

//       setForm({ ...INITIAL_FORM });
//       setEditingId(null);

//       await loadRecords();

//       console.log("[CommonLogin] Save successful:", data);
//     } catch (error) {
//       console.error("[CommonLogin] Save error:", error);

//       setMessage({
//         type: "error",
//         text: error.message || "Unable to save common login details.",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ------------------------------------------------------------
//   // ACTIVATE / DEACTIVATE LOGIN
//   // ------------------------------------------------------------

//   const handleToggleStatus = async (record) => {
//     const id = record.id ?? record.common_login_id;

//     if (id == null) return;

//     const currentlyActive = isRecordActive(record);
//     const action = currentlyActive ? "disable" : "enable";

//     try {
//       setChangingStatusId(id);
//       setMessage({ type: "", text: "" });

//       await request(`${API_URL}/${encodeURIComponent(id)}/${action}`, {
//         method: "PATCH",
//         body: JSON.stringify({ orgId: resolvedOrgId }),
//       });

//       setMessage({
//         type: "success",
//         text: currentlyActive
//           ? "Common login deactivated successfully."
//           : "Common login activated successfully.",
//       });

//       await loadRecords();
//     } catch (error) {
//       console.error("[CommonLogin] Status update error:", error);

//       setMessage({
//         type: "error",
//         text: error.message || "Unable to update login status.",
//       });
//     } finally {
//       setChangingStatusId(null);
//     }
//   };

//   // ------------------------------------------------------------
//   // FILTER LIST
//   // ------------------------------------------------------------

//   const filteredRecords = records.filter((record) => {
//     const query = search.trim().toLowerCase();

//     if (!query) return true;

//     return [
//       record.name,
//       record.email,
//       record.location,
//       record.pincode,
//     ].some((value) =>
//       String(value || "").toLowerCase().includes(query)
//     );
//   });

//   // ------------------------------------------------------------
//   // UI
//   // ------------------------------------------------------------

//   return (
//     <div className="common-login-page">
//       <div className="common-login-card">
//         <div className="common-login-header">
//           <div>
//             <h2>{editingId !== null ? "Edit Common Login" : "Common Login"}</h2>
//             <p>
//               {editingId !== null
//                 ? "Update the selected login details"
//                 : "Create common login credentials"}
//             </p>
//           </div>
//         </div>

//         {message.text && (
//           <div
//             role="alert"
//             className={`common-login-message ${
//               message.type === "success" ? "success" : "error"
//             }`}
//           >
//             {message.text}
//           </div>
//         )}

//         <form onSubmit={handleSubmit}>
//           <div className="common-login-grid">
//             <div className="common-login-field">
//               <label htmlFor="common-login-name">
//                 Name <span>*</span>
//               </label>
//               <input
//                 id="common-login-name"
//                 type="text"
//                 name="name"
//                 value={form.name}
//                 onChange={handleChange}
//                 placeholder="Enter name"
//                 disabled={saving}
//                 autoComplete="name"
//                 maxLength={255}
//                 required
//               />
//             </div>

//             <div className="common-login-field">
//               <label htmlFor="common-login-email">
//                 Email <span>*</span>
//               </label>
//               <input
//                 id="common-login-email"
//                 type="email"
//                 name="email"
//                 value={form.email}
//                 onChange={handleChange}
//                 placeholder="Enter email"
//                 disabled={saving}
//                 autoComplete="email"
//                 maxLength={255}
//                 required
//               />
//             </div>
//           </div>

//           <div className="common-login-grid">
//             <div className="common-login-field">
//               <label htmlFor="common-login-location">
//                 Location <span>*</span>
//               </label>
//               <input
//                 id="common-login-location"
//                 type="text"
//                 name="location"
//                 value={form.location}
//                 onChange={handleChange}
//                 placeholder="Enter city or location"
//                 disabled={saving}
//                 autoComplete="address-level2"
//                 maxLength={255}
//                 required
//               />
//             </div>

//             <div className="common-login-field">
//               <label htmlFor="common-login-pincode">
//                 Pincode <span>*</span>
//               </label>
//               <input
//                 id="common-login-pincode"
//                 type="text"
//                 name="pincode"
//                 value={form.pincode}
//                 onChange={(event) => {
//                   const value = event.target.value
//                     .replace(/\D/g, "")
//                     .slice(0, 6);

//                   setForm((previous) => ({
//                     ...previous,
//                     pincode: value,
//                   }));

//                   setMessage({ type: "", text: "" });
//                 }}
//                 placeholder="Enter 6-digit pincode"
//                 disabled={saving}
//                 autoComplete="postal-code"
//                 inputMode="numeric"
//                 maxLength={6}
//                 pattern="[0-9]{6}"
//                 required
//               />
//             </div>
//           </div>

//           <div className="common-login-grid">
//             <div className="common-login-field">
//               <label htmlFor="common-login-password">
//                 Password {editingId === null && <span>*</span>}
//               </label>
//               <input
//                 id="common-login-password"
//                 type="password"
//                 name="password"
//                 value={form.password}
//                 onChange={handleChange}
//                 placeholder={
//                   editingId !== null
//                     ? "Leave blank to keep current password"
//                     : "Enter password"
//                 }
//                 disabled={saving}
//                 autoComplete="new-password"
//                 minLength={6}
//                 required={editingId === null}
//               />
//             </div>

//             <div className="common-login-field">
//               <label htmlFor="common-login-confirm-password">
//                 Confirm Password {editingId === null && <span>*</span>}
//               </label>
//               <input
//                 id="common-login-confirm-password"
//                 type="password"
//                 name="confirmPassword"
//                 value={form.confirmPassword}
//                 onChange={handleChange}
//                 placeholder={
//                   editingId !== null
//                     ? "Confirm new password if changing"
//                     : "Confirm password"
//                 }
//                 disabled={saving}
//                 autoComplete="new-password"
//                 minLength={6}
//                 required={editingId === null || Boolean(form.password)}
//               />
//             </div>
//           </div>

//           <div className="common-login-status">
//             <label className="common-login-switch">
//               <input
//                 type="checkbox"
//                 name="isActive"
//                 checked={form.isActive}
//                 onChange={handleChange}
//                 disabled={saving}
//               />
//               <span className="common-login-slider"></span>
//             </label>

//             <div>
//               <strong>Active Login</strong>
//               <p>Allow this user to use the common login.</p>
//             </div>
//           </div>

//           <div className="common-login-actions">
//             <button
//               type="button"
//               className="common-login-reset"
//               onClick={resetForm}
//               disabled={saving}
//             >
//               {editingId !== null ? "Cancel Edit" : "Reset"}
//             </button>

//             <button
//               type="submit"
//               className="common-login-save"
//               disabled={saving}
//             >
//               {saving
//                 ? "Saving..."
//                 : editingId !== null
//                   ? "Save Changes"
//                   : "Save Login"}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* EXISTING COMMON LOGINS */}
//       <div className="common-login-list-card">
//         <div className="common-login-list-header">
//           <div>
//             <h2>Common Login List</h2>
//             <p>View and manage created login accounts.</p>
//           </div>

//           <button
//             type="button"
//             className="common-login-refresh"
//             onClick={loadRecords}
//             disabled={loadingList || !resolvedOrgId}
//           >
//             {loadingList ? "Loading..." : "Refresh"}
//           </button>
//         </div>

//         <div className="common-login-list-toolbar">
//           <input
//             type="search"
//             aria-label="Search common logins"
//             placeholder="Search name, email, location or pincode"
//             value={search}
//             onChange={(event) => setSearch(event.target.value)}
//           />

//           <span>{filteredRecords.length} record(s)</span>
//         </div>

//         <div className="common-login-table-wrapper">
//           <table className="common-login-table">
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>Email</th>
//                 <th>Location</th>
//                 <th>Pincode</th>
//                 <th>Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {loadingList && records.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="common-login-empty">
//                     Loading common logins...
//                   </td>
//                 </tr>
//               ) : filteredRecords.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="common-login-empty">
//                     {search
//                       ? "No matching common logins found."
//                       : "No common login records found."}
//                   </td>
//                 </tr>
//               ) : (
//                 filteredRecords.map((record) => {
//                   const id = record.id ?? record.common_login_id;
//                   const active = isRecordActive(record);

//                   return (
//                     <tr key={id}>
//                       <td>{record.name || "—"}</td>
//                       <td>{record.email || "—"}</td>
//                       <td>{record.location || "—"}</td>
//                       <td>{record.pincode || "—"}</td>
//                       <td>
//                         <span
//                           className={`common-login-status-badge ${
//                             active ? "active" : "inactive"
//                           }`}
//                         >
//                           {active ? "Active" : "Inactive"}
//                         </span>
//                       </td>
//                       <td>
//                         <div className="common-login-row-actions">
//                           <button
//                             type="button"
//                             className="common-login-edit"
//                             onClick={() => handleEdit(record)}
//                             disabled={
//                               saving || changingStatusId !== null
//                             }
//                           >
//                             Edit
//                           </button>

//                           <button
//                             type="button"
//                             className={
//                               active
//                                 ? "common-login-deactivate"
//                                 : "common-login-activate"
//                             }
//                             onClick={() => handleToggleStatus(record)}
//                             disabled={
//                               saving ||
//                               changingStatusId === id ||
//                               changingStatusId !== null
//                             }
//                           >
//                             {changingStatusId === id
//                               ? "Updating..."
//                               : active
//                                 ? "Deactivate"
//                                 : "Activate"}
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// "use client";

// import React, { useCallback, useEffect, useState } from "react";
// import "./CommonLoginForm.css";
// import { useAuth } from "../../context/AuthProvider.client";

// const BACKEND_URL = (
//   process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"
// ).replace(/\/+$/, "");

// const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
// const API_URL = `${BACKEND_URL}/api/common-login`;

// const INITIAL_FORM = {
//   name: "",
//   email: "",
//   location: "",
//   pincode: "",
//   password: "",
//   confirmPassword: "",
//   isActive: true,
// };

// function isRecordActive(record) {
//   return (
//     record?.is_active === true ||
//     record?.is_active === 1 ||
//     record?.is_active === "1" ||
//     record?.isActive === true ||
//     record?.isActive === 1 ||
//     record?.isActive === "1"
//   );
// }

// function getErrorMessage(data, fallback) {
//   if (typeof data?.message === "string") return data.message;
//   if (typeof data?.error === "string") return data.error;
//   if (typeof data?.message?.message === "string") {
//     return data.message.message;
//   }
//   return fallback;
// }

// export default function CommonLoginForm() {
//   const auth = useAuth() || {};

//   const orgId =
//     auth.orgId ||
//     auth.org_id ||
//     auth.raw?.orgId ||
//     auth.raw?.org_id ||
//     auth.user?.orgId ||
//     auth.user?.org_id ||
//     auth.user?.organisation_id ||
//     "";

//   const employeeId =
//     auth.employeeId ||
//     auth.employee_id ||
//     auth.id ||
//     auth.raw?.employeeId ||
//     auth.raw?.employee_id ||
//     auth.user?.employeeId ||
//     auth.user?.employee_id ||
//     "";

//   const [form, setForm] = useState({ ...INITIAL_FORM });
//   const [editingId, setEditingId] = useState(null);
//   const [showForm, setShowForm] = useState(false);

//   const [records, setRecords] = useState([]);
//   const [loadingList, setLoadingList] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [changingStatusId, setChangingStatusId] = useState(null);

//   const [message, setMessage] = useState({
//     type: "",
//     text: "",
//   });

//   const [search, setSearch] = useState("");

//   const resolvedOrgId = String(orgId || "").trim();

//   const getHeaders = useCallback(
//     () => ({
//       "Content-Type": "application/json",
//       "x-api-key": API_KEY,
//       "x-employee-id": String(employeeId || "0"),
//       "x-org-id": resolvedOrgId,
//     }),
//     [employeeId, resolvedOrgId]
//   );

//   const request = useCallback(
//     async (url, options = {}) => {
//       const response = await fetch(url, {
//         credentials: "include",
//         ...options,
//         headers: {
//           ...getHeaders(),
//           ...(options.headers || {}),
//         },
//       });

//       const data = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         throw new Error(
//           getErrorMessage(
//             data,
//             `Request failed (${response.status})`
//           )
//         );
//       }

//       return data;
//     },
//     [getHeaders]
//   );

//   // ------------------------------------------------------------
//   // LOAD EXISTING COMMON LOGINS
//   // ------------------------------------------------------------

//   const loadRecords = useCallback(async () => {
//     if (!resolvedOrgId) {
//       setRecords([]);
//       return;
//     }

//     try {
//       setLoadingList(true);

//       const data = await request(API_URL, {
//         method: "GET",
//       });

//       const result =
//         Array.isArray(data?.message)
//           ? data.message
//           : Array.isArray(data?.data)
//             ? data.data
//             : Array.isArray(data?.records)
//               ? data.records
//               : Array.isArray(data?.message?.records)
//                 ? data.message.records
//                 : [];

//       setRecords(result);
//     } catch (error) {
//       console.error("[CommonLogin] List error:", error);

//       setMessage({
//         type: "error",
//         text: error.message || "Unable to load common login records.",
//       });
//     } finally {
//       setLoadingList(false);
//     }
//   }, [request, resolvedOrgId]);

//   useEffect(() => {
//     loadRecords();
//   }, [loadRecords]);

//   // ------------------------------------------------------------
//   // FORM INPUTS
//   // ------------------------------------------------------------

//   const handleChange = (event) => {
//     const { name, value, type, checked } = event.target;

//     setForm((previous) => ({
//       ...previous,
//       [name]: type === "checkbox" ? checked : value,
//     }));

//     setMessage({ type: "", text: "" });
//   };

//   const resetForm = () => {
//     setForm({ ...INITIAL_FORM });
//     setEditingId(null);
//     setShowForm(false);
//     setMessage({ type: "", text: "" });
//   };

//   const handleCreateClick = () => {
//     setForm({ ...INITIAL_FORM });
//     setEditingId(null);
//     setShowForm(true);
//     setMessage({ type: "", text: "" });

//     if (typeof window !== "undefined") {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   // ------------------------------------------------------------
//   // EDIT EXISTING RECORD
//   // ------------------------------------------------------------

//   const handleEdit = (record) => {
//     const id = record.id ?? record.common_login_id;

//     if (id == null) {
//       setMessage({
//         type: "error",
//         text: "This record does not contain a login ID.",
//       });
//       return;
//     }

//     setEditingId(id);
//     setShowForm(true);

//     setForm({
//       name: record.name || "",
//       email: record.email || "",
//       location: record.location || "",
//       pincode: String(record.pincode || ""),
//       password: "",
//       confirmPassword: "",
//       isActive: isRecordActive(record),
//     });

//     setMessage({ type: "", text: "" });

//     if (typeof window !== "undefined") {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   // ------------------------------------------------------------
//   // CREATE OR UPDATE
//   // ------------------------------------------------------------

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     setMessage({ type: "", text: "" });

//     if (!resolvedOrgId) {
//       setMessage({
//         type: "error",
//         text: "Organization ID is missing. Please log in again.",
//       });
//       return;
//     }

//     if (!form.name.trim()) {
//       setMessage({ type: "error", text: "Name is required." });
//       return;
//     }

//     if (!form.email.trim()) {
//       setMessage({ type: "error", text: "Email is required." });
//       return;
//     }

//     if (!form.location.trim()) {
//       setMessage({ type: "error", text: "Location is required." });
//       return;
//     }

//     const normalizedPincode = form.pincode.trim();

//     if (!/^\d{6}$/.test(normalizedPincode)) {
//       setMessage({
//         type: "error",
//         text: "Pincode must contain exactly 6 digits.",
//       });
//       return;
//     }

//     // Password is required for creation, optional for editing.
//     if (!editingId && !form.password) {
//       setMessage({ type: "error", text: "Password is required." });
//       return;
//     }

//     if (form.password && form.password.length < 6) {
//       setMessage({
//         type: "error",
//         text: "Password must contain at least 6 characters.",
//       });
//       return;
//     }

//     if (form.password !== form.confirmPassword) {
//       setMessage({
//         type: "error",
//         text: "Passwords do not match.",
//       });
//       return;
//     }

//     const payload = {
//       orgId: resolvedOrgId,
//       name: form.name.trim(),
//       email: form.email.trim(),
//       location: form.location.trim(),
//       pincode: normalizedPincode,
//       isActive: form.isActive,
//     };

//     // Do not send a blank password when editing.
//     if (form.password) {
//       payload.password = form.password;
//     }

//     try {
//       setSaving(true);

//       const isEditing = editingId !== null;
//       const url = isEditing
//         ? `${API_URL}/${encodeURIComponent(editingId)}`
//         : API_URL;

//       const data = await request(url, {
//         method: isEditing ? "PUT" : "POST",
//         body: JSON.stringify(payload),
//       });

//       setMessage({
//         type: "success",
//         text: isEditing
//           ? "Common login details updated successfully."
//           : "Common login details created successfully.",
//       });

//       setForm({ ...INITIAL_FORM });
//       setEditingId(null);
//       setShowForm(false);

//       await loadRecords();

//       console.log("[CommonLogin] Save successful:", data);
//     } catch (error) {
//       console.error("[CommonLogin] Save error:", error);

//       setMessage({
//         type: "error",
//         text: error.message || "Unable to save common login details.",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ------------------------------------------------------------
//   // ACTIVATE / DEACTIVATE LOGIN
//   // ------------------------------------------------------------

//   const handleToggleStatus = async (record) => {
//     const id = record.id ?? record.common_login_id;

//     if (id == null) return;

//     const currentlyActive = isRecordActive(record);
//     const action = currentlyActive ? "disable" : "enable";

//     try {
//       setChangingStatusId(id);
//       setMessage({ type: "", text: "" });

//       await request(`${API_URL}/${encodeURIComponent(id)}/${action}`, {
//         method: "PATCH",
//         body: JSON.stringify({ orgId: resolvedOrgId }),
//       });

//       setMessage({
//         type: "success",
//         text: currentlyActive
//           ? "Common login deactivated successfully."
//           : "Common login activated successfully.",
//       });

//       await loadRecords();
//     } catch (error) {
//       console.error("[CommonLogin] Status update error:", error);

//       setMessage({
//         type: "error",
//         text: error.message || "Unable to update login status.",
//       });
//     } finally {
//       setChangingStatusId(null);
//     }
//   };

//   // ------------------------------------------------------------
//   // FILTER LIST
//   // ------------------------------------------------------------

//   const filteredRecords = records.filter((record) => {
//     const query = search.trim().toLowerCase();

//     if (!query) return true;

//     return [
//       record.name,
//       record.email,
//       record.location,
//       record.pincode,
//     ].some((value) =>
//       String(value || "").toLowerCase().includes(query)
//     );
//   });

//   // ------------------------------------------------------------
//   // UI
//   // ------------------------------------------------------------

//   return (
//     <div className="common-login-page">
//       {/* EXISTING COMMON LOGINS — always visible */}
//       <div className="common-login-list-card" style={{ marginTop: 0 }}>
//         <div className="common-login-list-header">
//           <div>
//             <h2>Common Login List</h2>
//             <p>View and manage created login accounts.</p>
//           </div>

//           <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
//             <button
//               type="button"
//               className="common-login-refresh"
//               onClick={loadRecords}
//               disabled={loadingList || !resolvedOrgId}
//             >
//               {loadingList ? "Loading..." : "Refresh"}
//             </button>

//             <button
//               type="button"
//               className="common-login-save"
//               onClick={handleCreateClick}
//               disabled={saving}
//               style={{ minWidth: "auto", height: "38px" }}
//             >
//               Create Common Login Credentials
//             </button>
//           </div>
//         </div>

//         {message.text && !showForm && (
//           <div
//             role="alert"
//             className={`common-login-message ${
//               message.type === "success" ? "success" : "error"
//             }`}
//             style={{ margin: "0 0 16px" }}
//           >
//             {message.text}
//           </div>
//         )}

//         <div className="common-login-list-toolbar">
//           <input
//             type="search"
//             aria-label="Search common logins"
//             placeholder="Search name, email, location or pincode"
//             value={search}
//             onChange={(event) => setSearch(event.target.value)}
//           />

//           <span>{filteredRecords.length} record(s)</span>
//         </div>

//         <div className="common-login-table-wrapper">
//           <table className="common-login-table">
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>Email</th>
//                 <th>Location</th>
//                 <th>Pincode</th>
//                 <th>Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {loadingList && records.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="common-login-empty">
//                     Loading common logins...
//                   </td>
//                 </tr>
//               ) : filteredRecords.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="common-login-empty">
//                     {search
//                       ? "No matching common logins found."
//                       : "No common login records found."}
//                   </td>
//                 </tr>
//               ) : (
//                 filteredRecords.map((record) => {
//                   const id = record.id ?? record.common_login_id;
//                   const active = isRecordActive(record);

//                   return (
//                     <tr key={id}>
//                       <td>{record.name || "—"}</td>
//                       <td>{record.email || "—"}</td>
//                       <td>{record.location || "—"}</td>
//                       <td>{record.pincode || "—"}</td>
//                       <td>
//                         <span
//                           className={`common-login-status-badge ${
//                             active ? "active" : "inactive"
//                           }`}
//                         >
//                           {active ? "Active" : "Inactive"}
//                         </span>
//                       </td>
//                       <td>
//                         <div className="common-login-row-actions">
//                           <button
//                             type="button"
//                             className="common-login-edit"
//                             onClick={() => handleEdit(record)}
//                             disabled={
//                               saving || changingStatusId !== null
//                             }
//                           >
//                             Edit
//                           </button>

//                           <button
//                             type="button"
//                             className={
//                               active
//                                 ? "common-login-deactivate"
//                                 : "common-login-activate"
//                             }
//                             onClick={() => handleToggleStatus(record)}
//                             disabled={
//                               saving ||
//                               changingStatusId === id ||
//                               changingStatusId !== null
//                             }
//                           >
//                             {changingStatusId === id
//                               ? "Updating..."
//                               : active
//                                 ? "Deactivate"
//                                 : "Activate"}
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* FORM — shown only when creating or editing */}
//       {showForm && (
//         <div className="common-login-card" style={{ marginTop: "24px" }}>
//           <div className="common-login-header">
//             <div>
//               <h2>
//                 {editingId !== null
//                   ? "Edit Common Login"
//                   : "Create Common Login Credentials"}
//               </h2>
//               <p>
//                 {editingId !== null
//                   ? "Update the selected login details"
//                   : "Create common login credentials"}
//               </p>
//             </div>
//           </div>

//           {message.text && (
//             <div
//               role="alert"
//               className={`common-login-message ${
//                 message.type === "success" ? "success" : "error"
//               }`}
//             >
//               {message.text}
//             </div>
//           )}

//           <form onSubmit={handleSubmit}>
//             <div className="common-login-grid">
//               <div className="common-login-field">
//                 <label htmlFor="common-login-name">
//                   Name <span>*</span>
//                 </label>
//                 <input
//                   id="common-login-name"
//                   type="text"
//                   name="name"
//                   value={form.name}
//                   onChange={handleChange}
//                   placeholder="Enter name"
//                   disabled={saving}
//                   autoComplete="name"
//                   maxLength={255}
//                   required
//                 />
//               </div>

//               <div className="common-login-field">
//                 <label htmlFor="common-login-email">
//                   Email <span>*</span>
//                 </label>
//                 <input
//                   id="common-login-email"
//                   type="email"
//                   name="email"
//                   value={form.email}
//                   onChange={handleChange}
//                   placeholder="Enter email"
//                   disabled={saving}
//                   autoComplete="email"
//                   maxLength={255}
//                   required
//                 />
//               </div>
//             </div>

//             <div className="common-login-grid">
//               <div className="common-login-field">
//                 <label htmlFor="common-login-location">
//                   Location <span>*</span>
//                 </label>
//                 <input
//                   id="common-login-location"
//                   type="text"
//                   name="location"
//                   value={form.location}
//                   onChange={handleChange}
//                   placeholder="Enter city or location"
//                   disabled={saving}
//                   autoComplete="address-level2"
//                   maxLength={255}
//                   required
//                 />
//               </div>

//               <div className="common-login-field">
//                 <label htmlFor="common-login-pincode">
//                   Pincode <span>*</span>
//                 </label>
//                 <input
//                   id="common-login-pincode"
//                   type="text"
//                   name="pincode"
//                   value={form.pincode}
//                   onChange={(event) => {
//                     const value = event.target.value
//                       .replace(/\D/g, "")
//                       .slice(0, 6);

//                     setForm((previous) => ({
//                       ...previous,
//                       pincode: value,
//                     }));

//                     setMessage({ type: "", text: "" });
//                   }}
//                   placeholder="Enter 6-digit pincode"
//                   disabled={saving}
//                   autoComplete="postal-code"
//                   inputMode="numeric"
//                   maxLength={6}
//                   pattern="[0-9]{6}"
//                   required
//                 />
//               </div>
//             </div>

//             <div className="common-login-grid">
//               <div className="common-login-field">
//                 <label htmlFor="common-login-password">
//                   Password {editingId === null && <span>*</span>}
//                 </label>
//                 <input
//                   id="common-login-password"
//                   type="password"
//                   name="password"
//                   value={form.password}
//                   onChange={handleChange}
//                   placeholder={
//                     editingId !== null
//                       ? "Leave blank to keep current password"
//                       : "Enter password"
//                   }
//                   disabled={saving}
//                   autoComplete="new-password"
//                   minLength={6}
//                   required={editingId === null}
//                 />
//               </div>

//               <div className="common-login-field">
//                 <label htmlFor="common-login-confirm-password">
//                   Confirm Password {editingId === null && <span>*</span>}
//                 </label>
//                 <input
//                   id="common-login-confirm-password"
//                   type="password"
//                   name="confirmPassword"
//                   value={form.confirmPassword}
//                   onChange={handleChange}
//                   placeholder={
//                     editingId !== null
//                       ? "Confirm new password if changing"
//                       : "Confirm password"
//                   }
//                   disabled={saving}
//                   autoComplete="new-password"
//                   minLength={6}
//                   required={editingId === null || Boolean(form.password)}
//                 />
//               </div>
//             </div>

//             <div className="common-login-status">
//               <label className="common-login-switch">
//                 <input
//                   type="checkbox"
//                   name="isActive"
//                   checked={form.isActive}
//                   onChange={handleChange}
//                   disabled={saving}
//                 />
//                 <span className="common-login-slider"></span>
//               </label>

//               <div>
//                 <strong>Active Login</strong>
//                 <p>Allow this user to use the common login.</p>
//               </div>
//             </div>

//             <div className="common-login-actions">
//               <button
//                 type="button"
//                 className="common-login-reset"
//                 onClick={resetForm}
//                 disabled={saving}
//               >
//                 Cancel
//               </button>

//               <button
//                 type="submit"
//                 className="common-login-save"
//                 disabled={saving}
//               >
//                 {saving
//                   ? "Saving..."
//                   : editingId !== null
//                     ? "Save Changes"
//                     : "Save Login"}
//               </button>
//             </div>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import React, { useCallback, useEffect, useState } from "react";
import "./CommonLoginForm.css";
import { useAuth } from "../../context/AuthProvider.client";
import Modal from "../Modal/Modal.client";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"
).replace(/\/+$/, "");

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
const API_URL = `${BACKEND_URL}/api/common-login`;

const INITIAL_FORM = {
  name: "",
  email: "",
  location: "",
  pincode: "",
  password: "",
  confirmPassword: "",
  isActive: true,
};

function isRecordActive(record) {
  return (
    record?.is_active === true ||
    record?.is_active === 1 ||
    record?.is_active === "1" ||
    record?.isActive === true ||
    record?.isActive === 1 ||
    record?.isActive === "1"
  );
}

function getErrorMessage(data, fallback) {
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.message?.message === "string") {
    return data.message.message;
  }
  return fallback;
}

export default function CommonLoginForm() {
  const auth = useAuth() || {};

  const orgId =
    auth.orgId ||
    auth.org_id ||
    auth.raw?.orgId ||
    auth.raw?.org_id ||
    auth.user?.orgId ||
    auth.user?.org_id ||
    auth.user?.organisation_id ||
    "";

  const employeeId =
    auth.employeeId ||
    auth.employee_id ||
    auth.id ||
    auth.raw?.employeeId ||
    auth.raw?.employee_id ||
    auth.user?.employeeId ||
    auth.user?.employee_id ||
    "";

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [records, setRecords] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState(null);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });
  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const [search, setSearch] = useState("");

  const resolvedOrgId = String(orgId || "").trim();

  const showAlert = (alertMessage, type = "success") => {
    setAlertModal({
      isVisible: true,
      message: alertMessage,
      type,
    });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, message: "", type: "success" });
  };

  const getHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "x-employee-id": String(employeeId || "0"),
      "x-org-id": resolvedOrgId,
    }),
    [employeeId, resolvedOrgId]
  );

  const request = useCallback(
    async (url, options = {}) => {
      const response = await fetch(url, {
        credentials: "include",
        ...options,
        headers: {
          ...getHeaders(),
          ...(options.headers || {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `Request failed (${response.status})`
          )
        );
      }

      return data;
    },
    [getHeaders]
  );

  // ------------------------------------------------------------
  // LOAD EXISTING COMMON LOGINS
  // ------------------------------------------------------------

  const loadRecords = useCallback(async () => {
    if (!resolvedOrgId) {
      setRecords([]);
      return;
    }

    try {
      setLoadingList(true);

      const data = await request(API_URL, {
        method: "GET",
      });

      const result =
        Array.isArray(data?.message)
          ? data.message
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.records)
              ? data.records
              : Array.isArray(data?.message?.records)
                ? data.message.records
                : [];

      setRecords(result);
    } catch (error) {
      console.error("[CommonLogin] List error:", error);

      setMessage({
        type: "error",
        text: error.message || "Unable to load common login records.",
      });
    } finally {
      setLoadingList(false);
    }
  }, [request, resolvedOrgId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showForm]);

  // ------------------------------------------------------------
  // FORM INPUTS
  // ------------------------------------------------------------

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMessage({ type: "", text: "" });
  };

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
    setShowForm(false);
    setMessage({ type: "", text: "" });
  };

  const handleCreateClick = () => {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
    setShowForm(true);
    setMessage({ type: "", text: "" });
  };

  // ------------------------------------------------------------
  // EDIT EXISTING RECORD
  // ------------------------------------------------------------

  const handleEdit = (record) => {
    const id = record.id ?? record.common_login_id;

    if (id == null) {
      setMessage({
        type: "error",
        text: "This record does not contain a login ID.",
      });
      return;
    }

    setEditingId(id);
    setShowForm(true);

    setForm({
      name: record.name || "",
      email: record.email || "",
      location: record.location || "",
      pincode: String(record.pincode || ""),
      password: "",
      confirmPassword: "",
      isActive: isRecordActive(record),
    });

    setMessage({ type: "", text: "" });
  };

  // ------------------------------------------------------------
  // CREATE OR UPDATE
  // ------------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage({ type: "", text: "" });

    if (!resolvedOrgId) {
      setMessage({
        type: "error",
        text: "Organization ID is missing. Please log in again.",
      });
      return;
    }

    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Name is required." });
      return;
    }

    if (!form.email.trim()) {
      setMessage({ type: "error", text: "Email is required." });
      return;
    }

    if (!form.location.trim()) {
      setMessage({ type: "error", text: "Location is required." });
      return;
    }

    const normalizedPincode = form.pincode.trim();

    if (!/^\d{6}$/.test(normalizedPincode)) {
      setMessage({
        type: "error",
        text: "Pincode must contain exactly 6 digits.",
      });
      return;
    }

    if (!editingId && !form.password) {
      setMessage({ type: "error", text: "Password is required." });
      return;
    }

    if (form.password && form.password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must contain at least 6 characters.",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }

    const payload = {
      orgId: resolvedOrgId,
      name: form.name.trim(),
      email: form.email.trim(),
      location: form.location.trim(),
      pincode: normalizedPincode,
      isActive: form.isActive,
    };

    if (form.password) {
      payload.password = form.password;
    }

    try {
      setSaving(true);

      const isEditing = editingId !== null;
      const url = isEditing
        ? `${API_URL}/${encodeURIComponent(editingId)}`
        : API_URL;

      const data = await request(url, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setMessage({ type: "", text: "" });
      showAlert(
        isEditing
          ? "Common login details updated successfully."
          : "Common login details created successfully."
      );

      setForm({ ...INITIAL_FORM });
      setEditingId(null);
      setShowForm(false);

      await loadRecords();

      console.log("[CommonLogin] Save successful:", data);
    } catch (error) {
      console.error("[CommonLogin] Save error:", error);

      setMessage({ type: "", text: "" });
      showAlert(
        error.message || "Unable to save common login details.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------
  // ACTIVATE / DEACTIVATE LOGIN
  // ------------------------------------------------------------

  const handleToggleStatus = async (record) => {
    const id = record.id ?? record.common_login_id;

    if (id == null) return;

    const currentlyActive = isRecordActive(record);
    const action = currentlyActive ? "disable" : "enable";

    try {
      setChangingStatusId(id);
      setMessage({ type: "", text: "" });

      await request(`${API_URL}/${encodeURIComponent(id)}/${action}`, {
        method: "PATCH",
        body: JSON.stringify({ orgId: resolvedOrgId }),
      });

      setMessage({ type: "", text: "" });
      showAlert(
        currentlyActive
          ? "Common login deactivated successfully."
          : "Common login activated successfully."
      );

      await loadRecords();
    } catch (error) {
      console.error("[CommonLogin] Status update error:", error);

      setMessage({ type: "", text: "" });
      showAlert(error.message || "Unable to update login status.", "error");
    } finally {
      setChangingStatusId(null);
    }
  };

  // ------------------------------------------------------------
  // FILTER LIST
  // ------------------------------------------------------------

  const filteredRecords = records.filter((record) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      record.name,
      record.email,
      record.location,
      record.pincode,
    ].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );
  });

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------

  return (
    <div className="common-login-page">
      {/* LIST — always visible */}
      <div className="common-login-list-card">
        <div className="common-login-list-header">
          <div>
            <h2>Common Login List</h2>
            <p>View and manage created login accounts.</p>
          </div>

          <div className="common-login-list-header-actions">
            <button
              type="button"
              className="common-login-refresh"
              onClick={loadRecords}
              disabled={loadingList || !resolvedOrgId}
            >
              {loadingList ? "Loading..." : "Refresh"}
            </button>

            <button
              type="button"
              className="common-login-create"
              onClick={handleCreateClick}
              disabled={saving}
            >
              Create Common Login Credentials
            </button>
          </div>
        </div>

        {message.text && !showForm && (
          <div
            role="alert"
            className={`common-login-list-message ${
              message.type === "success" ? "success" : "error"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="common-login-list-toolbar">
          <input
            type="search"
            aria-label="Search common logins"
            placeholder="Search name, email, location or pincode"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <span>{filteredRecords.length} record(s)</span>
        </div>

        <div className="common-login-table-wrapper">
          <table className="common-login-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Pincode</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loadingList && records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="common-login-empty">
                    Loading common logins...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="common-login-empty">
                    {search
                      ? "No matching common logins found."
                      : "No common login records found."}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const id = record.id ?? record.common_login_id;
                  const active = isRecordActive(record);

                  return (
                    <tr key={id}>
                      <td>{record.name || "—"}</td>
                      <td>{record.email || "—"}</td>
                      <td>{record.location || "—"}</td>
                      <td>{record.pincode || "—"}</td>
                      <td>
                        <span
                          className={`common-login-status-badge ${
                            active ? "active" : "inactive"
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="common-login-row-actions">
                          <button
                            type="button"
                            className="common-login-edit"
                            onClick={() => handleEdit(record)}
                            disabled={
                              saving || changingStatusId !== null
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={
                              active
                                ? "common-login-deactivate"
                                : "common-login-activate"
                            }
                            onClick={() => handleToggleStatus(record)}
                            disabled={
                              saving ||
                              changingStatusId === id ||
                              changingStatusId !== null
                            }
                          >
                            {changingStatusId === id
                              ? "Updating..."
                              : active
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL */}
      {showForm && (
        <div
          className="common-login-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              resetForm();
            }
          }}
        >
          <div className="common-login-modal">
            <div className="common-login-header">
              <div>
                <h2>
                  {editingId !== null
                    ? "Edit Common Login"
                    : "Create Common Login Credentials"}
                </h2>
                <p>
                  {editingId !== null
                    ? "Update the selected login details"
                    : "Create common login credentials"}
                </p>
              </div>

              <button
                type="button"
                className="common-login-modal-close"
                onClick={resetForm}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {message.text && (
              <div
                role="alert"
                className={`common-login-message ${
                  message.type === "success" ? "success" : "error"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="common-login-grid">
                <div className="common-login-field">
                  <label htmlFor="common-login-name">
                    Name <span>*</span>
                  </label>
                  <input
                    id="common-login-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter name"
                    disabled={saving}
                    autoComplete="name"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="common-login-field">
                  <label htmlFor="common-login-email">
                    Email <span>*</span>
                  </label>
                  <input
                    id="common-login-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    disabled={saving}
                    autoComplete="email"
                    maxLength={255}
                    required
                  />
                </div>
              </div>

              <div className="common-login-grid">
                <div className="common-login-field">
                  <label htmlFor="common-login-location">
                    Location <span>*</span>
                  </label>
                  <input
                    id="common-login-location"
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Enter city or location"
                    disabled={saving}
                    autoComplete="address-level2"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="common-login-field">
                  <label htmlFor="common-login-pincode">
                    Pincode <span>*</span>
                  </label>
                  <input
                    id="common-login-pincode"
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={(event) => {
                      const value = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                      setForm((previous) => ({
                        ...previous,
                        pincode: value,
                      }));

                      setMessage({ type: "", text: "" });
                    }}
                    placeholder="Enter 6-digit pincode"
                    disabled={saving}
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                  />
                </div>
              </div>

              <div className="common-login-grid">
                <div className="common-login-field">
                  <label htmlFor="common-login-password">
                    Password {editingId === null && <span>*</span>}
                  </label>
                  <input
                    id="common-login-password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={
                      editingId !== null
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    disabled={saving}
                    autoComplete="new-password"
                    minLength={6}
                    required={editingId === null}
                  />
                </div>

                <div className="common-login-field">
                  <label htmlFor="common-login-confirm-password">
                    Confirm Password {editingId === null && <span>*</span>}
                  </label>
                  <input
                    id="common-login-confirm-password"
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder={
                      editingId !== null
                        ? "Confirm new password if changing"
                        : "Confirm password"
                    }
                    disabled={saving}
                    autoComplete="new-password"
                    minLength={6}
                    required={editingId === null || Boolean(form.password)}
                  />
                </div>
              </div>

              <div className="common-login-status">
                <label className="common-login-switch">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <span className="common-login-slider"></span>
                </label>

                <div>
                  <strong>Active Login</strong>
                  <p>Allow this user to use the common login.</p>
                </div>
              </div>

              <div className="common-login-actions">
                <button
                  type="button"
                  className="common-login-reset"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="common-login-save"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save Changes"
                      : "Save Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p
          style={{
            textAlign: "center",
            fontSize: "16px",
            padding: "10px 0",
            color: alertModal.type === "error" ? "#dc2626" : "#111827",
          }}
        >
          {alertModal.message}
        </p>
      </Modal>
    </div>
  );
}