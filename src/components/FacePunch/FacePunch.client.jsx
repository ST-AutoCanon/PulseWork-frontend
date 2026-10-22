


// // // // "use client";

// // // // import React, { useEffect, useRef, useState, useMemo } from "react";
// // // // import * as faceapi from "face-api.js";
// // // // import "./FacePunch.css";
// // // // import axios from "axios";
// // // // import { ToastContainer, toast } from "react-toastify";
// // // // import "react-toastify/dist/ReactToastify.css";
// // // // import { useAuth } from "../../context/AuthProvider.client";



// // // // const COOLDOWN_PERIOD = 10000;

// // // // const FacePunch = () => {
// // // //   const { user } = useAuth();

// // // //   const videoRef = useRef(null);
// // // //   const canvasRef = useRef(null);
// // // //   const streamRef = useRef(null);

// // // //   const [isVideoReady, setIsVideoReady] = useState(false);
// // // //   const [isProcessing, setIsProcessing] = useState(false);
// // // //   const [lastPunchTime, setLastPunchTime] = useState(0);
// // // //   const [cooldownRemaining, setCooldownRemaining] = useState(0);
// // // //   const [employeeInfo, setEmployeeInfo] = useState(null);
// // // //   const [faceMatcher, setFaceMatcher] = useState(null);

// // // //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// // // //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// // // //   function normalizeDescriptor(desc) {
// // // //   if (!desc) return null;

// // // //   // Already correct
// // // //   if (desc instanceof Float32Array) {
// // // //     return desc;
// // // //   }

// // // //   // From DB string: "[0.12, 0.33, ...]"
// // // //   if (typeof desc === "string") {
// // // //     return new Float32Array(JSON.parse(desc));
// // // //   }

// // // //   // From plain array
// // // //   if (Array.isArray(desc)) {
// // // //     return new Float32Array(desc);
// // // //   }

// // // //   // From object {0:...,1:...}
// // // //   if (typeof desc === "object") {
// // // //     return new Float32Array(Object.values(desc));
// // // //   }

// // // //   return null;
// // // // }

// // // //   const dashboardData =
// // // //     typeof window !== "undefined"
// // // //       ? JSON.parse(localStorage.getItem("dashboardData") || "{}")
// // // //       : {};

// // // //   const headers = useMemo(
// // // //     () => ({
// // // //       "x-api-key": API_KEY ?? "",
// // // //       "x-employee-id": dashboardData.employeeId || user?.employeeId || "",
// // // //       "x-org-id": dashboardData.orgId || user?.orgId || "",
// // // //     }),
// // // //     [API_KEY, dashboardData, user]
// // // //   );

// // // //   /* ---------------- Load Models + Camera ---------------- */
// // // //   useEffect(() => {
// // // //     if (!user) return;

// // // //     const loadModels = async () => {
// // // //       const MODEL_URL = "/models";
// // // //       try {
// // // //         await Promise.all([
// // // //           faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
// // // //           faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
// // // //           faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
// // // //         ]);
// // // //         startVideo();
// // // //       } catch {
// // // //         toast.error("Model loading failed");
// // // //       }
// // // //     };

// // // //     const startVideo = async () => {
// // // //       try {
// // // //         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
// // // //         streamRef.current = stream;
// // // //         videoRef.current.srcObject = stream;
// // // //         setIsVideoReady(true);
// // // //       } catch {
// // // //         toast.error("Unable to access webcam.");
// // // //       }
// // // //     };

// // // //     loadModels();

// // // //     return () => {
// // // //       streamRef.current?.getTracks().forEach((t) => t.stop());
// // // //       if (videoRef.current) videoRef.current.srcObject = null;
// // // //     };
// // // //   }, [user]);

// // // //   const processEmployeeDescriptors = (emp) => {
// // // //     const d128 = [];
// // // //     const d512 = [];

// // // //     emp.descriptors.forEach((d) => {
// // // //       const n = normalizeDescriptor(d);
// // // //       if (!n) return;

// // // //       if (n.length === 128) d128.push(n);
// // // //       if (n.length === 512) d512.push(n);
// // // //     });

// // // //     return { d128, d512 };
// // // //   };

// // // //   /* ---------------- LOAD ADMIN FACE DATA ---------------- */
// // // //   useEffect(() => {
// // // //     if (!user) return;

// // // //     const loadFaceData = async () => {
// // // //       try {
// // // //         const res = await axios.get(
// // // //           `${BACKEND_URL}/face-punch/face-data`,
// // // //           { headers, withCredentials: true }
// // // //         );

// // // //         const desc128 = [];
// // // //         const desc512 = [];

// // // //         res.data.faces.forEach((emp) => {
// // // //           const { d128, d512 } = processEmployeeDescriptors(emp);

// // // //           if (d128.length)
// // // //             desc128.push(new faceapi.LabeledFaceDescriptors(emp.employee_id, d128));

// // // //           if (d512.length)
// // // //             desc512.push(new faceapi.LabeledFaceDescriptors(emp.employee_id, d512));
// // // //         });

// // // //         setFaceMatcher({
// // // //           matcher128: desc128.length ? new faceapi.FaceMatcher(desc128, 0.45) : null,
// // // //           matcher512: desc512.length ? new faceapi.FaceMatcher(desc512, 0.45) : null,
// // // //         });

// // // //       } catch {
// // // //         toast.error("Failed to load face data");
// // // //       }
// // // //     };

// // // //     loadFaceData();
// // // //   }, [user]);

// // // //   const performDetection = async () => {
// // // //     const detections = await faceapi
// // // //       .detectAllFaces(
// // // //         videoRef.current,
// // // //         new faceapi.TinyFaceDetectorOptions()
// // // //       )
// // // //       .withFaceLandmarks()
// // // //       .withFaceDescriptors();

// // // //     if (canvasRef.current) {
// // // //       const canvas = canvasRef.current;
// // // //       const displaySize = {
// // // //         width: videoRef.current.videoWidth,
// // // //         height: videoRef.current.videoHeight,
// // // //       };
// // // //       faceapi.matchDimensions(canvas, displaySize);
// // // //       const resized = faceapi.resizeResults(detections, displaySize);
// // // //       canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
// // // //       faceapi.draw.drawDetections(canvas, resized);
// // // //     }

// // // //     return detections;
// // // //   };

// // // //   const validateDetection = (detection) => {
// // // //     const score = detection.detection.score;
// // // //     const box = detection.detection.box;
// // // //     const faceArea = box.width * box.height;
// // // //     const frameArea = videoRef.current.videoWidth * videoRef.current.videoHeight;
// // // //     const faceCoverage = faceArea / frameArea;

// // // //     if (score < 0.85) {
// // // //       toast.warn("Face not clear. Please face the camera properly.", {
// // // //         autoClose: 2000,
// // // //       });
// // // //       return false;
// // // //     }

// // // //     if (faceCoverage < 0.06) {
// // // //       toast.warn("Come closer to the camera.", { autoClose: 2000 });
// // // //       return false;
// // // //     }

// // // //     return true;
// // // //   };

// // // //   const findMatch = (detection) => {
// // // //     let match = null;

// // // //     if (detection.descriptor.length === 128 && faceMatcher.matcher128) {
// // // //       match = faceMatcher.matcher128.findBestMatch(detection.descriptor);
// // // //     }

// // // //     if (detection.descriptor.length === 512 && faceMatcher.matcher512) {
// // // //       match = faceMatcher.matcher512.findBestMatch(detection.descriptor);
// // // //     }

// // // //     if (!match || match.label === "unknown") {
// // // //       toast.warn("Face not recognized", { autoClose: 2000 });
// // // //       return null;
// // // //     }

// // // //     return match;
// // // //   };

// // // //   const handlePunch = async (match, detection) => {
// // // //     await punch({
// // // //       descriptor: detection.descriptor,
// // // //       employeeId: match.label,
// // // //     });

// // // //     setLastPunchTime(Date.now());
// // // //     setCooldownRemaining(COOLDOWN_PERIOD / 1000);
// // // //   };

