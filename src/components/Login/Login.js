// // // // // // // import React, { useState, useEffect } from "react";
// // // // // // // import { useNavigate } from "react-router-dom";
// // // // // // // import { FaEye, FaEyeSlash } from "react-icons/fa";
// // // // // // // import "./Login.css";
// // // // // // // import Modal from "../Modal/Modal";

// // // // // // // const Login = ({ onClose }) => {
// // // // // // //   const [username, setUsername] = useState("");
// // // // // // //   const [password, setPassword] = useState("");
// // // // // // //   const [showPassword, setShowPassword] = useState(false);
// // // // // // //   const [errorMessage, setErrorMessage] = useState("");
// // // // // // //   const [isModalOpen, setIsModalOpen] = useState(true);
// // // // // // //   const [idleModalVisible, setIdleModalVisible] = useState(false);
// // // // // // //   const navigate = useNavigate();

// // // // // // //   const toggleShowPassword = () => {
// // // // // // //     setShowPassword((prev) => !prev);
// // // // // // //   };

// // // // // // //   const [alertModal, setAlertModal] = useState({
// // // // // // //     isVisible: false,
// // // // // // //     title: "",
// // // // // // //     message: "",
// // // // // // //   });

// // // // // // //   // Check if user was logged out due to inactivity
// // // // // // //   useEffect(() => {
// // // // // // //     if (sessionStorage.getItem("loggedOutDueToInactivity")) {
// // // // // // //       setIdleModalVisible(true);
// // // // // // //       sessionStorage.removeItem("loggedOutDueToInactivity");
// // // // // // //     }
// // // // // // //   }, []);

// // // // // // //   const handleIdleModalClose = () => {
// // // // // // //     setIdleModalVisible(false);
// // // // // // //   };

// // // // // // //   const showAlert = (message, title = "") => {
// // // // // // //     setAlertModal({ isVisible: true, title, message });
// // // // // // //   };

// // // // // // //   const closeAlert = () => {
// // // // // // //     setAlertModal({ isVisible: false, title: "", message: "" });
// // // // // // //   };

// // // // // // //   const closeModal = () => {
// // // // // // //     setIsModalOpen(false);
// // // // // // //     if (onClose) onClose();
// // // // // // //   };

// // // // // // //   const handleForgotPassword = async () => {
// // // // // // //     if (!username) {
// // // // // // //       showAlert("Email ID is required to reset the password.");
// // // // // // //       return;
// // // // // // //     }
// // // // // // //     try {
// // // // // // //       const response = await fetch(
// // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/forgot-password`,
// // // // // // //         {
// // // // // // //           method: "POST",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //           },
// // // // // // //           body: JSON.stringify({ email: username }),
// // // // // // //         }
// // // // // // //       );
// // // // // // //       const data = await response.json();
// // // // // // //       response.ok
// // // // // // //         ? showAlert("Password reset email sent!")
// // // // // // //         : setErrorMessage(data.message || "Request failed");
// // // // // // //     } catch (error) {
// // // // // // //       setErrorMessage("An unexpected error occurred.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleSubmit = async (e) => {
// // // // // // //     e.preventDefault();
// // // // // // //     if (!username || !password) {
// // // // // // //       setErrorMessage("Username and password are required.");
// // // // // // //       return;
// // // // // // //     }
// // // // // // //     try {
// // // // // // //       const response = await fetch(
// // // // // // //         `${process.env.REACT_APP_BACKEND_URL}/login`,
// // // // // // //         {
// // // // // // //           method: "POST",
// // // // // // //           credentials: "include",
// // // // // // //           headers: {
// // // // // // //             "Content-Type": "application/json",
// // // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // // //           },
// // // // // // //           body: JSON.stringify({ email: username, password }),
// // // // // // //         }
// // // // // // //       );
// // // // // // //       const data = await response.json();

// // // // // // //       if (!response.ok) {
// // // // // // //         setErrorMessage(data.message || "Invalid credentials.");
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       localStorage.setItem("userRole", data.message.role);
// // // // // // //       localStorage.setItem("userName", data.message.name);
// // // // // // //       localStorage.setItem("userGender", data.message.gender);
// // // // // // //       localStorage.setItem(
// // // // // // //         "dashboardData",
// // // // // // //         JSON.stringify(data.message.dashboard)
// // // // // // //       );
// // // // // // //       localStorage.setItem(
// // // // // // //         "sidebarMenu",
// // // // // // //         JSON.stringify(data.message.sidebarMenu)
// // // // // // //       );
// // // // // // //       // Set lastActivity only on login
// // // // // // //       localStorage.setItem("lastActivity", Date.now());

// // // // // // //       closeModal();

