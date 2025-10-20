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

/**
 * Parse a server timestamp into a local-friendly string.
 *
 * Rules:
 * - If timestamp contains explicit timezone info (Z or ±HH:MM) => parse as-is.
 * - If it's a numeric epoch (10s or 13s) => treat as seconds/ms epoch.
 * - If it's a date/time with no timezone (e.g. "2025-10-18 07:00:00" or "2025-10-18T07:00:00")
 *   treat it as LOCAL time (do NOT append "Z").
 * - Fallback: try a few parse attempts and return "NA" if parse fails.
 */
const parseServerTimestampToLocalString = (ts) => {
  if (!ts && ts !== 0) return "NA";
  const s = String(ts).trim();

  // Numeric epoch? (10-digit seconds or 13-digit ms)
  if (/^\d{10}$/.test(s) || /^\d{13}$/.test(s)) {
    const n = s.length === 10 ? Number(s) * 1000 : Number(s);
    const d = new Date(n);
    if (!isNaN(d.getTime())) return d.toLocaleString();
    return "NA";
  }

  // If string already contains timezone (Z or +HH:MM / -HH:MM) -> parse as-is
  if (/\d{4}-\d{2}-\d{2}T.*(Z|[+\-]\d{2}:\d{2})$/i.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? "NA" : d.toLocaleString();
  }

  // Likely "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS" without timezone
  // Treat it as LOCAL time (do NOT append 'Z').
  // Replace space with 'T' to make it ISO-like for Date parsing on most engines.
  let localIso = s.replace(" ", "T");

  // Some browsers require seconds fraction or timezone; but many accept YYYY-MM-DDTHH:MM:SS as LOCAL.
  let dLocal = new Date(localIso);
  if (!isNaN(dLocal.getTime())) return dLocal.toLocaleString();

  // Last resort: try parsing original string directly
  const dFallback = new Date(s);
  if (!isNaN(dFallback.getTime())) return dFallback.toLocaleString();

  // As absolute last resort (if server truly sent UTC but without TZ) we try appended Z,
  // but this will convert from UTC -> local; keep as fallback only.
  const dUtcGuess = new Date(localIso + "Z");
  if (!isNaN(dUtcGuess.getTime())) return dUtcGuess.toLocaleString();

  return "NA";
};