// // // //   /* ---------------- Detection Loop ---------------- */
// // // //   useEffect(() => {
// // // //     if (!isVideoReady) return;

// // // //     const intervalId = setInterval(async () => {
// // // //       const now = Date.now();
// // // //       if (isProcessing) return;

// // // //       if (now - lastPunchTime < COOLDOWN_PERIOD) {
// // // //         setCooldownRemaining(
// // // //           Math.ceil((COOLDOWN_PERIOD - (now - lastPunchTime)) / 1000)
// // // //         );
// // // //         return;
// // // //       }

// // // //       if (!videoRef.current || !faceMatcher) return;

// // // //       try {
// // // //         setIsProcessing(true);

// // // //         const detections = await performDetection();

// // // //         if (detections.length === 1) {
// // // //           const detection = detections[0];
// // // //           if (!validateDetection(detection)) return;
// // // //           const match = findMatch(detection);
// // // //           if (!match) return;
// // // //           await handlePunch(match, detection);
// // // //         } else if (detections.length > 1) {
// // // //           toast.warn(
// // // //             "Multiple faces detected. Only one person should be visible.",
// // // //             { autoClose: 2000 }
// // // //           );
// // // //         }
// // // //       } finally {
// // // //         setIsProcessing(false);
// // // //       }
// // // //     }, 1000);

// // // //     return () => clearInterval(intervalId);
// // // //   }, [isVideoReady, isProcessing, lastPunchTime, faceMatcher]);

// // // //   /* ---------------- Punch API ---------------- */
// // // //   const punch = async ({ descriptor, employeeId }) => {
// // // //     try {
// // // //       const res = await axios.post(
// // // //         `${BACKEND_URL}/face-punch`,
// // // //         {
// // // //           descriptor: Array.from(descriptor),
// // // //           employeeId,
// // // //           device: "Desktop",
// // // //           location: "Office HQ",
// // // //         },
// // // //         { withCredentials: true, headers }
// // // //       );

// // // //       const name = res.data.employee_name || "Employee";
// // // //       const status = res.data.message.toLowerCase().includes("out")
// // // //         ? "punched out"
// // // //         : "punched in";

// // // //       setEmployeeInfo({ id: res.data.employee_id, name });

// // // //       window.speechSynthesis.speak(
// // // //         new SpeechSynthesisUtterance(`${name} ${status}`)
// // // //       );

// // // //       toast.success(res.data.message);
// // // //     } catch {
// // // //       toast.error("Punch failed");
// // // //     }
// // // //   };

// // // //   /* ---------------- UI ---------------- */
// // // //   return (
// // // //     <>
// // // //       <div className="face-punch-container">
// // // //         <video ref={videoRef} autoPlay muted width="720" height="560" />
// // // //         <canvas ref={canvasRef} className="overlay-canvas" />
// // // //       </div>

// // // //       <div className="employee-info-message">
// // // //         {employeeInfo
// // // //           ? `Detected: ${employeeInfo.name} (${employeeInfo.id})`
// // // //           : "No employee detected yet."}
// // // //       </div>

// // // //       {(isProcessing || cooldownRemaining > 0) && (
// // // //         <div className="cooldown-message">
// // // //           {isProcessing
// // // //             ? "Processing punch..."
// // // //             : `Wait ${cooldownRemaining}s`}
// // // //         </div>
// // // //       )}

// // // //       <ToastContainer position="top-center" style={{ marginTop: "40px" }} />
// // // //     </>
// // // //   );
// // // // };

// // // // export default FacePunch;


// // // "use client";

// // // import React, { useEffect, useRef, useState, useMemo } from "react";
// // // import * as faceapi from "face-api.js";
// // // import "./FacePunch.css";
// // // import axios from "axios";
// // // import { ToastContainer, toast } from "react-toastify";
// // // import "react-toastify/dist/ReactToastify.css";
// // // import { useAuth } from "../../context/AuthProvider.client";

// // // const COOLDOWN_PERIOD = 10000;

// // // const FacePunch = () => {
// // //   const { user } = useAuth();

// // //   const videoRef = useRef(null);
// // //   const canvasRef = useRef(null);
// // //   const streamRef = useRef(null);

// // //   const [isVideoReady, setIsVideoReady] = useState(false);
// // //   const [isProcessing, setIsProcessing] = useState(false);
// // //   const [lastPunchTime, setLastPunchTime] = useState(0);
// // //   const [cooldownRemaining, setCooldownRemaining] = useState(0);
// // //   const [employeeInfo, setEmployeeInfo] = useState(null);
// // //   const [faceMatcher, setFaceMatcher] = useState(null);
// // //   const [recentCheckIns, setRecentCheckIns] = useState([]);
// // //   const [currentTime, setCurrentTime] = useState(new Date());
// // //   const [showSuccess, setShowSuccess] = useState(false);

// // //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// // //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// // //   function normalizeDescriptor(desc) {
// // //     if (!desc) return null;
// // //     if (desc instanceof Float32Array) return desc;
// // //     if (typeof desc === "string") return new Float32Array(JSON.parse(desc));
// // //     if (Array.isArray(desc)) return new Float32Array(desc);
// // //     if (typeof desc === "object") return new Float32Array(Object.values(desc));
// // //     return null;
// // //   }

// // //   const dashboardData =
// // //     typeof window !== "undefined"
// // //       ? JSON.parse(localStorage.getItem("dashboardData") || "{}")
// // //       : {};

// // //   const headers = useMemo(
// // //     () => ({
// // //       "x-api-key": API_KEY ?? "",
// // //       "x-employee-id": dashboardData.employeeId || user?.employeeId || "",
// // //       "x-org-id": dashboardData.orgId || user?.orgId || "",
// // //     }),
// // //     [API_KEY, dashboardData, user]
// // //   );

// // //   // Live clock
// // //   useEffect(() => {
// // //     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
// // //     return () => clearInterval(timer);
// // //   }, []);

// // //   /* ---------------- Load Models + Camera ---------------- */
// // //   useEffect(() => {
// // //     if (!user) return;

// // //     const loadModels = async () => {
// // //       const MODEL_URL = "/models";
// // //       try {
// // //         await Promise.all([
// // //           faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
// // //           faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
// // //           faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
// // //         ]);
// // //         startVideo();
// // //       } catch {
// // //         toast.error("Model loading failed");
// // //       }
// // //     };

// // //     const startVideo = async () => {
// // //       try {
// // //         const stream = await navigator.mediaDevices.getUserMedia({
// // //           video: { width: 640, height: 480 },
// // //         });
// // //         streamRef.current = stream;
// // //         if (videoRef.current) {
// // //           videoRef.current.srcObject = stream;
// // //           setIsVideoReady(true);
// // //         }
// // //       } catch {
// // //         toast.error("Unable to access webcam.");
// // //       }
// // //     };

// // //     loadModels();

// // //     return () => {
// // //       streamRef.current?.getTracks().forEach((t) => t.stop());
// // //       if (videoRef.current) videoRef.current.srcObject = null;
// // //     };
// // //   }, [user]);

// // //   const processEmployeeDescriptors = (emp) => {
// // //     const d128 = [];
// // //     const d512 = [];
// // //     emp.descriptors.forEach((d) => {
// // //       const n = normalizeDescriptor(d);
// // //       if (!n) return;
// // //       if (n.length === 128) d128.push(n);
// // //       if (n.length === 512) d512.push(n);
// // //     });
// // //     return { d128, d512 };
// // //   };

// // //   /* ---------------- LOAD FACE DATA + RECENT CHECK-INS ---------------- */
// // //   useEffect(() => {
// // //     if (!user) return;

// // //     const loadFaceData = async () => {
// // //       try {
// // //         const res = await axios.get(`${BACKEND_URL}/face-punch/face-data`, {
// // //           headers,
// // //           withCredentials: true,
// // //         });

// // //         const desc128 = [];
// // //         const desc512 = [];

// // //         res.data.faces.forEach((emp) => {
// // //           const { d128, d512 } = processEmployeeDescriptors(emp);
// // //           if (d128.length)
// // //             desc128.push(new faceapi.LabeledFaceDescriptors(emp.employee_id, d128));
// // //           if (d512.length)
// // //             desc512.push(new faceapi.LabeledFaceDescriptors(emp.employee_id, d512));
// // //         });

