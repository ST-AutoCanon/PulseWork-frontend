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

//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
// const [faceMatcher, setFaceMatcher] = useState(null);

//   const headers = useMemo(() => ({
//     "x-api-key": API_KEY ?? "",
//     ...(user?.employeeId ? { "x-employee-id": user.employeeId } : {}),
//     ...(user?.orgId ? { "x-org-id": user.orgId } : {}),
//   }), [API_KEY, user?.employeeId, user?.orgId]);

//   /* ---------------- Load Models + Camera ---------------- */
//   useEffect(() => {
//     if (!user) return;

//    const loadModels = async () => {
//   const MODEL_URL = "/models";  // ← Absolute path from public/ – this is standard & works

//   try {
//     console.log(`[face-api] Loading from: ${MODEL_URL}`);

//     // Load in parallel for faster startup
//     await Promise.all([
//       faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
//       faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
//       faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
//     ]);

//     console.log("[face-api] ALL MODELS LOADED SUCCESSFULLY! ✓✓✓");
//     toast.success("Face models ready! Trying detection...");
//     startVideo();
//   } catch (error) {
//     console.error("[face-api] MODEL LOADING FAILED HARD:", error);
//     toast.error("Cannot load face models – check console + Network tab for 404s");
//   }
// };
    
//     console.log("Models loaded successfully!");

//     const startVideo = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         streamRef.current = stream;
//         if (videoRef.current) videoRef.current.srcObject = stream;
//         setIsVideoReady(true);
//       } catch {
//         toast.error("Unable to access webcam.", { autoClose: 2000 });
//       }
//     };

//     loadModels();

//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(t => t.stop());
//         streamRef.current = null;
//       }
//       if (videoRef.current) videoRef.current.srcObject = null;
//     };
//   }, [user]);

//   /* ---------------- Detection Loop ---------------- */
//   useEffect(() => {
//     if (!isVideoReady) return;

//     const intervalId = setInterval(async () => {
//       const now = Date.now();

//       if (isProcessing) return;

//       if (now - lastPunchTime < COOLDOWN_PERIOD) {
//         setCooldownRemaining(
//           Math.ceil((COOLDOWN_PERIOD - (now - lastPunchTime)) / 1000)
//         );
//         return;
//       }

//       if (!videoRef.current) return;

//       try {
//         setIsProcessing(true);

//         const detections = await faceapi
//           .detectAllFaces(
//             videoRef.current,
//             new faceapi.TinyFaceDetectorOptions()
//           )
//           .withFaceLandmarks()
//           .withFaceDescriptors();

//         if (canvasRef.current) {
//           const canvas = canvasRef.current;
//           const displaySize = {
//             width: videoRef.current.videoWidth,
//             height: videoRef.current.videoHeight,
//           };
//           faceapi.matchDimensions(canvas, displaySize);
//           const resized = faceapi.resizeResults(detections, displaySize);
//           canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
//           faceapi.draw.drawDetections(canvas, resized);
//         }

//         if (detections.length === 1) {
//           const d = detections[0];
//           const box = d.detection.box;
//           const area = box.width * box.height;
//           const frameArea =
//             videoRef.current.videoWidth * videoRef.current.videoHeight;

//           if (d.detection.score < 0.85) {
//             toast.warn("Face not clear.", { autoClose: 1500 });
//             return;
//           }

//           if (area / frameArea < 0.06) {
//             toast.warn("Come closer to the camera.", { autoClose: 1500 });
//             return;
//           }

//           await punch(d);
//           setLastPunchTime(Date.now());
//           setCooldownRemaining(COOLDOWN_PERIOD / 1000);
//         }
//       } catch (err) {
//         console.error("Detection error:", err);
//       } finally {
//         setIsProcessing(false);
//       }
//     }, 1000);

//     return () => clearInterval(intervalId);
//   }, [isVideoReady, isProcessing, lastPunchTime]);