export default function EmpDashCards() {
  const { user } = useAuth();
  const employeeId = user?.employeeId ?? user?.employee_id ?? user?.id ?? null;
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
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!employeeId) return;

    let mounted = true;
    let intervalId = null;

    const fetchPunchData = async () => {
      try {
        const headers = {};
        if (API_KEY) headers["x-api-key"] = API_KEY;
        if (employeeId) headers["x-employee-id"] = employeeId;

        const url = `${BACKEND_URL}/attendance/employee/${encodeURIComponent(
          employeeId
        )}/latest-punch`;

        const response = await axios.get(url, { headers });
        const latestPunch = response.data?.data;

        if (!mounted) return;

        if (latestPunch) {
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
              latestPunch.punchout_device || latestPunch.punchin_device || "NA",
          });
          setIsPunchedIn(latestPunch.punch_status === "Punch In");
        }
      } catch (err) {
        console.error("Error fetching punch data:", err);
      }
    };

    fetchPunchData();
    intervalId = setInterval(fetchPunchData, 10000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [employeeId, API_KEY, BACKEND_URL]);

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
          console.log("face-api models loaded");
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
    /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop";

  const getLocationAndDevice = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve({
          location: "Geolocation not supported",
          device: getDeviceType(),
        });
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18`
            );
            const data = await res.json();
            const { road, suburb, town, city, county, state, postcode } =
              data?.address || {};
            const location = [road, suburb, town, city, county, state, postcode]
              .filter(Boolean)
              .join(", ");

            resolve({
              location: location || "Unknown",
              device: getDeviceType(),
              latitude,
              longitude,
              googleMapsLink,
            });
          } catch (err) {
            console.error("Reverse geocoding failed", err);
            resolve({
              location: "Unknown",
              device: getDeviceType(),
              latitude,
              longitude,
              googleMapsLink,
            });
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          resolve({
            location: "Unable to retrieve location",
            device: getDeviceType(),
          });
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
      );
    });

  const isCameraAvailable = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((d) => d.kind === "videoinput");
    } catch (err) {
      console.error("Camera check failed", err);
      return false;
    }
  };

  const verifyFace = async () => {
    setShowCamera(true);
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      await new Promise((r) => setTimeout(r, 1500));

      let detection = null;
      for (let i = 0; i < 10 && !detection; i++) {
        detection = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (!detection) await new Promise((r) => setTimeout(r, 800));
      }

      if (!detection) return { success: false, error: "Face not detected" };

      const headers = {};
      if (API_KEY) headers["x-api-key"] = API_KEY;
      if (employeeId) headers["x-employee-id"] = employeeId;

      const resp = await axios.get(
        `${BACKEND_URL}/api/face-data/${encodeURIComponent(employeeId)}`,
        { headers }
      );

      const descriptors =
        resp?.data?.descriptors ?? resp?.data?.data?.descriptors ?? [];

      for (const desc of descriptors) {
        let parsed;
        if (typeof desc === "string") {
          try {
            parsed = JSON.parse(desc);
          } catch {
            parsed = desc.split(",").map(Number);
          }
        } else if (Array.isArray(desc)) {
          parsed = desc;
        } else if (desc && typeof desc === "object") {
          parsed = Object.values(desc).map(Number);
        } else {
          parsed = [];
        }

        if (!parsed || parsed.length === 0) continue;

        const distance = faceapi.euclideanDistance(
          detection.descriptor,
          new Float32Array(parsed)
        );
        if (distance < 0.4) {
          return { success: true };
        }
      }

      return { success: false, error: "Face not matched" };
    } catch (err) {
      console.error("verifyFace error:", err);
      return {
        success: false,
        error: err?.message || "Face verification error",
      };
    } finally {
      try {
        if (videoRef.current?.srcObject) {
          const s = videoRef.current.srcObject;
          if (s.getTracks) {
            s.getTracks().forEach((t) => t.stop());
          }
          videoRef.current.srcObject = null;
        } else if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch (e) {
        console.warn("Error stopping camera stream:", e);
      }
      setShowCamera(false);
    }
  };

  const handlePunch = async () => {
    setErrorMessage("");
    if (!employeeId || !API_KEY) {
      setErrorMessage("Session expired. Please login again.");
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
        setErrorMessage(faceResult.error || "Face verification failed");
        setLoading(false);
        return;
      }

      const loc = await getLocationAndDevice();
      if (!loc || !loc.device) {
        setErrorMessage("Could not retrieve device/location information.");
        setLoading(false);
        return;
      }

      const url = isPunchedIn
        ? `${BACKEND_URL}/attendance/punch-out`
        : `${BACKEND_URL}/attendance/punch-in`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "x-employee-id": employeeId,
        },
        body: JSON.stringify({
          employeeId,
          device: loc.device,
          location: loc.location,
          punchMode: "Manual",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Punch failed");
      }

      setIsPunchedIn(!isPunchedIn);
      setTimeout(() => {
        (async () => {
          try {
            const headers = {};
            if (API_KEY) headers["x-api-key"] = API_KEY;
            if (employeeId) headers["x-employee-id"] = employeeId;
            const resp = await axios.get(
              `${BACKEND_URL}/attendance/employee/${encodeURIComponent(
                employeeId
              )}/latest-punch`,
              { headers }
            );
            const latestPunch = resp.data?.data;
            if (latestPunch) {
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
            }
          } catch (e) {
            console.warn("refresh punch after action failed", e);
          }
        })();
      }, 800);
    } catch (err) {
      console.error("handlePunch error:", err);
      setErrorMessage(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emp-dash-cards">
      {showCamera && (
        <div className="camera-popup">
          <h3 className="camera-title">Face Verification</h3>
          <video ref={videoRef} autoPlay muted className="camera-video" />
          <p className="camera-status">Verifying face, please wait...</p>
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

      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </div>
  );
}
