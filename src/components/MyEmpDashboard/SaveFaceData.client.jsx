// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import * as faceapi from "face-api.js";
// import Modal from "../Modal/Modal.client";
// import { useAuth } from "../../context/AuthProvider.client";
// import "./SaveFaceData.css";

// export default function SaveFaceData({ onClose }) {
//   const { user, hydrated } = useAuth();
//   const employeeIdFromAuth =
//     user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
//   const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const intervalRef = useRef(null);
//   const mountedRef = useRef(true);

//   const [userName, setUserName] = useState(employeeIdFromAuth || "");
//   const [isCapturing, setIsCapturing] = useState(false);
//   const [modelsLoaded, setModelsLoaded] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   const [instruction, setInstruction] = useState("");
//   const [samplesCount, setSamplesCount] = useState(0);

//   const [alertModal, setAlertModal] = useState({
//     isVisible: false,
//     title: "",
//     message: "",
//   });

//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

//   useEffect(() => {
//     mountedRef.current = true;
//     setUserName(employeeIdFromAuth || "");
//     setIsMobile(typeof window !== "undefined" && window.innerWidth <= 768);

//     const handleResize = () => {
//       setIsMobile(window.innerWidth <= 768);
//     };
//     if (typeof window !== "undefined") {
//       window.addEventListener("resize", handleResize);
//     }

//     return () => {
//       mountedRef.current = false;
//       if (typeof window !== "undefined") {
//         window.removeEventListener("resize", handleResize);
//       }
//       stopCamera();
//       clearInterval(intervalRef.current);
//     };
//   }, [employeeIdFromAuth]);

//   useEffect(() => {
//     if (hydrated && !user) {
//       showAlert(
//         "User information not found. Please login or ensure your session is active."
//       );
//     }
//   }, [hydrated, user]);

//   const showAlert = (message, title = "") =>
//     setAlertModal({ isVisible: true, title, message });
//   const closeAlert = () =>
//     setAlertModal({ isVisible: false, title: "", message: "" });

//   const interpretFaceCheck = (respData) => {
//     if (!respData) return { exists: false, count: null, raw: respData };

//     const exists =
//       Boolean(respData.exists) ||
//       Boolean(respData.isRegistered) ||
//       Boolean(respData.registered) ||
//       (typeof respData.count === "number" && respData.count > 0) ||
//       Boolean(respData.data?.exists) ||
//       Boolean(respData.data?.isRegistered) ||
//       (typeof respData.data?.count === "number" && respData.data.count > 0) ||
//       false;

//     let count = null;
//     if (typeof respData.count === "number") count = respData.count;
//     else if (typeof respData.data?.count === "number")
//       count = respData.data.count;
//     else if (Array.isArray(respData.data)) count = respData.data.length;
//     else if (Array.isArray(respData)) count = respData.length;

//     return { exists, count, raw: respData };
//   };

//   async function checkExistingFace(employeeId) {
//     if (!BACKEND_URL) {
//       console.warn("Missing backend while checking existing face");
//       return null;
//     }
//     try {
//       const headers = {
//         "x-api-key": API_KEY,
//         "x-employee-id": employeeIdFromAuth || "",
//         "x-org-id": orgId || "",
//       };
//       const resp = await fetch(
//         `${BACKEND_URL.replace(/\/$/, "")}/api/face/check/${encodeURIComponent(
//           employeeId
//         )}`,
//         { credentials: "include", headers }
//       );

//       const parsed = await resp.json().catch(() => null);
//       if (!resp.ok && !parsed) {
//         console.warn("face check returned non-OK without body:", resp.status);
//         return null;
//       }
//       return interpretFaceCheck(parsed);
//     } catch (err) {
//       console.error("checkExistingFace error:", err);
//       return null;
//     }
//   }

//   useEffect(() => {
//     let canceled = false;
//     const loadModels = async () => {
//       try {
//         const MODEL_URL = "/models";
//         await Promise.all([
//           faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
//           faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
//           faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
//         ]);
//         if (!canceled && mountedRef.current) setModelsLoaded(true);
//       } catch (err) {
//         console.error("Error loading face-api models:", err);
//         showAlert("Error initializing face recognition models.");
//       }
//     };

//     loadModels();

