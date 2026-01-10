


"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./FacePunch.css";

/* ✅ ADDED */
import { useAuth } from "../../context/AuthProvider.client";

const COOLDOWN_PERIOD = 10000;

export default function FacePunch() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceApiRef = useRef(null);
  const initializedRef = useRef(false);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPunchTime, setLastPunchTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [employeeInfo, setEmployeeInfo] = useState(null);

  const [employeeId, setEmployeeId] = useState(null);
  const [orgId, setOrgId] = useState(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

  /* ✅ ADDED */
  const { user } = useAuth();

  /* ---------------------------------- */
  /* Load IDs safely */
  /* ---------------------------------- */
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("dashboardData") || "{}");
    if (stored?.employeeId) setEmployeeId(stored.employeeId);
    if (stored?.orgId) setOrgId(stored.orgId);
  }, []);

  /* ✅ ADDED — fallback to useAuth (NO EXISTING CODE TOUCHED) */
  useEffect(() => {
    if (!employeeId) {
      const eid =
        user?.employeeId ??
        user?.employee_id ??
        user?.raw?.employee_id ??
        null;

      if (eid) setEmployeeId(eid);
    }

    if (!orgId) {
      const oid =
        user?.orgId ??
        user?.org_id ??
        user?.raw?.org_id ??
        null;

      if (oid) setOrgId(oid);
    }
  }, [user, employeeId, orgId]);

  /* ---------------------------------- */
  /* Load face-api + camera ONCE */
  /* ---------------------------------- */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let mounted = true;

    const init = async () => {
      try {
       const faceapi = await import("face-api.js");
faceApiRef.current = faceapi;

const MODEL_URL = "/models";

await Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
  faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
]);

console.log("✅ SSD + Landmarks + Recognition loaded");


console.log("✅ SSD + Landmarks + Recognition loaded");

console.log("✅ Face-api models loaded successfully");


        if (!mounted) return;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;

       videoRef.current.onloadedmetadata = () => {
  videoRef.current.play();

  videoRef.current.width = videoRef.current.videoWidth;
  videoRef.current.height = videoRef.current.videoHeight;

  console.log(
    "🎥 Video ready:",
    videoRef.current.videoWidth,
    videoRef.current.videoHeight
  );

  setIsVideoReady(true);
};

      } catch (err) {
        console.error(err);
        toast.error("Camera or model load failed");
      }
    };

    init();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* ---------------------------------- */
  /* Detection loop */
  /* ---------------------------------- */
  useEffect(() => {
    if (!isVideoReady || !employeeId || !orgId) return;

  const interval = setInterval(async () => {
  console.log("Detection tick running...");

  if (isProcessing) {
    console.log("→ Still processing, skipping");
    return;
  }

  if (
  !videoRef.current ||
  videoRef.current.videoWidth === 0 ||
  videoRef.current.videoHeight === 0
) {
  console.log("→ Video not ready for detection");
  return;
}


  try {
    setIsProcessing(true);
    console.log("Detecting faces...");

    const faceapi = faceApiRef.current;

const detections = await faceapi
  .detectAllFaces(
    videoRef.current,
    new faceapi.SsdMobilenetv1Options()   // ← Change to this (no options needed usually)
  )
  .withFaceLandmarks()
  .withFaceDescriptors();


    console.log("Raw detections:", detections.length, detections);

    if (detections.length === 0) {
      console.log("→ No face detected this frame");
    } else if (detections.length > 1) {
      console.log("→ Multiple faces detected:", detections.length);
    } else {
      console.log("→ Face found! Score:", detections[0].detection.score);
      await captureAndPunch(detections[0]);
    }
  } catch (err) {
    console.error("Detection crashed:", err);
  } finally {
    setIsProcessing(false);
  }
}, 1000);
    return () => clearInterval(interval);
  }, [isVideoReady, employeeId, orgId, isProcessing, lastPunchTime]);

  /* ---------------------------------- */
  /* Punch logic */
  /* ---------------------------------- */
  const captureAndPunch = async (detection) => {
    try {
      const descriptor = Array.from(detection.descriptor);

      const res = await axios.post(
        `${BACKEND_URL}/face-punch`,
        {
          descriptor,
          punchmode: "Manually",
          device: "Desktop",
          location: "Office HQ",
        },
        {
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": employeeId,
            "x-org-id": orgId,
          },
          withCredentials: true,
        }
      );

      setEmployeeInfo({
        id: res.data.employee_id,
        name: res.data.employee_name || "Employee",
      });

      toast.success(res.data.message);
    } catch (e) {
      toast.error("Face not recognized");
    }
  };

  /* ---------------------------------- */
  /* UI */
  /* ---------------------------------- */
  return (
    <>
      <div className="face-punch-container">
        <video ref={videoRef} autoPlay muted width="720" height="560" />
        <canvas ref={canvasRef} className="overlay-canvas" />
      </div>

      <div className="employee-info-message">
        {employeeInfo
          ? `Detected: ${employeeInfo.name} (${employeeInfo.id})`
          : "No employee detected yet"}
      </div>

      {(isProcessing || cooldownRemaining > 0) && (
        <div className="cooldown-message">
          {isProcessing
            ? "Processing punch..."
            : `Please wait ${cooldownRemaining}s`}
        </div>
      )}

      <ToastContainer position="top-center" />
    </>
  );
}
