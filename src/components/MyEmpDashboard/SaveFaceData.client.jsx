"use client";

import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import Modal from "../Modal/Modal.client";
import { useAuth } from "../../context/AuthProvider.client";
import "./SaveFaceData.css";

export default function SaveFaceData({ onClose }) {
  const { user } = useAuth();
  const employeeIdFromAuth =
    user?.employeeId ?? user?.employee_id ?? user?.id ?? null;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const [userName, setUserName] = useState(employeeIdFromAuth || "");
  const [isCapturing, setIsCapturing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeIdFromAuth]);

  const showAlert = (message, title = "") =>
    setAlertModal({ isVisible: true, title, message });
  const closeAlert = () =>
    setAlertModal({ isVisible: false, title: "", message: "" });

  // Normalize backend response check into a boolean-like object
  const interpretFaceCheck = (respData) => {
    if (!respData) return { exists: false, raw: respData };
    // common shapes:
    // { exists: true }  OR { isRegistered: true } OR { registered: true } OR { count: 1 }
    const exists =
      Boolean(respData.exists) ||
      Boolean(respData.isRegistered) ||
      Boolean(respData.registered) ||
      (typeof respData.count === "number" && respData.count > 0) ||
      Boolean(respData.data?.exists) ||
      Boolean(respData.data?.isRegistered) ||
      (typeof respData.data?.count === "number" && respData.data.count > 0);
    return { exists, raw: respData };
  };

  async function checkExistingFace(employeeId) {
    if (!BACKEND_URL || !API_KEY) {
      // treat as "unknown" instead of forcing popup
      console.warn("Missing backend or API key while checking existing face");
      return null;
    }
    try {
      const headers = {
        "x-api-key": API_KEY,
        "x-employee-id": employeeIdFromAuth || "",
      };
      const resp = await fetch(
        `${BACKEND_URL.replace(/\/$/, "")}/api/face/check/${encodeURIComponent(
          employeeId
        )}`,
        {
          headers,
        }
      );
      if (!resp.ok) {
        // parse body for debug but don't force popup
        const maybe = await resp.json().catch(() => null);
        console.warn("face check returned non-OK:", resp.status, maybe);
        return interpretFaceCheck(maybe);
      }
      const data = await resp.json().catch(() => null);
      return interpretFaceCheck(data);
    } catch (err) {
      console.error("checkExistingFace error:", err);
      return null;
    }
  }

  // On mount: load models and also pre-check if face exists to avoid showing modal at all
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

    // pre-check existence: if exists -> close immediately (don't show the modal)
    (async () => {
      if (!userName) return;
      const check = await checkExistingFace(userName);
      if (check && check.exists) {
        // show a brief confirmation then close
        showAlert("Face data already exists for this Employee ID.");
        setTimeout(() => {
          closeAlert();
          onClose?.();
        }, 1000);
      }
    })();

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      return stream;
    } catch (err) {
      console.error("startCamera error:", err);
      throw err;
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {}
      });
    }
    if (video) video.srcObject = null;
    if (canvasRef.current && canvasRef.current.parentNode) {
      try {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      } catch (e) {}
      canvasRef.current = null;
    }
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

    const hasCamera = await checkCameraAvailability();
    if (!hasCamera) {
      showAlert("No camera found on this device. Cannot capture face data.");
      return;
    }

    // Check existing face data — if exists, inform and close
    const check = await checkExistingFace(userName);
    if (check) {
      if (check.exists) {
        showAlert("Face data already exists for this Employee ID.");
        // close modal after letting user see the message
        setTimeout(() => {
          closeAlert();
          onClose?.();
        }, 900);
        return;
      }
      if (check.count > 1) {
        showAlert(
          "Multiple face entries found for this Employee ID. Cannot capture."
        );
        // leave modal open for support/help
        return;
      }
    }

    // proceed to capture
    setIsCapturing(true);
    try {
      await startCamera();

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
      const maxAttempts = 100;

      intervalRef.current = setInterval(async () => {
        try {
          if (!mountedRef.current) return;

          attempts++;
          if (attempts > maxAttempts) {
            clearInterval(intervalRef.current);
            stopCamera();
            setIsCapturing(false);
            showAlert(
              "Failed to capture enough samples. Please try again with better lighting."
            );
            return;
          }

          const detections = await faceapi
            .detectAllFaces(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceDescriptors();

          const resized = faceapi.resizeResults(detections, displaySize);
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          faceapi.draw.drawDetections(canvasRef.current, resized);

          if (!detections || detections.length === 0) {
            return;
          }
          if (detections.length > 1) {
            return;
          }

          const box = detections[0].detection.box;
          if (box.width < 100 || box.height < 100) {
            return;
          }

          const brightness = estimateVideoBrightness(videoRef.current);
          if (brightness < 40) {
            return;
          }

          capturedDescriptors.push(Array.from(detections[0].descriptor));

          if (capturedDescriptors.length >= maxSamples) {
            clearInterval(intervalRef.current);
            await saveCapturedFace(capturedDescriptors);
            stopCamera();
            setIsCapturing(false);
          }
        } catch (err) {
          console.error("capture interval error:", err);
        }
      }, sampleIntervalMs);
    } catch (err) {
      console.error("captureFaceData error:", err);
      showAlert(
        "Could not access camera. Please allow camera permissions and try again."
      );
      setIsCapturing(false);
      stopCamera();
      clearInterval(intervalRef.current);
    }
  };

  function estimateVideoBrightness(video) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || video.width || 320;
      canvas.height = video.videoHeight || video.height || 240;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
      Array.isArray(d) ? d : Array.from(d)
    );

    const body = {
      employee_id: userName,
      label: userName,
      descriptors: descriptorsToSend,
    };

    if (!BACKEND_URL || !API_KEY) {
      showAlert("Missing backend configuration (API key / URL).");
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "x-employee-id": employeeIdFromAuth || "",
      };

      const resp = await fetch(
        `${BACKEND_URL.replace(/\/$/, "")}/api/face/save-face-data`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }
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
          respBody?.error || respBody?.message || "Failed to save face data."
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

      <div className={`video-wrapper ${isCapturing ? "capturing" : ""}`}>
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
      </div>

      <div className="face-buttons">
        <button
          id="saveFace"
          onClick={captureFaceData}
          disabled={isCapturing || !modelsLoaded}
          className="btn"
        >
          {isCapturing ? "Capturing..." : "Save My Face"}
        </button>
        <button
          onClick={() => {
            stopCamera();
            setIsCapturing(false);
          }}
          className="btn btn-secondary"
          disabled={!isCapturing}
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