//     (async () => {
//       if (!userName) return;
//       const check = await checkExistingFace(userName);
//       if (check === null) {
//         showAlert("Failed to check existing face data. Please try again.");
//         return;
//       }
//       if (check.exists) {
//         showAlert("Face data already exists for this Employee ID.");
//         setTimeout(() => {
//           closeAlert();
//           onClose?.();
//         }, 1000);
//         return;
//       }
//       if (typeof check.count === "number" && check.count > 1) {
//         showAlert(
//           `Multiple entries (${check.count}) found for Employee ID ${userName}. Cannot capture face data.`
//         );
//         return;
//       }
//     })();

//     return () => {
//       canceled = true;
//     };
//   }, [userName]);

//   const checkCameraAvailability = async () => {
//     try {
//       if (!navigator?.mediaDevices?.enumerateDevices) return false;
//       const devices = await navigator.mediaDevices.enumerateDevices();
//       return devices.some((d) => d.kind === "videoinput");
//     } catch (err) {
//       console.error("checkCameraAvailability error:", err);
//       return false;
//     }
//   };

//   const startCamera = async () => {
//     if (!videoRef.current) return;
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: "user" },
//       });
//       videoRef.current.srcObject = stream;
//       await videoRef.current.play();
//       return stream;
//     } catch (err) {
//       console.error("startCamera error:", err);
//       throw err;
//     }
//   };

//   const stopCamera = () => {
//     const video = videoRef.current;
//     if (!video) return;
//     const stream = video.srcObject;
//     if (stream) {
//       stream.getTracks().forEach((t) => {
//         try {
//           t.stop();
//         } catch (e) {}
//       });
//     }
//     if (video) video.srcObject = null;
//     if (canvasRef.current && canvasRef.current.parentNode) {
//       try {
//         canvasRef.current.parentNode.removeChild(canvasRef.current);
//       } catch (e) {}
//       canvasRef.current = null;
//     }
//     setInstruction("");
//     setSamplesCount(0);
//   };

//   const captureFaceData = async () => {
//     if (!modelsLoaded) {
//       showAlert("Face models are still loading. Please wait a moment.");
//       return;
//     }

//     if (!userName || !userName.trim()) {
//       showAlert("Employee ID not available.");
//       return;
//     }

//     const hasCamera = await checkCameraAvailability();
//     if (!hasCamera) {
//       showAlert("No camera found on this device. Cannot capture face data.");
//       return;
//     }

//     const check = await checkExistingFace(userName);
//     if (check === null) {
//       showAlert("Failed to check existing face data. Please try again.");
//       return;
//     }
//     if (check.exists) {
//       showAlert("Face data already exists for this Employee ID.");
//       setTimeout(() => {
//         closeAlert();
//         onClose?.();
//       }, 900);
//       return;
//     }
//     if (typeof check.count === "number" && check.count > 1) {
//       showAlert(
//         "Multiple face entries found for this Employee ID. Cannot capture."
//       );
//       return;
//     }

//     setIsCapturing(true);
//     setInstruction("🔄 Preparing camera...");
//     setSamplesCount(0);

//     try {
//       await startCamera();

//       if (!canvasRef.current && videoRef.current) {
//         const canvas = faceapi.createCanvasFromMedia(videoRef.current);
//         canvasRef.current = canvas;
//         const container = videoRef.current.parentElement || document.body;
//         canvas.style.position = "absolute";
//         canvas.style.top = videoRef.current.offsetTop + "px";
//         canvas.style.left = videoRef.current.offsetLeft + "px";
//         container.appendChild(canvas);
//       }

//       const displaySize = {
//         width:
//           videoRef.current.videoWidth || videoRef.current.clientWidth || 640,
//         height:
//           videoRef.current.videoHeight || videoRef.current.clientHeight || 480,
//       };
//       faceapi.matchDimensions(canvasRef.current, displaySize);

//       let capturedDescriptors = [];
//       const maxSamples = 30;
//       const sampleIntervalMs = 500;
//       let attempts = 0;
//       const maxAttempts = 120;

//       intervalRef.current = setInterval(async () => {
//         try {
//           if (!mountedRef.current) return;

//           attempts++;
//           if (attempts > maxAttempts) {
//             clearInterval(intervalRef.current);
//             stopCamera();
//             setIsCapturing(false);
//             setInstruction("");
//             showAlert(
//               "Failed to capture enough samples. Please try again with better lighting."
//             );
//             return;
//           }