// // //         setFaceMatcher({
// // //           matcher128: desc128.length ? new faceapi.FaceMatcher(desc128, 0.45) : null,
// // //           matcher512: desc512.length ? new faceapi.FaceMatcher(desc512, 0.45) : null,
// // //         });
// // //       } catch {
// // //         toast.error("Failed to load face data");
// // //       }
// // //     };

// // //     // Optional: load recent check-ins if you have an endpoint
// // //     const loadRecent = async () => {
// // //       try {
// // //         // Replace with your actual endpoint if available
// // //         // const res = await axios.get(`${BACKEND_URL}/face-punch/recent`, { headers, withCredentials: true });
// // //         // setRecentCheckIns(res.data || []);
// // //       } catch {
// // //         // silent
// // //       }
// // //     };

// // //     loadFaceData();
// // //     loadRecent();
// // //   }, [user]);

// // //   const performDetection = async () => {
// // //     const detections = await faceapi
// // //       .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
// // //       .withFaceLandmarks()
// // //       .withFaceDescriptors();

// // //     if (canvasRef.current && videoRef.current) {
// // //       const canvas = canvasRef.current;
// // //       const displaySize = {
// // //         width: videoRef.current.videoWidth,
// // //         height: videoRef.current.videoHeight,
// // //       };
// // //       faceapi.matchDimensions(canvas, displaySize);
// // //       const resized = faceapi.resizeResults(detections, displaySize);
// // //       const ctx = canvas.getContext("2d");
// // //       ctx.clearRect(0, 0, canvas.width, canvas.height);
// // //       faceapi.draw.drawDetections(canvas, resized);
// // //     }

// // //     return detections;
// // //   };

// // //   const validateDetection = (detection) => {
// // //     const score = detection.detection.score;
// // //     const box = detection.detection.box;
// // //     const faceArea = box.width * box.height;
// // //     const frameArea = videoRef.current.videoWidth * videoRef.current.videoHeight;
// // //     const faceCoverage = faceArea / frameArea;

// // //     if (score < 0.85) {
// // //       toast.warn("Face not clear. Please face the camera properly.", { autoClose: 2000 });
// // //       return false;
// // //     }
// // //     if (faceCoverage < 0.06) {
// // //       toast.warn("Come closer to the camera.", { autoClose: 2000 });
// // //       return false;
// // //     }
// // //     return true;
// // //   };

// // //   const findMatch = (detection) => {
// // //     let match = null;
// // //     if (detection.descriptor.length === 128 && faceMatcher?.matcher128) {
// // //       match = faceMatcher.matcher128.findBestMatch(detection.descriptor);
// // //     }
// // //     if (detection.descriptor.length === 512 && faceMatcher?.matcher512) {
// // //       match = faceMatcher.matcher512.findBestMatch(detection.descriptor);
// // //     }
// // //     if (!match || match.label === "unknown") {
// // //       toast.warn("Face not recognized", { autoClose: 2000 });
// // //       return null;
// // //     }
// // //     return match;
// // //   };

// // //   const handlePunch = async (match, detection) => {
// // //     await punch({
// // //       descriptor: detection.descriptor,
// // //       employeeId: match.label,
// // //     });
// // //     setLastPunchTime(Date.now());
// // //     setCooldownRemaining(COOLDOWN_PERIOD / 1000);
// // //   };

// // //   /* ---------------- Detection Loop ---------------- */
// // //   useEffect(() => {
// // //     if (!isVideoReady) return;

// // //     const intervalId = setInterval(async () => {
// // //       const now = Date.now();
// // //       if (isProcessing) return;

// // //       if (now - lastPunchTime < COOLDOWN_PERIOD) {
// // //         setCooldownRemaining(Math.ceil((COOLDOWN_PERIOD - (now - lastPunchTime)) / 1000));
// // //         return;
// // //       }

// // //       if (!videoRef.current || !faceMatcher) return;

// // //       try {
// // //         setIsProcessing(true);
// // //         const detections = await performDetection();

// // //         if (detections.length === 1) {
// // //           const detection = detections[0];
// // //           if (!validateDetection(detection)) return;
// // //           const match = findMatch(detection);
// // //           if (!match) return;
// // //           await handlePunch(match, detection);
// // //         } else if (detections.length > 1) {
// // //           toast.warn("Multiple faces detected. Only one person should be visible.", {
// // //             autoClose: 2000,
// // //           });
// // //         }
// // //       } finally {
// // //         setIsProcessing(false);
// // //       }
// // //     }, 1000);

// // //     return () => clearInterval(intervalId);
// // //   }, [isVideoReady, isProcessing, lastPunchTime, faceMatcher]);

// // //   /* ---------------- Punch API ---------------- */
// // //   const punch = async ({ descriptor, employeeId }) => {
// // //     try {
// // //       const res = await axios.post(
// // //         `${BACKEND_URL}/face-punch`,
// // //         {
// // //           descriptor: Array.from(descriptor),
// // //           employeeId,
// // //           device: "Desktop",
// // //           location: "Office HQ",
// // //         },
// // //         { withCredentials: true, headers }
// // //       );

// // //       const name = res.data.employee_name || "Employee";
// // //       const status = res.data.message.toLowerCase().includes("out")
// // //         ? "punched out"
// // //         : "punched in";

// // //       setEmployeeInfo({ id: res.data.employee_id, name });
// // //       setShowSuccess(true);

// // //       // Add to recent list (optimistic)
// // //       setRecentCheckIns((prev) => [
// // //         {
// // //           id: res.data.employee_id,
// // //           name,
// // //           time: new Date().toLocaleTimeString("en-US", {
// // //             hour: "2-digit",
// // //             minute: "2-digit",
// // //             hour12: true,
// // //           }),
// // //           photo: res.data.photo || null, // if backend returns photo
// // //         },
// // //         ...prev.slice(0, 4),
// // //       ]);

// // //       // Hide success after 4 seconds
// // //       setTimeout(() => setShowSuccess(false), 4000);

// // //       window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${name} ${status}`));
// // //       toast.success(res.data.message);
// // //     } catch {
// // //       toast.error("Punch failed");
// // //     }
// // //   };

// // //   // Format helpers
// // //   const timeStr = currentTime.toLocaleTimeString("en-US", {
// // //     hour: "2-digit",
// // //     minute: "2-digit",
// // //     hour12: true,
// // //   });
// // //   const dateStr = currentTime.toLocaleDateString("en-GB", {
// // //     weekday: "short",
// // //     day: "2-digit",
// // //     month: "short",
// // //     year: "numeric",
// // //   });

// // //   return (
// // //     <div className="device-wrapper">
// // //       {/* Red device frame */}
// // //       <div className="device-bezel">
// // //         {/* Camera bar */}
// // //         <div className="camera-bar">
// // //           <div className="camera-sensors">
// // //             <div className="sensor"></div>
// // //             <div className="lens"></div>
// // //             <div className="lens main"></div>
// // //             <div className="lens"></div>
// // //             <div className="sensor"></div>
// // //           </div>
// // //         </div>

// // //         {/* Main screen */}
// // //         <div className="device-screen">
// // //           {/* LEFT PANEL */}
// // //           <div className="panel left-panel">
// // //             <div className="logo-area">
// // //               <div className="logo-icon">S</div>
// // //               <div>
// // //                 <div className="logo-text">Sukalpatech</div>
// // //                 <div className="logo-sub">Solutions</div>
// // //               </div>
// // //             </div>

// // //             <div className="time-block">
// // //               <div className="big-time">{timeStr}</div>
// // //               <div className="date">{dateStr}</div>
// // //             </div>

// // //             <div className="weather">
// // //               <span className="weather-icon">☀️</span>
// // //               <div>
// // //                 <div className="temp">24°C</div>
// // //                 <div className="city">Bangalore</div>
// // //               </div>
// // //             </div>

// // //             <div className="slogan">
// // //               Better People
// // //               <br />
// // //               Build a Brighter Future
// // //             </div>
// // //           </div>