//   /* ---------------- Punch API ---------------- */
//   const punch = async (detection) => {
//     try {
//       const descriptor = Array.from(detection.descriptor);

//       const res = await axios.post(
//         `${BACKEND_URL}/face-punch`,
//         {
//           descriptor,
//           device: "Desktop",
//           location: "Office HQ",
//         },
//         { withCredentials: true, headers }
//       );

//       const name = res.data.employee_name || "Employee";
//       const status = res.data.message.toLowerCase().includes("out")
//         ? "punched out"
//         : "punched in";

//       setEmployeeInfo({
//         id: res.data.employee_id,
//         name,
//       });

//       const utter = new SpeechSynthesisUtterance(`${name} ${status}`);
//       window.speechSynthesis.speak(utter);

//       toast.success(`${res.data.message} (${res.data.employee_id})`, {
//         autoClose: 2000,
//       });
//     } catch (err) {
//       if (err?.response?.data?.message === "Face not recognized") {
//         toast.warn("Face not recognized.", { autoClose: 2000 });
//       } else {
//         toast.error("Punch failed.", { autoClose: 2000 });
//       }
//     }
//   };

//   /* ---------------- UI ---------------- */
//   return (
//     <>
//       <div className="face-punch-container">
//         <video ref={videoRef} autoPlay muted width="720" height="560" />
//         <canvas ref={canvasRef} className="overlay-canvas" />
//       </div>

//       <div className="employee-info-message">
//         {employeeInfo
//           ? `Detected: ${employeeInfo.name} (${employeeInfo.id})`
//           : "No employee detected yet."}
//       </div>

//       {(isProcessing || cooldownRemaining > 0) && (
//         <div className="cooldown-message">
//           {isProcessing
//             ? "Processing punch..."
//             : `Wait ${cooldownRemaining}s`}
//         </div>
//       )}

//       <ToastContainer position="top-center" style={{ marginTop: "40px" }} />
//     </>
//   );
// };

// export default FacePunch;

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

//   // 🔹 ADDED
//   const [faceMatcher, setFaceMatcher] = useState(null);

//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
// // Near the top of FacePunch
// const dashboardData = typeof window !== "undefined"
//   ? JSON.parse(localStorage.getItem("dashboardData") || "{}")
//   : {};

// // Then update headers
// const headers = useMemo(
//   () => ({
//     "x-api-key": API_KEY ?? "",
//     "x-employee-id": dashboardData.employeeId || user?.employeeId || "",
//     "x-org-id": dashboardData.orgId || user?.orgId || "",  // ← fallback to localStorage
//   }),
//   [API_KEY, dashboardData, user]
// );
//   // const headers = useMemo(
//   //   () => ({
//   //     "x-api-key": API_KEY ?? "",
//   //     ...(user?.employeeId ? { "x-employee-id": user.employeeId } : {}),
//   //     ...(user?.orgId ? { "x-org-id": user.orgId } : {}),
      
//   //   }),
//   //   [API_KEY, user?.employeeId, user?.orgId]
//   // );

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

//         toast.success("Face models ready!");
//         startVideo();
//       } catch (error) {
//         console.error(error);
//         toast.error("Model loading failed");
//       }
//     };

//     const startVideo = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         streamRef.current = stream;
//         if (videoRef.current) videoRef.current.srcObject = stream;
//         setIsVideoReady(true);
//       } catch {
//         toast.error("Unable to access webcam.");
//       }
//     };

//     loadModels();

//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(t => t.stop());
//         streamRef.current = null;
//       }
//       if (videoRef.current) videoRef.current.srcObject = null;
//     };
//   }, [user]);

//   /* ---------------- LOAD ADMIN FACE DATA (ADDED) ---------------- */
//   useEffect(() => {
//     if (!user) return;

//     const loadFaceData = async () => {
//       try {
//         const res = await axios.get(
//           `${BACKEND_URL}/face-punch/face-data`,
//           { headers, withCredentials: true }
//         );