//           const detections = await faceapi
//             .detectAllFaces(
//               videoRef.current,
//               new faceapi.TinyFaceDetectorOptions()
//             )
//             .withFaceLandmarks()
//             .withFaceDescriptors();

//           const resized = faceapi.resizeResults(detections, displaySize);

//           if (canvasRef.current) {
//             const ctx = canvasRef.current.getContext("2d");
//             ctx.clearRect(
//               0,
//               0,
//               canvasRef.current.width,
//               canvasRef.current.height
//             );
//             faceapi.draw.drawDetections(canvasRef.current, resized);
//           }

//           if (!detections || detections.length === 0) {
//             setInstruction("🕵️‍♂️ No face detected. Please look at the camera.");
//             return;
//           }

//           if (detections.length > 1) {
//             setInstruction(
//               "👥 Multiple faces found. Ensure only one person is in front of the camera."
//             );
//             return;
//           }

//           const box = detections[0].detection.box;
//           if (box.width < 100 || box.height < 100) {
//             setInstruction(
//               "📏 Move closer to the camera for better detection."
//             );
//             return;
//           }

//           const brightness = estimateVideoBrightness(videoRef.current);
//           if (brightness < 40) {
//             setInstruction(
//               "💡 Low lighting detected. Please move to a brighter area."
//             );
//             return;
//           }

//           capturedDescriptors.push(Array.from(detections[0].descriptor));
//           setSamplesCount(capturedDescriptors.length);
//           setInstruction(
//             `✅ Capturing... (${capturedDescriptors.length}/${maxSamples} samples)`
//           );

//           if (capturedDescriptors.length >= maxSamples) {
//             clearInterval(intervalRef.current);
//             setInstruction("✅ Captured enough samples. Saving...");
//             await saveCapturedFace(capturedDescriptors);
//             stopCamera();
//             setIsCapturing(false);
//             setInstruction("");
//             setSamplesCount(0);
//           }
//         } catch (err) {
//           console.error("capture interval error:", err);
//         }
//       }, sampleIntervalMs);
//     } catch (err) {
//       console.error("captureFaceData error:", err);
//       showAlert(
//         "Could not access camera. Please allow camera permissions and try again."
//       );
//       setIsCapturing(false);
//       stopCamera();
//       clearInterval(intervalRef.current);
//       setInstruction("");
//       setSamplesCount(0);
//     }
//   };

//   function estimateVideoBrightness(video) {
//     try {
//       const canvas = document.createElement("canvas");
//       canvas.width = video.videoWidth || video.width || 320;
//       canvas.height = video.videoHeight || video.height || 240;
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//       const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
//       let total = 0;
//       for (let i = 0; i < frame.data.length; i += 4) {
//         const r = frame.data[i];
//         const g = frame.data[i + 1];
//         const b = frame.data[i + 2];
//         total += (r + g + b) / 3;
//       }
//       return total / (frame.data.length / 4);
//     } catch (err) {
//       console.warn("estimateVideoBrightness failed:", err);
//       return 255;
//     }
//   }

//   const saveCapturedFace = async (capturedDescriptors) => {
//     const descriptorsToSend = capturedDescriptors.map((d) =>
//       Array.isArray(d) ? d : Array.from(d)
//     );

//     const body = {
//       employee_id: userName,
//       label: userName,
//       descriptors: descriptorsToSend,
//     };

//     if (!BACKEND_URL) {
//       showAlert("Missing backend configuration (URL).");
//       return;
//     }

//     if (!employeeIdFromAuth) {
//       showAlert(
//         "Employee ID is missing from authentication context. Please login and try again."
//       );
//       return;
//     }

//     try {
//       const headers = {
//         "Content-Type": "application/json",
//         "x-api-key": API_KEY,
//         "x-employee-id": employeeIdFromAuth || "",
//         "x-org-id": orgId || "",
//       };

//       const resp = await fetch(
//         `${BACKEND_URL.replace(/\/$/, "")}/api/face/save-face-data`,
//         {
//           method: "POST",
//           credentials: "include",
//           headers,
//           body: JSON.stringify(body),
//         }
//       );

