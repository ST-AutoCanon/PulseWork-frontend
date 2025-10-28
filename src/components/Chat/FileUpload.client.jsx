"use client";

import React, { useRef } from "react";
import axios from "axios";
import { FaPaperclip } from "react-icons/fa";
import "./FileUpload.css";

export default function FileUpload({
  onSelect,
  onUpload,
  employeeId,
  orgId,
  children,
}) {
  const inp = useRef();
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const headers = {
    "x-api-key": API_KEY,
    "x-employee-id": employeeId || "",
    "x-org-id": orgId,
  };

  const pick = () => inp.current && inp.current.click();

  const change = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // If caller wants the File object and will handle upload
    if (typeof onSelect === "function") {
      onSelect(file);
      // reset input so same file can be selected again later if needed
      e.target.value = "";
      return;
    }

    // Fallback: original behavior -> upload immediately and call onUpload(url)
    if (typeof onUpload === "function") {
      const fd = new FormData();
      fd.append("file", file);
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
      } finally {
        e.target.value = "";
      }
    }
  };

  return (
    <>
      {/* support render-prop children: children is a function that receives open() */}
      {typeof children === "function" ? (
        children(pick)
      ) : (
        <button className="icon-btn" onClick={pick}>
          <FaPaperclip />
        </button>
      )}
      <input
        ref={inp}
        type="file"
        onChange={change}
        style={{ display: "none" }}
      />
    </>
  );
}