//         const labeledDescriptors = res.data.data.map(emp => {
//           const descriptors = emp.descriptors.map(
//             d => new Float32Array(d)
//           );

//           return new faceapi.LabeledFaceDescriptors(
//             emp.employee_id,
//             descriptors
//           );
//         });

//         setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.45));
//         console.log("Face matcher ready:", labeledDescriptors.length);
//       } catch (err) {
//         console.error(err);
//         toast.error("Failed to load face data");
//       }
//     };

//     loadFaceData();
//   }, [user]);

//   /* ---------------- Detection Loop ---------------- */
//   useEffect(() => {
//     if (!isVideoReady) return;

//     const intervalId = setInterval(async () => {
//       const now = Date.now();
//       if (isProcessing) return;

//       if (now - lastPunchTime < COOLDOWN_PERIOD) {
//         setCooldownRemaining(
//           Math.ceil((COOLDOWN_PERIOD - (now - lastPunchTime)) / 1000)
//         );
//         return;
//       }

//       if (!videoRef.current || !faceMatcher) return;

//       try {
//         setIsProcessing(true);

//         const detections = await faceapi
//           .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
//           .withFaceLandmarks()
//           .withFaceDescriptors();

//         if (canvasRef.current) {
//           const canvas = canvasRef.current;
//           const displaySize = {
//             width: videoRef.current.videoWidth,
//             height: videoRef.current.videoHeight,
//           };
//           faceapi.matchDimensions(canvas, displaySize);
//           const resized = faceapi.resizeResults(detections, displaySize);
//           canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
//           faceapi.draw.drawDetections(canvas, resized);
//         }

//         if (detections.length === 1) {
//           const match = faceMatcher.findBestMatch(detections[0].descriptor);

//           if (match.label === "unknown") {
//             toast.warn("Face not recognized");
//             return;
//           }

//           await punch({
//             descriptor: detections[0].descriptor,
//             employeeId: match.label,
//           });

//           setLastPunchTime(Date.now());
//           setCooldownRemaining(COOLDOWN_PERIOD / 1000);
//         }
//       } catch (err) {
//         console.error(err);
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

//       setEmployeeInfo({
//         id: res.data.employee_id,
//         name,
//       });

//       window.speechSynthesis.speak(
//         new SpeechSynthesisUtterance(`${name} ${status}`)
//       );

//       toast.success(`${res.data.message}`);
//     } catch (err) {
//       toast.error("Punch failed");
//     }
//   };

//   /* ---------------- UI ---------------- */
//   return (
//     <>
//       <div className="face-punch-container">
//         <video ref={videoRef} autoPlay muted width="720" height="560" />
//         <canvas ref={canvasRef} className="overlay-canvas" />
//       </div>

//       <div className="employee-info-message">
//         {employeeInfo
//           ? `Detected: ${employeeInfo.name} (${employeeInfo.id})`
//           : "No employee detected yet."}
//       </div>

//       {(isProcessing || cooldownRemaining > 0) && (
//         <div className="cooldown-message">
//           {isProcessing
//             ? "Processing punch..."
//             : `Wait ${cooldownRemaining}s`}
//         </div>
//       )}

//       <ToastContainer position="top-center" style={{ marginTop: "40px" }} />
//     </>
//   );
// };

// export default FacePunch;

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

//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

//         toast.success("Face models ready!");
//         startVideo();
//       } catch (error) {
//         console.error(error);
//         toast.error("Model loading failed");
//       }
//     };

//     const startVideo = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         streamRef.current = stream;
//         if (videoRef.current) videoRef.current.srcObject = stream;
//         setIsVideoReady(true);
//       } catch {
//         toast.error("Unable to access webcam.");
//       }
//     };

//     loadModels();

//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach((t) => t.stop());
//         streamRef.current = null;
//       }
//       if (videoRef.current) videoRef.current.srcObject = null;
//     };
//   }, [user]);