//       const respBody = await resp.json().catch(() => null);
//       if (resp.ok) {
//         showAlert(respBody?.message || "Face data saved successfully.");
//         setTimeout(() => {
//           closeAlert();
//           onClose?.();
//         }, 1200);
//       } else {
//         console.error("saveCapturedFace failed", resp.status, respBody);
//         showAlert(
//           respBody?.error || respBody?.message || "Failed to save face data."
//         );
//       }
//     } catch (err) {
//       console.error("saveCapturedFace error:", err);
//       showAlert("Network error while saving face data. Please try again.");
//     }
//   };

//   return (
//     <div className="save-face-container">
//       <h2>Save Face Data</h2>

//       <div className="disclaimer-note">
//         <p>
//           <strong>Note:</strong> We are capturing your facial data for
//           attendance purposes. This data will be securely stored and used only
//           for employee attendance tracking.
//         </p>
//       </div>

//       <div
//         className={`video-wrapper ${isCapturing ? "capturing" : ""}`}
//         style={{ position: "relative" }}
//       >
//         <video
//           ref={videoRef}
//           id="video"
//           autoPlay
//           muted
//           playsInline
//           width={640}
//           height={480}
//           style={{
//             width: "100%",
//             height: "auto",
//             maxHeight: isMobile ? 300 : 360,
//             borderRadius: 10,
//             objectFit: "cover",
//             boxShadow: "0 0 12px rgba(0,0,0,0.25)",
//           }}
//         />
//         <div className="instruction" role="status" aria-live="polite">
//           {instruction}
//         </div>
//       </div>

//       <div className="face-buttons" style={{ marginTop: 12 }}>
//         <button
//           id="saveFace"
//           onClick={captureFaceData}
//           disabled={isCapturing || !modelsLoaded}
//           className="btn"
//         >
//           {isCapturing ? `Capturing... (${samplesCount}/30)` : "Save My Face"}
//         </button>
//         <button
//           onClick={() => {
//             stopCamera();
//             setIsCapturing(false);
//             setInstruction("");
//             setSamplesCount(0);
//             clearInterval(intervalRef.current);
//           }}
//           className="btn btn-secondary"
//           disabled={!isCapturing}
//           style={{ marginLeft: 8 }}
//         >
//           Cancel
//         </button>
//       </div>

//       <Modal
//         isVisible={alertModal.isVisible}
//         onClose={closeAlert}
//         buttons={[{ label: "OK", onClick: closeAlert }]}
//       >
//         <p>{alertModal.message}</p>
//       </Modal>
//     </div>
//   );
// }

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";
import "./SaveFaceData.css";

