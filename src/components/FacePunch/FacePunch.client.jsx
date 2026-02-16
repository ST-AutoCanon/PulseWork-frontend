


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

  function normalizeDescriptor(desc) {
  if (!desc) return null;

  // Already correct
  if (desc instanceof Float32Array) {
    return desc;
  }

  // From DB string: "[0.12, 0.33, ...]"
  if (typeof desc === "string") {
    return new Float32Array(JSON.parse(desc));
  }

  // From plain array
  if (Array.isArray(desc)) {
    return new Float32Array(desc);
  }

  // From object {0:...,1:...}
  if (typeof desc === "object") {
    return new Float32Array(Object.values(desc));
  }

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

  /* ---------------- LOAD ADMIN FACE DATA ---------------- */
  useEffect(() => {
    if (!user) return;

    const loadFaceData = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/face-punch/face-data`,
          { headers, withCredentials: true }
        );

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

    return detections;
  };

  const validateDetection = (detection) => {
    const score = detection.detection.score;
    const box = detection.detection.box;
    const faceArea = box.width * box.height;
    const frameArea = videoRef.current.videoWidth * videoRef.current.videoHeight;
    const faceCoverage = faceArea / frameArea;

    if (score < 0.85) {
      toast.warn("Face not clear. Please face the camera properly.", {
        autoClose: 2000,
      });
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

    if (detection.descriptor.length === 128 && faceMatcher.matcher128) {
      match = faceMatcher.matcher128.findBestMatch(detection.descriptor);
    }

    if (detection.descriptor.length === 512 && faceMatcher.matcher512) {
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
        setCooldownRemaining(
          Math.ceil((COOLDOWN_PERIOD - (now - lastPunchTime)) / 1000)
        );
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