// // //           {/* CENTER PANEL - Camera */}
// // //           <div className="panel center-panel">
// // //             <div className="camera-container">
// // //               <video ref={videoRef} autoPlay muted playsInline />
// // //               <canvas ref={canvasRef} className="overlay-canvas" />

// // //               {/* Face guide corners */}
// // //               <div className="face-guide">
// // //                 <span className="corner tl"></span>
// // //                 <span className="corner tr"></span>
// // //                 <span className="corner bl"></span>
// // //                 <span className="corner br"></span>
// // //               </div>

// // //               {/* Success overlay */}
// // //               {showSuccess && employeeInfo && (
// // //                 <div className="success-overlay">
// // //                   <div className="success-check">✓</div>
// // //                   <div className="success-title">Check-in Successful</div>
// // //                   <div className="success-name">{employeeInfo.name}</div>
// // //                   <div className="success-time">
// // //                     {timeStr} | {dateStr}
// // //                   </div>
// // //                 </div>
// // //               )}
// // //             </div>
// // //           </div>

// // //           {/* RIGHT PANEL - Recent */}
// // //           <div className="panel right-panel">
// // //             <div className="recent-title">Recently Checked In</div>
// // //             <div className="recent-list">
// // //               {recentCheckIns.length === 0 ? (
// // //                 <div className="empty-recent">No recent check-ins yet</div>
// // //               ) : (
// // //                 recentCheckIns.map((item, idx) => (
// // //                   <div key={idx} className="recent-item">
// // //                     <div className="avatar">
// // //                       {item.photo ? (
// // //                         <img src={item.photo} alt={item.name} />
// // //                       ) : (
// // //                         <span>{item.name.charAt(0)}</span>
// // //                       )}
// // //                     </div>
// // //                     <div className="info">
// // //                       <div className="name">{item.name}</div>
// // //                       <div className="time">{item.time}</div>
// // //                     </div>
// // //                     <div className="check">✓</div>
// // //                   </div>
// // //                 ))
// // //               )}
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* Bottom speaker grille */}
// // //         <div className="speaker-grille"></div>
// // //       </div>

// // //       {/* Cooldown indicator (outside device) */}
// // //       {(isProcessing || cooldownRemaining > 0) && (
// // //         <div className="cooldown-bar">
// // //           {isProcessing ? "Processing..." : `Wait ${cooldownRemaining}s`}
// // //         </div>
// // //       )}

// // //       <ToastContainer position="top-center" style={{ marginTop: "20px" }} />
// // //     </div>
// // //   );
// // // };

// // // export default FacePunch;

// // "use client";

// // import React, { useEffect, useRef, useState, useMemo } from "react";
// // import * as faceapi from "face-api.js";
// // import "./FacePunch.css";
// // import axios from "axios";
// // import { ToastContainer, toast } from "react-toastify";
// // import "react-toastify/dist/ReactToastify.css";
// // import { useAuth } from "../../context/AuthProvider.client";

// // const COOLDOWN_PERIOD = 10000;

// // const FacePunch = () => {
// //   const { user } = useAuth();

// //   const videoRef = useRef(null);
// //   const canvasRef = useRef(null);
// //   const streamRef = useRef(null);

// //   const [isVideoReady, setIsVideoReady] = useState(false);
// //   const [isProcessing, setIsProcessing] = useState(false);
// //   const [lastPunchTime, setLastPunchTime] = useState(0);
// //   const [cooldownRemaining, setCooldownRemaining] = useState(0);
// //   const [employeeInfo, setEmployeeInfo] = useState(null);
// //   const [faceMatcher, setFaceMatcher] = useState(null);
// //   const [recentCheckIns, setRecentCheckIns] = useState([]);
// //   const [currentTime, setCurrentTime] = useState(new Date());
// //   const [showSuccess, setShowSuccess] = useState(false);

// //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// //   function normalizeDescriptor(desc) {
// //     if (!desc) return null;
// //     if (desc instanceof Float32Array) return desc;
// //     if (typeof desc === "string") return new Float32Array(JSON.parse(desc));
// //     if (Array.isArray(desc)) return new Float32Array(desc);
// //     if (typeof desc === "object") return new Float32Array(Object.values(desc));
// //     return null;
// //   }

// //   const dashboardData =
// //     typeof window !== "undefined"
// //       ? JSON.parse(localStorage.getItem("dashboardData") || "{}")
// //       : {};

// //   const headers = useMemo(
// //     () => ({
// //       "x-api-key": API_KEY ?? "",
// //       "x-employee-id": dashboardData.employeeId || user?.employeeId || "",
// //       "x-org-id": dashboardData.orgId || user?.orgId || "",
// //     }),
// //     [API_KEY, dashboardData, user]
// //   );

// //   // Live clock
// //   useEffect(() => {
// //     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
// //     return () => clearInterval(timer);
// //   }, []);

// //   /* ---------------- Load Models + Camera ---------------- */
// //   useEffect(() => {
// //     if (!user) return;

// //     const loadModels = async () => {
// //       const MODEL_URL = "/models";
// //       try {
// //         await Promise.all([
// //           faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
// //           faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
// //           faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
// //         ]);
// //         startVideo();
// //       } catch {
// //         toast.error("Model loading failed");
// //       }
// //     };

// //     const startVideo = async () => {
// //       try {
// //         const stream = await navigator.mediaDevices.getUserMedia({
// //           video: { width: 640, height: 480 },
// //         });
// //         streamRef.current = stream;
// //         if (videoRef.current) {
// //           videoRef.current.srcObject = stream;
// //           setIsVideoReady(true);
// //         }
// //       } catch {
// //         toast.error("Unable to access webcam.");
// //       }
// //     };

// //     loadModels();

// //     return () => {
// //       streamRef.current?.getTracks().forEach((t) => t.stop());
// //       if (videoRef.current) videoRef.current.srcObject = null;
// //     };
// //   }, [user]);

// //   const processEmployeeDescriptors = (emp) => {
// //     const d128 = [];
// //     const d512 = [];
// //     emp.descriptors.forEach((d) => {
// //       const n = normalizeDescriptor(d);
// //       if (!n) return;
// //       if (n.length === 128) d128.push(n);
// //       if (n.length === 512) d512.push(n);
// //     });
// //     return { d128, d512 };
// //   };

// //   /* ---------------- LOAD FACE DATA ---------------- */
// //   useEffect(() => {
// //     if (!user) return;

// //     const loadFaceData = async () => {
// //       try {
// //         const res = await axios.get(`${BACKEND_URL}/face-punch/face-data`, {
// //           headers,
// //           withCredentials: true,
// //         });

// //         const desc128 = [];
// //         const desc512 = [];

// //         res.data.faces.forEach((emp) => {
// //           const { d128, d512 } = processEmployeeDescriptors(emp);
// //           if (d128.length)
// //             desc128.push(new faceapi.LabeledFaceDescriptors(emp.employee_id, d128));
// //           if (d512.length)
// //             desc512.push(new faceapi.LabeledFaceDescriptors(emp.employee_id, d512));
// //         });

// //         setFaceMatcher({
// //           matcher128: desc128.length ? new faceapi.FaceMatcher(desc128, 0.45) : null,
// //           matcher512: desc512.length ? new faceapi.FaceMatcher(desc512, 0.45) : null,
// //         });
// //       } catch {
// //         toast.error("Failed to load face data");
// //       }
// //     };

// //     loadFaceData();
// //   }, [user]);

// //   const performDetection = async () => {
// //     const detections = await faceapi
// //       .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
// //       .withFaceLandmarks()
// //       .withFaceDescriptors();

// //     if (canvasRef.current && videoRef.current) {
// //       const canvas = canvasRef.current;
// //       const displaySize = {
// //         width: videoRef.current.videoWidth,
// //         height: videoRef.current.videoHeight,
// //       };
// //       faceapi.matchDimensions(canvas, displaySize);
// //       const resized = faceapi.resizeResults(detections, displaySize);
// //       const ctx = canvas.getContext("2d");
// //       ctx.clearRect(0, 0, canvas.width, canvas.height);
// //       faceapi.draw.drawDetections(canvas, resized);
// //     }