//   /* ---------------- LOAD ADMIN FACE DATA ---------------- */
//   useEffect(() => {
//     if (!user) return;

//     const loadFaceData = async () => {
//       try {
//         const res = await axios.get(
//           `${BACKEND_URL}/face-punch/face-data`,
//           { headers, withCredentials: true }
//         );

//         // ✅ FIX: backend returns `faces`, not `data`
//         const labeledDescriptors = res.data.faces.map((emp) => {
//           const descriptors = emp.descriptors.map(
//             (d) => new Float32Array(d)
//           );

//           return new faceapi.LabeledFaceDescriptors(
//             emp.employee_id,
//             descriptors
//           );
//         });

//         setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.45));
//         console.log("Face matcher ready:", labeledDescriptors.length);
//       } catch (err) {
//         console.error(err);
//         toast.error("Failed to load face data");
//       }
//     };

//     loadFaceData();
//   }, [user]);

//   /* ---------------- Detection Loop ---------------- */
//   useEffect(() => {
//     if (!isVideoReady) return;

//     const intervalId = setInterval(async () => {
//       const now = Date.now();
//       if (isProcessing) return;

//       if (now - lastPunchTime < COOLDOWN_PERIOD) {
//         setCooldownRemaining(
//           Math.ceil((COOLDOWN_PERIOD - (now - lastPunchTime)) / 1000)
//         );
//         return;
//       }

//       if (!videoRef.current || !faceMatcher) return;

//       try {
//         setIsProcessing(true);

//         const detections = await faceapi
//           .detectAllFaces(
//             videoRef.current,
//             new faceapi.TinyFaceDetectorOptions()
//           )
//           .withFaceLandmarks()
//           .withFaceDescriptors();

//         if (canvasRef.current) {
//           const canvas = canvasRef.current;
//           const displaySize = {
//             width: videoRef.current.videoWidth,
//             height: videoRef.current.videoHeight,
//           };
//           faceapi.matchDimensions(canvas, displaySize);
//           const resized = faceapi.resizeResults(detections, displaySize);
//           canvas
//             .getContext("2d")
//             .clearRect(0, 0, canvas.width, canvas.height);
//           faceapi.draw.drawDetections(canvas, resized);
//         }

//         if (detections.length === 1) {
//           const match = faceMatcher.findBestMatch(
//             detections[0].descriptor
//           );

//           if (match.label === "unknown") {
//             toast.warn("Face not recognized");
//             return;
//           }

//           await punch({
//             descriptor: detections[0].descriptor,
//             employeeId: match.label,
//           });

//           setLastPunchTime(Date.now());
//           setCooldownRemaining(COOLDOWN_PERIOD / 1000);
//         }
//       } catch (err) {
//         console.error(err);
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

//       setEmployeeInfo({
//         id: res.data.employee_id,
//         name,
//       });

//       window.speechSynthesis.speak(
//         new SpeechSynthesisUtterance(`${name} ${status}`)
//       );

//       toast.success(`${res.data.message}`);
//     } catch (err) {
//       toast.error("Punch failed");
//     }
//   };

//   /* ---------------- UI ---------------- */
//   return (
//     <>
//       <div className="face-punch-container">
//         <video ref={videoRef} autoPlay muted width="720" height="560" />
//         <canvas ref={canvasRef} className="overlay-canvas" />
//       </div>

//       <div className="employee-info-message">
//         {employeeInfo
//           ? `Detected: ${employeeInfo.name} (${employeeInfo.id})`
//           : "No employee detected yet."}
//       </div>

//       {(isProcessing || cooldownRemaining > 0) && (
//         <div className="cooldown-message">
//           {isProcessing
//             ? "Processing punch..."
//             : `Wait ${cooldownRemaining}s`}
//         </div>
//       )}

