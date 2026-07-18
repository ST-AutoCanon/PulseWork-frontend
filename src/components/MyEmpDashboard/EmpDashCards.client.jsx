

"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";
import "./EmpDashCards.css";
import {
  FaFingerprint,
  FaRegClock,
  FaMapMarkerAlt,
  FaDesktop,
  FaMobileAlt,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider.client";

const normalizeDescriptor = (desc) => {
  if (!desc) return null;

  if (Array.isArray(desc) && desc.length === 128) {
    return new Float32Array(desc);
  }

  if (typeof desc === "object") {
    const arr = Object.values(desc).map(Number);
    if (arr.length === 128) {
      return new Float32Array(arr);
    }
  }

  return null;
};

const parseServerTimestampToLocalString = (ts) => {
  if (!ts && ts !== 0) return "NA";
  const s = String(ts).trim();

  if (/^\d{10}$/.test(s) || /^\d{13}$/.test(s)) {
    const n = s.length === 10 ? Number(s) * 1000 : Number(s);
    const d = new Date(n);
    return isNaN(d.getTime()) ? "NA" : d.toLocaleString();
  }

  if (/\d{4}-\d{2}-\d{2}T.*(Z|[+\-]\d{2}:\d{2})$/i.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? "NA" : d.toLocaleString();
  }

  const localIso = s.replace(" ", "T");

  const dLocal = new Date(localIso);
  if (!isNaN(dLocal.getTime())) return dLocal.toLocaleString();

  const dFallback = new Date(s);
  if (!isNaN(dFallback.getTime())) return dFallback.toLocaleString();

  const dUtcGuess = new Date(localIso + "Z");
  if (!isNaN(dUtcGuess.getTime())) return dUtcGuess.toLocaleString();

  return "NA";
};

export default function EmpDashCards() {
  const { user } = useAuth();

  const employeeId =
    user?.employeeId ?? user?.employee_id ?? user?.id ?? user?.employee_code ?? null;

  const orgId =
    user?.orgId ?? user?.org_id ?? user?.Org_id ?? user?.organization_id ?? "1";

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

  const videoRef = useRef(null);

  const [punchData, setPunchData] = useState({
    time: "NA",
    location: "NA",
    device: "NA",
  });

  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [errorPopup, setErrorPopup] = useState("");
  const [lateLoginPopup, setLateLoginPopup] = useState("");

  const buildHeaders = () => {
    const headers = {};
    if (API_KEY) headers["x-api-key"] = API_KEY;
    if (employeeId) headers["x-employee-id"] = employeeId;
    if (orgId) headers["x-org-id"] = String(orgId);
    return headers;
  };

  const fetchLatestPunchData = async () => {
    if (!employeeId || !BACKEND_URL) return;

    try {
      const response = await axios.get(
        `${BACKEND_URL}/attendance/employee/${encodeURIComponent(employeeId)}/latest-punch`,
        {
          withCredentials: true,
          headers: buildHeaders(),
        }
      );

      const latestPunch = response?.data?.data;

      if (!latestPunch) {
        setPunchData({
          time: "NA",
          location: "NA",
          device: "NA",
        });
        setIsPunchedIn(false);
        return;
      }

      setPunchData({
        time: latestPunch.punchout_time
          ? parseServerTimestampToLocalString(latestPunch.punchout_time)
          : latestPunch.punchin_time
            ? parseServerTimestampToLocalString(latestPunch.punchin_time)
            : "NA",
        location:
          latestPunch.punchout_location ||
          latestPunch.punchin_location ||
          "NA",
        device:
          latestPunch.punchout_device ||
          latestPunch.punchin_device ||
          "NA",
      });

      setIsPunchedIn(latestPunch.punch_status === "Punch In");
    } catch (err) {
      console.error("Error fetching latest punch data:", err);
    }
  };

  useEffect(() => {
    if (!employeeId) return;

    let intervalId;

    fetchLatestPunchData();
    intervalId = setInterval(fetchLatestPunchData, 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [employeeId, orgId, BACKEND_URL, API_KEY]);

  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (mounted) {
          console.log("Face API models loaded");
        }
      } catch (err) {
        console.error("Failed to load face-api models:", err);
      }
    };

    loadModels();

    return () => {
      mounted = false;
    };
  }, []);

  const getDeviceType = () =>
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      ? "Mobile"
      : "Desktop";

  const getLocationAndDevice = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve({
          location: "Geolocation not supported",
          device: getDeviceType(),
          latitude: null,
          longitude: null,
        });
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18`
            );
            const data = await res.json();

            const {
              road,
              suburb,
              village,
              town,
              city,
              county,
              state,
              postcode,
            } = data?.address || {};

            const location = [
              road,
              suburb,
              village,
              town,
              city,
              county,
              state,
              postcode,
            ]
              .filter(Boolean)
              .join(", ");

            resolve({
              location: location || "Unknown",
              device: getDeviceType(),
              latitude,
              longitude,
            });
          } catch (err) {
            console.error("Reverse geocoding failed:", err);
            resolve({
              location: "Unknown",
              device: getDeviceType(),
              latitude,
              longitude,
            });
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          resolve({
            location: "Unable to retrieve location",
            device: getDeviceType(),
            latitude: null,
            longitude: null,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 5000,
        }
      );
    });

  const isCameraAvailable = async () => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return false;
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((d) => d.kind === "videoinput");
    } catch (err) {
      console.error("Camera check failed:", err);
      return false;
    }
  };

  const setupCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    await new Promise((r) => setTimeout(r, 1500));
    return stream;
  };

  const detectFace = async () => {
    for (let i = 0; i < 10; i++) {
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) return detection;

      await new Promise((r) => setTimeout(r, 800));
    }

    return null;
  };

  const fetchDescriptors = async () => {
    const resp = await axios.get(
      `${BACKEND_URL}/api/face-data/${encodeURIComponent(employeeId)}`,
      {
        withCredentials: true,
        headers: buildHeaders(),
      }
    );

    return resp?.data?.descriptors ?? resp?.data?.data?.descriptors ?? [];
  };

  const matchFace = (detectionDescriptor, descriptors) => {
    for (const desc of descriptors) {
      const normalized = normalizeDescriptor(desc);
      if (!normalized) continue;

      const distance = faceapi.euclideanDistance(
        detectionDescriptor,
        normalized
      );

      console.log("face distance:", distance);

      if (distance < 0.4) {
        return true;
      }
    }

    return false;
  };

  const cleanupCamera = (stream) => {
    try {
      if (videoRef.current?.srcObject) {
        const currentStream = videoRef.current.srcObject;
        if (currentStream.getTracks) {
          currentStream.getTracks().forEach((track) => track.stop());
        }
        videoRef.current.srcObject = null;
      } else if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.warn("Error stopping camera stream:", e);
    }
  };

  const verifyFace = async () => {
    setShowCamera(true);
    let stream = null;

    try {
      stream = await setupCamera();

      const detection = await detectFace();
      if (!detection) {
        return { success: false, error: "Face not detected" };
      }

      const descriptors = await fetchDescriptors();

      if (!Array.isArray(descriptors) || descriptors.length === 0) {
        return {
          success: false,
          error: "No registered face data found for this employee.",
        };
      }

      const isMatched = matchFace(detection.descriptor, descriptors);

      if (!isMatched) {
        return { success: false, error: "Face not matched" };
      }

      return { success: true };
    } catch (err) {
      console.error("verifyFace error:", err);
      return {
        success: false,
        error: err?.response?.data?.message || err?.message || "Face verification error",
      };
    } finally {
      cleanupCamera(stream);
      setShowCamera(false);
    }
  };

  const showErrorPopup = (message) => {
    setErrorPopup(message);
  };

  const handlePunch = async () => {
    setErrorPopup(""); // Clear previous error

    if (!employeeId) {
      showErrorPopup("Session expired. Please login again.");
      return;
    }

    setLoading(true);

    try {
      const hasCamera = await isCameraAvailable();
      let faceResult = { success: true };

      if (hasCamera) {
        faceResult = await verifyFace();
      }

      if (!faceResult.success) {
        showErrorPopup(faceResult.error || "Face verification failed");
        return;
      }

      const loc = await getLocationAndDevice();

      // Allow punch even if location retrieval fails (for WFH cases)
      const url = isPunchedIn
        ? `${BACKEND_URL}/attendance/punch-out`
        : `${BACKEND_URL}/attendance/punch-in`;

      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...buildHeaders(),
        },
        body: JSON.stringify({
          employeeId,
          device: loc?.device || "Desktop/Mobile",
          location: loc?.location || "WFH / Remote",
          latitude: loc?.latitude || null,
          longitude: loc?.longitude || null,
          punchMode: "Manual",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // If backend says no office assigned, still allow for WFH
        if (result.message?.toLowerCase().includes("no office location")) {
          // Proceed anyway
        } else {
          throw new Error(result?.message || "Punch failed");
        }
      }

      if (result?.lateLogin) {
        setLateLoginPopup(result?.message || "Late login recorded");
      }

      await fetchLatestPunchData();
    } catch (err) {
      console.error("handlePunch error:", err);
      showErrorPopup(
        err?.message || "Something went wrong while processing attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="emp-dash-cards">
        {showCamera && (
          <div className="camera-popup">
            <h3 className="camera-title">Face Verification</h3>
            <video ref={videoRef} autoPlay muted className="camera-video" />
            <p className="camera-status">Verifying face, please wait...</p>
          </div>
        )}

        {/* Late Login Popup */}
        {lateLoginPopup && (
          <div className="late-login-popup-overlay">
            <div className="late-login-popup">
              <p>{lateLoginPopup}</p>
              <button
                type="button"
                onClick={() => setLateLoginPopup("")}
                className="late-login-prompt-button"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Error Popup */}
        {errorPopup && (
          <div className="late-login-popup-overlay">
            <div className="late-login-popup error-popup">
              <p>{errorPopup}</p>
              <button
                type="button"
                onClick={() => setErrorPopup("")}
                className="late-login-prompt-button"
              >
                OK
              </button>
            </div>
          </div>
        )}

        <button
          className={`emp-card emp-punch-in ${
            isPunchedIn ? "emp-punched-out" : ""
          }`}
          onClick={handlePunch}
          disabled={loading}
        >
          <div className="emp-card-content">
            <FaFingerprint className="emp-icon" />
            <div>
              <span className="emp-text">
                {loading
                  ? "Verifying..."
                  : isPunchedIn
                    ? "Punch Out"
                    : "Punch In"}
              </span>
            </div>
          </div>
        </button>

        <div className="emp-card">
          <div className="emp-card-content">
            <FaRegClock className="emp-icon" />
            <div>
              <span className="emp-text">{punchData.time}</span>
              <span className="emp-label">Time</span>
            </div>
          </div>
        </div>

        <div className="emp-card">
          <div className="emp-card-content">
            <FaMapMarkerAlt className="emp-icon" />
            <div>
              <span className="emp-text">{punchData.location}</span>
              <span className="emp-label">Location</span>
            </div>
          </div>
        </div>

        <div className="emp-card">
          <div className="emp-card-content">
            {punchData.device === "Mobile" ? (
              <FaMobileAlt className="emp-icon" />
            ) : (
              <FaDesktop className="emp-icon" />
            )}
            <div>
              <span className="emp-text">{punchData.device}</span>
              <span className="emp-label">Device</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}