// //     return detections;
// //   };

// //   const validateDetection = (detection) => {
// //     const score = detection.detection.score;
// //     const box = detection.detection.box;
// //     const faceArea = box.width * box.height;
// //     const frameArea = videoRef.current.videoWidth * videoRef.current.videoHeight;
// //     const faceCoverage = faceArea / frameArea;

// //     if (score < 0.85) {
// //       toast.warn("Face not clear. Please face the camera properly.", { autoClose: 2000 });
// //       return false;
// //     }
// //     if (faceCoverage < 0.06) {
// //       toast.warn("Come closer to the camera.", { autoClose: 2000 });
// //       return false;
// //     }
// //     return true;
// //   };

// //   const findMatch = (detection) => {
// //     let match = null;
// //     if (detection.descriptor.length === 128 && faceMatcher?.matcher128) {
// //       match = faceMatcher.matcher128.findBestMatch(detection.descriptor);
// //     }
// //     if (detection.descriptor.length === 512 && faceMatcher?.matcher512) {
// //       match = faceMatcher.matcher512.findBestMatch(detection.descriptor);
// //     }
// //     if (!match || match.label === "unknown") {
// //       toast.warn("Face not recognized", { autoClose: 2000 });
// //       return null;
// //     }
// //     return match;
// //   };

// //   const handlePunch = async (match, detection) => {
// //     await punch({
// //       descriptor: detection.descriptor,
// //       employeeId: match.label,
// //     });
// //     setLastPunchTime(Date.now());
// //     setCooldownRemaining(COOLDOWN_PERIOD / 1000);
// //   };

// //   /* ---------------- Detection Loop ---------------- */
// //   useEffect(() => {
// //     if (!isVideoReady) return;

// //     const intervalId = setInterval(async () => {
// //       const now = Date.now();
// //       if (isProcessing) return;

// //       if (now - lastPunchTime < COOLDOWN_PERIOD) {
// //         setCooldownRemaining(Math.ceil((COOLDOWN_PERIOD - (now - lastPunchTime)) / 1000));
// //         return;
// //       }

// //       if (!videoRef.current || !faceMatcher) return;

// //       try {
// //         setIsProcessing(true);
// //         const detections = await performDetection();

// //         if (detections.length === 1) {
// //           const detection = detections[0];
// //           if (!validateDetection(detection)) return;
// //           const match = findMatch(detection);
// //           if (!match) return;
// //           await handlePunch(match, detection);
// //         } else if (detections.length > 1) {
// //           toast.warn("Multiple faces detected. Only one person should be visible.", {
// //             autoClose: 2000,
// //           });
// //         }
// //       } finally {
// //         setIsProcessing(false);
// //       }
// //     }, 1000);

// //     return () => clearInterval(intervalId);
// //   }, [isVideoReady, isProcessing, lastPunchTime, faceMatcher]);

// //   /* ---------------- Punch API ---------------- */
// //   const punch = async ({ descriptor, employeeId }) => {
// //     try {
// //       const res = await axios.post(
// //         `${BACKEND_URL}/face-punch`,
// //         {
// //           descriptor: Array.from(descriptor),
// //           employeeId,
// //           device: "Desktop",
// //           location: "Office HQ",
// //         },
// //         { withCredentials: true, headers }
// //       );

// //       const name = res.data.employee_name || "Employee";
// //       const status = res.data.message.toLowerCase().includes("out")
// //         ? "punched out"
// //         : "punched in";

// //       setEmployeeInfo({ id: res.data.employee_id, name });
// //       setShowSuccess(true);

// //       // Add to recent list
// //       setRecentCheckIns((prev) => [
// //         {
// //           id: res.data.employee_id,
// //           name,
// //           time: new Date().toLocaleTimeString("en-US", {
// //             hour: "2-digit",
// //             minute: "2-digit",
// //             hour12: true,
// //           }),
// //           photo: res.data.photo || null,
// //         },
// //         ...prev.slice(0, 4),
// //       ]);

// //       setTimeout(() => setShowSuccess(false), 4000);

// //       window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${name} ${status}`));
// //       toast.success(res.data.message);
// //     } catch {
// //       toast.error("Punch failed");
// //     }
// //   };

// //   const timeStr = currentTime.toLocaleTimeString("en-US", {
// //     hour: "2-digit",
// //     minute: "2-digit",
// //     hour12: true,
// //   });
// //   const dateStr = currentTime.toLocaleDateString("en-GB", {
// //     weekday: "short",
// //     day: "2-digit",
// //     month: "short",
// //     year: "numeric",
// //   });

// //   return (
// //     <div className="face-punch-ui">
// //       {/* LEFT PANEL */}
// //       <div className="panel left-panel">
// //         <div className="logo-area">
// //           <div className="logo-icon">S</div>
// //           <div>
// //             <div className="logo-text">Sukalpatech</div>
// //             <div className="logo-sub">Solutions</div>
// //           </div>
// //         </div>

// //         <div className="time-block">
// //           <div className="big-time">{timeStr}</div>
// //           <div className="date">{dateStr}</div>
// //         </div>

// //         <div className="weather">
// //           <span className="weather-icon">☀️</span>
// //           <div>
// //             <div className="temp">24°C</div>
// //             <div className="city">Bangalore</div>
// //           </div>
// //         </div>

// //         <div className="slogan">
// //           Better People
// //           <br />
// //           Build a Brighter Future
// //         </div>
// //       </div>

// //       {/* CENTER PANEL */}
// //       <div className="panel center-panel">
// //         <div className="camera-container">
// //           <video ref={videoRef} autoPlay muted playsInline />
// //           <canvas ref={canvasRef} className="overlay-canvas" />

// //           {/* Face guide corners */}
// //           <div className="face-guide">
// //             <span className="corner tl"></span>
// //             <span className="corner tr"></span>
// //             <span className="corner bl"></span>
// //             <span className="corner br"></span>
// //           </div>

// //           {/* Success overlay */}
// //           {showSuccess && employeeInfo && (
// //             <div className="success-overlay">
// //               <div className="success-check">✓</div>
// //               <div className="success-title">Check-in Successful</div>
// //               <div className="success-name">{employeeInfo.name}</div>
// //               <div className="success-time">
// //                 {timeStr} | {dateStr}
// //               </div>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       {/* RIGHT PANEL */}
// //       <div className="panel right-panel">
// //         <div className="recent-title">Recently Checked In</div>
// //         <div className="recent-list">
// //           {recentCheckIns.length === 0 ? (
// //             <div className="empty-recent">No recent check-ins yet</div>
// //           ) : (
// //             recentCheckIns.map((item, idx) => (
// //               <div key={idx} className="recent-item">
// //                 <div className="avatar">
// //                   {item.photo ? (
// //                     <img src={item.photo} alt={item.name} />
// //                   ) : (
// //                     <span>{item.name.charAt(0)}</span>
// //                   )}
// //                 </div>
// //                 <div className="info">
// //                   <div className="name">{item.name}</div>
// //                   <div className="time">{item.time}</div>
// //                 </div>
// //                 <div className="check">✓</div>
// //               </div>
// //             ))
// //           )}
// //         </div>
// //       </div>

// //       {/* Cooldown message */}
// //       {(isProcessing || cooldownRemaining > 0) && (
// //         <div className="cooldown-message">
// //           {isProcessing ? "Processing punch..." : `Wait ${cooldownRemaining}s`}
// //         </div>
// //       )}

// //       <ToastContainer position="top-center" style={{ marginTop: "20px" }} />
// //     </div>
// //   );
// // };

// // export default FacePunch;

// "use client";

// import React, { useEffect, useRef, useState, useMemo } from "react";
// import * as faceapi from "face-api.js";
// import "./FacePunch.css";
// import axios from "axios";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { useAuth } from "../../context/AuthProvider.client";

// const COOLDOWN_PERIOD = 10000;

// const FacePunch = () => {
//   const { user } = useAuth();

//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const streamRef = useRef(null);

