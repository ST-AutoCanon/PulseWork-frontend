"use client";

import React, { useRef } from "react";
import axios from "axios";
import { FaPaperclip } from "react-icons/fa";
import "./FileUpload.css";

export default function FileUpload({ onUpload, employeeId, orgId }) {
  const inp = useRef();
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY; // Next.js convention
  const headers = {
    "x-api-key": API_KEY,
    "x-employee-id": employeeId || "",
    "x-org-id": orgId, // passed from useAuth or parent
  };

  const pick = () => inp.current.click();

  const change = async (e) => {
    if (!e.target.files[0]) return;
    const fd = new FormData();
    fd.append("file", e.target.files[0]);
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/ChatUploads`,
        fd,
        { headers }
      );
      onUpload(data.url);
    } catch (err) {
      console.error("File upload failed", err);
      alert("Failed to upload file");
    }
  };

  return (
    <>
      <button className="icon-btn" onClick={pick}>
        <FaPaperclip />
      </button>
      <input
        ref={inp}
        type="file"
        onChange={change}
        style={{ display: "none" }}
      />
    </>
  );
}