export default function SaveFaceData({ onClose }) {
  const { user, hydrated } = useAuth();
  const employeeIdFromAuth =
    user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const captureBusyRef = useRef(false);
  const streamRef = useRef(null);
  const cameraStartPromiseRef = useRef(null);

  const [userName, setUserName] = useState(employeeIdFromAuth || "");
  const [isCapturing, setIsCapturing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [instruction, setInstruction] = useState("");
  const [samplesCount, setSamplesCount] = useState(0);

  const [alertModal, setAlertModal] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  useEffect(() => {
    mountedRef.current = true;
    setUserName(employeeIdFromAuth || "");
    setIsMobile(typeof window !== "undefined" && window.innerWidth <= 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      mountedRef.current = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
      stopCamera();
      clearInterval(intervalRef.current);
    };
  }, [employeeIdFromAuth]);

  useEffect(() => {
    if (hydrated && !user) {
      showAlert(
        "User information not found. Please login or ensure your session is active.",
      );
    }
  }, [hydrated, user]);

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  const interpretFaceCheck = (respData) => {
    if (!respData) return { exists: false, count: null, raw: respData };

    const exists =
      Boolean(respData.exists) ||
      Boolean(respData.isRegistered) ||
      Boolean(respData.registered) ||
      (typeof respData.count === "number" && respData.count > 0) ||
      Boolean(respData.data?.exists) ||
      Boolean(respData.data?.isRegistered) ||
      (typeof respData.data?.count === "number" && respData.data.count > 0) ||
      false;

    let count = null;
    if (typeof respData.count === "number") count = respData.count;
    else if (typeof respData.data?.count === "number")
      count = respData.data.count;
    else if (Array.isArray(respData.data)) count = respData.data.length;
    else if (Array.isArray(respData)) count = respData.length;

    return { exists, count, raw: respData };
  };

  async function checkExistingFace(employeeId) {
    if (!BACKEND_URL) {
      console.warn("Missing backend while checking existing face");
      return null;
    }
    try {
      const headers = {
        "x-api-key": API_KEY,
        "x-employee-id": employeeIdFromAuth || "",
        "x-org-id": orgId || "",
      };
      const resp = await fetch(
        `${BACKEND_URL.replace(/\/$/, "")}/api/face/check/${encodeURIComponent(
          employeeId,
        )}`,
        { credentials: "include", headers },
      );

      const parsed = await resp.json().catch(() => null);
      if (!resp.ok && !parsed) {
        console.warn("face check returned non-OK without body:", resp.status);
        return null;
      }
      return interpretFaceCheck(parsed);
    } catch (err) {
      console.error("checkExistingFace error:", err);
      return null;
    }
  }

  useEffect(() => {
    let canceled = false;
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        if (!canceled && mountedRef.current) setModelsLoaded(true);
      } catch (err) {
        console.error("Error loading face-api models:", err);
        showAlert("Error initializing face recognition models.");
      }
    };

    loadModels();

    (async () => {
      if (!userName) return;
      const check = await checkExistingFace(userName);
      if (check === null) {
        showAlert("Failed to check existing face data. Please try again.");
        return;
      }
      if (check.exists) {
        showAlert("Face data already exists for this Employee ID.");
        setTimeout(() => {
          closeAlert();
          onClose?.();
        }, 1000);
        return;
      }
      if (typeof check.count === "number" && check.count > 1) {
        showAlert(
          `Multiple entries (${check.count}) found for Employee ID ${userName}. Cannot capture face data.`,
        );
        return;
      }
    })();

    return () => {
      canceled = true;
    };
  }, [userName]);

  const checkCameraAvailability = async () => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return false;
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((d) => d.kind === "videoinput");
    } catch (err) {
      console.error("checkCameraAvailability error:", err);
      return false;
    }
  };

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    if (cameraStartPromiseRef.current) return cameraStartPromiseRef.current;

    const activeStream = streamRef.current;
    if (activeStream?.active) {
      videoRef.current.srcObject = activeStream;
      await videoRef.current.play();
      return activeStream;
    }

    const startPromise = (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
        await new Promise((resolve, reject) => {
          const video = videoRef.current;
          const timeout = window.setTimeout(() => {
            video.removeEventListener("loadedmetadata", handleVideoReady);
            reject(new Error("Camera video did not become ready."));
          }, 5000);
          const handleVideoReady = () => {
            if (!video.videoWidth || !video.videoHeight) return;
            window.clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", handleVideoReady);
            resolve();
          };
          video.addEventListener("loadedmetadata", handleVideoReady);
          handleVideoReady();
        });
      }

      return stream;
    })();

    cameraStartPromiseRef.current = startPromise;
    try {
      return await startPromise;
    } catch (err) {
      console.error("startCamera error:", err);
      throw err;
    } finally {
      if (cameraStartPromiseRef.current === startPromise) {
        cameraStartPromiseRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    let canceled = false;
    setInstruction("Preparing camera...");
    startCamera()
      .then(() => {
        if (!canceled) {
          setInstruction("Camera ready. Click Save My Face to capture.");
        }
      })
      .catch((err) => {
        if (canceled) return;
        console.error("Automatic camera start failed:", err);
        setInstruction("");
        showAlert(
          "Could not access camera. Please allow camera permissions and try again.",
        );
      });

    return () => {
      canceled = true;
    };
  }, [startCamera]);

  const stopCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const stream = streamRef.current || video.srcObject;
    if (stream) {
      stream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {}
      });
    }
    streamRef.current = null;
    if (video) video.srcObject = null;
    if (canvasRef.current && canvasRef.current.parentNode) {
      try {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      } catch (e) {}
      canvasRef.current = null;
    }
    setInstruction("");
    setSamplesCount(0);
  };

  const captureFaceData = async () => {
    if (!modelsLoaded) {
      showAlert("Face models are still loading. Please wait a moment.");
      return;
    }

    if (!userName || !userName.trim()) {
      showAlert("Employee ID not available.");
      return;
    }

    setIsCapturing(true);
    setInstruction("🔄 Preparing camera...");
    setSamplesCount(0);

    try {
      await startCamera();

      const hasCamera = await checkCameraAvailability();
      if (!hasCamera) {
        stopCamera();
        setIsCapturing(false);
        showAlert("No camera found on this device. Cannot capture face data.");
        return;
      }

      const check = await checkExistingFace(userName);
      if (check === null) {
        stopCamera();
        setIsCapturing(false);
        showAlert("Failed to check existing face data. Please try again.");
        return;
      }
      if (check.exists) {
        stopCamera();
        setIsCapturing(false);
        showAlert("Face data already exists for this Employee ID.");
        setTimeout(() => {
          closeAlert();
          onClose?.();
        }, 900);
        return;
      }
      if (typeof check.count === "number" && check.count > 1) {
        stopCamera();
        setIsCapturing(false);
        showAlert(
          "Multiple face entries found for this Employee ID. Cannot capture.",
        );
        return;
      }

      if (!canvasRef.current && videoRef.current) {
        const canvas = faceapi.createCanvasFromMedia(videoRef.current);
        canvasRef.current = canvas;
        const container = videoRef.current.parentElement || document.body;
        canvas.style.position = "absolute";
        canvas.style.top = videoRef.current.offsetTop + "px";
        canvas.style.left = videoRef.current.offsetLeft + "px";
        container.appendChild(canvas);
      }

      const displaySize = {
        width:
          videoRef.current.videoWidth || videoRef.current.clientWidth || 640,
        height:
          videoRef.current.videoHeight || videoRef.current.clientHeight || 480,
      };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      let capturedDescriptors = [];
      const maxSamples = 30;
      const sampleIntervalMs = 500;
      let attempts = 0;
      const maxAttempts = 120;

      intervalRef.current = setInterval(async () => {
        if (!mountedRef.current || captureBusyRef.current) return;
        captureBusyRef.current = true;

        try {
          attempts++;
          if (attempts > maxAttempts) {
            clearInterval(intervalRef.current);
            stopCamera();
            setIsCapturing(false);
            setInstruction("");
            showAlert(
              "Could not detect a clear, centered face. Face the camera, move a little closer, and check the lighting.",
            );
            return;
          }

          const detections = await faceapi
            .detectAllFaces(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 512,
                scoreThreshold: 0.3,
              }),
            )
            .withFaceLandmarks()
            .withFaceDescriptors();

          const resized = faceapi.resizeResults(detections, displaySize);

          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height,
            );
            faceapi.draw.drawDetections(canvasRef.current, resized);
          }

          if (!detections || detections.length === 0) {
            setInstruction("🕵️‍♂️ No face detected. Please look at the camera.");
            return;
          }

          if (detections.length > 1) {
            setInstruction(
              "👥 Multiple faces found. Ensure only one person is in front of the camera.",
            );
            return;
          }

          const box = detections[0].detection.box;
          const frameWidth = videoRef.current.videoWidth || displaySize.width;
          const frameHeight =
            videoRef.current.videoHeight || displaySize.height;
          if (
            box.width < Math.max(60, frameWidth * 0.12) ||
            box.height < Math.max(60, frameHeight * 0.12)
          ) {
            setInstruction(
              "📏 Move closer to the camera for better detection.",
            );
            return;
          }

          const brightness = estimateVideoBrightness(videoRef.current, box);
          if (brightness < 40) {
            setInstruction(
              "💡 Low lighting detected. Please move to a brighter area.",
            );
            return;
          }

          capturedDescriptors.push(Array.from(detections[0].descriptor));
          setSamplesCount(capturedDescriptors.length);
          setInstruction(
            `✅ Capturing... (${capturedDescriptors.length}/${maxSamples} samples)`,
          );

          if (capturedDescriptors.length >= maxSamples) {
            clearInterval(intervalRef.current);
            setInstruction("✅ Captured enough samples. Saving...");
            await saveCapturedFace(capturedDescriptors);
            stopCamera();
            setIsCapturing(false);
            setInstruction("");
            setSamplesCount(0);
          }
        } catch (err) {
          console.error("capture interval error:", err);
        } finally {
          captureBusyRef.current = false;
        }
      }, sampleIntervalMs);
    } catch (err) {
      console.error("captureFaceData error:", err);
      showAlert(
        "Could not access camera. Please allow camera permissions and try again.",
      );
      setIsCapturing(false);
      stopCamera();
      clearInterval(intervalRef.current);
      setInstruction("");
      setSamplesCount(0);
    }
  };

  function estimateVideoBrightness(video, faceBox) {
    try {
      const canvas = document.createElement("canvas");
      const sourceWidth = video.videoWidth || video.width || 320;
      const sourceHeight = video.videoHeight || video.height || 240;
      const sourceX = faceBox ? Math.max(0, Math.floor(faceBox.x)) : 0;
      const sourceY = faceBox ? Math.max(0, Math.floor(faceBox.y)) : 0;
      const width = faceBox
        ? Math.min(Math.ceil(faceBox.width), sourceWidth - sourceX)
        : sourceWidth;
      const height = faceBox
        ? Math.min(Math.ceil(faceBox.height), sourceHeight - sourceY)
        : sourceHeight;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        video,
        sourceX,
        sourceY,
        width,
        height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let total = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const r = frame.data[i];
        const g = frame.data[i + 1];
        const b = frame.data[i + 2];
        total += (r + g + b) / 3;
      }
      return total / (frame.data.length / 4);
    } catch (err) {
      console.warn("estimateVideoBrightness failed:", err);
      return 255;
    }
  }

  const saveCapturedFace = async (capturedDescriptors) => {
    const descriptorsToSend = capturedDescriptors.map((d) =>
      Array.isArray(d) ? d : Array.from(d),
    );

    const body = {
      employee_id: userName,
      label: userName,
      descriptors: descriptorsToSend,
    };

    if (!BACKEND_URL) {
      showAlert("Missing backend configuration (URL).");
      return;
    }

    if (!employeeIdFromAuth) {
      showAlert(
        "Employee ID is missing from authentication context. Please login and try again.",
      );
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "x-employee-id": employeeIdFromAuth || "",
        "x-org-id": orgId || "",
      };

      const resp = await fetch(
        `${BACKEND_URL.replace(/\/$/, "")}/api/face/save-face-data`,
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify(body),
        },
      );

      const respBody = await resp.json().catch(() => null);
      if (resp.ok) {
        showAlert(respBody?.message || "Face data saved successfully.");
        setTimeout(() => {
          closeAlert();
          onClose?.();
        }, 1200);
      } else {
        console.error("saveCapturedFace failed", resp.status, respBody);
        showAlert(
          respBody?.error || respBody?.message || "Failed to save face data.",
        );
      }
    } catch (err) {
      console.error("saveCapturedFace error:", err);
      showAlert("Network error while saving face data. Please try again.");
    }
  };

  return (
    <div className="save-face-container">
      <h2>Save Face Data</h2>

      <div className="disclaimer-note">
        <p>
          <strong>Note:</strong> We are capturing your facial data for
          attendance purposes. This data will be securely stored and used only
          for employee attendance tracking.
        </p>
      </div>

      <div
        className={`video-wrapper ${isCapturing ? "capturing" : ""}`}
        style={{ position: "relative" }}
      >
        <video
          ref={videoRef}
          id="video"
          autoPlay
          muted
          playsInline
          width={640}
          height={480}
          style={{
            width: "100%",
            height: "auto",
            maxHeight: isMobile ? 300 : 360,
            borderRadius: 10,
            objectFit: "cover",
            boxShadow: "0 0 12px rgba(0,0,0,0.25)",
          }}
        />
        <div className="instruction" role="status" aria-live="polite">
          {instruction}
        </div>
      </div>

      <div className="face-buttons" style={{ marginTop: 12 }}>
        <button
          id="saveFace"
          onClick={captureFaceData}
          disabled={isCapturing || !modelsLoaded}
          className="btn"
        >
          {isCapturing ? `Capturing... (${samplesCount}/30)` : "Save My Face"}
        </button>
        <button
          onClick={() => {
            stopCamera();
            setIsCapturing(false);
            setInstruction("");
            setSamplesCount(0);
            clearInterval(intervalRef.current);
          }}
          className="btn btn-secondary"
          disabled={!isCapturing}
          style={{ marginLeft: 8 }}
        >
          Cancel
        </button>
      </div>

      <Modal
        isVisible={alertModal.isVisible}
        onClose={closeAlert}
        buttons={[{ label: "OK", onClick: closeAlert }]}
      >
        <p>{alertModal.message}</p>
      </Modal>
    </div>
  );
}