//   const [isVideoReady, setIsVideoReady] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [lastPunchTime, setLastPunchTime] = useState(0);
//   const [cooldownRemaining, setCooldownRemaining] = useState(0);
//   const [employeeInfo, setEmployeeInfo] = useState(null);
//   const [faceMatcher, setFaceMatcher] = useState(null);
//   const [recentCheckIns, setRecentCheckIns] = useState([]);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [dailyQuote, setDailyQuote] = useState("Better People Build a Brighter Future");

//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

//   function normalizeDescriptor(desc) {
//     if (!desc) return null;
//     if (desc instanceof Float32Array) return desc;
//     if (typeof desc === "string") return new Float32Array(JSON.parse(desc));
//     if (Array.isArray(desc)) return new Float32Array(desc);
//     if (typeof desc === "object") return new Float32Array(Object.values(desc));
//     return null;
//   }

//   const dashboardData =
//     typeof window !== "undefined"
//       ? JSON.parse(localStorage.getItem("dashboardData") || "{}")
//       : {};

//   const headers = useMemo(
//     () => ({
//       "x-api-key": API_KEY ?? "",
//       "x-employee-id": dashboardData.employeeId || user?.employeeId || "",
//       "x-org-id": dashboardData.orgId || user?.orgId || "",
//     }),
//     [API_KEY, dashboardData, user]
//   );

//   // Live clock
//   useEffect(() => {
//     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // Load daily quote (same quote for the whole day)
//   useEffect(() => {
//     const loadQuote = async () => {
//       try {
//         const res = await fetch("/quotes.json");
//         const quotes = await res.json();

//         if (!Array.isArray(quotes) || quotes.length === 0) return;

//         const today = new Date();
//         const dayOfYear = Math.floor(
//           (today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
//         );

//         const index = dayOfYear % quotes.length;
//         setDailyQuote(quotes[index]);
//       } catch (err) {
//         console.error("Failed to load quotes", err);
//       }
//     };

//     loadQuote();
//   }, []);

//   /* ---------------- Load Models + Camera ---------------- */
//   useEffect(() => {
//     if (!user) return;

//     const loadModels = async () => {
//       const MODEL_URL = "/models";
//       try {
//         await Promise.all([
//           faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
//           faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
//           faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
//         ]);
//         startVideo();
//       } catch {
//         toast.error("Model loading failed");
//       }
//     };

//     const startVideo = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: { width: 640, height: 480 },
//         });
//         streamRef.current = stream;
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           setIsVideoReady(true);
//         }
//       } catch {
//         toast.error("Unable to access webcam.");
//       }
//     };

//     loadModels();

//     return () => {
//       streamRef.current?.getTracks().forEach((t) => t.stop());
//       if (videoRef.current) videoRef.current.srcObject = null;
//     };
//   }, [user]);

//   const processEmployeeDescriptors = (emp) => {
//     const d128 = [];
//     const d512 = [];
//     emp.descriptors.forEach((d) => {
//       const n = normalizeDescriptor(d);
//       if (!n) return;
//       if (n.length === 128) d128.push(n);
//       if (n.length === 512) d512.push(n);
//     });
//     return { d128, d512 };
//   };

//   /* ---------------- LOAD FACE DATA ---------------- */
//   useEffect(() => {
//     if (!user) return;

//     const loadFaceData = async () => {
//       try {
//         const res = await axios.get(`${BACKEND_URL}/face-punch/face-data`, {
//           headers,
//           withCredentials: true,
//         });

//         const desc128 = [];
//         const desc512 = [];

//         res.data.faces.forEach((emp) => {
//           const { d128, d512 } = processEmployeeDescriptors(emp);
//           if (d128.length)
//             desc128.push(new faceapi.LabeledFaceDescriptors(emp.employee_id, d128));
//           if (d512.length)
//             desc512.push(new faceapi.LabeledFaceDescriptors(emp.employee_id, d512));
//         });

//         setFaceMatcher({
//           matcher128: desc128.length ? new faceapi.FaceMatcher(desc128, 0.45) : null,
//           matcher512: desc512.length ? new faceapi.FaceMatcher(desc512, 0.45) : null,
//         });
//       } catch {
//         toast.error("Failed to load face data");
//       }
//     };

//     loadFaceData();
//   }, [user]);

//   const performDetection = async () => {
//     const detections = await faceapi
//       .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
//       .withFaceLandmarks()
//       .withFaceDescriptors();

//     if (canvasRef.current && videoRef.current) {
//       const canvas = canvasRef.current;
//       const displaySize = {
//         width: videoRef.current.videoWidth,
//         height: videoRef.current.videoHeight,
//       };
//       faceapi.matchDimensions(canvas, displaySize);
//       const resized = faceapi.resizeResults(detections, displaySize);
//       const ctx = canvas.getContext("2d");
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       faceapi.draw.drawDetections(canvas, resized);
//     }

//     return detections;
//   };

//   const validateDetection = (detection) => {
//     const score = detection.detection.score;
//     const box = detection.detection.box;
//     const faceArea = box.width * box.height;
//     const frameArea = videoRef.current.videoWidth * videoRef.current.videoHeight;
//     const faceCoverage = faceArea / frameArea;

//     if (score < 0.85) {
//       toast.warn("Face not clear. Please face the camera properly.", { autoClose: 2000 });
//       return false;
//     }
//     if (faceCoverage < 0.06) {
//       toast.warn("Come closer to the camera.", { autoClose: 2000 });
//       return false;
//     }
//     return true;
//   };

//   const findMatch = (detection) => {
//     let match = null;
//     if (detection.descriptor.length === 128 && faceMatcher?.matcher128) {
//       match = faceMatcher.matcher128.findBestMatch(detection.descriptor);
//     }
//     if (detection.descriptor.length === 512 && faceMatcher?.matcher512) {
//       match = faceMatcher.matcher512.findBestMatch(detection.descriptor);
//     }
//     if (!match || match.label === "unknown") {
//       toast.warn("Face not recognized", { autoClose: 2000 });
//       return null;
//     }
//     return match;
//   };

//   const handlePunch = async (match, detection) => {
//     await punch({
//       descriptor: detection.descriptor,
//       employeeId: match.label,
//     });
//     setLastPunchTime(Date.now());
//     setCooldownRemaining(COOLDOWN_PERIOD / 1000);
//   };

//   /* ---------------- Detection Loop ---------------- */
//   useEffect(() => {
//     if (!isVideoReady) return;

//     const intervalId = setInterval(async () => {
//       const now = Date.now();
//       if (isProcessing) return;

//       if (now - lastPunchTime < COOLDOWN_PERIOD) {
//         setCooldownRemaining(Math.ceil((COOLDOWN_PERIOD - (now - lastPunchTime)) / 1000));
//         return;
//       }

//       if (!videoRef.current || !faceMatcher) return;

//       try {
//         setIsProcessing(true);
//         const detections = await performDetection();

//         if (detections.length === 1) {
//           const detection = detections[0];
//           if (!validateDetection(detection)) return;
//           const match = findMatch(detection);
//           if (!match) return;
//           await handlePunch(match, detection);
//         } else if (detections.length > 1) {
//           toast.warn("Multiple faces detected. Only one person should be visible.", {
//             autoClose: 2000,
//           });
//         }
//       } finally {
//         setIsProcessing(false);
//       }
//     }, 1000);

//     return () => clearInterval(intervalId);
//   }, [isVideoReady, isProcessing, lastPunchTime, faceMatcher]);

//   /* ---------------- Punch API ---------------- */
//   const punch = async ({ descriptor, employeeId }) => {
//     try {
//       const res = await axios.post(
//         `${BACKEND_URL}/face-punch`,
//         {
//           descriptor: Array.from(descriptor),
//           employeeId,
//           device: "Desktop",
//           location: "Office HQ",
//         },
//         { withCredentials: true, headers }
//       );

//       const name = res.data.employee_name || "Employee";
//       const status = res.data.message.toLowerCase().includes("out")
//         ? "punched out"
//         : "punched in";

//       setEmployeeInfo({ id: res.data.employee_id, name });
//       setShowSuccess(true);