//       <ToastContainer position="top-center" style={{ marginTop: "40px" }} />
//     </>
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

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setIsVideoReady(true);
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

  /* ---------------- LOAD ADMIN FACE DATA ---------------- */
  useEffect(() => {
    if (!user) return;

    const loadFaceData = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/face-punch/face-data`,
          { headers, withCredentials: true }
        );

        const labeledDescriptors = res.data.faces.map((emp) => {
          const descriptors = emp.descriptors.map(
            (d) => new Float32Array(d)
          );
          return new faceapi.LabeledFaceDescriptors(
            emp.employee_id,
            descriptors
          );
        });

        setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.45));
      } catch {
        toast.error("Failed to load face data");
      }
    };

    loadFaceData();
  }, [user]);

  /* ---------------- Detection Loop ---------------- */
  useEffect(() => {
    if (!isVideoReady) return;

    const intervalId = setInterval(async () => {
      const now = Date.now();
      if (isProcessing) return;

      if (now - lastPunchTime < COOLDOWN_PERIOD) {
        setCooldownRemaining(
          Math.ceil((COOLDOWN_PERIOD - (now - lastPunchTime)) / 1000)
        );
        return;
      }

      if (!videoRef.current || !faceMatcher) return;

      try {
        setIsProcessing(true);

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const displaySize = {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          };
          faceapi.matchDimensions(canvas, displaySize);
          const resized = faceapi.resizeResults(detections, displaySize);
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resized);
        }

        /* 🔒 VALIDATIONS (FROM CRA) */
        if (detections.length === 1) {
          const detection = detections[0];
          const score = detection.detection.score;
          const box = detection.detection.box;

          const faceArea = box.width * box.height;
          const frameArea =
            videoRef.current.videoWidth * videoRef.current.videoHeight;
          const faceCoverage = faceArea / frameArea;

          if (score < 0.85) {
            toast.warn("Face not clear. Please face the camera properly.", {
              autoClose: 2000,
            });
            return;
          }

          if (faceCoverage < 0.06) {
            toast.warn("Come closer to the camera.", { autoClose: 2000 });
            return;
          }

          const match = faceMatcher.findBestMatch(detection.descriptor);

          if (match.label === "unknown") {
            toast.warn("Face not recognized", { autoClose: 2000 });
            return;
          }

          await punch({
            descriptor: detection.descriptor,
            employeeId: match.label,
          });

          setLastPunchTime(Date.now());
          setCooldownRemaining(COOLDOWN_PERIOD / 1000);
        } else if (detections.length > 1) {
          toast.warn(
            "Multiple faces detected. Only one person should be visible.",
            { autoClose: 2000 }
          );
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
      const res = await axios.post(
        `${BACKEND_URL}/face-punch`,
        {
          descriptor: Array.from(descriptor),
          employeeId,
          device: "Desktop",
          location: "Office HQ",
        },
        { withCredentials: true, headers }
      );

      const name = res.data.employee_name || "Employee";
      const status = res.data.message.toLowerCase().includes("out")
        ? "punched out"
        : "punched in";

      setEmployeeInfo({ id: res.data.employee_id, name });

      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance(`${name} ${status}`)
      );

      toast.success(res.data.message);
    } catch {
      toast.error("Punch failed");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <>
      <div className="face-punch-container">
        <video ref={videoRef} autoPlay muted width="720" height="560" />
        <canvas ref={canvasRef} className="overlay-canvas" />
      </div>

      <div className="employee-info-message">
        {employeeInfo
          ? `Detected: ${employeeInfo.name} (${employeeInfo.id})`
          : "No employee detected yet."}
      </div>

      {(isProcessing || cooldownRemaining > 0) && (
        <div className="cooldown-message">
          {isProcessing
            ? "Processing punch..."
            : `Wait ${cooldownRemaining}s`}
        </div>
      )}

      <ToastContainer position="top-center" style={{ marginTop: "40px" }} />
    </>
  );
};

export default FacePunch;
