"use client";

import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./FacePunch.css";

const COOLDOWN_PERIOD = 10000;

export default function FacePunch() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPunchTime, setLastPunchTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [lastPunchStatus, setLastPunchStatus] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);

  const [employeeId, setEmployeeId] = useState(null);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("dashboardData") || "{}");
    if (stored?.employeeId) {
      setEmployeeId(stored.employeeId);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadModelsAndCamera = async () => {
      try {
        const MODEL_URL = "/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (!mounted) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setIsVideoReady(true);
      } catch (err) {
        console.error("Model / camera error:", err);
        toast.error("Unable to access camera or load face models", {
          autoClose: 2000,
        });
      }
    };

    loadModelsAndCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isVideoReady || !employeeId) return;

    const intervalId = setInterval(async () => {
      const now = Date.now();

      if (isProcessing) return;

      if (now - lastPunchTime < COOLDOWN_PERIOD) {
        setCooldownRemaining(
          Math.ceil((COOLDOWN_PERIOD - (now - lastPunchTime)) / 1000)
        );
        return;
      }

      try {
        setIsProcessing(true);

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const size = {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          };
          faceapi.matchDimensions(canvas, size);
          const resized = faceapi.resizeResults(detections, size);
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resized);
        }

        if (detections.length === 1) {
          const d = detections[0];
          const score = d.detection.score;
          const area = d.detection.box.width * d.detection.box.height;
          const frameArea =
            videoRef.current.videoWidth * videoRef.current.videoHeight;

          if (score < 0.85) {
            toast.warn("Face not clear", { autoClose: 2000 });
            return;
          }

          if (area / frameArea < 0.06) {
            toast.warn("Come closer to camera", { autoClose: 2000 });
            return;
          }

          await captureAndPunch(d);
          setLastPunchTime(Date.now());
          setCooldownRemaining(COOLDOWN_PERIOD / 1000);
        } else if (detections.length > 1) {
          toast.warn("Multiple faces detected", { autoClose: 2000 });
        }
      } catch (e) {
        console.error("Detection error:", e);
      } finally {
        setIsProcessing(false);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isVideoReady, employeeId, isProcessing, lastPunchTime]);

  const getLastPunchStatus = async (descriptor) => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/last-punch-status`,
        { descriptor },
        {
          withCredentials: true,
          headers: { "x-api-key": API_KEY },
        }
      );
      return res.data.status || null;
    } catch {
      return null;
    }
  };

  const speakPunchStatus = (name, status) => {
    const u = new SpeechSynthesisUtterance(`${name} ${status}`);
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  };

  const captureAndPunch = async (detection) => {
    const descriptor = Array.from(detection.descriptor);

    try {
      const lastStatus = await getLastPunchStatus(descriptor);
      const punchType = lastStatus === "punch-in" ? "punch-out" : "punch-in";

      const res = await axios.post(
        `${BACKEND_URL}/face-punch`,
        {
          descriptor,
          punchType,
          punchmode: "Manually",
          device: "Desktop",
          location: "Office HQ",
        },
        {
          withCredentials: true,
          headers: {
            "x-api-key": API_KEY,
            "x-employee-id": employeeId,
            "x-org-id": orgId,
          },
        }
      );

      const emp = {
        id: res.data.employee_id,
        name: res.data.employee_name || "Employee",
      };

      setEmployeeInfo(emp);
      setLastPunchStatus(res.data.punchType || punchType);

      speakPunchStatus(
        emp.name,
        punchType === "punch-in" ? "punched in" : "punched out"
      );

      toast.success(res.data.message, { autoClose: 2000 });
    } catch (e) {
      if (e?.response?.data?.message === "Face not recognized") {
        toast.warn("Face not recognized", { autoClose: 2000 });
      } else {
        toast.error("Punch failed", { autoClose: 2000 });
      }
    }
  };

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

      <ToastContainer position="top-center" style={{ marginTop: 40 }} />
    </>
  );
}