//       // Add to recent list
//       setRecentCheckIns((prev) => [
//         {
//           id: res.data.employee_id,
//           name,
//           time: new Date().toLocaleTimeString("en-US", {
//             hour: "2-digit",
//             minute: "2-digit",
//             hour12: true,
//           }),
//           photo: res.data.photo || null,
//         },
//         ...prev.slice(0, 4),
//       ]);

//       setTimeout(() => setShowSuccess(false), 4000);

//       window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${name} ${status}`));
//       toast.success(res.data.message);
//     } catch {
//       toast.error("Punch failed");
//     }
//   };

//   const timeStr = currentTime.toLocaleTimeString("en-US", {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true,
//   });
//   const dateStr = currentTime.toLocaleDateString("en-GB", {
//     weekday: "short",
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });

//   return (
//     <div className="face-punch-ui">
//       {/* LEFT PANEL */}
//       <div className="panel left-panel">
//         <div className="logo-area">
//           <div className="logo-icon">S</div>
//           <div>
//             <div className="logo-text">Sukalpatech</div>
//             <div className="logo-sub">Solutions</div>
//           </div>
//         </div>

//         <div className="time-block">
//           <div className="big-time">{timeStr}</div>
//           <div className="date">{dateStr}</div>
//         </div>

//         <div className="weather">
//           <span className="weather-icon">☀️</span>
//           <div>
//             <div className="temp">24°C</div>
//             <div className="city">Bangalore</div>
//           </div>
//         </div>

//         <div className="slogan">{dailyQuote}</div>
//       </div>

//       {/* CENTER PANEL */}
//       <div className="panel center-panel">
//         <div className="camera-container">
//           <video ref={videoRef} autoPlay muted playsInline />
//           <canvas ref={canvasRef} className="overlay-canvas" />

//           {/* Face guide corners */}
//           <div className="face-guide">
//             <span className="corner tl"></span>
//             <span className="corner tr"></span>
//             <span className="corner bl"></span>
//             <span className="corner br"></span>
//           </div>

//           {/* Success overlay */}
//           {showSuccess && employeeInfo && (
//             <div className="success-overlay">
//               <div className="success-check">✓</div>
//               <div className="success-title">Check-in Successful</div>
//               <div className="success-name">{employeeInfo.name}</div>
//               <div className="success-time">
//                 {timeStr} | {dateStr}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* RIGHT PANEL */}
//       <div className="panel right-panel">
//         <div className="recent-title">Recently Checked In</div>
//         <div className="recent-list">
//           {recentCheckIns.length === 0 ? (
//             <div className="empty-recent">No recent check-ins yet</div>
//           ) : (
//             recentCheckIns.map((item, idx) => (
//               <div key={idx} className="recent-item">
//                 <div className="avatar">
//                   {item.photo ? (
//                     <img src={item.photo} alt={item.name} />
//                   ) : (
//                     <span>{item.name.charAt(0)}</span>
//                   )}
//                 </div>
//                 <div className="info">
//                   <div className="name">{item.name}</div>
//                   <div className="time">{item.time}</div>
//                 </div>
//                 <div className="check">✓</div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* Cooldown message */}
//       {(isProcessing || cooldownRemaining > 0) && (
//         <div className="cooldown-message">
//           {isProcessing ? "Processing punch..." : `Wait ${cooldownRemaining}s`}
//         </div>
//       )}

//       <ToastContainer position="top-center" style={{ marginTop: "20px" }} />
//     </div>
//   );
// };

// export default FacePunch;

"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as faceapi from "face-api.js";
import "./FacePunch.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/AuthProvider.client";

const COOLDOWN_PERIOD = 10000;

const WEATHER_CODE_ICON = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

function getWeatherIcon(code) {
  if (code == null) return "🌡️";
  if (WEATHER_CODE_ICON[code]) return WEATHER_CODE_ICON[code];
  if (code <= 3) return "⛅";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  return "🌡️";
}