// // // // // // //       // Check if username is manish.patil@gmail.com and role is general
// // // // // // //       if (
// // // // // // //        username.toLowerCase() === "sts.123@yopmail.com" &&
// // // // // // //         (data.message.role || "").toLowerCase() === "general"
// // // // // // //       ) {
// // // // // // //         navigate("/FacePunch");
// // // // // // //       } else {
// // // // // // //         navigate("/dashboard");
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       setErrorMessage("An unexpected error occurred.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     isModalOpen && (
// // // // // // //       <div className="login-page">
// // // // // // //         <div className="login-modal">
// // // // // // //           <div className="login-container">
// // // // // // //             <button className="login-close-button" onClick={closeModal}>
// // // // // // //               ×
// // // // // // //             </button>
// // // // // // //             <div className="login-image">
// // // // // // //               <img src="./images/ITService.png" alt="Login illustration" />
// // // // // // //             </div>
// // // // // // //             <div className="login-form">
// // // // // // //               <form onSubmit={handleSubmit}>
// // // // // // //                 <div className="login-logo">
// // // // // // //                   <img
// // // // // // //                     src="./images/Loginlogo.png"
// // // // // // //                     alt="Logo"
// // // // // // //                     className="login-logo-img"
// // // // // // //                   />
// // // // // // //                 </div>
// // // // // // //                 {/* Error Message Display */}
// // // // // // //                 {errorMessage && (
// // // // // // //                   <div className="error-messages">{errorMessage}</div>
// // // // // // //                 )}
// // // // // // //                 <div className="form-group">
// // // // // // //                   <label htmlFor="username">User Name</label>
// // // // // // //                   <input
// // // // // // //                     type="text"
// // // // // // //                     id="username"
// // // // // // //                     value={username}
// // // // // // //                     onChange={(e) => setUsername(e.target.value)}
// // // // // // //                     placeholder="Enter your username"
// // // // // // //                   />
// // // // // // //                 </div>
// // // // // // //                 <div className="form-group password-group">
// // // // // // //                   <label htmlFor="password">Password</label>
// // // // // // //                   <div className="password-input-wrapper">
// // // // // // //                     <input
// // // // // // //                       type={showPassword ? "text" : "password"}
// // // // // // //                       id="password"
// // // // // // //                       value={password}
// // // // // // //                       onChange={(e) => setPassword(e.target.value)}
// // // // // // //                       placeholder="Enter your password"
// // // // // // //                     />
// // // // // // //                     <span
// // // // // // //                       className="toggle-password-icon"
// // // // // // //                       onClick={toggleShowPassword}
// // // // // // //                       role="button"
// // // // // // //                       aria-label={
// // // // // // //                         showPassword ? "Hide password" : "Show password"
// // // // // // //                       }
// // // // // // //                       tabIndex={0}
// // // // // // //                       onKeyPress={(e) => {
// // // // // // //                         if (e.key === "Enter" || e.key === " ")
// // // // // // //                           toggleShowPassword();
// // // // // // //                       }}
// // // // // // //                     >
// // // // // // //                       {showPassword ? <FaEyeSlash /> : <FaEye />}
// // // // // // //                     </span>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //                 <div className="form-options">
// // // // // // //                   <a href="#" onClick={handleForgotPassword}>
// // // // // // //                     Forgot Password?
// // // // // // //                   </a>
// // // // // // //                 </div>
// // // // // // //                 <button type="submit" className="btn-login">
// // // // // // //                   Login
// // // // // // //                 </button>
// // // // // // //               </form>
// // // // // // //             </div>
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //         {idleModalVisible && (
// // // // // // //           <Modal
// // // // // // //             isVisible={idleModalVisible}
// // // // // // //             onClose={handleIdleModalClose}
// // // // // // //             buttons={[{ label: "OK", onClick: handleIdleModalClose }]}
// // // // // // //           >
// // // // // // //             <p>You have been logged out due to inactivity.</p>
// // // // // // //           </Modal>
// // // // // // //         )}
// // // // // // //         {/* Alert Modal for displaying messages */}
// // // // // // //         <Modal
// // // // // // //           isVisible={alertModal.isVisible}
// // // // // // //           onClose={closeAlert}
// // // // // // //           buttons={[{ label: "OK", onClick: closeAlert }]}
// // // // // // //         >
// // // // // // //           <p>{alertModal.message}</p>
// // // // // // //         </Modal>
// // // // // // //       </div>
// // // // // // //     )
// // // // // // //   );
// // // // // // // };

// // // // // // // export default Login;

// // // // // // import React, { useState } from 'react';
// // // // // // import './Home.css';

// // // // // // function Home() {
// // // // // //   const [username, setUsername] = useState('');
// // // // // //   const [password, setPassword] = useState('');
// // // // // //   const [errorMsg, setErrorMsg] = useState('');
// // // // // //   const [successMsg, setSuccessMsg] = useState('');

// // // // // //   const handleLogin = async (e) => {
// // // // // //     e.preventDefault();

// // // // // //     try {
// // // // // //       const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/login', {
// // // // // //         method: 'POST',
// // // // // //         headers: {
// // // // // //           'Content-Type': 'application/json',
// // // // // //           'x-api-key': process.env.REACT_APP_API_KEY,
// // // // // //         },
// // // // // //         body: JSON.stringify({ username, password }),
// // // // // //       });

// // // // // //       const data = await response.json();

// // // // // //       if (response.ok) {
// // // // // //         setSuccessMsg('Login successful!');
// // // // // //         setErrorMsg('');
// // // // // //         console.log('User data:', data);
// // // // // //       } else {
// // // // // //         setErrorMsg(data.message || 'Login failed');
// // // // // //         setSuccessMsg('');
// // // // // //       }
// // // // // //     } catch (error) {
// // // // // //       console.error('Login error:', error);
// // // // // //       setErrorMsg('Server error. Please try again later.');
// // // // // //       setSuccessMsg('');
// // // // // //     }
// // // // // //   };

// // // // // //   return (
// // // // // //     <div className="login-container">
// // // // // //       <div className="login-card">
// // // // // //         <div className="login-left">
// // // // // //           <h1>Welcome to</h1>
// // // // // //           <h2>Pulse work</h2>
// // // // // //           <p>
// // // // // //             PUNCH IN PUNCH OUT with Geolocation and face detection App Categorized Recruitment approval process with related...
// // // // // //           </p>
// // // // // //         </div>
// // // // // //         <div className="login-right">
// // // // // //           <h2>Sign Up</h2>
// // // // // //           <form onSubmit={handleLogin}>
// // // // // //             <div className="input-group">
// // // // // //               <input
// // // // // //                 type="text"
// // // // // //                 placeholder="Your user name"
// // // // // //                 value={username}
// // // // // //                 onChange={(e) => setUsername(e.target.value)}
// // // // // //               />
// // // // // //             </div>
// // // // // //             <div className="input-group">
// // // // // //               <input
// // // // // //                 type="password"
// // // // // //                 placeholder="Your password"
// // // // // //                 value={password}
// // // // // //                 onChange={(e) => setPassword(e.target.value)}
// // // // // //               />
// // // // // //             </div>
// // // // // //             <div className="form-options">
// // // // // //               <label>
// // // // // //                 <input type="checkbox" /> Remember Me
// // // // // //               </label>
// // // // // //               <a href="/">Forget Password?</a>
// // // // // //             </div>
// // // // // //             <div className="form-options">
// // // // // //               <label>
// // // // // //                 <input type="checkbox" /> I agree to the Terms of Service.
// // // // // //               </label>
// // // // // //             </div>
// // // // // //             {errorMsg && <p className="error-msg">{errorMsg}</p>}
// // // // // //             {successMsg && <p className="success-msg">{successMsg}</p>}
// // // // // //             <button type="submit" className="login-btn">Sign In</button>
// // // // // //           </form>
// // // // // //         </div>
// // // // // //       </div>
// // // // // //     </div>
// // // // // //   );
// // // // // // }

// // // // // // export default Home;


// // // // // // import React, { useState, useEffect } from "react";
// // // // // // import { useNavigate } from "react-router-dom";
// // // // // // import { FaEye, FaEyeSlash } from "react-icons/fa";
// // // // // // import Modal from "../Modal/Modal";
// // // // // // import "./Login.css";
// // // // // // import logo from "../../assets/images/sukalpalogo"; // Updated path

// // // // // // const Login = ({ onClose }) => {
// // // // // //   const [username, setUsername] = useState("");
// // // // // //   const [password, setPassword] = useState("");
// // // // // //   const [showPassword, setShowPassword] = useState(false);
// // // // // //   const [errorMessage, setErrorMessage] = useState("");
// // // // // //   const [isModalOpen, setIsModalOpen] = useState(true);
// // // // // //   const [idleModalVisible, setIdleModalVisible] = useState(false);
// // // // // //   const navigate = useNavigate();

// // // // // //   const toggleShowPassword = () => {
// // // // // //     setShowPassword((prev) => !prev);
// // // // // //   };

// // // // // //   const [alertModal, setAlertModal] = useState({
// // // // // //     isVisible: false,
// // // // // //     title: "",
// // // // // //     message: "",
// // // // // //   });

// // // // // //   useEffect(() => {
// // // // // //     if (sessionStorage.getItem("loggedOutDueToInactivity")) {
// // // // // //       setIdleModalVisible(true);
// // // // // //       sessionStorage.removeItem("loggedOutDueToInactivity");
// // // // // //     }
// // // // // //   }, []);

// // // // // //   const handleIdleModalClose = () => {
// // // // // //     setIdleModalVisible(false);
// // // // // //   };

// // // // // //   const showAlert = (message, title = "") => {
// // // // // //     setAlertModal({ isVisible: true, title, message });
// // // // // //   };

// // // // // //   const closeAlert = () => {
// // // // // //     setAlertModal({ isVisible: false, title: "", message: "" });
// // // // // //   };

// // // // // //   const closeModal = () => {
// // // // // //     setIsModalOpen(false);
// // // // // //     if (onClose) onClose();
// // // // // //   };

// // // // // //   const handleForgotPassword = async () => {
// // // // // //     if (!username) {
// // // // // //       showAlert("Email ID is required to reset the password.");
// // // // // //       return;
// // // // // //     }
// // // // // //     try {
// // // // // //       const response = await fetch(
// // // // // //         `${process.env.REACT_APP_BACKEND_URL}/forgot-password`,
// // // // // //         {
// // // // // //           method: "POST",
// // // // // //           headers: {
// // // // // //             "Content-Type": "application/json",
// // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // //           },
// // // // // //           body: JSON.stringify({ email: username }),
// // // // // //         }
// // // // // //       );
// // // // // //       const data = await response.json();
// // // // // //       response.ok
// // // // // //         ? showAlert("Password reset email sent!")
// // // // // //         : setErrorMessage(data.message || "Request failed");
// // // // // //     } catch (error) {
// // // // // //       setErrorMessage("An unexpected error occurred.");
// // // // // //     }
// // // // // //   };

// // // // // //   const handleSubmit = async (e) => {
// // // // // //     e.preventDefault();
// // // // // //     if (!username || !password) {
// // // // // //       setErrorMessage("Username and password are required.");
// // // // // //       return;
// // // // // //     }
// // // // // //     try {
// // // // // //       const response = await fetch(
// // // // // //         `${process.env.REACT_APP_BACKEND_URL}/login`,
// // // // // //         {
// // // // // //           method: "POST",
// // // // // //           credentials: "include",
// // // // // //           headers: {
// // // // // //             "Content-Type": "application/json",
// // // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // // //           },
// // // // // //           body: JSON.stringify({ email: username, password }),
// // // // // //         }
// // // // // //       );
// // // // // //       const data = await response.json();

// // // // // //       if (!response.ok) {
// // // // // //         setErrorMessage(data.message || "Invalid credentials.");
// // // // // //         return;
// // // // // //       }

// // // // // //       localStorage.setItem("userRole", data.message.role);
// // // // // //       localStorage.setItem("userName", data.message.name);
// // // // // //       localStorage.setItem("userGender", data.message.gender);
// // // // // //       localStorage.setItem("orgId", data.message.Org_id);
// // // // // //       localStorage.setItem(
// // // // // //         "dashboardData",
// // // // // //         JSON.stringify(data.message.dashboard)
// // // // // //       );
// // // // // //       localStorage.setItem(
// // // // // //         "sidebarMenu",
// // // // // //         JSON.stringify(data.message.sidebarMenu)
// // // // // //       );
// // // // // //       console.log("🔍 Org ID from login:", data.message.Org_id);
// // // // // //       localStorage.setItem("lastActivity", Date.now());

// // // // // //       closeModal();

// // // // // //       if (
// // // // // //         username.toLowerCase() === "manish.p@yopmail.com" &&
// // // // // //         (data.message.role || "").toLowerCase() === "general"
// // // // // //       ) {
// // // // // //         navigate("/FacePunch");
// // // // // //       } else {
// // // // // //         navigate("/dashboard");
// // // // // //       }
// // // // // //     } catch (error) {
// // // // // //       setErrorMessage("An unexpected error occurred.");
// // // // // //     }
// // // // // //   };

// // // // // //   return (
// // // // // //     isModalOpen && (
// // // // // //       <div className="login-container">
// // // // // //         <div className="top-tabs-bar">
// // // // // //           <span className="tab-link">Overview</span>
// // // // // //           <span className="tab-link">Demo Request</span>
// // // // // //           <button className="purchase-btn">Purchase</button>
// // // // // //         </div>
// // // // // //         <div className="login-card">
// // // // // //           <img src={logo} alt="Logo" className="card-logo" />
// // // // // //           <div className="login-left">
// // // // // //             <h1>Welcome to</h1>
// // // // // //             <h2 className="pulse-title">
// // // // // //               <span className="pulse-big">Pulse</span>
// // // // // //               <span className="pulse-small">work</span>
// // // // // //             </h2>
// // // // // //             <p>
// // // // // //               PUNCH IN PUNCH OUT with Geolocation and face detection App
// // // // // //               Categorized Recruitment approval process with related...
// // // // // //             </p>
// // // // // //             <div className="section-circles">
// // // // // //               <div className="circle circle1"></div>
// // // // // //               <div className="circle circle2"></div>
// // // // // //             </div>
// // // // // //           </div>
// // // // // //           <div className="login-right">
// // // // // //             <h2>Log In</h2>
// // // // // //             <form onSubmit={handleSubmit}>
// // // // // //               <div className="input-group">
// // // // // //                 <input
// // // // // //                   type="text"
// // // // // //                   placeholder="Your user name"
// // // // // //                   value={username}
// // // // // //                   onChange={(e) => setUsername(e.target.value)}
// // // // // //                 />
// // // // // //               </div>
// // // // // //               <div className="input-group">
// // // // // //                 <input
// // // // // //                   type={showPassword ? "text" : "password"}
// // // // // //                   placeholder="Your password"
// // // // // //                   value={password}
// // // // // //                   onChange={(e) => setPassword(e.target.value)}
// // // // // //                 />
// // // // // //                 <span
// // // // // //                   className="toggle-password-icon"
// // // // // //                   onClick={toggleShowPassword}
// // // // // //                   role="button"
// // // // // //                   aria-label={showPassword ? "Hide password" : "Show password"}
// // // // // //                   tabIndex={0}
// // // // // //                   onKeyPress={(e) => {
// // // // // //                     if (e.key === "Enter" || e.key === " ") toggleShowPassword();
// // // // // //                   }}
// // // // // //                 >
// // // // // //                   {showPassword ? <FaEyeSlash /> : <FaEye />}
// // // // // //                 </span>
// // // // // //               </div>
// // // // // //               <div className="form-options">
// // // // // //                 <a href="#" onClick={handleForgotPassword}>
// // // // // //                   Forget Password?
// // // // // //                 </a>
// // // // // //               </div>
// // // // // //               {errorMessage && <p className="error-msg">{errorMessage}</p>}
// // // // // //               <button type="submit" className="login-btn">Log In</button>
// // // // // //             </form>
// // // // // //             <div className="section-circles1">
// // // // // //               <div className="circle circle3"></div>
// // // // // //               <div className="circle circle4"></div>
// // // // // //             </div>
// // // // // //           </div>
// // // // // //         </div>
// // // // // //         <div className="footer-text">
// // // // // //           © 2022 Sukalpa Tech. All Rights Reserved.
// // // // // //         </div>
// // // // // //         {idleModalVisible && (
// // // // // //           <Modal
// // // // // //             isVisible={idleModalVisible}
// // // // // //             onClose={handleIdleModalClose}
// // // // // //             buttons={[{ label: "OK", onClick: handleIdleModalClose }]}
// // // // // //           >
// // // // // //             <p>You have been logged out due to inactivity.</p>
// // // // // //           </Modal>
// // // // // //         )}
// // // // // //         {alertModal.isVisible && (
// // // // // //           <Modal
// // // // // //             isVisible={alertModal.isVisible}
// // // // // //             onClose={closeAlert}
// // // // // //             buttons={[{ label: "OK", onClick: closeAlert }]}
// // // // // //           >
// // // // // //             <p>{alertModal.message}</p>
// // // // // //           </Modal>
// // // // // //         )}
// // // // // //       </div>
// // // // // //     )
// // // // // //   );
// // // // // // };

// // // // // // export default Login;

// // // // // import React, { useState, useEffect } from "react";
// // // // // import { useNavigate } from "react-router-dom";
// // // // // import { FaEye, FaEyeSlash } from "react-icons/fa";
// // // // // import Modal from "../Modal/Modal";
// // // // // import "./Login.css";
// // // // //  // Updated path

// // // // // const Login = ({ onClose }) => {
// // // // //   const [username, setUsername] = useState("");
// // // // //   const [password, setPassword] = useState("");
// // // // //   const [showPassword, setShowPassword] = useState(false);
// // // // //   const [errorMessage, setErrorMessage] = useState("");
// // // // //   const [isModalOpen, setIsModalOpen] = useState(true);
// // // // //   const [idleModalVisible, setIdleModalVisible] = useState(false);
// // // // //   const navigate = useNavigate();

// // // // //   const toggleShowPassword = () => {
// // // // //     setShowPassword((prev) => !prev);
// // // // //   };

// // // // //   const [alertModal, setAlertModal] = useState({
// // // // //     isVisible: false,
// // // // //     title: "",
// // // // //     message: "",
// // // // //   });

// // // // //   useEffect(() => {
// // // // //     if (sessionStorage.getItem("loggedOutDueToInactivity")) {
// // // // //       setIdleModalVisible(true);
// // // // //       sessionStorage.removeItem("loggedOutDueToInactivity");
// // // // //     }
// // // // //   }, []);

// // // // //   const handleIdleModalClose = () => {
// // // // //     setIdleModalVisible(false);
// // // // //   };

// // // // //   const showAlert = (message, title = "") => {
// // // // //     setAlertModal({ isVisible: true, title, message });
// // // // //   };

// // // // //   const closeAlert = () => {
// // // // //     setAlertModal({ isVisible: false, title: "", message: "" });
// // // // //   };

// // // // //   const closeModal = () => {
// // // // //     setIsModalOpen(false);
// // // // //     if (onClose) onClose();
// // // // //   };

// // // // //   const handleForgotPassword = async () => {
// // // // //     if (!username) {
// // // // //       showAlert("Email ID is required to reset the password.");
// // // // //       return;
// // // // //     }
// // // // //     try {
// // // // //       const response = await fetch(
// // // // //         `${process.env.REACT_APP_BACKEND_URL}/forgot-password`,
// // // // //         {
// // // // //           method: "POST",
// // // // //           headers: {
// // // // //             "Content-Type": "application/json",
// // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //           },
// // // // //           body: JSON.stringify({ email: username }),
// // // // //         }
// // // // //       );
// // // // //       const data = await response.json();
// // // // //       response.ok
// // // // //         ? showAlert("Password reset email sent!")
// // // // //         : setErrorMessage(data.message || "Request failed");
// // // // //     } catch (error) {
// // // // //       setErrorMessage("An unexpected error occurred.");
// // // // //     }
// // // // //   };

// // // // //   const handleSubmit = async (e) => {
// // // // //     e.preventDefault();
// // // // //     if (!username || !password) {
// // // // //       setErrorMessage("Username and password are required.");
// // // // //       return;
// // // // //     }
// // // // //     try {
// // // // //       const response = await fetch(
// // // // //         `${process.env.REACT_APP_BACKEND_URL}/login`,
// // // // //         {
// // // // //           method: "POST",
// // // // //           credentials: "include",
// // // // //           headers: {
// // // // //             "Content-Type": "application/json",
// // // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // // //           },
// // // // //           body: JSON.stringify({ email: username, password }),
// // // // //         }
// // // // //       );
// // // // //       const data = await response.json();

// // // // //       if (!response.ok) {
// // // // //         setErrorMessage(data.message || "Invalid credentials.");
// // // // //         return;
// // // // //       }

// // // // //       localStorage.setItem("userRole", data.message.role);
// // // // //       localStorage.setItem("userName", data.message.name);
// // // // //       localStorage.setItem("userGender", data.message.gender);
// // // // //       localStorage.setItem("orgId", data.message.Org_id);
// // // // //       localStorage.setItem(
// // // // //         "dashboardData",
// // // // //         JSON.stringify(data.message.dashboard)
// // // // //       );
// // // // //       localStorage.setItem(
// // // // //         "sidebarMenu",
// // // // //         JSON.stringify(data.message.sidebarMenu)
// // // // //       );
// // // // //       console.log("🔍 Org ID from login:", data.message.Org_id);
// // // // //       localStorage.setItem("lastActivity", Date.now());

// // // // //       closeModal();

// // // // //       if (
// // // // //         username.toLowerCase() === "manish.p@yopmail.com" &&
// // // // //         (data.message.role || "").toLowerCase() === "general"
// // // // //       ) {
// // // // //         navigate("/FacePunch");
// // // // //       } else {
// // // // //         navigate("/dashboard");
// // // // //       }
// // // // //     } catch (error) {
// // // // //       setErrorMessage("An unexpected error occurred.");
// // // // //     }
// // // // //   };

// // // // //   return (
// // // // //     isModalOpen && (
// // // // //       <div className="login-container">
// // // // //         <div className="top-tabs-bar">
// // // // //           <span className="tab-link">Overview</span>
// // // // //           <span className="tab-link">Demo Request</span>
// // // // //           <button className="purchase-btn">Purchase</button>
// // // // //         </div>
// // // // //         <div className="login-card">
// // // // //           <img src={logo} alt="Logo" className="card-logo" />
// // // // //           <div className="login-left">
// // // // //             <h1>Welcome to</h1>
// // // // //             <h2 className="pulse-title">
// // // // //               <span className="pulse-big">Pulse</span>
// // // // //               <span className="pulse-small">work</span>
// // // // //             </h2>
// // // // //             <p>
// // // // //               PUNCH IN PUNCH OUT with Geolocation and face detection App
// // // // //               Categorized Recruitment approval process with related...
// // // // //             </p>
// // // // //             <div className="section-circles">
// // // // //               <div className="circle circle1"></div>
// // // // //               <div className="circle circle2"></div>
// // // // //             </div>
// // // // //           </div>
// // // // //           <div className="login-right">
// // // // //             <h2>Log In</h2>
// // // // //             <form onSubmit={handleSubmit}>
// // // // //               <div className="input-group">
// // // // //                 <input
// // // // //                   type="text"
// // // // //                   placeholder="Your user name"
// // // // //                   value={username}
// // // // //                   onChange={(e) => setUsername(e.target.value)}
// // // // //                 />
// // // // //               </div>
// // // // //               <div className="input-group">
// // // // //                 <input
// // // // //                   type={showPassword ? "text" : "password"}
// // // // //                   placeholder="Your password"
// // // // //                   value={password}
// // // // //                   onChange={(e) => setPassword(e.target.value)}
// // // // //                 />
// // // // //                 <span
// // // // //                   className="toggle-password-icon"
// // // // //                   onClick={toggleShowPassword}
// // // // //                   role="button"
// // // // //                   aria-label={showPassword ? "Hide password" : "Show password"}
// // // // //                   tabIndex={0}
// // // // //                   onKeyPress={(e) => {
// // // // //                     if (e.key === "Enter" || e.key === " ") toggleShowPassword();
// // // // //                   }}
// // // // //                 >
// // // // //                   {showPassword ? <FaEyeSlash /> : <FaEye />}
// // // // //                 </span>
// // // // //               </div>
// // // // //               <div className="form-options">
// // // // //                 <a href="#" onClick={handleForgotPassword}>
// // // // //                   Forget Password?
// // // // //                 </a>
// // // // //               </div>
// // // // //               {errorMessage && <p className="error-msg">{errorMessage}</p>}
// // // // //               <button type="submit" className="login-btn">Log In</button>
// // // // //             </form>
// // // // //             <div className="section-circles1">
// // // // //               <div className="circle circle3"></div>
// // // // //               <div className="circle circle4"></div>
// // // // //             </div>
// // // // //           </div>
// // // // //         </div>
// // // // //         <div className="footer-text">
// // // // //           © 2022 Sukalpa Tech. All Rights Reserved.
// // // // //         </div>
// // // // //         {idleModalVisible && (
// // // // //           <Modal
// // // // //             isVisible={idleModalVisible}
// // // // //             onClose={handleIdleModalClose}
// // // // //             buttons={[{ label: "OK", onClick: handleIdleModalClose }]}
// // // // //           >
// // // // //             <p>You have been logged out due to inactivity.</p>
// // // // //           </Modal>
// // // // //         )}
// // // // //         {alertModal.isVisible && (
// // // // //           <Modal
// // // // //             isVisible={alertModal.isVisible}
// // // // //             onClose={closeAlert}
// // // // //             buttons={[{ label: "OK", onClick: closeAlert }]}
// // // // //           >
// // // // //             <p>{alertModal.message}</p>
// // // // //           </Modal>
// // // // //         )}
// // // // //       </div>
// // // // //     )
// // // // //   );
// // // // // };

// // // // // export default Login;

// // // // import React, { useState, useEffect } from "react";
// // // // import { useNavigate } from "react-router-dom";
// // // // import { FaEye, FaEyeSlash } from "react-icons/fa";
// // // // import Modal from "../Modal/Modal";
// // // // import "./Login.css";
// // // // import logo from "../../assets/images/sukalpa_logo.png"; // Updated path

// // // // const Login = ({ onClose }) => {
// // // //   const [username, setUsername] = useState("");
// // // //   const [password, setPassword] = useState("");
// // // //   const [showPassword, setShowPassword] = useState(false);
// // // //   const [errorMessage, setErrorMessage] = useState("");
// // // //   const [isModalOpen, setIsModalOpen] = useState(true);
// // // //   const [idleModalVisible, setIdleModalVisible] = useState(false);
// // // //   const navigate = useNavigate();

// // // //   const toggleShowPassword = () => {
// // // //     setShowPassword((prev) => !prev);
// // // //   };

// // // //   const [alertModal, setAlertModal] = useState({
// // // //     isVisible: false,
// // // //     title: "",
// // // //     message: "",
// // // //   });

// // // //   useEffect(() => {
// // // //     if (sessionStorage.getItem("loggedOutDueToInactivity")) {
// // // //       setIdleModalVisible(true);
// // // //       sessionStorage.removeItem("loggedOutDueToInactivity");
// // // //     }
// // // //   }, []);

// // // //   const handleIdleModalClose = () => {
// // // //     setIdleModalVisible(false);
// // // //   };

// // // //   const showAlert = (message, title = "") => {
// // // //     setAlertModal({ isVisible: true, title, message });
// // // //   };

// // // //   const closeAlert = () => {
// // // //     setAlertModal({ isVisible: false, title: "", message: "" });
// // // //   };

// // // //   const closeModal = () => {
// // // //     setIsModalOpen(false);
// // // //     if (onClose) onClose();
// // // //   };

// // // //   const handleForgotPassword = async () => {
// // // //     if (!username) {
// // // //       showAlert("Email ID is required to reset the password.");
// // // //       return;
// // // //     }
// // // //     try {
// // // //       const response = await fetch(
// // // //         `${process.env.REACT_APP_BACKEND_URL}/forgot-password`,
// // // //         {
// // // //           method: "POST",
// // // //           headers: {
// // // //             "Content-Type": "application/json",
// // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // //           },
// // // //           body: JSON.stringify({ email: username }),
// // // //         }
// // // //       );
// // // //       const data = await response.json();
// // // //       response.ok
// // // //         ? showAlert("Password reset email sent!")
// // // //         : setErrorMessage(data.message || "Request failed");
// // // //     } catch (error) {
// // // //       setErrorMessage("An unexpected error occurred.");
// // // //     }
// // // //   };

// // // //   const handleSubmit = async (e) => {
// // // //     e.preventDefault();
// // // //     if (!username || !password) {
// // // //       setErrorMessage("Username and password are required.");
// // // //       return;
// // // //     }
// // // //     try {
// // // //       const response = await fetch(
// // // //         `${process.env.REACT_APP_BACKEND_URL}/login`,
// // // //         {
// // // //           method: "POST",
// // // //           credentials: "include",
// // // //           headers: {
// // // //             "Content-Type": "application/json",
// // // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // // //           },
// // // //           body: JSON.stringify({ email: username, password }),
// // // //         }
// // // //       );
// // // //       const data = await response.json();

// // // //       if (!response.ok) {
// // // //         setErrorMessage(data.message || "Invalid credentials.");
// // // //         return;
// // // //       }

// // // //       localStorage.setItem("userRole", data.message.role);
// // // //       localStorage.setItem("userName", data.message.name);
// // // //       localStorage.setItem("userGender", data.message.gender);
// // // //       localStorage.setItem("orgId", data.message.Org_id);
// // // //       localStorage.setItem(
// // // //         "dashboardData",
// // // //         JSON.stringify(data.message.dashboard)
// // // //       );
// // // //       localStorage.setItem(
// // // //         "sidebarMenu",
// // // //         JSON.stringify(data.message.sidebarMenu)
// // // //       );
// // // //       console.log("🔍 Org ID from login:", data.message.Org_id);
// // // //       localStorage.setItem("lastActivity", Date.now());

// // // //       closeModal();

// // // //       if (
// // // //         username.toLowerCase() === "manish.p@yopmail.com" &&
// // // //         (data.message.role || "").toLowerCase() === "general"
// // // //       ) {
// // // //         navigate("/FacePunch");
// // // //       } else {
// // // //         navigate("/dashboard");
// // // //       }
// // // //     } catch (error) {
// // // //       setErrorMessage("An unexpected error occurred.");
// // // //     }
// // // //   };

// // // //   return (
// // // //     isModalOpen && (
// // // //       <div className="login-container">
// // // //         <div className="top-tabs-bar">
// // // //           <span className="tab-link">Overview</span>
// // // //           <span className="tab-link">Demo Request</span>
// // // //           <button className="purchase-btn">Purchase</button>
// // // //         </div>
// // // //         <div className="login-card">
// // // //           <img src={logo} alt="Logo" className="card-logo" />
// // // //           <div className="login-left">
// // // //             <h1>Welcome to</h1>
// // // //             <h2 className="pulse-title">
// // // //               <span className="pulse-big">Pulse</span>
// // // //               <span className="pulse-small">work</span>
// // // //             </h2>
// // // //             <p>
// // // //               PUNCH IN PUNCH OUT with Geolocation and face detection App
// // // //               Categorized Recruitment approval process with related...
// // // //             </p>
// // // //             <div className="section-circles">
// // // //               <div className="circle circle1"></div>
// // // //               <div className="circle circle2"></div>
// // // //             </div>
// // // //           </div>
// // // //           <div className="login-right">
// // // //             <h2>Log In</h2>
// // // //             <form onSubmit={handleSubmit}>
// // // //               <div className="input-group">
// // // //                 <input
// // // //                   type="text"
// // // //                   placeholder="Your user name"
// // // //                   value={username}
// // // //                   onChange={(e) => setUsername(e.target.value)}
// // // //                 />
// // // //               </div>
// // // //               <div className="input-group">
// // // //                 <input
// // // //                   type={showPassword ? "text" : "password"}
// // // //                   placeholder="Your password"
// // // //                   value={password}
// // // //                   onChange={(e) => setPassword(e.target.value)}
// // // //                 />
// // // //                 <span
// // // //                   className="toggle-password-icon"
// // // //                   onClick={toggleShowPassword}
// // // //                   role="button"
// // // //                   aria-label={showPassword ? "Hide password" : "Show password"}
// // // //                   tabIndex={0}
// // // //                   onKeyPress={(e) => {
// // // //                     if (e.key === "Enter" || e.key === " ") toggleShowPassword();
// // // //                   }}
// // // //                 >
// // // //                   {showPassword ? <FaEyeSlash /> : <FaEye />}
// // // //                 </span>
// // // //               </div>
// // // //               <div className="form-options">
// // // //                 <a href="#" onClick={handleForgotPassword}>
// // // //                   Forget Password?
// // // //                 </a>
// // // //               </div>
// // // //               {errorMessage && <p className="error-msg">{errorMessage}</p>}
// // // //               <button type="submit" className="login-btn">Log In</button>
// // // //             </form>
// // // //             <div className="section-circles1">
// // // //               <div className="circle circle3"></div>
// // // //               <div className="circle circle4"></div>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //         <div className="footer-text">
// // // //           © 2022 Sukalpa Tech. All Rights Reserved.
// // // //         </div>
// // // //         {idleModalVisible && (
// // // //           <Modal
// // // //             isVisible={idleModalVisible}
// // // //             onClose={handleIdleModalClose}
// // // //             buttons={[{ label: "OK", onClick: handleIdleModalClose }]}
// // // //           >
// // // //             <p>You have been logged out due to inactivity.</p>
// // // //           </Modal>
// // // //         )}
// // // //         {alertModal.isVisible && (
// // // //           <Modal
// // // //             isVisible={alertModal.isVisible}
// // // //             onClose={closeAlert}
// // // //             buttons={[{ label: "OK", onClick: closeAlert }]}
// // // //           >
// // // //             <p>{alertModal.message}</p>
// // // //           </Modal>
// // // //         )}
// // // //       </div>
// // // //     )
// // // //   );
// // // // };

// // // // export default Login;

// // // import React, { useState, useEffect } from "react";
// // // import { useNavigate } from "react-router-dom";
// // // import { FaEye, FaEyeSlash } from "react-icons/fa";
// // // import Modal from "../Modal/Modal";
// // // import "./Login.css";
// // // import logo from "../../assets/sukalpa_logo.png";

// // // const Login = ({ onClose }) => {
// // //   const [username, setUsername] = useState("");
// // //   const [password, setPassword] = useState("");
// // //   const [showPassword, setShowPassword] = useState(false);
// // //   const [errorMessage, setErrorMessage] = useState("");
// // //   const [isModalOpen, setIsModalOpen] = useState(true);
// // //   const [idleModalVisible, setIdleModalVisible] = useState(false);
// // //   const navigate = useNavigate();

// // //   const toggleShowPassword = () => {
// // //     setShowPassword((prev) => !prev);
// // //   };

// // //   const [alertModal, setAlertModal] = useState({
// // //     isVisible: false,
// // //     title: "",
// // //     message: "",
// // //   });

// // //   useEffect(() => {
// // //     if (sessionStorage.getItem("loggedOutDueToInactivity")) {
// // //       setIdleModalVisible(true);
// // //       sessionStorage.removeItem("loggedOutDueToInactivity");
// // //     }
// // //   }, []);

// // //   const handleIdleModalClose = () => {
// // //     setIdleModalVisible(false);
// // //   };

// // //   const showAlert = (message, title = "") => {
// // //     setAlertModal({ isVisible: true, title, message });
// // //   };

// // //   const closeAlert = () => {
// // //     setAlertModal({ isVisible: false, title: "", message: "" });
// // //   };

// // //   const closeModal = () => {
// // //     setIsModalOpen(false);
// // //     if (onClose) onClose();
// // //   };

// // //   const handleForgotPassword = async () => {
// // //     if (!username) {
// // //       showAlert("Email ID is required to reset the password.");
// // //       return;
// // //     }
// // //     try {
// // //       const response = await fetch(
// // //         `${process.env.REACT_APP_BACKEND_URL}/forgot-password`,
// // //         {
// // //           method: "POST",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // //           },
// // //           body: JSON.stringify({ email: username }),
// // //         }
// // //       );
// // //       const data = await response.json();
// // //       response.ok
// // //         ? showAlert("Password reset email sent!")
// // //         : setErrorMessage(data.message || "Request failed");
// // //     } catch (error) {
// // //       setErrorMessage("An unexpected error occurred.");
// // //     }
// // //   };

// // //   const handleSubmit = async (e) => {
// // //     e.preventDefault();
// // //     if (!username || !password) {
// // //       setErrorMessage("Username and password are required.");
// // //       return;
// // //     }
// // //     try {
// // //       const response = await fetch(
// // //         `${process.env.REACT_APP_BACKEND_URL}/login`,
// // //         {
// // //           method: "POST",
// // //           credentials: "include",
// // //           headers: {
// // //             "Content-Type": "application/json",
// // //             "x-api-key": process.env.REACT_APP_API_KEY,
// // //           },
// // //           body: JSON.stringify({ email: username, password }),
// // //         }
// // //       );
// // //       const data = await response.json();

// // //       if (!response.ok) {
// // //         setErrorMessage(data.message || "Invalid credentials.");
// // //         return;
// // //       }

// // //       localStorage.setItem("userRole", data.message.role);
// // //       localStorage.setItem("userName", data.message.name);
// // //       localStorage.setItem("userGender", data.message.gender);
// // //       localStorage.setItem("orgId", data.message.Org_id);
// // //       localStorage.setItem(
// // //         "dashboardData",
// // //         JSON.stringify(data.message.dashboard)
// // //       );
// // //       localStorage.setItem(
// // //         "sidebarMenu",
// // //         JSON.stringify(data.message.sidebarMenu)
// // //       );
// // //       console.log("🔍 Org ID from login:", data.message.Org_id);
// // //       localStorage.setItem("lastActivity", Date.now());

// // //       closeModal();

// // //       if (
// // //         username.toLowerCase() === "manish.p@yopmail.com" &&
// // //         (data.message.role || "").toLowerCase() === "general"
// // //       ) {
// // //         navigate("/FacePunch");
// // //       } else {
// // //         navigate("/dashboard");
// // //       }
// // //     } catch (error) {
// // //       setErrorMessage("An unexpected error occurred.");
// // //     }
// // //   };

// // //   return (
// // //     isModalOpen && (
// // //       <div className="login-container">
// // //         <div className="top-tabs-bar">
// // //           <span className="tab-link">Overview</span>
// // //           <span className="tab-link">Demo Request</span>
// // //           <button className="purchase-btn">Purchase</button>
// // //         </div>
// // //         <div className="login-card">
// // //           <img src={logo} alt="Logo" className="card-logo" />
// // //           <div className="login-left">
// // //             <h1>Welcome to</h1>
// // //             <h2 className="pulse-title">
// // //               <span className="pulse-big">Pulse</span>
// // //               <span className="pulse-small">work</span>
// // //             </h2>
// // //             <p>
// // //               PUNCH IN PUNCH OUT with Geolocation and face detection App
// // //               Categorized Recruitment approval process with related...
// // //             </p>
// // //             <div className="section-circles">
// // //               <div className="circle circle1"></div>
// // //               <div className="circle circle2"></div>
// // //             </div>
// // //           </div>
// // //           <div className="login-right">
// // //             <h2>Log In</h2>
// // //             <form onSubmit={handleSubmit}>
// // //               <div className="input-group">
// // //                 <input
// // //                   type="text"
// // //                   placeholder="Your user name"
// // //                   value={username}
// // //                   onChange={(e) => setUsername(e.target.value)}
// // //                 />
// // //               </div>
// // //               <div className="input-group">
// // //                 <input
// // //                   type={showPassword ? "text" : "password"}
// // //                   placeholder="Your password"
// // //                   value={password}
// // //                   onChange={(e) => setPassword(e.target.value)}
// // //                 />
// // //                 <span
// // //                   className="toggle-password-icon"
// // //                   onClick={toggleShowPassword}
// // //                   role="button"
// // //                   aria-label={showPassword ? "Hide password" : "Show password"}
// // //                   tabIndex={0}
// // //                   onKeyPress={(e) => {
// // //                     if (e.key === "Enter" || e.key === " ") toggleShowPassword();
// // //                   }}
// // //                 >
// // //                   {showPassword ? <FaEyeSlash /> : <FaEye />}
// // //                 </span>
// // //               </div>
// // //               <div className="form-options">
// // //                 <a href="#" onClick={handleForgotPassword}>
// // //                   Forget Password?
// // //                 </a>
// // //               </div>
// // //               {errorMessage && <p className="error-msg">{errorMessage}</p>}
// // //               <button type="submit" className="login-btn">Log In</button>
// // //             </form>
// // //             <div className="section-circles1">
// // //               <div className="circle circle3"></div>
// // //               <div className="circle circle4"></div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //         <div className="footer-text">
// // //           © 2022 Sukalpa Tech. All Rights Reserved.
// // //         </div>
// // //         {idleModalVisible && (
// // //           <Modal
// // //             isVisible={idleModalVisible}
// // //             onClose={handleIdleModalClose}
// // //             buttons={[{ label: "OK", onClick: handleIdleModalClose }]}
// // //           >
// // //             <p>You have been logged out due to inactivity.</p>
// // //           </Modal>
// // //         )}
// // //         {alertModal.isVisible && (
// // //           <Modal
// // //             isVisible={alertModal.isVisible}
// // //             onClose={closeAlert}
// // //             buttons={[{ label: "OK", onClick: closeAlert }]}
// // //           >
// // //             <p>{alertModal.message}</p>
// // //           </Modal>
// // //         )}
// // //       </div>
// // //     )
// // //   );
// // // };

// // // export default Login;

// // import React, { useState, useEffect } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { FaEye, FaEyeSlash } from "react-icons/fa";
// // import Modal from "../Modal/Modal";
// // import "./Login.css";
// // import logo from "../../assets/sukalpa_logo.png";

// // const Login = ({ onClose }) => {
// //   const [username, setUsername] = useState("");
// //   const [password, setPassword] = useState("");
// //   const [showPassword, setShowPassword] = useState(false);
// //   const [errorMessage, setErrorMessage] = useState("");
// //   const [isModalOpen, setIsModalOpen] = useState(true);
// //   const [idleModalVisible, setIdleModalVisible] = useState(false);
// //   const navigate = useNavigate();

// //   const toggleShowPassword = () => {
// //     setShowPassword((prev) => !prev);
// //   };

// //   const [alertModal, setAlertModal] = useState({
// //     isVisible: false,
// //     title: "",
// //     message: "",
// //   });

// //   useEffect(() => {
// //     if (sessionStorage.getItem("loggedOutDueToInactivity")) {
// //       setIdleModalVisible(true);
// //       sessionStorage.removeItem("loggedOutDueToInactivity");
// //     }
// //   }, []);

// //   const handleIdleModalClose = () => {
// //     setIdleModalVisible(false);
// //   };

// //   const showAlert = (message, title = "") => {
// //     setAlertModal({ isVisible: true, title, message });
// //   };

// //   const closeAlert = () => {
// //     setAlertModal({ isVisible: false, title: "", message: "" });
// //   };

// //   const closeModal = () => {
// //     setIsModalOpen(false);
// //     if (onClose) onClose();
// //   };

// //   const handleForgotPassword = async () => {
// //     if (!username) {
// //       showAlert("Email ID is required to reset the password.");
// //       return;
// //     }
// //     try {
// //       const response = await fetch(
// //         `${process.env.REACT_APP_BACKEND_URL}/forgot-password`,
// //         {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //             "x-api-key": process.env.REACT_APP_API_KEY,
// //           },
// //           body: JSON.stringify({ email: username }),
// //         }
// //       );
// //       const data = await response.json();
// //       response.ok
// //         ? showAlert("Password reset email sent!")
// //         : setErrorMessage(data.message || "Request failed");
// //     } catch (error) {
// //       setErrorMessage("An unexpected error occurred.");
// //     }
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     if (!username || !password) {
// //       setErrorMessage("Username and password are required.");
// //       return;
// //     }
// //     try {
// //       const response = await fetch(
// //         `${process.env.REACT_APP_BACKEND_URL}/login`,
// //         {
// //           method: "POST",
// //           credentials: "include",
// //           headers: {
// //             "Content-Type": "application/json",
// //             "x-api-key": process.env.REACT_APP_API_KEY,
// //           },
// //           body: JSON.stringify({ email: username, password }),
// //         }
// //       );
// //       const data = await response.json();

// //       if (!response.ok) {
// //         setErrorMessage(data.message || "Invalid credentials.");
// //         return;
// //       }

// //       localStorage.setItem("userRole", data.message.role);
// //       localStorage.setItem("userName", data.message.name);
// //       localStorage.setItem("userGender", data.message.gender);
// //       localStorage.setItem("orgId", data.message.Org_id);
// //       localStorage.setItem(
// //         "dashboardData",
// //         JSON.stringify(data.message.dashboard)
// //       );
// //       localStorage.setItem(
// //         "sidebarMenu",
// //         JSON.stringify(data.message.sidebarMenu)
// //       );
// //       console.log("🔍 Org ID from login:", data.message.Org_id);
// //       localStorage.setItem("lastActivity", Date.now());

// //       closeModal();

// //       if (
// //         username.toLowerCase() === "manish.p@yopmail.com" &&
// //         (data.message.role || "").toLowerCase() === "general"
// //       ) {
// //         navigate("/FacePunch");
// //       } else {
// //         navigate("/dashboard");
// //       }
// //     } catch (error) {
// //       setErrorMessage("An unexpected error occurred.");
// //     }
// //   };

// //   return (
// //     isModalOpen && (
// //       <div className="login-container">
// //         <div className="top-tabs-bar">
// //           <span className="tab-link">Overview</span>
// //           <span className="tab-link">Demo Request</span>
// //           <button className="purchase-btn">Purchase</button>
// //         </div>
// //         <div className="login-card">
// //           <img src={logo} alt="Logo" className="card-logo" />
// //           <div className="login-left">
// //             <h1>Welcome to</h1>
// //             <h2 className="pulse-title">
// //               <span className="pulse-big">Pulse</span>
// //               <span className="pulse-small">work</span>
// //             </h2>
// //             <p>
// //               PUNCH IN PUNCH OUT with Geolocation and face detection App
// //               Categorized Recruitment approval process with related...
// //             </p>
// //             <div className="section-circles">
// //               <div className="circle circle1"></div>
// //               <div className="circle circle2"></div>
// //             </div>
// //           </div>
// //           <div className="login-right">
// //             <h2>Log In</h2>
// //             <form onSubmit={handleSubmit}>
// //               <div className="input-group">
// //                 <input
// //                   type="text"
// //                   placeholder="Your user name"
// //                   value={username}
// //                   onChange={(e) => setUsername(e.target.value)}
// //                 />
// //               </div>
// //               <div className="input-group">
// //                 <input
// //                   type={showPassword ? "text" : "password"}
// //                   placeholder="Your password"
// //                   value={password}
// //                   onChange={(e) => setPassword(e.target.value)}
// //                 />
// //                 <span
// //                   className="toggle-password-icon"
// //                   onClick={toggleShowPassword}
// //                   role="button"
// //                   aria-label={showPassword ? "Hide password" : "Show password"}
// //                   tabIndex={0}
// //                   onKeyPress={(e) => {
// //                     if (e.key === "Enter" || e.key === " ") toggleShowPassword();
// //                   }}
// //                 >
// //                   {showPassword ? <FaEyeSlash /> : <FaEye />}
// //                 </span>
// //               </div>
// //               <div className="form-options">
// //                 <a href="#" onClick={handleForgotPassword}>
// //                   Forget Password?
// //                 </a>
// //               </div>
// //               {errorMessage && <p className="error-msg">{errorMessage}</p>}
// //               <button type="submit" className="login-btn">Log In</button>
// //             </form>
// //             <div className="section-circles1">
// //               <div className="circle circle3"></div>
// //               <div className="circle circle4"></div>
// //             </div>
// //           </div>
// //         </div>
// //         <div className="footer-text">
// //           © 2022 Sukalpa Tech. All Rights Reserved.
// //         </div>
// //         {idleModalVisible && (
// //           <Modal
// //             isVisible={idleModalVisible}
// //             onClose={handleIdleModalClose}
// //             buttons={[{ label: "OK", onClick: handleIdleModalClose }]}
// //           >
// //             <p>You have been logged out due to inactivity.</p>
// //           </Modal>
// //         )}
// //         {alertModal.isVisible && (
// //           <Modal
// //             isVisible={alertModal.isVisible}
// //             onClose={closeAlert}
// //             buttons={[{ label: "OK", onClick: closeAlert }]}
// //           >
// //             <p>{alertModal.message}</p>
// //           </Modal>
// //         )}
// //       </div>
// //     )
// //   );
// // };

// // export default Login;




// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { FaEye, FaEyeSlash } from "react-icons/fa";
// import Modal from "../Modal/Modal";
// import "./Login.css";
// // import logo from "../../assets/images/sukalpalogo"; // Updated path

// const Login = ({ onClose }) => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(true);
//   const [idleModalVisible, setIdleModalVisible] = useState(false);
//   const navigate = useNavigate();

//   const toggleShowPassword = () => {
//     setShowPassword((prev) => !prev);
//   };

//   const [alertModal, setAlertModal] = useState({
//     isVisible: false,
//     title: "",
//     message: "",
//   });

//   useEffect(() => {
//     if (sessionStorage.getItem("loggedOutDueToInactivity")) {
//       setIdleModalVisible(true);
//       sessionStorage.removeItem("loggedOutDueToInactivity");
//     }
//   }, []);

//   const handleIdleModalClose = () => {
//     setIdleModalVisible(false);
//   };

//   const showAlert = (message, title = "") => {
//     setAlertModal({ isVisible: true, title, message });
//   };

//   const closeAlert = () => {
//     setAlertModal({ isVisible: false, title: "", message: "" });
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     if (onClose) onClose();
//   };

//   const handleForgotPassword = async () => {
//     if (!username) {
//       showAlert("Email ID is required to reset the password.");
//       return;
//     }
//     try {
//       const response = await fetch(
//         `${process.env.REACT_APP_BACKEND_URL}/forgot-password`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": process.env.REACT_APP_API_KEY,
//           },
//           body: JSON.stringify({ email: username }),
//         }
//       );
//       const data = await response.json();
//       response.ok
//         ? showAlert("Password reset email sent!")
//         : setErrorMessage(data.message || "Request failed");
//     } catch (error) {
//       setErrorMessage("An unexpected error occurred.");
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!username || !password) {
//       setErrorMessage("Username and password are required.");
//       return;
//     }
//     try {
//       const response = await fetch(
//         `${process.env.REACT_APP_BACKEND_URL}/login`,
//         {
//           method: "POST",
//           credentials: "include",
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": process.env.REACT_APP_API_KEY,
//           },
//           body: JSON.stringify({ email: username, password }),
//         }
//       );
//       const data = await response.json();

//       if (!response.ok) {
//         setErrorMessage(data.message || "Invalid credentials.");
//         return;
//       }

//       localStorage.setItem("userRole", data.message.role);
//       localStorage.setItem("userName", data.message.name);
//       localStorage.setItem("userGender", data.message.gender);
//       localStorage.setItem("orgId", data.message.Org_id);
//       localStorage.setItem(
//         "dashboardData",
//         JSON.stringify(data.message.dashboard)
//       );
//       localStorage.setItem(
//         "sidebarMenu",
//         JSON.stringify(data.message.sidebarMenu)
//       );
//       console.log("🔍 Org ID from login:", data.message.Org_id);
//       localStorage.setItem("lastActivity", Date.now());

//       closeModal();

//       if (
//         username.toLowerCase() === "manish.p@yopmail.com" &&
//         (data.message.role || "").toLowerCase() === "general"
//       ) {
//         navigate("/FacePunch");
//       } else {
//         navigate("/dashboard");
//       }
//     } catch (error) {
//       setErrorMessage("An unexpected error occurred.");
//     }
//   };

//   return (
//     isModalOpen && (
//       <div className="login-container">
//         <div className="top-tabs-bar">
//           <span className="tab-link">Overview</span>
//           <span className="tab-link">Demo Request</span>
//           <button className="purchase-btn">Purchase</button>
//         </div>
//         <div className="login-card">
//           {/* <img src={logo} alt="Logo" className="card-logo" /> */}
//           <div className="login-left">
//             <h1>Welcome to</h1>
//             <h2 className="pulse-title">
//               <span className="pulse-big">Pulse</span>
//               <span className="pulse-small">work</span>
//             </h2>
//             <p>
//               PUNCH IN PUNCH OUT with Geolocation and face detection App
//               Categorized Recruitment approval process with related...
//             </p>
//             <div className="section-circles">
//               <div className="circle circle1"></div>
//               <div className="circle circle2"></div>
//             </div>
//           </div>
//           <div className="login-right">
//             <h2>Log In</h2>
//             <form onSubmit={handleSubmit}>
//               <div className="input-group">
//                 <input
//                   type="text"
//                   placeholder="Your user name"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                 />
//               </div>
//               <div className="input-group">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Your password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                 />
//                 <span
//                   className="toggle-password-icon"
//                   onClick={toggleShowPassword}
//                   role="button"
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                   tabIndex={0}
//                   onKeyPress={(e) => {
//                     if (e.key === "Enter" || e.key === " ") toggleShowPassword();
//                   }}
//                 >
//                   {showPassword ? <FaEyeSlash /> : <FaEye />}
//                 </span>
//               </div>
//               <div className="form-options">
//                 <a href="#" onClick={handleForgotPassword}>
//                   Forget Password?
//                 </a>
//               </div>
//               {errorMessage && <p className="error-msg">{errorMessage}</p>}
//               <button type="submit" className="login-btn">Log In</button>
//             </form>
//             <div className="section-circles1">
//               <div className="circle circle3"></div>
//               <div className="circle circle4"></div>
//             </div>
//           </div>
//         </div>
//         <div className="footer-text">
//           © 2022 Sukalpa Tech. All Rights Reserved.
//         </div>
//         {idleModalVisible && (
//           <Modal
//             isVisible={idleModalVisible}
//             onClose={handleIdleModalClose}
//             buttons={[{ label: "OK", onClick: handleIdleModalClose }]}
//           >
//             <p>You have been logged out due to inactivity.</p>
//           </Modal>
//         )}
//         {alertModal.isVisible && (
//           <Modal
//             isVisible={alertModal.isVisible}
//             onClose={closeAlert}
//             buttons={[{ label: "OK", onClick: closeAlert }]}
//           >
//             <p>{alertModal.message}</p>
//           </Modal>
//         )}
//       </div>
//     )
//   );
// };

// export default Login;


// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { FaEye, FaEyeSlash } from "react-icons/fa";
// import Modal from "../Modal/Modal";
// import "./Login.css";
// // import logo from "../../assets/images/sukalpa_logo.png"; // Updated path

// const Login = ({ onClose }) => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(true);
//   const [idleModalVisible, setIdleModalVisible] = useState(false);
//   const navigate = useNavigate();

//   const toggleShowPassword = () => {
//     setShowPassword((prev) => !prev);
//   };

//   const [alertModal, setAlertModal] = useState({
//     isVisible: false,
//     title: "",
//     message: "",
//   });

//   useEffect(() => {
//     if (sessionStorage.getItem("loggedOutDueToInactivity")) {
//       setIdleModalVisible(true);
//       sessionStorage.removeItem("loggedOutDueToInactivity");
//     }
//   }, []);

//   const handleIdleModalClose = () => {
//     setIdleModalVisible(false);
//   };

//   const showAlert = (message, title = "") => {
//     setAlertModal({ isVisible: true, title, message });
//   };

//   const closeAlert = () => {
//     setAlertModal({ isVisible: false, title: "", message: "" });
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     if (onClose) onClose();
//   };

//   const handleForgotPassword = async () => {
//     if (!username) {
//       showAlert("Email ID is required to reset the password.");
//       return;
//     }
//     try {
//       const response = await fetch(
//         `${process.env.REACT_APP_BACKEND_URL}/forgot-password`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": process.env.REACT_APP_API_KEY,
//           },
//           body: JSON.stringify({ email: username }),
//         }
//       );
//       const data = await response.json();
//       response.ok
//         ? showAlert("Password reset email sent!")
//         : setErrorMessage(data.message || "Request failed");
//     } catch (error) {
//       setErrorMessage("An unexpected error occurred.");
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!username || !password) {
//       setErrorMessage("Username and password are required.");
//       return;
//     }
//     try {
//       const response = await fetch(
//         `${process.env.REACT_APP_BACKEND_URL}/login`,
//         {
//           method: "POST",
//           credentials: "include",
//           headers: {
//             "Content-Type": "application/json",
//             "x-api-key": process.env.REACT_APP_API_KEY,
//           },
//           body: JSON.stringify({ email: username, password }),
//         }
//       );
//       const data = await response.json();

//       if (!response.ok) {
//         setErrorMessage(data.message || "Invalid credentials.");
//         return;
//       }

//       localStorage.setItem("userRole", data.message.role);
//       localStorage.setItem("userName", data.message.name);
//       localStorage.setItem("userGender", data.message.gender);
//       localStorage.setItem("orgId", data.message.Org_id);
//       localStorage.setItem(
//         "dashboardData",
//         JSON.stringify(data.message.dashboard)
//       );
//       localStorage.setItem(
//         "sidebarMenu",
//         JSON.stringify(data.message.sidebarMenu)
//       );
//       console.log("🔍 Org ID from login:", data.message.Org_id);
//       localStorage.setItem("lastActivity", Date.now());

//       closeModal();

//       if (
//         username.toLowerCase() === "manish.p@yopmail.com" &&
//         (data.message.role || "").toLowerCase() === "general"
//       ) {
//         navigate("/FacePunch");
//       } else {
//         navigate("/dashboard");
//       }
//     } catch (error) {
//       setErrorMessage("An unexpected error occurred.");
//     }
//   };

//   return (
//     isModalOpen && (
//       <div className="login-container">
//         <div className="top-tabs-bar">
//           <span className="tab-link">Overview</span>
//           <span className="tab-link">Demo Request</span>
//           <button className="purchase-btn">Purchase</button>
//         </div>
//         <div className="login-card">
//           {/* <img src={logo} alt="Logo" className="card-logo" /> */}
//           <div className="login-left">
//             <h1>Welcome to</h1>
//             <h2 className="pulse-title">
//               <span className="pulse-big">Pulse</span>
//               <span className="pulse-small">work</span>
//             </h2>
//             <p>
//               PUNCH IN PUNCH OUT with Geolocation and face detection App
//               Categorized Recruitment approval process with related...
//             </p>
//             <div className="section-circles">
//               <div className="circle circle1"></div>
//               <div className="circle circle2"></div>
//             </div>
//           </div>
//           <div className="login-right">
//             <h2>Log In</h2>
//             <form onSubmit={handleSubmit}>
//               <div className="input-group">
//                 <input
//                   type="text"
//                   placeholder="Your user name"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                 />
//               </div>
//               <div className="input-group">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Your password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                 />
//                 <span
//                   className="toggle-password-icon"
//                   onClick={toggleShowPassword}
//                   role="button"
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                   tabIndex={0}
//                   onKeyPress={(e) => {
//                     if (e.key === "Enter" || e.key === " ") toggleShowPassword();
//                   }}
//                 >
//                   {showPassword ? <FaEyeSlash /> : <FaEye />}
//                 </span>
//               </div>
//               <div className="form-options">
//                 <a href="#" onClick={handleForgotPassword}>
//                   Forget Password?
//                 </a>
//               </div>
//               {errorMessage && <p className="error-msg">{errorMessage}</p>}
//               <button type="submit" className="login-btn">Log In</button>
//             </form>
//             <div className="section-circles1">
//               <div className="circle circle3"></div>
//               <div className="circle circle4"></div>
//             </div>
//           </div>
//         </div>
//         <div className="footer-text">
//           © 2022 Sukalpa Tech. All Rights Reserved.
//         </div>
//         {idleModalVisible && (
//           <Modal
//             isVisible={idleModalVisible}
//             onClose={handleIdleModalClose}
//             buttons={[{ label: "OK", onClick: handleIdleModalClose }]}
//           >
//             <p>You have been logged out due to inactivity.</p>
//           </Modal>
//         )}
//         {alertModal.isVisible && (
//           <Modal
//             isVisible={alertModal.isVisible}
//             onClose={closeAlert}
//             buttons={[{ label: "OK", onClick: closeAlert }]}
//           >
//             <p>{alertModal.message}</p>
//           </Modal>
//         )}
//       </div>
//     )
//   );
// };

// export default Login;


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Modal from "../Modal/Modal";
import logo from "../../assets/images/sukalpa_logo.png"; // Adjust path if needed

import "./Login.css";
// import logo from "../../assets/images/sukalpa_logo.png";

const Login = ({ onClose }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [idleModalVisible, setIdleModalVisible] = useState(false);
  const navigate = useNavigate();

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (sessionStorage.getItem("loggedOutDueToInactivity")) {
      setIdleModalVisible(true);
      sessionStorage.removeItem("loggedOutDueToInactivity");
    }
  }, []);

  const handleIdleModalClose = () => {
    setIdleModalVisible(false);
  };

  const showAlert = (message, title = "") => {
    setAlertModal({ isVisible: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isVisible: false, title: "", message: "" });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (onClose) onClose();
  };

  const handleForgotPassword = async () => {
    if (!username) {
      showAlert("Email ID is required to reset the password.");
      return;
    }
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
          body: JSON.stringify({ email: username }),
        }
      );
      const data = await response.json();
      response.ok
        ? showAlert("Password reset email sent!")
        : setErrorMessage(data.message || "Request failed");
    } catch (error) {
      setErrorMessage("An unexpected error occurred.");
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!username || !password) {
    setErrorMessage("Username and password are required.");
    return;
  }
  try {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/login`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
        body: JSON.stringify({ email: username, password }),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      setErrorMessage(data.message || "Invalid credentials.");
      return;
    }

    localStorage.setItem("userRole", data.message.role);
    localStorage.setItem("userName", data.message.name);
    localStorage.setItem("userGender", data.message.gender);
    localStorage.setItem("username", username);
    localStorage.setItem("orgId", data.message.org_id); // ✅ Fix: Use org_id
    localStorage.setItem(
      "dashboardData",
      JSON.stringify(data.message.dashboard)
    );
    localStorage.setItem(
      "sidebarMenu",
      JSON.stringify(data.message.sidebarMenu)
    );
    console.log("🔍 Org ID from login:", data.message.org_id); // ✅ Update debug log
    localStorage.setItem("lastActivity", Date.now());

    closeModal();

    if (
      username.toLowerCase() === "manish.p@yopmail.com" &&
      (data.message.role || "").toLowerCase() === "general"
    ) {
      navigate("/FacePunch");
    } else {
      navigate("/dashboard");
    }
  } catch (error) {
    setErrorMessage("An unexpected error occurred.");
  }
};
  return (
    isModalOpen && (
      <div className="login-container">
        <div className="top-tabs-bar">
          <span className="tab-link">Overview</span>
          <span className="tab-link">Demo Request</span>
          <button className="purchase-btn">Purchase</button>
        </div>
        <div className="login-card">
          <img src={logo} alt="Logo" className="card-logo" />
           
          {/* <img src={logo} alt="Logo" className="card-logo" /> */}
          <div className="login-left">
            <h1>Welcome to</h1>
            <h2 className="pulse-title">
              <span className="pulse-big">Pulse</span>
              <span className="pulse-small">work</span>
            </h2>
            <p>
              PUNCH IN PUNCH OUT with Geolocation and face detection App
              Categorized Recruitment approval process with related...
            </p>
            <div className="section-circles">
              <div className="circle circle1"></div>
              <div className="circle circle2"></div>
            </div>
          </div>
          <div className="login-right">
            <h2>Log In</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group-login">
                <input
                  type="text"
                  placeholder="Your user name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="input-group-login">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="toggle-password-icon"
                  onClick={toggleShowPassword}
                  role="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleShowPassword();
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <div className="form-options">
                <a href="#" onClick={handleForgotPassword}>
                  Forget Password?
                </a>
              </div>
              {errorMessage && <p className="error-msg">{errorMessage}</p>}
              <button type="submit" className="login-btn">Log In</button>
            </form>
            <div className="section-circles1">
              {/* <div className="circle circle3"></div> */}
              <div className="circle circle4"></div>
            </div>
          </div>
        </div>
        <div className="footer-text">
          © 2022 Sukalpa Tech. All Rights Reserved.
        </div>
        {idleModalVisible && (
          <Modal
            isVisible={idleModalVisible}
            onClose={handleIdleModalClose}
            buttons={[{ label: "OK", onClick: handleIdleModalClose }]}
          >
            <p>You have been logged out due to inactivity.</p>
          </Modal>
        )}
        {alertModal.isVisible && (
          <Modal
            isVisible={alertModal.isVisible}
            onClose={closeAlert}
            buttons={[{ label: "OK", onClick: closeAlert }]}
          >
            <p>{alertModal.message}</p>
          </Modal>
        )}
      </div>
    )
  );
};

export default Login;