const FacePunch = () => {
  const { user } = useAuth();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPunchTime, setLastPunchTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSuccess, setShowSuccess] = useState(false);
  const [dailyQuote, setDailyQuote] = useState("Better People Build a Brighter Future");

  // Weather from common_login location / pincode
  const [weather, setWeather] = useState({
    temp: null,
    icon: "🌡️",
    place: "",
    loading: true,
  });

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  function normalizeDescriptor(desc) {
    if (!desc) return null;
    if (desc instanceof Float32Array) return desc;
    if (typeof desc === "string") return new Float32Array(JSON.parse(desc));
    if (Array.isArray(desc)) return new Float32Array(desc);
    if (typeof desc === "object") return new Float32Array(Object.values(desc));
    return null;
  }

  const dashboardData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("dashboardData") || "{}")
      : {};

  const headers = useMemo(
    () => ({
      "x-api-key": API_KEY ?? "",
      "x-employee-id": dashboardData.employeeId || user?.employeeId || "",
      "x-org-id": dashboardData.orgId || user?.orgId || "",
    }),
    [API_KEY, dashboardData, user]
  );

  // ---- Resolve location from common login user ----
  const loginLocation = useMemo(() => {
    const loc =
      user?.location ||
      user?.raw?.location ||
      dashboardData.location ||
      "";
    const pin =
      user?.pincode ||
      user?.raw?.pincode ||
      dashboardData.pincode ||
      "";
    return {
      location: String(loc || "").trim(),
      pincode: String(pin || "").trim(),
      isCommonLogin: !!(user?.isCommonLogin || user?.raw?.isCommonLogin),
    };
  }, [user, dashboardData]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load daily quote
  useEffect(() => {
    const loadQuote = async () => {
      try {
        const res = await fetch("/quotes.json");
        const quotes = await res.json();
        if (!Array.isArray(quotes) || quotes.length === 0) return;
        const today = new Date();
        const dayOfYear = Math.floor(
          (today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
        );
        setDailyQuote(quotes[dayOfYear % quotes.length]);
      } catch (err) {
        console.error("Failed to load quotes", err);
      }
    };
    loadQuote();
  }, []);

  // ---- Fetch weather from location / pincode ----
  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      const { location, pincode } = loginLocation;
      const searchName = location || (pincode ? `${pincode}, India` : "");

      if (!searchName) {
        if (!cancelled) {
          setWeather({
            temp: null,
            icon: "🌡️",
            place: "—",
            loading: false,
          });
        }
        return;
      }

      try {
        // 1) Geocode place name / pincode → lat, lon
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchName
        )}&count=1&language=en&format=json`;

        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json().catch(() => null);
        const place = geoData?.results?.[0];

        if (!place?.latitude || !place?.longitude) {
          // Fallback: try pincode alone if location failed
          if (pincode && location) {
            const pinUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
              `${pincode}, India`
            )}&count=1&language=en&format=json`;
            const pinRes = await fetch(pinUrl);
            const pinData = await pinRes.json().catch(() => null);
            const pinPlace = pinData?.results?.[0];

            if (pinPlace?.latitude && pinPlace?.longitude) {
              return fetchForecast(pinPlace, cancelled);
            }
          }

          if (!cancelled) {
            setWeather({
              temp: null,
              icon: "🌡️",
              place: location || pincode || "—",
              loading: false,
            });
          }
          return;
        }

        await fetchForecast(place, cancelled);
      } catch (err) {
        console.error("Weather load failed:", err);
        if (!cancelled) {
          setWeather({
            temp: null,
            icon: "🌡️",
            place: loginLocation.location || loginLocation.pincode || "—",
            loading: false,
          });
        }
      }
    }

    async function fetchForecast(place, cancelledFlag) {
      const forecastUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}` +
        `&longitude=${place.longitude}` +
        `&current=temperature_2m,weather_code` +
        `&timezone=auto`;

      const weatherRes = await fetch(forecastUrl);
      const weatherData = await weatherRes.json().catch(() => null);
      const current = weatherData?.current;

      if (cancelledFlag) return;

      const placeLabel =
        [place.name, place.admin1, place.country]
          .filter(Boolean)
          .join(", ") || loginLocation.location || "—";

      setWeather({
        temp:
          current?.temperature_2m != null
            ? Math.round(current.temperature_2m)
            : null,
        icon: getWeatherIcon(current?.weather_code),
        place: placeLabel,
        loading: false,
      });
    }

    loadWeather();
    return () => {
      cancelled = true;
    };
  }, [loginLocation.location, loginLocation.pincode]);

  /* ---------------- Load Models + Camera ---------------- */
  useEffect(() => {
    if (!user) return;

    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        startVideo();
      } catch {
        toast.error("Model loading failed");
      }
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsVideoReady(true);
        }
      } catch {
        toast.error("Unable to access webcam.");
      }
    };

    loadModels();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [user]);

  const processEmployeeDescriptors = (emp) => {
    const d128 = [];
    const d512 = [];
    emp.descriptors.forEach((d) => {
      const n = normalizeDescriptor(d);
      if (!n) return;
      if (n.length === 128) d128.push(n);
      if (n.length === 512) d512.push(n);
    });
    return { d128, d512 };
  };

  /* ---------------- LOAD FACE DATA ---------------- */
  useEffect(() => {
    if (!user) return;

    const loadFaceData = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/face-punch/face-data`, {
          headers,
          withCredentials: true,
        });

        const desc128 = [];
        const desc512 = [];

        res.data.faces.forEach((emp) => {
          const { d128, d512 } = processEmployeeDescriptors(emp);
          if (d128.length)
            desc128.push(new faceapi.LabeledFaceDescriptors(emp.employee_id, d128));
          if (d512.length)
            desc512.push(new faceapi.LabeledFaceDescriptors(emp.employee_id, d512));
        });

        setFaceMatcher({
          matcher128: desc128.length ? new faceapi.FaceMatcher(desc128, 0.45) : null,
          matcher512: desc512.length ? new faceapi.FaceMatcher(desc512, 0.45) : null,
        });
      } catch {
        toast.error("Failed to load face data");
      }
    };

    loadFaceData();
  }, [user]);

  const performDetection = async () => {
    const detections = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);
      const resized = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resized);
    }

    return detections;
  };

  const validateDetection = (detection) => {
    const score = detection.detection.score;
    const box = detection.detection.box;
    const faceArea = box.width * box.height;
    const frameArea = videoRef.current.videoWidth * videoRef.current.videoHeight;
    const faceCoverage = faceArea / frameArea;

    if (score < 0.85) {
      toast.warn("Face not clear. Please face the camera properly.", { autoClose: 2000 });
      return false;
    }
    if (faceCoverage < 0.06) {
      toast.warn("Come closer to the camera.", { autoClose: 2000 });
      return false;
    }
    return true;
  };

  const findMatch = (detection) => {
    let match = null;
    if (detection.descriptor.length === 128 && faceMatcher?.matcher128) {
      match = faceMatcher.matcher128.findBestMatch(detection.descriptor);
    }
    if (detection.descriptor.length === 512 && faceMatcher?.matcher512) {
      match = faceMatcher.matcher512.findBestMatch(detection.descriptor);
    }
    if (!match || match.label === "unknown") {
      toast.warn("Face not recognized", { autoClose: 2000 });
      return null;
    }
    return match;
  };

  const handlePunch = async (match, detection) => {
    await punch({
      descriptor: detection.descriptor,
      employeeId: match.label,
    });
    setLastPunchTime(Date.now());
    setCooldownRemaining(COOLDOWN_PERIOD / 1000);
  };

  /* ---------------- Detection Loop ---------------- */
  useEffect(() => {
    if (!isVideoReady) return;

    const intervalId = setInterval(async () => {
      const now = Date.now();
      if (isProcessing) return;

      if (now - lastPunchTime < COOLDOWN_PERIOD) {
        setCooldownRemaining(Math.ceil((COOLDOWN_PERIOD - (now - lastPunchTime)) / 1000));
        return;
      }

      if (!videoRef.current || !faceMatcher) return;

      try {
        setIsProcessing(true);
        const detections = await performDetection();

        if (detections.length === 1) {
          const detection = detections[0];
          if (!validateDetection(detection)) return;
          const match = findMatch(detection);
          if (!match) return;
          await handlePunch(match, detection);
        } else if (detections.length > 1) {
          toast.warn("Multiple faces detected. Only one person should be visible.", {
            autoClose: 2000,
          });
        }
      } finally {
        setIsProcessing(false);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isVideoReady, isProcessing, lastPunchTime, faceMatcher]);

  /* ---------------- Punch API ---------------- */
  const punch = async ({ descriptor, employeeId }) => {
    try {
      // Prefer common-login location if available
      const punchLocation =
        loginLocation.location ||
        loginLocation.pincode ||
        "Office HQ";

      const res = await axios.post(
        `${BACKEND_URL}/face-punch`,
        {
          descriptor: Array.from(descriptor),
          employeeId,
          device: "Desktop",
          location: punchLocation,
        },
        { withCredentials: true, headers }
      );

      const name = res.data.employee_name || "Employee";
      const status = res.data.message.toLowerCase().includes("out")
        ? "punched out"
        : "punched in";

      setEmployeeInfo({ id: res.data.employee_id, name });
      setShowSuccess(true);

      setRecentCheckIns((prev) => [
        {
          id: res.data.employee_id,
          name,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          photo: res.data.photo || null,
        },
        ...prev.slice(0, 4),
      ]);

      setTimeout(() => setShowSuccess(false), 4000);

      window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${name} ${status}`));
      toast.success(res.data.message);
    } catch {
      toast.error("Punch failed");
    }
  };

  const timeStr = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const dateStr = currentTime.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const weatherPlace =
    weather.place ||
    loginLocation.location ||
    loginLocation.pincode ||
    "—";

  return (
    <div className="face-punch-ui">
      {/* LEFT PANEL */}
      <div className="panel left-panel">
        <div className="logo-area">
          <img
            className="brand-logo"
            src="/images/sukalpa_logo.png"
            alt="Sukalpatech Solutions"
          />
        </div>

        <div className="time-block">
          <div className="big-time">{timeStr}</div>
          <div className="date">{dateStr}</div>
        </div>

        <div className="weather">
          <span className="weather-icon">{weather.icon}</span>
          <div>
            <div className="temp">
              {weather.loading
                ? "..."
                : weather.temp != null
                  ? `${weather.temp}°C`
                  : "--°C"}
            </div>
            <div className="city" title={weatherPlace}>
              {weatherPlace}
            </div>
          </div>
        </div>

        <div className="slogan">{dailyQuote}</div>
      </div>

      {/* CENTER PANEL */}
      <div className="panel center-panel">
        <div className="camera-container">
          <video ref={videoRef} autoPlay muted playsInline />
          <canvas ref={canvasRef} className="overlay-canvas" />

          <div className="face-guide">
            <span className="corner tl"></span>
            <span className="corner tr"></span>
            <span className="corner bl"></span>
            <span className="corner br"></span>
          </div>

          {showSuccess && employeeInfo && (
            <div className="success-overlay">
              <div className="success-check">✓</div>
              <div className="success-title">Check-in Successful</div>
              <div className="success-name">{employeeInfo.name}</div>
              <div className="success-time">
                {timeStr} | {dateStr}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="panel right-panel">
        <div className="recent-title">Recently Checked In</div>
        <div className="recent-list">
          {recentCheckIns.length === 0 ? (
            <div className="empty-recent">No recent check-ins yet</div>
          ) : (
            recentCheckIns.map((item, idx) => (
              <div key={idx} className="recent-item">
                <div className="avatar">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} />
                  ) : (
                    <span>{item.name.charAt(0)}</span>
                  )}
                </div>
                <div className="info">
                  <div className="name">{item.name}</div>
                  <div className="time">{item.time}</div>
                </div>
                <div className="check">✓</div>
              </div>
            ))
          )}
        </div>
      </div>

      {(isProcessing || cooldownRemaining > 0) && (
        <div className="cooldown-message">
          {isProcessing ? "Processing punch..." : `Wait ${cooldownRemaining}s`}
        </div>
      )}

      <ToastContainer position="top-center" style={{ marginTop: "20px" }} />
    </div>
  );
};

export default FacePunch;